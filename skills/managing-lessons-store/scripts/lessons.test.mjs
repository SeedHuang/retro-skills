import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { resolveStore, checkStore } from './lessons.mjs'

function tmp() { return mkdtempSync(join(tmpdir(), 'lessons-')) }
function makeStore(root) {
  mkdirSync(join(root, 'projects'), { recursive: true })
  mkdirSync(join(root, 'universal'), { recursive: true })
  writeFileSync(join(root, 'index.md'), '# index\n', 'utf8')
  return root
}
const emptyDeps = { isInsideGitRepo: () => false, now: () => 0 }

test('resolve：环境变量优先', () => {
  const root = makeStore(tmp())
  const r = resolveStore({ env: { LESSONS_DIR: root }, pointerPaths: [], deps: emptyDeps })
  assert.equal(r.ok, true)
  assert.equal(r.root, root)
})

test('resolve：指针文件次之', () => {
  const root = makeStore(tmp())
  const cfg = join(tmp(), 'lessons.config.json')
  writeFileSync(cfg, JSON.stringify({ store: root, schemaVersion: 1 }), 'utf8')
  const r = resolveStore({ env: {}, pointerPaths: [cfg], deps: emptyDeps })
  assert.equal(r.ok, true)
  assert.equal(r.root, root)
})

test('resolve：两者皆无 → 报无指针（引导 bootstrap）', () => {
  const r = resolveStore({ env: {}, pointerPaths: [], deps: emptyDeps })
  assert.equal(r.ok, false)
  assert.match(r.reason, /未找到错题集指针/)
  assert.match(r.hint, /bootstrap/)
})

test('checkStore：路径不存在 → 拒绝', () => {
  const r = checkStore(join(tmp(), 'nope'), emptyDeps)
  assert.equal(r.ok, false)
  assert.match(r.reason, /不存在或不是目录/)
})

test('checkStore：schemaVersion 不支持 → 拒绝', () => {
  const root = makeStore(tmp())
  const cfg = join(tmp(), 'lessons.config.json')
  writeFileSync(cfg, JSON.stringify({ store: root, schemaVersion: 99 }), 'utf8')
  const r = resolveStore({ env: {}, pointerPaths: [cfg], deps: emptyDeps })
  assert.equal(r.ok, false)
  assert.match(r.reason, /schemaVersion=99 不受支持/)
})

test('checkStore：位于 git 仓库内 → 拒绝（KB 绝不进仓库）', () => {
  const root = makeStore(tmp())
  const r = checkStore(root, { ...emptyDeps, isInsideGitRepo: () => true })
  assert.equal(r.ok, false)
  assert.match(r.reason, /位于仓库内/)
  assert.match(r.hint, /迁移到仓库外/)
})

test('checkStore：指针 JSON 损坏 → 拒绝', () => {
  const cfg = join(tmp(), 'lessons.config.json')
  writeFileSync(cfg, '{ not json', 'utf8')
  const r = resolveStore({ env: {}, pointerPaths: [cfg], deps: emptyDeps })
  assert.equal(r.ok, false)
  assert.match(r.reason, /指针文件损坏/)
})

test('resolve：env 与可用指针并存 → env 胜出', () => {
  const rootA = makeStore(tmp())
  const rootB = makeStore(tmp())
  const cfg = join(tmp(), 'lessons.config.json')
  writeFileSync(cfg, JSON.stringify({ store: rootB, schemaVersion: 1 }), 'utf8')
  const r = resolveStore({ env: { LESSONS_DIR: rootA }, pointerPaths: [cfg], deps: emptyDeps })
  assert.equal(r.ok, true)
  assert.equal(r.root, rootA)
})

import { parseDeferredSection, evaluateSignals, runDeferred } from './lessons.mjs'

const INDEX = `# index

## 候选与推迟

| 编号 | 项 | 动机 | 复活信号 |
|---|---|---|---|
| C1 | 冲突消解序列 | L-001 | 首次出现真冲突 |
| L3-1 | 三维度趋势 | L-002 | KB 条目 >= 10 且维度 >= 2 |
| L4-1 | 跨项目分析 | L-003 | KB 项目 >= 2 且条目 >= 20 |
`

test('parseDeferredSection：抽出三行', () => {
  const rows = parseDeferredSection(INDEX)
  assert.equal(rows.length, 3)
  assert.equal(rows[0].id, 'C1')
  assert.equal(rows[1].signal, 'KB 条目 >= 10 且维度 >= 2')
})

test('evaluateSignals：未达阈值 → hits=false', () => {
  const rows = parseDeferredSection(INDEX)
  const out = evaluateSignals(rows, { openCount: 3, dims: 2, projects: 1, landedCount: 0, totalCount: 3 })
  assert.equal(out.find(r => r.id === 'L3-1').hits, false)
  assert.match(out.find(r => r.id === 'L3-1').evidence, /3\/10 条, 2\/2 维度/)
})

