#!/usr/bin/env node
// rule-audit-lite.mjs —— 说明层占比（门禁第 ⑨ 段，V-13）
//
// 判据出处：`docs/prd/20261105182104-rule-refactor/prd/stage-2-new-mode-pilot.md` §7 V-13
// 口径（PRD 原文）：说明层 = 不含「义务 / 判定动作 / 边界与例外 / 来源锚」四类句的行；
//   占比 = 说明层字符 / 该文件总字符。本脚本用**非空白字符**做分子分母（空白不进语义体积）。
// 闸值：全仓 ≤ 10%；单条 ≤ 20%。输出一行结论 + 末行 `rule-audit-lite ok`（exit 0 才算过）。
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const RULES = join(ROOT, 'rules')

// 结构行不计说明层：标题行（索引）与 `> 触发` 行（V-4 结构闸的「触发」件）不是「说明」。
const STRUCT = /^(#{1,6}\s|>\s*触发)/
const OBLIGATION = /义务|必须|禁止|不得|不许|缺一|不合格|写「|加载|执行|附|跑/
const ACTION = /path:line|退出码|\bexit\b|命令|计数\s*=|非空|为空|枚举[：:]|diff/
const BOUNDARY = /例外|除非|只许|不再|不适用/
const SOURCE = /^>\s*来源/
const nonWs = (s) => s.replace(/\s/g, '')
const isExplain = (line) => {
  const t = line.trim()
  if (t === '') return false
  if (STRUCT.test(t) || SOURCE.test(t)) return false
  if (OBLIGATION.test(t) || ACTION.test(t) || BOUNDARY.test(t)) return false
  return true
}

if (!existsSync(RULES)) {
  console.error('rule-audit-lite error：rules/ 不存在')
  process.exitCode = 2
} else {
  const files = readdirSync(RULES).filter((n) => n.endsWith('.md'))
  let sumExplain = 0
  let sumTotal = 0
  const rows = []
  let failed = false
  for (const f of files) {
    const text = readFileSync(join(RULES, f), 'utf8').replace(/^\uFEFF/, '')
    const lines = text.split(/\r?\n/)
    const total = nonWs(text).length
    const explain = nonWs(lines.filter(isExplain).join('')).length
    const pct = total === 0 ? 0 : explain / total
    sumExplain += explain
    sumTotal += total
    rows.push({ file: `rules/${f}`, pct, chars: total })
    if (pct > 0.2) { failed = true; console.error(`[rule-audit] ${relative(ROOT, join(RULES, f)).split('\\').join('/')} 说明层 ${(pct * 100).toFixed(1)}% > 20%`) }
  }
  const repoPct = sumTotal === 0 ? 0 : sumExplain / sumTotal
  const maxRow = rows.reduce((m, r) => (r.pct > m.pct ? r : m), { pct: 0, file: '—' })
  console.log(`说明层 全仓 ${(repoPct * 100).toFixed(1)}%（≤10%）/ 单条 max ${(maxRow.pct * 100).toFixed(1)}%（≤20%，${maxRow.file}）`)
  if (repoPct > 0.1) { failed = true; console.error(`[rule-audit] 全仓说明层 ${(repoPct * 100).toFixed(1)}% > 10%`) }
  console.log(failed ? 'rule-audit-lite fail' : 'rule-audit-lite ok')
  process.exitCode = failed ? 1 : 0
}
