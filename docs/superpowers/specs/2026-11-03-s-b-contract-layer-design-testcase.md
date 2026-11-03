# 测试用例：S-B 契约层（`issue-card` 三列证据 + 引句校验器 + 卡面策略指针）

> 归属 spec：`docs/superpowers/specs/2026-11-03-s-b-contract-layer-design.md`（split from `docs/prd/20261102212627-card-data-contract-and-proof/index.md` 2026-11-03）
> 编写者：`senior-sdet`（实例标识 `senior-sdet@s-b-contract-layer-testcase-20261103-01`）
> **独立性声明**：本文件由 `senior-sdet` 在**全新上下文**编写，编写者 ≠ spec 作者（`main-agent@20261103-s-b-spec`），≠ 后续施工者；编写者只读 spec / PRD / 既有实现，未参与 spec 撰写，也未参与本段施工。
> 状态：**修订轮次 8**（按议会第 1 轮 5 席 25 卡 + 四道复核 + 侦探 2 项逐条回填；用例 39 → 41，新增 SB-TC-40 / SB-TC-41），待 ② 段门行登记｜最后更新：`2026-11-03`
> 命名与落点：按 `spec-testcase-gate` 判据 1（与 spec 同目录；文件名 = spec 文件名去掉 `.md` 后 + `-testcase.md`）。
> **声明**：本轮只跟随 spec 已落的裁定与议会卡（以 spec 现值为唯一口径），未改写 spec / plan / 代码；做不到的按纪律标 `异议`（本轮 0 条）。

## 0 判据约定（全表复用，避免每条重写命令）

所有命令在**仓根**执行，Shell = PowerShell 5；`exit` 指命令退出码。

| 代号 | 命令 | 备注 |
|---|---|---|
| `GATE` | `node tools/docgen/cli.mjs gate` | spec §11.4-6 前半；`exit 0` + 15 席 `disk == render` |
| `CHECK` | `npm run check` | 门禁总入口；§11.4-7 |
| `QUOTES` | `node tools/docgen/check-quotes.mjs` | 新脚本（spec §11.2.2）；输入 = 仓内 `docs/superpowers/reviews/**/observation-*.json` |
| `CASE` | `node tools/docgen/check-case-assert.mjs --plan docs/superpowers/plans/2026-11-03-s-a-data-layer.md --testcase docs/superpowers/specs/2026-11-03-s-a-data-layer-design-testcase.md` | 新脚本（spec §11.2.5）；首次实测输入 = S-A 已签那对（spec §11.1 R10） |
| `OBS` | `node tools/observation-check/cli.mjs <某个 observation json>` | 单件校验（exit 0 全过 / 1 有错 / 2 用法错），口径见 `tools/observation-check/cli.mjs` 的 `USAGE` 常量与 `usage()` 分支 |
| `PROBE` | 落进 `tools/docgen/test/sb-contract-layer.test.mjs` 的该用例体内（用 `node --test --test-name-pattern "<用例 ID>" tools/docgen/test/sb-contract-layer.test.mjs` 单跑该条），断言用 `assert` 写；**不得用 `node -e` / `node --input-type=module -e`**（spec §11.4 头：审计席角色卡禁 `node -e`，议会第 1 轮 AU 的 A-05） | 读 `outputFormats` / `buildCards()` / `renderBoundary` / `card-model` 的导出面；**只读**，不改仓 |
| `SCANQ` | `(Select-String -Path agents\*.md -Pattern '逐项点名' -List).Count` | PRD V8 的原命令形态。**单独用不得当判据**（`Select-String` 不设退出码），必须包进下面的 `COUNT` 形态 |
| `COUNT` | 纯计数的统一可判形态：`$c = <计数命令>; if ($c -ne 0) { Write-Host '<名> $c'; exit 1 }; exit 0`（「必须 = 0」处）；「必须 ≥ N」处写成 `if ($c -lt N) { Write-Host '<名> $c'; exit 1 }; exit 0` | **不许**依赖 `Select-String` / `git diff` / `git ls-files` 的进程退出码（spec §11.4 头 + 议会第 1 轮 AU 的 A-04 / AI 的 Q-5：计数为任何值都 exit 0）。落成 `node --test` 用例时等价于 `assert.equal($c, 0)` |
| `COPY` | 仓副本注入坏值 | 用既有支撑 `tools/docgen/test/support/dev-workflow-checks.mjs` 导出的 `withRepoCopy(dst => …)`；**不得在真仓就地注入**（例外见各用例「前置」明确写出的语料注入） |
| `REPLACE` | `node tools/docgen/cli.mjs replace --kind agent --name <seat> --draft <草稿路径> --yes` | 写盘替换；判据锚 = `tools/docgen/cli.mjs` 抛出的 `EvidenceInvalid` / `TargetDrift` 两码 |
| `BASE` | `git rev-parse HEAD`（**在动模板之前**执行，把输出记进当次账本） | spec §11.4-6 / §11.2.7 第 4 步：渲染一致的比较基准 = **改前提交哈希**，不是工作区瞬时状态 |
| `SHA15` | `Get-ChildItem agents\*.md \| ForEach-Object { "$($_.Name) " + (Get-FileHash $_.FullName -Algorithm SHA256).Hash }` | 15 席 SHA256；与 `docs/reports/2026-11-03-s-a-card-sha-baseline.md` 的「一、15 席冻结基线」表逐行比 |

**口径声明**（本文件出现的数字，全部可复算）：
- **15 席 / 15 卡** = `(Get-ChildItem agents -File).Count`；**2 卡** = 边界段指针化的那 2 席（`agents/reviewer-audit.md` + `agents/detective-observer.md`，spec §11.3 头）；**卡面变更面 = 15 files**（spec §11.3「卡面变更面 = 15 张卡（不是 2 张）」）。**别把「2 卡」当变更面**——议会第 1 轮 BE 的 B-01 / AI 的 Q-1 就纠这一处；
- **9 列** = 4（HEAD：`编号（Q-轮-序）`/`提出角色`/`归属维度`/`问题描述`）+ 3（`evidence.fields`）+ 2（TAIL：`严重级别`/`建议解法`），spec §11.2.1；
- **3 列证据** = `outputFormats.evidence.fields` 的现值（唯一写死处 = `tools/docgen/components/outputFormats.mjs` 的 `evidence` 段：`原文摘句`/`文件 + 行号`/`用途`）——**本文件不另立第二份字面**，判据一律「与 `evidence.fields` 逐字相等」；
- **K ≥ 2** = spec §11.4-2 的**脚本判据**（spec §11.2.2 口径 3：`K < 2` → exit 1，故 `K = 0` 与 `K = 1` 同为红，不是「期望值」）；
- **30 个 ID = `TC-001`…`TC-030`**（**三位**，spec §11.2.5 口径 1 与 §11.1 R10；写成两位只能取出 4 个唯一值——议会第 1 轮 QA 的 Q-T-05）；
- **36 码 / 8 键** = `CARD_MODEL_CODES`（`tools/docgen/card-model/validateCardModel.mjs`）与 `SCAN_FIELDS`（`tools/docgen/card-model/enums.mjs`）的键数，spec §11.4-7 要求不变；
- **4 符号名** = `pathGroups` / `commandGroups` / `forbiddenGroups` / `DETECTION_BLIND_SPOTS`（spec §11.1 R6）；
- **13 席「只少一行」** = 除 2 卡外的 13 席，其 `git diff -U0 $BASE -- agents/` 输出**只有一条删除行**（`关注类别：` 那行）、无其它增删（spec §11.2.7 第 4 步）。**这 13 席的 SHA 也会变**（少了一行），所以「哈希不变」这个说法不成立；能判的是「变更形态只有一条删除行」；
- **15 份 evidence 同批** = `tools/docgen/fixtures/<席>.evidence.json` 共 15 份，逐席 `renderSha256` 必须等于盘上哈希（`tools/docgen/test/sa-data-layer.test.mjs` 的 `TC-028` 口径，spec §11.2.7 第 3 步）；
- **`关注类别：` 15 / `类别：` 30 → 0 / 15**：现状实测 `(Select-String -Path agents\*.md -Pattern '关注类别：').Count` → `15`，`… -Pattern '类别：'` → `30`（含被 `关注类别：` 顺带命中的 15 行）；R8 落地后无子串重叠，故 §11.4-8 的 `≥ 15` 是真下界。

## 1 覆盖总表

| 用例 ID | 覆盖的 spec 条目（或 PRD V 编号） | 层级 | 类型 | 判据类型 | 执行方式 | 优先级 |
|---|---|---|---|---|---|---|
| SB-TC-01 | spec §11.4-1 / §11.2.1 / §11.5 第 1 行；PRD §2 D14 | 单元 | 正例 | 机器 | `PROBE` 三列相等 + 长度 | P0 |
| SB-TC-02 | spec §11.5 第 1 行（派生跟随）/ §11.1 R1 | 单元 | 正例 | 机器 | `COPY` + `PROBE` | P0 |
| SB-TC-03 | spec §11.4-2 / §11.2.2 口径 3–4 / §11.5 第 2 行；PRD §4 V6 | 集成 | 正例 | 机器 | `QUOTES` | P0 |
| SB-TC-04 | spec §11.2.2「语料件三步」/ §11.5 第 3 行 / §11.1 R4 / §11.2.8 D-d；PRD §4 V6 | 集成 | 正例 | 机器 | `OBS` + `CHECK` ⑥ 段 + `git ls-files`（均包 `COUNT`） | P0 |
| SB-TC-05 | spec §11.4-3 ② / §11.5 第 4 行 / §11.2.3；PRD §4 V8 / §3 Q6 | 集成 | 正例 | 机器 | `SCANQ`（`COUNT`）+ 边界段文本探针 | P0 |
| SB-TC-06 | spec §11.4-6 / §11.2.7 第 2–4 步 / §11.5 第 5 行 / §11.1 R11；PRD §4 V4 | e2e | 正例 | 机器 | `GATE` + `git diff --stat $BASE`（15 files）+ 15 份 evidence 哈希 | P0 |
| SB-TC-07 | spec §11.4-5 前半（`agentData[i].card` 的 `deepEqual`）/ §11.2.4 / §11.1 R7；PRD §3 Q3 | 单元 | 正例 | 机器 | `PROBE` 逐席 `deepEqual` + 席文件无该键 | P0 |
| SB-TC-08 | spec §11.4-8 / §11.5 第 7 行 / §11.1 R8；PRD §3 Q3 | 集成 | 正例 | 机器 | 卡面两向计数探针 | P0 |
| SB-TC-09 | spec §11.4-4 / §11.2.5 口径 1·5 / §11.1 R10；PRD §4 V7 | 集成 | 正例 | 机器 | `CASE` | P0 |
| SB-TC-10 | spec §11.2.1（第 2 条改 / 第 1·3 条不动）/ §11.5 第 9 行 / §11.1 R9 | 单元 | 正例 | 机器 | `PROBE` `FORMAT_CHECKS` | P0 |
| SB-TC-11 | spec §11.4-7；PRD §4 V3（回归） | e2e | 正例 | 机器 | `CHECK` + `PROBE` 码表/键数 | P0 |
| SB-TC-12 | spec §11.2.6 前两行 / §11.1 R12 / §11.8 第 4 条 | 集成 | 正例 | 机器 | `node --test` 两个已签测试文件 | P0 |
| SB-TC-13 | spec §11.4-3 ① / §11.2.3「模板纯度」/ §11.2.8 D-a | 单元 | 正例 | 机器 | `PROBE` `assertTemplatePure` + 白名单 | P0 |
| SB-TC-14 | spec §11.1 R3 / §11.7 / §11.2.2 末段 | 集成 | 正例 | 机器 | 源码/脚本清单 grep + `docs/after` 指针 | P1 |
| SB-TC-15 | spec §11.2.2 口径 2 / §11.5 第 2 行「摘句不在文件」；PRD §4 V6 | 单元 | 负例 | 机器 | 语料注入 + `QUOTES` | P0 |
| SB-TC-16 | spec §11.2.2 口径 2 / §11.5 第 2 行「行号不含摘句」；PRD §4 V6 | 单元 | 负例 | 机器 | 语料注入 + `QUOTES` | P0 |
| SB-TC-17 | spec §11.2.2 口径 2 / §11.5 第 2 行「行号越界」；PRD §4 V6 | 单元 | 负例 | 机器 | 语料注入 + `QUOTES` | P0 |
| SB-TC-18 | spec §11.4-2 后半 / §11.2.2 口径 3 / §11.5 第 2 行「语料 `K = 0`」；PRD §4 V6 | 集成 | 负例 | 机器 | 语料清空 + `QUOTES` | P0 |
| SB-TC-19 | spec §11.4-3 ② / §11.5 第 4 行；PRD §4 V8 | 集成 | 负例 | 机器 | `COPY` + `SCANQ` | P0 |
| SB-TC-20 | spec §11.4-5 后半 / §11.2.4「拒载」/ §11.1 R7；PRD §3 Q3 | 单元 | 负例 | 机器 | `COPY` + `GATE` | P0 |
| SB-TC-21 | spec §11.4-4 / §11.2.5 口径 3 / §11.5 第 8 行；PRD §4 V7 | 单元 | 负例 | 机器 | `COPY` 用例体 + `CASE` | P0 |
| SB-TC-22 | spec §11.5 第 9 行 / §11.1 R9；`tools/docgen/test/s2-card-rewrite.test.mjs` 的 `S2-TC-A06` | 单元 | 负例 | 机器 | `COPY` + `node --test` | P0 |
| SB-TC-23 | spec §11.1 R1 / §11.5 第 1 行 / §11.4-1 | 单元 | 负例 | 机器 | `COPY` 抄字面 + `PROBE` | P0 |
| SB-TC-24 | spec §11.4-9（**被指针化的那 4 行**内无仓内路径形态；不判整段）/ §11.5 第 10 行 / §11.1 R6 / §11.2.8 D-a；PRD §2 D13 / §3 Q8 | 集成 | 负例 | 机器 | `COPY` 路径注入 + 4 行定位 + 正则（`COUNT`） | P0 |
| SB-TC-25 | spec §11.4-6 / §11.2.7 第 2–4 步 / §11.1 R11 | e2e | 负例 | 机器 | `COPY` + `GATE` | P0 |
| SB-TC-26 | spec §11.2.7 第 3 步 / §11.1 R11 / §11.2.6 第 1 行口径（三条红态：`BaselineDrift` / 幂等就地改写 / `--expect-change`） | 集成 | 负例 | 机器 | `COPY` + `REPLACE` | P0 |
| SB-TC-27 | spec §11.2.3「模板纯度」后半 / `tools/docgen/components/renderBoundary.mjs` 的 `assertTemplatePure`（白名单不得含清单类成员） | 单元 | 负例 | 机器 | `COPY` + import 退出码 | P1 |
| SB-TC-28 | spec §11.2.3「模板纯度」前半 / `tools/docgen/components/renderBoundary.mjs` 的 `TEMPLATE_ALLOWED_LITERALS` | 单元 | 负例 | 机器 | `COPY` 删登记 + `PROBE` | P1 |
| SB-TC-29 | spec §11.2.2 输入（`ARTIFACT_RE`，`tools/observation-check/gate-scan.mjs`） | 边界 | 边界 | 机器 | `COPY` 加 `.md` + `QUOTES` | P1 |
| SB-TC-30 | spec §11.1 R2「复用 `checkEvidence()`，不新写校验逻辑」 | 边界 | 边界 | 机器 | 语料注入结构行 + `QUOTES` | P1 |
| SB-TC-31 | spec §11.4-3 ②（段首 / 语义句统一 `anchors 12/12`）/ §11.1 R5 / §11.2.3「保留不动」 | 边界 | 边界 | 机器 | 边界段文本探针（12 组锚） | P0 |
| SB-TC-32 | spec §11.3（15 files 变更面）/ §11.4-6（13 席只有一条删除行）/ §11.1 R11 | 边界 | 边界 | 机器 | `git diff --stat $BASE` + `git diff -U0 $BASE` 逐席形态（`COUNT`） | P0 |
| SB-TC-33 | spec §11.1 R7 末句（注入而非删除）/ §11.2.4（loader 产物仍 8 键）/ §11.6（12 键契约本段不动） | 边界 | 边界 | 机器 | `PROBE` 键集（loader 8 键 + `buildCards()` 12 键） | P1 |
| SB-TC-34 | spec §11.2.4「注入 = `label` 逐元素逐字（同序），不做字符串变换」 | 边界 | 边界 | 机器 | `COPY` 改注入 + `PROBE` | P0 |
| SB-TC-35 | spec §11.1 R6 后半（符号名定义唯一、可 grep 回查）/ §11.2.8 D-a | 边界 | 边界 | 机器 | `policy\definitions\*.mjs` 的 `export const <sym>` 行数（`COUNT`） | P1 |
| SB-TC-36 | spec §11.2.6「改坏即绿」/ §11.2.6 末段「红才改」 | 边界 | 边界 | 机器 | `COPY` 复原一行 + `node --test` | P1 |
| SB-TC-37 | spec §11.4-8 两向判据的判别力 / §11.5 第 7 行；PRD §3 Q3 | 集成 | 负例 | 机器 | `COPY` + 卡面两向计数 | P0 |
| SB-TC-38 | spec §11.2.5 口径 4（`missing`）/ §11.4-4；PRD §4 V7 | 单元 | 负例 | 机器 | `COPY` 删用例体 + `CASE` | P0 |
| SB-TC-39 | spec §11.4-2（`K = 1` 也红）/ §11.2.2 口径 3 / §11.5 第 2 行「语料 `K = 1`」；PRD §4 V6 | 集成 | 负例 | 机器 | 语料减到 1 条 + `QUOTES` | P0 |
| SB-TC-40 | spec §11.4-3 ②（「本席组 ID 在位」，**只判那 2 张卡**）/ §11.2.3 命令白名单行（RD 的 Q-②-1）；PRD §3 Q6 | 集成 | 负例 | 机器 | `COPY` + 2 卡「命令默认拒绝」行探针（`COUNT`） | P0 |
| SB-TC-41 | spec §11.4-10（env 槽已指针化：`env.assign` 形态项命中 = 0）/ §11.2.3「槽号口径」+ 改造表「禁止命令 + env」行；PRD §3 Q6 | 集成 | 负例 | 机器 | `$BASE` 版卡基线 + 盘上卡探针 + `COPY` 两种漏改注入（`COUNT`） | P0 |

**覆盖核对**（spec 验收面逐条 → 用例）：

