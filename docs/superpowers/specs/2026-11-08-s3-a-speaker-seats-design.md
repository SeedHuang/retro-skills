# S3-A：议长与答辩方席位（新席数据 + 生成链路）

> 上游：`docs/prd/20261024073606-dev-workflow-mainline/index.md:706`（S3 行现状）、`:246-251`（议长 A 档）、`:363-365`（答辩方构成）
> 边界：`docs/prd/20261026205821-agent-card-contract.md:504`（D-08：docgen 模型原归本 PRD；**2026-11-08 补充裁定**：`tools/docgen` 模型改造与全席重生成由 mainline S3-A 承接，本 PRD S1/S4 不再重复计入该批）
> 到期判据：`docs/after/20261026164718-agent-card-composition-exploration.md:457-475`（D11）
> 用户裁定（2026-11-08）：S3 拆 A/B；答辩方补架构师卡，合计 3 张新卡；**D-08 补充裁定** = docgen 模型改造 + 全席重生成随 S3-A 走（合同 PRD `:504` 同批回写）

## 0. 范围

**本 spec = S3-A**，只做「席位数据 + 生成链路」：

- 新增 3 席：`speaker`（议长）、`respondent-architect`（答辩方 leader）、`respondent-dev`（答辩方研发）
- 一律走当前新链路：`tools/docgen/dsl/agents/seats/<slug>.json` → `seatLoader` → `cardPipeline` → `renderByName`；**不手写 `agents/*.md`，不改 `agentData.mjs` 字面**
- 工具档 / 输出合同 / 写作用域 / 产物归属
- `hostTerm` 主持人 → 议长（本轮只清 `agents/` 与 `tools/docgen/`）
- 18 张卡重生成 + `state.json` / `baseline.json` / `docs/agents` 投影同步 + gate 绿（**含 docgen 模型改造**：2026-11-08 补充裁定，D-08 该批由 S3-A 承接）

**不在本 spec**（归 S3-B，另起 spec）：`skills/parliament/**` 文档拆分（speaker-duties / respondent-duties）、两张矩阵、族映射表、issue-card 级别栏位、`skills/parliament/` 的「主持人」清零。

## 1. 结论先行

1. 三张卡不是"写三份 md"，是三份席数据 JSON；`SEAT_ORDER` 与 `seats/` 目录**双向恰等**，漏登记一处即 `InvalidInputPath`（`tools/docgen/builders/agents/components/seatLoader.mjs:79-83`）。
2. **现有链路没有"新席出生"通路**：`cli.mjs:413`（diff）与 `:518`（replace）对不存在的 `agents/<name>.md` 直接报 `DanglingBaselineEntry`。不补出生分支（§6 D-1），三张卡造不出来。
3. 三个封闭集必须同批扩：`SEAT_ORDER`（`seatLoader.mjs:12-14`）、`SEAT_POLICY`（`policy/seat-policy.mjs:4-9`）、`outputKind` 集合（`components/patternRegistry.mjs`）+ `outputFormats`（`components/outputFormats.mjs`）。
4. 改名是单源改：`dsl/agents/shared.json:5` 一处 → 18 处 `${@hostTerm}` 跟随；写死字面量只剩 5 处需手改（§7）。

## 2. 现状取数

| 事实 | 取数命令 | 结果 |
|---|---|---|
| 席数据 | `Get-ChildItem tools\docgen\dsl\agents\seats -Filter *.json` | 15 份 |
| 角色卡 | `Get-ChildItem agents -Filter *.md` | 15 份 |
| `@hostTerm` 引用 | `(rg -o "@hostTerm" tools/docgen/dsl/agents \| Measure-Object -Line).Lines` | 18 次 / 13 文件 |
| `主持人`（卡产物） | `(rg -o "主持人" agents \| Measure-Object -Line).Lines` | 30 次 / 13 文件 |
| `主持人`（生成源） | `(rg -o "主持人" tools/docgen \| Measure-Object).Count` | 52 次 / 11 文件（`rg -c` 命中行 50；其中 `test/**` 46 次、`card-model/enums.mjs` 词表 1 次属负例素材，不在清零面） |
| `主持人`（议会文档，归 S3-B） | `(rg -o "主持人" skills/parliament \| Measure-Object -Line).Lines` | 29 次 / 10 文件 |

