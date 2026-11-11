import { readFileSync, existsSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from './args.mjs'
import { expand, verify, anyError } from '../../../tools/agent-model/verify-models.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const ENGINE = resolve(here, '..', '..', '..', 'tools', 'agent-model')

// 位置参数 = 模型文件；--ref <file> 追加等价比对；--shared <file> 覆盖共享层
const { positional, flags } = parseArgs(process.argv.slice(2), ['ref', 'shared'])
const modelPath = positional[0]
if (!modelPath) {
  console.error('用法：node scripts/verify.mjs <model.json> [--ref <model.json>] [--shared <shared.json>]')
  process.exit(1)
}

const id = basename(modelPath).replace(/-model\.json$/, '')
const sharedPath = resolve(flags.shared || join(ENGINE, 'models', '_shared-model.json'))
let shared
try {
  shared = JSON.parse(readFileSync(sharedPath, 'utf8'))
} catch (e) {
  console.error(`共享层不可用：${sharedPath}（${e.message}）`)
  process.exit(1)
}

// 有基线才做「与基线等价」判定；草稿新席无基线时只判 19 类码，状态词用 CHECKS_PASS，避免把「无码」读成「等价」
const hasBaseline = existsSync(join(ENGINE, 'models', '_baseline', `${id}.json`))
const r = verify(id, { modelPath: resolve(modelPath), baseline: hasBaseline, shared })
const ok = !anyError(r)

// 错误字段的通用投影：只列非空的错误位，不在此另写一份码表（码义见 references/checks.md）
const INFO = new Set(['name', 'tier', 'must', 'never', 'pred', 'rec', 'modelType', 'modelFiles', 'policyFiles'])
const codes = Object.fromEntries(
  Object.entries(r).filter(([k, v]) => !INFO.has(k) && (Array.isArray(v) ? v.length > 0 : Boolean(v)))
)

let refOk = true
let refNote = ''
if (flags.ref) {
  refOk = JSON.stringify(expand(resolve(modelPath), shared)) === JSON.stringify(expand(resolve(flags.ref), shared))
  refNote = refOk ? '  REF_EQUIVALENT' : `  REF_DIFF:${flags.ref}`
}

const status = ok ? (hasBaseline ? 'EQUIVALENT' : 'CHECKS_PASS') : 'FAIL'
console.log(`${id}  [${r.modelType || '-'}]  ${status}${refNote}`)
if (!ok) console.log(`codes: ${JSON.stringify(codes)}`)
process.exitCode = ok && refOk ? 0 : 1
