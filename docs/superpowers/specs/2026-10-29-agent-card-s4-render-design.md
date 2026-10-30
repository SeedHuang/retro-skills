# agent-card S4 渲染层（F-09～F-12、F-23）设计：一份数据 → 三投影 + 全席重生成

> 状态：**内容已定稿，待议会 #2 签字**｜创建：2026-10-29
> 版本增量：**v2** = 独立 sdet 首轮复核 6 条 P1 + 1 条事实勘误（① `overrides[]` 只带 `{id, changed}`，`reason` 来源写死；② `state.json` 实测 15 席**已全 `replaced`** → F-23 的卡面手改红**已生效**，本段只新增 README 面与完整性断言；③ 试点席 `detective-observer` 是唯一「议长 + 主持人」混用卡，迁移必须消混用不得原样搬；④ 4 个 `vocab/` 表的导出名与键形写死；⑤ 写盘入口点名 `generate` / `dump` + `writeAll()`；⑥ 旧模板扫描面收窄为「`templates/` 目录 + 代码引用」，且卡面 `sourceLine` 不得含模板文件名；⑦ D6 证据②措辞勘误：`CHECK_ITEMS` 有 2 处命中但均为注释、无 `export` 载体）。**v3** = 第二轮复核 1 条 P1（零散文探针词表未写死 → §3 增 `PROSE_PROBES` 导出、§5.1 增「零散文探针」行：旧段名五词 ∪ 声明句式 ∪ 指针词，单源同表）。**v4** = 议会 #2 第 1 轮 4 席（P0 5 / P1 **15**）逐条处置：`Card` 由 9 键改回 **S1 全量 12 键**（§4）、写盘**不改授权链**（`generate` 只比不写，落盘只经 `draft`/`replace`/`generate --readme --apply`，§3）、逐席滚动下**单席原子**替代「15 席全量才写」（§7-①）、`EXIT` 表承接 S1 码（D12）、A1/A2 判定面迁移（D11）、指针词按 S1 **同形判定**（非裸子串，§5.1）、`§` 引用纠偏（§1 的 §10→§9、§11-D2→§10-D2）、V-4 改按 `PROSE_PROBES`、V-7 明确 `never` 不判 landing、§7-⑤「首行」改「输出中含该行」、补探索稿路径
> 功能点：**F-09～F-12、F-23**（`docs/prd/20261026205821-agent-card-contract.md` §6 `:473-476` / `:487`）；交付份 **S4**（同文 §8 `:519`，执行顺序 S2 → S3 → S1 → S4 的最后一格 `:521`）
> 上级规范：同文 §3.7 `:219-241`（三投影 + 卡面契约 + 数据源落点 C-11 `:124`）；S1 spec `docs/superpowers/specs/2026-10-29-agent-card-s1-card-model-design.md`（形状与校验器，**只消费、不改判据**）
> 探索稿（本文引用 `§12.6` / `§12.9` 的载体）：`docs/after/20261026164718-agent-card-composition-exploration.md`（`§12.6` 在 `:419-428`、`§12.9` 在 `:459-475`）
> 测试用例文件：`2026-10-29-agent-card-s4-render-design-testcase.md`（同批、同目录，由独立 `senior-sdet` 在全新上下文编写；本 spec 不内联用例）
> 规模：spec ≤350 行 / testcase ≤70 条（`TC_MAX 80` 留余量）/ 议会 ≤3 轮
> 落点决策（用户 2026-10-29 两次裁定）：① 卡面 = PRD 6 段 **+ 第 7 段「输出格式」**（保住执行力度矩阵 A3–A7 四结构项，**不触发 A3–A7 改判**；A1/A2 的锚点段另见 §10-D11）；② README 落 **`docs/agents/`**（每席一份 + 自动 index）

## 1 全貌

| 维度 | 内容 |
|---|---|
| 本质 | 把「15 张散文卡」换成**一份数据渲染出的三种视图**：同一份合并后卡片数据 → 卡面（AI 读）/ README（人读）/ dump（开发读），任一手改或反写即红 |
| 同族 | S1 `tools/docgen/card-model/**`（形状 + 36 码校验器，本段只调用）；S2 `tools/observation-check/**`（产物侧，本段零改动）；S6 `tools/docgen/policy/**`（档位 / 权限，`tools` 字段来源）；执行力度矩阵 A/B/C 15 项（`tools/execution-matrix/criteria.md`，本段**不改判据**） |
| 边界 | **不改** `card-model/**` 的任何码与判据（只增 `vocab/` 登记数据与 `subjects.mjs` 登记项，S1 §5 `:131` 已预登记「S4 扩到 15 席」）；**不改** `tools/observation-check/**` 的判据；**不动** `tools/docgen/policy/**`（S6 已签）；不写议会流程产物 |
| 验收 | V-1～V-8（§9）；核心三条：**三投影同源（改一处全同步）**、**零散文 + 每行判据 id 与落点**、**手改任一份生成物即红** |
| 影响面 | 新增 3 个渲染/装配模块（`cardPipeline` / `renderCard` / `renderReadme`）+ 1 个模板 + 4 个 `vocab/` 登记表 + `docs/agents/**`（**16 个生成物** = 15 席 README + 1 index；**gate 比对面 = 31 份** = 15 卡 + 16 生成物，两数口径不同）；改 `agentData.mjs`（15 席扩 Card 字段）、`validateAgentData.mjs`（键白名单 + `EXIT` 表增 S1 码分组）、`cli.mjs`（`generate` 换渲染器 + 新增 `dump` + `generate --readme --apply`）、`subjects.mjs`（登记项）、`outputFormats.mjs`（结构化）、`patternRegistry.mjs`（§10-D3）、`execution-matrix/check-agent.mjs` 的 `touchedSemanticKeys`（§10-D11）；删 2 个旧模板与旧渲染分支；`agents/*.md` 15 张全部重生成；`docs/prd/…:293` 与 `:237` 同批两处 |
| 收益 | PRD §9.2 P-A「副本归零」与 P-B「每行可回指判据 id / 落点」从愿望变成可跑判据；C-08 的 15 卡豁免窗口在本段到期（事件型）+ F-23 的手改告警真正生效。不以「省工时」立论 |