test('evaluateSignals：达阈值 → hits=true 且带证据', () => {
  const rows = parseDeferredSection(INDEX)
  const out = evaluateSignals(rows, { openCount: 22, dims: 3, projects: 2, landedCount: 0, totalCount: 22 })
  assert.equal(out.find(r => r.id === 'L3-1').hits, true)
  assert.equal(out.find(r => r.id === 'L4-1').hits, true)
  assert.equal(out.find(r => r.id === 'C1').hits, false)
})

test('runDeferred：summary 分两分支且带计数', () => {
  const root = makeStore(tmp())
  writeFileSync(join(root, 'index.md'), INDEX, 'utf8')
  const none = runDeferred(root, { openCount: 1, dims: 1, projects: 1, landedCount: 0, totalCount: 1 })
  assert.match(none.summary, /推迟项 3 条，均未命中信号/)
  const hit = runDeferred(root, { openCount: 22, dims: 3, projects: 2, landedCount: 0, totalCount: 22 })
  assert.match(hit.summary, /推迟项 3 条（2 条命中信号）/)
})

import { validateTarget, hashTree, migrate, countLedger } from './lessons.mjs'
import { mkdirSync as mk, writeFileSync as wf } from 'node:fs'

test('validateTarget：目标 = 源 → 拒绝', () => {
  const root = makeStore(tmp())
  const r = validateTarget(root, root)
  assert.equal(r.ok, false)
  assert.match(r.reason, /目标与源相同/)
})

test('validateTarget：目标在源内 → 拒绝（防无限递归）', () => {
  const root = makeStore(tmp())
  const r = validateTarget(root, join(root, 'inner'))
  assert.equal(r.ok, false)
  assert.match(r.reason, /目标位于源内/)
})

test('validateTarget：源在目标内（目标是祖先）→ 拒绝', () => {
  const root = makeStore(tmp())
  const r = validateTarget(join(root, 'child'), root)
  assert.equal(r.ok, false)
  assert.match(r.reason, /目标是源的祖先/)
})

test('validateTarget：目标已存在且非空 → 拒绝（需显式确认）', () => {
  const root = makeStore(tmp())
  const target = tmp()
  wf(join(target, 'x.md'), 'x', 'utf8')
  const r = validateTarget(root, target)
  assert.equal(r.ok, false)
  assert.match(r.reason, /目标已存在且非空/)
})

test('migrate：成功 → 指针切换 + 哈希计数一致', () => {
  const root = makeStore(tmp())
  mk(join(root, 'projects', 'lpm'), { recursive: true })
  wf(join(root, 'projects', 'lpm', 'ledger.md'), '| ID |\n', 'utf8')
  const target = join(tmp(), 'newstore')
  const ptr = join(tmp(), 'lessons.config.json')
  const r = migrate({ from: root, to: target, deps: { pointerPath: ptr, isInsideGitRepo: () => false } })
  assert.equal(r.ok, true)
  assert.equal(r.hashCount, Object.keys(hashTree(root)).length)
  const written = JSON.parse(readFileSync(ptr, 'utf8'))
  assert.equal(written.store, resolve(target))
})

test('migrate：重复执行（源已是新位置，目标=源）→ 被四校验拦住', () => {
  const root = makeStore(tmp())
  const r = migrate({ from: root, to: root, deps: { pointerPath: join(tmp(), 'c.json'), isInsideGitRepo: () => false } })
  assert.equal(r.ok, false)
  assert.match(r.reason, /目标与源相同/)
})

test('countLedger：统计 open 数、总条数、维度数、项目数、landed 数', () => {
  const root = makeStore(tmp())
  mk(join(root, 'projects', 'p1'), { recursive: true })
  mk(join(root, 'projects', 'p2'), { recursive: true })
  const row = (id, dim, status) => `| ${id} | 2026-09-27 | p1 | 复盘 | x | y | ${dim} | z | rule(全局) | ${status} |\n`
  wf(join(root, 'projects', 'p1', 'ledger.md'), row('L-1', '性能', 'open') + row('L-2', '健壮度', 'open') + row('L-3', '健壮度', 'landed(→rule(全局))'), 'utf8')
  wf(join(root, 'projects', 'p2', 'ledger.md'), row('L-4', '性能', 'open'), 'utf8')
  const c = countLedger(root)
  assert.equal(c.projects, 2)
  assert.equal(c.openCount, 3)
  assert.equal(c.landedCount, 1)
  assert.equal(c.totalCount, 4)
  assert.equal(c.dims, 2)
})

test('countLedger：跳过表头与分隔行（dims 不被 |---| 污染）', () => {
  const root = makeStore(tmp())
  mk(join(root, 'projects', 'p1'), { recursive: true })
  const header = '| ID | 日期 | 项目 | 来源 | 问题 | 根因 | 维度 | 修复 | 载体 | 状态 |\n'
  const sep = '|---|---|---|---|---|---|---|---|---|---|\n'
  const row = '| L-1 | 2026-09-27 | p1 | 复盘 | x | y | 性能 | z | rule(全局) | open |\n'
  wf(join(root, 'projects', 'p1', 'ledger.md'), header + sep + row, 'utf8')
  const c = countLedger(root)
  assert.equal(c.openCount, 1)
  assert.equal(c.totalCount, 1)
  assert.equal(c.dims, 1)
})

