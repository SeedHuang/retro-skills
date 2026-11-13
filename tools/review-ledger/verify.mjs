#!/usr/bin/env node
// T4 校验器（spec §6）：只读，只产出判红清单 `{reds:[{line,col,code,reason}]}`，不改内容。
// red code 封闭集：header_mismatch / row_keys_mismatch / pending_unmarked / pending_unfilled /
//   machine_empty / machine_overwritten / missing_reason / missing_applicability /
//   duplicate_keys / parse_failed。
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { modelWithShared } from '../docgen/models/agents/source.mjs'
import { kinds } from '../docgen/builders/agents/components/outputFormats.mjs'
import { findTables, normalizeKey, parseLedger, triStateOf } from './lib/parse.mjs'

const VERDICTS = new Set(['hit', 'miss', 'na'])
const PROV_KEYS = ['命令=', '退出码=', '首行=', '时刻=']

/** 去掉三态前缀后的格内文本 */
function textOf(cell) {
  const s = String(cell ?? '').trim()
  const state = triStateOf(s)
  return state ? s.slice(s.indexOf(']') + 1).trim() : s
}

/** 结果格：{state, value}；value 只认 hit / miss / na */
function verdictOf(cell) {
  const state = triStateOf(cell)
  const rest = textOf(cell)
  const first = rest.split(/\s+/)[0]
  return { state, value: VERDICTS.has(first) ? first : null }
}

/**
 * @returns {{reds:{line:number,col:number,code:string,reason:string}[]}}
 */
