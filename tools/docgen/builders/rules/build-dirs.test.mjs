import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'

const REPO = process.cwd()
const BUILD = join(REPO, 'tools', 'docgen', 'builders', 'rules', 'build.mjs')
const RULE = {
  id: 'fixture-rule', impl: 'script', type: '持续适用', scope: 'global',
  title: '夹具判据', when: { field: 'g', op: 'eq', value: true },
  assert: [{ label: '断言值', field: 'v', op: 'eq', value: 1, probe: { kind: 'manual' } }],
  residual: { who: 'rule-writer', sample: 1, objectivePath: 'tmp/x.json' },
  refs: [], landing: 'tmp/x.md',
}
const TC = { rule: 'fixture-rule', cases: [{ input: { g: true, v: 1 }, expect: 'pass' }, { input: { g: true, v: 0 }, expect: 'fail' }] }

function dataDir({ withRules = true, withTc = true } = {}) {
  const d = mkdtempSync(join(tmpdir(), 'rule-dirs-'))
  writeFileSync(join(d, 'fixture-rule.json'), JSON.stringify(RULE))
  if (withTc) writeFileSync(join(d, 'fixture-rule.testcase.json'), JSON.stringify(TC))
  if (withRules) writeFileSync(join(d, 'rules.json'), JSON.stringify({ rules: ['fixture-rule'] }))
  return d
}
const run = (args) => spawnSync(process.execPath, [BUILD, ...args], { cwd: REPO, encoding: 'utf8' })

test('缺 testcase → exit 1 + 判据无 testcase', () => {
  const d = dataDir({ withTc: false })
  const r = run(['--data-dir', d])
  assert.equal(r.status, 1)
  assert.match(r.stdout, /判据无 testcase/)
  rmSync(d, { recursive: true, force: true })
})

test('缺 rules.json → exit 2 + InvalidInputPath', () => {
  const d = dataDir({ withRules: false })
  const r = run(['--data-dir', d])
  assert.equal(r.status, 2)
  assert.match(r.stderr, /InvalidInputPath:/)
  assert.match(r.stderr, /rules\.json/)
  rmSync(d, { recursive: true, force: true })
})

test('未知旗标 → exit 2 + InvalidArgs', () => {
  const d = dataDir()
  const r = run(['--data-dir', d, '--bogus'])
  assert.equal(r.status, 2)
  assert.match(r.stderr, /InvalidArgs:/)
  rmSync(d, { recursive: true, force: true })
})

test('三目录：自动建 out/rules，只写临时目录', () => {
  const d = dataDir()
  const out = join(d, 'out')
  const rules = join(d, 'rules')
  const r = run(['--data-dir', d, '--out-dir', out, '--rules-dir', rules])
  assert.equal(r.status, 0, r.stdout + r.stderr)
  assert.ok(existsSync(join(out, 'fixture-rule.md')))
  assert.ok(existsSync(join(rules, 'fixture-rule.md')))
  assert.ok(readFileSync(join(rules, 'fixture-rule.md'), 'utf8').includes('夹具判据'))
  rmSync(d, { recursive: true, force: true })
})
