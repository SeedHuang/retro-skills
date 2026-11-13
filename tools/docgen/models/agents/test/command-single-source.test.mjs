import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { modelWithShared } from '../source.mjs'
import { commandGroupsOfModel, renderBoundary } from '../../../builders/agents/components/renderBoundary.mjs'
import { SEAT_POLICY } from '../../../builders/agents/policy/seat-policy.mjs'

// 单源守卫（2026-11-13）：边界的「允许组」必须由模型 `permissions.command.allow` 反推，
// 且与 `SEAT_POLICY.allowGroups` 一致——两处漂移时本测试先红，避免卡面声明与授权清单互相矛盾。
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..')
const MODELS = join(ROOT, 'tools', 'docgen', 'models', 'agents', 'jsons')
const seats = readdirSync(MODELS, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
  .map((e) => e.name)
  .filter((seat) => modelWithShared(seat).boundary?.kind === 'policy')

const sorted = (xs) => [...new Set(xs)].sort()

test('边界允许组 == 模型命令反推组 == 策略 allowGroups（逐席集合相等）', () => {
  assert.ok(seats.length > 0, '没有 policy 席，测试失去判别力')
  for (const seat of seats) {
    const m = modelWithShared(seat)
    const derived = commandGroupsOfModel(m)
    const policy = SEAT_POLICY[seat]?.allowGroups ?? SEAT_POLICY.__default__.allowGroups
    assert.deepEqual(sorted(derived), sorted(policy), `${seat}：模型命令反推组与策略 allowGroups 不一致`)
  }
})

test('检测限度只引用本席已授权的 git status；无授权则明写无命令', () => {
  for (const seat of seats) {
    const m = modelWithShared(seat)
    const text = renderBoundary(seat, m)
    const hasStatus = (m.permissions?.command?.allow ?? []).includes('cmd.git.status')
    if (hasStatus) {
      assert.match(text, /`git --no-optional-locks status --porcelain` 只能看 tracked 工作区。/, seat)
      assert.ok(!text.includes('本席未授任何命令'), `${seat}：已授权 git status 却写成无命令`)
    } else {
      assert.ok(text.includes('本席未授任何命令，无法读取 tracked 工作区。'), `${seat}：未授权 git status 却引用该命令`)
    }
  }
})
