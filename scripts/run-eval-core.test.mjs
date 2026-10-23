// run-eval-core.test.mjs —— Task 5 纯函数单测（node:test，真断言）
// 覆盖：run 三态 / 全过率 / 跨行取码 / 机读块读取 / verdict 决策（含多迭代并集的 flaky）
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import {
  classifyRun, computeArmRate, pickExitCode, loadExpectation, decideVerdict,
} from './run-eval-core.mjs'

const R = (passed, total) => ({ result: { passed, total } })
const RW = (passed, total) => ({ configuration: 'with_skill', result: { passed, total } })
const RO = (passed, total) => ({ configuration: 'without_skill', result: { passed, total } })

// 阈值对象：与 evals/review-triage/expected.md 的 gate 用例同形
const ARMS = { with_skill: { min_rate: 1.0, max_rate: 1.0 }, without_skill: { min_rate: 0.0, max_rate: 0.0 } }

// ─── classifyRun ──────────────────────────────────────────────────────────────

test('classifyRun：full / partial / undetermined 三态', () => {
  assert.equal(classifyRun(R(3, 3)), 'full')
  assert.equal(classifyRun(R(1, 3)), 'partial')
  assert.equal(classifyRun(R(0, 3)), 'partial')
})

test('classifyRun：空值 / 缺失 / 非法数值组合一律 undetermined（不得当 0 兜底）', () => {
  assert.equal(classifyRun(R(null, null)), 'undetermined')       // 工具失败时写空值（Connection refused）
  assert.equal(classifyRun(R(3, null)), 'undetermined')          // 只有一半
  assert.equal(classifyRun(R(0, 0)), 'undetermined')             // 0/0 不命中任何一式
  assert.equal(classifyRun(R(5, 3)), 'undetermined')             // passed > total
  assert.equal(classifyRun(R(-1, 3)), 'undetermined')
  assert.equal(classifyRun(R('3', 3)), 'undetermined')           // 非数（字符串）
  assert.equal(classifyRun({}), 'undetermined')
  assert.equal(classifyRun(undefined), 'undetermined')
})

test('classifyRun：字段写在 run 顶层 → undetermined（spec §1.5 实测踩过）', () => {
  assert.equal(classifyRun({ passed: 3, total: 3 }), 'undetermined')
  assert.equal(classifyRun({ result: { passed: 3 }, total: 3 }), 'undetermined')
})

// ─── computeArmRate ───────────────────────────────────────────────────────────

test('computeArmRate：undetermined 不进分母，rate = full / determined', () => {
  const r = computeArmRate([R(3, 3), R(3, 3), R(null, null)])
  assert.deepEqual(r, { determined: 2, undetermined: 1, full: 2, partial: 0, rate: 1 })
})

test('computeArmRate：无 run / 全 undetermined → determined=0、rate=null（该臂未判定）', () => {
  assert.deepEqual(computeArmRate([]), { determined: 0, undetermined: 0, full: 0, partial: 0, rate: null })
  const r = computeArmRate([R(null, null), R(0, 0)])
  assert.equal(r.determined, 0)
  assert.equal(r.undetermined, 2)
  assert.equal(r.rate, null)
})

// ─── 多迭代并集（decideVerdict 级：runner 传的是所有 iteration 目录的跑并集）──────────
// 原 computeFlaky 单测的意图保留在这里：partial 只在 iteration-2 出现也必须被算进 flaky
test('decideVerdict：两个 iteration 目录的跑并集传入（partial 只在 iteration-2 出现）→ flaky=是', () => {
  const r = decideVerdict({
    role: 'gate', origin: 'calibrated', arms: ARMS, deltaMin: 1,
    withRuns: [RW(3, 3), RW(2, 3)], withoutRuns: [RO(0, 3), RO(0, 3)],
    iterationDirs: 2, iterationMin: 2,
  })
  assert.deepEqual(r, { verdict: 'INVALID_FLAKY', flaky: '是', rate: '0.5/0', delta: '未判定' })
})

// ─── pickExitCode ────────────────────────────────────────────────────────────

