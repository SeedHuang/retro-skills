// agent-card S4 渲染层 常驻测试（testcase: docs/superpowers/specs/2026-10-29-agent-card-s4-render-design-testcase.md）
// 本文件是常驻回归测试、不是 testcase 文件：编写者 = 施工者，不受 `spec-testcase-gate` 的独立编写义务约束
// （spec 的 61 条 testcase 已由独立 `senior-sdet` 交付，本文件只消费它）。
// 计数口径 = 本文件内 `test('S4-TC-` 块个数，必须与 testcase 的 61 条一一对应（附录 A 给了逐 ID 落点）。
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync, cpSync, mkdtempSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'

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
  // 码数从 S1 spec §7 表**派生**（第三方通道；不写死字面量——`dev-workflow-counts` 的计数器探针要求派生式）：
  // §7 表「码」列是反引号里的码名，`manual` 行（`WeakReason`）不计入脚本码。
  const S1 = readFileSync(S1_SPEC_PATH, 'utf8').split(/\r?\n/)
  const start = S1.findIndex((l) => /^##\s*7\s/.test(l))
  assert.ok(start >= 0, 'S1 spec 必须含 §7 码表（否则码数无从派生）')
  // 只扫「族 | 码 | 判定面 | 判据」那张表（§7 里还有「码 → 入口对照」表，其第二列是入口名、不是码）；
  // 遇第一处非表格行即停；`manual` 行（`WeakReason`）不计入脚本码。
  const head = S1.findIndex((l, i) => i > start && /^\|\s*族\s*\|/.test(l))
  assert.ok(head >= 0, 'S1 spec §7 必须有「族 | 码 | 判定面 | 判据」表')
  const specCodes = new Set()
  for (let i = head; i < S1.length; i++) {
    if (!S1[i].trim().startsWith('|')) break
    const m = /^\|\s*[^|]+\s*\|\s*`([\w.-]+)`\s*\|/.exec(S1[i])
    if (m && !/^\|\s*manual\s*\|/.test(S1[i])) specCodes.add(m[1])
  }
  assert.ok(specCodes.size > 0, 'S1 spec §7 必须切出脚本码（否则下面的 deepEqual 恒真）')
  assert.deepEqual([...codes].sort(), [...specCodes].sort(), `S1 脚本码表必须与 spec §7 逐项相等（实得 ${codes.length} 个，spec 切出 ${specCodes.size} 个）`)
  for (const c of codes) assert.equal(exitCodeFor(c), 1, `${c} 必须归 exit 1（§10-D12 :225；不得落 2）`)
  for (const c of ['DuplicateStatement', 'OverrideWithoutReason', 'PointlessOverride']) assert.equal(exitCodeFor(c), 1, `合并码 ${c} 必须归 exit 1（§10-D12）`)
  assert.throws(() => exitCodeFor('WeakReason'), /未知错误码/, 'WeakReason 是 manual，不得入 EXIT 表（§10-D12 :225）')
  assert.equal(exitCodeFor('DanglingBaselineEntry'), 2, '既有码 DanglingBaselineEntry 仍为 2（§7③ :181 沿用；既有映射不动）')
})

// ── Task 4（上游文档同批：PRD 两处 + docs-convention 一行）──────────────────────────────────

test('S4-TC-K01 D1 / D5 的上游同批改在位（PRD §3.7 段表 7 段 + :293 省略号 0）', () => {
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
  const l293 = L[292] ?? ''
  assert.ok(typeof l293 === 'string' && l293.length > 0, 'PRD :293 必须非空（spec D5 :218 的落点行）')
  assert.equal(l293.includes('…'), false, `PRD :293 不得再含 '…' 省略号（D5 :218），实得：${l293}`)
})

test('S4-TC-J04 docs-convention 同批补一行 + scope-sweep --check exit 0', () => {
  const conv = readFileSync(join(REPO, 'rules/docs-convention.md'), 'utf8')
  assert.ok(conv.includes('docs/agents'), 'D2 :215：docs-convention 目录表必须同批补 docs/agents/ 一行（否则规则与目录两处说法）')
  const sw = runNode(['scripts/scope-sweep.mjs', '--check'])
  assert.equal(sw.code, 0, `R8 改判回扫必须 exit 0（实得 ${sw.code}）：${sw.out.slice(0, 300)}`)
  assert.match(sw.out, /sweep ok/, '末行必须是 sweep ok（判据只认退出码与末行）')
})
