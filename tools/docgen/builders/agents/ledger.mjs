// 议会账本模板生成器：数据 components/outputFormats.mjs 的 `docs` → skills/parliament-ledger/assets/*.md
// 模板文字的**唯一来源**是 outputFormats.mjs；本文件只做投影。
// 生成物手改即红：默认只比对（exit 1 = 漂移），--apply 才落盘（与 agent 卡同一纪律）
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { outputFormats, kinds } from './components/outputFormats.mjs'

const DIR = path.dirname(fileURLToPath(import.meta.url))
export const ROOT = path.resolve(DIR, '..', '..', '..', '..')
export const OUT = path.join(ROOT, 'skills', 'parliament-ledger', 'assets')

/** 合法块键：每个 block 必须且只能含其中 1 个；写错键 = 抛错，不静默丢段 */
export const BLOCK_KEYS = ['h1', 'h2', 'para', 'notes', 'bullets', 'table']

const cell = (s) => String(s ?? '').replace(/\|/g, '\\|')

function blockKeyOf(b, file, i) {
  const keys = Object.keys(b ?? {})
  const hit = BLOCK_KEYS.filter((k) => keys.includes(k))
  if (hit.length !== 1) {
    throw new Error(`${file ?? '(未命名)'} blocks[${i}] 必须且只能含一个块键（${BLOCK_KEYS.join(' / ')}），实得 ${JSON.stringify(keys)}`)
  }
  return hit[0]
}

/** 表块取 kind：表块自带的 kind 覆盖文档 kind（issue-card 的观察记录表属 detective） */
export function kindOf(t, defaultKind) {
  return t.kind ?? defaultKind
}

/** kind → 列；未注册即抛错（列的唯一真相在 kinds 注册表） */
export function columnsOf(kind) {
  const columns = kinds[kind]?.columns
  if (!columns) throw new Error(`表块 kind 未注册：${kind}`)
  return columns
}

/** 表块取列：给出 kind 时表头渲 kind 的 label，且不预置数据行（行由填充器按 checklist 生成） */
function tableOf(t, defaultKind) {
  const kind = kindOf(t, defaultKind)
  if (!kind) return t
  return { columns: columnsOf(kind).map((c) => c.label), rows: [] }
}

export function renderTemplate(tpl) {
  if (!tpl || !Array.isArray(tpl.blocks)) throw new Error(`${tpl?.file ?? '(未命名)'} 缺 blocks 数组`)
  const out = []
  for (const [i, b] of tpl.blocks.entries()) {
    const k = blockKeyOf(b, tpl.file, i)
    if (k === 'h1') out.push(`# ${b.h1}`, '')
    else if (k === 'h2') out.push(`## ${b.h2}`, '')
    else if (k === 'para') out.push(b.para, '')
    else if (k === 'notes') {
      for (const n of b.notes) out.push(`> ${n}`)
      out.push('')
    } else if (k === 'bullets') {
      for (const x of b.bullets) out.push(`- ${x}`)
      out.push('')
    } else {
      const t = tableOf(b.table, tpl.kind)
      out.push(`| ${t.columns.map(cell).join(' | ')} |`)
      out.push(`|${t.columns.map(() => '---').join('|')}|`)
      for (const r of t.rows) out.push(`| ${r.map(cell).join(' | ')} |`)
      out.push('')
    }
  }
  return out.join('\n').replace(/\n+$/, '') + '\n'
}

/** 取全部账本模板条目，并校验 file 非空且唯一（同名 file 会在 --apply 时互相覆盖） */
export function collectDocs(formats = outputFormats) {
  const docs = Object.values(formats).flatMap((f) => f?.docs ?? [])
  const seen = new Set()
  for (const d of docs) {
    if (typeof d.file !== 'string' || d.file.trim() === '') throw new Error('docs 条目缺 file')
    if (seen.has(d.file)) throw new Error(`docs 文件名重复：${d.file}`)
    seen.add(d.file)
  }
  // file 检查通过后再验 kind：生产文档必须由 kind 取列取行，表块不得自带第二份 columns/rows
  for (const d of docs) {
    if (typeof d.kind !== 'string' || !kinds[d.kind]) throw new Error(`${d.file} 缺合法 kind：${d.kind}`)
    for (const b of d.blocks ?? []) {
      if (!b.table) continue
      if ('columns' in b.table || 'rows' in b.table) {
        throw new Error(`${d.file} 表块不得自带 columns/rows（列取 kind，行由 checklist 生成）`)
      }
      if (!kinds[kindOf(b.table, d.kind)]) throw new Error(`${d.file} 表块 kind 未注册：${kindOf(b.table, d.kind)}`)
    }
  }
  return docs
}

/** 全部账本模板：{ file, text }[]，来自 outputFormats 各 kind 的 `docs` */
export function renderAll(formats = outputFormats) {
  return collectDocs(formats).map((d) => ({ file: d.file, text: renderTemplate(d) }))
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const apply = process.argv.includes('--apply')
  if (apply) mkdirSync(OUT, { recursive: true })
  let drift = 0
  for (const { file, text } of renderAll()) {
    const target = path.join(OUT, file)
    if (apply) {
      writeFileSync(target, text, 'utf8')
      console.log(`写入 ${file}`)
      continue
    }
    const onDisk = existsSync(target) ? readFileSync(target, 'utf8').replace(/^\uFEFF/, '') : null
    if (onDisk !== text) {
      drift += 1
      console.log(`DIFF ${file}`)
    } else console.log(`ok ${file}`)
  }
  if (!apply && drift > 0) {
    console.log(`drift ${drift} 份`)
    process.exit(1)
  }
  console.log(apply ? 'ledger 已生成' : 'ledger ok')
}
