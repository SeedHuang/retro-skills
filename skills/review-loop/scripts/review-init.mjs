// review-init.mjs —— review-loop 项目类型注册表初始化（实现版 v1，幂等）
// 职责（spec：docs/superpowers/specs/2026-10-10-review-loop-l3-project-type-design.md §七）：
//   1. 确保 ~/.retro-skills/reviewconfig/ 存在
//   2. 确保 activeProjectTypes.config.json 存在（不存在才写种子，不覆盖已有；种子原子写）
//   3. 注册表读失败 / JSON 解析失败 / 结构非法 → 报错停止，不自动覆盖（防丢用户数据）
//   4. 输出候选集 = languagePresets ∪ ecosystemPresets ∪ activeProjectTypes（按规范化名去重：language/active 同名时 active 优先；跨层同名时对象覆盖 ecosystem 字符串）
// 用法：node review-init.mjs            # 初始化 + 输出候选集 JSON
//       node review-init.mjs --list     # 输出 { current, currentHit, candidates }（项目指针 + 指针在候选集的命中项/失效时 null + 扁平候选列表，update-review-project-type 命令用）
//       node review-init.mjs --gitignore # 审查环境初始化：确保目标仓库 .gitignore 含 .session/（幂等，缺则追加）
import { mkdirSync, readFileSync, writeFileSync, renameSync, rmSync, existsSync, realpathSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'

// 语言级预设（技能内置，人人有，不落盘）：按「语言 + 端」粒度，带 path
export const languagePresets = [
  { name: 'python-backend',  path: '**/*.py',      ignore: 'Python 后端，无前端，忽略 React/前端类检查' },
  { name: 'python-data',     path: '**/*.py',      ignore: 'Python 数据处理，无前端，忽略 React/前端类检查' },
  { name: 'go-backend',      path: '**/*.go',      ignore: 'Go 后端，无前端，忽略 React/前端类检查' },
  { name: 'java-backend',    path: '**/*.java',    ignore: 'Java 后端，无前端，忽略 React/前端类检查' },
  { name: 'csharp-backend',  path: '**/*.cs',      ignore: 'C# 后端，无前端，忽略 React/前端类检查' },
  { name: 'rust',            path: '**/*.rs',      ignore: 'Rust，无前端，忽略 React/前端类检查' },
]

// 生态级预设（技能内置，人人有，不落盘）：当前常用生态（JS + H5 家族），首日顺手
export const ecosystemPresets = [
  '纯静态 H5', 'React H5', 'Vue H5', '小程序 H5', 'Angular H5',
  'React', 'Vue', 'node', 'electron', 'CLI', '纯静态页面', 'Agent Skill 项目',
]

// 种子默认类型（用户实际用过的，写进 review-init 的种子表；均带各自语言的 path）
export const seedProjectTypes = [
  { name: 'node-cli',              path: '**/*.{js,mjs,cjs,ts,tsx,jsx}', ignore: '无前端，忽略 React 类检查（Hooks / useState / XSS 等）' },
  { name: 'electron',              path: '**/*.{js,mjs,cjs,ts,tsx,jsx}', ignore: '桌面端（electron），无前端 Web 检查，忽略 React 类检查' },
  { name: 'react',                 path: '**/*.{js,mjs,cjs,ts,tsx,jsx}', ignore: '' },
  { name: 'cli',                   path: '**/*.{js,mjs,cjs,ts,tsx,jsx}', ignore: 'CLI 工具，无前端，忽略 React 类检查' },
  { name: 'electron-monorepo',     path: '**/*.{js,mjs,cjs,ts,tsx,jsx}', ignore: '桌面端 monorepo，忽略 React 类检查' },
  { name: 'react-node-monorepo',   path: '**/*.{js,mjs,cjs,ts,tsx,jsx}', ignore: '前后端同仓，不忽略前端检查；后端代码的 React 噪音走 A2 处置侧过滤' },
]

export function registryPath(home = homedir()) {
  return join(home, '.retro-skills', 'reviewconfig', 'activeProjectTypes.config.json')
}

// 原子写（临时文件 + rename）：中断不留半截文件，否则下次解析失败会被「不自动覆盖」卡死。
// 导出给 update-review-project-type.mjs 复用——两处必须同一份实现，防原子性保证漂移（2026-10-13 OCR 指出）
export function atomicWrite(file, text) {
  mkdirSync(dirname(file), { recursive: true })
  const tmp = `${file}.tmp-${process.pid}-${Date.now()}`
  try {
    writeFileSync(tmp, text, 'utf8')
    renameSync(tmp, file)
  } catch (e) {
    // 失败路径清临时文件（EACCES / ENOSPC / Windows rename EPERM）：否则 config 目录堆 orphan tmp
    try { rmSync(tmp, { force: true }) } catch { /* 清理失败不掩盖原始错误 */ }
    throw e
  }
}

export function ensureRegistry(home = homedir()) {
  const file = registryPath(home)
  mkdirSync(dirname(file), { recursive: true })
  if (!existsSync(file)) {
    atomicWrite(file, JSON.stringify({ activeProjectTypes: seedProjectTypes }, null, 2) + '\n')
    return { created: true, path: file }
  }
  // 读与解析分开 try：读失败（EACCES / EISDIR）是系统错误，别误报成「JSON 解析失败」指错方向
  let raw
  try {
    raw = readFileSync(file, 'utf8')
  } catch (e) {
    throw new Error(`注册表读取失败：${file}\n${e.message}`)
  }
  try {
    JSON.parse(raw)
  } catch (e) {
    throw new Error(`注册表 JSON 解析失败：${file}\n${e.message}\n不自动覆盖（防丢用户数据），请人工处理该文件后重跑。`)
  }
  return { created: false, path: file }
}

export function readRegistry(home = homedir()) {
  const file = registryPath(home)
  if (!existsSync(file)) return { activeProjectTypes: [] }
  // 读与解析分开 try（同 ensureRegistry），并校验形状：合法 JSON 但缺 activeProjectTypes / 非数组
  // 也要报错而不是静默丢 key——与「损坏→报错停止」的既有行为一致（否则候选集少一层且无提示）
  let raw
  try {
    raw = readFileSync(file, 'utf8')
  } catch (e) {
    throw new Error(`注册表读取失败：${file}\n${e.message}`)
  }
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    // 与 ensureRegistry 同一口径：损坏 JSON → 本地化报错 + 不自动覆盖（防丢用户数据）。
    // 带上底层 e.message（含行列/非法 token），提示「人工处理」时能给排查位置
    throw new Error(`注册表 JSON 解析失败：${file}\n${e.message}\n不自动覆盖（防丢用户数据），请人工处理该文件后重跑。`)
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !Array.isArray(parsed.activeProjectTypes)) {
    throw new Error(`注册表结构非法（activeProjectTypes 应为数组）：${file}\n不自动覆盖，请人工处理后重跑。`)
  }
  return parsed
}