## 3. 三个新席

**术语（本节口径）**

- **族**：议会并卡后的独立问题单元（`problems.md` 的 F 编号）；同族多卡只计一次。
- **席**：`agentData` 里一条角色卡数据（`tools/docgen/dsl/agents/seats/<slug>.json`）。
- **登记面**：约束席位 / 产出的封闭集或字面表，漏登记即门禁红（如 `SEAT_ORDER`、`SUBJECTS`、`.inspector-annotations.json`）。
- **工具档**：由 capabilities 派生的三值 `producer`（read+write+exec）/ `command`（read+exec）/ `readOnly`（read）（`policy/definitions/tiers.mjs`）。

| slug | 定位 | dimension | outputKind | 工具档 | 边界要点 |
|---|---|---|---|---|---|
| `speaker` | 议会程序主持：点将 / 收卡 / 丢卡 / 压卡 / 点名 / 判结束 / 落盘 / 跑计数 / 按族合并 | `程序` | `proceeding`（新增） | `producer` | 不出观点、不写问题卡、不代填两张审计表（那是 `reviewer-audit`） |
| `respondent-architect` | 答辩方 leader：按技术栈分方向，汇总四席核实结论成统一口径 | `架构` | `defense`（新增） | `readOnly` | 只核实与汇总，不改代码；核实表逐条署名 |
| `respondent-dev` | 答辩方研发：单席按项目技术栈换前端 / 后端 / AI 背景 | `研发` | `defense` | `command` | 可跑命令复现问题，不改代码 |

`trigger.kind`：`speaker` = `dispatch`；两个 `respondent-*` = `need`（四值来源 `tools/docgen/builders/agents/check-trigger-kind.mjs:3-8`）。

## 4. 新席创建链路（唯一方式）

