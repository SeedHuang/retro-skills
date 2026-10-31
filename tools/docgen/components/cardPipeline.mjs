// 唯一装配点（spec §3 `:70` / §4 `:81-84`）：buildCards → buildEnv → mergeActions → 三投影 + writeAll。
// 数据源单向（V-6 / S4-TC-I04）：本文件**不读盘**（不读任何文件、不扫目录、不碰 `agents/` 常量）；
// 渲染输入只来自 `agentData.mjs` + `triggerTable`，`agents/*.md` 只被 gate 读来比对。
import { mkdirSync, writeFileSync, renameSync, rmSync } from 'node:fs'
import { dirname } from 'node:path'
import { agentData, triggerTable } from './agentData.mjs'
import { toolsForSeat } from './patternRegistry.mjs'
import { SHARED_MUST, SHARED_NEVER, SHARED_USE } from '../card-model/vocab/shared-actions.mjs'
import { PREDICATES } from '../card-model/vocab/predicates.mjs'
import { LANDINGS } from '../card-model/vocab/landings.mjs'
import { SUBJECTS } from '../card-model/subjects.mjs'
import { SHARED_SCENES, SEAT_SCENES } from '../card-model/scenes.mjs'
import { SEAT_SIGNALS } from '../card-model/signals.mjs'
import { mergeActions } from '../card-model/merge.mjs'
import { registeredIdsOf, validateCardModel } from '../card-model/index.mjs'
import { renderCard } from './renderCard.mjs'
import { renderReadme, renderIndex } from './renderReadme.mjs'
import { exitCodeFor } from './validateAgentData.mjs'

// `Card` = S1 §4 `:58-67` 的全量 12 键（spec §4 `:89`）；缺任一键 → 拒绝渲染
const CARD_KEYS = ['seat', 'name', 'description', 'tools', 'duty', 'scenes', 'signals', 'must', 'never',
  'categories', 'checkItems', 'rationale']

// 非议会席（spec §4 `:97` 点名两席）：`env.parliamentSeats` = 其余席
const NON_PARL_SEATS = ['evidence-reader', 'senior-sdet']

function fail(code, fields = {}) {
  const e = new Error(fields.message ?? code)
  e.code = code
  Object.assign(e, fields)
  try { e.exitCode = exitCodeFor(code) } catch { e.exitCode = 1 }
  throw e
}

function refuse(errors) {
  const first = errors[0] || { code: 'UnverifiableOutput', path: 'card', message: '卡面校验未通过' }
  const e = new Error(errors.map((x) => `${x.code}: ${x.message ?? x.path}`).join('；') || first.code)
  e.code = first.code
  e.errors = errors
  try { e.exitCode = exitCodeFor(first.code) } catch { e.exitCode = 1 }
  throw e
}

// 合并：先取本席 `use` 声明的共享句，再叠本席同名覆盖（覆盖必带 reason，S1 `merge.mjs` 判合法性）
function mergeList(shared, own) {
  const m = mergeActions(shared, own)
  const list = [...shared]
  for (const a of Array.isArray(own) ? own : []) {
    if (!a || typeof a.id !== 'string') continue
    const i = list.findIndex((x) => x && x.id === a.id)
    if (i >= 0) list[i] = { ...list[i], ...a }
    else list.push(a)
  }
  return { errors: m.errors, overrides: m.overrides, list }
}

function descriptionOf(seat) {
  const t = triggerTable[seat]
  if (!t || typeof t.when !== 'string' || t.when.trim() === '') return ''
  const notWhen = t.notWhen && typeof t.notWhen.text === 'string' ? t.notWhen.text.trim() : ''
  return notWhen ? `${t.when}；不用于：${notWhen}` : t.when
}

function buildOne(entry) {
  if (!entry || !entry.card || typeof entry.card !== 'object') return null
  const own = entry.card
  const use = Array.isArray(SHARED_USE[entry.name]) ? SHARED_USE[entry.name] : []
  const sharedMust = SHARED_MUST.filter((a) => use.includes(a.id))
  const sharedNever = SHARED_NEVER.filter((a) => use.includes(a.id))
  const must = mergeList(sharedMust, own.must)
  const never = mergeList(sharedNever, own.never)
  const errors = [...must.errors, ...never.errors]
  const reasonOf = (id) => {
    const hit = [...(Array.isArray(own.must) ? own.must : []), ...(Array.isArray(own.never) ? own.never : [])]
      .find((x) => x && x.id === id)
    return hit && typeof hit.reason === 'string' ? hit.reason : ''
  }
  const overrides = [...must.overrides, ...never.overrides]
    .map((o) => ({ id: o.id, changed: o.changed, reason: reasonOf(o.id) }))
  const card = {
    ...own,
    seat: entry.name,
    name: entry.name,
    description: descriptionOf(entry.name),
    tools: toolsForSeat(entry.name),
    must: must.list,
    never: never.list,
  }
  for (const k of CARD_KEYS) {
    if (card[k] === undefined) {
      errors.push({ code: 'UnverifiableOutput', path: 'card', message: `缺 ${k} 键（Card = 12 键，缺任一键拒绝渲染，spec §4 :89）` })
    }
  }
  return { seat: entry.name, card, overrides, errors }
}

