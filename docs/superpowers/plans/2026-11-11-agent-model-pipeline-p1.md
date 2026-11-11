# P1 渲染隔离产物 — 实施计划

> **For agentic workers:** 按 Task 顺序执行，每步跑该步命令；红则停，不跳步。步骤用 `- [ ]` 跟踪。

**Goal（目标）:** 7 张模型渲染成「可替换现役卡」的完整卡面，落 `tmp/agent-criteria-demo/sandbox/`，`agents/` 零改动。

**Architecture（架构）:** 数据层加 `seat.tier` / `boundary` → 校验层加 5 码与退出码 → 渲染层加 2 段、修 2 处 → 产物落沙箱 → 报告机械生成。只 import 现役 `renderBoundary` / `DEFAULT_BOUNDARY` / `TIERS`，不改 `tools/docgen/**`。

**Tech Stack（技术栈）:** Node 24（ESM）｜`node:test`（内置测试框架）｜无第三方依赖

**Spec（技术设计）:** `docs/superpowers/specs/2026-11-11-agent-model-pipeline-p1-design.md`
**Testcase（测试用例）:** `docs/superpowers/specs/2026-11-11-agent-model-pipeline-p1-design-testcase.md`（46 条）

## Global Constraints

- 不写 `agents/*.md`；不改 `tools/docgen/**`（只 import）。
- 不改 `models/_baseline/`；不碰 `must` / `never` / `predicates` / `records`。
- 渲染器内不新增一次性手写句；`outputFormat.checks` 禁止 `text`。
- 产物与报告无时间戳、无绝对路径、顺序固定。
- 不自动 commit；每个 Task 结束只记录验证证据，提交由用户决定。

## 开工快照（不可跳过）

```powershell
cd d:\Seed\retro-skills
Get-ChildItem tmp -Directory -Name   # 预期只有 agent-criteria-demo；有 p1-dryrun / p1-case-* 先删
git status --short > tmp/agent-criteria-demo/.p1-start-status
node -v
```

预期（按 2026-11-11 实测）：快照 = 4 改 + 6 未跟踪（`docs/handoffs/…`、`docs/prd/…`、plan、testcase、spec、`rules/title-not-stronger-than-criterion.md`）；`node -v` 首行 `v24.x`。行数以 `git status --porcelain | Measure-Object -Line` 当场复算为准，不写死。

---

### Task 0: PRD 回写

**Files:** `docs/prd/20261111145723-agent-model-pipeline.md`

- [ ] 第 156 行 `**要补的 3 个缺口**` → `**要补的 4 个缺口**`。
- [ ] `## 9 待你确认` → `## 9 已定`；Q1–Q5 建议列全部改为 `已定：A`，每行末尾补 `（依据：…）`。

Run: `(Select-String -Path docs/prd/20261111145723-agent-model-pipeline.md -Pattern '要补的 4 个缺口').Count`
Expected: `1`

---

### Task 1: 模型补字段

**Files:** `tmp/agent-criteria-demo/models/*-model.json` ×7

**Interfaces:** 产出 `seat.tier: string`、`boundary: {kind, text?}`，供 Task 3/5/6 消费。

- [ ] 每席 `seat` 内加 `"tier"`；顶层加 `"boundary"`，按表：

| 席 | tier | boundary |
|---|---|---|
| detective-observer | `producer` | `{"kind":"policy"}` |
| reviewer-audit | `producer` | `{"kind":"policy"}` |
| respondent-dev | `command` | `{"kind":"literal","text":"你是答辩方研发：只读席位，可跑命令复现问题，不改代码；核实结论须带原文摘句与命令输出首行，逐条署名。"}` |
| evidence-reader | `readOnly` | `{"kind":"literal","text":"你是只读取证角色：不得创建、修改、删除任何文件；不出观点、不出问题卡、不参与评审、不判技术对错；只交可核对的原文与行号。"}` |
| respondent-architect | `readOnly` | `{"kind":"literal","text":"你是答辩方架构师：只核实问题卡并汇总答辩方核实结论，不改代码、不写评审结论；核实表逐条署名。"}` |
| reviewer-actuary | `readOnly` | `{"kind":"default"}` |
| reviewer-ai | `readOnly` | `{"kind":"default"}` |

Run: `cd tmp/agent-criteria-demo && node verify-models.mjs`
Expected: 7 行 `EQUIVALENT`（新字段不进基线比对）

---

### Task 2: 先写失败的测试文件

**Files:** Create `tmp/agent-criteria-demo/test-p1.test.mjs`

**Interfaces:** 只依赖 Task 1 的字段；Task 3–8 的实现不得改测试期望。

