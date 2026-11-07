// review-ledger-numbers.test.mjs —— review-ledger-numbers.mjs 的夹具回归测试
//
// 证明方式（可证伪）：把 2026-10-20 S3 议会评审中审计真实抓到的数字错误逐条注入夹具，
// 断言脚本**必须**报红；再用一份合规夹具断言**必须**全绿。
// 若哪天有人把检查写松了，这些用例会先红。
//
// 已知边界（不在本文件的「必须红」清单里，单独用一条用例记录）：
//   语义合并类（如「28 处引用去重后 13 族还是 14 条」）机器判不了——方案是让它只存一处（C4 保证无第二副本），
//   而不是声称能检查。见「不覆盖：语义合并类」那条用例。

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

import { check } from './review-ledger-numbers.mjs'

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'review-ledger-numbers.mjs')

/** 造一个临时评审目录；返回 {dir, cleanup} */
function mkReview({ cards, progress, problems }) {
  const dir = mkdtempSync(join(tmpdir(), 'ledger-numbers-'))
  if (cards !== undefined) writeFileSync(join(dir, 'cards.md'), cards, 'utf8')
  if (progress !== undefined) writeFileSync(join(dir, 'progress.md'), progress, 'utf8')
  if (problems !== undefined) writeFileSync(join(dir, 'problems.md'), problems, 'utf8')
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) }
}

/** 合规夹具：9 / 22 / 22 = 53，且 progress 小节内不写副本数字 */
function compliantFixture() {
  const levels = [
    ...Array(9).fill('P0'),
    ...Array(22).fill('P1'),
    ...Array(22).fill('P2'),
  ]
  const cards = [
    '# 卡片：夹具（第 1 轮）',
    '',
    '> 共 **53 张**（**卡级** P0 9 / P1 22 / P2 22），另候选 21 条。',
    '',
    ...levels.map((lv, i) => {
      const seat = ['BE', 'FE', 'QA', 'AI', 'RD', 'AU'][i % 6]
      return `#### ${seat}-1-${String(i + 1).padStart(2, '0')} 【${lv}】夹具卡 ${i + 1}`
    }),
    '',
    '- **P1 族 2 个**：F3 甲（BE-1-01）；F4 乙（FE-1-02）',
    '- **P2 族 1 个 + 候选 1 个**：F18 丙（QA-1-03）；**候选 F26** 丁（FE-1-04）',
  ].join('\n')

  const progress = [
    '# 议会评审：夹具',
    '',
    '## 轮次账',
    '',
    '| 轮 | 起止（HH:MM:SS） | 耗时 | 席位 | 出卡数 | 各席结论 | 侦探 | 审计 | 本轮核销 |',
    '|---|---|---|---|---|---|---|---|---|',
    '| 1 | 10:00:00~10:10:00 | 10m | 6 席 | 53 张（**卡级** P0 9 / P1 22 / P2 22） | 全 FAIL | 未起跑 | 未起跑 | ⬜ |',
    '',
    '## 第 1 轮',
    '',
    '### 段一 · 评审',
    '',
    '- **出卡**：6 席并行独立出卡 → 原始卡见 `cards.md`（数量见轮次账第 1 行）',
    '- **答辩**：全部承认',
  ].join('\n')

  const problems = [
    '# 问题台账：夹具',
    '',
    '## 第 1 轮',
    '',
    '### 一、P0（2 个问题，均已修）',
    '',
    '| 族 | 成员卡 | 处置 |',
    '|---|---|---|',
    '| F1 | BE-1-01 | 已修 |',
    '| F2 | FE-1-01 | 已修 |',
  ].join('\n')

  return { cards, progress, problems }
}

test('合规账本 → 0 处不一致', () => {
  const f = compliantFixture()
  const { dir, cleanup } = mkReview(f)
  try {
    const { fails } = check(dir)
    assert.deepEqual(fails, [], `不应有 FAIL，实际：${JSON.stringify(fails, null, 2)}`)
  } finally { cleanup() }
})

