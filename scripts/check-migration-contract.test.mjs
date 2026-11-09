// Task 6（F-04 / spec §3.7 / R8 / R13）：迁移契约守卫。
// ① 迁移前基线必须存在且两个 CLI 入口齐全（防「先删旧脚本再补基线」）；
// ② 「旧路径 → 新命令」映射表三行齐全且含契约列；
// ③ 旧脚本与其测试必须已删除、skill-dir 单源门禁通过。
import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { scanSkillDirSources } from './check-skill-dir-single-source.mjs'

const BASE = 'docs/devworkflows/20261109211349-script-layer-refactor/migration-baseline.json'
const MAP = 'docs/devworkflows/20261109211349-script-layer-refactor/migration-map.md'

test('F-04 迁移前基线存在且两个 CLI 入口齐全', () => {
  assert.ok(existsSync(BASE), '缺 migration-baseline.json')
  const j = JSON.parse(readFileSync(BASE, 'utf8'))
  assert.equal(j.entries.length, 2)
  for (const e of j.entries) {
    for (const k of ['oldCommand', 'sample', 'exit', 'stdoutFirst', 'stdoutLast', 'codes']) assert.ok(k in e, `缺 ${k}`)
  }
  // sample 一律记项目根（spec §3.7），旧命令的 --dir 由 <sample>/skills 拼出
  for (const e of j.entries) assert.equal(e.sample, '.')
})

test('F-04 映射表三行齐全且含契约列', () => {
  const t = readFileSync(MAP, 'utf8')
  for (const s of ['skill-inspector', 'rule-inspector', 'skill-dir']) assert.match(t, new RegExp(s))
  assert.match(t, /契约/)
})

test('F-04 旧脚本与随源测试已删除，用户面改指新命令', () => {
  for (const p of [
    'skills/skill-inspector/scripts/check.mjs',
    'skills/skill-inspector/scripts/check.test.mjs',
    'skills/rule-inspector/scripts/score.mjs',
    'skills/rule-inspector/scripts/score.test.mjs',
  ]) assert.equal(existsSync(p), false, `${p} 应已删除（spec §3.7）`)
  for (const p of ['skills/skill-inspector/SKILL.md', 'skills/rule-inspector/SKILL.md']) {
    const t = readFileSync(p, 'utf8')
    assert.match(t, /scs check (skills|rules)/, `${p} 未改指新命令`)
  }
})

test('F-04 skill-dir 单源门禁通过（兜底副本随旧脚本删除）', () => {
  assert.deepEqual(scanSkillDirSources({ repoRoot: process.cwd() }), [])
})
