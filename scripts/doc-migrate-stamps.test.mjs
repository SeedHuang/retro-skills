// doc-migrate-stamps 测试：批量补前缀、记录型跳过、中文文件要求人工起名、引用同步重写
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { collect, applyAll, renderPlan } from './doc-migrate-stamps.mjs'

function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), 'docmigrate-'))
  for (const [rel, text] of Object.entries(files)) {
    const abs = join(root, rel)
    mkdirSync(dirname(abs), { recursive: true })
    writeFileSync(abs, text, 'utf8')
  }
  return root
}

const AT = new Date(2026, 0, 2, 3, 4, 5) // 固定时刻，避免依赖真实 birthtime
const getStamp = () => AT

test('collect：记录型也补前缀（它是快照）；中文名进跳过；索引不加前缀', () => {
  const root = fixture({
    'docs/prd/topic/plain.md': '# plain\n',
    'docs/prd/topic/20260101000000-ok.md': '# ok\n',
    'docs/prd/topic/rec-transcript.md': '# rec\n',
    'docs/prd/topic/中文名.md': '# cn\n',
    'docs/prd/docgen-index.md': '# index\n',
  })
  try {
    const { tasks, skipped } = collect({ root, dirs: ['docs/prd'], getStamp })
    assert.deepEqual(tasks.map((t) => t.rel).sort(), [
      'docs/prd/topic/plain.md',
      'docs/prd/topic/rec-transcript.md',
    ])
    assert.equal(tasks.find((t) => t.rel.endsWith('plain.md')).newRel, 'docs/prd/topic/20260102030405-plain.md')
    assert.equal(tasks.find((t) => t.rel.endsWith('rec-transcript.md')).newRel, 'docs/prd/topic/20260102030405-rec-transcript.md')
    const skippedRels = skipped.map((s) => s.rel)
    assert.ok(skippedRels.includes('docs/prd/topic/中文名.md'))
    // 已合规与单份索引都不应出现在任一侧
    for (const rel of ['docs/prd/topic/20260101000000-ok.md', 'docs/prd/docgen-index.md']) {
      assert.equal(tasks.some((t) => t.rel === rel), false)
      assert.equal(skipped.some((s) => s.rel === rel), false)
    }
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('applyAll：改名成功，且指向它的引用被同步重写', () => {
  const root = fixture({
    'docs/prd/topic/plain.md': '# plain\n',
    'docs/refs.md': '链接：[plain.md](docs/prd/topic/plain.md)\n',
  })
  try {
    const { tasks } = collect({ root, dirs: ['docs/prd'], getStamp })
    const done = applyAll({ root, tasks })
    assert.equal(done.length, 1)
    assert.equal(done[0].ok, true)
    assert.ok(existsSync(join(root, 'docs/prd/topic/20260102030405-plain.md')))
    assert.equal(existsSync(join(root, 'docs/prd/topic/plain.md')), false)
    const refs = readFileSync(join(root, 'docs/refs.md'), 'utf8')
    assert.match(refs, /20260102030405-plain\.md/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('renderPlan：dry-run 报告列出旧名→新名与跳过原因', () => {
  const root = fixture({
    'docs/prd/topic/plain.md': '# plain\n',
    'docs/prd/topic/rec-transcript.md': '# rec\n',
    'docs/prd/topic/中文名.md': '# cn\n',
  })
  try {
    const r = collect({ root, dirs: ['docs/prd'], getStamp })
    const text = renderPlan(r)
    assert.match(text, /\[DRY-RUN\] 批量补前缀/)
    assert.match(text, /docs\/prd\/topic\/plain\.md/)
    assert.match(text, /→ docs\/prd\/topic\/20260102030405-plain\.md/)
    assert.match(text, /docs\/prd\/topic\/rec-transcript\.md/) // 记录型也要补前缀
    assert.match(text, /需人工起名：含中文 \/ 空格 \/ 下划线/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('collect：目录不存在时进跳过清单，不抛错', () => {
  const root = fixture({ 'docs/x.md': '# x\n' })
  try {
    const { tasks, skipped } = collect({ root, dirs: ['docs/not-there'], getStamp })
    assert.equal(tasks.length, 0)
    assert.equal(skipped[0].why, '目录不存在')
  } finally { rmSync(root, { recursive: true, force: true }) }
})
