# S-B 契约层实现计划（`issue-card` 三列证据 + 引句校验器 + 卡面策略指针）

> **For agentic workers:** REQUIRED SUB-SKILL：用 `subagent-driven-development`（推荐，逐任务派新子代理）或 `executing-plans` 执行本计划。步骤用 `- [ ]` 勾选框跟踪。
> **⚠️ 本仓特有前置**：动手前先读 `rules/` 的「开发工作流主干」与 `skills/dev-workflow/references/gate-record.md`；本段出口要补 `③@S-B` / `④@S-B` / `⑤@S-B` 行。
> **本计划零设计决策**：每条做法都可指回 spec 的节号或用例 ID；发现 spec 未定义的东西 → **停下回流 ② 段**（`dev-workflow-mainline` R4），不得在本计划里补设计。

**Goal:** 把「证据形式」和「策略归属」两件事从自由文本换成已注册契约 + 校验器：`issue-card` 证据栏 1 列 → 3 列（复用 `evidence.fields`）；引句真实性落到可跑脚本 `check-quotes.mjs`；2 张卡的策略清单改为「档位 + 指针」；`duty.categories` 收敛为单源；新增 `check-case-assert.mjs` 判映射非空心。

**Architecture:** 契约面改 `components/outputFormats.mjs`（字段派生）+ `card-model/vocab/card-contract.mjs`（`FORMAT_CHECKS`）；校验面新增两个独立脚本（`check-quotes.mjs` / `check-case-assert.mjs`，均不进 `npm run check`，理由见 spec §11.1 R3）；卡面面改 `templates/boundary.md.tpl` 4 行文案 + `renderBoundary.mjs` 5 个槽值与白名单 + `renderCard.mjs` 去掉 `关注类别：` 行 + `seatLoader.mjs` 注入 `duty.categories`。

**Tech Stack:** Node ESM（无构建）、`node --test`（TAP）、`tools/docgen/cli.mjs` 六子命令、PowerShell 5 执行环境。

**Spec:** `docs/superpowers/specs/2026-11-03-s-b-contract-layer-design.md`（§11.0 为什么 / §11.1 R1–R12 / §11.2.1–11.2.8 / §11.3 / §11.4 十条硬约束 / §11.5 / §11.6 / §11.9）
**Testcase:** `docs/superpowers/specs/2026-11-03-s-b-contract-layer-design-testcase.md`（41 条：正 14 / 负 19 / 边界 8）
**PRD（只引用编号，不抄正文）:** `docs/prd/20261102212627-card-data-contract-and-proof/index.md` §2 D11·D13·D14、§3 Q3·Q6、§4 V6·V7·V8、§5、§8

## Global Constraints

- **卡面是生成物**：`agents/*.md` 只由 `node tools/docgen/cli.mjs generate` 产出，**禁止手改**。
- **本段改动面 = 15 张卡**（不是因为边界段，而是因为删「关注类别：」行；13 席只少这一行）——spec §11.3 / §11.2.7-2。
- `issue-card.fields` 的 3 个证据列**派生自** `evidence.fields`（禁抄字面）；`evidence.fields` 本身不动 —— spec §11.2.1。
- `outputFormats` 侧只改 `issue-card.checks[0]`；`card-contract` 侧改 `FORMAT_CHECKS[1]` 且**仍 3 条**、每条含「废卡」与「缺 / 空」 —— spec §11.2.1 / R9。
- 边界段**保留 12 槽**，只改 5 个槽值 + 4 行文案；`SLOTS` 顺序不动 —— spec §11.2.3。
- 指针只写**策略符号名**，不写仓内文件路径；被指针化的 4 行内不得出现路径形态 —— spec §11.1 R6 / §11.4-9。
- 模板纯度：新出现的反引号项登记进 `TEMPLATE_ALLOWED_LITERALS`；白名单**不得**登记清单类成员；新文案里的 `spec` / `plan` **不加反引号** —— spec §11.2.3。
- `duty.categories` 从数据源删、**loader 装配期注入**（与 `duty.trigger` 同处同趟）；装配后 `card` 仍 8 键；卡面**不再渲染**该行 —— spec §11.2.4 / R7 / R8。
- `CARD_MODEL_CODES` 仍 **36 码**、`SCAN_FIELDS` 仍 **8 键**；新码只进 `validateAgentData.mjs` 的 `EXIT` 表 —— PRD §5。
- 两个新脚本**不进** `npm run check`；腐化风险落 `docs/after/`（spec §11.7 要求）。
- `baseline 38/38` **不作判据**（同式自除恒真）；判据只认 `gate` exit 0 + 15 席逐字节。
- 改任一判据级口径后：重 touch 当次 `impact-sheet.md` 再跑 `node scripts/scope-sweep.mjs --check` —— R8。
- 每任务一 commit（用户 2026-11-03 裁定）。

