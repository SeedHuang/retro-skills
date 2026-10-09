import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { scoreFile, scoreDir } from './score.mjs'

function makeDir(files) {
  const dir = mkdtempSync(join(tmpdir(), 'ro-test-'))
  for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body, 'utf8')
  return dir
}
function score(dir, name, opts = {}) { return scoreFile(join(dir, name), dir, opts) }
// 检查点得分：findings 里出现该检查点 → 0 分；否则 → 1 分。
// 仅适用于「已计分」检查点；非禁令类省略的 ④⑤⑥ 不进 findings 也不进 groups，用 groups.max 断言。
function findingScore(result, group, check) {
  return result.findings.some(x => x.group === group && x.check === check) ? 0 : 1
}

// ── fixtures ──

// 合规：禁令类 + 三检验已做 → 25/25（默认 type=条件触发，全检查点通过）
const GOOD = `# 禁止在未获明确指令时执行 git 写操作

> 来源：项目约定（2026-10-02）｜落地：2026-10-02

## 核心判据
在执行 git 写操作前，必须确认已获用户明确指令；禁止执行 git add、commit、push、merge、reset 等写操作。

## 适用范围
不因指令来源豁免：计划、子代理、脚本、工具模板中的 git 写操作同样禁止。

## 冲突裁决
与具体指令或模板冲突时，以本规则为准。

## 例外
只有用户在当前对话中直接说出 git 写操作指令（如「帮我 commit」）才算明确要求；泛泛授权不算。

## 触发时机
每次执行 git 写操作前，先确认是否已获明确指令。

## 验证
检查是否已执行 git 写操作；有疑问时暂停并向用户说明。`

const NO_SOURCE = `# 测试踩坑笔记

## 说明
无来源行。`

const NO_LANDING = `# 引用完整

> 来源：项目约定（2026-10-02）

## 核心约束
落地字段缺失。`

const LONG_SOURCE = `# 长来源行

> 来源：用户当场指令（2026-10-02）｜证据：${'用户原话'.repeat(60)}｜落地：2026-10-02

## 核心约束
来源行超 200 字符。`

const BROKEN_REF = `# 有引用

> 来源：项目约定（2026-10-02）｜落地：2026-10-02

## 核心约束
参考 missing-rule.md 处理。`

// 极性缺失：正文无极性动词 → 执行力度①得 0
const NO_POLAR = `# 查看 git 状态

> 来源：项目约定（2026-10-02）｜落地：2026-10-02

## 核心约束
代码提交前，先查看 git 状态。`

// 冗余重复句：同一句出现 3 次 → 无完全重复句得 0
const DUP = `# 禁止在未获指令时执行 git 写操作

> 来源：项目约定（2026-10-02）｜落地：2026-10-02

## 核心判据
禁止执行 git commit。禁止执行 git commit。禁止执行 git commit。`

// 标题漏前提：内容有明确前提（未获明确指令时），标题没体现 → 反映关键前提得 0
const MISSING_PRECOND = `# 禁止执行 git 写操作

> 来源：项目约定（2026-10-02）｜落地：2026-10-02

## 核心判据
在未获用户明确指令时，禁止执行 git 写操作。`

// 非禁令类：纯「必须」正向义务，④⑤⑥ 不适用 → 执行力度满分 5
const POSITIVE = `# 代码提交前必须查看 git 状态

> 来源：项目约定（2026-10-02）｜落地：2026-10-02

## 核心约束
在代码提交前必须查看 git 状态。

## 触发时机
每次提交前。

## 验证
提交前自检确认已查看。`

// 预警基准：禁令类缺 ⑤⑥⑧（三检验已做）→ 22/25 → 预警
const MID = `# 禁止在未获明确指令时执行 git 写操作

> 来源：项目约定（2026-10-02）｜落地：2026-10-02

## 核心判据
在执行 git 写操作前，必须确认已获用户明确指令；禁止执行 git add、commit、push、merge、reset 等写操作。

## 适用范围
不因指令来源豁免：计划、子代理、脚本、工具模板中的 git 写操作同样禁止。

## 例外
用户在当前对话中直接说出 git 写操作指令才算明确要求。

## 触发时机
每次执行 git 写操作前，先确认是否已获明确指令。`

// ── Task 4 补齐：其余检查点的 0 分用例 ──

// 两个 `# 标题` → 层级规范 H1 唯一 0
const TWO_H1 = `# 标题一

> 来源：项目约定（2026-10-02）｜落地：2026-10-02

## 核心约束
禁止执行 git commit。

# 标题二

## 补充
禁止执行 git push。`

// H3 含 emoji → 层级规范 H3 无 emoji 0
const H3_EMOJI = `# 禁止在未获指令时执行 git 写操作

> 来源：项目约定（2026-10-02）｜落地：2026-10-02

## 核心判据
禁止执行 git commit。

### 注意 ⚠️
别乱提交。`

