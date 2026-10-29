# agent-card S1 定义层（F-01～F-08）设计：卡面内容模型 + 校验器

> 状态：**内容已定稿，待议会 #2 签字（v6）**｜创建：2026-10-29
> 版本增量：**v2** = 独立 sdet 首轮复核 6 条 P0（码数 36、`CARD_MODEL_CODES`、`env` 三键、产物侧形状、入口签名、表达式互斥组）；**v3** = 第二轮 2 条 P0（§4.1 `:93-99` 两个 `criterion` 分形、§4.2 `:101-113` `SCAN_FIELDS`、§7 `:208` 开放项缺列分工）；**v4** = 第三轮 2 条（§7 `:181` `manual` 豁免载体、§7 `:179` `HardcodedCount` 数字面）；**v5** = 议会 #2 第 1 轮 8 族（§8 `:223-238`、§6 `:138-159`、§7 `:180` / `:181` / `:183` / `:196`、§5 `:131-133`、§10-D16～D19）；**v6** = 议会 #2 第 2 轮（§8 `:225-226` M2 判定面粒度 + 组表序号 `:230-237`、§7 `:180` 变量本身未赋值、§6 `:147` 码表值改字段引用、§3 `:47-48` 四入口、§10-D20/D21）；**v6.1** = 收口轮记录类修正（§10-D8 位置改 PRD `:215`、§10-D22 `evidenceRequired` 不判）
> 功能点：**F-01～F-08**（`docs/prd/20261026205821-agent-card-contract.md` §6 `:463-472`）；交付份 **S1**（同文 §8 `:516`）
> 上级规范：同文 §3.8 `:243-284` 是 S1 **字段形状的唯一权威**；本文只给落点、形状细化与判据落地，不复制 PRD 结论
> 测试用例文件：`2026-10-29-agent-card-s1-card-model-design-testcase.md`（同批、同目录，由独立 `senior-sdet` 在全新上下文编写；本 spec 不内联用例）
> 规模：spec ≤350 行 / testcase ≤80 条 / 议会 ≤3 轮
> 落点决策：用户 2026-10-29 裁定 **A** —— 新建 `tools/docgen/card-model/`，与 S6 的 `tools/docgen/policy/**` **零接触**

## 1 全貌

| 维度 | 内容 |
|---|---|
| 本质 | 把卡面「该写什么」从散文约定改成**封闭枚举 + 数据形状 + 可机械判的校验器**：一份卡片数据进 `validateCardModel` 出 `{ok, errors[]}`，每个错误码都有唯一触发条件 |
| 同族 | S6 的 `policy/**`（权限 / 命令 / 路径 / 档位轴，**不同轴**）；S2 的 `tools/observation-check/{render,checks,data}.mjs`（产物侧 + 演示实现）；S4 的 `agentData.mjs`（15 席内容数据源） |
| 边界 | **不渲染、不动 `agents/*.md`**（三投影归 S4 §3.7）；**不碰 `policy/**`**（S6 定义层）；**不改 `tools/observation-check/**`**（S2 已签交付）；不填 15 席内容（S4 的 F-11）；不做门禁接入（S3） |
| 验收 | V-1～V-8（§9）；核心三条：**枚举无开放口**、**每个脚本码有唯一最小红点**、**同一 path 至多一码（无互斥）** |
| 影响面 | 新目录 `tools/docgen/card-model/`（**12 个 `.mjs`**：`enums` / `landings` / `scenes` / `signals` / `subjects` / `open-items` / `expression` / `merge` / `validateCardModel` / `index` + `vocab/subjective-terms` / `vocab/criterion-terms`）+ 1 个测试文件 + PRD **四处**词表路径勘误（`:202` / `:239` / `:270` / `:274`）；`npm run check` 的 `**/*.test.mjs` 全仓 glob 自动收新测试，`package.json` 零改动 |
| 收益 | PRD §4.4 B 表「S1 待实现」的 36 个码从「已命名、零实现」变为可判；S4 有形状可填、S3 有校验器可接；不以「省工时」立论 |

**联动四问**：治本——判据从散文口径变为「码 → 唯一触发条件 → 唯一 path」；副作用——36 码易互相重叠（S6 刚暴露「判据互斥」三类失败），故本文 §8 给**优先级表 + 同 path 至多一码不变量**，由 V-3 机械守；跨问题——F-03 的 `OVERRIDABLE_FIELDS` 与 S2 `render.mjs:39` 的硬编码字段表不一致（前者按 PRD 含 `kind`），本文只定正确集合、不修 S2（§11-1）；跨文件——PRD **四处**词表路径（`:202` / `:239` / `:270` / `:274`）必须与本 spec 同批改，否则文档指向不存在的文件。

## 2 不做什么

1. **不渲染**：不产出任何卡面 / README / dump 文本，`agents/*.md` **一字不动**（F-09～F-12 归 S4）。
2. **不碰 S6 定义层**：`tools/docgen/policy/**` 零改动；`card-model/**` 不得 import `policy/**`，`policy/**` 也不得反向 import（V-6 双向守卫）。
3. **不改 S2 交付**：`tools/observation-check/**` 零改动（含 `render.mjs` 的合并实现、`checks.mjs` 的结构校验、`registered-ids.mjs`）。
4. **不填内容**：15 席的场景 / 动作 / 检查项文案不在本段写（S4 的 F-11 全席重生成）。
5. **不接门禁**：`scripts/check-all.mjs` 不加段（F-17～F-19 归 S3）；15 卡豁免窗口（F-24 / C-08）不在此触发。
6. **`WeakReason` 不写成语义猜测**：它是 `check:'manual'` 条目，不进脚本码表（PRD §3.6 `:216` 明写），本 spec §7 只登记不实现。

