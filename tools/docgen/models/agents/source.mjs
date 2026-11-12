// 模型数据源适配层（P5）：18 席 `jsons/<seat>/index.json` → 确定性渲染文本 / 校验 findings / trigger.kind。
// 唯一读盘点：docgen 的 gate / generate / diff / draft / replace 与两守卫都从这里取席名与渲染结果，
// 不再经 `agentData` / `triggerTable` / `seatLoader`（旧链已退场）。
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderModel } from './render/index.mjs'
import { expand, verify, anyError } from './verify-models.mjs'

export const MODELS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'jsons')

// 席序 = 旧 `seatLoader.SEAT_ORDER` 的人工策划序（agents/ 产物与 A 组检查都按此序读，保持稳定）
export const SEAT_ORDER = ['reviewer-audit', 'reviewer-product', 'reviewer-interaction', 'reviewer-ui',
  'reviewer-frontend', 'reviewer-backend', 'reviewer-ops', 'reviewer-qa', 'reviewer-ai', 'reviewer-security',
  'reviewer-actuary', 'reviewer-reader', 'detective-observer', 'evidence-reader', 'senior-sdet',
  'speaker', 'respondent-architect', 'respondent-dev']

// SEAT_ORDER 与 jsons/ 子目录必须双向相等：只认手写数组会让新增模型目录被静默忽略。
// 模块加载期即 fail-closed（与旧 `seatLoader` 的 unknown/absent 双向校验同口径）。
const MODEL_SEATS = readdirSync(MODELS_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
  .map((e) => e.name)
  .sort()
const missingSeats = SEAT_ORDER.filter((s) => !MODEL_SEATS.includes(s))
const extraSeats = MODEL_SEATS.filter((s) => !SEAT_ORDER.includes(s))
if (missingSeats.length || extraSeats.length) {
  throw new Error(`MODEL_SEAT_DRIFT: SEAT_ORDER 缺 [${missingSeats.join(',')}] / jsons 多 [${extraSeats.join(',')}]`)
}

// 非议会席（S3-A §10 唯一源）：trigger.kind 守卫按此判定「只许 need」
export const NON_PARL_SEATS = ['evidence-reader', 'senior-sdet']

const sharedOf = () => JSON.parse(readFileSync(join(MODELS_DIR, '_shared.json'), 'utf8'))

export function isSeat(name) {
  return SEAT_ORDER.includes(name)
}

export function listSeats() {
  return [...SEAT_ORDER]
}

// 目录侧席名（升序）；与 listSeats() 双向相等由模块加载期断言兜底
export function modelSeats() {
  return [...MODEL_SEATS]
}

export function modelPathOf(seat) {
  if (!isSeat(seat)) throw new Error(`UnknownSeat: ${seat}`)
  return join(MODELS_DIR, seat, 'index.json')
}

// 展开后的完整模型（共享层按 appliesWhen 过滤 + records/forms 浅合并）
export function expandModel(seat) {
  return expand(modelPathOf(seat), sharedOf())
}

// 渲染用的合并视图（共享层顶层键 + 本席展开）：与 `render/index.mjs` 的 `{ ...shared, ...expand(own) }` 同形
export function modelWithShared(seat) {
  return { ...sharedOf(), ...expandModel(seat) }
}

// 单席渲染文本；调用方负责与盘上 agents/<seat>.md 逐字节比对
export function renderSeatText(seat) {
  return renderModel(modelPathOf(seat), sharedOf()).text
}

export function renderAllSeats() {
  return SEAT_ORDER.map((seat) => ({ seat, text: renderSeatText(seat) }))
}

// trigger.kind 的模型读法：一席多触发时逐条取，守卫要求同席同值（旧 triggerTable 每席只有一个 kind）
export function triggerKindsOf(seat) {
  const m = JSON.parse(readFileSync(modelPathOf(seat), 'utf8'))
  return (Array.isArray(m.seat && m.seat.triggers) ? m.seat.triggers : []).map((t) => t.kind)
}

// 卡面 findings 实算（替代旧 `collectCardFindings`）：只跑语义校验（`verify` 是 gate 的同一判据）。
// 返回形态与 `disposeCardFindings` 对齐：`{ file, code, message }`。
const INFO_FIELDS = new Set(['name', 'tier', 'must', 'never', 'pred', 'rec', 'modelType', 'modelFiles', 'policyFiles'])

export function collectModelFindings() {
  const findings = []
  for (const seat of SEAT_ORDER) {
    const file = `agents/${seat}.md`
    let r
    try {
      r = verify(seat)
    } catch (e) {
      findings.push({ file, code: 'ModelVerify', message: `${seat}: verify-error=${e.code || e.message}` })
      continue
    }
    for (const [k, v] of Object.entries(r)) {
      if (INFO_FIELDS.has(k)) continue
      if (Array.isArray(v) ? v.length : Boolean(v)) {
        const detail = Array.isArray(v) ? v.join(';') : String(v)
        findings.push({ file, code: 'ModelVerify', message: `${seat}: ${k}=${detail}` })
      }
    }
  }
  return findings
}

// 写盘/草稿路径的模型校验：语义校验但不比 baseline（改模型是合法变更，基线漂移由 gate 判）。
// 返回 `{ ok, issues[] }`；模型文件缺失/JSON 损坏也收敛为 issue，不抛栈。
export function validateSeatModel(seat) {
  try {
    const r = verify(seat, { baseline: false })
    if (!anyError(r)) return { ok: true, issues: [] }
    const issues = []
    for (const [k, v] of Object.entries(r)) {
      if (INFO_FIELDS.has(k)) continue
      if (Array.isArray(v) ? v.length : Boolean(v)) {
        issues.push(`${k}=${Array.isArray(v) ? v.join(';') : String(v)}`)
      }
    }
    return { ok: false, issues }
  } catch (e) {
    return { ok: false, issues: [`verify-error=${e.code || e.message}`] }
  }
}
