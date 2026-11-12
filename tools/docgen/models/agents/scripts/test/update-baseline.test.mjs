import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, cpSync, existsSync, readFileSync, writeFileSync, rmSync, statSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const HERE = dirname(fileURLToPath(import.meta.url))
const SRC = resolve(HERE, '..', '..', '..', '..', '..', '..')
const SCRIPT = resolve(HERE, '..', 'update-baseline.mjs')
const SEATS = ['reviewer-audit', 'senior-sdet']

function makeRoot() {
  const root = mkdtempSync(join(tmpdir(), 'ub-'))
  const jsons = join(root, 'tools', 'docgen', 'models', 'agents', 'jsons')
  mkdirSync(jsons, { recursive: true })
  const srcJsons = join(SRC, 'tools', 'docgen', 'models', 'agents', 'jsons')
  cpSync(join(srcJsons, '_shared.json'), join(jsons, '_shared.json'))
  for (const s of SEATS) cpSync(join(srcJsons, s), join(jsons, s), { recursive: true })
  return { root, jsons }
}
const run = (root, args) => spawnSync(process.execPath, [SCRIPT, '--root', root, ...args], { encoding: 'utf8' })
const hashOf = (p) => statSync(p).mtimeMs + ':' + readFileSync(p, 'utf8').length

test('--check --all：一致时 exit 0 且不写盘', () => {
  const { root, jsons } = makeRoot()
  try {
    const before = hashOf(join(jsons, 'reviewer-audit', '_baseline.json'))
    const r = run(root, ['--check', '--all'])
    assert.equal(r.status, 0, r.stderr)
    assert.equal(hashOf(join(jsons, 'reviewer-audit', '_baseline.json')), before)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('--check：手改基线后 exit 1 且不写盘', () => {
  const { root, jsons } = makeRoot()
  try {
    const p = join(jsons, 'reviewer-audit', '_baseline.json')
    const j = JSON.parse(readFileSync(p, 'utf8'))
    j.must = []
    writeFileSync(p, `${JSON.stringify(j, null, 2)}\n`)
    const before = readFileSync(p, 'utf8')
    const r = run(root, ['--check', '--all'])
    assert.equal(r.status, 1, r.stdout)
    assert.match(r.stderr, /reviewer-audit/)
    assert.equal(readFileSync(p, 'utf8'), before)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('--all：写盘后 --check 复验 exit 0', () => {
  const { root, jsons } = makeRoot()
  try {
    const p = join(jsons, 'senior-sdet', '_baseline.json')
    const j = JSON.parse(readFileSync(p, 'utf8'))
    j.must = []
    writeFileSync(p, `${JSON.stringify(j, null, 2)}\n`)
    assert.equal(run(root, ['--all']).status, 0)
    assert.equal(run(root, ['--check', '--all']).status, 0)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('--all 全成或全不成：一席非法则零写入', () => {
  const { root, jsons } = makeRoot()
  try {
    const a = join(jsons, 'reviewer-audit', '_baseline.json')
    const b = join(jsons, 'senior-sdet', '_baseline.json')
    const beforeA = hashOf(a)
    const beforeB = hashOf(b)
    writeFileSync(join(jsons, 'reviewer-audit', 'index.json'), '{ bad json')
    const r = run(root, ['--all'])
    assert.equal(r.status, 1)
    assert.equal(hashOf(a), beforeA)
    assert.equal(hashOf(b), beforeB)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('--seat：只写指定席，其它席不动', () => {
  const { root, jsons } = makeRoot()
  try {
    const p = join(jsons, 'senior-sdet', '_baseline.json')
    const j = JSON.parse(readFileSync(p, 'utf8'))
    j.must = []
    writeFileSync(p, `${JSON.stringify(j, null, 2)}\n`)
    const beforeB = readFileSync(p, 'utf8')
    assert.equal(run(root, ['--seat', 'reviewer-audit']).status, 0)
    assert.equal(readFileSync(p, 'utf8'), beforeB)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('--seat：席不存在 → exit 1 且零写入', () => {
  const { root, jsons } = makeRoot()
  try {
    const before = hashOf(join(jsons, 'reviewer-audit', '_baseline.json'))
    const r = run(root, ['--seat', 'no-such-seat'])
    assert.equal(r.status, 1)
    assert.equal(hashOf(join(jsons, 'reviewer-audit', '_baseline.json')), before)
  } finally { rmSync(root, { recursive: true, force: true }) }
})
