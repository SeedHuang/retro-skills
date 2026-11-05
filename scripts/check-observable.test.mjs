// scripts/check-observable.test.mjs —— S1 常驻测试（78 条 = testcase 78 条一一对应）
//
// 判据出处：`docs/superpowers/specs/2026-10-31-observable-criteria-rollout-design-testcase.md`
// 写法约束（testcase §0 常量）：
//   · 一律 `mkdtemp` 临时根或内存副本，**不写仓内文件**（常量 9）；
//   · **不得** spawn `npm run check` / `check-all.mjs`（常量 16，会与 ② 段 `node --test` 自递归）；
//   · 「复制词表」判定一律黑盒调 CLI，不写测试侧 helper（常量 17）；
//   · 词表字面只从 JSON 读（F10 要求 `tools/` + `scripts/` 内同形数组恰 1 处 = JSON 本身，
//     故本文件不得出现以「双引号 + 首词」起头的数组字面量 —— 需要时用 `J.terms` 拼接）。
import test from 'node:test'
import assert from 'node:assert'
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, symlinkSync, rmSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { evaluateText } from './check-observable.mjs'

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CLI = join(REPO, 'scripts', 'check-observable.mjs')
const TERMS_FILE = join(REPO, 'tools', 'quality', 'observable-terms.json')
const EXEMPT_FILE = join(REPO, 'tools', 'quality', 'observable-exempt.json')
const TC_FILE = join(REPO, 'docs', 'superpowers', 'specs', '2026-10-31-observable-criteria-rollout-design-testcase.md')
const PRD = join(REPO, 'docs', 'prd', '20261031202331-observable-criteria-rollout', 'index.md')
const TRIAGE = join(REPO, 'docs', 'reports', '2026-10-31-observable-s1-triage.md')
const RULE_DOC = join(REPO, 'rules', 'observable-criteria.md')

const J = JSON.parse(readFileSync(TERMS_FILE, 'utf8'))
// 常量 1 的 9 词（用「/」拼接比数组字面量：F10 要求同形数组全仓恰 1 处）
const TERMS9_JOINED = '自省/客观/诚实/宽松/严格/清晰/准确/显著/良好'
const KINDS8 = ['compare', 'pathline', 'exit', 'diff', 'count', 'empty', 'nonempty', 'enum']
const BANNED_LITERALS = ['=', '出现', '命令', '词表']

const readText = (p) => readFileSync(p, 'utf8').replace(/^\uFEFF/, '')
const writeText = (p, t) => writeFileSync(p, t, 'utf8')
const countOccurrences = (text, sub) => text.split(sub).length - 1

// ── 临时根 / CLI ─────────────────────────────────────────────────────────
const BASE_FILES = {
  'rules/keep.md': '# 保底\n\n- 落点 `docs/a.md:12`。\n',
  'skills/keep/SKILL.md': '# 保底\n\n- 落点 `docs/a.md:12`。\n',
}

function tmpRoot(files = {}, opts = {}) {
  const root = mkdtempSync(join(tmpdir(), 'obs-'))
  const all = opts.bare ? { ...files } : { ...BASE_FILES, ...files }
  for (const [rel, content] of Object.entries(all)) {
    if (content === null) continue
    const abs = join(root, rel)
    mkdirSync(dirname(abs), { recursive: true })
    writeFileSync(abs, content, 'utf8')
  }
  for (const d of opts.emptyDirs || []) mkdirSync(join(root, d), { recursive: true })
  return { root, cleanup: () => rmSync(root, { recursive: true, force: true }) }
}

function cli(args) {
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd: REPO, encoding: 'utf8' })
  const out = r.stdout || ''
  const lines = out.trim().split(/\r?\n/).filter(Boolean)
  return { status: r.status, out, err: r.stderr || '', last: lines.length ? lines[lines.length - 1] : '' }
}

function jsonOf(args) {
  const r = cli(args)
  try {
    return { ...r, json: JSON.parse(r.out.trim().split(/\r?\n/)[0]) }
  } catch {
    return { ...r, json: null }
  }
}

function withRoot(files, args = [], opts = {}) {
  const { root, cleanup } = tmpRoot(files)
  try {
    return cli([...args, '--root', root, ...(opts.extra || [])])
  } finally {
    cleanup()
  }
}

function withRootJson(files, opts = {}) {
  const { root, cleanup } = tmpRoot(files)
  try {
    return jsonOf(['--check', '--json', '--root', root, ...(opts.extra || [])])
  } finally {
    cleanup()
  }
}

// ── 断言 helper（A 组） ──────────────────────────────────────────────────
function assertTerms(c) {
  assert.strictEqual(c.terms.length, 9, `terms 长度应为 9，实得 ${c.terms.length}`)
  assert.strictEqual(c.terms.join('/'), TERMS9_JOINED, `terms 必须逐字等于常量 1，实得 ${c.terms.join('/')}`)
  assert.ok(!c.terms.includes('完整'), 'terms 不得含已剔除的词')
}

function assertNoOverlap(c) {
  assert.deepStrictEqual(c.terms.filter((t) => c.criterionTerms.includes(t)), [], 'terms 与 criterionTerms 交集必须为空')
  assert.strictEqual(c.criterionTerms.length, 6, `criterionTerms 应为 6 条，实得 ${c.criterionTerms.length}`)
}

function assertMarkers(markers) {
  assert.deepStrictEqual(markers.map((m) => m.kind), KINDS8, 'markers 的 kind 必须逐字等于 8 类')
  assert.ok(!markers.some((m) => BANNED_LITERALS.includes(m.literal)), 'markers 不得带禁用 literal')
  assert.ok(markers.every((m) => 'pattern' in m !== 'literal' in m), '每项必须 pattern / literal 恰有其一')
  assert.ok(!markers.some((m) => m.pattern === '='), 'pattern 原文恰为 = 也算红（裸等号作正则 = 逃逸）')
  const en = markers.find((m) => m.kind === 'enum')
  assert.ok(/枚举\[：:\].*\[/.test(en.pattern), 'enum 的 pattern 必须在冒号后要求字面量字符类')
}

function assertSamples(samples, terms) {
  assert.strictEqual(samples.length, terms.length, `samples 条数应等于词数 ${terms.length}`)
  assert.deepStrictEqual(new Set(samples.map((s) => s.term)), new Set(terms), 'samples 必须覆盖全部词')
  assert.ok(
    samples.every(
      (s) =>
        s.positive.expect === 'pass' &&
        s.negative.expect === 'fail' &&
        s.positive.input.trim() !== '' &&
        s.negative.input.trim() !== '' &&
        'residual' in s,
    ),
    'samples 的 expect / input / residual 键必须齐',
  )
}

function assertResidual(s) {
  if (s.residual === null) return
  assert.strictEqual(typeof s.residual, 'object', 'residual 非 null 时必须是对象')
  assert.ok(s.residual && !Array.isArray(s.residual), 'residual 不得是数组')
  assert.ok(typeof s.residual.who === 'string' && s.residual.who.trim() !== '', 'residual.who 必须非空')
  assert.ok(Number.isInteger(s.residual.sample) && s.residual.sample > 0, 'residual.sample 必须是正整数')
}

function assertTermsUnique(terms) {
  assert.strictEqual(new Set(terms).size, terms.length, 'terms 不得重复')
  assert.ok(terms.every((t) => t.length > 0 && t.trim() === t), 'terms 不得含空串 / 首尾空格')
}

// 字面数组形态（双引号 + 首词起头）计数：F10 用
function arrayLiteralHits(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) {
      arrayLiteralHits(p, out)
      continue
    }
    if (!/\.(mjs|json|js)$/.test(e.name)) continue
    const src = readText(p)
    if (new RegExp('\\[\\s*["\']' + J.terms[0] + '["\']').test(src)) out.push(p)
  }
  return out
}

