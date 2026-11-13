# P4 四维复评留档（agent 模型流水线）

> 来源：P4 复评（2026-11-12），报告见 [report-round2.md](report-round2.md)。
> 2026-11-12 P5 收口评审（`.session/reviews/2026-11-12-1207-p5-close/`）实测：本目录只有 `report-round2.md`，报告 §8 所列 `raw/round2/**` 未入库，且 `git ls-tree -r fa67454` / `0299610` 均无该目录 → **原始样本不可恢复、报告数字不可复算**。

| 文件 | 内容 |
|---|---|
| [report-round2.md](report-round2.md) | P4 复评报告（抽测 6 席，2 席修正后复测） |

**关键数据（摘自报告，不改结论）**

| 维度 | 数据 | 出处 |
|---|---|---|
| 理解（6 席） | A 47/48 vs B 45/48（−2，−4.2%） | [报告](report-round2.md) §2 |
| 执行（4 席新跑） | A 16/16 vs B 16/16 | [报告](report-round2.md) §3 |
| token（4 席卡面） | 平均 −11.5% | [报告](report-round2.md) §4 |
| 渲染 | ≤0.13 ms/卡 | [报告](report-round2.md) §4 |
| 修正后复测 | evidence-reader A6/B7；reviewer-backend A8/B8 | [报告](report-round2.md) §10 |
| 逐席结论 | 2 席修改后达线，其余保留 | [报告](report-round2.md) §5 |

**数据缺口（为什么不能像 P2 那样复现）**

| 数据 | 状态 | 说明 |
|---|---|---|
| 报告聚合表（理解 / 执行 / token / 渲染 / 逐席结论） | 有 | 即上表；在 `report-round2.md` §2–§5、§10 |
| 逐轮原始 JSON（理解 24 + 执行 8） | 无 | 报告 §8 列出 `raw/round2/**`，但 `fa67454` / `0299610` 均无该目录；`git log --all --name-only -- "*raw/round2*"` 仅命中文档提交 |
| 盲测卡 / 评分键 / 判分脚本 | 无 | 同上 |
| 可复核的替代 | 有 | 当前 18 卡渲染：`node tools/docgen/models/agents/verify-models.mjs`（18 席 `EQUIVALENT`）与 `node tools/docgen/builders/agents/cli.mjs gate`（18/18） |

**留档范围**：

- 保留：结论、逐席表、处方、已知缺口（报告 §0–§10 原文）。
- 未保留：`raw/round2/cards/`、`raw/round2/understanding/`、`raw/round2/execution/`、`answer-key.json`、`exec-key.json`、`blind-map.json`、`prep.txt`、评分脚本。
- 报告 §0「文件存在性：8/8」是评估当时的工作区事实，现无法重放；引用该报告时按「结论可读、数据不可复算」对待。

**可复核的部分**：`agents/*.md` 由模型渲染这一事实仍可复核——`node tools/docgen/builders/agents/cli.mjs gate`（18/18，exit 0）与 `node tools/docgen/models/agents/verify-models.mjs`（当前路径；报告 §9/§11 的旧路径 `tools/agent-model/...` 已迁移，18 席 `EQUIVALENT`）。

> 本 README 是留档说明，不改报告结论（历史记录不改，`skills/docs-placement/SKILL.md:75`）。

## 判分口径补充（2026-11-13 观测，不改本报告分数与结论）

**触发实例**：2026-11-13 对照复测（11-11 卡 vs 当前卡）中，`respondent-dev` 当前卡的 Q6 被单轮评估者写成「只评审、记录」，据此判 miss。随后 3 个全新独立评估者被要求**逐字摘录、禁止同义替换**，3/3 均摘出卡面原文「只核实、复现、记录」（`agents/respondent-dev.md:12`）→ 判定为**评估者替换词**，不是卡面缺陷，该分改回 hit。

**后续复评必须遵守的三条**：

1. 理解维每卡跑 **≥3 轮**取中位数，单轮结果不得直接入结论（协议 §7.1 已有此要求，本条强调不得省轮）。
2. 评估者回答必须**逐字摘录原文并注明节名**；出现同义替换（如「核实→评审」）该答案作废重跑。
3. 判分键必须区分**「卡面缺失」**（算卡的问题，进处方）与**「评估者漏答 / 替换」**（作废重跑，不改卡）。

**适用边界**：本节只约束后续复评方法，不修改本目录既有报告的 A/B 分数、结论与处方。
