// check-plan.mjs —— 计划门的四条机械判据（S4 交付）
//
// 为什么要有这一份：计划门的三条核对（功能点全覆盖 / 依赖无环 / 功能块↔testcase 一一映射）
// 过去全靠审计手工重读（`stage-2b-plan-gate.md` 的「脚本上线前」分支），同一份 plan 隔一轮
// 重核可能得出不同结论。这里把它们落成四条可重跑的子命令；stdout 首行是门行证据的固定格式。
//
// 设计约束（spec R1 / R2 / R8）：
//   · 只读——不写盘、不跑 git 子进程、不读环境变量、不加旁路开关；
//   · 单元格切分只复用仓内单源 `splitRow`（自写 `split('|')` 会与它出两份实现）；
//   · 三档退出码：0 全过 / 1 有违规 / 2 用法错；exit 2 只打一行、不打任何计数行；
//   · 首行一律以 ` => <ok|fail>` 收尾，且 `fail` ⇔ exit 1（门行只贴首行即可判通过与否）。
import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { splitRow, fenceMask } from '../tools/execution-matrix/markdown-rows.mjs'

const SPEC_MAX = 350
const TC_MAX = 80
const ROUNDS_MAX = 3

const USAGE_PREFIX = '[check-plan] 用法错：'

class UsageError extends Error {}
const usage = (msg) => {
  throw new UsageError(msg)
}

// ── 参数层 ────────────────────────────────────────────────────────────────
const FLAGS = {
  coverage: ['--plan', '--prd', '--stage'],
  deps: ['--plan'],
  map: ['--plan'],
  size: ['--spec', '--testcase', '--rounds'],
}

function parseArgs(cmd, argv) {
  const allowed = FLAGS[cmd]
  if (!allowed) usage(`不认识的子命令：${cmd ?? '(空)'}（可用：coverage / deps / map / size）`)
  const args = {}
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i]
    if (!tok.startsWith('--')) usage(`多余参数：${tok}`)
    if (!allowed.includes(tok)) usage(`不认识的参数：${tok}（${cmd} 只认 ${allowed.join(' / ')}）`)
    if (Object.prototype.hasOwnProperty.call(args, tok)) usage(`参数重复：${tok}`)
    const v = argv[i + 1]
    if (v === undefined || v.startsWith('--')) usage(`缺参数值：${tok}`)
    args[tok] = v
    i++
  }
  return args
}

// 必传项在**读完路径之后**才判（Q25 / P72：`--spec` 指目录时报「不是文件」，
// 不能被「缺 --rounds」抢先顶掉——两条都是用法错，但门行要看到的是结构那一句）。
function need(args, flags, cmd) {
  for (const f of flags) if (!Object.prototype.hasOwnProperty.call(args, f)) usage(`缺 ${f}（${cmd} 必传）`)
}

// 路径：先判目录（Windows 下直接 readFileSync 会抛 EISDIR 落进「不可读」分支，报文与 Q25 不一致），
// 再判不存在，最后才判读盘错误（spec §4.1 三条）。
function readInput(label, arg, cwd) {
  const abs = resolve(cwd, arg)
  let st
  try {
    st = statSync(abs)
  } catch (e) {
    if (e.code === 'ENOENT') usage(`${label} ${arg} 不存在`)
    usage(`${label} ${arg} 不可读（${e.code ?? e.message}）`)
  }
  if (st.isDirectory()) usage(`${label} ${arg} 不是文件`)
  try {
    return readFileSync(abs, 'utf8')
  } catch (e) {
    usage(`${label} ${arg} 不可读（${e.code ?? e.message}）`)
  }
}

// ── 通用解析 ──────────────────────────────────────────────────────────────
const isTableLine = (line) => line.trim().startsWith('|')
const isSeparator = (cells) => cells.length > 0 && cells.every((c) => /^:?-{3,}:?$/.test(c))

