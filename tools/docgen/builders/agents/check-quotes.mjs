// PRD V6 引句校验器：语料 = `docs/superpowers/reviews/**/observation-*.json` 的 `items[].evidence`，
// 逐条交给 `checkEvidence()`（唯一证据校验实现，本文件不另写一套）→ 任一红即 exit 1；语料 < 2 条也 exit 1（fail-closed）。
// 不进 `npm run check` 的**门禁段**：语料是历史观察记录的产物面，把它接成门禁段等于给「归档」加禁令（spec §11.1 R3）。
// 注意：`npm run check` 的 ② 段跑全仓测试，`sb-contract-layer.test.mjs` 的 SB-TC-03 等用例对**真仓**语料跑本脚本 →
// 语料归档到 < 2 条时仍会经测试面变红（没有专项报码）；耦合与张力登记在 `docs/after/` 那条（带触发条件）。
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { checkEvidence, repoRoot } from '../observation-check/evidence.mjs'
import { ARTIFACT_RE } from '../observation-check/gate-scan.mjs'

const fail = (line) => { console.log(line); process.exit(1) }

// 语料文件名口径与 ⑥ 段同源（`ARTIFACT_RE`）；只吃 `.json`——`.md` 是渲染投影，按 JSON 解析必崩
const isCorpusJson = (name) => ARTIFACT_RE.test(name) && name.endsWith('.json')

function walk(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name)
    if (ent.isDirectory()) walk(p, out)
    else if (isCorpusJson(ent.name)) out.push(p)
  }
  return out.sort()
}

// detail 可能自带括号说明（如 `路径无法解析（realpath 失败）`），只取首段，避免输出行套两层括号
const firstSeg = (detail) => String(detail ?? '').split(/[；;]/)[0].trim()

let root
try {
  root = repoRoot()
} catch (e) {
  fail(`check-quotes: ${e.code ?? 'RepoRootUnresolved'}（${e.message}）=> fail`)
}

const base = join(root, 'docs', 'superpowers', 'reviews')
const files = walk(base)

const bad = []
let evidence = 0
for (const abs of files) {
  const rel = abs.slice(root.length + 1).replace(/\\/g, '/')
  let doc
  try {
    doc = JSON.parse(readFileSync(abs, 'utf8'))
  } catch (e) {
    fail(`check-quotes: ${rel} 不是合法 JSON（${e.message}）=> fail`)
  }
  if (!Array.isArray(doc.items)) fail(`check-quotes: ${rel} 缺 items[]（畸形语料不得静默跳过）=> fail`)
  doc.items.forEach((it, i) => {
    if (!it || typeof it !== 'object' || !Object.prototype.hasOwnProperty.call(it, 'evidence')) return
    evidence += 1
    const r = checkEvidence(it.evidence)
    if (!r.ok) bad.push(`${rel}:items[${i}].${it.id ?? '(无 id)'} → ${r.code}（${firstSeg(r.detail)}）`)
  })
}

if (bad.length) {
  for (const line of bad) console.log(line)
  fail(`check-quotes: files ${files.length} / evidence ${evidence} / bad ${bad.length} => fail`)
}
if (evidence < 2) fail(`check-quotes: 语料 ${evidence} 条（需 ≥2，fail-closed）`)

console.log(`check-quotes: files ${files.length} / evidence ${evidence} / bad 0 => ok`)
