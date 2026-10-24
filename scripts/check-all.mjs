// check-all.mjs —— 仓库级检查入口（npm run check 的执行体）
// 职责：① skills/ 下非测试 .mjs 语法检查（node --check 遍历，防未被子进程 import 的脚本语法错漏网）
//       ② 全仓测试（node --test，glob 覆盖全仓，node_modules 由 Node 自身默认排除）
//       ③ 技能规范守卫（skill-inspector check.mjs）
//       ④ markdown 机械检查（围栏配对 / 表格列数 / BOM / SKILL.md frontmatter）
// 零外部依赖：只用 Node 内置模块。失败任一 → 非零退出（供脚本化调用拿失败信号）。
import { readdirSync, readFileSync, existsSync, openSync, readSync, closeSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
// 「什么算技能目录」判据的唯一真相源（另两处消费方：skill-inspector check.mjs / validate.test.mjs。勿在本文件另写一份）
import { listSkillDirs } from './skill-dir.mjs'
// docgen baseline 两清单（rule + agent）的共享常量——gate 的 baseline 断言从它派生，勿在本文件另写一份
import { BASELINE_RULES, agentPaths } from '../tools/docgen/components/baseline.mjs'
// 执行力度矩阵：归桶守卫 + A 组检查 + 共享项变更硬闸门 + 模式表守卫
// （判据单源在 tools/execution-matrix/，本文件只调用不内联）
import { checkBuckets } from '../tools/execution-matrix/check-buckets.mjs'
import { checkAgentFile } from '../tools/execution-matrix/check-agent.mjs'
// docgen 状态（哪些席已由生成器替换）——A 组检查的覆盖集从这里现算，不写死试点席
import { readState, statePath } from '../tools/docgen/state.mjs'
// 名字集来源（C9 的 ⊇ 断言的另一头）：与 baseline / gate / check-agents 同一份 agentData
import { agentData } from '../tools/docgen/components/agentData.mjs'
import { checkSharedChanges } from '../tools/execution-matrix/shared-changes/check-shared-changes.mjs'
import { checkPatternTable } from '../tools/execution-matrix/check-pattern-table.mjs'
import { splitRow, fenceMask } from '../tools/execution-matrix/markdown-rows.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// 收集 skills/**/*.mjs（排除 *.test.mjs——测试文件由 node --test 编译）
// 不跟随 junction/symlink：自引用链接会无限递归，链接到仓库外会扫进外部文件
// 测试文件只认 *.test.mjs 命名（本仓约定如此，其它命名的测试不在此排除，会当普通脚本过语法）
function collectMjs(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue        // 不跟随 junction/symlink，防成环与扫到仓库外
    const p = join(dir, entry.name)
    if (entry.isDirectory()) collectMjs(p, out)
    else if (entry.name.endsWith('.mjs') && !entry.name.endsWith('.test.mjs')) out.push(p)
  }
  return out
}

let failed = false

// ① 语法检查：node --check 逐个（只查语法，不执行）
const skillsDir = join(root, 'skills')
const skillsDirExists = existsSync(skillsDir)
if (!skillsDirExists) {
  failed = true
  console.error('[语法] 未找到 skills/ 目录，语法检查未实际执行')
}
const mjsFiles = skillsDirExists ? collectMjs(skillsDir) : []
if (mjsFiles.length === 0) {
  failed = true
  console.error('[语法] 未找到任何 .mjs 文件，语法检查未实际执行')
}
for (const file of mjsFiles) {
  const r = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' })
  if (r.error) {
    failed = true
    console.error(`[语法] ${file} 进程启动失败：${r.error.message}`)
    continue
  }
  if (r.status !== 0) {
    failed = true
    console.error(`[语法] ${file}\n${r.stderr}`)
  }
}
if (!failed) console.log('① 语法检查通过')