// 围栏掩码：围栏内是**示例**，不是真实结构（与 `check-all` 的「围栏内表格不算」同一条单源口径）。
// 不掩码会把 plan 里用来展示格式的 ```## Task 9``` / ```| F-07 | Task 1 |``` 当成真节点与真映射，
// 凭空造出 dangling / 环 / 虚高的用例条数（2026-10-28 代码审查 #1）。
function contentLines(text) {
  const lines = String(text ?? '').split(/\r?\n/)
  return { lines, mask: fenceMask(lines).mask }
}

// 连续 `|` 行 = 一张表；第一行当表头，分隔行跳过。
// 两张表**相邻且无空行**时，第二张的表头会先被当成上一张的数据行——见到第二个分隔行就把上一行
// 还原成新表表头（2026-10-28 代码审查 #3：否则会让覆盖率/映射判据假红）。
function tables(lines, mask = null) {
  const out = []
  let cur = null
  for (let i = 0; i < lines.length; i++) {
    if (mask && mask[i]) {
      cur = null
      continue
    }
    const line = lines[i]
    if (!isTableLine(line)) {
      cur = null
      continue
    }
    const cells = splitRow(line)
    if (!cur) {
      cur = { header: cells, rows: [] }
      out.push(cur)
      continue
    }
    if (isSeparator(cells)) {
      if (cur.rows.length > 0) {
        const header = cur.rows.pop()
        cur = { header, rows: [] }
        out.push(cur)
      }
      continue
    }
    cur.rows.push(cells)
  }
  return out
}

const DASH = '[～~–—-]'

// `F-01～F-08` / `F-09～F-12、F-23` / `F-07` —— 区间一律展开（R3，与 R4 同一条规则）
function expandFeatures(text) {
  const set = new Set()
  const rangeRe = new RegExp(`F-(\\d{2})\\s*${DASH}\\s*(?:F-)?(\\d{2})`, 'g')
  const ranges = []
  let m
  while ((m = rangeRe.exec(text))) {
    const a = Number(m[1])
    const b = Number(m[2])
    ranges.push({ from: m.index, to: m.index + m[0].length, a, b })
    for (let i = Math.min(a, b); i <= Math.max(a, b); i++) set.add(`F-${String(i).padStart(2, '0')}`)
  }
  let rest = ''
  let last = 0
  for (const r of ranges) {
    rest += `${text.slice(last, r.from)} `
    last = r.to
  }
  rest += text.slice(last)
  for (const hit of rest.match(/F-\d{2}/g) ?? []) set.add(hit)
  return set
}

// `Task 2、Task 9` / `Task 2–7` / `T1–T7` / 裸 `T3` —— 只认任务引用形态，裸数字不取（R4 硬排除②）
function taskRefs(text) {
  const set = new Set()
  const rangeRe = new RegExp(`(?:Task|T)\\s*(\\d+)\\s*${DASH}\\s*(?:Task|T)?\\s*(\\d+)`, 'g')
  const ranges = []
  let m
  while ((m = rangeRe.exec(text))) {
    const a = Number(m[1])
    const b = Number(m[2])
    ranges.push({ from: m.index, to: m.index + m[0].length })
    for (let i = Math.min(a, b); i <= Math.max(a, b); i++) set.add(i)
  }
  let rest = ''
  let last = 0
  for (const r of ranges) {
    rest += `${text.slice(last, r.from)} `
    last = r.to
  }
  rest += text.slice(last)
  for (const m2 of rest.matchAll(/(?:Task|T)\s*(\d+)/g)) set.add(Number(m2[1]))
  return set
}

// `Consumes:` 行 → 引用集合；返回 null = 不是 Consumes 行
// 硬排除①：`Consumes:` 后紧接「无」→ 整行不取数（S3 plan 的 T1/T2 正是这一种）
function parseConsumes(line) {
  const m = /^\s*(?:-\s*)?(?:\*\*)?Consumes:(?:\*\*)?\s*(.*)$/.exec(line)
  if (!m) return null
  const rest = m[1].trim()
  if (/^[无無]/.test(rest)) return new Set()
  return taskRefs(rest)
}

