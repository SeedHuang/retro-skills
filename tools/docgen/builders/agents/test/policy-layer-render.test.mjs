// Task 2（F-01 / spec §3.2 / §3.3）：卡面只渲染 run 组、席位配非 run 组即抛错、新门禁扫描卡面。
import test from 'node:test'
import assert from 'node:assert/strict'
import { allowGroups } from '../components/renderBoundary.mjs'
import { validateSeatLayers } from '../components/validatePolicy.mjs'
import { scanCards } from '../../../../../scripts/check-command-layer.mjs'

test('F-01 卡面只渲染 run 组', () => {
  const out = allowGroups(['git.read', 'tool.time'], 'reviewer-audit')
  assert.match(out, /git\.read/)
  assert.match(out, /tool\.time/)
  assert.doesNotMatch(out, /repo\.check|docgen\.read/)
})

test('F-01 混入非 run 组时渲染器只过滤、不判错', () => {
  const out = allowGroups(['git.read', 'docgen.read', 'repo.check'])
  assert.match(out, /git\.read/)
  assert.doesNotMatch(out, /docgen\.read|repo\.check/)
})

test('配非 run 组 → validateSeatLayers 报 NonRunGroupGranted', () => {
  assert.throws(() => validateSeatLayers({ x: { allowGroups: ['git.read', 'docgen.read'] } }), (e) =>
    e.code === 'NonRunGroupGranted' && /x:docgen\.read/.test(e.message))
})

test('配 dev 组同样报 NonRunGroupGranted', () => {
  assert.throws(() => validateSeatLayers({ x: { allowGroups: ['repo.check'] } }), (e) => e.code === 'NonRunGroupGranted')
})

test('真实席位配置只配 run 组 → 不抛', () => {
  assert.doesNotThrow(() => validateSeatLayers())
})

test('新门禁：卡面出现非 run 组即命中', () => {
  const groups = { 'git.read': { layer: 'run' }, 'repo.check': { layer: 'dev' } }
  assert.deepEqual(scanCards({ 'a.md': '只跑 `git.read`' }, groups), [])
  assert.deepEqual(scanCards({ 'a.md': '只跑 `repo.check`' }, groups), ['a.md: repo.check'])
})
