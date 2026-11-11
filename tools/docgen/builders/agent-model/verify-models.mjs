import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tierOfCapabilities, TIERS } from '../agents/policy/definitions/tiers.mjs'
import { SEAT_POLICY } from '../agents/policy/seat-policy.mjs'
import { ReviewerModel, AuditorModel, RespondentModel } from './types/derived.mjs'

const MODEL_CLASSES = [ReviewerModel, AuditorModel, RespondentModel]

const here = dirname(fileURLToPath(import.meta.url))
const models = join(here, 'models')
const load = (p) => JSON.parse(readFileSync(p, 'utf8'))

// 仓根定位：技能目录被复制到临时目录时也要能找到 <repo>/skills（P3 迁移后本文件不在 tmp/，固定上跳级数会失效）
function skillsRoot() {
  if (process.env.MODEL_SKILLS_ROOT) return process.env.MODEL_SKILLS_ROOT
  let d = here
  for (let i = 0; i < 8; i++) {
    d = join(d, '..')
    if (existsSync(join(d, 'package.json')) && existsSync(join(d, 'skills'))) return join(d, 'skills')
  }
  return join(here, '..', '..', 'skills')
}

const shared = load(join(models, '_shared-model.json'))
const PG = shared.permissionGroups || {}
const PH = shared.placeholders || {}
const PH_RE = /\{([a-zA-Z][\w-]*)\}/g

function collectOps(node) {
  if (!node || typeof node !== 'object') return []
  const ops = []
  if (node.op) ops.push(node.op)
  for (const v of Object.values(node)) {
    if (Array.isArray(v)) v.forEach((x) => ops.push(...collectOps(x)))
    else if (v && typeof v === 'object') ops.push(...collectOps(v))
  }
  return ops
}

function checkTemplate(tpl) {
  const found = [...String(tpl).matchAll(PH_RE)].map((m) => m[1])
  if (found.some((p) => !PH[p])) return 'PlaceholderUndeclared'
  if (String(tpl).startsWith('/')) return 'PathAbsolute'
  if (String(tpl).includes('..')) return 'PathEscape'
  return null
}

const ACTION_OPS = {
  verify: ['fieldNonEmpty', 'fieldEmpty', 'fieldEnumIn', 'allExist', 'eachCarries', 'whenEmpty', 'fieldTrue', 'lineExists', 'quoteInLine', 'setSubset', 'coversAll', 'fieldMissing', 'fieldNeq', 'eachHas'],
  recount: ['fieldsEq', 'countGte'],
  spotCheck: ['lineExists'],
  replay: ['fieldsEq', 'quoteInLine'],
  compare: ['fieldsEq', 'quoteInLine', 'setSubset'],
}

const TITLE_ASSERT = {
  可复算: ['quoteInLine', 'lineExists'],
  可理解: [],
  闭环: [],
  可判定: [],
  充分: ['countGte'],
  多源: ['distinctGte'],
  完整: ['fieldMissing', 'allExist', 'coversAll'],
}

function titleDrift(text, ops) {
  const bad = []
  for (const [word, allowed] of Object.entries(TITLE_ASSERT)) {
    if (!text.includes(word)) continue
    if (!allowed.length || !allowed.some((o) => ops.includes(o))) bad.push(word)
  }
  return bad
}

const pick = (r, id) => r.appliesWhen === '*' || (Array.isArray(r.appliesWhen) && r.appliesWhen.includes(id))
const strip = (x) => { const c = { ...x }; delete c.appliesWhen; return c }
const policyOf = (id) => (Object.hasOwn(SEAT_POLICY, id) ? SEAT_POLICY[id] : SEAT_POLICY.__default__)
const baseName = (p) => String(p || '').split('/').pop()

