# S6-B ④ 段质量保证：53 条用例逐条结论（终态）

> 段标记：**④@S6-B（复核轮 3，终态，2026-11-05）**｜对象：`docs/superpowers/specs/2026-11-04-s6-b-boundary-convergence-design-testcase.md`（修订轮次 6，53 条）｜spec：`docs/superpowers/specs/2026-11-04-s6-b-boundary-convergence-design.md`（§5 已按 D-16 改）｜plan：`docs/superpowers/plans/2026-11-05-s6-b-boundary-convergence.md`
> `BASE` = `2eb0b5bf62ec50ec1458fa023a67923b670db1b9`（开工前 `git rev-parse HEAD`；施工产物全在工作区，未提交）

## 0 判者标识与独立性声明

| 项 | 内容 |
|---|---|
| 判者标识 | `senior-sdet@agents/senior-sdet.md`（path B 角色卡贴入，**全新上下文**的独立实例，2026-11-05） |
| 独立性 | **未参与** spec 写作（spec 作者 = 主 agent）、**未参与** ③ 施工、**未参与** ② 段议会；判据来源 = spec / testcase / 源码 / fixture / 既有测试自跑。③ 审计报告只作背景事实（如 `BASE` 的 `# tests 1541`），**不作为任何一条判据的结论来源** |
| 本轮写入边界 | 写入产物 = testcase（修订轮次 6：D-16 / D-17 口径 + TC-06·08·18·31·39·49 期望 + TC-07·17·28 构造）+ 本文件。**未改**仓内任何源码 / spec / plan / 规则；**未执行**任何 git 写操作 |
| 注入边界 | 所有负例注入只在 `withRepoCopy(fn)` 生成的 `%TEMP%/dw-copy-*` 全仓副本内做；副本由 `finally` 自动 `rmSync`；自写取数脚本放 `%TEMP%/s6b-q4/`，收尾删除 |
| 判据形态 | 只认：命令退出码、`node:assert/strict` 全等 / 正则、`sha256`、计数。**未用** `node -e` 当判据；**未把** `Select-String` / `git grep` / `git diff` 的进程退出码当判据（取 stdout 集合或行数） |
| 取数环境 | cwd = 仓根 `d:\Seed\retro-skills`；Shell = PowerShell 5；node ≥ 22 |
| 仓库现状 | 本文件落盘前 `git status --porcelain` = 21 `M` + 7 `??`（③ / ② 产物 + 3 份审计与我方报告目录） |

**判据约定代号**（与 testcase §0 一致）：`GATE` = `node tools/docgen/cli.mjs gate`；`DUMP` = `node tools/docgen/cli.mjs policy --dump`；`CHECK` = `npm run check`；`SWEEP` = `node scripts/scope-sweep.mjs --check`；`PROBE` = 带 `node:assert/strict` 的取数脚本（本轮落在 `%TEMP%` 的等价形态，理由见 G-1）；`COPY` = `withRepoCopy(fn)` + `runCli/runEsm`；`COUNT` = 计数比较。

## 1 逐条结论表（53 行，一条不缺）

> 列「结果」= 通过 / 不通过 / 不适用。**不适用 = 0**（每条都可执行；个别子断言无判对象，已在备注与 §4 记为缺口，不冒充通过）。

