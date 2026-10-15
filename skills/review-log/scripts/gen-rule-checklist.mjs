// gen-rule-checklist.mjs —— 生成「rule 编辑查账 checklist」轮次快照（review-log 技能）
// 职责：① git diff 判定本轮编辑了哪些 rules/*.md（机器判触发，不归 AI 判）
//       ② 机械项自动取证填表：diff 证据 / C1 Test-Path / C2 增删触发判定 / C4 BOM / E 段逐检查点（score.mjs checks[] 原样展开，一行一个检查点）
//       ③ 从 assets/rule-edit-checklist-template.md 展开 → 写 .session/reviews/<那一次>/checklist/checklist-<round>.md
// 列结构（模板硬约束，全表统一五列）：# / 检查项 / 判据 / 实际输出 / 确认执行——AI 只填 AI 项（A/B/C3/D/E2/F + C2/C4 确认列），机械段（E）不得手抄。
// 用法：node skills/review-log/scripts/gen-rule-checklist.mjs --round R13 --review-dir .session/reviews/2026-10-14-2248-review-all-to-death [--base master]
import { readFileSync, writeFileSync, mkdirSync, openSync, readSync, closeSync, realpathSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(__dirname, '..', '..', '..')          // skills/review-log/scripts → 仓库根
const TEMPLATE = join(__dirname, '..', 'assets', 'rule-edit-checklist-template.md')
const SCORE_SCRIPT = join(REPO, 'skills', 'rule-inspector', 'scripts', 'score.mjs')

// ── 纯函数（导出供测试）──

// 前 3 字节是否为 UTF-8 BOM（EF BB BF）
export function hasBom(path) {
  const fd = openSync(path, 'r')
  try {
    const buf = Buffer.alloc(3)
    const n = readSync(fd, buf, 0, 3, 0)
    return n === 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF
  } finally { closeSync(fd) }
}

// git status --porcelain 输出 → [{name, type}]（只认 rules/ 下的 .md；?? → A）
export function parsePorcelain(out, rulesPrefix) {
  const rows = []
  for (const line of (out || '').split(/\r?\n/)) {
    if (!line.trim()) continue
    const status = line.slice(0, 2)
    const raw = line.slice(3).trim()
    // 重命名（R old -> new）= 旧删新增：分别记 D/A，两条都过滤 rules/ 前缀——OCR R14 :35
    if (status.trim()[0].toUpperCase() === 'R' && raw.includes(' -> ')) {
      const parts = raw.split(/\s+->\s+/)
      const oldName = parts[0].replace(/"(.*)"/, '$1')
      const newName = parts.slice(1).join(' -> ').replace(/"(.*)"/, '$1')
      for (const [n, ty] of [[oldName, 'D'], [newName, 'A']]) {
        if (!n.startsWith(rulesPrefix) || !n.endsWith('.md')) continue
        rows.push({ name: n, type: ty })
      }
      continue
    }
    const name = raw.replace(/"(.*)"/, '$1')
    if (!name.startsWith(rulesPrefix) || !name.endsWith('.md')) continue
    const t = status.includes('?') ? 'A' : status.trim()[0].toUpperCase()   // ?? → A；t 已不可能为 '?'（死分支去掉，OCR R14 :38）
    rows.push({ name, type: t })
  }
  return rows
}

// git diff --name-status 输出 → [{name, type}]（只认 rules/ 下的 .md；A/M/D；R100 old\tnew → 旧删新加）
// --name-status 而非 --name-only：C2 触发判定须看见「已 commit 的 A/D」，porcelain 只覆盖未提交行——OCR R14 :168
export function parseDiffStatus(out, rulesPrefix) {
  const rows = []
  for (const line of (out || '').split(/\r?\n/)) {
    if (!line.trim()) continue
    const m = line.match(/^([AMD]|R\d+)\s+(.+)$/)
    if (!m) continue
    if (m[1].startsWith('R')) {
      const [oldName, newName] = m[2].split('\t')
      for (const [n, ty] of [[oldName || '', 'D'], [newName || '', 'A']]) {
        if (!n.startsWith(rulesPrefix) || !n.endsWith('.md')) continue
        rows.push({ name: n, type: ty })
      }
      continue
    }
    const name = m[2].trim()
    if (!name.startsWith(rulesPrefix) || !name.endsWith('.md')) continue
    rows.push({ name, type: m[1] })
  }
  return rows
}

// 模板 AI 项行数派生（A/B/C/D/E2/F 表行）——硬编码计数会随模板增删行漂移（OCR R14 :178）
export function templateAICounts(tpl) {
  const counts = {}
  for (const line of tpl.split(/\r?\n/)) {
    // 组1=段字母、组2=段名数字（仅 E2 段有）、组3=行号（有连字符才出现）
    // A1 → 段 A（行号 1 是组2）；E2-1 → 段 E2（组2=2 属段名，行号 1 是组3）
    const m = line.match(/^\| ([A-F])(\d*)(?:-(\d+))? \|/)
    if (!m) continue
    const sec = m[1] + (m[3] !== undefined ? m[2] : '')
    counts[sec] = (counts[sec] || 0) + 1
  }
  return counts
}

export function renderRuleTable(rules) {
  return rules.map(r => `| ${r.name} | ${r.type} | ${r.evidence} |`).join('\n')
}

// C2 触发判定（机器做）：porcelain 行里有无 A/D 型规则文件
export function ruleAddDeleteVerdict(porcelainRows) {
  const ad = porcelainRows.filter(r => r.type === 'A' || r.type === 'D')
  return ad.length === 0
    ? { triggered: false, text: `git status --porcelain -- rules/ → 无 A/D 型 .md（输出见下）→ 未触发 aas；AI 贴该命令输出后写「确认执行」` }
    : { triggered: true, text: `检测到 A/D 型规则文件：${ad.map(r => `${r.type} ${r.name}`).join('、')} → AI 必须跑 aas 贴「需建链接 = 0」` }
}

// E 段：score.mjs checks[] 逐检查点展开成五行表（AI 不得手抄——本函数是唯一渲染口）
export function renderESections(rules, scores) {
  return rules.map((r, i) => {
    const s = scores[i]
    const head = [
      `### E-${i + 1} · ${r.name}`,
      '',
      `> 取证命令：\`node skills/rule-inspector/scripts/score.mjs --file ${r.name} --json\`（认知判定经 rules/.inspector-annotations.json 自动发现）；总分 **${s && !s.error ? `${s.total}/${s.max}（${s.level}）` : '取证失败'}**。`,
      '',
      '| # | 检查项 | 判据（score.mjs 机械判定 · criteria 对应组） | 实际输出 | 确认执行 |',
      '|---|---|---|---|---|',
    ]
    if (s && s.error) {
      head.push(`| 1 | 取证失败 | score.mjs --file | **exit ${s.error}**：${(s.stderr || s.stdout || '').slice(0, 200)} | |`)
    } else if (Array.isArray(s && s.checks) && s.checks.length) {
      s.checks.forEach((c, j) => {
        const out = c.pass ? '通过' : `**未过**：${c.msg}`
        head.push(`| ${j + 1} | ${c.check} | criteria「${c.group}」组 · score.mjs | ${out} | 确认执行 |`)
      })
      // 逐项数与组 max 对账（防 checks 与 groups 漂移）
      const groupMaxSum = Object.values(s.groups || {}).reduce((a, v) => a + v.max, 0)
      if (groupMaxSum !== s.checks.length) {
        head.push(`| ⚠ | 逐项对账 | checks 条数 ${s.checks.length} ≠ 组 max 之和 ${groupMaxSum} | **数据不一致，视为取证失败，重跑 score.mjs** | |`)
      }
    } else {
      head.push('| 1 | 取证失败 | score.mjs --file | 输出缺 checks[]（旧版 score.mjs？）——重跑/升级后再生 | |')
    }
    return head.join('\n')
  }).join('\n\n')
}

export function fillTemplate(tpl, data) {
  const map = {
    ROUND: data.round, RULE_TABLE: data.ruleTable, C1_OUTPUT: data.c1, C2_OUTPUT: data.c2,
    C4_OUTPUT: data.c4, E_SECTIONS: data.eSections, MECH_SUMMARY: data.mechSummary,
  }
  // 替换值走函数形式：避免 $& / $` / $' 等替换模式被解释 → 快照内容被静默篡改（OCR R14 :94）
  return tpl.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in map ? map[k] : m))
}

