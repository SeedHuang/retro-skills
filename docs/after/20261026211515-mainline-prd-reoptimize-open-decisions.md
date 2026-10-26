# mainline PRD 重新优化（未决）

> 状态：**未决（待做）**。这是待办入口，不是设计稿。
> 来源：用户 2026-10-26 裁定「本PRD优先级更高，mainline的prd需要重新优化」；依据 `docs/prd/20261026205821-agent-card-contract.md` §0.2 A-9 / §7 D-08。
> 何时搬走：mainline PRD 重签 §0 并改完 §12 后，把结论并入那份 PRD，本条删除。

## 要改什么

`docs/prd/20261024073606-dev-workflow-mainline/index.md`：

1. **§12 S3 行**（现写「`tools/docgen` 生成源 + 15 张卡重生成 + `test/*.test.mjs` 断言」）——让出「全席重生成」，只保留 `speaker` + `respondent-*` 新卡与两张矩阵；重生成移交 `agent-card-contract` PRD 的 S4。
2. **§12 S6 行**（现写改 `agentData.mjs`）——写清与本 PRD S1/S4 的边界：哪部分归「权限 / 字符串单源」（S6），哪部分归「卡契约模型」（本 PRD S1）。
3. **§0 重签**：功能点集合发生了变化（R5 → 功能增删类漂移），必须回 §0 重签并留痕。

## 为什么不能就地忽略

- 两份 PRD 同时认领 `tools/docgen` 模型改造与「全席重生成」→ 同一批卡会被改两遍，或两边互相等。
- mainline S3 已排在 S1、S5 之后且未开工，本 PRD 的产物门禁先落地对它只有好处。

## 验收（做完即结案）

- mainline §12 S3 / S6 两行不再出现「重生成」与 `agentData.mjs` 的无主认领；
- mainline §0 有 2026-10-26 之后的重签记录；
- 两份 PRD 对 `tools/docgen` 的认领互不重叠，可用 `grep -n 'tools/docgen' docs/prd/*/index.md docs/prd/*.md` 逐行比对；
- 本条从 `docs/after/` 删除。
