// check-eval-contract.mjs —— A1 离线契约脚本（spec §3.2 / §3.2.1 / §3.2.2 / §3.4）
// 职责：改判据必重跑的离线闸门——核对契约 + 写 fixtures/CONTRACT.json（六类文件的 sha256）
// 退出码：0 全过 / 4 任一 FAIL / 2 读不了文件（eval.yaml 缺失、JSON 解析炸等）
// 用法：node scripts/check-eval-contract.mjs [<技能名>] [--json] [--deep]
//   --deep：spec §4 步骤 9 的签名里有，但 A1 是离线契约核对、不跑模型，本轮无意义（输出会明确注明）
// 不进 npm run check、不加 npm script（spec §1 影响面 ④ / 施工步骤 9）
//
// 路径基准（spec §3.2.1 / §3.3-1）：
//   脚本位置只用于「找到 eval.yaml」；repoRoot 一律由 eval.yaml 位置推导（repoRoot = <eval.yaml 所在目录>/../..）
//   CONTRACT.json 的键 = 相对 repoRoot 的正斜杠路径，不得含 `..` 或盘符
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs'
import { join, dirname, resolve, relative, sep, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  extractMachineBlock, extractBlockList, hasInlineArray, extractScalar,
  extractContextPaths, extractPromptText, extractPathValue,
  extractPlainBlockList, sha256, canonicalJson, assertHash, auditCaseKeys,
} from './eval-contract-core.mjs'

const argv = process.argv.slice(2)
const skillArg = argv.find((a) => !a.startsWith('--'))
const skill = skillArg || 'review-triage'
const asJson = argv.includes('--json')
const deep = argv.includes('--deep')

const scriptDir = dirname(fileURLToPath(import.meta.url))
const evalYaml = resolve(scriptDir, '..', 'evals', skill, 'eval.yaml')
const evalDir = dirname(evalYaml)
const evalsDir = dirname(evalDir)
const repoRoot = resolve(evalDir, '..', '..')
const skillRoot = join(repoRoot, 'skills', skill)

const findings = []
const skips = []
let ioBroken = false
let writtenFiles = null      // null = 未写（有 FAIL）；数字 = CONTRACT.json 里的文件数
const fail = (id, msg) => { findings.push({ id, msg }) }
const skip = (msg) => { skips.push(msg) }

function emit(exit) {
  if (asJson) {
    console.log(JSON.stringify({ skill, exit, findings, skips, deep, note: deep ? '--deep 本轮无意义（离线契约核对，不跑模型）' : null }, null, 2))
    return
  }
  const contractState = writtenFiles !== null
    ? `已写入（${writtenFiles} 个文件）`
    : `未写入（${exit === 2 ? '读不了文件' : '有 FAIL'}）`
  console.log(`A1 契约核对：${skill}｜findings=${findings.length}｜CONTRACT.json ${contractState}`)
  if (deep) console.log('NOTE --deep 本轮无意义（离线契约核对，不跑模型）')
  for (const s of skips) console.log(`SKIP ${s}`)
  for (const f of findings) console.log(`  [${f.id}] ${f.msg}`)
}

// 读文本：失败也返回空串，由调用方按结构检查兜住；同时记 IO finding（IO 一出现 → 退出码 2）
function read(p) {
  try { return readFileSync(p, 'utf8') } catch (e) {
    ioBroken = true
    fail('IO', `读不到 ${p}：${e.message}`)
    return ''
  }
}

function readJson(p) {
  const text = read(p)
  if (!text) return null
  try { return JSON.parse(text) } catch (e) {
    ioBroken = true
    fail('IO', `${p} 不是合法 JSON：${e.message}`)
    return null
  }
}

// ── 前置：eval.yaml 必须在位，否则连核对范围都定不下来（码 2）──────────────────
if (!existsSync(evalYaml)) {
  fail('IO', `读不到 ${evalYaml}`)
  emit(2)
  process.exit(2)
}

// ── BASE-1：<eval.yaml 所在目录>/.. 的末级必须名为 evals ─────────────────────
if (basename(dirname(evalDir)) !== 'evals') {
  fail('BASE-1', `<eval.yaml 所在目录>/.. 末级名为 ${basename(dirname(evalDir))}，必须是 evals`)
}

