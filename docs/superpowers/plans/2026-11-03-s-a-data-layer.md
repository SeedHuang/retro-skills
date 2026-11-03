# S-A 数据层实现计划（`agentData` 拆 JSON + `when` 唯一源）

> **For agentic workers:** REQUIRED SUB-SKILL：用 `subagent-driven-development`（推荐，逐任务派新子代理 + 两段复核）或 `executing-plans` 执行本计划。步骤用 `- [ ]` 勾选框跟踪。
> **⚠️ 本仓特有前置**：动手前先读 `rules/` 的「开发工作流主干」与 `skills/dev-workflow/references/gate-record.md`；每段出口要留 `gate-record.md` 行。

**Goal:** 把 `tools/docgen/components/agentData.mjs` 的 15 席字面数据拆成 `data/shared.json` + `data/seats/<seat>.json`（`@` 引用展开），让 `triggerTable.when` 成为 `duty.trigger` 的唯一源，删掉 policy 里 3 项本仓专属路径——**15 席渲染产物逐字节不变**。

**Architecture:** 新增 `components/seatLoader.mjs`（读盘 → `expandRefs` 一层展开 → 拆 `trigger` → 注入 `duty.trigger` → 装配 `tools`/`boundary`（`...s` 置末）→ 12 键断言）与 `check-shared-refs.mjs`（PRD V5 校验器）。`agentData.mjs` 降为薄壳（**先 `import` 再 `export`**，不得纯再导出）。数据源单向不变：`cardPipeline.mjs` 仍不读盘。

**Tech Stack:** Node ESM（无构建）、`node --test`（TAP）、`tools/docgen/cli.mjs` 六子命令、PowerShell 5 执行环境。

**Spec:** `docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md`（§12 章：§10.1 R1–R9 / §10.2.1–10.2.10 / §10.4 / §10.5）
**Testcase:** `docs/superpowers/specs/2026-11-03-s-a-data-layer-design-testcase.md`（30 条：正 10 / 负+边界 20）
**PRD（只引用编号，不抄正文）:** `docs/prd/20261102212627-card-data-contract-and-proof/index.md` §2 D12/D16/D17、§3 Q5/Q7/Q8、§4 V4/V5/V10/V12、§5、§8

## Global Constraints

- 渲染逐字节不变：任何一步结束时 `node tools/docgen/cli.mjs gate` 必须 **exit 0**（15 席 `disk == render`）。
- 12 键契约不变：`card` 的键集**恰等** `['seat','name','description','tools','duty','scenes','signals','must','never','categories','checkItems','rationale']`，键名唯一源 = `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md:89`。
- 条目顶层白名单不变（`validateAgentData.mjs:105` 的 `BASE_KEYS` 9 键）：`trigger` 段必须在加载期拆出，**不得**出现在条目上。
- `SCAN_FIELDS` 键数**仍 8**（逐码一项，不得合并成 4 组）；`CARD_MODEL_CODES` **仍 36 码零新增**（新增 4 码只进 `validateAgentData.mjs` 的 `EXIT` 表）。
- `duty.trigger` 保留字段名、席文件里恒 `""`；非空 = 拒载（`TriggerFieldMisplaced`）。
- `@` 只允许**单层**（`seats/*.json` → `shared.json`），`shared.json` 值内不得再出现 `@` / `${@`。
- 插值实现**必须**用函数替换或 `split/join`（禁 `str.replace(re, str)`，否则值里的 `$&`/`$1` 被当替换模式）。
- `shared.json` 只收实测逐字重复：`dutyConstraintDefault`(12) / `cardRationaleHead`(12) / `cardRationaleTail`(11)。
- 不改 PRD 的 D/Q/V 口径；发现 spec 未定义的东西 → **停下回流 spec**，不得在本计划里加设计决策。
- `baseline 38/38` 不作判据（同式自除恒真）。
- 卡面是生成物：`agents/*.md` 只由 `cli.mjs` 生成，**禁止手改**。

---

## File Structure（先锁定职责，再拆任务）

| 文件 | 动作 | 职责（一句话） |
|---|---|---|
| `tools/docgen/data/shared.json` | 建 | 3 个共享片段（整值 1 + 插值 2） |
| `tools/docgen/data/seats/<seat>.json` ×15 | 建 | 一席一文件：`name/role/dimension/outputKind/card/trigger` + 可选 `boundary/explorePolicy/domain` |
| `tools/docgen/components/seatLoader.mjs` | 建 | 读盘 + `expandRefs` + 拆 `trigger` + 注入 + 装配 + 键集断言（**唯一**读盘与装配点） |
| `tools/docgen/components/agentData.mjs` | 改（降为薄壳） | 只 `import` 后 `export` 三个符号（保持 29 条既有 `import` 的导出面） |
| `tools/docgen/check-shared-refs.mjs` | 建 | PRD V5 校验器：悬空 / 空值 / 嵌套 / 12 键恰等（exit 1） |
| `tools/docgen/components/validateAgentData.mjs` | 改 | `EXIT[1]` 追加 4 码 |
| `tools/docgen/components/cardPipeline.mjs` | 改 1 行 | `CARD_KEYS` 加 `export`（内容不动） |
| `tools/docgen/card-model/enums.mjs` | 改 | `CARD_TEXT_FIELDS` 加 `'description'` |
| `tools/docgen/card-model/validateCardModel.mjs` | 改 | `surfaceTexts` 加 `description` 分支 |
| `tools/docgen/test/card-model.test.mjs` | 改 3 处断言 | `S1-TC-G09` 的 `:1125` / `:1131` 改「必报」，`:1141` 仍 8 键 |
| `tools/docgen/policy/definitions/paths.mjs` | 删 3 项 | `pathGroups.workspace` 删 `lessons/`、`skills-lock.json`、`tools/docgen/-spike/.tmp-test/`（`DETECTION_BLIND_SPOTS` 保留） |
| `tools/docgen/test/sa-data-layer.test.mjs` | 建 | 30 条用例的落点（TC-001…TC-030） |
| 7 个既有测试文件 | 改 6 处伴随断言 + 删 1 处死 helper（另 1 处靠形态满足、1 处同处置、2 处归 T5） | 见 spec §10.2.9「测试侧 11 处」表，分账写在该表下方的自检节 |

---

### Task 1: 建数据源（`shared.json` + 15 席 JSON）

**Files:**
- Create: `tools/docgen/data/shared.json`、`tools/docgen/data/seats/<seat>.json`（15 份）
- Create: `tools/docgen/test/sa-data-layer.test.mjs`（本任务只写 TC-001）
- Temp: `.session/tmp/export-seat-data.mjs`（一次性导出脚本，用完全删）

