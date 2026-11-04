> split from `docs/prd/20261102212627-card-data-contract-and-proof/index.md`（2026-11-03）

# 10 S-A 数据层：`agentData` 拆 JSON + `when` 唯一源

> 本 spec 只覆盖 PRD §8 的 **S-A 段**。D1–D17 / Q1–Q8 / V1–V12 的正文只活在 PRD，本文只引用编号（PRD §9 双份真相禁令）。
> 前置（硬）：PRD §5 的 `SCAN_FIELDS` 行、`S1-TC-G09` 行、`policy/**` 行已在 ② 段签收（`skills/dev-workflow/references/gate-record.md` 对应行）；未签不得开工。

## 10.0 为什么

- 现状 `tools/docgen/components/agentData.mjs` 是**纯 JS 字面**（`:326` 导出 `SKELETON`），15 席的共享片段靠**字面复制**：`越出边界的动作只记录，不自行处置` 13 处、`条 checkItem` 14 处、`当主持人调度对…` 22 处（= 11 席 × 2）——PRD §1 缺陷 5。
- 同一句话在两处存放：`agentData.mjs:123`（`duty.trigger`）与 `:307`（`triggerTable[…].when`）逐字相同，而 `cardPipeline.mjs:59-64` 的 `descriptionOf` 只读后者、8 键扫描面只含前者 → 斜杠串从 `description` 漏检——PRD §1 缺陷 6。
- policy 里还留着 3 项本仓专属路径（`skills-lock.json`、`lessons/`、`tools/docgen-spike/.tmp-test/`，末者已不存在），被渲染进 2 张卡的禁止清单——PRD §1 缺陷 8 / Q8。
- 用户原话（2026-11-02）：「是不是应该分成独立的 json」「怎么复制 11 份呢？他只是把共享的独立的拆开了」——所以拆分的正当性不是「好看」，而是**首次真正实现共享**（PRD D12）。

## 10.1 核心决定（不可违反）

| # | 决定 | 为什么 |
|---|---|---|
| R1 | 数据源拆为 `seats/<seat>.json`（15 份，一席一文件）+ `shared.json`（1 份），靠 `@` 引用共享段（PRD D12 / Q7） | 不拆 → 共享片段继续靠字面复制，改一处要改 13 处；这正是 PRD §1 缺陷 5 的根因 |
| R2 | `@` 展开 = **装配前一次性纯函数**，展开后无悬空键、无嵌套（PRD D12 / V5） | 展开若散落在渲染期，每次渲染都要判一次引用，且嵌套拒绝没处放。**「12 键全量」的断言不落在这里**（`2026-11-03` 计划门 P0-1 实测改判）：loader 产出的 `agentData[i].card` 恒 **8 键**（`duty`/`scenes`/`signals`/`must`/`never`/`categories`/`checkItems`/`rationale`，15/15 席实测），另 4 键（`seat`/`name`/`description`/`tools`）只在 `cardPipeline.mjs:82-90` 的 `buildOne` 派生——loader 若也补这 4 键就是第二份派生物。故分两段判：loader 判「席文件 `card` 恰等 8 键 + 派生四键拒载」（§10.2.5 第 6 步，码 = `CardKeySetMismatch`）；12 键全量判在 `buildCards()` 产物上（§10.2.6 的 `check-shared-refs.mjs`）。注意：**条目顶层是 `BASE_KEYS` 白名单**（`validateAgentData.mjs:105`，9 键 + `trigger` 拆出后仍 9 键），12 键说的是 `card` 内部，两者不可混 |
| R3 | `when` 唯一源 = `triggerTable.when`；`duty.trigger` **一律装配期注入**，不取「删除」分支（PRD D17 / r4 后端席） | 两处真相是缺陷 6 本体；取「删除」分支则 V12 两面都无字段可判，等于把判据删了 |
| R4 | `description` 纳入文本扫描面：`CARD_TEXT_FIELDS` **与** `surfaceTexts` 两处同批改，缺一即静默空转（PRD D17） | 只改前者会让「改了表、仍然不扫」原样保留，且 §4 没有一条验收能判出它 |
| R5 | 同批改写三条冻结断言：`card-model.test.mjs:1125` / `:1131`（现状 `green(description …)` 要求 `description` **不扫**）与 `:1141`（`SCAN_FIELDS` 恰 8 键） | 不改这三条 → R4 落地即红；PRD §5 `S1-TC-G09` 行已登记这是改已签件，须回 ② 段 |
| R6 | policy 删 3 项本仓专属路径（PRD Q8），保留 `.gitignore` 兜底句。**删的范围 = 只删 `pathGroups.workspace` 的三项**（`skills-lock.json` / `lessons/` / `tools/docgen-spike/.tmp-test/`）；`DETECTION_BLIND_SPOTS`（`policy/definitions/paths.mjs:26`）里的 `lessons/` **保留不动**——那是「检测限度」段（≠ 禁写清单），删它会改另一段的语义 | 那是「通用角色卡」里的项目专属内容（PRD D13）；兜底句删了会让卡面失去最后一道提醒；两处 `lessons/` 分属不同段，混删会把边界段整段改写 |
| R7 | 装配顺序不变：`...s` 必须置末（`agentData.mjs:294` 注释是硬约束、`:295` 是唯一实现） | 条目自带的 `tools` / `boundary` 会静默覆盖档位；顺序一乱，`tool-tiers` 的 `FROZEN` 断言与渲染都会漂 |
| R8 | `trigger.kind` 落在 `triggerTable[<seat>].kind`（PRD Q5 / §8 S-C） | 本段只**留字段位**，四值校验与卡面渲染归 S-C；字段位置现在不定死，S-C 会再造一个第二来源。**字段位实际由 S-C 落**（`2026-11-04` 就地加注：S-C 的 `Task 2` 在 15 席 `trigger` 上补 `kind`，取值 `dispatch 11 / occasion 1 / moment 1 / need 2`，判据在 `tools/docgen/check-trigger-kind.mjs`；本条只回指，不改结论） |
| R9 | 本段产物硬约束：`node tools/docgen/cli.mjs gate` → **exit 0** 且 15 席 `disk == render` 逐字节相等（PRD V4）；`baseline 38/38` 不作判据（PRD §5） | 数据层改造若让渲染漂了一格，S-B / S-C 的所有验收都建立在错基线上 |