**联动四问**：治本——重复的根因是「同一句写 15 遍」，故把共用句上移为**共享数据层**（`vocab/shared-actions.mjs`）+ S1 `mergeActions` 的 `overrides[]`，卡面里的重复变成**派生物**（改 1 处、15 张同步）；副作用——① 新卡结构与执行力度矩阵的 A3–A7 判定面可能互斥（A7 要「输出格式」节），故保留第 7 段并把它数据化（§6）；② 删「你是谁」段会使 A1/A2 的判定面失去锚点，故同批把 `touchedSemanticKeys` 的映射改指「职责」（§10-D11）；跨问题——F-09（零散文）/F-10（三投影）/F-23（手改告警）不是三件事：它们共用「同一份合并数据」这一个前提，任一视图另存一份即全破；跨文件——`docs/agents/` 是新增 docs 目录，`docs-convention` 必须同批补一行（§10-D2），否则规则与目录两处说法。

## 2 不做什么

1. **不改 S1 判据**：`tools/docgen/card-model/**` 的 36 码、8 张枚举、四个入口与 `mergeActions` 的字段集合**一字不动**；只追加 `vocab/` 登记表（数据）与 `subjects.mjs` 的登记项（S1 §5 `:131` 已预登记）。
2. **不改 S2 交付**：`tools/observation-check/**` 的校验链、证据七道、写盘入口、门禁断言零改动（`registeredIds` 的切换见 §10-D6：派生源缺失，本段**不做假切换**）。
3. **不碰 S6 定义层**：`tools/docgen/policy/**` 零改动；`tools` 字段仍从 `patternRegistry.toolsForSeat()` 派生。
4. **不改执行力度矩阵判据**：`tools/execution-matrix/criteria.md` 与 `check-agent.mjs` 的 A3–A7 判定面**逐字保留**；本段的义务是让新卡满足它们（§5），不是改它们。
5. **不写议会 / 门禁新流程**：F-17～F-19 / F-22 / F-24 的门禁段已由 S3 落地（`③@S3` / `④@S3` 门行），本段只做 C-08 的**到期事件**（置 `EXPIRY_LANDED = true`）。
6. **不做 A/B 盲评**（`V-13` 不在本期，`gate-record.md:13` 的 `②@S6` 增量登记）——任何 S4 材料不得引用。

## 3 落点与依赖方向

```
tools/docgen/
├─ card-model/vocab/
│  ├─ card-must-fields.mjs     7 段 × 必渲染字段（PRD `:239` 指定的单源；P-B 扫描同源）
│  ├─ predicates.mjs           谓词登记表 { id: { label, impl } }（impl 可为 'manual'）
│  ├─ landings.mjs             静态落点登记表 { id: label }（卡面只渲染字面值 + 变量名）
│  └─ shared-actions.mjs       15 席共用 must / never（合并进每席，overrides 落 README）
├─ components/
│  ├─ cardPipeline.mjs         唯一装配点：buildCards → buildEnv → mergeActions → 三投影 + writeAll()
│  ├─ renderCard.mjs           卡面投影（7 段，零散文）
│  ├─ renderReadme.mjs         README 投影（每席一份 + index + 覆盖记录表）
│  └─ outputFormats.mjs        （改写）结构化输出合同：{ outputKind: { fields[], checks[] } }
├─ templates/
│  └─ agent-card.md.tpl        （新增）7 段模板；旧 agent.md.tpl / agent-handwritten.md.tpl 铺满后删
└─ test/
   └─ card-render.test.mjs     （③ 段产出）① 段只定落点

docs/agents/
├─ README.md                   index（席名 / 职责一句 / 维度 / 输出类型 / 链接）
└─ <seat>.md                   15 份，每席一份（rationale + 覆盖记录表）
```

**4 个 `vocab/` 表的导出名与形状（写死，name 固定 = 断言可写死）**

