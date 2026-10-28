// doc-name 判据测试：三类命名规则 + 豁免 + 建议名
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { judge, checkTree, suggestName, fmt14, fmtDate, kindOfDir } from './doc-name.mjs'

function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), 'docname-'))
  for (const rel of files) {
    const abs = join(root, rel)
    mkdirSync(dirname(abs), { recursive: true })
    writeFileSync(abs, '# x\n', 'utf8')
  }
  return root
}

test('创建时刻类：docs/prd 与 docs/after 必须 14 位时间戳前缀（含主题子目录）', () => {
  const root = fixture([
    'docs/prd/20260102030405-topic/ok.md',
    'docs/prd/topic/bad.md',
    'docs/after/20260102030405-fine.md',
    'docs/after/nope.md',
  ])
  try {
    // 带戳主题目录内的文件用原名（stamped-parent）
    assert.equal(judge(join(root, 'docs/prd/20260102030405-topic/ok.md'), root).ok, true)
    // 缺戳主题目录内的文件不在文件层报红——正解是给目录加戳，由 checkTree 的目录层报
    const prd = judge(join(root, 'docs/prd/topic/bad.md'), root)
    assert.equal(prd.ok, true)
    assert.equal(prd.kind, 'pending-dir')
    assert.equal(judge(join(root, 'docs/after/nope.md'), root).ok, false)
    assert.equal(judge(join(root, 'docs/after/20260102030405-fine.md'), root).ok, true)
    // 目录层仍红：缺戳的 docs/prd/topic/ 报 1 条；其内的 bad.md 不再被文件层重复报
    const res = checkTree('docs', root)
    assert.deepEqual(res.findings.map((f) => f.rel), ['docs/prd/topic/', 'docs/after/nope.md'])
    assert.equal(res.findings[0].kind, 'stamp-dir')
    assert.ok(!res.findings.some((f) => f.rel.endsWith('prd/topic/bad.md')), JSON.stringify(res.findings))
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('定稿日期类：specs / plans / handoffs 必须 YYYY-MM-DD 前缀', () => {
  const root = fixture([
    'docs/superpowers/specs/2026-01-02-ok.md',
    'docs/superpowers/specs/plain.md',
    'docs/superpowers/plans/2026-01-02-ok.md',
    'docs/handoffs/2026-01-02-ok.md',
    'docs/handoffs/20260102-wrong.md',
  ])
  try {
    assert.equal(judge(join(root, 'docs/superpowers/specs/2026-01-02-ok.md'), root).ok, true)
    assert.equal(judge(join(root, 'docs/superpowers/specs/plain.md'), root).ok, false)
    assert.equal(judge(join(root, 'docs/handoffs/20260102-wrong.md'), root).ok, false)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('祖先目录带时间戳：子文件不再加前缀（retro / reviews 自动命中）', () => {
  const root = fixture([
    'docs/superpowers/retro/2026-01-02-x/retro-01-a.md',
    'docs/superpowers/reviews/2026-01-02-0937-x/progress.md',
    'docs/prd/20260102030405-topic/plain.md',
  ])
  try {
    const a = judge(join(root, 'docs/superpowers/retro/2026-01-02-x/retro-01-a.md'), root)
    assert.equal(a.ok, true)
    assert.equal(a.kind, 'stamped-parent')
    assert.equal(judge(join(root, 'docs/superpowers/reviews/2026-01-02-0937-x/progress.md'), root).ok, true)
    // 主题目录自己带时间戳时，里面的文件同样免前缀
    assert.equal(judge(join(root, 'docs/prd/20260102030405-topic/plain.md'), root).kind, 'stamped-parent')
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('单份确定版 / 索引不加时间戳；但中文名仍判违规', () => {
  const root = fixture([
    'docs/prd/docgen-index.md',
    'docs/README.md',
    'docs/guide/overview.md',
    'docs/prd/中文索引.md',
  ])
  try {
    assert.equal(judge(join(root, 'docs/prd/docgen-index.md'), root).kind, 'singleton')
    assert.equal(judge(join(root, 'docs/README.md'), root).ok, true)
    assert.equal(judge(join(root, 'docs/guide/overview.md'), root).ok, true)
    const cn = judge(join(root, 'docs/prd/中文索引.md'), root)
    assert.equal(cn.ok, false)
    assert.equal(cn.kind, 'generic')
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('通用档只禁中文 / 空格 / 下划线，不误伤 README.md 这类固定名', () => {
  const root = fixture([
    'docs/README.md',
    'docs/guide/中文名.md',
    'docs/guide/has_underscore.md',
    'docs/guide/has space.md',
    'docs/guide/plain-name.md',
  ])
  try {
    assert.equal(judge(join(root, 'docs/README.md'), root).ok, true)
    assert.equal(judge(join(root, 'docs/guide/plain-name.md'), root).ok, true)
    assert.equal(judge(join(root, 'docs/guide/中文名.md'), root).ok, false)
    assert.equal(judge(join(root, 'docs/guide/has_underscore.md'), root).ok, false)
    assert.equal(judge(join(root, 'docs/guide/has space.md'), root).ok, false)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('checkTree 汇总违规则并给出建议名', () => {
  // 文件层：直接放在 docs/prd 下的单文件主题没带前缀 → 报一条（目录层无子目录，不额外报）
  const root = fixture(['docs/prd/bad.md', 'docs/prd/20260102030405-ok.md'])
  try {
    const res = checkTree('docs', root)
    assert.equal(res.ok, false)
    assert.equal(res.findings.length, 1)
    assert.equal(res.findings[0].rel, 'docs/prd/bad.md')
    assert.match(res.findings[0].suggest, /^\d{14}-bad\.md$/)
    assert.ok(['birthtime', 'ctime'].includes(res.findings[0].stampFrom))
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('suggestName：stamp 类补 14 位、date 类补 YYYY-MM-DD、generic 原样', () => {
  const at = new Date(2026, 0, 2, 3, 4, 5) // 本地时间，避免时区影响
  assert.equal(suggestName({ kind: 'stamp', name: 'x.md', at }), '20260102030405-x.md')
  assert.equal(suggestName({ kind: 'date', name: 'x.md', at }), '2026-01-02-x.md')
  assert.equal(suggestName({ kind: 'generic', name: 'x.md', at }), 'x.md')
  assert.equal(fmt14(at), '20260102030405')
  assert.equal(fmtDate(at), '2026-01-02')
})

test('docs/research：课题目录必须带 14 位戳；带戳后目录内文件用原名（index.md 不加前缀）', () => {
  const root = fixture([
    'docs/research/20260102030405-topic/index.md',
    'docs/research/20260102030405-topic/detail.md',
    'docs/research/plain-topic/index.md',
  ])
  try {
    // 带戳目录内：index.md 是单份索引，detail.md 靠 stamped-parent，都不要求前缀
    assert.equal(judge(join(root, 'docs/research/20260102030405-topic/index.md'), root).kind, 'singleton')
    assert.equal(judge(join(root, 'docs/research/20260102030405-topic/detail.md'), root).kind, 'stamped-parent')
    // 目录层：不带戳的课题目录要红（index.md 本身合法，文件层判不出，只能靠目录层）
    const res = checkTree('docs', root)
    assert.equal(res.ok, false)
    assert.deepEqual(res.findings.map((f) => f.rel), ['docs/research/plain-topic/'])
    assert.match(res.findings[0].expect, /YYYYMMDDHHmmss-<主题>\//)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('research 课题目录缺戳：文件层不报（不与目录级双报，也不给「改文件名」建议）', () => {
  const root = fixture([
    'docs/research/plain-topic/index.md',
    'docs/research/plain-topic/detail.md',
  ])
  try {
    assert.equal(judge(join(root, 'docs/research/plain-topic/detail.md'), root).kind, 'pending-dir')
    const res = checkTree('docs', root)
    assert.deepEqual(res.findings.map((f) => f.rel), ['docs/research/plain-topic/'])
    assert.equal(res.findings[0].kind, 'stamp-dir')
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('research 根层散文件：红，但不误导为「给文件加戳」，提示收进课题目录', () => {
  const root = fixture(['docs/research/loose-note.md'])
  try {
    const res = checkTree('docs', root)
    assert.equal(res.findings.length, 1)
    assert.equal(res.findings[0].kind, 'loose-in-research')
    assert.match(res.findings[0].expect, /课题目录/)
    assert.equal(res.findings[0].suggest, '')
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('research 根层连 index.md / README.md 也必须收进课题目录（singleton 不短路）', () => {
  const root = fixture([
    'docs/research/index.md',
    'docs/research/README.md',
    'docs/research/foo-index.md',
  ])
  try {
    const res = checkTree('docs/research', root)
    assert.deepEqual(res.findings.map((f) => f.rel).sort(), [
      'docs/research/README.md',
      'docs/research/foo-index.md',
      'docs/research/index.md',
    ])
    assert.ok(res.findings.every((f) => f.kind === 'loose-in-research'), JSON.stringify(res.findings))
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('根入口 `--check .` 也能报缺戳课题目录（不因 entry 为空串而静默）', () => {
  const root = fixture(['docs/research/plain-topic/x.md'])
  try {
    assert.deepEqual(checkTree('.', root).findings.map((f) => f.rel), ['docs/research/plain-topic/'])
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('把文件路径传给 checkTree：收敛为「不是目录」，不抛 ENOTDIR', () => {
  const root = fixture(['docs/research/plain-topic/x.md'])
  try {
    const res = checkTree('docs/research/plain-topic/x.md', root)
    assert.equal(res.ok, false)
    assert.equal(res.findings[0].why, '不是目录')
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('日期类目录不做主题层判定：缺日期主题目录只报文件层，不额外报 stamp-dir', () => {
  const root = fixture(['docs/superpowers/specs/t3/x.md'])
  try {
    const rels = checkTree('docs/superpowers/specs/t3', root).findings.map((f) => f.rel)
    assert.deepEqual(rels, ['docs/superpowers/specs/t3/x.md'])
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('research 课题目录缺戳：换任何入口（课题层 / 内层）都能报，不因入口不同而假绿', () => {
  const root = fixture([
    'docs/research/plain-topic/index.md',
    'docs/research/plain-topic/sub/deep.md',
  ])
  try {
    for (const t of ['docs', 'docs/research', 'docs/research/plain-topic', 'docs/research/plain-topic/sub']) {
      assert.deepEqual(checkTree(t, root).findings.map((f) => f.rel), ['docs/research/plain-topic/'], t)
    }
    // 带戳课题：任何入口都 0 条（内层目录不再要求加戳）
    const ok = fixture(['docs/research/20260102030405-topic/sub/deep.md'])
    try {
      for (const t of ['docs', 'docs/research', 'docs/research/20260102030405-topic/sub']) {
        assert.deepEqual(checkTree(t, ok).findings.map((f) => f.rel), [], t)
      }
    } finally { rmSync(ok, { recursive: true, force: true }) }
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('kindOfDir 按前缀匹配，主题子目录也算', () => {
  assert.equal(kindOfDir('docs/prd'), 'stamp')
  assert.equal(kindOfDir('docs/prd/20260101000000-topic'), 'stamp')
  assert.equal(kindOfDir('docs/research'), 'stamp')
  assert.equal(kindOfDir('docs/research/20260101000000-topic'), 'stamp')
  assert.equal(kindOfDir('docs/handoffs'), 'date')
  assert.equal(kindOfDir('docs/guide'), 'generic')
})

test('默认入口（`--check docs`）必须能抓到 docs/prd 下未带戳的主题目录', () => {
  // 回归：目录层检查曾只在「target 恰好是 docs/prd」时执行，默认入口传 docs → 整段被跳过
  const root = fixture([
    'docs/prd/bad-topic/index.md',
    'docs/prd/20260101000000-ok/index.md',
    'docs/after/20260101000000-ok.md',
  ])
  try {
    const res = checkTree('docs', root)
    assert.deepEqual(res.findings.map((f) => f.rel), ['docs/prd/bad-topic/'])
    assert.equal(res.findings[0].kind, 'stamp-dir')
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('目录层：docs/prd 直接子目录必须带时间戳；目录内文件用原名（只加一层）', () => {
  const root = fixture([
    'docs/prd/bad-topic/index.md',
    'docs/prd/20260101000000-good/index.md',
    'docs/prd/20260101000000-good/sub/plain.md',
  ])
  try {
    const res = checkTree('docs/prd', root)
    assert.equal(res.ok, false)
    // 只有「没带时间戳的那个目录」被报；目录内文件、以及带戳目录的下层子目录都不报
    assert.deepEqual(res.findings.map((f) => f.rel), ['docs/prd/bad-topic/'])
    assert.equal(res.findings[0].kind, 'stamp-dir')
    assert.match(res.findings[0].suggest, /^\d{14}-bad-topic\/$/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})