// ── 用例集：cases.files 必须是 <技能名>/cases/*.yaml（相对 evals/ 目录，与 §3.2.1 单一基准一致）──
const yaml = read(evalYaml)
const casesFiles = [...yaml.matchAll(/^\s*-\s+([^\s]+\.yaml)\s*$/gm)].map((m) => m[1])
if (casesFiles.length === 0) fail('YAML-1', 'cases.files 未找到合法相对路径（必须 <技能名>/cases/*.yaml）')
for (const rel of casesFiles) {
  if (!new RegExp(`^${skill}/cases/[^/]+\\.yaml$`).test(rel) || rel.includes('..')) {
    fail('YAML-1', `cases.files 必须写作 ${skill}/cases/*.yaml（相对 evals/ 目录），实际 ${rel}`)
  }
}

// ── YAML-2..11：§3.2 固定字段表逐项核对（spec §4 步骤 9 的核对范围；全是字面量、离线可判）──
function expectFixed(id, keys, expected, label) {
  const r = extractPathValue(yaml, keys)
  if (!r.ok) { fail(id, `${label} 未按 §3.2 固定值表给出：${r.error}`); return }
  if (r.value !== expected) fail(id, `${label} 必须是 ${expected}，实际 ${r.value}`)
}
expectFixed('YAML-2', ['schema_version'], 'v1alpha1', 'schema_version')
expectFixed('YAML-3', ['environment', 'type'], 'none', 'environment.type')
expectFixed('YAML-4', ['engine', 'name'], 'claude_code', 'engine.name')
expectFixed('YAML-5', ['engine', 'model', 'provider'], '{provider}', 'engine.model.provider（占位模板，不得写死模型名）')
expectFixed('YAML-5', ['engine', 'model', 'name'], '{name}', 'engine.model.name（占位模板，不得写死模型名）')
expectFixed('YAML-6', ['skills', 'source'], 'local_path', 'skills[].source')
expectFixed('YAML-7', ['skills', 'path'], `../skills/${skill}`, 'skills[].path（相对 evals/ 目录，且必须等于 ../skills/<技能名>）')
expectFixed('YAML-8', ['cases', 'defaults', 'timeout_seconds'], '240', 'cases.defaults.timeout_seconds')
expectFixed('YAML-9', ['cases', 'defaults', 'max_turns'], '8', 'cases.defaults.max_turns')
expectFixed('YAML-10', ['benchmark', 'enabled'], 'true', 'benchmark.enabled')
const formats = extractPlainBlockList(yaml, 'formats')
if (!formats.ok) fail('YAML-11', `report.formats 必须是块列表 [json, html]：${formats.error}`)
else if (formats.items.join(',') !== 'json,html') {
  fail('YAML-11', `report.formats 必须是块列表 [json, html]（有序），实际 [${formats.items.join(', ')}]`)
}

const caseTexts = []
for (const rel of casesFiles) {
  const abs = resolve(evalsDir, rel)
  if (!existsSync(abs)) { fail('PATH-1', `cases.files 解析后不存在：${rel} → ${abs}`); continue }
  const text = read(abs)
  const title = extractScalar(text, 'title')
  if (!title) fail('CASE-1', `${rel} 缺 title`)
  const id = extractScalar(text, 'id')
  const expectedId = basename(abs, '.yaml')
  if (!id) fail('CASE-4', `${rel} 缺 id`)
  else if (id !== expectedId) fail('CASE-4', `${rel} 的 id「${id}」必须与文件名（去扩展名）「${expectedId}」逐字相同`)
  if (hasInlineArray(text, 'must_contain') || hasInlineArray(text, 'must_not_contain')) {
    fail('CASE-2', `${rel} 的 expect 用了行内数组（必须块列表）`)
  }
  if (hasInlineArray(text, 'all') || hasInlineArray(text, 'any')) {
    fail('CASE-2', `${rel} 的 judge 用了行内数组（必须块列表）`)
  }
  caseTexts.push({ rel, abs, text, title, id })
}

// ── ② title 多重集唯一 ───────────────────────────────────────────────────────
const titles = caseTexts.map((c) => c.title).filter(Boolean)
const dup = titles.filter((t, i) => titles.indexOf(t) !== i)
if (dup.length) fail('CASE-3', `title 重名：${[...new Set(dup)].join(' / ')}`)

