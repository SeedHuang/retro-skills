// skill-dir.mjs —— 「什么算一个技能目录」的**唯一真相源**
//
// 为什么单独成文件：2026-10-15 实测教训（见 .session/reviews/2026-10-14-2248-review-all-to-death/progress.md
// 「轮次复盘 · R4-R6」）。这段判据曾有 3 份副本（check-all.mjs / skill-inspector check.mjs /
// validate.test.mjs），R4-R6 三轮里「统一口径」分了 3 次才做完：每轮只统一一部分（结果 → 目录层 → 错误契约），
// 9 条发现里 6 条是同一根因的不同分支。同族扫描只能保证「改动时同步」，保证不了「后来新增的分支也同步」——
// R5 把 catch 加在内层却漏了外层、R5 的 catch 语义分歧都是**新增分支**，扫描时无「同族」可扫。
//
// 判据单源 = 根治手段（同全局规则 rules-single-source：判据只建在一处，改源即生效）。
// **改这个文件前，先确认三处消费方都受益；不要在消费方另写一份。**
import { readdirSync, lstatSync } from 'node:fs'
import { join } from 'node:path'

export const SKILL_MD = 'SKILL.md'

/**
 * 判断 `parent` 下的 `name` 是否是一个技能目录。
 *
 * 两层判定，缺一不可（缺过的后果见 progress.md 复盘）：
 * ① 目录层：调用方须先用 `withFileTypes` 的 `isDirectory()` 过滤——**对 junction / symlink 返回 false**，
 *    天然不跟随。若这里用裸 readdirSync，junction 会被当普通条目 → 判定与别处相反。
 * ② 文件层：`lstatSync`（不跟随符号链接）确认 `SKILL.md` 是真文件——防它是指向特殊设备
 *    （/dev/zero、FIFO）或超大外部文件的链接，被 readFileSync 读爆。
 *
 * 错误契约：**ENOENT 静默跳过（正常路径：就是没有 SKILL.md）；其余错误抛出**。
 * 反面做法是一律 catch → return false，那会让「因权限读不到」被当成「不是技能目录」→
 * 该技能整体静默漏扫 → 违规一条不报、exit 0 —— 闸门最该防的假干净，比抛错更坏。
 */
export function isSkillDir(parent, name) {
  let st
  try {
    st = lstatSync(join(parent, name, SKILL_MD))
  } catch (e) {
    if (e.code === 'ENOENT') return false
    throw new Error(`读取 ${join(parent, name, SKILL_MD)} 失败：${e.code || e.message}`)
  }
  return st.isFile()
}

/**
 * 列出 `parent` 下的技能目录名（已按 ① 过滤 + ② 判定）。
 * 调用方拿它做「哪些是技能」；不要自己再写一遍 readdir + 判定。
 */
export function listSkillDirs(parent) {
  let entries
  try {
    entries = readdirSync(parent, { withFileTypes: true })
  } catch (e) {
    throw new Error(`读取技能目录失败：${parent}（${e.code || e.message}）`)
  }
  return entries
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .filter(name => isSkillDir(parent, name))
}
