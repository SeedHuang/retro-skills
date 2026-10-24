// doc-rename 测试：命中类型、跳过清单、dry-run 不动文件、apply 后残留为 0
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { plan, applyPlan, renderReport, classifyHit, scanRefs, main } from './doc-rename.mjs'

function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), 'docrename-'))
  for (const [rel, text] of Object.entries(files)) {
    const abs = join(root, rel)
    mkdirSync(dirname(abs), { recursive: true })
    writeFileSync(abs, text, 'utf8')
  }
  return root
}

const BASE = {
  'docs/target/old-name.md': '# old-name.md\n\n自引用：old-name.md\n',
  'docs/refs.md': [
    '链接：[说明](old-name.md)',
    '代码：`old-name.md`',
    '正文提到 old-name.md 结束',
  ].join('\n') + '\n',
  'docs/rec-transcript.md': '记录：old-name.md\n',
  '.session/tmp.md': '过程账：old-name.md\n',
}

test('plan：区分 link / code / prose，跳过记录文件，且不扫 .session', () => {
  const root = fixture(BASE)
  try {
    const p = plan({ root, oldPath: 'docs/target/old-name.md', newPath: 'docs/target/new-name.md' })
    const refs = p.hits.filter((h) => h.file === 'docs/refs.md')
    assert.equal(refs.length, 3)
    assert.deepEqual(refs.map((h) => h.type), ['link', 'code', 'prose'])
    assert.deepEqual(refs.map((h) => h.line), [1, 2, 3])
    // 记录型文件照扫但归类为跳过（不许静默）
    const skipped = p.hits.filter((h) => h.skipped)
    assert.equal(skipped.length, 1)
    assert.equal(skipped[0].file, 'docs/rec-transcript.md')
    // .session 目录整棵不扫
    assert.equal(p.hits.some((h) => h.file.startsWith('.session/')), false)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('plan：被改名的文件自身含自引用时，也进「需改」清单', () => {
  const root = fixture(BASE)
  try {
    const p = plan({ root, oldPath: 'docs/target/old-name.md', newPath: 'docs/target/new-name.md' })
    assert.ok(p.files.includes('docs/target/old-name.md'))
    assert.ok(p.files.includes('docs/refs.md'))
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('dry-run（只 plan）不改任何文件', () => {
  const root = fixture(BASE)
  try {
    plan({ root, oldPath: 'docs/target/old-name.md', newPath: 'docs/target/new-name.md' })
    assert.ok(existsSync(join(root, 'docs/target/old-name.md')))
    assert.match(readFileSync(join(root, 'docs/refs.md'), 'utf8'), /old-name\.md/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('apply：改引用 + 改名，记录文件原样，残留为 0', () => {
  const root = fixture(BASE)
  try {
    const p = plan({ root, oldPath: 'docs/target/old-name.md', newPath: 'docs/target/new-name.md' })
    const res = applyPlan({ root, oldPath: 'docs/target/old-name.md', newPath: 'docs/target/new-name.md', p })
    assert.equal(res.residual, 0)
    assert.equal(existsSync(join(root, 'docs/target/old-name.md')), false)
    assert.ok(existsSync(join(root, 'docs/target/new-name.md')))
    const refs = readFileSync(join(root, 'docs/refs.md'), 'utf8')
    assert.equal(refs.includes('old-name.md'), false)
    assert.equal((refs.match(/new-name\.md/g) || []).length, 3)
    // 记录型文件原样保留
    assert.match(readFileSync(join(root, 'docs/rec-transcript.md'), 'utf8'), /old-name\.md/)
    // 跳过项不计入残留
    assert.equal(scanRefs({ root, oldName: 'old-name.md' }).filter((h) => !h.skipped).length, 0)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('classifyHit：file:/// 路径也算 link', () => {
  const line = '见 file:///d:/x/old-name.md 末尾'
  const start = line.indexOf('old-name.md')
  assert.equal(classifyHit(line, start, start + 'old-name.md'.length), 'link')
})

test('同名文件：plan 给出 ambiguous，apply 默认拒绝', () => {
  const root = fixture({
    'docs/a/dup.md': '# a\n',
    'docs/b/dup.md': '# b\n',
    'docs/refs.md': '看 `dup.md`\n',
  })
  try {
    const p = plan({ root, oldPath: 'docs/a/dup.md', newPath: 'docs/a/dup2.md' })
    assert.deepEqual(p.ambiguous, ['docs/b/dup.md'])
    const code = main(['node', 'doc-rename.mjs', 'docs/a/dup.md', 'docs/a/dup2.md', '--apply', '--root', root])
    assert.equal(code, 2)
    assert.ok(existsSync(join(root, 'docs/a/dup.md'))) // 没被改名
    assert.match(readFileSync(join(root, 'docs/refs.md'), 'utf8'), /dup\.md/) // 引用没被改
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('renderReport：报告含行号、上下文、跳过清单与合计', () => {
  const root = fixture(BASE)
  try {
    const p = plan({ root, oldPath: 'docs/target/old-name.md', newPath: 'docs/target/new-name.md' })
    const text = renderReport(p)
    assert.match(text, /引用扫描：/)
    assert.match(text, /L1\s+link/)
    assert.match(text, /跳过（按规则不改）/)
    assert.match(text, /docs\/rec-transcript\.md\s+L1/)
    assert.match(text, /合计：将改 \d+ 行/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})