// ── ① 机读块结构 ─────────────────────────────────────────────────────────────
const expectedPath = join(evalDir, 'expected.md')
if (!existsSync(expectedPath)) fail('EXP-1', 'expected.md 不存在')
const mb = extractMachineBlock(existsSync(expectedPath) ? read(expectedPath) : '')
if (!mb.ok) fail('EXP-2', mb.error)
const block = mb.block || {}
if (block.schema !== 'eval-expectation/v2') fail('EXP-3', `schema 必须是 eval-expectation/v2，实际 ${block.schema}`)
const blockCases = Array.isArray(block.cases) ? block.cases : []

// ── ⑦ 离线半边：iteration_min 必须是 ≥2 的整数（§3.2.2⑦；`≤ 本次 --iteration` 属运行期，不在此）──
if (!Number.isInteger(block.iteration_min) || block.iteration_min < 2) {
  fail('EXP-15', `iteration_min 必须是 ≥ 2 的整数（spec §3.2.2⑦），实际 ${JSON.stringify(block.iteration_min)}`)
}

// ② 多重集双向相等（缺用例、多写用例都算错）
function multisetDiff(a, b) {
  const count = new Map()
  for (const x of b) count.set(x, (count.get(x) || 0) + 1)
  const out = []
  for (const x of a) {
    const n = count.get(x) || 0
    if (n > 0) count.set(x, n - 1)
    else out.push(x)
  }
  return out
}
const missing = multisetDiff(titles, blockCases.map((c) => c.eval_name))
const extra = multisetDiff(blockCases.map((c) => c.eval_name), titles)
if (missing.length) fail('EXP-4', `机读块缺用例：${[...new Set(missing)].join(' / ')}`)
if (extra.length) fail('EXP-5', `机读块多出用例：${[...new Set(extra)].join(' / ')}`)

// ── ④ 离线半边：assert 两组词与用例 yaml 的 expect 有序逐项相等（§3.2.2④）──────
// 双向都核：只改 expected.md 的 assert（本项拦）、只改 yaml expect（同样本项拦）
for (const c of blockCases) {
  const pair = caseTexts.find((x) => x.title === c.eval_name)
  if (!pair) continue                                  // 缺对应用例已由 EXP-4 报
  if (!c.assert || typeof c.assert !== 'object') { fail('EXP-14', `${c.eval_name} 缺 assert 块`); continue }
  for (const field of ['must_contain', 'must_not_contain']) {
    const declared = c.assert[field]
    const fromYaml = extractBlockList(pair.text, field)
    if (!fromYaml.ok) continue                         // 抽取失败已由 KEYS-4 / KEYS-5 报
    if (!Array.isArray(declared)) { fail('EXP-14', `${c.eval_name} 的 assert.${field} 不是数组`); continue }
    if (JSON.stringify(declared) !== JSON.stringify(fromYaml.items)) {
      fail('EXP-14', `${c.eval_name} 的 assert.${field} 与 yaml expect.${field} 不是有序逐项相等：机读块 ${JSON.stringify(declared)} vs yaml ${JSON.stringify(fromYaml.items)}`)
    }
  }
}

// ── ③④ role / origin / arms / delta / frozen ledger ────────────────────────
const ledger = existsSync(join(evalDir, 'frozen-ledger.json')) ? readJson(join(evalDir, 'frozen-ledger.json')) : {}

