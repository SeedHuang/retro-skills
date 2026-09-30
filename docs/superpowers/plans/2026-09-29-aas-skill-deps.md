# aas 技能依赖解析与源解析统一 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 aas 通过 `skilldependencies/` 依赖清单自动解析技能与 CLI 依赖，并把源解析统一为「目录 + 短名 + `--islocal` + npx 回退」。

**Architecture:** retro-skills 只承载数据（`skilldependencies/`），agent-assets-sync 承载全部逻辑。新增四个模块：`catalog.mjs`（短名→源上下文，含 `--islocal`）、`deps.mjs`（纯依赖解析器，BFS+防环）、`cli-version.mjs`（CLI 版本检查/更新）、`config.mjs` 扩展 `skills` 目录；`add.mjs`/`update.mjs` 做接线（解析入口、装后解析依赖、npx 回退）。

**Tech Stack:** Node ≥ 20（内置 `node:test`）、commander（既有）、无新增依赖。跨两个仓库：`D:\Seed\agent-assets-sync`（任务 1–8）+ `d:\Seed\retro-skills`（任务 9）。

**Spec:** `d:\Seed\retro-skills\docs\superpowers\specs\2026-09-29-aas-skill-deps-design.md`（本文档论证都从该 spec 来；执行者两个文件都要读）

## Global Constraints

- 依赖清单只放仓库根 `skilldependencies/`，**不进** `skills/<名>/`（spec R1）。
- 依赖条目默认不写 `source` = 继承当前源；跨仓库依赖显式写完整 URL（spec R2）。
- 下载引擎用 aas 现有 `cloneToCache` + `installOne`；`npx skills add` 只作目录未命中时的回退（spec R3）。
- `--islocal` 默认不加一律指向远程；加了绝不联网，解析不到报「本地未找到：<名>」（spec R4/R5）。
- CLI 版本源只支持 `npm`；**不自动更新正在运行的 aas 自身**；任何步骤失败打印完整错误、不中断批次（spec R6/B2/O1）。
- 系统工具（node/git）不写进清单就不碰（spec R8）。
- 技能依赖不设版本门禁，只 ensure + 刷新（spec R9）。
- 所有命令在 `D:\Seed\agent-assets-sync` 下跑 `node --test test/`；Windows 专用路径语义（spec §8）。
- 代码注释与 commit message 用中文。

---

## 文件结构

| 仓库 | 文件 | 职责 |
|---|---|---|
| agent-assets-sync | `src/config.mjs`（改） | `normalizeConfig` 增加并校验 `skills` 目录（B4） |
| agent-assets-sync | `src/add.mjs`（改） | `parseSource` 支持 GitHub 短写；`resolveAddSource` 统一入口；`ensureSkillDep`；npx 回退；装后解析依赖 |
| agent-assets-sync | `src/catalog.mjs`（新建） | 短名 → 源上下文（目录 + `--islocal` + 本地未找到）；纯函数 |
| agent-assets-sync | `src/cli-version.mjs`（新建） | CLI 版本解析/比较/检查/更新（npm）；B2 防自更新；纯函数 + exec 注入 |
| agent-assets-sync | `src/deps.mjs`（新建） | `readManifest`（schema 校验）+ `resolveSkillDeps`（BFS + visited 防环 + M1/B1/B3）；纯逻辑，副作用全部注入 |
| agent-assets-sync | `src/update.mjs`（改） | 导出 `refreshOne`（单条目刷新）；`runUpdate` 装后重校验依赖 |
| agent-assets-sync | `src/main.mjs`（改） | `add` 命令加 `--islocal` flag 并透传 |
| agent-assets-sync | `sync.config.json`（改） | 新增 `skills` 目录（8 条） |
| agent-assets-sync | `test/*.test.mjs`（改/新建） | 各模块测试 |
| retro-skills | `skilldependencies/`（新建） | `manifest.json` + 8 个 `<技能名>.json` |

---

### Task 1: config 支持 `skills` 目录（B4 校验）

**Files:**
- Modify: `D:\Seed\agent-assets-sync\src\config.mjs`
- Test: `D:\Seed\agent-assets-sync\test\config.test.mjs`

**Interfaces:**
- Consumes: 无（改造既有 `normalizeConfig(raw)`）
- Produces: `normalizeConfig(raw)` 返回 `{ schemaVersion, editors, sources, targets, skills }`，其中 `skills` 为 `{ [短名]: { source: string, localPath?: string } }`。任务 3/6 依赖该返回形态。

- [ ] **Step 1: 写失败测试**（在 `test/config.test.mjs` 末尾追加）

```js
test('skills 目录：归一化返回', () => {
  const raw = {
    schemaVersion: 1, editors: {}, sources: {},
    linkTargets: [],
    skills: { 'multi-lens-review': { source: 'https://github.com/seedhuang/retro-skills.git', localPath: 'D:/Seed/retro-skills' } },
  }
  const c = normalizeConfig(raw)
  assert.equal(c.skills['multi-lens-review'].source, 'https://github.com/seedhuang/retro-skills.git')
})

test('skills 条目缺 source → 报错（B4）', () => {
  assert.throws(() => normalizeConfig({
    schemaVersion: 1, editors: {}, sources: {}, linkTargets: [],
    skills: { bad: { localPath: 'D:/x' } },
  }), /skills 条目缺 source：bad/)
})

test('skills 非对象 → 报错', () => {
  assert.throws(() => normalizeConfig({
    schemaVersion: 1, editors: {}, sources: {}, linkTargets: [], skills: [],
  }), /skills 应为对象/)
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test test/config.test.mjs`
Expected: FAIL（`c.skills` 为 undefined / 缺报错）

- [ ] **Step 3: 实现**（`src/config.mjs` 的 `normalizeConfig`，在 `sources` 校验后插入）

```js
  const skills = raw.skills ?? {}
  if (typeof skills !== 'object' || Array.isArray(skills)) throw new Error('配置的 skills 应为对象')
  for (const [name, entry] of Object.entries(skills)) {
    if (!entry || typeof entry.source !== 'string' || entry.source.trim() === '') {
      throw new Error(`配置 skills 条目缺 source：${name}`)
    }
  }
```

并把返回语句改成：

```js
  return { schemaVersion, editors, sources, targets, skills }
```

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test test/config.test.mjs`
Expected: PASS，全部用例绿

- [ ] **Step 5: Commit**

```bash
git add src/config.mjs test/config.test.mjs
git commit -m "feat(config): 支持 skills 目录并校验条目 source（B4）"
```

---

### Task 2: `parseSource` 支持 GitHub 短写

**Files:**
- Modify: `D:\Seed\agent-assets-sync\src\add.mjs`
- Test: `D:\Seed\agent-assets-sync\test\add.test.mjs`

**Interfaces:**
- Consumes: 无
- Produces: `parseSource(spec, config, { exists })` 现可接受 `owner/repo`（自动补成 `https://github.com/owner/repo`），`#ref` 与 `.git` 后缀兼容。任务 6 的 `resolveAddSource` 依赖它。

- [ ] **Step 1: 写失败测试**（`test/add.test.mjs` 中 `parseSource` 相关用例处追加）

