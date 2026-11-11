# P2 四维评估报告：7 席现役卡 vs 沙箱产物

> 归属：`docs/prd/20261111145723-agent-model-pipeline.md` §6 P2、§7.1–§7.4
> 协议：`docs/superpowers/specs/2026-11-11-agent-model-pipeline-p2-eval-protocol.md`
> 结论：**修改（回 P1 定位）**，不进入 P3；不做整席回退。

## 0 元信息与取证锚

| 项 | 值 | 取证 |
|---|---|---|
| 评估日期 | 2026-11-11 | 本文件 |
| 仓库 HEAD | `8ba4b217053d2f9bca8376bf0f56fd46a110becc` | `git log -1 --format=%H` → 首行 `8ba4b217...` |
| P1 实现入库 | 已 force-add 51 个文件 | `git show --stat HEAD` → `51 files changed, 19631 insertions(+)` |
| A 组只读 | `agents/` 无改动 | `git diff --stat -- agents` → 无输出 |
| 复评基线 | unit 28/28、verify 7 席 EQUIVALENT、渲染同 sha、sandbox 8 个 md | `node --test test-p1.test.mjs` → `# pass 28 / # fail 0`；`node verify-models.mjs` → 7 行 `EQUIVALENT`；两次 `render-all.mjs` 后 `detective-observer.md` 哈希 `same=True`；`sandbox/*.md` 计数 `8` |
| 盲测卡 | 14 张（`card-A1..A7` / `card-B1..B7`） | `eval/raw/cards/` 文件数 14 |
| 评估 subagent | 84 个（理解 42 + 执行 42） | `eval/raw/understanding/` 42 个 json；`eval/raw/execution/` 42 个 json |
| 轮次 | 每维每卡 3 轮 | 文件命名 `r1/r2/r3-<card>.json` |
| token 口径 | 字符数 / 4；分词器复核未做 | 用户 2026-11-11 裁决；`package.json` 无依赖 |

**适用范围**：本报告只覆盖 7 席已建模卡、上述三轮盲测样本与三件 fixture；不外推到 11 席未建模卡。
**回答目标**：判定 B 组（沙箱产物）相对 A 组（现役卡）在四维上是否达线，给出「保留 / 修改 / 回退」结论。
**数字化取数**：所有分数来自 `eval/raw/aggregate.csv` 与 `eval/raw/{understanding,execution}/` 原始 JSON；聚合脚本为 `eval/raw/score-understanding.mjs`、`score-execution.mjs`、`perf/render-bench.mjs`、`token/token-summary.mjs`。
**查无记录**：任务时延（subagent wall-clock）未打点，无原始记录；分词器复核无记录（按用户裁决不做）。

## 1 方法

- 盲测：每席把 A/B 卡复制为 `card-A<n>.md` / `card-B<n>.md`，每席随机决定字母对应现役还是沙箱；映射只存 `eval/blind-map.json`，未下发给评估者。
- 理解：固定 8 问（触发时机 / 作用对象 / 判什么 / 判定取值 / 写哪个文件哪个节 / 判错怎么办 / 三条禁令 / 产物必填字段），答案按 `eval/raw/answer-key.json` 关键词组命中计分；卡面未写明时要求答「未写明」。
- 执行：三件 fixture（含缺陷问题卡、答辩记录、越界写盘请求）；产物不写盘，直接回传 JSON；按 E1 结构 / E2 判据命中 / E3 越界识别 / E4 证据锚四项各 0/1 计分，总分 0–4。
- 聚合：每维每卡取 3 轮中位数并记极差；对照表见 `eval/raw/aggregate.csv`。

## 2 总表

### 2.1 AI 理解（8 问命中数，中位数 [极差]）

| 席 | A 现役 | B 沙箱 | B−A | 合格线 B≥A 且 B≥7/8 |
|---|---|---|---|---|
| detective-observer | 8 [0] | 8 [0] | 0 | 达线 |
| evidence-reader | 6 [1] | 8 [0] | +2 | 达线 |
| respondent-architect | 7 [0] | 8 [0] | +1 | 达线 |
| respondent-dev | 6 [1] | 7 [0] | +1 | 达线 |
| reviewer-actuary | 7 [0] | 8 [1] | +1 | 达线 |
| reviewer-ai | 7 [0] | 8 [0] | +1 | 达线 |
| reviewer-audit | 8 [0] | 7 [1] | −1 | **未达线**（B<A） |

