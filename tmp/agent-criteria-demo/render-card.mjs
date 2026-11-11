import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderModel } from './render/index.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const shared = JSON.parse(readFileSync(join(here, 'models/_shared-model.json'), 'utf8'))
const { type, text, lines } = renderModel(join(here, 'models/reviewer-audit-model.json'), shared)
mkdirSync(join(here, 'output'), { recursive: true })
writeFileSync(join(here, 'output/reviewer-audit.md'), text)
console.log('rendered', type, lines, 'lines')
