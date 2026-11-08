# 测试用例：S3-A 议长与答辩方席位（设计）

> 归属 spec：`docs/superpowers/specs/2026-11-08-s3-a-speaker-seats-design.md`（唯一判据来源）
> **编写者 = 独立 `senior-sdet` 实例（全新上下文）**
> **独立性声明**：本文件由独立 `senior-sdet` 在全新上下文编写；作者 ≠ spec 作者（spec 作者 = 主 agent）≠ 施工者。编写期间只读 spec、范本 testcase、`tools/docgen/**` 真实代码与仓内现状，**未改 spec、未改任何源码、未执行任何 git 写操作**；本次唯一写入产物 = 本文件。
> 命名与落点：与 spec 同目录；文件名 = spec 文件名去 `.md` 后 + `-testcase.md`。
> 状态：**设计版（施工前，已对齐 spec 修订版）**｜最后更新：`2026-11-08`｜用例条数：**正 17 / 负 33 / 边界 21 = 71**（现算见 §1.1；负 + 边 54 ≥ 正 17）。
> 术语对照：**判据**（可机判的一条义务）；**探针**（probe，取数来源，如退出码 / 首行 / 文件哈希）；**绿 / 红**（通过 / 不通过）；**副本**（在 `%TEMP%` 复制仓内文件后改坏，不碰真仓）；**出生**（新席首次生成 `agents/<slug>.md` 的分支，spec §6 D-1）。

## 0 判据约定（全表复用；命令在**仓根**执行，Shell = PowerShell 5，`exit` 指进程退出码）

