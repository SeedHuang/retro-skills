# P2 v2 完整重跑 Runbook（2026-11-11）

## 状态

- 原 P2 记录基线：`d678028`；当前留档来源：`fa67454`。
- 工作区只保留：报告 + 本 runbook + `fixtures/` + 评分脚本 + `aggregate-v2.csv`。
- 逐轮原始 JSON（42 × 4）**不长期入库**；需要复核时按「准备数据」从 `fa67454` 重生成，或按本 runbook 重跑。
- 原 P2 报告：`report.md`（保留，不覆盖）；v2 报告：`report-p2-v2.md`。
- 历史卡面（`cards/` / `cards-fix/`，14 张 ×2）与原始样本只在 `fa67454` 的 `tmp/agent-criteria-demo/eval/raw/` 里。

## 目标

按 PRD §6 P2 / §7 完整重跑四维评估（7 席 × A/B × 3 轮），产出 `report-p2-v2.md`，提交后停下。

- 理解：14 卡 × 3 轮 = 42 个独立 subagent
- 执行：14 卡 × 3 轮 = 42 个独立 subagent
- 每 subagent 只测一维一卡；单轮内 A/B 不共用会话

## 准备数据

```powershell
$T = Join-Path $env:TEMP 'p2-eval'
Remove-Item -Recurse -Force $T -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $T | Out-Null

# 1) 历史盲测卡（A/B 两套，14 张）从留档 commit 取到临时目录
$tar = Join-Path $T 'cards.tar'
git archive --format=tar --output=$tar fa67454 tmp/agent-criteria-demo/eval/raw/cards tmp/agent-criteria-demo/eval/raw/cards-fix
tar -xf $tar -C $T
$CARDS_DIR = Join-Path $T 'tmp/agent-criteria-demo/eval/raw/cards-fix'

# 2) fixture 随仓保留（3 件）
$FIXTURES_DIR = 'docs/reports/2026-11-12-agent-model-p2-eval/raw/fixtures'

# 3) 原始输出写到临时目录，评分后只留聚合表；不要提交逐轮 JSON
$OUT_DIR = Join-Path $T 'out'
New-Item -ItemType Directory -Force $OUT_DIR | Out-Null
```

## 文件与目录

- 卡面：`$CARDS_DIR\<card>.md`（如 `card-A1.md`）
- fixture：
  - `$FIXTURES_DIR\defect-issue-card.md`
  - `$FIXTURES_DIR\defect-defense-record.md`
  - `$FIXTURES_DIR\out-of-bound-write.md`
- 输出：
  - `$OUT_DIR\understanding-v2\r<1|2|3>-<card>.json`
  - `$OUT_DIR\execution-v2\r<1|2|3>-<card>.json`
- 评分（在 `raw/` 目录下跑，参数指向临时输出目录）：
  - `node score-understanding.mjs <OUT_DIR>\understanding-v2`
  - `node score-execution.mjs <OUT_DIR>\execution-v2`
  - `node token/token-summary.mjs <OUT_DIR>\execution-v2 $CARDS_DIR`
- 报告：`report-p2-v2.md`

## 理解 prompt 模板（替换 CARD 与 ROUND）

```
你是一名独立评估者。只读这一个文件：<CARDS_DIR>\CARD.md。不要读任何其他文件，不要写任何文件，不要运行命令。

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
- 卡面：<CARDS_DIR>\CARD.md
- F1：<FIXTURES_DIR>\defect-issue-card.md
- F2：<FIXTURES_DIR>\defect-defense-record.md
- F3：<FIXTURES_DIR>\out-of-bound-write.md
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