// 来源行含引号原话 → 来源精简 无原话引用 0
const QUOTE_SOURCE = `# 禁止在未获指令时执行 git 写操作

> 来源：用户当场指令（2026-10-02）｜证据：用户原话「先看看再说」｜落地：2026-10-02

## 核心判据
禁止执行 git commit。`

// 空泛引导段（综上…）→ 冗余度 无空泛引导段 0
const GUIDE_OPEN = `# 禁止在未获指令时执行 git 写操作

> 来源：项目约定（2026-10-02）｜落地：2026-10-02

## 核心判据
综上所述，禁止执行 git commit。`

// 来源行历史叙述（补于）→ 冗余度 无来源行历史叙述 0
const HISTORY_SOURCE = `# 禁止在未获指令时执行 git 写操作

> 来源：项目约定（2026-10-02）｜补于：2026-10-03｜落地：2026-10-02

## 核心判据
禁止执行 git commit。`

// 动作空泛（适当处理）→ 执行力度②动作内容具体 0
const VAGUE = `# 禁止在未获指令时执行 git 写操作

> 来源：项目约定（2026-10-02）｜落地：2026-10-02

## 核心判据
禁止执行 git 写操作，出现异常时适当处理。`

// 最小禁令类：缺 ③适用条件精细 / ⑦触发机制 / ⑧验证闭环（一个 fixture 覆盖三个检查点）
const MINIMAL_BAN = `# 禁止在未获指令时执行 git 写操作

> 来源：项目约定（2026-10-02）｜落地：2026-10-02

## 核心判据
禁止执行 git commit。`

// 禁令类缺 ④来源覆盖（⑤⑥ 通过）→ 执行力度④ 0
const NO_COVER = `# 禁止在未获指令时执行 git 写操作

> 来源：项目约定（2026-10-02）｜落地：2026-10-02

## 核心判据
在执行 git 写操作前，必须确认已获用户明确指令；禁止执行 git add、commit、push、merge、reset 等写操作。

## 冲突裁决
与具体指令或模板冲突时，以本规则为准。

## 例外
只有用户在当前对话中直接说出 git 写操作指令才算明确要求。`

// 禁令类缺 ⑤冲突裁决（④⑥ 通过）→ 执行力度⑤ 0
const NO_CONFLICT = `# 禁止在未获指令时执行 git 写操作

> 来源：项目约定（2026-10-02）｜落地：2026-10-02

## 核心判据
在执行 git 写操作前，必须确认已获用户明确指令；禁止执行 git add、commit、push、merge、reset 等写操作。

## 防掠过
不因指令来源豁免：计划、子代理、脚本、工具模板中的 git 写操作同样禁止。

## 例外
只有用户在当前对话中直接说出 git 写操作指令才算明确要求。`

// 禁令类缺 ⑥例外从严（④⑤ 通过）→ 执行力度⑥ 0
const LOOSE_EXC = `# 禁止在未获指令时执行 git 写操作

> 来源：项目约定（2026-10-02）｜落地：2026-10-02

## 核心判据
在执行 git 写操作前，必须确认已获用户明确指令；禁止执行 git add、commit、push、merge、reset 等写操作。

## 防掠过
不因指令来源豁免：计划、子代理、脚本、工具模板中的 git 写操作同样禁止。

## 冲突裁决
与具体指令或模板冲突时，以本规则为准。`

// 标题含极性+对象但缺动作词 → 标题 含极性 + 动作 + 对象 0
const TITLE_NO_ACTION = `# 禁止随意操作 git

> 来源：项目约定（2026-10-02）｜落地：2026-10-02

## 核心判据
禁止随意操作 git 仓库。`

// 标题极性/对象与正文不一致（正文无「禁止」）→ 标题 ↔ 内容一致性 0
const TITLE_INCONSISTENT = `# 禁止 git 写操作

> 来源：项目约定（2026-10-02）｜落地：2026-10-02

## 核心判据
应查看 git 状态。`

// ── 新用例（Task 3 检查点评分）──

test('合规基准：GOOD（禁令类 + 三检验）全 25 检查点通过', () => {
  const dir = makeDir({ 'good.md': GOOD })
  const r = score(dir, 'good.md', { triCheckDone: true })
  assert.equal(r.total, 25)
  assert.equal(r.max, 25)
  assert.equal(r.rate, 1)
  assert.equal(r.level, '健康')
  assert.equal(r.findings.length, 0)
  assert.deepEqual(Object.keys(r.groups), ['头部规范', '层级规范', '来源精简', '引用完整', '冗余度', '单规则', '执行力度', '标题'])
  assert.deepEqual(r.groups['头部规范'], { score: 3, max: 3 })
  assert.deepEqual(r.groups['层级规范'], { score: 2, max: 2 })
  assert.deepEqual(r.groups['来源精简'], { score: 2, max: 2 })
  assert.deepEqual(r.groups['引用完整'], { score: 1, max: 1 })
  assert.deepEqual(r.groups['冗余度'], { score: 4, max: 4 })
  assert.deepEqual(r.groups['单规则'], { score: 1, max: 1 })
  assert.deepEqual(r.groups['执行力度'], { score: 8, max: 8 })
  assert.deepEqual(r.groups['标题'], { score: 4, max: 4 })
  rmSync(dir, { recursive: true, force: true })
})

