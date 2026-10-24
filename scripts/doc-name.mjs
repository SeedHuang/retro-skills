// doc-name.mjs —— 文档命名的唯一判据实现
//
// 为什么要有这一份：`rules/docs-convention.md` 里只有文字表格，没有机器实现，
// 于是「PRD 该不该带时间戳」这类问题每次都要靠人记。本文件把判据落成代码，
// 供 doc-rename / doc-migrate-stamps 复用；以后接进 `npm run check` 也只用改这一处。
//
// 判据分三类（与 docs-convention 的目录语义对齐）：
//   ① 创建时刻类：docs/prd、docs/after —— `YYYYMMDDHHmmss-<主题>.md`（到秒）
//   ② 定稿日期类：specs / plans / handoffs —— `YYYY-MM-DD-<主题>.md`
//   ③ 其余 docs 文档：只禁中文 / 空白 / 下划线（不强制前缀，也不强求全小写——
//      README.md / SKILL.md 这类固定名大量存在，强行小写化只会制造假阳）
//
// 两条总则（时间戳的语义：表达「随时间产生的多版本并存 / 当时的快照」）：
//   · 祖先目录名已带时间戳 → 子文件不再加（retro/<日期>-<那一次>/、reviews/<日期-时刻>-<名>/ 自动命中）
//   · 同一主题只加一层：主题是**目录**时，时间戳加在目录名上（docs/prd/20261024073606-dev-workflow-mainline/），
//     目录内文件用原名（index.md / userconversation.md）——所以 docs/prd 的直接子目录名也要过判据
//   · 只有一份的确定版文稿 / 索引 → 不加（README / index / *-index / overview）：
//     它们原地更新、不产生多版本，加了前缀反而让所有引用跟着动
//
// 零外部依赖，只用 Node 内置模块。
import { statSync, readdirSync, existsSync, realpathSync } from 'node:fs'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const STAMP_RE = /^\d{14}-[a-z0-9][a-z0-9-]*\.md$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}-[a-z0-9][a-z0-9-]*\.md$/
// 目录名是否带时间戳：YYYYMMDDHHmmss- 或 YYYY-MM-DD-
const DIR_STAMP_RE = /^(\d{14}|\d{4}-\d{2}-\d{2})-/
const BAD_GENERIC_RE = /[\u3400-\u9fff\s_]/
// 单份确定版：原地更新、不产生多版本 → 不加时间戳
const SINGLETON_RE = /^(README|index|overview)\.md$|^[a-z0-9-]+-index\.md$/

export const STAMP_DIRS = ['docs/prd', 'docs/after']
export const DATE_DIRS = ['docs/superpowers/specs', 'docs/superpowers/plans', 'docs/handoffs']

// 含中文 / 空白 / 下划线的名字，脚本不自动起名（转写会造出看不懂的名字，交人定主题名）
export const needsHumanName = (name) => BAD_GENERIC_RE.test(name)

const toPosix = (p) => p.split(sep).join('/')
const under = (rel, dir) => rel === dir || rel.startsWith(dir + '/')

/** 该路径的任一祖先目录名是否已带时间戳（有则子文件不再加前缀） */
export function hasStampedAncestor(rel) {
  const parts = toPosix(rel).split('/').slice(0, -1)
  return parts.some((s) => DIR_STAMP_RE.test(s))
}

/** 单份确定版 / 索引：原地更新，不产生多版本 */
export const isSingletonDoc = (name) => SINGLETON_RE.test(name)

/**
 * 判一个文件的命名是否合规。
 * @returns {{ok: boolean, kind: string, rel: string, expect?: string}}
 */
