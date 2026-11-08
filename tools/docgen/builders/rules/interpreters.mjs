// 解释器组件注册表：同一份 rule schema → 不同文案投影
// 新增解释器 = 在此注册 { id, ext, describe, render }；数据、判定、校验零改动
// 判定语义不在解释器里（唯一实现在 schema.mjs 的 judge）——插拔的只有投影，没有语义
// 阶段 2b：md / rule 共用同一份 §4.1 模板；都不渲染来源与残余
// 2026-11-07：inject 投影无运行时消费者，已删除（解释器只剩 md / rule）
import { renderTrigger, renderObligation } from './schema.mjs'

/** §4.1 模板：标题 → 触发 → 编号义务 → 另见（可选）→ 落点 */
function renderDoc(rule) {
  const lines = [`# ${rule.title}`, '', `> 触发：${renderTrigger(rule)}`, '', '义务（全部成立才合规；缺一件 = 不合格）：']
  rule.assert.forEach((a, i) => lines.push(renderObligation(a, i)))
  lines.push('')
  if (Array.isArray(rule.refs) && rule.refs.length > 0) lines.push(`另见：${rule.refs.join('、')}`)
  lines.push(`落点：${rule.landing}`)
  return lines.join('\n') + '\n'
}

export const interpreters = [
  {
    id: 'md',
    ext: 'md',
    describe: 'rule 正文（AI 每轮读到的完整形态）',
    render: renderDoc,
  },
  {
    id: 'rule',
    ext: null,
    describe: 'rule 正文投影（= rules/<id>.md，仍由判据 json 渲染；散文只是投影，不是数据）',
    render: renderDoc,
  },
]
