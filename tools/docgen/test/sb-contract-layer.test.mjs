// S-B 契约层用例落点（SB-TC-04 起）。本文件由 plan 逐任务追加，不要一次写满。
// 编写者：主 agent（施工者本人）；本文件是常驻测试、不是 testcase 文件，不受独立编写义务约束。
import test from 'node:test'
import assert from 'node:assert/strict'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { spawnSync } from 'node:child_process'
import { ROOT, withRepoCopy, runEsm } from './support/dev-workflow-checks.mjs'
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

test('SB-TC-41 env 槽已指针化：改前卡命中 5 / 改后渲染命中 0 / 漏改 env ≥1 / 只改一半 = 1', () => {
  const envVerbs = CMD.forbiddenGroups['env.assign'].verbs
  const envHits = (text) => envVerbs.filter((v) => text.includes(v)).length

  // ① 改前基线：取「最后改模板那次提交」里的卡（该提交自身不含重生成，故卡仍是改前形态；
  //    用模板提交而不是 HEAD，Task 6 重生成后本基线不会漂）
  const rev = spawnSync('git', ['log', '-1', '--format=%H', '--', 'tools/docgen/templates/boundary.md.tpl'],
    { cwd: ROOT, encoding: 'utf8' }).stdout.trim()
  assert.ok(rev, '前置：模板必须已有提交历史')
  for (const seat of POINTER_SEATS) {
    const old = spawnSync('git', ['show', `${rev}:agents/${seat}.md`], { cwd: ROOT, encoding: 'utf8' })
    assert.equal(old.status, 0, `git show ${rev}:agents/${seat}.md 失败：${old.stderr}`)
    assert.equal(envHits(old.stdout), 5, `${seat}: 改前卡必须命中全部 5 个 env 形态项（实得 ${envHits(old.stdout)}）`)
  }

  // ② 金态：改后渲染命中 = 0（漏改 ENV_FORMS 时这一步就是唯一会红的地方）
  assert.equal(envHits(rendered('reviewer-audit')), 0, '改后渲染不得再出现 env 具体形态项')

  // ③ 负例 A：只改 DENY_GROUPS、ENV_FORMS 保留原样 → 必须 ≥ 1
  withRepoCopy((copy) => {
    const p = join(copy, 'tools', 'docgen', 'components', 'renderBoundary.mjs')
    const src = readFileSync(p, 'utf8')
    writeFileSync(p, replaceFnBody(src, 'envForms', "  return CMD.forbiddenGroups['env.assign'].verbs.join(' / ');"), 'utf8')
    const a = runProbeIn(copy, "const m = await import('./tools/docgen/components/renderBoundary.mjs'); process.stdout.write(m.renderBoundary('reviewer-audit'))")
    assert.equal(a.status, 0, a.stderr)
    assert.ok(envHits(a.stdout) >= 1, `漏改 env 槽必须能红（实得 ${envHits(a.stdout)}）`)

    // ④ 负例 B：ENV_FORMS 只留 1 个 verb → 命中必须 = 1（等值断言，剩 1 个即红）
    writeFileSync(p, replaceFnBody(src, 'envForms', "  return CMD.forbiddenGroups['env.assign'].verbs.slice(0, 1).join(' / ');"), 'utf8')
    const b = runProbeIn(copy, "const m = await import('./tools/docgen/components/renderBoundary.mjs'); process.stdout.write(m.renderBoundary('reviewer-audit'))")
    assert.equal(b.status, 0, b.stderr)
    assert.equal(envHits(b.stdout), 1, `只留 1 个 verb 时必须命中 1（实得 ${envHits(b.stdout)}）`)
    console.log(`env-slot: old 5 / new 0 / leak ${envHits(a.stdout)} / half ${envHits(b.stdout)} => ok`)
  })

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