## 10.2 数据模型 / 机制

### 10.2.1 文件落点

| 产物 | 路径 | 数量 |
|---|---|---|
| 共享片段 | `tools/docgen/data/shared.json` | 1 |
| 逐席数据 | `tools/docgen/data/seats/<seat>.json`（文件名 = 席名） | 15 |
| 加载 + 展开 + 注入 | `tools/docgen/components/seatLoader.mjs`（新） | 1 |
| 12 键唯一源 | `tools/docgen/components/cardKeys.mjs`（叶模块、零 import；`cardPipeline.mjs` 只 re-export，导出面不变）——`2026-11-03` 施工期补登：若把定义留在 `cardPipeline.mjs`，`seatLoader → cardPipeline → agentData → seatLoader` 会成环，入口为 `seatLoader` 或 `cardPipeline` 时该常量处于 TDZ（实跑：两入口均 exit 1） | 1 |
| 公开入口（**导出面不变**） | `tools/docgen/components/agentData.mjs` 改为薄壳 | 1 |
| 引用校验器 | `tools/docgen/check-shared-refs.mjs`（PRD V5 定名） | 1 |

`agentData.mjs` 现有 **29 条 `import` 语句 / 28 个文件（口径 = 只统计 `tools/`）**；全仓含 `scripts/check-all.mjs:23` 的 1 条则为 30 条 / 29 个文件。取数：`git grep -n "from '.*agentData.mjs'" -- "tools/**/*.mjs"` → 29 行、去重 28 个文件；分目录 = `components/` 5 个文件、`test/` 20 个文件 21 条语句（`tool-tiers.test.mjs` 有 1 条内联 `runEsm` 字符串）、`cli.mjs` 1、`state.mjs` 1、`acceptance/` 1。这 30 处全部不改：`agentData.mjs` 继续导出 `agentData` / `triggerTable` / `AGENT_KINDS`，只是实现从字面换成「读 JSON → 展开 → 注入 → 装配」。

### 10.2.2 键切分表

`shared.json` 只收**实测逐字重复 ≥2 次**的片段。实测命令（仓根，PowerShell 5，`tools/docgen/components/agentData.mjs` 拆分前）：

```powershell
node -e "const L=require('fs').readFileSync('tools/docgen/components/agentData.mjs','utf8').split('\n'); for (const v of ['按本席职责与边界执行；越出边界的动作只记录，不自行处置','旧卡「你是谁」并入本段；共享特质与通用纪律上移共享层；固定必问清单拆成','条 checkItem；自由探索为一条 must；输出格式走共享 issue-card 合同。']) console.log(v.slice(0,8), L.filter(l=>l.includes(v)).length)"
```

| 键 | 值 | 实测命中 | 引用形态 |
|---|---|---|---|
| `dutyConstraintDefault` | `按本席职责与边界执行；越出边界的动作只记录，不自行处置` | 12 行 | 整值 |
| `cardRationaleHead` | `旧卡「你是谁」并入本段；共享特质与通用纪律上移共享层；固定必问清单拆成` | 12 行 | 片段 |
| `cardRationaleTail` | `条 checkItem；自由探索为一条 must；输出格式走共享 issue-card 合同。` | 11 行 | 片段 |

**明确不进 `shared.json` 的三类**（D-d 的判据是「真的重复」，不是「看起来通用」）：

