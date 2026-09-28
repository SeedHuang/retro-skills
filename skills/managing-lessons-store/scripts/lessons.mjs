#!/usr/bin/env node
// 错题集 KB 生命周期脚本（spec §4.1 / §4.5）
// 只用 Node 内置模块；导出纯函数便于 node:test 直测；底部有 CLI 入口守卫。
import { existsSync, readFileSync, statSync, accessSync, constants, mkdirSync, readdirSync, copyFileSync, writeFileSync, renameSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve, dirname, relative, sep } from 'node:path'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'

export const SCHEMA_VERSION = 1

/** 指针文件候选（两者都查；写时优先第一个） */
export function pointerCandidates(home = homedir()) {
  return [join(home, '.agents', 'lessons.config.json'), join(home, '.trae-cn', 'lessons.config.json')]
}

/** 逐个读指针候选；首个可解析的胜出。JSON 损坏 → 返回 { broken: true, path } 以便报错 */
export function readPointer(paths) {
  for (const p of paths) {
    if (!existsSync(p)) continue
    try {
      const raw = readFileSync(p, 'utf8').replace(/^\uFEFF/, '')
      const config = JSON.parse(raw)
      if (typeof config?.store !== 'string' || config.store.trim() === '') {
        return { broken: true, path: p, reason: `指针文件缺少有效的 "store"：${p}` }
      }
      return { path: p, config }
    } catch {
      return { broken: true, path: p, reason: `指针文件损坏：${p}` }
    }
  }
  return null
}

/** KB 根的合法性校验（spec §4.1.1 五条） */
export function checkStore(root, deps) {
  const abs = resolve(root)
  if (!existsSync(abs) || !statSync(abs).isDirectory()) {
    return { ok: false, reason: `KB 路径不存在或不是目录：${abs}`, hint: '重建请运行 bootstrap（managing-lessons-store 技能）' }
  }
  const isWritable = deps.isWritable ?? ((p) => { try { accessSync(p, constants.W_OK); return true } catch { return false } })
  if (!isWritable(abs)) {
    return { ok: false, reason: `KB 路径不可写：${abs}`, hint: '检查权限，或迁移到可写位置' }
  }
  if (deps.isInsideGitRepo(abs)) {
    return { ok: false, reason: `KB 位于仓库内：${abs}`, hint: '错题集含个人数据，不得入库。请迁移到仓库外' }
  }
  return { ok: true }
}

/** 解析优先级：环境变量 → 指针文件 → 无（触发 bootstrap） */
export function resolveStore({ env, pointerPaths, deps }) {
  const fromEnv = env?.LESSONS_DIR
  if (typeof fromEnv === 'string' && fromEnv.trim() !== '') {
    const c = checkStore(fromEnv, deps)
    return c.ok ? { ok: true, root: resolve(fromEnv) } : c
  }
  const ptr = readPointer(pointerPaths)
  if (ptr === null) {
    return { ok: false, reason: '未找到错题集指针，错题集尚未初始化', hint: '请运行 bootstrap（managing-lessons-store 技能）指定位置' }
  }
  if (ptr.broken) return { ok: false, reason: ptr.reason, hint: `备份后重建指针：${ptr.path}` }
  if (ptr.config.schemaVersion !== SCHEMA_VERSION) {
    return { ok: false, reason: `KB schemaVersion=${ptr.config.schemaVersion} 不受支持（支持 ${SCHEMA_VERSION}）`, hint: '迁移或重建' }
  }
  const c = checkStore(ptr.config.store, deps)
  return c.ok ? { ok: true, root: resolve(ptr.config.store) } : c
}

/** 从 index.md 的「候选与推迟」节抽表行（spec §7.1：必须带可观测信号） */
export function parseDeferredSection(indexMarkdown) {
  const lines = indexMarkdown.split(/\r?\n/)
  const start = lines.findIndex(l => /^##\s+候选与推迟/.test(l))
  if (start === -1) return []
  const rows = []
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i]
    if (/^##\s+/.test(l)) break
    const m = l.match(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/)
    if (!m) continue
    if (m[1] === '编号' || /^-+$/.test(m[1])) continue
    rows.push({ id: m[1], item: m[2], motivation: m[3], signal: m[4] })
  }
  return rows
}