// 任务块：节点标题（`^#{2,4}\s*(?:Task|T)\s*(\d+)`）到下一个 ATX 标题为止
// 节点集合**先全扫一遍**再取边——否则「Task 2 依赖后文声明的 Task 3」会被误判成 dangling。
function parseTasks(text) {
  const { lines, mask } = contentLines(text)
  const nodes = new Set()
  for (let i = 0; i < lines.length; i++) {
    if (mask[i]) continue
    const m = /^#{2,4}\s*(?:Task|T)\s*(\d+)/.exec(lines[i])
    if (m) nodes.add(Number(m[1]))
  }
  const edges = new Set()
  const dangling = []
  let current = null
  for (let i = 0; i < lines.length; i++) {
    if (mask[i]) {
      current = null
      continue
    }
    const line = lines[i]
    if (/^#{1,6}\s/.test(line)) {
      const m = /^#{2,4}\s*(?:Task|T)\s*(\d+)/.exec(line)
      current = m ? Number(m[1]) : null
      continue
    }
    if (current === null) continue
    const refs = parseConsumes(line)
    if (refs === null) continue
    for (const t of refs) {
      if (nodes.has(t)) edges.add(`${current}->${t}`)
      else dangling.push({ from: current, to: t })
    }
  }
  return { nodes, edges, dangling }
}

// 用例 ID：两种载体并集去重（R5 / Q5）；围栏内的示例 ID 不计（#1）
function testcaseIds(text) {
  const { lines, mask } = contentLines(text)
  const ids = new Set()
  for (let i = 0; i < lines.length; i++) {
    if (mask[i]) continue
    const line = lines[i]
    const a = /^#{3,4}\s+([A-Z][\w-]*?\d{2})\b/.exec(line)
    if (a) {
      ids.add(a[1])
      continue
    }
    const b = /^\|\s*([A-Z][\w-]*?\d{2})\s*\|/.exec(line)
    if (b) ids.add(b[1])
  }
  return ids
}

const verdictLine = (body, ok) => `${body} => ${ok ? 'ok' : 'fail'}`

// ── coverage ─────────────────────────────────────────────────────────────
function runCoverage(args, cwd) {
  need(args, ['--plan', '--prd', '--stage'], 'coverage')
  const planText = readInput('--plan', args['--plan'], cwd)
  const prdText = readInput('--prd', args['--prd'], cwd)
  const stage = args['--stage']
  if (!/^S\d+$/.test(stage)) usage(`--stage 必须是 S<数字>（接到「${stage}」）`)

  const prd = contentLines(prdText)
  const fsTable = tables(prd.lines, prd.mask).find((t) => (t.header[0] ?? '').includes('F') && (t.header[1] ?? '').includes('S'))
  if (!fsTable) usage('未找到 F→S 覆盖表')

  const hits = fsTable.rows.filter((r) => (r[1] ?? '').match(/S\d+/g)?.includes(stage))
  const prdFeatures = new Set()
  for (const r of hits) for (const f of expandFeatures(r[0] ?? '')) prdFeatures.add(f)

  // plan 侧功能点同样只认围栏外的记号（围栏内的示例不算覆盖，见 #1）
  const plan = contentLines(planText)
  const planTextFeatures = new Set()
  for (let i = 0; i < plan.lines.length; i++) {
    if (plan.mask[i]) continue
    for (const f of plan.lines[i].match(/F-\d{2}/g) ?? []) planTextFeatures.add(f)
  }
  const violated = []
  if (hits.length === 0) violated.push(`stage ${stage} 在 F→S 表里 0 命中`)

  const gapSet = [...prdFeatures].filter((f) => !planTextFeatures.has(f))
  for (const f of gapSet) violated.push(`缺 ${f}`)
  const inter = [...prdFeatures].filter((f) => planTextFeatures.has(f))

  // 覆盖第二半：功能点→任务映射表（按单元格值识别，不按表头；两特征合取，Q21 / Q22）
  const { nodes } = parseTasks(planText)
  const hasTaskCell = (row) => row.some((c) => /Task\s*\d+|T\d+/.test(c))
  const mapTable = tables(plan.lines, plan.mask).find((t) => t.rows.some((r) => /F-\d{2}/.test(r[0] ?? '')) && t.rows.some(hasTaskCell))
  let stepsOk = true
  if (!mapTable) {
    stepsOk = false
    violated.push('无「功能点→任务映射表」，第二半不成立')
  } else {
    for (const f of inter) {
      const row = mapTable.rows.find((r) => /F-\d{2}/.test(r[0] ?? '') && expandFeatures(r[0]).has(f))
      if (!row) {
        stepsOk = false
        violated.push(`${f} 无任务落点`)
        continue
      }
      const refs = new Set()
      for (const c of row) for (const t of taskRefs(c)) refs.add(t)
      if (refs.size === 0) {
        stepsOk = false
        violated.push(`${f} 无任务落点`)
        continue
      }
      for (const t of refs) {
        if (!nodes.has(t)) {
          stepsOk = false
          violated.push(`${f} 指向 Task ${t} 不存在`)
        }
      }
    }
  }

  const ok = gapSet.length === 0 && stepsOk && hits.length > 0
  const body = `coverage: gap ${gapSet.length}（prd ${prdFeatures.size} / plan ${inter.length}）steps ${stepsOk ? 'ok' : 'fail'}`
  return { first: verdictLine(body, ok), violations: violated, ok }
}