| 片段 | 实测 | 不进的理由 |
|---|---|---|
| `当主持人调度对…` | 22 处（11 席 × 2） | 这是 `duty.trigger` 与 `triggerTable.when` 的**结构重复**，由 R3 的「唯一源 + 装配期注入」消除；若同时塞进 shared，就多出第三种写法 |
| `固定必问清单拆成 N 条` 的 N | 5 种（五/六/七/八/九条，12 席各一） | 变化量留在席文件；共享只带两侧固定片段（`…拆成` + `条 checkItem；…`） |
| `越出边界的动作只记录，不自行处置` 的**片段形态**第 13 处（`senior-sdet` 的 boundary 整句内嵌） | 13 处片段 / 12 处整值 | 它不是整值重复（前缀是「业务代码、spec、rule、skill、agent 只读；…」），套 `dutyConstraintDefault` 会拼出重复句；**保留字面** |

因此 **11 席**（`reviewer-product` / `reviewer-interaction` / `reviewer-ui` / `reviewer-frontend` / `reviewer-backend` / `reviewer-ops` / `reviewer-qa` / `reviewer-ai` / `reviewer-security` / `reviewer-actuary` / `reviewer-reader` —— 即 `rationale` **同时**含 `cardRationaleHead` 与 `cardRationaleTail` 的那 11 席。`cardOf` 共 **13** 处调用，其中另 2 席是 `evidence-reader` / `senior-sdet`；再加 2 席不经 `cardOf`（`reviewer-audit` / `detective-observer`），共 **4 席例外**见下表）的 `rationale` 在席文件里写成：

```json
"rationale": "<本席身份句>。${@cardRationaleHead}<N>${@cardRationaleTail}"
```

`<N>` 是该席自己的「五/六/七/八/九」，由席文件给（不进 shared，见上表第 2 行）。**4 席例外（3 类形态），`rationale` 都不套模板**：

| 席 | 例外内容 |
|---|---|
| `reviewer-audit` | `rationale` 是**手写整句**（`agentData.mjs:71`，不含 head/tail）；但它的 `constraint`（`:47`）**是** `dutyConstraintDefault` 的 12 席之一 |
| `evidence-reader` | 有 `cardRationaleHead`、**没有** `cardRationaleTail`（尾段是「自由探索一节不适用（本席只交事实）；输出格式走共享 evidence 合同。」，`:274`）→ 只用 head + 自写尾句 |
| `senior-sdet` / `detective-observer` | `rationale` 整句手写（`:291` / `:260`），不引用任何 shared 键；`senior-sdet` 的 `constraint`（`:290`）是上表第 3 行的片段形态第 13 处，保留字面 |

**`seats/<seat>.json` 结构**（= 现 `agentData` 条目 + 一个 `trigger` 段）：

| 键 | 内容 |
|---|---|
| `name` / `role` / `dimension` / `outputKind` | 逐字照搬现条目 |
| `card` | 只写 **8 键**：`duty` / `scenes` / `signals` / `must` / `never` / `categories` / `checkItems` / `rationale`。**`seat` / `name` / `description` / `tools` 四键不得写**（前三者派生、`tools` 由档位表给；写了会被 `...s` 静默覆盖） |
| `trigger` | `{ when, route, notWhen?, kind? }`。加载期被拆出组装成 `triggerTable[<seat>]`；条目本身不含该键 → `BASE_KEYS` 白名单（`validateAgentData.mjs:105`）与断言 15 不动 |
| `card.duty.trigger` | **必须留键、值恒为空串**（D-a）。非空串 → 拒载，报 `TriggerFieldMisplaced`（exit 1，点名席） |
| `boundary` / `explorePolicy` / `domain` | 仅现已有这三键的席保留，语义不变。**`2026-11-03` T3 补登**：`boundaryBySeat` 提供句子的三席（`reviewer-audit` / `detective-observer` / `senior-sdet`）**不在席 JSON 里存 `boundary`**——唯一源 = policy 定义层（经 `renderBoundary` / `SDET_BOUNDARY` 派生）；只有 `evidence-reader` 的自带句仍留在 JSON（它不在 `boundaryBySeat`）。T1 导出时曾把渲染结果抄进 JSON，导致定义层失单源（`S6-TC-D02/E01/G05` 三条实红后改回） |

### 10.2.3 `@` 语法

| 形态 | 写法 | 规则 |
|---|---|---|
| 整值引用 | 字符串**整体**匹配 `^@[a-z][A-Za-z0-9]*$`（如 `"@dutyConstraintDefault"`） | 以 `shared.json` 该键的值整体替换（可为字符串 / 数组 / 对象） |
| 片段插值 | 字符串内出现 `${@<key>}` | 用该键的**字符串**值替换；一个字符串可含多处 |

插值实现**必须**用函数替换或 `split/join`（`str.replace(re, () => v)` 或先 split 再 join），**禁止**把值直接当 `replace` 的替换串传入——值里若含 `$&` / `$1` 会被当成替换模式（实测：`'前缀${@k}后缀'.replace(/…/g, '成本 $& 与 $1')` 输出 `前缀成本 ${@k} 与 $1后缀`）。这是唯一的实现级硬约束。

四条硬规则（各对应一个错误码，见 10.2.6）：