| ID | 类型 | 结果 | 判据（testcase 期望） | 实测证据（命令首行 / path:line） |
|---|---|---|---|---|
| S6B-TC-01 | 正 | 通过 | 两席 `sha(render)` == `sha(BASE 卡面「## 边界」节)`；三文件 diff 0 行 | render = `aaa1ed1bab96…b4f96` / `a9bdacbaea83…e052`，与 BASE 卡面边界节同值；`git diff BASE -- agents/reviewer-audit.md agents/detective-observer.md docs/agents/senior-sdet.md` = **0 行** |
| S6B-TC-02 | 正 | 通过 | `GATE` exit 0 + 卡面逐字节 == 渲染 + 首句前缀 | `baseline 38/38`（exit 0）；`cardBoundary == render` = true（两席）；首句 `你是评审席（审计）。` / `你是评审席（侦探）。` |
| S6B-TC-03 | 负 | 通过 | 副本改 `review.ledger.label` 一字 → 两席 sha 必变 | 副本两席 sha = `83ffe1ad…` / `e1be8592…`，均 ≠ `aaa1ed1b…` / `a9bdacba…` |
| S6B-TC-04 | 边 | 通过 | 两黄金键都 != 现渲染；比对键 = `reviewer-audit@2` | `render==golden['reviewer-audit']` = **false**；`render==golden['reviewer-audit@2']` = **false**；键集含 `reviewer-audit@2` |
| S6B-TC-05 | 正 | 通过 | `agentData` 该席 `boundary === renderBoundary('senior-sdet')`，首句 `你是测试设计（测试开发）。` | sha = `54924fbbd162…bc97`；`eq` = true；`boundaryBySeat` 同值；首句实测命中 |
| S6B-TC-06 | 正 | 通过 | `Object.hasOwn(patternRegistry,'SDET_BOUNDARY')` = false；代码面 `git grep -l` **0 文件** | ① false ✓；② `boundaryBySeat` 同值 ✓；③ `git grep -l SDET_BOUNDARY -- tools agents skills` **stdout 空**（无文件；退出码 1 不作判据）。注释字面已按 D-16 删除（`patternRegistry.mjs:30` 现为「该席专用边界常量已删」） |
| S6B-TC-07 | 负 | 通过 | 副本回填 `SDET_BOUNDARY` → 导出面断言必红（父测试 exit 0） | 修正后构造：`Object.hasOwn(PR,'SDET_BOUNDARY')` = **true**、`boundaryBySeat` 同值 = true → 副本断言必抛；`Object.hasOwn(patternRegistry,'SDET_BOUNDARY')` = **false**（原写法查错对象，本轮已改） |
| S6B-TC-08 | 边 | 通过 | ② 面（`tools agents skills`）行数 = 0；① `docs/` 只记录不进断言 | ② = **0**（同 TC-06）；① `git grep -l SDET_BOUNDARY -- docs` = **7 文件**（本 testcase 未入库 → `git grep` 看不见） |
| S6B-TC-09 | 边 | 通过 | `GATE` 0 + 卡面 == 渲染 + `docs/agents` 与 BASE 0 行 + 「以 `generate --readme --apply` 作卡面恢复」计数 0 | `baseline 38/38`；`sdetCardEqRender` = true（1090 = 1090 字符）；`git diff BASE -- docs/agents` = **0 行**；账本用 `draft` → `replace`（plan `:31` / `:143`），该命令作卡面恢复 = **0** |
| S6B-TC-10 | 正 | 通过 | `boundary.md.tpl` 内 `评审席` = 0、`本次评审账本` = 0 | 模板计数实测 **0 / 0**（`tools/docgen/templates/boundary.md.tpl:1` 已是 `{{ROLE_KIND}}`） |
| S6B-TC-11 | 正 | 通过 | 四席 `ROLE_KIND` / `WRITE_SCOPE` == `writeScopes[scope]` 两字段 | RA / DO / `__default__` = `评审席` + `review.ledger.label`；`senior-sdet` = `测试设计` + `spec.testcase.label`（`writeScopes.mjs:5-16`） |
| S6B-TC-12 | 负 | 通过 | 副本写回 `你是评审席（{{SEAT}}）` → 计数 1（阻断） | 副本模板 `评审席` 计数 = **1** → TC-10 的 `=0` 断言必抛 |
| S6B-TC-13 | 负 | 通过 | 改 `spec.testcase.label` → 只有 `senior-sdet` 跟随 | 副本：`sd=true`、`ra=false`、`d=false`；两评审席 sha 仍 `aaa1ed1b…` / `a9bdacba…` |
| S6B-TC-14 | 边 | 通过 | 白名单两条不在；写回即 `TemplateImpure`；真仓绿 | 两问 = `[false,false]`；副本 exit 1 首行 `TemplateImpure: tools/docgen/templates/boundary.md.tpl:.session/reviews/<本次>/`；真仓 `baseline 38/38` |
| S6B-TC-15 | 边 | 通过 | 卡面两词各 ≥1；判据读取目标 = 模板文件 | 卡面 `评审席`=1 / `本次评审账本`=1；模板 0/0。③ 静态子项无测试块可断言 → 以 `renderBoundary.mjs:16` 的 `TPL_REL` 作替代证据（缺口归 G-1） |
| S6B-TC-16 | 正 | 通过 | `expanded[9]` 含「排除「测试」」、不含「排除「代码」」；`excludePathItems = ['code.test']` | 实测串 = 基准句 + `（本席按写作用域排除「测试」）`；`code` 组仍含 `code.src`；`excludePathItems` 全等 `['code.test']` |
| S6B-TC-17 | 正 | 通过 | 两席该槽 = 基准句逐字且无「排除」；清空本席排除项 → `DUMP` exit 0；该槽仍逐字基准句 | ②③ ✓（两评审席 + `__default__` 均基准句、无「排除」）；④ `DUMP`（`policy --dump`）exit **0**（同副本 `GATE` exit 1，属卡面失配，与本条无关——故判据已按 D-16 轮改为 `DUMP`）；⑤ 该槽 = 基准句（零字节追加） |
| S6B-TC-18 | 负 | 通过 | 组 ID `code` / 字面 `测试` → 各 exit 1，首行全等 scope 级报文 | `UnknownPolicyRef: writeScope=spec.testcase:excludePathItem=code` / `…=测试`（两次全等，`validatePolicy.mjs:233`） |
| S6B-TC-19 | 边 | 通过 | 注在基准句整句之后；文本由被排除项 `text` 现算；模板句仍在 | 整值 `=== 基准句 + （本席按写作用域排除「测试」）`；副本改 `code.test.text` 为 `测试项` → 含「测试项」不含「测试」，基准句完整；模板句命中 |
| S6B-TC-20 | 正 | 通过 | 旧 `只写…；` 段 == `spec.testcase.label` | 两侧均为「本次 spec 同目录的 `-testcase.md` 与同目录由你负责的测试设计文档」（逐字全等） |
| S6B-TC-21 | 负 | 通过 | 多授权 / 减授权各与旧段不等 | 多授权 = `…测试设计文档、代码`；减授权 = `本次 spec 同目录的 与同目录…`；两者均 ≠ 旧段 |
| S6B-TC-22 | 正 | 通过 | 旧点名 5 项逐项有覆盖，未覆盖集 = `[]` | `uncovered = []`；token 数 20（`业务代码`⊃`代码`、`spec / plan 正文`⊃`spec / plan`、`rules/`、`skills/`、`agents/`） |
| S6B-TC-23 | 负 | 通过 | 副本删 `rules` 项 → 未覆盖集 = `['rules/']` | `["rules/"]` |
| S6B-TC-24 | 正 | 通过 | 元素文本 diff：`old−new = ['代码、测试']`、`new−old = ['代码','测试']`，其余 17 项不变；token 20 → 20 | 旧数组 18 元素；`old−new = ["代码、测试"]`、`new−old = ["代码","测试"]`、`changedOthers = []`；token 各 20 |
| S6B-TC-25 | 边 | 通过 | 19 / 20 / 20 | 19 / 20 / 20（`policy-pure-source.test.mjs:98` / `:100`）。④ 静态子项无判对象 → 归 G-1 |
| S6B-TC-26 | 正 | 通过 | `SLOTS` 恰 15 有序；模板槽集 = `SLOTS`；每槽 ≥1 | `SLOTS` = 15，末三 `ROLE_KIND` / `WRITE_SCOPE` / `HOST_RULE`；模板去重槽 = 15 且各被引用 |
| S6B-TC-27 | 正 | 通过 | 四席 `expanded.length` = 15；[12]/[13]/[14] 对位；无 `undefined`/`null`/`{{` 残留 | 四席均 **15**；`[12]`=`测试设计`、`[13]`=`spec.testcase.label`、`[14]`=`hostRule`；残留 **0** |
| S6B-TC-28 | 负 | 通过 | 漏 `{{WRITE_SCOPE}}` / 多 `{{EXTRA}}` → 各 **exit 1**（D-17：首行不作要求） | 漏槽 exit 1（首行 `TemplateImpure: …:WRITE_SCOPE`）；多槽 exit 1（首行 `file:///…/renderBoundary.mjs:47`，`Error: TemplateImpure: …:EXTRA` 在 stderr 第 5 行——按 spec §8.4 不测稳定错误面） |
| S6B-TC-29 | 边 | 通过 | `SLOTS.slice(0,12)` 逐项逐序不动；`slice(12)` = 三新槽 | 前 12 名 = `SEAT…DETECTION_CMD`；后 3 名 = `ROLE_KIND` / `WRITE_SCOPE` / `HOST_RULE` |
| S6B-TC-30 | 正 | 通过 | `GATE` exit 0 且末行匹配 `^baseline (\d+)/\1$`（不写死 38） | `baseline 38/38`，exit 0；正则命中 |
| S6B-TC-31 | 负 | 通过 | 未登记 `writeScope`（席级）/ 未登记项（scope 级）→ 各首行全等；均不含 `TypeError`/`TemplateImpure` | ① `UnknownPolicyRef: senior-sdet:writeScope=spec.unknown`（`:248`）；② `UnknownPolicyRef: writeScope=spec.testcase:excludePathItem=code.nope`（`:233`）；均全等且无 `TypeError`/`TemplateImpure` |
| S6B-TC-32 | 正 | 通过 | 同一副本改回 → `GATE` exit 0 | 先 exit 1 → 改回 exit **0**，首行 `baseline 38/38` |
| S6B-TC-33 | 边 | 通过 | 排除模式项 → exit 1，首行含 `excludePathItem=` 且含 `spec / plan` | `UnknownPolicyRef: writeScope=spec.testcase:excludePathItem=spec / plan` |
| S6B-TC-34 | 边 | 通过 | 同 `id` 两次 → exit 1，含 `UnknownPolicyRef:` 与 `excludePathItem=code.test` | `…:excludePathItem=code.test:duplicate` |
| S6B-TC-35 | 负 | 通过 | 三显式空值 → 各 exit 1、首行匹配 `^UnknownPolicyRef: senior-sdet:writeScope=`、不含 `TypeError`/`TemplateImpure` | 三次均 `UnknownPolicyRef: senior-sdet:writeScope=(missing)`；无 `??` 回落 |
| S6B-TC-36 | 负 | 通过 | 两行首行全等 scope 级 `ForbiddenGroupGranted`，且不是 `UnknownPolicyRef:` | `ForbiddenGroupGranted: writeScope=spec.testcase:excludePathItem=rules:not-allowed` / `…review.ledger…=code.test:not-allowed`（`:223-238`） |
| S6B-TC-37 | 正 | 通过 | `CHECK` exit 0；末行 `check 全部通过`；全文含 `# fail 0` | `npm run check` → **exit 0**、`# tests 1541` / `# pass 1534` / `# fail 0` / `# skipped 7`、`④ markdown 检查通过（437 个文件 / 1935 张表）`、`[observable] 扫描 107 个 .md / 未豁免命中 0 行 / 已豁免 6 行 / stale 0 条`、末行 **`check 全部通过`** |
| S6B-TC-38 | 正 | 通过 | `GATE` + `SWEEP` 各 exit 0，末行对位 | `GATE` → `baseline 38/38`（exit 0）；`SWEEP` → **exit 0**，末行 `sweep ok（命中未超基线、清单齐、scope 齐）`。当次 `impact-sheet.md` 已刷新（LastWriteTime `11:51:45`，晚于 spec `11:41:57` / testcase `11:45:08`），自动发现不再报「早于被扫文件」 |
| S6B-TC-39 | 负 | 通过 | `roleKind = ''` → exit 1；首行 `UnknownPolicyRef: writeScope=spec.testcase:empty`；不含 `TemplateImpure` | exit 1；首行全等 `UnknownPolicyRef: writeScope=spec.testcase:empty`（`:228`）；无 `TemplateImpure` |
| S6B-TC-40 | 边 | 通过 | 施工后 `# tests` ≥ `BASE` | 现 `# tests 1541`；`BASE` 施工前同值 1541（`docs/reports/2026-11-05-s6-b-step-3-audit.md:21` / `:116`）→ `A = B` |
| S6B-TC-41 | 正 | 通过 | `id` 形态 / 非保留名 / `text` 非空 / 唯一 / 组键序不变 | 违规项 = `[]` / `[]` / `[]`；`uniqueCount 19 = total 19`；组序 `code / governance / docs.input / build / ledger / workspace` |
| S6B-TC-42 | 负 | 通过 | 跨组撞 `id` / 原型链保留名 → 各 exit 1、前缀 `UnknownPolicyRef:` | `paths:item=code.test:duplicate` / `paths:item=constructor`（`:208-217`） |
| S6B-TC-43 | 正 | 通过 | `senior-sdet` 显式声明；其余未声明；三者 `WRITE_SCOPE == review.ledger.label` | `hasOwn` = true；RA/DO/`__default__` 键集无该字段；三者逐字相等（`seats.mjs:17-23`） |
| S6B-TC-44 | 边 | 通过 | `clause` 逐字 = 旧句第三段；渲染含两词 | `clause` 与 BASE 旧串全等（含无末尾句号）；render 命中 `不改别人的判定` / `不参与议会裁决` |
| S6B-TC-45 | 正 | 通过 | 旧键在 + `senior-sdet@1` 在 + 比对键 = `@1` + 值 = 新渲染哈希 | 键集 8；`senior-sdet@1` = `54924fbb…bc97` = `sha(renderBoundary('senior-sdet'))` |
| S6B-TC-46 | 负 | 通过 | 副本删旧键 → 键集断言必红 | 副本键集 7 项，**无** `senior-sdet-boundary` |
| S6B-TC-47 | 正 | 通过 | dump `paths.groups` 为 `text` 数组；`code` = `['代码','测试']`；`specPlan` 仍源串；无 `"id"` | 六组皆字符串数组；`["代码","测试"]`；`spec\s*\/\s*plan`；含 `"id"` = **false**（`dumpPolicy.mjs:31-34`） |
| S6B-TC-48 | 边 | 通过 | 塞清单类项文本 → `TemplateImpure` 非 `TypeError`；真仓绿 | 真仓 `baseline 38/38`；副本 exit 1 首行 `TemplateImpure: …:docs/prd/`，无 `TypeError`（`renderBoundary.mjs:182` 已读 `x.text`） |
| S6B-TC-49 | 边 | 通过 | 两保留名 → 各首行全等（席级 / scope 级）；无 `TypeError` | ① `UnknownPolicyRef: senior-sdet:writeScope=constructor`；② `UnknownPolicyRef: writeScope=spec.testcase:excludePathItem=constructor`；均无 `TypeError` |
| S6B-TC-50 | 负 | 通过 | 非 `senior-sdet` 声明 → 首行全等 `<席>:writeScope=spec.testcase:not-allowed` | `ForbiddenGroupGranted: reviewer-audit:writeScope=spec.testcase:not-allowed`（`:250-252`） |
| S6B-TC-51 | 负 | 通过 | 两字段 → 同码同路径 | 两次均 `SeatNameInDefinition: tools/docgen/policy/definitions/writeScopes.mjs`（`:255-261`） |
| S6B-TC-52 | 负 | 通过 | 第三值 → 首行全等 `writeScope=probe.scope:not-allowed`，无 `excludePathItem=` | 全等命中（`:218-222`） |
| S6B-TC-53 | 正 | 通过 | `HOST_RULE` 含「只由主 agent 写」且不含「主持人」；sd 计数 0；议会席该句与 BASE 逐字相等；`GATE` 0 | `HOST_RULE` = 「不得写 `progress.md`（只由主 agent 写）」；sd 渲染 `主持人` = **0**；RA 边界段 sha = `aaa1ed1b…` = BASE；`baseline 38/38`。红档（副本改回含「主持人」）计数 = **2** → ①② 各必抛 |

