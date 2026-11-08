// renderedAssets —— 「渲染物」注册表：agent 卡与 rule 正文共用同一套「数据 → 渲染 → 逐字节比对」
// rule 侧的数据与渲染器都在判据引擎里（data + script，正文不含任何手写散文）：
//   `tools/docgen/dsl/rules/<id>.json` → `renderRule(id)`（= interpreters 的 `rule` 投影）；
// 本文件只做「接到 docgen 的比对/落盘」这一层，不另存一份文案或渲染逻辑。
import { listRuleIds, renderRule, writeRule } from '../../rules/rules.mjs'

/** 引擎里登记了正文投影的 rule 名单（新增 = 在 rules.json 加 id，代码零改动） */
export const RENDERED_RULES = listRuleIds()

/** rule 侧渲染物清单：[{ kind:'rule', name, path, bytes }] */
export function renderedRuleAssets() {
  return RENDERED_RULES.map((name) => ({
    kind: 'rule',
    name,
    path: `rules/${name}.md`,
    bytes: renderRule(name),
  }))
}

/** 显式落盘（只有 `generate --kind rule --name <名> --apply` 会调；gate 只比对不写） */
export function writeRenderedRule(name) {
  return writeRule(name)
}

export function renderRenderedRule(name) {
  return renderRule(name)
}