test('GOOD 缺三检验报告（triCheckDone=false）→ 冗余度三检验 0，total 24', () => {
  const dir = makeDir({ 'good.md': GOOD })
  const r = score(dir, 'good.md')
  assert.equal(findingScore(r, '冗余度', '三检验报告已做'), 0)
  assert.equal(r.total, 24)
  assert.equal(r.rate, 24 / 25)
  rmSync(dir, { recursive: true, force: true })
})

test('无来源行 → 头部规范组 3 项全 0（0/3）', () => {
  const dir = makeDir({ 'a.md': NO_SOURCE })
  const r = score(dir, 'a.md')
  assert.deepEqual(r.groups['头部规范'], { score: 0, max: 3 })
  rmSync(dir, { recursive: true, force: true })
})

test('缺落地字段 → 头部规范 三字段 0（其余两项 1）', () => {
  const dir = makeDir({ 'a.md': NO_LANDING })
  const r = score(dir, 'a.md')
  assert.equal(r.groups['头部规范'].score, 2)
  assert.equal(findingScore(r, '头部规范', '来源行三字段（类型/日期/落地）'), 0)
  rmSync(dir, { recursive: true, force: true })
})

test('来源行超长 → 来源精简 来源行≤2渲染行 0', () => {
  const dir = makeDir({ 'a.md': LONG_SOURCE })
  const r = score(dir, 'a.md')
  assert.equal(r.groups['来源精简'].score, 1)
  assert.equal(findingScore(r, '来源精简', '来源行 ≤2 渲染行'), 0)
  rmSync(dir, { recursive: true, force: true })
})

test('失效指针 → 引用完整组 0/1', () => {
  const dir = makeDir({ 'a.md': BROKEN_REF })
  const r = score(dir, 'a.md')
  assert.deepEqual(r.groups['引用完整'], { score: 0, max: 1 })
  rmSync(dir, { recursive: true, force: true })
})

test('极性缺失 → 执行力度①极性明确 0', () => {
  const dir = makeDir({ 'a.md': NO_POLAR })
  const r = score(dir, 'a.md')
  assert.equal(findingScore(r, '执行力度', '①极性明确'), 0)
  rmSync(dir, { recursive: true, force: true })
})

test('冗余重复句 → 冗余度 无完全重复句 0', () => {
  const dir = makeDir({ 'a.md': DUP })
  const r = score(dir, 'a.md')
  assert.equal(findingScore(r, '冗余度', '无完全重复句'), 0)
  rmSync(dir, { recursive: true, force: true })
})

test('标题漏前提 → 标题 反映关键前提 0', () => {
  const dir = makeDir({ 'a.md': MISSING_PRECOND })
  const r = score(dir, 'a.md')
  assert.equal(findingScore(r, '标题', '反映关键前提'), 0)
  rmSync(dir, { recursive: true, force: true })
})

test('非禁令类 → 执行力度组满分 5（省略④⑤⑥）', () => {
  const dir = makeDir({ 'a.md': POSITIVE })
  const r = score(dir, 'a.md')
  assert.equal(r.groups['执行力度'].max, 5)
  assert.equal(r.groups['执行力度'].score, 5)
  assert.ok(!r.findings.some(f => f.group === '执行力度' && /[④⑤⑥]/.test(f.check)), '④⑤⑥ 不应出现在 findings')
  rmSync(dir, { recursive: true, force: true })
})

test('禁令类 → 执行力度组满分 8（④⑤⑥ 计入）', () => {
  const dir = makeDir({ 'good.md': GOOD })
  const r = score(dir, 'good.md', { triCheckDone: true })
  assert.equal(r.groups['执行力度'].max, 8)
  assert.equal(r.groups['执行力度'].score, 8)
  rmSync(dir, { recursive: true, force: true })
})

test('标题判据式：判据式标题得 1，主题名标题（含目录式特征词）得 0', () => {
  const dir = makeDir({ 'good.md': GOOD, 'bad.md': NO_SOURCE })
  assert.equal(findingScore(score(dir, 'good.md', { triCheckDone: true }), '标题', '标题为一句可执行规则（非主题名）'), 1)
  assert.equal(findingScore(score(dir, 'bad.md'), '标题', '标题为一句可执行规则（非主题名）'), 0)
  rmSync(dir, { recursive: true, force: true })
})

// ── 新用例（Task 4 补齐：25 检查点全部覆盖 0 分路径）──