- [ ] 写入以下完整内容：

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, writeFileSync, cpSync, rmSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { renderModel } from './render/index.mjs'
import { sections, makeHelpers } from './render/sections.mjs'
import { expand } from './verify-models.mjs'
import { TIERS } from '../../tools/docgen/builders/agents/policy/definitions/tiers.mjs'
import { renderBoundary } from '../../tools/docgen/builders/agents/components/renderBoundary.mjs'

const HERE = import.meta.dirname
const ROOT = resolve(HERE, '../..')
const SHARED = JSON.parse(readFileSync(join(HERE, 'models/_shared-model.json'), 'utf8'))
const SEATS = ['detective-observer', 'evidence-reader', 'respondent-architect', 'respondent-dev', 'reviewer-actuary', 'reviewer-ai', 'reviewer-audit']
const POLICY = ['detective-observer', 'reviewer-audit']
const NONPOLICY = ['evidence-reader', 'respondent-architect', 'respondent-dev', 'reviewer-actuary', 'reviewer-ai']
const ALLOC = { 'detective-observer': ['producer', 'policy'], 'reviewer-audit': ['producer', 'policy'], 'evidence-reader': ['readOnly', 'literal'], 'respondent-architect': ['readOnly', 'literal'], 'respondent-dev': ['command', 'literal'], 'reviewer-actuary': ['readOnly', 'default'], 'reviewer-ai': ['readOnly', 'default'] }

const model = (s) => JSON.parse(readFileSync(join(HERE, 'models', `${s}-model.json`), 'utf8'))
const render = (s) => renderModel(join(HERE, 'models', `${s}-model.json`), SHARED).text
const section = (text, name) => text.split(/\n## /).find((x) => x.startsWith(name + '\n')) || ''
const bodyOf = (sec) => sec.slice(sec.indexOf('\n') + 1)
// 段拼接用 join('\n')，末段自带一个尾换行；逐字节比对前只归一化「尾部空白」，正文内容不动
const trimEnd = (s) => s.replace(/\s+$/, '')
const cardSection = (s, name) => {
  const t = readFileSync(join(ROOT, 'agents', `${s}.md`), 'utf8')
  const i = t.indexOf('\n## ' + name + '\n')
  return i < 0 ? '' : t.slice(i + 1).replace(/\s+$/, '')
}
const run = (args, cwd = HERE) => spawnSync(process.execPath, args, { cwd, encoding: 'utf8' })
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex')

// 复制整个 demo 目录并按需改一张模型；verify/render 两种用例共用这一层
function copyCase(mutate, seat = 'evidence-reader') {
  const dir = join(HERE, '..', 'p1-case-' + process.pid)
  rmSync(dir, { recursive: true, force: true })
  cpSync(HERE, dir, { recursive: true, filter: (src) => !src.includes('sandbox') && !src.includes('p1-case-') })
  if (mutate) {
    const p = join(dir, 'models', `${seat}-model.json`)
    const m = JSON.parse(readFileSync(p, 'utf8'))
    mutate(m)
    writeFileSync(p, JSON.stringify(m, null, 2))
  }
  return dir
}

function caseCopy(mutate, seat) {
  const dir = copyCase(mutate, seat)
  return { dir, out: run(['verify-models.mjs'], dir) }
}

test('TC-001/002 7 席 tier 与 boundary 分配', () => {
  for (const s of SEATS) {
    assert.equal(model(s).seat.tier, ALLOC[s][0], s)
    assert.equal(model(s).boundary.kind, ALLOC[s][1], s)
  }
})

test('TC-044 verify 全绿且 exit 0', () => {
  const r = run(['verify-models.mjs'])
  assert.equal(r.status, 0, r.stdout + r.stderr)
  assert.equal(r.stdout.trim().split('\n').filter((l) => /EQUIVALENT$/.test(l)).length, 7)
})

test('TC-016 tools = TIERS[seat.tier]', () => {
  for (const s of SEATS) {
    assert.match(render(s), new RegExp('^tools: ' + TIERS[model(s).seat.tier].join(', ') + '$', 'm'), s)
  }
  // §4.5-2：渲染层只能是 import 现役档位表（Task 4 后为 TIERS），不得复制数组字面量
  const src = readFileSync(join(HERE, 'render/sections.mjs'), 'utf8')
  assert.match(src, /import\s*\{[^}]*\bTIERS\b[^}]*\}\s*from\s*'[^']*tiers\.mjs'/)
  assert.doesNotMatch(src, /\['Read',\s*'Glob'/)
})

