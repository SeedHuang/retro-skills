import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const key = JSON.parse(readFileSync(join(here, 'answer-key.json'), 'utf8'))
const map = JSON.parse(readFileSync(join(root, 'blind-map.json'), 'utf8').replace(/^\uFEFF/, ''))
const byBlind = {}
for (const row of map) {
  byBlind[row.blindA] = { seat: row.seat, group: row.realA }
  byBlind[row.blindB] = { seat: row.seat, group: row.realB }
}

const explain = { '0': '现役', '1': '沙箱', A: '现役', B: '沙箱' }
const dir = join(here, 'understanding')
const rows = []
for (const f of readdirSync(dir).filter(x => x.endsWith('.json')).sort()) {
  const m = f.match(/^r(\d+)-(card-[AB]\d)\.json$/)
  if (!m) continue
  const data = JSON.parse(readFileSync(join(dir, f), 'utf8'))
  const blind = m[2]
  const meta = byBlind[blind]
  if (!meta) { console.error(`missing blind map: ${blind}`); continue }
  const answers = {}
  for (const a of data.answers || []) answers[a.q] = a.a || ''
  const missed = []
  let hits = 0
  for (let i = 1; i <= 8; i++) {
    const q = `Q${i}`
    const rule = key.seats[meta.seat]?.[q]
    if (!rule) { missed.push(`${q}:no-rule`); continue }
    const text = String(answers[q] || '').toLowerCase()
    const n = rule.keys.filter(k => text.includes(String(k).toLowerCase())).length
    if (n >= rule.min) hits++
    else missed.push(`${q}(${n}/${rule.min}:${rule.keys.filter(k => !text.includes(String(k).toLowerCase())).join('|')})`)
  }
  rows.push({ round: Number(m[1]), card: blind, seat: meta.seat, group: explain[meta.group], hits, missed })
}
const bySeat = {}
for (const r of rows) {
  const k = `${r.seat}|${r.group}`
  ;(bySeat[k] ||= []).push(r.hits)
}
const med = a => { const b = [...a].sort((x, y) => x - y); const n = b.length; return n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2 }
for (const r of rows) console.log(`${r.round}\t${r.card}\t${r.seat}\t${r.group}\t${r.hits}/8\t${r.missed.join('; ')}`)
console.log('---')
for (const k of Object.keys(bySeat).sort()) {
  const v = bySeat[k]
  console.log(`${k}\tn=${v.length}\tmed=${med(v)}\tvals=${v.join(',')}`)
}
