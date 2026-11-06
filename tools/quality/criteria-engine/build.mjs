// 编排层：加载 rule + testcase → schema 校验 → 判定跑测试 → 逐解释器渲染
// 三层分工：schema.mjs（数据唯一语义）→ interpreters.mjs（可插拔文案投影）→ build.mjs（本文件，编排）
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { judge, check, checkTestcase } from './schema.mjs'
import { interpreters } from './interpreters.mjs'
import { listRuleIds, writeRule } from './rules.mjs'

const DIR = path.dirname(fileURLToPath(import.meta.url))
const errors = []
// PowerShell 5.1 的 UTF8 写文件带 BOM，JSON.parse 会挂——读时剥掉
const loadJson = (file) => JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''))

let total = 0
const ruleFiles = readdirSync(DIR).filter((n) => n.endsWith('.json') && !n.endsWith('.testcase.json') && n !== 'rules.json')
const tcFiles = readdirSync(DIR).filter((n) => n.endsWith('.testcase.json'))
const rules = ruleFiles.map((name) => ({ name, rule: loadJson(path.join(DIR, name)) }))
const tcs = tcFiles.map((name) => ({ name, tc: loadJson(path.join(DIR, name)) }))
const ruleIds = new Set(rules.map(({ rule }) => rule.id))
const tcByRule = new Map(tcs.map(({ name, tc }) => [tc.rule, { name, tc }]))

for (const { name, tc } of tcs) checkTestcase(tc, name, ruleIds, errors)
for (const { name, rule } of rules) {
  const found = []
  check(rule, name, found)
  for (const f of found) errors.push(`${name}: ${f.code}：${f.message}`)
  const entry = tcByRule.get(rule.id)
  if (!entry) errors.push(`${name}: 判据无 testcase（${rule.id}.testcase.json）→ 未验证，不得渲染`)
  if (found.length) { console.log(`${name}: 结构错误，跳过判定与渲染`); continue }
  for (const [i, c] of entry.tc.cases.entries()) {
    total++
    const got = judge(rule, c.input)
    if (got !== c.expect) errors.push(`${entry.name}: cases[${i}] 期望 ${c.expect} 实得 ${got} ← ${JSON.stringify(c.input)}`)
  }
  if (!errors.length) {
    for (const it of interpreters) if (it.ext) writeFileSync(path.join(DIR, `${rule.id}.${it.ext}`), it.render(rule), 'utf8')
  }
  console.log(`${name}: ${entry.tc.cases.length} 条样例已判（测试在 ${entry.name}）`)
}
for (const e of errors) console.log('RED ' + e)
// rule 正文投影（唯一入口）：登记在 rules.json 的判据 id → rules/<id>.md（散文本体由 md 解释器渲染）
if (errors.length === 0) {
  for (const id of listRuleIds()) {
    try { writeRule(id) } catch (err) { errors.push(`rule 正文渲染失败 ${id}: ${err.message}`) }
  }
}
console.log(`\n解释器 ${interpreters.length} 个（${interpreters.map((i) => i.id).join(' / ')}），样例 ${total} 条，错误 ${errors.length} 条`)
console.log(`rule 正文投影 ${listRuleIds().length} 份（rules/<id>.md）`)
console.log(errors.length === 0 ? 'rule-dsl ok' : 'rule-dsl FAIL')
process.exit(errors.length === 0 ? 0 : 1)
