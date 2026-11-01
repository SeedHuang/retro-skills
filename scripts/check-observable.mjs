#!/usr/bin/env node
// check-observable.mjs —— 可观察判据校验器（S1）
//
// 为什么要有这一份：判据里能用「无法二值判的形容词」，靠人读是拦不住的。本脚本把
// 「命中主观词且所在最小语义块内没有任何可观察标记」压成**退出码**，接进 `npm run check` 的第 ⑦ 段。
//
// 设计约束（spec `docs/superpowers/specs/2026-10-31-observable-criteria-rollout-design.md`）：
//   · 判定单点：`evaluateText()` 纯函数，CLI 与前置断言 P-3 共用（D14 `:195`）；
//   · 数据单点：词表 / 标记表 / 正反例全部来自 `tools/quality/observable-terms.json`（§3 `:29`）；
//   · hit 单位 = 行（D19 `:202`）；标题行 `^#+ ` 与围栏代码块内行不参与（D27 `:201` / §2 `:26`）；
//   · 三档退出码：0 无未豁免 hit 且无 stale / 1 有未豁免 hit 或 stale 或规则文档复制词表 / 2 前置不过；
//   · 未捕获异常一律收敛成 exit 2（§4 `:94`）。
import { readFileSync, readdirSync, lstatSync, existsSync, statSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fenceMask } from '../tools/execution-matrix/markdown-rows.mjs'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DEFAULT_TERMS = join(REPO_ROOT, 'tools', 'quality', 'observable-terms.json')
const DEFAULT_EXEMPT = join(REPO_ROOT, 'tools', 'quality', 'observable-exempt.json')
const RULE_DOC = 'observable-criteria.md'
// 仓根扫描时的 `.md` 总数（施工期两态：规则文档落地前 106 / 落地后 107；spec §4 P-1 `:87`）
const REPO_MD_TOTALS = [106, 107]
const REVIEWED_FLOOR = '2026-01-01'

// ── 文本工具 ──────────────────────────────────────────────────────────────
const isBlank = (l) => l.trim() === ''
const isTable = (l) => l.trim().startsWith('|')
const headingLevel = (l) => {
  const m = /^(#{1,6})\s/.exec(l)
  return m ? m[1].length : 0
}
const isTitle = (l) => /^#{1,6}\s/.test(l)
// bullet 缩进（返回前导空格数；不是 bullet 返回 null）
const bulletIndent = (l) => {
  const m = /^( *)(?:[-*+]|\d+\.)\s/.exec(l)
  return m ? m[1].length : null
}

function sectionLevelAt(lines, i) {
  for (let j = i - 1; j >= 0; j--) {
    const h = headingLevel(lines[j])
    if (h) return h
  }
  return 0
}

// 最小语义块（spec §2 `:26`）：bullet = 该 bullet 续行 + 缩进子块；段落 = 连续非空行；
// 另加紧随的连续表格。终止：① 空行 ② 同级或更高级标题 ③ 同缩进级别下一条 bullet ④ 表格结束后的下一个非表格行。
function blockOf(lines, mask, i) {
  const secLevel = sectionLevelAt(lines, i)
  const stopsAt = (l) => {
    const h = headingLevel(l)
    if (h && h <= secLevel) return true
    return false
  }
  // 表格行：整张表（向上/向下扩到连续表行）
  if (isTable(lines[i])) {
    let s = i
    while (s - 1 >= 0 && isTable(lines[s - 1])) s--
    let e = i
    while (e + 1 < lines.length && isTable(lines[e + 1])) e++
    return [s, e]
  }
  const indent = bulletIndent(lines[i])
  let s = i
  if (indent === null) {
    // 段落：向上并入连续的非空、非表、非 bullet、非标题行
    while (s - 1 >= 0) {
      const l = lines[s - 1]
      if (isBlank(l) || isTable(l) || isTitle(l) || bulletIndent(l) !== null) break
      s--
    }
  }
  let e = i
  let j = i + 1
  while (j < lines.length) {
    if (mask[j]) {
      j++
      continue
    }
    const l = lines[j]
    if (isBlank(l)) break
    if (stopsAt(l)) break
    if (indent === null) {
      if (isTitle(l) || bulletIndent(l) !== null) break
      if (isTable(l)) {
        while (j < lines.length && isTable(lines[j])) {
          e = j
          j++
        }
        break // ④ 表格结束后的下一个非表格行才终止 → 表格本身已并入后即停
      }
      e = j
      j++
      continue
    }
    const bi = bulletIndent(l)
    if (bi !== null && bi <= indent) break // ③ 同缩进级别的下一条 bullet
    if (isTable(l)) {
      while (j < lines.length && isTable(lines[j])) {
        e = j
        j++
      }
      break
    }
    e = j
    j++
  }
  if (isTitle(lines[i])) return [i, i]
  return [s, e]
}

function blockHasMarker(lines, mask, i, compiled) {
  const [s, e] = blockOf(lines, mask, i)
  for (let j = s; j <= e; j++) {
    if (mask[j]) continue
    for (const re of compiled) if (re.test(lines[j])) return true
  }
  return false
}

// ── 判定（唯一实现点） ───────────────────────────────────────────────────
// 返回 { verdict: 'pass'|'fail', matched: [{ term, index }] }（`matched` 不去重，每次出现一条）
export function evaluateText(text, { terms, markers }) {
  const lines = String(text).split(/\r?\n/)
  const { mask } = fenceMask(lines)
  const compiled = markers.map((m) => new RegExp(m.pattern))
  const matched = []
  const hitLines = []
  let offset = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const base = offset
    offset += line.length + 1
    if (mask[i]) continue
    if (isTitle(line)) continue
    let any = false
    for (const t of terms) {
      let from = 0
      while (true) {
        const at = line.indexOf(t, from)
        if (at < 0) break
        matched.push({ term: t, index: base + at })
        any = true
        from = at + t.length
      }
    }
    if (any) hitLines.push(i)
  }
  const bad = hitLines.filter((i) => !blockHasMarker(lines, mask, i, compiled))
  return { verdict: bad.length === 0 ? 'pass' : 'fail', matched }
}