| 文件 | 导出 | 键形 / 值形 |
|---|---|---|
| `card-must-fields.mjs` | `CARD_SEGMENTS` / `MUST_FIELDS` / `PROSE_PROBES` | `CARD_SEGMENTS` = 7 个段的段名数组（顺序 = 渲染顺序）；`MUST_FIELDS` = 「一定会」每行的必渲染字段名数组；`PROSE_PROBES` = `{ oldSegments: string[], declaration: (string\|RegExp)[], pointers: string[] }`（三个**固定键名**、按类分组，§5.1 末行的词表，唯一写死处） |
| `predicates.mjs` | `PREDICATES` | `{ '<id>': { label: string, impl: 'script' \| 'manual' } }`；`env.predicates` = `new Set(Object.keys(PREDICATES))` |
| `landings.mjs` | `LANDINGS` | `{ '<id>': label }`；`env.landings` = `new Set(Object.keys(LANDINGS))` |
| `shared-actions.mjs` | `SHARED_MUST` / `SHARED_NEVER` / `SHARED_USE` | 前两者 = `Action[]`（S1 §4 `:68-72` 形状）；`SHARED_USE` = `{ '<seat>': ['<actionId>', …] }`（每席取哪几条） |

| 约束 | 判据 |
|---|---|
| 依赖方向（单向） | `cardPipeline.mjs` → `card-model/**`（只读出口）+ `components/**` + `vocab/**`；**禁止** `card-model/**` 反向 import 任何 `components/**`（S1 §3 `:52` 的「反向零 import」不变） |
| 装配唯一入口 | `cli.mjs` 的 `generate` / `dump` / `gate` 与测试三者都只经 `cardPipeline.renderAll()` / `renderSeat()`；不得各自拼渲染参数（否则三投影会各演进） |
| 写盘入口（点名，**授权链不变**） | ① **角色卡内容变更**仍只能走既有 `draft` → 用户确认 → `replace --yes` 链（`tools/docgen/cli.mjs:366-430`）；`generate` **保持「只比不写」**（现状 `cli-gate.test.mjs:15` 的语义，`--kind rule/agent/all` 一律只比）。② `cardPipeline.writeAll(artifacts)` 只是 `draft` / `replace` / `generate --readme --apply` 三处**共用的落盘实现**（全内存 → 逐文件 `.tmp-<pid>` → 全成功再 rename），不是新的授权入口。③ `docs/agents/**` 属**派生人读文档**（不含角色行为契约），由 `generate --readme --apply` 一个显式旗标落盘；手改即由 gate 报 `Mismatch`。④ `dump` 只 `console.log`，`gate` 只读不写 |
| 写盘失败与并发 | 复用 PRD §4.2 ④ `:319` 的合同（任一失败 → 清 tmp、`{ok:false,wrote:false,errors}`）+ `tools/docgen/cli.mjs` 的启动清理先例（启动先扫掉孤儿 `.tmp-<pid>`）；并发只保证**单文件**原子（跨文件可能混代，由 `gate` 事后比对兜住，不引入锁） |
| 数据源单向（F-23） | 渲染输入只来自 `agentData.mjs`（+ `triggerTable`）；`agents/*.md` 只被 **gate 读来比对**，不得被任何渲染 / 校验路径当输入（可机械判：`renderCard` / `cardPipeline` 内无 `AGENTS_DIR` 读操作，`readFileSync` 只出现在 gate 侧） |

## 4 卡片数据与装配（F-09 / F-10 的地基）

```js
Card = { seat, name, description, tools, duty, scenes, signals, must, never, categories, checkItems, rationale }
                 // = S1 §4 :58-67 的**全量 12 键**（含 front matter 三字段，S1 明写「S4 渲染」）；本段只填不扩
seatEntry = { name, role, dimension, outputKind, tools, card }   // agentData 条目：外层供 tool/维度派生；card 内 name/description/tools 由 seatEntry 填入
buildCards()   → [{ seat, card, overrides[] }]     // card 已合并（mergeActions(SHARED, own)）
buildEnv(seat, cards) → S1 §6 :143-144 的 11 键     // 全部由登记表派生，无手写值
renderSeat(seat) → { card, readme }                // 单席原子：一次只产 1 卡 + 1 README
renderAll()    → { cards[], readmes[], index }     // 收口用：15 席全量（内存产物，未写盘）
```

| 形状项 | 判据 | 出处 |
|---|---|---|
| `seatEntry.card` | S1 `Card` **12 键**齐（`seat` / `name` / `description` / `tools` / `duty` / `scenes` / `signals` / `must` / `never` / `categories` / `checkItems` / `rationale`）；**缺任一键 → 拒绝渲染**（不当空值兜底） | S1 §4 `:58-67` |
| `name` / `description` / `tools` | 由 `seatEntry` 派生填入 card：`name` = `seatEntry.name`；`description` = `trigger.when`（§5.2）；`tools` = `toolsForSeat(seat)`；三字段**不得**另存一份 | PRD `:231`；S6 `patternRegistry` |
| 共享层 | `must` / `never` 先取 `shared-actions.mjs` 中本席 `use` 列出的 id，再与本席同名 id 覆盖（覆盖必带 `reason`） | PRD §3.3 `:187`；S1 `merge.mjs` |
| `env.predicates` | `new Set(Object.keys(predicates.mjs))`；`Action.criterion` 未登记 → S1 `MissingCriterionImpl` | S1 §4.1 `:98` |
| `env.landings` | `new Set(Object.keys(landings.mjs))`；卡面**只渲染字面值 + 变量名**，不渲染运行时值 | S1 §7 `:180`；PRD `:233` |
| `env.subjects` | `SUBJECTS`（S1 `subjects.mjs`）——本段扩到 **15 席 + 2 项产物侧**（登记项追加，非封闭枚举）；席命名形态写死 = `<seat>.card`（如 `reviewer-audit.card`） | S1 §5 `:131`；PRD `:293` |
| `env.registeredIds` | `registeredIdsOf(cards)`（**传入本席刚合并的 card 单元素数组**，与 S1 §6 `:154` 的「本轮全部卡」同义——一席的本轮对象就是它自己）；**只在 card-model 侧使用**，不喂给 observation-check | PRD `:310`；S1 §6 `:154` |
| `env.unboundVars` | 本轮渲染传 `new Set()`（无运行时变量取值）；`resolveLanding` 空集时语义由 S1 判 | S1 §7 `:180` |
| `env.parliamentSeats` | 议会席集合（表见 §5.2）；`evidence-reader` / `senior-sdet` 不在其中 | PRD `:280`；A-5 `:56` |
| 拒绝语义 | `mergeActions` / `validateCardModel` 任一返回 errors → **该席不产出任何字节**，逐码打印后 **exit 1**（不新增码，直接用 S1 的码；为此须在 `validateAgentData.mjs` 的 `EXIT` 表新增 S1 码分组 = exit 1，见 §10-D12——S1 的码与判据不动） | PRD §4.2 `:321`（异常不冒泡）；S1 §6 `:152`；S1 §6 `:159`（映射表不动→本段显式承接） |