export function judge(absPath, root = ROOT) {
  const rel = toPosix(relative(root, absPath))
  const name = basename(absPath)
  if (!name.endsWith('.md')) return { ok: true, kind: 'non-md', rel }
  if (BAD_GENERIC_RE.test(name)) return { ok: false, kind: 'generic', rel, expect: '禁中文 / 空格 / 下划线' }
  if (isSingletonDoc(name)) return { ok: true, kind: 'singleton', rel }
  if (hasStampedAncestor(rel)) return { ok: true, kind: 'stamped-parent', rel }
  if (STAMP_DIRS.some((d) => under(rel, d))) {
    return STAMP_RE.test(name)
      ? { ok: true, kind: 'stamp', rel }
      : { ok: false, kind: 'stamp', rel, expect: 'YYYYMMDDHHmmss-<主题>.md（创建时刻，到秒）' }
  }
  if (DATE_DIRS.some((d) => under(rel, d))) {
    return DATE_RE.test(name)
      ? { ok: true, kind: 'date', rel }
      : { ok: false, kind: 'date', rel, expect: 'YYYY-MM-DD-<主题>.md（定稿 / 排期日期）' }
  }
  return { ok: true, kind: 'generic', rel }
}

/** 本地时区的 YYYYMMDDHHmmss；不用 toISOString（那是 UTC，会偏时区） */
export function fmt14(date) {
  const p = (n, w = 2) => String(n).padStart(w, '0')
  return (
    p(date.getFullYear(), 4) + p(date.getMonth() + 1) + p(date.getDate()) +
    p(date.getHours()) + p(date.getMinutes()) + p(date.getSeconds())
  )
}