## 3 目录与依赖方向（落点）

```
tools/docgen/card-model/
├─ enums.mjs               封闭枚举 8 张表 + ID 谓词 + 文本扫描常量（唯一写死处）
├─ landings.mjs            LANDING_VARS（封闭 2 项）+ resolveLanding()
├─ scenes.mjs              SHARED_SCENES（8）+ SEAT_SCENES（席局部注册表）+ 场景三码对账
├─ signals.mjs             SEAT_SIGNALS（席局部信号登记表，本轮空集）+ 信号两码对账
├─ subjects.mjs            SUBJECTS + SUBJECT_VALIDATORS + subjectMatches() / verdictAllowed() / compareVerdicts()
├─ open-items.mjs          SCOPES（5）+ deriveScope() + validateOpenItems()
├─ expression.mjs          ALLOWED_OPS + isJsonLogic() + operatorDepth() + scanCriterionText()
├─ merge.mjs               OVERRIDABLE_FIELDS + mergeActions()（3 个合并码）
├─ vocab/subjective-terms.mjs    主观词表（数组物料）
├─ vocab/criterion-terms.mjs     未定义判据词表（数组物料，起步 6 词）
├─ validateCardModel.mjs   唯一发射点：码表常量 `CARD_MODEL_CODES`（36 个脚本码）+ **四个入口**（§6）；合并另走 `mergeActions`
└─ index.mjs               对外出口（8 张枚举 + `SUBJECTS` / `SUBJECT_VALIDATORS` + **四个入口** + `CARD_MODEL_CODES` + `SCAN_FIELDS` + `mergeActions` + `registeredIdsOf`）
```

- **测试落点**：`tools/docgen/test/card-model.test.mjs`（③ 段产出；② 段只定落点，不写用例）。
- **依赖方向（单向、可机械判）**：`card-model/**` → 只依赖 node 标准库与自身；**禁止** import `tools/docgen/policy/**`、`tools/docgen/components/**`、`tools/observation-check/**`。反向零 import。
- **词表形态**：`.mjs` 导出数组，与 S6 `policy/definitions/*.mjs`「定义层 = 唯一写字符串的模块」同形；不用 `.json`（Node 的 JSON 模块需 import 属性，且 `node --check` 与 CLI 侧形态不统一）。

## 4 数据形状（F-01～F-08 的落地载体）

```js
Card = {
  seat, name, description, tools,          // seat = 席 slug；后三字段 = 卡面 front matter（S4 渲染）
  duty: { trigger, categories: [string], action, constraint },
  scenes: [{ id, label?, why? }],          // 本席声明的场景；共用 id 的 label/why 可省（取 SHARED_SCENES）
  signals: [{ type, observer, match, declarer? }],
  must: [Action], never: [Action],
  categories: [{ key, label }],
  checkItems: [CheckItem],
  rationale,                               // 散文只进 README（PRD §3.7 `:223-224`），必填
}
Action = { id, kind: 'must' | 'never',
           trigger: { scene, moment, repeat },      // 三键齐
           objects: [string], criterion, landing,
           requires: [{ id, kind: 'artifact' | 'fact', must: boolean }],
           reason?, params?, expr? }
CheckItem = { id, subject, label, criterion, check: 'script' | 'ai' | 'manual',
              cmd?, impl?, expr?, params?, definitions?, rubric?, audit?, declarer? }
OpenItem  = { category, object, evidence, impact, suggestion, scope }
// 产物侧形状（只供 validateOpenItems / compareVerdicts 两个入口，不属卡片数据）
ObservationDoc = { items: [{ id, objectType?, verdict: 'hit' | 'miss' | 'na', evidence?, reason? }],
                   open: [OpenItem], openEmptyReason? }
```

| 形状项 | 判据 | 出处 |
|---|---|---|
| `scene` 条目 | `{ id, label, why }`；共用 id 可省 label/why，局部 id 必须交两字段 | PRD `:259` |
| `trigger` 三键 | `scene` / `moment` / `repeat` 齐，取值命中 §5 封闭枚举 | PRD `:260` |
| 动作条目 | 六字段齐（`id` / `kind` / `trigger` / `objects` / `criterion` / `landing`），`requires` 可为空数组 | PRD `:261` |
| `landing` 变量 | 只许登记在 `LANDING_VARS`（§5）；新增须同批改 PRD `:264` 与本 spec §5 | PRD C-13 `:126` / `:264` |
| `checkItem.check` | 三值之一；`ai` 必带 rubric + audit，`manual` 必带 declarer | PRD §3.4 `:194-204` |
| `openItem` | 五列齐（`category` / `object` / `evidence` / `impact` / `suggestion`）+ 派生 `scope` | PRD `:253` |
| `evidence` | `path:line` 或命令输出首行（字符串）；**本段不判其可解析性**（证据七道归 S2 §4.3） | PRD `:253` |
| `registeredIds` | 由 `registeredIdsOf(cards)` 派生 = 入参全部卡的 `checkItems[].id` 并集；**不再手写常量** | PRD `:310` |

**形状不做的三件事**：① 不校验 `name` / `description` 的措辞（S4 渲染与 F-09 零散文在渲染侧判）；② 不校验 `tools` 的权限语义（S6 的 `capabilities` 轴）；③ 不校验 `evidence` 的行内容（S2 证据七道）。

### 4.1 两个 `criterion` 的形态（防同名不同义）

