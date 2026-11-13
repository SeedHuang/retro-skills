#!/usr/bin/env node
// T2 填充器（spec §4）：骨架生成 → 三态标注 → 显式命令取数 → 幂等写回。
//
// 口径：
//   - 列 / 表头取 kind 注册表（`kinds[kind].columns`），行取 `checklist.items[]`（no 升序）
//   - 判据覆盖度按 observable op 分类：全可机判 = full，部分 = partial，其余 = manual
//   - 只有显式提供 `--command <criterion>=<命令>` 且覆盖度非 manual 的判据才跑命令；
//     其余一律 `[待判]` 并附 residual 原因（不猜）
//   - 机算证据格式固定：`[机算] 命令=…；退出码=…；首行=…；时刻=…`
//   - 重跑只补空 / `[待判]` 格；`[机算]`、`[人工]` 与人工填写内容一律不改（D4 / D8）
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { modelWithShared, MODELS_DIR } from '../docgen/models/agents/source.mjs'
import { makeHelpers } from '../docgen/models/agents/render/sections.mjs'
import { kinds } from '../docgen/builders/agents/components/outputFormats.mjs'
import { collectDocs, renderTemplate } from '../docgen/builders/agents/ledger.mjs'
import { splitRow } from '../execution-matrix/markdown-rows.mjs'
import { findTables, normalizeText, parseLedger } from './lib/parse.mjs'

const SHARED = JSON.parse(readFileSync(path.join(MODELS_DIR, '_shared.json'), 'utf8'))

export const MACHINE_OPS = new Set(['fieldNonEmpty', 'fieldEnumIn', 'lineExists', 'quoteInLine', 'countGte', 'fieldsEq'])
const PENDING = '[待判]'
const HUMAN = '[人工]'
const MACHINE = '[机算]'

/** 判据覆盖度：全部 op 可机判 = full；部分 = partial；其余 = manual */
export function coverageOf(criterion) {
  const ops = (criterion?.observable || []).map((o) => o.op)
  if (ops.length === 0) return 'manual'
  const machine = ops.filter((op) => MACHINE_OPS.has(op)).length
  return machine === ops.length ? 'full' : machine > 0 ? 'partial' : 'manual'
}

/** residual / objective 原因码 → 中文（没有则空串） */
export function reasonOf(model, criterion) {
  const code = criterion?.residual?.objective?.reason ?? criterion?.objective?.reason
  return code ? model.reasonCodes?.[code] || code : ''
}

