// agent-card S4 渲染层 常驻测试（testcase: docs/superpowers/specs/2026-10-29-agent-card-s4-render-design-testcase.md）
// 本文件是常驻回归测试、不是 testcase 文件：编写者 = 施工者，不受 `spec-testcase-gate` 的独立编写义务约束
// （spec 的 61 条 testcase 已由独立 `senior-sdet` 交付，本文件只消费它）。
// 计数口径 = 本文件内 `test('S4-TC-` 块个数，必须与 testcase 的 61 条一一对应（附录 A 给了逐 ID 落点）。
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync, cpSync, mkdtempSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'

import * as PIPE from '../components/cardPipeline.mjs'
import { agentData, triggerTable } from '../components/agentData.mjs'
import { renderCard } from '../components/renderCard.mjs'
import * as OF from '../components/outputFormats.mjs'
import * as MF from '../card-model/vocab/card-must-fields.mjs'
import * as PRED from '../card-model/vocab/predicates.mjs'
import * as LAND from '../card-model/vocab/landings.mjs'
import * as SH from '../card-model/vocab/shared-actions.mjs'
import * as CM from '../card-model/index.mjs'
import { checkStruct } from '../../execution-matrix/check-agent.mjs'
import { touchedSemanticKeys } from '../cli.mjs'
import { cmdDump } from '../cli.mjs'
import { exitCodeFor } from '../components/validateAgentData.mjs'
import { EXPIRY_LANDED, disposeCardFindings } from '../../observation-check/card-exempt.mjs'

// ── helper（testcase §0.3 逐字；随 Task 2 / 3 增量补齐，末态必须等于 §0.3）─────────────────────
const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = join(HERE, '..', '..', '..')
const AGENTS_DIR = join(REPO, 'agents')
const DOC_AGENTS_DIR = join(REPO, 'docs', 'agents')
const SPEC_PATH = join(REPO, 'docs', 'superpowers', 'specs', '2026-10-29-agent-card-s4-render-design.md')
const S1_SPEC_PATH = join(REPO, 'docs', 'superpowers', 'specs', '2026-10-29-agent-card-s1-card-model-design.md')
const PRD_PATH = join(REPO, 'docs', 'prd', '20261026205821-agent-card-contract.md')
// `registered-ids.mjs` 的本段基线（S4-TC-I02 的「零接触」内容锚；S2/S3 正式切换该文件时同批更新）
const REGISTERED_IDS_SHA = '56F142FF287A555701005F77B169669CEA24AF280E0F956D0BFDBC54FDC0161B'

const NON_PARL = ['evidence-reader', 'senior-sdet'] // spec §4 :97 点名的两个非议会席
const SEATS = agentData.map((a) => a.name)
const PARL = SEATS.filter((s) => !NON_PARL.includes(s))
const CARD_FILES = readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3))
assert.ok(SEATS.length > 0, 'agentData 不得为空')
assert.ok(PARL.length > 0 && NON_PARL.every((s) => SEATS.includes(s)), '议会 / 非议会两侧都必须非空（§4 :97）')
assert.ok(CARD_FILES.length > 0, 'agents/*.md 不得为空')

const TARGETS = [...CARD_FILES.map((s) => `agents/${s}.md`), 'docs/agents/README.md', ...SEATS.map((s) => `docs/agents/${s}.md`)]
assert.equal(TARGETS.length, 2 * SEATS.length + 1, '生成物 / 比对面必须 = 2×席数+1（§1 :20）')

const RS = (s) => {
  const r = PIPE.renderSeat(s)
  assert.ok(r && typeof r.card === 'string' && r.card.length > 0, `renderSeat(${s}).card 必须非空（§4 :83 单席原子）`)
  assert.ok(typeof r.readme === 'string' && r.readme.length > 0, `renderSeat(${s}).readme 必须非空（§5 :116）`)
  return r
}
const CARD = (s) => RS(s).card
const ALL = () => {
  const r = PIPE.renderAll()
  assert.ok(r && Array.isArray(r.cards) && r.cards.length === SEATS.length, `renderAll().cards 数必须 = 席数 ${SEATS.length}`)
  assert.ok(Array.isArray(r.readmes) && r.readmes.length === SEATS.length, 'renderAll().readmes 必须每席一份')
  assert.ok(typeof r.index === 'string' && r.index.length > 0, 'renderAll().index 必须非空')
  return r
}
const readmeOnDisk = (s) => {
  const p = join(DOC_AGENTS_DIR, `${s}.md`)
  assert.ok(existsSync(p), `README 缺 ${p}（§5 :116 落点 = docs/agents/）`)
  return readFileSync(p, 'utf8')
}

