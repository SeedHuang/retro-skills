// Task 5（F-04 / spec R13 / §3.7）：`skill-dir.mjs` 单源——恰 1 份，禁止第二份实现。
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { scanSkillDirSources } from './check-skill-dir-single-source.mjs'

const mk = (files) => {
  const root = mkdtempSync(join(tmpdir(), 'sd-'))
  for (const [p, t] of Object.entries(files)) {
    mkdirSync(join(root, p, '..'), { recursive: true })
    writeFileSync(join(root, p), t)
  }
  return root
}

test('只有单源 + 允许的兜底 → 0', () => {
  const root = mk({
    'scripts/skill-dir.mjs': 'export function listSkillDirs() {}',
    'skills/skill-inspector/scripts/check.mjs': 'export function listSkillDirsFallback() {}',
  })
  assert.deepEqual(scanSkillDirSources({ repoRoot: root }), [])
})

test('第二份 skill-dir.mjs → 命中', () => {
  const root = mk({
    'scripts/skill-dir.mjs': 'export function listSkillDirs() {}',
    'skills/other/scripts/skill-dir.mjs': 'export function listSkillDirs() {}',
  })
  assert.equal(scanSkillDirSources({ repoRoot: root }).length, 1)
})

test('第二个 listSkillDirs 实现 → 命中', () => {
  const root = mk({
    'scripts/skill-dir.mjs': 'export function listSkillDirs() {}',
    'skills/other/scripts/x.mjs': 'export function listSkillDirs() {}',
  })
  assert.equal(scanSkillDirSources({ repoRoot: root }).length, 1)
})