## 执行顺序与门

| 门 | 何时 | 判据 |
|---|---|---|
| 计划门（不设议会） | 本计划写完、开工前 | `check-plan deps` / `map` / `size` 三绿 + 独立审计核「功能点覆盖 / 依赖无环 / 用例一一映射 / plan 零新增设计决策」 |
| ③ 施工出口 | 9 个任务全完 | `npm run check` exit 0、`gate` exit 0、两个新脚本 exit 0、15 席 SHA 与 S-B 基线表一致 |
| ④ 质量 | ③ 后 | 41 条用例逐条有结论、负+边界 ≥ 正、漂移定性 |
| ⑤ 交付 | ④ 后 | 交付物逐条 + 数字复算 + 未完成项落点 |

---

## File Structure（先锁定职责，再拆任务）

| 文件 | 动作 | 职责（一句话） |
|---|---|---|
| `tools/docgen/test/support/dev-workflow-checks.mjs` | 改 | Task 0：`withRepoCopy` 的 `cpSync` 偶发 ENOENT（S-A-Q-4 升必修） |
| `docs/superpowers/reviews/2026-11-03-<次名>/observation-r1.json` + 同名 `.md` | 建 | Task 1：真实观察记录（≥2 条 `items[].evidence`），同时充当 V6 语料 |
| `tools/docgen/check-quotes.mjs` | 建 | Task 2：PRD V6 校验器（复用 `checkEvidence`，语料 `K < 2` 即红） |
| `tools/docgen/components/outputFormats.mjs` | 改 | Task 3：`issue-card` 9 列（证据三列派生）+ `checks[0]` 文案 |
| `tools/docgen/card-model/vocab/card-contract.mjs` | 改 | Task 3：`FORMAT_CHECKS[1]` 改三列口径（仍 3 条） |
| `tools/docgen/components/seatLoader.mjs` | 改 | Task 4：注入 `duty.categories`；拒载 `DutyCategoryMisplaced` |
| `tools/docgen/components/validateAgentData.mjs` | 改 | Task 4：`EXIT[1]` 追加 1 码 |
| `tools/docgen/components/renderCard.mjs` | 改 | Task 4：`dutyBlock` 不再渲染「关注类别：」 |
| `tools/docgen/templates/boundary.md.tpl` | 改 | Task 5：4 行文案改指针句 |
| `tools/docgen/components/renderBoundary.mjs` | 改 | Task 5：5 个槽值改指针串 + 白名单登记 4 符号名 |
| `tools/docgen/data/seats/*.json` ×15 | 改 | Task 4：删 `card.duty.categories` |
| `tools/docgen/fixtures/*.evidence.json` ×15 | 改 | Task 6：`renderSha256` 全量重记 |
| `docs/reports/2026-11-03-s-b-card-sha-baseline.md` | 建 | Task 6：S-B 冻结基线（15 席 SHA，对照 S-A 那张） |
| `tools/docgen/test/sb-contract-layer.test.mjs` | 建 | 41 条用例的落点（SB-TC-01…41） |
| 已签断言 5 文件（见 Task 8） | 改 | Task 8：必红清单逐条改写（保留可红形态） |
| `tools/docgen/check-case-assert.mjs` | 建 | Task 7：PRD V7 校验器（`hollow` / `missing`） |

---

### Task 0: 修 `withRepoCopy` 的偶发 ENOENT（S-A-Q-4 升必修）

**Files:** 改 `tools/docgen/test/support/dev-workflow-checks.mjs`

