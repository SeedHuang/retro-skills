// run-eval.mjs —— 技能行为评测 runner CLI（零依赖）
// 职责（spec §3.3 七件事）：固定 cwd 与路径解析 → 定位二进制 → 固定参数 → 注入模型 →
//   前置闸门 ①–⑨（任一不过按其码退出、不产 verdict 行）→ 稳定性汇总（L1）+ 差值（L3）→
//   写 <output-dir>/verdict.md（结论边界五要素）→ 退出码（§3.3-6 二维表 + 表外透传 + 认证/超时分支）
// 判分不在本文件：断言由外部 skill-up 完成；本文件只做稳定性汇总与环境/路径/产物管理。
// 路径基准单一（spec §3.3-1）：脚本位置只用于找默认 eval.yaml；repoRoot 一律由 eval.yaml 位置推导
//   （repoRoot = <eval.yaml 所在目录>/../..，且 <eval.yaml 所在目录>/.. 末级必须名为 evals）。
// yaml 内所有相对路径（cases.files / oracle / repo_fixture / apply_diff / skills[].path）一律
//   相对 evalsDir = <eval.yaml 所在目录>/.. 解析——与 skill-up 的兜底基准逐字一致（2026-10-23 实测）。
// 退出码：0 / 1 / 2 / 3 / 4（工具非表内码如 5 → 原样透传）；不执行任何 git 写操作
//   （唯一例外：物化 fixture 时在 .session/eval-fixture/** 内 git init/add/commit，该目录已 gitignore）。
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, cpSync, readdirSync, realpathSync } from 'node:fs'
import { join, dirname, resolve, basename, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { classifyRun, computeArmRate, decideVerdict, pickExitCode, loadExpectation } from './run-eval-core.mjs'
import { sha256, extractPathValue, setPathScalar, listSkillsPathScalars, extractContextPaths, extractScalar, extractBlockList, extractPromptText, canonicalJson, assertHash, auditCaseKeys } from './eval-contract-core.mjs'

const EXIT = { ENV: 2, CONFIG: 4, NO_CASE: 3 }
// 认证特征正则（spec §3.3-6 / BE-4-03）：忽略大小写；按词边界 / 完整词组匹配，
// 不用裸 auth / token / 无上下文 credential（作者、tokenize、正常提示语会误命中）
const AUTH_STDERR_RE = new RegExp(
  'API[ _-]?key|api_key|credential.{0,20}(missing|invalid|not found|required)|\\b401\\b|\\bunauthorized\\b|authentication failed|invalid token|token (expired|invalid)',
  'i',
)
// 超时 stderr 特征（spec §3.3-6 超时三支之②）
const TIMEOUT_STDERR_RE = /timeout|timed out|超时/i

// ── 纯函数层（可导出、供 run-eval.test.mjs 覆盖）──────────────────────────────

// 参数拼装：argv → { skill, dryRun, evalYaml, outputDir, iteration, argError }
// 位置参数（第一个非 -- 项）= 技能名；--iteration 非数时返回 NaN，由前置闸门 ⑤ 判码 4
// 带值参数后跟另一个 -- 项、缺失值、或任何未识别的 - 开头参数 → argError
// （不得静默吞掉：否则 --iteration 被吃掉还当默认值跑、-iteration 还会被当成技能名）
export function parseArgs(argv = []) {
  const parsed = { skill: 'review-triage', dryRun: false, evalYaml: null, outputDir: null, iteration: 2, argError: null }
  const positional = []
  let iterationRaw = null
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--dry-run') { parsed.dryRun = true; continue }
    if (a === '--eval-yaml' || a === '--output-dir' || a === '--iteration') {
      const v = argv[i + 1]
      i++
      if (v === undefined || v.startsWith('--')) {
        i--
        if (!parsed.argError) parsed.argError = `${a} 后缺值（或紧跟另一个 -- 项）`
        continue
      }
      if (a === '--eval-yaml') parsed.evalYaml = v
      else if (a === '--output-dir') parsed.outputDir = v
      else iterationRaw = v
      continue
    }
    // 任何以 - 开头但上面没认出来的参数都不得静默忽略：吞掉 = 配错照样按默认值跑
    // （单横线写法如 -iteration 也不能落进 positional 被当成技能名）
    if (a.startsWith('-')) {
      if (!parsed.argError) parsed.argError = `未知参数：${a}`
      continue
    }
    positional.push(a)
  }
  if (positional.length > 0) parsed.skill = positional[0]
  if (iterationRaw !== null) parsed.iteration = Number(iterationRaw)
  return parsed
}

// 路径基准（spec §3.3-1）：repoRoot 只由 eval.yaml 位置推导；
// <eval.yaml 所在目录>/.. 的末级必须名为 evals（即 eval.yaml 必须位于 evals/<技能名>/ 下），否则码 4
export function resolvePaths(evalYaml) {
  const abs = resolve(evalYaml)
  const evalDir = dirname(abs)
  const parentName = basename(dirname(evalDir))
  if (parentName !== 'evals') {
    return { ok: false, error: `BASE-1 <eval.yaml 所在目录>/.. 末级名为 ${parentName}，必须是 evals` }
  }
  return { ok: true, evalYaml: abs, evalDir, repoRoot: resolve(evalDir, '..', '..') }
}

// 全部 resolve 成绝对路径（--eval-yaml / --output-dir 一律先 resolve 再传工具，spec §3.3-3）
export function resolveRunPaths({ evalYaml, outputDir = null, skill = 'review-triage' }) {
  const p = resolvePaths(evalYaml)
  if (!p.ok) return { ok: false, error: p.error }
  return {
    ok: true,
    evalYaml: p.evalYaml,
    evalDir: p.evalDir,
    evalsDir: dirname(p.evalDir),
    repoRoot: p.repoRoot,
    skillRoot: join(p.repoRoot, 'skills', skill),
    outputDir: resolve(outputDir ?? join(p.repoRoot, '.session', 'eval-out', skill)),
  }
}

// ⑥-1 源目录检查（纯函数，供单测）：目录必须在位；且不得自带 .git
// （自带 .git 的源目录被 cpSync 后再 init 会变成嵌套仓库，baseline 提交落在内层，⑥-5 判据失真）
export function auditRepoSource(evalDir, repoOwners) {
  const out = []
  for (const [repoName, owner] of repoOwners) {
    const srcDir = join(evalDir, 'fixtures', 'repos', repoName)
    if (!existsSync(srcDir)) {
      out.push(`repo_fixture 源目录不存在：fixtures/repos/${repoName}/（用例 ${owner}）`)
      continue
    }
    if (existsSync(join(srcDir, '.git'))) {
      out.push(`fixture 源目录不得含 .git（会被再 init 成嵌套仓库）：fixtures/repos/${repoName}/.git（用例 ${owner}）`)
    }
  }
  return out
}