export function expand(seatFile) {
  const own = load(seatFile)
  const id = own.seat.id
  const must = [...shared.rules.must.filter((r) => pick(r, id)), ...(own.must || [])].map(strip)
  const never = [...shared.rules.never.filter((r) => pick(r, id)), ...(own.never || [])].map(strip)
  const predicates = {}
  for (const [k, p] of Object.entries(shared.predicates)) if (pick(p, id)) predicates[k] = strip(p)
  for (const [k, p] of Object.entries(own.predicates || {})) predicates[k] = p
  const records = { ...shared.records }
  for (const [k, r] of Object.entries(own.records || {})) records[k] = { ...(shared.records[k] || {}), ...r }
  const forms = { ...shared.forms, ...(own.forms || {}) }
  const timing = { ...shared.timing.default, ...(own.timing || {}) }
  return { ...own, must, never, predicates, records, forms, timing }
}

export function verify(name, opts = {}) {
  const exp = expand(opts.modelPath || join(models, `${name}-model.json`))
  // baseline:false = 草稿模型没有基线，跳过比对（比对对象退化为自身，恒等）
  const base = opts.baseline === false
    ? { must: exp.must, never: exp.never, predicates: exp.predicates, records: exp.records }
    : load(join(models, '_baseline', `${name}.json`))
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)
  const errs = []
  if (!eq(exp.must, base.must)) errs.push('must')
  if (!eq(exp.never, base.never)) errs.push('never')
  if (!eq(exp.predicates, base.predicates)) errs.push('predicates')
  for (const k of Object.keys(base.records)) {
    if (!exp.records[k]) errs.push('record-lost:' + k)
    else if (!eq(exp.records[k], base.records[k])) errs.push('record-diff:' + k)
  }

  const perm = exp.permissions || {}
  const pAction = perm.action || {}
  const actionConflict = (pAction.allow || []).filter((a) => (pAction.forbid || []).includes(a))
  const unknownAction = [...(pAction.allow || []), ...(pAction.forbid || [])].filter((a) => !shared.actions || !shared.actions[a])
  const permOrphan = (pAction.forbid || []).filter((a) => !PG[a] && !shared.actions?.[a])
  const permUnobservable = (pAction.forbid || []).filter((a) => PG[a] && !PG[a].signal && !PG[a].residual)

  const own = new Set(exp.seat.artifacts || [])
  const ownFail = []
  for (const id of perm.write?.allow || []) if (!own.has(id)) ownFail.push('write:' + id)
  const ids = [...(perm.write?.allow || []), ...(perm.command?.allow || []), ...(perm.write?.forbidForms || []), ...(perm.command?.forbidForms || [])]
  for (const id of ids) if (!exp.forms[id]) ownFail.push('form:' + id)

  const policy = policyOf(exp.seat.id)
  const tier = tierOfCapabilities(policy.capabilities)
  const modelTier = exp.seat?.tier
  const tierBad = modelTier === tier ? '' : `TIER_MISMATCH model=${modelTier} policy=${tier}`
  const b = exp.boundary || {}
  const boundaryBad =
    !['policy', 'literal', 'default'].includes(b.kind) ? `BOUNDARY_KIND_UNKNOWN ${b.kind}`
    : b.kind === 'literal' && (typeof b.text !== 'string' || b.text.trim() === '') ? 'BOUNDARY_TEXT_MISSING'
    : b.kind === 'literal' && b.text !== b.text.trim() ? 'BOUNDARY_TEXT_WHITESPACE'
    : b.kind === 'policy' && !(TIERS[tier] || []).includes('Write') ? 'BOUNDARY_POLICY_NONWRITER'
    : ''
  const pathUndefined = []
  const modelFiles = [...own].map((id) => {
    const p = exp.forms[id]?.path
    if (!p) { pathUndefined.push(id); return null }
    return baseName(p)
  }).filter(Boolean).sort()
  const policyFiles = [...(policy.artifacts || [])].sort()
  const policyDiff = JSON.stringify(modelFiles) !== JSON.stringify(policyFiles)

  const titleDrifts = []
  for (const [k, p] of Object.entries(exp.predicates)) {
    const ops = (p.slots || []).map((s) => s.op)
    for (const f of ['ok', 'bad']) {
      const bad = titleDrift(p[f] || '', ops)
      if (bad.length) titleDrifts.push(`${k}.${f}:${bad.join('/')}`)
    }
  }
  for (const [k, g] of Object.entries(shared.permissionGroups || {})) {
    const bad = titleDrift(g.label || '', collectOps(g.signal))
    if (bad.length) titleDrifts.push(`perm.${k}:${bad.join('/')}`)
  }
  for (const g of exp.globalRules || []) {
    const bad = titleDrift(g.text || '', collectOps(g.checks))
    if (bad.length) titleDrifts.push(`rule.${g.id}:${bad.join('/')}`)
  }
  for (const it of exp.checklist?.items || []) {
    const c = exp.checkCriteria?.[it.criterion]
    const ops = (c?.observable || []).map((o) => o.op)
    const bad = titleDrift(it.category, ops)
    if (bad.length) titleDrifts.push(`item${it.no}:${bad.join('/')}`)
  }

  const pathBad = []
  for (const [id, f] of Object.entries(exp.forms)) {
    if (!f.path) continue
    const err = checkTemplate(f.path)
    if (err) pathBad.push(`${id}:${err}`)
  }
  for (const [id, r] of Object.entries(exp.records)) {
    const s = r.source
    if (!s || typeof s !== 'object' || !s.kind) { pathBad.push(`${id}:SourceUnstructured`); continue }
    if (s.kind === 'path') {
      const err = checkTemplate(s.template)
      if (err) pathBad.push(`${id}:${err}`)
    } else if (s.kind === 'description' && !s.text) {
      pathBad.push(`${id}:SourceTextMissing`)
    }
  }

  const skillBad = []
  for (const [id, t] of Object.entries(exp.templates || {})) {
    if (t.skill && !existsSync(join(skillsRoot(), t.skill))) skillBad.push(id + ':' + t.skill)
  }

  const triggerBad = []
  for (const t of exp.seat.triggers || []) {
    const isElement = t.objects || t.perspective || t.action || t.timing || t.schedule
    for (const o of t.objects || []) if (!shared.objectKinds?.[o]) triggerBad.push(`${t.id}:${o}`)
    if (t.perspective && !shared.perspectives?.[t.perspective]) triggerBad.push(`${t.id}:${t.perspective}`)
    if (t.schedule && !shared.schedules?.[t.schedule]) triggerBad.push(`${t.id}:${t.schedule}`)
    if (!isElement && !t.text && !shared.triggerPhrases?.[t.id]) triggerBad.push(`${t.id}:unregistered`)
  }

  const actionBad = []
  for (const [k, c] of Object.entries(exp.checkCriteria || {})) {
    const req = ACTION_OPS[c.action] || []
    if (req.length && !(c.observable || []).some((o) => req.includes(o.op))) actionBad.push(k + ':' + c.action)
  }

  const outputTextHandwritten = (exp.outputFormat?.checks || []).filter((c) => 'text' in c).map((c) => c.id)

  const writeAllow = exp.permissions?.write?.allow || []
  const seatArts = exp.seat?.artifacts || []
  const writeScopeBad = JSON.stringify(writeAllow) === JSON.stringify(seatArts) ? '' : `WRITE_SCOPE_MISMATCH model=[${writeAllow.join(',')}] seat=[${seatArts.join(',')}]`
  const outputUnwritable = (exp.outputs?.items || []).filter((i) => !writeAllow.includes(i.artifact)).map((i) => i.artifact)

  // 规则的目标是问题卡某栏时，本席必须真出问题卡；否则「不得出问题卡」与「不得留空建议解法栏」同卡互斥
  const issuesCard = seatArts.includes('artifact.issueCard')
  const cardTargetRules = [...(shared.rules.must || []), ...(shared.rules.never || [])]
    .filter((r) => (r.targets || []).some((t) => String(t.object || '').startsWith('issue.card.')))
  const cardRuleLeak = issuesCard ? [] : cardTargetRules.filter((r) => pick(r, exp.seat.id)).map((r) => r.id)

  const hitClasses = MODEL_CLASSES.filter((C) => C.matches(exp))
  const modelType = hitClasses.length === 1 ? hitClasses[0].typeName : null
  const typeErr = hitClasses.length === 0 ? 'TYPE_UNKNOWN' : hitClasses.length > 1 ? 'TYPE_CONFLICT:' + hitClasses.map((c) => c.typeName).join(',') : ''

  return { name, tier, tierBad, boundaryBad, modelType, typeErr, must: exp.must.length, never: exp.never.length, pred: Object.keys(exp.predicates).length, rec: Object.keys(exp.records).length, errs, ownFail, policyDiff, modelFiles, policyFiles, pathUndefined, actionConflict, unknownAction, permOrphan, permUnobservable, titleDrifts, pathBad, skillBad, triggerBad, actionBad, outputTextHandwritten, writeScopeBad, outputUnwritable, cardRuleLeak }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
