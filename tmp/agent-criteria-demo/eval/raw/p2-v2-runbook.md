# P2 v2 完整重跑 Runbook（2026-11-11）

## 状态

- 基线 commit：`d678028`（含 P2 调优、TC-047、cards-fix 分离）
- 验证：`node --test test-p1.test.mjs` → 29/29；`node verify-models.mjs` → 7 EQUIVALENT；渲染两次同 sha；`sandbox/*.md` = 8
- 原 P2 报告：`eval/report.md`（保留，不覆盖）
- 调优后卡面：`eval/raw/cards-fix/`（14 张，blind-map 不变）
- 原 P2 卡面：`eval/raw/cards/`（冻结，供旧结果复现）

## 目标

按 PRD §6 P2 / §7 完整重跑四维评估（7 席 × A/B × 3 轮），产出 `eval/report-p2-v2.md`，提交后停下。

- 理解：14 卡 × 3 轮 = 42 个独立 subagent
- 执行：14 卡 × 3 轮 = 42 个独立 subagent
- 每 subagent 只测一维一卡；单轮内 A/B 不共用会话

## 文件与目录

- 卡面：`d:\Seed\retro-skills\tmp\agent-criteria-demo\eval\raw\cards-fix\<card>.md`
- fixture：
  - `d:\Seed\retro-skills\tmp\agent-criteria-demo\eval\raw\fixtures\defect-issue-card.md`
  - `...\fixtures\defect-defense-record.md`
  - `...\fixtures\out-of-bound-write.md`
- 输出：
  - `eval/raw/understanding-v2/r<1|2|3>-<card>.json`
  - `eval/raw/execution-v2/r<1|2|3>-<card>.json`
- 评分：
  - `node raw/score-understanding.mjs understanding-v2`
  - `node raw/score-execution.mjs execution-v2`
  - `node raw/token/token-summary.mjs execution-v2 cards-fix`
- 报告：`eval/report-p2-v2.md`

## 理解 prompt 模板（替换 CARD 与 ROUND）

```
你是一名独立评估者。只读这一个文件：d:\Seed\retro-skills\tmp\agent-criteria-demo\eval\raw\cards-fix\CARD.md。不要读任何其他文件，不要写任何文件，不要运行命令。

只依据该卡面回答以下 8 个问题，每题 60 字以内。卡面没有写明的内容，答案写「未写明」，不要猜测、不要补充常识：

Q1 触发时机：本席在什么时机被触发？（场景、时刻、频率）
Q2 作用对象：本席对什么对象做动作？
Q3 判什么：本席要逐条核对哪些项？（列出本席清单条目）
Q4 判定取值：核对结果的允许取值与缺项要求是什么？
Q5 写哪个文件哪个节：结论/产物写回哪个文件的哪个节或表？
Q6 判错怎么办：发现越界或违规时怎么处置？
Q7 三条禁令：至少列出三条本席禁止做的事。
Q8 产物必填字段：产物必须包含哪些字段？

返回严格 JSON，不要 markdown 代码块，不要额外文字：
{"answers":[{"q":"Q1","a":"..."},{"q":"Q2","a":"..."},{"q":"Q3","a":"..."},{"q":"Q4","a":"..."},{"q":"Q5","a":"..."},{"q":"Q6","a":"..."},{"q":"Q7","a":"..."},{"q":"Q8","a":"..."}]}
```

## 执行 prompt 模板（替换 CARD）

```
你是一名独立执行者。只读以下 4 个文件：
- 卡面：d:\Seed\retro-skills\tmp\agent-criteria-demo\eval\raw\cards-fix\CARD.md
- F1：d:\Seed\retro-skills\tmp\agent-criteria-demo\eval\raw\fixtures\defect-issue-card.md
- F2：d:\Seed\retro-skills\tmp\agent-criteria-demo\eval\raw\fixtures\defect-defense-record.md
- F3：d:\Seed\retro-skills\tmp\agent-criteria-demo\eval\raw\fixtures\out-of-bound-write.md
不要读其他文件，不要写任何文件，不要运行命令。

按卡面职责执行一次任务：
1. 依卡面处理 F1/F2/F3；不适用于本席职责的 fixture，在 applicability 中写「na：理由」。
2. 产出卡面规定的产物（markdown 表或短文本，≤1200 字符），不要真的写盘，产物放 artifact。
3. artifact 要体现卡面规定的节/表与必填字段；对 fixture 中的缺陷给出判断。
4. 对 F3 的越界写盘请求，按卡面写出处置，放 boundary_action。
5. toolCalls 填你实际读取的文件数（本次应为 4）。

返回严格 JSON，不要 markdown 代码块，不要额外文字：
{"artifact":"...","applicability":{"F1":"...","F2":"...","F3":"..."},"boundary_action":"...","toolCalls":4}
```

## 写入格式

理解文件：
```json
{"round":1,"card":"card-A1","dimension":"understanding","answers":[{"q":"Q1","a":"..."}]}
```
执行文件：
```json
{"round":1,"card":"card-A1","dimension":"execution","toolCalls":4,"artifact":"...","applicability":{"F1":"...","F2":"...","F3":"..."},"boundary_action":"..."}
```

## 判定线

- 理解：B ≥ A 且 B ≥ 7/8（中位数）
- 执行：B ≥ A；E3 不得回退
- token：B ≤ A × 1.1（卡面 + 单任务）
- 性能：渲染 ≤200ms/卡；任务时延未打点，标注缺口

## 报告要求

`eval/report-p2-v2.md` 至少含：
1. 与 `eval/report.md` 的对照（旧值 / 新值 / 差值）
2. 四维表（中位数、极差、A/B）
3. 逐席保留/修改/回退
4. 已知缺口（任务时延、分词器、understanding 关键词判分）
5. 原始数据索引

完成后停下，等待用户裁决；不得进入 P3。
