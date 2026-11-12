import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const rows = [['dimension', 'seat', 'group', 'card', 'round', 'value', 'detail']]

const readLines = f => readFileSync(join(here, f), 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(x => x && !x.startsWith('---'))

for (const line of readLines('understanding-v2-score.txt')) {
  const [round, card, seat, group, score, note = ''] = line.split('\t')
  rows.push(['understanding', seat, group, card, round, score, note])
}
for (const line of readLines('execution-v2-score.txt')) {
  const [round, card, seat, group, ...rest] = line.split('\t')
  const total = (rest.find(x => x.startsWith('total=')) || '').replace('total=', '')
  rows.push(['execution', seat, group, card, round, total, rest.join(' ')])
}
for (const line of readLines('token-v2-summary.txt')) {
  const [card, seat, group, ...rest] = line.split('\t')
  rows.push(['token', seat, group, card, '', (rest.find(x => x.startsWith('card_tok=')) || '').replace('card_tok=', ''), rest.join(' ')])
}
for (const line of readLines('perf-v2-bench.txt')) {
  const [seat, ...rest] = line.split('\t')
  rows.push(['perf', seat, '沙箱', '', '', (rest[0] || '').replace('med_ms=', ''), rest.join(' ')])
}

writeFileSync(join(here, 'aggregate-v2.csv'), rows.map(r => r.join(',')).join('\n') + '\n')
console.log('rows=', rows.length - 1)