**Interfaces:**
- Consumes: 无（本计划的第一跳，独立起点）
- Produces：`tools/docgen/data/seats/<seat>.json` 的键集 = `name` / `role` / `dimension`? / `outputKind` / `card` / `trigger` / `boundary`? / `explorePolicy`? / `domain`?；`card` 只写 8 键（`duty`/`scenes`/`signals`/`must`/`never`/`categories`/`checkItems`/`rationale`），**不写** `seat`/`name`/`description`/`tools`；`card.duty.trigger` 恒 `""`。
- Produces：`shared.json` 恰 3 键（`dutyConstraintDefault` / `cardRationaleHead` / `cardRationaleTail`）。

- [ ] **Step 1: 写失败测试（TC-001）**

新建 `tools/docgen/test/sa-data-layer.test.mjs`：

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, existsSync } from 'node:fs'

const DATA = 'tools/docgen/data'
const SEATS = `${DATA}/seats`

test('TC-001 数据源按席拆成 data/seats/<seat>.json（15 份）+ data/shared.json（1 份）', () => {
  const dirs = readdirSync(DATA, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
  assert.deepEqual(dirs, ['seats'], 'data/ 下一级只能有 seats 一个目录')
  const files = readdirSync(SEATS).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '')).sort()
  assert.equal(files.length, 15, `应 15 份席文件，实得 ${files.length}`)
  const shared = JSON.parse(readFileSync(`${DATA}/shared.json`, 'utf8'))
  assert.deepEqual(Object.keys(shared).sort(),
    ['cardRationaleHead', 'cardRationaleTail', 'dutyConstraintDefault'], 'shared.json 恰 3 键')
  // 席名与 agentData 逐字相等（旧入口仍在，故可就地比对）
  return import('../components/agentData.mjs').then(({ agentData }) => {
    assert.deepEqual(files, agentData.map((a) => a.name).sort(), '席文件名必须与 agentData 席名集逐字相等')
  })
})
```

- [ ] **Step 2: 跑测试确认红**

Run: `node --test tools/docgen/test/sa-data-layer.test.mjs`
Expected: FAIL —— `ENOENT: no such file or directory, scandir 'tools/docgen/data'`

- [ ] **Step 3: 写一次性导出脚本并生成数据**

新建 `.session/tmp/export-seat-data.mjs`（**这是临时脚本，Step 6 删除**）：

```js
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { agentData, triggerTable } from '../../tools/docgen/components/agentData.mjs'

const OUT = 'tools/docgen/data'
const C = '按本席职责与边界执行；越出边界的动作只记录，不自行处置'
const HEAD = '旧卡「你是谁」并入本段；共享特质与通用纪律上移共享层；固定必问清单拆成'
const TAIL = '条 checkItem；自由探索为一条 must；输出格式走共享 issue-card 合同。'
const DERIVED = ['seat', 'name', 'description', 'tools']

mkdirSync(`${OUT}/seats`, { recursive: true })
writeFileSync(`${OUT}/shared.json`, JSON.stringify(
  { dutyConstraintDefault: C, cardRationaleHead: HEAD, cardRationaleTail: TAIL }, null, 2) + '\n')

const num = (s) => s.match(/拆成([五六七八九])条 checkItem/)?.[1] ?? null
for (const e of agentData) {
  const card = { ...e.card, duty: { ...e.card.duty, trigger: '' } }
  for (const k of DERIVED) delete card[k]
  if (card.duty.constraint === C) card.duty.constraint = '@dutyConstraintDefault'
  const n = num(card.rationale || '')
  if (n && card.rationale.includes(HEAD) && card.rationale.includes(TAIL)) {
    const head = card.rationale.split(HEAD)[0]        // 身份句 + 「。」
    card.rationale = `${head}\${@cardRationaleHead}${n}\${@cardRationaleTail}`
  }
  const entry = { name: e.name, role: e.role }
  if (e.dimension !== undefined) entry.dimension = e.dimension
  entry.outputKind = e.outputKind
  entry.card = card
  const t = triggerTable[e.name]
  entry.trigger = { when: t.when, route: t.route, ...(t.notWhen ? { notWhen: t.notWhen } : {}) }
  if (e.boundary !== undefined) entry.boundary = e.boundary
  if (e.explorePolicy !== undefined) entry.explorePolicy = e.explorePolicy
  if (e.domain !== undefined) entry.domain = e.domain
  writeFileSync(`${OUT}/seats/${e.name}.json`, JSON.stringify(entry, null, 2) + '\n')
}
console.log('wrote 15 seat files + shared.json')
```

Run: `node .session/tmp/export-seat-data.mjs`
Expected: `wrote 15 seat files + shared.json`

- [ ] **Step 4: 人工核对导出结果（三处硬点）**

Run:
```powershell
(Get-ChildItem tools\docgen\data\seats -File).Count
Select-String -Path tools\docgen\data\seats\reviewer-product.json -Pattern 'cardRationaleHead|dutyConstraintDefault|"trigger": ""'
Select-String -Path tools\docgen\data\seats\reviewer-audit.json -Pattern 'dutyConstraintDefault|旧卡'
```
Expected：`15`；product 命中 `@dutyConstraintDefault` + `${@cardRationaleHead}七${@cardRationaleTail}` + `"trigger": ""`；reviewer-audit 命中 `@dutyConstraintDefault`，但 `rationale` **不含** head（它是手写整句）。

- [ ] **Step 5: 跑测试确认绿**

Run: `node --test tools/docgen/test/sa-data-layer.test.mjs`
Expected: PASS（1 pass）

Run: `node tools/docgen/cli.mjs gate`
Expected: `baseline 38/38`、exit 0（**本任务没动任何代码，渲染不该变**）

- [ ] **Step 6: 删除临时脚本并提交**

```powershell
Remove-Item .session\tmp\export-seat-data.mjs
git add tools/docgen/data docs/superpowers/specs tools/docgen/test/sa-data-layer.test.mjs
git commit -m "feat(docgen): S-A 数据源拆成 shared.json + 15 席 JSON（T1）"
```

---

### Task 2: 加载器 + 校验器 + 4 个错误码（旧入口不动，双跑比对）

**Files:**
- Create: `tools/docgen/components/seatLoader.mjs`
- Create: `tools/docgen/check-shared-refs.mjs`
- Modify: `tools/docgen/components/validateAgentData.mjs`（`EXIT[1]` 追加 4 码）
- Modify: `tools/docgen/components/cardPipeline.mjs`（`CARD_KEYS` 加 `export`）
- Test: `tools/docgen/test/sa-data-layer.test.mjs`（加 TC-002/003/004/008/011/012/013/014/015/016/019/027）

**Interfaces:**
- Produces:
  - `seatLoader.mjs` → `export function expandRefs(value, shared, seat)`（纯函数，抛 `err.code`）
  - `seatLoader.mjs` → `export function loadSeatData(dir = <默认 data 目录>)` → `{ agentData, triggerTable }`（`dir` 只为测试注入副本，生产不传）
  - `check-shared-refs.mjs` → CLI，参数 `--dir <data 目录>`，默认 `tools/docgen/data`；exit 0/1
  - `cardPipeline.mjs` → `export const CARD_KEYS`
- Consumes: Task 1

- [ ] **Step 1: 写失败测试（11 条）**

追加到 `tools/docgen/test/sa-data-layer.test.mjs`：

```js
import { expandRefs, loadSeatData } from '../components/seatLoader.mjs'
import { CARD_KEYS } from '../components/cardPipeline.mjs'

