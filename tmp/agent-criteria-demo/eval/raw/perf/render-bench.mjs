import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderModel } from '../../../render/index.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const demo = join(here, '..', '..', '..')
const shared = JSON.parse(readFileSync(join(demo, 'models/_shared-model.json'), 'utf8'))
const models = readdirSync(join(demo, 'models')).filter(f => f.endsWith('-model.json') && !f.startsWith('_')).sort()
const med = a => { const b = [...a].sort((x, y) => x - y); const n = b.length; return n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2 }
for (const f of models) {
  const p = join(demo, 'models', f)
  const times = []
  for (let i = 0; i < 10; i++) {
    const t0 = process.hrtime.bigint()
    renderModel(p, shared)
    times.push(Number(process.hrtime.bigint() - t0) / 1e6)
  }
  console.log(`${f.replace('-model.json', '')}\tmed_ms=${med(times).toFixed(2)}\tmin=${Math.min(...times).toFixed(2)}\tmax=${Math.max(...times).toFixed(2)}`)
}
