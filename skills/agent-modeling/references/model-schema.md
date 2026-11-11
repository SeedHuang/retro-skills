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
| `boundary` | `kind` 三选一：`policy` / `literal` / `default`；选择规则见下节，写错不报错但语义不可核 | 是 |

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

## 边界形态选择规则

`boundary.kind` 由「模型自己声明要不要写盘」唯一确定，不看 `SEAT_POLICY` 的 capability：

1. **有写落点**（`seat.artifacts` 非空、`permissions.write.allow` 非空、`defaultLanding` 非空，或 `duty.action.landingMode === 'file'`）→ **必须 `policy`**（由 `renderBoundary(seat)` 派生），且该席档位必须含 `Write`，否则 `WRITE_TIER_MISMATCH`。
2. **无写落点** → **必须 `default`**（`DEFAULT_BOUNDARY` 常量），且卡面边界正文也等于该常量。
3. **禁止 `literal`**：手抄卡面散文不可核——散文与模型数据可以各改各的、都不报警，等于用「不可测的散文」换「字节一致」。渲染器保留 `literal` 供历史与副本测试，但模型清单里出现即红。
4. `policy` 但档位不含 `Write` → `BOUNDARY_POLICY_NONWRITER`；根因通常是 1 的档位没补齐。

判据不靠自觉：`tools/agent-model/test/boundary-source.test.mjs` 四条守卫逐席核「渲染正文 = 声明来源」「有写落点 ⇒ policy 且档位含 Write」「无写落点 ⇒ default 且卡面 = 默认句」「模型不得出现 literal」。写新模型前先跑它，红即改。

## 渲染顺序（段表）

`frontmatter` → `duty` → `must` → `never` → `conflict` → `checklist` → `outputFormat` → `outputs` → `permissions` → `escalation` → `boundary`

空段由段函数返回 `[]` 跳过，**不留空标题**。

## 写新模型的顺序

按上表 18 键逐个填，产出完整键表；`seat.tier` 与 `permissions` 必须同源于 `tools/docgen/builders/agents/policy/`（见 `permissions.md`），不另写数组。
