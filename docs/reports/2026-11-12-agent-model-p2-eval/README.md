# P2 四维评估留档（agent 模型流水线）

> 来源：`fa67454`（P4 收口）提交中的 `tmp/agent-criteria-demo/eval/`。
> P5 清理 `tmp/` 前迁入；报告与复现方法保留，逐轮原始样本不长期入库。

| 文件 / 目录 | 内容 |
|---|---|
| `report.md` | P2 四维评估报告（7 席） |
| `report-p2-v2.md` | P2 复评报告（v2） |
| `blind-map.json` | P2 盲测分组表 |
| `raw/` | 复现方法包：`fixtures/` + 评分脚本 + 评分键 + `aggregate-v2.csv`；逐轮原始 JSON 按 `raw/p2-v2-runbook.md` 从 `fa67454` 重生成 |

**为什么不留原始样本**：42×4 份逐轮 JSON 会随每次评测累积；报告结论、聚合表与评分脚本已足够复核。需要原样样本时，用 `raw/p2-v2-runbook.md` 的「准备数据」从 `fa67454` 取回。

P4 的复评报告在同批 `docs/reports/2026-11-12-agent-model-p4-eval/`。