| 字段 | 形态 | 判据 | 相关码 |
|---|---|---|---|
| `Action.criterion` | **谓词 id**（如 `ledger.reflectRow.exists`） | 须 ∈ `env.predicates`；缺字段或未登记 → `MissingCriterionImpl` | `MissingCriterionImpl` / `UnboundLanding` 同条 |
| `CheckItem.criterion` | **判据文字**（可含词表词、数字阈值、表达式） | 词表 / 阈值 / 表达式三类扫描都在这个文本上做；脚本入口看 `cmd` / `impl` | `InlineTermList` / `InlineThreshold` / `AmbiguousCriterion` / `FalseScriptCheck` |

### 4.2 文本扫描面 `SCAN_FIELDS`（八个文本类码的唯一判定面；**键 = 码名，值 = 字段引用数组**）

| 码 | 扫哪些字段 | 不扫 |
|---|---|---|
| `SubjectiveLabel` | `categories[].label`、`checkItems[].label`、`checkItems[].criterion` | 其它 |
| `InlineTermList` / `InlineThreshold` / `AmbiguousCriterion` | **仅** `checkItems[].criterion` | `Action.criterion`（它是谓词 id，不是文本） |
| `PointerToElsewhere` / `HardcodedCount` | 卡文本面 = `duty.trigger` / `duty.categories[]` / `duty.action` / `duty.constraint` / `Action.objects[]` / `CheckItem.label` | `description`（只写触发条件）、`scenes[].why`、`rationale` |
| `MixedTermInCard` / `ProceduralWordOutsideParliament` | 卡文本面 **∪** `rationale` | `description`、`scenes[].why` |

- 判「卡文本面」时**不含** `rationale`：`rationale` 是散文的合法落点（PRD §3.7 `:223-224`），混称与程序词却是**卡级**违规（同一张卡就是同一席），故专列「∪ `rationale`」两码。
- `scenes[].why` 只判「在不在」（`MissingSceneRationale`），不做词表扫描。
- **形态写死**：`SCAN_FIELDS` 是对象，**键 = 上表 8 个码名**（逐码一项，值 = 该码要扫的字段引用数组）；不按「扫描面相同」合并成 4 组键（合并会让「哪几个码共用一面」这件事只能靠读源码）。
- **最小合法卡 / 最小产物文档样例**见 testcase §0.3 的 `baseCard()` / `baseDoc()`（本 spec 不内联样例，避免两处维护）。

## 5 封闭枚举（8 张表，无一开放口）

| 表 | 取值（id:label） | 数量 |
|---|---|---|
| `SHARED_SCENES` | `session:会话` / `parliament.round:议会轮` / `issue.card:问题卡` / `defense:答辩` / `deliverable:交付物` / `command:命令` / `handoff:交接` / `criterion:判据口径` | 8 |
| `MOMENTS` | `start:开始` / `end:结束` / `before:之前` / `after:之后` / `during:发生时` / `on-fail:失败时` / `on-receive:收到时` / `on-change:变更时` | 8 |
| `REPEATS` | `once` / `per-round` / `per-item` / `per-change` | 4 |
| `SIGNALS` | `event.arrive:事件到达` / `artifact.appear:产物出现` / `state.transition:状态转换` / `command.return:命令返回` / `diff.hit:差异命中` | 5 |
| `VERDICTS` | `hit` / `miss` / `na` | 3 |
| `CHECK_KINDS` | `script` / `ai` / `manual` | 3 |
| `SCOPES` | `card` / `code` / `doc` / `process` / `repo` | 5 |
| `LANDING_VARS` | `review.dir` / `round.no` | 2 |

- **扩展规则**：任一张表新增取值，须**同批**改 PRD §3.8 对应行（`:249-264`）与本表；本 spec 不含「等」「其他」这类开放集，故 `FreeTextEnum` 与「表外取值」二者判据互斥（§8）。
- **两张席局部登记表**（`SEAT_SCENES` / `SEAT_SIGNALS`）：键 = 席 slug，值 = 该席局部 id 数组；**本轮两表为空集**，内容由 S4 填。它们不是开放口——`UnknownSignalType` 只认「全局 5 类 ∪ 本席登记」，跨席借用即 `ScenePromotionRequired` / `SignalProliferation`。
- **id 谓词**（全部表共用）：`^[a-z][a-z0-9.:-]*$`（与 S6 spec §3.4 的 ID 谓词同形）。
- **`SUBJECTS` 是登记表、不是第 9 张封闭枚举**：`SUBJECTS = { '<subject>': { display, validator } }`（迁移起点 = PRD `:293` 的两项 `reviewer-detective.card` / `artifact.observation`，S4 扩到 15 席）；`SUBJECT_VALIDATORS = SUBJECTS` 的 `validator` 投影（供 `UnverifiableOutput` 判「有没有校验器」）。**从 `index.mjs` 导出**（消费面 = `env.subjects` 的构造方与测试）。
- **`deriveScope(object)`（顺序敏感，最长前缀优先）**：先 `object.replace(/\\/g,'/')` 归一，再按**以下清单自上而下**取首个命中的前缀 —— `docs/superpowers/reviews/`→`process`；`.session/`→`process`；`agents/`→`card`；`tools/`、`scripts/`→`code`；`docs/`→`doc`；其余→`repo`。
  - **为什么必须是最长前缀**：`docs/superpowers/reviews/x/progress.md` 的「首段」永远是 `docs`，按首段一次判定会判成 `doc`，与 `process` 那条相反。映射表写死在 `open-items.mjs`，不读配置。

## 6 校验器接口与纯性

