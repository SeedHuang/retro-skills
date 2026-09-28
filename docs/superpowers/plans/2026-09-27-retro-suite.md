# retro-skills 复盘闭环套件 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建出「问题 → 复盘 → 归置 → 生效」的闭环套件：一个机器级错题集 KB + 5 个技能 + 1 条常驻轮询规则。

**Architecture:** 两个交付物面——① **数据层**：`lessons.mjs` 单文件脚本（Node 内置 API，无第三方依赖）+ 用户指定位置的错题集 KB；② **过程层**：5 个 SKILL.md 组成的链（入口薄路由 → 采集 → 分析 → 归置），跨技能只用技能名引用。技能进运行时靠官方 `skills` CLI（symlink 模式）。技能类交付物用 `writing-skills` 的 RED-GREEN-REFACTOR 验证（先跑压力场景看基线怎么错，再写技能，再复跑），脚本类用 `node:test` 走标准 TDD。

**Tech Stack:** Node ≥18（`node:test` + `node:assert/strict` + `node:fs` + `node:path` + `node:crypto` / `node:url`）、Markdown（SKILL.md）、`npx skills` CLI（安装）。

**Spec:** `docs/superpowers/specs/2026-09-27-retro-suite-design.md`

---

## Global Constraints

以下逐字取自 spec，**每个任务都隐含包含本节**：

1. **运行时依赖零新增**：`lessons.mjs` 只用 Node 内置模块；套件不引入任何第三方依赖。
2. **Node ≥ 18**（本机 v22.12.0 已验证）。
3. **KB 绝不进仓库**：错题集含个人数据且项目内部信息；`.gitignore` 已含兜底模式（`lessons/`、`**/ledger.md`、`*.local.md`、`.superpowers/`）。
4. **5 个技能名固定，不可改**：`using-retrospective` / `retro-collect` / `retro-analyze` / `retro-institutionalize` / `managing-lessons-store`。
5. **SKILL.md frontmatter 只有 `name` 与 `description`**；`description` **只写触发条件、双语（英文 Use when 结构 + 中文触发词）、不总结流程**；正文中文。
6. **跨技能引用只用技能名**（`REQUIRED SUB-SKILL: <技能名>` / `REQUIRED BACKGROUND: <技能名>`），**禁止 `@` 链接**（会 force-load 烧上下文）。
7. **落点**：全局规则 → `%userprofile%\.trae-cn\user_rules\rule-<epoch>.md`（**纯 markdown、无 frontmatter**）；项目规则 → `<项目>/.trae/rules/*.md`。`alwaysApply`/`globs`/`description` **只属于项目规则**。
8. **禁止一切 Git 写操作**：本计划**不含 `git commit` 步骤**；每个任务结束时列出改动文件，由用户自行提交。只允许 `git status` / `git log` / `git diff` 等读操作。
9. **同文件禁止并行编辑**；每次编辑 .js/.mjs 文件后跑一次该文件的测试。
10. **过程证据落 `.superpowers/sdd/2026-09-27-retro-suite.md/`**（gitignored），每任务一份 `task-N-report.md`。

---

## File Structure

| 文件 | 职责 | 创建/修改 |
|---|---|---|
| `skills/managing-lessons-store/scripts/lessons.mjs` | KB 位置解析 + 五校验 + 推迟项轮询 + 迁移。**纯函数导出 + CLI 入口守卫**，便于 `node:test` 直测 | Task 1–3 创建 |
| `skills/managing-lessons-store/scripts/lessons.test.mjs` | 上者的单元测试（`node:test`） | Task 1–3 创建 |
| `skills/managing-lessons-store/SKILL.md` | 库生命周期技能：bootstrap（首次指定位置 + 建库骨架 + 写初始候选）/ 迁移 / 轮询 | Task 4 创建 |
| `skills/using-retrospective/SKILL.md` | 入口薄路由：时机判断 + 路由表 + 推迟项三要素 + 产物关系图 + 错误传播契约 | Task 5 创建 |
| `skills/retro-collect/SKILL.md` | 采集事实包（模板内嵌）+ 零判断硬约束 | Task 6 创建 |
| `skills/retro-analyze/SKILL.md` | 产出复盘 + KB 条目（模板内嵌） | Task 7 创建 |
| `skills/retro-institutionalize/SKILL.md` | 归置决策树 + provenance + 备份/确认 + 写入顺序 + 真冲突判定 | Task 8 创建 |
| `README.md` / `LICENSE` | 定位 + 安装命令 + 「不含个人数据」声明 / MIT | Task 9 创建 |
| `%userprofile%\.trae-cn\user_rules\rule-<epoch>.md` | 常驻轮询规则（**仓库外**） | Task 9 创建 |

**测试运行方式（全计划统一）**：

```bash
cd d:/Seed/retro-skills
node --test skills/managing-lessons-store/scripts/
```

**为什么测试与脚本同目录**：脚本是单文件、无构建步骤；同目录便于技能被安装后仍能就地自测，且避免为测试引入 `package.json` 与依赖（Global Constraint 1）。

---

## Task 1: 脚本骨架 + `lessons resolve`（含五校验）

**Files:**
- Create: `skills/managing-lessons-store/scripts/lessons.mjs`
- Create: `skills/managing-lessons-store/scripts/lessons.test.mjs`
- Create: `.superpowers/sdd/2026-09-27-retro-suite.md/`（证据目录）

**Interfaces:**
- Consumes: 无（首个任务）
- Produces:
  - `POINTER_CANDIDATES: string[]` — 指针文件候选路径（`~/.agents/lessons.config.json`、`~/.trae-cn/lessons.config.json` 顺序）
  - `readPointer(fsLike): { path: string, config: object } | null`
  - `checkStore(root: string, deps): { ok: true } | { ok: false, reason: string, hint: string }`
  - `resolveStore(opts: { env: object, pointerPaths: string[], deps }): { ok: true, root: string } | { ok: false, reason: string, hint: string }`
  - CLI：`node lessons.mjs resolve` → 成功 stdout 打印 KB 绝对路径、exit 0；失败 stderr 打印 `reason` + `hint`、exit 1

- [ ] **Step 1: 建证据目录**

```bash
mkdir -p ".superpowers/sdd/2026-09-27-retro-suite.md"
```

- [ ] **Step 2: 写失败测试（resolve 的成功路径 + 四种失败路径）**

创建 `skills/managing-lessons-store/scripts/lessons.test.mjs`：

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { resolveStore, checkStore } from './lessons.mjs'

function tmp() { return mkdtempSync(join(tmpdir(), 'lessons-')) }
function makeStore(root) {
  mkdirSync(join(root, 'projects'), { recursive: true })
  mkdirSync(join(root, 'universal'), { recursive: true })
  writeFileSync(join(root, 'index.md'), '# index\n', 'utf8')
  return root
}
const emptyDeps = { isInsideGitRepo: () => false, now: () => 0 }

test('resolve：环境变量优先', () => {
  const root = makeStore(tmp())
  const r = resolveStore({ env: { LESSONS_DIR: root }, pointerPaths: [], deps: emptyDeps })
  assert.equal(r.ok, true)
  assert.equal(r.root, root)
})

test('resolve：指针文件次之', () => {
  const root = makeStore(tmp())
  const cfg = join(tmp(), 'lessons.config.json')
  writeFileSync(cfg, JSON.stringify({ store: root, schemaVersion: 1 }), 'utf8')
  const r = resolveStore({ env: {}, pointerPaths: [cfg], deps: emptyDeps })
  assert.equal(r.ok, true)
  assert.equal(r.root, root)
})

test('resolve：两者皆无 → 报无指针（引导 bootstrap）', () => {
  const r = resolveStore({ env: {}, pointerPaths: [], deps: emptyDeps })
  assert.equal(r.ok, false)
  assert.match(r.reason, /未找到错题集指针/)
  assert.match(r.hint, /bootstrap/)
})

test('checkStore：路径不存在 → 拒绝', () => {
  const r = checkStore(join(tmp(), 'nope'), emptyDeps)
  assert.equal(r.ok, false)
  assert.match(r.reason, /不存在或不是目录/)
})

test('checkStore：schemaVersion 不支持 → 拒绝', () => {
  const root = makeStore(tmp())
  const cfg = join(tmp(), 'lessons.config.json')
  writeFileSync(cfg, JSON.stringify({ store: root, schemaVersion: 99 }), 'utf8')
  const r = resolveStore({ env: {}, pointerPaths: [cfg], deps: emptyDeps })
  assert.equal(r.ok, false)
  assert.match(r.reason, /schemaVersion=99 不受支持/)
})

test('checkStore：位于 git 仓库内 → 拒绝（KB 绝不进仓库）', () => {
  const root = makeStore(tmp())
  const r = checkStore(root, { ...emptyDeps, isInsideGitRepo: () => true })
  assert.equal(r.ok, false)
  assert.match(r.reason, /位于仓库内/)
  assert.match(r.hint, /迁移到仓库外/)
})