> **出处**（本任务不在 spec 内，属跨段承接）：`docs/after/20261103164513-s-a-quality-open-items-open-decisions.md:13`（S-A-Q-4 的「该做」= 重试或按需拷贝）+ 用户 2026-11-03 裁定「升必修，落 Task 0」。改法二选一即出自该条，非本计划新增设计。

- [ ] **Step 1: 复现**：连跑 5 次 `node --test tools/docgen/test/sa-data-layer.test.mjs`，记录是否出现 `cpSync … ENOENT`（出现过就贴输出；未出现则记「未复现」并继续，判据仍按修法落地）
- [ ] **Step 2: 改**：`cpSync` 包一层重试（失败一次后 `rmSync` 目标目录再复制），或把 `docs/agents` 改成按需拷贝——二选一，在代码注释写清选了哪个与为什么
- [ ] **Step 3: 验**：`node --test tools/docgen/test/sa-data-layer.test.mjs` → `# fail 0`；再连跑 3 次同值
- [ ] **Step 4: 提交**：`fix(docgen): withRepoCopy 复制失败重试（S-A-Q-4 升必修）`

**验收：** 上述 3 次连跑均 `# fail 0`。
**Consumes:** 无
**对应用例：** 无（基础设施修复，不承接 SB-TC）

---

### Task 1: 造 V6 语料（施工第 1 步）

**Files:** 建 `docs/superpowers/reviews/2026-11-03-<次名>/observation-r1.json` + 同名 `.md`

- [ ] **Step 1: 写测试（先红）**：在 `tools/docgen/test/sb-contract-layer.test.mjs` 写 `SB-TC-04` —— 判「语料件存在 + `items` 中带 `evidence` 的项 ≥2 + json 与 md 成对 + 过 ⑥ 段四道」
- [ ] **Step 2: 跑**：`node --test --test-name-pattern "SB-TC-04" tools/docgen/test/sb-contract-layer.test.mjs` → 应 red（文件不存在）
- [ ] **Step 3: 造记录**：在 `.session/reviews/2026-11-03-<次名>/` 用 `tools/observation-check/` 的写入器生成 json+md 一对；`items` 里 **≥2 条 `verdict: hit` 且每条带 `{path,line,quote}`**（quote 逐字取自源文件该行）；`coverage` 三段对账（`read + skipped = total`）
- [ ] **Step 4: 自校验**：过 `MissingEvidence` / `RenderMismatch` / coverage 三道；不通过就改到通过
- [ ] **Step 5: 归档**：把**这一对**整移到 `docs/superpowers/reviews/2026-11-03-<次名>/`，`git add` 两个文件（写入器不允许直写归档目录）
- [ ] **Step 6: 跑**：同 Step 2 → green；`npm run check` 的 ⑥ 段不得新增 findings
- [ ] **Step 7: 提交**：`test(observation): S-B 语料件（observation-r1 一对）`

**验收：** `node --test --test-name-pattern "SB-TC-04" …` 绿 + `npm run check` ⑥ 段 `findings 0`。
**Consumes:** 无
**对应用例：** SB-TC-04

---

### Task 2: `check-quotes.mjs`（PRD V6）

**Files:** 建 `tools/docgen/check-quotes.mjs`；测试同上文件

- [ ] **Step 1: 写测试（先红）**：`SB-TC-03`（绿态：`files <N> / evidence <K> / bad 0 => ok`、exit 0）、`SB-TC-15/16/17/18/39`（五种红态：摘句不在文件 / 行号不含摘句 / 行号越界 / `K = 0` / `K = 1`，均 exit 1）、`SB-TC-29`（只吃 `.json`、畸形 json 抛错不跳过）、`SB-TC-30`（结构行由 `checkEvidence` 判红，不另写一套）
- [ ] **Step 2: 跑** → 全 red（脚本不存在）
- [ ] **Step 3: 实现**：扫 `docs/superpowers/reviews/**/observation-*.json`（文件名口径复用 `gate-scan.mjs` 的 `ARTIFACT_RE`），对 `items[]` 里带 `evidence` 的项逐个调 `checkEvidence()`；`K < 2` 打印 `check-quotes: 语料 <K> 条（需 ≥2，fail-closed）` 并 exit 1；全绿打印首行 `check-quotes: files <N> / evidence <K> / bad 0 => ok`
- [ ] **Step 4: 跑** → 绿
- [ ] **Step 5: 落腐化登记**：在 `docs/after/` 已有文件里补一条（或新建）——「`check-quotes` 不进总门禁；触发 = 下次改 ⑥ 段或语料件降到 1 份」
- [ ] **Step 6: 提交**：`feat(docgen): check-quotes.mjs 引句校验器（PRD V6）`