test('C2 实数校准：声明 P0 6 张，实际 9 张 → 必红', () => {
  const f = compliantFixture()
  // 复刻 2026-10-20 第 1 轮真实错误：cards.md 头部写 6 / 22 / 25
  const cards = f.cards.replace(
    '> 共 **53 张**（**卡级** P0 9 / P1 22 / P2 22），另候选 21 条。',
    '> 共 **53 张**（**卡级** P0 6 / P1 22 / P2 25），另候选 21 条。',
  )
  const { dir, cleanup } = mkReview({ ...f, cards })
  try {
    const { fails } = check(dir)
    assert.ok(fails.some(x => x.msg.includes('C2')), '应命中 C2')
    assert.ok(fails.some(x => x.msg.includes('P0 写 6，实为 9')), '错误信息应指出 6 vs 9')
  } finally { cleanup() }
})

test('C1 算术自检：45 个问题（P0 5 / P1 13 / P2 26）→ 必红（5+13+26=44）', () => {
  const f = compliantFixture()
  // 复刻第 2 轮真实错误：总数按 45 写，分布仍按旧值
  const progress = f.progress.replace(
    '| 1 | 10:00:00~10:10:00 | 10m | 6 席 | 53 张（**卡级** P0 9 / P1 22 / P2 22） | 全 FAIL | 未起跑 | 未起跑 | ⬜ |',
    '| 1 | 10:00:00~10:10:00 | 10m | 6 席 | 45 个问题（P0 5 / P1 13 / P2 26） | 全 FAIL | 未起跑 | 未起跑 | ⬜ |',
  )
  const { dir, cleanup } = mkReview({ ...f, progress })
  try {
    const { fails } = check(dir)
    assert.ok(fails.some(x => x.msg.includes('C1')), '应命中 C1')
    assert.ok(fails.some(x => x.msg.includes('=44')), '错误信息应算出 44')
  } finally { cleanup() }
})

test('C3 族号计数：P1 族写 17 个但只列 15 个 F → 必红', () => {
  const f = compliantFixture()
  // 复刻第 8 轮真实错误：**P1 族 17 个**，实际列 F3–F17 共 15 个
  const ids = Array.from({ length: 15 }, (_, i) => `F${i + 3}`).join('、')
  const cards = f.cards.replace(
    '- **P1 族 2 个**：F3 甲（BE-1-01）；F4 乙（FE-1-02）',
    `- **P1 族 17 个**：${ids}`,
  )
  const { dir, cleanup } = mkReview({ ...f, cards })
  try {
    const { fails } = check(dir)
    assert.ok(fails.some(x => x.msg.includes('C3')), '应命中 C3')
    assert.ok(fails.some(x => x.msg.includes('列出了 15 个')), '应报实测 15')
  } finally { cleanup() }
})

test('C3 族号计数：候选族不计入该级（P2 写 8 个、列 10 个 + 候选 F26 → 报 10）', () => {
  const f = compliantFixture()
  // F18–F28 去掉 F26 正好 10 个；F26 只出现在候选段，应被剔除
  const ids = Array.from({ length: 11 }, (_, i) => `F${i + 18}`).filter(x => x !== 'F26').join('、')
  const cards = f.cards.replace(
    '- **P2 族 1 个 + 候选 1 个**：F18 丙（QA-1-03）；**候选 F26** 丁（FE-1-04）',
    `- **P2 族 8 个**：${ids}；**候选 F26** 戊（FE-1-05）`,
  )
  const { dir, cleanup } = mkReview({ ...f, cards })
  try {
    const { fails } = check(dir)
    assert.ok(fails.some(x => x.msg.includes('C3')), '应命中 C3')
    assert.ok(fails.some(x => x.msg.includes('列出了 10 个')), '候选 F26 应被剔除，剩 10')
  } finally { cleanup() }
})

test('C4 副本禁令：轮次小节内重复写「共 N 张（P0 …）」→ 必红', () => {
  const f = compliantFixture()
  // 复刻第 4/5 轮真实错误：小节内手抄该轮总量
  const progress = f.progress.replace(
    '- **出卡**：6 席并行独立出卡 → 原始卡见 `cards.md`（数量见轮次账第 1 行）',
    '- **出卡**：共 **6 张**（P0 0 / P1 4 / P2 2）',
  )
  const { dir, cleanup } = mkReview({ ...f, progress })
  try {
    const { fails } = check(dir)
    assert.ok(fails.some(x => x.msg.includes('C4')), '应命中 C4')
  } finally { cleanup() }
})

