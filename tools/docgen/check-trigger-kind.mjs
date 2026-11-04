// trigger.kind 四型守卫（S-C spec §11.5 / §11.2 #7；PRD Q5 / V10）：逐席判 `triggerTable[<seat>].kind`。
//
// 四值的中文判据（本文件是**唯一写死处**，spec §11.5 表只引用不复制）：
//   dispatch  —— 由主持人点名派活：说清对象 + 视角 + 动作
//   occasion  —— 某个评审场合需要才起：场合 + 该场合要核的东西
//   moment    —— 某个时机之后必做：时机 + 动作
//   need      —— 当需要某项专门产出时才起：需要 + 产出
// 判 kind **只看数据声明**，不由 `when` 的句式推断（spec §11.1 R9）；输出附每席 `when` 前 12 字，供人工抽核贴切度。
// 非议会席名单**现算**（席名不以 `reviewer-` / `detective-` 开头），不写死——写死名单会让第 16 席静默漏检（R10）。
//
// 输出首行固定：`check-trigger-kind: seats <N> / kinds {...} / bad <n> => ok|fail`；`bad > 0` → exit 1。
import { agentData, triggerTable } from './components/agentData.mjs'

const KIND_ORDER = ['dispatch', 'occasion', 'moment', 'need']
const PARL_PREFIXES = ['reviewer-', 'detective-']
const isParliamentSeat = (name) => PARL_PREFIXES.some((p) => name.startsWith(p))
const WHEN_HEAD = 12

const seats = agentData.map((a) => a.name)
const counts = Object.fromEntries(KIND_ORDER.map((k) => [k, 0]))
const bad = []
for (const seat of seats) {
  const t = triggerTable[seat] || {}
  const kind = t.kind
  if (KIND_ORDER.includes(kind)) counts[kind] += 1
  if (!KIND_ORDER.includes(kind)) bad.push({ seat, kind, why: '不在四值内' })
  else if (!isParliamentSeat(seat) && kind !== 'need') bad.push({ seat, kind, why: '非议会席只许 need' })
}

const kindsText = `{${KIND_ORDER.map((k) => `${k}:${counts[k]}`).join(',')}}`
const verdict = bad.length > 0 ? 'fail' : 'ok'
console.log(`check-trigger-kind: seats ${seats.length} / kinds ${kindsText} / bad ${bad.length} => ${verdict}`)
for (const seat of seats) {
  const when = String((triggerTable[seat] || {}).when || '').slice(0, WHEN_HEAD)
  console.log(`  ${seat} ${triggerTable[seat] && triggerTable[seat].kind} | ${when}`)
}
if (bad.length > 0) {
  for (const b of bad) console.error(`  ${b.seat}: ${String(b.kind)}（${b.why}）`)
  process.exitCode = 1
}
