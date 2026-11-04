# S-D 旁路审计：PRD §4.2 两条判据逐条取证（2026-11-04）

> **判者标识** = `reviewer-audit@agents/reviewer-audit.md（角色卡贴入，独立实例）`，2026-11-04；本席未参与 S-D 的 ① / ② 申报，未参与 S-C 任何段落。
> **声明**（角色卡「边界 / 禁止 2」要求）：本件是上级指派的**唯一**写入产物；本席未写 `gate-record.md`、未写 `progress.md`、未改任何仓内其它文件（签字原文由申报人转录，本席只核转录逐字一致）。
> **审计对象**：S-D 批（S-C 残账收口 + 死代码清理）能否走 PRD §4.2 旁路。
> **口径**：判据只认命令退出码与计数；每条结论后附本席自跑命令的可复算输出。英文术语首现行附中文解释。

## 0 核对项与证据速览

| # | 核对项 | 结果 | 证据（本席自跑） |
|---|---|---|---|
| 1 | 判据一：F 集合差集为空 | hit（成立） | `git diff -U0 -- <两份 PRD>` 输出 0 行、exit 0；两侧计数 24 / 0 |
| 2 | 判据二：无 spec 增量 | hit（成立） | 白名单 23 件中 `spec` 新增 0（`docs/superpowers/specs/2026-10-27-s3-gate-wiring-design.md` 为 M，非 A） |
| 3 | 判据二：无 testcase 增量 | hit（成立） | 白名单内 testcase 类新增 0；`tools/docgen/test/sc-card-shape.test.mjs` 为 M |
| 4 | 判据二：无载体增量（规则 / 技能 / 角色卡 / 新脚本） | hit（成立） | `scripts/test-skip-allowlist.mjs` 与 `skills/managing-lessons-store/scripts/lessons.test.mjs` 均为 M（`git cat-file -e HEAD:<path>` → 存在）；新脚本 0、新规则 0、`agents/**` 0 改动 |
| 5 | 判据二：搬迁 11 件是否「同内容换路径」 | na（本轮不能当场机械证） | 目标目录 `docs/reports/2026-11-04-s-c-card-shape-evidence/` 尚未建（`Test-Path` → False）；本席先按下表 §2.2 冻结 11 个 blob 指纹（git 按文件内容算出的指纹），交 ④ / ⑤ 比对 |
| 6 | 变更清单是否覆盖全部变更面 | miss（未覆盖 1 件） | 本件 `docs/reports/2026-11-04-s-d-bypass-audit.md` 不在 plan §3 白名单 → 见 §4 R1 |
| 7 | 审计时点全仓门禁实况（不作 ①② 判据，只记基线） | hit（实跑记录） | `npm run check` → `# tests 1541 / # pass 1535 / # fail 1 / # skipped 5`、末行 `check 未通过`（exit 1）；红因 = plan `:105` 自身引用的裸名 `test.mjs` → 见 §4 R6 |

## 1 ① 旁路判据一：F 集合差集

**命令（仓根 PowerShell 5，2026-11-04）**

```powershell
git log --oneline -1
git status --porcelain
git diff -U0 -- docs/prd/20261024073606-dev-workflow-mainline/index.md docs/prd/20261102212627-card-data-contract-and-proof/index.md
Select-String -Path docs\prd\20261024073606-dev-workflow-mainline\index.md -Pattern '^\| F-\d+'
Select-String -Path docs\prd\20261102212627-card-data-contract-and-proof\index.md -Pattern '^\| F-\d+'
```

**实际输出（首行 / 计数）**

- `git log --oneline -1` → `36d8e01 fix(s-c): ⑤ 段落点并入既有白名单件（SC-TC-62 回绿）+ 门行 D10/D11 口径同步`
- `git status --porcelain` → 3 行（`A docs/handoffs/2026-11-04-next-batch-kickoff.md`、`M tools/docgen/test/sc-card-shape.test.mjs`、`?? docs/superpowers/plans/2026-11-04-s-d-residuals-and-dead-code.md`）——**无一行落在 `docs/prd/`**
- `git diff -U0 -- <两份 PRD>` → 输出 **0 行**、`diff_exit=0`（`-U0` = 不输出上下文行，故空输出即「无改动」）
- 第一份 PRD 的 `^\| F-\d+` → **48 行 / 去重 24 个 ID**（`F-01`…`F-24`；48 = §10 表 24 行 + 路线图表 24 行，同一 ID 在两表各出现一次）
- 第二份 PRD 的 `^\| F-\d+` → **0 行**；`^## 10` → **0**；全文 `F-\d\d` 命中 → **0**（该 PRD 无 §10、无 F 编号，见 `skills/dev-workflow/references/gate-record.md:87` 的换载体登记）

