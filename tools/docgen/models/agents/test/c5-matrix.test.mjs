import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { VALUE_CHECKS } from '../types/base.mjs'
import { ReviewerModel, AuditorModel, RespondentModel } from '../types/derived.mjs'
import { sections, makeHelpers } from '../render/sections.mjs'
import { renderModel } from '../render/index.mjs'
import { verify } from '../verify-models.mjs'
import { MODELS_DIR, modelWithShared } from '../source.mjs'

const shared = JSON.parse(readFileSync(join(MODELS_DIR, '_shared.json'), 'utf8'))
const M = modelWithShared('reviewer-audit')
const h = makeHelpers(M, shared)

// VALUE_CHECKS 每个值类型一条正例 + 一条反例
const P = {
  Seat: { id: 'x', display: 'X', triggers: [{ id: 't' }], description: { template: '{triggers}', joiner: '、', lastJoiner: '、' }, artifacts: [] },
  Trigger: { id: 't' },
  Timing: { scene: 's', moment: 'end', repeat: 'per-round' },
  Description: { template: 'x', joiner: '、', lastJoiner: '、' },
  Duty: { trigger: 't', action: {} },
  Checklist: { items: [{ no: 1, seatPrefix: 'x', category: 'y', criterion: 'z' }] },
  Criterion: { action: 'verify', mode: 'all', observable: [{ op: 'fieldNonEmpty', ofRef: 'r' }], negative: { input: {}, expect: 'fail', failsOn: 'x' }, residual: { who: 'x', sample: 1, fields: [], objective: { target: 'x', reason: 'y' } } },
  Observable: { op: 'fieldNonEmpty', ofRef: 'r' },
  Negative: { input: {}, expect: 'fail', failsOn: 'x' },
  Residual: { who: 'x', sample: 1, fields: [], objective: { target: 'x', reason: 'y' } },
  Objective: { target: 'x', reason: 'y' },
  Record: { label: 'x', unit: 'x', source: { kind: 'description', text: 'x' }, shape: [{ id: 'f', label: 'F', type: 'string', required: true }] },
  Field: { id: 'f', label: 'F', type: 'string', required: true },
  Source: { kind: 'description' },
  Form: { text: 'x', kind: 'artifact', path: 'x' },
  Template: { skill: 'x', label: 'x', columns: ['a'] },
  Outputs: { items: [{ phase: 'p', artifact: 'a', template: 't', action: 'append', mode: 'whole' }] },
  Permissions: { policy: {}, action: {}, write: {}, command: {} },
  Rule: { id: 'r', criterion: 'c', targets: [] },
  Predicate: { ok: 'x', bad: 'y', slots: [] },
  Escalation: { title: 'x', recipients: [], report: 'x', steps: [] },
}

test('C5 types/base：VALUE_CHECKS 每个类型正例 / 反例', () => {
  for (const [type, fn] of Object.entries(VALUE_CHECKS)) {
    assert.ok(P[type], `缺 ${type} 正例夹具`)
    assert.deepEqual(fn(P[type], 'p'), [], `${type} 正例应通过`)
    assert.ok(fn({}, 'p').length > 0, `${type} 空对象应报错`)
  }
})

test('C5 types/derived：extra 缺项与冲突', () => {
  assert.match(ReviewerModel.extra({ outputs: { items: [] } }).join(';'), /MISSING:predicates.issue-without-solution/)
  assert.match(AuditorModel.extra({ records: {} }).join(';'), /MISSING:records.roundCheck/)
  assert.match(RespondentModel.extra({ outputs: { items: [{ artifact: 'artifact.issueCard' }] } }).join(';'), /CONFLICT:artifact\.issueCard/)
  assert.equal(ReviewerModel.matches({ outputs: { items: [] } }), false)
  assert.equal(AuditorModel.matches({ outputs: { items: [] } }), false)
  assert.equal(RespondentModel.matches({ outputs: { items: [] } }), false)
})

test('C5 render/sections：renderObs 全部 op 输出非空', () => {
  const rec = Object.keys(M.records)[0]
  const field = M.records[rec].shape[0].id
  const arg = {
    ofRef: rec, field, left: field, right: field, value: 2, by: 'x', byLabel: 'X',
    pattern: 'x', hint: 'x', then: { op: 'fieldNonEmpty', ofRef: rec, field },
  }
  for (const op of Object.keys(h.OP)) {
    const s = h.renderObs({ ...arg, op })
    assert.equal(typeof s, 'string', `${op} 必须返回字符串`)
    assert.ok(s.length > 0, `${op} 输出不得为空`)
  }
})

test('C5 render/sections：renderRule ok / bad / guard 三态', () => {
  const rec = Object.keys(M.records)[0]
  const field = M.records[rec].shape[0].id
  const M2 = {
    ...M,
    predicates: {
      ...M.predicates,
      zz: {
        ok: '要求X', bad: '不得Y', slots: [{ op: 'fieldNonEmpty', ofRef: rec, field }],
        guard: { op: 'fieldNonEmpty', ofRef: rec, field },
      },
    },
  }
  const h2 = makeHelpers(M2, shared)
  assert.match(h2.renderRule({ criterion: 'zz', targets: [] }, true), /^要求要求X——/)
  assert.match(h2.renderRule({ criterion: 'zz', targets: [] }, true), /（和/)
  assert.match(h2.renderRule({ criterion: 'zz', targets: [] }, false), /^不得不得Y——/)
})

