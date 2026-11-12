import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const HERE = dirname(fileURLToPath(import.meta.url))
const SRC = resolve(HERE, '..', '..', '..', '..', '..', '..')
const SCRIPT = join(SRC, 'skills', 'agent-modeling', 'scripts', 'verify.mjs')
const IDX = join(SRC, 'tools', 'docgen', 'models', 'agents', 'jsons', 'reviewer-actuary', 'index.json')

const run = (args, cwd = SRC) => spawnSync(process.execPath, [SCRIPT, ...args], { cwd, encoding: 'utf8' })

test('index.json 输入：席名取父目录，判 EQUIVALENT', () => {
  const r = run([IDX])
  assert.equal(r.status, 0, r.stderr)
  assert.match(r.stdout, /^reviewer-actuary .*EQUIVALENT/)
})

test('草稿 -model.json：席名按后缀剥离，仍判 EQUIVALENT', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sv-'))
  try {
    const p = join(dir, 'reviewer-actuary-model.json')
    writeFileSync(p, readFileSync(IDX, 'utf8'))
    const r = run([p])
    assert.equal(r.status, 0, r.stderr)
    assert.match(r.stdout, /^reviewer-actuary .*EQUIVALENT/)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('缺基线：默认 exit 1（不得静默 CHECKS_PASS）', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sv-'))
  try {
    const p = join(dir, 'zzz-draft-model.json')
    writeFileSync(p, readFileSync(IDX, 'utf8'))
    const r = run([p])
    assert.equal(r.status, 1)
    assert.match(r.stderr, /缺基线/)
    assert.doesNotMatch(r.stdout, /CHECKS_PASS/)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('缺基线 + --allow-no-baseline：不再报「缺基线」', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sv-'))
  try {
    const p = join(dir, 'zzz-draft-model.json')
    writeFileSync(p, readFileSync(IDX, 'utf8'))
    const r = run([p, '--allow-no-baseline'])
    assert.doesNotMatch(r.stderr, /缺基线/)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