**统计（本表实得）**：通过 **53** / 不通过 **0** / 不适用 **0**。合计 53。

## 2 计数现算

> 标准 = 只数 testcase §1 的「类型」列，**不采信文件头声明值**。取数 = 读 `-testcase.md` 的 §1 表逐行归类，命令输出首行：`{"rows":53,"zheng":22,"fu":18,"bian":13,"negPlusEdge":31,"dup":[]}`（重号 0）。

| 项 | 现算值 | 与声明比对 |
|---|---|---|
| 正例 | **22**（01 / 02 / 05 / 06 / 10 / 11 / 16 / 17 / 20 / 22 / 24 / 26 / 27 / 30 / 32 / 37 / 38 / 41 / 43 / 45 / 47 / 53） | 与 §1.1 声明 22 一致 |
| 负例 | **18**（03 / 07 / 12 / 13 / 18 / 21 / 23 / 28 / 31 / 35 / 36 / 39 / 42 / 46 / 49 / 50 / 51 / 52） | 与声明 18 一致 |
| 边界 | **13**（04 / 08 / 09 / 14 / 15 / 19 / 25 / 29 / 33 / 34 / 40 / 44 / 48） | 与声明 13 一致 |
| 合计 | **53**（硬上限 80；`check-plan.mjs size` → `spec 228/350 tc 53/80 rounds 3/3 => ok`） | 一致 |
| 负 + 边 | **31** | **≥ 正 22**，余量 9 → **成立** |
| 结果分布 | 通过 53 / 不通过 0 / 不适用 0 | 与 §1 表逐行可对账（53+0=53） |
| plan 映射 | `map: missing 0 dangling 0（cases 53 / mapped 53） => ok` | 53 条全落 Task |

