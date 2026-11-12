import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { parseArgs } from './args.mjs'
import { renderModel } from '../../../tools/docgen/models/agents/render/index.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const ENGINE = resolve(here, '..', '..', '..', 'tools', 'docgen', 'models', 'agents')

const { positional, flags } = parseArgs(process.argv.slice(2), ['out', 'shared'])
const modelPath = positional[0]
if (!modelPath) {
  console.error('用法：node scripts/render.mjs <model.json> [--out <dir>] [--shared <shared.json>]')
  process.exit(1)
}

// 预览是临时件：默认落系统临时目录（不入仓）；--out 可覆盖
const sharedPath = resolve(flags.shared || join(ENGINE, 'jsons', '_shared.json'))
const shared = JSON.parse(readFileSync(sharedPath, 'utf8'))

try {
  const { type, text, lines } = renderModel(resolve(modelPath), shared)
  const base = basename(modelPath)
  const id = base === 'index.json' ? basename(dirname(modelPath)) : base.replace(/-model\.json$/, '')
  const outDir = flags.out ? resolve(flags.out) : join(tmpdir(), 'agent-modeling', id)
  mkdirSync(outDir, { recursive: true })
  const outFile = flags.out ? join(outDir, `${id}.md`) : join(outDir, 'preview.md')
  writeFileSync(outFile, text)
  console.log(`${id} [${type}] ${lines} lines`)
  console.log(`  -> ${outFile}`)
} catch (e) {
  console.error(e.message)
  process.exitCode = 1
}
