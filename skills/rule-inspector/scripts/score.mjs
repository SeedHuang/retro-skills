import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const SOURCE_TYPES = ['用户当场指令', '评审第 N 轮', '实测/踩坑', '项目约定']
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const DIR_HEADING_HINTS = /笔记|规范|说明|踩坑/   // 目录式标题特征 → 标题「判据式非主题名」0
const REF_MD_RE = /([A-Za-z0-9_-]+\.md)/g          // 跨规则指针
const DOC_DIR_RE = /(?:^|[`"'(\s|])(docs|specs|plans|handoffs|session|assets|references|scripts)[/\\]/  // docs/after/xxx.md 等外部文档引用
const LINE_OVER_LEN = 200                           // 来源行 >200 字符 = 超 2 渲染行

// ---- 冗余度（机械代理，照 criteria.md §2.4 判定列）----
const HISTORY_RE = /合并|补于|补记|历史/            // 无来源行历史叙述：来源行含历史词 → 0
const GUIDE_RE = /^(总之|综上|需要注意的是|换句话说|由此可见)/  // 无空泛引导段：段落以此类词开头 → 0

// ---- 执行力度（机械代理，照 criteria.md §2.4 判定列）----
const POLAR_RE = /禁止|不得|不要|必须|应|要/        // ①极性词
const BAN_RE = /禁止|不得|不要|严禁/                // 禁令类判定：正文有此类词 = 禁令类（④⑤⑥ 适用）
const ACTION_RE = /执行|进行|使用|提交|查看|写|调用|删除|运行|打开|输入|生成|修改|记录/  // ①动作
const VAGUE_RE = /合理处理|适当|认真对待|酌情|妥善处理/  // ②空泛词 → 0
const ENUM_RE = /[A-Za-z0-9_-]+(?:、[A-Za-z0-9_-]+){1,}/ // ②可枚举项（并列列举，如 git add、commit、push）
const SPECIFIC_TOKEN_RE = /(git|npm|tsc|node|文件|目录|命令|脚本|计划|仓库|文档|代码)/  // ②具体对象
const CONDITION_RE = /在[^。；\n]{1,24}(?:时|场景|下|前|后|中)/  // ③「具体类型+条件」标记（如「在 typescript 场景」）
const BROAD_RE = /全部情况|所有情况|任何情况|任何场景/           // ③写「全部情况」→ 0
const COVER_RE = /不因|不豁免|同样禁止|任何来源|不因此/          // ④来源覆盖：声明「不因来源豁免」
const CONFLICT_RE = /以本规则为准|以本条为准|本规则优先|本条优先/  // ⑤冲突裁决
const EXCEPTION_RE = /只有[^。；\n]{1,40}才算/                   // ⑥例外从严：明确「只有…才算」
const LOOSE_RE = /一般|通常|可能允许|宽松/                       // ⑥宽松词 → 0
const TRIGGER_RE = /每次[^。；\n]{0,10}前|落地后|开工时|编辑后|提交前|动手前|操作前|执行前|启动时|写作时/  // ⑦可观测触发信号/时机
const VERIFY_RE = /验证|自检|检查点|报告|自查|检查是否|确认遵守|复核|核销|跑一遍|体检/  // ⑧验证闭环：定义「怎么确认遵守了」

// ---- 标题（机械代理）----
const H3_DECO_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2B50}\u{FE0F}\u{2300}-\u{23FF}\u{25A0}-\u{25FF}\u{2700}-\u{27BF}\u{2190}-\u{21FF}\u{2B05}-\u{2B07}★☆◆●■▲▶✔✗‼❓❕❗⚠]/u  // H3 无 emoji/装饰符号
// 反映关键前提：正文与标题各自检测「明确前提」标记（在…时/前/下/中、除非、仅限、未…时/前、提交前/编辑前等），不一致（正文有标题没有，或反之）→ 0
const PRECONDITION_BODY_RE = /在[^。；\n]{1,24}(?:时|前|下|中)|除非|仅限|未[^。；\n]{0,12}(?:前|时)|(?:提交|编辑|落地|发布|部署|执行|操作|写|启动)前/
const PRECONDITION_TITLE_RE = /在[^。；\n]{1,24}(?:时|前|下|中)|除非|仅限|未[^。；\n]{0,12}(?:时|前)|(?:提交|编辑|落地|发布|部署|执行|操作|写|启动)前/
const OBJECT_HINT_RE = /(git|npm|文件|目录|命令|规则|文档|代码|提交|操作|组件|接口|数据|仓库|写操作)/  // 标题对象词（一致性检查用）

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

function h3HasDeco(text) {
  for (const line of text.split(/\r?\n/)) {
    if (line.trim().startsWith('### ') && H3_DECO_RE.test(line)) return true
  }
  return false
}

// 无完全重复句：正文（去标题/来源行）按句号分句，去重后同句 ≥2 次 → true
function hasDuplicateSentence(body) {
  const seen = new Set()
  for (const raw of body.split(/[。；！？\n]/)) {
    const s = raw.trim()
    if (!s) continue
    if (seen.has(s)) return true
    seen.add(s)
  }
  return false
}

// 无空泛引导段：任意段落以「总之/综上/需要注意的是/换句话说/由此可见」开头 → true
function hasGuideOpening(body) {
  for (const para of body.split(/\r?\n+/)) {
    const t = para.trim()
    if (t && GUIDE_RE.test(t)) return true
  }
  return false
}

// ②动作内容具体：对象是可枚举项或具体描述；含空泛词（合理处理/适当类）→ 不具体
function actionSpecific(body) {
  if (VAGUE_RE.test(body)) return false
  return ENUM_RE.test(body) || SPECIFIC_TOKEN_RE.test(body)
}

// 跨规则指针：正文引用的规则文件名必须在 rulesDir 存在（照旧 D5 逻辑，改为 1 检查点）
function crossRuleMiss(text, rulesDir, name) {
  const ruleNames = new Set(readdirSync(rulesDir).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, '')))
  const refs = new Set()
  for (const m of text.matchAll(REF_MD_RE)) {
    const raw = m[1]
    if (/[/\\]/.test(raw) || (m.index > 0 && /[/\\]/.test(text[m.index - 1]))) continue
    const before = text.slice(Math.max(0, m.index - 120), m.index)
    if (DOC_DIR_RE.test(before)) continue
    const stem = raw.replace(/\.md$/, '')
    if (/^xxx-/.test(stem) || stem === 'SKILL' || stem === 'README') continue
    refs.add(stem)
  }
  for (const rn of ruleNames) if (rn && rn !== name.replace(/\.md$/, '') && text.includes(rn)) refs.add(rn)
  return [...refs].filter(r => r !== name.replace(/\.md$/, '') && !ruleNames.has(r))
}

/**
 * 按 criteria.md §2.4 的 24 检查点逐项判定（每项 1 分）。
 * opts.triCheckDone: 三检验报告是否已做（AI 侧语义判断，脚本无法复算；默认 false）
 * 返回 { name, lines, chars, groups, total, max, rate, level, findings }
 * 输出字符串全局规避「判据」「建议删除」（Task 4/7 有 grep 越界检查），标题检查点用安全别名。
 */
export function scoreFile(filePath, rulesDir, opts = {}) {
  const raw = readFileSync(filePath, 'utf8')
  const text = stripBom(raw)
  const lines = text.replace(/\r?\n$/, '').split(/\r?\n/).length
  const chars = text.length
  const name = filePath.split(/[\\/]/).pop()
  const h = parseHeader(text)
  const title = text.match(/^# (.+)$/m)?.[1] ?? ''
  const lineArr = text.replace(/\r?\n$/, '').split(/\r?\n/)
  const body = lineArr.filter(l => !l.trim().startsWith('#') && !l.trim().startsWith('> 来源')).join('\n')

  const findings = []
  const groups = {}
  // 注册一个检查点：pass → 该组 +1 分；fail → 记一条 finding
  const g = (gname, check, pass, msg, recipe) => {
    groups[gname] ??= { score: 0, max: 0 }
    groups[gname].max += 1
    if (pass) groups[gname].score += 1
    else findings.push({ group: gname, check, msg, recipe })
  }

  // ── 头部规范（3）──
  g('头部规范', '来源行三字段（类型/日期/落地）', h.hasSource && h.hasType && h.hasDate && h.hasLanding,
    '来源行缺「来源：类型（日期）」或「落地」字段', '补全来源行三字段：类型（日期）+ 落地')
  g('头部规范', '来源类型在枚举内', h.hasType && SOURCE_TYPES.includes(h.type),
    '来源类型不在枚举内（用户当场指令/评审第 N 轮/实测踩坑/项目约定）', '来源类型改为枚举内四类之一')
  g('头部规范', '来源行不错位', h.inHead,
    '来源行不在头部前 10 行内', '来源行移到文件头部（前 10 行内）')

  // ── 层级规范（2）──
  const h1Count = (text.match(/^# /gm) ?? []).length
  g('层级规范', 'H1 唯一', h1Count === 1,
    `H1 标题出现 ${h1Count} 次`, '全文只保留一个 `# 标题`')
  g('层级规范', 'H3 无 emoji', !h3HasDeco(text),
    'H3 标题含 emoji/装饰符号', '移除 H3 标题中的 emoji/装饰符号')

  // ── 来源精简（2）──
  g('来源精简', '来源行 ≤2 渲染行', h.len <= LINE_OVER_LEN,
    `来源行超长（${h.len} 字符 > 200）`, '压缩来源行到 ≤200 字符（约 2 渲染行）')
  g('来源精简', '无原话引用', !h.hasQuote,
    '来源行含用户原话引用（引号内）', '来源行去掉引号内原话，改为转述')

  // ── 引用完整（1）──
  const miss = crossRuleMiss(text, rulesDir, name)
  g('引用完整', '跨规则指针有效', miss.length === 0,
    `失效指针：${miss.join('、')}`, '补全引用的规则文件，或移除该引用')

  // ── 冗余度（4）──
  g('冗余度', '无完全重复句', !hasDuplicateSentence(body),
    '正文存在完全重复的句子', '合并或删除重复句，保留一处')
  g('冗余度', '无空泛引导段', !hasGuideOpening(body),
    '段落以「总之/综上/需要注意的是」等空泛引导词开头', '删除空泛引导段，直接写结论')
  g('冗余度', '无来源行历史叙述', !HISTORY_RE.test(h.sourceLine),
    '来源行含「合并/补于/补记」等历史叙述', '来源行去掉历史叙述词')
  g('冗余度', '三检验报告已做', !!opts.triCheckDone,
    '三检验报告未做（AI 侧）', '由 AI 逐段做三检验并写报告；报告必须做')

  // ── 执行力度（禁令类 8 / 非禁令类 5：④⑤⑥ 仅禁令类计分）──
  const isBan = BAN_RE.test(body)
  g('执行力度', '①极性明确', POLAR_RE.test(body) && ACTION_RE.test(body),
    '正文无极性词（禁止/不得/不要/必须/应/要）或动作', '补极性词 + 明确动作')
  g('执行力度', '②动作内容具体', actionSpecific(body),
    '动作对象空泛（合理处理/适当类）或无具体对象', '动作对象改为可枚举项或具体描述')
  g('执行力度', '③适用条件精细', CONDITION_RE.test(body) && !BROAD_RE.test(body),
    '适用条件缺失或写「全部情况」', '条件精确到「具体类型+条件」（如「在 typescript 场景」）')
  if (isBan) {
    g('执行力度', '④来源覆盖（禁令类）', COVER_RE.test(body),
      '未声明「不因来源豁免」', '补「防掠过」小节：不因计划/子代理/脚本/工具模板豁免')
    g('执行力度', '⑤冲突裁决（禁令类）', CONFLICT_RE.test(body),
      '未声明冲突时以本规则为准', '补「冲突裁决」小节：与具体指令/模板冲突时以本规则为准')
    g('执行力度', '⑥例外从严（禁令类）', EXCEPTION_RE.test(body) && !LOOSE_RE.test(body),
      '例外条件不明确或含宽松词（一般/通常/可能允许）', '例外写「只有…才算」且无宽松词')
  }
  g('执行力度', '⑦触发机制', TRIGGER_RE.test(body),
    '无可观测触发信号/时机', '补「触发时机」小节（落地后/开工时/编辑后）')
  g('执行力度', '⑧验证闭环', VERIFY_RE.test(body),
    '未定义怎么确认遵守了', '补「验证」小节：自检命令/检查点/报告要求')

  // ── 标题（4）──
  // ①判据式非主题名：标题含极性词且无目录式特征词（笔记/规范/说明/踩坑）→ 一句话可执行规则
  const titlePolar = POLAR_RE.test(title)
  g('标题', '标题为一句可执行规则（非主题名）', titlePolar && !DIR_HEADING_HINTS.test(title),
    '标题是主题名（非一句话可执行规则）', '改写标题为含极性+动作+对象的一句话规则')
  // ②含极性 + 动作 + 对象：标题同时有极性词、动作词、对象词
  g('标题', '含极性 + 动作 + 对象', titlePolar && ACTION_RE.test(title) && OBJECT_HINT_RE.test(title),
    '标题缺极性/动作/对象', '标题含「禁止/必须/不得」+ 动作 + 对象')
  // ③反映关键前提：正文有明确前提 → 标题必须体现（机械代理：正文/标题各自检测前提标记，不一致 = 漏）
  const bodyPre = PRECONDITION_BODY_RE.test(body)
  const titlePre = PRECONDITION_TITLE_RE.test(title)
  g('标题', '反映关键前提', bodyPre === titlePre,
    '内容有明确前提但标题未体现', '标题体现关键前提（如「在沟通中」）')
  // ④标题 ↔ 内容一致性：标题的极性词与对象词都出现在正文（机械代理）
  const titlePolarWord = title.match(/禁止|不得|不要|必须|应|要/)?.[0] ?? ''
  const titleObject = title.match(OBJECT_HINT_RE)?.[0] ?? ''
  const consistent = titlePolarWord !== '' && body.includes(titlePolarWord) && titleObject !== '' && body.includes(titleObject)
  g('标题', '标题 ↔ 内容一致性', consistent,
    '标题与正文范围/极性/对象不一致', '收尾对照三句：①范围 ②极性 ③对象 与正文一致')

  // ── 汇总 ──
  const total = Object.values(groups).reduce((a, grp) => a + grp.score, 0)
  const max = Object.values(groups).reduce((a, grp) => a + grp.max, 0)
  const rate = max === 0 ? 0 : total / max
  const level = rate >= 0.9 ? '健康' : rate >= 0.7 ? '预警' : '不及格'
  return { name, lines, chars, groups, total, max, rate, level, findings }
}

function median(nums) {
  const s = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

export function scoreDir(dir, opts = {}) {
  const files = readdirSync(dir).filter(f => f.endsWith('.md')).sort()
  // 先算全库单条行数中位数（作为体积基线，参考维度），再逐文件评分
  const lineCounts = files.map(f => {
    const t = stripBom(readFileSync(join(dir, f), 'utf8'))
    return t.replace(/\r?\n$/, '').split(/\r?\n/).length
  })
  const medianLines = median(lineCounts)
  const scored = files.map(f => scoreFile(join(dir, f), dir, opts))
  const linesTotal = scored.reduce((a, f) => a + f.lines, 0)
  const charsTotal = scored.reduce((a, f) => a + f.chars, 0)
  const currentBaseline = { totalLines: linesTotal, medianLines, x1_5: Math.round(linesTotal * 1.5 * 10) / 10 }
  let previous = null, diff = null
  if (opts.baselineFile) {
    const prev = JSON.parse(readFileSync(opts.baselineFile, 'utf8'))
    previous = prev.totals ?? prev.currentBaseline
    diff = { lines: linesTotal - previous.lines, chars: charsTotal - previous.chars }
  }
  const total = Math.round(scored.reduce((a, f) => a + f.total, 0) / Math.max(1, scored.length))
  const rate = scored.reduce((a, f) => a + f.rate, 0) / Math.max(1, scored.length)
  const level = rate >= 0.9 ? '健康' : rate >= 0.7 ? '预警' : '不及格'
  const out = { dir, measuredAt: new Date().toISOString().slice(0, 10), totals: { files: scored.length, lines: linesTotal, chars: charsTotal }, currentBaseline, previous, diff, files: scored, total, rate, level }
  return out
}

export function cli(argv = process.argv.slice(2)) {
  const args = { dir: 'D:\\Seed\\my-rules\\rules', json: false, triCheck: false, baselineFile: null }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dir') args.dir = argv[++i]
    else if (argv[i] === '--json') args.json = true
    else if (argv[i] === '--tri-check') args.triCheck = true
    else if (argv[i] === '--baseline') args.baselineFile = argv[++i]
  }
  if (!existsSync(args.dir)) { console.error(`目录不存在：${args.dir}`); process.exit(1) }
  if (args.baselineFile && !existsSync(args.baselineFile)) { console.error(`基线文件不存在：${args.baselineFile}，先不带 --baseline 跑一次`); process.exit(1) }
  const out = scoreDir(args.dir, { baselineFile: args.baselineFile, triCheckDone: args.triCheck })
  console.log(args.json ? JSON.stringify(out, null, 2) : `共 ${out.totals.files} 文件 / ${out.totals.lines} 行 / ${out.totals.chars} 字符，平均得分率 ${Math.round(out.rate * 100)}%（${out.level}）`)
}

// 仅当作为命令行直接运行时才执行 CLI（import 进测试/其他模块时不触发）
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) cli()
