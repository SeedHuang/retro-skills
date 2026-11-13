// 共享块渲染：两侧只共用「块 → 文本」，不读任何领域字段。
const s = (v) => String(v ?? '')
const list = (items) => items.map(s)

export const h1 = (text) => ({ kind: 'h1', text: s(text) })
export const h2 = (text) => ({ kind: 'h2', text: s(text) })
export const h3 = (text) => ({ kind: 'h3', text: s(text) })
export const para = (text) => ({ kind: 'para', text: s(text) })
export const notes = (text) => ({ kind: 'notes', text: s(text) })
export const bullets = (items) => ({ kind: 'bullets', items: list(items) })
export const ordered = (items) => ({ kind: 'ordered', items: list(items) })
export const blank = () => ({ kind: 'blank' })
// raw 只给 agent 侧迁移垫片与「已有整段字符串」；rule 侧必须用结构化块
export const raw = (lines) => ({ kind: 'raw', lines: list(lines) })

function expand(block) {
  switch (block?.kind) {
    case 'h1': return [`# ${block.text}`]
    case 'h2': return [`## ${block.text}`]
    case 'h3': return [`### ${block.text}`]
    case 'para': return [block.text]
    case 'notes': return [`> ${block.text}`]
    case 'bullets': return block.items.map((t) => `- ${t}`)
    case 'ordered': return block.items.map((t, i) => `${i + 1}. ${t}`)
    case 'blank': return ['']
    case 'raw': return block.lines
    default: throw new Error(`未知块类型 ${JSON.stringify(block?.kind)}`)
  }
}

/** 按行展开后以 \n 连接；不自动加尾换行 */
export function renderBlocks(blocks) {
  return blocks.flatMap(expand).join('\n')
}
