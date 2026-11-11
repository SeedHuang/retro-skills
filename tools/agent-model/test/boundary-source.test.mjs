import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderModel } from '../render/index.mjs'
import { renderBoundary } from '../../docgen/builders/agents/components/renderBoundary.mjs'
import { DEFAULT_BOUNDARY } from '../../docgen/builders/agents/components/patternRegistry.mjs'
import { SEAT_POLICY } from '../../docgen/builders/agents/policy/seat-policy.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..', '..')
const MODELS = join(ROOT, 'tools', 'agent-model', 'models')
const shared = JSON.parse(readFileSync(join(MODELS, '_shared-model.json'), 'utf8'))
const seats = readdirSync(MODELS).filter((f) => f.endsWith('-model.json') && !f.startsWith('_'))
const bodyOf = (text) => {
  const i = text.indexOf('\n## 边界\n')
  return i < 0 ? '' : text.slice(i + '\n## 边界\n'.length).trim()
}
const cardBoundary = (seat) => bodyOf(readFileSync(join(ROOT, 'agents', `${seat}.md`), 'utf8'))

test('边界三形态：渲染正文必须等于声明来源（policy→renderBoundary / literal→text / default→DEFAULT_BOUNDARY）', () => {
  for (const f of seats) {
    const m = JSON.parse(readFileSync(join(MODELS, f), 'utf8'))
    const seat = m.seat.id
    const rendered = bodyOf(renderModel(join(MODELS, f), shared).text)
    const expected = m.boundary.kind === 'policy'
      ? renderBoundary(seat)
      : m.boundary.kind === 'literal' ? m.boundary.text : DEFAULT_BOUNDARY
    assert.equal(rendered, expected.trim(), seat)
  }
})

test('有写权限且卡面边界非默认句的席，必须用 policy 派生，不得手抄卡面', () => {
  for (const f of seats) {
    const m = JSON.parse(readFileSync(join(MODELS, f), 'utf8'))
    const seat = m.seat.id
    const p = Object.hasOwn(SEAT_POLICY, seat) ? SEAT_POLICY[seat] : null
    const mustPolicy = p && p.capabilities.includes('write') && cardBoundary(seat) !== DEFAULT_BOUNDARY
    if (mustPolicy) assert.equal(m.boundary.kind, 'policy', `${seat} 必须 policy，不得 literal/default`)
  }
})

test('default 只用于卡面边界恰为 DEFAULT_BOUNDARY 的席', () => {
  for (const f of seats) {
    const m = JSON.parse(readFileSync(join(MODELS, f), 'utf8'))
    if (m.boundary.kind !== 'default') continue
    assert.equal(cardBoundary(m.seat.id), DEFAULT_BOUNDARY, m.seat.id)
  }
})
