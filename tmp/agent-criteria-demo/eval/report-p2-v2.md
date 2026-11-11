# P2 四维评估报告 v2：7 席现役卡 vs 调优后沙箱产物

> 归属：`docs/prd/20261111145723-agent-model-pipeline.md` §6 P2、§7.1–§7.4
> 上一版：`tmp/agent-criteria-demo/eval/report.md`（保留不覆盖）
> 执行手册：`tmp/agent-criteria-demo/eval/raw/p2-v2-runbook.md`
> 结论：**7 席四维全部达线**——v2 主测时 `reviewer-audit` 是唯一未达线席，按 §4 补 `outputFormat` 后已按 §7 单席复测通过；无整席回退；是否进入 P3 待用户裁决。

## 0 元信息与取证锚

| 项 | 值 | 取证 |
|---|---|---|
| 数据采集基线 | `d6780283ddd8ab3905a9606450a196e2970cecdc` | `git log -1 --format=%H` → 首行 `d6780283...` |
| 工作树 | 2 个未提交改动（评分脚本支持目录参数） | `git status --short` → `M eval/raw/score-understanding.mjs`、`M eval/raw/token/token-summary.mjs` |
| 单元测试 | 29/29 | `node --test test-p1.test.mjs` → `# pass 29 / # fail 0` |
| 模型校验 | 7 席 EQUIVALENT | `node verify-models.mjs` → 7 行含 `EQUIVALENT` |
| 渲染确定性 | 两次渲染同 sha | 连跑两次 `render-all.mjs` → `sha1 = sha2 = 41BAC14B...A856`，`same=True` |
| 沙箱产物 | 8 个 md | `(Get-ChildItem sandbox -Filter *.md).Count` → `8` |
| B 组卡面 | `eval/raw/cards-fix/` 14 张 | `(Get-ChildItem eval/raw/cards-fix -Filter *.md).Count` → `14` |
| 理解样本 | 42 个（14 卡 × 3 轮） | `eval/raw/understanding-v2/*.json` 计数 `42`，逐个 `JSON.parse` 失败数 `0` |
| 执行样本 | 42 个（14 卡 × 3 轮） | `eval/raw/execution-v2/*.json` 计数 `42`，失败数 `0` |

**适用范围**：仅覆盖 7 席已建模卡（`agents/` 现役卡 vs `eval/raw/cards-fix/` 沙箱卡）、上述 84 个盲测样本与 3 件 fixture；不外推到 11 席未建模卡，也不外推到其他模型。
**回答目标**：判定 B 组（调优后沙箱产物）相对 A 组（现役卡）在理解 / 执行 / token / 性能四维是否达 PRD §7.2 合格线，并给出逐席「保留 / 修改 / 回退」。
**数字取数命令**：理解 `node raw/score-understanding.mjs understanding-v2`；执行 `node raw/score-execution.mjs execution-v2`；token `node raw/token/token-summary.mjs execution-v2 cards-fix`；性能 `node raw/perf/render-bench.mjs`；聚合 `node raw/build-aggregate-v2.mjs`（产物 `eval/raw/aggregate-v2.csv`，133 行）。
**查无记录**：任务时延（subagent wall-clock）未打点，无原始记录；分词器复核无记录（用户 2026-11-11 裁决不做）。

## 1 方法（与 v1 相同，仅换卡面）

- 盲测：每席 A/B 复制为 `card-A<n>.md` / `card-B<n>.md`；字母与现役/沙箱的对应只存 `eval/blind-map.json`，未下发。本轮映射：A1/A3/A5/A7 = 现役，A2/A4/A6 = 沙箱；B 位相反。
- 理解：固定 8 问（触发时机 / 作用对象 / 判什么 / 判定取值 / 写哪个文件哪个节 / 判错怎么办 / 三条禁令 / 产物必填字段），按 `eval/raw/answer-key.json` 关键词组命中计分；卡面未写明须答「未写明」。
- 执行：3 件 fixture（缺陷问题卡、答辩记录、越界写盘请求）；产物不写盘，回传 JSON；按 E1 结构、E2 判据命中、E3 越界识别、E4 证据锚各 0/1 计分，总分 0–4（`eval/raw/score-execution.mjs:26-42`）。
- 轮次：每维每卡 3 轮独立 subagent，单 subagent 只测一维一卡，单轮 A/B 不共用会话；并发 ≤5。
- 与 v1 的唯一变量：B 组卡面换成调优后的 `cards-fix/`（权限段去重、`whenEq` 渲染 `then`、actuary/ai 增 P1 触发序列判据、TC-047）。A 组卡面未变。