/** 本地时区的 YYYY-MM-DD */
export function fmtDate(date) {
  const p = (n, w = 2) => String(n).padStart(w, '0')
  return `${p(date.getFullYear(), 4)}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
}

/** 取文件的创建时刻；平台不提供 birthtime 时退回 ctime，并标记来路（不静默） */
export function stampOf(absPath) {
  const st = statSync(absPath)
  if (st.birthtimeMs && st.birthtimeMs > 0) return { at: new Date(st.birthtimeMs), from: 'birthtime' }
  return { at: new Date(st.ctimeMs), from: 'ctime' }
}

/** 目录属于哪一类命名规则（按前缀匹配，支持主题子目录：docs/prd/<主题>/x.md 也算 stamp 类） */
export function kindOfDir(relDir) {
  const d = toPosix(relDir)
  if (STAMP_DIRS.some((x) => under(d, x))) return 'stamp'
  if (DATE_DIRS.some((x) => under(d, x))) return 'date'
  return 'generic'
}

/**
 * 生成建议名。只加前缀，不做中文转写——转写会造出看不懂的名字，主题名交人来起。
 * @param {{kind: 'stamp'|'date'|'generic', name: string, at: Date}} p
 */
export function suggestName({ kind, name, at }) {
  const clean = name.endsWith('.md') ? name : name + '.md'
  if (kind === 'stamp') return `${fmt14(at)}-${clean}`
  if (kind === 'date') return `${fmtDate(at)}-${clean}`
  return clean
}

function walkMd(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue // 不跟随链接：自引用会成环，外链会扫到仓库外
    const p = join(dir, entry.name)
    if (entry.isDirectory()) walkMd(p, out)
    else if (entry.name.endsWith('.md')) out.push(p)
  }
  return out
}

/**
 * 目录层检查：某个「命名规则目录」的直接子目录必须带时间戳。
 * 只查直接子目录，不递归——「同一主题只加一层」，带戳目录内部的子目录不再要求。
 */
function checkRuleDirChildren({ ruleAbs, ruleRel, findings, root }) {
  const isStamp = STAMP_DIRS.includes(ruleRel)
  const stampRe = isStamp ? /^\d{14}-[a-z0-9][a-z0-9-]*$/ : /^\d{4}-\d{2}-\d{2}-[a-z0-9][a-z0-9-]*$/
  for (const entry of readdirSync(ruleAbs, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) continue
    if (stampRe.test(entry.name)) continue
    const abs = join(ruleAbs, entry.name)
    if (needsHumanName(entry.name)) {
      findings.push({
        rel: `${toPosix(relative(root, abs))}/`,
        kind: 'stamp-dir',
        expect: '需人工起名：目录名含中文 / 空格 / 下划线',
        suggest: '',
      })
      continue
    }
    const { at } = stampOf(abs)
    findings.push({
      rel: toPosix(relative(root, abs)) + '/',
      kind: 'stamp-dir',
      expect: isStamp ? 'YYYYMMDDHHmmss-<主题>/（目录带时间戳，内部文件用原名）' : 'YYYY-MM-DD-<主题>/',
      suggest: `${isStamp ? fmt14(at) : fmtDate(at)}-${entry.name}/`,
    })
  }
}

/** 扫描一个目录，返回全部不合规项及其建议名 */
export function checkTree(dir, root = ROOT) {
  const target = resolve(root, dir) // 相对路径按 root 解析，避免受调用方 cwd 影响
  if (!existsSync(target)) {
    return { ok: false, findings: [{ rel: toPosix(relative(root, target)), why: '目录不存在' }] }
  }
  const findings = []

  // 目录层：凡是落在扫描目标内（含目标自身）的「命名规则目录」，都要查它的直接子目录。
  // ⚠️ 不能只判「target 恰好等于规则目录」——默认入口是 `--check docs`，那样整段检查会被静默跳过，
  // 守卫看起来存在、实际从不触发（2026-10-24 代码审查问题 1）。
  const parentRel = toPosix(relative(root, target))
  for (const ruleRel of [...STAMP_DIRS, ...DATE_DIRS]) {
    if (ruleRel !== parentRel && !ruleRel.startsWith(parentRel + '/')) continue
    const ruleAbs = resolve(root, ruleRel)
    if (!existsSync(ruleAbs)) continue
    checkRuleDirChildren({ ruleAbs, ruleRel, findings, root })
  }

  for (const f of walkMd(target)) {
    const r = judge(f, root)
    if (r.ok) continue
    const { at, from } = stampOf(f)
    findings.push({
      rel: r.rel,
      kind: r.kind,
      expect: r.expect,
      suggest: suggestName({ kind: r.kind, name: basename(f), at }),
      stampFrom: from,
    })
  }
  return { ok: findings.length === 0, findings }
}

// ───────────────────────────── CLI ─────────────────────────────

function usage() {
  console.log(`用法：
  node scripts/doc-name.mjs --check [目录...] [--json]   检查命名（默认 docs/），有违规则退出码 1
  node scripts/doc-name.mjs --suggest <目录> <名字> --birthtime <文件>
                                                        按该文件的创建时刻给出建议名`)
}

export function main(argv, root = ROOT) {
  const args = argv.slice(2)
  const json = args.includes('--json')
  const mode = args.find((a) => a === '--check' || a === '--suggest' || a === '--help')
  if (!mode || mode === '--help') { usage(); return mode ? 0 : 2 }

  if (mode === '--suggest') {
    const i = args.indexOf('--suggest')
    const dir = args[i + 1]
    const name = args[i + 2]
    const bi = args.indexOf('--birthtime')
    if (!dir || !name) { usage(); return 2 }
    const at = bi > -1 && args[bi + 1] ? stampOf(resolve(args[bi + 1])).at : new Date()
    console.log(suggestName({ kind: kindOfDir(dir), name, at }))
    return 0
  }

  const targets = args.filter((a) => !a.startsWith('--') && a !== mode)
  const dirs = targets.length > 0 ? targets : ['docs']
  const all = []
  for (const d of dirs) for (const f of checkTree(d, root).findings) all.push(f)

  if (json) console.log(JSON.stringify({ violations: all.length, findings: all }, null, 2))
  else if (all.length === 0) console.log(`命名检查通过（${dirs.join(', ')}）`)
  else {
    for (const f of all) console.error(`[命名] ${f.rel}  期望：${f.expect}  建议：${f.suggest}`)
    console.error(`[命名] 共 ${all.length} 处不合规`)
  }
  return all.length === 0 ? 0 : 1
}

// 直接运行判定：realpath 归一后再比（Junction / symlink 下路径字符串必不等 → 会静默退出）
function isMain() {
  if (!process.argv[1]) return false
  try {
    return realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))
  } catch {
    return false
  }
}

if (isMain()) process.exitCode = main(process.argv)
