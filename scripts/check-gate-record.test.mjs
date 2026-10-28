// check-gate-record 测试：按单元格判表头（不按整行子串）、R1 空证据、R2 自签、R6 计数
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkGateRecord, RECORD_PATH } from './check-gate-record.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))

const HEAD = [
  '| 段 | 出口判据（逐条） | 核了什么（命令输出首行 或 path:line） | 申报人 | 签字人 | 结论 |',
  '|---|---|---|---|---|---|',
].join('\n')

const ok = (seg = '③@X', extra = '') =>
  `| ${seg} | 判据 | \`npm run check\` → check 全部通过（exit 0）${extra} | 开发（主 agent） | 审计 | 过 |`

test('全合规 → rows 计到、无 reason', () => {
  const r = checkGateRecord(`${HEAD}\n${ok()}\n`)
  assert.equal(r.rows, 1)
  assert.deepEqual(r.reasons, [])
})

test('正文含「申报人」字样的数据行仍被核（旧内联脚本会把它当表头丢掉）', () => {
  const row = `| ④@X | 判据 | \`npm run check\` → 通过；R2 自查：申报人 ∩ 签字人 = ∅ | 开发（主 agent） | sdet | 过 |`
  const r = checkGateRecord(`${HEAD}\n${row}\n`)
  assert.equal(r.rows, 1)
  assert.deepEqual(r.reasons, [])
})

test('R2：自签 → 报出来', () => {
  const row = '| ③@X | 判据 | `npm run check` → 通过（exit 0） | 开发（主 agent） | 开发（主 agent） | 过 |'
  const r = checkGateRecord(`${HEAD}\n${row}\n`)
  assert.equal(r.rowsWithIssues.length, 1)
  assert.match(r.reasons.join('\n'), /R2 自签/)
})

test('R1：证据为空 / 只写「已核」/ 空话无锚点 → 报出来；有锚点的短证据放行', () => {
  const empty = '| ③@X | 判据 |  | 开发 | 审计 | 过 |'
  const a = checkGateRecord(`${HEAD}\n${empty}\n`)
  assert.match(a.reasons.join('\n'), /为空（R1）/)
  const short = '| ③@X | 判据 | 已核 | 开发 | 审计 | 过 |'
  const b = checkGateRecord(`${HEAD}\n${short}\n`)
  assert.match(b.reasons.join('\n'), /无可复算锚点（R1/)
  // 空话（有字数、无锚点）也算不合格——第二轮审查 P1；**空话 + 裸箭头**同样不合格（第 4 轮 P1）；
  // **空话 + 时间串 / 纯数字比**也不能算锚点（第 5 轮 P1）
  for (const talk of ['已核对全部字段', '看过了全部证据', '同上次核对了全部细节', '已全部核对 → 通过', '全看过 → ok', '已核对 2026-10-28 10:30', '已核对 1:1']) {
    const r = checkGateRecord(`${HEAD}\n| ③@X | 判据 | ${talk} | 开发 | 审计 | 过 |\n`)
    assert.match(r.reasons.join('\n'), /无可复算锚点（R1/, talk)
  }
  // 合法短锚点不被误伤
  for (const okEvidence of ['见 #L7', 'R1:3', '`npm run check` → 通过']) {
    const r = checkGateRecord(`${HEAD}\n| ③@X | 判据 | ${okEvidence} | 开发 | 审计 | 过 |\n`)
    assert.deepEqual(r.reasons, [], okEvidence)
  }
})

test('R3：结论列为空或「—」→ 报未收口', () => {
  for (const verdict of ['', '—']) {
    const row = `| ③@X | 判据 | \`npm run check\` → 通过 | 开发 | 审计 | ${verdict} |`
    const r = checkGateRecord(`${HEAD}\n${row}\n`)
    assert.match(r.reasons.join('\n'), /结论为空（R3/, JSON.stringify(verdict))
  }
})

test('列数 ≠ 6 → 报出来（防行结构坏了却当成合规行）', () => {
  const row = '| ③@X | 判据 | `npm run check` 通过 | 开发 | 审计 |'
  const r = checkGateRecord(`${HEAD}\n${row}\n`)
  assert.match(r.reasons.join('\n'), /列数 5 ≠ 6/)
})

test('R6：「拆 spec 中」出现 2 次 → 报出来；1 次 → 不报', () => {
  const one = checkGateRecord(`${HEAD}\n${ok()}\n状态 = 拆 spec 中\n`)
  assert.deepEqual(one.reasons, [])
  const two = checkGateRecord(`${HEAD}\n${ok()}\n状态 = 拆 spec 中\n状态 = 拆 spec 中\n`)
  assert.match(two.reasons.join('\n'), /R6/)
})

// ── S4 / R10①：ISO 时间串不得被当锚点（P57–P60 / P63） ────────────────────
const rowWith = (evidence) => `| ③@X | 判据 | ${evidence} | 开发 | 审计 | 过 |`
const reasonsOf = (evidence) => checkGateRecord(`${HEAD}\n${rowWith(evidence)}\n`).reasons.join('\n')

test('P57 ISO 时间串（分钟）不得当锚点 → 必报 R1', () => {
  assert.match(reasonsOf('已核对 2026-10-28T10:30'), /无可复算锚点（R1/)
})

test('P58 ISO 时间串（带秒）同样必报 R1', () => {
  assert.match(reasonsOf('已核对 2026-10-28T10:30:45'), /无可复算锚点（R1/)
})

test('P59 含反引号命令的证据里带 ISO 时间串 → 仍放行（不得误伤）', () => {
  assert.deepEqual(checkGateRecord(`${HEAD}\n${rowWith('`npm run check` → 2026-10-28T10:30 通过')}\n`).reasons, [])
})

test('P60 合法锚点（path:line / #L7）仍放行', () => {
  for (const ev of ['已核对 `docs/x.md:12`', '见 #L7']) {
    assert.deepEqual(checkGateRecord(`${HEAD}\n${rowWith(ev)}\n`).reasons, [], ev)
  }
})

test('P63 改判后真 gate-record.md 仍全绿（rows 现算，不写死数字）', () => {
  const doc = readFileSync(resolve(HERE, '..', RECORD_PATH), 'utf8')
  const r = checkGateRecord(doc)
  assert.deepEqual(r.reasons, [])
  const expected = doc.split(/\r?\n/).filter((l) => l.trim().startsWith('|')).length - 2 // 表头 + 分隔行
  assert.strictEqual(r.rows, expected)
})
