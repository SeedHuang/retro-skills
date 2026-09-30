import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readManifest } from 'file:///D:/Seed/agent-assets-sync/src/deps.mjs'

const here = dirname(fileURLToPath(import.meta.url))

test('manifest.json：skills 列表与文件一一对应', () => {
  const m = JSON.parse(readFileSync(join(here, 'manifest.json'), 'utf8'))
  const files = readdirSync(here).filter((f) => f.endsWith('.json') && f !== 'manifest.json').map((f) => f.replace(/\.json$/, '')).sort()
  assert.deepEqual([...m.skills].sort(), files)
})

test('每个技能清单：schema 合法且 skill 名 = 文件名', () => {
  const files = readdirSync(here).filter((f) => f.endsWith('.json') && f !== 'manifest.json')
  for (const f of files) {
    const m = readManifest(join(here, f))
    assert.equal(m.skill, f.replace(/\.json$/, ''))
  }
})

test('每个技能清单：跨技能依赖都在本套件内', () => {
  const m = JSON.parse(readFileSync(join(here, 'manifest.json'), 'utf8'))
  const known = new Set(m.skills)
  const files = readdirSync(here).filter((f) => f.endsWith('.json') && f !== 'manifest.json')
  for (const f of files) {
    const man = readManifest(join(here, f))
    for (const d of man.skills) assert.equal(known.has(d.name), true, `${f} 依赖了套件外的 ${d.name}`)
  }
})
