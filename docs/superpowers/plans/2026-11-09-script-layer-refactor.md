# 脚本分层与运行期收口 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把卡面命令白名单从「3 组 14 条混装」改成「组级单层 + 卡面只取 run」，并把账本计数、落点检查、两个 inspector 收口到 `scs`，迁移前后契约不破。

**Architecture:** 本仓（`retro-skills`）负责数据层与卡面生成；`scs`（`D:\Seed\skill-common-script`）负责跨仓命令。两者只通过「命令契约」耦合：exit code / code 串 / 首末行 / 参数语义。库形态的 `skill-dir.mjs` 不迁，只删副本。

**Tech Stack:** Node 22（ESM）｜TypeScript 5.9 + vitest 5 + commander 15（scs）｜Node 内置 `node:test`（本仓测试）

**Spec:** `docs/superpowers/specs/2026-11-09-script-layer-refactor-design.md`
**Testcase:** `docs/superpowers/specs/2026-11-09-script-layer-refactor-design-testcase.md`

## Global Constraints

- 本仓不改 `agents/*.md`：卡是生成物，走 `draft → 对照 → replace`。
- `scs` 仓新增命令不得写死本仓路径；项目根用 `--root`，数据根用 `--data` / `--engine` / `--projection`。
- 迁移前必须先有 `migration-baseline.json`；没有基线不得改调用方。
- 新门禁必须同时有 testcase（本 plan 的 Task 2 与 Task 5 各带一份）。
- 代码注释与 commit message 用中文。
- 不新增第三方依赖。

## 已实测确认的前提(2026-11-09)

| 项 | 值 |
|---|---|
| 允许命令 3 组 / 14 条 | `check.local=5 git.read=5 docgen.read=4 total=14` |
| 卡面授权单位 | `renderBoundary.mjs:72` 的 `allowGroups()` 只渲染组名 |
| 席位配置 | `seat-policy.mjs:5-9` 共 5 个具名席 |
| 本仓现有运行期脚本 | 3 个技能 / 10 个文件（`rule-inspector` 4 / `skill-inspector` 2 / `use-rule-skills` 4） |
| `skill-dir.mjs` 消费方 | 3 处：`check-all.mjs:13`、`skilldependencies/validate.test.mjs:8`、`skill-inspector/check.mjs:22` |
| `scs` 版本 / 测试覆盖 | `0.1.0`；实现 8 / 测试 5（无 test：`check` / `help` / `ledger`） |
| `scs` 旧默认值 | `check-criteria-engine.ts:43-47`：`tools/quality/criteria-engine` / `tools/quality/observable-terms.json` / `['skills','tools/quality']` |
| `round-check.md` 机械项 | 第 3、5 项自述为机械计数项（`:4` / `:14` / `:16`） |

## File Structure

| 仓 | 文件 | 职责 |
|---|---|---|
| retro-skills | `tools/docgen/builders/agents/policy/definitions/commands.mjs` | 组级 `layer` + 四组划分 + `validateCommandLayers`（纯函数，无 IO） |
| retro-skills | `tools/docgen/builders/agents/components/renderBoundary.mjs` | `allowGroups` 只放 run 组；配非 run 组抛 `NonRunGroupGranted` |
| retro-skills | `tools/docgen/builders/agents/policy/seat-policy.mjs` | 席位收口为 `git.read` + `tool.time` |
| retro-skills | `scripts/check-command-layer.mjs` | 新门禁：卡面不出现非 run 组 |
| retro-skills | `scripts/check-skill-dir-single-source.mjs` | 新门禁：`skill-dir.mjs` 恰 1 份 |
| retro-skills | `tools/docgen/builders/agents/components/outputFormats.mjs` | round-check 第 3 项证据格式 |
| retro-skills | `docs/devworkflows/20261109211349-script-layer-refactor/migration-baseline.json` | 迁移前契约基线 |
| retro-skills | `docs/devworkflows/20261109211349-script-layer-refactor/migration-map.md` | 「旧路径 → 新命令」映射表 |
| scs | `src/commands/ledger-numbers.ts` | C5 终态对账 + C2 声明适配 |
| scs | `src/commands/check-landings.ts` | 新命令 `check landings` |
| scs | `src/commands/check-skills.ts` | 承接 `skill-inspector/check.mjs` |
| scs | `src/commands/check-rules.ts` | 承接 `rule-inspector/score.mjs` |
| scs | `src/commands/list-skills.ts` | `list skills --json`（仅外部仓用） |

依赖方向：`commands.mjs → validatePolicy → renderBoundary → agents/*.md`；`scs commands → dist`。没有任何反向依赖。

---

### Task 1: 命令组 `layer` 与五码校验（F-01）

**Files:**
- Modify: `tools/docgen/builders/agents/policy/definitions/commands.mjs`
- Modify: `tools/docgen/builders/agents/components/validatePolicy.mjs`
- Test: `tools/docgen/builders/agents/test/policy-layer.test.mjs`

**Interfaces:**
- Consumes: 无
- Produces: `LAYERS: string[]`、`validateCommandLayers(groups): void`（抛 `Error.code ∈ {GroupLayerMissing, GroupLayerInvalid, GroupMixedLayer, GroupEmpty, VerbDuplicated}`）

- [ ] **Step 1: 写失败的测试**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { LAYERS, commandGroups, validateCommandLayers } from '../policy/definitions/commands.mjs'

