#!/usr/bin/env node
/**
 * sync.mjs —— 把源仓库的「全局规则」和「技能」同步到 Trae CN 的运行时目录。
 *
 * 体系公理（见 retro-skills/docs/architecture.md §4）：
 *   运行时目录只读；唯一编辑点是源仓库；更新 = 改源 → 跑本脚本。
 *
 * 用法：
 *   node scripts/sync.mjs                    只体检（默认，绝不改动任何东西）
 *   node scripts/sync.mjs --apply            同步：只建"缺失的链接"，不删任何东西
 *   node scripts/sync.mjs --apply --replace  允许把"真实副本 / 指错的链接"换成链接（会删东西）
 *   node scripts/sync.mjs --apply --rm-old   允许清理残留：旧名文件 + 自家失效链接（会删东西）
 *   node --test scripts/sync.test.mjs        跑脚本自己的测试（临时目录里，不碰真实运行时）
 *
 * 安全默认：**只有"建缺失的链接"是默认动作**，一切会删东西的动作都要显式开口。
 *
 * 退出码：0 = 一致；1 = 有差异；2 = 出错
 *
 * 已实测的平台事实（2026-09-28）：
 *   - Trae CN 全局规则目录：~/.trae-cn/user_rules/
 *   - 规则文件名必须形如 rule-<名字>.md（纯 code-style.md 不会被加载）
 *   - 技能目录：~/.trae-cn/skills/<技能名>/（普通目录名即可）
 *   - 符号链接可用（开发者模式已开），且能跨盘
 *
 * 两个 Windows 上的坑，本脚本已绕开：
 *   1. Node 的 lstat 对 junction 报 isSymbolicLink()=false（会误判成普通目录）
 *      → 一律用 readlinkSync 能否成功来判断"是不是链接"
 *   2. 删除链接时若用 rmSync({recursive:true}) 有进到目标里的风险
 *      → 统一走 removeLinkOrCopy()：链接用 rmdir/unlink 只摘链本身
 */

import {
  readdirSync, lstatSync, symlinkSync, unlinkSync, rmdirSync, rmSync,
  readFileSync, existsSync, mkdirSync, readlinkSync,
} from 'node:fs'
import { createHash } from 'node:crypto'
import { join, resolve, dirname } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'

const HOME = homedir()
const APPLY = process.argv.includes('--apply')
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..') // retro-skills 仓库根

// ─────────────────────────────────────────────────────────────
// 映射表：源 → 运行时目标
//
// 路径全部可用环境变量覆盖 —— **换机器 / 别人 clone 后不用改代码**：
//   MY_RULES_SRC     规则源目录        （默认 D:\Seed\my-rules\rules）
//   RETRO_SKILLS_DIR 技能源目录        （默认 本脚本所在仓库的 skills\）
//   TRAE_RULES_DST   Trae CN 全局规则目录（默认 ~\.trae-cn\user_rules）
//   TRAE_SKILLS_DST  Trae CN 技能目录   （默认 ~\.trae-cn\skills）
// 加新仓库（如将来换编辑器 / 收编别的技能）时，在 TARGETS 里加一行即可。
// ─────────────────────────────────────────────────────────────
const RULES_SRC = process.env.MY_RULES_SRC || 'D:\\Seed\\my-rules\\rules'
const SKILLS_SRC = process.env.RETRO_SKILLS_DIR || join(REPO_ROOT, 'skills')
const TRAE_RULES_DST = process.env.TRAE_RULES_DST || join(HOME, '.trae-cn', 'user_rules')
const TRAE_SKILLS_DST = process.env.TRAE_SKILLS_DST || join(HOME, '.trae-cn', 'skills')

const TARGETS = [
  {
    label: '全局规则',
    srcDir: RULES_SRC,
    dstDir: TRAE_RULES_DST,
    dstName: (srcName) => `rule-${srcName}`, // 已实测：这个形状才会被加载
    dirLevel: false,
  },
  {
    label: '技能',
    srcDir: SKILLS_SRC,
    dstDir: TRAE_SKILLS_DST,
    dstName: (srcName) => srcName,
    dirLevel: true,
  },
]