/** 含时区的取数时刻（本机时区；Asia/Shanghai 下为 +08:00） */
export function stamp(now = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  const off = -now.getTimezoneOffset()
  const sign = off >= 0 ? '+' : '-'
  const abs = Math.abs(off)
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())} ${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())} ${sign}${p(Math.floor(abs / 60))}:${p(abs % 60)}`
}

/** 骨架：表头 = kind 列 label；行 = checklist.items[]（no 升序），未判定格初始写 [人工] */
export function buildSkeleton({ model, kind }) {
  const columns = kinds[kind]?.columns
  if (!columns) throw new Error(`kind 未注册：${kind}`)
  const helpers = makeHelpers(model, SHARED)
  const rows = [...(model.checklist?.items || [])]
    .sort((a, b) => a.no - b.no)
    .map((it) => {
      const criterion = model.checkCriteria?.[it.criterion]
      if (!criterion) throw new Error(`判据未定义：${it.criterion}`)
      const coverage = coverageOf(criterion)
      return [
        String(it.no),
        `${it.seatPrefix}：${it.category}`,
        helpers.renderCriterion(criterion),
        model.enums?.coverage?.labels?.[coverage] ?? coverage,
        HUMAN,
        '',
        '',
        HUMAN,
      ]
    })
  return { headers: columns.map((c) => c.label), rows }
}

/** 执行命令并取退出码 / 输出首行；启动失败或无退出码 = 脚本失败 */
export function runShell(cmd, { cwd } = {}) {
  const r = spawnSync(cmd, { shell: true, cwd, encoding: 'utf8' })
  if (r.error) return { ok: false, reason: r.error.message }
  if (r.status === null) return { ok: false, reason: '进程无退出码' }
  return { ok: true, code: r.status, firstLine: (r.stdout || '').split(/\r?\n/)[0] ?? '' }
}

/**
 * 逐行写三态与机算值。
 * @param {object} opts
 * @param {object} opts.model 合并后的席位模型
 * @param {string[][]} opts.rows buildSkeleton 的行
 * @param {Record<string,string>} [opts.commands] criterion → 取数命令
 * @param {(cmd:string, o:{cwd?:string})=>{ok:boolean,code?:number,firstLine?:string,reason?:string}} [opts.runCommand]
 * @param {Date} [opts.now]
 * @param {string} [opts.cwd]
 * @returns {{rows:string[][], failures:{no:string,criterion:string,cmd:string,reason:string}[]}}
 */
export function applyStates({ model, rows, commands = {}, runCommand = runShell, now = new Date(), cwd } = {}) {
  const items = new Map((model.checklist?.items || []).map((it) => [String(it.no), it]))
  const failures = []
  for (const row of rows) {
    const it = items.get(String(row[0]).trim())
    const criterion = it ? model.checkCriteria?.[it.criterion] : null
    if (!criterion) continue
    const cmd = commands[it.criterion]
    if (cmd && coverageOf(criterion) !== 'manual') {
      const r = runCommand(cmd, { cwd })
      if (!r.ok) {
        failures.push({ no: row[0], criterion: it.criterion, cmd, reason: r.reason })
        row[4] = `${PENDING}（脚本失败：${r.reason}）`
        continue
      }
      const hit = r.code === 0
      row[4] = `${MACHINE} ${hit ? 'hit' : 'miss'}`
      row[5] = hit ? '' : `命令退出码 ${r.code}`
      row[7] = `${MACHINE} 命令=${cmd}；退出码=${r.code}；首行=${r.firstLine}；时刻=${stamp(now)}`
      continue
    }
    row[4] = PENDING
    const reason = reasonOf(model, criterion)
    if (reason) row[5] = reason
  }
  return { rows, failures }
}

/** 按行键合并：已有格只有在空 / [待判] 时才被新值补上；已填格（含时刻）不动 */
export function mergeRows(existing, next) {
  const out = existing.map((r) => [...r])
  const byKey = new Map(out.map((r) => [String(r[0]).trim(), r]))
  for (const row of next) {
    const key = String(row[0]).trim()
    const cur = byKey.get(key)
    if (!cur) {
      const copy = [...row]
      out.push(copy)
      byKey.set(key, copy)
      continue
    }
    for (let i = 0; i < row.length; i++) {
      const old = String(cur[i] ?? '').trim()
      if (old === '' || old.startsWith(PENDING)) cur[i] = row[i]
    }
  }
  return out
}

const cell = (s) => String(s ?? '').replace(/\|/g, '\\|')
const rowLine = (r) => `| ${r.map(cell).join(' | ')} |`

/** 把行合并进文本的第一张表（保留表头、分隔行与表外内容）；表头不符或解析失败即拒绝写入 */
export function mergeText(text, headers, rows) {
  const parsed = parseLedger(text)
  if (parsed.parseFailed) {
    const detail = [
      parsed.badLines.length ? `坏行 ${parsed.badLines.length}` : '',
      parsed.badTables.length ? `坏表 ${parsed.badTables.length}` : '',
      parsed.unclosedLine ? `未闭合围栏 L${parsed.unclosedLine}` : '',
    ].filter(Boolean).join(' / ')
    throw new Error(`既有账本解析失败（${detail}），拒绝写入`)
  }
  const lines = normalizeText(text).split('\n')
  const [t] = findTables(text)
  if (!t) throw new Error('填充失败：文本里找不到表头')
  if (JSON.stringify(t.head) !== JSON.stringify(headers)) {
    throw new Error(`表头与 kind 不一致：期望 ${JSON.stringify(headers)}，实得 ${JSON.stringify(t.head)}`)
  }
  const existing = []
  for (let j = t.delimIndex + 1; j < t.endIndex; j++) existing.push(splitRow(lines[j]))
  const merged = mergeRows(existing, rows)
  return [
    ...lines.slice(0, t.delimIndex + 1),
    ...merged.map(rowLine),
    ...lines.slice(t.endIndex),
  ].join('\n')
}

/** 库入口：骨架 → 三态 → 合并进文本；返回最终文本、行、失败清单 */
export function fillText({ model, kind, text, commands = {}, runCommand = runShell, now = new Date(), cwd } = {}) {
  const { headers, rows } = buildSkeleton({ model, kind })
  const { rows: filled, failures } = applyStates({ model, rows, commands, runCommand, now, cwd })
  return { text: mergeText(text, headers, filled), headers, rows: filled, failures }
}

// ── CLI ──────────────────────────────────────────────────────────────────────
const ARGV = process.argv.slice(2)
const has = (f) => ARGV.includes(f)
const val = (f, def = null) => { const i = ARGV.indexOf(f); return i >= 0 ? ARGV[i + 1] : def }
function parseCommands() {
  const out = {}
  for (let i = 0; i < ARGV.length; i++) {
    if (ARGV[i] !== '--command') continue
    const raw = ARGV[i + 1] || ''
    const at = raw.indexOf('=')
    if (at > 0) out[raw.slice(0, at)] = raw.slice(at + 1)
  }
  return out
}

function main() {
  const seat = val('--seat')
  const dir = val('--dir')
  const phase = val('--phase', '每轮')
  if (!seat || !dir) {
    console.error('用法：node fill.mjs --seat <席名> --dir <评审目录> [--phase 每轮|终局] [--command <criterion>=<命令>]... [--apply]')
    process.exit(2)
  }
  const model = modelWithShared(seat)
  const out = (model.outputs?.items || []).find((x) => x.phase === phase)
  if (!out) { console.error(`席位 ${seat} 没有「${phase}」产物`); process.exit(2) }
  const kind = model.templates?.[out.template]?.kind
  const doc = collectDocs().find((d) => d.kind === kind)
  if (!doc) { console.error(`kind ${kind} 没有对应的账本模板`); process.exit(2) }

  const target = path.join(dir, path.basename(doc.file))
  if (!existsSync(target) && !existsSync(dir)) mkdirSync(dir, { recursive: true })
  const base = existsSync(target) ? readFileSync(target, 'utf8') : renderTemplate(doc)
  let result
  try {
    result = fillText({ model, kind, text: base, commands: parseCommands(), cwd: dir })
  } catch (e) {
    console.error(`[填充失败] ${e.message}`)
    process.exitCode = 1
    return
  }
  const { text, rows, failures } = result

  const machine = rows.filter((r) => String(r[4] ?? '').startsWith(MACHINE)).length
  const pending = rows.filter((r) => String(r[4] ?? '').startsWith(PENDING)).length
  if (has('--apply')) {
    writeFileSync(target, text, 'utf8')
    console.log(`写入 ${target}（rows=${rows.length} machine=${machine} pending=${pending} failures=${failures.length}）`)
  } else {
    console.log(text)
    console.error(`dry-run：rows=${rows.length} machine=${machine} pending=${pending} failures=${failures.length}`)
  }
  for (const f of failures) console.error(`[脚本失败] ${f.criterion}: ${f.reason}`)
  if (failures.length) process.exitCode = 1
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isMain) main()
