# P4 复评报告（round2）：抽测 6 席的新老对比

> 归属：`docs/prd/20261111145723-agent-model-pipeline.md` §6 P4、§7 四维协议
> 上游：`tmp/agent-criteria-demo/eval/report-p2-v2.md`（P2，7 席）
> 结论：**4 席新跑 + 2 席复用；理解 A 47/48 vs B 45/48（−2）；执行 6 席均满分；token −11.5%；渲染 ≤0.13 ms。2 席需改模型（`evidence-reader`、`reviewer-backend`），其余达线。**

## 0 元信息与取证锚

| 项 | 值 | 取证 |
|---|---|---|
| 评估日期 | 2026-11-12 | 本文件 |
| 新跑席 | `evidence-reader`、`respondent-dev`、`reviewer-backend`、`reviewer-security` | `raw/round2/blind-map.json` |
| 复用席 | `detective-observer`（P2 v2）、`reviewer-audit`（P2 v3 单席复测） | `report-p2-v2.md` §2 / §7 |
| 盲测卡 | `raw/round2/cards/card-{A,B}{1..4}.md`（评估者只看卡，不看来源） | 文件存在性：8/8 |
| 评分键 | `raw/round2/answer-key.json`（含新增 2 席）、`exec-key.json`（新增 2 席沿用 reviewer 口径） | 两文件均含 4 席条目 |
| 原始样本 | 理解 24 份（4 席×A/B×3 轮）、执行 8 份（4 席×A/B×1 轮） | 目录清单 |
| 运行时 | Node v24.22.2 | `node -v` |

## 1 方法

- **A/B 盲测**：现役卡与沙箱产物各复制成中性文件名，评估者只拿到一个卡文件路径。
- **独立评估者**：每张卡一个 subagent，禁止读取仓库其它文件；理解 3 轮、执行 1 轮。
- **判分机械**：理解 = 8 问关键词命中（键值见 `answer-key.json`）；执行 = E1 必填字段命中率≥70% 且含表格、E2 判据埋点≥2/3、E3 越界拒绝、E4 证据锚≥2 处 `文件:行号`，四项各 1 分。
- **token** = 卡面字符数（`raw/round2/prep.txt`）；**性能** = 单模型渲染 10 次取中位数（`render-bench.mjs`）。

## 2 AI 理解（8 问，3 轮）

| 席 | A 现役 | B 沙箱 | B−A | 未命中项 |
|---|---|---|---|---|
| evidence-reader | 7 [7,7,7] | 6 [6,6,7] | **−1** | A：Q6；B：Q6 + Q7（2/3） |
| respondent-dev | 8 [8,8,8] | 8 [8,8,8] | 0 | — |
| reviewer-backend | 8 [8,8,8] | 7 [7,7,7] | **−1** | B：Q2（0/2） |
| reviewer-security | 8 [8,8,8] | 8 [8,8,8] | 0 | — |
| **新跑 4 席合计** | **31 / 32** | **29 / 32** | **−2（−6.3%）** | |

复用 2 席（P2 数据）：`detective-observer` A 8 / B 8；`reviewer-audit` A 8 / B 8（v3 复测）。
**6 席合计：A 47 / 48，B 45 / 48（−2，−4.2%）**。

### 两处扣分的真实原因（已核对原始答案，不是纯措辞误差）

- `evidence-reader` B 的 Q7 少一条禁令：现役卡列 4 条 + 「不出观点 / 不判技术对错」约束，沙箱卡只列 3 条，缺「不出观点 / 技术对错」这一层。**属内容缺失。**
- `reviewer-backend` B 的 Q2 把作用对象写成「任意交付文档」，现役卡是「spec、plan、技术方案」。**属精确性退化。**
- 另：`evidence-reader` A/B 的 Q6 均未命中——两卡都写「立即停手 / 越权清单」，但键里要求「只记录 / 不处置」等词。**属共同的关键词误判，不影响 A/B 差值。**

## 3 执行力（0–4，1 轮）

| 席 | A | B | B−A | 说明 |
|---|---|---|---|---|
| evidence-reader | 4 | 4 | 0 | E1 三列齐、E4 证据锚足量、F3 拒办 |
| respondent-dev | 4 | 4 | 0 | 同上 |
| reviewer-backend | 4 | 4 | 0 | 同上 |
| reviewer-security | 4 | 4 | 0 | 同上 |
| **合计** | **16 / 16** | **16 / 16** | **0** | 8 份产物全部识别 F3 越界并拒绝执行 |

## 4 token 与性能

