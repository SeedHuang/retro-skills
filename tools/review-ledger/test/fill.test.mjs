// T2 填充器单测：骨架 8 列 / 三态 / 机算 provenance / 失败处理 / 重跑幂等。
// 对应 TC-01 / TC-02 / TC-03 / TC-04 / TC-08，TC-24 由 T4 校验器覆盖。
import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { modelWithShared } from '../../docgen/models/agents/source.mjs'
import { collectDocs, renderTemplate } from '../../docgen/builders/agents/ledger.mjs'
import { splitRow } from '../../execution-matrix/markdown-rows.mjs'
import { parseLedger } from '../lib/parse.mjs'
import { buildSkeleton, applyStates, mergeRows, fillText, stamp } from '../fill.mjs'

const MODEL = modelWithShared('reviewer-audit')
const KIND = 'round-check'
const TEMPLATE = renderTemplate(collectDocs().find((d) => d.kind === KIND))
const NOW = new Date('2026-11-13T10:20:30+08:00')
const OK = () => ({ ok: true, code: 0, firstLine: 'landings ok' })
const sha = (s) => createHash('sha256').update(s).digest('hex')

const skeleton = () => buildSkeleton({ model: MODEL, kind: KIND })

function setCell(text, key, col, value) {
  const lines = text.split('\n')
  const i = lines.findIndex((l) => l.startsWith('|') && splitRow(l)[0] === key)
  assert.ok(i >= 0, `找不到行 ${key}`)
  const cells = splitRow(lines[i])
  cells[col] = value
  lines[i] = `| ${cells.map((c) => c.replace(/\|/g, '\\|')).join(' | ')} |`
  return lines.join('\n')
}

test('T2-01 骨架：8 列 label + checklist 行 + 覆盖度类型（TC-01）', () => {
  const { headers, rows } = skeleton()
  assert.deepEqual(headers, ['项', '核对内容', '判据', '类型', '结果', '理由', '适用性', '证据'])
  assert.equal(rows.length, 8)
  assert.deepEqual(rows.map((r) => r[0]), ['1', '2', '3', '4', '5', '6', '7', '8'])
  assert.equal(rows[0][3], '半机判')
  assert.equal(rows[4][3], '人工判定')
  assert.equal(rows[0][4], '[人工]')
})

test('T2-02 机算格写结果与 provenance；未给命令的判据留待判（TC-02/03）', () => {
  const rows = skeleton().rows
  const { rows: out, failures } = applyStates({
    model: MODEL,
    rows,
    commands: { 'audit.spot': 'scs check landings --ledger .' },
    runCommand: OK,
    now: NOW,
  })
  assert.equal(failures.length, 0)
  const row6 = out.find((r) => r[0] === '6')
  assert.equal(row6[4], '[机算] hit')
  assert.match(row6[7], /^\[机算\] 命令=scs check landings --ledger \.；退出码=0；首行=landings ok；时刻=\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} [+-]\d{2}:\d{2}$/)
  const row1 = out.find((r) => r[0] === '1')
  assert.equal(row1[4], '[待判]')
  assert.equal(row1[5], '结构未冻结')
  assert.equal(out.filter((r) => r[4].startsWith('[待判]')).length, 7)
})

test('T2-03 脚本失败：写「待判（脚本失败）」并登记 failure（D8）', () => {
  const { rows, failures } = applyStates({
    model: MODEL,
    rows: skeleton().rows,
    commands: { 'audit.spot': 'boom' },
    runCommand: () => ({ ok: false, reason: 'spawn ENOENT' }),
    now: NOW,
  })
  assert.equal(failures.length, 1)
  assert.equal(failures[0].criterion, 'audit.spot')
  assert.equal(rows.find((r) => r[0] === '6')[4], '[待判]（脚本失败：spawn ENOENT）')
})

