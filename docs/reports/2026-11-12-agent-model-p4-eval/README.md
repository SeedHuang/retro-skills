# P4 四维复评留档（agent 模型流水线）

> 来源：P4 复评（2026-11-12），报告见 `report-round2.md`。
> 2026-11-12 P5 收口评审（`.session/reviews/2026-11-12-1207-p5-close/`）实测：本目录只有 `report-round2.md`，报告 §8 所列 `raw/round2/**` 未入库，且 `git ls-tree -r fa67454` / `0299610` 均无该目录 → **原始样本不可恢复、报告数字不可复算**。

| 文件 | 内容 |
|---|---|
| `report-round2.md` | P4 复评报告（抽测 6 席，2 席修正后复测） |

**留档范围**：

- 保留：结论、逐席表、处方、已知缺口（报告 §0–§10 原文）。
- 未保留：`raw/round2/cards/`、`raw/round2/understanding/`、`raw/round2/execution/`、`answer-key.json`、`exec-key.json`、`blind-map.json`、`prep.txt`、评分脚本。
- 报告 §0「文件存在性：8/8」是评估当时的工作区事实，现无法重放；引用该报告时按「结论可读、数据不可复算」对待。

**可复核的部分**：`agents/*.md` 由模型渲染这一事实仍可复核——`node tools/docgen/builders/agents/cli.mjs gate`（18/18，exit 0）与 `node tools/agent-model/verify-models.mjs`（18 席 `EQUIVALENT`）。

> 本 README 是留档说明，不改报告结论（历史记录不改，`skills/docs-placement/SKILL.md:75`）。
