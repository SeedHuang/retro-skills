// S3「判据与复用」施工测试（spec §7 步 S2 / testcase 80 条）。
// 一行一个用例：`test('S3-TC-<ID> …')`；判据全部可从 §0.1 登记的 helper 派生（不复制新文案字面）。
// 本文件**不跑全量门禁**（常量 9 / 15）：只跑单文件测试、单 CLI 子命令与单门禁脚本。
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, existsSync, mkdtempSync, mkdirSync, rmSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  REPO, walkFiles, runNode, runCli, coldRepo, mutCard, appendOneByte,
} from './support/card-fixtures.mjs'
import { PREDICATES } from '../card-model/vocab/predicates.mjs'
import { SHARED_MUST, SHARED_NEVER } from '../card-model/vocab/shared-actions.mjs'
import { OBJECT_NAMES } from '../card-model/vocab/object-names.mjs'
import { outputFormats } from '../components/outputFormats.mjs'
import { subjectiveHit, subjectiveTerms } from '../card-model/vocab/subjective-terms.mjs'
import { validatePredicates } from '../card-model/validatePredicates.mjs'
import * as CM from '../card-model/index.mjs'
import { exitCodeFor } from '../components/validateAgentData.mjs'
import { renderCard } from '../components/renderCard.mjs'
import { buildCards, renderSeat } from '../components/cardPipeline.mjs'
import { BASELINE_RULES, agentPaths, renderBaseline } from '../components/baseline.mjs'
import { agentData } from '../components/agentData.mjs'
import { evaluateText } from '../../../scripts/check-observable.mjs'
import { splitRow } from '../../execution-matrix/markdown-rows.mjs'
import {
  RULE_MARKER_ITEM, itemsFromCriteria, unknownMarkers, checkBuckets, BUCKETS,
} from '../../execution-matrix/check-buckets.mjs'
import { SHARED_MARKERS } from '../../execution-matrix/shared-items.mjs'
import { parseLedger, checkSharedChanges } from '../../execution-matrix/shared-changes/check-shared-changes.mjs'
import { scoreFile } from '../../../skills/rule-inspector/scripts/score.mjs'
import { HISTORY_PREFIXES } from '../../../scripts/scope-sweep.mjs'

const SEATS = buildCards().map((b) => b.seat)
const TOTAL = BASELINE_RULES.length + agentPaths().length
const TERMS = [...subjectiveTerms]
const MARKERS = JSON.parse(readFileSync(join(REPO, 'tools/quality/observable-terms.json'), 'utf8')).markers
const CRIT_TERMS = JSON.parse(readFileSync(join(REPO, 'tools/quality/observable-terms.json'), 'utf8')).criterionTerms

// 常量 7：`<S3-BASE>` = env 优先；否则取 S3 开工前 HEAD（D22 要求 S3 起**显式换锚**，不再用「最后一次触及 JSON 的提交」滚动推断）
// 解析抽成纯函数，使「env 覆盖」这条路径可被直接断言（B01 判：忽略 env 的硬编码必红）
const resolveS3Base = (env = process.env) => env.S3_BASE || 'b5e11aa'
const S3_BASE = resolveS3Base()
// `S3_HEAD` = S3 收口提交（S-D T4，2026-11-04）：`S3-TC-K07 不改面` 原先按 `git diff --name-status S3_BASE`
// （**开区间到工作树末尾**）判「历史件不许改」——于是**任何后续批次**只要改/删一份 `docs/after/` 或 spec 历史件
// 就红（S-D 实测：T4 按「做完即删条」删掉一份 `docs/after` 的旧行 → 本用例红）。这与 `SC-TC-62` 是同一根因
// （批内判据挂在开区间上），故同批解：上界冻结在 S3 那批的收口提交，本用例从此只核「S3 那批没改历史件」。
const S3_HEAD = (process.env.S3_BASE_HEAD || '').trim() || '90083cd'
// 常量 12：旧 8 条 label 从 `.mjs` 源码按正则抽（不 JSON.parse）
const OLD_LABELS = [...execFileSync('git', ['show', `${S3_BASE}:tools/docgen/card-model/vocab/predicates.mjs`], { cwd: REPO, encoding: 'utf8' }).matchAll(/label:\s*'([^']*)'/g)].map((m) => m[1])
const MUST_IDS = SHARED_MUST.map((a) => a.criterion)
const NEVER_IDS = SHARED_NEVER.map((a) => a.criterion)
const PRED_IDS = ['impartial-long-term', 'evidence-recomputable', 'plain-expression', 'no-fake-problem', 'issue-without-solution', 'out-of-scope-self-disposal', 'blank-evidence', 'proxy-fill']

const read = (rel) => readFileSync(join(REPO, rel), 'utf8')
// 子进程跑 `node --test`：必须清掉 `NODE_TEST_CONTEXT`，否则子进程会被判「test run() 递归」并**静默跳过全部用例**
// （§0.1 未登记，属「测试自身运行机制」的最小补丁；只在 `--test` 调用面使用）
const runNodeClean = (args, cwd = REPO) => {
  const env = { ...process.env }
  delete env.NODE_TEST_CONTEXT
  const r = spawnSync(process.execPath, args, { cwd, encoding: 'utf8', env })
  return { code: r.status ?? -1, out: `${r.stdout ?? ''}${r.stderr ?? ''}` }
}
const sha256 = (rel) => createHash('sha256').update(readFileSync(join(REPO, rel))).digest('hex')
const clone = (v) => structuredClone(v)
const base = () => PREDICATES['blank-evidence']

// ── §0.1 helper 清单（每个只实现一次） ───────────────────────────────────────
const vp = (map) => validatePredicates(map)
const markerKindsOf = (s) => MARKERS.filter((m) => new RegExp(m.pattern).test(s)).map((m) => m.kind)
const hasMarker = (s) => markerKindsOf(s).length >= 1
const labelHitsOf = (map) => Object.values(map).map((p) => p.label).filter(subjectiveHit)

function assertIds(map) {
  const keys = Object.keys(map)
  assert.equal(keys.length, 8)
  assert.deepEqual(keys, PRED_IDS)
  assert.equal(Object.values(map).every((p) => p.impl === 'manual'), true)
}

function assertFields(one) {
  assert.ok(Array.isArray(one.observable) && one.observable.length >= 1, 'observable 必须是非空数组')
  one.observable.forEach((x) => assert.equal(typeof x === 'string' && x.trim() !== '', true, 'observable 元素必须非空字符串'))
  assert.equal(typeof one.negativeSample === 'string' && one.negativeSample.trim() !== '', true, 'negativeSample 必须非空')
  assert.equal(typeof one.residual === 'object' && one.residual !== null, true, 'residual 必须存在')
  assert.equal(typeof one.residual.who === 'string' && one.residual.who.trim() !== '', true, 'residual.who 必须非空')
  assert.equal(Number.isInteger(one.residual.sample) && one.residual.sample > 0, true, 'residual.sample 必须是正整数')
  assert.equal(typeof one.label === 'string' && one.label.includes('——'), true, 'label 必须是「核心语义——可判句」')
}