test('checkStore：指针 JSON 损坏 → 拒绝', () => {
  const cfg = join(tmp(), 'lessons.config.json')
  writeFileSync(cfg, '{ not json', 'utf8')
  const r = resolveStore({ env: {}, pointerPaths: [cfg], deps: emptyDeps })
  assert.equal(r.ok, false)
  assert.match(r.reason, /指针文件损坏/)
})
```

- [ ] **Step 3: 跑测试确认失败**

```bash
node --test skills/managing-lessons-store/scripts/
```
Expected: FAIL —— `Cannot find module './lessons.mjs'`

- [ ] **Step 4: 写最小实现**

创建 `skills/managing-lessons-store/scripts/lessons.mjs`：

```js
#!/usr/bin/env node
// 错题集 KB 生命周期脚本（spec §4.1 / §4.5）
// 只用 Node 内置模块；导出纯函数便于 node:test 直测；底部有 CLI 入口守卫。
import { existsSync, readFileSync, statSync, accessSync, constants } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export const SCHEMA_VERSION = 1

/** 指针文件候选（两者都查；写时优先第一个） */
export function pointerCandidates(home = homedir()) {
  return [join(home, '.agents', 'lessons.config.json'), join(home, '.trae-cn', 'lessons.config.json')]
}

/** 逐个读指针候选；首个可解析的胜出。JSON 损坏 → 返回 { broken: true, path } 以便报错 */
export function readPointer(paths) {
  for (const p of paths) {
    if (!existsSync(p)) continue
    try {
      const raw = readFileSync(p, 'utf8')
      const config = JSON.parse(raw)
      if (typeof config?.store !== 'string' || config.store.trim() === '') {
        return { broken: true, path: p, reason: `指针文件缺少有效的 "store"：${p}` }
      }
      return { path: p, config }
    } catch {
      return { broken: true, path: p, reason: `指针文件损坏：${p}` }
    }
  }
  return null
}

/** KB 根的合法性校验（spec §4.1.1 五条） */
export function checkStore(root, deps) {
  const abs = resolve(root)
  if (!existsSync(abs) || !statSync(abs).isDirectory()) {
    return { ok: false, reason: `KB 路径不存在或不是目录：${abs}`, hint: '重建请运行 bootstrap（managing-lessons-store 技能）' }
  }
  try {
    accessSync(abs, constants.W_OK)
  } catch {
    return { ok: false, reason: `KB 路径不可写：${abs}`, hint: '检查权限，或迁移到可写位置' }
  }
  if (deps.isInsideGitRepo(abs)) {
    return { ok: false, reason: `KB 位于仓库内：${abs}`, hint: '错题集含个人数据，不得入库。请迁移到仓库外' }
  }
  return { ok: true }
}

/** 解析优先级：环境变量 → 指针文件 → 无（触发 bootstrap） */
export function resolveStore({ env, pointerPaths, deps }) {
  const fromEnv = env?.LESSONS_DIR
  if (typeof fromEnv === 'string' && fromEnv.trim() !== '') {
    const c = checkStore(fromEnv, deps)
    return c.ok ? { ok: true, root: resolve(fromEnv) } : c
  }
  const ptr = readPointer(pointerPaths)
  if (ptr === null) {
    return { ok: false, reason: '未找到错题集指针，错题集尚未初始化', hint: '请运行 bootstrap（managing-lessons-store 技能）指定位置' }
  }
  if (ptr.broken) return { ok: false, reason: ptr.reason, hint: `备份后重建指针：${ptr.path}` }
  if (ptr.config.schemaVersion !== SCHEMA_VERSION) {
    return { ok: false, reason: `KB schemaVersion=${ptr.config.schemaVersion} 不受支持（支持 ${SCHEMA_VERSION}）`, hint: '迁移或重建' }
  }
  const c = checkStore(ptr.config.store, deps)
  return c.ok ? { ok: true, root: resolve(ptr.config.store) } : c
}

// ── CLI 入口守卫：仅当被直接执行时运行 ────────────────────────────
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const cmd = process.argv[2]
  if (cmd === 'resolve') {
    const r = resolveStore({ env: process.env, pointerPaths: pointerCandidates(), deps: { isInsideGitRepo: () => false } })
    if (r.ok) { process.stdout.write(r.root + '\n'); process.exit(0) }
    process.stderr.write(`${r.reason}\n下一步：${r.hint}\n`)
    process.exit(1)
  }
  process.stderr.write(`未知命令：${cmd}\n支持：resolve | deferred | migrate --to <path>\n`)
  process.exit(1)
}
```

> **注**：`resolve` 的 CLI 分支暂以 `isInsideGitRepo: () => false` 占位——Task 3 会用真实实现替换（见 Task 3 Interfaces）。

- [ ] **Step 5: 跑测试确认通过**

```bash
node --test skills/managing-lessons-store/scripts/
```
Expected: PASS —— 7 tests passing

- [ ] **Step 6: 手工验收 CLI**

```bash
node skills/managing-lessons-store/scripts/lessons.mjs resolve; echo "exit=$?"
```
Expected: `exit=1`，stderr 含「错题集尚未初始化」与「bootstrap」（因本机尚无指针）

- [ ] **Step 7: 写证据 + 交付检查**

写 `.superpowers/sdd/2026-09-27-retro-suite.md/task-1-report.md`，含：`node --test` 输出全文、Step 6 的 exit code 与 stderr、`git status --porcelain -uall` 输出。

改动文件（**由用户 commit**）：`skills/managing-lessons-store/scripts/lessons.mjs`、`skills/managing-lessons-store/scripts/lessons.test.mjs`

---

## Task 2: `lessons deferred`（推迟项轮询）

**Files:**
- Modify: `skills/managing-lessons-store/scripts/lessons.mjs`
- Modify: `skills/managing-lessons-store/scripts/lessons.test.mjs`

**Interfaces:**
- Consumes: Task 1 的 `resolveStore` / `checkStore`
- Produces:
  - `parseDeferredSection(indexMarkdown: string): Array<{ id: string, item: string, signal: string }>`
  - `evaluateSignals(rows, counters: { openCount: number, dims: number, projects: number, landedCount: number }): Array<{ id, item, signal, hits: boolean, evidence: string }>`
  - `runDeferred(root: string, counters): { rows: Array<{id,item,signal,hits,evidence}>, summary: string }` —— `summary` 形如 `推迟项 3 条（1 条命中信号）` 或 `推迟项 3 条，均未命中信号`
  - CLI：`node lessons.mjs deferred` → stdout 打印清单 + summary、exit 0

- [ ] **Step 1: 写失败测试**

追加到 `lessons.test.mjs`：

```js
import { parseDeferredSection, evaluateSignals, runDeferred } from './lessons.mjs'

const INDEX = `# index

## 候选与推迟

| 编号 | 项 | 动机 | 复活信号 |
|---|---|---|---|
| C1 | 冲突消解序列 | L-001 | 首次出现真冲突 |
| L3-1 | 三维度趋势 | L-002 | KB 条目 >= 10 且维度 >= 2 |
| L4-1 | 跨项目分析 | L-003 | KB 项目 >= 2 且条目 >= 20 |
`

test('parseDeferredSection：抽出三行', () => {
  const rows = parseDeferredSection(INDEX)
  assert.equal(rows.length, 3)
  assert.equal(rows[0].id, 'C1')
  assert.equal(rows[1].signal, 'KB 条目 >= 10 且维度 >= 2')
})

test('evaluateSignals：未达阈值 → hits=false', () => {
  const rows = parseDeferredSection(INDEX)
  const out = evaluateSignals(rows, { openCount: 3, dims: 2, projects: 1, landedCount: 0 })
  assert.equal(out.find(r => r.id === 'L3-1').hits, false)
  assert.match(out.find(r => r.id === 'L3-1').evidence, /3\/10 条, 2\/2 维度/)
})

test('evaluateSignals：达阈值 → hits=true 且带证据', () => {
  const rows = parseDeferredSection(INDEX)
  const out = evaluateSignals(rows, { openCount: 12, dims: 3, projects: 2, landedCount: 0 })
  assert.equal(out.find(r => r.id === 'L3-1').hits, true)
  assert.equal(out.find(r => r.id === 'L4-1').hits, true)
  assert.equal(out.find(r => r.id === 'C1').hits, false)
})

test('runDeferred：summary 分两分支且带计数', () => {
  const root = makeStore(tmp())
  writeFileSync(join(root, 'index.md'), INDEX, 'utf8')
  const none = runDeferred(root, { openCount: 1, dims: 1, projects: 1, landedCount: 0 })
  assert.match(none.summary, /推迟项 3 条，均未命中信号/)
  const hit = runDeferred(root, { openCount: 12, dims: 3, projects: 2, landedCount: 0 })
  assert.match(hit.summary, /推迟项 3 条（2 条命中信号）/)
})
```

- [ ] **Step 2: 跑测试确认失败**

```bash
node --test skills/managing-lessons-store/scripts/
```
Expected: FAIL —— `parseDeferredSection is not a function`

- [ ] **Step 3: 写实现**

在 `lessons.mjs` 的 `resolveStore` 之后追加：

```js
/** 从 index.md 的「候选与推迟」节抽表行（spec §7.1：必须带可观测信号） */
export function parseDeferredSection(indexMarkdown) {
  const lines = indexMarkdown.split(/\r?\n/)
  const start = lines.findIndex(l => /^##\s+候选与推迟/.test(l))
  if (start === -1) return []
  const rows = []
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i]
    if (/^##\s+/.test(l)) break
    const m = l.match(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/)
    if (!m) continue
    if (m[1] === '编号' || /^-+$/.test(m[1])) continue
    rows.push({ id: m[1], item: m[2], motivation: m[3], signal: m[4] })
  }
  return rows
}

