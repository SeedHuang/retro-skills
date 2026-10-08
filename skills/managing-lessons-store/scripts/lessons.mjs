#!/usr/bin/env node
// 错题集 KB 生命周期脚本（spec §4.1 / §4.5）
// 只用 Node 内置模块；导出纯函数便于 node:test 直测；底部有 CLI 入口守卫。
import { existsSync, readFileSync, statSync, accessSync, constants, mkdirSync, readdirSync, copyFileSync, writeFileSync, renameSync, rmSync, realpathSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve, dirname, relative, sep } from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

/**
 * 是否"被直接执行"（而不是被 import 进来）。
 *
 * 用 realpath 归一后再比：技能是**以 junction / 符号链接**装进运行时的，
 * 从安装目录启动时"入口路径"与"模块真实路径"字符串不同 —— 直接比字符串会误判成
 * "被 import 了"，于是整个 CLI **静默不执行**（一个字都不打印，退出码还是 0）。
 * 已踩过：在 `~\.trae-cn\skills\managing-lessons-store` 下跑 `resolve` / `deferred` 全是空的。
 */
export function isDirectRun(entry, moduleUrl) {
  if (!entry) return false
  try {
    return realpathSync(entry) === realpathSync(fileURLToPath(moduleUrl))
  } catch {
    return false
  }
}

export const SCHEMA_VERSION = 1

/** 指针文件候选（两者都查；写时优先第一个） */
export function pointerCandidates(home = homedir()) {
  return [join(home, '.agents', 'lessons.config.json'), join(home, '.trae-cn', 'lessons.config.json')]
}

/** 逐个读指针候选；首个可解析的胜出。JSON 损坏 → 返回 { broken: true, path } 以便报错 */
export function readPointer(paths) {
  for (const p of paths) {
    if (!existsSync(p)) continue
    try {
      const raw = readFileSync(p, 'utf8').replace(/^\uFEFF/, '')
      const config = JSON.parse(raw)
      if (typeof config?.store !== 'string' || config.store.trim() === '') {
        return { broken: true, path: p, reason: `指针文件缺少有效的 "store"：${p}` }
      }
      return { path: p, config }
    } catch {
      return { broken: true, path: p, reason: `指针文件损坏：${p}` }
    }
  }
  return null
}

/** KB 根的合法性校验（spec §4.1.1 五条） */
export function checkStore(root, deps) {
  const abs = resolve(root)
  if (!existsSync(abs) || !statSync(abs).isDirectory()) {
    return { ok: false, reason: `KB 路径不存在或不是目录：${abs}`, hint: '重建请运行 bootstrap（managing-lessons-store 技能）' }
  }
  const isWritable = deps.isWritable ?? ((p) => { try { accessSync(p, constants.W_OK); return true } catch { return false } })
  if (!isWritable(abs)) {
    return { ok: false, reason: `KB 路径不可写：${abs}`, hint: '检查权限，或迁移到可写位置' }
  }
  if (deps.isInsideGitRepo(abs)) {
    return { ok: false, reason: `KB 位于外层 git 仓库内：${abs}`, hint: '错题集不得被套进其它仓库（KB 自建仓库已放行）。请把 KB 移出该外层仓库' }
  }
  return { ok: true }
}

/** 解析优先级：环境变量 → 指针文件 → 无（触发 bootstrap） */
export function resolveStore({ env, pointerPaths, deps }) {
  const fromEnv = env?.LESSONS_DIR
  if (typeof fromEnv === 'string' && fromEnv.trim() !== '') {
    const c = checkStore(fromEnv, deps)
    return c.ok ? { ok: true, root: resolve(fromEnv) } : c
  }
  const ptr = readPointer(pointerPaths)
  if (ptr === null) {
    return { ok: false, reason: '未找到错题集指针，错题集尚未初始化', hint: '请运行 bootstrap（managing-lessons-store 技能）指定位置' }
  }
  if (ptr.broken) return { ok: false, reason: ptr.reason, hint: `备份后重建指针：${ptr.path}` }
  if (ptr.config.schemaVersion !== SCHEMA_VERSION) {
    return { ok: false, reason: `KB schemaVersion=${ptr.config.schemaVersion} 不受支持（支持 ${SCHEMA_VERSION}）`, hint: '迁移或重建' }
  }
  const c = checkStore(ptr.config.store, deps)
  return c.ok ? { ok: true, root: resolve(ptr.config.store) } : c
}

/** 从 index.md 的「候选与推迟」节抽表行（spec §7.1：必须带可观测信号） */
export function parseDeferredSection(indexMarkdown) {
  const lines = indexMarkdown.split(/\r?\n/)
  const start = lines.findIndex(l => /^##\s+候选与推迟/.test(l))
  if (start === -1) return []
  const rows = []
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i]
    if (/^##\s+/.test(l)) break
    const m = l.match(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/)
    if (!m) continue
    if (m[1] === '编号' || /^-+$/.test(m[1])) continue
    rows.push({ id: m[1], item: m[2], motivation: m[3], signal: m[4] })
  }
  return rows
}

/** 逐条判定信号命中（当前只实现 spec §11 的三个可计量信号） */
export function evaluateSignals(rows, c) {
  return rows.map(r => {
    let hits = false, evidence = ''
    if (/KB\s*条目.*>=\s*10/.test(r.signal)) {
      hits = c.totalCount >= 10 && c.dims >= 2
      evidence = `${c.totalCount}/10 条, ${c.dims}/2 维度`
    } else if (/KB\s*项目.*>=\s*2/.test(r.signal)) {
      hits = c.projects >= 2 && c.totalCount >= 20
      evidence = `${c.projects}/2 项目, ${c.totalCount}/20 条`
    } else if (/首次出现真冲突/.test(r.signal)) {
      hits = false
      evidence = '需人工判定（真冲突判定见 spec §3.3）'
    } else {
      evidence = '信号不可自动判定 → 交人工'
    }
    return { ...r, hits, evidence }
  })
}

/** 轮询报告：清单 + 必带计数的 summary（spec §7.2） */
export function runDeferred(root, counters) {
  const index = readFileSync(join(root, 'index.md'), 'utf8')
  const rows = evaluateSignals(parseDeferredSection(index), counters)
  const hitCount = rows.filter(r => r.hits).length
  const summary = hitCount > 0
    ? `推迟项 ${rows.length} 条（${hitCount} 条命中信号）`
    : `推迟项 ${rows.length} 条，均未命中信号`
  return { rows, summary }
}

/** 四条硬校验（spec §4.6） */
export function validateTarget(from, to) {
  const a = resolve(from), b = resolve(to)
  if (a === b) return { ok: false, reason: `目标与源相同：${b}` }
  const rel = relative(a, b)
  if (rel && !rel.startsWith('..') && !rel.startsWith(sep)) return { ok: false, reason: `目标位于源内：${b}（会无限递归复制）` }
  const rel2 = relative(b, a)
  if (rel2 && !rel2.startsWith('..') && !rel2.startsWith(sep)) return { ok: false, reason: `目标是源的祖先：${b}` }
  if (existsSync(b) && readdirSync(b).length > 0) return { ok: false, reason: `目标已存在且非空：${b}` }
  return { ok: true }
}

/** 递归哈希（相对路径 → sha256），用于迁移后一致性校验 */
export function hashTree(root) {
  const out = {}
  const walk = dir => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      if (name === '.migrating') continue
      if (statSync(p).isDirectory()) walk(p)
      else out[relative(root, p)] = createHash('sha256').update(readFileSync(p)).digest('hex')
    }
  }
  walk(root)
  return out
}

/** 外层 git 仓库探测：从「上一层」起向上找 .git（**不含** p 自己）
 *  2026-10-07 改：KB **自建**仓库（p 自己即仓库根）不再拦——用户已把远端设为私有仓库、不对外公开；
 *  只拦「KB 被套在别的仓库里」（p 的上层有 .git，KB 会被那份仓库连文件一起提交）这一真实风险形态。 */
export function isInsideGitRepo(p) {
  let cur = dirname(resolve(p))
  while (true) {
    if (existsSync(join(cur, '.git'))) return true
    const parent = dirname(cur)
    if (parent === cur) return false
    cur = parent
  }
}