test('C5 render/sections：9+ 段函数均返回数组且必填段按 kind 非空', () => {
  for (const key of Object.keys(sections)) {
    const out = sections[key](M, shared, h)
    assert.ok(Array.isArray(out), `${key} 必须返回数组`)
    if (key === 'boundary') assert.deepEqual(out, [], 'policy 席不再输出「边界」段')
    else assert.ok(out.length > 0, `${key} 在 reviewer-audit（policy）上不得为空`)
  }
  const Md = modelWithShared('reviewer-product')
  const hd = makeHelpers(Md, shared)
  assert.deepEqual(sections.ban(Md, shared, hd), [], 'default 席不得输出「禁止事项」段')
  assert.ok(sections.boundary(Md, shared, hd).length > 0, 'default 席必须保留「边界」段')
})

test('C5 render/index：段装配顺序', () => {
  const text = renderModel(join(MODELS_DIR, 'reviewer-audit', 'index.json'), shared).text
  const order = ['## 职责', '## 一定会', '## 禁止', '## 冲突裁决', '## 本席清单', '## 权限', '## 禁止事项', '## 越界处置']
  const idx = order.map((x) => text.indexOf(x))
  assert.ok(idx.every((i) => i >= 0), `缺段：${order.filter((x, i) => idx[i] < 0).join(',')}`)
  assert.deepEqual(idx, [...idx].sort((a, b) => a - b), '段顺序必须按 TYPE_SECTIONS')
})

// verify 失败码矩阵：每条至少构造一个反例
function run(seat, mutate, { baseline = true, sh = shared } = {}) {
  const own = JSON.parse(readFileSync(join(MODELS_DIR, seat, 'index.json'), 'utf8'))
  mutate(own)
  const dir = mkdtempSync(join(tmpdir(), 'c5-'))
  const p = join(dir, `${seat}.json`)
  writeFileSync(p, JSON.stringify(own))
  try {
    return verify(seat, { modelPath: p, baseline, shared: sh })
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

test('C5 verify：baseline / record / path / skill / trigger / output 失败面', () => {
  assert.ok(run('reviewer-backend', (m) => {
    m.must = [{ id: 'zz', criterion: 'impartial-long-term', targets: [] }]
  }).errs.includes('must'))
  assert.ok(run('reviewer-backend', (m) => { delete m.records[Object.keys(m.records)[0]] }).errs.some((x) => x.startsWith('record-lost:')))
  assert.ok(run('reviewer-backend', (m) => {
    const k = Object.keys(m.records)[0]
    m.records[k] = { ...m.records[k], label: 'X' }
  }).errs.some((x) => x.startsWith('record-diff:')))
  assert.ok(run('reviewer-audit', (m) => { m.forms[Object.keys(m.forms)[0]].path = '/abs' }).pathBad.length > 0)
  assert.ok(run('reviewer-audit', (m) => { m.templates[Object.keys(m.templates)[0]].skill = 'no-such-skill' }).skillBad.length > 0)
  assert.ok(run('reviewer-backend', (m) => { m.seat.triggers[0].objects = ['no.such'] }).triggerBad.length > 0)
  assert.ok(run('reviewer-audit', (m) => { m.outputFormat.checks[0].text = 'x' }).outputTextHandwritten.length > 0)
})

test('C5 verify：权限 / 动作 / 落点 / 策略失败面', () => {
  assert.ok(run('reviewer-backend', (m) => {
    m.permissions.action.forbid.push(m.permissions.action.allow[0])
  }).actionConflict.length > 0)
  assert.ok(run('reviewer-backend', (m) => { m.permissions.action.allow.push('bogus') }).unknownAction.length > 0)
  assert.ok(run('reviewer-backend', (m) => { m.permissions.action.forbid.push('bogus') }).permOrphan.length > 0)
  assert.ok(run('reviewer-backend', (m) => { m.permissions.write.allow.push('artifact.ghost') }).ownFail.length > 0)
  assert.ok(run('reviewer-backend', (m) => {
    m.permissions.write.allow = ['artifact.issueCard']
    m.seat.artifacts = []
  }).writeScopeBad)
  assert.ok(run('reviewer-backend', (m) => {
    m.duty.action.landingMode = 'file'
    delete m.duty.action.landingLabel
  }).landingBad)
  assert.equal(run('speaker', (m) => { m.seat.artifacts = [] }).policyDiff, true)
})

test('C5 verify：PERM_UNOBSERVABLE（permissionGroup 无 signal / residual）', () => {
  const sh = structuredClone(shared)
  sh.permissionGroups = { ...sh.permissionGroups, bogus: { label: 'X' } }
  const r = run('reviewer-backend', (m) => { m.permissions.action.forbid.push('bogus') }, { sh })
  assert.ok(r.permUnobservable.includes('bogus'))
})
