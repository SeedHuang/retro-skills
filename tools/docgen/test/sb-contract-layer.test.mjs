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