/** 逐条判定信号命中（当前只实现 spec §11 的三个可计量信号） */
export function evaluateSignals(rows, c) {
  return rows.map(r => {
    let hits = false, evidence = ''
    if (/KB\s*条目.*>=\s*10/.test(r.signal)) {
      hits = c.totalCount >= 10 && c.dims >= 2
      evidence = `${c.totalCount}/10 条, ${c.dims}/2 维度`
    } else if (/KB\s*项目.*>=\s*2/.test(r.signal)) {
      hits = c.projects >= 2 && c.totalCount >= 20
      evidence = `${c.projects}/2 项目, ${c.totalCount}/20 条`
    } else if (/首次出现真冲突/.test(r.signal)) {
      hits = false
      evidence = '需人工判定（真冲突判定见 spec §3.3）'
    } else {
      evidence = '信号不可自动判定 → 交人工'
    }
    return { ...r, hits, evidence }
  })
}

/** 轮询报告：清单 + 必带计数的 summary（spec §7.2） */
export function runDeferred(root, counters) {
  const index = readFileSync(join(root, 'index.md'), 'utf8')
  const rows = evaluateSignals(parseDeferredSection(index), counters)
  const hitCount = rows.filter(r => r.hits).length
  const summary = hitCount > 0
    ? `推迟项 ${rows.length} 条（${hitCount} 条命中信号）`
    : `推迟项 ${rows.length} 条，均未命中信号`
  return { rows, summary }
}

/** 四条硬校验（spec §4.6） */
export function validateTarget(from, to) {
  const a = resolve(from), b = resolve(to)
  if (a === b) return { ok: false, reason: `目标与源相同：${b}` }
  const rel = relative(a, b)
  if (rel && !rel.startsWith('..') && !rel.startsWith(sep)) return { ok: false, reason: `目标位于源内：${b}（会无限递归复制）` }
  const rel2 = relative(b, a)
  if (rel2 && !rel2.startsWith('..') && !rel2.startsWith(sep)) return { ok: false, reason: `目标是源的祖先：${b}` }
  if (existsSync(b) && readdirSync(b).length > 0) return { ok: false, reason: `目标已存在且非空：${b}` }
  return { ok: true }
}

/** 递归哈希（相对路径 → sha256），用于迁移后一致性校验 */
export function hashTree(root) {
  const out = {}
  const walk = dir => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      if (name === '.migrating') continue
      if (statSync(p).isDirectory()) walk(p)
      else out[relative(root, p)] = createHash('sha256').update(readFileSync(p)).digest('hex')
    }
  }
  walk(root)
  return out
}

/** 自建 git 仓库探测：向上找 .git */
function isInsideGitRepo(p) {
  let cur = resolve(p)
  while (true) {
    if (existsSync(join(cur, '.git'))) return true
    const parent = dirname(cur)
    if (parent === cur) return false
    cur = parent
  }
}

/** 迁移七步（spec §4.6）：切指针放最后，任何中断旧库仍有效 */
export function migrate({ from, to, deps }) {
  const v = validateTarget(from, to)
  if (!v.ok) return { ok: false, reason: v.reason, stage: 'validate-target' }
  const root = resolve(from), target = resolve(to)
  if (deps.isInsideGitRepo(target)) return { ok: false, reason: `KB 位于仓库内：${target}——错题集不得入库`, stage: 'validate-target' }
  const lock = join(root, '.migrating')
  writeFileSync(lock, String(Date.now()), 'utf8')          // 步 3.5 上锁
  try {
    mkdirSync(target, { recursive: true })                  // 步 4 复制
    const copyFile = deps.copyFile ?? copyFileSync
    try {
      for (const [relPath, content] of Object.entries(hashTree(root))) {
        const dest = join(target, relPath)
        mkdirSync(dirname(dest), { recursive: true })
        copyFile(join(root, relPath), dest)
      }
    } catch (e) {
      return { ok: false, reason: `复制失败：${e.message}`, stage: 'copy' }
    }
    const before = hashTree(root), after = hashTree(target) // 步 5 校验
    const beforeKeys = Object.keys(before).sort()
    if (JSON.stringify(beforeKeys) !== JSON.stringify(Object.keys(after).sort()) ||
        beforeKeys.some(k => before[k] !== after[k])) {
      return { ok: false, reason: `迁移校验失败：副本与源不一致（副本保留在 ${target}，请人工处置）`, stage: 'verify' }
    }
    const pointerPath = deps.pointerPath                     // 步 6 切指针（原子写）
    const tmpPath = `${pointerPath}.tmp-${Date.now()}`
    mkdirSync(dirname(pointerPath), { recursive: true })
    writeFileSync(tmpPath, JSON.stringify({ store: target, schemaVersion: SCHEMA_VERSION }, null, 2), 'utf8')
    renameSync(tmpPath, pointerPath)
    return { ok: true, hashCount: beforeKeys.length, pointerPath } // 步 7 由调用方询问是否删旧
  } finally {
    if (existsSync(lock)) rmSync(lock, { force: true })      // 步 7 删锁
  }
}