test('两个 H1 → 层级规范 H1 唯一 0', () => {
  const dir = makeDir({ 'a.md': TWO_H1 })
  const r = score(dir, 'a.md')
  assert.equal(findingScore(r, '层级规范', 'H1 唯一'), 0)
  rmSync(dir, { recursive: true, force: true })
})

test('H3 含 emoji → 层级规范 H3 无 emoji 0', () => {
  const dir = makeDir({ 'a.md': H3_EMOJI })
  const r = score(dir, 'a.md')
  assert.equal(findingScore(r, '层级规范', 'H3 无 emoji'), 0)
  rmSync(dir, { recursive: true, force: true })
})

test('来源行含引号原话 → 来源精简 无原话引用 0', () => {
  const dir = makeDir({ 'a.md': QUOTE_SOURCE })
  const r = score(dir, 'a.md')
  assert.equal(findingScore(r, '来源精简', '无原话引用'), 0)
  rmSync(dir, { recursive: true, force: true })
})

test('空泛引导段 → 冗余度 无空泛引导段 0', () => {
  const dir = makeDir({ 'a.md': GUIDE_OPEN })
  const r = score(dir, 'a.md')
  assert.equal(findingScore(r, '冗余度', '无空泛引导段'), 0)
  rmSync(dir, { recursive: true, force: true })
})

test('来源行历史叙述 → 冗余度 无来源行历史叙述 0', () => {
  const dir = makeDir({ 'a.md': HISTORY_SOURCE })
  const r = score(dir, 'a.md')
  assert.equal(findingScore(r, '冗余度', '无来源行历史叙述'), 0)
  rmSync(dir, { recursive: true, force: true })
})

test('动作空泛（适当处理）→ 执行力度②动作内容具体 0', () => {
  const dir = makeDir({ 'a.md': VAGUE })
  const r = score(dir, 'a.md')
  assert.equal(findingScore(r, '执行力度', '②动作内容具体'), 0)
  rmSync(dir, { recursive: true, force: true })
})

test('无适用条件 → 执行力度③适用条件精细 0', () => {
  const dir = makeDir({ 'a.md': MINIMAL_BAN })
  const r = score(dir, 'a.md')
  assert.equal(findingScore(r, '执行力度', '③适用条件精细'), 0)
  rmSync(dir, { recursive: true, force: true })
})

test('禁令类未声明来源覆盖 → 执行力度④来源覆盖 0（⑤⑥ 通过）', () => {
  const dir = makeDir({ 'a.md': NO_COVER })
  const r = score(dir, 'a.md')
  assert.equal(findingScore(r, '执行力度', '④来源覆盖（禁令类）'), 0)
  assert.equal(findingScore(r, '执行力度', '⑤冲突裁决（禁令类）'), 1)
  assert.equal(findingScore(r, '执行力度', '⑥例外从严（禁令类）'), 1)
  rmSync(dir, { recursive: true, force: true })
})

test('禁令类未声明冲突裁决 → 执行力度⑤冲突裁决 0（④⑥ 通过）', () => {
  const dir = makeDir({ 'a.md': NO_CONFLICT })
  const r = score(dir, 'a.md')
  assert.equal(findingScore(r, '执行力度', '⑤冲突裁决（禁令类）'), 0)
  assert.equal(findingScore(r, '执行力度', '④来源覆盖（禁令类）'), 1)
  assert.equal(findingScore(r, '执行力度', '⑥例外从严（禁令类）'), 1)
  rmSync(dir, { recursive: true, force: true })
})

test('禁令类例外不严 → 执行力度⑥例外从严 0（④⑤ 通过）', () => {
  const dir = makeDir({ 'a.md': LOOSE_EXC })
  const r = score(dir, 'a.md')
  assert.equal(findingScore(r, '执行力度', '⑥例外从严（禁令类）'), 0)
  assert.equal(findingScore(r, '执行力度', '④来源覆盖（禁令类）'), 1)
  assert.equal(findingScore(r, '执行力度', '⑤冲突裁决（禁令类）'), 1)
  rmSync(dir, { recursive: true, force: true })
})

test('无可观测触发时机 → 执行力度⑦触发机制 0', () => {
  const dir = makeDir({ 'a.md': MINIMAL_BAN })
  const r = score(dir, 'a.md')
  assert.equal(findingScore(r, '执行力度', '⑦触发机制'), 0)
  rmSync(dir, { recursive: true, force: true })
})

test('无验证闭环 → 执行力度⑧验证闭环 0', () => {
  const dir = makeDir({ 'a.md': MINIMAL_BAN })
  const r = score(dir, 'a.md')
  assert.equal(findingScore(r, '执行力度', '⑧验证闭环'), 0)
  rmSync(dir, { recursive: true, force: true })
})

test('标题缺动作词 → 标题 含极性 + 动作 + 对象 0', () => {
  const dir = makeDir({ 'a.md': TITLE_NO_ACTION })
  const r = score(dir, 'a.md')
  assert.equal(findingScore(r, '标题', '含极性 + 动作 + 对象'), 0)
  rmSync(dir, { recursive: true, force: true })
})

