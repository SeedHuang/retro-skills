# 测试用例：S6-B 边界句结构收敛（写作用域数据化 / 项级排除 / 槽集 15 / 引用完整性）

> 归属 spec：`docs/superpowers/specs/2026-11-04-s6-b-boundary-convergence-design.md`（**已按议会 #2 首轮与复核轮裁定改版**；本文件同步到该版）
> 编写者 = 独立 `senior-sdet` 实例（全新上下文）｜**独立性声明**：本文件由 `senior-sdet`（初版 `…-20261105-01`、轮 2 `…-20261105-02`、轮 3 `…-20261105-03`、轮 4 `…-20261105-04`、轮 5 `…-20261105-05`、本轮 `…-20261105-06`）在**全新上下文**编写与修订，未参与该 spec 写作（spec 作者 = 主 agent）、未参与本段施工；**六轮均只读** spec / 前作 spec / 既有实现 / 既有测试 / 规则，**未改 spec、未改代码、未改 plan、未执行 git 写操作**。每轮修订的唯一写入产物 = 本文件。
> 命名与落点：按 `rules/spec-testcase-gate.md` 判据 1（与 spec 同目录；文件名 = spec 文件名去掉 `.md` 后 + `-testcase.md`）。
> 状态：**修订轮次 6（按 ④ 段 P1 裁定改判：D-16 报文口径 / D-17 §8.4 豁免 / TC-06·08 去残留 / TC-07 构造指向 / TC-17 判据命令）**｜最后更新：`2026-11-05`｜用例条数：**正 22 / 负 18 / 边界 13 = 53**（硬上限 80；计数见 §1.1）。
> 纪律声明：本轮为 ④ 段复核取数，**跑过** `npm run check`（全文 `# fail 0`）与只读命令（`node tools/docgen/cli.mjs gate`、`policy --dump`、`git rev-parse HEAD`、`git status --porcelain`、`git grep -l`、`git show <BASE>:agents/*.md`）；所有数值标「`BASE` 或实跑时刻」，负例注入只在 `%TEMP%` 全仓副本内做并清理。
> 引号纪律：**禁止**写裸的「测试文件名 + 冒号 + 行号」形态（行号守卫会判红）；本文件引用测试一律用**符号名**或 `test('S6-…')` 块标题。

## 0 判据约定（全表复用；命令在**仓根**执行，Shell = PowerShell 5，`exit` 指进程退出码）

| 代号 | 命令 / 形态 | 备注 |
|---|---|---|
| `GATE` | `node tools/docgen/cli.mjs gate` | 判 `exit 0` + 末行 `baseline N/N`（截至 `BASE` 实测 N = 38） |
| `DUMP` | `node tools/docgen/cli.mjs policy --dump` | 只读；取 `seats[席].expanded` / `paths.groups` 的唯一入口 |
| `CHECK` | `npm run check` | 门禁总入口；**本席本轮不跑**（纪律），V-8 的口径只认它 |
| `SWEEP` | `node scripts/scope-sweep.mjs --check` | R8 改判回扫；判 `sweep ok` |
| `PROBE` | `node --test --test-name-pattern "S6B-TC-NN" tools/docgen/test/policy-pure-source.test.mjs` | 断言一律 `node:assert/strict`；**禁止** `node -e` 当判据 |
| `COPY` | `withRepoCopy(fn)`（`tools/docgen/test/support/dev-workflow-checks.mjs` 导出）+ `runCli(dir, argv)` / `runEsm(dir, code)` 子进程取数 | 副本只含 `tools/docgen` / `tools/execution-matrix` / `rules` / `agents`（无 `docs/`、无 `.git`）→ **副本内不跑 git** |
| `COUNT` | `$c = <取数命令>; if ($c -ne 0) { exit 1 }; exit 0`（「必须 ≥ N」处写 `-lt N`） | **不得**拿 `Select-String` / `git diff` / `git grep` 的进程退出码当判据（它们不设退出码 → 恒真） |
| `BASE` | `git rev-parse HEAD`（**动任何源文件之前**取一次，写进当次账本；本校验轮 = `2eb0b5bf62ec50ec1458fa023a67923b670db1b9`） | 「字节不变」「投影零差异」「用例数不降」的唯一比较基准 |

### 0.1 现状实测值（**截至 `BASE` = `2eb0b5bf…`，2026-11-05 本机**，逐条可复算）

| 项 | 截至 `BASE` 的现值 | 取数（首行可复算） |
|---|---|---|
| `BASE`（HEAD） | `2eb0b5bf62ec50ec1458fa023a67923b670db1b9` | `git rev-parse HEAD` |
| 工作区 | **3 项**：`M` S6 原文 spec + `??` 本 spec + `??` 本 testcase | `git status --porcelain`（stdout 取集合；退出码不作判据） |
| `GATE` | `exit 0`，末行 `baseline 38/38` | `node tools/docgen/cli.mjs gate` |
| `SLOTS` | **12**：`SEAT / TIER / CAPABILITIES / ARTIFACTS / SEAT_CLAUSE / ESCALATION_WRITER / ALLOW_GROUPS / DENY_GROUPS / ENV_FORMS / FORBIDDEN_PATHS / DETECTION_PATHS / DETECTION_CMD` | `renderBoundary.mjs` 的 `SLOTS` 导出 |
| `pathGroups` | 6 组 / **18 个数组元素**（`code: ['代码、测试']` 合写 1 项） | `paths.mjs` 的 `pathGroups` |
| `pathItems()` | **19**（18 数组元素 + 1 个 `pattern` 源串） | 判据侧派生 |
| `pathTokens()` | **20**（18 元素按 `、` 再切得 19 + `spec / plan`） | 判据侧派生 |
| `dump.seats[*].expanded.length` | **12**（三席 + `__default__` 同） | `DUMP` |
| `sha(renderBoundary('reviewer-audit'))` | `aaa1ed1bab96abf4435321304efb4383634f5340f17257123f505432b02b4f96` | 现渲染自算 |
| `sha(批次起点卡 agents/reviewer-audit.md 的「## 边界」节)` | **同上** `aaa1ed1b…`（`GATE` 保证盘上卡 == 渲染） | `git show <BASE>:agents/reviewer-audit.md` 切边界节后自算 |
| `sha(renderBoundary('detective-observer'))` | `a9bdacbaea83eb4a82e7f930d76abb43d83c96c0279002bbfb456ca28ccbe052` | 现渲染自算 |
| `sha(批次起点卡 agents/detective-observer.md 的「## 边界」节)` | **同上** `a9bdacba…` | 同上 |
| `sha(renderBoundary('senior-sdet'))` | `d0377bc5f22efdd16f3e74bf20baacb5449d0210d16d66b624897ee2e7d55667`（该席**已能渲染**，只是未接线） | 现渲染自算 |
| `sha(批次起点卡 agents/senior-sdet.md 的「## 边界」节)` | `1854ee34bb7fc13133cf45840dbb5776429c987c73da397fb22e6e2d2961afee`（= 旧单句，**≠ 现渲染**——这正是 V-2 要消的差） | `git show <BASE>:agents/senior-sdet.md` |
| `boundary-golden.json` 键集 | 7 键：`reviewer-audit` / `detective-observer` / `default-boundary` / `evidence-reader-boundary` / `senior-sdet-boundary` / `reviewer-audit@2` / `detective-observer@2` | 读 fixture |
| 黄金键值 | `reviewer-audit` = `3ae06a90…b347`；`reviewer-audit@2` = `bb06aee7…3e03`；`senior-sdet-boundary` = `1854ee34…afee` | 读 fixture（完整值见 §0.2 口径 1） |
| `renderBoundary('senior-sdet')` 首句 | `你是评审席（测试开发）。` | 现渲染 |
| `senior-sdet` 的 `FORBIDDEN_PATHS` | `` `pathGroups`（六组）与一项模式项（spec 与 plan 的两种写法） ``（**无**排除注） | `DUMP` 的 `expanded[9]` |
| `git grep -l SDET_BOUNDARY -- tools agents skills` | 截至 `BASE` **2 文件**：`tools/docgen/components/patternRegistry.mjs`（定义 + 登记）、`tools/docgen/test/sb-contract-layer.test.mjs`（注释）；**D-16 后注释字面已删 → 现 0** | `git grep -l`（stdout 取集合） |
| `git grep -l SDET_BOUNDARY -- docs` | **7 文件（截至 `BASE`；本 testcase 入库后 +1 → 8**，因本文件正文含该词）（历史记录：`docs/after/…open-decisions.md` / `docs/handoffs/2026-10-31-agent-card-s4-quality.md` / `docs/prd/20261102212627-card-data-contract-and-proof/index.md` / `docs/superpowers/reviews/2026-10-25-1723-s6-eval/capability-diff.md` / `docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md` / `…-s-b-contract-layer-design.md` / `…-s-b-contract-layer-design-testcase.md`） | 同上（**只作 V-2 面宽证据，不作判据**） |
| `TEMPLATE_ALLOWED_LITERALS` | 含 `.session/reviews/<本次>/` 与 `docs/superpowers/reviews/<本次>/` 两条 | `renderBoundary.mjs` 导出 |
| 旧 `SDET_BOUNDARY` 的「允许写」段 | 本次 spec 同目录的 `-testcase.md` 与同目录由你负责的测试设计文档（「只写…；」之间） | `git show <BASE>:tools/docgen/components/patternRegistry.mjs` |
| 旧 `SDET_BOUNDARY` 第三段 | `不改别人的判定：spec 或实现有问题，写进「给开发的建议」，不代改、不参与议会裁决` | 同上 |
| `docs/agents/senior-sdet.md` | **不含 `## 边界` 段**（人读投影只写「边界见卡面」） | 读该文件 |

### 0.2 四个**必须钉死的口径**（写错就假红 / 假绿）

1. **「字节不变」的比较对象 = 批次起点卡面的「## 边界」节**（spec §4 V-1 新口径），**不是黄金键**。截至 `BASE` 实测：现渲染 `aaa1ed1b…` ≠ `golden['reviewer-audit']`（`3ae06a90…`）也 ≠ `golden['reviewer-audit@2']`（`bb06aee7…`）——两个黄金键都取自更早的历史文本，spec V-1 已明写「黄金不作判据」。判据形态 = `sha(render) === sha(批次起点卡边界节)`，基准用 `git show <BASE>` 现取，不冻结第三份字面。
2. **三个路径计数各有分工、不许混用**：**数组元素**（18 → 19）；**定义层点名**（`pathItems()` 19 → 20）；**卡面成员**（`pathTokens()` 20 → 20）。施工后只有前两个变（§3.1）。
3. **模板字面扫描面 = `tools/docgen/templates/boundary.md.tpl` 单文件**（spec V-3 已明写）。截至 `BASE` 实测 `agents/reviewer-audit.md` 边界段必含「你是评审席（审计）」与「本次评审账本」——那是槽值（数据），扫卡面会把「数据化成功」判成红。
4. **V-5③ 的两读法各自独立判死、不许混写**（spec V-5③ 已拆 (a)/(b)）：**(a) 项级移除** ＝ 本席 `excludePathItems` 的项集差（只读 `writeScopes`）——落 S6B-TC-16 / 17；**(b) 定义层元素文本 diff** ＝ 新旧 `paths.mjs` 的**元素文本**差（只读定义层）——落 S6B-TC-24 / 25。
5. **不变量 13 按「⊆ 白名单」判，不按「全等」判**（spec §3.7 已改）：`review.ledger` ⊆ `[]`、`spec.testcase` ⊆ `['code.test']`——**清空 / 未用项都不判红**；只有白名单**外**的项才判 `ForbiddenGroupGranted`，且报文是 **scope 级**（`writeScope=<scope>:excludePathItem=<id>:not-allowed`，首段不是席名）。落 S6B-TC-17（清空 → 绿）/ 36（白名单外 → 红）。

### 0.3 口径与异议的总账（**未决 = 0**）

首轮 5 条异议（D-1～D-5）**已全部由 spec 作者裁定并回填 spec**；议会 #2 首轮可修项（D-6～D-10）、复核轮一致性项（D-11～D-14）与**施工期回流项（D-15：第 15 槽 `HOST_RULE`）**均已回填 spec 并在本文件落地。逐条见 §5.1，每条都带「spec 落点 + 本文件落点」，**无待定项**。

## 1 覆盖总表

