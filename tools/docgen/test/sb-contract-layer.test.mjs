// S-B 契约层用例落点（SB-TC-04 起）。本文件由 plan 逐任务追加，不要一次写满。
// 编写者：主 agent（施工者本人）；本文件是常驻测试、不是 testcase 文件，不受独立编写义务约束。
import test from 'node:test'
import assert from 'node:assert/strict'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { spawnSync } from 'node:child_process'
import { ROOT, withRepoCopy, runEsm, runCli } from './support/dev-workflow-checks.mjs'
import { REGISTERED_IDS } from '../../observation-check/registered-ids.mjs'
import { ARTIFACT_RE } from '../../observation-check/gate-scan.mjs'
import { outputFormats } from '../components/outputFormats.mjs'
import { FORMAT_CHECKS } from '../card-model/vocab/card-contract.mjs'
import { renderBoundary, assertTemplatePure, TEMPLATE_ALLOWED_LITERALS } from '../components/renderBoundary.mjs'
import { SEAT_POLICY } from '../policy/seat-policy.mjs'
import * as CAP from '../policy/definitions/capabilities.mjs'
import * as CMD from '../policy/definitions/commands.mjs'
import * as PTH from '../policy/definitions/paths.mjs'

const REVIEWS = join(ROOT, 'docs', 'superpowers', 'reviews')

// 语料目录按名派生：目录名里的时刻是建件时刻，写死成字面量即第二份真相
const corpusDirs = () => readdirSync(REVIEWS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^2026-11-03-\d{4}-s-b-contract-baseline$/.test(d.name))
  .map((d) => d.name)

test('SB-TC-04 归档语料 observation-r1 成对入索引，且覆盖三段对账与结构校验全过', () => {
  const dirs = corpusDirs()
  assert.equal(dirs.length, 1, `归档目录必须恰 1 个（实得 ${dirs.join('、') || '(无)'}）`)
  const jsonRel = `docs/superpowers/reviews/${dirs[0]}/observation-r1.json`
  const mdRel = jsonRel.replace(/\.json$/, '.md')

  // ① 成对：json 与同名 md 都在（md 只能由渲染器产出）
  const present = [jsonRel, mdRel].filter((p) => existsSync(join(ROOT, p)))
  assert.deepEqual(present, [jsonRel, mdRel], '语料必须成对存在（json + 同名 md）')

  // ② 带 evidence 的项 ≥ 2：hit 必须回指原文，不能是演练式空记录
  const doc = JSON.parse(readFileSync(join(ROOT, jsonRel), 'utf8'))
  const withEvidence = doc.items.filter((it) => it.evidence && typeof it.evidence.path === 'string')
  assert.ok(withEvidence.length >= 2, `带 evidence 的项 ${withEvidence.length} / ${doc.items.length}`)

  // ③ 覆盖三段对账
  const c = doc.coverage
  assert.equal(c.read, doc.items.length, 'coverage.read 必须 = items 条数')
  assert.equal(c.total, REGISTERED_IDS.length, 'coverage.total 必须 = REGISTERED_IDS 长度')
  assert.equal(c.read + c.skipped.length, c.total, 'read + skipped 必须 = total')

  // ④ 结构 + 证据七道 + 渲染一致：一次判完（本仓唯一的单件校验入口）
  const r = spawnSync(process.execPath, ['tools/observation-check/cli.mjs', jsonRel], { cwd: ROOT, encoding: 'utf8' })
  assert.equal(r.status, 0, r.stdout + r.stderr)

  // ⑤ 两件都已入索引（归档后不可再改）
  const ls = spawnSync('git', ['ls-files', '--', jsonRel, mdRel], { cwd: ROOT, encoding: 'utf8' })
  assert.equal(ls.status, 0, ls.stdout + ls.stderr)
  const tracked = ls.stdout.split(/\r?\n/).filter((l) => l.trim())
  assert.equal(tracked.length, present.length, `入索引 ${tracked.length} 行 / 应有 ${present.length} 行`)

  console.log(`corpus: pair ${present.length}/${present.length} evidence ${withEvidence.length}/${doc.items.length} => ok`)
})

// ── Task 2：PRD V6 引句校验器（`tools/docgen/check-quotes.mjs`）────────────────
// 语料发现口径与脚本同源（`ARTIFACT_RE`）；本段只编排「注入 → 跑 → 复原」，不重写任何证据判定
// （那归 `tools/observation-check/evidence.mjs` 的 `checkEvidence`，SB-TC-30 判这一点）。

const isArtifactJson = (name) => ARTIFACT_RE.test(name) && name.endsWith('.json')
const isArtifactFile = (name) => ARTIFACT_RE.test(name)

function walkFiles(dir, keep) {
  const out = []
  if (!existsSync(dir)) return out
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name)
    if (ent.isDirectory()) out.push(...walkFiles(p, keep))
    else if (keep(ent.name)) out.push(p)
  }
  return out
}

const observationJson = (base) => walkFiles(base, isArtifactJson)
const observationFiles = (base) => walkFiles(base, isArtifactFile)

function countEvidence(files) {
  let n = 0
  for (const f of files) {
    const doc = JSON.parse(readFileSync(f, 'utf8'))
    if (!Array.isArray(doc.items)) continue
    n += doc.items.filter((it) => it && Object.prototype.hasOwnProperty.call(it, 'evidence')).length
  }
  return n
}

function runQuotes(cwd = ROOT) {
  const r = spawnSync(process.execPath, ['tools/docgen/check-quotes.mjs'], { cwd, encoding: 'utf8' })
  const stdout = r.stdout ?? ''
  const stderr = r.stderr ?? ''
  return { status: r.status, stdout, stderr, text: `${stdout}${stderr}` }
}

const firstLineOf = (r) => (r.stdout.split(/\r?\n/)[0] ?? '').trim()

// 真实语料（Task 1 落的 observation-r1）里的 items：负例都从真实 evidence 派生，不另造夹具
const baselineItems = () => JSON.parse(readFileSync(join(REVIEWS, corpusDirs()[0], 'observation-r1.json'), 'utf8')).items

// 候选探针目录名不得含 `tmp` / `.part`（`S4-TC-J02` 会把这类名字判成写盘残留）
let probeSeq = 0
function withProbeItem(t, evidence) {
  const name = `probe-cq-${process.pid}-${probeSeq += 1}`
  const dir = join(REVIEWS, name)
  mkdirSync(dir, { recursive: true })
  const doc = {
    round: 1,
    instance: null,
    items: [{ id: 'z99', verdict: 'hit', evidence }],
    open: [],
    coverage: { read: 1, total: 1, skipped: [] },
    closure: 'no-findings',
  }
  writeFileSync(join(dir, 'observation-r1.json'), `${JSON.stringify(doc, null, 2)}\n`, 'utf8')
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return { dir, name }
}

// 最小仓副本：`repoRoot()` 走 `git rev-parse --show-toplevel`，副本非 git 仓库会返回 RepoRootUnresolved
// 而掩盖真实原因 → 必须 `git init`；复制根 = 脚本 + 证据校验实现 + 语料面 + **语料引用的源文件**
function withQuotesCopy(fn) {
  const dst = mkdtempSync(join(tmpdir(), 'cq-copy-'))
  try {
    for (const rel of ['tools/observation-check', 'docs/superpowers/reviews']) {
      cpSync(join(ROOT, rel), join(dst, rel), { recursive: true })
    }
    mkdirSync(join(dst, 'tools', 'docgen'), { recursive: true })
    cpSync(join(ROOT, 'tools', 'docgen', 'check-quotes.mjs'), join(dst, 'tools', 'docgen', 'check-quotes.mjs'))
    // 证据判定要读源文件：被引路径从语料自身派生（写死成字面量即第二份真相）
    const cited = new Set()
    for (const f of observationJson(join(dst, 'docs', 'superpowers', 'reviews'))) {
      for (const it of JSON.parse(readFileSync(f, 'utf8')).items ?? []) {
        if (it?.evidence?.path) cited.add(it.evidence.path)
      }
    }
    for (const p of cited) {
      const to = join(dst, p)
      mkdirSync(dirname(to), { recursive: true })
      cpSync(join(ROOT, p), to)
    }
    const init = spawnSync('git', ['init', '-q'], { cwd: dst, encoding: 'utf8' })
    if (init.status !== 0) throw new Error(`副本 git init 失败：${init.stdout ?? ''}${init.stderr ?? ''}`)
    return fn(dst)
  } finally {
    rmSync(dst, { recursive: true, force: true })
  }
}

const normText = (s) => String(s).replace(/\s+/g, ' ').trim()

test('SB-TC-03 check-quotes 绿态：首行格式在位 / K ≥ 2 由脚本自判 / exit 0', () => {
  const r = runQuotes()
  assert.equal(r.status, 0, r.text)

  const line = firstLineOf(r)
  assert.match(line, /^check-quotes: files \d+ \/ evidence \d+ \/ bad 0 => ok$/)
  const files = Number(line.match(/files (\d+)/)[1])
  const evidence = Number(line.match(/evidence (\d+)/)[1])

  const disk = observationJson(REVIEWS)
  assert.ok(files >= 1, `files ${files} 必须 ≥ 1`)
  assert.ok(files <= disk.length, `files ${files} 不得多于磁盘 ${disk.length} 份`)
  assert.ok(evidence >= 2, `evidence ${evidence} 必须 ≥ 2（K ≥ 2 是脚本自己的判据）`)
  assert.equal(evidence, countEvidence(disk), '行内 K 必须 = 磁盘上带 evidence 键的 items 实数')

  console.log(`quotes: files ${files}/${disk.length} evidence ${evidence} => ok`)
})

test('SB-TC-14 check-quotes 不进总门禁，且腐化风险落 docs/after 一条带触发', () => {
  const checkAll = readFileSync(join(ROOT, 'scripts', 'check-all.mjs'), 'utf8')
  const hits = (checkAll.match(/check-quotes/g) ?? []).length
  assert.equal(hits, 0, `check-all.mjs 不得出现 check-quotes（命中 ${hits} 处）`)

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
  const scripts = pkg.scripts ?? {}
  const wired = Object.keys(scripts).filter((k) => /check-quotes/.test(k) || /check-quotes/.test(scripts[k]))
  assert.equal(wired.length, 0, `package.json 的 scripts 不得接 check-quotes：${wired.join('、')}`)

  const afterDir = join(ROOT, 'docs', 'after')
  const afterFiles = readdirSync(afterDir).filter((f) => f.endsWith('.md'))
  const texts = new Map(afterFiles.map((f) => [f, readFileSync(join(afterDir, f), 'utf8')]))
  const hitFiles = [...texts].filter(([, t]) => t.includes('check-quotes')).map(([f]) => f)
  assert.ok(hitFiles.length >= 1, 'docs/after 必须有 check-quotes 的腐化登记')
  const bad = hitFiles.filter((f) => !(texts.get(f).includes('触发') && texts.get(f).includes('observation-*.json')))
  assert.equal(bad.length, 0, `腐化登记必须写明触发条件（「触发」+ observation-*.json）：${bad.join('、')}`)

  console.log(`quotes-gate: check-all ${hits} / package-scripts ${wired.length} / after ${hitFiles.length} => ok`)
})

test('SB-TC-15 摘句改一字（全仓再无该句）→ EvidenceQuoteMismatch exit 1 并点名', (t) => {
  const ev = { ...baselineItems()[0].evidence }
  ev.quote = `${ev.quote}（原文已删改）`
  const probe = withProbeItem(t, ev)

  const r1 = runQuotes()
  assert.notEqual(r1.status, 0, `改过摘句的语料不得 exit 0：${r1.text}`)
  assert.ok(r1.text.includes('EvidenceQuoteMismatch'), `必须报既有码 EvidenceQuoteMismatch：${r1.text}`)
  assert.ok(r1.text.includes(probe.name), `输出必须点名临时次目录：${r1.text}`)
  assert.ok(r1.text.includes('items[0].z99'), `输出必须点名被注入项的 id：${r1.text}`)

  rmSync(probe.dir, { recursive: true, force: true })
  const r2 = runQuotes()
  assert.equal(r2.status, 0, `删除临时件后必须复原为绿：${r2.text}`)
})