for (const c of blockCases) {
  if (!['gate', 'probe'].includes(c.role)) fail('EXP-6', `${c.eval_name} 的 role 非法：${c.role}`)
  if (!['calibrated', 'frozen'].includes(c.origin)) fail('EXP-7', `${c.eval_name} 的 origin 非法：${c.origin}`)
  if (c.role === 'probe' && (c.arms !== null || c.delta !== null)) fail('EXP-8', `${c.eval_name} 是 probe，arms/delta 必须为 null`)
  if (c.role === 'gate') {
    const w = c.arms?.with_skill
    const wo = c.arms?.without_skill
    for (const [n, v] of [['with_skill', w], ['without_skill', wo]]) {
      if (!v) { fail('EXP-9', `${c.eval_name} 缺 arms.${n}`); continue }
      // EXP-10 与 runner ⑧ 同口径（spec §3.2.2 示例里 with_skill 只写 min_rate）：
      // 至少一侧必填；已写的每一侧必须 ∈[0,1]
      const vals = [v.min_rate, v.max_rate].filter((x) => x !== undefined)
      if (vals.length === 0) fail('EXP-10', `${c.eval_name} 的 ${n} 既无 min_rate 也无 max_rate`)
      for (const x of vals) {
        if (typeof x !== 'number' || !(x >= 0 && x <= 1)) fail('EXP-10', `${c.eval_name} 的 ${n} 数值域越界：${JSON.stringify(x)}`)
      }
    }
    // min_rate 不得缺省：EXP-10 允许「至少一侧」，但 with_skill 这一侧必须写 min_rate（与 runner ⑧ 同判）
    if (w && (typeof w.min_rate !== 'number' || w.min_rate < 0.8)) {
      fail('EXP-11', `${c.eval_name} 的 with_skill.min_rate 必须 ≥ 0.8（实际 ${JSON.stringify(w.min_rate)}）`)
    }
    if (!(c.delta?.min > 0 && c.delta.min <= 1)) fail('EXP-12', `${c.eval_name} 缺合法 delta.min`)
  }
  if (c.origin === 'frozen') {
    const rec = (ledger || {})[c.eval_name]
    if (!rec) fail('FROZEN-1', `${c.eval_name} 是 frozen 但 ledger 无记录`)
    else {
      for (const k of ['frozen_since', 'verified_at', 'arms_snapshot', 'delta_at_verify', 'assert_hash', 'verified_snapshot']) {
        if (!(k in rec)) fail('FROZEN-2', `${c.eval_name} 的 ledger 缺字段 ${k}`)
      }
      if (rec.verified_at && !rec.verified_at.includes('fixtures/calibration/')) {
        fail('FROZEN-3', `${c.eval_name} 的 verified_at 未指向进 git 的 fixtures/calibration/：${rec.verified_at}`)
      }
      if (rec.arms_snapshot && canonicalJson(rec.arms_snapshot) !== canonicalJson(c.arms)) {
        fail('FROZEN-4', `${c.eval_name} 的 arms_snapshot 与当前 arms 不一致（需重新校准）`)
      }
      // LEDGER-1：assert_hash 必须是 64 位十六进制并复算（spec §3.2.2③）——与 runner 共用 assertHash
      // 非字符串（数字 / null / 对象）不得静默跳过，否则冻结记录等于失效而无人发现
      if (typeof rec.assert_hash !== 'string' || !/^[0-9a-f]{64}$/.test(rec.assert_hash)) {
        fail('LEDGER-1', `${c.eval_name} 的 ledger assert_hash 必须是 64 位十六进制（实际 ${JSON.stringify(rec.assert_hash)}）`)
      } else if (rec.assert_hash !== assertHash({ assert: c.assert, anchors: c.anchors, arms: c.arms, delta: c.delta })) {
        fail('LEDGER-1', `${c.eval_name} 的 ledger assert_hash 与当前 assert/anchors/arms/delta 不一致（需重新校准）`)
      }
    }
  }
}

// ── ④ 键白名单 + judge ⊆ expect ─────────────────────────────────────────────
// 判据只有一处：eval-contract-core 的 auditCaseKeys（runner 的 ⑧ 调同一个函数，两套口径必然分叉）
const declaredNotWords = new Set()
for (const { rel, text } of caseTexts) {
  const audit = auditCaseKeys(text)
  for (const banned of audit.bannedKeys) fail('KEYS-1', `${rel} 使用了本轮禁止的键 ${banned}`)
  if (audit.usesOutputNot) fail('KEYS-2', `${rel} 使用了 output_contains.not（本轮禁止）`)
  if (/^cases:[\s\S]*?^\s+defaults:/m.test(yaml) && /^\s+expect:/m.test(yaml)) fail('KEYS-3', 'eval.yaml 不得使用 cases.defaults.expect')
  const mc = extractBlockList(text, 'must_contain')
  const mn = extractBlockList(text, 'must_not_contain')
  if (!mc.ok) fail('KEYS-4', `${rel}：${mc.error}`)
  if (!mn.ok) fail('KEYS-5', `${rel}：${mn.error}`)
  for (const w of mn.items || []) declaredNotWords.add(w)
  for (const j of audit.judge) {
    if (j.badLine) fail('KEYS-6', `${rel} 的 judge.${j.field} 出现非块列表行：${j.badLine}`)
    for (const w of j.undeclaredWords) fail('KEYS-6', `${rel} 的 judge.${j.field} 含 expect 未声明的词「${w}」`)
  }
}

