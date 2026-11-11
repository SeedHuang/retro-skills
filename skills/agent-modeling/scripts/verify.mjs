import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expand, verify, anyError } from '../../../tools/agent-model/verify-models.mjs'

const here = dirname(fileURLToPath(import.meta.url))

// 位置参数 = 模型文件；--ref <file> 追加等价比对；--shared 仅为兼容预留（引擎恒用自身共享层）
const argv = process.argv.slice(2)
let modelPath = ''
let refPath = ''
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--ref') { refPath = argv[++i] || ''; continue }
  if (argv[i] === '--shared') { i++; continue }
  if (argv[i].startsWith('--')) continue
  if (!modelPath) modelPath = argv[i]
}
if (!modelPath) {
  console.error('用法：node scripts/verify.mjs <model.json> [--ref <model.json>]')
  process.exit(1)
}

const id = basename(modelPath).replace(/-model\.json$/, '')
const r = verify(id, { modelPath: resolve(modelPath), baseline: false })
const ok = !anyError(r)

// 错误字段的通用投影：只列非空的错误位，不在此另写一份码表（码义见 references/checks.md）
const INFO = new Set(['name', 'tier', 'must', 'never', 'pred', 'rec', 'modelType', 'modelFiles', 'policyFiles'])
const codes = Object.fromEntries(
  Object.entries(r).filter(([k, v]) => !INFO.has(k) && (Array.isArray(v) ? v.length > 0 : Boolean(v)))
)

let refOk = true
let refNote = ''
if (refPath) {
  refOk = JSON.stringify(expand(resolve(modelPath))) === JSON.stringify(expand(resolve(refPath)))
  refNote = refOk ? '  REF_EQUIVALENT' : `  REF_DIFF:${refPath}`
}

console.log(`${id}  [${r.modelType || '-'}]  ${ok ? 'EQUIVALENT' : 'FAIL'}${refNote}`)
if (!ok) console.log(`codes: ${JSON.stringify(codes)}`)
process.exitCode = ok && refOk ? 0 : 1
