# S-A 数据层实现计划（`agentData` 拆 JSON + `when` 唯一源）

> **For agentic workers:** REQUIRED SUB-SKILL：用 `subagent-driven-development`（推荐，逐任务派新子代理 + 两段复核）或 `executing-plans` 执行本计划。步骤用 `- [ ]` 勾选框跟踪。
> **⚠️ 本仓特有前置**：动手前先读 `rules/` 的「开发工作流主干」与 `skills/dev-workflow/references/gate-record.md`；每段出口要留 `gate-record.md` 行。

**Goal:** 把 `tools/docgen/components/agentData.mjs` 的 15 席字面数据拆成 `data/shared.json` + `data/seats/<seat>.json`（`@` 引用展开），让 `triggerTable.when` 成为 `duty.trigger` 的唯一源，删掉 policy 里 3 项本仓专属路径——**15 席渲染产物逐字节不变**。

**Architecture:** 新增 `components/seatLoader.mjs`（读盘 → `expandRefs` 一层展开 → 拆 `trigger` → 注入 `duty.trigger` → 装配 `tools`/`boundary`（`...s` 置末）→ **席文件 8 键断言**；12 键全量由 `check-shared-refs.mjs` 在 `buildCards()` 产物上判）与 `check-shared-refs.mjs`（PRD V5 校验器）。`agentData.mjs` 降为薄壳（**先 `import` 再 `export`**，不得纯再导出）。数据源单向不变：`cardPipeline.mjs` 仍不读盘。

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
- **本计划于 `2026-11-03` 计划门首轮 `FAIL`（审计 P0 1 / P1 6）后按 spec 改判重写**：①12 键判据归档 `buildCards()`（spec §10.1 R2 / §10.2.5 第 6 步）；②`@` 混用规则改成可判形态（§10.2.3 规则 4）；③`patch()` 不是死 helper，改为「改 `DATA` 常量指 JSON、四处调用保留」（§10.2.9 末行）。证据 = `.session/reviews/2026-11-03-s-a-plan-gate/plan-gate.md`。

---

## File Structure（先锁定职责，再拆任务）

| 文件 | 动作 | 职责（一句话） |
|---|---|---|
| `tools/docgen/data/shared.json` | 建 | 3 个共享片段（整值 1 + 插值 2） |
| `tools/docgen/data/seats/<seat>.json` ×15 | 建 | 一席一文件：`name/role/dimension/outputKind/card/trigger` + 可选 `boundary/explorePolicy/domain` |
| `tools/docgen/components/seatLoader.mjs` | 建 | 读盘 + `expandRefs` + 拆 `trigger` + 注入 + 装配 + 键集断言（**唯一**读盘与装配点） |
| `tools/docgen/components/agentData.mjs` | 改（降为薄壳） | 只 `import` 后 `export` 三个符号（保持 29 条既有 `import` 的导出面） |
| `tools/docgen/check-shared-refs.mjs` | 建 | PRD V5 校验器：悬空 / 空值 / 嵌套 / 12 键全量（exit 1） |
| `tools/docgen/components/validateAgentData.mjs` | 改 | `EXIT[1]` 追加 4 码 |
| `tools/docgen/components/cardPipeline.mjs` | 改 1 行 | `CARD_KEYS` 加 `export`（内容不动） |
| `tools/docgen/card-model/enums.mjs` | 改 | `CARD_TEXT_FIELDS` 加 `'description'` |
| `tools/docgen/card-model/validateCardModel.mjs` | 改 | `surfaceTexts` 加 `description` 分支 |
| `tools/docgen/test/card-model.test.mjs` | 改 3 处断言 | `S1-TC-G09` 的 `:1125` / `:1131` 改「必报」，`:1141` 仍 8 键 |
| `tools/docgen/policy/definitions/paths.mjs` | 删 3 项 | `pathGroups.workspace` 删 `lessons/`、`skills-lock.json`、`tools/docgen/-spike/.tmp-test/`（`DETECTION_BLIND_SPOTS` 保留） |
| `tools/docgen/test/sa-data-layer.test.mjs` | 建 | 30 条用例的落点（TC-001…TC-030） |
| `docs/reports/2026-11-03-s-a-card-sha-baseline.md` | 建 | 15 席卡面 SHA 冻结基线（一次性记录；spec §10.2.7 的落点，见 T6 偏差①） |
| 既有测试 / 验收脚本 9 个（`test/tool-tiers.test.mjs` / `test/dev-workflow-counts.test.mjs` / `test/sdet-data.test.mjs` / `test/policy-pure-source.test.mjs` / `test/support/capability-baseline.test.mjs` / `test/s3-predicates.test.mjs` / `test/card-model.test.mjs` / `acceptance/replace-scenarios.mjs` / `skills/managing-lessons-store/scripts/lessons.test.mjs`）+ 1 处测试支撑（`test/support/dev-workflow-checks.mjs`）+ 1 个新建（`test/sa-data-layer.test.mjs`） | T1 改 1 处期望文件集（`policy-pure-source` 的 `S6-TC-E03`）+ T3 改 6 处伴随断言 + `lessons.test.mjs` 的行号守卫结构替换豁免（计划门未预见，T6 补登）+ T4 改 `card-model.test.mjs` 的 3 处冻结断言（R5）+ T5-补 收敛 `Q8_REMOVED_PATHS` + 1 处改 `patch()` 注入目标（`replace-scenarios.mjs`，**不删 helper**）（另 1 处靠形态满足、1 处同处置、2 处归 T5） | 见 spec §10.2.9「测试侧 14 处 / 9 个文件」表，分账写在该表下方的自检节 |

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

