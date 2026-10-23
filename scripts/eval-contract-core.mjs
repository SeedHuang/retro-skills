// eval-contract-core.mjs —— A1 的纯函数库（零依赖）
// 只做「文本 → 结构」的确定性抽取，不读跑分、不产 verdict
// 口径来源：spec §3.2.1 / §3.2.2（行级正则抽取，与 runner 同口径；不得引第三方 YAML 库）
import { createHash } from 'node:crypto'

// 行首缩进宽度（空格 / 制表符按字符数算，够本仓文件使用）
function lineIndent(line) {
  const m = line.match(/^[ \t]*/)
  return m[0].length
}

// 抽 expected.md 里的 ```json 机读块
// spec §3.2.2 开头：文件内 json 围栏块必须恰好一个 —— 多于一个同样不合法（否则 runner 读哪个都算猜）
export function extractMachineBlock(text) {
  const blocks = [...text.matchAll(/```json\r?\n([\s\S]*?)```/g)]
  if (blocks.length === 0) return { ok: false, error: '未找到 ```json 机读块' }
  if (blocks.length > 1) return { ok: false, error: `\`\`\`json 机读块必须恰好 1 个，实际 ${blocks.length} 个` }
  try { return { ok: true, block: JSON.parse(blocks[0][1]) } }
  catch (e) { return { ok: false, error: `机读块不是合法 JSON：${e.message}` } }
}

// 抽块列表形态的字符串数组：给字段名，返回其后的 `  - "x"` 项
// 终止条件 = 出现缩进不深于字段行的非空行（同级字段 / 回到父级）；只认 `- "x"` 一种写法
export function extractBlockList(text, field) {
  const lines = text.split(/\r?\n/)
  const start = lines.findIndex((l) => new RegExp(`^(\\s*)${field}:\\s*$`).test(l))
  if (start < 0) return { ok: false, error: `缺少块列表字段 ${field}` }
  const baseIndent = lineIndent(lines[start])
  const out = []
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === '' || /^\s*#/.test(line)) continue
    if (lineIndent(line) <= baseIndent) break            // 同级字段或回父级 = 该字段结束
    const m = line.match(/^\s*-\s+"([^"]*)"\s*$/)
    if (!m) return { ok: false, error: `${field} 出现非块列表行：${line.trim()}` }
    out.push(m[1])
  }
  if (out.length === 0) return { ok: false, error: `${field} 为空` }
  return { ok: true, items: out }
}

// 内联数组探测（必须报错：写成 [a, b] 会让 L2 抽取失败）
export function hasInlineArray(text, field) {
  return new RegExp(`^\\s*${field}:\\s*\\[.*\\]`, 'm').test(text)
}

// 取顶层标量（只支持 id/title 这类单行值）
export function extractScalar(text, field) {
  const m = text.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'))
  return m ? m[1].trim() : null
}

// 取 context 下的路径字面值
export function extractContextPaths(text) {
  const pick = (re) => { const m = text.match(re); return m ? m[1].trim() : null }
  return {
    repo_fixture: pick(/^\s*repo_fixture:\s*(.+)$/m),
    apply_diff: pick(/^\s*apply_diff:\s*(.+)$/m),
    hasContextGit: /^\s*git:\s*$/m.test(text),
  }
}

// 取 input.prompt 的块标量正文（锚点核对 ⑥ 只认这一段的文本，不得拿整份 yaml 比——
// expect.must_contain 里本来就可能含锚点串，整份比必然假阳性）
export function extractPromptText(text) {
  const lines = text.split(/\r?\n/)
  const start = lines.findIndex((l) => /^\s*prompt:\s*[|>]?\s*$/.test(l))
  if (start < 0) return { ok: false, error: '缺少 input.prompt' }
  const baseIndent = lineIndent(lines[start])
  const out = []
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === '') { out.push(''); continue }
    if (lineIndent(line) <= baseIndent) break
    out.push(line)
  }
  if (out.join('').trim() === '') return { ok: false, error: 'input.prompt 为空' }
  return { ok: true, text: out.join('\n') }
}

// 拆行：保留原文件的换行风格（不把 CRLF 文件整体改写成 LF）
function splitLines(text) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n'
  return { eol, lines: text.split(eol) }
}

