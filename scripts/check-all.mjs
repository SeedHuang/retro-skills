// check-all.mjs —— 仓库级检查入口（npm run check 的执行体）
// 职责：① skills/ 下非测试 .mjs 语法检查（node --check 遍历，防未被子进程 import 的脚本语法错漏网）
//       ② 全仓测试（node --test，glob 覆盖全仓，node_modules 由 Node 自身默认排除）
//       ③ 技能规范守卫（skill-inspector check.mjs）
//       ④ markdown 机械检查（围栏配对 / 表格列数 / BOM / SKILL.md frontmatter）
// 零外部依赖：只用 Node 内置模块。失败任一 → 非零退出（供脚本化调用拿失败信号）。
import { readdirSync, statSync, readFileSync, existsSync, openSync, readSync, closeSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// 收集 skills/**/*.mjs（排除 *.test.mjs——测试文件由 node --test 编译）
function collectMjs(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) collectMjs(p, out)
    else if (entry.endsWith('.mjs') && !entry.endsWith('.test.mjs')) out.push(p)
  }
  return out
}

let failed = false

// ① 语法检查：node --check 逐个（只查语法，不执行）
const mjsFiles = collectMjs(join(root, 'skills'))
if (mjsFiles.length === 0) {
  failed = true
  console.error('[语法] 未找到任何 .mjs 文件，语法检查未实际执行')
}
for (const file of mjsFiles) {
  const r = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' })
  if (r.status !== 0) {
    failed = true
    console.error(`[语法] ${file}\n${r.stderr}`)
  }
}
if (!failed) console.log('① 语法检查通过')

// ② 测试：node --test（glob 由 Node 展开，引号包住防 shell 展开差异）
// glob 覆盖全仓（不只 skills/，否则 skilldependencies/ 等目录下的测试会漏跑）；node_modules 由 Node 自身默认排除
// maxBuffer 要给足：下面要回读 "# tests N" 判定测试是否真跑，输出被截断会误报成「解析不出用例总数」
const t = spawnSync(process.execPath, ['--test', '**/*.test.mjs'], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
console.log(t.stdout)
if (t.status !== 0) {
  failed = true
  if (t.stderr) console.error(t.stderr)
}
// 零匹配时 node --test 仍 exit 0（# tests 0），故必须回读用例总数，失能即失败
const testsLine = /^\s*#\s*tests\s+(\d+)\s*$/m.exec(t.stdout || '')
if (!testsLine) {
  failed = true
  console.error('[测试] 无法从 node --test 输出解析出用例总数（缺少 "# tests N" 行）')
} else if (Number(testsLine[1]) === 0) {
  failed = true
  console.error('[测试] 用例总数为 0，测试未实际执行（glob 零匹配？）')
}

// ③ 技能守卫
const c = spawnSync(process.execPath, ['skills/skill-inspector/scripts/check.mjs'], { cwd: root, encoding: 'utf8' })
console.log(c.stdout)
if (c.status !== 0) {
  failed = true
  if (c.stderr) console.error(c.stderr)
}

// ─────────────────────────────────────────────────────────────────────────────
// ④ markdown 机械检查
// 为什么要有这四项：它们坏了不会让任何构建/测试失败，只会让文档渲染坏掉或技能加载不了，
// 而损坏点通常在成百上千行里靠人眼扫不出来（围栏多一条就把后面正文吞成等宽字体；
// 表格少一列就静默丢一格内容；BOM 让 SKILL.md 被 npx skills add 判成非法；frontmatter 缺字段技能直接不可用）。
// ─────────────────────────────────────────────────────────────────────────────

// 扫描范围 = 仓库内受版本管理的文档面；跳过 .git 与 .gitignore 里的过程目录
// （.superpowers/ .session/ lessons/ .trae/ 是一次性工作区与个人数据，坏了也不进仓库，不该由本检查拦）
const MD_SKIP_DIRS = new Set(['.git', '.superpowers', '.session', 'lessons', '.trae', 'node_modules'])

function collectMd(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (MD_SKIP_DIRS.has(entry.name)) continue
      collectMd(join(dir, entry.name), out)
    } else if (entry.name.endsWith('.md')) {
      out.push(join(dir, entry.name))
    }
  }
  return out
}

