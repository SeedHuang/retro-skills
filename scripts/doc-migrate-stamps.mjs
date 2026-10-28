// doc-migrate-stamps.mjs —— 一次性批量迁移：给缺前缀的文档补命名前缀
//
// 判据不在这里另写：目录属于哪一类、该补什么前缀，全部来自 doc-name.mjs；
// 改名与引用重写全部来自 doc-rename.mjs。本文件只负责「批量」这一层。
//
// 两层迁移（对应「同一主题只加一层」）：
//   ① 目录层：`docs/prd` / `docs/after` 这类目录的**直接子目录**没带时间戳 → 改目录名，
//      并重写全仓里 `docs/prd/<旧目录>/` 这样的路径前缀；目录内文件不动（它们用原名）。
//   ② 文件层：直接放在这些目录下的单个 `.md`（单文件主题）没带前缀 → 改文件名。
//   两层的边界：若某目录已进目录层任务，它内部的文件一律不进文件层任务（否则会双重改名）。
//
// 三条刻意的限制：
//   · 记录型文件（*-transcript.md / userconversation.md）**本身可以加前缀**（它就是当时的快照），
//     但它内部的引用不重写（记录内容按规矩不改），由 doc-rename 的默认跳过规则保证。
//   · 只加前缀，不做中文转写——转写会造出看不懂的名字，主题名应由人起。
//     含中文 / 空格 / 下划线的名字列为「需人工起名」，不静默跳过。
//   · 单份确定版 / 索引（README / index / *-index / overview）不进迁移清单。
//
// 零外部依赖，只用 Node 内置模块。
import { resolve, relative, basename, dirname, join, sep } from 'node:path'
import { realpathSync, readdirSync, readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { ROOT, judge, stampOf, suggestName, needsHumanName, STAMP_DIRS, DATE_DIRS, fmt14, fmtDate, DIR_STAMP_RE } from './doc-name.mjs'
import {
  plan, applyPlan, walkMdFiles, findSameBasename,
  DEFAULT_SKIP_DIRS, DEFAULT_SKIP_FILE,
} from './doc-rename.mjs'

const toPosix = (p) => p.split(sep).join('/')

// 只能人工处置的 kind：改名解决不了（给的是「该怎么放」，不是「该叫什么」）。
// 必须落 skipped——静默 continue 会让 `doc-name --check` 红、而迁移工具不列任何条目（两工具不自洽）。
const NO_AUTO_FIX = new Map([
  ['loose-in-research', '无自动修法：课题目录根层只放课题目录，请人工收进 YYYYMMDDHHmmss-<课题>/'],
])

// 批量迁移本身不跳过记录型文件（见文件头）；「记录内部引用不重写」由 DEFAULT_SKIP_FILE 保证
export const DEFAULT_SKIP_FILE_MIGRATE = () => false

/** 所有可能含路径引用的文本文件（md / mjs / json），跳过一次性工作区与依赖目录 */
function walkTextFiles(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isSymbolicLink()) continue
    if (e.isDirectory()) {
      if (DEFAULT_SKIP_DIRS.has(e.name)) continue
      walkTextFiles(join(dir, e.name), out)
    } else if (/\.(md|mjs|json)$/.test(e.name)) {
      out.push(join(dir, e.name))
    }
  }
  return out
}

/**
 * 目录层待迁移清单：只查「命名规则目录」的直接子目录。
 * 不做递归——`docs/prd/<已带戳>/sub/` 属于第二层，按「同一主题只加一层」不再要求前缀。
 */
export function collectDirs({ root, dirs, getStamp }) {
  const tasks = []
  const skipped = []
  for (const d of dirs) {
    const abs = resolve(root, d)
    if (!existsSync(abs)) continue
    const parentRel = toPosix(relative(root, abs))
    const isStamp = STAMP_DIRS.includes(parentRel)
    if (!isStamp && !DATE_DIRS.includes(parentRel)) continue
    for (const e of readdirSync(abs, { withFileTypes: true })) {
      if (!e.isDirectory() || e.isSymbolicLink()) continue
      if (DIR_STAMP_RE.test(e.name)) continue
      if (needsHumanName(e.name)) {
        skipped.push({ rel: `${parentRel}/${e.name}/`, why: '需人工起名：含中文 / 空格 / 下划线' })
        continue
      }
      const childAbs = join(abs, e.name)
      const at = getStamp ? getStamp(childAbs) : stampOf(childAbs).at
      const prefix = isStamp ? fmt14(at) : fmtDate(at)
      tasks.push({
        rel: `${parentRel}/${e.name}/`,
        newRel: `${parentRel}/${prefix}-${e.name}/`,
        kind: 'dir',
      })
    }
  }
  return { tasks, skipped }
}

