// Task 1（F-01 / spec §3.1）：命令组 `layer` + 五码校验。
// 报码优先级在此冻结（testcase §7 缺口 5）：Missing → Invalid → Mixed → Empty → Duplicated。
import test from 'node:test'
import assert from 'node:assert/strict'
import { LAYERS, commandGroups, validateCommandLayers } from '../policy/definitions/commands.mjs'
import { exitCodeFor } from '../components/validateAgentData.mjs'

test('F-01 四组 layer 合法且一组一层', () => {
  assert.deepEqual(Object.keys(commandGroups).sort(), ['docgen.read', 'git.read', 'repo.check', 'tool.time'])
  for (const [g, v] of Object.entries(commandGroups)) assert.ok(LAYERS.includes(v.layer), `${g}: ${v.layer}`)
})

test('F-01 四组 verb 条数 4 / 1 / 5 / 4，总数 14，无 check.local', () => {
  assert.deepEqual(
    ['repo.check', 'tool.time', 'git.read', 'docgen.read'].map((g) => commandGroups[g].verbs.length),
    [4, 1, 5, 4],
  )
  assert.equal(Object.values(commandGroups).reduce((n, g) => n + g.verbs.length, 0), 14) // counter-probe: off 本字面量是允许命令总数（14 条），不是席位数
  assert.equal(commandGroups['check.local'], undefined)
})

test('缺 layer → GroupLayerMissing', () => {
  assert.throws(() => validateCommandLayers({ a: { verbs: ['x'] } }), (e) => e.code === 'GroupLayerMissing')
})

test('非法 layer → GroupLayerInvalid', () => {
  assert.throws(() => validateCommandLayers({ a: { layer: 'prod', verbs: ['x'] } }), (e) => e.code === 'GroupLayerInvalid')
})

test('同组两 layer → GroupMixedLayer', () => {
  assert.throws(() => validateCommandLayers({ a: { layer: ['dev', 'run'], verbs: ['x'] } }), (e) => e.code === 'GroupMixedLayer')
})

test('空 verbs → GroupEmpty', () => {
  assert.throws(() => validateCommandLayers({ a: { layer: 'run', verbs: [] } }), (e) => e.code === 'GroupEmpty')
})

test('verb 跨组 → VerbDuplicated', () => {
  assert.throws(() => validateCommandLayers({
    a: { layer: 'run', verbs: ['git status'] },
    b: { layer: 'dev', verbs: ['git status'] },
  }), (e) => e.code === 'VerbDuplicated')
})

test('R12 verbs 仍是字符串', () => {
  for (const g of Object.values(commandGroups)) for (const v of g.verbs) assert.equal(typeof v, 'string')
})

test('报码优先级冻结：Missing > Invalid > Mixed > Empty > Duplicated', () => {
  // 组序反着放：先把 Invalid / Empty / 重复排在前面，仍应先报 Missing
  assert.throws(() => validateCommandLayers({
    a: { layer: 'prod', verbs: ['x'] },
    b: { layer: 'run', verbs: [] },
    c: { verbs: ['y'] },
  }), (e) => e.code === 'GroupLayerMissing')
  assert.throws(() => validateCommandLayers({
    a: { layer: 'run', verbs: [] },
    b: { layer: ['dev', 'run'], verbs: ['y'] },
    c: { layer: 'prod', verbs: ['z'] },
  }), (e) => e.code === 'GroupLayerInvalid')
  assert.throws(() => validateCommandLayers({
    a: { layer: 'run', verbs: [] },
    b: { layer: ['dev', 'run'], verbs: ['y'] },
  }), (e) => e.code === 'GroupMixedLayer')
})

test('TC-006 六个新码全部登记为 exit 1', () => {
  for (const code of ['GroupLayerMissing', 'GroupLayerInvalid', 'GroupMixedLayer', 'GroupEmpty',
    'VerbDuplicated', 'NonRunGroupGranted']) {
    assert.equal(exitCodeFor(code), 1, `${code} 未登记进 EXIT 表`)
  }
})
