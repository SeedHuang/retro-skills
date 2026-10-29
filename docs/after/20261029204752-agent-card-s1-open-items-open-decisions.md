# agent-card S1 未完成项 / 已知限制（open-decisions）

> **状态：未决（2026-10-29）**——本文只装「还没做完 / 不在本期 / 待触发」的项，不是验收结论。
> 何时搬走：任一条被处置后，把结论并入对应 spec/规则，并**从本文删除该条**（做完的不在本文件留 ✅）；全部清空时本文改为 `-done.md`。
> 来源：`docs/superpowers/plans/2026-10-29-agent-card-s1-card-model.md` 的「遗留与留观」表 + ④ 质量段缺口表（`.session/reviews/2026-10-29-2100-agent-card-s1-quality/quality-4.md` §5，11 条）+ `④@S1` 门行的行为偏差登记。
> 上游件：spec `docs/superpowers/specs/2026-10-29-agent-card-s1-card-model-design.md`（301 行 / `2931C7D7…3660064E`）、testcase 同目录（2318 行 / `03DA6675…6A76D6F5`，本段均未改）。

## 1 须由「新 sdet 实例」修订 testcase 才能收敛（施工者 / 审计均不代改）

| # | 项 | 现状 | 触发时机 |
|---|---|---|---|
| O-1 | `E03` 第三条 `green`（局部场景零引用断绿） | 与 `testcase:1013`（E02 ②）及 spec §7 `:170` 判 `UnusedScene` 红冲突；用户 2026-10-29 裁定取 E03 ①②，回归测试未收录该子面（留痕 `tools/docgen/test/card-model.test.mjs:757-761`） | 下次修订本 testcase 时**删该句** |
| O-2 | `testcase:680` 的 B02 前置「10 行都必须有 `mutate` 或 `fn`」 | 与该 testcase §0.4 自身的 `ScenePromotionRequired` 行（`kind:'env'`、无 `mutate`，实测 9/10）自相矛盾；本段把断言改为 `mutate｜fn｜env`（行数据一字未改） | 同批改 `testcase:680` 或给该行补 `mutate` |
| O-3 | `S1-G-11` `requires` 元素形状违规无码 | `requires: [{id}]` 静默通过（缺 `kind` / `must` 非布尔无判据） | 下次修订 spec §4 `:71` / §7 表时同批（新增码 = 判据级变更） |
| O-4 | `S1-G-12` 余项（PRD `:293` 的 `'…'` 省略号） | `SUBJECTS` 已成「登记表非封闭枚举」（spec §5 `:131`），但 PRD 侧仍留省略号 | **S4 扩 15 席**时同批收敛 PRD |
| O-5 | `S1-G-18` `N` 的不定量词（若干 / 多 / 十几） | 本实现认半角 + 全角 + 汉字数字（含多字），不定量词不判；spec 未写死 | spec 写明 `N` 面时 |
| O-6 | `S1-G-19` `validateOpenItems` 的 `cards` 完全不传 | 已签 testcase H05 ③/④ 即**以两参形态**调用并断绿，故缺参不报码 | 下次修订 spec §6 `:139` / 该 testcase 时 |
| O-7 | `S1-G-22` `compareVerdicts` 的 `FreeTextEnum` 条数 | 本实现按 `errors[].path` 去重 → 同一 `id` 至多 1 条；口径仍待 spec 写死（「至多 1 条」或「两处各判一半」） | 下次修订 §8 `:241` 时 |
| O-8 | `S1-G-4` 的 `scenes[].label` 归码 | spec 只给 `why` 配了码（`:171`），局部 scene 缺 `label` 无码可报 | 下次修订 spec §4 `:83` / §7 时 |

## 2 本段接受 / 不回流的残余（登记，不新增动作）

