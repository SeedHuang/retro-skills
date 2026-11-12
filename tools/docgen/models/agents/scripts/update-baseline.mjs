#!/usr/bin/env node
// 基线重生成 / 校验：jsons/<seat>/index.json + jsons/_shared.json → jsons/<seat>/_baseline.json
// 用法：--seat <名> | --all；--check 只读比对（不写盘）；--root <仓根> 重定向（测试用）
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expand, verify, anyError } from '../verify-models.mjs'
import { writeFileAtomic } from '../../../builders/agents/atomicWrite.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(here, '..', '..', '..', '..', '..')
const args = process.argv.slice(2)
const has = (f) => args.includes(f)
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null }
const root = resolve(val('--root') || REPO)
const jsons = join(root, 'tools', 'docgen', 'models', 'agents', 'jsons')
const seatArg = val('--seat')
const all = has('--all')
const check = has('--check')

if (!existsSync(jsons)) { console.error(`jsons 目录不存在：${jsons}`); process.exit(2) }
let seats
if (seatArg) seats = [seatArg]
else if (all) seats = readdirSync(jsons, { withFileTypes: true }).filter((e) => e.isDirectory() && !e.name.startsWith('_')).map((e) => e.name).sort()
else { console.error('用法：--seat <名> | --all [--check] [--root <仓根>]'); process.exit(2) }

const shared = JSON.parse(readFileSync(join(jsons, '_shared.json'), 'utf8'))
const outs = []
const errs = []
for (const seat of seats) {
  const idx = join(jsons, seat, 'index.json')
  if (!existsSync(idx)) { errs.push(`${seat}: 缺 index.json`); continue }
  let exp
  try { exp = expand(idx, shared) } catch (e) { errs.push(`${seat}: expand 失败 ${e.message}`); continue }
  const r = verify(seat, { modelPath: idx, baseline: false, shared })
  if (anyError(r)) { errs.push(`${seat}: verify 失败 ${JSON.stringify(r).slice(0, 200)}`); continue }
  outs.push({ seat, file: join(jsons, seat, '_baseline.json'), text: `${JSON.stringify(exp, null, 2)}\n` })
}
if (errs.length) { console.error(errs.join('\n')); process.exit(1) }

if (check) {
  // 只比 verify 实际读取的四段（must/never/predicates/records）：其余字段允许是历史快照
  const pick = (x) => JSON.stringify({ must: x.must, never: x.never, predicates: x.predicates, records: x.records })
  const bad = outs.filter((o) => {
    if (!existsSync(o.file)) return true
    try { return pick(JSON.parse(readFileSync(o.file, 'utf8'))) !== pick(JSON.parse(o.text)) } catch { return true }
  })
  if (bad.length) { console.error(`基线不一致：${bad.map((b) => b.seat).join(',')}`); process.exit(1) }
  console.log(`update-baseline: ${outs.length} 席一致`)
  process.exit(0)
}
for (const o of outs) writeFileAtomic(o.file, o.text)
console.log(`update-baseline: 写入 ${outs.length} 席`)