/**
 * 算出待迁移清单（不落任何改动）。
 * @param {{root: string, dirs: string[], skipFile?: (rel: string) => boolean, getStamp?: (abs: string) => Date}} p
 */
export function collect({ root, dirs, skipFile = DEFAULT_SKIP_FILE_MIGRATE, getStamp, includeDirs = true }) {
  const dirRes = includeDirs ? collectDirs({ root, dirs, getStamp }) : { tasks: [], skipped: [] }
  const pendingDirs = new Set(dirRes.tasks.map((t) => t.rel))
  const tasks = []
  const skipped = [...dirRes.skipped]

  for (const d of dirs) {
    const abs = resolve(root, d)
    let files
    try {
      files = walkMdFiles(abs, { skipDirs: DEFAULT_SKIP_DIRS })
    } catch {
      skipped.push({ rel: d, why: '目录不存在' })
      continue
    }
    for (const f of files) {
      const rel = toPosix(relative(root, f))
      // 已进目录层任务的目录，内部文件不再单独改名（否则双重改名 / 名字互相覆盖）
      if ([...pendingDirs].some((pd) => rel.startsWith(pd))) continue
      const r = judge(f, root)
      if (r.ok) continue
      if (skipFile(rel)) { skipped.push({ rel, why: '记录型文件（内部引用不改）' }); continue }
      if (NO_AUTO_FIX.has(r.kind)) {
        skipped.push({ rel, why: NO_AUTO_FIX.get(r.kind) })
        continue
      }
      if (r.kind === 'generic' || needsHumanName(basename(f))) {
        skipped.push({ rel, why: '需人工起名：含中文 / 空格 / 下划线' })
        continue
      }
      const at = getStamp ? getStamp(f) : stampOf(f).at
      const newName = suggestName({ kind: r.kind, name: basename(f), at })
      const newRel = toPosix(relative(root, resolve(dirname(f), newName)))
      if (newRel === rel) continue
      const same = findSameBasename({ root, oldRel: rel, oldName: basename(f) })
      if (same.length > 0) {
        skipped.push({ rel, why: `仓库内有 ${same.length} 个同名文件，按文件名匹配会改错引用` })
        continue
      }
      tasks.push({ rel, newRel, kind: r.kind })
    }
  }
  return { dirTasks: dirRes.tasks, tasks, skipped }
}

/** 渲染迁移计划（dry-run 报告） */
export function renderPlan({ dirTasks = [], tasks, skipped }) {
  const out = []
  out.push(`[DRY-RUN] 批量补前缀：目录 ${dirTasks.length} 个 / 文件 ${tasks.length} 个 / 跳过 ${skipped.length} 个`)
  if (dirTasks.length === 0 && tasks.length === 0) out.push('没有需要迁移的条目（要么都已合规，要么都进了跳过清单）')
  if (dirTasks.length > 0) {
    out.push('')
    out.push('目录层（改目录名 + 重写路径前缀；目录内文件不动）')
    for (const t of dirTasks) out.push(`  ${t.rel}\n    → ${t.newRel}`)
  }
  if (tasks.length > 0) {
    out.push('')
    out.push('文件层（单文件主题）')
    for (const t of tasks) out.push(`  ${t.rel}\n    → ${t.newRel}`)
  }
  if (skipped.length > 0) {
    out.push('')
    out.push('跳过（按规则不改）')
    for (const s of skipped) out.push(`  ${s.rel}  ${s.why}`)
  }
  return out.join('\n')
}