// ── 规则文档专判（判定 5：不复制词表，spec §6 `:122` / D16 `:197`） ─────────
const sepOnly = (s) => /^[、，,\/ 　]*$/.test(s)

function ruleDocCopies(text, { terms, markers }) {
  const problems = []
  const lines = String(text).split(/\r?\n/)
  // ① markers[].pattern 原文（≥8 字符）出现 → 红
  for (const m of markers) {
    const src = String(m.pattern)
    if (src.length >= 8 && text.includes(src)) problems.push(`markers(${m.kind}) 的正则原文出现在规则文档里`)
  }
  // ② 同一行（或同一表行）≥2 个 terms 连续枚举 → 红
  for (const line of lines) {
    let idx = -1
    let run = 0
    const hits = []
    for (const t of terms) {
      let from = 0
      while (true) {
        const at = line.indexOf(t, from)
        if (at < 0) break
        hits.push({ at, len: t.length })
        from = at + t.length
      }
    }
    hits.sort((a, b) => a.at - b.at)
    for (let k = 0; k < hits.length; k++) {
      const h = hits[k]
      if (run === 0 || h.at === idx) run += 1
      else if (sepOnly(line.slice(idx, h.at))) run += 1
      else run = 1
      idx = h.at + h.len
      if (run >= 2) {
        problems.push(`同行连续枚举 ≥2 个主观词：${line.trim().slice(0, 40)}`)
        break
      }
    }
  }
  return problems
}

// ── 扫描面（P-1：两次独立遍历） ────────────────────────────────────────────
function walkCollect(dir, out) {
  let ents
  try {
    ents = readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const e of ents) {
    const p = join(dir, e.name)
    if (e.isSymbolicLink()) continue // symlink / junction 跳过（D13 `:194`）
    if (e.isDirectory()) walkCollect(p, out)
    else if (e.name.toLowerCase().endsWith('.md')) out.push(p)
  }
  return out
}

function walkCount(dir) {
  let n = 0
  let ents
  try {
    ents = readdirSync(dir, { withFileTypes: true })
  } catch {
    return 0
  }
  for (const e of ents) {
    const p = join(dir, e.name)
    if (e.isSymbolicLink()) continue
    if (e.isDirectory()) n += walkCount(p)
    else if (e.name.toLowerCase().endsWith('.md')) n += 1
  }
  return n
}

const relPath = (root, abs) => abs.slice(root.length).replace(/^[\\/]+/, '').split('\\').join('/')

// ── 数据装载与前置断言 ────────────────────────────────────────────────────
class Fail extends Error {
  constructor(code, msg) {
    super(msg)
    this.code = code
  }
}

function loadJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch (e) {
    throw new Fail('P-2', `${file}: ${e.code ?? e.message}`)
  }
}

function assertData(data) {
  if (!Array.isArray(data.terms) || data.terms.length === 0) throw new Fail('P-2', 'terms 为空')
  if (!Array.isArray(data.criterionTerms) || data.criterionTerms.length === 0) throw new Fail('P-2', 'criterionTerms 为空')
  if (!Array.isArray(data.markers) || data.markers.length === 0) throw new Fail('P-2', 'markers 为空')
  if (!Array.isArray(data.samples)) throw new Fail('P-2', 'samples 缺失')
  const covered = new Set(data.samples.map((s) => s.term))
  for (const t of data.terms) if (!covered.has(t)) throw new Fail('P-2', `samples 未覆盖词「${t}」`)
}

