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

test('countLedger：新 11 列 schema（含"对象"列）计数正确——状态列不按旧下标找', () => {
  const root = makeStore(tmp())
  mk(join(root, 'projects', 'p1'), { recursive: true })
  const header = '| ID | 日期 | 归属 | 来源 | 问题 | 根因 | 维度 | 修复 | 对象 | 载体 | 状态 |\n'
  const sep = '|---|---|---|---|---|---|---|---|---|---|---|\n'
  const row = (id, dim, status) => `| ${id} | 2026-09-28 | p1 | 复盘 | x | y | ${dim} | z | skill | skill | ${status} |\n`
  wf(join(root, 'projects', 'p1', 'ledger.md'), header + sep
    + row('L-001', '健壮度', 'open')
    + row('L-002', '用户体验', 'landed(→skill)')
    + row('L-003', '性能', 'moved(→skills\\evolving-skills)'), 'utf8')
  const c = countLedger(root)
  assert.equal(c.openCount, 1)
  assert.equal(c.landedCount, 1)
  assert.equal(c.totalCount, 2) // moved 是迁移墓碑，不计入
  assert.equal(c.dims, 2) // moved 行的独特维度也不计入（与 statsLedger 同口径）
})

test('countLedger：扫全三区——skills/<名>/ledger.md 与 universal/ledger.md 都计入', () => {
  const root = makeStore(tmp())
  mk(join(root, 'projects', 'p1'), { recursive: true })
  mk(join(root, 'skills', 's1'), { recursive: true })
  const header = '| ID | 日期 | 归属 | 来源 | 问题 | 根因 | 维度 | 修复 | 对象 | 载体 | 状态 |\n'
  const sep = '|---|---|---|---|---|---|---|---|---|---|---|\n'
  const row = (id, status) => `| ${id} | 2026-09-28 | x | 复盘 | x | y | 性能 | z | skill | skill | ${status} |\n`
  wf(join(root, 'projects', 'p1', 'ledger.md'), header + sep + row('L-1', 'open'), 'utf8')
  wf(join(root, 'skills', 's1', 'ledger.md'), header + sep + row('L-2', 'landed(→skill)'), 'utf8')
  wf(join(root, 'universal', 'ledger.md'), header + sep + row('L-3', 'open'), 'utf8')
  const c = countLedger(root)
  assert.equal(c.projects, 1)
  assert.equal(c.openCount, 2)
  assert.equal(c.landedCount, 1)
  assert.equal(c.totalCount, 3)
})

import { statsLedger } from './lessons.mjs'

test('statsLedger：三区×维度分布、区域账本数、薄弱面（moved 不计）', () => {
  const root = makeStore(tmp())
  mk(join(root, 'projects', 'p1'), { recursive: true })
  mk(join(root, 'skills', 's1'), { recursive: true })
  const header = '| ID | 日期 | 归属 | 来源 | 问题 | 根因 | 维度 | 修复 | 对象 | 载体 | 状态 |\n'
  const sep = '|---|---|---|---|---|---|---|---|---|---|---|\n'
  const row = (id, dim, status) => `| ${id} | 2026-09-28 | x | 复盘 | x | y | ${dim} | z | skill | skill | ${status} |\n`
  wf(join(root, 'projects', 'p1', 'ledger.md'), header + sep
    + row('L-1', '健壮度', 'open') + row('L-2', '性能', 'landed(→rule(全局))'), 'utf8')
  wf(join(root, 'skills', 's1', 'ledger.md'), header + sep
    + row('L-3', '健壮度', 'open') + row('L-4', '健壮度', 'open')
    + row('L-5', '健壮度', 'moved(→x)'), 'utf8')
  wf(join(root, 'universal', 'ledger.md'), header + sep
    + row('L-6', '用户体验', 'open') + row('L-7', '用户体验', 'landed(→skill)'), 'utf8')
  const s = statsLedger(root)
  assert.equal(s.totalCount, 6)
  assert.deepEqual(s.regions, { projects: 1, skills: 1, universal: 1 }) // 账本数（存储数）非行数——L4-1 前置"项目 ≥ 2"按此口径
  assert.deepEqual(s.dims['健壮度'], { total: 3, open: 3, landed: 0 })
  assert.deepEqual(s.dims['性能'], { total: 1, open: 0, landed: 1 })
  assert.deepEqual(s.dims['用户体验'], { total: 2, open: 1, landed: 1 })
  assert.deepEqual(s.weakest, ['性能'])
})