**验收：** `node tools/docgen/check-quotes.mjs` 首行 `check-quotes: files <N> / evidence <K> / bad 0 => ok`，exit 0；清空语料后 exit 1。
**Consumes:** Task 1
**对应用例：** SB-TC-03 / 15 / 16 / 17 / 18 / 29 / 30 / 39 / 14

---

### Task 3: `issue-card` 三列 + 两处 checks 文案

**Files:** 改 `components/outputFormats.mjs`、`card-model/vocab/card-contract.mjs`

- [ ] **Step 1: 写测试（先红）**：`SB-TC-01`（证据三列与 `evidence.fields` `deepEqual` + `length === 9`）、`SB-TC-02`（改 `evidence.fields` 一处，`issue-card` 必跟随）、`SB-TC-23`（抄字面版本必红）、`SB-TC-10`（`FORMAT_CHECKS` 仍 3 条且每条含「废卡」/「缺空」）、`SB-TC-22`（改成 2 条或 4 条必红）
- [ ] **Step 2: 跑** → red
- [ ] **Step 3: 实现**：`fields: [...HEAD, ...evidence.fields, ...TAIL]`；`issue-card.checks[0]` 改「证据三列（原文摘句 / 文件 + 行号 / 用途）缺任一 = 废卡，三列须由 check-quotes 验真」；`FORMAT_CHECKS[1]` 同义改写（仍含「废卡」「空」）
- [ ] **Step 4: 跑** → 绿；`node --test tools/docgen/test/card-render.test.mjs` 仍绿（`S4-TC-D01` 的「无指针」断言）
- [ ] **Step 5: 提交**：`feat(docgen): issue-card 证据三列派生 + FORMAT_CHECKS 三列口径`

**验收：** 上述 5 条用例绿 + `card-render.test.mjs` 无 `# fail`。
**Consumes:** 无
**对应用例：** SB-TC-01 / 02 / 10 / 22 / 23

---

### Task 4: `duty.categories` 单源（注入 + 拒载 + 不再渲染）

**Files:** 改 `data/seats/*.json` ×15、`components/seatLoader.mjs`、`components/validateAgentData.mjs`、`components/renderCard.mjs`

- [ ] **Step 1: 写测试（先红）**：`SB-TC-07`（装配产物逐席与 `categories[].label` `deepEqual`；席文件无该键）、`SB-TC-20`（席文件写非空 → `exitCodeFor('DutyCategoryMisplaced') === 1` 且 stderr 首行起码）、`SB-TC-33`（loader 仍 8 键 / `buildCards()` 仍 12 键）、`SB-TC-34`（注入 = `label` 原样，不做字符串变换）
- [ ] **Step 2: 跑** → red
- [ ] **Step 3: 改数据**：15 份席 JSON 删 `card.duty.categories`（用脚本批量删，禁手抄）
- [ ] **Step 4: 实现**：`seatLoader.mjs` 注入 `duty.categories = card.categories.map(c => c.label)`（与 `duty.trigger` 同处同趟）；非空即抛 `DutyCategoryMisplaced`；`validateAgentData.mjs` 的 `EXIT[1]` 追加该码；`renderCard.mjs` 的 `dutyBlock` 删「关注类别：」分支
- [ ] **Step 5: 跑** → 绿
- [ ] **Step 6: 提交**：`feat(docgen): duty.categories 单源（loader 注入 + DutyCategoryMisplaced）`

**验收：** 4 条用例绿 + `node tools/docgen/check-shared-refs.mjs` 仍 `keySet8 15 / keySet12 15`。
**Consumes:** 无
**对应用例：** SB-TC-07 / 20 / 33 / 34

---

### Task 5: 卡面「档位 + 指针」（模板 4 行 + 5 个槽值）