1. `shared.json` 的任何字符串值内**不得再出现** `@` 或 `${@` → `NestedSharedRef`。这一条本身就是 D-b「单层」的机器形态：引用只能从 `seats/*.json` 指向 `shared.json`，所以**环在数据形态上无法构造**，不另写递归环检测。
2. 键不存在 → `DanglingSharedRef`（点名键 + 席名）。
3. 值为 `""` / `null` / 全空白 / 用于插值却不是字符串 → `EmptySharedValue`（空值一律不当合法空段）。
4. 字符串**以 `@` 开头但不整体匹配 `^@key$`**（含 `@a ${@b}` 这类整值与插值混用）→ `NestedSharedRef`；整值展开后结果内**仍含 `@` 或 `${`** → 同码。（旧写「整值字符串内出现 `${`」在实现里不可达：整值匹配成功时整串不可能含 `$`——`2026-11-03` 计划门 P1-3 改判）

### 10.2.4 展开算法

`seatLoader.mjs` 导出 `expandRefs(value, shared, seat)` —— **装配前一次性、纯函数、无副作用**（不读盘、不改入参、不依赖时间 / 随机 / 环境变量）：

```
字符串 v:
  v 整体匹配 ^@key$            → shared[key]（不存在 → DanglingSharedRef；空 → EmptySharedValue；结果内仍含 @ 或 ${ → NestedSharedRef）
  v 以 @ 开头但不整体匹配 ^@key$ → NestedSharedRef（整值与插值混用 / 非法形态）
  否则 v 含 ${@key}            → 逐处替换（键不存在 / 非字符串 / 空 → 对应码）
数组                         → 逐项递归
对象                         → 逐值递归（键名不展开）
其它                         → 原样返回
```

展开一次性完成：`shared` 侧不再被递归展开（规则 1 已在前置拒绝嵌套）。

### 10.2.5 加载时序与装配点

1. 读 `data/shared.json` + `data/seats/*.json`（**读盘只发生在这一处**）；
1b. **席序与目录形状（读盘前判，`2026-11-03` 施工期补登）**：席序 = `seatLoader.mjs` 的 `SEAT_ORDER`（只表达顺序；与 `seats/*.json` 的文件名集**双向恰等**，缺项 / 多项 → `InvalidInputPath`）；`seats/` 只收文件条目，非文件条目（含名为 `x.json` 的目录）→ 同码；
2. 逐席 `expandRefs`（10.2.4）；
3. 拆出 `trigger` → `triggerTable[<seat>]`（含 `kind` 字段位，R8；本段不校验四值）；`trigger.when` 必须为非空字符串（否则 `MissingWhen`），`trigger.route` 必须为非空字符串（否则 `TriggerMissingRoute`）——**否则 `validateAgentData` 的 route 跳过分支会静默放过**；
4. 写入 `card.duty.trigger = triggerTable[<seat>].when`（D-a；非空残留已在 10.2.2 拒载）；
5. 装配：`{ tools: toolsForSeat(...), ...(boundaryBySeat[...] ? { boundary } : {}), ...s }` —— **`...s` 仍置末**（R7 形态逐字不变，位置从 `agentData.mjs:295` 迁到 `seatLoader.mjs`）；
6. **装配后断言**（`CardKeySetMismatch`，exit 1）：`seats/<seat>.json` 的 `card` 键集**恰等 8 键** = `CARD_KEYS` 去掉 `seat` / `name` / `description` / `tools` 四派生键——少一个、多一个都报；这四个派生键若写进席文件，同样在这一步被拒载（它们本会被 `...s` 静默覆盖，渲染结果与正确数据逐字节相同，V4 抓不到）。**12 键全量不在这步判**：本步产物 `agentData[i].card` 恒 8 键（15/15 席实测），12 键只在 `buildOne` 派生后成立 → 判据落 `check-shared-refs.mjs` 的 `buildCards()` 一圈（§10.2.6）；
7. `agentData.mjs` 薄壳导出三个符号 —— **必须先 `import` 再 `export`**（`import { agentData, triggerTable } from './seatLoader.mjs'; export { agentData, triggerTable };` + 常量 `AGENT_KINDS`），**不得**用纯再导出 `export { agentData } from './seatLoader.mjs'`：`test/card-render.test.mjs:154-159` 会把赋值语句追加到该文件尾部，要求模块作用域内有本地绑定（§10.2.9 表末行）。

### 10.2.6 错误码

`validateAgentData.mjs` 的 `EXIT[1]` 列表追加 4 码：`DanglingSharedRef` / `EmptySharedValue` / `NestedSharedRef` / `CardKeySetMismatch`（后者 = 10.2.5 第 6 步的「席文件 `card` 恰等 8 键 / 派生键拒载」；12 键全量由 `check-shared-refs.mjs` 在 `buildCards()` 产物上判，**不新增码、也不改 `buildOne` 既有码**）；「残留 `duty.trigger`」与「`kind` 写进条目顶层」**复用**既有 `TriggerFieldMisplaced`（不新增同类码）。**`CARD_MODEL_CODES` 仍 36 码零新增**（D16④ 不动）——这 4 码住在 `validateAgentData` 的 `EXIT` 表，不进 `CARD_MODEL_CODES`。