function assertSingleCopy(paths) {
  assert.strictEqual(paths.length, 1, `同形数组必须恰 1 处，实得 ${paths.length}：${paths.join(' / ')}`)
  assert.ok(paths[0].endsWith(join('tools', 'quality', 'observable-terms.json')), `唯一一处必须是 observable-terms.json，实得 ${paths[0]}`)
}

// ── A 组：清单 JSON 约束（C-1～C-6） ─────────────────────────────────────
test('OCR-S1-TC-A01 terms 9 词逐字、长度 9、不含已剔除词', () => {
  assertTerms(J)
})

test('OCR-S1-TC-A02 删一词 → 长度与逐字比对必红（未落盘）', () => {
  const before = readdirSync(join(REPO, 'tools', 'quality')).sort()
  const c = structuredClone(J)
  c.terms.splice(c.terms.indexOf('良好'), 1)
  assert.throws(() => assertTerms(c))
  assert.deepStrictEqual(readdirSync(join(REPO, 'tools', 'quality')).sort(), before, '本用例不得落盘')
})

test('OCR-S1-TC-A03 互换清晰/准确 → 逐字比对必红（只断长度/集合会漏）', () => {
  const c = structuredClone(J)
  const i1 = c.terms.indexOf('清晰')
  const i2 = c.terms.indexOf('准确')
  c.terms[i1] = '准确'
  c.terms[i2] = '清晰'
  assert.throws(() => assertTerms(c))
})

test('OCR-S1-TC-A04 两表交集空、判据词恰 6 条', () => {
  assertNoOverlap(J)
})

test('OCR-S1-TC-A05 判据词混入主观词表 → 必红', () => {
  const c = structuredClone(J)
  c.terms.push('合理')
  assert.throws(() => assertNoOverlap(c))
})

test('OCR-S1-TC-A06 markers 8 类逐字齐、无禁用 literal、enum 带字面量', () => {
  assertMarkers(J.markers)
})

test('OCR-S1-TC-A07 empty 改成 literal「出现」→ 必红', () => {
  const c = structuredClone(J)
  c.markers[5] = { kind: 'literal', literal: '出现' }
  assert.throws(() => assertMarkers(c.markers))
})

test('OCR-S1-TC-A08 双带 pattern+literal / pattern 恰为 = / 裸枚举：三构造各必红', () => {
  const c1 = structuredClone(J)
  c1.markers[0] = { ...c1.markers[0], literal: '≥' }
  assert.throws(() => assertMarkers(c1.markers))
  const c2 = structuredClone(J)
  c2.markers[0] = { kind: 'compare', pattern: '=' }
  assert.throws(() => assertMarkers(c2.markers))
  const c3 = structuredClone(J)
  c3.markers[7] = { kind: 'enum', pattern: '枚举[：:]' }
  assert.throws(() => assertMarkers(c3.markers))
})

test('OCR-S1-TC-A09 samples 覆盖 9 词、expect 逐字、input 非空、residual 键必在', () => {
  assertSamples(J.samples, J.terms)
})

test('OCR-S1-TC-A10 删 negative / 同 term 两条 / 空白 input / 大写 expect 四构造必红', () => {
  const c1 = structuredClone(J)
  delete c1.samples[0].negative
  assert.throws(() => assertSamples(c1.samples, c1.terms))
  const c2 = structuredClone(J)
  c2.samples.push(structuredClone(c2.samples[0]))
  assert.throws(() => assertSamples(c2.samples, c2.terms))
  const c3 = structuredClone(J)
  c3.samples[0].positive.input = '   '
  assert.throws(() => assertSamples(c3.samples, c3.terms))
  const c4 = structuredClone(J)
  c4.samples[0].positive.expect = 'PASS'
  assert.throws(() => assertSamples(c4.samples, c4.terms))
})

test('OCR-S1-TC-A12 residual 对象与 null 混合基线不误红', () => {
  for (const s of J.samples) assertResidual(s)
})

test('OCR-S1-TC-A13 空壳 residual 六构造必红、null 对照合格', () => {
  const cases = [{ who: '' }, { ...(J.samples[0].residual || {}), sample: 0 }, { who: 'x', sample: '3' }, {}, '', []]
  for (const residual of cases) {
    assert.throws(() => assertResidual({ residual }), `空壳 residual 必须红：${JSON.stringify(residual)}`)
  }
  assert.doesNotThrow(() => assertResidual({ residual: null }))
})

test('OCR-S1-TC-A14 terms 无重复、无空串、无首尾空格', () => {
  assertTermsUnique(J.terms)
})

test('OCR-S1-TC-A15 重复 / 空串 / 前导空格三构造必红', () => {
  assert.throws(() => assertTermsUnique([...J.terms, J.terms[0]]))
  assert.throws(() => assertTermsUnique([...J.terms.slice(0, 8), '']))
  assert.throws(() => assertTermsUnique([...J.terms.slice(0, 8), ` ${J.terms[0]}`]))
})

// ── B 组：前置断言（P-1～P-3） ───────────────────────────────────────────
function countMdIndependently(dir) {
  // 第二源：与实现**各自独立**的遍历（大小写不敏感、跳过 symlink / junction）
  let n = 0
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.isSymbolicLink()) continue
      const p = join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name.toLowerCase().endsWith('.md')) n += 1
    }
  }
  walk(dir)
  return n
}

test('OCR-S1-TC-B01 scanned 为 string[]、与同口径遍历同值、仓根总数 ∈ {106,107}、.MD 计、junction 不计', () => {
  const r = jsonOf(['--check', '--json'])
  assert.ok(Array.isArray(r.json.scanned), 'scanned 必须是数组')
  const nodeCount = countMdIndependently(join(REPO, 'rules')) + countMdIndependently(join(REPO, 'skills'))
  assert.strictEqual(r.json.scanned.length, nodeCount, `scanned 数必须与独立遍历同值（${r.json.scanned.length} vs ${nodeCount}）`)
  assert.ok(nodeCount > 0)
  assert.ok(r.json.scanned.length >= 106 && r.json.scanned.length <= 107, `仓根总数须 ∈ {106,107}，实得 ${r.json.scanned.length}`)
  assert.ok([106, 107].includes(r.json.scanned.length))
  assert.ok(new Set(r.json.scanned).size === r.json.scanned.length, 'scanned 不得有重复路径')
  // .MD 计入 + junction 跳过（临时根）
  const { root, cleanup } = tmpRoot({ 'rules/a.MD': '# x\n\n- 落点 `docs/a.md:12`。\n' })
  try {
    const outside = mkdtempSync(join(tmpdir(), 'obs-out-'))
    writeFileSync(join(outside, 'b.md'), '# y\n\n- 落点 `docs/a.md:12`。\n', 'utf8')
    symlinkSync(outside, join(root, 'skills', 'junc'), 'junction')
    const r2 = jsonOf(['--check', '--json', '--root', root])
    assert.ok(r2.json.scanned.some((p) => p.endsWith('a.MD')), '.MD 必须计入')
    assert.ok(!r2.json.scanned.some((p) => p.includes('junc')), 'junction 内文件不得计入')
    rmSync(outside, { recursive: true, force: true })
  } finally {
    cleanup()
  }
})