// 定位嵌套字段标量所在行（keys 逐级下探；块列表项形如 `- source: x` 也算命中）
// 返回 { lines, lineIndex, prefix（冒号及其右侧空白）, raw（原值文本） }
function locatePathScalar(text, keys) {
  const { lines } = splitLines(text)
  let from = 0
  let parentIndent = -1
  for (let ki = 0; ki < keys.length; ki++) {
    const key = keys[ki]
    let hit = null
    for (let i = from; i < lines.length; i++) {
      const line = lines[i]
      if (line.trim() === '' || /^\s*#/.test(line)) continue
      if (lineIndent(line) <= parentIndent) break
      const m = line.match(/^(\s*(?:-\s+)?([A-Za-z0-9_.-]+):[ \t]*)(.*)$/)
      if (m && m[2] === key) { hit = { i, indent: lineIndent(line), prefix: m[1], raw: m[3] }; break }
    }
    if (!hit) return { ok: false, error: `缺少字段 ${keys.slice(0, ki + 1).join('.')}` }
    if (ki < keys.length - 1) {
      if (hit.raw.trim() !== '') return { ok: false, error: `字段 ${keys.slice(0, ki + 1).join('.')} 不是块（有内联值 ${hit.raw.trim()}）` }
      from = hit.i + 1
      parentIndent = hit.indent
    } else {
      return { ok: true, lines, lineIndex: hit.i, prefix: hit.prefix, raw: hit.raw }
    }
  }
  return { ok: false, error: '字段路径为空' }
}

// YAML 标量去壳（注入与 ⑥-4 共用的唯一实现）：
// 双引号去壳并反转义 \" 与 \\；单引号去壳并把 '' 还原成 '；无引号原样返回。
// 旧实现两处各写一份 /^"(.*)"$/ —— 单引号 / 无引号这两种合法写法读出来仍带引号，
// 于是 ⑥-4 把合法配置误判「路径不存在」（码 4），注入则把引号写进绝对路径。
export function unquoteYamlScalar(raw) {
  const t = String(raw).trim()
  if (t.length > 1 && t[0] === '"' && t.endsWith('"')) return t.slice(1, -1).replace(/\\(["\\])/g, '$1')
  if (t.length > 1 && t[0] === "'" && t.endsWith("'")) return t.slice(1, -1).replace(/''/g, "'")
  return t
}

// 取嵌套字段的标量值（keys 逐级下探；块列表项形如 `- source: x` 也算命中）
// 用途：§3.2 固定字段核对（environment.type / skills[].source / cases.defaults.* 等）
export function extractPathValue(text, keys) {
  const loc = locatePathScalar(text, keys)
  if (!loc.ok) return { ok: false, error: loc.error }
  return { ok: true, value: unquoteYamlScalar(loc.raw) }
}

// skills 块内**全部** path 标量（spec §3.3-5 ⑥-4 写的是 `skills[].path`，是复数）。
// 注入要把每条都绝对化、校验也要每条都查：旧实现注入遍历全部、校验只取第一条，
// 多技能时第二条为空或不存在会在 dry-run 放过、真跑才炸。
export function listSkillsPathScalars(text) {
  const { eol, lines } = splitLines(text)
  const start = lines.findIndex((l) => /^\s*skills:\s*$/.test(l))
  if (start < 0) return { ok: false, error: '缺少 skills 块' }
  const baseIndent = lineIndent(lines[start])
  const items = []
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === '' || /^\s*#/.test(line)) continue
    if (lineIndent(line) <= baseIndent) break
    const m = line.match(/^(\s*(?:-\s+)?path:[ \t]*)(.*)$/)
    if (!m) continue
    const value = unquoteYamlScalar(m[2])
    if (value === '') return { ok: false, error: 'skills.path 为空' }
    items.push({ lineIndex: i, prefix: m[1].endsWith(':') ? `${m[1]} ` : m[1], value })
  }
  if (items.length === 0) return { ok: false, error: 'skills 块内没有 path 字段' }
  return { ok: true, eol, lines, items }
}

// 整值替换嵌套字段标量：只改该行冒号右侧，缩进 / 键名 / 其它行原样保留。
// 新值一律写成双引号标量（JSON 转义与 YAML 双引号兼容），原值带不带引号都不会留下悬空尾引号。
// spec §3.3-4 注入的共用实现：provider / name / skills[].path 都走这里，禁止再各写一份 replaceAll
export function setPathScalar(text, keys, value) {
  const loc = locatePathScalar(text, keys)
  if (!loc.ok) return { ok: false, error: loc.error }
  const lines = loc.lines.slice()
  const prefix = loc.prefix.endsWith(':') ? `${loc.prefix} ` : loc.prefix
  lines[loc.lineIndex] = prefix + JSON.stringify(String(value))
  return { ok: true, text: lines.join(splitLines(text).eol) }
}

// 抽「同名块列表」的所有出现（judge 的 all / any 可能多处出现）。
// 逐行扫描到 EOF：末项无尾换行也必须抽到（正则版本会静默漏掉最后一项）。
// 返回 [{ items, bad }]：bad = 该列表里出现的第一行不合规内容（不是 `- "x"`）。
export function extractBlockLists(text, field) {
  const lines = text.split(/\r?\n/)
  const out = []
  for (let i = 0; i < lines.length; i++) {
    if (!new RegExp(`^(\\s*)${field}:\\s*$`).test(lines[i])) continue
    const baseIndent = lineIndent(lines[i])
    const items = []
    let bad = null
    for (let j = i + 1; j < lines.length; j++) {
      const line = lines[j]
      if (line.trim() === '' || /^\s*#/.test(line)) continue
      if (lineIndent(line) <= baseIndent) break
      const m = line.match(/^\s*-\s+"([^"]*)"\s*$/)
      if (!m) { bad = line.trim(); break }
      items.push(m[1])
    }
    out.push({ items, bad })
  }
  return out
}

// 抽块列表（允许项无引号，供 report.formats 这类工具原生写法用）；行内数组直接报错
export function extractPlainBlockList(text, field) {
  if (new RegExp(`^\\s*${field}:\\s*\\[`, 'm').test(text)) {
    return { ok: false, error: `${field} 用了行内数组（必须是块列表）` }
  }
  const lines = text.split(/\r?\n/)
  const start = lines.findIndex((l) => new RegExp(`^(\\s*)${field}:\\s*$`).test(l))
  if (start < 0) return { ok: false, error: `缺少块列表字段 ${field}` }
  const baseIndent = lineIndent(lines[start])
  const out = []
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === '' || /^\s*#/.test(line)) continue
    if (lineIndent(line) <= baseIndent) break
    const m = line.match(/^\s*-\s*(?:"([^"]*)"|([^\s#]+))\s*$/)
    if (!m) return { ok: false, error: `${field} 出现非块列表行：${line.trim()}` }
    out.push(m[1] !== undefined ? m[1] : m[2])
  }
  if (out.length === 0) return { ok: false, error: `${field} 为空` }
  return { ok: true, items: out }
}

export function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex')
}

// canonical JSON：键名升序、无多余空白
export function canonicalJson(value) {
  const walk = (v) => {
    if (Array.isArray(v)) return v.map(walk)
    if (v && typeof v === 'object') {
      return Object.keys(v).sort().reduce((acc, k) => { acc[k] = walk(v[k]); return acc }, {})
    }
    return v
  }
  return JSON.stringify(walk(value))
}

// frozen 账本的 assert_hash（spec §3.2.2③）：sha256(canonical JSON)，覆盖 assert + anchors + arms + delta
// runner（只复算比对、不生成）与 A1（同一判据）共用这一处实现，禁止各写一份（Ruling 8）
export function assertHash({ assert, anchors, arms, delta }) {
  return sha256(canonicalJson({ assert, anchors, arms, delta }))
}

// 本轮禁止的键（spec §3.2.1 键白名单）。A1 的 KEYS-1 与 runner 的 ⑧ 共用这一份常量
export const BANNED_KEYS = [
  'exit_code', 'files_exist', 'files_not_exist', 'file_contains',
  'golden_file', 'tool_called', 'output_matches',
]

// 用例文本的键白名单 + judge ⊆ expect 审计（A1 的 KEYS-1/2/6 与 runner 的 ⑧ 共用这一处，禁止各写一份）
// 返回 { bannedKeys, usesOutputNot, judge:[{ field, badLine, undeclaredWords }] }
export function auditCaseKeys(caseText) {
  const bannedKeys = BANNED_KEYS.filter((k) => new RegExp(`^\\s*${k}:`, 'm').test(caseText))
  const usesOutputNot = /^\s*output_contains:[\s\S]{0,80}?\n\s+not:/m.test(caseText)
  // judge 的合规词集 = expect 两组词的并集（must_contain ∪ must_not_contain）
  const allowed = new Set([
    ...(extractBlockList(caseText, 'must_contain').items || []),
    ...(extractBlockList(caseText, 'must_not_contain').items || []),
  ])
  const judge = []
  for (const field of ['all', 'any']) {
    const undeclaredWords = []
    let badLine = null
    // 逐行扫到 EOF（正则版会漏末项）——一个字段可能多处出现，坏行取第一处、越界词全收
    for (const { items, bad } of extractBlockLists(caseText, field)) {
      if (bad && badLine === null) badLine = bad
      for (const w of items) if (!allowed.has(w) && !undeclaredWords.includes(w)) undeclaredWords.push(w)
    }
    if (badLine !== null || undeclaredWords.length > 0) judge.push({ field, badLine, undeclaredWords })
  }
  return { bannedKeys, usesOutputNot, judge }
}