test('SB-TC-16 摘句在文件别处存在但引用的行不含它 → EvidenceQuoteMismatch exit 1', (t) => {
  const ev = { ...baselineItems()[0].evidence }
  const src = readFileSync(join(ROOT, ev.path), 'utf8')
  assert.ok(src.includes(ev.quote), '前置：该摘句在源文件里确实存在（文件级命中）')
  const lines = src.split(/\r?\n/)
  const others = lines
    .map((l, i) => ({ l, i: i + 1 }))
    .filter(({ l, i }) => i !== ev.line && normText(l) && !normText(l).includes(normText(ev.quote)))
    .sort((a, b) => Math.abs(a.i - ev.line) - Math.abs(b.i - ev.line))
  assert.ok(others.length > 0, '源文件里必须存在不含该摘句的相邻行')
  ev.line = others[0].i
  const probe = withProbeItem(t, ev)

  const r1 = runQuotes()
  assert.notEqual(r1.status, 0, `换行号后不得 exit 0（文件级命中 ≠ 行级命中）：${r1.text}`)
  assert.ok(r1.text.includes('EvidenceQuoteMismatch'), r1.text)
  assert.ok(r1.text.includes('items[0].z99'), `输出必须点名被注入项的 id：${r1.text}`)

  rmSync(probe.dir, { recursive: true, force: true })
  const r2 = runQuotes()
  assert.equal(r2.status, 0, `复原后必须为绿：${r2.text}`)
})

test('SB-TC-17 evidence.line 越界或非法（行数+1 / 0 / -1）→ exit 1', (t) => {
  const base = { ...baselineItems()[0].evidence }
  const lines = readFileSync(join(ROOT, base.path), 'utf8').split(/\r?\n/)
  const lineCount = lines.length > 1 && lines[lines.length - 1] === '' ? lines.length - 1 : lines.length
  const forms = [
    { label: '行数 + 1', line: lineCount + 1, codes: ['EvidenceLineOutOfRange'] },
    { label: '0', line: 0, codes: ['InvalidFieldType'] },
    { label: '-1', line: -1, codes: ['InvalidFieldType'] },
  ]
  for (const f of forms) {
    const probe = withProbeItem(t, { ...base, line: f.line })
    const r = runQuotes()
    assert.notEqual(r.status, 0, `line = ${f.label} 不得 exit 0：${r.text}`)
    assert.ok(f.codes.some((c) => r.text.includes(c)), `line = ${f.label} 必须报 ${f.codes.join(' / ')}：${r.text}`)
    assert.ok(r.text.includes('items[0].z99'), `line = ${f.label} 的输出必须点名该项 id：${r.text}`)
    rmSync(probe.dir, { recursive: true, force: true })
  }

  const r0 = runQuotes()
  assert.equal(r0.status, 0, `复原后必须为绿：${r0.text}`)
  console.log(`line-forms: ${forms.length}/${forms.length} => ok`)
})

test('SB-TC-18 语料 K = 0（items 0 条 / 文件 0 个两条入口）→ exit 1，不许绿', () => {
  withQuotesCopy((copy) => {
    const base = join(copy, 'docs', 'superpowers', 'reviews')

    // 入口①：文件都在、结构仍合法，但 items 里 0 条 evidence
    for (const f of observationJson(base)) {
      const doc = JSON.parse(readFileSync(f, 'utf8'))
      for (const it of doc.items ?? []) delete it.evidence
      writeFileSync(f, `${JSON.stringify(doc, null, 2)}\n`, 'utf8')
    }
    const r1 = runQuotes(copy)
    assert.notEqual(r1.status, 0, `items 里 0 条 evidence 不得 exit 0：${r1.text}`)
    assert.match(r1.text, /语料 0 条（需 ≥2，fail-closed）/)

    // 入口②：语料文件本身为 0 个（json 与 md 一并删）
    for (const f of observationFiles(base)) rmSync(f, { force: true })
    const r2 = runQuotes(copy)
    assert.notEqual(r2.status, 0, `语料文件 0 个不得 exit 0：${r2.text}`)
    assert.match(r2.text, /语料 0 条（需 ≥2，fail-closed）/)

    console.log('k0: items0 / files0 => ok')
  })
})

test('SB-TC-29 语料发现口径：只认 observation-*.json，.md 不计入且畸形 json 不静默', () => {
  withQuotesCopy((copy) => {
    const base = join(copy, 'docs', 'superpowers', 'reviews')
    const target = join(base, corpusDirs()[0])

    const r0 = runQuotes(copy)
    assert.equal(r0.status, 0, r0.text)
    const files0 = Number(firstLineOf(r0).match(/files (\d+)/)[1])

    writeFileSync(join(target, 'observation-r9.md'), '# 普通文本，不是 JSON\n', 'utf8')
    const r1 = runQuotes(copy)
    assert.equal(r1.status, 0, `同类 .md 不得让脚本变红：${r1.text}`)
    assert.equal(Number(firstLineOf(r1).match(/files (\d+)/)[1]), files0, 'files 计数不得把 .md 算进去')

    writeFileSync(join(target, 'observation-r9.md'), '{ 这不是 JSON\n', 'utf8')
    writeFileSync(join(target, 'observation-r9.json'), '{}\n', 'utf8')
    const r2 = runQuotes(copy)
    assert.notEqual(r2.status, 0, '畸形 / 缺 items 的 .json 不得静默跳过')

    console.log(`discovery: files ${files0} / md-not-counted / malformed-red => ok`)
  })
})

test('SB-TC-30 复用既有码面：引用纯结构行 → EvidenceStructuralRow', (t) => {
  const structPath = 'docs/superpowers/specs/2026-10-09-use-rule-skills-design.md'
  const lines = readFileSync(join(ROOT, structPath), 'utf8').split(/\r?\n/)
  const idx = lines.findIndex((l) => /^\|[-:|\s]+\|$/.test(l.trim()))
  assert.ok(idx >= 0, '前置：探针源文件里必须有表格分隔行')
  const probe = withProbeItem(t, { path: structPath, line: idx + 1, quote: lines[idx].trim() })

  const r = runQuotes()
  assert.notEqual(r.status, 0, `结构行不得 exit 0：${r.text}`)
  assert.ok(r.text.includes('EvidenceStructuralRow'), `必须报既有码 EvidenceStructuralRow：${r.text}`)
  assert.ok(r.text.includes('items[0].z99'), `输出必须点名被注入项的 id：${r.text}`)

  rmSync(probe.dir, { recursive: true, force: true })
})

test('SB-TC-39 语料 K = 1 → exit 1（K ≥ 2 是判据，不是期望值）', () => {
  withQuotesCopy((copy) => {
    const base = join(copy, 'docs', 'superpowers', 'reviews')
    let kept = false
    let stash = null
    for (const f of observationJson(base)) {
      const doc = JSON.parse(readFileSync(f, 'utf8'))
      doc.items?.forEach((it, i) => {
        if (!it.evidence) return
        if (!kept) { kept = true; return }
        stash = { f, i, ev: it.evidence }
        delete it.evidence
      })
      writeFileSync(f, `${JSON.stringify(doc, null, 2)}\n`, 'utf8')
    }
    assert.ok(stash, '前置：副本里必须有多于 1 条 evidence 可删')

    const r1 = runQuotes(copy)
    assert.notEqual(r1.status, 0, `K = 1 不得 exit 0：${r1.text}`)
    assert.match(r1.text, /语料 1 条（需 ≥2，fail-closed）/)

    const back = JSON.parse(readFileSync(stash.f, 'utf8'))
    back.items[stash.i].evidence = stash.ev
    writeFileSync(stash.f, `${JSON.stringify(back, null, 2)}\n`, 'utf8')

    const r2 = runQuotes(copy)
    assert.equal(r2.status, 0, `补回第 2 条后必须为绿：${r2.text}`)
    assert.match(firstLineOf(r2), /evidence 2 \/ bad 0 => ok$/)

    console.log('k1: 1 => red / 2 => ok')
  })
})

// ── Task 3：`issue-card` 证据三列派生 + 两处 checks 文案（PRD D14 / spec §11.2.1）──────
// 探针只有一份实现：`EVIDENCE_PROBE` 在本进程用，也被 `String(...)` 注入副本子进程
// （副本内同进程 import 会命中模块缓存，所以「改一处看是否跟随」必须走子进程）。
const HEAD_COLS = ['编号（Q-轮-序）', '提出角色', '归属维度', '问题描述']
const TAIL_COLS = ['严重级别', '建议解法']
const EVIDENCE_PROBE = (fields, evidenceFields) => {
  const HEAD = ['编号（Q-轮-序）', '提出角色', '归属维度', '问题描述']
  const TAIL = ['严重级别', '建议解法']
  const mid = fields.slice(4, 7)
  const ok = JSON.stringify(mid) === JSON.stringify(evidenceFields)
    && JSON.stringify(fields) === JSON.stringify([...HEAD, ...evidenceFields, ...TAIL])
    && fields.length === 9
    && evidenceFields.length === 3
  return { ok, col7: fields[6], line: `evidence-cols: ${mid.length}/${evidenceFields.length} length ${fields.length} => ${ok ? 'ok' : 'fail'}` }
}
const EVIDENCE_PROBE_SRC = [
  "import { outputFormats } from './tools/docgen/components/outputFormats.mjs'",
  `const PROBE = ${String(EVIDENCE_PROBE)}`,
  "const f = outputFormats['issue-card'].fields",
  'const r = PROBE(f, outputFormats.evidence.fields)',
  'process.stdout.write(r.line + "\\n")',
  'process.stdout.write("fields[6]: " + r.col7 + " length " + f.length + "\\n")',
  'process.exit(r.ok ? 0 : 1)',
].join('\n')

const OF_REL = join('tools', 'docgen', 'components', 'outputFormats.mjs')

// 副本里改 `evidence.fields` 第 3 项：`'用途'` 在源里恰 1 处（多于 1 处说明构造会改错位置）
function bumpEvidenceThird(copy) {
  const p = join(copy, OF_REL)
  const src = readFileSync(p, 'utf8')
  const hits = src.split("'用途'").length - 1
  assert.equal(hits, 1, `outputFormats.mjs 的 '用途' 必须恰 1 处（实得 ${hits}）`)
  writeFileSync(p, src.replace("'用途'", "'用途X'"), 'utf8')
  return p
}

test('SB-TC-01 issue-card 证据三列与 evidence.fields deepEqual（同序逐字）且总长 9', () => {
  const fields = outputFormats['issue-card'].fields
  const ev = outputFormats.evidence.fields
  assert.ok(Array.isArray(fields) && Array.isArray(ev), '两处 fields 都必须是数组')

  assert.equal(ev.length, 3, `evidence.fields 必须 3 项（实得 ${ev.length}：${ev.join('、')}）`)
  assert.equal(fields.length, 9, `issue-card.fields 必须 9 列（实得 ${fields.length}：${fields.join('、')}）`)
  // 位置判据：证据三列必须落在 4/5/6 —— 只判「9 列」会放过「三列放尾部 / 分散」的版本
  assert.deepEqual(fields.slice(4, 7), ev, '第 5–7 位必须与 evidence.fields 结构相等（同序逐字，不是引用相等）')
  assert.deepEqual(fields, [...HEAD_COLS, ...ev, ...TAIL_COLS], '全量 = [...HEAD, ...evidence.fields, ...TAIL]')

  const r = EVIDENCE_PROBE(fields, ev)
  assert.equal(r.ok, true, r.line)
  console.log(r.line)
})

test('SB-TC-02 副本里改 evidence.fields 第 3 项 → issue-card 证据三列跟随', () => {
  withRepoCopy((copy) => {
    const before = runEsm(copy, EVIDENCE_PROBE_SRC)
    assert.equal(before.status, 0, `副本未改动前必须为绿：${before.stdout}${before.stderr}`)

    bumpEvidenceThird(copy)
    const after = runEsm(copy, EVIDENCE_PROBE_SRC)
    assert.equal(after.status, 0, `改 evidence.fields 后 issue-card 必须跟随：${after.stdout}${after.stderr}`)
    assert.match(after.stdout, /=> ok/)
    assert.match(after.stdout, /fields\[6\]: 用途X length 9/)

    console.log(`follow: ${firstLineOf(after)} / 用途X length 9 => ok`)
  })
})