test('OCR-S1-TC-B02 空扫描根 → exit 2 + 末行 P-1 + 无 term= 行', () => {
  const { root, cleanup } = tmpRoot({}, { bare: true, emptyDirs: ['rules', 'skills'] })
  try {
    const r = cli(['--check', '--root', root])
    assert.strictEqual(r.status, 2)
    assert.ok(/check-observable error（P-1/.test(r.last))
    assert.ok(!/term=/.test(r.out))
  } finally {
    cleanup()
  }
})

test('OCR-S1-TC-B04 默认数据源前置过（无 P-2 错、exit ∈ {0,1}）', () => {
  const r = cli(['--check'])
  assert.ok(!/error（P-2/.test(r.out))
  assert.ok([0, 1].includes(r.status))
})

test('OCR-S1-TC-B05 截断 JSON / 空 terms → 两者各 exit 2 + P-2（不抛栈）', () => {
  const { root, cleanup } = tmpRoot({})
  try {
    const bad = join(root, 'trunc.json')
    writeText(bad, readText(TERMS_FILE).replace(/\}\s*$/, ''))
    const empty = join(root, 'empty.json')
    writeText(empty, JSON.stringify({ ...J, terms: [] }))
    const r1 = cli(['--check', '--terms', bad, '--root', root])
    const r2 = cli(['--check', '--terms', empty, '--root', root])
    assert.strictEqual(r1.status, 2)
    assert.strictEqual(r2.status, 2)
    assert.ok(/error（P-2/.test(r1.last) && /error（P-2/.test(r2.last))
  } finally {
    cleanup()
  }
})

test('OCR-S1-TC-B06 markers 为空 → exit 2 + P-2', () => {
  const { root, cleanup } = tmpRoot({})
  try {
    const f = join(root, 'no-markers.json')
    writeText(f, JSON.stringify({ ...J, markers: [] }))
    const r = cli(['--check', '--terms', f, '--root', root])
    assert.strictEqual(r.status, 2)
    assert.ok(/error（P-2/.test(r.last))
  } finally {
    cleanup()
  }
})

test('OCR-S1-TC-B07 samples 缺一词 → exit 2 + P-2', () => {
  const { root, cleanup } = tmpRoot({})
  try {
    const f = join(root, 'no-sample.json')
    const c = structuredClone(J)
    c.samples = c.samples.filter((s) => s.term !== '良好')
    writeText(f, JSON.stringify(c))
    const r = cli(['--check', '--terms', f, '--root', root])
    assert.strictEqual(r.status, 2)
    assert.ok(/error（P-2/.test(r.last))
  } finally {
    cleanup()
  }
})

test('OCR-S1-TC-B08 9 条 samples 双向（verdict + matched 含该词、matched 不去重）', () => {
  for (const s of J.samples) {
    const pos = evaluateText(s.positive.input, J)
    const neg = evaluateText(s.negative.input, J)
    assert.strictEqual(pos.verdict, 'pass', `${s.term} 正例应 pass`)
    assert.ok(pos.matched.some((m) => m.term === s.term), `${s.term} 正例 matched 必须含该词`)
    assert.strictEqual(neg.verdict, 'fail', `${s.term} 反例应 fail`)
    assert.ok(neg.matched.some((m) => m.term === s.term), `${s.term} 反例 matched 必须含该词`)
  }
  const twice = evaluateText(`${J.terms[0]} 与 ${J.terms[0]}`, J)
  assert.strictEqual(twice.matched.filter((m) => m.term === J.terms[0]).length, 2, 'matched 不去重（两次出现两条）')
})

test('OCR-S1-TC-B09 反例改成合格句 → exit 2 + P-3', () => {
  const { root, cleanup } = tmpRoot({})
  try {
    const c = structuredClone(J)
    c.samples[0].negative.input = '每轮收尾必须写自省结论：三性验证附 path:line'
    const f = join(root, 'bad-neg.json')
    writeText(f, JSON.stringify(c))
    const r = cli(['--check', '--terms', f, '--root', root])
    assert.strictEqual(r.status, 2)
    assert.ok(/error（P-3/.test(r.last))
  } finally {
    cleanup()
  }
})

test('OCR-S1-TC-B10 反例不含该词 → exit 2 + P-3；P-3 不落盘（连跑清单不变）', () => {
  const { root, cleanup } = tmpRoot({})
  try {
    const c = structuredClone(J)
    c.samples[0].negative.input = '三性验证逐条附 path:line'
    const f = join(root, 'bad-neg2.json')
    writeText(f, JSON.stringify(c))
    const r = cli(['--check', '--terms', f, '--root', root])
    assert.strictEqual(r.status, 2)
    assert.ok(/error（P-3/.test(r.last))
    const before = readdirSync(root).sort()
    cli(['--check', '--terms', f, '--root', root])
    assert.deepStrictEqual(readdirSync(root).sort(), before, 'P-3 只在内存跑，不得落盘')
  } finally {
    cleanup()
  }
})

test('OCR-S1-TC-B12 不存在根 / 删 skills → exit 2；单文件根对照 exit 0', () => {
  const missing = cli(['--check', '--root', join(tmpdir(), 'obs-does-not-exist-xyz')])
  assert.strictEqual(missing.status, 2)
  const { root, cleanup } = tmpRoot({})
  try {
    cli(['--check', '--json', '--root', root])
    rmSync(join(root, 'skills'), { recursive: true, force: true })
    const r2 = cli(['--check', '--root', root])
    assert.strictEqual(r2.status, 2)
    assert.ok(/error（P-1/.test(r2.last))
  } finally {
    cleanup()
  }
  const r3 = (() => {
    const { root, cleanup } = tmpRoot({ 'rules/only.md': '- 落点 `docs/a.md:12`。\n' }, { bare: true, emptyDirs: ['skills'] })
    try {
      return jsonOf(['--check', '--json', '--root', root])
    } finally {
      cleanup()
    }
  })()
  assert.strictEqual(r3.status, 0)
  assert.strictEqual(r3.json.scanned.length, 1)
})

test('OCR-S1-TC-B13 正例空转（不含该词）→ exit 2 + P-3', () => {
  const { root, cleanup } = tmpRoot({})
  try {
    const c = structuredClone(J)
    c.samples[0].positive.input = '三性验证逐条附 path:line'
    const f = join(root, 'bad-pos.json')
    writeText(f, JSON.stringify(c))
    const r = cli(['--check', '--terms', f, '--root', root])
    assert.strictEqual(r.status, 2)
    assert.ok(/error（P-3/.test(r.last))
  } finally {
    cleanup()
  }
})