export const anyError = (r) => r.errs.length || r.ownFail.length || r.policyDiff || r.pathUndefined.length ||
  r.actionConflict.length || r.unknownAction.length || r.permOrphan.length || r.permUnobservable.length ||
  r.titleDrifts.length || r.pathBad.length || r.skillBad.length || r.triggerBad.length || r.actionBad.length ||
  r.outputTextHandwritten.length || r.typeErr || r.writeScopeBad || r.outputUnwritable.length || r.cardRuleLeak.length ||
  r.tierBad || r.boundaryBad
let failed = false
if (isMain) {
  const names = process.argv.slice(2).length
    ? process.argv.slice(2)
    : ['evidence-reader', 'respondent-architect', 'respondent-dev', 'reviewer-actuary', 'reviewer-ai', 'detective-observer', 'reviewer-audit']

  for (const n of names) {
    const r = verify(n)
    const ok = r.errs.length === 0 ? 'EQUIVALENT' : 'FAIL ' + r.errs.join(';')
    const own = r.ownFail.length ? '  PERM_TARGET ' + r.ownFail.join(';') : ''
    const pol = r.policyDiff ? `  POLICY_DIFF model=[${r.modelFiles}] policy=[${r.policyFiles}]` : ''
    const undef = r.pathUndefined.length ? '  PATH_UNDEFINED ' + r.pathUndefined.join(';') : ''
    const act = r.actionConflict.length ? '  ACTION_CONFLICT ' + r.actionConflict.join(';') : ''
    const unk = r.unknownAction.length ? '  UNKNOWN_ACTION ' + r.unknownAction.join(';') : ''
    const por = r.permOrphan.length ? '  PERM_ORPHAN ' + r.permOrphan.join(';') : ''
    const pun = r.permUnobservable.length ? '  PERM_UNOBSERVABLE ' + r.permUnobservable.join(';') : ''
    const td = r.titleDrifts.length ? '  TITLE_DRIFT ' + r.titleDrifts.join(';') : ''
    const pb = r.pathBad.length ? '  PATH_INVALID ' + r.pathBad.join(';') : ''
    const sb = r.skillBad.length ? '  SKILL_MISSING ' + r.skillBad.join(';') : ''
    const tb = r.triggerBad.length ? '  TRIGGER_UNKNOWN ' + r.triggerBad.join(';') : ''
    const ab = r.actionBad.length ? '  ACTION_MISMATCH ' + r.actionBad.join(';') : ''
    const ot = r.outputTextHandwritten.length ? '  OUTPUT_TEXT_HANDWRITTEN ' + r.outputTextHandwritten.join(';') : ''
    const ty = r.typeErr ? '  ' + r.typeErr : ''
    const ws = r.writeScopeBad ? '  ' + r.writeScopeBad : ''
    const ou = r.outputUnwritable.length ? '  OUTPUT_UNWRITABLE ' + r.outputUnwritable.join(';') : ''
    const cl = r.cardRuleLeak.length ? '  ISSUE_RULE_ON_NON_ISSUER ' + r.cardRuleLeak.join(';') : ''
    const tj = r.tierBad ? '  ' + r.tierBad : ''
    const bj = r.boundaryBad ? '  ' + r.boundaryBad : ''
    console.log(`${r.name}  [${r.modelType}]  must=${r.must} never=${r.never} pred=${r.pred} rec=${r.rec}  ${ok}${own}${pol}${undef}${act}${unk}${por}${pun}${td}${pb}${sb}${tb}${ab}${ot}${ty}${ws}${ou}${cl}${tj}${bj}`)
    failed ||= Boolean(anyError(r))
  }
  if (failed) process.exitCode = 1
}
