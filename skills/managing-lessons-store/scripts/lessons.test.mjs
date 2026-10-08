import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, readdirSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveStore, checkStore, isInsideGitRepo, argAllOf, argOneOf, momentsFileHeader, CLI_FLAGS } from './lessons.mjs'

const SKILL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')      // skills/managing-lessons-store
const RETRO_COLLECT_DIR = resolve(SKILL_DIR, '..', 'retro-collect')// skills/retro-collect
const REPO_ROOT = resolve(SKILL_DIR, '..', '..')                             // 仓库根
const LESSONS_SRC = resolve(SKILL_DIR, 'scripts', 'lessons.mjs')           // 被引用的代码

/** 递归列文件（守卫用：按扩展名筛，深度浅）
 *
 *  ⚠️ `depth > 3` 是刹车（防扫进 node_modules / .git 那种大目录），
 *  但它曾**静默截断**——超过 3 层的文件整个被跳过、且不告诉任何人，
 *  三条守卫（命令参数 / 行号引用 / 数字漂移）于是「假装扫全了」。
 *  现在把截断情况记进 `scan.truncated`，由调用方断言「没有漏」。
 *  实测 2026-10-08：仓库 59 个 md、最深 ≤3 层、漏 0 个，所以这条防线当时是「没用上」而非「已生效」。
 */
function makeScanner(maxDepth = 3) {
  const scan = { truncated: [], skippedDirs: [] }
  // 这三个目录**刻意不扫**（`.git` / `node_modules` 一个巨大且无内容价值、一个内部结构随版本变化；
  // `.session/` 是临时过程账——不进 git、做完即删，里面的行号引用 / 测试数是审查当时的快照，
  // 参与全仓一致性校对的只有 active 文档，和 handoffs 被排除是同一逻辑（2026-10-08 补）。
  // 注意：曾靠调用方的 `.filter(p => !p.includes('.git'))` 事后排除，那只滤掉了**扫到的文件**，
  // 漏扫的目录照样被记进 truncated → 首次运行时误报 12 个（实测 2026-10-08）。所以要在扫描层就跳过。
  const SKIP_DIRS = new Set(['.git', 'node_modules', '.session'])
  // `noteTruncated` 那趟下探自己的深度刹车。它只回答「有没有目标文件」，
  // 不收集、不返回，所以可以比walk 的 maxDepth 深；深到 8 层足够把「再下一层」的漏也照出来。
  const PROBE_MAX = 8
  /** 跳过的目录名（不含路径）——供调用方断言「只跳了该跳的」 */
  scan.skippedNames = () => scan.skippedDirs.map((p) => p.split(/[\\/]/).pop())
  function walk(dir, exts, depth = 0) {
    if (!existsSync(dir)) return []
    if (depth > maxDepth) { noteTruncated(dir, exts); return [] }
    const out = []
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory() && SKIP_DIRS.has(e.name)) { scan.skippedDirs.push(join(dir, e.name)); continue }
      const p = join(dir, e.name)
      if (e.isDirectory()) out.push(...walk(p, exts, depth + 1))
      else if (exts.some((x) => e.name.endsWith(x))) out.push(p)
    }
    return out
  }
  /** 超限时记下这个目录——**但要先确认它里面（含更深层）真有目标扩展名的文件**
   *
   *  ⚠️ 曾无差别记进 `truncated` —— 那不是「漏扫」，是「有个目录比较深」。
   *  实测 2026-10-08：造一个第 4 层只含 `.js` 的目录，扫 `.md` 时它照样进 truncated →
   *  断言 `truncated === []` 报「漏扫了 1 个目录」，而那个目录里**一个 md 都没有** = 假红。
   *  假红的危害比不报错更坏：它会让人养成「这条断言老是无理取闹」的习惯，
   *  于是真的漏扫时也一起忽略。
   *
   *  ⚠️ 确认范围必须是「**这一层及其下所有层**」，不是只看当前层（2026-10-08 OCR 指出）：
   *  只看当前层的话，目标文件在**再下一层**（`a/b/c/d/e/f.md`）时既不会被 walk 返回、
   *  也不会进 truncated → 调用方全绿，而那个文件里的行号引用**从来没被校验过**。
   *  曾把这条辩解写成「checked > 0 会兜」——**那是错的**：`checked > 0` 是全局「至少一处」，
   *  别的文件满足它就绿了，挡不住**某个具体文件**被漏。
   *
   *  递归下探**不会**取消深度上限：这里只回答「有没有」这一个布尔问题，不收集文件、不返回列表，
   *  且带自己的深度刹车（见 `PROBE_MAX`）。
   */
  function noteTruncated(dir, exts) {
    let hit = false
    const seen = new Set()
    /** 广度下探，直到找到目标文件或超过自己的深度刹车 */
    const probe = (d, dpt) => {
      if (hit || dpt > PROBE_MAX || seen.has(d)) return
      seen.add(d)                                     // 防软链接成环
      let entries
      try { entries = readdirSync(d, { withFileTypes: true }) } catch { hit = true; return }  // 读不到 → 当可能漏
      for (const e of entries) {
        if (hit) return
        if (e.isDirectory()) {
          if (SKIP_DIRS.has(e.name)) continue         // 与 walk 同一套跳过口径
          probe(join(d, e.name), dpt + 1)
        } else if (exts.some((x) => e.name.endsWith(x))) { hit = true; return }
      }
    }
    probe(dir, 0)
    if (hit) scan.truncated.push(dir)
  }
  return { walk, scan }
}

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

test('checkStore：位于外层 git 仓库内 → 拒绝', () => {
  const root = makeStore(tmp())
  const r = checkStore(root, { ...emptyDeps, isInsideGitRepo: () => true })
  assert.equal(r.ok, false)
  assert.match(r.reason, /位于外层 git 仓库内/)
  assert.match(r.hint, /移出该外层仓库/)
})

test('isInsideGitRepo：KB 自建仓库（p 自己即仓库根）→ 放行（不拦）', () => {
  const root = makeStore(tmp())
  mkdirSync(join(root, '.git'), { recursive: true })
  assert.equal(isInsideGitRepo(root), false)
})