test('pickExitCode：跨行优先级 2 > 3 > 1 > 0', () => {
  assert.equal(pickExitCode([{ verdict: 'INVALID_FLAKY' }, { verdict: 'INVALID_ENV' }], 1), 2)
  assert.equal(pickExitCode([{ verdict: 'INVALID_ENV' }, { verdict: 'INVALID_FLAKY' }], 1), 2)
  assert.equal(pickExitCode([{ verdict: 'INVALID_FLAKY' }, { verdict: 'INVALID_ASSERT' }], 1), 3)
  assert.equal(pickExitCode([{ verdict: 'INVALID_DELTA' }, { verdict: 'VALID' }], 1), 1)
  assert.equal(pickExitCode([{ verdict: 'VALID' }], 0), 0)
  assert.equal(pickExitCode([], 0), 0)
  assert.equal(pickExitCode([{ verdict: 'VALID' }, { verdict: 'INVALID_DELTA' }], 0), 1)
})

test('pickExitCode：probe 行永不参与取码（gate=3 + probe=2 必须是 3）', () => {
  assert.equal(pickExitCode([{ role: 'gate', verdict: 'INVALID_FLAKY' }, { role: 'probe', verdict: 'INVALID_ENV' }], 0), 3)
  assert.equal(pickExitCode([{ role: 'probe', verdict: 'INVALID_ENV' }], 0), 0)
  assert.equal(pickExitCode([{ role: 'gate', verdict: 'VALID' }, { role: 'probe', verdict: 'INVALID_FLAKY' }], 0), 0)
})

test('pickExitCode：表外码（∉{0,1,2,3,4}）原样透传且优先于跨行顺序', () => {
  assert.equal(pickExitCode([{ verdict: 'INVALID_ENV' }], 5), 5)
  assert.equal(pickExitCode([{ verdict: 'INVALID_FLAKY' }], 7), 7)
  // 表内码不透传：按行算（4 在表内 → 不当作透传值）
  assert.equal(pickExitCode([{ verdict: 'VALID' }], 4), 0)
  assert.equal(pickExitCode([{ verdict: 'INVALID_FLAKY' }], 3), 3)
  // spawn 失败（无工具码）→ 按行算
  assert.equal(pickExitCode([{ verdict: 'INVALID_ENV' }], null), 2)
})

// ─── loadExpectation ─────────────────────────────────────────────────────────

const BLOCK_TEXT = (schema) => [
  '# 预期值',
  '',
  '```json',
  JSON.stringify({
    schema,
    iteration_min: 3,
    cases: [
      { eval_name: 'A', role: 'gate', origin: 'calibrated', arms: { with_skill: { min_rate: 1 }, without_skill: { max_rate: 0 } }, delta: { min: 1 } },
      { eval_name: 'B', role: 'probe', origin: 'calibrated', arms: null, delta: null },
    ],
  }, null, 2),
  '```',
  '',
].join('\n')

test('loadExpectation：能取出 iteration_min 与各 case 的 role / arms / delta', () => {
  const block = loadExpectation(BLOCK_TEXT('eval-expectation/v2'))
  assert.equal(block.iteration_min, 3)
  assert.equal(block.cases.length, 2)
  assert.equal(block.cases[0].role, 'gate')
  assert.equal(block.cases[0].arms.with_skill.min_rate, 1)
  assert.equal(block.cases[0].arms.without_skill.max_rate, 0)
  assert.equal(block.cases[0].delta.min, 1)
  assert.equal(block.cases[1].role, 'probe')
  assert.equal(block.cases[1].arms, null)
  assert.equal(block.cases[1].delta, null)
})