1. 新建 `tools/docgen/dsl/agents/seats/<slug>.json`：顶层 7 键 `name` / `role` / `dimension` / `outputKind` / `card` / `boundary` / `trigger`（`boundary` 必填、非空串且 ≠ `DEFAULT_BOUNDARY`；装配后条目键集 ⊆ `validateAgentData.mjs:111` 的 `BASE_KEYS`）；`card` **只写 8 键**（`duty` / `scenes` / `signals` / `must` / `never` / `categories` / `checkItems` / `rationale`），`duty.trigger` 恒为空串（`docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md:80-88`）。**三新席的卡数据不得引用 `${@hostTerm}`**：引用会多出 3 处归属，打破 §7 的「18 处 / 13 文件」口径，且步骤 9 只重草稿 13 席、漏新席 → 步骤 10 `generate` 必红。
2. `seatLoader.mjs:12-14` 的 `SEAT_ORDER` 追加 slug（顺序 = `docs/agents/README.md` 行序）。
3. `policy/seat-policy.mjs` 登记档位与写权（§9）。
4. `patternRegistry.mjs` 的 `outputKind` 集合与 `outputFormats.mjs` 同步新增 kind（§8）。
5. `tools/docgen/builders/agents/state.json` **一次登记三席** `"<slug>": "replaced"`：`collectGate` 对 `agentData` 每一席都要求 state 有键（`cli.mjs:138-143`），漏登会在 `state.json` 上产生 `Mismatch`，而该路径不在 `allowed()` 放行面。
6. 三席各跑一次 `node tools/docgen/builders/agents/cli.mjs draft --kind agent --name <slug>`，草稿落进草稿箱：逐席出生时另两席的卡还不存在，`collectGate` 会对它们报 `DanglingBaselineEntry`；`allowed()` 只在「state 已 `replaced` 且草稿箱里有与该席渲染逐字节相等的草稿」时放行（`cli.mjs:497-508`）。
7. `node tools/docgen/builders/agents/cli.mjs baseline --write`（1 rule + 18 卡）：`gate` 与 `replace` 共用的判别子先比 baseline 全文（`cli.mjs:115-116`），不先写即 `BaselineDrift`。
8. 逐席出生（三席串行）：`node tools/docgen/builders/agents/cli.mjs replace --kind agent --name <slug> --draft <draft> --yes --new`（§6），**每出生一席立刻**跑 `generate --kind agent --name <slug> --readme --apply`。原因：首席落地即入 `landedSeats`（`cli.mjs:154-155`），`collectGate` 随即要求 `docs/agents/<slug>.md`（`:170-173`），而 `allowed()` 只放行 `agents/*.md`（`:497-508`）；带 `--name` 时 `generate` 只比该席卡（`:56-57`），`--readme` 段一次写全 18 份 + README（`:91-100`），未落地席的投影在 `collectGate` 里被跳过（`:170-171`），README 全落地才比对（`:176`）。
9. 存量 13 卡的重生成（改名的必然结果，**必须排在步骤 8 之后**）：`shared.json:5` 一改，13 张卡渲染即变（`cli.mjs:151-153` 逐字节比）；若在出生前改，步骤 8 的第一次 `replace --new` 会被这 13 处 `Mismatch` 挡住。次序固定为：① 改 `shared.json:5` + 手改串（§7）；② **13 席先各跑一次 `draft --kind agent --name <seat>`**——`allowed()` 只放行「有逐字节匹配草稿」的他席（`cli.mjs:497-508`），不先批量出草稿，第一个 `replace` 必被其余 12 席挡住；③ **立刻跑一次 `generate --kind agent --name <不受改名影响的席> --readme --apply` 刷新投影**——投影由数据渲染（不读卡）；不刷新时，第一席 `replace` 成功后即进入 `landedSeats`（`cli.mjs:151-155`），下一次 `replace` 会因 `docs/agents/<该席>.md` 仍是旧渲染而报 `Mismatch`（`:170-175`），而 `allowed()` 不放行 `docs/` 路径（`:497-508`）。取 `speaker`（其卡数据不得引用 `${@hostTerm}`），该命令只比这一席（`:56-57`）故可 exit 0；若所选席也漂移，改用 `generate --readme --apply`（会因 13 张卡漂移 exit 1，但投影已写，属可接受的非零退出）；④ 逐席 `diff` → `replace --kind agent --name <seat> --draft <draft> --yes --expect-change <渲染 sha>`，`--rejudge` 按 `touchedSemanticKeys(盘上, 渲染)` 逐卡实算（`cli.mjs:345-364`：`description:` → A2，`trigger.when` 注入后的「## 职责」段 → A1，故**12 卡实算为 `A1,A2`**；`reviewer-audit` 旧称只在边界句、实算为 `[]`，用 `--rejudge none`）。重判值先写回 `tools/quality/.inspector-annotations.json`（键形 `<seat>:A1` / `<seat>:A2`；`buildJudged` 在 `cli.mjs:387-399` 读它），判者用 `DOCGEN_JUDGED_BY` 显式给出（`cli.mjs:378-386`）。`--apply` 不授权卡落盘（`cli.mjs:50-51`）。
10. 收口：`generate` 全量比对（18 卡）→ `generate --readme --apply`（`docs/agents` 投影终态）→ `gate`。

## 5. 单源改动清单

