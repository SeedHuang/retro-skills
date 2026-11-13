import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { modelWithShared } from '../source.mjs'
import { renderBan, renderAftermath } from '../../../builders/agents/components/renderBoundary.mjs'
import { DEFAULT_BOUNDARY } from '../../../builders/agents/components/patternRegistry.mjs'
import { TIERS } from '../../../builders/agents/policy/definitions/tiers.mjs'
import { splitSections } from '../../../../execution-matrix/check-agent.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..', '..', '..', '..')
const MODELS = join(ROOT, 'tools', 'docgen', 'models', 'agents', 'jsons')
const shared = JSON.parse(readFileSync(join(MODELS, '_shared.json'), 'utf8'))
const seats = readdirSync(MODELS, { withFileTypes: true }).filter((e) => e.isDirectory() && !e.name.startsWith('_')).map((e) => e.name)

function cardSections(seat) {
  const p = join(ROOT, 'agents', `${seat}.md`)
  assert.ok(existsSync(p), `缺卡：agents/${seat}.md（先落卡再建模）`)
  return splitSections(readFileSync(p, 'utf8'))
}
function headingSection(secs, name) {
  const hit = secs.filter((s) => s.level === 2 && s.heading.trim() === name)
  assert.equal(hit.length, 1, `「${name}」节必须恰好 1 个`)
  return hit[0]
}
const bodyText = (s) => s.lines.join('\n').trim()

// 写落点 = 模型自己声明要写盘（artifact / 写白名单 / 默认落点 / 真写盘模式），与 SEAT_POLICY 的 capability 无关
const writes = (m) =>
  (m.seat.artifacts || []).length > 0 ||
  (m.permissions?.write?.allow || []).length > 0 ||
  Boolean(m.defaultLanding) ||
  m.duty?.action?.landingMode === 'file'
const models = seats.map((f) => ({ f, m: JSON.parse(readFileSync(join(MODELS, f, 'index.json'), 'utf8')) }))

test('边界来源（policy）：卡面「禁止事项」== renderBan，「越界处置」== 模型步骤 + renderAftermath，且无「边界」节', () => {
  for (const { m } of models) {
    if (m.boundary.kind !== 'policy') continue
    const seat = m.seat.id
    const secs = cardSections(seat)
    assert.equal(secs.filter((s) => s.level === 2 && s.heading.trim() === '边界').length, 0, `${seat}: policy 卡不得保留「边界」节`)
    assert.equal(bodyText(headingSection(secs, '禁止事项')), renderBan(seat, modelWithShared(seat)), seat)
    const esc = headingSection(secs, '越界处置')
    const steps = m.escalation?.steps?.length ?? 0
    for (let i = 0; i < steps; i += 1) assert.match(esc.lines[i], /^\d+\. /, `${seat}: 第 ${i + 1} 步缺失`)
    assert.equal(esc.lines.slice(steps).join('\n').trim(), renderAftermath(seat, modelWithShared(seat)), seat)
  }
})

test('边界来源（default / literal）：卡面「边界」正文 == 声明来源，且无「禁止事项」/「越界处置」节', () => {
  for (const { m } of models) {
    const kind = m.boundary.kind
    if (kind !== 'default' && kind !== 'literal') continue
    const seat = m.seat.id
    const secs = cardSections(seat)
    const expected = kind === 'literal' ? m.boundary.text.trim() : DEFAULT_BOUNDARY
    assert.equal(bodyText(headingSection(secs, '边界')), expected, seat)
    assert.equal(secs.filter((s) => s.level === 2 && s.heading.trim() === '禁止事项').length, 0, seat)
    assert.equal(secs.filter((s) => s.level === 2 && s.heading.trim() === '越界处置').length, 0, seat)
  }
})

test('有写落点的席必须 policy 派生，且档位必须含 Write', () => {
  for (const { m } of models) {
    if (!writes(m)) continue
    assert.equal(m.boundary.kind, 'policy', `${m.seat.id} 声明写落点，边界必须 policy，不得 literal/default`)
    assert.ok((TIERS[m.seat.tier] || []).includes('Write'), `${m.seat.id} 声明写落点但档位 ${m.seat.tier} 不含 Write`)
  }
})

test('无写落点的席必须 default，且卡面边界恰为 DEFAULT_BOUNDARY', () => {
  for (const { m } of models) {
    if (writes(m)) continue
    assert.equal(m.boundary.kind, 'default', `${m.seat.id} 无写落点，边界必须 default（只能由常量派生）`)
    assert.equal(bodyText(headingSection(cardSections(m.seat.id), '边界')), DEFAULT_BOUNDARY, m.seat.id)
  }
})

test('模型不得声明 literal：手抄卡面散文不可核，等于用「不可测的散文」换「字节一致」', () => {
  for (const { m } of models) {
    assert.notEqual(m.boundary.kind, 'literal', `${m.seat.id} 用 literal 手抄卡面：请改为 policy（有写落点）或 default`)
  }
})