// ② 测试：node --test（glob 由 Node 展开，引号包住防 shell 展开差异）
// glob 覆盖全仓（不只 skills/，否则 skilldependencies/ 等目录下的测试会漏跑）；node_modules 由 Node 自身默认排除
// maxBuffer 要给足：下面要回读 "# tests N" 判定测试是否真跑，输出被截断会误报成「解析不出用例总数」
const testEnv = { ...process.env, DOCGEN_CHECK_ACTIVE: '1' }
for (const key of ['DOCGEN_TMP_ROOT', 'DOCGEN_RULES_DIR', 'DOCGEN_BASELINE_PATH', 'DOCGEN_TEST_MODE', 'DOCGEN_NESTED', 'NODE_TEST_CONTEXT']) delete testEnv[key]
const t = spawnSync(process.execPath, ['--test', '**/*.test.mjs'], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: testEnv })
console.log(t.stdout)
if (t.error) {
  failed = true
  console.error('[测试] 进程启动失败：' + t.error.message)
} else {
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
}

// ②.5 docgen gate：整文件生成物与 baseline 的只读守卫（P2：切换到 tools/docgen/cli.mjs gate；baseline 从共享常量派生）
const gateEnv = process.env.DOCGEN_NESTED === '1'
  ? { ...process.env, DOCGEN_CHECK_ACTIVE: '1' }
  : { ...testEnv, DOCGEN_CHECK_ACTIVE: '1' }
const baselineN = BASELINE_RULES.length + agentPaths().length
const g = spawnSync(process.execPath, ['tools/docgen/cli.mjs', 'gate'], { cwd: root, encoding: 'utf8', env: gateEnv })
if (g.error) {
  failed = true
  console.error('[docgen] 进程启动失败：' + g.error.message)
} else {
  if (g.stdout) console.log(g.stdout.trim())
  if (g.status !== 0) {
    failed = true
    if (g.stderr) console.error(g.stderr)
  } else if (!new RegExp(`baseline ${baselineN}\/${baselineN}`).test(g.stdout || '')) {
    failed = true
    console.error(`[docgen] gate 退出 0 但未打印 baseline ${baselineN}/${baselineN}`)
  }
}

// ②.6 执行力度矩阵：归桶守卫 + A 组检查 + 共享项变更硬闸门（R7）+ 模式表守卫
// （对齐既有 gate 模式：failed=true 统一出口）
const bucketRes = checkBuckets()
if (!bucketRes.ok) {
  failed = true
  console.error(`[execution-matrix] 归桶守卫失败：${JSON.stringify(bucketRes.findings)}`)
}
// A 组 + 十键检查覆盖每个已被 docgen 替换的席（覆盖集从 state 现算：只挂试点席会让新增席静默漏检）
let replacedSeats = []
let stateRead = true
let stateAgents = {}
try {
  stateAgents = readState().agents
  replacedSeats = Object.entries(stateAgents)
    .filter(([, st]) => st === 'replaced')
    .map(([name]) => name)
    .sort()
} catch (e) {
  // readState 抛 StateFileInvalid（state.json 损坏 / 键不在 agentData）：按本文件统一出口收敛，
  // 不让整个 check 以未捕获堆栈中止、把后面的共享项闸门与 markdown 检查一起丢掉
  stateRead = false
  failed = true
  console.error(`[execution-matrix] state 读取失败：${e.code ?? e.name}（A 组检查未执行）`)
}
// C9（spec §7.1）：state 覆盖集 ⊇ agentData 名字集，fail-closed——缺一条键、或整个 state 文件缺失都报红。
// 为什么不放进 readState()：state 缺失返回空表是既有语义（pilot-gate.test.mjs 依赖），下沉会改语义并波及多个测试。
// 缺键的后果是静默的：A 组与十键检查的覆盖集从 state 现算，漏登记的席不会被检查，也不会有任何红灯。
if (!existsSync(statePath())) {
  failed = true
  console.error(`[execution-matrix] state 文件缺失：${statePath()}（C9 fail-closed：不得按「全量 registered」放行）`)
} else if (stateRead) {
  const missing = agentData.map((a) => a.name).filter((n) => !(n in stateAgents))
  if (missing.length > 0) {
    failed = true
    console.error(`[execution-matrix] state 覆盖不全：缺 ${missing.join(', ')}（漏登记 state 的席会被 A 组静默跳过）`)
  }
}
if (stateRead && replacedSeats.length === 0) {
  failed = true
  console.error('[execution-matrix] state 中没有任何 replaced 席，A 组检查未实际执行')
}
if (replacedSeats.length > 0) {
  console.log(`[execution-matrix] A 组+十键检查已覆盖 ${replacedSeats.length} 席：${replacedSeats.join(', ')}`)
}
for (const seat of replacedSeats) {
  const agentRes = checkAgentFile(seat)
  if (!agentRes.ok) {
    failed = true
    console.error(`[execution-matrix] ${seat} A 组检查失败：${JSON.stringify(agentRes.findings)}`)
  }
}
const sharedRes = checkSharedChanges()
if (!sharedRes.ok) {
  failed = true
  console.error(`[execution-matrix] 共享项变更硬闸门失败（R7）：${JSON.stringify(sharedRes.findings)}`)
}
const patternRes = checkPatternTable()
if (!patternRes.ok) {
  failed = true
  console.error(`[execution-matrix] 模式表守卫失败：${JSON.stringify(patternRes.findings)}`)
}