**逐类命中率（现算，只作风险定位）**：正例 22/22；负例 18/18；边界 13/13。合计 22+18+13 = 53。

## 3 反向验证与可重跑构造

### 3.1 反向验证（注入坏数据必红；均在本机 `%TEMP%` 副本内实跑、跑完自动删除）

| # | 注入（改哪一处） | 期望红 | 实测（破坏前 → 破坏后） | 判 |
|---|---|---|---|---|
| R-1 | 副本 `writeScopes.mjs` 的 `review.ledger.label` 末尾加 `X` | 两评审席渲染 sha 必变（V-1 不是「写死」） | `aaa1ed1b…` → `83ffe1ad…`；`a9bdacba…` → `e1be8592…` | 成立 |
| R-2 | 副本模板写回 `` `.session/reviews/<本次>/` `` 反引号项 | `TemplateImpure` + exit 1 | 真仓 `baseline 38/38`（exit 0）→ 副本 exit 1，首行 `TemplateImpure: …:.session/reviews/<本次>/` | 成立 |
| R-3 | 副本 `writeScopes` 追加第三 scope `probe.scope` | `ForbiddenGroupGranted: writeScope=probe.scope:not-allowed` | 真仓 exit 0 → 副本 exit 1，首行全等 | 成立 |
| R-4 | 副本 `paths.mjs` 把 `other-reviews` 的 `id` 改 `constructor` | `UnknownPolicyRef`（原型链名不得放过） | 真仓 exit 0 → 副本 exit 1，首行 `UnknownPolicyRef: paths:item=constructor` | 成立 |
| R-5 | 副本 `spec.testcase.hostRule` 改回含「主持人」 | 非议会席「主持人」计数必 ≥1 | 真仓 `senior-sdet` 计数 0 → 副本计数 **2** | 成立 |
| R-6 | 副本 `patternRegistry.mjs` 追加 `export const SDET_BOUNDARY` | 导出面断言（模块空间）必抛 | 真仓 `hasOwn(PR,'SDET_BOUNDARY')` = false → 副本 = **true**；`patternRegistry` 对象仍 false（故断言须查模块空间） | 成立 |