| 用例 ID | 覆盖的 spec 条目 | 层级 | 类型 | 判据类型 | 执行方式 | 优先级 |
|---|---|---|---|---|---|---|
| S6B-TC-01 | §4 V-1（渲染 == 批次起点卡边界节 + 三文件 diff 0 行） | 单元 | 正例 | 机器 | `PROBE` + `COUNT` | P0 |
| S6B-TC-02 | §4 V-1（卡面 = 渲染逐字节）+ §3.4 首句 | 集成 | 正例 | 机器 | `GATE` + `PROBE` | P0 |
| S6B-TC-03 | §4 V-1（判别力：改数据必须让渲染变） | 单元 | 负例 | 机器 | `COPY` + `PROBE` | P0 |
| S6B-TC-04 | §4 V-1（黄金不作判据）+ §6 D6 | 集成 | 边界 | 机器 | `PROBE` | P0 |
| S6B-TC-05 | §4 V-2（`agentData` 接渲染）+ §3.6 | 单元 | 正例 | 机器 | `PROBE` | P0 |
| S6B-TC-06 | §4 V-2（导出面 / `git grep` 面 0） | 集成 | 正例 | 机器 | `PROBE` + `COUNT` | P0 |
| S6B-TC-07 | §4 V-2（回填常量必红） | 单元 | 负例 | **机器（父测试 exit 0 / 副本内断言红）** | `COPY` + `PROBE` | P0 |
| S6B-TC-08 | §4 V-2（`git grep` 面宽）+ §2.6 | 集成 | 边界 | 机器 | `COUNT` | P1 |
| S6B-TC-09 | §3.6（恢复路径 `draft` → `replace`；投影零改动）+ §4 V-2 | e2e | 边界 | **机器 + 人工**（一次性） | `GATE` | P0 |
| S6B-TC-10 | §4 V-3（模板去字面，面 = 模板文件） | 集成 | 正例 | 机器 | `COUNT` | P0 |
| S6B-TC-11 | §4 V-3（槽值 = 数据两字段）+ §3.2 §3.4 | 单元 | 正例 | 机器 | `PROBE` | P0 |
| S6B-TC-12 | §4 V-3（字面回填必红） | 集成 | 负例 | 机器 | `COPY` + `COUNT` | P0 |
| S6B-TC-13 | §4 V-3（改数据 → 渲染跟随） | 单元 | 负例 | 机器 | `COPY` + `PROBE` | P0 |
| S6B-TC-14 | §3.6（两条字面从白名单删除）+ §4 V-3 | 集成 | 边界 | 机器 | `COPY` + `GATE` | P0 |
| S6B-TC-15 | §4 V-3（扫描面判别力） | 集成 | 边界 | 机器 | `COUNT` | P1 |
| S6B-TC-16 | §4 V-4 + **V-5③(a)**（本席项级移除恰 `code.test`） | 单元 | 正例 | 机器 | `PROBE` | P0 |
| S6B-TC-17 | §4 V-4（无排除项席零字节）+ **V-5③(a)** 反面 + **§3.7 不变量 13 ⊆**（清空不判红） | 集成 | 正例 | 机器 | `COPY` + `GATE` + `PROBE` | P0 |
| S6B-TC-18 | §3.7 不变量 10（组 ID / 字面 ≠ 项 ID）+ §4 V-4 | 集成 | 负例 | 机器 | `COPY` + `GATE` | P0 |
| S6B-TC-19 | §3.5（排除注**句尾追加** + 由 `text` 现算）+ §4 **V-5⑤**（落点外仍禁） | 单元 | 边界 | 机器 | `COPY` + `PROBE` | P0 |
| S6B-TC-20 | §4 V-5①（允许写两侧全等） | 集成 | 正例 | 机器 | `PROBE` | P0 |
| S6B-TC-21 | §4 V-5①（多授权 / 减授权各必红） | 单元 | 负例 | **机器（父测试 exit 0 / 副本内断言红）** | `COPY` + `PROBE` | P0 |
| S6B-TC-22 | §4 V-5②（禁写点名覆盖，差集空） | 集成 | 正例 | 机器 | `PROBE` | P0 |
| S6B-TC-23 | §4 V-5②（覆盖缺口必红） | 单元 | 负例 | **机器（父测试 exit 0 / 副本内断言红）** | `COPY` + `PROBE` | P0 |
| S6B-TC-24 | **§4 V-5③(b)**（新旧定义层**元素文本** diff） | 集成 | 正例 | 机器 | `PROBE` | P0 |
| S6B-TC-25 | §3.1 三数口径（18/19/20 → 19/20/20） | 集成 | 边界 | 机器 | `PROBE` | P0 |
| S6B-TC-26 | §4 V-6 + §3.4 表（槽集恰 **15** / 行序） | 单元 | 正例 | 机器 | `PROBE` | P0 |
| S6B-TC-27 | §4 V-6（`expanded` **15** 且 [12]/[13]/[14] 对位） | 集成 | 正例 | 机器 | `DUMP` + `PROBE` | P0 |
| S6B-TC-28 | §3.7 不变量 11（漏槽 / 多槽各必红） | 集成 | 负例 | 机器 | `COPY` + `GATE` | P0 |
| S6B-TC-29 | §3.4「旧 12 槽位置 0–11 不动」 | 单元 | 边界 | 机器 | `PROBE` | P0 |
| S6B-TC-30 | §4 V-7 绿档 + §5（真仓门禁基线） | e2e | 正例 | 机器 | `GATE` | P0 |
| S6B-TC-31 | §4 V-7 负例一 / 二（表驱动）+ §3.3 校验排序 | 集成 | 负例 | 机器 | `COPY` + `GATE` | P0 |
| S6B-TC-32 | §4 V-7（红非恒真：改回即绿） | 集成 | 正例 | 机器 | `COPY` + `GATE` | P0 |
| S6B-TC-33 | §3.7 不变量 12（模式项无 `id` → 不可引用） | 集成 | 边界 | 机器 | `COPY` + `GATE` | P0 |
| S6B-TC-34 | §3.7 不变量 10（同一 `id` 只许一次） | 集成 | 边界 | 机器 | `COPY` + `GATE` | P0 |
| S6B-TC-35 | §3.3 / §3.7 不变量 10（显式 `undefined` / `null` / `''`） | 集成 | 负例 | 机器 | `COPY` + `GATE` | P0 |
| S6B-TC-36 | §4 V-7 负例三 + §3.7 不变量 13（**按 scope 白名单，⊆**） | 集成 | 负例 | 机器 | `COPY` + `GATE` | P0 |
| S6B-TC-37 | §4 V-8（`npm run check`：末行 `check 全部通过` + **全文** `# fail 0`） | e2e | 正例 | 机器 | `CHECK`（未施行） | P0 |
| S6B-TC-38 | §4 V-8（`gate` 38/38 + `sweep ok`） | e2e | 正例 | 机器 | `GATE` + `SWEEP` | P0 |
| S6B-TC-39 | §3.7 不变量 12（`roleKind` / `label` 非空） | 集成 | 负例 | 机器 | `COPY` + `GATE` | P0 |
| S6B-TC-40 | §4 V-8（用例数不得低于基线） | e2e | 边界 | 机器 | `COUNT` | P1 |
| S6B-TC-41 | §3.1 项对象形态（`id` 唯一 / 谓词 / 禁原型链名 / `text` 非空） | 单元 | 正例 | 机器 | `PROBE` | P0 |
| S6B-TC-42 | §3.1「禁止两组共用同一 `id`」+ 禁原型链保留名 | 集成 | 负例 | 机器 | `COPY` + `GATE` | P1 |
| S6B-TC-43 | §3.3 缺省解析 = `review.ledger` | 单元 | 正例 | 机器 | `PROBE` | P0 |
| S6B-TC-44 | §3.3 / §4 **V-5④**（旧句第三段落 `clause`） | 集成 | 边界 | 机器 | `PROBE` | P0 |
| S6B-TC-45 | §6 D6（黄金追加 `senior-sdet@1`、旧键不删） | 集成 | 正例 | 机器 | `PROBE` | P0 |
| S6B-TC-46 | §6 D6（自哈希 / 删旧键必红） | 单元 | 负例 | **机器（父测试 exit 0 / 副本内断言红）** | `COPY` + `PROBE` | P0 |
| S6B-TC-47 | §3.1 / §6 D1'（`dump.paths.groups` 为 `text` 数组投影） | 集成 | 正例 | 机器 | `DUMP` + `PROBE` | P0 |
| S6B-TC-48 | §3.6（纯度清单类改读 `item.text`） | 集成 | 边界 | 机器 | `COPY` + `GATE` | P0 |
| S6B-TC-49 | §3.1 / §3.7 不变量 10（`writeScope` / `excludePathItems` 用原型链保留名） | 集成 | 负例 | 机器 | `COPY` + `GATE` | P0 |
| S6B-TC-50 | §3.7 **不变量 14**（scope 引用绑定）+ §5 | 集成 | 负例 | 机器 | `COPY` + `GATE` | P0 |
| S6B-TC-51 | §3.3（显示名扫描面含 `writeScopes.mjs`，覆盖 `roleKind` / `label` 两字段）+ §5 `SeatNameInDefinition` | 集成 | 负例 | 机器 | `COPY` + `GATE` | P0 |
| S6B-TC-52 | §3.7 不变量 13（`writeScopes` 键集**恰两值**；多出第三值 → `writeScope=<scope>:not-allowed`）+ §5 | 集成 | 负例 | 机器 | `COPY` + `GATE` | P0 |
| S6B-TC-53 | §3.2 `hostRule` / §3.4 槽 15 `HOST_RULE` / §4 V-6 / §6 D3（非议会席「主持人」命中 0） | 集成 | 正例 | 机器 | `PROBE` + `COPY` | P0 |

### 1.1 计数核算（现算）

- **正例（22）**：S6B-TC-01 / 02 / 05 / 06 / 10 / 11 / 16 / 17 / 20 / 22 / 24 / 26 / 27 / 30 / 32 / 37 / 38 / 41 / 43 / 45 / 47 / **53**
- **负例（18）**：S6B-TC-03 / 07 / 12 / 13 / 18 / 21 / 23 / 28 / 31 / 35 / 36 / 39 / 42 / 46 / 49 / 50 / 51 / 52
- **边界（13）**：S6B-TC-04 / 08 / 09 / 14 / 15 / 19 / 25 / 29 / 33 / 34 / 40 / 44 / 48
- 合计 **53 ≤ 80**；**负 + 边 = 31 ≥ 正 = 22**，成立。
- 台账：轮 1 = 50；轮 2 合并 4 组（−4）+ 新增 2（+2）= 48；轮 3 新增 3 条负例（原型链名 49 / scope 绑定 50 / 显示名扫描面 51）= 51；轮 4 新增 1 条负例（键集第三值 52）= 52；轮 5 新增 1 条正例（**第 15 槽 `HOST_RULE` 数据化 53**）= **53**。

## 2 用例明细

> **全节 `COPY` 用例的统一形态**：父测试在副本内**改一处数据** → 用 `runCli(dir, …)` / `runEsm(dir, …)` 子进程**只取数** → **父测试自己 `assert`**。子进程退出码只作旁证。**禁止**父测试 `import('<副本>/…')` 副本内模块（副本路径不在 ESM 解析面，且模块在 import 时即固化）。

### S6B-TC-01 两评审席渲染 == 批次起点卡面的「## 边界」节（逐字），三文件 diff 0 行

- **覆盖**：spec §4 **V-1** 第 1 句（`sha(renderBoundary(席))` == `sha(批次起点卡面「## 边界」节)`）+ 第 2/3 句（两卡 diff 0 行、`docs/agents/senior-sdet.md` diff 0 行）
- **前置**：`BASE` = `2eb0b5bf…`；可跑 `git show <BASE>:agents/<席>.md`
- **步骤**：① `PROBE` 取 `sha(renderBoundary('reviewer-audit'))`；② 取 `sha(cardBoundary(git show <BASE>:agents/reviewer-audit.md))`；③ `assert.equal(①, ②)` 且两者 = `aaa1ed1b…b4f96`；④ `detective-observer` 同形，两值 = `a9bdacba…e052`；⑤ `git diff <BASE> -- agents/reviewer-audit.md agents/detective-observer.md docs/agents/senior-sdet.md`，取 stdout 行数
- **预期**：③④ 全等；⑤ = 0 行
- **判据**：`PROBE` **exit 0**（四个 `assert.equal`）+ `COUNT`（diff 行数 = 0，**不看 `git diff` 退出码**）
- **红绿证据**：截至 `BASE` 实测：四值逐一相等（见 §0.1 两行「同上」）+ diff 空 → **现绿**；判别力由 S6B-TC-03 承担
- **对应测试**：`tools/docgen/test/policy-pure-source.test.mjs` 的 `test('S6B-TC-01 …')` 块
- **不覆盖**：`senior-sdet` 的渲染变化（本批**预期会变**，见 S6B-TC-05）

### S6B-TC-02 卡面 = 渲染逐字节，且首句仍是「你是评审席（审计）。」

- **覆盖**：spec §4 **V-1** 的落盘侧；§3.4 首句改动「两评审席渲染后仍为『你是评审席（审计）。』」
- **前置**：15 卡已重生成（施工流程）
- **步骤**：① `GATE`；② `PROBE` 取 `agents/reviewer-audit.md` 的「## 边界」段（`cardBoundary()` 同形），与 `renderBoundary('reviewer-audit')` `assert.equal`；③ 断言该段以 `你是评审席（审计）。` 开头
- **预期**：① exit 0、末行 `baseline 38/38`；② 逐字节相等；③ 前缀命中
- **判据**：`GATE` **exit 0** + `PROBE` **exit 0**
- **红绿证据**：截至 `BASE` 实测 `baseline 38/38`、卡面首句 `你是评审席（审计）。` → **现绿**，施工后须仍绿
- **对应测试**：`test('S6B-TC-02 …')`
- **不覆盖**：措辞质量（§8 第 1 条不测）

### S6B-TC-03 改「评审账本」作用域一字 → V-1 必红（判别力）

- **覆盖**：spec §4 **V-1**（不是「写死就等于不变」）；§3.2
- **前置**：S6B-TC-01 的断言已落；`COPY` 可改新文件 `writeScopes.mjs`
- **步骤**：① `COPY` 内把 `writeScopes['review.ledger'].label` 末尾追加 `X`；② `runEsm` 打印两席 sha；③ 父测试 `assert.notEqual(<sha>, <S6B-TC-01 取值>)` 两次
- **预期**：两席 sha 都变 → 两条 `notEqual` 成立（即 S6B-TC-01 会红）
- **判据**：`PROBE` **exit 0**；若两席 sha **未变** → `assert.notEqual` 抛 → exit 1（说明 `WRITE_SCOPE` 没接到模板，或模板仍写字面）
- **红绿证据**：**未施行（施工后核）**；判别力现态可证：`renderBoundary('senior-sdet')` 首句截至 `BASE` 是模板字面 `你是评审席（测试开发）。` → 「改数据不改渲染」是现态，该断言对现态必红
- **对应测试**：`test('S6B-TC-03 …')`
- **不覆盖**：两席是否等于黄金（S6B-TC-04）

### S6B-TC-04 黄金**不作判据**：直接求值两条「不等」断言

- **覆盖**：spec §4 **V-1** 末句（「黄金 `reviewer-audit` / `reviewer-audit@2` 与现卡本就不相等（属历史定位线索）→ **不作判据**」）+ §6 **D6**
- **前置**：可读 `boundary-golden.json`
- **步骤**：① `assert.equal(sha(renderBoundary('reviewer-audit')) === golden['reviewer-audit'], false)`；② `assert.equal(sha(renderBoundary('reviewer-audit')) === golden['reviewer-audit@2'], false)`；③ `assert.equal(goldenKeyFor('reviewer-audit'), 'reviewer-audit@2')`
- **预期**：①② 都为 `false`（两键都不等于现渲染）；③ 真
- **判据**：`PROBE` **exit 0**（三个可直接求值的 `assert.equal`，**不留未定义变量**）
- **红绿证据**：截至 `BASE` 实测三条：渲染 `aaa1ed1b…`；`golden['reviewer-audit']` = `3ae06a90…`；`golden['reviewer-audit@2']` = `bb06aee7…` → ①② 均为 `false`、③ 真 → **现绿**
- **对应测试**：`test('S6B-TC-04 …')`
- **不覆盖**：V-1 的通过与否（由 S6B-TC-01 决定）；黄金是否该换代（D6 只管追加）

### S6B-TC-05 `agentData` 的 `senior-sdet.boundary === renderBoundary('senior-sdet')`

