// P2 四维评估「评分链路」复现守卫：基线 d678028（11-11）/ 样本 fa67454（11-12）。
// 不复跑 LLM 作答；只验证 84 轮固定样本 → 评分 → aggregate-v2.csv 的链路。
import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const SCRIPT = fileURLToPath(new URL('./reproduce-p2-eval.mjs', import.meta.url))

test('P2 四维评分链路可复现（baseline d678028 / archive fa67454）', () => {
  const r = spawnSync(process.execPath, [SCRIPT], { encoding: 'utf8', timeout: 120000 })
  assert.equal(r.status, 0, r.stdout + r.stderr)
  assert.match(r.stdout, /baseline d678028 \/ archive fa67454/)
  assert.match(r.stdout, /aggregate-v2\.csv 一致/)
})