const TERM_RE = /议长|主持人/ // §5.2 :152-155
const DERIVED_DESC_RE = /在[^。\n]{0,20}中担任/ // §10-D3 :216
const probeSrc = (p) => (p instanceof RegExp ? p.source : String(p))
const PROBE_CLASSES = { oldSegments: '旧段名', declaration: '声明句式', pointers: '指针词' } // §5.1 :139-143 的「类」列
const PROSE_PROBES = () => {
  const p = MF.PROSE_PROBES
  assert.ok(p && typeof p === 'object' && !Array.isArray(p), 'PROSE_PROBES 必须是三类分组的对象（§3 :62）')
  for (const k of Object.keys(PROBE_CLASSES)) assert.ok(Array.isArray(p[k]) && p[k].length > 0, `PROSE_PROBES.${k} 必须是非空数组（§3 :62）`)
  return p
}
// 指针词按 S1 同形判定（词 + 后随章节号/数字），**不是裸子串**（§5.1 :143；S1 validateCardModel.mjs:96-101 的 pointerHit）
const POINTER_FORM = () => {
  const ws = PROSE_PROBES().pointers.map(probeSrc).filter(Boolean)
  assert.ok(ws.length > 0, 'PROSE_PROBES.pointers 必须非空（§3 :62 / :143）')
  const esc = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?:${ws.map(esc).join('|')})\\s*(?:§|第|\\d)`, 'g')
}
const hitClass = (text, cls) => (cls === 'pointers'
  ? [...String(text).matchAll(POINTER_FORM())].map((m) => m[0])
  : (PROSE_PROBES()[cls] ?? []).filter((p) => (p instanceof RegExp ? p.test(text) : String(text).includes(p))))

const SPEC_LINES = readFileSync(SPEC_PATH, 'utf8').split(/\r?\n/)
const specLine = (n) => {
  const l = SPEC_LINES[n - 1]
  assert.ok(typeof l === 'string' && l.length > 0, `spec :${n} 不得为空（spec 行号已漂移）`)
  return l
}
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
const SPEC_SEGMENTS = specTableStrict(/^### 5\.1/).map((c) => c[0]).filter((s) => s && s !== '段').map((s) => s.replace(/`/g, '').trim())
const SPEC_7 = SPEC_SEGMENTS.filter((s) => s !== 'front matter') // §3 :62 的 CARD_SEGMENTS = 7 段
const SEGS = () => {
  const v = MF.CARD_SEGMENTS
  assert.ok(Array.isArray(v) && v.length === SPEC_7.length, `CARD_SEGMENTS 必须是 ${SPEC_7.length} 个段名（§3 :62），实得 ${Array.isArray(v) ? v.length : typeof v}`)
  return v.map((s) => String(s).replace(/`/g, '').trim())
}
const MUST_FIELDS = () => {
  const v = MF.MUST_FIELDS
  assert.ok(Array.isArray(v) && v.length > 0, 'MUST_FIELDS 必须是非空数组（§3 :62）')
  return v.map(String)
}
// S1 spec §7「族 | 码 | 判定面 | 判据」表的脚本码集（F10 / G01 共用的派生口径，不写死码数）
const S1_CODES = () => {
  const L = readFileSync(S1_SPEC_PATH, 'utf8').split(/\r?\n/)
  const start = L.findIndex((l) => /^##\s*7\s/.test(l))
  assert.ok(start >= 0, 'S1 spec 必须含 §7 码表（否则码数无从派生）')
  const head = L.findIndex((l, i) => i > start && /^\|\s*族\s*\|/.test(l))
  assert.ok(head >= 0, 'S1 spec §7 必须有「族 | 码 | 判定面 | 判据」表')
  const out = new Set()
  for (let i = head; i < L.length; i++) {
    if (!L[i].trim().startsWith('|')) break
    const m = /^\|\s*[^|]+\s*\|\s*`([\w.-]+)`\s*\|/.exec(L[i])
    if (m && !/^\|\s*manual\s*\|/.test(L[i])) out.add(m[1])
  }
  assert.ok(out.size > 0, 'S1 spec §7 必须切出脚本码（否则下面的对账恒真）')
  return out
}
const VOCAB_EXPORTS = {
  'card-must-fields.mjs': ['CARD_SEGMENTS', 'MUST_FIELDS', 'PROSE_PROBES'],
  'predicates.mjs': ['PREDICATES'],
  'landings.mjs': ['LANDINGS'],
  'shared-actions.mjs': ['SHARED_MUST', 'SHARED_NEVER', 'SHARED_USE'],
}
const VOCAB_NS = { 'card-must-fields.mjs': MF, 'predicates.mjs': PRED, 'landings.mjs': LAND, 'shared-actions.mjs': SH }
const WRITE_ALL = () => {
  assert.equal(typeof PIPE.writeAll, 'function', 'cardPipeline.writeAll 必须是函数（§3 :71 共用落盘实现）')
  return PIPE.writeAll
}

const walkFiles = (dir, out = []) => {
  if (!existsSync(dir)) return out
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) { if (!['node_modules', '.git'].includes(e.name)) walkFiles(p, out) }
    else if (/\.(mjs|md|json|tpl)$/.test(e.name)) out.push(p)
  }
  return out
}
const runNode = (args, cwd = REPO, env = null) => {
  const r = spawnSync(process.execPath, args, { cwd, encoding: 'utf8', env: env ? { ...process.env, ...env } : process.env })
  return { code: r.status ?? -1, out: `${r.stdout ?? ''}${r.stderr ?? ''}` }
}
const runCli = (args, cwd = REPO, env = null) => runNode(['tools/docgen/cli.mjs', ...args], cwd, env)

// 临时副本（同 tools/docgen/acceptance/cold-run.mjs 的做法）：已跟踪 + 未跟踪未忽略文件一起复制
// 为什么补 --others：`docs/agents/**` 是新增未提交文件，只复制 ls-files 会让副本缺生成物 → 恒红/恒绿
const coldRepo = ({ mutate = null, args = ['gate'], verify = null } = {}) => {
  const copy = mkdtempSync(join(tmpdir(), 's4-tc-'))
  const list = (argv) => execFileSync('git', ['-c', 'core.quotePath=false', ...argv], { cwd: REPO, encoding: 'utf8' })
    .trim().split(/\r?\n/).filter((f) => f && !f.startsWith('.git/'))
  const files = [...new Set([...list(['ls-files']), ...list(['ls-files', '--others', '--exclude-standard'])])]
  for (const f of files) {
    const src = join(REPO, f)
    if (!existsSync(src)) continue
    const dst = join(copy, f)
    mkdirSync(dirname(dst), { recursive: true })
    cpSync(src, dst)
  }
  if (existsSync(DOC_AGENTS_DIR)) cpSync(DOC_AGENTS_DIR, join(copy, 'docs', 'agents'), { recursive: true })
  if (mutate) mutate(copy)
  mkdirSync(join(copy, '.drafts'), { recursive: true })
  const r = runCli(args, copy, {
    DOCGEN_DRAFTS_DIR: join(copy, '.drafts'),
    DOCGEN_STATE_PATH: join(copy, 'tools/docgen/state.json'),
    DOCGEN_EVIDENCE_DIR: join(copy, 'tools/docgen/fixtures'),
  })
  try { if (verify) verify(copy, r) } finally { rmSync(copy, { recursive: true, force: true }) }
  return r
}

// 构造向量（§0.4）：改本席 card 数据（不改源文件；用完还原）/ 副本内注入坏卡 / 追加 1 字节
const mutCard = (seat, fn) => {
  const a = agentData.find((x) => x.name === seat)
  assert.ok(a && a.card && typeof a.card === 'object', `${seat} 必须已有 card 数据（§4 :80）`)
  const keep = structuredClone(a.card)
  fn(a.card, keep)
  return () => { a.card = keep }
}
const INJECT_BAD = (predicate = 'no.such.predicate') => (copy) => {
  const p = join(copy, 'tools/docgen/components/agentData.mjs')
  const src = readFileSync(p, 'utf8')
  assert.ok(src.length > 0, 'agentData.mjs 必须非空')
  writeFileSync(p, `${src}\n;(agentData[0].card.must[0].criterion = '${predicate}');\n`, 'utf8')
}
const APPEND_ONE_BYTE = (rel) => (copy) => {
  const p = join(copy, rel)
  assert.ok(existsSync(p), `副本内缺 ${rel}`)
  writeFileSync(p, `${readFileSync(p, 'utf8')}x`, 'utf8')
}

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

// ── Task 2（装配与三投影）───────────────────────────────────────────────────────────────────
// 落点说明（施工期增量登记，非判据级）：Task 2 不迁移任何席 → 依赖真席的用例按前置在 Task 5/6/7 落；
// 本 Task 落两条**不依赖真席**的用例（静态面 + 落盘原子面）。

test('S4-TC-I04 数据源单向：renderCard / cardPipeline 无 readFileSync / AGENTS_DIR', () => {
  const RC = readFileSync(join(REPO, 'tools/docgen/components/renderCard.mjs'), 'utf8')
  const PL = readFileSync(join(REPO, 'tools/docgen/components/cardPipeline.mjs'), 'utf8')
  assert.ok(RC.length > 0 && PL.length > 0, '两个渲染模块必须已落（否则本用例空转）')
  const scan = (src) => ['readFileSync', 'readdirSync', 'AGENTS_DIR'].filter((w) => src.includes(w))
  assert.deepEqual(scan(RC), [], `renderCard 不得读 agents/（V-6 / §3 :73），实得 ${scan(RC).join(',')}`)
  assert.deepEqual(scan(PL), [], `cardPipeline 不得读 agents/（V-6），实得 ${scan(PL).join(',')}`)
  const CLI = readFileSync(join(REPO, 'tools/docgen/cli.mjs'), 'utf8')
  assert.ok(CLI.includes('AGENTS_DIR') && CLI.includes('readFileSync'), 'gate 侧（cli.mjs）必须仍读 agents/ 作比对（对照面）')
  const hits = coldRepo({ mutate: (copy) => {
    const p = join(copy, 'tools/docgen/components/renderCard.mjs')
    writeFileSync(p, `${readFileSync(p, 'utf8')}\nimport { readFileSync as __rf } from 'node:fs';\n`, 'utf8')
  }, args: ['gate'], verify: (copy) => {
    const src = readFileSync(join(copy, 'tools/docgen/components/renderCard.mjs'), 'utf8')
    assert.ok(scan(src).length > 0, '注入 readFileSync 后扫描必须命中（否则探针面写错 → I04 是假绿）')
  } })
  assert.ok(hits.code === 0 || hits.code === 1, '副本 gate 只要跑完即可（本用例判扫描命中）')
})

test('S4-TC-J02 写盘后无 .part / tmp 残留', () => {
  const st = execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: REPO, encoding: 'utf8' })
  const stray = st.split(/\r?\n/).filter(Boolean).filter((l) => /\.part(\.|$)|\btmp\b|\btmp-/.test(l))
  assert.deepEqual(stray, [], `写盘后不得残留 tmp / .part（§7① :179）：${stray.slice(0, 5).join(' | ')}`)
  const WA = readFileSync(join(REPO, 'tools/docgen/components/cardPipeline.mjs'), 'utf8')
  assert.ok(WA.length > 0, 'cardPipeline.mjs 必须已落（§3 :71）')
  assert.ok(WA.includes('.tmp-'), 'writeAll 的临时文件命名必须含 `.tmp-<pid>` 形态（§3 :71②）')
})

// ── Task 3（审计承接：EXIT 表 + A1/A2 锚点迁移）─────────────────────────────────────────────

test('S4-TC-A08 touchedSemanticKeys 认「职责」段（A1/A2 锚点迁移，§10-D11）', () => {
  assert.equal(typeof touchedSemanticKeys, 'function', 'touchedSemanticKeys 必须可 import（§10-D11 :224）')
  const mk = (head, body) => `## ${head}\n${body}\n## 边界\n`
  for (const head of ['职责', '你是谁', '身份']) {
    const keys = touchedSemanticKeys(mk(head, '旧内容'), mk(head, '新内容'))
    assert.ok(Array.isArray(keys) && keys.includes('A1'), `改「${head}」段必须触发 A1（§10-D11 :224 的段名映射须认这三形态），实得 ${(keys ?? []).join(',')}`)
  }
  const k2 = touchedSemanticKeys('description: 旧\n## 职责\n同\n', 'description: 新\n## 职责\n同\n')
  assert.ok(k2.includes('A2'), `description 行改动必须触发 A2，实得 ${k2.join(',')}`)
  const CLI = readFileSync(join(REPO, 'tools/docgen/cli.mjs'), 'utf8')
  assert.ok(CLI.includes('职责'), 'cli.mjs 的段名映射必须同批补「职责」（§10-D11 :224；否则铺满后改职责永不触发 A1 重判）')
})

test('S4-TC-F10 拒绝码 → exit 1（EXIT 表承接 S1 码；WeakReason 不入表）', () => {
  assert.equal(typeof exitCodeFor, 'function', 'exitCodeFor 必须可 import（§10-D12 :225）')
  const codes = Object.keys(CM.CARD_MODEL_CODES ?? {})
  // 码数从 S1 spec §7 表**派生**（第三方通道；不写死字面量——`dev-workflow-counts` 的计数器探针要求派生式）
  const specCodes = S1_CODES()
  assert.deepEqual([...codes].sort(), [...specCodes].sort(), `S1 脚本码表必须与 spec §7 逐项相等（实得 ${codes.length} 个，spec 切出 ${specCodes.size} 个）`)
  for (const c of codes) assert.equal(exitCodeFor(c), 1, `${c} 必须归 exit 1（§10-D12 :225；不得落 2）`)
  for (const c of ['DuplicateStatement', 'OverrideWithoutReason', 'PointlessOverride']) assert.equal(exitCodeFor(c), 1, `合并码 ${c} 必须归 exit 1（§10-D12）`)
  assert.throws(() => exitCodeFor('WeakReason'), /未知错误码/, 'WeakReason 是 manual，不得入 EXIT 表（§10-D12 :225）')
  assert.equal(exitCodeFor('DanglingBaselineEntry'), 2, '既有码 DanglingBaselineEntry 仍为 2（§7③ :181 沿用；既有映射不动）')
})

// ── Task 4（上游文档同批：PRD 两处 + docs-convention 一行）──────────────────────────────────

test('S4-TC-K01 D1 / D5 的上游同批改在位（PRD §3.7 段表 9 行 + subject 枚举行无省略号）', () => {
  const prd = readFileSync(PRD_PATH, 'utf8')
  assert.ok(prd.length > 0, `PRD 必须可读：${PRD_PATH}`)
  const L = prd.split(/\r?\n/)
  const h = L.findIndex((l) => /^###\s*3\.7/.test(l))
  assert.ok(h >= 0, 'PRD 必须含 §3.7 标题（D1 :214 的落点节）')
  // 定位「卡面段清单」表（§3.7 内有 2 张表：三投影表 + 段表；判据要的是段表，按表头行锚定、
  // 遇第一处非表格行即停。施工期增量登记：判据「末列含输出格式 + 去掉 front matter 后恰 7 段」不变；
  // 行数口径按表实况 = 表头 + front matter + 7 段 = 9（spec D1 的「6→7 段」说的是段数，不是含表头行数）
  const head = L.findIndex((l, i) => i > h && /^\|\s*段\s*\|/.test(l))
  assert.ok(head >= 0, 'PRD §3.7 必须有「卡面段清单」表（表头 `| 段 | 数据来源 | 必渲染 |`）')
  let rows = 0
  let hasOut = false
  let segsOnly = 0
  for (let i = head; i < L.length; i++) {
    const l = L[i]
    if (!l.trim().startsWith('|')) break
    const cells = l.split('|').slice(1, -1).map((c) => c.trim())
    if (cells.length > 0 && cells.every((c) => /^:?-{3,}/.test(c))) continue
    rows += 1
    if (cells[0] !== '段') {
      if (cells[0] !== 'front matter') segsOnly += 1
    }
    if (cells.some((c) => c.includes('输出格式'))) hasOut = true
  }
  assert.ok(rows > 0, 'PRD §3.7 段表必须存在（否则本用例空转）')
  assert.equal(rows, 9, `PRD §3.7 段表必须 = 表头 + front matter + 7 段 = 9 行（D1 :214 承诺 6→7 段），实得 ${rows}`)
  assert.equal(segsOnly, 7, `去掉 front matter 后必须恰 7 段（实得 ${segsOnly}）`)
  assert.equal(hasOut, true, '段表必须含「输出格式」行（D1 的「表内插行」落地，不是表外追加）')
  // 2026-10-31 代码审查修复：D5 的落点行在 §3.7 插行后已下移到 :294，原 `L[292]` 指到 `instance:` 行（该行永不含 `…`）→ 断言空转。
  // 改为**内容锚**定位 subject 枚举行（行号再漂移也不影响判定）；判据句「不得含 '…'」不变。
  const hj = L.findIndex((l, i) => i > h && l.includes("subject: 'reviewer-detective.card'"))
  assert.ok(hj >= 0, 'PRD 必须含 subject 枚举行（D5 :218 的落点行，按内容锚定）')
  const l293 = L[hj]
  assert.equal(l293.includes('…'), false, `subject 枚举行不得再含 '…' 省略号（D5 :218），实得：${l293}`)
})

test('S4-TC-J04 docs-convention 同批补一行 + scope-sweep --check exit 0', () => {
  const conv = readFileSync(join(REPO, 'rules/docs-convention.md'), 'utf8')
  assert.ok(conv.includes('docs/agents'), 'D2 :215：docs-convention 目录表必须同批补 docs/agents/ 一行（否则规则与目录两处说法）')
  const sw = runNode(['scripts/scope-sweep.mjs', '--check'])
  assert.equal(sw.code, 0, `R8 改判回扫必须 exit 0（实得 ${sw.code}）：${sw.out.slice(0, 300)}`)
  assert.match(sw.out, /sweep ok/, '末行必须是 sweep ok（判据只认退出码与末行）')
})

// ── Task 5（试点席 detective-observer 迁移）────────────────────────────────────────────────

test('S4-TC-C06 试点席迁移后「议长」= 0 且「主持人」在位', () => {
  const s = 'detective-observer'
  assert.ok(SEATS.includes(s), `${s} 必须真实存在`)
  assert.ok(PARL.includes(s), `${s} 必须是议会席（§4 :97；非议会席口径由 C03 守）`)
  const disk = readFileSync(join(AGENTS_DIR, `${s}.md`), 'utf8')
  assert.ok(disk.length > 200, `${s} 卡面不得为空或过短（否则 0 命中是假绿）`)
  assert.equal((disk.match(/议长/g) ?? []).length, 0, `迁移后 ${s} 卡面不得再出现「议长」（§5.2 :154 要求统一为「主持人」）`)
  assert.ok((disk.match(/主持人/g) ?? []).length >= 1, `${s} 卡面必须保留「主持人」（过渡期议会席允许，不得两词全删）`)
  assert.equal((CARD(s).match(/议长/g) ?? []).length, 0, `渲染投影同样不得含「议长」（§5.2 :154）`)
})

test('S4-TC-H01 试点先行：归档副本在位且 7 段逐段对照', () => {
  const p = join(REPO, 'docs', 'reports', '2026-10-30-agent-card-s4-pilot-contrast.md')
  assert.equal(existsSync(p), true, '试点对照稿的**归档副本**必须存在（§8 步 1 :190；.session/ 那份不进 git，只作手动项）')
  const t = readFileSync(p, 'utf8')
  assert.ok(t.length > 0, '归档副本不得为空')
  for (const seg of SPEC_7) assert.ok(t.includes(seg), `对照稿必须逐段对照：缺「${seg}」`)
  assert.match(t, /差异|一致|相同/, '对照稿必须含差异清单（不是复制旧卡）')
  assert.ok(t.includes('detective-observer') || t.includes('侦探'), '试点席必须是侦探席（PRD A-4 :55）')
})

test('S4-TC-H03 出数门槛：git log -1 --numstat 可跑且单席改动行数 > 0', () => {
  const out = execFileSync('git', ['log', '-1', '--numstat', '--format=', '--', 'agents/', 'tools/docgen/'], { cwd: REPO, encoding: 'utf8' })
    .trim().split(/\r?\n/).filter(Boolean)
  assert.ok(out.length > 0, '必须取到「最近一次触及 agents/ 或 tools/docgen/ 的提交」的 numstat（§8 步 2 :191）')
  const nums = out.map((l) => Number(l.split('\t')[0])).filter((n) => Number.isFinite(n))
  assert.ok(nums.length > 0, 'numstat 行必须可解析出新增行数')
  assert.ok(nums.reduce((a, b) => a + b, 0) > 0, '单席改动行数必须 > 0（否则工期公式无输入）')
})

// ── 2026-10-31 ④ 段：回 ② 改判的两条（A02 / F05，现行判据见 testcase 日期注）───────────────

test('S4-TC-A02 数据层逐键删除：6 非结构键被拒 + 6 结构键由派生 / 合并值恢复', () => {
  const KEYS = ['seat', 'name', 'description', 'tools', 'duty', 'scenes', 'signals', 'must', 'never', 'categories', 'checkItems', 'rationale']
  const SEAT_DERIVED = ['seat', 'name', 'description', 'tools'] // §4 :90 由 seatEntry 派生
  const MERGE_DERIVED = ['must', 'never'] // §4 :91 共享层 + 本席合并
  const PLAIN = KEYS.filter((k) => !SEAT_DERIVED.includes(k) && !MERGE_DERIVED.includes(k))
  assert.equal(KEYS.length, 12, 'spec §4 :89 写死 Card = 12 键（前置非空）')
  assert.equal(PLAIN.length, 6, '非结构键必须 6 个（12 − 4 派生 − 2 合并）')
  const b0 = PIPE.buildCards()[0]
  assert.ok(b0 && b0.card && typeof b0.card === 'object', 'buildCards()[0].card 必须存在（§4 :81）')
  const base = structuredClone(b0.card)
  for (const k of KEYS) assert.ok(k in base, `基线卡必须 12 键齐：缺 ${k}（前置失败 → 本用例无从构造）`)
  let refused = 0
  for (const k of PLAIN) { // ① 非结构键：数据层删除 → 装配层拒绝
    const restore = mutCard(b0.seat, (card) => { delete card[k] })
    try {
      const built = PIPE.buildCards().find((b) => b.seat === b0.seat)
      assert.ok(built && Array.isArray(built.errors) && built.errors.length > 0, `删 ${k} 后必须报 errors（§4 :89 / :98），实得静默通过`)
      refused += 1
    } finally { restore() }
  }
  for (const k of SEAT_DERIVED) { // ② 派生键：删除后由派生值恢复
    const restore = mutCard(b0.seat, (card) => { delete card[k] })
    try {
      const built = PIPE.buildCards().find((b) => b.seat === b0.seat)
      assert.ok(built && built.errors.length === 0, `派生键 ${k} 删除不得报错（spec §4 :90）`)
      assert.deepEqual(built.card[k], base[k], `派生键 ${k} 必须由派生值恢复（不得留空）`)
    } finally { restore() }
  }
  const use = SH.SHARED_USE[b0.seat] ?? []
  for (const [k, list] of [['must', SH.SHARED_MUST], ['never', SH.SHARED_NEVER]]) { // ③ 合并键：共享层重建
    const restore = mutCard(b0.seat, (card) => { delete card[k] })
    try {
      const built = PIPE.buildCards().find((b) => b.seat === b0.seat)
      assert.ok(built && built.errors.length === 0, `${k} 删除不得报错（由共享层重建，§4 :91）`)
      assert.deepEqual(built.card[k], list.filter((a) => use.includes(a.id)), `${k} 必须恢复为「共享层 ∩ 本席 use」的合并结果`)
    } finally { restore() }
  }
  assert.equal(refused, 6, '6 个非结构键逐键都必须被拒（§4 :89）；6 个结构键由派生 / 合并值恢复')
})

test('S4-TC-F05 接管完整性：删一席 / 非 replaced 席带人读投影 → 必红（对照必绿）', () => {
  const drop = SEATS[0]
  const r1 = coldRepo({ mutate: (copy) => {
    const p = join(copy, 'tools/docgen/state.json')
    const st = JSON.parse(readFileSync(p, 'utf8'))
    assert.ok(st && st.agents && typeof st.agents === 'object', 'state.json 必须有 agents 对象')
    assert.ok(Object.prototype.hasOwnProperty.call(st.agents, drop), `${drop} 必须先在 state 里`)
    delete st.agents[drop]
    writeFileSync(p, `${JSON.stringify(st, null, 2)}\n`, 'utf8')
  }, args: ['gate'], verify: (copy) => {
    const st = JSON.parse(readFileSync(join(copy, 'tools/docgen/state.json'), 'utf8'))
    assert.equal(Object.keys(st.agents).length, SEATS.length - 1, '副本 state 必须真的少一席（否则空转）')
  } })
  assert.equal(r1.code, 1, `state 缺一席必须 gate exit 1（实得 ${r1.code}）：${r1.out.slice(0, 300)}`)
  assert.ok(r1.out.includes(drop), `必须点名缺的那一席 ${drop}`)
  const mid = SEATS[1]
  const r2 = coldRepo({ mutate: (copy) => {
    const p = join(copy, 'tools/docgen/state.json')
    const st = JSON.parse(readFileSync(p, 'utf8'))
    st.agents[mid] = 'suspended' // 非 replaced（值域仅 replaced / suspended，state.mjs:9）
    writeFileSync(p, `${JSON.stringify(st, null, 2)}\n`, 'utf8')
    assert.equal(existsSync(join(copy, `docs/agents/${mid}.md`)), true, '构造要求该席 README 先存在（否则无从成立）')
  }, args: ['gate'] })
  assert.equal(r2.code, 1, `非 replaced 席却带人读投影必须 gate exit 1（实得 ${r2.code}；§7④ :182 子集判据）：${r2.out.slice(0, 300)}`)
  assert.ok(r2.out.includes(mid), `必须点名未接管的席 ${mid}`)
  assert.match(r2.out, /不得带人读投影/, '必须命中中期子集判据文案（spec §7④ :182）')
  const clean = coldRepo({ args: ['gate'] })
  assert.equal(clean.code, 0, `未删未造时同一副本必须 exit 0（防「state 一脏就红」）：${clean.out.slice(0, 300)}`)
})

// ── 2026-10-31 ④ 段：A 组（卡面结构 / 段序 / A3–A7 / rationale 落点）──────────────────────────

test('S4-TC-A01 15 卡 7 段齐 + 每段必渲染字段在位（单源 = card-must-fields.mjs）', () => {
  const segs = SEGS()
  assert.deepEqual(segs, SPEC_7, 'CARD_SEGMENTS 必须逐项等于 spec §5.1 主表首列去 front matter（§3 :62 的 7 段）')
  assert.equal(SPEC_SEGMENTS.length, 8, 'spec §5.1 主表必须切出 8 行（严格切法；混入「零散文探针」表即 11 行 → 本断言先红）')
  assert.equal(segs.length, 7, 'CARD_SEGMENTS 必须是 7 段（§3 :62）')
  assert.equal(SEATS.length, CARD_FILES.length, '席集与卡文件集必须等长（外部集合相等，不是循环内自比）')
  const fields = MUST_FIELDS()
  for (const f of ['trigger', 'objects', 'criterion', 'landing', 'requires']) {
    assert.ok(fields.includes(f), `spec §5.1 :127 的必渲染项 ${f} 必须登记在 MUST_FIELDS（数组）`)
  }
  for (const s of SEATS) {
    const t = CARD(s)
    assert.ok(typeof t === 'string' && t.length > 200, `${s} 卡面不得为空或过短（否则存在性断言空转）`)
    assert.match(t, /^---[\s\S]*?name:\s*\S+/m, `${s} 卡面缺 front matter / name（§5.1 :125）`)
    for (const seg of segs) assert.ok(t.includes(`## ${seg}`), `${s} 卡面缺「## ${seg}」节（§5.1 :126-132）`)
    const body = t.split(/^## 一定会/m)[1].split(/^## /m)[0]
    assert.ok(body && body.length > 0, `${s} 的「一定会」段不得为空`)
    for (const f of fields) assert.ok(body.includes(f), `${s} 的「一定会」段缺必渲染项 ${f}`)
  }
})

test('S4-TC-A03 卡面二级节名 / 顺序逐项等于 CARD_SEGMENTS（多段 · 删第 4 段 · 换序）', () => {
  const WANT = SEGS()
  assert.equal(WANT.length, 7, `7 段必须成立（实得 ${WANT.length}）`)
  const heads = (t) => t.split(/\r?\n/).filter((l) => /^## /.test(l)).map((l) => l.slice(3).trim())
  for (const s of SEATS) {
    const got = heads(CARD(s))
    assert.equal(got.length, WANT.length, `${s} 的二级节数必须 = 7（多段 / 少段均红，实得 ${got.length}）`)
    assert.deepEqual(got, WANT, `${s} 的二级节名 / 顺序必须逐项等于 CARD_SEGMENTS`)
  }
  const t = CARD(SEATS[0])
  const skip = WANT[3]
  const next = WANT[4]
  const minus = t.replace(new RegExp(`^## ${skip}\n[\\s\\S]*?(?=^## ${next})`, 'm'), '')
  const plus = `${t}\n## 附注\n`
  const swapped = t.replace(`## ${WANT[4]}`, '@@A@@').replace(`## ${WANT[5]}`, `## ${WANT[4]}`).replace('@@A@@', `## ${WANT[5]}`)
  assert.equal(heads(minus).length, 6, `删第 4 段必须真的少一段（实得 ${heads(minus).length}；若为 7 说明正则未命中）`)
  assert.notDeepEqual(heads(minus), WANT, '少一段必须被判红')
  assert.notDeepEqual(heads(plus), WANT, '多一段必须被判红')
  assert.notDeepEqual(heads(swapped), WANT, '换序必须被判红')
})

test('S4-TC-A04 7 段模板同时满足执行力度矩阵 A3–A7', () => {
  for (const s of SEATS) {
    const t = CARD(s)
    assert.ok(typeof t === 'string' && t.length > 0)
    const r = checkStruct(t)
    assert.deepEqual(r.findings, [], `${s} 卡面必须 A3–A7 全绿，实得 ${JSON.stringify(r.findings)}`)
    assert.ok(r.notes.some((n) => n.startsWith('A4')), `${s} 的 A4 必须被真判过（notes 缺 A4）`)
    assert.ok(r.notes.some((n) => n.startsWith('A5')), `${s} 的 A5 必须被真判过（notes 缺 A5）`)
  }
})

test('S4-TC-A05 A3–A7 判别力：四处变异各红一处（按表头行定位）', () => {
  const L134 = specLine(134)
  const mustHeader = /「一定会」表头 `(\|[^`]+)`/.exec(L134)
  const a4 = /A4（`([^`]+)`）/.exec(L134)
  const a5 = /A5（`([^`]+)`）/.exec(L134)
  assert.ok(mustHeader && a4 && a5, 'spec :134 必须写死「一定会」表头 + A4/A5 字样三处（切不到 = 行号漂移或 spec 改词）')
  const t0 = CARD(SEATS[0])
  for (const x of [mustHeader[1].trim(), a4[1], a5[1]]) assert.ok(t0.includes(x), `卡面必须含 spec :134 写死的串「${x}」`)
  const headerLine = t0.split(/\r?\n/).find((l) => l.startsWith('| # | 必问（must）'))
  assert.ok(headerLine, '卡面必须含 spec :134 写死的「一定会」表头行（按行定位，不做全局首个替换）')
  const c3 = checkStruct(t0.replace(headerLine, headerLine.split('必问（must）').join('检查项')))
  assert.deepEqual(c3.findings.map((f) => f.code), ['A3'], '表头行不再含「必问」→ 只应红 A3')
  const c4 = checkStruct(t0.split(/\r?\n/).filter((l) => !l.includes(a4[1])).join('\n'))
  assert.deepEqual(c4.findings.map((f) => f.code), ['A4'], '删 A4 字样 → 只应红 A4')
  const c6 = checkStruct(t0.split(/\r?\n/).filter((l) => !/^## 边界/.test(l)).join('\n'))
  assert.deepEqual(c6.findings.map((f) => f.code), ['A6'], '删「边界」节 → 只应红 A6')
  const c7 = checkStruct(t0.split(/\r?\n/).filter((l) => !/^## 输出格式/.test(l)).join('\n'))
  assert.deepEqual(c7.findings.map((f) => f.code), ['A7'], '删「输出格式」节 → 只应红 A7')
})

test('S4-TC-A06 rationale 只在 README、不进卡面', () => {
  // 2026-10-31 ④：§2 的「首 12 字窗」在多数席上会与 duty 合法复用（假阳性）→ 选择器改为「首窗 + 尾窗都不在卡面」的席；
  // 并追加尾窗断言（**强化**，非放宽）：防「只渲染部分 rationale」逃检（见 quality-4 §6 G-5）。
  const stripped = (t) => String(t).replace(/\s+/g, '')
  const pick = () => {
    for (const x of SEATS) {
      const c = PIPE.buildCards().find((b) => b.seat === x)
      if (!c || typeof c.card.rationale !== 'string') continue
      const full = stripped(c.card.rationale)
      if (full.length < 24) continue
      const card = stripped(CARD(x))
      const head = full.slice(0, 12)
      const tail = full.slice(-12)
      if (!card.includes(head) && !card.includes(tail)) return { s: x, full, head, tail }
    }
    return null
  }
  const hit = pick()
  assert.ok(hit, '必须至少一席的 rationale ≥24 字且首/尾 12 字窗都不在卡面（否则本用例无从构造，§5 :116）')
  const { s, full, head, tail } = hit
  const card = stripped(CARD(s))
  assert.equal(card.includes(full), false, `${s} 卡面不得渲染 rationale（§5.1 :135）`)
  assert.equal(card.includes(head), false, `${s} 卡面不得渲染 rationale 首 12 字窗（§2 A06）`)
  assert.equal(card.includes(tail), false, `${s} 卡面不得渲染 rationale 尾 12 字窗（强化：防部分渲染逃检）`)
  assert.ok(stripped(RS(s).readme).includes(head), `${s} 的 README 投影必须含 rationale（§12-R3 :242 搬落点）`)
  assert.ok(stripped(readmeOnDisk(s)).includes(tail), `${s} 落盘 README 必须含 rationale 尾窗`)
})

// ── 2026-10-31 ④ 段：B 组（三投影同源 / 落盘 README+index / 覆盖记录 / dump）──────────────────

test('S4-TC-B01 三投影同源：同一 renderSeat() 的 card / readme 与 dump 对同一字段逐字一致', () => {
  const s = SEATS[0]
  const r = RS(s)
  const cli = runCli(['dump', '--name', s])
  assert.equal(cli.code, 0, `dump 必须 exit 0（实得 ${cli.code}）：${cli.out.slice(0, 300)}`)
  const d = JSON.parse(cli.out.trim())
  assert.ok(d && typeof d === 'object', 'dump 必须是可解析 JSON 对象（§5 :117）')
  assert.equal(d.seat, s, 'dump.seat 必须 = 席名')
  const fmName = /^name:\s*(.+)$/m.exec(r.card)
  assert.ok(fmName && fmName[1].trim(), '卡面 front matter 必须有 name（§5.1 :125）')
  assert.equal(fmName[1].trim(), d.name, '卡面 name 必须 = dump.name（§4 :90 派生：name = seatEntry.name）')
  assert.ok(typeof d.rationale === 'string' && d.rationale.trim().length > 0, 'dump.rationale 必须非空（§5 :116）')
  assert.ok(r.readme.includes(d.rationale), 'README 投影必须含 dump.rationale')
  assert.equal(r.card.includes(d.rationale), false, '卡面不得含 dump.rationale（§5.1 :135 零散文）')
})

test('S4-TC-B02 改数据 1 处 → 三处跟随（README / dump 变、卡面按设计不变）', () => {
  // testcase 原代码用 `runCli(['dump'])`：那是**子进程**，重新读盘，看不到 mutCard 对**本进程内存**的改动。
  // 因此 dump 侧改走同进程 `cmdDump`（与 CLI 的 `dump` 分支是同一个函数、逐字同一输出），
  // 断言文本（含探针 / 还原后不得再含探针）一律未改。
  const dumpInProc = (name) => {
    const buf = []
    const keep = console.log
    console.log = (...a) => buf.push(a.join(' '))
    try { return { code: cmdDump({ name }) ?? 0, out: buf.join('\n') } } catch (e) { return { code: 1, out: String(e && e.message) } } finally { console.log = keep }
  }
  const s = SEATS[0]
  const probe = '（S4-TC-B02 探针）'
  const before = dumpInProc(s)
  assert.equal(before.code, 0, '前置 dump 必须可跑')
  const restore = mutCard(s, (a) => { a.rationale = `${a.rationale}${probe}` })
  try {
    const after = dumpInProc(s)
    assert.equal(after.code, 0, '改数据后 dump 仍必须可跑')
    assert.ok(after.out.includes(probe), '改 rationale 后 dump 必须含探针（实得未跟随）')
    assert.ok(RS(s).readme.includes(probe), 'README 投影必须跟随 rationale 变化')
    assert.equal(CARD(s).includes(probe), false, 'rationale 不进卡面 → 卡面不得因它变化（§5.1 :135）')
  } finally { restore() }
  const back = dumpInProc(s)
  assert.equal(back.out.includes(probe), false, '还原后 dump 不得再含探针（守 mutCard 有效性）')
})

test('S4-TC-B03 落盘后每席一份 README + index 15 行且链接目标全在', () => {
  assert.ok(existsSync(DOC_AGENTS_DIR), `README 落点目录必须存在：${DOC_AGENTS_DIR}（§3 :53-56）`)
  const docs = readdirSync(DOC_AGENTS_DIR).filter((f) => f.endsWith('.md'))
  assert.equal(docs.length, SEATS.length + 1, `docs/agents 必须 = 席数 + index（16 份；实得 ${docs.length}）`)
  for (const s of SEATS) {
    assert.ok(docs.includes(`${s}.md`), `缺 ${s}.md`)
    assert.ok(readFileSync(join(DOC_AGENTS_DIR, `${s}.md`), 'utf8').trim().length > 0, `${s}.md 不得为空`)
  }
  const idx = readFileSync(join(DOC_AGENTS_DIR, 'README.md'), 'utf8')
  const rows = idx.split(/\r?\n/).filter((l) => l.trim().startsWith('|') && !/^\|\s*:?-{3}/.test(l.trim()))
  assert.ok(rows.length > 1, 'index 必须至少有表头 + 1 行')
  assert.equal(rows.slice(1).length, SEATS.length, `index 数据行必须 = 席数（实得 ${rows.slice(1).length}）`)
  for (const line of rows.slice(1)) {
    // §2 判据代码的捕获组只取席名（丢 `.md`）→ 拼出的 rel 恒不存在（见 testcase B03 的 2026-10-31 日期注）；
    // 这里把扩展名纳入捕获（断言「链接目标存在」逐字未改，判据真正生效）。
    const target = (line.match(/`docs\/agents\/([a-z0-9-]+\.md)`/) ?? line.match(/\]\(([^)]+)\)/) ?? [])[1]
    assert.ok(target, `index 行必须有链接目标：${line}`)
    const rel = target.startsWith('docs/') ? target : (target.startsWith('./') ? `docs/agents/${target.slice(2)}` : `docs/agents/${target}`)
    assert.ok(existsSync(join(REPO, rel)), `index 链接目标不存在：${rel}`)
  }
})

test('S4-TC-B04 index 表头五列齐', () => {
  const idx = readFileSync(join(DOC_AGENTS_DIR, 'README.md'), 'utf8')
  const header = idx.split(/\r?\n/).find((l) => l.trim().startsWith('|'))
  assert.ok(header, 'index 必须有表格表头')
  const cells = header.split('|').map((c) => c.trim()).filter(Boolean)
  assert.ok(cells.length >= 5, `index 表头必须至少 5 列（实得 ${cells.length}）`)
  for (const need of ['席名', '职责', '维度', '输出类型', '链接']) assert.ok(cells.some((c) => c.includes(need)), `index 表头缺「${need}」列（§3 :54）`)
})

test('S4-TC-B05 overrides[] 每条必须带非空 reason', () => {
  const built = PIPE.buildCards()
  assert.ok(Array.isArray(built) && built.length === SEATS.length, 'buildCards 必须每席一条（§4 :81）')
  let n = 0
  for (const b of built) {
    const oc = b.overrides ?? []
    assert.ok(Array.isArray(oc), `${b.seat} 的 overrides 必须是数组`)
    for (const o of oc) {
      assert.ok(typeof o.id === 'string' && o.id.trim() !== '', `${b.seat} 的覆盖缺 base id`)
      assert.ok(Array.isArray(o.changed) && o.changed.length > 0, `${b.seat}/${o.id} 的 changed 必须非空（零差异应报 PointlessOverride）`)
      assert.ok(typeof o.reason === 'string' && o.reason.trim() !== '', `${b.seat}/${o.id} 的覆盖缺 reason（§5 :119；S1 merge.mjs:63 不带它，须 pipeline join）`)
      n += 1
    }
  }
  if (n === 0) {
    const pred = Object.keys(PRED.PREDICATES ?? {})
    const land = Object.keys(LAND.LANDINGS ?? {})
    assert.ok(pred.length > 0 && land.length >= 2, '谓词表非空 + 落点表 ≥2 项（构造前提）')
    const shared = [{ id: 'probe', kind: 'must', objects: ['deliverable.body'], criterion: pred[0], landing: land[0], requires: [] }]
    const own = [{ ...shared[0], landing: land[1], reason: '本席按自己的落点' }]
    const m = CM.mergeActions(shared, own)
    assert.equal(m.errors.length, 0, `带 reason 的覆盖必须被接受（实得 ${m.errors.map((e) => e.code).join('|')}）`)
    assert.equal(m.overrides.length, 1, '合并层必须产出 1 条 overrides')
  }
})

test('S4-TC-B06 README 覆盖记录表在位：行数 = overrides 条数（0 条时空表合法）', () => {
  // testcase 原文用 `(?=^## |\Z)`：JS 里 `\Z` 是字面 Z（不是文末锚点），照抄会恒不匹配。
  // 这里按原意实现「本节 = 标题行到下一 `## ` 或文末」，行数 / reason 列的断言逐条未改。
  const secOf = (t, headRe) => {
    const lines = t.split(/\r?\n/)
    const i = lines.findIndex((l) => headRe.test(l))
    if (i < 0) return null
    const rest = lines.slice(i + 1)
    const j = rest.findIndex((l) => /^## /.test(l))
    return [lines[i], ...(j < 0 ? rest : rest.slice(0, j))].join('\n')
  }
  for (const b of PIPE.buildCards()) {
    const t = readmeOnDisk(b.seat)
    const m = secOf(t, /^##\s*覆盖记录/)
    assert.ok(m, `${b.seat} README 必须有「## 覆盖记录」节（§5 :116）`)
    const rows = m.split(/\r?\n/).filter((l) => l.trim().startsWith('|') && !/^\|\s*:?-{3}/.test(l.trim()))
    assert.ok(rows.length >= 1, `${b.seat} 覆盖表必须有表头（0 条覆盖也要留表头）`)
    assert.equal(rows.slice(1).length, (b.overrides ?? []).length, `${b.seat} 覆盖表数据行必须 = overrides 条数（表 ${rows.slice(1).length} vs 数据 ${(b.overrides ?? []).length}）`)
    for (const line of rows.slice(1)) {
      const cells = line.split('|').map((c) => c.trim()).filter(Boolean)
      assert.ok(cells.length >= 3, `${b.seat} 覆盖行必须三列（id / changed / reason）：${line}`)
      assert.ok(cells[2] && cells[2].length > 0, `${b.seat} 覆盖行 reason 列不得为空：${line}`)
    }
  }
})

test('S4-TC-B07 dump = stdout-only（不落盘、可 JSON.parse、不调 writeAll）', () => {
  const s = SEATS[0]
  const r = runCli(['dump', '--name', s])
  assert.equal(r.code, 0, `dump 必须 exit 0（实得 ${r.code}）：${r.out.slice(0, 300)}`)
  const d = JSON.parse(r.out.trim())
  assert.ok(d && typeof d === 'object', 'dump 输出必须是 JSON 对象')
  assert.equal(d.seat, s, 'dump.seat 必须 = 请求的席名')
  const SRC = readFileSync(join(REPO, 'tools/docgen/cli.mjs'), 'utf8')
  // 锚 `export function cmdDump`，不用裸 `cmdDump`：后者若先在注释 / 派发表里出现，切片会从错处开始（假绿或假红）
  const i = SRC.indexOf('export function cmdDump')
  assert.ok(i >= 0, 'cli.mjs 必须有 `export function cmdDump`（§5 :117）')
  const j = SRC.indexOf('\nexport function', i + 1)
  const body = SRC.slice(i, j > 0 ? j : SRC.length)
  assert.ok(body.startsWith('export function cmdDump'), `切出的必须是 cmdDump 函数体本身（实得首行：${body.split('\n')[0].slice(0, 60)}`)
  for (const w of ['writeFileSync', 'mkdirSync', 'renameSync', 'cpSync', 'appendFileSync', 'writeAll']) {
    assert.equal(body.includes(w), false, `cmdDump 分支不得含 ${w}（PRD :225 stdout-only / §3 :71④）`)
  }
  const CA = readFileSync(join(REPO, 'scripts/check-all.mjs'), 'utf8')
  assert.equal(/['"]dump['"]\s*,\s*['"]--name/.test(CA), false, '门禁段不得调用 dump（不进门禁）')
})

test('S4-TC-B08 覆盖的 reason 取自本席 own（pipeline 不 join 即红）', () => {
  const USE = SH.SHARED_USE
  assert.ok(USE && typeof USE === 'object' && Object.keys(USE).length > 0, 'SHARED_USE 必须非空对象（§3 :65）')
  const s = Object.keys(USE).find((k) => Array.isArray(USE[k]) && USE[k].length > 0)
  assert.ok(s, '至少一席的 use 列表非空（否则本用例无从构造覆盖）')
  const id = USE[s][0]
  const base = [...SH.SHARED_MUST, ...SH.SHARED_NEVER].find((a) => a.id === id)
  assert.ok(base, `共享层必须登记 ${id}（§4 :91）`)
  const other = Object.keys(LAND.LANDINGS).find((l) => l !== base.landing)
  assert.ok(other, '落点表至少 2 项（否则「改 landing」构造不出来）')
  const mk = (reason) => ({ ...structuredClone(base), landing: other, ...(reason === null ? {} : { reason }) })
  const restore = mutCard(s, (a) => { a.must = [...(a.must ?? []), mk('本席落 progress.md，不写交付物正文')] })
  try {
    const b = PIPE.buildCards().find((x) => x.seat === s)
    assert.ok(b, `${s} 的 buildCards 结果必须存在`)
    const o = (b.overrides ?? []).find((x) => x.id === id)
    assert.ok(o, `构造的覆盖必须出现在 overrides[]（实得 ${(b.overrides ?? []).map((x) => x.id).join(',')}）`)
    assert.ok(typeof o.reason === 'string' && o.reason.trim() !== '', 'overrides 条目的 reason 必须从 own join 进来（pipeline 不 join 即红，§5 :119）')
    assert.ok(RS(s).readme.includes(o.reason), 'README 覆盖表的 reason 列必须渲染出 own 的 reason（§5 :116 / :119）')
  } finally { restore() }
  const restore2 = mutCard(s, (a) => { a.must = [...(a.must ?? []), mk(null)] })
  try {
    const m = CM.mergeActions([base], [mk(null)])
    assert.deepEqual(m.errors.map((e) => e.code), ['OverrideWithoutReason'], '无 reason 的覆盖必须报 OverrideWithoutReason（S1 merge.mjs）')
    const threw = (() => { try { PIPE.renderSeat(s); return false } catch { return true } })()
    const builtErr = (() => { try { PIPE.buildCards(); return null } catch (e) { return e.message } })()
    assert.ok(threw || builtErr !== null, `${s} 在 reason 缺失时必须拒绝渲染（不产出字节，§5 :119），实得两条通道都放过`)
  } finally { restore2() }
})

// ── 2026-10-31 ④ 段：C 组（description 直出 / 称谓词两形态 / 非议会席 0 命中 / 混用必红）─────────

test('S4-TC-C01 description = trigger.when 直出（不含「在…中担任」派生式）', () => {
  const D = (s) => {
    const m = /^description:\s*(.+)$/m.exec(CARD(s))
    assert.ok(m && m[1].trim().length > 0, `${s} 卡面必须有非空 description（§5.1 :125）`)
    return m[1].trim()
  }
  assert.equal(SEATS.length, CARD_FILES.length, '席集与卡文件集必须等长（外部集合相等）')
  for (const s of SEATS) {
    const d = D(s)
    assert.equal(DERIVED_DESC_RE.test(d), false, `${s} 的 description 不得含「在…中担任…」（§10-D3 :216）：${d}`)
    const t = triggerTable[s]
    assert.ok(t && typeof t.when === 'string' && t.when.trim() !== '', `${s} 必须有 trigger.when（否则本断言无从构造）`)
    assert.ok(d.includes(t.when.trim()), `${s} 的 description 必须含触发条件「${t.when.trim()}」（§5.2 :151）`)
  }
})

test('S4-TC-C02 notWhen.text 两形态：有则附「不用于」、无则无该尾巴', () => {
  const T = triggerTable
  assert.ok(T && typeof T === 'object', 'triggerTable 必须可读（§4 :81 的输入含它）')
  assert.ok(Object.keys(T).length > 0, 'triggerTable 不得为空（否则两类筛选全空）')
  const withNot = Object.keys(T).filter((k) => T[k] && typeof T[k].notWhen?.text === 'string' && T[k].notWhen.text.trim())
  const without = Object.keys(T).filter((k) => T[k] && T[k].when && !(typeof T[k].notWhen?.text === 'string' && T[k].notWhen.text.trim()))
  assert.ok(withNot.length > 0 && without.length > 0, `两类席都必须存在（有 notWhen=${withNot.length} / 无=${without.length}），否则本用例空转`)
  for (const s of withNot) assert.ok(CARD(s).includes('不用于'), `${s} 有 notWhen.text → description 必须附「不用于：…」（§5.2 :151）`)
  for (const s of without) assert.equal(CARD(s).includes('不用于'), false, `${s} 无 notWhen.text → description 不得凭空加「不用于」（§5.2 :151）`)
})

test('S4-TC-C03 非议会席卡面 0 命中「议长 / 主持人」', () => {
  for (const s of NON_PARL) {
    const t = CARD(s)
    assert.ok(t.length > 200, `${s} 卡面不得为空或过短（否则 0 命中是假绿）`)
    assert.ok(t.includes('## 边界'), `${s} 卡面必须含「边界」段（证明渲染成功）`)
    assert.equal(TERM_RE.test(t), false, `${s} 是非议会席 → 卡面不得出现「议长 / 主持人」（§5.2 :153）：${(t.match(TERM_RE) ?? [])[0]}`)
  }
  assert.equal(NON_PARL.length, 2, '非议会席必须是 spec §4 :97 点名的两个')
})

test('S4-TC-C04 非议会席数据里塞「主持人」→ 卡面命中即红', () => {
  const s = NON_PARL[0]
  assert.equal(TERM_RE.test(CARD(s)), false, `${s} 基线必须 0 命中（否则本用例判别力无从建立）`)
  const restore = mutCard(s, (a) => { a.duty = { ...a.duty, constraint: `${a.duty.constraint}；主持人通知后记录` } })
  try {
    assert.ok(TERM_RE.test(CARD(s)), `${s} 数据里塞「主持人」后卡面必须命中（§5.2 :155 的机械判面）`)
  } finally { restore() }
  assert.equal(TERM_RE.test(CARD(s)), false, `还原后 ${s} 必须回到 0 命中（守 mutCard 有效性）`)
})

test('S4-TC-C05 议会席混用「议长」+「主持人」→ 红；只用其一 → 绿', () => {
  const s = PARL[0]
  const t0 = CARD(s)
  const both = ['议长', '主持人'].filter((w) => t0.includes(w))
  assert.ok(both.length <= 1, `${s} 基线不得已经混用（实得 ${both.join('+')}）`)
  const mixed = mutCard(s, (a) => { a.duty = { ...a.duty, constraint: `${a.duty.constraint}；议长派发、主持人转录` } })
  try {
    // 构造态下 renderSeat 会按 MixedTermInCard 拒绝产出（§4 :98 拒绝语义），故卡面文本取同一 renderCard 投影
    const card = PIPE.buildCards().find((b) => b.seat === s).card
    assert.ok(card && typeof card === 'object', '合并后 card 必须可取（§4 :81）')
    const e = PIPE.buildEnv(s, [card])
    assert.ok(e && typeof e === 'object', 'buildEnv(seat, cards) 必须可调（§4 :82）')
    const t = renderCard(card, e)
    assert.ok(t.includes('议长') && t.includes('主持人'), '构造必须真的让两词同时出现在卡面（否则断言空转）')
    const r = CM.validateCardModel(card, e)
    assert.ok(Array.isArray(r.errors) && r.errors.length > 0, '混用称谓必须产生 errors（空数组 = 校验器没判这一面）')
    assert.ok(r.errors.some((x) => x.code === 'MixedTermInCard'), `议会席同卡混用两词必须报 MixedTermInCard（§5.2 :152），实得 ${r.errors.map((x) => x.code).join('|')}`)
  } finally { mixed() }
  assert.ok(['议长', '主持人'].filter((w) => CARD(s).includes(w)).length <= 1, '还原后不得仍混用（守 mutCard 有效性）')
})

// ── 2026-10-31 ④ 段：D 组（输出格式块结构化 / 指针与声明残留 / 禁 15 份副本）──────────────────

test('S4-TC-D03 输出格式块残留 doc-taxonomy 指针 → 卡面指针词红', () => {
  const audit = agentData.find((a) => a.outputKind === 'audit')
  assert.ok(audit, '必须存在 outputKind=audit 的席（否则本用例无从构造）')
  const seg = () => CARD(audit.name).split(/^## 输出格式/m)[1].split(/^## /m)[0]
  const cur = seg()
  assert.ok(cur && cur.trim().length > 0, `${audit.name} 的「输出格式」段不得为空`)
  assert.equal(/doc-taxonomy|references\//.test(cur), false, `${audit.name} 卡面输出格式段不得带文档路径（§6 :169）：${(cur.match(/doc-taxonomy|references\//) ?? [])[0]}`)
  const block = OF.outputFormats.audit
  assert.ok(Array.isArray(block.checks) && block.checks.length > 0, 'audit 块 checks 必须非空')
  block.checks.push('按 references/doc-taxonomy.md 逐交付物核对')
  try {
    assert.ok(seg().includes('doc-taxonomy'), '把路径塞进 checks 后卡面必须可见（守「判定面覆盖输出格式段」的误实现）')
  } finally { block.checks.pop() }
  assert.equal(/doc-taxonomy/.test(seg()), false, '弹出后必须复原（守构造不污染基线）')
})

test('S4-TC-D04 散文声明残留在输出格式块 → declaration 类探针红', () => {
  const audit = agentData.find((a) => a.outputKind === 'audit')
  assert.ok(audit, '必须存在 audit 席')
  const seg = () => CARD(audit.name).split(/^## 输出格式/m)[1].split(/^## /m)[0]
  assert.equal(hitClass(seg(), 'declaration').length, 0, '卡面输出格式段不得含声明句式（§6 :168）')
  const block = OF.outputFormats.audit
  assert.ok(Array.isArray(block.fields) && block.fields.length > 0, 'audit.fields 必须非空')
  block.fields.push('声明：本核对单必由审计专员本人实例完成；代填即违规')
  try {
    assert.ok(hitClass(seg(), 'declaration').length >= 1, '塞入声明后卡面必须命中（守「探针只扫卡面别处」的误实现）')
  } finally { block.fields.pop() }
  assert.equal(hitClass(seg(), 'declaration').length, 0, '弹出后必须复原')
})

test('S4-TC-D05 outputFormats 不复制进每席数据（同 kind 输出格式段逐字相等）', () => {
  for (const a of agentData) assert.equal('outputFormats' in a, false, `${a.name} 不得把 outputFormats 复制进席数据（§6 :173）`)
  const byKind = {}
  for (const a of agentData) (byKind[a.outputKind] ??= []).push(a.name)
  assert.ok(Object.keys(byKind).length >= 2, '至少 2 个 outputKind（否则分组断言退化）')
  assert.ok(Object.values(byKind).some((v) => v.length >= 2), '至少 1 组有 ≥2 席（否则逐字相等只有一个样本）')
  const segOf = (s) => {
    const body = (CARD(s).split(/^## 输出格式/m)[1] ?? '').split(/^## /m)[0]
    assert.ok(body.trim().length > 0, `${s} 的「输出格式」段不得为空`)
    return body
  }
  for (const [k, names] of Object.entries(byKind)) {
    for (const n of names.slice(1)) assert.equal(segOf(n), segOf(names[0]), `${k} 内 ${n} 与 ${names[0]} 的输出格式段必须逐字相等（按 kind 共享）`)
  }
})

// ── 2026-10-31 ④ 段：E 组（共享层单源 / 覆盖记账 / 绕共享层 / use 白名单）────────────────────

test('S4-TC-E01 共享层单源：判据 id 在 shared-actions.mjs 里恰好出现 1 次', () => {
  const SM = SH.SHARED_MUST, SN = SH.SHARED_NEVER
  assert.ok(Array.isArray(SM) && SM.length > 0, '§4 :91 共享层 must 必须非空数组')
  assert.ok(Array.isArray(SN) && SN.length > 0, '§4 :91 共享层 never 必须非空数组')
  const SRC = readFileSync(join(REPO, 'tools/docgen/card-model/vocab/shared-actions.mjs'), 'utf8')
  assert.ok(SRC.length > 0)
  const all = [...SM, ...SN]
  assert.ok(all.length > 0, '共享动作总数不得为 0（否则循环空转）')
  for (const a of all) {
    assert.ok(typeof a.id === 'string' && a.id.trim() !== '', '共享动作 id 必须非空')
    assert.equal(typeof a.criterion === 'string' && a.criterion.trim() !== '', true, `${a.id} 的 criterion 必须非空（否则下面的计数恒 0）`)
    // 2026-10-31 现行判据（见 testcase E01 日期注）：按 `criterion:` 字段赋值计数；裸子串会被 id 行（`shared.<criterion>`）算成 2
    const esc = a.criterion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const n = (SRC.match(new RegExp(`criterion:\\s*'${esc}'`, 'g')) ?? []).length
    assert.equal(n, 1, `共享句 ${a.id} 的 criterion 在源码里必须恰好赋值 1 次（>1 = 第二份副本）`)
    assert.ok(SEATS.some((s) => CARD(s).includes(a.criterion)), `共享句 ${a.id} 至少被一席卡面渲染（否则是死数据）`)
  }
})

test('S4-TC-E02 覆盖走 overrides[]（带 reason 且字段确有差异）→ 合并绿 + README 有该行', () => {
  const pred = Object.keys(PRED.PREDICATES ?? {})
  const land = Object.keys(LAND.LANDINGS ?? {})
  assert.ok(pred.length > 0 && land.length >= 2, '谓词表非空 + 落点表至少 2 项（否则「改 landing」无从构造）')
  const shared = [{ id: 'cov', kind: 'must', objects: ['deliverable.body'], criterion: pred[0], landing: land[0], requires: [] }]
  const own = [{ ...shared[0], landing: land[1], reason: '本席写进 progress.md，不写交付物正文' }]
  const m = CM.mergeActions(shared, own)
  assert.equal(m.ok, true, `带 reason 的覆盖必须合并成功（实得 ${m.errors.map((e) => e.code).join('|')}）`)
  assert.equal(m.overrides.length, 1, '必须恰记 1 条覆盖（V-3）')
  assert.equal(m.overrides[0].id, 'cov')
  assert.ok(m.overrides[0].changed.includes('landing'), `changed 必须含被改字段 landing（实得 ${m.overrides[0].changed.join(',')}）`)
})

test('S4-TC-E03 覆盖不带 reason → OverrideWithoutReason；零差异 → PointlessOverride', () => {
  const pred = Object.keys(PRED.PREDICATES ?? {})
  const land = Object.keys(LAND.LANDINGS ?? {})
  assert.ok(pred.length > 0 && land.length >= 2)
  const base = { id: 'cov', kind: 'must', objects: ['deliverable.body'], criterion: pred[0], landing: land[0], requires: [] }
  const noReason = CM.mergeActions([base], [{ ...base, landing: land[1] }])
  assert.deepEqual(noReason.errors.map((e) => e.code), ['OverrideWithoutReason'], '覆盖无 reason → 只报 OverrideWithoutReason')
  const pointless = CM.mergeActions([base], [{ ...base, reason: '理由写了但字段没改' }])
  assert.deepEqual(pointless.errors.map((e) => e.code), ['PointlessOverride'], '零差异覆盖 → 只报 PointlessOverride')
  assert.equal(noReason.ok, false)
  assert.equal(pointless.ok, false)
})

test('S4-TC-E04 绕过共享层（本席直接写全量同文）→ DuplicateStatement', () => {
  const pred = Object.keys(PRED.PREDICATES ?? {})
  const land = Object.keys(LAND.LANDINGS ?? {})
  assert.ok(pred.length > 0 && land.length > 0)
  const base = { id: 'dup', kind: 'must', objects: ['deliverable.body'], criterion: pred[0], landing: land[0], requires: [] }
  const m = CM.mergeActions([base], [{ ...base }])
  assert.deepEqual(m.errors.map((e) => e.code), ['DuplicateStatement'], '本席重写同 id 同内容且无 reason → 只报 DuplicateStatement（R4 :243）')
  assert.deepEqual(m.overrides, [], '报错时不得产覆盖记录（否则 README 会出现无源行）')
})

test('S4-TC-E05 use 白名单：只能取本席声明过的共享 id', () => {
  const USE = SH.SHARED_USE
  assert.ok(USE && typeof USE === 'object' && Object.keys(USE).length > 0, 'SHARED_USE 必须非空对象（§3 :65）')
  const known = new Map([...SH.SHARED_MUST, ...SH.SHARED_NEVER].map((a) => [a.id, a.criterion]))
  assert.ok(known.size > 0, '共享登记表不得为空（否则「都已登记」恒真）')
  for (const [s, ids] of Object.entries(USE)) {
    assert.ok(SEATS.includes(s), `use 表的席位 ${s} 必须是真实席名`)
    assert.ok(Array.isArray(ids) && ids.length > 0, `${s} 的 use 必须是非空数组`)
    for (const id of ids) assert.ok(known.has(id), `${s} 的 use 引用了未登记的共享 id ${id}`)
    const t = CARD(s)
    for (const id of ids) assert.ok(t.includes(known.get(id)), `${s} 声明了 ${id} 却未渲染进卡面（use 与合并脱节）`)
    for (const [id, crit] of known) if (!ids.includes(id)) assert.equal(t.includes(crit), false, `${s} 未在 use 声明 ${id}，卡面不得出现它的判据`)
  }
})

// ── 2026-10-31 ④ 段：F 组（授权链 / 零写盘 / 手改即红 / 接管完整性 / 豁免到期 / 旧模板退场）────

test('S4-TC-F01 正常路径：`generate` 只比不写、15 卡逐字节 = 渲染产物', () => {
  WRITE_ALL() // 前置：落盘实现存在（§3 :71）
  const CLI = readFileSync(join(REPO, 'tools/docgen/cli.mjs'), 'utf8')
  assert.ok(CLI.includes('writeAll'), 'cli.mjs 必须出现 writeAll（draft / replace / generate --readme --apply 三处共用，§3 :71②）')
  assert.ok(CLI.includes('--readme') && CLI.includes('--apply'), 'cli.mjs 必须有 --readme / --apply 显式旗标（§3 :71③）')
  const r = runCli(['generate'])
  assert.equal(r.code, 0, `generate 必须 exit 0（实得 ${r.code}）：${r.out.slice(0, 300)}`)
  assert.match(r.out, /baseline\s+\d+\/\d+/, '必须打印 baseline N/N（check-all.mjs依赖）')
  assert.equal(SEATS.length, CARD_FILES.length, '席集与卡文件集必须等长（外部集合相等）')
  for (const s of CARD_FILES) {
    const disk = readFileSync(join(AGENTS_DIR, `${s}.md`), 'utf8')
    assert.ok(disk.length > 0, `agents/${s}.md 不得为空`)
    assert.equal(disk, CARD(s), `agents/${s}.md 必须与 renderSeat().card 逐字节相等（§7① :179）`)
  }
})

test('S4-TC-F02 单席原子 + 零写盘：坏卡 → 该席被拒 / 31 份不变 / `generate` 只比不写', () => {
  const s = SEATS[0]
  const other = SEATS.find((x) => x !== s)
  assert.ok(other, '至少需要 2 席（否则「其它席照常」无从断言）')
  const restore = mutCard(s, (a) => { a.must[0].criterion = 'no.such.predicate' })
  try {
    const refused = (() => { try { PIPE.renderSeat(s); return false } catch { return true } })()
    assert.equal(refused, true, `${s} 坏卡必须在单席渲染时被拒（§7① :179 单席原子）`)
    assert.ok(RS(other).card.length > 200, '其它席不得受坏卡影响（单席原子）')
  } finally { restore() }
  const snap = new Map(TARGETS.map((p) => [p, existsSync(join(REPO, p)) ? readFileSync(join(REPO, p), 'utf8') : null]))
  assert.equal(snap.size, 2 * SEATS.length + 1, '快照必须覆盖 31 份生成物（15 卡 + 15 README + index）')
  const bad = coldRepo({ mutate: INJECT_BAD('no.such.predicate'), args: ['generate', '--readme', '--apply'], verify: (copy) => {
    for (const [p, before] of snap) {
      const now = existsSync(join(copy, p)) ? readFileSync(join(copy, p), 'utf8') : null
      assert.equal(now, before, `坏卡时不得写 ${p}（§7① :179 零写盘）`)
    }
  } })
  assert.equal(bad.code, 1, `坏卡必须 exit 1（实得 ${bad.code}）：${bad.out.slice(0, 300)}`)
  assert.match(bad.out, /UnboundLanding|MissingCriterionImpl/, `坏卡必须打印 S1 的既有码（§4 :98 不新增码）：${bad.out.slice(0, 300)}`)
  const only = coldRepo({ args: ['generate'], verify: (copy) => {
    for (const [p, before] of snap) {
      const now = existsSync(join(copy, p)) ? readFileSync(join(copy, p), 'utf8') : null
      assert.equal(now, before, `generate（无 --readme --apply）不得写 ${p}（§3 :71① 只比不写）`)
    }
  } })
  assert.equal(only.code, 0, `只读 generate 必须 exit 0（实得 ${only.code}）：${only.out.slice(0, 300)}`)
})

test('S4-TC-F03 卡面手改即红（现状已生效，防回退）', () => {
  const CLI = readFileSync(join(REPO, 'tools/docgen/cli.mjs'), 'utf8')
  assert.ok(CLI.includes("state.agents[a.name] === 'replaced'"), 'collectGate 的逐席比对代码必须仍在（§7② :180 现状已生效，防回退）')
  const rel = `agents/${SEATS[0]}.md`
  const r = coldRepo({ mutate: APPEND_ONE_BYTE(rel), args: ['gate'],
    verify: (copy) => assert.equal(readFileSync(join(copy, rel), 'utf8').endsWith('x'), true, '副本内手改必须真的生效（否则空转）') })
  assert.equal(r.code, 1, `手改卡面必须 gate exit 1（实得 ${r.code}）：${r.out.slice(0, 300)}`)
  assert.match(r.out, /Mismatch/, '必须报 Mismatch（§7② :180）')
  assert.ok(r.out.includes(rel) || r.out.includes(SEATS[0]), `必须点名被改的文件（实得：${r.out.slice(0, 300)}）`)
})

test('S4-TC-F04 README 手改 / 缺文件即红（比对面 = 31 份）', () => {
  for (const rel of [`docs/agents/${SEATS[0]}.md`, 'docs/agents/README.md']) {
    const r = coldRepo({ mutate: APPEND_ONE_BYTE(rel), args: ['gate'] })
    assert.equal(r.code, 1, `手改 ${rel} 必须 gate exit 1（实得 ${r.code}）：${r.out.slice(0, 300)}`)
    assert.match(r.out, /Mismatch/, `手改 ${rel} 必须报 Mismatch（§7③ :181）`)
    assert.ok(r.out.includes(rel) || r.out.includes(rel.replace('docs/agents/', '')), `必须点名 ${rel}（实得：${r.out.slice(0, 300)}）`)
  }
  const goneRel = `docs/agents/${SEATS[1]}.md`
  const gone = coldRepo({ mutate: (copy) => { rmSync(join(copy, goneRel), { force: true }) }, args: ['gate'],
    verify: (copy) => assert.equal(existsSync(join(copy, goneRel)), false, '副本内 README 必须真的被删（否则空转）') })
  assert.equal(gone.code, 2, `缺一份 README 必须 exit 2（DanglingBaselineEntry 沿用既有映射，S4-TC-F10；2026-10-31 改判见 F04 日期注）：${gone.out.slice(0, 300)}`)
  assert.match(gone.out, /DanglingBaselineEntry/, '缺文件必须报 DanglingBaselineEntry（§7③ :181）')
  assert.ok(gone.out.includes(goneRel) || gone.out.includes(SEATS[1]), `必须点名缺的 ${goneRel}`)
  assert.equal(TARGETS.length, 2 * SEATS.length + 1, `比对面必须 = 2×席数+1（实得 ${TARGETS.length}）`)
  assert.equal(TARGETS.filter((p) => p.startsWith('docs/agents/')).length, SEATS.length + 1, 'docs/agents 侧 = 席数 + index（15 + 1 = 16）')
})

test('S4-TC-F06 `state.agents` 键集 = 席集双向相等、值域合法、全部 `replaced`', () => {
  const st = JSON.parse(readFileSync(join(REPO, 'tools/docgen/state.json'), 'utf8'))
  assert.ok(st && st.agents && typeof st.agents === 'object', 'state.json 必须有 agents 对象')
  const keys = Object.keys(st.agents)
  assert.ok(keys.length > 0, 'state.agents 不得为空（否则双向相等空转）')
  assert.deepEqual([...keys].sort(), [...SEATS].sort(), `state 键集必须与席集双向相等（多=${keys.filter((k) => !SEATS.includes(k)).join(',') || '无'} / 少=${SEATS.filter((s) => !keys.includes(s)).join(',') || '无'}）`)
  for (const [k, v] of Object.entries(st.agents)) assert.ok(['replaced', 'suspended'].includes(v), `state.agents[${k}] 值非法：${v}`)
  const notReplaced = Object.entries(st.agents).filter(([, v]) => v !== 'replaced').map(([k]) => k)
  assert.deepEqual(notReplaced, [], `${SEATS.length} 席必须逐席 replaced（§7④ :182），未接管：${notReplaced.join(',')}`)
})

test('S4-TC-F07 `EXPIRY_LANDED === true` + 豁免行在输出中 + 注入有行为差异', () => {
  assert.equal(EXPIRY_LANDED, true, `§7⑤ :183 / D7 :220：EXPIRY_LANDED 必须置 true（实得 ${EXPIRY_LANDED}）`)
  const CA = readFileSync(join(REPO, 'scripts/check-all.mjs'), 'utf8')
  const caLines = CA.split(/\r?\n/)
  const idx = caLines.findIndex((l) => l.includes('[豁免窗口]'))
  assert.ok(idx >= 0, 'check-all 必须有 [豁免窗口] 行（§7⑤ :183 的可核面）')
  assert.ok(idx > 0, '该行不得是首行（§7⑤ :183 明写「输出中含该行」）')
  assert.ok(caLines[idx].includes('EXPIRY_LANDED=${EXPIRY_LANDED}'), '该行必须插值常量（不是写死 true）')
  assert.equal(typeof disposeCardFindings, 'function', 'disposeCardFindings 必须是函数（§7⑤ 的注入面）')
  const injected = disposeCardFindings([{ file: 'agents/x.md' }], { landed: true })
  assert.ok(Array.isArray(injected.blockers) && injected.blockers.length >= 1, `置 landed=true 后必须产生 ≥1 blocker（实得 ${(injected.blockers ?? []).length}）：证置 true 有行为差异`)
})

test('S4-TC-F08 旧模板退场：`templates/` 两文件不存在 + 代码面 0 命中 + 新卡无 `sourceLine`', () => {
  // 自引用守卫：本用例自己就是 `tools/docgen/**/*.mjs` 的一份 → 旧模板名**不得以字面量**出现在本文件，
  // 否则扫描集合里永远有 1 处命中（自己命中自己 = 判据恒红）。故一律用拼接值构造（扫描时的字符串与 spec 同形）。
  const OLD_TPL = 'agent.md' + '.tpl'
  const OLD_TPL_2 = 'agent-handwritten.md' + '.tpl'
  const TPL = [OLD_TPL, OLD_TPL_2]
  for (const t of TPL) assert.equal(existsSync(join(REPO, 'tools/docgen/templates', t)), false, `判据①：旧模板 ${t} 必须已删除（§7⑥ :184）`)
  const mjs = walkFiles(join(REPO, 'tools', 'docgen')).filter((p) => p.endsWith('.mjs'))
  assert.ok(mjs.length > 0, 'tools/docgen/**/*.mjs 不得为空（否则 0 命中是假绿）')
  const hits = mjs.filter((p) => TPL.some((t) => readFileSync(p, 'utf8').includes(t)))
  assert.deepEqual(hits, [], `判据②：代码面必须 0 命中旧模板名（实得 ${hits.length}：${hits.slice(0, 3).join(' | ')}）`)
  for (const a of agentData) {
    assert.equal('sourceLine' in a, false, `${a.name} 的席条目不得再有 sourceLine 键（§7⑥ :184）`)
    assert.equal('sourceLine' in (a.card ?? {}), false, `${a.name} 的 card 不得有 sourceLine 键`)
  }
  let tplInCard = 0
  for (const s of SEATS) if (/[a-z0-9-]+\.md\.tpl/.test(CARD(s))) tplInCard += 1
  assert.equal(tplInCard, 0, `${SEATS.length} 张卡面不得出现 *.tpl 字样（实得 ${tplInCard} 张）`)
})

test('S4-TC-F09 旧模板探针判别力：往 `.mjs` 代码面注入 → 命中 ≥ 1', () => {
  const rel = 'tools/docgen/components/renderCard.mjs'
  const INJECT_TPL = 'agent.md' + '.tpl' // 同 F08：不以字面量出现在本文件（否则扫描集合自命中）
  const r = coldRepo({ mutate: (copy) => {
    const p = join(copy, rel)
    assert.ok(existsSync(p), `副本内缺 ${rel}`)
    writeFileSync(p, `${readFileSync(p, 'utf8')}\n// 旧模板 ${INJECT_TPL} 的遗留分支\n`, 'utf8')
  }, args: ['gate'], verify: (copy) => {
    const mjs = walkFiles(join(copy, 'tools', 'docgen')).filter((p) => p.endsWith('.mjs'))
    assert.ok(mjs.length > 0, '副本代码面不得为空')
    const found = mjs.filter((p) => readFileSync(p, 'utf8').includes(INJECT_TPL))
    assert.ok(found.length >= 1, '代码面注入旧模板名后扫描必须命中 ≥1（否则判据②写错面 → F08 是假绿）')
    const norm = (p) => p.split(/[\\/]/).join('/')
    assert.ok(found.some((p) => norm(p).endsWith(rel)), `命中必须点名 ${rel}，实得 ${found.slice(0, 3).join(' | ')}`)
  } })
  assert.ok(r.code === 0 || r.code === 1, '副本 gate 只要跑完即可（本用例判扫描命中）')
  const scanSet = walkFiles(join(REPO, 'tools', 'docgen')).filter((p) => p.endsWith('.mjs'))
  assert.ok(scanSet.length > 0, '判据②的扫描集合不得为空')
  assert.equal(scanSet.every((p) => p.endsWith('.mjs')), true, '判据②的扫描集合必须全是 .mjs（不得把 .md 卡面混进来）')
  assert.equal(scanSet.some((p) => p.split(/[\\/]/).includes('agents')), false, '扫描集合不得包含 agents/（§7⑥ :184 已收窄）')
})