test('TC-020 越界处置按 steps 序号', () => {
  const sec = section(render('detective-observer'), '越界处置')
  assert.match(sec, /^1\. 立即停手。/m)
  assert.match(sec, /^2\. /m)
  assert.match(sec, /^3\. /m)
  const m = expand(join(HERE, 'models/detective-observer-model.json'))
  const four = { ...m, escalation: { ...m.escalation, steps: [...m.escalation.steps, { kind: 'halt', text: '第四步。' }] } }
  const h = makeHelpers({ ...SHARED, ...four }, SHARED)
  assert.ok(sections.escalation(four, SHARED, h).includes('4. 第四步。'))
})

test('TC-010/011 outputFormat 段与行数公式', () => {
  for (const s of SEATS) {
    const m = model(s)
    const sec = section(render(s), '输出格式')
    assert.equal(Boolean(sec), Boolean(m.outputFormat), s)
    if (m.outputFormat) {
      const n = sec.split('\n').filter((l) => l.trim()).length
      assert.equal(n, m.outputFormat.requiredFields.length + m.outputFormat.checks.length + 5, s)
    }
  }
})

test('TC-014 refExists 派生且 OP 键集为 22', () => {
  const m = model('detective-observer')
  const OP = makeHelpers({ ...SHARED, ...m }, SHARED).OP
  assert.equal(Object.keys(OP).length, 22)
  assert.ok('refExists' in OP)
  const sec = section(render('detective-observer'), '输出格式')
  assert.match(sec, /卡号存在/)
  assert.doesNotMatch(sec, /refExists/)
  for (const s of SEATS) {
    const m = model(s)
    if (!m.outputFormat) continue
    const lines = section(render(s), '输出格式').split('\n').filter((l) => /^- /.test(l))
    assert.equal(lines.length, m.outputFormat.checks.length, s)
  }
})

test('TC-013 outputFormat.checks 无 text 键', () => {
  for (const s of SEATS) {
    const m = model(s)
    for (const c of m.outputFormat?.checks || []) assert.ok(!('text' in c), s)
  }
})

test('TC-012 无 outputFormat 时不留空标题', () => {
  const dir = copyCase((m) => { delete m.outputFormat }, 'reviewer-ai')
  const t = renderModel(join(dir, 'models/reviewer-ai-model.json'), JSON.parse(readFileSync(join(dir, 'models/_shared-model.json'), 'utf8'))).text
  rmSync(dir, { recursive: true, force: true })
  assert.ok(!t.includes('\n## 输出格式\n'), '空段不得留标题')
})

test('TC-006 policy 边界与 renderBoundary 逐字节相等', () => {
  for (const s of POLICY) assert.equal(trimEnd(bodyOf(section(render(s), '边界'))), trimEnd(renderBoundary(s)), s)
})

test('TC-007 非 policy 边界与现役卡逐字节相等', () => {
  for (const s of NONPOLICY) assert.equal(trimEnd(bodyOf(section(render(s), '边界'))), trimEnd(bodyOf(cardSection(s, '边界'))), s)
})

test('TC-008 段顺序', () => {
  const t = render('detective-observer')
  const idx = ['职责', '一定会', '禁止', '冲突裁决', '本席清单', '输出格式', '产出', '权限', '越界处置', '边界']
    .map((n) => t.indexOf('\n## ' + n + '\n'))
  assert.ok(idx.every((i) => i >= 0), JSON.stringify(idx))
  assert.deepEqual(idx, [...idx].sort((a, b) => a - b))
})

test('TC-040 policy 非写席 → BOUNDARY_POLICY_NONWRITER，exit 1', () => {
  const { dir, out } = caseCopy((m) => { m.boundary = { kind: 'policy' } })
  rmSync(dir, { recursive: true, force: true })
  assert.match(out.stdout, /BOUNDARY_POLICY_NONWRITER/)
  assert.equal(out.status, 1)
})

test('TC-017 TIER_MISMATCH', () => {
  const { dir, out } = caseCopy((m) => { m.seat.tier = 'producer' })
  rmSync(dir, { recursive: true, force: true })
  assert.match(out.stdout, /TIER_MISMATCH/)
  assert.equal(out.status, 1)
})

test('TC-031 BOUNDARY_KIND_UNKNOWN', () => {
  const { dir, out } = caseCopy((m) => { m.boundary = { kind: 'boom' } })
  rmSync(dir, { recursive: true, force: true })
  assert.match(out.stdout, /BOUNDARY_KIND_UNKNOWN/)
  assert.equal(out.status, 1)
})

test('TC-019 未知档位值 → TIER_MISMATCH，exit 1', () => {
  const { dir, out } = caseCopy((m) => { m.seat.tier = 'admin' })
  rmSync(dir, { recursive: true, force: true })
  assert.match(out.stdout, /TIER_MISMATCH/)
  assert.equal(out.status, 1)
})