test('F-01 四组 layer 合法且一组一层', () => {
  assert.deepEqual(Object.keys(commandGroups).sort(), ['docgen.read', 'git.read', 'repo.check', 'tool.time'])
  for (const [g, v] of Object.entries(commandGroups)) assert.ok(LAYERS.includes(v.layer), `${g}: ${v.layer}`)
})

test('缺 layer → GroupLayerMissing', () => {
  assert.throws(() => validateCommandLayers({ a: { verbs: ['x'] } }), (e) => e.code === 'GroupLayerMissing')
})

test('非法 layer → GroupLayerInvalid', () => {
  assert.throws(() => validateCommandLayers({ a: { layer: 'prod', verbs: ['x'] } }), (e) => e.code === 'GroupLayerInvalid')
})

test('同组两 layer → GroupMixedLayer', () => {
  assert.throws(() => validateCommandLayers({ a: { layer: ['dev', 'run'], verbs: ['x'] } }), (e) => e.code === 'GroupMixedLayer')
})

test('空 verbs → GroupEmpty', () => {
  assert.throws(() => validateCommandLayers({ a: { layer: 'run', verbs: [] } }), (e) => e.code === 'GroupEmpty')
})

test('verb 跨组 → VerbDuplicated', () => {
  assert.throws(() => validateCommandLayers({
    a: { layer: 'run', verbs: ['git status'] },
    b: { layer: 'dev', verbs: ['git status'] },
  }), (e) => e.code === 'VerbDuplicated')
})

