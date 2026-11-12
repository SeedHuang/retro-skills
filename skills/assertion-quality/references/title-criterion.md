# 标题不得强于判据（建模场景）

> 读法：给判据、清单条目、禁令、字段起名时读本文；读完产出「标题断言词 → 可观测算子」对照（无算子则按第 2 条处置），缺对照 = 本条未执行。
> 适用范围：**仅建模产物**——模型的 `checkCriteria` / `predicates` / `permissionGroups` 与卡面标题；不适用于 skill 章节标题、PRD 标题等非判据标题。
> 来源：原 `rules/title-not-stronger-than-criterion.md`（2026-11-11 P1 新增；2026-11-12 经用户批准迁入本技能，避免全局误杀）

义务（全部成立才合规；缺一件 = 不合格）：

1. 标题里的每个断言词，必须有对应的可观测算子支撑（如「可复算」→ `quoteInLine`；「充分」→ `countGte`）
2. 找不到对应算子时，三选一：改标题、补算子、标 residual（不得两者都不做）
3. 标题不得复述判定取值或模式（如「全部成立 = hit」由 `mode` 派生，不写进标题）
4. 名词性名称（记录名、字段名、枚举值）不受本条约束——它们不是断言

反例：

- 「结论附可复算证据」只查 `fieldNonEmpty` —— 「可复算」没有算子
- 「引用闭环核对」只查 `quote` 非空 —— 「闭环」没有算子
- 「机器可判定核对」只查 `suggestion` 非空 —— 「可判定」没有算子

落点：模型的 `checkCriteria` / `predicates` / `permissionGroups`；卡面标题。

另见：`assertion-quality` 主手册（断言强度三轴）、`agent-modeling`（建模七阶流程）。