/** 迁移七步（spec §4.6）：切指针放最后，任何中断旧库仍有效 */
export function migrate({ from, to, deps }) {
  const v = validateTarget(from, to)
  if (!v.ok) return { ok: false, reason: v.reason, stage: 'validate-target' }
  const root = resolve(from), target = resolve(to)
  if (deps.isInsideGitRepo(target)) return { ok: false, reason: `KB 位于外层 git 仓库内：${target}——错题集不得被套进其它仓库`, stage: 'validate-target' }
  const lock = join(root, '.migrating')
  writeFileSync(lock, String(Date.now()), 'utf8')          // 步 3.5 上锁
  try {
    mkdirSync(target, { recursive: true })                  // 步 4 复制
    const copyFile = deps.copyFile ?? copyFileSync
    try {
      for (const [relPath, content] of Object.entries(hashTree(root))) {
        const dest = join(target, relPath)
        mkdirSync(dirname(dest), { recursive: true })
        copyFile(join(root, relPath), dest)
      }
    } catch (e) {
      return { ok: false, reason: `复制失败：${e.message}`, stage: 'copy' }
    }
    const before = hashTree(root), after = hashTree(target) // 步 5 校验
    const beforeKeys = Object.keys(before).sort()
    if (JSON.stringify(beforeKeys) !== JSON.stringify(Object.keys(after).sort()) ||
        beforeKeys.some(k => before[k] !== after[k])) {
      return { ok: false, reason: `迁移校验失败：副本与源不一致（副本保留在 ${target}，请人工处置）`, stage: 'verify' }
    }
    const pointerPath = deps.pointerPath                     // 步 6 切指针（原子写）
    const tmpPath = `${pointerPath}.tmp-${Date.now()}`
    mkdirSync(dirname(pointerPath), { recursive: true })
    writeFileSync(tmpPath, JSON.stringify({ store: target, schemaVersion: SCHEMA_VERSION }, null, 2), 'utf8')
    renameSync(tmpPath, pointerPath)
    return { ok: true, hashCount: beforeKeys.length, pointerPath } // 步 7 由调用方询问是否删旧
  } finally {
    if (existsSync(lock)) rmSync(lock, { force: true })      // 步 7 删锁
  }
}

/** 表头行（cells[1]==='ID'）→ 列名 → 下标映射。列位从表头解析，后续加列不再坏 */
function ledgerColumnMap(cells) {
  const map = {}
  for (let i = 1; i < cells.length - 1; i++) if (cells[i]) map[cells[i]] = i
  return map
}

/** 三区账本行扫描：onRow(region, 维度, 状态)。列位按表头解析，缺列名退回旧下标（?? 兜底）；
 * 兼容 `区/ledger.md` 与 `区/<名>/ledger.md` 两种形态；moved(...) 原样上抛，由调用方决定是否计入；
 * 返回各区账本文件数（存储数）；单条目探测带守卫——坏链接/不可读项跳过，不崩整个命令 */
function scanLedgers(root, onRow) {
  const ledgerCounts = { projects: 0, skills: 0, universal: 0 }
  for (const region of ['projects', 'skills', 'universal']) {
    const dir = join(root, region)
    if (!existsSync(dir)) continue
    const ledgers = []
    const regionLedger = join(dir, 'ledger.md')
    if (existsSync(regionLedger)) ledgers.push(regionLedger)
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      let isDir = false
      try { isDir = statSync(p).isDirectory() } catch { continue }
      if (!isDir) continue
      const ledger = join(p, 'ledger.md')
      if (existsSync(ledger)) ledgers.push(ledger)
    }
    ledgerCounts[region] = ledgers.length
    for (const ledger of ledgers) {
      let col = null
      for (const line of readFileSync(ledger, 'utf8').split(/\r?\n/)) {
        const cells = line.split(/(?<!\\)\|/).map(s => s.trim())
        if (cells.length < 11 || cells[1] === undefined || cells[1] === '') continue
        if (cells[1] === 'ID') { col = ledgerColumnMap(cells); continue }
        if (/^-+$/.test(cells[1])) continue
        const dimCell = col ? (cells[col['维度']] ?? cells[7]) : cells[7]
        const statusCell = col ? (cells[col['状态']] ?? cells[cells.length - 2]) : cells[cells.length - 2]
        onRow(region, dimCell, statusCell)
      }
    }
  }
  return ledgerCounts
}

/** 统计 ledger 计数（供 deferred 的真实 counters）。moved(...) 墓碑：不计入 open/landed，
 * 也不计入 dims（与 statsLedger 同口径——墓碑行的维度不参与 L3-1 信号） */
export function countLedger(root) {
  const dims = new Set()
  let openCount = 0, landedCount = 0
  const ledgerCounts = scanLedgers(root, (_region, dim, status) => {
    const isLanded = typeof status === 'string' && status.startsWith('landed')
    if (status !== 'open' && !isLanded) return
    if (dim) dims.add(dim)
    if (status === 'open') openCount++
    else landedCount++
  })
  return { openCount, dims: dims.size, projects: ledgerCounts.projects, landedCount, totalCount: openCount + landedCount }
}

/** L3-1：三区 × 维度分布快照（moved 墓碑不计入；weakest = 条目最少的维度，并列全列；
 * regions = 各区账本文件数（存储数，与 countLedger.projects 同口径——L4-1 前置"项目 ≥ 2"按此判） */
export function statsLedger(root) {
  const dims = {}
  let openCount = 0, landedCount = 0
  const ledgerCounts = scanLedgers(root, (region, dim, status) => {
    const isLanded = typeof status === 'string' && status.startsWith('landed')
    if (status !== 'open' && !isLanded) return
    if (status === 'open') openCount++; else landedCount++
    if (!dim) return
    const d = dims[dim] ?? (dims[dim] = { total: 0, open: 0, landed: 0 })
    d.total++
    if (status === 'open') d.open++; else d.landed++
  })
  let weakest = []
  let min = Infinity
  for (const [name, d] of Object.entries(dims)) {
    if (d.total < min) { min = d.total; weakest = [name] }
    else if (d.total === min) weakest.push(name)
  }
  return { totalCount: openCount + landedCount, openCount, landedCount, regions: ledgerCounts, dims, weakest }
}

// ── moment（情绪记录）──────────────────────────────────────────
export const POLARITIES = ['负面', '正面', '认知']

/** `sid` 唯一合法形态：**8 位小写 hex**（= `sessionId()` 的输出）。
 *  与生成端同形，可验证：拒 `-`（防段匹配混淆）、拒正则元字符（防 `nextMomentSeq` 注入）、
 *  固定长度（防目录名越界）、拒非 hex（防误传 memory 的 session_id 之类"形态合法但不是 sid"的值）。 */
const SID_RE = /^[0-9a-f]{8}$/