test('isInsideGitRepo：KB 被套进别的仓库（上一层有 .git）→ 拦', () => {
  const outer = tmp()
  mkdirSync(join(outer, '.git'), { recursive: true })
  const root = makeStore(join(outer, 'kb'))
  assert.equal(isInsideGitRepo(root), true)
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

/** 造一份 skills 副本并 import 它的 lessons.mjs，用完即删（守卫用：改副本的模板来造故障）
 *
 *  ⚠️ 这段脚手架曾逐字出现在三处（模板缺失 / CRLF / §模板 锚定）——
 *  改一处漏两处时，「三处构造是否一致」又要靠人眼比对。
 *  抽成一处后，三条守卫跑的是**同一套构造**（2026-10-08 OCR 指出）。
 *
 *  @param {string|null} tpl 模板内容；**传 null 表示故意不放** moments-template.md（造「模板缺失」故障）
 *  @param {(mod: any) => any} fn 拿到副本模块后要做什么（抛错会照样清理）
 */
async function withSkillCopy(tpl, fn) {
  const skillRoot = mkdtempSync(join(tmpdir(), 'skill-copy-'))
  const copied = join(skillRoot, 'managing-lessons-store')
  mkdirSync(join(copied, 'scripts'), { recursive: true })
  mkdirSync(join(copied, 'assets'), { recursive: true })
  writeFileSync(join(copied, 'scripts', 'lessons.mjs'), readFileSync(LESSONS_SRC, 'utf8'))
  if (tpl !== null) writeFileSync(join(copied, 'assets', 'moments-template.md'), tpl, 'utf8')
  try {
    await fn(await import(pathToFileURL(join(copied, 'scripts', 'lessons.mjs')).href))
  } finally {
    rmSync(skillRoot, { recursive: true, force: true })
  }
}

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

import { momentAdd, momentResolve, momentDrop, sanitizeProjectId, momentsSummary, showEntry, findEntries, sizeGuard, sessionId, sanitizeDirSegment, findSessionDir, buildMoment } from './lessons.mjs'

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
  assert.equal(sanitizeDirSegment('x'.repeat(20)).length, 20)   // 边界：恰好 20 → 不截
  assert.equal(sanitizeDirSegment('x'.repeat(21)).length, 20)   // 边界：21 → 截到 20
  assert.equal(sanitizeDirSegment('x'.repeat(30)).length, 20)   // 上限 = 20（sanitizeDirSegment 默认 max）
  assert.equal(sanitizeDirSegment('a｜b'), 'ab')                // 全角竖线 ｜ 与半角 | 一样清掉（本项目字段分隔符）
  assert.equal([...sanitizeDirSegment('😀'.repeat(30))].length, 20)  // 含 emoji：按**码点**截断，不留孤立代理项
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
  const none = findSessionDir(root, 'p', '2026-10-01', '99999999')  // 同日多目录、未命中 → 不猜
  assert.equal(none.ok, true)                                        // 不是错误，只是没有可复用的目录
  assert.equal(none.dir, null)
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

test('evidence-up：传标量（误用）→ 归一为单条并告警，不静默丢数据', () => {
  const root = makeStore(tmp())
  const r = momentAdd(root, {
    project: 'p', session: 'aaaaaaab', date: '2026-10-07', summary: 't', polarity: '负面',
    problem: 'x', reason: 'r', evidence: '触发句', evidenceUp: '裸字符串上文',
  })
  assert.deepEqual(evidenceRows(readMoments(root, r.dir)), ['[上文] 裸字符串上文', '[触发] 触发句'])
  // ⚠️ 光断言输出不够——`momentAdd` 调 `buildMoment` 时**不传 warn**，告警走默认的 stderr，
  // 所以「标量被静默强转」这种回归照样能过（测试名说了「并告警」却从没断言过告警，2026-10-08 OCR 指出）。
  // 直接调导出的 `buildMoment` 并注入 warn spy，把这条真正钉住。
  const warns = []
  buildMoment({
    id: 'M-1', project: 'p', session: 'aaaaaaab', message: 'r1', date: '2026-10-07',
    polarity: '负面', problem: 'x', reason: 'r', evidence: '触发句',
    evidenceUp: '裸字符串上文', warn: (m) => warns.push(m),
  })
  assert.equal(warns.length, 1, `标量归一必须告警一次（实际 ${warns.length} 次）`)
  assert.match(warns[0], /应为数组/, '告警文案要说清是类型不对')
})

test('evidence-up：非字符串元素（对象/数组）→ 告警并跳过，不写进 KB（防 [object Object]）', () => {
  const warns = []
  const md = buildMoment({
    id: 'M-1', project: 'p', session: 'aaaaaaab', message: 'r1', date: '2026-10-07',
    polarity: '负面', problem: 'x', reason: 'r', evidence: '触发句',
    evidenceUp: [{ a: 1 }, '真上文', ['x']], warn: (m) => warns.push(m),
  })
  assert.ok(!md.includes('[object Object]'), `KB 正文里不能出现 [object Object]：\n${md}`)
  assert.ok(md.includes('[上文] 真上文'), '合法的那条要留住')
  assert.equal(warns.length, 2, `两个非法元素应各告警一次（实际 ${warns.length}）`)
  assert.match(warns[0], /只收字符串/, '告警文案要说清只收字符串')
})

test('evidence-up：有上文但**没有触发句** → 证据栏整块不输出，且必须告警（不许静默丢）', () => {
  // 证据栏的末行固定是触发句（`> [触发] …`），所以没有触发句就不能出这一栏。
  // 问题不在于「不输出」（那是结构决定的），在于**不输出却一声不响**——
  // 调用方只看到清洗告警、正文里一个字都没有，会以为自己看错了（2026-10-08 OCR 指出）。
  const warns = []
  const md = buildMoment({
    id: 'M-1', project: 'p', session: 'aaaaaaab', message: 'r1', date: '2026-10-07',
    polarity: '负面', problem: 'x', reason: 'r', evidenceUp: ['上句一', '上句二'], warn: (m) => warns.push(m),
  })
  assert.ok(!md.includes('证据'), `没有触发句时不得产出残缺的证据栏：\n${md}`)
  assert.ok(!md.includes('上句一'), '上文必须整块不出现在正文里（末行约定靠触发句成立）')
  assert.equal(warns.length, 1, `丢上文必须告警一次（实际 ${warns.length}）`)
  assert.match(warns[0], /没有触发句/, '告警要说清是「缺触发句导致整块丢弃」')
  assert.match(warns[0], /2 句/, `告警要带上被丢的句数（实际文案：${warns[0]}）`)
  // 反面：触发句在时**不得**多这条告警（否则每次正常记账都吵）
  const w2 = []
  buildMoment({
    id: 'M-2', project: 'p', session: 'aaaaaaab', message: 'r1', date: '2026-10-07',
    polarity: '负面', problem: 'x', reason: 'r', evidence: '触发句', evidenceUp: ['上句一'], warn: (m) => w2.push(m),
  })
  assert.deepEqual(w2, [], '有触发句时不得报「缺触发句」')
})

// ── argAllOf：CLI 同名参数收集（spec 2026-10-07 §4.1 的风险点）──────

test('argAllOf：同名参数收全部且保序', () => {
  const argv = ['node', 'x.mjs', 'moment', 'add', '--evidence-up', '第一句', '--polarity', '负面', '--evidence-up', '第二句']
  assert.deepEqual(argAllOf(argv, '--evidence-up'), ['第一句', '第二句'])
  assert.deepEqual(argAllOf(argv, '--polarity'), ['负面'])
})

test('argAllOf：重复传三次全收，不丢也不折叠', () => {
  const argv = ['--evidence-up', 'a', '--evidence-up', 'b', '--evidence-up', 'c']
  assert.deepEqual(argAllOf(argv, '--evidence-up'), ['a', 'b', 'c'])
})

test('argAllOf：漏值（下一个是 flag）→ 跳过 + 告警，不把 flag 当正文', () => {
  const warns = []
  const argv = ['--evidence-up', '--polarity', '负面', '--evidence-up', '真上文']
  const got = argAllOf(argv, '--evidence-up', (m) => warns.push(m))
  assert.deepEqual(got, ['真上文'], '--polarity 不能被当成上文收进来')
  assert.equal(warns.length, 1, '漏值必须告警')
  assert.match(warns[0], /后面没有值/)
})

test('argAllOf：值为空串时保留（空句合法，由 buildMoment 侧剔除）；末尾无值也不吞 undefined', () => {
  const warns = []
  assert.deepEqual(argAllOf(['--evidence-up', ''], '--evidence-up', (m) => warns.push(m)), [''])
  assert.deepEqual(argAllOf(['--evidence-up'], '--evidence-up', (m) => warns.push(m)), [], '末尾无值 → 不产出 undefined')
  assert.equal(warns.length, 1)
})

test('argAllOf：参数不存在 → 空数组', () => {
  assert.deepEqual(argAllOf(['node', 'x.mjs'], '--evidence-up'), [])
})

test('argOneOf：漏值判定与 argAllOf 同一套（单值曾无防护，实测会把 flag 写进证据栏）', () => {
  // 实测复现（2026-10-08 OCR 指出后的实跑）：
  //   node lessons.mjs moment add … --evidence --project foo
  // 曾把 `--project` 当**逐字原话**写进证据栏（产物：`- 证据（原话）：\n  > --project`），
  // **零告警**——而那一栏的语义是「用户原话，一个字都不许被污染」。
  // 根因：漏值判定只写在 argAllOf 里，单值那条是无条件 `argv[i + 1]`。
  const warns = []
  // ① 下一个是已知 flag → 当漏值，返回 undefined + 告警（**不得**把 flag 当值返回）
  assert.equal(argOneOf(['--evidence', '--project', 'foo'], '--evidence', (m) => warns.push(m)), undefined,
    '单值参数后面跟已知 flag 时必须判为漏值——返回该 flag 就等于把它写进正文')
  assert.equal(warns.length, 1, '漏值必须告警')
  assert.match(warns[0], /后面没有值/)
  // ② 末尾无值
  warns.length = 0
  assert.equal(argOneOf(['--evidence'], '--evidence', (m) => warns.push(m)), undefined)
  assert.equal(warns.length, 1, '末尾无值也要告警')
  // ③ 正常取值
  assert.equal(argOneOf(['--evidence', '原话'], '--evidence'), '原话')
  // ④ 参数不存在
  assert.equal(argOneOf(['node', 'x.mjs'], '--evidence', () => {}), undefined, '参数不存在 → undefined 且不告警')
  // ⑤ **原话本身以 -- 开头但不是已知 flag** → 照收（与 argAllOf 同一口径）
  assert.equal(argOneOf(['--evidence', '--flag 有问题'], '--evidence'), '--flag 有问题',
    '与 argAllOf 同口径：未知的一律当正文，只有 CLI_FLAGS 里的才算 flag')
  // ⑥ 两条解析器对同一 argv 必须给出**同一个**漏值判定（共用 missingValue 的意义）
  const argv = ['--x', '--project', 'p']
  const w2 = []
  assert.equal(argOneOf(argv, '--x', (m) => w2.push(m)), undefined)
  assert.deepEqual(argAllOf(argv, '--x', (m) => w2.push(m)), [])
  assert.equal(w2.length, 2, '同一处漏值，单值与多值各告警一次——语义必须一致')
  // ⑦ **重复参数、首个漏值、后一个有效** → 跳过漏值取后一个（与 argAllOf 同一语义，2026-10-08 OCR 指出）
  const w3 = []
  assert.equal(argOneOf(['--evidence', '--evidence', '原话'], '--evidence', (m) => w3.push(m)), '原话',
    '首个 occurrence 漏值时应跳过并继续找有效值——否则「明明传了值」却被当成没传')
  assert.deepEqual(argAllOf(['--evidence', '--evidence', '原话'], '--evidence', (m) => w3.push(m)), ['原话'],
    '单值与多值对同一输入必须给同一结果')
  assert.equal(w3.length, 2, '漏值那个 occurrence 告警一次，单值/多值各一次')
})

test('argAllOf：**原话本身以 -- 开头** → 照收不误（2026-10-08 实测坑）', () => {
  // 背景：曾用 `String(v).startsWith('--')` 判「漏值」。但上文是**用户原话逐字抄录**，
  // 一句合法原话完全可能以 `--` 开头（如用户贴了个命令行片段），那样会被**静默丢掉**——
  // 而这个参数存在的意义就是「原话一个字都不丢」。
  // 修法：只跳过**本 CLI 已知的 flag**（CLI_FLAGS），未知的一律当正文。
  const warns = []
  const argv = ['--evidence-up', '--flag 有问题', '--evidence-up', '另一句']
  const got = argAllOf(argv, '--evidence-up', (m) => warns.push(m))
  assert.deepEqual(got, ['--flag 有问题', '另一句'], '以 -- 开头的原话必须被收进来，不能被当成 flag 丢掉')
  assert.equal(warns.length, 0, '这不是漏值，不该告警')

  // 漏值仍然要跳过（已知 flag 与缺失值两种）
  const w2 = []
  assert.deepEqual(argAllOf(['--evidence-up', '--polarity', 'x'], '--evidence-up', (m) => w2.push(m)), [])
  assert.equal(w2.length, 1, '已知 flag 仍按漏值处理 + 告警')
  const w3 = []
  assert.deepEqual(argAllOf(['--evidence-up'], '--evidence-up', (m) => w3.push(m)), [])
  assert.equal(w3.length, 1, '缺失值仍告警')
})

/** 剥掉 JS 注释（行注释 + 块注释），**保留字符串字面量内容**与行数
 *
 *  为 `parsedFlags` 服务：不剥注释的话，注释里写一句 `process.argv.indexOf('--to')`
 *  就会被当成「代码真的解析了这个 flag」——注释不是代码，守卫因此**假绿**
 *  （实测2026-10-08：lessons.mjs 第 893 行就是这种情况，删掉真调用它照样通过）。
 *
 *  逐字符扫描而非正则替换：正则处理不了「字符串里的 `//`」（如 `http://`）与转义引号。
 *
 *  ⚠️ **必须认识正则字面量**（2026-10-08 第 9 轮 OCR 提出，**机理实测成立**）：
 *  只认注释、字符串、模板串三类时，遇到 `.replace(/[<>:"/\\|｜?*]/g, '')` 这类**正则里带引号**的写法，
 *  那个 `"` 被当成「字符串开始」，状态从此错位——后面代码里的 `//` 注释不再被剥（小样本实测可复现）。
 *  ⚠️ **但在 lessons.mjs 真实内容上它没造成假绿**（实测：旧实现在真文件上删掉真调用后也扫不到 `--to`），
 *  所以这是「已知的一个脆弱点」，不是「本仓库正在犯的错」——两者别混。
 *
 * 判据：遇到不在字符串/注释里的 `/`，且**不是** `//` / `/*` 时，若上一个有效字符属于
 * 「此处可以开始一个表达式」那一类（运算符、括号、逗号、等号…），就按**正则字面量**扫到配对的 `/`。
 *  该启发式对 JS 的常见写法足够；判错的后果只是**少剥一段注释**（保守方向：宁可漏剥不可错剥）。
 */
function stripComments(src) {
  const n = src.length
  let out = ''
  let i = 0
  /** 上一个「有效字符」——用来判断当前 `/` 是正则开头还是除号 */
  let prevSig = ''
  /** 正则字面量内部：是否在 `[...]` 字符类里（那里 `/` 不算结束） */
  let inClass = false
  /** 上一个有效字符是「本位置不可能开始表达式」→ `/` 只能是除号 */
  const noRegexBefore = (ch) => /[A-Za-z0-9_$)\]]/.test(ch)
  while (i < n) {
    const c = src[i], d = src[i + 1]
    if (c === '/' && d === '/') {                    // 行注释：丢到行尾（**换行留下**，行数不变）
      while (i < n && src[i] !== '\n') i++
      continue                                     // prevSig 不变（换行不是有效字符）
    }
    if (c === '/' && d === '*') {                    // 块注释：整段丢弃（行数会变，但 parsedFlags 不看行号）
      i += 2
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++
      i += 2
      continue
    }
    if (c === '/' && (prevSig === '' || !noRegexBefore(prevSig))) {
      // **正则字面量**：扫到配对的 `/`。字符类 `[...]` 里的 `/` 不算结束。
      out += c; i++
      inClass = false
      while (i < n) {
        if (src[i] === '\\') { out += src.slice(i, i + 2); i += 2; continue }   // 转义：包括 `\/`
        if (src[i] === '[') inClass = true
        else if (src[i] === ']') inClass = false
        else if (src[i] === '/' && !inClass) { out += src[i]; i++; break }
        else if (src[i] === '\n') break                                 // 没闭合就退出（保守：当作到行尾）
        out += src[i]; i++
      }
      while (i < n && /[a-z]/.test(src[i])) { out += src[i]; i++ }        // 正则的 flag 字母（g / i / m…）
      prevSig = '/'
      continue
    }
    if (c === "'" || c === '"' || c === '`') {// 字符串：连内容一起原样带出去
      const q = c
      out += c; i++
      while (i < n && src[i] !== q) {
        if (src[i] === '\\') { out += src.slice(i, i + 2); i += 2; continue }
        out += src[i]; i++
      }
      out += q; i++
      prevSig = 'x'                                    // 字符串结束：里面不可能再起正则
      continue
    }
    out += c
    if (!/\s/.test(c)) prevSig = c
    i++
  }
  return out
}

