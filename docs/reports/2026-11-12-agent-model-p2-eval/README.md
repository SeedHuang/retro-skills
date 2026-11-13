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

> 口径说明（合规议会复核 2026-11-12）：报告结论「四维全部达线」按 PRD §7.4（`docs/prd/20261111145723-agent-model-pipeline.md:304`、`:306`）应读作：理解 / 执行 / token 三维达线，性能维任务时延未判定。

## 评分链路复现（2026-11-13）

> 基线 = `d678028`（2026-11-11，P2 记录基线）；样本归档 = `fa67454`（11-12，card-B7 在此补齐「输出格式」节）。
> 本脚本不重跑 LLM 作答，只复现「固定原始样本 → 评分 → `aggregate-v2.csv`」这条链路。

- 脚本：[reproduce-p2-eval.mjs](raw/reproduce-p2-eval.mjs)
- 快捷命令：`npm run reproduce:p2-eval`
- 回归守卫：[reproduce-p2-eval.test.mjs](raw/reproduce-p2-eval.test.mjs)

```bash
node docs/reports/2026-11-12-agent-model-p2-eval/raw/reproduce-p2-eval.mjs
```

- 成功输出：`p2 eval reproduce ok：baseline d678028 / archive fa67454；84 轮原始样本 → raw/aggregate-v2.csv 一致`。
- 卡面双钉的原因：理解 / 执行原始样本取 11-12 归档；token 的卡面字数取 11-11 的 `cards-fix`（B7 在 11-11 尚未补「输出格式」节，`card_chars=3281`），两者合起来才与留档聚合表逐字节一致。
- 回归守卫已接入 `npm run check`（`raw/reproduce-p2-eval.test.mjs`）。
