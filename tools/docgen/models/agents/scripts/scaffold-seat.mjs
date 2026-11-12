#!/usr/bin/env node
// 新席骨架：在 git 分支上直接写 jsons/<name>/index.json（不设草稿/暂存目录）
// 前置：<name> 已登记到 source.mjs 的 SEAT_ORDER 与 seat-policy.mjs 的 SEAT_POLICY
// 用法：--seat <名> [--root <仓根>]（--root 仅测试用）
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(here, '..', '..', '..', '..', '..')
const args = process.argv.slice(2)
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null }
const root = resolve(val('--root') || REPO)
const engine = join(root, 'tools', 'docgen', 'models', 'agents')
const jsons = join(engine, 'jsons')
const NAME_RE = /^[a-z][a-z0-9-]{0,49}$/

const name = val('--seat')
if (!name) { console.error('用法：--seat <名> [--root <仓根>]'); process.exit(2) }
if (!NAME_RE.test(name)) { console.error(`非法席名：${name}（小写字母开头，仅 a-z0-9-）`); process.exit(1) }
if (existsSync(join(jsons, name))) { console.error(`已存在：jsons/${name}（不覆盖）`); process.exit(1) }

const stamp = Date.now()
const src = await import(`${pathToFileURL(join(engine, 'source.mjs')).href}?t=${stamp}`)
if (!src.listSeats().includes(name)) {
  console.error(`未登记：先把 ${name} 加入 source.mjs 的 SEAT_ORDER 与 seat-policy.mjs 的 SEAT_POLICY（建议在新分支上做）`)
  process.exit(1)
}
const policyPath = join(root, 'tools', 'docgen', 'builders', 'agents', 'policy', 'seat-policy.mjs')
const pol = await import(`${pathToFileURL(policyPath).href}?t=${stamp}`)
if (!pol.SEAT_POLICY || !Object.hasOwn(pol.SEAT_POLICY, name)) {
  console.error(`未登记：SEAT_POLICY 缺 ${name}，不创建`)
  process.exit(1)
}

const skeleton = {
  version: 2,
  id: name,
  extends: '_shared.json',
  seat: { id: name, display: '', triggers: [], artifacts: [], tier: '' },
}
mkdirSync(join(jsons, name), { recursive: true })
writeFileSync(join(jsons, name, 'index.json'), `${JSON.stringify(skeleton, null, 2)}\n`)
console.log(`已创建：jsons/${name}/index.json；下一步补全模型并跑 update-baseline --seat ${name}`)