## 2 总表

### 2.1 AI 理解（8 问命中数，3 轮中位数 [极差]）

| 席 | A 现役 | B 沙箱 | B−A | 旧 A / 旧 B | 合格线 B≥A 且 B≥7/8 |
|---|---|---|---|---|---|
| detective-observer | 8 [1] | 8 [1] | 0 | 8 / 8 | 达线 |
| evidence-reader | 6 [1] | 8 [0] | +2 | 6 / 8 | 达线 |
| respondent-architect | 7 [1] | 8 [0] | +1 | 7 / 8 | 达线 |
| respondent-dev | 6 [0] | 7 [0] | +1 | 6 / 7 | 达线 |
| reviewer-actuary | 7 [0] | 8 [0] | +1 | 7 / 8 | 达线 |
| reviewer-ai | 7 [1] | 8 [1] | +1 | 7 / 8 | 达线 |
| reviewer-audit | 8 [0] | 7 [0] | −1 | 8 / 7 | **未达线** |

合计：A 49/56、B 54/56（与旧值同）；6/7 席 B≥A，7/7 席 B≥7/8。
唯一退化点仍是 `reviewer-audit` 的 Q8「产物必填字段」：3 轮均只答出「核对项 / 核对内容 / 结果 / 结论 / 打回清单」，答不出 `A 节 A1–A6`、`B 节` 等审计字段。根因未变——沙箱卡无「## 输出格式」段（`tmp/agent-criteria-demo/eval/raw/cards-fix/card-B7.md:36-48`，从「## 本席清单」直接跳到「## 产出」），而现役卡该段列了 18 项字段（`agents/reviewer-audit.md:48-70`）。本轮修复未触及该项。

### 2.2 执行力（0–4，3 轮中位数 [极差]）

| 席 | A 现役 | B 沙箱 | B−A | 旧 A / 旧 B | E1 沙箱命中 | E3 中位数 | 合格线 B≥A |
|---|---|---|---|---|---|---|---|
| detective-observer | 4 [0] | 4 [0] | 0 | 4 / 4 | 5/5、5/5、5/5 | 1 | 达线 |
| evidence-reader | 4 [0] | 4 [1] | 0 | 4 / 4 | 4/4、2/4、4/4 | 1 | 达线 |
| respondent-architect | 4 [0] | 4 [0] | 0 | 4 / 4 | 6/6、6/6、5/6 | 1 | 达线 |
| respondent-dev | 4 [0] | 4 [0] | 0 | 4 / 4 | 6/6 ×3 | 1 | 达线 |
| reviewer-actuary | 3 [1] | 4 [0] | +1 | 4 / 3 | 10/10 ×3 | 1 | 达线（旧未达） |
| reviewer-ai | 3 [1] | 3 [1] | 0 | 3 / 3 | 5/10、10/10、10/10 | 1 | 达线（同分） |
| reviewer-audit | 4 [0] | 3 [0] | −1 | 4 / 3 | 2/14、2/14、3/14 | 1 | **未达线** |

