// doc-rename.mjs —— 单文件改名 + 全仓引用重写（默认 dry-run）
//
// 为什么默认 dry-run：改名最容易翻车的不是漏改，是改错——
//   ① 真引用（markdown 链接 / 反引号里的路径）该改；
//   ② 历史记录 / 示例里的提及不该改（改了等于改写历史）；
//   ③ 巧合子串（`old.md` 命中 `xxx-old.md`）改了会弄坏别的文件。
// 所以先出「行号 + 上下文 + 命中类型」的报告，人过目后再 --apply。
//
// 零外部依赖，只用 Node 内置模块。
import { readFileSync, writeFileSync, readdirSync, renameSync, existsSync, realpathSync } from 'node:fs'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// 与 check-all.mjs 的 MD_SKIP_DIRS 同口径：一次性工作区 / 个人数据 / 依赖目录不参与改写
export const DEFAULT_SKIP_DIRS = new Set(['.git', 'node_modules', '.session', '.superpowers', 'lessons', '.trae'])
// 记录型文件默认跳过（改它等于改写历史）；日志同理
export const DEFAULT_SKIP_FILE = (rel) => rel.endsWith('-transcript.md') || rel.endsWith('.log')

const toPosix = (p) => p.split(sep).join('/')
const CTX = 30 // 上下文各取多少字符

export function walkMdFiles(dir, { skipDirs = DEFAULT_SKIP_DIRS } = {}, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue // 不跟随链接：自引用成环、外链扫到仓库外
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue
      walkMdFiles(join(dir, entry.name), { skipDirs }, out)
    } else if (entry.name.endsWith('.md')) {
      out.push(join(dir, entry.name))
    }
  }
  return out
}

/**
 * 命中类型：link（markdown 链接目标 / file:/// 路径）、code（反引号内）、prose（正文提及）。
 * 只作标注，默认三类都改——但人能一眼看出哪条是「记录里的提及」需要跳过。
 */