test('SB-TC-23 三列抄成字面（不派生）→ 改 evidence.fields 后不跟随，探针必红', () => {
  withRepoCopy((copy) => {
    const p = join(copy, OF_REL)
    const src = readFileSync(p, 'utf8')
    const at = src.indexOf("'issue-card': {")
    assert.ok(at >= 0, "副本的 outputFormats.mjs 必须含 'issue-card' 段")

    // 抄字面：9 项字面数组，三列与当前 evidence.fields 逐字相同，但不是展开
    const literal = JSON.stringify([...outputFormats['issue-card'].fields])
    const body = src.slice(at).replace(/fields: \[[^\]]*\],/, `fields: ${literal},`)
    assert.notEqual(body, src.slice(at), '构造失败：issue-card 的 fields 行没被替换成字面数组')
    writeFileSync(p, src.slice(0, at) + body, 'utf8')

    bumpEvidenceThird(copy)
    const r = runEsm(copy, EVIDENCE_PROBE_SRC)
    assert.notEqual(r.status, 0, `抄字面的版本必须红（三列不跟随）：${r.stdout}${r.stderr}`)
    assert.match(r.stdout, /=> fail/)
    assert.match(r.stdout, /fields\[6\]: 用途 length 9/, '字面版本的第 7 列不得跟随 evidence.fields 改变')

    // 复原成派生形态（仅保留第 3 项改动）后必须为绿
    writeFileSync(p, src.replace("'用途'", "'用途X'"), 'utf8')
    const back = runEsm(copy, EVIDENCE_PROBE_SRC)
    assert.equal(back.status, 0, `复原为派生形态后必须为绿：${back.stdout}${back.stderr}`)

    console.log(`literal-copy: ${firstLineOf(r)} / derived: ${firstLineOf(back)}`)
  })
})

// 改前字面：第 1 / 3 条不许被顺手改掉（逐字）
const FORMAT_CHECKS_UNTOUCHED = [
  '问题卡缺任一必填字段 = 废卡，不得只给结论。',
  '建议解法栏缺内容或空 = 废卡，须给可执行一条。',
]

test('SB-TC-10 FORMAT_CHECKS 仍 3 条：第 2 条改三列 + 校验器，第 1 / 3 条逐字不动', () => {
  const len = FORMAT_CHECKS.length
  const binary = FORMAT_CHECKS.filter((s) => /废卡/.test(s) && /[缺空]/.test(s))
  const second = FORMAT_CHECKS[1] ?? ''
  // 三个证据列名从 evidence.fields 派生，不另写字面（否则两处都在改，判据自己就是第二份真相）
  const cols = outputFormats.evidence.fields.filter((c) => second.includes(c))
  const secondOk = cols.length === outputFormats.evidence.fields.length && second.includes('check-quotes')
  const untouched = [FORMAT_CHECKS[0] === FORMAT_CHECKS_UNTOUCHED[0], FORMAT_CHECKS[2] === FORMAT_CHECKS_UNTOUCHED[1]]
  const untouchedCount = untouched.filter(Boolean).length

  console.log(`format-checks ${len} / binary ${binary.length}/3 / second ${secondOk ? 1 : 0}/1 / untouched ${untouchedCount}/2`)
  assert.equal(len, 3, `FORMAT_CHECKS 必须仍 3 条（实得 ${len}）`)
  assert.equal(binary.length, 3, `每条都必须同时含「废卡」与「缺 / 空」（实得 ${binary.length}/3）`)
  assert.ok(secondOk, `第 2 条必须含三个证据列名（命中 ${cols.join('、') || '(无)'}）且含 check-quotes：${second}`)
  assert.equal(untouchedCount, 2, '第 1 / 3 条必须逐字不动（改文案不许顺手改它们）')
})

// 副本内改 `FORMAT_CHECKS` 条数，跑既有冻结断言（`S2-TC-A06`）；命令口径见 testcase SB-TC-22
// `NODE_TEST_CONTEXT` 必须清掉：父进程是 `node --test` 时子进程若继承它，会被判「test run() 递归」并**静默跳过**（exit 0 假绿）
const A06_CMD = ['--test', '--test-name-pattern', 'S2-TC-A06', join('tools', 'docgen', 'test', 's2-card-rewrite.test.mjs')]
const runA06 = (dir) => {
  const env = { ...process.env }
  delete env.NODE_TEST_CONTEXT
  return spawnSync(process.execPath, A06_CMD, { cwd: dir, encoding: 'utf8', env })
}

function rewriteFormatChecks(copy, list) {
  const p = join(copy, 'tools', 'docgen', 'card-model', 'vocab', 'card-contract.mjs')
  const src = readFileSync(p, 'utf8')
  const open = 'export const FORMAT_CHECKS = ['
  const start = src.indexOf(open)
  assert.ok(start >= 0, '副本的 card-contract.mjs 必须含 FORMAT_CHECKS 定义')
  const end = src.indexOf('\n]', start)
  assert.ok(end > start, 'FORMAT_CHECKS 数组必须有闭合行')
  const body = list.map((s) => `  ${JSON.stringify(s)},`).join('\n')
  writeFileSync(p, `${src.slice(0, start)}${open}\n${body}\n]${src.slice(end + 2)}`, 'utf8')
  return src
}

test('SB-TC-22 FORMAT_CHECKS 变 2 条 / 变 4 条 → 既有冻结断言 S2-TC-A06 必红', () => {
  withRepoCopy((copy) => {
    const p = join(copy, 'tools', 'docgen', 'card-model', 'vocab', 'card-contract.mjs')

    const r0 = runA06(copy)
    assert.equal(r0.status, 0, `副本未改动前 S2-TC-A06 必须绿：${r0.stdout}${r0.stderr}`)

    let src = rewriteFormatChecks(copy, FORMAT_CHECKS.slice(0, 2))
    const r2 = runA06(copy)
    assert.notEqual(r2.status, 0, `2 条时 S2-TC-A06 必须红（说明条数断言被放宽了）：${r2.stdout}${r2.stderr}`)
    assert.match(`${r2.stdout}${r2.stderr}`, /S2-TC-A06/)

    writeFileSync(p, src, 'utf8')
    src = rewriteFormatChecks(copy, [...FORMAT_CHECKS, FORMAT_CHECKS[0]])
    const r4 = runA06(copy)
    assert.notEqual(r4.status, 0, `4 条时 S2-TC-A06 必须红：${r4.stdout}${r4.stderr}`)
    assert.match(`${r4.stdout}${r4.stderr}`, /S2-TC-A06/)

    writeFileSync(p, src, 'utf8')
    const r5 = runA06(copy)
    assert.equal(r5.status, 0, `复原本仓 3 条后必须为绿：${r5.stdout}${r5.stderr}`)

    console.log('checks-count: 3 => ok / 2 => red / 4 => red')
  })
})

// ── Task 4：`duty.categories` 单源（spec §11.2.4 / §11.1 R7 R8）────────────────────
// 取数点 = 装配产物（`agentData[i].card`），不是席文件：席文件里该键必须已经不在（源侧由 ① 单独判）。
const SEATS_REL = join('tools', 'docgen', 'data', 'seats')
const seatFiles = (base) => readdirSync(join(base, SEATS_REL)).filter((f) => f.endsWith('.json'))

// 同形探针（SB-TC-07 与 SB-TC-34 共用一份实现）：① 读盘判「源里无该键」；② 过 loader 逐席
// `deepEqual(duty.categories, categories[].label)`（同序逐字，不是长度 / 包含 / 引用相等）。
// 34 的判别力靠「改注入实现 → 同一条探针出不同数」，故探针不许各写一份。
const DUTY_PROBE_SRC = [
  "import { readdirSync, readFileSync } from 'node:fs'",
  "import { join } from 'node:path'",
  "import assert from 'node:assert/strict'",
  "const { agentData } = await import('./tools/docgen/components/agentData.mjs')",
  "const dir = join('tools', 'docgen', 'data', 'seats')",
  "const files = readdirSync(dir).filter((f) => f.endsWith('.json'))",
  "let srcHasKey = 0",
  "for (const f of files) {",
  "  const d = JSON.parse(readFileSync(join(dir, f), 'utf8'))",
  "  if (d.card && d.card.duty && Object.prototype.hasOwnProperty.call(d.card.duty, 'categories')) srcHasKey += 1",
  "}",
  "let same = 0",
  "for (const a of agentData) {",
  "  try { assert.deepEqual(a.card.duty.categories, a.card.categories.map((c) => c.label)); same += 1 } catch { /* 逐席不等即计入 bad */ }",
  "}",
  "const bad = agentData.length - same",
  "const ok = srcHasKey === 0 && bad === 0 && agentData.length === files.length",
  "process.stdout.write('seats ' + agentData.length + '/' + files.length + ' / srcHasKey ' + srcHasKey + ' / same ' + same + '/' + agentData.length + ' / bad ' + bad + (ok ? ' => ok' : ' => fail') + '\\n')",
  "process.exit(ok ? 0 : 1)",
].join('\n')

test('SB-TC-07 duty.categories 单源：席文件无该键，loader 产物逐席 deepEqual categories[].label', () => {
  const r = runEsm(ROOT, DUTY_PROBE_SRC)
  assert.equal(r.status, 0, `席文件仍有该键 / 逐席不等 / 席数不符：${r.stdout}${r.stderr}`)

  const n = seatFiles(ROOT).length
  assert.match(r.stdout, /srcHasKey 0\b/, r.stdout)
  assert.match(r.stdout, new RegExp(`same ${n}/${n}(?![0-9])`), r.stdout)
  assert.match(r.stdout, new RegExp(`seats ${n}/${n}(?![0-9])`), r.stdout)
  console.log(r.stdout.trim())
})

// 只判「码已登记且归 1」：未登记时 `exitCodeFor` 抛「未知错误码」→ 判别力就在这里，
// 进程退出码不能当判据（loader 在 import 期抛，未登记码的进程退出码同样是 1）。
const EXIT_PROBE_SRC = [
  "import { exitCodeFor } from './tools/docgen/components/validateAgentData.mjs'",
  "try { process.stdout.write('exit ' + exitCodeFor('DutyCategoryMisplaced') + '\\n') }",
  "catch (e) { process.stdout.write('throw ' + e.message + '\\n'); process.exit(2) }",
].join('\n')

// 子进程 import 触发加载：成功 → stdout `loaded` / exit 0；拒载 → stderr 首行 = 码 + 席 + 键。
// 首行由探针自己拼（Node 的未捕获异常首行是代码帧，不是错误码），拼的内容全部取自抛出的错误对象。
const LOAD_PROBE_SRC = [
  "import('./tools/docgen/components/agentData.mjs').then(",
  "  () => { process.stdout.write('loaded\\n'); process.exit(0) },",
  "  (e) => { process.stderr.write(e.code + ' seat=' + (e.name ?? '') + ' key=' + (e.key ?? '') + '\\n'); process.exit(1) },",
  ").catch((e) => { process.stderr.write('probe-failed ' + e.message + '\\n'); process.exit(3) })",
].join('\n')

test('SB-TC-20 席文件写非空 duty.categories → DutyCategoryMisplaced exit 1 并点席', () => {
  withRepoCopy((copy) => {
    const seat = 'reviewer-audit'
    const p = join(copy, SEATS_REL, `${seat}.json`)
    const original = readFileSync(p, 'utf8')
    const doc = JSON.parse(original)
    doc.card.duty.categories = ['验收可验证性']
    writeFileSync(p, `${JSON.stringify(doc, null, 2)}\n`, 'utf8')

    const ex = runEsm(copy, EXIT_PROBE_SRC)
    assert.equal(ex.status, 0, `exitCodeFor('DutyCategoryMisplaced') 必须可取值（未登记会抛「未知错误码」）：${ex.stdout}${ex.stderr}`)
    assert.match(ex.stdout, /^exit 1$/m, ex.stdout)

    const bad = runEsm(copy, LOAD_PROBE_SRC)
    assert.notEqual(bad.status, 0, `非空 duty.categories 必须拒载：${bad.stdout}${bad.stderr}`)
    const first = (bad.stderr.split(/\r?\n/)[0] ?? '').trim()
    assert.match(first, /^DutyCategoryMisplaced/, first)
    assert.ok(first.includes(seat), `stderr 首行必须点席：${first}`)

    // 复原：码表不随数据变，加载不再抛
    writeFileSync(p, original, 'utf8')
    const ex2 = runEsm(copy, EXIT_PROBE_SRC)
    assert.equal(ex2.status, 0, ex2.stdout + ex2.stderr)
    assert.match(ex2.stdout, /^exit 1$/m, ex2.stdout)
    const ok = runEsm(copy, LOAD_PROBE_SRC)
    assert.equal(ok.status, 0, `复原后必须加载成功：${ok.stdout}${ok.stderr}`)

    console.log(`refusal: ${first} / restored: ${ok.stdout.trim()}`)
  })
})