test('statsLedger：weakest 并列时全列（两维度并列最少）', () => {
  const root = makeStore(tmp())
  mk(join(root, 'projects', 'p1'), { recursive: true })
  const header = '| ID | 日期 | 归属 | 来源 | 问题 | 根因 | 维度 | 修复 | 对象 | 载体 | 状态 |\n'
  const sep = '|---|---|---|---|---|---|---|---|---|---|---|\n'
  const row = (id, dim, status) => `| ${id} | 2026-09-28 | x | 复盘 | x | y | ${dim} | z | skill | skill | ${status} |\n`
  wf(join(root, 'projects', 'p1', 'ledger.md'), header + sep
    + row('L-1', '性能', 'open')
    + row('L-2', '用户体验', 'landed(→skill)')
    + row('L-3', '健壮度', 'open') + row('L-4', '健壮度', 'open'), 'utf8')
  const s = statsLedger(root)
  assert.deepEqual(s.weakest.sort(), ['性能', '用户体验'])
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

import { momentAdd, momentResolve, momentDrop, sanitizeProjectId, momentsSummary, showEntry, findEntries, sizeGuard, sessionId, sanitizeDirSegment, findSessionDir } from './lessons.mjs'

test('sessionId：首句 hash 稳定 + 空白归一化（换行 / 全角空格 / emoji）', () => {
  assert.equal(sessionId('我发现一个问题，retro-skills不负责rule的同步和管理吗？'), '51e11408')
  assert.equal(sessionId('  x  '), sessionId('x'))
  assert.equal(sessionId('a  b\nc'), sessionId('a b c'))
  assert.equal(sessionId('a\u3000b'), sessionId('a b'))
  assert.equal(sessionId('😀  hi'), sessionId('😀 hi'))
  assert.notEqual(sessionId('a'), sessionId('b'))
})

test('sanitizeDirSegment：Windows 保留字符 / 结尾点 / 截断 / 空 → 退化', () => {
  assert.equal(sanitizeDirSegment('a<b>c:d"e/f\\g|h?i*j'), 'abcdefghij')
  assert.equal(sanitizeDirSegment('结尾点...'), '结尾点')
  assert.equal(sanitizeDirSegment('a   b'), 'a-b')
  assert.equal(sanitizeDirSegment('<>:"/\\|?*'), '')
  assert.equal(sanitizeDirSegment('x'.repeat(30)).length, 20)
})

test('findSessionDir：段匹配 / 多命中报错 / 不被摘要里的同串骗到', () => {
  const root = makeStore(tmp())
  const mk = (d) => mkdirSync(join(root, 'projects', 'p', d), { recursive: true })
  mk('2026-10-01-aaaabbbb-第一句摘要')
  mk('2026-10-01-ccccdddd')
  mk('2026-10-04-eeeeeeee')
  mk('2026-10-04-eeeeeeee-另一个')
  mk('2026-10-05-ffffffff')
  mk('2026-10-05-11111111-摘要里含-ffffffff-的串')
  assert.equal(findSessionDir(root, 'p', '2026-10-01', 'aaaabbbb').dir, '2026-10-01-aaaabbbb-第一句摘要')
  assert.equal(findSessionDir(root, 'p', '2026-10-01', 'ccccdddd').dir, '2026-10-01-ccccdddd')
  assert.equal(findSessionDir(root, 'p', '2026-10-01', '99999999').dir, null)   // 同日多目录、未命中 → 不猜
  assert.equal(findSessionDir(root, 'p', '2026-10-04', 'eeeeeeee').ok, false)  // 多命中 → 报错
  assert.equal(findSessionDir(root, 'p', '2026-10-05', 'ffffffff').dir, '2026-10-05-ffffffff') // 段匹配，不假命中
})

test('findSessionDir：sid 缺失 + 同日恰好一个目录 → 兜底复用；sid 在场但不匹配 → 不复用', () => {
  const root = makeStore(tmp())
  mkdirSync(join(root, 'projects', 'p', '2026-10-06-onlyone'), { recursive: true })
  const fb = findSessionDir(root, 'p', '2026-10-06', '')              // sid 缺失 → 兜底
  assert.equal(fb.ok, true)
  assert.equal(fb.dir, '2026-10-06-onlyone')
  assert.equal(fb.fallback, true)
  const strict = findSessionDir(root, 'p', '2026-10-06', '12121212')  // sid 在场却不匹配 → 不复用
  assert.equal(strict.ok, true)
  assert.equal(strict.dir, null)
})

test('moment add：--summary 定目录名；已存在则复用且忽略新摘要', () => {
  const root = makeStore(tmp())
  const r1 = momentAdd(root, { project: 'p', session: 'aaaabbbb', polarity: '负面', problem: 'x', evidence: 'y', reason: 'r', date: '2026-10-01', summary: '第一句摘要' })
  assert.equal(r1.dir, '2026-10-01-aaaabbbb-第一句摘要')
  assert.equal(r1.id, 'M-aaaabbbb-1')
  const r2 = momentAdd(root, { project: 'p', session: 'aaaabbbb', polarity: '正面', problem: 'y', evidence: 'z', reason: 'r', date: '2026-10-01', summary: '换个摘要' })
  assert.equal(r2.dir, r1.dir)   // 名字不变
  assert.equal(r2.id, 'M-aaaabbbb-2')
})

test('moment add：无 --summary → 目录名退化为 <日期>-<sid>', () => {
  const root = makeStore(tmp())
  const r = momentAdd(root, { project: 'p', session: 'aaaabbbb', polarity: '负面', problem: 'x', evidence: 'y', reason: 'r', date: '2026-10-01' })
  assert.equal(r.dir, '2026-10-01-aaaabbbb')
})

test('moment add：碰撞护栏——命中目录但首句不一致 → 报错、不写入', () => {
  const root = makeStore(tmp())
  const dir = join(root, 'projects', 'p', '2026-10-01-aaaabbbb')
  mkdirSync(dir, { recursive: true })
  const facts = join(dir, 'facts.md')
  writeFileSync(facts, '# 事实包\n\n- session：aaaabbbb｜首句：甲｜memory id：—\n', 'utf8')
  const before = readFileSync(facts, 'utf8')
  const r = momentAdd(root, { project: 'p', session: 'aaaabbbb', polarity: '负面', problem: 'x', evidence: 'y', reason: 'r', date: '2026-10-01', firstMessage: '乙' })
  assert.equal(r.ok, false)
  assert.match(r.reason, /首句不一致/)
  assert.equal(existsSync(join(dir, 'moments.md')), false)   // 没写入
  assert.equal(readFileSync(facts, 'utf8'), before)
})

test('moment add：首句一致 → 碰撞护栏放行', () => {
  const root = makeStore(tmp())
  const dir = join(root, 'projects', 'p', '2026-10-01-aaaabbbb')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'facts.md'), '- session：aaaabbbb｜首句：甲｜memory id：—\n', 'utf8')
  const r = momentAdd(root, { project: 'p', session: 'aaaabbbb', polarity: '负面', problem: 'x', evidence: 'y', reason: 'r', date: '2026-10-01', firstMessage: '甲' })
  assert.equal(r.ok, true)
})