/** 统计 ledger 计数（供 deferred 的真实 counters） */
export function countLedger(root) {
  const dims = new Set()
  let openCount = 0, landedCount = 0, projects = 0
  const projDir = join(root, 'projects')
  if (!existsSync(projDir)) return { openCount, dims: dims.size, projects, landedCount, totalCount: 0 }
  for (const proj of readdirSync(projDir)) {
    const ledger = join(projDir, proj, 'ledger.md')
    if (!existsSync(ledger)) continue
    projects++
    for (const line of readFileSync(ledger, 'utf8').split(/\r?\n/)) {
      const cells = line.split(/(?<!\\)\|/).map(s => s.trim())
      if (cells.length < 11 || cells[1] === 'ID' || /^-+$/.test(cells[1])) continue
      if (cells[7]) dims.add(cells[7])
      if (cells[10] === 'open') openCount++
      if (cells[10].startsWith('landed')) landedCount++
    }
  }
  return { openCount, dims: dims.size, projects, landedCount, totalCount: openCount + landedCount }
}

// ── CLI 入口守卫：仅当被直接执行时运行 ────────────────────────────
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const cmd = process.argv[2]
  if (cmd === 'resolve') {
    const r = resolveStore({ env: process.env, pointerPaths: pointerCandidates(), deps: { isInsideGitRepo } })
    if (r.ok) { process.stdout.write(r.root + '\n'); process.exit(0) }
    process.stderr.write(`${r.reason}\n下一步：${r.hint}\n`)
    process.exit(1)
  }
  else if (cmd === 'deferred') {
    const r = resolveStore({ env: process.env, pointerPaths: pointerCandidates(), deps: { isInsideGitRepo } })
    if (!r.ok) { process.stderr.write(`${r.reason}\n下一步：${r.hint}\n`); process.exit(1) }
    const counters = countLedger(r.root)
    const { rows, summary } = runDeferred(r.root, counters)
    for (const row of rows) process.stdout.write(`- ${row.id} ${row.item}｜信号：${row.signal}｜${row.hits ? '命中' : '未命中'}（${row.evidence}）\n`)
    process.stdout.write(summary + '\n')
    process.exit(0)
  }
  else if (cmd === 'migrate') {
    const toIdx = process.argv.indexOf('--to')
    const to = toIdx === -1 ? undefined : process.argv[toIdx + 1]
    if (!to) { process.stderr.write('用法：lessons migrate --to <path>\n'); process.exit(1) }
    const r0 = resolveStore({ env: process.env, pointerPaths: pointerCandidates(), deps: { isInsideGitRepo } })
    if (!r0.ok) { process.stderr.write(`${r0.reason}\n下一步：${r0.hint}\n`); process.exit(1) }
    const ptr = pointerCandidates().find(p => existsSync(p)) ?? pointerCandidates()[0]
    const r = migrate({ from: r0.root, to, deps: { pointerPath: ptr, isInsideGitRepo } })
    if (!r.ok) { process.stderr.write(`迁移失败（${r.stage}）：${r.reason}\n`); process.exit(1) }
    process.stdout.write(`迁移完成：${r.hashCount} 个文件已校验一致；指针 → ${r.pointerPath}\n是否删除旧库由你决定（旧库仍完整可用）\n`)
    process.exit(0)
  }
  process.stderr.write(`未知命令：${cmd}\n支持：resolve | deferred | migrate --to <path>\n`)
  process.exit(1)
}
