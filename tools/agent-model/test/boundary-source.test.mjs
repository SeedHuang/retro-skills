import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderModel } from '../render/index.mjs'
import { renderBoundary } from '../../docgen/builders/agents/components/renderBoundary.mjs'
import { DEFAULT_BOUNDARY } from '../../docgen/builders/agents/components/patternRegistry.mjs'
import { TIERS } from '../../docgen/builders/agents/policy/definitions/tiers.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..', '..')
const MODELS = join(ROOT, 'tools', 'agent-model', 'models')
const shared = JSON.parse(readFileSync(join(MODELS, '_shared-model.json'), 'utf8'))
const seats = readdirSync(MODELS).filter((f) => f.endsWith('-model.json') && !f.startsWith('_'))
const bodyOf = (text) => {
  const i = text.indexOf('\n## 边界\n')
  return i < 0 ? '' : text.slice(i + '\n## 边界\n'.length).trim()
}
const cardBoundary = (seat) => {
  const p = join(ROOT, 'agents', `${seat}.md`)
  assert.ok(existsSync(p), `缺卡：agents/${seat}.md（先落卡再建模）`)
  return bodyOf(readFileSync(p, 'utf8'))
}
// 写落点 = 模型自己声明要写盘（artifact / 写白名单 / 默认落点 / 真写盘模式），与 SEAT_POLICY 的 capability 无关
const writes = (m) =>
  (m.seat.artifacts || []).length > 0 ||
  (m.permissions?.write?.allow || []).length > 0 ||
  Boolean(m.defaultLanding) ||
  m.duty?.action?.landingMode === 'file'
const models = seats.map((f) => ({ f, m: JSON.parse(readFileSync(join(MODELS, f), 'utf8')) }))

test('边界三形态：渲染正文必须等于声明来源（policy→renderBoundary / literal→text / default→DEFAULT_BOUNDARY）', () => {
  for (const { f, m } of models) {
    const seat = m.seat.id
    const rendered = bodyOf(renderModel(join(MODELS, f), shared).text)
    const expected = m.boundary.kind === 'policy'
      ? renderBoundary(seat)
      : m.boundary.kind === 'literal' ? m.boundary.text : DEFAULT_BOUNDARY
    assert.equal(rendered, expected.trim(), seat)
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
    assert.equal(cardBoundary(m.seat.id), DEFAULT_BOUNDARY, m.seat.id)
  }
})

test('模型不得声明 literal：手抄卡面散文不可核，等于用「不可测的散文」换「字节一致」', () => {
  for (const { m } of models) {
    assert.notEqual(m.boundary.kind, 'literal', `${m.seat.id} 用 literal 手抄卡面：请改为 policy（有写落点）或 default`)
  }
})
