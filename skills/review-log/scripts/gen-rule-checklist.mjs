// gen-rule-checklist.mjs —— 生成「rule 编辑查账 checklist」轮次快照（review-log 技能）
// 职责：① git diff 判定本轮编辑了哪些 rules/*.md（机器判触发，不归 AI 判）
//       ② 机械项自动取证填表（C1 Test-Path / C4 BOM / E 段 score.mjs --file --cognitive --json 逐字填入）
//       ③ 从 assets/rule-edit-checklist-template.md 展开 → 写 .session/reviews/<那一次>/checklist/checklist-<round>.md
// 设计约束（用户 2026-10-15 指令）：机械项必须机器填——AI 手抄聚合清单必漏（R13 P1-1 幽灵引用实录）；
//       score 段 AI 不得手抄（手抄即造假面），抽查 = 重跑该行命令比对输出。
// 用法：node skills/review-log/scripts/gen-rule-checklist.mjs --round R13 --review-dir .session/reviews/2026-10-14-2248-review-all-to-death [--base master]
import { readFileSync, writeFileSync, mkdirSync, openSync, readSync, closeSync, realpathSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(__dirname, '..', '..', '..')          // skills/review-log/scripts → 仓库根
const TEMPLATE = join(__dirname, '..', 'assets', 'rule-edit-checklist-template.md')
const SCORE_SCRIPT = join(REPO, 'skills', 'rule-inspector', 'scripts', 'score.mjs')

// ── 纯函数（导出供测试；CLI 逻辑只做拼装）──

// 前 3 字节是否为 UTF-8 BOM（EF BB BF）
export function hasBom(path) {
  const fd = openSync(path, 'r')
  try {
    const buf = Buffer.alloc(3)
    const n = readSync(fd, buf, 0, 3, 0)
    return n === 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF
  } finally { closeSync(fd) }
}

// git status --porcelain 输出 → [{name, type}]（只认 rules/ 下的 .md；?? → A，其余取首字母）
export function parsePorcelain(out, rulesPrefix) {
  const rows = []
  for (const line of (out || '').split(/\r?\n/)) {
    if (!line.trim()) continue
    const status = line.slice(0, 2)                       // 如 " M"、"??"
    const name = line.slice(3).trim().replace(/"(.*)"/, '$1')
    if (!name.startsWith(rulesPrefix) || !name.endsWith('.md')) continue
    const t = status.includes('?') ? 'A' : status.trim()[0].toUpperCase()
    rows.push({ name, type: t === '?' ? 'A' : t })
  }
  return rows
}

// git diff --name-only 输出 → 文件名列表（只认 rules/ 下的 .md）
export function parseDiffNames(out, rulesPrefix) {
  return (out || '').split(/\r?\n/).map(s => s.trim()).filter(s =>
    s.startsWith(rulesPrefix) && s.endsWith('.md'))
}

// C1：文件在源仓库 rules/ 下存在
export function testPathRule(repo, ruleName) {
  try { return existsSafe(join(repo, ruleName)) } catch { return false }
}
function existsSafe(p) { return realpathSyncSafe(p) !== null }
function realpathSyncSafe(p) { try { return realpathSync(p) } catch { return null } }

// score.mjs --file --json → 解析对象（失败 → { error }，不静默：错误原样进快照）
// ⚠️ 不传 --cognitive：认知判定走 rules/.inspector-annotations.json 自动发现（score.mjs 两种入口都支持）——
//    强制传 --cognitive 会把未标注的 rule 也评 X 组 → 假红（2026-10-15 实测 docs-convention 被误评 3 条 X findings）。
export function scoreRule(repo, ruleName) {
  const r = spawnSync(process.execPath, [SCORE_SCRIPT, '--file', join(repo, ruleName), '--json'],
    { cwd: REPO, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 })
  const stdout = (r.stdout || '').trim()
  const m = stdout.indexOf('{')
  if (r.status !== 0 || m === -1) {
    return { error: `exit ${r.status}`, stderr: (r.stderr || '').trim(), stdout: stdout.slice(0, 500) }
  }
  try { return JSON.parse(stdout.slice(m)) } catch (e) { return { error: `JSON 解析失败：${e.message}`, stdout: stdout.slice(0, 500) } }
}

export function renderRuleTable(rules) {
  return rules.map(r => `| ${r.name} | ${r.type} | ${r.evidence} |`).join('\n')
}

export function renderESections(rules, scores) {
  return rules.map((r, i) => {
    const s = scores[i]
    const head = [
      `### E-${i + 1} · ${r.name}`,
      '',
      '| 项 | 输出（机械填，抽查 = 重跑比对） |',
      '|---|---|',
      `| C1 Test-Path ${r.name} | ${testPathRule(REPO, r.name) ? 'True' : 'False'} |`,
      `| C4 前 3 字节 BOM（${r.name}） | ${hasBom(join(REPO, r.name)) ? 'EF BB BF（有 BOM，违规）' : 'false（无 BOM）'} |`,
    ]
    if (s && s.error) {
      head.push(`| score --file --cognitive --json | **取证失败：${s.error}**（stderr：${(s.stderr || '').slice(0, 300)}） |`)
    } else if (s) {
      const groups = Object.entries(s.groups || {}).map(([g, v]) => `${g} ${v.score}/${v.max}`).join(' ｜ ')
      const findings = (s.findings || []).map(f => `${f.check}：${f.msg}`).join('；') || '无'
      head.push(`| score total/max/rate/level | ${s.total}/${s.max} / ${(typeof s.rate === 'number' ? s.rate.toFixed(4) : s.rate)} / ${s.level} |`)
      head.push(`| 组分明细 | ${groups} |`)
      head.push(`| findings | ${findings} |`)
    }
    head.push('')
    head.push('> score 原始输出（score.mjs --file ' + r.name + ' --json，认知判定经 annotations 自动发现）：')
    head.push('>')
    head.push('> ```json')
    head.push(s && !s.error ? JSON.stringify(s, null, 2) : JSON.stringify(s || {}, null, 2))
    head.push('> ```')
    return head.join('\n')
  }).join('\n\n')
}

export function fillTemplate(tpl, data) {
  return tpl
    .replaceAll('{{ROUND}}', data.round)
    .replaceAll('{{GENERATED_AT}}', data.generatedAt)
    .replaceAll('{{RULE_TABLE}}', data.ruleTable)
    .replaceAll('{{C1_OUTPUT}}', data.c1)
    .replaceAll('{{C4_OUTPUT}}', data.c4)
    .replaceAll('{{E_SECTIONS}}', data.eSections)
    .replaceAll('{{MECH_SUMMARY}}', data.mechSummary)
}

// ── git 取数 ──
function git(args) {
  const r = spawnSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 })
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} 失败：${(r.stderr || '').trim()}`)
  return r.stdout
}

// 本轮（基线..HEAD + 工作区）编辑过的 rules/*.md —— 触发判定机器做
export function changedRules(base) {
  const prefix = 'rules/'
  const committed = parseDiffNames(git(['diff', '--name-only', base, '--', 'rules/']), prefix)
  const worktree = parsePorcelain(git(['status', '--porcelain', '--', 'rules/']), prefix)
  const byName = new Map()
  for (const n of committed) byName.set(n, { name: n, type: 'M', evidence: `commit diff（${base}..HEAD）` })
  for (const w of worktree) {
    const prev = byName.get(w.name)
    byName.set(w.name, {
      name: w.name,
      type: w.type === 'A' ? 'A' : (prev ? prev.type : w.type),
      evidence: prev ? `${prev.evidence} + 工作区未提交（${w.type}）` : `工作区未提交（${w.type}）`,
    })
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name))
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
  if (!opt.round || !opt.reviewDir) {
    console.error('用法：node skills/review-log/scripts/gen-rule-checklist.mjs --round R<N> --review-dir .session/reviews/<那一次> [--base master]')
    process.exit(2)
  }
  const base = opt.base || 'master'
  const rules = changedRules(base)
  const diffEvidence = `git diff --name-only ${base} -- rules/ + git status --porcelain -- rules/ → ${rules.length} 条`
  if (rules.length === 0) {
    console.log(`[触发判定] 本轮无 rule 编辑：${diffEvidence}`)
    console.log('→ 不生成 checklist 快照；progress.md 链接行写「本轮无 rule 编辑（diff 证据：' + diffEvidence + '）」')
    return
  }
  const scores = rules.map(r => scoreRule(REPO, r.name))
  const c1 = rules.map(r => `Test-Path ${r.name} → ${testPathRule(REPO, r.name) ? 'True' : 'False'}`).join('；')
  const c4 = rules.map(r => `${r.name} 前 3 字节 BOM → ${hasBom(join(REPO, r.name)) ? 'EF BB BF（违规）' : 'false（无 BOM）'}`).join('；')
  const data = {
    round: opt.round,
    generatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    ruleTable: renderRuleTable(rules),
    c1, c4,
    eSections: renderESections(rules, scores),
    mechSummary: [
      `- 触发判定（机器）：${diffEvidence}`,
      `- 机械项已填：diff 证据 ×${rules.length}、C1 ×${rules.length}、C4 ×${rules.length}、score 取证 ×${rules.length}（score 失败 ${scores.filter(s => s && s.error).length} 条——失败也是事实，原样留档）`,
      `- AI 项待填（生成时刻）：A×4、B×3、C2、C3、D×4、E2×6、F×6 —— **逐项贴「命令 → 实际输出」，空缺 = 本次编辑未完成**`,
    ].join('\n'),
  }
  const outDir = join(REPO, opt.reviewDir, 'checklist')
  mkdirSync(outDir, { recursive: true })
  const outPath = join(outDir, `checklist-${opt.round}.md`)
  writeFileSync(outPath, fillTemplate(readFileSync(TEMPLATE, 'utf8'), data), 'utf8')
  if (hasBom(outPath)) { console.error(`[BOM 违规] 快照带 BOM：${outPath}`); process.exit(1) }
  console.log(`[生成] ${outPath}`)
  console.log(`[机械项] 规则 ${rules.length} 条：${rules.map(r => r.name).join('、')}`)
  console.log('[AI 项] A/B/C2/C3/D/E2/F 待填——空缺 = 本次编辑未完成')
}

// 直接运行判定：realpathSync 双侧（skill-authoring-convention 判据 ③，禁路径字符串比较）
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) main()