| 文件 | 改什么 | 为什么 |
|---|---|---|
| `dsl/agents/seats/{speaker,respondent-architect,respondent-dev}.json` | 新增 3 份 | 席位的唯一数据源 |
| `components/seatLoader.mjs:12-14` | `SEAT_ORDER` 15 → 18 | 与目录双向恰等，否则 `InvalidInputPath` |
| `policy/seat-policy.mjs` | 加 `speaker` / `respondent-dev` / `respondent-architect` 三条 | 档位派生 `tierBySeat` 只看这里；`SEAT_NAMES` 有而此处缺会在 import 期 `TypeError`（`components/patternRegistry.mjs:40-42`） |
| `components/patternRegistry.mjs` | `outputKind` 集合加 `proceeding` / `defense` | 封闭集，缺则 `InvalidOutputKind` |
| `components/outputFormats.mjs` | 加两份 `{fields[], checks[]}` | 卡面输出格式段 |
| `dsl/agents/shared.json:5` | `hostTerm` 改「议长」 | 18 处引用跟随 |
| `policy/definitions/writeScopes.mjs` | `hostRule` 文本改「议长」；新增 `review.host` scope（`roleKind: '程序主持'`、`label` 账本程序账、`hostRule` 可写 `progress.md`、**`excludePathItems: []`**；`roleKind` / `label` 不得含 display「议长」） | `speaker` 的 `artifacts: progress.md` 需要匹配的写作用域；不新增则回落 `review.ledger`，HOST_RULE 会写「不得写 `progress.md`（只由议长写）」，同席自相矛盾（`renderBoundary.mjs:94/167`）；`validatePolicy.mjs:230` 对每个 scope 强制 `excludePathItems` 为数组，缺即 `UnknownPolicyRef` |
| `components/validatePolicy.mjs:219,223` | scope 集合 2 → 3，加入 `review.host`（`:219` 的恰二断言与 `:223` 的排除白名单同步） | 否则新 scope 直接 `ForbiddenGroupGranted` |
| `policy/definitions/artifacts.mjs:1-2` | 注释改「议长」；`owner: 'host'` 不动 | `host` 是不变量 3 例外①，语义 = 议会主持席 |
| `policy/definitions/seats.mjs` | 加 3 席的 `display`（议长 / 架构答辩 / 研发答辩）；`speaker` 另写 `writeScope: 'review.host'` | 不变量 1：`SEAT_POLICY` 的键必须 ⊆ `SEATS` 且有非空 `display`（`components/validatePolicy.mjs:97-100`）；`tierBySeat` 由 `SEAT_NAMES` 派生（`components/patternRegistry.mjs:40-42`） |
| `components/validateAgentData.mjs:114` | `DECLARED_SLOT_SEATS` 加 3 席 | 未登记的席带 `boundary` 会报 `DescriptionDerivation`（`:122-124`） |
| `card-model/subjects.mjs:8-29` | `SUBJECTS` 加 3 条 `<slug>.card`（`speaker.card` / `respondent-architect.card` / `respondent-dev.card`） | 该表是 15 席字面登记、明确不从 `agentData` 派生（`:11-13`）；缺条目时 `renderSeat` 抛 `UnverifiableOutput`（`validateCardModel.mjs:382-383`、`cardPipeline.mjs:130-131`），新席连卡都渲染不出；`card-render.test.mjs:1093-1096` 逐席断言 |
| `components/validatePolicy.mjs:255-261` | 显示名扫描面由「`writeScopes.mjs` 全文」收窄到 `roleKind` / `label` 两个结构化字段 | 现按全文 `includes(display)` 判 `SeatNameInDefinition`；§9 的 `display: '议长'` 与 §5 的 `hostRule: '议长'` 同词，不收窄则登记新席必红 |
| `tools/quality/.inspector-annotations.json` | 加 3 席 × 10 键（A1 / A2 / B1–B4 / C1–C4）共 30 条 `pass` | `check-agent.mjs:15/164-168` 缺键即 pending → `npm run check` 红；S3A-14 与 TC-51 不可达 |
| `builders/agents/state.json` | 加 3 条 `replaced` | gate 对每席要求 state 有键（⊇），缺席即 `Mismatch`（`cli.mjs:140-143`）；键不在 `agentData` → `StateFileInvalid`（`state.mjs:33`），故登记面必须与 18 席恰等 |
| `builders/agents/baseline.json` | 重写 | `agentPaths()` 派生，1 rule + 18 卡 |
| `builders/agents/fixtures/*.evidence.json` | 新席各一份，字段见 §6 | `readEvidence` 缺文件即 `EvidenceInvalid`（`evidence.mjs:61-63`）；此后每次 `replace` 都要读它 |
| `builders/agents/check-trigger-kind.mjs:15-16` | 前缀判定改显式议会席集合（§10） | `speaker` / `respondent-*` 不以 `reviewer-` 开头，会被误判「非议会席只许 need」 |

## 6. D-1：新席出生分支（必须补，否则造不出卡）

**现状**：`cli.mjs:518` 在 `replace` 里硬读 `agents/<name>.md`，不存在即 `DanglingBaselineEntry`；`diff` 同（`:413`）。新席没有旧卡，迁移段四道证明（`cli.mjs:483-493`）也无对象。

**补法**（最小改动，不新增子命令）：

