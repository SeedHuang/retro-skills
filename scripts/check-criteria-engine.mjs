#!/usr/bin/env node
// check-criteria-engine.mjs —— 判据引擎校验器 + 分层预算闸（门禁第 ⑨ 段）
//
// 判据出处：`docs/prd/20261105182104-rule-refactor/prd/stage-2-new-mode-pilot.md` §1.6 / §5 / §7（V-2/V-3/V-5/V-6/V-11/V-13/V-16/V-17）
// 口径：本脚本只做「读数据 → 判」，判定语义仍唯一在 `tools/quality/criteria-engine/schema.mjs` 的 judge/check；
//       本脚本不复制任何判据语义，也不复写 observable 词表。
// 输出契约：首行固定 `判据 N 条 / 绿 M / 红 K`；末行 `criteria-engine ok` 且 exit 0 才算过。
// 本段**不走 CHECK_BYPASS**（旁路只跳 ⑥）。
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join, resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { check, checkTestcase, judge } from '../tools/quality/criteria-engine/schema.mjs'
import { interpreters } from '../tools/quality/criteria-engine/interpreters.mjs'
import { renderRuleData } from '../tools/quality/criteria-engine/rules.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TERMS_FILE = 'tools/quality/observable-terms.json'
const RULES_DIR = 'rules'
const ENGINE_DIR = 'tools/quality/criteria-engine'
const BUDGET = { minChars: 100, maxChars: 500, maxCount: 9, maxTotal: 26513 }
const SHARED_SURFACES = ['skills', 'tools/quality']

class Fail extends Error {}

const strip = (t) => t.replace(/^\uFEFF/, '')
const nonWs = (t) => t.replace(/\s/g, '')
const loadJson = (p) => JSON.parse(strip(readFileSync(p, 'utf8')))

function walkMd(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isSymbolicLink()) continue
    const p = join(dir, e.name)
    if (e.isDirectory()) walkMd(p, out)
    else if (e.name.endsWith('.md')) out.push(p)
  }
  return out
}

// 结构闸（V-4）：保留 rule 的「触发 / 义务 / 例外 / 判定动作」四件；不再要求「来源锚」
const ACTION_GATE = /(path:line|退出码|\bexit\b|命令|计数\s*=|非空|为空|枚举[：:]|diff|运行 `|检查 `|读取 `|统计 `|列出文件名)/
function structureGate(text, file) {
  const missing = []
  if (!/触发/.test(text)) missing.push('触发')
  if (!/(义务|必须|禁止|不得)/.test(text)) missing.push('义务')
  if (!/(例外|除非|只许|不再|不得)/.test(text)) missing.push('例外')
  if (!ACTION_GATE.test(text)) missing.push('判定动作')
  return missing.length ? [{ file, code: 'RuleStructureIncomplete', missing }] : []
}