**15 席内容迁移映射**（旧卡 → 新数据；逐席滚动，见 §9）

| 旧段（`agent.md.tpl` / handwritten） | 新落点 | 说明 |
|---|---|---|
| `## 你是谁`（identity） | `duty`（trigger + objects + action + constraint） | identity 的叙述性内容进 `rationale`（README） |
| `## 共享特质`（15 份同文） | 共享 `must` / `never`（`shared-actions.mjs` 单源） | 逐句映射见探索稿 §12.6；**不得留在卡面** |
| `## 固定必问清单`（`fixedList` 行） | 本席 `checkItems`（类别 + 条目表）+ 对应 `must` 动作 | 「必问」行拆成「判据 id + 落点 + 三态」；散文残留进 `rationale` |
| `## 自由探索` | `must` 一条（每轮 ≥1 条或显式「无 + 依据」） | 与 A4 闭环共用 |
| `## 输出格式`（`outputFormats`） | 第 7 段（结构化 `fields[]` + `checks[]`） | 散文声明与指针句迁 README `rationale`（§6） |
| `## 通用纪律`（15 份同文） | 共享 `must` / `never` | 「证据可复算」「只提问题不给解法」逐条保留语义 |

## 5 三投影渲染契约（F-10）

| 投影 | 落点 | 读者 | 硬约束 |
|---|---|---|---|
| 卡面 | `agents/<seat>.md` | AI | 7 段（§5.1）齐、**零散文**（S1 `PointerToElsewhere` / `HardcodedCount` 零命中）、`rationale` **不渲染** |
| README | `docs/agents/README.md` + `docs/agents/<seat>.md` | 人 | 每席一份 + 自动 index；`rationale` 必填（S1 `MissingRationale`）；含**覆盖记录表**（每行 = `id` / `changed` / `reason`） |
| dump | stdout only（`node tools/docgen/cli.mjs dump --name <seat>`） | 开发 | 合并后全量 JSON；**不落盘、不进门禁**；输出可被 `JSON.parse` 逐字复算 |

**覆盖记录的 `reason` 从哪来**：S1 `merge.mjs:63` 的 `overrides[]` 只带 `{ id, changed }`（不含 `reason`，S1 不改）。故 `cardPipeline` 组装 README 覆盖表时，`reason` **取自本席 `own` 动作条目自身的 `reason` 字段**（该字段是覆盖合法性的前提：无 `reason` 的覆盖已被 `OverrideWithoutReason` 拒掉，S1 `merge.mjs:58-59`）。三列缺一 → 该席拒绝渲染。

### 5.1 卡面 7 段 × 必渲染字段（唯一单源 = `vocab/card-must-fields.mjs`）

| 段 | 数据来源 | 必渲染 |
|---|---|---|
| front matter | `name` / `description` / `tools` | 三字段齐；`description` = §5.2 |
| 职责 | `duty` | 一句话（trigger + objects + action + constraint） |
| 一定会 | 合并后 `must` | 每行：`trigger.scene`（id + moment）/ `objects` / `criterion`（判据 id）/ `landing`（枚举字面值 + 变量名）/ `requires`；**另起三行常量**：三值字面量 `hit` / `miss` / `na` 各一行 + `reason` 字段名 |
| 禁止 | `never` | 每行：`objects` + `criterion` 判据 id |
| 冲突裁决 | 模板常量三行 | 优先级 `用户 > 规则 > 本席`；采纳 / 不采纳 + 认输判据 |
| 本席清单 | `categories` + `checkItems` | 类别 label + 条目 id + `criterion` 文字 + `check` 类型（`script` / `ai` / `manual`） |
| 输出格式 | `outputFormats[outputKind]` | 必填字段表 + 校验命令（结构化，无散文、无指针） |
| 边界 | `tools` + 权限物料（S6 `boundaryBySeat`） | 只写 / 禁写两类清单 |

