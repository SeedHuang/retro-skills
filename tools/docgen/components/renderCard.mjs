// 卡面投影（spec §5.1 `:123-132`）：7 段 + front matter，**零散文**（散文只落 `card.rationale`，本文件不读它）。
// 纯投影：只吃 `(card, env)` 与登记表；不读盘、不派生席名（S4-TC-I04 / V-6）。
// 「零散文」的机械口径在 S1 `validateCardModel`（36 码）与 V-1 的段名断言，本文件只做渲染（不重复判一遍）。
import { CARD_SEGMENTS } from '../card-model/vocab/card-must-fields.mjs'
import { agentData } from './agentData.mjs'
import { patternRegistry, DEFAULT_BOUNDARY } from './patternRegistry.mjs'
import { outputFormats } from './outputFormats.mjs'
import { CARD_TEMPLATE } from './cardTemplate.mjs'

const cell = (v) => String(v ?? '').replace(/\r?\n/g, ' ').replace(/\|/g, '\\|')

function fill(template, key, value) {
  return template.replaceAll(key, () => value)
}

// 「一定会」每行必渲染 `MUST_FIELDS` 的五个字段名（硬编码英文名 = 契约字面，不另存第二份表）：
// 触发（scene id + moment）/ 宾语 / 判据 id / 落点 / 前置
function mustTable(must) {
  const head = ['| # | 必问（must） | 触发 | 宾语 | 判据 id | 落点 | 前置 |', '|---|---|---|---|---|---|---|']
  const rows = (Array.isArray(must) ? must : []).map((a, i) => {
    const t = a && a.trigger ? a.trigger : {}
    const objs = (a && Array.isArray(a.objects) ? a.objects : []).join('、') || '无'
    const req = (a && Array.isArray(a.requires) && a.requires.length ? a.requires.map((r) => r.id).join('、') : '无')
    return `| ${i + 1} | trigger: ${cell(t.scene)}／${cell(t.moment)} | objects: ${cell(objs)} | criterion: ${cell(a && a.criterion)} | landing: ${cell(a && a.landing)} | requires: ${cell(req)} |`
  })
  return head.concat(rows).join('\n')
}

function neverTable(never) {
  const head = ['| # | 禁止什么 | 宾语 | 判据 id |', '|---|---|---|---|']
  const rows = (Array.isArray(never) ? never : []).map((a, i) => {
    const objs = (a && Array.isArray(a.objects) ? a.objects : []).join('、') || '无'
    return `| ${i + 1} | 禁止 | objects: ${cell(objs)} | criterion: ${cell(a && a.criterion)} |`
  })
  return head.concat(rows).join('\n')
}

function checkTable(card) {
  const cats = (Array.isArray(card.categories) ? card.categories : []).map((c) => c && c.label).filter(Boolean)
  const items = Array.isArray(card.checkItems) ? card.checkItems : []
  const head = ['| # | 条目 | 判据 | 类型 |', '|---|---|---|---|']
  const rows = items.map((it, i) => `| ${i + 1} | ${cell(it && it.label)} | ${cell(it && it.criterion)} | ${cell(it && it.check)} |`)
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
  const cats = (Array.isArray(d.categories) ? d.categories : []).filter(Boolean)
  if (cats.length) lines.push(`关注类别：${cats.map(cell).join('、')}`)
  if (d.action) lines.push(`动作：${cell(d.action)}`)
  if (d.constraint) lines.push(`约束：${cell(d.constraint)}`)
  return lines.join('\n')
}

export function renderCard(card, env) {
  const seat = (env && env.seat) || (card && card.seat) || ''
  const boundary = (patternRegistry.boundaryBySeat && patternRegistry.boundaryBySeat[seat]) || DEFAULT_BOUNDARY
  let out = CARD_TEMPLATE
  out = fill(out, '{{NAME}}', cell(card && card.name))
  out = fill(out, '{{DESCRIPTION}}', cell(card && card.description))
  out = fill(out, '{{TOOLS}}', (Array.isArray(card && card.tools) ? card.tools : []).join(', '))
  out = fill(out, '{{DUTY}}', dutyBlock(card))
  out = fill(out, '{{MUST_TABLE}}', mustTable(card && card.must))
  out = fill(out, '{{NEVER_TABLE}}', neverTable(card && card.never))
  out = fill(out, '{{CHECK_TABLE}}', checkTable(card || {}))
  out = fill(out, '{{OUTPUT_FORMAT}}', outputFormatBlock(agentOutputKind(seat)))
  out = fill(out, '{{BOUNDARY}}', String(boundary))
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