// ⑥-4 skills[].path 逐条检查（纯函数，供单测）：spec 写的是 `skills[].path`（复数），
// 每条都要「解析后存在 + 含 SKILL.md」。旧实现只查第一条，与注入的遍历口径不一致——
// 多技能时第二条不存在会在 dry-run 放过、真跑才炸。
export function auditSkillPaths(yamlText, evalsDir) {
  const slots = listSkillsPathScalars(yamlText)
  if (!slots.ok) return { problems: [`skills[].path 缺失：${slots.error}`], dirs: [] }
  const problems = []
  const dirs = []
  for (const slot of slots.items) {
    const abs = resolve(evalsDir, slot.value)
    dirs.push(abs)
    if (!existsSync(abs)) problems.push(`skills[].path 解析后不存在：${slot.value} → ${abs}`)
    else if (!existsSync(join(abs, 'SKILL.md'))) problems.push(`skills[].path 下无 SKILL.md：${abs}`)
  }
  return { problems, dirs }
}

// 固定参数（spec §3.3-3）：--baseline 由 yaml 的 benchmark.enabled 决定是否传（BE-2-03）
export function buildToolArgs({ evalYaml, outputDir, iteration, baseline = false }) {
  const args = ['run', evalYaml, '--output-dir', outputDir, '--iteration', String(iteration)]
  if (baseline) args.push('--baseline')
  return args
}

// 注入模型值 + skills[].path 绝对化（spec §3.3-4）：只改目标行冒号右侧，整值替换。
// skills 块内每条 path 都按 evalsDir 解析（yaml 内相对路径基准单一），多技能同样成立；
// 枚举与去引号统一走 eval-contract-core 的 listSkillsPathScalars，与 ⑥-4 同口径。
export function injectModelAndSkillPaths(yamlText, { provider, name, evalsDir }) {
  let text = yamlText
  for (const [keys, value] of [
    [['engine', 'model', 'provider'], provider],
    [['engine', 'model', 'name'], name],
  ]) {
    const r = setPathScalar(text, keys, value)
    if (!r.ok) return { ok: false, error: `engine.model.${keys[keys.length - 1]}：${r.error}` }
    text = r.text
  }

  const slots = listSkillsPathScalars(text)
  if (!slots.ok) {
    return { ok: false, error: slots.error === 'skills 块内没有 path 字段' ? 'skills 块内没有 path 字段（工具会拿到未绝对化的路径）' : slots.error }
  }
  const lines = slots.lines.slice()
  for (const slot of slots.items) {
    const abs = resolve(evalsDir, slot.value).split(sep).join('/')
    lines[slot.lineIndex] = slot.prefix + JSON.stringify(abs)
  }
  return { ok: true, text: lines.join(slots.eol), rewritten: slots.items.length }
}

// 分桶（spec §3.3-7）：configuration 只认 with_skill / without_skill；其余值（写成 baseline、
// 拼错、缺失）一律落 unknown —— 旧实现用 else 归到 without，会把未知配置洗成「不装臂」产出伪 rate
export function groupRunsByCase(datas) {
  const map = new Map()
  for (const data of datas) {
    for (const run of data.runs || []) {
      const key = run.eval_name
      if (!map.has(key)) map.set(key, { with: [], without: [], unknown: [], all: [] })
      const bucket = map.get(key)
      bucket.all.push(run)
      if (run.configuration === 'with_skill') bucket.with.push(run)
      else if (run.configuration === 'without_skill') bucket.without.push(run)
      else bucket.unknown.push(run)
    }
  }
  return map
}

// 迭代目录统计（spec §3.3-7：n = 参与 flaky 判定的迭代目录数）
// 解析失败的 benchmark.json 不计入 n：旧实现先按文件存在与否数 n、再逐份 parse，
// 坏 JSON 仍被算进 n，该目录整轮数据却消失 → 迭代数虚高、flaky 判据失真。
// 同样不计入 n 的还有「能 parse 但形状不可用」的产物（null / 非对象 / runs 不是数组）：
// JSON.parse('null') 会成功并返回 null，旧实现把它当正常数据收下，随后 groupRunsByCase
// 取 data.runs 直接抛 TypeError —— 整支 runner 崩掉，且这份坏产物还占了 n。
export function collectBenchmarks(outputDir) {
  const badFiles = []
  const datas = []
  if (!existsSync(outputDir)) return { n: 0, badFiles, datas }
  for (const entry of readdirSync(outputDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !/^iteration-\d+$/.test(entry.name)) continue
    const p = join(outputDir, entry.name, 'benchmark.json')
    if (!existsSync(p)) continue
    try {
      const data = JSON.parse(readFileSync(p, 'utf8'))
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        badFiles.push({ path: p, error: '产物不是对象' })
        continue
      }
      if (!Array.isArray(data.runs)) {
        badFiles.push({ path: p, error: 'runs 不是数组' })
        continue
      }
      datas.push(data)
    } catch (e) { badFiles.push({ path: p, error: e.message }) }
  }
  return { n: datas.length, badFiles, datas }
}

// 退出码（spec §3.3-6 二维表 ①–④ + 跨行优先级 2 > 3 > 1 > 0 + probe 不参与）
// 判定顺序：认证分支 > 表外码透传（④，优先于 ③）> 超时 > 无工具码（spawn 报错）>
//   数据不完整（③）> 工具码 2/3 有数据（②）> 无 gate 用例（3）> 由 verdict 定码（①）
export function decideExitCode({ toolCode = 0, authFailed = false, timedOut = false, hasBenchmark = false, lines = [] } = {}) {
  const gate = (lines || []).filter((l) => l && l.role === 'gate')
  if (authFailed) return 2
  if (typeof toolCode === 'number' && ![0, 1, 2, 3, 4].includes(toolCode)) return toolCode
  if (timedOut) return 2
  if (typeof toolCode !== 'number') return 2
  if (!hasBenchmark) return 2
  if (gate.some((l) => l.dataComplete === false)) return 2
  if (toolCode === 2 || toolCode === 3) return toolCode
  if (gate.length === 0) return 3
  return pickExitCode(gate, toolCode)
}

// 运行期整轮覆盖值（spec §3.3-6 的优先级链）：认证 > ④ 表外码透传 > 超时 > 无工具码 > ③ 数据不完整 > ② 工具码 2/3。
// 顺序即判据：④ 必须在 ③ 之前（「透传优先于 ③」）——把 ③ 提前会把工具码 5 洗成 2。
// 返回 null 表示不覆盖（由每条用例的 L1/L3 结论定码）。
export function deriveForcedVerdict({ authFailed = false, timedOut = false, toolCode = 0, dataComplete = true } = {}) {
  if (authFailed) return 'INVALID_ENV'
  if (timedOut) return 'INVALID_ENV'
  if (typeof toolCode === 'number' && ![0, 1, 2, 3, 4].includes(toolCode)) return null   // ④
  if (toolCode === null) return 'INVALID_ENV'                                            // spawn 报错
  if (!dataComplete) return 'INVALID_ENV'                                                // ③
  if (toolCode === 2 || toolCode === 3) return 'INVALID_ENV'                             // ②
  return null
}

