# agent 模型类型体系（schema）

> 来源：`models/` 下 7 个实例反向抽象（2026-11-11）
> 必填性由实例覆盖率推出：7/7 → 必填；部分 → 选填并注明原因
> 用途：新建席时先选类型，再填字段；校验器按类型报错

## 0 三层结构

```
BaseModel（所有卡共有）
├─ ReviewerModel    产出问题卡      actuary / ai
├─ AuditorModel     产出审计单      audit
└─ RespondentModel  产出答辩/取证/观察  respondent×2 / evidence-reader / detective
```

判别依据不是字段存在性，是**记录集合**（见 §3）。

## 1 BaseModel

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `version` | number | 是 | 固定 2 |
| `id` | string | 是 | 席 id，与文件名一致 |
| `extends` | string | 是 | 共享块文件名 |
| `seat` | `Seat` | 是 | |
| `duty` | `Duty` | 是 | |
| `timing` | `Timing` | 是 | |
| `defaultLanding` | `string` | 是 | 必须是 `forms` 的键 |
| `checklist` | `Checklist` | 是 | |
| `checkCriteria` | `Map<string, Criterion>` | 是 | 键 = 判据 id |
| `templates` | `Map<string, Template>` | 是 | |
| `outputs` | `{ items: OutputItem[] }` | 是 | |
| `forms` | `Map<string, Form>` | 是 | |
| `records` | `Map<string, Record>` | 是 | 开放字典 |
| `permissions` | `Permissions` | 是 | |
| `escalation` | `Escalation \| null` | 是 | 允许 null |
| `must` | `Rule[]` | 是（展开后） | 本地可空，共享池补齐 |
| `predicates` | `Map<string, Predicate>` | 是（展开后） | 同上 |
| `outputFormat` | `OutputFormat` | **否** | 6/7；audit 缺，待补 |

## 1.1 抽象判据：哪些提升为类型

不能每个对象都建类。三条判据，满足任一才提升：

| # | 判据 | 提升为类型 | 留在父级作属性组 |
|---|---|---|---|
| 1 | **有独立 id**（被键引用） | `Record` / `Criterion` / `Form` / `Template` / `Predicate` | — |
| 2 | **被两处以上引用** | `Observable` / `Residual` / `Field` / `Timing` / `Trigger` | — |
| 3 | **是渲染单元**（单独成行/成表） | `ChecklistItem` / `Objective` | — |
| — | 只属于一个父级、不被引用 | — | `Description` / `DutyAction` / `Negative` / `Source` / `OutputItem` / `Step` |
| — | 同构二选一 | `Trigger.Element` / `Trigger.Phrase` 合成联合类型 | — |

### 父子树

```
BaseModel
├─ Seat ────────── Trigger（Element | Phrase）
│                   └─ Description      ▸ 内联
├─ Duty ────────── DutyAction           ▸ 内联
├─ Timing
├─ Checklist ───── ChecklistItem
├─ checkCriteria ─ Criterion ─┬─ Observable
│                             ├─ Negative          ▸ 内联
│                             └─ Residual ─ Objective
├─ records ─────── Record ────┬─ Field
│                             └─ Source            ▸ 内联
├─ forms ───────── Form
├─ templates ───── Template
├─ outputs ─────── OutputItem           ▸ 内联
├─ permissions ─── Axis（allow/forbid）  ▸ 内联
├─ must / never ── Rule ────── Target    ▸ 内联
├─ predicates ──── Predicate
└─ escalation ──── Escalation ─ Step     ▸ 内联
```

`▸ 内联` = 不单独成类，只在该父级下作为对象字面量出现。

### 跨类型引用（领域关系）

| 引用方 | 被引用方 | 取什么 |
|---|---|---|
| `Criterion.observable.ofRef` | `Record` | 记录 id |
| `Rule.targets.object` | 共享 `vocab.object` | 对象枚举 |
| `Rule.criterion` | `Predicate` | 判据 id |
| `ChecklistItem.criterion` | `Criterion` | 判据 id |
| `Trigger` | `objectKinds` / `perspectives` / `schedules` / `actions` | 枚举值 |
| `permissions.write.allow` | `Form`（kind=artifact） | form id |
| `permissions.command.allow` | `Form`（kind=command） | form id |
| `OutputItem.artifact` / `.template` | `Form` / `Template` | id |
| `Negative.failsOn` | `Record.field` | 字段路径 |
| `Residual.fields[]` | `Record.field` | 字段路径 |

这十条构成了领域模型的骨架：哪些是名词、哪些是引用、引用到哪个命名空间。

## 2 类型字典

含提升类型与内联属性组。内联项——`Description` / `DutyAction` / `Negative` / `Source` / `OutputItem`——不单独成类，字段说明仍列于此，供对照。

