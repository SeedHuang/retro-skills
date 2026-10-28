// check-gate-record.mjs —— `gate-record.md` 的机械判据（R1 / R2 / R6）
//
// 为什么要有这一份：判据原先写在 rules / plan 里的内联 `node -e`，用「整行含『申报人』即丢弃」过滤表头——
// 于是任何正文提到「申报人」的数据行都会被当成表头跳过，自检恒绿（2026-10-28 代码审查 P1）。
// 这里改为**按单元格**判表头（第 1 格 = `段` 且第 4 格 = `申报人`），并给「空白 / 只写已核」独立报错。
import { readFileSync, existsSync, realpathSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
// 单元格切分用仓内单源（反引号跨度内的竖线 / 裸 `\|` 都不算分隔符；朴素 split('|') 会切错已有行）
import { splitRow } from '../tools/execution-matrix/markdown-rows.mjs'

export const RECORD_PATH = 'skills/dev-workflow/references/gate-record.md'
// 名字列按这些分隔符拆词（与 rules 的验证命令同口径）
const NAME_SPLIT = /[、+＋，,/]/
const MIN_EVIDENCE = 4 // 「核了什么」字数下限（兜底；主判据是下面的可复算锚点）

// 「可复算锚点」：证据必须能在不改语境的情况下重跑或回指
//   · 反引号包裹的命令 / 路径（`npm run check`）
//   · 行号锚（#L12 / path:12）
// **`→` 不算锚点**：单独一个箭头会让「已全部核对 → 通过」这类空话照样合格（第 4 轮 sdet P1）；
// **`path:line` 支要求冒号前含字母 / `.` / `/` / `\`**：否则「已核对 2026-10-28 10:30」「已核对 1:1」
// 会把时间串与纯数字比当锚点（第 5 轮审计 P1）。现存的「`cmd` → 结论」写法本就含反引号，不受影响。
const ANCHOR_RE = /`[^`]+`|#L\d+|[^\s:：]*[A-Za-z_./\\][^\s:：]*:\d+/

const cellsOf = (line) => splitRow(line)
const isSeparator = (cells) => cells.length > 0 && cells.every((c) => /^:?-{3,}:?$/.test(c))
const isHeader = (cells) => cells[0] === '段' && cells[3] === '申报人'

const names = (s) => String(s ?? '').split(NAME_SPLIT).map((x) => x.trim()).filter(Boolean)

/**
 * 解析并判定 gate-record 正文。
 * @returns {{rows: number, reasons: string[], rowsWithIssues: object[]}}
 */
export function checkGateRecord(text) {
  const lines = String(text ?? '').split(/\r?\n/)
  const data = []
  for (const raw of lines) {
    const line = raw.trim()
    if (!line.startsWith('|')) continue
    const cells = cellsOf(line)
    if (isSeparator(cells) || isHeader(cells)) continue
    data.push({ line, cells })
  }

  const reasons = []
  const rowsWithIssues = []
  data.forEach(({ line, cells }, i) => {
    const at = `第 ${i + 1} 条数据行（段=${cells[0] ?? ''}）`
    const issues = []
    if (cells.length !== 6) issues.push(`${at}：列数 ${cells.length} ≠ 6`)
    const evidence = cells[2] ?? ''
    if (!evidence.trim()) issues.push(`${at}：「核了什么」为空（R1）`)
    else if (!ANCHOR_RE.test(evidence)) issues.push(`${at}：「核了什么」无可复算锚点（R1，「${evidence.trim().slice(0, 20)}」）`)
    else if ([...evidence.trim()].length < MIN_EVIDENCE) issues.push(`${at}：「核了什么」过短（R1，只写「${evidence}」）`)
    const verdict = cells[5] ?? ''
    if (!verdict.trim() || verdict.trim() === '—') issues.push(`${at}：结论为空（R3 / 表口径「留空 = 未收口」）`)
    const a = names(cells[3])
    const b = names(cells[4])
    if (!a.length) issues.push(`${at}：申报人为空（R2）`)
    if (!b.length) issues.push(`${at}：签字人为空（R2）`)
    if (a.length && b.length && a.some((x) => b.includes(x))) {
      issues.push(`${at}：申报人 ∩ 签字人 = ${a.filter((x) => b.includes(x)).join('、')}（R2 自签）`)
    }
    if (issues.length) {
      rowsWithIssues.push({ seg: cells[0] ?? '', issues })
      reasons.push(...issues)
    }
  })

  // R6：同一时刻处于「拆 spec 中」的功能块 ≤ 1
  const splitting = (String(text ?? '').match(/拆 spec 中/g) ?? []).length
  if (splitting > 1) reasons.push(`R6：「拆 spec 中」出现 ${splitting} 次（应 ≤ 1）`)

  return { rows: data.length, splitting, reasons, rowsWithIssues }
}

/** 读文件并判定；文件缺失也算一条 reason（fail-closed） */
export function checkFile(path = RECORD_PATH, root = process.cwd()) {
  const abs = resolve(root, path)
  if (!existsSync(abs)) return { rows: 0, splitting: 0, reasons: [`门行文件缺失：${path}`], rowsWithIssues: [] }
  return checkGateRecord(readFileSync(abs, 'utf8'))
}

function main() {
  const r = checkFile()
  console.log(`rows ${r.rows} bad ${r.rowsWithIssues.length}`)
  if (r.reasons.length === 0) {
    console.log(`gate-record ok（R1/R2/R6 全过；splitting ${r.splitting}）`)
    return 0
  }
  for (const why of r.reasons) console.error(`[gate-record] ${why}`)
  return 1
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  process.exitCode = main()
}