- `replace` 增加 `--new`：`REPLACE_FLAGS` 白名单（`cli.mjs:600`）加 `'--new': BOOL`，`main()` 的 `cmdReplace({...})`（`:680-687`）补传 `new: a['--new'] === true`——只加白名单不透传，分支仍不可达。显式前置：目标卡不存在，**或**目标卡已存在但逐字节 = `renderByName(name)` 且 evidence 缺失（崩溃收敛，见下条）；其余「目标卡存在」→ `InvalidArgs`（exit 2）。未带 `--expect-change` / `--rejudge`（带了 → `InvalidArgs`，exit 2）；state 前置由 `collectGate` 兜住——state 未登记时漂移落在 `state.json` 上，不被 `allowed()` 放行 → 出生不可达（`cli.mjs:509-513`）。
- **改判登记**：本条推翻骨架 spec C7「不采纳 `replace --first-install`」（`docs/superpowers/specs/2026-10-24-dev-workflow-skeleton-design.md:176`，理由是「只用一次的旗标，永久维护成本」）。该前提在可重复出生（三席 + 后续增席）下已不成立：`--new` 是每条增席链路的常驻入口，改由它承接；骨架 spec C7 同批加注「2026-11-08 由 S3-A 改判」。
- 因 state 已 `replaced`，`phase === 'change'`（`cli.mjs:465`）。`--new` 分支只保留 `:496-513` 的 `collectGate` / `allowed()` 与 `:565-584` 的写盘，**逐行跳过**：`:481` `readEvidence`（文件不存在，读了即 `EvidenceInvalid`）、`:483-494` 迁移段四道证明、`:518-521` 硬读目标、`:525-532` 幂等分支（须先读 `targetBytes`）、`:534` `TargetDrift`、`:541-562` 凭证与重判（`--expect-change` / `--rejudge` / `buildJudged` / `machineChecksOf`）、`:577-583` `changes` 追加（出生不是变更）。
- 仍校验 `draftBytes.equals(renderByName(name))`（`:479-480`）；不等 → `DraftDrift`（exit 1）。
- 写盘后新建 evidence（不读旧件）：`commit` = `git rev-parse HEAD`，`blob` / `hashObject` = `git hash-object --no-filters agents/<slug>.md`，三者 40 位小写 hex（`evidence.mjs:12` 的 `HEX40`）；`sha256` / `renderSha256` / `lastWrittenHash` = 写盘字节的 sha256，64 位**大写** hex（`evidence.mjs:13` 的 `SHA = /^[0-9A-F]{64}$/`；`sha256Hex` 已在 `cli.mjs:43` 做 `toUpperCase()`）；`goldenAssertion: 'pending'`（出生未跑黄金断言，不得写 `pass`；`evidence.mjs:75` 接受 pending，`init-evidence.mjs:31` 与既有 fixture 同口径）、`compareResult: null`、`changes: []`。
- 写盘次序不变：`.part` → rename → `setAgentState('replaced')` → `writeEvidence`（`:565-584`）。
- **崩溃收敛**：分支插在 `cli.mjs:465`（phase 判定）之后、`:471`（`DraftNotFound`）之前，且必须早于 `:496` 的 `collectGate`。条件 = 目标卡存在且逐字节 = `renderByName(name)`、evidence 缺失；命中时以 `sha256Hex(rendered)` 自算 `sha256` / `renderSha256` / `lastWrittenHash`（`:521` 的 `newSha` 在该分支不可用），补写 evidence 后返回 0。崩溃窗口里草稿已被 `:574 clearDrafts` 删除、该席 docs 尚未生成——排在 `:471` 或 `:496` 之后都会先撞 `DraftNotFound` / docs `Mismatch`。其余情形按失败面退出。
- 出生依赖 §4-6 的草稿预置：`collectGate` 对另两席（卡尚未出生）报 `DanglingBaselineEntry`，`allowed()` 只在「state 已 `replaced` 且草稿箱里有与该席渲染逐字节相等的草稿」时放行（`cli.mjs:497-508`）。
- `collectGate` 的 `allowed()` 不改（target 无条件放行，`cli.mjs:498`）。

## 7. D-2：`hostTerm` 改名