const LEDGER_HEADER = '| ID | 日期 | 归属 | 来源 | 问题 | 根因 | 维度 | 修复 | 载体 | 状态 |\n'
const LEDGER_SEP = '|---|---|---|---|---|---|---|---|---|---|\n'

test('sanitizeProjectId：清洗路径穿越 / 分隔符 / 空白折 -', () => {
  assert.equal(sanitizeProjectId('../..').includes('/'), false)
  assert.equal(sanitizeProjectId('a|b/c\\d'), 'abcd')
  assert.equal(sanitizeProjectId(' my project '), 'my-project')
})

test('moment add：缺 --polarity → 拒绝', () => {
  const root = makeStore(tmp())
  const r = momentAdd(root, { project: 'p', session: 'aaaaaaaa', problem: 'x' })
  assert.equal(r.ok, false)
  assert.match(r.reason, /极性/)
})

test('moment add：缺 --session → 拒绝', () => {
  const root = makeStore(tmp())
  const r = momentAdd(root, { project: 'p', polarity: '负面', problem: 'x', cause: 'y', attitude: 'z', date: '2026-10-01' })
  assert.equal(r.ok, false)
  assert.match(r.reason, /--session/)
})

test('moment add：缺 --date → 拒绝（session 目录不能静默落错天）', () => {
  const root = makeStore(tmp())
  const r = momentAdd(root, { project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'x', evidence: 'y', reason: 'r' })
  assert.equal(r.ok, false)
  assert.match(r.reason, /--date/)
})

test('校验：--session 非 8 位小写 hex → 拒绝（防段匹配混淆 / 正则注入 / 误传非 sid 值）', () => {
  const root = makeStore(tmp())
  const base = { project: 'p', polarity: '负面', problem: 'x', evidence: 'y', reason: 'r', date: '2026-10-01' }
  const bad = [
    'a-b', 'a b', 'a(b', 'a.b', 'a*', 'a|b', 'x'.repeat(33),  // 分隔符 / 空白 / 正则元字符 / 超长
    'foo', 'aaaaaaa', 'aaaaaaaaa',                             // 非 hex / 长度不足 / 长度超出
    'F42185FC',                                                // 大写（人会手打）
    '6abcf9b6c5b89322c8b0eb0d',                                // memory 的 session_id（"形态合法"但不是 sid）
  ]
  for (const s of bad) {
    const r = momentAdd(root, { ...base, session: s })
    assert.equal(r.ok, false, `应拒绝 session=${s}`)
    assert.match(r.reason, /--session/)
  }
  assert.equal(momentAdd(root, { ...base, session: '51e11408' }).ok, true)
})

test('校验：--project 为 . / .. → 拒绝，不写到 projects/ 之外', () => {
  const root = makeStore(tmp())
  for (const bad of ['.', '..']) {
    const r = momentAdd(root, { project: bad, session: 'aaaabbbb', polarity: '负面', problem: 'x', evidence: 'y', reason: 'r', date: '2026-10-01' })
    assert.equal(r.ok, false, `应拒绝 project=${bad}`)
    assert.match(r.reason, /项目标识/)
  }
  assert.equal(existsSync(join(root, '2026-10-01-aaaabbbb')), false)          // 没逃到 root 下
  assert.equal(existsSync(join(root, 'projects', '2026-10-01-aaaabbbb')), false)
})

test('校验：moment drop 同样拒非法 sid', () => {
  const root = makeStore(tmp())
  const r = momentDrop(root, { project: 'p', date: '2026-10-01', session: 'a-b' })
  assert.equal(r.ok, false)
  assert.match(r.reason, /--session/)
})

test('moment add：负面缺 --evidence → 拒绝', () => {
  const root = makeStore(tmp())
  const r = momentAdd(root, { project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'x', cause: 'y', attitude: 'z', date: '2026-10-01' })
  assert.equal(r.ok, false)
  assert.match(r.reason, /--evidence/)
})