- **A3–A7 的判定面已在表内满足**：A3（表头含「必问」）→「一定会」表头 `| # | 必问（must） | 触发 | 宾语 | 判据 id | 落点 | 前置 |`；A4（`缺答 = 不合格`）→「一定会」节首骨架行（**模板常量，15 卡同源 1 处**）；A5（`证据可复算`）→ 共享 `must` 行的判据文字（单源 `shared-actions.mjs`）；A6 →「边界」；A7 →「输出格式」。四者都**不靠逐席重写**。
- **零散文的机械口径**：`Validate` 通过（36 码零命中）**且** §9-V-1 的段名 / 字段存在性断言全过；散文只允许落在 `card.rationale`（渲染时过滤，卡面零出现）。

**零散文探针（`PROSE_PROBES`，唯一写死处 = `card-must-fields.mjs`；V-4 直接用它，不另写一份词表）**

| 类 | 词 / 正则 | 来源 |
|---|---|---|
| 旧段名（5 词） | `共享特质` / `通用纪律` / `固定必问` / `自由探索` / `你是谁` | `agent.md.tpl` 的旧节名（`:12-29`） |
| 声明句式 | `声明：` / `心算` / `代填` / `必由.*本人` / `注：` | `outputFormats.mjs` 现散文（`:2-4` / `:21` / `:25`） |
| 指针词 | S1 `POINTER_WORDS` 的**同形判定**：词 + 后随章节号（`见 X` / `详见 §x` / `按 §N`），**不是裸子串** | S1 §7 `:188` 的 `PointerToElsewhere` 判定面（`validateCardModel.mjs:96-101` 的 `pointerHit`）；裸子串会把「采纳周围人的意见」判红 → 假阳性（S1 的 `S1-TC-G06` 已把它固化为合法正例） |

> 三类各至少 1 条反例（构造一段旧散文 / 一句声明 / 一个指针词进卡面即红）；**假阳性守卫**：卡面含「遇意见冲突」「可见」这类合法词时，指针词类必须 **0 命中**（与 S1 `card-model.test.mjs:1085` 同口径）。**同义散文**（如「心算必错…」这类改写）不靠词表兜，由 D10 的「语义不丢、只搬落点」+ testcase 的对照用例兜（已知边界，§12-R3）。

### 5.2 `description` 与称谓（F-12）

| 项 | 判据 | 出处 |
|---|---|---|
| `description` | 只写触发条件 = `trigger.when`（+ `notWhen.text` 时附「不用于：…」）；**不再派生**「在议会评审中担任…时调用」 | PRD `:231`（「只写触发条件」）；A-5 `:56` |
| 议会席称谓 | 过渡期「议长 / 主持人」**可并用不得混用**（S1 `MixedTermInCard` 守） | A-5 `:56` |
| 非议会席称谓 | 一律「主 agent」，不得出现「议长 / 主持人」；`ProceduralWordOutsideParliament` 已守程序动作词 | A-5 `:56`；PRD `:280` |
| 试点席的历史混用 | `agents/detective-observer.md` 实测**同时出现「议长」×1 与「主持人」×7**——迁移时**必须统一为「主持人」**（过渡期内议会席允许的写法），**不得原样搬进新卡**（原样搬即 `MixedTermInCard` 红，试点恰好是唯一会踩的席） | A-5 `:56`；实测 `Select-String -Path agents\detective-observer.md -Pattern '议长|主持人'` → 8 行 |
| 机械判 | `Select-String -Path agents\*.md -Pattern '议长|主持人'` 只允许命中**议会席**；非议会席命中 = 红；同一张卡两词同现 = 红（本段 testcase 构造） | 探索稿 §12.9 `:470` 的到期判据（S3 后归零，本期按席分类判） |

## 6 输出格式段的数据化（§5.1 第 7 段）

`outputFormats.mjs` 由「散文块」改为**结构化合同**，逐 `outputKind` 一份：

```js
outputFormats = { audit: { fields: [...], checks: [...] }, 'issue-card': {...},
                  observation: {...}, evidence: {...}, testcase: {...} }
```

| 现状问题（改造前，`outputFormats.mjs` 实测） | 处置 |
|---|---|
| `audit` 块含 4 段散文声明（`:2-4` / `:21` / `:25`） | 声明里**有判据含义**的（证据栏空 = 不通过、代填 = 无效）→ 提到共享 `must` / `never`；纯解释（「心算必错，实测数错 3 次被拦」）→ README `rationale` |
| `audit` 块引用 `references/doc-taxonomy.md`（`:40`） | 卡面不得带指针（`PointerToElsewhere`）→ 该行改为结构化 `checks[]` 条目（「交付物完成判据核对」作为一条 check + 落点） |
| `evidence` 块写「说明：上表「固定必问清单」…」（`:87`） | 「固定必问清单」段在新卡已不存在 → 该句删除；语义并入 `evidence` 席的 `must`（取证必办项） |
| `testcase`（`outputKind` 已有，但无对应块） | 新增：7 节 testcase 的必含节 + 校验命令（口径单源指 `rules/spec-testcase-gate.md`，卡面只写「跑哪条命令 + 什么算失败」） |

- **禁**：把 `outputFormats` 复制进每席数据（15 份副本）；它按 `outputKind` 共享，改 1 处同步全部同 kind 席。

## 7 写盘、门禁与到期事件