/**
 * 目录改名：先重写 `旧前缀/` → `新前缀/`，再改目录名。
 * 顺序与文件改名一致——反了之后目录内的相对引用不受影响，但全仓的旧前缀会留在文本里。
 */
export function applyDir({ root, task, skipFile = DEFAULT_SKIP_FILE }) {
  const oldAbs = resolve(root, task.rel)
  const newAbs = resolve(root, task.newRel)
  if (!existsSync(oldAbs)) return { ok: false, why: '源目录不存在' }
  if (existsSync(newAbs)) return { ok: false, why: '目标目录已存在' }
  const oldPrefix = task.rel
  const newPrefix = task.newRel
  let files = 0
  for (const f of walkTextFiles(root)) {
    const rel = toPosix(relative(root, f))
    if (skipFile(rel)) continue
    const text = readFileSync(f, 'utf8')
    if (!text.includes(oldPrefix)) continue
    writeFileSync(f, text.split(oldPrefix).join(newPrefix), 'utf8')
    files++
  }
  renameSync(oldAbs, newAbs)
  let residual = 0
  for (const f of walkTextFiles(root)) {
    const rel = toPosix(relative(root, f))
    if (skipFile(rel)) continue
    residual += readFileSync(f, 'utf8').split(oldPrefix).length - 1
  }
  return { ok: residual === 0, residual, rewrittenFiles: files }
}

/** 先跑目录层、再跑文件层（每个文件 / 目录都走 doc-rename 的同一份实现） */
export function applyAll({ root, dirTasks = [], tasks }) {
  const done = []
  for (const t of dirTasks) {
    const res = applyDir({ root, task: t })
    done.push({ ...t, ok: res.ok, why: res.why, residual: res.residual, rewrittenFiles: res.rewrittenFiles })
  }
  for (const t of tasks) {
    const p = plan({ root, oldPath: t.rel, newPath: t.newRel })
    if (!p.oldExists) { done.push({ ...t, ok: false, why: '源文件不存在' }); continue }
    if (p.newExists) { done.push({ ...t, ok: false, why: '目标名已存在' }); continue }
    const res = applyPlan({ root, oldPath: t.rel, newPath: t.newRel, p })
    done.push({ ...t, ok: res.residual === 0, residual: res.residual, rewrittenFiles: res.rewrittenFiles })
  }
  return done
}

// ───────────────────────────── CLI ─────────────────────────────

function usage() {
  console.log(`用法：
  node scripts/doc-migrate-stamps.mjs --dir <目录> [--dir <目录>...] [--apply]
    默认 dry-run：只列「旧名 → 新名」与跳过清单
    --apply     逐个改名并重写引用（先目录层、再文件层）
    目录层只对 docs/prd、docs/after 这类命名规则目录生效（改直接子目录名，目录内文件不动）`)
}

export function main(argv, root = ROOT) {
  const args = argv.slice(2)
  if (args.includes('--help')) { usage(); return 0 }
  const dirs = []
  for (let i = 0; i < args.length; i++) if (args[i] === '--dir' && args[i + 1]) dirs.push(args[i + 1])
  if (dirs.length === 0) { usage(); return 2 }
  const apply = args.includes('--apply')

  const { dirTasks, tasks, skipped } = collect({ root, dirs })
  console.log(renderPlan({ dirTasks, tasks, skipped }))
  if (!apply) { console.log('（dry-run：未改任何文件。确认无误后加 --apply）'); return 0 }
  if (dirTasks.length === 0 && tasks.length === 0) return 0

  const done = applyAll({ root, dirTasks, tasks })
  const bad = done.filter((d) => !d.ok)
  for (const d of done) console.log(`[APPLY] ${d.rel} → ${d.newRel}${d.ok ? '' : `  失败：${d.why ?? `残留 ${d.residual}`}`}`)
  if (bad.length > 0) { console.error(`${bad.length} 个条目未完成`); return 1 }
  console.log(`已完成 ${done.length} 个条目的迁移`)
  return 0
}

// 直接运行判定：realpath 归一后再比
function isMain() {
  if (!process.argv[1]) return false
  try {
    return realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))
  } catch {
    return false
  }
}

if (isMain()) process.exitCode = main(process.argv)