- 唯一源：`dsl/agents/shared.json:5` 的 `"hostTerm": "主持人"` → `"议长"`。
- 跟随面：18 处 `${@hostTerm}`（11 席 `trigger.when` + `reviewer-audit` 的 `rationale` 1 处 + `detective-observer` 6 处）自动变。
- 手改面：`writeScopes.mjs:8`（同一句两处）、`artifacts.mjs:1-2`、`check-trigger-kind.mjs:4` 的注释/描述串。
- `card-model/enums.mjs:81` 的 `MIXED_PAIR = ['议长','主持人']` **保留**（S3-A 只保证卡面不再出现旧称；删词条归 S3-B）。
- 清零口径（A 段，按**出现次数**现算）：`(rg -o "主持人" agents | Measure-Object -Line).Lines` = 0；`(rg -o "主持人" tools/docgen --glob '!**/test/**' --glob '!**/card-model/enums.mjs' | Measure-Object -Line).Lines` = 0。不用 `rg -c`（零命中无输出、退出码 1，判不了 0）。保留面 = `card-model/enums.mjs:81` 的 `MIXED_PAIR` 词条（删词条归 S3-B）+ `test/**` 的 46 处负例断言（测试自己留旧称当反例，不是泄漏）。`skills/parliament`（29 处）归 S3-B。

## 8. D-3：两份新输出合同

`proceeding`（议长程序账）

- `fields`：轮次号 / 起止（HH:MM:SS）/ 席位 / 收卡数 / 丢卡与压卡及理由 / 点名 / 判结束依据 / 落盘路径
- `checks`：每轮一行；丢卡压卡理由非空；计数与卡文件实数一致；时间取 `scs time`

`defense`（答辩记录）

- `fields`：卡号 / 核实结论（确认存在｜确认不存在）/ 证据（原文摘句 + 文件 + 行号）/ 立场（承认｜带依据反驳｜部分承认）/ 修法落点 / 署名席
- `checks`：核实结论必填；证据三列非空；反驳必带依据；四席核实表逐条可追到署名席

**机判口径**（供 testcase 用）：`fields` / `checks` 只按「`outputFormats` 键集 = 7、两份新 kind 存在、数组非空且元素为字符串」判；逐字文案由议会 #2 人工核，不设字面量断言。

## 9. D-4：工具档与写权

| 席 | capabilities | allowGroups | artifacts | 派生档 |
|---|---|---|---|---|
| `speaker` | `read` `write` `exec` | `check.local` `git.read` `docgen.read` | `progress.md` | `producer` |
| `respondent-dev` | `read` `exec` | `check.local` `git.read` | — | `command` |
| `respondent-architect` | `read` | — | — | `readOnly` |

三席均须在 `policy/definitions/seats.mjs` 登记 `display`（议长 / 架构答辩 / 研发答辩）；**`boundary` 写在各席 JSON 顶层**（`seatLoader.mjs:112` 以 `...s` 合并，`boundaryBySeat` 只承接模板渲染的三席）。不得走 `DEFAULT_BOUNDARY` 的「只读评审角色」句：`speaker` 有写权限、`respondent-dev` 要跑命令，套默认句会与工具档自相矛盾。

档位表 `TIERS` 不新增（`policy/definitions/tiers.mjs`）；`writeScopes` 的 `review.ledger.hostRule` 改「议长」。`speaker` 的写作用域 = `review.host`（§5 新增），与 `artifacts: progress.md` 对齐；不得复用 `review.ledger`。

## 10. 守卫修复：议会席判定

`check-trigger-kind.mjs:15-16` 用 `PARL_PREFIXES = ['reviewer-','detective-']` 现算非议会席。新席三个 slug 都不带这两个前缀 → `speaker` 声明的 `dispatch` 会被判 `非议会席只许 need` 而红。

改法：把 `cardPipeline.mjs` 的 `NON_PARL_SEATS = ['evidence-reader','senior-sdet']` 导出为唯一源，`check-trigger-kind.mjs` 改读它（`isParliamentSeat = !NON_PARL_SEATS.includes(name)`），删前缀推断。这样第 16 席之后不再漏检，也不再误判。

同一处前缀判定还写在 `test/sc-card-shape.test.mjs:450-457`（SC-TC-38：`!startsWith('reviewer-') && !startsWith('detective-')`），新 slug 会让它算出 5 席并与 `buildEnv().parliamentSeats` 的补集不等；同批改为直接比对 `NON_PARL_SEATS`。

## 11. 已签件改动（同批改，否则必红）

