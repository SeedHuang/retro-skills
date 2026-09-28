/**
 * sync.mjs 的测试。
 *
 * 全部在系统临时目录里造"假源 + 假运行时"——**绝不碰真实的 ~/.trae-cn**（那是你的运行时）。
 *
 * 跑法：node --test scripts/sync.test.mjs
 *
 * 说明：带「期望(新)」注释的用例是**第 2 步要实现的行为**，现在会红——那正是 TDD 的 RED。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  mkdtempSync, mkdirSync, writeFileSync, readdirSync, rmSync,
  symlinkSync, lstatSync, readFileSync,
} from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { inspect, applyOne } from './sync.mjs'

// ─────────────────────────────────────────────
// 夹具
// ─────────────────────────────────────────────
function fixture({ dirLevel = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'sync-test-'))
  const src = join(root, 'src')
  const dst = join(root, 'dst')
  mkdirSync(src)
  mkdirSync(dst)
  const t = {
    label: 'test',
    srcDir: src,
    dstDir: dst,
    dstName: (n) => (dirLevel ? n : `rule-${n}`),
    dirLevel,
  }
  return { root, src, dst, t, done: () => rmSync(root, { recursive: true, force: true }) }
}
const write = (p, s) => writeFileSync(p, s)
const names = (d) => readdirSync(d).sort()
const dirSnapshot = (d) => names(d).map((n) => `${n}:${lstatSync(join(d, n)).size}`).join('|')
const isLink = (p) => {
  try { readFileSync; symlinkSync; return lstatSync(p).isSymbolicLink() || (() => { try { readdirSync(p); return false } catch { return false } })() }
  catch { return false }
}

// ─────────────────────────────────────────────
// 体检（只读）
// ─────────────────────────────────────────────
test('体检：源里有、运行时没有 → 报「需建链接」，且一个字都不改', () => {
  const f = fixture()
  try {
    write(join(f.src, 'a.md'), 'AAA')
    const before = dirSnapshot(f.dst)
    const r = inspect(f.t)
    assert.equal(r.needLink.length, 1)
    assert.equal(r.needLink[0].dstName, 'rule-a.md')
    assert.equal(r.ok.length, 0)
    assert.equal(dirSnapshot(f.dst), before, '体检不应改动运行时')
  } finally { f.done() }
})

test('体检：已是正确链接 → 报「已就位」', () => {
  const f = fixture()
  try {
    write(join(f.src, 'a.md'), 'AAA')
    symlinkSync(join(f.src, 'a.md'), join(f.dst, 'rule-a.md'), 'file')
    const r = inspect(f.t)
    assert.equal(r.ok.length, 1)
    assert.equal(r.needLink.length, 0)
    assert.equal(r.wrong.length, 0)
  } finally { f.done() }
})

test('体检：真实副本且内容不同 → 报「需替换」', () => {
  const f = fixture()
  try {
    write(join(f.src, 'a.md'), 'AAA')
    write(join(f.dst, 'rule-a.md'), 'OLD')
    const r = inspect(f.t)
    assert.equal(r.wrong.length, 1)
    assert.match(r.wrong[0].why, /过时/)
  } finally { f.done() }
})

test('体检：旧名残留（内容与源一致的真实文件）→ 报「待迁移」，并指出将换成哪个新名', () => {
  const f = fixture()
  try {
    write(join(f.src, 'a.md'), 'AAA')
    write(join(f.dst, 'rule-1700000000000.md'), 'AAA')
    const r = inspect(f.t)
    assert.equal(r.legacy.length, 1)
    assert.equal(r.legacy[0].dstName, 'rule-a.md')
    assert.equal(r.orphans.length, 0)
  } finally { f.done() }
})

test('体检：源目录不存在 → 抛错（期望(新)：不能静默当"无事发生"）', () => {
  const f = fixture()
  try {
    rmSync(f.src, { recursive: true, force: true })
    assert.throws(() => inspect(f.t), /源目录不存在/)
  } finally { f.done() }
})

test('体检：我们自己留下的失效链接 → 归「staleSelf(待清理)」，不算孤儿（期望(新)）', () => {
  const f = fixture()
  try {
    write(join(f.src, 'a.md'), 'AAA')
    // 一条指向"源目录内已不存在的文件"的链接 —— 是我们自己的残留
    symlinkSync(join(f.src, 'gone.md'), join(f.dst, 'rule-gone.md'), 'file')
    const r = inspect(f.t)
    assert.equal(r.staleSelf.length, 1, '应识别为自己的残留')
    assert.equal(r.orphans.length, 0, '不能当成"用户资产"保护起来')
  } finally { f.done() }
})

test('体检：无关目录 → 报「孤儿」，不会被误伤', () => {
  const f = fixture()
  try {
    write(join(f.src, 'a.md'), 'AAA')
    mkdirSync(join(f.dst, 'some-other-tool'))
    const r = inspect(f.t)
    assert.equal(r.orphans.length, 1)
    assert.equal(r.orphans[0].name, 'some-other-tool')
    applyOne(r, { replace: true, rmOld: true })
    assert.ok(names(f.dst).includes('some-other-tool'), '孤儿必须原样保留')
  } finally { f.done() }
})

// ─────────────────────────────────────────────
// 执行（--apply 的语义）
// ─────────────────────────────────────────────
test('apply：缺失的建链接', () => {
  const f = fixture()
  try {
    write(join(f.src, 'a.md'), 'AAA')
    const r = inspect(f.t)
    applyOne(r, {})
    assert.equal(readFileSync(join(f.dst, 'rule-a.md'), 'utf8'), 'AAA')
    const r2 = inspect(f.t)
    assert.equal(r2.ok.length, 1)
    assert.equal(r2.needLink.length, 0)
  } finally { f.done() }
})

test('apply 不带 replace：**不删**真实副本，也不建链接（期望(新)：安全默认）', () => {
  const f = fixture()
  try {
    write(join(f.src, 'a.md'), 'AAA')
    write(join(f.dst, 'rule-a.md'), 'OLD')
    const r = inspect(f.t)
    applyOne(r, {})
    assert.equal(readFileSync(join(f.dst, 'rule-a.md'), 'utf8'), 'OLD', '真实副本必须原样保留')
  } finally { f.done() }
})

test('apply 带 replace：真实副本换成链接', () => {
  const f = fixture()
  try {
    write(join(f.src, 'a.md'), 'AAA')
    write(join(f.dst, 'rule-a.md'), 'OLD')
    const r = inspect(f.t)
    applyOne(r, { replace: true })
    assert.equal(readFileSync(join(f.dst, 'rule-a.md'), 'utf8'), 'AAA', '应指向源内容')
    assert.equal(inspect(f.t).ok.length, 1)
  } finally { f.done() }
})

test('apply 不带 rm-old：旧名残留保留', () => {
  const f = fixture()
  try {
    write(join(f.src, 'a.md'), 'AAA')
    write(join(f.dst, 'rule-1700000000000.md'), 'AAA')
    const r = inspect(f.t)
    applyOne(r, {})
    assert.ok(names(f.dst).includes('rule-1700000000000.md'), '旧名不应被删')
  } finally { f.done() }
})

test('apply 带 rm-old：旧名残留被删，新名就位', () => {
  const f = fixture()
  try {
    write(join(f.src, 'a.md'), 'AAA')
    write(join(f.dst, 'rule-1700000000000.md'), 'AAA')
    const r = inspect(f.t)
    applyOne(r, { rmOld: true })
    assert.ok(!names(f.dst).includes('rule-1700000000000.md'), '旧名应被删')
    assert.equal(readFileSync(join(f.dst, 'rule-a.md'), 'utf8'), 'AAA')
  } finally { f.done() }
})

test('幂等：连续 apply 两次，第二次无事可做且状态不变', () => {
  const f = fixture()
  try {
    write(join(f.src, 'a.md'), 'AAA')
    write(join(f.src, 'b.md'), 'BBB')
    applyOne(inspect(f.t), {})
    const after1 = dirSnapshot(f.dst)
    const r2 = inspect(f.t)
    assert.equal(r2.ok.length, 2)
    assert.equal(r2.needLink.length + r2.wrong.length + r2.legacy.length, 0)
    applyOne(r2, {})
    assert.equal(dirSnapshot(f.dst), after1, '第二次 apply 不应改变任何东西')
  } finally { f.done() }
})

// ─────────────────────────────────────────────
// 目录级目标（技能那侧用 junction）
// ─────────────────────────────────────────────
test('目录级：建链接并可通过它读到源里的文件（幂等）', () => {
  const f = fixture({ dirLevel: true })
  try {
    mkdirSync(join(f.src, 'skill-a'))
    write(join(f.src, 'skill-a', 'SKILL.md'), '# hi')
    const r = inspect(f.t)
    assert.equal(r.needLink.length, 1)
    assert.equal(r.needLink[0].dstName, 'skill-a')
    applyOne(r, {})
    assert.equal(readFileSync(join(f.dst, 'skill-a', 'SKILL.md'), 'utf8'), '# hi')
    const r2 = inspect(f.t)
    assert.equal(r2.ok.length, 1)
    assert.equal(r2.needLink.length, 0)
    applyOne(r2, {})
    assert.equal(inspect(f.t).ok.length, 1)
  } finally { f.done() }
})
