// 唯一读盘与装配点（spec §10.2.5）：读 JSON → 展开 → 拆 trigger → 注入 duty.trigger → 装配 → 键集断言。
// `cardPipeline.mjs` 仍不读盘；本文件是它的上游数据供给。
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { toolsForSeat, boundaryBySeat } from './patternRegistry.mjs'
import { CARD_KEYS } from './cardKeys.mjs'
import { exitCodeFor } from './validateAgentData.mjs'

// 席序（= 迁移前 `agentData` 字面的人工策划序；`docs/agents/README.md` 的行序即此序）。本常量只表达**顺序**，
// 席位名单的唯一源仍是 `data/seats/*.json`：两者在 `loadSeatData` 读盘前双向比对，不等即 `InvalidInputPath`。
export const SEAT_ORDER = ['reviewer-audit', 'reviewer-product', 'reviewer-interaction', 'reviewer-ui',
  'reviewer-frontend', 'reviewer-backend', 'reviewer-ops', 'reviewer-qa', 'reviewer-ai', 'reviewer-security',
  'reviewer-actuary', 'reviewer-reader', 'detective-observer', 'evidence-reader', 'senior-sdet']

const EMPTY = /^(|\s+)$/
const WHOLE = /^@([a-z][A-Za-z0-9]*)$/
const PART = /\$\{@([a-z][A-Za-z0-9]*)\}/g

function fail(code, fields) {
  const e = new Error(code); e.code = code; Object.assign(e, fields)
  try { e.exitCode = exitCodeFor(code) } catch { e.exitCode = 1 }
  throw e
}
const blank = (v) => v === null || v === undefined || (typeof v === 'string' && EMPTY.test(v))

function lookup(shared, key, seat) {
  if (!Object.prototype.hasOwnProperty.call(shared, key)) fail('DanglingSharedRef', { seat, key })
  const v = shared[key]
  if (blank(v)) fail('EmptySharedValue', { seat, key })
  return v
}

// 纯函数：不改入参、不读盘、不依赖时间/随机/环境；只展开一层（shared 内不得再有引用）
export function expandRefs(value, shared, seat) {
  if (typeof value === 'string') {
    const m = WHOLE.exec(value)
    if (m) {
      const v = lookup(shared, m[1], seat)          // 整值：原样返回，不递归展开（单层）
      if (typeof v === 'string' && (v.includes('@') || v.includes('${'))) {
        fail('NestedSharedRef', { seat, key: m[1], why: '整值展开结果仍含引用' })
      }
      return v
    }
    // 规则 4 上半：以 @ 开头但不整体匹配 ^@key$（整值与插值混用 / 非法形态）
    if (value.startsWith('@')) fail('NestedSharedRef', { seat, why: '混用或非法形态', value })
    // 插值必须用函数替换：值里含 `$&` / `$1` 会被当成替换模式（spec §10.2.3）
    return value.replace(PART, (_, key) => {
      const v = lookup(shared, key, seat)
      if (typeof v !== 'string') fail('EmptySharedValue', { seat, key, why: '插值要求字符串' })
      return v
    })
  }
  if (Array.isArray(value)) return value.map((x) => expandRefs(x, shared, seat))
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) out[k] = expandRefs(v, shared, seat)
    return out
  }
  return value
}

// 默认数据目录：写成函数（而非模块级 const），使本模块的求值顺序与调用顺序无关（环内调用不会 TDZ）
function dataDir() {
  return join(dirname(fileURLToPath(import.meta.url)), '..', 'data')
}

export function loadSeatData(dir = dataDir()) {
  const DERIVED = ['seat', 'name', 'description', 'tools']
  const EIGHT = CARD_KEYS.filter((k) => !DERIVED.includes(k))   // 席文件 card 的合法键集（12 键去派生四键）
  const seatsDir = join(dir, 'seats')
  const shared = JSON.parse(readFileSync(join(dir, 'shared.json'), 'utf8'))
  for (const [k, v] of Object.entries(shared)) {
    if (typeof v === 'string' && (v.includes('@') || v.includes('${'))) fail('NestedSharedRef', { key: k })
  }
  // 目录形状：只收 `<seat>.json` 文件；非文件条目（含名为 `x.json` 的目录）与「席序缺项/多项」一律拒载
  const entries = readdirSync(seatsDir, { withFileTypes: true })
  const strays = entries.filter((d) => !(d.isFile() && d.name.endsWith('.json'))).map((d) => d.name)
  if (strays.length) fail('InvalidInputPath', { dir: seatsDir, entries: strays })
  const slugs = entries.map((d) => d.name.replace(/\.json$/, ''))
  const unknown = slugs.filter((s) => !SEAT_ORDER.includes(s))
  const absent = SEAT_ORDER.filter((s) => !slugs.includes(s))
  if (unknown.length || absent.length) fail('InvalidInputPath', { dir: seatsDir, unknown, absent })
  const agentData = []
  const triggerTable = {}
  for (const slug of SEAT_ORDER) {
    const raw = JSON.parse(readFileSync(join(seatsDir, `${slug}.json`), 'utf8'))
    // 变量名 `s` 与展开符 `...s` 两个形态都被既有断言钉死：`tool-tiers.test.mjs` 认
    // `tools:\s*toolsForSeat\(\s*s\.name\s*\)` 且随后 `indexOf('...s', i)`（§10.2.9 要求「只换读取目标、断言文字不变」）。
    const { trigger, ...s } = expandRefs(raw, shared, raw.name)
    if (!trigger || blank(trigger.when)) fail('MissingWhen', { name: raw.name })
    if (typeof trigger.when !== 'string') fail('MissingWhen', { name: raw.name, when: trigger.when })
    if (typeof trigger.route !== 'string' || trigger.route.trim() === '') fail('TriggerMissingRoute', { name: raw.name })
    const dt = s.card && s.card.duty ? s.card.duty.trigger : undefined
    if (typeof dt !== 'string') fail('TriggerFieldMisplaced', { name: raw.name, key: 'duty.trigger' })
    if (dt !== '') fail('TriggerFieldMisplaced', { name: raw.name, key: 'duty.trigger', why: '第二来源' })
    s.card.duty.trigger = trigger.when
    // 席文件 card 的键集：恰等 8 键（= CARD_KEYS 去派生四键）；派生四键写了就拒载（spec §10.2.5 第 6 步）
    // `missing` / `extra` 两个字段必须分开给：TC-014 要点名缺的那个键，TC-015 要点名多出来的那个键
    const keys = Object.keys(s.card || {})
    const missing = EIGHT.filter((k) => !keys.includes(k))
    const extra = keys.filter((k) => !EIGHT.includes(k))
    if (missing.length || extra.length) {
      fail('CardKeySetMismatch', { name: s.name, keys, missing, extra, derivedInCard: extra.filter((k) => DERIVED.includes(k)) })
    }
    const card = { tools: toolsForSeat(s.name), ...(boundaryBySeat[s.name] ? { boundary: boundaryBySeat[s.name] } : {}), ...s }
    triggerTable[s.name] = trigger
    agentData.push(card)
  }
  return { agentData, triggerTable }
}
