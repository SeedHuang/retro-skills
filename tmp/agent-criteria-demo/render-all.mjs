import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderModel } from '../../tools/docgen/builders/agent-model/render/index.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const mi = process.argv.indexOf('--models')
const MODELS = mi > -1 ? resolve(process.argv[mi + 1]) : join(here, '..', '..', 'tools', 'docgen', 'builders', 'agent-model', 'models')
const shared = JSON.parse(readFileSync(join(MODELS, '_shared-model.json'), 'utf8'))
const i = process.argv.indexOf('--out')
if (i > -1 && !process.argv[i + 1]) {
  console.error('用法：node render-all.mjs [--out <dir>]')
  process.exit(1)
}
const outDir = resolve(here, i > -1 ? process.argv[i + 1] : 'sandbox')
mkdirSync(outDir, { recursive: true })
// 先清掉上一轮产物：模型改名/删席后旧 <seat>.md 不得残留（否则「N 个 md」的计数断言会假红）
for (const f of readdirSync(outDir)) if (f.endsWith('.md')) rmSync(join(outDir, f))

try {
  for (const f of readdirSync(MODELS)) {
    if (f.startsWith('_') || !f.endsWith('-model.json')) continue
    const { type, text, lines } = renderModel(join(MODELS, f), shared)
    const id = f.replace('-model.json', '')
    writeFileSync(join(outDir, `${id}.md`), text)
    console.log(`${id.padEnd(22)} [${type}] ${lines} lines`)
  }
} catch (e) {
  console.error(e.message)
  process.exit(1)
}