function renderNeverLine(id) {
  const card = clone(agentData.find((a) => a.name === SEATS[0]).card)
  card.must = []
  card.never = [clone(SHARED_NEVER.find((a) => a.criterion === id))]
  const text = renderCard(card, { seat: SEATS[0] })
  const sec = text.split('## 禁止')[1].split(/^## /m)[0]
  return sec.split(/\r?\n/).find((l) => l.startsWith('- ')) ?? ''
}

function renderMustLine(id) {
  const card = clone(agentData.find((a) => a.name === SEATS[0]).card)
  card.must = [clone(SHARED_MUST.find((a) => a.criterion === id))]
  card.never = []
  const text = renderCard(card, { seat: SEATS[0] })
  const sec = text.split('## 一定会')[1].split(/^## /m)[0]
  return sec.split(/\r?\n/).find((l) => l.startsWith('- ')) ?? ''
}

const CORE = {
  'impartial-long-term': '不偏',
  'evidence-recomputable': '可复算',
  'plain-expression': '听懂',
  'no-fake-problem': '全过、无问题',
  'issue-without-solution': '只提问题不给解法',
  'out-of-scope-self-disposal': '越出职责自行处置',
  'blank-evidence': '证据栏留空',
  'proxy-fill': '代他人填写',
}

function assertCoreLabel(map) {
  const missing = Object.entries(map).filter(([id, p]) => !p.label.includes(CORE[id])).map(([id]) => id)
  assert.deepEqual(missing, [])
}

function assertLabelDash(map) {
  assert.deepEqual(Object.entries(map).filter(([, p]) => !p.label.includes('——')).map(([id]) => id), [])
}

function assertLabelMarker(map) {
  const bad = Object.entries(map).filter(([, p]) => !hasMarker(p.label.split('——')[1] ?? '')).map(([id]) => id)
  assert.deepEqual(bad, [])
}

function assertC8Mirror(labelText) {
  assert.equal(hasMarker(String(labelText).split('——')[1] ?? ''), true, `label 后段无 marker：${labelText}`)
}

const ALLOWED_CARRIER = new Set([
  ...Object.keys(outputFormats),
  ...Object.values(outputFormats).flatMap((f) => f.fields),
  '申报人', '签字人', 'git status --porcelain', '正文', 'outputKind',
])

function assertCarriers(specText) {
  const rows = specText.split(/\r?\n/).filter((l) => /^\|\s*`/.test(l))
  const seen = []
  for (const line of rows) {
    const cells = splitRow(line)
    const id = String(cells[0] ?? '').replace(/`/g, '').trim()
    if (!PRED_IDS.includes(id)) continue
    seen.push(id)
    const carrier = String(cells[4] ?? '').trim()
    assert.ok(carrier !== '', `${id} 的载体列为空`)
    const tokens = []
    for (const m of carrier.matchAll(/`([^`]+)`/g)) tokens.push(m[1].trim())
    for (const m of carrier.matchAll(/「([^」]+)」/g)) m[1].split(' / ').forEach((x) => tokens.push(x.trim()))
    for (const t of tokens) {
      if (/gate-record\.md$/.test(t)) continue
      assert.equal(ALLOWED_CARRIER.has(t), true, `${id} 的载体 token「${t}」不在已声明载体集内`)
    }
  }
  assert.deepEqual(seen.sort(), PRED_IDS.slice().sort(), 'spec §3 载体行缺 id')
}

const LEGACY_TERMS = ['证据格', '具体动作段', '验收段', '两栏']
function assertNoLegacyTerms(text) {
  assert.deepEqual(LEGACY_TERMS.filter((k) => String(text).includes(k)), [])
}

function assertNoTermCopy(src) {
  const hits = [...TERMS, ...CRIT_TERMS].filter((w) => String(src).includes(w))
  assert.deepEqual(hits, [])
}

function assertCriteriaNine(src) {
  const rows = String(src).split(/\r?\n/).filter((l) => /^\|\s*⑨\s*\|/.test(l))
  assert.equal(rows.length, 1)
  const cells = splitRow(rows[0])
  assert.match(cells[1], /判据可观察/)
  assert.match(cells[2], /验证节/)
  assert.equal(/evaluateText/.test(cells[2]), false)
  assert.match(cells[3], /有 1\s*[\/｜]\s*无 0/)
}

function assertCounts(src) {
  const text = String(src)
  assert.match(text.split(/\r?\n/)[0], /25 检查点/)
  assert.match(text, /禁令类 9 项/)
  assert.match(text, /非禁令类省略④⑤⑥ = 6 项/)
  assert.match(text, /执行力度 9/)
  assert.match(text, /现有 25 项/)
  assert.match(text, /20\/25/)
  assert.match(text, /执行力度组满分 6\/6/)
  assert.match(text, /原 §2\.4 的 25 检查点/)
  const wg = read('skills/rule-writer/references/writing-guide.md')
  assert.match(wg, /6\/6/)
  const rs = read('skills/rule-writer/assets/rule-skeleton.md')
  assert.match(rs, /6\/6/)
}

function assertTwoTables(src) {
  const lines = String(src).split(/\r?\n/)
  const tableRows = (startRe, count) => {
    const at = lines.findIndex((l) => startRe.test(l))
    assert.ok(at >= 0, '找不到表起点')
    return lines.slice(at + 4, at + 4 + count).map((l) => splitRow(l))
  }
  const t34 = tableRows(/^### 3\.4 执行力度适用项表/, 6)
  assert.deepEqual(t34.map((c) => c[4]), ['7', '4', '9', '6', '15', '12'])
  const tFullScore = tableRows(/^### 3\.5 满分口径/, 6)
  assert.deepEqual(tFullScore.map((c) => c[1]), ['24', '21', '26', '23', '32', '29'])
}

function blockOf(src, titlePrefix) {
  const lines = String(src).split(/\r?\n/)
  const start = lines.findIndex((l) => l.includes(`test('${titlePrefix}`))
  assert.ok(start >= 0, `找不到块：${titlePrefix}`)
  const next = lines.findIndex((l, i) => i > start && /^test\('/.test(l))
  return lines.slice(start, next < 0 ? lines.length : next).join('\n')
}

const seven = (r) => r.checks.find((c) => c.check.includes('⑦'))
const eight = (r) => r.checks.find((c) => c.check.includes('⑨'))

// 六项同步义务（单源 = rule-inspector SKILL 硬闸门 7）；target 可为仓根路径或 {rel: 内容} 映射
function assertSync(target) {
  const src = (rel) => (typeof target === 'string' ? readFileSync(join(target, rel), 'utf8') : target[rel] ?? '')
  const score = src('skills/rule-inspector/scripts/score.mjs')
  const criteria = src('skills/rule-inspector/references/criteria.md')
  const recipes = src('skills/rule-inspector/references/recipes.md')
  const rwSkill = src('skills/rule-writer/SKILL.md')
  const guide = src('skills/rule-writer/references/writing-guide.md')
  const skeleton = src('skills/rule-writer/assets/rule-skeleton.md')
  const ledgerTpl = src('skills/review-log/assets/review-progress-template.md')
  const checklist = src('skills/rule-inspector/assets/rule-edit-checklist-template.md')
  assert.ok(score.includes('⑨判据可观察'), '① score.mjs 缺 ⑨')
  assert.ok(criteria.includes('判据可观察'), '① criteria 缺 ⑨')
  assert.ok(recipes.includes('判据可观察'), '② recipes 缺 §R9')
  assert.ok(rwSkill.includes('判据可观察') && guide.includes('判据可观察') && skeleton.includes('判据可观察'), '③ rule-writer 三层缺')
  assert.ok(ledgerTpl.includes('判据可观察'), '④ 查账模板缺')
  const rowCount = String(criteria).split(/\r?\n/).filter((l) => /^\|\s*[①②③④⑤⑥⑦⑧]\s*\|/.test(l)).length
  assert.equal(rowCount, 8, '⑤ 条目级不得减少（①②–⑧ 八行仍在）')
  assert.ok(checklist.includes('判据可观察'), '⑥ checklist E2 缺')
}

function assertFourEntries(entries) {
  const norm = (id) => entries.find((e) => e.id === id)
  for (const id of ['I22', 'I23', 'I24', 'I25']) {
    const e = norm(id)
    assert.ok(e, `缺条目 ${id}`)
    assert.equal(typeof e.title === 'string' && e.title.trim() !== '', true, `${id} title 空`)
    assert.ok(Array.isArray(e.words) && e.words.length >= 1, `${id} words 空`)
    assert.ok(Array.isArray(e.scope) && e.scope.length >= 1, `${id} scope 空`)
    for (const p of e.scope) {
      assert.equal(/[*?]/.test(p), false, `${id} scope 含通配：${p}`)
      assert.equal(existsSync(join(REPO, p)), true, `${id} scope 指向不存在：${p}`)
    }
  }
}

function hunksOf(diffText) {
  const out = []
  let cur = null
  for (const line of String(diffText).split(/\r?\n/)) {
    const m = line.match(/^@@ -(\d+)(?:,\d+)? \+/)
    if (m) {
      cur = { oldStart: Number(m[1]), deleted: [] }
      out.push(cur)
      continue
    }
    if (cur && line.startsWith('-')) cur.deleted.push(line.slice(1))
  }
  return out
}

const escape = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const oldHits = (src) => OLD_LABELS.filter((l) => String(src).includes(l)).length
const legacyTokenHit = (s) => String(s).split(/[、，,/\s]+/).some((t) => TERMS.includes(t))
const findingCodes = (r) => (r.findings ?? []).map((f) => f.code)

// ── A 组：键集与四字段 ──────────────────────────────────────────────────────
test('S3-TC-A01 8 id 键集与 impl', () => {
  assertIds(PREDICATES)
  assert.deepEqual(Object.keys(PREDICATES), PRED_IDS)
  assert.equal(Object.values(PREDICATES).map((p) => p.impl).every((x) => x === 'manual'), true)
})

test('S3-TC-A02 键集漂移三构造', () => {
  const withExtra = { ...PREDICATES, 'extra-id': { ...base(), label: '多余——计数 = 1' } }
  const withoutOne = { ...PREDICATES }
  delete withoutOne['proxy-fill']
  const implChanged = { ...PREDICATES, 'plain-expression': { ...PREDICATES['plain-expression'], impl: 'script' } }
  assert.throws(() => assertIds(withExtra))
  assert.throws(() => assertIds(withoutOne))
  assert.throws(() => assertIds(implChanged))
  assert.equal(Object.keys(PREDICATES).length, 8)
})

test('S3-TC-A03 四字段与判据句', () => {
  Object.values(PREDICATES).forEach((p) => assertFields(p))
  assert.ok(Object.values(PREDICATES).flatMap((p) => p.observable).length >= 8)
  assert.equal(Object.values(PREDICATES).filter((p) => !p.label.includes('——')).length, 0)
})

test('S3-TC-A04 字段缺形五构造', () => {
  const c1 = { ...base() }
  delete c1.observable
  const c2 = { ...base(), observable: [] }
  const c3 = { ...base(), observable: ['', '计数 = 1'] }
  const c4 = { ...base(), negativeSample: '' }
  const c5 = { ...base(), residual: { who: '', sample: 3 } }
  const wrap = (one) => ({ ...PREDICATES, 'blank-evidence': one })
  ;[c1, c2, c3, c4, c5].forEach((c) => assert.throws(() => assertFields(c)))
  assert.equal(vp(wrap(c1)).errors[0].path, 'observable')
  assert.equal(vp(wrap(c3)).errors[0].path, 'observable[0]')
  assert.equal(vp(wrap(c4)).errors[0].path, 'negativeSample')
  assert.equal(vp(wrap(c5)).errors[0].path, 'residual.who')
  assert.equal(vp(wrap(c1)).errors[0].path.startsWith('predicates['), false)
})

test('S3-TC-A05 sample 边界', () => {
  assert.doesNotThrow(() => assertFields({ ...base(), residual: { who: 'reviewer-audit', sample: 1 } }))
  ;[0, -1, 1.5, '3', NaN].forEach((v) => assert.throws(() => assertFields({ ...base(), residual: { who: 'reviewer-audit', sample: v } })))
  assert.deepEqual([0, -1, 1.5, '3', NaN].map((v) => vp({ 'blank-evidence': { ...base(), residual: { who: 'reviewer-audit', sample: v } } }).ok), [false, false, false, false, false])
})

// ── B 组：label 不含主观词 ─────────────────────────────────────────────────
test('S3-TC-B01 label 零命中', (t) => {
  assert.deepEqual(labelHitsOf(PREDICATES), [])
  assert.ok(TERMS.length >= 5)
  assert.equal(Object.values(PREDICATES).length, 8)
  t.diagnostic(`S3_BASE=${S3_BASE}`)
  // P2-3：`S3_BASE` 的 env 覆盖路径（门禁不注入它，只走常量默认）。三条一起才判得死——
  // ① 无 env → 默认锚；② 有 env → 取值生效；③ 模块常量确实经由该函数（防「函数改了但使用点绕过」）
  assert.equal(resolveS3Base({}), 'b5e11aa')
  assert.equal(resolveS3Base({ S3_BASE: 'abc123' }), 'abc123')
  assert.match(read('tools/docgen/test/s3-predicates.test.mjs'), /^const S3_BASE = resolveS3Base\(\)$/m)
})

test('S3-TC-B02 旧 label 红探针', () => {
  assert.equal(OLD_LABELS.length, 8)
  assert.equal(OLD_LABELS[0], '立场客观且按项目长远判断')
  assert.equal(subjectiveHit(OLD_LABELS[0]), true)
  const copy = { ...PREDICATES, 'impartial-long-term': { ...PREDICATES['impartial-long-term'], label: OLD_LABELS[0] } }
  assert.equal(vp(copy).ok, false)
  assert.equal(vp(copy).errors[0].code, 'SubjectiveLabel')
  assert.equal(vp(copy).errors[0].path, 'label')
  assert.equal(vp(PREDICATES).ok, true)
})

test('S3-TC-B03 词表边界', () => {
  assert.equal(subjectiveHit('依据公正且证据栏非空'), false)
  assert.equal(subjectiveHit('判断客观且证据栏非空'), true)
  assert.equal(TERMS.length, 9)
})

test('S3-TC-B04 只喂 label', () => {
  const termWithMarker = `${TERMS[0]}；证据栏非空`
  const copyObservableTerm = { ...PREDICATES, 'plain-expression': { ...PREDICATES['plain-expression'], observable: [...PREDICATES['plain-expression'].observable, termWithMarker] } }
  const copyLabelTerm = { ...PREDICATES, 'plain-expression': { ...PREDICATES['plain-expression'], label: `${PREDICATES['plain-expression'].label}${termWithMarker}` } }
  assert.deepEqual(labelHitsOf(copyObservableTerm), [])
  assert.equal(labelHitsOf(copyObservableTerm).length + 8, 8)
  assert.equal(vp(copyObservableTerm).ok, true)
  assert.ok(markerKindsOf(termWithMarker).length >= 1)
  assert.ok(labelHitsOf(copyLabelTerm).length >= 1)
  assert.equal(vp(copyLabelTerm).errors[0].path, 'label')
  assert.equal(vp(PREDICATES).ok, true)
})

// ── C 组：observable 每元素命中 ≥1 标记 ────────────────────────────────────
test('S3-TC-C01 observable 全命中标记', () => {
  const elements = Object.values(PREDICATES).flatMap((p) => p.observable)
  assert.deepEqual(elements.filter((e) => markerKindsOf(e).length === 0), [])
  assert.equal(MARKERS.length, 8)
  assert.ok(elements.length >= 8)
  assert.deepEqual([...new Set(elements.flatMap((e) => markerKindsOf(e)))].sort(), ['compare', 'count', 'empty', 'nonempty', 'pathline'].sort())
})

test('S3-TC-C02 空转探针', () => {
  assert.deepEqual(markerKindsOf('ok'), [])
  assert.deepEqual(markerKindsOf('写得好'), [])
  assert.equal(evaluateText('ok', { terms: TERMS, markers: MARKERS }).verdict, 'pass')
})

test('S3-TC-C03 矩阵与整串', () => {
  assert.deepEqual(markerKindsOf('计数 = 2'), ['count'])
  assert.deepEqual(markerKindsOf('计数 ≥ 2'), ['compare'])
  assert.deepEqual(markerKindsOf('依据 scripts/check-observable.mjs:12'), ['pathline'])
  assert.deepEqual(markerKindsOf('退出码 exit 0'), ['exit'])
  assert.deepEqual(markerKindsOf('判断客观稳妥'), [])
  assert.deepEqual(markerKindsOf('对照 scripts/check-observable.mjs:12\n判断客观稳妥'), ['pathline'])
  assert.equal(subjectiveHit(`${TERMS[0]}；证据栏非空`), true)
  assert.ok(hasMarker(`${TERMS[0]}；证据栏非空`))
})

// ── D 组：never 形态 / 语义保真 / C-8 ──────────────────────────────────────
test('S3-TC-D01 never 逐字行', () => {
  assert.equal(NEVER_IDS.length, 4)
  assert.equal(OBJECT_NAMES['issue.card.suggestion'], '问题卡「建议解法」栏')
  const lines = NEVER_IDS.map((id) => renderNeverLine(id))
  assert.deepEqual(lines, NEVER_IDS.map((id) => `- 1｜不得${PREDICATES[id].label}（针对${SHARED_NEVER.find((a) => a.criterion === id).objects.map((o) => OBJECT_NAMES[o]).join('、')}）；出现即违反。`))
  assert.equal(/计数 ≥1/.test(PREDICATES['out-of-scope-self-disposal'].label), true)
  assert.equal(/所记名称 != 该实例名/.test(PREDICATES['proxy-fill'].label), true)
})

test('S3-TC-D02 never 形态两构造', () => {
  const card = clone(agentData.find((a) => a.name === SEATS[0]).card)
  card.must = []
  card.never = [{ ...clone(SHARED_NEVER.find((a) => a.criterion === 'issue-without-solution')), criterion: '须给具体动作与验收' }]
  const mutLine = renderCard(card, { seat: SEATS[0] }).split('## 禁止')[1].split(/\r?\n/).find((l) => l.startsWith('- ')) ?? ''
  assert.equal(/不得/.test(mutLine) && /须/.test(mutLine), true)
  assert.equal(/须/.test(renderNeverLine('issue-without-solution')), false)
  const copyOutOfScopeLabel = PREDICATES['out-of-scope-self-disposal'].label.replace(/——.*$/, '——越界处置动作 计数 = 0 且正文含「声明」行')
  assert.throws(() => assert.equal(/计数 ≥1/.test(copyOutOfScopeLabel), true))
  assert.equal(NEVER_IDS.map((id) => /不得[^。]*[须必须]/.test(renderNeverLine(id))).filter(Boolean).length, 0)
})

test('S3-TC-D03 must 侧', () => {
  assert.equal(MUST_IDS.map((id) => /不得/.test(renderMustLine(id))).filter(Boolean).length, 0)
  assert.equal(renderMustLine('evidence-recomputable').includes('path:line'), true)
  assert.equal(MUST_IDS.length, 4)
})

test('S3-TC-D04 语义保真与载体', () => {
  assertCoreLabel(PREDICATES)
  assertLabelDash(PREDICATES)
  const allText = Object.values(PREDICATES).map((p) => `${p.label}\n${p.observable.join('\n')}\n${p.negativeSample}`).join('\n')
  assertNoLegacyTerms(allText)
  const specSrc = read('docs/superpowers/specs/2026-11-02-observable-s3-predicates-reuse-design.md')
  assertCarriers(specSrc)
  assert.ok(allText.includes(OBJECT_NAMES['issue.card.suggestion']))
})

test('S3-TC-D05 三条反例', () => {
  const before = sha256('tools/docgen/card-model/vocab/predicates.mjs')
  const copy1 = { ...PREDICATES, 'no-fake-problem': { ...PREDICATES['no-fake-problem'], label: 'findings 集合为空时该行必须存在' } }
  assert.throws(() => assertCoreLabel(copy1))
  assert.throws(() => assertLabelDash(copy1))
  const specSrc = read('docs/superpowers/specs/2026-11-02-observable-s3-predicates-reuse-design.md')
  const specCopy = specSrc.replace('`audit` / `issue-card` 的「证据」栏', '「两栏」')
  assert.notEqual(specCopy, specSrc)
  assert.throws(() => assertCarriers(specCopy))
  assert.throws(() => assertNoLegacyTerms('两栏依据'))
  assert.throws(() => assertC8Mirror(PREDICATES['proxy-fill'].label.replace(/——.*$/, '——签名字段所记名称与本实例名一致')))
  assert.equal(sha256('tools/docgen/card-model/vocab/predicates.mjs'), before)
})

test('S3-TC-D06 label 后段可判', () => {
  assertLabelMarker(PREDICATES)
  assert.equal(Object.values(PREDICATES).filter((p) => !p.label.includes('——')).length, 0)
  assert.ok(new Set(Object.values(PREDICATES).flatMap((p) => markerKindsOf(p.label.split('——')[1] ?? ''))).size >= 3)
})

// ── E 组：validatePredicates 五条判定 ──────────────────────────────────────
test('S3-TC-E01 仓内 8 条全过', () => {
  assert.deepEqual(vp(PREDICATES), { ok: true, errors: [] })
  assert.deepEqual(Object.keys(vp(PREDICATES)), ['ok', 'errors'])
})

test('S3-TC-E02 纯函数与 0 新码', () => {
  const src = read('tools/docgen/card-model/validatePredicates.mjs')
  const fnSrc = src.slice(src.indexOf('export function validatePredicates'))
  assert.equal(/readFileSync|writeFileSync|process\.env/.test(fnSrc), false)
  const codeLiterals = new Set([...fnSrc.matchAll(/'([A-Z][A-Za-z0-9]*)'/g)].map((m) => m[1]))
  assert.deepEqual([...codeLiterals].filter((c) => !['SubjectiveLabel', 'UnverifiableOutput'].includes(c)), [])
  assert.equal(Object.keys(CM.CARD_MODEL_CODES).length, 36) // counter-probe: off（码表规模，非 baseline / 席位计数）
  assert.equal(Object.keys(CM.SCAN_FIELDS).length, 8)
  assert.deepEqual([exitCodeFor('SubjectiveLabel'), exitCodeFor('UnverifiableOutput')], [1, 1])
})

test('S3-TC-E03 D1 不豁免', () => {
  const copy = { ...PREDICATES, 'impartial-long-term': { ...PREDICATES['impartial-long-term'], label: '判断客观且依据条 计数 ≥ 2' } }
  assert.equal(vp(copy).ok, false)
  assert.equal(vp(copy).errors.length, 1)
  assert.equal(vp(copy).errors[0].code, 'SubjectiveLabel')
  assert.equal(vp(copy).errors[0].path, 'label')
})

test('S3-TC-E04 D2 四形态', () => {
  const c1 = { ...base(), observable: '计数 = 1' }
  const c2 = { ...base(), observable: [] }
  const c3 = { ...base(), observable: ['计数 = 1', ''] }
  const c4 = { ...base(), observable: ['计数 = 1', 3] }
  const wrap = (one) => ({ 'blank-evidence': one })
  assert.deepEqual([c1, c2, c3, c4].map((c) => vp(wrap(c)).ok), [false, false, false, false])
  assert.deepEqual([c1, c2, c3, c4].map((c) => vp(wrap(c)).errors[0].code), Array(4).fill('UnverifiableOutput'))
  assert.equal(vp(wrap(c1)).errors[0].path, 'observable')
  assert.equal(vp(wrap(c3)).errors[0].path, 'observable[1]')
})

test('S3-TC-E05 D3 两形态', () => {
  const c1 = { ...base() }
  delete c1.negativeSample
  const c2 = { ...base(), negativeSample: '   ' }
  const wrap = (one) => ({ 'blank-evidence': one })
  assert.deepEqual([vp(wrap(c1)).ok, vp(wrap(c2)).ok], [false, false])
  assert.deepEqual([vp(wrap(c1)).errors[0].code, vp(wrap(c2)).errors[0].code], ['UnverifiableOutput', 'UnverifiableOutput'])
  assert.deepEqual([vp(wrap(c1)).errors[0].path, vp(wrap(c2)).errors[0].path], ['negativeSample', 'negativeSample'])
})

test('S3-TC-E06 D4 四形态', () => {
  const c1 = { ...base() }
  delete c1.residual
  const c2 = { ...base(), residual: { who: '', sample: 3 } }
  const c3 = { ...base(), residual: { who: 'reviewer-audit', sample: 0 } }
  const c4 = { ...base(), residual: { who: 'reviewer-audit', sample: '3' } }
  const wrap = (one) => ({ 'blank-evidence': one })
  assert.deepEqual([c1, c2, c3, c4].map((c) => vp(wrap(c)).ok), [false, false, false, false])
  assert.deepEqual([c1, c2, c3, c4].map((c) => vp(wrap(c)).errors[0].code), Array(4).fill('UnverifiableOutput'))
  assert.deepEqual([vp(wrap(c1)).errors[0].path, vp(wrap(c2)).errors[0].path], ['residual.who', 'residual.who'])
  assert.deepEqual([vp(wrap(c3)).errors[0].path, vp(wrap(c4)).errors[0].path], ['residual.sample', 'residual.sample'])
})

test('S3-TC-E07 D5 反向探针', () => {
  const c1 = { ...PREDICATES, 'no-fake-problem': { ...PREDICATES['no-fake-problem'], observable: ['ok'] } }
  const c2 = { ...PREDICATES, 'no-fake-problem': { ...PREDICATES['no-fake-problem'], observable: ['写得好'] } }
  assert.deepEqual([vp(c1).ok, vp(c2).ok], [false, false])
  assert.deepEqual([vp(c1).errors[0].code, vp(c2).errors[0].code], ['UnverifiableOutput', 'UnverifiableOutput'])
  assert.deepEqual([vp(c1).errors[0].path, vp(c2).errors[0].path], ['observable[0]', 'observable[0]'])
  assert.deepEqual([markerKindsOf('ok'), markerKindsOf('写得好')], [[], []])
})

test('S3-TC-E08 全列与不可变', () => {
  const before = JSON.stringify(PREDICATES)
  const copy = { ...PREDICATES, 'blank-evidence': { ...base(), label: `判断${TERMS[0]}——证据栏非空`, negativeSample: '', residual: { who: 'reviewer-audit', sample: 0 }, observable: ['ok'] } }
  const r = vp(copy)
  assert.ok(r.errors.length >= 4)
  assert.deepEqual([...new Set(r.errors.map((e) => e.path.replace(/\[\d+\]/g, '[]')))].sort(), ['label', 'negativeSample', 'observable[]', 'residual.sample'].sort())
  assert.equal(r.errors.some((e) => e.path.startsWith('predicates[')), false)
  assert.deepEqual([...new Set(r.errors.map((e) => e.code))].sort(), ['SubjectiveLabel', 'UnverifiableOutput'])
  assert.deepEqual(Object.keys(r.errors[0]).sort(), ['code', 'message', 'path'])
  assert.equal(before, JSON.stringify(PREDICATES))
})

// ── F 组：substring 单实现点与卡面可行性 ────────────────────────────────────
const cardModelFiles = () => walkFiles(join(REPO, 'tools/docgen/card-model'))
const countExportHit = () => cardModelFiles().reduce((n, f) => n + (readFileSync(f, 'utf8').match(/(export const subjectiveHit|export function subjectiveHit)/g) ?? []).length, 0)
const countLocalHit = () => cardModelFiles().reduce((n, f) => n + (readFileSync(f, 'utf8').match(/^const (subjectiveHit|tokensOf) =/gm) ?? []).length, 0)

test('S3-TC-F01 单实现点', () => {
  assert.equal(countExportHit(), 1)
  assert.equal(countLocalHit(), 0)
  const vcm = read('tools/docgen/card-model/validateCardModel.mjs')
  assert.equal(vcm.includes('subjectiveHit'), true)
  assert.equal(vcm.includes("from './vocab/subjective-terms.mjs'"), true)
})

test('S3-TC-F02 第二实现点', () => {
  const before = sha256('tools/docgen/card-model/validateCardModel.mjs')
  let copyDef = -1
  coldRepo({
    mutate: (copy) => {
      const p = join(copy, 'tools/docgen/card-model/validateCardModel.mjs')
      writeFileSync(p, `${readFileSync(p, 'utf8')}\nconst tokensOf = (t) => [t]\nconst subjectiveHit = (t) => tokensOf(t).some((x) => x === t)\n`, 'utf8')
    },
    verify: (copy) => {
      copyDef = walkFiles(join(copy, 'tools/docgen/card-model')).reduce((n, f) => n + (readFileSync(f, 'utf8').match(/const subjectiveHit =/g) ?? []).length, 0)
    },
  })
  assert.equal(copyDef, 2)
  assert.throws(() => assert.equal(copyDef, 1))
  assert.equal(sha256('tools/docgen/card-model/validateCardModel.mjs'), before)
})

test('S3-TC-F03 口径切换实证', () => {
  const s = OLD_LABELS[0]
  assert.equal(subjectiveHit(s), true)
  assert.equal(legacyTokenHit(s), false)
  assert.notEqual(subjectiveHit(s), legacyTokenHit(s))
})

test('S3-TC-F04 红探针', () => {
  assert.equal(OLD_LABELS.length, 8)
  const copy = {}
  Object.keys(PREDICATES).forEach((id, i) => { copy[id] = { ...PREDICATES[id], label: OLD_LABELS[i] } })
  assert.equal(vp(copy).ok, false)
  assert.equal(vp(copy).errors.length, 1)
  assert.equal(vp(copy).errors[0].code, 'SubjectiveLabel')
  assert.equal(vp(copy).errors[0].path, 'label')
})

test('S3-TC-F05 15 席 0/0', (t) => {
  const scan = (hits) => {
    let n = 0
    let s = 0
    let tok = 0
    const visit = (p, x) => {
      if (typeof x !== 'string' || !x) return
      n += 1
      if (subjectiveHit(x)) { s += 1; hits.push(p) }
      if (x.split(/[、，,/\s]+/).some((e) => TERMS.includes(e))) tok += 1
    }
    for (const it of agentData) {
      const d = (it.card && it.card.duty) || {}
      ;(d.categories || []).forEach((x, i) => visit(`${it.name}.categories[${i}]`, x))
      ;(it.card && it.card.checkItems ? it.card.checkItems : []).forEach((c, i) => {
        visit(`${it.name}.checkItems[${i}].label`, c.label)
        visit(`${it.name}.checkItems[${i}].criterion`, c.criterion)
      })
      ;[d.trigger, d.action, d.constraint].forEach((x, i) => visit(`${it.name}.extra[${i}]`, x))
    }
    return { n, s, tok }
  }
  const hits = []
  const r = scan(hits)
  assert.equal(r.s, 0)
  assert.equal(r.tok, 0)
  assert.ok(r.n >= SEATS.length * 3)
  t.diagnostic(`texts ${r.n}（spec §4 实测 291 + 45 = 336）`)
})

test('S3-TC-F06 判别力', () => {
  let mutated = 0
  let others = 0
  const restore = mutCard(SEATS[0], (card) => { card.duty.action = `${card.duty.action}（${TERMS[0]}）` })
  try {
    for (const it of agentData) {
      const d = (it.card && it.card.duty) || {}
      const texts = [...(d.categories || []), d.trigger, d.action, d.constraint]
      const hits = texts.filter((x) => typeof x === 'string' && subjectiveHit(x)).length
      if (it.name === SEATS[0]) mutated += hits
      else others += hits
    }
  } finally {
    restore()
  }
  assert.ok(mutated >= 1)
  assert.equal(others, 0)
  const repoTexts = agentData.flatMap((it) => {
    const d = (it.card && it.card.duty) || {}
    return [...(d.categories || []), d.trigger, d.action, d.constraint]
  })
  assert.equal(repoTexts.filter((x) => typeof x === 'string' && subjectiveHit(x)).length, 0)
})

test('S3-TC-F07 无第二份词面', () => {
  const src = read('tools/docgen/card-model/vocab/subjective-terms.mjs')
  assert.equal(TERMS.filter((w) => src.includes(w)).length, 0)
  assert.equal(src.includes('observable-terms.json'), true)
  assert.equal((src.match(/readFileSync\(/g) ?? []).length, 1)
})

// ── G 组：gate 接线 ────────────────────────────────────────────────────────
test('S3-TC-G01 gate 绿', (t) => {
  const r = runCli(['gate'])
  assert.equal(r.code, 0)
  assert.equal(/Mismatch/.test(r.out), false)
  t.diagnostic(`baseline 行（不判）: ${(r.out.match(/baseline \d+\/\d+/) ?? [''])[0]}`)
})

test('S3-TC-G02 判据表坏', () => {
  const bad = OLD_LABELS[0]
  coldRepo({
    mutate: (copy) => {
      const p = join(copy, 'tools/docgen/card-model/vocab/predicates.mjs')
      writeFileSync(p, readFileSync(p, 'utf8').replace(PREDICATES['impartial-long-term'].label, bad), 'utf8')
    },
    verify: (copy, r) => {
      assert.equal(r.code, 1)
      assert.match(r.out.split(/\r?\n/)[0], /^SubjectiveLabel: predicates\[impartial-long-term\]\.label/)
      // stderr 契约（cli.mjs 注释）：错误码**只出现一次**——首条的码由 main catch 打，逐条 console.error 不带码
      assert.equal((r.out.match(/SubjectiveLabel/g) ?? []).length, 1)
      assert.equal(r.out.includes('Mismatch'), false)
    },
  })
})

test('S3-TC-G03 顺序', () => {
  coldRepo({
    mutate: (copy) => {
      const p = join(copy, 'tools/docgen/card-model/vocab/predicates.mjs')
      writeFileSync(p, readFileSync(p, 'utf8').replace(PREDICATES['impartial-long-term'].label, OLD_LABELS[0]), 'utf8')
    },
    verify: (copy, r) => {
      assert.equal(r.code, 1)
      assert.equal(/Mismatch/.test(r.out.split(/\r?\n/)[0]), false)
      assert.match(r.out.split(/\r?\n/)[0], /predicates\[/)
    },
  })
})

test('S3-TC-G04 barrel 不加导出', () => {
  assert.equal(Object.keys(CM).length, 18)
  assert.equal(Object.keys(CM).includes('validatePredicates'), false)
  assert.equal(read('tools/docgen/cli.mjs').includes('card-model/validatePredicates.mjs'), true)
})

// ── H 组：15 卡重生成 / 必红期 / 回退面 ────────────────────────────────────
test('S3-TC-H01 disk == render', () => {
  const state = JSON.parse(read('tools/docgen/state.json'))
  assert.deepEqual([...new Set(Object.values(state.agents))], ['replaced'])
  assert.deepEqual(Object.keys(state.agents).sort(), SEATS.slice().sort())
  let mismatch = 0
  let compared = 0
  for (const seat of SEATS) {
    const p = join(REPO, 'agents', `${seat}.md`)
    const rendered = renderSeat(seat).card
    compared += 1
    if (Buffer.compare(Buffer.from(rendered), readFileSync(p)) !== 0) mismatch += 1
  }
  assert.equal(mismatch, 0)
  assert.equal(compared, SEATS.length)
})

test('S3-TC-H02 手改即红', () => {
  coldRepo({
    mutate: appendOneByte(`agents/${SEATS[0]}.md`),
    verify: (copy, r) => {
      assert.equal(r.code, 1)
      assert.match(r.out, /Mismatch/)
      assert.match(r.out, new RegExp(escape(SEATS[0])))
    },
  })
})

test('S3-TC-H03 卡面文案', () => {
  const cards = buildCards()
  let missingLabelLines = 0
  for (const b of cards) {
    const text = renderSeat(b.seat).card
    const must = text.split('## 一定会')[1].split(/^## /m)[0].split(/\r?\n/).filter((l) => l.startsWith('- '))
    const never = text.split('## 禁止')[1].split(/^## /m)[0].split(/\r?\n/).filter((l) => l.startsWith('- '))
    ;(b.card.must || []).forEach((a, i) => {
      if (PREDICATES[a.criterion] && !must[i].includes(PREDICATES[a.criterion].label)) missingLabelLines += 1
    })
    ;(b.card.never || []).forEach((a, i) => {
      if (PREDICATES[a.criterion] && !never[i].includes(PREDICATES[a.criterion].label)) missingLabelLines += 1
    })
  }
  assert.equal(missingLabelLines, 0)
  // 旧 label 的残留面 = 4 条 never 的旧 label 是新 label 的**核心语义前缀**（C-7 要求保留）；
  // 该判据 = 「含旧 label 但不含新 label」的陈旧行 = 0
  const newLabels = Object.values(PREDICATES).map((p) => p.label)
  const stale = SEATS.map((s) => read(`agents/${s}.md`)).join('\n').split(/\r?\n/)
    .filter((l) => oldHits(l) > 0 && !newLabels.some((n) => l.includes(n)))
  assert.equal(stale.length, 0)
  assert.equal(OLD_LABELS.length, 8)
})

test('S3-TC-H04 边界', () => {
  const all = SEATS.map((s) => read(`agents/${s}.md`)).join('\n')
  assert.equal((all.match(/不得不得/g) ?? []).length, 0)
  assert.equal(read('tools/docgen/baseline.json'), renderBaseline())
  assert.equal(JSON.parse(read('tools/docgen/baseline.json')).length, TOTAL)
})

test('S3-TC-H05 前提破裂探针', () => {
  const state = JSON.parse(read('tools/docgen/state.json'))
  assert.deepEqual([...new Set(Object.values(state.agents))], ['replaced'])
  const before = sha256('tools/docgen/state.json')
  coldRepo({
    mutate: (copy) => {
      const p = join(copy, 'tools/docgen/state.json')
      const s = JSON.parse(readFileSync(p, 'utf8'))
      // state 值域 = {replaced, suspended}（`state.mjs` 的 VALUES）；'registered' 会触发 StateFileInvalid（exit 2），
      // 故前提破裂探针用 schema 允许的唯一非 replaced 值 `suspended`
      s.agents[SEATS[0]] = 'suspended'
      writeFileSync(p, `${JSON.stringify(s, null, 2)}\n`, 'utf8')
    },
    verify: (copy, r) => {
      assert.equal(r.code, 1)
      assert.match(r.out, new RegExp(`未接管席 ${escape(SEATS[0])}（state=suspended）`))
      assert.equal(r.out.includes(`Mismatch: agents/${SEATS[0]}.md`), false)
    },
  })
  const ctrl = runCli(['gate'])
  assert.equal(ctrl.code, 0)
  assert.equal(sha256('tools/docgen/state.json'), before)
})

test('S3-TC-H06 必红期与回退', () => {
  // ① 只改判据表 label（改成合规形态）、不重生成卡 → 必红期只报首条单行
  coldRepo({
    mutate: (copy) => {
      const p = join(copy, 'tools/docgen/card-model/vocab/predicates.mjs')
      writeFileSync(p, readFileSync(p, 'utf8').replace('立场不偏', '立场中立'), 'utf8')
    },
    verify: (copy, r) => {
      assert.equal(r.code, 1)
      assert.match(r.out.trim().split(/\r?\n/)[0], /Mismatch: .*agents\//)
      assert.equal((r.out.match(/Mismatch/g) ?? []).length, 1)
    },
  })
  // ② 回退面：整批回到 <S3-BASE>（判据表 + 15 卡 + 校验器 + 接线 + 词表派生）
  // `2026-11-03`（S-A T5 / Q8）补一项：卡面边界段的**内容源**也在定义层（`paths.mjs`），Q8 删了 3 项路径；
  // 只回退卡不回退定义层 → 旧卡（23 项）≠ 新渲染（20 项）→ 回退面不可达。故把定义层一并回退。
  // `2026-11-03`（S-B Task 8）再补：R5/R6 把模板 4 行 + 5 个槽值改成指针句（`templates/boundary.md.tpl` +
  // `renderBoundary.mjs`），`FORMAT_CHECKS[1]` / `outputFormats.checks[0]` 的文案也随之改写——旧卡（逐项清单 +
  // 旧 check 文案）与新渲染器**不再自洽**。按 spec §11.2.6 的第二种口径：该步断言改为「回退后必落 Mismatch」，
  // 不再要求 exit 0（「必红期」语义在 ① 里，不因实现改动而放宽）。
  const S3_REL = [
    'tools/docgen/card-model/vocab/predicates.mjs',
    'tools/docgen/card-model/validateCardModel.mjs',
    'tools/docgen/card-model/vocab/subjective-terms.mjs',
    'tools/docgen/cli.mjs',
    'tools/docgen/policy/definitions/paths.mjs',
    ...SEATS.map((s) => `agents/${s}.md`),
  ]
  coldRepo({
    mutate: (copy) => {
      for (const rel of S3_REL) {
        const p = join(copy, rel)
        writeFileSync(p, execFileSync('git', ['show', `${S3_BASE}:${rel}`], { cwd: REPO, encoding: 'utf8' }), 'utf8')
      }
      rmSync(join(copy, 'tools/docgen/card-model/validatePredicates.mjs'), { force: true })
    },
    verify: (copy, r) => {
      // S-B 后：只回退卡面（不回退模板 / 渲染器 / check 文案）→ 盘上 ≠ 渲染 → 必报 Mismatch
      assert.equal(r.code, 1)
      assert.match(r.out, /Mismatch/)
    },
  })
})

test('S3-TC-H07 S1a→S1b', () => {
  const r1 = runNodeClean(['--test', 'tools/docgen/test/pilot-render.test.mjs'])
  const r2 = runNodeClean(['--test', 'tools/docgen/test/evidence-reader.test.mjs'])
  assert.deepEqual([r1.code, r2.code], [0, 0])
  const rGate = runCli(['gate'])
  assert.equal(rGate.code, 0)
  assert.equal(/Mismatch/.test(rGate.out), false)
})

test('S3-TC-H08 跳过 S1a', () => {
  const before = sha256('tools/docgen/test/pilot-render.test.mjs')
  coldRepo({
    mutate: (copy) => {
      for (const rel of ['tools/docgen/test/pilot-render.test.mjs', 'tools/docgen/test/evidence-reader.test.mjs']) {
        writeFileSync(join(copy, rel), execFileSync('git', ['show', `${S3_BASE}:${rel}`], { cwd: REPO, encoding: 'utf8' }), 'utf8')
      }
    },
    verify: (copy) => {
      const r1 = runNodeClean(['--test', 'tools/docgen/test/pilot-render.test.mjs'], copy)
      const r2 = runNodeClean(['--test', 'tools/docgen/test/evidence-reader.test.mjs'], copy)
      assert.deepEqual([r1.code, r2.code].map((c) => c !== 0), [true, true], `r1=${r1.code} ${r1.out.slice(0, 200)} | r2=${r2.code} ${r2.out.slice(0, 200)}`)
    },
  })
  assert.equal(sha256('tools/docgen/test/pilot-render.test.mjs'), before)
})

// ── I 组：F-09 检查点 / 计数 / 归桶 / ⑨ 判别力 ──────────────────────────────
test('S3-TC-I01 criteria ⑨ 行', () => {
  const src = read('skills/rule-inspector/references/criteria.md')
  assertCriteriaNine(src)
  const sevenRow = splitRow(src.split(/\r?\n/).find((l) => /^\|\s*⑦\s*\|/.test(l)))
  const eightRow = splitRow(src.split(/\r?\n/).find((l) => /^\|\s*⑧\s*\|/.test(l)))
  assert.deepEqual([sevenRow[3], eightRow[3]].map((s) => /有 1\s*[\/｜]\s*无 0/.test(s)), [true, true])
})

test('S3-TC-I02 计数与归桶四处', () => {
  const criteriaSrc = read('skills/rule-inspector/references/criteria.md')
  assertCounts(criteriaSrc)
  assertTwoTables(criteriaSrc)
  assert.match(read('skills/rule-inspector/SKILL.md'), /25 检查点/)
  const wg = read('skills/rule-writer/references/writing-guide.md')
  const rw = read('skills/rule-writer/SKILL.md')
  assert.deepEqual([wg, rw].map((s) => (s.match(/执行力度 9 项/g) ?? []).length >= 3), [true, true])
  assert.equal((wg.match(/执行力度 8 项/g) ?? []).length, 0)
  assert.equal((rw.match(/执行力度 8 项/g) ?? []).length, 0)
  const checklist = read('skills/rule-inspector/assets/rule-edit-checklist-template.md')
  const e25 = checklist.split(/\r?\n/).find((l) => l.includes('E2-5'))
  assert.match(e25, /9 项/)
  assert.match(wg, /6\/6/)
  assert.match(read('skills/rule-writer/assets/rule-skeleton.md'), /6\/6/)
  assert.deepEqual(RULE_MARKER_ITEM['⑨'], ['执行力度⑨', 'rule 独有'])
  assert.equal(BUCKETS.find((b) => b.name === 'rule 独有').items.includes('执行力度⑨'), true)
  assert.equal(BUCKETS.find((b) => b.name === 'skill 独有').items.includes('判据可观察⑤'), true)
  const carriers = {
    'skills/rule-inspector/references/criteria.md': criteriaSrc,
    'rules/skill-authoring-convention.md': read('rules/skill-authoring-convention.md'),
  }
  assert.ok(['执行力度⑨', '判据可观察⑤'].every((it) => [...itemsFromCriteria(carriers).keys()].includes(it)))
  assert.equal(findingCodes(checkBuckets()).length, 0)
  assert.ok(/①\s*[-–—]\s*⑨/.test(read('tools/execution-matrix/check-buckets.mjs')))
  // ⑨ / skill 判据⑤ 各自独有 → 不得进共享项（rule 侧 ⑤ 冲突裁决仍在共享集，故只判 ⑨）
  assert.deepEqual(SHARED_MARKERS.filter((m) => m === '⑨'), [])
  assert.deepEqual(RULE_MARKER_ITEM['⑤'], ['冲突裁决⑤', 'skillAndRuleShared'])
  assert.deepEqual([...Object.values(RULE_MARKER_ITEM)].filter(([, b]) => b === 'skillAndRuleShared').length > 0, true)
})

test('S3-TC-I03 R9', () => {
  const src = read('skills/rule-inspector/references/recipes.md')
  const start = src.indexOf('### §R9')
  assert.ok(start >= 0)
  const body = src.slice(start + 4)
  const title = body.split(/\r?\n/)[0]
  assert.match(title, /判据不可观察/)
  assert.equal(['比较', 'path:line', '豁免'].filter((k) => body.includes(k)).length, 3)
  assert.equal(/\bevaluateText\b/.test(body), false)
})

test('S3-TC-I04 ⑨ 接线与块内零词面', () => {
  const before = sha256('skills/rule-inspector/scripts/score.mjs')
  const src = read('skills/rule-inspector/scripts/score.mjs')
  const lines = src.split(/\r?\n/)
  const startLayer = lines.findIndex((l) => l.includes("g('执行力度', '⑨判据可观察'"))
  assert.ok(startLayer >= 0)
  let depth = 0
  let end = startLayer
  for (let i = startLayer; i < lines.length; i += 1) {
    for (const ch of lines[i]) {
      if (ch === '(') depth += 1
      else if (ch === ')') depth -= 1
    }
    if (depth <= 0) { end = i; break }
  }
  // ⑨ 专属区 = 常量行 + 判定函数 + `g('执行力度', '⑨判据可观察'…)` 调用（**不再**并入「本批 diff 的全部新增行」——
  // 那会把后续批次对 score.mjs 的正常新增判成红，属跨批耦合）
  const constIdx = lines.findIndex((l) => l.includes('OBSERVABLE_TERMS = JSON.parse'))
  const fnIdx = lines.findIndex((l) => l.startsWith('function verifySectionHasMarker'))
  assert.ok(constIdx >= 0 && fnIdx > constIdx)
  const fnEnd = lines.findIndex((l, i) => i > fnIdx && l === '}')
  assert.ok(fnEnd > fnIdx)
  const blockLines = [...lines.slice(constIdx, fnEnd + 1), ...lines.slice(startLayer, end + 1)]
  const block = blockLines.join('\n')
  assert.equal((src.match(/g\('执行力度', '⑨判据可观察'/g) ?? []).length, 1)
  assert.ok(blockLines.some((l) => l.includes('markers')))
  assert.ok(blockLines.some((l) => l.includes('observable-terms.json')))
  assert.ok(blockLines.some((l) => l.includes('验证')))
  assert.equal(/observable-exempt/.test(block), false)
  assert.equal(/LOOSE_RE|VERIFY_RE/.test(block), false)
  assert.equal([...TERMS, ...CRIT_TERMS].filter((w) => blockLines.some((l) => l.includes(w))).length, 0)
  const looseReLine = lines.findIndex((l) => l.includes('const LOOSE_RE'))
  assert.ok(startLayer > looseReLine)
  assert.ok([...TERMS, ...CRIT_TERMS].filter((w) => `${block}\n${TERMS[0]}`.split(/\r?\n/).some((l) => l.includes(w))).length >= 1)
  assert.equal(sha256('skills/rule-inspector/scripts/score.mjs'), before)
})

const mkRule = (body) => {
  const dir = mkdtempSync(join(tmpdir(), 's3-rule-'))
  writeFileSync(join(dir, 'r.md'), body, 'utf8')
  return dir
}
const RULE_HEAD = '# 禁止随意改动代码\n\n> 来源：项目约定（2026-11-02）｜落地：2026-11-02\n\n## 核心判据\n'

test('S3-TC-I05 有标记得 1', () => {
  const dir = mkRule(`${RULE_HEAD}禁止随意改动代码，必须运行测试。\n\n## 验证\nnode scripts/check-observable.mjs --check，exit 0\n`)
  const r = scoreFile(join(dir, 'r.md'), dir, { type: '持续适用', polarity: '禁令' })
  assert.equal(eight(r).pass, true)
  // testcase I05 原文写 `>= 9`；持续适用·禁令 的执行力度适用项为 7（I10 同表），此处按 I10 的 7 判
  assert.ok(r.groups['执行力度'].max >= 7)
  rmSync(dir, { recursive: true, force: true })
})

test('S3-TC-I06 无标记得 0', () => {
  const dir = mkRule(`${RULE_HEAD}禁止随意改动代码，必须运行测试。\n\n## 验证\n请认真确认，务必做到位\n`)
  const r = scoreFile(join(dir, 'r.md'), dir, { type: '持续适用' })
  assert.equal(eight(r).pass, false)
  assert.ok(r.findings.some((f) => f.check.includes('⑨')))
  const fixed = scoreFile(join(dir, 'r.md'), dir, { type: '持续适用' })
  void fixed
  writeFileSync(join(dir, 'r.md'), `${RULE_HEAD}禁止随意改动代码，必须运行测试。\n\n## 验证\n请认真确认，务必做到位；exit 0\n`, 'utf8')
  assert.equal(eight(scoreFile(join(dir, 'r.md'), dir, { type: '持续适用' })).pass, true)
  // 围栏代码块里的标记不算：示例代码不得代替真判据（与 evaluateText 同一跳过口径）
  writeFileSync(join(dir, 'r.md'), `${RULE_HEAD}禁止随意改动代码，必须运行测试。\n\n## 验证\n请认真确认，务必做到位\n\n\`\`\`\n计数 = 3\n\`\`\`\n`, 'utf8')
  assert.equal(eight(scoreFile(join(dir, 'r.md'), dir, { type: '持续适用' })).pass, false)
  rmSync(dir, { recursive: true, force: true })
})

test('S3-TC-I07 无验证节', () => {
  const dir = mkRule(`${RULE_HEAD}编辑后禁止随意改动代码，计数 = 3 条逐条核。\n`)
  const r = scoreFile(join(dir, 'r.md'), dir, { type: '条件触发' })
  assert.equal(eight(r).pass, false)
  assert.equal(eight(r).group, '执行力度')
  assert.equal(seven(r).pass, true)
  rmSync(dir, { recursive: true, force: true })
})

test('S3-TC-I08 验证节定位', () => {
  const dir = mkRule(`${RULE_HEAD}禁止随意改动代码。\n\n### 验证\nexit 0\n`)
  assert.equal(eight(scoreFile(join(dir, 'r.md'), dir, { type: '持续适用' })).pass, true)
  const twoSrc = `${RULE_HEAD}禁止随意改动代码。\n\n## 验证\n请认真确认\n\n## 验证\nexit 0\n`
  writeFileSync(join(dir, 'r.md'), twoSrc, 'utf8')
  assert.equal(eight(scoreFile(join(dir, 'r.md'), dir, { type: '持续适用' })).pass, false)
  assert.equal(twoSrc.split(/^## 验证$/m).length, 3)
  rmSync(dir, { recursive: true, force: true })
})

test('S3-TC-I09 登记与台账缺口', () => {
  assert.ok(unknownMarkers({ 'rules/skill-authoring-convention.md': '### 判据 ⑨：x' }).some((f) => f.code === 'BucketMarkerUnknown'))
  const ledgerText = read('tools/execution-matrix/shared-changes/changes.md')
  const withNine = `${ledgerText.trimEnd()}\n| 2026-11-02 | 执行力度⑨ | 旧 | 新 | 用户确认 | 无 |\n`
  assert.ok(findingCodes(checkSharedChanges({ ledgerText: withNine })).includes('SharedDefinitionMismatch'))
  const missingConfirm = ledgerText.replace(/\| 2026-10-20 建档基线：[^|]*\| `skills\/rule-inspector/, '|  | `skills/rule-inspector')
  assert.notEqual(missingConfirm, ledgerText)
  assert.ok(findingCodes(checkSharedChanges({ ledgerText: missingConfirm })).includes('SharedChangeIncomplete'))
  assert.ok(parseLedger(ledgerText).length >= 5)
  assert.equal(checkBuckets().ok, true)
  assert.equal(checkSharedChanges().ok, true)
})

test('S3-TC-I10 满分断言 +1', () => {
  const r = runNodeClean(['--test', 'skills/rule-inspector/scripts/score.test.mjs'])
  assert.equal(r.code, 0)
  const T = read('skills/rule-inspector/scripts/score.test.mjs')
  const cases = [['合规基准：GOOD', 26, 9], ['持续适用·禁令', 24, 7], ['条件触发·义务', 23, 6], ['模式门控·禁令', 32, 9]]
  for (const [title, N, M] of cases) {
    const b = blockOf(T, title)
    const scoreOk = (v) => b.includes(`{ score: ${v}, max: ${M} }`) || b.includes(`.score, ${v})`)
    const pass = scoreOk(M)
    assert.ok(scoreOk(pass ? M : M - 1), title)
    assert.equal(Number((b.match(/assert\.equal\(r\.max, (\d+)\)/) ?? [])[1]), N, title)
    assert.equal(Number((b.match(/assert\.equal\(r\.total, (\d+)\)/) ?? [])[1]), pass ? N : N - 1, title)
    assert.ok(/⑨/.test(b), title)
  }
})

test('S3-TC-I11 漏改一处', () => {
  const before = sha256('skills/rule-inspector/references/criteria.md')
  // 副本 = 施工前的 criteria.md（无 ⑨ 行、计数仍是 24/8/5-5）→ 三组断言各抛
  const copy = execFileSync('git', ['show', `${S3_BASE}:skills/rule-inspector/references/criteria.md`], { cwd: REPO, encoding: 'utf8' })
  assert.throws(() => assertCriteriaNine(copy))
  assert.throws(() => assertCounts(copy))
  assert.throws(() => assertTwoTables(copy))
  assert.equal(sha256('skills/rule-inspector/references/criteria.md'), before)
})

test('S3-TC-I12 判据⑤', () => {
  const src = read('rules/skill-authoring-convention.md')
  const start = src.indexOf('### 判据 ⑤')
  assert.ok(start >= 0)
  const body = src.slice(start + 4)
  const title = body.split(/\r?\n/)[0]
  assert.match(title, /可观察/)
  assert.ok(body.includes('scripts/check-observable.mjs') && /exit 0/.test(body))
  assert.doesNotThrow(() => assertNoTermCopy(src))
})

test('S3-TC-I13 六项核销', () => {
  const baseMap = () => ({
    'skills/rule-inspector/scripts/score.mjs': read('skills/rule-inspector/scripts/score.mjs'),
    'skills/rule-inspector/references/criteria.md': read('skills/rule-inspector/references/criteria.md'),
    'skills/rule-inspector/references/recipes.md': read('skills/rule-inspector/references/recipes.md'),
    'skills/rule-writer/SKILL.md': read('skills/rule-writer/SKILL.md'),
    'skills/rule-writer/references/writing-guide.md': read('skills/rule-writer/references/writing-guide.md'),
    'skills/rule-writer/assets/rule-skeleton.md': read('skills/rule-writer/assets/rule-skeleton.md'),
    'skills/review-log/assets/review-progress-template.md': read('skills/review-log/assets/review-progress-template.md'),
    'skills/rule-inspector/assets/rule-edit-checklist-template.md': read('skills/rule-inspector/assets/rule-edit-checklist-template.md'),
  })
  const kill = [
    ['skills/rule-inspector/scripts/score.mjs', /⑨判据可观察/g],
    ['skills/rule-inspector/references/recipes.md', /判据可观察/g],
    ['skills/rule-writer/references/writing-guide.md', /判据可观察/g],
    ['skills/review-log/assets/review-progress-template.md', /判据可观察/g],
    ['skills/rule-inspector/assets/rule-edit-checklist-template.md', /判据可观察/g],
    ['skills/rule-inspector/references/criteria.md', /判据可观察/g],
  ]
  for (const [rel, re] of kill) {
    const map = baseMap()
    map[rel] = map[rel].replace(re, '占位词')
    assert.throws(() => assertSync(map), `${rel} 缺项未被抓`)
  }
  assert.doesNotThrow(() => assertSync(REPO))
})

test('S3-TC-I14 两模板与删除面', () => {
  const ledgerTpl = read('skills/review-log/assets/review-progress-template.md')
  const nos = ledgerTpl.split(/\r?\n/).map((l) => l.match(/^\|\s*(\d+)\s*\|/)).filter(Boolean).map((m) => Number(m[1]))
  const EXPECTED_ROWS = 36 // counter-probe: off（查账表模板行数，非 baseline / 席位计数）
  assert.equal(Math.max(...nos), EXPECTED_ROWS)
  const run = []
  for (let i = 1; i <= EXPECTED_ROWS; i += 1) if (nos.includes(i)) run.push(i)
  assert.equal(run.length, EXPECTED_ROWS)
  assert.equal(run.filter((n, i) => n !== i + 1).length, 0)
  const checklist = read('skills/rule-inspector/assets/rule-edit-checklist-template.md')
  const e2 = checklist.split(/^## E2 · /m)[1].split(/^## /m)[0]
  const e2Rows = e2.split(/\r?\n/).filter((l) => l.includes('判据可观察'))
  assert.equal(e2Rows.length, 1)
  assert.match(e2, /9 项/)
  // criteria.md 删除 hunk 所属小节 ⊆ 允许清单内（用**改前**文件定位小节标题，避免新旧行号错位）
  const diff = execFileSync('git', ['diff', '-U0', S3_BASE, '--', 'skills/rule-inspector/references/criteria.md'], { cwd: REPO, encoding: 'utf8' })
  const beforeLines = execFileSync('git', ['show', `${S3_BASE}:skills/rule-inspector/references/criteria.md`], { cwd: REPO, encoding: 'utf8' }).split(/\r?\n/)
  if (beforeLines[0]) beforeLines[0] = beforeLines[0].replace(/^\uFEFF/, '') // 行首 BOM 会让 `^# 判据全集` 失配
  const ALLOWED = [/^# 判据全集/, /^#### 新增维度/, /^### 3\.4 /, /^### 3\.5 /, /^## 3\. 类型感知扩展/]
  const outOfScope = []
  for (const h of hunksOf(diff)) {
    if (h.deleted.length === 0) continue
    let heading = ''
    for (let i = Math.min(h.oldStart - 1, beforeLines.length - 1); i >= 0; i -= 1) {
      if (/^#{1,4}\s/.test(beforeLines[i])) { heading = beforeLines[i]; break }
    }
    if (!ALLOWED.some((re) => re.test(heading))) outOfScope.push(heading)
  }
  assert.deepEqual(outOfScope, [])
  const rowsBefore = execFileSync('git', ['show', `${S3_BASE}:skills/rule-inspector/references/criteria.md`], { cwd: REPO, encoding: 'utf8' })
    .split(/\r?\n/).filter((l) => /^\|\s*[①②③④⑤⑥⑦⑧⑨]\s*\|/.test(l)).length
  const rowsAfter = read('skills/rule-inspector/references/criteria.md').split(/\r?\n/).filter((l) => /^\|\s*[①②③④⑤⑥⑦⑧⑨]\s*\|/.test(l)).length
  assert.equal(rowsAfter, rowsBefore + 1)
})

// ── J 组：F-10 引用与 docs/after 缺口 ─────────────────────────────────────
test('S3-TC-J01 rule-writer 指针', () => {
  const src = read('skills/rule-writer/SKILL.md')
  const start = src.indexOf('3. **自查**')
  const step3 = src.slice(start).split(/\r?\n/).filter((l) => !/^\s*\d\./.test(l) || l.includes('3. **自查**')).slice(0, 4).join('\n')
  assert.ok(step3.includes('scripts/check-observable.mjs'))
  assert.ok(step3.includes('check-observable ok'))
  assert.doesNotThrow(() => assertNoTermCopy(src))
})

test('S3-TC-J02 复制词表', () => {
  const before = sha256('skills/rule-writer/SKILL.md')
  const src = read('skills/rule-writer/SKILL.md')
  const copy = `${src}\n主观词表：${TERMS.join('、')}\n`
  assert.throws(() => assertNoTermCopy(copy))
  assert.equal(sha256('skills/rule-writer/SKILL.md'), before)
})

test('S3-TC-J03 dev-workflow 指针', () => {
  const src = read('skills/dev-workflow/SKILL.md')
  const lines = src.split(/\r?\n/)
  const pointerStart = lines.findIndex((l) => l.trim() === '## 指针')
  const section = lines.slice(pointerStart + 1).filter((l) => l.trim() !== '')
  const pointerLines = section.filter((l) => l.includes('observable-criteria'))
  assert.equal(pointerLines.length, 1)
  assert.ok(pointerLines[0].includes('npm run check:observable'))
  const num = execFileSync('git', ['diff', '--numstat', S3_BASE, '--', 'skills/dev-workflow/SKILL.md'], { cwd: REPO, encoding: 'utf8' }).trim().split(/\s+/)
  assert.equal(Number(num[1] ?? 0), 0)
  const seg = (text) => text.split('## 段表')[1].split(/^## /m)[0]
  const before = execFileSync('git', ['show', `${S3_BASE}:skills/dev-workflow/SKILL.md`], { cwd: REPO, encoding: 'utf8' })
  assert.deepEqual(seg(src).split(/\r?\n/), seg(before).split(/\r?\n/))
})

test('S3-TC-J04 指针行复制', () => {
  const before = sha256('skills/dev-workflow/SKILL.md')
  const src = read('skills/dev-workflow/SKILL.md')
  const copy = src.replace(/(## 指针[\s\S]*?)\n/, `$1\n- 词表：${TERMS.join('、')}\n`)
  assert.notEqual(copy, src)
  assert.throws(() => assertNoTermCopy(copy))
  assert.equal(sha256('skills/dev-workflow/SKILL.md'), before)
})

test('S3-TC-J05 缺口在册', () => {
  const dir = join(REPO, 'docs/after')
  const files = readdirSync(dir).filter((f) => f.includes('skill-creator'))
  assert.equal(files.length, 1)
  const src = readFileSync(join(dir, files[0]), 'utf8')
  assert.equal(['现状', '该做', '触发', '谁兜'].filter((k) => src.includes(k)).length, 4)
  const nameCheck = runNode(['scripts/doc-name.mjs', '--check', 'docs/after'])
  assert.equal(nameCheck.code, 0)
  assert.match(nameCheck.out, /命名检查通过/)
})

// ── K 组：R8 改判回扫 ─────────────────────────────────────────────────────
test('S3-TC-K01 I22–I25 登记', () => {
  const entries = JSON.parse(read('tools/scope-sweep/keywords.json')).entries
  assertFourEntries(entries)
  assert.deepEqual(entries.filter((e) => /^I2[2-5]$/.test(e.id)).map((e) => e.id), ['I22', 'I23', 'I24', 'I25'])
  assert.deepEqual(entries.find((e) => e.id === 'I25').words, OLD_LABELS)
})

test('S3-TC-K02 冻结改前值', () => {
  const baseline = JSON.parse(read('tools/scope-sweep/baseline.json'))
  assert.deepEqual(['I22', 'I23', 'I24', 'I25'].map((id) => typeof baseline.counts[id]), ['number', 'number', 'number', 'number'])
  assert.equal(baseline.generatedAt.slice(0, 10) >= '2026-11-02', true)
  // 本批口径写死为「处置后下限」：每个 id 的基线必须 ≤ 本批实测现值（不是随手写大的数）
  const r = runNode(['scripts/scope-sweep.mjs', '--json'])
  const now = JSON.parse(r.out.slice(r.out.indexOf('{'))).counts
  for (const id of ['I22', 'I23', 'I24', 'I25']) assert.ok(baseline.counts[id] <= now[id], `${id}: baseline ${baseline.counts[id]} > 现值 ${now[id]}`)
})

test('S3-TC-K03 漏登记', () => {
  const before = sha256('tools/scope-sweep/keywords.json')
  const entries = JSON.parse(read('tools/scope-sweep/keywords.json')).entries.filter((e) => e.id !== 'I25')
  assert.throws(() => assertFourEntries(entries))
  assert.equal(sha256('tools/scope-sweep/keywords.json'), before)
})

test('S3-TC-K04 sweep 绿', () => {
  const r = runNode(['scripts/scope-sweep.mjs', '--check'])
  assert.equal(r.code, 0)
  assert.match(r.out, /sweep ok/)
})

test('S3-TC-K05 源与矩阵改完', () => {
  const predLabels = Object.values(PREDICATES).map((p) => p.label)
  assert.equal(OLD_LABELS.filter((l) => predLabels.includes(l)).length, 0)
  assert.equal(oldHits(read('tools/execution-matrix/criteria.md')), 0)
  assert.equal(OLD_LABELS.length, 8)
})

test('S3-TC-K06 议会引用', () => {
  const files = [
    read('skills/parliament/references/debate-protocol.md'),
    read('skills/parliament/assets/agent-template.md'),
    read('skills/parliament/assets/escalation-report.md'),
  ]
  assert.deepEqual(files.map((s) => oldHits(s)), [0, 0, 0])
  assert.deepEqual(files.map((s) => s.includes('predicates')), [true, true, true])
  const newLabels = Object.values(PREDICATES).map((p) => p.label)
  assert.equal(files.reduce((n, s) => n + newLabels.filter((l) => s.includes(l)).length, 0), 0)
})

test('S3-TC-K07 不改面（$S3_BASE..$S3_HEAD 闭区间）', (t) => {
  // 历史类清单单源 = scope-sweep 的 HISTORY_PREFIXES（不手抄）
  const changedRows = execFileSync('git', ['diff', '--name-status', S3_BASE, S3_HEAD], { cwd: REPO, encoding: 'utf8' })
    .trim().split(/\r?\n/).filter(Boolean).map((l) => l.split('\t'))
    .map(([st, p]) => ({ st, p: p.split('\\').join('/') }))
    .filter(({ p }) => !p.startsWith('.session/') && !p.startsWith('.superpowers/') && !p.includes('2026-11-02-observable-s3'))
  // 只判「改 / 删」的历史件（新增的 docs/after 缺口在册件是允许的）
  const changedHistory = changedRows.filter(({ st, p }) => st !== 'A' && HISTORY_PREFIXES.some((h) => p.startsWith(h))).map((r) => r.p)
  const historyDocs = HISTORY_PREFIXES.flatMap((h) => walkFiles(join(REPO, h)))
  const historyOldLabelHits = historyDocs.filter((f) => oldHits(readFileSync(f, 'utf8')) >= 1).length
  const pat = /立场客观且按项目长远判断|结论附可复算证据（文件:行号 或 命令输出）|用非专业人员也能听懂的方式表达|无问题时显式声明|只提问题不给解法|越出职责自行处置|证据栏留空|代他人填写其本人应填的表/
  const counted = walkFiles(REPO)
    .filter((f) => !f.includes(`${join(REPO, '.session')}`) && !f.includes(`${join(REPO, '.superpowers')}`) && !f.includes('node_modules'))
    .filter((f) => pat.test(readFileSync(f, 'utf8')))
    .map((f) => f.slice(REPO.length + 1).split('\\').join('/'))
    .filter((p) => !p.includes('2026-11-02-observable-s3'))
  assert.deepEqual(changedHistory, [])
  assert.ok(historyOldLabelHits >= 1)
  assert.equal(counted.filter((p) => /^\.session[\\/]|^\.superpowers[\\/]|2026-11-02-observable-s3/.test(p)).length, 0)
  t.diagnostic('spec §8 v3.1 取数：35 文件 / 175 行（排除过程账与本批两件）；含本批两件 37/197；含过程账 58/411（仅记录，不作判据）')
})

test('S3-TC-K08 清单缺口', () => {
  // 当次清单 = 本批共用的 impact-sheet（`.session/reviews/<那次>/impact-sheet.md`）；
  // 删掉其中一个命中文件名的副本 → scope-sweep 报「清单缺文件」
  const impact = join(REPO, '.session/reviews/2026-11-02-101312-observable-s3-spec/impact-sheet.md')
  assert.equal(existsSync(impact), true, '当次 impact-sheet.md 必须在位（GAP-6）')
  const src = readFileSync(impact, 'utf8')
  const hitFile = 'subjective-terms.mjs'
  assert.ok(src.includes(hitFile), '当次清单必须列出每个命中文件')
  const tmp = mkdtempSync(join(tmpdir(), 's3-impact-'))
  try {
    const copyPath = join(tmp, 'impact-sheet.md')
    writeFileSync(copyPath, src.split(hitFile).join('占位-已删'), 'utf8')
    const r = runNode(['scripts/scope-sweep.mjs', '--check', '--impact', copyPath])
    assert.notEqual(r.code, 0)
    assert.match(r.out, /清单缺文件/)
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test('S3-TC-K09 测试断言改形', () => {
  const pilot = read('tools/docgen/test/pilot-render.test.mjs')
  const evidence = read('tools/docgen/test/evidence-reader.test.mjs')
  assert.deepEqual([pilot, evidence].map((s) => oldHits(s)), [0, 0])
  assert.equal([pilot, evidence].filter((s) => s.includes('PREDICATES')).length, 2)
  assert.equal(evidence.includes('无问题时显式声明'), false)
  const r1 = runNodeClean(['--test', 'tools/docgen/test/pilot-render.test.mjs'])
  const r2 = runNodeClean(['--test', 'tools/docgen/test/evidence-reader.test.mjs'])
  assert.deepEqual([r1.code, r2.code], [0, 0])
})

// ── L 组：全量门禁面与本文件自核 ──────────────────────────────────────────
test('S3-TC-L01 单跑', (t) => {
  // 「单跑绿」由本文件**外部**运行见证（`node --test tools/docgen/test/s3-predicates.test.mjs`）；
  // 本文件内不自递归跑自身（否则 L01 无限递归，撞常量 9 的「不跑全量」精神）
  const self = read('tools/docgen/test/s3-predicates.test.mjs')
  const blocks = (self.match(/^test\('S3-TC-/gm) ?? []).length
  const tc = read('docs/superpowers/specs/2026-11-02-observable-s3-predicates-reuse-design-testcase.md')
  const cases = (tc.match(/^### S3-TC-/gm) ?? []).length
  assert.equal(blocks, cases)
  t.diagnostic(`用例块 ${blocks} / 用例条 ${cases}（单跑绿见外部命令输出）`)
})

test('S3-TC-L02 门禁面未扩', () => {
  const tmp = mkdtempSync(join(tmpdir(), 's3-root-'))
  try {
    for (const d of ['rules', 'skills', 'docs', 'agents']) mkdirSync(join(tmp, d), { recursive: true })
    writeFileSync(join(tmp, 'rules', 'a.md'), '# a\n\n计数 = 1\n', 'utf8')
    writeFileSync(join(tmp, 'skills', 'b.md'), '# b\n\n计数 = 1\n', 'utf8')
    writeFileSync(join(tmp, 'docs', 'c.md'), '# c\n\n## 说明\n\n判断客观\n', 'utf8')
    writeFileSync(join(tmp, 'agents', 'd.md'), '# d\n\n## 说明\n\n判断客观\n', 'utf8')
    const clean = runNode(['scripts/check-observable.mjs', '--check', '--root', tmp])
    assert.equal(clean.code, 0)
    // 加分句放在**独立语义块**（`## b` 小节内，块内无可观察标记）→ 必红；同块有 marker 会被判「已合格」
    writeFileSync(join(tmp, 'rules', 'a.md'), '# a\n\n计数 = 1\n\n## b\n\n判断客观\n', 'utf8')
    const dirty = runNode(['scripts/check-observable.mjs', '--check', '--root', tmp])
    assert.equal(dirty.code, 1)
    assert.match(dirty.out, /rules[\\/]a\.md/)
    const allSrc = read('scripts/check-all.mjs')
    const maxSectionNo = Math.max(...[...allSrc.matchAll(/^\/\/\s*([①-⑩])/gm)].map((m) => '①②③④⑤⑥⑦⑧⑨⑩'.indexOf(m[1]) + 1))
    assert.equal(maxSectionNo, 7)
    const repo = runNode(['scripts/check-observable.mjs', '--check'])
    assert.equal(repo.code, 0)
    assert.match(repo.out.trim().split(/\r?\n/).pop(), /check-observable ok/)
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test('S3-TC-L03 ID 与上限', () => {
  const tc = read('docs/superpowers/specs/2026-11-02-observable-s3-predicates-reuse-design-testcase.md')
  const headingIds = [...tc.matchAll(/^### S3-TC-([A-L]\d{2})/gm)].map((m) => m[1])
  const coverage = tc.split(/^## 1 覆盖总表$/m)[1].split(/^## 2 /m)[0]
  const coverageRows = coverage.split(/\r?\n/)
    .filter((l) => /^\|\s*/u.test(l) && /[A-L]\d{2}/u.test(l))
    .flatMap((l) => splitRow(l).slice(-1)[0].split(/\s*\/\s*/))
    .filter((x) => /^[A-L]\d{2}$/.test(x))
  assert.deepEqual([...headingIds].sort(), [...new Set(coverageRows)].sort())
  assert.equal(new Set(headingIds).size, headingIds.length)
  assert.ok(headingIds.length <= 80)
  assert.equal(coverageRows.filter((id) => /^I2\d/.test(id)).length, 0)
})

test('S3-TC-L04 不内联', () => {
  const specSrc = read('docs/superpowers/specs/2026-11-02-observable-s3-predicates-reuse-design.md')
  assert.equal((specSrc.match(/S3-TC-/g) ?? []).length <= 1, true)
  assert.ok(specSrc.includes('2026-11-02-observable-s3-predicates-reuse-design-testcase.md'))
  assert.equal(existsSync(join(REPO, 'docs/superpowers/specs/2026-11-02-observable-s3-predicates-reuse-design-testcase.md')), true)
})

test('S3-TC-L05 不自递归', () => {
  const tc = read('docs/superpowers/specs/2026-11-02-observable-s3-predicates-reuse-design-testcase.md')
  const stepLines = tc.split(/\r?\n/).filter((l) => /- \*\*步骤\*\*/.test(l) && !/S3-TC-L05/.test(l))
  assert.equal(stepLines.filter((l) => /npm run check|scripts\/check-all\.mjs/.test(l)).length, 0)
  assert.ok((tc.match(/由 `check-all` 自跑/g) ?? []).length >= 1)
})

test('S3-TC-L06 计数自洽', () => {
  const tc = read('docs/superpowers/specs/2026-11-02-observable-s3-predicates-reuse-design-testcase.md')
  const declared = { total: 80, 正: 32, 负: 27, 边界: 21 }
  const heads = tc.split(/\r?\n/).filter((l) => /^### S3-TC-/.test(l))
  const actual = { total: heads.length, 正: 0, 负: 0, 边界: 0 }
  for (const h of heads) {
    if (/【正】/.test(h)) actual.正 += 1
    else if (/【负】/.test(h)) actual.负 += 1
    else if (/【边界】/.test(h)) actual.边界 += 1
  }
  assert.equal(actual.total, declared.total)
  assert.deepEqual({ 正: actual.正, 负: actual.负, 边界: actual.边界 }, { 正: declared.正, 负: declared.负, 边界: declared.边界 })
  assert.ok(actual.负 + actual.边界 >= actual.正)
})

test('S3-TC-L07 helper 与悬空符号', () => {
  const src = read('tools/docgen/test/s3-predicates.test.mjs')
  assert.ok(src.includes("from './support/card-fixtures.mjs'"))
  assert.equal((src.match(/^function walkFiles/mg) ?? []).length, 0)
  assert.equal((src.match(/^function coldRepo/mg) ?? []).length, 0)
  const tc = read('docs/superpowers/specs/2026-11-02-observable-s3-predicates-reuse-design-testcase.md')
  const called = new Set([...tc.matchAll(/\b(assert[A-Za-z]+|markerKindsOf|hasMarker|labelHitsOf|vp|blockOf|hunksOf|seven|eight|escape|oldHits|legacyTokenHit|findingCodes|renderNeverLine|renderMustLine)\(/g)].map((m) => m[1]))
  const registered = new Set(['vp', 'markerKindsOf', 'hasMarker', 'labelHitsOf', 'assertIds', 'assertFields', 'renderNeverLine', 'renderMustLine', 'assertCoreLabel', 'assertLabelDash', 'assertLabelMarker', 'assertC8Mirror', 'assertCarriers', 'assertNoLegacyTerms', 'assertNoTermCopy', 'assertCriteriaNine', 'assertCounts', 'assertTwoTables', 'blockOf', 'seven', 'eight', 'assertSync', 'assertFourEntries', 'hunksOf', 'escape', 'oldHits', 'legacyTokenHit', 'findingCodes'])
  assert.deepEqual([...called].filter((n) => n !== 'assertXxx' && !registered.has(n)), [])
})