// 名称归一化（单一来源，2026-10-13 OCR 指出三处重复）：candidateSet / listInfo / update-review-project-type 共用，
// 一处加 trim/全角归一，别处不会漏——漏了会出现「候选集里有、命令 find 不到」的 exit 1 假报
export function nameOf(item) {
  return typeof item === 'string' ? item : item?.name
}
export function nameKey(item) {
  // NFKC 归一全角 + trim 去首尾空白 + 小写——单一来源保证各处匹配口径一致；
  // 只 lowercase 的话「候选集里有、命令 find 不到」的症状仍会在全角/空格名上复现（2026-10-13 OCR 指出）
  return String(nameOf(item) ?? '').normalize('NFKC').trim().toLowerCase()
}

export function candidateSet(home = homedir()) {
  ensureRegistry(home)
  const { activeProjectTypes } = readRegistry(home)
  // 候选集语义：三层 union 给 agent 匹配用（spec §六），同名不重复出现。
  // 去重规则：
  //   - 每层内部按规范化名（小写）去重——React/react、CLI/cli 视为同一类型（大小写变体是笔误不是两个候选）；
  //   - 跨层同名时「精确类型对象」优先于「生态级粗粒度字符串」：active/language 有 electron 对象，
  //     就把 ecosystem 的裸字符串 electron 让位移除——否则 electron 出现两次，「唯一命中」判不出来。
  const dedupe = (list) => {
    const seen = new Set()
    const out = []
    for (const item of list ?? []) {
      const k = nameKey(item)
      if (!k || seen.has(k)) continue
      seen.add(k)
      out.push(item)
    }
    return out
  }
  const language = dedupe(languagePresets)
  const active = dedupe(activeProjectTypes)
  // language 与 active 之间也做规范化去重（用户注册表可能手写与语言级预设同名的类型，如 rust/go-backend）：
  // 同名时 active 优先——个人注册表条目是用户显式配置过的，比语言级通用预设更精确，应保留它。
  const activeKeys = new Set(active.map((i) => nameKey(i)))
  const languageFinal = language.filter((i) => !activeKeys.has(nameKey(i)))
  // ecosystem 的字符串若与 language / active 的对象同名 → 移除（精确类型覆盖粗粒度描述）
  const covered = new Set([...languageFinal, ...active].map((i) => nameKey(i)))
  const eco = dedupe(ecosystemPresets).filter((e) => !covered.has(nameKey(e)))
  return { languagePresets: languageFinal, ecosystemPresets: eco, activeProjectTypes: active }
}

// --list 模式用：读项目内指针（.reviewconfig/project-type，一行类型名）
// 只在文件不存在（ENOENT）时返回 null；读失败（EACCES/EISDIR）抛错——与 ensureRegistry/readRegistry 口径一致，
// 别把「读不了」和「没选类型」混成一个 null（否则命令会把坏指针当成未设置去重设）
export function readProjectType(cwd = process.cwd()) {
  const p = join(cwd, '.reviewconfig', 'project-type')
  let raw
  try {
    raw = readFileSync(p, 'utf8')
  } catch (e) {
    if (e.code === 'ENOENT') return null
    throw new Error(`项目类型指针读取失败：${p}\n${e.message}`)
  }
  const t = raw.trim()
  return t || null
}