```js
validateCardModel(card, env)                    → { ok, errors: [{ code, path, message }] }   // 卡级 + 场景 + 信号 + 动作 + 检查项
validateOpenItems(doc, env, cards)              → { ok, errors }                              // 开放项三码（读 doc.open / doc.openEmptyReason；cards 用于派生对账）
compareVerdicts(docA, docB, env)                → { ok, errors }                              // DisagreementOpen（双实例同 id verdict 不同）
verdictAllowed(subject, objectType, verdict)    → { ok, errors }                              // SubjectMismatch（同样返回 errors 形状，不是布尔）
mergeActions(shared, own)                       → { ok, errors }                              // 3 个合并码；**不属上述四个入口**（§6 末行）
env = { seat, sharedScenes, seatScenes, seatSignals, predicates, landings, subjects,
        registeredIds: Set, available: Set, unboundVars: Set, parliamentSeats: Set }
```

**码表常量**：`CARD_MODEL_CODES`（36 个脚本码，键 = 码名、值 = 该码的**判定面字段引用**（如 `must[].criterion` / `checkItems[].label`，**不写行号**，故 spec 改版不漂移））是唯一码表；**四个入口**（`validateCardModel` / `validateOpenItems` / `compareVerdicts` / `verdictAllowed`）的 `errors[].code` 必须 ∈ `CARD_MODEL_CODES`，`WeakReason` **不在其中**（V-5）。**`mergeActions()` 的 3 个合并码不在 `CARD_MODEL_CODES` 里、也不经上述四入口**——合并是独立调用，`validateCardModel` **不执行合并**。

| 约束 | 判据 |
|---|---|
| 纯函数 | 零 IO（不读文件、不跑命令）、零环境依赖（全部经 `env` 注入）、不改入参（V-4） |
| 异常纪律 | 任一判定内部抛异常 → 收敛为 `{ code: 'UnverifiableOutput', path, message: 异常首行 }`，**继续判后续条目**；不得冒泡中止（PRD §4.2 `:321` 的异常纪律同源） |
| 缺键纪律 | `env` 缺**任一**键 → 返回 `UnverifiableOutput`（`path = env.<键名>`）并**继续判**（不 fail-fast、不 `undefined` 兜底）；`card` / `doc` 非对象同此码 |
| registeredIds 单源 | `env.registeredIds` 必须由调用方以 `registeredIdsOf(本轮全部卡)` 构造；四入口**不自行派生、不回退常量**；若 `env.registeredIds` ≠ `registeredIdsOf(cards)` → `validateOpenItems` 返回 `UnverifiableOutput`（`path = env.registeredIds`） |
| 非卡片字段 | `Card` 上出现本 spec 未列的字段 → **忽略不判**（open-world）；只判列出的字段 |
| 顺序稳定 | `errors` 顺序固定：卡级 → `scenes` → `signals` → `must`/`never`（数组序）→ `checkItems`；同 path 内按 §8 优先级 |
| path 形态 | 定位串形如 `must[0].trigger` / `checkItems[2].audit` / `open[0].scope`；**同一次返回内 path 唯一**（同 path 多码不得出现，§8） |
| 入口分工 | 卡片数据只走 `validateCardModel`；开放项走 `validateOpenItems`；双实例 verdict 走 `compareVerdicts`；单条三态走 `verdictAllowed`；合并走 `mergeActions`。**产物侧结构校验归 S2 `checks.mjs`**（§11-2） |
| 退出码映射 | 不加新 CLI 子命令；`exitCodeFor` 的封闭映射表**不动**（本段不接 CLI） |

## 7 错误码判据表（36 个脚本码 + 1 个 manual）

> 每行 = 一个码的**唯一**触发条件。判定面一栏写「判什么对象」；「判据」一栏可直接照抄成断言。
> **码数口径**：36 个脚本码 = PRD §4.4 B 表 S1 组的 **35 个脚本码**（36 个名字里 `WeakReason` 是 manual）+ **`MissingCriterionImpl` 1 个**（PRD 把它列在 A 表「渲染·合并」，但 §3.8 `:261` 又把它判在动作条目上，故本段复用并收口其语义，见 §10-D4）；另有 3 个合并码（表末）算 **A 表复用**、不计入 36。

