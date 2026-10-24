// doc-migrate-stamps.mjs —— 一次性批量迁移：给缺前缀的文档补命名前缀
//
// 判据不在这里另写：目录属于哪一类、该补什么前缀，全部来自 doc-name.mjs；
// 改名与引用重写全部来自 doc-rename.mjs。本文件只负责「批量」这一层。
//
// 两条刻意的限制：
//   ① 记录型文件（*-transcript.md）**本身要加时间戳**——它正是「当时的快照」，符合时间戳的语义；
//      但它内部的引用不重写（记录内容按规矩不改），由 doc-rename 的默认跳过规则保证。
//   ② 只加前缀，不做中文转写——转写会造出看不懂的名字，主题名应由人起。
//      含中文的文件会被列为「需人工起名」，不会被静默跳过。
//   ③ 单份确定版 / 索引（README / index / *-index / overview）不进迁移清单：它们原地更新，不产生多版本。
//
// 零外部依赖，只用 Node 内置模块。
import { resolve, relative, basename, dirname, sep } from 'node:path'
import { realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { ROOT, judge, stampOf, suggestName, needsHumanName } from './doc-name.mjs'
import { plan, applyPlan, walkMdFiles, findSameBasename, DEFAULT_SKIP_DIRS } from './doc-rename.mjs'

const toPosix = (p) => p.split(sep).join('/')

// 批量迁移不再跳过记录型文件（见文件头 ①）；需要排除时由调用方传入 skipFile
export const DEFAULT_SKIP_FILE = () => false

/**
 * 算出待迁移清单（不落任何改动）。
 * @param {{root: string, dirs: string[], skipFile?: (rel: string) => boolean, getStamp?: (abs: string) => Date}} p
 */
export function collect({ root, dirs, skipFile = DEFAULT_SKIP_FILE, getStamp }) {
  const tasks = []
  const skipped = []
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
      const r = judge(f, root)
      if (r.ok) continue
      if (skipFile(rel)) { skipped.push({ rel, why: '记录型文件（改名会留死链）' }); continue }
      // 含中文 / 空格 / 下划线的名字：加前缀之后仍不合规，脚本不猜主题名，交人
      if (r.kind === 'generic' || needsHumanName(basename(f))) {
        skipped.push({ rel, why: '需人工起名：含中文 / 空格 / 下划线' })
        continue
      }
      const at = getStamp ? getStamp(f) : stampOf(f).at
      const newName = suggestName({ kind: r.kind, name: basename(f), at })
      const newRel = toPosix(relative(root, resolve(dirname(f), newName)))
      if (newRel === rel) continue
      // 同名文件会让「按文件名匹配」改错引用，批量场景一律跳过（单个改名可用 --allow-ambiguous 人工放行）
      const same = findSameBasename({ root, oldRel: rel, oldName: basename(f) })
      if (same.length > 0) {
        skipped.push({ rel, why: `仓库内有 ${same.length} 个同名文件，按文件名匹配会改错引用` })
        continue
      }
      tasks.push({ rel, newRel, kind: r.kind })
    }
  }
  return { tasks, skipped }
}

/** 渲染迁移计划（dry-run 报告） */
export function renderPlan({ tasks, skipped }) {
  const out = []
  out.push(`[DRY-RUN] 批量补前缀：待改 ${tasks.length} 个文件 / 跳过 ${skipped.length} 个`)
  if (tasks.length === 0) out.push('没有需要迁移的文件（要么都已合规，要么都进了跳过清单）')
  for (const t of tasks) out.push(`  ${t.rel}\n    → ${t.newRel}`)
  if (skipped.length > 0) {
    out.push('')
    out.push('跳过（按规则不改）')
    for (const s of skipped) out.push(`  ${s.rel}  ${s.why}`)
  }
  return out.join('\n')
}

/** 逐个执行（每个文件都走一遍 doc-rename 的 plan/apply，引用重写是同一份实现） */
export function applyAll({ root, tasks }) {
  const done = []
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
    --apply     逐个改名并重写引用（每个文件走一次 doc-rename 的同一实现）`)
}

export function main(argv, root = ROOT) {
  const args = argv.slice(2)
  if (args.includes('--help')) { usage(); return 0 }
  const dirs = []
  for (let i = 0; i < args.length; i++) if (args[i] === '--dir' && args[i + 1]) dirs.push(args[i + 1])
  if (dirs.length === 0) { usage(); return 2 }
  const apply = args.includes('--apply')

  const { tasks, skipped } = collect({ root, dirs })
  console.log(renderPlan({ tasks, skipped }))
  if (!apply) { console.log('（dry-run：未改任何文件。确认无误后加 --apply）'); return 0 }
  if (tasks.length === 0) return 0

  const done = applyAll({ root, tasks })
  const bad = done.filter((d) => !d.ok)
  for (const d of done) console.log(`[APPLY] ${d.rel} → ${d.newRel}${d.ok ? '' : `  失败：${d.why ?? `残留 ${d.residual}`}`}`)
  if (bad.length > 0) { console.error(`${bad.length} 个文件未完成`); return 1 }
  console.log(`已完成 ${done.length} 个文件的迁移`)
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