> 每条注入后均在同一副本里看到目标断言抛（或 CLI 发码）；未出仓：副本路径形如 `%TEMP%/dw-copy-*`，注入全部跑完后 `git status --porcelain` 无新增。

### 3.2 失败用例与回归复跑构造（本轮 **0 失败**；两条 e2e 的复跑命令保留）

| ID | 复跑构造（命令） | 应得 / 本轮实得 |
|---|---|---|
| S6B-TC-38 | 仓根跑 `node scripts/scope-sweep.mjs --check` | 应 `sweep ok` + exit 0；**本轮实得** `sweep ok（命中未超基线、清单齐、scope 齐）` exit 0（当次 `impact-sheet.md` `11:51:45` 晚于 spec / testcase） |
| S6B-TC-37 | 仓根跑 `npm run check` | 应 exit 0 + 末行 `check 全部通过` + 全文 `# fail 0`；**本轮实得** exit 0、`# tests 1541 / # pass 1534 / # fail 0 / # skipped 7`、末行 `check 全部通过` |

> 上一轮的红档构造（`scope-sweep --check` 报「impact-sheet 早于被扫文件」→ `# fail 4`）保留在 §3.3 末行，作为「该判据非恒真」的可复现证据。**本轮无失败用例，故无「未修项」。**

