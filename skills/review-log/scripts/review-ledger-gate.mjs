// review-ledger-gate.mjs —— 机械核对 progress.md 轮次账的完整性
// 用法：node skills/review-log/scripts/review-ledger-gate.mjs <progress.md 路径>
//
// 为什么要有它：2026-10-20 实测——轮次账最后一轮只填起点、耗时留空，靠模板/查账表这类 AI 层规则拦不住
// （agent 自觉失效）。本脚本把「每轮起止/耗时必填」变成机器可判，收尾时跑它，坏账本直接 exit 1。
// 判据（待办出处：docs/after/review-ledger-mechanical-gate.md）：
//   硬判 FAIL：轮次账每行「起止」「耗时」两列必须填——
//     合法值 = HH:MM~HH:MM / HH:MM:SS~HH:MM:SS（起止）、N m（耗时，如 39m）、或显式「未取数」；
//     整格留空、只填一端（如「13:41~」「~13:41」「12:39」无 ~ 分隔）、非法格式 = FAIL。
//   软判 WARN（默认不阻断）：① 有格子填「未取数」——诚实记录合法，但不该成为常态；
//     ② 轮次账行数 ≠ 轮次小节数——可能缺了「## 第 N 轮」独立小节。
// 兼容两种模板：review-log（9 列）与 parliament（9 列）的轮次账——「起止」「耗时」按表头列名动态定位，不硬编码列位。
// 为什么不挂 npm run check：.session/ 在 .gitignore，check-all ④ 段跳过它（判据见 review-ledger-mechanical-gate.md）。

import { readFileSync } from 'node:fs'

const target = process.argv[2]

if (!target) {
  console.error('用法：node skills/review-log/scripts/review-ledger-gate.mjs <progress.md 路径>')
  process.exit(2)
}

let text
try {
  text = readFileSync(target, 'utf8')
} catch (e) {
  console.error(`读取 ${target} 失败：${e.message}`)
  process.exit(2)
}

const lines = text.split(/\r?\n/)

// 找轮次账表：表头行含「轮」与「起止」
const headerIdx = lines.findIndex(l => /^\|\s*轮\s*\|/.test(l) && l.includes('起止'))
if (headerIdx === -1) {
  console.error(`未找到轮次账表（表头应为「| 轮 | 起止…」）：${target}`)
  process.exit(2)
}

// 按表头列名动态定位「起止」「耗时」列 index，不硬编码列位（模板加列/调序不静默错位）
const headerCells = lines[headerIdx].split('|').map(s => s.trim())
const colStartStop = headerCells.findIndex(c => c.includes('起止'))
const colCost = headerCells.findIndex(c => c.includes('耗时'))
if (colStartStop === -1 || colCost === -1) {
  console.error(`轮次账表头缺「起止」或「耗时」列：${target}`)
  process.exit(2)
}

const dataRows = []
for (let i = headerIdx + 1; i < lines.length; i++) {
  const l = lines[i]
  if (/^\|[\s:|-]+\|$/.test(l)) continue // 分隔行（|---|）跳过
  if (!/^\|\s*\d+\s*\|/.test(l)) break // 非数据行 → 表结束
  const cells = l.split('|').map(s => s.trim())
  dataRows.push({ row: cells[1] || '(空)', startStop: cells[colStartStop] ?? '', cost: cells[colCost] ?? '' })
}

if (dataRows.length === 0) {
  console.error(`轮次账表下无数据行：${target}`)
  process.exit(2)
}

// 判据
// 核心拦截目标：起止/耗时「留空」「只填一端」——2026-10-20 第 4 轮、docgen-p2-prd 第 5 轮的病根。
// 格式装饰（**加粗**、括号注释、~ 前缀）是历史账本的合理变体，剥离后判端，格式怪只 WARN 不 FAIL。
const NOT_TAKEN = '未取数'
// 剥掉 markdown 加粗与中/英文括号注释，取纯文本
const stripDeco = s => s.replace(/\*\*/g, '').replace(/[（(].*?[）)]/g, '').trim()

const fails = []
const warns = []