test('SB-TC-33 注入而非删除：loader 产物 duty.categories 仍在且仍 8 键，buildCards() 仍 12 键', async () => {
  const { agentData } = await import('../components/agentData.mjs')
  const { CARD_KEYS, buildCards } = await import('../components/cardPipeline.mjs')

  const n = seatFiles(ROOT).length
  assert.equal(agentData.length, n, `loader 席数必须 = 席文件数 ${n}（实得 ${agentData.length}）`)

  const DERIVED = ['seat', 'name', 'description', 'tools']
  const EIGHT = CARD_KEYS.filter((k) => !DERIVED.includes(k))
  const diff = (keys, want) => keys.filter((k) => !want.includes(k)).concat(want.filter((k) => !keys.includes(k)))

  const inDuty = agentData.filter((a) => a.card && a.card.duty && 'categories' in a.card.duty
    && Array.isArray(a.card.duty.categories)).length
  const loaderKeys8 = agentData.filter((a) => diff(Object.keys(a.card), EIGHT).length === 0).length
  const built = buildCards()
  const topKeys12 = built.filter((b) => diff(Object.keys(b.card), CARD_KEYS).length === 0).length

  assert.equal(inDuty, n, `duty.categories 必须仍在（注入而非删除）：${inDuty}/${n}`)
  assert.equal(loaderKeys8, n, `loader 产物顶层必须恰 8 键（注入只改 duty 内部）：${loaderKeys8}/${n}`)
  assert.equal(built.length, n, `buildCards() 席数 ${built.length} / ${n}`)
  assert.equal(topKeys12, n, `消费点必须恰 12 键：${topKeys12}/${n}`)
  console.log(`inDuty ${inDuty}/${n} / loaderKeys8 ${loaderKeys8}/${n} / topKeys12 ${topKeys12}/${n}`)
})

// ── Task 5：卡面「档位 + 指针」（模板 3 行文案 + 5 个槽值；槽集仍 12）────────────────
// **卡面取数点 = `renderBoundary(席)` 的渲染结果**：Task 5 施工时 15 卡尚未重生成（归 Task 6），
// 读盘会把「未重生成」误判成「指针化没做」；「盘上 == 渲染」由 Task 6 的 SB-TC-06（`gate`）绑住。
const POINTER_SEATS = ['reviewer-audit', 'detective-observer']
const POINTER_SYMBOLS = ['pathGroups', 'commandGroups', 'forbiddenGroups', 'DETECTION_BLIND_SPOTS']
const rendered = (seat) => renderBoundary(seat)
const linesWith = (text, needle) => text.split('\n').filter((l) => l.includes(needle))
const commandLine = (text) => linesWith(text, '命令默认拒绝')[0] ?? ''

// 探针文件写进副本根（副本用完即删）；相对 import 解析到副本内的模块
function runProbeIn(dir, src) {
  const p = join(dir, `.sb5-probe-${process.pid}-${probeSeq += 1}.mjs`)
  writeFileSync(p, `${src}\n`, 'utf8')
  const env = { ...process.env }
  delete env.NODE_TEST_CONTEXT
  const r = spawnSync(process.execPath, [p], { cwd: dir, encoding: 'utf8', env })
  return { status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' }
}

const PURE_PROBE = [
  "import { assertTemplatePure } from './tools/docgen/components/renderBoundary.mjs'",
  "try { assertTemplatePure(); process.stdout.write('pure ok\\n'); process.exit(0) }",
  "catch (e) { process.stderr.write('PROBE ' + (e.code ?? '') + ' ' + (e.fragment ?? '') + '\\n'); process.exit(1) }",
].join('\n')

function patchRenderBoundary(copy, mutate) {
  const p = join(copy, 'tools', 'docgen', 'components', 'renderBoundary.mjs')
  const src = readFileSync(p, 'utf8')
  const out = mutate(src)
  assert.notEqual(out, src, '构造失败：副本的 renderBoundary.mjs 未被修改')
  writeFileSync(p, out, 'utf8')
  return p
}

// 换掉一个顶层函数的函数体（用于构造「漏改 env 槽」与「env 只改一半」两种负例）
function replaceFnBody(src, name, body) {
  const start = src.indexOf(`function ${name}()`)
  assert.ok(start >= 0, `构造失败：副本里找不到 function ${name}()`)
  const open = src.indexOf('{', start)
  const close = src.indexOf('\n}', open)
  assert.ok(open > start && close > open, `构造失败：function ${name}() 的函数体边界未找到`)
  return `${src.slice(0, open + 1)}\n${body}\n${src.slice(close)}`
}

// 被指针化的 4 行：按段首句定位（`**禁止**` 不能写成 `禁止写`——那行属「禁止写」段、合法含路径）
const POINTER_LINE_ANCHORS = ['**除上述落点外', '**命令默认拒绝**', '**禁止**', '检测限度']
const pointerLines = (text) => POINTER_LINE_ANCHORS
  .map((a) => text.split('\n').find((l) => l.startsWith(a) || l.includes(a)))
  .filter(Boolean)

// 仓内路径形态两种：目录前缀（不含 `docs/`——「只允许写」段合法用它）+ 反引号包住的 .mjs / .json
const IN_REPO_DIR_RE = /(?:tools|agents|scripts|skills|rules)\//g
const BACKTICK_FILE_RE = /`[^`\n]*\.(?:mjs|json)`/g
const pathFormHits = (text) => (text.match(IN_REPO_DIR_RE) ?? []).length + (text.match(BACKTICK_FILE_RE) ?? []).length

test('SB-TC-05 卡面形态：逐项点名 0 命中 + 4 符号名各 ≥1（均带反引号）+ 本席组 ID 在位', () => {
  // ① `逐项点名` 计数（V8）：2 卡渲染结果合起来必须 = 0
  const scanq = POINTER_SEATS.reduce((n, s) => n + linesWith(rendered(s), '逐项点名').length, 0)
  assert.equal(scanq, 0, `2 卡不得再出现「逐项点名」（命中 ${scanq} 行）`)

  // ② 4 符号名各 ≥1，且每次出现都被一对反引号包住
  const missingSym = []
  for (const s of POINTER_SEATS) {
    const text = rendered(s)
    for (const sym of POINTER_SYMBOLS) if (!text.includes(`\`${sym}\``)) missingSym.push(`${s}:${sym}`)
  }
  const symTotal = POINTER_SEATS.length * POINTER_SYMBOLS.length
  console.log(`sym ${symTotal - missingSym.length}/${symTotal}`)
  assert.equal(missingSym.length, 0, `符号名缺失或未加反引号：${missingSym.join('、')}`)

  // ③ 本席组 ID 在位（判定面 = 这 2 席：其余 13 席与 senior-sdet 没有该句）
  const badSeats = POINTER_SEATS.filter((s) => {
    const groups = SEAT_POLICY[s].allowGroups
    return groups.length === 0 || !groups.every((g) => commandLine(rendered(s)).includes(g))
  })
  console.log(`groupIds ${POINTER_SEATS.length - badSeats.length}/${POINTER_SEATS.length}`)
  assert.equal(badSeats.length, 0, `命令白名单句缺本席组 ID：${badSeats.join('、')}`)
})

test('SB-TC-13 模板纯度：assertTemplatePure 不抛 + 4 符号已登记 + 白名单不含清单类 + size 12', () => {
  // 清单集 = 从已导出的定义层自组装（`listClassMembers()` 未导出，不碰内部实现）
  const ids = [...Object.keys(CAP.capabilities), ...Object.keys(CMD.commandGroups),
    ...Object.keys(CMD.forbiddenGroups), ...Object.keys(PTH.pathGroups)]
  const multiWord = [...Object.values(CMD.commandGroups), ...Object.values(CMD.forbiddenGroups)]
    .flatMap((g) => g.verbs).filter((v) => /\s/.test(v))
  const paths = [...Object.values(PTH.pathGroups).flat().flatMap((x) => x.split('、')),
    ...PTH.DETECTION_BLIND_SPOTS, 'spec / plan']
  const LIST_CLASS = new Set([...ids, ...multiWord, ...paths])

  const missing = POINTER_SYMBOLS.filter((s) => !TEMPLATE_ALLOWED_LITERALS.has(s))
  const overlap = [...TEMPLATE_ALLOWED_LITERALS].filter((x) => LIST_CLASS.has(x))
  console.log(`whitelist: sym ${POINTER_SYMBOLS.length - missing.length}/${POINTER_SYMBOLS.length} / overlap ${overlap.length} / size ${TEMPLATE_ALLOWED_LITERALS.size}`)

  assert.doesNotThrow(() => assertTemplatePure(), '模板必须过纯度三条守卫')
  assert.equal(missing.length, 0, `4 个符号名必须登记进白名单：缺 ${missing.join('、')}`)
  assert.deepEqual(overlap, [], `白名单不得登记清单类成员：${overlap.join('、')}`)
  assert.equal(TEMPLATE_ALLOWED_LITERALS.size, 12, `白名单必须恰 12 项（原 8 + 4 符号名），实得 ${TEMPLATE_ALLOWED_LITERALS.size}`)
})

test('SB-TC-19 回填一句「逐项点名」→ 计数 1（判据有判别力，不是恒 0）', () => {
  const scanq = (text) => linesWith(text, '逐项点名').length
  assert.equal(POINTER_SEATS.reduce((n, s) => n + scanq(rendered(s)), 0), 0, '金态必须 0 命中')

  const injected = `${rendered('reviewer-audit')}\n**除上述落点外，任何写文件或重定向一律禁止**，逐项点名：\`a/\`、\`b/\`；兜底句：凡 \`.gitignore\` 覆盖的路径一律视为禁止写入。`
  assert.equal(scanq(injected), 1, '回填一行后计数必须恰 1（否则判据没有判别力）')
  console.log('scanq: gold 0 / injected 1 => ok')
})

test('SB-TC-24 被指针化的 4 行内无仓内路径形态（取到行数必须 = 4，两条负例都必须 ≥1）', () => {
  for (const seat of POINTER_SEATS) {
    const four = pointerLines(rendered(seat))
    assert.equal(four.length, 4, `${seat}: 必须按段首句取到 4 行（实得 ${four.length}）——少了说明定位锚失效`)

    const text = four.join('\n')
    assert.equal(pathFormHits(text), 0, `${seat}: 4 行内不得出现仓内路径形态：${text}`)

    // 负例 A：指针写成 `policy/definitions/paths.mjs`（无目录前缀，仍命中 .mjs 反引号形态）
    const negA = ['禁写集合见 `policy/definitions/paths.mjs`', ...four.slice(1)].join('\n')
    assert.ok(pathFormHits(negA) >= 1, `${seat}: 负例 A 必须命中 ≥1（旧版只 grep 一个目录字面时此形态全绿）`)

    // 负例 B：带目录前缀 + 反引号
    const negB = ['禁写集合见 `tools/docgen/policy/definitions/paths.mjs`', ...four.slice(1)].join('\n')
    assert.ok(pathFormHits(negB) >= 1, `${seat}: 负例 B 必须命中 ≥1`)
  }
  console.log('pointer-lines: 4/4 lines / pathforms 0 / negA ≥1 / negB ≥1 => ok')
})

test('SB-TC-27 白名单登记清单类成员（agents/）→ ALLOWED_LITERALS: 自检抛错', () => {
  withRepoCopy((copy) => {
    patchRenderBoundary(copy, (src) => {
      const start = src.indexOf('export const TEMPLATE_ALLOWED_LITERALS = new Set([')
      const end = src.indexOf(']);', start)
      assert.ok(start >= 0 && end > start, '构造失败：白名单定义未找到')
      const body = src.slice(start, end)
      const patched = body.replace("  '越权清单',", "  '越权清单',\n  'agents/',")
      assert.notEqual(patched, body, '构造失败：白名单插入点未命中')
      return src.slice(0, start) + patched + src.slice(end)
    })

    const bad = runProbeIn(copy, PURE_PROBE)
    assert.notEqual(bad.status, 0, `白名单含清单类成员必须抛错：${bad.stdout}${bad.stderr}`)
    assert.match(`${bad.stdout}${bad.stderr}`, /ALLOWED_LITERALS:/)

    console.log(`whitelist-listclass: ${(bad.stderr.split(/\r?\n/)[0] ?? '').trim()} => ok`)
  })
})