// 单用例聚合（纯函数，供单测）：L1/L3 全交 decideVerdict，本函数只算 rate 与「数据是否完整」。
// ③ 数据不完整 = flaky 未判定（无产物 / 某臂 determined=0 / 数据量不足）**或**该用例存在
// configuration 落在 unknown 的跑——后者不属于任何一臂，当正常数据留下会让 rate 在残缺数据上
// 算出来并被写成 VALID（fail-closed）。
export function evaluateCase({ caseMeta, bucket, iterationDirs, iterationMin }) {
  const d = decideVerdict({
    role: caseMeta.role,
    origin: caseMeta.origin,
    arms: caseMeta.arms,
    deltaMin: caseMeta.delta?.min,
    withRuns: bucket.with,
    withoutRuns: bucket.without,
    iterationDirs,
    iterationMin,
  })
  return {
    c: caseMeta,
    bucket,
    d,
    dataComplete: d.flaky !== '未判定' && bucket.unknown.length === 0,
    w: computeArmRate(bucket.with),
    wo: computeArmRate(bucket.without),
  }
}

// verdict.md 的「异常明细」段（spec §3.3-7，2026-10-23 增补）：四类异常逐条落纸，
// 无异常写「无」。数据源与 stdout 的逐条打印同源（同一次 bench / decisions 结果）。
// 为什么必须进 verdict.md：异常只进 stdout 时，看留痕的人只看到 flaky=未判定 / INVALID_ENV，
// 分不清是坏产物、未知配置还是超时——结论行可读，但读者无法判断该不该信。
export function renderAnomalySection({ badFiles = [], decisions = [], timeoutSignals = [] } = {}) {
  const items = []
  for (const b of badFiles) items.push(`- 坏 benchmark.json（已跳过，不计入 iteration）：${b.path}（${b.error}）`)
  for (const { c, bucket } of decisions) {
    for (const run of bucket.unknown) {
      items.push(`- unknown 配置的跑（不属于任何一臂）：eval_name=${c.eval_name} configuration=${JSON.stringify(run.configuration ?? null)}`)
    }
    for (const run of bucket.all.filter((r) => classifyRun(r) === 'undetermined')) {
      items.push(`- undetermined 的跑：eval_name=${c.eval_name} configuration=${run.configuration ?? 'n/a'}`
        + ` passed=${JSON.stringify(run?.result?.passed ?? null)} total=${JSON.stringify(run?.result?.total ?? null)}`)
    }
  }
  for (const s of timeoutSignals) items.push(`- 超时信号：${s}`)
  return ['## 异常明细', '', ...(items.length > 0 ? items : ['无'])]
}

// 行渲染层的 rate 归一（spec §3.3-7：「整行不可算 → rate=未判定」）：
// decideVerdict 在两臂都 determined=0 时给的是「未判定/未判定」，整行不可算只写一次「未判定」。
// 只做格式化，不改 decideVerdict 的判定口径（run-eval-core.mjs 不在本次授权内）
export function formatRate(decision, w, wo) {
  return w.determined === 0 && wo.determined === 0 ? '未判定' : decision.rate
}

// ── 机读块 ⑧ ②③④ 与 ⑨ ⑤⑥ 的核对（纯校验，只读传入的结构与文件）──────────────

// 多重集差：a 里去掉 b 的次数后剩下的项（不去重：同名多写一次也算多）
function multisetDiff(a, b) {
  const count = new Map()
  for (const x of b) count.set(x, (count.get(x) || 0) + 1)
  const out = []
  for (const x of a) {
    const n = count.get(x) || 0
    if (n > 0) count.set(x, n - 1)
    else out.push(x)
  }
  return out
}