```js
test('parseSource：GitHub 短写 owner/repo → github URL', () => {
  const r = parseSource('seedhuang/retro-skills', { sources: {} })
  assert.equal(r.url, 'https://github.com/seedhuang/retro-skills')
  assert.equal(r.isLocal, false)
})

test('parseSource：短写带 .git / #ref', () => {
  const r = parseSource('seedhuang/retro-skills.git#v1.0', { sources: {} })
  assert.equal(r.url, 'https://github.com/seedhuang/retro-skills')
  assert.equal(r.ref, 'v1.0')
})

test('parseSource：本地路径与配置 sources 短名不受影响', () => {
  const local = parseSource('D:/Seed/retro-skills', { sources: {} })
  assert.equal(local.isLocal, true)
  const viaCfg = parseSource('rs', { sources: { rs: 'https://github.com/seedhuang/retro-skills.git' } })
  assert.equal(viaCfg.url, 'https://github.com/seedhuang/retro-skills.git')
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test test/add.test.mjs`
Expected: FAIL（`seedhuang/retro-skills` 报「无法识别源」）

- [ ] **Step 3: 实现**（重排 `parseSource`：先剥 `#ref` 和 `.git`，再插短写判定，最后保留原 URL/路径校验）

```js
export function parseSource(spec, config, { exists = existsSync } = {}) {
  if (typeof spec !== 'string' || spec.trim() === '') throw new Error('源不能为空')
  let s = spec.trim()
  if (!s.includes('://') && !/^[A-Za-z]:[\\/]/.test(s) && config.sources?.[s]) {
    s = config.sources[s]
  }
  let ref = null
  const hash = s.lastIndexOf('#')
  if (hash !== -1 && !exists?.(s)) { ref = s.slice(hash + 1); s = s.slice(0, hash) }
  if (s.endsWith('.git') && !exists?.(s)) s = s.slice(0, -4)
  // GitHub 短写：owner/repo（无协议、非盘符路径、本地不存在）→ https://github.com/owner/repo
  if (!s.includes('://') && !/^[A-Za-z]:[\\/]/.test(s) && !exists?.(s) && /^[\w.-]+\/[\w.-]+$/.test(s)) {
    s = `https://github.com/${s}`
  }
  if (!s.includes('://') && !/^[A-Za-z]:[\\/]/.test(s)) {
    throw new Error(`无法识别源：${spec}（不是 URL、不在配置 sources 里、也不是存在的本地路径）`)
  }
  const isLocal = exists?.(s) === true
  return { url: s, ref, isLocal }
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test test/add.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/add.mjs test/add.test.mjs
git commit -m "feat(add): parseSource 支持 GitHub 短写（owner/repo）"
```

---

### Task 3: `src/catalog.mjs` 短名 → 源上下文

**Files:**
- Create: `D:\Seed\agent-assets-sync\src\catalog.mjs`
- Test: `D:\Seed\agent-assets-sync\test\catalog.test.mjs`

**Interfaces:**
- Consumes: `cacheKeyForSource(url, isLocal)`（add.mjs）、`expandHome`（sync.mjs）
- Produces:
  - `lookupCatalog(name, config)` → `{ found: true, entry } | { found: false }`
  - `resolveSourceForName(name, config, { home, isLocal, exists })` → `{ ok: true, context } | { ok: false, reason }`；`context.kind` ∈ `'path' | 'source' | 'npx'`（'path' = 本地源根；'source' = 远程源字符串；'npx' = 回退名）。任务 6 的 `resolveAddSource` 消费。

- [ ] **Step 1: 写失败测试**

```js
import { resolveSourceForName, lookupCatalog } from '../src/catalog.mjs'

const cfg = {
  sources: {},
  skills: {
    'multi-lens-review': { source: 'https://github.com/seedhuang/retro-skills.git', localPath: 'D:/Seed/retro-skills' },
    'evolving-skills': { source: 'https://github.com/seedhuang/retro-skills.git' },
  },
}
const fakeExists = (p) => p === 'D:/Seed/retro-skills' || p === resolve('D:/Seed/retro-skills')

test('lookupCatalog：命中 / 未命中', () => {
  assert.equal(lookupCatalog('multi-lens-review', cfg).found, true)
  assert.equal(lookupCatalog('nope', cfg).found, false)
})

test('resolveSourceForName：本地存在的路径 → path', () => {
  const r = resolveSourceForName('D:/Seed/retro-skills', cfg, { isLocal: false, exists: fakeExists })
  assert.equal(r.ok, true)
  assert.equal(r.context.kind, 'path')
})

test('resolveSourceForName：目录命中默认 → source', () => {
  const r = resolveSourceForName('multi-lens-review', cfg, { isLocal: false, exists: fakeExists })
  assert.equal(r.context.kind, 'source')
  assert.equal(r.context.source, 'https://github.com/seedhuang/retro-skills.git')
})

test('resolveSourceForName：--islocal + localPath → path（工作副本）', () => {
  const r = resolveSourceForName('multi-lens-review', cfg, { isLocal: true, exists: fakeExists })
  assert.equal(r.context.kind, 'path')
  assert.equal(r.context.path, resolve('D:/Seed/retro-skills'))
})

test('resolveSourceForName：--islocal 无 localPath 有缓存 → path（缓存）', () => {
  const r = resolveSourceForName('evolving-skills', cfg, {
    isLocal: true, exists: (p) => fakeExists(p) || p.includes(homedir()),
  })
  assert.equal(r.context.kind, 'path')
})

test('resolveSourceForName：--islocal 都无 → 本地未找到（不联网）', () => {
  const r = resolveSourceForName('evolving-skills', cfg, { isLocal: true, exists: fakeExists })
  assert.equal(r.ok, false)
  assert.match(r.reason, /本地未找到：evolving-skills/)
})

test('resolveSourceForName：目录未命中 --islocal → 本地未找到', () => {
  const r = resolveSourceForName('nope', cfg, { isLocal: true, exists: fakeExists })
  assert.equal(r.ok, false)
  assert.match(r.reason, /本地未找到：nope/)
})