- §11.4 **十条**硬约束：1 → SB-TC-01（+23）；2 → SB-TC-03（+15/16/17/18/39/29/30）；3 → ① 模板侧 SB-TC-13（+27/28）、② 卡面侧 SB-TC-05（+19/40）、③ 段锚侧 SB-TC-31；4 → SB-TC-09（+21/38）；5 → SB-TC-07（+20/33/34）；6 → SB-TC-06（+25/32/26）；7 → SB-TC-11；8 → SB-TC-08（+37）；9 → SB-TC-24；**10 → SB-TC-41**。**未覆盖 0 条。**
- §11.5 **十个**「测什么」：① 三列派生 → 01 / 02 / 23；② 五种红态 → 15 / 16 / 17 / 18 / **39**；③ 语料件过 ⑥ 段 → 04；④ 4 行指针化四件 → 05（+19 / 24 / 31 / **40**）；⑤ 15 files 重生成 + 13 席只少一行 → 06（+25 / 32）；⑥ `duty.categories` `deepEqual` → 07（+20 / 33 / 34）；⑦ `关注类别：` = 0 且 `类别：` ≥ 15 → 08（+**37**）；⑧ 三种恒真形态 → 21（+**38**，绿态 09）；⑨ `FORMAT_CHECKS` 仍 3 条 → 10（+22）；⑩ 卡面边界段无仓内路径形态 → **24**。**未覆盖 0 条。**
- 本段引用的 PRD 锚点：V6（03 / 04 / 15 / 16 / 17 / 18 / 39）、V7（09 / 21 / 38）、V8（05 / 19 / 40）。V4 只借「渲染一致」面（06 / 25 / 32），V3 只借回归面（11）——**不承接 V9–V12**（归 S-C，spec §11.6）。
- §11.1 R1–R12：R1（01/02/23）、R2（03/15–18/29/30/39）、R3（14）、R4（04）、R5（05/19/24/31/40/**41**）、R6（24/35）、R7（07/20/33/34）、R8（**08/37**）、R9（10/22）、R10（09/21/38）、R11（06/25/26/32）、R12（12/36）。**无悬空 R**。

## 2 用例明细

### SB-TC-01 `issue-card.fields` 证据三列与 `evidence.fields` `deepEqual`（同序逐字）且总长 9

- **覆盖**：spec §11.4-1 / §11.2.1（`fields: [...HEAD, ...evidence.fields, ...TAIL]`）/ §11.5 第 1 行；PRD §2 D14
- **前置**：`outputFormats['issue-card'].fields` 已派生自 `outputFormats.evidence.fields`（`tools/docgen/components/outputFormats.mjs` 的 `evidence` 段是 `evidence.fields` 的唯一写死处）
- **步骤**：
  ① `PROBE`：一次取 `outputFormats['issue-card'].fields`、`outputFormats.evidence.fields`；取 `mid = fields.slice(4,7)`；比较 `JSON.stringify(mid) === JSON.stringify(evidence.fields)`；同时比较全量 `fields` 与 `[...HEAD, ...evidence.fields, ...TAIL]`（HEAD / TAIL 按 §11.2.1 的四项与两项字面构造）
  ② 打印 `evidence-cols: <mid.length>/<evidence.fields.length> length <fields.length> => ok|fail`，`ok` 时 exit 0
- **预期**：① `mid` 与 `evidence.fields` **`deepEqual`（同序逐字）**（不是集合相等，也不是引用相等）；② 全量 = `[...HEAD, ...evidence.fields, ...TAIL]` 逐字相等；③ 长度 = 9；④ `evidence.fields` 的项数 = 3
- **判据**：`PROBE` 首行恰为 `evidence-cols: 3/3 length 9 => ok`，exit 0；任一比较为假 → exit 1。**比较一律用结构相等（`deepEqual` / 序列化后相等），不得写成 `===` 引用比较**（spec §11.4-1：实现若 `map` 出新数组，引用相等会恒假而语义正确）；**三列位置必须断在 4/5/6 索引上**（只判「9 列」会被「三列放在尾部」或「三列分散」骗过）
- **红绿证据**：红 = 现状 `tools/docgen/components/outputFormats.mjs` 的 `issue-card` 段 `fields` 是 7 个字面（第 5 位只有 `'证据'` 一列），`mid.length = 1` → 打印 `evidence-cols: 1/3 length 7 => fail`；红（判据写法错）= 用 `===` 比两个数组 → 永远 `false`、语义正确也红；绿 = `fields` 由 `...evidence.fields` 展开，改 `evidence.fields` 一处 `issue-card` 跟随
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-01`（文件名由 plan 定稿，用例 ID 不变）
- **不覆盖**：`issue-card.checks` 三条的文案（SB-TC-10 管）；`S4-TC-D01` 的「5 个 outputKind / 无指针 / 两数组」三条判据（spec §11.8 明写不变，由既有 `tools/docgen/test/card-render.test.mjs` 的 `S4-TC-D01` 兜）

### SB-TC-02 改 `evidence.fields` 一处，`issue-card` 的证据三列必跟随（同一进程内可观察）

- **覆盖**：spec §11.5 第 1 行（「改 `evidence.fields` 一处，`issue-card` 必跟随」）/ §11.1 R1
- **前置**：SB-TC-01 已绿（派生成立）；本用例在 `COPY` 内做（改定义层 = 改仓内源码）
- **步骤**：
  ① `COPY` 内把 `tools/docgen/components/outputFormats.mjs` 的 `evidence.fields` 第 3 项由 `'用途'` 改为 `'用途X'`
  ② 在副本内跑与 SB-TC-01 同形的 `PROBE`
  ③ 断言 `issue-card.fields[6] === '用途X'` 且 `fields.length === 9`
- **预期**：② 打印 `evidence-cols: 3/3 length 9 => ok`；③ 第 7 列（索引 6）值随定义层改变
- **判据**：副本内 `PROBE` exit 0 且 stdout 含 `=> ok`；**若仍打印旧值 `用途`** → exit 1（说明第二份字面存在）
- **红绿证据**：红 = 把三列抄成字面（SB-TC-23 的形态）→ 副本内改 `evidence.fields` 后 `issue-card.fields` 不变，探针 `fail`；绿 = 派生展开，跟随
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-02`
- **不覆盖**：派生实现是展开还是 `map`（只判外部可观察的「跟随」）；`checks` 侧是否有第二份字面（SB-TC-10 管）

### SB-TC-03 `check-quotes` 绿态：首行格式在位、`K ≥ 2`（脚本自己判）、exit 0

- **覆盖**：spec §11.4-2 / §11.2.2 口径 3–4 / §11.5 第 2 行（绿态基线）；PRD §4 V6
- **前置**：施工第 1 步已落 1 份真实观察记录（spec §11.1 R4），含 ≥2 条 `items[].evidence`；`check-quotes.mjs` 存在
- **步骤**：① `QUOTES`；② 从首行取 `files` / `evidence` 两个数；③ 与磁盘实数比对：`(Get-ChildItem docs\superpowers\reviews -Recurse -Filter 'observation-*.json').Count` 与「该批文件里带 `evidence` 键的 `items` 总数」
- **预期**：① exit 0；② 首行形如 `check-quotes: files <N> / evidence <K> / bad 0 => ok`，`N ≥ 1`、`K ≥ 2`、`bad 0`；③ 行内 `N` = 磁盘 json 文件数（下限比对，允许脚本按自己的发现口径少算 `.md`，见 SB-TC-29），`K` = 实数
- **判据**：`QUOTES` exit 0 且首行**同时**满足三个正则 `^check-quotes: files \d+ / evidence \d+ / bad 0 => ok$`、`evidence (\d+)` 取数 ≥ 2、`files (\d+)` 取数 ≥ 1。**`K ≥ 2` 是脚本自己的判据**（spec §11.2.2 口径 3），不是本用例的期望值——`K < 2` 时脚本必须 exit 1 并打印 `语料 <K> 条（需 ≥2，fail-closed）`，那种情形由 SB-TC-18 / SB-TC-39 判
- **红绿证据**：红 = 现状无该脚本（`node tools/docgen/check-quotes.mjs` → `MODULE_NOT_FOUND`，exit ≠ 0）；且现存唯一语料件 `docs/superpowers/reviews/2026-10-27-1200-migration-drill/observation-r3.json` 的 3 条 `items` **全无 `evidence` 键**（`observation-r3.json:5-7`）→ 即便脚本落地，未先造记录时 `K = 0`；绿 = 首行格式如上、`K ≥ 2`
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-03`
- **不覆盖**：语料条目本身是否被 ⑥ 段认（SB-TC-04）；`K = 0` / `K = 1` 的红态（SB-TC-18 / SB-TC-39）

### SB-TC-04 语料件按三步落盘：进程目录生成 json+md 一对 → 过 ⑥ 段自校验 → 整对归档并 `git add`

- **覆盖**：spec §11.2.2「语料件三步」/ §11.5 第 3 行 / §11.1 R4 / §11.2.8 D-d；PRD §4 V6、§8 S-B 行
- **前置**：语料件最终在 `docs/superpowers/reviews/2026-11-03-<次名>/observation-r1.json` **与其同名 `.md` 成对**；与 8 类账本**同层**（`tools/observation-check/gate-scan.mjs` 的 `ALLOWED_FILE_RE`）。**不是「只落一个 json」**——⑥ 段要求 json 与 md 成对且渲染一致，归档目录对写入器只读（议会第 1 轮 BE 的 B-03）
- **步骤**：
  ① **进程目录生成**：在 `.session/reviews/<次名>/`（`tools/observation-check/artifact.mjs` 的 `PROCESS_DIR_RE` 只认这个过程目录）用 `tools/observation-check/` 的写入器产出 `observation-r1.json` + 同名 `.md` 一对；
  ② **自校验**（⑥ 段四道）：`verdict` 合法（否则 `UnknownVerdict` / `MissingReason`）、`hit` 必带 `evidence`（否则 `MissingEvidence`）、`coverage` 三段对账（`read + skipped = total`）、json 与 md 渲染一致（否则 `RenderMismatch`）；
  ③ **整对归档**：把 json + md **这一对**整移到 `docs/superpowers/reviews/2026-11-03-<次名>/` 并 `git add`（直接写归档目录会抛 `ArtifactPathOutside`）；
  ④ `OBS <该 json>`（单件校验）；
  ⑤ `git ls-files -- <json> <同名 md>`（**数行数**：两件都必须在索引里，未跟踪的那件不会出现）；
  ⑥ `CHECK`，取 ⑥ 段输出行，查有无 `ArtifactMissing` / `UnclassifiedArtifact` / `UntrackedArtifact` / `ArtifactDirty` / `MdMissing` / `RenderMismatch` / `JsonNotFound` 七个码
- **预期**：① 进程目录里 json 与 md 各 1 个、同名；② 四道全过、无报码；③ 归档目录里也是这一对、两件都 `git ls-files` 命中；④ exit 0；⑥ 七个码命中数均 = 0
- **判据**（全部用 `COUNT` 形态，或落成 `node --test` 里的 `assert.equal($c, 0)`）：
  - ①`$c = (Get-ChildItem .session\reviews\<次名> -Filter 'observation-r1.*').Count; if ($c -ne 2) { Write-Host 'pair $c'; exit 1 }`
  - ⑤ `$c = (git ls-files -- <json> <md> | Measure-Object -Line).Lines; if ($c -ne 2) { Write-Host 'tracked $c'; exit 1 }`——**步骤 ⑤ 与判据 ⑤ 现在同一条命令**：都用 `git ls-files --`（**不带 `--error-unmatch`**）+ 数行数 ≠ 2 即红。旧的写法一边用 `--error-unmatch`（未跟踪即非 0 退出）、一边数行数，两种失败形态不一致；统一为「行数 ≠ 2」单一判据
  - ④ `OBS` exit 0（这条**是**真退出码，可以直接用）
  - ⑥ 七码命中数各 0（`COUNT` 形态；**不依赖 `CHECK` 的 exit 0**——⑥ 段绿不代表语料被认，得直查码名）
- **红绿证据**：红 = 语料件只落 `.session/`（不进 git → `UntrackedArtifact`）；红 = 只移 json 不移 md → `MdMissing`；红 = md 是手写而非渲染器产出 → `RenderMismatch`；红 = 直接往归档目录写 → `ArtifactPathOutside`；红 = 与 8 类文件混放 → `UnclassifiedArtifact`；绿 = 三步齐全 + 七码 0
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-04`
- **不覆盖**：`checkEvidence` 的七道解析本身（归 `tools/observation-check/evidence.test.mjs` 既有覆盖，本段只复用）；`coverage` 三段的口径（归 ⑥ 段 `tools/observation-check/checks.mjs`）

### SB-TC-05 卡面形态（§11.4-3 ②）：`逐项点名` 0 命中 + 4 符号名各 ≥1 + 本席组 ID 在位

- **覆盖**：spec §11.4-3 ② / §11.5 第 4 行 / §11.2.3 改造表（**只判卡面形态三件**，段首 / 语义句的锚全部交 SB-TC-31）；PRD §4 V8 / §3 Q6
- **前置**：模板 **5 个槽**的**值**已改指针、**4 行文案**（`templates/boundary.md.tpl`）：`{{ALLOW_GROUPS}}`（命令白名单）/ `{{DENY_GROUPS}}`（禁止命令）/ `{{ENV_FORMS}}`（env 形态）/ `{{FORBIDDEN_PATHS}}`（禁写路径）/ `{{DETECTION_PATHS}}`（检测盲区）；**槽集仍 12 个、`SLOTS` 顺序不动**。**槽号口径两种，别混**：spec 用 **1-based** 序数（`ALLOW_GROUPS`=7 / `DENY_GROUPS`=8 / `ENV_FORMS`=9 / `FORBIDDEN_PATHS`=10 / `DETECTION_PATHS`=11）；测试里的槽索引解构用 **0-based**（`e[6]` / `e[7]` / `e[8]` / `e[9]` / `e[10]`）。**`DENY_GROUPS` 与 `ENV_FORMS` 同处模板第 11 行**，只改前者就会漏掉 env 槽 → 见 SB-TC-41。15 卡已重生成
- **步骤**：
  ① `SCANQ`（`COUNT` 形态，必须 = 0）；
  ② 对 2 卡（`reviewer-audit` / `detective-observer`）逐卡取边界段（`^## 边界$` 下一行到下一个 `^## ` 前），断言 4 符号名**各 ≥1**，且每次出现都被一对反引号包住（逐个 `contains('`' + sym + '`')` 判，不靠整段正则）；
  ③ 断言「本席组 ID 在位」——**只对那 2 卡**（只有它们有「命令默认拒绝」句；其余 13 席走 `DEFAULT_BOUNDARY`、`senior-sdet` 走 `SDET_BOUNDARY`，无该句）：取 `SEAT_POLICY[<席>].allowGroups`，该卡的命令白名单句必须出现**每个组 ID**（现各 3 个）；若某席 `allowGroups = []`，该句必须写「无组 = 无白名单命令」语义、**不得列任何具体命令**
- **预期**：① = `0`；② 2 卡 × 4 符号名 = 8 处命中，缺一即红；③ 判定面 = 那 2 卡，各组 ID 全部在位（空组态写「无白名单命令」）
- **判据**（三条都落成 `node --test` 断言，`assert.equal` / `assert.ok`）：
  - ① `assert.equal(<SCANQ 计数>, 0)` — **不写「命令 exit 0」**（`Select-String` 恒 exit 0，那是恒真判据；议会第 1 轮 AI 的 Q-5）
  - ② 打印 `sym 8/8` 并 `assert.equal(<缺符号名次数>, 0)`
  - ③ 打印 `groupIds 2/2` 并 `assert.equal(<缺组次数>, 0)`——**席数是 2 不是 15**（写 15 会金态恒红，详见 SB-TC-40）
- **红绿证据**：红 = 现状 2 卡各有 1 行含「逐项点名」（`agents/reviewer-audit.md:96`、`agents/detective-observer.md:78` 同段位置）→ `SCANQ = 2`；红 = 只删段不指针化 → ② 缺符号名；红 = 命令白名单句只写「本席策略 `commandGroups`」而**不含本席组 ID** → ③ 缺组（RD 的 Q-②-1，由 SB-TC-40 专测）；红（**按 15 席判**）= 13 席 + `senior-sdet` 根本没有该句 → 恒红
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-05`
- **不覆盖**：模板侧纯度（§11.4-3 ①，归 SB-TC-13）；段首 / 语义句的 12 组锚（**统一归 SB-TC-31**，本节不再重复数一遍——议会第 1 轮 QA 的 Q-T-04）；段内每个反引号项是否属清单类（SB-TC-27 / 28）；边界段字符和降幅（spec §11.3 观测项、不设红点，见 §5）

### SB-TC-06 15 卡重生成后 `gate` exit 0、与 `$BASE` 比 15 files changed、15 份 evidence 哈希对齐

- **覆盖**：spec §11.4-6 / §11.2.7 第 1–4 步 / §11.1 R11；PRD §4 V4；（变更面口径纠自议会第 1 轮 BE 的 B-01 / AI 的 Q-1）
- **前置**：**动模板之前**已执行 `BASE = git rev-parse HEAD` 并记入当次账本；`GATE` 改前为绿；模板 + 渲染器改完并 `generate`；15 份 `fixtures/<席>.evidence.json` 已同批重生成
- **步骤**：① `GATE`；② `git diff --stat $BASE -- agents/`；③ `git diff --name-only $BASE -- agents/`；④ 逐席比 `fixtures/<席>.evidence.json` 的 `renderSha256` 与盘上 `agents/<席>.md` 的 SHA256（`SHA15` 取盘上值）
- **预期**：① exit 0，15 席 `disk == render`；② 统计行 **`15 files changed`**；③ 15 个路径全在（含 `reviewer-audit` / `detective-observer` 与其余 13 席）；④ 15/15 席 `renderSha256 == 盘上哈希`
- **判据**（全部落成 `node --test` 断言）：
  - ① `GATE` exit 0（真退出码）
  - ② `assert.equal(<从 --stat 末行解析出的文件数>, 15)` — **不依赖 `git diff --stat` 的进程退出码**
  - ③ `assert.equal(<name-only 行数>, 15)`
  - ④ `assert.equal(<哈希不等的席数>, 0)`
  - **基准必须是 `$BASE`（改前提交哈希），不得写裸 `git diff --stat -- agents/`**（spec §11.4-6：提交前后数字不同，不可复算）
- **红绿证据**：红 = 只改模板不重生成 → `GATE` `Mismatch` exit 1（`tools/docgen/cli.mjs` 的 `compareBuffers` 逐席比对）；红（判据写法错）= 按旧稿写 `2 files changed` → 金态就红（15 席都少了「关注类别：」行，这正是 B-01 / Q-1 指出的互斥）；红 = 只重生成卡、不重生成 evidence → ④ 有不等的席；绿 = exit 0 + 15 files + 15/15 哈希对齐
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-06`
- **不覆盖**：`baseline 38/38` 数值（PRD §5：同式自除恒真，不作判据）；`baseline.json` 是否更新（spec §11.2.7 第 3 步：它只装路径清单、不含哈希，**「无变化即预期」**，议会第 1 轮 BE 的 C-01）；13 席「只少一行」的变更形态（SB-TC-32）；`docs/agents/**` 投影面（本段不涉）

### SB-TC-07 `duty.categories` 单源：席文件已删该键，loader 产物逐席与 `categories[].label` `deepEqual`

- **覆盖**：spec §11.4-5 前半（**取数点 = 装配产物 `agentData[i].card`**）/ §11.2.4（注入点在 `components/seatLoader.mjs`）/ §11.1 R7；PRD §3 Q3
- **前置**：15 份 `tools/docgen/data/seats/<seat>.json` 的 `card.duty.categories` 键已删；注入已落 `seatLoader.mjs` 的装配函数（与 `duty.trigger` 同处同趟）
- **步骤**：
  ① `PROBE` 逐席读 15 份席文件，断言 `'categories' in <card.duty>` 为假 → 计数应为 0（**必须读 JSON 文件**：装配产物里该键是被注入的，读产物分不清源里有没有）；
  ② `PROBE` 从 `tools/docgen/components/agentData.mjs` 取 `agentData`，逐席用 `deepEqual(agentData[i].card.duty.categories, agentData[i].card.categories.map(c => c.label))` 比较（**同序逐字，不用引用相等**）；
  ③ 打印 `seats 15/15`、`srcHasKey 0`、`same <n>/15`
- **预期**：① 15 份文件里 `duty.categories` 命中 0；② 15/15 席 `deepEqual` 成立（含「核对」后缀原样，不做字符串变换）；③ 席数 = 15
- **判据**：`PROBE` 输出 `srcHasKey 0`、`same 15/15`、`seats 15/15`，exit 0。**必须断 `deepEqual`（逐元素逐字同序），不得降级为「长度相等」「包含」或 `===` 引用相等**（spec §11.4-5 明写按 §11.4-1 的同一理由）
- **红绿证据**：红 = 现状 `tools/docgen/data/seats/reviewer-audit.json:9-17` 的 `duty.categories` 是 7 个短名词（`卡片合规`…），而 `:41-49` 的 `categories[].label` 是 7 个带「核对」的值（`卡片合规核对`…）→ 同义不同字，逐席不等；绿 = 源里无该键且产物逐席 `deepEqual`
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-07`
- **不覆盖**：卡面是否还印该行（SB-TC-08）；拒载码（SB-TC-20）；`buildCards()` 侧的 12 键面（SB-TC-33）；S-C 的 V12 四字段斜杠串判据（spec §11.6 明写归 S-C）

### SB-TC-08 关注点单行（§11.4-8）：`关注类别：` 计数 0 且 `类别：` ≥ 15

- **覆盖**：spec §11.4-8 / §11.5 第 7 行 / §11.1 R8；PRD §3 Q3
- **前置**：`renderCard.mjs` 的 `dutyBlock` 已删该行（`tools/docgen/components/renderCard.mjs` 的 `dutyBlock` 只剩 `trigger` / `action` / `constraint`）；15 卡已重生成
- **步骤**：① `(Select-String -Path agents\*.md -Pattern '关注类别：').Count`；② `(Select-String -Path agents\*.md -Pattern '类别：').Count`；③ `GATE`
- **预期**：① = 0；② ≥ 15（每席「本席清单」上方仍有一行 `类别：`，由 `renderCard.mjs` 的 `checkTable` 生成）；③ exit 0
- **判据**（三条都落成 `node --test` 断言，**不依赖 `Select-String` 的退出码**）：
  - ① `assert.equal(<`关注类别：` 计数>, 0)`
  - ② `assert.ok(<`类别：` 计数> >= 15)`（写成 `assert.ok`，不用 `assert.equal`）
  - ③ `GATE` exit 0（真退出码）
  - **①② 必须同时断（合取）**：现状 `关注类别：` = 15、`类别：` = 30（15 行 `关注类别：` 会被 `类别：` 顺带命中）；只判 `类别：` ≥ 15 会在「`关注类别：` 没删」时假绿，只判 `关注类别：` = 0 则漏掉「`类别：` 行被一起删」——两条是 R8 的两面
- **红绿证据**：红 = 现状 15 卡各有一行 `关注类别：`（`agents/reviewer-audit.md:11` 等 15 处，实测 `关注类别：` 15 / `类别：` 30）；红（只删行不重生成）= `GATE` `Mismatch`；绿 = `0` / `15` / `GATE` exit 0
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-08`
- **不覆盖**：两行并存时的可用性判断（那是删行的理由，不是判据）；两向判据的判别力（SB-TC-37）

### SB-TC-09 `check-case-assert` 绿态：S-A 那对已签件 `ids 30 / hollow 0 / missing 0 => ok`，且 30 个 ID 形态为 `TC-\d{3}`

- **覆盖**：spec §11.4-4 / §11.2.5 口径 1·5 / §11.1 R10；PRD §4 V7（ID 形态纠自议会第 1 轮 QA 的 Q-T-05）
- **前置**：`docs/superpowers/plans/2026-11-03-s-a-data-layer.md` 与 `docs/superpowers/specs/2026-11-03-s-a-data-layer-design-testcase.md` 均存在且已签
- **步骤**：
  ① `CASE`；
  ② 从首行取 `ids` / `hollow` / `missing` 三个数；
  ③ **独立复算 ID 集合**：从 plan 里**表头含「用例」的那张表**（`| 用例 ID | 落在 Task |`）逐行取第 1 列，按 `TC-\d{3}` / `S\d+-TC-[A-Z]\d\d` 匹配后去重，得集合 A；再与 `TC-001`…`TC-030` 这 30 个字面构成的集合 B 做 `deepEqual`
  ④ 断言 A 里**没有任何两字符形态**（`TC-\d\d` 落空）：按两位正则重扫同一批单元格，唯一值个数必须 **< 30**（现状实得 4），以此证明「三位」不是可省的口径
- **预期**：① exit 0；② 首行形如 `check-case-assert: ids 30 / hollow 0 / missing 0 => ok`；③ A 与 B `deepEqual`（30 个、全三位、不重不漏）；④ 两位正则的唯一值数 = 4
- **判据**：
  - `CASE` exit 0 且首行匹配 `^check-case-assert: ids 30 / hollow 0 / missing 0 => ok$`
  - `assert.deepEqual(A, B)`（30 个 `TC-\d{3}`，**不写「ids = 30 就算过」**——那会放过「抽出 30 个但形态不对」）
  - `assert.equal(<两位正则的唯一值数>, 4)`
  - 三个数缺一不可（spec §11.2.5 口径 5 的首行就是这三段）
- **红绿证据**：红 = 现状无该脚本（`node tools/docgen/check-case-assert.mjs` → `MODULE_NOT_FOUND`）；红 = 实现按两位 `TC-\d\d` 写 → A 只有 4 个元素、`ids 4`，与 B 的 `deepEqual` 失败；绿 = `ids 30` + A ≡ B + 两位正则得 4
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-09`
- **不覆盖**：「用例」列取数实现（已定：表头含「用例」的那张表，逐行第 1 列匹配去重）；`hollow` 与 `missing` 的红态（SB-TC-21 / SB-TC-38）；断言是否切题（`residual`，spec §11.2.5「不做」）

### SB-TC-10 `FORMAT_CHECKS` 仍 3 条：第 2 条改三列 + 校验器，第 1 / 3 条逐字不动

- **覆盖**：spec §11.2.1（「只改第 2 条，第 1 / 3 条不动」）/ §11.5 第 9 行 / §11.1 R9；`tools/docgen/test/s2-card-rewrite.test.mjs` 的 `S2-TC-A06` 既有断言
- **前置**：`FORMAT_CHECKS` 第 2 条已改文案（`tools/docgen/card-model/vocab/card-contract.mjs` 的 `FORMAT_CHECKS` 常量）
- **步骤**：① `PROBE` 取 `FORMAT_CHECKS`；② 判 `length === 3`；③ 逐条判 `/废卡/.test(x) && /[缺空]/.test(x)`；④ 判第 2 条（索引 1）含三个证据列名（取值由 `evidence.fields` 派生，不另写字面）且含 `check-quotes`；⑤ 判第 1 条与第 3 条**逐字等于改前字面**（`问题卡缺任一必填字段 = 废卡，不得只给结论。` / `建议解法栏缺内容或空 = 废卡，须给可执行一条。`）
- **预期**：① 3 条非空；② 每条的「废卡」「缺 / 空」两面都在；④ 第 2 条含 `原文摘句` / `文件 + 行号` / `用途` 与 `check-quotes`；⑤ 第 1 / 3 条与改前字面**逐字相同**（改文案时顺手改了它们即红）
- **判据**：`PROBE` 输出 `format-checks 3`、`binary 3/3`、`second 1/1`、`untouched 2/2`，exit 0；任一项不足 → exit 1
- **红绿证据**：红 = 第 2 条仍是 `证据栏为空 = 废卡，须写文件:行号或命令输出首行。`（单列口径，不提三列与校验器）；红（越权改文案）= 顺手把第 1 / 3 条也改成三列口径 → `untouched 0/2`；绿 = 三条齐、二值判齐、第 2 条指三列 + 校验器、第 1 / 3 条逐字未动
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-10`
- **不覆盖**：`S4-TC-D01` 的无指针断言是否被新文案误撞（已定：`PROSE_PROBES.pointers` 是「词 + 后随章节号」形态，定义在 `tools/docgen/test/card-render.test.mjs` 的 `POINTER_FORM`，写校验器名不命中；但新文案**不得**写成「见 §x」「参见」「同上」——该形态由既有 `S4-TC-D01` 兜，本用例不重复判）

### SB-TC-11 全仓门禁：`npm run check` exit 0、`# fail 0`、末行通过、36 码 / 8 键不变

- **覆盖**：spec §11.4-7
- **前置**：本批改动全部落地（模板 / 渲染器 / 数据 / 已签断言 / 新脚本）
- **步骤**：① `CHECK`；② 读输出的 `# fail` 行与末行；③ `PROBE` 取 `Object.keys(CARD_MODEL_CODES).length` 与 `Object.keys(SCAN_FIELDS).length`
- **预期**：① exit 0；② 含 `# fail 0`，末行 `check 全部通过`（由 `scripts/check-all.mjs` 的收尾 `console.log` 打印）；③ `CARD_MODEL_CODES` = 36、`SCAN_FIELDS` = 8
- **判据**：`CHECK` exit 0 且输出匹配 `# fail 0` 与行尾 `check 全部通过`；`PROBE` 输出 `codes 36 keys 8`，exit 0
- **红绿证据**：红 = 新增码误入 `CARD_MODEL_CODES` → `codes 37`（spec §11.2.4 明写新码只进 `validateAgentData.mjs` 的 `EXIT` 表，见 `tools/docgen/components/validateAgentData.mjs` 的 `EXIT` 常量）；或 `SCAN_FIELDS` 被加键 → `keys 9`；绿 = 36 / 8
- **对应测试**：本用例即命令本身（不另落测试文件）
- **不覆盖**：`# tests` 不低于基线（PRD V3，属 S-C 段验收面）；各段内部规则正确性（各段自有判据）

### SB-TC-12 已签断言同批改写后仍绿（`sa-data-layer` / `policy-pure-source`）

- **覆盖**：spec §11.2.6 前两行 / §11.1 R12 / §11.8 第 4 条
- **前置**：`tools/docgen/test/sa-data-layer.test.mjs` 的 `TC-006` / `TC-025` 已按 R5 改写；`tools/docgen/test/policy-pure-source.test.mjs` 的切片锚（`逐项点名：` … `；兜底句`）与 `marks` 标记集已改
- **步骤**：① `node --test tools/docgen/test/sa-data-layer.test.mjs`；② `node --test tools/docgen/test/policy-pure-source.test.mjs`；③ `node --test tools/docgen/test/tool-tiers.test.mjs`（§11.2.6 第三行：**可能无需改**，只判「实跑为绿」）
- **预期**：三份 exit 0，`# fail 0`
- **判据**：三条 `node --test` 命令 exit 0。③ 若红 → 属「必改」（§11.2.6 末段允许），改后复跑；**不得为了整齐预防性改动**（该动作不可机判，见 §5）
- **红绿证据**：红 = 现状 `tools/docgen/test/sa-data-layer.test.mjs` 的 `TC-006` 要求含「逐项点名」的行恰 1 行、且切出 20 项 → R5 落地后必红；`tools/docgen/test/policy-pure-source.test.mjs` 的 `S6-TC-A06` 切片锚 `indexOf('逐项点名：')` 恒 -1 → 切片恒空、判据恒红；同文件的模板标记集 `marks` 含「逐项点名」→ 模板一改就红
- **对应测试**：三份既有测试文件本身（本用例即命令）
- **不覆盖**：改写后断言是否仍有判别力（SB-TC-36）；S-A spec 里「删后该段仍有 2 处命中属预期」那句的注是否「只加注不改结论」（§5 人工）

### SB-TC-13 模板纯度：`assertTemplatePure()` 不抛，4 个符号名已登记、白名单不含清单类、size 恰 12

- **覆盖**：spec §11.4-3 ① / §11.2.3「模板纯度」/ §11.2.8 D-a
- **前置**：4 符号名已登记进 `TEMPLATE_ALLOWED_LITERALS`（`tools/docgen/components/renderBoundary.mjs` 的该常量；登记后该集合 = 原 8 项 + 4 个符号名 = **12 项**）
- **步骤**：
  ① `PROBE` import `renderBoundary.mjs`，调用 `assertTemplatePure()`（默认参数 = 模板原文）；
  ② 断言 `TEMPLATE_ALLOWED_LITERALS.has(<4 符号名>)` 全为真（4 个符号名**必须**在登记表里）；
  ③ 断言**白名单里没有清单类成员**——**不调 `listClassMembers()`**（它在 `renderBoundary.mjs` 里是内部函数、未导出，议会第 1 轮 QA 的 Q-T-03）：改为**从已导出的定义层自组装清单集**再求交集——
     - 组 ID：`Object.keys(commandGroups)` / `Object.keys(forbiddenGroups)` / `Object.keys(capabilities)` / `Object.keys(pathGroups)`（分别来自 `policy/definitions/commands.mjs` / `capabilities.mjs` / `paths.mjs`，**都是 export**）
     - 多词 verb：`Object.values(commandGroups)` / `Object.values(forbiddenGroups)` 的 `verbs` 里含空白的项
     - 路径项：`Object.values(pathGroups)` 扁平化后按 `、` 再切
     - 检测盲区：`DETECTION_BLIND_SPOTS`（`paths.mjs`）每项
     - 卡面形态项：`spec / plan`
     → 该集合 ∪ 起来记作 `LIST_CLASS`，断言 `TEMPLATE_ALLOWED_LITERALS ∩ LIST_CLASS = ∅`；
  ④ 断言白名单成员数 = **12**（原 8 项 + 新登记 4 个符号名；**不是 8**——登记后 size 必然 +4，写成 8 会恒红）
- **预期**：① 不抛错；② 4/4 在位；③ 与 `LIST_CLASS` 交集 = 0；④ `size = 12`
- **判据**（`node --test` 断言）：
  - `assert.doesNotThrow(() => assertTemplatePure())`
  - `assert.equal(<缺符号名数>, 0)`（②）
  - `assert.deepEqual([...TEMPLATE_ALLOWED_LITERALS].filter(x => LIST_CLASS.has(x)), [])`（③，`LIST_CLASS` 由上面 5 类从 export 面组装）
  - `assert.equal(TEMPLATE_ALLOWED_LITERALS.size, 12)`（④）
  - **三条都必须在「登记已完成」的前置下成立**：②要求交集非空（4 符号名 ∈ 白名单）、③要求交集为空（清单类 ∉ 白名单）——两者不矛盾，因为**它们的对象是两组不同的元素**（符号名 vs 清单类成员）。旧稿把 ③ 写成「白名单 ∩ 4 符号名 = ∅」，与 ② 直接互斥，金态恒红
- **红绿证据**：红 = 新文案出现反引号项 `pathGroups` 等但未登记 → `assertTemplatePure()` 抛 `TemplateImpure`（`tools/docgen/components/renderBoundary.mjs` 的 `assertTemplatePure` 规则 2）；红 = 为了让纯度过而把某个 `pathGroups` 路径项塞进白名单 → ③ 的 `LIST_CLASS` 交集非空（且 ④ 成员数 > 12）；红（旧稿写法）= ③ 写成「白名单 ∩ 4 符号名 = ∅」→ ② 刚要求它们都在里面，③ 必然非空 → **金态恒红，用例不可用**；绿 = 不抛 + 4/4 + 交集 0 + 成员数 12
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-13`
- **不覆盖**：**对卡面渲染文本**跑 `assertTemplatePure`（已定：§11.4-3 ① 只对模板跑；卡面侧改判 `逐项点名 = 0` + 4 符号名在位 + 本席组 ID 在位，归 SB-TC-05——判渲染文本会恒抛，因为 `forbiddenPaths()` 把清单成员逐项包成反引号）；`listClassMembers()` 的内部实现（未导出，本段不碰，议会第 1 轮 QA 的 Q-T-03）；白名单里「原 8 项」的逐项字面（只判 `size = 12` 与交集，不复述那 8 项——复述即第二份真相）

### SB-TC-14 `check-quotes` 不进总门禁，且腐化风险落 `docs/after/` 一条带触发

- **覆盖**：spec §11.1 R3 / §11.7 / §11.2.2 末段（与 S-A `check-shared-refs.mjs` 同口径）
- **前置**：`tools/docgen/check-quotes.mjs` 已落；`docs/after/` 已加一条风险记录
- **步骤**：① `(Select-String -Path scripts\check-all.mjs -Pattern 'check-quotes' -AllMatches).Count`；② 读 `package.json` 的 `scripts` 键集，断言无 `check-quotes` 项；③ `(Get-ChildItem docs\after -File -Filter *.md | Select-String -Pattern 'check-quotes').Count`；④ 断言同一文件含「触发」字样与「`docs/superpowers/reviews/**/observation-*.json` 的文件数」这一触发条件
- **预期**：① = 0；② 无该项；③ ≥ 1；④ 触发条件写明（spec §11.7 的两个触发之一或全部）
- **判据**（`node --test` 断言，`COUNT` 形态）：① `assert.equal(<check-quotes 在 check-all.mjs 的命中数>, 0)`；② `assert.equal(<package.json scripts 里含该名的键数>, 0)`；③ `assert.ok(<docs/after 里命中数> >= 1)`；④ 命中的那个文件含「触发」且含 `observation-*.json`
- **红绿证据**：红 = 把 `QUOTES` 接进 `check-all.mjs` 的任一段（归档 `docs/superpowers/reviews/` 即全仓红，正是 R3 要避免的）；或 `docs/after/` 无该条 → ③ = 0；绿 = ① 0 + ② 无 + ③④ 在位
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-14`
- **不覆盖**：将来真的归档后 `QUOTES` 变红这件事（spec §11.7 明写「没有任何门禁会提示」，是已知缺口，见 §7）

