# 校验码与修法

引擎：`tools/agent-model/verify-models.mjs`（本文件只解释码，不复述实现）。判红 = 码出现即失败，`verify.mjs` 退出码 1。

## 结构类

| 码 | 触发 | 最小修法 |
|---|---|---|
| `must` / `never` / `predicates` / `record-lost:<k>` / `record-diff:<k>` | 展开结果与 `models/_baseline/<seat>.json` 不等 | 只允许「等价重构」：行为不变时重跑 baseline 更新脚本并复核差异；有行为变化则回 P2 重写判据 |
| `TYPE_UNKNOWN` / `TYPE_CONFLICT:<a,b>` | 模型不同时匹配任何 / 多个类型类 | 补齐类型特征键；同席只能属一个类型 |
| `PATH_UNDEFINED` | `seat.artifacts` 中的 artifact 在 `forms` 里无 `path` | 在 `forms` 补 `path` |
| `PATH_INVALID` | `forms[].path` 占位符未登记（`SourceUnstructured` / `SourceTextMissing`） | 占位符必须出现在共享 `placeholders`；`records[].source.kind=description` 必须有 `text` |
| `SKILL_MISSING` | `templates[].skill` 指向的技能目录不存在 | 引用的技能名必须在 `<repo>/skills/` 下真实存在 |

## 权限类

| 码 | 触发 | 最小修法 |
|---|---|---|
| `PERM_TARGET write:<id>` / `form:<id>` | 写/命令白名单里的 id 不在本席 `seat.artifacts` 或 `forms` | 删掉越权项，或把对应 artifact 加进 `seat.artifacts` |
| `ACTION_CONFLICT` | 同一动作同时在 `allow` 与 `forbid` | 二选一 |
| `UNKNOWN_ACTION` | 动作不在共享 `actions` 词表 | 用登记词，不自造 |
| `PERM_ORPHAN` | `forbid` 的动作既无 `permissionGroups` 也无共享词表 | 补 `permissionGroups` 或改用登记动作 |
| `PERM_UNOBSERVABLE` | `permissionGroups[k]` 既无 `signal` 也无 `residual` | 补 `signal`（可判）或 `residual`（明示不判） |
| `TIER_MISMATCH model=<x> policy=<y>` | `seat.tier` 与 policy 推导档位不一致 | 改 `seat.tier` 或改 policy；不许两边都改来「对齐」 |
| `WRITE_SCOPE_MISMATCH` | `permissions.write.allow` 与 `seat.artifacts` 不同（含顺序） | 以 `seat.artifacts` 为准重排 |
| `OUTPUT_UNWRITABLE` | `outputs.items[].artifact` 不在写白名单 | 补进 `permissions.write.allow` 或删该产物 |

## 文本与判据类

| 码 | 触发 | 最小修法 |
|---|---|---|
| `TITLE_DRIFT <key>.<ok\|bad>` | 谓词标题里的动作词与 `slots` 的 op 对不上 | 标题改用与 op 同义的动作词；不给 op 加标题词 |
| `TRIGGER_UNKNOWN <id>:<x>` | 触发里的 `objects` / `perspective` / `schedule` 或触发短语未登记 | 用共享词表里的 id，或在 `triggerPhrases` 登记 |
| `ACTION_MISMATCH <key>:<action>` | `checkCriteria[k].action` 与 `observable` 的 op 类不匹配 | 换 action 或换 op（`verify`/`recount`/`spotCheck`/`replay`/`compare` 各有允许集） |
| `OUTPUT_TEXT_HANDWRITTEN <id>` | `outputFormat.checks[]` 出现 `text` 键 | 删 `text`，改用 `observable` 派生 |
| `ISSUE_RULE_ON_NON_ISSUER <rule>` | 规则目标是问题卡某栏，但本席不出问题卡 | 给规则加 `appliesWhen` 排除本席，或本席补 `artifact.issueCard` |

## 边界类

| 码 | 触发 | 最小修法 |
|---|---|---|
| `BOUNDARY_KIND_UNKNOWN <k>` | `boundary.kind` 不是 `policy` / `literal` / `default` | 三选一 |
| `BOUNDARY_TEXT_MISSING` | `literal` 缺 `text` 或全空白 | 补原文 |
| `BOUNDARY_TEXT_WHITESPACE` | `literal.text` 首尾带空白 | 去掉首尾空白（正文内部空白不动） |
| `BOUNDARY_POLICY_NONWRITER` | `policy` 档位但该档工具集不含 `Write` | 给该席补 `write` capability（有写落点时），或改 `default` |
| `WRITE_TIER_MISMATCH tier=… footprint=…` | 模型声明写落点（artifacts / write.allow / defaultLanding / landingMode:file），但档位工具集不含 `Write` | 给 `SEAT_POLICY[席].capabilities` 补 `write`，并同步模型 `seat.tier` |

## 用法

1. 跑 `node scripts/verify.mjs <model>`（在技能目录下执行）。
2. 每出现一个码，在上表找到行，按「最小修法」改一处。
3. 重跑直到首行 `EQUIVALENT`；改过 `must`/`never`/`predicates`/`records` 的，另跑一次等价比对（`--ref`）。
4. 产出「码 → 改动点 → 复验结果」三列对照，缺一不合格。
