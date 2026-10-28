# S3 门禁接入（gate wiring）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> 状态：**已过计划门（2026-10-28，`gate-record.md` `②→③@S3` 行，签字人 = 审计）**——签字后改动共 2 处（本状态行 + `### 签行` 的六列模板改为指向门行的指针），零判据级，原签判据不变（增量登记见门行结论列）。

**Goal:** 把 S2 已交付的四段校验链接进 `npm run check`——新增 ⑥ 观察产物门禁（归档三态 + 反向清单 + git 断言 + 过程侧四段）、迁移状态机判据、`CHECK_BYPASS` 总旁路、F-24 15 卡豁免窗口登记件与静默 skip 守卫，使 spec §11.10 八锚点全部可机器验收。

**Architecture:** 三处新增（`tools/observation-check/gate-run.mjs` 接线 + `tools/observation-check/card-exempt.mjs` 窗口登记 + `scripts/test-skip-allowlist.mjs` skip 名单单源）+ `scripts/check-all.mjs` 两处接线（顶部 bypass 首行 / ② 段 skip 守卫 / ⑤ 之后 ⑥ 段）+ 两个常驻测试文件 + 收尾 14 条验收命令。S2 纯函数与 166 条测试**一字不动**（spec R1），S3 只做「列文件 → 调纯函数 → 报码」。

**Tech Stack:** Node.js ≥ 22（`node:test` / `node:assert/strict` / `node:fs` / `node:child_process`）、PowerShell（仓库侧命令）、无第三方依赖。

**Spec:** `docs/superpowers/specs/2026-10-27-s3-gate-wiring-design.md`（244 行，SHA256 `E4A28FEF48EE564AA27C872436598C5AB249F8A321FAAE71F2A6FD7E359F26BD`，已签 `②@S3`）

**Testcase:** `docs/superpowers/specs/2026-10-27-s3-gate-wiring-design-testcase.md`（1198 行，SHA256 `0330839FF0C970E43B2DFBC0DF81C2E570A18368B985AAAD4A5A02752C313D25`，**55 条 = 正 13 / 负 24 / 边界 18**，H01–H55）

## Global Constraints

以下每一条对**每个任务**隐含生效（值逐字取自 spec §11.1 R1–R9 与 §11.4）：

1. **S2 一字不改**（R1）：`tools/observation-check/` 的既有模块与 12 个测试文件（166 条）不动；S3 只新增 `gate-run.mjs` / `card-exempt.mjs` 与两个测试文件。D1（根层散文件）/ D2（孤立 md）两条判定载体 = `gate-run`（`spec:43` / `spec:193`）。
2. **扫描根唯一**（R2）：`runObservationGate()` **无参数**、不加 CLI 参数、不加环境变量、不支持多根；根由 `repoRoot()` 派生（`tools/observation-check/evidence.mjs:40-52`，进程内缓存）。
3. **过程目录口径**（R3）：`.session/reviews/**` 只做四段校验（仅根层 `observation-r*.json`），不做三态 / 成对 / git；过程根不存在 → 0 对、不报码。
4. **三态与反向清单只调 S2 纯函数**（R4）：`scanReviewDir(dirName, files)`（`gate-scan.mjs:20`）；根层分支**不调**它、**不套** `ALLOWED_FILE_RE`。
5. **git 判据**（R5）：两条断言 `git ls-files --error-unmatch -- <path>` / `git diff --quiet -- <path>` + 一条前置探测 `git rev-parse --is-inside-work-tree`，均带 `cwd = repoRoot()` 与 `timeout: 30000`。
6. **旁路只一条总开关**（R6）：`CHECK_BYPASS=1`（原因取 `CHECK_BYPASS_REASON`），首行 `BYPASS: <原因>`，只跳 ⑥ 段。
7. **F-24 只交窗口登记件**（R7）：`EXEMPT_CARDS` / `EXPIRY_EVENT` / `EXPIRY_LANDED` / `disposeCardFindings` + `check` 状态行；不校验 `agents/*.md` 内容。
8. **不新增错误码**（R8）：只用 `RepoRootUnresolved` / `ArtifactNamingOff` / `UntrackedArtifact` / `ArtifactDirty` / `ArtifactMissing` / `UnclassifiedArtifact` + S2 四段码原样透传。新增码 = 先回 PRD 登记，本批不做。
9. **不做 git 写**（§11.4）：不执行 move / `git add` / `commit`；迁移四步只是流程义务，本 plan 不在真仓做迁移演练。
10. **仓门禁不红**：每个任务收尾 `npm run check` exit 0；基线（**2026-10-28 08:03 实跑，含本 plan 已落盘**）= `# tests 902 / # pass 900 / # fail 0 / # skipped 2`、`baseline 37/37`、`④ markdown 检查通过（300 个文件 / 1279 张表）`、末行 `check 全部通过`（07:47 本 plan 落盘前读数为 `299 个文件 / 1262 张表`，差值 = 本 plan 1 个 md / 17 张表）。
11. **R8 回扫只认裸命令**：`node scripts/scope-sweep.mjs --check` → exit 0（`sweep ok`）；**禁用** `npm run doc:sweep -- --check`（PowerShell + npm 10.9 吞 `--` 后参数，恒假绿）。
12. **夹具一律自建**：临时根 = `mkdtempSync(join(os.tmpdir(), 's3-gate-'))`，`finally` 里 `rmSync`；**不引用 `agents/` 或仓内业务文件当夹具**（唯一例外 = H41 的验收半段，那是判据来源而非夹具）。
13. **验收类不落 `*.test.mjs`**（§11.5 末行 `spec:174` / Q11 `spec:210`）：H37–H40、H45–H52 共 12 条 + H01③ / H41② 两个验收半段 = Task 10 命令清单；**不钉 `# tests` 增量**。
14. **命令写法**：一律 Powershell、cwd = 仓根；glob 一律加引号（`node --test "tools/observation-check/*.test.mjs"`）。

## 文件结构

| 路径 | 动作 | 职责 |
|---|---|---|
| `tools/observation-check/card-exempt.mjs` | **新建** | `EXEMPT_CARDS`（15 项）/ `EXPIRY_EVENT` / `EXPIRY_LANDED` / `disposeCardFindings`（纯函数，无 IO） |
| `tools/observation-check/gate-run.mjs` | **新建** | `runObservationGate()`（无参，不 print）+ `formatGateLine(res)`（纯函数，唯一文案来源） |
| `scripts/test-skip-allowlist.mjs` | **新建** | `SKIP_ALLOWLIST`（2 条用例名，skip 守卫单源） |
| `scripts/check-all.mjs` | **改** | 顶部 bypass 首行（`scripts/check-all.mjs:43` 后）+ ② 段 skip 守卫（`scripts/check-all.mjs:95` 后）+ ⑥ 段（`scripts/check-all.mjs:366` 与 `:368` 之间） |
| `tools/observation-check/card-exempt.test.mjs` | **新建** | H41（常驻半段）/ H42 / H43 / H44 |
| `tools/observation-check/gate-run.test.mjs` | **新建** | H01①②、H02–H36、H53、H54、H55 |
| plan 收尾命令清单（Task 10） | 不落文件 | H37–H40、H45–H52 + H01③ / H41② |

> 引用口径：`scripts/check-all.mjs:NN` 一律指该文件的行号（插入点见 Task 9）；**本文件自身的行号不写进正文**（不设 `plan:NN` 前缀），凡需指向本 plan 内部一律写「Task N / 附录 A」。

## 接口小节（公开面）

```js
// tools/observation-check/gate-run.mjs —— 判据面 2 个导出（spec §11.2 :75）
runObservationGate() → { scannedDirs: number, archivePairs: number, processPairs: number,
                         findings: [{ code: string, path: string, message: string }] }
formatGateLine(res) → string    // findings 非空 → 每条一行 \n 连接；空 → 计数行（零产物分支加行尾后缀）

// tools/observation-check/card-exempt.mjs —— F-24 四出口（spec §11.2 :119-126）
EXEMPT_CARDS: string[]         // 15 个 agents/<name>.md 精确相对路径
EXPIRY_EVENT: string           // 's4-first-regeneration'
EXPIRY_LANDED: boolean         // 本期 false（S4 首次重生成落地时置 true，spec §11.8 :224）
disposeCardFindings(findings, { landed = EXPIRY_LANDED } = {}) → { warnings: [], blockers: [] }

// scripts/test-skip-allowlist.mjs —— R9 单源（spec §11.2 :130）
SKIP_ALLOWLIST: string[]       // 现 2 条精确用例名
```