| 代号 | 命令 / 形态 | 备注 |
|---|---|---|
| `CLI` | `node tools/docgen/builders/agents/cli.mjs <sub> ...` | 子命令 `generate` / `gate` / `diff` / `draft` / `replace` / `baseline --write` / `policy --dump` / `check-agents`（`cli.mjs:662-700`） |
| `TK` | `node tools/docgen/builders/agents/check-trigger-kind.mjs` | 判首行 `check-trigger-kind: seats N / kinds {...} / bad n => ok\|fail`（`check-trigger-kind.mjs:32`） |
| `POLICY` | `node tools/docgen/builders/agents/cli.mjs policy --dump` | 输出 `dumpPolicy` JSON；`seats[<slug>] = {display, expanded[15]}`，`expanded[1]` = 派生档位（`policy-pure-source.test.mjs:1277`） |
| `TEST` | `node --test --test-name-pattern "<用例名>" <测试文件>` | 只取数；不当 `npm run check` 的替代 |
| `CHECK` | `npm run check` | 门禁总入口；判末行 `check 全部通过` / `check 未通过`（`scripts/check-all.mjs:562,565`） |
| `PROBE` | 在仓根 / 副本根写 `probe-<id>.mjs`（`node:assert/strict` 断言 + 末行 `console.log('S3A-TC-<id> ok')`），跑 `node probe-<id>.mjs` | 用完即删；仓内不留探针 |
| `COPY` | 按 `test/support/card-fixtures.mjs:46-69` 的 `coldRepo` 同款口径复制（`git ls-files` + `git ls-files --others --exclude-standard`，含 `docs/agents`）到 `%TEMP%\s3a-<id>\`，并**额外复制 `.git` 目录（只读）**；草稿目录显式指向副本：`$env:DOCGEN_DRAFTS_DIR = "<副本>\.drafts"` | 真仓只读；副本内不跑 git 写操作。**不复制 `.git` 会让出生用例在 `git rev-parse HEAD` / `git hash-object` 处假红**（spec §6 第 3 条依赖这两条命令）。 |
| `COUNT` | `$n = @(<取数表达式>).Count; if ($n -ne <期望>) { exit 1 }` | 不用 `rg` / `Select-String` 的进程退出码当判据 |
| `HASH` | `(Get-FileHash <path> -Algorithm SHA256).Hash` | 比较写盘前后是否变化 |

### 0.1 施工前现状基线（取数命令 + 输出首行；施工后这些数应变）

| 项 | 现值 | 取数（首行可复算） |
|---|---|---|
| 席数据 | 15 份 | `(Get-ChildItem tools\docgen\dsl\agents\seats -Filter *.json).Count` → `15` |
| 角色卡 / 人读投影 | 15 / 16（含 `README.md`） | `agents=15 docs=16 seats=15` |
| `SEAT_ORDER` | 15 项 | `components/seatLoader.mjs:12-14` |
| `baseline.json` | 16 条（1 rule + 15 卡） | `baseline.json` 全文；`components/baseline.mjs:9` |
| `outputFormats` 键集 | 5 个 | `components/outputFormats.mjs:20-72` |
| `patternRegistry.outputKind` | 5 个 | `components/patternRegistry.mjs:56` |
| `check-trigger-kind` 首行 kinds | `{dispatch:11,occasion:1,moment:1,need:2}` | `test/sc-card-shape.test.mjs:377` |
| `state.json` | 15 席、全 `replaced` | `tools/docgen/builders/agents/state.json:3-19` |
| `主持人`（生成源，出现次数） | 52 次 / 50 命中行 / 11 文件；排除 `test/**` 与 `enums.mjs` 后 = 5 次 | `(rg -o "主持人" tools/docgen \| Measure-Object -Line).Lines` → `52`；`(rg "主持人" tools/docgen \| Measure-Object -Line).Lines` → `50`；`(rg -c "主持人" tools/docgen \| Measure-Object -Line).Lines` → `11`（每文件一行，不是总数） |
| `主持人`（卡产物，出现次数） | 30 次 / 13 文件 | `(rg -o "主持人" agents \| Measure-Object -Line).Lines` → `30` |

### 0.2 用例写作口径（写错就假红 / 假绿）

1. **「绿」只认三件事**：`exit 0`、首行正则 / 全等、文件字节或哈希；不认「看起来像通过」。
2. **`N` 的口径 = `BASELINE_RULES.length + agentPaths().length`**（`baseline.mjs:9,17-19`）；施工后 = **1 + 18 = 19**，`gate` 首行 `baseline 19/19`（`cli.mjs:237`）。
3. **数据层拒载的退出码口径**：`loadSeatData` 在 `agentData.mjs:6` 的**模块 import 期**执行，抛错发生在 `main` 的 `try/catch` 之前 → Node 未捕获异常默认 `exit 1`，**不能**断言 `exitCodeFor` 表里的 1/2。故本轮所有「loader 拒载」类用例一律判 **`exit ≠ 0` 且 stderr 含该错误码**（spec 未钉死此情形退出码，不自行发明）。
4. **`InvalidArgs` / `DanglingBaselineEntry` / `EvidenceInvalid` / `InvalidInputPath` 的 2 与 `NotAuthorized` 的 4**，只用于经 `main` 派发后抛出的路径（`cli.mjs:701-714`）；用例里逐条写明期望退出码。
5. **`dumpPolicy` 的档位读取口径**：`seats[<slug>]` 的键集 = `policy/definitions/seats.mjs` 的 `SEATS`（`components/dumpPolicy.mjs:19`，含保留键 `__default__`），档位 = `expanded[1]`；**三个新席必须已登记**，故本组用例断言 `Object.hasOwn(seats, <slug>) === true`，不再用「键缺席」形态。只有**未登记**的席才用 `patternRegistry.tierOf(name)` 判（回落 `defaultTier`，`patternRegistry.mjs:54,61-65`）。
6. **三席索引**：`speaker` = 议长；`respondent-architect` = 答辩方 leader；`respondent-dev` = 答辩方研发（spec §3 表）。
7. **`主持人` 的扫描面**：`COUNT` 口径一律「**出现次数**」，不是「命中行数」也不是「命中文件数」。`rg -c` 给的是**每文件命中行数**（`tools/docgen` 下 = 11 行，每文件一行），不能当总数；取出现次数用 `(rg -o "主持人" <面> | Measure-Object -Line).Lines`（或 `[regex]::Matches`）。spec §2 的现状 = **52 次 / 50 命中行 / 11 文件**，其中 `test/**` 46 次、`card-model/enums.mjs` 1 次为保留面，手改面 5 次（`check-trigger-kind.mjs` 1 / `artifacts.mjs` 1 / `writeScopes.mjs` 2 / `shared.json` 1）。

## 1 覆盖总表

| 覆盖（spec 节号 / S3A-xx） | 用例 ID | 类型 |
|---|---|---|
| §3 表 + §4-1 + §12 S3A-01（boundary）｜ S3A-01 | S3A-TC-01 | 正 |
| §4-1 `card` 8 键 ｜ S3A-01 | S3A-TC-02 | 负 |
| §4-1 `duty.trigger` 恒空 ｜ S3A-01 | S3A-TC-03 | 负 |
| §4-1 `duty.trigger` 键必须存在 ｜ S3A-01 | S3A-TC-04 | 负 |
| §3 表三席四字段取值 ｜ S3A-01 | S3A-TC-05 | 正 |
| §1-1 §4-2 双向恰等 ｜ S3A-02 | S3A-TC-06 | 正 |
| §4-2 顺序 = README 行序 ｜ S3A-02 | S3A-TC-07 | 边 |
| §1-1 少一份 ｜ S3A-02 | S3A-TC-08 | 负 |
| §1-1 多一份 ｜ S3A-02 | S3A-TC-09 | 负 |
| §1-1 目录混入非 `.json` ｜ S3A-02 | S3A-TC-10 | 负 |
| §3 `trigger.kind` + §10 ｜ S3A-03 | S3A-TC-11 | 正 |
| §10 前缀误判消除 ｜ S3A-03 | S3A-TC-12 | 负 |
| §10 非议会席仍只许 `need` ｜ S3A-03 | S3A-TC-13 | 负 |
| §3 四值封闭集 ｜ S3A-03 | S3A-TC-14 | 边 |
| §12 S3A-04 `dumpPolicy.seats` 三席 + `tierBySeat` 派生 ｜ S3A-04 | S3A-TC-15 | 正 |
| §9 登记与档位一致 ｜ S3A-04 | S3A-TC-16 | 负 |
| §9 `tierBySeat` 不含 `__default__` + 未知席回落 ｜ S3A-04 | S3A-TC-17 | 边 |
| §8 两份新合同 ｜ S3A-05 | S3A-TC-18 | 正 |
| §8 + §1-3 `InvalidOutputKind` ｜ S3A-05 | S3A-TC-19 | 负 |
| §8 `outputFormats` 缺一份 ｜ S3A-05 | S3A-TC-20 | 负 |
| §8 两集合双向相等 ｜ S3A-05 | S3A-TC-21 | 边 |
| §6 + §4-5→6 出生主路径（state 先置 `replaced`）｜ S3A-06 | S3A-TC-22 | 正 |
| §6 出生 evidence 取值 ｜ S3A-06 | S3A-TC-23 | 正 |
| §6 出生仍校验草稿字节 ｜ S3A-06 | S3A-TC-24 | 负 |
| §6 缺旧 evidence 不报 ｜ S3A-06 | S3A-TC-25 | 负 |
| §6 `--new` 前的临时件清理 ｜ S3A-06 | S3A-TC-26 | 边 |
| §6 state 未登记 → 漂移落 `state.json`、出生被拒 ｜ S3A-06 | S3A-TC-27 | 边 |
| §6 `--new` 用在已有卡 ｜ S3A-07 | S3A-TC-28 | 负 |
| §6 `--new` 零写盘 ｜ S3A-07 | S3A-TC-29 | 负 |
| §7 单源改名 ｜ S3A-08 | S3A-TC-30 | 正 |
| §7 单源可回退验证 ｜ S3A-08 | S3A-TC-31 | 负 |
| §7 §2 引用处数 18 ｜ S3A-08 | S3A-TC-32 | 边 |
| §7 §12 A 段清零（带排除面）｜ S3A-09 | S3A-TC-33 | 正 |
| §7 `skills/parliament` 不在 A 段 ｜ S3A-09 | S3A-TC-34 | 边 |
| §7 旧称回流 ｜ S3A-09 | S3A-TC-35 | 负 |
| §12 18 卡逐字节 ｜ S3A-10 | S3A-TC-36 | 正 |
| §12 手改即红 ｜ S3A-10 | S3A-TC-37 | 负 |
| §10 手改后判据仍绿 ｜ S3A-10 | S3A-TC-38 | 边 |
| §12 门禁绿 | S3A-11 | S3A-TC-39 | 正 |
| §12 卡漂移 | S3A-11 | S3A-TC-40 | 负 |
| §12 `baseline.json` 漂移 | S3A-11 | S3A-TC-41 | 负 |
| §12 未登记手写卡 | S3A-11 | S3A-TC-42 | 边 |
| §12 state 18 席 | S3A-12 | S3A-TC-43 | 正 |
| §12 + §5 state 多一个键（gate `StateFileInvalid`） | S3A-12 | S3A-TC-44 | 边 |
| §12 state 非 `replaced` | S3A-12 | S3A-TC-45 | 负 |
| §12 `docs/agents` README 漂移 | S3A-13 | S3A-TC-46 | 边 |
| §12 18 + README | S3A-13 | S3A-TC-47 | 正 |
| §12 投影缺一份 | S3A-13 | S3A-TC-48 | 负 |
| §12 投影多一份 | S3A-13 | S3A-TC-49 | 负 |
| §12 `generate --readme` 只比不写 | S3A-13 | S3A-TC-50 | 边 |
| §12 全仓绿 | S3A-14 | S3A-TC-51 | 正 |
| §12 任一段红 | S3A-14 | S3A-TC-52 | 负 |
| §12 守卫真跑 | S3A-14 | S3A-TC-53 | 边 |
| §11 `outputKind` 5→7 已签断言 | S3A-14 | S3A-TC-54 | 负 |
| §11 `policy-pure-source` + `sc-card-shape` 已签断言 | S3A-14 | S3A-TC-55 | 正 |
| §11 `dev-workflow-counts` 探针 17/18 | S3A-14 | S3A-TC-56 | 边 |
| §11 派生断言零改动 | S3A-14 | S3A-TC-57 | 边 |
| §11 探针漏检 18 | S3A-14 | S3A-TC-58 | 负 |
| §3 §4-2 新席追加到席序末尾 | S3A-02 | S3A-TC-59 | 边 |
| §12 `主持人` 回流到某一卡 | S3A-09 | S3A-TC-60 | 负 |
| §3 议会席四值不受限 | S3A-03 | S3A-TC-61 | 边 |
| §12 baseline 多一条 | S3A-11 | S3A-TC-62 | 负 |
| §3 `TK` 逐席一行 | S3A-03 | S3A-TC-63 | 边 |
| §10 `generate --readme` 只比不写（A 段） | S3A-10 | S3A-TC-64 | 边 |
| §5 §9 席注册表漏登记 | S3A-04 | S3A-TC-65 | 负 |
| §6 草稿不存在 | S3A-06 | S3A-TC-66 | 负 |
| §6 缺 `--yes` | S3A-06 | S3A-TC-67 | 边 |
| §5 `validateAgentData.mjs:114` 未登记 boundary | S3A-01 | S3A-TC-68 | 负 |
| §6 `--new` 与 `--expect-change` 互斥 ｜ S3A-06 | S3A-TC-69 | 负 |
| §4 步骤 5–8 三席串行 + 每席投影 ｜ S3A-06 | S3A-TC-70 | 正 |
| §5 subjects.mjs 缺登记 ｜ S3A-01 | S3A-TC-71 | 负 |

### 1.1 计数核算（现算）

- **正例（17）**：TC-01 / 05 / 06 / 11 / 15 / 18 / 22 / 23 / 30 / 33 / 36 / 39 / 43 / 47 / 51 / 55 / 70
- **负例（33）**：TC-02 / 03 / 04 / 08 / 09 / 10 / 12 / 13 / 16 / 19 / 20 / 24 / 25 / 28 / 29 / 31 / 35 / 37 / 40 / 41 / 45 / 48 / 49 / 52 / 54 / 58 / 60 / 62 / 65 / 66 / 68 / 69 / 71
- **边界（21）**：TC-07 / 14 / 17 / 21 / 26 / 27 / 32 / 34 / 38 / 42 / 44 / 46 / 50 / 53 / 56 / 57 / 59 / 61 / 63 / 64 / 67
- 合计 **71**；**负 + 边 = 54 ≥ 正 = 17**，成立。
- spec §12 验收 ID 覆盖：S3A-01→01–05·68·71；S3A-02→06–10·59；S3A-03→11–14·61·63；S3A-04→15–17·65；S3A-05→18–21；S3A-06→22–27·66·67·69·70；S3A-07→28–29；S3A-08→30–32；S3A-09→33–35·60；S3A-10→36–38·64；S3A-11→39–42·62；S3A-12→43–45；S3A-13→46–50；S3A-14→51–58。**14 个验收 ID 全部被覆盖，无遗漏。**

## 2 用例明细

### S3A-TC-01 三席 JSON 在位、顶层 7 键（含 `boundary`）、`card` 恰 8 键、`duty.trigger` 为空串、`boundary` 非默认

- **覆盖**：S3A-01；spec §3 表 + §4 步骤 1 + §12 S3A-01（`boundary` 判据）+ §9（席数据自带 boundary）
- **类型**：正例
- **前置**：施工完成；`tools/docgen/dsl/agents/seats/{speaker,respondent-architect,respondent-dev}.json` 在位
- **动作**：
  1. `Test-Path` 三条路径；
  2. `PROBE`：`JSON.parse` 三份，断言顶层键集 ⊇ `['card','dimension','name','outputKind','role','trigger']`（6 个必需键全在）且 `Object.hasOwn(j,'boundary')` 为 true；`boundary` 为非空字符串且 ≠ `DEFAULT_BOUNDARY`；
  3. 断言 `Object.keys(card).sort()` 全等 `['categories','checkItems','duty','must','never','rationale','scenes','signals']`；
  4. 断言 `card.duty.trigger === ''`（严格全等；`' '`、`null`、缺失都不算）；
  5. `PROBE` 另 import `agentData`（`components/agentData.mjs`）与 `DEFAULT_BOUNDARY`（`components/patternRegistry.mjs:13`），对三席逐个断言：条目 `boundary` 为 **非空字符串**（`typeof === 'string' && trim() !== ''`）且 **`!== DEFAULT_BOUNDARY`**。
- **期望**：`PROBE` exit `0`，stdout 末行 `S3A-TC-01 ok`；三处 `Test-Path` 均 `True`。
- **判据**：`PROBE` exit `0` + `Test-Path` 三项 `True`（不靠人眼读 JSON）。
- **判别力**：把 `tools` 回填进 `card` → 第 3 步红（与 TC-02 同一事实的守卫侧）；若 `boundary` 只写在 `policy/definitions/seats.mjs` 而未进席数据 / 装配面，第 5 步红（`seatLoader.mjs:112` 的 `...s` 展开才是 `agentData.boundary` 的来源）。
- **说明**：第 5 步只判**可观察值**（`agentData` 条目的 `boundary`），不绑定文本存放文件；`boundary` 的落点歧义见 §3 疑点 ②。

### S3A-TC-02 `card` 多一个派生键 → `CardKeySetMismatch`

- **覆盖**：S3A-01；spec §4 步骤 1（`card` 只写 8 键，派生项不得回填）
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-02\`；在副本的 `dsl/agents/seats/speaker.json` 的 `card` 里追加 `"tools": []`
- **动作**：副本根跑 `CLI gate`
- **期望**：`exit ≠ 0`（import 期未捕获异常，默认 1；见 §0.2-3）；stderr 含 `CardKeySetMismatch`；stdout **不含** `baseline`。
- **判据**：`exit ≠ 0` ∧ `stderr -match 'CardKeySetMismatch'`。
- **说明**：`seatLoader.mjs` 的 `fail` 只把 code 放进 `message`（`:20-23`），`name` / `keys` / `extra` 是 Error 字段；import 期未捕获异常打印的是 stack（`Error: <code>` + 调用栈），**不含 `speaker` 明细**。故本条只判错误码，不判席名。
- **判别力**：若实现把 `card` 键集校验放宽成「⊇ 8 键」，本条会绿 → 必须红。

### S3A-TC-03 `duty.trigger` 写成非空串 → `TriggerFieldMisplaced`

- **覆盖**：S3A-01；spec §4 步骤 1（`duty.trigger` 恒 `''`，触发条件只住 `trigger.when`）
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-03\`；把副本 `seats/speaker.json` 的 `card.duty.trigger` 改为 `"第二位发言时"`
- **动作**：副本根跑 `CLI gate`
- **期望**：`exit ≠ 0`；stderr 含 `TriggerFieldMisplaced`；stdout 不含 `baseline`。
- **判据**：`exit ≠ 0` ∧ `stderr -match 'TriggerFieldMisplaced'`。

### S3A-TC-04 `duty.trigger` 键整个缺失 → `TriggerFieldMisplaced`

- **覆盖**：S3A-01；spec §4 步骤 1
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-04\`；删除副本 `seats/respondent-dev.json` 的 `card.duty.trigger`
- **动作**：副本根跑 `CLI gate`
- **期望**：`exit ≠ 0`；stderr 含 `TriggerFieldMisplaced`。
- **判据**：`exit ≠ 0` ∧ `stderr -match 'TriggerFieldMisplaced'`。
- **说明**：缺键与空串是两种边界，若实现用 `?? ''` 兜底，本条红 → 正是要抓的。

### S3A-TC-05 三席四字段取值合 §3 表

- **覆盖**：S3A-01；spec §3 表
- **类型**：正例
- **前置**：同 TC-01
- **动作**：`PROBE` 逐席断言（全等，不做前缀/包含）：
  - `speaker`：`dimension === '程序'`、`outputKind === 'proceeding'`、`trigger.kind === 'dispatch'`；
  - `respondent-architect`：`dimension === '架构'`、`outputKind === 'defense'`、`trigger.kind === 'need'`；
  - `respondent-dev`：`dimension === '研发'`、`outputKind === 'defense'`、`trigger.kind === 'need'`。
- **期望**：`PROBE` exit `0`，末行 `S3A-TC-05 ok`。
- **判据**：`PROBE` exit `0`；逐字段全等（不用「包含」以免 `程序` 误配 `程序性`）。

### S3A-TC-06 `SEAT_ORDER` 18 项且与席目录双向恰等

- **覆盖**：S3A-02；spec §1-1 与 §4 步骤 2
- **类型**：正例
- **前置**：施工完成
- **动作**：`PROBE`：
  1. `import { SEAT_ORDER }` 断言 `SEAT_ORDER.length === 18`；
  2. 读 `dsl/agents/seats/*.json` 得 slug 数组 `dir`，断言 `[...SEAT_ORDER].sort()` 全等 `dir.sort()`；
  3. 断言 `SEAT_ORDER` 含 `speaker` / `respondent-architect` / `respondent-dev`。
- **期望**：`PROBE` exit `0`，末行 `S3A-TC-06 ok`。
- **判据**：`PROBE` exit `0`（三断言全过）。
- **说明**：**重复 slug = 不适用 / 记录项**：`seatLoader.mjs:79-83` 只判 `unknown` / `absent`，没有重复守卫；spec §4 步骤 2 也没要求。`SEAT_ORDER` 内若重复，长度或双向排序比对会先红，故本条不另设必绿断言，也不把「重复」写成正例。

### S3A-TC-07 `SEAT_ORDER` 顺序 = `docs/agents/README.md` 行序

- **覆盖**：S3A-02；spec §1-1（`SEAT_ORDER` 顺序 = README 行序）
- **类型**：边界
- **前置**：施工完成；`CLI generate --readme` 已跑过（README 在盘）
- **动作**：`PROBE` 读 `docs/agents/README.md` 全文，对 `SEAT_ORDER` 逐项取 `text.indexOf(slug)`，断言：每项 `>= 0`，且序列**严格递增**（出现顺序 = 声明顺序）。
- **期望**：`PROBE` exit `0`，末行 `S3A-TC-07 ok`。
- **判据**：`PROBE` exit `0`。
- **说明**：不解析表格列 / 表头（格式未被 spec 钉死）；只校验相对顺序，避免把渲染列宽也锁死。

### S3A-TC-08 席目录少一份（存目录有、目录缺）→ `InvalidInputPath`

- **覆盖**：S3A-02；spec §1-1 / §4 步骤 2（`SEAT_ORDER` 与目录双向恰等）
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-08\`；删除副本 `seats/speaker.json`
- **动作**：副本根跑 `CLI gate`
- **期望**：`exit ≠ 0`；stderr 含 `InvalidInputPath`；stdout 不含 `baseline`。
- **判据**：`exit ≠ 0` ∧ `stderr -match 'InvalidInputPath'`。
- **说明**：`seatLoader.mjs:82-83` 的 `absent` 分支；import 期抛出，退出码口径见 §0.2-3。`fail` 只把 code 放进 `message`（`seatLoader.mjs:20-23`），`absent` 明细是 Error 字段、不入 stack 首行，故不判 `speaker`。

### S3A-TC-09 席目录多一份未登记 `.json` → `InvalidInputPath`

- **覆盖**：S3A-02；spec §1-1
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-09\`；把副本 `seats/speaker.json` 复制为 `seats/zzz.json`（内容不改）
- **动作**：副本根跑 `CLI gate`
- **期望**：`exit ≠ 0`；stderr 含 `InvalidInputPath`；stdout 不含 `baseline`。
- **判据**：`exit ≠ 0` ∧ `stderr -match 'InvalidInputPath'`。
- **说明**：`unknown` 分支（`seatLoader.mjs:81-83`）；import 期抛出，`unknown` 明细不入 stack 首行，故不判 `zzz`。同时覆盖「文件名 → slug 与内文 `name` 不一致」这一种「多」，不另设用例。

### S3A-TC-10 席目录混入非 `.json` 文件 → `InvalidInputPath`

- **覆盖**：S3A-02；spec §1-1（目录只许席 JSON）
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-10\`；在副本 `seats/` 下新建 `note.txt`（内容任意）
- **动作**：副本根跑 `CLI gate`
- **期望**：`exit ≠ 0`；stderr 含 `InvalidInputPath`；stdout 不含 `baseline`。
- **判据**：`exit ≠ 0` ∧ `stderr -match 'InvalidInputPath'`。
- **说明**：`strays` 分支（`seatLoader.mjs:78-79`）；若实现只过滤 `.json` 而忽略其它扩展名，本条红 → 正是要抓的。`strays` 明细不入 stack 首行，故不判 `note.txt`。

### S3A-TC-11 `check-trigger-kind` 首行 = `seats 18 / kinds {dispatch:12,occasion:1,moment:1,need:4} / bad 0 => ok`

- **覆盖**：S3A-03；spec §3 表（speaker=dispatch、两个答辩席=need）+ §10
- **类型**：正例
- **前置**：施工完成
- **动作**：`TK`；取 stdout 第一行 `L`，做空白归一：`$n = ($L -replace '\s+','')`
- **期望**：`exit 0`；`$n` **全等** `check-trigger-kind:seats18/kinds{dispatch:12,occasion:1,moment:1,need:4}/bad0=>ok`。
- **判据**：`exit 0` ∧ `$n -eq 'check-trigger-kind:seats18/kinds{dispatch:12,occasion:1,moment:1,need:4}/bad0=>ok'`。
- **说明**：归一化只消空白，不动数字与标点；kinds 顺序按脚本固定键序，故可全等。若施工后计数不是 12/1/1/4，本条先红，先把「谁改了别人的 kind」揪出来。

### S3A-TC-12 `speaker` 为议会席，`kind=need` 也必须 `bad 0`（前缀误判消除）

- **覆盖**：S3A-03；spec §10（`speaker` 前缀命中旧 `PARL_PREFIXES`，不得因此被判非议会席）
- **类型**：负例（对「按前缀一律放行 / 一律拦截」的反向实现）
- **前置**：`COPY` 到 `%TEMP%\s3a-12\`；把副本 `seats/speaker.json` 的 `trigger.kind` 改为 `"need"`（其余不动）
- **动作**：副本根跑 `TK`
- **期望**：`exit 0`；首行归一后 `bad0=>ok`；kinds 计数为 `{dispatch:11,occasion:1,moment:1,need:5}`（基线 `12/1/1/4` 里 `speaker` 由 `dispatch` 改 `need`）。
- **判据**：`exit 0` ∧ 首行归一字符串全等 `check-trigger-kind:seats18/kinds{dispatch:11,occasion:1,moment:1,need:5}/bad0=>ok`。
- **判别力**：任何「`speaker` 命中前缀就跳过校验」（把守卫变成空转）或「命中前缀就强制 need」的实现，本条给出不同首行 / 非 0 → 红。

### S3A-TC-13 非议会席 `senior-sdet` 的 `kind` 放宽为 `dispatch` → `bad 1 => fail`

- **覆盖**：S3A-03；spec §10（非议会席仍只许 `need`）
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-13\`；把副本 `seats/senior-sdet.json` 的 `trigger.kind` 改为 `"dispatch"`
- **动作**：副本根跑 `TK`
- **期望**：`exit ≠ 0`；首行归一后含 `bad1=>fail`；stderr 含 `senior-sdet` 与 `非议会席只许 need`。
- **判据**：`exit ≠ 0` ∧ `$n -match 'bad1=>fail'` ∧ `stderr -match 'senior-sdet'` ∧ `stderr -match '非议会席只许 need'`。
- **说明**：`bad` 明细走 stderr（`check-trigger-kind.mjs:37-38`），stdout 每席行只回显 kind；故「为什么红」必须从 stderr 取。

### S3A-TC-14 `speaker` 的 `kind` 写第五值 → `bad 1 => fail`

- **覆盖**：S3A-03；spec §3（四值封闭集：need / dispatch / occasion / moment）
- **类型**：边界
- **前置**：`COPY` 到 `%TEMP%\s3a-14\`；把副本 `seats/speaker.json` 的 `trigger.kind` 改为 `"report"`
- **动作**：副本根跑 `TK`
- **期望**：`exit ≠ 0`；首行归一后含 `bad1=>fail`；stderr 含 `speaker` 与 `不在四值内`。
- **判据**：`exit ≠ 0` ∧ `$n -match 'bad1=>fail'` ∧ `stderr -match 'speaker'` ∧ `stderr -match '不在四值内'`。
- **说明**：封闭集校验不得因「speaker 是议会席」被跳过；本条与 TC-12 共同钉住「放行面只针对非议会席的 need 约束」。

### S3A-TC-15 `policy --dump.seats` 含三席；`expanded[1]` 与 `tierBySeat` 派生 = producer / command / readOnly

- **覆盖**：S3A-04；spec §12 S3A-04 + §9 表
- **类型**：正例
- **前置**：施工完成；三席均已登记进 `policy/definitions/seats.mjs` 与 `policy/seat-policy.mjs`
- **动作**：
  1. `POLICY` 取 JSON `$j`；
  2. `PROBE` 断言三席在 `seats` 里：`Object.hasOwn($j.seats,'speaker')` / `'respondent-architect'` / `'respondent-dev'` 均为 `true`；
  3. 断言 `expanded[0]` = display：`议长` / `架构答辩` / `研发答辩`（spec §9）；
  4. 断言 `expanded[1]`（派生档）逐席全等：`speaker === 'producer'`、`respondent-dev === 'command'`、`respondent-architect === 'readOnly'`；
  5. `import { tierBySeat }`（`components/patternRegistry.mjs:40-42`）断言 `tierBySeat.speaker === 'producer'`、`tierBySeat['respondent-dev'] === 'command'`、`tierBySeat['respondent-architect'] === 'readOnly'`；
  6. 能力 / 组 / 产物（槽位索引见 `renderBoundary.mjs:22-24`；槽 2 渲染的是**工具名**，值 = `capTools(caps).join(' / ')`（`renderBoundary.mjs:155`），映射见 `capabilities.mjs:3-7`）：`speaker.expanded[2]` 同时含 `Read`、`Write`、`RunCommand`；`speaker.expanded[6]` 同时含 `check.local` `/git.read` `/docgen.read`；`speaker.expanded[3]` 含 `progress.md`；`respondent-dev.expanded[2]` 含 `Read`、`RunCommand` 且不含 `Write`、`Edit`；`respondent-architect.expanded[2]` 含 `Read`、`Glob`、`Grep` 且不含 `Write`、`Edit`、`RunCommand`。
- **期望**：`POLICY` exit `0`；`PROBE` exit `0`，末行 `S3A-TC-15 ok`。
- **判据**：`POLICY` exit `0` ∧ `PROBE` exit `0`（各组断言全过）。
- **说明**：`dumpPolicy` 的档位在 `expanded[1]`（`policy-pure-source.test.mjs:1277`），不是顶层 `tier` 键。`tierBySeat` 由 `SEAT_NAMES` 逐席取 `SEAT_POLICY[s].capabilities`（`patternRegistry.mjs:40-42`）：若 `respondent-architect` 只在 `seats.mjs`、不在 `seat-policy.mjs`，import 期 `TypeError`，本条与 TC-51 都会红（见 §3 疑点 ①）。槽 2（CAPABILITIES）渲染的是工具名（`Read` / `Write` / `RunCommand` 等），不是能力词（`read` / `write` / `exec`）。

### S3A-TC-16 把 respondent-dev 登记成 `read + write` → 档位断言必须红

- **覆盖**：S3A-04；spec §9（respondent-dev 只读 + 执行 → `command`）
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-16\`；把副本 `policy/seat-policy.mjs` 的 `respondent-dev.capabilities` 改为 `['read','write']`
- **动作**：副本根跑 `CLI policy --dump`，再跑 TC-15 同款 `PROBE`
- **期望**：`policy --dump` exit `0`（配置自洽，`validatePolicy` 不变量 9 自比自恒真）；`PROBE` exit `≠ 0`，stdout 含 `respondent-dev expected command got sdet`。
- **判据**：`POLICY` exit `0` ∧ `PROBE` exit `≠ 0` ∧ 上述差异串。
- **判别力**：证明本组判据抓的是「档位取值」而不是「两处同源互相印证」；否则配置改坏也能绿。

### S3A-TC-17 `dumpPolicy.seats` 键集 = `SEATS`（7）；`tierBySeat` 不含 `__default__`、未知席回落 `readOnly`

- **覆盖**：S3A-04；spec §9 + §12 S3A-04（三席登记后的派生边界）
- **类型**：边界
- **前置**：施工完成
- **动作**：`PROBE`：
  1. `POLICY` 结果断言 `Object.keys(j.seats).sort()` 全等 `Object.keys(SEATS).sort()`，且长度 `=== 7`（3 旧席 + 3 新席 + `__default__`）；
  2. `Object.hasOwn(j.seats,'__default__') === true`，且 `j.seats['__default__'].expanded[1] === 'readOnly'`；
  3. `Object.hasOwn(tierBySeat,'__default__') === false`，且 `Object.keys(tierBySeat).sort()` 全等 `SEAT_NAMES.sort()`（6 席）；
  4. `tierOf('ghost-seat') === 'readOnly'`（未登记席回落 `defaultTier`）；`tierOf('constructor') === 'readOnly'`（原型链键不穿透，`patternRegistry.mjs:61-65`）。
- **期望**：`PROBE` exit `0`，末行 `S3A-TC-17 ok`。
- **判据**：`PROBE` exit `0`。
- **说明**：`dumpPolicy.seats` 键集来自 `policy/definitions/seats.mjs` 的 `SEATS`（`dumpPolicy.mjs:19`），不是 `SEAT_POLICY`；`SEAT_NAMES` 排除 `__default__`（`seats.mjs`）。本条钉的是「三席已登记」之后仍成立的派生边界，不再出现「`respondent-architect` 键缺席」的旧口径。

### S3A-TC-18 `outputFormats` 7 份，`proceeding` / `defense` 的 fields、checks 非空

- **覆盖**：S3A-05；spec §8
- **类型**：正例
- **前置**：施工完成
- **动作**：`PROBE`：`import { outputFormats }`，断言
  1. `Object.keys(outputFormats).length === 7`；
  2. `Object.hasOwn(outputFormats,'proceeding')` 与 `Object.hasOwn(outputFormats,'defense')` 均为 `true`；
  3. 两份合同 `Array.isArray(fields) && fields.length > 0`、`Array.isArray(checks) && checks.length > 0`；
  4. 每个 `fields[i]` / `checks[i]` 均为 `typeof === 'string'` 且 `.trim() !== ''`。
- **期望**：`PROBE` exit `0`，末行 `S3A-TC-18 ok`。
- **判据**：`PROBE` exit `0`。
- **说明**：§8 是散文列举字段/检查项，**未钉逐字字段名**（见文末「spec 疑点」③），故正例只判「键集 + 非空 + 类型」，不逐字匹配；逐字匹配会变成发明 spec。

### S3A-TC-19 从 `patternRegistry.outputKind` 摘掉 `proceeding` → `InvalidOutputKind`

- **覆盖**：S3A-05；spec §8 + §1-3（`InvalidOutputKind` 1 类）
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-19\`；在副本 `components/patternRegistry.mjs` 的 `outputKind` 集合里删掉 `'proceeding'`（`speaker.json` 仍写 `proceeding`）
- **动作**：副本根跑 `CLI gate`
- **期望**：`exit 1`（`validateAgentData` → `fail`，`exitCodeFor` 表中该码为 1）；stderr 首行 `^InvalidOutputKind: `；stdout 不含 `baseline`。
- **判据**：`exit -eq 1` ∧ `stderr` 首行 `-match '^InvalidOutputKind: '`。
- **说明**：这是「新 kinds 必须同时进集合」的唯一 `main` 内闭环判据；`outputFormats` 缺条不会触发该码。`validateAgentData` 的 `fail` 只把 code 放进 `message`（`:44`），不打印席名，故不判 `speaker` 明细。

### S3A-TC-20 `outputFormats` 缺 `defense` → 两集合不等，探针必须红

- **覆盖**：S3A-05；spec §8
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-20\`；删除副本 `components/outputFormats.mjs` 的 `defense` 一份
- **动作**：副本根跑 `PROBE`（断言 `Object.keys(outputFormats).sort()` 全等 `[...patternRegistry.outputKind].sort()`）
- **期望**：`PROBE` exit `≠ 0`；stdout 含 `outputFormats / outputKind set mismatch`。
- **判据**：`PROBE` exit `≠ 0` ∧ 上述差异串。
- **说明**：`outputFormats.mjs` 被 `cli.mjs:18` 读取常量化，不提供运行期错误码；此处用「集合双向相等」探针兜底。

### S3A-TC-21 反向：`patternRegistry` 多一个未入 `outputFormats` 的 kind → 探针红

- **覆盖**：S3A-05；spec §8
- **类型**：边界
- **前置**：`COPY` 到 `%TEMP%\s3a-21\`；在副本 `patternRegistry.mjs` 的 `outputKind` 集合里追加 `'memo'`（`outputFormats` 不动）
- **动作**：副本根跑 TC-20 同款 `PROBE`
- **期望**：`PROBE` exit `≠ 0`；stdout 含 `outputFormats / outputKind set mismatch`。
- **判据**：`PROBE` exit `≠ 0` ∧ 差异串。
- **判别力**：单向「7 ≥ 5」实现会漏掉此边；双向相等才红。

### S3A-TC-22 出生主路径：卡不存在 + state 已 `replaced`，`replace --new` 成功

- **覆盖**：S3A-06；spec §6 第 1 条 + §4 步骤 5→6（顺序 = 先 state 后出生）
- **类型**：正例
- **前置**：`COPY` 到 `%TEMP%\s3a-22\`；副本内：删 `agents/speaker.md`（`!existsSync` 成立）、删 `tools/docgen/builders/agents/fixtures/speaker.evidence.json`（若存在）、**保留** `state.json` 的 `"speaker": "replaced"`（§4 步骤 5 先置位，`state.json` 已登记）；`$env:DOCGEN_DRAFTS_DIR = "<副本>\.drafts"`
- **动作**：
  1. `CLI draft --kind agent --name speaker`；
  2. `$d = (Get-ChildItem .drafts -Filter 'speaker--*.md' | Sort-Object LastWriteTime | Select-Object -Last 1).FullName`；
  3. `CLI replace --kind agent --name speaker --draft $d --yes --new`；
  4. `PROBE`：`Buffer.compare(readFileSync('agents/speaker.md'), Buffer.from(renderByName('speaker'),'utf8')) === 0`；`JSON.parse(state.json).agents.speaker === 'replaced'`；`Get-ChildItem agents -Filter '.tmp-speaker-*.part'` 为空；`.drafts` 下 `speaker--*` 已清。
- **期望**：步骤 1 exit `0`，stdout 首行 `^草稿已落：`；步骤 3 exit `0`，stdout 首行 `^已替换：`；`PROBE` exit `0`，末行 `S3A-TC-22 ok`。
- **判据**：两个 exit `0` + 两个首行正则 + `PROBE` exit `0`。
- **说明**：§6 前置 = `!existsSync(agents/<slug>.md)` **且** `state.json` 已登记 `replaced`；**顺序 = 先 §4 步骤 5、再出生**。state 已登记但卡缺失时，漂移落在 `agents/<slug>.md` 上，`allowed()` 对该路径无条件放行（`cli.mjs:498`），故 `collectGate` 不阻断。若 state 未登记，漂移落在 `state.json` 上不被放行 → 出生不可达（见 TC-27）。三席同时施工时按 spec §4 步骤 5→8 执行（三席 state 一次登记 → 三席 draft 预置 → `baseline --write` → 逐席 `replace --new`），本条只覆盖单席副本终态。

### S3A-TC-23 出生后 evidence 六组取值 = spec §6 口径

- **覆盖**：S3A-06；spec §6 第 3 条（`commit` / `blob` / `sha256` / `hashObject` / `renderSha256` / `lastWrittenHash` / `changes`）
- **类型**：正例
- **前置**：接 TC-22 的副本终态（卡已出生）
- **动作**：`PROBE`：
  1. `commit === (git rev-parse HEAD)`，且匹配 `^[0-9a-f]{40}$`；
  2. `blob === hashObject === (git hash-object --no-filters agents/speaker.md)`，且匹配 `^[0-9a-f]{40}$`；
  3. `sha256 === renderSha256 === lastWrittenHash === SHA256(agents/speaker.md 字节, 大写)`，且匹配 `^[0-9A-F]{64}$`；
  4. `goldenAssertion === 'pending'`、`compareResult === null`；
  5. `Array.isArray(changes) && changes.length === 0`；
  6. `import { readEvidence }` 调 `readEvidence('speaker')` 不抛。
- **期望**：`PROBE` exit `0`，末行 `S3A-TC-23 ok`。
- **判据**：`PROBE` exit `0`（六组全过）。
- **说明**：`hashObject` 必须是 **40 位小写**（`evidence.mjs:74` 的 `HEX40`，既有席 `senior-sdet.evidence.json:3,5` 也是 40 位）；若实现写成 64 位大写，`readEvidence` 直接 `EvidenceInvalid`。出生未跑黄金断言，`evidence.mjs:75` 接受 `pending`，`init-evidence.mjs:31` 同口径；写 `pass` 属假证据。

### S3A-TC-24 出生时草稿 ≠ 渲染 → `DraftDrift`，不落卡

- **覆盖**：S3A-06；spec §6 第 2 条（仍校验 `draftBytes.equals(renderByName(name))`）
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-24\`；同 TC-22 删卡、删 evidence、留 state；把 `.drafts/speaker--probe.md` 写成渲染结果后**追加一个字符**
- **动作**：副本根跑 `CLI replace --kind agent --name speaker --draft .drafts\speaker--probe.md --yes --new`
- **期望**：`exit 1`（`DraftDrift` 在 `exitCodeFor` 表为 1）；stderr 首行 `^DraftDrift: `；`agents/speaker.md` **仍不存在**；`fixtures/speaker.evidence.json` **仍不存在**；state 仍 `replaced`（未被回滚也算「未写盘」）。
- **判据**：`exit -eq 1` ∧ 首行正则 ∧ 两处 `Test-Path` 为 `False`。

### S3A-TC-25 出生时不读旧 evidence：缺文件也必须成功

- **覆盖**：S3A-06；spec §6 第 3 条（不读旧 evidence，写盘后新建）
- **类型**：负例（对「无脑先 `readEvidence`」的实现）
- **前置**：`COPY` 到 `%TEMP%\s3a-25\`；删卡、**确认 evidence 不存在**、留 state；草稿 = 真渲染
- **动作**：`CLI replace --kind agent --name speaker --draft <draft> --yes --new`
- **期望**：`exit 0`；stdout 首行 `^已替换：`；`agents/speaker.md` 存在；stderr **不含** `EvidenceInvalid`。
- **判据**：`exit 0` ∧ 首行正则 ∧ `stderr -notmatch 'EvidenceInvalid'`。
- **判别力**：若 `--new` 未跳过 `cli.mjs:481` 的 `readEvidence`，本条红（`EvidenceInvalid` exit 2）。

### S3A-TC-26 出生前清理残留 `.tmp-<name>-*.part`

- **覆盖**：S3A-06；spec §6 第 5 条（写盘次序不变，启动清理）
- **类型**：边界
- **前置**：`COPY` 到 `%TEMP%\s3a-26\`；删卡、删 evidence、留 state；在 `agents/` 下新建 `.tmp-speaker-999.part`（内容 `stale`）；草稿 = 真渲染
- **动作**：`CLI replace --kind agent --name speaker --draft <draft> --yes --new`；结束后 `COUNT agents\.tmp-speaker-*.part = 0`
- **期望**：`exit 0`；stdout 首行 `^已替换：`；残留数 `0`；`agents/speaker.md` 内容 = 渲染。
- **判据**：`exit 0` ∧ `COUNT = 0` ∧ `PROBE` 字节相等 exit `0`。

### S3A-TC-27 state 未登记 → 漂移落在 `state.json` 上、`allowed()` 不放行 → 出生被拒

- **覆盖**：S3A-06；spec §6 第 1 条（前置 = 卡不存在 **且** state 已登记 `replaced`；反向 = state 未登记则不可达）
- **类型**：边界
- **前置**：`COPY` 到 `%TEMP%\s3a-27\`；删 `agents/speaker.md`、**从 `state.json` 删掉 `"speaker"` 键**（`phase='migration'`）；evidence fixture 可留可删（`--new` 跳过 `readEvidence`）；草稿 = 真渲染
- **动作**：`CLI replace --kind agent --name speaker --draft <draft> --yes --new`
- **期望**：`exit ≠ 0`；stderr 含 `state.json 缺席 speaker`；`agents/speaker.md` **不存在**（未写盘）；`fixtures/speaker.evidence.json` **不存在**（未新建）。
- **判据**：`exit ≠ 0` ∧ `stderr -match 'state\.json 缺席 speaker'` ∧ 两处 `Test-Path` = `False`。
- **说明**：state 缺键 → `collectGate`（`cli.mjs:496`）把「state 缺席」记为 `Mismatch`；`allowed()`（`:497-508`）无条件放行的只有 `agents/<name>.md`，`state.json` 的漂移不放行 → `fail`（`:509-513`），写盘前终止。这正是 spec §6 第 1 条写的「若 state 未登记，漂移落在 `state.json` 上不被放行 → 出生不可达」，属**预期行为**，不是 spec 内部矛盾。

### S3A-TC-28 已有卡的席加 `--new` → `InvalidArgs`，exit 2

- **覆盖**：S3A-07；spec §6 第 6 条
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-28\`；`reviewer-audit` 卡与 evidence 均在位；草稿 = `renderByName('reviewer-audit')`
- **动作**：记 `HASH agents/reviewer-audit.md`、`HASH fixtures/reviewer-audit.evidence.json`、`HASH state.json`；跑 `CLI replace --kind agent --name reviewer-audit --draft <draft> --yes --new`；再记三处 `HASH`
- **期望**：`exit 2`；stderr 首行 `^InvalidArgs: `；三处 `HASH` 前后全等；草稿文件仍在。
- **判据**：`exit -eq 2` ∧ 首行正则 ∧ 三处哈希全等 ∧ `Test-Path <draft>` = `True`。
- **说明**：`--new` 必须进 `REPLACE_FLAGS`（`cli.mjs:600`）才算「已知旗标」；否则 `parseArgs` 报 `未知旗标 --new`，同为 exit 2，但会把 TC-22 的正例直接打红。

### S3A-TC-29 卡已与渲染一致（幂等窗口）时加 `--new`，不得走幂等分支

- **覆盖**：S3A-07；spec §6 第 6 条
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-29\`；`senior-sdet` 未改动；草稿 = `renderByName('senior-sdet')`（与盘上卡逐字节等）
- **动作**：`CLI replace --kind agent --name senior-sdet --draft <draft> --yes --new`
- **期望**：`exit 2`；stderr 首行 `^InvalidArgs: `；stdout **不含** `已替换`（`cli.mjs:530` 的幂等恢复不得被 `--new` 借用）。
- **判据**：`exit -eq 2` ∧ 首行正则 ∧ `stdout -notmatch '已替换'`。
- **判别力**：若实现把 `--new` 检查放在幂等分支之后，本条会 exit 0 + `已替换（幂等恢复）` → 红。

### S3A-TC-30 `hostTerm` 单源改名：18 处引用全部渲染为「议长」

- **覆盖**：S3A-08；spec §7 第 1-2 条
- **类型**：正例
- **前置**：施工完成
- **动作**：`PROBE`：
  1. `JSON.parse(dsl/agents/shared.json).hostTerm === '议长'`；
  2. 遍历 `dsl/agents/seats/*.json`，统计含 `${@hostTerm}` 的文件 13 份、总出现 18 次；
  3. 对上述 13 席逐个 `renderByName`，断言文本含 `议长`；
  4. 遍历 `agents/*.md`，断言不含未解析的 `${@hostTerm}` 字面。
- **期望**：`PROBE` exit `0`，末行 `S3A-TC-30 ok`。
- **判据**：`PROBE` exit `0`（四组全过）。
- **说明**：引用数 18 / 文件 13 来自 spec §2 取数；不锁具体席名列表，只锁计数与渲染结果。

### S3A-TC-31 把 `shared.json.hostTerm` 改回「主持人」→ 渲染立刻回退（单源可验）

- **覆盖**：S3A-08；spec §7 第 1 条（唯一源）
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-31\`；把副本 `dsl/agents/shared.json` 的 `hostTerm` 改为 `主持人`
- **动作**：副本根跑 `CLI generate --kind agent --name reviewer-audit`
- **期望**：`exit 1`（盘上卡仍是「议长」版，渲染已回退 → 漂移）；stdout 末行 `baseline 19/19`；stderr **不含**错误码（漂移不是异常）。
- **判据**：`exit -eq 1` ∧ `stdout -match 'baseline 19/19$'` ∧ `stderr` 为空。
- **判别力**：若「议长」被写死进模板 / 渲染层（而非读 `hostTerm`），本条会 exit 0 → 红。

### S3A-TC-32 18 处引用的分布：`detective-observer` 6 处 + 其余 12 席各 1 处

- **覆盖**：S3A-08；spec §7 第 2 条
- **类型**：边界
- **前置**：施工完成
- **动作**：`PROBE` 逐文件 `countIn(text, '${@hostTerm}')`，断言：`detective-observer.json` = 6；其余有引用的 12 份各 = 1；合计 = 18；引用文件数 = 13。
- **期望**：`PROBE` exit `0`，末行 `S3A-TC-32 ok`。
- **判据**：`PROBE` exit `0`（三项计数全等）。
- **说明**：只判分布，不判席名清单；若施工顺手改了某席 `when` 的引用次数，本条红 → 属于超出 §7 的范围。

### S3A-TC-33 A 段旧称清零（带排除面）：`agents` = 0；`tools/docgen` 排除 `test/**` 与 `enums.mjs` 后 = 0

- **覆盖**：S3A-09；spec §7 第 4 条（清零口径）+ §12 S3A-09
- **类型**：正例
- **前置**：施工完成
- **动作**：`COUNT`（**按出现次数**，不是命中行数也不是文件数）：
  1. `$a = (rg -o "主持人" agents | Measure-Object -Line).Lines`；
  2. `$b = (rg -o "主持人" tools/docgen --glob '!**/test/**' --glob '!**/card-model/enums.mjs' | Measure-Object -Line).Lines`；
  3. 断言 `$a -eq 0 -and $b -eq 0`。