const EMPTY = /^(|\s+)$/
const expandCases = () => {
  const shared = { a: '甲', b: '乙', arr: ['x'], empty: '', nul: null, ws: '   ', nested: '@a' }
  return { shared }
}

test('TC-002 展开是装配前一次性纯函数：同输入两次逐字节相等', () => {
  const { shared } = expandCases()
  const input = { k: '前${@a}后', l: '@arr' }
  const a = JSON.stringify(expandRefs(input, shared, 'probe'))
  const b = JSON.stringify(expandRefs(input, shared, 'probe'))
  assert.equal(a, b)
  assert.equal(input.k, '前${@a}后', '不得就地改写入参')
})

test('TC-003 展开后 card 12 键恰等（15/15）', async () => {
  const { agentData } = await import('../components/agentData.mjs')
  for (const e of agentData) {
    const keys = Object.keys(e.card).sort()
    assert.deepEqual(keys, [...CARD_KEYS].sort(), `${e.name} 的 card 键集必须恰等 12 键`)
  }
})

test('TC-004 duty.trigger 与 triggerTable.when 逐字相同（15/15）', () => {
  const { agentData, triggerTable } = loadSeatData()
  for (const e of agentData) assert.equal(e.card.duty.trigger, triggerTable[e.name].when, e.name)
})

test('TC-008 kind 只住 triggerTable；条目顶层不得出现', () => {
  const { agentData, triggerTable } = loadSeatData()
  for (const e of agentData) assert.equal('kind' in e, false, `${e.name} 条目顶层不得有 kind`)
  for (const [seat, t] of Object.entries(triggerTable)) {
    for (const k of Object.keys(t)) assert.ok(['when', 'route', 'notWhen', 'fallback', 'kind'].includes(k), `${seat}.${k} 越界`)
  }
})

test('TC-011/012/013/014/015/016 引用四形态：悬空 / 嵌套 / 少键 / 多键 / 空值', () => {
  const { shared } = expandCases()
  assert.throws(() => expandRefs({ k: '@noSuchKey' }, shared, 'probe'), (e) => e.code === 'DanglingSharedRef')
  assert.throws(() => expandRefs({ k: '@nested' }, { ...shared, nested: '@a' }, 'probe'), (e) => e.code === 'NestedSharedRef')
  assert.throws(() => expandRefs({ k: '@empty' }, shared, 'probe'), (e) => e.code === 'EmptySharedValue')
  assert.throws(() => expandRefs({ k: '@nul' }, shared, 'probe'), (e) => e.code === 'EmptySharedValue')
  assert.throws(() => expandRefs({ k: '@ws' }, shared, 'probe'), (e) => e.code === 'EmptySharedValue')
  assert.throws(() => expandRefs({ k: 'x${@arr}y' }, shared, 'probe'), (e) => e.code === 'EmptySharedValue')
  // 整值 + 插值混用
  assert.throws(() => expandRefs({ k: '@a ${@b}' }, shared, 'probe'), (e) => e.code === 'NestedSharedRef')
})

test('TC-019 席文件里写回非空 duty.trigger → 拒载 TriggerFieldMisplaced（不静默覆盖）', async () => {
  const { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const dst = mkdtempSync(join(tmpdir(), 'sa019-'))
  try {
    cpSync('tools/docgen/data', dst, { recursive: true })
    const p = join(dst, 'seats', 'reviewer-product.json')
    const j = JSON.parse(readFileSync(p, 'utf8'))
    j.card.duty.trigger = '当主持人调度对 PRD/spec/plan 做产品视角评审'   // 第二来源
    writeFileSync(p, JSON.stringify(j, null, 2) + '\n')
    assert.throws(() => loadSeatData(dst), (e) => e.code === 'TriggerFieldMisplaced')
  } finally { rmSync(dst, { recursive: true, force: true }) }
})
```

- [ ] **Step 2: 跑测试确认红**

Run: `node --test tools/docgen/test/sa-data-layer.test.mjs`
Expected: FAIL —— `Cannot find module .../components/seatLoader.mjs`

- [ ] **Step 3: 写 `seatLoader.mjs`**

```js
// 唯一读盘与装配点（spec §10.2.5）：读 JSON → 展开 → 拆 trigger → 注入 duty.trigger → 装配 → 键集断言。
// `cardPipeline.mjs` 仍不读盘；本文件是它的上游数据供给。
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { patternRegistry, toolsForSeat, boundaryBySeat } from './patternRegistry.mjs'
import { CARD_KEYS } from './cardPipeline.mjs'
import { exitCodeFor } from './validateAgentData.mjs'

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'data')
const DERIVED = ['seat', 'name', 'description', 'tools']
const EMPTY = /^(|\s+)$/
const WHOLE = /^@([a-z][A-Za-z0-9]*)$/
const PART = /\$\{@([a-z][A-Za-z0-9]*)\}/g

function fail(code, fields) {
  const e = new Error(code); e.code = code; Object.assign(e, fields)
  try { e.exitCode = exitCodeFor(code) } catch { e.exitCode = 1 }
  throw e
}
const blank = (v) => v === null || v === undefined || (typeof v === 'string' && EMPTY.test(v))

function lookup(shared, key, seat) {
  if (!Object.prototype.hasOwnProperty.call(shared, key)) fail('DanglingSharedRef', { seat, key })
  const v = shared[key]
  if (blank(v)) fail('EmptySharedValue', { seat, key })
  return v
}

// 纯函数：不改入参、不读盘、不依赖时间/随机/环境；只展开一层（shared 内不得再有引用）
export function expandRefs(value, shared, seat) {
  if (typeof value === 'string') {
    const m = WHOLE.exec(value)
    if (m) {
      if (value.includes('${')) fail('NestedSharedRef', { seat, key: m[1], why: '整值与插值混用' })
      return lookup(shared, m[1], seat)          // 整值：原样返回，不递归展开（单层）
    }
    return value.replace(PART, (_, key) => {
      const v = lookup(shared, key, seat)
      if (typeof v !== 'string') fail('EmptySharedValue', { seat, key, why: '插值要求字符串' })
      return v
    })
  }
  if (Array.isArray(value)) return value.map((x) => expandRefs(x, shared, seat))
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) out[k] = expandRefs(v, shared, seat)
    return out
  }
  return value
}