- **覆盖**：spec §4 **V-2** 第 1 句；§3.6（`boundaryBySeat` 改渲染）
- **前置**：施工后 `patternRegistry` 已删 `SDET_BOUNDARY`
- **步骤**：① `PROBE` 取 `agentData.find(a => a.name === 'senior-sdet').boundary`；② 与 `renderBoundary('senior-sdet')` `assert.equal`；③ 与 `patternRegistry.boundaryBySeat['senior-sdet']` `assert.equal`；④ `assert.equal(typeof …, 'string')`；⑤ 断言首句 = `你是测试设计（测试开发）。`
- **预期**：②③④⑤ 全真
- **判据**：`PROBE` **exit 0**
- **红绿证据**：截至 `BASE` 实测 `agentData` 该席 `boundary` = 旧单句（`1854ee34…`），而 `renderBoundary('senior-sdet')` = 五段文本（`d0377bc5…`）→ **现红**（正是 V-2 要改的）；施工后绿
- **对应测试**：`test('S6B-TC-05 …')`
- **不覆盖**：该席卡面是否已重出（S6B-TC-09）

### S6B-TC-06 `SDET_BOUNDARY` 导出面已删，且代码面 `git grep` 命中 0

- **覆盖**：spec §4 **V-2** 第 2 句（扫描面 = `tools/ agents/ skills/`）；§3.6
- **前置**：`tools/docgen/test/sb-contract-layer.test.mjs` 的注释同批改（见 §4 建议 2）
- **步骤**：① `PROBE` 断言 `Object.hasOwn(patternRegistry, 'SDET_BOUNDARY') === false`；② 断言 `boundaryBySeat['senior-sdet'] === renderBoundary('senior-sdet')`；③ `git grep -l SDET_BOUNDARY -- tools agents skills`，取 stdout 集合
- **预期**：① 真；② 真；③ 集合为空（0 文件）
- **判据**：`PROBE` **exit 0** + `COUNT`（stdout 行数 = 0；**不看 `git grep` 退出码**——无命中时它是 1）
- **红绿证据**：截至 `BASE` 实测 2 文件命中（`patternRegistry.mjs` 定义处 + `sb-contract-layer.test.mjs` 注释）→ 施工后归 **0**；D-16 裁定后 `patternRegistry.mjs` 的注释字面也已删（现为「该席专用边界常量已删」），`git grep -l SDET_BOUNDARY -- tools agents skills` 现取 stdout = **空**（退出码 1，不作判据）
- **对应测试**：`test('S6B-TC-06 …')`
- **不覆盖**：`docs/` 历史残留（S6B-TC-08）

### S6B-TC-07 副本回填 `SDET_BOUNDARY` → S6B-TC-06 的导出面断言必红

- **覆盖**：spec §4 **V-2**（回填即违规）
- **前置**：S6B-TC-06 断言已落
- **步骤**：① `COPY` 内在 `patternRegistry.mjs` 追加 `export const SDET_BOUNDARY = '…';`；② `runEsm` 打印 `Object.hasOwn(PR, 'SDET_BOUNDARY')`（**模块命名空间**，不是 `patternRegistry` 对象——`export const` 只进前者）与 `boundaryBySeat['senior-sdet'] === renderBoundary(...)`
- **预期**：`true` / `false` → S6B-TC-06 的两条断言各抛一次
- **判据**：**父测试 exit 0**（外层用 `assert.throws` 捕获副本内那次断言抛）；**副本内那次断言 exit 1 只作旁证**——常驻测试不得把自己的结果写成「`PROBE` exit 1」（否则与 V-8 的 `# fail 0` 互斥、永久红）
- **红绿证据**：构造有效性实测：`Object.hasOwn(PR,'SDET_BOUNDARY')` = **true**、`Object.hasOwn(patternRegistry,'SDET_BOUNDARY')` = **false**（原写法查错对象、构造无效，D-16 轮已改）；故改后断言对副本必抛，对真仓（无该 export）必绿
- **对应测试**：`test('S6B-TC-07 …')`
- **不覆盖**：副本内跑 `git grep`（副本无 `.git`，跑不了）

### S6B-TC-08 `git grep` 面必须收窄到 `tools/ agents/ skills/`（`docs/` 7 文件是历史）

- **覆盖**：spec §4 **V-2**「扫描面 = 三个载体目录；`docs/` 历史件不在面内」+ §2.6（不改已签件原文）
- **前置**：可跑 `git grep`
- **步骤**：① `git grep -l SDET_BOUNDARY -- docs` → 记录文件数；② `git grep -l … -- tools agents skills` → 记录；③ 断言「判据面 = ②，① 的数**不进断言**」（静态断言：测试源码里的 grep 调用不出现 `-- docs` / `-- .`）
- **预期**：① = **7**（截至 `BASE`；本 testcase 入库后 → **8**，因本文件正文含该词）；② = 0（施工后）
- **判据**：`COUNT`（② 行数 = 0）＋ 静态断言
- **红绿证据**：截至 `BASE` 实测 ① = 7 / ② = 2；D-16 后注释字面已删 → ② 现 **0**；若面写成 `-- .`，截至 `BASE` 即 9 文件、本 testcase 入库后 10 → 恒红
- **对应测试**：`test('S6B-TC-08 …')`
- **不覆盖**：`docs/` 历史件是否该加指针（§2.6 只许加日期注，不在本批）

### S6B-TC-09 卡面重出后 `gate` 复绿；`docs/agents/senior-sdet.md` 与 `BASE` 零差异

- **覆盖**：spec §3.6 末两条（恢复路径 = **`draft` → 对照 → `replace`**，**不用** `generate --readme --apply`；`docs/agents/senior-sdet.md` 是投影、**不含 `## 边界` 段** → 本批零改动）+ §4 V-2 收口
- **前置**：施工已按 `draft` → `replace` 重出 `agents/senior-sdet.md`
- **步骤**：① `GATE` → exit 0 / `baseline 38/38`；② `PROBE` 断言 `cardBoundary(agents/senior-sdet.md) === renderBoundary('senior-sdet')`；③ `git diff <BASE> -- docs/agents/senior-sdet.md` 取行数 = 0；④ **机器**：在当次账本里数「以 `generate --readme --apply` 作为卡面恢复手段」的条目数 = 0（`COUNT`）；**人工**：复核账本命令序列为 `draft` → `replace`，无 `generate` 挡卡面
- **预期**：①②③ 真；④ 机器计数 0 + 人工确认序列正确
- **判据**：`GATE` exit 0 + `PROBE` exit 0 + `COUNT`（③ = 0 行、④ 计数 = 0）；**④ 的「命令序列对不对」= 人工核**（写进当次账本），机器只判「账本里没有把 `generate --apply` 当卡面恢复手段」
- **红绿证据**：截至 `BASE` 实测：`agents/senior-sdet.md` 边界段 = 旧单句（`1854ee34…`）、`docs/agents/senior-sdet.md` **无 `## 边界` 段** → ② 现红、③ 现绿（本来就零差异）；施工后 ② 绿、③ 须仍绿
- **对应测试**：①②③ 可落常驻断言；④ 一次性
- **不覆盖**：卡面读者可读性（§8 第 1 条）

### S6B-TC-10 模板文件内「评审席」「本次评审账本」命中 0

- **覆盖**：spec §4 **V-3** 第 1 句（扫描面 = 模板文件）；§3.4 两处模板改动
- **前置**：模板已改（首句 `你是{{ROLE_KIND}}（{{SEAT}}）。`；写入范围句 `**只允许写**：{{WRITE_SCOPE}}。…`）
- **步骤**：① `COUNT` 读 `tools/docgen/templates/boundary.md.tpl`，数 `评审席` 出现次数；② 同 `本次评审账本`
- **预期**：① 0；② 0
- **判据**：`COUNT`（两个计数各 `= 0`）
- **红绿证据**：截至 `BASE` 实测各 **1**（模板首行与写入范围行）→ **现红**；施工后 0
- **对应测试**：`test('S6B-TC-10 …')`
- **不覆盖**：渲染产物里的同名文本（S6B-TC-15 专判「这是数据，不许判红」）

### S6B-TC-11 `ROLE_KIND` / `WRITE_SCOPE` 逐席 = `writeScopes` 的两字段

- **覆盖**：spec §4 **V-3** 第 2 句；§3.2；§3.4 槽 13 / 14
- **前置**：`writeScopes.mjs` 已建；`seats.mjs` 已加 `writeScope`
- **步骤**：① `PROBE` 取 `slotValues('senior-sdet')` 的 `ROLE_KIND` / `WRITE_SCOPE`；② `assert.equal` 到 `writeScopes['spec.testcase'].roleKind` / `.label`；③ 对 `reviewer-audit` / `detective-observer` 同样断言 = `writeScopes['review.ledger']` 两字段；④ `__default__` 同样 = `review.ledger`
- **预期**：②③④ 逐项相等
- **判据**：`PROBE` **exit 0**
- **红绿证据**：截至 `BASE` `SLOTS` 无这两槽（实测 12 名）→ 取值为 `undefined` → **现红**
- **对应测试**：`test('S6B-TC-11 …')`
- **不覆盖**：这两个值在卡面的位置（位置归 S-B 段结构，本批不动）

### S6B-TC-12 副本把「你是评审席（{{SEAT}}）」写回模板 → 计数必红

- **覆盖**：spec §4 **V-3** 的判别力；§3.4
- **前置**：S6B-TC-10 计数断言已落
- **步骤**：① `COPY` 内把首句改回 `你是评审席（{{SEAT}}）。`；② 子进程打印模板内 `评审席` 计数；③ 父测试 `assert.equal(<count>, 0)` 抛
- **预期**：count = 1 → 抛
- **判据**：`PROBE` exit 1（父测试断言）。**注意**：`assertTemplatePure` **抓不到**裸词（不在反引号里、也不是清单类成员）→ 红只能靠计数断言
- **红绿证据**：**未施行（施工后核）**；判别力截至 `BASE` 可证（现值本身就是 1）
- **对应测试**：`test('S6B-TC-12 …')`
- **不覆盖**：把字面写进反引号（那会触发纯度守卫，见 S6B-TC-14）

### S6B-TC-13 副本改 `writeScopes['spec.testcase'].label` 一处 → 只有 `senior-sdet` 渲染跟随

- **覆盖**：spec §4 **V-3**（数据化 = 改数据即改渲染）；§3.2「改一条只动一个文件」
- **前置**：`senior-sdet` 已接模板
- **步骤**：① `COPY` 内给 `spec.testcase.label` 前插探针串 `〖S6B-PROBE〗`；② `runEsm` 打印三席渲染；③ 父测试断言 `senior-sdet` 渲染 `includes` 探针；④ 断言两评审席渲染**不含**探针且与 S6B-TC-01 取值相等
- **预期**：③ 真；④ 真
- **判据**：`PROBE` **exit 0**；若③ 假 → 模板仍写字面（数据没接上）→ 必红
- **红绿证据**：**未施行（施工后核）**
- **对应测试**：`test('S6B-TC-13 …')`
- **不覆盖**：`roleKind` 的同形态（同一机制，步骤里可加一条探针，不单列条目）

### S6B-TC-14 两条账本字面已从 `TEMPLATE_ALLOWED_LITERALS` 删除；写回即 `TemplateImpure`

- **覆盖**：spec §3.6（「模板不再含两段字面 → 从白名单删除」）+ §4 **V-3**
- **前置**：白名单已删两条；`assertTemplatePure()` 由 `validatePolicy()` 调用
- **步骤**：① `PROBE` 断言 `TEMPLATE_ALLOWED_LITERALS` 不含 `.session/reviews/<本次>/` 与 `docs/superpowers/reviews/<本次>/`；② `COPY` 内把 `.session/reviews/<本次>/`（带反引号）写回模板；③ `GATE` 取 exit 与 stderr 首行；④ 真仓 `GATE` 绿档
- **预期**：① 两条都不在；② 构造生效；③ exit 1、首行 `TemplateImpure: tools/docgen/templates/boundary.md.tpl:.session/reviews/<本次>/`；④ exit 0
- **判据**：① `PROBE` exit 0；③ `assert.equal(exit, 1)` + 首行全等；④ `GATE` exit 0
- **红绿证据**：截至 `BASE` 白名单**含**这两条（§0.1）→ ① 现红；③ 因白名单还在，写回**不**抛 → 现红（正是本条要的施工后形态）
- **对应测试**：`test('S6B-TC-14 …')`
- **不覆盖**：模板读取失败的稳定错误面（§8 第 4 条）

### S6B-TC-15 面宽判别力：渲染卡**必然**含「评审席」——扫卡面会假红

- **覆盖**：spec §4 **V-3** 的扫描面（本条反向证明「面必须 = 模板文件」）；§0.2 口径 3
- **前置**：无需施工（现态即可跑）
- **步骤**：① `COUNT` 数 `agents/reviewer-audit.md` 全文 `评审席` 出现次数；② 同 `本次评审账本`；③ 静态断言 V-3 判据的读取目标恰为 `tools/docgen/templates/boundary.md.tpl`
- **预期**：① ≥1；② ≥1（**卡面有、模板无**）；③ 真
- **判据**：`COUNT`（①② 均 ≥1）+ 静态断言
- **红绿证据**：截至 `BASE` 实测卡面 `评审席` 1 / `本次评审账本` 1（首句与写入范围行）
- **对应测试**：`test('S6B-TC-15 …')`
- **不覆盖**：`senior-sdet` 施工后是否仍含「评审席」（**不该**——它渲「测试设计」，由 S6B-TC-05 第 ⑤ 步兜）

### S6B-TC-16 【V-5③(a)】本席 `excludePathItems` 的项级移除恰为 `code.test`，且「代码」仍被禁

- **覆盖**：spec §4 **V-4** + **V-5③(a)**（项级移除，只读 `excludePathItems`）；§3.2；§3.5
- **前置**：`writeScopes['spec.testcase'].excludePathItems = ['code.test']`
- **步骤**：① `DUMP` 取 `seats['senior-sdet'].expanded[9]`；② `assert.ok(<v>.includes('排除「测试」'))`；③ `PROBE` 取 `pathGroups.code` 的项 id 集，断言含 `code.src` 且其 `text === '代码'`；④ 断言 `<v>` **不含** `排除「代码」`；⑤ **只读 `excludePathItems`** 判项级移除：`assert.deepEqual(writeScopes['spec.testcase'].excludePathItems, ['code.test'])`（不引用 `git show` 的旧定义层文本）
- **预期**：②③④⑤ 全真
- **判据**：`PROBE` **exit 0**
- **红绿证据**：截至 `BASE` 实测 `expanded[9]` = 基准句（**无**排除注）→ **现红**
- **对应测试**：`test('S6B-TC-16 …')`
- **不覆盖**：**元素级**新旧 diff（V-5③(b)，归 S6B-TC-24 / 25，**不得混写**）；「清空 / 未用项不判红」的 ⊆ 口径（归 S6B-TC-17）

