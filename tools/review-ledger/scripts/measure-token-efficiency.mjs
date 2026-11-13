#!/usr/bin/env node
// 定论复现：账本脚本填充 + 行定位的读取量 / 写侧代写字数 / token 估算。
// 用法：
//   node measure-token-efficiency.mjs [--root <仓根>]           # 打印实测数字
//   node measure-token-efficiency.mjs [--root <仓根>] --check   # 与定论数值逐项比对（漂移 exit 1）
//   node measure-token-efficiency.mjs [--root <仓根>] --json    # 机器可读输出
//
// 口径：1 token ≈ 4 字符（仓内 PRD/spec 的估算口径，非实测分词）。
// 依赖：先有 T5 夹具与 T7 试点产物；缺失时本脚本按 --root 自动生成。
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { queryShow } from '../query.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '..', '..', '..')
const args = process.argv.slice(2)
const rootAt = args.indexOf('--root')
const root = resolve(rootAt >= 0 ? args[rootAt + 1] : REPO)
const FIX = join(root, 'tmp', 'fixtures', 'ledger-fill')
const PILOT = join(root, 'tmp', 'fixtures', 'ledger-fill-pilot')
const LONG = join(FIX, 'long', 'delivery-audit.md')
const SHORT = join(PILOT, 'after', 'round1', 'round-check.md')
const KEYS = ['第 1 项', '第 4 项', '第 6 项']
const FIELDS = ['item', 'verdict', 'evidence']

// README「定论」里引用的数值；漂移时 --check 会红
const EXPECTED = {
  long: { lines: 134, chars: 3662, default3: 1486, minimal3: 536 },
  short: { lines: 32, chars: 1402, default3: 1608, minimal3: 624 },
  write: { rows: 8, rowsChars: 762, templateChars: 639, evidenceChars: 121 },
}

const run = (script, extra = []) => spawnSync(process.execPath, [join(HERE, script), '--root', root, ...extra], { encoding: 'utf8' })
const sum = (xs) => xs.reduce((s, x) => s + x.length, 0)
const threeRows = (text, kind, opts) => sum(KEYS.map((row) => JSON.stringify(queryShow(text, kind, { row, ...opts }))))

function ensureInputs() {
  if (!existsSync(join(FIX, 'manifest.json'))) {
    const r = run('make-fixtures.mjs')
    if (r.status !== 0) { console.error(r.stderr || '夹具生成失败'); process.exit(1) }
  }
  if (!existsSync(SHORT)) {
    const r = run('run-pilot.mjs')
    if (r.status !== 0) { console.error(r.stderr || '试点生成失败'); process.exit(1) }
  }
}

export function measure() {
  ensureInputs()
  const long = readFileSync(LONG, 'utf8')
  const short = readFileSync(SHORT, 'utf8')
  const shortLines = short.split('\n')
  const rows = shortLines.filter((l) => /^\| \d+ \|/.test(l))
  const templateChars = shortLines.filter((l) => !/^\| \d+ \|/.test(l)).join('\n').length
  return {
    long: {
      lines: long.split('\n').length,
      chars: long.length,
      default3: threeRows(long, 'delivery-audit', { context: 1 }),
      minimal3: threeRows(long, 'delivery-audit', { fields: FIELDS, context: 0 }),
    },
    short: {
      lines: shortLines.length,
      chars: short.length,
      default3: threeRows(short, 'round-check', { context: 1 }),
      minimal3: threeRows(short, 'round-check', { fields: FIELDS, context: 0 }),
    },
    write: {
      rows: rows.length,
      rowsChars: rows.join('\n').length,
      templateChars,
      evidenceChars: sum(rows.map((l) => l.split('|')[8] ?? '')),
    },
  }
}

const pct = (from, to) => `${(to >= from ? '+' : '')}${(((to - from) / from) * 100).toFixed(1)}%`
const savedTok = (from, to) => {
  const d = from - to
  const n = Math.round(Math.abs(d) / 4)
  return d >= 0 ? n : -n
}

function main() {
  const m = measure()
  if (args.includes('--json')) {
    console.log(JSON.stringify(m))
    return
  }
  console.log(`long : lines=${m.long.lines} chars=${m.long.chars} default3=${m.long.default3} (${pct(m.long.chars, m.long.default3)}) minimal3=${m.long.minimal3} (${pct(m.long.chars, m.long.minimal3)})`)
  console.log(`short: lines=${m.short.lines} chars=${m.short.chars} default3=${m.short.default3} (${pct(m.short.chars, m.short.default3)}) minimal3=${m.short.minimal3} (${pct(m.short.chars, m.short.minimal3)})`)
  console.log(`write: rows=${m.write.rows} rowsChars=${m.write.rowsChars} templateChars=${m.write.templateChars} evidenceChars=${m.write.evidenceChars}`)
  console.log(`token(4chars): long save=${savedTok(m.long.chars, m.long.default3)} / ${savedTok(m.long.chars, m.long.minimal3)}; short save=${savedTok(m.short.chars, m.short.default3)} / ${savedTok(m.short.chars, m.short.minimal3)}; write rows≈${Math.round(m.write.rowsChars / 4)}`)

  if (args.includes('--check')) {
    const bad = []
    for (const [group, exp] of Object.entries(EXPECTED)) {
      for (const [key, value] of Object.entries(exp)) {
        if (m[group]?.[key] !== value) bad.push(`${group}.${key}: 实得 ${m[group]?.[key]} ≠ 定论 ${value}`)
      }
    }
    for (const b of bad) console.error(`[measure] ${b}`)
    if (bad.length) process.exitCode = 1
    else console.log('measure ok：与 README 定论数值一致')
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main()