test('SB-TC-28 新反引号项未登记（删掉 commandGroups）→ TemplateImpure 抛错', () => {
  withRepoCopy((copy) => {
    // 构造「模板里留着被反引号包住的 commandGroups」：把该槽换成字面符号（替代 slot 注入，纯度为判模板文本）
    const tplPath = join(copy, 'tools', 'docgen', 'templates', 'boundary.md.tpl')
    const tpl = readFileSync(tplPath, 'utf8')
    const injected = tpl.replace('{{ALLOW_GROUPS}}', '`commandGroups`')
    assert.notEqual(injected, tpl, '构造失败：模板里没有 {{ALLOW_GROUPS}} 槽可换')
    writeFileSync(tplPath, injected, 'utf8')

    const control = runProbeIn(copy, PURE_PROBE)
    assert.equal(control.status, 0, `已登记时必须不抛（对照组）：${control.stdout}${control.stderr}`)

    patchRenderBoundary(copy, (src) => {
      const start = src.indexOf('export const TEMPLATE_ALLOWED_LITERALS = new Set([')
      const end = src.indexOf(']);', start)
      assert.ok(start >= 0 && end > start, '构造失败：白名单定义未找到')
      const body = src.slice(start, end)
      const patched = body.split('\n').filter((l) => !l.includes("'commandGroups'")).join('\n')
      assert.notEqual(patched, body, "构造失败：白名单里没有 'commandGroups' 可删")
      return src.slice(0, start) + patched + src.slice(end)
    })

    const bad = runProbeIn(copy, PURE_PROBE)
    assert.notEqual(bad.status, 0, `未登记的反引号项必须抛 TemplateImpure：${bad.stdout}${bad.stderr}`)
    assert.match(`${bad.stdout}${bad.stderr}`, /TemplateImpure/)
    assert.match(`${bad.stdout}${bad.stderr}`, /commandGroups/)

    console.log(`unregistered-span: ${(bad.stderr.split(/\r?\n/)[0] ?? '').trim()} => ok`)
  })
})

test('SB-TC-31 保留面：5 个槽（4 行文案）的段首句与语义句 2 卡 × 6 组 = 12/12 在位', () => {
  const RETENTION_ANCHORS = [
    ['**除上述落点外，任何写文件或重定向一律禁止**'],
    ['**命令默认拒绝**', '其余一律不跑'],
    ['**禁止**', '任何形式的环境变量赋值'],
    ['检测限度', '归 S5-B'],
    ['**档位事实**'],
    ['**只允许写**', '越界写 = 越权'],
  ]
  const missing = []
  for (const seat of POINTER_SEATS) {
    const text = rendered(seat)
    for (const group of RETENTION_ANCHORS) {
      for (const needle of group) if (!text.includes(needle)) missing.push(`${seat}:${needle}`)
    }
  }
  const total = POINTER_SEATS.length * RETENTION_ANCHORS.length
  const groupsOk = total - missing.length // 打印用；判据是下面逐锚断言
  console.log(`anchors ${groupsOk}/${total}`)
  assert.equal(missing.length, 0, `段首句 / 语义句缺失：${missing.join('、')}`)
})

test('SB-TC-35 4 个符号名各恰 1 行 export const（定义层 definitions/*.mjs，不 -Recurse）', () => {
  const dir = join(ROOT, 'tools', 'docgen', 'policy', 'definitions')
  const files = readdirSync(dir).filter((f) => f.endsWith('.mjs'))
  const counts = POINTER_SYMBOLS.map((sym) => ({
    sym,
    n: files.reduce((acc, f) => acc + readFileSync(join(dir, f), 'utf8').split(/\r?\n/)
      .filter((l) => new RegExp(`export const ${sym}\\b`).test(l)).length, 0),
  }))
  const bad = counts.filter((c) => c.n !== 1)
  console.log(`defs ${counts.length - bad.length}/${counts.length}`)
  assert.equal(bad.length, 0, `符号定义行数必须各恰 1：${bad.map((b) => `${b.sym}=${b.n}`).join('、')}`)
})

const COMMAND_LINE_PROBE = (seat) => [
  "const m = await import('./tools/docgen/components/renderBoundary.mjs')",
  `const line = m.renderBoundary(${JSON.stringify(seat)}).split('\\n').find((l) => l.includes('命令默认拒绝')) ?? ''`,
  "process.stdout.write(line + '\\n')",
].join('\n')

test('SB-TC-40 命令白名单句含本席组 ID（2 卡）；空组必写「无白名单命令」且不列命令', () => {
  // ① 正例基线：判定面恰 2 席、组 ID 全在位
  const badSeats = POINTER_SEATS.filter((s) => {
    const groups = SEAT_POLICY[s].allowGroups
    return groups.length === 0 || !groups.every((g) => commandLine(rendered(s)).includes(g))
  })
  assert.equal(POINTER_SEATS.length, 2, '判定面必须恰 2 席（走 renderBoundary 的席）')
  assert.equal(badSeats.length, 0, `缺组 ID 的席：${badSeats.join('、')}`)

  // ② 负例 A：删掉组 ID → 缺组数 ≥ 1
  const noIds = commandLine(rendered('reviewer-audit'))
    .replace(/`(?:check\.local|git\.read|docgen\.read)`/g, '')
  const missingA = SEAT_POLICY['reviewer-audit'].allowGroups.filter((g) => !noIds.includes(g)).length
  assert.ok(missingA >= 1, '删掉组 ID 后必须判出缺组（否则该判据没有判别力）')

  // ③ 负例 B：副本内把该席 allowGroups 改成 [] → 该句必须写「无白名单命令」且不含具体命令
  withRepoCopy((copy) => {
    const p = join(copy, 'tools', 'docgen', 'policy', 'seat-policy.mjs')
    const src = readFileSync(p, 'utf8')
    const patched = src.replace(/(\{ capabilities: \['read',\s*'write',\s*'exec'\], allowGroups: )\[[^\]]*\]/, '$1[]')
    assert.notEqual(patched, src, '构造失败：reviewer-audit 的 allowGroups 未改成 []')
    writeFileSync(p, patched, 'utf8')

    const r = runProbeIn(copy, COMMAND_LINE_PROBE('reviewer-audit'))
    assert.equal(r.status, 0, `空组构造后探针必须能跑通：${r.stdout}${r.stderr}`)
    assert.match(r.stdout, /无白名单命令/, `空组必须写「无白名单命令」语义：${r.stdout}`)
    assert.equal(/npm run|node /.test(r.stdout), false, `空组不得列任何具体命令：${r.stdout}`)

    console.log(`empty-groups: ${r.stdout.trim()} => ok`)
  })
  console.log(`groupIds ${POINTER_SEATS.length - badSeats.length}/${POINTER_SEATS.length} / negA missing ${missingA} => ok`)
})

test('SB-TC-41 env 槽已指针化：改前基线命中 5 / 改后渲染命中 0 / 漏改 env ≥1 / 只改一半 = 1', () => {
  const envVerbs = CMD.forbiddenGroups['env.assign'].verbs
  const envHits = (text) => envVerbs.filter((v) => text.includes(v)).length
  const renderAll = (seat) => `const m = await import('./tools/docgen/components/renderBoundary.mjs'); process.stdout.write(m.renderBoundary(${JSON.stringify(seat)}))`
  const OLD_ENV_FORMS = "  return CMD.forbiddenGroups['env.assign'].verbs.join(' / ');"

  // ① 改前基线 = **构造式**（不锚 git 历史）：副本内把 `envForms` 还原成指针化之前的旧展开式，
  // 再渲染一次 → 命中数必须等于该组 verb 数（= 5）。旧写法取「最后改模板那次提交」的卡，
  // 该锚会随下一次改模板（S-C 按 R11「模板改 + 卡同批重生成」提交）移到改后形态 → envHits 0 →
  // 凭空变红且报错文案指错方向（任务级审查 Important #1）。
  withRepoCopy((copy) => {
    const p = join(copy, 'tools', 'docgen', 'components', 'renderBoundary.mjs')
    const src = readFileSync(p, 'utf8')
    writeFileSync(p, replaceFnBody(src, 'envForms', OLD_ENV_FORMS), 'utf8')
    const leak = runProbeIn(copy, renderAll('reviewer-audit'))
    assert.equal(leak.status, 0, leak.stderr)
    const oldHits = envHits(leak.stdout)
    assert.equal(oldHits, envVerbs.length,
      `改前基线（旧展开式）必须命中全部 ${envVerbs.length} 个 env 形态项（实得 ${oldHits}）——否则本条判据在金态之前无物可抓`)

    // ③ 负例 A：`DENY_GROUPS` 已指针化、`ENV_FORMS` 保留原样 → 必须 ≥ 1（同一份渲染结果即该失误形态）
    assert.ok(oldHits >= 1, `漏改 env 槽必须能红（实得 ${oldHits}）`)

    // ④ 负例 B：`ENV_FORMS` 只留 1 个 verb → 命中必须 = 1（等值断言，剩 1 个即红）
    writeFileSync(p, replaceFnBody(src, 'envForms', "  return CMD.forbiddenGroups['env.assign'].verbs.slice(0, 1).join(' / ');"), 'utf8')
    const b = runProbeIn(copy, renderAll('reviewer-audit'))
    assert.equal(b.status, 0, b.stderr)
    assert.equal(envHits(b.stdout), 1, `只留 1 个 verb 时必须命中 1（实得 ${envHits(b.stdout)}）`)
    console.log(`env-slot: old ${oldHits}/${envVerbs.length} / new 0 / leak ${oldHits} / half ${envHits(b.stdout)} => ok`)
  })

  // ② 金态：改后渲染命中 = 0（漏改 ENV_FORMS 时这一步就是唯一会红的地方）
  assert.equal(envHits(rendered('reviewer-audit')), 0, '改后渲染不得再出现 env 具体形态项')

  // ⑤ 复原态（真实仓渲染）仍 = 0
  assert.equal(envHits(rendered('detective-observer')), 0, '复原后必须仍为 0')
})

test('SB-TC-34 注入值不做字符串变换：加「核对」后缀 → 同形探针逐席不等，判据红', () => {
  withRepoCopy((copy) => {
    const p = join(copy, 'tools', 'docgen', 'components', 'seatLoader.mjs')
    const src = readFileSync(p, 'utf8')
    const INJECT = 's.card.duty.categories = s.card.categories.map((c) => c.label)'
    const hits = src.split(INJECT).length - 1
    assert.equal(hits, 1, `注入实现必须恰 1 处（实得 ${hits}）：${INJECT}`)
    writeFileSync(p, src.replace(INJECT, "s.card.duty.categories = s.card.categories.map((l) => l + '核对')"), 'utf8')

    const n = seatFiles(copy).length
    const bad = runEsm(copy, DUTY_PROBE_SRC)
    assert.notEqual(bad.status, 0, `注入做了字符串变换必须红：${bad.stdout}${bad.stderr}`)
    assert.match(bad.stdout, new RegExp(`bad ${n}(?![0-9])`), bad.stdout)

    writeFileSync(p, src, 'utf8')
    const ok = runEsm(copy, DUTY_PROBE_SRC)
    assert.equal(ok.status, 0, `复原后必须为绿：${ok.stdout}${ok.stderr}`)
    assert.match(ok.stdout, new RegExp(`same ${n}/${n}(?![0-9])`), ok.stdout)

    console.log(`transform: ${bad.stdout.trim()} / restored: ${ok.stdout.trim()}`)
  })
})

// ── Task 6：15 卡重生成 + 15 份 evidence + 冻结基线（spec §11.2.7-1..4 / §11.4-6 · §11.4-8 / §11.1 R11）──
// **常驻 / 一次性两档**（spec §11.2.7 第 4 步末句「该形态断言只对本批 BASE 成立…常驻测试只留不变量」）：
// 凡依赖「本批 BASE 的 diff 形态」的断言（文件数 / 位置型三分类）都归一次性核对，须 `SB_SHAPE_ONESHOT=1` 才跑；
// 否则 S-C 改卡面（如删「职责」段人设套话）会被本批形态断言拦住，最可能的错修法就是改本批常量。
const ONESHOT = process.env.SB_SHAPE_ONESHOT === '1'
// 一次性档的比对基准：默认 = 本批冻结常量（不随 HEAD 移动——提交后 `git diff HEAD` 恒 0 会变空判据）；
// 后续批次用 `SB_BASE=<新提交>` 显式覆盖，不改本文件。
const SB_BASE = (process.env.SB_BASE || '').trim() || '2c186c28e4aba776395657829aded2e14b10fca0'
if (!ONESHOT) console.log('oneshot skipped（SB_SHAPE_ONESHOT≠1）')
const CARDS_DIR = join(ROOT, 'agents')
const cardFiles = () => readdirSync(CARDS_DIR).filter((f) => f.endsWith('.md'))
// 席数一律派生（`TC-C06` / `TC-C11` 的计数探针禁测试侧写死 14 / 15 字面量）
const seatTotal = () => cardFiles().length
const sha256Of = (buf) => createHash('sha256').update(buf).digest('hex').toUpperCase()
const countLines = (text, needle) => text.split('\n').filter((l) => l.includes(needle)).length
const cardTextOf = (seat) => readFileSync(join(CARDS_DIR, `${seat}.md`), 'utf8')
const evidenceOf = (seat) => JSON.parse(readFileSync(join(ROOT, 'tools', 'docgen', 'fixtures', `${seat}.evidence.json`), 'utf8'))