/** 项目标识清洗（与 retro-collect 同规则）：去 |、换行、路径分隔符、控制字符；空白折为 - */
export function sanitizeProjectId(id) {
  const s = String(id ?? '')
    .replace(/[|\r\n/\\]/g, '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
  // `.` / `..` 是路径穿越串（join 会归一化到 projects/ 之外）→ 清洗成空，交给调用方的空值校验拒绝
  return (s === '.' || s === '..') ? '' : s
}

/** 日期 → YYYY-MM-DD（本地时区） */
function toDateStr(d) {
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** 原子写：先写临时文件再改名（防中断截断）；无 BOM */
function atomicWrite(file, content) {
  mkdirSync(dirname(file), { recursive: true })
  const tmp = `${file}.tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`
  writeFileSync(tmp, content, 'utf8')
  renameSync(tmp, file)
}

/** 折掉换行（防注入行破块结构） */
function foldOne(s) { return String(s ?? '').replace(/\r?\n/g, ' ') }

/** 校验 moment 输入（返回错误字符串或 null） */
export function validateMoment(o) {
  if (!POLARITIES.includes(o.polarity)) return `极性必须为 负面 / 正面 / 认知（收到：${o.polarity ?? '空'}）`
  if (!o.project) return '缺少 --project'
  if (!o.date) return '必须提供 --date（= session 日期，不是执行当天；防止 session 目录静默落错天）'
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(o.date)) return `--date 必须是 YYYY-MM-DD（收到：${o.date}）`
  if (!o.session) return '缺少 --session（情绪锚点，必填）'
  if (!SID_RE.test(String(o.session))) return `--session 必须是 8 位小写 hex（= \`lessons sid "<首句>"\` 的输出；收到：${o.session}）`
  const probMsg = o.polarity === '负面' ? '负面必须提供 --problem' : '正面/认知必须提供 --problem（认可 / 倾向）'
  const evMsg = o.polarity === '负面' ? '负面必须提供 --evidence（原话，不猜原因）' : '正面/认知必须提供 --evidence（原话）'
  if (!o.problem) return probMsg
  if (!o.evidence) return evMsg
  if (!o.reason) return '必须提供 --reason（判据：对象→意图→脏字→结论 的推导）'
  return null
}

/** moments.md 新建时的文件头——**从 `assets/moments-template.md` 的「## 模板」代码块读**。
 *  消除第二份真相：此前这段头在代码里硬编码一份、模板里又有一份，改一处忘另一处就会漂移
 *  （2026-10-07 实测漂移两次）。现在**只有模板是权威**，代码只负责取。
 *  取不到模板 / 格式变了 → 抛错（**不静默退回硬编码**，那等于把第二份真相请回来）。 */
let _momentsHeaderCache = null
export function momentsFileHeader() {
  if (_momentsHeaderCache !== null) return _momentsHeaderCache
  const tplPath = fileURLToPath(new URL('../assets/moments-template.md', import.meta.url))
  if (!existsSync(tplPath)) {
    throw new Error(`读不到 moments 模板：${tplPath}——无法生成文件头（请检查 skills/managing-lessons-store/assets/moments-template.md 是否存在）`)
  }
  // BOM 用显式 \uFEFF（同文件其它处一致；写成隐形字符会在review 时看不见、复制粘贴可能丢）
  // CRLF 先归一化：模板若在 Windows 下以 CRLF 落地，不归一则下面 `\n` 匹配不到，moment add 会直接抛错
  const tpl = readFileSync(tplPath, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  //先锚到 §模板 小节再找代码块：模板里有多个 ```markdown 块，全局 match 会取到「第一个」——
  //今天恰好 §模板 排在最前所以能用，但换个顺序就会静默切错块（且 cut 防线抓不到，§模板 自己也含 `## M-`）
  const at = tpl.indexOf('## 模板')
  if (at === -1) throw new Error('moments 模板里找不到「## 模板」小节——模板结构变了，请同步实现')
  const m = tpl.slice(at).match(/```markdown\n([\s\S]*?)\n```/)
  if (!m) throw new Error('moments 模板的 §模板 小节里找不到 ```markdown 代码块——模板结构变了，请同步实现')
  const block = m[1]
  const cut = block.indexOf('## M-')
  if (cut === -1) throw new Error('moments 模板的 §模板 代码块里找不到条目起点「## M-」——模板结构变了，请同步实现')
  // 模板的条目起点之前**已含`---` 分隔线**（§模板 代码块里就有），直接截断即可——**不要自己再拼一个**（会多出两条 `---`）
  _momentsHeaderCache = block.slice(0, cut).replace(/\s*$/, '') + '\n'
  return _momentsHeaderCache
}

/** 构造一条 moment 的 markdown 块（逐字对齐 spec §4.6）
 *  evidenceUp：上文若干句（**结构化参数**传入，不在文本里编码结构——spec 2026-10-07 §4.1）。
 *    每句各自one() 折行后分行输出，**不拆 one() 的注入防护**；不传时输出与改动前逐字一致。 */
export function buildMoment({ id, project, session, message, date, polarity, problem, cause, attitude, evidence, evidenceUp, reason, warn = (m) => process.stderr.write(m) }) {
  const one = (s) => String(s ?? '').replace(/\r?\n/g, ' ')   // 折掉换行，防注入行破块结构
  // evidenceUp 应为数组；传标量（误用）→ 归一为单条并告警，不静默丢数据
  let upRaw = []
  if (Array.isArray(evidenceUp)) {
    upRaw = evidenceUp
  } else if (evidenceUp !== undefined && evidenceUp !== null) {
    warn(`[warn] buildMoment：evidenceUp 应为数组，收到 ${typeof evidenceUp}，已按单条处理\n`)
    upRaw = [evidenceUp]
  }
  // 只收字符串元素：非字符串会被 `String()` 强转（对象→`[object Object]`、数组→逗号连接、数字→数字）
  // 写进 KB，而这一栏的语义是**用户原话逐字**，写进去就是脏数据且没人会发现（2026-10-08 OCR 指出）。
  const up = upRaw.filter((x) => {
    if (x === undefined || x === null) return false
    if (typeof x !== 'string') {
      warn(`[warn] buildMoment：evidenceUp 只收字符串，收到 ${typeof x}（会被 String() 强转成脏数据），已跳过\n`)
      return false
    }
    return x.trim() !== ''
  })
  // ⚠️ 上文有、触发句没有 → 整块丢弃时**必须告警**（2026-10-08 OCR 指出）：
  // 证据栏的末行固定是触发句（`> [触发] …`），没有触发句就不能出这一栏，
  // 于是「打了两条上文清洗告警、正文里却一个字都没有」——调用方只会以为是自己看错了。
  if (up.length && !evidence) {
    warn(`[warn] buildMoment：收到 ${up.length} 句上文但没有触发句（--evidence），证据栏整块未输出——`
      + '触发句是必填的，这一栏的末行固定是它\n')
  }
  /** 证据栏整串：末行=触发句；上文逐句一行。有上文才用多行形态（不传时与改动前逐字一致） */
  const evidenceBlock = (ev) => {
    if (!up.length) return `- 证据（原话）：\n  > ${one(ev ?? '')}`
    const rows = up.map((u) => `  > [上文] ${one(u)}`)
    rows.push(`  > [触发] ${one(ev ?? '')}`)
    return `- 证据（对话原文，紧邻上文→触发句）：\n${rows.join('\n')}`
  }
  const lines = [
    `## ${id}`,
    `- 极性：${polarity}｜项目：${one(project)}｜session：${one(session)}｜message：${one(message) || '—'}｜时间：${date}`,
  ]
  if (polarity === '负面') {
    lines.push(`- 状态：未解决`)
    lines.push(`- 问题：${one(problem)}`)
    lines.push(`- 判据（思考过程）：${one(reason)}`)
    // 与正/认知分支**同样**只在有触发句时输出：只传 `--evidence-up` 会产出
    // 「承诺了末行是触发句、却没有触发句」的残缺块（`momentAdd` 已由 validateMoment 拒空，
    // 这里守的是直接调用导出的 `buildMoment` 的路径）
    if (evidence) lines.push(evidenceBlock(evidence))
    if (cause) lines.push(`- 原因（推断）：${one(cause)}`)
    if (attitude) lines.push(`- 态度（推断）：${one(attitude)}`)
    lines.push(`- 解法：（结案时补）｜代价：（结案时补：讨论轮数 / 时间）`)
  } else {
    lines.push(`- 认可 / 倾向：${one(problem)}`)
    lines.push(`- 判据（思考过程）：${one(reason)}`)
    // 只在**有触发句**时输出证据栏：证据栏的末行固定是触发句，
    // 只传 `--evidence-up` 而不传 `--evidence` 会产出「承诺了触发句但没有」的残缺块。
    // （`momentAdd` 已由 validateMoment 拒空，这里守的是直接调用 `buildMoment` 的导出路径）
    if (evidence) lines.push(evidenceBlock(evidence))
  }
  return lines.join('\n')
}

/** 文本归一化：trim → 连续空白（含换行）折成单个空格 */
function normText(s) { return String(s ?? '').replace(/\s+/g, ' ').trim() }

/** session 标识（sid）：首句逐字原文 → sha256 前 8 位（小写 hex）。
 *  归一化 = normText → UTF-8；与 PowerShell 侧同算法同值（spec §2.1）。 */
export function sessionId(firstMessage) {
  return createHash('sha256').update(normText(firstMessage), 'utf8').digest('hex').slice(0, 8)
}

/** session 目录名里"摘要"一段的清洗——比 sanitizeProjectId 严：含 Windows 保留字符与结尾点（spec §3） */
export function sanitizeDirSegment(s, max = 20) {
  const cleaned = String(s ?? '')
    .replace(/[<>:"/\\|｜?*\u0000-\u001f\u007f]/g, '')   // Windows 保留字符 + 控制字符 + 全角竖线 ｜（与半角一样是字段分隔符）
    .replace(/\s+/g, '-')                              // 空白（含全角空格）折 -
    .replace(/-+/g, '-')
    .replace(/^[.\-]+|[.\-]+$/g, '')
  return [...cleaned].slice(0, max).join('').replace(/[.\-]+$/, '')  // 按码点截断（防拆开代理对）；截断后可能又露出结尾点/横线，再去一次
}

/** 列出项目下所有 session 目录名 */
function listSessionDirs(root, project) {
  const base = join(root, 'projects', project)
  if (!existsSync(base)) return []
  const dirs = []
  for (const n of readdirSync(base)) {
    try { if (statSync(join(base, n)).isDirectory()) dirs.push(n) } catch { /* 忽略不可读项 */ }
  }
  return dirs
}

/** 定位本 session 的目录（spec §4.1）：按 `<日期>-<sid>` 段匹配 → 复用；多个命中 → 报错；
 *  **仅当 sid 缺失**而该日期下恰好只有一个 session 目录 → 兜底复用（读到目录名里的 sid 后就不再需要）。 */
export function findSessionDir(root, project, date, sid) {
  const dirs = listSessionDirs(root, project)
  const dayDirs = dirs.filter((n) => n === date || n.startsWith(`${date}-`))
  const hits = sid ? dayDirs.filter((n) => n === `${date}-${sid}` || n.startsWith(`${date}-${sid}-`)) : []
  if (hits.length > 1) return { ok: false, reason: `同日同 sid 命中多个目录（${hits.join('、')}）——歧义，请人工处理` }
  if (hits.length === 1) return { ok: true, dir: hits[0] }
  if (!sid && dayDirs.length === 1) return { ok: true, dir: dayDirs[0], fallback: true }
  return { ok: true, dir: null }
}

/** 读已有 session 目录里 facts.md 头记的首句原文（供碰撞护栏比对）；没记则 null */
export function readRecordedFirstMessage(root, project, dir) {
  const f = join(root, 'projects', project, dir, 'facts.md')
  if (!existsSync(f)) return null
  const text = readFileSync(f, 'utf8').replace(/^\uFEFF/, '')
  const at = text.indexOf('- session：')
  if (at < 0) return null
  // 按 ｜ 切格找「首句：」格——与相邻字段名 / 顺序解耦（`memory id` 是可选栏，可能整栏缺失）
  const cell = text.slice(at).split('｜').find((c) => c.trim().startsWith('首句：'))
  return cell ? normText(cell.trim().slice('首句：'.length)) : null
}

/** 本 session 文件里已有条目数 + 1（按 sid 计数） */
function nextMomentSeq(text, sid) {
  const re = new RegExp(`^##\\s+M-${sid}-(\\d+)\\s*$`, 'gm')
  let max = 0, m
  while ((m = re.exec(text))) max = Math.max(max, Number(m[1]))
  return max + 1
}

/** 追加一条 moment；返回 {ok, id, file} 或 {ok:false, reason} */
export function momentAdd(root, opts, deps = {}) {
  if (existsSync(join(root, '.migrating'))) return { ok: false, reason: '错题集正在迁移中，请等迁移结束后重试' }
  const bad = validateMoment(opts)
  if (bad) return { ok: false, reason: bad }
  const project = sanitizeProjectId(opts.project)
  if (!project) return { ok: false, reason: '项目标识清洗后为空' }
  const date = opts.date // 必填（validateMoment 已校验）= session 日期，不是执行当天
  const sid = normText(opts.session)
  // 定位本 session 目录（§4.1：段匹配 → 复用；同日唯一目录 → 兜底；都不行 → 新建）
  const loc = findSessionDir(root, project, date, sid)
  if (!loc.ok) return { ok: false, reason: loc.reason }
  let dirName = loc.dir
  if (dirName && opts.firstMessage) {   // 碰撞护栏（spec §2.2）：命中已有目录时核对首句
    const rec = readRecordedFirstMessage(root, project, dirName)
    if (rec && rec !== normText(opts.firstMessage)) {
      return { ok: false, reason: `sid 命中已有目录「${dirName}」，但首句不一致——疑似碰撞，请人工核对；本次未写入` }
    }
    if (!rec) process.stderr.write(`[warn] moment add：目录「${dirName}」已存在但 facts.md 头没记首句，碰撞护栏本次未生效\n`)
  }
  if (!dirName) {
    // 新建目录时 `--summary` **必填**（spec §3）：目录名是人翻 KB 时唯一能认出"这是哪个 session"的东西，
    // 缺了就只剩一串 hash。已存在的目录不需要（目录永不改名，摘要只在创建那一次用）。
    const seg = sanitizeDirSegment(opts.summary)
    if (!seg) return { ok: false, reason: '新建 session 目录必须提供 --summary（≤20 字主题短语，如 "dry-refactor-newadd"）——它是人翻 KB 时唯一能认出这个 session 的东西；清洗后为空也算缺失' }
    dirName = `${date}-${sid}-${seg}`
  }
  const file = join(root, 'projects', project, dirName, 'moments.md')
  // 模板缺失 / 结构漂移时 momentsFileHeader() 会抛错，但本函数（本文件所有记账函数）的契约是
  // **返回 { ok:false, reason } 从不抛**。这里就地转成返回值，否则 CLI 那边拿到的是裸栈、不是「记账失败：…」提示。
  let text
  if (existsSync(file)) {
    text = readFileSync(file, 'utf8').replace(/^\uFEFF/, '')
  } else {
    try {
      text = momentsFileHeader()
    } catch (e) {
      return { ok: false, reason: `读不到 moments 文件头：${e.message}` }
    }
  }
  if (!opts.message) process.stderr.write(`[warn] moment add：未提供 --message，事后无法定位到具体对话（仅 session 级可查）\n`)
  const id = `M-${sid}-${nextMomentSeq(text, sid)}`
  const block = buildMoment({ id, project, session: opts.session, message: opts.message, date, polarity: opts.polarity, problem: opts.problem, cause: opts.cause, attitude: opts.attitude, evidence: opts.evidence, evidenceUp: opts.evidenceUp, reason: opts.reason })
  atomicWrite(file, text.replace(/\s*$/, '') + '\n\n' + block + '\n')
  return { ok: true, id, file, dir: dirName }
}

/** 结案：只改指定条目的状态与解法/代价行，其余行原样保留 */
export function momentResolve(root, opts) {
  if (existsSync(join(root, '.migrating'))) return { ok: false, reason: '错题集正在迁移中，请等迁移结束后重试' }
  if (!opts.project) return { ok: false, reason: '缺少 --project' }
  if (!opts.id) return { ok: false, reason: '缺少 --id' }
  if (!opts.solution) return { ok: false, reason: '缺少 --solution' }
  if (!/^M-(?:[^\s-]+|\d{4}-\d{2}-\d{2})-\d+$/.test(String(opts.id))) {
    return { ok: false, reason: `--id 格式应为 M-<sid>-N 或 M-YYYY-MM-DD-N（收到：${opts.id}）` }
  }
  const project = sanitizeProjectId(opts.project)
  if (!project) return { ok: false, reason: '项目标识清洗后为空' }
  // 定位（spec §6.1）：扫项目下各 session 目录的 moments.md，按标题精确找——新旧 id 同一套逻辑
  const hits = []
  for (const d of listSessionDirs(root, project)) {
    const f = join(root, 'projects', project, d, 'moments.md')
    if (!existsSync(f)) continue
    const text = readFileSync(f, 'utf8').replace(/^\uFEFF/, '')
    // 按标题出现**次数**计歧义（spec §6.1-F）：同一文件里重复同名标题也算，不能静默取第一个
    const n = text.split('\n').filter((l) => l.trim() === `## ${opts.id}`).length
    for (let k = 0; k < n; k++) hits.push({ f, text })
  }
  if (!hits.length) return { ok: false, reason: `找不到条目 ${opts.id}（文件未改动）` }
  if (hits.length > 1) return { ok: false, reason: `条目 ${opts.id} 在多处出现（${hits.length} 处）——歧义，请人工处理` }
  const file = hits[0].f
  const lines = hits[0].text.split('\n')
  let start = -1
  for (let i = 0; i < lines.length; i++) if (lines[i].trim() === `## ${opts.id}`) { start = i; break }
  if (start === -1) return { ok: false, reason: `找不到条目 ${opts.id}（文件未改动）` }
  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) if (/^##\s+/.test(lines[i])) { end = i; break }
  let changed = 0
  let polarity = ''
  for (let i = start + 1; i < end; i++) {
    const m = lines[i].match(/^- 极性：([^｜\s]+)/)
    if (m) polarity = m[1]
    if (/^- 状态：/.test(lines[i])) { lines[i] = '- 状态：已解决'; changed++ }
    else if (/^- 解法：/.test(lines[i])) {
      const esc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')
      lines[i] = `- 解法：${esc(opts.solution)}｜代价：${esc(opts.cost) || '—'}`
      changed++
    }
  }
  if (polarity && polarity !== '负面' && polarity !== '负向') return { ok: false, reason: `条目 ${opts.id} 极性为「${polarity}」，不结案（正面/认知走画像管线）` }
  if (changed === 0) return { ok: false, reason: `条目 ${opts.id} 无可改字段（文件未改动）` }
  atomicWrite(file, lines.join('\n'))
  return { ok: true, id: opts.id }
}

/** 清空本 session 的 moments.md 条目区（供 collect 重扫覆盖用）；文件头与非 moment 标题原样保留。
 *  文件即本 session（spec §4.3）——故不再按 session 字段过滤。 */
export function momentDrop(root, opts) {
  if (existsSync(join(root, '.migrating'))) return { ok: false, reason: '错题集正在迁移中，请等迁移结束后重试' }
  if (!opts.project) return { ok: false, reason: '缺少 --project' }
  if (!opts.date) return { ok: false, reason: '必须提供 --date（= session 日期，不是执行当天）' }
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(opts.date)) return { ok: false, reason: `--date 必须是 YYYY-MM-DD（收到：${opts.date}）` }
  if (!opts.session) return { ok: false, reason: '缺少 --session（sid）' }
  if (!SID_RE.test(String(opts.session))) return { ok: false, reason: `--session 必须是 8 位小写 hex（收到：${opts.session}）` }
  const project = sanitizeProjectId(opts.project)
  if (!project) return { ok: false, reason: '项目标识清洗后为空' }
  // 定位本 session 目录（spec §4.1）；`--date` 转护栏——目录名日期与它不符就找不到（防找错目录）
  const loc = findSessionDir(root, project, opts.date, normText(opts.session))
  if (!loc.ok) return { ok: false, reason: loc.reason }
  if (!loc.dir) return { ok: true, removed: 0, noDir: true }   // 该日期下还没有本 session 的目录（首次收集的正常态）。与 fileMissing **互斥**——fileMissing 只表示"目录在、没 moments.md"（spec §7 / §11-9）
  const file = join(root, 'projects', project, loc.dir, 'moments.md')
  if (!existsSync(file)) return { ok: true, removed: 0, fileMissing: true }      // 目录在，只是还没记过情绪
  const lines = readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split('\n')
  const heads = []
  // 块边界用 `^##\s+`（与 momentResolve 同口径）：非 moment 标题（如手加的「## 备注」）独立成块，
  // 不会被并进前一个 moment 块的删除区间而遭误删
  for (let i = 0; i < lines.length; i++) if (/^##\s+/.test(lines[i])) heads.push(i)
  if (!heads.length) return { ok: true, removed: 0 }
  const keep = []
  let removed = 0
  let resolvedRemoved = 0
  for (let k = 0; k < heads.length; k++) {
    const s = heads[k]
    const e = k + 1 < heads.length ? heads[k + 1] : lines.length
    if (/^##\s+M-/.test(lines[s])) {
      // 已结案条目也照清（重扫会重写）——但解法 / 代价是**人写的判断**，重扫造不回来：
      // 单独计数回报，让 collect 能提示"这几条要重新结案"（2026-10-02 评审补，防静默丢数据）
      if (lines.slice(s, e).some((l) => /^- 状态：已解决/.test(l))) resolvedRemoved++
      removed++
      continue
    }
    keep.push([s, e])                                        // 非 moment 标题 → 保留
  }
  if (removed === 0) return { ok: true, removed: 0, resolvedRemoved: 0 }
  const out = lines.slice(0, heads[0])
  for (const [s, e] of keep) out.push(...lines.slice(s, e))
  atomicWrite(file, out.join('\n').replace(/\s*$/, '') + '\n')
  return { ok: true, removed, resolvedRemoved }
}

/** 统计某项目所有 session 目录里 moments.md 的总条数与未结案数 */
export function momentsSummary(root, project) {
  if (!project) return { total: 0, open: 0 }
  const pj = sanitizeProjectId(project)
  const base = join(root, 'projects', pj)
  if (!existsSync(base)) return { total: 0, open: 0 }
  let total = 0, open = 0
  for (const d of listSessionDirs(root, pj)) {
    const f = join(base, d, 'moments.md')
    if (!existsSync(f)) continue
    for (const line of readFileSync(f, 'utf8').split(/\r?\n/)) {
      if (/^##\s+M-/.test(line)) total++
      if (/^- 状态：未解决/.test(line)) open++
    }
  }
  return { total, open }
}

/** 画像文件年龄（天）；找不到返回 null */
export function profileAgeDays(deps = {}) {
  const p = join(deps.home ?? homedir(), '.trae-cn', 'memory', 'user_profile.md')
  if (!existsSync(p)) return null
  const now = (deps.now ?? (() => new Date()))()
  return Math.floor((now.getTime() - statSync(p).mtimeMs) / 86400000)
}

// ── ledger 查询（show / find）───────────────────────────────────
/** 列出三区账本每一行（含表头映射），供 show/find 用 */
export function listLedgerRows(root) {
  const rows = []
  for (const region of ['projects', 'skills', 'universal']) {
    const dir = join(root, region)
    if (!existsSync(dir)) continue
    const files = []
    const rl = join(dir, 'ledger.md')
    if (existsSync(rl)) files.push(rl)
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      let isDir = false
      try { isDir = statSync(p).isDirectory() } catch { continue }
      if (!isDir) continue
      const l = join(p, 'ledger.md')
      if (existsSync(l)) files.push(l)
    }
    for (const f of files) {
      let col = null
      for (const line of readFileSync(f, 'utf8').split(/\r?\n/)) {
        const cells = line.split(/(?<!\\)\|/).map(s => s.trim())
        if (cells.length < 11 || !cells[1]) continue
        if (cells[1] === 'ID') { col = ledgerColumnMap(cells); continue }
        if (/^-+$/.test(cells[1])) continue
        rows.push({ region, file: f, id: cells[1], cells, col })
      }
    }
  }
  return rows
}

function pickCell(r, name, fallback) {
  if (r.col && r.col[name] != null) return r.cells[r.col[name]] ?? ''
  return fallback != null ? (r.cells[fallback] ?? '') : ''
}

export function showEntry(root, id) {
  const hit = listLedgerRows(root).find(r => r.id === id)
  if (!hit) return { ok: false, reason: `未找到条目 ${id}` }
  return {
    ok: true,
    entry: {
      id: hit.id, region: hit.region,
      dim: pickCell(hit, '维度', 7),
      carrier: pickCell(hit, '载体', hit.cells.length - 3),
      status: pickCell(hit, '状态', hit.cells.length - 2),
      problem: pickCell(hit, '问题', 5),
    },
  }
}

export function findEntries(root, kw) {
  return listLedgerRows(root)
    .filter(r => r.cells.some(c => c.includes(kw)))
    .map(r => ({ id: r.id, region: r.region, dim: pickCell(r, '维度', 7), status: pickCell(r, '状态', r.cells.length - 2), problem: pickCell(r, '问题', 5) }))
}

// ── 体积守卫 ───────────────────────────────────────────────────
/** 主账超阈值（默认 >100 行 或 open>20）→ 返回提醒项 */
export function sizeGuard(root, { maxRows = 100, maxOpen = 20 } = {}) {
  const out = []
  for (const region of ['projects', 'skills', 'universal']) {
    const dir = join(root, region)
    if (!existsSync(dir)) continue
    const files = []
    const rl = join(dir, 'ledger.md')
    if (existsSync(rl)) files.push({ name: `${region}/ledger.md`, file: rl })
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      let isDir = false
      try { isDir = statSync(p).isDirectory() } catch { continue }
      if (!isDir) continue
      const l = join(p, 'ledger.md')
      if (existsSync(l)) files.push({ name: `${region}/${name}`, file: l })
    }
    for (const { name, file } of files) {
      let rows = 0, open = 0
      for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
        const cells = line.split(/(?<!\\)\|/).map(s => s.trim())
        if (cells.length < 11 || !cells[1]) continue
        if (cells[1] === 'ID' || /^-+$/.test(cells[1])) continue
        rows++
        if (cells[cells.length - 2] === 'open') open++
      }
      if (rows > maxRows || open > maxOpen) out.push({ name, rows, open })
    }
  }
  return out
}

// ── verify（有效性验证：算分 / 趋势 / 对账）─────────────────────
const VERIFY_HEADER = '| 期 | 日期 | 机会A | 复发B | 新问题N | 认可P | 预期复发率(%) | 复发信号 | 备注 |\n|---|---|---|---|---|---|---|---|---|'

/** 目标（技能名 或 KB 条目 ID）→ 台账文件路径 */
export function resolveVerifyFile(root, target) {
  if (!target) return { ok: false, reason: '缺少目标（技能名，或 KB 条目 ID）' }
  const skillDir = join(root, 'skills', target)
  try { if (statSync(skillDir).isDirectory()) return { ok: true, kind: 'skill', file: join(skillDir, 'effectiveness.md') } } catch { /* 不是技能目录，继续按条目 ID 找 */ }
  const hit = listLedgerRows(root).find(r => r.id === target)
  if (hit) return { ok: true, kind: 'entry', file: join(dirname(hit.file), 'effectiveness.md') }
  return { ok: false, reason: `未找到目标 ${target}（既不是 skills/ 下的技能名，也不是 KB 条目 ID）` }
}

/** 解析台账表 → 期行数组（表头/分隔行跳过，无法评分的期标记 unrated） */
export function parseEffectiveness(text) {
  const rows = []
  for (const line of String(text ?? '').replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const c = line.split('|').map(s => s.trim())
    if (c.length < 11) continue
    const period = c[1]
    if (!period || period === '期' || /^-+$/.test(period)) continue
    const num = (x) => (x === '' || x === '—' || x === '-' ? null : (Number.isFinite(Number(x)) ? Number(x) : null))
    const a = num(c[3])
    if (a == null) { rows.push({ period, date: c[2], unrated: true }); continue }
    rows.push({ period, date: c[2], a, b: num(c[4]) ?? 0, n: num(c[5]) ?? 0, p: num(c[6]) ?? 0, expect: c[7] || '—', signal: c[8] || '—', note: c[9] || '' })
  }
  return rows
}

/** 比率 → 百分比（一位小数）；分母 0 → null */
function pct(b, a) { return a > 0 ? Math.round((b / a) * 1000) / 10 : null }

/** 置信度（按机会数 A） */
export function confidenceOf(a) {
  if (a == null) return '无法评分（无机会数）'
  if (a <= 1) return '样本不足（不打分）'
  if (a <= 4) return '仅定性'
  if (a <= 9) return '量级可参考'
  return '趋势可信'
}

/** Δ 复发率（百分点）→ 5 档 */
export function gradeFromDelta(delta) {
  if (delta <= -30) return '明显变好'
  if (delta <= -10) return '略微变好'
  if (delta < 10) return '看不出差别'
  if (delta < 30) return '有劣化趋势'
  return '明显劣化趋势'
}

/** 预期区间 "20-35" → [20,35]；解析不出 → null */
export function parseExpectRange(s) {
  const m = String(s ?? '').match(/(\d+(?:\.\d+)?)\s*[-~–至]\s*(\d+(?:\.\d+)?)/)
  return m ? [Number(m[1]), Number(m[2])] : null
}

/** 实测% vs 预期区间（+ 上期%）→ 对账结论 */
export function compareExpect(actual, expectStr, prev) {
  if (actual == null) return '无实测值（无法对账）'
  const rg = parseExpectRange(expectStr)
  if (!rg) return '未填预期区间 → 只做趋势，不做对账'
  const [lo, hi] = rg
  let v = actual <= lo ? '达到或超出预期' : (actual <= hi ? '达到预期（区间内）' : '未达到预期')
  if (prev != null && actual > prev) v += '；且比上期回升，疑似劣化'
  return v
}

/** 追加一期（台账不存在则建表头）；原子写 */
export function verifyRecord(root, file, o) {
  if (existsSync(join(root, '.migrating'))) return { ok: false, reason: '错题集正在迁移中，请等迁移结束后重试' }
  if (!o.period) return { ok: false, reason: '缺少 --period（如 改前 / 改后1）' }
  const a = Number(o.a)
  if (!Number.isInteger(a) || a < 0) return { ok: false, reason: `--a 必须是非负整数（收到：${o.a ?? '空'}）` }
  const numOr0 = (x, name) => {
    if (x == null || x === '') return { v: 0 }
    const n = Number(x)
    if (!Number.isInteger(n) || n < 0) return { err: `--${name} 必须是非负整数（收到：${x}）` }
    return { v: n }
  }
  const bb = numOr0(o.b, 'b'); if (bb.err) return { ok: false, reason: bb.err }
  const nn = numOr0(o.n, 'n'); if (nn.err) return { ok: false, reason: nn.err }
  const pp = numOr0(o.p, 'p'); if (pp.err) return { ok: false, reason: pp.err }
  const date = o.date || toDateStr(new Date())
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)) return { ok: false, reason: `--date 必须是 YYYY-MM-DD（收到：${date}）` }
  const cell = (s) => foldOne(s ?? '') || '—'
  const row = `| ${cell(o.period)} | ${date} | ${a} | ${bb.v} | ${nn.v} | ${pp.v} | ${cell(o.expect)} | ${cell(o.signal)} | ${cell(o.note)} |`
  let base
  if (!existsSync(file)) base = `# 有效性台账\n\n${VERIFY_HEADER}`
  else {
    const text = readFileSync(file, 'utf8').replace(/^\uFEFF/, '').replace(/\s*$/, '')
    base = /^\|\s*期\s*\|/m.test(text) ? text : `${text}\n\n${VERIFY_HEADER}`
  }
  atomicWrite(file, base + '\n' + row + '\n')
  return { ok: true, file, period: o.period }
}

