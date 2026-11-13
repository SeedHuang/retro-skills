// 账本解析库（spec §4/§5 前置）：只做结构解析，不做语义判断、不写盘。
// 表格切分与围栏掩码复用 tools/execution-matrix/markdown-rows.mjs 的唯一实现，不在本文件另写一份。
//
// 口径（spec §12 D5/D9）：
//   - `scanned` = 成功解析的数据行数，不含表头、分隔行、说明与小节行；仅表头时 = 0
//   - `skipped` = 列数与表头不符的数据行数（坏行），坏行不进 rows
//   - `line` 为 1-based 物理行号；BOM 与 CRLF 在解析前归一化，不改变行号
import { splitRow, fenceMask } from '../../execution-matrix/markdown-rows.mjs'

const TABLE_ROW_RE = /^\s*\|/
const TRI_PREFIX = /^\[(机算|待判|人工)\]/
const DELIM_CELL = /^:?-{1,}:?$/

/** 三态取值（spec §3 D3）：写在单元格开头的方括号前缀 */
export const TRI_STATES = ['机算', '待判', '人工']

/** 去 BOM + CRLF/CR → LF；行号口径固定为 1-based 物理行 */
export function normalizeText(text) {
  return String(text ?? '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
}

/** 格内三态前缀：`[机算]` / `[待判]` / `[人工]` 开头返回该态，否则 null */
export function triStateOf(cell) {
  const m = TRI_PREFIX.exec(String(cell ?? '').trim())
  return m ? m[1] : null
}

/** 行键归一：`第 1 项` / `1` → `1`；其它原样返回 */
export function normalizeKey(value) {
  const s = String(value ?? '').trim()
  const m = /^第\s*(\d+)\s*项/.exec(s)
  if (m) return String(Number(m[1]))
  return /^\d+$/.test(s) ? String(Number(s)) : s
}

const isDelim = (cells) => cells.length > 0 && cells.every((c) => DELIM_CELL.test(c))

/**
 * 第 k 行若是表头（下一行为同列数分隔行）返回 { head }；
 * 表头像表、分隔行像分隔行但列数不符返回 { bad }；否则 null。
 */
function headerAt(lines, mask, k) {
  if (k + 1 >= lines.length || mask[k] || mask[k + 1]) return null
  if (!TABLE_ROW_RE.test(lines[k]) || !TABLE_ROW_RE.test(lines[k + 1])) return null
  const head = splitRow(lines[k])
  const delim = splitRow(lines[k + 1])
  if (!isDelim(delim)) return null
  if (delim.length !== head.length) {
    return { bad: { line: k + 1, expected: head.length, actual: delim.length } }
  }
  return { head }
}

/** 扫描全部表格：返回有效表（含表头/分隔/结束的 0-based 下标）与结构损坏的表 */
function scan(text) {
  const lines = normalizeText(text).split('\n')
  const { mask, unclosedLine } = fenceMask(lines)
  const tables = []
  const badTables = []
  for (let i = 0; i < lines.length; i++) {
    const h = headerAt(lines, mask, i)
    if (!h) continue
    if (h.bad) { badTables.push(h.bad); continue }
    let j = i + 2
    for (; j < lines.length; j++) {
      if (mask[j] || !TABLE_ROW_RE.test(lines[j])) break
      if (headerAt(lines, mask, j)) break // 相邻表：新表头归下一轮，不能当数据行吞掉
    }
    tables.push({ head: h.head, headerIndex: i, delimIndex: i + 1, endIndex: j })
    i = j - 1 // 跳过本表，避免把数据行误判成新表头
  }
  return { lines, mask, unclosedLine, tables, badTables }
}

/** 全部有效表格（按出现顺序）；`endIndex` 为表格后第一行的 0-based 下标（不含） */
export function findTables(text) {
  return scan(text).tables
}

/**
 * 解析账本文本中的全部 markdown 表格数据行。
 * @returns {{
 *   rows: { line: number, cells: string[] }[],
 *   scanned: number,
 *   skipped: number,
 *   badLines: { line: number, expected: number, actual: number }[],
 *   badTables: { line: number, expected: number, actual: number }[],
 *   parseFailed: boolean,
 *   unclosedLine: number,
 * }}
 * rows 只含列数与表头相等的成功行；坏行计入 skipped / badLines，不进 rows。
 * scanned = 成功行 + 坏行（均为已识别的数据行）；badTables 记「分隔行列数不符」的整表结构损坏。
 * parseFailed = 有坏行 / 坏表 / 未闭合围栏；调用方必须用它区分「0 命中」与「解析失败」。
 */
export function parseLedger(text) {
  const { lines, unclosedLine, tables, badTables } = scan(text)
  const rows = []
  const badLines = []

  for (const t of tables) {
    for (let j = t.delimIndex + 1; j < t.endIndex; j++) {
      const cells = splitRow(lines[j])
      if (cells.length !== t.head.length) {
        badLines.push({ line: j + 1, expected: t.head.length, actual: cells.length })
        continue
      }
      rows.push({ line: j + 1, cells })
    }
  }

  return {
    rows,
    scanned: rows.length + badLines.length,
    skipped: badLines.length,
    badLines,
    badTables,
    parseFailed: badLines.length > 0 || badTables.length > 0 || unclosedLine > 0,
    unclosedLine,
  }
}