`check-shared-refs.mjs` 的判定面 = **三件**：① 悬空 0（`DanglingSharedRef`）；② 无嵌套（`NestedSharedRef`）；③ `buildCards()` 15 席 `card` 键集与 `CARD_KEYS` 恰等（12 键全量，唯一源）。前两件由 loader 在 import 期抛，第三件只有到 `buildOne` 之后才成立，故必须在本脚本里补判。**`2026-11-03` ④ 段补测改判（实现细节）**：这两个模块必须用**动态 `import()`**——`cardPipeline` 的模块图会触发 `agentData` 的 `loadSeatData()`，静态 import 时坏数据在 import 期即抛、本文件的 `catch` 接不到（实测只剩堆栈，丢掉「码 / 键 / 席」）；失败行固定格式 `check-shared-refs: <码> key <键> / seat <席> => fail`（三样各 ≥1 命中，TC-011 判据）。

`check-shared-refs.mjs` **不进 `npm run check` 的独立门禁段**：loader 在 `import` 期即 **fail-closed**（读盘即校验、坏数据在模块导入时就抛错，不等渲染），而 `agentData.mjs` 现有 29 条 `import` 保证「数据坏了必有一次 import 抛错」→ 门禁自然红。该脚本的用途是 PRD V5 的验收命令（`exit 1` 判据）与施工期定点复核，不建第二个入口。这条兜底**有**专用用例（testcase 里判 `import` 退出码的那条），不是靠推断。

### 10.2.7 「基线更新」指到具体文件（D-c 细化）

| 文件 | 字段 | 写入方式 |
|---|---|---|
| `tools/docgen/baseline.json` | 路径清单 | `node tools/docgen/cli.mjs baseline --write` |
| `tools/docgen/fixtures/<seat>.evidence.json`（仅 Q8 波及的 2 席） | `renderSha256` / `lastWrittenHash` | 重生成后按 `tools/docgen/cli.mjs:521-527` 同式写新 SHA |

只做前者 = 下一次 `replace` 在 `tools/docgen/cli.mjs:484` 报 `EvidenceInvalid`、`:534` 报 `TargetDrift`。

**但这两个码各自依赖「段」**（照抄会踩空，`2026-11-03` r2 测试席实测）：`EvidenceInvalid` 只在 `phase === 'migration'` 分支（`tools/docgen/cli.mjs:483-494`）；`TargetDrift`（`:534`）排在**幂等分支**（`:525-532`）之后——若盘上已等于渲染值，幂等分支先返回 0，`TargetDrift` 永不触发；`change` 段还必填 `--expect-change`（`:543`）。所以「基线不更新会不会炸」这条判据必须按段构造（evidence 哈希、`state.json` 相位、target 字节三者一起摆好），不能只改 `lastWrittenHash`。

**拆 JSON 前的 15 卡冻结基线记在哪**（TC-005 判据③要用，施工者不得靠猜）：取数 = `git show HEAD:agents/<seat>.md | node -e "…sha256…"`（或直接读 `tools/docgen/fixtures/<seat>.evidence.json` 的 `renderSha256` 现值，两者必须相等——`gate` 已在判）。名单落进当次 `impact-sheet.md`（`2026-11-03` T6 实测改判：`docs/superpowers/reviews/<次>/` 只认 8 类文件名且必须带 `observation-rN` 产物（`tools/observation-check/gate-scan.mjs:5` / `:23`），而 `impact-sheet.md` 这个名会被 `scripts/scope-sweep.mjs:80-94` 按 mtime 自动抓成「当次改判清单」——两处门禁都不容它；故本段落点 = 一次性记录 `docs/reports/2026-11-03-s-a-card-sha-baseline.md`，R8 清单仍留 `.session/reviews/2026-11-03-s-a-plan-gate/impact-sheet.md`）。

### 10.2.8 斜杠串（V12）不在本段验收

S-A 的验收 = V4 / V5 / V10（PRD §8 S-A 行）。`when` 里的 `PRD/spec/plan` 随注入原样进 `duty.trigger`，**本段不改文案**；清零归 S-C 的 D3。此处点名，避免施工时误以为要顺手改 `when` 文案而破坏 V4 的逐字节不变。

### 10.2.9 本次触碰的已签件（先登记，施工时同批改）

**源码侧 2 件**：

| 文件 | 动什么 | 为什么必须动 |
|---|---|---|
| `components/cardPipeline.mjs:23` 的 `CARD_KEYS` | 加 `export`，内容与顺序不变 | 「12 键」的唯一实现点；校验器与 loader 要共用它，否则出现第二份 12 键名单（`2026-11-03` 施工期补登：定义已迁叶模块 `cardKeys.mjs`、本文件只 re-export，理由见 §10.2.1 新行） |
| `components/validateAgentData.mjs:13-33` 的 `EXIT` 表 | 追加 4 码（10.2.6） | 不加则 `exitCodeFor` 抛「未知错误码」，新校验器无法 exit 1 |