### SB-TC-15 摘句改一个字（全文再无该句）→ `EvidenceQuoteMismatch` exit 1 并点名 `items[i].id`

- **覆盖**：spec §11.2.2 口径 2 / §11.5 第 2 行「摘句不在文件」；PRD §4 V6 负例（「把任一 `quote` 改一个字 → exit 1」）
- **前置**：语料注入落在仓内一个**临时次目录** `docs/superpowers/reviews/<临时次>/observation-r1.json`（`node:test` 的 `after()` 同批删除；残留会让 ⑥ 段报 `UnclassifiedArtifact` / `UntrackedArtifact`）；注入用的 `evidence` 先取自真实记录（`K` 维持 ≥ 2）
- **步骤**：① 复制一条真实 evidence 到临时件，把 `quote` 中间改一个字（改后该串在全仓任何行都不出现）；② `QUOTES`；③ 删除临时件，复跑 `QUOTES`
- **预期**：② exit 1，输出形如 `文件:items[<i>].id → EvidenceQuoteMismatch（<detail 首段>）`；③ exit 0（复原）
- **判据**：② `QUOTES` exit 1 且 stdout 同时含 `EvidenceQuoteMismatch`、临时文件名、被注入项的 `id`；③ exit 0。任一缺一 → 判失败
- **红绿证据**：红 = 只判「语料非空 + 结构齐」而不调 `checkEvidence` → 改一个字的语料仍 exit 0；绿 = 报码 + 点名文件与 id
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-15`
- **不覆盖**：`EvidenceQuoteTooShort` / `EvidenceStructuralRow`（SB-TC-30 与既有 `evidence.test.mjs`）

### SB-TC-16 摘句在文件别处存在，但引用的那行不含它 → `EvidenceQuoteMismatch` exit 1

- **覆盖**：spec §11.2.2 口径 2 / §11.5 第 2 行「行号不含摘句」；PRD §4 V6
- **前置**：同 SB-TC-15 的临时次目录
- **步骤**：① 取一条真实 evidence（`quote` 确实在源文件某行），把 `line` 改成**同一文件内相邻的真实行号**（该行不含 quote）；② `QUOTES`；③ 复原 `line` 后复跑
- **预期**：② exit 1，报 `EvidenceQuoteMismatch`；不得因「摘句在全文件里能搜到」而放行；③ exit 0
- **判据**：② exit 1 且输出含 `EvidenceQuoteMismatch` + `items[<i>].id`；③ exit 0。**判据只认「行级命中」，不认「文件级命中」**
- **红绿证据**：红 = 实现写成「`readFileSync(abs).includes(quote)`」（文件级）→ 换行号仍 exit 0；绿 = 走 `checkEvidence` 的逐行判定（`tools/observation-check/evidence.mjs` 的 `checkEvidence` 里「该行不含引用片段」那一段）
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-16`
- **不覆盖**：空白归一（`norm()`）后的相等判定（既有 `evidence.test.mjs` 已覆盖）