**Files:** 改 `templates/boundary.md.tpl`、`components/renderBoundary.mjs`

- [ ] **Step 1: 写测试（先红）**：`SB-TC-05`（`逐项点名` = 0 + 4 符号名各 ≥1，**只判那 2 张卡**）、`SB-TC-13`（模板跑 `assertTemplatePure` 不抛 + 自组装清单集与白名单交集为空 + 白名单 size === 12）、`SB-TC-19`（回填一句 → 判红）、`SB-TC-24`（**只判被指针化的那 4 行**，仓内路径形态 = 0，且取到行数 = 4）、`SB-TC-27/28`（白名单不得登记清单类成员 / 删登记即红）、`SB-TC-31`（段首与语义句 12 组锚）、`SB-TC-35`（`policy/definitions/*.mjs` 里 4 个符号各恰 1 行 `export const`）、`SB-TC-40`（2 卡的「命令默认拒绝」句含本席组 ID）、`SB-TC-41`（`env.assign` 形态项命中 = 0）
- [ ] **Step 2: 跑** → red
- [ ] **Step 3: 改模板 4 行**：禁写路径 / 命令白名单（含本席组 ID）/ 禁止命令 + env / 检测盲区，文案按 spec §11.2.3 表；**删掉「逐项点名」字样**
- [ ] **Step 4: 改 5 个槽值**：`forbiddenPaths()` / `allowGroups()` / `forbiddenGroups()` / `envForms()` / `detectionPaths()` 返回指针句（保留 12 槽与 `SLOTS` 顺序）；4 个符号名登记进 `TEMPLATE_ALLOWED_LITERALS`
- [ ] **Step 5: 跑** → 绿；`assertTemplatePure()` 不抛
- [ ] **Step 6: 提交**：`feat(docgen): 卡面边界段策略清单指针化（5 槽 / 12 槽不变）`

**验收：** 上述用例绿；`node -e` 不出现（本任务判据全走 `node --test`）。
**Consumes:** 无
**对应用例：** SB-TC-05 / 13 / 19 / 24 / 27 / 28 / 31 / 35 / 40 / 41

---

### Task 6: 重生成 15 卡 + 15 份 evidence + 冻结基线（一次做完）

**Files:** 改 `agents/*.md` ×15（生成）、`fixtures/*.evidence.json` ×15；建 `docs/reports/2026-11-03-s-b-card-sha-baseline.md`

- [ ] **Step 1: 记基线**：`BASE=$(git rev-parse HEAD)` + 15 席 SHA256（写入当次账本）
- [ ] **Step 2: 写测试（先红）**：`SB-TC-06`（`gate` exit 0 + `git diff --stat $BASE -- agents/` = 15 files + 15 份 evidence 哈希一致）、`SB-TC-25`/`SB-TC-32`（**位置型三段**：每席恰 1 条 `关注类别：` 删行在「职责」段；非指针 13 席其余增删只在「输出格式」段；指针 2 席「边界」段至少 1 增 1 删）、`SB-TC-08`/`SB-TC-37`（`关注类别：` = 0 且 `类别：` ≥ 15，两向判别力）、`SB-TC-26`（三条红态：`BaselineDrift` / 幂等就地改写 / `--expect-change`）
- [ ] **Step 3: 跑** → red（卡面未重生成）
- [ ] **Step 4: 生成**：`draft --kind agent --name <席>` ×15，再逐席 `replace --kind agent --name <席> --draft <草稿> --yes --expect-change <新渲染 sha256> --rejudge A1` ×15（`generate` 只比不写，**不能**当写盘通路；A1 判者 = 独立于施工者的子代理，见 spec §11.2.7 第 2 步）
- [ ] **Step 5: 重记 evidence**：由 `replace` 同批写回 15 份 `fixtures/<席>.evidence.json` 的 `renderSha256` / `lastWrittenHash` 与 `changes`（**禁手改**）
- [ ] **Step 6: 落冻结基线**：15 席 SHA 写 `docs/reports/2026-11-03-s-b-card-sha-baseline.md`（对照 S-A 那张，注明「15/15 全变；三分类 = 2 席 `0/−1` / 11 席 `+7/−6` / 2 席 `+4/−5`」，见 spec §11.2.7 第 4 步）
- [ ] **Step 7: 跑**：`node tools/docgen/cli.mjs gate` → exit 0；用例全绿
- [ ] **Step 8: 提交**：`chore(docgen): S-B 重生成 15 卡 + 15 份 evidence + 冻结基线`