test('loadExpectation：json 块不是恰好 1 个 → 报错', () => {
  assert.throws(() => loadExpectation('# 无块\n'), /未找到 ```json 机读块/)
  const two = `${BLOCK_TEXT('eval-expectation/v2')}\n\`\`\`json\n{"a":1}\n\`\`\`\n`
  assert.throws(() => loadExpectation(two), /必须恰好 1 个，实际 2 个/)
})

test('loadExpectation：schema 不符（含旧版 v1 / 缺失）→ 报错，不做兼容', () => {
  assert.throws(() => loadExpectation(BLOCK_TEXT('eval-expectation/v1')), /schema 不符/)
  assert.throws(() => loadExpectation(BLOCK_TEXT(undefined)), /schema 不符/)
})

test('loadExpectation：真实 evals/review-triage/expected.md 可读（Task 3 产物正向验证）', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const block = loadExpectation(readFileSync(resolve(root, 'evals/review-triage/expected.md'), 'utf8'))
  assert.equal(block.schema, 'eval-expectation/v2')
  assert.equal(block.iteration_min, 2)
  assert.equal(block.cases.length, 2)
  const probe = block.cases.find((c) => c.role === 'probe')
  const gate = block.cases.find((c) => c.role === 'gate')
  assert.equal(probe.arms, null)
  assert.equal(probe.delta, null)
  assert.equal(gate.origin, 'calibrated')
  assert.equal(gate.arms.with_skill.min_rate, 1)
  assert.equal(gate.arms.without_skill.max_rate, 0)
  assert.equal(gate.delta.min, 1)
})

// ─── decideVerdict ───────────────────────────────────────────────────────────

test('decideVerdict：gate 达标 → VALID，rate / delta 按实测填写', () => {
  const r = decideVerdict({
    role: 'gate', origin: 'calibrated', arms: ARMS, deltaMin: 1,
    withRuns: [RW(7, 7), RW(7, 7)], withoutRuns: [RO(3, 7), RO(2, 7)],
    iterationDirs: 2, iterationMin: 2,
  })
  assert.deepEqual(r, { verdict: 'VALID', flaky: '否', rate: '1/0', delta: 1 })
})

test('decideVerdict：未达阈值 → calibrated 判 INVALID_ASSERT、frozen 判 INVALID_DELTA', () => {
  const ctx = {
    role: 'gate', arms: ARMS, deltaMin: 1,
    withRuns: [RW(7, 7), RW(7, 7)], withoutRuns: [RO(7, 7), RO(7, 7)],   // 两臂都全过 → delta 0，正是唯一要抓的场景
    iterationDirs: 2, iterationMin: 2,
  }
  assert.deepEqual(decideVerdict({ ...ctx, origin: 'calibrated' }), { verdict: 'INVALID_ASSERT', flaky: '否', rate: '1/1', delta: '未达' })
  assert.deepEqual(decideVerdict({ ...ctx, origin: 'frozen' }), { verdict: 'INVALID_DELTA', flaky: '否', rate: '1/1', delta: '未达' })
})

test('decideVerdict：delta 够但臂阈值不满足 → 不判 VALID（判用例无效 / 技能退化）', () => {
  // 装臂实测 rate=1 但声明的上界只有 0.8；delta=1 ≥ 0.5 达标 → 仍须判用例不达标
  const arms = { with_skill: { max_rate: 0.8 }, without_skill: { max_rate: 0.0 } }
  const ctx = {
    role: 'gate', arms, deltaMin: 0.5,
    withRuns: [RW(7, 7), RW(7, 7)], withoutRuns: [RO(0, 7), RO(0, 7)],
    iterationDirs: 2, iterationMin: 2,
  }
  assert.deepEqual(decideVerdict({ ...ctx, origin: 'calibrated' }), { verdict: 'INVALID_ASSERT', flaky: '否', rate: '1/0', delta: 1 })
  assert.deepEqual(decideVerdict({ ...ctx, origin: 'frozen' }), { verdict: 'INVALID_DELTA', flaky: '否', rate: '1/0', delta: 1 })
})

test('decideVerdict：某臂 determined=0 → 该臂 rate 写未判定、另一臂正常算，gate 归 INVALID_ENV', () => {
  const r = decideVerdict({
    role: 'gate', origin: 'calibrated', arms: ARMS, deltaMin: 1,
    withRuns: [RW(7, 7), RW(7, 7)], withoutRuns: [RO(null, null), RO(0, 0)],
    iterationDirs: 2, iterationMin: 2,
  })
  assert.deepEqual(r, { verdict: 'INVALID_ENV', flaky: '未判定', rate: '1/未判定', delta: '未判定' })
})