| 断言 | 现值 → 新值 | 原因 |
|---|---|---|
| `test/card-render.test.mjs:198` | 5 个 outputKind → 7 | 新增 `proceeding` / `defense` |
| `test/policy-pure-source.test.mjs:1167` | `own.size === 4` → 7 | 三新席各带专用 `boundary`；**测试内显式列 7 席**（4 现值 + 3 新席），不从 `DECLARED_SLOT_SEATS` 派生——该常量在 `validateAgentData.mjs:114` 是函数内局部、未导出；**不得**把新席塞进 `boundaryBySeat`（那会套模板句） |
| `test/policy-pure-source.test.mjs:1168` | 不改（`defSeats === 11`） | 18 − 7 自带 = 11 |
| `test/policy-pure-source.test.mjs:416 / :504 / :1268` | 按登记面重算为 7 / 6 / 6 | `dumpPolicy.seats` 7 键、`tierBySeat` 6 席、配置层 6 席名单（`SEAT_POLICY` 增 3 条键） |
| `test/sc-card-shape.test.mjs:372-377` | kinds `{dispatch:11,occasion:1,moment:1,need:2}` → `{dispatch:12,occasion:1,moment:1,need:4}` | 新席 kind 声明（speaker=dispatch，两个 respondent=need） |
| `test/sc-card-shape.test.mjs:450-457` | 前缀现算非议会席 → 读 `NON_PARL_SEATS` | §10 同一根因 |
| `test/sc-card-shape.test.mjs:420-436` | SC-TC-36 判据翻转：`archivist`（不在 `NON_PARL_SEATS`）写 `dispatch` → **改为绿**；红态另立一条（把 `archivist` 加入 `NON_PARL_SEATS` 后写 `dispatch` → 红） | §10 去前缀后「无前缀 = 非议会席」不再成立，旧判据会把正确实现判红 |
| `test/sc-card-shape.test.mjs:670-678` | SC-TC-43：`shared.hostTerm === '议长'`；`shared.json` 内旧称计数 = 0、新称计数 = 1 | §7 单源改名；现断言旧称 |
| `test/sc-card-shape.test.mjs:712-730` | SC-TC-47：探针词换成「议长」之外的未用词（如 `主持席`），替换源改 `"hostTerm": "议长"`；`:717` 的 `split('主持人')` 同步改 `split('议长')`；真仓 18 卡不得含探针词 | 现以旧串作替换源，改名后是空操作；`:717` 不改会恒 0 = 假绿 |
| `test/sc-card-shape.test.mjs:732-742` | SC-TC-48：副本把 `"hostTerm": "议长"` 改成探针词，断言 gate 红 + `Mismatch`；真仓 gate 0 | 同上，旧串替换源失效 |
| `test/card-render.test.mjs:329-338` | S4-TC-C06 翻转：侦探卡「议长」≥ 1 且「主持人」= 0（渲染投影同判） | §5.2 目标已改为统一「议长」 |
| `test/dev-workflow-counts.test.mjs:67` + `test/support/dev-workflow-checks.mjs:235` | 探针正则 `(14|15)` → `(14|15|17|18)`；落点实为 `support/dev-workflow-checks.mjs:235`，`:67` 只是断言消息 | 防新席后被旧字面量绕过 |
| `test/sc-card-shape.test.mjs:705-710` | SC-TC-46（一次性档 `SB_SHAPE_ONESHOT=1`）旧称总数「= 30」：默认档 skip、不阻断 check；重跑须改 0 或标作废 | 改名后仅一次性档重跑时红 |
| `test/sc-card-shape.test.mjs:906` | SC-TC-57（一次性档）改后侧旧称「仍 30」：同上，标作废或改 0 | 同上 |
| `test/tool-tiers.test.mjs:397-407` | S5-TC-B08 改为只遍历 `Object.keys(boundaryBySeat)`（不遍历全部 `producerSeats()`） | `speaker` 是 producer 但自带 boundary、不进 `boundaryBySeat`；不改为必红（`:402/:404`） |
| `test/s2-card-rewrite.test.mjs:853-862` | S2-TC-G05 的卡数锚定 S2 提交事实 15，不与 `SEATS().length` 比 | 18 席后必红 |
| `test/policy-pure-source.test.mjs:491-493` | S6-TC-B01⑩ 删写死三席数组，复用下行 `[...SEAT_NAMES].sort()` | 18 席后必红 |
| `test/card-render.test.mjs:50,960,1003` | 不改 | 均派生自 `SEATS.length` |
| `test/s3-predicates.test.mjs:704` | 不改 | `compared === SEATS.length` 派生 |