function assertSamples(data) {
  for (const s of data.samples) {
    const pos = evaluateText(s.positive?.input ?? '', data)
    const neg = evaluateText(s.negative?.input ?? '', data)
    const posOk = pos.verdict === 'pass' && pos.matched.some((m) => m.term === s.term)
    const negOk = neg.verdict === 'fail' && neg.matched.some((m) => m.term === s.term)
    if (!posOk) throw new Fail('P-3', `词「${s.term}」的正例不成立（期望 pass 且 matched 含该词）`)
    if (!negOk) throw new Fail('P-3', `词「${s.term}」的反例不成立（期望 fail 且 matched 含该词）`)
  }
}

function loadExempt(file) {
  let raw
  try {
    raw = loadJson(file)
  } catch (e) {
    if (e instanceof Fail) throw e
    throw new Fail('P-4', `${file}: 解析失败`)
  }
  const entries = Array.isArray(raw.entries) ? raw.entries : null
  if (!entries) throw new Fail('P-4', 'entries 缺失')
  const seen = new Map()
  for (const [i, e] of entries.entries()) {
    for (const k of ['path', 'contains', 'reason', 'reviewed']) {
      if (typeof e?.[k] !== 'string' || e[k].trim() === '') throw new Fail('P-4', `第 ${i + 1} 条缺字段 ${k}`)
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.reviewed) || Number.isNaN(new Date(e.reviewed).getTime())) {
      throw new Fail('P-4', `第 ${i + 1} 条 reviewed 不可解析：${e.reviewed}`)
    }
    if (e.reviewed < REVIEWED_FLOOR) throw new Fail('P-4', `第 ${i + 1} 条 reviewed 早于 ${REVIEWED_FLOOR}`)
    if (!seen.has(e.path)) seen.set(e.path, new Set())
    if (seen.get(e.path).has(e.contains)) throw new Fail('P-4', `${e.path} 内 contains 重复`)
    seen.get(e.path).add(e.contains)
  }
  return entries
}

