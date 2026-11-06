# 说出口的结论必须有可核出处

> 来源：`evidence-before-conclusion.json`（判据 json，由 build 渲染，手改即红）
> 触发：`writesConclusion 等于 true`

义务（全部成立才合规；缺一件 = 不合格）：
- anchor 非空
- anchor 包含任一字面量 : / exit / 命令
- scope 非空
- target 非空
- numbersCommand 非空（例外：hasNumbers 等于 false 时豁免）
- lookupReport 非空（例外：lookupHit 等于 true 时豁免）
- source 非空（例外：isCompoundDerivation 等于 false 时豁免）
- chain 非空（例外：isCompoundDerivation 等于 false 时豁免）
- boundary 非空（例外：isCompoundDerivation 等于 false 时豁免）

残余（抽检）：anchor / scope / target · reviewer-audit ×3

产物：答案 / 交付账
