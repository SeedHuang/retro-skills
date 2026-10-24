// doc-migrate-stamps 测试：目录层 + 文件层两层迁移、只加一层、记录文件不重写、引用前缀重写
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { collect, collectDirs, applyAll, applyDir, renderPlan } from './doc-migrate-stamps.mjs'

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

test('collectDirs：docs/prd 直接子目录没带时间戳 → 目录层任务；已带戳 / 中文名各自处置', () => {
  const root = fixture({
    'docs/prd/plain-topic/index.md': '# p\n',
    'docs/prd/20260101000000-ok/index.md': '# ok\n',
    'docs/prd/中文主题/index.md': '# cn\n',
    'docs/prd/20260101000000-ok/sub/plain.md': '# 第二层\n',
  })
  try {
    const { tasks, skipped } = collectDirs({ root, dirs: ['docs/prd'], getStamp })
    assert.deepEqual(tasks.map((t) => t.rel), ['docs/prd/plain-topic/'])
    assert.equal(tasks[0].newRel, 'docs/prd/20260102030405-plain-topic/')
    assert.ok(skipped.some((s) => s.rel === 'docs/prd/中文主题/'))
    // 已带戳目录下的第二层不查（同一主题只加一层）
    assert.equal(tasks.some((t) => t.rel.includes('/sub/')), false)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('collect：进了目录层任务的目录，内部文件不再进文件层（避免双重改名）', () => {
  const root = fixture({
    'docs/prd/plain-topic/index.md': '# p\n',
    'docs/prd/plain-topic/notes.md': '# n\n',
    'docs/prd/single-topic.md': '# s\n',
  })
  try {
    const r = collect({ root, dirs: ['docs/prd'], getStamp })
    assert.deepEqual(r.dirTasks.map((t) => t.rel), ['docs/prd/plain-topic/'])
    // 目录内文件被挡掉；只有「单文件主题」进文件层
    assert.deepEqual(r.tasks.map((t) => t.rel), ['docs/prd/single-topic.md'])
    assert.equal(r.tasks[0].newRel, 'docs/prd/20260102030405-single-topic.md')
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('applyDir：改目录名 + 重写全仓路径前缀；记录文件内容不动', () => {
  const root = fixture({
    'docs/prd/plain-topic/index.md': '# p\n',
    'docs/prd/plain-topic/userconversation.md': '记录里提到 docs/prd/plain-topic/index.md\n',
    'docs/refs.md': '见 `docs/prd/plain-topic/index.md` 与 [链接](docs/prd/plain-topic/index.md)\n',
  })
  try {
    const task = { rel: 'docs/prd/plain-topic/', newRel: 'docs/prd/20260102030405-plain-topic/', kind: 'dir' }
    const res = applyDir({ root, task })
    assert.equal(res.ok, true)
    assert.equal(res.residual, 0)
    assert.equal(existsSync(join(root, 'docs/prd/plain-topic')), false)
    assert.ok(existsSync(join(root, 'docs/prd/20260102030405-plain-topic/index.md')))
    const refs = readFileSync(join(root, 'docs/refs.md'), 'utf8')
    assert.equal(refs.includes('docs/prd/plain-topic/'), false)
    assert.equal((refs.match(/docs\/prd\/20260102030405-plain-topic\//g) || []).length, 2)
    // 记录文件内容原样（豁免不重写）
    const rec = readFileSync(join(root, 'docs/prd/20260102030405-plain-topic/userconversation.md'), 'utf8')
    assert.match(rec, /docs\/prd\/plain-topic\/index\.md/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('applyAll：目录层与文件层一起跑', () => {
  const root = fixture({
    'docs/prd/plain-topic/index.md': '# p\n',
    'docs/prd/single-topic.md': '# s\n',
    'docs/refs.md': 'A: docs/prd/plain-topic/index.md；B: docs/prd/single-topic.md\n',
  })
  try {
    const r = collect({ root, dirs: ['docs/prd'], getStamp })
    const done = applyAll({ root, dirTasks: r.dirTasks, tasks: r.tasks })
    assert.ok(done.every((d) => d.ok))
    const refs = readFileSync(join(root, 'docs/refs.md'), 'utf8')
    assert.match(refs, /docs\/prd\/20260102030405-plain-topic\/index\.md/)
    assert.match(refs, /docs\/prd\/20260102030405-single-topic\.md/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('renderPlan：目录层与文件层分段展示，跳过项单列', () => {
  const root = fixture({
    'docs/prd/plain-topic/index.md': '# p\n',
    'docs/prd/single-topic.md': '# s\n',
    'docs/prd/中文主题/index.md': '# cn\n',
  })
  try {
    const r = collect({ root, dirs: ['docs/prd'], getStamp })
    const text = renderPlan(r)
    assert.match(text, /目录 1 个 \/ 文件 1 个/)
    assert.match(text, /目录层（改目录名 \+ 重写路径前缀；目录内文件不动）/)
    assert.match(text, /文件层（单文件主题）/)
    assert.match(text, /跳过（按规则不改）/)
    assert.match(text, /需人工起名/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('目录不存在时进跳过清单，不抛错', () => {
  const root = fixture({ 'docs/x.md': '# x\n' })
  try {
    const { dirTasks, tasks, skipped } = collect({ root, dirs: ['docs/not-there'], getStamp })
    assert.equal(dirTasks.length, 0)
    assert.equal(tasks.length, 0)
    assert.equal(skipped[0].why, '目录不存在')
  } finally { rmSync(root, { recursive: true, force: true }) }
})