export function classifyHit(line, start, end) {
  const before = line.slice(0, start)
  if ((before.match(/`/g) || []).length % 2 === 1) return 'code'
  const pre = line.slice(Math.max(0, start - 2), start)
  const tail = line.slice(end)
  if (pre.endsWith('](') && tail.startsWith(')')) return 'link'
  if (before.includes('file:///')) return 'link'
  return 'prose'
}

const mark = (text, start, end, replacement) =>
  text.slice(0, start) + '[' + replacement + ']' + text.slice(end)

/** 命中点前后各 CTX 字符的窗口（长表格行才不会把报告冲垮） */
function windowed(line, start, end, replacement) {
  const from = Math.max(0, start - CTX)
  const to = Math.min(line.length, end + CTX)
  const prefix = from > 0 ? '…' : ''
  const suffix = to < line.length ? '…' : ''
  const head = line.slice(from, start)
  const tail = line.slice(end, to)
  return {
    before: `${prefix}${head}[${line.slice(start, end)}]${tail}${suffix}`,
    after: `${prefix}${head}[${replacement}]${tail}${suffix}`,
  }
}

/**
 * 扫全仓引用。跳过的文件也照扫并单独归类——
 * 静默跳过与没扫过是一回事，所以跳过项必须在报告里单独列出来。
 */
export function scanRefs({ root, oldName, newName, skipDirs = DEFAULT_SKIP_DIRS, skipFile = DEFAULT_SKIP_FILE }) {
  const hits = []
  for (const file of walkMdFiles(root, { skipDirs })) {
    const rel = toPosix(relative(root, file))
    const skipReason = skipFile(rel) ? '记录 / 日志文件（默认跳过）' : null
    const lines = readFileSync(file, 'utf8').split(/\r?\n/)
    lines.forEach((line, i) => {
      let idx = line.indexOf(oldName)
      while (idx !== -1) {
        const end = idx + oldName.length
        const w = windowed(line, idx, end, newName)
        hits.push({
          file: rel,
          line: i + 1,
          col: idx + 1,
          type: classifyHit(line, idx, end),
          before: w.before,
          after: w.after,
          fullBefore: mark(line, idx, end, oldName),
          fullAfter: mark(line, idx, end, newName),
          lineText: line,
          skipped: skipReason,
        })
        idx = line.indexOf(oldName, idx + 1)
      }
    })
  }
  return hits
}

function walkAllFiles(dir, skipDirs, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue
      walkAllFiles(join(dir, entry.name), skipDirs, out)
    } else {
      out.push(join(dir, entry.name))
    }
  }
  return out
}

/**
 * 仓库内同名文件（不含正在改的这个）。
 * 为什么必须查：本工具按「文件名」匹配引用，同名文件会让 `progress.md` 这类通用名的改名
 * 连带改到指向另一个文件的行——先查出来，ambiguity 存在时默认拒绝 apply。
 */
export function findSameBasename({ root, oldRel, oldName, skipDirs = DEFAULT_SKIP_DIRS }) {
  return walkAllFiles(resolve(root), skipDirs)
    .map((f) => toPosix(relative(root, f)))
    .filter((rel) => rel !== toPosix(oldRel) && basename(rel) === oldName)
}

/** 生成改名计划（不落任何改动） */
export function plan({ root, oldPath, newPath, skipDirs = DEFAULT_SKIP_DIRS, skipFile = DEFAULT_SKIP_FILE }) {
  const oldAbs = resolve(root, oldPath)
  const newAbs = resolve(root, newPath)
  const oldName = basename(oldAbs)
  const newName = basename(newAbs)
  const oldRel = toPosix(relative(root, oldAbs))
  const hits = scanRefs({ root, oldName, newName, skipDirs, skipFile })
  const changes = hits.filter((h) => !h.skipped)
  const files = [...new Set(changes.map((h) => h.file))]
  return {
    oldRel,
    newRel: toPosix(relative(root, newAbs)),
    oldName,
    newName,
    oldExists: existsSync(oldAbs),
    newExists: existsSync(newAbs),
    ambiguous: findSameBasename({ root, oldRel, oldName, skipDirs }),
    hits,
    changes,
    skipped: hits.filter((h) => h.skipped),
    files,
  }
}

/**
 * 残留计数：改完之后仍然「没被改」的旧名出现次数。
 * ⚠ 加前缀式改名（`plain.md` → `20260102030405-plain.md`）里，新名本身包含旧名，
 * 直接数旧名会把已改好的也算成残留。判据：旧名前面紧挨着「新名比旧名多出来的那截前缀」
 * 就算已改；否则才算残留。
 */
export function countResidual({ root, oldName, newName, skipDirs = DEFAULT_SKIP_DIRS, skipFile = DEFAULT_SKIP_FILE }) {
  const prefix = newName.endsWith(oldName) ? newName.slice(0, newName.length - oldName.length) : ''
  return scanRefs({ root, oldName, newName, skipDirs, skipFile })
    .filter((h) => !h.skipped)
    .filter((h) => {
      if (!prefix) return true
      const start = h.col - 1
      return h.lineText.slice(Math.max(0, start - prefix.length), start) !== prefix
    }).length
}

/**
 * 执行：先改引用内容、再改文件名。
 * 顺序不能反——反了之后「被改名的文件自身含自引用」就写不回去了。
 */
export function applyPlan({ root, oldPath, newPath, p }) {
  const oldAbs = resolve(root, oldPath)
  const newAbs = resolve(root, newPath)
  for (const rel of p.files) {
    const abs = resolve(root, rel)
    const text = readFileSync(abs, 'utf8')
    writeFileSync(abs, text.split(p.oldName).join(p.newName), 'utf8')
  }
  renameSync(oldAbs, newAbs)
  const residual = countResidual({ root, oldName: p.oldName, newName: p.newName })
  return { rewrittenFiles: p.files.length, residual }
}

/** 渲染报告（dry-run 与 apply 后共用） */
export function renderReport(p, { full = false, capPerFile = 20 } = {}) {
  const out = []
  out.push(`[DRY-RUN] 改名：${p.oldRel} → ${p.newRel}`)
  out.push(`引用扫描：${p.hits.length} 处命中 / 需改 ${p.changes.length} 处 / 跳过 ${p.skipped.length} 处，分布在 ${p.files.length} 个文件`)
  if (!p.oldExists) out.push('⚠ 源文件不存在')
  if (p.newExists) out.push('⚠ 目标名已存在，apply 会失败')
  if (p.ambiguous?.length > 0) {
    out.push(`⚠ 仓库内另有 ${p.ambiguous.length} 个同名文件：${p.ambiguous.join(' / ')}`)
    out.push('   按文件名匹配会连带改到指向它们的行；apply 默认拒绝（确认无影响才加 --allow-ambiguous）')
  }

  const byFile = new Map()
  for (const h of p.changes) {
    if (!byFile.has(h.file)) byFile.set(h.file, [])
    byFile.get(h.file).push(h)
  }
  for (const [file, list] of byFile) {
    out.push('')
    out.push(file)
    for (const h of list.slice(0, capPerFile)) {
      out.push(`  L${h.line}  ${h.type.padEnd(5)} ${full ? h.fullBefore : h.before}`)
      out.push(`           →   ${full ? h.fullAfter : h.after}`)
    }
    if (list.length > capPerFile) out.push(`  …另有 ${list.length - capPerFile} 处（用 --full 查看）`)
  }

  if (p.skipped.length > 0) {
    out.push('')
    out.push('跳过（按规则不改）')
    for (const h of p.skipped) out.push(`  ${h.file}  L${h.line}  ${h.skipped}`)
  }

  const changedLines = new Set(p.changes.map((h) => `${h.file}:${h.line}`)).size
  out.push('')
  out.push(`合计：将改 ${changedLines} 行 / 分布在 ${p.files.length} 个文件`)
  return out.join('\n')
}

// ───────────────────────────── CLI ─────────────────────────────

function usage() {
  console.log(`用法：
  node scripts/doc-rename.mjs <旧路径> <新路径> [--apply] [--full] [--root <目录>] [--allow-ambiguous]
    默认 dry-run：只出报告，不动文件
    --apply            真改（先改引用内容，再改文件名），改完自动复扫残留
    --full             打印整行原文（默认只打命中点前后各 ${CTX} 字符）
    --allow-ambiguous  仓库内有同名文件时仍允许 apply（默认拒绝）`)
}

export function main(argv) {
  const args = argv.slice(2)
  if (args.length < 2 || args.includes('--help')) { usage(); return 2 }
  const apply = args.includes('--apply')
  const full = args.includes('--full')
  const ri = args.indexOf('--root')
  const root = ri > -1 ? resolve(args[ri + 1]) : ROOT
  const positional = args.filter((a, i) => !a.startsWith('--') && !(ri > -1 && i === ri + 1))
  const [oldPath, newPath] = positional
  if (!oldPath || !newPath) { usage(); return 2 }

  const p = plan({ root, oldPath, newPath })
  console.log(renderReport(p, { full }))
  if (!apply) {
    console.log('（dry-run：未改任何文件。确认无误后加 --apply）')
    return 0
  }
  if (!p.oldExists) { console.error('源文件不存在，未执行'); return 2 }
  if (p.newExists) { console.error('目标名已存在，未执行'); return 2 }
  if (p.ambiguous.length > 0 && !args.includes('--allow-ambiguous')) {
    console.error(`仓库内另有 ${p.ambiguous.length} 个同名文件，按文件名匹配会改错引用；确认无影响再加 --allow-ambiguous`)
    return 2
  }
  const res = applyPlan({ root, oldPath, newPath, p })
  console.log(`[APPLY] 已改 ${res.rewrittenFiles} 个文件的引用，文件已改名；残留 ${res.residual} 处`)
  if (res.residual !== 0) { console.error('残留不为 0（跳过项除外），请检查'); return 1 }
  return 0
}

// 直接运行判定：realpath 归一后再比（Junction / symlink 下路径字符串必不等 → 静默退出）
function isMain() {
  if (!process.argv[1]) return false
  try {
    return realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))
  } catch {
    return false
  }
}

if (isMain()) process.exitCode = main(process.argv)