// ── ⑤ oracle 断言全过 + fixture 路径 ────────────────────────────────────────
// 断言词取机读块的 assert（L2 的唯一输入）；机读块缺该用例时退回 yaml 的 expect（EXP-4 已单独报错）
const blockByTitle = new Map(blockCases.map((c) => [c.eval_name, c]))
for (const { text, title, id } of caseTexts) {
  if (!id) continue
  const mc = blockByTitle.get(title)
  // 存在性一律按机读块的 c.oracle（相对 evals/ 目录）判：anchors 为 [] 的用例没有 ⑥ 兜底，
  // 只靠 `fixtures/oracle/<id>.md` 推导会让「oracle 指向不存在文件」静默通过
  const declaredOracle = typeof mc?.oracle === 'string' ? mc.oracle : null
  const oraclePath = declaredOracle
    ? resolve(evalsDir, declaredOracle)
    : join(evalDir, 'fixtures', 'oracle', `${id}.md`)
  if (!existsSync(oraclePath)) {
    fail('ORACLE-1', declaredOracle
      ? `${id} 的 oracle 不存在：${declaredOracle} → ${oraclePath}`
      : `缺 oracle：fixtures/oracle/${id}.md`)
    continue
  }
  const oracle = read(oraclePath)
  const mustContain = mc?.assert?.must_contain ?? extractBlockList(text, 'must_contain').items ?? []
  const mustNot = mc?.assert?.must_not_contain ?? extractBlockList(text, 'must_not_contain').items ?? []
  for (const w of mustContain) {
    if (!oracle.includes(w)) fail('ORACLE-2', `${id} 的 oracle 未命中 must_contain「${w}」`)
  }
  for (const w of mustNot) {
    if (oracle.includes(w)) fail('ORACLE-3', `${id} 的 oracle 命中了禁用词「${w}」`)
  }
  const { repo_fixture, apply_diff, hasContextGit } = extractContextPaths(text)
  if (apply_diff && !hasContextGit) fail('FIX-1', `${id} 的 apply_diff 未写在 context.git 下`)
  if (repo_fixture) {
    const base = repo_fixture.split('/').pop()
    if (!existsSync(join(evalDir, 'fixtures', 'repos', base))) fail('FIX-2', `${id} 的 repo_fixture basename 无对应源目录：fixtures/repos/${base}`)
    if (!repo_fixture.includes('.session/eval-fixture/')) fail('FIX-3', `${id} 的 repo_fixture 未指向物化路径`)
  }
  if (apply_diff) {
    if (!existsSync(resolve(evalsDir, apply_diff))) fail('FIX-4', `${id} 的 apply_diff 不存在：${apply_diff}`)
  }
}

// ── ⑥ 锚点双向核对（spec §3.2.2 ⑥：prompt 中 0 命中 + oracle 中 ≥1 命中）─────
// 「prompt 中 0 命中」只比对 yaml 的 input.prompt 正文（不得拿整份 yaml 比：expect 里本就有锚点串）
for (const c of blockCases) {
  if (!Array.isArray(c.anchors)) { fail('EXP-13', `${c.eval_name} 缺 anchors 数组`); continue }
  const anchors = c.anchors
  const pair = caseTexts.find((x) => x.title === c.eval_name)
  const ctx = pair ? extractContextPaths(pair.text) : { apply_diff: null }
  if (ctx.apply_diff && anchors.length === 0) {
    fail('EXP-13', `${c.eval_name} 声明了 context.git.apply_diff，anchors 不得为空`)
  }
  if (anchors.length === 0) continue
  if (!pair) { fail('EXP-13', `${c.eval_name} 在 cases.files 里找不到对应用例，无法核对锚点`); continue }
  const oracleAbs = typeof c.oracle === 'string' ? resolve(evalsDir, c.oracle) : null
  if (!oracleAbs || !existsSync(oracleAbs)) {
    fail('EXP-13', `${c.eval_name} 的 oracle 不存在，无法核对锚点：${c.oracle}`)
    continue
  }
  const oracle = read(oracleAbs)
  const prompt = extractPromptText(pair.text)
  if (!prompt.ok) { fail('EXP-13', `${c.eval_name} 的用例缺 input.prompt，无法核对锚点：${prompt.error}`); continue }
  for (const a of anchors) {
    if (prompt.text.includes(a)) fail('EXP-13', `${c.eval_name} 的锚点「${a}」在 prompt 中出现（必须 0 命中）`)
    if (!oracle.includes(a)) fail('EXP-13', `${c.eval_name} 的锚点「${a}」在 oracle 中 0 命中（必须 ≥1）`)
  }
}

