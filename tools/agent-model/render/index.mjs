import { expand } from '../verify-models.mjs'
import { ReviewerModel, AuditorModel, RespondentModel } from '../types/derived.mjs'
import { makeHelpers, sections } from './sections.mjs'

const CLASSES = [ReviewerModel, AuditorModel, RespondentModel]

// 段的出现顺序；空段由 section 自己返回 [] 跳过
const TYPE_SECTIONS = {
  ReviewerModel: ['frontmatter', 'duty', 'must', 'never', 'conflict', 'checklist', 'outputFormat', 'outputs', 'permissions', 'escalation', 'boundary'],
  AuditorModel: ['frontmatter', 'duty', 'must', 'never', 'conflict', 'checklist', 'outputFormat', 'outputs', 'permissions', 'escalation', 'boundary'],
  RespondentModel: ['frontmatter', 'duty', 'must', 'never', 'conflict', 'checklist', 'outputFormat', 'outputs', 'permissions', 'escalation', 'boundary'],
}

const TYPE_NAMES = new Set(CLASSES.map((C) => C.typeName))

export function typeOf(m) {
  if (m.modelType) return TYPE_NAMES.has(m.modelType) ? m.modelType : null
  const hit = CLASSES.filter((C) => C.matches(m))
  return hit.length === 1 ? hit[0].typeName : null
}

export function renderModel(ownPath, shared) {
  const M = { ...shared, ...expand(ownPath) }
  const h = makeHelpers(M, shared)
  const type = typeOf(M) || 'RespondentModel'
  const lines = []
  for (const k of TYPE_SECTIONS[type]) lines.push(...sections[k](M, shared, h))
  return { type, text: lines.join('\n'), lines: lines.length }
}