### 3.3 复核轮已闭合项（上轮 11 条不通过 → 本轮全绿，附复跑证据）

| 上轮不通过 | 本轮结果 | 复跑证据（本轮实得） |
|---|---|---|
| TC-06 / 08（grep 残留） | 通过 | `git grep -l SDET_BOUNDARY -- tools agents skills` stdout 空（0 文件）；`-- docs` = 7 |
| TC-07（构造指向错对象） | 通过 | 断言改查模块空间：副本 `hasOwn(PR)=true` → 必抛 |
| TC-17（用 `gate` 判清空） | 通过 | `policy --dump` exit 0；同副本 `gate` exit 1（卡面失配，与本条无关） |
| TC-18 / 31 / 39 / 49（报文缺席名） | 通过 | 四条首行逐条全等：scope 级 `writeScope=…:excludePathItem=…` / `writeScope=…:empty` |
| TC-28（多槽首行） | 通过 | 漏槽 / 多槽各 exit 1（首行不再比对，按 D-17 / spec §8.4） |
| TC-37 / 38（R8 清单时效） | 通过 | 清单刷新后 `sweep ok` exit 0；`npm run check` exit 0 / `# fail 0` / 末行 `check 全部通过` |

## 4 已知未覆盖缺口（漏检哪类 + 触发 + 谁兜）

| # | 漏检哪一类 | 触发（什么时候会漏） | 谁兜 | 级别 |
|---|---|---|---|---|
| G-1 | **53 条用例仍无常驻测试块**：`test('S6B-TC-` 在 `tools/docgen/test/*.test.mjs` 命中 **0**；连带 TC-25④ / TC-15③ / TC-08③ 的**静态子断言无判对象**（只能以实现常量作替代证据） | 下次改 `renderBoundary` / `validatePolicy` / `paths` / `writeScopes` 时，`npm run check` 不会报 S6B 面回归 → 只能人工重走本表 | ④ 段本文件（一次性）+ ⑤ 交付审计抽核；建议落 10–12 个常驻块 | P2 |
| G-2 | **spec §5 报文列未单列 `:empty` 形态**：实测 `UnknownPolicyRef: writeScope=<scope>:empty` 存在（TC-39），§5 报文列只列 `<席>:writeScope=<id>` 与 `writeScope=<scope>:excludePathItem=<id>` | 下次有人按 §5 逐字实现 / 判红时 | 本 testcase D-16 附注已登记（触发 = 下次改 §5 时补列）；审计按本文件复核 | P2 |
| G-3 | **数据文本句法注入**：`text` / `label` / `roleKind` / `hostRule` 只判非空，不判「不得含换行 / 不得含 `{{`」 | 下次改这四类数据（label 塞换行会破卡面段落） | 归 plan §6 已知限制（候选，不阻断）；④ 段无机器兜 | P2 |
| G-4 | **（已闭合）R8「当次 impact-sheet」时效**：上轮 `impact-sheet.md`（`11:24:36`）早于被扫文件（spec `11:41:57` / testcase `11:45:08`）→ `scope-sweep --check` exit 1、`npm run check` `# fail 4` | 本轮清单已刷新至 `11:51:45`（晚于两文件）→ `sweep ok` exit 0、`npm run check` exit 0 / `# fail 0`；**再发生的触发** = 任一判据级口径改判后未刷新当次清单 | 申报方刷新清单或 `--impact` 显式指定；审计复核 | **已闭合**（原 P1） |
| G-5 | （已闭合）多槽稳定错误面 | 已按 spec §8.4「不测」→ TC-28 只判 exit 1（D-17） | — | 记录 |
| G-6 | （已闭合）「清空排除项」不能用 `gate` 判 | TC-17 判据命令改为 `policy --dump`（同走 `validatePolicy`、不比对卡面） | — | 记录 |
| G-7 | （已闭合）`SDET_BOUNDARY` 注释残留 / TC-07 构造指向错对象 | 字面已删（grep 0）；断言改查模块空间 | — | 记录 |