test('C4 副本禁令：「归并：P0 …」也是副本 → 必红', () => {
  const f = compliantFixture()
  const progress = f.progress.replace(
    '- **答辩**：全部承认',
    '- **答辩**：全部承认\n- **归并**：P0 5 / P1 14 条（13 族）/ P2 26',
  )
  const { dir, cleanup } = mkReview({ ...f, progress })
  try {
    const { fails } = check(dir)
    assert.ok(fails.some(x => x.msg.includes('C4')), '应命中 C4')
  } finally { cleanup() }
})

test('不覆盖：语义合并类（28 处引用 → 13 族还是 14 条）脚本不判——这是已知边界', () => {
  const f = compliantFixture()
  // 同一个数字，两种写法都合规：脚本不替你决定「该合并成几个」
  const problems = [
    '# 问题台账：夹具',
    '',
    '## 第 1 轮',
    '',
    '### 二、P1（14 条 / 13 族 / 28 处引用，均已修）',
    '',
    '| 族 | 成员卡 | 处置 |',
    '|---|---|---|',
    '| F1 | BE-1-01 | 已修 |',
  ].join('\n')
  const { dir, cleanup } = mkReview({ ...f, problems })
  try {
    const { fails } = check(dir)
    assert.deepEqual(fails, [], '语义合并类不应被脚本判红（若哪天它开始报，说明加了不该加的检查）')
  } finally { cleanup() }
})

test('CLI：目录不存在 → exit 2', () => {
  assert.throws(
    () => execFileSync(process.execPath, [SCRIPT, join(tmpdir(), 'definitely-not-a-dir-xyz')], { stdio: 'pipe' }),
    (e) => e.status === 2,
  )
})

test('CLI：合规目录 → exit 0 且打印「0 处不一致」', () => {
  const f = compliantFixture()
  const { dir, cleanup } = mkReview(f)
  try {
    const out = execFileSync(process.execPath, [SCRIPT, dir], { encoding: 'utf8' })
    assert.ok(out.includes('0 处不一致'), `stdout 应含成功提示，实际：${out}`)
  } finally { cleanup() }
})

test('CLI：有错误 → exit 1', () => {
  const f = compliantFixture()
  const cards = f.cards.replace('P0 9 / P1 22 / P2 22', 'P0 6 / P1 22 / P2 25')
  const { dir, cleanup } = mkReview({ ...f, cards })
  try {
    assert.throws(
      () => execFileSync(process.execPath, [SCRIPT, dir], { stdio: 'pipe' }),
      (e) => e.status === 1,
    )
  } finally { cleanup() }
})

// ── 以下为代码评审后补的边界用例（对应评审问题 1–5）────────────────────────

test('问题1：缺 progress.md → check() 报 FAIL，CLI exit 2（不再静默通过）', () => {
  const { dir, cleanup } = mkReview({ problems: '# 只有台账\n' })
  try {
    const { fails, warns } = check(dir)
    assert.ok(fails.some(f => f.msg.includes('缺 progress.md')), 'check() 必须报 FAIL')
    assert.ok(warns.some(w => w.includes('缺 progress.md')), '仍应给出 WARN')
    assert.throws(
      () => execFileSync(process.execPath, [SCRIPT, dir], { stdio: 'pipe' }),
      (e) => e.status === 2,
      'CLI 必须 exit 2（用法错误），不得 exit 0',
    )
  } finally { cleanup() }
})