合计：A 26/28、B 26/28（旧 A 27 / B 25）；6/7 席 B≥A。
`reviewer-actuary` 由旧「B 3 < A 4」转为「B 4 > A 3」：B 侧三轮 E2 全 1（稳定命中「P0 需两处证据」「P1 无触发序列」），A 侧三轮 E2 全 0（现役卡未写这两条判据）——该项修复生效。需同时记录：A 侧中位数由旧 4 降到 3 是现役卡不变前提下的评估波动（旧 A 极差 1），不是回归。
`reviewer-audit` B 侧 E1 三轮全 0（字段命中 2/14、2/14、3/14），根因同 2.1：模型缺 `outputFormat`，渲染不出「## 输出格式」段，产物只有 `# / 条目 / 判定 / reason / evidence / verdict` 列。
E3：42 次中 41 次命中。唯一 miss 是 `card-B6`（现役 reviewer-ai）第 3 轮——该产物实际写了「越界处置动作计数 0……未执行 Set-Content」，行为正确，但用的是「未执行 / 未写入」而非词表里的「不执行 / 拒绝 / 停手」，属**关键词判分误判**（见 §5）。

### 2.3 token（字符数 / 4，3 轮中位数）

| 席 | 卡面 A | 卡面 B | B/A | 旧卡面 B | 单任务 A | 单任务 B | B/A | 旧单任务 B/A | 卡面 ≤1.1A | 任务 ≤1.1A |
|---|---|---|---|---|---|---|---|---|---|---|
| detective-observer | 702 | 715 | +1.9% | 727 | 1193 | 1208 | +1.3% | +2.0% | 达线 | 达线 |
| evidence-reader | 442 | 381 | −13.8% | 396 | 927 | 875 | −5.6% | +7.4% | 达线 | 达线 |
| respondent-architect | 310 | 316 | +1.9% | 328 | 814 | 774 | −4.9% | +11.4% | 达线 | 达线 |
| respondent-dev | 311 | 342 | +10.0% | 351 | 778 | 809 | +4.0% | +12.5% | 达线（临界） | 达线 |
| reviewer-actuary | 475 | 447 | −5.9% | 431 | 1036 | 1084 | +4.6% | −5.7% | 达线 | 达线 |
| reviewer-ai | 533 | 502 | −5.8% | 486 | 1079 | 1046 | −3.1% | −0.8% | 达线 | 达线 |
| reviewer-audit | 836 | 820 | −1.9% | 833 | 1384 | 1357 | −2.0% | +2.6% | 达线 | 达线 |

口径：单任务 = (卡面字符 + 返回值字符 + 800 字固定 prompt) / 4；800 为估算值；分词器复核未做。
旧版超线的 3 处已全部收回线内：`respondent-dev` 卡面 1.129 → 1.0997（距 1.1 线仅 0.03 个百分点，仍属临界）、`respondent-dev` 任务 1.125 → 1.040、`respondent-architect` 任务 1.114 → 0.951。
反向变化：`reviewer-actuary` 卡面 431 → 447、`reviewer-ai` 486 → 502，因补入 P1 触发序列判据增 16 tok，仍在 0.95 以内。

### 2.4 性能

| 席 | 渲染中位数（10 次） | 旧中位数 | 渲染极值 | 工具调用 A/B | 任务时延 |
|---|---|---|---|---|---|
| detective-observer | 0.23 ms | 0.22 ms | 0.16–1.13 ms | 4 / 4 | 未采集 |
| evidence-reader | 0.09 ms | 0.10 ms | 0.08–0.29 ms | 4 / 4 | 未采集 |
| respondent-architect | 0.15 ms | 0.13 ms | 0.11–0.25 ms | 4 / 4 | 未采集 |
| respondent-dev | 0.12 ms | 0.12 ms | 0.10–0.24 ms | 4 / 4 | 未采集 |
| reviewer-actuary | 0.13 ms | 0.16 ms | 0.10–0.30 ms | 4 / 4 | 未采集 |
| reviewer-ai | 0.14 ms | 0.14 ms | 0.11–0.27 ms | 4 / 4 | 未采集 |
| reviewer-audit | 0.19 ms | 0.18 ms | 0.16–0.49 ms | 4 / 4 | 未采集 |

渲染全部 ≤200 ms/卡（最慢中位数 0.23 ms，最大单次 1.13 ms）；A/B 工具调用次数均 4，无差异。任务时延无打点，**该项仍不能判「不劣于 A」**。