| 族 | 码 | 判定面 | 判据（一句，可机械判） |
|---|---|---|---|
| 场景 | `DuplicateScene` | `scenes` | 同 id 在 `card.scenes` 出现 2 次；**或** 同 id 已在 `SHARED_SCENES` 又出现在 `SEAT_SCENES[seat]` |
| 场景 | `ScenePromotionRequired` | `SEAT_SCENES` | 同一席局部 scene id 出现在 ≥2 个席的登记表（被第 2 席引用须上移） |
| 场景 | `UnusedScene` | `scenes` | `card.scenes` 中某 id 未被任何 `Action.trigger.scene` 引用；**共用 8 个未声明者不判** |
| 场景 | `MissingSceneRationale` | `scenes` | 非共用 id 的条目缺 `why` 或 `why` 去空白后为空 |
| 场景 | `FreeTextEnum` | 枚举字段 | `scene.id` / `trigger.moment` / `trigger.repeat` / `signals[].type` / `check` / `verdict` 的取值含 `/`（半角或全角） |
| 信号 | `MissingSignal` | `trigger` / `signals` | `trigger` 缺 `scene`/`moment`/`repeat` 任一键；**或** 信号条目缺 `observer`/`match`（path 区分两处） |
| 信号 | `UnknownSignalType` | `signals` | `type` ∉ `SIGNALS` 且 ∉ `SEAT_SIGNALS[seat]` |
| 信号 | `UnobservableSignal` | `checkItems` | `check === 'manual'` 且 `declarer` 缺或去空白为空 |
| 信号 | `SignalProliferation` | `signals` | `type` 属席局部登记（∉ `SIGNALS`）且引用它的 `scene` 数 < 2（为单个场景新造类别） |
| 信号 | `MultiMomentInOneEntry` | `trigger` | `moment` 为数组且长度 > 1；**或** 字符串同时命中 ≥2 个 `MOMENTS` 成员（id 或 label） |
| 动作 | `VagueReferent` | `Action` | `objects` 缺/空；**或** 任一项 ∈ `VAGUE_TERMS`（该内容 / 上述 / 相关 / 前述 / 该项） |
| 动作 | `MissingPrerequisite` | `Action` | `requires` 中 `must:true` 的 id ∉ `env.available`；报文固定「缺 `<id>`，未开始」 |
| 动作 | `UnboundLanding` | `Action` | `landing` 缺；**或** 按**最长已登记前缀**匹配（登记集 = `landings` ∪ `LANDING_VARS`，允许 `<登记值>/<子段>` 形态，子段按 `/` 逐段判、任一段 ∈ `env.unboundVars` 即红）后无命中；**或** 命中的**登记值本身** ∈ `env.unboundVars`（变量未赋值；`landing = 'review.dir'` 这一形态） |
| 动作 | `MissingCriterionImpl` | `Action.criterion` / `CheckItem.criterion` | `Action`：字段缺/空 **或** id ∉ `env.predicates`（动作没有 `check` 字段 → 无 `manual` 豁免）；`CheckItem`：`criterion` 缺/空（`check:'manual'` 豁免）。两处 path 不同（`must[i].criterion` / `checkItems[i].criterion`），**各报一次、互不抑制** |
| 动作 | `FalseScriptCheck` | `CheckItem` | `check === 'script'` 且 `cmd` 与 `impl` 均缺 |
| 检查项 | `MissingSubject` | `CheckItem` | `subject` 缺/空；**或** `label` 不含 `SUBJECTS[subject].display`。**`subject` ∉ `SUBJECTS` → 只报 `UnverifiableOutput`**（§8 组 8），本码不再判 |
| 检查项 | `DuplicateCheckItem` | `checkItems` | 同 `subject + criterion` 组合出现 2 次 |
| 检查项 | `CrossSubjectSharedItem` | `checkItems` | 同一 `id` 被 2 个不同 `subject` 引用 |
| 检查项 | `SubjectiveLabel` | `checkItems` / `categories` | `label` 或 `criterion` 按 `、`/`，`/`/`/空格 切分后有整项 ∈ `subjective-terms` |
| 检查项 | `HardcodedCount` | 卡文本面（§4.2） | 命中 `HARDCODED_COUNT`：`共\s*N\s*[条项个]` / `缺一[条项]` / `全部[命中]*`；`N` 的字符面 = 半角 + 全角 + 汉字数字（数量必须由数据派生） |
| 检查项 | `PointerToElsewhere` | 卡面文本 | 命中 `见` / `详见` / `参见` / `参考` / `按 §`（散文只进 `rationale`） |
| 检查项 | `MixedTermInCard` | 卡级 | 全卡同时出现「议长」与「主持人」 |
| 检查项 | `ProceduralWordOutsideParliament` | 卡级 | 席 ∉ `env.parliamentSeats` 且文本命中 收卡 / 丢卡 / 压卡 / 点名 / 判结束 |
| 表达式 | `UnreadableExpression` | `expr` | 出现 `&&` 或 `||` 串；**或** 对象节点键数 ≠ 1；**或** 键 ∉ `ALLOWED_OPS`（JSON Logic 算子集） |
| 表达式 | `NestingTooDeep` | `expr` | `operatorDepth(expr) > 1`（算子嵌算子；单层合法） |
| 表达式 | `InlineTermList` | `criterion` 文本 | 命中 `criterion-terms` 的**不同**词 ≥ 3（词表未进数组物料） |
| 表达式 | `InlineThreshold` | `criterion` 文本 | 命中 `\d+\s*(次\|条\|字\|个\|轮\|处\|%)`（全角/汉字数字同 §7 `HardcodedCount` 口径）且 `params` 无对应键；**单位→键映射写死**：次→`times` / 条→`count` / 字→`chars` / 个→`items` / 轮→`rounds` / 处→`spots` / %→`percent`，映射外单位一律红 |
| 表达式 | `AmbiguousCriterion` | `criterion` | 命中 `criterion-terms` 的 1–2 个词且无 `definitions` |
| 表达式 | `MissingAiAudit` | `CheckItem` | `check === 'ai'` 且（rubric 的 positive/negative/boundary 任一组 < 1 条，或 rubric 任一条无 `path:line`，或 `audit.sample` / `audit.command` 缺）。**rubric 缺 `source` 归本码**（PRD `:262` 的 `AmbiguousCriterion` 在此收口，见 §10-D16） |
| 开放项 | `EmptyOpenWithoutReason` | `open` | `open` 为空数组且 `openEmptyReason` 缺或去空白为空 |
| 开放项 | `OutOfScopeOpenItem` | `open` | 条目 `scope` ≠ `deriveScope(object)`（§5 映射表） |
| 开放项 | `DuplicateAsOpen` | `open` | `object` 与任一 `registeredIds` 成员逐字相等（固定项重复登记为开放项） |
| 三态 | `SubjectMismatch` | 产物条目 | `objectType` ≠ `subject` 且 `verdict ∈ {hit, miss}`（`verdictAllowed()` 返回红；`na` 允许） |
| 审计 | `MissingRationale` | 卡级 | `rationale` 缺或去空白为空 |
| 审计 | `DisagreementOpen` | 双实例产物 | 同 `id` 在 A / B 两份的 `verdict` 不同（不取多数、不任一方改判，落一条开放项） |
| 审计 | `UnverifiableOutput` | 卡级 / 异常 | `subject` ∉ `SUBJECT_VALIDATORS`；**或** 判定内部异常收敛（§6 异常纪律） |
| manual | `WeakReason` | 开放项 | **不实现**：由人工按 §3.6 `:215-216` 抽查「理由未引用固定项 id 或文档事实」；本 spec 要求它**不出现**在脚本码表（V-5） |