/** 逐条判定信号命中（当前只实现 spec §11 的三个可计量信号） */
export function evaluateSignals(rows, c) {
  return rows.map(r => {
    let hits = false, evidence = ''
    if (/KB\s*条目.*>=\s*10/.test(r.signal)) {
      hits = c.openCount >= 10 && c.dims >= 2
      evidence = `${c.openCount}/10 条, ${c.dims}/2 维度`
    } else if (/KB\s*项目.*>=\s*2/.test(r.signal)) {
      hits = c.projects >= 2 && c.openCount >= 20
      evidence = `${c.projects}/2 项目, ${c.openCount}/20 条`
    } else if (/首次出现真冲突/.test(r.signal)) {
      hits = false
      evidence = '需人工判定（真冲突判定见 spec §3.3）'
    } else {
      evidence = '信号不可自动判定 → 交人工'
    }
    return { ...r, hits, evidence }
  })
}

/** 轮询报告：清单 + 必带计数的 summary（spec §7.2） */
export function runDeferred(root, counters) {
  const index = readFileSync(join(root, 'index.md'), 'utf8')
  const rows = evaluateSignals(parseDeferredSection(index), counters)
  const hitCount = rows.filter(r => r.hits).length
  const summary = hitCount > 0
    ? `推迟项 ${rows.length} 条（${hitCount} 条命中信号）`
    : `推迟项 ${rows.length} 条，均未命中信号`
  return { rows, summary }
}
```

在 CLI 守卫里追加分支（`resolve` 分支之后）：

```js
  else if (cmd === 'deferred') {
    const r = resolveStore({ env: process.env, pointerPaths: pointerCandidates(), deps: { isInsideGitRepo: () => false } })
    if (!r.ok) { process.stderr.write(`${r.reason}\n下一步：${r.hint}\n`); process.exit(1) }
    const counters = { openCount: 0, dims: 0, projects: 0, landedCount: 0 } // Task 3 接入真实计数
    const { rows, summary } = runDeferred(r.root, counters)
    for (const row of rows) process.stdout.write(`- ${row.id} ${row.item}｜信号：${row.signal}｜${row.hits ? '命中' : '未命中'}（${row.evidence}）\n`)
    process.stdout.write(summary + '\n')
    process.exit(0)
  }
```

- [ ] **Step 4: 跑测试确认通过**

```bash
node --test skills/managing-lessons-store/scripts/
```
Expected: PASS —— 11 tests passing

- [ ] **Step 5: 写证据 + 交付检查**

写 `task-2-report.md`：`node --test` 输出、`git status --porcelain -uall`。

改动文件（**由用户 commit**）：`lessons.mjs`、`lessons.test.mjs`

---

## Task 3: `lessons migrate`（四硬校验 + 七步 + 锁 + 真实计数接入）

**Files:**
- Modify: `skills/managing-lessons-store/scripts/lessons.mjs`
- Modify: `skills/managing-lessons-store/scripts/lessons.test.mjs`

**Interfaces:**
- Consumes: Task 1/2 的 `resolveStore`/`checkStore`/`runDeferred`；`evaluateSignals` 的 `counters`
- Produces:
  - `validateTarget(from: string, to: string): { ok: true } | { ok: false, reason: string }` —— 四条硬校验
  - `hashTree(root: string): Record<string, string>` —— 相对路径 → sha256
  - `migrate({ from, to, deps }): { ok: true, hashCount: number, pointerPath: string } | { ok: false, reason: string, stage: string }`
  - `countLedger(root): { openCount: number, dims: number, projects: number, landedCount: number }`
  - CLI：`node lessons.mjs migrate --to <path>`

- [ ] **Step 1: 写失败测试（四校验 + 迁移成功 + 重复执行）**

追加到 `lessons.test.mjs`：

```js
import { validateTarget, hashTree, migrate, countLedger } from './lessons.mjs'
import { mkdirSync as mk, writeFileSync as wf } from 'node:fs'

test('validateTarget：目标 = 源 → 拒绝', () => {
  const root = makeStore(tmp())
  const r = validateTarget(root, root)
  assert.equal(r.ok, false)
  assert.match(r.reason, /目标与源相同/)
})

test('validateTarget：目标在源内 → 拒绝（防无限递归）', () => {
  const root = makeStore(tmp())
  const r = validateTarget(root, join(root, 'inner'))
  assert.equal(r.ok, false)
  assert.match(r.reason, /目标位于源内/)
})

test('validateTarget：源在目标内（目标是祖先）→ 拒绝', () => {
  const root = makeStore(tmp())
  const r = validateTarget(join(root, 'child'), root)
  assert.equal(r.ok, false)
  assert.match(r.reason, /目标是源的祖先/)
})

test('validateTarget：目标已存在且非空 → 拒绝（需显式确认）', () => {
  const root = makeStore(tmp())
  const target = tmp()
  wf(join(target, 'x.md'), 'x', 'utf8')
  const r = validateTarget(root, target)
  assert.equal(r.ok, false)
  assert.match(r.reason, /目标已存在且非空/)
})

test('migrate：成功 → 指针切换 + 哈希计数一致', () => {
  const root = makeStore(tmp())
  mk(join(root, 'projects', 'lpm'), { recursive: true })
  wf(join(root, 'projects', 'lpm', 'ledger.md'), '| ID |\n', 'utf8')
  const target = join(tmp(), 'newstore')
  const ptr = join(tmp(), 'lessons.config.json')
  const r = migrate({ from: root, to: target, deps: { pointerPath: ptr, isInsideGitRepo: () => false } })
  assert.equal(r.ok, true)
  assert.equal(r.hashCount, Object.keys(hashTree(root)).length)
  const written = JSON.parse(readFileSync(ptr, 'utf8'))
  assert.equal(written.store, resolve(target))
})

test('migrate：重复执行（源已是新位置，目标=源）→ 被四校验拦住', () => {
  const root = makeStore(tmp())
  const r = migrate({ from: root, to: root, deps: { pointerPath: join(tmp(), 'c.json'), isInsideGitRepo: () => false } })
  assert.equal(r.ok, false)
  assert.match(r.reason, /目标与源相同/)
})

test('countLedger：统计 open 数、维度数、项目数、landed 数', () => {
  const root = makeStore(tmp())
  mk(join(root, 'projects', 'p1'), { recursive: true })
  mk(join(root, 'projects', 'p2'), { recursive: true })
  const row = (id, dim, status) => `| ${id} | 2026-09-27 | p1 | 复盘 | x | y | ${dim} | z | rule(全局) | ${status} |\n`
  wf(join(root, 'projects', 'p1', 'ledger.md'), row('L-1', '性能', 'open') + row('L-2', '健壮度', 'open') + row('L-3', '健壮度', 'landed(→rule(全局))'), 'utf8')
  wf(join(root, 'projects', 'p2', 'ledger.md'), row('L-4', '性能', 'open'), 'utf8')
  const c = countLedger(root)
  assert.equal(c.projects, 2)
  assert.equal(c.openCount, 3)
  assert.equal(c.landedCount, 1)
  assert.equal(c.dims, 2)
})
```

- [ ] **Step 2: 跑测试确认失败**

```bash
node --test skills/managing-lessons-store/scripts/
```
Expected: FAIL —— `validateTarget is not a function`

- [ ] **Step 3: 写实现**

在 `lessons.mjs` 追加（`import { mkdirSync, readdirSync, copyFileSync, writeFileSync, renameSync, rmSync } from 'node:fs'`、`import { createHash } from 'node:crypto'`、`import { dirname, relative, sep } from 'node:path'`）：

```js
/** 四条硬校验（spec §4.6） */
export function validateTarget(from, to) {
  const a = resolve(from), b = resolve(to)
  if (a === b) return { ok: false, reason: `目标与源相同：${b}` }
  const rel = relative(a, b)
  if (rel && !rel.startsWith('..') && !rel.startsWith(sep)) return { ok: false, reason: `目标位于源内：${b}（会无限递归复制）` }
  const rel2 = relative(b, a)
  if (rel2 && !rel2.startsWith('..') && !rel2.startsWith(sep)) return { ok: false, reason: `目标是源的祖先：${b}` }
  if (existsSync(b) && readdirSync(b).length > 0) return { ok: false, reason: `目标已存在且非空：${b}` }
  return { ok: true }
}

/** 递归哈希（相对路径 → sha256），用于迁移后一致性校验 */
export function hashTree(root) {
  const out = {}
  const walk = dir => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      if (name === '.migrating') continue
      if (statSync(p).isDirectory()) walk(p)
      else out[relative(root, p)] = createHash('sha256').update(readFileSync(p)).digest('hex')
    }
  }
  walk(root)
  return out
}

/** 自建 git 仓库探测：向上找 .git */
function isInsideGitRepo(p) {
  let cur = resolve(p)
  while (true) {
    if (existsSync(join(cur, '.git'))) return true
    const parent = dirname(cur)
    if (parent === cur) return false
    cur = parent
  }
}