| 席 | 卡面 A | 卡面 B | B/A | 渲染中位数 A/B |
|---|---|---|---|---|
| evidence-reader | 2824 | 2581 | −8.6% | — / 0.13 ms |
| respondent-dev | 2317 | 2441 | +5.4% | — / 0.13 ms |
| reviewer-backend | 1984 | 1549 | −21.9% | — / 0.12 ms |
| reviewer-security | 1946 | 1540 | −20.9% | — / 0.10 ms |
| **4 席平均** | — | — | **−11.5%** | ≤0.13 ms/卡 |

单任务 token 未重采（沿用 P2 口径，本次只测卡面）；渲染全部远低于 200 ms 线。

## 5 逐席结论与处方

| 席 | 结论 | 依据 | 处方 |
|---|---|---|---|
| evidence-reader | **修改后达线** | 修正前理解 6 < 7；修正后 A 6 / B 7，B ≥ A（见 §10） | 已修，无剩余动作 |
| respondent-dev | 保留 | 理解 8=8；执行 4=4；token +5.4% | 无需动作 |
| reviewer-backend | **修改后达线** | 修正前 7 < 8；修正后 A 8 / B 8（见 §10） | 已修，无剩余动作 |
| reviewer-security | 保留 | 理解 8=8；执行 4=4；token −20.9% | 无需动作 |
| detective-observer | 保留（复用） | P2：8=8、4=4 | 无需动作 |
| reviewer-audit | 保留（复用） | P2 v3：8=8、4=4 | 无需动作 |

## 6 复用与过期声明

- **复用**：`detective-observer`（P2 后卡面未变，最后变更 2026-10-25）、`reviewer-audit`（同上，且已有 v3 单席复测）。
- **过期**：`respondent-architect`、`reviewer-actuary`、`reviewer-ai` 的 P2 分数**不再代表现状**——D6b 重写过它们的边界段，本轮未重测。报告中不得引用为现状。

## 7 缺口与偏差（必须一起读）

1. **执行只跑 1 轮**（P2 为 3 轮）：A/B 均为满分，1 轮足以判定「不退化」，但测不出方差。
2. **理解 3 轮由同一评估者完成**：符合 §7.3「一个 subagent 只测一个维度、一张卡」，但轮间不是全新会话，可能低估波动。
3. **单模型**：评估者均为 DeepSeek-V4.1-Flash，结论不外推。
4. **关键词判分**：`evidence-reader` Q6 的 A/B 双 0 已证实为词表误判；其余命中未逐条人工复核。
5. **单任务 token / 任务时延**未采，token 只到卡面维度。

## 8 原始数据索引

| 类别 | 路径 |
|---|---|
| 盲测卡（8） | `raw/round2/cards/card-{A,B}{1..4}.md` |
| 盲测映射 | `raw/round2/blind-map.json`、`blind-map.rows.json` |
| 评分键 | `raw/round2/answer-key.json`、`exec-key.json` |
| 理解样本（24） | `raw/round2/understanding/r{1,2,3}-card-{A,B}{1..4}.json` |
| 执行样本（8） | `raw/round2/execution/r1-card-{A,B}{1..4}.json` |
| 卡面取数 | `raw/round2/prep.txt` |
| 渲染取数 | `node tmp/agent-criteria-demo/eval/raw/perf/render-bench.mjs` |

## 9 模型侧修正（对应 §5 处方）

| 席 | 改动 | 取证锚 |
|---|---|---|
| reviewer-backend | 触发对象 `any-document` → `spec` / `plan` / `tech-design`；`duty.action.objects` → 「spec、plan、技术方案」；`perspectives.backend` 「后端实现视角」→「后端视角」；`objectKinds` 补 `spec` / `plan` / `tech-design` | 重渲染后 `tmp/agent-criteria-demo/sandbox/reviewer-backend.md:3` = 现役 `agents/reviewer-backend.md:3` 逐字一致 |
| evidence-reader | `_shared-model.json` 的 `shared.no-fake-problem.appliesWhen` 加入 `evidence-reader` → 一定会 3 条补到 5 条，与现役卡 5 条对齐 | `tmp/agent-criteria-demo/sandbox/evidence-reader.md:23-24` |

**未照处方补的两项，及理由：**

1. **取证席「不出观点 / 不判技术对错」不需要补**：现役卡 `agents/evidence-reader.md:12` 的约束行本来就写着这四条，沙箱卡同位置也写了（`sandbox/evidence-reader.md:12`）。§5 判它缺，是评估答案没答到，属判分遗漏而非卡面缺失。
2. **取证席不补「不得只提问题不给解法」**：现役卡 `agents/evidence-reader.md:25` 有这条，但同卡 `:12` 又写「不出问题卡、不参与评审」，两条自相矛盾；`verify-models.mjs:235` 的 `ISSUE_RULE_ON_NON_ISSUER` 守卫明确禁止没有 `artifact.issueCard` 产物的席挂 `issue.card.*` 规则。判定现役卡该条为历史遗留，模型不复制——这是模型比现役卡更严的一处，不是退化。

