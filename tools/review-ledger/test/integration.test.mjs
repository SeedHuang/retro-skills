// T6 集成：clean → fill → query → verify → 人工补齐 → verify 全绿 → 重跑幂等；
// 负例夹具（bad-row / fenced / crlf / bom / escaped-pipe）直接作为 query/verify 输入。
import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { parseLedger } from '../lib/parse.mjs'

const SCRIPT = fileURLToPath(new URL('../scripts/make-fixtures.mjs', import.meta.url))
const FILL = fileURLToPath(new URL('../fill.mjs', import.meta.url))
const QUERY = fileURLToPath(new URL('../query.mjs', import.meta.url))
const VERIFY = fileURLToPath(new URL('../verify.mjs', import.meta.url))
const run = (script, args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' })
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex')
const CMD = 'audit.spot=node -e "console.log(\'ok\')"'

let ROOT
let FIX

before(() => {
  ROOT = mkdtempSync(join(tmpdir(), 'ledger-integration-'))
  const gen = run(SCRIPT, ['--root', ROOT])
  assert.equal(gen.status, 0, gen.stderr)
  FIX = join(ROOT, 'tmp', 'fixtures', 'ledger-fill')
})

after(() => rmSync(ROOT, { recursive: true, force: true }))

function pendingToHit(text) {
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('|') || !lines[i].includes('[待判]')) continue
    lines[i] = lines[i].replace('[待判]', '[人工] hit')
  }
  return lines.join('\n')
}

test('T6-01 clean → fill → query → verify → 人工补齐 → 全绿 → 重跑幂等', () => {
  const dir = join(ROOT, 'reviews', 'round1')
  mkdirSync(dir, { recursive: true })
  const file = join(dir, 'round-check.md')
  copyFileSync(join(FIX, 'clean', 'round-check.md'), file)

  const fillArgs = ['--seat', 'reviewer-audit', '--dir', dir, '--phase', '每轮', '--command', CMD, '--apply']
  const f1 = run(FILL, fillArgs)
  assert.equal(f1.status, 0, f1.stderr)
  const text = readFileSync(file, 'utf8')
  assert.equal(parseLedger(text).rows.length, 8)

  const idx = run(QUERY, ['index', file, '--kind', 'round-check'])
  assert.equal(idx.status, 0, idx.stderr)
  assert.deepEqual(JSON.parse(idx.stdout).rows.map((r) => r.key), ['1', '2', '3', '4', '5', '6', '7', '8'])

  const v1 = run(VERIFY, [file, '--kind', 'round-check', '--seat', 'reviewer-audit'])
  assert.notEqual(v1.status, 0)
  const reds1 = JSON.parse(v1.stdout).reds
  assert.equal(reds1.filter((r) => r.code === 'pending_unfilled').length, 7)

  const show = run(QUERY, ['show', file, '--kind', 'round-check', '--row', '第 1 项'])
  assert.equal(JSON.parse(show.stdout).matches[0].line, parseLedger(text).rows[0].line)

  writeFileSync(file, pendingToHit(text), 'utf8')
  const v2 = run(VERIFY, [file, '--kind', 'round-check', '--seat', 'reviewer-audit'])
  assert.equal(v2.status, 0, v2.stdout + v2.stderr)
  assert.deepEqual(JSON.parse(v2.stdout).reds, [])

  const before = sha(file)
  const f2 = run(FILL, fillArgs)
  assert.equal(f2.status, 0, f2.stderr)
  assert.equal(sha(file), before)
})

test('T6-02 坏行夹具：query / verify 均 exit 1', () => {
  const bad = join(FIX, 'bad-row', 'round-check.md')
  const q = run(QUERY, ['show', bad, '--kind', 'round-check', '--row', '1'])
  assert.notEqual(q.status, 0)
  assert.equal(JSON.parse(q.stdout).skipped, 1)
  const v = run(VERIFY, [bad, '--kind', 'round-check', '--seat', 'reviewer-audit'])
  assert.notEqual(v.status, 0)
  assert.ok(JSON.parse(v.stdout).reds.some((r) => r.code === 'parse_failed'))
})

test('T6-03 CRLF / BOM / 围栏 / 转义竖线作为查询输入', () => {
  const indexOf = (rel) => JSON.parse(run(QUERY, ['index', join(FIX, rel), '--kind', 'round-check']).stdout)
  const clean = JSON.stringify(indexOf('clean/round-check.md'))
  assert.equal(JSON.stringify(indexOf('crlf/round-check.md')), clean)
  assert.equal(JSON.stringify(indexOf('bom/round-check.md')), clean)

  const fenced = run(QUERY, ['show', join(FIX, 'fenced/round-check.md'), '--kind', 'round-check', '--row', '第 9 项'])
  assert.equal(fenced.status, 0, fenced.stderr)
  assert.equal(JSON.parse(fenced.stdout).hits, 0)

  const esc = run(QUERY, ['show', join(FIX, 'escaped-pipe/round-check.md'), '--kind', 'round-check', '--row', '1', '--fields', 'item'])
  assert.equal(JSON.parse(esc.stdout).matches[0].row.item, 'a | b')
})