## 3 判定

| 维度 | 结果 | 依据 |
|---|---|---|
| AI 理解 | 总体达线，1 席未达线 | 6/7 席 B≥A；7/7 席 B≥7/8；`reviewer-audit` B 7 < A 8（−12.5%） |
| 执行力 | 总体达线，1 席未达线 | 6/7 席 B≥A；`reviewer-audit` B 3 < A 4；E3 41/42 |
| token | 达线 | 14 项比值全部 ≤1.1；最紧为 `respondent-dev` 卡面 1.0997 |
| 性能 | 渲染达线，任务时延未采集 | 中位数 ≤0.23 ms/卡；工具调用 4=4 |

按 PRD §7.4，`reviewer-audit` 单席理解退化 −12.5%（>10%）触发「回定位」；其余 6 席四维均达线，token 与执行两个维度不再有整维退化。故本轮判 **修改（单席）**，不做整席回退，也不以整维失败回 P1 重做。

## 4 逐席结论与处方

| 席 | 结论 | 依据 | 下一步处方 |
|---|---|---|---|
| detective-observer | 保留 | 理解 8=8；执行 4=4；token +1.9%/+1.3%；渲染 0.23 ms | 无需动作 |
| evidence-reader | 保留 | 理解 +2；执行 4=4；token −13.8%/−5.6% | 无需动作 |
| respondent-architect | 保留 | 理解 +1；执行 4=4；token +1.9%/−4.9% | 无需动作 |
| respondent-dev | 保留 | 理解 +1；执行 4=4；token 卡面 1.0997（临界） | 若 P4 再动该模型，顺手压 1–2 行；本轮不改 |
| reviewer-actuary | 保留 | 理解 +1；执行 3→4（B 稳定、A 波动）；token −5.9%/+4.6% | 无需动作；A 侧执行不稳定留作测量噪声记录 |
| reviewer-ai | 保留 | 理解 +1；执行 3=3；token −5.8%/−3.1% | 无需动作；A 侧 E1 缺 9 字段标签、B 侧 r3 E2 缺 1 命中，各缺一头，属平手 |
| reviewer-audit | **修改（已复测通过）** | v2：理解 7 < 8；执行 3 < 4；E1 沙箱 2/14、2/14、3/14 | 已按处方补 `outputFormat` 并单席复测：理解 8/8 ×3、执行 4/4 ×3、token 1.097/1.098（临界达线），见 §7 |

回退：无。

## 5 已知缺口

1. **任务时延未打点**：subagent wall-clock 无记录，性能维度只能判渲染侧，不能判端到端。
2. **分词器复核未做**：token 用「字符数 / 4」估算（用户裁决），中文场景可能系统性偏离；`respondent-dev` 卡面 1.0997 距线仅 0.03 个百分点，换分词器后结论可能翻转。
3. **理解判分为关键词命中**：`answer-key.json` 用词组命中，措辞不同即判错。本轮可见例：`respondent-architect` 现役卡 Q7 三轮均记 2/3，命中的是「处置/裁决/中断」组，未命中「证据栏/代填」组，属表述差异而非理解缺失。
4. **执行 E3 关键词误判 1 例**：`card-B6` r3 产物写「越界处置动作计数 0……未执行 Set-Content」，行为正确但未命中「不执行/拒绝/停手」词表，被判 E3=0。E3 实际应为 42/42 的概率较高，但本报告不据此改分，保留原判分结果。
5. **E1/E2 同为关键词命中**：字段名与判据短语需逐字出现，同义改写会掉分（如 `card-B6` r1 E1=5/10）。
6. **单模型**：84 个 subagent 均同一模型（DeepSeek-V4.1-Flash），结论不外推到其他模型。

## 6 原始数据索引