// ⑧ 机读块结构 ②③④ + ⑦ iteration_min（spec §3.2.2）
// ① 由 loadExpectation 负责（恰好 1 个 json 块 + 合法 JSON + schema）
export function validateExpectationBlock(block, cases, { evalDir, iteration }) {
  const out = []
  const blockCases = Array.isArray(block.cases) ? block.cases : []
  if (!Array.isArray(block.cases)) out.push('cases 不是数组')

  // ② eval_name 集合与 title 多重集双向相等，且 title 逐个唯一
  const titles = cases.map((c) => c.title).filter(Boolean)
  if (titles.length !== cases.length) out.push('有用例缺 title')
  const dup = titles.filter((t, i) => titles.indexOf(t) !== i)
  if (dup.length) out.push(`title 重名：${[...new Set(dup)].join(' / ')}`)
  const names = blockCases.map((c) => c.eval_name)
  const missing = multisetDiff(titles, names)
  const extra = multisetDiff(names, titles)
  if (missing.length) out.push(`机读块缺用例：${[...new Set(missing)].join(' / ')}`)
  if (extra.length) out.push(`机读块多出用例：${[...new Set(extra)].join(' / ')}`)

  // ⑦ iteration_min ≥ 2 且 ≤ 本次 --iteration（启动前判据）
  if (!Number.isInteger(block.iteration_min) || block.iteration_min < 2) {
    out.push(`iteration_min 必须是 ≥ 2 的整数（实际 ${JSON.stringify(block.iteration_min)}）`)
  } else if (block.iteration_min > iteration) {
    out.push(`iteration_min(${block.iteration_min}) > --iteration(${iteration})`)
  }

  const ledgerPath = join(evalDir, 'frozen-ledger.json')
  let ledger = {}
  try { ledger = existsSync(ledgerPath) ? JSON.parse(readFileSync(ledgerPath, 'utf8')) : {} } catch { ledger = {} }
  const byTitle = new Map(cases.map((c) => [c.title, c]))

  for (const c of blockCases) {
    const n = c.eval_name
    // ③ role / origin 枚举
    if (!['gate', 'probe'].includes(c.role)) out.push(`${n} 的 role 非法：${c.role}`)
    if (!['calibrated', 'frozen'].includes(c.origin)) out.push(`${n} 的 origin 非法：${c.origin}`)
    // ④ role 与 arms / delta 形态一致
    if (c.role === 'probe' && (c.arms !== null || c.delta !== null)) out.push(`${n} 是 probe，arms/delta 必须为 null`)
    if (c.role === 'gate') {
      if (!c.arms || typeof c.arms !== 'object') out.push(`${n} 是 gate，缺 arms`)
      else {
        for (const armName of ['with_skill', 'without_skill']) {
          const arm = c.arms[armName]
          if (!arm || typeof arm !== 'object') { out.push(`${n} 缺 arms.${armName}`); continue }
          const vals = [arm.min_rate, arm.max_rate].filter((v) => v !== undefined)
          if (vals.length === 0) out.push(`${n} 的 arms.${armName} 既无 min_rate 也无 max_rate`)
          for (const v of vals) {
            if (typeof v !== 'number' || !(v >= 0 && v <= 1)) out.push(`${n} 的 arms.${armName} 数值域越界：${JSON.stringify(v)}`)
          }
        }
        // gate 的 with_skill.min_rate ≥ 0.8（防「两臂都低、差值凑够」被当达标）
        const wMin = c.arms.with_skill?.min_rate
        if (typeof wMin !== 'number' || wMin < 0.8) out.push(`${n} 的 with_skill.min_rate 必须 ≥ 0.8（实际 ${JSON.stringify(wMin)}）`)
      }
      if (!c.delta || typeof c.delta.min !== 'number') out.push(`${n} 是 gate，缺 delta.min`)
      else if (!(c.delta.min > 0 && c.delta.min <= 1)) out.push(`${n} 的 delta.min 越界：${c.delta.min}`)
    }
    // ③ frozen 必须带 frozen_since，且 ledger 有同 eval_name 记录、arms_snapshot / delta 逐项相等
    if (c.origin === 'frozen') {
      if (typeof c.frozen_since !== 'string' || c.frozen_since === '') out.push(`${n} 是 frozen 但缺 frozen_since`)
      const rec = ledger && typeof ledger === 'object' ? ledger[n] : null
      if (!rec) out.push(`${n} 是 frozen 但 frozen-ledger.json 无同 eval_name 记录`)
      else {
        for (const k of ['frozen_since', 'verified_at', 'arms_snapshot', 'delta_at_verify', 'assert_hash', 'verified_snapshot']) {
          if (!(k in rec)) out.push(`${n} 的 ledger 缺字段 ${k}`)
        }
        if (rec.arms_snapshot !== undefined && canonicalJson(rec.arms_snapshot) !== canonicalJson(c.arms)) {
          out.push(`${n} 的 ledger arms_snapshot 与当前 arms 不一致（需重新校准）`)
        }
        const deltaSnapshot = rec.delta_at_verify ?? rec.delta_snapshot
        if (deltaSnapshot !== undefined && canonicalJson(deltaSnapshot) !== canonicalJson(c.delta)) {
          out.push(`${n} 的 ledger delta 记录与当前 delta 不一致（需重新校准）`)
        }
        // assert_hash 复算（spec §3.2.2③）：runner 只比对、不生成；与 A1 共用 assertHash
        // 必须是 64 位十六进制——非字符串（数字 / null / 对象）不得静默跳过，否则冻结记录失效而无人发现
        if (typeof rec.assert_hash !== 'string' || !/^[0-9a-f]{64}$/.test(rec.assert_hash)) {
          out.push(`${n} 的 ledger assert_hash 必须是 64 位十六进制（实际 ${JSON.stringify(rec.assert_hash)}）`)
        } else if (rec.assert_hash !== assertHash({ assert: c.assert, anchors: c.anchors, arms: c.arms, delta: c.delta })) {
          out.push(`${n} 的 ledger assert_hash 与当前 assert/anchors/arms/delta 不一致（需重新校准）`)
        }
      }
    }
    // ④ assert 两组词与用例 yaml 的 expect 逐项相等（L2 输入必须同源）
    const pair = byTitle.get(n)
    if (pair) {
      if (!c.assert || typeof c.assert !== 'object') out.push(`${n} 缺 assert 块`)
      else {
        for (const field of ['must_contain', 'must_not_contain']) {
          const declared = c.assert[field]
          const fromYaml = extractBlockList(pair.text, field)
          if (!fromYaml.ok) { out.push(`${n} 的 yaml expect.${field} 抽取失败：${fromYaml.error}`); continue }
          if (!Array.isArray(declared)) { out.push(`${n} 的 assert.${field} 不是数组`); continue }
          if (JSON.stringify(declared) !== JSON.stringify(fromYaml.items)) {
            out.push(`${n} 的 assert.${field} 与 yaml expect.${field} 不是有序逐项相等`)
          }
        }
      }
      // ④ anchors 字段表：声明了 context.git.apply_diff 的用例 anchors 不得为空
      if (!Array.isArray(c.anchors)) out.push(`${n} 缺 anchors 数组`)
      else if (pair.ctx?.apply_diff && c.anchors.length === 0) out.push(`${n} 声明了 context.git.apply_diff，anchors 不得为空`)
      // ④ 键白名单 + judge ⊆ expect（与 A1 的 KEYS-1/2/6 共用 auditCaseKeys，口径不分叉）
      const audit = auditCaseKeys(pair.text)
      for (const banned of audit.bannedKeys) out.push(`${n} 使用了本轮禁止的键 ${banned}`)
      if (audit.usesOutputNot) out.push(`${n} 使用了 output_contains.not（本轮禁止）`)
      for (const j of audit.judge) {
        if (j.badLine) out.push(`${n} 的 judge.${j.field} 出现非块列表行：${j.badLine}`)
        for (const w of j.undeclaredWords) out.push(`${n} 的 judge.${j.field} 含 expect 未声明的词「${w}」`)
      }
    }
  }
  return out
}

// ⑨ 机读块 ⑤⑥：oracle 存在 + 断言全过（纯子串匹配）；锚点 prompt 0 命中 / oracle ≥1 命中
function validateOracleAndAnchors(block, cases, evalsDir) {
  const out = []
  const byTitle = new Map(cases.map((c) => [c.title, c]))
  for (const c of block.cases || []) {
    const n = c.eval_name
    const pair = byTitle.get(n)
    if (!pair) { out.push(`⑤ ${n} 在 cases.files 里找不到对应用例`); continue }
    if (typeof c.oracle !== 'string' || c.oracle === '') { out.push(`⑤ ${n} 缺 oracle 路径`); continue }
    const oracleAbs = resolve(evalsDir, c.oracle)
    if (!existsSync(oracleAbs)) { out.push(`⑤ ${n} 的 oracle 不存在：${c.oracle} → ${oracleAbs}`); continue }
    const oracle = readFileSync(oracleAbs, 'utf8')
    const mustContain = extractBlockList(pair.text, 'must_contain')
    const mustNot = extractBlockList(pair.text, 'must_not_contain')
    if (!mustContain.ok) { out.push(`⑤ ${n} 的 expect.must_contain 抽取失败：${mustContain.error}`); continue }
    if (!mustNot.ok) { out.push(`⑤ ${n} 的 expect.must_not_contain 抽取失败：${mustNot.error}`); continue }
    for (const w of mustContain.items) if (!oracle.includes(w)) out.push(`⑤ ${n} 的 oracle 未命中 must_contain「${w}」`)
    for (const w of mustNot.items) if (oracle.includes(w)) out.push(`⑤ ${n} 的 oracle 命中了 must_not_contain「${w}」`)

    // ⑥ 锚点双向（prompt 只比 input.prompt 正文，不得拿整份 yaml 比）
    if (!Array.isArray(c.anchors)) { out.push(`⑥ ${n} 缺 anchors 数组`); continue }
    if (c.anchors.length === 0) continue
    const prompt = extractPromptText(pair.text)
    if (!prompt.ok) { out.push(`⑥ ${n} 的用例缺 input.prompt：${prompt.error}`); continue }
    for (const a of c.anchors) {
      if (prompt.text.includes(a)) out.push(`⑥ ${n} 的锚点「${a}」在 prompt 中出现（必须 0 命中）`)
      if (!oracle.includes(a)) out.push(`⑥ ${n} 的锚点「${a}」在 oracle 中 0 命中（必须 ≥1）`)
    }
  }
  return out
}