// ③ 技能守卫
const c = spawnSync(process.execPath, ['skills/skill-inspector/scripts/check.mjs'], { cwd: root, encoding: 'utf8' })
console.log(c.stdout)
if (c.error) {
  failed = true
  console.error('[守卫] 进程启动失败：' + c.error.message)
} else if (c.status !== 0) {
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
    } else if (!entry.isSymbolicLink() && entry.name.endsWith('.md')) {
      // 不跟随 symlink：指向巨大文件或特殊设备会卡死或爆内存
      out.push(join(dir, entry.name))
    }
  }
  return out
}

// 表格单元格切分 = tools/execution-matrix/markdown-rows.mjs 的共享单源（反引号跨度内的竖线是字面量）
// 为什么不再在本文件留一份：与执行力度矩阵守卫的 splitRow 逻辑完全一致（2026-10-20 归一化逐行比对
// 19 行仅差注释/分号/空格 + 全仓 6653 条表格行实跑输出 0 条不一致），两份实现必然漂移 → 合成一份。
// 改动切分口径时改 markdown-rows.mjs 一处，本文件与那边自动同步。

const isDelim = c => c.length > 0 && c.every(x => /^:?-{1,}:?$/.test(x))
// 表格行只覆盖首竖线写法（`| A | B |`）——本仓约定所有表格都用首竖线。
// 放宽到 GFM 的无首竖线写法会把正文里含 `|` 的行大量误判成表格（本 session 实测过 5 条假阳）
const TABLE_ROW_RE = /^\s*\|/

// 围栏掩码 fenceMask 也是共享单源（tools/execution-matrix/markdown-rows.mjs）：
// 「围栏内内容算不算结构」只能有一个口径——本文件的 markdown 机械检查与 A 组结构检查若各写一份，
// 同一份卡会在两处得出相反结论。语义（含未闭合围栏的处理）见该文件注释。

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
// 只把「含 SKILL.md 的目录」当技能——非技能目录（如技能下嵌套的 node_modules/）不得报「缺少 SKILL.md」
// 口径与 skilldependencies/validate.test.mjs 一致（按 SKILL.md 过滤）
const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/
const skillsRoot = join(root, 'skills')
let skillDirs = []
let frontmatterSkipped = false
if (!existsSync(skillsRoot)) {
  failed = true
  frontmatterSkipped = true
  console.error('[markdown] 未找到 skills/ 目录，frontmatter 检查未实际执行')
} else {
  // 技能目录判定：两层 + 错误契约全在 scripts/skill-dir.mjs（唯一真相源），本文件不另写
  skillDirs = listSkillDirs(skillsRoot)
  if (skillDirs.length === 0) {
    failed = true
    frontmatterSkipped = true
    console.error('[markdown] skills/ 下没有任何技能目录，frontmatter 检查未实际执行')
  }
}
for (const name of skillDirs) {
  const p = join(skillsRoot, name, 'SKILL.md')
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
// 扫描没真跑（mdFiles 为空，或 frontmatter 检查被跳过）时不得打「通过」——否则会紧跟「check 未通过」自相矛盾
if (mdFindings.length === 0 && mdFiles.length > 0 && !frontmatterSkipped) console.log(`④ markdown 检查通过（${mdFiles.length} 个文件 / ${tableCount} 张表）`)
else if (mdFindings.length > 0) {
  failed = true
  console.error(`[markdown] ${mdFindings.length} 处问题`)
}

if (failed) {
  console.error('check 未通过')
  process.exitCode = 1          // 不要 process.exit(1)：管道/CI 下会截断 stdout，正好隐藏要报的 findings
} else {
  console.log('check 全部通过')
}