**验收：** `gate` exit 0；`git diff --stat $BASE -- agents/` = `15 files changed`；15 席 SHA 与本任务 Step 6 的表逐行相等。
**Consumes:** Task 4, Task 5
**对应用例：** SB-TC-06 / 08 / 25 / 26 / 32 / 37

---

### Task 7: `check-case-assert.mjs`（PRD V7）

**Files:** 建 `tools/docgen/check-case-assert.mjs`；测试同上文件

- [ ] **Step 1: 写测试（先红）**：`SB-TC-09`（跑 S-A 那对已签件 → `ids 30 / hollow 0 / missing 0`，且 ID 集合 `deepEqual` 30 个 `TC-\d{3}`）、`SB-TC-21`（四种恒真注入 `assert.ok(true)` / `assert.ok( true )` / `assert.ok(1)` / `assert.ok('1')` 均 `hollow`）、`SB-TC-38`（删用例体 → `missing`，与 `hollow` 不混算）
- [ ] **Step 2: 跑** → red
- [ ] **Step 3: 实现**：从 plan 里**表头含「用例」的那张表**取 ID（`TC-\d{3}` / `S\d+-TC-[A-Z]\d\d`，去重）；逐 ID 在 testcase 里定位用例体；断言「体内 ≥1 条 `assert.*`，且不是恒真（参数 `trim()` ∈ `{true,1,'1'}`）」；输出 `ids <N> / hollow <K> / missing <M>`
- [ ] **Step 4: 跑** → 绿（对 S-A 那对：`ids 30 / hollow 0 / missing 0`）
- [ ] **Step 5: 提交**：`feat(docgen): check-case-assert.mjs 映射非空心校验器（PRD V7）`

**验收：** 对 S-A 已签件的命令 exit 0 且首行 `ids 30 / hollow 0 / missing 0 => ok`。
**Consumes:** 无
**对应用例：** SB-TC-09 / 21 / 38

---

### Task 8: 同批改写已签断言 + 收口

**Files:** 改 `test/sa-data-layer.test.mjs`、`test/policy-pure-source.test.mjs`、`test/tool-tiers.test.mjs`、`test/s2-card-rewrite.test.mjs`、`test/support/capability-baseline.mjs`、`fixtures/capability-baseline.json`、`docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md`（只加注）

- [ ] **Step 1: 逐条实跑**：`node --test tools/docgen/test/sa-data-layer.test.mjs tools/docgen/test/policy-pure-source.test.mjs tools/docgen/test/tool-tiers.test.mjs tools/docgen/test/s2-card-rewrite.test.mjs` → 记下红因
- [ ] **Step 2: 按红因改**（spec §11.2.6 的必红清单，逐行对）：
  - [ ] `TC-006`：「逐项点名」行不存在（**不是**「20 项」）
  - [ ] `TC-025`：`lessons/` 从卡面消失（**不是**「20 项」）
  - [ ] `policy-pure-source`：切片锚改「指针句在位」、`marks` 去「逐项点名」、`expanded === 12` 不变、fixture 12 槽基线重记
  - [ ] `tool-tiers`：改为「指针句在位 + 定义层成员数不变」
  - [ ] `s2-card-rewrite`：`S2-TC-A06` 仍 3 条；`S2-TC-C09③` 第五项改「`categories[].label`（`类别：` 行）影响卡面」
  - [ ] S-A spec 就地加注「S-B 指针化后此句失效」（不改结论）
- [ ] **Step 3: 跑**：上述 4 个测试文件 `# fail 0`；`SB-TC-12` / `SB-TC-36` 绿（改坏的版本仍红）
- [ ] **Step 4: 全门禁**：`npm run check`（`# fail 0` + 末行 `check 全部通过`）、`node tools/docgen/cli.mjs gate`（exit 0）、`node tools/docgen/check-quotes.mjs`（exit 0）、`node tools/docgen/check-case-assert.mjs …`（exit 0）、`node scripts/scope-sweep.mjs --check`（exit 0）、`node scripts/check-gate-record.mjs`（`bad 0`）
- [ ] **Step 5: 提交**：`test(docgen): 同批改写 S-B 必红的 5 处已签断言 + 收口门禁`