function readRated(file) {
  if (!existsSync(file)) return { ok: false, reason: '尚无台账，请先 verify record 记一期' }
  const rows = parseEffectiveness(readFileSync(file, 'utf8')).filter(r => !r.unrated)
  if (!rows.length) return { ok: false, reason: '台账里还没有可用的期（计数为空或标了「无法评分」）' }
  return { ok: true, rows }
}

/** 末期水平 + 置信度 */
export function verifyScore(file) {
  const r = readRated(file)
  if (!r.ok) return r
  const last = r.rows[r.rows.length - 1]
  return { ok: true, row: last, recurrence: pct(last.b, last.a), newProblem: pct(last.n, last.a), approval: pct(last.p, last.a), confidence: confidenceOf(last.a) }
}

/** 逐期 Δ → 5 档 */
export function verifyTrend(file) {
  const r = readRated(file)
  if (!r.ok) return r
  return {
    ok: true,
    points: r.rows.map((row, i) => {
      const recur = pct(row.b, row.a)
      const prev = i > 0 ? pct(r.rows[i - 1].b, r.rows[i - 1].a) : null
      const delta = (prev != null && recur != null) ? Math.round((recur - prev) * 10) / 10 : null
      return { period: row.period, date: row.date, a: row.a, recur, delta, grade: delta == null ? '基线' : gradeFromDelta(delta), confidence: confidenceOf(row.a) }
    }),
  }
}