test('TC-032 空白 text 只发 BOUNDARY_TEXT_MISSING', () => {
  const { dir, out } = caseCopy((m) => { m.boundary = { kind: 'literal', text: ' ' } })
  rmSync(dir, { recursive: true, force: true })
  assert.match(out.stdout, /BOUNDARY_TEXT_MISSING/)
  assert.doesNotMatch(out.stdout, /BOUNDARY_TEXT_WHITESPACE/)
  assert.equal(out.status, 1)
})

test('TC-004 default 两席只有 kind，模型不复制常量', () => {
  for (const s of ['reviewer-actuary', 'reviewer-ai']) assert.deepEqual(Object.keys(model(s).boundary), ['kind'])
  for (const f of readdirSync(join(HERE, 'models')).filter((f) => f.endsWith('.json'))) {
    assert.ok(!readFileSync(join(HERE, 'models', f), 'utf8').includes('你是只读评审角色'), f)
  }
})

test('TC-015 输出格式表头只有两列', () => {
  const sec = section(render('detective-observer'), '输出格式')
  assert.match(sec, /^\| # \| 字段 \|$/m)
  assert.doesNotMatch(sec, /nonEmpty|required|"type"/)
})

test('TC-022 调换步序后编号跟序号', () => {
  const m = expand(join(HERE, 'models/detective-observer-model.json'))
  const [halt, report, ...rest] = m.escalation.steps
  const swapped = { ...m, escalation: { ...m.escalation, steps: [report, halt, ...rest] } }
  const h = makeHelpers({ ...SHARED, ...swapped }, SHARED)
  const out = sections.escalation(swapped, SHARED, h)
  assert.match(out[1], /^1\. 越权信息报/)
  assert.match(out[2], /^2\. 立即停手。/)
})

test('TC-023 5 席无越界处置段', () => {
  for (const s of NONPOLICY) assert.ok(!render(s).includes('\n## 越界处置\n'), s)
})

test('TC-034/035 空 must/never 返回 []', () => {
  assert.deepEqual(sections.must({ must: [] }, SHARED, {}), [])
  assert.deepEqual(sections.never({ never: [] }, SHARED, {}), [])
})

test('TC-036 literal 首尾空白原样渲染', () => {
  const padded = ' ' + model('evidence-reader').boundary.text + '\n'
  const dir = copyCase((m) => { m.boundary.text = padded })
  const t = renderModel(join(dir, 'models/evidence-reader-model.json'), JSON.parse(readFileSync(join(dir, 'models/_shared-model.json'), 'utf8'))).text
  const sec = t.split(/\n## /).find((x) => x.startsWith('边界\n'))
  rmSync(dir, { recursive: true, force: true })
  const body = sec.slice('边界\n'.length)
  assert.ok(body.startsWith(padded), '正文必须原样包含带首尾空白的 text')
  assert.ok(body.startsWith(' '), '首部空格不得被 trim')
})

test('TC-041 非空带首尾空白只发 WHITESPACE', () => {
  const { dir, out } = caseCopy((m) => { m.boundary.text = m.boundary.text + ' ' })
  rmSync(dir, { recursive: true, force: true })
  assert.match(out.stdout, /BOUNDARY_TEXT_WHITESPACE/)
  assert.doesNotMatch(out.stdout, /BOUNDARY_TEXT_MISSING/)
  assert.equal(out.status, 1)
})

test('TC-024/025 render-all 落 sandbox、7 文件、两次字节同、无 sandbox 字样', () => {
  assert.equal(run(['render-all.mjs']).status, 0)
  const files = readdirSync(join(HERE, 'sandbox')).filter((f) => f.endsWith('.md') && f !== 'diff-report.md').sort()
  assert.equal(files.length, 7)
  const before = Object.fromEntries(files.map((f) => [f, sha(join(HERE, 'sandbox', f))]))
  assert.equal(run(['render-all.mjs']).status, 0)
  for (const f of files) {
    assert.equal(sha(join(HERE, 'sandbox', f)), before[f], f)
    assert.ok(!readFileSync(join(HERE, 'sandbox', f), 'utf8').includes('sandbox'), f)
  }
})

test('TC-026 --out 相对脚本目录解析（cwd 故意设为仓库根）', () => {
  const script = join(HERE, 'render-all.mjs')
  const abs = join(HERE, 'abs-out')
  assert.equal(run([script, '--out', 'rel-out'], ROOT).status, 0)
  assert.equal(readdirSync(join(HERE, 'rel-out')).filter((f) => f.endsWith('.md')).length, 7)
  assert.ok(!existsSync(join(ROOT, 'rel-out')), '不得按 process.cwd() 解析')
  assert.equal(run([script, '--out', abs], ROOT).status, 0)
  assert.equal(readdirSync(abs).filter((f) => f.endsWith('.md')).length, 7)
  rmSync(join(HERE, 'rel-out'), { recursive: true, force: true })
  rmSync(abs, { recursive: true, force: true })
})

test('TC-042/028 报告五节列名冻结且两次字节相同', () => {
  assert.equal(run(['render-all.mjs']).status, 0)
  assert.equal(run(['diff-report.mjs']).status, 0)
  const p = join(HERE, 'sandbox/diff-report.md')
  const t = readFileSync(p, 'utf8')
  for (const h of ['## 总览', '## 段级差异', '## 边界核对', '## 缺失项', '## 已知差异归类']) assert.ok(t.includes(h), h)
  assert.match(t, /^\| 席 \| 类型 \| 沙箱行数 \| 现役行数 \| 沙箱字符 \| 现役字符 \| 段数（沙箱\/现役） \| 边界形态 \| 边界一致 \| 输出格式 \|$/m)
  assert.match(t, /^\| 席 \| 段 \| 状态 \| 字符差 \|$/m)
  assert.match(t, /^\| 席 \| 形态 \| 沙箱长度 \| 现役长度 \| 逐字节相等 \|$/m)
  assert.match(t, /^\| 席 \| 缺失项 \| 原因 \|$/m)
  assert.match(t, /^\| # \| 差异 \| 依据 \|$/m)
  assert.match(t, /reviewer-audit \| 输出格式 \|/)
  assert.equal(readdirSync(join(HERE, 'sandbox')).filter((f) => f.endsWith('.md')).length, 8, '7 张卡 + 1 份报告')
  assert.ok(!/\d{4}-\d{2}-\d{2}T/.test(t))
  const first = sha(p)
  assert.equal(run(['diff-report.mjs']).status, 0)
  assert.equal(sha(p), first, '两次报告须字节相同')
})

test('TC-046 render-all 首个抛错即停、已写文件保留', () => {
  const { dir } = caseCopy((m) => { m.boundary = { kind: 'boom' } }, 'reviewer-ai')
  rmSync(join(dir, 'sandbox'), { recursive: true, force: true })
  // 用副本自己的 models 目录取顺序（render-all 读的也是这一份，避免依赖两个目录的 readdir 顺序一致）
  const order = readdirSync(join(dir, 'models')).filter((f) => f.endsWith('-model.json') && !f.startsWith('_')).map((f) => f.replace('-model.json', ''))
  const bad = order.indexOf('reviewer-ai')
  const r = run(['render-all.mjs'], dir)
  const files = existsSync(join(dir, 'sandbox')) ? readdirSync(join(dir, 'sandbox')).filter((f) => f.endsWith('.md')) : []
  rmSync(dir, { recursive: true, force: true })
  assert.equal(r.status, 1)
  assert.equal(files.length, bad, `坏席之前的产物应保留、之后不再写：${files.length} vs ${bad}`)
  for (const s of order.slice(bad)) assert.ok(!files.includes(`${s}.md`), s)
  for (const s of order.slice(0, bad)) assert.ok(files.includes(`${s}.md`), s)
})

test('TC-037 PRD 回写', () => {
  const t = readFileSync(join(ROOT, 'docs/prd/20261111145723-agent-model-pipeline.md'), 'utf8')
  assert.equal((t.match(/要补的 4 个缺口/g) || []).length, 1)
  assert.ok(!t.includes('## 9 待你确认'))
  assert.match(t, /^## 9 已定$/m)
})
```

- [ ] Run: `cd tmp/agent-criteria-demo && node --test test-p1.test.mjs`
- [ ] Expected: 红，失败点至少命中 `TC-016`（tools 错）、`TC-010`（无输出格式）、`TC-006`（无边界）、`TC-042`（无报告）。把失败条数记入执行记录。

---

### Task 3: 校验器 5 码 + 退出码

**Files:** `tmp/agent-criteria-demo/verify-models.mjs`

**Interfaces:** `verify(name)` 返回体新增 `tierBad`、`boundaryBad`（字符串，空 = 通过）。

- [ ] 顶部 import 补 `TIERS`（与现有 `tierOfCapabilities` 同一行）。
- [ ] `verify()` 内、`const tier = tierOfCapabilities(policy.capabilities)` 之后加：

```js
const modelTier = exp.seat?.tier
const tierBad = modelTier === tier ? '' : `TIER_MISMATCH model=${modelTier} policy=${tier}`
const b = exp.boundary || {}
const boundaryBad =
  !['policy', 'literal', 'default'].includes(b.kind) ? `BOUNDARY_KIND_UNKNOWN ${b.kind}`
  : b.kind === 'literal' && (typeof b.text !== 'string' || b.text.trim() === '') ? 'BOUNDARY_TEXT_MISSING'
  : b.kind === 'literal' && b.text !== b.text.trim() ? 'BOUNDARY_TEXT_WHITESPACE'
  : b.kind === 'policy' && !(TIERS[modelTier] || []).includes('Write') ? 'BOUNDARY_POLICY_NONWRITER'
  : ''
```

- [ ] `return { … }` 里加 `tierBad, boundaryBad`。
- [ ] 主入口每席行末追加 `r.tierBad` / `r.boundaryBad`（非空才印）。
- [ ] 主循环后加：

```js
const anyError = (r) => r.errs.length || r.ownFail.length || r.policyDiff || r.pathUndefined.length ||
  r.actionConflict.length || r.unknownAction.length || r.permOrphan.length || r.permUnobservable.length ||
  r.titleDrifts.length || r.pathBad.length || r.skillBad.length || r.triggerBad.length || r.actionBad.length ||
  r.outputTextHandwritten.length || r.typeErr || r.writeScopeBad || r.outputUnwritable.length || r.cardRuleLeak.length ||
  r.tierBad || r.boundaryBad
let failed = false
```

- [ ] 循环里置 `failed ||= Boolean(anyError(r))`；末尾 `if (failed) process.exitCode = 1`。

Run: `cd tmp/agent-criteria-demo && node verify-models.mjs; echo "exit=$LASTEXITCODE"`
Expected: 7 行 `EQUIVALENT`，`exit=0`

---

### Task 4: `tools` 改源 + 越界编号

**Files:** `tmp/agent-criteria-demo/render/sections.mjs`

- [ ] import 改为 `import { TIERS } from '../../../tools/docgen/builders/agents/policy/definitions/tiers.mjs'`，删除 `tierOfCapabilities`、`SEAT_POLICY` 的 import。
- [ ] 删除 90–92 行三行，替换为：

```js
const tools = TIERS[M.seat.tier] || []
```

- [ ] `escalation` 改为：

```js
for (const [i, s] of esc.steps.entries()) {
  const n = i + 1
  if (s.kind === 'halt') out.push(`${n}. ${s.text}`)
  if (s.kind === 'report') out.push(`${n}. 越权信息报${esc.recipients[s.to]}：${esc.report.fields.map((f) => h.R[esc.report.record].shape.find((x) => x.id === f).label).join('、')}。`)
  if (s.kind === 'voidRound') out.push(`${n}. 本轮结论作废，报${esc.recipients[s.to]}。`)
}
```

Run: `cd tmp/agent-criteria-demo && node --test --test-name-pattern="TC-016|TC-020" test-p1.test.mjs`
Expected: 2 pass

---

### Task 5: `outputFormat` 段 + `refExists`

**Files:** `tmp/agent-criteria-demo/render/sections.mjs`

- [ ] `OP` 在 `makeHelpers` 函数体内，不能 `export`：改为在 `makeHelpers` 的 `return {...}` 里补 `OP`（测试按 `makeHelpers({ ...SHARED, ...m }, SHARED).OP` 取键集；第一参必须含 `shared.vocab`），并加 `refExists: (o) => `${fieldLabel(o.ofRef, o.field)}存在`,`。
- [ ] `sections` 加：

```js
outputFormat(M, shared, h) {
  const o = M.outputFormat
  if (!o) return []
  const out = [`## ${o.title}`, '必填字段：', '', '| # | 字段 |', '|---|---|']
  o.requiredFields.forEach((f, i) => out.push(`| ${i + 1} | ${f.label} |`))
  out.push('', '校验：', '')
  for (const c of o.checks || []) out.push(`- ${h.renderObs(c.observable)}`)
  out.push('')
  return out
}
```

Run: `cd tmp/agent-criteria-demo && node --test --test-name-pattern="TC-010|TC-011|TC-014" test-p1.test.mjs`
Expected: 2 pass（`TC-010/011` 合为一条）

---

### Task 6: `boundary` 段 + 段表定位

**Files:** `tmp/agent-criteria-demo/render/sections.mjs`、`render/index.mjs`

- [ ] `sections.mjs` 顶部加：

```js
import { renderBoundary } from '../../../tools/docgen/builders/agents/components/renderBoundary.mjs'
import { DEFAULT_BOUNDARY } from '../../../tools/docgen/builders/agents/components/patternRegistry.mjs'
```

- [ ] `sections` 加：

```js
boundary(M) {
  const b = M.boundary || {}
  const body =
    b.kind === 'policy' ? renderBoundary(M.seat.id)
    : b.kind === 'literal' ? b.text
    : b.kind === 'default' ? DEFAULT_BOUNDARY
    : (() => { throw new Error('BOUNDARY_KIND_UNKNOWN ' + b.kind) })()
  return ['## 边界', body, '']
}
```

- [ ] `render/index.mjs` 的 3 个类型段表统一改为：

```js
['frontmatter', 'duty', 'must', 'never', 'conflict', 'checklist', 'outputFormat', 'outputs', 'permissions', 'escalation', 'boundary']
```

Run: `cd tmp/agent-criteria-demo && node --test --test-name-pattern="TC-006|TC-007" test-p1.test.mjs`
Expected: 2 pass

---

### Task 7: `render-all` 落沙箱

**Files:** `tmp/agent-criteria-demo/render-all.mjs`

- [ ] 改为：

```js
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderModel } from './render/index.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const shared = JSON.parse(readFileSync(join(here, 'models/_shared-model.json'), 'utf8'))
const i = process.argv.indexOf('--out')
if (i > -1 && !process.argv[i + 1]) {
  console.error('用法：node render-all.mjs [--out <dir>]')
  process.exit(1)
}
const outDir = resolve(here, i > -1 ? process.argv[i + 1] : 'sandbox')
mkdirSync(outDir, { recursive: true })
// 先清掉上一轮产物：模型改名/删席后旧 <seat>.md 不得残留（否则「N 个 md」的计数断言会假红）
for (const f of readdirSync(outDir)) if (f.endsWith('.md')) rmSync(join(outDir, f))

try {
  for (const f of readdirSync(join(here, 'models'))) {
    if (f.startsWith('_') || !f.endsWith('-model.json')) continue
    const { type, text, lines } = renderModel(join(here, 'models', f), shared)
    const id = f.replace('-model.json', '')
    writeFileSync(join(outDir, `${id}.md`), text)
    console.log(`${id.padEnd(22)} [${type}] ${lines} lines`)
  }
} catch (e) {
  console.error(e.message)
  process.exit(1)
}
```

Run: `cd tmp/agent-criteria-demo && node render-all.mjs; echo "exit=$LASTEXITCODE"`
Expected: 7 行，`exit=0`

---

### Task 8: 差异报告

**Files:** Create `tmp/agent-criteria-demo/diff-report.mjs`

- [ ] 写入：

```js
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expand } from './verify-models.mjs'
import { typeOf } from './render/index.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')
const SEATS = ['detective-observer', 'evidence-reader', 'respondent-architect', 'respondent-dev', 'reviewer-actuary', 'reviewer-ai', 'reviewer-audit']
const SHARED = JSON.parse(readFileSync(join(HERE, 'models/_shared-model.json'), 'utf8'))
const split = (text) => text.split(/\n## /).slice(1).map((x) => {
  const i = x.indexOf('\n')
  return { name: x.slice(0, i), body: x.slice(i + 1).replace(/\s+$/, '') }
})
const secOf = (secs, n) => secs.find((s) => s.name === n)
const bodyOf = (secs, n) => (secOf(secs, n) || { body: '' }).body
const lines = (t) => t.split('\n').length

