// T0.5 三源一致（对应 TC-01 / TC-06 / TC-25）：行键只来自 `checklist.items[].no`。
// 三源口径：
//   ① 模型 checklist：no 必须唯一、整数、从 1 连续（行键集合 = 1..N）；
//   ② kind 注册表：席位模板 kind 可解析，且列里有行键列 `no`（表头由 label 渲，校验按 id 对齐）；
//   ③ 生成物 assets：数据行数 = 0（行不预置，只能由 checklist 生成）。
// 任一不等即失败——按 plan §1，本断言不过不得进 T2。
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { listSeats, modelPathOf } from '../../docgen/models/agents/source.mjs'
import { kinds } from '../../docgen/builders/agents/components/outputFormats.mjs'
import { collectDocs, OUT } from '../../docgen/builders/agents/ledger.mjs'
import { splitRow, fenceMask } from '../../execution-matrix/markdown-rows.mjs'

// spec §3 定版的 8 列 label 与 id（id 供校验按列对齐；label 供产物表头渲染）
const SPEC8 = ['项', '核对内容', '判据', '类型', '结果', '理由', '适用性', '证据']
const SPEC8_IDS = ['no', 'item', 'criterion', 'kind', 'verdict', 'reason', 'applicability', 'evidence']
// 行键列 `no` 只属于账本型 kind：P0 blocker 的范围是 round-check / delivery-audit（PRD §7、plan §1 T0.5）
const LEDGER_KINDS = new Set(['round-check', 'delivery-audit'])
const isDelim = (cells) => cells.length > 0 && cells.every((x) => /^:?-{1,}:?$/.test(x))
const TABLE_ROW_RE = /^\s*\|/

test('T0.5 模型与 kind：checklist 行键唯一连续，kind 含行键列 no', () => {
  for (const seat of listSeats()) {
    const m = JSON.parse(readFileSync(modelPathOf(seat), 'utf8'))
    const nos = (m.checklist?.items || []).map((i) => i.no)
    assert.ok(nos.length > 0, `${seat}: checklist.items 为空`)
    assert.equal(new Set(nos).size, nos.length, `${seat}: checklist.no 有重复：${nos}`)
    nos.forEach((n, i) => assert.equal(n, i + 1, `${seat}: checklist.no 必须 1 起连续，实得 ${nos}`))
    for (const [id, t] of Object.entries(m.templates || {})) {
      const columns = kinds[t.kind]?.columns
      assert.ok(columns, `${seat}: templates.${id}.kind 未注册（${t.kind}）`)
      assert.ok(columns.length > 0, `${seat}: templates.${id} kind=${t.kind} 列集为空`)
      if (LEDGER_KINDS.has(t.kind)) {
        assert.ok(columns.some((c) => c.id === 'no'), `${seat}: templates.${id} kind=${t.kind} 缺行键列 no`)
      }
    }
  }
})

test('T0.5 kind 与 spec：账本型 8 列 label 逐项相等', () => {
  for (const kind of ['round-check', 'delivery-audit']) {
    assert.deepEqual(kinds[kind].columns.map((c) => c.label), SPEC8, `${kind}: 列 label 与 spec §3 不一致`)
  }
})

test('T0.5 kind 与 spec：账本型 8 列 id 逐项相等（label 相同也必须钉住 id 顺序）', () => {
  for (const kind of ['round-check', 'delivery-audit']) {
    assert.deepEqual(kinds[kind].columns.map((c) => c.id), SPEC8_IDS, `${kind}: 列 id 与 spec §3 不一致`)
  }
})

test('T0.5 assets：数据行数为 0（行不预置）', () => {
  for (const doc of collectDocs()) {
    const lines = readFileSync(join(OUT, doc.file), 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)
    const { mask } = fenceMask(lines)
    let rows = 0
    for (let i = 0; i + 1 < lines.length; i++) {
      if (mask[i] || mask[i + 1]) continue
      if (!TABLE_ROW_RE.test(lines[i]) || !TABLE_ROW_RE.test(lines[i + 1])) continue
      const head = splitRow(lines[i])
      const delim = splitRow(lines[i + 1])
      if (!isDelim(delim) || delim.length !== head.length) continue
      for (let j = i + 2; j < lines.length && !mask[j] && TABLE_ROW_RE.test(lines[j]); j++) rows += 1
    }
    assert.equal(rows, 0, `${doc.file}: 预置了 ${rows} 行数据（行必须由 checklist 生成）`)
  }
})
