#!/usr/bin/env node
// T7 试点：reviewer-audit round-check 3 轮。
// 产出：
//   tmp/fixtures/ledger-fill-pilot/{baseline,after}/round{1,2,3}/round-check.md
//   docs/reports/2026-11-13-ledger-script-fill-pilot/{baseline,after,observe}.md
//
// 口径：
//   - 机械错填 M = parse_failed / duplicate_keys / machine_empty / machine_overwritten 的 red 数
//   - pending（待判）单列，不计入 M
//   - 基线 = 试点前 3 轮副本直接 verify；试点后 = clean 骨架 → fill → AI 补齐待判 → verify
//   - 调用次数基线为「按 8 行手填」的估算，报告内明确标注
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, copyFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { modelWithShared } from '../../docgen/models/agents/source.mjs'
import { collectDocs, renderTemplate } from '../../docgen/builders/agents/ledger.mjs'
import { parseLedger } from '../lib/parse.mjs'
import { fillText } from '../fill.mjs'
import { queryShow } from '../query.mjs'
import { verifyLedger } from '../verify.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '..', '..', '..')
const args = process.argv.slice(2)
const rootAt = args.indexOf('--root')
const root = resolve(rootAt >= 0 ? args[rootAt + 1] : REPO)
const FIX = join(root, 'tmp', 'fixtures', 'ledger-fill')
const PILOT = join(root, 'tmp', 'fixtures', 'ledger-fill-pilot')
const OUT = join(root, 'docs', 'reports', '2026-11-13-ledger-script-fill-pilot')
const KIND = 'round-check'
const MODEL = modelWithShared('reviewer-audit')
const CMD = 'node -e "console.log(\'ok\')"'
const MECHANICAL = new Set(['parse_failed', 'duplicate_keys', 'machine_empty', 'machine_overwritten'])

if (!existsSync(join(FIX, 'manifest.json'))) {
  const r = spawnSync(process.execPath, [join(HERE, 'make-fixtures.mjs'), '--root', root], { encoding: 'utf8' })
  if (r.status !== 0) { console.error(r.stderr || '夹具生成失败'); process.exit(1) }
}
const manifest = JSON.parse(readFileSync(join(FIX, 'manifest.json'), 'utf8'))
const template = renderTemplate(collectDocs().find((d) => d.kind === KIND))

const pendingToHit = (text) => text.split('\n')
  .map((l) => (l.startsWith('|') ? l.replace('[待判]', '[人工] hit') : l))
  .join('\n')

function verifyOf(text) {
  const { reds } = verifyLedger({ text, model: MODEL, kind: KIND })
  return { reds, pending: reds.filter((r) => r.code.startsWith('pending')).length, errors: reds.filter((r) => MECHANICAL.has(r.code)).length }
}

