import { readFileSync, readdirSync, existsSync, realpathSync } from 'node:fs'
import { join, dirname, resolve, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const SOURCE_TYPES = ['用户当场指令', '评审第 N 轮', '实测/踩坑', '项目约定']
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const DIR_HEADING_HINTS = /笔记|规范|说明|踩坑/   // 目录式标题特征 → 标题「判据式非主题名」0
const REF_MD_RE = /([A-Za-z0-9_-]+\.md)/g          // 跨规则指针
const DOC_DIR_RE = /(?:^|[`"'(\s|])(docs|specs|plans|handoffs|session|assets|references|scripts)[/\\]/  // docs/after/xxx.md 等外部文档引用
const LINE_OVER_LEN = 200                           // 来源行 >200 字符 = 超 2 渲染行

// ---- 冗余度（机械代理，照 criteria.md §2.4 判定列）----
const HISTORY_RE = /合并|补于|补记|历史/            // 无来源行历史叙述：来源行含历史词 → 0
const GUIDE_RE = /^(总之|综上|需要注意的是|换句话说|由此可见)/  // 无空泛引导段：段落以此类词开头 → 0

// ---- 执行力度（机械代理，照 criteria.md §2.4/§3.4 判定列）----
const TYPE_KEYS = ['持续适用', '条件触发', '模式门控', '待拆未定']
const POLAR_RE = /禁止|不得|不要|必须|应|要/        // ①极性词
const BAN_RE = /禁止|不得|不要|严禁/                // 禁令类判定：正文有此类词 = 禁令类（④⑤⑥ 适用）
const ACTION_RE = /执行|进行|使用|提交|查看|写|调用|删除|运行|打开|输入|生成|修改|记录/  // ①动作
const VAGUE_RE = /合理处理|适当|认真对待|酌情|妥善处理/  // ②空泛词 → 0
const ENUM_RE = /[A-Za-z0-9_-]+(?:、[A-Za-z0-9_-]+){1,}/ // ②可枚举项（并列列举，如 git add、commit、push）
const SPECIFIC_TOKEN_RE = /(git|npm|tsc|node|文件|目录|命令|脚本|计划|仓库|文档|代码)/  // ②具体对象
// ③⑦ 判定口径（按类型；安全别名规避「判据」「建议删除」）
const COND_RE = /在[^。；\n]{1,24}(?:时|场景|下|前|后|中)|当[^。；\n]{1,20}(?:时|后)/      // 条件触发 ③
const MODE_COND_RE = /只适用于[^。；\n]{1,30}(?:的时刻|的场景|的情形)|当[^。；\n]{1,20}时(?:进入|处于|设为)?[^。；\n]{0,8}模式/ // 模式门控 ③（模式归属条件可判定）
const BROAD_RE = /全部情况|所有情况|任何情况|任何场景/           // ③写「全部情况」→ 0
const TRIG_RE = /落地后|开工时|编辑后|提交前|动手前|操作前|执行前|启动时|每次[^。；\n]{0,10}前/ // 条件触发 ⑦
const MODE_TRIG_RE = /由[^。；\n]{0,24}控制|回到[^。；\n]{0,8}模式/                        // 模式门控 ⑦（切换信号可观测；「重新适用」是返回语义非可观测信号，归 M4）
const COVER_RE = /不因|不豁免|同样禁止|任何来源|不因此/          // ④来源覆盖：声明「不因来源豁免」
const CONFLICT_RE = /以本规则为准|以本条为准|本规则优先|本条优先/  // ⑤冲突裁决
const EXCEPTION_RE = /只有[^。；\n]{1,40}才算/                   // ⑥例外从严：明确「只有…才算」
const LOOSE_RE = /一般|通常|可能允许|宽松/                       // ⑥宽松词 → 0
const VERIFY_RE = /验证|自检|检查点|报告|自查|检查是否|确认遵守|复核|核销|跑一遍|体检/  // ⑧验证闭环：定义「怎么确认遵守了」
// ---- 执行保障（X1/X2/X3）：认知动作的产物/必经路径/触发前置声明 ----
// ⚠️ 判据权威 = references/criteria.md §3.3b（含封闭词表全文）；本区是机械执行体，词表改动须与 criteria 同批。
// X1 产物模式：字面词 + 「引用名」块/节/表 形态（如「全貌确认」块）。
//   旧字面词表含「确认块」曾与定稿文本「全貌确认」块脱节（R12 P0-α）——匹配不上的判据会把对的规则判红，已改模式匹配。
const PRODUCT_RE = /产物|清单|报告|spec|输出块|「[^」]{2,12}」(?:块|节|表)/
// X1 去处动词（「随」不入表：「随任务记录可查」是「声称有落点实际无锚点」的原型，必须判红）
const PRODUCT_VERB_RE = /写进|落到|记入|落盘|挂进|绑进/
// X1 去处载体词（对话类产物不可文件断言，封闭词表认可；「任务记录」不入表——无锚点）
const CARRIER_RE = /回复|回答|报告|commit body|账本|对话记录/
// X2 绑定动词
const BIND_VERB_RE = /挂进|绑进|写进|落到|核销/
// 反引号仓内路径（.md/.mjs）。占位符（<…>）与 ~ 开头路径不断言（spec §7 风险 2）
const PATH_RE = /`([^`\n]{1,200}\.(?:md|mjs))`/g

// 全部无占位符反引号路径（fail-closed：任何一个不存在 = 声称了假落点）
function extractPaths(text) {
  const out = []
  for (const m of text.matchAll(PATH_RE)) {
    const p = m[1]
    if (p.includes('<') || p.startsWith('~') || p.includes('*')) continue
    out.push({ raw: p, index: m.index })
  }
  return out
}
function pathExists(p) {
  try { return existsSync(resolve(p)) } catch { return false }
}
// 句 = 按 。；\n 切分（spec §4.1 窗口语义）；成对 = 同句或相邻句
function sentences(text) { return text.split(/[。；\n]/) }

// X1：产物模式 + 去处动词 + 去处（载体词 或 仓内路径存在）在窗口内成对
function x1ProductLanding(body) {
  // 公共前置：任何声明的落点路径都必须存在（多路径 all-exist，spec §4.2）
  const allPaths = extractPaths(body)
  const bad = allPaths.find(p => !pathExists(p.raw))
  if (bad) return { ok: false, why: `声称的落点路径不存在：${bad.raw}` }
  const ss = sentences(body)
  for (let i = 0; i < ss.length; i++) {
    const win = i + 1 < ss.length ? ss[i] + '。' + ss[i + 1] : ss[i]
    if (!PRODUCT_RE.test(win) || !PRODUCT_VERB_RE.test(win)) continue
    if (CARRIER_RE.test(win)) return { ok: true, why: '' }
    if (extractPaths(win).length > 0) return { ok: true, why: '' }
  }
  return { ok: false, why: '产物与去处未在同句/相邻句成对（产物模式 + 写进/落到/记入/落盘/挂进/绑进 + 载体词或仓内路径）' }
}

// X2：绑定动词 + 反引号路径（存在）+ 路径后同句首个「槽位」词（目标文件含该词）——本设计的核心闸门
function x2Binding(body) {
  const ss = sentences(body)
  for (const s of ss) {
    if (!BIND_VERB_RE.test(s)) continue
    const ps = extractPaths(s)
    if (ps.length === 0) continue
    for (const p of ps) {
      const after = s.slice(p.index + p.raw.length)
      const slot = after.match(/「([^」]{2,12})」/)
      if (!slot) continue
      if (!pathExists(p.raw)) return { ok: false, why: `绑定路径不存在：${p.raw}` }
      let target
      try { target = readFileSync(resolve(p.raw), 'utf8') }
      catch (e) { return { ok: false, why: `读取绑定目标失败 ${p.raw}：${e.code || e.message}` } }
      if (!target.includes(slot[1])) return { ok: false, why: `目标文件 ${p.raw} 不含声明的槽位「${slot[1]}」` }
      return { ok: true, why: '' }
    }
  }
  return { ok: false, why: '无「绑定动词 + 反引号路径 + 「槽位」」三段齐全的声明（挂进/绑进/写进/落到/核销 + `路径` + 「节名」）' }
}

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
 * 按 criteria.md §2.4/§3 判据逐项判定（类型感知：opts.type 选检查点，每项 1 分）。
 * opts.type: 持续适用/条件触发/模式门控/待拆未定（缺省/非法 → 条件触发，等价旧口径）
 * opts.modeChecks: {M1..M6} 模式门控专属检查点（AI 判，缺省全 false → 0 分进 findings）
 * opts.triCheckDone: 三检验报告是否已做（AI 侧语义判断，脚本无法复算；默认 false）
 * opts.cognitive: 规则是否含认知动作（AI 判，默认 false；true/'true' 均生效，与 triCheckDone 布尔化同风格）
 * 返回 { name, lines, chars, groups, total, max, rate, level, findings }
 * 输出字符串全局规避「判据」「建议删除」（越界检查），单规则/M3 用安全别名发出。
 */
// 得分率 → 级别（健康/预警/不及格，criteria §3.7）；scoreFile 与 scoreDir 共用，防两处漂移
function rateLevel(rate) {
  return rate >= 0.9 ? '健康' : rate >= 0.7 ? '预警' : '不及格'
}
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

  // 类型感知（Task 3）：type 由 opts 传入（AI 判），缺省/非法 → 条件触发（等价旧口径）
  const type = TYPE_KEYS.includes(opts.type) ? opts.type : '条件触发'
  const isBan = BAN_RE.test(body)
  const isPending = type === '待拆未定'
  const modeChecks = opts.modeChecks ?? {}

  const findings = []
  const checks = []   // 逐检查点登记（group/check/pass/msg）——rule-edit-checklist 消费：机器逐项输出，AI 不得手抄
  const groups = {}
  // 注册一个检查点：pass → 该组 +1 分；fail → 记一条 finding
  const g = (gname, check, pass, msg, recipe) => {
    groups[gname] ??= { score: 0, max: 0 }
    groups[gname].max += 1
    checks.push({ group: gname, check, pass: pass === true, msg: pass ? '' : msg })
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

  // ── 单规则（通用，类型派生：待拆未定 = 0）──
  g('单规则', '单规则检查（非合集）', !isPending,
    '合集：多个独立规则/极性混合 → 该拆', '拆成 N 条独立规则后分别评分')

  // ── 执行力度（按类型 × 极性选适用项；④⑤⑥ 仅禁令类；③⑦ 仅条件触发/模式门控）──
  if (!isPending) {
    const hasCond = type !== '持续适用'   // ③⑦ 仅条件触发/模式门控评估（持续适用不适用，不计满分）
    g('执行力度', '①极性明确', POLAR_RE.test(body) && ACTION_RE.test(body),
      '正文无极性词（禁止/不得/不要/必须/应/要）或动作', '补极性词 + 明确动作')
    g('执行力度', '②动作内容具体', actionSpecific(body),
      '动作对象空泛（合理处理/适当类）或无具体对象', '动作对象改为可枚举项或具体描述')
    if (hasCond) {
      const condOk = type === '条件触发'
        ? (COND_RE.test(body) && !BROAD_RE.test(body))
        : (MODE_COND_RE.test(body) && !BROAD_RE.test(body))
      g('执行力度', '③适用条件精细', condOk,
        '适用条件缺失或写「全部情况」', '条件精确到「具体类型+条件」（如「在 typescript 场景」）')
    }
    if (isBan) {
      g('执行力度', '④来源覆盖（禁令类）', COVER_RE.test(body),
        '未声明「不因来源豁免」', '补「防掠过」小节：不因计划/子代理/脚本/工具模板豁免')
      g('执行力度', '⑤冲突裁决（禁令类）', CONFLICT_RE.test(body),
        '未声明冲突时以本规则为准', '补「冲突裁决」小节：与具体指令/模板冲突时以本规则为准')
      g('执行力度', '⑥例外从严（禁令类）', EXCEPTION_RE.test(body) && !LOOSE_RE.test(body),
        '例外条件不明确或含宽松词（一般/通常/可能允许）', '例外写「只有…才算」且无宽松词')
    }
    if (hasCond) {
      const trigOk = type === '条件触发' ? TRIG_RE.test(body) : MODE_TRIG_RE.test(body)
      g('执行力度', '⑦触发机制', trigOk,
        '无可观测触发信号/时机', '补「触发时机」小节（落地后/开工时/编辑后）')
    }
    // 执行保障叠加轴（X1/X2/X3，仅认知动作型规则）：opts.cognitive 由 --cognitive 或 annotations 传入（AI 判，同三检验模式）
    // 布尔化与 triCheckDone 同风格：true/'true' 生效，防 annotations JSON 字符串 "false"/0 被当真值静默加检查点
    const cognitive = opts.cognitive === true || opts.cognitive === 'true'
    // x2Carrier（AI 判，经 annotations 传入，同 x3Done 模式）：规则产物去处 = 会话载体（回答/回复等 X1 载体词）
    // → X2 文件槽位断言不适用（会话产物无自然文件落点，强制文件绑定 = 假落点）；文件类规则不标 → X2 仍强制。
    const x2Carrier = opts.x2Carrier === true || opts.x2Carrier === 'true'
    if (cognitive) {
      const x1 = x1ProductLanding(body)
      g('执行力度', 'X1动作产物化', x1.ok,
        `认知动作未声明「产物+去处」成对：${x1.why}`, '补产物模式 + 去处动词 + 去处（载体词表或仓内路径，路径须 Test-Path 为真）——判据见 criteria §3.3b')
      if (!x2Carrier) {
        const x2 = x2Binding(body)
        g('执行力度', 'X2必经路径绑定', x2.ok,
          `认知动作未声明必经路径绑定：${x2.why}`, '补「绑定动词 + 反引号路径 + 「槽位」」三段，且目标文件真含该槽位（文件断言）——判据见 criteria §3.3b')
      }
      const x3Done = opts.x3Done === true || opts.x3Done === 'true'
      g('执行力度', 'X3触发前置', x3Done,
        '触发在应激时刻且未前置显式化（AI 判，经 annotations x3Done 传入，判定依据须可复核）', '应激时刻触发需前置显式化：任务开头先声明；AI 判定后写进 rules/.inspector-annotations.json')
    }
    g('执行力度', '⑧验证闭环', VERIFY_RE.test(body),
      '未定义怎么确认遵守了', '补「验证」小节：自检命令/检查点/报告要求')
    // ── 模式专属（仅模式门控，M1–M6 由 AI 判，缺省全 false → 0 分进 findings）──
    if (type === '模式门控') {
      g('模式专属', 'M1 状态集合完整', !!modeChecks.M1,
        '状态集合不全（漏态 = 该态下规则没交代）', '补全规则管辖的全部模式（≥2 态）')
      g('模式专属', 'M2 每状态行为明确', !!modeChecks.M2,
        '存在状态未规定动作裁决（空态）', '每个状态都规定做/不做的动作裁决')
      g('模式专属', 'M3 切换依据明确', !!modeChecks.M3,
        '切换信号不可观测（感觉/大概/酌情）', '状态转移由可观测信号驱动')
      g('模式专属', 'M4 回到逻辑完整', !!modeChecks.M4,
        '缺「退出 → 重新适用」回转路径（单向退出 = 规则形同失效）', '补「退出 → 重新适用」回转路径')
      g('模式专属', 'M5 模式边界封闭', !!modeChecks.M5,
        '存在需执行者语义归类的状态情形', '每态覆盖情形写成可判定枚举（防掠过）')
      g('模式专属', 'M6 退出后由谁接管', !!modeChecks.M6,
        '规则让位时未指明动作按什么管（退出留空档）', '指明让位后动作按哪条规则管')
    }
  }

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
  // 待拆未定（合集）：只报通用组得分率，不报整体级别（满分未定，拆后按各新文件重评）
  const level = isPending ? undefined : rateLevel(rate)
  return { name, lines, chars, groups, total, max, rate, level, findings, checks }
}

function median(nums) {
  const s = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

export function scoreDir(dir, opts = {}) {
  // annotations 自动发现：未显式传 --annotations 且 rulesDir 下存在 .inspector-annotations.json → 自动加载（显式传参优先）。
  // 认知动作判定资产化（spec §4.5）：判定落仓内文件，不依赖调用者每次重判。
  if (!opts.annotations) {
    const annPath = join(dir, '.inspector-annotations.json')
    if (existsSync(annPath)) {
      let ann
      try { ann = JSON.parse(stripBom(readFileSync(annPath, 'utf8'))) }
      catch (e) { throw new Error(`annotations 解析失败：${annPath}（须为 JSON 对象，如 {"文件名":{"cognitive":true,"x3Done":true}}）——${e.message}`) }
      if (!ann || typeof ann !== 'object' || Array.isArray(ann)) {
        throw new Error(`annotations 格式错误：${annPath}（须为 JSON 对象，如 {"文件名":{"cognitive":true,"x3Done":true}}）`)
      }
      opts = { ...opts, annotations: ann }
    }
  }
  const files = readdirSync(dir).filter(f => f.endsWith('.md')).sort()
  // 先算全库单条行数中位数（作为体积基线，参考维度），再逐文件评分
  const lineCounts = files.map(f => {
    const t = stripBom(readFileSync(join(dir, f), 'utf8'))
    return t.replace(/\r?\n$/, '').split(/\r?\n/).length
  })
  const medianLines = median(lineCounts)
  const scored = files.map(f => {
    // 逐文件标注优先于全局 --type；未标注文件按 opts.type（缺省 条件触发）
    const ann = opts.annotations?.[f]
    return scoreFile(join(dir, f), dir, ann ? { ...opts, ...ann } : opts)
  })
  const linesTotal = scored.reduce((a, f) => a + f.lines, 0)
  const charsTotal = scored.reduce((a, f) => a + f.chars, 0)
  const currentBaseline = { totalLines: linesTotal, medianLines, x1_5: Math.round(linesTotal * 1.5 * 10) / 10 }
  let previous = null, diff = null
  if (opts.baselineFile) {
    const prev = JSON.parse(readFileSync(opts.baselineFile, 'utf8'))
    previous = prev.totals ?? prev.currentBaseline
    diff = { lines: linesTotal - previous.lines, chars: charsTotal - previous.chars }
  }
  // dir 级得分率/级别：跳过 level===undefined（待拆未定/合集）文件（单独列出），避免拉低 dir 健康度
  const rated = scored.filter(f => f.level !== undefined)
  const total = rated.length ? Math.round(rated.reduce((a, f) => a + f.total, 0) / rated.length) : undefined
  const rate = rated.length ? rated.reduce((a, f) => a + f.rate, 0) / rated.length : undefined
  const level = rate === undefined ? undefined : rateLevel(rate)   // 全库无已评级文件时不报 dir 级别
  const out = { dir, measuredAt: new Date().toISOString().slice(0, 10), totals: { files: scored.length, lines: linesTotal, chars: charsTotal }, currentBaseline, previous, diff, files: scored, total, rate, level }
  return out
}

export function cli(argv = process.argv.slice(2)) {
  const args = { dir: 'D:\\Seed\\retro-skills\\rules', json: false, triCheck: false, cognitive: false, baselineFile: null, type: null, annotationsFile: null, file: null, rulesDir: null }
  let dirGiven = false   // 显式给了 --dir（args.dir 有默认值，互斥须区分「显式」与「默认」）
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dir') { args.dir = argv[++i]; dirGiven = true }
    else if (argv[i] === '--file') args.file = argv[++i]
    else if (argv[i] === '--rules-dir') args.rulesDir = argv[++i]
    else if (argv[i] === '--json') args.json = true
    else if (argv[i] === '--tri-check') args.triCheck = true
    else if (argv[i] === '--cognitive') args.cognitive = true
    else if (argv[i] === '--baseline') args.baselineFile = argv[++i]
    else if (argv[i] === '--type') args.type = argv[++i]
    else if (argv[i] === '--annotations') args.annotationsFile = argv[++i]
  }
  if (args.file && dirGiven) { console.error('--file 与 --dir 互斥，只给一个'); process.exit(2) }
  if (args.file) {
    if (!existsSync(args.file)) { console.error(`文件不存在：${args.file}`); process.exit(1) }
    if (args.rulesDir && !existsSync(args.rulesDir)) { console.error(`规则库目录不存在：${args.rulesDir}`); process.exit(1) }
    let opts = { triCheckDone: args.triCheck, type: args.type, cognitive: args.cognitive }
    // rulesDir 用于跨规则引用检查（scoreFile → crossRuleMiss）：评分草稿时须指规则库（rules/），
    // 不能默认 dirname(file)（草稿在草稿箱，引用会全部误判）；评分现有规则时可不给（默认 dirname(file)=规则库）。
    const rulesDir = args.rulesDir ?? dirname(args.file)
    // --file 模式同样自动发现 annotations（同 scoreDir：两种入口判定资产化必须一致生效，
    // 否则逐条 --file --cognitive 复核时 x3Done 传不进去 → X3 永远红——round-3 补的洞）。
    // 显式 --cognitive 优先：命令行给了就以命令行为准，annotations 只补没给的键。
    const annPath = join(rulesDir, '.inspector-annotations.json')
    if (existsSync(annPath)) {
      let ann
      try { ann = JSON.parse(stripBom(readFileSync(annPath, 'utf8'))) }
      catch (e) { console.error(`annotations 解析失败：${annPath}（${e.message}）`); process.exit(1) }
      if (!ann || typeof ann !== 'object' || Array.isArray(ann)) {
        console.error(`annotations 格式错误：${annPath}（须为 JSON 对象，如 {"文件名":{"cognitive":true,"x3Done":true}}）`)
        process.exit(1)
      }
      const a = ann[basename(args.file)]
      if (a && typeof a === 'object' && !Array.isArray(a)) {
        opts = { ...a, ...opts }
        // CLI 未显式传 --cognitive 时，opts.cognitive=false 会把 annotations 的判定冲掉 → 补回。
        // （CLI 只有「传了 = true」一种形态，显式优先 = 传了就不动。）
        if (!opts.cognitive && a.cognitive) opts.cognitive = a.cognitive
      }
    }
    const r = scoreFile(args.file, rulesDir, opts)
    const summary = r.level === undefined
      ? `得分 ${r.total}/${r.max}（${Math.round(r.rate * 100)}%，合集无级别）`
      : `得分 ${r.total}/${r.max}（${Math.round(r.rate * 100)}%，${r.level}）`
    console.log(args.json ? JSON.stringify(r, null, 2) : summary)
    return
  }
  if (!existsSync(args.dir)) { console.error(`目录不存在：${args.dir}`); process.exit(1) }
  if (args.baselineFile && !existsSync(args.baselineFile)) { console.error(`基线文件不存在：${args.baselineFile}，先不带 --baseline 跑一次`); process.exit(1) }
  if (args.annotationsFile && !existsSync(args.annotationsFile)) { console.error(`标注文件不存在：${args.annotationsFile}`); process.exit(1) }
  let annotations = undefined
  if (args.annotationsFile) {
    try {
      annotations = JSON.parse(stripBom(readFileSync(args.annotationsFile, 'utf8')))
      if (!annotations || typeof annotations !== 'object' || Array.isArray(annotations)) throw new Error('非对象')
    } catch (e) {
      console.error(`标注文件解析失败：${args.annotationsFile}（须为 JSON 对象，如 {"文件名":{"type":"模式门控","modeChecks":{...}}}）`)
      process.exit(1)
    }
  }
  const out = scoreDir(args.dir, { baselineFile: args.baselineFile, triCheckDone: args.triCheck, type: args.type, cognitive: args.cognitive, annotations })
  const summary = out.level === undefined
    ? `共 ${out.totals.files} 文件 / ${out.totals.lines} 行 / ${out.totals.chars} 字符（无已评级文件，不报 dir 得分率）`
    : `共 ${out.totals.files} 文件 / ${out.totals.lines} 行 / ${out.totals.chars} 字符，平均得分率 ${Math.round(out.rate * 100)}%（${out.level}）`
  console.log(args.json ? JSON.stringify(out, null, 2) : summary)
}

// 仅当作为命令行直接运行时才执行 CLI（import 进测试/其他模块时不触发）
// 归一化比较：Junction/symlink 下 process.argv[1] 与 import.meta.url 的路径字符串不同，
// 须解析到真实路径（realpath）再比；Windows 文件系统大小写不敏感，比较前归一大小写。
if (process.argv[1]) {
  const self = realpathSync(fileURLToPath(import.meta.url))
  const arg = realpathSync(process.argv[1])
  const same = process.platform === 'win32' ? self.toLowerCase() === arg.toLowerCase() : self === arg
  if (same) cli()
}