test('moment add：写入首条 + 目录自建 + 无 BOM', () => {
  const root = makeStore(tmp())
  const r = momentAdd(root, { project: 'p', session: 'eeeeeeee', polarity: '负面', problem: '连续三轮没听懂', cause: '用了术语', attitude: '打断', evidence: '像天书', date: '2026-10-01', reason: '判据：对象=人→贬→负面' })
  assert.equal(r.ok, true)
  assert.equal(r.id, 'M-eeeeeeee-1')
  const file = join(root, 'projects', 'p', '2026-10-01-eeeeeeee', 'moments.md')
  assert.equal(existsSync(file), true)
  const buf = readFileSync(file)
  assert.notEqual(buf[0], 0xEF) // 无 BOM
  const text = buf.toString('utf8')
  assert.match(text, /## M-eeeeeeee-1/)
  assert.match(text, /- 判据（思考过程）：判据：对象=人→贬→负面/) // 判据行在证据行之前输出
  assert.ok(text.indexOf('- 判据（思考过程）：') < text.indexOf('- 证据（原话）：')) // 判据先于证据
})

test('moment add：同日第二条 → ID 递增（N 按 sid 计）', () => {
  const root = makeStore(tmp())
  momentAdd(root, { project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'a', cause: 'b', attitude: 'c', evidence: '原话一', date: '2026-10-01', reason: '判据：对象=人→贬→负面' })
  const r = momentAdd(root, { project: 'p', session: 'aaaaaaaa', polarity: '正面', problem: '认可', evidence: '不错', date: '2026-10-01', reason: '判据：对象=人→夸→正面' })
  assert.equal(r.id, 'M-aaaaaaaa-2')
})

test('moment add：migrating 锁存在 → 拒绝', () => {
  const root = makeStore(tmp())
  writeFileSync(join(root, '.migrating'), 'x', 'utf8')
  const r = momentAdd(root, { project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'a', cause: 'b', attitude: 'c', evidence: 'x' })
  assert.equal(r.ok, false)
  assert.match(r.reason, /迁移中/)
})

test('moment add：--project 含路径分隔符 → 清洗后仍落在 projects/ 内（不穿越）', () => {
  const root = makeStore(tmp())
  const r = momentAdd(root, { project: '../../etc', session: 'aaaaaaaa', polarity: '负面', problem: 'a', cause: 'b', attitude: 'c', evidence: 'x', date: '2026-10-01', reason: '判据：对象=人→贬→负面' })
  assert.equal(r.ok, true)
  assert.equal(r.file, join(root, 'projects', '....etc', '2026-10-01-aaaaaaaa', 'moments.md'))
})

test('moment resolve：找不到 ID → 报错且文件不变', () => {
  const root = makeStore(tmp())
  momentAdd(root, { project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'a', cause: 'b', attitude: 'c', evidence: 'x', date: '2026-10-01', reason: '判据：对象=人→贬→负面' })
  const file = join(root, 'projects', 'p', '2026-10-01-aaaaaaaa', 'moments.md')
  const before = readFileSync(file, 'utf8')
  const r = momentResolve(root, { project: 'p', id: 'M-aaaaaaaa-9', solution: 'x' })
  assert.equal(r.ok, false)
  assert.equal(readFileSync(file, 'utf8'), before)
})

test('moment resolve：只改指定条目，其余字节不变', () => {
  const root = makeStore(tmp())
  momentAdd(root, { project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'a', cause: 'b', attitude: 'c', evidence: 'x', date: '2026-10-01', reason: '判据：对象=人→贬→负面' })
  momentAdd(root, { project: 'p', session: 'aaaaaaaa', polarity: '正面', problem: '认可', evidence: '好', date: '2026-10-01', reason: '判据：对象=人→夸→正面' })
  const file = join(root, 'projects', 'p', '2026-10-01-aaaaaaaa', 'moments.md')
  const before = readFileSync(file, 'utf8')
  const tail = before.slice(before.indexOf('## M-aaaaaaaa-2'))
  const r = momentResolve(root, { project: 'p', id: 'M-aaaaaaaa-1', solution: '改用大白话', cost: '3 轮' })
  assert.equal(r.ok, true)
  const after = readFileSync(file, 'utf8')
  assert.match(after, /- 状态：已解决/)
  assert.match(after, /- 解法：改用大白话｜代价：3 轮/)
  assert.equal(after.includes(tail), true) // 第二条一字未动
})

test('moment resolve：旧 id（M-<日期>-N）在 session 目录里同样可定位', () => {
  const root = makeStore(tmp())
  const dir = join(root, 'projects', 'p', '2026-09-30-6abcf3ed')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'moments.md'),
    '# 情绪记录（moments）\n\n## M-2026-09-30-1\n- 极性：负面｜项目：p｜session：6abcf3ed｜message：—｜时间：2026-09-30\n- 状态：未解决\n- 问题：旧条目\n- 证据（原话）：\n  > 旧原话\n- 解法：（结案时补）｜代价：（结案时补）\n', 'utf8')
  const r = momentResolve(root, { project: 'p', id: 'M-2026-09-30-1', solution: '修复', cost: '1 轮' })
  assert.equal(r.ok, true)
  const after = readFileSync(join(dir, 'moments.md'), 'utf8')
  assert.match(after, /- 状态：已解决/)
  assert.match(after, /- 解法：修复｜代价：1 轮/)
})