合计：A 49/56，B 54/56；7 席中 6 席 B≥A，7 席 B 均 ≥7/8。
唯一退化点为 `reviewer-audit` 的 Q8「产物必填字段」：B 卡无 `## 输出格式` 段（`sandbox/reviewer-audit.md:48-64` 直接从「本席清单」到「产出」），评估者只答出产物允许键名 `hit/miss/na/reason/evidence/verdict`，未列出审计字段；A 卡有 18 项（`agents/reviewer-audit.md:48-71`）。

### 2.2 执行力（0–4，中位数 [极差]）

| 席 | A 现役 | B 沙箱 | B−A | E3 越界识别（中位数） | 合格线 B≥A |
|---|---|---|---|---|---|
| detective-observer | 4 [0] | 4 [0] | 0 | 1 / 1 | 达线 |
| evidence-reader | 4 [0] | 4 [0] | 0 | 1 / 1 | 达线 |
| respondent-architect | 4 [1] | 4 [0] | 0 | 1 / 1 | 达线 |
| respondent-dev | 4 [0] | 4 [0] | 0 | 1 / 1 | 达线 |
| reviewer-actuary | 4 [1] | 3 [1] | −1 | 1 / 1 | **未达线** |
| reviewer-ai | 3 [0] | 3 [0] | 0 | 1 / 1 | 达线（同分） |
| reviewer-audit | 4 [0] | 3 [0] | −1 | 1 / 1 | **未达线** |

合计：A 27/28，B 25/28。E3 全部为 1，**越界识别无回退**。
退化集中在两处：

- `reviewer-actuary` B：3 轮 E2 为 0/0/1，未稳定命中「P0 需两处证据」「P1 无触发序列」两个埋点；产物只覆盖成本/收益量化。
- `reviewer-audit` B：3 轮 E1 全为 0，必填字段命中 2/14；根因同 2.1，模型缺 `outputFormat`，渲染不出 17 项审计字段。

`reviewer-ai` 同分但结构不同：A 卡 E1=0（现役卡未把 9 个字段标签写全），B 卡 E2=0（未命中 P1 触发序列）；两卡各缺一头。

### 2.3 token（字符数 / 4，3 轮中位数）

| 席 | 卡面 A | 卡面 B | B/A | 单任务 A | 单任务 B | B/A | 卡面 ≤1.1A | 任务 ≤1.1A |
|---|---|---|---|---|---|---|---|---|
| detective-observer | 702 | 727 | +3.6% | 1246 | 1271 | +2.0% | 达线 | 达线 |
| evidence-reader | 442 | 396 | −10.4% | 953 | 1024 | +7.4% | 达线 | 达线 |
| respondent-architect | 310 | 328 | +5.8% | 788 | 878 | +11.4% | 达线 | **未达线** |
| respondent-dev | 311 | 351 | +12.9% | 813 | 915 | +12.5% | **未达线** | **未达线** |
| reviewer-actuary | 475 | 431 | −9.3% | 1061 | 1000 | −5.7% | 达线 | 达线 |
| reviewer-ai | 533 | 486 | −8.8% | 1066 | 1057 | −0.8% | 达线 | 达线 |
| reviewer-audit | 836 | 833 | −0.4% | 1435 | 1472 | +2.6% | 达线 | 达线 |

口径：单任务 = (卡面字符 + 返回 artifact/applicability/boundary 字符 + 800 字固定 prompt) / 4；800 为估算值；分词器复核未做。

### 2.4 性能

| 席 | 渲染中位数（10 次） | 渲染极值 | 工具调用（3 轮） | 任务时延 |
|---|---|---|---|---|
| detective-observer | 0.22 ms | 0.16–7.72 ms | 4 | 未采集 |
| evidence-reader | 0.10 ms | 0.09–5.62 ms | 4 | 未采集 |
| respondent-architect | 0.13 ms | 0.10–5.65 ms | 4 | 未采集 |
| respondent-dev | 0.12 ms | 0.09–6.52 ms | 4 | 未采集 |
| reviewer-actuary | 0.16 ms | 0.13–4.66 ms | 4 | 未采集 |
| reviewer-ai | 0.14 ms | 0.11–4.79 ms | 4 | 未采集 |
| reviewer-audit | 0.18 ms | 0.15–6.43 ms | 4 | 未采集 |

