// trigger.kind 四型守卫（P5 新基线）：逐席读模型 `seat.triggers[].kind`。
//
// 四值的中文判据（本文件是**唯一写死处**，spec §11.5 表只引用不复制）：
//   dispatch  —— 由议长点名派活：说清对象 + 视角 + 动作
//   occasion  —— 某个评审场合需要才起：场合 + 该场合要核的东西
//   moment    —— 某个时机之后必做：时机 + 动作
//   need      —— 当需要某项专门产出时才起：需要 + 产出
// 判 kind 只看模型声明，不由描述句式推断（spec §11.1 R9）；输出附每席 description 前 12 字，供人工抽核贴切度。
// 非议会席名单 = `tools/docgen/models/agents/source.mjs` 的 `NON_PARL_SEATS`（唯一源）。
//
// 输出首行固定：`check-trigger-kind: seats <N> / kinds {...} / bad <n> => ok|fail`；`bad > 0` → exit 1。
import { listSeats, expandModel, NON_PARL_SEATS } from '../../models/agents/source.mjs'

const KIND_ORDER = ['dispatch', 'occasion', 'moment', 'need']
const WHEN_HEAD = 12

const seats = listSeats()
const counts = Object.fromEntries(KIND_ORDER.map((k) => [k, 0]))
const bad = []
const models = new Map()
for (const seat of seats) {
  let m
  try {
    m = expandModel(seat)
  } catch (e) {
    bad.push({ seat, kind: '(missing)', why: `模型读取失败 ${e.code ?? e.name}` })
    continue
  }
  models.set(seat, m)
  const kinds = (m.seat.triggers || []).map((t) => t.kind)
  const uniq = [...new Set(kinds)]
  if (uniq.length !== 1) {
    bad.push({ seat, kind: uniq.join('+') || '(missing)', why: '同席触发 kind 不唯一' })
    continue
  }
  const kind = uniq[0]
  if (KIND_ORDER.includes(kind)) counts[kind] += 1
  if (!KIND_ORDER.includes(kind)) bad.push({ seat, kind, why: '不在四值内' })
  else if (NON_PARL_SEATS.includes(seat) && kind !== 'need') bad.push({ seat, kind, why: '非议会席只许 need' })
}

const kindsText = `{${KIND_ORDER.map((k) => `${k}:${counts[k]}`).join(',')}}`
const verdict = bad.length > 0 ? 'fail' : 'ok'
console.log(`check-trigger-kind: seats ${seats.length} / kinds ${kindsText} / bad ${bad.length} => ${verdict}`)
for (const seat of seats) {
  const m = models.get(seat)
  if (!m) {
    console.log(`  ${seat} (missing) | (模型读取失败)`)
    continue
  }
  const when = String(m.seat.description.template || '').slice(0, WHEN_HEAD)
  const kinds = [...new Set((m.seat.triggers || []).map((t) => t.kind))].join('+')
  console.log(`  ${seat} ${kinds} | ${when}`)
}
if (bad.length > 0) {
  for (const b of bad) console.error(`  ${b.seat}: ${String(b.kind)}（${b.why}）`)
  process.exitCode = 1
}