**两侧计数与差集**

| 侧 | 文件 | F 行数 | F 唯一 ID 数 | 与 HEAD 版本差集 |
|---|---|---|---|---|
| 左 | `docs/prd/20261024073606-dev-workflow-mainline/index.md` | 48（工作树）/ 48（HEAD） | 24 / 24 | 新增 0 / 消失 0 |
| 右 | `docs/prd/20261102212627-card-data-contract-and-proof/index.md` | 0（工作树）/ 0（HEAD） | 0 / 0 | 新增 0 / 消失 0 |

**结论（判据一）**：**成立**。两份 PRD 的 `git diff -U0` 输出为空（exit 0），工作树 `F` 集合与 HEAD 版本双向差集为 `0 / 0`；集合未变，符合 PRD §4.2 `:319`「功能点集合不变」。

## 2 ② 旁路判据二：不新增交付物

**判据文本**（`docs/prd/20261024073606-dev-workflow-mainline/index.md:320`）：不新增 spec / testcase / 载体文件；改既有文件的错字、措辞、注释、依赖升级属允许列；**新增脚本、新增规则、新增角色卡都不算**（即三者出现即违规）。

### 2.1 变更清单（声明面 = plan §3 白名单 23 件 + 本席产物 1 件）

| # | 路径 | 变更 | 判定 | 理由 |
|---|---|---|---|---|
| 1 | `docs/handoffs/2026-11-04-next-batch-kickoff.md` | A | 纯流程文档（交接词） | 非 spec / 非 testcase / 非载体；内容归属 `⑤@S-C` 收口（`gate-record.md:106` 残余），非 S-D 新增设计 |
| 2 | `tools/docgen/test/sc-card-shape.test.mjs` | M | 改既有测试文件 | T1 改窗口常量、T2 改两条用例的 skip 分支；用例块不增（白名单按名核），非新增 testcase |
| 3 | `scripts/test-skip-allowlist.mjs` | M | 改既有脚本 | `git cat-file -e HEAD:<path>` → 存在；只增 2 条名单项，非「新增脚本」 |
| 4 | `docs/superpowers/specs/2026-10-27-s3-gate-wiring-design.md` | M | 改既有 spec 的计数句 | 「现 2 条」→ 实况值；非新增 spec；属「改已签件正文」，见 §4 R2 |
| 5 | `docs/reports/2026-11-04-s-c-card-shape-evidence/README.md` | A | 纯流程文档（迁移映射表） | 非三类；先例同款：`2026-11-01-s2-card-comprehension-baseline-evidence/README.md`（`c015673` 迁移批所建） |
| 6–16 | `docs/reports/2026-11-04-s-c-card-shape-evidence/{quality,parliament}/*.md`（11 件） | A（搬迁） | 同内容换路径 | 源 11 件在 `.session/reviews/` 两目录（实测 5 + 6 件），内容不重写；机械判据见 §2.2 |
| 17 | `skills/dev-workflow/references/gate-record.md` | M | 改既有（门行载体） | 只改路径字符串 + 落门行，结论与判断逐字保留 |
| 18 | `docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md` | M | 改既有 | G6 行移入 §5.1（已闭合）+ 增卡点闭合一行 |
| 19 | `docs/superpowers/plans/2026-11-04-s-d-residuals-and-dead-code.md` | A | 纯流程文档（plan） | 旁路本身要求 plan 白名单（§4.2 `:328`），plan 不属三类 |
| 20 | `skills/managing-lessons-store/scripts/lessons.test.mjs` | M | 改既有测试 | `HEAD:` 存在；`STRUCT_REPLACED` 增 2 条（行号豁免登记），非新增 testcase |
| 21 | `docs/after/20261024174253-dev-workflow-mainline-open-items.md` | M | 改既有 | 线 G 两行「做完即删条」整行移出 |
| 22 | `tools/docgen/components/renderAgent.mjs` | D | 删除 | 整文件删除，非新增 |
| 23 | `tools/docgen/components/sharedBlocks.mjs` | D | 删除 | 整文件删除，非新增 |
| 24 | `docs/reports/2026-11-04-s-d-bypass-audit.md` | A | 纯流程文档（审计记录） | 由 PRD §4.2 `:333` 强制产生的审计证据，非三类；**未进 plan §3 白名单** → §4 R1 |