/** lessons.mjs 里**真正被解析**的 flag 全集（注释已剥除）
 *
 *  ⚠️ 必须按「取值写法」匹配，不能按「代码里出现过这个字符串」——
 *  后者会被 `CLI_FLAGS` 本身满足（它把每个 flag 都写成了字面量），
 *  于是**登记了但从没被任何 argOf/argAll/indexOf 解析的 flag 也能通过**，守卫名不副实
 *  （2026-10-08 OCR 指出）。
 *
 *  ⚠️ 这份扫描曾逐字抄在两处（argAllOf 守卫 + 命令参数守卫）——
 *  一处加宽了取值写法、另一处没改，两条守卫就会得出不同结论（那时只有一条在说真话）。
 *
 *  ⚠️ 引号要**两种都收**（2026-10-08 OCR 指出）：曾只认单引号，
 *  代码哪天改成 `argAll("--evidence-up")` 就会**假红**（明明解析了，守卫说没解析）。
 *
 *  ⚠️ **`argAllOf` 与 `argOneOf` 必须显式写全**（2026-10-08 第 9 轮 OCR 指出）：
 *  曾只写 `argAll`，而 `argAll` 是 `argAllOf` 的**前缀**、`\(` 后面紧跟的是 `O`，
 *  于是 `argAllOf(process.argv, '--new-flag')` 匹配不上——
 *  有人绕过 CLI 里的 `argAll` 包装、直接调 `argAllOf` 加 flag 时，登记守卫会**静默放行**，
 *  而那正是这条守卫存在的意义。当前仓库统一走 `argAll`/`argOf` 包装，所以尚未暴露，属**已知缺口**。
 *
 *  ⚠️ **flag 允许不是第一个实参**（2026-10-08 第 9 轮实测发现）：
 *  正则曾要求 flag 紧跟 `(`，那只认`argOf('--x')` 这种**包装后**的写法；
 *  而导出函数本身的签名是 `argAllOf(argv, f, warn)`——**flag 在第二个位置**。
 *  于是「直接调导出函数」的写法（测试里、以及将来绕过包装的代码）全都扫不到。
 *  现在用 `(?:[^()]|\([^()]*\))*` 允许中间隔着 `process.argv, ` 这种**不含嵌套括号**的参数。
 *  （嵌套括号如 `argOf(getFlag('--x'))` 不在支持范围内——真出现了再说，**别提前加复杂度**。）
 */
function parsedFlags(src) {
  const code = stripComments(src)
  // 顺序按「长的在前」写：正则里 `argAll` 若排在 `argAllOf` 前面，
  // 匹配 `argAllOf(` 时会在 `argAll` 后要求 `\(`，遇到 `O` 就失败并回溯到别的分支——
  // 能匹配上但依赖回溯，写成 `argAllOf|argAll` 更直白。
  return new Set([...code.matchAll(
    /(?:argOf|argAllOf|argOneOf|argAll|indexOf|includes)\((?:[^()]|\([^()]*\))*\s*(['"])(--[a-z-]+)\1/g,
  )].map((m) => m[2]))
}

test('argAllOf：CLI_FLAGS 与实际 CLI 收的参数清单一致（防加了 flag 忘了登记）', () => {
  // 守卫：`argAllOf` 靠 CLI_FLAGS 区分「flag」和「原话」。若 CLI 收了新 flag 却忘了登记，
  // 那句 flag 就会被当成用户原话收进证据栏——静默、且很难发现。
  //
  // ⚠️ 扫描范围必须覆盖**三种取值写法 + 全文件**（2026-10-08 修，踩了两次）：
  //   ① 曾只扫 `argOf`/`argAll` → `migrate --to`（走 `process.argv.indexOf`）看不见；
  //   ② 补了 indexOf 后仍只扫 `momentAdd` 那一段 → `--to` 在第 946 行、`momentAdd` 在 ~960 行，**又漏了**。
  // 所以：扫**全文件**（parsedFlags 收到的是全文），且把「`--to` 必须被发现」写成断言的一部分。
  const used = parsedFlags(readFileSync(LESSONS_SRC, 'utf8'))
  assert.ok(used.size >= 15, `应至少扫到 15 个 flag（实际 ${used.size}）——若数量骤减，说明扫描漏了某种取值写法`)
  // 具体 flag 钉死：这三个曾先后从扫描里消失过
  for (const known of ['--evidence-up', '--message', '--to']) {
    assert.ok(used.has(known), `扫描没抓到 ${known}——扫描范围退化了（曾只扫 argOf/argAll，或只扫 momentAdd 那一段）`)
    assert.ok(CLI_FLAGS.has(known), `CLI_FLAGS 里没有 ${known}`)
  }
  for (const f of used) {
    assert.ok(CLI_FLAGS.has(f), `CLI 收了 ${f}，但 CLI_FLAGS 里没有登记 → 会被当成用户原话收进证据栏`)
  }
  // ⚠️ **注释里的 flag 不算「代码解析了它」**（2026-10-08 OCR 指出，实测已复现）：
  // 第 893 行注释写着「migrate 段走 `process.argv.indexOf('--to')`」，
  // 而真调用在 ~988 行。剥注释前，**把真调用删掉这条守卫照样绿**——那就是它要防的漂移。
  const withFake = parsedFlags([
    "const a = argOf('--real-flag')",
    "// const b = argOf('--commented-line-flag')",
    "/* const c = argOf('--commented-block-flag') */",
    'const s = "// argOf(\'--in-string-flag\')"',
  ].join('\n'))
  assert.ok(withFake.has('--real-flag'), '真调用必须被扫到')
  for (const fake of ['--commented-line-flag', '--commented-block-flag']) {
    assert.ok(!withFake.has(fake), `${fake} 只出现在注释里，不该被算成「代码真的解析了它」——否则守卫假绿`)
  }
  assert.ok(withFake.has('--in-string-flag'), '字符串字面量里的写法仍算出现（剥注释不剥字符串）')
  // 双引号也要认：曾只认单引号，代码改成 `argOf("--x")` 就会假红（2026-10-08 OCR 指出）
  assert.ok(parsedFlags(['argOf("--dq-flag")']).has('--dq-flag'), '双引号写法的 flag 也必须被扫到')
  //⚠️ **直调 argAllOf / argOneOf 也要扫到**（2026-10-08 第 9 轮 OCR 指出）：
  // 曾只收 `argAll`（`argAll` 是 `argAllOf` 的前缀，`\(` 后面紧跟 `O`），
  // 于是绕过 CLI 包装直接调 `argAllOf` 加的 flag 会被**静默放行**——正是这条守卫要防的。
  assert.ok(parsedFlags(["argAllOf(process.argv, '--direct-all')"]).has('--direct-all'),
    '直调 argAllOf(…, "--x") 必须被扫到——漏了它，绕过包装加的 flag 就没人管')
  assert.ok(parsedFlags(["argOneOf(process.argv, '--direct-one')"]).has('--direct-one'),
    '直调 argOneOf(…, "--x") 必须被扫到')

  // ⚠️ **正则字面量里带引号**必须被认出来（2026-10-08 第 9 轮 OCR 提出，实测后**部分成立**）：
  // 机理成立：曾只认注释/字符串/模板串三类，于是 `.replace(/[<>:"/\\|｜?*]/g, '')` 里那个 `"`
  // 被当成「字符串开始」→ 状态错位 → 后面代码里的 `//` 注释不再被剥
  //（小样本可复现：把带引号的正则去掉后，注释里的 flag 立刻被算成已解析）。
  //
  // ⚠️ **但它在本仓库的真实文件上并没有造成假绿**（实测 2026-10-08 第 9 轮）：
  // 用「不认正则」的旧实现去扫 lessons.mjs，**删掉真调用后 `--to` 依然扫不到**
  //（注释里那处也没被算进去——真实文件里的引号配对恰好没跨到那里）。
  // 所以下面是**小样本**层面的断言，它测的是「剥离逻辑会不会错位」，不是「本仓库曾经假绿过」。
  // 上面的「真文件层面」那段另有断言，见下。
  const withRegex = parsedFlags([
    "const cleaned = String(s ?? '')",
    '  .replace(/[<>:"/\\\\|｜?*]/g, \'\')   // 注释里写 argOf(\'--after-regex-comment\')',
    "const b = argOf('--after-regex-real')",
  ].join('\n'))
  assert.ok(withRegex.has('--after-regex-real'), '正则之后的真调用必须被扫到')
  assert.ok(!withRegex.has('--after-regex-comment'),
    '正则之后**行尾注释**里的 flag 不该被算成已解析——正则里的引号会让状态错位，导致后面整片注释剥不掉')

  // **真文件层面的断言**：把 `indexOf('--to')` 的**所有**出现换掉后重扫，--to 必须消失
  //（验证「剥注释在真实内容上生效」这件事本身，不是验证历史假绿）。
  //
  // ⚠️ 用 `replaceAll`（Node 15+）而不是 `match` 只取第一个——曾用 match，
  // 而第一个匹配可能正是注释里那处，替换没碰到真调用、断言恒红（2026-10-08 实测踩过）。
  // ⚠️ 这条断言**测不到「不认正则」那个坑**（实测：旧实现在真文件上也是绿的），
  // 它的作用是「防止将来某次编辑让真调用整体消失、而注释里那处顶上」——那才是真文件独有的漂移。
  const realSrc = readFileSync(LESSONS_SRC, 'utf8')
  assert.ok(realSrc.includes("indexOf('--to')"), `基线异常：lessons.mjs 里找不到 indexOf('--to')，本条断言的前提变了`)
  const withoutReal = realSrc.replaceAll("indexOf('--to')", "indexOf('--to-removed-for-probe')")
  assert.ok(!parsedFlags(withoutReal).has('--to'),
    '--to 只出现在注释里，剥注释后不该扫到——若扫到，说明剥离在 lessons.mjs 的真实内容上失效了（假绿）')
})

test('momentAdd：模板读不到时返 { ok:false }，不抛（契约一致性，2026-10-08）', async () => {
  // 本文件所有记账函数的契约是「失败返 { ok:false, reason }，从不抛」。
  // `momentsFileHeader()` 会抛（模板缺失 / 结构漂移），曾直接穿透 momentAdd →
  // CLI 那边拿到的是裸栈而不是「记账失败：…」。
  // 本测试直接**制造故障**：把skills 目录整体复制一份，**不放** moments-template.md，
  // 再对着副本跑——必须拿到 { ok:false, reason } 而不是异常。
  await withSkillCopy(null, async (mod) => {          // 传 null = 故意不放模板 → momentsFileHeader() 必抛
    const root = mkdtempSync(join(tmpdir(), 'store-'))
    mkdirSync(join(root, 'projects'), { recursive: true })
    const r = mod.momentAdd(root, { summary: '测试摘要', project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'a', evidence: 'x', date: '2026-10-01', reason: 'r' })
    assert.equal(r.ok, false, '模板缺失时应返 ok:false')
    assert.match(r.reason, /读不到 moments 文件头/, 'reason 应说清是文件头读不到')
  })
})

/** 读某session 的 moments.md 全文 */
function readMoments(root, dir, project = 'p') { return readFileSync(join(root, 'projects', project, dir, 'moments.md'), 'utf8') }
/** 证据栏的所有 `  > ` 行（去掉前缀） */
function evidenceRows(txt) { return txt.split(/\r?\n/).filter((l) => l.startsWith('  > ')).map((l) => l.slice(4)) }

test('evidence-up：传 2 次 → 证据栏出 3 行（2 上文 + 1 触发）', () => {
  const root = makeStore(tmp())
  const r = momentAdd(root, {
    project: 'p', session: 'aaaaaaa1', date: '2026-10-07', summary: 't', polarity: '负面',
    problem: 'x', reason: 'r', evidence: '触发句', evidenceUp: ['上句一', '上句二'],
  })
  const rows = evidenceRows(readMoments(root, r.dir))
  assert.equal(rows.length, 3)
  assert.deepEqual(rows, ['[上文] 上句一', '[上文] 上句二', '[触发] 触发句'])
})

test('evidence-up：保序（防静默错）——传入顺序即输出顺序，不可颠倒', () => {
  const root = makeStore(tmp())
  const r = momentAdd(root, {
    project: 'p', session: 'aaaaaaa2', date: '2026-10-07', summary: 't', polarity: '负面',
    problem: 'x', reason: 'r', evidence: '触发句', evidenceUp: ['紧邻的上一句', '更早的一句'],
  })
  const rows = evidenceRows(readMoments(root, r.dir))
  assert.equal(rows[0], '[上文] 紧邻的上一句', '紧邻上文的上一句必须在最前')
  assert.equal(rows[1], '[上文] 更早的一句')
})

test('evidence-up：原话含分隔符（｜ / 【】/ >）→ 原样落盘，不被解析、不丢字', () => {
  const root = makeStore(tmp())
  const nasty = '我说的A｜B【触发】还有 > 引用都要留着'
  const r = momentAdd(root, {
    project: 'p', session: 'aaaaaaa3', date: '2026-10-07', summary: 't', polarity: '负面',
    problem: 'x', reason: 'r', evidence: nasty, evidenceUp: ['上文含｜和【】'],
  })
  const rows = evidenceRows(readMoments(root, r.dir))
  assert.equal(rows.length, 2)
  assert.equal(rows[0], '[上文] 上文含｜和【】', '分隔符必须原样保留，不被当结构解析')
  assert.equal(rows[1], `[触发] ${nasty}`, '触发句里的 ｜ 【】 > 必须逐字保留')
})

test('evidence-up：原话含换行 → 折成空格且块结构不被破坏（不拆one() 防护）', () => {
  const root = makeStore(tmp())
  const r = momentAdd(root, {
    project: 'p', session: 'aaaaaaa4', date: '2026-10-07', summary: 't', polarity: '负面',
    problem: 'x', reason: 'r', evidence: '第一行\n第二行', evidenceUp: ['上文第一行\n上文第二行'],
  })
  const txt = readMoments(root, r.dir)
  const rows = evidenceRows(txt)
  // ⚠️ 曾在这里再写一次 `evidenceRows(txt).length === 2` —— 与上面 `rows.length === 2`
  // 是**同一个表达式**（txt 中间没变），两次求值恒等，等于同一件事断言两遍；
  // 而 rows[0] 从来没被断言过（2026-10-08 OCR 指出）。
  // 改成一次 deepEqual 覆盖整组：上文行、触发行、顺序、数量都在这一条里。
  assert.deepEqual(rows, ['[上文] 上文第一行 上文第二行', '[触发] 第一行 第二行'],
    '换行折成空格，上文行不得被吞 / 不得多出引用行 / 顺序不得颠倒')
  // 注入防护：原话里的换行不能伪造出结构行
  assert.ok(txt.includes('- 解法：（结案时补）'), '结构行必须仍在')
})

test('evidence-up：原话以 > 开头 → 引用块不被破坏（内容在引号内）', () => {
  const root = makeStore(tmp())
  const r = momentAdd(root, {
    project: 'p', session: 'aaaaaaa5', date: '2026-10-07', summary: 't', polarity: '负面',
    problem: 'x', reason: 'r', evidence: '> 我故意以大于号开头', evidenceUp: ['> 上文也以大于号开头'],
  })
  const rows = evidenceRows(readMoments(root, r.dir))
  assert.equal(rows.length, 2)
  assert.equal(rows[0], '[上文] > 上文也以大于号开头', '大于号原样保留，仍在本行内')
  assert.equal(rows[1], '[触发] > 我故意以大于号开头')
})

test('evidence-up：空值/空白项被剔除，不产出空行', () => {
  const root = makeStore(tmp())
  const r = momentAdd(root, {
    project: 'p', session: 'aaaaaaa6', date: '2026-10-07', summary: 't', polarity: '负面',
    problem: 'x', reason: 'r', evidence: '触发句', evidenceUp: ['', '   ', undefined, null, '真上文'],
  })
  const rows = evidenceRows(readMoments(root, r.dir))
  assert.deepEqual(rows, ['[上文] 真上文', '[触发] 触发句'])
})

test('evidence-up：不传 → 输出与改动前逐字一致（向后兼容）', () => {
  const root = makeStore(tmp())
  const r = momentAdd(root, {
    project: 'p', session: 'aaaaaaa7', date: '2026-10-07', summary: 't', polarity: '负面',
    problem: 'x', reason: 'r', evidence: '只有触发句',
  })
  const txt = readMoments(root, r.dir)
  assert.ok(txt.includes('- 证据（原话）：'), '栏标题必须仍是旧的「证据（原话）」')
  assert.deepEqual(evidenceRows(txt), ['只有触发句'], '单句形态不变')
  assert.ok(!txt.includes('[上文]') && !txt.includes('[触发]'), '不传时不得出现新标签')
})

test('evidence-up：只给上文、不给触发句 → 被拒（触发句是必填项，原有约束不变）', () => {
  const root = makeStore(tmp())
  // 触发句必填是validateMoment 的原有约束（负面情绪必须有原话）——新参数不放宽它
  const r = momentAdd(root, {
    project: 'p', session: 'aaaaaaa8', date: '2026-10-07', summary: 't', polarity: '负面',
    problem: 'x', reason: 'r', evidence: '', evidenceUp: ['只有上文'],
  })
  assert.equal(r.ok, false)
  assert.match(r.reason, /--evidence/)
  assert.equal(existsSync(join(root, 'projects', 'p', '2026-10-07-aaaaaaa8-t')), false, '被拒时不得建目录')
})

test('evidence-up：正面/认知极性也走多行证据栏', () => {
  const root = makeStore(tmp())
  const r = momentAdd(root, {
    project: 'p', session: 'aaaaaaa9', date: '2026-10-07', summary: 't', polarity: '认知',
    problem: 'x', reason: 'r', evidence: '触发句', evidenceUp: ['上文一句'],
  })
  assert.deepEqual(evidenceRows(readMoments(root, r.dir)), ['[上文] 上文一句', '[触发] 触发句'])
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

test('moment add：新建目录缺 --summary → 拒绝（目录名是人认 session 的唯一入口）', () => {
  const root = makeStore(tmp())
  const r = momentAdd(root, { project: 'p', session: 'aaaabbbb', polarity: '负面', problem: 'x', evidence: 'y', reason: 'r', date: '2026-10-01' })
  assert.equal(r.ok, false)
  assert.match(r.reason, /--summary/)
  assert.equal(existsSync(join(root, 'projects', 'p', '2026-10-01-aaaabbbb')), false)   // 没建出目录
})

test('moment add：--summary 清洗后为空 → 同样拒绝', () => {
  const root = makeStore(tmp())
  const r = momentAdd(root, { project: 'p', session: 'aaaabbbb', polarity: '负面', problem: 'x', evidence: 'y', reason: 'r', date: '2026-10-01', summary: '<>:"/\\|?*' })
  assert.equal(r.ok, false)
  assert.match(r.reason, /--summary/)
})

test('moment add：已存在目录复用时不需要 --summary（目录永不改名）', () => {
  const root = makeStore(tmp())
  const r1 = momentAdd(root, { project: 'p', session: 'aaaabbbb', polarity: '负面', problem: 'x', evidence: 'y', reason: 'r', date: '2026-10-01', summary: '第一句摘要' })
  assert.equal(r1.ok, true)
  const r2 = momentAdd(root, { project: 'p', session: 'aaaabbbb', polarity: '正面', problem: 'y', evidence: 'z', reason: 'r', date: '2026-10-01' })   // 不带 summary
  assert.equal(r2.ok, true)
  assert.equal(r2.dir, r1.dir)
})

test('moment add：碰撞护栏——命中目录但首句不一致 → 报错、不写入', () => {
  const root = makeStore(tmp())
  const dir = join(root, 'projects', 'p', '2026-10-01-aaaabbbb')
  mkdirSync(dir, { recursive: true })
  const facts = join(dir, 'facts.md')
  writeFileSync(facts, '# 事实包\n\n- session：aaaabbbb｜首句：甲｜memory id：—｜message 范围：2026-10-01 09:00..2026-10-01 10:00\n', 'utf8')
  const before = readFileSync(facts, 'utf8')
  const r = momentAdd(root, { summary: '测试摘要', project: 'p', session: 'aaaabbbb', polarity: '负面', problem: 'x', evidence: 'y', reason: 'r', date: '2026-10-01', firstMessage: '乙' })
  assert.equal(r.ok, false)
  assert.match(r.reason, /首句不一致/)
  assert.equal(existsSync(join(dir, 'moments.md')), false)   // 没写入
  assert.equal(readFileSync(facts, 'utf8'), before)
})

test('moment add：首句一致 → 碰撞护栏放行', () => {
  const root = makeStore(tmp())
  const dir = join(root, 'projects', 'p', '2026-10-01-aaaabbbb')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'facts.md'), '- session：aaaabbbb｜首句：甲｜memory id：—｜message 范围：2026-10-01 09:00..10:00\n', 'utf8')
  const r = momentAdd(root, { summary: '测试摘要', project: 'p', session: 'aaaabbbb', polarity: '负面', problem: 'x', evidence: 'y', reason: 'r', date: '2026-10-01', firstMessage: '甲' })
  assert.equal(r.ok, true)
})

test('moment add：碰撞护栏对「缺 memory id 栏」的 facts 头同样有效（该栏规范里是可选）', () => {
  const root = makeStore(tmp())
  const dir = join(root, 'projects', 'p', '2026-10-01-aaaabbbb')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'facts.md'), '- session：aaaabbbb｜首句：甲｜message 范围：2026-10-01 09:00..10:00\n', 'utf8')
  const ok = momentAdd(root, { summary: '测试摘要', project: 'p', session: 'aaaabbbb', polarity: '负面', problem: 'x', evidence: 'y', reason: 'r', date: '2026-10-01', firstMessage: '甲' })
  assert.equal(ok.ok, true, '首句一致就该放行——正则版实现在这里会误判碰撞')   // 回归护栏
  const bad = momentAdd(root, { summary: '测试摘要', project: 'p', session: 'aaaabbbb', polarity: '负面', problem: 'x', evidence: 'y', reason: 'r', date: '2026-10-01', firstMessage: '乙' })
  assert.equal(bad.ok, false)
  assert.match(bad.reason, /首句不一致/)
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
  const r = momentAdd(root, { summary: '测试摘要', project: 'p', session: 'aaaaaaaa', problem: 'x' })
  assert.equal(r.ok, false)
  assert.match(r.reason, /极性/)
})

test('moment add：缺 --session → 拒绝', () => {
  const root = makeStore(tmp())
  const r = momentAdd(root, { summary: '测试摘要', project: 'p', polarity: '负面', problem: 'x', cause: 'y', attitude: 'z', date: '2026-10-01' })
  assert.equal(r.ok, false)
  assert.match(r.reason, /--session/)
})

test('moment add：缺 --date → 拒绝（session 目录不能静默落错天）', () => {
  const root = makeStore(tmp())
  const r = momentAdd(root, { summary: '测试摘要', project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'x', evidence: 'y', reason: 'r' })
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
    const r = momentAdd(root, { summary: '测试摘要', ...base, session: s })
    assert.equal(r.ok, false, `应拒绝 session=${s}`)
    assert.match(r.reason, /--session/)
  }
  assert.equal(momentAdd(root, { summary: '测试摘要', ...base, session: '51e11408' }).ok, true)
})