**被消费的既有面（不改，只调用）**

| 符号 | 出处 | 本 plan 用法 |
|---|---|---|
| `scanReviewDir(dirName, files)` | `tools/observation-check/gate-scan.mjs:20` | 归档三态 + 反向清单的唯一判据源；返回 `{code, message}[]`（**无 `path`**） |
| `ARTIFACT_RE` / `ALLOWED_FILE_RE` / `ATTACHMENT_RE` | 同文件 `:17` / `:5` / `:8` | 门禁侧只读**不复制**；根层分支只用 `ARTIFACT_RE` 区分文件名并写 message |
| `STOCK_DIR_WHITELIST` / `STOCK_FILE_WHITELIST` | 同文件 `:2` / `:12` | 存量目录白名单（1 个）/ 9 个精确路径 |
| `validateArtifact(jsonPath, { registeredIds })` | `tools/observation-check/artifact.mjs:84` | 四段校验；`registeredIds` 取 `REGISTERED_IDS` |
| `REGISTERED_IDS` | `tools/observation-check/registered-ids.mjs:5` | 直接 import，不另立清单 |
| `repoRoot()` | `tools/observation-check/evidence.mjs:40` | 根唯一来源（`cachedRoot`，`:39`） |
| `renderObservation(doc)` | `tools/observation-check/checks.mjs:157` | 测试夹具构造合法 md（testcase §0.2-5） |

---

## 计划门（②→③，开工前签）

> 判据出处：`skills/dev-workflow/references/stage-2b-plan-gate.md`（三条核对，「脚本上线前」走审计手工核对表 + 命令原文）。本门**不设议会**；**申报人 = 主 agent，签字人 = 独立审计实例（`reviewer-audit` 角色卡 path B）**——R2：主 agent 不得自签。签字时点 = 本 plan 写完之后、Task 1 开工之前。

### 核对一：功能点全覆盖

- **判据**：PRD 归属 S3 的功能点 ID 集合 ⊆ 本 plan 覆盖集（差集为空），每个被覆盖功能点至少一条执行步骤。
- **PRD 侧集合**：`docs/prd/20261026205821-agent-card-contract.md:518`（§8 S3 行）与 `:546`（F→S 覆盖表 S3 行）同口径 = **F-17 / F-18 / F-19 / F-22 / F-24** 共 **5 个**。
- **取集合命令**：`Select-String -Path docs\prd\20261026205821-agent-card-contract.md -Pattern 'F-17～F-19、F-22、F-24'` → 命中 `:518`、`:546` 两行。

| PRD 功能点 | 一句话（PRD `:481-488`） | 本 plan 落点 | 覆盖用例（附录 A） |
|---|---|---|---|
| F-17 | 门禁接入 `npm run check`（零产物跳过 + 扫描根不可枚举即红） | Task 2、Task 3、Task 9 | H01、H02、H03、H54 |
| F-18 | 归档目录强制（git 索引状态 + 目录级反向清单） | Task 4、Task 6 | H08–H14、H20–H26 |
| F-19 | 义务产出（缺 `observation-r<N>` → `ArtifactMissing`） | Task 3、Task 4 | H07、H09、H52 |
| F-22 | 迁移状态机 + 工具故障旁路（留痕） | Task 8、Task 9 | H32–H36、H37–H40 |
| F-24 | 存量 15 卡豁免窗口（到期 = S4 首次重生成） | Task 1、Task 9 | H41–H45 |

- **plan 侧集合**：上表 5 行；取命令 `Select-String -Path docs\superpowers\plans\2026-10-28-s3-gate-wiring.md -Pattern '^\| F-(17|18|19|22|24) \|'` → 5 行，差集 0。
- **注意同名不同义**：testcase 的 A–L 组号与 PRD 的 F-xx 号不是同一套；本表只比 PRD 号。

### 核对二：依赖无环

- **判据**：Task 依赖图是 DAG（拓扑排序可完成、回边 0），每个 `Consumes` 的产物都在本 plan 内。
- **边集**（每个 Task 的 `Consumes:` 只指更小编号，见各 Task Interfaces）：

| Task | Consumes | 边 |
|---|---|---|
| T1 | 无 | — |
| T2 | 无 | — |
| T3 | T2 | T2→T3 |
| T4 | T3 | T3→T4 |
| T5 | T3 | T3→T5 |
| T6 | T5 | T5→T6 |
| T7 | T3、T6 | T3→T7、T6→T7 |
| T8 | T6 | T6→T8 |
| T9 | T1–T7 | T1→T9、T2→T9、T3→T9、T4→T9、T5→T9、T6→T9、T7→T9 |
| T10 | T9 | T9→T10 |

- **拓扑序**：`T1, T2, T3, T4, T5, T6, T7, T8, T9, T10`（可完成）；**回边 0**（15 条边全部指向更小号）。
- **取命令**：`Select-String -Path docs\superpowers\plans\2026-10-28-s3-gate-wiring.md -Pattern '^\- Consumes:'` → 10 行。

### 核对三：功能块 ↔ testcase 一一映射

- **判据**：S3 = PRD §8 一行 = 一个功能块，恰对应一份 testcase；该 testcase 的 55 个 ID 全部有落点，悬空 0。
- **映射**：S3 功能块 ↔ `docs/superpowers/specs/2026-10-27-s3-gate-wiring-design-testcase.md`（55 条）；逐 ID 落点见**附录 A**。
- **取命令**：`(Select-String -Path docs\superpowers\specs\2026-10-27-s3-gate-wiring-design-testcase.md -Pattern '^#### H\d\d').Count` → **55**；`(Select-String -Path docs\superpowers\plans\2026-10-28-s3-gate-wiring.md -Pattern '^\| H\d\d \| (正|负|边界) \|').Count` → **55**（附录 A 逐 ID 行，按「类型」列锁定，避免把各 Task 的断言表行计入）。
- **双段用例**：H01（文案/结构常驻 + e2e 验收）、H41（15 项形常常驻 + 集合相等验收）——两段都落点，见附录 A「执行」列。

### 签行（已签，2026-10-28）

> **结论：过。** 三条核对由独立审计实例（`reviewer-audit@agents/reviewer-audit.md`，path B 角色卡贴入，未参与写 plan）核过并签字；**签行原文见 `skills/dev-workflow/references/gate-record.md` 的 `②→③@S3` 行**（本文件不复抄，防两处维护漂移）。两轮：第 1 轮判「过」+ 11 条打回（P1 4 / P2 7）→ 第 2 轮复核 11/11 已消 → 终态过。证据原文：`.session/reviews/2026-10-28-0747-s3-plan-gate/plan-gate.md`（第 1 轮，216 行）与 `plan-gate-r2.md`（第 2 轮，117 行）。

> `scripts/check-plan.mjs`（S4 交付）当前不存在，故三条核对一律「审计手工核对表」，表头固定 `核了什么 | 怎么核的 | 结论` 并附命令原文。**审计只签字不读 = 不通过**（`stage-2b-plan-gate.md:46`）。

---

## 存量 spec 豁免点名（`spec-testcase-gate`，进 ③ 必点）

> 出处：`rules/dev-workflow-mainline.md`「例外」节——进 ③ 必须在 plan 或交接材料里点名两件事。

1. **豁免的存量 spec（2026-10-18 之前定稿，共 25 份）**：`2026-09-27-retro-suite-design.md`、`2026-09-28-evolving-skills-design.md`、`2026-09-28-evolving-step3-design.md`、`2026-09-28-l3-l4-promotion-design.md`、`2026-09-29-aas-skill-deps-design.md`、`2026-10-01-retro-flywheel-blueprint.md`、`2026-10-01-retro-self-improvement-design.md`、`2026-10-02-session-dir-layout-design.md`、`2026-10-07-moment-context-and-timeline-design.md`、`2026-10-08-rule-optimizer-design.md`、`2026-10-09-global-ask-rewrite-design.md`、`2026-10-09-rule-suite-design.md`、`2026-10-09-rule-type-scoring-design.md`、`2026-10-09-skill-authoring-design.md`、`2026-10-09-use-rule-skills-design.md`、`2026-10-10-review-branch-design.md`、`2026-10-10-review-loop-l3-project-type-design.md`、`2026-10-10-rules-migration-design.md`、`2026-10-11-type-rules-external-design.md`、`2026-10-14-execution-assurance-design.md`、`2026-10-14-review-loop-evolution-design.md`、`2026-10-15-cognitive-rule-landing-gate-design.md`、`2026-10-15-verification-audit-checklist-design.md`、`2026-10-17-parliament-design.md`、`2026-10-17-systematic-repair-design.md`（目录 `docs/superpowers/specs/`；取数 `Get-ChildItem docs\superpowers\specs\*.md | Where-Object { $_.Name -lt '2026-10-18' }` → 25——注意其中 `2026-10-01-retro-flywheel-blueprint.md` 不以 `-design.md` 结尾，故通配符用 `*.md` 不用 `*design.md`）。
2. **升级时点（事件型，可核）**：上述任一份 spec **下一次被修订并进入 plan 的那一刻**——那一刻必须先补同目录 `<名>-testcase.md`，否则按 `spec-testcase-gate` 打回。S3 自身的 spec/testcase 在 2026-10-18 之后定稿，不在豁免内。

