import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from './args.mjs'
import { renderModel } from '../../../tools/agent-model/render/index.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const ENGINE = resolve(here, '..', '..', '..', 'tools', 'agent-model')

const { positional, flags } = parseArgs(process.argv.slice(2), ['out', 'shared'])
const modelPath = positional[0]
if (!modelPath) {
  console.error('用法：node scripts/render.mjs <model.json> [--out <dir>] [--shared <shared.json>]')
  process.exit(1)
}

const outDir = resolve(flags.out || join(here, '..', 'drafts'))
const sharedPath = resolve(flags.shared || join(ENGINE, 'models', '_shared-model.json'))
const shared = JSON.parse(readFileSync(sharedPath, 'utf8'))

try {
  const { type, text, lines } = renderModel(resolve(modelPath), shared)
  const id = basename(modelPath).replace(/-model\.json$/, '')
  mkdirSync(outDir, { recursive: true })
  const outFile = join(outDir, `${id}.md`)
  writeFileSync(outFile, text)
  console.log(`${id} [${type}] ${lines} lines`)
  console.log(`  -> ${outFile}`)
} catch (e) {
  console.error(e.message)
  process.exitCode = 1
}