| # | 判据 | 怎么核 |
|---|---|---|
| ① 单席原子落盘 | `renderSeat(seat)` 在内存里产出**本席**字节（1 卡 + 1 README）；该席校验 / 合并报错 → **零写盘**；落盘只走 `cardPipeline.writeAll()`（逐文件 `.tmp-<pid>` → 全成功再 rename；失败清 tmp 并 `{ok:false,wrote:false,errors}`）。**逐席滚动**（§8）下不要求「15 席全通过才写」——那是收口步（`renderAll()`）才有的语义 | 构造一张坏卡 → 该席 2 个目标的 mtime 与内容均不变；`renderAll()` 时坏 1 席 → 31 份全不变（testcase 承载） |
| ② 卡面手改即红（F-23 后半·**现状已生效**） | 现状实测：`tools/docgen/state.json` 的 15 席**已全 `replaced`**，`collectGate`（`tools/docgen/cli.mjs:104-112`）已对每席逐字节比对 → 改任一张卡 1 字节即 `Mismatch`。**本段不新建这条**，只把它写进验收（V-5）以防回退 | `git diff` 改 1 字节 → `node tools/docgen/cli.mjs gate` exit 1 且点名该路径 |
| ③ README 手改即红（**本段新增**） | `gate` 的比对面从 15 张卡扩到 **15 卡 + 15 席 README + index**（共 31 份）；不符 → `Mismatch`（沿用既有码，不新增）；`docs/agents/<seat>.md` 缺文件 → `DanglingBaselineEntry`（沿用 `collectGate:106` 的先例） | 改 `docs/agents/reviewer-audit.md` 1 字节 → `gate` exit 1 且点名该路径；删一份 → `DanglingBaselineEntry` |
| ④ 接管完整性（**收口期断言**） | `state.json` 的 `agents` 键集合与 `agentData` 名字集合**双向相等且逐席 `replaced`**；任一席缺失或回退成 `registered` → gate 红。**本段期间**（逐席滚动中）判据按**已迁移子集**：已迁移席必须 `replaced`，未迁移席不得出现在 `docs/agents/`；收口步（15 席全迁）后按全集判 | 删 `state.json` 一席 → `gate` exit 1；中期构造「未迁移席却有 README」→ 红 |
| ⑤ 豁免窗口到期（C-08 / O-13） | `tools/observation-check/card-exempt.mjs` 的 `EXPIRY_LANDED` 置 **`true`**（唯一开关，S3 spec 明写由 S4 承接） | `npm run check` 的输出中**含** `[豁免窗口] … EXPIRY_LANDED=true` 行（该行在 ⑥ 段输出内、**不是首行**，`check-all.mjs:418`）；另加注入用例：`disposeCardFindings([{file:'agents/x.md'}], {landed:true})` → `blockers.length ≥ 1`（证置 true 有行为差异，不只看布尔） |
| ⑥ 旧模板退场（D-05「不留双份」） | 铺满后删 `templates/agent.md.tpl`、`agent-handwritten.md.tpl` 与 `renderAgent.mjs` 的旧分支；`renderByName` 改指 `renderCard` | 判据面**收窄为两处**（历史文档与卡面正文不算）：① `Test-Path tools\docgen\templates\agent.md.tpl` / `agent-handwritten.md.tpl` → **False**；② `Select-String -Path tools\docgen\**\*.mjs -Pattern 'agent\.md\.tpl|agent-handwritten\.md\.tpl'` → **0**。另：卡面 `sourceLine` 这类「写模板文件名」的字段随旧模板一起删（实测 `agents/senior-sdet.md:9` 现写着模板名） |

## 8 逐席滚动与出数门槛（F-11）

| 步 | 内容 | 出数 / 门 |
|---|---|---|
| 1（试点） | 侦探席 `detective-observer` 先行：出**对照稿**（旧卡 vs 新卡逐段对照 + 差异清单），落 `.session/reviews/<次>/pilot-contrast.md`，**归档副本**同步落 `docs/reports/2026-10-30-agent-card-s4-pilot-contrast.md`（`.session/` 不进 git，归档副本才是可跨机复核的那一份） | PRD A-4 `:55` / D-05 `:500` / D-07 `:502`；`docs-convention`（`.session/` 不进 git） |
| 2（量） | 试点合并后跑 `git diff --numstat agents/ tools/docgen/` 量**单席改动行数**；剩余工期 = 单席 × 14 + 20% 缓冲（数字由实测产生，spec 不填） | D-07 `:502`；取数命令随数字写出 |
| 3（铺满） | 其余 14 席逐席一提交；每席落地即 `gate` 按**已迁移子集**绿（未迁移席全不放行，见 §7-④） | PRD `:416`（15 卡豁免到期 = S4 首次重生成） |
| 4（收口） | `renderAll()` 全量一次；状态全 `replaced`、豁免置 true、旧模板删除、README index 齐 | §7 的 ①③④⑤⑥ |

**为什么先试点**：单席成本是本段唯一的未知量（PRD §0.4 只量到存量体量，S1 spec §12-R4 亦未实测）；先做 1 席再 ×14 是把这个未知量压在可回退的位置，而不是 15 席一起返工。

## 9 验收（V-1～V-8）