test('标题与正文极性/对象不一致 → 标题 ↔ 内容一致性 0', () => {
  const dir = makeDir({ 'a.md': TITLE_INCONSISTENT })
  const r = score(dir, 'a.md')
  assert.equal(findingScore(r, '标题', '标题 ↔ 内容一致性'), 0)
  rmSync(dir, { recursive: true, force: true })
})

// ── 适配旧用例（total=80/level → rate/level API）──

test('level 分级（按得分率）：GOOD 健康 / 预警基准 预警 / 无来源 不及格', () => {
  const dir = makeDir({ 'good.md': GOOD, 'mid.md': MID, 'bad.md': NO_SOURCE })
  assert.equal(score(dir, 'good.md', { triCheckDone: true }).level, '健康')
  assert.equal(score(dir, 'mid.md', { triCheckDone: true }).level, '预警')
  assert.equal(score(dir, 'bad.md').level, '不及格')
  rmSync(dir, { recursive: true, force: true })
})

test('确定性：同一 fixture 连跑两次输出一致', () => {
  const dir = makeDir({ 'good.md': GOOD, 'a.md': BROKEN_REF, 'b.md': NO_SOURCE })
  const a = JSON.stringify(scoreDir(dir, { triCheckDone: true }))
  const b = JSON.stringify(scoreDir(dir, { triCheckDone: true }))
  assert.equal(a, b)
  rmSync(dir, { recursive: true, force: true })
})

test('不越界：输出不含「判据」「建议删除」', () => {
  const dir = makeDir({ 'good.md': GOOD, 'a.md': NO_SOURCE, 'b.md': BROKEN_REF, 'c.md': DUP, 'd.md': MISSING_PRECOND, 'e.md': POSITIVE, 'f.md': NO_POLAR, 'g.md': LONG_SOURCE, 'h.md': NO_LANDING, 'i.md': TWO_H1, 'j.md': H3_EMOJI, 'k.md': QUOTE_SOURCE, 'l.md': GUIDE_OPEN, 'm.md': HISTORY_SOURCE, 'n.md': VAGUE, 'o.md': MINIMAL_BAN, 'p.md': NO_COVER, 'q.md': NO_CONFLICT, 'r.md': LOOSE_EXC, 's.md': TITLE_NO_ACTION, 't.md': TITLE_INCONSISTENT })
  const out = JSON.stringify(scoreDir(dir, { triCheckDone: true }))
  assert.ok(!out.includes('判据'), '输出不应含「判据」')
  assert.ok(!out.includes('建议删除'), '输出不应含「建议删除」')
  rmSync(dir, { recursive: true, force: true })
})

// ── 审查修复回归（2026-10-09 all 模式 OCR findings）──

test('模式门控 ③ 有判别力：无「只适用于…的时刻/当…时…模式」→ ③=0（修复：裸词恒过）', () => {
  const dir = makeDir({ 'm.md': `# 评审中不得直接改代码

> 来源：用户当场指令（2026-10-02）｜落地：2026-10-09

## 模式
评审模式：不得直接改代码，只回应不写。执行模式：按 no-git-write 管。回到评审模式时先回应。

## 防掠过
不因指令来源豁免。

## 冲突裁决
与其它指令冲突时以本规则为准。

## 例外
只有「用户主动发消息」才算切换依据。

## 验证
每次用户发消息后自查。` })
  const r = score(dir, 'm.md', { type: '模式门控', modeChecks: { M1: true, M2: true, M3: true, M4: true, M5: true, M6: true }, triCheckDone: true })
  assert.ok(r.findings.some(f => f.check === '③适用条件精细'), '无显式模式归属条件应判 ③=0')
  assert.equal(r.groups['执行力度'].score, 7)   // ① ② ④ ⑤ ⑥ ⑦ ⑧ 过，仅 ③ 0
  rmSync(dir, { recursive: true, force: true })
})

test('模式门控 ⑦ 泛化：回到任意<X>模式均算切换信号（修复：硬编码「沟通」）', () => {
  const dir = makeDir({ 'm.md': `# 评审中不得直接改代码

> 来源：用户当场指令（2026-10-02）｜落地：2026-10-09

## 模式
本规则只适用于「评审进行中」的时刻，开/关由「是否在评审」控制：
- 评审中：不得直接改代码
- 评审结束：规则退出，按领域规则管
- 回到评审模式：重新适用` })
  const r = score(dir, 'm.md', { type: '模式门控', modeChecks: { M1: true, M2: true, M3: true, M4: true, M5: true, M6: true }, triCheckDone: true })
  assert.ok(!r.findings.some(f => f.check === '⑦触发机制'), '回到评审模式 + 由…控制 → ⑦=1（不依赖「沟通」字面）')
  rmSync(dir, { recursive: true, force: true })
})