**验收：** 步骤 4 的六条命令全 exit 0。
**Consumes:** Task 2, Task 3, Task 4, Task 5, Task 6, Task 7
**对应用例：** SB-TC-11 / 12 / 36

---

## 附录 A：用例 → 任务映射（`check-plan map` 的输入表）

| 用例 ID | 落在 Task | 说明 |
|---|---|---|
| SB-TC-01 | Task 3 | 三列相等 |
| SB-TC-02 | Task 3 | 派生跟随 |
| SB-TC-03 | Task 2 | 引句校验器绿态 |
| SB-TC-04 | Task 1 | 语料件过 ⑥ 段 |
| SB-TC-05 | Task 5 | 卡面清单消失 + 符号名在位 |
| SB-TC-06 | Task 6 | 15 files + evidence 哈希 |
| SB-TC-07 | Task 4 | `duty.categories` 单源 |
| SB-TC-08 | Task 6 | `关注类别：` = 0 |
| SB-TC-09 | Task 7 | `ids 30 / hollow 0 / missing 0` |
| SB-TC-10 | Task 3 | `FORMAT_CHECKS` 仍 3 条 |
| SB-TC-11 | Task 8 | 全仓门禁 |
| SB-TC-12 | Task 8 | 已签测试改写后仍可红 |
| SB-TC-13 | Task 5 | 模板纯度 + 白名单 |
| SB-TC-14 | Task 2 | 不进总门禁 + 腐化落点 |
| SB-TC-15 | Task 2 | 摘句不在文件 |
| SB-TC-16 | Task 2 | 行号不含摘句 |
| SB-TC-17 | Task 2 | 行号越界 |
| SB-TC-18 | Task 2 | `K = 0` |
| SB-TC-19 | Task 5 | 回填一句 → 红 |
| SB-TC-20 | Task 4 | `DutyCategoryMisplaced` |
| SB-TC-21 | Task 7 | 四种恒真形态 |
| SB-TC-22 | Task 3 | `FORMAT_CHECKS` 条数 |
| SB-TC-23 | Task 3 | 抄字面必红 |
| SB-TC-24 | Task 5 | 4 行内无仓内路径 |
| SB-TC-25 | Task 6 | 13 席只少一行 |
| SB-TC-26 | Task 6 | 三条红态（`BaselineDrift` 等） |
| SB-TC-27 | Task 5 | 白名单不得含清单类成员 |
| SB-TC-28 | Task 5 | 白名单删登记即红 |
| SB-TC-29 | Task 2 | 只吃 `.json` |
| SB-TC-30 | Task 2 | 复用 `checkEvidence` |
| SB-TC-31 | Task 5 | 12 组段锚 |
| SB-TC-32 | Task 6 | 15 files 变更面 |
| SB-TC-33 | Task 4 | loader 8 键 / 12 键 |
| SB-TC-34 | Task 4 | 注入即 `label` 原样 |
| SB-TC-35 | Task 5 | 4 符号各恰 1 行定义 |
| SB-TC-36 | Task 8 | 改坏即绿的反面 |
| SB-TC-37 | Task 6 | 两向判别力 |
| SB-TC-38 | Task 7 | `missing` |
| SB-TC-39 | Task 2 | `K = 1` |
| SB-TC-40 | Task 5 | 2 卡组 ID 在位 |
| SB-TC-41 | Task 5 | env 槽已指针化 |

**计数自检**：41 行 = 41 个唯一 ID（脚本 `check-plan map` 复算，`missing 0 / dangling 0`）。

---

## 执行记录

| 任务 | 状态 | 提交 | 备注 |
|---|---|---|---|
| Task 0 | 待开工 | — | 前置：S-A-Q-4 升必修（用户 2026-11-03 裁定） |
| Task 1 | 待开工 | — | 施工第 1 步（语料） |
| Task 2–8 | 待开工 | — | 按 Consumes 顺序执行 |