**测试侧 14 处 / 9 个文件**（这些位置把「`agentData.mjs` 的源文本 / 注释 / 计数」当判据，装配点一迁走或 Q8 一删项它们必红；处置 = 把判据改到新落点，**语义不变**；末 2 处为 `2026-11-03` 施工期实测新增：T5 的 `S3-TC-H06` 回退集、T3 的 `lessons.test.mjs` 行号守卫豁免——后者由 T6 审计发现「plan 已声明、本表未登记」，同批补登）：

| 文件:行 | 它钉住的东西 | 处置 |
|---|---|---|
| `test/tool-tiers.test.mjs:706-712` | `readRepo('…agentData.mjs')` 里 `tools: toolsForSeat(s.name)` **恰 1 处**、其后 400 字符内出现 `...s` | `readRepo` 目标改 `components/seatLoader.mjs`；`S5-TC-D10` 判据文字不变 |
| `test/tool-tiers.test.mjs:146-155` | `agentSrc.includes('toolsForSeat(')`（薄壳后必为 false） | 探针目标改 `components/seatLoader.mjs` |
| `test/tool-tiers.test.mjs:400`、`:450`、`:610-612` | `patchFile('…agentData.mjs', '<条文字面>')` 作反例注入 | 注入目标改 `data/seats/<seat>.json`；「构造前提」断言随之改指 JSON |
| `test/dev-workflow-counts.test.mjs:132-135` | 以 `agentData.mjs` 字面作 patch 前提 | 同上，改指 `data/seats/*.json` |
| `test/dev-workflow-counts.test.mjs:146-155` | `indexOf('  // translation-self-check')` 依赖 `agentData.mjs` 内注释 | **JSON 装不下注释** → 该构造前提改为「按 `seats/senior-sdet.json` 的键路径切块」，或随注释一起退役（二选一，plan 定） |
| `test/sdet-data.test.mjs:40-47` | `agentData.mjs` 里 `name: 'senior-sdet'` 上方 ≤15 行必须有 `translation-self-check` 注释 | **JSON 装不下注释** → 该 test 删除（自评注释改为写进本 spec §10.2.10 与 plan 的施工记录） |
| `test/policy-pure-source.test.mjs:205-211` | `deepEqual(P.workspace, …9 项)` + `Object.values(P).flat().length === 21` / `pathItems()` 22 / `pathTokens()` 23 | Q8 删 3 项后必红：`workspace` 9 → **6 项**；三个计数 21/22/23 → **18/19/20**。处置 = 改这三处数值，并把三个计数写成**关系式**（`flat === pathItems().length - 1`、`pathTokens().length === pathItems().length + 1`，差值恒为 1）；**禁止再写死 21/22/23**。同时 `:266` / `:318` / `:1213` / `:1694` 的渲染面 23 一并改 20。**`2026-11-03` T5 施工期实测改判**：① 四处渲染面的 20 **不写死**，一律改成 `=== pathTokens().length`（派生式，与 A04 同一口径）；② 「四处」不够——以**改造前基线（旧卡 23 项）**为 `before` 的 **7 条 diff 判据**（`J03` / `C01` / `C02` / `H02` / `H03` / `H04` / `H05`）在 Q8 后必然多出 3 条 `minus`，计划门未预见；处置 = 引入 `Q8_MINUS` / `q8Delta()` / `withoutQ8()`，把「差为空」改成「差**恰等于** Q8 三项」（`H03` / `H04` / `H05` 用 `withoutQ8()` 过滤后仍逐项相等），**不放宽成「不看 minus」**；`H02` 的「基线成员 ⊆ 定义层字典」守卫同步豁免这 3 项；③ **「三个计数写成关系式」这条收紧为「只写能红的」**（T5-补，代码审查）——`pathItems().length` 保留一次**绝对数 19**（plan Step 3 原文；它同时是「18 元素 + 1 pattern」的契约），`pathTokens()` 保留 `=== pathItems().length + 1`（等价于「恰一个合写元素」），而 `flat === pathItems().length - 1` **删除**：它是恒真式（`pathItems()` 定义就是 `flat()` 再拼 1），零判别力；`flat` 的 18 由六组 `deepEqual` 的成员集承接。Q8 三项的字面收敛为唯一来源 `test/support/dev-workflow-checks.mjs` 的 `Q8_REMOVED_PATHS`（**禁止**改成「基线减定义层」动态派生——期望值与实测值同源会豁免未批准的删除） |
| `test/support/capability-baseline.test.mjs:12`、`:18` | `readFileSync('agents/reviewer-audit.md')` 读**当前**卡，硬断 `forbiddenPaths.length === 23`（该 test 标题写的是「旧卡 23 项」） | 处置只有一条：**改读冻结来源**——`git show 641a7e7:agents/reviewer-audit.md`（改造前那次提交里的旧卡，`factsFromBaselineText` 实测 `paths 23 / tools 6 / tier producer`）或 `gitShow(sourceCommit)` 的旧卡。**注意 `fixtures/capability-baseline.golden.json` 是 facts JSON（只有数组，没有卡面 markdown），喂不进 markdown 抽取器**——`2026-11-03` 计划门 P2 实测踩过。**不得改读当前卡再断言 23**（Q8 后当前卡是 20，断言必错；且会丢掉「旧卡基线」的独立性） |
| `test/s3-predicates.test.mjs` 的 `S3-TC-H06`（`:768`，② 回退面） | 「整批回到 `<S3-BASE>` → gate exit 0」的回退集只列 predicates / 校验器 / `cli.mjs` / 15 卡 | **`2026-11-03` T5 施工期实测新增（计划门未预见）**：卡面边界段的**内容源**也在定义层（`paths.mjs`），Q8 改了它 → 只回退卡不回退定义层 → 旧卡（23 项）≠ 新渲染（20 项）→ 回退面不可达。处置 = 回退集补 `tools/docgen/policy/definitions/paths.mjs` 一项（`S3_BASE` 上该文件存在，含 `lessons/`） |
| `test/card-render.test.mjs:154-159` | `INJECT_BAD` 把 `;(agentData[0].card.must[0].criterion = …)` **追加到 `agentData.mjs` 文件尾**，要求该模块作用域内有 `agentData` 本地绑定 | **薄壳必须先 `import` 再 `export`**（见 §10.2.5 第 7 步），不得用纯再导出 `export { agentData } from './seatLoader.mjs'`；否则追加语句 `ReferenceError`，多个 S4 用例整片红 |
| `test/dev-workflow-counts.test.mjs:148` | `indexOf('  // 阅读取证员')`（与 `:149` 的 `translation-self-check` 同属一个切块构造，两处注释都依赖 `agentData.mjs` 源文本） | 与 `:146-155` 同一条处置：按 `seats/*.json` 的键路径切块，或随注释一起退役 |
| `acceptance/replace-scenarios.mjs:14`、`:79` | `patch()` helper 把文本替换进 `agentData.mjs` 源文本。**不是死 helper**（`2026-11-03` 计划门 P1-2 实测改判）：`:196` / `:219` / `:232` / `:258` 四处调用 | 处置 = 把 `:14` 的 `DATA` 常量改指 `tools/docgen/data/seats/senior-sdet.json`（`WHEN_OLD` 那时住 `trigger.when`，命中 1），**四处调用保留**，不得删函数留 4 个断头。已知债（不在本段修，登记触发 = 下次修该验收脚本）：`:196` / `:219` 注入的 `改动 = 改组件数据 → …` 句在数据里 0 命中，属 acceptance 既有 `9/11 红` 那笔账 |
| `skills/managing-lessons-store/scripts/lessons.test.mjs:1765-1770`、`:1818-1820` | 「文档里写的 `<file>.mjs:行号` 必须落在该文件真实行数内 + 内容锚定」的行号守卫；`agentData.mjs` 从 327 行字面降为 9 行薄壳后，历史件（PRD / spec / plan / handoff）里 **37 处**指向它的行号引用全部越界 → 整条守卫红 | **`2026-11-03` T3 施工期实测新增（计划门未预见；口径经用户裁定 = 历史件一字不改）**：加 `STRUCT_REPLACED` 结构替换豁免白名单（本批只登记 `tools/docgen/components/agentData.mjs` 一项，每条带生效日期 + 「迁往」说明），被豁免的 37 处**照常计数并打印**（`structSkipped`），不得静默漏扫；豁免条目增员必须在当次 plan 执行记录里点名 |
| `test/policy-pure-source.test.mjs` 的 `S6-TC-E03`（`:953-976`） | 「23 项路径清单副本收敛到 定义层 1 处 + 承载该段的产物」的**期望文件集**恰 3 项 | **T1 施工期实测新增（计划门未预见）**：数据层拆 JSON 后，承载同一段文本的产物多了 `tools/docgen/data/seats/detective-observer.json` 与 `…/reviewer-audit.json`（席 JSON 就是卡面文本的源）→ 期望集补这 2 项 = **5 项**。**`2026-11-03` T3 补登（改回 3 项）**：`boundary` 的唯一源回到定义层（见 §10.2.2 本条上一行），席 JSON 不再承载该段 → 期望集恢复 **3 项**（2 张卡面 + 定义层）；副本数降回 3 正是「单源已恢复」的判据。**不得**改成「排除 `tools/docgen/data/`」——那等于让探针不看源 |