---

## Task 1: `card-exempt.mjs`（F-24 窗口登记件）+ 测试

**Files:**
- Create: `tools/observation-check/card-exempt.mjs`
- Create: `tools/observation-check/card-exempt.test.mjs`

**Interfaces:**
- Consumes: 无（判据全在 spec §11.2 F-24 表 `spec:119-126`）
- Produces: 四出口（`EXEMPT_CARDS` / `EXPIRY_EVENT` / `EXPIRY_LANDED` / `disposeCardFindings`），供 Task 9 的 ⑥ 段豁免状态行消费；`EXPIRY_LANDED` 是 S4 到期的唯一开关（`spec:224`）

- [ ] **Step 1: 建 `card-exempt.mjs`（四出口逐字）**

`EXEMPT_CARDS` = 15 个精确相对路径 `agents/<name>.md`，名单以 `Get-ChildItem agents\*.md` 实跑（2026-10-28 15 名，升序）：`detective-observer`、`evidence-reader`、`reviewer-actuary`、`reviewer-ai`、`reviewer-audit`、`reviewer-backend`、`reviewer-frontend`、`reviewer-interaction`、`reviewer-ops`、`reviewer-product`、`reviewer-qa`、`reviewer-reader`、`reviewer-security`、`reviewer-ui`、`senior-sdet`。
`EXPIRY_EVENT = 's4-first-regeneration'`；`EXPIRY_LANDED = false`（本期）。
`disposeCardFindings(findings, { landed = EXPIRY_LANDED } = {})`：`file ∈ EXEMPT_CARDS && !landed` → 进 `warnings`，否则进 `blockers`；纯函数、无 IO；`landed` 只供测试注入（生产不传，Q9 `spec:208`）。

- [ ] **Step 2: 建 `card-exempt.test.mjs`（H41 常驻半段 + H42 / H43 / H44）**

| ID | 断言（判据出处） |
|---|---|
| H41 | `EXEMPT_CARDS.length === 15` 且每项匹配 `/^agents\/[a-z0-9-]+\.md$/`；**集合与 `agents/*.md` 相等是验收半段，不在本文件**（`testcase:807` / `:813-814`） |
| H42 | 名单外卡 finding（如 `agents/new-card.md`）→ `blockers` 含它、`warnings` 空（`testcase:819`） |
| H43 | 名单内 + 不传 `landed` → `warnings` 含它、`blockers` 空（`testcase:831`） |
| H44 | 名单内 + 注入 `{ landed: true }` → `blockers` 含它、`warnings` 空；调用前后 `EXPIRY_LANDED` 仍 `false`（`testcase:843`） |

finding 夹具形状 = `{ file: 'agents/<name>.md', code: 'X', message: '…' }`（本文件内自建，**不引用任何仓内文件**）。

- [ ] **Step 3: 跑测试与仓门禁**

```powershell
node --test "tools/observation-check/card-exempt.test.mjs"; "exit=$LASTEXITCODE"
node --test "tools/observation-check/*.test.mjs" 2>&1 | Select-String -Pattern '^# (tests|pass|fail|skipped)'
npm run check; "exit=$LASTEXITCODE"
```

Expected：`exit=0`；套件 `# fail 0`、`# tests ≥ 166 + 4`；仓门禁 `exit=0` 且末行 `check 全部通过`。

---

## Task 2: `gate-run.mjs` 之 `formatGateLine`（文案单源，四形态）

**Files:**
- Create: `tools/observation-check/gate-run.mjs`（本任务只落 `formatGateLine`；`runObservationGate` 由 Task 3 落）
- Create: `tools/observation-check/gate-run.test.mjs`（本任务落 H01①）

**Interfaces:**
- Consumes: 无（判据在 spec §11.2 打印形态 `spec:83-86` + Q6 `spec:205`）
- Produces: `formatGateLine(res)`——⑥ 段唯一文案来源，Task 9 的 `check-all` 只 `console.log` 它的返回值

- [ ] **Step 1: 实现 `formatGateLine(res)`（四条分支）**

输入结构固定 `{ scannedDirs, archivePairs, processPairs, findings }`：
1. `findings.length > 0` → 每条渲染一行 `[observation] <code>: <path> —— <message>`，多条用 `"\n"` 连接，**顺序 = 数组顺序**（不排序、不去重、不聚合，`spec:80` / Q5）；
2. `findings.length === 0 && scannedDirs === 0 && archivePairs === 0` → `⑥ 观察产物门禁：扫描 0 个子目录 / 归档 0 对 / 过程 <processPairs> 对 / findings 0（归档 0 件，跳过）`（零产物分支只跳归档侧，`spec:86`）；
3. 其余无 findings → `⑥ 观察产物门禁：扫描 <scannedDirs> 个子目录 / 归档 <archivePairs> 对 / 过程 <processPairs> 对 / findings 0`；
4. 本函数**不读进程状态、不读磁盘**（纯函数）。

- [ ] **Step 2: 写 H01①（四形态逐字，不 spawn、不碰真仓）**

| 形态 | 输入 | 期望（逐字） |
|---|---|---|
| a 零产物 | `{scannedDirs:0, archivePairs:0, processPairs:0, findings:[]}` | `⑥ 观察产物门禁：扫描 0 个子目录 / 归档 0 对 / 过程 0 对 / findings 0（归档 0 件，跳过）` |
| b 有产物无 findings | `{scannedDirs:1, archivePairs:1, processPairs:0, findings:[]}` | `⑥ 观察产物门禁：扫描 1 个子目录 / 归档 1 对 / 过程 0 对 / findings 0`（**无**后缀） |
| c findings 单条 | `findings:[{code:'ArtifactMissing', path:'docs/superpowers/reviews/x/', message:'无产物'}]` | `[observation] ArtifactMissing: docs/superpowers/reviews/x/ —— 无产物` |
| d findings 多条 | `g1 = {code:'RenderMismatch', …}` 在前、`g2 = {code:'ArtifactMissing', …}` 在后 | 两行固定 `\n` 连接，**顺序 = 数组顺序**（`g1` 码字母序在后 → 若实现按码排序必红，`testcase:290`） |

判据出处：`testcase:280-309`（H01 三段之①）。长度/空格/破折号一律逐字，不得改全角。

- [ ] **Step 3: 跑测试**

```powershell
node --test "tools/observation-check/gate-run.test.mjs"; "exit=$LASTEXITCODE"
```

Expected：`exit=0`、`# fail 0`（本任务只有 H01①）。

---

## Task 3: `runObservationGate()` 骨架——根派生 / 归档枚举 / 三态（缺产物 / 白名单）/ 根层散文件

**Files:**
- Modify: `tools/observation-check/gate-run.mjs`（新增 `runObservationGate`）
- Modify: `tools/observation-check/gate-run.test.mjs`（H01②、H02、H03、H04、H07、H11、H14、H24、H25、H54）

**Interfaces:**
- Consumes: Task 2（`formatGateLine` + 模块骨架）
- Produces: `runObservationGate()` 返回四字段结构；根不可用与扫描根不可用两类 finding 收敛路径

- [ ] **Step 1: 实现骨架与两条「不可用」分支**

