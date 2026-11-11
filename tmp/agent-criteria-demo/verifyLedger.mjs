// 账本产物校验器：读产物 markdown，对照 outputFormats.docs 的结构化字段，
// 判「表在不在、列齐不齐、必填列填没填」——只判痕，不判值对不对（值合理性归 residual 人工抽检）。
// 用法：node tools/docgen/builders/agents/verifyLedger.mjs --file <产物路径>
// 产物文件名须与模板 file 同名（round-check.md / delivery-audit.md），否则无法定位字段定义。
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { collectDocs } from './ledger.mjs'

const splitRow = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((s) => s.trim())

/** 解析 markdown 里的全部表格：{ headers, rows }[]（跳过分隔行） */
export function parseTables(md) {
  const out = []
  let buf = null
  for (const line of md.split(/\r?\n/)) {
    if (/^\s*\|/.test(line)) {
      buf = buf ?? []
      buf.push(line)
    } else if (buf) {
      const t = toTable(buf)
      if (t) out.push(t)
      buf = null
    }
  }
  if (buf) {
    const t = toTable(buf)
    if (t) out.push(t)
  }
  return out
}

function toTable(lines) {
  if (lines.length < 2) return null
  return { headers: splitRow(lines[0]), rows: lines.slice(2).map(splitRow) }
}

/** 按模板结构校验产物文本；返回 { ok, errors } */
export function verifyText(fileName, text, docs = collectDocs()) {
  const tpl = docs.find((d) => d.file === fileName)
  if (!tpl) return { ok: false, errors: [`未知账本：${fileName}（没有对应的模板定义）`] }
  const tplTables = tpl.blocks.filter((b) => b.table).map((b) => b.table)
  const tables = parseTables(text)
  const errors = []
  if (tables.length < tplTables.length) {
    errors.push(`表数量不足：实得 ${tables.length}，模板要求 ${tplTables.length}`)
  }
  tplTables.forEach((t, i) => {
    const got = tables[i]
    if (!got) return
    if (got.headers.join('|') !== t.columns.join('|')) {
      errors.push(`第 ${i + 1} 个表表头不符：期望 ${t.columns.join(' / ')}，实得 ${got.headers.join(' / ')}`)
      return
    }
    if (got.rows.length < t.rows.length) {
      errors.push(`第 ${i + 1} 个表行数不足：实得 ${got.rows.length}，模板要求 ${t.rows.length}`)
    }
    for (const col of t.required ?? []) {
      const idx = got.headers.indexOf(col)
      got.rows.forEach((r, ri) => {
        if (!r[idx]) errors.push(`第 ${i + 1} 个表第 ${ri + 1} 行「${col}」为空`)
      })
    }
  })
  return { ok: errors.length === 0, errors }
}

/** 读文件校验；文件不存在直接红 */
export function verifyFile(file) {
  if (!existsSync(file)) return { ok: false, errors: [`产物不存在：${file}`] }
  return verifyText(path.basename(file), readFileSync(file, 'utf8').replace(/^\uFEFF/, ''))
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const i = process.argv.indexOf('--file')
  const file = i >= 0 ? process.argv[i + 1] : undefined
  if (!file) {
    console.log('用法：node verifyLedger.mjs --file <产物路径>')
    process.exit(2)
  }
  const r = verifyFile(file)
  for (const e of r.errors) console.log(`RED ${e}`)
  console.log(r.ok ? `账本 ok（${path.basename(file)}）` : `账本不合格：${r.errors.length} 处`)
  process.exit(r.ok ? 0 : 1)
}