### S6B-TC-17 【V-5③(a) 反面 + 不变量 13 ⊆】无排除项席零字节；清空本席排除项**不判红**

- **覆盖**：spec §4 **V-4** 第 3 条（`slotValues('reviewer-audit')` 不含「排除」）+ §3.5「无排除项时一个字节都不加」+ **§3.7 不变量 13**（`spec.testcase` ⊆ `['code.test']`：**清空不判红**）
- **前置**：两评审席走缺省 `review.ledger`（`excludePathItems: []`）；`COPY` 可改 `writeScopes.mjs`
- **步骤**：① `DUMP` 取两席 `expanded[9]`；② `assert.equal` 各与基准句 `` `pathGroups`（六组）与一项模式项（spec 与 plan 的两种写法） `` 全等（连空格都相同）；③ 断言两值均 `!includes('排除')`；④ `COPY` 内把 `spec.testcase.excludePathItems` **清空为 `[]`** → `DUMP`（即 `node tools/docgen/cli.mjs policy --dump`，**不用 `GATE`**：清空后卡面未重出必然 `Mismatch`，与不变量 13 无关）；⑤ `runEsm` 取副本内 `senior-sdet` 的该槽，断言与基准句**逐字全等**（零字节追加）
- **预期**：②③ 全真；④ **exit 0**（清空不判红——⊆ 而非全等；`policy --dump` 同样调 `validatePolicy`、只不比对卡面）；⑤ 全等
- **判据**：`PROBE` **exit 0** + `DUMP` **exit 0**
- **红绿证据**：截至 `BASE` 实测两席该槽即基准串（§0.1）→ ②③ 现绿，施工后须仍绿；④ 的判别力：若实现把不变量 13 读成「逐 scope 集合必须**全等**白名单」，清空会被判红 → `policy --dump` 即非 0（这正是本条要钉的口径）；实测清空后 `GATE` exit 1（卡面失配）、`policy --dump` exit 0
- **对应测试**：`test('S6B-TC-17 …')`
- **不覆盖**：两席整段渲染（S6B-TC-01）；白名单**外**的项（归 S6B-TC-36）；把排除项设成未登记 ID（归 S6B-TC-31）

### S6B-TC-18 表驱动：排除项写成组 ID `code` / 字面「测试」→ 各 `UnknownPolicyRef`

- **覆盖**：spec §3.7 不变量 10（`excludePathItems` 每项须 ∈ 全部路径项 `id`）+ §2.2（不按组整组放开）+ §4 **V-4**
- **前置**：`COPY` 可改 `writeScopes.mjs`
- **步骤**：① 副本内 `spec.testcase.excludePathItems = ['code']` → `GATE`；② 同一副本改回，再设 `['测试']` → `GATE`；③ 两次各取 exit 与 stderr 首行
- **预期**：两次都 exit 1；首行分别 `UnknownPolicyRef: writeScope=spec.testcase:excludePathItem=code` / `UnknownPolicyRef: writeScope=spec.testcase:excludePathItem=测试`（**scope 级报文**，D-16 裁定；首段不是席名）
- **判据**：表驱动两行各 `assert.equal(exit, 1)` + `assert.equal(首行, 期望)`（两个输入同一用例，**不拆两条**）
- **红绿证据**：实测（副本）：`['code']` → exit 1 首行 `UnknownPolicyRef: writeScope=spec.testcase:excludePathItem=code`；`['测试']` → 同形 `…=测试`（`validatePolicy.mjs:233`）。若实现按组 / 按字面放开，两次都会 exit 0 → 本条必红
- **对应测试**：`test('S6B-TC-18 …')`
- **不覆盖**：`code.test` 合法（S6B-TC-16 即其绿档）

### S6B-TC-19 排除注在**基准句整句之后**追加，且文本由被排除项 `text` 现算

- **覆盖**：spec §3.5（「在基准句整句之后追加一条排除注（不插进原句内部）」+「排除注文本由被排除项的 `text` 现算」）+ §4 **V-5⑤**（排除注不改变模板「除上述落点外，任何写文件或重定向一律禁止」）
- **前置**：`senior-sdet` 已接模板
- **步骤**：① `PROBE` 取 `slotValues('senior-sdet').FORBIDDEN_PATHS`，断言以基准句 `startsWith`（基准句子串**完整保留**）；② 断言整值 `=== 基准句 + '（本席按写作用域排除「测试」）'`；③ `COPY` 内把 `code.test` 的 `text` 由 `测试` 改为 `测试项`，`runEsm` 取该槽，断言含 `排除「测试项」` 且**不含** `排除「测试」`，且基准句仍完整；④ 断言 `renderBoundary('senior-sdet')` 仍**逐字**含 `除上述落点外，任何写文件或重定向一律禁止`（排除注只追加在句尾，不改这句）
- **预期**：①②③④ 全真
- **判据**：`PROBE` **exit 0**
- **红绿证据**：截至 `BASE` 实测该槽 = 基准句整句、**无**任何追加（§0.1）→ ② 现红；③ 判别力：若注文本硬写「测试」，③ 必假；④ 现绿（模板已有该句，施工不得删）
- **对应测试**：`test('S6B-TC-19 …')`
- **不覆盖**：注的标点样式是否与 §3.5 逐字一致（除 ② 的全等外不再判第二种写法）

### S6B-TC-20 【V-5①】「允许写」两侧全等（旧单句的 `只写…；` 段 == 新 `label`）

- **覆盖**：spec §4 **V-5①**；§3.2 `label` 文本（含「由你负责的」）
- **前置**：可从 `git show <BASE>:tools/docgen/components/patternRegistry.mjs` 取旧串
- **步骤**：① 取旧 `SDET_BOUNDARY` 全文，切出 `只写` 与 `；` 之间的段（去首尾空白）；② 取 `writeScopes['spec.testcase'].label`；③ `assert.equal`
- **预期**：两侧全等 = `本次 spec 同目录的 \`-testcase.md\` 与同目录由你负责的测试设计文档`
- **判据**：`PROBE` **exit 0**
- **红绿证据**：旧串截至 `BASE` 可实取（§0.1）；新 `label` 施工后才有 → **未施行（施工后核）**
- **对应测试**：`test('S6B-TC-20 …')`
- **不覆盖**：标签在卡面的呈现形式（S6B-TC-05 第 ⑤ 步只判首句）

### S6B-TC-21 表驱动：`label` 多授权 / 减授权 → V-5① 各必红

- **覆盖**：spec §4 **V-5①**（两侧**全等**，不是「包含」）；§2.1（不放宽）
- **前置**：S6B-TC-20 断言已落
- **步骤**：① 副本内把 `label` 末尾追加 `、代码` → 取新 `label`，与旧段 `assert.equal`；② 同一副本改回，再删掉 `\`-testcase.md\`` → 再 `assert.equal`
- **预期**：两次都不等 → 两条断言各抛
- **判据**：**父测试 exit 0**（两个输入各用 `assert.throws` 捕获副本内断言抛）；**副本内两次断言 exit 1 只作旁证**——常驻测试自身不得写成「`PROBE` exit 1」。判别力在于 `assert.equal` 而非 `includes`（后者在「删一项」时仍绿）
- **红绿证据**：**未施行（施工后核）**；第二条的判别力依据：写成 `includes('-testcase.md')` 时删掉仍绿
- **对应测试**：`test('S6B-TC-21 …')`
- **不覆盖**：真的多授权后卡面是否可执行（本仓无运行时授权，见前作 §10）

### S6B-TC-22 【V-5②】禁写旧点名集在新集合里逐项有覆盖，差集为空

- **覆盖**：spec §4 **V-5②**（`代码` ⊇ `业务代码`；差集为空）
- **前置**：可读 `pathTokens()` 与 §3.1 后的 `pathGroups`
- **步骤**：① 从 `git show <BASE>:…/patternRegistry.mjs` 的旧 `SDET_BOUNDARY` 切出 `禁写` 与 `及上述清单外的任何路径` 之间的段，按 `、` 切、去反引号，得旧点名集（5 项）；② 取 `pathTokens()`；③ 对每个旧项 `t`，断言 `∃ n ∈ pathTokens()` 使 `t === n` 或 `t.includes(n)`；④ 断言未覆盖项集合为空
- **预期**：5/5 覆盖；未覆盖集 = `[]`
- **判据**：`PROBE` **exit 0**
- **红绿证据**：旧点名集截至 `BASE` 可得（`业务代码` / `spec / plan 正文` / `rules/` / `skills/` / `agents/`）；`pathTokens()` 现 = 20 项且已含 `代码` / `spec / plan` / `rules/` / `skills/` / `agents/` → **现绿**，施工后须仍绿
- **对应测试**：`test('S6B-TC-22 …')`
- **不覆盖**：语义等价之外的「措辞更严」判断（人工）

### S6B-TC-23 【V-5②】副本删 `rules/` 项 → 覆盖缺口必红

- **覆盖**：spec §4 **V-5②** 的判别力
- **前置**：S6B-TC-22 断言已落
- **步骤**：① `COPY` 内从 `paths.mjs` 的 `governance` 组删掉 `rules` 项；② `runEsm` 打印未覆盖集；③ 父测试断言未覆盖集 = `[]`
- **预期**：未覆盖集 = `['rules/']` → 抛
- **判据**：**父测试 exit 0**（`assert.throws` 捕获副本内断言抛）；**副本内断言 exit 1 只作旁证**——常驻测试自身不得写成「`PROBE` exit 1」
- **红绿证据**：**未施行（施工后核）**
- **对应测试**：`test('S6B-TC-23 …')`
- **不覆盖**：删 `agents/` 或 `skills/`（同一断言，不重复）

### S6B-TC-24 【V-5③(b)】新旧定义层**元素文本** diff：移除 `代码、测试`、新增 `代码` + `测试`

- **覆盖**：spec §4 **V-5③(b)**（按**元素文本** diff + 按 token 级 20 → 20 集合不变）；§3.1
- **前置**：可按 §0.2 口径 4 只读定义层（**不引用** `excludePathItems`）
- **步骤**：① 从 `git show <BASE>:…/paths.mjs` 的 `export const pathGroups = {` 到匹配 `};` 的块内抽引号串，得旧数组元素（**应得 18**）；② 取新 `pathGroups` 每项 `text`（19）；③ 算 `old − new` 与 `new − old`（按元素文本比）；④ 断言 `old − new === ['代码、测试']`、`new − old` 排序后 = `['代码','测试']`，且旧其余 17 项未变；⑤ 断言 `pathTokens()` 两侧集合相等且长度各 20
- **预期**：④⑤ 全真（不做项级移除判断——那归 S6B-TC-16 / 17；**不判旧句点名集**——那归 V-5② 的 S6B-TC-22，避免把 ② 混进 ③(b)）
- **判据**：`PROBE` **exit 0**
- **红绿证据**：旧数组元素截至 `BASE` 可取（`code: ['代码、测试']` 等 18 项）；⑤ 现值 `pathTokens()` = 20 且已含 `代码`/`测试` → **现绿**（施工后须仍绿）
- **对应测试**：`test('S6B-TC-24 …')`
- **不覆盖**：`code.src` 的 `text` 是否恰为「代码」（S6B-TC-16 第 ③ 步）

### S6B-TC-25 三数口径独立现算：18→19 / 19→20 / 20→20（两种读法各自独立）

- **覆盖**：spec §3.1 三条计数句；§3.8 表（V-1③ 现值）；§4 V-5③ 的 (a)/(b) **分立**要求
- **前置**：施工后
- **步骤**：① `Object.values(pathGroups).flat().length`；② `pathItems().length`；③ `pathTokens().length`；④ 静态断言：(a) 判据（S6B-TC-16 / 17）只读 `writeScopes`、(b) 判据（S6B-TC-24）只读定义层与 `git show`，**两处代码不含对方的读取源**
- **预期**：19 / 20 / 20；④ 真
- **判据**：`PROBE` **exit 0**（三个 `assert.equal` + 一个静态断言）
- **红绿证据**：截至 `BASE` 实测 18 / 19 / 20 → ①② **现红**、③ 现绿；施工后三值如上
- **对应测试**：`test('S6B-TC-25 …')`
- **不覆盖**：S6 原文 §8 V-1③ 的历史三数（只作历史，见 §3.8）

### S6B-TC-26 槽集恰 15、顺序 = §3.4 表行序、每槽至少被引用一次

- **覆盖**：spec §4 **V-6**；§3.7 不变量 11；§3.4 表（15 行，含第 15 槽 `{{HOST_RULE}}`）
- **前置**：`SLOTS` 已扩
- **步骤**：① 断言 `SLOTS` 全等 = **15** 名有序数组（`…DETECTION_CMD, ROLE_KIND, WRITE_SCOPE, HOST_RULE`）；② 从模板抽 `{{…}}` 得槽集，与 `SLOTS` 排序后 `deepEqual` 且长度 **15**；③ 对每名断言模板内出现次数 ≥ 1
- **预期**：①②③ 全真
- **判据**：`PROBE` **exit 0**
- **红绿证据**：截至 `BASE` `SLOTS` = 12（§0.1）→ **现红**
- **对应测试**：`test('S6B-TC-26 …')`
- **不覆盖**：槽值的正确性（S6B-TC-11 / 27）

### S6B-TC-27 `expanded` 长度 15，且 index 12 / 13 / 14 = `ROLE_KIND` / `WRITE_SCOPE` / `HOST_RULE`

- **覆盖**：spec §4 **V-6** 第 2 句；§3.4「`expanded` 索引口径 = 上表行序（0–14）」
- **前置**：同上
- **步骤**：① `DUMP` 取 `seats[席].expanded`（三席 + `__default__`）；② 逐席断言 `length === 15`；③ 断言 `expanded[12] === slotValues(席).ROLE_KIND`、`expanded[13] === …WRITE_SCOPE`、`expanded[14] === …HOST_RULE`；④ 断言全项无 `undefined` / `null` / `{{` 残留
- **预期**：②③④ 全真
- **判据**：`DUMP` + `PROBE` **exit 0**
- **红绿证据**：截至 `BASE` 实测每席 `expanded.length = 12` → **现红**
- **对应测试**：`test('S6B-TC-27 …')`
- **不覆盖**：`dump` 顶层键集（前作 F01 已判，本批不动）

