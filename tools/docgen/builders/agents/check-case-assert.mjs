// PRD V7 映射非空心校验器：plan 的「用例」列 → testcase 的用例体 → 每条用例体必须真的验到东西。
// 口径见 spec `2026-11-03-s-b-contract-layer-design.md` §11.2.5（1–5）与 §11.4-4：
//   ① 只认 plan 里表头含「用例」的那张表（不在全文正则扫——同一 ID 在 Step 标题与代码块反复出现，去重值随排版漂）；
//      取不到 ID（`ids === 0`）即 exit 1：否则表头 / 正则 / 文件任一不匹配都会静默恒绿。
//   ② 在 testcase 里按 `### <ID>` 或 `test('<ID> …` 定位用例体；
//   ③ 体内**出现的** assert **全部**恒真（参数侧 trim ∈ {true, 1, '1'}）→ `hollow`；
//      零 assert 的用例体不判 hollow（本仓 testcase 是「判据即命令」的文档形态），单列 `noassert <M>`（不进首行、不改 exit 码）；
//   ④ 找不到用例体 → `missing`（与 `hollow` 不混算，同为 exit 1）。
// 表格切分 / 围栏掩码**不在这里重写**：`tools/execution-matrix/markdown-rows.mjs` 是唯一实现（`cli.mjs` / `s3-predicates` 同源消费）。
// 不进 `npm run check`：与 `check-quotes.mjs` 同口径（验收在 ③/④/⑤ 门行跑命令 + 输出首行）。
import { existsSync, readFileSync } from 'node:fs'
import { splitRow, fenceMask } from '../../../execution-matrix/markdown-rows.mjs'

const fail = (line) => { console.log(line); process.exit(1) }
const usage = (line) => { console.log(line); process.exit(2) }

// ID 形态（spec §11.2.5 口径 1）：三位 `TC-\d{3}`；`S[A-Z]*-` 前缀同时覆盖 `S3-TC-H06` 与本段自己的 `SB-TC-09`
// （写成 `S\d+-TC-` 时后者取不到）。尾随 `(?!\d)` 防 `TC-0012` 被截成 `TC-001`。
const ID_SRC = '(?:S[A-Z]*-TC-[A-Z]?\\d\\d|TC-\\d{3})(?!\\d)'
const ID_RE = new RegExp(ID_SRC)
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
  if (!opt[k]) usage(`check-case-assert: 缺 --${k}${USAGE}`)
  if (!existsSync(opt[k])) usage(`check-case-assert: ${opt[k]} 不存在（--${k}）`)
}

const readText = (p) => readFileSync(p, 'utf8').replace(/^\uFEFF/, '')
const isTableLine = (l) => l.trim().startsWith('|')
const isSeparator = (l) => {
  const cells = splitRow(l)
  return cells.length > 0 && cells.every((c) => /^:?-+:?$/.test(c))
}

// 口径 1：表头含「用例」且下一行是分隔行的那张表，逐行取第 1 列（单元格切分走 `splitRow`），按 ID 形态匹配后去重
function planCaseIds(planText) {
  const lines = planText.split(/\r?\n/)
  const head = lines.findIndex((l, i) => isTableLine(l) && splitRow(l).some((c) => c.includes('用例')) && isSeparator(lines[i + 1] ?? ''))
  if (head < 0) return []   // 取不到表 = ids 0，由空转守卫 exit 1（不是用法错）
  const ids = []
  for (let i = head + 2; i < lines.length && isTableLine(lines[i]); i += 1) {
    const cell = splitRow(lines[i])[0] ?? ''
    const m = ID_RE.exec(cell)
    if (m && !ids.includes(m[0])) ids.push(m[0])
  }
  return ids
}

const HEADING_RE = /^(#{1,6})\s+(.*)$/
const TEST_RE = new RegExp(`test\\(\\s*['"\`](${ID_SRC})`)

// 口径 2：`### <ID>` 起至下一个同级标题止；`test('<ID> …` 起至下一个 `test(` 止。同一 ID 取首个命中。
// 围栏掩码走 `fenceMask`（同一份实现）：围栏内的行不参与「标题 / test(」判断，否则正文示例代码会把用例体截断。
function caseBodies(tcText) {
  const lines = tcText.split(/\r?\n/)
  const { mask } = fenceMask(lines)
  const bodies = new Map()
  for (let i = 0; i < lines.length; i += 1) {
    if (mask[i]) continue
    const t = lines[i].trim()
    const h = HEADING_RE.exec(t)
    let id = null
    let level = 0
    let fromTest = false
    if (h) {
      const m = ID_RE.exec(h[2].trim())
      if (m && m.index === 0) { id = m[0]; level = h[1].length }
    }
    if (!id) {
      const m = TEST_RE.exec(t)
      if (m) { id = m[1]; fromTest = true }
    }
    if (!id || bodies.has(id)) continue

    let end = lines.length
    for (let k = i + 1; k < lines.length; k += 1) {
      if (mask[k]) continue
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

// 口径 3 的取数面：逐个 `assert.*` 调用取参数侧原文（trim 后再比 token）
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
// 空转守卫（spec §11.2.5 口径 1）：一个 ID 都取不到 → 任何形态都会恒绿，必须红
if (ids.length === 0) fail('check-case-assert: ids 0（取不到用例 ID：表头/正则/文件不匹配）=> fail')

const bodies = caseBodies(readText(opt.testcase))

const hollow = []
const missing = []
let noassert = 0
for (const id of ids) {
  const hit = bodies.get(id)
  if (!hit) { missing.push(id); continue }
  const params = assertArgs(hit.body)
  // 零 assert 不是「空心」而是「没有断言面」：单列计数（noassert），不判 hollow、不影响 exit 码
  if (params.length === 0) { noassert += 1; continue }
  // hollow = 体内出现的 assert **全部**恒真（混装一条真断言即不算空心：every 语义）
  if (params.every((p) => CONST_ARGS.has(p))) hollow.push({ id, line: hit.line })
}

if (hollow.length || missing.length) {
  for (const x of hollow) console.log(`${x.id}（${x.line}）`)
  for (const id of missing) console.log(`${id}（missing）`)
  fail(`check-case-assert: ids ${ids.length} / hollow ${hollow.length} / missing ${missing.length} => fail`)
}

console.log(`check-case-assert: ids ${ids.length} / hollow 0 / missing 0 => ok`)
console.log(`noassert ${noassert}`)