test('moment resolve：同一 id 命中多个目录 → 报错（歧义）', () => {
  const root = makeStore(tmp())
  const body = '# 情绪记录（moments）\n\n## M-aaaa0001-1\n- 极性：负面｜项目：p｜session：aaaa0001｜message：—｜时间：2026-10-01\n- 状态：未解决\n- 问题：x\n- 证据（原话）：\n  > y\n- 解法：（结案时补）｜代价：（结案时补）\n'
  for (const d of ['2026-10-01-aaaa0001', '2026-10-02-aaaa0001']) {
    mkdirSync(join(root, 'projects', 'p', d), { recursive: true })
    writeFileSync(join(root, 'projects', 'p', d, 'moments.md'), body, 'utf8')
  }
  const r = momentResolve(root, { project: 'p', id: 'M-aaaa0001-1', solution: 'x' })
  assert.equal(r.ok, false)
  assert.match(r.reason, /歧义/)
})

test('momentsSummary：统计条数与未结案数', () => {
  const root = makeStore(tmp())
  momentAdd(root, { project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'a', cause: 'b', attitude: 'c', evidence: 'x', date: '2026-10-01', reason: '判据：对象=人→贬→负面' })
  momentAdd(root, { project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'd', cause: 'e', attitude: 'f', evidence: 'y', date: '2026-10-01', reason: '判据：对象=事→贬→负面' })
  momentResolve(root, { project: 'p', id: 'M-aaaaaaaa-1', solution: 'x' })
  const s = momentsSummary(root, 'p')
  assert.equal(s.total, 2)
  assert.equal(s.open, 1)
})

test('momentsSummary：跨 session 目录聚合统计', () => {
  const root = makeStore(tmp())
  momentAdd(root, { project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'a', evidence: 'x', date: '2026-10-01', reason: 'r' })
  momentAdd(root, { project: 'p', session: 'bbbbbbbb', polarity: '正面', problem: 'b', evidence: 'y', date: '2026-10-02', reason: 'r' })
  const s = momentsSummary(root, 'p')
  assert.equal(s.total, 2)
  assert.equal(s.open, 1) // 10-01 负面未结案；10-02 正面不参与结案统计
  assert.equal(existsSync(join(root, 'projects', 'p', '2026-10-01-aaaaaaaa', 'moments.md')), true)
  assert.equal(existsSync(join(root, 'projects', 'p', '2026-10-02-bbbbbbbb', 'moments.md')), true)
})

test('守卫：momentAdd 生成头 ↔ moments-template §模板 头部逐字一致（防第二份真相漂移）', () => {
  const root = makeStore(tmp())
  momentAdd(root, { project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'a', evidence: 'x', date: '2026-10-01', reason: 'r' })
  const generated = readFileSync(join(root, 'projects', 'p', '2026-10-01-aaaaaaaa', 'moments.md'), 'utf8')
  const genHeader = generated.slice(0, generated.indexOf('## M-')).trimEnd()
  const tpl = readFileSync(new URL('../assets/moments-template.md', import.meta.url), 'utf8')
  const m = tpl.match(/```markdown\n([\s\S]*?)\n```/)
  assert.ok(m, '模板中应有 §模板 markdown 代码块')
  const tplHeader = m[1].slice(0, m[1].indexOf('## M-')).trimEnd()
  assert.equal(genHeader, tplHeader)
})

test('showEntry / findEntries：查单条与按关键词', () => {
  const root = makeStore(tmp())
  mkdirSync(join(root, 'projects', 'p1'), { recursive: true })
  const row = '| L-1 | 2026-10-01 | p1 | 复盘 | 未核实就断言 | x | 健壮度 | z | rule | open |\n'
  writeFileSync(join(root, 'projects', 'p1', 'ledger.md'), LEDGER_HEADER + LEDGER_SEP + row, 'utf8')
  const s = showEntry(root, 'L-1')
  assert.equal(s.ok, true)
  assert.equal(s.entry.status, 'open')
  assert.equal(s.entry.dim, '健壮度')
  const f = findEntries(root, '未核实')
  assert.equal(f.length, 1)
  assert.equal(f[0].id, 'L-1')
})

test('sizeGuard：open 超阈值 → 提示', () => {
  const root = makeStore(tmp())
  mkdirSync(join(root, 'projects', 'p1'), { recursive: true })
  let body = ''
  for (let i = 1; i <= 25; i++) body += `| L-${i} | 2026-10-01 | p1 | 复盘 | x | y | 健壮度 | z | 未定 | open |\n`
  writeFileSync(join(root, 'projects', 'p1', 'ledger.md'), LEDGER_HEADER + LEDGER_SEP + body, 'utf8')
  const g = sizeGuard(root)
  assert.equal(g.length, 1)
  assert.equal(g[0].open, 25)
})

test('moment resolve：解法含 | 和 \ → 转义后不破坏结构', () => {
  const root = makeStore(tmp())
  momentAdd(root, { project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'a', cause: 'b', attitude: 'c', evidence: 'x', date: '2026-10-01', reason: '判据：对象=人→贬→负面' })
  const r = momentResolve(root, { project: 'p', id: 'M-aaaaaaaa-1', solution: 'A | B', cost: 'C \\ D' })
  assert.equal(r.ok, true)
  const after = readFileSync(join(root, 'projects', 'p', '2026-10-01-aaaaaaaa', 'moments.md'), 'utf8')
  assert.match(after, /- 解法：A \\\| B｜代价：C \\\\ D/)
})