export function loadSeatData(dir = DATA) {
  const shared = JSON.parse(readFileSync(join(dir, 'shared.json'), 'utf8'))
  for (const [k, v] of Object.entries(shared)) {
    if (typeof v === 'string' && (v.includes('@') || v.includes('${'))) fail('NestedSharedRef', { key: k })
  }
  const files = readdirSync(join(dir, 'seats')).filter((f) => f.endsWith('.json'))
  const agentData = []
  const triggerTable = {}
  for (const f of files) {
    const raw = JSON.parse(readFileSync(join(dir, 'seats', f), 'utf8'))
    // 变量名 `s` 与展开符 `...s` 两个形态都被既有断言钉死：`tool-tiers.test.mjs` 认
    // `tools:\s*toolsForSeat\(\s*s\.name\s*\)` 且随后 `indexOf('...s', i)`（§10.2.9 要求「只换读取目标、断言文字不变」）。
    const { trigger, ...s } = expandRefs(raw, shared, raw.name)
    if (!trigger || blank(trigger.when)) fail('MissingWhen', { name: raw.name })
    const dt = s.card && s.card.duty ? s.card.duty.trigger : undefined
    if (typeof dt !== 'string') fail('TriggerFieldMisplaced', { name: raw.name, key: 'duty.trigger' })
    if (dt !== '') fail('TriggerFieldMisplaced', { name: raw.name, key: 'duty.trigger', why: '第二来源' })
    s.card.duty.trigger = trigger.when
    for (const k of DERIVED) if (s.card && k in s.card) fail('CardKeySetMismatch', { name: raw.name, extra: k })
    const card = { tools: toolsForSeat(s.name), ...(boundaryBySeat[s.name] ? { boundary: boundaryBySeat[s.name] } : {}), ...s }
    const keys = Object.keys(card.card || {})
    if (keys.length !== CARD_KEYS.length || CARD_KEYS.some((k) => !keys.includes(k))) {
      fail('CardKeySetMismatch', { name: s.name, keys })
    }
    triggerTable[s.name] = trigger
    agentData.push(card)
  }
  return { agentData, triggerTable }
}
```

- [ ] **Step 4: 跑测试确认绿（第一批）**

Run: `node --test tools/docgen/test/sa-data-layer.test.mjs`
Expected: PASS（TC-001…004/008/011–016/019）

- [ ] **Step 5: 写 `check-shared-refs.mjs`（PRD V5）**

```js
// PRD V5 的验收命令：悬空键 0 / 无嵌套 / 12 键齐（exit 1）。不进 npm run check 的门禁段——
// 理由见 spec §10.2.6：loader 在 import 期 fail-closed，29 条 import 已兜底。
import { expandRefs, loadSeatData } from './components/seatLoader.mjs'
import { CARD_KEYS } from './components/cardPipeline.mjs'

const argv = process.argv.slice(2)
const i = argv.indexOf('--dir')
const dir = i >= 0 ? argv[i + 1] : undefined
if (i >= 0 && !dir) { console.log('[check-shared-refs] 用法错：--dir 缺值'); process.exit(2) }

try {
  const { agentData } = loadSeatData(dir)   // dir === undefined 时走默认 data 目录
  const bad = agentData.filter((e) => {
    const keys = Object.keys(e.card || {})
    return keys.length !== CARD_KEYS.length || CARD_KEYS.some((k) => !keys.includes(k))
  })
  if (bad.length) { console.log(`check-shared-refs: keySet ${bad.length} bad => fail`); process.exit(1) }
  console.log(`check-shared-refs: seats ${agentData.length} / dangling 0 / nested 0 / keySet 12 => ok`)
} catch (e) {
  console.log(`check-shared-refs: ${e.code} ${e.key ?? e.name ?? ''} => fail`)
  process.exit(1)
}
```

- [ ] **Step 6: 追加 4 码并导出 `CARD_KEYS`**

`tools/docgen/components/validateAgentData.mjs` 的 `EXIT[1]` 数组里追加一行（数组在文件开头的 `const EXIT = {…}` 内，紧挨 `'TriggerFieldMisplaced'` 之后）：

```js
    'DanglingSharedRef', 'EmptySharedValue', 'NestedSharedRef', 'CardKeySetMismatch',
```

`tools/docgen/components/cardPipeline.mjs` 的 `CARD_KEYS` 常量前加 `export `（内容与顺序一字不改）：

```js
export const CARD_KEYS = ['seat', 'name', 'description', 'tools', 'duty', 'scenes', 'signals', 'must', 'never',
  'categories', 'checkItems', 'rationale']
```

- [ ] **Step 7: 跑校验器 + 全量门禁**

Run: `node tools/docgen/check-shared-refs.mjs`
Expected: `check-shared-refs: seats 15 / dangling 0 / nested 0 / keySet 12 => ok`、exit 0

Run: `node tools/docgen/cli.mjs gate`
Expected: `baseline 38/38`、exit 0（`agentData` 仍是旧字面，渲染未变）

Run: `npm run check`
Expected: `# tests ≥ 1405`、`# fail 0`、末行 `check 全部通过`

- [ ] **Step 8: 提交**

```powershell
git add tools/docgen/components/seatLoader.mjs tools/docgen/check-shared-refs.mjs tools/docgen/components/validateAgentData.mjs tools/docgen/components/cardPipeline.mjs tools/docgen/test/sa-data-layer.test.mjs
git commit -m "feat(docgen): S-A 加载器 + 引用校验器 + 4 个错误码（T2）"
```

---

### Task 3: 切薄壳 + 6 处伴随断言 + 删死 helper（最重的一跳）

**Files:**
- Modify: `tools/docgen/components/agentData.mjs`（整文件替换为薄壳）
- Modify: `tools/docgen/test/tool-tiers.test.mjs`（`:146-155`、`:400`、`:450`、`:610-612`、`:706-712`）
- Modify: `tools/docgen/acceptance/replace-scenarios.mjs`（删死 helper `patch()`——它把语句拼进 `agentData.mjs` 源文本，当前**无调用点**；spec §10.2.9 第 11 处）
- Modify: `tools/docgen/test/dev-workflow-counts.test.mjs`（`:132-135`、`:146-155`、`:189` 不动）
- Modify: `tools/docgen/test/sdet-data.test.mjs`（删 `:40-47` 的 test）
- Test: `tools/docgen/test/sa-data-layer.test.mjs`（加 TC-005/007/017/018/026/029/030）

**Interfaces:**
- Consumes: Task 1, Task 2
- Produces：`agentData.mjs` 导出面 = `agentData`（15 席、每席 `tools`/`boundary`/`card`）/ `triggerTable` / `AGENT_KINDS`，与旧入口**逐字等价**

- [ ] **Step 1: 写失败测试（TC-030 + TC-005/007/017/018/026/029）**

追加：