// ── deps ─────────────────────────────────────────────────────────────────
function runDeps(args, cwd) {
  need(args, ['--plan'], 'deps')
  const text = readInput('--plan', args['--plan'], cwd)
  const { nodes, edges, dangling } = parseTasks(text)
  const violated = []
  if (nodes.size === 0) violated.push('无任务节点（nodes 0）')
  for (const d of dangling) violated.push(`Task ${d.from} 的依赖 Task ${d.to} 不存在`)

  // Kahn：`cycle n` 的 n = 拓扑无法出队的节点数（R4 / Q3）
  const indeg = new Map([...nodes].map((n) => [n, 0]))
  const adj = new Map([...nodes].map((n) => [n, []]))
  for (const e of edges) {
    const [a, b] = e.split('->').map(Number)
    adj.get(a).push(b)
    indeg.set(b, (indeg.get(b) ?? 0) + 1)
  }
  const queue = [...nodes].filter((n) => indeg.get(n) === 0)
  let emitted = 0
  while (queue.length) {
    const n = queue.shift()
    emitted++
    for (const b of adj.get(n) ?? []) {
      indeg.set(b, indeg.get(b) - 1)
      if (indeg.get(b) === 0) queue.push(b)
    }
  }
  const cycle = nodes.size - emitted
  if (cycle > 0) {
    const stuck = [...nodes].filter((n) => indeg.get(n) > 0)
    for (const e of edges) {
      const [a, b] = e.split('->').map(Number)
      if (stuck.includes(a) && stuck.includes(b)) violated.push(`环 Task ${a} → Task ${b}`)
    }
  }

  const ok = cycle === 0 && dangling.length === 0 && nodes.size > 0
  const body = `deps: cycle ${cycle} dangling ${dangling.length}（nodes ${nodes.size} / edges ${edges.size}）`
  return { first: verdictLine(body, ok), violations: violated, ok }
}

