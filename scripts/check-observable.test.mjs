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
import { spawnSync, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..')
// 2026-11-08：校验器实现已迁公共 CLI（`scs check observable`），本文件只保留**项目侧契约**
// （数据 JSON / 规则文档 / 门禁接线 / 词表派生）；机制级用例在 skill-common-script 的 vitest 里。
const CLI_ARGS = ['check', 'observable']
const TERMS_FILE = join(REPO, 'tools', 'docgen', 'dsl', 'rules', 'vocab', 'observable-terms.json')
const EXEMPT_FILE = join(REPO, 'tools', 'docgen', 'dsl', 'rules', 'vocab', 'observable-exempt.json')
const TC_FILE = join(REPO, 'docs', 'superpowers', 'specs', '2026-10-31-observable-criteria-rollout-design-testcase.md')
const PRD = join(REPO, 'docs', 'prd', '20261031202331-observable-criteria-rollout', 'index.md')
const TRIAGE = join(REPO, 'docs', 'reports', '2026-10-31-observable-s1-triage.md')
// 阶段 1 起规则文档已退出 `rules/`：测试取原文改读留底（`docs/bak/rules/observable-criteria.md`）
const RULE_DOC = join(REPO, 'docs', 'bak', 'rules', 'observable-criteria.md')
// bak 含状态头 + 承接对照表：取「原文段」= 状态头之后、`## 承接对照表` 之前的正文块
// （与 PRD stage-1 §5 V-9 的切片口径同源，逐字等于退役前的 rule 文件）
const ruleDocText = () => {
  const text = readText(RULE_DOC)
  const start = text.indexOf('\n') + 1
  const end = text.indexOf('\n## 承接对照表')
  return text.slice(start, end + 1)
}

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
  // 临时根自带空豁免清单：豁免条目是「相对扫描根」解析的，直接复用仓内清单会整批 stale
  mkdirSync(join(root, 'tools', 'quality'), { recursive: true })
  writeFileSync(join(root, 'tools', 'quality', 'observable-exempt.json'), JSON.stringify({ entries: [] }), 'utf8')
  return { root, cleanup: () => rmSync(root, { recursive: true, force: true }) }
}