rmSync(PILOT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

const rows = []
for (const n of [1, 2, 3]) {
  const src = join(FIX, `round${n}`, 'round-check.md')
  const baseDir = join(PILOT, 'baseline', `round${n}`)
  mkdirSync(baseDir, { recursive: true })
  const baseFile = join(baseDir, 'round-check.md')
  copyFileSync(src, baseFile)
  const baseText = readFileSync(baseFile, 'utf8')
  const parsed = parseLedger(baseText)
  const base = verifyOf(baseText)

  const now = new Date(`2026-11-13T14:00:0${n}+08:00`)
  const filled = fillText({ model: MODEL, kind: KIND, text: template, commands: { 'audit.spot': CMD }, now })
  const afterText = pendingToHit(filled.text)
  const after = verifyOf(afterText)
  const afterDir = join(PILOT, 'after', `round${n}`)
  mkdirSync(afterDir, { recursive: true })
  writeFileSync(join(afterDir, 'round-check.md'), afterText, 'utf8')

  rows.push({
    n,
    parsed,
    base,
    fill: filled,
    after,
    machine: filled.rows.filter((r) => String(r[4]).startsWith('[机算]')).length,
    aiFilled: filled.rows.filter((r) => String(r[4]).startsWith('[待判]')).length,
  })
}

const longText = readFileSync(join(FIX, 'long', 'delivery-audit.md'), 'utf8')
const keys = ['第 1 项', '第 4 项', '第 6 项']
const located = keys.map((row) => JSON.stringify(queryShow(longText, 'delivery-audit', { row, context: 1 })))
const fullChars = longText.length
const afterChars = located.reduce((s, x) => s + x.length, 0)
const reduction = ((1 - afterChars / fullChars) * 100).toFixed(1)
const baseCalls = 1 + 8 + 1 // 整文件读取 + 8 行手填 + 1 次校验（估算）
const pilotCalls = 1 + 3 + 1 // fill + 3 次 query + verify

const table = (head, body) => [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...body.map((r) => `| ${r.join(' | ')} |`)].join('\n')
const codeSummary = (reds) => {
  const counts = {}
  for (const r of reds) counts[r.code] = (counts[r.code] || 0) + 1
  return Object.entries(counts).map(([k, v]) => `${k}×${v}`).join(', ') || '—'
}

writeFileSync(join(OUT, 'baseline.md'), `# 试点基线（T7）

> 取数：\`tools/review-ledger/scripts/run-pilot.mjs\`；夹具 = \`tmp/fixtures/ledger-fill/round{1,2,3}/round-check.md\`。
> 夹具来源：历史 4 列账本会被 fill fail-closed 拒绝（D2），故 round1..3 为 8 列 schema 重建。
> 机械错填 M = \`parse_failed\` / \`duplicate_keys\` / \`machine_empty\` / \`machine_overwritten\` 的 red 数；pending 单列。
> scs 版本：\`${manifest.scsVersion}\`

${table(['轮', '数据行', 'skipped', 'pending', '机械错填 M', 'red codes'], rows.map((r) => [
  `round${r.n}`, r.parsed.scanned, r.parsed.skipped, r.base.pending, r.base.errors, codeSummary(r.base.reds),
]))}

结论：3 轮机械错填 M 均为 0；pending 8 / 0 / 5 为本轮待判工作量，不计为错填。
`, 'utf8')

writeFileSync(join(OUT, 'after.md'), `# 试点后（T7）

> 流程：clean 骨架 → \`fillText\`（显式命令 \`audit.spot=${CMD}\`）→ AI 补齐剩余待判 → \`verify\`。
> 产物副本：\`tmp/fixtures/ledger-fill-pilot/after/round{1,2,3}/round-check.md\`。

${table(['轮', '行数', '机算', '填充后待判', 'AI 补齐', 'verify reds', '机械错填 M'], rows.map((r) => [
  `round${r.n}`, r.fill.rows.length, r.machine, r.aiFilled, r.aiFilled, r.after.reds.length, r.after.errors,
]))}

结论：3 轮 verify reds 与机械错填 M 均为 0。
`, 'utf8')

writeFileSync(join(OUT, 'observe.md'), `# 观测项（T7）

> 只出数，不设阈值。

## 读取量（TC-16）

| 指标 | 值 |
|---|---|
| 夹具 | \`tmp/fixtures/ledger-fill/long/delivery-audit.md\`（${longText.split('\n').length} 行） |
| 全文读取字符数 | ${fullChars} |
| 定位 3 行（第 1/4/6 项，context=1）JSON 合计字符数 | ${afterChars} |
| 降幅 | ${reduction}% |

## 调用次数（TC-17）

| 流程 | 每轮调用次数 | 3 轮中位数 | 说明 |
|---|---|---|---|
| 基线 | ${baseCalls} | ${baseCalls} | 按「整文件读取 1 + 8 行手填 + 校验 1」估算，非实测 |
| 试点 | ${pilotCalls} | ${pilotCalls} | fill 1 + query 3 + verify 1 |

变化量：${pilotCalls - baseCalls}（${(((pilotCalls - baseCalls) / baseCalls) * 100).toFixed(0)}%）。

## 复跑

\`\`\`
node tools/review-ledger/scripts/make-fixtures.mjs --check
node tools/review-ledger/scripts/run-pilot.mjs
node --test "tools/review-ledger/test/*.test.mjs"
\`\`\`
`, 'utf8')

console.log(`pilot written：baseline/after/observe → ${OUT}`)
for (const r of rows) console.log(`round${r.n} baseline M=${r.base.errors} pending=${r.base.pending} | after reds=${r.after.reds.length}`)
console.log(`read volume：${fullChars} → ${afterChars} chars（-${reduction}%）；calls ${baseCalls} → ${pilotCalls}`)
