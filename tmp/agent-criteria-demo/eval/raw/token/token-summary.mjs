import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const map = JSON.parse(readFileSync(join(root, '..', 'blind-map.json'), 'utf8').replace(/^\uFEFF/, ''))
const byBlind = {}
for (const row of map) {
  byBlind[row.blindA] = { seat: row.seat, group: row.realA }
  byBlind[row.blindB] = { seat: row.seat, group: row.realB }
}
const explain = { A: '现役', B: '沙箱' }
const cardChars = {}
const cardsDir = join(root, process.argv[3] || (process.argv[2] === 'execution-fix' ? 'cards-fix' : 'cards'))
for (const blind of Object.keys(byBlind)) {
  cardChars[blind] = readFileSync(join(cardsDir, `${blind}.md`), 'utf8').length
}
const outChars = {}
const dir = join(root, process.argv[2] || 'execution')
for (const f of readdirSync(dir).filter(x => x.endsWith('.json'))) {
  const m = f.match(/^r(\d+)-(card-[AB]\d)\.json$/)
  if (!m) continue
  const d = JSON.parse(readFileSync(join(dir, f), 'utf8'))
  const blind = m[2]
  const len = String(d.artifact || '').length + String(d.boundary_action || '').length + JSON.stringify(d.applicability || {}).length
  ;(outChars[blind] ||= []).push(len)
}
const med = a => { const b = [...a].sort((x, y) => x - y); const n = b.length; return n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2 }
for (const blind of Object.keys(byBlind).sort()) {
  const meta = byBlind[blind]
  const oc = outChars[blind] || []
  console.log(`${blind}\t${meta.seat}\t${explain[meta.group]}\tcard_chars=${cardChars[blind]}\tcard_tok=${(cardChars[blind] / 4).toFixed(0)}\tout_chars_med=${oc.length ? med(oc) : 0}\tout_tok_med=${oc.length ? (med(oc) / 4).toFixed(0) : 0}\ttask_tok_est=${oc.length ? ((cardChars[blind] + med(oc) + 800) / 4).toFixed(0) : 0}`)
}