const rows = [], diffRows = [], bRows = [], missRows = []
for (const s of SEATS) {
  const sand = readFileSync(join(HERE, 'sandbox', `${s}.md`), 'utf8')
  const card = readFileSync(join(ROOT, 'agents', `${s}.md`), 'utf8')
  const a = split(sand), b = split(card)
  const kind = JSON.parse(readFileSync(join(HERE, 'models', `${s}-model.json`), 'utf8')).boundary.kind
  const type = typeOf({ ...SHARED, ...expand(join(HERE, 'models', `${s}-model.json`)) }) || '-'
  const bsec = bodyOf(a, '边界'), csec = bodyOf(b, '边界')
  const ok = bsec === csec
  rows.push(`| ${s} | ${type} | ${lines(sand)} | ${lines(card)} | ${sand.length} | ${card.length} | ${a.length}/${b.length} | ${kind} | ${ok ? '是' : '否'} | ${secOf(a, '输出格式') ? '有' : '无'} |`)
  for (const n of new Set([...a.map((x) => x.name), ...b.map((x) => x.name)])) {
    const sa = secOf(a, n), sb = secOf(b, n)
    // 段存在但正文为空 ≠ 段缺失；字符差只在两侧都存在时才算
    const st = !sa ? '仅现役' : !sb ? '仅沙箱' : sa.body === sb.body ? '一致' : '文本不同'
    const delta = !sa || !sb ? '-' : sa.body.length - sb.body.length
    diffRows.push(`| ${s} | ${n} | ${st} | ${delta} |`)
  }
  bRows.push(`| ${s} | ${kind} | ${bsec.length} | ${csec.length} | ${ok ? '是' : '否'} |`)
  if (!secOf(a, '输出格式')) missRows.push(`| ${s} | 输出格式 | 模型无 outputFormat 配置（P4 建模） |`)
}