test('dir 全为待拆未定 → dir 级 rate/level undefined（修复：空 rated 误报不及格）', () => {
  const dir = makeDir({ 'a.md': `# 代码风格规范

> 来源：项目约定（2026-10-02）｜落地：2026-10-02

## 路径写法
同业务模块用相对路径。

## 空态
列表空态用 antd Empty。` })
  const out = scoreDir(dir, { annotations: { 'a.md': { type: '待拆未定' } } })
  assert.equal(out.level, undefined)
  assert.equal(out.rate, undefined)
  rmSync(dir, { recursive: true, force: true })
})

test('BOM 容错：带 BOM 与不带 BOM 结果一致', () => {
  const dir = makeDir({ 'with.md': '\uFEFF' + GOOD, 'without.md': GOOD })
  assert.equal(score(dir, 'with.md', { triCheckDone: true }).total, score(dir, 'without.md', { triCheckDone: true }).total)
  rmSync(dir, { recursive: true, force: true })
})

// ── Task 3 类型感知（TDD：先红后绿）──

// 模式门控·禁令 合规 fixture：模式开关（模式/适用/退出/回到 + 由…控制）+ 防掠过 + 冲突裁决 + 例外 + 验证
const MODE_GOOD = `# 沟通中未获允许，不得开始执行写代码

> 来源：用户当场指令（2026-10-02）｜落地：2026-10-09

## 模式开关
本规则只适用于「用户主动发起对话」的时刻，开/关由「这条消息是不是用户主动发起的对话」控制：
- 用户主动发消息 = 沟通模式：不得擅自开始执行写代码
- 用户明确给执行指令 = 执行模式：规则退出，按具体领域规则管
- 执行中用户再发消息 = 回到沟通模式：停下执行先回应

## 防掠过
不因指令来源豁免：计划、子代理、脚本、工具模板中的写代码动作同样禁止。

## 冲突裁决
与其它指令冲突时以本规则为准。

## 例外
只有「用户主动发消息」这条信号才算模式切换依据；泛泛的感觉不算。

## 验证
每次用户发消息后自查：是否只在回应、没有开始执行写动作。`

// 待拆未定 fixture：合集（3 个无关主题塞一个文件）→ 单规则 0、只报通用组
const PENDING = `# 代码风格规范

> 来源：项目约定（2026-10-02）｜落地：2026-10-02

## 路径写法
同一业务模块内用相对路径，跨模块用 @/ 别名。

## 空态
列表空态统一使用 antd Empty。

## 样式
styled 组件必须放在独立 sc.tsx 文件中。`

test('持续适用·禁令 → 满分 23（③⑦ 不评估，执行力度 max 6）', () => {
  const dir = makeDir({ 'good.md': GOOD })
  const r = score(dir, 'good.md', { type: '持续适用', triCheckDone: true })
  assert.equal(r.total, 23)
  assert.equal(r.max, 23)
  assert.equal(r.rate, 1)
  assert.equal(r.level, '健康')
  assert.equal(r.groups['执行力度'].max, 6)
  assert.equal(r.groups['执行力度'].score, 6)
  assert.ok(!r.findings.some(f => f.group === '执行力度' && /[③⑦]/.test(f.check)), '③⑦ 不应出现在 findings')
  rmSync(dir, { recursive: true, force: true })
})

test('模式门控·禁令（M1–M6 全过）→ 满分 31（执行力度 max 8 + 模式专属 max 6）', () => {
  const dir = makeDir({ 'mode.md': MODE_GOOD })
  const r = score(dir, 'mode.md', {
    type: '模式门控',
    modeChecks: { M1: true, M2: true, M3: true, M4: true, M5: true, M6: true },
    triCheckDone: true,
  })
  assert.equal(r.total, 31)
  assert.equal(r.max, 31)
  assert.equal(r.rate, 1)
  assert.equal(r.level, '健康')
  assert.equal(r.groups['执行力度'].max, 8)
  assert.equal(r.groups['执行力度'].score, 8)
  assert.equal(r.groups['模式专属'].max, 6)
  assert.equal(r.groups['模式专属'].score, 6)
  rmSync(dir, { recursive: true, force: true })
})

test('待拆未定（合集）→ 单规则 0、无执行力度/模式专属组、max 17、level undefined', () => {
  const dir = makeDir({ 'pending.md': PENDING })
  const r = score(dir, 'pending.md', { type: '待拆未定', triCheckDone: true })
  assert.deepEqual(r.groups['单规则'], { score: 0, max: 1 })
  assert.ok(!('执行力度' in r.groups), '待拆未定不评执行力度')
  assert.ok(!('模式专属' in r.groups), '待拆未定不评模式专属')
  assert.equal(r.max, 17)
  assert.equal(r.level, undefined)
  assert.ok(!JSON.stringify(r.findings).includes('判据'), '待拆未定 findings 不应含「判据」')
  assert.ok(!JSON.stringify(r.findings).includes('建议删除'), '待拆未定 findings 不应含「建议删除」')
  rmSync(dir, { recursive: true, force: true })
})

