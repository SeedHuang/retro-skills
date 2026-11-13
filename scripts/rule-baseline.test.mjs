import test from 'node:test'
import assert from 'node:assert/strict'
import { toRecords, buildManifest } from './rule-baseline.mjs'

const REPORT = {
  files: [{
    name: 'evidence-before-conclusion.md',
    total: 13,
    max: 23,
    rate: 0.5652173913043478,
    level: '不及格',
    findings: [{ group: '头部规范', check: '来源行三字段（类型/日期/落地）', msg: 'x', recipe: 'y' }],
  }],
}

test('toRecords：10 字段与 reds', () => {
  const [r] = toRecords(REPORT, { exitCode: 0, scsVersion: '0.1.0', nodeVersion: 'v24.22.2', annotationsSha256: 'ABC' })
  assert.deepEqual(Object.keys(r).sort(), [
    'annotationsSha256', 'exitCode', 'level', 'max', 'nodeVersion', 'rate', 'reds', 'ruleId', 'score', 'scsVersion',
  ])
  assert.equal(r.ruleId, 'evidence-before-conclusion')
  assert.equal(r.score, 13)
  assert.equal(r.max, 23)
  assert.deepEqual(r.reds, ['头部规范/来源行三字段（类型/日期/落地）'])
})

test('buildManifest：三数组 + env', () => {
  const m = buildManifest({
    gitSha: 'abc', rules: [{ path: 'rules/a.md', sha: '1' }],
    builders: [{ path: 'builders/rules/b.md', sha: '2' }],
    env: { DOCGEN_RULES_DIR: '' },
  })
  assert.equal(m.gitSha, 'abc')
  assert.deepEqual(m.rulesSha256, [{ path: 'rules/a.md', sha: '1' }])
  assert.deepEqual(m.buildersSha256, [{ path: 'builders/rules/b.md', sha: '2' }])
  assert.equal(m.env.DOCGEN_RULES_DIR, '')
})