**合并族（3 码，A 表已实现，S1 只定字段集合）**：`DuplicateStatement`（同层同 id）/ `OverrideWithoutReason`（跨层覆盖无 reason）/ `PointlessOverride`（覆盖后零差异）——判据由 `mergeActions()` 发出，`changed` 覆盖 `OVERRIDABLE_FIELDS = ['kind','trigger','objects','criterion','landing','requires']`（PRD §3.3 `:187` 要求含 `kind`；S2 `render.mjs:39` 的旧表缺 `kind` 与 `objects`，登记 §11-1，本段不修）。

**开放项缺列（`MissingOpenField`）不归本段**：它是 A 表已实现码（S2 `tools/observation-check/checks.mjs:111-113` 判五列齐与 `evidence`），S1 的 `validateOpenItems` **只判三码**（`EmptyOpenWithoutReason` / `OutOfScopeOpenItem` / `DuplicateAsOpen`），不复判缺列——两段分工见 §11-2。

**码 → 入口对照（族级，构造方按此选入口）**

| 族 | 入口 |
|---|---|
| 场景 / 信号 / 动作 / 检查项 / 表达式 | `validateCardModel` |
| 开放项三码 | `validateOpenItems` |
| `SubjectMismatch` | `verdictAllowed` |
| `DisagreementOpen` | `compareVerdicts` |
| 合并 3 码 | `mergeActions`（**不入** `CARD_MODEL_CODES`） |
| `FreeTextEnum`（`verdict` 面） | `verdictAllowed` / `compareVerdicts`（卡片数据里没有 `verdict`） |
| `UnverifiableOutput` | 五个函数均可发（缺键 / 异常收敛 / `subject` 未登记） |

## 8 判据互斥与优先级（防「两个码判同一件事」）

**不变量 M1**：一次入口返回内，**同一 `path` 只出现一个码**。
**不变量 M2**：下表每一组内的码按「从上到下先命中先报」，命中即停；**M2 只管同一 `path`**——不同 path 的码互不影响（见本节末）。
**M2 的 `path` 粒度**：同组内多个码落在**同一判定面**（= §7「判定面」列，如 `scenes` / `trigger` / `checkItems[].criterion`）时按组序抑制；`errors[].path` 仍按 §6 输出带下标的定位串（例：组「场景」三码同判定面 `scenes` → 只报 `DuplicateScene`，其余两码被抑制）。

| 组 | 顺序（先 → 后） | 理由 |
|---|---|---|
| 1 | `FreeTextEnum` → `UnknownSignalType` | 含 `/` 是多条件串，先于「不在表内」 |
| 2 | `MissingSignal` → `MultiMomentInOneEntry` | 三键缺时无从判「多时刻」 |
| 3 | `SubjectiveLabel` → `InlineTermList` → `InlineThreshold` → `AmbiguousCriterion` | 四个码都读同一段判据文字：主观词 → 并列词数 → 数字阈值 → 单词无定义 |
| 4 | `UnreadableExpression` → `NestingTooDeep` | 先判「是不是 JSON Logic」（不通过则深度无从算），通过才判算子深度 |
| 5 | `DuplicateScene` → `MissingSceneRationale` → `UnusedScene` | 先判「能否成为合法条目」，再判「有无理由」，最后判「有无引用」 |
| 6 | `UnknownSignalType` → `SignalProliferation` | 「不在任何表」优先于「局部新造」；**两码定义互斥**（前者 ∉ 席局部表、后者 ∈ 席局部表），本组防的是「不读 `SEAT_SIGNALS`」的误实现 |
| 7 | `DuplicateAsOpen` → `OutOfScopeOpenItem` → `EmptyOpenWithoutReason` | 前者判「本不该是开放项」，再判 scope，最后判空集理由 |
| 8 | `UnverifiableOutput` → `MissingSubject` → `SubjectiveLabel` | 先判「这个 subject 有没有校验器」，再判「label 是否由 subject 派生」，最后判「label 是否主观词」 |

**不同 path 的码可同次返回多头**，属正常多问题（例：`must[0].criterion` 未登记 + `checkItems[0].criterion` 缺 `cmd` → `MissingCriterionImpl` 与 `FalseScriptCheck` **两码共存**，两 path 不同）。这两个码**不设组**：它们分属 `Action` 与 `CheckItem` 两个实体，永远不会落在同一 path 上。

**`FreeTextEnum` 的 `verdict` 面**：卡片数据里没有 `verdict` 字段（它只在产物侧），故该面只由 `verdictAllowed()` / `compareVerdicts()` 两处判（§7 入口对照）。

## 9 验收（V-1～V-8）

