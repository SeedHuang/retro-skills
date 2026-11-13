import { expand } from '../verify-models.mjs'
import { ReviewerModel, AuditorModel, RespondentModel } from '../types/derived.mjs'
import { makeHelpers, sections } from './sections.mjs'
import { raw, renderBlocks } from '../../../render/index.mjs'

const CLASSES = [ReviewerModel, AuditorModel, RespondentModel]

// 段的出现顺序；空段由 section 自己返回 [] 跳过
const TYPE_SECTIONS = {
  ReviewerModel: ['frontmatter', 'duty', 'must', 'never', 'conflict', 'checklist', 'outputFormat', 'outputs', 'permissions', 'ban', 'escalation', 'boundary'],
  AuditorModel: ['frontmatter', 'duty', 'must', 'never', 'conflict', 'checklist', 'outputFormat', 'outputs', 'permissions', 'ban', 'escalation', 'boundary'],
  RespondentModel: ['frontmatter', 'duty', 'must', 'never', 'conflict', 'checklist', 'outputFormat', 'outputs', 'permissions', 'ban', 'escalation', 'boundary'],
}

const TYPE_NAMES = new Set(CLASSES.map((C) => C.typeName))

export function typeOf(m) {
  if (m.modelType) return TYPE_NAMES.has(m.modelType) ? m.modelType : null
  const hit = CLASSES.filter((C) => C.matches(m))
  return hit.length === 1 ? hit[0].typeName : null
}

// 已迁到 Block[] 的段；未迁的段整体走 raw 垫片
const BLOCK_SECTIONS = new Set(['frontmatter', 'duty', 'must', 'never'])

export function renderModel(ownPath, shared) {
  const M = { ...shared, ...expand(ownPath) }
  const h = makeHelpers(M, shared)
  const t = typeOf(M)
  // 显式写了非法类型时不得静默兜底：与 verify 的 TYPE_UNKNOWN 保持一致
  if (!t && M.modelType) throw new Error('MODELTYPE_UNKNOWN:' + M.modelType)
  const type = t || 'RespondentModel'
  const blocks = []
  for (const k of TYPE_SECTIONS[type]) {
    const out = sections[k](M, shared, h)
    if (BLOCK_SECTIONS.has(k)) blocks.push(...out)
    else blocks.push(raw(out))
  }
  const text = renderBlocks(blocks)
  return { type, text, lines: text.split('\n').length }
}