// ── 禁词双向留痕（spec §3.4 / §7-11 / §5⑩）：RECORD.md 是必交取证记录，缺失即 FAIL ──
// 登记格式：一行一条，形如
//   - 反向证据：`fixtures/responses/xxx.md`:11 命中「低风险」（assert_hash `…`）
// 路径可写技能根相对（../../evals/<技能>/fixtures/…）、eval 目录相对（fixtures/…）或仓库根相对
const recordPath = join(evalDir, 'fixtures', 'RECORD.md')
if (!existsSync(recordPath)) {
  fail('REC-0', '缺 fixtures/RECORD.md（取证记录必须存在；先按 spec §3.4 补齐）')
} else {
  const record = read(recordPath)
  const entryRe = /`?([^\s`「」"'：:]+\.(?:md|json|txt))`?\s*[:：]\s*(\d+)\s*命中\s*[「"]\s*([^」"\n]+?)\s*[」"]/g
  const entries = [...record.matchAll(entryRe)].map((m) => ({ path: m[1], line: Number(m[2]), word: m[3] }))
  if (entries.length === 0) {
    fail('REC-1', 'RECORD.md 未登记任何禁词反向证据（格式：`<样本路径>:<行号> 命中「<禁词>」）')
  }
  for (const e of entries) {
    const candidates = [resolve(skillRoot, e.path), resolve(evalDir, e.path), resolve(repoRoot, e.path)]
    const abs = candidates.find((p) => existsSync(p))
    if (!abs) { fail('REC-2', `禁词留痕的样本不存在：${e.path}`); continue }
    const lines = read(abs).split(/\r?\n/)
    if (!(e.line >= 1 && e.line <= lines.length)) { fail('REC-3', `${e.path} 只有 ${lines.length} 行，留痕行号 ${e.line} 越界`); continue }
    if (!lines[e.line - 1].includes(e.word)) { fail('REC-4', `${e.path}:${e.line} 该行未命中「${e.word}」（留痕与样本对不上）`); continue }
    if (!declaredNotWords.has(e.word)) fail('REC-5', `禁词「${e.word}」不在任何用例的 must_not_contain 里`)
  }

  // REC-6：每条「反向证据」行必须带 64 位 assert_hash，且等于「assert.must_not_contain 含该词的用例」的复算值
  // （只查文件里有没有 assert_hash 字样会让错贴 / 漏贴都通关）
  const reverseRe = /^[ \t]*-[ \t]*反向证据[：:][^\n]*$/gm
  const reverseLines = [...record.matchAll(reverseRe)].map((m) => m[0])
  const entryOneRe = /`?([^\s`「」"'：:]+\.(?:md|json|txt))`?\s*[:：]\s*(\d+)\s*命中\s*[「"]\s*([^」"\n]+?)\s*[」"]/
  if (reverseLines.length === 0) fail('REC-6', 'RECORD.md 没有任何「- 反向证据：…」条目')
  for (const lineText of reverseLines) {
    const em = lineText.match(entryOneRe)
    const hm = lineText.match(/assert_hash\s*`([0-9a-fA-F]{64})`/)
    if (!em) { fail('REC-6', `反向证据条目格式不合法（缺「<样本路径>:<行号> 命中「<禁词>」」）：${lineText.trim()}`); continue }
    const word = em[3]
    if (!hm) { fail('REC-6', `反向证据「${word}」缺 64 位 assert_hash（spec §3.4）`); continue }
    const owners = blockCases.filter((c) => Array.isArray(c.assert?.must_not_contain) && c.assert.must_not_contain.includes(word))
    if (owners.length === 0) { fail('REC-6', `禁词「${word}」不在任何用例的 assert.must_not_contain 里，无法复算 assert_hash`); continue }
    const hashes = owners.map((c) => assertHash({ assert: c.assert, anchors: c.anchors, arms: c.arms, delta: c.delta }))
    if (!hashes.includes(hm[1].toLowerCase())) {
      fail('REC-6', `反向证据「${word}」的 assert_hash 与所属用例不符（应为 ${hashes.join(' / ')}，实际 ${hm[1]}）`)
    }
  }

  // REC-7：所有用例 must_not_contain 词的并集逐个扫样本——任一词真实出现却无一条登记 → FAIL
  // （补「删掉一行留痕即通关」的洞；样本文件名对不上用例不影响本项，只认「出现过没有」）
  const registeredWords = new Set(entries.map((e) => e.word))
  const sampleFiles = walk(join(evalDir, 'fixtures', 'responses'), ['.md', '.json'])
  for (const w of declaredNotWords) {
    if (registeredWords.has(w)) continue
    for (const abs of sampleFiles) {
      const at = read(abs).split(/\r?\n/).findIndex((l) => l.includes(w))
      if (at < 0) continue
      const rel = relative(repoRoot, abs).split(sep).join('/')
      fail('REC-7', `禁词「${w}」在样本 ${rel}:${at + 1} 真实出现，但 RECORD.md 无任何登记`)
      break
    }
  }
}