// ── 2026-10-31 ④ 段：G 组（S1 零 errors / 零散文 / 共享层副本 / 散文落点 / P-B 扫描）────────────

test('S4-TC-G01 15 卡过 S1 校验零 errors + 码表仍 36 + 15 席 subject 形态 `<seat>.card`', () => {
  assert.equal(typeof PIPE.buildEnv, 'function', 'buildEnv(seat, cards) 必须导出（§4 :82）')
  assert.equal(typeof CM.validateCardModel, 'function', 'validateCardModel 必须是函数')
  for (const b of PIPE.buildCards()) {
    const e = PIPE.buildEnv(b.seat, [b.card])
    assert.ok(e && typeof e === 'object', `${b.seat} 的 env 必须可取（§4 :82）`)
    assert.equal(Object.keys(e).length, 11, `${b.seat} 的 env 必须是 S1 §6 的 11 键（实得 ${Object.keys(e).length}）`)
    const r = CM.validateCardModel(b.card, e)
    assert.equal(r.ok, true, `${b.seat} 必须过 S1 校验（实得 ${(r.errors ?? []).map((x) => x.code).join('|')}）`)
    assert.deepEqual(r.errors, [], `${b.seat} 必须零 errors`)
  }
  assert.equal(typeof CM.CARD_MODEL_CODES, 'object', 'CARD_MODEL_CODES 必须是对象（S1 出口面）')
  const specCodes = S1_CODES()
  assert.equal(Object.keys(CM.CARD_MODEL_CODES).length, specCodes.size, `CARD_MODEL_CODES 码数必须 = S1 spec §7 派生值 ${specCodes.size}（§2-1 :27 / §4 :98 不新增码）`)
  assert.equal(typeof CM.SUBJECTS, 'object', 'SUBJECTS 必须是对象（S1 出口面）')
  const subjKeys = Object.keys(CM.SUBJECTS ?? {})
  assert.ok(subjKeys.length > 0, 'SUBJECTS 不得为空（否则下面的存在性断言空转）')
  for (const s of SEATS) {
    const want = `${s}.card`
    assert.match(want, /^[a-z][a-z0-9-]*\.card$/, `席命名形态必须 = <seat>.card（§4 :94），实得 ${want}`)
    assert.ok(subjKeys.includes(want), `${want} 必须登记在 SUBJECTS（§4 :94 / §10-D5 :218）`)
  }
})