test('TC-001 数据源按席拆成 data/seats/<seat>.json（一席一文件）+ data/shared.json（1 份）', () => {
  const dirs = readdirSync(DATA, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
  assert.deepEqual(dirs, ['seats'], 'data/ 下一级只能有 seats 一个目录')
  const files = readdirSync(SEATS).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '')).sort()
  const shared = JSON.parse(readFileSync(`${DATA}/shared.json`, 'utf8'))
  assert.deepEqual(Object.keys(shared).sort(),
    ['cardRationaleHead', 'cardRationaleTail', 'dutyConstraintDefault'], 'shared.json 恰 3 键')
  // 席名与 agentData 逐字相等；**席数一律派生**（`dev-workflow-counts.test.mjs` 的 `counterProbes`
  // 会扫 `tools/docgen/test/*.test.mjs` 的 assert 行，写死 15 会当场红）
  return import('../components/agentData.mjs').then(({ agentData }) => {
    const names = agentData.map((a) => a.name).sort()
    assert.equal(files.length, names.length, `席文件数与 agentData 席数不等：${files.length} vs ${names.length}`)
    assert.deepEqual(files, names, '席文件名必须与 agentData 席名集逐字相等')
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
  - `check-shared-refs.mjs` → CLI（**无参数**，固定在仓根跑；`--dir` 已撤：12 键判面必须走 `buildCards()`，它跟随模块默认数据源，带 `--dir` 会变成「数据源混用」）；exit 0/1
  - `cardPipeline.mjs` → `export const CARD_KEYS`
- Consumes: Task 1

- [ ] **Step 1: 写失败测试（11 条）**

追加到 `tools/docgen/test/sa-data-layer.test.mjs`：

```js
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expandRefs, loadSeatData } from '../components/seatLoader.mjs'
import { CARD_KEYS, buildCards } from '../components/cardPipeline.mjs'

const DERIVED = ['seat', 'name', 'description', 'tools']
const EIGHT = [...CARD_KEYS].filter((k) => !DERIVED.includes(k)).sort()
const expandCases = () => {
  const shared = { a: '甲', b: '乙', arr: ['x'], empty: '', nul: null, ws: '   ', nested: '@a' }
  return { shared }
}
// COPY：注入面统一在副本上做（data/ 整份拷到临时目录），不动工作区
const copyData = () => {
  const dst = mkdtempSync(join(tmpdir(), 'sa-refs-'))
  cpSync('tools/docgen/data', dst, { recursive: true })
  return dst
}

test('TC-002 展开是装配前一次性纯函数：同输入两次逐字节相等', () => {
  const { shared } = expandCases()
  const input = { k: '前${@a}后', l: '@arr' }
  const a = JSON.stringify(expandRefs(input, shared, 'probe'))
  const b = JSON.stringify(expandRefs(input, shared, 'probe'))
  assert.equal(a, b)
  assert.equal(input.k, '前${@a}后', '不得就地改写入参')
})

test('TC-003 两段判：席文件 card 恰等 8 键（loader）+ buildCards() 与 CARD_KEYS 恰等（12 键全量，消费点）', async () => {
  const { agentData } = await import('../components/agentData.mjs')
  for (const e of agentData) {
    // 8 键 = CARD_KEYS 去派生四键；12 键只在 cardPipeline.mjs 的 buildOne 里派生（spec §10.1 R2 改判）
    assert.deepEqual(Object.keys(e.card).sort(), EIGHT, `${e.name} 席数据 card 必须恰等 8 键`)
  }
  const built = buildCards()
  assert.equal(built.length, agentData.length, `buildCards() 席数必须与 agentData 一致：${built.length} vs ${agentData.length}`)
  for (const b of built) {
    assert.deepEqual(Object.keys(b.card).sort(), [...CARD_KEYS].sort(), `${b.seat} 的 buildCards() card 必须与 CARD_KEYS 恰等（12 键全量）`)
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

test('TC-011/012/013/016 引用四形态：悬空 / 空值 / 混用 / 嵌套（规则 2·3·4 走纯函数，规则 1 走加载器）', () => {
  const { shared } = expandCases()
  assert.throws(() => expandRefs({ k: '@noSuchKey' }, shared, 'probe'), (e) => e.code === 'DanglingSharedRef')
  assert.throws(() => expandRefs({ k: '@empty' }, shared, 'probe'), (e) => e.code === 'EmptySharedValue')
  assert.throws(() => expandRefs({ k: '@nul' }, shared, 'probe'), (e) => e.code === 'EmptySharedValue')
  assert.throws(() => expandRefs({ k: '@ws' }, shared, 'probe'), (e) => e.code === 'EmptySharedValue')
  assert.throws(() => expandRefs({ k: 'x${@arr}y' }, shared, 'probe'), (e) => e.code === 'EmptySharedValue')
  // 规则 4 上半：以 @ 开头但不整体匹配 ^@key$（整值与插值混用）
  assert.throws(() => expandRefs({ k: '@a ${@b}' }, shared, 'probe'), (e) => e.code === 'NestedSharedRef')
  // 规则 4 下半：整值展开结果内仍含引用
  assert.throws(() => expandRefs({ k: '@nested' }, { ...shared, nested: '@a' }, 'probe'), (e) => e.code === 'NestedSharedRef')
  // 规则 1：shared 值内再写引用 → 加载器前置拒绝（不递归、不必栈溢出）
  const dst = copyData()
  try {
    const p = join(dst, 'shared.json')
    const j = JSON.parse(readFileSync(p, 'utf8'))
    j.dutyConstraintDefault = '@cardRationaleHead'   // 第二层引用
    writeFileSync(p, JSON.stringify(j, null, 2) + '\n')
    assert.throws(() => loadSeatData(dst), (e) => e.code === 'NestedSharedRef')
  } finally { rmSync(dst, { recursive: true, force: true }) }
})

test('TC-014 席文件 card 少一个键（删 rationale）→ CardKeySetMismatch', () => {
  const dst = copyData()
  try {
    const p = join(dst, 'seats', 'reviewer-product.json')
    const j = JSON.parse(readFileSync(p, 'utf8'))
    delete j.card.rationale
    writeFileSync(p, JSON.stringify(j, null, 2) + '\n')
    assert.throws(() => loadSeatData(dst), (e) => e.code === 'CardKeySetMismatch' && (e.missing || []).includes('rationale'))
  } finally { rmSync(dst, { recursive: true, force: true }) }
})

test('TC-015 多一个键（returns）/ 写派生四键（tools）→ 两种形态都报 CardKeySetMismatch', () => {
  const forms = [
    ['extra', (j) => { j.card.returns = [] }],
    ['derived', (j) => { j.card.tools = [] }],
  ]
  for (const [label, mutate] of forms) {
    const dst = copyData()
    try {
      const p = join(dst, 'seats', 'reviewer-product.json')
      const j = JSON.parse(readFileSync(p, 'utf8'))
      mutate(j)
      writeFileSync(p, JSON.stringify(j, null, 2) + '\n')
      assert.throws(() => loadSeatData(dst), (e) => e.code === 'CardKeySetMismatch', `${label} 形态必须报 CardKeySetMismatch`)
    } finally { rmSync(dst, { recursive: true, force: true }) }
  }
})

test('TC-027 `kind` 写进条目顶层 → 拒载 TriggerFieldMisplaced（不静默当成 trigger 字段）', async () => {
  const { validateAgentData } = await import('../components/validateAgentData.mjs')
  const dst = copyData()
  try {
    const p = join(dst, 'seats', 'reviewer-audit.json')
    const j = JSON.parse(readFileSync(p, 'utf8'))
    j.kind = 'dispatch'                       // 顶层写入（应只住 trigger.kind）
    writeFileSync(p, JSON.stringify(j, null, 2) + '\n')
    const { agentData, triggerTable } = loadSeatData(dst)
    assert.throws(() => validateAgentData(agentData, triggerTable),
      (e) => e.code === 'TriggerFieldMisplaced' && String(e.extra || '').includes('kind'))
  } finally { rmSync(dst, { recursive: true, force: true }) }
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
Expected: FAIL 两类红（两条都出现才算「红到位」）：
① `SyntaxError: The requested module '../components/cardPipeline.mjs' does not provide an export named 'CARD_KEYS'`（导出还没加，Step 3 第一件事就补）；
② `Cannot find module .../components/seatLoader.mjs`。

- [ ] **Step 3: 先给 `CARD_KEYS` 加 `export`，再写 `seatLoader.mjs`**

`tools/docgen/components/cardPipeline.mjs`：`CARD_KEYS` 常量前加 `export `（内容与顺序一字不改）——必须在 Step 4 跑绿**之前**做，否则 loader 与测试都拿不到唯一源：

```js
export const CARD_KEYS = ['seat', 'name', 'description', 'tools', 'duty', 'scenes', 'signals', 'must', 'never',
  'categories', 'checkItems', 'rationale']
```

然后新建 `tools/docgen/components/seatLoader.mjs`：

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
const EIGHT = CARD_KEYS.filter((k) => !DERIVED.includes(k))   // 席文件 card 的合法键集（12 键去派生四键）
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
      const v = lookup(shared, m[1], seat)          // 整值：原样返回，不递归展开（单层）
      if (typeof v === 'string' && (v.includes('@') || v.includes('${'))) {
        fail('NestedSharedRef', { seat, key: m[1], why: '整值展开结果仍含引用' })
      }
      return v
    }
    // 规则 4 上半：以 @ 开头但不整体匹配 ^@key$（整值与插值混用 / 非法形态）
    if (value.startsWith('@')) fail('NestedSharedRef', { seat, why: '混用或非法形态', value })
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
    // 席文件 card 的键集：恰等 8 键（= CARD_KEYS 去派生四键）；派生四键写了就拒载（spec §10.2.5 第 6 步）
    // `missing` / `extra` 两个字段必须分开给：TC-014 要点名缺的那个键，TC-015 要点名多出来的那个键
    const keys = Object.keys(s.card || {})
    const missing = EIGHT.filter((k) => !keys.includes(k))
    const extra = keys.filter((k) => !EIGHT.includes(k))
    if (missing.length || extra.length) {
      fail('CardKeySetMismatch', { name: s.name, keys, missing, extra, derivedInCard: extra.filter((k) => DERIVED.includes(k)) })
    }
    const card = { tools: toolsForSeat(s.name), ...(boundaryBySeat[s.name] ? { boundary: boundaryBySeat[s.name] } : {}), ...s }
    triggerTable[s.name] = trigger
    agentData.push(card)
  }
  return { agentData, triggerTable }
}
```

- [ ] **Step 4: 跑测试确认绿（第一批）**

Run: `node --test tools/docgen/test/sa-data-layer.test.mjs`
Expected: PASS（TC-001…004/008/011–016/019/027）

- [ ] **Step 5: 写 `check-shared-refs.mjs`（PRD V5）**

```js
// PRD V5 的验收命令：悬空 0 / 无嵌套 / 15 席 12 键全量（exit 1）。不进 npm run check 的门禁段——
// 理由见 spec §10.2.6：loader 在 import 期 fail-closed，29 条 import 已兜底。
import { loadSeatData } from './components/seatLoader.mjs'
import { CARD_KEYS, buildCards } from './components/cardPipeline.mjs'

try {
  const { agentData } = loadSeatData()   // 悬空 / 嵌套 / 席文件 8 键：loader 内已 fail-closed 抛错
  const built = buildCards()             // 12 键只在 buildOne 派生，必须在消费点判（spec §10.1 R2）
  const bad = built.filter((b) => {
    const keys = Object.keys(b.card || {})
    return keys.length !== CARD_KEYS.length || CARD_KEYS.some((k) => !keys.includes(k))
  })
  if (bad.length) { console.log(`check-shared-refs: keySet12 ${bad.length} bad => fail`); process.exit(1) }
  console.log(`check-shared-refs: seats ${agentData.length} / dangling 0 / nested 0 / keySet8 ${agentData.length} / keySet12 ${built.length} => ok`)
} catch (e) {
  console.log(`check-shared-refs: ${e.code} ${e.key ?? e.name ?? ''} => fail`)
  process.exit(1)
}
```

- [ ] **Step 6: 追加 4 码到 `EXIT[1]`**

`tools/docgen/components/validateAgentData.mjs` 的 `EXIT[1]` 数组里追加一行（数组在文件开头的 `const EXIT = {…}` 内，紧挨 `'TriggerFieldMisplaced'` 之后；`CARD_KEYS` 的 `export` 已在 Step 3 落，此处不再动 `cardPipeline.mjs`）：

```js
    'DanglingSharedRef', 'EmptySharedValue', 'NestedSharedRef', 'CardKeySetMismatch',
```

- [ ] **Step 7: 跑校验器 + 全量门禁**

Run: `node tools/docgen/check-shared-refs.mjs`
Expected: `check-shared-refs: seats 15 / dangling 0 / nested 0 / keySet8 15 / keySet12 15 => ok`、exit 0

Run: `node tools/docgen/cli.mjs gate`
Expected: `baseline 38/38`、exit 0（`agentData` 仍是旧字面；席文件 8 键由 loader 判、12 键由 `buildCards()`（此时仍读旧入口）判，渲染未变）

Run: `npm run check`
Expected: `# tests ≥ 1405`、`# fail 0`、末行 `check 全部通过`

- [ ] **Step 8: 提交**

```powershell
git add tools/docgen/components/seatLoader.mjs tools/docgen/check-shared-refs.mjs tools/docgen/components/validateAgentData.mjs tools/docgen/components/cardPipeline.mjs tools/docgen/test/sa-data-layer.test.mjs
git commit -m "feat(docgen): S-A 加载器 + 引用校验器 + 4 个错误码（T2）"
```

---

### Task 3: 切薄壳 + 6 处伴随断言 + 改 `patch()` 注入目标（最重的一跳）

**Files:**
- Modify: `tools/docgen/components/agentData.mjs`（整文件替换为薄壳）
- Modify: `tools/docgen/test/tool-tiers.test.mjs`（`:146-155`、`:400`、`:450`、`:610-612`、`:706-712`）
- Modify: `tools/docgen/acceptance/replace-scenarios.mjs`（把 `:14` 的 `DATA` 常量改指 `tools/docgen/data/seats/senior-sdet.json`；`patch()` **有 4 处调用**（`:196`/`:219`/`:232`/`:258`），不得删——spec §10.2.9 第 11 处已按计划门 P1-2 改判）
- Modify: `tools/docgen/test/dev-workflow-counts.test.mjs`（`:132-135`、`:146-155`、`:189` 不动）
- Modify: `tools/docgen/test/sdet-data.test.mjs`（删 `:40-47` 的 test）
- Test: `tools/docgen/test/sa-data-layer.test.mjs`（加 TC-005/007/017/018/026/029/030）

**Interfaces:**
- Consumes: Task 1, Task 2
- Produces：`agentData.mjs` 导出面 = `agentData`（15 席、每席 `tools`/`boundary`/`card`）/ `triggerTable` / `AGENT_KINDS`，与旧入口**逐字等价**

- [ ] **Step 1: 写失败测试（TC-030 + TC-005/007/017/018/026/029）**

追加：

```js
test('TC-030 坏数据在 import 期即 fail-closed（干净态 exit 0；悬空引用态 exit 1 + 码名）', async () => {
  const { spawnSync } = await import('node:child_process')
  const { withRepoCopy } = await import('./support/dev-workflow-checks.mjs')
  const code = "import('./tools/docgen/components/agentData.mjs').then(()=>process.exit(0),e=>{console.error(e.code);process.exit(1)})"
  const ok = spawnSync(process.execPath, ['-e', code], { encoding: 'utf8' })
  assert.equal(ok.status, 0, `干净数据下 import 应成功，实得 ${ok.status}：${ok.stderr}`)
  withRepoCopy((dst) => {
    const p = join(dst, 'tools/docgen/data/seats/reviewer-product.json')
    const j = JSON.parse(readFileSync(p, 'utf8'))
    j.card.duty.constraint = '@noSuchKey'     // 悬空引用：必须在 import 期抛，而不是等到渲染
    writeFileSync(p, JSON.stringify(j, null, 2) + '\n')
    const bad = spawnSync(process.execPath, ['-e', code], { cwd: dst, encoding: 'utf8' })
    assert.equal(bad.status, 1, bad.stdout + bad.stderr)
    assert.match(bad.stderr, /DanglingSharedRef/)
  })
})

test('TC-005 拆 JSON 后 15 席 disk == render、gate exit 0', async () => {
  const { spawnSync } = await import('node:child_process')
  const ok = spawnSync(process.execPath, ['tools/docgen/cli.mjs', 'gate'], { encoding: 'utf8' })
  assert.equal(ok.status, 0, ok.stdout + ok.stderr)
})

test('TC-017 值类型漂移（`duty.action` 句子 → 数字）→ gate exit 1 `Mismatch`', async () => {
  const { spawnSync } = await import('node:child_process')
  const { withRepoCopy, runCli } = await import('./support/dev-workflow-checks.mjs')
  withRepoCopy((dst) => {
    const p = join(dst, 'tools/docgen/data/seats/reviewer-product.json')
    const j = JSON.parse(readFileSync(p, 'utf8'))
    j.card.duty.action = 1                       // 句子 → 数字：渲染文本必变
    writeFileSync(p, JSON.stringify(j, null, 2) + '\n')
    const r = runCli(dst, ['gate'])
    assert.equal(r.status, 1, r.stdout + r.stderr)
    assert.match(r.stdout + r.stderr, /Mismatch/)
  })
})

test('TC-018 改了 seats/*.json 未重生成 agents/*.md → gate exit 1 `Mismatch`', async () => {
  const { withRepoCopy, runCli } = await import('./support/dev-workflow-checks.mjs')
  withRepoCopy((dst) => {
    const p = join(dst, 'tools/docgen/data/seats/reviewer-product.json')
    const j = JSON.parse(readFileSync(p, 'utf8'))
    j.card.duty.action = `${j.card.duty.action}。`  // 加一个句号：值合法、渲染变
    writeFileSync(p, JSON.stringify(j, null, 2) + '\n')
    const r = runCli(dst, ['gate'])
    assert.equal(r.status, 1, r.stdout + r.stderr)
    assert.match(r.stdout + r.stderr, /Mismatch/)
  })
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
Expected: FAIL —— 红来自四处，且**必须四处同时红**：① TC-026（薄壳 `import` 断言：`agentData.mjs` 仍是字面）；② TC-017（在副本里改 `seats/*.json` 后 `gate` 仍 exit 0——旧入口不读 JSON，注入不生效）；③ TC-018（同上形态）；④ TC-030 的负例（副本注入悬空引用后 `import agentData.mjs` 仍 `status 0`）。已绿的是 TC-005（干净态 `gate` exit 0）与 TC-007（Task 2 的 `seatLoader.mjs` 里装配式已成立）。若 TC-007 此时为红，说明 Task 2 的装配式写错了，回去改 Task 2，不要改断言。

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
// :148 的第二处注释锚（`indexOf('  // 阅读取证员')`）同处置：
//   旧：src.indexOf('  // 阅读取证员')
//   新：src.indexOf('"name": "evidence-reader"')
```

`tools/docgen/test/sdet-data.test.mjs`：**删除** `:40` 起的 `test('TC-005：自评注释绑到条目…')` 整块（JSON 装不下注释。按 spec §10.2.9 的处置：自评改记 spec §10.2.10 与**本计划文末「执行记录」**，不写进 `gate-record.md`）。

`tools/docgen/acceptance/replace-scenarios.mjs`：把 `:14` 的 `DATA` 常量由 `'tools/docgen/components/agentData.mjs'` 改为 `'tools/docgen/data/seats/senior-sdet.json'`。**四处 `patch()` 调用一律保留**（`WHEN_OLD` 现在住该席 JSON 的 `trigger.when`，命中数仍须恰 1）。已知债（不在本任务修）：`:196` / `:219` 注入的 `改动 = 改组件数据 → …` 句在数据里 0 命中，属 acceptance 既有 `9/11 红` 那笔账，登记触发 = 下次修该验收脚本。

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
git add tools/docgen/components/agentData.mjs tools/docgen/test/tool-tiers.test.mjs tools/docgen/test/dev-workflow-counts.test.mjs tools/docgen/test/sdet-data.test.mjs tools/docgen/acceptance/replace-scenarios.mjs tools/docgen/test/sa-data-layer.test.mjs
git commit -m "refactor(docgen): agentData 降为薄壳，6 处伴随断言改指新落点 + patch 注入目标改 JSON（T3）"
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

test('TC-022 新增第 9 个 `SCAN_FIELDS` 键 → `ESC` exit 非 0', async () => {
  const { spawnSync } = await import('node:child_process')
  const { withRepoCopy } = await import('./support/dev-workflow-checks.mjs')
  withRepoCopy((dst) => {
    const p = join(dst, 'tools/docgen/card-model/enums.mjs')
    const s = readFileSync(p, 'utf8')
    const anchor = "export const SCAN_FIELDS = Object.freeze({"
    assert.equal(s.split(anchor).length - 1, 1, '注入锚必须恰 1 处')
    writeFileSync(p, s.split(anchor).join(`${anchor}\n  Description: Object.freeze(['description']),`))
    const r = spawnSync(process.execPath, ['--test', 'tools/docgen/test/card-model.test.mjs'], { cwd: dst, encoding: 'utf8' })
    assert.notEqual(r.status, 0, '第 9 键必须让 8 键断言红')   // `card-model.test.mjs:1141`
  })
})

test('TC-023 三条冻结断言未同批改写 → `ESC` exit 非 0', async () => {
  const { spawnSync } = await import('node:child_process')
  const { withRepoCopy } = await import('./support/dev-workflow-checks.mjs')
  withRepoCopy((dst) => {
    const p = join(dst, 'tools/docgen/test/card-model.test.mjs')
    const s = readFileSync(p, 'utf8')
    const NEW = "  only(run((c) => { c.description = '每轮答辩结束后开始观察（共 3 条）'; }), 'HardcodedCount', 'description');"
    const OLD = "  green(run((c) => { c.description = '每轮答辩结束后开始观察（共 3 条）'; }));"
    assert.equal(s.split(NEW).length - 1, 1, '还原锚必须恰 1 处（T4 Step 4 已把它改成 only）')
    writeFileSync(p, s.split(NEW).join(OLD))
    const r = spawnSync(process.execPath, ['--test', 'tools/docgen/test/card-model.test.mjs'], { cwd: dst, encoding: 'utf8' })
    assert.notEqual(r.status, 0, '还原成「不扫」的旧断言后，实现已扫 description → 必红')
  })
})

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
test('TC-024 policy 删 3 项但不重生成 2 卡 → gate exit 1 `Mismatch`', async () => {
  const { spawnSync } = await import('node:child_process')
  const { withRepoCopy, runCli } = await import('./support/dev-workflow-checks.mjs')
  withRepoCopy((dst) => {
    const p = join(dst, 'tools/docgen/policy/definitions/paths.mjs')
    let s = readFileSync(p, 'utf8')
    for (const item of ["    'lessons/',\n", "    'skills-lock.json',\n", "    'tools/docgen-spike/.tmp-test/',\n"]) {
      assert.equal(s.split(item).length - 1, 1, `删除锚必须恰 1 处：${item.trim()}`)
      s = s.split(item).join('')
    }
    writeFileSync(p, s)
    const r = runCli(dst, ['gate'])
    assert.equal(r.status, 1, r.stdout + r.stderr)
    assert.match(r.stdout + r.stderr, /Mismatch/)
  })
})

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
import { execFileSync } from 'node:child_process';
// 冻结来源 = **改造前那次提交里的旧卡文本**：golden JSON 只有 facts（`forbiddenPaths` 等数组），
// 喂不进 `factsFromBaselineText`（markdown 抽取器），所以这里用 gitShow，不用 golden。
// 锚 `641a7e7`（S6 交付提交）实测：`factsFromBaselineText` → `paths 23 / tools 6 / tier producer`。
// `:12` 的 CARD 与 `:22-23` 的 clone-diff **两处消费都改读它**，断言仍为 23。
const CARD = execFileSync('git', ['show', '641a7e7:agents/reviewer-audit.md'], { encoding: 'utf8' });
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
node tools/docgen/check-shared-refs.mjs             # V5：期望 seats 15 / dangling 0 / nested 0 / keySet8 15 / keySet12 15 => ok
node -e "import('./tools/docgen/components/agentData.mjs').then(({triggerTable})=>{const k=Object.keys(triggerTable).length;console.log('seats '+k+' kindSlot '+k)})"   # V10 字段位：15/15（四值校验归 S-C）
npm run check                                       # TC-010：期望 # tests ≥ 1405 / # fail 0 / check 全部通过
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
| A2 | `@` 引用完整性（PRD V5） | `node tools/docgen/check-shared-refs.mjs` → `seats 15 / dangling 0 / nested 0 / keySet8 15 / keySet12 15 => ok` |
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
| T1 | 新建 `tools/docgen/data/shared.json` + `data/seats/*.json` ×15 + `tools/docgen/test/sa-data-layer.test.mjs`（只 TC-001）；一次性脚本 `.session/tmp/export-seat-data.mjs` 用完已删（`.session/tmp/` 复归为空）；**改 1 处伴随断言** `tools/docgen/test/policy-pure-source.test.mjs` 的 `S6-TC-E03`（期望文件集 3 → 5，补两个席 JSON；spec §10.2.9 第 12 处）；**代码审查后加固 1 处**：TC-001 不再只按 `.json` 过滤，`seats/` 里任何非 `.json` 条目（含子目录）直接判红（探针实测：建 `zz-probe.md` → `actual: ['zz-probe.md']` 必红，删后 `# fail 0`） | `node --test tools/docgen/test/sa-data-layer.test.mjs` → `# tests 1 / # pass 1 / # fail 0`（红→绿两态实跑：红 = `ENOENT … tools\docgen\data`）；`node tools/docgen/cli.mjs gate` → `baseline 38/38`、exit 0；导出脚本自报 `wrote 15 seat files + shared.json（@dutyConstraintDefault 12 席 / @cardRationale 两键 11 席）`；`npm run check` → `# tests 1406 / # pass 1404 / # fail 0`、`check 全部通过` | 三处，均为实测后果：① 导出脚本 `num()` 正则由 `[五六七八九]` 放宽为 `[一二三四五六七八九十]+`（实测 11 席命中值与计划一致）；② 新测试的席数断言改为**派生**（`files.length` vs `agentData.length`）——`counterProbes` 会扫 `tools/docgen/test/*.test.mjs` 的 assert 行，写死 15 会当场红（TC-C06/C11/E09 三条实红后改）；③ 新增 `S6-TC-E03` 一处伴随断言（数据层让「承载该段文本的产物」多两个席 JSON，已补登 spec §10.2.9 第 12 处）。**计划门未预见 ③**，属施工期实跑发现，按「回写 spec 登记 + 门行点名」处置 |
| T2 | 新建 `tools/docgen/components/seatLoader.mjs`（`expandRefs` 纯函数 + `loadSeatData`）+ `tools/docgen/check-shared-refs.mjs`（无参数 CLI）；`components/cardPipeline.mjs` 的 `CARD_KEYS` 加 `export`（内容与顺序一字未改）；`components/validateAgentData.mjs` 的 `EXIT[1]` 追加 4 码（紧挨 `TriggerFieldMisplaced`）；`test/sa-data-layer.test.mjs` 追加 10 条（TC-002/003/004/008/011–016/019/027）。**旧 `agentData.mjs` 未动**（T3 才切薄壳），双跑比对逐条等价 | `node --test tools/docgen/test/sa-data-layer.test.mjs` → 红两态实跑：`SyntaxError: The requested module …cardPipeline.mjs does not provide an export named 'CARD_KEYS'` + `ERR_MODULE_NOT_FOUND …compone…seatLoader.mjs`；绿 → `# tests 10 / # pass 10 / # fail 0`；双跑比对（一次性脚本，用完已删，`.session/tmp/` 复归为空）→ `entries 15 vs 15 / entryDiffs 0 / triggerDiffs 0`；`node tools/docgen/check-shared-refs.mjs` → `check-shared-refs: seats 15 / dangling 0 / nested 0 / keySet8 15 / keySet12 15 => ok`、exit 0；`node tools/docgen/cli.mjs gate` → `baseline 38/38`、exit 0；`npm run check` → `# tests 1415 / # pass 1413 / # fail 0 / # skipped 2`、`④ markdown 检查通过（384 个文件 / 1640 张表）`、`check-observable ok`、末行 `check 全部通过` | 三处，均为实跑后果：① plan Step 1 的 import 行漏 `readFileSync`（TC-011/014/015/027 直接用）→ 合并成一条 `node:fs` import，并抽 `rewrite()` 小 helper 收敛 5 处「读 JSON → 改 → 写回」（语义不变）；② plan 的 loader import 列了未用到的 `patternRegistry` → 实import 只留 `toolsForSeat` / `boundaryBySeat`；③ `check-shared-refs.mjs` 与 plan 逐字一致。**零设计新增**（4 码、判定面三件、`...s` 置末均照 spec §10.2.5/§10.2.6） |
| T2-补 | **独立代码审查（`TRAE-code-review`：两个独立复核实例 + 实跑取证）4 条发现的补丁**：① 席序——新增 `SEAT_ORDER` 常量（只表达顺序）并按序读盘，读盘前与 `seats/*.json` 文件集双向比对；② 环依赖——新增叶模块 `components/cardKeys.mjs`（`CARD_KEYS` 定义迁此，`cardPipeline` 只 re-export、导出面不变），切断 `seatLoader → cardPipeline → agentData → seatLoader`，默认数据目录改函数 `dataDir()`；③ `trigger.when` 必须非空字符串（否则 `MissingWhen`）、`trigger.route` 必须非空字符串（否则 `TriggerMissingRoute`）；④ `seats/` 改 `readdirSync(..., { withFileTypes: true })`，非文件条目（含名为 `x.json` 的目录）/席序缺项或多项 → `InvalidInputPath`。`sa-data-layer.test.mjs` 追加 TC-031（席序冻结，锚 `docs/agents/README.md` 行序）/TC-032/TC-033/TC-034 | `node --test tools/docgen/test/sa-data-layer.test.mjs` → `# tests 14 / # pass 14 / # fail 0`；**判别力实测**：临时打乱 `SEAT_ORDER` 前两项 → TC-031 红，复原转绿；**环依赖实跑**（三段模拟模块，修前修后各跑三入口）：修前入口 `seatLoader` / `cardPipeline` 均 status 1（`DATA` / `CARD_KEYS` TDZ），修后三入口 status 0；`node tools/docgen/check-shared-refs.mjs` → `seats 15 / dangling 0 / nested 0 / keySet8 15 / keySet12 15 => ok`、exit 0；`node tools/docgen/cli.mjs gate` → `baseline 38/38`、exit 0；`npm run check` → `# tests 1419 / # pass 1417 / # fail 0 / # skipped 2`、末行 `check 全部通过` | 审查发现属**计划门未预见**的施工期结构补丁（席序常量与 `cardKeys` 叶模块），已同批回写 spec §10.2.1（文件落点加 1 行）与 §10.2.5（1b 步：席序 / 目录形状 / trigger 类型三件），并在 `②→③@S-A` 门行点名 |
| T3 | `agentData.mjs` 整文件改薄壳（先 import 再 export，保留本地绑定）；9 处伴随断言改指新落点（`tool-tiers` 的 A05 / D10 读 `seatLoader.mjs`、B09 / B10 / C08 注入改席 JSON；`dev-workflow-counts` 的 TC-D06 改指 `seats/senior-sdet.json`、TC-E05 退役构造 A；`sdet-data` 删 TC-005、TC-002(a) 键集去掉 `dimension`）；`acceptance/replace-scenarios.mjs` 的 `DATA` 改指 `seats/senior-sdet.json`（4 处 `patch()` 调用保留）；**纠正 T1 遗留**：删 3 席 JSON 的 `boundary`（唯一源回 policy 定义层，`S6-TC-D02/E01/G05` 三条实红后改）、`S6-TC-E03` 期望集 5 → 3；`sa-data-layer.test.mjs` 追加 TC-030/005/017/018/007/026/029/035；**行号守卫**加「结构替换豁免」白名单（仅 `agentData.mjs`，每条带生效日期与迁往），历史件 37 处行号引用按历史保留不改 | 红态 5 条实红（TC-030/017/018/007/026）；绿：`sa-data-layer` 22/22、`tool-tiers` 47/47、`dev-workflow-counts` 16/16、`sdet-data` 3/3、`card-render` 61/61、`policy-pure-source` 71/71、`lessons` 132/132（自报 `结构替换豁免 37 处`）；`node tools/docgen/cli.mjs gate` → `baseline 38/38`、exit 0；`node tools/docgen/cli.mjs diff --kind agent --name reviewer-product` → `差异 - 0 / + 0`；`npm run check` → `# tests 1426 / # pass 1424 / # fail 0 / # skipped 2`、末行 `check 全部通过` | 五处，均实测后果：① plan 预测「TC-007 在 Step 2 已绿」不成立（薄壳未切时 shell 里仍有装配式）；② TC-E05 构造 A 在数据层不可构造（形状判据先截胡）→ 退役，并补 TC-035 覆盖「席位缺席 / 多出」这条新路径；③ `dimension` 键随 JSON 退场（JSON 存不下 undefined）；④ TC-029 按 testcase 实现（plan 原文的 `a.duty.trigger` 是错路径，实为 `descriptionOf` 的 notWhen 拼接）；⑤ 行号守卫口径由用户裁定走「结构替换豁免」（不改 37 处历史引用），已同批补登 spec §10.2.2（boundary 单源）与 §10.2.9（本条）；**`2026-11-03` T6 审计更正**：§10.2.2 当时确已补登，§10.2.9 当时**未**登记（spec 全文 `行号 / 结构替换 / 37 处` 0 命中，审计 P1-1），已由 T6 同批补登并改表头为「测试侧 14 处 / 9 个文件」 |
| T4 | `tools/docgen/card-model/enums.mjs` 的 `CARD_TEXT_FIELDS` 加 `'description'`（D17）；`tools/docgen/card-model/validateCardModel.mjs` 的 `surfaceTexts` 加 `description` 分支（两处同批 = R4）；`tools/docgen/test/card-model.test.mjs` 的 `S1-TC-G09` 两条 `green(description …)` 改 `only(…)`（R5；`:1141` 的 8 键断言一字未动）；`tools/docgen/test/sa-data-layer.test.mjs` 追加 TC-009 / TC-020+021 / TC-022 / TC-023 | 红态（Step 2，实现未改）：`node --test tools/docgen/test/sa-data-layer.test.mjs` → 3 红（TC-009「PointerToElsewhere 的扫描面必须含 description」/ TC-020+021「应报 PointerToElsewhere，实得 []」/ TC-023「还原锚必须恰 1 处」，`actual 0 / expected 1`）；绿：`card-model.test.mjs` → `# tests 58 / # pass 58 / # fail 0`，`sa-data-layer.test.mjs` → `# tests 26 / # pass 26 / # fail 0`；`node tools/docgen/cli.mjs gate` → `baseline 38/38`、exit 0（description 文本未变，15 席 disk == render 逐字节相同）；`npm run check` → `# tests 1430 / # pass 1428 / # fail 0 / # skipped 2`、`0 findings`、末行 `check 全部通过` | 三处，均实测后果：① plan Step 1 的 TC-022/TC-023 整文件跑 `card-model.test.mjs`，副本缺 `docs/superpowers/specs/2026-10-29-…md`（模块顶层 `readFileSync`）与 `tools/observation-check/**` → 恒 exit 非 0（假绿，与「第 9 键必红」的判别力要求正相反）；改为 `--test-name-pattern S1-TC-G09` 只跑承载断言的那条 + 副本补 S1 spec 一份，并在 spawn 时清 `NODE_TEST_CONTEXT`（父进程是 `node --test` 时子进程继承该变量会以测试子进程身份 exit 0）。② TC-020/021 合并成一条（plan 只列两个码），并按 testcase TC-021 补第三形态 `ProceduralWordOutsideParliament`（`senior-sdet` 是非议会席）。③ `S1-TC-G09` 标题与块注释同步（原写「rationale / description / scenes[].why 三处『不扫』」已与断言相反）；`:1141` 未动 |
| T4-补 | **代码审查（`TRAE-code-review`，2 个独立验证实例）2 条发现的补丁**：① **回扫上游已签件**（R8 缺口）——`2026-10-29-agent-card-s1-card-model-design.md` §4.2 卡文本面加 `description`、§4「三件事」① 限定为「措辞不判」、版本行加 v6.2；`2026-10-29-…-testcase.md` 的 `S1-TC-G09`（标题 / 来源 / 步骤 ②⑦ / 预期 / 判据两行 / 红绿证据）+ 索引三处（§0.2 判别力 `:60`、覆盖总表 `:406`、§7 缺口表 S1-G-7 `:2146`）+ 版本行 v6.2（**净 +1 行**，用例仍 58）② **TC-020/021 改走真实派生链**——注入面改为 `seats/senior-sdet.json` 的 `trigger.notWhen.text`，经 `descriptionOf` 派生后由子进程探针（`runEsm` + `buildCards()`）取卡，补「半改态删 `surfaceTexts` 分支 → `/description/` 命中 0」断言（plan Day-1 只写注释、未断） | `node --test tools/docgen/test/sa-data-layer.test.mjs` → `# tests 26 / # pass 26 / # fail 0`；`node --test tools/docgen/test/card-model.test.mjs` → `# tests 58 / # pass 58 / # fail 0`；`node tools/docgen/cli.mjs gate` → `baseline 38/38`、exit 0；`npm run check` → `# tests 1430 / # pass 1428 / # fail 0 / # skipped 2`、`check 全部通过`；`node scripts/scope-sweep.mjs --check` → `sweep ok`、exit 0 | 两处，均审查发现：① 属 `②@S1` 已签件的**签后增量登记**（PRD §5 `S1-TC-G09` 行本就登记了「改已签件」）；② 原实现绕开 `descriptionOf` 且半改态无断言，与 testcase TC-020 的前置不符 |
| T5 | `policy/definitions/paths.mjs`（`workspace` 删 3 项：21 → 18 数组元素，文件头注释同步；`DETECTION_BLIND_SPOTS` 一字未动）；`policy-pure-source.test.mjs`（A04：`workspace` 6 项 + `pathItems()` 的 19 以绝对数钉一次 + `pathTokens()` 关系式；A06 / C08 / 槽 10 / H02 四处「渲染面 23」改 `=== pathTokens().length` 派生式；**新增 `Q8_MINUS` / `q8Delta()` / `withoutQ8()`**，把 7 条以旧卡（23 项）为 `before` 的 diff 判据改成「差**恰等于** Q8 三项」）；`support/capability-baseline.test.mjs`（`CARD` 改读冻结来源 `git show 641a7e7:…`）；`s3-predicates.test.mjs`（`S3-TC-H06` 回退集补 `paths.mjs`）；`tool-tiers.test.mjs`（两处注释 23→20，断言零改动）；两卡 `draft → replace` 重生成（`replace` 自动写回两席 evidence 的 `renderSha256` / `lastWrittenHash`）；`sa-data-layer.test.mjs` 追加 TC-006 / 024 / 025 / 028 | 绿：`sa-data-layer` 30/30、`policy-pure-source` 71/71、`capability-baseline` 4/4、`s3-predicates` 80/80；`node tools/docgen/cli.mjs gate` → `baseline 38/38`、exit 0；`node scripts/scope-sweep.mjs --check` → `sweep ok`、exit 0；两卡「逐项点名」行实测 20 / 20、全卡 `lessons/` 各 1 行（检测限度段） | 五处，均实测后果：① **TC-024 的构造从「删 3 项」改为「删 1 项现存项」**——Q8 落地后那 3 项已不在定义层，原锚点 0 命中（`删除锚必须恰 1 处` 实红）；判据同形（`Mismatch` + 点名席），并加「4 空格缩进数组项」形态的前置断言（避免被 `DETECTION_BLIND_SPOTS` 里的 `'lessons/'` 误判）。② **TC-028 只落 ①②③**（逐席 `renderSha256` = 盘上哈希 / 两席 `lastWrittenHash` / `baseline.json` 无哈希字段）——plan Step 1 只给了这三条；④⑤ 的 `replace` 段构造未落（负例构造依赖 `--expect-change` + 相位摆位，plan 未纳入，留 ④ 段裁定）。③ `replace` 已自动写回 evidence，plan Step 4 的手工 `node -e` 段未执行（已核两席两字段 = 新哈希）。④ `baseline --write` 无变更（38 条不变，`gate` 已绿）。⑤ **施工期新发现 3 类**（7 条 diff 判据 / `S3-TC-H06` 回退面 / 四处渲染面改派生式）已回写 spec §10.2.9（该表由 12 处改 13 处 / 8 文件；T6 补登 `lessons.test.mjs` 后终态 = 14 处 / 9 个文件）。⑥ `OCR-S1-TC-F07`（`git diff HEAD -- tools/docgen/policy` 为空）**提交前必红**——它拿 HEAD 做基线，Q8 改 policy 后未提交即差分非空；提交后复跑实测已绿（`npm run check` → `# tests 1434 / # pass 1432 / # fail 0 / # skipped 2`、`check 全部通过`，见 `impact-sheet.md` 重 touch 16） |
| T5-补 | **代码审查（`TRAE-code-review`，2 个独立验证实例）2 条发现的补丁**：① **A04 补回绝对计数**——`assert.equal(pathItems().length, 19)`（本行 Step 3 已写、施工时漏落），并删掉 `Object.values(P).flat().length === pathItems().length - 1`（恒真式：`pathItems()` 定义就是 `flat()` 再拼 1，零判别力）；② **Q8 三项收敛为唯一字面**——新增 `support/dev-workflow-checks.mjs` 的 `Q8_REMOVED_PATHS`（顺序 = 旧卡数组序，因 `diffFacts` 的 minus 顺序敏感），`policy-pure-source` 的 `Q8_MINUS` 与 `sa-data-layer` 的 `Q8_REMOVED` 改为引用它（原先三处手抄：两文件各一份 + `TC-006` 内联两份子集） | `node --test tools/docgen/test/policy-pure-source.test.mjs` → `# tests 71 / # pass 71 / # fail 0`；`node --test tools/docgen/test/sa-data-layer.test.mjs` → `# tests 30 / # pass 30 / # fail 0`；`npm run check` → `# tests 1434 / # pass 1432 / # fail 0 / # skipped 2`、`check 全部通过` | 两处，均审查发现：① 恒真断言违背仓内「禁恒真」口径（B02 先例），且漏落了 plan 自己写的 19；② 同一裁定三处字面，漏改会红（fail-closed）但维护成本真；**明确否决**「基线减定义层」动态派生（期望值与实测值同源 → 任何未批准删除被自动豁免） |
| T6 | **收口验收**：① 四条验收命令实跑；② 15 席 SHA 冻结基线（**落点由 plan 的 `docs/superpowers/reviews/<本次>/impact-sheet.md` 改为 `docs/reports/2026-11-03-s-a-card-sha-baseline.md`**，见偏差①）写成一次性记录；③ 回退演练 `git stash -u` → `gate` → `git stash pop`；④ `skills/dev-workflow/references/gate-record.md` 补 **`③@S-A`** 出口行（见偏差②）；⑤ 终态门禁 + 提交；⑥ **独立审计实例**（path B，未参与施工）核 ③ 段四条出口判据 | `node tools/docgen/cli.mjs gate` → `baseline 38/38`（exit 0）；`node tools/docgen/check-shared-refs.mjs` → `check-shared-refs: seats 15 / dangling 0 / nested 0 / keySet8 15 / keySet12 15 => ok`；`seats 15 kindSlot 15`；`npm run check` → `# tests 1434 / # pass 1432 / # fail 0 / # skipped 2`、末行 `check 全部通过`（exit 0）；回退演练 → stash 后 `baseline 38/38`、pop `Already up to date.`；`node scripts/scope-sweep.mjs --check` → `sweep ok（命中未超基线、清单齐、scope 齐）`；`node scripts/check-gate-record.mjs` → `rows 59 bad 0` + `gate-record ok（R1/R2/R6 全过；splitting 0）`（本行写入前），写入后复跑 `rows 60 bad 0` | 三处，均实测后果：① **冻结基线放不进 `docs/superpowers/reviews/<次>/`**（两处门禁各自判红，实测）：(a) 叫 `impact-sheet.md` 会被 `scripts/scope-sweep.mjs:80-94` 的 `findImpactSheet()` 按 mtime 取成「当次改判清单」，而它只有 15 席 SHA、无 32 口径计数 → 4 条 sweep 用例实红（审计首轮 P0-1，独立实跑 `# fail 4`）；(b) 改叫 `sha-baseline.md` 则被 ⑥ 观察产物门禁判 `ArtifactMissing` + `UnclassifiedArtifact`（`tools/observation-check/gate-scan.mjs:5` 的 `ALLOWED_FILE_RE` 只认 8 类名、`:23` 要求目录带 `observation-rN` 产物）。处置 = 落一次性记录 `docs/reports/2026-11-03-s-a-card-sha-baseline.md`（文件头写明两条理由），R8 清单仍留 `.session/reviews/2026-11-03-s-a-plan-gate/impact-sheet.md`，spec §10.2.7 同步改判落点。② **门行口径按 PRD §4 段表更正**：plan 原写「补 `② → ③` 与 `③ → ④` 两行」，但 PRD §4 段表只有 `① / ② / ②→③ / ③ / ④ / ⑤`（**无 `③→④`**），且 `②→③@S-A`（计划门）已在表中 → 本段只补 **`③@S-A`** 一行（申报人 = 开发（主 agent）、签字人 = 审计）。③ **审计首轮不通过**（P0 2 / P1 2 / P2 1）：P0-1 见上；P0-2 = 冻结基线 §三 抄的是建文件**之前**的 `# pass 1432`（建文件后实测 1428/4 红）；P1-1 = T3 行声称「已同批补登 spec §10.2.9」但当时未登记；P1-2 = `skills/managing-lessons-store/scripts/lessons.test.mjs` 改了却不在 File Structure / §10.2.9 表内。处置 = spec §10.2.9 补登该文件（13 处 / 8 文件 → **14 处 / 9 个文件**）+ 本表文件行按实测列全（9 个既有测试 / 验收脚本 + 1 处测试支撑 + 1 个新建）+ 冻结基线加 §四 终态复跑节 → 复核通过（见 `③@S-A` 行） |

### T4 全貌确认（事前三步产物）

- **本质**：`description` 是唯一「进卡面但不在扫描面」的文本字段；根因是「扫描面」有两处表（`CARD_TEXT_FIELDS` 引用表 + `surfaceTexts` 解析分支），只改一处 → 表里有、实现不扫 → 静默空转且 §4 无一条验收能判出（spec R4）。
- **同族**：其余 7 个引用（`duty.trigger` / `duty.categories[]` / `duty.action` / `duty.constraint` / `Action.objects[]` / `CheckItem.label` / `rationale` 豁免面）都在两处表里成对在位；本任务只补 `description` 一处，不挪别的字段。
- **边界**：`SCAN_FIELDS` 仍 8 键（逐码一项，不新增键）；`CARD_MODEL_CODES` 36 码零新增；`description` 的文本与派生公式（`cardPipeline.mjs:61-66` 的 `descriptionOf`）不动。
- **验收**：TC-009（8 键 + 四码含 / 四码不含）→ TC-020+021（三个不同码的 `path` 落在 `description`）→ TC-022（第 9 键必红）→ TC-023（还原旧口径必红）→ `gate` exit 0 → `npm run check` 末行 `check 全部通过`。
- **影响面**：15 席 `description` 实扫（= `trigger.when` + `notWhen.text`）；已核 `tools/docgen/data/**` 对四码词表零命中（含 14 席 `when` 里的「主持人」——全仓无「议长」，`MixedTermInCard` 的成对条件不成立）→ `collectCardFindings` 仍 `0 findings`，`agents/*.md` 逐字节不变。
- **联动四问**：① 治本——两处同批 + 三条冻结断言互锁，半改态与「改了实现不改断言」两种漂移都在结构上判红；② 副作用——`description` 进 `MixedTermInCard` / `ProceduralWordOutsideParliament` 的扫描面（已带 `rationale`），实测 15 席零命中；③ 跨问题——R4 与 R5 是同一根因的两面（实现面 / 断言面），同批改即一次治完；④ 跨项目——只动 `tools/docgen` 卡模型与测试，生成物 `agents/**` 与 `docs/agents/**` 不受影响。

### T5 全貌确认（事前三步产物）

- **本质**：Q8 = 从 `pathGroups.workspace` 删 3 项本仓专属路径（`skills-lock.json` / `lessons/` / `tools/docgen-spike/.tmp-test/`，末者盘上已不存在），使「通用角色卡」不再含项目专属内容。删的是**定义层唯一源**，两张 producer 卡（`reviewer-audit` / `detective-observer`）的边界段随之从 23 项降到 20 项。
- **同族**：`DETECTION_BLIND_SPOTS` 里也有一份 `lessons/`，但那是「检测限度」段（≠ 禁写清单），**不动**（spec R6 已裁定）；其余 13 席走 `DEFAULT_BOUNDARY`、不带该清单 → 卡面不受影响。
- **边界**：只删 `pathGroups.workspace` 的 3 项；`pathGroups` 其余 5 组、`FORBIDDEN_SPEC_PLAN`、`DETECTION_BLIND_SPOTS`、commands / artifacts / tiers 一字不动。
- **验收**：TC-006（「逐项点名」行 20 项 + `.gitignore` 兜底句在位）、TC-024（删而不重生成 → `gate` exit 1 `Mismatch`）、TC-025（逐项点名行三项 `0/0/0`；全卡 `lessons/` 恰 2 且都落在「检测限度」行）、TC-028（`baseline.json` + 2 席 `evidence.json` 同批落盘）、`gate` exit 0、`npm run check` 末行 `check 全部通过`。
- **影响面（实测枚举）**：定义层 `pathItems()` 22→19、卡面 `pathTokens()` 23→20、`Object.values(pathGroups).flat()` 21→18。`policy-pure-source.test.mjs` 的**硬计数断言 4 处**（A04 的三关系式 + A06 成员数 + C08 槽 10 + G 组槽 10 + H02 成员数）必须同批改；`capability-baseline.test.mjs:12` 读**当前卡**断言 23 → 改读冻结来源（`git show 641a7e7:…`，实测该卡 23 项）。
- **施工期新发现（计划门未预见）**：以「改造前基线（23 项）」为 `before` 的 **6 条 diff 判据**（`J03` / `C01` / `C02` / `H02` / `H03` / `H05`）在 Q8 后必然多出 3 条 `minus`。spec §10.2.9 只写了「`:266` / `:318` / `:1213` / `:1694` 四处渲染面 23→20」，未覆盖这条 **diff 面**。处置 = 把「差为空」改成「差**恰等于** Q8 三项」，其余任何差仍判红（不放宽成「不看 minus」）；回写 spec §10.2.9 登记。
- **联动四问**：① 治本——删除只发生在唯一源，两卡由 `draft → replace` 重生成、`gate` 逐字节比对兜底，不做逐卡手改；② 副作用——`capability-baseline` 系列以「改造前旧卡」为基线，Q8 是**有意的能力削减**，必须显式登记「允许的差」，否则要么该红不红（放宽成恒真）要么永远红（不认账）；③ 跨问题——evidence 哈希与 `baseline.json` 两处基线必须同批落盘，漏一处要到下一次 `replace` 才炸（TC-028 已按段构造两码）；④ 跨项目——`agents/*.md` 与 `docs/agents/**` 是生成物，`baseline.json` 的路径清单同源于定义层，`gate` 兜底。

## 自检（写完过一遍）

- **spec 覆盖**：R1→T1/T2；R2→T2；R3→T2/T3；R4→T4；R5→T4；R6→T5；R7→T3（装配点迁移、`...s` 置末）；R8→T2（字段位）；R9→T3/T6。§10.4-1→TC-003/014/015；§10.4-2→T3；§10.4-3→TC-004/019；§10.4-4→T4；§10.4-5→T6。§10.2.7 两处基线→T5。§10.2.9 的 **12 处 / 7 文件**分账：T1 = 改 1 处（`policy-pure-source` 的 `S6-TC-E03` 期望文件集补 2 个席 JSON，T1 施工期实测新增）；T3 = 改 6 处（`tool-tiers` 3、`dev-workflow-counts` 2、`sdet-data` 1）+ 改 1 处 `patch()` 注入目标（`replace-scenarios`，**不删 helper**）+ 靠形态满足 1 处（`card-render` 的 `INJECT_BAD`，不改文件）+ 1 处与 `dev-workflow-counts:146-155` 同处置；T5 = 改 3 处（`policy-pure-source`、`capability-baseline`、`s3-predicates` 的 `S3-TC-H06` 回退集）。1+6+1+1+1+3 = **13**（§10.2.9 表头已同步为 13 处 / 8 文件）。无缺口。
- **占位符扫描**：无 TBD / 「类似 Task N」/ 「加上适当的错误处理」；每个代码步骤都给了可粘贴代码。
- **类型一致**：`expandRefs(value, shared, seat)` 在 T2 定义、T2/T5 测试调用一致；`loadSeatData()` 返回 `{ agentData, triggerTable }` 在 T2 定义、T3 薄壳消费一致；`CARD_KEYS` 由 T2 导出、T2/T6 消费一致。