1. 根：`repoRoot()`（`tools/observation-check/evidence.mjs:40`）；抛错（含 spawn 失败 / 超时）→ `findings=[{code:'RepoRootUnresolved', path:'<repoRoot 不可得时留空串>', message}]` 并**直接返回**（不抛栈，`spec:75`）；
2. 扫描根 = `join(root, 'docs', 'superpowers', 'reviews')`；不存在 / `readdirSync` 抛错（含路径是文件）→ `ArtifactNamingOff`（`spec:101`）；
3. 枚举：子目录 → 每目录调 `scanReviewDir(dirName, files)`（files = 该目录下相对路径数组，含子层）；目录下无产物时的判定由纯函数给码（`ArtifactMissing` 或白名单豁免）；
4. 根层散文件（D1）：扫描根的直接文件**一律** `UnclassifiedArtifact`，`path` = 文件名所在的 `docs/superpowers/reviews/`（目录级口径），文件名写进 `message`；**不调** `scanReviewDir`、**不套** `ALLOWED_FILE_RE`；`ARTIFACT_RE` 只用于 message 里区分「产物名 / 非产物名」；
5. 计数：`scannedDirs` = 归档侧被枚举的子目录数（不含过程目录）；`archivePairs` = 已存在且成对的 json + 同名 md 组数（`-a`/`-b` 各自成对，Q14 `spec:213`）；`processPairs` 本任务恒 `0`（Task 7 落）；
6. **零产物分支成立条件**：`scannedDirs === 0` **且**根层无散文件（`spec:99`）。

- [ ] **Step 2: 写测试（10 条，一律子进程注入）**

夹具与驱动按 testcase §1.2（`testcase:225-263`）逐字实现：`mkRepo()`（临时 git 仓 + 两空根目录 + `commit --allow-empty`）、`runGate(repo)`（spawn `process.execPath` + `--input-type=module -e <DRIVER>`）、`norm()`。**本任务起每个 gate 用例一律走子进程**（`repoRoot()` 有缓存，Q13 `spec:212`）。

| ID | 断言（判据出处） |
|---|---|
| H01② | 空仓 `{scannedDirs:0, archivePairs:0, processPairs:0, findings:[]}`、四字段齐、子进程 stdout **纯 JSON**、stderr 空（`testcase:292-299`） |
| H02 | 不建扫描根 → 恰 1 条 `ArtifactNamingOff`（`testcase:310`） |
| H03 | 扫描根路径是文件（`writeFileSync` 占位）→ `ArtifactNamingOff` 且不抛栈（`testcase:322`） |
| H04 | 子目录名在 `STOCK_DIR_WHITELIST`（`2026-10-25-1723-s6-eval`）+ 无产物 → 0 findings（`testcase:334`） |
| H07 | 子目录无产物且不在白名单 → 恰 1 条 `ArtifactMissing`、`norm(path)` = `docs/superpowers/reviews/<次>`；**两形态**：仅 `progress.md` / `progress.md+cards.md+problems.md` 全允许类账本**仍红**（D9 / Q18，`testcase:379`） |
| H11 | 扫描根**根层**放 `notes.md` → 恰 1 条 `UnclassifiedArtifact`（文件名在 message）；**再放 `progress.md`（允许名）→ 仍恰 1 条红**；两形态均**不得**出 `ArtifactMissing`（D1 不套允许类白名单，`testcase:429`） |
| H14 | 扫描根根层放 `observation-r1.json`（产物名、无归属）→ 仍判 `UnclassifiedArtifact`，**无** `ArtifactMissing`（D1 强形态，`testcase:467`） |
| H24 | 临时根非 git 工作树 → `RepoRootUnresolved`（fail-closed，`testcase:591`） |
| H25 | 子进程 `env` 的 `PATH` 置空（不改正进程）→ spawn `ENOENT` → `RepoRootUnresolved`（`testcase:603`） |
| H54 | 根层散文件 + 0 子目录 → 仍 `UnclassifiedArtifact`，**不是**「0 件，跳过」（`testcase:971`） |

- [ ] **Step 3: 跑测试与仓门禁**

```powershell
node --test "tools/observation-check/gate-run.test.mjs" 2>&1 | Select-String -Pattern '^# (tests|pass|fail)'
npm run check; "exit=$LASTEXITCODE"
```

Expected：`# fail 0`；`exit=0`。

---

## Task 4: 反向清单接线——`scanReviewDir` 入参 / 允许类 / `attachments/` / 码的用法边界

**Files:**
- Modify: `tools/observation-check/gate-run.mjs`
- Modify: `tools/observation-check/gate-run.test.mjs`（H08、H09、H10、H12、H13、H20）

**Interfaces:**
- Consumes: Task 3（枚举与三态骨架）
- Produces: 杂件码 / 允许类豁免 / 子层裁剪 / 大写后缀三条边界的接线判据

- [ ] **Step 1: 接线要点（不另立判据）**

1. 每个归档子目录的 `files` 入参 = 该 `<次>/` 下**全部相对路径**（POSIX），子层（`cards/`、`attachments/`）一并传入——由 `scanReviewDir` 内部的 `ALLOWED_FILE_RE` / `ATTACHMENT_RE` / `STOCK_FILE_WHITELIST` 判定，门禁侧**不裁剪、不重算**（R4）；
2. 纯函数返回值（`{code, message}[]`）逐条转成 finding：`path` = `<次>/` 的仓内相对路径（`docs/superpowers/reviews/<次>/`），**杂件文件名留在 `message`**（S2 无 `path`，禁止解析 message 反推路径，`spec:81`）；
3. 大写后缀（`observation-r1-A.json`）**不报** `ArtifactNamingOff`，按三态后果判（`ArtifactMissing` + `UnclassifiedArtifact`，Q8/Q12）。

- [ ] **Step 2: 写测试（6 条）**

| ID | 断言（判据出处） |
|---|---|
| H08 | 子目录含 `random-notes.md` → `UnclassifiedArtifact`，`norm(path)` = `<次>`，文件名**只在 message**（`testcase:393`） |
| H09 | 杂件 + 缺产物 → 两码**并列**出现（`testcase:405`） |
| H10 | 8 类允许文件名（含 `cards/` 子层）齐放 → 无 `UnclassifiedArtifact`（`ArtifactMissing` 仍在，`testcase:417`） |
| H12 | `<次>/attachments/<file>` 一层 + 已提交产物对 → 0 findings（`testcase:443`） |
| H13 | `attachments/a/b.md` 两层 → 恰 1 条 `UnclassifiedArtifact`（文件名在 message，`testcase:455`） |
| H20 | `observation-r1-A.json` → `ArtifactMissing` + `UnclassifiedArtifact`，且**无** `ArtifactNamingOff`（`testcase:541`） |

- [ ] **Step 3: 跑测试**

```powershell
node --test "tools/observation-check/gate-run.test.mjs" 2>&1 | Select-String -Pattern '^# (tests|pass|fail)'
```

Expected：`# fail 0`。

---

## Task 5: 成对判定与四段码透传

**Files:**
- Modify: `tools/observation-check/gate-run.mjs`
- Modify: `tools/observation-check/gate-run.test.mjs`（H15、H16、H17、H18、H19）

**Interfaces:**
- Consumes: Task 3（归档枚举与 `archivePairs` 计数）
- Produces: 归档侧「以 json 为锚逐个四段校验」路径；孤立 md 与 `MdMissing` 的分界

- [ ] **Step 1: 实现**

1. 归档侧以 **json 为锚**：每个 `observation-r<N>(-[ab])?.json` 调 `validateArtifact(jsonPath, { registeredIds: REGISTERED_IDS })`，错误对象（`{code, message, path?}`）逐条转 finding（`path` 用文件仓内相对路径，优先实现返回的 `path`、缺省用锚点路径）；
2. 孤立 md（md 在、无同名 json）→ `JsonNotFound`（`spec:97` / D2）；
3. md 缺 → 由 `validateArtifact` 判 `MdMissing`（S2 内部，**不重写**）；
4. 四段码一律原样透传（R8），不改码名、不合并。

- [ ] **Step 2: 写测试（5 条）**

| ID | 断言（判据出处） |
|---|---|
| H15 | 子目录只有 md → `JsonNotFound`，**无** `ArtifactMissing`（`testcase:481`） |
| H16 | json 在、md 缺 → 恰 1 条 `MdMissing`（`testcase:493`） |
| H17 | `items: []` → `MissingItems`（`testcase:505`） |
| H18 | json 未改、md 手改一字 → `RenderMismatch`（`testcase:517`） |
| H19 | 含 `check:'ai'` 条目但缺 `-a`/`-b` → `InstanceMissing`（`testcase:529`） |

合法产物按 testcase §0.2-5 构造（全 `na` items + `renderObservation(doc)` 派生 md）。

- [ ] **Step 3: 跑测试**

```powershell
node --test "tools/observation-check/gate-run.test.mjs" 2>&1 | Select-String -Pattern '^# (tests|pass|fail)'
```

Expected：`# fail 0`。

---

## Task 6: git 两条断言 + 前置探测（fail-closed）