// 结论边界五要素（spec §3.3-7 / §5⑦）：按实际 n 生成检出上限，不得按请求的 --iteration
function boundaryLines({ provider, name, engineVersion, caseCount, n, actualModel }) {
  const nText = n === 0 ? 'n/a' : String(n)
  return [
    `- 配置模型（请求值）：${provider ?? '未设置（dry-run 不注入）'} / ${name ?? '未设置（dry-run 不注入）'}`,
    `- 引擎版本：${engineVersion}`,
    '- 真实后端未验证：需在转发侧人工确认',
    `- 覆盖范围：1 技能 / ${caseCount} 用例`,
    `- 稳定性检出上限：n=${nText}（检出率上界 1−p^n−(1−p)^n；n=2 时 ≤ 50%，且 n=2 时两次一致 ≠ 已验证稳定）`,
    `- actual_model=${actualModel ?? '未确认'}`,
  ]
}

// ── CLI 主体 ─────────────────────────────────────────────────────────────────

class Bail extends Error {
  constructor(code, line) { super(line); this.code = code }
}

// 启动前失败：单行 stdout `exit=<code> reason=<...> <细节>`，不产 verdict 行、不建产物目录
function bail(code, reason, detail) {
  throw new Bail(code, `exit=${code} reason=${reason} ${detail}`)
}