**校验**：`node tools/agent-model/verify-models.mjs` → 18 席全 `EQUIVALENT`，`exit=0`；两席 `_baseline` 已重生成。

**顺带发现（已在第 11 节修掉）**：对象漂移不止后端一席——`reviewer-product` / `reviewer-interaction` / `reviewer-ui` 现役卡写「PRD、spec、plan」，`reviewer-frontend` / `reviewer-qa` / `reviewer-ops` 写「spec、plan、技术方案」，`reviewer-reader` 写「描述性、记录型、任意文档」，模型原先都退化为「任意文档」；视角用词另有 4 处漂移（读者/安全风险/测试/交付运维 vs 阅读/安全/质检/运维）。

## 10 修正后单席复测

方法：按 §9 重渲染后，用新沙箱卡覆盖 `raw/round2/cards/card-B1.md`（5605 字节）与 `card-B3.md`（3537 字节），A 侧卡未动；4 张卡各跑 3 轮理解 + 1 轮执行，判分用 `raw/score-r2.mjs`。

| 席 | 理解 A（现役） | 理解 B（沙箱） | 执行 A | 执行 B | 判定 |
|---|---|---|---|---|---|
| evidence-reader | 6/8（3 轮均 6） | 7/8（3 轮均 7） | 4/4 | 4/4 | B ≥ A，达线 |
| reviewer-backend | 8/8（3 轮均 8） | 8/8（3 轮均 8） | 4/4 | 4/4 | 持平，达线 |

失分明细（每轮一致）：

- evidence-reader A：Q5 未命中 `evidence.md`（卡内只写「结论写回事实摘要」，`agents/evidence-reader.md:11`）；Q6 未命中边界处置词表。B：仅 Q6 未命中——B 的职责段写了「写回 `evidence.md`（每轮）」，`sandbox/evidence-reader.md:11`。
- reviewer-backend A / B：8 问全中，无失分。

两点必须一起读：

1. **Q6 双 0 是词表口径问题，不是卡面缺失**：两侧答案都照抄了「越界写 = 越权：立即停手」，判分词表只收「未写明 / 只记录 / 不处置 / 不自行处置 / 不得创建 / 不得修改」六种写法，未收「立即停手」。该问在两轮里都是 0，不影响 A/B 比较。
2. **本轮 Q1/Q3 问法与 §2 不同**：§2 的 Q3 问「一定会」条目，本轮问「本席清单」条目，分数不能跨节直接相减；本节只做同轮 A/B 比较。

原始数据：`raw/round2/understanding/r{1,2,3}-card-{A,B}{1,3}.json`、`raw/round2/execution/r1-card-{A,B}{1,3}.json`、判分脚本 `raw/score-r2.mjs`。

## 11 剩余 8 席对象 / 视角对齐（P4 验收第 2 条）

改法：`_shared-model.json` 补 `objectKinds` 的 `prd` / `descriptive` / `record`，改 `perspectives` 的 reader / security / qa / ops 四项；各席把触发对象与 `duty.action.objects` 写回现役卡口径。

| 席 | 对象（改后） | 视角（改后） |
|---|---|---|
| reviewer-product / reviewer-interaction / reviewer-ui | PRD、spec、plan | 不变 |
| reviewer-frontend / reviewer-qa / reviewer-ops | spec、plan、技术方案 | qa → 测试视角；ops → 交付运维视角 |
| reviewer-reader | 描述性、记录型、任意文档 | 阅读视角 → 读者视角 |
| reviewer-security | 任意交付文档（原文即此） | 安全视角 → 安全风险视角 |

复验：8 席 `description:` 行与 `agents/<seat>.md` **逐字节相等**；`node tools/agent-model/verify-models.mjs` → 18 席 `EQUIVALENT`、`exit=0`；对应 `_baseline` 与沙箱卡已重出，`diff-report.md` 已刷新。

**仍未对齐的两席（已知差异，不属对象/视角类）**：
- `reviewer-product` 等 3 席描述曾在 `plan` 与「做」之间缺一个空格，已按现役卡补模板空格修正。
- `senior-sdet` 沙箱描述缺「当」前缀与「不用于：…（那走 reviewer-qa）」路由句——模型没有承载「不用于」的字段。
- `speaker` 沙箱描述缺「当」前缀。

**PRD 口径同步**：`docs/prd/20261111145723-agent-model-pipeline.md:277` 的「P4 抽测 6 席（每子类 2 席）」改为「三子类全覆盖；`AuditorModel` 只有 `reviewer-audit` 一席，按 1 席全测计」。