test('R12 verbs 仍是字符串', () => {
  for (const g of Object.values(commandGroups)) for (const v of g.verbs) assert.equal(typeof v, 'string')
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test tools/docgen/builders/agents/test/policy-layer.test.mjs`
Expected: FAIL —— `validateCommandLayers is not a function`。

- [ ] **Step 3: 写实现**

`commands.mjs` 顶部加：

```js
export const LAYERS = ['build', 'dev', 'run']

function layerError(code, detail) {
  const e = new Error(`${code}: ${detail}`)
  e.code = code
  throw e
}

export function validateCommandLayers(groups) {
  const seen = new Map()
  for (const [name, g] of Object.entries(groups)) {
    const raw = g?.layer
    if (raw === undefined) layerError('GroupLayerMissing', name)
    const layer = Array.isArray(raw) ? (new Set(raw).size === 1 ? raw[0] : null) : raw
    if (layer === null) layerError('GroupMixedLayer', name)
    if (!LAYERS.includes(layer)) layerError('GroupLayerInvalid', `${name}:${layer}`)
    if (!Array.isArray(g.verbs) || g.verbs.length === 0) layerError('GroupEmpty', name)
    for (const v of g.verbs) {
      if (seen.has(v)) layerError('VerbDuplicated', `${seen.get(v)}/${name}: ${v}`)
      seen.set(v, name)
    }
  }
}
```

`commandGroups` 换成四组（`repo.check` / `tool.time` / `git.read` / `docgen.read`），逐字采用 spec §3.1。`validatePolicy()` 开头调用 `validateCommandLayers(CMD.commandGroups)`。同时在 `validateAgentData.mjs` 的 `EXIT` 表登记六个新码（`GroupLayerMissing` / `GroupLayerInvalid` / `GroupMixedLayer` / `GroupEmpty` / `VerbDuplicated` / `NonRunGroupGranted`）——不登记会被 `exitCodeFor` 兜底成 exit 2。

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test tools/docgen/builders/agents/test/policy-layer.test.mjs`
Expected: PASS，7 个用例全绿。

- [ ] **Step 5: Commit**

```bash
git add tools/docgen/builders/agents/policy/definitions/commands.mjs tools/docgen/builders/agents/components/validatePolicy.mjs tools/docgen/builders/agents/test/policy-layer.test.mjs
git commit -m "feat(policy): 命令组加 layer 并校验一组单层"
```

---

### Task 2: 卡面只取 run + 席位收口 + 新门禁（F-01）

**Files:**
- Modify: `tools/docgen/builders/agents/components/renderBoundary.mjs`
- Modify: `tools/docgen/builders/agents/policy/seat-policy.mjs`
- Create: `scripts/check-command-layer.mjs`
- Test: `tools/docgen/builders/agents/test/policy-layer-render.test.mjs`
- Regenerate: `agents/*.md`（经 `cli.mjs`）

**Interfaces:**
- Consumes: Task 1
- Produces: `allowGroups(groups, seat?)`；`scanCards(cardTexts, groups)`（新门禁的纯函数）

- [ ] **Step 1: 写失败的测试**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { allowGroups } from '../components/renderBoundary.mjs'
import { validateSeatLayers } from '../components/validatePolicy.mjs'
import { scanCards } from '../../../../../scripts/check-command-layer.mjs'

test('F-01 卡面只渲染 run 组', () => {
  const out = allowGroups(['git.read', 'tool.time'], 'reviewer-audit')
  assert.match(out, /git\.read/)
  assert.match(out, /tool\.time/)
  assert.doesNotMatch(out, /repo\.check|docgen\.read/)
})

test('配非 run 组 → validateSeatLayers 报 NonRunGroupGranted', () => {
  assert.throws(() => validateSeatLayers({ x: { allowGroups: ['git.read', 'docgen.read'] } }), (e) =>
    e.code === 'NonRunGroupGranted' && /x:docgen\.read/.test(e.message))
})

test('新门禁：卡面出现非 run 组即命中', () => {
  const groups = { 'git.read': { layer: 'run' }, 'repo.check': { layer: 'dev' } }
  assert.deepEqual(scanCards({ 'a.md': '只跑 `git.read`' }, groups), [])
  assert.deepEqual(scanCards({ 'a.md': '只跑 `repo.check`' }, groups), ['a.md: repo.check'])
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test tools/docgen/builders/agents/test/policy-layer-render.test.mjs`
Expected: FAIL —— `allowGroups` 仍接受 `docgen.read`，且 `scanCards` 不存在。

- [ ] **Step 3: 写实现**

`renderBoundary.mjs` 的 `allowGroups` 改为「只过滤、不判错」：

```js
export function allowGroups(groups) {
  if (!Array.isArray(groups) || groups.length === 0) return `${code('commandGroups')}（无白名单组 = 无白名单命令）`
  const run = groups.filter((g) => CMD.commandGroups[g]?.layer === 'run')
  return `${code('commandGroups')} 的 ${run.map(code).join(' / ')} 白名单组`
}
```

`validatePolicy.mjs` 新增并导出：

```js
export function validateSeatLayers(policy = SEAT_POLICY) {
  for (const [seat, p] of Object.entries(policy)) {
    for (const g of p.allowGroups ?? []) {
      if (CMD.commandGroups[g]?.layer !== 'run') fail('NonRunGroupGranted', `${seat}:${g}`)
    }
  }
}
```

`validatePolicy()` 末尾调用 `validateSeatLayers()`。`cli.mjs` 的 `gate` / `draft` / `generate` / `replace` / `policy --dump` 五个入口在渲染前统一先调 `validatePolicy()`（只在 `gate` 校验会让 `draft` 静默过滤后写盘）；`draft` 增加 `--drafts <dir>` 覆盖产物目录（不靠环境变量）。`seat-policy.mjs` 按 spec §3.3 改：三个席 `['git.read','tool.time']`，`respondent-dev` `['git.read']`，其余 `[]`。

`scripts/check-command-layer.mjs`：

```js
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { commandGroups } from '../tools/docgen/builders/agents/policy/definitions/commands.mjs'

export function scanCards(cardTexts, groups = commandGroups) {
  const run = new Set(Object.entries(groups).filter(([, g]) => g.layer === 'run').map(([k]) => k))
  const bad = []
  for (const [file, text] of Object.entries(cardTexts)) {
    for (const g of Object.keys(groups)) {
      if (!run.has(g) && text.includes('`' + g + '`')) bad.push(`${file}: ${g}`)
    }
  }
  return bad
}

const dir = 'agents'
const texts = Object.fromEntries(readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => [f, readFileSync(join(dir, f), 'utf8')]))
const bad = scanCards(texts)
console.log(bad.length ? `command-layer: bad ${bad.length}` : 'command-layer ok')
process.exit(bad.length ? 1 : 0)
```

重生成：`node tools/docgen/builders/agents/cli.mjs gate` → `draft` → 人工对照 → `replace --yes`。

- [ ] **Step 4: 跑测试与门禁**

Run: `node --test tools/docgen/builders/agents/test/policy-layer-render.test.mjs`
Run: `node scripts/check-command-layer.mjs`
Expected: PASS + `command-layer ok`（exit 0）。

- [ ] **Step 5: Commit**

```bash
git add tools/docgen/builders/agents/components/renderBoundary.mjs tools/docgen/builders/agents/policy/seat-policy.mjs scripts/check-command-layer.mjs tools/docgen/builders/agents/test/policy-layer-render.test.mjs agents
git commit -m "feat(agent): 卡面命令白名单只取 run 组"
```

---

### Task 3: `scs ledger numbers` C5 + C2 适配（F-02）

**Files:**
- Modify: `D:\Seed\skill-common-script\src\commands\ledger-numbers.ts`
- Test: `D:\Seed\skill-common-script\src\commands\ledger-numbers.test.ts`
- Modify: `tools/docgen/builders/agents/components/outputFormats.mjs`（round-check 第 3 项证据格式）
- Regenerate: `skills/parliament-ledger/assets/round-check.md`

**Interfaces:**
- Consumes: 无
- Produces: `checkTerminalReconcile(dir): { fail?: string; warn?: string }`（导出供测试）

- [ ] **Step 1: 写失败的测试**

```ts
import { describe, it, expect } from 'vitest'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { checkTerminalReconcile } from './ledger-numbers.js'

const mk = (files: Record<string, string>) => {
  const dir = mkdtempSync(join(tmpdir(), 'c5-'))
  for (const [n, t] of Object.entries(files)) writeFileSync(join(dir, n), t)
  return dir
}

describe('C5 终态对账', () => {
  it('求和相等 → 无 fail / 无 warn', () => {
    const dir = mk({
      'cards.md': '#### A-1-01 【P0】x\n#### A-1-02 【P1】y\n#### A-1-03 【P2】z\n',
      'round-check.md': '| 第 3 项 | 本轮终态对账 | 过 | 已修=1 关闭=1 候选=0 升级=1 带往下轮=0 |\n',
    })
    expect(checkTerminalReconcile(dir)).toEqual({})
  })

  it('求和不等 → fail', () => {
    const dir = mk({
      'cards.md': '#### A-1-01 【P0】x\n',
      'round-check.md': '| 第 3 项 | 本轮终态对账 | 过 | 已修=1 关闭=1 候选=0 升级=0 带往下轮=0 |\n',
    })
    expect(checkTerminalReconcile(dir).fail).toMatch(/C5 终态对账不符：求和 2 ≠ 卡片数 1/)
  })

  it('缺行 / 空文件 → 只 warn', () => {
    const dir = mk({ 'cards.md': '#### A-1-01 【P0】x\n', 'round-check.md': '' })
    expect(checkTerminalReconcile(dir).warn).toMatch(/C5 未取数/)
    expect(checkTerminalReconcile(dir).fail).toBeUndefined()
  })

  it('缺 cards.md → 只 warn', () => {
    const dir = mk({ 'round-check.md': '| 第 3 项 | x | 过 | 已修=0 关闭=0 候选=0 升级=0 带往下轮=0 |\n' })
    expect(checkTerminalReconcile(dir).warn).toMatch(/缺 cards\.md/)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd D:\Seed\skill-common-script && npx vitest run src/commands/ledger-numbers.test.ts`
Expected: FAIL —— `checkTerminalReconcile is not a function`。

- [ ] **Step 3: 写实现**

`ledger-numbers.ts` 加：

```ts
const RE_C5 = /已修=(\d+)\s+关闭=(\d+)\s+候选=(\d+)\s+升级=(\d+)\s+带往下轮=(\d+)/

export function checkTerminalReconcile(dir: string): { fail?: string; warn?: string } {
  const rc = join(dir, 'round-check.md')
  if (!existsSync(rc)) return { warn: 'C5 未取数（无第 3 项行）' }
  const line = readFileSync(rc, 'utf8').split(/\r?\n/).find((l) => l.includes('第 3 项'))
  const m = line?.match(RE_C5)
  if (!m) return { warn: 'C5 未取数（无第 3 项行）' }
  const cards = join(dir, 'cards.md')
  if (!existsSync(cards)) return { warn: '缺 cards.md（C5 已跳过）' }
  const count = readFileSync(cards, 'utf8').split(/\r?\n/).filter((l) => RE_CARD.test(l)).length
  const sum = m.slice(1, 6).reduce((n, x) => n + Number(x), 0)
  return sum === count ? {} : { fail: `C5 终态对账不符：求和 ${sum} ≠ 卡片数 ${count}` }
}
```

`checkLedgerNumbers()` 内追加：

```ts
const c5 = checkTerminalReconcile(dir)
if (c5.warn) warns.push(c5.warn)
if (c5.fail) fails.push({ file: 'round-check.md', line: 0, msg: c5.fail })
```

C2 适配加正则：

```ts
const RE_CARD_COUNT = /卡片数\s*(\d+)\s*[（(]\s*P0\s*(\d+)\s*\/\s*P1\s*(\d+)\s*\/\s*P2\s*(\d+)\s*[）)]/
```

在 C2 的逐行循环里，先 `RE_ARITH` 后 `RE_CARD_COUNT`，同一行只取第一个命中（`let used = false` 守卫）。

`outputFormats.mjs` 的 `round-check` 第 3 项证据说明追加一句：`证据栏写 已修=N 关闭=N 候选=N 升级=N 带往下轮=N`；再跑 `node tools/docgen/builders/agents/ledger.mjs --apply`。

- [ ] **Step 4: 跑测试与模板比对**

Run: `cd D:\Seed\skill-common-script && npx vitest run src/commands/ledger-numbers.test.ts`
Run: `node tools/docgen/builders/agents/ledger.mjs`
Expected: 测试全绿；模板比对 exit 0。

- [ ] **Step 5: Commit**

```bash
git -C D:\Seed\skill-common-script add src/commands/ledger-numbers.ts src/commands/ledger-numbers.test.ts
git -C D:\Seed\skill-common-script commit -m "feat(ledger): 增加 C5 终态对账与 C2 声明适配"
git add tools/docgen/builders/agents/components/outputFormats.mjs skills/parliament-ledger/assets/round-check.md
git commit -m "docs(ledger): 轮间核对单第 3 项写机读计数"
```

---

### Task 4: `scs check landings`（F-03）

**Files:**
- Create: `D:\Seed\skill-common-script\src\commands\check-landings.ts`
- Test: `D:\Seed\skill-common-script\src\commands\check-landings.test.ts`
- Modify: `D:\Seed\skill-common-script\src\commands\check.ts`（注册子命令）

**Interfaces:**
- Consumes: Task 3（同仓命令注册与测试风格）
- Produces: `checkLandings({ root, ledger }): { code: 0 | 1 | 2; out: string[]; err: string[] }`

- [ ] **Step 1: 写失败的测试**

```ts
import { describe, it, expect } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { checkLandings } from './check-landings.js'

const mk = (files: Record<string, string>) => {
  const dir = mkdtempSync(join(tmpdir(), 'land-'))
  mkdirSync(join(dir, 'docs'), { recursive: true })
  for (const [n, t] of Object.entries(files)) writeFileSync(join(dir, n), t)
  return dir
}

describe('check landings', () => {
  it('存在且行号够 → exit 0，首行计数 + 次行 ok', () => {
    const root = mk({ 'docs/a.md': 'l1\nl2\n' })
    const ledger = mk({ 'round-check.md': '| 证据 | `docs/a.md:2` |\n' })
    const r = checkLandings({ root, ledger })
    expect(r.code).toBe(0)
    expect(r.out[0]).toMatch(/^landings: missing 0（files 1 \/ refs 1）$/)
    expect(r.out[1]).toBe('landings ok')
  })

  it('文件不存在 → exit 1', () => {
    const root = mk({})
    const ledger = mk({ 'round-check.md': '| 证据 | `docs/nope.md:1` |\n' })
    const r = checkLandings({ root, ledger })
    expect(r.code).toBe(1)
    expect(r.out.join('\n')).toContain('docs/nope.md:1')
  })

  it('行号越界 → exit 1', () => {
    const root = mk({ 'docs/a.md': 'l1\n' })
    const ledger = mk({ 'round-check.md': '| 证据 | `docs/a.md:2` |\n' })
    expect(checkLandings({ root, ledger }).code).toBe(1)
  })

  it('URL 跳过', () => {
    const root = mk({})
    const ledger = mk({ 'round-check.md': '| 证据 | https://x.com/a.md:1 |\n' })
    const r = checkLandings({ root, ledger })
    expect(r.code).toBe(0)
    expect(r.out[0]).toMatch(/missing 0/)
    expect(r.out.at(-1)).toBe('landings ok')
  })

  it('缺 round-check.md → exit 2', () => {
    const root = mk({})
    const ledger = mk({})
    expect(checkLandings({ root, ledger }).code).toBe(2)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd D:\Seed\skill-common-script && npx vitest run src/commands/check-landings.test.ts`
Expected: FAIL —— 模块不存在。

- [ ] **Step 3: 写实现**

```ts
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const REF = /([A-Za-z0-9_./\\-]+\.[A-Za-z0-9]+):(\d+)/g

export interface LandingsRun { code: 0 | 1 | 2; out: string[]; err: string[] }

export function checkLandings({ root, ledger }: { root: string; ledger: string }): LandingsRun {
  const rc = join(ledger, 'round-check.md')
  if (!existsSync(rc)) return { code: 2, out: [], err: ['不是账本目录（缺 round-check.md）'] }
  const texts = [readFileSync(rc, 'utf8')]
  const warns: string[] = []
  const da = join(ledger, 'delivery-audit.md')
  if (existsSync(da)) texts.push(readFileSync(da, 'utf8'))
  else warns.push('[WARN] 缺 delivery-audit.md') // WARN 走 stderr
  const missing: string[] = []
  let refs = 0
  for (const text of texts) {
    for (const line of text.split(/\r?\n/)) {
      for (const m of line.matchAll(REF)) {
        const at = m.index ?? 0
        if (at >= 3 && line.slice(at - 3, at) === '://') continue
        refs += 1
        const rel = m[1]
        const n = Number(m[2])
        const abs = resolve(root, rel)
        if (!existsSync(abs)) { missing.push(`${rel}:${n}（文件不存在）`); continue }
        const lines = readFileSync(abs, 'utf8').split(/\r?\n/)
        if (lines.length < n) missing.push(`${rel}:${n}（越界，共 ${lines.length} 行）`)
      }
    }
  }
  const head = `landings: missing ${missing.length}（files ${texts.length} / refs ${refs}）`
  const out = [head, ...missing]
  if (missing.length === 0) out.push('landings ok')
  return { code: missing.length ? 1 : 0, out, err: warns }
}
```

`check.ts` 注册：

```ts
program
  .command('landings')
  .description('核对账本里的 path:line 是否真实存在')
  .option('--ledger <dir>', '账本目录')
  .option('--root <dir>', '项目根（默认当前目录）', process.cwd())
  .action((opts) => {
    if (!opts.ledger) {
      console.error('用法：scs check landings --root <项目根> --ledger <账本目录>')
      process.exit(2)
    }
    const r = checkLandings({ root: opts.root, ledger: opts.ledger })
    r.out.forEach((l) => console.log(l))
    r.err.forEach((l) => console.error(l))
    process.exit(r.code)
  })
```

- [ ] **Step 4: 跑测试确认通过**

Run: `cd D:\Seed\skill-common-script && npx vitest run src/commands/check-landings.test.ts`
Expected: PASS，5 个用例全绿。

- [ ] **Step 5: Commit**

```bash
git -C D:\Seed\skill-common-script add src/commands/check-landings.ts src/commands/check-landings.test.ts src/commands/check.ts
git -C D:\Seed\skill-common-script commit -m "feat(check): 新增 landings 落点存在性检查"
```

---

### Task 5: `skill-dir` 单源收口（F-04）

**Files:**
- Create: `scripts/check-skill-dir-single-source.mjs`
- Test: `scripts/check-skill-dir-single-source.test.mjs`

**Interfaces:**
- Consumes: Task 4
- Produces: `scanSkillDirSources({ repoRoot }): string[]`（违规清单，空 = 通过）

- [ ] **Step 1: 写失败的测试**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { scanSkillDirSources } from './check-skill-dir-single-source.mjs'

const mk = (files) => {
  const root = mkdtempSync(join(tmpdir(), 'sd-'))
  for (const [p, t] of Object.entries(files)) {
    mkdirSync(join(root, p, '..'), { recursive: true })
    writeFileSync(join(root, p), t)
  }
  return root
}

test('只有单源 + 允许的兜底 → 0', () => {
  const root = mk({
    'scripts/skill-dir.mjs': 'export function listSkillDirs() {}',
    'skills/skill-inspector/scripts/check.mjs': 'export function listSkillDirsFallback() {}',
  })
  assert.deepEqual(scanSkillDirSources({ repoRoot: root }), [])
})

test('第二份 skill-dir.mjs → 命中', () => {
  const root = mk({
    'scripts/skill-dir.mjs': 'export function listSkillDirs() {}',
    'skills/other/scripts/skill-dir.mjs': 'export function listSkillDirs() {}',
  })
  assert.equal(scanSkillDirSources({ repoRoot: root }).length, 1)
})

test('第二个 listSkillDirs 实现 → 命中', () => {
  const root = mk({
    'scripts/skill-dir.mjs': 'export function listSkillDirs() {}',
    'skills/other/scripts/x.mjs': 'export function listSkillDirs() {}',
  })
  assert.equal(scanSkillDirSources({ repoRoot: root }).length, 1)
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test scripts/check-skill-dir-single-source.test.mjs`
Expected: FAIL —— `scanSkillDirSources is not a function`。

- [ ] **Step 3: 写实现**

```js
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ALLOWED_FALLBACK = 'skills/skill-inspector/scripts/check.mjs'

const SKIP = new Set(['node_modules', '.git', '.session', 'dist'])

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (p.endsWith('.mjs')) out.push(p)
  }
  return out
}

export function scanSkillDirSources({ repoRoot }) {
  const bad = []
  for (const abs of walk(repoRoot)) {
    const rel = relative(repoRoot, abs).split('\\').join('/')
    const text = readFileSync(abs, 'utf8')
    if (rel.endsWith('skill-dir.mjs') && rel !== 'scripts/skill-dir.mjs') bad.push(`${rel}: 第二份 skill-dir.mjs`)
    if (rel !== 'scripts/skill-dir.mjs' && rel !== ALLOWED_FALLBACK && /function\s+listSkillDirs\b/.test(text)) {
      bad.push(`${rel}: 第二个 listSkillDirs 实现`)
    }
  }
  return bad
}

const bad = scanSkillDirSources({ repoRoot: process.cwd() })
console.log(bad.length ? `skill-dir: bad ${bad.length}` : 'skill-dir ok')
process.exit(bad.length ? 1 : 0)
```

- [ ] **Step 4: 跑测试与门禁**

Run: `node --test scripts/check-skill-dir-single-source.test.mjs`
Run: `node scripts/check-skill-dir-single-source.mjs`
Expected: PASS + `skill-dir ok`。

- [ ] **Step 5: Commit**

```bash
git add scripts/check-skill-dir-single-source.mjs scripts/check-skill-dir-single-source.test.mjs
git commit -m "test(skill-dir): 锁死单源，禁止第二份实现"
```

---

### Task 6: 两个 inspector 迁 scs + 基线 / 映射表（F-04）

**Files:**
- Create: `docs/devworkflows/20261109211349-script-layer-refactor/migration-baseline.json`
- Create: `docs/devworkflows/20261109211349-script-layer-refactor/migration-map.md`
- Create: `scripts/check-migration-contract.test.mjs`
- Create: `D:\Seed\skill-common-script\src\commands\check-skills.ts`（+ `.test.ts`）
- Create: `D:\Seed\skill-common-script\src\commands\check-rules.ts`（+ `.test.ts`）
- Modify: `D:\Seed\skill-common-script\src\commands\check.ts`（注册）
- Modify: `skills/skill-inspector/SKILL.md` / `skills/rule-inspector/SKILL.md`（改为 `scs` 调用）
- Delete: `skills/skill-inspector/scripts/check.mjs` / `skills/skill-inspector/scripts/check.test.mjs` / `skills/rule-inspector/scripts/score.mjs`（迁移完成后；测试随源删除）

**Interfaces:**
- Consumes: Task 5
- Produces: `scs check skills` / `scs check rules`；`migration-baseline.json` 与 `migration-map.md`

- [ ] **Step 1: 写失败的契约测试**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const BASE = 'docs/devworkflows/20261109211349-script-layer-refactor/migration-baseline.json'
const MAP = 'docs/devworkflows/20261109211349-script-layer-refactor/migration-map.md'

test('F-04 迁移前基线存在且两个 CLI 入口齐全', () => {
  assert.ok(existsSync(BASE), '缺 migration-baseline.json')
  const j = JSON.parse(readFileSync(BASE, 'utf8'))
  assert.equal(j.entries.length, 2)
  for (const e of j.entries) {
    for (const k of ['oldCommand', 'sample', 'exit', 'stdoutFirst', 'stdoutLast', 'codes']) assert.ok(k in e, `缺 ${k}`)
  }
})

test('F-04 映射表三行齐全且含契约列', () => {
  const t = readFileSync(MAP, 'utf8')
  for (const s of ['skill-inspector', 'rule-inspector', 'skill-dir']) assert.match(t, new RegExp(s))
  assert.match(t, /契约/)
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test scripts/check-migration-contract.test.mjs`
Expected: FAIL —— 两个文件都不存在。

- [ ] **Step 3: 落基线、映射表、迁移**

1. 按 spec §3.7 的 JSON 形状，对**两个 CLI 入口**（`check.mjs` / `score.mjs`）跑固定样本，写 `migration-baseline.json`；`sample` 一律记项目根，旧命令 `--dir <sample>/skills`，新命令 `--root <sample>`；`skill-dir.mjs` 是库、不占条目。
2. 写 `migration-map.md`：三行（两个 inspector + skill-dir 不迁），每行含「旧路径 / 新命令 / 冻结契约 / 契约变化」；`check.mjs` 的 exit 集按实测写 0/1，`--dir` → `--root` 的换算写死。
3. `scs` 侧把两个旧脚本逐行移植为 `check-skills.ts` / `check-rules.ts`：保留全部判定逻辑，把 `../../../` 读文件改为 `--root` / `--data` 参数；`--dir` → `--root`，其余 flag 名保留。
4. 两个 `SKILL.md` 的调用命令改为 `scs check skills` / `scs check rules`；删除旧脚本文件、`check.test.mjs` 与 `check.mjs` 内的 `listSkillDirsFallback` 副本。
5. 重跑基线样本，逐项 diff；差异必须写进映射表「契约变化」列。

- [ ] **Step 4: 跑测试与契约 diff**

Run: `node --test scripts/check-migration-contract.test.mjs`
Run: `cd D:\Seed\skill-common-script && npm test`
Expected: PASS；契约 diff 0 项（或差异已登记）。

- [ ] **Step 5: Commit**

```bash
git add docs/devworkflows/20261109211349-script-layer-refactor skills/skill-inspector skills/rule-inspector scripts/check-migration-contract.test.mjs
git commit -m "refactor(agent): inspector 迁 scs 并冻结迁移契约"
git -C D:\Seed\skill-common-script add src/commands/check-skills.ts src/commands/check-rules.ts src/commands/check.ts
git -C D:\Seed\skill-common-script commit -m "feat(check): 承接 skill / rule inspector"
```

---

### Task 7: 全量验收

**Files:** 无新增；只跑命令。

**Interfaces:**
- Consumes: Task 1、Task 2、Task 3、Task 4、Task 5、Task 6
- Produces: 验收输出（贴命令首行）

- [ ] **Step 1: 本仓门禁**

Run: `npm run check`
Expected: 末行 `check 全部通过`，exit 0。

- [ ] **Step 2: 卡面与模板**

Run: `node tools/docgen/builders/agents/cli.mjs gate`
Run: `node scripts/check-command-layer.mjs`
Run: `node scripts/check-skill-dir-single-source.mjs`
Run: `node tools/docgen/builders/agents/ledger.mjs`
Expected: 全部 exit 0。

- [ ] **Step 3: scs 测试**

Run: `cd D:\Seed\skill-common-script && npm test`
Expected: 全绿，exit 0。

- [ ] **Step 4: 计划门三查**

Run: `node scripts/check-plan.mjs map --plan docs/superpowers/plans/2026-11-09-script-layer-refactor.md`
Run: `node scripts/check-plan.mjs deps --plan docs/superpowers/plans/2026-11-09-script-layer-refactor.md`
Run: `node scripts/check-plan.mjs coverage --plan docs/superpowers/plans/2026-11-09-script-layer-refactor.md --prd docs/prd/20261109211349-script-layer-refactor/index.md --stage S2`
Expected: `missing 0 dangling 0` / `cycle 0 dangling 0` / `gap 0`（S1、S3、S4 各再跑一次）。

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/plans/2026-11-09-script-layer-refactor.md
git commit -m "docs(plan): 脚本分层收口实施计划与验收"
```

---

## 功能点 → 任务映射

| F | Task | 说明 |
|---|---|---|
| F-01 | Task 1、Task 2 | 组级 layer + 卡面只取 run |
| F-02 | Task 3 | `scs ledger numbers` C5 + C2 |
| F-03 | Task 4 | `scs check landings` |
| F-04 | Task 5、Task 6 | `skill-dir` 单源 + 两个 inspector 迁 scs |

## Self-Review

**1. Spec 覆盖**

| Spec 要求 | 对应任务 |
|---|---|
| R1 / R2 / §3.1 | Task 1 |
| R3 / R4 / §3.2 / §3.3 | Task 2 |
| R5 / R6 / §3.4 / §3.5 | Task 3 |
| R7 / R9 / §3.6 | Task 4 |
| R8 / R11 / R13 / §3.7 | Task 5、Task 6 |
| R10 / §4 硬约束 5 | Task 2、Task 5（各带 testcase） |
| R12 / §4 硬约束 1 | Task 1 |
| §4 硬约束 7（迁移基线） | Task 6 |

**未覆盖且刻意如此**：S5 校验器接 `outputFormats`（阻塞于 result.md §8.5，另立 spec）；#7 证据重放（PRD D13 不实现）；`verbs` 对象化（R12 另立）；`scs` 源码默认值改造（归 scs 仓）。

**2. 占位符扫描**：无 TBD / TODO / 「稍后补充」。所有代码块可直接运行。

**3. 类型一致性**：`validateCommandLayers` / `allowGroups` / `scanCards` / `checkTerminalReconcile` / `checkLandings` / `scanSkillDirSources` 六个名字在测试与实现中逐字一致；`LAYERS` 的取值 `build|dev|run` 在 Task 1 与 Task 2 一致。

## 附录 A 用例落点

| 用例 ID | 覆盖 | Task |
|---|---|---|
| TC-001 | 四组 layer 合法 | Task 1 |
| TC-002 | 组级单层 | Task 1 |
| TC-003 | 缺 layer → GroupLayerMissing | Task 1 |
| TC-004 | 非法 layer → GroupLayerInvalid | Task 1 |
| TC-005 | 同组两 layer → GroupMixedLayer | Task 1 |
| TC-006 | 五码对应 | Task 1 |
| TC-007 | verb 跨组 → VerbDuplicated | Task 1 |
| TC-008 | 卡面只渲染 run 组 | Task 2 |
| TC-009 | 渲染器不再过滤 → 探针红 | Task 2 |
| TC-010 | dump 含全量组 + layer | Task 2 |
| TC-011 | 席位配 build 组 → NonRunGroupGranted | Task 2 |
| TC-012 | 席位配置收口 | Task 2 |
| TC-013 | `__default__` 配 dev 组 → 抛错 | Task 2 |
| TC-014 | 配置非法时不写盘 | Task 2 |
| TC-015 | verbs 仍是字符串 | Task 1 |
| TC-016 | verb 被对象化 → 红 | Task 1 |
| TC-017 | 新门禁有 testcase | Task 2 |
| TC-018 | 新门禁缺 testcase → 不通过 | Task 2 |
| TC-019 | C5 求和相等 | Task 3 |
| TC-020 | C5 求和不等于 → FAIL | Task 3 |
| TC-021 | C5 缺行 → WARN | Task 3 |
| TC-022 | cards.md 缺失 → WARN | Task 3 |
| TC-023 | C5 正则不匹配 → WARN | Task 3 |
| TC-024 | C2 新形态命中 | Task 3 |
| TC-025 | C2 新形态不符 → FAIL | Task 3 |
| TC-026 | C2 两种形态不双计 | Task 3 |
| TC-027 | C2 旧形态仍命中 | Task 3 |
| TC-028 | C2 括号变体 | Task 3 |
| TC-029 | 模板第 3 项含机读格式 | Task 3 |
| TC-030 | 模板手改 → 比对红 | Task 3 |
| TC-031 | 无自写计数脚本 | Task 3 |
| TC-032 | landings 全过 | Task 4 |
| TC-033 | landings 文件不存在 → exit 1 | Task 4 |
| TC-034 | landings 行号越界 → exit 1 | Task 4 |
| TC-035 | landings URL 跳过 | Task 4 |
| TC-036 | 缺 `--ledger` → exit 2 | Task 4 |
| TC-037 | 账本目录不存在 → exit 2 | Task 4 |
| TC-038 | delivery-audit 可选 → WARN | Task 4 |
| TC-039 | token 含反斜杠 | Task 4 |
| TC-040 | 只拷 scs + 临时根可跑 | Task 4 |
| TC-041 | 不传参数换目录 → 失败 | Task 4 |
| TC-042 | 不执行证据命令 | Task 4 |
| TC-043 | 映射表 + 基线前置 | Task 6 |
| TC-044 | 基线逐项 diff 0 | Task 6 |
| TC-045 | exit 变 → 红 | Task 6 |
| TC-046 | code 串变 → 红 | Task 6 |
| TC-047 | 首末行变 → 红 | Task 6 |
| TC-048 | 技能外引用仅 1 处合法 | Task 6 |
| TC-049 | 越界引用 → 红 | Task 6 |
| TC-050 | skill-dir 单源 1 份 | Task 5 |
| TC-051 | 第二份实现 → 红 | Task 5 |
| TC-052 | `scs check skills` 契约同旧脚本 | Task 6 |
| TC-053 | 换目录不传 root → 失败 | Task 6 |
| TC-054 | 本仓调用面 0 处依赖默认值 | Task 6 |
| TC-055 | 删旗标 → 红 | Task 6 |
| TC-056 | package.json 显式传参 | Task 6 |
| TC-057 | 走默认值 → exit 2 | Task 6 |
| TC-058 | 新命令有 `*.test.ts` | Task 6 |
| TC-059 | 有实现无 test → 红 | Task 6 |
| TC-060 | 生成卡不手改 | Task 2 |
| TC-061 | 手改卡 → gate 红 | Task 2 |
| TC-062 | `--root` = 项目根 | Task 4 |
| TC-063 | 相对/绝对路径等价 | Task 4 |
| TC-064 | `GroupEmpty` | Task 1 |
| TC-065 | 缺 round-check.md → exit 2 | Task 4 |
| TC-066 | `--ledger` 按 cwd | Task 4 |
| TC-067 | 无基线改调用方 → 不通过 | Task 6 |
| TC-068 | 未登记差异 → 不通过 | Task 6 |
| TC-069 | 旧声明形态 C2 回归 | Task 3 |

## 后续里程碑(各自独立成计划)

| 里程碑 | 内容 | 主要文件 |
|---|---|---|
| S5 校验器接数据 | 校验器读 `outputFormats.docs`，只判痕；先解 result.md §8.5 的 spec 冲突 | `tools/docgen`、`skills/parliament-ledger` |
| `verbs` 对象化 | 把 verb 从字符串升级为 `{text, layer}`；需同批改一组基线断言 | `commands.mjs`、policy 测试 |
| scs 默认值改造 | 去掉 `tools/quality/...` 默认值，改为必填或参数化 | `D:\Seed\skill-common-script` |

## 执行交接

计划已保存到 `docs/superpowers/plans/2026-11-09-script-layer-refactor.md`。两种执行方式：

**1. Subagent 驱动（推荐）** —— 每个任务派一个全新 subagent，任务间 review

**2. 本会话内联执行** —— 用 executing-plans 带检查点批量执行
