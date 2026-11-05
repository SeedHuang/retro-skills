# 判据正文不得留不可观察评价

> 来源：`observable-criteria.json`（rule DSL，由 build.mjs 渲染，手改无效）

**触发**：`gateRun 等于 true` 不成立时不触发

**断言（全部成立才合规）**：
- `checkObservableExit 等于 0`

**判定方式**：impl=script；测试在 `observable-criteria.testcase.json`（正反例双向验证，正例防误拦、反例防漏判），由 build.mjs 执行；残余字段 checkObservableExit 由 reviewer-audit 抽 3 条核真伪（脚本判不死的部分）

**产物**：node scripts/check-observable.mjs --check（末行 check-observable ok、exit 0）

**验证**：`node build.mjs` 末行 `rule-dsl ok` 且 exit 0；本文件由渲染生成，手改即失效（判据改同名 json、测试改同名 testcase.json）