/** 末期实测 vs 事前预期 */
export function verifyExpect(file) {
  const r = readRated(file)
  if (!r.ok) return r
  const last = r.rows[r.rows.length - 1]
  const actual = pct(last.b, last.a)
  const prev = r.rows.length > 1 ? pct(r.rows[r.rows.length - 2].b, r.rows[r.rows.length - 2].a) : null
  return { ok: true, period: last.period, actual, expect: last.expect, prev, verdict: compareExpect(actual, last.expect, prev) }
}

/** 本 CLI 认得的全部 flag——用于区分「漏值」与「原话本身以 -- 开头」。
 *  判据：**只跳过已知 flag**，未知的一律当正文收进来（否则逐字原话以 `--` 开头会被静默丢掉，
 *  而这个功能存在的意义就是「原话一个字都不丢」，spec 2026-10-07 §4.1）。 */
export const CLI_FLAGS = new Set([
  '--project', '--session', '--date', '--summary', '--first-message', '--message',
  '--polarity', '--problem', '--cause', '--attitude', '--evidence', '--evidence-up',
  '--reason', '--id', '--solution', '--cost',
  // verify record 段（守卫：CLI 收的每个 flag 都必须登记，漏一个就会被当成用户原话）
  '--period', '--a', '--b', '--n', '--p', '--expect', '--signal', '--note',
  // migrate 段走 `process.argv.indexOf('--to')`（不是 argOf/argAll）——同样要登记
  '--to',
])