## 12. 验收项

每条对应 testcase 中同 ID 的用例（testcase 由独立 `senior-sdet` 在全新上下文编写，文件名 `2026-11-08-s3-a-speaker-seats-design-testcase.md`）。

| ID | 验收 | 判据 |
|---|---|---|
| S3A-01 | 三份席数据在位且合法 | 3 文件存在；`card` 恰 8 键；`duty.trigger === ''`；各自 `boundary` 非 `DEFAULT_BOUNDARY` |
| S3A-02 | 席序 ↔ 目录双向相等 | `SEAT_ORDER` 18 项；删一份/多一份均 `InvalidInputPath` |
| S3A-03 | trigger.kind 守卫按显式集合 | `check-trigger-kind` 首行 `bad 0`；`speaker` 不被判非议会席 |
| S3A-04 | 三席档位派生正确 | `dumpPolicy.seats` 含三席；`tierBySeat` 派生 `speaker=producer`、`respondent-dev=command`、`respondent-architect=readOnly` |
| S3A-05 | 输出合同 7 份结构化 | `outputFormats` 键集 = 7；两个新 kind 各有非空 `fields` 与 `checks` |
| S3A-06 | 新席出生通路可用 | `replace --new` 成功；`agents/<slug>.md` 出现且逐字节 = 渲染 |
| S3A-07 | `--new` 负例 | 已有卡的席加 `--new` → `InvalidArgs`，exit 2，不写盘 |
| S3A-08 | 改名单源生效 | 18 处 `${@hostTerm}` 渲染为「议长」；卡面无「主持人」 |
| S3A-09 | 旧称清零（A 段范围） | `(rg -o "主持人" agents \| Measure-Object -Line).Lines` = 0；`(rg -o "主持人" tools/docgen --glob '!**/test/**' --glob '!**/card-model/enums.mjs' \| Measure-Object -Line).Lines` = 0 |
| S3A-10 | 18 卡逐字节一致 | `generate` exit 0，`agents/*.md` == 渲染 |
| S3A-11 | 门禁绿 | `cli.mjs gate` exit 0，首行 `baseline N/N`，N = 1 + 18 |
| S3A-12 | state 键集完整 | `state.json` 18 席全 `replaced`，键集 ⊆ `agentData`（多键 → `StateFileInvalid`，`state.mjs:33`） |
| S3A-13 | 人读投影齐 | `docs/agents` = 18 份 + `README.md` |
| S3A-14 | 全仓检查绿 | `npm run check` 末行 `check 全部通过` |

## 13. 差异清单（相对 2026-11-08 现状）

| # | 改了什么 | 为什么 | 位置 |
|---|---|---|---|
| 1 | 新增 3 席数据 | 议长与答辩方独立化（F-10 / F-11） | `dsl/agents/seats/` |
| 2 | `SEAT_ORDER` 15 → 18 | 席集唯一源的顺序登记 | `components/seatLoader.mjs:12-14` |
| 3 | 新增 `proceeding` / `defense` | 两种新产出没有现成合同 | `components/outputFormats.mjs`、`components/patternRegistry.mjs` |
| 4 | 新增“新席出生”分支 | 原链路只支持"已有卡的席改内容" | `cli.mjs:453-576` |
| 5 | 议会席判定去前缀化 | 新 slug 不带 `reviewer-`/`detective-` | `check-trigger-kind.mjs:15-16` |
| 6 | `hostTerm` 改「议长」 | 用户裁定改名；单源改，18 处跟随 | `dsl/agents/shared.json:5` |
| 7 | 4 处已签断言同批改 | 6 个封闭集/计数面被扩 | 见 §11 |

## 14. 回退

`s3-a` 单分支落地：回退 = `git revert` 本批提交后跑 `node tools/docgen/builders/agents/cli.mjs gate` 与 `npm run check`，两者均应回到现状绿；`state.json` / `baseline.json` / `docs/agents` 随提交一并回退，不做手工修补。
