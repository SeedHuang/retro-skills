#!/usr/bin/env node
// 新席骨架：--seat 写 jsons/_drafts/<name>/index.json；--promote 校验已登记后移入 jsons/<name>/
// 用法：--seat <名> | --promote <名>；--root <仓根>（测试用）
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync, rmSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(here, '..', '..', '..', '..', '..')
const args = process.argv.slice(2)
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null }
const root = resolve(val('--root') || REPO)
const engine = join(root, 'tools', 'docgen', 'models', 'agents')
const jsons = join(engine, 'jsons')
const drafts = join(jsons, '_drafts')
const NAME_RE = /^[a-z][a-z0-9-]{0,49}$/

const seat = val('--seat')
const promote = val('--promote')
if (!seat && !promote) { console.error('用法：--seat <名> | --promote <名> [--root <仓根>]'); process.exit(2) }

const name = seat || promote
if (!NAME_RE.test(name)) { console.error(`非法席名：${name}（小写字母开头，仅 a-z0-9-）`); process.exit(1) }

if (seat) {
  const draftDir = join(drafts, name)
  if (existsSync(join(jsons, name)) || existsSync(draftDir)) { console.error(`已存在：${name}（不覆盖）`); process.exit(1) }
  mkdirSync(draftDir, { recursive: true })
  const skeleton = {
    version: 2,
    id: name,
    extends: '_shared.json',
    seat: { id: name, display: '', triggers: [], artifacts: [], tier: '' },
  }
  writeFileSync(join(draftDir, 'index.json'), `${JSON.stringify(skeleton, null, 2)}\n`)
  console.log(`草稿已生成：jsons/_drafts/${name}/index.json（补全后跑 --promote ${name}）`)
  process.exit(0)
}

// --promote
const draftDir = join(drafts, name)
if (!existsSync(join(draftDir, 'index.json'))) { console.error(`草稿不存在：${draftDir}/index.json`); process.exit(1) }
const stamp = Date.now()
const src = await import(`${pathToFileURL(join(engine, 'source.mjs')).href}?t=${stamp}`)
if (!src.listSeats().includes(name)) {
  console.error(`未登记：先把 ${name} 加入 source.mjs 的 SEAT_ORDER 与 seat-policy.mjs 的 SEAT_POLICY，再 promote`)
  process.exit(1)
}
const policyPath = join(root, 'tools', 'docgen', 'builders', 'agents', 'policy', 'seat-policy.mjs')
const pol = await import(`${pathToFileURL(policyPath).href}?t=${stamp}`)
if (!pol.SEAT_POLICY || !Object.hasOwn(pol.SEAT_POLICY, name)) {
  console.error(`未登记：SEAT_POLICY 缺 ${name}，不 promote`)
  process.exit(1)
}
const dest = join(jsons, name)
if (existsSync(dest)) { console.error(`目标已存在：jsons/${name}`); process.exit(1) }
renameSync(draftDir, dest)
rmSync(drafts, { recursive: true, force: true })
console.log(`已移入：jsons/${name}/index.json；下一步跑 update-baseline --seat ${name}`)