function runGateIn(dir) {
  const r = spawnSync(process.execPath, ['tools/docgen/cli.mjs', 'gate'], { cwd: dir, encoding: 'utf8' })
  return { status: r.status, text: `${r.stdout ?? ''}${r.stderr ?? ''}` }
}

// 判据不依赖 git 的进程退出码：文件数 / 路径数一律从输出文本解析
function gitText(args) {
  const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' })
  assert.equal(r.status, 0, `git ${args.join(' ')} 失败：${r.stderr ?? ''}`)
  return r.stdout ?? ''
}
const filesChangedOf = (statOut) => Number((/(\d+) files? changed/.exec(statOut) ?? [])[1] ?? 0)
const changedPathsAtBase = () => gitText(['diff', '--name-only', SB_BASE, '--', 'agents/'])
  .split(/\r?\n/).filter((l) => l.trim())

test('SB-TC-06（常驻）：gate exit 0 + 15 份 evidence 的 renderSha256 与盘上逐席一致', () => {
  const g = runGateIn(ROOT)
  assert.equal(g.status, 0, `gate 必须 exit 0（各席 disk == render）：${g.text}`)

  // evidence.renderSha256 == 盘上：不等的席逐个点名（不变量：与任何 BASE 无关）
  const mismatch = cardFiles().filter((f) => {
    const seat = f.slice(0, -3)
    return evidenceOf(seat).renderSha256 !== sha256Of(readFileSync(join(CARDS_DIR, f)))
  })

  console.log(`regenerate: gate ${g.status} / evidence mismatch ${mismatch.length}`)
  assert.equal(mismatch.length, 0, `evidence.renderSha256 与盘上不等的席：${mismatch.join('、') || '(无)'}`)
})

test('SB-TC-06（一次性）：与 SB_BASE 比每席都变 + 每席一个路径', { skip: !ONESHOT }, () => {
  const files = filesChangedOf(gitText(['diff', '--stat', SB_BASE, '--', 'agents/']))
  const paths = changedPathsAtBase()
  console.log(`regenerate(oneshot): base ${SB_BASE.slice(0, 7)} / stat ${files} / name-only ${paths.length}`)
  assert.equal(files, seatTotal(), `与 BASE 比必须每席都变（实得 ${files} / 席数 ${seatTotal()}）`)
  assert.equal(paths.length, seatTotal(), `与 BASE 比必须每席一个路径（实得 ${paths.length}）`)
})

test('SB-TC-08 关注点单行：`关注类别：` = 0 且 `类别：` ≥ 席数（两向合取）+ gate exit 0', () => {
  const files = cardFiles()
  const texts = files.map((f) => readFileSync(join(CARDS_DIR, f), 'utf8'))
  const focus = texts.reduce((n, t) => n + countLines(t, '关注类别：'), 0)
  const cats = texts.reduce((n, t) => n + countLines(t, '类别：'), 0)
  const g = runGateIn(ROOT)

  console.log(`focus-lines: 关注类别 ${focus} / 类别 ${cats} / gate ${g.status}`)
  // 两向必须同时断：只判 类别 ≥ 席数 会在「关注类别 没删」时假绿；只判 关注类别 = 0 会漏掉「类别 行被一起删」
  assert.equal(focus, 0, `「关注类别：」必须 0 命中（实得 ${focus}）`)
  assert.ok(cats >= seatTotal(), `「类别：」必须每席一行（实得 ${cats} / 席数 ${seatTotal()}）`)
  assert.equal(g.status, 0, `gate 必须 exit 0：${g.text}`)
})

// 逐行所属节（卡面无围栏代码块，按标题推进即可）
function headingPerLine(text) {
  const lines = text.split('\n')
  const out = new Array(lines.length).fill('')
  let cur = ''
  lines.forEach((l, i) => {
    const m = /^#{1,6}\s+(.*)$/.exec(l)
    if (m) cur = m[1].trim()
    out[i] = cur
  })
  return out
}

// 与 BASE 比的 `git diff -U0`：hunk 头给出两侧起点，逐行推进两侧行号即可把每条增删行
// 映射到**它所在那一版文件**的节名（删行取旧侧、增行取新侧）。
function changesWithSections(seat) {
  const oldSec = headingPerLine(gitText(['show', `${SB_BASE}:agents/${seat}.md`]))
  const newSec = headingPerLine(cardTextOf(seat))
  const dels = []
  const adds = []
  let oldIdx = 0
  let newIdx = 0
  let inHunk = false
  for (const raw of gitText(['diff', '-U0', SB_BASE, '--', `agents/${seat}.md`]).split('\n')) {
    const line = raw.replace(/\r$/, '')
    const m = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line)
    if (m) {
      oldIdx = Number(m[1]) - 1
      newIdx = Number(m[2]) - 1
      inHunk = true
      continue
    }
    if (!inHunk) continue // 文件头（`diff --git` / `index` / `---` / `+++`）不算增删行
    if (line.startsWith('-')) {
      dels.push({ line: line.slice(1), section: oldSec[oldIdx] ?? '' })
      oldIdx += 1
    } else if (line.startsWith('+')) {
      adds.push({ line: line.slice(1), section: newSec[newIdx] ?? '' })
      newIdx += 1
    }
  }
  return { dels, adds }
}

test('SB-TC-32 变更形态（位置型三段，一次性）：每席恰 1 条 `关注类别：` 删行在「职责」段；非指针席其余增删只在「输出格式」段；指针席「边界」段至少 1 增 1 删', { skip: !ONESHOT }, () => {
  const files = filesChangedOf(gitText(['diff', '--stat', SB_BASE, '--', 'agents/']))
  const paths = changedPathsAtBase()
  assert.equal(files, seatTotal(), `与 BASE 比必须每席都变（实得 ${files}）`)
  assert.equal(paths.length, seatTotal(), `与 BASE 比必须每席一个路径（实得 ${paths.length}）`)

  const badFocusCount = []
  const badFocusSection = []
  const badExtra = []
  const badBoundaryAdd = []
  const badBoundaryDel = []
  for (const f of cardFiles()) {
    const seat = f.slice(0, -3)
    const { dels, adds } = changesWithSections(seat)
    const focusDels = dels.filter((d) => d.line.startsWith('关注类别：'))
    if (focusDels.length !== 1) badFocusCount.push(`${seat}:${focusDels.length}`)
    if (focusDels[0] && focusDels[0].section !== '职责') badFocusSection.push(`${seat}:${focusDels[0].section || '(无)'}`)

    if (POINTER_SEATS.includes(seat)) {
      // Ⅲ：分别断言（不得只判「边界段合计 ≥ 2」——一次替换可能 1 增 1 删，也可能全删无增）
      if (adds.filter((x) => x.section === '边界').length < 1) badBoundaryAdd.push(seat)
      if (dels.filter((x) => x.section === '边界').length < 1) badBoundaryDel.push(seat)
    } else {
      // Ⅱ：除那条删行外，全部增删的所在节 = 「输出格式」（R1 的预期变更面，无第三类）
      const stray = [...dels.filter((d) => !d.line.startsWith('关注类别：')), ...adds]
        .filter((x) => x.section !== '输出格式')
      if (stray.length > 0) badExtra.push(`${seat}:${stray.length}（${stray.map((x) => x.section || '(无)').join('|')}）`)
    }
  }

  const other = seatTotal() - POINTER_SEATS.length
  console.log(`change-shape: files ${files} / focus1 ${seatTotal() - badFocusCount.length}/${seatTotal()} / section 职责 ${seatTotal() - badFocusSection.length}/${seatTotal()} / extra 0 ${other - badExtra.length}/${other} / boundary add ${POINTER_SEATS.length - badBoundaryAdd.length}/${POINTER_SEATS.length} del ${POINTER_SEATS.length - badBoundaryDel.length}/${POINTER_SEATS.length}`)
  assert.equal(badFocusCount.length, 0, `被删的「关注类别：」行必须每席恰 1 条：${badFocusCount.join('、')}`)
  assert.equal(badFocusSection.length, 0, `「关注类别：」行必须落在「职责」段：${badFocusSection.join('、')}`)
  assert.equal(badExtra.length, 0, `非指针席除该删行外不得在「输出格式」段之外有任何增删：${badExtra.join('、')}`)
  assert.equal(badBoundaryAdd.length, 0, `指针席「边界」段必须至少 1 条增行：${badBoundaryAdd.join('、')}`)
  assert.equal(badBoundaryDel.length, 0, `指针席「边界」段必须至少 1 条删行：${badBoundaryDel.join('、')}`)
})

// 用副本自己的渲染器把 15 卡写回盘上（写盘字节与 `replace` 同源；`generate` 是「只比不写」，不能当写盘通路）
const WRITE_RENDER_SRC = [
  "import { readdirSync, writeFileSync, readFileSync } from 'node:fs'",
  "import { join } from 'node:path'",
  "import { renderByName } from './tools/docgen/components/renderByName.mjs'",
  "let n = 0",
  "for (const f of readdirSync('agents').filter((x) => x.endsWith('.md'))) {",
  "  const seat = f.slice(0, -3)",
  "  const out = renderByName(seat)",
  "  if (readFileSync(join('agents', f), 'utf8') !== out) { writeFileSync(join('agents', f), out, 'utf8'); n += 1 }",
  "}",
  "process.stdout.write('written ' + n + '\\n')",
].join('\n')

// 前置归一：副本的 15 卡先与渲染对齐（testcase 前置「15 卡已重生成」），否则本用例会随施工时点变义
function syncCopyCards(copy) {
  const r = runProbeIn(copy, WRITE_RENDER_SRC)
  assert.equal(r.status, 0, `副本重生成失败：${r.stdout}${r.stderr}`)
  const g = runGateIn(copy)
  assert.equal(g.status, 0, `归一后副本 gate 必须 exit 0：${g.text}`)
}

// 被指针化的 4 行在模板里的落点（4 行文案 = spec §11.3 的那 4 条清单类行）
const TEMPLATE_LINE_ANCHORS = ['**除上述落点外', '**命令默认拒绝**', '**禁止**：', '**检测限度**']

test('SB-TC-25 只改模板 4 行不重生成 → `Mismatch` exit 1；重生成后 exit 0（副本内自包含）', () => {
  withRepoCopy((copy) => {
    syncCopyCards(copy)
    const bytesBefore = new Map(cardFiles().map((f) => [f, readFileSync(join(copy, 'agents', f))]))

    const tplPath = join(copy, 'tools', 'docgen', 'templates', 'boundary.md.tpl')
    let tpl = readFileSync(tplPath, 'utf8')
    for (const anchor of TEMPLATE_LINE_ANCHORS) {
      const hits = tpl.split(anchor).length - 1
      assert.equal(hits, 1, `模板里 ${anchor} 必须恰 1 处（实得 ${hits}），否则构造改错位置`)
      tpl = tpl.replace(anchor, `${anchor}（探针）`)
    }
    writeFileSync(tplPath, tpl, 'utf8')

    const red = runGateIn(copy)
    assert.notEqual(red.status, 0, `只改模板不重生成不得 exit 0：${red.text}`)
    assert.match(red.text, /Mismatch/, red.text)
    const named = POINTER_SEATS.filter((s) => red.text.includes(`agents/${s}.md`))
    assert.ok(named.length >= 1, `Mismatch 必须点名受影响的卡：${red.text}`)

    const w = runProbeIn(copy, WRITE_RENDER_SRC)
    assert.equal(w.status, 0, w.stdout + w.stderr)
    const green = runGateIn(copy)
    assert.equal(green.status, 0, `重生成后必须 exit 0：${green.text}`)

    const changed = [...bytesBefore].filter(([f, buf]) => !readFileSync(join(copy, 'agents', f)).equals(buf)).map(([f]) => f)
    console.log(`template-only: red ${red.status} / named ${named.join(',')} / green ${green.status} / changed ${changed.length}`)
    // 只有走模板的 2 席变；其余席走 DEFAULT_BOUNDARY / SDET_BOUNDARY，模板不喂养它们
    assert.deepEqual(changed.sort(), POINTER_SEATS.map((s) => `${s}.md`).sort(), `模板改动只应波及这 2 席：${changed.join('、')}`)
  })
})

// ④ 与 BASE 比的变更面（副本不是 git 仓，基准面只能在真实仓读）→ 归一次性核对
test('SB-TC-25（一次性）④：与 SB_BASE 比每席都变', { skip: !ONESHOT }, () => {
  const files = filesChangedOf(gitText(['diff', '--stat', SB_BASE, '--', 'agents/']))
  console.log(`template-only(oneshot): base ${SB_BASE.slice(0, 7)} / stat ${files}`)
  assert.equal(files, seatTotal(), `与 BASE 比必须每席都变（实得 ${files}）`)
})