function run(root) {
  const findings = []
  const engineAbs = resolve(root, ENGINE_DIR)
  const rulesAbs = resolve(root, RULES_DIR)
  if (!existsSync(engineAbs)) throw new Fail(`判据引擎目录不存在：${ENGINE_DIR}`)

  const ruleFiles = readdirSync(engineAbs).filter((n) => n.endsWith('.json') && !n.endsWith('.testcase.json') && n !== 'rules.json')
  const tcFiles = readdirSync(engineAbs).filter((n) => n.endsWith('.testcase.json'))
  const rules = ruleFiles.map((name) => ({ name, rule: loadJson(join(engineAbs, name)) }))
  const tcs = tcFiles.map((name) => ({ name, tc: loadJson(join(engineAbs, name)) }))
  const ids = new Set(rules.map((r) => r.rule.id))

  let green = 0
  let red = 0
  for (const { name, tc } of tcs) {
    if (!ids.has(tc.rule)) { findings.push({ file: name, code: 'UnknownRuleRef', rule: tc.rule }); continue }
  }
  for (const { name, rule } of rules) {
    const errs = []
    check(rule, name, errs)
    // check() 直接产出 {code,message}，不再统一包成 Schema
    for (const e of errs) findings.push({ file: name, code: e.code, message: e.message })

    const entry = tcs.find((t) => t.tc.rule === rule.id)
    if (!entry) { findings.push({ file: name, code: 'TestcaseMissing', message: rule.id }); red += 1; continue }
    const tcErrs = []
    checkTestcase(entry.tc, entry.name, ids, tcErrs)
    for (const e of tcErrs) findings.push({ file: entry.name, code: 'TestcaseSchema', message: e })
    for (const [i, c] of entry.tc.cases.entries()) {
      const got = judge(rule, c.input)
      if (got === c.expect) green += 1
      else { red += 1; findings.push({ file: entry.name, code: 'CaseMismatch', message: `case ${i} expect: ${c.expect} got: ${got}` }) }
    }

    // 逐字节比对（stage-2 §1.6 / §5）：渲染物手改即红。重渲染 vs 磁盘逐字节；缺文件也红。
    // 「不新立第二套」= 复用同一份 interpreters（唯一投影实现），不在校验器里再写一份渲染逻辑。
    for (const it of interpreters) {
      if (!it.ext) continue // rule 投影单独核（models / rules.md）
      const projRel = `${ENGINE_DIR}/${rule.id}.${it.ext}`
      const projAbs = resolve(root, projRel)
      const expected = it.render(rule)
      if (!existsSync(projAbs)) { findings.push({ file: projRel, code: 'ProjectionMissing' }); continue }
      if (strip(readFileSync(projAbs, 'utf8')) !== expected) {
        findings.push({ file: projRel, code: 'ProjectionDrift', message: '手改渲染物（重渲染结果与磁盘不一致）' })
      }
    }
  }

  // 分层预算闸（V-11 / V-17）：保留 rule 逐条非空白字符 + 条数 + 总量
  const ruleMd = existsSync(rulesAbs) ? readdirSync(rulesAbs).filter((n) => n.endsWith('.md')) : []
  let total = 0
  for (const f of ruleMd) {
    const text = readFileSync(join(rulesAbs, f), 'utf8')
    const n = nonWs(text).length
    total += n
    if (n > BUDGET.maxChars) findings.push({ file: `rules/${f}`, code: 'RuleOverBudget', message: `chars=${n} max: ${BUDGET.maxChars}` })
    if (n < BUDGET.minChars) findings.push({ file: `rules/${f}`, code: 'RuleUnderBudget', message: `chars=${n} min: ${BUDGET.minChars}` })
    for (const g of structureGate(text, `rules/${f}`)) findings.push(g)
  }
  if (ruleMd.length > BUDGET.maxCount) findings.push({ code: 'RuleCountOverBudget', message: `count=${ruleMd.length} max: ${BUDGET.maxCount}` })
  if (total > BUDGET.maxTotal) findings.push({ code: 'RuleTotalOverBudget', message: `chars=${total} max: ${BUDGET.maxTotal}` })

  // rule 正文投影（data + script）：正文必须由判据 json 渲染得出（手改即红、缺件即红）
  // 登记表从 `--root` 指向的引擎目录读，保证临时根与现仓同一套口径
  const rulesJsonAbs = resolve(root, ENGINE_DIR, 'rules.json')
  const registeredRules = existsSync(rulesJsonAbs) ? (loadJson(rulesJsonAbs).rules ?? []) : []
  for (const id of registeredRules) {
    const ruleAbs = resolve(root, ENGINE_DIR, `${id}.json`)
    if (!existsSync(ruleAbs)) { findings.push({ file: `${ENGINE_DIR}/${id}.json`, code: 'RuleDataMissing' }); continue }
    let rule
    try { rule = loadJson(ruleAbs) } catch (e) { findings.push({ file: `${ENGINE_DIR}/${id}.json`, code: 'RuleDataUnreadable', message: e.message }); continue }
    const projRel = `${RULES_DIR}/${id}.md`
    const projAbs = resolve(root, projRel)
    if (!existsSync(projAbs)) { findings.push({ file: projRel, code: 'RuleProjectionMissing' }); continue }
    if (strip(readFileSync(projAbs, 'utf8')) !== renderRuleData(rule)) {
      findings.push({ file: projRel, code: 'RuleProjectionDrift', message: '手改 rule 正文（与判据 json 渲染结果不一致）' })
    }
  }

  // V-2：承接面（skills/** + tools/quality/**）不得出现共享片段（唯一源在 docs/bak 归档与权威判据）
  const phrases = loadJson(resolve(root, TERMS_FILE)).sharedPhrases ?? []
  for (const surface of SHARED_SURFACES) {
    for (const abs of walkMd(resolve(root, surface))) {
      const text = strip(readFileSync(abs, 'utf8'))
      for (const phrase of phrases) {
        if (text.includes(phrase)) findings.push({ file: relative(root, abs).split('\\').join('/'), code: 'SharedPhraseCopy', phrase })
      }
    }
  }

  console.log(`判据 ${rules.length} 条 / 绿 ${green} / 红 ${red}`)
  for (const f of findings) {
    let detail = f.message
    if (!detail && Array.isArray(f.missing)) detail = `missing: ${f.missing.join(' / ')}`
    if (!detail) detail = f.rule ?? f.phrase ?? f.type ?? ''
    console.error(`[criteria-engine] ${f.file ?? ''} ${f.code}${detail ? `：${detail}` : ''}`)
  }
  if (findings.length === 0) {
    console.log('criteria-engine ok')
    return 0
  }
  console.log('criteria-engine fail')
  return 1
}

function main(argv) {
  let root = ROOT
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--root') {
      if (!argv[i + 1]) { console.error('--root 后面要跟一个目录'); return 2 }
      root = resolve(argv[i + 1]); i++
    }
  }
  try { return run(root) } catch (e) {
    console.error(`check-criteria-engine error：${e.message}`)
    return 2
  }
}

process.exitCode = main(process.argv.slice(2))