```js
test('TC-030 坏数据在 import 期即 fail-closed（exit 1 + 码名）', async () => {
  const { spawnSync } = await import('node:child_process')
  const code = "import('./tools/docgen/components/agentData.mjs').then(()=>process.exit(0),e=>{console.error(e.code);process.exit(1)})"
  const r = spawnSync(process.execPath, ['-e', code], { encoding: 'utf8' })
  assert.equal(r.status, 0, `干净数据下 import 应成功，实得 ${r.status}：${r.stderr}`)
})

test('TC-005/017/018 渲染不变（gate exit 0）与「改数据不重生成」必红', async () => {
  const { spawnSync } = await import('node:child_process')
  const ok = spawnSync(process.execPath, ['tools/docgen/cli.mjs', 'gate'], { encoding: 'utf8' })
  assert.equal(ok.status, 0, ok.stdout + ok.stderr)
})

test('TC-007 装配点唯一：tools: toolsForSeat(s.name) 恰 1 处，...s 在其后 400 字符内', () => {
  const src = readFileSync('tools/docgen/components/seatLoader.mjs', 'utf8')
  const hits = [...src.matchAll(/tools:\s*toolsForSeat\(\s*s\.name\s*\)/g)]
  assert.equal(hits.length, 1, '装配式必须恰 1 处（正则与 S5-TC-D10 同一形态）')
  const j = src.indexOf('...s', hits[0].index)
  assert.ok(j > hits[0].index && j - hits[0].index < 400, '...s 必须紧随其后（不再允许等价写法）')
  const shell = readFileSync('tools/docgen/components/agentData.mjs', 'utf8')
  assert.equal([...shell.matchAll(/toolsForSeat\(/g)].length, 0, '薄壳里不得有装配式')
})

test('TC-026 顺序反转 → 既有 S5-TC-D10 必红（由工具自带用例兜底，这里只断言薄壳无装配式）', () => {
  const shell = readFileSync('tools/docgen/components/agentData.mjs', 'utf8')
  assert.ok(/^import .*seatLoader\.mjs/m.test(shell), '薄壳必须先 import（card-render 的 INJECT_BAD 依赖本地绑定）')
})

test('TC-029 notWhen 拼接在位（senior-sdet description 含「不用于：」）', async () => {
  const { agentData, triggerTable } = await import('../components/agentData.mjs')
  const t = triggerTable['senior-sdet']
  assert.ok(t.notWhen && t.notWhen.text, 'notWhen 必须在 triggerTable 里')
  assert.ok(agentData.find((a) => a.name === 'senior-sdet').duty.trigger.length > 0)
})
```

- [ ] **Step 2: 跑测试确认红**

Run: `node --test tools/docgen/test/sa-data-layer.test.mjs`
Expected: FAIL —— TC-007 的 `hits.length` 为 0（`seatLoader.mjs` 里是 `rest.name`，见 Task 2 代码；此断言在切壳前即应绿），而 TC-026 的薄壳 `import` 断言红（`agentData.mjs` 仍是字面）

- [ ] **Step 3: 把 `agentData.mjs` 换成薄壳**

整文件替换（**必须是「先 import 再 export」**，不得 `export { … } from`）：

```js
// 薄壳（S-A 数据层）：数据源已迁 tools/docgen/data/**，装配在 components/seatLoader.mjs。
// 保留本文件是为了 29 条既有 import 的导出面不变；本地绑定的写法是 card-render 的 INJECT_BAD 所需。
import { loadSeatData } from './seatLoader.mjs'

const { agentData, triggerTable } = loadSeatData()

export const AGENT_KINDS = { rule: 'rule', agent: 'agent' }
export { agentData, triggerTable }
```

- [ ] **Step 4: 同批改写 6 处伴随断言 + 删 1 处死 helper（否则门禁必红）**

按 spec §10.2.9 表逐处改（**语义不变，只换读取目标**）：

`tools/docgen/test/tool-tiers.test.mjs`

```js
// :146-155 原读 agentData.mjs → 改读 seatLoader.mjs
const agentSrc = readRepo('tools/docgen/components/seatLoader.mjs')
// :706-712 同上（S5-TC-D10 的三条断言文字不变）
const src = readRepo('tools/docgen/components/seatLoader.mjs')
// :400 / :450 / :610-612 的反例注入目标改 JSON
patchFile(dst, 'tools/docgen/data/seats/reviewer-audit.json', '"constraint": "按本席职责与边界执行；越出边界的动作只记录，不自行处置"', '"constraint": "收卡"')
```

`tools/docgen/test/dev-workflow-counts.test.mjs`

```js
// :132-135 的 patch 前提改指 JSON（同上形态）
// :146-155 的切块锚 `indexOf('  // translation-self-check')` 改为按 JSON 键路径定位：
//   旧：src.indexOf('  // translation-self-check')
//   新：src.indexOf('"name": "senior-sdet"')
```

`tools/docgen/test/sdet-data.test.mjs`：**删除** `:40` 起的 `test('TC-005：自评注释绑到条目…')` 整块（JSON 装不下注释。按 spec §10.2.9 的处置：自评改记 spec §10.2.10 与**本计划文末「执行记录」**，不写进 `gate-record.md`）。

`tools/docgen/acceptance/replace-scenarios.mjs`：删除死 helper `patch()`（它把语句拼进 `agentData.mjs` 源文本、当前无调用点；留着它，薄壳后下一次有人调用就会 `ReferenceError`）。

- [ ] **Step 5: 逐层验绿（这一步最容易撞车，按序跑）**

Run: `node --test tools/docgen/test/tool-tiers.test.mjs` → 期望 PASS
Run: `node --test tools/docgen/test/dev-workflow-counts.test.mjs` → 期望 PASS
Run: `node --test tools/docgen/test/sdet-data.test.mjs` → 期望 PASS
Run: `node --test tools/docgen/test/card-render.test.mjs` → 期望 PASS（`INJECT_BAD` 依赖本地绑定）
Run: `node tools/docgen/cli.mjs gate` → 期望 `baseline 38/38`、exit 0
Run: `node tools/docgen/cli.mjs diff --kind agent --name reviewer-product` → 期望「差异 - 0 / + 0」

若 `gate` 报 `Mismatch`：先用 `diff` 定位是哪个字段变了，**不要**用「重生成」掩盖（重生成会把 bug 固化进卡面）。

- [ ] **Step 6: 全量门禁**

Run: `npm run check`
Expected: `# tests ≥ 1405`、`# fail 0`、`check 全部通过`

- [ ] **Step 7: 提交**

```powershell
git add tools/docgen/components/agentData.mjs tools/docgen/test/tool-tiers.test.mjs tools/docgen/test/dev-workflow-counts.test.mjs tools/docgen/test/sdet-data.test.mjs tools/docgen/test/sa-data-layer.test.mjs
git commit -m "refactor(docgen): agentData 降为薄壳，6 处伴随断言改指新落点 + 删死 helper（T3）"
```

---

### Task 4: `description` 进扫描面（D17 / R4 + 三条冻结断言）

**Files:**
- Modify: `tools/docgen/card-model/enums.mjs`（`CARD_TEXT_FIELDS` 加 `'description'`）
- Modify: `tools/docgen/card-model/validateCardModel.mjs`（`surfaceTexts` 加分支）
- Modify: `tools/docgen/test/card-model.test.mjs`（`S1-TC-G09` 里「`description` 不扫」的两条 `green` 断言改「必报」；8 键那条不动）
- Test: `tools/docgen/test/sa-data-layer.test.mjs`（加 TC-009/020/021/022/023）