**Files:**
- Modify: `tools/observation-check/gate-run.mjs`
- Modify: `tools/observation-check/gate-run.test.mjs`（H06、H21、H22、H23、H26）

**Interfaces:**
- Consumes: Task 5（成对判定与四段校验）
- Produces: 文件级 git 两码；`ArtifactDirty` / `UntrackedArtifact` 的粒度判据

- [ ] **Step 1: 实现三条命令（R5）**

| 命令（`cwd = repoRoot()`、`timeout: 30000`） | 非 0 / 异常 → 码 |
|---|---|
| `git rev-parse --is-inside-work-tree`（前置探测） | `RepoRootUnresolved` |
| `git ls-files --error-unmatch -- <path>` | `UntrackedArtifact` |
| `git diff --quiet -- <path>` | `ArtifactDirty` |

1. 只对**归档侧产物文件**（json 与 md 各一条）跑；过程侧**不做** git 断言（R3）；
2. 粒度：**每个产物文件每条命令最多一条** finding，不去重、不聚合；`path` = 该文件仓内 POSIX 相对路径（Q5 `spec:80`）；
3. `git add -N`（intent-to-add）态 → `ls-files` exit 0、`diff` exit 1 → 报 `ArtifactDirty`（**不识别 `-N`**，既定取舍 `spec:113`；备忘写进测试注释，不新增用例）。

- [ ] **Step 2: 写测试（5 条）**

| ID | 断言（判据出处） |
|---|---|
| H06 | 产物对已 commit 且工作树一致 → 0 findings、`archivePairs 1`、`scannedDirs 1`（`testcase:367`） |
| H21 | 同上 → **无** `UntrackedArtifact` / `ArtifactDirty`（`testcase:555`） |
| H22 | 归档件未 `git add` → **恰 2 条** `UntrackedArtifact`（json + md 各一条），path 逐条精确（`testcase:567`） |
| H23 | 已 commit 后手改（追加换行、四段仍绿）→ `ArtifactDirty`（`testcase:579`） |
| H26 | json 已跟踪干净、md 未跟踪 → `UntrackedArtifact` 的 path **逐字** = `<次>/observation-r1.md`（`testcase:615`） |

- [ ] **Step 3: 跑测试与仓门禁**

```powershell
node --test "tools/observation-check/gate-run.test.mjs" 2>&1 | Select-String -Pattern '^# (tests|pass|fail)'
npm run check; "exit=$LASTEXITCODE"
```

Expected：`# fail 0`；`exit=0`。

---

## Task 7: 过程侧口径 + 槽位边界（H55）+ 码集合封闭（H53）

**Files:**
- Modify: `tools/observation-check/gate-run.mjs`
- Modify: `tools/observation-check/gate-run.test.mjs`（H27、H28、H29、H30、H31、H53、H55）

**Interfaces:**
- Consumes: Task 3（目录枚举）、Task 6（四段 + git 路径已成型）
- Produces: `processPairs` 计数与过程侧「无三态 / 无成对 / 无 git」口径；码字面集合闭合的静态判据

- [ ] **Step 1: 实现过程侧**

1. 过程根 = `join(root, '.session', 'reviews')`；**不存在 → `processPairs 0`、不报码**（与 `check-all` ⑤ 段同口径）；存在但不可读（非 ENOENT 的 IO 错）→ `RepoRootUnresolved`（`spec:101`）；
2. 只对每个 `<次>/` **根层** `observation-r*.json` 逐个 `validateArtifact`；不做三态、不做成对（只有 md 无 json 不报码，Q7）、不做 git（R3）；
3. `processPairs` = 过程侧成对组数（json + 同名 md 都在）。

- [ ] **Step 2: 写测试（7 条）**

| ID | 断言（判据出处） |
|---|---|
| H27 | 3 个过程目录、0 产物 → 0 findings、`processPairs 0`、无 `ArtifactMissing`（`testcase:631`） |
| H28 | 过程目录合法产物（**未跟踪**）→ 0 findings、`processPairs 1`（不做 git，`testcase:643`） |
| H29 | 过程产物缺 md → `MdMissing`（四段真跑，`testcase:655`） |
| H30 | 过程目录只有 md → findings 空（`JsonNotFound` / `ArtifactMissing` / `UnclassifiedArtifact` 均不出，`testcase:667`） |
| H31 | 过程目录杂件（`progress.md` + `random.md`）→ 不出 `UnclassifiedArtifact` / `ArtifactMissing`（`testcase:679`） |
| H53 | 静态：`gate-run.mjs` 的码字面 ⊆ 门禁侧 **4 码** `{ArtifactNamingOff, RepoRootUnresolved, UntrackedArtifact, ArtifactDirty}` ∪ S2 源已出现码（`ArtifactMissing` / `UnclassifiedArtifact` / `JsonNotFound` 出自 `tools/observation-check/gate-scan.mjs`）+ 四段透传码；**自造码 = 0**（`testcase:958-962`） |
| H55 | `mkRepo({ session: false })`（不建 `.session/reviews`）→ `processPairs 0`、`findings === []`、**无** `ArtifactNamingOff`（`testcase:987`） |

- [ ] **Step 3: 跑测试与仓门禁**

```powershell
node --test "tools/observation-check/gate-run.test.mjs" 2>&1 | Select-String -Pattern '^# (tests|pass|fail)'
npm run check; "exit=$LASTEXITCODE"
```

Expected：`# fail 0`；`exit=0`。

---

## Task 8: 迁移状态机四步的期望序列（临时仓，不碰真仓）

**Files:**
- Modify: `tools/observation-check/gate-run.test.mjs`（H32、H33、H34、H35、H36）
- 不新增生产代码（`runObservationGate` 已是无写路径，`spec:151`）

**Interfaces:**
- Consumes: Task 6（git 两码）
- Produces: 「步骤 1 报码属预期」的可复现证据；「gate 零 git 写」断言

- [ ] **Step 1: 写测试（5 条，全部在 `mkRepo()` 内构造）**

| ID | 断言（判据出处） |
|---|---|
| H32 | **先做第 0 步**（`writeObservation` 产出 `observation-r1.json|md` 到 `.session/reviews/<次>/`）再 move 到归档 → `UntrackedArtifact`，message 含「属预期」与「`git add`」；**无** `ArtifactMissing`（`testcase:693`） |
| H33 | `git add` 后两码消、0 findings（`testcase:705`） |
| H34 | `commit` 后绿保持（`testcase:717`） |
| H35 | 迁移后 `.session` 副本仍在：归档侧报码、过程侧 0 findings（**不双报**，`testcase:729`） |
| H36 | 跑 gate 前后 `HEAD` 与 `git status --porcelain` 不变（**0 git 写**，`testcase:741`） |

> H32 的 message 要求「属预期 / `git add`」在 `UntrackedArtifact` 的 message 里——该文案由 `gate-run` 生成（不是 S2 码），实现时对 `UntrackedArtifact` 的 message 固定写「归档件未进 git 索引（迁移步骤 1 属预期，下一步 `git add`）」；同一条文案在 H22/H26 里不断言全文，只断言码与 path。

- [ ] **Step 2: 跑测试**

```powershell
node --test "tools/observation-check/gate-run.test.mjs" 2>&1 | Select-String -Pattern '^# (tests|pass|fail)'
```

Expected：`# fail 0`（含 H36 的 0 git 写断言）。

---

## Task 9: `check-all.mjs` 接线（bypass 首行 / ② 段 skip 守卫 / ⑥ 段）+ `SKIP_ALLOWLIST` 单源 + H05

**Files:**
- Create: `scripts/test-skip-allowlist.mjs`
- Modify: `scripts/check-all.mjs`（三处插入：`scripts/check-all.mjs:43` 后 bypass 首行、`:95` 后 skip 守卫、`:366` 与 `:368` 之间 ⑥ 段）
- Modify: `tools/observation-check/gate-run.test.mjs`（H05）

**Interfaces:**
- Consumes: Task 1（`card-exempt.mjs` 四出口）、Task 2–7（`gate-run.mjs` 全部出口）
- Produces: ⑥ 段（唯一打印出口 = `formatGateLine`）；`BYPASS:` 首行；② 段 skip 守卫

- [ ] **Step 1: 建 `scripts/test-skip-allowlist.mjs`（R9 单源）**