// ── map ──────────────────────────────────────────────────────────────────
function runMap(args, cwd) {
  need(args, ['--plan'], 'map')
  const planText = readInput('--plan', args['--plan'], cwd)
  const tcLine = /^\*\*Testcase:\*\*.*?`([^`]+)`/m.exec(planText)
  if (!tcLine) usage('plan 缺 **Testcase:** 行（结构缺失）')
  const tcText = readInput('**Testcase:**', tcLine[1], cwd)

  const { lines, mask } = contentLines(planText)
  const headRe = /^(#{1,6})\s*附录 A/
  const start = lines.findIndex((l, i) => !mask[i] && headRe.test(l))
  if (start < 0) usage('plan 无「附录 A」节（结构缺失）')
  // 节边界 = 下一个**同级或更高级**标题（与 testcase P61 的「`## 附录 A` 到下一个 `## `」同口径）。
  // 原来遇任意标题即截断，附录 A 里一有 `### 说明` 就会把落点表丢掉 → 假 exit 2（2026-10-28 代码审查 #2）。
  const level = headRe.exec(lines[start])[1].length
  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) {
    if (mask[i]) continue
    const m = /^(#{1,6})\s/.exec(lines[i])
    if (m && m[1].length <= level) {
      end = i
      break
    }
  }
  const appendix = tables(lines.slice(start + 1, end), mask.slice(start + 1, end))
  const idRe = /^([A-Z][\w-]*?\d{2})$/
  const idTable = appendix.find((t) => t.rows.some((r) => idRe.test((r[0] ?? '').trim())))
  if (!idTable) usage('「附录 A」节内首列不是用例 ID（结构缺失）')

  const mappedIds = new Set(idTable.rows.map((r) => (r[0] ?? '').trim()).filter((c) => idRe.test(c)))
  const caseIds = testcaseIds(tcText)
  const violated = []
  if (caseIds.size === 0) violated.push('testcase 未解析出任何用例 ID')
  const missing = [...caseIds].filter((i) => !mappedIds.has(i))
  const dangling = [...mappedIds].filter((i) => !caseIds.has(i))
  for (const i of missing) violated.push(`missing ${i}（testcase 有、附录 A 无）`)
  for (const i of dangling) violated.push(`dangling ${i}（附录 A 有、testcase 无）`)

  const ok = missing.length === 0 && dangling.length === 0 && caseIds.size > 0
  const body = `map: missing ${missing.length} dangling ${dangling.length}（cases ${caseIds.size} / mapped ${mappedIds.size}）`
  return { first: verdictLine(body, ok), violations: violated, ok }
}

// ── size ─────────────────────────────────────────────────────────────────
// 行数单源公式（R6）：0 字节 = 0 行；纯 `\n` 的 1 字节文件 = 1 行；带末尾换行时减 1
const countLines = (text) => (text === '' ? 0 : text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0))

function runSize(args, cwd) {
  need(args, ['--spec', '--testcase'], 'size')
  const specText = readInput('--spec', args['--spec'], cwd)
  const tcText = readInput('--testcase', args['--testcase'], cwd)
  need(args, ['--rounds'], 'size')
  if (!/^\d+$/.test(args['--rounds'])) usage('--rounds 必须是整数')
  const rounds = Number(args['--rounds'])
  const specLines = countLines(specText)
  const tcCount = testcaseIds(tcText).size

  const violated = []
  if (specLines > SPEC_MAX) violated.push(`spec 行数 ${specLines} > ${SPEC_MAX}`)
  if (tcCount > TC_MAX) violated.push(`testcase 条数 ${tcCount} > ${TC_MAX}`)
  if (rounds > ROUNDS_MAX) violated.push(`议会轮数 ${rounds} > ${ROUNDS_MAX}`)

  const ok = violated.length === 0
  const body = `size: spec ${specLines}/${SPEC_MAX} tc ${tcCount}/${TC_MAX} rounds ${rounds}/${ROUNDS_MAX}`
  return { first: verdictLine(body, ok), violations: violated, ok }
}

// ── 入口 ─────────────────────────────────────────────────────────────────
function main(argv, cwd = process.cwd()) {
  const [cmd, ...rest] = argv
  try {
    const args = parseArgs(cmd, rest)
    const res =
      cmd === 'coverage'
        ? runCoverage(args, cwd)
        : cmd === 'deps'
          ? runDeps(args, cwd)
          : cmd === 'map'
            ? runMap(args, cwd)
            : runSize(args, cwd)
    console.log(res.first)
    for (const v of res.violations) console.error(`[check-plan] ${cmd}：${v}`)
    return res.ok ? 0 : 1
  } catch (e) {
    if (e instanceof UsageError) {
      console.error(`${USAGE_PREFIX}${e.message}`)
      return 2
    }
    throw e
  }
}

// 入口：本文件不被任何模块 import（testcase §0.2-1 规定用例只经 CLI 驱动），故无条件执行
process.exitCode = main(process.argv.slice(2))