test('校验：--project 为 . / .. → 拒绝，不写到 projects/ 之外', () => {
  const root = makeStore(tmp())
  for (const bad of ['.', '..']) {
    const r = momentAdd(root, { summary: '测试摘要', project: bad, session: 'aaaabbbb', polarity: '负面', problem: 'x', evidence: 'y', reason: 'r', date: '2026-10-01' })
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
  const r = momentAdd(root, { summary: '测试摘要', project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'x', cause: 'y', attitude: 'z', date: '2026-10-01' })
  assert.equal(r.ok, false)
  assert.match(r.reason, /--evidence/)
})

test('moment add：写入首条 + 目录自建 + 无 BOM', () => {
  const root = makeStore(tmp())
  const r = momentAdd(root, { summary: '测试摘要', project: 'p', session: 'eeeeeeee', polarity: '负面', problem: '连续三轮没听懂', cause: '用了术语', attitude: '打断', evidence: '像天书', date: '2026-10-01', reason: '判据：对象=人→贬→负面' })
  assert.equal(r.ok, true)
  assert.equal(r.id, 'M-eeeeeeee-1')
  const file = join(root, 'projects', 'p', '2026-10-01-eeeeeeee-测试摘要', 'moments.md')
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
  momentAdd(root, { summary: '测试摘要', project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'a', cause: 'b', attitude: 'c', evidence: '原话一', date: '2026-10-01', reason: '判据：对象=人→贬→负面' })
  const r = momentAdd(root, { summary: '测试摘要', project: 'p', session: 'aaaaaaaa', polarity: '正面', problem: '认可', evidence: '不错', date: '2026-10-01', reason: '判据：对象=人→夸→正面' })
  assert.equal(r.id, 'M-aaaaaaaa-2')
})

test('moment add：migrating 锁存在 → 拒绝', () => {
  const root = makeStore(tmp())
  writeFileSync(join(root, '.migrating'), 'x', 'utf8')
  const r = momentAdd(root, { summary: '测试摘要', project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'a', cause: 'b', attitude: 'c', evidence: 'x' })
  assert.equal(r.ok, false)
  assert.match(r.reason, /迁移中/)
})

test('moment add：--project 含路径分隔符 → 清洗后仍落在 projects/ 内（不穿越）', () => {
  const root = makeStore(tmp())
  const r = momentAdd(root, { summary: '测试摘要', project: '../../etc', session: 'aaaaaaaa', polarity: '负面', problem: 'a', cause: 'b', attitude: 'c', evidence: 'x', date: '2026-10-01', reason: '判据：对象=人→贬→负面' })
  assert.equal(r.ok, true)
  assert.equal(r.file, join(root, 'projects', '....etc', '2026-10-01-aaaaaaaa-测试摘要', 'moments.md'))
})

test('moment resolve：找不到 ID → 报错且文件不变', () => {
  const root = makeStore(tmp())
  momentAdd(root, { summary: '测试摘要', project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'a', cause: 'b', attitude: 'c', evidence: 'x', date: '2026-10-01', reason: '判据：对象=人→贬→负面' })
  const file = join(root, 'projects', 'p', '2026-10-01-aaaaaaaa-测试摘要', 'moments.md')
  const before = readFileSync(file, 'utf8')
  const r = momentResolve(root, { project: 'p', id: 'M-aaaaaaaa-9', solution: 'x' })
  assert.equal(r.ok, false)
  assert.equal(readFileSync(file, 'utf8'), before)
})

test('moment resolve：只改指定条目，其余字节不变', () => {
  const root = makeStore(tmp())
  momentAdd(root, { summary: '测试摘要', project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'a', cause: 'b', attitude: 'c', evidence: 'x', date: '2026-10-01', reason: '判据：对象=人→贬→负面' })
  momentAdd(root, { summary: '测试摘要', project: 'p', session: 'aaaaaaaa', polarity: '正面', problem: '认可', evidence: '好', date: '2026-10-01', reason: '判据：对象=人→夸→正面' })
  const file = join(root, 'projects', 'p', '2026-10-01-aaaaaaaa-测试摘要', 'moments.md')
  const before = readFileSync(file, 'utf8')
  const tail = before.slice(before.indexOf('## M-aaaaaaaa-2'))
  const r = momentResolve(root, { project: 'p', id: 'M-aaaaaaaa-1', solution: '改用大白话', cost: '3 轮' })
  assert.equal(r.ok, true)
  const after = readFileSync(file, 'utf8')
  assert.match(after, /- 状态：已解决/)
  assert.match(after, /- 解法：改用大白话｜代价：3 轮/)
  assert.equal(after.includes(tail), true) // 第二条一字未动
})

test('moment resolve：--id 格式非法 → 拒绝（新旧交替式护栏的负例）', () => {
  const root = makeStore(tmp())
  for (const bad of ['M-2026-10-1', 'M--1', 'M-2026-09-30-1-x', 'M-aaaaaaaa', 'foo']) {
    const r = momentResolve(root, { project: 'p', id: bad, solution: 'x' })
    assert.equal(r.ok, false, `应拒绝 id=${bad}`)
    assert.match(r.reason, /--id 格式/)
  }
})

test('moment resolve：同一文件里重复同名标题 → 判为歧义、拒绝（不静默取第一个）', () => {
  const root = makeStore(tmp())
  const dir = join(root, 'projects', 'p', '2026-10-01-aaaaaaaa-测试摘要')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'moments.md'),
    '# 情绪记录（moments）\n\n## M-aaaaaaaa-1\n- 极性：负面｜项目：p｜session：aaaaaaaa｜message：—｜时间：2026-10-01\n- 状态：未解决\n\n## M-aaaaaaaa-1\n- 极性：正面｜项目：p｜session：aaaaaaaa｜message：—｜时间：2026-10-01\n- 状态：未解决\n', 'utf8')
  const r = momentResolve(root, { project: 'p', id: 'M-aaaaaaaa-1', solution: 'x' })
  assert.equal(r.ok, false)
  assert.match(r.reason, /歧义/)
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
  momentAdd(root, { summary: '测试摘要', project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'a', cause: 'b', attitude: 'c', evidence: 'x', date: '2026-10-01', reason: '判据：对象=人→贬→负面' })
  momentAdd(root, { summary: '测试摘要', project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'd', cause: 'e', attitude: 'f', evidence: 'y', date: '2026-10-01', reason: '判据：对象=事→贬→负面' })
  momentResolve(root, { project: 'p', id: 'M-aaaaaaaa-1', solution: 'x' })
  const s = momentsSummary(root, 'p')
  assert.equal(s.total, 2)
  assert.equal(s.open, 1)
})