// 表格单元格切分——按 markdown 代码跨度规则处理（控制器实跑验证过的版本，不要简化）
// `ticks > 0` 分支是关键：反引号跨度内反斜杠与竖线都是字面量，不特判会让 `` `scripts\` `` 吃掉收尾反引号、
// 代码跨度永不闭合，后面所有竖线都不算分隔符（第一版漏这条 → 15 条 findings 里 14 条是它的误报）。
function splitRow(line) {
  let s = line.trim()
  if (s[0] === '|') s = s.slice(1)
  const cells = []; let cur = ''; let i = 0; let ticks = 0
  while (i < s.length) {
    const ch = s[i]
    if (ticks > 0) {                       // 代码跨度内：反斜杠与竖线都是字面量
      if (ch === '`') { let n = 0; while (s[i+n] === '`') n++; if (n === ticks) ticks = 0; cur += '`'.repeat(n); i += n; continue }
      cur += ch; i++; continue
    }
    if (ch === '\\' && i + 1 < s.length) { cur += s[i + 1]; i += 2; continue }  // 跨度外才转义
    if (ch === '`') { let n = 0; while (s[i+n] === '`') n++; ticks = n; cur += '`'.repeat(n); i += n; continue }
    if (ch === '|') { cells.push(cur.trim()); cur = ''; i++; continue }
    cur += ch; i++
  }
  cells.push(cur.trim())
  if (cells.length > 1 && cells[cells.length - 1] === '' && s.endsWith('|')) cells.pop()
  return cells
}
const isDelim = c => c.length > 0 && c.every(x => /^:?-{1,}:?$/.test(x))
const FENCE_RE = /^\s*(`{3,}|~{3,})/
const TABLE_ROW_RE = /^\s*\|/

// 围栏掩码：mask[i]=true 表示第 i 行在围栏内部（分隔行本身不算内部）
// 未闭合的围栏会把文件剩余部分全吞进代码块，故未闭合时其后的行同样标为内部
// 按 CommonMark 记「字符 + 长度」：闭合必须字符相同且长度 ≥ 开启长度。
// 否则 4 反引号的嵌套围栏会被内层 3 反引号提前关掉，块里的表格骨架被当成真表格 → 假阳（本仓 12 处嵌套围栏）。
function fenceMask(lines) {
  const mask = new Array(lines.length).fill(false)
  let open = -1, openChar = '', openLen = 0
  for (let i = 0; i < lines.length; i++) {
    const m = FENCE_RE.exec(lines[i])
    if (!m) {
      if (open >= 0) mask[i] = true
      continue
    }
    const fence = m[1]
    if (open < 0) {
      open = i; openChar = fence[0]; openLen = fence.length
    } else if (fence[0] === openChar && fence.length >= openLen) {
      open = -1; openChar = ''; openLen = 0
    } else {
      mask[i] = true          // 关不掉的开围栏行 = 代码块内部的普通内容
    }
  }
  return { mask, unclosedLine: open >= 0 ? open + 1 : 0 }
}

const mdFindings = []
const mdFiles = collectMd(root)
if (mdFiles.length === 0) {
  failed = true
  console.error('[markdown] 未找到任何 .md 文件，markdown 检查未实际执行')
}
let tableCount = 0
for (const file of mdFiles) {
  const rel = file.slice(root.length + 1)
  const text = readFileSync(file, 'utf8')
  const lines = text.split(/\r?\n/)
  const { mask, unclosedLine } = fenceMask(lines)

  // 检查 4.1 · 代码围栏配对：未闭合 → 报出开围栏所在行（多余一条 ``` 就会把后面正文吞成等宽字体）
  if (unclosedLine) mdFindings.push({ file: rel, line: unclosedLine, check: '代码围栏未闭合' })

  // 检查 4.2 · 表格列数一致性
  // 三道闸门防误报：① 跳过围栏内部（代码块里的表格骨架不是表）
  // ② 下一行必须是合法分隔行，否则「以 | 开头的行」不算表（正文里的竖线分隔会大量假阳）
  // ③ 分隔行列数必须等于表头列数，对不上就不是一张表 → 跳过不报
  for (let i = 0; i + 1 < lines.length; i++) {
    if (mask[i] || mask[i + 1]) continue
    if (!TABLE_ROW_RE.test(lines[i]) || !TABLE_ROW_RE.test(lines[i + 1])) continue
    const head = splitRow(lines[i])
    const delim = splitRow(lines[i + 1])
    if (!isDelim(delim) || delim.length !== head.length) continue
    tableCount++
    for (let j = i + 2; j < lines.length && !mask[j] && TABLE_ROW_RE.test(lines[j]); j++) {
      const n = splitRow(lines[j]).length
      if (n !== head.length) {
        mdFindings.push({ file: rel, line: j + 1, check: `表格列数不一致（表头 ${head.length} 列，该行 ${n} 列）` })
      }
    }
  }
}

// 检查 4.3 · markdown 不得带 UTF-8 BOM
// 只读前 3 字节比对，不整文件读进内存（本仓规则 powershell-file-encoding：BOM 已导致过两次实际故障）
for (const file of mdFiles) {
  const fd = openSync(file, 'r')
  try {
    const buf = Buffer.alloc(3)
    const n = readSync(fd, buf, 0, 3, 0)
    if (n === 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
      mdFindings.push({ file: file.slice(root.length + 1), line: 1, check: '文件带 UTF-8 BOM' })
    }
  } finally {
    closeSync(fd)
  }
}

// 检查 4.4 · SKILL.md frontmatter 完整性（技能靠 name/description 两个字段加载，缺任一即不可用）
const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---/
const skillsRoot = join(root, 'skills')
const skillDirs = readdirSync(skillsRoot, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name)
if (skillDirs.length === 0) {
  failed = true
  console.error('[markdown] skills/ 下没有任何技能目录，frontmatter 检查未实际执行')
}
for (const name of skillDirs) {
  const p = join(skillsRoot, name, 'SKILL.md')
  if (!existsSync(p)) {
    mdFindings.push({ file: `skills/${name}`, line: 0, check: '缺少 SKILL.md' })
    continue
  }
  // 开头剥 BOM：BOM 已由 4.3 单独报，同一根因不重复报两条
  const fm = FM_RE.exec(readFileSync(p, 'utf8').replace(/^\uFEFF/, ''))
  if (!fm) {
    mdFindings.push({ file: `skills/${name}/SKILL.md`, line: 1, check: 'frontmatter 缺失或未闭合' })
    continue
  }
  for (const field of ['name', 'description']) {
    if (!new RegExp(`^${field}\\s*:\\s*\\S`, 'm').test(fm[1])) {
      mdFindings.push({ file: `skills/${name}/SKILL.md`, line: 1, check: `frontmatter 缺 ${field}` })
    }
  }
}

for (const f of mdFindings) console.error(`[markdown] ${f.file}:${f.line} ${f.check}`)
if (mdFindings.length === 0) console.log(`④ markdown 检查通过（${mdFiles.length} 个文件 / ${tableCount} 张表）`)
else {
  failed = true
  console.error(`[markdown] ${mdFindings.length} 处问题`)
}

if (failed) {
  console.error('check 未通过')
  process.exit(1)
}
console.log('check 全部通过')