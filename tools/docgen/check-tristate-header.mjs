// 卡面三态承载守卫（S-C spec §11.3 / §11.2 #8）：逐席渲染后，判「本席清单」段的表头行是否**逐字含**
// `VERDICT_HINT`（三值只在那一处声明，S-C §11.1 R1）。
//
// 为什么只看内存渲染、不扫整卡：`产物字段名只许：…` 那行恒含三值（`renderCard.mjs` 的 `productNames()`），
// 整文件扫会 15/15 恒绿、负例（删值 / 手写串 / 挪出段）全部失效（PRD V11 ② 原话）。
// 为什么判「逐字含整串」而不是「三键各含一次」：手写串把三值写全、顺序写对时，只判三键仍绿（S-C D-5 裁定）。
//
// 输出首行固定：`check-tristate-header: seats <N> / ok <k> / bad <n> => ok|fail`；`bad > 0` → exit 1。
import { agentData } from './components/agentData.mjs'
import { renderSeat } from './components/cardPipeline.mjs'
import { VERDICT_HINT } from './card-model/vocab/card-contract.mjs'

const seats = agentData.map((a) => a.name)
const bad = []
let ok = 0
for (const seat of seats) {
  let text = ''
  try {
    text = renderSeat(seat).card
  } catch (e) {
    bad.push({ seat, why: `渲染失败 ${e && (e.code || e.name)}` })
    continue
  }
  const seg = String(text).split(/^## 本席清单\s*$/m)[1]
  const head = seg === undefined ? '' : (seg.split(/\r?\n/).find((l) => l.trim().startsWith('|')) || '')
  if (head.includes(VERDICT_HINT)) ok += 1
  else bad.push({ seat, why: head === '' ? '本席清单段无表头行' : '表头未逐字含 VERDICT_HINT' })
}

const verdict = bad.length > 0 ? 'fail' : 'ok'
console.log(`check-tristate-header: seats ${seats.length} / ok ${ok} / bad ${bad.length} => ${verdict}`)
if (bad.length > 0) {
  for (const b of bad) console.error(`  ${b.seat}: ${b.why}`)
  process.exitCode = 1
}