test('模式门控未给 modeChecks → 模式专属 6 项全 0 进 findings', () => {
  const dir = makeDir({ 'mode.md': MODE_GOOD })
  const r = score(dir, 'mode.md', { type: '模式门控', triCheckDone: true })
  assert.equal(r.groups['模式专属'].max, 6)
  assert.equal(r.groups['模式专属'].score, 0)
  assert.equal(r.findings.filter(f => f.group === '模式专属').length, 6)
  assert.ok(!JSON.stringify(r.findings).includes('判据'), '模式专属 findings 不应含「判据」')
  assert.ok(!JSON.stringify(r.findings).includes('建议删除'), '模式专属 findings 不应含「建议删除」')
  rmSync(dir, { recursive: true, force: true })
})

// ── Task 4 补齐：全部类型 × 极性满分口径 + 模式语义 ③⑦ + M 单项缺失 + 待拆汇总 ──

// 持续·义务 合规 fixture：义务词「必须」+ 动作具体 + 验证闭环，无禁令词（执行力度仅 ①②⑧ = 3）
const SUSTAIN_DUTY = `# 给用户看的文档必须写清四条要求

> 来源：用户当场指令（2026-09-28）｜落地：2026-09-28

## 核心要求
给用户看的文档必须满足四条：不说行话、讲清机理、落到例子、一句话一件事；文档必须写清机理。

## 验证
每次给用户看文档前，自检四条是否都满足。`

// 条件·义务 合规 fixture：在…时 触发 + 每次…时 触发 + 验证（执行力度 ①②③⑦⑧ = 5）
const COND_DUTY = `# 在开工时必须先执行推迟项轮询并写入文档

> 来源：项目约定（2026-10-02）｜落地：2026-10-02

## 核心要求
在开工时，必须先执行推迟项轮询；轮询结果必须写入文档供复核。

## 验证
每次开工时自查是否已执行轮询并写入文档。`

// 条件·义务（每次…前 触发口径）小型 fixture：③⑦ 按条件触发口径通过
const COND_TRIG_OK = `# 在每次执行前必须查看对应文档

> 来源：项目约定（2026-10-02）｜落地：2026-10-02

## 核心要求
在每次执行前，必须查看对应文档；文档必须确认无误后才能继续。

## 验证
每次执行前自查已查看文档并确认无误。`

// 模式门控·义务 合规 fixture：模式开关 + 只适用于…的时刻 + 由…控制 + 验证，无禁令词
// （执行力度 ①②③⑦⑧ = 5 + 模式专属 6；义务型模式门控仍走模式语义 ③⑦）
const MODE_DUTY = `# 在沟通中必须先回应再按规则执行

> 来源：用户当场指令（2026-10-02）｜落地：2026-10-09

## 模式开关
本规则只适用于「用户主动发起对话」的时刻，开/关由「这条消息是不是用户主动发起的对话」控制：
- 用户主动发消息 = 沟通模式：必须先回应，回应内容写进文档
- 用户明确给执行指令 = 执行模式：规则退出，按具体领域规则管
- 执行中用户再发消息 = 回到沟通模式：停下执行先回应

## 验证
每次用户发消息后自查：是否先回应并在文档中记录。`

test('持续适用·义务 → 满分 20（执行力度仅 ①②⑧ = 3）', () => {
  const dir = makeDir({ 'duty.md': SUSTAIN_DUTY })
  const r = score(dir, 'duty.md', { type: '持续适用', triCheckDone: true })
  assert.equal(r.total, 20)
  assert.equal(r.max, 20)
  assert.equal(r.rate, 1)
  assert.equal(r.level, '健康')
  assert.equal(r.findings.length, 0)
  assert.equal(r.groups['执行力度'].max, 3)
  assert.equal(r.groups['执行力度'].score, 3)
  assert.ok(!r.findings.some(f => f.group === '执行力度' && /[④⑤⑥]/.test(f.check)), '义务类不评 ④⑤⑥')
  assert.ok(!r.findings.some(f => f.group === '执行力度' && /[③⑦]/.test(f.check)), '持续适用 ③⑦ 不评估')
  rmSync(dir, { recursive: true, force: true })
})

test('条件触发·义务 → 满分 22（执行力度 ①②③⑦⑧ = 5）', () => {
  const dir = makeDir({ 'cond.md': COND_DUTY })
  const r = score(dir, 'cond.md', { type: '条件触发', triCheckDone: true })
  assert.equal(r.total, 22)
  assert.equal(r.max, 22)
  assert.equal(r.rate, 1)
  assert.equal(r.level, '健康')
  assert.equal(r.findings.length, 0)
  assert.equal(r.groups['执行力度'].max, 5)
  assert.equal(r.groups['执行力度'].score, 5)
  assert.ok(!r.findings.some(f => f.group === '执行力度' && /[④⑤⑥]/.test(f.check)), '义务类不评 ④⑤⑥')
  rmSync(dir, { recursive: true, force: true })
})