### 10.2.10 本节已定的四条口径（testcase 作者提出的歧义，此处给答复）

> 编号 `D-a`…`D-d` 是**本节的自编号**，与 PRD 的 `D1`–`D17` 无隶属关系；引用时一律写「§10.2.10 D-x」。

| # | 已定口径 | 为什么 |
|---|---|---|
| D-a | `duty.trigger` **保留字段名**，席文件里值恒为空串、装配期写入 `triggerTable[<seat>].when`；**写回非空值 = 拒载报 `TriggerFieldMisplaced`**（不取「静默剔除」分支） | 字段删掉会让 `renderCard` 与既有断言拿不到该键；「静默选一份」正是 PRD 缺陷 6 的形态，必须能被判死 |
| D-b | `@` 只允许**单层**引用（`seats/*.json` → `shared.json`），不支持嵌套（机器判据 = 10.2.3 规则 1） | 嵌套要引入递归与环检测，而实测重复只有一层 |
| D-c | 「基线更新」= `baseline.json` 与 2 席 `evidence.json` 两处同批落盘（10.2.7） | 只重生成卡面不更新 evidence，下一次 `replace` 才炸，离改动很远 |
| D-d | `shared.json` 的键集合 = 10.2.2 实测的 3 键；判定口径为**逐字重复 ≥2 次** | 判据是「真的重复」，不是「看起来通用」 |