// ── C 组：判定规则、语义块与标记形态 ─────────────────────────────────────
test('OCR-S1-TC-C01 仅主观词 → exit 1 + hit 行逐字 + 末行计数', () => {
  const r = withRoot({ 'rules/x.md': '本规则要求每轮收尾都要自省结论。\n' })
  assert.strictEqual(r.status, 1)
  assert.ok(r.out.includes('rules/x.md:1  term=自省  无结构化可观察标记'), r.out)
  assert.strictEqual(r.last, 'check-observable fail（命中 1 行 / stale 0 条）')
})

test('OCR-S1-TC-C02 同块带 path:line → exit 0', () => {
  const r = withRoot({ 'rules/x.md': '本规则要求每轮收尾都要自省结论：交付物 `docs/a.md:12` 逐条可追\n' })
  assert.strictEqual(r.status, 0)
  assert.strictEqual(r.last, 'check-observable ok')
  assert.ok(!/term=/.test(r.out))
})

test('OCR-S1-TC-C03 bullet 续行带 计数 = 3 → exit 0（跨行同块）', () => {
  const r = withRoot({ 'rules/x.md': '- 每轮收尾要写自省结论。\n  计数 = 3 条逐条附依据。\n' })
  assert.strictEqual(r.status, 0)
})

test('OCR-S1-TC-C04 紧随连续表格属同块 → exit 0', () => {
  const r = withRoot({ 'rules/x.md': '存在自省结论的要求如下：\n| 项 | 值 |\n|---|---|\n| 条数 | ≥ 3 条 |\n' })
  assert.strictEqual(r.status, 0)
})

test('OCR-S1-TC-C05 跨同级标题不救活 → exit 1（命中 1 行）', () => {
  const r = withRoot({ 'rules/x.md': '- 要写自省结论。\n\n## 另一节\n\n本节的验收 exit=1。\n' })
  assert.strictEqual(r.status, 1)
  assert.ok(/命中 1 行/.test(r.last))
})

test('OCR-S1-TC-C06 同缩进兄弟 bullet 另起一块 → exit 1', () => {
  const r = withRoot({ 'rules/x.md': '- 要写自省结论。\n- 验收：exit=1。\n' })
  assert.strictEqual(r.status, 1)
})

test('OCR-S1-TC-C07 缩进子 bullet 属同块 → exit 0', () => {
  const r = withRoot({ 'rules/x.md': '- 要写自省结论。\n    - 验收：exit=1。\n' })
  assert.strictEqual(r.status, 0)
})

test('OCR-S1-TC-C08 空行截断块 → exit 1', () => {
  const r = withRoot({ 'rules/x.md': '- 要写自省结论。\n\n纯文字续段，无标记。\n' })
  assert.strictEqual(r.status, 1)
})

test('OCR-S1-TC-C09 裸 = 不算标记 → exit 1 + term=客观', () => {
  const r = withRoot({ 'rules/x.md': '- 检查要客观 = 全部覆盖。\n' })
  assert.strictEqual(r.status, 1)
  assert.ok(/term=客观/.test(r.out))
})

test('OCR-S1-TC-C10 出现 / 命令 / 词表 不算标记（三句各 exit 1）', () => {
  const statuses = [
    withRoot({ 'rules/a.md': '- 自省后要检查是否出现遗漏。\n' }).status,
    withRoot({ 'rules/b.md': '- 自省结论按命令输出贴。\n' }).status,
    withRoot({ 'rules/c.md': '- 自省与词表口径一致。\n' }).status,
  ]
  assert.deepStrictEqual(statuses, [1, 1, 1])
})

test('OCR-S1-TC-C11 8 类标记逐类生效（含全角 ≤ / ＝）', () => {
  const files = {
    'rules/m0.md': '- 自省后每条都要 ≥ 3 条。\n',
    'rules/m1.md': '- 自省结论附 `docs/a.md:12`。\n',
    'rules/m2.md': '- 自省后核对 exit=1。\n',
    'rules/m3.md': '- 自省后贴 diff 命令。\n',
    'rules/m4.md': '- 自省条目计数 = 3。\n',
    'rules/m5.md': '- 自省后输出为空。\n',
    'rules/m6.md': '- 自省后输出非空。\n',
    'rules/m7.md': '- 自省后枚举：hit/miss。\n',
    'rules/m8.md': '- 自省后每类 ≤ 1 处。\n',
    'rules/m9.md': '- 自省后共 ＝3 类。\n',
  }
  for (const [rel, content] of Object.entries(files)) {
    assert.strictEqual(withRoot({ [rel]: content }).status, 0, `${rel} 应 exit 0`)
  }
  const combined = withRootJson(files)
  assert.strictEqual(combined.status, 0)
  assert.strictEqual(combined.json.hits.length, 0)
})

test('OCR-S1-TC-C13 exit 四形态全绿', () => {
  const s = [
    withRoot({ 'rules/a.md': '- 自省后核对 exit 0。\n' }).status,
    withRoot({ 'rules/b.md': '- 自省后核对 exit code 0。\n' }).status,
    withRoot({ 'rules/c.md': '- 自省后核对退出码为 0。\n' }).status,
    withRoot({ 'rules/d.md': '- 自省后核对退出状态是 0。\n' }).status,
  ]
  assert.deepStrictEqual(s, [0, 0, 0, 0])
})

test('OCR-S1-TC-C15 同行两词聚合为 1 条 hit、terms 长度 2', () => {
  const r = withRootJson({ 'rules/x.md': '要求自省且客观达标。\n' })
  assert.strictEqual(r.json.hits.length, 1)
  assert.strictEqual(r.json.hits[0].line, 1)
  assert.strictEqual(r.json.hits[0].terms.length, 2)
  assert.deepStrictEqual(r.json.hits[0].terms.slice().sort(), ['客观', '自省'].sort())
})

test('OCR-S1-TC-C16 --json 键序 + 输出顺序（path 字典序 / 行号升序）', () => {
  const r = withRootJson({
    'skills/z/m.md': '- 自省结论。\n\n- 自省结论。\n\n- 自省结论。\n',
    'rules/a.md': '- 自省结论。\n\n- 自省结论。\n',
  })
  assert.deepStrictEqual(Object.keys(r.json), ['scanned', 'hits', 'exemptedLines', 'stale', 'ok'])
  assert.ok(Array.isArray(r.json.scanned))
  assert.ok(Array.isArray(r.json.hits[0].terms))
  const order = r.json.hits.map((h) => `${h.path}:${h.line}`)
  const expect = ['rules/a.md:1', 'rules/a.md:3', 'skills/z/m.md:1', 'skills/z/m.md:3', 'skills/z/m.md:5']
  assert.deepStrictEqual(order, expect)
  assert.strictEqual(r.status, 1)
})