function main() {
  const parsed = parseArgs(process.argv.slice(2))
  const skill = parsed.skill
  const dryRun = parsed.dryRun
  const scriptDir = dirname(fileURLToPath(import.meta.url))
  const pass = []

  // ① 二进制定位（SKILL_UP_BIN → PATH；dry-run 同样生效）
  const bin = process.env.SKILL_UP_BIN || 'skill-up'
  const binOk = process.env.SKILL_UP_BIN
    ? existsSync(process.env.SKILL_UP_BIN)
    : spawnSync('skill-up', ['--version'], { encoding: 'utf8' }).status === 0
  if (!binOk) {
    bail(EXIT.ENV, '环境不可用', `① 二进制定位失败（设 SKILL_UP_BIN 或装 skill-up）：${bin}`)
  }
  pass.push(`① 二进制定位通过（${bin}）`)

  // 路径基准（repoRoot 只由 eval.yaml 位置推导）+ ② eval.yaml 可解析
  const yamlPath = parsed.evalYaml ? resolve(parsed.evalYaml) : resolve(scriptDir, '..', 'evals', skill, 'eval.yaml')
  const runPaths = resolveRunPaths({ evalYaml: yamlPath, outputDir: parsed.outputDir, skill })
  if (!runPaths.ok) bail(EXIT.CONFIG, '配置错误', `② ${runPaths.error}`)
  const { evalYaml, evalDir, evalsDir, repoRoot, skillRoot, outputDir } = runPaths

  let yamlText
  try { yamlText = readFileSync(evalYaml, 'utf8') }
  catch (e) { bail(EXIT.CONFIG, '配置错误', `② eval.yaml 不可读：${evalYaml}（${e.code ?? e.message}）`) }

  // ②-残留：engine.model 占位缺失即视为上次中断残留（主判据与厂商无关，spec §3.3-4）
  const providerSlot = extractPathValue(yamlText, ['engine', 'model', 'provider'])
  const nameSlot = extractPathValue(yamlText, ['engine', 'model', 'name'])
  if (!providerSlot.ok || !nameSlot.ok) {
    bail(EXIT.CONFIG, '配置错误', `② engine.model 缺 provider / name 子键（${providerSlot.ok ? nameSlot.error : providerSlot.error}）`)
  }
  if (providerSlot.value !== '{provider}' || nameSlot.value !== '{name}') {
    bail(EXIT.CONFIG, '配置错误', `② 模型占位残留：engine.model 已被替换为 ${providerSlot.value} / ${nameSlot.value}，先还原为 {provider} / {name}`)
  }
  pass.push('② eval.yaml 可解析，模型占位未残留')

  // ③ 用例集非空
  const caseFiles = [...yamlText.matchAll(/^\s*-\s+([^\s]+\.yaml)\s*$/gm)].map((m) => m[1])
  if (caseFiles.length === 0) bail(EXIT.NO_CASE, '无可用用例', '③ cases.files 为空')
  pass.push(`③ 用例集 ${caseFiles.length} 条`)

  // ④ 产物目录不存在（避免覆盖旧结果）
  if (existsSync(outputDir)) bail(EXIT.CONFIG, '配置错误', `④ 产物目录已存在：${outputDir}`)
  pass.push(`④ 产物目录不存在（${outputDir}）`)

  // ⑤ 参数解码 + --iteration ≥ 2（带值参数缺值会被 parseArgs 记 argError，先于数值域报）
  if (parsed.argError) bail(EXIT.CONFIG, '配置错误', `⑤ ${parsed.argError}`)
  const iteration = parsed.iteration
  if (!(iteration >= 2)) {
    bail(EXIT.CONFIG, '配置错误', `⑤ --iteration 必须 ≥ 2（当前 ${Number.isNaN(iteration) ? '非法值' : iteration}）`)
  }
  pass.push(`⑤ --iteration=${iteration}`)

  // ⑥ 路径与 fixture（⑥-1 → ⑥-5，不得调换；spec §3.3-5「按序执行」，首因必须是 ⑥-1）
  // 只读用例文本、读不到先不 bail：⑥-1/⑥-2 用能读到的用例即可枚举
  const caseTexts = []
  const missingCaseFiles = []
  for (const rel of caseFiles) {
    const abs = resolve(evalsDir, rel)
    if (!existsSync(abs)) { missingCaseFiles.push(`${rel} → ${abs}`); continue }
    caseTexts.push({ rel, abs, text: readFileSync(abs, 'utf8') })
  }
  // 所有用例文件都读不到 = 无东西可枚举、⑥-1 无从执行 → 直接按 ⑥-3 报（唯一例外）
  if (caseTexts.length === 0) {
    bail(EXIT.CONFIG, '配置错误', `⑥-3 cases.files 解析后不存在：${missingCaseFiles.join('；')}`)
  }
  const cases = caseTexts.map((c) => {
    const ctx = extractContextPaths(c.text)
    return {
      ...c,
      ctx,
      id: extractScalar(c.text, 'id'),
      title: extractScalar(c.text, 'title'),
      repoName: ctx.repo_fixture ? ctx.repo_fixture.split('/').pop() : null,
    }
  })

  // ⑥-1 源目录 fixtures/repos/<repo_fixture 的 basename>/ 必须存在且不得自带 .git（缺 → 码 4）
  const repoOwners = new Map()
  for (const c of cases) if (c.repoName) repoOwners.set(c.repoName, c.id ?? c.rel)
  const repoProblems = auditRepoSource(evalDir, repoOwners)
  if (repoProblems.length) bail(EXIT.CONFIG, '配置错误', `⑥-1 ${repoProblems.join('；')}`)
  pass.push(`⑥-1 fixture 源目录在位（${repoOwners.size} 个：${[...repoOwners.keys()].join(', ') || '无'}）`)

  // ⑥-2 物化：所有被引用的 repo_fixture 都物化（先删后建），仓库内 fixture 不要求带 .git
  const fixtureRoot = join(evalDir, 'fixtures', 'repos')
  const materialized = join(repoRoot, '.session', 'eval-fixture', skill)
  const git = (cwd, args) => spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8' })
  if (repoOwners.size > 0) {
    rmSync(materialized, { recursive: true, force: true })
    for (const repoName of repoOwners.keys()) {
      const dst = join(materialized, repoName)
      cpSync(join(fixtureRoot, repoName), dst, { recursive: true })
      const steps = [['init', '-q'], ['add', '-A'], ['-c', 'user.email=eval@local', '-c', 'user.name=eval', 'commit', '-qm', 'baseline']]
      for (const step of steps) {
        const r = git(dst, step)
        if (r.status !== 0) {
          bail(EXIT.CONFIG, '配置错误', `⑥-2 fixture 物化失败（git ${step[0]}）：${repoName}｜${(r.stderr || '').trim().split(/\r?\n/).pop() ?? ''}`)
        }
      }
    }
  }
  pass.push(`⑥-2 物化完成 → ${materialized}`)

  // ⑥-3 物化后 repo_fixture / apply_diff 解析后必须存在（工具不校验这两类）
  // 「cases.files 解析后不存在」也在此阶段才报（编号仍是 ⑥-3，避免抢在 ⑥-1 之前成为首因）
  if (missingCaseFiles.length) {
    bail(EXIT.CONFIG, '配置错误', `⑥-3 cases.files 解析后不存在：${missingCaseFiles.join('；')}`)
  }
  for (const c of cases) {
    if (c.ctx.repo_fixture && !existsSync(resolve(evalsDir, c.ctx.repo_fixture))) {
      bail(EXIT.CONFIG, '配置错误', `⑥-3 repo_fixture 不存在：${c.ctx.repo_fixture}（用例 ${c.id}）`)
    }
    if (c.ctx.apply_diff && !existsSync(resolve(evalsDir, c.ctx.apply_diff))) {
      bail(EXIT.CONFIG, '配置错误', `⑥-3 apply_diff 不存在：${c.ctx.apply_diff}（用例 ${c.id}）`)
    }
  }
  pass.push('⑥-3 物化后 repo_fixture / apply_diff 均存在')

  // ⑥-4 skills[].path 解析后存在且含 SKILL.md；apply_diff 必须写在 context.git 下
  const skillAudit = auditSkillPaths(yamlText, evalsDir)
  if (skillAudit.problems.length > 0) bail(EXIT.CONFIG, '配置错误', `⑥-4 ${skillAudit.problems[0]}`)
  for (const c of cases) {
    if (c.ctx.apply_diff && !c.ctx.hasContextGit) {
      bail(EXIT.CONFIG, '配置错误', `⑥-4 apply_diff 层级错（必须写在 context.git 下）：用例 ${c.id}`)
    }
  }
  pass.push(`⑥-4 skills[].path 与 SKILL.md 在位（${skillAudit.dirs.join('、')}）`)

  // ⑥-5 仅对声明了 apply_diff 的用例核 baseline + git apply --check
  for (const c of cases) {
    if (!c.ctx.apply_diff) continue
    if (!c.repoName) bail(EXIT.CONFIG, '配置错误', `⑥-5 用例 ${c.id} 声明了 apply_diff 但无 repo_fixture`)
    const repoDir = join(materialized, c.repoName)
    if (git(repoDir, ['rev-parse', 'HEAD']).status !== 0) {
      bail(EXIT.CONFIG, '配置错误', `⑥-5 fixture 缺 baseline：${c.repoName}（用例 ${c.id}）`)
    }
    if (git(repoDir, ['apply', '--check', resolve(evalsDir, c.ctx.apply_diff)]).status !== 0) {
      bail(EXIT.CONFIG, '配置错误', `⑥-5 git apply --check 失败：${c.ctx.apply_diff}（用例 ${c.id}）`)
    }
  }
  pass.push('⑥-5 baseline 与 git apply --check 通过')

  // ⑦ benchmark.enabled === true（--baseline 的传递由它决定）
  const benchSlot = extractPathValue(yamlText, ['benchmark', 'enabled'])
  if (!benchSlot.ok || benchSlot.value !== 'true') {
    bail(EXIT.CONFIG, '配置错误', `⑦ benchmark.enabled 必须为 true（实际 ${benchSlot.ok ? benchSlot.value : '缺失'}）`)
  }
  const baseline = benchSlot.value === 'true'
  pass.push(`⑦ benchmark.enabled=true（工具${baseline ? '将' : '不'}收到 --baseline）`)

  // ⑧ 机读块 ①–④ + iteration_min + CONTRACT.json 哈希
  const expectedPath = join(evalDir, 'expected.md')
  let expectation
  try { expectation = loadExpectation(readFileSync(expectedPath, 'utf8')) }
  catch (e) { bail(EXIT.CONFIG, '配置错误', `⑧ expected.md 机读块 ① 不过：${e.message}`) }
  const blockProblems = validateExpectationBlock(expectation, cases, { evalDir, iteration })
  if (blockProblems.length) bail(EXIT.CONFIG, '配置错误', `⑧ 机读块 ②③④/⑦ + judge⊆expect/键白名单 不过：${blockProblems.join('；')}`)

  const contractPath = join(evalDir, 'fixtures', 'CONTRACT.json')
  if (!existsSync(contractPath)) {
    bail(EXIT.CONFIG, '配置错误', `⑧ fixtures/CONTRACT.json 缺失（先跑 node scripts/check-eval-contract.mjs ${skill}）`)
  }
  let contract
  try { contract = JSON.parse(readFileSync(contractPath, 'utf8')) }
  catch (e) { bail(EXIT.CONFIG, '配置错误', `⑧ CONTRACT.json 不是合法 JSON：${e.message}`) }
  if (contract.exit !== 0) {
    bail(EXIT.CONFIG, '配置错误', `⑧ CONTRACT.json 的 exit=${contract.exit}（先跑 node scripts/check-eval-contract.mjs ${skill}）`)
  }
  const drift = []
  for (const [rel, want] of Object.entries(contract.files || {})) {
    const abs = join(repoRoot, rel)
    const got = existsSync(abs) ? sha256(readFileSync(abs)) : null
    if (got !== want) drift.push(rel)
  }
  if (drift.length > 0) {
    bail(EXIT.CONFIG, '配置错误', `⑧ 文件已改但未重跑 A1（先跑 node scripts/check-eval-contract.mjs ${skill}）：${drift.join(', ')}`)
  }
  pass.push(`⑧ 机读块 ①–④ + iteration_min + judge⊆expect / 键白名单 通过；CONTRACT.json exit=0 且 ${Object.keys(contract.files || {}).length} 个文件哈希一致`)

  // ⑨ 机读块 ⑤⑥：oracle 断言全过 + 锚点双向
  const oracleProblems = validateOracleAndAnchors(expectation, cases, evalsDir)
  if (oracleProblems.length) bail(EXIT.CONFIG, '配置错误', `⑨ 机读块 ⑤⑥ 不过：${oracleProblems.join('；')}`)
  pass.push(`⑨ oracle 断言全过 + 锚点双向通过（${(expectation.cases || []).length} 条）`)

  // dry-run：只做前置校验 + 打印，返回 0；不注入模型、不要求模型变量、不写 output-dir / verdict.md
  if (dryRun) {
    for (const p of pass) console.log(p)
    const toolArgs = buildToolArgs({ evalYaml, outputDir, iteration, baseline })
    const cmd = bin.endsWith('.mjs') ? process.execPath : bin
    console.log(`command=${cmd} ${toolArgs.join(' ')}`)
    console.log(`eval-yaml=${evalYaml}`)
    console.log(`eval-dir=${evalDir}`)
    console.log(`repo-root=${repoRoot}`)
    console.log(`evals-dir=${evalsDir}`)
    console.log(`skill-root=${skillRoot}`)
    console.log(`output-dir=${outputDir}`)
    console.log(`fixture-dir=${materialized}`)
    const boundary = boundaryLines({
      provider: process.env.EVAL_MODEL_PROVIDER,
      name: process.env.EVAL_MODEL_NAME,
      engineVersion: 'n/a（dry-run 未执行工具）',
      caseCount: (expectation.cases || []).length,
      n: 0,
      actualModel: '未确认',
    })
    for (const l of boundary) console.log(l)
    console.log(`eval:${skill} dry-run 通过 ①–⑨`)
    return 0
  }

  // 模型变量（变量名定死，spec §3.3-4）：缺失 → 码 2，且不产 verdict.md
  const provider = process.env.EVAL_MODEL_PROVIDER
  const modelName = process.env.EVAL_MODEL_NAME
  if (!provider || !modelName) {
    const missing = [!provider && 'EVAL_MODEL_PROVIDER', !modelName && 'EVAL_MODEL_NAME'].filter(Boolean).join(' ')
    bail(EXIT.ENV, '环境不可用', `模型变量缺失：${missing}`)
  }

  // 模型账（spec §3.3-7 / AI-6-04）：账本不存在 = 首次运行，不提示
  const ledgerPath = join(repoRoot, '.session', 'eval-state', `${skill}.json`)
  let actualModel = '未确认'
  if (existsSync(ledgerPath)) {
    let prev = null
    try { prev = JSON.parse(readFileSync(ledgerPath, 'utf8')) } catch { prev = null }
    if (prev && typeof prev === 'object') {
      if (typeof prev.actual_model === 'string' && prev.actual_model !== '') actualModel = prev.actual_model
      if (prev.config_provider !== provider || prev.config_name !== modelName) {
        console.log('模型账：历史结论对该模型不成立，需重跑')
      }
    }
    if (actualModel === '未确认') console.log('模型账：actual_model=未确认，结论不可外推')
  }

  // 注入模型 + skills[].path 绝对化（工具只看到绝对值），try/finally 保证还原
  const original = yamlText
  const injected = injectModelAndSkillPaths(original, { provider, name: modelName, evalsDir })
  if (!injected.ok) bail(EXIT.CONFIG, '配置错误', `注入失败：${injected.error}`)
  const toolArgs = buildToolArgs({ evalYaml, outputDir, iteration, baseline })
  const cmd = bin.endsWith('.mjs') ? process.execPath : bin
  const argv = bin.endsWith('.mjs') ? [bin, ...toolArgs] : toolArgs

  let toolResult = null
  let restoreError = null
  const startedAt = Date.now()
  try {
    writeFileSync(evalYaml, injected.text, 'utf8')
    toolResult = spawnSync(cmd, argv, { cwd: repoRoot, encoding: 'utf8' })
  } finally {
    try { writeFileSync(evalYaml, original, 'utf8') } catch (e) { restoreError = e }
  }
  const wallMs = Date.now() - startedAt
  if (restoreError) {
    bail(EXIT.CONFIG, '配置错误', `eval.yaml 还原失败（原文件已被污染）：${restoreError.message}`)
  }

  const toolCode = typeof toolResult?.status === 'number' ? toolResult.status : null
  const stderr = typeof toolResult?.stderr === 'string' ? toolResult.stderr : ''
  const authFailed = toolCode !== null && toolCode !== 0 && AUTH_STDERR_RE.test(stderr)

  // 超时三支信号（spec §3.3-6）：① session-result.json 的 exit_code: 124 ② stderr 特征 ③ 墙钟阈值
  const caseIds = cases.map((c) => c.id).filter(Boolean)
  let sessionTimeout = false
  for (const id of caseIds) {
    const caseOut = join(outputDir, id)
    if (!existsSync(caseOut)) continue
    for (const entry of readdirSync(caseOut, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const p = join(caseOut, entry.name, 'outputs', 'agent', 'run', 'session-result.json')
      if (!existsSync(p)) continue
      try { if (JSON.parse(readFileSync(p, 'utf8')).exit_code === 124) sessionTimeout = true } catch { /* 产物坏了不算超时信号 */ }
    }
  }
  const timeoutSlot = extractPathValue(yamlText, ['cases', 'defaults', 'timeout_seconds'])
  const timeoutSeconds = timeoutSlot.ok ? Number(timeoutSlot.value) : NaN
  const wallLimitMs = Number.isFinite(timeoutSeconds)
    ? iteration * cases.length * 2 * timeoutSeconds * 1.5 * 1000
    : null
  const wallExceeded = wallLimitMs !== null && wallMs > wallLimitMs
  // 超时是「失败行」的判据（spec：其余失败行 timeout=否）：工具码 0 时不判超时
  // 三支信号分开记：verdict.md 的异常明细要写明命中哪一支（spec §3.3-7）
  const timeoutSignals = []
  if (toolCode !== null && toolCode !== 0) {
    if (sessionTimeout) timeoutSignals.push('① session-result.json 的 exit_code=124')
    if (TIMEOUT_STDERR_RE.test(stderr)) timeoutSignals.push('② stderr 命中 timeout / timed out / 超时')
    if (wallExceeded) timeoutSignals.push(`③ 墙钟超时（${wallMs}ms > 阈值 ${Math.round(wallLimitMs)}ms）`)
  }
  const timedOut = timeoutSignals.length > 0

  // 迭代目录 = 成功解析的 iteration-*/benchmark.json 个数（不是请求的 --iteration，也不是文件个数）
  const bench = collectBenchmarks(outputDir)
  const n = bench.n
  // 不得静默跳过：坏产物会让该迭代目录整轮数据凭空消失（flaky/rate 少算却无人知晓）
  for (const b of bench.badFiles) console.error(`benchmark.json 读取失败，已跳过：${b.path}（${b.error}）`)
  if (n === 0) console.log('flaky 未判定（无可用产物）')
  const runsByCase = groupRunsByCase(bench.datas)

  // 逐用例决策：L1/L3 全交 decideVerdict（不在此内联规则）
  const decisions = (expectation.cases || []).map((caseMeta) => evaluateCase({
    caseMeta,
    bucket: runsByCase.get(caseMeta.eval_name) || { with: [], without: [], unknown: [], all: [] },
    iterationDirs: n,
    iterationMin: expectation.iteration_min,
  }))

  // 运行期覆盖（spec §3.3-6 二维表 + 认证 + 超时）：forced = 整轮 verdict 覆盖值
  const gateDecisions = decisions.filter((x) => x.c.role === 'gate')
  const dataComplete = n > 0 && gateDecisions.every((x) => x.dataComplete)
  const forced = deriveForcedVerdict({ authFailed, timedOut, toolCode, dataComplete })

  const lineTexts = []
  for (const { c, bucket, d, w, wo } of decisions) {
    const verdict = forced ?? d.verdict
    lineTexts.push(
      `${c.eval_name}: role=${c.role} iteration=${n === 0 ? 'n/a' : n}`
      + ` runs=${w.determined}/${wo.determined} undet=${w.undetermined}/${wo.undetermined}`
      + ` flaky=${d.flaky} rate=${formatRate(d, w, wo)} delta=${d.delta}`
      + ` verdict=${verdict} exit=${toolCode === null ? 'n/a' : toolCode} timeout=${timedOut ? '是' : '否'}`,
    )
  }
  const exitCode = decideExitCode({
    toolCode,
    authFailed,
    timedOut,
    hasBenchmark: n > 0,
    lines: decisions.map((x) => ({
      role: x.c.role,
      verdict: forced ?? x.d.verdict,
      dataComplete: x.dataComplete,
    })),
  })

  // 引擎版本只能从 iteration-1/result.json 读
  let engineVersion = 'n/a（未读到 iteration-1/result.json）'
  const resultJson = join(outputDir, 'iteration-1', 'result.json')
  if (existsSync(resultJson)) {
    try {
      engineVersion = JSON.parse(readFileSync(resultJson, 'utf8')).observed_configuration?.version || 'n/a（result.json 无 version 字段）'
    } catch { engineVersion = 'n/a（result.json 解析失败）' }
  }

  // verdict.md：运行期失败也要写（mkdir 发生在 ④ 检查之后，不构成「产物目录已存在」）
  const boundary = boundaryLines({
    provider,
    name: modelName,
    engineVersion,
    caseCount: (expectation.cases || []).length,
    n,
    actualModel,
  })
  mkdirSync(outputDir, { recursive: true })
  const anomaly = renderAnomalySection({ badFiles: bench.badFiles, decisions, timeoutSignals })
  const md = ['# 评测结论', '', ...boundary, '', ...lineTexts, '', ...anomaly].join('\n')
  writeFileSync(join(outputDir, 'verdict.md'), md + '\n', 'utf8')

  // 模型账回写（actual_model 保留人读回填值 / 未确认）
  mkdirSync(dirname(ledgerPath), { recursive: true })
  writeFileSync(ledgerPath, JSON.stringify({ config_provider: provider, config_name: modelName, actual_model: actualModel }, null, 2) + '\n', 'utf8')

  // stdout：结论边界 + 逐用例行 + undetermined 明细（环境失败不得被静默洗成稳定通过）
  for (const l of boundary) console.log(l)
  for (const l of lineTexts) console.log(l)
  for (const { c, bucket } of decisions) {
    const undet = bucket.all.filter((run) => classifyRun(run) === 'undetermined')
    for (const run of undet) {
      console.log(`  undet-run: eval_name=${c.eval_name} configuration=${run.configuration ?? 'n/a'}`
        + ` passed=${JSON.stringify(run?.result?.passed ?? null)} total=${JSON.stringify(run?.result?.total ?? null)}`)
    }
    // unknown 配置的跑不参与任何一臂，必须单独留痕（否则 rate 看起来正常却漏了跑）
    for (const run of bucket.unknown) {
      console.log(`  unknown-run: eval_name=${c.eval_name} configuration=${JSON.stringify(run.configuration ?? null)}`)
    }
  }
  return exitCode
}

// 直接运行检测：两端 realpathSync 归一（Windows 再折大小写）——裸路径字符串比较在 Junction 下必不等
function isDirectRun() {
  const entry = process.argv[1]
  if (!entry) return false
  const norm = (p) => {
    const r = realpathSync(p)
    return process.platform === 'win32' ? r.toLowerCase() : r
  }
  try { return norm(entry) === norm(fileURLToPath(import.meta.url)) } catch { return false }
}

if (isDirectRun()) {
  try {
    process.exitCode = main()
  } catch (e) {
    if (e instanceof Bail) {
      console.log(e.message)
      process.exitCode = e.code
    } else {
      console.error(e?.stack ?? String(e))
      process.exitCode = EXIT.CONFIG
    }
  }
}