// ── 主流程 ────────────────────────────────────────────────────────────────
function run(argv) {
  const opts = { json: false, root: REPO_ROOT, terms: DEFAULT_TERMS, exempt: DEFAULT_EXEMPT }
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i]
    if (t === '--check') continue
    if (t === '--json') {
      opts.json = true
      continue
    }
    if (t === '--root' || t === '--terms' || t === '--exempt') {
      const v = argv[i + 1]
      if (v === undefined) throw new Fail('USAGE', `缺参数值：${t}`)
      opts[t.slice(2)] = t === '--root' ? resolve(v) : resolve(v)
      i++
      continue
    }
    throw new Fail('USAGE', `不认识的参数：${t}`)
  }
  const isRepoRoot = resolve(opts.root) === resolve(REPO_ROOT)

  // P-1：两次独立遍历
  if (!existsSync(opts.root) || !statSync(opts.root).isDirectory()) throw new Fail('P-1', `扫描根不存在或不是目录：${opts.root}`)
  const rulesDir = join(opts.root, 'rules')
  const skillsDir = join(opts.root, 'skills')
  const files = [...walkCollect(rulesDir, []), ...walkCollect(skillsDir, [])]
  const counted = walkCount(rulesDir) + walkCount(skillsDir)
  if (files.length !== counted) throw new Fail('P-1', `两次遍历数不等（收集 ${files.length} / 计数 ${counted}）`)
  const nRules = walkCollect(rulesDir, []).length
  const nSkills = walkCollect(skillsDir, []).length
  if (!existsSync(rulesDir) || !existsSync(skillsDir)) throw new Fail('P-1', `rules/ 与 skills/ 目录必须都在（实得 ${existsSync(rulesDir)} / ${existsSync(skillsDir)}）`)
  if (files.length === 0) throw new Fail('P-1', '扫描根下 0 个 .md（空转）')
  // 「各 ≥1」只在**扫描仓根**时强制（spec §4 P-1 `:89` 的 2026-11-01 注：已签 testcase `B12③` 的
  // 「临时根仅 1 个 .md」对照要求 exit 0，故 `--root` 测试根降为「两目录须存在 + 总数 ≥1」）。
  if (isRepoRoot && (nRules < 1 || nSkills < 1)) throw new Fail('P-1', `仓根下 rules/ 与 skills/ 各须 ≥1 个 .md（实得 ${nRules} / ${nSkills}）`)
  if (isRepoRoot && !REPO_MD_TOTALS.includes(files.length)) {
    throw new Fail('P-1', `仓根 .md 总数 ${files.length} 不在允许集 ${JSON.stringify(REPO_MD_TOTALS)}`)
  }

  // P-2 / P-3：清单
  const data = loadJson(opts.terms)
  assertData(data)
  assertSamples(data)

  // P-4：豁免清单结构
  const entries = loadExempt(opts.exempt)

  // 命中 / 豁免 / stale
  // 豁免条目路径解析：**扫描根优先、仓根兜底**（豁免清单是仓级资产；`--root` 只换扫描根，D22 `:205`）
  const resolveEntry = (rel) => {
    const inRoot = join(opts.root, rel)
    if (existsSync(inRoot) && !statSync(inRoot).isDirectory()) return inRoot
    const inRepo = join(REPO_ROOT, rel)
    if (existsSync(inRepo) && !statSync(inRepo).isDirectory()) return inRepo
    return null
  }
  const hits = []
  let exemptedLines = 0
  const stale = []
  const fileCache = new Map()
  for (const e of entries) {
    const abs = resolveEntry(e.path)
    if (!abs) {
      stale.push({ path: e.path, contains: e.contains })
      continue
    }
    let text = fileCache.get(abs)
    if (text === undefined) {
      text = readFileSync(abs, 'utf8')
      fileCache.set(abs, text)
    }
    const n = text.split(e.contains).length - 1
    if (n === 0) {
      stale.push({ path: e.path, contains: e.contains })
      continue
    }
    if (n > 1) throw new Fail('P-4', `${e.path} 的 contains 出现 ${n} 次（锚点不唯一）`)
  }

  const scanned = []
  // 顺序：path 字典序 + 行号升序（先按相对路径排序，再逐文件按行遍历）
  const sorted = files
    .map((abs) => ({ abs, rel: relPath(opts.root, abs) }))
    .sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0))
  for (const { rel } of sorted) scanned.push(rel)
  for (const { abs, rel } of sorted) {
    // 规则文档**另走判定 5**（spec §4 判定 5「另走 §6 的三条判据」）：不参与判定 1–4
    if (rel.endsWith(RULE_DOC)) continue
    let text = fileCache.get(abs)
    if (text === undefined) {
      text = readFileSync(abs, 'utf8')
      fileCache.set(abs, text)
    }
    const lines = text.split(/\r?\n/)
    const { mask } = fenceMask(lines)
    const compiled = data.markers.map((m) => new RegExp(m.pattern))
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (mask[i]) continue
      if (isTitle(line)) continue
      const ts = data.terms.filter((t) => line.includes(t))
      if (ts.length === 0) continue
      if (blockHasMarker(lines, mask, i, compiled)) continue
      const ex = entries.find((e) => e.path === rel && line.includes(e.contains))
      if (ex) {
        exemptedLines += 1
        continue
      }
      hits.push({ path: rel, line: i + 1, terms: ts })
    }
  }

  // 规则文档专判（判定 5）
  const ruleDoc = sorted.find((s) => s.rel.endsWith(RULE_DOC))
  let copyProblems = []
  if (ruleDoc) copyProblems = ruleDocCopies(readFileSync(ruleDoc.abs, 'utf8'), data)

  const ok = hits.length === 0 && stale.length === 0 && copyProblems.length === 0
  // `copyProblems` **只在非空时**进载荷：已签 testcase `C16` 断 `--json` 键集恰为 5 键（D21 / Q5 形态），
  // 无条件加字段会破它；空数组时不出现，键集与原来逐字相同。
  const report = copyProblems.length === 0
    ? { scanned, hits, exemptedLines, stale, ok }
    : { scanned, hits, exemptedLines, stale, ok, copyProblems }
  if (opts.json) {
    process.stdout.write(JSON.stringify(report) + '\n')
  } else {
    for (const h of hits) process.stdout.write(`${h.path}:${h.line}  term=${h.terms.join(',')}  无结构化可观察标记\n`)
    for (const c of copyProblems) process.stdout.write(`[copy] ${c}\n`)
    for (const s of stale) process.stdout.write(`[stale] ${s.path}  contains 未命中：${s.contains}\n`)
  }
  return { report, copyProblems }
}

function main() {
  let out
  try {
    out = run(process.argv.slice(2))
  } catch (e) {
    const code = e instanceof Fail ? e.code : 'UNEXPECTED'
    const msg = e instanceof Fail ? e.message : `${e?.message ?? e}`
    const tag = code === 'USAGE' ? 'USAGE' : code
    process.stdout.write(`check-observable error（${tag}: ${msg}）\n`)
    process.exitCode = 2
    return
  }
  const { report, copyProblems } = out
  if (report.ok) {
    process.stdout.write('check-observable ok\n')
    process.exitCode = 0
  } else {
    process.stdout.write(`check-observable fail（命中 ${report.hits.length} 行 / stale ${report.stale.length} 条）\n`)
    process.exitCode = 1
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) main()