// ─────────────────────────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────────────────────────

/** 是不是链接？用 readlinkSync 能否成功判断（junction 与 symlink 都覆盖） */
function linkTarget(p) {
  try {
    return readlinkSync(p)
  } catch {
    return null
  }
}

/** 存在吗？用 lstat（这样"断链"也能被认出来，existsSync 对断链返回 false） */
function lexists(p) {
  try {
    lstatSync(p)
    return true
  } catch {
    return false
  }
}

function sha256File(p) {
  return createHash('sha256').update(readFileSync(p)).digest('hex').slice(0, 12)
}

/** 目录指纹：不进链接内部遍历（避免跑到目标里去，也避免断链报错） */
function sha256Dir(dir) {
  const h = createHash('sha256')
  const walk = (d, rel) => {
    for (const name of readdirSync(d).sort()) {
      const p = join(d, name)
      const lt = linkTarget(p)
      if (lt) {
        h.update(`${rel}/${name}:link:${lt}`)
      } else if (lstatSync(p).isDirectory()) {
        walk(p, join(rel, name))
      } else {
        h.update(`${rel}/${name}:`).update(readFileSync(p))
      }
    }
  }
  walk(dir, '')
  return h.digest('hex').slice(0, 12)
}

/** 统一指纹：链接用"指向"当指纹；文件/目录用内容 */
function fingerprint(p) {
  const lt = linkTarget(p)
  if (lt) return `link:${lt}`
  return lstatSync(p).isDirectory() ? `dir:${sha256Dir(p)}` : `file:${sha256File(p)}`
}

/** 只摘链接本身，绝不进目标里删东西 */
function removeLinkOrCopy(p) {
  const lt = linkTarget(p)
  if (lt) {
    try { rmdirSync(p) } catch { unlinkSync(p) } // junction → rmdir；symlink → unlink
    return
  }
  const st = lstatSync(p)
  if (st.isDirectory()) rmSync(p, { recursive: true, force: true })
  else unlinkSync(p)
}

// ─────────────────────────────────────────────────────────────
// 体检：算出「计划」与「问题」，绝不改动任何东西
// ─────────────────────────────────────────────────────────────
function inspect(t) {
  if (!existsSync(t.srcDir)) {
    throw new Error(`源目录不存在：${t.srcDir}（用环境变量 MY_RULES_SRC / RETRO_SKILLS_DIR 覆盖，或改 sync.mjs 里 TARGETS 的默认值）`)
  }

  const srcNames = readdirSync(t.srcDir).filter((n) => !n.startsWith('.'))
  const want = new Map() // 运行时文件名 → { srcName, srcFull, srcFp }
  for (const srcName of srcNames) {
    const srcFull = join(t.srcDir, srcName)
    want.set(t.dstName(srcName), { srcName, srcFull, srcFp: fingerprint(srcFull) })
  }

  const present = existsSync(t.dstDir)
    ? readdirSync(t.dstDir).filter((n) => !n.startsWith('.'))
    : []

  const ok = [], needLink = [], wrong = [], legacy = [], staleSelf = [], orphans = []
  const managed = new Set(want.keys())

  for (const [dstName, info] of want) {
    const dstFull = join(t.dstDir, dstName)
    if (!lexists(dstFull)) {
      needLink.push({ dstName, info, why: '缺失' })
      continue
    }
    const lt = linkTarget(dstFull)
    if (!lt) {
      const same = fingerprint(dstFull) === info.srcFp
      wrong.push({ dstName, info, why: same ? '真实副本（内容一致，其实是复制不是链接）' : '真实副本（内容已过时）' })
      continue
    }
    if (!existsSync(dstFull)) {
      needLink.push({ dstName, info, why: '链接已断（目标不存在）' })
      continue
    }
    if (resolve(lt) !== resolve(info.srcFull)) {
      wrong.push({ dstName, info, why: `链接指向别处：${lt}` })
      continue
    }
    ok.push({ dstName, info })
  }

  // 运行时里「不在计划内」的条目：只分类，绝不动手
  for (const name of present) {
    if (managed.has(name)) continue
    const full = join(t.dstDir, name)
    const lt = linkTarget(full)

    // 是不是"我们自己留下的"？—— 链接指向 srcDir 里的某个（而现在源里已无此文件的）路径
    if (lt && resolve(lt) !== resolve(t.srcDir) && dirname(resolve(lt)).startsWith(resolve(t.srcDir))) {
      staleSelf.push({ name, full, target: lt })
      continue
    }

    let fp = null
    try { fp = fingerprint(full) } catch { /* 断链等，忽略 */ }
    const matched = [...want.values()].find((v) => v.srcFp === fp && fp && !fp.startsWith('link:'))
    if (matched) legacy.push({ name, full, dstName: t.dstName(matched.srcName) })
    else orphans.push({ name, isLink: !!lt })
  }

  return { t, ok, needLink, wrong, legacy, staleSelf, orphans }
}