## 5 漂移定性

### 5.1 类型判定（相对 spec / testcase 的现行口径）

| 类型 | 是否发生 | 依据 |
|---|---|---|
| **功能增删** | **否** | 功能点集合未动（PRD 不在 `git status`；spec 声明 F-24 续作、不改集合）；交付面与 plan §3 白名单一一对应 |
| **行为偏差** | **否** | D-16 后实现报文与 spec §5 一致（席级 / scope 级两形态逐字命中）；多槽错误面按 §8.4 进「不测」，不再作为偏离；权限语义（允许 / 禁写集合）逐项未变（TC-16 / 17 / 19 / 20–24） |
| **细节偏差** | **是（2 处）** | ① spec §5 报文列未列 `:empty` 第三形态（G-2，文档面）；② 53 条用例仍无常驻测试块（G-1，交付完整性）。**均不改变任何行为与权限语义** |
| **零漂移面** | — | `pathGroups` 项对象化、`writeScopes` 两 scope、`writeScope` 可选字段、`clause` 承接旧第三段、槽集 15 与 `HOST_RULE`、按席排除注、`dump` 的 `text` 投影、黄金 `senior-sdet@1`、`agents/senior-sdet.md` 重出、`docs/agents/**` 零改动 —— 逐条与 spec §3 / §6 一致 |

### 5.2 三权签署

| 权 | 归属 | 本席做了什么 |
|---|---|---|
| **申报（只报事实）** | 主 agent（施工方） | 本席不替其申报；所有红绿结论均由本席本次自跑取数（§1 / §3 逐条带首行或 `path:line`），未采信施工方结论表 |
| **定性（判类型）** | **本席（`senior-sdet` ④ 段独立实例）** | §5.1 即定性：**细节偏差 2 处、行为偏差 0、功能增删 0** |
| **核对（复核定性）** | 审计（`reviewer-audit` 独立实例，⑤ 段） | 本文件不代签；§3.2 的可重跑构造与 §4 的缺口全部带命令，供审计逐条复算 |

## 6 结论

### 6.1 出口六条（④ 段判据，逐条对位）

| # | 判据 | 结果 | 证据 |
|---|---|---|---|
| ① | 53 条全部执行、逐条有结论，无「未执行」/「略过」 | **成立** | §1 表 53 行；不适用 0；每条带命令首行或 `path:line` |
| ② | 负例 + 边界 ≥ 正例（现算） | **成立** | 31 ≥ 22（§2，余量 9） |
| ③ | 失败用例留可重跑构造 | **成立** | §3.2：本轮 0 失败；两条 e2e 复跑命令保留，上轮红档构造留在 §3.3 |
| ④ | 反向验证 ≥ 1 条 | **成立** | §3.1 六条注入，逐条「破坏前 → 破坏后」 |
| ⑤ | 已知未覆盖缺口写清（漏检哪类 + 触发 + 谁兜） | **成立** | §4 共 7 条（G-1～G-7，其中 **3 条开**、**4 条已闭合**） |
| ⑥ | 漂移定性在位（类型 + 三权） | **成立** | §5.1 类型表 + §5.2 三权 |

### 6.2 级别统计（本席定性）

| 级别 | 计数 | 条目 |
|---|---|---|
| **P0** | **0** | 无：无权限放宽、无数据破坏、无假绿（全部红档均可复现且真红） |
| **P1** | **0** | 上轮 P1-1（R8 清单时效）已闭合：清单刷新至 `11:51:45` 后 `sweep ok` exit 0、`npm run check` exit 0 / `# fail 0` / 末行 `check 全部通过` → TC-37 / TC-38 转绿（G-4 记「已闭合」） |
| **P2** | **2（保留候选 1）** | P2-1（G-1）53 条用例无常驻测试块（含 3 处静态子断言无判对象），触发 = 下次改 `renderBoundary` / `validatePolicy` / `paths` / `writeScopes`，谁兜 = ④ 一次性表 + ⑤ 审计抽核（建议落 10–12 个常驻块）；P2-2（G-2）spec §5 报文列未列 `:empty` 第三形态，触发 = 下次按 §5 逐字实现 / 判红，谁兜 = D-16 附注 + 审计。**候选 1（G-3）**数据文本句法注入，触发 = 下次改 `text` / `label` / `roleKind` / `hostRule`，归 plan §6 既有候选，不阻断 |

### 6.3 一句话结论

