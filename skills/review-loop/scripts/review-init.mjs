// review-init.mjs —— review-loop 项目类型注册表初始化（实现版 v1，幂等）
// 职责（spec：docs/superpowers/specs/2026-10-10-review-loop-l3-project-type-design.md §七）：
//   1. 确保 ~/.retro-skills/reviewconfig/ 存在
//   2. 确保 activeProjectTypes.config.json 存在（不存在才写种子，不覆盖已有）
//   3. 注册表 JSON 解析失败 → 报错停止，不自动覆盖（防丢用户数据）
//   4. 输出候选集 = languagePresets ∪ ecosystemPresets ∪ activeProjectTypes
// 用法：node review-init.mjs            # 初始化 + 输出候选集 JSON
import { mkdirSync, readFileSync, writeFileSync, existsSync, realpathSync } from 'node:fs'
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

export function ensureRegistry(home = homedir()) {
  const file = registryPath(home)
  mkdirSync(dirname(file), { recursive: true })
  if (!existsSync(file)) {
    writeFileSync(file, JSON.stringify({ activeProjectTypes: seedProjectTypes }, null, 2) + '\n', 'utf8')
    return { created: true, path: file }
  }
  try {
    JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    throw new Error(`注册表 JSON 解析失败：${file}\n不自动覆盖（防丢用户数据），请人工处理该文件后重跑。`)
  }
  return { created: false, path: file }
}

export function readRegistry(home = homedir()) {
  const file = registryPath(home)
  if (!existsSync(file)) return { activeProjectTypes: [] }
  return JSON.parse(readFileSync(file, 'utf8'))
}

export function candidateSet(home = homedir()) {
  ensureRegistry(home)
  const { activeProjectTypes } = readRegistry(home)
  return { languagePresets, ecosystemPresets, activeProjectTypes }
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
    const set = candidateSet()
    console.log(JSON.stringify(set, null, 2))
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  }
}
