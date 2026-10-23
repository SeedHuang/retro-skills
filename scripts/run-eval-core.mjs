// run-eval-core.mjs —— runner 的纯函数层（零依赖、无 IO、无 git）
// 口径来源：spec §1.5（run 三态）/ §3.3-6（flaky、跨行取码）/ §3.3-7（verdict 五值与 rate/flaky/delta 四值）
// 机读块解析只 import 自 eval-contract-core.mjs（Ruling 8：同一契约不得在第二处再写一份解析）
import { extractMachineBlock } from './eval-contract-core.mjs'

const EXPECTATION_SCHEMA = 'eval-expectation/v2'

// run 三态：字段路径写死 runs[].result.passed / .total（spec §1.5）
// 空值 / 非数 / 0-0 / passed>total 一律 undetermined —— 不得当 0 兜底
export function classifyRun(run) {
  const r = run?.result
  const p = r?.passed
  const t = r?.total
  if (typeof p !== 'number' || typeof t !== 'number') return 'undetermined'
  if (!(t > 0) || p > t || p < 0) return 'undetermined'
  return p === t ? 'full' : 'partial'
}

// 某臂的全过率：undetermined 不进分母；分母为 0 → rate = null（= 该臂「未判定」，spec §1.5）
export function computeArmRate(runs) {
  const tally = { determined: 0, undetermined: 0, full: 0, partial: 0 }
  for (const run of runs || []) {
    const k = classifyRun(run)
    if (k === 'undetermined') { tally.undetermined++; continue }
    tally.determined++
    tally[k]++
  }
  const rate = tally.determined === 0 ? null : tally.full / tally.determined
  return { ...tally, rate }
}

// 单组（= 同 eval_name + 同 configuration）的 flaky：full 与 partial 并存 → 是；determined=0 → 未判定
function flakyOfGroup(runs) {
  const { full, partial, determined } = computeArmRate(runs)
  if (determined === 0) return '未判定'
  return full > 0 && partial > 0 ? '是' : '否'
}

// 用例级聚合 = OR（任一 configuration flaky 即该用例 flaky，spec §3.3-6）；未判定为兜底值
function combineFlaky(values) {
  if (values.includes('是')) return '是'
  if (values.includes('未判定')) return '未判定'
  return '否'
}

// verdict → 退出码（spec §3.3-6 表）
const VERDICT_CODE = { VALID: 0, INVALID_ASSERT: 1, INVALID_DELTA: 1, INVALID_ENV: 2, INVALID_FLAKY: 3 }
// 跨行优先级：2 > 3 > 1 > 0（环境不可用压过结论无效）
const CODE_ORDER = { 0: 0, 1: 1, 2: 3, 3: 2 }

// 取码：只取 role=gate 的行（probe 行永不参与）；表外码原样透传且优先
export function pickExitCode(lines, toolCode) {
  if (typeof toolCode === 'number' && ![0, 1, 2, 3, 4].includes(toolCode)) return toolCode
  let best = 0
  for (const line of lines || []) {
    if (line?.role === 'probe') continue
    const code = VERDICT_CODE[line?.verdict] ?? 0
    if (CODE_ORDER[code] > CODE_ORDER[best]) best = code
  }
  return best
}

// 读 expected.md 机读块：必须恰好 1 个 ```json 块、必须是合法 JSON、schema 必须是 eval-expectation/v2
// （spec §3.2.2 ①：任一不过 → 码 4，不做旧 schema 兼容）
export function loadExpectation(text) {
  const mb = extractMachineBlock(text)
  if (!mb.ok) throw new Error(mb.error)
  const block = mb.block
  if (block?.schema !== EXPECTATION_SCHEMA) {
    throw new Error(`机读块 schema 不符：期望 ${EXPECTATION_SCHEMA}，实际 ${block?.schema}`)
  }
  return block
}

const fmtRate = (rate) => (rate === null ? '未判定' : String(rate))

// 臂阈值判定：min_rate / max_rate 各自可缺省（缺 = 该侧不设界，spec §3.2.2 示例里 without_skill 只写 max_rate）
function rateWithin(rate, arm) {
  if (!arm) return false
  const lo = arm.min_rate ?? 0
  const hi = arm.max_rate ?? 1
  return rate >= lo && rate <= hi
}

// verdict 决策（spec §3.3-7 五值 + rate/flaky/delta 四值）
// ctx = { role, origin, arms, deltaMin, withRuns, withoutRuns, iterationDirs, iterationMin }
//   iterationDirs = 参与 flaky 判定的 iteration-*/benchmark.json 实际个数；iterationMin = expected.md 的 iteration_min
// → { verdict, flaky, rate: '<装>/<不装>', delta }
export function decideVerdict(ctx) {
  const {
    role, origin, arms, deltaMin,
    withRuns = [], withoutRuns = [], iterationDirs = 0, iterationMin = 0,
  } = ctx || {}

  const w = computeArmRate(withRuns)
  const wo = computeArmRate(withoutRuns)
  const rate = `${fmtRate(w.rate)}/${fmtRate(wo.rate)}`

  // flaky=未判定 三情形（§3.3-7）：① 无任何 benchmark.json ② 任一臂 determined=0 ③ 数据量不足
  // 情形③：迭代目录数 < iteration_min，或任一臂 determined < iteration_min 且 > 0
  const insufficient = iterationDirs < iterationMin
    || (w.determined > 0 && w.determined < iterationMin)
    || (wo.determined > 0 && wo.determined < iterationMin)
  const flaky = (iterationDirs === 0 || w.determined === 0 || wo.determined === 0 || insufficient)
    ? '未判定'
    : combineFlaky([flakyOfGroup(withRuns), flakyOfGroup(withoutRuns)])

  // probe：不参与 L3，delta 恒 n/a；verdict 只有 VALID / INVALID_FLAKY / INVALID_ENV 三值
  if (role === 'probe') {
    const verdict = flaky === '是' ? 'INVALID_FLAKY' : (flaky === '未判定' ? 'INVALID_ENV' : 'VALID')
    return { verdict, flaky, rate, delta: 'n/a' }
  }
  if (role !== 'gate') throw new Error(`未知 role：${role}（只允许 gate / probe）`)
  if (!arms || typeof deltaMin !== 'number') {
    throw new Error('gate 用例缺少 arms 或 delta.min（spec §3.2.2 ④：启动前应判码 4，不得走到这里）')
  }

  // 数据不足 / 无数据 → 未判定，gate 归 INVALID_ENV（§3.3-6 运行后数据量闸门）
  // 情形③只改 flaky 与 delta，不改写 rate（rate 已在上面按 determined 如实算）
  if (flaky === '未判定') return { verdict: 'INVALID_ENV', flaky, rate, delta: '未判定' }
  if (flaky === '是') return { verdict: 'INVALID_FLAKY', flaky, rate, delta: '未判定' }

  const d = w.rate - wo.rate
  const delta = d >= deltaMin ? d : '未达'
  const armsOk = rateWithin(w.rate, arms.with_skill) && rateWithin(wo.rate, arms.without_skill)
  const verdict = armsOk && delta !== '未达'
    ? 'VALID'
    : (origin === 'frozen' ? 'INVALID_DELTA' : 'INVALID_ASSERT')
  return { verdict, flaky, rate, delta }
}