// ─────────────────────────────────────────────────────────────
// 执行：建链接 → （可选）替换 → （可选）清理 → 校验
//
// 安全默认：**只有"建缺失的链接"是默认动作**。
//   - 替换真实副本/指错的链接（会删东西）→ 必须 opts.replace
//   - 清理旧名残留 / 自家残留链接（也会删东西）→ 必须 opts.rmOld
// ─────────────────────────────────────────────────────────────
function applyOne(r, opts = {}) {
  const { t } = r
  if (!existsSync(t.dstDir)) mkdirSync(t.dstDir, { recursive: true })
  const log = []
  const linkType = t.dirLevel ? 'junction' : 'file'

  // 1) 缺失的链接：安全动作，默认就做
  for (const item of r.needLink) {
    const dstFull = join(t.dstDir, item.dstName)
    if (lexists(dstFull)) removeLinkOrCopy(dstFull)
    symlinkSync(item.info.srcFull, dstFull, linkType)
    log.push(`建链接  ${item.dstName}`)
  }

  // 2) 替换"真实副本 / 指错的链接"——会删东西，必须显式 --replace
  if (r.wrong.length) {
    if (!opts.replace) {
      log.push(`跳过需替换的 ${r.wrong.length} 项（会删东西，加 --replace 才做）：${r.wrong.map((x) => x.dstName).join('、')}`)
    } else {
      for (const item of r.wrong) {
        const dstFull = join(t.dstDir, item.dstName)
        if (lexists(dstFull)) removeLinkOrCopy(dstFull)
        symlinkSync(item.info.srcFull, dstFull, linkType)
        log.push(`替换    ${item.dstName}  （原内容已删）`)
      }
    }
  }

  // 3) 清理残留——也会删东西，必须显式 --rm-old
  const junk = [
    ...r.legacy.map((x) => ({ name: x.name, full: x.full, why: '旧名，内容已由新名承载' })),
    ...r.staleSelf.map((x) => ({ name: x.name, full: x.full, why: '自家残留链接（源里已无此文件）' })),
  ]
  if (junk.length) {
    if (!opts.rmOld) {
      log.push(`保留残留 ${junk.length} 项（会删东西，加 --rm-old 才清）：${junk.map((x) => x.name).join('、')}`)
    } else {
      for (const x of junk) {
        removeLinkOrCopy(x.full)
        log.push(`清理    ${x.name}  （${x.why}）`)
      }
    }
  }

  // 4) 校验刚建的链接读得到
  for (const item of [...r.needLink, ...(opts.replace ? r.wrong : [])]) {
    const dstFull = join(t.dstDir, item.dstName)
    if (!existsSync(dstFull)) throw new Error(`建完链接后仍读不到：${dstFull}`)
  }
  return log
}

