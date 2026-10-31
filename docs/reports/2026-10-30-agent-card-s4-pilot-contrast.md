# 试点对照稿（归档副本）：`detective-observer` 旧卡 → 新卡（agent-card S4）

> 用途：spec §8 步 1（试点先行）的对照稿**归档副本**（可跨机复核的那一份）。工作副本在 `.session/reviews/2026-10-31-s4-task2-impl/pilot-contrast.md`（`.session/` 不进 git）。
> 取数（本批实跑）：`git diff --numstat -- agents/ tools/docgen/` → `62	0	tools/docgen/components/agentData.mjs`（单席数据 62 行新增、0 行删除）；旧卡 `agents/detective-observer.md` 66 行 → 新卡 81 行（`node tools/docgen/cli.mjs diff --kind agent --name detective-observer` 的「行数」两处）。换算式：剩余 = 单席 × 14 + 20% 缓冲（数字由实测产生，spec 不填）。

## 一、7 段逐段对照（新卡段 ← 旧卡来源）

| 新卡段 | 旧卡来源 | 差异结论 |
|---|---|---|
| front matter | `name` / `description` / `tools` | **相同**字段集；`description` 由「在议会评审中担任侦探。每轮答辩结束后由主持人调度做行为核实时调用」改为触发条件直出「每轮答辩结束后由主持人调度做行为核实」，去掉派生式与尾随「时」（§10-D3） |
| 职责 | 「## 你是谁」 | **搬落点不删内容**：identity 叙述进 README 的 rationale；卡面改为 `duty`（触发 / 关注类别 / 动作 / 约束）四行，语义对齐旧 identity + 四类核对 |
| 一定会 | 「## 固定必问清单」+「## 通用纪律」的证据句 + 「## 自由探索」 | **差异最大的一段**：4 条共享 must（立场客观 / 证据可复算 / 平实表达 / 无问题不造问题）+ 本席 1 条自由探索 must；旧卡的「共享特质」「通用纪律」逐句上移共享层（本席 use 全量 8 条），卡面只留判据 id 与落点 |
| 禁止 | 「## 通用纪律」的反向句 | **上移**为 4 条共享 never：只提问题不给解法 / 越权自行处置 / 证据栏留空 / 代他人填表 |
| 冲突裁决 | 旧卡无此段 | **新增**（模板常量三行：优先级 用户 > 规则 > 本席；采纳 / 不采纳 + 认输判据），15 卡同源一处 |
| 本席清单 | 「## 固定必问清单」4 行 | **逐条拆成 4 条 checkItem**（评委刁难 / 答辩回避 / 主持人失职 / 工具越权）+ 4 个类别 label；每条带条目 id、判据文字与 check 类型 |
| 输出格式 | 「## 五字段表」 | **相同语义**：走共享 `outputFormats.observation`（卡号 / 对象 / 行为类型 / 判定依据 / 处置建议 + 两条校验），不再在席数据里复制一份 |
| 边界 | 「## 边界」 | **相同**：仍取 `boundaryBySeat` 的渲染结果（档位事实 / 只允许写 / 禁止写 / 命令白名单 / 越界后果） |

## 二、差异清单（删了什么、搬到哪）

1. **删**「## 共享特质」「## 通用纪律」两节（旧卡 15 席同文）→ 上移到共享 must / never（单源 `shared-actions.mjs`）。
2. **删**「### 侦探处置表」四行散句 → 语义并入 duty 的 constraint（只记录不裁决 / 记录原文进最终报告 / 引用真实卡号）。
3. **删**「## 自由探索」节的散文句 → 变成一条 must（`detective.free-explore`，落 `deliverable.appendix`）。
4. **称谓统一**：旧卡 `Select-String '议长|主持人'` = 8 行（议长 1 行 / 主持人 7 行，出现 8 次）；新卡**议长 0 命中、主持人 2 处**（职责段与 README rationale），不再混用（spec §5.2 :154）。
5. **搬进 rationale（README 侧）**：identity 叙述、迁移说明（旧段 → 新落点）。卡面零出现（`A06` 判）。
6. **不再出现在卡面**：「固定必问清单」的散文长句与「待答」占位；对应判据文字进 checkItems。

## 三、一致性核对（可机械判）

- 7 段段名 / 段序 = `CARD_SEGMENTS`（`detective-observer` 卡面实跑逐项相等）；
- S1 `validateCardModel(card, buildEnv)` → `errors: []`；
- 执行力度矩阵 A3–A7 → `findings: []`（A4 / A5 都被真判过，notes 各一条）；
- `PROSE_PROBES` 三类（旧段名 / 声明句式 / 指针词）→ 0 命中；
- 三投影同源：卡面 / README / `dump` 对同一字段逐字一致（`rationale` 只在 README）。

## 四、出数与结论

- 单席改动：数据 62 行新增（`agentData.mjs`），卡面 66 → 81 行。
- 剩余工期换算：单席 × 14 + 20% 缓冲（本表只给换算式，数字由后续逐席实测累加）。
- 结论：**试点通过**——新卡可渲染、可校验、可替换、可回滚（回滚 = 该席数据 + 该席两个生成物）。