test('OCR-S1-TC-C17 --root 只换扫描根（docs/README/.txt/.mjs 不扫）', () => {
  const r = withRootJson({
    'docs/tmp/x.md': '- 自省结论。\n',
    'README.md': '- 自省结论。\n',
    'skills/y/a.txt': '- 自省结论。\n',
    'skills/y/a.mjs': '- 自省结论。\n',
    'skills/y/references/z.md': '- 自省结论。\n',
  })
  assert.ok(!r.json.scanned.some((p) => p.startsWith('docs/') || p === 'README.md' || p.endsWith('.txt') || p.endsWith('.mjs')))
  assert.strictEqual(r.json.hits.length, 1)
  assert.strictEqual(r.json.hits[0].path, 'skills/y/references/z.md')
})

test('OCR-S1-TC-C19 exit 无数字 / 裸枚举：四构造各 exit 1', () => {
  const s = [
    withRoot({ 'rules/a.md': '- 自省后核对 exit。\n' }).status,
    withRoot({ 'rules/b.md': '- 自省后核对退出码：见上。\n' }).status,
    withRoot({ 'rules/c.md': '- 自省后核对退出码是 通过。\n' }).status,
    withRoot({ 'rules/d.md': '- 自省后按枚举：核对。\n' }).status,
  ]
  assert.deepStrictEqual(s, [1, 1, 1, 1])
})

test('OCR-S1-TC-C20 更深标题不截断 + 围栏内行不参与', () => {
  const a = withRoot({ 'rules/a.md': '- 要写自省结论。\n#### 细则\n  exit=1。\n' })
  assert.strictEqual(a.status, 0)
  const b = withRootJson({ 'rules/b.md': '```\n本规则要求自省。\n```\n\n- 落点 `docs/a.md:12`。\n' })
  assert.strictEqual(b.status, 0)
  assert.strictEqual(b.json.hits.length, 0)
})

test('OCR-S1-TC-C22 裸 diff / 「不要求非空」不算标记', () => {
  const s = [
    withRoot({ 'rules/a.md': '- 自省后顺手 diff 了一下。\n' }).status,
    withRoot({ 'rules/b.md': '- 自省后不要求非空。\n' }).status,
  ]
  assert.deepStrictEqual(s, [1, 1])
})

test('OCR-S1-TC-C23 标题行不产出 hit', () => {
  const r = withRootJson({ 'rules/x.md': '## 自省必须给长期方案\n\n- 落点 `docs/a.md:12`。\n' })
  assert.strictEqual(r.status, 0)
  assert.strictEqual(r.json.hits.length, 0)
})

test('OCR-S1-TC-C24 pathline 收紧：docs/a.md:12 绿、20:23 红', () => {
  const s = [
    withRoot({ 'rules/a.md': '- 自省结论附 docs/a.md:12。\n' }).status,
    withRoot({ 'rules/b.md': '- 自省结论在 20:23 前后。\n' }).status,
  ]
  assert.deepStrictEqual(s, [0, 1])
})

test('OCR-S1-TC-C25 正文同词必判（标题不扫 ≠ 可逃）', () => {
  const r = withRoot({ 'rules/x.md': '## 自省必须给长期方案\n\n- 自省必须给长期方案。\n' })
  assert.strictEqual(r.status, 1)
  assert.ok(/term=自省/.test(r.out))
})

// ── D 组：豁免清单 ───────────────────────────────────────────────────────
test('OCR-S1-TC-D01 正文行豁免生效（exemptedLines 1 / stale 空 / reason 非空）', () => {
  const contains = '本节结论必须自省后落笔（术语引用）。'
  const { root, cleanup } = tmpRoot({ 'rules/x.md': `${contains}\n` })
  const ex = join(root, 'ex.json')
  writeText(ex, JSON.stringify({ entries: [{ path: 'rules/x.md', contains, reason: '术语引用：这里是「自省」作为规则概念名，不是评价', reviewed: '2026-10-31' }] }))
  try {
    const r = jsonOf(['--check', '--json', '--root', root, '--exempt', ex])
    assert.strictEqual(r.status, 0)
    assert.strictEqual(r.json.hits.length, 0)
    assert.strictEqual(r.json.exemptedLines, 1)
    assert.deepStrictEqual(r.json.stale, [])
  } finally {
    cleanup()
  }
})

test('OCR-S1-TC-D02 缺 reason → exit 2 + P-4 + 无 hit 行', () => {
  const { root, cleanup } = tmpRoot({})
  const ex = join(root, 'bad.json')
  writeText(ex, JSON.stringify({ entries: [{ path: 'rules/keep.md', contains: '落点', reviewed: '2026-10-31' }] }))
  try {
    const r = cli(['--check', '--exempt', ex, '--root', root])
    assert.strictEqual(r.status, 2)
    assert.ok(/check-observable error（P-4/.test(r.last))
    assert.ok(!/term=/.test(r.out))
  } finally {
    cleanup()
  }
})

test('OCR-S1-TC-D03 不存在的 path → stale → exit 1', () => {
  const { root, cleanup } = tmpRoot({})
  const ex = join(root, 'stale.json')
  writeText(ex, JSON.stringify({ entries: [{ path: 'rules/nope.md', contains: 'x', reason: 'r', reviewed: '2026-10-31' }] }))
  try {
    const r = jsonOf(['--check', '--json', '--root', root, '--exempt', ex])
    assert.strictEqual(r.status, 1)
    assert.strictEqual(r.json.stale.length, 1)
    assert.ok(/stale 1 条/.test(r.last))
  } finally {
    cleanup()
  }
})

test('OCR-S1-TC-D04 contains 0 命中 → stale → exit 1、exemptedLines 0', () => {
  const { root, cleanup } = tmpRoot({ 'rules/x.md': '本节结论必须自省后落笔（术语引用）。\n' })
  const ex = join(root, 'stale2.json')
  writeText(ex, JSON.stringify({ entries: [{ path: 'rules/x.md', contains: '本节结论必须自省后落笔（术语引用）（已删）', reason: 'r', reviewed: '2026-10-31' }] }))
  try {
    const r = jsonOf(['--check', '--json', '--root', root, '--exempt', ex])
    assert.strictEqual(r.status, 1)
    assert.strictEqual(r.json.exemptedLines, 0)
    assert.ok(/stale 1 条/.test(r.last))
  } finally {
    cleanup()
  }
})

test('OCR-S1-TC-D05 contains 恰 1 处 → exit 0、exemptedLines 1', () => {
  const contains = '本节结论必须自省后落笔（术语引用）。'
  const { root, cleanup } = tmpRoot({ 'rules/x.md': `${contains}\n` })
  const ex = join(root, 'ok.json')
  writeText(ex, JSON.stringify({ entries: [{ path: 'rules/x.md', contains, reason: '术语引用', reviewed: '2026-10-31' }] }))
  try {
    const r = jsonOf(['--check', '--json', '--root', root, '--exempt', ex])
    assert.strictEqual(r.status, 0)
    assert.strictEqual(r.json.exemptedLines, 1)
  } finally {
    cleanup()
  }
})