// --list 模式用：把三层候选展平成 [{ name, path, ignore, source }]，供 update-review-project-type 命令一次拿全直接出列表
// path/ignore 只在对象条目（语言级 / 个人累积）上带；字符串条目（生态级粗粒度描述）只有 name/source——没有 path/ignore 可带。
// 命令落地派生 rule.json 需要 path/ignore：遇到字符串条目必须报错（提示选对象条目或新建对象类型），不许猜补字段。
export function flattenCandidates(set) {
  const withSource = (list, source) => (list ?? []).map((item) =>
    typeof item === 'string'
      ? { name: item, source }
      : { name: item?.name, path: item?.path, ignore: item?.ignore, source },
  )
  return [
    ...withSource(set.activeProjectTypes, '个人累积'),
    ...withSource(set.languagePresets, '语言级'),
    ...withSource(set.ecosystemPresets, '生态级'),
  ].filter((x) => x.name)
}

// --list 输出：current + currentHit + candidates。
// currentHit = current 在 candidates 里的命中项（按规范化名匹配）或 null——命令分得清
// 「已选类型可直接复用」（currentHit 非 null）和「指针失效需重新选择」（current 非 null 但 currentHit null：
// 全局注册表误删 → ensureRegistry 只重建种子，自定义类型不在候选里，指针成了悬空引用，见 spec 风险表）。
export function listInfo(home = homedir(), cwd = process.cwd()) {
  const set = candidateSet(home)
  const candidates = flattenCandidates(set)
  const current = readProjectType(cwd)
  const currentHit = current === null ? null : (candidates.find((c) => nameKey(c.name) === nameKey(current)) ?? null)
  return { current, currentHit, candidates }
}

// 审查环境初始化（--gitignore 模式）：确保目标仓库 .gitignore 含 `.session/`
// `.session/` 是审查过程账本（做完即删，docs-convention 语义），必须被忽略——缺则自动追加（幂等，保留已有内容）。
// 做成机制而不是提示：靠 agent「记得检查」会漏（2026-10-13 实测 sound-control-tool 缺这条，历史账本脏进 git）。
// 注意：`.opencodereview/rule.json` 与 `.reviewconfig/project-type` 是**项目配置**（L3 产物），应进 git、不该忽略——与 `.session/` 相反。
// 追加片段（新建/追加两分支共用，防文案分叉——2026-10-14 OCR 指出）
const SESSION_IGNORE_BLOCK = '# ── 审查过程账本：review-loop 生成，做完即删（docs-convention 语义）──────\n.session/\n'

// 与 lessons.test.mjs 的 checkIgnoreAlignment 同口径判定「.session 已被忽略」：
// 只剥尾部空白（git 忽略尾部空白；前导空白有语义，`  .session/` 不匹配顶层目录）+ 兼容锚定斜杠；
// `!` 取反的逐字形式也算命中，取**最后一条**——`!.session` 在末尾 = git 实际不忽略，判未覆盖（2026-10-14 OCR 指出）
const isSessionIgnored = (text) => {
  const rules = text.split(/\r?\n/)
    .map((l) => {
      const neg = l.startsWith('!')
      return (neg ? '!' : '') + (neg ? l.slice(1) : l).replace(/\s+$/, '').replace(/^\/+|\/+$/g, '')
    })
    .filter((l) => l && !l.startsWith('#'))
  const last = [...rules].reverse().find((r) => r === '.session' || r === '!.session')
  return last === '.session'
}

export function ensureGitignore(cwd = process.cwd()) {
  const file = join(cwd, '.gitignore')
  if (!existsSync(file)) {
    atomicWrite(file, SESSION_IGNORE_BLOCK)
    return { created: true, appended: true, path: file }
  }
  const text = readFileSync(file, 'utf8')
  if (isSessionIgnored(text)) return { created: false, appended: false, path: file }
  const sep = text.endsWith('\n') ? '' : '\n'
  atomicWrite(file, text + `${sep}${SESSION_IGNORE_BLOCK}`)
  // .gitignore 只管未跟踪文件：已被 git 跟踪的 .session/** 不会被摘掉——只读检测给出提示，不代劳写 git（2026-10-14 OCR 指出）
  const tracked = existsSync(join(cwd, '.git'))
    ? (spawnSync('git', ['ls-files', '--', '.session'], { cwd, encoding: 'utf8' }).stdout || '').trim().length > 0
    : false
  return { created: false, appended: true, path: file, tracked }
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
  const gitignoreMode = process.argv.includes('--gitignore')
  const listMode = process.argv.includes('--list')
  try {
    if (gitignoreMode) {
      console.log(JSON.stringify(ensureGitignore(), null, 2))
    } else if (listMode) {
      console.log(JSON.stringify(listInfo(), null, 2))
    } else {
      console.log(JSON.stringify(candidateSet(), null, 2))
    }
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  }
}
