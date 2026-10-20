// review-ledger-gate.test.mjs —— review-ledger-gate.mjs 的回归测试
// 为什么要有它：gate 是「收尾拦坏账」的机器闸门，含 5 处正则/分支；无测试则任何重构都可能静默放过坏账。
// 用例覆盖：好样本 / 留空 / 只填一端 / 裸单时间点（2026-10-20 病根变体）/ 耗时留空 / 未取数 / 装饰 / 表头缺失 / 轮次数不符。

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const script = fileURLToPath(new URL('./review-ledger-gate.mjs', import.meta.url))

function run(content) {
  const dir = mkdtempSync(join(tmpdir(), 'rl-gate-'))
  const file = join(dir, 'progress.md')
  writeFileSync(file, content, 'utf8')
  const r = spawnSync(process.execPath, [script, file], { encoding: 'utf8' })
  rmSync(dir, { recursive: true, force: true })
  return { code: r.status, out: r.stdout, err: r.stderr }
}

// 直接以 CLI 参数形式调用（无参数 / 文件不存在等非 content 输入）
function runCli(args) {
  const r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' })
  return { code: r.status, out: r.stdout, err: r.stderr }
}

const tpl = rows => `# 样本\n\n## 轮次账\n\n| 轮 | 起止（HH:MM:SS） | 耗时 | 席位 | 本轮核销 |\n|---|---|---|---|---|\n${rows.join('\n')}\n`

test('完整起止对 + 耗时 → exit 0', () => {
  const { code, out } = run(tpl(['| 1 | 14:00:00~14:10:00 | 10m | 后端 | ✅ |']))
  assert.equal(code, 0)
  assert.match(out, /轮次账完整性：1 行全过/)
})

test('HH:MM 短格式起止对 → exit 0', () => {
  const { code } = run(tpl(['| 1 | 14:00~14:10 | 10m | 后端 | ✅ |']))
  assert.equal(code, 0)
})

test('起止列留空 → exit 1', () => {
  const { code, out } = run(tpl(['| 1 |  | 10m | 后端 | ✅ |']))
  assert.equal(code, 1)
  assert.match(out, /起止列留空/)
})

test('耗时列留空 → exit 1', () => {
  const { code, out } = run(tpl(['| 1 | 14:00~14:10 |  | 后端 | ✅ |']))
  assert.equal(code, 1)
  assert.match(out, /耗时列留空/)
})

test('只填一端「13:41~」→ exit 1', () => {
  const { code, out } = run(tpl(['| 1 | 13:41~ | 10m | 后端 | ✅ |']))
  assert.equal(code, 1)
  assert.match(out, /只填了一端/)
})

test('只填一端「~13:41」→ exit 1', () => {
  const { code, out } = run(tpl(['| 1 | ~13:41 | 10m | 后端 | ✅ |']))
  assert.equal(code, 1)
  assert.match(out, /只填了一端/)
})

test('裸单时间点无 ~ 分隔「12:39」→ exit 1（2026-10-20 病根变体）', () => {
  const { code, out } = run(tpl(['| 1 | 12:39 | 39m | 后端 | ✅ |']))
  assert.equal(code, 1)
  assert.match(out, /缺「~」分隔/)
})

test('无 ~ 分隔的起止「12:39~12:50abc」→ exit 1', () => {
  const { code, out } = run(tpl(['| 1 | 12:39~12:50abc | 39m | 后端 | ✅ |']))
  assert.equal(code, 1)
  assert.match(out, /一端格式非法/)
})

test('显式「未取数」标注 → exit 0 + WARN', () => {
  const { code, out } = run(tpl(['| 1 | 未取数~未取数 | 未取数 | 后端 | ✅ |']))
  assert.equal(code, 0)
  assert.match(out, /未取数/)
})

test('一端时间一端未取数「13:41~未取数」→ exit 0 + WARN', () => {
  const { code, out } = run(tpl(['| 1 | 13:41~未取数 | 10m | 后端 | ✅ |']))
  assert.equal(code, 0)
  assert.match(out, /未取数/)
})

