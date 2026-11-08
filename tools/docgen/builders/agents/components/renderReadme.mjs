// README 投影（spec §5 `:116`）：每席一份（rationale + 覆盖记录表）+ index（五列，§3 `:54`）。
// 纯投影：只吃 `(card, overrides)` / `(cards)` 与数据层登记（席名 / 维度 / 输出类型从 `agentData` 回查）。
import { agentData } from './agentData.mjs'

const cell = (v) => String(v ?? '').replace(/\r?\n/g, ' ').replace(/\|/g, '\\|')

export function renderReadme(card, overrides) {
  const a = agentData.find((x) => x.name === (card && card.name)) || {}
  const rows = (Array.isArray(overrides) ? overrides : []).map((o) => {
    const changed = Array.isArray(o.changed) ? o.changed.join('、') : String(o.changed ?? '')
    return `| ${cell(o.id)} | ${cell(changed)} | ${cell(o.reason)} |`
  })
  return [
    `# ${cell(card && card.name)}`,
    '',
    `- 角色：${cell(a.role)}`,
    `- 维度：${cell(a.dimension)}`,
    `- 输出类型：${cell(a.outputKind)}`,
    '',
    '## 职责缘由',
    '',
    String((card && card.rationale) || ''),
    '',
    '## 覆盖记录',
    '',
    '| id | changed | reason |',
    '|---|---|---|',
    ...rows,
    '',
  ].join('\n')
}

export function renderIndex(cards) {
  const rows = (Array.isArray(cards) ? cards : []).map((c) => {
    const a = agentData.find((x) => x.name === (c && c.name)) || {}
    return `| ${cell(c && c.name)} | ${cell(c && c.description)} | ${cell(a.dimension)} | ${cell(a.outputKind)} | \`docs/agents/${cell(c && c.name)}.md\` |`
  })
  return [
    '# 角色席索引',
    '',
    '| 席名 | 职责一句 | 维度 | 输出类型 | 链接 |',
    '|---|---|---|---|---|',
    ...rows,
    '',
  ].join('\n')
}
