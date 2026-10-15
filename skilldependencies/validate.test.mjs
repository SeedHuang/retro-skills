import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, lstatSync } from 'node:fs'
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

// 技能目录判定：与 check-all.mjs / skill-inspector check.mjs 三处语义一致（两层 + 错误契约）。
// ① 目录层：isDirectory() 对 junction 返回 false → 天然跳过 ② 文件层：lstatSync 不跟随符号链接
// 错误契约：ENOENT 静默跳过；EACCES/ELOOP 等判定不了 → 抛（不静默当「不是技能目录」，否则该技能漏扫、测试假绿）
function isSkillDir(parent, name) {
  let st
  try {
    st = lstatSync(join(parent, name, 'SKILL.md'))
  } catch (e) {
    if (e.code === 'ENOENT') return false
    throw new Error(`读取 ${join(parent, name, 'SKILL.md')} 失败：${e.code || e.message}`)
  }
  return st.isFile()
}

test('skills/ 目录与 manifest 一一对应（防新增技能漏登记）', () => {
  const m = JSON.parse(readFileSync(join(here, 'manifest.json'), 'utf8'))
  const skillsDir = join(here, '..', 'skills')
  const dirs = readdirSync(skillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => isSkillDir(skillsDir, name))
    .sort()
  assert.deepEqual([...m.skills].sort(), dirs)
})