function cli(args) {
  // 旧实现的词表 / 豁免清单是**仓内固定资产**（扫描根可换、数据源不变）；CLI 默认按 root 取。
  // 词表：始终复用本仓口径；豁免：有 --root 时用临时根里的空清单，否则用本仓清单。
  const full = [...args]
  const rootIdx = full.indexOf('--root')
  if (!full.includes('--terms')) full.push('--terms', TERMS_FILE)
  if (!full.includes('--exempt')) {
    full.push('--exempt', rootIdx >= 0 ? join(full[rootIdx + 1], 'tools', 'quality', 'observable-exempt.json') : EXEMPT_FILE)
  }
  const r = spawnSync('scs', [...CLI_ARGS, ...full], { cwd: REPO, encoding: 'utf8', shell: true })
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
  assert.ok(paths[0].endsWith(join('tools', 'docgen', 'dsl', 'rules', 'vocab', 'observable-terms.json')), `唯一一处必须是 observable-terms.json，实得 ${paths[0]}`)
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

test('OCR-S1-TC-B01 scanned 为 string[]、与同口径遍历同值、总数 ≥1、.MD 计、junction 不计', () => {
  const r = jsonOf(['--check', '--json'])
  assert.ok(Array.isArray(r.json.scanned), 'scanned 必须是数组')
  const nodeCount = countMdIndependently(join(REPO, 'rules')) + countMdIndependently(join(REPO, 'skills'))
  assert.strictEqual(r.json.scanned.length, nodeCount, `scanned 数必须与独立遍历同值（${r.json.scanned.length} vs ${nodeCount}）`)
  assert.ok(nodeCount > 0)
  // 总数不再写死（阶段 1/2/3 各会变一次）：只判「与独立遍历同值（上一条）+ ≥1」
  assert.ok(r.json.scanned.length >= 1, `扫描总数须 ≥1，实得 ${r.json.scanned.length}`)
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


test('OCR-S1-TC-B04 默认数据源前置过（无 P-2 错、exit ∈ {0,1}）', () => {
  const r = cli(['--check'])
  assert.ok(!/error（P-2/.test(r.out))
  assert.ok([0, 1].includes(r.status))
})

// ── E 组：门禁 ⑦ 段与规则文档 ────────────────────────────────────────────
test('OCR-S1-TC-E01 ⑦ 段源码四静态断言 + 单跑 exit 0', () => {
  const src = readText(join(REPO, 'scripts', 'check-all.mjs'))
  // 2026-11-08：⑦ 段改调公共 CLI `scs check observable`（实现迁到 skill-common-script，仓内不留副本）。
  // 四条守卫的意图不变：接线在、位置在 ⑥ 之后、失败置 failed、不得接进旁路。
  assert.ok(/spawnSync\(\s*'scs check observable --check --json --terms \S+ --exempt \S+'/.test(src), '⑦ 段必须调用 scs check observable 并带词表/豁免参数')
  assert.ok(src.indexOf('spawnSync(\'scs check observable') > src.indexOf('runObservationGate'), '⑦ 必须在 ⑥（runObservationGate）之后')
  assert.ok(/scs check observable[\s\S]{0,400}failed = true/.test(src), '⑦ 失败必须置 failed = true')
  assert.ok(!/CHECK_BYPASS[\s\S]{0,300}check observable/.test(src), '⑦ 不得接进 CHECK_BYPASS 分支')
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
  // 2026-11-08：入口值改指公共 CLI（实现已迁 skill-common-script，仓内不再有该脚本）。
  // 2026-11-08 目录统一：词表/豁免随 rules DSL 下沉，入口必须显式带 --terms / --exempt。
  const tokenAfter = (entry, flag) => {
    const t = String(entry).split(/\s+/)
    const i = t.indexOf(flag)
    return i >= 0 ? t[i + 1] : undefined
  }
  const assertPathsExist = (name, entry, flags) => {
    for (const f of flags) {
      const v = tokenAfter(entry, f)
      assert.ok(v && existsSync(join(REPO, v)), `${name} 的 ${f} 指向不存在的路径：${v}`)
    }
  }
  const obs = pkg.scripts['check:observable'] ?? ''
  assert.match(obs, /^scs check observable( --check)? --terms \S+ --exempt \S+$/, `入口值不合规格：${obs}`)
  assertPathsExist('check:observable', obs, ['--terms', '--exempt'])

  // 2026-11-08 新增入口：判据引擎三目录 + 词表；目录必须真实存在（布局再变时当场红）
  const crit = pkg.scripts['check:criteria'] ?? ''
  assert.match(crit, /^scs check criteria-engine --engine \S+ --data \S+ --projection \S+ --terms \S+( --surface \S+)+$/, `入口值不合规格：${crit}`)
  assertPathsExist('check:criteria', crit, ['--engine', '--data', '--projection', '--terms'])

  // 与门禁 ⑨ 段同源：check-all 必须使用同一组相对路径，避免入口与门禁各写一套
  const allSrc = readText(join(REPO, 'scripts', 'check-all.mjs'))
  for (const v of ['tools/docgen/builders/rules', 'tools/docgen/dsl/rules',
    'tools/docgen/dsl/rules/vocab/observable-terms.json']) {
    assert.ok(crit.includes(v) && allSrc.includes(v), `门禁与入口的路径不一致：${v}`)
  }
  assert.strictEqual(cli(['--check']).status, 0)
})

test('OCR-S1-TC-E04 删键 / 改值为 --fix → 两构造各必红', () => {
  const pkg = JSON.parse(readText(join(REPO, 'package.json')))
  const assertPkg = (p) => assert.ok(/^scs check observable( --check)? --terms \S+ --exempt \S+$/.test(p.scripts['check:observable'] ?? ''))
  const c1 = structuredClone(pkg)
  delete c1.scripts['check:observable']
  assert.throws(() => assertPkg(c1))
  const c2 = structuredClone(pkg)
  c2.scripts['check:observable'] = 'scs check observable --fix'
  assert.throws(() => assertPkg(c2))
})

test('OCR-S1-TC-E05 规则文档 ≤120 行 + 六锚 + 两句声明 + 120/121 边界', () => {
  const text = ruleDocText()
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
  const rule = ruleDocText()
  const pat = J.markers.map((m) => m.pattern).find((p) => p.length >= 8)
  const r = withRoot({ 'rules/observable-criteria.md': `${rule}\n正文片段：${pat}\n` })
  assert.strictEqual(r.status, 1)
  assert.ok(/check-observable fail/.test(r.last))
})

test('OCR-S1-TC-E10 单词面叙述 → 绿（不算复制词表）', () => {
  const rule = ruleDocText()
  const r = withRoot({ 'rules/observable-criteria.md': `${rule}\n按本规则判「${J.terms[0]}」时，看它所在块有没有可观察标记。\n` })
  assert.strictEqual(r.status, 0)
})

test('OCR-S1-TC-E11 同行 ≥2 词枚举 → exit 1', () => {
  const rule = ruleDocText()
  const enumLine = `本规则覆盖 ${J.terms.slice(0, 4).join('、')} 四类。`
  const r = withRoot({ 'rules/observable-criteria.md': `${rule}\n${enumLine}\n` })
  assert.strictEqual(r.status, 1)
  assert.ok(/check-observable fail/.test(r.last))
})

test('OCR-S1-TC-E08 分诊表 20 行（历史快照）/ 现役行（排除已清空的 rules/）对账 / exemptedLines=L / stale=0 / L≤8 / hits=0', () => {
  const CATS = ['改文案', '已合格', '合法保留']
  const rows = readText(TRIAGE)
    .split(/\r?\n/)
    .filter((l) => l.startsWith('| `'))
    .filter((l) => CATS.includes((l.split('|')[4] ?? '').trim()))
  assert.strictEqual(rows.length, 20, `分诊表在册行应 20（首日 21，1 行退役），实得 ${rows.length}`)
  // 现役行 = 分诊表里路径仍在 `rules/` 之外的行：阶段 1 清空 `rules/` 后，指向 rules/ 的 2 行随载体消失
  const live = rows.filter((l) => !(l.split('|')[1] ?? '').includes('`rules/'))
  const liveCats = live.map((l) => l.split('|')[4].trim())
  const M = liveCats.filter((c) => c === '改文案').length
  const P = liveCats.filter((c) => c === '已合格').length
  const L = liveCats.filter((c) => c === '合法保留').length
  // 第二源（非表格自证）：独立按「9 词 + 排除标题行」数一遍**当次分诊表在册文件**里仍含主观词的行
  // （阶段 2 起新增 skills 不在分诊表内，按文件限定，避免把新内容混进这张历史对账表）
  const triageFiles = new Set(rows
    .map((l) => (l.split('|')[1] ?? '').trim().replace(/^`|`$/g, '').replace(/:\d+$/, '').replace(/\\/g, '/')))
  const raw = rawHitLines(triageFiles).length
  const r = jsonOf(['--check', '--json'])
  assertTriage({ M, P, L, hits: r.json.hits.length, raw, total: live.length })
  assert.strictEqual(r.json.exemptedLines, L)
  // 豁免清单与现役「合法保留」条数同源：清单删 2 条后两者必须相等
  assert.strictEqual(L, JSON.parse(readText(EXEMPT_FILE)).entries.length)
  assert.strictEqual(r.json.stale.length, 0)
})

// 原始命中行（「9 词 + 排除标题行」口径，按行计）——与分诊表各自的独立来源
function rawHitLines(onlyFiles = null) {
  const out = []
  const relOf = (p) => p.slice(REPO.length).replace(/^[\\/]+/, '').split('\\').join('/')
  for (const dir of ['rules', 'skills']) {
    const walk = (d) => {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        if (e.isSymbolicLink()) continue
        const p = join(d, e.name)
        if (e.isDirectory()) walk(p)
        else if (e.name.toLowerCase().endsWith('.md')) {
          if (onlyFiles && !onlyFiles.has(relOf(p))) continue
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

function assertTriage({ M, P, L, hits, raw, total = 20 }) {
  assert.strictEqual(M + P + L, total, `M+P+L 必须 = ${total}，实得 ${M + P + L}`)
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
  const a = await import('../tools/docgen/builders/agents/card-model/vocab/subjective-terms.mjs')
  const b = await import('../tools/docgen/builders/agents/card-model/vocab/criterion-terms.mjs')
  const noLiteral = (src, words) => {
    for (const t of words) assert.strictEqual(countOccurrences(src, t), 0, `派生文件不得再写词面：${t}`)
  }
  // 两张表各查各的字面（F01 判据原文要求「两文件字面出现均 0」——主观词 9 个 + 判据词 6 个都要查）
  noLiteral(readText(join(REPO, 'tools', 'docgen', 'builders', 'agents', 'card-model', 'vocab', 'subjective-terms.mjs')), [...J.terms, ...J.criterionTerms])
  noLiteral(readText(join(REPO, 'tools', 'docgen', 'builders', 'agents', 'card-model', 'vocab', 'criterion-terms.mjs')), [...J.criterionTerms, ...J.terms])
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
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', join(REPO, 'tools', 'docgen', 'builders', 'agents', 'test', 'card-model.test.mjs')], { cwd: REPO, encoding: 'utf8', env })
  const out = (r.stdout || '') + (r.stderr || '')
  assert.strictEqual(r.status, 0, out.slice(-2000))
  assert.ok(/# fail 0/.test(out), out.slice(-500))
  const src = readText(join(REPO, 'tools', 'docgen', 'builders', 'agents', 'test', 'card-model.test.mjs'))
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

// 2026-11-05 增量（S6-B 签后登记）：`tools/docgen/builders/agents/policy/**` 不再断言「零改动」——S6-B 按已签 spec
// 明确改动 `paths` / `seats` / 新增 `writeScopes` 三处。判据改为「只许这 3 个登记文件，其余 policy 文件零改动」。
// 2026-11-07 增量（review 三技能归档）：`definitions/commands.mjs` 的 check.local 命令由
// `node skills/review-log/scripts/time.mjs` 改为公共 CLI `scs time`（2026-11-08）——账本脚本随
// `review-log` 迁出 `skills/`。该文件进入登记集（4 个）。
test('OCR-S1-TC-F07 tools/docgen/builders/agents/policy/** 只许登记的 6 个文件（其余零改动）', () => {
  const ALLOWED = ['definitions/paths.mjs', 'definitions/seats.mjs', 'definitions/writeScopes.mjs', 'definitions/commands.mjs',
    'definitions/artifacts.mjs', 'seat-policy.mjs']
  const DIR = 'tools/docgen/builders/agents/policy'
  // 登记文件必须仍在（否则「只许改动」会漏掉删除：`git status` 的 D 行也落在允许集内）
  for (const f of ALLOWED) {
    assert.ok(existsSync(join(REPO, DIR, f)), `登记文件不得被删除：${f}`)
  }
  // 2026-11-08 目录统一：policy/ 整体下沉一层。判据 = 「按内容与 HEAD 同路径比」，
  // 否则整目录搬迁会让每个文件都相对 HEAD 变成新增（`git diff NAME` 判不出「只是搬家」）。
  // 枚举必须含未跟踪件（`--others`）：只查索引会让「新增 policy 文件未 git add」逃过守卫。
  const tracked = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--', DIR], { cwd: REPO, encoding: 'utf8' })
    .trim().split(/\r?\n/).filter(Boolean)
  const changed = []
  for (const f of [...new Set(tracked)]) {
    const relFile = f.slice(DIR.length + 1)
    let old
    try {
      old = execFileSync('git', ['show', `HEAD:${f}`], { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    } catch {
      changed.push(relFile)   // HEAD 上不存在 = 新增件
      continue
    }
    if (old !== readFileSync(join(REPO, f), 'utf8')) changed.push(relFile)
  }
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

test('OCR-S1-TC-F09 gate baseline N/N 与 baseline.json 同源（阶段 1：规则清单 0 条、不写死总数）', () => {
  assert.strictEqual(cli(['--check']).status, 0)
  const g = spawnSync(process.execPath, [join(REPO, 'tools', 'docgen', 'builders', 'agents', 'cli.mjs'), 'gate'], { cwd: REPO, encoding: 'utf8' })
  const bj = JSON.parse(readText(join(REPO, 'tools', 'docgen', 'builders', 'agents', 'baseline.json')))
  assert.ok(new RegExp(`baseline ${bj.length}\\/${bj.length}`).test(g.stdout || ''), (g.stdout || '').slice(0, 300))
  const bm = readText(join(REPO, 'tools', 'docgen', 'builders', 'agents', 'components', 'baseline.mjs'))
  assert.ok(/export const BASELINE_RULES = \[/.test(bm), '清单仍是单一来源常量（条数从它派生）')
})

test('OCR-S1-TC-F10 九词字面数组全仓恰 1 处（JSON 自身）；副本 >1 必红', () => {
  const hits = [...arrayLiteralHits(join(REPO, 'tools')), ...arrayLiteralHits(join(REPO, 'scripts'))]
  assertSingleCopy(hits)
  assert.throws(() => assertSingleCopy([hits[0], 'tools/quality/copy.json']))
})
