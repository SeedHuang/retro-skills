# 说出口的结论必须有可核出处

> 来源：`evidence-before-conclusion.json`（rule DSL，由 build.mjs 渲染，手改无效）

**触发**：`writesConclusion 等于 true` 不成立时不触发

**断言（全部成立才合规）**：
- `anchor 非空`
- `anchor 包含任一字面量 : / exit / 命令`
- `scope 非空`
- `target 非空`
- `numbersCommand 非空`（例外：hasNumbers 等于 false 时豁免）
- `lookupReport 非空`（例外：lookupHit 等于 true 时豁免）
- `source 非空`（例外：isCompoundDerivation 等于 false 时豁免）
- `chain 非空`（例外：isCompoundDerivation 等于 false 时豁免）
- `boundary 非空`（例外：isCompoundDerivation 等于 false 时豁免）

**判定方式**：impl=script；测试在 `evidence-before-conclusion.testcase.json`（正反例双向验证，正例防误拦、反例防漏判），由 build.mjs 执行；残余字段 anchor / scope / target 由 reviewer-audit 抽 3 条核真伪（脚本判不死的部分）

**产物**：答案 / 交付账

**验证**：`node build.mjs` 末行 `rule-dsl ok` 且 exit 0；本文件由渲染生成，手改即失效（判据改同名 json、测试改同名 testcase.json）