/** 迁移七步（spec §4.6）：切指针放最后，任何中断旧库仍有效 */
export function migrate({ from, to, deps }) {
  const v = validateTarget(from, to)
  if (!v.ok) return { ok: false, reason: v.reason, stage: 'validate-target' }
  const root = resolve(from), target = resolve(to)
  if (deps.isInsideGitRepo(target)) return { ok: false, reason: `KB 位于仓库内：${target}——错题集不得入库`, stage: 'validate-target' }
  const lock = join(root, '.migrating')
  writeFileSync(lock, String(Date.now()), 'utf8')          // 步 3.5 上锁
  try {
    mkdirSync(target, { recursive: true })                  // 步 4 复制
    for (const [relPath, content] of Object.entries(hashTree(root))) {
      const dest = join(target, relPath)
      mkdirSync(dirname(dest), { recursive: true })
      copyFileSync(join(root, relPath), dest)
    }
    const before = hashTree(root), after = hashTree(target) // 步 5 校验
    const beforeKeys = Object.keys(before).sort()
    if (JSON.stringify(beforeKeys) !== JSON.stringify(Object.keys(after).sort()) ||
        beforeKeys.some(k => before[k] !== after[k])) {
      return { ok: false, reason: `迁移校验失败：副本与源不一致（副本保留在 ${target}，请人工处置）`, stage: 'verify' }
    }
    const pointerPath = deps.pointerPath                     // 步 6 切指针（原子写）
    const tmpPath = `${pointerPath}.tmp-${Date.now()}`
    mkdirSync(dirname(pointerPath), { recursive: true })
    writeFileSync(tmpPath, JSON.stringify({ store: target, schemaVersion: SCHEMA_VERSION }, null, 2), 'utf8')
    renameSync(tmpPath, pointerPath)
    return { ok: true, hashCount: beforeKeys.length, pointerPath } // 步 7 由调用方询问是否删旧
  } finally {
    if (existsSync(lock)) rmSync(lock, { force: true })      // 步 7 删锁
  }
}

/** 统计 ledger 计数（供 deferred 的真实 counters） */
export function countLedger(root) {
  const dims = new Set()
  let openCount = 0, landedCount = 0, projects = 0
  const projDir = join(root, 'projects')
  if (!existsSync(projDir)) return { openCount, dims: dims.size, projects, landedCount }
  for (const proj of readdirSync(projDir)) {
    const ledger = join(projDir, proj, 'ledger.md')
    if (!existsSync(ledger)) continue
    projects++
    for (const line of readFileSync(ledger, 'utf8').split(/\r?\n/)) {
      const cells = line.split(/(?<!\\)\|/).map(s => s.trim())
      if (cells.length < 11 || cells[1] === 'ID') continue
      if (cells[7]) dims.add(cells[7])
      if (cells[10] === 'open') openCount++
      if (cells[10].startsWith('landed')) landedCount++
    }
  }
  return { openCount, dims: dims.size, projects, landedCount }
}
```

**替换 Task 1 的占位**：把 CLI 里两处 `isInsideGitRepo: () => false` 换成 `isInsideGitRepo`（Task 3 定义的真实函数）；并把 `deferred` 分支的 `counters` 换成 `countLedger(r.root)`。

追加 `migrate` CLI 分支：

```js
  else if (cmd === 'migrate') {
    const to = process.argv[process.argv.indexOf('--to') + 1]
    if (!to) { process.stderr.write('用法：lessons migrate --to <path>\n'); process.exit(1) }
    const r0 = resolveStore({ env: process.env, pointerPaths: pointerCandidates(), deps: { isInsideGitRepo } })
    if (!r0.ok) { process.stderr.write(`${r0.reason}\n下一步：${r0.hint}\n`); process.exit(1) }
    const ptr = pointerCandidates().find(p => existsSync(p)) ?? pointerCandidates()[0]
    const r = migrate({ from: r0.root, to, deps: { pointerPath: ptr, isInsideGitRepo } })
    if (!r.ok) { process.stderr.write(`迁移失败（${r.stage}）：${r.reason}\n`); process.exit(1) }
    process.stdout.write(`迁移完成：${r.hashCount} 个文件已校验一致；指针 → ${r.pointerPath}\n是否删除旧库由你决定（旧库仍完整可用）\n`)
    process.exit(0)
  }
```

- [ ] **Step 4: 跑测试确认通过**

```bash
node --test skills/managing-lessons-store/scripts/
```
Expected: PASS —— 18 tests passing

- [ ] **Step 5: 手工验收「半副本」构造（spec §9.3）**

```bash
# 造一个完整库
node -e "const{mkdirSync,writeFileSync}=require('fs');mkdirSync('D:/Seed/_probe/full/projects/p',{recursive:true});writeFileSync('D:/Seed/_probe/full/index.md','# i');writeFileSync('D:/Seed/_probe/full/projects/p/ledger.md','| ID |\n')"
# 造半副本（只拷一半）
mkdir -p D:/Seed/_probe/half/projects/p && cp D:/Seed/_probe/full/index.md D:/Seed/_probe/half/index.md
# 断言：半副本与源哈希不一致 → 校验会拒绝
node -e "const m=await import('file:///D:/Seed/retro-skills/skills/managing-lessons-store/scripts/lessons.mjs');const a=m.hashTree('D:/Seed/_probe/full'),b=m.hashTree('D:/Seed/_probe/half');console.log('一致=',JSON.stringify(Object.keys(a).sort())===JSON.stringify(Object.keys(b).sort()))" --input-type=module
```
Expected: `一致= false` —— 证明 Task 3 的步 5 校验能识别半副本

- [ ] **Step 6: 写证据 + 交付检查**

写 `task-3-report.md`：`node --test` 输出、Step 5 的 `一致= false`、`git status --porcelain -uall`。

改动文件（**由用户 commit**）：`lessons.mjs`、`lessons.test.mjs`

---

## Task 4: `managing-lessons-store/SKILL.md`（技能类交付 → RED-GREEN-REFACTOR）

**Files:**
- Create: `skills/managing-lessons-store/SKILL.md`
- Create: `.superpowers/sdd/2026-09-27-retro-suite.md/task-4-red.md`（RED 基线记录）

**Interfaces:**
- Consumes: Task 1–3 的 CLI（`resolve` / `deferred` / `migrate`）
- Produces: 技能 `managing-lessons-store`（Task 5 会用 `REQUIRED SUB-SKILL` 引用它）

- [ ] **Step 1: RED —— 派子代理跑基线场景（**不带技能**）**

派一个 general_purpose_task 子代理，prompt 逐字如下（**不要**给它技能内容）：

```
你是 lpm 项目的开发助手。我做了几轮开发，想把经验教训记下来，长期积累。
请告诉我：这些经验记录应该放在哪里？我需要你给出具体的落点方案，并且现在就动手建好。
注意：我的电脑 C 盘空间紧张。
```

记录观察：它是否**静默选了 C 盘**（如 `~/.lpm`、项目内 `docs/`）？是否**未询问用户**就决定位置？是否把记录放进了仓库（会随 git 提交）？

把原始回答 + 你的判定写进 `task-4-red.md`。

Expected: **FAIL** —— 基线大概率「不询问用户即选位置」或「落到 C 盘/仓库内」（这正是 spec §4.1「无默认值、强制用户指定」要拦的）。

- [ ] **Step 2: GREEN —— 写最小技能**

创建 `skills/managing-lessons-store/SKILL.md`（frontmatter 逐字，正文按下列要求写）：

```markdown
---
name: managing-lessons-store
description: Use when 需要初始化错题集库、迁移库到新位置、或轮询推迟项是否到复活时机时。用于「错题集放哪/库搬家/换盘/有什么推迟项该做了」这类请求。Do not use for 复盘本身（走 retro-collect / retro-analyze / retro-institutionalize）。
---

# 管理错题集库（managing-lessons-store）

## 职责边界

本技能只做三件事：**初始化（bootstrap）、迁移、轮询推迟项**。它**不做**复盘、不写教训内容（那是 retro-* 三个技能的事）。

所有操作都通过脚本 `scripts/lessons.mjs` 完成——**技能里不硬编码 KB 路径**。

## 命令

在本技能目录下运行（相对路径按安装后的位置解析）：

| 命令 | 用途 |
|---|---|
| `node scripts/lessons.mjs resolve` | 解析并**校验** KB 根；成功打印路径，失败打印原因 + 下一步 |
| `node scripts/lessons.mjs deferred` | 打印推迟项清单 + 命中判定 + 总数报告 |
| `node scripts/lessons.mjs migrate --to <path>` | 迁移（四条硬校验 + 复制 + 校验 + 切指针） |

无 Node 时（`node -v` 失败）：**明确告知脚本不可用**，改为手工操作，且**不得假装成功**。

## Bootstrap：库未初始化时（`resolve` 报「未找到错题集指针」）

1. **必须询问用户指定位置**——**不得静默落 C 盘**（错题集会持续增长）。给出建议（非 C 盘）但不替用户决定。
2. 拿到位置后按 spec §4.2 建骨架：
   - `<KB>/index.md`（含「候选与推迟」节——把 spec §11.2 的 C1–C6 与 §11.1 的 L3/L4 **逐条**写入，形成运行态权威）
   - `<KB>/projects/`、`<KB>/universal/`
3. 写指针 `<用户 home>/.agents/lessons.config.json`，内容 `{"store":"<KB 绝对路径>","schemaVersion":1}`。
   - 若 `~/.agents/` 不存在 → 先创建；创建失败 → 退到 `~/.trae-cn/lessons.config.json` 并**告知实际落点**
   - 若指针**已存在但损坏** → **禁止静默覆盖**：先备份为 `lessons.config.json.bak-<时间戳>`，再写新指针，并报告备份路径
