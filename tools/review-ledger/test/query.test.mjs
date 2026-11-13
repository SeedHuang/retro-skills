// T3 定位器单测：索引键集合、行号、0 命中 / 坏行退出语义、只读、围栏、CRLF/BOM、转义竖线、上下文。
// 对应 TC-06 / TC-07 / TC-13 / TC-14 / TC-15 / TC-19 / TC-20 / TC-21 / TC-23 / TC-25。
import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { buildIndex, queryShow, normalizeKey } from '../query.mjs'

const HEAD = '| 项 | 核对内容 | 判据 | 类型 | 结果 | 理由 | 适用性 | 证据 |'
const DELIM = '|---|---|---|---|---|---|---|---|'
const row = (n, result = '[待判]', content = `内容${n}`) => `| ${n} | ${content} | 判据${n} | 可机判 | ${result} |  |  |  |`
const TABLE = [HEAD, DELIM, ...Array.from({ length: 8 }, (_, i) => row(i + 1))].join('\n')
const QUERY = fileURLToPath(new URL('../query.mjs', import.meta.url))
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex')

test('T3-01 索引：键集合 = 1..8，行号 1-based，无重复（TC-06/25）', () => {
  const idx = buildIndex(TABLE, 'round-check')
  assert.deepEqual(idx.rows.map((r) => r.key), ['1', '2', '3', '4', '5', '6', '7', '8'])
  assert.deepEqual(idx.rows.map((r) => r.line), [3, 4, 5, 6, 7, 8, 9, 10])
  assert.ok(idx.rows.every((r) => Number.isInteger(r.line)))
  assert.ok(idx.rows.every((r) => r.status === '[待判]'))
  assert.equal(idx.scanned, 8)
  assert.equal(idx.skipped, 0)
  assert.equal(idx.parseFailed, false)
})

test('T3-02 行键别名：第 1 项 与 1 命中同一行；默认上下文前后各 1 行（TC-07/23）', () => {
  for (const key of ['第 1 项', '1']) {
    const r = queryShow(TABLE, 'round-check', { row: key })
    assert.equal(r.hits, 1)
    assert.equal(r.matches[0].line, 3)
    assert.equal(r.matches[0].row.key, '1')
    assert.deepEqual(r.matches[0].context.map((c) => c.line), [2, 4])
  }
  assert.equal(normalizeKey('第 04 项'), '4')
})

test('T3-03 不存在的键：hits=0 / skipped=0 / 不判失败（TC-13）', () => {
  const r = queryShow(TABLE, 'round-check', { row: '第 99 项' })
  assert.equal(r.hits, 0)
  assert.equal(r.scanned, 8)
  assert.equal(r.skipped, 0)
  assert.equal(r.parseFailed, false)
})

test('T3-04 坏行：skipped=1 并给坏行行号（TC-14）', () => {
  const r = queryShow(`${TABLE}\n| 9 | 少列 |`, 'round-check', { row: '1' })
  assert.equal(r.skipped, 1)
  assert.equal(r.parseFailed, true)
  assert.deepEqual(r.badLines, [{ line: 11, expected: 8, actual: 2 }])
})

test('T3-05 围栏内伪表格不计行（TC-19）', () => {
  const r = queryShow(`\`\`\`\n${TABLE}\n\`\`\``, 'round-check', { row: '第 9 项' })
  assert.equal(r.hits, 0)
  assert.equal(r.scanned, 0)
  assert.equal(r.skipped, 0)
  assert.equal(r.parseFailed, false)
})

test('T3-06 CRLF + BOM 与 LF 结果一致（TC-20）', () => {
  const crlf = `\uFEFF${TABLE.replace(/\n/g, '\r\n')}`
  assert.deepEqual(queryShow(crlf, 'round-check', { row: '第 1 项' }), queryShow(TABLE, 'round-check', { row: '第 1 项' }))
  assert.deepEqual(buildIndex(crlf, 'round-check'), buildIndex(TABLE, 'round-check'))
})

test('T3-07 转义竖线不切列（TC-21）', () => {
  const text = [HEAD, DELIM, row(1, '[待判]', 'a \\| b')].join('\n')
  const idx = buildIndex(text, 'round-check')
  assert.equal(idx.skipped, 0)
  const r = queryShow(text, 'round-check', { row: '1' })
  assert.equal(r.matches[0].row.item, 'a | b')
})

test('T3-08 --where 支持 label / id，--fields 只输出选中列', () => {
  const r = queryShow(TABLE, 'round-check', { where: { col: '结果', value: '待判' }, fields: ['结果'] })
  assert.equal(r.hits, 8)
  assert.deepEqual(Object.keys(r.matches[0].row).sort(), ['key', 'verdict'])
  assert.equal(r.matches[0].row.verdict, '[待判]')
  assert.equal(queryShow(TABLE, 'round-check', { where: { col: 'verdict', value: '待判' } }).hits, 8)
})

test('T3-09 跨节上下文标 boundary 与 section（D6）', () => {
  const text = ['# 标题', '## 核对项', HEAD, DELIM, row(1), row(2), '## 结论'].join('\n')
  const r = queryShow(text, 'round-check', { row: '1', context: 2 })
  assert.deepEqual(r.matches[0].context.map((c) => c.line), [3, 4, 6, 7])
  const conclusion = r.matches[0].context.find((c) => c.line === 7)
  assert.equal(conclusion.section, '结论')
  assert.equal(conclusion.boundary, true)
  assert.equal(r.matches[0].context.find((c) => c.line === 3).section, '核对项')
})

test('T3-10 context 上限 5', () => {
  const r = queryShow(TABLE, 'round-check', { row: '1', context: 99 })
  assert.equal(r.matches[0].context.length, 7)
})

test('T3-12 围栏内伪标题不改变分节', () => {
  const text = ['## 核对项', HEAD, DELIM, row(1), '## 结论', '```', '# 假标题', '```', '说明文字'].join('\n')
  const r = queryShow(text, 'round-check', { row: '1', context: 5 })
  const fake = r.matches[0].context.find((c) => c.line === 7)
  assert.equal(fake.section, '结论')
  const tail = r.matches[0].context.find((c) => c.text === '说明文字')
  assert.equal(tail.section, '结论')
  assert.equal(tail.boundary, true)
})

test('T3-11 CLI：0 命中 exit 0 / 坏行 exit 1 / 只读（TC-13/14/15）', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ledger-query-'))
  try {
    const file = join(dir, 'ledger.md')
    writeFileSync(file, TABLE, 'utf8')
    const before = sha(file)
    const ok = spawnSync(process.execPath, [QUERY, 'show', file, '--kind', 'round-check', '--row', '第 1 项'], { encoding: 'utf8' })
    assert.equal(ok.status, 0, ok.stderr)
    assert.equal(JSON.parse(ok.stdout).matches[0].line, 3)
    assert.equal(sha(file), before)

    const miss = spawnSync(process.execPath, [QUERY, 'show', file, '--kind', 'round-check', '--row', '第 99 项'], { encoding: 'utf8' })
    assert.equal(miss.status, 0, miss.stderr)
    assert.equal(JSON.parse(miss.stdout).hits, 0)

    writeFileSync(file, `${TABLE}\n| 9 | 少列 |`, 'utf8')
    const bad = spawnSync(process.execPath, [QUERY, 'show', file, '--kind', 'round-check', '--row', '1'], { encoding: 'utf8' })
    assert.notEqual(bad.status, 0)
    assert.equal(JSON.parse(bad.stdout).skipped, 1)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
