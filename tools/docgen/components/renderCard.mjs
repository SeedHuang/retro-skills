// 卡面投影（spec §5.1 `:123-132`）：7 段 + front matter，**零散文**（散文只落 `card.rationale`，本文件不读它）。
// 纯投影：只吃 `(card, env)` 与登记表；不读盘、不派生席名（S4-TC-I04 / V-6）。
// 「零散文」的机械口径在 S1 `validateCardModel`（36 码）与 V-1 的段名断言，本文件只做渲染（不重复判一遍）。
//
// S2 改形（spec §4 D1 / D2 / D6）：「一定会」「禁止」两段从 7 列 / 4 列表格改为 **`- <i>｜…` bullet**，
// `i` = 该段**数据序**（从 1 起连续）。`expectedBullet(card, i)` 是**唯一翻译点**（测试只逐字比对，不重写翻译）。
// 契约字面（类型三值 / 三态 / 许名 / 格式判句）一律 import `vocab/card-contract.mjs`，本文件 0 字面（`S2-TC-E07`）。
import { CARD_SEGMENTS } from '../card-model/vocab/card-must-fields.mjs'
import { PREDICATES } from '../card-model/vocab/predicates.mjs'
import { LANDINGS } from '../card-model/vocab/landings.mjs'
import { OBJECT_NAMES, REPEAT_NAMES } from '../card-model/vocab/object-names.mjs'
import { TYPE_LABELS, TRISTATE, ALLOWED_PRODUCT_NAMES, FORMAT_CHECKS } from '../card-model/vocab/card-contract.mjs'
import { SHARED_SCENES, MOMENTS } from '../card-model/enums.mjs'
import { agentData } from './agentData.mjs'
import { patternRegistry, DEFAULT_BOUNDARY } from './patternRegistry.mjs'
import { outputFormats } from './outputFormats.mjs'
import { CARD_TEMPLATE } from './cardTemplate.mjs'

const cell = (v) => String(v ?? '').replace(/\r?\n/g, ' ').replace(/\|/g, '\\|')
// bullet 里不需要转义竖线（不是表格单元格），但要把换行压平，防一条数据撑成两行（行序号对账会错位）
const flat = (v) => String(v ?? '').replace(/\r?\n/g, ' ').trim()

function fill(template, key, value) {
  return template.replaceAll(key, () => value)
}

// ── 中文名翻译（唯一取词处：宾语 / 频度 / 场景 / 时刻 / 落点 / 判据） ─────────────────────
// 找不到中文名的退回原值（名表漏登记会被 `S2-TC-A08` 的「双向相等」抓住，不靠这里的兜底）。
const objName = (o) => OBJECT_NAMES[o] ?? flat(o)
const repName = (r) => REPEAT_NAMES[r] ?? flat(r)
const sceneName = (s) => (SHARED_SCENES[s] && SHARED_SCENES[s].label) || flat(s)
const momentName = (m) => (MOMENTS[m] && MOMENTS[m].label) || flat(m)
const landingName = (l) => LANDINGS[l] ?? flat(l)
const criterionName = (c) => (PREDICATES[c] && PREDICATES[c].label) || flat(c)

const listOf = (v) => (Array.isArray(v) ? v : [])

// 「一定会」第 i 条（i 从 1 起，= 该段数据序）：何时 / 对什么 / 满足什么 / 写回哪里 /（可选）前提
// **唯一翻译点**：`renderCard` 内部也只调它，测试只 `assert.equal(line, expectedBullet(card, i))`
export function expectedBullet(card, i) {
  const must = listOf(card && card.must)
  const a = must[i - 1] || {}
  const t = a.trigger && typeof a.trigger === 'object' ? a.trigger : {}
  const when = `${sceneName(t.scene)}${momentName(t.moment)}（${repName(t.repeat)}）`
  const objs = listOf(a.objects).map(objName).join('、') || '（未声明宾语）'
  const crit = criterionName(a.criterion) || '（未声明判据）'
  const land = landingName(a.landing)
  const reqs = listOf(a.requires).map((r) => flat(r && r.id)).filter(Boolean)
  const tail = reqs.length ? `；前提：${reqs.join('、')}` : ''
  return `- ${i}｜${when}：对${objs}，要求${crit}，结论写回${land}${tail}。`
}

// 「禁止」第 i 条（同形，但 spec §3 #4 只把 `expectedBullet` 定为唯一翻译点 → 本函数不导出）
function neverBullet(card, i) {
  const never = listOf(card && card.never)
  const a = never[i - 1] || {}
  const objs = listOf(a.objects).map(objName).join('、') || '（未声明宾语）'
  const crit = criterionName(a.criterion) || '（未声明判据）'
  return `- ${i}｜不得${crit}（针对${objs}）；出现即违反。`
}

const mustBullets = (card) => listOf(card && card.must).map((_, k) => expectedBullet(card, k + 1)).join('\n')
const neverBullets = (card) => listOf(card && card.never).map((_, k) => neverBullet(card, k + 1)).join('\n')

