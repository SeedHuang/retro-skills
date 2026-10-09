import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { ensure, ls, rmFile, rmRule, parseName } from './drafts.mjs'

function mkbox() { return mkdtempSync(join(tmpdir(), 'drafts-')) }
function w(box, name) { writeFileSync(join(box, name), '# x\n', 'utf8') }

test('ensure：目录存在则幂等返回；不存在则建', () => {
  const box = mkbox()
  ensure(box)   // 已存在 → 不报错
  ensure(box)
  const sub = join(box, 'sub')
  ensure(sub)   // 不存在 → 建
  assert.ok(existsSync(sub))
  rmSync(box, { recursive: true, force: true })
})
test('ls：按文件名时间戳倒序、可过滤、带 created 字段', () => {
  const box = mkbox()
  w(box, 'a--20261009-080000.md'); w(box, 'a--20261009-100000.md'); w(box, 'b--20261009-090000.md')
  const all = ls(box)
  assert.equal(all.length, 3)
  assert.equal(all[0].name, 'a--20261009-100000.md')   // 文件名时间戳倒序
  const a = ls(box, 'a')
  assert.equal(a.length, 2)
  assert.ok(a[0].created)
  rmSync(box, { recursive: true, force: true })
})
test('rmFile：删指定草稿；不存在 → 静默成功', () => {
  const box = mkbox(); w(box, 'a--1.md')
  rmFile(box, 'a--1.md')
  assert.ok(!existsSync(join(box, 'a--1.md')))
  rmFile(box, 'nope.md')
  rmSync(box, { recursive: true, force: true })
})
test('rmRule：默认删该规则全部；带 keep 保留指定', () => {
  const box = mkbox()
  w(box, 'a--1.md'); w(box, 'a--2.md'); w(box, 'b--1.md')
  rmRule(box, 'a')                       // 删 a 全部
  assert.ok(!existsSync(join(box, 'a--1.md')))
  assert.ok(!existsSync(join(box, 'a--2.md')))
  assert.ok(existsSync(join(box, 'b--1.md')))
  w(box, 'a--3.md'); w(box, 'a--4.md')
  rmRule(box, 'a', 'a--3.md')            // 保留 a--3，删其余
  assert.ok(existsSync(join(box, 'a--3.md')))
  assert.ok(!existsSync(join(box, 'a--4.md')))
  rmSync(box, { recursive: true, force: true })
})

// ── 审查修复回归（all 模式 OCR findings：路径逃逸 / keep 校验 / created 格式）──

test('created 格式：YYYYMMDD-HHMMSS → YYYY-MM-DD HH:MM:SS（含秒）', () => {
  assert.equal(parseName('a--20261009-100000.md').created, '2026-10-09 10:00:00')
})

test('rmFile 拒绝路径逃逸（../../x.md → throw，不删 box 外文件）', () => {
  const box = mkbox()
  const outside = join(box, '..', 'important.md')
  writeFileSync(outside, 'keep')
  assert.throws(() => rmFile(box, '../important.md'))
  assert.ok(existsSync(outside))          // 逃逸目标未被删
  rmSync(box, { recursive: true, force: true })
  rmSync(outside, { force: true })
})

test('rmRule：keep 不存在 → throw 且不删任何草稿', () => {
  const box = mkbox()
  w(box, 'a--1.md'); w(box, 'a--2.md')
  assert.throws(() => rmRule(box, 'a', 'a--不存在.md'))
  assert.ok(existsSync(join(box, 'a--1.md')))
  assert.ok(existsSync(join(box, 'a--2.md')))
  rmSync(box, { recursive: true, force: true })
})
