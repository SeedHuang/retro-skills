import { readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expand } from '../verify-models.mjs'
import { ReviewerModel, AuditorModel, RespondentModel } from './derived.mjs'

export const MODELS = [ReviewerModel, AuditorModel, RespondentModel]

export function detectAll(m) {
  return MODELS.filter((C) => C.matches(m))
}

export function validateModel(m) {
  const hits = detectAll(m)
  if (hits.length === 0) return { type: null, errors: ['MODEL_TYPE_UNKNOWN'] }
  if (hits.length > 1) return { type: null, errors: ['MODEL_TYPE_CONFLICT:' + hits.map((c) => c.typeName).join(',')] }
  const C = hits[0]
  return { type: C.typeName, errors: C.validate(m) }
}

const here = dirname(fileURLToPath(import.meta.url))
const dir = join(here, '..', 'models')

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  for (const f of readdirSync(dir)) {
    if (f.startsWith('_') || !f.endsWith('-model.json')) continue
    const m = expand(join(dir, f))
    const { type, errors } = validateModel(m)
    console.log(`${m.id.padEnd(22)} [${type}] ${errors.length ? 'ERR ' + errors.slice(0, 3).join(';') : 'OK'}`)
  }
}