test('decideVerdict：无任何 benchmark.json → iteration=n/a 情形①，flaky 未判定、gate 归 INVALID_ENV', () => {
  const r = decideVerdict({
    role: 'gate', origin: 'calibrated', arms: ARMS, deltaMin: 1,
    withRuns: [], withoutRuns: [], iterationDirs: 0, iterationMin: 2,
  })
  assert.deepEqual(r, { verdict: 'INVALID_ENV', flaky: '未判定', rate: '未判定/未判定', delta: '未判定' })
})

test('decideVerdict：数据量不足（迭代目录数 < iteration_min）→ flaky/delta 未判定，rate 仍如实算', () => {
  const r = decideVerdict({
    role: 'gate', origin: 'calibrated', arms: ARMS, deltaMin: 1,
    withRuns: [RW(7, 7)], withoutRuns: [RO(0, 7)],
    iterationDirs: 1, iterationMin: 2,
  })
  assert.deepEqual(r, { verdict: 'INVALID_ENV', flaky: '未判定', rate: '1/0', delta: '未判定' })
})

test('decideVerdict：数据量不足（某臂 determined < iteration_min 且 > 0）→ 同样未判定，但 rate 不改写', () => {
  const r = decideVerdict({
    role: 'gate', origin: 'calibrated', arms: ARMS, deltaMin: 1,
    withRuns: [RW(7, 7), RW(7, 7), RW(7, 7)], withoutRuns: [RO(0, 7), RO(0, 7), RO(0, 7)],
    iterationDirs: 4, iterationMin: 4,
  })
  assert.deepEqual(r, { verdict: 'INVALID_ENV', flaky: '未判定', rate: '1/0', delta: '未判定' })
})

test('decideVerdict：flaky=是 → INVALID_FLAKY 且 delta 写未判定（L1 未过不算差值）', () => {
  const r = decideVerdict({
    role: 'gate', origin: 'calibrated', arms: ARMS, deltaMin: 1,
    withRuns: [RW(7, 7), RW(3, 7)], withoutRuns: [RO(0, 7), RO(0, 7)],
    iterationDirs: 2, iterationMin: 2,
  })
  assert.deepEqual(r, { verdict: 'INVALID_FLAKY', flaky: '是', rate: '0.5/0', delta: '未判定' })
})

test('decideVerdict：probe 只有三值、delta 恒 n/a、不看 arms/delta 阈值', () => {
  const base = { role: 'probe', origin: 'calibrated', iterationDirs: 2, iterationMin: 2 }
  assert.deepEqual(
    decideVerdict({ ...base, withRuns: [RW(7, 7), RW(7, 7)], withoutRuns: [RO(0, 7), RO(0, 7)] }),
    { verdict: 'VALID', flaky: '否', rate: '1/0', delta: 'n/a' },
  )
  assert.deepEqual(
    decideVerdict({ ...base, withRuns: [RW(7, 7), RW(2, 7)], withoutRuns: [RO(0, 7), RO(0, 7)] }),
    { verdict: 'INVALID_FLAKY', flaky: '是', rate: '0.5/0', delta: 'n/a' },
  )
  assert.deepEqual(
    decideVerdict({ ...base, withRuns: [RW(7, 7), RW(7, 7)], withoutRuns: [RO(null, null), RO(null, null)] }),
    { verdict: 'INVALID_ENV', flaky: '未判定', rate: '1/未判定', delta: 'n/a' },
  )
})

test('decideVerdict：gate 缺 arms / delta.min → 报错（不静默判 VALID）', () => {
  assert.throws(() => decideVerdict({
    role: 'gate', origin: 'calibrated', arms: null, deltaMin: 1,
    withRuns: [RW(7, 7)], withoutRuns: [RO(0, 7)], iterationDirs: 2, iterationMin: 2,
  }), /缺少 arms 或 delta\.min/)
  assert.throws(() => decideVerdict({
    role: 'gate', origin: 'calibrated', arms: ARMS,
    withRuns: [RW(7, 7)], withoutRuns: [RO(0, 7)], iterationDirs: 2, iterationMin: 2,
  }), /缺少 arms 或 delta\.min/)
})

test('decideVerdict：未知 role → 报错', () => {
  assert.throws(() => decideVerdict({ role: 'other', withRuns: [], withoutRuns: [], iterationDirs: 2, iterationMin: 2 }), /未知 role/)
})