`SKIP_ALLOWLIST` = 2 条精确用例名（`tools/docgen/test/dev-workflow-files.test.mjs:100` / `:262`，2026-10-28 实测）：
`'TC-A10 运行时就位：两条 Test-Path 为 True（aas sync 后本机验）'`、`'TC-E27 只写源不 aas sync → 本机 Test-Path 为 False（探针式，不碰 dev-workflow 本体）'`。

- [ ] **Step 2: ② 段 skip 守卫（插在 `scripts/check-all.mjs:95` 后）**

1. 解析形态定死为 TAP 内联指令：`/^\s*(?:not )?ok\s+\d+\s+-\s+(.*?)\s+#\s+(SKIP|TODO)\b/`（名字取第 1 捕获组、reason 丢弃；**不存在独立 `# SKIP <名>` 行**）；
2. 判据只按名字：名字 ⊄ `SKIP_ALLOWLIST` → `failed = true` 且 `console.error('[测试] 名单外 skip：<用例名>')` / `('[测试] 名单外 todo：<用例名>')`；
3. **`# skipped M`（M>0）但该正则解析出 0 个名字 → fail-closed 红**；**不比较条数**（Q19 `spec:218`）。

- [ ] **Step 3: 顶部 bypass 首行（插在 `scripts/check-all.mjs:43` 后）**

`process.env.CHECK_BYPASS === '1'` → `console.log(\`BYPASS: ${process.env.CHECK_BYPASS_REASON || '(未提供原因)'}\`)` 并置 `bypass = true`；未开启时**不打印任何** `BYPASS:` 行（H40）。

- [ ] **Step 4: ⑥ 段（插在 `scripts/check-all.mjs:366` 与 `:368` 之间）**

1. `bypass` → `console.log('⑥ 观察产物门禁跳过（BYPASS）')`，不判，其余段照跑且仍可红；
2. 否则 `const res = runObservationGate()`；`console.log(formatGateLine(res))`（**唯一打印出口**，不得内联 ⑥ 段字面量）；
3. `res.findings.length > 0` → `failed = true`（逐条文案已由 `formatGateLine` 逐行拼接）；
4. ⑥ 段末尾按模板插值打印豁免状态行（`spec:128`）：
   `[豁免窗口] 15 张角色卡只告警（到期 = S4 首次重生成，EXPIRY_EVENT=<EXPIRY_EVENT> / EXPIRY_LANDED=<EXPIRY_LANDED>）；卡面 findings <n> / 告警 <w> / 阻断 <b>（S1 未上线：非达标证据）`
   其中 `n` = 传入 findings 数组长度（本期 `[]`.length = 0）、`w` = `disposeCardFindings(...).warnings.length`、`b` = `.blockers.length`（`disposeCardFindings` 只返回 `{warnings, blockers}` 两字段，`spec:126`），**不写字面量**；「**卡面**」限定词必须保留（Q20）。

- [ ] **Step 5: 写 H05（静态 + 集成）**

| 断言（`testcase:346`） |
|---|
| `gate-run.mjs` 源码：无 `root` 形参、无自建 `ALLOWED_FILE_RE` / 白名单 / 产物正则（根层分支也不复用 `ALLOWED_FILE_RE`）、三条 git 命令均带 `timeout: 30000` |
| 全仓生产调用点 = 1（`scripts/check-all.mjs` 内 `runObservationGate(` 恰 1 处）且实参为空 |
| `scripts/check-all.mjs` **必须**含 `formatGateLine(`，且**不得**含 ⑥ 段字面量（计数行前缀 `⑥ 观察产物门禁：扫描` 与 `[observation]` 前缀两种都不得出现） |
| 扫描根由 `repoRoot()` 派生：子目录 `cwd` 下跑 gate 仍扫到仓根归档目录（子进程注入，行为断言） |

- [ ] **Step 6: 跑测试与仓门禁（本任务是第一次让真仓 `npm run check` 走 ⑥ 段）**

```powershell
node --test "tools/observation-check/gate-run.test.mjs" 2>&1 | Select-String -Pattern '^# (tests|pass|fail)'
npm run check; "exit=$LASTEXITCODE"
npm run check 2>&1 | Select-String -Pattern '^⑥ 观察产物门禁|^\[豁免窗口\]'
```

Expected：`# fail 0`；`exit=0` 且末行 `check 全部通过`；⑥ 行形如 `⑥ 观察产物门禁：扫描 2 个子目录 / 归档 1 对 / 过程 0 对 / findings 0`（不钉等值，Q16）；豁免行含 `EXPIRY_EVENT=s4-first-regeneration` / `EXPIRY_LANDED=false` / `卡面 findings 0 / 告警 0 / 阻断 0` / 「S1 未上线：非达标证据」。
**若 ⑥ 段真仓报红**：先核对是否属迁移步骤 1 的预期态（`spec:132` / Q17）——本 plan 不在真仓做迁移，故真仓 0 findings 是硬期望；不符即回查接线，**不得**用 `CHECK_BYPASS` 糊过去。

---

## Task 10: 收尾验收（14 项命令清单 + ③ 段出口证据）

**Files:**
- Test: 无（本任务全部是命令型验收；**不落 `*.test.mjs`**，`spec:174` / Q11）
- **不写** `gate-record.md` 的 ②→③ 行——门行已在开工前签署（见本文档 `## 计划门`）；本任务四条输出是 **③ 段出口证据**，供 ③→④ 使用

**Interfaces:**
- Consumes: Task 1–9（全部实现与测试）
- Produces: 14 项验收的命令输出（贴 `gate-record.md` 的 `③@S3` 行）；③→④ 的提交条件

**验收项 → 步骤索引**

| ID | 步骤 | ID | 步骤 |
|---|---|---|---|
| H49、H51 | Step 1 | H46、H47、H48 | Step 5 |
| H37、H38、H40 | Step 2 | H50、H01③ | Step 6 |
| H39 | Step 3 | H52 | Step 7 |
| H45 | Step 4 | H41② | Step 8 |

- [ ] **Step 1: H49 仓门禁全绿 + ⑥ 计数行 + 段序（⑤ 在 ⑥ 之前）+ H51 套件基线**

```powershell
$env:DW_RUNTIME_CHECK = $null
npm run check 2>&1 | Select-String -Pattern '^(⑤|⑥) '
node --test "tools/observation-check/*.test.mjs" 2>&1 | Select-String -Pattern '^# (tests|pass|fail|skipped)'
```

Expected：`npm run check` exit 0、`⑤` 行在 `⑥` 行**之前**、`⑥` 行可被 `/过程 \d+ 对/` 解析且**过程 0 对**，**不断言 `# skipped` 条数**（Q19）；套件 `# tests ≥ 166`、`# fail 0`、`# pass + # skipped === # tests`（H51）。

- [ ] **Step 2: H37 旁路 + reason / H38 无 reason / H40 未开启无 `BYPASS:` 行**

```powershell
$env:CHECK_BYPASS='1'; $env:CHECK_BYPASS_REASON='演练：校验器自身故障'; npm run check 2>&1 | Select-Object -First 3; "exit=$LASTEXITCODE"
Remove-Item Env:CHECK_BYPASS_REASON; npm run check 2>&1 | Select-Object -First 1; "exit=$LASTEXITCODE"
Remove-Item Env:CHECK_BYPASS; npm run check 2>&1 | Select-String -Pattern 'BYPASS'; "exit=$LASTEXITCODE"
```

Expected：①首行 `BYPASS: 演练：校验器自身故障`、含 `⑥ 观察产物门禁跳过（BYPASS）`、exit 0（H37）；②首行 `BYPASS: (未提供原因)`、仍跳过（H38）；③`BYPASS` 命中 0 行、exit 0（H40）。

- [ ] **Step 3: H39 旁路只跳 ⑥（⑤ 段构造红 → exit 1）**

```powershell
$env:CHECK_BYPASS='1'; $env:CHECK_BYPASS_REASON='演练：只跳 ⑥'
New-Item -ItemType File .session\zz-bypass-probe.md | Out-Null
npm run check 2>&1 | Select-String -Pattern '^\[session\]|^BYPASS:'; "exit=$LASTEXITCODE"
Remove-Item .session\zz-bypass-probe.md
Remove-Item Env:CHECK_BYPASS; Remove-Item Env:CHECK_BYPASS_REASON
Test-Path .session\zz-bypass-probe.md
git status --porcelain -- .session docs/superpowers/reviews tools/observation-check scripts
```

Expected：`exit=1` 且输出含 `[session] .session/zz-bypass-probe.md 是一级散文件`（⑤ 段仍可红）；清理后 `Test-Path` → `False`、scoped `git status` 输出**空串**（`.session/` 被 gitignore，故以 `Test-Path` 为主判；`git status` 不带 scope 会因本 plan 文档未入库而恒非空）。