### 2.2 搬迁 11 件的基线 blob 指纹（`git hash-object`，交 ④ / ⑤ 逐件比对）

| # | 源路径（`.session/` 内） | 字节 | blob 指纹（前 12 位） |
|---|---|---|---|
| 1 | `2026-11-04-1328-s-c-quality/delivery-5-audit.md` | 52374 | `579cf61ce25b` |
| 2 | `2026-11-04-1328-s-c-quality/delivery-5-claim.md` | 9112 | `79c47f2df042` |
| 3 | `2026-11-04-1328-s-c-quality/progress.md` | 10631 | `1197464e61e6` |
| 4 | `2026-11-04-1328-s-c-quality/quality-4-audit.md` | 38788 | `6eb2b928a6d5` |
| 5 | `2026-11-04-1328-s-c-quality/quality-4.md` | 56528 | `a0016c10d85f` |
| 6 | `2026-11-04-0840-sc-card-shape-spec-parliament/cards.md` | 5479 | `e75314f82b22` |
| 7 | `2026-11-04-0840-sc-card-shape-spec-parliament/detective-round1.md` | 3434 | `3bca12dce08f` |
| 8 | `2026-11-04-0840-sc-card-shape-spec-parliament/impact-sheet.md` | 7751 | `2a8b17322cd9` |
| 9 | `2026-11-04-0840-sc-card-shape-spec-parliament/problems.md` | 7324 | `f81a3a2c055f` |
| 10 | `2026-11-04-0840-sc-card-shape-spec-parliament/progress.md` | 5814 | `5beb96e629f3` |
| 11 | `2026-11-04-0840-sc-card-shape-spec-parliament/submission.md` | 7720 | `871a75557b23` |

### 2.3 计数（按变更类型）

| 类型 | 件数 | 构成 |
|---|---|---|
| A（新增） | 14 | 11 件搬迁 + 3 件纯流程文档（交接词 / 迁移 README / plan）；**白名单外另 1 件**（本审计记录） |
| M（改既有） | 7 | 测试 ×2、脚本 ×1、spec ×1、门行 ×1、`docs/after` ×2 |
| D（删除） | 2 | 两个死代码 `.mjs` |
| 新增 spec | 0 | —— |
| 新增 testcase | 0 | —— |
| 新增载体（规则 / 技能 / 角色卡 / 新脚本） | 0 | —— |

### 2.4 结论（判据二）

**成立**。白名单 23 件 + 本席产物 1 件中：新增 spec **0**、新增 testcase **0**、新增载体（规则 / 技能 / 角色卡 / 新脚本）**0**；新增件全部属「搬迁 11 件」或「纯流程文档 3 + 1 件」，均不属 `:320` 点名的三类。搬迁 11 件的「同内容」以 §2.2 指纹为机械判据，待迁移后由 ④ / ⑤ 复算（见 §4 R3）。

## 3 结论

**旁路成立**（PRD §4.2 两条判据同时满足：F 集合双向差集 `0 / 0` 且 `git diff -U0` 空输出；无 spec / testcase / 载体增量）。

**依据（≥2 条，均带 `path:line`，取自 3 个不同文件）**

1. `docs/prd/20261024073606-dev-workflow-mainline/index.md:319`——「功能点集合不变：§10 的 `F-xx` 集合 diff 为空」；本席实测两侧 24 / 0、工作树与 HEAD 双向差集 0 / 0。
2. `docs/prd/20261024073606-dev-workflow-mainline/index.md:333`——「核了什么」必须写两样（F 集合差集结论 + 变更清单），缺任一项 = 旁路无效；本件 §1、§2 各给一份。
3. `docs/superpowers/plans/2026-11-04-s-d-residuals-and-dead-code.md:43`——plan 自证「无 spec、无 testcase、无脚本、无规则、无角色卡新增」；本席按其 §3 白名单（`:136-148`）逐件复核成立。
4. `skills/dev-workflow/references/gate-record.md:106`（`⑤@S-C` 行）——证据账迁移与 G6 两件均由该行结论列残余指派「下一批开工」，本批属**已签定执行项**，非新需求。

