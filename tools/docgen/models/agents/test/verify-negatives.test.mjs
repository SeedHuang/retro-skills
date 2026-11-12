import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { verify, anyError } from '../verify-models.mjs'
import { MODELS_DIR, listSeats } from '../source.mjs'

const shared = JSON.parse(readFileSync(join(MODELS_DIR, '_shared.json'), 'utf8'))

function run(seat, mutate, sharedOverride = shared) {
  const own = JSON.parse(readFileSync(join(MODELS_DIR, seat, 'index.json'), 'utf8'))
  mutate(own)
  const dir = mkdtempSync(join(tmpdir(), 'model-neg-'))
  const p = join(dir, `${seat}.json`)
  writeFileSync(p, JSON.stringify(own))
  try {
    return verify(seat, { modelPath: p, baseline: false, shared: sharedOverride })
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

test('verify：18 席真实模型全无错误码', () => {
  for (const seat of listSeats()) assert.equal(Boolean(anyError(verify(seat))), false, seat)
})

test('verify：TIER_MISMATCH / BOUNDARY_KIND_UNKNOWN', () => {
  assert.match(run('reviewer-backend', (m) => { m.seat.tier = 'bogus' }).tierBad, /TIER_MISMATCH/)
  assert.match(run('reviewer-backend', (m) => { m.boundary = { kind: 'x' } }).boundaryBad, /BOUNDARY_KIND_UNKNOWN/)
})

test('verify：WRITE_TIER_MISMATCH / OUTPUT_UNWRITABLE', () => {
  // policy 档位仍是 readOnly，却声明写落点 → 空头承诺
  const writeTier = run('reviewer-backend', (m) => {
    m.seat.artifacts = ['artifact.issueCard']
    m.permissions.write.allow = ['artifact.issueCard']
  })
  assert.match(writeTier.writeTierBad, /WRITE_TIER_MISMATCH/)
  assert.deepEqual(run('speaker', (m) => { m.outputs.items[0].artifact = 'artifact.ghost' }).outputUnwritable, ['artifact.ghost'])
})

test('verify：ACTION_MISMATCH / TITLE_DRIFT', () => {
  const action = run('reviewer-backend', (m) => {
    const k = Object.keys(m.checkCriteria)[0]
    m.checkCriteria[k] = { ...m.checkCriteria[k], action: 'recount' }
  })
  assert.equal(action.actionBad.length, 1)

  const title = run('reviewer-backend', (m) => {
    m.predicates.zz = { ok: '可复算', bad: 'bad', slots: [{ op: 'fieldNonEmpty', ofRef: 'records.roundCheck' }] }
  })
  assert.ok(title.titleDrifts.some((x) => x.startsWith('zz.ok')), title.titleDrifts.join(';'))
})

test('verify：ISSUE_RULE_ON_NON_ISSUER（共享规则错发给出问题卡之外的席）', () => {
  const s = structuredClone(shared)
  s.rules.must.push({
    id: 'leak.issue', criterion: 'x', text: 'x', appliesWhen: ['evidence-reader'], targets: [{ object: 'issue.card.foo' }],
  })
  const r = run('evidence-reader', () => {}, s)
  assert.ok(r.cardRuleLeak.includes('leak.issue'), r.cardRuleLeak.join(';'))
})

test('verify：TYPE_CONFLICT / TYPE_UNKNOWN', () => {
  assert.match(run('reviewer-audit', (m) => { m.modelType = 'ReviewerModel' }).typeErr, /TYPE_CONFLICT/)
  assert.match(run('reviewer-backend', (m) => { m.modelType = 'Bogus' }).typeErr, /TYPE_UNKNOWN:Bogus/)
})