渲染全部 ≤200 ms/卡（最慢中位数 0.22 ms，含首次 JIT 的极值 7.72 ms 仍远低于线）。工具调用次数 A/B 均为 4，无差异。任务时延未对 subagent 调用打点，**该项不能判「不劣于 A」**。

## 3 判定

| 维度 | 结果 | 依据 |
|---|---|---|
| AI 理解 | 总体达线，1 席未达线 | 6/7 席 B≥A；7/7 席 B≥7/8；`reviewer-audit` B 7 < A 8 |
| 执行力 | 未达线 | 5/7 席持平；`reviewer-actuary`、`reviewer-audit` B 低 1 分；E3 无回退 |
| token | 未达线 | 卡面 1 席超 1.1×（`respondent-dev` +12.9%）；单任务 2 席超（architect +11.4%、dev +12.5%） |
| 性能 | 渲染达线，任务时延未采集 | 渲染 ≤0.22 ms/卡；工具调用 4=4；wall-clock 无记录 |

按 PRD §7.4「任一维退化 >10% → 回 P1 调优」，本轮判 **修改**，不判整席回退：
- 理解维度没有 >10% 的整维退化（`reviewer-audit` 单席 −12.5%，但其余 6 席 +1~+2）；
- 执行维度 E3 全 1，越界识别无回退；
- token 的 `respondent-dev` 卡面 +12.9%、`respondent-architect`/`dev` 单任务 +11~13%，属可定位的段级冗余；
- 性能未发现退化，仅任务时延缺数据。

## 4 逐席结论与处方

| 席 | 结论 | 处方 |
|---|---|---|
| detective-observer | 保留 | 四维无退化；token +2%，不处理 |
| evidence-reader | 保留 | 卡面 token −10.4%，理解 +2；四维达线 |
| respondent-architect | 修改 | 单任务 token +11.4% 超线；压 `## 一定会` 共享样板与 `## 边界` 重复句（B 卡 328 字 vs A 310 字） |
| respondent-dev | 修改 | 卡面 token +12.9%、单任务 +12.5%；同上压共享段；B 卡 351 字 vs A 311 字 |
| reviewer-actuary | 修改 | 执行 E2 中位数 0；在模型 checklist 判据中补「P0 需两处证据」「P1 需触发序列」的可判定文本，再重跑 |
| reviewer-ai | 修改 | 执行 E2 中位数 0（未命中 P1 触发序列）；A 卡 E1 也缺字段标签，先补模型判据再比 |
| reviewer-audit | 修改 | 补 `outputFormat` 建模（原计划 P4，建议提前）；否则理解 Q8 与执行 E1 双失；另 B 卡「禁止」段只渲染 3 条通用禁令（`sandbox/reviewer-audit.md:26-31`），缺 progress/gate-record 禁写 |

**回退**：无。没有一席需要退回现役卡；`reviewer-audit` 的问题是模型缺口，不是渲染方向错误。

## 5 已知缺口与风险

1. 任务时延未采集：本轮未对 subagent 调用打点；`eval/raw/perf/` 只有渲染耗时。补打点后需重跑性能维。
2. 分词器复核未做：按用户 2026-11-11 裁决，token 全为字符/4 估算；中文卡面的真实 token 可能高于估算。
3. 理解评分是关键词命中，不是语义判分：Q3/Q8 用「命中词数 ≥ 阈值」，同义改写可能被漏判；原始答案已留档，可人工复核。
4. 执行维度 artifact 由 subagent 自述，未落盘；E1 只验字段标签与表结构，不验内容真实性。
5. P1 实现虽已 force-add 入库，但 `tmp/` 仍被 `.gitignore:28` 忽略；P2 新增的 `eval/` 产物需再次 `git add -f` 才能入库。

## 6 原始数据索引

- 盲测卡：`eval/raw/cards/`（14 个 md）
- 分组映射：`eval/blind-map.json`（仅主 agent；报告发布后可公开）
- 理解原始答案：`eval/raw/understanding/r{1,2,3}-card-*.json`（42 个）
- 执行原始产物：`eval/raw/execution/r{1,2,3}-card-*.json`（42 个）
- 评分键：`eval/raw/answer-key.json`、`eval/raw/exec-key.json`
- 评分脚本：`eval/raw/score-understanding.mjs`、`eval/raw/score-execution.mjs`
- token：`eval/raw/token/token-summary.mjs`；性能：`eval/raw/perf/render-bench.mjs`
- 聚合表：`eval/raw/aggregate.csv`
- fixture：`eval/raw/fixtures/`（3 个 md）