## 10.3 界面

不适用（数据层，不改卡面）。

## 10.4 硬约束

1. 席文件 `card` **恰等 8 键**（= `CARD_KEYS` 去派生四键）+ 派生四键拒载 / 无悬空 / 无嵌套（R2；判据 = `CardKeySetMismatch` / `DanglingSharedRef` / `NestedSharedRef`，见 PRD V5）；**12 键全量**由 `check-shared-refs.mjs` 在 `buildCards()` 产物上判
2. 渲染逐字节不变、`gate` exit 0（R9，判据见 PRD V4）
3. 「不得同时为源」= 两半（R3）：①只改 `triggerTable[<seat>].when` 一个字符，`card.duty.trigger` 必随之改变；②`seats/<seat>.json` 里 `card.duty.trigger` 恒 `""`（非空即拒载）。**不引 PRD V12**——V12 判的是四字段斜杠串计数（基线 13），与「同源」无关，且清零归 S-C（§10.2.8）
4. `SCAN_FIELDS` 键数仍 8（R5，判据见 `card-model.test.mjs:1141`）
5. 回退：开工前 `git stash -u`；或 `git checkout -- tools/docgen/` 后复验 `git status --porcelain tools/docgen` 为空（PRD §8 S-A 行）

## 10.5 测试

| 测什么 | 为什么 |
|---|---|
| `@` 展开的悬空 / 嵌套说「不」/ 12 键全量 | 引用一断，渲染期拿到的是空值而不是报错，最隐蔽；嵌套若被静默展开，环检测就永远不需要写，但也永远没人发现 |
| 拆分前后 15 席渲染逐字节相等 | 拆 JSON 最容易把字段顺序 / 类型悄悄改掉 |
| `duty.trigger` 注入后与 `triggerTable.when` 逐字相同 | 同一事实两处的老病，注入写错不会报错、只会让斜杠串漏检 |
| `description` 进扫描面后能报出**指针词 / 硬编码数量 / 程序词**三类码 | R4 的两处实现点缺一即空转。**注意「斜杠串」不在本段可测范围内**：8 个文本码里没有一条识别 `/`（`hasSlash` 只用于 `scenes[].id` / `signals[].type` / `trigger.*` / `check`），斜杠串清零归 S-C 的 D3 / V12 |
| 坏数据在 `import` 期即抛错（fail-closed） | 这是「`check-shared-refs.mjs` 不进总门禁」能成立的唯一理由，必须有一条用例判 `import agentData.mjs` 的退出码，否则该裁决就是口头保证 |
| policy 删 3 项后 2 张卡重生成 + 两处基线同批落盘（§10.2.7） | 删了不重生成 → `gate` 报 `Mismatch`；只写 `baseline.json` 不更新 2 席 `evidence.json` → 下次 `replace` 报 `EvidenceInvalid` / `TargetDrift`。**「检测限度」段的 `lessons/` 不在删除面**（R6），删后该段仍有 2 处命中属预期（**注（S-B，2026-11-03）**：该预期句在 S-B 指针化后**失效**——检测盲区改指策略源 `DETECTION_BLIND_SPOTS`，`lessons/` 已离开卡面，现命中数 = 0；本行「删 3 项路径」的结论不变，仅此数值预期作废） |

**测试用例文件**：`2026-11-03-s-a-data-layer-design-testcase.md`（由 `senior-sdet` 在全新上下文编写；每条用例五要素齐、负例 ≥ 正例）

**只手动验证**：`git stash -u` 回退演练（真实工作区状态，脚本测不出）

**不测**：`renderCard` 的排版细节（属 S-C）、`policy` 内容语义（属 Q8 的 ② 段裁定）

## 10.6 不在这一轮

- 卡面形状改造（三态 / trigger 四型 / 删人设）→ S-C
- 证据栏三列与引句校验器 → S-B
- 本仓专属路径之外的历史路径清理 → 无依据，不做

## 10.7 将来才会撞上的一件事

`trigger.kind` 的四个取值（PRD Q5）在 S-A 只留字段位、不校验；若 S-C 迟迟不开工，数据里可能出现第五个 kind 而无人拦。本轮只在这里点名，以免靠撞上才发现。

## 10.8 与既有 spec 的关系

- **改写** `2026-10-29-agent-card-s4-render-design.md` §5 相关的 `S1-TC-G09` 三条断言（PRD §5 已登记，须 ② 段签收）
- **保留** `2026-10-29-agent-card-s4-render-design.md` 的七段结构、12 键输入契约、渲染列数（4 列）
- **取代** 无
