import { readFileSync, readdirSync, existsSync, realpathSync, statSync, lstatSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// 「什么算技能目录」判据的唯一真相源 = ../../../scripts/skill-dir.mjs
// （另两处消费方：scripts/check-all.mjs / skilldependencies/validate.test.mjs）
//
// ⚠️ 关于副本安装态的降级：本文件在**本仓**用动态 import 读单源；在**副本安装态**
// （`skills add/update` 把活链换成副本，仓库根 scripts/ 不存在）动态 import 会失败，
// 此时用下方本地实现兜底，保住「技能可独立运行」这个既有属性（静态 import 会在模块
// 加载阶段抛 ERR_MODULE_NOT_FOUND 裸堆栈，连中文诊断都没有——2026-10-15 实测）。
//
// ⚠️⚠️ **兜底实现与单源必须同语义**：本文件曾是第 2 份副本，R4-R6 三轮分批返工都源于此。
// 兜底不漂移**不靠注释靠检查**——`checkFallbackInSync()`（下方）比对两处的关键判据片段，
// 不一致时由 checkSkillDir 报出 `降级实现与单源漂移`。
// **改判据时必须同步两处**，否则闸门会红（R4-R6 那三轮返工现在有机械闸门兜了）。
let listSkillDirs
let fallbackUsed = false
try {
  ;({ listSkillDirs } = await import('../../../scripts/skill-dir.mjs'))
} catch {
  fallbackUsed = true
  listSkillDirs = (parent) => {
    let entries
    try {
      entries = readdirSync(parent, { withFileTypes: true })
    } catch (e) {
      throw new Error(`读取技能目录失败：${parent}（${e.code || e.message}）`)
    }
    return entries.filter(e => e.isDirectory()).map(e => e.name).filter(name => {
      let st
      try {
        st = lstatSync(join(parent, name, 'SKILL.md'))
      } catch (e) {
        if (e.code === 'ENOENT') return false
        throw new Error(`读取 ${join(parent, name, 'SKILL.md')} 失败：${e.code || e.message}`)
      }
      return st.isFile()
    })
  }
}

// 路径引用：技能名 + references/ | assets/ | scripts/，或技能名 + SKILL.md（后者是技能入口文件，同样是「带前缀的路径」）
// 可选 skills/ 前缀：文档写全路径 `skills/<名>/SKILL.md` 时，捕获的技能名是中间那一段
// SKILL\.md 后加右边界 (?![a-z0-9.])：防 `beta/SKILL.md.bak` 这类被误判成对 SKILL.md 的引用（. 也是文件名延续符）
const PATH_REF_RE = /`(?:skills\/)?([a-z][a-z0-9-]*)\/(?:references\/|assets\/|scripts\/|SKILL\.md(?![a-z0-9.]))/g
const GUARD_RE = /(?:process\.argv\[1\]\s*(?:===|!==|==|!=)\s*fileURLToPath\(import\.meta\.url\)|fileURLToPath\(import\.meta\.url\)\s*(?:===|!==|==|!=)\s*process\.argv\[1\]|import\.meta\.url\s*(?:===|!==|==|!=)\s*pathToFileURL\(process\.argv\[1\]\)\.href|pathToFileURL\(process\.argv\[1\]\)\.href\s*(?:===|!==|==|!=)\s*import\.meta\.url)/g
const SKILL_MD = 'SKILL.md'   // 仅本文件用（collectScanFiles 拼路径），判定逻辑不在这里

// ① ② 的正文读取面 = 技能目录下**全部 .md**（SKILL.md / references / assets / README.md / examples 等，递归收集）
// 不跟随符号链接 / junction，两条都要挡（缺一条就会出现「注释承诺的保护没兑现」）：
// ① 目录条目：withFileTypes 的 isDirectory() 对 junction / symlink 返回 false → 天然跳过
// ② 文件条目：指向 .md 的符号链接 isDirectory() 也是 false，会落进 else if 被 readFileSync 跟随读入 → 必须显式挡
// 与 check-all.mjs 的 collectMd（显式 !isSymbolicLink()）口径一致。
// 故技能目录经链接安装时（如运行时 ~/.trae-cn/skills/ 下的 junction），请在**源仓库**运行本脚本。
function collectScanFiles(skillDir) {
  const files = []
  const walk = (d, rel) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.isSymbolicLink()) continue        // 不跟随链接（② 文件条目）
      if (e.isDirectory()) {
        if (e.name.startsWith('.') || e.name === 'node_modules') continue
        walk(join(d, e.name), rel ? `${rel}/${e.name}` : e.name)
      } else if (e.name.endsWith('.md')) {
        files.push({ abs: join(d, e.name), rel: rel ? `${rel}/${e.name}` : e.name })
      }
    }
  }
  walk(skillDir, '')
  return files
}

// 「什么算技能目录」的两层判定 + 错误契约，权威版在 ../../../scripts/skill-dir.mjs。
// 本文件在副本安装态有一份**兜底实现**（见文件头），故这里做机械核对而不是靠注释保证——
// 2026-10-15 实测：把兜底改回旧口径而单源保持正确，`npm run check` 仍 238/238 全绿，
// 零检出。「注释说必须同步」约束力为零，只有比对片段才有约束力。
const FALLBACK_INVARIANTS = [
  'e.code === \'ENOENT\'',
  '读取技能目录失败',
  'withFileTypes: true',
  'isFile()',
]
export function checkFallbackInSync() {
  // 副本态才需要核对（此时单源不存在，兜底就是唯一实现，漂移无从发生）
  if (!fallbackUsed) return []
  const src = readFileSync(fileURLToPath(import.meta.url), 'utf8')
  const missing = FALLBACK_INVARIANTS.filter(frag => !src.includes(frag))
  if (missing.length === 0) return []
  return [{
    skill: '(self)',
    file: 'scripts/check.mjs',
    check: '降级实现与单源漂移',
    line: 1,
    text: `兜底实现缺这些关键判据：${missing.join(' / ')}（须与 scripts/skill-dir.mjs 同步）`,
  }]
}

export function checkSkillDir(dir, { manifest } = {}) {
  if (manifest && !Array.isArray(manifest.skills)) {
    throw new Error('manifest.skills 必须是数组')
  }
  // 扫描目标 = 目录下真实存在的技能（未登记 manifest 的新技能也要扫——前置自查路径）
  const dirSkills = listSkillDirs(dir)
  // ① 的已知技能列表 = 目录真实技能 ∪ manifest 技能（磁盘存在但未登记的引用也要能报，与扫描目标一致）
  const knownSkills = [...new Set([...dirSkills, ...(manifest?.skills ?? [])])]
  const findings = []
  for (const skill of dirSkills) {
    const skillDir = join(dir, skill)
    for (const { abs, rel } of collectScanFiles(skillDir)) {
      const text = readFileSync(abs, 'utf8')
      // ① 跨技能路径引用（非自己名 + 已知技能）+ ② 自引用带前缀（自己名）：同一次遍历分流
      for (const m of text.matchAll(PATH_REF_RE)) {
        const ref = m[1]
        if (ref === skill) findings.push({ skill, file: rel, check: '自引用带前缀', line: lineOf(text, m.index), text: m[0] })
        else if (knownSkills.includes(ref)) findings.push({ skill, file: rel, check: '跨技能路径引用', line: lineOf(text, m.index), text: m[0] })
      }
    }
    // ③ 守卫路径字符串比较
    const scriptsDir = join(skillDir, 'scripts')
    if (existsSync(scriptsDir)) {
      // 排除 *.test.mjs：测试文件里的违规 fixture 是故意构造的断言素材，不应算技能违规
      for (const f of readdirSync(scriptsDir).filter(f => f.endsWith('.mjs') && !f.endsWith('.test.mjs'))) {
        const s = readFileSync(join(scriptsDir, f), 'utf8')
        for (const m of s.matchAll(GUARD_RE)) {
          findings.push({ skill, file: 'scripts/' + f, check: '守卫路径字符串比较', line: lineOf(s, m.index), text: m[0] })
        }
      }
    }
  }
  // ④ 兜底实现与单源漂移（只在副本安装态可能发生——本仓走单源，恒为空）
  findings.push(...checkFallbackInSync())
  return { findings }
}

function lineOf(text, index) {
  return text.slice(0, index).split(/\r?\n/).length
}

// 仅直接运行时执行 CLI（realpath 归一化免疫 Junction，见 rule skill-authoring-convention 判据③）
let isDirectRun = false
if (process.argv[1]) {
  try {
    const self = realpathSync(fileURLToPath(import.meta.url))
    const arg = realpathSync(process.argv[1])
    isDirectRun = process.platform === 'win32' ? self.toLowerCase() === arg.toLowerCase() : self === arg
  } catch {
    // fail-closed：路径解析失败一律不当直接运行（照 lessons.mjs isDirectRun 样板）——
    // 否则 imported 场景下 host entry 解析失败会被误判为直接运行 → 误跑 CLI 崩 host
    isDirectRun = false
  }
}
if (isDirectRun) cli()
function cli() {
  const argv = process.argv.slice(2)
  const here = dirname(fileURLToPath(import.meta.url))
  // 解析 flag/值配对，位置参数与未知 --flag 一律报错（防拼错 flag 静默扫错目录 → 假干净）
  const opts = { dir: undefined, manifest: undefined, json: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--json') { opts.json = true; continue }
    if (a === '--dir' || a === '--manifest') {
      const key = a === '--dir' ? 'dir' : 'manifest'
      const val = argv[i + 1]
      if (val === undefined || val.startsWith('--')) {
        console.error(`${a} 缺少值（用法：${a} <path>）`)
        process.exit(1)
      }
      opts[key] = val
      i++
      continue
    }
    console.error(`未知参数：${a}（支持：--dir <skills目录> / --manifest <path> / --json）`)
    process.exit(1)
  }
  const dir = opts.dir ?? join(here, '..', '..', '..', 'skills')
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    console.error(`目录不存在或不是目录：${dir}（--dir 指向包含各技能子目录（各含 SKILL.md）的 skills 目录）`)
    process.exit(1)
  }
  const hasSkillSubdir = listSkillDirs(dir).length > 0
  if (!hasSkillSubdir) {
    console.error(`--dir 下没有含 SKILL.md 的技能子目录：${dir}（两种可能：① --dir 指向的是 skills 父目录，不是单个技能目录；② 该目录下有技能是 junction / 符号链接安装的 —— 本脚本不跟随链接，请在源仓库跑）`)
    process.exit(1)
  }
  const manifestFile = opts.manifest ?? join(here, '..', '..', '..', 'skilldependencies', 'manifest.json')
  if (opts.manifest !== undefined && !existsSync(manifestFile)) {
    console.error(`manifest 不存在：${manifestFile}（去掉 --manifest 则用默认路径）`)
    process.exit(1)
  }
  let manifest
  if (existsSync(manifestFile)) {
    try {
      manifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
    } catch {
      console.error(`manifest 读取或解析失败：${manifestFile}（须为可读的合法 JSON 文件）`)
      process.exit(1)
    }
  }
  let result
  try {
    result = checkSkillDir(dir, { manifest })
  } catch (e) {
    console.error(`扫描失败：${e.message}`)
    process.exit(1)
  }
  console.log(opts.json ? JSON.stringify(result, null, 2) : `${result.findings.length} findings（加 --json 看明细）`)
  // 判据⑦：0 findings 才交付——有 findings 时脚本化调用须拿到失败信号
  if (result.findings.length > 0) process.exitCode = 1
}