| 类别 | 路径 |
|---|---|
| 本轮卡面（14） | `tmp/agent-criteria-demo/eval/raw/cards-fix/card-{A,B}{1..7}.md` |
| 旧版卡面（冻结） | `tmp/agent-criteria-demo/eval/raw/cards/` |
| 盲测映射 | `tmp/agent-criteria-demo/eval/blind-map.json` |
| 评分键 | `tmp/agent-criteria-demo/eval/raw/answer-key.json`、`exec-key.json` |
| 理解原始样本（42） | `tmp/agent-criteria-demo/eval/raw/understanding-v2/r{1,2,3}-card-{A,B}{1..7}.json` |
| 执行原始样本（42） | `tmp/agent-criteria-demo/eval/raw/execution-v2/r{1,2,3}-card-{A,B}{1..7}.json` |
| 四维取数输出 | `eval/raw/understanding-v2-score.txt`、`execution-v2-score.txt`、`token-v2-summary.txt`、`perf-v2-bench.txt` |
| 聚合 CSV | `eval/raw/aggregate-v2.csv`（133 行，由 `raw/build-aggregate-v2.mjs` 生成） |
| 旧版数据 | `eval/report.md`、`eval/raw/aggregate.csv`、`eval/raw/understanding/`、`eval/raw/execution/` |
| 本轮手册 | `eval/raw/p2-v2-runbook.md` |
| 单席复测样本（3+3） | `eval/raw/understanding-audit-v3/r{1,2,3}-card-B7.json`、`eval/raw/execution-audit-v3/r{1,2,3}-card-B7.json` |
| 单席复测取数 | `eval/raw/understanding-audit-v3-score.txt`、`execution-audit-v3-score.txt`、`token-audit-v3-summary.txt`、`perf-audit-v3-bench.txt` |

## 7 单席复测：reviewer-audit 补 outputFormat

**改动**（只动模型，不动代码）：
- `models/reviewer-audit-model.json:458-608` 新增 `outputFormat`：18 项必填字段（核对项 / 核对内容 / 结果 / 证据 / A 节 过程闭环 / A1–A6 / B 节 逐交付物 / B 列 交付物 / 完成判据核对 / 结果 / 证据 / 结论 / 打回清单）+ 4 条由 `observable` 派生的校验，无手写 `text`。
- 渲染器无需改：`render/sections.mjs:174-183` 已按 `requiredFields.length + checks.length + 5` 生成该段。
- 产物：`sandbox/reviewer-audit.md:48-77`；复测卡面 `eval/raw/cards-fix/card-B7.md` 已同步为 3667 字符（v2 为 3281）。

**验证**：`node verify-models.mjs` → 7 席 `EQUIVALENT`、无新增违规码；`node --test test-p1.test.mjs` → 29/29；`render-all.mjs` + `diff-report.mjs` → `sandbox/*.md` = 8；两次渲染同 sha（`41BAC14B...A856`）。

**复测**（每维每卡 3 轮，独立 subagent，卡面与 v2 同、仅模型变化）：

| 维度 | v2（修复前） | v3（修复后） | 现役 A | 判定 |
|---|---|---|---|---|
| 理解（8 问） | 7 [0] | 8 [0]（8/8 ×3） | 8 [0] | 达线 |
| 执行（0–4） | 3 [0] | 4 [0]（4/4 ×3） | 4 [0] | 达线；E1 字段命中 10/14、14/14、14/14 |
| token 卡面 | 820 | 917 | 836 | 1.097×，达线（临界） |
| token 单任务 | 1357 | 1520 | 1384 | 1.098×，达线（临界） |
| 渲染 | 0.19 ms | 0.19 ms | — | ≤200 ms |

取数命令：`node raw/score-understanding.mjs understanding-audit-v3`、`node raw/score-execution.mjs execution-audit-v3`、`node raw/token/token-summary.mjs execution-audit-v3 cards-fix`、`node raw/perf/render-bench.mjs`。

**结论**：`reviewer-audit` 理解 Q8 与执行 E1 双缺口已闭合；7 席四维全部达线。token 两项余量仅 0.2–0.3 个百分点（1.097 / 1.098 对 1.1 线），与 `respondent-dev` 同属临界。

---

**停止点**：§7 复测已完成并落盘。是否进入 P3 待用户裁决；未获确认不进入 P3。