4. 收尾跑一次 `resolve` 验证。

## 迁移（用户说「库搬家 / 换盘 / 我要迁移错题集」）

调用 `migrate --to <目标>`，它内含四条硬校验（目标 ≠ 源 / 不在源内 / 不是源祖先 / 目标空或不存在）。失败时按脚本给出的 `stage` 与原因向用户解释。
**锁**：迁移期间源根有 `.migrating` 标记；开始时提示用户「若有其他流程正在写库请先停」。
**迁移后**：脚本**不自动删旧库**——由用户决定。

## 轮询推迟项（会话开始，或用户问「有什么推迟项该做了」）

跑 `deferred`，逐条核对信号：

- **有命中** → 动手前先向用户提出：命中项编号 + 信号证据，并说明是否升格为独立 spec
- **无命中** → 一句话报告，**必须含计数**（如「推迟项 6 条，均未命中信号」）——防轮询退化成形式主义

## 常见错误

| 错误 | 纠正 |
|---|---|
| 用户没给位置就自己选了 | 停手，先问。默认落 C 盘是明确禁止的 |
| 把错题集建在项目仓库里 | 拒绝——含个人数据，会被提交。`resolve` 也会拦 |
| 指针损坏时直接覆盖 | 先备份再写，并报告备份路径 |
| 迁移后顺手删了旧库 | 不删。由用户决定 |
| 报告没带计数 | 必须带「推迟项 N 条」 |
```

- [ ] **Step 3: GREEN 复跑 —— 同一场景 + 技能**

重跑 Step 1 的同一 prompt，但这次**给子代理加载 `managing-lessons-store` 技能**（把 SKILL.md 内容作为系统上下文注入）。

Expected: **PASS** —— 子代理先询问位置、拒绝静默落 C 盘、并说明 bootstrap 四步。若仍失败，把新出现的借口记下，回到 Step 2 补反制，再复跑（REFACTOR）。

- [ ] **Step 4: 压力叠加复跑（discipline 型必需）**

同一 prompt 后面追加三种压力：

```
（追加）我赶时间，你别问了直接建吧，随便哪都行。
（追加）我已经在项目里建了 docs/lessons/ 了，你就用那个吧。
（追加）不用太较真，先建起来再说。
```

Expected: **PASS** —— 仍坚持询问/拒绝仓库内落点。失败则在 SKILL.md 的「常见错误」表补对应反制行（逐字收录子代理的借口）。

- [ ] **Step 5: 写证据 + 交付检查**

写 `task-4-report.md`：RED 基线原文、GREEN 复跑结论、压力复跑结论、REFACTOR 补的反制行、`git status --porcelain -uall`。

改动文件（**由用户 commit**）：`skills/managing-lessons-store/SKILL.md`

---

## Task 5: `using-retrospective/SKILL.md`（入口薄路由）

**Files:**
- Create: `skills/using-retrospective/SKILL.md`
- Create: `.superpowers/sdd/2026-09-27-retro-suite.md/task-5-red.md`

**Interfaces:**
- Consumes: Task 4 的技能（路由目标之一）
- Produces: 技能 `using-retrospective`（Task 6–8 的 `REQUIRED BACKGROUND`）

- [ ] **Step 1: RED —— 基线场景**

派子代理（**不给技能**）prompt 逐字：

```
我们刚交付了一个功能，我想复盘一下。请直接开始，给我分析结果。
（补充：我希望复盘结果以后能自动生效，不用我每次提醒。）
```

记录：它是否**跳过事实采集直接给分析**（凭印象而非证据）？是否把「以后自动生效」理解成「写进某个文档」而非「rule / skill / automation」？

Expected: **FAIL** —— 大概率跳过事实包直接给「我觉得这次的问题是…」式印象分析。

- [ ] **Step 2: GREEN —— 写技能**

创建 `skills/using-retrospective/SKILL.md`：

```markdown
---
name: using-retrospective
description: Use when 阶段/里程碑收口、session 即将结束、用户说「复盘/回顾/总结一下这个过程」「这段是不是可以沉淀一下」、或要判断一条教训该进全局还是项目规则时。Do not use for 代码审查（走 open-code-review）、bug 定位（走 systematic-debugging）、或仅要一份过程时间线（那是 retro-collect 单独可做）。
---

# 复盘套件入口（using-retrospective）

## 这个套件是什么

四个环节，一环扣一环，**每个环节也可单独调用**：

| 环节 | 技能 | 何时进 |
|---|---|---|
| ① 采集事实 | `retro-collect` | 还没有事实包 |
| ② 分析 | `retro-analyze` | 已有事实包，要出问题/根因/优先级 |
| ③ 归置落地 | `retro-institutionalize` | 已有复盘，要把教训写回规范 |
| ④ 库维护 | `managing-lessons-store` | 库未建 / 要迁移 / 要轮询推迟项 |

**路由规则**：先看手上已有什么产物——无产物从 ①；有事实包从 ②；有复盘从 ③。**不得跳环**（没有事实包就做分析 = 凭印象，禁止）。

## 产物关系图

```
多源输入（OCR 原文 / multi-lens 结论 / session 总结 / 用户的复盘请求）
      │
      ▼
  ① 事实包  <日期>-facts.md     ← 本次过程的证据集（纯事实、零判断）
      ▼
  ② 复盘    <日期>-retro.md     ← 本次过程的分析（只引条号 + 加判断）
      ├────────► ③ KB 条目       ← 跨 session 累积索引（一行一条，稳定 ID）
      └────────► ④ 落地载体      ← 生效物（自动化 / rule / skill / memory）

引用方向：②引①的条号；③④引②的产物；规则 provenance 引③的 ID
反方向不存在——永不把下游内容回抄到上游（防第二份真相）
```

## 推迟项三要素（缺任一 → 不是「推迟」，是「丢弃」）

① 编号（可引用）② 动机锚（挂在 KB 的一条 `open` 条目上）③ **可观测复活信号**（可 grep，不是日期）

不用日期：日期到点会诱使「为做而做」；信号到点才是真需求。**动机锚为空（如「—」）的候选不合格，登记时补齐或直接丢弃。**

## 前置未满足时：拒绝并给下一步

| 场景 | 行为 |
|---|---|
| 要分析但无事实包 | 拒绝；建议先跑 `retro-collect` |
| 要归置但无复盘文件 | 拒绝；建议先跑 `retro-analyze` |
| KB 未初始化 | 拒绝；转 `managing-lessons-store` 引导 bootstrap |
| `resolve` 校验失败 | 拒绝；按提示引导重建/迁移 |

**为什么拒绝而非降级**：降级会产出「看起来对但依据缺失」的产物，污染 KB——污染比中断贵得多。

## 里程碑收口时主动建议

当一次交付被提交、或一个 spec 阶段收口时，**建议**（不强制）用户复盘：「刚交付 X，要不要复盘一下？」——只建议，用户说不做就停。

## 会话开始时的固定动作

先跑 `managing-lessons-store` 的 `deferred` 轮询推迟项（见该技能）。有命中则先向用户提出。
```

- [ ] **Step 3: GREEN 复跑**

同一 prompt + 加载本技能。
Expected: **PASS** —— 先说明路由（从 ① 进），拒绝直接给印象分析。

- [ ] **Step 4: 路由五场景验收（spec §9.3 判据：5/5）**

对下列 5 个场景各派一次子代理（加载本技能），记路由判定：

| # | 场景 | 期望路由 |
|---|---|---|
| 1 | 「复盘一下刚才这段开发」 | ① `retro-collect` |
| 2 | 「这是事实包 <路径>，帮我分析」 | ② `retro-analyze` |
| 3 | 「这是复盘 <路径>，把教训落下去」 | ③ `retro-institutionalize` |
| 4 | 「错题集该放哪？」 | ④ `managing-lessons-store` |
| 5 | 「有什么推迟项该做了？」 | ④ `managing-lessons-store` |

Expected: 5/5 正确。任一错误 → 回到 Step 2 改路由表措辞。

- [ ] **Step 5: 写证据 + 交付检查**

写 `task-5-report.md`：RED 原文、GREEN 结论、五场景路由结果表、`git status --porcelain -uall`。

改动文件（**由用户 commit**）：`skills/using-retrospective/SKILL.md`

---

## Task 6: `retro-collect/SKILL.md` + 事实包模板（含零判断 fixture）

**Files:**
- Create: `skills/retro-collect/SKILL.md`
- Create: `skills/retro-collect/examples/`（fixture：正例 3 + 反例 3）
- Create: `.superpowers/sdd/2026-09-27-retro-suite.md/task-6-red.md`

**Interfaces:**
- Consumes: Task 5 的路由契约
- Produces: 技能 `retro-collect`；事实包落点约定 `<KB>/projects/<项目标识>/<YYYY-MM-DD>-facts.md`

- [ ] **Step 1: RED —— 基线场景**

派子代理（**不给技能**）prompt 逐字：

```
把刚才我们这段开发过程收集成复盘信息，写到文件里。要求：只收集事实，先不要给结论。
```

记录：是否混入判断词（「应该」「建议」「显然」「次数过多」）？是否**编造精确数字**（如无据的耗时）？是否把推测当事实（如拿被归一化的 mtime 做时间线）？

Expected: **FAIL** —— 大概率出现「应该/建议」且数字无来源。

- [ ] **Step 2: GREEN —— 写技能（模板即结构约束）**

创建 `skills/retro-collect/SKILL.md`：

```markdown
---
name: retro-collect
description: Use when 需要采集一段开发过程的客观事实（时间线 / 计数 / 异常事件）作为复盘依据，或用户说「收集复盘信息」「盘点一下这个 session」「整理一下这段过程」时。Do not use for 出结论、找根因、定优先级（那是 retro-analyze）。
---