| # | 验收项 | 可核方式 |
|---|---|---|
| V-1 | 15 张卡 7 段齐 + 每段必渲染字段在位（单源表逐行对账） | 以 `card-must-fields.mjs` 为期望集，逐段断言存在性；缺任一 → 红 |
| V-2 | 三投影同源 | 同一 `renderSeat()` 产出的 card / readme / dump 三者对同一字段取值逐字相等；改数据 1 处 → 三者同步（构造一条改动前后比对） |
| V-3 | 覆盖记录在位 | `overrides[]` 每条（base id / changed 字段 / reason）在 README 覆盖记录表出现；同层同 id 无 `reason` → 红 |
| V-4 | 零散文 | 15 卡 S1 校验零 errors；卡面按 **`PROSE_PROBES` 三类**（旧段名 / 声明句式 / 指针词）扫描 **0 命中**——判据全集只认该单源，另配一条假阳性守卫（含「遇意见冲突」「可见」的卡面 → 指针词类 0 命中） |
| V-5 | 手改即红 | 改卡 1 字节 / 改 README 1 字节 / 删 `state` 一席 → 三例均 `gate` exit 1 |
| V-6 | 数据源单向 | 静态扫描：`cardPipeline.mjs` / `renderCard.mjs` 无 `agents/` 读取；`agents/*.md` 不被任何 `tools/docgen/components/**` 当输入 |
| V-7 | P-B 扫描（PRD `:576`） | 卡面每个 **`must`** 行含 `criterion` id 且含 `landing` 字面值（**`never` 行只判 objects + criterion id**，与 PRD `:234` 一致）；扫描面 = `card-must-fields.mjs` 的定义（同源，不另写一份） |
| V-8 | F 对位 | F-09 / F-10 / F-11 / F-12 / F-23 各有 ≥1 正向用例，覆盖总表按 F 编号建行并指回 §5 / §7 / §8 |

## 10 与上游的差异清单（逐条带位置）

| # | 差异 | 位置 | 理由 |
|---|---|---|---|
| D1 | 卡面 = PRD 6 段 **+ 第 7 段「输出格式」** | PRD §3.7 `:227-237`（段清单 6 段，末行 = `:237`） | ① 已签执行力度矩阵 A7 判「有 `## 输出格式` 节」（`criteria.md:87-95`），删该节要改已签 spec（`2026-10-20-execution-assurance-matrix-design.md`）；② 卡面自足要求输出合同不得写成指针（PRD `:223`），而 6 段里无承载处。**同批改 PRD**：在段表**最后一行（`:237` 行）之后插入一行**「输出格式」段定义（**表内插行**，不是表外追加），并把 `:239` 的单源说明与「本节行数」同批对齐（判据：PRD §3.7 表行数 6→7、单源说明仍指 `card-must-fields.mjs`） |
| D2 | README 落点 = **`docs/agents/`**（新增 docs 目录） | PRD §8 `:519` 只写「README 生成物」，未给路径 | `agents/` 下任何 `.md` 不在 baseline 会触发 `UnregisteredHandwritten`（`tools/docgen/cli.mjs:120-124`）；放 `docs/agents/` 使「人读视图」与「AI 读卡面」物理分离。**同批改 `rules/docs-convention.md`** 的目录表补一行（生成物类，不作为结论引用） |
| D3 | `description` 改为 `trigger.when` 直出 | PRD `:231`（「只写触发条件」） | 现派生式 `在${domain}中担任${role}…时调用`（`patternRegistry.mjs:44`）把角色叙述写进 description，与「只写触发条件」相反；4 个常驻测试引用该派生式（`e2e-final.test.mjs:17-18` / `pilot-data.test.mjs:36,40` / `validateAgentData.mjs:70-71`），随本批同步（**不改判据强度**，只改描述形态） |
| D4 | 新增 4 个 `vocab/` 登记表（`card-must-fields` / `predicates` / `landings` / `shared-actions`） | PRD `:239`（只点名 `card-must-fields`）；S1 §6 `:143-144`（`predicates` / `landings` 由调用方注入，S1 未给载体） | 无常量表则 `env` 只能手写 15 份（必漂）；放在 `vocab/` 与 S1 的「词表 = 数组物料」同形，且不改判据 |
| D5 | `SUBJECTS` 扩到 15 席 + 2 项产物侧，并收敛 PRD `:293` 的 `'…'` | S1 §5 `:131`（预登记「S4 扩到 15 席」）；PRD `:293` | 不加登记项 → 15 卡一进 `validateCardModel` 就报 `UnverifiableOutput`（S1 §7 `:203`）；PRD 省略号随本批改为「15 席 + 2 项，登记表非封闭枚举」 |
| D6 | **`registeredIds` 的派生切换不在本段做**（O-12） | S1 §11-3 `:289`；`docs/after/20261029204752-…open-decisions.md` 的 O-12 | ① 切换要求「`Set(REGISTERED_IDS)` = 派生集」，而实值 `['k01','k02','k03']`（`registered-ids.mjs:5`）是**产物侧**登记项，15 卡的 `checkItems` 并集与之不同域；② observation-check 内**没有可派生的 `CHECK_ITEMS` 载体**（`Select-String 'CHECK_ITEMS' tools\observation-check` 命中 2 行，**均为 `registered-ids.mjs:2-3` 的注释**，无 `export` 载体）；③ 若让 observation-check 从 `card-model` 派生，即破 S1 §3 `:52` 的「反向零 import」。处置：转 `docs/after/` 改登记（触发 = S2/S3 修订时先给 observation-check 自己的 `CHECK_ITEMS` 载体）。**回扫**：S1 §11-3 原文不改（历史保留），本行 + after 条目为唯一现行口径 |
| D7 | 15 卡豁免置 `EXPIRY_LANDED = true` | PRD C-08 `:121`；`card-exempt.mjs:23-24`（注释「S4 首次重生成落地时置 true」） | 本段即「S4 首次重生成」这一事件；不置 true 则 `[豁免窗口]` 行永远显示未到期，C-08 变成永不到期 |
| D8 | 旧模板与旧渲染分支**铺满后删除** | PRD D-05 `:500`（「铺开后删除旧槽位散文，不留双份」） | 留双份 = 两份真相；试点期保留作对照（§8 步 1） |
| D9 | `S2` 的合并实现（`tools/observation-check/render.mjs:29-46`）**本段不删** | S1 §11-1 `:287` | 该副本被 S2 的 209 条测试覆盖、且 S2 零改动是本 PRD 的既定约束（§2）；删它要同批改 S2 测试 = 越段。改登记到 `docs/after/`（触发 = S2 被修订时） |
| D10 | `outputFormats.mjs` 由散文改结构化 | PRD `:236`（本席清单）/ `:223`（零散文） | 现状含 4 段散文声明 + 1 处文档指针（§6 表），直接渲染进卡面即违 F-09；语义不丢、只搬落点 |
| D11 | **A1/A2 的判定对象从「你是谁」段迁到「职责」段** | `tools/execution-matrix/criteria.md` 的 A1/A2 行（判定对象「卡「你是谁」段」）；`tools/execution-matrix/check-agent.mjs` 的 `touchedSemanticKeys`（`tools/docgen/cli.mjs:271-274` 只认「你是谁/身份」） | 新卡删掉「你是谁」段（PRD `:230-237` 的 7 段里无此段），若不同批改映射则**铺满后改「职责」永不触发 A1 重判**、annotations 恒绿 = 语义项形同虚设。判据语义不变（仍是「身份/职责与卡内容是否自洽」的 AI 判项），只换锚点段名；回扫：`criteria.md` 该行 + `touchedSemanticKeys` 的段名表同批改（**判据级，按 R8 回扫**，`node scripts/scope-sweep.mjs --check` 必须 exit 0） |
| D12 | `EXIT` 表新增 S1 码分组（36 个脚本码归 exit 1） | `components/validateAgentData.mjs:4-26`（封闭映射表）；S1 §6 `:159`（S1 明写「映射表不动」） | S1 交付时未接 CLI，故其码不在 `EXIT` 表；本段一接 CLI 就会落 `exit 2`（未知码抛错）。本段显式承接：把 36 个脚本码（含 `UnverifiableOutput`）+ 3 合并码归 **exit 1**，`WeakReason` 不入表（manual）。**不动 S1 的码与判据**，只补本文件的映射行 |