test('moment resolve：正面/认知条目 → 报「不结案」且文件不变', () => {
  const root = makeStore(tmp())
  momentAdd(root, { project: 'p', session: 'aaaaaaaa', polarity: '正面', problem: '认可', evidence: '不错', date: '2026-10-01', reason: '判据：对象=人→夸→正面' })
  const file = join(root, 'projects', 'p', '2026-10-01-aaaaaaaa', 'moments.md')
  const before = readFileSync(file, 'utf8')
  const r = momentResolve(root, { project: 'p', id: 'M-aaaaaaaa-1', solution: 'x' })
  assert.equal(r.ok, false)
  assert.match(r.reason, /不结案/)
  assert.equal(readFileSync(file, 'utf8'), before)
})

test('moment add：新建 moments.md 头部与模板逐字一致 + 无 BOM', () => {
  const root = makeStore(tmp())
  const r = momentAdd(root, { project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'a', evidence: 'x', date: '2026-10-01', reason: '判据：对象=人→贬→负面' })
  assert.equal(r.ok, true)
  const buf = readFileSync(join(root, 'projects', 'p', '2026-10-01-aaaaaaaa', 'moments.md'))
  assert.notEqual(buf[0], 0xEF)
  const text = buf.toString('utf8')
  assert.match(text, /# 情绪记录（moments）/)
  assert.match(text, /格式权威定义见 `managing-lessons-store\/assets\/moments-template.md`（本文件只放数据）/)
  assert.match(text, /触发：agent 察觉情绪当场记（不问）；collect 时重扫覆盖本 session/)
  assert.match(text, /判定公式与 userwords 共用/)
  assert.match(text, /负面必填\*\*原话\*\*/)
  assert.match(text, /\n---\n/)
})

test('moment resolve：兼容旧极性「负向」（改名前的数据）→ 可结案', () => {
  const root = makeStore(tmp())
  // 旧数据放在 session 目录里（新布局），id 仍是旧的 M-<日期>-N 形态
  const dir = join(root, 'projects', 'p', '2026-09-30-s')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'moments.md'),
    '# 情绪记录（moments）\n\n## M-2026-09-30-1\n- 极性：负向｜项目：p｜session：s｜message：—｜时间：2026-09-30\n- 状态：未解决\n- 问题：旧条目\n- 证据（原话）：\n  > 旧原话\n- 解法：（结案时补）｜代价：（结案时补）\n', 'utf8')
  const r = momentResolve(root, { project: 'p', id: 'M-2026-09-30-1', solution: '修复', cost: '1 轮' })
  assert.equal(r.ok, true)
  const after = readFileSync(join(dir, 'moments.md'), 'utf8')
  assert.match(after, /- 状态：已解决/)
  assert.match(after, /- 解法：修复｜代价：1 轮/)
})

test('moment add：缺 --reason → 拒绝', () => {
  const root = makeStore(tmp())
  const r = momentAdd(root, { project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'a', evidence: 'x', date: '2026-10-01' })
  assert.equal(r.ok, false)
  assert.match(r.reason, /--reason/)
})

test('moment add：--date 非法格式 → 拒绝', () => {
  const root = makeStore(tmp())
  const r = momentAdd(root, { project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'a', cause: 'b', attitude: 'c', date: 'foo' })
  assert.equal(r.ok, false)
  assert.match(r.reason, /YYYY-MM-DD/)
})

