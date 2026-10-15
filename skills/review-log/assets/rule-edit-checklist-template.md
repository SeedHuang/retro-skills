# rule 编辑查账 checklist · {{ROUND}}（快照，定格于 {{GENERATED_AT}}）

> 生成命令：`node skills/review-log/scripts/gen-rule-checklist.mjs --round {{ROUND}} --review-dir <那一次>`（机械项由脚本填，AI 侧项见 A/B/C2/C3/D/E2/F 各表——**未填项 > 0 = 本次编辑未完成，不得交付**）。
> **无余地规则**：每项只有一档——贴「取数命令 → 实际输出」二件套；没有「不适用」「未执行」选项。本轮是否编辑 rule 由脚本用 git diff 判，不归 AI 判。
> **快照判读**：回溯查账只核「当时贴的输出真不真」（重跑该行命令比对），不拿活模板追杀旧轮次。
> **活模板**：本骨架跟随 rule-inspector / rule-writer / 全局规则检查项变化——检查项增/改/删时按 rule-inspector 硬闸门 7 第 6 条同步（assets/rule-edit-checklist-template.md）。
> **抽查方式**：随机抽任意行 → 重跑该行命令 → 比对输出。

## 0 · 本轮编辑了哪些 rule（脚本机械填）

| rule 文件 | 编辑类型 | diff 证据 |
|---|---|---|
{{RULE_TABLE}}

## A · 行为前提（动手前；出处：core-working-principles、global-ask-before-acting）

| # | 检查项 | 判据（命令 / 产物必含词） | 实际输出（必填） |
|---|---|---|---|
| A1 | 画全貌（六维 + 联动四问） | 产物 grep 必含：全貌确认/本质/同族/边界/验收/影响面/联动四问 | <grep 输出原文> |
| A2 | 写计划（spec） | `Test-Path docs/superpowers/specs/<对应设计>.md` | <True + 路径> |
| A3 | 算账（治本 vs 打补丁） | A1 产物 grep 必含：治本 | <该行原文> |
| A4 | 沟通授权 | 抄录用户授权原话（可核对） | <用户原话> |

## B · 推理纪律（出处：how-i-must-reason、data-support-triple）

| # | 检查项 | 判据 | 实际输出（必填） |
|---|---|---|---|
| B1 | 结论带可复核来源 | 来源可 Test-Path / 命令可重跑 | <来源 + 重跑结果> |
| B2 | 数字实测取数 | 取数命令随数字写出并重跑 | <命令 → 实测值> |
| B3 | 带数据判断过三性 | 结论 grep 必含：真实/合理/有效 | <三性各一句> |

## C · 文件与版本操作（出处：rules-single-source、no-git-write、powershell-file-encoding）

| # | 检查项 | 判据 | 实际输出（必填） |
|---|---|---|---|
| C1 | 规则建在源仓库 rules/ | `Test-Path rules/<name>.md`（脚本填） | {{C1_OUTPUT}} |
| C2 | 增删规则文件 → aas sync + 体检 | `aas`（新增/删除规则文件时） | <需建链接 = 0 或 理由：无增删> |
| C3 | 不主动 git 写操作（review 例外段内除外） | `git status --porcelain` 变更可解释 | <变更清单> |
| C4 | 写文件无 UTF-8 BOM | 前 3 字节 ≠ EF BB BF（脚本填） | {{C4_OUTPUT}} |

## D · 编辑内容（出处：reference-read-output-loop、skill-authoring-convention、landing-sweep）

| # | 检查项 | 判据 | 实际输出（必填） |
|---|---|---|---|
| D1 | 引用 reference「读→产出」闭环 | 产物 grep 含 reference 指定的核对词 | <读哪份 + 产出行> |
| D2 | 跨技能引用用技能名（禁路径） | `npm run check` ③ 守卫段 | <0 findings> |
| D3 | 落地后扫声明它的地方 | grep 关键词 + 旧状态词 | <命中清单> |
| D4 | 删规则文字 → 三检验报告 | 报告产物（删过才有） | <报告路径 + 可删段数 或 diff 证据：未删文字> |

## E · 每条被编辑 rule 的 inspector 复核（脚本机械填；AI 不得手抄此段）

{{E_SECTIONS}}

## E2 · rule-writer 自查（AI 填；出处：rule-writer SKILL + writing-guide）

| # | 检查项 | 判据 | 实际输出（必填） |
|---|---|---|---|
| E2-1 | 四要素声明（范围/条件/动作/宾语） | 草稿/产物 grep 四词 | <原文> |
| E2-2 | 执行力度 8 项自查 | writing-guide ② 节 8 项 | <逐项状态> |
| E2-3 | X1/X2/X3（认知动作型） | E 段 score 输出 + writing-guide 自查表 | <逐项 + 依据> |
| E2-4 | 判定词归一（封闭词表） | grep 表外词：不允许/不可/切勿 | <命中 = 0> |
| E2-5 | 标题一致性三句 | ①范围②极性③对象 对照 | <三句对照> |
| E2-6 | 来源行合规 | E 段头部组 score + 来源行原文 | <score + 原文> |

## F · 硬闸门 7 同步义务（动判据/检查项时必填；单源：rule-inspector SKILL）

| # | 同步面 | grep 判据 | 实际输出（必填） |
|---|---|---|---|
| F1 | score.mjs ↔ criteria §3.3b | grep 改动常量名 | <两处命中 或 理由：未动判据> |
| F2 | criteria ↔ recipes 处方 | grep 检查点名 | <两处命中 或 理由> |
| F3 | 判据 ↔ rule-writer 三层 | grep 词表关键词 | <三层命中 或 理由> |
| F4 | 检查项 ↔ 查账表行 | grep 检查名（模板查账节） | <行命中 或 理由> |
| F5 | 删除项反向扫 | grep 被删检查名全仓 | <残留 = 0 或 理由> |
| F6 | checklist 模板同步 | grep 检查项名（本模板） | <本模板行命中 或 理由> |

## 汇总

{{MECH_SUMMARY}}

- AI 项（A×4 + B×3 + C×2 + D×4 + E2×6 + F×6）：**逐项核对上方各表——有空缺 = 本次编辑未完成，停止**。