**Interfaces:**
- Consumes: Task 1, Task 2, Task 3
- Produces：`surfaceTexts(card, ['duty.trigger', …, 'description'])` 时产出 `{ path: 'description', text: card.description }`；`SCAN_FIELDS` 键数仍 8

- [ ] **Step 1: 写失败测试**

```js
import { SCAN_FIELDS } from '../card-model/enums.mjs'
import { validateCardModel } from '../card-model/index.mjs'

test('TC-009 SCAN_FIELDS 仍 8 键，且 4 个文本码的扫描面含 description', () => {
  assert.equal(Object.keys(SCAN_FIELDS).length, 8)
  const flat = (v) => JSON.stringify(v)
  for (const k of ['PointerToElsewhere', 'HardcodedCount', 'MixedTermInCard', 'ProceduralWordOutsideParliament']) {
    assert.ok(flat(SCAN_FIELDS[k]).includes('description'), `${k} 的扫描面必须含 description`)
  }
  for (const k of ['SubjectiveLabel', 'InlineTermList', 'InlineThreshold', 'AmbiguousCriterion']) {
    assert.equal(flat(SCAN_FIELDS[k]).includes('description'), false, `${k} 不得含 description`)
  }
})

test('TC-020/021 description 上的违规词必须报码（指针词 / 硬编码数量）', async () => {
  const { agentData } = await import('../components/agentData.mjs')
  const { buildEnv } = await import('../components/cardPipeline.mjs')
  const card = structuredClone(agentData.find((a) => a.name === 'senior-sdet').card)
  const env = buildEnv('senior-sdet', [card])
  card.description = '当需要为 PRD/spec 设计并编写测试用例；不用于：详见 §3 的口径'
  const e1 = validateCardModel(card, env).errors.filter((x) => /description/i.test(x.path))
  assert.ok(e1.some((x) => x.code === 'PointerToElsewhere'), `应报 PointerToElsewhere，实得 ${JSON.stringify(e1)}`)
  card.description = '当需要为 PRD/spec 设计并编写测试用例；不用于：共 3 条'
  const e2 = validateCardModel(card, env).errors.filter((x) => /description/i.test(x.path))
  assert.ok(e2.some((x) => x.code === 'HardcodedCount'), `应报 HardcodedCount，实得 ${JSON.stringify(e2)}`)
})
```

- [ ] **Step 2: 跑测试确认红**

Run: `node --test tools/docgen/test/sa-data-layer.test.mjs`
Expected: FAIL —— `TC-009` 的 `PointerToElsewhere…description` 断言红；`TC-020/021` 的 `e1` 为空数组

- [ ] **Step 3: 两处同批改（缺一即静默空转）**

`tools/docgen/card-model/enums.mjs` 的 `CARD_TEXT_FIELDS`（`SCAN_FIELDS` 上面那段 `Object.freeze([...])`）：

```js
const CARD_TEXT_FIELDS = Object.freeze([
  'duty.trigger',
  'duty.categories[]',
  'duty.action',
  'duty.constraint',
  'description',      // D17：description 纳入文本扫描面（唯一源 = triggerTable.when + notWhen）
  'Action.objects[]',
  'CheckItem.label',
])
```

`validateCardModel.mjs` 的 `surfaceTexts`（`:106-119` 的 if 链）加一行分支：

```js
    else if (ref === 'description') push('description', card.description);
```

- [ ] **Step 4: 同批改写两条冻结断言**

`tools/docgen/test/card-model.test.mjs` 的 `S1-TC-G09` 里，两条 `green(description …)` 改为 `only(…)`（行号见 spec §10.1 R5；**同批改，否则落 R4 即红**）：

```js
  // ② description 现在「扫」数量词（D17 落地后口径反转）
  only(run((c) => { c.description = '每轮答辩结束后开始观察（共 3 条）'; }), 'HardcodedCount', 'description');
  // ⑦ description 现在「扫」混称词
  only(run((c) => { c.description = '主持人调度，议长口径'; }), 'MixedTermInCard');
```

`:1141` 的 `assert.equal(Object.keys(SF).length, 8, …)` **保持不动**。

- [ ] **Step 5: 验绿（注意 `gate` 会变，因为 description 变了）**

Run: `node --test tools/docgen/test/card-model.test.mjs` → 期望 PASS
Run: `node --test tools/docgen/test/sa-data-layer.test.mjs` → 期望 PASS
Run: `node tools/docgen/cli.mjs gate`
Expected: **exit 0**（description 的**文本**没变，只是扫描面变了，卡面字节不变）

- [ ] **Step 6: 全量 + 提交**

Run: `npm run check` → 期望 `# fail 0`、`check 全部通过`

```powershell
git add tools/docgen/card-model/enums.mjs tools/docgen/card-model/validateCardModel.mjs tools/docgen/test/card-model.test.mjs tools/docgen/test/sa-data-layer.test.mjs
git commit -m "feat(card-model): description 纳入文本扫描面（D17 / R4，含三条冻结断言同批改写）（T4）"
```

---

### Task 5: Q8 删 3 项 policy + 2 卡重生成 + 两处基线

**Files:**
- Modify: `tools/docgen/policy/definitions/paths.mjs`（`pathGroups.workspace` 删 3 项；`DETECTION_BLIND_SPOTS` 不动）
- Modify: `tools/docgen/test/policy-pure-source.test.mjs`（`workspace` 9→6 项；三个计数改关系式；四处渲染面 23→20）
- Modify: `tools/docgen/test/support/capability-baseline.test.mjs`（改读冻结来源）
- Regenerate: `agents/reviewer-audit.md`、`agents/detective-observer.md`
- Update: `tools/docgen/baseline.json`、`tools/docgen/fixtures/reviewer-audit.evidence.json`、`tools/docgen/fixtures/detective-observer.evidence.json`
- Test: `tools/docgen/test/sa-data-layer.test.mjs`（加 TC-006/024/025/028）

**Interfaces:**
- Consumes: Task 1, Task 3
- Produces：`pathGroups.workspace` 6 项；`DETECTION_BLIND_SPOTS` 仍 3 项（含 `lessons/`）

- [ ] **Step 1: 写失败测试**