export function verifyLedger({ text, model, kind }) {
  const reds = []
  const columns = kinds[kind]?.columns
  if (!columns) throw new Error(`kind 未注册：${kind}`)
  const labels = columns.map((c) => c.label)
  const at = (id) => columns.findIndex((c) => c.id === id)
  const REQUIRED = ['no', 'verdict', 'reason', 'applicability', 'evidence']
  const missingCols = REQUIRED.filter((id) => at(id) < 0)
  if (missingCols.length) throw new Error(`kind ${kind} 缺账本必需列：${missingCols.join(', ')}`)
  const noI = at('no'), verdictI = at('verdict'), reasonI = at('reason'), appI = at('applicability'), evidenceI = at('evidence')

  const parsed = parseLedger(text)
  if (parsed.parseFailed) {
    const detail = [
      parsed.badLines.length ? `坏行 ${parsed.badLines.map((b) => b.line).join(',')}` : '',
      parsed.badTables.length ? `坏表 ${parsed.badTables.map((b) => b.line).join(',')}` : '',
      parsed.unclosedLine ? `未闭合围栏 L${parsed.unclosedLine}` : '',
    ].filter(Boolean).join(' / ')
    reds.push({ line: parsed.badLines[0]?.line ?? parsed.badTables[0]?.line ?? parsed.unclosedLine ?? 1, col: 0, code: 'parse_failed', reason: detail })
    return { reds }
  }

  const [t] = findTables(text)
  if (!t) {
    reds.push({ line: 1, col: 0, code: 'parse_failed', reason: '找不到表头' })
    return { reds }
  }
  if (JSON.stringify(t.head) !== JSON.stringify(labels)) {
    const diff = t.head.findIndex((c, i) => c !== labels[i])
    reds.push({
      line: t.headerIndex + 1,
      col: (diff < 0 ? labels.length : diff) + 1,
      code: 'header_mismatch',
      reason: `期望 ${JSON.stringify(labels)}，实得 ${JSON.stringify(t.head)}`,
    })
    return { reds }
  }

  const rows = parsed.rows.filter((r) => r.line >= t.delimIndex + 2 && r.line <= t.endIndex)
  const keyLines = new Map()
  for (const r of rows) {
    const key = normalizeKey(r.cells[noI])
    if (!keyLines.has(key)) keyLines.set(key, [])
    keyLines.get(key).push(r.line)
  }
  for (const [key, lines] of keyLines) {
    if (lines.length > 1) {
      reds.push({ line: lines[1], col: noI + 1, code: 'duplicate_keys', reason: `键 ${key} 重复出现在行 ${lines.join(', ')}` })
    }
  }
  const expected = (model.checklist?.items || []).map((it) => String(it.no))
  const missing = expected.filter((k) => !keyLines.has(k))
  const extra = [...keyLines.keys()].filter((k) => !expected.includes(k))
  if (missing.length || extra.length) {
    reds.push({
      line: t.headerIndex + 1,
      col: noI + 1,
      code: 'row_keys_mismatch',
      reason: `缺 ${missing.join(',') || '-'}；多 ${extra.join(',') || '-'}`,
    })
  }

  for (const r of rows) {
    const verdictCell = r.cells[verdictI] ?? ''
    const evidenceCell = r.cells[evidenceI] ?? ''
    const machineEvidence = triStateOf(evidenceCell) === '机算'
    const v = verdictOf(verdictCell)

    if (!String(verdictCell).trim()) {
      reds.push({
        line: r.line,
        col: verdictI + 1,
        code: machineEvidence ? 'machine_empty' : 'pending_unmarked',
        reason: machineEvidence ? '机算格被置空（证据栏仍标 [机算]）' : '结果格为空且无三态标记',
      })
      continue
    }
    if (v.value === null) {
      reds.push({
        line: r.line,
        col: verdictI + 1,
        code: v.state === '机算' ? 'machine_empty' : 'pending_unfilled',
        reason: v.state === '机算' ? '机算格无判定值' : '有标记但无判定值',
      })
      continue
    }

    if (v.state === '机算' || machineEvidence) {
      if (!machineEvidence) {
        reds.push({ line: r.line, col: evidenceI + 1, code: 'machine_overwritten', reason: '结果为 [机算] 但证据栏未标 [机算]' })
      } else {
        const ev = textOf(evidenceCell)
        const miss = PROV_KEYS.filter((k) => !ev.includes(k))
        if (miss.length) {
          reds.push({ line: r.line, col: evidenceI + 1, code: 'machine_overwritten', reason: `证据缺 ${miss.join(' ')}` })
        } else {
          const m = /退出码=(-?\d+)/.exec(ev)
          const code = m ? Number(m[1]) : null
          if ((v.value === 'hit' && code !== 0) || (v.value === 'miss' && code === 0)) {
            reds.push({ line: r.line, col: evidenceI + 1, code: 'machine_overwritten', reason: `结果 ${v.value} 与退出码 ${code} 不一致` })
          }
        }
      }
    }

    if (v.value === 'miss' && textOf(r.cells[reasonI]) === '') {
      reds.push({ line: r.line, col: reasonI + 1, code: 'missing_reason', reason: 'miss 行缺理由' })
    }
    if (v.value === 'na' && textOf(r.cells[appI]) === '') {
      reds.push({ line: r.line, col: appI + 1, code: 'missing_applicability', reason: 'na 行缺适用性说明' })
    }
  }

  reds.sort((a, b) => a.line - b.line || a.col - b.col)
  return { reds }
}

// ── CLI ──────────────────────────────────────────────────────────────────────
const ARGV = process.argv.slice(2)
const val = (f, def = null) => { const i = ARGV.indexOf(f); return i >= 0 ? ARGV[i + 1] : def }
const has = (f) => ARGV.includes(f)

function fail(msg) {
  console.error(`[verify] ${msg}`)
  process.exit(2)
}

function main() {
  const file = ARGV[0]
  const kind = val('--kind')
  const seat = val('--seat')
  if (!file || !kind || !seat) fail('用法：node verify.mjs <产物文件> --kind <kind> --seat <席名> [--pretty]')
  let text
  try { text = readFileSync(file, 'utf8') } catch (e) { fail(`读文件失败：${e.message}`) }
  let result
  try { result = verifyLedger({ text, model: modelWithShared(seat), kind }) } catch (e) { fail(e.message) }
  console.log(JSON.stringify(result, null, has('--pretty') ? 2 : 0))
  if (result.reds.length) process.exitCode = 1
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isMain) main()
