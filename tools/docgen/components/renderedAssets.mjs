// renderedAssets —— 「渲染物」注册表：agent 卡与 rule 正文共用同一套「数据 → 渲染 → 逐字节比对」
// 单一入口：gate / generate 都从这里取「期望字节」，不在两处各写一份比对逻辑。
// 新增一条渲染 rule = 在 RENDERED_RULES 加一个名字 + data/rules/<name>.json，代码零改动。
import { renderRule } from './renderRule.mjs'

export const RENDERED_RULES = ['evidence-before-conclusion']

/** rule 侧渲染物清单：[{ kind:'rule', name, path, bytes }] */
export function renderedRuleAssets() {
  return RENDERED_RULES.map((name) => ({
    kind: 'rule',
    name,
    path: `rules/${name}.md`,
    bytes: renderRule(name),
  }))
}
