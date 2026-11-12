import test from 'node:test'
import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ENGINE = resolve(HERE, '..')
const REPO = resolve(HERE, '..', '..', '..', '..', '..')
const AGENTS_BUILD = join(REPO, 'tools', 'docgen', 'builders', 'agents')

test('TC-030 仓外副本 → SKILLS_ROOT_UNRESOLVED（不伪装成 SKILL_MISSING）', () => {
  const dir = mkdtempSync(join(tmpdir(), 'am-outside-'))
  try {
    cpSync(ENGINE, join(dir, 'tools', 'docgen', 'models', 'agents'), { recursive: true })
    for (const sub of ['policy', 'components']) {
      cpSync(join(AGENTS_BUILD, sub), join(dir, 'tools', 'docgen', 'builders', 'agents', sub), { recursive: true })
    }
    const env = { ...process.env }
    delete env.MODEL_SKILLS_ROOT
    const r = spawnSync(process.execPath, [join(dir, 'tools', 'docgen', 'models', 'agents', 'verify-models.mjs'), 'reviewer-actuary'], { encoding: 'utf8', env })
    assert.equal(r.status, 1, r.stdout + r.stderr)
    assert.match(r.stderr, /SKILLS_ROOT_UNRESOLVED/)
    assert.doesNotMatch(r.stdout, /SKILL_MISSING/, '仓根缺失不得伪装成技能名配错')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