### S6B-TC-28 表驱动：模板漏 `{{WRITE_SCOPE}}` / 多 `{{EXTRA}}` → 各 `TemplateImpure`

- **覆盖**：spec §3.7 不变量 11（「每槽至少被引用一次」+「无多余槽」）+ §5
- **前置**：`validatePolicy()` 由 `GATE` 调用
- **步骤**：① `COPY` 内删 `{{WRITE_SCOPE}}` → `GATE`；② 同一副本改回，再追一行 `{{EXTRA}}` → `GATE`；③ 两次取 exit 与首行
- **预期**：两次都 exit 1；**首行不作要求**（删槽：`TemplateImpure: tools/docgen/templates/boundary.md.tpl:WRITE_SCOPE`；多槽：模板在导入期即抛，首行可为堆栈定位行）——按 spec **§8.4**「不测模板 / 配置读取失败的稳定错误面」，本条只判退出码
- **判据**：表驱动两行各 `assert.equal(exit, 1)`；**不比对首行字面**（D-17 裁定：多槽的稳定报文形态不在本批验收面）
- **红绿证据**：实测：删槽 exit 1（首行 `TemplateImpure: …:WRITE_SCOPE`）；多槽 exit 1（首行 `file:///…/renderBoundary.mjs:47`，`Error: TemplateImpure: …:EXTRA` 在 stderr 第 5 行）。若实现只判「渲染无残留」，删槽会静默少一段 → 两次都会 exit 0
- **对应测试**：`test('S6B-TC-28 …')`
- **不覆盖**：删 `{{SEAT}}`（同一断言，不重复）

### S6B-TC-29 旧 12 槽位置 0–11 **不动**，新槽追加末位（共 3 个）

- **覆盖**：spec §3.4 末段「旧 12 槽的位置 0–11 不动，新槽追加在末位」
- **前置**：§0.1 的 12 名序列已冻结为测试常量
- **步骤**：① 断言 `SLOTS.slice(0, 12)` 与冻结 12 名**逐项、逐序**全等；② 断言 `SLOTS.slice(12)` 全等 `['ROLE_KIND','WRITE_SCOPE','HOST_RULE']`；③ 断言「新增名仅此三个」：`SLOTS.length - 12 === 3` 且 `SLOTS` 与冻结 12 名的差集恰 = `{ROLE_KIND, WRITE_SCOPE, HOST_RULE}`（顺序不参与，防「改旧槽名 + 加新槽」混过）
- **预期**：①②③ 全真
- **判据**：`PROBE` **exit 0**
- **红绿证据**：截至 `BASE` ① 现绿（12 名即现值）、② 现红（无这三名）；施工后两者皆绿
- **对应测试**：`test('S6B-TC-29 …')`
- **不覆盖**：槽在**卡面**的首次出现位置——依据是 `tools/docgen/components/renderBoundary.mjs` 的 `SLOTS` 注释「顺序 = spec §3.4 表行序（不是卡面首次出现顺序）」，**spec 未写该句**

### S6B-TC-30 真仓绿档基线：`GATE` exit 0 且 `baseline N/N`（N 派生不写死）

- **覆盖**：spec §4 **V-7** 的绿档前提 + §5「`writeScope` 数据错必须由 `validatePolicy` 发码」
- **前置**：施工后
- **步骤**：① `GATE`；② 取 stdout 末行；③ `assert.match(<末行>, /^baseline (\\d+)\\/\\1$/)`（**不写字面 38**）
- **预期**：① exit 0；③ 正则命中（截至 `BASE` 实测 38）
- **判据**：`GATE` **exit 0** + 正则命中
- **红绿证据**：截至 `BASE` 实测 `baseline 38/38`（`BASELINE_RULES + agentPaths()` 现算）→ **现绿**，施工后须仍绿
- **对应测试**：`test('S6B-TC-30 …')`（与既有 `test('S6-TC-G02 …')` 同形，**不另写第二份派生**）
- **不覆盖**：`npm run check` 全量（S6B-TC-37）

### S6B-TC-31 表驱动：`writeScope` 未登记 / `excludePathItems` 未登记 → 各 `UnknownPolicyRef`（首行不含 `TypeError` / `TemplateImpure`）

- **覆盖**：spec §4 **V-7** 负例一、二；§3.7 不变量 10；§3.3「渲染层全函数 + 校验排在 `slotValues` 循环之前」；§5 末句
- **前置**：`COPY`
- **步骤**：① 副本内 `seats.mjs` 的 `'senior-sdet'.writeScope` 改成 `'spec.unknown'` → `GATE`；② 同一副本改回，再把 `writeScopes['spec.testcase'].excludePathItems` 改成 `['code.nope']` → `GATE`；③ 两次取 exit 与 stderr 首行
- **预期**：两次都 exit 1；首行分别 `UnknownPolicyRef: senior-sdet:writeScope=spec.unknown` / `UnknownPolicyRef: writeScope=spec.testcase:excludePathItem=code.nope`（前者席级、后者 scope 级——D-16 裁定）；**两次首行均不含 `TypeError` / `TemplateImpure`**
- **判据**：表驱动两行各 `assert.equal(exit, 1)` + `assert.equal(首行, 期望)` + 两行各 `assert.equal(/TypeError|TemplateImpure/.test(首行), false)`
- **红绿证据**：实测：① 首行 `UnknownPolicyRef: senior-sdet:writeScope=spec.unknown`（`validatePolicy.mjs:248`）；② 首行 `UnknownPolicyRef: writeScope=spec.testcase:excludePathItem=code.nope`（`:233`）；两者均无 `TypeError` / `TemplateImpure`。判别力：若渲染层对未知 scope 抛错、或校验排在 `slotValues` 全量循环之后，首行会变成 `TemplateImpure` / `TypeError` → 第三条断言即红
- **对应测试**：`test('S6B-TC-31 …')`
- **不覆盖**：白名单外的**已登记**项（S6B-TC-36）

### S6B-TC-32 同一副本改回 → `GATE` exit 0（红不是恒真）

- **覆盖**：spec §4 **V-7** 的绿档复跑（防「一改就永久红」的假判据）
- **前置**：S6B-TC-31 的副本状态
- **步骤**：① 在同一副本内把 `writeScope` / `excludePathItems` 全改回原值；② `GATE`
- **预期**：exit 0、末行 `baseline 38/38`
- **判据**：`GATE` **exit 0**
- **红绿证据**：**未施行（施工后核）**；若改回仍红 → 校验器在读进程外缓存或真仓路径，必红
- **对应测试**：`test('S6B-TC-32 …')`
- **不覆盖**：跨进程缓存（不在本批）

### S6B-TC-33 副本排除模式项 `spec / plan` → `UnknownPolicyRef`

- **覆盖**：spec §3.7 不变量 12（「模式项没有 `id`，因此天然不可引用」）
- **前置**：`COPY`
- **步骤**：① 副本内 `excludePathItems = ['spec / plan']`；② `GATE`
- **预期**：exit 1；首行 `UnknownPolicyRef: senior-sdet:excludePathItem=spec / plan`
- **判据**：`assert.equal(exit, 1)` + 首行含 `excludePathItem=` 且含 `spec / plan`
- **红绿证据**：**未施行（施工后核）**；若允许排除，模式项会从禁写集合消失 = 权限放宽
- **对应测试**：`test('S6B-TC-33 …')`
- **不覆盖**：排除 `pathGroups` 项（合法，S6B-TC-16）

### S6B-TC-34 副本 `excludePathItems` 同一 `id` 出现两次 → `UnknownPolicyRef`

- **覆盖**：spec §3.7 不变量 10（「同一 `id` 只许出现一次」）
- **前置**：`COPY`
- **步骤**：① 副本内 `excludePathItems = ['code.test','code.test']`；② `GATE`
- **预期**：exit 1；首行含 `UnknownPolicyRef:` 且含 `excludePathItem=code.test`
- **判据**：`assert.equal(exit, 1)` + 两个 `includes`
- **红绿证据**：**未施行（施工后核）**
- **对应测试**：`test('S6B-TC-34 …')`
- **不覆盖**：跨组同 `id`（S6B-TC-42）

### S6B-TC-35 表驱动：显式 `undefined` / `null` / 空串的 `writeScope` → 各 `UnknownPolicyRef`（不静默回落）

- **覆盖**：spec §3.3「显式 `undefined` / `null` / 空串 → `UnknownPolicyRef`（不静默回落缺省）」+ §3.7 不变量 10 + §5 首行
- **前置**：`COPY`
- **步骤**：① 副本内把 `'senior-sdet'.writeScope` 依次设为 `undefined` / `null` / `''` 三个值（每值一次 `GATE`，同用例内循环）；② 每次取 exit 与 stderr 首行
- **预期**：三次都 exit 1；首行均以 `UnknownPolicyRef:` 开头并含 `senior-sdet:writeScope=`；三次均**不含** `TypeError` / `TemplateImpure`
- **判据**：表驱动三行各 `assert.equal(exit, 1)` + `assert.match(首行, /^UnknownPolicyRef: senior-sdet:writeScope=/)` + 三次 `assert.equal(/TypeError|TemplateImpure/.test(首行), false)`
- **红绿证据**：**未施行（施工后核）**；判别力：实现若用 `??` 回落缺省，三值都会**渲成「评审席」并 exit 0** → 本条即红（这是「静默回落」的可观测形态）
- **对应测试**：`test('S6B-TC-35 …')`
- **不覆盖**：未声明（缺省）的合法态（S6B-TC-43）

### S6B-TC-36 表驱动：白名单外的**已登记**项 → `ForbiddenGroupGranted: writeScope=<scope>:excludePathItem=<id>:not-allowed`

- **覆盖**：spec §4 **V-7** 负例三 + §3.7 **不变量 13**（按 scope 白名单，**⊆ 判**：`review.ledger` ⊆ `[]`、`spec.testcase` ⊆ `['code.test']`）+ §5 该码首行
- **前置**：`COPY`
- **步骤**：① 副本内给 `spec.testcase.excludePathItems` 另加已登记项 `'rules'`（→ `['code.test','rules']`）→ `GATE`；② 同一副本再给 `review.ledger.excludePathItems` 设 `['code.test']` → `GATE`；③ 两次取 exit 与首行
- **预期**：两次都 exit 1；首行分别 `ForbiddenGroupGranted: writeScope=spec.testcase:excludePathItem=rules:not-allowed` / `ForbiddenGroupGranted: writeScope=review.ledger:excludePathItem=code.test:not-allowed`（**scope 级报文**，首段不是席名）
- **判据**：表驱动两行各 `assert.equal(exit, 1)` + 首行按**前缀**匹配 `/^ForbiddenGroupGranted: writeScope=spec\\.testcase:excludePathItem=rules:not-allowed$/` 形态（避开「报哪一席」的歧义——同一 scope 可被多席共用）；并断言首行**不是** `UnknownPolicyRef:`（`rules` / `code.test` 都是已登记项）
- **红绿证据**：**未施行（施工后核）**；判别力：只做「存在性」校验时两项都合法 → exit 0，本条即红；若报文仍写席名（`senior-sdet:`）→ 前缀断言即红
- **对应测试**：`test('S6B-TC-36 …')`
- **不覆盖**：把 `spec.testcase` **清空**的形态（⊆ 口径下**不判红**，归 S6B-TC-17）；把排除项设成未登记 ID（归 S6B-TC-31）

### S6B-TC-37 `npm run check`：末行 `check 全部通过`，且 **stdout 全文**含 `# fail 0`

- **覆盖**：spec §4 **V-8** 第 1 句
- **前置**：施工后；本轮**未跑**（纪律）
- **步骤**：① `CHECK`；② 取**末行**，断言含 `check 全部通过`；③ 在 **stdout 全文**里断言含 `# fail 0`（**不得**要求 `# fail 0` 出现在末行——它来自测试汇总段，不在最后一行）
- **预期**：① exit 0；② 真；③ 真
- **判据**：`CHECK` **exit 0** + 两条 `includes`（② 只对末行、③ 对全文）
- **红绿证据**：**未施行（施工后核）**——本席按纪律不跑全量；数值以施工方当次复跑为准（不抄旧值）
- **对应测试**：一次性 e2e（写进当次账本）
- **不覆盖**：`# tests` 具体数字（S6B-TC-40）

### S6B-TC-38 `gate` + `scope-sweep` 两命令各绿

- **覆盖**：spec §4 **V-8** 第 2、3 句；R8（改判回扫）
- **前置**：施工后；`impact-sheet` 已登记
- **步骤**：① `GATE`；② `SWEEP`；③ 取两命令末行
- **预期**：① `baseline 38/38`；② `sweep ok`；两者 exit 0
- **判据**：两命令 **exit 0** + 两末行全等
- **红绿证据**：① 截至 `BASE` 实测绿（§0.1）；② **未施行**（本批改判尚未登记）——若 `sweep` 报「任一口径命中数 > baseline」→ R8 未同批回扫
- **对应测试**：一次性 e2e
- **不覆盖**：`scope-sweep` 的 baseline 内部（本批只认退出码，见 R8）

### S6B-TC-39 副本把 `roleKind` 置空 → `GATE` exit 1

- **覆盖**：spec §3.7 不变量 12（`roleKind` / `label` 非空）+ §5
- **前置**：`COPY`
- **步骤**：① 副本内 `writeScopes['spec.testcase'].roleKind = ''`；② `GATE`
- **预期**：exit 1；首行 `UnknownPolicyRef: writeScope=spec.testcase:empty`（**scope 级**——空值是 `writeScopes` 定义层的缺陷，不指向某一席；D-16 裁定），且**不含** `TemplateImpure`
- **判据**：`assert.equal(exit, 1)` + `assert.equal(首行, 期望)` + `assert.equal(/TemplateImpure/.test(首行), false)`
- **红绿证据**：实测：exit 1、首行 `UnknownPolicyRef: writeScope=spec.testcase:empty`（`validatePolicy.mjs:228`）；若空串渲进首句 → 卡面变「你是（测试开发）」= 事实缺陷
- **对应测试**：`test('S6B-TC-39 …')`
- **不覆盖**：`label` 置空（同一不变量，不重复）

### S6B-TC-40 `# tests` 不低于 `BASE` 基线（防删用例凑绿）