test('moment add：值内换行被折掉（不注入行 / 不破块）', () => {
  const root = makeStore(tmp())
  const r = momentAdd(root, { project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: '第一行\n## 假块', cause: 'c', attitude: 'a', evidence: 'e1\ne2', date: '2026-10-01', reason: '判据：对象=人→贬→负面' })
  assert.equal(r.ok, true)
  const text = readFileSync(join(root, 'projects', 'p', '2026-10-01-aaaaaaaa', 'moments.md'), 'utf8')
  assert.equal(/^## 假块/m.test(text), false)            // 没注入出假块
  assert.equal((text.match(/^## M-/gm) || []).length, 1) // 只有 1 个真块
})

test('moment drop：只清本 session 目录的条目区，其他 session 目录不动', () => {
  const root = makeStore(tmp())
  momentAdd(root, { project: 'p', session: 'cccccccc', polarity: '负面', problem: 'a1', evidence: 'x1', date: '2026-10-01', reason: 'r' })
  momentAdd(root, { project: 'p', session: 'dddddddd', polarity: '正面', problem: 'b1', evidence: 'y1', date: '2026-10-01', reason: 'r' })
  momentAdd(root, { project: 'p', session: 'cccccccc', polarity: '认知', problem: 'a2', evidence: 'x2', date: '2026-10-01', reason: 'r' })
  const aFile = join(root, 'projects', 'p', '2026-10-01-cccccccc', 'moments.md')
  const bFile = join(root, 'projects', 'p', '2026-10-01-dddddddd', 'moments.md')
  const bBefore = readFileSync(bFile, 'utf8')
  const r = momentDrop(root, { project: 'p', date: '2026-10-01', session: 'cccccccc' })
  assert.equal(r.ok, true)
  assert.equal(r.removed, 2)                            // A 的两条被清
  const aAfter = readFileSync(aFile, 'utf8')
  assert.equal(/^## M-/m.test(aAfter), false)           // A 里已无条目
  assert.match(aAfter, /# 情绪记录（moments）/)          // 文件头保留
  assert.equal(readFileSync(bFile, 'utf8'), bBefore)    // B 目录一字未动
})

test('moment drop：目录 / moments.md 不存在 → removed 0 + fileMissing（幂等）', () => {
  const root = makeStore(tmp())
  const r = momentDrop(root, { project: 'p', date: '2026-10-01', session: 'cccccccc' })
  assert.equal(r.ok, true)
  assert.equal(r.removed, 0)
  assert.equal(r.fileMissing, true)
  assert.equal(existsSync(join(root, 'projects', 'p', '2026-10-01-cccccccc')), false)
})

test('moment drop：项目标识清洗后为空 → 拒绝', () => {
  const root = makeStore(tmp())
  const r = momentDrop(root, { project: '|||', date: '2026-10-01', session: 'cccccccc' })
  assert.equal(r.ok, false)
  assert.match(r.reason, /清洗后为空/)
})

test('moment drop：`## M-` 块一律清掉（含格式异体：缺 session 行 / 混入半角 |）', () => {
  const root = makeStore(tmp())
  mkdirSync(join(root, 'projects', 'p', '2026-10-01-cccccccc'), { recursive: true })
  const file = join(root, 'projects', 'p', '2026-10-01-cccccccc', 'moments.md')
  writeFileSync(file,
    '# 情绪记录（moments）\n\n## M-2026-10-01-1\n- 极性：负面｜项目：p｜message：—｜时间：2026-10-01\n- 证据（原话）：\n  > 手改坏了 session 行\n\n## M-2026-10-01-2\n- 极性：负面|项目：p|session：A|message：—|时间：2026-10-01\n- 证据（原话）：\n  > 半角竖线\n',
    'utf8')
  const r = momentDrop(root, { project: 'p', date: '2026-10-01', session: 'cccccccc' })
  assert.equal(r.ok, true)
  assert.equal(r.removed, 2)                            // 两个 M- 块都清掉（重扫会重写）
  assert.equal(/^## M-/m.test(readFileSync(file, 'utf8')), false)
})

test('moment drop：相邻「## 备注」块不被误删（块边界与 momentResolve 同口径）', () => {
  const root = makeStore(tmp())
  mkdirSync(join(root, 'projects', 'p', '2026-10-01-cccccccc'), { recursive: true })
  const file = join(root, 'projects', 'p', '2026-10-01-cccccccc', 'moments.md')
  writeFileSync(file,
    '# 情绪记录（moments）\n\n## M-2026-10-01-1\n- 极性：负面｜项目：p｜session：A｜message：—｜时间：2026-10-01\n- 证据（原话）：\n  > 原话一\n\n## 备注\n手加的一句说明\n',
    'utf8')
  const r = momentDrop(root, { project: 'p', date: '2026-10-01', session: 'cccccccc' })
  assert.equal(r.ok, true)
  assert.equal(r.removed, 1)
  const after = readFileSync(file, 'utf8')
  assert.equal(/^## M-2026-10-01-1/m.test(after), false)   // moment 块被删
  assert.match(after, /## 备注/)                            // 备注保住
  assert.match(after, /手加的一句说明/)
})

test('moment drop：sid 在场却不匹配 → 不碰同日唯一目录（fileMissing，防清错 session）', () => {
  const root = makeStore(tmp())
  momentAdd(root, { project: 'p', session: 'dddddddd', polarity: '正面', problem: 'b', evidence: 'y', date: '2026-10-01', reason: 'r' })
  const file = join(root, 'projects', 'p', '2026-10-01-dddddddd', 'moments.md')
  const before = readFileSync(file, 'utf8')
  const r = momentDrop(root, { project: 'p', date: '2026-10-01', session: 'cccccccc' })
  assert.equal(r.ok, true)
  assert.equal(r.fileMissing, true)
  assert.equal(readFileSync(file, 'utf8'), before)      // B 一字未动
})

test('moment drop：缺 --session / 缺 --date / migrating → 拒绝', () => {
  const root = makeStore(tmp())
  assert.match(momentDrop(root, { project: 'p', date: '2026-10-01' }).reason, /--session/)
  assert.match(momentDrop(root, { project: 'p', session: 'cccccccc' }).reason, /--date/)
  writeFileSync(join(root, '.migrating'), 'x', 'utf8')
  assert.match(momentDrop(root, { project: 'p', date: '2026-10-01', session: 'cccccccc' }).reason, /迁移中/)
})

import {
  resolveVerifyFile, confidenceOf, gradeFromDelta, compareExpect,
  verifyRecord, verifyScore, verifyTrend, verifyExpect,
} from './lessons.mjs'

test('resolveVerifyFile：技能目标 → skills/<名>/effectiveness.md', () => {
  const root = makeStore(tmp())
  mkdirSync(join(root, 'skills', 'retro-verify'), { recursive: true })
  const r = resolveVerifyFile(root, 'retro-verify')
  assert.equal(r.ok, true)
  assert.equal(r.kind, 'skill')
  assert.equal(r.file, join(root, 'skills', 'retro-verify', 'effectiveness.md'))
})

test('resolveVerifyFile：条目 ID 目标 → 该条目所在目录', () => {
  const root = makeStore(tmp())
  mkdirSync(join(root, 'projects', 'demo'), { recursive: true })
  writeFileSync(join(root, 'projects', 'demo', 'ledger.md'),
    '| ID | 日期 | 归属 | 来源 | 问题 | 根因 | 维度 | 修复 | 对象 | 载体 | 状态 |\n|---|---|---|---|---|---|---|---|---|---|---|\n| L-1 | 2026-10-01 | demo | 复盘 | 问题X | 根因Y | 健壮度 | 修复Z | rule | rule | landed(→rule(全局)) |\n', 'utf8')
  const r = resolveVerifyFile(root, 'L-1')
  assert.equal(r.ok, true)
  assert.equal(r.kind, 'entry')
  assert.equal(r.file, join(root, 'projects', 'demo', 'effectiveness.md'))
})

test('resolveVerifyFile：目标不存在 → 报错', () => {
  const root = makeStore(tmp())
  const r = resolveVerifyFile(root, 'nope')
  assert.equal(r.ok, false)
  assert.match(r.reason, /未找到目标/)
})

test('gradeFromDelta：5 档边界', () => {
  assert.equal(gradeFromDelta(-30), '明显变好')
  assert.equal(gradeFromDelta(-10), '略微变好')
  assert.equal(gradeFromDelta(0), '看不出差别')
  assert.equal(gradeFromDelta(10), '有劣化趋势')
  assert.equal(gradeFromDelta(30), '明显劣化趋势')
})

test('confidenceOf：按机会数的门槛', () => {
  assert.match(confidenceOf(1), /样本不足/)
  assert.match(confidenceOf(4), /仅定性/)
  assert.match(confidenceOf(5), /量级可参考/)
  assert.match(confidenceOf(10), /趋势可信/)
})

test('compareExpect：达到 / 未达 / 回升 / 无区间', () => {
  assert.match(compareExpect(20, '20-35', null), /达到或超出预期/)
  assert.match(compareExpect(30, '20-35', null), /区间内/)
  assert.match(compareExpect(50, '20-35', null), /未达到预期/)
  assert.match(compareExpect(50, '20-35', 40), /回升/)
  assert.match(compareExpect(20, '—', null), /不做对账/)
})

test('verifyRecord：建表头 + 追加；非负整数校验；migrating 拒绝；无 BOM', () => {
  const root = makeStore(tmp())
  mkdirSync(join(root, 'skills', 'demo'), { recursive: true })
  const file = join(root, 'skills', 'demo', 'effectiveness.md')
  const r1 = verifyRecord(root, file, { period: '改前', date: '2026-10-01', a: '6', b: '4', n: '1', p: '0' })
  assert.equal(r1.ok, true)
  const text = readFileSync(file, 'utf8')
  assert.match(text, /^\| 期 \| 日期 \| 机会A/m)
  assert.equal(/^\uFEFF/.test(text), false)
  assert.equal(verifyRecord(root, file, { period: 'x', a: '-1' }).ok, false)
  assert.equal(verifyRecord(root, file, { period: '', a: '1' }).ok, false)
  writeFileSync(join(root, '.migrating'), '', 'utf8')
  assert.match(verifyRecord(root, file, { period: 'y', a: '1' }).reason, /迁移/)
})

test('verifyScore / verifyTrend / verifyExpect：两期端到端', () => {
  const root = makeStore(tmp())
  mkdirSync(join(root, 'skills', 'demo'), { recursive: true })
  const file = join(root, 'skills', 'demo', 'effectiveness.md')
  verifyRecord(root, file, { period: '改前', date: '2026-10-01', a: '6', b: '4', n: '1', p: '0' })
  const r2 = verifyRecord(root, file, { period: '改后1', date: '2026-10-15', a: '5', b: '1', n: '0', p: '2', expect: '20-35' })
  assert.equal(r2.ok, true)

  const s = verifyScore(file)
  assert.equal(s.ok, true)
  assert.equal(s.recurrence, 20)          // 1/5 → 20%
  assert.equal(s.newProblem, 0)
  assert.equal(s.approval, 40)
  assert.match(s.confidence, /量级可参考/)  // A=5

  const t = verifyTrend(file)
  assert.equal(t.ok, true)
  assert.equal(t.points.length, 2)
  assert.equal(t.points[0].grade, '基线')
  assert.equal(t.points[0].recur, 66.7)   // 4/6
  assert.equal(t.points[1].delta, -46.7)  // 20 - 66.7
  assert.equal(t.points[1].grade, '明显变好')

  const e = verifyExpect(file)
  assert.equal(e.ok, true)
  assert.equal(e.actual, 20)
  assert.match(e.verdict, /达到或超出预期/)
})

test('verifyScore：无台账 → 报错提示先 record', () => {
  const root = makeStore(tmp())
  mkdirSync(join(root, 'skills', 'demo'), { recursive: true })
  const s = verifyScore(join(root, 'skills', 'demo', 'effectiveness.md'))
  assert.equal(s.ok, false)
  assert.match(s.reason, /尚无台账/)
})

