import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readManifest } from 'file:///D:/Seed/agent-assets-sync/src/deps.mjs'
// 「什么算技能目录」判据的唯一真相源（另两处消费方：check-all.mjs / skill-inspector check.mjs。勿在本文件另写一份）
import { listSkillDirs } from '../scripts/skill-dir.mjs'

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

test('skills/ 目录与 manifest 一一对应（防新增技能漏登记）', () => {
  const m = JSON.parse(readFileSync(join(here, 'manifest.json'), 'utf8'))
  const skillsDir = join(here, '..', 'skills')
  // 技能目录判定：两层 + 错误契约全在 scripts/skill-dir.mjs（唯一真相源），本文件不另写
  const dirs = listSkillDirs(skillsDir).sort()
  assert.deepEqual([...m.skills].sort(), dirs)
})

// D2（spec §2 P-6）：依赖集合「恰为」parliament + prd-to-specs——多一个 / 少一个都红。
// 只靠 schema 校验守不住「该依赖哪两个」：把依赖删掉一个，上面三条依然全绿。
test('dev-workflow：依赖集合恰为 parliament + prd-to-specs', () => {
  const m = readManifest(join(here, 'dev-workflow.json'))
  const got = m.skills.map((s) => s.name).sort()
  assert.deepEqual(got, ['parliament', 'prd-to-specs'])
})