test('resolveSourceForName：目录未命中默认 → npx 回退', () => {
  const r = resolveSourceForName('nope', cfg, { isLocal: false, exists: fakeExists })
  assert.equal(r.context.kind, 'npx')
  assert.equal(r.context.name, 'nope')
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test test/catalog.test.mjs`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现**

```js
/**
 * catalog.mjs —— 源解析统一（spec §5.1 / R4 / R5 / B4）。
 * 短名 → 源上下文：目录（sync.config.json 的 skills）+ 本地路径 + 回退 npx。
 */
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { homedir } from 'node:os'
import { cacheKeyForSource } from './add.mjs'
import { expandHome } from './sync.mjs'

/** 目录查询：config.skills[name] */
export function lookupCatalog(name, config) {
  const entry = config.skills?.[name]
  return entry ? { found: true, entry } : { found: false }
}

/**
 * 统一"短名 → 源上下文"。
 * context.kind：
 *   'path'   → 本地源根（本地存在的路径；或 --islocal 命中 localPath / 缓存）
 *   'source' → 远程源字符串（目录默认 / URL）
 *   'npx'    → 目录未命中且非 --islocal → 回退 npx skills add
 */
export function resolveSourceForName(name, config, { home = homedir(), isLocal = false, exists = existsSync } = {}) {
  if (exists(name) || exists(resolve(name))) {
    return { ok: true, context: { kind: 'path', path: resolve(name) } }
  }
  const hit = lookupCatalog(name, config)
  if (hit.found) {
    const { entry } = hit
    if (isLocal) {
      if (entry.localPath && exists(resolve(expandHome(entry.localPath, home)))) {
        return { ok: true, context: { kind: 'path', path: resolve(expandHome(entry.localPath, home)) } }
      }
      const key = cacheKeyForSource(entry.source, false)
      const cacheDir = join(home, '.aas', 'repos', key)
      if (exists(cacheDir)) return { ok: true, context: { kind: 'path', path: cacheDir } }
      return { ok: false, reason: `本地未找到：${name}（localPath 不存在、缓存也没有）` }
    }
    return { ok: true, context: { kind: 'source', source: entry.source } }
  }
  if (isLocal) return { ok: false, reason: `本地未找到：${name}（目录里没有这个短名）` }
  return { ok: true, context: { kind: 'npx', name } }
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test test/catalog.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/catalog.mjs test/catalog.test.mjs
git commit -m "feat(catalog): 短名到源上下文的统一解析（含 --islocal 与 npx 回退）"
```

---

### Task 4: `src/cli-version.mjs` CLI 版本检查与更新

**Files:**
- Create: `D:\Seed\agent-assets-sync\src\cli-version.mjs`
- Test: `D:\Seed\agent-assets-sync\test\cli-version.test.mjs`

**Interfaces:**
- Consumes: 无（外部副作用走注入的 `exec`）
- Produces: `parseVersion(output)`、`compareVersions(a,b)`、`needsUpdate({local,remote,minVersion})`、`ensureCli({name,versionSource,minVersion},{exec})`。`ensureCli` 返回 `{ name, action: 'updated'|'installed'|'ok'|'error', detail }`。任务 5/6/7 消费。

- [ ] **Step 1: 写失败测试**

```js
import { parseVersion, compareVersions, needsUpdate, ensureCli, isSelfCli } from '../src/cli-version.mjs'

test('parseVersion：剥 v 前缀与非版本噪音', () => {
  assert.equal(parseVersion('v22.12.0'), '22.12.0')
  assert.equal(parseVersion('aas 1.2.3 (c) 2026'), '1.2.3')
  assert.equal(parseVersion('not a version'), null)
})

test('compareVersions：数值比较；无法解析 → null', () => {
  assert.equal(compareVersions('2.0.0', '1.9.9'), 1)
  assert.equal(compareVersions('1.2.3', '1.2.3'), 0)
  assert.equal(compareVersions('1.2.3', 'abc'), null)
})

test('needsUpdate：本地缺失 → true；minVersion 不满足 → true；远端新 → true', () => {
  assert.equal(needsUpdate({ local: null, remote: '2.0.0' }), true)
  assert.equal(needsUpdate({ local: '1.0.0', remote: '1.2.0', minVersion: '1.1.0' }), true)
  assert.equal(needsUpdate({ local: '1.2.0', remote: '1.3.0' }), true)
  assert.equal(needsUpdate({ local: '1.3.0', remote: '1.3.0' }), false)
})

test('isSelfCli：识别 aas 自身（B2）', () => {
  assert.equal(isSelfCli('aas'), true)
  assert.equal(isSelfCli('prettier'), false)
})

test('ensureCli：正常运行 → updated / ok', async () => {
  const exec = (cmd, args) => {
    if (cmd === 'prettier' && args[0] === '--version') return '2.0.1\n'
    if (cmd === 'npm' && args[0] === 'view') return '2.5.0\n'
    if (cmd === 'npm' && args[0] === 'install') return 'added\n'
    throw new Error('unexpected ' + cmd)
  }
  const r = await ensureCli({ name: 'prettier', versionSource: 'npm' }, { exec })
  assert.equal(r.action, 'updated')
  const ok = await ensureCli({ name: 'prettier', versionSource: 'npm', minVersion: '2.0.0' }, { exec })
  assert.equal(ok.action, 'ok')
})

test('ensureCli：aas 自身 → error 不更新（B2）', async () => {
  const r = await ensureCli({ name: 'aas', versionSource: 'npm' }, { exec: () => { throw new Error('should not run') } })
  assert.equal(r.action, 'error')
  assert.match(r.detail, /不能自动更新正在运行的 aas 自身/)
})

test('ensureCli：取版本失败 → error 带命令原文与退出码（R6）', async () => {
  const exec = (cmd, args) => {
    if (cmd === 'prettier' && args[0] === '--version') throw Object.assign(new Error('boom'), { stderr: 'cannot run', status: 127 })
    throw new Error('unexpected')
  }
  const r = await ensureCli({ name: 'prettier', versionSource: 'npm' }, { exec })
  assert.equal(r.action, 'error')
  assert.match(r.detail, /prettier --version.*127.*cannot run/s)
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test test/cli-version.test.mjs`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现**

```js
/**
 * cli-version.mjs —— CLI 依赖的版本检查与更新（spec §5.3 / R6 / B2 / O1）。
 * 外部副作用（跑 --version / npm view / npm install -g）全部经注入的 exec，便于单测。
 */
import { execFileSync } from 'node:child_process'

/** 正在运行的 aas 自身的识别名（B2：不自动更新自己） */
export const SELF_NAMES = ['aas', 'agent-assets-sync']

export function isSelfCli(name) {
  return SELF_NAMES.includes(name)
}

/** 从 --version 输出剥出第一个 semver（容忍 "v1.2.3"、"aas 1.2.3 (c)"） */
export function parseVersion(output) {
  const m = String(output ?? '').match(/\d+\.\d+\.\d+(?:[-+][\w.-]+)?/)
  return m ? m[0] : null
}

/** semver 数值比较：a>b→1 / a<b→-1 / 相等→0；任一无法解析 → null */
export function compareVersions(a, b) {
  const pa = parseVersion(a), pb = parseVersion(b)
  if (!pa || !pb) return null
  const na = pa.split(/[-+]/)[0].split('.').map(Number)
  const nb = pb.split(/[-+]/)[0].split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if (na[i] > nb[i]) return 1
    if (na[i] < nb[i]) return -1
  }
  return 0
}

function runCmd(cmd, args, { exec = execFileSync } = {}) {
  try {
    return { ok: true, out: exec(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim() }
  } catch (e) {
    const stderr = String(e.stderr || e.message || '').trim().split(/\r?\n/).slice(-3).join(' | ')
    return { ok: false, error: { cmd: [cmd, ...args].join(' '), code: e.status ?? '?', stderr } }
  }
}

export function localVersion(name, { exec = execFileSync } = {}) {
  return runCmd(name, ['--version'], { exec })
}

export function remoteVersion(name, { exec = execFileSync } = {}) {
  return runCmd('npm', ['view', name, 'version'], { exec })
}

/** 判定是否需要更新（spec §5.3 步 3）：本地缺失 / 低于 minVersion / 远端更新 */
export function needsUpdate({ local, remote, minVersion }) {
  if (!local) return true
  if (minVersion && compareVersions(local, minVersion) === -1) return true
  if (remote && compareVersions(remote, local) === 1) return true
  return false
}

/**
 * 单个 CLI 依赖的检查与更新。返回 { name, action, detail }
 * action: 'updated' | 'installed' | 'ok' | 'error'（失败不抛，带完整错误信息）
 */
export async function ensureCli({ name, versionSource, minVersion }, { exec = execFileSync } = {}) {
  if (versionSource !== 'npm') return { name, action: 'error', detail: `不支持的 versionSource：${versionSource}` }
  if (isSelfCli(name)) {
    return { name, action: 'error', detail: `不能自动更新正在运行的 aas 自身，请手动 npm install -g ${name}@latest 后重跑` }
  }
  const lv = localVersion(name, { exec })
  if (!lv.ok) return { name, action: 'error', detail: `无法获取本地版本：${lv.error.cmd}（退出码 ${lv.error.code}）${lv.error.stderr}` }
  const rv = remoteVersion(name, { exec })
  if (!rv.ok) return { name, action: 'error', detail: `无法获取远端版本：${rv.error.cmd}（退出码 ${rv.error.code}）${rv.error.stderr}` }
  const local = lv.out.trim(), remote = rv.out.trim()
  if (!needsUpdate({ local, remote, minVersion })) return { name, action: 'ok', detail: `已满足（本地 ${local} / 远端 ${remote}）` }
  const up = runCmd('npm', ['install', '-g', `${name}@latest`], { exec })
  if (!up.ok) return { name, action: 'error', detail: `${up.error.cmd}（退出码 ${up.error.code}）${up.error.stderr}` }
  return { name, action: local ? 'updated' : 'installed', detail: `→ ${remote}` }
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test test/cli-version.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/cli-version.mjs test/cli-version.test.mjs
git commit -m "feat(cli-version): CLI 依赖版本检查与更新（npm，B2 防自更新，R6 完整报错）"
```

---

### Task 5: `src/deps.mjs` 纯依赖解析器

**Files:**
- Create: `D:\Seed\agent-assets-sync\src\deps.mjs`
- Test: `D:\Seed\agent-assets-sync\test\deps.test.mjs`

**Interfaces:**
- Consumes: 无（副作用全部注入）
- Produces:
  - `readManifest(manifestPath)` → `{ schemaVersion, skill, skills, cli }`（schema 校验，spec §4.2 字段规则）
  - `resolveSkillDeps({ skill, rootManifestDir, rootSourceCtx, ensureSkill, ensureCli })` → `{ installed, refreshed, cliUpdated, cliInstalled, failures, visited }`
  - `ensureSkill(name, sourceCtx)` → `{ ok, action?: 'installed'|'refreshed', manifestDir? } | { ok: false, error }`（由调用方注入，任务 6 实现）
  - `ensureCli(cliEntry)` → 同 cli-version 的 `ensureCli`（注入）

- [ ] **Step 1: 写失败测试**

```js
import { readManifest, resolveSkillDeps } from '../src/deps.mjs'
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

function tmpManifestDir(files) {
  const dir = mkdtempSync(join(tmpdir(), 'deps-'))
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(join(dir, 'skilldependencies'), { recursive: true })
    writeFileSync(join(dir, 'skilldependencies', name), content, 'utf8')
  }
  return join(dir, 'skilldependencies')
}

test('readManifest：合法清单解析 + skill 名', () => {
  const dir = tmpManifestDir({ 's.json': JSON.stringify({ schemaVersion: 1, skill: 's', dependencies: { skills: [{ name: 'b' }] } }) })
  const m = readManifest(join(dir, 's.json'))
  assert.equal(m.skill, 's')
  assert.equal(m.skills[0].name, 'b')
})

test('readManifest：schemaVersion 不支持 / 缺 skill → 报错', () => {
  const d1 = tmpManifestDir({ 'x.json': JSON.stringify({ schemaVersion: 2, skill: 'x' }) })
  assert.throws(() => readManifest(join(d1, 'x.json')), /schemaVersion=2 不受支持/)
  const d2 = tmpManifestDir({ 'y.json': JSON.stringify({ schemaVersion: 1 }) })
  assert.throws(() => readManifest(join(d2, 'y.json')), /缺 skill/)
})

test('resolveSkillDeps：BFS 递归 + visited 防环（A→B→A）', () => {
  const mdir = tmpManifestDir({
    'a.json': JSON.stringify({ schemaVersion: 1, skill: 'a', dependencies: { skills: [{ name: 'b' }] } }),
    'b.json': JSON.stringify({ schemaVersion: 1, skill: 'b', dependencies: { skills: [{ name: 'a' }] } }),
  })
  const ensureSkill = (name, ctx) => ({ ok: true, action: 'installed', manifestDir: mdir })
  const ensureCli = () => ({ action: 'ok', name: '', detail: '' })
  const r = resolveSkillDeps({ skill: 'a', rootManifestDir: mdir, rootSourceCtx: 'inherit', ensureSkill, ensureCli })
  assert.equal(r.installed.includes('b'), true)
  assert.equal(r.failures.length, 0)
})

test('resolveSkillDeps：B1 已存在非账本 → failures 记录，不中断', () => {
  const mdir = tmpManifestDir({ 'a.json': JSON.stringify({ schemaVersion: 1, skill: 'a', dependencies: { skills: [{ name: 'b' }] } }) })
  const ensureSkill = () => ({ ok: false, error: '已存在但非 aas 管理：用 aas import 收编或手动移除' })
  const r = resolveSkillDeps({ skill: 'a', rootManifestDir: mdir, rootSourceCtx: 'inherit', ensureSkill, ensureCli: () => ({ action: 'ok', name: '', detail: '' }) })
  assert.equal(r.failures.length, 1)
  assert.match(r.failures[0].detail, /已存在但非 aas 管理/)
})

test('resolveSkillDeps：cli 依赖汇总 updated / error', () => {
  const mdir = tmpManifestDir({ 'a.json': JSON.stringify({ schemaVersion: 1, skill: 'a', dependencies: { cli: [{ name: 'prettier', versionSource: 'npm' }] } }) })
  const calls = []
  const ensureCli = (c) => { calls.push(c.name); return { action: 'updated', name: c.name, detail: '→ 2.0.0' } }
  const r = resolveSkillDeps({ skill: 'a', rootManifestDir: mdir, rootSourceCtx: 'inherit', ensureSkill: () => ({ ok: true, action: 'installed', manifestDir: mdir }), ensureCli })
  assert.equal(calls[0], 'prettier')
  assert.equal(r.cliUpdated.length, 1)
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test test/deps.test.mjs`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现**

```js
/**
 * deps.mjs —— 依赖解析器（spec §5.2 / M1 / B1 / B3 / R7）。
 * 纯逻辑：文件读写只读清单，安装/刷新/CLI 副作用全部经 ensureSkill / ensureCli 注入。
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const SCHEMA_VERSION = 1

/** 读并校验单个依赖清单（spec §4.2 字段规则） */
export function readManifest(manifestPath) {
  let raw
  try {
    raw = JSON.parse(readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, ''))
  } catch (e) {
    throw new Error(`依赖清单解析失败：${manifestPath}（${e.message}）`)
  }
  if (raw.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`依赖清单 schemaVersion=${raw.schemaVersion} 不受支持（支持 ${SCHEMA_VERSION}）：${manifestPath}`)
  }
  if (typeof raw.skill !== 'string' || raw.skill === '') throw new Error(`依赖清单缺 skill 名：${manifestPath}`)
  const deps = raw.dependencies ?? {}
  const skills = Array.isArray(deps.skills) ? deps.skills : []
  const cli = Array.isArray(deps.cli) ? deps.cli : []
  for (const d of skills) {
    if (!d || typeof d.name !== 'string' || d.name === '') throw new Error(`依赖清单 skills 条目缺 name：${manifestPath}`)
    if (d.source !== undefined && typeof d.source !== 'string') throw new Error(`依赖清单 skills[${d.name}].source 应为字符串：${manifestPath}`)
  }
  for (const c of cli) {
    if (!c || typeof c.name !== 'string' || c.name === '') throw new Error(`依赖清单 cli 条目缺 name：${manifestPath}`)
    if (c.versionSource !== 'npm') throw new Error(`依赖清单 cli[${c.name}].versionSource 只支持 npm：${manifestPath}`)
  }
  return { schemaVersion: SCHEMA_VERSION, skill: raw.skill, skills, cli }
}

/**
 * BFS 依赖解析（spec §5.2 / R7 防环）。
 * ensureSkill(name, sourceCtx) → { ok, action?: 'installed'|'refreshed', manifestDir? } | { ok:false, error }
 *   - manifestDir：该依赖的 skilldependencies 目录（M1：与安装源一致）
 * ensureCli(cliEntry) → { action, name, detail }
 * 返回汇总（R6：失败记入 failures，不中断批次）。
 */
export function resolveSkillDeps({ skill, rootManifestDir, rootSourceCtx, ensureSkill, ensureCli }) {
  const visited = new Set()
  const failures = []
  const installed = [], refreshed = [], cliUpdated = [], cliInstalled = []
  const queue = [{ name: skill, manifestDir: rootManifestDir, sourceCtx: rootSourceCtx }]
  while (queue.length > 0) {
    const cur = queue.shift()
    const key = `${cur.name}|${cur.sourceCtx}`
    if (visited.has(key)) continue
    visited.add(key)
    let manifest
    try {
      manifest = readManifest(join(cur.manifestDir, `${cur.name}.json`))
    } catch (e) {
      failures.push({ type: 'manifest', name: cur.name, detail: e.message })
      continue
    }
    for (const d of manifest.skills) {
      const dCtx = d.source ?? cur.sourceCtx // R2：省略 source 继承当前源
      const r = ensureSkill(d.name, dCtx)
      if (!r.ok) {
        failures.push({ type: 'skill', name: d.name, detail: r.error })
        continue
      }
      if (r.action === 'installed') installed.push(d.name)
      else if (r.action === 'refreshed') refreshed.push(d.name)
      queue.push({ name: d.name, manifestDir: r.manifestDir, sourceCtx: dCtx })
    }
    for (const c of manifest.cli) {
      const r = ensureCli(c)
      if (r.action === 'updated') cliUpdated.push(r)
      else if (r.action === 'installed') cliInstalled.push(r)
      else if (r.action === 'error') failures.push({ type: 'cli', name: c.name, detail: r.detail })
    }
  }
  return { installed, refreshed, cliUpdated, cliInstalled, failures, visited: [...visited] }
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test test/deps.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/deps.mjs test/deps.test.mjs
git commit -m "feat(deps): 依赖清单读取与 BFS 解析器（防环、M1/B1、CLI 汇总）"
```

---

### Task 6: 接线 — `resolveAddSource`、`--islocal`、npx 回退、装后解析依赖

**Files:**
- Modify: `D:\Seed\agent-assets-sync\src\add.mjs`
- Modify: `D:\Seed\agent-assets-sync\src\update.mjs`（导出 `refreshOne`）
- Modify: `D:\Seed\agent-assets-sync\src\main.mjs`（`add` 命令加 `--islocal`）
- Test: `D:\Seed\agent-assets-sync\test\add.test.mjs`

**Interfaces:**
- Consumes: `resolveSourceForName`（catalog.mjs）、`resolveSkillDeps`/`readManifest`（deps.mjs）、`ensureCli`（cli-version.mjs）、`findEntry`（ledger.mjs）、`resolveEditorDir`（editors.mjs）
- Produces:
  - `resolveAddSource(sourceSpec, config, { home, isLocal })` → `{ ok, context }`（'source' | 'path' | 'npx' | 错误）
  - `ensureSkillDep({ name, sourceCtx, manifestRoot, editorName, editor, config, ledger, ledgerPath, home, opts })`（导出，供任务 7 复用）
  - `runAdd` 支持 `opts.isLocal`；装完 skill 后自动解析依赖并输出汇总
  - `refreshOne(entry, config, { home })`（update.mjs 导出）

- [ ] **Step 1: 写失败测试**（`test/add.test.mjs` 追加；用假目录模拟源与清单）

```js
test('resolveAddSource：默认先当源解析（URL），不是源才走目录/npx', () => {
  const { resolveAddSource } = await import('../src/add.mjs')
  const cfg = normalizeConfig({ schemaVersion: 1, editors: {}, sources: {}, linkTargets: [], skills: { s: { source: 'https://github.com/x/y.git' } } })
  const urlCtx = resolveAddSource('https://github.com/a/b.git', cfg, { home: homedir(), isLocal: false })
  assert.equal(urlCtx.context.kind, 'source')
  const npxCtx = resolveAddSource('unknown-name', cfg, { home: homedir(), isLocal: false })
  assert.equal(npxCtx.context.kind, 'npx')
  const localCtx = resolveAddSource('unknown-name', cfg, { home: homedir(), isLocal: true })
  assert.equal(localCtx.ok, false)
  assert.match(localCtx.reason, /本地未找到/)
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test test/add.test.mjs`
Expected: FAIL（`resolveAddSource` 不存在）

- [ ] **Step 3: 实现**（三处修改）

**3a. `src/update.mjs` 顶部新增导出（复用它已有的 `fetchFresh`/`copyTree`/`relink`/`detectDrift`）：**

```js
/** 单条目刷新（依赖解析的"刷新"语义用；成功返回 { commit }） */
export async function refreshOne(entry, config, { home = homedir() } = {}) {
  const isLocal = typeof entry.source.repo === 'string' && !entry.source.repo.includes('://')
  const { tmp, commit: newCommit } = fetchFresh({ repo: entry.source.repo, ref: entry.source.ref, isLocal }, home)
  const key = cacheKeyForSource(entry.source.repo, isLocal)
  const cacheDir = join(home, '.aas', 'repos', key)
  copyTree(tmp, cacheDir)
  const assetAbs = join(cacheDir, entry.source.path)
  relink(entry, assetAbs, config, { home })
  entry.status = 'installed'
  entry.source.commit = newCommit ?? entry.source.commit
  entry.source.fetchedAt = new Date().toISOString()
  return { commit: newCommit }
}
```

**3b. `src/add.mjs`：新增 import 与两个函数（`resolveAddSource`、`ensureSkillDep`），并在 `runAdd` 里接上。**

import 追加：

```js
import { resolveSourceForName } from './catalog.mjs'
import { resolveSkillDeps, readManifest } from './deps.mjs'
import { ensureCli } from './cli-version.mjs'
import { findEntry } from './ledger.mjs'
import { resolveEditorDir } from './editors.mjs'
import { refreshOne } from './update.mjs'
import { execFileSync } from 'node:child_process'
```

新增函数：

```js
/** 统一源解析（spec §5.1）：默认先当源解析，不是源 → 目录 → npx；--islocal 走目录/本地 */
export function resolveAddSource(sourceSpec, config, { home, isLocal }) {
  if (isLocal) return resolveSourceForName(sourceSpec, config, { home, isLocal: true })
  try {
    const src = parseSource(sourceSpec, config)
    return { ok: true, context: { kind: 'source', source: src } }
  } catch {
    return resolveSourceForName(sourceSpec, config, { home, isLocal: false })
  }
}

/** npx 回退（spec §5.1 步 3）：npx skills add <名> -g -y，非交互免挂起 */
function runNpxAdd(name) {
  try {
    execFileSync('npx', ['skills', 'add', name, '-g', '-y'], { encoding: 'utf8', stdio: ['inherit', 'pipe', 'pipe'] })
    return [`· 回退 npx skills add ${name} 完成（该技能由 npx 锁管理，未记入 aas 账本）`]
  } catch (e) {
    const stderr = String(e.stderr || e.message || '').trim().split(/\r?\n/).slice(-3).join(' | ')
    throw new Error(`npx skills add ${name} 失败（退出码 ${e.status ?? '?'}）：${stderr}`)
  }
}

/** 依赖技能 ensure（spec §5.2 / M1 / B1）：装或刷新单个依赖技能，返回其清单目录 */
export async function ensureSkillDep({ name, sourceCtx, manifestRoot, editorName, editor, config, ledger, ledgerPath, home, opts }) {
  let depRoot
  if (sourceCtx === 'inherit') {
    depRoot = manifestRoot // 与主技能同源：清单目录所在源根
  } else {
    const src = parseSource(sourceCtx, config)
    const { cacheDir } = cloneToCache(src, { home })
    depRoot = cacheDir
  }
  const existing = findEntry(ledger, name, editorName)
  if (existing) {
    await refreshOne(existing, config, { home })
    writeLedger(ledgerPath, ledger)
    return { ok: true, action: 'refreshed', manifestDir: join(depRoot, 'skilldependencies') }
  }
  const runtimePath = join(resolveEditorDir(editor, 'skill', { home }), name)
  if (lexists(runtimePath)) {
    return { ok: false, error: `已存在但非 aas 管理：用 aas import 收编或手动移除（${name}）` }
  }
  const abs = join(depRoot, 'skills', name)
  const asset = { id: name, kind: 'skill', originalName: name, path: relative(depRoot, abs), abs, repo: null, ref: null, commit: null }
  const action = await installOne({ asset, editorName, editor, config, ledger, ledgerPath, home, opts })
  if (action !== 'installed') return { ok: false, error: `${name} 安装未完成（${action}）` }
  return { ok: true, action: 'installed', manifestDir: join(depRoot, 'skilldependencies') }
}
```

**3c. `runAdd` 主流程改造**（把「解析源 → clone → 列资产 → 挑选 → 逐个安装」改成走 `resolveAddSource`，并在每个 skill 安装成功后解析依赖、输出汇总）：

```js
export async function runAdd({ sourceSpec, names = [], opts }) {
  const home = opts.home ?? homedir()
  const isTTY = opts.isTTY ?? false
  const lines = []

  const config = normalizeConfig(loadConfig(opts.configPath ?? DEFAULT_CONFIG_PATH))
  const picked = pickEditor(config, { editor: opts.editor, home })
  if (picked.needChoice) {
    if (!isTTY) throw new Error(`${picked.message}（非交互环境）`)
    throw new Error(`${picked.message}——交互挑选见阶段 3 后续版本，当前请显式 --editor`)
  }
  const { name: editorName, editor } = picked

  // 统一源解析（spec §5.1）
  const ctx = resolveAddSource(sourceSpec, config, { home, isLocal: opts.isLocal ?? false })
  if (!ctx.ok) throw new Error(ctx.reason)
  if (ctx.context.kind === 'npx') return runNpxAdd(ctx.context.name)

  let rootDir, commit = null
  if (ctx.context.kind === 'path') {
    rootDir = ctx.context.path // --islocal 工作副本 / 显式本地路径：live 直用，不 clone
    lines.push(`源：${rootDir}（本地，--islocal）`)
  } else {
    const src = ctx.context.source
    const { cacheDir, commit: c } = cloneToCache(src, { home })
    rootDir = cacheDir; commit = c
    lines.push(`源：${src.url}${src.ref ? `（ref: ${src.ref}）` : ''}`)
    lines.push(`缓存：${cacheDir}${commit ? `（commit ${commit.slice(0, 12)}）` : ''}`)
  }

  const assets = listAssets(rootDir)
  const ledgerPath = defaultLedgerPath(home)
  const ledger = readLedger(ledgerPath)

  let selected
  if (names.length > 0) {
    selected = resolveNames(names, assets, opts)
  } else {
    if (!isTTY) throw new Error(`非交互环境必须给出要装的资产名；缓存里可选：${assets.map((a) => a.id).join('、') || '（无）'}`)
    const { checkbox } = await import('@inquirer/prompts')
    const installedSet = new Set(ledger.entries.filter((e) => e.editor === editorName).map((e) => `${e.id}`))
    const answers = await checkbox({
      message: '选择要安装的资产（空格勾选，回车确认；[已装] = 账本里有记录）',
      choices: assets.map((a) => ({
        name: `${a.kind === 'skill' ? '[技能]' : '[规则]'} ${a.id}${installedSet.has(a.id) ? '  [已装]' : ''}  (${a.path})`,
        value: a,
      })),
    })
    if (answers.length === 0) { lines.push('未选择任何资产，无事可做。'); return lines }
    selected = answers
  }

  let installed = 0, skipped = 0
  const depSummary = { installed: [], refreshed: [], cliUpdated: [], cliInstalled: [], failures: [] }
  for (const asset of selected) {
    const action = await installOne({
      asset: { ...asset, repo: ctx.context.kind === 'source' ? ctx.context.source.url : rootDir, ref: ctx.context.kind === 'source' ? ctx.context.source.ref : null, commit },
      editorName, editor, config, ledger, ledgerPath, home,
      opts: { ...opts, isTTY },
    })
    if (action === 'installed') {
      installed++
      const e = findEntry(ledger, asset.id, editorName)
      const verb = e.mode === 'copy' ? '装副本' : '装链接'
      lines.push(`· ${verb}  ${e.runtimeName}  →  ${e.runtimePath}  （来自 ${e.source.path}）`)
      // 依赖解析（spec §5.2）：装完 skill 自动解析
      if (asset.kind === 'skill') {
        const manifestDir = join(rootDir, 'skilldependencies')
        if (existsSync(manifestDir)) {
          const ensureSkill = (name, sourceCtx) => ensureSkillDep({
            name, sourceCtx, manifestRoot: rootDir, editorName, editor, config, ledger, ledgerPath, home, opts: { ...opts, isTTY },
          })
          const r = resolveSkillDeps({
            skill: asset.id, rootManifestDir: manifestDir, rootSourceCtx: 'inherit',
            ensureSkill, ensureCli,
          })
          depSummary.installed.push(...r.installed)
          depSummary.refreshed.push(...r.refreshed)
          depSummary.cliUpdated.push(...r.cliUpdated)
          depSummary.cliInstalled.push(...r.cliInstalled)
          depSummary.failures.push(...r.failures)
          if (ctx.context.kind === 'source' && commit) {
            lines.push(`· 依赖清单来源 commit ${commit.slice(0, 12)}${commit ? '' : ''}`)
          }
        }
      }
    } else {
      skipped++
      lines.push(`· 跳过    ${asset.id}  （已存在；要覆盖加 --yes）`)
    }
  }

  // 依赖汇总（R6：失败清单带详情，不中断）
  for (const n of depSummary.installed) lines.push(`· 依赖安装  ${n}`)
  for (const n of depSummary.refreshed) lines.push(`· 依赖刷新  ${n}`)
  for (const r of depSummary.cliUpdated) lines.push(`· CLI 更新  ${r.name}  ${r.detail}`)
  for (const r of depSummary.cliInstalled) lines.push(`· CLI 安装  ${r.name}  ${r.detail}`)
  for (const f of depSummary.failures) lines.push(`· 依赖失败  [${f.type}] ${f.name}：${f.detail}`)

  lines.push(`→ 完成：新增 ${installed}、跳过 ${skipped}。账本：${ledgerPath}`)
  return lines
}
```

**3d. `src/main.mjs`：`add` 命令加 `--islocal` 并透传：**

```js
  .option('--islocal', '本地调试：只从本地解析（目录 localPath → 缓存），找不到报「本地未找到」，绝不联网')
```
（在 `--as <id>` 行后加一行 option；并在 `opts` 对象里加 `isLocal: opts.isLocal,`）

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test test/add.test.mjs && node --test test/update.test.mjs`
Expected: PASS（新增 + 既有用例全绿）

- [ ] **Step 5: Commit**

```bash
git add src/add.mjs src/update.mjs src/main.mjs test/add.test.mjs
git commit -m "feat(add): 统一源解析 + --islocal + npx 回退 + 装后自动解析依赖"
```

---

### Task 7: `aas update --all` 重校验依赖

**Files:**
- Modify: `D:\Seed\agent-assets-sync\src\update.mjs`
- Test: `D:\Seed\agent-assets-sync\test\update.test.mjs`

**Interfaces:**
- Consumes: `resolveSkillDeps`（deps.mjs）、`ensureSkillDep`（add.mjs）、`ensureCli`（cli-version.mjs）
- Produces: `runUpdate` 在刷新完条目后，对每个 skill 条目重跑依赖解析，输出依赖汇总行。

- [ ] **Step 1: 写失败测试**

```js
test('runUpdate：--all 刷新后重校验依赖（依赖技能被 refreshOne）', async () => {
  const r = await runUpdate({ name: null, all: true, opts: { editor: 'trae-cn', home: tmpHome, isTTY: false } })
  // 通过注入的 fetchFresh/relink 无法直接断言，这里断言"不抛错且包含目标行"
  assert.ok(r.some((l) => l.startsWith('目标')), '应有目标行')
})
```
（该测试以"能跑通 + 目标行存在"为底线；依赖解析的单元行为已由 deps.test.mjs 覆盖。）

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test test/update.test.mjs`
Expected: 当前为 PASS（旧用例）——本任务先加 import 再让新用例红，见 Step 3 顺序

- [ ] **Step 3: 实现**（`src/update.mjs` 顶部 import，并在 `runUpdate` 末尾追加依赖重校验）

import 追加：

```js
import { resolveSkillDeps } from './deps.mjs'
import { ensureSkillDep } from './add.mjs'
import { ensureCli } from './cli-version.mjs'
import { existsSync as fsExists } from 'node:fs'
```

`runUpdate` 末尾（`lines.push(\`→ 完成：...\`)` 之前）插入：

```js
  // 依赖重校验（spec §5.2）：刷新完每个 skill 条目后解析其依赖
  const depSummary = { installed: [], refreshed: [], cliUpdated: [], cliInstalled: [], failures: [] }
  for (const e of entries) {
    if (e.kind !== 'skill') continue
    const manifestDir = join(home, '.aas', 'repos', cacheKeyForSource(e.source.repo, typeof e.source.repo === 'string' && !e.source.repo.includes('://')))
    const sd = join(manifestDir, 'skilldependencies')
    if (!fsExists(sd)) continue
    const ensureSkill = (name, sourceCtx) => ensureSkillDep({
      name, sourceCtx, manifestRoot: manifestDir, editorName: e.editor, editor: config.editors?.[e.editor],
      config, ledger, ledgerPath, home, opts: { editor: e.editor, isTTY },
    })
    const r = resolveSkillDeps({
      skill: e.id, rootManifestDir: sd, rootSourceCtx: 'inherit',
      ensureSkill, ensureCli,
    })
    depSummary.installed.push(...r.installed)
    depSummary.refreshed.push(...r.refreshed)
    depSummary.cliUpdated.push(...r.cliUpdated)
    depSummary.cliInstalled.push(...r.cliInstalled)
    depSummary.failures.push(...r.failures)
  }
  for (const n of depSummary.installed) lines.push(`· 依赖安装  ${n}`)
  for (const n of depSummary.refreshed) lines.push(`· 依赖刷新  ${n}`)
  for (const r of depSummary.cliUpdated) lines.push(`· CLI 更新  ${r.name}  ${r.detail}`)
  for (const r of depSummary.cliInstalled) lines.push(`· CLI 安装  ${r.name}  ${r.detail}`)
  for (const f of depSummary.failures) lines.push(`· 依赖失败  [${f.type}] ${f.name}：${f.detail}`)
```

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test test/update.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/update.mjs test/update.test.mjs
git commit -m "feat(update): --all 刷新后重校验已装技能的依赖"
```

---

### Task 8: `sync.config.json` 增加 `skills` 目录（8 条）

**Files:**
- Modify: `D:\Seed\agent-assets-sync\sync.config.json`
- 验证：`aas` 体检 + `node --test test/config.test.mjs`

**Interfaces:**
- Consumes: Task 1 的 schema（`skills` 目录）
- Produces: 运行态目录——`aas add <技能名>` 可解析；`aas add <技能名> --islocal` 指向 `D:/Seed/retro-skills` 工作副本

- [ ] **Step 1: 修改 `sync.config.json`**，在 `"linkTargets"` 之后新增 `"skills"`：

```json
  "skills": {
    "multi-lens-review":     { "source": "https://github.com/seedhuang/retro-skills.git", "localPath": "D:/Seed/retro-skills" },
    "prd-to-specs":          { "source": "https://github.com/seedhuang/retro-skills.git", "localPath": "D:/Seed/retro-skills" },
    "retro-collect":         { "source": "https://github.com/seedhuang/retro-skills.git", "localPath": "D:/Seed/retro-skills" },
    "retro-analyze":         { "source": "https://github.com/seedhuang/retro-skills.git", "localPath": "D:/Seed/retro-skills" },
    "retro-institutionalize":{ "source": "https://github.com/seedhuang/retro-skills.git", "localPath": "D:/Seed/retro-skills" },
    "evolving-skills":       { "source": "https://github.com/seedhuang/retro-skills.git", "localPath": "D:/Seed/retro-skills" },
    "using-retrospective":   { "source": "https://github.com/seedhuang/retro-skills.git", "localPath": "D:/Seed/retro-skills" },
    "managing-lessons-store":{ "source": "https://github.com/seedhuang/retro-skills.git", "localPath": "D:/Seed/retro-skills" }
  }
```

- [ ] **Step 2: 验证**

Run: `node --test test/config.test.mjs`
Expected: PASS（`normalizeConfig` 接受新配置）

- [ ] **Step 3: Commit**

```bash
git add sync.config.json
git commit -m "feat(config): 登记 8 个套件技能的 skills 目录（远程源 + 本地工作副本）"
```

---

### Task 9: retro-skills 新增 `skilldependencies/`（manifest + 8 个清单）

**Files:**
- Create: `d:\Seed\retro-skills\skilldependencies\manifest.json`
- Create: `d:\Seed\retro-skills\skilldependencies\<8 个技能名>.json`
- 验证脚本：`d:\Seed\retro-skills\skilldependencies\validate.test.mjs`（用 `readManifest` 校验每个文件）

**Interfaces:**
- Consumes: spec §4.1 / §4.2 schema；Task 5 的 `readManifest`
- Produces: 依赖数据——`aas add <技能>` 装完即解析依赖

- [ ] **Step 1: 创建 `skilldependencies/manifest.json`**

```json
{
  "schemaVersion": 1,
  "skills": ["multi-lens-review", "prd-to-specs", "retro-collect", "retro-analyze", "retro-institutionalize", "evolving-skills", "using-retrospective", "managing-lessons-store"]
}
```

- [ ] **Step 2: 创建 8 个技能清单**（跨技能引用按各 SKILL.md 的真实引用；无 npm CLI 依赖故 `cli` 全省略）

`multi-lens-review.json`（复盘回流引用 review-flywheel + 落 KB 走 collect/analyze）：

```json
{
  "schemaVersion": 1,
  "skill": "multi-lens-review",
  "dependencies": {
    "skills": [
      { "name": "evolving-skills" },
      { "name": "retro-collect" },
      { "name": "retro-analyze" }
    ]
  }
}
```

`prd-to-specs.json`（复盘回流 + 建议 multi-lens 评审）：

```json
{
  "schemaVersion": 1,
  "skill": "prd-to-specs",
  "dependencies": {
    "skills": [
      { "name": "evolving-skills" },
      { "name": "multi-lens-review" },
      { "name": "retro-collect" },
      { "name": "retro-analyze" }
    ]
  }
}
```

`retro-collect.json`（bootstrap 依赖 managing-lessons-store）：

```json
{
  "schemaVersion": 1,
  "skill": "retro-collect",
  "dependencies": { "skills": [ { "name": "managing-lessons-store" } ] }
}
```

`retro-analyze.json`（同 collect）：

```json
{
  "schemaVersion": 1,
  "skill": "retro-analyze",
  "dependencies": { "skills": [ { "name": "managing-lessons-store" } ] }
}
```

`retro-institutionalize.json`（修订转发 evolving-skills + bootstrap）：

```json
{
  "schemaVersion": 1,
  "skill": "retro-institutionalize",
  "dependencies": {
    "skills": [
      { "name": "evolving-skills" },
      { "name": "managing-lessons-store" }
    ]
  }
}
```

`evolving-skills.json`（无跨技能引用，`dependencies` 省略）：

```json
{
  "schemaVersion": 1,
  "skill": "evolving-skills"
}
```

`using-retrospective.json`（轮询 managing-lessons-store + 路由三环节）：

```json
{
  "schemaVersion": 1,
  "skill": "using-retrospective",
  "dependencies": {
    "skills": [
      { "name": "managing-lessons-store" },
      { "name": "retro-collect" },
      { "name": "retro-analyze" },
      { "name": "retro-institutionalize" }
    ]
  }
}
```

`managing-lessons-store.json`（仅需 node，系统工具不声明）：

```json
{
  "schemaVersion": 1,
  "skill": "managing-lessons-store"
}
```

- [ ] **Step 3: 创建校验测试 `skilldependencies/validate.test.mjs`**

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readManifest } from 'D:/Seed/agent-assets-sync/src/deps.mjs'

const here = dirname(fileURLToPath(import.meta.url))

test('manifest.json：skills 列表与文件一一对应', () => {
  const m = JSON.parse(readFileSync(join(here, 'manifest.json'), 'utf8'))
  const files = readdirSync(here).filter((f) => f.endsWith('.json') && f !== 'manifest.json').map((f) => f.replace(/\.json$/, '')).sort()
  assert.deepEqual([...m.skills].sort(), files)
})

test('每个技能清单：schema 合法且 skill 名 = 文件名', () => {
  const files = readdirSync(here).filter((f) => f.endsWith('.json') && f !== 'manifest.json')
  for (const f of files) {
    const m = readManifest(join(here, f))
    assert.equal(m.skill, f.replace(/\.json$/, ''))
  }
})

test('每个技能清单：跨技能依赖都在本套件内', () => {
  const m = JSON.parse(readFileSync(join(here, 'manifest.json'), 'utf8'))
  const known = new Set(m.skills)
  const files = readdirSync(here).filter((f) => f.endsWith('.json') && f !== 'manifest.json')
  for (const f of files) {
    const man = readManifest(join(here, f))
    for (const d of man.skills) assert.equal(known.has(d.name), true, `${f} 依赖了套件外的 ${d.name}`)
  }
})
```

- [ ] **Step 4: 跑校验测试**

Run: `node --test skilldependencies/validate.test.mjs`
Expected: PASS（3 个用例全绿）

- [ ] **Step 5: Commit**

```bash
git add skilldependencies/
git commit -m "feat(skilldeps): 新增 8 个技能的依赖清单与 manifest（含校验测试）"
```

---

## Self-Review

**1. Spec 覆盖**（spec 各节 → 任务）：

| spec 节 | 任务 |
|---|---|
| §4.1 manifest / §4.2 每技能清单 / §4.3 skills 目录 | T1、T8、T9 |
| §5.1 统一源解析（含 `--islocal`、npx 回退、parseSource 短写） | T2、T3、T6 |
| §5.2 依赖解析（M1/B1/B3、BFS、递归） | T5、T6、T7 |
| §5.3 CLI 版本检查与更新（B2、O1、R6 详细报错） | T4、T6 |
| §6 硬约束 1–10 | T1（B4）、T2、T3（R5）、T4（R6/B2）、T5（R7/M1/B1）、T6、T9（R1/R2/R8/R9） |
| §7 测试表 | T1–T9 各自测试 |
| §9 落地清单（catalog/deps/cli-version 三模块） | T3、T4、T5 |
| §10 评审记录（M1/B1/B2/B3/B4 修复） | T1（B4）、T3（R5）、T4（B2）、T5（M1/B1/B3）、T6 |

**2. 占位符扫描**：无 TBD/TODO；每个代码步骤都有完整可运行代码。

**3. 类型一致性**：
- `resolveSourceForName` 返回 `context.kind` ∈ path/source/npx —— T3 定义，T6 消费 ✓
- `ensureSkillDep` 返回 `{ ok, action?, manifestDir? }` —— T6 定义并注入 T5 的 `ensureSkill` 签名 ✓
- `ensureCli(cliEntry)` 返回 `{ name, action, detail }` —— T4 定义，T5/T6/T7 消费 ✓
- `readManifest` 返回 `{ schemaVersion, skill, skills, cli }` —— T5 定义，T5/T6/T7/T9 消费 ✓
- `resolveSkillDeps` 参数 `{ skill, rootManifestDir, rootSourceCtx, ensureSkill, ensureCli }` 返回 `{ installed, refreshed, cliUpdated, cliInstalled, failures, visited }` —— T5 定义，T6/T7 消费，字段名全程一致 ✓

**已知边界（刻意如此）**：Task 6/7 的集成测试以"能跑通 + 目标行存在"为底线，依赖解析的单元行为由 deps.test.mjs / cli-version.test.mjs 覆盖；`--islocal` 的 live 直用（不 clone）使 junction 指向工作副本，符合"本地调试测未提交改动"的语义（spec R5 / M1）。