// ── ⑦ 六类文件哈希快照 ──────────────────────────────────────────────────────
const FIXED_CLASSES = [
  [join(evalDir, 'eval.yaml'), 'eval.yaml'],
  [join(evalDir, 'expected.md'), 'expected.md'],
  [join(evalDir, 'frozen-ledger.json'), 'frozen-ledger.json'],
]
for (const [abs, label] of FIXED_CLASSES) {
  if (!existsSync(abs)) fail('SNAP-1', `快照缺文件：${label}`)
}

function walk(dir, exts, out = []) {
  if (!existsSync(dir)) return out
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) walk(p, exts, out)
    else if (exts.some((x) => e.name.endsWith(x))) out.push(p)
  }
  return out
}

const snapshotTargets = new Set([
  ...FIXED_CLASSES.map(([abs]) => abs),
  ...walk(join(evalDir, 'cases'), ['.yaml']),
  ...walk(join(evalDir, 'fixtures', 'oracle'), ['.md']),
  ...walk(join(evalDir, 'fixtures', 'responses'), ['.md', '.json']),
])

const files = {}
for (const abs of [...snapshotTargets].sort()) {
  if (!existsSync(abs)) continue
  const relPath = relative(repoRoot, abs).split(sep).join('/')
  if (relPath.includes('..') || /^[A-Za-z]:/.test(relPath) || relPath.startsWith('/')) {
    fail('SNAP-2', `快照键非法：${relPath}`)
    continue
  }
  try { files[relPath] = sha256(readFileSync(abs)) } catch (e) {
    ioBroken = true
    fail('IO', `读不到 ${abs}：${e.message}`)
  }
}

// ── 收尾：有 FAIL 不写 CONTRACT.json（留旧值，让 runner ⑧ 的哈希比对拦住漂移）──
// 写空 files 的「假 exit=0」比不写更危险：runner 会以为没有任何文件需要比对
const computeExit = () => (ioBroken || findings.some((f) => f.id === 'IO') ? 2 : findings.length === 0 ? 0 : 4)
let exit = computeExit()
if (exit === 0) {
  const contractPath = join(evalDir, 'fixtures', 'CONTRACT.json')
  const contract = { schema: 'eval-contract/v1', checked_at: new Date().toISOString(), exit, files }
  try {
    writeFileSync(contractPath, JSON.stringify(contract, null, 2) + '\n', 'utf8')
    writtenFiles = Object.keys(files).length
  } catch (e) {
    ioBroken = true
    fail('IO', `写不进 ${contractPath}：${e.message}`)
    exit = computeExit()
  }
}
emit(exit)
process.exit(exit)