### SB-TC-17 `evidence.line` 越界（文件行数 + 1）→ `EvidenceLineOutOfRange` exit 1

- **覆盖**：spec §11.2.2 口径 2 / §11.5 第 2 行「行号越界」；PRD §4 V6
- **前置**：同 SB-TC-15 的临时次目录
- **步骤**：① 取一条真实 evidence，把 `line` 改为该文件行数 + 1；② `QUOTES`；③ 另造 `line = 0` 与 `line = -1` 两个形态分别跑；④ 复原
- **预期**：②③ 三个形态均 exit 1，报 `EvidenceLineOutOfRange`（`line < 1` 由 `checkEvidence` 判 `InvalidFieldType`，两者都在 `tools/observation-check/evidence.mjs` 的 `checkEvidence` 里，都不得 exit 0）；④ exit 0
- **判据**：②③ 均 exit 1，且输出含 `EvidenceLineOutOfRange` 或 `InvalidFieldType` 之一 + `items[<i>].id`；**任何一次 exit 0 → 判失败**
- **红绿证据**：红 = 取行时用 `lines[line - 1] || ''` 兜底 → 越界得到空串、`includes('')` 恒真 → exit 0（最隐蔽的假绿）；绿 = 越界报码
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-17`
- **不覆盖**：文件末尾换行造成的「末行 + 1」边界（`checkEvidence` 已剔除末尾空元素，既有测试覆盖）

### SB-TC-18 语料 `K = 0`（`items` 里 0 条 / 文件 0 个两条入口）→ exit 1，不许绿

- **覆盖**：spec §11.4-2 后半 / §11.2.2 口径 3 / §11.5 第 2 行「语料 `K = 0`」；PRD §4 V6（「语料清空 → exit 1（不是绿）」）
- **前置**：**注入面 = 全仓所有 `observation-*.json` 的 `items[].evidence` 键**。为避免污染真仓，在 `COPY` 内做：副本复制根需含 `tools/observation-check` 与 `docs/superpowers/reviews`（本段新增的复制根需求），并对副本 `git init`（`repoRoot()` 走 `git rev-parse --show-toplevel`，副本非 git 仓库会返回 `RepoRootUnresolved` 而掩盖真实原因），`QUOTES` 时 `cwd = 副本根`
- **步骤**：① 副本内删除所有 `items[].evidence` 键（文件仍在、结构仍合法）；② `QUOTES`；③ 删除副本内所有 `observation-*.json` 与 `.md` 文件（语料文件本身为 0 个）后再跑一次；④ 复原
- **预期**：②③ 均 exit 1，stdout 含 `check-quotes: 语料 0 条（需 ≥2，fail-closed）`（两个入口都得红：`items` 里 0 条 / 文件 0 个）
- **判据**：②③ `QUOTES` exit 1 且 stdout 命中 `/语料 0 条（需 ≥2，fail-closed）/`；**任一 exit 0 = 判失败**（fail-closed 是 V6 的核心）
- **红绿证据**：红 = 收集为空时直接打印 `bad 0 => ok`（「没东西可验 = 全过」是 r1 审计判 P1 的形态，spec §11.1 R2 的原话）；红（只判「文件存在」）= 文件在但 `items` 里 0 条时放行；绿 = 两个入口都 fail-closed 红
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-18`
- **不覆盖**：`K = 1` 的红态（SB-TC-39）

### SB-TC-19 卡面仍出现「逐项点名」→ V8 计数 ≥ 1 → 判据红

- **覆盖**：spec §11.4-3 ② / §11.5 第 4 行；PRD §4 V8 负例（「任一卡恢复内联清单 → 计数 ≥1 → 红」）
- **前置**：`COPY`
- **步骤**：① 副本内往 `agents/reviewer-audit.md` 的边界段插回一行含 `逐项点名` 的清单行；② 在副本内跑 `SCANQ` 的等价命令；③ 复原后复跑
- **预期**：② = `1`（判据红）；③ = `0`
- **判据**（`node --test` 断言，`COUNT` 形态）：② `assert.equal(<含「逐项点名」的行数>, 1)`；③ `assert.equal(<行数>, 0)`。**② = 0 说明判据没有判别力 → 判失败**；**不依赖 `Select-String` 的退出码**
- **红绿证据**：红 = 判据写成「含 `逐项点名` 的行数 ≤ 2」或写成「`逐项点名` 不出现」但只扫 2 卡之外的文件 → 插回一行仍绿；绿 = 恰 `0` 的严格形态
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-19`
- **不覆盖**：`GATE` 是否会同时报 `Mismatch`（会，但那是渲染一致面，不作本条的替代判据）

### SB-TC-20 席文件写非空 `duty.categories` → `DutyCategoryMisplaced` exit 1 并点席

- **覆盖**：spec §11.4-5 后半 / §11.2.4「拒载」/ §11.1 R7；PRD §3 Q3
- **前置**：`COPY`；拒载码已登记进 `validateAgentData.mjs` 的 `EXIT[1]`（未登记时 `exitCodeFor` 抛「未知错误码」，拿不到 exit 1）
- **步骤**：① 副本内往某席 `tools/docgen/data/seats/<seat>.json` 的 `card.duty` 里写回非空 `"categories": ["验收可验证性"]`；② 在副本内断言 `exitCodeFor('DutyCategoryMisplaced') === 1`；③ 在副本内以子进程 `import` 触发加载，取 `stderr` 首行；④ 复原后再跑 ②③
- **预期**：② 返回 `1`（**未登记时该函数抛「未知错误码」**，拿不到 1）；③ `stderr` 首行以 `DutyCategoryMisplaced` 开头、且点名该席；④ 复原后 ② 仍返回 1（码表不随数据变）、③ 不再抛
- **判据**（**不看进程退出码**——loader 在 import 期抛、未登记码的进程退出码同样是 1，看不出差别，议会第 1 轮 BE 的 B-05；spec §11.2.4 末段）：
  - `assert.equal(exitCodeFor('DutyCategoryMisplaced'), 1)`（未登记 → 该调用抛「未知错误码」→ 用例直接失败，这**就是**判别力所在）
  - `assert.match(<stderr 首行>, /^DutyCategoryMisplaced/)`
  - `assert.ok(<stderr 首行>.includes(<席名>))`
  - 复原态：② 仍 `1`（码表不动）、③ 不抛
- **红绿证据**：红 = 注入点直接 `card.duty.categories = labels`（不做前置检查）→ 数据里的旧值被静默覆盖，渲染逐字节相同，`GATE` 抓不到；红 = 只把码加进 loader 的 `catch` 兜底、**未登记进 `validateAgentData.mjs` 的 `EXIT[1]`** → 进程退出码仍 1（看起来对），但 `exitCodeFor` 抛「未知错误码」，本用例的 ② 直接失败；绿 = 装配前拒载 + 码已登记 + stderr 首行点码点席
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-20`
- **不覆盖**：合法态（键不存在）由 SB-TC-07 判；进程退出码本体的对照（恰恰**不作**判据，理由见上）

### SB-TC-21 用例体只剩恒真断言（**四种形态**：`true` / ` true ` / `1` / `'1'`）→ `hollow 1`、`missing 0`、exit 1

- **覆盖**：spec §11.4-4 / §11.2.5 口径 3·5 / §11.5 第 8 行（「这是 V7 的全部意义」）；PRD §4 V7 负例（token 级判据纠自议会第 1 轮 AI 的 Q-4）
- **前置**：`CASE` 可用；注入面 = testcase 的**副本文件**（`--testcase <副本>`），不动已签件
- **步骤**：① 复制 S-A testcase 到临时路径；② 把其中某一条用例体（`### TC-0xx` 起至下一个同级标题止）内的所有 `assert.*` 替换成**一种**恒真形态，**四种形态各跑一遍**（= spec §11.2.5 口径 3 的 `{true, 1, '1'}` 全集再带一个空白变体）：ⅰ `assert.ok(true)`、ⅱ `assert.ok( true )`（带空格）、ⅲ `assert.ok(1)`（数字）、ⅳ `assert.ok('1')`（**字符串 `'1'`**）；③ `CASE` 指该副本；④ 复原
- **预期**：② 四种形态下 ③ 均 exit 1，每个都报 `hollow 1` 且含该用例的 `ID` 与行号；④ 原文件复跑 exit 0（`hollow 0`）
- **判据**：
  - 四种形态各 `CASE` exit 1，输出含 `hollow 1` + `ID（<行号>）`
  - **且不得把它们算进 `missing`**（`hollow` 与 `missing` 不混算，spec §11.2.5 口径 4）：任一形态报 `missing 1` = 判失败
  - 判据是**token 级**：`assert.<方法>(<参数>)` 的参数侧 `trim()` ∈ {`true`, `1`, `'1'`} 即记 `hollow`——所以 ⅱ（带空格）、ⅲ（数字 1）、ⅳ（字符串 `'1'`）都必须红；只做字面匹配或只剥空白的实现会在 ⅲ / ⅳ 上假绿
  - ④ exit 0 且首行 `ids 30 / hollow 0 / missing 0 => ok`
- **红绿证据**：红 = 只判「用例体里出现 `assert` 字样」→ 四种形态全命中 → `hollow 0` 假绿（PRD §4 V7 的本体）；红 = 用字面匹配 `assert.ok(true)` → **ⅱ / ⅲ / ⅳ 全假绿**；红 = 判据只比较 `trim()` 后的 `true` / `1` 而**漏了带引号的 `'1'`** → **仅 ⅳ 假绿**（这就是本轮补的第 4 形态：spec 口径写的是三值集合 `{true, 1, '1'}`，漏掉字符串形态等于漏掉三分之一的绕过面）；红（混算）= 把空心算成 `missing` → 报错行说 `missing 1`，与 spec 的首行三段口径不符；绿 = 四种形态都点名在 `hollow`
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-21`
- **不覆盖**：plan 引用的 ID 在 testcase 里找不到（`missing` 的红态，归 SB-TC-38）；其它非恒真但「不切题」的断言（`residual` 抽核，spec §11.2.5「不做」）；`assert.ok(2)` 这类**真值非恒真**参数的处置（spec 只列 `{true, 1, '1'}` 三值，不扩展）

### SB-TC-22 `FORMAT_CHECKS` 变 2 条 / 变 4 条 → 既有冻结断言必红

- **覆盖**：spec §11.5 第 9 行 / §11.1 R9；`tools/docgen/test/s2-card-rewrite.test.mjs` 的 `S2-TC-A06`（钉 `FORMAT_CHECKS.length === 3`）
- **前置**：`COPY`
- **步骤**：① 副本内把 `FORMAT_CHECKS` 删到 2 条（去掉第 3 条）；② 副本内跑 `node --test tools/docgen/test/s2-card-rewrite.test.mjs`；③ 复原为 3 条后再加第 4 条（复述第 1 条文案）；④ 同命令再跑；⑤ 复原
- **预期**：②④ 均 exit 非 0（`S2-TC-A06` 的 `assert.equal(CC.FORMAT_CHECKS.length, 3)` 失败）；⑤ 复原后 exit 0
- **判据**：②④ `node --test` exit 非 0 且输出含 `S2-TC-A06`；⑤ exit 0。**②④ 任一 exit 0 → 判失败**（说明冻结断言被顺手放宽）
- **红绿证据**：红 = 改文案时把「3 条」改成「≥ 3」或删掉 `length` 断言 → 2 条 / 4 条都绿；绿 = 两种条数都红
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-22`（或直接依赖 `s2-card-rewrite.test.mjs` 的既有断言，不另建用例）
- **不覆盖**：每条文案是否仍含「废卡」「缺 / 空」（SB-TC-10）

### SB-TC-23 三列抄成字面（不派生）→ 改 `evidence.fields` 后 `issue-card` 不跟随，相等断言红

- **覆盖**：spec §11.1 R1 / §11.5 第 1 行 / §11.4-1
- **前置**：`COPY`
- **步骤**：① 副本内把 `issue-card.fields` 写成 9 项的**字面数组**（三列与 `evidence.fields` 现值逐字相同，但不是展开）；② 改 `evidence.fields` 第 3 项为 `'用途X'`；③ 跑 SB-TC-01 同形探针；④ 复原后复跑
- **预期**：③ 打印 `... => fail`，exit 1（三列不跟随）；④ 复原后 exit 0
- **判据**：③ `PROBE` exit 1 且 stdout 含 `=> fail`（三列仍是旧值 `用途`）。**③ exit 0 = 判失败**（说明断言只比「9 列」，抄写版本也能骗过）
- **红绿证据**：红（实现侧）= 抄字面的 9 项数组在未改 `evidence.fields` 时与真派生**逐字相同**，`length 9` 也成立——只有本用例的「改一处」构造能把两者分开（spec §11.5 第 1 行的原话）；绿 = 派生形态跟随
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-23`
- **不覆盖**：`evidence.checks` 是否也被抄一份（`issue-card.checks` 只有 3 条自有判句，与 `evidence.checks` 不同源，不在 D14 范围）

### SB-TC-24 **被指针化的那 4 行**内不含仓内路径形态（§11.4-9），指针非得写成路径时必红

- **覆盖**：spec §11.4-9（R6 的验收锚）/ §11.1 R6 / §11.2.8 D-a；PRD §2 D13 / §3 Q8；（判定范围收窄自侦探第 1 轮：**只判 4 行，不判整段**——「只允许写」段合法含 `docs/superpowers/reviews/<本次>/`、检测限度段含 `.session/`，判整段会金态恒红）
- **前置**：2 卡（`reviewer-audit` / `detective-observer`）已指针化；`COPY` 用于注入负例
- **取数范围（关键）**：**只取被指针化的 4 行**，按**段首句定位**（各卡逐行 `startsWith` / `contains` 判，取到就停）：
  | # | 段 | 定位锚（行首句） |
  |---|---|---|
  | Ⅰ | 禁写路径 | `**除上述落点外` |
  | Ⅱ | 命令白名单 | `**命令默认拒绝**` |
  | Ⅲ | 禁止命令 + env | `**禁止**`（**注意**：不能用 `禁止写`——那行属「禁止写」段，合法含 `skills/dev-workflow/references/gate-record.md`，混进来会金态恒红） |
  | Ⅳ | 检测盲区 | `检测限度` |
  **不取**：`**只允许写**` 段（合法含 `.session/reviews/` `/` `docs/superpowers/reviews/`）、`**禁止写**` 段（合法含 `skills/dev-workflow/references/gate-record.md`）、越界后果段、复算段前句
- **步骤**：
  ① **金态**：对 2 卡各取上述 4 行、拼成 4 行文本，统计**仓内路径形态**命中数，两种形态合起来算：ⅰ 目录前缀形态 `(tools|agents|scripts|skills|rules)/`（**不含 `docs/`**——spec §11.4-9 已把它从正择里去掉，因为「只允许写」段合法用它）；ⅱ 被反引号包住的 `*.mjs` / `*.json` 文件名形态；**只对这 4 行跑，不整卡扫、不整段扫**；
  ② **负例 A**：副本内把禁写路径槽文案改成 `禁写集合见 policy/definitions/paths.mjs`，重生成后复跑 ①；
  ③ **负例 B**：副本内改成「禁写集合见 tools/docgen/policy/definitions/paths.mjs」（带目录前缀 + 反引号），重生成后复跑 ①；
  ④ 复原后复跑 ①
- **预期**：① 命中数 = 0；② 命中 ≥ 1（无 `tools/` 前缀也命中 ⅱ 的 `.mjs` 反引号形态）；③ 命中 ≥ 1（ⅰ 与 ⅱ 都命中）；④ = 0
- **判据**（全部落成 `node --test` 断言，`COUNT` 形态，**不依赖 `Select-String` 的退出码**）：
  - ① `assert.equal(<4 行的路径形态命中数>, 0)`——**取数断言本身也要判**：`assert.equal(<取到的行数>, 4)`（少于 4 行 = 定位锚失效，判据会空转）
  - ② `assert.ok(<命中数> >= 1)`（负例 A 必须能红）
  - ③ `assert.ok(<命中数> >= 1)`（负例 B 必须能红）
  - ④ `assert.equal(<命中数>, 0)`
- **红绿证据**：红 = 指针写成 `policy/definitions/paths.mjs` → ② 命中 ⅱ（旧版只 grep `tools/docgen/policy` 时此形态**全绿**，这正是 Q-3 指出的判不动）；红 = 写成 `tools/docgen/policy/definitions/paths.mjs` → ③ 双形态命中；红（**判整段的写法**）= 把「只允许写」段与「禁止写」段也纳入 → 金态就 ≥ 1，用例恒红；绿 = 只写 4 个符号名，① = 0；**金态 ① ≥ 1 或取到的行数 ≠ 4 → 判失败**
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-24`
- **不覆盖**：符号名定义是否唯一（SB-TC-35）；`policy/**` 内容语义（spec §11.5「不测」）；「指针指向的策略源是否语义对应」（机器判不了，见 §5）；4 行之外的段是否含路径（那句法上就合法，见「取数范围」）

### SB-TC-25 只改模板不重生成 → `gate` `Mismatch` exit 1