test('momentsSummary：跨 session 目录聚合统计', () => {
  const root = makeStore(tmp())
  momentAdd(root, { summary: '测试摘要', project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'a', evidence: 'x', date: '2026-10-01', reason: 'r' })
  momentAdd(root, { summary: '测试摘要', project: 'p', session: 'bbbbbbbb', polarity: '正面', problem: 'b', evidence: 'y', date: '2026-10-02', reason: 'r' })
  const s = momentsSummary(root, 'p')
  assert.equal(s.total, 2)
  assert.equal(s.open, 1) // 10-01 负面未结案；10-02 正面不参与结案统计
  assert.equal(existsSync(join(root, 'projects', 'p', '2026-10-01-aaaaaaaa-测试摘要', 'moments.md')), true)
  assert.equal(existsSync(join(root, 'projects', 'p', '2026-10-02-bbbbbbbb-测试摘要', 'moments.md')), true)
})

test('守卫：新建 moments.md 的头部 = 模板 §模板 头部（代码直接读模板，**代码里无第二份**）', () => {
  const root = makeStore(tmp())
  momentAdd(root, { summary: '测试摘要', project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'a', evidence: 'x', date: '2026-10-01', reason: 'r' })
  const generated = readFileSync(join(root, 'projects', 'p', '2026-10-01-aaaaaaaa-测试摘要', 'moments.md'), 'utf8')
  const genHeader = generated.slice(0, generated.indexOf('## M-')).trimEnd()
  // 期望值直接从模板截——**不在测试里再抄一份**（那才是第二份真相）
  assert.equal(genHeader, momentsFileHeader().trimEnd(), '生成的头应与「代码从模板读到的头」一致')

  // **真正的守卫**：代码里**不得再出现硬编码的文件头**（第二份真相的根）。
  // ⚠️ 抓的是「有辨识度的片段」而不是整段拼法——曾用 `src.includes('# 情绪记录（moments）\n\n> 格式权威定义见')`，
  // 那只匹配一种拼写：换引号风格、或用**真实换行**的模板字符串（而非 `\n` 转义）就匹配不上 → 断言真空通过，
  // 而第二份真相其实已经回来了（2026-10-08 OCR 指出）。
  const src = readFileSync(LESSONS_SRC, 'utf8')
  assert.ok(!src.includes('> 格式权威定义见 `managing-lessons-store/assets/moments-template.md`'),
    'lessons.mjs 里仍有硬编码的文件头（第二份真相还在）——应改为从模板读')
})

test('守卫：模板被换成 CRLF 换行时，文件头仍读得到（Windows 实测坑，2026-10-08）', async () => {
  // 背景：`momentsFileHeader()` 曾用 /```markdown\\n([\\s\\S]*?)\\n```/ 直接匹配模板。
  // 模板若在 Windows / core.autocrlf=true 下以 CRLF 落地，`\n` 匹配不到 `\r\n` → 抛错 →
  // **`moment add` 新建 moments.md 直接失败**，而且报错文案说「模板结构变了」，把人和 agent 都引向错的方向。
  // 这条守卫把模板读成 CRLF 再跑一遍同样断言：CRLF 下必须读到同一个头。
  // ⚠️ 曾写成「局部 cut() 复刻一遍提取逻辑」，那是**同义反复**：cut() 第一行就归一化了 \r\n，
  // 所以 cut(crlf) 与 cut(tpl) **必然相等，跟 momentsFileHeader 的实际行为无关**——
  // 它红的原因是反例构造失败，不是它真的测到了 CRLF（2026-10-08 实测自曝）。
  // 现在改成**造一个 CRLF 版的技能副本，真调副本里的 momentsFileHeader()**。
  const tpl = readFileSync(new URL('../assets/moments-template.md', import.meta.url), 'utf8')
  const expected = momentsFileHeader().trimEnd()
  assert.ok(expected.includes('格式权威定义见'), '基线就异常：当前 LF 模板读不到文件头')

  // 关键：模板以 **CRLF** 落盘（Windows / core.autocrlf=true 的真实形态）
  const crlfTpl = tpl.replace(/\r?\n/g, '\r\n')
  await withSkillCopy(crlfTpl, async (mod) => {
    const crlfHeader = mod.momentsFileHeader().trimEnd()
    assert.equal(crlfHeader, expected, 'CRLF 版模板应读出与 LF 版同一个文件头')
    // 没归一化的话这里会抛「找不到 ```markdown 代码块」——那就是本条要抓的故障
  })

  // 反向防线：代码里不得有「裸匹配 \n 而不归一化」的写法（防止有人后来把归一化删掉）
  const src = readFileSync(LESSONS_SRC, 'utf8')
  const fnBody = src.slice(src.indexOf('export function momentsFileHeader'))
  assert.ok(fnBody.includes("replace(/\\r\\n/g, '\\n')"), 'momentsFileHeader 里没有 CRLF 归一化——模板以 CRLF 落地时会抛错')
})

test('守卫：文件头按「§模板」小节定位，不靠「第一个 ```markdown 块」的顺序（2026-10-08）', async () => {
  // 背景：`momentsFileHeader()` 曾直接全局 match 取「第一个 ```markdown 块」。
  // **实测（2026-10-08）：模板里 3 个块的位置是「§模板 最前，两个示例块在其后」**——
  // 今天的模板下「取第一个」和「取 §模板 的块」结果必然相同，顺序依赖是**隐形**的。
  //
  // ⚠️ 曾据此断言「造不出反例、只能退而检查源码字符串」——**那是错的**：既然本文件已有
  // copy-and-import 机制（见上面 CRLF 那条），可以**造一份「§模板 前面多放一个 markdown 块」的模板**，
  // 然后**真调副本里的 momentsFileHeader()**，看它是否仍取对块。
  // 这才是行为验证：源码字符串断言（`fnBody.includes("indexOf('## 模板')")`）在改名/换写法时会假失败，
  // 而删掉锚定、退回全局 match 时**不会**失败——那才是它要防的回归（2026-10-08 OCR 指出）。
  const tpl = readFileSync(new URL('../assets/moments-template.md', import.meta.url), 'utf8')
  const expected = momentsFileHeader().trimEnd()
  assert.ok(expected.includes('格式权威定义见'), '基线异常：当前模板读不到文件头')

  const secIdx = tpl.indexOf('## 模板')
  assert.ok(secIdx > -1, '模板应有「## 模板」小节')

  // 反例模板：把一个**含 ```markdown 块**的段落插到 §模板 之前，让「第一个块」不再是 §模板 的块
  const decoy = '# 诱饵\n\n```markdown\n## M-decoy\n这段不该被当成文件头\n```\n\n'
  const tainted = decoy + tpl
  const taintedFirst = tainted.match(/```markdown\n([\s\S]*?)\n```/)[1]
  assert.notEqual(taintedFirst, expected, '构造反例失败：诱饵块没插到 §模板 之前')

  await withSkillCopy(tainted, async (mod) => {
    const got = mod.momentsFileHeader().trimEnd()
    assert.equal(got, expected,
      '§模板 前面放了别的 markdown 块时，仍应取到 §模板 的文件头——退回「取第一个块」就会拿到诱饵内容')
    assert.ok(!got.includes('诱饵'), '读到的是诱饵块，说明实现退回全局 match 了')
  })

  // 补充防线：找不到「§模板」小节时要抛错（不许靠 slice(-1) 静默兜底）
  const src = readFileSync(LESSONS_SRC, 'utf8')
  const fnBody = src.slice(src.indexOf('export function momentsFileHeader'))
  assert.ok(fnBody.includes("indexOf('## 模板')"), 'momentsFileHeader 里没有锚定「## 模板」小节——块顺序一变就会静默取错块')
  assert.ok(fnBody.includes('at === -1'), '缺少「找不到 §模板 就抛错」的防线')
})

