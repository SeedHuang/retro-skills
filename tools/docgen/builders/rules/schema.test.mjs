import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { validate, RuleModel } from './schema.mjs'

const read = (p) => JSON.parse(readFileSync(join('tools', 'docgen', 'models', 'rules', p), 'utf8').replace(/^\uFEFF/, ''))
const validRule = () => read('evidence-before-conclusion.json')
const validTc = () => read('evidence-before-conclusion.testcase.json')

test('合法模型 + 合法 testcase → 0 条', () => {
  const r = validRule()
  assert.deepEqual(validate(r, { testcase: validTc(), ruleIds: new Set([r.id]) }), [])
})

test('无 testcase → 先跑 check，再追加 MissingTestcase', () => {
  const f = validate(validRule())
  assert.equal(f.length, 1)
  assert.equal(f[0].code, 'MissingTestcase')
})

test('缺 landing → Schema', () => {
  const r = validRule(); delete r.landing
  const f = validate(r, { testcase: validTc(), ruleIds: new Set([r.id]) })
  assert.ok(f.some((x) => x.code === 'Schema' && x.message.includes('缺字段 landing')))
})

test('非法 op → 恰 1 条 Schema', () => {
  const r = validRule()
  const idx = r.assert.findIndex((a) => a.op && !a.anyOf && !a.allOf && !a.not)
  // 原地只改这一条：整体替换 assert 会让 residual.fields 失去来源，额外冒出 FieldLabelMissing
  r.assert[idx] = { ...r.assert[idx], op: 'equals' }
  const f = validate(r, { testcase: { rule: r.id, cases: [{ input: {}, expect: 'pass' }, { input: {}, expect: 'fail' }] }, ruleIds: new Set([r.id]) })
  assert.equal(f.length, 1)
  assert.equal(f[0].code, 'Schema')
  assert.ok(f[0].message.includes('op 未注册'))
})

test('type 越界 → TypeInvalid', () => {
  const r = validRule(); r.type = '持续'
  const f = validate(r, { testcase: validTc(), ruleIds: new Set([r.id]) })
  assert.ok(f.some((x) => x.code === 'TypeInvalid'))
})

test('testcase 缺反例 → Testcase，message 含原文', () => {
  const r = validRule()
  const f = validate(r, { testcase: { rule: r.id, cases: [{ input: {}, expect: 'pass' }] }, ruleIds: new Set([r.id]) })
  assert.equal(f.length, 1)
  assert.equal(f[0].code, 'Testcase')
  assert.ok(f[0].message.includes('缺反例（防漏判无验证）'))
})

test('默认 ruleIds 不抛', () => {
  const r = validRule()
  const f = validate(r, { testcase: validTc() })
  assert.ok(Array.isArray(f))
  assert.ok(!f.some((x) => x.message.includes('引用的 rule 不存在')))
})

test('RuleModel 导出形状', () => {
  assert.equal(RuleModel.typeName, 'RuleModel')
  assert.equal(typeof RuleModel.validate, 'function')
  assert.deepEqual(RuleModel.fields, ['id', 'impl', 'type', 'scope', 'title', 'when', 'assert', 'residual', 'refs', 'landing'])
})
