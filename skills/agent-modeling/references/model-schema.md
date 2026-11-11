# 模型键与展开规则

## 单席模型顶层键（18）

`version` / `id` / `extends` / `seat` / `duty` / `timing` / `defaultLanding` / `checklist` / `checkCriteria` / `outputFormat` / `templates` / `outputs` / `forms` / `predicates` / `records` / `escalation` / `permissions` / `boundary`

| 键 | 作用 | 必填 |
|---|---|---|
| `version` / `id` | 模型版本与席名 | 是 |
| `extends` | 共享层文件名（现行统一 `_shared-model.json`） | 是 |
| `seat` | `id` / `display` / `triggers[]` / `description` / `artifacts[]` / `tier` | 是 |
| `duty` | 触发来源、动作三元组（verb / scope / objects / emit）、落点 | 是 |
| `timing` | 场景 / 时刻 / 频度（覆盖共享默认） | 否 |
| `defaultLanding` | 默认写回 `forms` 的哪个 artifact | 是 |
| `checklist` | 本席清单条目，每条挂一个 `checkCriteria` 键 | 是 |
| `checkCriteria` | 判据：`action` + `observable[]` + `mode` + `negative` + `residual` | 是 |
| `outputFormat` | 必填字段表 + 由 `observable` 派生的校验行 | 否 |
| `templates` | 账本模板引用（`skill` / `label` / `columns`） | 否 |
| `outputs` | 产物清单：阶段 / artifact / 模板 / 动作 / 模式 | 是 |
| `forms` | artifact 与命令登记（`path` / `prefix` / `requires`） | 是 |
| `predicates` | 本席谓词（`ok` / `bad` / `slots` / `guard`） | 否 |
| `records` | 记录契约（`label` / `unit` / `source` / `shape[]`） | 是 |
| `escalation` | 越界处置：`steps[]`（halt / report / voidRound）+ 上报字段 | 否 |
| `permissions` | action / write / command 三维，见 `permissions.md` | 是 |
| `boundary` | `kind` 三选一：`policy` / `literal` / `default` | 是 |

## 共享层键（20）

`timing` / `verdicts` / `conflict` / `globalRules` / `reasonCodes` / `enums` / `vocab` / `checklistColumns` / `outputKeys` / `predicates` / `rules` / `records` / `forms` / `actions` / `permissionGroups` / `placeholders` / `objectKinds` / `perspectives` / `schedules` / `triggerPhrases`

共享层是**默认真相**：单席只写差异，不复制共享层条目。

## 展开（浅合并，唯一实现 `expand()`）

顺序固定，后写覆盖前写：

1. `must` = 共享 `rules.must` 中 `appliesWhen` 命中本席的条目 + 本席 `must`；命中后剥掉 `appliesWhen`。
2. `never` 同上。
3. `predicates` = 共享命中项 → 本席同名覆盖。
4. `records` = 共享 `records` 打底 → 本席同名做**一层**浅合并（`{ ...shared[k], ...own[k] }`，`shape` 数组整体替换，不逐项 merge）。
5. `forms` = 共享 `forms` + 本席 `forms`（同名覆盖）。
6. `timing` = 共享 `timing.default` + 本席 `timing`。
7. 其余键（`seat` / `checklist` / `checkCriteria` / `outputs` / `permissions` / `boundary` …）**不继承**，单席必须写全。

`appliesWhen` 取值：`'*'`（全席）或席名数组。

## 渲染顺序（段表）

`frontmatter` → `duty` → `must` → `never` → `conflict` → `checklist` → `outputFormat` → `outputs` → `permissions` → `escalation` → `boundary`

空段由段函数返回 `[]` 跳过，**不留空标题**。

## 写新模型的顺序

按上表 18 键逐个填，产出完整键表；`seat.tier` 与 `permissions` 必须同源于 `tools/docgen/builders/agents/policy/`（见 `permissions.md`），不另写数组。
