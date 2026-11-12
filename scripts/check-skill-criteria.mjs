// skill 判据检查器：复用判据引擎的 schema / judge，不复制判定语义。
// 数据：tools/docgen/models/skills/<skill>.json + <skill>.testcase.json
// 输出：首行 `skill-criteria N 条 / 绿 M / 红 K`；末行 `skill-criteria ok`；红档 exit 1。
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { check, checkTestcase, judge } from '../tools/docgen/builders/rules/schema.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SKILLS_DIR = process.env.SKILL_CRITERIA_DIR
  ? resolve(process.env.SKILL_CRITERIA_DIR)
  : join(ROOT, 'tools', 'docgen', 'models', 'skills')
const strip = (t) => t.replace(/^\uFEFF/, '')
const loadJson = (p) => JSON.parse(strip(readFileSync(p, 'utf8')))

const findings = []
const add = (file, code, message) => findings.push({ file, code, message })
let total = 0
let green = 0
let red = 0

if (!existsSync(SKILLS_DIR)) {
  console.log('skill-criteria 0 条 / 绿 0 / 红 0')
  console.error(`[skill-criteria] tools/docgen/models/skills SkillDirMissing：目录不存在：${SKILLS_DIR}`)
  console.log('skill-criteria fail')
  process.exit(1)
}
const containers = readdirSync(SKILLS_DIR)
  .filter((n) => n.endsWith('.json') && !n.endsWith('.testcase.json'))
  .sort()
const allIds = new Set()

for (const fileName of containers) {
  const skill = fileName.slice(0, -'.json'.length)
  const containerPath = join(SKILLS_DIR, fileName)
  const tcName = `${skill}.testcase.json`
  const tcPath = join(SKILLS_DIR, tcName)
  let doc
  try {
    doc = loadJson(containerPath)
  } catch (err) {
    total += 1
    red += 1
    add(fileName, 'SkillFileShape', `JSON 解析失败：${err.message}`)
    continue
  }

  if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) {
    total += 1
    red += 1
    add(fileName, 'SkillFileShape', '容器必须是对象')
    continue
  }
  if (typeof doc.skill !== 'string' || doc.skill.trim() === '') {
    total += 1
    red += 1
    add(fileName, 'SkillFileShape', '缺 skill')
    continue
  }
  if (doc.skill !== skill) {
    total += 1
    red += 1
    add(fileName, 'SkillNameMismatch', `skill=${doc.skill} 与文件名 ${skill} 不一致`)
    continue
  }
  if (!Array.isArray(doc.criteria) || doc.criteria.length === 0) {
    total += 1
    red += 1
    add(fileName, 'SkillFileShape', 'criteria 必须是非空数组')
    continue
  }

  // testcase 先做容器级检查：缺文件 / 形状坏都让本文件全部判据判红
  let tcDoc = null
  let tcBroken = null
  if (!existsSync(tcPath)) {
    tcBroken = ['SkillTestcaseMissing', `缺 ${tcName}`]
  } else {
    try {
      tcDoc = loadJson(tcPath)
      if (typeof tcDoc !== 'object' || tcDoc === null || Array.isArray(tcDoc)) {
        tcBroken = ['SkillTestcaseShape', 'testcase 容器必须是对象']
      } else if (tcDoc.skill !== skill) {
        tcBroken = ['SkillTestcaseShape', `skill=${tcDoc.skill} 与 ${skill} 不一致`]
      } else if (!Array.isArray(tcDoc.cases) || tcDoc.cases.length === 0) {
        tcBroken = ['SkillTestcaseShape', 'cases 必须是非空数组']
      }
    } catch (err) {
      tcBroken = ['SkillTestcaseShape', `JSON 解析失败：${err.message}`]
    }
  }
  if (tcBroken) add(tcName, tcBroken[0], tcBroken[1])

  const fileIds = new Set()
  for (const [i, criterion] of doc.criteria.entries()) {
    total += 1
    const where = `${fileName}:criteria[${i}]`
    if (typeof criterion?.id === 'string') {
      if (allIds.has(criterion.id)) {
        add(fileName, 'DuplicateId', `判据 id 重复：${criterion.id}`)
        red += 1
        continue
      }
      allIds.add(criterion.id)
      fileIds.add(criterion.id)
    }
    const errs = []
    check(criterion, where, errs)
    if (errs.length > 0) {
      for (const e of errs) add(fileName, e.code, e.message)
      red += 1
      continue
    }
    if (criterion.scope !== `skill:${skill}`) {
      add(fileName, 'CriterionScopeMismatch', `${where} scope=${criterion.scope}，应为 skill:${skill}`)
      red += 1
      continue
    }

    if (tcBroken) {
      red += 1
      continue
    }
    const cases = tcDoc.cases.filter((c) => c && c.criterion === criterion.id)
    if (cases.length === 0) {
      add(tcName, 'TestcaseMissing', `判据 ${criterion.id} 没有 case`)
      red += 1
      continue
    }
    const tcErrs = []
    checkTestcase({ rule: criterion.id, cases }, tcName, new Set([criterion.id]), tcErrs)
    if (tcErrs.length > 0) {
      for (const e of tcErrs) add(tcName, 'TestcaseSchema', e)
      red += 1
      continue
    }
    let failed = false
    for (const c of cases) {
      let got
      try {
        got = judge(criterion, c.input)
      } catch (err) {
        add(tcName, 'CaseInputInvalid', `${criterion.id} input 非法：${err.message}`)
        failed = true
        break
      }
      if (got !== c.expect) {
        add(tcName, 'CaseMismatch', `${criterion.id} 期望 ${c.expect} 实得 ${got}`)
        failed = true
        break
      }
    }
    if (failed) red += 1
    else green += 1
  }

  // 孤立 case（criterion 不在本容器）：只记测试级 finding，不并入 N/M/K（N 恒为 criteria 条数）
  if (tcDoc && Array.isArray(tcDoc.cases)) {
    for (const c of tcDoc.cases) {
      if (c && c.criterion && !fileIds.has(c.criterion)) {
        add(tcName, 'UnknownCriterion', `未登记的 criterion：${c.criterion}`)
      }
    }
  }
}

console.log(`skill-criteria ${total} 条 / 绿 ${green} / 红 ${red}`)
if (findings.length === 0) {
  console.log('skill-criteria ok')
  process.exit(0)
}
for (const f of findings) console.error(`[skill-criteria] ${f.file} ${f.code}：${f.message}`)
console.log('skill-criteria fail')
process.exit(1)
