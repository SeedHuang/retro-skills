import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync, rmSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const HERE = dirname(fileURLToPath(import.meta.url))
const SCRIPT = resolve(HERE, '..', 'scaffold-seat.mjs')

function makeRoot(seats = ['base-seat']) {
  const root = mkdtempSync(join(tmpdir(), 'sc-'))
  const engine = join(root, 'tools', 'docgen', 'models', 'agents')
  const jsons = join(engine, 'jsons')
  mkdirSync(jsons, { recursive: true })
  mkdirSync(join(root, 'tools', 'docgen', 'builders', 'agents', 'policy'), { recursive: true })
  const arr = seats.map((s) => `'${s}'`).join(', ')
  writeFileSync(join(engine, 'source.mjs'), `export const SEAT_ORDER = [${arr}]\nexport function listSeats() { return [...SEAT_ORDER] }\n`)
  const pol = seats.map((s) => `'${s}': {}`).join(', ')
  writeFileSync(join(root, 'tools', 'docgen', 'builders', 'agents', 'policy', 'seat-policy.mjs'), `export const SEAT_POLICY = { ${pol} }\n`)
  writeFileSync(join(jsons, '_shared.json'), '{}\n')
  return { root, engine, jsons }
}
const run = (root, args) => spawnSync(process.execPath, [SCRIPT, '--root', root, ...args], { encoding: 'utf8' })

test('已登记席：直接写 jsons/<name>/index.json', () => {
  const { root, jsons } = makeRoot(['base-seat', 'demo'])
  try {
    const r = run(root, ['--seat', 'demo'])
    assert.equal(r.status, 0, r.stderr)
    assert.ok(existsSync(join(jsons, 'demo', 'index.json')))
    assert.ok(!existsSync(join(jsons, '_drafts')))
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('未登记席：拒绝且不建目录', () => {
  const { root, jsons } = makeRoot()
  try {
    const r = run(root, ['--seat', 'demo'])
    assert.equal(r.status, 1)
    assert.match(r.stderr, /未登记/)
    assert.ok(!existsSync(join(jsons, 'demo')))
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('已存在：拒绝且不覆盖', () => {
  const { root, jsons } = makeRoot(['base-seat', 'demo'])
  try {
    assert.equal(run(root, ['--seat', 'demo']).status, 0)
    const p = join(jsons, 'demo', 'index.json')
    const before = readFileSync(p, 'utf8')
    assert.notEqual(run(root, ['--seat', 'demo']).status, 0)
    assert.equal(readFileSync(p, 'utf8'), before)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('非法席名：非零退出', () => {
  const { root } = makeRoot()
  try {
    assert.notEqual(run(root, ['--seat', 'Bad_Name']).status, 0)
    assert.notEqual(run(root, ['--seat', '_lead']).status, 0)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('缺参数：exit 2', () => {
  const { root } = makeRoot()
  try {
    assert.equal(run(root, []).status, 2)
  } finally { rmSync(root, { recursive: true, force: true }) }
})
