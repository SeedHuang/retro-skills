# 项目统计数字必须附取数命令

> 来源：`no-unverified-number.json`（rule DSL，由 build.mjs 渲染，手改无效）

**触发**：`hasStatistic 等于 true` 不成立时不触发

**断言（全部成立才合规）**：
- `command 非空`
- `command 包含任一字面量 node  / Get-ChildItem / grep / rg `

**判定方式**：impl=script；测试在 `no-unverified-number.testcase.json`（正反例双向验证，正例防误拦、反例防漏判），由 build.mjs 执行；残余字段 command 由 reviewer-audit 抽 3 条核真伪（脚本判不死的部分）

**产物**：answer

**验证**：`node build.mjs` 末行 `rule-dsl ok` 且 exit 0；本文件由渲染生成，手改即失效（判据改同名 json、测试改同名 testcase.json）
