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
//   - 类型名是字符串条目（无 path/ignore 键）→ exit 1 + 报错（提示选对象条目；新建对象类型 = 手动编辑注册表，见 project-type.md）
//   - 未知 flag → exit 1 + 报错（防拼错 flag 静默全量落盘，对齐 check.mjs 既有约定）
//   - rule.json 已存在且是手写（无「派生自…」互指注释）→ exit 2 + 报错，不覆盖；加 --force 才覆盖
//   - rule.json 已存在且是流程生成（含「派生自…」注释）→ 直接覆盖（幂等）
// 顺序保证：所有只读校验（类型匹配 / rule.json 解析与覆盖冲突）先做完再落盘——失败路径不留半成品
//   （先改全局注册表再因手写 rule.json exit 2 = 用户没确认替换也改了全局候选集，2026-10-13 OCR 指出）
// 输出：JSON 摘要（stdout）或错误信息（stderr）
import { readFileSync, existsSync, realpathSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'
import { listInfo, readRegistry, registryPath, atomicWrite, nameKey, nameOf } from './review-init.mjs'

// 与 project-type.md「派生 rule.json 的形态」互指注释一致；isDerivedRule 靠它识别流程生成 vs 手写
export const DERIVED_MARK = '派生自 activeProjectTypes.config.json 的'

// main() 可测性（2026-10-13 OCR 指出命令无测试）：失败用 throw，CLI 入口捕获后转 exit code，
// 测试 import main 传入临时 home/cwd 断言结果，不会被 process.exit 杀掉测试进程
export class CliError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

function isDerivedRule(ruleJson) {
  // 结构非法（rules 非数组 / r 非对象）不抛裸 TypeError，走可读报错（2026-10-13 OCR 指出）
  const rules = Array.isArray(ruleJson?.rules) ? ruleJson.rules : []
  return rules.some((r) => typeof r?.rule === 'string' && r.rule.includes(DERIVED_MARK))
}

export function main({ home = homedir(), cwd = process.cwd(), argv = process.argv.slice(2) } = {}) {
  // 未知 flag 一律报错，不静默忽略——本脚本写全局注册表 + 覆盖 rule.json，拼错 flag 静默照跑代价高
  const KNOWN_FLAGS = new Set(['--force'])
  const unknown = argv.filter((a) => a.startsWith('--') && !KNOWN_FLAGS.has(a))
  if (unknown.length) throw new CliError(1, `未知参数：${unknown.join(' / ')}（支持：--force）`)
  const force = argv.includes('--force')
  const typeName = argv.find((a) => !a.startsWith('--'))
  if (!typeName) {
    throw new CliError(1, '用法：node update-review-project-type.mjs <类型名> [--force]\n类型名必须是对象条目（带 path/ignore）；候选列表见 node review-init.mjs --list')
  }

  // 1. 匹配类型（currentHit 同时给出当前指针是否有效：非 null = 可直接复用，null 且 current 非 null = 指针失效需重新选）
  const { current, currentHit, candidates } = listInfo(home, cwd)
  const hit = candidates.find((c) => nameKey(c.name) === nameKey(typeName))
  if (!hit) {
    const similar = candidates
      .filter((c) => nameKey(c.name).includes(nameKey(typeName)) || nameKey(typeName).includes(nameKey(c.name)))
      .map((c) => c.name)
    const hint = similar.length ? `，近似候选：${similar.join(' / ')}` : ''
    throw new CliError(1, `类型「${typeName}」不在候选集里${hint}。候选列表：node review-init.mjs --list`)
  }
  // 判「字符串条目」看有没有 path/ignore **键**，不是看 ignore 值——对象条目的 ignore 可以是空串（如种子 react）
  if (!hit.path || !('ignore' in hit)) {
    throw new CliError(1, `类型「${typeName}」是生态级粗粒度描述（只有 name/source，无 path/ignore），派生不了 rule.json。\n请选对象条目（语言级 / 个人累积），或手动编辑 ${registryPath(home)} 新建带 path/ignore 的类型（见 skills/review-loop/references/project-type.md）。`)
  }

  // 2. 先校验现有 rule.json（覆盖冲突在这里就拒，别等注册表已改完再 exit 2——失败路径不留半成品）
  const ruleFile = join(cwd, '.opencodereview', 'rule.json')
  if (existsSync(ruleFile)) {
    let existing = {}
    try {
      existing = JSON.parse(readFileSync(ruleFile, 'utf8'))
    } catch (e) {
      throw new CliError(1, `现有 rule.json 解析失败：${ruleFile}\n${e.message}\n不自动覆盖，请人工处理。`)
    }
    if (!force && !isDerivedRule(existing)) {
      throw new CliError(2, `rule.json 已存在且是手写（无「${DERIVED_MARK.replace(' 的', '')}」互指注释），不自动覆盖：${ruleFile}\n确认替换请加 --force 重跑。`)
    }
  }

  // 3. 写注册表（保留注册表其它顶层键，不静默丢用户手写元数据；选中类型不在 activeProjectTypes 则加进去；已有的跳过）
  const registry = readRegistry(home)
  const active = Array.isArray(registry.activeProjectTypes) ? registry.activeProjectTypes : []
  let registryUpdated = false
  if (!active.some((item) => nameKey(nameOf(item)) === nameKey(hit.name))) {
    active.push({ name: hit.name, path: hit.path, ignore: hit.ignore })
    atomicWrite(registryPath(home), JSON.stringify({ ...registry, activeProjectTypes: active }, null, 2) + '\n')
    registryUpdated = true
  }

  // 4. 派生 rule.json（空 ignore 时不以「；」开头）
  const ruleText = JSON.stringify({
    rules: [{
      path: hit.path,
      rule: `${hit.ignore ? hit.ignore + '；' : ''}${DERIVED_MARK} ${hit.name} 条目，不要直接改本文件`,
      merge_system_rule: true,
    }],
  }, null, 2) + '\n'
  atomicWrite(ruleFile, ruleText)

  // 5. 写指针
  const pointerFile = join(cwd, '.reviewconfig', 'project-type')
  atomicWrite(pointerFile, hit.name + '\n')

  console.log(JSON.stringify({
    ok: true,
    type: hit.name,
    registry: registryPath(home),
    registryUpdated,
    rule: ruleFile,
    pointer: pointerFile,
    previous: current,
    // 这是**更新前**的指针命中项，不是落地后的——命名避免 agent 误当「落地后指针有效」用（2026-10-13 OCR 指出）
    previousHit: currentHit ? currentHit.name : null,
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
if (isDirectRun) {
  try {
    main()
  } catch (e) {
    // CliError = 业务错误（exit code 区分）；其余（落盘系统错误等）= 顶层兜底，吐堆栈便于排查
    if (e instanceof CliError) {
      console.error(e.message)
      process.exit(e.code)
    }
    console.error(e.stack || String(e))
    process.exit(1)
  }
}
