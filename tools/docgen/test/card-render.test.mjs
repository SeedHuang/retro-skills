// agent-card S4 渲染层 常驻测试（testcase: docs/superpowers/specs/2026-10-29-agent-card-s4-render-design-testcase.md）
// 本文件是常驻回归测试、不是 testcase 文件：编写者 = 施工者，不受 `spec-testcase-gate` 的独立编写义务约束
// （spec 的 61 条 testcase 已由独立 `senior-sdet` 交付，本文件只消费它）。
// 计数口径 = 本文件内 `test('S4-TC-` 块个数，必须与 testcase 的 61 条一一对应（附录 A 给了逐 ID 落点）。
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import * as OF from '../components/outputFormats.mjs'
import * as MF from '../card-model/vocab/card-must-fields.mjs'
import * as PRED from '../card-model/vocab/predicates.mjs'
import * as LAND from '../card-model/vocab/landings.mjs'
import * as SH from '../card-model/vocab/shared-actions.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = join(HERE, '..', '..', '..')
const SPEC_PATH = join(REPO, 'docs', 'superpowers', 'specs', '2026-10-29-agent-card-s4-render-design.md')

// ── helper（testcase §0.3 的逐字子集；随 Task 2 / 3 增量补齐，末态必须等于 §0.3）───────────────
const SPEC_LINES = readFileSync(SPEC_PATH, 'utf8').split(/\r?\n/)
const cellsOf = (line) => line.split('|').slice(1, -1).map((c) => c.trim())
// **严格版**：遇第一处非表格行即停（§5.1 主表后紧跟「零散文探针」表，宽松版会混采 → A01 恒红）
const specTableStrict = (headRe) => {
  const start = SPEC_LINES.findIndex((l) => headRe.test(l))
  assert.ok(start >= 0, `spec 缺节 ${headRe}`)
  const out = []
  for (let i = start + 1; i < SPEC_LINES.length; i++) {
    const l = SPEC_LINES[i]
    if (!l.trim().startsWith('|')) { if (out.length > 0) break; continue }
    const c = cellsOf(l)
    if (c.length < 2 || c.every((x) => /^:?-{3,}/.test(x))) continue
    out.push(c)
  }
  assert.ok(out.length > 0, `${headRe} 下必须有一张表`)
  return out
}
const probeSrc = (p) => (p instanceof RegExp ? p.source : String(p))
const PROBE_CLASSES = { oldSegments: '旧段名', declaration: '声明句式', pointers: '指针词' }
const PROSE_PROBES = () => {
  const p = MF.PROSE_PROBES
  assert.ok(p && typeof p === 'object' && !Array.isArray(p), 'PROSE_PROBES 必须是三类分组的对象（spec §3 :62）')
  for (const k of Object.keys(PROBE_CLASSES)) assert.ok(Array.isArray(p[k]) && p[k].length > 0, `PROSE_PROBES.${k} 必须是非空数组（spec §3 :62）`)
  return p
}
// 指针词按 S1 同形判定（词 + 后随章节号/数字），**不是裸子串**（spec §5.1 :143）
const POINTER_FORM = () => {
  const ws = PROSE_PROBES().pointers.map(probeSrc).filter(Boolean)
  assert.ok(ws.length > 0, 'PROSE_PROBES.pointers 必须非空（spec §3 :62 / :143）')
  const esc = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?:${ws.map(esc).join('|')})\\s*(?:§|第|\\d)`, 'g')
}
const hitClass = (text, cls) => (cls === 'pointers'
  ? [...String(text).matchAll(POINTER_FORM())].map((m) => m[0])
  : (PROSE_PROBES()[cls] ?? []).filter((p) => (p instanceof RegExp ? p.test(text) : String(text).includes(p))))
const VOCAB_EXPORTS = {
  'card-must-fields.mjs': ['CARD_SEGMENTS', 'MUST_FIELDS', 'PROSE_PROBES'],
  'predicates.mjs': ['PREDICATES'],
  'landings.mjs': ['LANDINGS'],
  'shared-actions.mjs': ['SHARED_MUST', 'SHARED_NEVER', 'SHARED_USE'],
}
const VOCAB_NS = { 'card-must-fields.mjs': MF, 'predicates.mjs': PRED, 'landings.mjs': LAND, 'shared-actions.mjs': SH }

// ── Task 1（数据层骨架）─────────────────────────────────────────────────────────────────────

test('S4-TC-A07 4 个 vocab/ 表的导出面恰为 spec 写死的 8 个名字', () => {
  const rows = specTableStrict(/\*\*4 个 `vocab\/` 表的导出名与形状/).filter((c) => String(c[0]).includes('.mjs'))
  assert.equal(rows.length, 4, `spec §3 导出名表必须 4 行（实得 ${rows.length}）`)
  const specExports = {}
  for (const c of rows) {
    const file = String(c[0]).replace(/`/g, '').trim()
    const names = String(c[1]).replace(/`/g, '').split('/').map((x) => x.trim()).filter(Boolean)
    assert.ok(file && names.length > 0, `spec 行缺文件名或导出名：${c.join(' | ')}`)
    specExports[file] = names
  }
  assert.deepEqual(specExports, VOCAB_EXPORTS, '本文件的 VOCAB_EXPORTS 必须与 spec §3 导出名表双向相等（spec 改名 → 本断言先红）')
  let total = 0
  for (const [file, names] of Object.entries(VOCAB_EXPORTS)) {
    const ns = VOCAB_NS[file]
    assert.ok(ns && typeof ns === 'object', `${file} 必须可 import（否则导出面无从断言）`)
    assert.deepEqual(Object.keys(ns).sort(), [...names].sort(), `${file} 运行时导出面必须恰为 ${names.join('/')}（多一 / 少一 / 改名即红）`)
    const src = readFileSync(join(REPO, 'tools/docgen/card-model/vocab', file), 'utf8')
    const statics = [...src.matchAll(/^export const (\w+)/gm)].map((m) => m[1]).sort()
    assert.deepEqual(statics, [...names].sort(), `${file} 静态 export 面必须与运行时一致（实得 ${statics.join('/')}）`)
    total += names.length
  }
  assert.equal(total, 8, '四文件导出名合计必须 8 个（spec §3 :62）')
})

test('S4-TC-D01 5 个 outputKind 每份结构化 {fields[], checks[]}（无散文、无指针）', () => {
  const KIND = ['audit', 'issue-card', 'observation', 'evidence', 'testcase']
  assert.ok(OF.outputFormats && typeof OF.outputFormats === 'object', 'outputFormats 必须导出对象（spec §6 :161-164）')
  const got = Object.keys(OF.outputFormats)
  assert.ok(got.length > 0, 'outputFormats 不得为空')
  assert.deepEqual([...got].sort(), [...KIND].sort(), `必须恰好这 5 个 outputKind（实得 ${got.join(',')}）`)
  for (const k of KIND) {
    const f = OF.outputFormats[k]
    assert.ok(f && typeof f === 'object' && !Array.isArray(f), `${k} 必须是结构化对象（现状是散文串）`)
    assert.ok(Array.isArray(f.fields) && f.fields.length > 0, `${k}.fields 必须非空数组`)
    assert.ok(Array.isArray(f.checks) && f.checks.length > 0, `${k}.checks 必须非空数组`)
    const text = JSON.stringify(f)
    for (const x of [...f.fields, ...f.checks]) assert.ok(String(x).trim().length > 0, `${k} 的 fields/checks 不得含空项`)
    assert.equal(hitClass(text, 'pointers').length, 0, `${k} 内不得含指针词（spec §5.1 :143 / PRD :223）：${hitClass(text, 'pointers')[0]}`)
    assert.equal(/doc-taxonomy|references\//.test(text), false, `${k} 内不得带文档路径：${text.slice(0, 120)}`)
  }
})

test('S4-TC-D02 testcase 块存在且写「跑哪条命令 + 什么算失败」', () => {
  const t = OF.outputFormats.testcase
  assert.ok(t && typeof t === 'object', 'spec §6 :171：testcase 块必须新增')
  const text = JSON.stringify(t)
  assert.ok(Array.isArray(t.fields) && t.fields.length >= 5, `testcase 必含节至少 5 项（五要素），实得 ${t.fields?.length}`)
  assert.match(text, /(node\s+--test|npm\s+run\s+check|check-plan\.mjs)/, 'testcase 块必须写「跑哪条命令」（spec §6 :171）')
  assert.match(text, /spec-testcase-gate|check-plan/, '必须指口径单源（规则名 / check-plan 子命令）')
  assert.equal(/docs\/superpowers\/|\.md`?$/.test(text), false, `不得写成文件路径指针：${text.slice(0, 160)}`)
})
