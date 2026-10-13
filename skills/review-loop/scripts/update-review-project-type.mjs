// update-review-project-type.mjs —— 落地项目类型（L3 自动化闭环，三步一起）
// 职责（spec：docs/superpowers/specs/2026-10-10-review-loop-l3-project-type-design.md 选择流程；project-type.md 落地三步）：
//   ① 写 ~/.retro-skills/reviewconfig/activeProjectTypes.config.json（选中类型不在注册表则加进去；已有的跳过）
//   ② 派生项目 .opencodereview/rule.json（按该类型 path/ignore，merge_system_rule: true）
//   ③ 写项目类型指针 .reviewconfig/project-type（一行类型名，下次 review 读它复用，不用重新问）
// 用法：
//   node update-review-project-type.mjs <类型名>             # 落地（类型名必须是对象条目，带 path/ignore）
//   node update-review-project-type.mjs <类型名> --force      # 覆盖手写 rule.json（对齐「覆盖手写必须先问」，确认后由 agent 加 --force 重跑）
// 行为（确定性动作，交互由 agent 层做）：
//   - 类型名不在候选集 → exit 1 + 报错（列出近似候选）
//   - 类型名是字符串条目（无 path/ignore）→ exit 1 + 报错（提示选对象条目；新建对象类型 = 手动编辑注册表，见 project-type.md）
//   - rule.json 已存在且是手写（无「派生自…」互指注释）→ exit 2 + 报错，不覆盖；加 --force 才覆盖
//   - rule.json 已存在且是流程生成（含「派生自…」注释）→ 直接覆盖（幂等）
// 输出：JSON 摘要（stdout）或错误信息（stderr）
import { readFileSync, writeFileSync, mkdirSync, renameSync, rmSync, existsSync, realpathSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { listInfo, readRegistry, registryPath } from './review-init.mjs'

// 与 project-type.md「派生 rule.json 的形态」互指注释一致；isDerivedRule 靠它识别流程生成 vs 手写
export const DERIVED_MARK = '派生自 activeProjectTypes.config.json 的'

function nameOf(item) {
  return typeof item === 'string' ? item : item?.name
}

function fail(code, msg) {
  console.error(msg)
  process.exit(code)
}

function atomicWrite(file, text) {
  mkdirSync(dirname(file), { recursive: true })
  const tmp = `${file}.tmp-${process.pid}-${Date.now()}`
  try {
    writeFileSync(tmp, text, 'utf8')
    renameSync(tmp, file)
  } catch (e) {
    try { rmSync(tmp, { force: true }) } catch { /* 清理失败不掩盖原始错误 */ }
    throw e
  }
}

function isDerivedRule(ruleJson) {
  const rules = ruleJson?.rules ?? []
  return rules.some((r) => typeof r.rule === 'string' && r.rule.includes(DERIVED_MARK))
}

function main() {
  const argv = process.argv.slice(2)
  const force = argv.includes('--force')
  const typeName = argv.find((a) => !a.startsWith('--'))
  if (!typeName) {
    fail(1, '用法：node update-review-project-type.mjs <类型名> [--force]\n类型名必须是对象条目（带 path/ignore）；候选列表见 node review-init.mjs --list')
  }

  // 1. 匹配类型（currentHit 同时给出当前指针是否有效：非 null = 可直接复用，null 且 current 非 null = 指针失效需重新选）
  const { current, currentHit, candidates } = listInfo()
  const key = (x) => String(x ?? '').toLowerCase()
  const hit = candidates.find((c) => key(c.name) === key(typeName))
  if (!hit) {
    const similar = candidates
      .filter((c) => key(c.name).includes(key(typeName)) || key(typeName).includes(key(c.name)))
      .map((c) => c.name)
    const hint = similar.length ? `，近似候选：${similar.join(' / ')}` : ''
    fail(1, `类型「${typeName}」不在候选集里${hint}。候选列表：node review-init.mjs --list`)
  }
  if (!hit.path || !hit.ignore) {
    fail(1, `类型「${typeName}」是生态级粗粒度描述（只有 name/source，无 path/ignore），派生不了 rule.json。\n请选对象条目（语言级 / 个人累积），或手动编辑 ${registryPath()} 新建带 path/ignore 的类型（见 skills/review-loop/references/project-type.md）。`)
  }

  // 2. 写注册表（选中类型不在 activeProjectTypes 则加进去；已有的跳过）
  const registry = readRegistry()
  const active = Array.isArray(registry.activeProjectTypes) ? registry.activeProjectTypes : []
  let registryUpdated = false
  if (!active.some((item) => key(nameOf(item)) === key(hit.name))) {
    active.push({ name: hit.name, path: hit.path, ignore: hit.ignore })
    atomicWrite(registryPath(), JSON.stringify({ activeProjectTypes: active }, null, 2) + '\n')
    registryUpdated = true
  }

  // 3. 派生 rule.json
  const ruleFile = join(process.cwd(), '.opencodereview', 'rule.json')
  if (existsSync(ruleFile)) {
    let existing = {}
    try {
      existing = JSON.parse(readFileSync(ruleFile, 'utf8'))
    } catch (e) {
      fail(1, `现有 rule.json 解析失败：${ruleFile}\n${e.message}\n不自动覆盖，请人工处理。`)
    }
    if (!force && !isDerivedRule(existing)) {
      fail(2, `rule.json 已存在且是手写（无「${DERIVED_MARK.replace(' 的', '')}」互指注释），不自动覆盖：${ruleFile}\n确认替换请加 --force 重跑。`)
    }
  }
  const ruleText = JSON.stringify({
    rules: [{
      path: hit.path,
      rule: `${hit.ignore}；${DERIVED_MARK} ${hit.name} 条目，不要直接改本文件`,
      merge_system_rule: true,
    }],
  }, null, 2) + '\n'
  atomicWrite(ruleFile, ruleText)

  // 4. 写指针
  const pointerFile = join(process.cwd(), '.reviewconfig', 'project-type')
  atomicWrite(pointerFile, hit.name + '\n')

  console.log(JSON.stringify({
    ok: true,
    type: hit.name,
    registry: registryPath(),
    registryUpdated,
    rule: ruleFile,
    pointer: pointerFile,
    previous: current,
    currentHit: currentHit ? currentHit.name : null,
  }, null, 2))
}

// 仅直接运行时执行 CLI（realpath 归一化免疫 Junction，见规则 skill-authoring-convention 判据③）
let isDirectRun = false
if (process.argv[1]) {
  try {
    const self = realpathSync(fileURLToPath(import.meta.url))
    const arg = realpathSync(process.argv[1])
    isDirectRun = process.platform === 'win32' ? self.toLowerCase() === arg.toLowerCase() : self === arg
  } catch {
    isDirectRun = false
  }
}
if (isDirectRun) main()