## 11 已登记副本与触发信号

| # | 副本 / 待办 | 现状 | 收敛触发信号 |
|---|---|---|---|
| 11-1 | 合并实现两份（S2 `render.mjs:29-46` 与本段 `mergeActions`） | S2 那份是演示数据模型，不进卡面管线（S1 §11-1 `:287`） | S2 被修订时同批删（本段见 D9） |
| 11-2 | `registeredIds` 两域（产物侧常量 vs 卡面派生） | 见 D6 | S2/S3 修订时先建 observation-check 自己的 `CHECK_ITEMS` |
| 11-3 | 旧模板两份（`agent.md.tpl` / `agent-handwritten.md.tpl`） | 试点期保留作对照 | 本段铺满即删（D8 / §7-⑤） |
| 11-4 | `patternRegistry.description` 两个派生分支 | 新卡不用；其余调用方仍在 | 本段同步后若全仓无引用即删（D3 的落地检查） |

## 12 风险与已知边界

| # | 风险 | 处置 |
|---|---|---|
| R1 | 15 席内容迁移会同时打断 15 个常驻测试（PRD §0.4 `:92`） | 测试同步列为**交付物**（§3 影响面 + §10 差异 D3）；逐席提交，任一席绿才下一席 |
| R2 | 新卡结构与 A3–A7 判定面互斥（A7 要「输出格式」，PRD 6 段没有） | D1 保留第 7 段 + 数据化；V-1 以 `card-must-fields.mjs` 单源逐段对账 |
| R3 | 「零散文」被误做成「删内容」 | 每条被删散文必须能在 README `rationale` 或共享 `must` 找到落点（V-3 + 覆盖记录表）；`PointerToElsewhere` 只判指针，语义丢失靠 testcase 的对照用例兜 |
| R4 | 共享层合并（`overrides[]`）被绕过（本席直接写全量） | V-3：同层同 id 重复必须报 `DuplicateStatement`（S1 `merge.mjs` 已实现）；README 覆盖记录表缺 `reason` → 红 |
| R5 | `dump` 被落盘当第二份真相 | PRD `:225` 明写 stdout-only；V-6 静态扫描 + testcase 断言「`dump` 无写操作」 |
| R6 | 称谓口径跨 15 卡回扫不彻底 | §5.2 机械判 + 本批 `node scripts/scope-sweep.mjs --check` 必须 exit 0（禁用 `npm run doc:sweep -- --check`） |