// ── git / score 取数 ──
function git(args) {
  const r = spawnSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 })
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} 失败：${(r.stderr || '').trim()}`)
  return r.stdout
}
function testPathRule(repo, ruleName) {
  try { realpathSync(join(repo, ruleName)); return true } catch { return false }
}

// score.mjs --file --json（不传 --cognitive：认知判定走 annotations 自动发现——强制传会给未标注规则评 X 组 → 假红）
// runner 可注入（测试用 fixture 替换真实 spawnSync）
export function scoreRule(repo, ruleName, runner = (args) => spawnSync(process.execPath, args, { cwd: REPO, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 })) {
  const r = runner([SCORE_SCRIPT, '--file', join(repo, ruleName), '--json'])
  const stdout = (r.stdout || '').trim()
  const m = stdout.indexOf('{')
  if (r.status !== 0 || m === -1) {
    return { error: `exit ${r.status}`, stderr: (r.stderr || '').trim(), stdout: stdout.slice(0, 500) }
  }
  try { return JSON.parse(stdout.slice(m)) } catch (e) { return { error: `JSON 解析失败：${e.message}`, stdout: stdout.slice(0, 500) } }
}

// 本轮（基线 + 工作区）编辑过的 rules/*.md —— 触发判定机器做
// gitRunner 可注入（测试用 fixture 字符串替换真实 git）；A/D/M 类型以 commit diff（--name-status）为准，
// 工作区 porcelain 补充未跟踪文件（?? → A）；重命名按 旧删 D + 新加 A
export function changedRules(base, gitRunner = git) {
  const prefix = 'rules/'
  const committed = parseDiffStatus(gitRunner(['diff', '--name-status', base, '--', 'rules/']), prefix)
  const porcelain = parsePorcelain(gitRunner(['status', '--porcelain', '--', 'rules/']), prefix)
  const byName = new Map()
  for (const c of committed) byName.set(c.name, { name: c.name, type: c.type, evidence: `commit diff（${base}..工作区）` })
  for (const w of porcelain) {
    const prev = byName.get(w.name)
    if (!prev) {
      // git diff 不覆盖未跟踪文件；?? → 新增
      byName.set(w.name, { name: w.name, type: w.type, evidence: `工作区未提交（${w.type}）` })
    } else {
      byName.set(w.name, {
        name: w.name,
        type: w.type === 'A' ? 'A' : prev.type,   // ?? = 工作区有文件 → 至少算新增
        evidence: `${prev.evidence} + 工作区未提交（${w.type}）`,
      })
    }
  }
  return { rules: [...byName.values()].sort((a, b) => a.name.localeCompare(b.name)), porcelain }
}

// ── CLI ──
function main() {
  const argv = process.argv.slice(2)
  const opt = {}
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--round') opt.round = argv[++i]
    else if (argv[i] === '--review-dir') opt.reviewDir = argv[++i]
    else if (argv[i] === '--base') opt.base = argv[++i]
    else { console.error(`未知参数：${argv[i]}（支持 --round / --review-dir / --base）`); process.exit(2) }
  }
  if (!opt.round || !opt.reviewDir || !opt.base) {
    console.error('用法：node skills/review-log/scripts/gen-rule-checklist.mjs --round R<N> --review-dir .session/reviews/<那一次> --base <基线 commit>')
    console.error('  --base 必传：基线 = 上轮锁基线 commit（见 review-log 轮次账），不可用 master——master 落后于 review 分支时会把历史轮的 rule 改动重复算进本轮')
    process.exit(2)
  }
  const base = opt.base
  const { rules } = changedRules(base)
  const diffEvidence = `git diff --name-status ${base} -- rules/ + git status --porcelain -- rules/ → ${rules.length} 条`
  if (rules.length === 0) {
    console.log(`[触发判定] 本轮无 rule 编辑：${diffEvidence}`)
    console.log(`→ 不生成 checklist 快照；progress.md 链接行写「本轮无 rule 编辑（diff 证据：${diffEvidence}）」`)
    return
  }
  const scores = rules.map(r => scoreRule(REPO, r.name))
  const c1 = rules.map(r => `Test-Path ${r.name} → ${testPathRule(REPO, r.name) ? 'True' : 'False'}`).join('；')
  // D 型（已删除）文件没有可查 BOM 的文件 → 标「不适用」，防 hasBom 对缺失文件抛 ENOENT 整体崩溃——OCR R14 :167
  const c4 = rules.map(r => {
    if (r.type === 'D') return `${r.name} 已删除 → 不适用（无文件可查 BOM）`
    return `${r.name} 前 3 字节 BOM → ${hasBom(join(REPO, r.name)) ? 'EF BB BF（违规）' : 'false（无 BOM）'}`
  }).join('；')
  // C2 触发判定基于合并后 A/D（含已 commit 的增删）——porcelain 只有未提交行，已 commit 的 A/D 会假阴性——OCR R14 :168
  const c2v = ruleAddDeleteVerdict(rules.filter(r => r.type === 'A' || r.type === 'D'))
  const checksTotal = scores.reduce((a, s) => a + (Array.isArray(s && s.checks) ? s.checks.length : 0), 0)
  // 模板先剥头 BOM（模板可能带 U+FEFF），渲染后写盘前校验——写盘后校验会让违规产物已落盘——OCR R14 :184
  const tplText = readFileSync(TEMPLATE, 'utf8').replace(/^\uFEFF/, '')
  const ai = templateAICounts(tplText)
  const data = {
    round: opt.round,
    ruleTable: renderRuleTable(rules),
    c1, c2: c2v.text, c4,
    eSections: renderESections(rules, scores),
    mechSummary: [
      `- 触发判定（机器）：${diffEvidence}`,
      `- 机械项已填：diff 证据 ×${rules.length}、C1 ×${rules.length}、C2 触发判定、C4 ×${rules.length}、E 段逐检查点 ${checksTotal} 行（score.mjs checks[] 原样展开）`,
      `- AI 项待填：A×${ai.A}、B×${ai.B}、C2/C3 确认列、D×${ai.D}、E2×${ai.E2}、F×${ai.F} —— **每行贴命令输出 + 写「确认执行」；缺任一 = 本次编辑未完成**`,
    ].join('\n'),
  }
  const outDir = join(REPO, opt.reviewDir, 'checklist')
  mkdirSync(outDir, { recursive: true })
  const outPath = join(outDir, `checklist-${opt.round}.md`)
  const rendered = fillTemplate(tplText, data)
  if (rendered.startsWith('\uFEFF')) { console.error(`[BOM 违规] 模板渲染出带 BOM 的快照：${outPath}`); process.exit(1) }
  writeFileSync(outPath, rendered, 'utf8')
  console.log(`[生成] ${outPath}`)
  console.log(`[机械项] 规则 ${rules.length} 条；E 段逐检查点 ${checksTotal} 行`)
  console.log(`[AI 项] A×${ai.A} B×${ai.B} C2/C3 D×${ai.D} E2×${ai.E2} F×${ai.F} 待填——每行贴命令输出 + 写「确认执行」，空缺 = 未完成`)
}

// 直接运行判定：realpathSync 双侧（skill-authoring-convention 判据 ③，禁路径字符串比较）
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) main()
