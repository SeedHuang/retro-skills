import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync, rmSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const HERE = dirname(fileURLToPath(import.meta.url))
const SCRIPT = resolve(HERE, '..', 'scaffold-seat.mjs')

function makeRoot() {
  const root = mkdtempSync(join(tmpdir(), 'sc-'))
  const engine = join(root, 'tools', 'docgen', 'models', 'agents')
  const jsons = join(engine, 'jsons')
  mkdirSync(jsons, { recursive: true })
  mkdirSync(join(root, 'tools', 'docgen', 'builders', 'agents', 'policy'), { recursive: true })
  writeFileSync(join(engine, 'source.mjs'), "export const SEAT_ORDER = ['base-seat']\nexport function listSeats() { return [...SEAT_ORDER] }\n")
  writeFileSync(join(root, 'tools', 'docgen', 'builders', 'agents', 'policy', 'seat-policy.mjs'), "export const SEAT_POLICY = { 'base-seat': {} }\n")
  writeFileSync(join(jsons, '_shared.json'), '{}\n')
  return { root, engine, jsons }
}
const run = (root, args) => spawnSync(process.execPath, [SCRIPT, '--root', root, ...args], { encoding: 'utf8' })

test('--seat：只写 _drafts，不落 jsons 顶层', () => {
  const { root, jsons } = makeRoot()
  try {
    const r = run(root, ['--seat', 'demo'])
    assert.equal(r.status, 0, r.stderr)
    assert.ok(existsSync(join(jsons, '_drafts', 'demo', 'index.json')))
    assert.ok(!existsSync(join(jsons, 'demo')))
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('--seat：已存在则拒绝，不覆盖', () => {
  const { root, jsons } = makeRoot()
  try {
    assert.equal(run(root, ['--seat', 'demo']).status, 0)
    const p = join(jsons, '_drafts', 'demo', 'index.json')
    const before = readFileSync(p, 'utf8')
    const r = run(root, ['--seat', 'demo'])
    assert.notEqual(r.status, 0)
    assert.equal(readFileSync(p, 'utf8'), before)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('--seat：非法席名非零退出', () => {
  const { root } = makeRoot()
  try {
    assert.notEqual(run(root, ['--seat', 'Bad_Name']).status, 0)
    assert.notEqual(run(root, ['--seat', '_lead']).status, 0)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('--promote：未登记不动文件', () => {
  const { root, jsons } = makeRoot()
  try {
    assert.equal(run(root, ['--seat', 'demo']).status, 0)
    const r = run(root, ['--promote', 'demo'])
    assert.notEqual(r.status, 0)
    assert.match(r.stderr, /未登记/)
    assert.ok(existsSync(join(jsons, '_drafts', 'demo', 'index.json')))
    assert.ok(!existsSync(join(jsons, 'demo')))
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('--promote：登记后移入 jsons 并清 draft', () => {
  const { root, engine, jsons } = makeRoot()
  try {
    assert.equal(run(root, ['--seat', 'demo']).status, 0)
    writeFileSync(join(engine, 'source.mjs'), "export const SEAT_ORDER = ['base-seat', 'demo']\nexport function listSeats() { return [...SEAT_ORDER] }\n")
    writeFileSync(join(root, 'tools', 'docgen', 'builders', 'agents', 'policy', 'seat-policy.mjs'), "export const SEAT_POLICY = { 'base-seat': {}, demo: {} }\n")
    const r = run(root, ['--promote', 'demo'])
    assert.equal(r.status, 0, r.stderr)
    assert.ok(existsSync(join(jsons, 'demo', 'index.json')))
    assert.ok(!existsSync(join(jsons, '_drafts', 'demo')))
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('--promote：session 目标已存在则拒绝', () => {
  const { root, engine, jsons } = makeRoot()
  try {
    assert.equal(run(root, ['--seat', 'demo']).status, 0)
    writeFileSync(join(engine, 'source.mjs'), "export const SEAT_ORDER = ['base-seat', 'demo']\nexport function listSeats() { return [...SEAT_ORDER] }\n")
    writeFileSync(join(root, 'tools', 'docgen', 'builders', 'agents', 'policy', 'seat-policy.mjs'), "export const SEAT_POLICY = { 'base-seat': {}, demo: {} }\n")
    mkdirSync(join(jsons, 'demo'), { recursive: true })
    assert.notEqual(run(root, ['--promote', 'demo']).status, 0)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('--promote：无草稿 → exit 1，不创建目标', () => {
  const { root, jsons } = makeRoot()
  try {
    const r = run(root, ['--promote', 'ghost'])
    assert.equal(r.status, 1)
    assert.match(r.stderr, /草稿不存在/)
    assert.ok(!existsSync(join(jsons, 'ghost')))
  } finally { rmSync(root, { recursive: true, force: true }) }
})