test('T2-04 manual 判据即使给了命令也不跑（不猜）', () => {
  let called = false
  const { rows } = applyStates({
    model: MODEL,
    rows: skeleton().rows,
    commands: { 'audit.round': 'should-not-run' },
    runCommand: () => { called = true; return { ok: true, code: 0, firstLine: '' } },
    now: NOW,
  })
  assert.equal(called, false)
  const row5 = rows.find((r) => r[0] === '5')
  assert.equal(row5[4], '[待判]')
  assert.equal(row5[5], '记录未结构化')
})

test('T2-05 mergeRows：已填格不动，空 / 待判格补上，缺行追加', () => {
  const existing = [['1', 'old', 'c', 'k', '[机算] hit', '', '', '[机算] 时刻=T1']]
  const next = [
    ['1', 'new', 'c2', 'k2', '[待判]', 'r', '', '[机算] 时刻=T2'],
    ['2', 'row2', 'c', 'k', '[待判]', '', '', ''],
  ]
  const merged = mergeRows(existing, next)
  assert.deepEqual(merged[0], ['1', 'old', 'c', 'k', '[机算] hit', 'r', '', '[机算] 时刻=T1'])
  assert.deepEqual(merged[1], ['2', 'row2', 'c', 'k', '[待判]', '', '', ''])
})

test('T2-06 fillText 重跑 sha256 不变，表内 8 行（TC-08）', () => {
  const args = {
    model: MODEL,
    kind: KIND,
    commands: { 'audit.spot': 'scs check landings --ledger .' },
    runCommand: OK,
    now: NOW,
  }
  const first = fillText({ ...args, text: TEMPLATE })
  const second = fillText({ ...args, text: first.text, now: new Date('2026-11-13T23:59:59+08:00') })
  assert.equal(sha(first.text), sha(second.text))
  const parsed = parseLedger(first.text)
  assert.equal(parsed.rows.length, 8)
  assert.equal(parsed.skipped, 0)
  assert.equal(parsed.parseFailed, false)
})

test('T2-07 stamp 带时区', () => {
  assert.match(stamp(NOW), /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} [+-]\d{2}:\d{2}$/)
})

test('T2-08 人工已填格不被重跑覆盖，机算时刻不变（D4）', () => {
  const args = {
    model: MODEL,
    kind: KIND,
    commands: { 'audit.spot': 'scs check landings --ledger .' },
    runCommand: OK,
    now: NOW,
  }
  const first = fillText({ ...args, text: TEMPLATE })
  const timeOfRow6 = parseLedger(first.text).rows.find((r) => r.cells[0] === '6').cells[7]
  const edited = setCell(first.text, '1', 4, '[人工] 已复核')
  const second = fillText({ ...args, text: edited, now: new Date('2026-11-14T09:00:00+08:00') })
  const rows = parseLedger(second.text).rows
  assert.equal(rows.find((r) => r.cells[0] === '1').cells[4], '[人工] 已复核')
  assert.equal(rows.find((r) => r.cells[0] === '6').cells[7], timeOfRow6)
})

const ARGS = {
  model: MODEL,
  kind: KIND,
  commands: { 'audit.spot': 'scs check landings --ledger .' },
  runCommand: OK,
  now: NOW,
}

test('T2-09 旧 4 列表头：拒绝写入，不产出畸形表', () => {
  const old = '| 项 | 核对内容 | 结果 | 证据 |\n|---|---|---|---|\n| 第 1 项 卡片字段齐 | x |  |  |'
  assert.throws(() => fillText({ ...ARGS, text: old }), /表头与 kind 不一致/)
})

test('T2-10 既有坏行：拒绝写入', () => {
  const bad = '| 项 | 核对内容 | 判据 | 类型 | 结果 | 理由 | 适用性 | 证据 |\n|---|---|---|---|---|---|---|---|\n| 1 | 少列 |'
  assert.throws(() => fillText({ ...ARGS, text: bad }), /解析失败（坏行 1）/)
})

test('T2-11 未闭合围栏：拒绝写入', () => {
  assert.throws(() => fillText({ ...ARGS, text: `\`\`\`\n${TEMPLATE}` }), /解析失败（未闭合围栏 L1）/)
})