- **覆盖**：spec §11.4-6 / §11.2.7 第 2–4 步 / §11.1 R11
- **前置**：`COPY`；副本内先取 `BASE = git rev-parse HEAD`（改模板之前）
- **步骤**：① 副本内只改 `templates/boundary.md.tpl` 的 **5 个槽值（4 行文案）**，不跑 `generate`；② `GATE`；③ `generate` 后复跑 `GATE`；④ 与 `$BASE` 比 `git diff --stat`，读文件数
- **预期**：② exit 1，首行 `Mismatch:` 点名受影响的卡；③ exit 0；④ 15 files
- **判据**：② `GATE` exit 1 且输出含 `Mismatch` 与至少一张受影响卡；③ exit 0；④ `assert.equal(<文件数>, 15)`（`COUNT` 形态）。**② exit 0 = 判失败**
- **红绿证据**：红 = 改模板不改盘上卡（`tools/docgen/cli.mjs` 的 `compareBuffers` 逐席比对）；绿 = 重生成后逐字节相等 + 15 files
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-25`
- **不覆盖**：`docs/agents/**` 投影面（属 `--readme` 面，本段不涉）；13 席「只少一行」的形态（SB-TC-32）

### SB-TC-26 `replace` 的三条红态：baseline 陈旧 → `BaselineDrift`；evidence 陈旧 → 被就地改写为 newSha；未带 `--expect-change` → `UnapprovedChange`

- **覆盖**：spec §11.2.7 第 3 步 / §11.1 R11 / §11.2.6 第 1 行口径（S-A 记 `D-c`）；（本节重写自议会第 1 轮 QA 的 Q-T-02：旧稿「evidence 陈旧 → 报 `EvidenceInvalid`」不可达——实际先发 `BaselineDrift`，且盘上 == 渲染时走幂等分支 exit 0）
- **前置**：`COPY`；副本内 `BASE` 已取；15 卡已重生成；**`state.json` 里该席的状态是 `replaced`**（Q-T-02 实测），因此正常路径必须显式带 `--expect-change`
- **步骤**（三条红态各自独立构造，互不叠加）：
  - **① baseline 陈旧**（**采用改法 A：把该路径同时追加进 `BASELINE_RULES`**）：`baseline.json` 只是**顶层路径数组**，由 `renderBaseline()` = `BASELINE_RULES`（`tools/docgen/components/baseline.mjs` 里硬编码的 23 条）+ `agentPaths()` 现算拼接，**不扫盘**（`renderBaseline` 无任何目录读取）；`collectGate()` 第一件事就是 `onDisk !== renderBaseline()` → `BaselineDrift`（在 rules 目录扫描**之前**）。因此**只新建文件是不够的**——那样两侧仍然相等，反而会被 rules 目录扫描先发 `UnregisteredHandwritten`（同 exit 2、码不同），断 `^BaselineDrift:` 必红。**正确构造（两半都要，参考既有 `tools/docgen/test/dev-workflow-counts.test.mjs` 的 `TC-C09`）**：
    ⅰ 副本内往 `tools/docgen/components/baseline.mjs` 的 `BASELINE_RULES` 数组追加一项 `'rules/zzz-drift-probe.md'`（**同时**创建该文件，否则会先发 `DanglingBaselineEntry`）；
    ⅱ **不**跑 `baseline --write`（让盘上 `baseline.json` 停留在旧版 = 缺这一项，于是 `onDisk ≠ renderBaseline()`）；
    ⅲ 跑 `REPLACE`（`cmdReplace` 内部同样走 `collectGate()`）。
    （备选 **改法 B**：不碰源码，直接把副本的 `tools/docgen/baseline.json` 删掉其中一项，使其 ≠ `renderBaseline()`；A / B 二者择一，本用例采 **A**——它是已被 `TC-C09` 验证过的构造）
  - **② evidence 陈旧 + 盘上 == 渲染**（幂等分支）：副本内只把 `fixtures/<席>.evidence.json` 的 `renderSha256` 改成旧值，盘上卡与渲染产物一致，然后 `REPLACE`；
  - **③ 正常路径但漏 `--expect-change`**：三处（卡 / baseline / evidence）都已同步，`REPLACE` 不带 `--expect-change`；
  - **④ 正例对照**：三处同步 + 带 `--expect-change` → exit 0
- **预期**：
  - ① exit **2**，`stderr` 匹配 `^BaselineDrift:`（`BaselineDrift` 归 `BASELINE_CLASS` = exit 2，见 `tools/docgen/cli.mjs` 的 `BASELINE_CLASS` 表；同款构造见既有 `tools/docgen/test/dev-workflow-counts.test.mjs` 的 `TC-C09`）；
  - ② **不走报码分支**：走「幂等恢复」，`fixtures/<席>.evidence.json` 的 `renderSha256` **被就地改写为新值**、进程 exit 0——判据是「文件被改 + exit 0」，**不是**「报错」；
  - ③ exit 非 0，输出含 **`UnapprovedChange`**；
  - ④ exit 0
- **判据**（逐条，`node --test` 断言）：
  - ① `assert.equal(<退出码>, 2)` 且 `assert.match(<stderr>, /^BaselineDrift:/m)`
  - **②** `assert.equal(<退出码>, 0)` **且** `assert.notEqual(<改后的 renderSha256>, <改前的>)`——**红态是「被就地改写」，不是「报码」**
  - ③ `assert.match(<输出>, /UnapprovedChange/)`
  - ④ `assert.equal(<退出码>, 0)`
- **红绿证据**：红（第 6 轮旧稿，三种都不可达）= ⓐ 只改 `policy/definitions/*.mjs` → `renderBaseline()` 与 `baseline.json` 仍相等（它只由 `BASELINE_RULES` + `agentPaths()` 组成），拿不到 `BaselineDrift`；ⓑ 期望 `EvidenceInvalid` 却先拿到 `BaselineDrift`（误判固化，Q-T-02）；ⓒ 期望报码却实际 exit 0（幂等分支）；红（**第 7 轮修正前的半抄**）= 只在副本新建 `rules/zzz-drift-probe.md` 而**不**追加 `BASELINE_RULES` → 两侧仍相等，rules 目录扫描先发 `UnregisteredHandwritten`（exit 2 但码不同）→ 断 `^BaselineDrift:` 恒红；绿 = ① 同时追加 `BASELINE_RULES` + 建文件、不跑 `baseline --write` → 拿到 `BaselineDrift` exit 2；② 幂等就地改写 + exit 0；③ `UnapprovedChange`；④ exit 0
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-26`
- **不覆盖**：`EvidenceInvalid` / `TargetDrift` 各自的确切触发条件（**本段不作为必达红态**——先发码是 `BaselineDrift`，`EvidenceInvalid` 只在其它前置条件组合下出现；不做事先断言，避免把顺序依赖固化成判据）；`baseline --write` 的重写逻辑（归既有 `tools/docgen/test/check-baseline.test.mjs`）

### SB-TC-27 白名单登记清单类成员（如 `agents/`）→ `ALLOWED_LITERALS:` 自检抛错

- **覆盖**：spec §11.2.3「模板纯度」后半 / `tools/docgen/components/renderBoundary.mjs` 的 `assertTemplatePure`（白名单不得含清单类成员那段循环）
- **前置**：`COPY`
- **步骤**：① 副本内把某个 `pathGroups` 成员（如 `agents/`）加进 `TEMPLATE_ALLOWED_LITERALS`；② 副本内以子进程 `import` `renderBoundary.mjs` 并调用 `assertTemplatePure()`，取退出码与 stderr；③ 复原后复跑
- **预期**：② 抛错，`code = TemplateImpure`，`fragment` 以 `ALLOWED_LITERALS:` 开头；③ 不抛
- **判据**：② 子进程 exit 非 0 且 stderr 含 `ALLOWED_LITERALS:`；③ exit 0。**② exit 0 = 判失败**
- **红绿证据**：红 = 为了让新文案过纯度而把清单成员塞进白名单（`tools/docgen/components/renderBoundary.mjs` 的 `assertTemplatePure` 里那圈 `ALLOWED_LITERALS:` 自检会判）；绿 = 白名单只登记非清单类 4 个符号名
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-27`
- **不覆盖**：`CAPABILITIES` 等档位词是否该登记（`TEMPLATE_ALLOWED_LITERALS` 现行 8 项不变，spec §11.2.8 D-c 明写档位句不指针化）

### SB-TC-28 新反引号项未登记（删掉 `commandGroups`）→ `TemplateImpure` 抛错

- **覆盖**：spec §11.2.3「模板纯度」前半 / `tools/docgen/components/renderBoundary.mjs` 的 `TEMPLATE_ALLOWED_LITERALS`（登记点）/ `assertTemplatePure` 规则 2
- **前置**：`COPY`
- **步骤**：① 副本内从 `TEMPLATE_ALLOWED_LITERALS` 删掉 `commandGroups`（模板文案里仍留着被反引号包住的 `commandGroups`）；② 子进程 `import` 后跑 `assertTemplatePure()`；③ 复原后复跑
- **预期**：② 抛 `TemplateImpure`，`fragment = commandGroups`；③ 不抛
- **判据**：② exit 非 0 且 stderr 含 `TemplateImpure` 与 `commandGroups`；③ exit 0
- **红绿证据**：红 = 新文案加了反引号项却没登记（规则 2：每个反引号项要么 ∈ 单点集合、要么已登记）；绿 = 登记后不抛
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-28`
- **不覆盖**：新增文案里 `spec` / `plan` 不加反引号这件事（§11.2.3 明写；加了会变成 span 并命中规则 2，本用例的判据形态已隐含覆盖）

### SB-TC-29 语料发现口径：只认 `observation-*.json`，`.md` 同类文件不计入

- **覆盖**：spec §11.2.2 输入（`ARTIFACT_RE = ^observation-r\d+(-[ab])?\.(json|md)$`，定义在 `tools/observation-check/gate-scan.mjs`；spec 只取 `.json`）
- **前置**：`COPY`（复制根含 `docs/superpowers/reviews` + `tools/observation-check`；`git init` 让 `repoRoot()` 可解析）
- **步骤**：① 副本内跑 `QUOTES`，记 `files N`；② 在某语料目录加一个 `observation-r9.md`（内容为普通文本，非 JSON）；③ 复跑 `QUOTES`；④ 把加进去的 `.md` 改成非法 JSON 并在同目录加 `observation-r9.json`（内容 `{}`）后复跑
- **预期**：③ exit 0 且 `files` 与 ① 相同（`.md` 不计）；④ exit 非 0（`.json` 被当语料读取，`items` 缺失应报错，不得静默跳过）
- **判据**：③ exit 0 且 `files` 数值不变；④ exit 非 0。**④ exit 0 = 判失败**（静默跳过畸形语料 = 假绿）
- **红绿证据**：红 = 用 `observation-*`（不带扩展名约束）做 glob → `.md` 被按 JSON 解析、整批崩或整批跳过；绿 = 只吃 `.json`，且畸形 json 不静默
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-29`
- **不覆盖**：`.md` 与 `.json` 成对时的 `JsonNotFound` / `orphanMd`（那是 ⑥ 段 `gate-run.mjs` 的职责，不是 `check-quotes`）

### SB-TC-30 复用既有码面：引用「纯结构行」→ `EvidenceStructuralRow`

- **覆盖**：spec §11.1 R2（「复用 `checkEvidence()`，不新写校验逻辑」——复用即既有十码全部生效）
- **前置**：临时次目录注入（同 SB-TC-15）
- **步骤**：① 造一条 `evidence`：`path` = 任一含表格的文件，`line` = 一个表格分隔行（如 `|---|---|`），`quote` 逐字取该行；② `QUOTES`
- **预期**：① exit 1；报 `EvidenceStructuralRow`（`tools/observation-check/evidence.mjs` 的 `checkEvidence` 里结构行那一段）
- **判据**：`QUOTES` exit 1 且输出含 `EvidenceStructuralRow` + `items[<i>].id`。**若报的是新造的码名或 exit 0 → 判失败**（说明校验逻辑被重写了一套）
- **红绿证据**：红 = 自己写一套「存在 + 行号 + includes」的简化判定 → 结构行放行；绿 = 走 `checkEvidence` 的十道
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-30`
- **不覆盖**：其余八码（`EvidenceNotFound` / `EvidenceSensitivePath` 等）逐条断言（既有 `tools/observation-check/evidence.test.mjs` 已覆盖，本用例只抽样证明「是同一套」）

### SB-TC-31 保留面：5 个槽（4 行文案）的段首句与语义句仍在（防「删段」退化成「指针化」）

- **覆盖**：spec §11.1 R5（「段首句与语义句保留」）/ §11.2.3「保留不动」
- **前置**：2 卡已重生成
- **步骤**：① 对 2 卡取边界段；② 断言含 `**除上述落点外，任何写文件或重定向一律禁止**`；③ 断言含 `**命令默认拒绝**` 与 `其余一律不跑`；④ 断言含 `**禁止**` 与 `任何形式的环境变量赋值`；⑤ 断言含 `检测限度` 与 `归 S5-B`；⑥ 断言「档位事实」「只允许写」「越界后果」三段仍在（`**档位事实**`、`**只允许写**`、`越界写 = 越权`）
- **预期**：2 卡 × 6 组锚 = 12 组全在位
- **判据**：探针打印 `anchors 12/12`，exit 0；任一缺失 → exit 1
- **红绿证据**：红 = 把 5 个槽（4 行文案）连同段首句一起删（读者失去「默认拒绝 / 越界即越权」的语义，spec R5 的原话）；绿 = 段首句在、清单槽改指针
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-31`
- **不覆盖**：`{{ARTIFACTS}}` 与 `{{TIER}}` / `{{CAPABILITIES}}` 的具体取值（§11.2.8 D-b / D-c 明写不指针化，SB-TC-06 的逐字节 + 本条的段锚已兜）

### SB-TC-32 变更形态：15 files 全变，但 13 席的 diff **只有一条删除行**、无其它增删

- **覆盖**：spec §11.3（卡面变更面 = 15 张）/ §11.4-6（13 席「只少一行」）/ §11.2.7 第 4 步 / §11.1 R11；（变更面口径纠自议会第 1 轮 BE 的 B-01 / AI 的 Q-1）
- **前置**：`BASE` 已在改模板前取到；已完成重生成 + 15 份 evidence 同批
- **步骤**：
  ① `git diff --name-only $BASE -- agents/` → 文件清单；
  ② `git diff --stat $BASE -- agents/` → 统计行文件数；
  ③ 逐席跑 `git diff -U0 $BASE -- agents/<席>.md`，解析该席的增删行：删行数 `d`、增行数 `a`；
  ④ 按席分两类：**2 卡**（`reviewer-audit` / `detective-observer`）允许 `a > 0`（边界段整段改写）；**其余 13 席**必须 `a === 0 && d === 1`，且被删的那一行含 `关注类别：`
- **预期**：① 15 个路径；② `15 files changed`；④ 2 卡之外 13/13 席都满足 `a = 0 / d = 1`，删的正是 `关注类别：` 行
- **判据**（`node --test` 断言，全部 `COUNT` 形态，**不依赖 `git diff` 的退出码**）：
  - `assert.equal(<name-only 行数>, 15)`
  - `assert.equal(<--stat 解析出的文件数>, 15)`
  - `assert.equal(<13 席里「a = 0 && d = 1」不成立的席数>, 0)`
  - `assert.equal(<13 席里被删行不含「关注类别：」字样的席数>, 0)`
  - **不写「13 席 SHA 与基线表逐行相同」**——那与 R8 互斥（13 席各少一行，SHA 必然变；这正是 B-01 / Q-1 的证据）
- **红绿证据**：红 = 按旧稿判「13 席 SHA 不变 + 2 files」→ 金态即红（15 席都少了一行）；红 = 指针化改动波及 `DEFAULT_BOUNDARY` / `SDET_BOUNDARY` / `evidence-reader` 自有句（其余 13 席 = 11 + 1 + 1，分工见 `tools/docgen/components/patternRegistry.mjs` 的 `boundaryBySeat`）→ 那些席 `a > 0`，第 3 条断言红；绿 = 15 files + 13/13 席只一条删除行且删的是 `关注类别：`
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-32`
- **不覆盖**：`docs/agents/**` 面（本段不涉）；基线表本身是否过期（它是 S-A 收口时落的终态快照，`docs/reports/2026-11-03-s-a-card-sha-baseline.md` 的说明段已写明取数口径 = `c01ccf3`）

### SB-TC-33 注入而非删除：loader 产物 `duty.categories` 仍在且仍是 8 键，`buildCards()` 仍 12 键

- **覆盖**：spec §11.1 R7 末句（「注入而非删除 … S-C 的 V12 四字段判据面不变」）/ §11.2.4（loader 产物仍 8 键）/ §11.6（12 键契约本段不动）
- **前置**：注入已落 `components/seatLoader.mjs`；`CARD_KEYS` 仍 12 键（`tools/docgen/components/cardPipeline.mjs` 只做 re-export，定义在 `cardKeys.mjs`）
- **步骤**：① `PROBE` 取 `agentData`（loader 产物），逐席断言 `'categories' in card.duty` 为真且 `Array.isArray(card.duty.categories)` 为真；② 逐席取 `Object.keys(agentData[i].card)` 与「`CARD_KEYS` 去掉 `seat`/`name`/`description`/`tools` 四派生键」做双向差集（**loader 层只判 8 键**）；③ `PROBE` 取 `buildCards()`，逐席取 `Object.keys(card)` 与 `CARD_KEYS` 做双向差集（**消费点判 12 键**）
- **预期**：① 15/15 真；② loader 层差集均空（8 键，注入只改 `duty` 内部、不加顶层键）；③ 消费点差集均空（12 键）
- **判据**：`PROBE` 输出 `inDuty 15/15`、`loaderKeys8 15/15`、`topKeys12 15/15`，exit 0
- **红绿证据**：红 = 直接把 `duty.categories` 从产物里删掉（「单源」最省事的实现）→ ① = 0/15，且 S-C 的 V12 四字段判据面少一个字段；红（注入写法错）= 注入时往 `card` 顶层加键 → ② 得 9 键、差集非空（同时会撞 `check-shared-refs.mjs` 的 8 键断言）；绿 = 键在 `duty` 内、两层键集各自恰等
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-33`
- **不覆盖**：V12 的斜杠串计数（归 S-C，spec §11.6）；注入值内容（SB-TC-07 / 34）

### SB-TC-34 注入值不做字符串变换：给注入加「核对」后缀 → 逐席 `deepEqual` 失败，判据红

- **覆盖**：spec §11.2.4（「`label` **逐元素逐字**（同序，含「核对」后缀，不做字符串变换——变换会造出第三种写法）」）
- **前置**：`COPY`
- **步骤**：① 副本内把注入实现改成 `labels.map(l => l + '核对')`；② 跑 SB-TC-07 的同形探针；③ 复原后复跑
- **预期**：② 逐席不等（`bad 15`），exit 1；③ `bad 0` / `same 15/15`，exit 0
- **判据**：② `PROBE` exit 1 且打印 `bad 15`；③ exit 0 且 `same 15/15`
- **红绿证据**：红 = 注入时做后缀补齐 / `replace('核对','')` 之类的「归一」→ 造出第三种写法，与 `label` 不再逐字相等；绿 = 原样赋值（`deepEqual` 过）
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-34`
- **不覆盖**：`label` 自身文案是否合理（Q3 已裁定复用，不改文案）

### SB-TC-35 4 个符号名的**定义点唯一**：`policy\definitions\*.mjs` 里 `export const <sym>` 各恰 1 行

- **覆盖**：spec §11.1 R6 后半（「符号名全仓唯一，可 grep 回查」）/ §11.2.8 D-a；（命令形态纠自议会第 1 轮 RD 的 Q-②-2 / QA 的 Q-T-01：旧稿的 `policy\*.mjs -Recurse` 在 PowerShell 5 下**参数不存在**，且路径未进 `definitions/`，金态也出不了数）
- **前置**：`pathGroups` / `commandGroups` / `forbiddenGroups` / `DETECTION_BLIND_SPOTS` 均在 `tools/docgen/policy/definitions/` 下的 `.mjs` 里定义
- **步骤**：① 对 4 个符号逐个跑 `(Select-String -Path tools\docgen\policy\definitions\*.mjs -Pattern 'export const <sym>' -AllMatches).Count`（**路径到 `definitions\` 一层，不带 `-Recurse`**）；② 逐个断言计数 = `1`
- **预期**：4 个符号各 `1` 行 `export const <sym>`（**只算定义行**：注释里、卡面里、别的 `.mjs` 里提到符号名都不计入，因为它们不匹配 `export const <sym>`）
- **判据**（`node --test` 断言，`COUNT` 形态）：
  - 逐符号 `assert.equal(<该符号的 export const 行数>, 1)`
  - 汇总打印 `defs 4/4` 并 `assert.equal(<行数 ≠ 1 的符号数>, 0)`
  - **不依赖 `Select-String` 的退出码**
- **红绿证据**：红（旧稿）= `-Path tools\docgen\policy\*.mjs -Recurse` → PowerShell 5 报「找不到与参数名称 `Recurse` 匹配的参数」（Q-②-2 / Q-T-01 实跑原文）；红（旧稿）= 去掉 `-Recurse` 仍用 `policy\*.mjs` → `pathGroups` 命中 **0**（定义在 `definitions/` 子目录）；红（旧稿）= 按裸符号名计数 → `pathGroups` 命中 **2**（1 行定义 + 1 行引用），永远拿不到「恰 1」；绿 = 4 个符号各 1 行 `export const`
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-35`
- **不覆盖**：符号名是否出现在卡面（SB-TC-05）；「注释里提到符号名」是否算违规（**不算**，本用例只认 `export const` 行）

### SB-TC-36 已签断言改写后仍有判别力：插回一行「逐项点名」→ 该测试文件必红

- **覆盖**：spec §11.2.6「改坏即绿」的边界 / §11.2.6 末段（「红才改，不许预防性改」）
- **前置**：SB-TC-12 已绿（改写后的断言可跑）；`COPY`
- **步骤**：① 副本内往 `agents/reviewer-audit.md` 的边界段插回一行含 `逐项点名` 的清单行（同时不重生成，卡与渲染不一致也无妨——本用例只跑测试文件）；② 副本内跑 `node --test tools/docgen/test/sa-data-layer.test.mjs`；③ 复原后复跑
- **预期**：② exit 非 0；③ exit 0
- **判据**：② exit 非 0 且失败用例名含 `TC-006` 或 `TC-025`；③ exit 0。**② exit 0 = 判失败**（说明改写时把断言删成「恒真」，等于改坏即绿）
- **红绿证据**：红 = 把 `TC-006` / `TC-025` 整段删掉（最省事的「改写」）→ ② 仍 exit 0；绿 = 改写为「该行不存在 + 兜底句仍在 + 策略源单份」，插回即红
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-36`
- **不覆盖**：`policy-pure-source.test.mjs` 的同类判别力（需同时改模板，构造面更大；本段以 `sa-data-layer` 两条为代表，spec §11.2.6 的「必红」两行即这两条）

### SB-TC-37 §11.4-8 两向判别力：回填 `关注类别：` → 1 红 / 少一行 `类别：` → 14 红

- **覆盖**：spec §11.4-8（两向各自的可红性）/ §11.5 第 7 行；PRD §3 Q3
- **前置**：`COPY`；副本内 15 卡已重生成（`关注类别：` = 0、`类别：` = 15 的金态）
- **步骤**：
  ① 形态 A —— 副本内往某卡的 `dutyBlock` 输出里插回一行 `关注类别：…`（或直接改该卡盘上文件加一行），跑 `(Select-String -Path agents\*.md -Pattern '关注类别：').Count`；
  ② 形态 B —— 副本内删掉某卡的 `类别：` 行（`tools/docgen/components/renderCard.mjs` 的 `checkTable` 里 `prefix` 那一段），跑 `(Select-String -Path agents\*.md -Pattern '类别：').Count`；
  ③ 复原后两向复跑
- **预期**：① 得 `1`（判据红）；② 得 `14`（判据红，`< 15`）；③ 得 `0` / `15`（金态）
- **判据**（`node --test` 断言，`COUNT` 形态，**不依赖 `Select-String` 的退出码**）：① `assert.equal(<形态 A 的计数>, 1)`、② `assert.equal(<形态 B 的计数>, 14)`、③ `assert.equal(<「关注类别：」计数>, 0)` + `assert.ok(<「类别：」计数> >= 15)`。**任一形态在金态仍「绿」→ 判失败**（说明只判了一向，或把 `≥ 15` 写成 `≥ 1`）
- **红绿证据**：红 = 实现只判「`类别：` ≥ 15」而不判 `关注类别： = 0` → 形态 A 仍绿（现状 `类别：` = 30 里混着 15 行 `关注类别：`）；红（把 `≥ 15` 写成 `≥ 1`）→ 形态 B（14 行）仍绿；绿 = 两向各自都能红
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-37`
- **不覆盖**：金态判据本身（SB-TC-08）；`GATE` 的渲染一致面（两向都能过 `gate`，正因如此才必须单列）

### SB-TC-38 plan 引用的用例 ID 在 testcase 里找不到用例体 → `missing 1`、exit 1

- **覆盖**：spec §11.2.5 口径 4（`missing` 不与 `hollow` 混算，`missing > 0` 同 exit 1）/ §11.4-4；PRD §4 V7
- **前置**：`CASE` 可用；注入面 = testcase 的**副本文件**（`--testcase <副本>`），plan 用 S-A 已签原件
- **步骤**：① 复制 S-A testcase 到临时路径；② 删掉其中一条被 plan 引用的用例体（`### TC-0xx` 起至下一个同级标题止，整段删除，`---` 分隔符保留）；③ `CASE` 指该副本；④ 复原
- **预期**：③ exit 1，输出含 `missing 1` 且含被删用例的 `ID`；④ 原文件复跑 exit 0（`ids 30 / hollow 0 / missing 0`）
- **判据**：③ exit 1 且输出含 `missing 1` + 被删的 `ID`，**且 `hollow` 仍为 0**（不得把「找不到用例体」算成「空心」）；④ exit 0 且首行 `ids 30 / hollow 0 / missing 0 => ok`。③ exit 0 = 判失败（找不到用例体 = 映射悬空，等于没验）
- **红绿证据**：红 = 只统计 `hollow`、找不到就跳过 → 删掉一条用例体仍 exit 0；红（混算）= 把它算进 `hollow` → 报错行说 `hollow 1`，与 spec 的口径 4 相悖；绿 = `missing 1` + 点名 ID，`hollow 0`
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-38`
- **不覆盖**：同一条用例在 testcase 里出现两次（specless 边界，spec 未定义，见 §7）；`hollow` 的红态（SB-TC-21）

### SB-TC-39 语料 `K = 1` → exit 1（`K ≥ 2` 是判据，不是期望值）

- **覆盖**：spec §11.4-2（「`K = 1` 或 `K = 0` → exit 1」）/ §11.2.2 口径 3 / §11.5 第 2 行「语料 `K = 1`」；PRD §4 V6
- **前置**：`COPY`（复制根含 `docs/superpowers/reviews` + `tools/observation-check`，并 `git init`）；副本内语料件已足量（`K ≥ 2`）
- **步骤**：① 副本内保留**恰 1 条** `items[].evidence`（其余文件的 `evidence` 键全部删掉，或只留含 1 条 evidence 的那份、其余语料文件删除）；② `QUOTES`；③ 副本内补回第 2 条 evidence 后复跑
- **预期**：② exit 1，stdout 含 `check-quotes: 语料 1 条（需 ≥2，fail-closed）`；③ exit 0（`K = 2`）
- **判据**：② `QUOTES` exit 1 且 stdout 命中 `/语料 1 条（需 ≥2，fail-closed）/`；③ exit 0 且首行 `evidence 2 / bad 0 => ok`。**② exit 0 = 判失败**——这正是「把 `K ≥ 2` 实现成『非空即绿』」的形态（spec §11.5 第 2 行为什么要把 `K = 1` 与 `K = 0` 分开测）
- **红绿证据**：红 = 只判 `K = 0`（「有语料就绿」）→ `K = 1` 放行；绿 = `K < 2` 一律红并打印实际条数
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-39`
- **不覆盖**：`K = 0`（SB-TC-18）；`K ≥ 2` 的绿态首行（SB-TC-03）

### SB-TC-40 命令白名单句的「本席组 ID 在位」（**只判那 2 张卡**）：非空组必含组 ID，空组必写「无白名单命令」

- **覆盖**：spec §11.4-3 ②（「本席组 ID 在位」）/ §11.2.3 命令白名单行；PRD §3 Q6；（补自议会第 1 轮 RD 的 Q-②-1；判定范围收窄自侦探第 1 轮：**只有 2 张卡有「命令默认拒绝」句**——其余 13 席走 `DEFAULT_BOUNDARY`、`senior-sdet` 走 `SDET_BOUNDARY`，两者都没有该句，所以「15 席组 ID 在位」不可达，旧稿金态恒红）
- **前置**：`COPY`；15 卡已重生成；`tools/docgen/policy/seat-policy.mjs` 的 `SEAT_POLICY` 可读。**判定对象 = `tools/docgen/components/patternRegistry.mjs` 的 `boundaryBySeat` 里走 `renderBoundary(...)` 的那 2 席**（`reviewer-audit` / `detective-observer`，两者 `allowGroups` 均非空 = `['check.local','git.read','docgen.read']`）；`senior-sdet` 走 `SDET_BOUNDARY`、其余 13 席走 `DEFAULT_BOUNDARY` → **不在判定面内**
- **步骤**：
  ① **正例基线**：只对那 2 席取卡面「**命令默认拒绝**」那一行，断言其含 `SEAT_POLICY[<席>].allowGroups` 的**每个组 ID**（现为 3 个）；断言这 2 席的 `allowGroups` **确实非空**（否则本用例空转，见判据）；
  ② **负例 A**（漏组 ID）：副本内把 `reviewer-audit` 的白名单句改成只写「本席策略 `commandGroups`」、删掉组 ID，重生成后复跑 ①；
  ③ **负例 B**（空组席仍写白名单句）：副本内把 `reviewer-audit` 的 `allowGroups` 改成 `[]`（**这是唯一的空组构造方式**——现存的空组席 `senior-sdet` 走 `SDET_BOUNDARY`、根本没有该句，改不了的），重生成后复跑 ①：此时该卡的命令白名单句必须变成「无组 = 无白名单命令」语义且**不含**任何具体命令（不出现 `npm run` / `node ` 之类命令字样）；
  ④ 复原后复跑 ①
- **预期**：① 2/2 席组 ID 全在位（各 3 个）；② 该席缺组 → 判红；③ 空组态仍列命令 → 判红；④ 回绿
- **判据**（`node --test` 断言，`COUNT` 形态）：
  - ① `assert.equal(<判定面席数>, 2)` + `assert.equal(<缺组 ID 的席数>, 0)` + `assert.equal(<空组席却含具体命令的席数>, 0)`
  - ② `assert.ok(<该席缺组数> >= 1)`
  - ③ `assert.ok(<该席命令字样命中数> >= 1)`
  - ④ `assert.equal(<缺组 ID 的席数>, 0)`
  - **不得写「15/15」**：断言席数必须是 **2**（等于 `boundaryBySeat` 里走 `renderBoundary` 的席数），写成 15 会金态恒红
- **红绿证据**：红 = 只写「只跑本席策略 `commandGroups`」而**不含本席组 ID** → ② 命中（读者无法从卡面知道本席到底是哪几组）；红 = 某席 `allowGroups = []` 却仍写白名单句 → ③ 命中（该句是事实错误，RD 的 Q-②-1 原文）；红（**旧稿的 15 席写法**）= 13 席 + `senior-sdet` 根本没有该句、也没有组 → 恒红；绿 = 2/2 席组 ID 在位 + 空组态写「无白名单命令」
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-40`
- **不覆盖**：组 ID 是否等于 `commandGroups` 的键（那是定义层一致性，归 `validatePolicy` 的 `UnknownPolicyRef`）；命令白名单的具体命令是否可跑（归 `tool-tiers.test.mjs` 的既有断言）；`DEFAULT_BOUNDARY` / `SDET_BOUNDARY` 两条简句的内容（它们没有白名单句，本段不动，见 spec §11.2.6）

### SB-TC-41 env 槽已指针化（防漏改）：边界段内 `env.assign` 具体形态项命中 = 0

- **覆盖**：spec §11.4-10 / §11.2.3「槽号口径」与改造表的「禁止命令 + env」行；PRD §3 Q6；（补自第 2 轮复核：模板第 11 行一行含 `DENY_GROUPS` + `ENV_FORMS` 两槽，只改前者时 §11.4-3 全绿——`逐项点名` = 0、4 符号名也在位，漏改 env 无人发现）
- **前置**：`tools/docgen/policy/definitions/commands.mjs` 的 `forbiddenGroups['env.assign'].verbs` 可读（现值 5 项：`export VAR=…` / `$env:VAR=…` / `set VAR=…` / `setx VAR …` / `VAR=… node …`）；15 卡已重生成；`COPY` 用于注入
- **步骤**：
  ① **正例基线（改前卡）**：取 `$BASE` 版本的 2 卡（`git show $BASE:agents/<席>.md`），逐 verb 判 `contains(verb)`，统计命中数 → 改前应为 **5**（实测：改前模板第 11 行把 `forbiddenGroups['env.assign']` 的 5 个 verb 全部展开渲染，见 `templates/boundary.md.tpl` 的 `{{ENV_FORMS}}` 槽）。**这一步必须在 `$BASE` 版本上做**——改后的卡本来就该是 0，拿改后卡做基线等于自证空转；
  ② **金态（改后）**：5 个槽值都改指针并重生成后，对盘上 2 卡复跑 ①，命中数必须 = `0`；
  ③ **负例 A（只改 `DENY_GROUPS`、`ENV_FORMS` 未动）**：`COPY` 内把 `DENY_GROUPS` 槽值改成指针句而 `ENV_FORMS` 保留原样，重生成后复跑 ① → **必须 ≥ 1**（这条就是「漏改 env 槽」的机械形态）；
  ④ **负例 B（`ENV_FORMS` 只改一半）**：副本内把 `ENV_FORMS` 的 5 个 verb 删到只剩 1 个，重生成后复跑 ① → **必须 = 1**（判据是「命中数 = 0」的等值断言，剩 1 个即红）；
  ⑤ 复原后复跑 ① → `0`
- **预期**：① = `5`（改前卡）；② = `0`（改后卡）；③ ≥ `1`；④ = `1`（≠ 0 → 红）；⑤ = `0`
- **判据**（全部落成 `node --test` 断言，`COUNT` 形态，**不依赖 `Select-String` 的退出码**）：
  - ① `assert.equal(<$BASE 版本卡命中数>, 5)`——正例基线，证明「这条判据在金态之前确实有东西可抓」（否则 = 判据本身空转）
  - ② `assert.equal(<盘上改后卡命中数>, 0)`
  - ③ `assert.ok(<漏改 env 时的命中数> >= 1)`——**漏改必须能红**；③ 若为 0，说明这条判据也抓不到漏改（= 判据无效）
  - ④ `assert.equal(<只留 1 个 verb 时的命中数>, 1)`，且 `assert.notEqual(<命中数>, 0)`
  - ⑤ `assert.equal(<复原后命中数>, 0)`
- **红绿证据**：红 = 只改 `DENY_GROUPS` 不改 `ENV_FORMS` → ③ 命中 ≥ 1，且此时 §11.4-3 的 `逐项点名` = 0、4 符号名也在位，**其它判据全绿**（这正是「漏改无人发现」的原形）；红 = `ENV_FORMS` 只删一部分 → ④ 命中 1；绿 = ② / ⑤ 均为 0
- **对应测试**：建议 `tools/docgen/test/sb-contract-layer.test.mjs::SB-TC-41`
- **不覆盖**：`forbiddenGroups` 其余组（`docgen.write` / `git.write` / `fs.write` / `network`）的逐 verb 命中——它们与 `DENY_GROUPS` 同槽，指针化后由 SB-TC-05 的符号名判据 + 本条②的「env 为 0」共同兜；env 形态项**语义**是否正确（归 `policy/**`，spec §11.5「不测」）

## 3 负例与边界

> 本节与第 2 节的负例 / 边界一一对应（**27 条**：SB-TC-15～SB-TC-41）；条数 27 ≥ 第 2 节的 **14** 条正例。

| 用例 ID | 边界/负例是什么 | 为什么容易漏 | 期望行为 |
|---|---|---|---|
| SB-TC-15 | 摘句改一个字，全仓再无该句 | 只判「语料非空 + 结构齐」看起来就够了，实际什么也没验 | exit 1 报 `EvidenceQuoteMismatch`，点名文件与 `items[i].id` |
| SB-TC-16 | 摘句在文件别处有，但引用行不含它 | 文件级 `includes` 与行级判定「看起来等价」 | exit 1 报同码；只认行级命中 |
| SB-TC-17 | `line` = 行数 + 1 / 0 / 负数 | `lines[line-1] \|\| ''` 兜底后 `includes('')` 恒真 → 静默假绿 | 三个形态都 exit 1（越界码 / 类型码） |
| SB-TC-18 | 语料 `K = 0`（`items` 里 0 条 / 文件 0 个） | 「没东西可验 = 全过」最像正常 | `语料 0 条（需 ≥2，fail-closed）` exit 1 |
| SB-TC-19 | 某卡恢复内联清单（`逐项点名` 回填） | 判据写成「≤ 2」或只扫 2 卡之外的文件都会放过 | 计数恰 `0`；插回即 `1` → 红 |
| SB-TC-20 | 席文件写回非空 `duty.categories` | 注入实现会静默覆盖；且**只看进程退出码判不出码是否登记**（未登记的码也退 1） | `exitCodeFor('DutyCategoryMisplaced') === 1`（未登记则抛「未知错误码」）+ stderr 首行以该码开头并点席 |
| SB-TC-21 | 用例体只剩恒真断言（`assert.ok(true)` / `assert.ok( true )` / `assert.ok(1)` / `assert.ok('1')`） | 映射表「有 ID 就算映到了」，空心也能 `dangling 0`；字面匹配或只剥空白时后三形态还能绕过 | 四种形态都 `hollow 1` + `missing 0` exit 1，列 `ID（行号）` |
| SB-TC-22 | `FORMAT_CHECKS` 变 2 条 / 4 条 | 改文案时顺手把 `length === 3` 放宽成「≥ 3」 | 既有 `S2-TC-A06` 必红，两种条数都不放过 |
| SB-TC-23 | 三列抄字面（未改 `evidence.fields` 时与真派生逐字相同） | 只看「9 列」被抄写版本骗过 | 改 `evidence.fields` 一处后 `issue-card` 必须跟随，否则红 |
| SB-TC-24 | 指针写成仓内路径（`policy/definitions/paths.mjs` / `tools/docgen/policy/…`）；或把判定范围放大到整段边界段 | 旧判据只 grep 一个目录字面，换成 `policy/definitions/paths.mjs` 全绿；R6 原本无判据；而判整段会撞「只允许写」段合法的 `docs/superpowers/reviews/` 与「禁止写」段合法的 `gate-record.md` → 金态恒红 | **只判 4 行**（按段首句 `除上述落点外` / `命令默认拒绝` / `**禁止**` / `检测限度` 定位，取到行数必须 = 4）内路径形态命中 = 0；两条负例都必须 ≥ 1 → 红 |
| SB-TC-25 | 只改模板不重生成 | `gate` 是唯一逐字节防线，漏跑即漂移 | `Mismatch` exit 1 点名受影响卡；重生成后 15 files |
| SB-TC-26 | baseline 陈旧 / evidence 陈旧 / 漏 `--expect-change` 三种 | 旧稿三条都够不着：`renderBaseline()` 只由 `BASELINE_RULES` + `agentPaths()` 拼、**不扫盘**，所以改 `policy/definitions/*.mjs` 或只新建文件都不让它失同步（后者还会先发 `UnregisteredHandwritten`，码不同）；盘上 == 渲染时又走幂等分支 exit 0 | ① **同时**追加 `BASELINE_RULES` + 建文件、不跑 `baseline --write` → `BaselineDrift` exit **2**；② 幂等就地改写 `renderSha256` 且 exit 0；③ `UnapprovedChange`；④ 带 `--expect-change` 才 exit 0 |
| SB-TC-27 | 白名单登记清单类成员 | 「让它先过纯度」是最自然的错误改法 | `ALLOWED_LITERALS:` 自检抛 `TemplateImpure` |
| SB-TC-28 | 新反引号项未登记 | 新文案加了反引号但忘了登记，模板纯度一跑就炸 | `TemplateImpure`，fragment = 该符号名 |
| SB-TC-29 | 语料目录混入 `observation-*.md` / 畸形 json | 用宽松 glob 会按 JSON 解析 `.md`，或静默跳过坏 json | 只吃 `.json`；畸形 json 不得静默（exit 非 0） |
| SB-TC-30 | 引用「纯结构行」 | 自写简化判定会放行表格分隔行 | `EvidenceStructuralRow`（复用既有码面） |
| SB-TC-31 | 指针化被做成「删段」 | 段首句一删，读者失去「默认拒绝 / 越界即越权」的语义 | 2 卡 × 6 组段锚 12/12 在位 |
| SB-TC-32 | 改动波及 13 席（`DEFAULT_BOUNDARY` / `SDET_BOUNDARY`）；或按旧稿判「13 席 SHA 不变 + 2 files」 | 2 卡走 `boundaryBySeat` 分支，改错位置会静默影响其余席；而「SHA 不变」与 R8 互斥，金态即红 | 15 files；13/13 席 `a = 0 && d = 1` 且删的是 `关注类别：` |
| SB-TC-33 | 为「单源」把产物里的 `duty.categories` 删掉 / 注入时往 `card` 顶层加键 | S-C 的 V12 判据面会少一个字段；加键会同时撞 8 键断言——两种都让本段全绿看不出 | 键仍在 `duty` 内（15/15）+ loader 8 键 + 消费点 12 键 |
| SB-TC-34 | 注入时做「后缀补齐 / 去核对」 | 「归一看起来更整齐」，实际造出第三种写法 | 逐席 `deepEqual` 失败即红（`bad 15`） |
| SB-TC-35 | 定义计数命令写错（`-Recurse` 不存在 / 路径未进 `definitions/` / 按裸符号名计数） | 旧稿三种写法任一种都出不了「恰 1」：参数不存在 / 命中 0 / 命中 2（定义 + 引用） | `definitions\*.mjs` 里 `export const <sym>` 各恰 1 行，4/4 |
| SB-TC-36 | 改写已签断言时整段删掉 | 「绿了就行」→ 改坏即绿，R5 是否真落地无从证明 | 插回一行即红（`TC-006` / `TC-025`） |
| SB-TC-37 | 只判 `关注类别：` 不判 `类别：`（或把 `≥ 15` 写成 `≥ 1`） | 现状 `类别：` = 30 里混着 15 行 `关注类别：`，单看正向计数会假绿 | 回填 `关注类别：` → `1` 红；少一行 `类别：` → `14` 红 |
| SB-TC-38 | plan 引用的 ID 在 testcase 里找不到用例体 | 「找不到就跳过」最自然，映射悬空却全绿；且易被混算成 `hollow` | `missing 1` + `hollow 0` exit 1，点名该 ID |
| SB-TC-39 | 语料 `K = 1` | 把 `K ≥ 2` 实现成「非空即绿」最像正常 | `语料 1 条（需 ≥2，fail-closed）` exit 1 |
| SB-TC-40 | 白名单句只写符号名、不含本席组 ID；或空组态仍列命令；或把判定面写成「15 席」 | 只有 2 张卡有「命令默认拒绝」句（其余 13 席走 `DEFAULT_BOUNDARY`、`senior-sdet` 走 `SDET_BOUNDARY`），按 15 席判会金态恒红；而符号名计数照样绿 | **只判那 2 张卡**：组 ID 全在位（各 3 个）、`判定面席数 = 2`；漏组 ID → 红；空组态仍列命令 → 红 |
| SB-TC-41 | 模板第 11 行含两槽（`DENY_GROUPS` + `ENV_FORMS`），只改前者、漏改 env 槽；或 env 槽只改一半 | 漏改后 `逐项点名` = 0、4 符号名都在位 → §11.4-3 全绿，env 形态项照旧印在卡面，**没有任何判据能发现** | 改前（`$BASE` 版）卡命中 = 5；改后卡 = 0；漏改 `ENV_FORMS` → ≥ 1（红）；只留 1 个 verb → 1（红） |

## 4 回归清单

| 如果改了 | 必须重跑 | 为什么 |
|---|---|---|
| `tools/docgen/components/outputFormats.mjs`（`issue-card` / `evidence`） | SB-TC-01、02、23、10；外加 `tools/docgen/test/card-render.test.mjs`（`S4-TC-D01`） | 六处消费同一份 `fields`：2 卡卡面第 7 段、`issue-card`、`evidence`、`S4-TC-D01` 断言、SB-TC-01 探针、SB-TC-23 的反例构造 |
| `tools/docgen/check-quotes.mjs` | SB-TC-03、15、16、17、18、29、30、**39**；外加 SB-TC-14（不得接进 `check-all.mjs`） | 校验器本身的绿态与五种红态都在它身上；接进总门禁会让归档即全仓红 |
| `docs/superpowers/reviews/**/observation-*.json` | SB-TC-03、04、18、**39**；`CHECK` 的 ⑥ 段 | 语料是**历史观察记录的产物面**，清理属正常归档动作（spec §11.7） |
| `tools/docgen/templates/boundary.md.tpl` 或 `components/renderBoundary.mjs` | SB-TC-05、13、19、24、27、28、31、25、35、**37**、**40**、**41**；外加 `tools/docgen/test/policy-pure-source.test.mjs`（切片锚 `逐项点名：` … `；兜底句` / 模板标记集 `marks` / `expanded.length === 12` / 槽索引解构）、`tools/docgen/test/tool-tiers.test.mjs`（要求卡面含全部路径项与全部 allow / forbidden verbs —— **必红**，议会第 1 轮 AU 的 A-02）、`tools/docgen/test/support/capability-baseline.mjs` 与 `tools/docgen/fixtures/capability-baseline.json`（12 槽基线，A-03） | **5 个槽（4 行文案）槽值**改指针 + 4 个新字面登记；槽集仍 12、`SLOTS` 顺序不动。**`DENY_GROUPS` 与 `ENV_FORMS` 同处模板第 11 行**，只改前者 = 漏改 env 槽，由 SB-TC-41 兜。上述三处测试**全部必红**（§11.2.6 已从「可能无需改」纠正为必红），改写口径 = 「指针句在位 + 定义层成员数不变」 |
| `agents/*.md`（15 席全部，重生成后） | SB-TC-05、06、08、19、31、32、**37**、**40**、36；外加 `tools/docgen/test/sa-data-layer.test.mjs`（`TC-006` / `TC-025`，且 `TC-028` 逐 15 席要 evidence 哈希）与 `tools/docgen/test/s2-card-rewrite.test.mjs`（`S2-TC-C09③`：`duty.categories` 影响卡面 → 改写为「`categories[].label`（`类别：` 行）影响卡面」，B-04 / Q-2 / A-01） | **15 席全变**（2 席边界段 + 15 席删「关注类别：」行，13 席只少这一行）；两条已签断言必须同批改写且改写后仍要能红 |
| `tools/docgen/card-model/vocab/card-contract.mjs` 的 `FORMAT_CHECKS` | SB-TC-10、22；外加 `tools/docgen/test/s2-card-rewrite.test.mjs`（`S2-TC-A06`） | 第 2 条改文案时，`length === 3` 与 `/废卡/ && /[缺空]/` 两面必须同时满足，且第 1 / 3 条逐字不动 |
| `tools/docgen/data/seats/*.json` 或注入实现（`duty.categories`，落 `seatLoader.mjs`） | SB-TC-07、20、33、34；外加 `tools/docgen/test/sa-data-layer.test.mjs`（12 键键集面） | 单源可判形态只有「源里无键 + 产物逐席 `deepEqual`」，其余写法都不会报错、只会显示旧值 |
| `tools/docgen/components/renderCard.mjs` 的 `dutyBlock` | SB-TC-08、**37**、06 | 删「关注类别：」行属渲染面改动，必须重生成 15 卡并过 `gate`；两向计数是它唯一的验收锚 |
| `tools/docgen/check-case-assert.mjs` | SB-TC-09、21、**38** | `ids` / `hollow` / `missing` 三段是同一首行，改一段会同时影响三条判据 |
| `scripts/check-all.mjs` / `package.json` scripts | SB-TC-11、14 | 门禁段落与脚本清单是「不进总门禁」判据的观测面 |
| `docs/reports/2026-11-03-s-a-card-sha-baseline.md`（S-A 冻结基线表） | 不再作为判据输入（SB-TC-06 / 32 已改为「15 files + 13 席只少一行」，不再比 SHA 逐行相同——那与 R8 互斥） | 该表是 S-A 收口时的**历史**快照；S-B 需要自己落一张新冻结基线（spec §11.2.7 第 1 步：15 席 SHA256 入当次账本） |
| 已签 spec `2026-11-03-s-a-data-layer-design.md`（「删后该段仍有 2 处命中属预期」那句的注）与已签 testcase（`TC-006` / `TC-025`） | SB-TC-12、36；外加 `scripts/check-gate-record.mjs`（签后增量登记的 6 列面） | 改已签件必须留有登记，且改写后断言不得变成恒真 |

## 5 只手动验证

| 项 | 为什么机器验不了 | 谁验、看什么 |
|---|---|---|
| 卡面「读者能不能顺着符号名找回策略源」（spec §11.5 明写只手动） | 可用性判断：脚本能验「符号名在位」「定义层唯一」，验不了「一个没读过策略源的读者看到 `pathGroups` 是否知道去哪找」 | 评审席：读 1 张卡的边界段，看是否给出「符号名 → 策略源」的可追路径；答否 = 记可用性问题（不判红） |
| S-A spec 里「删后该段仍有 2 处命中属预期」那句的注「不改结论，只加注」 | 「哪一行是结论」需要语义判断；`git diff` 能看改动，判不了「这行结论是否被顺手改了」 | 审计席：读 `git diff -- docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md`，确认只有新增注行、无结论句的删改 |
| 「红才改，不许预防性改动已签断言」（spec §11.2.6 末段） | 实跑为绿时，是否「仍改了」只能看 diff；「是否本会红」需要还原分支 | 审计席：对 `tool-tiers.test.mjs` 的段序断言与 ④「命令默认拒绝」段断言看 diff；有改动则须出示改前实跑的红证据 |
| 4 条清单行的字符和降幅（spec §11.3 观测项，**不设红点**） | 观测项；降幅不是判据（spec 原文「降幅不是判据」） | 施工者：逐席记「边界段字符和」与 4 条清单行字符和，写进当次账本；只记录，不判定 |
| 指针挂错槽（4 符号名齐全但语义不对应，如命令白名单槽写 `forbiddenGroups`） | 符号名存在、唯一、计数也对，所有计数型判据都绿；「槽 ↔ 语义」的对应只能读文本判断 | 评审席：对照 §11.2.3 的 4 行改造表逐槽核；挂错 = 记可用性/语义问题（不判红，另进 §7） |

## 6 不测（带理由）

| 不测什么 | 为什么 |
|---|---|
| 卡面排版美学、边界段字符数目标 | spec §11.5「不测」明写；§11.3 明写降幅是观测项、不设红点 |
| 引句 / 映射是否「切题」（`residual` 抽核） | spec §11.2.2「不做」/ §11.2.5「不做」/ §11.5「不测」：切题性归 `residual`，执行者 = 审计席，每轮抽 3 条 |
| `policy/**` 内容语义 | spec §11.5「不测」（S6 已签零改动，本段只引用符号名） |
| `checkEvidence()` 自身七道是否实现正确 | 已有 `tools/observation-check/evidence.test.mjs` 覆盖；本段只验「复用」（SB-TC-30 抽样） |
| `baseline 38/38` 是否等于 38 | PRD §5 / spec §11.4-6 备注：同一表达式自除自的常量打印，恒真，不作判据 |
| S-C 面：三态 5 行、`trigger.kind` 四值、斜杠串数组化、删人设、`HOST_TERM`、`needs` 槽 | spec §11.6 明写归 S-C；本段只在 SB-TC-33 借「四字段判据面不变」 |
| `issue-card.fields` 的**列顺序**是否最优（把证据放第 5 位是否合理） | 属 §11.2.1 的设计裁定；本段只判「顺序 = HEAD + evidence + TAIL」（SB-TC-01） |
| `R8` 两行并存时的可读性判断 | 那是删除理由，不是判据；判据是 §11.4-8 的两向计数（SB-TC-08 / 37） |

## 7 缺口与判别力水位

| 缺口 | 漏检哪类反例 | 至少 1 个样例 | 语义由谁兜 |
|---|---|---|---|
| `check-quotes` 不判「引用是否切题」 | 摘句真实但与该 `items[i]` 的判定无关 | 一条真实但答非所问的 evidence 仍 exit 0（已知缺口，spec §11.2.2「不做」） | `residual` 抽核（PRD D14 / D8） |
| `check-case-assert` 不判「断言是否切题」 | 用例体里有一条真断言但验的不是该用例声称的东西 | 把某用例的断言换成无关的 `assert.equal(1,1)` → `hollow 0`（已知缺口） | `residual` 抽核（spec §11.2.5「不做」） |
| 语料被归档后无人提示（spec §11.7） | 清理 `docs/superpowers/reviews/` 后 `QUOTES` 变红，但没有任何门禁会报 | 移走全部 `observation-*.json` 后 `CHECK` 仍绿（R3 的已知代价） | `docs/after/` 那条带触发的记录（SB-TC-14 ④） |
| 同一条用例 ID 在 testcase 里出现两次用例体 | `missing` 只判「找不到」，重复时到底验哪一个、`ids` 去重后是否会漏计，spec 未定义 | 把 `### TC-006` 整段复制一份 → `ids` 仍 30、`hollow 0`、`missing 0`，本文件 SB-TC-38 仍绿 | 待 ③ 段施工时按「首处命中」写进脚本注释（spec 未定，不在本文件立判据） |
| 指针是否指向「正确的」策略源（符号语义是否对应） | 把「命令白名单」槽指向 `forbiddenGroups`（符号存在、唯一、但在位错槽） | 卡面 4 符号名齐全却挂错槽 → 本文件 SB-TC-05 / 31 / 35 仍绿 | 评审席人工（§5 第 5 行）+ 后续 `residual` |

**判别力水位**：14 条正例全部能红（每条都给了「改坏即红」的构造）；26 条负例 / 边界全部**单分支判死**——SB-TC-18 断在 `语料 0 条（需 ≥2，fail-closed）`、SB-TC-39 断在 `语料 1 条（需 ≥2，fail-closed）`（**`K = 0` 与 `K = 1` 分开判**）、SB-TC-21 断在三种恒真形态各自的 `hollow 1`（token 级，`assert.ok( true )` / `assert.ok(1)` 都红）、SB-TC-38 断在 `missing 1`（与 `hollow` 不混算）、SB-TC-22 断在既有 `length === 3`、SB-TC-23 断在「改一处后跟随」、SB-TC-24 断在「无 `tools/` 前缀的 `.mjs` 也算路径形态」、SB-TC-26 三条红态各自断在自己的形态上（`BaselineDrift` / 幂等就地改写 / `UnapprovedChange`）、SB-TC-35 断在 `export const <sym>` 恰 1 行、SB-TC-37 两向各自可红、SB-TC-40 断在「空组席不得列命令」、SB-TC-31 / 32 / 33 / 34 各自断在单一计数上。**已无「未定口径故只能记录」的条目**。

## 已裁定（原「待澄清」，8 条已全部回填 spec §11.9）

> 每条只写「裁定结果 + 本文件跟随到哪个用例」，不复述 spec 全文。**异议 0 条**——8 条裁定在机械上均可判，无互斥。

| # | 原歧义 | 裁定结果（一句话） | 本文件跟随处 |
|---|---|---|---|
| Q1 | `assertTemplatePure` 判模板还是判卡面文本 | **只判模板**；卡面侧改判「`逐项点名` = 0 + 4 符号名各 ≥1 + 本席组 ID 在位」 | SB-TC-13（模板侧）/ SB-TC-05（卡面侧）/ SB-TC-40（组 ID） |
| Q2 | `K ≥ 2` 是判据还是期望值 | **是脚本判据**：`K < 2` → exit 1（`K = 0` / `K = 1` 同为红） | SB-TC-03（绿态）/ SB-TC-18（`K = 0`）/ **SB-TC-39（`K = 1`）** |
| Q3 | `issue-card.checks` 三条全不改 vs 第 2 条改 | **只改第 2 条**，第 1 / 3 条不动 | SB-TC-10（第 ⑤ 步「第 1 / 3 条逐字不动」） |
| Q4 | 单一来源判据用 `===` 还是结构相等 | **`deepEqual`（同序逐字）** | SB-TC-01 / SB-TC-07（取数点 = `agentData[i].card`）/ SB-TC-34 |
| Q5 | 「用例」列取数口径 + ID 找不到的处置 | **只认表头含「用例」的那张表**；**`TC-\d{3}` 三位**（不是两位）；**新增 `missing` 计数**，`> 0` 同 exit 1 | SB-TC-09（首行三段 + ID 集合 `deepEqual`）/ SB-TC-21（`hollow` 不混算）/ SB-TC-38（`missing`） |
| Q6 | `git diff --stat` 的比较基准 | **带基线**：`BASE = git rev-parse HEAD`（改前）+ **15 files** + 13 席「只有一条删除行」（§11.2.7 已改正「2 卡」口径） | SB-TC-06（15 files + 15 份 evidence）/ SB-TC-25 / SB-TC-32（13 席 diff 形态） |
| Q7 | R8（删「关注类别：」行）无验收锚 | **新增 §11.4-8**：`关注类别：` = 0 且 `类别：` ≥ 15 | SB-TC-08（正例，两向合取）/ **SB-TC-37（两向判别力）** |
| Q8 | `duty.categories` 注入点在 loader 还是 `buildOne` | **在 `components/seatLoader.mjs`**（与 `duty.trigger` 同处同趟），loader 产物仍 8 键 | SB-TC-07（取数点）/ SB-TC-33（loader 8 键 + 消费点 12 键） |

## 附：给开发的建议

> spec 已回的疑问不再重复；下表只列「按本文用例施工时会踩到、spec 未写」的点，各带触发用例与建议解法（不代裁定）。

| # | 建议 | 触发用例 | 建议解法 |
|---|---|---|---|
| A-1 | 测试支撑的复制根要扩到 `tools/observation-check` 与 `docs/superpowers/reviews`，并在副本内 `git init` | SB-TC-18、29、**39** | `withRepoCopy` 的复制根是共享件（被 S-A 用例复用），**不要直接加**；在 `sb-contract-layer.test.mjs` 内自建一次性副本（`mkdtempSync` + 复制上述根 + `git init`），spawn 时 `cwd = 副本根`，避免 `RepoRootUnresolved` 掩盖真实原因 |
| A-2 | 「插回一行」「改写一条 evidence」这类注入必须落在**临时次目录**并 `after()` 删除 | SB-TC-15、16、17、30 | 落 `docs/superpowers/reviews/<临时次>/observation-r1.json`（语料路径不可配，只能放这里），用例内 `try/finally` 清理；残留会让 ⑥ 段报 `UnclassifiedArtifact`，把 `CHECK` 连带判红 |
| A-3 | `check-quotes` 的发现口径要在脚本注释里写死「只吃 `.json`、递归深度不限」 | SB-TC-29 | 发现逻辑复用 `ARTIFACT_RE`（`tools/observation-check/gate-scan.mjs` 的该常量）并额外判扩展名 `.json`；畸形 json 抛错而非跳过（跳过高概率假绿） |
| A-4 | 拒绝「行号兜底」写法 | SB-TC-17 | 取行直接用 `lines[line - 1]`，不要写成「取不到就给空串」；越界交给 `checkEvidence` 报 `EvidenceLineOutOfRange` |
| A-5 | 现已签的两条断言改写后要保留「可红」形态 | SB-TC-36 | `TC-006` 改写为「含 `逐项点名` 的行数 = 0 + 兜底句仍在」；`TC-025` 改写为「两卡 `lessons/` 命中数由策略源派生」；**不要整段删除** |
| A-6 | `DutyCategoryMisplaced` 的 exit 归 1 必须登记进 `EXIT` 的 exit 1 那一档 | SB-TC-20 | 照 S-A 四码的登记法（`tools/docgen/components/validateAgentData.mjs` 的 `EXIT` 常量同一段），不得进 `CARD_MODEL_CODES`（36 码不动） |
| A-7 | `check-quotes` 的 `K < 2` 红态要打印**实际条数**，不要只打印固定串 | SB-TC-18、39 | 按 spec §11.2.2 口径 3 的格式 `check-quotes: 语料 <K> 条（需 ≥2，fail-closed）`（`K` 取实数），两条用例的判据都锚在这个 `<K>` 上 |
| A-8 | `check-case-assert` 的 `missing` 与 `hollow` 要各自记账，报错行要能区分 | SB-TC-21、38 | 首行固定三段 `ids <N> / hollow <K> / missing <M> => ok`；失败时逐条列 `ID（行号或 missing）`，**同一 ID 只记一处**（先判 `missing`，找到用例体后才判 `hollow`）；ID 正则是 **`TC-\d{3}`（三位）** |
| A-9 | 纯计数判据一律落成 `node --test` 断言，不挂「命令 exit 0」 | SB-TC-05、08、09、24、32、35、37、40（全表通用，见 §0 `COUNT`） | `assert.equal($c, 0)` / `assert.ok($c >= N)`；`Select-String` / `git diff` / `git ls-files` 的退出码恒 0，不能当判据（spec §11.4 头 + AU 的 A-04 / AI 的 Q-5） |
| 卡 A-10 | 卡面变更面按 **15 席**重生成、**15 份** `fixtures/<席>.evidence.json` 同批 | SB-TC-06、32 | 只重生成 2 卡会让 13 席的「关注类别：」行残留 → `关注类别：` 计数 ≠ 0，§11.4-8 直接红；只更新 2 份 evidence → `TC-028` 逐 15 席红 |
| 卡 A-11 | 模板侧只改 **5 个槽的值（4 行文案）**：`ALLOW_GROUPS` / `DENY_GROUPS` / `ENV_FORMS` / `FORBIDDEN_PATHS` / `DETECTION_PATHS`；不删槽、不动 `SLOTS` 顺序 | SB-TC-05、13、31、40、**41** | 换「删槽」路线要同改 `SLOTS` 与 `validatePolicy` 的槽齐全校验，`S6-TC-C06` 的 12 槽断言直接红（议会第 1 轮 BE 的 B-02）。**模板第 11 行一行含 `DENY_GROUPS` + `ENV_FORMS` 两槽** → 是 5 个槽 / 4 行，不是 4 个槽；只改 `DENY_GROUPS` 会让 env 形态项照旧印在卡面，由 SB-TC-41 兜 |
| 卡 A-12 | 语料件必须 json + md 成对，且经 `writeObservation` 产出（不要手写 md） | SB-TC-04 | 手写 md 与 json 的渲染结果不一致 → `RenderMismatch`；只移 json → `MdMissing`；直接写归档目录 → `ArtifactPathOutside` |

## 自检（轮次 8 实跑，仓根 PowerShell 5）

| # | 检查项 | 做法（现数，可复算） | 结果 |
|---|---|---|---|
| 1 | 用例总数 / 正例 / 负例 / 边界 | `(Select-String -Path <本文件> -Pattern '^### SB-TC-' -AllMatches).Count` → `41`（ID 连续 01–41，`Group-Object` 重号数 = `0`）；§1 按「类型」列逐行计数：正例 `14`（SB-TC-01～14）、负例 `19`（SB-TC-15～28 + 37 / 38 / 39 / 40 / 41）、边界 `8`（SB-TC-29～36） | 41 = 14 + 19 + 8 ✅（本轮**未增删用例**，只收窄 24 / 40 的判定范围，并同步修 05 ③） |
| 2 | 负例 + 边界 ≥ 正例 | `19 + 8 = 27 ≥ 14` | 成立 ✅（余量 13） |
| 3 | 覆盖总表每行都指回 spec 节号或 PRD V 编号 | `^\| SB-TC-\d+ \|.*\| (正例\|负例\|边界) \|` → `41` 行，其中不含 `§` 的 `0` 行 | 不指回 0 行 ✅ |
| 4 | 每条五要素齐（覆盖 / 前置 / 步骤 / 预期 / 判据） | `^- \*\*(覆盖\|前置\|步骤\|预期\|判据)\*\*` 各计数 → `41 / 41 / 41 / 41 / 41`；另带 `红绿证据` / `对应测试` / `不覆盖` | 缺项 0 条 ✅ |
| 5 | 文件里有没有替 spec 做设计 | 全文只描述「判什么、怎么判」；「附：给开发的建议」的建议解法栏属记录，非代改；「已裁定」8 行只写裁定结果 + 跟随处 | 越界 0 处 ✅（未改 spec / plan / 代码） |

**本轮（第 8 轮：两处「金态恒红」）改了什么**

| # | 用例 | 旧稿的问题（侦探第 1 轮成立） | 改法 |
|---|---|---|---|
| 1 | **SB-TC-24** | 判定范围 = **整段边界段**：而「只允许写」段合法含 `docs/superpowers/reviews/<本次>/`、`.session/reviews/<本次>/`，「禁止写」段合法含 `skills/dev-workflow/references/gate-record.md` → 金态就 ≥ 1，用例恒红 | 取数范围收窄到**被指针化的那 4 行**（段首句 `除上述落点外` / `命令默认拒绝` / `**禁止**` / `检测限度` 定位；**特别注明不能用 `禁止写` 当锚**）；正择去掉 `docs/`（spec §11.4-9 已改）；判据加「取到行数 = 4」（防定位锚失效后空转）；两条路径负例保留 |
| 2 | **SB-TC-40** | 判定面写「15 席组 ID 在位」：只有 2 张卡有「命令默认拒绝」句，其余 13 席走 `DEFAULT_BOUNDARY`、`senior-sdet` 走 `SDET_BOUNDARY`（都没有该句）→ 不可达，恒红 | 判定面改成**那 2 张卡**（`boundaryBySeat` 里走 `renderBoundary` 的 2 席，`allowGroups` 均非空）；判据加 `assert.equal(<判定面席数>, 2)` 且明确「不得写 15/15」；空组负例改为「副本内把某卡的 `allowGroups` 改成 `[]`」（现存空组席没有该句，改不了它） |
| 3 | **SB-TC-05 ③**（同一判据面，顺带同步） | 同样写「对每席 / `groupIds 15/15`」——与 SB-TC-40 是同一金态恒红 | 收窄到那 2 卡、判据改 `groupIds 2/2`，并注明「写 15 会恒红，详见 SB-TC-40」 |

**异议**：**0 条**。

**前一轮（第 6 轮）改了什么（摘要，详情已在用例正文）**：① SB-TC-13 ③ 交集对象改为**自组装 `LIST_CLASS`**（旧稿写「∩ 4 符号名 = ∅」与 ② 互斥、金态恒红）、④ `size === 8` → **`12`**；② SB-TC-26 ① 从「改 `policy/definitions/*.mjs`」改为 baseline 失同步构造（**第 7 轮又把这一条修准**，见上表）；③ SB-TC-21 恒真形态从 3 种扩到 **4 种**，补 `assert.ok('1')`。

**本轮（第 5 轮：补 `ENV_FORMS` 漏改面 + 统一 SB-TC-04 命令）改了什么**

| # | 改的位置 | 改法 |
|---|---|---|
| 1 | SB-TC-05 前置 | 「4 个槽」→「**5 个槽 + 4 行文案**」，列全 `ALLOW_GROUPS` / `DENY_GROUPS` / `ENV_FORMS` / `FORBIDDEN_PATHS` / `DETECTION_PATHS`；并注明**槽号两种口径**（spec 1-based 7/8/9/10/11；测试槽索引 0-based `e[6]`…`e[10]`），点明 `DENY_GROUPS` 与 `ENV_FORMS` 同处模板第 11 行 |
| 2 | SB-TC-25 步骤① / SB-TC-31 标题与红绿证据 / §4 回归清单 / A-11 | 各处「4 个槽 / 4 槽」→「5 个槽（4 行文案）」，A-11 补列 5 个槽名与「漏改 env 由 SB-TC-41 兜」 |
| 3 | **SB-TC-41（新增）** | 覆盖 §11.4-10：改前卡（`$BASE` 版）`env.assign` 形态项命中 = 5（正例基线）；改后 = 0（金态）；漏改 `ENV_FORMS` → ≥ 1（负例，必须是红）；只留 1 个 verb → 1（负例） |
| 4 | SB-TC-04 步骤⑤ / 判据⑤ | 统一成**一条**命令：`git ls-files -- <json> <md>` + **行数 ≠ 2 即红**；去掉步骤里的 `--error-unmatch`（旧写法一边「非 0 退出」一边「数行数」，失败形态不一致） |
| 5 | §1 覆盖总表 / §3 表 / 覆盖核对 | 补 SB-TC-41 行（集成 / 负例 / 指回 §11.4-10）；§3 改 **27 条**；§11.4 改「十条」，新增「10 → SB-TC-41」；R5 补 41 |

**异议**：**0 条**。本轮 4 项要求都写得出可跑形态。

**本轮（第 4 轮，议会第 1 轮 5 席必须修项）改了什么**

| 卡号 | 改动的用例 | 改法 |
|---|---|---|
| Q-T-01 / Q-②-2（P0） | 35 | 命令改 `(Select-String -Path tools\docgen\policy\definitions\*.mjs -Pattern 'export const <sym>' -AllMatches).Count`（去 `-Recurse`、进 `definitions\`），判据 = 每符号恰 1 行定义；注释 / 引用不计入 |
| 卡 Q-T-04 | 05 / 31 | 05 删掉 8 个段锚与 `anchors 4/4`，只留「`逐项点名` = 0 + 4 符号名各 ≥1 + 本席组 ID 在位」；段首 / 语义句的锚**全部**交 SB-TC-31，统一 `anchors 12/12` |
| 卡 Q-T-05 | 09 | ID 形态改 `TC-\d{3}`；加「抽取集合 `deepEqual` 30 个 `TC-\d{3}`」+「两位正则只得 4 个」的反证 |
| 卡 Q-T-03 | 13 ③ | 不再调 `listClassMembers()`（未导出），改「`TEMPLATE_ALLOWED_LITERALS` ∩ 4 符号名 = 空集」+ 成员数 = 8 → **第 6 轮已再修**：交集对象改为**自组装 `LIST_CLASS`**、成员数改 **12**（理由见第 6 轮表） |
| 卡 B-05 | 20 | 判据改 `exitCodeFor('DutyCategoryMisplaced') === 1`（未登记抛「未知错误码」）+ stderr 首行以该码开头；**不看进程退出码** |
| 卡 Q-T-02 | 26 | 拆三条红态：① `BaselineDrift`；② evidence 陈旧走幂等分支「被就地改写为 newSha 且 exit 0」；③ 漏 `--expect-change` → `UnapprovedChange`；④ 带 `--expect-change` 才 exit 0 |
| B-01 / Q-1（P0） | 06 / 25 / 32 | 变更面从「2 卡」改「**15 files changed**」；13 席改判「`git diff -U0` 只有一条删除行、无其它增删」；06 加「15 份 `fixtures/<席>.evidence.json` 同批」；**删掉「13 席 SHA 与基线表逐行相同」**（与 R8 互斥） |
| 卡 B-03 | 04 | 语料件改三步（`.session/` 用写入器生成 json+md 一对 → 过 ⑥ 段四道 → 整对移入 `docs/superpowers/reviews/<次>/` 并 `git add`）；码清单补 `MdMissing` / `RenderMismatch` / `JsonNotFound` |
| Q-4 | 21 | hollow 判据改 token 级（参数 `trim()` ∈ {`true`,`1`,`'1'`}）；补 `assert.ok( true )` 与 `assert.ok(1)` 两条注入 |
| Q-3 | 24 | 改覆盖 spec **新增的 §11.4-9**（边界段内仓内路径形态命中 = 0），保留「写成 `policy/definitions/paths.mjs` 必红」的负例并新增「带 `tools/` 前缀」第二负例 |
| A-04 / Q-5 | 全表 + §0 | 新增 `COUNT` 约定；05 / 08 / 09 / 24 / 32 / 35 / 37 / 40 的纯计数判据全改 `node --test` 断言，不挂「命令 exit 0」 |
| 卡 A-05 | §0 | `PROBE` 改「落进 `sb-contract-layer.test.mjs` 用 `node --test --test-name-pattern` 单跑」，**禁 `node -e`** |
| Q-②-1（RD） | **40（新增）** | 补「本席组 ID 在位」用例：非空组席漏组 ID 红、空组席（`senior-sdet`）列命令红 |
| B-04 / Q-2 / A-01 | §4 回归清单 | `s2-card-rewrite.test.mjs` 的 `S2-TC-C09③` 补进「必红」；`tool-tiers.test.mjs` 从「可能无需改」改「必红」；`capability-baseline.mjs` + `fixtures/capability-baseline.json` 的 12 槽基线补进清单 |
| 计数 | §1 / §3 / §4 / §7 / 附 / 本表 | §3 由 25 改 26 条；§7 判别力水位重写；附加 A-9…A-12 |

**本席必答（`senior-sdet` 一定会 1–5）**

| # | 条目 | 判定 | reason | evidence |
|---|---|---|---|---|
| 1 | 立场不偏 + 结论依据 ≥2 条各带 `path:line`、来自 ≥2 文件 | hit | 结论「三列必须派生」「指针化不是删段」「`categories` 单源可判形态」「卡面变更面是 15 席」「恒真断言要按 token 判」分别落在 5 个不同文件上 | `tools/docgen/components/outputFormats.mjs`（`issue-card` 段 7 列字面）；`tools/docgen/components/renderBoundary.mjs`（`assertTemplatePure` / `TEMPLATE_ALLOWED_LITERALS`）；`tools/docgen/test/sa-data-layer.test.mjs`（`TC-006` / `TC-025` / `TC-028`）；`tools/docgen/components/renderCard.mjs`（`checkTable` 的 `prefix` / `dutyBlock`）；`tools/docgen/test/s2-card-rewrite.test.mjs`（`S2-TC-C09③`） |
| 2 | 结论附可复算证据（`path:line` 存在且该行含被引摘句） | hit | 引用的每处均已读原文并核对含摘句（如 `outputFormats.mjs` 的 `issue-card` 段含 `'证据', '严重级别', '建议解法'`；`renderCard.mjs` 的 `dutyBlock` 含 `关注类别：`；`seat-policy.mjs` 的 `senior-sdet` 项 `allowGroups: []`） | 同上；另 `tools/observation-check/evidence.mjs`（`checkEvidence` 含 `不含引用片段`）、`tools/observation-check/gate-scan.mjs`（`ARTIFACT_RE` 常量）、`tools/docgen/components/validateAgentData.mjs`（`EXIT` 常量） |
| 3 | 非专业读者能听懂（英文术语首现行含中文解释） | hit | 首现行均已带解释：`PROBE`（落进 `node --test` 的断言）、`COUNT`（纯计数的可判形态）、`COPY`（仓副本注入）、`BASE`（改前提交哈希）、`fail-closed`（语料不足也判红）、`hollow`（用例体里只剩恒真断言）、`missing`（找不到用例体）、`deepEqual`（同序逐字的结构相等）、`residual`（机械判不了、只能抽核的残余项，spec §11.2.2 已给中文释义）、`幂等分支`（盘上 == 渲染时就地补写哈希并 exit 0） | 本文件 §0 判据约定 + 各用例「前置」栏 |
| 4 | 无问题时显式写「全过、无问题」 | na | findings 集合**不为空**（附 12 条给开发的建议 + 5 条 §5 人工项），故本条不适用；非「漏写」 | 「附」A-1～A-12；§5 5 行 |
| 5 | 附录无问题时显式写「全过、无问题」 | na | 同上：附录「附：给开发的建议」有 12 条，非空集 | 「附」A-1～A-12 |

**异议**：**0 条**。议会第 1 轮的 5 张必须修卡（Q-T-01…05 与 RD 的 Q-②-2）以及被并入的 B-01 / B-03 / B-04 / B-05 / Q-1…Q-5 / A-01…A-05，逐条落地时都写得出可跑形态，无「机械上做不到」的条目。
