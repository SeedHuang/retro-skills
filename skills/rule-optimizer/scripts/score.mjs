import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const SOURCE_TYPES = ['用户当场指令', '评审第 N 轮', '实测/踩坑', '项目约定']
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const DIR_HEADING_HINTS = /笔记|规范|说明|踩坑/   // 目录式标题特征（D4）
const REF_MD_RE = /([A-Za-z0-9_-]+\.md)/g          // 跨规则指针（D5）
const BASELINE_X15 = 1.5
const LINE_OVER_LEN = 200                           // 来源行 >200 字符 = 超 2 渲染行（D3）
const DOC_DIR_RE = /(?:^|[`"'(\s|])(docs|specs|plans|handoffs|session|assets|references|scripts)[/\\]/  // D5 文档路径前缀（docs/after/xxx.md 等外部文档引用）

function stripBom(s) { return s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s }

function parseHeader(text) {
  // 找 `> 来源：` 行；判断错位（是否出现在前 10 行之外 → 错位在文末）
  const lines = text.split(/\r?\n/)
  const idx = lines.findIndex(l => l.trim().startsWith('> 来源：'))
  const sourceLine = idx >= 0 ? lines[idx] : ''
  return {
    sourceLine, inHead: idx >= 0 && idx < 10, idx,
    hasSource: idx >= 0,
    hasType: SOURCE_TYPES.some(t => sourceLine.includes(t)),
    hasDate: DATE_RE.test(sourceLine.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? ''),
    hasLanding: sourceLine.includes('落地'),
    hasQuote: /「|」|"|'/.test(sourceLine.replace(/来源：.*?（\d{4}-\d{2}-\d{2}）/, '')),
    len: sourceLine.length,
    type: SOURCE_TYPES.find(t => sourceLine.includes(t)) ?? null,
  }
}

export function scoreFile(filePath, rulesDir, medianLines = 25) {
  const raw = readFileSync(filePath, 'utf8')
  const text = stripBom(raw)
  const lines = text.replace(/\r?\n$/, '').split(/\r?\n/).length
  const chars = text.length
  const name = filePath.split(/[\\/]/).pop()
  const h = parseHeader(text)
  const h1 = text.match(/^# (.+)$/m)?.[1] ?? ''

  // D1 头部规范：三字段齐全(来源类型/日期/落地) + 类型在枚举 + 日期合法 = 20；缺必填 −10；来源行错位文末 −5
  let D1 = 20
  if (!h.hasSource) D1 = 0                      // 无来源行 = 0（三字段全缺）
  else {
    if (!h.hasType || !h.hasDate || !h.hasLanding) D1 -= 10
    if (h.hasType && SOURCE_TYPES.includes(h.type)) {} else D1 -= 10
    if (!DATE_RE.test(h.sourceLine.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? '')) D1 -= 10
    if (!h.inHead) D1 -= 5                       // 错位在文末
  }

  // D2 层级规范：H1 唯一；核心判据不由加粗承载（跳过引用行后首个正文段是裸加粗 = 违规，如 global-ask-before-acting）；H3 无 emoji
  let D2 = 20
  if ((text.match(/^# /gm) ?? []).length !== 1) D2 -= 5
  const bodyNoQuote = text.replace(/^# .+\n/, '').split(/\r?\n/).filter(l => !l.trim().startsWith('>')).join('\n')
  if (/^\*\*[^*]+\*\*/.test(bodyNoQuote.trim())) D2 -= 5
  if (/(^|\n)### .*[^\w\s，。：:（）()\-—_]/.test(text)) D2 -= 5   // H3 含 emoji/装饰符号

  // D3 来源精简：来源行 >200 字符即视为超 2 渲染行（spec §3.1 锚点），每多约 80 字符多 1 行，每行 −3；含原话引用 −5
  let D3 = 20
  if (h.hasSource) {
    if (h.len > LINE_OVER_LEN) {
      const extraRows = Math.ceil((h.len - LINE_OVER_LEN) / 80) + 1
      D3 -= 3 * extraRows
    }
    if (h.hasQuote) D3 -= 5
  } else D3 = 0

  // D4 体积健康：H1 是判据（非目录式）= 20；目录式标题 = 0；超单条基线×1.5 → findings 提示（不计分，criteria §7）
  let D4 = DIR_HEADING_HINTS.test(h1) ? 0 : 20
  const findings = []

  // D5 引用完整：跨规则指针 = 正文出现的「规则名（不带 .md，用 rulesDir 文件名集合匹配）」或「不带路径分隔符的纯文件名 .md 引用」，必须在 rulesDir 存在
  let D5 = 20
  const ruleNames = new Set(readdirSync(rulesDir).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, '')))
  const refs = new Set()
  for (const m of text.matchAll(REF_MD_RE)) {
    const raw = m[1]
    // 捕获组只含文件名，带路径与否看匹配位置前一字符：docs/after/xxx.md 的 m[0] 前紧邻 '/' → 外部文档，不是规则指针
    if (/[/\\]/.test(raw) || (m.index > 0 && /[/\\]/.test(text[m.index - 1]))) continue
    // 文档路径前缀：REF_MD_RE 捕获组不含路径，用「匹配位置前的文本」判断 token 是否带 docs/specs/plans/handoffs/.session/assets/references/scripts 目录前缀（如 docs/after/xxx.md 的 m.index 前一段含 docs/）
    const before = text.slice(Math.max(0, m.index - 120), m.index)
    if (DOC_DIR_RE.test(before)) continue
    // 模板占位 / 非规则文件名：xxx- 开头、SKILL、README 不算规则指针
    const stem = raw.replace(/\.md$/, '')
    if (/^xxx-/.test(stem) || stem === 'SKILL' || stem === 'README') continue
    refs.add(stem)
  }
  for (const rn of ruleNames) if (rn && rn !== name.replace(/\.md$/, '') && text.includes(rn)) refs.add(rn)
  const miss = [...refs].filter(r => r !== name.replace(/\.md$/, '') && !ruleNames.has(r))
  if (miss.length) D5 -= 5 * miss.length
  D5 = Math.max(0, D5)                       // D5 下限 0，避免扣成负数

  const total = D1 + D2 + D3 + D4 + D5
  const level = total >= 90 ? '健康' : total >= 70 ? '预警' : '超标'
  if (D1 < 20) findings.push({ dim: 'D1', msg: `头部不规范（来源行：${h.hasSource ? '有' : '无'}）`, recipe: '见 references/recipes.md §R2/§R3' })
  if (D3 < 20) findings.push({ dim: 'D3', msg: `来源行超长（${h.len} 字符）`, recipe: '见 references/recipes.md §R1' })
  if (D4 === 0) findings.push({ dim: 'D4', msg: `标题「${h1}」含目录式特征词（笔记/规范/说明/踩坑），D4 计 0`, recipe: '见 references/recipes.md §R4' })
  if (lines > medianLines * BASELINE_X15) findings.push({ dim: 'D4', msg: `体积超单条基线（${lines} 行 > 中位数 ${medianLines}×1.5），需人工冗余审查`, recipe: '见 references/recipes.md §R1' })
  if (miss.length) findings.push({ dim: 'D5', msg: `失效指针：${miss.join('、')}`, recipe: '见 references/criteria.md §3 检验#3' })

  return { name, lines, chars, scores: { D1, D2, D3, D4, D5 }, total, level, findings }
}

function median(nums) {
  const s = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

export function scoreDir(dir, opts = {}) {
  const files = readdirSync(dir).filter(f => f.endsWith('.md')).sort()
  // 先算全库单条行数中位数（criteria §6.1：单条行数基线），再传给每个 scoreFile 做超基线提示
  const lineCounts = files.map(f => {
    const t = stripBom(readFileSync(join(dir, f), 'utf8'))
    return t.replace(/\r?\n$/, '').split(/\r?\n/).length
  })
  const medianLines = median(lineCounts)
  const scored = files.map(f => scoreFile(join(dir, f), dir, medianLines))
  const linesTotal = scored.reduce((a, f) => a + f.lines, 0)
  const charsTotal = scored.reduce((a, f) => a + f.chars, 0)
  const currentBaseline = { totalLines: linesTotal, medianLines, x1_5: Math.round(linesTotal * BASELINE_X15 * 10) / 10 }
  let previous = null, diff = null
  if (opts.baselineFile) {
    const prev = JSON.parse(readFileSync(opts.baselineFile, 'utf8'))
    previous = prev.totals ?? prev.currentBaseline
    diff = { lines: linesTotal - previous.lines, chars: charsTotal - previous.chars }
  }
  const total = Math.round(scored.reduce((a, f) => a + f.total, 0) / Math.max(1, scored.length))
  const level = total >= 90 ? '健康' : total >= 70 ? '预警' : '超标'
  const out = { dir, measuredAt: new Date().toISOString().slice(0, 10), totals: { files: scored.length, lines: linesTotal, chars: charsTotal }, currentBaseline, previous, diff, files: scored, total, level }
  return out
}

export function cli(argv = process.argv.slice(2)) {
  const args = { dir: 'D:\\Seed\\my-rules\\rules', json: false, baselineFile: null }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dir') args.dir = argv[++i]
    else if (argv[i] === '--json') args.json = true
    else if (argv[i] === '--baseline') args.baselineFile = argv[++i]
  }
  if (!existsSync(args.dir)) { console.error(`目录不存在：${args.dir}`); process.exit(1) }
  if (args.baselineFile && !existsSync(args.baselineFile)) { console.error(`基线文件不存在：${args.baselineFile}，先不带 --baseline 跑一次`); process.exit(1) }
  const out = scoreDir(args.dir, { baselineFile: args.baselineFile })
  console.log(args.json ? JSON.stringify(out, null, 2) : `共 ${out.totals.files} 文件 / ${out.totals.lines} 行 / ${out.totals.chars} 字符，平均分 ${out.total}（${out.level}）`)
}

// 仅当作为命令行直接运行时才执行 CLI（import 进测试/其他模块时不触发）
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) cli()