/** 漏值判定：`v` 是不是「本该有值却只跟了一个 flag」——单值/多值两条解析器**共用**这一条
 *
 *  抽成函数的原因：曾只有 argAllOf 有这个判定，argOf 无条件 `argv[i + 1]`，
 *  于是 `--evidence --project foo` 把 `--project` 当逐字原话写进证据栏（实测复现，零告警）。
 *  两边各写一份必然再次分叉——**同一个坑，不许开两个实现**。
 *  纯函数（可单测）。 */
function missingValue(v) { return v === undefined || CLI_FLAGS.has(String(v)) }

/** 收集 argv 里全部同名参数值，**按出现顺序**（spec 2026-10-07 §4.1）。
 *  下一个是**已知 flag** 时视为「漏值」并跳过 + 告警——不把 flag 当正文收进去；
 *  未知（用户原话恰好以 `--` 开头）照收不误。
 *  纯函数（argv 入参），**可单测**。 */
export function argAllOf(argv, f, warn = (m) => process.stderr.write(m)) {
  const out = []
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] !== f) continue
    const v = argv[i + 1]
    if (missingValue(v)) {
      warn(`[warn] ${f} 后面没有值，已跳过（读到：${v ?? 'EOF'}）\n`)
      continue
    }
    out.push(v)
  }
  return out
}