// 类型列：`CHECK_KINDS` 键 → `TYPE_LABELS` 中文值（列数仍 4，不删列，`S2-TC-D03`）
function checkTable(card) {
  const cats = listOf(card.categories).map((c) => c && c.label).filter(Boolean)
  const items = listOf(card.checkItems)
  const head = ['| # | 条目 | 判据 | 类型 |', '|---|---|---|---|']
  const rows = items.map((it, i) => `| ${i + 1} | ${cell(it && it.label)} | ${cell(it && it.criterion)} | ${cell(TYPE_LABELS[it && it.check] ?? (it && it.check))} |`)
  const prefix = cats.length ? `类别：${cats.map(cell).join('、')}\n\n` : ''
  return `${prefix}${head.concat(rows).join('\n')}`
}

function outputFormatBlock(outputKind) {
  const f = outputFormats[outputKind]
  if (!f || !Array.isArray(f.fields) || !Array.isArray(f.checks)) return ''
  const fieldRows = f.fields.map((x, i) => `| ${i + 1} | ${cell(x)} |`)
  const out = ['必填字段：', '', '| # | 字段 |', '|---|---|', ...fieldRows, '', '校验：', '']
  for (const c of f.checks) out.push(`- ${cell(c)}`)
  return out.join('\n')
}

function dutyBlock(card) {
  const d = card && card.duty && typeof card.duty === 'object' ? card.duty : {}
  const lines = []
  if (d.trigger) lines.push(`触发：${cell(d.trigger)}`)
  // `duty.categories` 不再渲染（S-B spec §11.1 R8）：注入后它与「本席清单」上方的 `类别：` 行字面完全相同，
  // 同卡印两遍是纯冗余。关注点由 `checkTable` 的 `类别：` 行承担。
  if (d.action) lines.push(`动作：${cell(d.action)}`)
  if (d.constraint) lines.push(`约束：${cell(d.constraint)}`)
  return lines.join('\n')
}

// 三态 5 行（1 行中文解释 + 4 行常量）：逐行原样落，不加 bullet 前缀（`S2-TC-D04` 逐字比对 `TRISTATE`）
const tristate = () => TRISTATE.join('\n')
// 产物允许名（许）单源来自 `ALLOWED_PRODUCT_NAMES`；这句壳文案不是契约字面（`S2-TC-E07` 只扫枚举字面）
const productNames = () => `产物字段名只许：${ALLOWED_PRODUCT_NAMES.join(' / ')}；自造键 = 不合规。`
// 三判句只在**问题卡产物**（`outputKind = issue-card`）的席上落：它的三个字段（必填项 / 证据栏 / 建议解法栏）
// 是问题卡专有；取证席（evidence）的输出格式不得出现「建议解法」类字段（`evidence-reader.test.mjs` 的 B04 / E08 判据），
// 故非 issue-card 席渲染空串（模板槽位仍在，`S2-TC-E05` 只要求模板占位符在位）。
const formatChecks = (seat) => (agentOutputKind(seat) === 'issue-card' ? FORMAT_CHECKS.map((s) => `- ${s}`).join('\n') : '')

export function renderCard(card, env) {
  const seat = (env && env.seat) || (card && card.seat) || ''
  // 边界取席条目自身的 boundary（spec §5.1 :132：`tools` + 权限物料）；未声明槽位的席退回 DEFAULT_BOUNDARY
  const entry = agentData.find((x) => x.name === seat)
  const boundary = (entry && entry.boundary) || DEFAULT_BOUNDARY
  let out = CARD_TEMPLATE
  out = fill(out, '{{NAME}}', cell(card && card.name))
  out = fill(out, '{{DESCRIPTION}}', cell(card && card.description))
  out = fill(out, '{{TOOLS}}', listOf(card && card.tools).join(', '))
  out = fill(out, '{{DUTY}}', dutyBlock(card))
  out = fill(out, '{{MUST_BULLETS}}', mustBullets(card))
  out = fill(out, '{{TRISTATE}}', tristate())
  out = fill(out, '{{NEVER_BULLETS}}', neverBullets(card))
  out = fill(out, '{{CHECK_TABLE}}', checkTable(card || {}))
  out = fill(out, '{{OUTPUT_FORMAT}}', outputFormatBlock(agentOutputKind(seat)))
  out = fill(out, '{{FORMAT_CHECKS}}', formatChecks(seat))
  out = fill(out, '{{BOUNDARY}}', String(boundary))
  out = fill(out, '{{PRODUCT_NAMES}}', productNames())
  // 7 段单源守卫：模板少一段 / 改名 → 立即红（不在产物里留下缺段）
  for (const seg of CARD_SEGMENTS) {
    if (!out.includes(`## ${seg}`)) {
      const e = new Error(`MissingSlot：模板缺「## ${seg}」段（card-must-fields.mjs 的 CARD_SEGMENTS 为唯一单源）`)
      e.code = 'MissingSlot'
      throw e
    }
  }
  if (/\{\{[A-Z_]+\}\}/.test(out)) {
    const e = new Error(`MissingSlot：模板槽位未填充（${seat}）`)
    e.code = 'MissingSlot'
    throw e
  }
  return out
}

// 卡面无 `outputKind` 字段（Card 12 键里没有），故由席名回查数据层（渲染输入仍只来自 agentData）
function agentOutputKind(seat) {
  const a = agentData.find((x) => x.name === seat)
  return a ? a.outputKind : undefined
}
