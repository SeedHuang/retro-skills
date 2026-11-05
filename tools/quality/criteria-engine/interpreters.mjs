// 解释器组件注册表：同一份 rule schema → 不同文案投影
// 新增解释器 = 在此注册 { id, ext, describe, render }；数据、判定、校验零改动
// 判定语义不在解释器里（唯一实现在 schema.mjs 的 judge）——插拔的只有投影，没有语义
import { renderCond } from './schema.mjs'

export const interpreters = [
  {
    id: 'md',
    ext: 'md',
    describe: 'rule 正文（AI 每轮读到的完整形态）',
    render(rule) {
      const lines = [`# ${rule.title}`, '',
        `> 来源：\`${rule.id}.json\`（rule DSL，由 build.mjs 渲染，手改无效）`, '',
        `**触发**：\`${renderCond(rule.when)}\` 不成立时不触发`, '',
        '**断言（全部成立才合规）**：']
      for (const a of rule.assert) {
        lines.push(`- \`${renderCond(a)}\`${a.unless ? `（例外：${renderCond(a.unless)} 时豁免）` : ''}`)
        if (a.op === 'notForbiddenCommand') {
          lines.push(`  - 允许：${a.allow.join(' / ')}`)
          lines.push(`  - 禁止：${a.forbid.join(' / ')}`)
        }
      }
      lines.push('', `**判定方式**：impl=script；测试在 \`${rule.id}.testcase.json\`（正反例双向验证，正例防误拦、反例防漏判），由 build.mjs 执行；残余字段 ${rule.residual.fields.join(' / ')} 由 ${rule.residual.who} 抽 ${rule.residual.sample} 条核真伪（脚本判不死的部分）`, '',
        `**产物**：${rule.landing}`, '',
        '**验证**：`node build.mjs` 末行 `rule-dsl ok` 且 exit 0；本文件由渲染生成，手改即失效（判据改同名 json、测试改同名 testcase.json）', '')
      return lines.join('\n')
    },
  },
  {
    id: 'inject',
    ext: 'inject.md',
    describe: '注入版（压缩形态，进每轮上下文的最短投影）',
    render(rule) {
      const lines = [`【${rule.id}】${rule.title}`]
      lines.push(`触发：${renderCond(rule.when)}`)
      for (const a of rule.assert) {
        lines.push(`要求：${renderCond(a)}${a.unless ? `（例外：${renderCond(a.unless)}）` : ''}`)
        if (a.op === 'notForbiddenCommand') {
          lines.push(`禁止：${a.forbid.join(' / ')}`)
          lines.push(`允许：${a.allow.join(' / ')}`)
        }
      }
      lines.push(`产物：${rule.landing}`)
      return lines.join('\n') + '\n'
    },
  },
]
