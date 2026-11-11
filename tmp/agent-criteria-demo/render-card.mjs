import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderModel } from '../../tools/docgen/builders/agent-model/render/index.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const MODELS = join(here, '..', '..', 'tools', 'docgen', 'builders', 'agent-model', 'models')
const shared = JSON.parse(readFileSync(join(MODELS, '_shared-model.json'), 'utf8'))
const { type, text, lines } = renderModel(join(MODELS, 'reviewer-audit-model.json'), shared)
mkdirSync(join(here, 'output'), { recursive: true })
writeFileSync(join(here, 'output/reviewer-audit.md'), text)
console.log('rendered', type, lines, 'lines')
