# 共享项变更台账（R7 硬闸门载体）

> 共享项 ④来源覆盖 / ⑤冲突裁决 / ⑥例外从严 / ⑦触发机制 / ⑧验证闭环 的**判定定义**在 `skills/rule-inspector/references/criteria.md` §2.4（rule 判据单源）。
> 共享项定义变更必须先在本台账留齐「改前版 + 改后版 + 用户确认」三件套，才允许落地到权威载体（spec R7：改前 vs 改后两版留齐 + 用户确认）。
> 机械判定：`node tools/execution-matrix/shared-changes/check-shared-changes.mjs`（已挂进 `npm run check` ②.6 段）。
> 判定口径：
>   ① 每条变更记录缺「改前版 / 改后版 / 用户确认」任一件 → 报红（`SharedChangeIncomplete`）。
>   ② 每个共享项的最新「改后版」与权威载体当前定义不一致 → 报红（`SharedDefinitionMismatch`）：改了却没登记，或登记了但没落地。

## 变更记录

| 日期 | 共享项 | 改前版 | 改后版 | 用户确认 | 受影响引用方 |
|---|---|---|---|---|---|
| 2026-10-20 | 来源覆盖④ | 禁令类声明「不因来源豁免」（含计划/子代理/脚本/工具模板） | 禁令类声明「不因来源豁免」（含计划/子代理/脚本/工具模板） | 2026-10-20 建档基线：共享项定义自 rule-inspector 判据集落盘起未变更（改前版 = 改后版 = 建档时的当前版本） | `skills/rule-inspector/references/criteria.md` §2.4；`rules/skill-authoring-convention.md` 结构节 |
| 2026-10-20 | 冲突裁决⑤ | 声明「与具体指令/模板冲突时以本规则为准」 | 声明「与具体指令/模板冲突时以本规则为准」 | 2026-10-20 建档基线：共享项定义自 rule-inspector 判据集落盘起未变更（改前版 = 改后版 = 建档时的当前版本） | `skills/rule-inspector/references/criteria.md` §2.4；`rules/skill-authoring-convention.md` 结构节 |
| 2026-10-20 | 例外从严⑥ | 例外条件明确（「只有…才算」），无宽松词（「一般」「通常」「可能允许」） | 例外条件明确（「只有…才算」），无宽松词（「一般」「通常」「可能允许」） | 2026-10-20 建档基线：共享项定义自 rule-inspector 判据集落盘起未变更（改前版 = 改后版 = 建档时的当前版本） | `skills/rule-inspector/references/criteria.md` §2.4；`rules/skill-authoring-convention.md` 结构节 |
| 2026-10-20 | 触发机制⑦ | 有可观测触发信号/时机（「落地后」「开工时」「编辑后」） | 有可观测触发信号/时机（「落地后」「开工时」「编辑后」） | 2026-10-20 建档基线：共享项定义自 rule-inspector 判据集落盘起未变更（改前版 = 改后版 = 建档时的当前版本） | `skills/rule-inspector/references/criteria.md` §2.4；`rules/skill-authoring-convention.md` 结构节 |
| 2026-10-20 | 验证闭环⑧ | 定义「怎么确认遵守了」（自检命令/检查点/报告要求） | 定义「怎么确认遵守了」（自检命令/检查点/报告要求） | 2026-10-20 建档基线：共享项定义自 rule-inspector 判据集落盘起未变更（改前版 = 改后版 = 建档时的当前版本） | `skills/rule-inspector/references/criteria.md` §2.4；`rules/skill-authoring-convention.md` 结构节 |
