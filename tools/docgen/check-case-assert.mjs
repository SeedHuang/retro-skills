// PRD V7 映射非空心校验器：plan 的「用例」列 → testcase 的用例体 → 每条用例体必须真的验到东西。
// 口径见 spec `2026-11-03-s-b-contract-layer-design.md` §11.2.5（1–5）与 §11.4-4：
//   ① 只认 plan 里表头含「用例」的那张表（不在全文正则扫——同一 ID 在 Step 标题与代码块反复出现，去重值随排版漂）；
//   ② 在 testcase 里按 `### <ID>` 或 `test('<ID> …` 定位用例体；
//   ③ 用例体内只剩恒真断言（参数侧 trim ∈ {true, 1, '1'}）→ `hollow`；④ 找不到用例体 → `missing`（两者不混算，同为 exit 1）。
// 不进 `npm run check`：与 `check-quotes.mjs` 同口径（验收在 ③/④/⑤ 门行跑命令 + 输出首行）。
import { existsSync, readFileSync } from 'node:fs'

const fail = (line) => { console.log(line); process.exit(1) }
const usage = (line) => { console.log(line); process.exit(2) }

// ID 形态：三位（S-A 实测 TC-001…TC-030；按两位写只剩 4 个唯一值）
const ID_RE = /S\d+-TC-[A-Z]\d\d|TC-\d{3}/
// 「恒真」的 token 级参数集（不是字面匹配：` true ` / `1` / `'1'` 都算同一个 token）
const CONST_ARGS = new Set(['true', '1', "'1'", '"1"'])

const USAGE = '（用法：--plan <plan.md> --testcase <testcase.md>）'
const argv = process.argv.slice(2)
const opt = { plan: '', testcase: '' }
for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i]
  if (a !== '--plan' && a !== '--testcase') usage(`check-case-assert: 未知参数 ${a}${USAGE}`)
  const v = argv[i + 1]
  if (v === undefined || v.startsWith('--')) usage(`check-case-assert: ${a} 缺路径${USAGE}`)
  opt[a.slice(2)] = v
  i += 1
}
for (const k of ['plan', 'testcase']) {
  if (!opt[k]) usage(`check-case-assert: 缺 --${k}（用法：--plan <plan.md> --testcase <testcase.md>）`)
  if (!existsSync(opt[k])) usage(`check-case-assert: ${opt[k]} 不存在（--${k}）`)
}

const readText = (p) => readFileSync(p, 'utf8').replace(/^\uFEFF/, '')

// 口径 1：表头含「用例」且下一行是分隔行的那张表，逐行取第 1 列，按 ID 形态匹配后去重
function planCaseIds(planText) {
  const lines = planText.split(/\r?\n/).map((l) => l.trim())
  const head = lines.findIndex((l, i) => l.startsWith('|') && l.includes('用例') && /^\|[\s:|-]+\|$/.test(lines[i + 1] ?? ''))
  if (head < 0) usage('check-case-assert: plan 里没有表头含「用例」的表（口径 1 取不到 ID）')
  const ids = []
  for (let i = head + 2; i < lines.length && lines[i].startsWith('|'); i += 1) {
    const cell = (lines[i].replace(/^\|/, '').split('|')[0] ?? '').trim()
    const m = ID_RE.exec(cell)
    if (m && !ids.includes(m[0])) ids.push(m[0])
  }
  return ids
}

const HEADING_RE = /^(#{1,6})\s+(.*)$/
const TEST_RE = /test\(\s*['"`](S\d+-TC-[A-Z]\d\d|TC-\d{3})(?![\w-])/

// 口径 2：`### <ID>` 起至下一个同级标题止；`test('<ID> …` 起至下一个 `test(` 止。同一 ID 取首个命中。
// 围栏代码块内的行不参与「标题 / test(」判断（否则正文里的示例代码会把用例体截断）。
function caseBodies(tcText) {
  const lines = tcText.split(/\r?\n/)
  const fenced = []
  let inFence = false
  for (const l of lines) {
    if (/^\s*(```|~~~)/.test(l)) { fenced.push(true); inFence = !inFence; continue }
    fenced.push(inFence)
  }
  const bodies = new Map()
  for (let i = 0; i < lines.length; i += 1) {
    if (fenced[i]) continue
    const t = lines[i].trim()
    const h = HEADING_RE.exec(t)
    let id = null
    let level = 0
    let fromTest = false
    if (h) {
      const m = /^(S\d+-TC-[A-Z]\d\d|TC-\d{3})(?![\w-])/.exec(h[2].trim())
      if (m) { id = m[1]; level = h[1].length }
    }
    if (!id) {
      const m = TEST_RE.exec(t)
      if (m) { id = m[1]; fromTest = true }
    }
    if (!id || bodies.has(id)) continue

    let end = lines.length
    for (let k = i + 1; k < lines.length; k += 1) {
      if (fenced[k]) continue
      const tk = lines[k].trim()
      const hk = HEADING_RE.exec(tk)
      if (hk && hk[1].length <= (fromTest ? 6 : level)) { end = k; break }
      if (fromTest && TEST_RE.test(tk)) { end = k; break }
    }
    bodies.set(id, { line: i + 1, body: lines.slice(i, end).join('\n') })
  }
  return bodies
}

// `assert.<方法>(` 的配对右括号（跳过字符串字面量里的括号）
function closingParen(text, open) {
  let depth = 0
  let quote = ''
  for (let i = open; i < text.length; i += 1) {
    const c = text[i]
    if (quote) {
      if (c === '\\') i += 1
      else if (c === quote) quote = ''
      continue
    }
    if (c === "'" || c === '"' || c === '`') { quote = c; continue }
    if (c === '(') depth += 1
    else if (c === ')') { depth -= 1; if (depth === 0) return i }
  }
  return -1
}

// 口径 3 的取数面：逐个 `assert.*` 调用取参数侧原文（trim 由调用方做）
function assertArgs(text) {
  const out = []
  const re = /assert\s*\.\s*[A-Za-z_$][\w$]*\s*\(/g
  let m
  while ((m = re.exec(text)) !== null) {
    const open = m.index + m[0].length - 1
    const close = closingParen(text, open)
    if (close < 0) break
    out.push(text.slice(open + 1, close).trim())
    re.lastIndex = close + 1
  }
  return out
}

const ids = planCaseIds(readText(opt.plan))
const bodies = caseBodies(readText(opt.testcase))

const hollow = []
const missing = []
for (const id of ids) {
  const hit = bodies.get(id)
  if (!hit) { missing.push(id); continue }
  const params = assertArgs(hit.body)
  // hollow = 用例体里只剩恒真断言、什么都不验（0 条 assert 的用例体不算 hollow：它根本没有断言面，
  // 与「把断言写成恒真」是两种问题，后者才是 V7 要拦的绕过路径）
  if (params.length > 0 && params.every((p) => CONST_ARGS.has(p))) hollow.push({ id, line: hit.line })
}

if (hollow.length || missing.length) {
  for (const x of hollow) console.log(`${x.id}（${x.line}）`)
  for (const id of missing) console.log(`${id}（missing）`)
  fail(`check-case-assert: ids ${ids.length} / hollow ${hollow.length} / missing ${missing.length} => fail`)
}

console.log(`check-case-assert: ids ${ids.length} / hollow 0 / missing 0 => ok`)