- **期望**：`COUNT` exit `0`；`$a = 0`、`$b = 0`。
- **判据**：`$a -eq 0` ∧ `$b -eq 0`，其中 `$a` / `$b` = `(rg -o "主持人" <面> | Measure-Object -Line).Lines`（与 spec §7 / §12 S3A-09 同口径）。
- **保留面（不计入失败）**：`card-model/enums.mjs:81` 的 `MIXED_PAIR = ['议长','主持人']` 词条 **1 次**（删词条归 S3-B）+ `tools/docgen/**/test/**` 的负例断言 **46 次**。施工前可复算：全量 `tools/docgen` = **52 次 / 50 命中行 / 11 文件**（§0.1 命令），减去保留面 47 = **A 段 5 次**（`check-trigger-kind.mjs` 1 / `artifacts.mjs` 1 / `writeScopes.mjs` 2 / `shared.json` 1），施工后必须归零。
- **说明**：spec §2 的 `rg -c` 结果是「每文件命中行数」（11 行），不是出现次数；本条统一用 `rg -o` + `Measure-Object` 取出现次数，避免 50 / 52 的口径混用。

### S3A-TC-34 `skills/parliament` 不在 A 段清零范围

- **覆盖**：S3A-09；spec §7 第 4 条（归 S3-B）
- **类型**：边界
- **前置**：施工完成（S3-B 可能尚未施工）
- **动作**：`COUNT`：`$a = (rg -o "主持人" agents | Measure-Object -Line).Lines`；`$p = (rg -o "主持人" skills/parliament | Measure-Object -Line).Lines`
- **期望**：`$p ≥ 1` 本身**不构成 S3-A 失败**；同时 `agents` 侧 `$a = 0`。
- **判据**：`$a -eq 0` ∧ `$p -ge 1`（证明扫描范围没越界把 S3-B 的债算进来）。
- **说明**：spec §2 给的现值是 29 次 / 10 文件；本条只判「非零且不参与 A 段」，不锁 29。