test('守卫：模板里每个表头后面必须有分隔行（防生成物表格塌成纯文本）', () => {
  // 背景（2026-10-02 实测）：facts-template 的 §2 把分隔行位置写成了占位符「| … | … | … |」，
  // 而技能要求"逐字使用"模板 → 生成的事实包表格不渲染，整段降级成纯文本。
  // 判据（与 GFM 一致）：表头行的下一行必须是分隔行，且**每一格**都形如 `:?-+:?`
  //   ——不是"整行有个 `-` 就行"：`| --- |  |` 整行有 `-`，但第二格是空的，GFM 照样不认；
  //   分隔行的列数还必须等于表头列数。
  // 取格以**未转义的 `|`** 为准（本仓库 retro-template 规定自由文本栏位内 `|` 写作 `\|`）。
  // 围栏：先独立扫一遍算出区间（从第 0 行起、**缩进 ≤3**、反引号 ≥3、闭合要求同长且后面只能跟空白）。
  //   **带语言且非 markdown / md / gfm** 的围栏（如 ```powershell）里的 `|` 行不查（防管道续行被误判）；
  //   **围栏外、以及 markdown 类围栏与裸围栏**里的表头照查——宁可误报，也不漏报（裸围栏里也可能摆真模板）。
  // 已知边界（本仓库模板一律不这么写，故不处理）：
  //   ① 两张表之间没有空行时，第二张表的表头会被跳过（假阴性）；
  //   ② 表头行必须以 `|` 开头才算入口——省略首尾竖线的表格（`a | b` + `- | -`）整块不进入校验。
  const skillsUrl = new URL('../../', import.meta.url)          // → skills/
  const files = []
  for (const e of readdirSync(skillsUrl, { withFileTypes: true })) {
    if (!e.isDirectory()) continue
    const assets = new URL(`${e.name}/assets/`, skillsUrl)
    if (!existsSync(assets)) continue
    for (const f of readdirSync(assets)) if (/template.*\.md$/i.test(f)) files.push(new URL(f, assets))
  }
  assert.ok(files.length >= 4, `应扫到 ≥4 个模板（实际 ${files.length}）`)
  const cells = (line) => line.trim().replace(/^\|/, '').replace(/(?<!\\)(?:\\\\)*\|$/, '').split(/(?<!\\)(?:\\\\)*\|/)
  const isSepCell = (c) => /^\s*:?-+:?\s*$/.test(c)
  const fenceLangs = (lines) => {                                // 逐行的围栏语言（null = 不在围栏内）
    const out = new Array(lines.length).fill(null)
    let lang = null, ticks = 0
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^ {0,3}(`{3,})(.*)$/)              // 缩进 ≥4 是缩进代码块，不是围栏
      if (m && lang === null) { lang = m[2].trim(); ticks = m[1].length; continue }              // 开围栏
      if (m && m[2].trim() === '' && m[1].length >= ticks) { lang = null; ticks = 0; continue }  // 闭围栏（后面只能跟空白）
      out[i] = lang
    }
    return out
  }
  for (const f of files) {
    const lines = readFileSync(f, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)   // CRLF 也要能读
    const fences = fenceLangs(lines)
    for (let i = 0; i < lines.length - 1; i++) {
      const lang = fences[i]
      if (lang && !/^(markdown|md|gfm)$/i.test(lang)) continue    // 非 markdown（含 md / gfm 别名）围栏不查
      // 表头行 = 本行以 `|` 开头、且（首行除外）上一行不以 `|` 开头，即表格的起点
      if (!/^\|/.test(lines[i]) || (i > 0 && /^\|/.test(lines[i - 1]))) continue
      const head = cells(lines[i])
      const sep = cells(lines[i + 1])
      assert.ok(
        sep.every(isSepCell),
        `${f.pathname} 第 ${i + 1} 行是表头，下一行必须是分隔行（每格形如 --- / :---:）；实际收到「${lines[i + 1]}」`,
      )
      assert.equal(
        sep.length,
        head.length,
        `${f.pathname} 第 ${i + 1} 行表头 ${head.length} 列、分隔行 ${sep.length} 列——GFM 要求两者相等，否则整张表不渲染`,
      )
    }
  }
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
  momentAdd(root, { summary: '测试摘要', project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'a', cause: 'b', attitude: 'c', evidence: 'x', date: '2026-10-01', reason: '判据：对象=人→贬→负面' })
  const r = momentResolve(root, { project: 'p', id: 'M-aaaaaaaa-1', solution: 'A | B', cost: 'C \\ D' })
  assert.equal(r.ok, true)
  const after = readFileSync(join(root, 'projects', 'p', '2026-10-01-aaaaaaaa-测试摘要', 'moments.md'), 'utf8')
  assert.match(after, /- 解法：A \\\| B｜代价：C \\\\ D/)
})

test('moment resolve：正面/认知条目 → 报「不结案」且文件不变', () => {
  const root = makeStore(tmp())
  momentAdd(root, { summary: '测试摘要', project: 'p', session: 'aaaaaaaa', polarity: '正面', problem: '认可', evidence: '不错', date: '2026-10-01', reason: '判据：对象=人→夸→正面' })
  const file = join(root, 'projects', 'p', '2026-10-01-aaaaaaaa-测试摘要', 'moments.md')
  const before = readFileSync(file, 'utf8')
  const r = momentResolve(root, { project: 'p', id: 'M-aaaaaaaa-1', solution: 'x' })
  assert.equal(r.ok, false)
  assert.match(r.reason, /不结案/)
  assert.equal(readFileSync(file, 'utf8'), before)
})

test('moment add：新建 moments.md 头部与模板逐字一致 + 无 BOM', () => {
  const root = makeStore(tmp())
  const r = momentAdd(root, { summary: '测试摘要', project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'a', evidence: 'x', date: '2026-10-01', reason: '判据：对象=人→贬→负面' })
  assert.equal(r.ok, true)
  const buf = readFileSync(join(root, 'projects', 'p', '2026-10-01-aaaaaaaa-测试摘要', 'moments.md'))
  assert.notEqual(buf[0], 0xEF)
  const text = buf.toString('utf8')
  assert.match(text, /# 情绪记录（moments）/)
  assert.match(text, /格式权威定义见 `managing-lessons-store\/assets\/moments-template.md`（本文件只放数据）/)
  assert.match(text, /触发：agent 察觉情绪当场记（不问）；collect 时重扫覆盖本 session/)
  assert.match(text, /判定公式与 userwords 共用/)
  assert.match(text, /触发句（原话）\*\*三种极性都必填\*\*/)
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
  const r = momentAdd(root, { summary: '测试摘要', project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'a', evidence: 'x', date: '2026-10-01' })
  assert.equal(r.ok, false)
  assert.match(r.reason, /--reason/)
})

test('moment add：--date 非法格式 → 拒绝', () => {
  const root = makeStore(tmp())
  const r = momentAdd(root, { summary: '测试摘要', project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'a', cause: 'b', attitude: 'c', date: 'foo' })
  assert.equal(r.ok, false)
  assert.match(r.reason, /YYYY-MM-DD/)
})

test('moment add：值内换行被折掉（不注入行 / 不破块）', () => {
  const root = makeStore(tmp())
  const r = momentAdd(root, { summary: '测试摘要', project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: '第一行\n## 假块', cause: 'c', attitude: 'a', evidence: 'e1\ne2', date: '2026-10-01', reason: '判据：对象=人→贬→负面' })
  assert.equal(r.ok, true)
  const text = readFileSync(join(root, 'projects', 'p', '2026-10-01-aaaaaaaa-测试摘要', 'moments.md'), 'utf8')
  assert.equal(/^## 假块/m.test(text), false)            // 没注入出假块
  assert.equal((text.match(/^## M-/gm) || []).length, 1) // 只有 1 个真块
})

test('moment drop：只清本 session 目录的条目区，其他 session 目录不动', () => {
  const root = makeStore(tmp())
  momentAdd(root, { summary: '测试摘要', project: 'p', session: 'cccccccc', polarity: '负面', problem: 'a1', evidence: 'x1', date: '2026-10-01', reason: 'r' })
  momentAdd(root, { summary: '测试摘要', project: 'p', session: 'dddddddd', polarity: '正面', problem: 'b1', evidence: 'y1', date: '2026-10-01', reason: 'r' })
  momentAdd(root, { summary: '测试摘要', project: 'p', session: 'cccccccc', polarity: '认知', problem: 'a2', evidence: 'x2', date: '2026-10-01', reason: 'r' })
  const aFile = join(root, 'projects', 'p', '2026-10-01-cccccccc-测试摘要', 'moments.md')
  const bFile = join(root, 'projects', 'p', '2026-10-01-dddddddd-测试摘要', 'moments.md')
  const bBefore = readFileSync(bFile, 'utf8')
  const r = momentDrop(root, { project: 'p', date: '2026-10-01', session: 'cccccccc' })
  assert.equal(r.ok, true)
  assert.equal(r.removed, 2)                            // A 的两条被清
  const aAfter = readFileSync(aFile, 'utf8')
  assert.equal(/^## M-/m.test(aAfter), false)           // A 里已无条目
  assert.match(aAfter, /# 情绪记录（moments）/)          // 文件头保留
  assert.equal(readFileSync(bFile, 'utf8'), bBefore)    // B 目录一字未动
})

test('moment drop：目录不存在 → removed 0 + noDir（与 fileMissing 互斥，幂等）', () => {
  const root = makeStore(tmp())
  const r = momentDrop(root, { project: 'p', date: '2026-10-01', session: 'cccccccc' })
  assert.equal(r.ok, true)
  assert.equal(r.removed, 0)
  assert.equal(r.noDir, true)
  assert.equal(r.fileMissing, undefined)   // **互斥**：noDir 时不置 fileMissing（spec §11-9）
  assert.equal(existsSync(join(root, 'projects', 'p', '2026-10-01-cccccccc-测试摘要')), false)
})

test('moment drop：项目标识清洗后为空 → 拒绝', () => {
  const root = makeStore(tmp())
  const r = momentDrop(root, { project: '|||', date: '2026-10-01', session: 'cccccccc' })
  assert.equal(r.ok, false)
  assert.match(r.reason, /清洗后为空/)
})

test('moment drop：目录在但 moments.md 不在 → fileMissing（collect 中途的真实状态）', () => {
  const root = makeStore(tmp())
  mkdirSync(join(root, 'projects', 'p', '2026-10-01-cccccccc-测试摘要'), { recursive: true })   // 只建目录
  const r = momentDrop(root, { project: 'p', date: '2026-10-01', session: 'cccccccc' })
  assert.equal(r.ok, true)
  assert.equal(r.removed, 0)
  assert.equal(r.fileMissing, true)
  assert.equal(r.noDir, undefined)   // 目录**在**——与"目录还没建"是两回事，别混报
  assert.equal(existsSync(join(root, 'projects', 'p', '2026-10-01-cccccccc-测试摘要', 'moments.md')), false)  // 不新建
})

test('集成：首次 collect 的 drop→add 序列（noDir 属正常 → add 带摘要建目录）', () => {
  const root = makeStore(tmp())
  const d1 = momentDrop(root, { project: 'p', date: '2026-10-01', session: 'aaaaaaaa' })
  assert.equal(d1.ok, true)
  assert.equal(d1.noDir, true)                       // 目录都还没有 → 首次收集的正常态，不该当错误报
  assert.equal(d1.fileMissing, undefined)            // 与 noDir 互斥
  const a = momentAdd(root, { project: 'p', session: 'aaaaaaaa', date: '2026-10-01', summary: '首次收集', polarity: '负面', problem: 'x', evidence: 'y', reason: 'r' })
  assert.equal(a.ok, true)
  assert.equal(a.dir, '2026-10-01-aaaaaaaa-首次收集')
  const d2 = momentDrop(root, { project: 'p', date: '2026-10-01', session: 'aaaaaaaa' })
  assert.equal(d2.ok, true)
  assert.equal(d2.removed, 1)
  assert.equal(d2.noDir, undefined)                  // 这次目录在、条目被真清掉
  assert.equal(d2.fileMissing, undefined)
  assert.equal(d2.resolvedRemoved, 0)                // 无已结案条目 → 计数为 0
})

test('moment drop：已结案条目一并清掉，并单独计数回报（防静默丢解法/代价）', () => {
  const root = makeStore(tmp())
  momentAdd(root, { summary: '测试摘要', project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'a', evidence: 'x', date: '2026-10-01', reason: 'r' })
  momentAdd(root, { summary: '测试摘要', project: 'p', session: 'aaaaaaaa', polarity: '负面', problem: 'b', evidence: 'y', date: '2026-10-01', reason: 'r' })
  const res = momentResolve(root, { project: 'p', id: 'M-aaaaaaaa-1', solution: 'X' })
  assert.equal(res.ok, true)
  const d = momentDrop(root, { project: 'p', date: '2026-10-01', session: 'aaaaaaaa' })
  assert.equal(d.ok, true)
  assert.equal(d.removed, 2)
  assert.equal(d.resolvedRemoved, 1)                 // 已结案那条被单独数出来 → collect 才能提示"须重新结案"
})

test('moment drop：`## M-` 块一律清掉（含格式异体：缺 session 行 / 混入半角 |）', () => {
  // 前提不变量：**文件即本 session**（一 session 一目录）。所以 drop 按 `^##\s+M-` 全清，
  // **不再按 `session：` 字段过滤**——旧实现那套 `unparsed` 护栏已随目录制退场。
  // 下面两个块的 session 字段一个缺失、一个写着 `A`，也一并清掉（重扫会重写）。
  const root = makeStore(tmp())
  mkdirSync(join(root, 'projects', 'p', '2026-10-01-cccccccc-测试摘要'), { recursive: true })
  const file = join(root, 'projects', 'p', '2026-10-01-cccccccc-测试摘要', 'moments.md')
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
  mkdirSync(join(root, 'projects', 'p', '2026-10-01-cccccccc-测试摘要'), { recursive: true })
  const file = join(root, 'projects', 'p', '2026-10-01-cccccccc-测试摘要', 'moments.md')
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

test('moment drop：sid 在场却不匹配 → 不碰同日唯一目录（noDir，防清错 session）', () => {
  const root = makeStore(tmp())
  momentAdd(root, { summary: '测试摘要', project: 'p', session: 'dddddddd', polarity: '正面', problem: 'b', evidence: 'y', date: '2026-10-01', reason: 'r' })
  const file = join(root, 'projects', 'p', '2026-10-01-dddddddd-测试摘要', 'moments.md')
  const before = readFileSync(file, 'utf8')
  const r = momentDrop(root, { project: 'p', date: '2026-10-01', session: 'cccccccc' })
  assert.equal(r.ok, true)
  assert.equal(r.noDir, true)                           // 没找到本 session 的目录 → noDir
  assert.equal(r.fileMissing, undefined)                // 与 noDir 互斥
  assert.equal(readFileSync(file, 'utf8'), before)      // B 一字未动
})

test('moment drop：缺 --session / 缺 --date / migrating → 拒绝', () => {
  const root = makeStore(tmp())
  assert.match(momentDrop(root, { project: 'p', date: '2026-10-01' }).reason, /--session/)
  assert.match(momentDrop(root, { project: 'p', session: 'cccccccc' }).reason, /--date/)
  writeFileSync(join(root, '.migrating'), 'x', 'utf8')
  assert.match(momentDrop(root, { project: 'p', date: '2026-10-01', session: 'cccccccc' }).reason, /迁移中/)
})

// ── 守卫：文档 ↔ 代码一致性（防「文档写了、代码没有」）────────────────
// 背景（2026-10-07 实测）：spec 的函数签名 / 命令参数 / 行号 / 数字都会随代码改动而漂移，
// 人工核对一次要十几分钟，且漏了不报错。这四条把它变成「跑一次就知道」。

test('守卫：技能文档里的 `lessons.mjs <子命令> --xxx` 参数，代码里必须真支持', () => {
  // 文档里出现的「子命令 + 长选项」组合
  const docs = [resolve(RETRO_COLLECT_DIR, 'SKILL.md'), resolve(SKILL_DIR, 'SKILL.md')]
  const patt = /lessons\.mjs\s+([a-z-]+)/g
  // ⚠️ 要跟「代码**真的解析**了它」比，不是跟「代码里出现过这个字符串」比（详见 parsedFlags 的注释）。
  // 这里**必须调parsedFlags**，不能自己再抄一份正则：两份正则一旦宽窄不同，
  // 两条守卫就会对同一个 flag 给出相反结论，而且没人知道该信哪条（2026-10-08 OCR 指出）。
  const parsed = parsedFlags(readFileSync(LESSONS_SRC, 'utf8'))
  assert.ok(parsed.size >= 15, `应至少解析出 15 个 flag（实际 ${parsed.size}）——扫描正则退化了`)
  let checked = 0
  for (const d of docs) {
    // ⚠️ 曾经 `if (!existsSync(d)) continue` —— 文档被改名/移走时**静默少扫一份**，
    // 却仍可能靠另一份文件凑够 `checked >= 30` 而全绿 = 覆盖率悄悄下降（2026-10-08 OCR 指出）。
    // 「跳过」必须变成显式失败：这正是本文件反复强调的「不许假装扫全了」。
    assert.ok(existsSync(d), `守卫要扫的文档不存在：${relative(REPO_ROOT, d)}——少扫一份，守卫等于「假装扫全了」`)
    const txt = readFileSync(d, 'utf8')
    for (const m of txt.matchAll(patt)) {
      // **抓整行里所有 --flag，不只抓行首连续的一段**——
      // 曾用/lessons\.mjs\s+([a-z-]+)((?:\s+--[a-z][a-z-]*)+)/ 只吃「子命令后紧跟的连续 flag」，
      // 一旦中间出现占位符（`--project <标识>`）就停，**行尾的 flag 全漏**。
      // 实测 2026-10-08：旧正则抓到 6 个，整行抓法能抓 42 个（覆盖率 14%）——
      // 漏掉的里面就有 `--evidence-up` / `--message`（本次改动新增的那两个）。
      const lineEnd = txt.indexOf('\n', m.index)
      const line = txt.slice(m.index, lineEnd === -1 ? txt.length : lineEnd)
      const flags = line.match(/--[a-z][a-z-]*/g) || []
      for (const f of flags) {
        assert.ok(
          parsed.has(f),
          `${relative(REPO_ROOT, d)} 里出现 \`${f}\`，但 ${relative(REPO_ROOT, LESSONS_SRC)} 里**没有真正解析**它`
          + '（既没 argOf/argAll，也没 indexOf/includes）——文档写了代码不支持',
        )
        checked++
      }
    }
  }
  assert.ok(checked >= 30, `应至少扫到 30 个命令参数（实际 ${checked}）——若数量骤减，说明正则退化成只抓行首了`)
})

/** 在仓内按文件名找唯一匹配（跨目录引用解析不到相对路径时用）
 *
 *  ⚠️ **必须自建scanner，不许复用调用方那个**（2026-10-08 OCR 指出）：
 *  `walk` 把截断/跳过状态写进 `scan`，共用会让「按名找 .mjs」的旁路查找污染
 *  `.md` 那趟扫描的 `scan.truncated` —— 断言报错时会指向错误的理由
 *  （说成「md 扫描被截断」，实际是某个深层目录里恰好有个同名 .mjs）。
 *
 *  ⚠️ 0 个（文件被改名）与 ≥2 个（重名）**必须可区分**（同上）：
 *  两者的修法完全不同（改引用 vs 挪文件），混成 `null` 只能靠人去猜。
 *
 *  @returns {{file: string, ambiguous?: string[]}|null} `null` = 没找到；
 *   `ambiguous` 非空 = 找到多个（此时 `file` 为 null）
 */
function findByName(name) {
  // `makeScanner` 已在扫描层跳过 `.git` / `node_modules` / `.session`，这里**不再事后 filter**——
  // 事后 filter 用 `p.includes('.git')` 会连带误杀 `.github/` 之类，而扫描层的精确匹配不会（2026-10-08 OCR 指出）
  const { walk } = makeScanner()               // 自建 scanner：旁路查找不污染调用方的 scan
  // ⚠️ walk 的匹配是「扩展名后缀」`endsWith(x)`——做**精确文件名**查找时必须按 basename 过滤，
  // 否则 `my-lessons.mjs` 这类不同前缀的同名文件会被当成第二个命中 → 假 ambiguous（2026-10-08 OCR 指出）
  const hits = walk(REPO_ROOT, [name]).filter((p) => p.split(/[\\/]/).pop() === name)
  if (hits.length === 1) return { file: hits[0] }
  if (hits.length > 1) return { file: null, ambiguous: hits }
  return null
}

test('守卫：文档里的「<名>.mjs 第 N 行」引用，行号必须仍有效（防行号漂移）', () => {
  // 扫全仓 md（行号引用可能出现在 skills / docs / README 任意处）
  const { walk, scan } = makeScanner()
  const mds = walk(REPO_ROOT, ['.md'])   // `.git` / `node_modules` 由 makeScanner 跳过，不事后filter
  let checked = 0
  let anchored = 0
  const missing = []                        // 找不到目标文件的引用（报错要能指到是哪条）
  const ambiguous = []                      // 重名多处（修法与「找不到」不同，单列）
  for (const f of mds) {
    const txt = readFileSync(f, 'utf8')
    // 写法：`<名>.mjs` 第 N 行 / :N / ：N（**跨目录引用极多**，故按文件名在仓内定位，不靠相对路径）
    //
    // ⚠️ 结尾的 `行|条` **必须可选**（2026-10-08 OCR 指出）：曾写成 `(?:行|条)` 必填，
    // 于是 `lessons.mjs:377` / `lessons.mjs：377` 这种**冒号写法永远匹配不上**——
    // 而上面这行注释明说认得它。**注释说覆盖、实际不覆盖 = 静默不校验**，比不写更坏。
    // （实测 2026-10-08：本仓库 0 处冒号写法，所以放宽后不会新增匹配；改动是为了「注释与实现一致」，
    //   真出现冒号写法时它也能被抓到。）
    //
    // 保留 `：` 全角形态：Windows / 中文文档里两种都常见。
    for (const m of txt.matchAll(/([A-Za-z0-9_.-]+\.mjs)`?\s*(?:[:：]\s*|第\s*)(\d{2,4})\s*(?:行|条)?/g)) {
      const local = resolve(dirname(f), m[1])
      // 找不到与重名**分开记账**：前者改文档里的文件名，后者要挪文件（2026-10-08 OCR 指出）
      const hit = existsSync(local) ? { file: local } : findByName(m[1])
      let abs = null
      if (hit === null) missing.push(`${relative(REPO_ROOT, f)} → ${m[1]}`)
      else if (hit.ambiguous) ambiguous.push(`${relative(REPO_ROOT, f)} → ${m[1]}（命中 ${hit.ambiguous.length} 处）`)
      else abs = hit.file
      // 定位不到（文件被改名 / 重名多处）曾 `continue` 静默跳过——那条引用就悄悄不校验了。
      // 改成**计数并在末尾断言为 0**，让「跳过」与「通过」可区分（2026-10-08 OCR 指出）。
      if (!abs) continue
      const lines = readFileSync(abs, 'utf8').split(/\r?\n/)
      const ln = Number(m[2])
      assert.ok(ln <= lines.length, `${relative(REPO_ROOT, f)} 引用 ${m[1]} 第 ${ln} 行，但该文件只有 ${lines.length} 行——行号漂移了`)
      checked++
      // **内容锚定**：只查「没超范围」不够——行号漂了但仍落在文件内时会静默通过。
      // 若引用处**紧接着有代码块**，就取那块的第 1 行当锚点，断言它确实出现在被引那一行或其注释里。
      // 实测 2026-10-08：spec 写「第 347 行（buildMoment 内）」+ 引用 `const one = ...`，
      // 而那一行实际已挪到 374 —— 旧守卫（只查上界）照样全绿（2026-10-08 OCR 指出）。
      const after = txt.slice(m.index + m[0].length)
      // 代码块可能紧邻，也可能隔着一段说明文字（实测 spec 里两者都有）
      // ⚠️ **只取围栏内首行，不要求闭合围栏紧跟**（2026-10-08 OCR 指出，实测已复现）：
      // 曾用 /```[a-z]*\n([^\n]+)\n```/ —— 那只匹配**单行**代码块，多行块（正常形态）匹配失败
      // → `continue` → 该条引用**只判上界** → 行号漂了仍静默通过。
      // 实测：造一条「引用第 401 行 + 跟 5 行代码块」的文档，401 明显不对也全绿。
      const fence = after.slice(0, 400).match(/```[a-z]*\n([^\n]+)/)
      if (!fence) continue                                  // 附近没代码块 → 只判上界
      const snippet = fence[1].trim()
      // 锚点必须能定位：太短 / 以注释开头 / 含省略号 的片段判不了
      if (snippet.length < 8 || snippet.startsWith('//') || snippet.includes('...') || snippet.includes('|')) continue
      const window = lines.slice(Math.max(0, ln - 3), ln + 3).join('\n')
      assert.ok(window.includes(snippet),
        `${relative(REPO_ROOT, f)} 引用 ${m[1]} 第 ${ln} 行，但那一行附近**没有**它引用的代码：\n`
        + `      期望片段：${snippet}\n      实际第 ${ln} 行附近：${lines[ln - 1] ?? '(越界)'}\n`
        + `      → 行号漂了（守卫只查上界时不会报这种）`)
      anchored++
    }
  }
  assert.ok(checked > 0, `应至少扫到 1 处行号引用（实际 ${checked}）——正则没匹配到，等于守卫失效`)
  // 「定位不到目标文件」的引用**必须为 0**：那类引用曾 `continue` 静默跳过，等于该条引用永远不被校验。
  // 文件被改名 / 重名多处时都会落到这里 —— 那是**待修的漂移**，不是「可以忽略」。
  // **两种情况分开报**：修法不同（找不到 → 改文档里的文件名；重名 → 挪文件），混成一句只能靠人猜（2026-10-08 OCR 指出）。
  assert.equal(missing.length, 0,
    `有 ${missing.length} 处行号引用**找不到**目标文件（被静默跳过了）：\n  ${missing.slice(0, 8).join('\n  ')}`
    + '\n修法：把文档里的文件名改回真实存在的那个（多半是被改名了）')
  assert.equal(ambiguous.length, 0,
    `有 ${ambiguous.length} 处行号引用**命中多个**同名文件，不敢判（被静默跳过了）：\n  ${ambiguous.slice(0, 8).join('\n  ')}`
    + '\n修法：把重名的文件挪成唯一名字（或让引用带上相对路径）')
  // ⚠️「锚定了 0 处」= 内容锚定这条根本没生效，等于只有上界检查（那正是 2026-10-08 前的状态）
  assert.ok(anchored > 0, `应至少锚定 1 处（实际 ${anchored}）——内容锚定没生效，行号漂了仍会静默通过`)
  assert.deepEqual(scan.truncated, [],
    `扫描被深度上限截断了（漏扫 ${scan.truncated.length} 个目录：${scan.truncated.slice(0, 3).join(' | ')}）——`
    + '守卫等于「假装扫全了」。要么把内容挪浅，要么给 makeScanner 放宽 maxDepth')
  // 跳过的目录**只能是** SKIP_DIRS 的子集（本仓库可能没有 node_modules，不必强求两个都在）
  const allowed = ['.git', 'node_modules', '.session']
  const skipped = [...new Set(scan.skippedNames())]
  for (const s of skipped) {
    assert.ok(allowed.includes(s), `扫描跳过了不该跳的目录：${s}（只允许 ${allowed.join(' / ')}）——守卫等于「假装扫全了」`)
  }
  // **不要求 `.git` 必须存在或必须是目录**：`git worktree` / submodule 下 .git 是个*文件*
  // （`gitdir: …`），archive/zip 检出里则完全没有 —— 那种布局下 `e.isDirectory()` 为 false，
  // 扫不到就扫不到，上面的白名单循环已经兜住了「跳过了不该跳的」（2026-10-08 OCR 指出）
})

test('守卫：makeScanner 的 truncated 只在「被截断那一层真有目标扩展名」时才算漏扫（防假红）', () => {
  // 背景：`scan.truncated` 曾无差别记录所有超深目录。断言 `truncated === []` 于是会**假红**——
  // 实测 2026-10-08：造一个第 4 层只含 `.js` 的目录，扫 `.md` 时它照样进 truncated，
  // 断言就报「漏扫了 1 个目录」，而那个目录里一个 md 都没有。
  // **假红比不报错更坏**：它让人养成「这条断言老是无理取闹」的习惯，真的漏扫时也一起忽略。
  const root = tmp()
  const deep = join(root, 'a', 'b', 'c', 'd')
  mkdirSync(deep, { recursive: true })
  try {
    // ① 超深目录里**只有 .js** → 扫 .md 时不该算漏扫
    writeFileSync(join(deep, 'e.js'), '// x')
    let s = makeScanner(3)
    assert.equal(s.walk(root, ['.md']).length, 0)
    assert.deepEqual(s.scan.truncated, [],
      '超深目录里没有任何 .md → 不该报漏扫（假红）。有的话说明 truncated 又变成无差别记录')

    // ② 超深目录里**有 .md** → 必须算漏扫（这条不能被上面那条改坏）
    writeFileSync(join(deep, 'f.md'), '# x')
    s = makeScanner(3)
    assert.equal(s.walk(root, ['.md']).length, 0, '超深目录扫不到，md 数应为 0')
    assert.deepEqual(s.scan.truncated, [deep],
      '超深目录里真有 .md → 必须报漏扫，否则守卫就「假装扫全了」')

    // ③ 没超深时不该记任何 truncated（别把 noteTruncated 接错位置）
    const shallow = tmp()
    mkdirSync(join(shallow, 'x', 'y'), { recursive: true })
    writeFileSync(join(shallow, 'x', 'y', 'a.md'), '# a')
    s = makeScanner(3)
    assert.equal(s.walk(shallow, ['.md']).length, 1)
    assert.deepEqual(s.scan.truncated, [], '深度没超限时不得记 truncated')

    // ④ ⚠️ 目标文件在**再下一层**（当前层只有目录）也算漏扫（2026-10-08 OCR 指出）：
    // 曾只查边界目录的当前层，于是 `d/e/f.md` 既不被 walk 返回、也不进 truncated
    // → 调用方全绿，而那个文件里的行号引用**从来没被校验过**。
    // 曾把这辩解成「checked > 0 会兜」——**那是错的**：checked > 0 是全局「至少一处」，
    // 别的文件满足它就绿了，挡不住某个具体文件被漏。
    // ⚠️ 用**独立的 root**：与上面 ①② 共用一个时，truncated 里会同时有 d 和 g/h/i/j 两个，
    // 那测的就不是「更深层」这一件事了。
    const root4 = tmp()
    const deeper = join(root4, 'g', 'h', 'i', 'j', 'k')
    mkdirSync(deeper, { recursive: true })
    writeFileSync(join(deeper, 'z.md'), '# z')
    try {
      const s4 = makeScanner(3)
      assert.equal(s4.walk(root4, ['.md']).length, 0, '超深目录扫不到，md 数应为 0')
      assert.deepEqual(s4.scan.truncated, [join(root4, 'g', 'h', 'i', 'j')],
        '目标文件在边界目录的**更深层**时也必须报漏扫——只查当前层会静默吞掉一整个子树')
    } finally {
      rmSync(root4, { recursive: true, force: true })
    }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('守卫：spec / plan 里的「N/N 全绿」必须等于实测条数（现读实际用例数）', () => {
  // 不能用「写死的常量」——测试文件自己不知道有几条测试（自指）。
  // 办法：数本文件里 `^test(` 的行数 = 本文件实际用例数（与 node --test 报的 tests 同一口径）。
  const self = readFileSync(fileURLToPath(import.meta.url), 'utf8')
  const actual = (self.match(/^test\(/gm) || []).length
  assert.ok(actual > 0, '数不到用例名，正则失效')
  const { walk, scan } = makeScanner()
  const specs = walk(REPO_ROOT, ['.md'])
    // 历史记录保留不改（docs-convention 规矩）：handoffs / 已被取代的 spec 里的数字是当时的快照，不参与校对。
    // ⚠️ 路径分隔符必须**跨平台**：曾写成 `docs\handoffs`（Windows 风格），而 `walk` 用 `path.join`
    // 在 POSIX 上产出 `docs/handoffs` → 排除失效 → 两个 handoff 里的 `32/32` 会触发
    // `assert.equal(32, actual)` ——**这条守卫在 Linux/macOS 上必红**（2026-10-08 OCR 指出）。
    // 修法：不写死分隔符，改成按「路径片段」匹配（两边都能命中）。
    .filter((p) => !p.replace(/\\/g, '/').includes('docs/handoffs'))
    .filter((p) => !p.includes('2026-09-27-retro-suite-design'))
    .filter((p) => !p.includes('2026-09-28-evolving'))
    .filter((p) => !p.includes('2026-10-02-session-dir-layout'))
  let checked = 0
  // 写法：`lessons.test.mjs` → **95/95** / `**95/95 全绿**` / `95/95`
  //
  // ⚠️ 曾用 `(\d+)\s*/\s*(\d+)(全绿|通过|绿)?` 全仓抓 + 「两数相等且 ≥20」当过滤条件——
  // 实测 2026-10-08：全仓 57 处匹配里 **52 处是误伤**（`13/13` 是另一个仓库的校验、
  // `14/14` 是 aas 自己的测试数、`0/1` 是退出码、`69/69` 是旧快照）。
  // 根因：**靠「值够大」猜「这是不是在讲测试条数」**，而 13/14/23/69 也都够大。
  //
  // 现在改成**锚定「同一句里出现 `lessons.test.mjs`」**——只有讲本测试文件的才校，
  // 别的仓库自己的 N/N 一律不管。这比猜可靠：判据从「像不像」变成「是不是」。
  const claim = /lessons\.test\.mjs[^\n]{0,120}?(\d+)\s*\/\s*(\d+)/g
  for (const f of specs) {
    const txt = readFileSync(f, 'utf8')
    for (const m of txt.matchAll(claim)) {
      const a = Number(m[1]); const b = Number(m[2])
      if (a !== b) continue                 // 只校验「N/N」这种写法（用例总数）
      assert.equal(
        a, actual,
        `${relative(REPO_ROOT, f)} 写「${a}/${b}」，但本文件实际有 ${actual} 条用例——数字漂移了（改测试后要同步）`,
      )
      checked++
    }
  }
  // 当前策略：**spec 不写死条数**（数字由本守卫自动校对，或压根不写），
  // 所以扫到 0 处是正常状态 —— 只提示不断言。若将来有文档重新写死条数，这里会立刻抓到。
  if (checked > 0) {
    console.log(`  [数字守卫] 校对到 ${checked} 处「N/N」用例数，均与实测 ${actual} 一致`)
  } else {
    console.log('  [数字守卫] 当前无文档写死用例条数（正常——已改为不写死）')
  }
  // ⚠️「扫到 0 处」和「根本没扫到」要能区分：前者正常，后者是扫描坏了。
  // 实测 2026-10-08：扫全仓 59 个 md，能命中的只有 3 处且全在排除项里（历史 handoff / 旧plan）——
  // 也就是说**这条守卫在活跃文档上目前是 0 命中**，不是「没漂移」的证据，是「没东西可校」。
  assert.ok(specs.length > 0, '一条 md 都没扫到——扫描本身坏了')
  assert.deepEqual(scan.truncated, [],
    `扫描被深度上限截断了（漏扫 ${scan.truncated.length} 个目录：${scan.truncated.slice(0, 3).join(' | ')}）——`
    + '数字漂移在漏扫的文件里就抓不到了')
})

test('守卫：buildMoment 导出的事实行结构 ↔ 文档描述的形态（单句/多行）一致', () => {
  const code = readFileSync(LESSONS_SRC, 'utf8')
  const tpl = readFileSync(join(SKILL_DIR, 'assets', 'moments-template.md'), 'utf8')
  // 两种栏标题必须同时存在于代码与模板（它们是「实现」的两面，缺一面就是漂移）
  for (const header of ['- 证据（原话）：', '- 证据（对话原文，紧邻上文→触发句）：']) {
    assert.ok(code.includes(header), `lessons.mjs 里没有栏标题「${header}」`)
    assert.ok(tpl.includes(header), `moments-template.md 里没有栏标题「${header}」`)
  }
  // 标签也必须两边都有
  for (const tag of ['[上文]', '[触发]']) {
    assert.ok(code.includes(tag), `lessons.mjs 里没有标签「${tag}」`)
    assert.ok(tpl.includes(tag), `moments-template.md 里没有标签「${tag}」`)
  }
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