- **覆盖**：spec §4 **V-8** 的完整性含义（绿不得靠删断言）
- **前置**：`BASE` 当次 `npm run check` 的 `# tests` 已记入账本
- **步骤**：① 取施工前 `# tests` 值 `B`；② 施工后跑 `CHECK` 取 `# tests` 值 `A`；③ 断言 `A ≥ B`
- **预期**：真
- **判据**：`COUNT`（`A -lt B` → exit 1）
- **红绿证据**：**未施行（施工后核）**；本批会**新增** S6B 断言并**改判** 5 个既有测试文件（§4 建议 1），条数只应增不应减
- **对应测试**：一次性 e2e
- **不覆盖**：单条用例是否仍有效（S6B-TC-28 / 31 / 35 / 36 各管一段）

### S6B-TC-41 `pathGroups` 项对象形态：`id` 唯一、合谓词、**禁原型链保留名**、`text` 非空

- **覆盖**：spec §3.1（项对象 + `id` 规则 + 禁原型链保留名 + `text` 非空 + 组键与顺序）
- **前置**：施工后
- **步骤**：① 逐组逐项断言 `typeof id === 'string'` 且 `/^[a-z][a-z0-9.-]*$/` 命中；② 断言 `id` ∉ `{constructor, __proto__, prototype, toString, valueOf, hasOwnProperty}`；③ 断言 `text` 非空（`trim().length > 0`）；④ 断言全项 `id` 集合大小 = 项总数（唯一）；⑤ 断言组键与顺序仍为 `code / governance / docs.input / build / ledger / workspace`
- **预期**：①②③④⑤ 全真
- **判据**：`PROBE` **exit 0**
- **红绿证据**：截至 `BASE` `pathGroups` 是字符串数组（`code: ['代码、测试']`）→ ① 现红
- **对应测试**：`test('S6B-TC-41 …')`
- **不覆盖**：`text` 措辞（§3.1 明写「其余项只加 `id` 不改 `text`」，由 §0.1 现值兜）

### S6B-TC-42 表驱动：两组共用同一 `id` / 用原型链保留名 → `GATE` exit 1

- **覆盖**：spec §3.1「禁止两组共用同一 `id`」+「禁原型链保留名」
- **前置**：`COPY`
- **步骤**：① 副本内把 `governance` 的 `rules` 项 `id` 改成 `'code.test'`（跨组撞） → `GATE`；② 同一副本改回，再把 `workspace` 的 `other-reviews` 项 `id` 改成 `'constructor'` → `GATE`；③ 两次取 exit 与首行
- **预期**：两次都 exit 1；两次首行都以 `UnknownPolicyRef:` 开头（若施工另选 `LiteralInConfig` 或新码 → 见 §4 建议 6，同批改本用例期望）
- **判据**：表驱动两行各 `assert.equal(exit, 1)` + 码前缀匹配
- **红绿证据**：**未施行（施工后核）**；跨组共用 `id` 会让「排除 `code.test`」同时放开两组 → 权限事故；原型链名会让 `Set` / 直接下标判定失效
- **对应测试**：`test('S6B-TC-42 …')`
- **不覆盖**：`id` 形态不合（S6B-TC-41 正向已兜）

### S6B-TC-43 `writeScope` 缺省解析 = `review.ledger`（**未声明**席走缺省）

- **覆盖**：spec §3.3「`writeScope` 为**可选字段**；缺省 = `'review.ledger'`」
- **前置**：`seats.mjs` 只有 `senior-sdet` 显式声明
- **步骤**：① `PROBE` 断言 `Object.hasOwn(SEATS.SEATS['senior-sdet'], 'writeScope') === true`；② 断言 `reviewer-audit` / `detective-observer` / `__default__` **未声明**该字段；③ 断言三者的 `slotValues(...).WRITE_SCOPE === writeScopes['review.ledger'].label`
- **预期**：②③ 全真
- **判据**：`PROBE` **exit 0**
- **红绿证据**：截至 `BASE` `seats.mjs` 三席均无该字段 → ① 现红；施工后如上
- **对应测试**：`test('S6B-TC-43 …')`
- **不覆盖**：显式 `undefined` / `null` / `''` 的分支（**spec §3.3 已写**，归 S6B-TC-35）

### S6B-TC-44 【V-5④】旧句第三段落进 `seats.mjs` 的 `clause`，并渲进卡面

- **覆盖**：spec §3.3（`senior-sdet` 的 `clause` 承接旧专用句第三段）+ §4 **V-5④**（「旧句第三段『不代改、不参与议会裁决』在 `seats.mjs` 的 `clause` 中有逐字落点」）
- **前置**：`senior-sdet` 已接模板（S6B-TC-05 绿）
- **步骤**：① 从 `git show <BASE>:…/patternRegistry.mjs` 取旧 `SDET_BOUNDARY` 末段：`不改别人的判定：spec 或实现有问题，写进「给开发的建议」，不代改、不参与议会裁决`；② `PROBE` 取 `SEATS.SEATS['senior-sdet'].clause`，断言 `assert.equal(<clause>, <旧末段>)`（逐字，含末尾无句号）；③ 断言 `renderBoundary('senior-sdet')` 含 `不改别人的判定` 与 `不参与议会裁决`
- **预期**：② 逐字全等；③ 两词命中
- **判据**：`PROBE` **exit 0**
- **红绿证据**：截至 `BASE` `seats.mjs` 的 `senior-sdet` 无 `clause`，`renderBoundary('senior-sdet')` 全文**不含**这两词 → **现红**（spec 已裁定落 `clause`，本条的绿态就是该裁定）
- **对应测试**：`test('S6B-TC-44 …')`
- **不覆盖**：措辞可否更短（V-5④ 要求**逐字**落点，不判「同义」）

### S6B-TC-45 黄金追加 `senior-sdet@1`、旧键不删、当前比对键 = `@1` 且值 = 新渲染哈希

- **覆盖**：spec §6 **D6**；§3.8 表末行
- **前置**：施工后（黄金只在写盘那一次记录）
- **步骤**：① 读 fixture 键集；② 断言仍含 `senior-sdet-boundary`（旧键）；③ 断言含 `senior-sdet@1`；④ 断言 `goldenKeyFor('senior-sdet') === 'senior-sdet@1'`；⑤ 断言 `golden['senior-sdet@1'] === sha(renderBoundary('senior-sdet'))`
- **预期**：②③④⑤ 全真
- **判据**：`PROBE` **exit 0**
- **红绿证据**：截至 `BASE` fixture 只有 `senior-sdet-boundary`（= 旧单句 `1854ee34…`），无 `@1` → ③④ 现红；⑤ 现必不等（现渲染 `d0377bc5…`）
- **对应测试**：`test('S6B-TC-45 …')`
- **不覆盖**：两评审席是否该追加新轮次（本批字节不变，不需要；见 S6B-TC-04）

### S6B-TC-46 副本删旧键 / 用改造后自哈希 → 定位线索失效必红

- **覆盖**：spec §6 **D6**（「只追加、旧键留作历史」）；前作「黄金不得取自改造后」的口径
- **前置**：S6B-TC-45 断言已落
- **步骤**：① `COPY` 内把 fixture 改成只有 `senior-sdet`（值 = 当前渲染哈希）且删掉 `senior-sdet-boundary`；② `runEsm` 打印 `goldenKeyFor` 与键集；③ 父测试断言键集含旧键
- **预期**：③ 抛（旧键被删）
- **判据**：**父测试 exit 0**（`assert.throws` 捕获副本内「键集含旧键」断言抛）；**副本内断言 exit 1 只作旁证**——常驻测试自身不得写成「`PROBE` exit 1」
- **红绿证据**：**未施行（施工后核）**；判别力依据：若黄金取改造后自哈希，模板改一字仍「相等」→ 定位线索恒真（前作 C01 ⑥ 已算过同一形态）
- **对应测试**：`test('S6B-TC-46 …')`
- **不覆盖**：删 `reviewer-audit@2`（前作 C01 ⑦ 已管）

### S6B-TC-47 `policy --dump` 的 `paths.groups` 是 `text` 字符串数组投影（契约形状不变）

- **覆盖**：spec §3.1「`policy --dump` 是只读契约，形状不变：`dumpPolicy` 对 `paths.groups` 做**投影**（输出 `text` 字符串数组），不把项对象透传出去」+ §6 **D1'**
- **前置**：施工后
- **步骤**：① `DUMP` 取 `json.paths.groups`；② 断言每个组的值都是**字符串数组**（`Array.isArray` 且每项 `typeof === 'string'`）；③ 断言 `json.paths.groups.code` 全等 `['代码','测试']`（投影后两项）；④ 断言 `json.paths.patterns.specPlan` 仍是正则源串；⑤ 断言 `DUMP` 输出里**不出现**任何 `id` 键（`JSON.stringify(json.paths).includes('"id"') === false`）
- **预期**：②③④⑤ 全真
- **判据**：`DUMP` + `PROBE` **exit 0**
- **红绿证据**：截至 `BASE` `dump.paths.groups.code` = `['代码、测试']`（单元素）→ ③ 现红；②④⑤ 现绿（须保持）
- **对应测试**：`test('S6B-TC-47 …')`
- **不覆盖**：需要 `id` 的消费者读定义层（那是它们自己的 import 面，不判 dump）

### S6B-TC-48 纯度清单类改读 `item.text`：塞项文本得 `TemplateImpure`，而非 `TypeError`

- **覆盖**：spec §3.6「`assertTemplatePure` 的清单类成员改为读 `pathGroups` 项对象的 `text`」
- **前置**：`COPY`
- **步骤**：① 真仓 `GATE` 绿（证明改形态后纯度守卫仍可执行）；② `COPY` 内模板追一行反引号项 `` `docs/prd/` ``；③ `GATE` 取 exit 与 stderr 首行
- **预期**：① exit 0；③ exit 1 且首行 `TemplateImpure: tools/docgen/templates/boundary.md.tpl:docs/prd/`
- **判据**：`assert.equal(①, 0)` + `assert.equal(③, 1)` + 首行全等；**断言首行不含 `TypeError`**
- **红绿证据**：**未施行（施工后核）**；现实现 `listClassMembers()` 对字符串做 `.split('、')`，改形态后若漏改 → 导入期 `TypeError`（不是 `TemplateImpure`）→ ③ 的首行断言即红
- **对应测试**：`test('S6B-TC-48 …')`
- **不覆盖**：白名单登记的清单类成员（前作 C05 已判）

### S6B-TC-49 表驱动：`writeScope` / `excludePathItems` 用**原型链保留名** → 各 `UnknownPolicyRef`

- **覆盖**：spec §3.1「`id` **禁原型链保留名**（`constructor` / `__proto__` / `prototype` / `toString` / `valueOf` / `hasOwnProperty`）」+ §3.7 不变量 10 + §5
- **前置**：`COPY`
- **步骤**：① 副本内把 `seats.mjs` 的 `'senior-sdet'.writeScope` 设为 `'constructor'`（形态合 `^[a-z][a-z0-9.-]*$`，但是原型链保留名）→ `GATE`；② 同一副本改回，再把 `writeScopes['spec.testcase'].excludePathItems` 设为 `['constructor']` → `GATE`；③ 两次取 exit 与首行
- **预期**：两次都 exit 1；首行分别 `UnknownPolicyRef: senior-sdet:writeScope=constructor` / `UnknownPolicyRef: writeScope=spec.testcase:excludePathItem=constructor`（前者席级、后者 scope 级——D-16 裁定）；两次首行均**不含** `TypeError`
- **判据**：表驱动两行各 `assert.equal(exit, 1)` + `assert.equal(首行, 期望)` + `assert.equal(/TypeError/.test(首行), false)`
- **红绿证据**：实测：① 首行 `UnknownPolicyRef: senior-sdet:writeScope=constructor`；② 首行 `UnknownPolicyRef: writeScope=spec.testcase:excludePathItem=constructor`。判别力：只判「形态是否合 ID 谓词」时 `constructor` 会**通过**（它是合法小写标识符）→ exit 0，本条即红；若实现用 `in` / 直接下标，`'constructor' in writeScopes` 恒真 → 同样假绿
- **对应测试**：`test('S6B-TC-49 …')`
- **不覆盖**：跨组共用 `id`（S6B-TC-42）；路径项 `id` 的保留名（§3.1 同一规则，够用即止）

### S6B-TC-50 【不变量 14】非 `senior-sdet` 席显式声明 `writeScope: 'spec.testcase'` → `ForbiddenGroupGranted`

- **覆盖**：spec §3.7 **不变量 14**（「显式声明 `writeScope: 'spec.testcase'` 的席只许是 `senior-sdet`；其余席不得显式声明该 scope」）+ §5 该码首行
- **前置**：`COPY`
- **步骤**：① 副本内给 `seats.mjs` 的 `'reviewer-audit'` 加上 `writeScope: 'spec.testcase'` → `GATE`；② 取 exit 与首行
- **预期**：exit 1；首行 `ForbiddenGroupGranted: reviewer-audit:writeScope=spec.testcase:not-allowed`（**首段是席名**，与不变量 13 的 scope 级报文不同）
- **判据**：`assert.equal(exit, 1)` + 首行按前缀匹配 `/^ForbiddenGroupGranted: reviewer-audit:writeScope=spec\.testcase:not-allowed$/`；并断言首行**不是** `UnknownPolicyRef:`（`spec.testcase` 是已登记 scope）
- **红绿证据**：**未施行（施工后核）**；判别力：只判不变量 10（`spec.testcase` ∈ `Object.keys(writeScopes)`）时它会**通过** → exit 0，本条即红（那等于把「测试设计」的写作用域授予审计席 = 权限放宽）
- **对应测试**：`test('S6B-TC-50 …')`
- **不覆盖**：`senior-sdet` 自己声明该 scope（合法态，S6B-TC-43 判）

### S6B-TC-51 表驱动：某席 `display` 写进 `writeScopes` 的 `label` / `roleKind` → 各 `SeatNameInDefinition`