| 类型 | 字段 | 必填 |
|---|---|---|
| `Seat` | `id` / `display` / `triggers[]` / `description` / `artifacts[]` | 全必填 |
| `Trigger.Element` | `objects[]`? / `perspective`? / `scope`? / `action`? / `timing`? / `schedule`? | 至少一项 |
| `Trigger.Phrase` | `id` | 必须登记在 `triggerPhrases` |
| `Description` | `template` / `joiner` / `lastJoiner` | 全必填 |
| `Duty` | `trigger{from}` / `action` / `constraint`? | `action` 必填 |
| `DutyAction` | `verb` / `scope` / `objects[]` / `emit[]` / `landingSubject` / `landing` / `landingJoiner` | 全必填 |
| `Timing` | `scene` / `moment` / `repeat` | 全必填 |
| `Checklist` | `items[{ no, seatPrefix, category, criterion }]` | 全必填 |
| `Criterion` | `action` / `mode` / `observable[]` / `negative` / `residual` / `guard`? | 前五项必填 |
| `Observable` | `op` / `ofRef` + 算子参数 | `op`/`ofRef` 必填 |
| `Negative` | `input` / `expect` / `failsOn` | 全必填 |
| `Residual` | `who` / `sample` / `fields[]` / `objective` | 全必填 |
| `Objective` | `target` / `machineCmd`? / `reason`? | `target` 必填；二选一 |
| `Record` | `label` / `unit` / `source` / `shape[]` / `verify`? | 前四必填 |
| `Field` | `id` / `label` / `type` / `required` / `values`? / `when`? / `min`? | 前四必填 |
| `Source` | `kind` / `template`? / `text`? | `kind` 必填 |
| `Form` | `text` / `kind` / `path` 或 `prefix` 或 `match` / `requires`? | `text`/`kind` 必填 |
| `Template` | `skill` / `label` / `columns[]` | 全必填 |
| `OutputItem` | `phase` / `artifact` / `template` / `action` / `mode` / `section`? | 前五必填 |
| `Permissions` | `policy` / `action{allow,forbid}` / `write{allow,forbidForms}` / `command{allow,forbidForms}` | 全必填 |
| `Rule` | `id` / `criterion` / `targets[{ object, landing?, timing? }]` | 全必填 |
| `Predicate` | `ok` / `bad` / `slots[]` | 全必填 |
| `Escalation` | `title` / `recipients` / `report` / `steps[]` / `detectionLimit`? / `residual` | 前四必填 |

## 3 三个子类

判别依据是**产出的 artifact id**，不是 `records`（`respondent-architect` 也读问题卡，不能按 records 判）。

| 子类 | 判别条件 | 额外约束 |
|---|---|---|
| `ReviewerModel` | `outputs[].artifact = artifact.issueCard` | 必须含 predicates `issue-without-solution` |
| `AuditorModel` | `outputs[].artifact ∈ { artifact.roundCheck, artifact.deliveryAudit }` | 必须含 `verdicts`（hit/miss/na 及 reason 规则） |
| `RespondentModel` | `outputs[].artifact ∈ { artifact.factSummary, artifact.defenseRecord, artifact.detective }` | 不得含 `artifact.issueCard` |

三类互斥，命中多个即冲突。

## 4 继承规则

| # | 规则 | 失败码 |
|---|---|---|
| 1 | 子类不得缺父类必填字段 | `FieldRemoved` |
| 2 | 子类可以把父类选填改必填，不可反向 | `OptionalityDowngrade` |
| 3 | 子类新增字段不得与父类同名且类型不同 | `FieldTypeConflict` |
| 4 | 子类可要求字典必须含某键（如 `issueCardFull`） | `DictKeyMissing` |

## 5 类型判别校验

| 检查 | 失败码 |
|---|---|
| 不满足任何子类 | `ModelTypeUnknown` |
| 同时满足两个子类 | `ModelTypeConflict` |
| 子类要求的字典键缺失 | `DictKeyMissing` |

## 6 现有 7 个实例的归属

| 席 | 类型 | 判别依据 |
|---|---|---|
| reviewer-actuary | ReviewerModel | `artifact.issueCard` |
| reviewer-ai | ReviewerModel | 同上 |
| reviewer-audit | AuditorModel | `artifact.roundCheck` |
| detective-observer | RespondentModel | `artifact.detective` |
| evidence-reader | RespondentModel | `artifact.factSummary` |
| respondent-architect | RespondentModel | `artifact.defenseRecord` |
| respondent-dev | RespondentModel | 同上 |

## 7 新建一席的最小步骤

1. 判定子类：产出问题卡 / 审计单 / 答辩记录
2. 复制同类现有卡作骨架
3. 只改 `seat` / `duty` / `checklist` / `checkCriteria` / `records` / `permissions`
4. 跑 `verify-models.mjs`，类型判别 + 继承规则必须全过
5. 渲染，与手写对照

## 8 与「方法提取」的关系

类型体系带来的不是方法，是**三类固定的渲染路径**：

| 子类 | 一定出现的段 | 可能为空的段 |
|---|---|---|
| ReviewerModel | 一定会 / 禁止 / 冲突裁决 / 本席清单 / 产出 / 权限 | 越界处置 |
| AuditorModel | 同上 + 越界处置 | — |
| RespondentModel | 职责 / 本席清单 / 产出 / 权限 | 一定会（可为空）/ 禁止（可为空） |

解释器按子类选段清单，不再逐卡判断——这是「行为可预测」的落点。