| # | 验收项 | 可核方式 |
|---|---|---|
| V-1 | 8 张枚举表数量与 §5 逐项相等，**且无「等 / 其他」条目** | 数量：`Object.keys(...).length` = 8/8/4/5/3/3/5/2；「无开放口」：内容集合逐项等于期望集合，塞一条「其他 / 等」即红（testcase A02 承载） |
| V-2 | 36 个脚本码各有一条最小红点（每码一次、只报该码） | 表驱动用例：每行构造 + 断言 `errors.map(e=>e.code)` 恰含该码；表行数 = `Object.keys(CARD_MODEL_CODES).length` |
| V-3 | 不变量 M1 / M2 成立 | 构造「同时可命中 2 码」的输入（如含 `/` 的非法 type），断言只返回先报那一个 |
| V-4 | 纯函数、异常不冒泡、入参不变 | 冻结入参后调用仍成功；注入抛异常的 `env.predicates` 取到 `UnverifiableOutput` 且其余条目仍被判定 |
| V-5 | `WeakReason` 不在脚本码表 | `Object.keys(CARD_MODEL_CODES)` 不含 `WeakReason`（负例：加进去即红） |
| V-6 | 与 S6 双向零耦合 | 静态扫描 `card-model/**` 无 `policy/` 引用；`policy/**` 无 `card-model` 引用 |
| V-7 | F-01～F-08 各有至少 1 条正向用例 | 覆盖总表按 F 编号建行，逐行指回 §4/§5/§7 |
| V-8 | `registeredIdsOf()` 集合 = 入参全卡 `checkItems[].id` 并集 | 两条卡（重叠 id）→ 并集去重；S2 的 `REGISTERED_IDS` **不改**（触发信号见 §11-3） |

## 10 与上游的差异清单（逐条带位置）

| # | 差异 | 位置 | 理由 |
|---|---|---|---|
| D1 | 落点新建 `tools/docgen/card-model/`，不并入 `policy/**` | PRD §8 `:516`（写 `tools/docgen/**`，已覆盖）＋ 用户 2026-10-29 裁定 A | 卡面内容轴与权限轴不同轴（PRD §3.8 全篇无权限/命令/路径/档位字段；S6 spec §3.1 `:36-46`） |
| D2 | `policy/subjective-terms.json` → `tools/docgen/card-model/vocab/subjective-terms.mjs` | PRD `:270` | 与 D1 同源；`.mjs` 与 S6 定义层同形（§3） |
| D3 | `policy/criterion-terms.json` → `tools/docgen/card-model/vocab/criterion-terms.mjs`；同族 `policy/*.json` → `card-model/vocab/*.mjs`；`policy/card-must-fields.json` → `card-model/vocab/card-must-fields.mjs`（S4 建，本段只改路径不建文件） | PRD `:202` / `:239` / `:274` | 同上；四处已同批改（判据与功能点零变化） |
| D4 | `MissingCriterionImpl` 两处语义（「缺 `criterion`」与「criterion id 未登记」）合并为一码两判定面 | PRD `:261` / `:278` | 原文两行判同一个码的不同成因，分开写会产出同码双义、testcase 无法唯一定位；合并后 path 相同、码唯一 |
| D5 | `UnusedScene` 只判「本席声明过」的场景 | PRD `:249` | 共用 8 个是全局词表：若把「未用」也判红，任何席都被迫声明全部 8 个，判据立刻恒红 |
| D6 | `SignalProliferation` 口径 = 局部 type 被 < 2 个场景引用 | PRD `:252` | 原文「为单个场景新造类别」不可机械判；改为引用计数后可判 |
| D7 | `SCOPES` 五值 + `deriveScope(object)` 映射表 | PRD `:253`（只写「派生 `scope`」，未给枚举） | 无枚举则 `OutOfScopeOpenItem` 无从判；沿用路径前缀派生，可复核 |
| D8 | 新增字段名 `openEmptyReason` / `declarer` | PRD `:215` / `:252` | 原文只说「须给可核理由」（§3.6 `:215`）「须写宣告者」（§3.8 `:252`），未命名；不命名则校验器无锚点 |
| D9 | `OVERRIDABLE_FIELDS` 含 `kind` 与 `objects` | PRD §3.3 `:187` | PRD 已明写「含 `kind`」；S2 `render.mjs:39` 的 `['trigger','text','criterion','landing']` 是已签实现侧的偏差，登记 §11-1，本段不修 |
| D10 | 15 卡散文迁移 / `agents/*.md` 改动**不在**本段 | F-11 归 S4（PRD `:516` 的 S1 行明写「不渲染」） | 用户 2026-10-29 确认；S1 只定义「该写什么」 |
| D11 | 新增 `SEAT_SIGNALS`（席局部信号登记表，空集）与入口拆分（`validateCardModel` / `validateOpenItems` / `compareVerdicts` / `verdictAllowed`，合并另走 `mergeActions`） | PRD `:252`（未给信号登记表）／`:253`（开放项无落点） | 无登记表则 `UnknownSignalType` 与 `SignalProliferation` 无对照面；开放项与双实例不属卡片数据，塞进同一入口会与 S2 结构校验重叠（§11-2） |
| D12 | `CARD_MODEL_CODES` 成为唯一码表常量 | PRD `:361`（只有名字、无载体） | 无常量则「`WeakReason` 不在码表」不可判（V-5） |
| D13 | 两个 `criterion` 分形（`Action.criterion` = 谓词 id / `CheckItem.criterion` = 判据文字）+ 新增 `SCAN_FIELDS` 扫描面表 | PRD `:261`（动作条目）与 `:236`（本席清单「`criterion` 文字」） | 原文同一个字段名在动作与本席清单上语义不同；不分形则「词表/阈值扫描」与「谓词登记」判在同一串上，必出互斥 |
| D14 | 开放项缺列码留在 S2（`MissingOpenField` A 表），S1 只判三码 | PRD `:253` | 同码两段各判一半会双报；S2 的实现已签（`:349` 已补测），本段不复判 |
| D15 | `MissingCriterionImpl` 的 `manual` 豁免只对 `CheckItem` 生效（`Action` 无 `check` 字段）；`HardcodedCount` 的数字面含全角与汉字数字 | PRD `:278` / `:211` | 前者：把豁免挂在 `Action` 上会造出「永不成立的判据」（`Action` 没有 `check`）；后者：`\d` 漏检「共３条 / 共三条」，判据会假绿 |
| D16 | `rubric` 缺 `source` / `path:line` 归 `MissingAiAudit`（不归 `AmbiguousCriterion`） | PRD `:262`（与 `:194` 的并列写法冲突） | PRD 两行给同一形态两个码；`AmbiguousCriterion` 在 §4.1/§4.2 只判 `criterion` 文本词表，**不抬头扫 rubric 结构**——收口到审计面，避免同形态双码 |
| D17 | `deriveScope` 改**顺序敏感最长前缀** | PRD `:253`（未给算法） | 「首个路径段」与表内 `docs/superpowers/reviews/` 两段前缀互斥：按首段会判 `doc`，与规定的 `process` 相反 |
| D18 | `UnboundLanding` 改**最长已登记前缀**匹配 | PRD `:255` / `:264` | 登记值本身就是多点串（`deliverable.body`），按「首段」判会把合法值全判红 |
| D19 | `mergeActions()` 与四入口分离；`validateCardModel` **不执行合并** | PRD `:187`（未说合并何时跑） | 合并 3 码不在 36 码表内；若 `validateCardModel` 跑合并，就违「`code ∈ CARD_MODEL_CODES`」——两条规定只能留一条 |
| D20 | **M2 的 `path` 粒度 = 判定面**（`scenes` / `trigger` / `checkItems[].criterion` 等）；`errors[].path` 仍是带下标的定位串 | 本 spec §8 自身（v5 的 M2 与组表互斥） | 按「完整定位串」判，组 5 / 组 8 的「先报先停」永远不生效（三码各落不同下标），组表变装饰且 testcase C01 必红 |
| D21 | `UnboundLanding` 第三档覆盖两形态：**变量本身未赋值** 与 **子段未赋值**；`CARD_MODEL_CODES` 的值 = **判定面字段引用（不写行号）** | 本 spec §7 `:180` / §6 `:147` | 只判子段会让 `landing = 'review.dir'`（`LANDING_VARS` 存在的理由）判绿；值写行号则 spec 每改版全表漂移（v3→v5 已漂 5 次） |
| D22 | PRD `:199` 的 `evidenceRequired: true` **本段不判**（归 S4 渲染与门禁） | PRD `:199`（`check:'ai'` 的配套三样之一） | `check:'ai'` 的失败面已由 `MissingAiAudit` 判 rubric（三组边界 + `path:line`）与 `audit`（`sample`/`command`）；`evidenceRequired` 是无失败面的布尔常量（恒 true），判它只能造出恒绿断言 |