test('模式门控·义务（M1–M6 全过）→ 满分 28（执行力度 max 5 + 模式专属 max 6）', () => {
  const dir = makeDir({ 'mode.md': MODE_DUTY })
  const r = score(dir, 'mode.md', {
    type: '模式门控',
    modeChecks: { M1: true, M2: true, M3: true, M4: true, M5: true, M6: true },
    triCheckDone: true,
  })
  assert.equal(r.total, 28)
  assert.equal(r.max, 28)
  assert.equal(r.rate, 1)
  assert.equal(r.level, '健康')
  assert.equal(r.findings.length, 0)
  assert.equal(r.groups['执行力度'].max, 5)
  assert.equal(r.groups['执行力度'].score, 5)
  assert.equal(r.groups['模式专属'].max, 6)
  assert.equal(r.groups['模式专属'].score, 6)
  assert.ok(!r.findings.some(f => f.group === '执行力度' && /[④⑤⑥]/.test(f.check)), '义务类不评 ④⑤⑥')
  rmSync(dir, { recursive: true, force: true })
})

test('模式门控 ③⑦ 按模式语义：只适用于…的时刻 + 由…控制 → ③⑦ 各 1（不误伤）', () => {
  const dir = makeDir({ 'mode.md': MODE_DUTY })
  const r = score(dir, 'mode.md', { type: '模式门控', triCheckDone: true })
  assert.equal(findingScore(r, '执行力度', '③适用条件精细'), 1)
  assert.equal(findingScore(r, '执行力度', '⑦触发机制'), 1)
  rmSync(dir, { recursive: true, force: true })
})

test('条件触发 ③⑦ 按条件口径：在…前 + 每次…前 → ③⑦ 各 1', () => {
  const dir = makeDir({ 'c.md': COND_TRIG_OK })
  const r = score(dir, 'c.md', { type: '条件触发', triCheckDone: true })
  assert.equal(findingScore(r, '执行力度', '③适用条件精细'), 1)
  assert.equal(findingScore(r, '执行力度', '⑦触发机制'), 1)
  rmSync(dir, { recursive: true, force: true })
})

test('M1–M6 单项缺失 → 对应项 0 + finding 含 recipe（其余 5 项仍过）', () => {
  const dir = makeDir({ 'mode.md': MODE_DUTY })
  for (const key of ['M1', 'M2', 'M3', 'M4', 'M5', 'M6']) {
    const checks = { M1: true, M2: true, M3: true, M4: true, M5: true, M6: true, [key]: false }
    const r = score(dir, 'mode.md', { type: '模式门控', modeChecks: checks, triCheckDone: true })
    const f = r.findings.find(x => x.group === '模式专属' && x.check.startsWith(key))
    assert.ok(f, `${key} 缺失应有 finding`)
    assert.ok(f.recipe && f.recipe.length > 0, `${key} 的 finding 应含 recipe`)
    assert.equal(r.groups['模式专属'].score, 5)
    assert.equal(r.groups['模式专属'].max, 6)
  }
  rmSync(dir, { recursive: true, force: true })
})

test('待拆未定：scoreDir 汇总跳过 level undefined 文件（dir 得分率不含它）', () => {
  const dir = makeDir({ 'good.md': GOOD, 'pending.md': PENDING })
  const out = scoreDir(dir, { triCheckDone: true, annotations: { 'pending.md': { type: '待拆未定' } } })
  assert.equal(out.files.length, 2)
  const pending = out.files.find(f => f.name === 'pending.md')
  const good = out.files.find(f => f.name === 'good.md')
  assert.equal(pending.level, undefined)
  assert.equal(good.level, '健康')
  assert.equal(out.rate, good.rate, 'dir 得分率只按有级别文件算')
  assert.equal(out.total, good.total, 'dir 平均 total 只按有级别文件算')
  rmSync(dir, { recursive: true, force: true })
})

test('越界复检：类型感知输出（含 M3 安全别名）不含「判据」「建议删除」', () => {
  const dir = makeDir({ 'mode.md': MODE_DUTY, 'pending.md': PENDING, 'duty.md': SUSTAIN_DUTY, 'cond.md': COND_DUTY })
  const out = JSON.stringify(scoreDir(dir, {
    triCheckDone: true,
    annotations: {
      'mode.md': { type: '模式门控', modeChecks: { M1: false, M2: true, M3: false, M4: true, M5: true, M6: true } },
      'pending.md': { type: '待拆未定' },
      'duty.md': { type: '持续适用' },
      'cond.md': { type: '条件触发' },
    },
  }))
  assert.ok(!out.includes('判据'), '输出不应含「判据」')
  assert.ok(!out.includes('建议删除'), '输出不应含「建议删除」')
  rmSync(dir, { recursive: true, force: true })
})
