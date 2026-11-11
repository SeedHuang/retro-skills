import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expand } from '../../tools/docgen/builders/agent-model/verify-models.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const models = join(here, '..', '..', 'tools', 'docgen', 'builders', 'agent-model', 'models')
const names = ['evidence-reader', 'respondent-architect', 'respondent-dev', 'reviewer-actuary', 'reviewer-ai', 'detective-observer', 'reviewer-audit']

for (const n of names) {
  const exp = expand(join(models, `${n}-model.json`))
  writeFileSync(join(models, '_baseline', `${n}.json`), JSON.stringify(exp, null, 2))
}
console.log('baseline updated', names.length)