- **覆盖**：spec §3.3「显示名扫描面增加 `writeScopes.mjs`（只扫 `display`，不扫 slug）」+ §5 `SeatNameInDefinition`（触发面 = **`roleKind` / `label` 两字段**）
- **前置**：`COPY`
- **步骤**：① 副本内把 `writeScopes['spec.testcase'].label` 末尾追加 `（审计）`（`审计` = `reviewer-audit` 的 `display`）→ `GATE`；② 同一副本改回，再把 `spec.testcase.roleKind` 改成 `测试设计（审计）` → `GATE`；③ 两次取 exit 与首行
- **预期**：两次都 exit 1；两次首行均 `SeatNameInDefinition: tools/docgen/policy/definitions/writeScopes.mjs`（**同一码、同一路径**，说明扫描面覆盖两字段）
- **判据**：表驱动两行各 `assert.equal(exit, 1)` + `assert.equal(首行, 期望)`（报文是**仓内 POSIX 相对路径**，不带 `C:\` / `file://`）
- **红绿证据**：**未施行（施工后核）**；判别力：若扫描面没扩到 `writeScopes.mjs` → 两次都 exit 0；若只扫 `label` 不扫 `roleKind` → 第二次 exit 0（本条两输入各自独立判死）
- **对应测试**：`test('S6B-TC-51 …')`
- **不覆盖**：slug（席名键）出现（§3.3 明写扫 `display` 不扫 slug；本条两构造都用 `display` 词面）

### S6B-TC-52 副本在 `writeScopes` 多出**第三值**（`probe.scope`）→ `writeScope=probe.scope:not-allowed`

- **覆盖**：spec §3.7 **不变量 13**（「`writeScopes` 键集**恰为** `review.ledger` / `spec.testcase` 两值」）+ §5 `ForbiddenGroupGranted` 的第二个报文形态 `writeScope=<scope>:not-allowed`
- **前置**：`COPY`
- **步骤**：① 副本内在 `writeScopes.mjs` 追加第三项 `probe.scope: { roleKind: '探针', label: 'x', excludePathItems: [] }` → `GATE`；② 取 exit 与首行
- **预期**：exit 1；首行 `ForbiddenGroupGranted: writeScope=probe.scope:not-allowed`（**无 `excludePathItem=` 段**——违例是键集本身，不是某个排除项）
- **判据**：`assert.equal(exit, 1)` + 首行按**前缀**匹配 `/^ForbiddenGroupGranted: writeScope=probe\\.scope:not-allowed$/`；并断言首行**不含** `excludePathItem=`（区别于 S6B-TC-36 的报文形态）
- **红绿证据**：**未施行（施工后核）**；判别力：只判「每席声明的 scope 已登记」（不变量 10）时，`probe.scope` 本身是合法项且没人引用 → exit 0，本条即红（等于允许新增写作用域而不经审）
- **对应测试**：`test('S6B-TC-52 …')`
- **不覆盖**：把第三值同时挂到某席（那会先撞不变量 10 / 14，归 S6B-TC-50）；`review.ledger` 键被删（同属键集违例，报文会换 scope 名，不单列）

### S6B-TC-53【第 15 槽】`HOST_RULE` 数据化；非议会席「主持人」命中 0，议会席逐字不变

- **覆盖**：spec §3.2（`hostRule` 每 scope 一条：`review.ledger` 保留原句逐字、`spec.testcase` 用「只由主 agent 写」）+ §3.4 槽 15 `{{HOST_RULE}}` + §4 **V-6** + §6 **D3**（槽集 12 → 15）+ 回流起因 S4-TC-C03（非议会席卡面「主持人」0 命中）
- **前置**：`SLOTS` 已含 `HOST_RULE`；`BASE` 卡面可取
- **步骤**：① `PROBE` 取 `slotValues('senior-sdet').HOST_RULE`，断言 `includes('只由主 agent 写')` 且 `!/主持人/`；② 断言 `renderBoundary('senior-sdet')` 全文 `主持人` 出现次数 **= 0**（`COUNT` 口径：`match(/主持人/g)` 长度）；③ 断言 `renderBoundary('reviewer-audit')` 的该段（`不得写 \`progress.md\`…` 那一句）与 `git show <BASE>:agents/reviewer-audit.md` 的同句**逐字相等**；④ 绿档复跑 `GATE` exit 0（槽集 15 后基线仍绿）
- **预期**：① 两断言真；② 计数 0；③ 全等；④ exit 0
- **判据**：`PROBE` **exit 0** + `COUNT`（② = 0）+ `GATE` **exit 0**
- **红绿证据**：截至 `BASE` `SLOTS` 无 `HOST_RULE`（§0.1，12 名）→ ① 取值为 `undefined` → **现红**；且模板第 5 段原文含「主持人」→ `renderBoundary('senior-sdet')` 现态命中 ≥1。**红档判别力**：`COPY` 内把 `spec.testcase.hostRule` 改回含「主持人」的原句 → ① 的 `!/主持人/` 与 ② 的计数 0 各抛（等价于 S4-TC-C03 口径必红）；或把 ② 的期望改 `=== 1` 即复现现态
- **对应测试**：`test('S6B-TC-53 …')`
- **不覆盖**：`review.ledger` 是否**该**保留「主持人」（那是议会席语义，spec §3.2 已明写「逐字不变」，本条只判守恒不判措辞）；`progress.md` 的实际写入行为（无运行时授权，见前作 §10）

## 3 覆盖核对（spec §4 验收面 V-1～V-8 逐条 → 用例）

| 验收项 | 正例 | 负例 | 边界 | 覆盖状态 |
|---|---|---|---|---|
| **V-1** 渲染 == 批次起点卡边界节 + 三文件 diff 0 行 | 01 / 02 | 03 | 04 | 覆盖（黄金已明写「不作判据」，由 04 直接求值） |
| **V-2** `senior-sdet` 接入渲染 | 05 / 06 | 07 | 08 / 09 | 覆盖（grep 面 = `tools/ agents/ skills/`） |
| **V-3** 写作用域数据化 | 10 / 11 | 12 / 13 | 14 / 15 | 覆盖（扫描面 = 模板文件） |
| **V-4** 项级排除、不整组放开 | 16 / 17 | 18 | 19 | 覆盖（注在句尾 + 由 `text` 现算） |
| **V-5** 权限语义不减不宽（**五组**） | ① 20、② 22、③(b) 24、④ 44 | ① 21、② 23 | ③(a)/(b) 25、⑤ 19 | 覆盖：① 20/21、② 22/23、③(a) 16/17、③(b) 24/25、④ 44、⑤ 19（落点外仍禁） |
| **V-6** 槽集恰合 **15** | 26 / 27 / **53** | 28 | 29 | 覆盖（漏槽 / 多槽表驱动一条；`HOST_RULE` 数据化 + 非议会席 0 命中由 53 判） |
| **V-7** 引用完整性**三负例** | 30 / 32 | 31（一/二表驱动）、35（显式空值）、36（白名单外，**scope 级报文**） | 33 / 34 | 覆盖：三负例逐条判死；35 补 §3.3 的显式空值分支；36 的报文按 `writeScope=<scope>:…` 前缀判 |
| **V-8** 全仓门禁绿 | 37 / 38 | （39 归不变量 12） | 40 | 覆盖（`# fail 0` 走全文断言） |

**结构面补充（不在 V 表但 spec §3 明写）**：

| spec 条目 | 用例 |
|---|---|
| §3.1 项对象形态 / `id` 唯一 / **禁原型链名** | 41（正）/ 42（跨组撞 id 负表驱动）/ **49（保留名负表驱动）** / 25（三数口径） |
| §3.1 / D1' dump 投影（`text` 数组） | 47 |
| §3.3 缺省解析 / 显式空值 / 渲染全函数 + 校验排序 | 43 / 35 / 31（首行不含 `TypeError`·`TemplateImpure`） |
| §3.3 / V-5④ 旧句第三段落 `clause` | 44 |
| §3.2 `hostRule` / §3.4 槽 15 `HOST_RULE` / D3 | **53** |
| §3.3 **显示名扫描面含 `writeScopes.mjs`**（`roleKind` / `label` 两字段） | **51**（表驱动两输入） |
| §3.5 排除注句尾 + `text` 现算 + V-5⑤ | 19 / 16 / 17 |
| §3.6 纯度读 `item.text` | 48 |
| §3.6 恢复路径 `draft`→`replace` + 投影零改动 | 09 |
| §3.7 不变量 10 / 11 / 12 / 13 / **14** | 18·31·34·35·**49**（10）/ 28（11）/ 33·39（12）/ **17·36·52**（13：⊆ 判 + 键集恰两值）/ **50**（14） |
| §6 D6 黄金换代 | 45（正）/ 46（负）/ 04（口径） |
| §2.1 不放宽 | 20–25（V-5 全部） |

**未覆盖的 spec 条目**：0 条（§8「不测」四条已在各用例「不覆盖」栏显式排除）。

## 4 给开发的建议（7 条；每条「改哪里 / 怎么改 / 为什么这里会炸 / 落点」）

1. **既有测试回归面必须同批改判（spec §6 **D8**，按**测试块**定位，不写裸行号）**
   改哪里 / 怎么改：① **4 个文件的派生 helper 改读 `item.text`**——`policy-pure-source.test.mjs` 的 `pathItems` / `pathTokens` / `exported()` / `probeDict()`；`tool-tiers.test.mjs` 的 `FORBIDDEN_PATHS` / `pathTokens`；`sa-data-layer.test.mjs` 的 `pathTokens`；`sb-contract-layer.test.mjs` 的 `paths`；并让 `dumpPolicy` 做 `text` 投影。② `test('S6-TC-A04 …')`：`deepEqual(P.code, ['代码、测试'])` → 比**两项对象 `text`**（`[{ id: 'code.src', text: '代码' }, { id: 'code.test', text: '测试' }]`）；且 `pathTokens = pathItems + 1` → **`pathTokens = pathItems`**（新形态 20 = 20）。③ `test('S6-TC-H02 …')`：`dump items ↔ PTH.pathGroups` 的比对改比 **`text` 投影**（dump 侧本来就是 `text` 数组，定义层侧取 `item.text`，不再比项对象）。④ **槽集 12→15 的 4 块**：`test('S6-TC-C06 …')` / `test('S6-TC-C08 …')` / `test('S6-TC-F01 …')` / `test('S6-TC-F02 …')`（新增 `HOST_RULE` 后三处 `12` 与槽名清单都要跟）。⑤ `test('S6-TC-F02 …')`：`expanded[4] === ''` → `=== SEATS.SEATS['senior-sdet'].clause`。⑥ `test('S6-TC-G03 …')`：`includes('只写')` → `'只允许写'`；`goldenOf('senior-sdet-boundary')` → **`goldenCurOf('senior-sdet')`**（仓内符号名就是 `goldenCurOf`）。⑦ `test('S6-TC-E02 …')`：① 改为「`gate` 报 `Mismatch` + **副本内按渲染重写后 exit 0**」；② 文案改「**11 席默认句 + `evidence-reader` 自有句**」。⑧ `SB-TC-05` / `SB-TC-25` / `SB-TC-40`：**指针席 2→3**（`POINTER_SEATS`），但「**有组席**」子断言按 `allowGroups.length > 0` 过滤**仍为 2 席**，`senior-sdet` **单列空组分支**。⑨ `SB-TC-13`：`TEMPLATE_ALLOWED_LITERALS.size === 12` → **派生式** `size === 结构化文本常数 + POINTER_SYMBOLS.length − 2`。⑩ `sdet-render.test.mjs`：「边界段 = 该席专用句」块标题改「**走渲染**」+ `includes('只写')` → `'只允许写'`。
   为什么炸：任一漏改则 V-8 必红，且红点指不到真因（首轮议会 P0）。
   落点：S6B-TC-47（①/③ 的投影面）/ 25（② 的 20 = 20）/ 26·27·29（④）/ 44（⑤）/ 05·45（⑥）/ --（⑦ 属施工期既有断言改判）/ 14（⑨）/ 05（⑩）。**⑦⑧ 无本批用例**（既有断言改判，由 `npm run check` 兜）。
2. **`tools/docgen/test/sb-contract-layer.test.mjs` 的注释含 `SDET_BOUNDARY`**
   改哪里：该文件里提到旧常量名的那行注释。怎么改：改成「走 `renderBoundary` / `DEFAULT_BOUNDARY`」。为什么炸：V-2 要求代码面 grep 0 命中，注释留着即恒红。落点：S6B-TC-06 / 08。
3. **`assertTemplatePure` 的 `listClassMembers()` 必须改读 `item.text`**
   改哪里：`renderBoundary.mjs`。怎么改：`Object.values(PTH.pathGroups).flat().flatMap(x => x.text.split('、'))`。为什么炸：现写法 `x.split('、')` 对项对象直接 `TypeError`，`validatePolicy()` 导入期即崩，`gate` 发不出 `TemplateImpure`。落点：S6B-TC-48。
4. **`writeScope` 校验必须排在 `slotValues` 全量循环之前，且渲染层对未知 scope 全函数**
   改哪里：`validatePolicy.mjs`（顺序）与 `renderBoundary.mjs`（`ROLE_KIND` / `WRITE_SCOPE` 未知时渲空串、不抛）。怎么改：先做 writeScope 成员 / 非空 / 显式空值校验 → 再跑 `slotValues` 全量。为什么炸：顺序反了，导入期先抛 `TemplateImpure`，`UnknownPolicyRef` 永远发不出来（V-7 / §5 末句直接失效）。落点：S6B-TC-31（首行不含 `TypeError` / `TemplateImpure`）、S6B-TC-35。
5. **禁止 `in` / 直接下标做成员判定；`id` 禁原型链保留名**
   改哪里：`writeScopes` / `pathGroups` 的所有成员判定点。怎么改：`new Set(...)` 或 `Object.hasOwn`；`id` 校验加保留名黑名单（`constructor` / `__proto__` / `prototype` / `toString` / `valueOf` / `hasOwnProperty`）。为什么炸：`'constructor' in obj` 恒真 → 「未登记项」被误判为已登记，V-7 负例全部假绿；`constructor` 又合 `^[a-z][a-z0-9.-]*$`，只判形态拦不住。落点：S6B-TC-41 / 42 / **49**。
6. **跨组共用 `id` 的违反码取严并同批回填 spec**
   改哪里：spec §3.1（「禁止两组共用同一 `id`」仍无独立码）。怎么改：归 `UnknownPolicyRef`（引用类）并写进不变量 10 的报文词表。为什么炸：不写死则实现可自由选，S6B-TC-42 的期望码会与实现分叉（该用例已标「若另选码须同批改期望」）。落点：S6B-TC-42。
7. **黄金新键必须带轮次且旧键保留**
   改哪里：`tools/docgen/fixtures/boundary-golden.json`。怎么改：追加 `"senior-sdet@1"`，**不删** `senior-sdet-boundary`。为什么炸：`goldenKeyFor()` 只认 `^<席>@\d+$`，键写成 `senior-sdet-new` 会回落旧键 → 定位线索失效。落点：S6B-TC-45 / 46。

