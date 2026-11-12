import test from 'node:test'
import assert from 'node:assert/strict'
import { expandModel } from '../source.mjs'
import { ReviewerModel, AuditorModel, RespondentModel } from '../types/derived.mjs'
import { validateModel } from '../types/index.mjs'

test('types/base：三席真实模型字段校验零错误', () => {
  assert.deepEqual(ReviewerModel.validate(expandModel('reviewer-backend')), [])
  assert.deepEqual(AuditorModel.validate(expandModel('reviewer-audit')), [])
  assert.deepEqual(RespondentModel.validate(expandModel('evidence-reader')), [])
})

test('types/base：defaultLanding 的 string|null 分支 + 缺失键 + 未知 modelType', () => {
  const m = structuredClone(expandModel('reviewer-backend'))
  assert.equal(m.defaultLanding, null)
  const badNull = { ...m, defaultLanding: 42 }
  assert.match(ReviewerModel.validate(badNull).join(';'), /TYPE:defaultLanding!=string\|null/)
  const missing = { ...m }
  delete missing.permissions
  assert.ok(ReviewerModel.validate(missing).includes('MISSING:permissions'))
  assert.ok(ReviewerModel.validate({ ...m, modelType: 'Bogus' }).includes('MODELTYPE_UNKNOWN:Bogus'))
})

test('types/base：Map/数组/可空对象的形状分支', () => {
  const m = structuredClone(expandModel('reviewer-backend'))
  assert.match(ReviewerModel.validate({ ...m, templates: { x: {} } }).join(';'), /templates\.x/)
  assert.match(ReviewerModel.validate({ ...m, must: [{}] }).join(';'), /must\[0\]/)
  assert.match(ReviewerModel.validate({ ...m, escalation: 'x' }).join(';'), /TYPE:escalation!=Escalation/)
})

test('types/derived：三个类的判别与专属约束', () => {
  const reviewer = { outputs: { items: [{ artifact: 'artifact.issueCard' }] }, predicates: { 'issue-without-solution': {} } }
  assert.equal(ReviewerModel.matches(reviewer), true)
  assert.deepEqual(ReviewerModel.extra(reviewer), [])

  const auditor = { outputs: { items: [{ artifact: 'artifact.roundCheck' }] }, records: { roundCheck: {} } }
  assert.equal(AuditorModel.matches(auditor), true)
  assert.deepEqual(AuditorModel.extra(auditor), [])

  const respondent = { outputs: { items: [{ artifact: 'artifact.factSummary' }] } }
  assert.equal(RespondentModel.matches(respondent), true)
  assert.deepEqual(RespondentModel.extra(respondent), [])
  assert.match(RespondentModel.extra({ outputs: { items: [{ artifact: 'artifact.issueCard' }] } }).join(';'), /CONFLICT:artifact\.issueCard/)
})

test('types/index：零命中 / 多命中 / 唯一命中', () => {
  assert.deepEqual(validateModel({ outputs: { items: [] } }), { type: null, errors: ['MODEL_TYPE_UNKNOWN'] })
  const conflict = validateModel({
    outputs: { items: [{ artifact: 'artifact.issueCard' }, { artifact: 'artifact.roundCheck' }] },
    predicates: { 'issue-without-solution': {} },
    records: { roundCheck: {} },
  })
  assert.equal(conflict.type, null)
  assert.match(conflict.errors[0], /MODEL_TYPE_CONFLICT:ReviewerModel,AuditorModel/)
  assert.equal(validateModel({
    outputs: { items: [{ artifact: 'artifact.roundCheck' }] },
    records: { roundCheck: {} },
  }).type, 'AuditorModel')
})
