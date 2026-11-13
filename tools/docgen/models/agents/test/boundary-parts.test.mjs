import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { boundaryParts, renderBoundary } from '../../../builders/agents/components/renderBoundary.mjs'
import { modelWithShared, renderSeatText } from '../source.mjs'
import { splitSections } from '../../../../execution-matrix/check-agent.mjs'

// 三段化（2026-11-13）：golden 逐字节 + 标记剥离 + 块级映射 + 负例
const GOLDEN = JSON.parse(readFileSync(new URL('./fixtures/boundary-baseline.json', import.meta.url), 'utf8'))
const policySeats = Object.keys(GOLDEN)

test('renderBoundary：逐席与冻结 golden 逐字节相同（9 席）', () => {
  assert.equal(policySeats.length, 9, 'golden 必须恰好覆盖 9 个 policy 席')
  for (const seat of policySeats) {
    assert.equal(renderBoundary(seat, modelWithShared(seat)), GOLDEN[seat], seat)
  }
})

test('renderBoundary 不含标记；boundaryParts 三段齐全且非空', () => {
  for (const seat of policySeats) {
    const M = modelWithShared(seat)
    const text = renderBoundary(seat, M)
    assert.ok(!text.includes('<!--part:'), `${seat}: renderBoundary 残留分段标记`)
    assert.ok(!text.includes('{{'), `${seat}: renderBoundary 残留未替换槽`)
    const parts = boundaryParts(seat, M)
    assert.deepEqual(Object.keys(parts), ['authority', 'ban', 'aftermath'], `${seat}: 段序必须固定`)
    for (const [name, body] of Object.entries(parts)) {
      assert.ok(body.trim() !== '', `${seat}: part:${name} 不得为空`)
    }
  }
})

test('块级映射：渲染后卡面按标题切节，三段与 boundaryParts 精确一致', () => {
  const withSteps = policySeats.filter((seat) => (modelWithShared(seat).escalation?.steps?.length ?? 0) > 0)
  assert.equal(withSteps.length, 2, '当前模型应恰有 2 席带越界步骤')
  for (const seat of policySeats) {
    const M = modelWithShared(seat)
    const parts = boundaryParts(seat, M)
    const secs = splitSections(renderSeatText(seat))
    const at = (name) => secs.filter((s) => s.level === 2 && s.heading.trim() === name)
    const one = (name) => {
      assert.equal(at(name).length, 1, `${seat}: 「${name}」必须恰好 1 个`)
      return at(name)[0]
    }
    assert.equal(at('边界').length, 0, `${seat}: policy 卡不得保留「边界」节`)
    const perm = one('权限')
    const firstBullet = perm.lines.findIndex((l) => /^- /.test(l))
    assert.ok(firstBullet > 0, `${seat}: 权限段缺 authority 段或白名单 bullet`)
    assert.equal(perm.lines.slice(0, firstBullet).join('\n').trim(), parts.authority, `${seat}: authority 段不一致`)
    assert.equal(one('禁止事项').lines.join('\n').trim(), parts.ban, `${seat}: 禁止事项不一致`)
    const esc = one('越界处置')
    const steps = M.escalation?.steps?.length ?? 0
    for (let i = 0; i < steps; i += 1) assert.match(esc.lines[i], /^\d+\. /, `${seat}: 越界步骤 ${i + 1} 缺失`)
    assert.equal(esc.lines.slice(steps).join('\n').trim(), parts.aftermath, `${seat}: 越界处置后处理段不一致`)
  }
})

// 卡面结构断言（负例用同一判据直接判，不写盘）
function assertPolicyCard(text, seat) {
  const M = modelWithShared(seat)
  const parts = boundaryParts(seat, M)
  const secs = splitSections(text)
  const at = (name) => secs.filter((s) => s.level === 2 && s.heading.trim() === name)
  const one = (name) => {
    assert.equal(at(name).length, 1, `${seat}: 「${name}」必须恰好 1 个`)
    return at(name)[0]
  }
  assert.equal(at('边界').length, 0, `${seat}: policy 卡不得保留「边界」节`)
  const perm = one('权限')
  const firstBullet = perm.lines.findIndex((l) => /^- /.test(l))
  assert.ok(firstBullet >= 0, `${seat}: 权限段缺白名单 bullet`)
  assert.equal(perm.lines.slice(0, firstBullet).join('\n').trim(), parts.authority, `${seat}: authority 段被改动`)
  assert.equal(one('禁止事项').lines.join('\n').trim(), parts.ban, `${seat}: 禁止事项被改动`)
  const esc = one('越界处置')
  const steps = M.escalation?.steps?.length ?? 0
  for (let i = 0; i < steps; i += 1) assert.match(esc.lines[i], /^\d+\. /, `${seat}: 越界处置步骤缺失`)
  assert.equal(esc.lines.slice(steps).join('\n').trim(), parts.aftermath, `${seat}: 越界处置后处理段被改动`)
  const nonEmpty = perm.lines.map((l) => l.trim()).filter(Boolean)
  assert.equal(new Set(nonEmpty).size, nonEmpty.length, `${seat}: 权限段出现重复行`)
}

test('负例：policy 卡结构走样必须判红', () => {
  const seat = 'reviewer-audit'
  const base = renderSeatText(seat)
  assert.doesNotThrow(() => assertPolicyCard(base, seat), '基线卡必须判绿')

  const moveBanLineToAuthority = (text) => {
    const lines = text.split('\n')
    const i = lines.indexOf('**禁止写**：')
    assert.ok(i > 0)
    const [moved] = lines.splice(i + 1, 1)
    // 真正移入「权限」段：插在 authority 之后、第一条白名单 bullet 之前
    const perm = lines.indexOf('## 权限')
    const firstBullet = lines.findIndex((l, idx) => idx > perm && /^- /.test(l))
    assert.ok(perm >= 0 && firstBullet > perm)
    lines.splice(firstBullet, 0, moved)
    return lines.join('\n')
  }
  const dropBlankBeforeDefaultDeny = (text) => {
    const lines = text.split('\n')
    const i = lines.indexOf('**命令默认拒绝**：')
    assert.ok(i > 0 && lines[i - 1] === '')
    lines.splice(i - 1, 1)
    return lines.join('\n')
  }
  const duplicateCommand = (text) => {
    const lines = text.split('\n')
    const i = lines.indexOf('- 跑命令：只许跑')
    assert.ok(i >= 0)
    assert.match(lines[i + 1], /^  - /)
    lines.splice(i + 1, 0, lines[i + 1])
    return lines.join('\n')
  }
  const keepBoundary = (text) => `${text}\n## 边界\n旧边界。\n`

  const cases = {
    '禁止写首行挪到 authority 末尾': moveBanLineToAuthority,
    '删除禁止命令与命令默认拒绝之间的空行': dropBlankBeforeDefaultDeny,
    '重复一行命令': duplicateCommand,
    'policy 卡保留 ## 边界': keepBoundary,
  }
  for (const [name, mutate] of Object.entries(cases)) {
    assert.throws(() => assertPolicyCard(mutate(base), seat), `${name} 必须判红`)
  }
})