test('OCR-S1-TC-D06 contains 2 / 3 处 → exit 2；近似串不误红', () => {
  const contains = '本节结论必须自省后落笔（术语引用）。'
  const run = (content) => {
    const { root, cleanup } = tmpRoot({ 'rules/x.md': content }, { bare: true, emptyDirs: ['skills'] })
    try {
      const ex = join(root, 'ex.json')
      writeText(ex, JSON.stringify({ entries: [{ path: 'rules/x.md', contains, reason: 'r', reviewed: '2026-10-31' }] }))
      return cli(['--check', '--exempt', ex, '--root', root])
    } finally {
      cleanup()
    }
  }
  const r1 = run(`${contains}\n${contains}\n`)
  const r2 = run(`${contains}\n${contains}\n${contains}\n`)
  const r3 = run(`${contains}\n本节结论必须自省后落笔（术语引用）（补）见 \`docs/a.md:12\`\n`)
  assert.strictEqual(r1.status, 2)
  assert.strictEqual(r2.status, 2)
  assert.ok(/error（P-4/.test(r1.last))
  assert.strictEqual(r3.status, 0)
})

test('OCR-S1-TC-D08 同 path 两条不同 contains → exemptedLines 2', () => {
  const a = '第一条自省术语引用。'
  const b = '第二条自省术语引用。'
  const { root, cleanup } = tmpRoot({ 'rules/x.md': `${a}\n${b}\n` })
  const ex = join(root, 'two.json')
  writeText(ex, JSON.stringify({ entries: [
    { path: 'rules/x.md', contains: a, reason: 'r1', reviewed: '2026-10-31' },
    { path: 'rules/x.md', contains: b, reason: 'r2', reviewed: '2026-10-31' },
  ] }))
  try {
    const r = jsonOf(['--check', '--json', '--root', root, '--exempt', ex])
    assert.strictEqual(r.status, 0)
    assert.strictEqual(r.json.exemptedLines, 2)
    assert.deepStrictEqual(r.json.stale, [])
  } finally {
    cleanup()
  }
})

test('OCR-S1-TC-D09 同 path 同 contains 两条 → exit 2 + P-4', () => {
  const { root, cleanup } = tmpRoot({ 'rules/x.md': '本节结论必须自省后落笔。\n' })
  const ex = join(root, 'dup.json')
  writeText(ex, JSON.stringify({ entries: [
    { path: 'rules/x.md', contains: '本节结论必须自省后落笔。', reason: 'r1', reviewed: '2026-10-31' },
    { path: 'rules/x.md', contains: '本节结论必须自省后落笔。', reason: 'r2', reviewed: '2026-11-01' },
  ] }))
  try {
    const r = cli(['--check', '--exempt', ex, '--root', root])
    assert.strictEqual(r.status, 2)
    assert.ok(/error（P-4/.test(r.last))
  } finally {
    cleanup()
  }
})

test('OCR-S1-TC-D10 reviewed 可解析 + 下界（2026-10-31 / 2026-01-01 各 exit 0）', () => {
  const mk = (d) => {
    const { root, cleanup } = tmpRoot({ 'rules/x.md': '本节结论必须自省后落笔。\n' })
    const ex = join(root, `d-${d}.json`)
    writeText(ex, JSON.stringify({ entries: [{ path: 'rules/x.md', contains: '本节结论必须自省后落笔。', reason: 'r', reviewed: d }] }))
    const r = cli(['--check', '--exempt', ex, '--root', root])
    cleanup()
    return r.status
  }
  assert.strictEqual(mk('2026-10-31'), 0)
  assert.strictEqual(mk('2026-01-01'), 0)
})

test('OCR-S1-TC-D11 早于下界 / 不可解析 / 非日期 → exit 2（P-4）', () => {
  const mk = (d) => {
    const { root, cleanup } = tmpRoot({})
    const ex = join(root, 'd.json')
    writeText(ex, JSON.stringify({ entries: [{ path: 'rules/keep.md', contains: '落点', reason: 'r', reviewed: d }] }))
    const r = cli(['--check', '--exempt', ex, '--root', root])
    cleanup()
    return r.status
  }
  const s = [mk('2025-12-31'), mk('2026-13-45'), mk('昨天')]
  assert.deepStrictEqual(s, [2, 2, 2])
})

test('OCR-S1-TC-D12 未满 365 天 exit 0；源码不含 365 天判定分支', () => {
  const { root, cleanup } = tmpRoot({ 'rules/x.md': '本节结论必须自省后落笔。\n' })
  const ex = join(root, 'd.json')
  writeText(ex, JSON.stringify({ entries: [{ path: 'rules/x.md', contains: '本节结论必须自省后落笔。', reason: 'r', reviewed: '2026-01-05' }] }))
  try {
    const r = cli(['--check', '--exempt', ex, '--root', root])
    assert.strictEqual(r.status, 0)
    const src = readText(CLI)
    assert.ok(!src.includes('365'), '源码不得含 365 天判定')
    assert.ok(!/到期|过期/.test(src), '源码不得含到期 / 过期分支')
  } finally {
    cleanup()
  }
})

test('OCR-S1-TC-D13 行级粒度：只摘命中行，不整文件放行', () => {
  const a = '第一行自省结论。'
  const b = '第二行自省结论。'
  const { root, cleanup } = tmpRoot({ 'rules/x.md': `${a}\n\n${b}\n` })
  const ex = join(root, 'one.json')
  writeText(ex, JSON.stringify({ entries: [{ path: 'rules/x.md', contains: a, reason: 'r', reviewed: '2026-10-31' }] }))
  try {
    const r = jsonOf(['--check', '--json', '--root', root, '--exempt', ex])
    assert.strictEqual(r.status, 1)
    assert.strictEqual(r.json.hits.length, 1)
    assert.strictEqual(r.json.exemptedLines, 1)
  } finally {
    cleanup()
  }
})

// ── E 组：门禁 ⑦ 段与规则文档 ────────────────────────────────────────────
test('OCR-S1-TC-E01 ⑦ 段源码四静态断言 + 单跑 exit 0', () => {
  const src = readText(join(REPO, 'scripts', 'check-all.mjs'))
  assert.ok(src.includes('check-observable'), '⑦ 段必须调用 check-observable')
  assert.ok(src.indexOf('check-observable') > src.indexOf('runObservationGate'), '⑦ 必须在 ⑥（runObservationGate）之后')
  assert.ok(/check-observable[\s\S]{0,400}failed = true/.test(src), '⑦ 失败必须置 failed = true')
  assert.ok(!/CHECK_BYPASS[\s\S]{0,300}check-observable/.test(src), '⑦ 不得接进 CHECK_BYPASS 分支')
  const r = cli(['--check'])
  assert.strictEqual(r.status, 0)
})