- [ ] **Step 4: H45 豁免窗口常量 + 状态行模板**

```powershell
node --input-type=module -e "import {EXEMPT_CARDS,EXPIRY_EVENT,EXPIRY_LANDED,disposeCardFindings} from './tools/observation-check/card-exempt.mjs'; console.log(JSON.stringify({n:EXEMPT_CARDS.length,EXPIRY_EVENT,EXPIRY_LANDED,dispose:disposeCardFindings([])}))"
npm run check 2>&1 | Select-String -Pattern '^\[豁免窗口\]'
```

Expected：`n` = 15、`EXPIRY_EVENT` = `s4-first-regeneration`、`EXPIRY_LANDED` = `false`、`dispose` = `{"warnings":[],"blockers":[]}`；状态行含 `卡面 findings 0 / 告警 0 / 阻断 0` + `（S1 未上线：非达标证据）` 且三个数分别等于「传入 findings 长度 / `warnings.length` / `blockers.length`」（非字面量）。

- [ ] **Step 5: H46 skip 守卫正例 / H47 名单外 skip 红 / H48 名单外 todo 红**

```powershell
node --input-type=module -e "import {SKIP_ALLOWLIST} from './scripts/test-skip-allowlist.mjs'; import {spawnSync} from 'node:child_process'; const e={...process.env}; delete e.DW_RUNTIME_CHECK; const x=spawnSync(process.execPath,['--test','**/*.test.mjs'],{cwd:process.cwd(),encoding:'utf8',maxBuffer:64*1024*1024,env:e}); const R=/^\s*(?:not )?ok\s+\d+\s+-\s+(.*?)\s+#\s+(SKIP|TODO)\b/; const names=[...x.stdout.matchAll(new RegExp(R.source,'gm'))].filter(m=>m[2]==='SKIP').map(m=>m[1].trim()); const m=/# skipped (\d+)/.exec(x.stdout); console.log(JSON.stringify({skipped:m?Number(m[1]):null,parsed:names.length,outside:names.filter(n=>!SKIP_ALLOWLIST.includes(n))}))"
Set-Content -Encoding utf8 tools\observation-check\zz-probe-skip.test.mjs "import test from 'node:test'; test('probe-skip-X 名单外', { skip: '探针' }, () => {});"
npm run check 2>&1 | Select-String -Pattern '^\[测试\] 名单外'; "exit=$LASTEXITCODE"
Remove-Item tools\observation-check\zz-probe-skip.test.mjs
Set-Content -Encoding utf8 tools\observation-check\zz-probe-todo.test.mjs "import test from 'node:test'; test('probe-todo-Y 名单外', { todo: true }, () => {});"
npm run check 2>&1 | Select-String -Pattern '^\[测试\] 名单外'; "exit=$LASTEXITCODE"
Remove-Item tools\observation-check\zz-probe-todo.test.mjs
git status --porcelain -- tools/observation-check
```

Expected：①`skipped` = 2 且 `parsed` ≥ 2、`outside` = `[]`（⊆ 名单；`skipped>0` 且 `parsed=0` 才 fail-closed，`testcase:869`）；②`[测试] 名单外 skip：probe-skip-X 名单外` + `exit=1`（H47）；③`[测试] 名单外 todo：probe-todo-Y 名单外` + `exit=1`（H48）；清理后 scoped `git status` 输出**空串**。

- [ ] **Step 6: H50 真仓全扫 + H01③ 只移演练件**

```powershell
node --input-type=module -e "import {runObservationGate} from './tools/observation-check/gate-run.mjs'; console.log(JSON.stringify(await runObservationGate()))"
$stash = Join-Path $env:TEMP ("s3-archive-stash-" + [guid]::NewGuid().ToString('N'))
Move-Item docs\superpowers\reviews\2026-10-27-1200-migration-drill $stash
npm run check 2>&1 | Select-String -Pattern '^⑥ '; "exit=$LASTEXITCODE"
Move-Item $stash\2026-10-27-1200-migration-drill docs\superpowers\reviews\
git status --porcelain -- docs/superpowers/reviews
```

Expected：①`findings` = `[]`、`scannedDirs ≥ 2`、`archivePairs ≥ 1`、`processPairs` = 0、**无** `ArtifactMissing`，且 `docs/superpowers/reviews/2026-10-25-1723-s6-eval` 与 `…/2026-10-27-1200-migration-drill` 均在位（按名断言，计数只打印不判，H50 `testcase:919`）；②移走演练件后 `⑥ 观察产物门禁：扫描 1 个子目录 / 归档 0 对 / 过程 0 对 / findings 0` 且该行**不含**「（归档 0 件，跳过）」、exit 0（H01③）；③移回后 `git status --porcelain` 空串。
**禁止**暂存到 `.session/tmp/`（⑤ 段必红）与本仓其它目录；**禁止**移走 `2026-10-25-1723-s6-eval`（`tools/docgen/test/policy-pure-source.test.mjs:1580` 断言 `*-s6-eval` 恰 1 个）。

- [ ] **Step 7: H52 塞一个缺产物目录 → exit 1 + 打印形态**

```powershell
New-Item -ItemType Directory docs\superpowers\reviews\zz-probe-missing | Out-Null
Set-Content -Encoding utf8 docs\superpowers\reviews\zz-probe-missing\progress.md "# probe"
npm run check 2>&1 | Select-String -Pattern '^\[observation\]'; "exit=$LASTEXITCODE"
Remove-Item -Recurse -Force docs\superpowers\reviews\zz-probe-missing
git status --porcelain -- docs/superpowers/reviews
```

Expected：`exit=1`；输出含 `[observation] ArtifactMissing: docs/superpowers/reviews/zz-probe-missing/ —— <msg>`（**恰 1 条**，账本-only 仍红 = D9 / Q18，`testcase:943`）；清理后 `git status --porcelain -- docs/superpowers/reviews` 空串。

- [ ] **Step 8: H41② 集合与 `agents/*.md` 实跑相等（交付时点一次性核）**

```powershell
node --input-type=module -e "import {readdirSync} from 'node:fs'; import {EXEMPT_CARDS} from './tools/observation-check/card-exempt.mjs'; const real=readdirSync('agents').filter(f=>f.endsWith('.md')).map(f=>'agents/'+f).sort(); console.log(JSON.stringify({equal:JSON.stringify(real)===JSON.stringify([...EXEMPT_CARDS].sort()),real:real.length,listed:EXEMPT_CARDS.length}))"
```

Expected：`equal` = `true`、`real` = `listed` = 15（输出键名 `equal` 与已签 testcase 判据逐字一致，`testcase:814`）。

- [ ] **Step 9: 门禁三连（③ 段出口证据）**

```powershell
node scripts/scope-sweep.mjs --check; "sweep=$LASTEXITCODE"
node scripts/check-gate-record.mjs; "gate=$LASTEXITCODE"
npm run check; "exit=$LASTEXITCODE"
```

Expected：`sweep=0`；`gate=0`（首行 `rows N bad 0`、末行 `gate-record ok`）；`exit=0`。
（`check-gate-record.mjs` 取代原先两条内联 `node -e` 自查：内联写法按「整行含表头词即丢弃」过滤，正文提到该词的行会被静默漏核；脚本按单元格判表头并复用 `markdown-rows.splitRow`。）

---

## 附录 A：testcase 55 条 → 落点映射表

> 口径：**55 = 正 13 / 负 24 / 边界 18**（`testcase:77-133`）。「常驻」= 进 `tools/observation-check/*.test.mjs`；「验收」= Task 10 命令清单一次性执行（不落 `*.test.mjs`，Q11）。落点文件由 `testcase:218-224` 定死：H01–H36 / H53 / H54 / H55 → `gate-run.test.mjs`；H41–H44 → `card-exempt.test.mjs`；H37–H40 / H45–H52 → Task 10。