// ─────────────────────────────────────────────────────────────
// 主流程（只有"直接执行"时才跑；被 import 时不跑，方便测试）
// ─────────────────────────────────────────────────────────────
function main() {
  const argv = process.argv.slice(2)
  const flags = {
    apply: argv.includes('--apply'),
    replace: argv.includes('--replace'),
    rmOld: argv.includes('--rm-old'),
  }

  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(`用法：
  node scripts/sync.mjs                    只体检（默认，绝不改动任何东西）
  node scripts/sync.mjs --apply            同步：只建"缺失的链接"，不删任何东西
  node scripts/sync.mjs --apply --replace  允许把"真实副本 / 指错的链接"换成链接（会删东西）
  node scripts/sync.mjs --apply --rm-old   允许清理残留：旧名文件 + 自家失效链接（会删东西）
  node scripts/sync.mjs list               列出源仓库里有哪些条目（只读）
  node --test scripts/sync.test.mjs        跑脚本自己的测试（临时目录里，不碰真实运行时）

路径可用环境变量覆盖（换机器 / 别人 clone 后不用改代码）：
  MY_RULES_SRC / RETRO_SKILLS_DIR / TRAE_RULES_DST / TRAE_SKILLS_DST`)
    return 0
  }

  if (argv[0] === 'list') {
    for (const t of TARGETS) {
      console.log(`\n[${t.label}]  ${t.dstDir}`)
      console.log(`  源：${t.srcDir}`)
      if (!existsSync(t.srcDir)) { console.log('  ✗ 源目录不存在'); continue }
      for (const n of readdirSync(t.srcDir).filter((x) => !x.startsWith('.'))) {
        console.log(`  ${t.dstName(n)}`)
      }
    }
    console.log('')
    return 0
  }

  console.log(`\n${flags.apply ? '== 执行同步（--apply）==' : '== 体检（只读，不改动任何东西）=='}`)
  console.log(`源仓库根：${REPO_ROOT}\n`)

  let hasIssue = false
  let failed = false

  for (const t of TARGETS) {
    let r
    try {
      r = inspect(t)
    } catch (e) {
      console.log(`── [${t.label}] 体检失败：${e.message}\n`)
      failed = true
      continue
    }

    console.log(`── [${t.label}]`)
    console.log(`   源：${t.srcDir}`)
    console.log(`   目标：${t.dstDir}`)
    console.log(
      `   已就位 ${r.ok.length} ｜ 需建链接 ${r.needLink.length} ｜ 需替换 ${r.wrong.length} ｜ 待迁移旧名 ${r.legacy.length} ｜ 自家残留 ${r.staleSelf.length} ｜ 孤儿(不动) ${r.orphans.length}`,
    )
    for (const x of r.ok) console.log(`   ✓ ${x.dstName}`)
    for (const x of r.needLink) console.log(`   ＋ ${x.dstName}   (${x.why})`)
    for (const x of r.wrong) console.log(`   ⚠ ${x.dstName}   (${x.why})`)
    for (const x of r.legacy) console.log(`   ↻ ${x.name}  →  将由 ${x.dstName} 替代`)
    for (const x of r.staleSelf) console.log(`   ⌫ 自家残留（源里已无此文件，加 --rm-old 清理）：${x.name}`)
    for (const x of r.orphans) console.log(`   ？ 孤儿（不属于本脚本管理，不动）：${x.name}${x.isLink ? ' [链接]' : ''}`)

    if (r.needLink.length || r.wrong.length || r.legacy.length || r.staleSelf.length) hasIssue = true

    if (flags.apply && hasIssue) {
      try {
        for (const line of applyOne(r, flags)) console.log(`   · ${line}`)
      } catch (e) {
        console.log(`   ✗ 同步失败：${e.message}`)
        failed = true
      }
    }
    console.log('')
  }

  if (failed) {
    console.log('→ 出错了，请看上面的 ✗。\n')
    return 2
  }
  if (flags.apply) {
    console.log('→ 同步完成。请再跑一次体检确认：node scripts/sync.mjs\n')
    return 0
  }
  console.log(hasIssue ? '→ 有差异。确认无误后执行：node scripts/sync.mjs --apply\n' : '→ 全部一致，无需同步。\n')
  return hasIssue ? 1 : 0
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) process.exit(main())

export {
  TARGETS, linkTarget, lexists, sha256File, sha256Dir, fingerprint, removeLinkOrCopy,
  inspect, applyOne, main,
}