test('问题2：未写「卡级」的分布不被当成卡级声明（总数碰撞不再误报）', () => {
  const f = compliantFixture()
  // 总数恰好等于卡片张数 53，但它是「问题数」不是「卡级」声明 → 不应被 C2 比对
  const progress = f.progress.replace(
    '| 1 | 10:00:00~10:10:00 | 10m | 6 席 | 53 张（**卡级** P0 9 / P1 22 / P2 22） | 全 FAIL | 未起跑 | 未起跑 | ⬜ |',
    '| 1 | 10:00:00~10:10:00 | 10m | 6 席 | 53 个问题（P0 0 / P1 22 / P2 31） | 全 FAIL | 未起跑 | 未起跑 | ⬜ |',
  )
  const { dir, cleanup } = mkReview({ ...f, progress })
  try {
    const { fails } = check(dir)
    // C1 自洽（0+22+31=53）；C2 不应介入（没有「卡级」+「张」）
    assert.deepEqual(fails.filter(x => x.msg.includes('C2')), [], '不应命中 C2')
  } finally { cleanup() }
})

test('问题3：卡标题序号一位、或缺【P0/P1/P2】时，不假红', () => {
  // ① 一位序号（BE-1-1）必须能数到
  const oneDigit = [
    '> 共 **2 张**（**卡级** P0 1 / P1 1 / P2 0）',
    '#### BE-1-1 【P0】甲',
    '#### FE-1-2 【P1】乙',
  ].join('\n')
  const progress = ['# 账本', '', '## 第 1 轮', '', '- **出卡**：见轮次账'].join('\n')
  {
    const { dir, cleanup } = mkReview({ cards: oneDigit, progress })
    try {
      assert.deepEqual(check(dir).fails, [], '一位序号应被正确计数')
    } finally { cleanup() }
  }
  // ② 有卡缺级别标记 → C2 跳过并 WARN，而不是按 0 判红
  const missingLevel = [
    '> 共 **2 张**（**卡级** P0 1 / P1 1 / P2 0）',
    '#### BE-1-01 甲',
    '#### FE-1-02 【P1】乙',
  ].join('\n')
  {
    const { dir, cleanup } = mkReview({ cards: missingLevel, progress })
    try {
      const { fails, warns } = check(dir)
      assert.deepEqual(fails, [], '级别识别不全时不得判红')
      assert.ok(warns.some(w => w.includes('C2 已跳过')), '应提示 C2 已跳过')
    } finally { cleanup() }
  }
})

test('问题4：C3 不把他级族号（括号旁注）与同行第二个标题算进来', () => {
  const f = compliantFixture()
  const progress = ['# 账本', '', '## 第 1 轮', '', '- **出卡**：见轮次账'].join('\n')
  // ① 括号旁注引用他级族号
  const cardsA = f.cards.replace(
    '- **P1 族 2 个**：F3 甲（BE-1-01）；F4 乙（FE-1-02）',
    '- **P1 族 2 个**：F3 甲（同 F1、F2 见上）；F4 乙',
  )
  {
    const { dir, cleanup } = mkReview({ ...f, cards: cardsA, progress })
    try {
      assert.deepEqual(check(dir).fails.filter(x => x.msg.includes('C3')), [], '括号内引用的 F1/F2 不应计入')
    } finally { cleanup() }
  }
  // ② 同一行两级汇总，各算各的
  const cardsB = f.cards.replace(
    '- **P1 族 2 个**：F3 甲（BE-1-01）；F4 乙（FE-1-02）',
    '- **P1 族 2 个**：F3 甲、F4 乙；**P2 族 1 个**：F18 丙',
  )
  {
    const { dir, cleanup } = mkReview({ ...f, cards: cardsB, progress })
    try {
      assert.deepEqual(check(dir).fails.filter(x => x.msg.includes('C3')), [], '两个标题应各按自己的片段计数')
    } finally { cleanup() }
  }
})

test('问题5：C4 对普通叙述也判红（有意为之，固定行为并给出改写提示）', () => {
  const f = compliantFixture()
  const progress = f.progress.replace(
    '- **答辩**：全部承认',
    '- **答辩**：全部承认\n- 本节共 2 处笔误已修',
  )
  const { dir, cleanup } = mkReview({ ...f, progress })
  try {
    const { fails } = check(dir)
    const c4 = fails.filter(x => x.msg.includes('C4'))
    assert.equal(c4.length, 1, '应命中 1 处 C4')
    assert.ok(c4[0].msg.includes('若只是普通叙述'), '提示应给出改写出路，而不是断言它就是总量')
  } finally { cleanup() }
})