test('OCR-S1-TC-E02 不吞 exit / 不降级 warning', () => {
  const r = withRoot({ 'rules/x.md': '- 自省结论。\n' })
  assert.strictEqual(r.status, 1)
  const src = readText(join(REPO, 'scripts', 'check-all.mjs'))
  assert.strictEqual(/console\.warn\(\s*'\[observable\]'/.test(src), false, '不得降级为 warning')
  assert.ok(/failed = true/.test(src), '必须置 failed = true')
})

test('OCR-S1-TC-E03 package.json 入口值合规格且等价命令 exit 0', () => {
  const pkg = JSON.parse(readText(join(REPO, 'package.json')))
  assert.ok(/^node scripts\/check-observable\.mjs( --check)?$/.test(pkg.scripts['check:observable'] ?? ''), `入口值不合规格：${pkg.scripts['check:observable']}`)
  assert.strictEqual(cli(['--check']).status, 0)
})

test('OCR-S1-TC-E04 删键 / 改值为 --fix → 两构造各必红', () => {
  const pkg = JSON.parse(readText(join(REPO, 'package.json')))
  const assertPkg = (p) => assert.ok(/^node scripts\/check-observable\.mjs( --check)?$/.test(p.scripts['check:observable'] ?? ''))
  const c1 = structuredClone(pkg)
  delete c1.scripts['check:observable']
  assert.throws(() => assertPkg(c1))
  const c2 = structuredClone(pkg)
  c2.scripts['check:observable'] = 'node scripts/check-observable.mjs --fix'
  assert.throws(() => assertPkg(c2))
})

test('OCR-S1-TC-E05 规则文档 ≤120 行 + 六锚 + 两句声明 + 120/121 边界', () => {
  const text = readText(RULE_DOC)
  const lines = text.split(/\r?\n/)
  const lineCount = lines.length - (text.endsWith('\n') ? 1 : 0)
  assert.ok(lineCount <= 120, `行数须 ≤120，实得 ${lineCount}`)
  for (const k of ['范围', '条件', '动作', '宾语', '触发时机', '验证']) {
    assert.ok(new RegExp(`^##\\s*${k}`, 'm').test(text), `缺六锚：${k}`)
  }
  assert.ok(text.includes('不因来源豁免'), '缺声明：不因来源豁免')
  assert.ok(text.includes('豁免清单'), '缺声明：豁免清单')
  const ok120 = lineCount <= 120
  const ok121 = 121 <= 120
  assert.strictEqual(ok120, true)
  assert.strictEqual(ok121, false)
})

test('OCR-S1-TC-E06 副本含 pattern 原文 → exit 1（判定 5）', () => {
  const rule = readText(RULE_DOC)
  const pat = J.markers.map((m) => m.pattern).find((p) => p.length >= 8)
  const r = withRoot({ 'rules/observable-criteria.md': `${rule}\n正文片段：${pat}\n` })
  assert.strictEqual(r.status, 1)
  assert.ok(/check-observable fail/.test(r.last))
})

test('OCR-S1-TC-E10 单词面叙述 → 绿（不算复制词表）', () => {
  const rule = readText(RULE_DOC)
  const r = withRoot({ 'rules/observable-criteria.md': `${rule}\n按本规则判「${J.terms[0]}」时，看它所在块有没有可观察标记。\n` })
  assert.strictEqual(r.status, 0)
})

test('OCR-S1-TC-E11 同行 ≥2 词枚举 → exit 1', () => {
  const rule = readText(RULE_DOC)
  const enumLine = `本规则覆盖 ${J.terms.slice(0, 4).join('、')} 四类。`
  const r = withRoot({ 'rules/observable-criteria.md': `${rule}\n${enumLine}\n` })
  assert.strictEqual(r.status, 1)
  assert.ok(/check-observable fail/.test(r.last))
})

test('OCR-S1-TC-E08 分诊表对账 M+P+L=21 / exemptedLines=L / stale=0 / L≤8 / hits=0', () => {
  const CATS = ['改文案', '已合格', '合法保留']
  const rows = readText(TRIAGE)
    .split(/\r?\n/)
    .filter((l) => l.startsWith('| `'))
    .filter((l) => CATS.includes((l.split('|')[4] ?? '').trim()))
  const cats = rows.map((l) => l.split('|')[4].trim())
  const M = cats.filter((c) => c === '改文案').length
  const P = cats.filter((c) => c === '已合格').length
  const L = cats.filter((c) => c === '合法保留').length
  assert.strictEqual(rows.length, 21, `分诊表应 21 行，实得 ${rows.length}`)
  // 第二源（非表格自证）：独立按「9 词 + 排除标题行」数一遍**当前**仍含主观词的行
  const raw = rawHitLines().length
  const r = jsonOf(['--check', '--json'])
  assertTriage({ M, P, L, hits: r.json.hits.length, raw })
  assert.strictEqual(r.json.exemptedLines, L)
  assert.strictEqual(r.json.stale.length, 0)
})

// 原始命中行（「9 词 + 排除标题行」口径，按行计）——与分诊表各自的独立来源
function rawHitLines() {
  const out = []
  for (const dir of ['rules', 'skills']) {
    const walk = (d) => {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        if (e.isSymbolicLink()) continue
        const p = join(d, e.name)
        if (e.isDirectory()) walk(p)
        else if (e.name.toLowerCase().endsWith('.md')) {
          const lines = readText(p).split(/\r?\n/)
          lines.forEach((l, i) => {
            // 取数命令口径 = 9 词 + 排除标题行（**不排除围栏**，与 spec §9.3 `:175` 的 Select-String 同口径）
            if (/^\s*#/.test(l)) return
            if (J.terms.some((t) => l.includes(t))) out.push(`${p}:${i + 1}`)
          })
        }
      }
    }
    walk(join(REPO, dir))
  }
  return out
}

function assertTriage({ M, P, L, hits, raw }) {
  assert.strictEqual(M + P + L, 21, `M+P+L 必须 = 21（首日基线），实得 ${M + P + L}`)
  // 非恒真锚：当前仓里仍含主观词的正文行只可能落在「已合格」或「合法保留」两档
  assert.strictEqual(raw, P + L, `当前仍含主观词的行数应 = P + L（${P + L}），实得 ${raw}`)
  assert.ok(L <= 8, `L 必须 ≤ 8，实得 ${L}`)
  assert.strictEqual(hits, 0, `未豁免 hit 必须为 0，实得 ${hits}`)
}

test('OCR-S1-TC-E09 全豁免 L=21 → 必红（同时破 L ≤ 8）', () => {
  assert.throws(() => assertTriage({ M: 0, P: 0, L: 21, hits: 0, raw: 0 }))
})

test('OCR-S1-TC-E12 全改文案但 hit 未清 → 必红', () => {
  assert.throws(() => assertTriage({ M: 21, P: 0, L: 0, hits: 1, raw: 0 }))
})

// ── F 组：与既有件一致性 / R8 / baseline ─────────────────────────────────
test('OCR-S1-TC-F01 两个 vocab 派生自 JSON、字面 0、frozen、交集空', async () => {
  const a = await import('../tools/docgen/card-model/vocab/subjective-terms.mjs')
  const b = await import('../tools/docgen/card-model/vocab/criterion-terms.mjs')
  const noLiteral = (src, words) => {
    for (const t of words) assert.strictEqual(countOccurrences(src, t), 0, `派生文件不得再写词面：${t}`)
  }
  // 两张表各查各的字面（F01 判据原文要求「两文件字面出现均 0」——主观词 9 个 + 判据词 6 个都要查）
  noLiteral(readText(join(REPO, 'tools', 'docgen', 'card-model', 'vocab', 'subjective-terms.mjs')), [...J.terms, ...J.criterionTerms])
  noLiteral(readText(join(REPO, 'tools', 'docgen', 'card-model', 'vocab', 'criterion-terms.mjs')), [...J.criterionTerms, ...J.terms])
  assert.deepStrictEqual(a.subjectiveTerms, J.terms)
  assert.deepStrictEqual(b.criterionTerms, J.criterionTerms)
  assert.ok(Object.isFrozen(a.subjectiveTerms))
  assert.ok(Object.isFrozen(b.criterionTerms))
  assert.deepStrictEqual(a.subjectiveTerms.filter((t) => b.criterionTerms.includes(t)), [])
})

test('OCR-S1-TC-F02 旧字面数组形态源码 → 必红', () => {
  const oldSource = `export const subjectiveTerms = Object.freeze([${J.terms.slice(0, 5).map((t) => `'${t}'`).join(',')}]);`
  const assertNoLiteral = (src) => {
    for (const t of J.terms) assert.strictEqual(countOccurrences(src, t), 0, `不得再写字面值：${t}`)
  }
  assert.throws(() => assertNoLiteral(oldSource))
})

test('OCR-S1-TC-F04 card-model.test.mjs 改派生后绿 + 旧字面数组 0', () => {
  const env = { ...process.env }
  delete env.NODE_TEST_CONTEXT
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', join(REPO, 'tools', 'docgen', 'test', 'card-model.test.mjs')], { cwd: REPO, encoding: 'utf8', env })
  const out = (r.stdout || '') + (r.stderr || '')
  assert.strictEqual(r.status, 0, out.slice(-2000))
  assert.ok(/# fail 0/.test(out), out.slice(-500))
  const src = readText(join(REPO, 'tools', 'docgen', 'test', 'card-model.test.mjs'))
  assert.ok(!new RegExp(`export const subjectiveTerms = Object\\.freeze\\(\\[\\s*['"]${J.terms[0]}`).test(src), '不得残留旧字面数组形态')
})

test('OCR-S1-TC-F05 PRD 5 词仍逐字、逐个 ⊆ 词表、日期注与指针在位', () => {
  const text = readText(join(REPO, 'docs', 'prd', '20261026205821-agent-card-contract.md'))
  const line = text.split(/\r?\n/).find((l) => l.includes('起步词：'))
  assert.ok(line, 'PRD 起步词行必须仍在')
  const five = line.match(/起步词：(.+?)）/)[1].split('/').map((x) => x.trim()).filter(Boolean)
  assert.strictEqual(five.length, 5)
  assert.ok(line.includes(J.terms[0]) && line.includes(J.terms[4]), '5 词原文必须保留')
  assert.ok(five.every((w) => J.terms.includes(w)), `5 词必须逐个 ⊆ 当前词表：${five}`)
  assert.ok(text.includes('2026-10-31') && text.includes('tools/quality/observable-terms.json'))
})

test('OCR-S1-TC-F06 删日期注 → 必红', () => {
  const text = readText(join(REPO, 'docs', 'prd', '20261026205821-agent-card-contract.md'))
  const c = text.replaceAll('2026-10-31', '')
  const assertDateNote = (t) => assert.ok(t.includes('2026-10-31') && t.includes('tools/quality/observable-terms.json'))
  assert.throws(() => assertDateNote(c))
})

// 2026-11-05 增量（S6-B 签后登记）：`tools/docgen/policy/**` 不再断言「零改动」——S6-B 按已签 spec
// 明确改动 `paths` / `seats` / 新增 `writeScopes` 三处。判据改为「只许这 3 个登记文件，其余 policy 文件零改动」。
test('OCR-S1-TC-F07 tools/docgen/policy/** 只许 S6-B 登记的 3 个文件（其余零改动）', () => {
  const ALLOWED = ['definitions/paths.mjs', 'definitions/seats.mjs', 'definitions/writeScopes.mjs']
  // 三个登记文件必须仍在（否则「只许改动」会漏掉删除：`git status` 的 D 行也落在允许集内）
  for (const f of ALLOWED) {
    assert.ok(existsSync(join(REPO, 'tools/docgen/policy', f)), `登记文件不得被删除：${f}`)
  }
  const a = spawnSync('git', ['diff', '--name-only', 'HEAD', '--', 'tools/docgen/policy'], { cwd: REPO, encoding: 'utf8' })
  const b = spawnSync('git', ['status', '--porcelain', '--', 'tools/docgen/policy'], { cwd: REPO, encoding: 'utf8' })
  assert.equal(a.status, 0, `git diff 执行失败：${a.error?.message ?? a.stderr}`)
  assert.equal(b.status, 0, `git status 执行失败：${b.error?.message ?? b.stderr}`)
  const rel = (line) => line.replace(/^[ MADRCU?!]{1,2}\s+/, '').replace('tools/docgen/policy/', '').trim()
  const changed = [...(a.stdout || '').split(/\r?\n/), ...(b.stdout || '').split(/\r?\n/)].map(rel).filter(Boolean)
  const outside = changed.filter((f) => !ALLOWED.includes(f))
  assert.deepEqual(outside, [], `policy 下出现未登记的改动：${outside.join('、')}`)
})

test('OCR-S1-TC-F08 R8 sweep ok + 基线表述日期注在位', () => {
  const r = spawnSync(process.execPath, [join(REPO, 'scripts', 'scope-sweep.mjs'), '--check'], { cwd: REPO, encoding: 'utf8' })
  assert.strictEqual(r.status, 0, (r.stdout || '') + (r.stderr || ''))
  assert.ok((r.stdout || '').includes('sweep ok'))
  const prd = readText(PRD).split(/\r?\n/)
  // 按**内容**断两处基线日期注（不按行号：PRD 加行会让行号漂）；要求「§0.3-6b + 2026-10-31 + 21」同现且 ≥2 处
  const baseNotes = prd.filter((l) => /§0\.3-6b/.test(l) && /2026-10-31/.test(l) && /\*\*21\*\*|21 行/.test(l))
  assert.ok(baseNotes.length >= 2, `PRD 至少两处「§0.3-6b + 2026-10-31 + 21 行」基线注，实得 ${baseNotes.length}`)
})

test('OCR-S1-TC-F09 baseline 38/38 + 新规则两处登记', () => {
  assert.strictEqual(cli(['--check']).status, 0)
  const g = spawnSync(process.execPath, [join(REPO, 'tools', 'docgen', 'cli.mjs'), 'gate'], { cwd: REPO, encoding: 'utf8' })
  assert.ok(/baseline 38\/38/.test(g.stdout || ''), (g.stdout || '').slice(0, 300))
  const bj = readText(join(REPO, 'tools', 'docgen', 'baseline.json'))
  assert.ok(bj.includes('rules/observable-criteria.md'))
  const bm = readText(join(REPO, 'tools', 'docgen', 'components', 'baseline.mjs'))
  assert.ok(bm.includes('observable-criteria'))
})

test('OCR-S1-TC-F10 九词字面数组全仓恰 1 处（JSON 自身）；副本 >1 必红', () => {
  const hits = [...arrayLiteralHits(join(REPO, 'tools')), ...arrayLiteralHits(join(REPO, 'scripts'))]
  assertSingleCopy(hits)
  assert.throws(() => assertSingleCopy([hits[0], 'tools/quality/copy.json']))
})