## 11 已登记副本与触发信号

| # | 副本 | 现状 | 收敛触发信号 |
|---|---|---|---|
| 11-1 | 合并实现两份：S2 `tools/observation-check/render.mjs:29-46`（`personalActions`，硬编码字段表且缺 `kind`/`objects`）与本 spec `merge.mjs` | S2 是演示数据模型（`data.mjs` 的 `SHARED_ACTIONS`），不进卡面管线 | S4 首次重生成（卡面管线接管时删 S2 副本）或 S2 被修订 |
| 11-2 | 三态/开放项结构校验：S2 `checks.mjs` 判结构（字段齐 / 三态值合法 / `reason`），S1 判语义（`subject` 匹配 / scope 派生 / 重复固定项） | 两段不重叠，S2 不 import S1 | S3 接门禁时若发现两段重叠即收敛 |
| 11-3 | `registeredIds` 单源：S2 `registered-ids.mjs` 是手写常量（注释已写「S1 落地后切换」） | S1 交付 `registeredIdsOf()`；S2 文件不改 | S4 首次重生成（切换到派生，断言集合相等后删常量文件） |
| 11-4 | 无第四份副本 | 已核：`card-model/**` 与 `tools/docgen/policy/**` 零字节交集（V-6 双向守卫） | 不需要 |

## 12 风险与已知边界

| # | 风险 | 处置 |
|---|---|---|
| R1 | 36 码互相重叠（S6 刚暴露的「判据互斥」形态） | §8 优先级表（8 组带序号，且 M2 粒度 = 判定面）+ M1 不变量 + V-3 机械守 |
| R2 | 测试「恒真」（S6 审计 §3-④ 的 K07 形态：空集合上 `every` 恒真） | 交付给 sdet 的硬要求：每条先断前置非空（§9 V-2 的「每码一次」） |
| R3 | 语义判断被错列成脚本码 | `WeakReason` 标 manual（§7 末行 + V-5） |
| R4 | 本段不接门禁，故校验器**当前无人调用**（与 S2 早期同形态） | 登记于 §11；真实收益要等 S3/S4 接线，不在本段宣称 |
| R5 | PRD **四处**词表路径勘误若不同批改 | §10-D2/D3 要求同批（四处已在 PRD 落地）；改完 `npm run check` 与 `node scripts/scope-sweep.mjs --check --impact <当次清单>` 必须绿 |
| R6 | 码表值若改回「写行号」，spec 每改版全表漂移 | §6 `:147` 已写死「值 = 判定面字段引用、不写行号」（§10-D21）；改回行号即违此条 |