**本席未裁决技术分歧**（如 `SC-TC-62` 闭区间改法、`t.skip` 语义、死代码删除范围）——按角色卡边界只记过程标准核对结论。

## 4 残余风险（可能让旁路在 ④ / ⑤ 被判无效）

| # | 风险 | 触发 | 建议处置 |
|---|---|---|---|
| R1 | 本审计记录不在 plan §3 白名单（`plan:136-148` 23 行无此件，`Select-String 'bypass-audit'` 命中 0） | ②→③ 计划门核「变更范围在 plan 白名单内」（§4.2 `:328`） | plan §3 增第 24 行登记本件；或在 ② 行「核了什么」写明「白名单外 1 件 = §4.2 `:333` 强制产物」 |
| R2 | 已签 spec 的「现 2 条」有**两处**（`docs/superpowers/specs/2026-10-27-s3-gate-wiring-design.md:51` 的 R9 行、`:132` 的 §11.2 末段），plan T2 只声明改「§11.2 末段」 | T2 落地后计数口径两处不一致（`SKIP_ALLOWLIST` 实测现 5 条、改后 7 条） | 同批改两处；或 ② 行登记 `:51` 为「未纳入本批的旧值」（R8 口径回扫同款） |
| R3 | 11 件搬迁「同内容」本轮无法当场证（目标目录未建，`Test-Path` → False） | ④ / ⑤ 复算发现任一指纹 ≠ §2.2 基线 | 迁移后逐件 `git hash-object` 比对；不等即视为改写已签证据 → ⑤ 判不过 |
| R4 | 3 件「纯流程文档」新增（交接词 / 迁移 README / plan）在严格读法下可被判「新增交付物」 | ④ / ⑤ 采「除三类外一律不许新增文件」的严格读法 | ② 行写明分类依据：`:320` 括号内只把「新增脚本 / 新增规则 / 新增角色卡」列为不算，三者实测均为 0；三类（spec / testcase / 载体）实测 0 |
| R5 | 交接词件（第 1 行，A）内容属 `⑤@S-C` 收口残余，却被计入本批白名单 | ⑤ 对账时与本批交付物重复计数 | ② 行注明「`:1` 归属 S-C 收口，本批只落库不新增设计」 |
| R6 | 审计时点全仓门禁已红：`# fail 1`（`# pass 1535`）。红因 = `docs/superpowers/plans/2026-11-04-s-d-residuals-and-dead-code.md:105` 正文自身引用了 7 处不带目录的裸文件名引用（`test.mjs` + 行号），撞「行号引用必须找得到目标文件」守卫（`skills/managing-lessons-store/scripts/lessons.test.mjs` 的用例「守卫：文档里的「<名>.mjs 第 N 行」引用，行号必须仍有效」，重放 → `有 1 处行号引用找不到目标文件…docs\superpowers\plans\… → test.mjs`）；**与 ⑤@S-C 首轮 P1 同类**（同一条守卫、同一种裸名写法） | ③ 段判据 `npm run check` 绿（§4.2 `:329`「同左（不变）」） | T3 落地时同批把 plan `:105` 的裸名改全路径（plan 在白名单内，属改既有）；判据 = 该守卫单文件 `# fail 0` 且全仓 `# fail 0`。**本件已自查**：初稿同款写法被本守卫抓到 1 处，已改为 `tools/docgen/test/sc-card-shape.test.mjs:<N>` 全路径；复跑后守卫报出的文件只剩 plan |

**无问题时显式声明**：§0 七项中除第 5 项（`na`：本轮不可当场机械证，理由见 R3）与第 6 项（`miss`：本件未入白名单，理由见 R1）外，其余 5 项全过、无问题（第 7 项为实跑基线记录，其红因归 R6，不改变 §3 结论）。