### S3A-TC-35 旧称回流到某张卡 → A 段清零判据必须红

- **覆盖**：S3A-09；spec §7 第 4 条
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-35\`；在副本 `agents/reviewer-audit.md` 末尾追加一行 `主持人`
- **动作**：副本根跑 TC-33 同款 `COUNT`（副本为 cwd）；再跑 `CLI gate`
- **期望**：`COUNT` 的 `$a = 1`（脚本 exit 1）；`gate` exit 1，stderr 首行 `^Mismatch: `。
- **判据**：`$a -eq 1` ∧ `gate exit -eq 1` ∧ `stderr` 首行 `-match '^Mismatch: '`。

### S3A-TC-36 18 卡逐字节 = 渲染；`generate` exit 0

- **覆盖**：S3A-10；spec §12「18 卡逐字节一致」
- **类型**：正例
- **前置**：施工完成
- **动作**：
  1. `CLI generate`；
  2. `PROBE`：读 `agentPaths()` 的 18 条路径，逐条断言 `readFileSync(p).equals(Buffer.from(renderByName(name),'utf8'))`；
  3. `COUNT agents\*.md = 18`。
- **期望**：`generate` exit `0`，stdout **全等** `baseline 19/19`；`PROBE` exit `0`，末行 `S3A-TC-36 ok`；计数 `18`。
- **判据**：`exit 0` ∧ `stdout -eq 'baseline 19/19'` ∧ `PROBE` exit `0` ∧ `COUNT = 18`。

### S3A-TC-37 手改一张卡 → `generate` 与 `gate` 双红

- **覆盖**：S3A-10；spec §12
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-37\`；在副本 `agents/reviewer-audit.md` 末尾追加一个 `x`
- **动作**：副本根跑 `CLI generate`；再跑 `CLI gate`；`PROBE` 调 `collectGate()` 断言含 `{ code: 'Mismatch', path: 'agents/reviewer-audit.md' }`
- **期望**：`generate` exit `1`（stdout 仍 `baseline 19/19`）；`gate` exit `1`，stderr 首行 `^Mismatch: `；`PROBE` exit `0`。
- **判据**：`gen exit -eq 1` ∧ `gate exit -eq 1` ∧ 首行正则 ∧ `PROBE` exit `0`。
- **说明**：`Mismatch` 无 `message` 时 stderr 形如 `Mismatch: Mismatch`（`cli.mjs:41,710-712`），故**路径**走 `collectGate` 探针，不靠 stderr 文本。

### S3A-TC-38 卡漂移不得影响 `check-trigger-kind`（两判据正交）

- **覆盖**：S3A-10；spec §10
- **类型**：边界
- **前置**：接 TC-37 副本（卡已坏）
- **动作**：副本根跑 `TK`
- **期望**：`exit 0`；首行归一后全等 `check-trigger-kind:seats18/kinds{dispatch:12,occasion:1,moment:1,need:4}/bad0=>ok`。
- **判据**：`exit 0` ∧ 归一字符串全等。
- **说明**：守卫只吃席数据，不吃产物；若 `check-trigger-kind` 误读 `agents/`，本条红。

### S3A-TC-39 门禁绿：`gate` exit 0 且首行 `baseline 19/19`

- **覆盖**：S3A-11；spec §12（N = 1 + 18）
- **类型**：正例
- **前置**：施工完成；`baseline --write` 已跑
- **动作**：`CLI gate`
- **期望**：`exit 0`；stdout 全等 `baseline 19/19`；stderr 为空。
- **判据**：`exit 0` ∧ `stdout -eq 'baseline 19/19'` ∧ `$stderr.Trim() -eq ''`。
- **说明**：`cmdGate` 成功路径只打这一行（`cli.mjs:235-238`），故「首行」=「全文」，可全等。

### S3A-TC-40 state 缺一席 → `Mismatch`，点名 `state.json 缺席 <slug>`

- **覆盖**：S3A-11；spec §12
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-40\`；从副本 `state.json` 删掉 `"speaker"` 键
- **动作**：副本根跑 `CLI gate`
- **期望**：`exit 1`；stderr 首行 `^Mismatch: `；stderr 含 `state.json 缺席 speaker`；stdout 不含 `baseline`。
- **判据**：`exit -eq 1` ∧ 首行正则 ∧ `stderr -match 'state\.json 缺席 speaker'`。
- **说明**：`cli.mjs:140-142` 的 `Mismatch` 自带可读 `message`，此处可以断言文本。

### S3A-TC-41 `baseline.json` 被手改 → `BaselineDrift`，exit 2

- **覆盖**：S3A-11；spec §12（baseline 重写后仍须比对面）
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-41\`；在副本 `baseline.json` 末尾追加一条不存在的路径字符串 `"agents/ghost.md"`
- **动作**：副本根跑 `CLI gate`
- **期望**：`exit 2`（`BaselineDrift` 在 `exitCodeFor` 表为 2）；stderr 首行 `^BaselineDrift: `；stdout 不含 `baseline`。
- **判据**：`exit -eq 2` ∧ 首行正则。
- **说明**：`baseline.json` 是纯路径字符串数组（`baseline.mjs:21-22` 的 `renderBaseline()` = `JSON.stringify([...BASELINE_RULES, ...agentPaths()])`），没有 `sha256` 字段；手加路径 = 全文不等 → `BaselineDrift`。

### S3A-TC-42 `agents/` 下多一个未登记 `.md` → `UnregisteredHandwritten`，exit 2

- **覆盖**：S3A-11；spec §12
- **类型**：边界
- **前置**：`COPY` 到 `%TEMP%\s3a-42\`；新建副本 `agents/probe.md`（内容任意）
- **动作**：副本根跑 `CLI gate`
- **期望**：`exit 2`；stderr 首行 `^UnregisteredHandwritten: `。
- **判据**：`exit -eq 2` ∧ 首行正则。
- **说明**：`cli.mjs:188-191` 的扫描面只认 `agentPaths()`，手写卡一律进此码。

### S3A-TC-43 `state.json` 18 席、全 `replaced`、键集 == `SEAT_ORDER`

- **覆盖**：S3A-12；spec §12
- **类型**：正例
- **前置**：施工完成
- **动作**：`PROBE`：读 `state.json`，断言 `state.version === 1`、`Object.keys(agents).length === 18`、`[...keys].sort()` 全等 `[...SEAT_ORDER].sort()`、`Object.values(agents).every(v => v === 'replaced')`。
- **期望**：`PROBE` exit `0`，末行 `S3A-TC-43 ok`。
- **判据**：`PROBE` exit `0`。
- **说明**：`state.json` 顶层形态见 `state.json:1-20`（`version: 1` + `agents` 映射）；本条只判这两个顶层键，不新增其它字段。

### S3A-TC-44 state 多一个不在席集的键 → 探针红 + `gate` `StateFileInvalid`，exit 2

- **覆盖**：S3A-12；spec §12 + §5（`state.json` 行：键集必须与 `agentData` 恰等；键不在 `agentData` → `StateFileInvalid`）
- **类型**：边界
- **前置**：`COPY` 到 `%TEMP%\s3a-44\`；在副本 `state.json.agents` 追加 `"ghost": "replaced"`
- **动作**：`PROBE` 跑 TC-43 的键集断言；再跑 `CLI gate`
- **期望**：`PROBE` exit `≠ 0`，stdout 含 `state keys != SEAT_ORDER`；`CLI gate` **exit 2**，stderr 首行 `^StateFileInvalid: ` 且含 `产物漂移` 与 `state.json`（`ghost` 席名不进 stderr，见说明）。
- **判据**：`PROBE exit ≠ 0` ∧ 差异串 ∧ `gate exit -eq 2` ∧ 首行正则 `^StateFileInvalid: ` ∧ `stderr -match '产物漂移'`。
- **说明**：`state.mjs:33` 对键不在 `agentData` 的情况发 `StateFileInvalid`；`collectGate` 在 `cli.mjs:133-135` 捕获该码并入漂移，`gate` 最终由 `cli.mjs:219-224`（`replace` 为 `:509-513`）抛出，`StateFileInvalid` 在 `EXIT` 表为 2。实装 `cli.mjs:224` 只把漂移 `path` 拼成 `产物漂移 <path>`，`state.mjs` 的 `name` 字段不进 stderr，故本条不判 `ghost` 文本；`ghost` 的存在由 `PROBE` 的 `state keys != SEAT_ORDER` 判。

### S3A-TC-45 某席 `state` 写成 `suspended` 但卡仍在 → `Mismatch`

- **覆盖**：S3A-12；spec §12
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-45\`；把副本 `state.json.agents['senior-sdet']` 改为 `"suspended"`
- **动作**：副本根跑 `CLI gate`
- **期望**：`exit 1`；stderr 首行 `^Mismatch: `；stderr 含 `未接管席 senior-sdet` 与 `state=suspended`。
- **判据**：`exit -eq 1` ∧ 首行正则 ∧ `stderr -match '未接管席 senior-sdet'` ∧ `stderr -match 'state=suspended'`。
- **说明**：`cli.mjs:147-150` 的「未迁移席不得带人读投影」分支；`suspended` 是 `readState` 允许值（`state.mjs` 枚举），不是 `StateFileInvalid`。

### S3A-TC-46 `docs/agents/README.md` 手改 → `Mismatch`（全席落地后）

- **覆盖**：S3A-13；spec §12
- **类型**：边界
- **前置**：`COPY` 到 `%TEMP%\s3a-46\`；在副本 `docs/agents/README.md` 末尾追加一个 `x`
- **动作**：副本根跑 `CLI gate`；`PROBE` 调 `collectGate()` 断言含 `{ code: 'Mismatch', path: 'docs/agents/README.md' }`
- **期望**：`exit 1`；stderr 首行 `^Mismatch: `；`PROBE` exit `0`。
- **判据**：`exit -eq 1` ∧ 首行正则 ∧ `PROBE` exit `0`。
- **说明**：README 只在**全部席落地**时才比（`cli.mjs:176-180`）；施工完成后 18 席全落地，故本条可判。

### S3A-TC-47 `docs/agents` = 18 份席文档 + `README.md`；`generate --readme` exit 0

- **覆盖**：S3A-13；spec §12
- **类型**：正例
- **前置**：施工完成；`generate --readme --apply` 已跑
- **动作**：
  1. `COUNT docs\agents\*.md = 19`；
  2. `COUNT docs\agents\*.md（排除 README）= 18`；
  3. 逐席 `Test-Path docs/agents/<slug>.md`（18 个全 `True`）；
  4. `CLI generate --readme`（不带 `--apply`）。
- **期望**：两处 `COUNT` 分别为 `19` / `18`；18 个 `Test-Path` 全 `True`；`generate --readme` exit `0`，stdout 全等 `baseline 19/19`。
- **判据**：`COUNT = 19` ∧ `COUNT = 18` ∧ 18 项 `True` ∧ `exit 0` + stdout 全等。

### S3A-TC-48 删除 `docs/agents/speaker.md` → `DanglingBaselineEntry`，exit 2

- **覆盖**：S3A-13；spec §12
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-48\`；删除副本 `docs/agents/speaker.md`
- **动作**：副本根跑 `CLI gate`
- **期望**：`exit 2`；stderr 首行 `^DanglingBaselineEntry: `。
- **判据**：`exit -eq 2` ∧ 首行正则。
- **说明**：`cli.mjs:170-175` 只在 `landedSeats` 含该席时查投影；core 卡已一致 → 命中。

### S3A-TC-49 多一份 `docs/agents/stray.md` → `Mismatch`，点名「未迁移席」

- **覆盖**：S3A-13；spec §12
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-49\`；新建副本 `docs/agents/stray.md`
- **动作**：副本根跑 `CLI gate`
- **期望**：`exit 1`；stderr 首行 `^Mismatch: `；stderr 含 `未迁移席 stray 不得出现在 docs/agents`。
- **判据**：`exit -eq 1` ∧ 首行正则 ∧ 上述文本。
- **说明**：`cli.mjs:164-169` 的反向扫描；`stray` 不在 `expectedDocs()` 里。

### S3A-TC-50 `generate --readme` 不带 `--apply` 只比不写

- **覆盖**：S3A-13；spec §12（`--apply` 才落盘）
- **类型**：边界
- **前置**：`COPY` 到 `%TEMP%\s3a-50\`；把副本 `docs/agents/speaker.md` 末尾追加一个 `x`；记该文件 `HASH`
- **动作**：副本根跑 `CLI generate --readme`；再记 `HASH`
- **期望**：`exit 1`（漂移）；stdout 全等 `baseline 19/19`；`HASH` 前后全等（未被静默修好）。
- **判据**：`exit -eq 1` ∧ stdout 全等 ∧ 两处 `HASH` 相同。
- **判别力**：若 `--readme` 默认落盘，本条的 `HASH` 会变 → 红。

### S3A-TC-51 全仓 `npm run check` exit 0，末行 `check 全部通过`

- **覆盖**：S3A-14；spec §12
- **类型**：正例
- **前置**：施工完成；`baseline --write`、`generate --readme --apply` 已跑
- **动作**：`CHECK`（`npm run check`）
- **期望**：`exit 0`；stdout 末行全等 `check 全部通过`；stderr 不含 `check 未通过`。
- **判据**：`exit -eq 0` ∧ stdout 末行全等 ∧ `stderr -notmatch 'check 未通过'`。
- **说明**：失败信息走 stderr（`check-all.mjs:561-565`），所以「末行」按流分开判：绿看 stdout，红看 stderr；成功时 stderr 允许有其它告警，故只判「不含失败末行」。

### S3A-TC-52 抽掉 `outputFormats.defense` → `check` 必红且末行 `check 未通过`

- **覆盖**：S3A-14；spec §12
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-52\`；删除副本 `components/outputFormats.mjs` 的 `defense` 一份
- **动作**：副本根跑 `CHECK`
- **期望**：`exit ≠ 0`；stderr 末行全等 `check 未通过`；stdout **不含** `check 全部通过`；**stdout + stderr 合并文本**含 `S4-TC-D01` 与 `not ok`。
- **判据**：`exit ≠ 0` ∧ stderr 末行全等 ∧ `stdout -notmatch 'check 全部通过'` ∧ `($stdout + $stderr) -match 'S4-TC-D01'`。
- **说明**：`node --test` 的失败块走 stdout（`check-all.mjs:90-118`），只有进程级错误才进 stderr；故红点定位看合并文本。本条是端到端负例，允许耗时较长（全套 `node --test` + gate）。

### S3A-TC-53 `check` 输出里确实跑了 `check-trigger-kind`（守卫在场）

- **覆盖**：S3A-14；spec §12 + §10
- **类型**：边界
- **前置**：施工完成
- **动作**：`CHECK`，在 stdout 中检索 `check-trigger-kind:`
- **期望**：`exit 0`；stdout 含一行，空白归一后全等 `check-trigger-kind:seats18/kinds{dispatch:12,occasion:1,moment:1,need:4}/bad0=>ok`。
- **判据**：`exit 0` ∧ 归一后存在该行。
- **说明**：`check-all.mjs:245-247` 逐条打印守卫首行；若守卫被摘掉，本条红（防止「check 绿但其实没跑」）。

### S3A-TC-54 已签断言若仍写 5 个 kind → `S4-TC-D01` 必红

- **覆盖**：S3A-14；spec §11（`card-render.test.mjs:198` 5 → 7）
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-54\`；把副本 `tools/docgen/builders/agents/test/card-render.test.mjs:194` 的 `KIND` 改回 `['audit','issue-card','observation','evidence','testcase']`
- **动作**：副本根跑 `TEST --test-name-pattern "S4-TC-D01" tools/docgen/builders/agents/test/card-render.test.mjs`
- **期望**：`exit ≠ 0`；stdout / stderr 同时含 `必须恰好这` 与 `个 outputKind` 两个子串，且含 `proceeding` / `defense` 的差异。
- **判据**：`exit ≠ 0` ∧ 输出同时含 `必须恰好这` 与 `个 outputKind` ∧ 输出含 `proceeding` 与 `defense`。
- **判别力**：若施工只改了 `outputFormats` 没改断言，正式 `check` 也会红；本条把该「已签件漏改」独立成可复算证据。

### S3A-TC-55 §11 已签件的硬编码席断言 / kinds 断言必须已按登记面同步

- **覆盖**：S3A-14；spec §11（`policy-pure-source.test.mjs:416` / `:504` / `:1167` / `:1168` / `:1268`；`sc-card-shape.test.mjs:372-377` / `:450-457`）
- **类型**：正例
- **前置**：施工完成
- **动作**：分别跑
  1. `TEST --test-name-pattern "S6-TC-B01" tools/docgen/builders/agents/test/policy-pure-source.test.mjs`（含 `:416` 与 `:504`）；
  2. `TEST --test-name-pattern "S6-TC-G03" tools/docgen/builders/agents/test/policy-pure-source.test.mjs`（含 `:1167` / `:1168`）；
  3. `TEST --test-name-pattern "S6-TC-F02" tools/docgen/builders/agents/test/policy-pure-source.test.mjs`（含 `:1268`）；
  4. `TEST --test-name-pattern "SC-TC-33" tools/docgen/builders/agents/test/sc-card-shape.test.mjs`（kinds 字面量 `:372-377`）；
  5. `TEST --test-name-pattern "SC-TC-38" tools/docgen/builders/agents/test/sc-card-shape.test.mjs`（`:450-457` 非议会席集合）；
  6. `TEST --test-name-pattern "SC-TC-43" tools/docgen/builders/agents/test/sc-card-shape.test.mjs`；
  7. `TEST --test-name-pattern "SC-TC-47" tools/docgen/builders/agents/test/sc-card-shape.test.mjs`；
  8. `TEST --test-name-pattern "SC-TC-48" tools/docgen/builders/agents/test/sc-card-shape.test.mjs`；
  9. `TEST --test-name-pattern "S4-TC-C06" tools/docgen/builders/agents/test/card-render.test.mjs`。
- **期望**：九条均 `exit 0`（0 failed）。
- **判据**：九条命令都 `exit 0`。
- **说明**：spec §11 的新值 = `:416` `SEAT_POLICY` 键集 4 → **7**（3 旧 + 3 新 + `__default__`）；`:504` `tierBySeat` 深等对象 3 → **6** 席；`:1167` `own.size` 4 → **7**（2 producer + evidence-reader + senior-sdet + 3 新席）；`:1168` `defSeats` **仍 11**（18 − 7）；`:1268` 席名单 3 → **6**；`SC-TC-33` 的 kinds 字面量 `11/1/1/2` → **`12/1/1/4`**（speaker=dispatch，两 respondent=need）；`SC-TC-38` 的前缀现算 → 直接读 `NON_PARL_SEATS`（仍 2 席：`evidence-reader` / `senior-sdet`，三新席是议会席）。旧表里的 `:1256` 是注释行、`defSeats 11→14` 的写法已废弃，本条不再引用。`:1167` 的 7 必须通过改**测试的 `own` 集合**达成；不得把三新席塞进 `boundaryBySeat`（那会违反 §9 并改变渲染，见 §3 疑点 ⑤）。`SC-TC-33` 的**测试标题**仍写「11 / 1 / 1 / 2」，属文案陈旧、不参与断言（同 TC-57 口径）。这四条是改名后的反向断言面，spec §11 已列（`spec:149-152`），改名前会断言旧称、改名后必须以「议长」为正向（SC-TC-43 `shared.hostTerm === '议长'`；SC-TC-47/48 的替换源改「议长」、探针词换成未用词；S4-TC-C06 侦探卡「议长」≥1、「主持人」=0）。

### S3A-TC-56 `dev-workflow-counts` 的席位计数探针在 18 席下仍零误报

- **覆盖**：S3A-14；spec §11（探针 14/15 → 17/18）
- **类型**：边界
- **前置**：施工完成（新写的测试不得在 assert 行写 17/18 字面量）
- **动作**：`TEST --test-name-pattern "TC-C06" tools/docgen/builders/agents/test/dev-workflow-counts.test.mjs`
- **期望**：`exit 0`（`seatAssert` 为空）。
- **判据**：`exit 0`。
- **说明**：若施工新增测试在 `assert.*` 行写 `18`，本条即红；这是 §11 扩探针的真实代价，须由施工侧避免。

### S3A-TC-57 派生自 `SEATS.length` 的三处断言不改也应绿

- **覆盖**：S3A-14；spec §11（`:50,960,1003` 不改）
- **类型**：边界
- **前置**：施工完成
- **动作**：分别跑 `TEST --test-name-pattern "S4-TC-F01"`、`"S4-TC-F02"`、`"S4-TC-F04"`（同一文件 `tools/docgen/builders/agents/test/card-render.test.mjs`）。
- **期望**：三条均 `exit 0`。
- **判据**：三条命令都 `exit 0`。
- **说明**：`:960` 的**提示文案**仍写「31 份 / 15 卡」，但断言是 `2 * SEATS.length + 1`（`:50`/`:960`）与派生计数，**文案陈旧不算红**；若施工把文案当成断言去改，反而容易改坏。

### S3A-TC-58 探针若没扩到 18，注入的 `assert(..., 18)` 会漏检

- **覆盖**：S3A-14；spec §11（探针扩到 17/18）
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-58\`；在副本 `tools/docgen/builders/agents/test/data.test.mjs` 把 `assert.equal(paths.length, agentData.length);` 改为 `assert.equal(paths.length, 18);`
- **动作**：副本根跑 `TEST --test-name-pattern "TC-C06" tools/docgen/builders/agents/test/dev-workflow-counts.test.mjs`
- **期望**：`exit ≠ 0`；输出含 `正常态断言行不得有`。
- **判据**：`exit ≠ 0` ∧ 输出含该前缀。
- **判别力**：若探针仍只认 14/15（不改 `counterProbes` 的 `:235`），注入行不会被抓，TC-C06 会绿 → 本条红。

### S3A-TC-59 新席按 §3 表顺序追加到 `SEAT_ORDER` 末尾

- **覆盖**：S3A-02；spec §3 表 + §4 步骤 2（追加，不改旧序）
- **类型**：边界
- **前置**：施工完成
- **动作**：`PROBE` 断言 `SEAT_ORDER.slice(-3)` 全等 `['speaker','respondent-architect','respondent-dev']`，且 `SEAT_ORDER.length === 18`。
- **期望**：`PROBE` exit `0`，末行 `S3A-TC-59 ok`。
- **判据**：`PROBE` exit `0`。
- **说明**：顺序直接决定 README 行序与 `generate` 的遍历序；插到中间会连带改旧席 README 行序（超出 §5 改动面）。

### S3A-TC-60 旧称回流到 `shared.json`（生成源）→ `tools/docgen` 计数必须红

- **覆盖**：S3A-09；spec §7 第 4 条
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-60\`；先记 `$b0`（TC-33 的 `$b` 口径：`rg -o` 出现次数，已排除 `test/**` 与 `enums.mjs`）；再把副本 `tools/docgen/dsl/agents/shared.json:5` 的 `"hostTerm": "议长"` 改回 `"主持人"`
- **动作**：副本根改完再取 `$b1`；再跑 `CLI gate`
- **期望**：`$b1 = $b0 + 1`（只增这一处）；`gate` **exit 1**，stderr 首行 `^Mismatch: `。
- **判据**：`$b1 -eq $b0 + 1` ∧ `gate exit -eq 1` ∧ `stderr` 首行 `-match '^Mismatch: '`。
- **说明**：不把 `$b` 写死（施工后剩余旧称数未知，见 TC-33）；用增量 1 判扫描器确实覆盖生成源。改 `shared.json.hostTerm` → 渲染面整体回退，盘上卡仍是「议长」版 → `cli.mjs:151-157` 报 `Mismatch`（exit 1）。不注入 `trigger.when` 是因为那会先触发 `MixedTermInCard`（`card-model/enums.mjs:103`、`cardPipeline.mjs:131`），拿不到 `Mismatch`。

### S3A-TC-61 议会席改用 `occasion` 仍 `bad 0`，计数随数据重算

- **覆盖**：S3A-03；spec §3（四值）+ §10（只约束非议会席）
- **类型**：边界
- **前置**：`COPY` 到 `%TEMP%\s3a-61\`；把副本 `seats/speaker.json` 的 `trigger.kind` 改为 `"occasion"`
- **动作**：副本根跑 `TK`
- **期望**：`exit 0`；首行归一后全等 `check-trigger-kind:seats18/kinds{dispatch:11,occasion:2,moment:1,need:4}/bad0=>ok`（基线 `12/1/1/4` 里 `speaker` 由 `dispatch` 改 `occasion`）。
- **判据**：`exit 0` ∧ 归一字符串全等。
- **说明**：kinds 计数必须由数据重算；若实现把 counts 写死成 12/1/1/4，本条红。

### S3A-TC-62 `baseline.json` 多一条不存在的产物 → `BaselineDrift`，exit 2

- **覆盖**：S3A-11；spec §12
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-62\`；在副本 `baseline.json` 末尾追加一条路径字符串 `"agents/ghost.md"`
- **动作**：副本根跑 `CLI gate`
- **期望**：`exit 2`；stderr 首行 `^BaselineDrift: `。
- **判据**：`exit -eq 2` ∧ 首行正则。
- **说明**：`baseline.json` 是纯路径字符串数组（`baseline.mjs:21-22`）；手加条目 = 全文不等 → `BaselineDrift`，不是 `DanglingBaselineEntry`（后者判产物缺文件）。

### S3A-TC-63 `check-trigger-kind` 逐席一行（18 席 = 19 行输出）

- **覆盖**：S3A-03；spec §3 + §10 的「每席一行可定位」
- **类型**：边界
- **前置**：施工完成
- **动作**：`$lines = @(TK stdout 非空行)`；`COUNT`
- **期望**：`$lines.Count -eq 19`（1 行汇总 + 18 行逐席）；`exit 0`。
- **判据**：`exit 0` ∧ `$lines.Count -eq 19`。
- **说明**：行数写死 19 的依据是 `sc-card-shape.test.mjs:377-381` 的「汇总 1 行 + 每席 1 行」；若实现改成只打汇总，本条红（可定位性丢失）。

### S3A-TC-64 `generate`（不带 `--readme`）不比人读投影

- **覆盖**：S3A-10；spec §12 + `cli.mjs:90`（`--readme` 才选目标面）
- **类型**：边界
- **前置**：`COPY` 到 `%TEMP%\s3a-64\`；在副本 `docs/agents/speaker.md` 末尾追加 `x`
- **动作**：副本根先跑 `CLI generate`，再跑 `CLI generate --readme`
- **期望**：第一条 `exit 0`（stdout `baseline 19/19`）；第二条 `exit 1`（stdout `baseline 19/19`）。
- **判据**：`gen exit -eq 0` ∧ `gen --readme exit -eq 1`。
- **判别力**：若 `generate` 默认把 docs 也纳入比对，第一条会 exit 1 → 红。

### S3A-TC-65 只在 `seat-policy.mjs` 登记、漏 `definitions/seats.mjs` → `UnknownPolicyRef`

- **覆盖**：S3A-04；spec §5（改动清单）+ §9
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-65\`；从副本 `policy/definitions/seats.mjs` 的 `SEATS` 里删掉 `speaker`（`seat-policy.mjs` 保留）
- **动作**：副本根跑 `CLI policy --dump`
- **期望**：`exit 1`；stderr 首行 `^UnknownPolicyRef: `；stderr 含 `speaker:seat=speaker`。
- **判据**：`exit -eq 1` ∧ 首行正则 ∧ 上述文本。
- **说明**：`validatePolicy.mjs:34-38` 的 `fail` 不设 `exitCode`，由 `cli.mjs:701-714` 走 `exitCodeFor('UnknownPolicyRef')`，该码在 `validateAgentData.mjs:29` 的 EXIT[1] 表 → exit 1。`validatePolicy.mjs:98-99` 要求 `SEAT_POLICY` 的每个席键都在 `SEATS.SEATS` 里且有非空 `display`；spec §5 现已把 `policy/definitions/seats.mjs` 列入改动清单，本条是这条登记面的**反向守卫**：只改 `seat-policy`、漏 `seats.mjs` 必红（不是 spec 缺项）。

### S3A-TC-66 草稿路径不存在 → `DraftNotFound`，exit 3

- **覆盖**：S3A-06；spec §6 第 2 条（先判草稿存在）
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-66\`；删卡、留 state；草稿路径指向不存在的文件
- **动作**：`CLI replace --kind agent --name speaker --draft .drafts\nope.md --yes --new`
- **期望**：`exit 3`；stderr 首行 `^DraftNotFound: `；`agents/speaker.md` 不存在。
- **判据**：`exit -eq 3` ∧ 首行正则 ∧ `Test-Path = False`。

### S3A-TC-67 `--new` 缺 `--yes` → `NotAuthorized`，exit 4

- **覆盖**：S3A-06；spec §6（仍走既有授权闸门）
- **类型**：边界
- **前置**：`COPY` 到 `%TEMP%\s3a-67\`；删卡、留 state；草稿 = 真渲染
- **动作**：`CLI replace --kind agent --name speaker --draft <draft> --new`（**不带** `--yes`）
- **期望**：`exit 4`；stderr 首行 `^NotAuthorized: `；`agents/speaker.md` 不存在。
- **判据**：`exit -eq 4` ∧ 首行正则 ∧ `Test-Path = False`。
- **说明**：`cli.mjs:458` 的授权判断在一切读写之前；`--new` 不得绕过它。

### S3A-TC-68 新席带 `boundary` 但未登记进 `DECLARED_SLOT_SEATS` → `DescriptionDerivation`

- **覆盖**：S3A-01；spec §5（`components/validateAgentData.mjs:114` 登记面）+ §9（席数据自带 boundary 需显式登记）
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-68\`；在副本 `components/validateAgentData.mjs:114` 之后插入 `DECLARED_SLOT_SEATS.delete('speaker');`（`speaker.json` 仍带 `boundary`）
- **动作**：副本根跑 `CLI gate`
- **期望**：`exit 1`；stderr **首个非空行** `^DescriptionDerivation: `；stdout **不含** `baseline`。
- **判据**：`exit -eq 1` ∧ 首行正则。
- **说明**：`validateAgentData.mjs:122-124` 的白名单从 `boundaryBySeat` 派生（+ `evidence-reader`），三个新席**不会自动进入**，必须按 spec §5 在同批把 slug 加进 `DECLARED_SLOT_SEATS`；否则席数据一带 `boundary` 就在 gate 前段红。`validateAgentData` 的 `fail` 只把 code 放进 `message`（`:44`），`name` / `reason` 是 Error 字段、不经 CLI 打印（`cli.mjs:710-712`），故本条只判错误码，不判 `speaker` / 明细文本。`speaker` 是 `producer`，另有 `:133-134` 的「producer 席必须声明非空 boundary」兜底（删键型负例），本条只测「未登记」型。

### S3A-TC-69 `--new` 与 `--expect-change` 互斥 → `InvalidArgs`，exit 2

- **覆盖**：S3A-06；spec §6 第 1 条（`--new` 不得带 `--expect-change` / `--rejudge`）
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-69\`；删副本 `agents/speaker.md`、删副本 `tools/docgen/builders/agents/fixtures/speaker.evidence.json`（若存在）、**保留** `state.json` 的 `"speaker": "replaced"`；草稿 = `renderByName('speaker')`
- **动作**：`CLI replace --kind agent --name speaker --draft <draft> --yes --new --expect-change <64 位大写 hex>`
- **期望**：`exit 2`；stderr 首行 `^InvalidArgs: `；`agents/speaker.md` 不存在；`fixtures/speaker.evidence.json` 不存在；草稿文件仍在。
- **判据**：`exit -eq 2` ∧ 首行正则 ∧ 两处 `Test-Path` = `False` ∧ `Test-Path <draft>` = `True`。
- **说明**：`--new` 的显式前置 = 目标卡不存在、未带 `--expect-change` / `--rejudge`（spec §6 第 1 条）；两条任一不满足即 `InvalidArgs`（exit 2），校验在写盘前，故零写盘。

### S3A-TC-70 三席串行出生 + 每席投影

- **覆盖**：S3A-06；spec §4 步骤 5–8、§6
- **类型**：正例
- **前置**：`COPY` 到 `%TEMP%\s3a-70\`；副本内三席 state 均为 `replaced`；删三席卡；删三席 evidence；删 `docs/agents/{speaker,respondent-architect,respondent-dev}.md` 三份投影（保证后面的存在性有判别力）；`$env:DOCGEN_DRAFTS_DIR = "<副本>\.drafts"`；先 `CLI baseline --write`；先对三席各跑一次 `CLI draft --kind agent --name <slug>`（顺序 speaker → respondent-architect → respondent-dev），并记下每席草稿路径 `<d_speaker>` / `<d_arch>` / `<d_dev>`。
- **动作**：逐席循环（speaker → respondent-architect → respondent-dev），每席两步：
  1. `CLI replace --kind agent --name <slug> --draft <对应草稿> --yes --new`；
  2. `CLI generate --kind agent --name <slug> --readme --apply`。

  循环后跑 `CLI gate`。
- **期望**：三次 replace exit `0`（首行 `^已替换：`）；三次 generate exit `0`（不因未出生席报 `DanglingBaselineEntry`）；三席卡存在；三份 `docs/agents` 投影存在；`gate` exit `0`。
- **判据**：三次 replace exit `0` ∧ 三次 generate exit `0` ∧ 三处卡 `Test-Path=True` ∧ 三处投影 `Test-Path=True` ∧ `gate exit 0`。
- **说明**：spec §4 步骤 8；`collectGate` 对已落地席要求投影（`cli.mjs:170-173`），`allowed()` 只放行 `agents/*.md`（`:497-508`），故必须每出生一席就跑一次带 `--name` 的 `generate --readme --apply`（`:56-57` 只比该席、`:91-100` 写全投影、`:170-171` 跳过未落地席、`:176` README 全落地才比）。三席草稿必须在循环前全部预置（spec §4 步骤 6），否则首次 replace 会被「另两席无匹配草稿」挡住。

### S3A-TC-71 `SUBJECTS` 缺 `<slug>.card` → 渲染即拒（`UnverifiableOutput`）

- **覆盖**：S3A-01；spec §5 `card-model/subjects.mjs` 行
- **类型**：负例
- **前置**：`COPY` 到 `%TEMP%\s3a-71\`；从副本 `tools/docgen/builders/agents/card-model/subjects.mjs` 的 `SUBJECTS` 删掉 `'speaker.card'` 一条。
- **动作**：副本根跑 `CLI gate`。
- **期望**：`exit ≠ 0`（import / 渲染期）；stderr 含 `UnverifiableOutput`；stdout 不含 `baseline`。
- **判据**：`exit ≠ 0` ∧ `stderr -match 'UnverifiableOutput'`。
- **说明**：`subjects.mjs:8-29` 是 15 席字面登记、不从 `agentData` 派生（`:11-13`）；缺条目时 `cardPipeline.mjs:130-131` 在 `renderSeat` 处 `refuse`，`validateCardModel.mjs:382-383` 发 `UnverifiableOutput`。

## 3 spec 中「无法机判 / 自相矛盾」的地方（只列，不改 spec）

| # | 位置 | 问题 | 影响 |
|---|---|---|---|
| ① | §5 `policy/seat-policy.mjs` 行 | 已消解（spec:74 已写明 `speaker` / `respondent-dev` / `respondent-architect` **三条**）。 | — |
| ② | `boundary` 落点 | 已消解（spec:57 顶层 7 键含 `boundary`；spec:137 明确 `boundary` 写各席 JSON 顶层，`boundaryBySeat` 只承接模板渲染三席）。 | — |
| ③ | §8 | `proceeding` / `defense` 的字段与检查项是**散文列举**（含「起止（HH:MM:SS）」这类描述），没有钉逐字字段名 / 顺序 / 条数。 | 无法逐字机判；TC-18 只判「键集 + 非空 + 字符串」，逐字匹配等于发明 spec。 |
| ④ | §6 第 3 条哈希进制 | 已消解（spec:101：`commit` / `blob` / `hashObject` 40 位小写；`sha256` / `renderSha256` / `lastWrittenHash` 64 位大写）。 | — |
| ⑤ | §11 `:1167`（`own.size === 4` → 7） | 已消解（spec:154：测试内显式列 7 席，不从 `DECLARED_SLOT_SEATS` 派生；不得塞进 `boundaryBySeat`）。 | — |
| ⑥ | §11 `:416` / `:504` / `:1268` | 已消解（spec:156 已给 7 / 6 / 6；`:1168` `defSeats` 仍 11）。 | — |
| ⑦ | §2 / §7 第 4 条取数口径 | 已消解（spec:33-36、spec:187 已统一 `rg -o` + `Measure-Object`）。 | — |
| ⑧ | §12 S3A-02（「双向恰等」） | loader 只查「少 / 多」，**不查重复 slug**；spec 也未要求。 | **不适用 / 记录项**：TC-06 不再用 `Set.size` 写必绿断言；重复由长度 / 双向排序间接暴露，若需显式守卫属超出 spec 的改动。 |

## 4 施工后实测表（③④ 段填写；本轮为空）

| 用例 ID | 实际结果（exit / 首行 / 哈希） | 证据位置（命令输出首行 / 文件:行） |
|---|---|---|
| S3A-TC-01 |  |  |
| S3A-TC-02 |  |  |
| S3A-TC-03 |  |  |
| S3A-TC-04 |  |  |
| S3A-TC-05 |  |  |
| S3A-TC-06 |  |  |
| S3A-TC-07 |  |  |
| S3A-TC-08 |  |  |
| S3A-TC-09 |  |  |
| S3A-TC-10 |  |  |
| S3A-TC-11 |  |  |
| S3A-TC-12 |  |  |
| S3A-TC-13 |  |  |
| S3A-TC-14 |  |  |
| S3A-TC-15 |  |  |
| S3A-TC-16 |  |  |
| S3A-TC-17 |  |  |
| S3A-TC-18 |  |  |
| S3A-TC-19 |  |  |
| S3A-TC-20 |  |  |
| S3A-TC-21 |  |  |
| S3A-TC-22 |  |  |
| S3A-TC-23 |  |  |
| S3A-TC-24 |  |  |
| S3A-TC-25 |  |  |
| S3A-TC-26 |  |  |
| S3A-TC-27 |  |  |
| S3A-TC-28 |  |  |
| S3A-TC-29 |  |  |
| S3A-TC-30 |  |  |
| S3A-TC-31 |  |  |
| S3A-TC-32 |  |  |
| S3A-TC-33 |  |  |
| S3A-TC-34 |  |  |
| S3A-TC-35 |  |  |
| S3A-TC-36 |  |  |
| S3A-TC-37 |  |  |
| S3A-TC-38 |  |  |
| S3A-TC-39 |  |  |
| S3A-TC-40 |  |  |
| S3A-TC-41 |  |  |
| S3A-TC-42 |  |  |
| S3A-TC-43 |  |  |
| S3A-TC-44 |  |  |
| S3A-TC-45 |  |  |
| S3A-TC-46 |  |  |
| S3A-TC-47 |  |  |
| S3A-TC-48 |  |  |
| S3A-TC-49 |  |  |
| S3A-TC-50 |  |  |
| S3A-TC-51 |  |  |
| S3A-TC-52 |  |  |
| S3A-TC-53 |  |  |
| S3A-TC-54 |  |  |
| S3A-TC-55 |  |  |
| S3A-TC-56 |  |  |
| S3A-TC-57 |  |  |
| S3A-TC-58 |  |  |
| S3A-TC-59 |  |  |
| S3A-TC-60 |  |  |
| S3A-TC-61 |  |  |
| S3A-TC-62 |  |  |
| S3A-TC-63 |  |  |
| S3A-TC-64 |  |  |
| S3A-TC-65 |  |  |
| S3A-TC-66 |  |  |
| S3A-TC-67 |  |  |
| S3A-TC-68 |  |  |
| S3A-TC-69 | 出生负例（--new 与 --expect-change 互斥） | S3A-06 |
| S3A-TC-70 |  |  |
| S3A-TC-71 |  |  |

## 5 执行顺序建议（③④ 段用，不改判据）

1. 先跑只读正例：TC-06 / 07 / 11 / 15 / 18 / 30 / 32 / 33 / 34 / 36 / 39 / 43 / 47 / 51 / 59 / 63（真仓）。
2. 再跑需要「出生」的正例：TC-22 / 23 / 26（同一副本链），以及 TC-24 / 25 / 27 / 66 / 67（各自独立副本）。
3. `--new` 负例：TC-69（副本删卡、留 state，`--new` + `--expect-change` 应 `InvalidArgs` exit 2）。
4. 三席串行出生 + 每席投影：TC-70（同一副本链，`--new` 逐席 + `generate --readme --apply` 逐席）。
5. `SUBJECTS` 登记面负例：TC-71（改副本 `subjects.mjs` 的 `SUBJECTS` 后跑 `gate`）。
6. 负例按 S3A-xx 分组跑，全部用 `COPY`，真仓只读。
7. 每条用例把「命令 + 输出首行 + 退出码」回填 §4；没回填 = 未实测，不得声称通过。