# 采集事实包（retro-collect）

## 唯一产出

一个**事实包**文件，落 `<KB>/projects/<项目标识>/<YYYY-MM-DD>-facts.md`。
KB 未初始化时：**REQUIRED SUB-SKILL:** 先用 `managing-lessons-store` 完成 bootstrap。
（项目标识取自仓库目录名，入库前须清洗：去 `|`、换行、路径分隔符、控制字符；空白折为 `-`。）

## 事实包模板（逐字使用）

```markdown
# 事实包：<session/阶段标识>

- 范围：<起止锚点>
- 生成：<日期>｜生成者：<agent/人>

## 1 时间线锚点
| 时刻 | 事件 | 来源（文件 mtime / git log / 命令输出） |

## 2 计数
| 项 | 值 | 来源 |

## 3 异常事件
| # | 现象 | 证据 |

## 4 证据清单

## 5 未取得的数据

## 6 声明
本文件不含判断、不含方案、不含优先级。分析见 <同日>-retro.md。
```

## 硬约束（三条，缺一即不合格）

1. **只写事实**：不写判断、不写方案、不写优先级。「异常事件」栏只描述**发生了什么**，不评价好坏。
2. **每条事实必须带来源**，来源只能是这两种：
   - **本次实跑的命令输出**（把原文放进引用块）
   - **文件直读**（路径 + 行号 / hash）
   **禁用推测值**——例如文件 mtime 若被批量归一化，就**不能**拿它当时间线证据（真实教训：曾据此推断出错误的时间线）。
3. **原文一律放进引用块或代码块**。原因：这样「只写事实」的检查只需扫非引用块，**不需要写豁免条款**（豁免条款会整体削弱约束）。例：

```markdown
## 3 异常事件
| # | 现象 | 证据 |
|---|---|---|
| 1 | 校验脚本报路径冲突 | > `Error: EEXIST: file already exists, mkdir 'D:\\x'` |
```

## 第 5 栏「未取得的数据」不可省

拿不到的数据要**诚实列出并说明为什么**（如「无逐阶段计时，只有一次 OCR 实测 4m58s」）。空着等于伪装完整。

## 与上游的衔接

多源输入（OCR 评审原文、multi-lens 评审结论、session 总结）**只作证据来源**，不得把它们的**结论**当事实抄进来——结论属于 `retro-analyze`。

## 常见错误

| 错误 | 纠正 |
|---|---|
| 写了「派发次数过多」 | 只写「派发 22 次」；评价属 retro-analyze |
| 数字没有来源 | 每个数字补来源列；无来源就进「未取得的数据」 |
| 拿归一化的 mtime 当时间线 | 标注「未用作证据」并说明原因 |
| 把 OCR 的结论抄进事实包 | 结论归 retro-analyze，事实包只记原文 |
```

- [ ] **Step 3: 建零判断 fixture（验收用，不写进技能正文）**

创建 `skills/retro-collect/examples/verdict-fixtures.md`：

```markdown
# 事实包「零判断」验收 fixture

黑名单（评价/建议类）：应该 | 建议 | 需要 | 值得 | 更好 | 显然 | 糟糕 | 不足 | 优化 | 改进 | 问题

作用范围：事实包中**非引用块**的叙述文本（引用块/代码块内的原文不扫）

## 正例（应通过，0 命中）
1. 子代理派发 22 次，其中 19 次返回有效结果
2. verify 运行 12 次，耗时区间 40–75 秒
3. 文件 mtime 被批量归一化至 09-27 10:13，故未用作时间线证据

## 反例（应拦下）
1. 派发次数过多，应该合并            → 命中「过多 / 应该」
2. 建议以后减少全量复跑              → 命中「建议」
3. 这个问题显然是设计缺陷            → 命中「问题 / 显然」
```

- [ ] **Step 4: GREEN 复跑 + 零判断验收**

同一 prompt + 加载技能。产出的事实包跑：

```bash
# 非引用块文本扫黑名单（应 0 命中）
grep -nE '应该|建议|需要|值得|更好|显然|糟糕|不足|优化|改进|问题' <事实包路径> | grep -v '^\s*>' || echo "0 hits（通过）"
```
Expected: `0 hits（通过）`

- [ ] **Step 5: 写证据 + 交付检查**

写 `task-6-report.md`：RED 原文、GREEN 结论、fixture 的 grep 结果、`git status --porcelain -uall`。

改动文件（**由用户 commit**）：`skills/retro-collect/SKILL.md`、`skills/retro-collect/examples/verdict-fixtures.md`

---

## Task 7: `retro-analyze/SKILL.md` + 复盘模板

**Files:**
- Create: `skills/retro-analyze/SKILL.md`
- Create: `.superpowers/sdd/2026-09-27-retro-suite.md/task-7-red.md`

**Interfaces:**
- Consumes: Task 6 的事实包（输入）
- Produces: 技能 `retro-analyze`；复盘落点 `<KB>/projects/<项目标识>/<YYYY-MM-DD>-retro.md`；KB 条目（`ledger.md` 行，状态 `open`）

- [ ] **Step 1: RED —— 基线场景**

给子代理一份**真实事实包**（用 Task 6 产出的那份，**不给技能**）prompt 逐字：

```
这是事实包。请做复盘。
```

记录：是否**给出问题但不指向事实包条号**（无依据）？优先级是否**只有结论没有判据**？

Expected: **FAIL** —— 大概率出现无条号的问题 + 凭感觉的优先级。

- [ ] **Step 2: GREEN —— 写技能（模板即结构约束）**

创建 `skills/retro-analyze/SKILL.md`：

```markdown
---
name: retro-analyze
description: Use when 已有事实包，需要产出问题清单、根因、解决方案、普遍性与优先级；或用户说「做复盘」「分析一下」「这段的问题在哪」时。Do not use for 采集事实（走 retro-collect）、把结论落成规范（走 retro-institutionalize）。
---

# 复盘分析（retro-analyze）

## 前置

输入是一份**事实包**路径。**没有事实包就拒绝**并建议先跑 `retro-collect`——凭印象分析会污染 KB。
事实包路径不存在 → 拒绝，不做降级猜测。

## 唯一产出（两件）

1. 复盘文件：`<KB>/projects/<项目标识>/<YYYY-MM-DD>-retro.md`
2. KB 条目：向该项目的 `ledger.md` **追加行**（状态**先写 `open`**，落置成功后由 `retro-institutionalize` 改为 `landed`）

写入顺序固定为「**先条目 → 后落地 → 再改状态**」（防止中断后重跑重复落规则）。

## 复盘模板（逐字使用）

```markdown
# 复盘：<session/阶段标识>

- 事实包：<路径>

## 1 问题清单
| # | 事实包条号 | 问题 | 根因 | 维度 | 方案 | 是否普遍 | 优先级 |

## 2 归置结果
| 条目 ID | 教训 | 走 Step 几 | 落点（载体 + 路径）|

## 3 附录：规则裁决

## 4 未决与待验证
```

## 硬约束（两条）

1. **第 1 列的「事实包条号」必填**。写不出条号 → 说明这不是基于事实的问题，删掉它，或先回 `retro-collect` 补事实。
2. **「优先级」必须带判据**，不得只给「P1」。判据写法示例：
   - `P1 — 触发频率高（本次 3 次）+ 后果不可逆（数据损坏）`
   - `P2 — 一次性成本（首次建库时才有）`

## 四栏口径

| 栏 | 含义 | 取值 |
|---|---|---|
| 维度 | 影响的改进面 | 健壮度 / 用户体验 / 性能 |
| 是否普遍 | 换项目还成立吗 | 是（通用）/ 是（本项目）/ 局部 |
| 方案 | 修复动作 | 一句可执行的话；不写「加强/优化」这类不可执行词 |
| 根因 | 为什么会这样 | 区别于现象：现象是「重复落规则」，根因是「写规则与写记录的顺序未定义」 |

## KB 条目行格式（追加到 ledger.md）

```markdown
| ID | 日期 | 项目 | 来源 | 问题 | 根因 | 维度 | 修复 | 载体 | 状态 |
| L-YYYY-MM-DD-NNN | <日期> | <标识> | 复盘 | <问题> | <根因> | <维度> | <方案> | 未定 | open |
```

**转义规则**：自由文本栏位内 `|` 写作 `\|`，换行写作 `<br>`。不转义会破整份表。

## 常见错误