// 副本内的 evidence / 卡读写（`replace` 只认这两处）
const copyCardPath = (dir, seat) => join(dir, 'agents', `${seat}.md`)
const copyEvPath = (dir, seat) => join(dir, 'tools', 'docgen', 'fixtures', `${seat}.evidence.json`)
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'))
const writeJson = (p, v) => writeFileSync(p, `${JSON.stringify(v, null, 2)}\n`, 'utf8')
const newestDraftOf = (dir, seat) => {
  const box = join(dir, '.drafts')
  const f = readdirSync(box).filter((x) => x.startsWith(`${seat}--`)).sort().pop()
  assert.ok(f, `副本的草稿箱里必须有 ${seat} 的草稿`)
  return join(box, f)
}
// 草稿复用：`replace` 失败时不清草稿（DraftNameConflict 会挡住第二次 `draft`），
// 而渲染输入不变 → 已存在的草稿与本次渲染逐字节相同，直接复用。
const draftOf = (dir, seat) => {
  const box = join(dir, '.drafts')
  const existing = existsSync(box) ? readdirSync(box).filter((x) => x.startsWith(`${seat}--`)) : []
  if (existing.length === 0) {
    const d = runCli(dir, ['draft', '--kind', 'agent', '--name', seat])
    assert.equal(d.status, 0, `draft 失败：${d.stdout}${d.stderr}`)
  }
  return newestDraftOf(dir, seat)
}

test('SB-TC-26 `replace` 三红一正：BaselineDrift exit 2 / evidence 陈旧就地改写 exit 0 / 漏 `--expect-change` → UnapprovedChange / 带凭证 exit 0', () => {
  withRepoCopy((copy) => {
    syncCopyCards(copy)
    const seat = 'reviewer-ai'

    // ① baseline 陈旧：同时在 BASELINE_RULES 追加一项 + 建该文件（只建文件会先发 UnregisteredHandwritten，码不同）
    const bm = join(copy, 'tools', 'docgen', 'components', 'baseline.mjs')
    const bmSrc = readFileSync(bm, 'utf8')
    const patched = bmSrc.replace('export const BASELINE_RULES = [', "export const BASELINE_RULES = [\n  'rules/zzz-drift-probe.md',")
    assert.notEqual(patched, bmSrc, '构造失败：BASELINE_RULES 定义行未命中')
    writeFileSync(bm, patched, 'utf8')
    writeFileSync(join(copy, 'rules', 'zzz-drift-probe.md'), '# 探针\n', 'utf8')
    const r1 = runCli(copy, ['replace', '--kind', 'agent', '--name', seat, '--draft', draftOf(copy, seat), '--yes'])
    assert.equal(r1.status, 2, `baseline 陈旧必须 exit 2：${r1.stdout}${r1.stderr}`)
    assert.match(r1.stderr, /^BaselineDrift:/m, r1.stderr)
    // 复原两半（源码数组 + 探针文件）：只复原一半会让后续子用例先吃到 UnregisteredHandwritten
    writeFileSync(bm, bmSrc, 'utf8')
    rmSync(join(copy, 'rules', 'zzz-drift-probe.md'), { force: true })

    // ② evidence 陈旧 + 盘上 == 渲染 → 幂等恢复（就地改写 renderSha256，exit 0，不报码）
    const ev = readJson(copyEvPath(copy, seat))
    const stale = 'A'.repeat(64)
    ev.renderSha256 = stale
    writeJson(copyEvPath(copy, seat), ev)
    const r2 = runCli(copy, ['replace', '--kind', 'agent', '--name', seat, '--draft', draftOf(copy, seat), '--yes'])
    assert.equal(r2.status, 0, `幂等分支必须 exit 0：${r2.stdout}${r2.stderr}`)
    const ev2 = readJson(copyEvPath(copy, seat))
    assert.notEqual(ev2.renderSha256, stale, '幂等分支必须把 renderSha256 就地改写成新值')
    assert.equal(ev2.renderSha256, sha256Of(readFileSync(copyCardPath(copy, seat))), 'renderSha256 必须等于盘上哈希')

    // ③ / ④ 的前置：把盘上卡换成「旧内容」（末行多一句），并把 evidence.lastWrittenHash 对齐它
    const renderedText = readFileSync(copyCardPath(copy, seat), 'utf8')
    const oldText = `${renderedText}（旧版占位）\n`
    writeFileSync(copyCardPath(copy, seat), oldText, 'utf8')
    const ev3 = readJson(copyEvPath(copy, seat))
    ev3.lastWrittenHash = sha256Of(Buffer.from(oldText, 'utf8'))
    writeJson(copyEvPath(copy, seat), ev3)

    const r3 = runCli(copy, ['replace', '--kind', 'agent', '--name', seat, '--draft', draftOf(copy, seat), '--yes'])
    assert.notEqual(r3.status, 0, `漏 --expect-change 不得 exit 0：${r3.stdout}${r3.stderr}`)
    assert.match(`${r3.stdout}${r3.stderr}`, /UnapprovedChange/, r3.stderr)

    const newSha = sha256Of(Buffer.from(renderedText, 'utf8'))
    const r4 = runCli(copy, ['replace', '--kind', 'agent', '--name', seat, '--draft', draftOf(copy, seat), '--yes', '--expect-change', newSha])
    assert.equal(r4.status, 0, `带凭证必须 exit 0：${r4.stdout}${r4.stderr}`)
    assert.equal(readFileSync(copyCardPath(copy, seat), 'utf8'), renderedText, '写盘内容必须逐字等于渲染')

    console.log(`replace: baseline ${r1.status} / idempotent ${r2.status} / missing-proof ${r3.status} / proved ${r4.status}`)
  })
})

test('SB-TC-37 §11.4-8 两向判别力：回填 `关注类别：` → 1 红 / 少一行 `类别：` → 席数 − 1 红', () => {
  withRepoCopy((copy) => {
    syncCopyCards(copy)
    const dir = join(copy, 'agents')
    const files = () => readdirSync(dir).filter((f) => f.endsWith('.md'))
    const count = (needle) => files().reduce((n, f) => n + countLines(readFileSync(join(dir, f), 'utf8'), needle), 0)

    assert.equal(count('关注类别：'), 0, '金态必须 0 命中')
    assert.ok(count('类别：') >= seatTotal(), '金态 `类别：` 必须每席一行')

    // 形态 A：往某卡职责段插回一行
    const a = join(dir, 'reviewer-ai.md')
    const aText = readFileSync(a, 'utf8')
    const backfill = aText.replace(/^(触发：.*)$/m, '$1\n关注类别：探针回填')
    assert.notEqual(backfill, aText, '构造失败：该卡没有「触发：」行可锚')
    writeFileSync(a, backfill, 'utf8')
    assert.equal(count('关注类别：'), 1, '回填一行后计数必须 = 1（判红）')
    writeFileSync(a, aText, 'utf8')

    // 形态 B：删掉某卡的 `类别：` 行
    const b = join(dir, 'reviewer-qa.md')
    const bText = readFileSync(b, 'utf8')
    const removed = bText.split('\n').filter((l) => !l.startsWith('类别：')).join('\n')
    assert.notEqual(removed, bText, '构造失败：该卡没有 `类别：` 行')
    writeFileSync(b, removed, 'utf8')
    assert.equal(count('类别：'), seatTotal() - 1, '少一行 `类别：` 后计数必须 = 席数 − 1（判红）')
    writeFileSync(b, bText, 'utf8')

    assert.equal(count('关注类别：'), 0, '复原后必须 0 命中')
    assert.ok(count('类别：') >= seatTotal(), '复原后 `类别：` 必须每席一行')
    console.log(`two-way: A 1 / B ${seatTotal() - 1} / restored 0,${count('类别：')} => ok`)
  })
})

// ── Task 7：PRD V7 映射非空心校验器（`tools/docgen/check-case-assert.mjs`，spec §11.2.5 / §11.4-4 / §11.1 R10）──
// 首次实测输入 = S-A 那对已签件（S-B 自身 plan 在 ③ 之前不存在）；注入面一律是 testcase 的**副本**，不动已签件。
const SA_PLAN = join(ROOT, 'docs', 'superpowers', 'plans', '2026-11-03-s-a-data-layer.md')
const SA_TESTCASE = join(ROOT, 'docs', 'superpowers', 'specs', '2026-11-03-s-a-data-layer-design-testcase.md')
// ID 形态口径（spec §11.2.5 口径 1）：三位 `TC-\d{3}` / 带段前缀 `S[A-Z]*-TC-[A-Z]?\d\d`
// （`S[A-Z]*-` 同时覆盖 `S3-TC-H06` 与本段自己的 `SB-TC-09`；写 `S\d+-` 时后者取不到）
const CASE_ID_RE = /S[A-Z]*-TC-[A-Z]?\d\d|TC-\d{3}/

function runCase(plan = SA_PLAN, testcase = SA_TESTCASE) {
  const r = spawnSync(process.execPath, ['tools/docgen/check-case-assert.mjs', '--plan', plan, '--testcase', testcase], { cwd: ROOT, encoding: 'utf8' })
  const stdout = r.stdout ?? ''
  return { status: r.status, stdout, text: `${stdout}${r.stderr ?? ''}` }
}

const outLines = (r) => r.stdout.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
const lineAt = (r, n) => outLines(r)[n] ?? ''

// 测试侧**独立复算** ID 集合（不复用脚本的实现）：只认表头含「用例」且下一行是分隔行的那张表，逐行取第 1 列
function planCaseCells(planText) {
  const lines = planText.split(/\r?\n/).map((l) => l.trim())
  const head = lines.findIndex((l, i) => l.startsWith('|') && l.includes('用例') && /^\|[\s:|-]+\|$/.test(lines[i + 1] ?? ''))
  assert.ok(head >= 0, '前置：plan 里必须有一张表头含「用例」的表')
  const cells = []
  for (let i = head + 2; i < lines.length && lines[i].startsWith('|'); i += 1) cells.push((lines[i].replace(/^\|/, '').split('|')[0] ?? '').trim())
  return cells
}