**④ 段通过（出口齐）**：53 条用例 **通过 53 / 不通过 0 / 不适用 0**；**负+边 31 ≥ 正 22**；**P0 0 / P1 0 / P2 2（+ 候选 1）**；漂移定性 = **细节偏差 2 处 + 行为偏差 0 + 功能增删 0**。
本轮复跑命令与首行：`node scripts/scope-sweep.mjs --check` → `sweep ok（命中未超基线、清单齐、scope 齐）`（exit 0）；`node tools/docgen/cli.mjs gate` → `baseline 38/38`（exit 0）；`npm run check` → `# tests 1541 / # pass 1534 / # fail 0 / # skipped 7`、`④ markdown 检查通过（437 个文件 / 1935 张表）`、末行 `check 全部通过`（exit 0）。**上轮 TC-37 / TC-38 的红由 R8 清单时效引起（非源码缺陷）；清单刷新后两处转绿，本表判「过」。**

## 7 本席自检（角色卡「一定会」5 条 + 本席清单 9 条）

| # | 条目 | 判定 | 理由 / 证据 |
|---|---|---|---|
| 一定会-1 | 结论依据 ≥ 2 条、各带 `path:line`、来自 ≥ 2 文件 | `hit` | 依据跨 `.session/reviews/2026-11-04-2134-s6-b-boundary-convergence/impact-sheet.md`（mtime）、`docs/superpowers/specs/…-testcase.md`（mtime）、`validatePolicy.mjs:228` / `:233` / `:248`、`patternRegistry.mjs:30`、`scope-sweep.mjs:119-125` → 5 文件 |
| 一定会-2 | 证据可复算：行存在且含被引摘句 | `hit` | §1 逐条首行可重放；§3.1 六条注入带破坏前后值；§3.2 两条复跑命令 |
| 一定会-3 | 英文术语首现行含中文解释 | `hit` | 首现行已释：`BASE`（批次基准提交）、`sha256`（哈希指纹）、`PROBE`（断言式取数）、`COPY`（`%TEMP%` 全仓副本）、`GATE`（卡面一致性门）、`R8`（改判回扫规则）；未解释术语 = 0 |
| 一定会-4 | 无问题时显式写「全过、无问题」 | `na` | reason：findings 非空（P2 2 + 候选 1） |
| 一定会-5 | 附录无问题时写「全过、无问题」 | `na` | reason：本文件不设附录 |
| 本席-1 | 输入空间核对 | `hit` | §0 列明判据代号、BASE、仓库现状、注入边界；§1 逐条给输入 |
| 本席-2 | 状态与转移核对 | `hit` | 施工前（12 槽 / 18 元素 / 19 点名 / 卡面旧单句）→ 施工后（15 / 19 / 20 / 新渲染 `54924fbb…`）；本轮 11 条（9 条口径 / 构造 + 2 条清单时效）→ 全绿（§3.3） |
| 本席-3 | 失败面核对 | `hit` | 五码负例：`UnknownPolicyRef`（18 / 31 / 33 / 34 / 35 / 39 / 42 / 49）、`ForbiddenGroupGranted`（36 / 50 / 52）、`SeatNameInDefinition`（51）、`TemplateImpure`（14 / 28 / 48）；`LiteralInConfig` 本批无新增 |
| 本席-4 | 判据来源核对 | `hit` | §1「判据」列逐字取自 testcase §2；§6.1 对 `gate-record.md:56` 六条出口判据 |
| 本席-5 | 确定性核对 | `hit` | 全部判据 = 退出码 / 全等 / 正则 / 计数 / sha；§0 明写未用 `node -e` 与「grep 退出码」当判据 |
| 本席-6 | 回归资产核对 | `hit` | D8 的 5 个受改判测试文件实跑：`policy-pure-source` 71/71；其余 4 文件 125 pass / 3 skipped / 0 fail；全仓 `npm run check` 本轮 `# fail 0`（上轮 4 处 sweep 连带红已随清单刷新消失） |
| 本席-7 | 判别力核对 | `hit` | §3.1 六条 injection 逐条「真仓绿 → 副本红」；§3.2 两条 e2e 复跑命令（本轮 0 失败） |
| 本席-8 | 盲点雷达核对 | `hit` | 7 条缺口（G-1 无常驻块 / G-2 `:empty` 未列 / G-3 数据句法 / G-4 R8 清单（已闭合）/ G-5～G-7 已闭合） |
| 本席-9 | 覆盖账核对 | `hit` | §2 现算 22 / 18 / 13 = 53；31 ≥ 22；V-1～V-8 全覆盖（V-6 含槽 15、V-5 五组、V-7 三负例）；不变量 13 / 14 各有用例（17·36·52 / 50） |

**禁止 4 条自检**：① 每条问题都给了解法（P2 的触发与落点 + 候选 G-3 的归属）；② 未越界处置（本轮只改本文件；未改源码 / spec / plan；未做 git 写）；③ 证据栏无空行（§1 53 行逐行有首行或 `path:line`）；④ 未代任何他席填签名格（本文件无签名格；三权见 §5.2）。