```js
test('TC-006/025 删 3 项后：禁写清单 20 项、检测限度段仍含 lessons/（2 卡各 1 行）', () => {
  const card = readFileSync('agents/reviewer-audit.md', 'utf8')
  const line = card.split('\n').find((l) => l.includes('逐项点名'))
  const items = line.split('逐项点名：')[1].split('；兜底句')[0].split('、')
  assert.equal(items.length, 20, `禁写项应 20，实得 ${items.length}`)
  for (const w of ['skills-lock.json', 'tools/docgen-spike/.tmp-test/']) assert.equal(card.includes(w), false, `${w} 不得残留`)
  const hits = readFileSync('agents/detective-observer.md', 'utf8').split('\n').filter((l) => l.includes('lessons/'))
  assert.equal(hits.length, 1, '检测限度段仍应含 lessons/（预期之内）')
})

test('TC-028 基线两处：evidence.renderSha256 == 盘上哈希（15/15）', async () => {
  const { createHash } = await import('node:crypto')
  const { readFileSync } = await import('node:fs')
  const { agentData } = await import('../components/agentData.mjs')
  for (const e of agentData) {
    const sha = createHash('sha256').update(readFileSync(`agents/${e.name}.md`)).digest('hex').toUpperCase()
    const ev = JSON.parse(readFileSync(`tools/docgen/fixtures/${e.name}.evidence.json`, 'utf8'))
    assert.equal(ev.renderSha256, sha, `${e.name} 的 evidence.renderSha256 必须等于盘上哈希`)
  }
})
```

- [ ] **Step 2: 跑测试确认红**

Run: `node --test tools/docgen/test/sa-data-layer.test.mjs`
Expected: FAIL —— 禁写项仍是 `23`；`skills-lock.json` 仍在

- [ ] **Step 3: 删 3 项 + 改测试口径**

`paths.mjs` 的 `workspace` 数组改为（**只删 3 项，`DETECTION_BLIND_SPOTS` 一字不动**）：

```js
  workspace: [
    '.superpowers/',
    '*.local.md',
    '**/ledger.md',
    '.trae/',
    'node_modules/',
    '其他评审目录',
  ],
```

`policy-pure-source.test.mjs`：

```js
  assert.deepEqual(P.workspace, ['.superpowers/','*.local.md','**/ledger.md','.trae/','node_modules/','其他评审目录'],
    'workspace 恰 6 项（Q8 删 3 项后）')
  assert.equal(Object.values(P).flat().length, pathItems().length - 1);   // 18 = 19 - 1
  assert.equal(pathItems().length, 19);
  assert.equal(pathTokens().length, pathItems().length + 1);             // 20 = 19 + 1
```

`tools/docgen/test/policy-pure-source.test.mjs` 里四处渲染面计数 `23` 改 `20`（该文件的行号见 spec §10.2.9 表）。

`tools/docgen/test/support/capability-baseline.test.mjs`（该 test 语义是「旧卡 23 项基线」）改为读冻结来源：

```js
const CARD = readFileSync('tools/docgen/fixtures/capability-baseline.golden.json', 'utf8');
// 断言仍为 23（来自 golden，不随 Q8 变）
```

- [ ] **Step 4: 重生成 2 卡并同步两处基线**

`generate` **只比不写**（`cmdGenerate` 对 `agents/*.md` 只做比对；`--apply` 只授权 `docs/agents` 人读投影，且必须带 `--readme`）——写 `agents/*.md` 的唯一路径是 `draft` → `replace`：

```powershell
node tools/docgen/cli.mjs draft --kind agent --name reviewer-audit
node tools/docgen/cli.mjs draft --kind agent --name detective-observer
```

`draft` 会打印草稿路径；接着按 `replace` 的记账段规则（`state.json` 15 席全 `replaced` = `change` 段，**必填 `--expect-change`**）逐个替换：

```powershell
$draft = "tools/docgen/drafts/reviewer-audit--<草稿名>.md"   # 用上一步打印的真实路径
$sha = (Get-FileHash $draft -Algorithm SHA256).Hash
node tools/docgen/cli.mjs replace --kind agent --name reviewer-audit --draft $draft --expect-change $sha --yes
# detective-observer 同样跑一遍
node tools/docgen/cli.mjs baseline --write
```

> `--expect-change` 的值必须是**即将写盘字节**的 sha256（旧凭证一律 `UnapprovedChange`）。若 `replace` 报 `DraftDrift`，说明草稿与当前渲染不一致——先查数据/代码，不要绕过。

然后按 `tools/docgen/cli.mjs` 里写 evidence 的同一形态（`replace` 流程的新 SHA 写入处）更新两席 evidence（`renderSha256` / `lastWrittenHash` = 新卡哈希）：

```powershell
node -e "const {createHash}=require('node:crypto');const {readFileSync,writeFileSync}=require('node:fs');for(const n of ['reviewer-audit','detective-observer']){const b=readFileSync('agents/'+n+'.md');const h=createHash('sha256').update(b).digest('hex').toUpperCase();const p='tools/docgen/fixtures/'+n+'.evidence.json';const e=JSON.parse(readFileSync(p,'utf8'));e.renderSha256=h;e.lastWrittenHash=h;writeFileSync(p,JSON.stringify(e,null,2)+'\n');console.log(n,h)}"
```

- [ ] **Step 5: 验绿**

Run: `node tools/docgen/cli.mjs gate` → 期望 `baseline 38/38`、exit 0
Run: `node --test tools/docgen/test/policy-pure-source.test.mjs` → 期望 PASS
Run: `node --test tools/docgen/test/support/capability-baseline.test.mjs` → 期望 PASS
Run: `node --test tools/docgen/test/sa-data-layer.test.mjs` → 期望 PASS
Run: `npm run check` → 期望 `# fail 0`、`check 全部通过`

- [ ] **Step 6: 提交**

```powershell
git add tools/docgen/policy/definitions/paths.mjs tools/docgen/test/policy-pure-source.test.mjs tools/docgen/test/support/capability-baseline.test.mjs agents/reviewer-audit.md agents/detective-observer.md tools/docgen/baseline.json tools/docgen/fixtures/reviewer-audit.evidence.json tools/docgen/fixtures/detective-observer.evidence.json tools/docgen/test/sa-data-layer.test.mjs
git commit -m "feat(docgen): Q8 删 3 项本仓专属路径 + 2 卡重生成 + 两处基线同步（T5）"
```

---

### Task 6: 收口验收（V4 / V5 / V10 + 回退演练）

**Files:**
- Modify: `skills/dev-workflow/references/gate-record.md`（补 ② 段与 ③ 段出口行）
- Create: `docs/superpowers/reviews/<本次>/impact-sheet.md`（冻结基线 15 卡 SHA + 改动清单）
- Test: 全量

**Interfaces:**
- Consumes: Task 1, Task 2, Task 3, Task 4, Task 5
- Produces：`skills/dev-workflow/references/gate-record.md` 的 ②→③ 与 ③→④ 两行；`docs/superpowers/reviews/<本次>/impact-sheet.md`（15 卡冻结基线 + 改动清单）

- [ ] **Step 1: 跑三条验收命令并留输出首行**

```powershell
node tools/docgen/cli.mjs gate                      # V4：期望 baseline 38/38、exit 0
node tools/docgen/check-shared-refs.mjs             # V5：期望 seats 15 / dangling 0 / nested 0 / keySet 12 => ok
node -e "import('./tools/docgen/components/agentData.mjs').then(({triggerTable})=>{const k=Object.keys(triggerTable).length;console.log('seats '+k+' kindSlot '+k)})"   # V10 字段位：15/15（四值校验归 S-C）
npm run check                                       # 期望 # tests ≥ 1405 / # fail 0 / check 全部通过
```