test('migrate：目标在仓库内 → 拒绝，且不写指针、源不变', () => {
  const root = makeStore(tmp())
  mk(join(root, 'projects', 'p1'), { recursive: true })
  wf(join(root, 'projects', 'p1', 'ledger.md'), '| ID |\n', 'utf8')
  const target = join(tmp(), 'newstore')
  const ptr = join(tmp(), 'lessons.config.json')
  const before = hashTree(root)
  const r = migrate({ from: root, to: target, deps: { pointerPath: ptr, isInsideGitRepo: () => true } })
  assert.equal(r.ok, false)
  assert.equal(r.stage, 'validate-target')
  assert.equal(existsSync(ptr), false)
  assert.deepEqual(hashTree(root), before)
})

test('migrate：复制后校验失败 → 不写指针、源不变、副本保留', () => {
  const root = makeStore(tmp())
  mk(join(root, 'projects', 'p1'), { recursive: true })
  wf(join(root, 'projects', 'p1', 'ledger.md'), '| ID |\n', 'utf8')
  const target = join(tmp(), 'newstore')
  const ptr = join(tmp(), 'lessons.config.json')
  const before = hashTree(root)
  const r = migrate({
    from: root,
    to: target,
    deps: {
      pointerPath: ptr,
      isInsideGitRepo: () => false,
      copyFile: (src, dest) => wf(dest, 'corrupted', 'utf8'),
    },
  })
  assert.equal(r.ok, false)
  assert.equal(r.stage, 'verify')
  assert.equal(existsSync(ptr), false)
  assert.deepEqual(hashTree(root), before)
  assert.equal(existsSync(target), true)
})

test('migrate：四校验失败 → 源不变且无锁残留', () => {
  const root = makeStore(tmp())
  const ptr = join(tmp(), 'c.json')
  const before = hashTree(root)
  const r = migrate({ from: root, to: root, deps: { pointerPath: ptr, isInsideGitRepo: () => false } })
  assert.equal(r.ok, false)
  assert.deepEqual(hashTree(root), before)
  assert.equal(existsSync(join(root, '.migrating')), false)
})

test('checkStore：路径存在但是普通文件 → 拒绝', () => {
  const file = join(tmp(), 'not-a-dir')
  writeFileSync(file, 'x', 'utf8')
  const r = checkStore(file, emptyDeps)
  assert.equal(r.ok, false)
  assert.match(r.reason, /不存在或不是目录/)
})

test('checkStore：不可写 → 拒绝', () => {
  const root = makeStore(tmp())
  const r = checkStore(root, { ...emptyDeps, isWritable: () => false })
  assert.equal(r.ok, false)
  assert.match(r.reason, /不可写/)
  assert.match(r.hint, /可写位置/)
})

test('resolveStore：指针 store 为空串 → 拒绝', () => {
  const cfg = join(tmp(), 'lessons.config.json')
  writeFileSync(cfg, JSON.stringify({ store: '', schemaVersion: 1 }), 'utf8')
  const r = resolveStore({ env: {}, pointerPaths: [cfg], deps: emptyDeps })
  assert.equal(r.ok, false)
  assert.match(r.reason, /缺少有效的 "store"/)
})

test('resolveStore：含 BOM 的合法指针 → 剥 BOM 后解析成功（不误报损坏）', () => {
  const root = makeStore(tmp())
  const cfg = join(tmp(), 'lessons.config.json')
  writeFileSync(cfg, '\uFEFF' + JSON.stringify({ store: root, schemaVersion: 1 }), 'utf8')
  const r = resolveStore({ env: {}, pointerPaths: [cfg], deps: emptyDeps })
  assert.equal(r.ok, true)
  assert.equal(r.root, root)
})

import { isDirectRun } from './lessons.mjs'
import { symlinkSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

test('isDirectRun：经 junction 安装目录启动 → 仍判为"直接执行"（否则 CLI 静默不执行）', () => {
  const real = mkdtempSync(join(tmpdir(), 'lessons-real-'))
  const linkRoot = mkdtempSync(join(tmpdir(), 'lessons-link-'))
  try {
    const realFile = join(real, 'mod.mjs')
    writeFileSync(realFile, '// x', 'utf8')
    const linkDir = join(linkRoot, 'mod-link')
    symlinkSync(real, linkDir, 'junction') // junction 不需要开发者模式
    assert.equal(isDirectRun(join(linkDir, 'mod.mjs'), pathToFileURL(realFile).href), true, '经 junction 进入应算直接执行')
    assert.equal(isDirectRun(realFile, pathToFileURL(realFile).href), true, '真实路径也应算')
    assert.equal(isDirectRun(join(real, 'other.mjs'), pathToFileURL(realFile).href), false, '别的文件不算')
    assert.equal(isDirectRun(undefined, pathToFileURL(realFile).href), false, '拿不到入口路径时不算')
  } finally {
    rmSync(real, { recursive: true, force: true })
    rmSync(linkRoot, { recursive: true, force: true })
  }
})
