// T1 解析库单测：坏行计 skipped、围栏内不计、BOM/CRLF 与 LF 输出一致、转义竖线、三态识别。
// 对应 TC-13 / TC-14 / TC-19 / TC-20 / TC-21 的解析层前置。
import test from 'node:test'
import assert from 'node:assert/strict'
import { parseLedger, normalizeText, triStateOf } from '../lib/parse.mjs'

const HEAD = '| 项 | 核对内容 | 判据 | 类型 | 结果 | 理由 | 适用性 | 证据 |'
const DELIM = '|---|---|---|---|---|---|---|---|'
const table = (rows) => [HEAD, DELIM, ...rows].join('\n')

test('T1-01 干净表：scanned 只计数据行，行号 1-based，单元格去空白', () => {
  const text = table([
    '| 第 1 项 | a | b | full | [机算] hit | r | - | e |',
    '| 第 2 项 | c | d | manual | [待判] |  |  |  |',
  ])
  const r = parseLedger(text)
  assert.equal(r.scanned, 2)
  assert.equal(r.skipped, 0)
  assert.equal(r.parseFailed, false)
  assert.deepEqual(r.rows.map((x) => x.line), [3, 4])
  assert.equal(r.rows[0].cells[0], '第 1 项')
  assert.equal(r.rows[1].cells[4], '[待判]')
})

test('T1-02 仅表头：scanned = 0', () => {
  const r = parseLedger(table([]))
  assert.equal(r.scanned, 0)
  assert.equal(r.skipped, 0)
  assert.deepEqual(r.rows, [])
})

test('T1-03 围栏内伪表格不计行（TC-19）', () => {
  const text = `${table(['| 第 1 项 | a | b | full | hit | r | - | e |'])}\n\n\`\`\`\n| 第 9 项 | x | y | full | hit | r | - | e |\n\`\`\`\n`
  const r = parseLedger(text)
  assert.equal(r.scanned, 1)
  assert.equal(r.skipped, 0)
  assert.ok(!r.rows.some((x) => x.cells[0] === '第 9 项'))
})

test('T1-04 坏行计 skipped 并给行号，坏行不进 rows（TC-14）', () => {
  const text = table([
    '| 第 1 项 | a | b | full | hit | r | - | e |',
    '| 第 2 项 | 少列 |',
  ])
  const r = parseLedger(text)
  assert.equal(r.scanned, 2)
  assert.equal(r.skipped, 1)
  assert.equal(r.parseFailed, true)
  assert.deepEqual(r.badLines, [{ line: 4, expected: 8, actual: 2 }])
  assert.ok(!r.rows.some((x) => x.cells[0] === '第 2 项'))
})

test('T1-05 CRLF + BOM 与 LF 解析结果一致（TC-20）', () => {
  const lf = table(['| 第 1 项 | a | b | full | hit | r | - | e |'])
  const crlf = `\uFEFF${lf.replace(/\n/g, '\r\n')}`
  assert.deepEqual(parseLedger(crlf), parseLedger(lf))
  assert.equal(normalizeText(crlf), lf)
})

test('T1-06 转义竖线与代码跨度内竖线都不切列（TC-21）', () => {
  const text = table(['| 第 1 项 | a \\| b | `c|d` | full | hit | r | - | e |'])
  const r = parseLedger(text)
  assert.equal(r.skipped, 0)
  assert.equal(r.rows[0].cells.length, 8)
  assert.equal(r.rows[0].cells[1], 'a | b')
  assert.equal(r.rows[0].cells[2], '`c|d`')
})

test('T1-07 三态前缀识别', () => {
  assert.equal(triStateOf('[机算] 3'), '机算')
  assert.equal(triStateOf(' [待判] '), '待判')
  assert.equal(triStateOf('[人工]'), '人工')
  assert.equal(triStateOf('hit'), null)
  assert.equal(triStateOf('[机算 ] 3'), null)
})

test('T1-08 相邻两张表：表头不被当成数据行吞掉', () => {
  const text = `${table(['| 第 1 项 | a | b | full | hit | r | - | e |'])}\n${table(['| 第 2 项 | c | d | full | hit | r | - | e |'])}`
  const r = parseLedger(text)
  assert.equal(r.scanned, 2)
  assert.deepEqual(r.rows.map((x) => x.cells[0]), ['第 1 项', '第 2 项'])
})

test('T1-09 未闭合围栏：剩余内容不计行，unclosedLine 给 1-based 行号', () => {
  const text = `\`\`\`\n${table(['| 第 1 项 | a | b | full | hit | r | - | e |'])}`
  const r = parseLedger(text)
  assert.equal(r.scanned, 0)
  assert.equal(r.skipped, 0)
  assert.equal(r.unclosedLine, 1)
  assert.equal(r.parseFailed, true)
})

test('T1-10 分隔行列数不符：记 badTables 并 parseFailed，不静默变成 0 命中', () => {
  const text = '| 项 | 核对内容 | 判据 | 类型 | 结果 | 理由 | 适用性 | 证据 |\n|---|---|---|---|\n| 第 1 项 | a | b | full | hit | r | - | e |'
  const r = parseLedger(text)
  assert.equal(r.scanned, 0)
  assert.equal(r.skipped, 0)
  assert.deepEqual(r.badTables, [{ line: 1, expected: 8, actual: 4 }])
  assert.equal(r.parseFailed, true)
})