| 错误 | 纠正 |
|---|---|
| 问题没有条号 | 补号或删掉该问题 |
| 优先级只有 P1 没有判据 | 必须写触发频率/后果/成本中至少一项 |
| 复盘中复述了事实包全文 | 只引条号——复盘要做薄，防第二份真相 |
| 条目状态直接写 landed | 先 open，落地成功后才改 |
```

- [ ] **Step 3: GREEN 复跑（用 S6 真实个案回归）**

用 **S6 的真实事实包**（本次会话产出的那份）跑一遍：加载技能 → 产出复盘 → 对照 **已存在的 S6 复盘文档**（`.superpowers/sdd/2026-09-26-s6-link-direct.md/` 与 `docs/review/20260927/s6-link-direct-retro.md`）。

Expected: **PASS** —— 问题条数、根因、优先级量级与人工版**基本一致**（不要求逐字），且每条都带条号 + 优先级判据。

- [ ] **Step 4: 写证据 + 交付检查**

写 `task-7-report.md`：RED 原文、GREEN 结论 + 与人工版的差异对照、`git status --porcelain -uall`。

改动文件（**由用户 commit**）：`skills/retro-analyze/SKILL.md`

---

## Task 8: `retro-institutionalize/SKILL.md`（归置落地）

**Files:**
- Create: `skills/retro-institutionalize/SKILL.md`
- Create: `.superpowers/sdd/2026-09-27-retro-suite.md/task-8-red.md`

**Interfaces:**
- Consumes: Task 7 的复盘文件 + KB 条目
- Produces: 技能 `retro-institutionalize`；规则文件（全局 `user_rules/rule-<epoch>.md` 或项目 `.trae/rules/*.md`）、自动化、skill 改动、memory 写入；并把条目状态更新为 `landed(→载体)`

- [ ] **Step 1: RED —— 基线场景**

派子代理（**不给技能**）prompt 逐字：

```
这是复盘文件 <路径>，请把这些教训落地，让以后能自动生效。
（补充：项目是 d:/Seed/local-pack-manager，用的是 Trae CN。）
```

记录：是否**把项目专属规则写进全局**？是否**不查重就新增**？是否**直接覆盖既有规则而不备份**？

Expected: **FAIL** —— 大概率不区分全局/项目，且直接新增。

- [ ] **Step 2: GREEN —— 写技能（含决策树原文）**

创建 `skills/retro-institutionalize/SKILL.md`（决策树逐字来自 spec §2）：

```markdown
---
name: retro-institutionalize
description: Use when 复盘结论已定，需要把教训写回能自动生效的规范（全局规则 / 项目规则 / 自动化 / 技能 / 记忆）；或用户说「把这套经验沉淀下去」「以后别犯这个错了」时。Do not use for 分析出结论（走 retro-analyze）。
---

# 归置落地（retro-institutionalize）

## 归置决策树（核心契约）

```
Step 0  它的「修复方案」是什么？答不出 → 复盘未完成，回炉（禁止往下走）

Step 1  既有承载里有相似的吗？
        （查五处：user_rules/ + <项目>/.trae/rules/ + memory/*.md + 错题集 KB + 既有 skills）
        ┌ 有 → 【升级，不新增】为什么既有没拦住？
        │        a. 触发面未覆盖（新场景） → 扩既有触发面（globs/description/作用域）
        │        b. 既有约束本身有问题     → 修既有（太宽/太窄/判据错）
        │        c. 载体选错了             → 换载体（goto Step 2）
        └ 无 ↓

Step 2  能否机械判定？（正则 / 脚本 / 测试 / CI 可验，且有执行点）
        能 → 【自动化】写进测试 / lint / 校验脚本 —— 不写成文档
        否 ↓

Step 3  是多步过程 / 技法吗？（有步骤、判断点、反例集）
        是 → 【skill】
        否 ↓

Step 4  能想象出「违反」的具体形态吗？（可证伪）
        能（约束）     → 【rule】
        不能（事实/偏好） → 【memory】

Step 5  归属（rule 与 memory 通用）
        完全可抽象为通用       → 全局
        有通用内核 + 项目外壳  → 【拆两条】内核→全局，外壳→项目
        完全绑项目             → 项目
```

**Step 1 是强制前置**：默认动作是**升级既有**，新增是必须举证的例外。

**Step 2 的性能闸门**：新增自动化前必须回答「跑在哪个执行点？单次成本多少？」——答不出则不许加。自动化优先 ≠ 自动化无预算。

## 四载体落点

| 载体 | 落点（Windows） | 加载方式 |
|---|---|---|
| 自动化 | 项目内（tests/、校验脚本） | 执行时强制 |
| rule（全局） | `%userprofile%\.trae-cn\user_rules\rule-<epoch>.md` | 全量注入（**无 frontmatter**） |
| rule（项目） | `<项目>/.trae/rules/*.md` | 注入（可条件：`alwaysApply`/`globs`/`description`） |
| skill | 本套件 `skills/<名>/` | 按需加载 |
| memory（全局/项目） | `%userprofile%\.trae-cn\memory\user_profile.md` / `…\projects\{project_path}\project_memory.md` | 注入 |

**易错**：`alwaysApply` / `globs` / `description` **只属于项目规则**；全局规则是纯 markdown，**写了无效**。

## 写入顺序（崩溃安全）

```
① 先在 ledger 把该条目标记 open（含拟载体与拟落点）
② 再落规则 / 自动化 / skill 改动
③ 成功后把条目状态改为 landed(→载体)
```
① 永不后于 ② —— 否则中断会留下「规则已落但无记录」，重跑必然重复落规则。

## 修订既有规则：先备份，再一行式确认

1. **先备份**旧版到 `<KB>/projects/<项目标识>/rules-history/<规则名>-<YYYYMMDD-HHmmss>.md`
2. 展示「旧 → 新」各一行摘要，等用户 y/n（**仅修订时**触发；新增不确认）
3. **备份失败 → 中止修订**（不得无备份覆盖）

## provenance（每条规则强制）

```markdown
# <规则标题：一句祈使句>

> 来源：<KB 条目 ID>｜证据：<原始证据指向>｜落地：YYYY-MM-DD

<正文：规则 + 反例>
```

- 来源**一律用 KB 条目 ID**（不用文件路径——迁移后会失效）
- 规则必须是**可证伪的祈使句**（能想象出违反的具体形态）

## 真冲突判定

两条规则算真冲突 ⇔ ① 作用域重叠 **且** ② 对同一动作给出不相容指令。
否则不算：作用域不相交 → 各自生效；一条被另一条包含 → 更具体者生效。
**真冲突的自动消解本期不做**——停手报给用户，并记入复盘的「附录：规则冲突裁决」。

## 防重复检查（写入前必做）

grep 五处既有承载，有同义规则 → **改既有，不新增**。

## 收尾

落置完成后：提示用户「**Trae 规则/技能改动建议开新对话才完全生效**」，并在复盘文件的「归置结果」表补落点。

## 常见错误

| 错误 | 纠正 |
|---|---|
| 项目专属规则写进全局 | 过 Step 5；含项目专有标识（文件/模块/导出名）→ 项目级 |
| 不查重直接新增 | Step 1 必须先查五处 |
| 覆盖旧规则不备份 | 先备份，备份失败即中止 |
| 全局规则写了 `alwaysApply` | 全局规则无 frontmatter，写了无效 |
| 先落规则后写条目 | 顺序反了；①必须是条目 |
| 忘了提醒「开新对话生效」 | 收尾必须提示 |
```

- [ ] **Step 3: 决策树回放验收（spec §10 P4 判据）**

用 **S6 复盘的 5 条真实教训**跑回放，逐条给出决策树路径与落点，人工核对：

| 教训（真实样本） | 期望路径 |
|---|---|
| 禁止同一轮对同一文件并行 SearchReplace | Step 1 无命中 → Step 2 不能机械判定（工具层做不到）→ Step 3 否 → Step 4 可证伪 → Step 5 完全通用 ⇒ **全局 rule** |
| PM 展示串必须走 `pmExecutable` 单源 | Step 5 含项目导出名 ⇒ **项目 rule** + `globs: src/core/install.ts, src/commands/link.ts` |
| package.json 写回文本级保真 | Step 2 可机械判定（测试可验）⇒ **自动化**（写测试，不写文档） |
| 复盘套件自身的三步采集/分析/归置流程 | Step 3 多步过程 ⇒ **skill** |
| 用户偏好中文回复 | Step 4 无「违反」形态（事实/偏好）⇒ **memory（全局）** |

Expected: 5/5 与期望一致。不一致 → 修决策树步骤措辞。

- [ ] **Step 4: GREEN 复跑（含中断重跑）**

同一 prompt + 加载技能。另加一个中断验证：**手工制造「条目已 open 但规则未落」**（改 ledger 一行）→ 再跑一次 → 断言**不会重复新增规则**，而是续做并改状态。

Expected: **PASS** —— 续做而非重复。

- [ ] **Step 5: 写证据 + 交付检查**

写 `task-8-report.md`：RED 原文、GREEN 结论、决策树回放 5/5 表、中断重跑结论、`git status --porcelain -uall`。

改动文件（**由用户 commit**）：`skills/retro-institutionalize/SKILL.md`

---

## Task 9: 常驻轮询规则 + README + LICENSE + 安装实验

**Files:**
- Create: `%userprofile%\.trae-cn\user_rules\rule-<epoch>.md`（**仓库外**）
- Create: `README.md`
- Create: `LICENSE`
- Create: `.superpowers/sdd/2026-09-27-retro-suite.md/task-9-report.md`

**Interfaces:**
- Consumes: 全部前序任务（规则引用 `managing-lessons-store` 技能名）
- Produces: 常驻轮询机制生效；仓库可发布

- [ ] **Step 1: 写常驻轮询规则（仓库外，纯 md 无 frontmatter）**

先取当前 epoch 毫秒：`node -e "console.log(Date.now())"`，用其结果命名文件 `rule-<epoch>.md`，内容：

```markdown
# 开工时轮询推迟项

> 来源：<KB 条目 ID 或"套件初始化">｜证据：本次设计对话「推迟项跨 session 蒸发」讨论｜落地：<今日日期>

会话开始时先用 `managing-lessons-store` 技能跑推迟项轮询，逐条核对「复活信号」。

- 有命中 → 动手前先向用户提出：命中项编号 + 信号证据，并说明是否升格为独立 spec。
- 无命中 → 一句话报告「推迟项 N 条，均未命中信号」。

报告必须含当前计数（让进度可见，防轮询退化成形式主义）。
错题集位置由脚本解析，规则里不硬编码路径——换位置无需改规则。
```

**注意**：**不要写 frontmatter**（全局规则不支持；写了无效）。

- [ ] **Step 2: 验证规则被注入**

**开一个新对话**，问一句无关的话（如「今天星期几」），观察注入的规则里是否出现「开工时轮询推迟项」。

Expected: 新对话的规则上下文含该条。

- [ ] **Step 3: 写 README**

创建 `README.md`：

```markdown
# retro-skills

一套把「开发过程犯过的错」沉淀成自动生效规范的 Agent Skill 套件：采集事实 → 复盘分析 → 归置落地（rule / skill / memory / 自动化），并维护一份跨项目累积的错题集。

## 安装

```bash
# 从本地路径
npx skills add <本仓库路径> --agent trae-cn -g
# 发布后从 GitHub
npx skills add SeedHuang/retro-skills --agent trae-cn -g
```

`-g` 为全局（跨项目）。安装默认使用 symlink 模式（单一事实源、便于更新）。

## 五个技能

| 技能 | 作用 |
|---|---|
| `using-retrospective` | 入口：判断时机、路由到对应环节 |
| `retro-collect` | 采集事实包（纯事实、零判断） |
| `retro-analyze` | 产出问题清单 / 根因 / 优先级 |
| `retro-institutionalize` | 归置落地（决策树 + provenance + 备份） |
| `managing-lessons-store` | 错题集库的初始化 / 迁移 / 推迟项轮询 |

## 数据与仓库分离

**本仓库不含任何个人数据。** 错题集（累积的教训库）存在**用户指定**的本地目录，位置记录在 `~/.agents/lessons.config.json`，**永不进入本仓库**。

## 设计文档

`docs/superpowers/specs/2026-09-27-retro-suite-design.md`

## License

MIT
```

- [ ] **Step 4: 写 LICENSE**

创建 `LICENSE`：MIT 标准全文，版权行 `Copyright (c) 2026 SeedHuang`。

- [ ] **Step 5: 四项安装实验（spec §8.5 V1–V4）**

| # | 实验 | 方法 | 记录 |
|---|---|---|---|
| V1 | 本地路径安装时 canonical 是源目录还是缓存副本 | 装一个一次性假技能 → 改其 SKILL.md → 开新对话看 description 是否变 | 变 = 源目录（可弃用 junction）；不变 = 副本（需 `skills update`） |
| V2 | Trae CN 是否读取 symlink 形式的技能目录 | V1 天然覆盖（若技能出现在列表中即可读） | 是/否 |
| V3 | Gitee 作为源是否可用 | 用 Gitee 公开仓试 `npx skills add` | 可用/不可用（不可用则只走 GitHub + 本地路径） |
| V4 | `npx skills add` 是否按 `<repo>/skills/*` 枚举全部技能 | 本地路径试装 5 个技能，看是否一次装齐 | 一次装齐 / 需逐个 `--skill` |

Expected: 四项各有明确结论（**未达结论不得标记完成**）。结论回写到 spec §8.5。

- [ ] **Step 6: 端到端手工验收（真实使用一次）**

在 **lpm 项目**里真实走一遍：
1. 说「复盘一下刚交付的 S6」→ 观察是否路由到 `retro-collect`
2. 采集事实 → 分析 → 归置一条真实教训
3. 检查：KB 文件落点正确、规则带 provenance、条目状态为 `landed`

Expected: 全链走通；KB 在用户指定盘、仓库 `git status` 无 KB 文件。

- [ ] **Step 7: 写证据 + 交付检查**

写 `task-9-report.md`：规则的注入验证结果、V1–V4 四项结论、端到端验收记录、`git status --porcelain -uall`。

改动文件（**由用户 commit**）：`README.md`、`LICENSE`、`docs/superpowers/specs/2026-09-27-retro-suite-design.md`（回写 V1–V4 结论）
**仓库外改动**：`%userprofile%\.trae-cn\user_rules\rule-<epoch>.md`

---

## 自审记录（plan self-review）

### 1. Spec 覆盖检查

| spec 节 | 落点任务 |
|---|---|
| §2 归置决策树 | Task 8（逐字含入 SKILL.md） |
| §2.2 性能闸门 | Task 8（决策树内） |
| §2.3 四载体 + 全局/项目区别 | Task 8（落点表 + 易错提示） |
| §3.1–3.2 写法 + provenance | Task 8 |
| §3.3 真冲突判定 | Task 8 |
| §3.4 防重复检查 | Task 8 |
| §3.5 备份 + 确认 | Task 8 |
| §3.6 写入顺序 | Task 8 + Task 7（条目先 open） |
| §4.1 位置/指针/五校验/bootstrap | Task 1（校验）+ Task 4（bootstrap） |
| §4.2 目录结构 + 标识规范化 | Task 4（骨架）+ Task 6（清洗规则） |
| §4.3 条目 schema + 转义 | Task 7 |
| §4.4 多源归档 | Task 6（只作证据来源） |
| §4.5 脚本三命令 | Task 1/2/3 |
| §4.6 迁移七步 + 锁 + 四校验 | Task 3 |
| §5.1 事实包模板 + 结构化隔离 | Task 6 |
| §5.2 复盘模板 | Task 7 |
| §6 五技能契约（name/description/输入输出） | Task 4–8（frontmatter 逐字） |
| §6.1 内容归属 | Task 5–8 各自的「职责边界」节 |
| §6.2 产物关系图 | Task 5 |
| §6.3 错误传播契约 | Task 5 |
| §7.1 推迟项三要素 | Task 5 + Task 4 |
| §7.2 常驻轮询规则 | Task 9 |
| §8.1 仓库布局 | 全任务路径 |
| §8.2 KB 与仓库分离 | Task 1（`isInsideGitRepo` 校验）+ Task 9（README 声明） |
| §8.3 桥 | Task 9（安装命令 + 实验） |
| §8.4 前置与失败行为 | Task 4（无 Node 降级）+ Task 9（实验） |
| §9 测试策略 | 全任务（脚本走 `node:test`；技能走 RED-GREEN） |
| §10 分期 P0–P5 | Task 1–9 映射 |
| §11 候选 | Task 4（bootstrap 写入 KB） |
| §13 修剪记录 | 不落地（记录性） |
| §15 开放项 O1–O7 | O1→Task 9 Step 5；O5→Task 5（里程碑建议）；O7→Task 9（push 后确认）；O3 留在原项目 |

无遗漏。

### 2. 占位符扫描

已逐条排查：无 `TBD` / `TODO` / 「适当处理错误」/「类似 Task N」/「为上述写测试」式的空步骤。每个代码步骤都给了真实代码；每个技能步骤都给了 frontmatter 与正文要求（关键段逐字）。

**两处刻意引用 spec 而非复制**（非占位符）：
- Task 4 的「把 spec §11.2 的 C1–C6 与 §11.1 的 L3/L4 逐条写入 KB」——因为 spec 随 plan 同行，且逐条复制会造成第二份真相（正是 spec 要消灭的）
- Task 6 的项目标识清洗规则 —— 已把规则本身写在技能正文里，仅在 Task 6 备注来源

### 3. 类型一致性

- `resolveStore` / `checkStore` / `parseDeferredSection` / `evaluateSignals` / `runDeferred` / `validateTarget` / `hashTree` / `migrate` / `countLedger`：Task 1–3 定义并在后续引用处**签名一致**
- CLI 命令名 `resolve` / `deferred` / `migrate --to`：Task 1–3 定义，Task 4 的 SKILL.md 引用一致
- 指针路径 `~/.agents/lessons.config.json`：Task 1 / Task 4 / Task 9 三处一致
- 技能名 5 个：Task 4–8 创建，Task 5 路由表引用一致
- KB 相对布局 `projects/<标识>/ledger.md`：Task 3（`countLedger`）/ Task 6 / Task 7 一致
- `counters` 字段 `{openCount, dims, projects, landedCount}`：Task 2 消费、Task 3 产出，字段名一致

### 4. 已标注的已知偏差

- Task 1 的 CLI 里 `isInsideGitRepo: () => false` 是**刻意占位**，Task 3 明确要求替换（已在两处都写明），非遗漏。
- Task 4 的 RED 场景基于「无技能时 agent 会静默选位置」的推断；若基线**未复现失败**，按 `writing-skills` 的规矩：**停止，不要写该技能**——回到 spec 复盘「这条约束是否真需要」。