| ID | 类型 | 执行 | 落点 |
|---|---|---|---|
| H01 | 正 | 常驻 + 验收 | Task 2① + Task 3② + Task 10 Step 6③ |
| H02 | 负 | 常驻 | Task 3 |
| H03 | 负 | 常驻 | Task 3 |
| H04 | 边界 | 常驻 | Task 3 |
| H05 | 负 | 常驻 | Task 9 |
| H06 | 正 | 常驻 | Task 6 |
| H07 | 负 | 常驻 | Task 3 |
| H08 | 负 | 常驻 | Task 4 |
| H09 | 负 | 常驻 | Task 4 |
| H10 | 边界 | 常驻 | Task 4 |
| H11 | 负 | 常驻 | Task 3（根层散文件 D1） |
| H12 | 边界 | 常驻 | Task 4 |
| H13 | 负 | 常驻 | Task 4 |
| H14 | 负 | 常驻 | Task 3（根层产物名不豁免 D1） |
| H15 | 负 | 常驻 | Task 5 |
| H16 | 负 | 常驻 | Task 5 |
| H17 | 负 | 常驻 | Task 5 |
| H18 | 负 | 常驻 | Task 5 |
| H19 | 负 | 常驻 | Task 5 |
| H20 | 边界 | 常驻 | Task 4 |
| H21 | 正 | 常驻 | Task 6 |
| H22 | 负 | 常驻 | Task 6 |
| H23 | 负 | 常驻 | Task 6 |
| H24 | 负 | 常驻 | Task 3 |
| H25 | 边界 | 常驻 | Task 3 |
| H26 | 边界 | 常驻 | Task 6 |
| H27 | 正 | 常驻 | Task 7 |
| H28 | 正 | 常驻 | Task 7 |
| H29 | 负 | 常驻 | Task 7 |
| H30 | 边界 | 常驻 | Task 7 |
| H31 | 边界 | 常驻 | Task 7 |
| H32 | 正 | 常驻 | Task 8 |
| H33 | 正 | 常驻 | Task 8 |
| H34 | 正 | 常驻 | Task 8 |
| H35 | 边界 | 常驻 | Task 8 |
| H36 | 边界 | 常驻 | Task 8 |
| H37 | 正 | 验收 | Task 10 Step 2 |
| H38 | 边界 | 验收 | Task 10 Step 2 |
| H39 | 负 | 验收 | Task 10 Step 3 |
| H40 | 边界 | 验收 | Task 10 Step 2 |
| H41 | 正 | 常驻 + 验收 | Task 1（15 项形态）+ Task 10 Step 8（集合相等） |
| H42 | 负 | 常驻 | Task 1 |
| H43 | 边界 | 常驻 | Task 1 |
| H44 | 边界 | 常驻 | Task 1 |
| H45 | 边界 | 验收 | Task 10 Step 4 |
| H46 | 正 | 验收 | Task 10 Step 5 |
| H47 | 负 | 验收 | Task 10 Step 5 |
| H48 | 负 | 验收 | Task 10 Step 5 |
| H49 | 正 | 验收 | Task 10 Step 1 |
| H50 | 正 | 验收 | Task 10 Step 6 |
| H51 | 边界 | 验收 | Task 10 Step 1 |
| H52 | 负 | 验收 | Task 10 Step 7 |
| H53 | 边界 | 常驻 | Task 7 |
| H54 | 负 | 常驻 | Task 3 |
| H55 | 边界 | 常驻 | Task 7 |

**合计**：55 行；常驻 43（含 H01 / H41 的常驻半段）、验收 12 + 2 个验收半段（H01③ / H41②）。**不钉 `# tests` 增量**（Q11 `spec:210`）：兜底 = `# pass + # skipped === # tests` 且 `# tests ≥ 166`（H51）。

## 附录 B：执行顺序与提交切分

| 提交 | Task | 内容 | 可否独立回滚 |
|---|---|---|---|
| 1 | Task 1 | `card-exempt.mjs` + 4 条测试 | 是（无消费方时是死代码，`npm run check` 仍绿） |
| 2 | Task 2–7 | `gate-run.mjs` 全量 + gate-run 常驻测试（H01①②、H02–H36、H53–H55） | 是（尚无生产调用点，仓门禁不受影响） |
| 3 | Task 8 | 迁移状态机 5 条测试（纯测试增量） | 是 |
| 4 | Task 9 | `test-skip-allowlist.mjs` + `check-all.mjs` 三处接线 + H05 | 是（回滚即回到无入口状态，`npm run check` 仍绿） |
| 5 | Task 10 | 验收 14 项输出 + ③ 段出口证据（含清理后的 `git status` 空串） | 是（纯证据，不改代码） |

> ②→③ 门行在**开工前**单独签署，不随任何提交进入（与 S2 同形态，`gate-record.md:21`）。

## Self-Review（写完即跑，逐条对照）

**1. spec 覆盖**：spec §11.1 R1–R9 与 §11.2 机制逐块有落点——R1 → Global 1 + Task 3/4/5（只接线不搬纯函数）；R2 → Global 2 + Task 3 Step 1 + H05；R3 → Task 7；R4 → Task 4 Step 1；R5 → Task 6 Step 1；R6 → Task 9 Step 3/4；R7 → Task 1；R8 → Global 8 + Task 5 Step 1 + H53；R9 → Task 9 Step 1/2。§11.3 码表 → Task 3/4/5/6/7 各分支；§11.5 十三行「测什么」→ 附录 A 55 条逐条；§11.6 D1–D9 → D1（Task 3）、D2（Task 5）、D3（Task 3/6）、D4（Task 1/9）、D5（Task 9 Step 3）、D6（Task 9 Step 1/2）、D7（Global 14）、D8（Global 1 + Task 4）、D9（Task 3 H07 形态 b）；§11.7 Q1–Q20 → 各 Task Step 内逐条标注（Q1→Task 7、Q2→Task 9 Step 4、Q3→Global 9、Q5→Task 4/6、Q6→Task 2/9、Q7→Task 7、Q8/Q12→Task 4、Q9→Task 1、Q10/Q19→Task 9 Step 2、Q11→Global 13、Q13→Task 3 Step 2、Q14→Task 3、Q15→Task 6、Q16→Task 10 Step 1/6、Q17→Task 10 备注、Q18→Task 3、Q20→Task 9 Step 4）；§11.10 八锚点 → 锚点1（H02–H54 各条）、锚点2（H06/H50）、锚点3（H27/H28/H50/H55）、锚点4（H49）、锚点5（H37–H40）、锚点6（H46–H48）、锚点7（H41–H45）、锚点8（H51）。**无缺口**。

**2. 占位扫描**：`TBD` / `待定` / 「适当处理」= 0 处；`TODO` 共 7 处命中**全部是既定用法**（TAP 内联正则 `(SKIP|TODO)` 与 `probe-todo-Y` 探针用例名），非占位。计划门签行已由审计本人填毕、不在本文件留任何待填占位（签行原文见 `gate-record.md` 的 `②→③@S3` 行）。

**3. 类型一致**：`runObservationGate()` 无参（Task 3 定义 / Task 9 调用 / Task 10 Step 6 直调）一致；`formatGateLine(res)` 入参四字段（Task 2 定义 / Task 9 Step 4 调用）一致；`disposeCardFindings(findings, { landed })` 返回 `{warnings, blockers}`（Task 1 / Task 9 Step 4 消费）一致；`SKIP_ALLOWLIST` 为字符串数组（Task 9 Step 1 定义 / Step 2 消费 / Task 10 Step 5 断言）一致；`scanReviewDir(dirName, files)` 入参形状（Task 4）与 `gate-scan.mjs:20` 一致。

**4. R4（无新增设计）**：本文档无 `## 新增设计决策` 节；所有「怎么做」均可回指 spec 行号（Step 内已逐条标注）。若施工期发现 spec 未定义的东西 → **回 ② 段重审 spec**，不得在 plan 里补（判据出处 = `rules/dev-workflow-mainline.md` R4 与 PRD §6；spec §11.9 只声明「不取代任何 spec」，不含该义务）。

**5. 命令符号可核（`stage-2b-plan-gate.md:55` 常见漏项）**：本 plan 引用的符号全部已 grep 过——`tools/observation-check/gate-scan.mjs:2`（export 行起）/ `:20`（`scanReviewDir`）、`tools/observation-check/artifact.mjs:84`、`tools/observation-check/registered-ids.mjs:5`、`tools/observation-check/evidence.mjs:39`、`tools/observation-check/checks.mjs:157`、`scripts/check-all.mjs`:43/45/71-95/366/368-373、`tools/docgen/test/dev-workflow-files.test.mjs:100/:262`（skip 名原文）、`tools/docgen/test/policy-pure-source.test.mjs:1580`（`*-s6-eval` 不变量）。`agents/*.md` = 15（实跑）。施工后才存在的符号（`runObservationGate` / `formatGateLine` / `EXEMPT_CARDS` / `SKIP_ALLOWLIST`）均在 Task 内定义为产出物，已标「由哪个任务产出」。
