// T5 夹具集：生成 / sha256 冻结比对 / 各夹具的关键结构属性。
// 对应 TC-01（clean）、TC-14/18/19/20/21（负例输入）、TC-16（long ≥100 行）。
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { modelWithShared } from '../../docgen/models/agents/source.mjs'
import { parseLedger } from '../lib/parse.mjs'
import { verifyLedger } from '../verify.mjs'

const SCRIPT = fileURLToPath(new URL('../scripts/make-fixtures.mjs', import.meta.url))
const RUNPILOT = fileURLToPath(new URL('../scripts/run-pilot.mjs', import.meta.url))
const MODEL = modelWithShared('reviewer-audit')

test('T5-01 生成夹具 + manifest，--check 冻结比对通过', () => {
  const root = mkdtempSync(join(tmpdir(), 'ledger-fixtures-'))
  try {
    const gen = spawnSync(process.execPath, [SCRIPT, '--root', root], { encoding: 'utf8' })
    assert.equal(gen.status, 0, gen.stderr)
    const out = join(root, 'tmp', 'fixtures', 'ledger-fill')
    const manifest = JSON.parse(readFileSync(join(out, 'manifest.json'), 'utf8'))
    assert.equal(Object.keys(manifest.files).length, 11)
    assert.ok(Object.keys(manifest.files).every((rel) => existsSync(join(out, rel))))

    const ok = spawnSync(process.execPath, [SCRIPT, '--root', root, '--check'], { encoding: 'utf8' })
    assert.equal(ok.status, 0, ok.stderr)

    // 试点产物写到 ledger-fill-pilot/，不得污染冻结集的 --check
    const pilot = spawnSync(process.execPath, [RUNPILOT, '--root', root], { encoding: 'utf8' })
    assert.equal(pilot.status, 0, pilot.stderr)
    const afterPilot = spawnSync(process.execPath, [SCRIPT, '--root', root, '--check'], { encoding: 'utf8' })
    assert.equal(afterPilot.status, 0, afterPilot.stderr)

    writeFileSync(join(out, 'clean/round-check.md'), 'tampered', 'utf8')
    const bad = spawnSync(process.execPath, [SCRIPT, '--root', root, '--check'], { encoding: 'utf8' })
    assert.notEqual(bad.status, 0)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('T5-02 夹具结构属性：clean / rounds / 负例 / long', () => {
  const root = mkdtempSync(join(tmpdir(), 'ledger-fixtures-'))
  try {
    const gen = spawnSync(process.execPath, [SCRIPT, '--root', root], { encoding: 'utf8' })
    assert.equal(gen.status, 0, gen.stderr)
    const out = join(root, 'tmp', 'fixtures', 'ledger-fill')
    const read = (rel) => readFileSync(join(out, rel), 'utf8')

    assert.equal(parseLedger(read('clean/round-check.md')).scanned, 0)
    assert.deepEqual(verifyLedger({ text: read('round2/round-check.md'), model: MODEL, kind: 'round-check' }).reds, [])
    assert.equal(parseLedger(read('bad-row/round-check.md')).skipped, 1)
    assert.ok(verifyLedger({ text: read('dup-key/round-check.md'), model: MODEL, kind: 'round-check' }).reds.some((r) => r.code === 'duplicate_keys'))
    assert.equal(parseLedger(read('fenced/round-check.md')).scanned, 0)
    assert.deepEqual(parseLedger(read('crlf/round-check.md')), parseLedger(read('clean/round-check.md')))
    assert.deepEqual(parseLedger(read('bom/round-check.md')), parseLedger(read('clean/round-check.md')))
    const escaped = parseLedger(read('escaped-pipe/round-check.md'))
    assert.equal(escaped.skipped, 0)
    assert.equal(escaped.rows[0].cells[1], 'a | b')
    assert.ok(read('long/delivery-audit.md').split('\n').length >= 100)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