test('加粗装饰「**14:00~14:10**」→ exit 0 + WARN', () => {
  const { code, out } = run(tpl(['| 1 | **14:00~14:10** | **10m** | 后端 | ✅ |']))
  assert.equal(code, 0)
  assert.match(out, /装饰/)
})

test('括号注释「12:31~16:54（跨 session）」→ exit 0 + WARN', () => {
  const { code, out } = run(tpl(['| 1 | 12:31~16:54（跨 session） | 12m | 后端 | ✅ |']))
  assert.equal(code, 0)
  assert.match(out, /装饰/)
})

test('表头缺失 → exit 2', () => {
  const { code, err } = run('# 无表头\n')
  assert.equal(code, 2)
  assert.match(err, /未找到轮次账表/)
})

test('表头缺「耗时」列 → exit 2', () => {
  const { code, err } = run('# 样本\n\n## 轮次账\n\n| 轮 | 起止 | 席位 |\n|---|---|---|\n| 1 | 14:00~14:10 | 后端 |\n')
  assert.equal(code, 2)
  assert.match(err, /缺「起止」或「耗时」列/)
})

test('轮次账行数 vs 小节数不符 → exit 0 + WARN', () => {
  const content = `# 样本\n\n## 轮次账\n\n| 轮 | 起止（HH:MM:SS） | 耗时 | 席位 | 本轮核销 |\n|---|---|---|---|---|\n${'| 1 | 14:00~14:10 | 10m | 后端 | ✅ |\n| 2 | 14:10~14:20 | 10m | 后端 | ✅ |'}\n\n## 第 1 轮\n`
  const { code, out } = run(content)
  assert.equal(code, 0)
  assert.match(out, /小节.*不一致/)
})

// ── 以下为 senior-sdet 2026-10-20 补充（对应 review-ledger-gate-testcase.md 的 TC-006/008/015/018/019/020/021/022/024）──

test('起止整格「未取数」→ exit 0 + WARN', () => {
  const { code, out } = run(tpl(['| 1 | 未取数 | 10m | 后端 | ✅ |']))
  assert.equal(code, 0)
  assert.match(out, /起止整格标「未取数」/)
})

test('耗时无 N m 但有说明「跨 session」→ exit 0 + WARN', () => {
  const { code, out } = run(tpl(['| 1 | 14:00~14:10 | 跨 session | 后端 | ✅ |']))
  assert.equal(code, 0)
  assert.match(out, /耗时无 N m 但有说明/)
})

test('起止格式非法「abc~def」→ exit 1', () => {
  const { code, out } = run(tpl(['| 1 | abc~def | 10m | 后端 | ✅ |']))
  assert.equal(code, 1)
  assert.match(out, /起止格式非法/)
})

test('表头缺「起止」列 → exit 2', () => {
  const { code, err } = run('# 样本\n\n## 轮次账\n\n| 轮 | 耗时 | 席位 |\n|---|---|---|\n| 1 | 10m | 后端 |\n')
  assert.equal(code, 2)
  assert.match(err, /未找到轮次账表/)
})

test('无参数调用 → exit 2 + 用法提示', () => {
  const { code, err } = runCli([])
  assert.equal(code, 2)
  assert.match(err, /用法/)
})

test('文件不存在 → exit 2', () => {
  const { code, err } = runCli([join(tmpdir(), 'rl-gate-missing-xxx.md')])
  assert.equal(code, 2)
  assert.match(err, /读取.*失败/)
})

test('表头存在但无数据行 → exit 2', () => {
  const { code, err } = run(tpl([]))
  assert.equal(code, 2)
  assert.match(err, /轮次账表下无数据行/)
})

test('列顺序调换（耗时列非固定列位）仍正确判 → exit 0', () => {
  const content = `# 样本\n\n## 轮次账\n\n| 轮 | 耗时 | 起止（HH:MM:SS） | 席位 | 本轮核销 |\n|---|---|---|---|---|\n| 1 | 10m | 14:00~14:10 | 后端 | ✅ |\n`
  const { code } = run(content)
  assert.equal(code, 0)
})

test('无时间点的只填一端「abc~」→ exit 1', () => {
  const { code, out } = run(tpl(['| 1 | abc~ | 10m | 后端 | ✅ |']))
  assert.equal(code, 1)
  assert.match(out, /只填了一端/)
})