/** 取**第一个**「有值的」同名参数（单值参数用），漏值判定与 `argAllOf` **同一套**。
 *  纯函数（argv 入参），**可单测**。
 *
 *  ⚠️ 别退回 `i === -1 ? undefined : argv[i + 1]`（2026-10-08 OCR 指出，实测已复现）：
 *  那样 `--evidence --project foo` 会把 `--project` 当成逐字原话写进证据栏，**零告警**，
 *  而那一栏的语义是「用户原话，一个字都不许被污染」。
 *
 *  ⚠️ 漏值处**跳过继续扫**，不是 `return undefined`（2026-10-08 OCR 指出）：
 *  `--evidence --evidence "原话"` 时首个 occurrence 漏值、后一个有效——
 *  直接返回会让「明明传了值」变成 `undefined`（`argAllOf` 会跳过漏值取到 `["原话"]`）。
 *  单值/多值两条解析器必须同一种漏值语义：跳过 + 告警 + 继续找有效值。 */
export function argOneOf(argv, f, warn = (m) => process.stderr.write(m)) {
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] !== f) continue
    const v = argv[i + 1]
    if (missingValue(v)) {
      warn(`[warn] ${f} 后面没有值，已忽略（读到：${v ?? 'EOF'}）\n`)
      continue
    }
    return v
  }
  return undefined
}