export function buildCards() {
  return agentData.map(buildOne).filter(Boolean)
}

export function buildEnv(seat, cards) {
  return {
    seat,
    sharedScenes: SHARED_SCENES,
    seatScenes: SEAT_SCENES,
    seatSignals: SEAT_SIGNALS,
    predicates: new Set(Object.keys(PREDICATES)),
    landings: new Set(Object.keys(LANDINGS)),
    subjects: SUBJECTS,
    registeredIds: new Set(registeredIdsOf(cards)),
    available: new Set(),
    unboundVars: new Set(),
    parliamentSeats: new Set(agentData.map((a) => a.name).filter((s) => !NON_PARL_SEATS.includes(s))),
  }
}

export function renderSeat(seat) {
  const entry = agentData.find((a) => a.name === seat)
  if (!entry) fail('MissingComponentData', { name: seat })
  if (!entry.card) {
    fail('MissingComponentData', { name: seat, reason: '未迁移席不可走新卡管线（旧模板分支由 renderByName 承接）' })
  }
  const built = buildOne(entry)
  if (built.errors.length) refuse(built.errors)
  const env = buildEnv(seat, [built.card])
  const v = validateCardModel(built.card, env)
  if (v.errors.length) refuse(v.errors)
  return { card: renderCard(built.card, env), readme: renderReadme(built.card, built.overrides) }
}

// `docs/agents/**` 的期望产物（内存，未写盘）：gate 逐字节比对与 `generate --readme --apply` 共用同一实现。
// 逐席滚动期只覆盖「已迁移且本身无错」的席（未迁移席不得出现在 docs/agents，spec §7④）。
export function expectedDocs() {
  const built = buildCards().filter((b) => b.errors.length === 0)
  return {
    entries: built.map((b) => ({ seat: b.seat, readme: renderReadme(b.card, b.overrides) })),
    index: renderIndex(built.map((b) => b.card)),
  }
}

export function renderAll() {
  const built = buildCards()
  if (built.length !== agentData.length) {
    const missing = agentData.filter((a) => !built.some((b) => b.seat === a.name)).map((a) => a.name)
    refuse([{ code: 'UnverifiableOutput', path: 'card', message: `未迁移席 ${missing.join(',')} 不得走收口全量（spec §7①）` }])
  }
  const bad = built.filter((b) => b.errors.length)
  if (bad.length) refuse(bad.flatMap((b) => b.errors))
  const envs = new Map(built.map((b) => [b.seat, buildEnv(b.seat, [b.card])]))
  for (const b of built) {
    const v = validateCardModel(b.card, envs.get(b.seat))
    if (v.errors.length) refuse(v.errors)
  }
  const cards = built.map((b) => renderCard(b.card, envs.get(b.seat)))
  const readmes = built.map((b) => renderReadme(b.card, b.overrides))
  const index = renderIndex(built.map((b) => b.card))
  return { cards, readmes, index }
}

// 共用落盘实现（spec §3 `:71②`）：全内存 → 逐文件 `.tmp-<pid>` → 全成功再 rename；任一失败清 tmp。
export function writeAll(artifacts) {
  const list = Array.isArray(artifacts) ? artifacts : []
  const tmps = []
  try {
    for (const a of list) {
      mkdirSync(dirname(a.path), { recursive: true })
      const tmp = `${a.path}.tmp-${process.pid}`
      writeFileSync(tmp, a.bytes)
      tmps.push({ tmp, path: a.path })
    }
    for (const t of tmps) renameSync(t.tmp, t.path)
    return { ok: true, wrote: true, errors: [] }
  } catch (e) {
    for (const t of tmps) rmSync(t.tmp, { force: true })
    return { ok: false, wrote: false, errors: [{ code: 'WriteFailed', message: e && e.message }] }
  }
}