const md = [
  '# P1 差异报告',
  '',
  '## 总览',
  '',
  '| 席 | 类型 | 沙箱行数 | 现役行数 | 沙箱字符 | 现役字符 | 段数（沙箱/现役） | 边界形态 | 边界一致 | 输出格式 |',
  '|---|---|---|---|---|---|---|---|---|---|',
  ...rows,
  '',
  '## 段级差异',
  '',
  '| 席 | 段 | 状态 | 字符差 |',
  '|---|---|---|---|',
  ...diffRows,
  '',
  '## 边界核对',
  '',
  '| 席 | 形态 | 沙箱长度 | 现役长度 | 逐字节相等 |',
  '|---|---|---|---|---|',
  ...bRows,
  '',
  '## 缺失项',
  '',
  '| 席 | 缺失项 | 原因 |',
  '|---|---|---|',
  ...(missRows.length ? missRows : ['| - | - | 无 |']),
  '',
  '## 已知差异归类',
  '',
  '| # | 差异 | 依据 |',
  '|---|---|---|',
  '| K1 | 沙箱多出 `## 产出` / `## 权限` 两段；2 张 policy 席另多 `## 越界处置` | spec S8；现役卡无这三段 |',
  '| K2 | `outputFormat` 校验由 observable 派生，措辞弱于现役散文 | spec S5 |',
  '| K3 | `reviewer-audit` 缺 `## 输出格式` | spec S6；P4 补建模 |',
  '| K4 | 边界形态三套并存 | spec S1/S2；现役事实 |',
  '| K5 | `seat.tier` 与策略档位并存 | spec S4；`TIER_MISMATCH` 守卫 |',
  '',
].join('\n')
writeFileSync(join(HERE, 'sandbox', 'diff-report.md'), md)
console.log('sandbox/diff-report.md')
```

- [ ] Run: `cd tmp/agent-criteria-demo && node diff-report.mjs`
- [ ] Expected: 打印 `sandbox/diff-report.md`；文件含 5 节、总览 10 列。

---

### Task 9: 全量验收

- [ ] Run: `cd tmp/agent-criteria-demo && node --test test-p1.test.mjs`
- [ ] Expected: 全 pass，`# fail 0`。
- [ ] Run: `node render-all.mjs; node render-all.mjs`
- [ ] Expected: 两次各 7 行、exit 0；sandbox 7 个 md 的 sha256 前后一致。
- [ ] Run: `node verify-models.mjs; echo "exit=$LASTEXITCODE"`
- [ ] Expected: 7 行 `EQUIVALENT`，`exit=0`，无 `POLICY_DIFF` / `TYPE_*` / `TIER_MISMATCH` / `BOUNDARY_*`。
- [ ] Run: `cd d:\Seed\retro-skills && git status --short agents/`
- [ ] Expected: 空。
- [ ] Run: `git status --short > tmp/agent-criteria-demo/.p1-end-status; git diff --no-index tmp/agent-criteria-demo/.p1-start-status tmp/agent-criteria-demo/.p1-end-status`
- [ ] Expected: 两文件逐字节相同（`git diff --no-index` 无输出）。`tmp/` 被 `.gitignore:28` 忽略，`sandbox/` 内的新增不进 `git status`；`tools/docgen/**`、`agents/**` 无新增行。
- [ ] 把 46 条 testcase 的「执行状态」交回 senior-sdet 子代理更新（主 agent 不改判据）。
- [ ] 清理测试临时副本：`Get-ChildItem tmp/p1-case-* -Directory -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force`；再核 `Get-ChildItem tmp -Directory -Name` 只剩 `agent-criteria-demo`。

**交付记录（写入对话，不新建文档）**

| 项 | 命令 | 首行/结果 |
|---|---|---|
| 测试 | `node --test test-p1.test.mjs` | `# pass` / `# fail 0` |
| 渲染 | `node render-all.mjs` | 7 行 / exit 0 |
| 确定性 | 两次 sha256 | 7/7 相同 |
| 等价 | `node verify-models.mjs` | 7 行 EQUIVALENT |
| 排除面 | `git status --short agents/` | 空 |
| 报告 | `sandbox/diff-report.md` | 5 节齐全 |