// ── CLI 入口守卫：仅当被直接执行时运行 ────────────────────────────
const isMain = isDirectRun(process.argv[1], import.meta.url)
if (isMain) {
  const cmd = process.argv[2]
  // 单值取值走 `argOneOf`（**漏值判定与 argAllOf 共用**，见missingValue 的注释）：
  // 内联 `argv[i + 1]` 会把 `--project` 当逐字原话写进证据栏且零告警——实测复现过。
  const argOf = (f) => argOneOf(process.argv, f)
  const argAll = (f) => argAllOf(process.argv, f)
  if (cmd === 'sid') {
    const msg = process.argv.slice(3).join(' ')
    if (!msg) { process.stderr.write('用法：lessons sid "<本 session 用户第一条消息的逐字原文>"\n'); process.exit(1) }
    process.stdout.write(sessionId(msg) + '\n'); process.exit(0)
  }
  else if (cmd === 'resolve') {
    const r = resolveStore({ env: process.env, pointerPaths: pointerCandidates(), deps: { isInsideGitRepo } })
    if (r.ok) { process.stdout.write(r.root + '\n'); process.exit(0) }
    process.stderr.write(`${r.reason}\n下一步：${r.hint}\n`)
    process.exit(1)
  }
  else if (cmd === 'deferred') {
    const r = resolveStore({ env: process.env, pointerPaths: pointerCandidates(), deps: { isInsideGitRepo } })
    if (!r.ok) { process.stderr.write(`${r.reason}\n下一步：${r.hint}\n`); process.exit(1) }
    const counters = countLedger(r.root)
    const { rows, summary } = runDeferred(r.root, counters)
    for (const row of rows) process.stdout.write(`- ${row.id} ${row.item}｜信号：${row.signal}｜${row.hits ? '命中' : '未命中'}（${row.evidence}）\n`)
    const project = argOf('--project')
    const ms = momentsSummary(r.root, project)
    const age = profileAgeDays()
    const parts = [summary]
    if (project) parts.push(`未结案情绪 ${ms.open} 条`)
    parts.push(`画像 ${age == null ? '未找到' : age + ' 天未更新'}`)
    process.stdout.write(parts.join('；') + '\n')
    for (const g of sizeGuard(r.root)) process.stdout.write(`提醒：${g.name} 主账 ${g.rows} 行 / ${g.open} 条 open，建议尽早复盘收口（否则每次读它都白烧 token）\n`)
    process.exit(0)
  }
  else if (cmd === 'stats') {
    const r = resolveStore({ env: process.env, pointerPaths: pointerCandidates(), deps: { isInsideGitRepo } })
    if (!r.ok) { process.stderr.write(`${r.reason}\n下一步：${r.hint}\n`); process.exit(1) }
    const s = statsLedger(r.root)
    const lines = [`KB 统计（${r.root}）`]
    lines.push(`条目 ${s.totalCount}（open ${s.openCount} / landed ${s.landedCount}）｜项目 ${s.regions.projects} ｜技能 ${s.regions.skills} ｜通用 ${s.regions.universal}`)
    lines.push('维度分布：')
    for (const [name, d] of Object.entries(s.dims).sort((a, b) => b[1].total - a[1].total)) {
      lines.push(`  ${name}  ${d.total}（open ${d.open} / landed ${d.landed}）`)
    }
    if (s.weakest.length) lines.push(`薄弱面：${s.weakest.join('、')}（条目最少）`)
    process.stdout.write(lines.join('\n') + '\n')
    process.exit(0)
  }
  else if (cmd === 'migrate') {
    const toIdx = process.argv.indexOf('--to')
    const to = toIdx === -1 ? undefined : process.argv[toIdx + 1]
    if (!to) { process.stderr.write('用法：lessons migrate --to <path>\n'); process.exit(1) }
    const r0 = resolveStore({ env: process.env, pointerPaths: pointerCandidates(), deps: { isInsideGitRepo } })
    if (!r0.ok) { process.stderr.write(`${r0.reason}\n下一步：${r0.hint}\n`); process.exit(1) }
    const ptr = pointerCandidates().find(p => existsSync(p)) ?? pointerCandidates()[0]
    const r = migrate({ from: r0.root, to, deps: { pointerPath: ptr, isInsideGitRepo } })
    if (!r.ok) { process.stderr.write(`迁移失败（${r.stage}）：${r.reason}\n`); process.exit(1) }
    process.stdout.write(`迁移完成：${r.hashCount} 个文件已校验一致；指针 → ${r.pointerPath}\n是否删除旧库由你决定（旧库仍完整可用）\n`)
    process.exit(0)
  }
  else if (cmd === 'moment') {
    const r = resolveStore({ env: process.env, pointerPaths: pointerCandidates(), deps: { isInsideGitRepo } })
    if (!r.ok) { process.stderr.write(`${r.reason}\n下一步：${r.hint}\n`); process.exit(1) }
    const sub = process.argv[3]
    if (sub === 'add') {
      const res = momentAdd(r.root, { project: argOf('--project'), session: argOf('--session'), message: argOf('--message'), date: argOf('--date'), summary: argOf('--summary'), firstMessage: argOf('--first-message'), polarity: argOf('--polarity'), problem: argOf('--problem'), cause: argOf('--cause'), attitude: argOf('--attitude'), evidence: argOf('--evidence'), evidenceUp: argAll('--evidence-up'), reason: argOf('--reason') })
      if (!res.ok) { process.stderr.write(`记账失败：${res.reason}\n`); process.exit(1) }
      process.stdout.write(`已记入情绪档案：${res.id}（目录 ${res.dir}）\n`); process.exit(0)
    } else if (sub === 'resolve') {
      const res = momentResolve(r.root, { project: argOf('--project'), id: argOf('--id'), solution: argOf('--solution'), cost: argOf('--cost') })
      if (!res.ok) { process.stderr.write(`结案失败：${res.reason}\n`); process.exit(1) }
      process.stdout.write(`已结案：${res.id}\n`); process.exit(0)
    } else if (sub === 'drop') {
      const res = momentDrop(r.root, { project: argOf('--project'), date: argOf('--date'), session: argOf('--session') })
      if (!res.ok) { process.stderr.write(`清除失败：${res.reason}\n`); process.exit(1) }
      if (res.noDir) process.stdout.write(`该日期下还没有本 session 的目录——首次收集时属正常，接着 moment add --summary "<≤20字主题>" 建目录即可（新建目录缺 --summary 会被拒）；只有当你确信目录该存在时，才需要复核日期 / sid。本次未改动任何文件\n`)
      else if (res.fileMissing) process.stdout.write(`目录在，但还没有 moments.md（尚未记过情绪）——属正常；本次未改动任何文件\n`)
      else if (res.removed === 0) process.stdout.write(`本 session 无条目，未改动\n`)
      else if (res.resolvedRemoved) process.stdout.write(`已清除本 session 旧条目 ${res.removed} 条——其中 ${res.resolvedRemoved} 条已结案：解法 / 代价是人写的判断，重扫造不回来，重扫完须重新结案\n`)
      else process.stdout.write(`已清除本 session 旧条目 ${res.removed} 条\n`)
      process.exit(0)
    }
    process.stderr.write('用法：lessons moment add|resolve|drop --project <标识> ...\n'); process.exit(1)
  }
  else if (cmd === 'show') {
    const r = resolveStore({ env: process.env, pointerPaths: pointerCandidates(), deps: { isInsideGitRepo } })
    if (!r.ok) { process.stderr.write(`${r.reason}\n下一步：${r.hint}\n`); process.exit(1) }
    const id = process.argv[3]
    if (!id) { process.stderr.write('用法：lessons show <ID>\n'); process.exit(1) }
    const res = showEntry(r.root, id)
    if (!res.ok) { process.stderr.write(`${res.reason}\n`); process.exit(1) }
    const e = res.entry
    process.stdout.write(`${e.id}｜${e.region}｜维度 ${e.dim}｜载体 ${e.carrier}｜状态 ${e.status}\n  ${e.problem}\n`); process.exit(0)
  }
  else if (cmd === 'find') {
    const r = resolveStore({ env: process.env, pointerPaths: pointerCandidates(), deps: { isInsideGitRepo } })
    if (!r.ok) { process.stderr.write(`${r.reason}\n下一步：${r.hint}\n`); process.exit(1) }
    const kw = process.argv[3]
    if (!kw) { process.stderr.write('用法：lessons find <关键词>\n'); process.exit(1) }
    const list = findEntries(r.root, kw)
    if (!list.length) { process.stdout.write('无匹配条目\n'); process.exit(0) }
    for (const e of list) process.stdout.write(`${e.id}｜${e.region}｜${e.dim}｜${e.status}｜${e.problem}\n`)
    process.exit(0)
  }
  else if (cmd === 'verify') {
    const r = resolveStore({ env: process.env, pointerPaths: pointerCandidates(), deps: { isInsideGitRepo } })
    if (!r.ok) { process.stderr.write(`${r.reason}\n下一步：${r.hint}\n`); process.exit(1) }
    const sub = process.argv[3]
    const target = process.argv[4]
    const t = resolveVerifyFile(r.root, target)
    if (!t.ok) { process.stderr.write(`${t.reason}\n`); process.exit(1) }
    const show = (x) => (x == null ? '—' : `${x}%`)
    if (sub === 'record') {
      const res = verifyRecord(r.root, t.file, { period: argOf('--period'), date: argOf('--date'), a: argOf('--a'), b: argOf('--b'), n: argOf('--n'), p: argOf('--p'), expect: argOf('--expect'), signal: argOf('--signal'), note: argOf('--note') })
      if (!res.ok) { process.stderr.write(`记账失败：${res.reason}\n`); process.exit(1) }
      process.stdout.write(`已记一期：${res.period}\n`); process.exit(0)
    }
    else if (sub === 'score') {
      const res = verifyScore(t.file)
      if (!res.ok) { process.stderr.write(`${res.reason}\n`); process.exit(1) }
      process.stdout.write(`${res.row.period}（机会 ${res.row.a}）｜复发率 ${show(res.recurrence)}｜新问题率 ${show(res.newProblem)}｜认可率 ${show(res.approval)}｜置信：${res.confidence}\n`)
      process.exit(0)
    }
    else if (sub === 'trend') {
      const res = verifyTrend(t.file)
      if (!res.ok) { process.stderr.write(`${res.reason}\n`); process.exit(1) }
      for (const p of res.points) {
        const d = p.delta == null ? '' : `（Δ ${p.delta > 0 ? '+' : ''}${p.delta}）`
        process.stdout.write(`${p.period}｜机会 ${p.a}｜复发率 ${show(p.recur)}${d}｜${p.grade}｜${p.confidence}\n`)
      }
      process.exit(0)
    }
    else if (sub === 'expect') {
      const res = verifyExpect(t.file)
      if (!res.ok) { process.stderr.write(`${res.reason}\n`); process.exit(1) }
      process.stdout.write(`${res.period}｜实测复发率 ${show(res.actual)}｜事前预期 ${res.expect}｜${res.verdict}\n`)
      process.exit(0)
    }
    process.stderr.write('用法：lessons verify record|score|trend|expect <目标（技能名 或 KB 条目 ID）> ...\n'); process.exit(1)
  }
  process.stderr.write(`未知命令：${cmd}\n支持：sid "<首句>" | resolve | deferred [--project <标识>] | stats | migrate --to <path> | moment add|resolve|drop | show <ID> | find <关键词> | verify record|score|trend|expect <目标>\n`)
  process.exit(1)
}
