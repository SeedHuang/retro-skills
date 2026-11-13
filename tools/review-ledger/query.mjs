#!/usr/bin/env node
// T3 定位器（spec §5）：只读、输出 JSON；行号 1-based；多命中按行号升序。
//   index：产物全部行键 + 行号 + 状态
//   show ：按行键（--row）或列取值（--where）定位，带上下文（--context N，默认 1，上限 5）
// 退出码：解析失败（坏行 / 坏表 / 未闭合围栏）→ 1；0 命中且 skipped=0 → 0。
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { kinds } from '../docgen/builders/agents/components/outputFormats.mjs'
import { fenceMask } from '../execution-matrix/markdown-rows.mjs'
import { normalizeText, normalizeKey, parseLedger, triStateOf, TRI_STATES } from './lib/parse.mjs'

export { normalizeKey }

function columnsOf(kind) {
  const columns = kinds[kind]?.columns
  if (!columns) throw new Error(`kind 未注册：${kind}`)
  return columns
}

/** 列取值匹配：三态值按前缀匹配，其余按去空白后的全等匹配 */
function cellMatches(cell, value) {
  const s = String(cell ?? '').trim()
  const v = String(value ?? '').trim()
  if (TRI_STATES.includes(v)) return triStateOf(s) === v
  return s === v
}

function columnIndex(columns, name) {
  const at = columns.findIndex((c) => c.id === name || c.label === name)
  if (at < 0) throw new Error(`未知列：${name}`)
  return at
}

/** 产物索引：{rows:[{key,line,status}], scanned, skipped, badLines, parseFailed} */
export function buildIndex(text, kind) {
  const columns = columnsOf(kind)
  const parsed = parseLedger(text)
  const statusAt = columns.findIndex((c) => c.id === 'verdict')
  const rows = parsed.rows.map((r) => ({
    key: normalizeKey(r.cells[0]),
    line: r.line,
    status: statusAt >= 0 ? r.cells[statusAt] ?? '' : '',
  }))
  return { rows, scanned: parsed.scanned, skipped: parsed.skipped, badLines: parsed.badLines, parseFailed: parsed.parseFailed }
}

function sectionsOf(lines) {
  const { mask } = fenceMask(lines)
  const out = new Array(lines.length).fill(null)
  let cur = null
  for (let i = 0; i < lines.length; i++) {
    const m = mask[i] ? null : /^\s*#{1,6}\s+(.*)$/.exec(lines[i])
    if (m) cur = m[1].trim()
    out[i] = cur
  }
  return out
}

/**
 * 定位：{hits, matches:[{line,row,context}], scanned, skipped, badLines, parseFailed}
 * --context N = 命中行前后各 N 行（不含本行）；跨节时 context 项带 boundary 与 section。
 */
export function queryShow(text, kind, { row, where, fields, context = 1 } = {}) {
  const columns = columnsOf(kind)
  const parsed = parseLedger(text)
  const lines = normalizeText(text).split('\n')
  const sections = sectionsOf(lines)
  const n = Math.max(0, Math.min(5, Number.isInteger(context) ? context : 1))
  const selected = (fields && fields.length ? fields : columns.map((c) => c.id)).map((f) => {
    const at = columnIndex(columns, f)
    return columns[at].id
  })
  const whereAt = where ? columnIndex(columns, where.col) : -1

  const matches = []
  for (const r of parsed.rows) {
    if (row !== undefined && normalizeKey(r.cells[0]) !== normalizeKey(row)) continue
    if (whereAt >= 0 && !cellMatches(r.cells[whereAt], where.value)) continue
    const i = r.line - 1
    const contextRows = []
    for (let j = Math.max(0, i - n); j <= Math.min(lines.length - 1, i + n); j++) {
      if (j === i) continue
      const item = { line: j + 1, text: lines[j], section: sections[j] }
      if (sections[j] !== sections[i]) item.boundary = true
      contextRows.push(item)
    }
    const out = { key: normalizeKey(r.cells[0]) }
    for (const id of selected) out[id] = r.cells[columnIndex(columns, id)] ?? ''
    matches.push({ line: r.line, row: out, context: contextRows })
  }
  matches.sort((a, b) => a.line - b.line)
  return {
    hits: matches.length,
    matches,
    scanned: parsed.scanned,
    skipped: parsed.skipped,
    badLines: parsed.badLines,
    parseFailed: parsed.parseFailed,
  }
}

// ── CLI ──────────────────────────────────────────────────────────────────────
const ARGV = process.argv.slice(2)
const val = (f, def = null) => { const i = ARGV.indexOf(f); return i >= 0 ? ARGV[i + 1] : def }
const has = (f) => ARGV.includes(f)

function fail(msg) {
  console.error(`[query] ${msg}`)
  process.exit(2)
}

function main() {
  const sub = ARGV[0]
  const file = ARGV[1]
  const kind = val('--kind')
  if (!['index', 'show'].includes(sub) || !file || !kind) {
    fail('用法：node query.mjs <index|show> <产物文件> --kind <kind> [--row <键> | --where <列>=<值>] [--fields a,b] [--context N]')
  }
  let text
  try { text = readFileSync(file, 'utf8') } catch (e) { fail(`读文件失败：${e.message}`) }

  let result
  try {
    if (sub === 'index') {
      result = buildIndex(text, kind)
    } else {
      const whereRaw = val('--where')
      const row = val('--row')
      if (whereRaw && row) fail('--row 与 --where 只能二选一')
      let where
      if (whereRaw) {
        const at = whereRaw.indexOf('=')
        if (at <= 0) fail('--where 格式应为 <列>=<值>')
        where = { col: whereRaw.slice(0, at), value: whereRaw.slice(at + 1) }
      }
      if (!row && !where) fail('show 需要 --row <键> 或 --where <列>=<值>')
      const fields = val('--fields') ? val('--fields').split(',').map((s) => s.trim()).filter(Boolean) : undefined
      const context = val('--context') === null ? 1 : Number(val('--context'))
      if (!Number.isInteger(context) || context < 0) fail('--context 必须是非负整数')
      result = queryShow(text, kind, { row, where, fields, context })
    }
  } catch (e) {
    fail(e.message)
  }

  console.log(JSON.stringify(result, null, has('--pretty') ? 2 : 0))
  if (result.parseFailed) process.exitCode = 1
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isMain) main()