// 用例体的定位（测试侧独立实现，用于构造注入面）：`### <ID>` 起至下一个同级标题止
function caseBodyRange(lines, id) {
  const start = lines.findIndex((l) => new RegExp(`^#{1,6}\\s+${id}(?![\\w-])`).test(l.trim()))
  assert.ok(start >= 0, `前置：testcase 里必须有「### ${id}」用例体`)
  const level = (lines[start].trim().match(/^#+/) ?? [''])[0].length
  let end = lines.length
  for (let i = start + 1; i < lines.length; i += 1) {
    const h = /^(#+)\s/.exec(lines[i].trim())
    if (h && h[1].length <= level) { end = i; break }
  }
  return { start, end }
}

// 把某条用例体变成「只剩恒真断言」：体内所有 `assert.*` 换成同一形态；
// S-A testcase 的用例体一条 `assert.*` 都没有（正文是命令 + 预期，断言落在代码测试里）→ 原地追加一条，
// 否则「替换所有」在零命中时是空操作，这条用例就辨不出红（构造失效）。
function hollowify(text, id, form) {
  const lines = text.split(/\r?\n/)
  const { start, end } = caseBodyRange(lines, id)
  const body = lines.slice(start, end).join('\n')
  const next = /assert\s*\.\s*[A-Za-z_$][\w$]*\s*\(/.test(body)
    ? body.replace(/assert\s*\.\s*[A-Za-z_$][\w$]*\s*\([^)]*\)/g, form)
    : `${body}\n- 断言：${form}`
  return [...lines.slice(0, start), ...next.split('\n'), ...lines.slice(end)].join('\n')
}

// 往某条用例体末尾追加若干行（混装构造用：一条真断言 + 一条恒真断言）
function appendToBody(text, id, snippet) {
  const lines = text.split(/\r?\n/)
  const { end } = caseBodyRange(lines, id)
  return [...lines.slice(0, end), snippet, ...lines.slice(end)].join('\n')
}

test('SB-TC-09 check-case-assert 绿态：S-A 那对已签件 `ids 30 / hollow 0 / missing 0 => ok` + 第二行 `noassert 30`，且 30 个 ID 形态为 `TC-\\d{3}`', () => {
  const r = runCase()
  assert.equal(r.status, 0, r.text)
  assert.equal(lineAt(r, 0), 'check-case-assert: ids 30 / hollow 0 / missing 0 => ok')
  // 零 assert 的用例体不判 hollow，但必须在第二行可见（spec §11.2.5 口径 3 / 5）：S-A 的 30 条正文全是「判据即命令」
  assert.equal(lineAt(r, 1), 'noassert 30')

  // ③ 独立复算：集合 A（从 plan「用例」表逐行取）与 B（TC-001…TC-030 的 30 个字面）deepEqual
  const cells = planCaseCells(readFileSync(SA_PLAN, 'utf8'))
  const ids = []
  for (const cell of cells) {
    const m = CASE_ID_RE.exec(cell)
    if (m && !ids.includes(m[0])) ids.push(m[0])
  }
  const expected = Array.from({ length: 30 }, (_, i) => `TC-${String(i + 1).padStart(3, '0')}`)
  assert.deepEqual([...ids].sort(), expected, `plan「用例」列取出的 ID 集合必须恰为 TC-001…TC-030（实得 ${ids.length} 个：${ids.join('、')}）`)

  // ④ 两位正则的唯一值数 = 4（证明「三位」不是可省的口径）
  const twoDigit = new Set()
  for (const cell of cells) {
    const m = /TC-\d\d/.exec(cell)
    if (m) twoDigit.add(m[0])
  }
  assert.equal(twoDigit.size, 4, `按两位 TC-\\d\\d 重扫唯一值必须 = 4（实得 ${twoDigit.size}：${[...twoDigit].join('、')}）`)

  // ⑤ 空转守卫（spec §11.2.5 口径 1）：plan 指向不含「用例」表的文件 → `ids 0` 且 exit 1（不得静默恒绿）
  const dir = mkdtempSync(join(tmpdir(), 'ca-copy-'))
  try {
    const noTable = join(dir, 'plan-no-case-table.md')
    writeFileSync(noTable, '# 无「用例」表的 plan\n\n| 编号 | 说明 |\n|---|---|\n| A1 | 验收项（不是用例表） |\n', 'utf8')
    const g = runCase(noTable)
    assert.equal(g.status, 1, `取不到 ID 必须 exit 1（不得 exit 0 / exit 2）：${g.text}`)
    assert.equal(lineAt(g, 0), 'check-case-assert: ids 0（取不到用例 ID：表头/正则/文件不匹配）=> fail')
    console.log(`case-assert: ids ${ids.length} / two-digit ${twoDigit.size} / noassert 30 / ids0 guard 1 => ok`)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('SB-TC-21 用例体只剩恒真断言（四种形态：true / 带空格 / 1 / \'1\'）→ `hollow 1`、`missing 0`、exit 1；混装一条真断言 → 不判 `hollow`', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ca-copy-'))
  try {
    const copy = join(dir, 'testcase.md')
    const src = readFileSync(SA_TESTCASE, 'utf8')
    const id = 'TC-004'
    const forms = ['assert.ok(true)', 'assert.ok( true )', 'assert.ok(1)', "assert.ok('1')"]
    for (const form of forms) {
      writeFileSync(copy, hollowify(src, id, form), 'utf8')
      const r = runCase(SA_PLAN, copy)
      assert.notEqual(r.status, 0, `形态 ${form} 不得 exit 0：${r.text}`)
      assert.ok(r.text.includes('hollow 1'), `形态 ${form} 必须报 hollow 1：${r.text}`)
      assert.ok(r.text.includes('missing 0'), `形态 ${form} 不得把空心算进 missing：${r.text}`)
      assert.match(r.text, new RegExp(`${id}（\\d+）`), `形态 ${form} 的输出必须点名 ${id} 与行号：${r.text}`)
    }

    // 混装：体内一条真断言 + 一条恒真断言 → **不得**判 hollow（every() 语义：只有「全部恒真」才算空心）
    writeFileSync(copy, appendToBody(src, id, '- 断言：assert.equal(ids.length, 30)\n- 断言：assert.ok(true)'), 'utf8')
    const mixed = runCase(SA_PLAN, copy)
    assert.equal(mixed.status, 0, `混装一条真断言不得判 hollow：${mixed.text}`)
    assert.equal(lineAt(mixed, 0), 'check-case-assert: ids 30 / hollow 0 / missing 0 => ok')
    // 该体不再零 assert → noassert 必须从 30 减到 29（恒真断言不得被算进 noassert，也不得把体算成空心）
    assert.equal(lineAt(mixed, 1), 'noassert 29', `混装后 noassert 必须 = 29：${mixed.text}`)

    writeFileSync(copy, src, 'utf8')
    const back = runCase(SA_PLAN, copy)
    assert.equal(back.status, 0, `复原后必须为绿：${back.text}`)
    assert.match((back.stdout.split(/\r?\n/)[0] ?? '').trim(), /^check-case-assert: ids 30 \/ hollow 0 \/ missing 0 => ok$/)

    console.log(`hollow: ${forms.length}/${forms.length} => red / mixed => ok / restored => ok`)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('SB-TC-38 plan 引用的用例 ID 在 testcase 里找不到用例体 → `missing 1`、`hollow 0`、exit 1', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ca-copy-'))
  try {
    const copy = join(dir, 'testcase.md')
    const src = readFileSync(SA_TESTCASE, 'utf8')
    const id = 'TC-004'
    const lines = src.split(/\r?\n/)
    const { start, end } = caseBodyRange(lines, id)
    // 整段删（含标题），`---` 分隔符保留
    writeFileSync(copy, [...lines.slice(0, start), ...lines.slice(end)].join('\n'), 'utf8')

    const r = runCase(SA_PLAN, copy)
    assert.notEqual(r.status, 0, `找不到用例体不得 exit 0：${r.text}`)
    assert.ok(r.text.includes('missing 1'), `必须报 missing 1：${r.text}`)
    assert.ok(r.text.includes('hollow 0'), `不得把「找不到用例体」算成空心：${r.text}`)
    assert.ok(r.text.includes(`${id}（missing）`), `输出必须点名 ${id}：${r.text}`)

    writeFileSync(copy, src, 'utf8')
    const back = runCase(SA_PLAN, copy)
    assert.equal(back.status, 0, `复原后必须为绿：${back.text}`)
    assert.match((back.stdout.split(/\r?\n/)[0] ?? '').trim(), /^check-case-assert: ids 30 \/ hollow 0 \/ missing 0 => ok$/)

    console.log('missing: 1 => red / restored => ok')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ── ④ 段补测（2026-11-04 质量评估席，`quality-4.md` §2 的「补测新增」）──────────────
// 只补「明写判据但落点无对应断言」的窄口，不碰任何已签断言：
// ① SB-TC-27 的 `code = TemplateImpure`（原落点只断 fragment 前缀 `ALLOWED_LITERALS:`）；
// ② SB-TC-40 ③ 的「空组态仍列命令 → 判据能红」（原落点只断正向「不许列命令」）。

test('SB-TC-27（补测）白名单登记清单类成员时抛出的 code 必须是 TemplateImpure（不只断 fragment 前缀）', () => {
  withRepoCopy((copy) => {
    patchRenderBoundary(copy, (src) => {
      const start = src.indexOf('export const TEMPLATE_ALLOWED_LITERALS = new Set([')
      const end = src.indexOf(']);', start)
      assert.ok(start >= 0 && end > start, '构造失败：白名单定义未找到')
      const body = src.slice(start, end)
      const patched = body.replace("  '越权清单',", "  '越权清单',\n  'agents/',")
      assert.notEqual(patched, body, '构造失败：白名单插入点未命中')
      return src.slice(0, start) + patched + src.slice(end)
    })

    const bad = runProbeIn(copy, PURE_PROBE)
    assert.notEqual(bad.status, 0, `白名单含清单类成员必须抛错：${bad.stdout}${bad.stderr}`)
    // 探针把 code 与 fragment 都打出来（`PROBE <code> <fragment>`）→ 两者须在同一条断言里判死
    assert.match(`${bad.stdout}${bad.stderr}`, /PROBE TemplateImpure ALLOWED_LITERALS:/,
      `错误对象必须 code=TemplateImpure 且 fragment 以 ALLOWED_LITERALS: 开头：${bad.stdout}${bad.stderr}`)

    console.log(`whitelist-code: ${(bad.stderr.split(/\r?\n/)[0] ?? '').trim()} => ok`)
  })
})

test('SB-TC-40（补测）空组态仍列命令 → 该判据能红（金态 0 命中 / 残缺实现 ≥1 命中 / 复原 0）', () => {
  const CMD_WORDS = /npm run|node /
  // 空组分支的原句与残缺句各一份常量：复原后要能逐字验回原句（不能只靠「组非空 → 分支不再进入」蒙过）
  const EMPTY_BRANCH = "if (!Array.isArray(groups) || groups.length === 0) return `${code('commandGroups')}（无白名单组 = 无白名单命令）`;"
  const BROKEN_BRANCH = "if (!Array.isArray(groups) || groups.length === 0) return `${code('commandGroups')}（无白名单组） npm run check`;"
  withRepoCopy((copy) => {
    // ① 金态：本席 allowGroups 非空、命令白名单句只写组 ID，不含任何具体命令
    const clean = runProbeIn(copy, COMMAND_LINE_PROBE('reviewer-audit'))
    assert.equal(clean.status, 0, `金态探针必须能跑通：${clean.stdout}${clean.stderr}`)
    assert.equal(CMD_WORDS.test(clean.stdout), false, `金态不得出现具体命令字样：${clean.stdout}`)

    // ② 残缺实现：该席 allowGroups 改 []（= 空组态）+ allowGroups() 空组分支仍吐命令
    const seatPolicy = join(copy, 'tools', 'docgen', 'policy', 'seat-policy.mjs')
    const spSrc = readFileSync(seatPolicy, 'utf8')
    const line = spSrc.split('\n').find((l) => l.trim().startsWith("'reviewer-audit'"))
    assert.ok(line, "构造失败：seat-policy.mjs 里找不到 reviewer-audit 行")
    const spPatched = spSrc.replace(line, line.replace(/allowGroups: \[[^\]]*\]/, 'allowGroups: []'))
    assert.notEqual(spPatched, spSrc, '构造失败：reviewer-audit 的 allowGroups 未改成 []')
    writeFileSync(seatPolicy, spPatched, 'utf8')

    // renderBoundary 的先像要留着，复原时逐字回写（否则「复原 0」只验了「组非空 → 分支不进入」）
    const rbPath = join(copy, 'tools', 'docgen', 'components', 'renderBoundary.mjs')
    const rbSrc = readFileSync(rbPath, 'utf8')
    patchRenderBoundary(copy, (src) => {
      const hits = src.split(EMPTY_BRANCH).length - 1
      assert.equal(hits, 1, `构造失败：allowGroups() 的空组分支必须恰 1 处（实得 ${hits}）`)
      return src.replace(EMPTY_BRANCH, BROKEN_BRANCH)
    })

    const broke = runProbeIn(copy, COMMAND_LINE_PROBE('reviewer-audit'))
    assert.equal(broke.status, 0, `残缺实现下探针仍须能跑通：${broke.stdout}${broke.stderr}`)
    assert.equal(CMD_WORDS.test(broke.stdout), true,
      `空组态仍列命令时必须能被判据抓到（否则「空组不得列命令」没有判别力）：${broke.stdout}`)

    // ③ 复原两处（renderBoundary 回原始字节 + seat-policy 回原值）后必须回 0 命中
    writeFileSync(rbPath, rbSrc, 'utf8')
    writeFileSync(seatPolicy, spSrc, 'utf8')
    const restored = runProbeIn(copy, COMMAND_LINE_PROBE('reviewer-audit'))
    assert.equal(restored.status, 0, restored.stdout + restored.stderr)
    assert.equal(CMD_WORDS.test(restored.stdout), false, `复原后不得出现命令字样：${restored.stdout}`)

    // ④ 构造可逆：复原后的空组分支确实回到原句——再把该席改成空组，深一次走该分支，必须是「无白名单命令」且不吐命令
    const rbBack = readFileSync(rbPath, 'utf8')
    assert.equal(rbBack.includes(EMPTY_BRANCH), true, '复原后 renderBoundary 必须逐字含原空组分支')
    assert.equal(rbBack.includes(BROKEN_BRANCH), false, '复原后不得残留残缺分支')
    writeFileSync(seatPolicy, spPatched, 'utf8')
    const emptyAgain = runProbeIn(copy, COMMAND_LINE_PROBE('reviewer-audit'))
    assert.equal(emptyAgain.status, 0, emptyAgain.stdout + emptyAgain.stderr)
    assert.match(emptyAgain.stdout, /无白名单命令/, `复原后空组态必须写「无白名单命令」：${emptyAgain.stdout}`)
    assert.equal(CMD_WORDS.test(emptyAgain.stdout), false, `复原后空组态不得吐命令：${emptyAgain.stdout}`)

    console.log(`empty-groups-red: clean 0 / broken 1 / restored 0 / empty-again 0 => ok`)
  })
})
