# Git 写操作必须用户当面点名

> 来源：`no-git-write.json`（rule DSL，由 build.mjs 渲染，手改无效）

**触发**：`command 非空` 不成立时不触发

**断言（全部成立才合规）**：
- `command 未命中禁止命令（最长允许前缀优先）`（例外：userNamed 等于 true 时豁免）
  - 允许：git status / git log / git diff / git show / git branch / git remote -v
  - 禁止：git commit / git push / git pull / git merge / git rebase / git reset / git revert / git cherry-pick / git checkout / git restore / git clean / git stash / git tag / git add / git config / git remote

**判定方式**：impl=script；测试在 `no-git-write.testcase.json`（正反例双向验证，正例防误拦、反例防漏判），由 build.mjs 执行；残余字段 userNamed 由 reviewer-audit 抽 3 条核真伪（脚本判不死的部分）

**产物**：command-record

**验证**：`node build.mjs` 末行 `rule-dsl ok` 且 exit 0；本文件由渲染生成，手改即失效（判据改同名 json、测试改同名 testcase.json）
