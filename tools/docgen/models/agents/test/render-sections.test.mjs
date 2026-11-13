import test from 'node:test'
import assert from 'node:assert/strict'
import { renderModel, typeOf } from '../render/index.mjs'
import { sections, makeHelpers } from '../render/sections.mjs'
import { MODELS_DIR, listSeats, modelWithShared, renderSeatText } from '../source.mjs'
import { join } from 'node:path'
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'

const shared = JSON.parse(readFileSync(join(MODELS_DIR, '_shared.json'), 'utf8'))

test('render/index：typeOf 优先显式 modelType；非法显式值不静默兜底', () => {
  assert.equal(typeOf({ modelType: 'ReviewerModel' }), 'ReviewerModel')
  assert.equal(typeOf({ modelType: 'Bogus' }), null)
  assert.equal(typeOf({ outputs: { items: [{ artifact: 'artifact.roundCheck' }] } }), 'AuditorModel')
})

test('render/index：18 席模型全出卡，无空标题，两次渲染同字节', () => {
  for (const seat of listSeats()) {
    const p = join(MODELS_DIR, seat, 'index.json')
    const a = renderModel(p, shared)
    const b = renderModel(p, shared)
    assert.equal(a.text, b.text, `${seat}: 两次渲染必须同字节`)
    assert.ok(a.lines > 0, `${seat}: 不得空卡`)
    assert.ok(!/^##\s*$/m.test(a.text), `${seat}: 不得出现空标题`)
  }
})

test('render/sections：空段一律返回 []（不留空标题）', () => {
  assert.deepEqual(sections.must({ must: [] }, shared, {}), [])
  assert.deepEqual(sections.never({ never: [] }, shared, {}), [])
  assert.deepEqual(sections.outputs({ outputs: { items: [] } }, shared, {}), [])
  assert.deepEqual(sections.outputFormat({ outputFormat: null }, shared, {}), [])
  assert.deepEqual(sections.escalation({ escalation: null }, shared, {}), [])
})

test('render/sections：escalation 按 boundary.kind 分型（default + null → []，policy + null → 越界处置）', () => {
  assert.deepEqual(sections.escalation({ escalation: null, boundary: { kind: 'default' } }, shared, {}), [])
  const out = sections.escalation({
    escalation: null,
    boundary: { kind: 'policy' },
    seat: { id: 'reviewer-audit' },
  }, shared, {})
  assert.equal(out[0], '## 越界处置')
})

test('render/sections：本席清单表头逐字含模型声明的三态取值', () => {
  for (const seat of listSeats()) {
    const M = modelWithShared(seat)
    const h = makeHelpers(M, shared)
    const lines = sections.checklist(M, shared, h)
    const head = lines.find((l) => l.trim().startsWith('|'))
    const enumText = M.verdicts.enum.map((x) => `${x.id}（${x.label}）`).join('、')
    assert.ok(head.includes(`判定取值：${enumText}`), `${seat}: 表头缺判定取值`)
  }
})

test('render/index：显式非法 modelType → 抛 MODELTYPE_UNKNOWN', () => {
  const seat = listSeats()[0]
  const own = JSON.parse(readFileSync(join(MODELS_DIR, seat, 'index.json'), 'utf8'))
  own.modelType = 'Bogus'
  const dir = mkdtempSync(join(tmpdir(), 'model-type-'))
  const p = join(dir, `${seat}.json`)
  writeFileSync(p, JSON.stringify(own))
  try {
    assert.throws(() => renderModel(p, shared), /MODELTYPE_UNKNOWN:Bogus/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
