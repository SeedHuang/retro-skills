# agent-card S4 渲染层 —— 已知限制与待办（open items）

> **状态**：**未决（已知限制，非阻塞交付）**。本文承接 `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design-testcase.md` 与 ④ 段结论（`quality-4.md` §6 / 交付审计 `delivery-5-s4.md` §D）里**没有 git 内落点**的 4 条限制 + 2 条 P2 观察；每条写齐四项：**限制原文（`path:line`）/ 漏检样例 / 谁人工兜 / 触发信号**。
> **何时搬走**：某条被闭合（补基线 / 接线 / 改判据 / 填数据）后，从本文删除并把结论并入对应 spec、测试或规则；全部闭合后本文改名以 `-done` 结尾（或删除）。

## 一、未决限制

### S4-L1 `S4-TC-A06` 只钉「整段 + 首/尾 12 字窗」，rationale 的**中段**可漏

- **限制原文**：`tools/docgen/test/card-render.test.mjs` 的 `S4-TC-A06` 只断「卡面不含 rationale 整段 / 首 12 字窗 / 尾 12 字窗」；`docs/superpowers/specs/2026-10-29-agent-card-s4-render-design-testcase.md` 的 A06 日期注已写明「原首窗判定在多席上会假阳性」。
- **漏检样例**：渲染器若只把 rationale 的**中段**（既不含首 12 字、也不含尾 12 字、更不含整段）漏进卡面，三条断言全绿 → 「散文只进 rationale」被放过。
- **谁人工兜**：⑤ 段交付审计与议会走查「职责」段与 rationale 的差异；④ 段 sdet 的 §6 `G-5` 已登记为残余。
- **触发信号**：下次改 `renderCard.mjs` 的「职责」段渲染、或改 `rationale` 的来源字段时，同批补「中段窗口」断言（或改为逐句比对）。

### S4-L2 删本席 `must` / `never` 的**源条目**会静默重建，逐席条目数无基线

- **限制原文**：`tools/docgen/components/cardPipeline.mjs` 的 `mergeList` 以共享层为底重建，删本席条目后 `buildCards().errors` 仍为 0；`S4-TC-A02` 只判「整键删除」，不判条目条数。
- **漏检样例**：某席漏迁 1 条本席独有条目（如 `must` 5 → 4），任何机械判据都不红，卡面少一行。
- **谁人工兜**：⑤ 段交付审计逐席核「本席清单」条数与 PRD A-5 / A-6 的对应；议会测试评委走查卡面。
- **触发信号**：下次改 `agentData.mjs` 任一席的 `card.must` / `card.never`，或新增席时，同批为每席登记条目数基线并加断言。

### S4-L3 `gate` 一次只点名**第一个** drift（多漂移时其余不可见）

- **限制原文**：`tools/docgen/cli.mjs` 的 `gateChecks()` 取 `[...drifts].sort((a, b) => PRIORITY(a) - PRIORITY(b))[0]` 后即 `fail()`；`S4-TC-F03` / `F04` 各只构造单处手改。
- **漏检样例**：同时手改卡面与 README → 只报第一处；修完重跑才发现第二处，容易被读成「只有一处坏」。
- **谁人工兜**：⑤ 段交付审计按「修一处 → 重跑 gate」多轮直至绿；④ 段 sdet 的 §6 `G-2` / `G-4` 已登记。
- **触发信号**：下次改 `gateChecks` 的失败汇总逻辑时，同批改为逐个打印全部 drift（或加 `--all` 旗标）。

### S4-L4 `senior-sdet` 的 `dimension` 为空（README index 该列为空）

- **限制原文**：`tools/docgen/components/agentData.mjs` 的 `senior-sdet` 条目缺 `dimension`，导致 `docs/agents/senior-sdet.md:4`「- 维度：」为空、`docs/agents/README.md` 对应格为空（其余 14 席均有）。
- **漏检样例**：`S4-TC-B04` 只判 index 表头五列齐，不判每格非空 → 空格漏过。
- **谁人工兜**：⑤ 段交付审计（`delivery-5-s4.md` §H 的 P2-2）；填什么值属产品内容，需人工定。
- **触发信号**：下次改 `agentData.mjs` 任一条目时同批补 `dimension`（值由用户/产品定）并 `node tools/docgen/cli.mjs generate --readme --apply` 重新落盘；此后可考虑给 B04 加「每格非空」断言。

## 二、已闭合（勘误即闭合，留痕备查）

| # | 项 | 处置 |
|---|---|---|
| 1 | `PRD §6` 功能点锚差 1 行（原写 `:473-476` / `:487`） | 2026-10-31 勘误为 `:474-477` / `:488`（testcase `:4` 与 §0.1 总表行），实测 PRD 实文即此 |
| 2 | `PRD §3.7` 段清单标题写「front matter + 6 段」与本节表 8 数据行 / `:240`「当前段行数 = 7」不自洽 | 2026-10-31 勘误为「front matter + 7 段」（`docs/prd/20261026205821-agent-card-contract.md:227`） |
