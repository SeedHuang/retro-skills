#!/usr/bin/env node
// T5 夹具生成 / 冻结比对（默认全量重建到 <root>/tmp/fixtures/ledger-fill）。
// 用法：
//   node make-fixtures.mjs [--root <仓根>]          # 生成夹具 + manifest.json（sha256 冻结）
//   node make-fixtures.mjs [--root <仓根>] --check  # 只读比对 sha256
//
// 为什么 round1..3 不是历史 4 列账本的直接副本：历史账本为 4 列旧格式，fill 已按 D2/T2 要求
// fail-closed 拒绝写入；本夹具集按 8 列 schema 重建，供 T7 试点直接使用。
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { modelWithShared } from '../../docgen/models/agents/source.mjs'
import { collectDocs, renderTemplate } from '../../docgen/builders/agents/ledger.mjs'
import { buildSkeleton, mergeText } from '../fill.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '..', '..', '..')
const args = process.argv.slice(2)
const rootAt = args.indexOf('--root')
const root = resolve(rootAt >= 0 ? args[rootAt + 1] : REPO)
const check = args.includes('--check')
const OUT = join(root, 'tmp', 'fixtures', 'ledger-fill')
const MANIFEST = join(OUT, 'manifest.json')

const MODEL = modelWithShared('reviewer-audit')
const sha = (s) => createHash('sha256').update(s).digest('hex')

const cleanText = () => renderTemplate(collectDocs().find((d) => d.kind === 'round-check'))
const skeleton = () => buildSkeleton({ model: MODEL, kind: 'round-check' })
const withRows = (rows) => mergeText(cleanText(), skeleton().headers, rows)

/** 把首格等于 key 的数据行替换成给定行 */
function replaceRow(text, key, line) {
  const lines = text.split('\n')
  const i = lines.findIndex((l) => l.startsWith('|') && splitKey(l) === key)
  if (i < 0) throw new Error(`找不到行 ${key}`)
  lines[i] = line
  return lines.join('\n')
}
const splitKey = (l) => (l.split('|')[1] ?? '').trim()

function round1() {
  return withRows(skeleton().rows)
}
function round2() {
  const { headers, rows } = skeleton()
  for (const r of rows) r[4] = '[人工] hit'
  return mergeText(cleanText(), headers, rows)
}
function round3() {
  const { headers, rows } = skeleton()
  rows[0][4] = '[人工] hit'
  rows[1][4] = '[人工] na'
  rows[1][6] = '不适用：本轮无答辩'
  rows[2][4] = '[人工] miss'
  rows[2][5] = '未通过：示例原因'
  return mergeText(cleanText(), headers, rows)
}
function badRow() {
  return replaceRow(round1(), '3', '| 3 | 少列 |')
}
function dupKey() {
  return replaceRow(round1(), '4', '| 3 | 重复键示例 | 判据 | 类型 | [待判] |  |  |  |')
}
function fenced() {
  return `${cleanText()}\n\n\`\`\`\n| 第 9 项 | 围栏内伪表格 | 判据 | 类型 | [待判] |  |  |  |\n\`\`\`\n`
}
function escapedPipe() {
  return replaceRow(round1(), '1', '| 1 | a \\| b | 判据1 | 可机判 | [待判] |  |  |  |')
}
function long() {
  const tpl = renderTemplate(collectDocs().find((d) => d.kind === 'delivery-audit'))
  const { headers, rows } = buildSkeleton({ model: MODEL, kind: 'delivery-audit' })
  const base = mergeText(tpl, headers, rows)
  const pad = Array.from({ length: 100 }, (_, i) => `- 附录占位 ${i + 1}：用于读取量基线，不参与结构校验。`).join('\n')
  return `${base}\n\n## 附录（读取量夹具）\n\n${pad}\n`
}

const FILES = {
  'clean/round-check.md': cleanText(),
  'round1/round-check.md': round1(),
  'round2/round-check.md': round2(),
  'round3/round-check.md': round3(),
  'long/delivery-audit.md': long(),
  'bad-row/round-check.md': badRow(),
  'dup-key/round-check.md': dupKey(),
  'fenced/round-check.md': fenced(),
  'crlf/round-check.md': cleanText().replace(/\n/g, '\r\n'),
  'bom/round-check.md': `\uFEFF${cleanText()}`,
  'escaped-pipe/round-check.md': escapedPipe(),
}

function scsVersion() {
  const r = spawnSync('scs --version', { encoding: 'utf8', shell: true })
  return r.status === 0 ? (r.stdout || '').trim() : 'unavailable'
}

function walk(dir, rel = '') {
  const out = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name
    if (e.isDirectory()) out.push(...walk(join(dir, e.name), r))
    else out.push(r)
  }
  return out.sort()
}

function main() {
  if (check) {
    if (!existsSync(MANIFEST)) { console.error(`缺 manifest：${MANIFEST}`); process.exit(1) }
    const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'))
    const bad = []
    for (const [rel, info] of Object.entries(manifest.files)) {
      const p = join(OUT, rel)
      if (!existsSync(p)) { bad.push(`${rel} 缺失`); continue }
      const buf = readFileSync(p)
      if (sha(buf) !== info.sha256 || buf.length !== info.bytes) bad.push(`${rel} sha256/字节数不一致`)
    }
    for (const rel of walk(OUT).filter((r) => r !== 'manifest.json')) {
      if (!(rel in manifest.files)) bad.push(`${rel} 不在 manifest`)
    }
    for (const b of bad) console.error(`[fixtures] ${b}`)
    if (bad.length) process.exit(1)
    console.log(`fixtures ok：${Object.keys(manifest.files).length} 份一致（scs ${manifest.scsVersion}）`)
    return
  }

  rmSync(OUT, { recursive: true, force: true })
  mkdirSync(OUT, { recursive: true })
  const files = {}
  for (const [rel, text] of Object.entries(FILES)) {
    const p = join(OUT, rel)
    mkdirSync(dirname(p), { recursive: true })
    writeFileSync(p, text, 'utf8')
    files[rel] = { sha256: sha(text), bytes: Buffer.byteLength(text) }
  }
  const manifest = {
    generatedAt: new Date().toISOString(),
    scsVersion: scsVersion(),
    note: 'T5 夹具冻结；历史 round-check 为 4 列旧格式（fill fail-closed），本集按 8 列 schema 重建。',
    files,
  }
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  console.log(`fixtures written：${Object.keys(files).length} 份 → ${OUT}`)
}

main()
