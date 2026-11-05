// check-gate-record.mjs —— 出口签字账（按任务分目录）的机械判据
//
// 载体：`docs/devworkflows/<YYYYMMDDHHmmss>-<任务名>/gate-record.md`（一任务一份）。
// 本文件判 R1（证据可复算）/ R2（不得自签）/ R3（阶段门）/ R6（拆 spec 中 ≤1）/ R9（技能侧不得装任务账）+
// 单份 40 KB / 整行 800 / 列上限。`tasks 0` 与「任务目录缺 gate-record.md」都 fail-closed 判红。
//
// 为什么不再读单个技能侧文件：签字账是项目文档、不是技能内容（PRD 20261105160504 §3.1）。
// 单元格切分用仓内单源 splitRow（反引号跨度内的竖线不算分隔符）；围栏掩码用同源 fenceMask。
import { readFileSync, readdirSync, existsSync, realpathSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { splitRow, fenceMask } from '../tools/execution-matrix/markdown-rows.mjs'
import { STAMP_DIR_NAME_RE } from './doc-name.mjs'

export const RECORD_DIR = 'docs/devworkflows'
export const RECORD_NAME = 'gate-record.md'
export const TEMPLATE_NAME = 'gate-record-template.md'
// 目录名正则复用 `doc-name.mjs` 的唯一实现（不另写第二份）
export const TASK_DIR_RE = STAMP_DIR_NAME_RE
export const SEGMENTS = ['①', '②', '②→③', '③', '④', '⑤']
export const LIMITS = Object.freeze({ fileBytes: 40 * 1024, row: 800, criteria: 300, evidence: 250, verdict: 120 })

// 名字列按这些分隔符拆词（与 rules 的验证命令同口径）。
// 括号与空白也拆：`开发（sdet 代拟）` 里的 `sdet` 必须能与另一格的 `sdet` 求交集
// ——否则括起来的自签会漏判（2026-11-05 sdet P1）。通用限定语由下面的 NAME_IGNORE 排除。
const NAME_SPLIT = /[、+＋，,／/（）()\s]+/
// 限定语不是名字：`（主 agent 代拟）` 的 `主` / `agent` / `代拟` 不参与交集。
// 否则申报人「开发（主 agent 代拟）」与签字人「审计（主 agent）」会被拆出公共词 → 误判自签（2026-11-05 审查 P2）。
// 只过滤交集、不过滤「空值」判据：申报人整体写「主 agent」仍算有人填。
const NAME_IGNORE = new Set(['主', 'agent', '代拟', '主持', '转录', '转述'])
const MIN_EVIDENCE = 4 // 「核了什么」字数下限（兜底；主判据是下面的可复算锚点）

// 段表「谁签」列（rules/dev-workflow-mainline.md R2；旁路例外见下）
const SIGNER_ROLE = Object.freeze({
  '①': ['用户'], '②': ['审计'], '②→③': ['审计'], '③': ['审计'], '④': ['sdet'], '⑤': ['用户'],
})

// 「可复算锚点」：证据必须能在不改语境的情况下重跑或回指
//   · 行号锚（`#L12` / `path:12`）
//   · 反引号里的**命令**（首词 + 参数，如 `npm run check`）或**路径**（含扩展名 / `path:line`）
// **`→` 不算锚点**：单独一个箭头会让「已全部核对 → 通过」这类空话照样合格（第 4 轮 sdet P1）；
// **不是所有反引号都算锚点**：`` `已核对` `` 只是把空话加了个壳（2026-11-05 sdet P1）——只认命令或路径。
// **`path:line` 支要求冒号前含字母 / `.` / `/` / `\`**：否则「已核对 2026-10-28 10:30」「已核对 1:1」
// 会把时间串与纯数字比当锚点（第 5 轮审计 P1）。
// **ISO 时间串**（`2026-10-28T10:30`）：`T` 属字母 → 会被 `path:line` 支误当锚点（第 6 轮 P2）。
// 判前先把 ISO 时间串替换成空格再测。
const ISO_TS_RE = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/g
const PATH_LINE_RE = /[^\s:：]*[A-Za-z_./\\][^\s:：]*:\d+/
const LINE_ANCHOR_RE = /#L\d+/
const BACKTICK_RE = /`([^`]+)`/g
const PATH_LIKE_RE = /^[^\s:：]+\.(?:md|mjs|cjs|js|json|ts|tsx|txt|ya?ml)(?::\d+)?$/
// 命令锚点只认仓内真会跑的**首词**：否则反引号里的输出文案（`` `check 全部通过` ``）也算锚点，
// R1 就被「英文词 + 空格」这一形态整片放宽（2026-11-05 审查 P2）。
const CMD_FIRST_WORDS = new Set(['npm', 'node', 'npx', 'pnpm', 'yarn', 'git', 'deno', 'bun', 'python', 'pwsh', 'powershell'])
const CMD_SHAPE_RE = /^([a-z][a-z0-9._-]*)\s+\S/
const isRecomputableBacktick = (v) => {
  const t = v.trim()
  if (PATH_LIKE_RE.test(t)) return true
  const m = CMD_SHAPE_RE.exec(t)
  return Boolean(m) && CMD_FIRST_WORDS.has(m[1])
}
const hasAnchor = (s) => {
  const t = String(s).replace(ISO_TS_RE, ' ')
  if (LINE_ANCHOR_RE.test(t) || PATH_LINE_RE.test(t)) return true
  for (const m of t.matchAll(BACKTICK_RE)) if (isRecomputableBacktick(m[1])) return true
  return false
}

// 段值白名单：六种字面值 + 可选 `@批次` 后缀。`②→③` 必须排在 `②` 之前，否则首字符会被误当 ②。
const SEG_RE = /^(①|②→③|②|③|④|⑤)(@[^\s|]+)?$/
const LATER_SEGS = new Set(['②→③', '③', '④', '⑤'])

const cellsOf = (line) => splitRow(line)
const isSeparator = (cells) => cells.length > 0 && cells.every((c) => /^:?-{3,}:?$/.test(c))
const isHeader = (cells) => cells[0] === '段' && cells[3] === '申报人'
// 占位行按**首格**判：整行任一处出现 `[[` 就把真实行丢掉，会让「证据里含 `[[wiki]]`」的行静默漏核（2026-11-05 sdet P0）
const isPlaceholder = (cells) => /^\[\[.+\]\]$/.test(String(cells[0] ?? '').trim())
const names = (s) => String(s ?? '').split(NAME_SPLIT).map((x) => x.trim()).filter(Boolean)
// 旁路标记只认**结论列**：出口判据里描述「不得事后追认旁路」这类规则文本不是本行的旁路标注，
// 混进来会把正常 ① 行的签字人要求从「用户」改判成「审计」（2026-11-05 审查 P2）。
const mentionsBypass = (cells) => String(cells[5] ?? '').includes('旁路')
export const baseSeg = (s) => SEG_RE.exec(String(s ?? '').trim())?.[1] ?? null

/**
 * 解析并判定一份 gate-record 正文。
 * @returns {{rows: number, splitting: number, reasons: string[], rowsWithIssues: object[], fileIssues: string[]}}
 */
export function checkGateRecord(text) {
  const lines = String(text ?? '').split(/\r?\n/)
  const reasons = []
  const rowsWithIssues = []
  const fileIssues = []
  const data = []

  // 围栏内的表格是示例，不是签字行；未闭合围栏会把其后全部吞掉 → 判红（否则整份静默跳过）
  const { mask, unclosedLine } = fenceMask(lines)
  const headerAt = (i) => !mask[i] && isHeader(cellsOf(lines[i].trim()))
  let headerIdx = -1
  for (let i = 0; i < lines.length; i += 1) if (headerAt(i)) { headerIdx = i; break }
  if (headerIdx < 0) {
    fileIssues.push('表头缺失：需 6 列，首格 `段`、第 4 格 `申报人`')
    return { rows: 0, splitting: 0, reasons: fileIssues, rowsWithIssues, fileIssues }
  }
  if (unclosedLine) fileIssues.push(`第 ${unclosedLine} 行：围栏未闭合（其后内容按代码块跳过，签字行会被静默漏核）`)

  // 表从表头起算；遇非表格行即结束（下一张表必须自带同样的表头才继续收行）。
  // 表外出现的六列「段值」行 = 孤行（表被截断或贴错位置）→ 判红，不再静默跳过（2026-11-05 sdet P0）。
  let inTable = true
  for (let i = headerIdx + 1; i < lines.length; i += 1) {
    if (mask[i]) { inTable = false; continue }
    const line = lines[i].trim()
    if (!line.startsWith('|')) { inTable = false; continue }
    const cells = cellsOf(line)
    if (inTable) {
      if (isSeparator(cells) || isPlaceholder(cells)) continue // 分隔行与模板占位行不计数据行
      if (isHeader(cells)) continue // 第二张签字表的表头
      data.push({ line, cells, lineNo: i + 1 })
      continue
    }
    if (isHeader(cells)) { inTable = true; continue }
    if (cells.length === 6 && baseSeg(cells[0])) {
      fileIssues.push(`第 ${i + 1} 行：六列签字行不在表头之下（表被非表格行截断或贴错表）`)
    }
  }

  data.forEach(({ line, cells, lineNo }, i) => {
    const at = `第 ${i + 1} 条数据行（:${lineNo}，段=${cells[0] ?? ''}）`
    const issues = []
    if (cells.length !== 6) issues.push(`${at}：列数 ${cells.length} ≠ 6`)
    if (line.length > LIMITS.row) issues.push(`${at}：整行 ${line.length} 字符 > ${LIMITS.row}`)
    if ([...String(cells[1] ?? '').trim()].length > LIMITS.criteria) issues.push(`${at}：出口判据 ${[...cells[1].trim()].length} 字符 > ${LIMITS.criteria}`)
    const evidence = cells[2] ?? ''
    if (!evidence.trim()) issues.push(`${at}：「核了什么」为空（R1）`)
    else if (!hasAnchor(evidence)) issues.push(`${at}：「核了什么」无可复算锚点（R1，「${evidence.trim().slice(0, 20)}」）`)
    else if ([...evidence.trim()].length < MIN_EVIDENCE) issues.push(`${at}：「核了什么」过短（R1，只写「${evidence}」）`)
    else if ([...evidence.trim()].length > LIMITS.evidence) issues.push(`${at}：「核了什么」${[...evidence.trim()].length} 字符 > ${LIMITS.evidence}`)
    const verdict = cells[5] ?? ''
    if (!verdict.trim() || verdict.trim() === '—') issues.push(`${at}：结论为空（R3 / 表口径「留空 = 未收口」）`)
    else if ([...verdict.trim()].length > LIMITS.verdict) issues.push(`${at}：结论 ${[...verdict.trim()].length} 字符 > ${LIMITS.verdict}`)
    const seg = baseSeg(cells[0])
    if (!seg) issues.push(`${at}：段值不在白名单（只认 ${SEGMENTS.join(' / ')}，可带 @批次 后缀）`)
    const a = names(cells[3])
    const b = names(cells[4])
    if (!a.length) issues.push(`${at}：申报人为空（R2）`)
    if (!b.length) issues.push(`${at}：签字人为空（R2）`)
    // 交集只算「名字」：NAME_IGNORE 的通用限定语先剔掉，避免两边带同一限定语就误判自签
    const namedA = a.filter((x) => !NAME_IGNORE.has(x))
    const namedB = b.filter((x) => !NAME_IGNORE.has(x))
    const common = namedA.filter((x) => namedB.includes(x))
    if (a.length && b.length && common.length) {
      issues.push(`${at}：申报人 ∩ 签字人 = ${common.join('、')}（R2 自签）`)
    }
    // R2 角色：签字人须属段表「谁签」列；旁路（①②）的签字人 = 审计，不受该列限制
    if (seg && b.length) {
      const signer = String(cells[4] ?? '')
      const roles = SIGNER_ROLE[seg] ?? []
      if (mentionsBypass(cells) && (seg === '①' || seg === '②')) {
        if (!signer.includes('审计')) issues.push(`${at}：旁路行的签字人须为「审计」（R2）`)
      } else if (roles.length && !roles.some((r) => signer.includes(r))) {
        issues.push(`${at}：签字人「${signer.trim()}」不在段表「谁签」列（R2，${seg} 应为 ${roles.join(' / ')}）`)
      }
    }
    if (issues.length) rowsWithIssues.push({ seg: cells[0] ?? '', issues })
  })

  // R3 阶段门：出现 ②→③ 及之后的行时，①、② 两行必须在位且结论非空；
  // 只有 ① 行（任务刚起）不判——这是合法中间态。有数据行却一条 ① 都没有 → 红（每份账必须从 ① 开始）。
  // 段值可带 `@批次`（同段多行），故**逐行**判，不用 `.find` 只取首行（2026-11-05 审查 P2）。
  const segs = data.map((d) => baseSeg(d.cells[0]))
  if (segs.some((s) => LATER_SEGS.has(s))) {
    for (const need of ['①', '②']) {
      const rows = data.filter((d) => baseSeg(d.cells[0]) === need)
      if (!rows.length) fileIssues.push(`R3：出现 ②→③ 及之后的行，但缺 ${need} 行`)
      else if (rows.some((r) => !(r.cells[5] ?? '').trim() || r.cells[5].trim() === '—')) fileIssues.push(`R3：${need} 行结论为空`)
    }
  }
  if (data.length > 0 && !segs.includes('①')) fileIssues.push('R3：本任务账缺 ① 行（每份签字账至少 1 条 ①）')
  // 计划门不设议会，但必须由审计签字（R3）；同样逐行判
  for (const planRow of data.filter((d) => baseSeg(d.cells[0]) === '②→③')) {
    if (!String(planRow.cells[4] ?? '').includes('审计')) {
      fileIssues.push(`R3：计划门（②→③）行的「签字人」须含「审计」（:${planRow.lineNo}）`)
    }
  }

  // R6：同一任务目录内处于「拆 spec 中」的账行 ≤ 1。
  // 只数「出口判据」与「结论」两列——证据列引用别人的「拆 spec 中」不算本任务状态（2026-11-05 sdet P1）。
  const splitting = data.filter((d) => [d.cells[1], d.cells[5]].some((c) => String(c ?? '').includes('拆 spec 中'))).length
  if (splitting > 1) fileIssues.push(`R6：本任务「拆 spec 中」的账行 ${splitting} 条（应 ≤ 1）`)

  // 单份体积上限
  const bytes = Buffer.byteLength(String(text ?? ''), 'utf8')
  if (bytes > LIMITS.fileBytes) fileIssues.push(`文件 ${bytes} 字节 > ${LIMITS.fileBytes}（长证据外迁到 docs/reports/<批次>-evidence/）`)

  reasons.push(...fileIssues, ...rowsWithIssues.flatMap((x) => x.issues))
  return { rows: data.length, splitting, reasons, rowsWithIssues, fileIssues }
}

/**
 * 扫 `docs/devworkflows/` 下每个任务目录。
 * @returns {{tasks: number, rows: number, bad: number, reasons: string[], tasksDetail: object[]}}
 */
export function checkDir(root = process.cwd(), dir = RECORD_DIR) {
  const abs = resolve(root, dir)
  const reasons = []
  const tasksDetail = []
  if (!existsSync(abs)) {
    reasons.push(`任务目录缺失：${dir}（tasks 0 按 fail-closed 判红）`)
    return { tasks: 0, rows: 0, bad: 1, reasons, tasksDetail }
  }
  // `existsSync` 对「文件」也为真；不判目录就 readdirSync → ENOTDIR 未捕获异常（2026-11-05 审查 P2）
  if (!statSync(abs).isDirectory()) {
    reasons.push(`任务目录不是目录：${dir}（应为目录，tasks 0 按 fail-closed 判红）`)
    return { tasks: 0, rows: 0, bad: 1, reasons, tasksDetail }
  }
  const dirs = readdirSync(abs, { withFileTypes: true }).filter((e) => e.isDirectory())
  if (dirs.length === 0) reasons.push(`任务目录为空：${dir} 下无任务子目录（tasks 0 判红）`)
  let rows = 0
  let bad = dirs.length === 0 ? 1 : 0
  for (const e of dirs) {
    const rel = `${dir}/${e.name}`
    if (!TASK_DIR_RE.test(e.name)) {
      bad += 1
      reasons.push(`${rel}：目录名不合规（应为 YYYYMMDDHHmmss-<任务名>，小写 kebab-case）`)
    }
    const file = join(abs, e.name, RECORD_NAME)
    if (!existsSync(file)) {
      bad += 1
      reasons.push(`${rel}：缺 ${RECORD_NAME}（每个任务目录恰 1 份）`)
      tasksDetail.push({ dir: rel, rows: 0, bad: 1 })
      continue
    }
    const r = checkGateRecord(readFileSync(file, 'utf8'))
    rows += r.rows
    bad += r.rowsWithIssues.length + r.fileIssues.length
    for (const x of r.rowsWithIssues) {
      for (const why of x.issues) reasons.push(`${rel}/${RECORD_NAME}：${why}`)
    }
    for (const why of r.fileIssues) reasons.push(`${rel}/${RECORD_NAME}：${why}`)
    tasksDetail.push({ dir: rel, rows: r.rows, bad: r.rowsWithIssues.length + r.fileIssues.length })
  }
  return { tasks: dirs.length, rows, bad, reasons, tasksDetail }
}

/** R9：技能侧 `references/` 下的 .md 不得装真实签字行（模板与 `[[...]]` 占位行豁免） */
export function checkSkillLedgers(root = process.cwd()) {
  const reasons = []
  const skillsDir = resolve(root, 'skills')
  if (!existsSync(skillsDir)) return reasons
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isSymbolicLink()) continue
      const p = join(dir, e.name)
      if (e.isDirectory()) { walk(p); continue }
      if (!e.name.endsWith('.md')) continue
      // `references/` 的任意深度都算（不只直下）；命中口径同一份（2026-11-05 sdet P2）
      if (!p.split(/[\\/]/).includes('references')) continue
      if (e.name === TEMPLATE_NAME) continue
      const rel = p.slice(resolve(root).length + 1).replace(/\\/g, '/')
      const lines = readFileSync(p, 'utf8').split(/\r?\n/)
      const { mask, unclosedLine } = fenceMask(lines)
      // 与主解析器同口径：未闭合围栏会吞掉其后全部行 → 判红，否则 R9 静默假绿（2026-11-05 审查 P2）
      if (unclosedLine) reasons.push(`R9：${rel}:${unclosedLine} 围栏未闭合（其后内容按代码块跳过，签字行会被静默漏核）`)
      lines.forEach((line, i) => {
        if (mask[i]) return
        const t = line.trim()
        if (!t.startsWith('|')) return
        const cells = cellsOf(t)
        if (isSeparator(cells) || isPlaceholder(cells)) return
        if (isHeader(cells)) reasons.push(`R9：${rel}:${i + 1} 出现签字表头（技能侧不得装任务账）`)
        else if (cells.length === 6) reasons.push(`R9：${rel}:${i + 1} 出现六列签字数据行（技能侧不得装任务账）`)
      })
    }
  }
  walk(skillsDir)
  return reasons
}

function main() {
  const d = checkDir()
  const r9 = checkSkillLedgers()
  const bad = d.bad + r9.length
  console.log(`tasks ${d.tasks} rows ${d.rows} bad ${bad}`)
  const all = [...d.reasons, ...r9]
  if (all.length === 0) {
    console.log(`gate-record ok（tasks ${d.tasks}；R1/R2/R3/R6/R9 + 上限全过）`)
    return 0
  }
  for (const why of all) console.error(`[gate-record] ${why}`)
  return 1
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  process.exitCode = main()
}