for (const r of dataRows) {
  const ss = r.startStop
  const cost = r.cost

  // ── 起止列 ──
  if (ss === '') fails.push(`第 ${r.row} 轮：起止列留空（必须填 HH:MM:SS~HH:MM:SS 或显式「未取数」）`)
  else if (ss === NOT_TAKEN) {
    warns.push(`第 ${r.row} 轮：起止整格标「未取数」（诚实记录合法，但不该成为常态——每轮起/止应各跑一次 time.mjs）`)
  } else if (/\d{1,2}:\d{2}(?::\d{2})?/.test(stripDeco(ss))) {
    // 内含至少一个时间点 → 已填；但必须成对（起~止），缺 ~ 分隔或只填一端都是病
    const stripped = stripDeco(ss)
    if (!stripped.includes('~')) {
      // 裸单时间点无 ~ 分隔（如「12:39」）——2026-10-20 病根变体，静默放行会漏网
      fails.push(`第 ${r.row} 轮：起止缺「~」分隔「${ss}」（起~止必须成对，如 12:39~12:50；缺的那端标「未取数」）`)
    } else {
      const oneSideBlank = /~$/.test(stripped) || /^~/.test(stripped)
      const sides = stripped.split('~').map(s => s.trim())
      const sidesOk = sides.length === 2 && sides.every(s => s === NOT_TAKEN || /^\d{1,2}:\d{2}(?::\d{2})?$/.test(s))
      if (oneSideBlank) {
        fails.push(`第 ${r.row} 轮：起止只填了一端「${ss}」（起/止必须成对，缺的那端标「未取数」）`)
      } else if (!sidesOk) {
        fails.push(`第 ${r.row} 轮：起止一端格式非法「${ss}」（~ 两端应为时间或「未取数」）`)
      } else if (ss.includes(NOT_TAKEN)) {
        warns.push(`第 ${r.row} 轮：起止一端标「未取数」（另一端起/止已实测；未取数端不应成为常态）`)
      } else if (stripDeco(ss) !== ss) {
        warns.push(`第 ${r.row} 轮：起止端带装饰/注释「${ss}」（时间主体在，仅提示格式）`)
      }
    }
  } else {
    const parts = ss.split('~').map(s => s.trim())
    if (parts.length >= 1 && parts.every(p => p === NOT_TAKEN)) {
      warns.push(`第 ${r.row} 轮：起止两端都标「未取数」（等同整格未取数；规范写法为整格「未取数」）`)
    } else {
      const bothEndsPresent = parts.length >= 2 && parts.every(p => p !== '')
      if (bothEndsPresent) {
        fails.push(`第 ${r.row} 轮：起止格式非法「${ss}」（应为 HH:MM:SS~HH:MM:SS 或显式「未取数」）`)
      } else {
        fails.push(`第 ${r.row} 轮：起止只填了一端「${ss}」（起/止必须成对，缺的那端标「未取数」）`)
      }
    }
  }

  // ── 耗时列 ──
  if (cost === '') fails.push(`第 ${r.row} 轮：耗时列留空（必须填 N m 或显式「未取数」）`)
  else if (cost === NOT_TAKEN) {
    warns.push(`第 ${r.row} 轮：耗时标「未取数」（诚实记录合法，但不该成为常态）`)
  } else if (/\d+m/.test(stripDeco(cost))) {
    if (stripDeco(cost) !== cost) warns.push(`第 ${r.row} 轮：耗时带装饰/注释「${cost}」（数字 m 在，仅提示格式）`)
  } else {
    // 非空、非「未取数」、无 N m——但内容对读者可见（如「跨 session（…）」），不算静默丢失，仅提示
    warns.push(`第 ${r.row} 轮：耗时无 N m 但有说明「${cost}」（按未取数理解；规范写法应为 N m 或显式「未取数」）`)
  }
}

// 软判 ②：轮次账行数 vs 轮次小节数（排除「第 <N> 轮」占位）
const sections = lines.filter(l => /^##\s*第\s*\d+\s*轮\s*$/.test(l)).length
if (sections > 0 && sections !== dataRows.length) {
  warns.push(`轮次账 ${dataRows.length} 行 vs 「## 第 N 轮」小节 ${sections} 个不一致——可能有轮次没写独立小节`)
}

// 输出
for (const w of warns) console.log(`[WARN] ${w}`)
for (const f of fails) console.log(`[FAIL] ${f}`)
if (fails.length === 0) console.log(`轮次账完整性：${dataRows.length} 行全过（${warns.length} 条软提示）`)

process.exitCode = fails.length > 0 ? 1 : 0