test('S4-TC-G02 零散文：15 张卡面过 `PROSE_PROBES` 三类探针 0 命中（词表不另写）', () => {
  const PROBES = PROSE_PROBES()
  for (const k of Object.keys(PROBE_CLASSES)) {
    for (const p of PROBES[k]) assert.ok(typeof p === 'string' || p instanceof RegExp, `PROSE_PROBES.${k} 元素必须 string 或 RegExp（实得 ${typeof p}）`)
  }
  const rows = specTableStrict(/\*\*零散文探针/).filter((c) => /^(旧段名|声明句式|指针词)/.test(String(c[0]).replace(/`/g, '').trim()))
  assert.equal(rows.length, 3, `spec §5.1 探针表必须 3 类（实得 ${rows.length}）`)
  const cutWords = (cell) => String(cell).replace(/`/g, '').split('/').map((x) => x.trim()).filter(Boolean)
  for (const cls of ['oldSegments', 'declaration']) {
    const label = PROBE_CLASSES[cls]
    const row = rows.find((c) => String(c[0]).replace(/`/g, '').trim().startsWith(label))
    assert.ok(row, `spec §5.1 探针表缺「${label}」行`)
    const want = cutWords(row[1])
    assert.ok(want.length > 0, `spec「${label}」行切出空集（否则逐词断言空转）`)
    assert.deepEqual(PROBES[cls].map(probeSrc).sort(), want.slice().sort(), `PROSE_PROBES.${cls} 必须与 spec「${label}」行逐词相等（不得另写一份）`)
  }
  const s1l = readFileSync(S1_SPEC_PATH, 'utf8').split(/\r?\n/)[187]
  assert.ok(typeof s1l === 'string' && s1l.length > 0, 'S1 spec :188 必须非空（指针词的上游单源）')
  // 2026-10-31 代码审查修复：原为「长度 = 5 + 逐词出现在该行」的**子集**判定（重复词 / 换词可蒙过）；
  // 改为从 S1 `:188` 的「命中」cell 切出词表后双向相等（与另两类探针同口径，不写死词数）。
  const s1Words = (s1l.split(/命中/)[1] ?? '').split('（')[0]
    .split('/').map((x) => x.replace(/`/g, '').trim()).filter(Boolean)
  assert.ok(s1Words.length > 0, 'S1 §7 :188 的「命中」cell 必须切出指针词（否则下面的双向相等恒真）')
  assert.deepEqual(PROBES.pointers.map(probeSrc).map((x) => String(x).trim()).sort(), s1Words.slice().sort(), 'PROSE_PROBES.pointers 必须与 S1 §7 :188 词表双向相等（不得另写一份）')
  assert.equal(SEATS.length, CARD_FILES.length, '席集与卡文件集必须等长（外部集合相等）')
  for (const s of CARD_FILES) {
    const t = readFileSync(join(AGENTS_DIR, `${s}.md`), 'utf8')
    assert.ok(t.length > 0, `agents/${s}.md 不得为空`)
    for (const k of Object.keys(PROBE_CLASSES)) {
      const hits = hitClass(t, k)
      assert.equal(hits.length, 0, `agents/${s}.md 卡面不得命中「${PROBE_CLASSES[k]}」类探针（§9 V-4 :204）：${hits[0]}`)
    }
  }
  for (const seg of MF.CARD_SEGMENTS) assert.equal(hitClass(String(seg), 'oldSegments').length, 0, `段名表不得含旧段名：${seg}`)
})

test('S4-TC-G03 副本口径：改共享层 1 处 → 受影响的席数 = use 引用该 id 的席数', () => {
  const first = SH.SHARED_MUST[0]
  const crit = first.criterion
  assert.ok(typeof crit === 'string' && crit.trim() !== '', '首条共享 must 的 criterion 必须非空（构造前提）')
  const refSeats = Object.entries(SH.SHARED_USE).filter(([, ids]) => Array.isArray(ids) && ids.includes(first.id)).map(([s]) => s)
  assert.ok(refSeats.length > 0, '该共享 id 必须被 ≥1 席 use 引用（否则本断言空转）')
  // 判据写法的工程化调整（见报告）：原式 `NEW = crit + '.probe'` 会同时改到 `id:` 行且造出**未登记谓词**
  // （S1 判 UnboundLanding → 渲染被拒，卡面无从计数）。改判等价且更强：只替换 `criterion:` 字面值到一个
  // **已登记谓词**（id 行不动），再用「受影响席集 = use 引用该 id 的席集」+「旧串 0 残留」判同步。
  const NEW = Object.keys(PRED.PREDICATES).find((k) => k !== crit)
  assert.ok(typeof NEW === 'string' && NEW !== crit, '必须取到一个已登记、且不同于原值的谓词 id（否则构造无效）')
  const needle = `criterion: '${crit}'`
  const seen = coldRepo({ mutate: (copy) => {
    const p = join(copy, 'tools/docgen/card-model/vocab/shared-actions.mjs')
    const src = readFileSync(p, 'utf8')
    assert.equal(src.split(needle).length - 1, 1, '副本内必须恰好 1 处 `criterion: 原值`（否则替换会打到 id 行 / 多处）')
    writeFileSync(p, src.replace(needle, `criterion: '${NEW}'`), 'utf8')
  }, args: ['generate'], verify: (copy) => {
    // 副本内**重新渲染**（`generate` 只比不写，盘上卡面仍是旧串 → 原式「读盘计数」恒 0）；
    // 渲染走副本自己的模块实例（路径唯一 → 独立的 ESM 注册表，不污染本进程的 PIPE）。
    const mod = pathToFileURL(join(copy, 'tools/docgen/components/cardPipeline.mjs')).href
    const script = `const m = await import(${JSON.stringify(mod)});const out = {};for (const b of m.buildCards()) out[b.seat] = m.renderSeat(b.seat).card;process.stdout.write(JSON.stringify(out));`
    const r = runNode(['--input-type=module', '-e', script], copy)
    assert.equal(r.code, 0, `副本内渲染必须跑通（实得 ${r.code}）：${r.out.slice(0, 300)}`)
    const cards = JSON.parse(r.out)
    assert.equal(Object.keys(cards).length, CARD_FILES.length, '副本内卡面数必须 = 席数')
    const changed = SEATS.filter((s) => cards[s] !== CARD(s))
    assert.deepEqual([...changed].sort(), [...refSeats].sort(), `受影响席集必须 = use 引用该 id 的席集（应 ${refSeats.length} 席，实得 ${changed.length}）`)
    // 只判 **criterion 列**是否残留旧值（共享动作的 `id:` 里也含该子串，整卡 includes 会恒真 = 假红）
    assert.equal(SEATS.filter((s) => (cards[s] ?? '').includes(`criterion: ${crit}`)).length, 0, '不得有卡面的 criterion 列残留旧判据串（改 1 处必须全跟随）')
    assert.equal(changed.every((s) => cards[s].includes(NEW)), true, '受影响席的卡面必须含新值（证明文本层跟着单源走）')
  } })
  assert.ok(seen.code === 0 || seen.code === 1, '副本 generate 只要跑完即可（本用例判同步）')
})

test('S4-TC-G04 散文落点两形态：进 `rationale` 合法、进 `duty` 必红', () => {
  const s = SEATS[0]
  const prose = '（这段是解释性散文：心算必错，实测数错 3 次被拦）'
  const r1 = mutCard(s, (a) => { a.rationale = `${a.rationale}${prose}` })
  try {
    assert.equal(CARD(s).includes('心算必错'), false, 'rationale 里的散文不得进卡面（§5.1 :135）')
    assert.ok(RS(s).readme.includes('心算必错'), 'README 必须承载该散文（§12-R3 :242 搬落点）')
  } finally { r1() }
  const r2 = mutCard(s, (a) => { a.duty = { ...a.duty, action: `${a.duty.action}（详见 §5 的实现）` } })
  try {
    // 判据写法的工程化调整（见报告）：`renderSeat` 对指针词会先被 S1 拒（`PointerToElsewhere`）→ 卡面无从取得；
    // 故「让指针词真的进卡面」改用**只做渲染**的 `renderCard`（与 renderSeat 同一渲染实现，跳过校验门）。
    const built = PIPE.buildCards().find((b) => b.seat === s)
    const env = PIPE.buildEnv(s, [built.card])
    assert.ok(renderCard(built.card, env).includes('详见'), '构造必须真的让指针词进卡面（否则断言空转）')
    const r = CM.validateCardModel(built.card, env)
    assert.ok(r.errors.some((x) => x.code === 'PointerToElsewhere'), `duty 里的指针必须报 PointerToElsewhere（实得 ${r.errors.map((x) => x.code).join('|') || '(空)'}）`)
  } finally { r2() }
  assert.equal(CARD(s).includes('详见'), false, '还原后卡面不得仍含指针')
})

test('S4-TC-G05 P-B 扫描：`must` 行判 criterion + landing；`never` 行只判 objects + criterion', () => {
  assert.equal(SEATS.length, CARD_FILES.length, '席集与卡文件集必须等长（外部集合相等）')
  let musts = 0, nevers = 0
  for (const b of PIPE.buildCards()) {
    assert.ok(b && b.card && typeof b.card === 'object', `${b.seat} 的 buildCards 结果必须带 card`)
    const t = CARD(b.seat)
    const mustBody = t.split(/^## 一定会/m)[1].split(/^## /m)[0]
    const neverBody = t.split(/^## 禁止/m)[1].split(/^## /m)[0]
    assert.ok(mustBody && mustBody.length > 0, `${b.seat} 的「一定会」段不得为空`)
    assert.ok(neverBody && neverBody.length > 0, `${b.seat} 的「禁止」段不得为空`)
    for (const a of b.card.must ?? []) {
      assert.ok(typeof a.criterion === 'string' && a.criterion.trim() !== '', `${b.seat}/${a.id} 的 criterion 必须非空（V-7 :207）`)
      assert.ok(typeof a.landing === 'string' && a.landing.trim() !== '', `${b.seat}/${a.id} 的 landing 必须非空（V-7 :207 落点面）`)
      assert.ok(mustBody.includes(a.criterion), `${b.seat}/${a.id} 的 must 行必须含判据 id ${a.criterion}`)
      assert.ok(mustBody.includes(a.landing), `${b.seat}/${a.id} 的 must 行必须含落点字面值 ${a.landing}`)
      musts += 1
    }
    for (const a of b.card.never ?? []) {
      const objs = Array.isArray(a.objects) ? a.objects.filter((x) => String(x).trim()) : []
      assert.ok(objs.length > 0, `${b.seat}/${a.id} 的 never 必须至少 1 个 objects（V-7 :207 / PRD :234）`)
      assert.ok(typeof a.criterion === 'string' && a.criterion.trim() !== '', `${b.seat}/${a.id} 的 never criterion 必须非空`)
      for (const o of objs) assert.ok(neverBody.includes(String(o)), `${b.seat}/${a.id} 的 never 行必须含宾语 ${o}`)
      assert.ok(neverBody.includes(a.criterion), `${b.seat}/${a.id} 的 never 行必须含判据 id ${a.criterion}`)
      nevers += 1
    }
  }
  assert.ok(musts > 0 && nevers > 0, `全仓必须同时检查到 must 与 never 行（实得 must ${musts} / never ${nevers}）`)
})

// P-B（V-7 :207）扫描器：**逐行逐列**判，不是整段子串判。
// 为什么必须逐列：`must` 行的 `objects:` 列常与 `landing:` 同值（如都写 `deliverable.body`），
// 整段 `includes` 会让「删掉 landing 字面值」的构造仍然恒绿（假阴性守卫失效）。
const pbMissing = (seat, face = null) => {
  const b = PIPE.buildCards().find((x) => x.seat === seat)
  assert.ok(b && b.card, `${seat} 必须有 buildCards 结果（P-B 扫描的输入面）`)
  const acts = b.card.must ?? []
  assert.ok(acts.length > 0, `${seat} 必须有 must 动作`)
  const body = (face ?? CARD(seat)).split(/^## 一定会/m)[1].split(/^## /m)[0]
  const rows = body.split(/\r?\n/).filter((l) => l.trim().startsWith('|'))
  const rowOf = (id) => rows.find((l) => String(l.split('|')[2] ?? '').trim() === id)
  const cellOf = (row, n, label) => String(row.split('|')[n] ?? '').trim().replace(new RegExp(`^${label}:\\s*`), '').trim()
  return acts.filter((a) => {
    const row = rowOf(a.id)
    if (!row) return true
    const critCell = cellOf(row, 5, 'criterion')
    const landCell = cellOf(row, 6, 'landing')
    return !(critCell !== '' && critCell === String(a.criterion ?? '').trim() && landCell !== '' && landCell === String(a.landing ?? '').trim())
  }).map((a) => a.id)
}

test('S4-TC-G06 P-B 负例：删 must 的 landing 字面值（或置空 criterion）→ 必红', () => {
  const s = SEATS[0]
  const first = PIPE.buildCards().find((x) => x.seat === s).card.must[0]
  assert.ok(first && typeof first.id === 'string', `${s} 必须有首条 must（构造前提）`)
  assert.deepEqual(pbMissing(s), [], `${s} 基线必须 0 缺项（否则判别力先失效）`)
  // 构造①：把该行 `landing:` 列的字面值删空（渲染器逐字打印 landing，改数据值仍会出现在卡面 → 构造恒绿，
  // 故「字面值不进卡面」必须在卡面行上删）。
  const face = CARD(s)
  const body = face.split(/^## 一定会/m)[1].split(/^## /m)[0]
  const row = body.split(/\r?\n/).find((l) => String(l.split('|')[2] ?? '').trim() === first.id)
  assert.ok(typeof row === 'string' && row.includes(String(first.landing)), `构造前提：首行必须原本含 landing 字面值 ${first.landing}`)
  const mutatedBody = body.replace(row, row.replace(/landing: [^|]*/, 'landing: '))
  assert.equal(mutatedBody.includes(row), false, '构造必须真的把该行的 landing 字面值删掉（否则断言空转）')
  assert.deepEqual(pbMissing(s, face.replace(body, mutatedBody)), [first.id], '落点字面值不进卡面 → P-B 必须点名该行')
  // 构造②：置空 criterion（数据层）→ P-B 点名 + S1 报 `MissingCriterionImpl`（两判同向，不互替）。
  const r2 = mutCard(s, (a) => { a.must[0].criterion = '' })
  try {
    const built = PIPE.buildCards().find((x) => x.seat === s)
    const env = PIPE.buildEnv(s, [built.card])
    // 空 criterion 会被 `renderSeat` 先拒 → 卡面改由只做渲染的 `renderCard` 取得（同形调整，见报告）。
    assert.ok(pbMissing(s, renderCard(built.card, env)).length >= 1, 'criterion 为空 → P-B 必须点名该行（与 S1 的 MissingCriterionImpl 同向，不互替）')
    const v = CM.validateCardModel(built.card, env)
    assert.ok(v.errors.some((x) => x.code === 'MissingCriterionImpl'), `空 criterion 必须同时被 S1 判（实得 ${v.errors.map((x) => x.code).join('|') || '(空)'}）`)
  } finally { r2() }
})

test('S4-TC-G07 探针三类各 1 条反例（只命中本类）+ 指针词假阳性守卫', () => {
  const s = SEATS[0]
  for (const k of Object.keys(PROBE_CLASSES)) assert.equal(hitClass(CARD(s), k).length, 0, `${s} 基线必须 0 命中「${PROBE_CLASSES[k]}」类`)
  for (const [cls, label] of Object.entries(PROBE_CLASSES)) {
    const first = PROSE_PROBES()[cls][0]
    assert.ok(first !== undefined, `「${label}」类必须有首个探针（否则本类反例无从构造）`)
    const src = probeSrc(first)
    assert.ok(src.length > 0, `「${label}」类首个探针不得为空`)
    const probe = cls === 'pointers' ? `（${src} 3）` : `（${src}）`
    const restore = mutCard(s, (a) => { a.duty = { ...a.duty, action: `${a.duty.action}${probe}` } })
    try {
      // 判据写法的工程化调整（见报告）：指针词进 `duty.action` 会被 S1 先拒（`PointerToElsewhere`），
      // `renderSeat` 取不到卡面 → 该类的卡面文本改由只做渲染的 `renderCard` 取得（与 G04/G06 同一处理）。
      const t = cls === 'pointers'
        ? (() => { const b = PIPE.buildCards().find((x) => x.seat === s); return renderCard(b.card, PIPE.buildEnv(s, [b.card])) })()
        : CARD(s)
      assert.ok(t.includes(src), `构造必须真的把「${label}」类的词塞进卡面（实得未命中：${src}）`)
      for (const k of Object.keys(PROBE_CLASSES)) {
        const hits = hitClass(t, k)
        if (k === cls) assert.ok(hits.length >= 1, `卡面含「${label}」类探针时必须命中本类（实得 0）`)
        else assert.equal(hits.length, 0, `「${label}」类反例不得串到「${PROBE_CLASSES[k]}」类（实得 ${hits.join('|')}）`)
      }
    } finally { restore() }
    for (const k of Object.keys(PROBE_CLASSES)) assert.equal(hitClass(CARD(s), k).length, 0, `还原后 ${s} 的「${PROBE_CLASSES[k]}」类必须回到 0 命中`)
  }
  const guard = '（遇意见冲突，可见，参考周围人的意见）'
  const restore2 = mutCard(s, (a) => { a.duty = { ...a.duty, action: `${a.duty.action}${guard}` } })
  try {
    const t = CARD(s)
    assert.ok(t.includes('遇意见冲突') && t.includes('可见'), '守卫构造必须真的把合法词塞进卡面（否则守卫断言空转）')
    assert.equal(hitClass(t, 'pointers').length, 0, `合法词「遇意见冲突 / 可见 / 参考周围人的意见」不得命中指针词类（实得 ${hitClass(t, 'pointers').join('|')}）`)
  } finally { restore2() }
})

// ── 2026-10-31 ④ 段末批 6 条（H02 / I01 / I02 / I03 / J01 / J03）──────────────────────────

test('S4-TC-H02 全集口径 = 落地时点 agents/*.md 全集（派生 = 席集，不写死 15）', () => {
  assert.deepEqual([...CARD_FILES].sort(), [...SEATS].sort(), `卡面文件集必须 = 席集（多=${CARD_FILES.filter((s) => !SEATS.includes(s)).join(',') || '无'} / 少=${SEATS.filter((s) => !CARD_FILES.includes(s)).join(',') || '无'}）`)
  assert.ok(CARD_FILES.length > 0, '卡文件集不得为空')
  const SRC = ['cardPipeline.mjs', 'renderCard.mjs', 'renderReadme.mjs']
    .map((f) => readFileSync(join(REPO, 'tools/docgen/components', f), 'utf8')).join('\n')
  assert.ok(SRC.length > 0, '三个渲染模块必须已落（否则本断言空转）')
  assert.equal(/const\s+SEATS\s*=\s*\[/.test(SRC), false, '渲染模块不得写死席名数组（必须从 agentData 派生，F-11）')
})

test('S4-TC-I01 D6 三条证据逐条可核（registeredIds 不提前切换）', () => {
  const OC_DIR = join(REPO, 'tools/observation-check')
  const ocFiles = walkFiles(OC_DIR)
  assert.ok(ocFiles.length > 0, 'observation-check 目录不得为空')
  const ridSrc = readFileSync(join(OC_DIR, 'registered-ids.mjs'), 'utf8')
  const m = /REGISTERED_IDS\s*=\s*\[([^\]]*)\]/.exec(ridSrc)
  assert.ok(m, 'registered-ids.mjs 必须有 REGISTERED_IDS 常量')
  const regIds = [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1])
  assert.ok(regIds.length > 0, 'REGISTERED_IDS 不得为空（否则域比较恒真）')
  const cardIds = PIPE.buildCards().flatMap((b) => (b.card.checkItems ?? []).map((i) => i.id))
  assert.ok(cardIds.length > 0, '15 卡的 checkItems 并集不得为空')
  assert.equal(cardIds.some((id) => regIds.includes(id)), false, `两集合必须不同域（交集须为空，§10-D6 :219 ①）：${cardIds.filter((id) => regIds.includes(id)).join(',')}`)
  const ocSrc = ocFiles.map((p) => readFileSync(p, 'utf8')).join('\n')
  const codeLines = ocSrc.split(/\r?\n/).filter((l) => l.includes('CHECK_ITEMS') && !l.trim().startsWith('//') && !l.trim().startsWith('*'))
  assert.deepEqual(codeLines, [], `CHECK_ITEMS 只允许出现在注释里（无导出载体，§10-D6 ②）：${codeLines.slice(0, 3).join(' | ')}`)
  assert.equal(/export\s+(?:const|function)\s+CHECK_ITEMS/.test(ocSrc), false, '不得存在 CHECK_ITEMS 导出')
  assert.equal(/from\s+['"][^'"]*card-model/.test(ocSrc), false, 'observation-check 不得 import card-model（§3 :69 反向零 import）')
})

test('S4-TC-I02 registered-ids.mjs 与本段零接触（常量值 + 整文件 sha 锚）', () => {
  const ridSrc = readFileSync(join(REPO, 'tools/observation-check/registered-ids.mjs'), 'utf8')
  const m = /REGISTERED_IDS\s*=\s*\[([^\]]*)\]/.exec(ridSrc)
  assert.ok(m, 'registered-ids.mjs 必须有 REGISTERED_IDS 常量')
  const ids = [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1])
  assert.deepEqual(ids, ['k01', 'k02', 'k03'], `常量值必须逐字不变（零接触的直接判据；实得 ${ids.join(',')}）`)
  // 2026-10-31 代码审查修复：原判据用 `git diff --quiet HEAD -- tools/observation-check/`，把「本段零接触」写成**工作区状态**
  // → 任何人本地未提交改动都会让常驻门禁变红，而改动提交后又查不出来。改为**内容锚**（整文件 sha256 钉死），
  // 语义更强（连排版改动也拦）且与工作区干净与否无关；文件确实该变时（S2/S3 正式切换）须同批更新该钉值。
  const sha = createHash('sha256').update(readFileSync(join(REPO, 'tools/observation-check/registered-ids.mjs'))).digest('hex').toUpperCase()
  assert.equal(sha, REGISTERED_IDS_SHA, 'registered-ids.mjs 必须与本段基线逐字节相同（零接触，§10-D6 :219）')
  assert.equal(existsSync(join(REPO, 'tools/observation-check/render.mjs')), true, 'S2 的 render.mjs 本段不得删除（§11-1 :231）')
})

test('S4-TC-I03 registeredIdsOf([本席 card]) = 本席 checkItems 并集（产物侧 id 从常量派生）', () => {
  assert.equal(typeof CM.registeredIdsOf, 'function', 'registeredIdsOf 必须是函数（S1 出口面）')
  const b = PIPE.buildCards().find((x) => (x.card.checkItems ?? []).length > 0)
  assert.ok(b && b.card, '至少一席必须有 checkItems（否则本用例空转）')
  const derived = [...CM.registeredIdsOf([b.card])].sort()
  const expect = [...new Set(b.card.checkItems.map((i) => i.id))].sort()
  assert.ok(expect.length > 0, '期望集不得为空')
  assert.deepEqual(derived, expect, `${b.seat} 的 registeredIds 必须 = 本席 checkItems 并集（§4 :95）`)
  const regSrc = readFileSync(join(REPO, 'tools/observation-check/registered-ids.mjs'), 'utf8')
  const pid = [...((/REGISTERED_IDS\s*=\s*\[([^\]]*)\]/.exec(regSrc)?.[1] ?? '')).matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1])
  assert.ok(pid.length > 0, '产物侧 id 必须能从 REGISTERED_IDS 派生出非空集（不写死）')
  assert.equal(derived.some((id) => pid.includes(id)), false, `派生集不得混入产物侧 id（实得 ${derived.filter((id) => pid.includes(id)).join(',')}）`)
})

test('S4-TC-J01 渲染确定性：两次结果相等、无时间戳/绝对路径、无 CRLF/BOM', () => {
  const s = SEATS[0]
  const a = RS(s), b = RS(s)
  assert.deepEqual(a, b, '两次 renderSeat 必须逐字相等（幂等 / 无随机 / 无时间戳）')
  assert.equal(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(a.card + a.readme), false, '卡面 / README 不得含 ISO 时间戳')
  assert.equal(a.card.includes(REPO) || a.readme.includes(REPO), false, `卡面 / README 不得含本机绝对路径 ${REPO}`)
  assert.equal(a.card.includes('\\'), false, '卡面不得含 Windows 反斜杠路径（跨平台不可比）')
  for (const x of [a.card, a.readme]) {
    assert.equal(x.includes('\r'), false, '渲染产物换行必须是 \\n（无 CR；写盘侧不做换行转换，§7① :179）')
    assert.equal(x.startsWith('\uFEFF'), false, '渲染产物不得带 BOM（首字符 U+FEFF）')
  }
  const r1 = ALL(), r2 = ALL()
  assert.equal(r1.cards.length, r2.cards.length, '两次 renderAll 的 cards 数必须相等')
})

test('S4-TC-J03 docs/agents/** 不触发 UnregisteredHandwritten，且恰 = 席数 + index', () => {
  const docs = readdirSync(DOC_AGENTS_DIR).filter((f) => f.endsWith('.md'))
  assert.equal(docs.length, SEATS.length + 1, `docs/agents 必须恰 = 席数 + index（实得 ${docs.length}）`)
  const r = runCli(['gate'])
  assert.equal(r.code, 0, `docs/agents 是生成物落点，不得触发 UnregisteredHandwritten（gate 实得 ${r.code}）：${r.out.slice(0, 300)}`)
  assert.match(r.out, /baseline\s+\d+\/\d+/, 'gate 必须打印 baseline N/N（check-all.mjs依赖）')
  assert.deepEqual(CARD_FILES.filter((s) => !SEATS.includes(s)), [], `agents/ 下不得有未登记的 .md：${CARD_FILES.filter((s) => !SEATS.includes(s)).join(',')}`)
})


