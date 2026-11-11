import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expand } from '../../tools/agent-model/verify-models.mjs'
import { typeOf } from '../../tools/agent-model/render/index.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')
const MODELS = join(ROOT, 'tools', 'agent-model', 'models')
const SEATS = ['detective-observer', 'evidence-reader', 'respondent-architect', 'respondent-dev', 'reviewer-actuary', 'reviewer-ai', 'reviewer-audit', 'reviewer-product', 'reviewer-interaction', 'senior-sdet', 'speaker']
const SHARED = JSON.parse(readFileSync(join(MODELS, '_shared-model.json'), 'utf8'))
const split = (text) => text.split(/\n## /).slice(1).map((x) => {
  const i = x.indexOf('\n')
  return { name: x.slice(0, i), body: x.slice(i + 1).replace(/\s+$/, '') }
})
const secOf = (secs, n) => secs.find((s) => s.name === n)
const bodyOf = (secs, n) => (secOf(secs, n) || { body: '' }).body
const lines = (t) => t.split('\n').length

const rows = [], diffRows = [], bRows = [], missRows = []
for (const s of SEATS) {
  const sand = readFileSync(join(HERE, 'sandbox', `${s}.md`), 'utf8')
  const card = readFileSync(join(ROOT, 'agents', `${s}.md`), 'utf8')
  const a = split(sand), b = split(card)
  const kind = JSON.parse(readFileSync(join(MODELS, `${s}-model.json`), 'utf8')).boundary.kind
  const type = typeOf({ ...SHARED, ...expand(join(MODELS, `${s}-model.json`)) }) || '-'
  const bsec = bodyOf(a, '边界'), csec = bodyOf(b, '边界')
  const ok = bsec === csec
  rows.push(`| ${s} | ${type} | ${lines(sand)} | ${lines(card)} | ${sand.length} | ${card.length} | ${a.length}/${b.length} | ${kind} | ${ok ? '是' : '否'} | ${secOf(a, '输出格式') ? '有' : '无'} |`)
  for (const n of new Set([...a.map((x) => x.name), ...b.map((x) => x.name)])) {
    const sa = secOf(a, n), sb = secOf(b, n)
    // 段存在但正文为空 ≠ 段缺失；字符差只在两侧都存在时才算
    const st = !sa ? '仅现役' : !sb ? '仅沙箱' : sa.body === sb.body ? '一致' : '文本不同'
    const delta = !sa || !sb ? '-' : sa.body.length - sb.body.length
    diffRows.push(`| ${s} | ${n} | ${st} | ${delta} |`)
  }
  bRows.push(`| ${s} | ${kind} | ${bsec.length} | ${csec.length} | ${ok ? '是' : '否'} |`)
  if (!secOf(a, '输出格式')) missRows.push(`| ${s} | 输出格式 | 模型无 outputFormat 配置（P4 建模） |`)
}

const md = [
  '# P1 差异报告',
  '',
  '## 总览',
  '',
  '| 席 | 类型 | 沙箱行数 | 现役行数 | 沙箱字符 | 现役字符 | 段数（沙箱/现役） | 边界形态 | 边界一致 | 输出格式 |',
  '|---|---|---|---|---|---|---|---|---|---|',
  ...rows,
  '',
  '## 段级差异',
  '',
  '| 席 | 段 | 状态 | 字符差 |',
  '|---|---|---|---|',
  ...diffRows,
  '',
  '## 边界核对',
  '',
  '| 席 | 形态 | 沙箱长度 | 现役长度 | 逐字节相等 |',
  '|---|---|---|---|---|',
  ...bRows,
  '',
  '## 缺失项',
  '',
  '| 席 | 缺失项 | 原因 |',
  '|---|---|---|',
  ...(missRows.length ? missRows : ['| - | - | 无 |']),
  '',
  '## 已知差异归类',
  '',
  '| # | 差异 | 依据 |',
  '|---|---|---|',
  '| K1 | 沙箱多出 `## 产出` / `## 权限` 两段；2 张 policy 席另多 `## 越界处置` | spec S8；现役卡无这三段 |',
  '| K2 | `outputFormat` 校验由 observable 派生，措辞弱于现役散文 | spec S5 |',
  '| K3 | `reviewer-audit` 缺 `## 输出格式`——已补（P2 v3 补 `outputFormat`，本表已无缺失行） | spec S6；`reviewer-audit-model.json` 已建模 |',
  '| K4 | 边界形态三套并存 | spec S1/S2；现役事实 |',
  '| K5 | `seat.tier` 与策略档位并存 | spec S4；`TIER_MISMATCH` 守卫 |',
  '',
].join('\n')
writeFileSync(join(HERE, 'sandbox', 'diff-report.md'), md)
console.log('sandbox/diff-report.md')