## 5 异议与裁定

### 5.1 裁定表（**未决 = 0**；D-1～D-5 = 首轮异议；D-6～D-10 = 议会 #2 首轮修复；D-11～D-14 = 复核轮一致性项；**D-15 = 施工期回流**）

| # | 首轮抓到什么 | 裁定（spec 落点） | 本文件落点 |
|---|---|---|---|
| **D-1** | V-1 的 golden 子句在施工前即不成立（渲染与两个黄金键都不等） | **已裁定**：spec §4 V-1 改为「`sha(render)` == `sha(批次起点卡面「## 边界」节)`」＋明写「黄金不作判据」 | S6B-TC-01（新判据）/ 04（直接求值两条「不等」） |
| **D-2** | 旧 `SDET_BOUNDARY` 第三段职责句无处安放 | **已裁定**：spec §3.3 落 `seats.mjs` 的 `clause` + §4 **V-5④** 可机械判 | S6B-TC-44 |
| **D-3** | V-2 的 `git grep` 面未界定（`docs/` 历史必红） | **已裁定**：spec §4 V-2「扫描面 = `tools/ agents/ skills/`；`docs/` 历史件不在面内」 | S6B-TC-06 / 08 |
| **D-4** | V-3 扫描面未写（扫卡面必假红） | **已裁定**：spec §4 V-3「扫描面 = 模板文件」 | S6B-TC-10 / 15 |
| **D-5** | V-5③「移除项恰 `code.test`」计数层未钉死 | **已裁定**：spec §4 V-5③ 拆 **(a) 项级移除** / **(b) 元素文本 diff**，两条各自判死 | (a) 16 / 17；(b) 24 / 25 |
| **D-6** | `policy --dump` 会把项对象透传出去，破只读契约 | **已裁定**：spec §3.1「`dumpPolicy` 对 `paths.groups` 做**投影**（`text` 字符串数组）」+ §6 **D1'** | S6B-TC-47（`code` 投影为 `['代码','测试']`、dump 里无 `id` 键） |
| **D-7** | 未知 `writeScope` 在导入期抛错 / 校验顺序反了 → 五码发不出来 | **已裁定**：spec §3.3「渲染层对未知 scope 全函数（渲空串）」+「校验排在 `slotValues` 全量循环**之前**」+ §5 末句 | S6B-TC-31（首行不得含 `TypeError` / `TemplateImpure`）、35、39 |
| **D-8** | 排除注插进基准句内部会破既有「基准句子串」断言 | **已裁定**：spec §3.5「在基准句**整句之后**追加」 | S6B-TC-19（`startsWith` 基准句 + 整值全等） |
| **D-9** | `generate --readme --apply` 不能重出 `agents/*.md` | **已裁定**：spec §3.6「恢复路径 = `draft` → 对照 → `replace`；`docs/agents` 零改动」 | S6B-TC-09（`replace` 落盘 + 投影与 `BASE` 零差异） |
| **D-10** | 「排除任意已登记项」会放宽权限 | **首轮已裁定**：spec §3.7 **不变量 13** 引入按 scope 白名单；**报文形态与「⊆ 而非全等」的判定口径由复核轮改判，以 D-12 为准**（本行不再复述报文，避免与 D-12 两份说法） | S6B-TC-36（表驱动） |
| **D-11** | 「既有测试回归面」写成了文件↔断言的模糊映射，施工方按文件找会漏块 | **已裁定**：spec §6 **D8** 改为**按测试块定位**（不写裸行号）——4 文件派生 helper 改 `item.text`、`S6-TC-A04` 的 `P.code` 比两项 `text` 且 `pathTokens = pathItems`、`S6-TC-H02` 改比 `text` 投影、槽集 4 块（C06/C08/F01/F02）、F02 的 `expanded[4]` 比 `clause`、G03 的 `'只允许写'` + **`goldenCurOf`**、`S6-TC-E02` 的 Mismatch 重写 / 11 席文案、`SB-TC-05/25/40` 指针席 2→3 但「有组席」仍 2 席 + `senior-sdet` 空组分支、`SB-TC-13` 的派生式、`sdet-render` 的「走渲染」 | §4 建议 1（逐条 ①–⑩，删掉了写错文件归属的旧行） |
| **D-12** | 不变量 13 的「恰为」口径会把**清空**判红，与 §3.5「无排除项零字节」互斥；报文用席名在共用 scope 下指向歧义 | **已裁定**：spec §3.7 改 **⊆ 白名单**（清空 / 未用项不判红）+ 报文改 **scope 级** `writeScope=<scope>:excludePathItem=<id>:not-allowed` + §5 表同步 | S6B-TC-17（清空 → `GATE` exit 0 + 基准句逐字）/ 36（白名单外 → scope 级前缀断言） |
| **D-13** | 不变量 10 只判「scope 已登记」，非 `senior-sdet` 席也能声明 `spec.testcase` = 权限放宽 | **已裁定**：spec §3.7 新增**不变量 14**（scope 引用绑定：只有 `senior-sdet` 可显式声明 `spec.testcase`）→ `ForbiddenGroupGranted: <席>:writeScope=spec.testcase:not-allowed` | S6B-TC-50 |
| **D-14** | 显示名扫描面只覆盖 5 个旧定义文件，`writeScopes.mjs` 的 `roleKind` / `label` 可点名别的席而不被拦 | **已裁定**：spec §3.3「显示名扫描面增加 `writeScopes.mjs`（只扫 `display`，不扫 slug）」+ §5 触发面 = **两字段** | S6B-TC-51（表驱动：`label` 追加「审计」/ `roleKind` 改「测试设计（审计）」→ 同一码 `SeatNameInDefinition: tools/docgen/policy/definitions/writeScopes.mjs`） |
| **D-15** | 施工发现 spec 未定义冲突：S4-TC-C03 要求非议会席卡面「主持人」0 命中，而模板第 5 段原含该词 | **已裁定**：新增**第 15 槽 `HOST_RULE`**——`writeScopes` 每 scope 一条 `hostRule`（`review.ledger` 逐字保留原句，`spec.testcase` 用「只由主 agent 写」）；落 spec **§3.2 / §3.4 槽 15 / §3.7 不变量 11 / §4 V-6 / §6 D3** | S6B-TC-53（绿档：`HOST_RULE` 含「只由主 agent 写」且不含「主持人」、`renderBoundary('senior-sdet')` 的「主持人」计数 0、议会席该句与 `BASE` 逐字相等；红档：副本改回含「主持人」→ 断言必红） |
| **D-16** | ④ 段报 P1：`UnknownPolicyRef` 的 `excludePathItem` / 空值报文用 scope 级、缺席名，与 §5 的 `<席>:` 形态不符 → TC-18 / 31 / 39 / 49 判死 | **已裁定（用户 2026-11-05）**：报文口径定为——席级 `UnknownPolicyRef: <席>:writeScope=<id>`；scope 级 `UnknownPolicyRef: writeScope=<scope>:excludePathItem=<id>`；空值族 `UnknownPolicyRef: writeScope=<scope>:empty`（`roleKind` / `label` / `hostRule` 空）。spec **§5** 已按此改（白名单外 / 键集仍 scope 级 `ForbiddenGroupGranted`）。**附注**：`:empty` 是该 scope 级族的第三形态，§5 报文列暂只列两形态（触发 = 下次改 §5 时补列） | S6B-TC-18（两输入期望改 scope 级）/ 31（第二输入改 scope 级）/ 39（改 `writeScope=spec.testcase:empty`）/ 49（第二输入改 scope 级） |
| **D-17** | ④ 段报 P1：模板**多槽**在导入期抛，CLI 首行是堆栈定位行而非 `TemplateImpure`，TC-28 的首行全等判据不可达 | **已裁定（用户 2026-11-05）**：按 spec **§8.4**「不测模板 / 配置读取失败的稳定错误面」→ TC-28 只判 `exit 1`，**不比对首行字面**（删槽 / 多槽两输入同一判据） | S6B-TC-28（判据由「exit 1 + 首行全等」改为「exit 1」） |

**findings 集合为空：全过、无问题**（上表 17 条均有 spec 落点与本文件落点，无待定项）。

## 6 本席自检（角色卡「一定会」5 条 + 本席清单 9 条；判定取值只许 `hit` / `miss` / `na` + `reason` + `evidence`）

| # | 条目 | 判定 | 证据（path:line 或命令输出首行） |
|---|---|---|---|
| 一定会-1 | 交付物结束（立场不偏、按项目长期判断）：结论段依据条 ≥ 2、来自 ≥ 2 文件 | `hit` | 依据① spec §3 / §4 / §5（`2026-11-04-s6-b-boundary-convergence-design.md` 设计表与 V 表）；依据② `tools/docgen/test/policy-pure-source.test.mjs` 现值（`12` / `19` / `20` / SHA 事实）；依据③ `agents/reviewer-audit.md` 边界段实测文本 → ≥ 3 条、3 个文件；结论已写回 §4 / §5.1 |
| 一定会-2 | 证据可复算：引用的行存在且含被引摘句 | `hit` | `node tools/docgen/cli.mjs gate` → `baseline 38/38`；`policy --dump` → `expanded 12`；`git grep -l SDET_BOUNDARY -- tools agents skills` → 2 文件；`git show <BASE>:agents/reviewer-audit.md` 边界节 sha → `aaa1ed1b…`（与现渲染相等） |
| 一定会-3 | 非专业读者能听懂：英文术语首现行含中文解释 | `hit` | 对 `renderBoundary`（渲染函数）、槽（slot）、黄金（golden，基准哈希）、纯度守卫（purity guard）、副本（repo copy）、投影（projection，只输出 `text` 数组）均在首现行给中文解释；未解释术语计数 = 0 |
| 一定会-4 | 无问题时显式写「全过、无问题」 | `hit` | §5.1 末句已写「findings 集合为空：全过、无问题」——15 条均有 spec 落点与本文件落点，无待定项 |
| 一定会-5 | 附录无问题时显式写「全过、无问题」 | `na` | reason：本文件不设附录（无附录即无可判对象） |
| 本席-1 | 输入空间核对 | `hit` | §0.1 列全 roster（`SLOTS` 12 / `pathGroups` 6 组 18 元素 / `pathItems` 19 / `pathTokens` 20 / `expanded` 12 / golden 7 键 / grep 2+7 文件 / 投影文件无边界段） |
| 本席-2 | 状态与转移核对 | `hit` | 三处状态写在 §0.1：施工前（12 / 18 / 19 / 20）→ 施工后（**15** / 19 / 20 / 20）；`senior-sdet` 边界「旧单句 → 五段渲染」由 S6B-TC-05 第 ⑤ 步判 |
| 本席-3 | 失败面核对 | `hit` | §5 错误码 5 个各有负例：`UnknownPolicyRef`（18/31/33/34/35/39/42/**49**）、`ForbiddenGroupGranted`（36/50/**52**）、`SeatNameInDefinition`（**51**，两字段表驱动）、`TemplateImpure`（14/28/48）；`LiteralInConfig` 本批无新增（§2.3）→ S6B-TC-30 绿档兜 |
| 本席-4 | 判据来源核对 | `hit` | 每条「覆盖」栏指回 spec 节号 / V 编号；§3 逐条对表，未覆盖 = 0 |
| 本席-5 | 确定性核对 | `hit` | 所有判据 = 命令退出码 / 全等断言 / 计数 / `startsWith` / 报文前缀匹配，无「看语气」；§0.2 五条口径钉死；SHA / 计数均为截至 `BASE` 实测值 |
| 本席-6 | 回归资产核对 | `hit` | §4 建议 1 按 spec §6 **D8 的测试块**逐条点名（4 文件派生 helper、`S6-TC-A04` 的 `P.code`/`pathTokens`、`S6-TC-H02` 的 `text` 投影、槽集 4 块 C06/C08/F01/F02、`F02` 的 `expanded[4]`、`G03` 的 `只允许写`+**`goldenCurOf`**、`S6-TC-E02` 的 Mismatch/11 席、`SB-TC-05/25/40` 的 2→3 + 有组席 2 + 空组分支、`SB-TC-13`、`sdet-render`）+ 建议 2（注释）+ 建议 7（黄金键）；**不写裸行号**、**无写错文件归属的行** |
| 本席-7 | 判别力核对 | `hit` | 每条负例都写「不改会怎样」：03（不改渲染即红）、12（裸词绕纯度 → 靠计数）、21（`includes` 会假绿）、19（注硬写「测试」则改 `text` 不跟随）、35（`??` 回落则 exit 0）、36（只做存在性校验则 exit 0）、**49**（只判 ID 形态则 `constructor` 通过）、**50**（只判不变量 10 则越权声明通过）、**51**（只扫 `label` 则 `roleKind` 输入 exit 0）、**52**（只判「已登记」则键集多值 exit 0）、48（漏改 `.text` 会 `TypeError`）；53 的红档 = 改回含「主持人」→ 计数 1 复现现态 |
| 本席-8 | 盲点雷达核对 | `hit` | D-6 dump 投影 / D-7 渲染与校验顺序 / D-8 注的位置 / D-9 恢复命令 / D-10·D-12 白名单口径 / D-11 回归面映射 / D-13 scope 绑定 / D-14 显示名扫描面（两字段）/ **D-15 第 15 槽 `HOST_RULE`** / **D-16 报文口径** / **D-17 §8.4 豁免**——每条都已转成可观测断言（47 / 31·35 / 19 / 09 / 17·36·**52** / 25·26·27·44·45 / 50 / **51** / **53** / 18·31·39·49 / 28） |
| 本席-9 | 覆盖账核对 | `hit` | §1.1 现算：正 22 / 负 18 / 边 13 = **53**；负+边 31 ≥ 正 22；V-1～V-8 全覆盖（V-6 含槽 15），V-5 五组、V-7 三负例均有正反两侧；不变量 13/14 各自有用例（17·36·52 / 50） |

**禁止 4 条自检**：① 每条问题都给了解法（§4 七条 + §5.1 每行的「本文件落点」）；② **未越界处置**——本轮写入产物 = 本文件（testcase 修订）+ ④ 段结论表 `docs/reports/2026-11-05-s6-b-quality-evidence/quality-4.md`，未改 spec / 代码 / plan / 规则；③ 证据栏无空行（上表 17 行逐行有证据）；④ 未代任何他席填写签名栏（本文件无签名栏）。