- [ ] **Step 2: 记冻结基线并写 impact-sheet**

```powershell
Get-ChildItem agents\*.md | ForEach-Object { "$($_.Name) " + (Get-FileHash $_.FullName -Algorithm SHA256).Hash }
```

把 15 行 SHA 抄进 `docs/superpowers/reviews/<本次>/impact-sheet.md`，并写明「13 席逐字节不变、2 席只有边界段变（Q8）」。

- [ ] **Step 3: 回退演练（只手动验证项）**

```powershell
git stash -u
node tools/docgen/cli.mjs gate      # 期望回到改前状态、exit 0
git stash pop
```

或（不 stash 时）：`git checkout -- tools/docgen/` 后 `git status --porcelain tools/docgen` 必须为空（`git checkout` 不删新建文件，残留 = 回退未完成）。

- [ ] **Step 4: 补 `gate-record.md` 出口行**

在 `skills/dev-workflow/references/gate-record.md` 的段表里补两行（列数与表头一致，6 列全填）：

```
| ② → ③ | spec + testcase 议会评审通过、P0=0 | 见 .session/reviews/2026-11-03-082100-s-a-spec-parliament/problems.md §八「判定：通过」 | 主 agent | 审计 | 通过 |
| ③ → ④ | 15 席 disk==render；gate exit 0；check 全部通过 | node tools/docgen/cli.mjs gate → baseline 38/38 | 开发 | 审计 | 通过 |
```

Run: `node scripts/check-gate-record.mjs`
Expected: `rows N bad 0`、末行 `gate-record ok`

- [ ] **Step 5: 最终门禁 + 提交**

Run: `npm run check` → 期望 `check 全部通过`
Run: `node scripts/scope-sweep.mjs --check` → exit 0（本批动了「判据级口径」：错误码表 + 扫描面，需过改判回扫）

```powershell
git add skills/dev-workflow/references/gate-record.md docs/superpowers/reviews
git commit -m "chore(dev-workflow): S-A 出口行与冻结基线（T6）"
```

---

## 附录 A 用例落点映射（`check-plan.mjs map` 的输入；missing 0 / dangling 0）

| 用例 ID | 落在 Task |
|---|---|
| TC-001 | Task 1 |
| TC-002 | Task 2 |
| TC-003 | Task 2 |
| TC-004 | Task 2 |
| TC-005 | Task 3 |
| TC-006 | Task 5 |
| TC-007 | Task 3 |
| TC-008 | Task 2 |
| TC-009 | Task 4 |
| TC-010 | Task 6 |
| TC-011 | Task 2 |
| TC-012 | Task 2 |
| TC-013 | Task 2 |
| TC-014 | Task 2 |
| TC-015 | Task 2 |
| TC-016 | Task 2 |
| TC-017 | Task 3 |
| TC-018 | Task 3 |
| TC-019 | Task 2 |
| TC-020 | Task 4 |
| TC-021 | Task 4 |
| TC-022 | Task 4 |
| TC-023 | Task 4 |
| TC-024 | Task 5 |
| TC-025 | Task 5 |
| TC-026 | Task 3 |
| TC-027 | Task 2 |
| TC-028 | Task 5 |
| TC-029 | Task 3 |
| TC-030 | Task 3 |

## 验收（本段完成判据，逐条可跑）

| # | 判据 | 命令 / 期望 |
|---|---|---|
| A1 | 渲染不变（PRD V4） | `node tools/docgen/cli.mjs gate` → `baseline 38/38`、exit 0；15 席 `disk == render` |
| A2 | `@` 引用完整性（PRD V5） | `node tools/docgen/check-shared-refs.mjs` → `seats 15 / dangling 0 / nested 0 / keySet 12 => ok` |
| A3 | `kind` 字段位（PRD V10 本段部分） | `triggerTable` 15 席齐、`kind` 可落位；四值校验归 S-C |
| A4 | 全量门禁 | `npm run check` → `# tests ≥ 1405`、`# fail 0`、末行 `check 全部通过` |
| A5 | 用例映射 | `node scripts/check-plan.mjs map --plan docs/superpowers/plans/2026-11-03-s-a-data-layer.md` → `missing 0 / dangling 0` |
| A6 | 依赖无环 | `node scripts/check-plan.mjs deps --plan docs/superpowers/plans/2026-11-03-s-a-data-layer.md` → `cycle 0 dangling 0` |
| A7 | 改判回扫 | `node scripts/scope-sweep.mjs --check` → exit 0 |

## 回退（失败时怎么收回）

1. 未提交阶段：`git stash -u`（含未跟踪新文件）→ 重跑 `gate` 应回到改前状态。
2. 已提交阶段：`git revert <T3 的 commit>`（薄壳那一跳是唯一会同时改 4 个文件的任务，单独 revert 最干净）。
3. `git checkout -- tools/docgen/` 后**必须**复验 `git status --porcelain tools/docgen` 为空——`git checkout` 不删新建文件（`seatLoader.mjs` / `data/**` 会残留）。

## 执行记录（施工时逐任务追加，不得预填）

> 每完成一个任务，在此追加一行：任务号 / 实际改动文件 / 关键验收命令 + 输出首行 / 与计划的偏差（无则写「无」）。
> 用途：T3 删掉的「自评注释」断言（`translation-self-check`）在这一节留痕（spec §10.2.9 的处置）。

| 任务 | 实际改动 | 验收命令 + 输出首行 | 偏差 |
|---|---|---|---|
| （待施工时填） | | | |

## 自检（写完过一遍）

- **spec 覆盖**：R1→T1/T2；R2→T2；R3→T2/T3；R4→T4；R5→T4；R6→T5；R7→T3（装配点迁移、`...s` 置末）；R8→T2（字段位）；R9→T3/T6。§10.4-1→TC-003/014/015；§10.4-2→T3；§10.4-3→TC-004/019；§10.4-4→T4；§10.4-5→T6。§10.2.7 两处基线→T5。§10.2.9 的 **11 处 / 7 文件**分账：T3 = 改 6 处（`tool-tiers` 3、`dev-workflow-counts` 2、`sdet-data` 1）+ 删 1 处死 helper（`replace-scenarios`）+ 靠形态满足 1 处（`card-render` 的 `INJECT_BAD`，不改文件）+ 1 处与 `dev-workflow-counts:146-155` 同处置；T5 = 改 2 处（`policy-pure-source`、`capability-baseline`）。6+1+1+1+2 = **11**。无缺口。
- **占位符扫描**：无 TBD / 「类似 Task N」/ 「加上适当的错误处理」；每个代码步骤都给了可粘贴代码。
- **类型一致**：`expandRefs(value, shared, seat)` 在 T2 定义、T2/T5 测试调用一致；`loadSeatData()` 返回 `{ agentData, triggerTable }` 在 T2 定义、T3 薄壳消费一致；`CARD_KEYS` 由 T2 导出、T2/T6 消费一致。
