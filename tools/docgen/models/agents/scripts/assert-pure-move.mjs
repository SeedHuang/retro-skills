#!/usr/bin/env node
// 纯搬迁校验：当前 jsons/<seat>/{index,_baseline}.json 与 <base> 的旧 blob 只允许 extends 一处差异。
// 用法：--base <git ref>（默认 restructure-base）
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const here = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(here, '..', '..', '..', '..', '..')
const args = process.argv.slice(2)
const val = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : d }
const base = val('--base', 'restructure-base')
const root = resolve(val('--root', REPO))
const jsons = join(root, 'tools', 'docgen', 'models', 'agents', 'jsons')

const norm = (s) => s.replaceAll('"_shared-model.json"', '"_shared.json"').replace(/\r?\n$/, '')
const blob = (p) => {
  try { return execFileSync('git', ['-C', root, 'cat-file', 'blob', `${base}:${p}`]).toString('utf8') } catch { return null }
}
const diffs = []
const cmp = (oldPath, newPath, label) => {
  const old = blob(oldPath)
  if (old === null) { diffs.push(`${label}: 旧 blob 缺失 ${oldPath}`); return }
  if (!existsSync(newPath)) { diffs.push(`${label}: 新文件缺失 ${newPath}`); return }
  if (norm(old) !== norm(readFileSync(newPath, 'utf8'))) diffs.push(`${label}: 内容不等`)
}

const seats = readdirSync(jsons, { withFileTypes: true }).filter((e) => e.isDirectory() && !e.name.startsWith('_')).map((e) => e.name).sort()
for (const seat of seats) {
  cmp(`tools/agent-model/models/${seat}-model.json`, join(jsons, seat, 'index.json'), `${seat} index`)
  cmp(`tools/agent-model/models/_baseline/${seat}.json`, join(jsons, seat, '_baseline.json'), `${seat} baseline`)
}
cmp('tools/agent-model/models/_shared-model.json', join(jsons, '_shared.json'), 'shared')

if (diffs.length) { console.error(diffs.join('\n')); process.exit(1) }
console.log(`assert-pure-move: ${seats.length} 席 + shared 均为纯搬迁（仅 extends 替换）`)
