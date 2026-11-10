// check-skill-dir-single-source.mjs —— 新门禁（spec R13 / §3.7）：`skill-dir.mjs` 单源，禁止第二份实现。
// 无例外：副本安装态的兜底实现已随旧脚本删除（2026-11-09）；测试文件不扫（夹具里的同名字符串不是实现）。
import { readFileSync, readdirSync, statSync, realpathSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const SKIP = new Set(['node_modules', '.git', '.session', 'dist'])

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (p.endsWith('.mjs') && !p.endsWith('.test.mjs')) out.push(p)
  }
  return out
}

// 纯函数：仓库根 → 违规清单（空 = 通过）
export function scanSkillDirSources({ repoRoot }) {
  const bad = []
  for (const abs of walk(repoRoot)) {
    const rel = relative(repoRoot, abs).split('\\').join('/')
    const text = readFileSync(abs, 'utf8')
    if (rel.endsWith('skill-dir.mjs') && rel !== 'scripts/skill-dir.mjs') bad.push(`${rel}: 第二份 skill-dir.mjs`)
    else if (rel !== 'scripts/skill-dir.mjs' && /function\s+listSkillDirs\b/.test(text)) {
      bad.push(`${rel}: 第二个 listSkillDirs 实现`)
    }
  }
  return bad
}

function isMain() {
  try {
    const a = realpathSync(process.argv[1])
    const b = realpathSync(fileURLToPath(import.meta.url))
    return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b
  } catch { return false }
}

if (isMain()) {
  const bad = scanSkillDirSources({ repoRoot: process.cwd() })
  for (const b of bad) console.error(b)
  console.log(bad.length ? `skill-dir: bad ${bad.length}` : 'skill-dir ok')
  process.exitCode = bad.length ? 1 : 0
}