| # | 项 | 现状 | 兜底 |
|---|---|---|---|
| O-9 | `V-6` 守卫只判静态 import 行 | 动态 `import()` 拼串 / `createRequire` / `process.cwd()` 读文件拦不住（`S1-G-13` 已接受） | J05/J06 拦主干；残余接受，spec §12 R1 同类 |
| O-10 | `InlineThreshold` 映射外单位 | 实现按 §7 `:194` 原文正则 `(次｜条｜字｜个｜轮｜处｜%)` 枚举，表外单位（秒 / 页）不判（`S1-G-10` 余项） | A05 ② 七单位逐条必红已守；表外属 spec 未写 |
| O-11 | 校验器当前**无人调用** | S1 只交定义层，未接门禁（spec §12 R4 已登记） | 真实收益等 S3/S4 接线，本段不宣称 |

## 3 下段（S4）触发的两项（本段只交 API，不接线）

| # | 项 | 现状 | 触发 |
|---|---|---|---|
| O-12 | `L-2` `registeredIds` 单源切换（S2 `tools/observation-check/registered-ids.mjs:5` 仍是手写常量） | S1 只交 `registeredIdsOf()`，S2 文件按 §11-3 **零改动**（J03 ④ 有守卫断言） | **S4 首次重生成**（切换到派生，断言集合相等后删常量） |
| O-13 | `L-3` 15 卡豁免窗口（PRD C-08 `:121`） | 本段不接线、不触发（`npm run check` 的豁免窗口仍 `EXPIRY_EVENT=s4-first-regeneration / EXPIRY_LANDED=false`） | 同 S4 首次重生成 |

## 4 已判「不采纳组」但需留痕的两条

| # | 项 | 处置 |
|---|---|---|
| O-14 | `L-1` `CheckItem.criterion` 与 S6 `tools/execution-matrix/criteria.md` 三态 | **判为不交叉、不复用**：S6 三态是 AI 判项注解值域（`criteria.md:18-30`），S1 的 `criterion` 是卡片文本 → 不回 ② 段（依据见 `.session/reviews/2026-10-29-1813-agent-card-s1-plan-gate/impl-3.md` §3） |
| O-15 | `M-1` `scripts/check-plan.mjs:229` 的 B 载体正则把 F 对位 8 行当用例（`cases 66` ≠ 真值 58） | **本段不修**（S4 已签脚本）；用附录 A 一并落点（`map` 绿）。触发 = **下次修订 `scripts/check-plan.mjs` 或该 testcase 时同批**（两侧必须同批，否则附录 A 变 `dangling 8`） |
| O-16 | `ALLOWED_OPS` 无封闭清单（testcase `:868` 的记录项，**spec 未登记为缺口**） | 算子集可无限扩 → `UnreadableExpression` 的判别面随时间漂移；本实现按 JSON Logic 规范在 `expression.mjs` 单源写死，未封闭。兜底 = 议会测试评委记录（不属本段）。触发 = S4 首次使用新算子时，或 spec 补 `ALLOWED_OPS` 封闭表 |
| O-17 | `id` / `label` 混写的多时刻计数口径（testcase `:1053`，**spec 未写死**） | `moment = 'on-fail 失败时'`（同一成员 id 与 label 同现是否计 2 次）未定 → 可能误报 `MultiMomentInOneEntry`；本实现按成员数去重（同一 id 只计 1）。兜底 = 议会测试评委记录。触发 = 下次修订 spec §7 `:177` 时写死计数口径 |
| O-18 | `HARDCODED_COUNT` 第三条正则（spec §7 `:187` 原文 `全部[命中]*`） | 原文会连**裸「全部」**一起命中（合法句「全部走查」被误报）。代码审查（2026-10-29）已把实现收窄为 `全部命中`（`tools/docgen/card-model/enums.mjs:68-72`）——属**实现侧收紧、与 spec 原文不一致**。触发 = 下次修订 spec §7 `:187` 时把该行同步为 `全部命中`（**不得**只改代码不改 spec 而长期并存） |
