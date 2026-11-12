// 卡面三态承载守卫（P5 新基线）：逐席从模型渲染，判「本席清单」段表头是否逐字含模型声明的三态取值。
//
// 数据源 = `tools/agent-model/models/<seat>-model.json` 的 `verdicts.enum`；不再读旧 `card-model` 常量。
// 仍只看表头行、不扫整卡：整卡扫会被「输出格式/权限」段的同值文案假通过，负例（删值 / 挪出段）失效。
//
// 输出首行固定：`check-tristate-header: seats <N> / ok <k> / bad <n> => ok|fail`；`bad > 0` → exit 1。
import { listSeats, renderSeatText, modelWithShared } from '../../../agent-model/source.mjs'

const seats = listSeats()
const bad = []
let ok = 0
for (const seat of seats) {
  let text = ''
  try {
    text = renderSeatText(seat)
  } catch (e) {
    bad.push({ seat, why: `渲染失败 ${e && (e.code || e.name)}` })
    continue
  }
  const note = (() => {
    const v = modelWithShared(seat).verdicts
    return `判定取值：${v.enum.map((x) => `${x.id}（${x.label}）`).join('、')}`
  })()
  const seg = String(text).split(/^## 本席清单\s*$/m)[1]
  const head = seg === undefined ? '' : (seg.split(/\r?\n/).find((l) => l.trim().startsWith('|')) || '')
  if (head.includes(note)) ok += 1
  else bad.push({ seat, why: head === '' ? '本席清单段无表头行' : '表头未逐字含模型声明的判定取值' })
}

const verdict = bad.length > 0 ? 'fail' : 'ok'
console.log(`check-tristate-header: seats ${seats.length} / ok ${ok} / bad ${bad.length} => ${verdict}`)
if (bad.length > 0) {
  for (const b of bad) console.error(`  ${b.seat}: ${b.why}`)
  process.exitCode = 1
}
