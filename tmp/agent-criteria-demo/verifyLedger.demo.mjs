// 账本产物校验器：表在不在、列齐不齐、必填列填没填（只判痕，不判值合理性）
import test from 'node:test'
import assert from 'node:assert/strict'
import { parseTables, verifyText, verifyFile } from '../verifyLedger.mjs'
import { collectDocs } from '../ledger.mjs'

const FILLED = `# 轮间核对单

> 声明：略

## 核对项

| 项 | 核对内容 | 结果 | 证据 |
|---|---|---|---|
| 第 0 项 轮际对账 | 上轮承诺 vs 本轮 | 过 | 命令 + 首行 |
| 第 1 项 卡片字段齐 | 八字段 | 过 | a.md:12 |
| 第 2 项 答辩字段齐 | 判定 + 依据 | 过 | b.md:3 |
| 第 3 项 本轮终态对账 | 卡片数 | 过 | node -e 输出 |
| 第 4 项 侦探观察存在且卡号真实 |  | 过 | c.md:9 |
| 第 5 项 汇总未丢卡 |  | 过 | 见 cards.md |

## 结论

过
`

test('V-TC-01 解析表格：表头 + 数据行，跳过分隔行', () => {
  const t = parseTables('| a | b |\n|---|---|\n| 1 | 2 |\n')
  assert.equal(t.length, 1)
  assert.deepEqual(t[0].headers, ['a', 'b'])
  assert.deepEqual(t[0].rows, [['1', '2']])
})

test('V-TC-02 填齐的轮间核对单 → 绿', () => {
  const r = verifyText('round-check.md', FILLED)
  assert.equal(r.ok, true, r.errors.join(';'))
})

test('V-TC-03 空白模板 → 红（必填列为空）', () => {
  const docs = collectDocs()
  const tpl = docs.find((d) => d.file === 'round-check.md')
  const { renderTemplate } = { renderTemplate: (t) => t } // 占位，避免导入循环
  void renderTemplate
  const blank = `| 项 | 核对内容 | 结果 | 证据 |
|---|---|---|---|
| 第 0 项 轮际对账 | x |  |  |
| 第 1 项 卡片字段齐 | x |  |  |
| 第 2 项 答辩字段齐 | x |  |  |
| 第 3 项 本轮终态对账 | x |  |  |
| 第 4 项 | x |  |  |
| 第 5 项 | x |  |  |
`
  const r = verifyText('round-check.md', blank, docs)
  assert.equal(r.ok, false)
  assert.ok(r.errors.some((e) => /「结果」为空/.test(e)))
  assert.ok(tpl, '模板必须存在')
})

test('V-TC-04 表头被改 → 红且指出不符', () => {
  const bad = FILLED.replace('| 项 | 核对内容 | 结果 | 证据 |', '| 项 | 内容 | 结果 | 证据 |')
  const r = verifyText('round-check.md', bad)
  assert.equal(r.ok, false)
  assert.ok(r.errors.some((e) => /表头不符/.test(e)))
})

test('V-TC-05 行数不足 → 红', () => {
  const short = FILLED.split('\n').filter((l) => !l.includes('第 5 项')).join('\n')
  const r = verifyText('round-check.md', short)
  assert.equal(r.ok, false)
  assert.ok(r.errors.some((e) => /行数不足/.test(e)))
})

test('V-TC-06 未知账本名 → 红', () => {
  const r = verifyText('no-such.md', FILLED)
  assert.equal(r.ok, false)
  assert.ok(r.errors[0].includes('未知账本'))
})

test('V-TC-07 文件不存在 → 红', () => {
  const r = verifyFile('no/such/file.md')
  assert.equal(r.ok, false)
  assert.ok(r.errors[0].includes('产物不存在'))
})

test('V-TC-08 交付审计表两个表都要在', () => {
  const onlyA = `| 项 | 核对内容 | 结果 | 证据 |
|---|---|---|---|
| A1 终态对账 |  | 过 | a |
| A2 P0P1 清零 |  | 过 | a |
| A3 落点抽查 ≥3 |  | 过 | a |
| A4 P2 三态齐（采纳/关闭/候选） |  | 过 | a |
| A5 数字一致 |  | 过 | a |
| A6 升级项有终裁 |  | 过 | a |
`
  const r = verifyText('delivery-audit.md', onlyA)
  assert.equal(r.ok, false)
  assert.ok(r.errors.some((e) => /表数量不足/.test(e)))
})
