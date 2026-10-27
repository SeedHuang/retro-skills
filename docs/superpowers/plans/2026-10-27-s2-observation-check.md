# S2 观察产物校验器（observation-check）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把仓库外草稿区（`C:\Users\HuangChunhua\.retro-skills\observation-check-draft\`，11 文件 / 71 测试）原样收进 `tools/observation-check/`，再补齐 PRD §4 的判据差距与最小 CLI，使 spec §10.8 七锚点全部可机器验收。

**Architecture:** 两阶段提交——①「迁入提交」只新增 11 个文件（sha256 清单写进 commit message，作为原样性数字锚）；②「改造提交起」把 root 收敛为 `git rev-parse --show-toplevel` 单源、证据夹具改为 `mkdtempSync` 自建、四段校验链（结构 / 证据 / 渲染 / 写盘）补齐判据差距，并新增 `cli.mjs`、`registered-ids.mjs`、`gate-scan.mjs` 与 golden 夹具。渲染与校验共用 `tools/execution-matrix/markdown-rows.mjs` 的 `splitRow` 单源。

**Tech Stack:** Node.js ≥ 22（`node:test` / `node:assert/strict` / `node:fs` / `node:child_process`）、PowerShell（仓库侧命令）、无第三方依赖。

**Spec:** `docs/superpowers/specs/2026-10-27-s2-observation-check-design.md`（86 行，SHA256 `683EA135416B85A5E13BA5C5314CB7E9F4D48EEE1EC4C226C2FD010B12BFED0E`）

**Testcase:** `docs/superpowers/specs/2026-10-27-s2-observation-check-design-testcase.md`（69 条 = 26 正 / 38 负 / 5 边界；本 plan 另加议会派工的 B19，见 Task 9 → 70 条）

## Global Constraints

以下每一条对**每个任务**隐含生效（值逐字取自 spec §10.1–§10.3 / PRD §4）：

1. **原样迁入**：迁入提交 diff 只有 11 个 `A`，零 `M`/`D`/`R`；sha256 清单载体 = **该提交的 commit message**（不新增第 12 个文件）；清单值 = 迁入瞬间草稿区 `Get-FileHash` 实算值，此后一律经 `git show <迁入提交>:<path>` 复算。
2. **基线不退**：改造后 `# tests ≥ 71`、`# fail 0`；测试对 `agents/` 引用 = 0；终验 = 临时移走 `agents/detective-observer.md` 后仍全绿。
3. **root 单源**：解析根唯一来源 = `git rev-parse --show-toplevel`，**公开接口不出现 `root` 参数**；取不到 → `RepoRootUnresolved`（fail-closed，不得以 `process.cwd()` 兜底）。禁止 `skipSensitive` / `--allow-sensitive` / 多根 / 归档目录级豁免。
4. **归档只读**：`docs/superpowers/reviews/**` 不接受 `writeObservation` / `rewrite` 写入（命中即 `ArtifactPathOutside`）。
5. **仓门禁不红**：每个任务收尾 `npm run check` exit 0（当前基线 `# tests 736 / # pass 734 / # fail 0 / # skipped 2`）。
6. **R8 回扫**：改任一判据级口径（验收判据 / 权限语义 / 错误码 / 计数口径 / 命名）当批必须 `node scripts/scope-sweep.mjs --check` → exit 0（`sweep ok`）。**禁用** `npm run doc:sweep -- --check`。
7. **禁放宽断言**：改造提交 diff 中「被删除且含 `assert`」的行数 = 0；测试文件名集合 ⊇ 迁入集（`git diff --diff-filter=D` 为空 + `git ls-tree` 文件名超集）。
8. **测试落点**：`tools/observation-check/*.test.mjs`，**无 `test/` 子目录**；夹具一律 `mkdtempSync(join(repoRoot(), '.session/reviews/test-obs-check-'))` 自建、`test.after` 内 `rmSync` 清理；**任何测试不得引用仓库既有文件作为证据**。
9. **两态标注**：任何「已实现」字样必须随 `path:line` 出现并注明未实现面；本 plan 内提及草稿行号只作导航。
10. **Windows 环境**：命令一律 PowerShell 形式；测试进程内不得调用 `Get-FileHash` 等 cmdlet（用 `node:crypto`）。

## 文件结构

| 路径 | 动作 | 职责 |
|---|---|---|
| `tools/observation-check/checks.mjs` | 迁入 + 改造 | `validateObservation`（结构 + 七条覆盖对账）、`renderObservation`、`checkRendered`、`checkPrerequisites` |
| `tools/observation-check/evidence.mjs` | 迁入 + 改造 | 证据七道 + `repoRoot()`（root 单源） |
| `tools/observation-check/artifact.mjs` | 迁入 + 改造 | `validateArtifact` / `validateArtifactExitCode` / `writeObservation`（唯一写盘入口）、原子写、目的地判据 |
| `tools/observation-check/cli.mjs` | **新建** | 单件校验 + `rewrite`（草稿区无此文件，不进 sha256 清单） |
| `tools/observation-check/registered-ids.mjs` | **新建** | `registeredIds` 单源常量（S2 期） |
| `tools/observation-check/gate-scan.mjs` | **新建** | PRD §5.2 三态判定纯函数 + 目录白名单 / 8 类允许文件名 / 9 精确路径白名单 |
| `tools/observation-check/render.mjs` / `data.mjs` | 迁入（仅剥 demo 循环） | 卡面 / README 两投影的数据与渲染（I 组冒烟对象） |
| `tools/observation-check/golden/observation-r3.json` | **新建** | golden 输入（全形态覆盖：hit / miss / na / open / skipped） |
| `tools/observation-check/golden/observation-r3.expected.md` | **新建** | 人工确认的期望渲染全文（D05 逐字断言） |
| `tools/observation-check/baseline.test.mjs` | **新建** | A01–A03 / A05 / F01 / F02 / F04（一次性提交审计 + 静态扫描） |
| `tools/observation-check/coverage.test.mjs` | **新建** | B07–B14 / B19 / F03（七条对账 + 禁放宽计数） |
| `tools/observation-check/golden.test.mjs` | **新建** | D05–D07 |
| `tools/observation-check/cli.test.mjs` | **新建** | E02 / E08–E14 |
| `tools/observation-check/gate-scan.test.mjs` | **新建** | G03–G05 |
| `tools/observation-check/render.test.mjs` | **新建** | I01 / I02 |
| `tools/observation-check/{checks,evidence,artifact,write,render-check,adversarial}.test.mjs` | 迁入 + 改造 | 旧 71 条意图保留 + 新增 B/C/D/E/H 组用例 |

## 接口小节（公开面）

**公开导出（判据面 5 个主函数）**

```js
// checks.mjs
validateObservation(doc, { registeredIds, resolveEvidence = null }) → { errors: [{ code, message, path }] }
renderObservation(doc) → string                     // 首行恒为 `<!-- observation-md v1 -->`
checkRendered(doc, mdText) → { ok: true } | { ok: false, code: 'RenderMismatch', detail }
checkPrerequisites(requires, providedIds) → { ok, missing, errors }

// evidence.mjs
checkEvidence(ev, { read? }) → { ok: true } | { ok: false, code, detail }

// artifact.mjs
validateArtifact(jsonPath, { registeredIds }) → { ok, errors }
validateArtifactExitCode(jsonPath, { registeredIds }) → 0 | 1
writeObservation(doc, { jsonDir, registeredIds }) → { ok, wrote, errors }
```

**内部导出（仅本目录内消费，不属公开面）**

```js
// evidence.mjs
repoRoot() → string                                  // 抛 e.code = 'RepoRootUnresolved'
// artifact.mjs
resolveWriteTarget({ jsonDir, name }) → { jsonPath, mdPath } | { error: { code, message } }
// gate-scan.mjs
scanReviewDir(dirName, files) → [{ code, message }]
STOCK_DIR_WHITELIST / ALLOWED_FILE_RE / STOCK_FILE_WHITELIST / ARTIFACT_RE
// registered-ids.mjs
REGISTERED_IDS → string[]
```

**CLI 契约**（spec §10.2 最小 CLI 段）

```
node tools/observation-check/cli.mjs <json> [<json>…]     # 校验：exit 0 全过 / 1 有错 / 2 用法错
node tools/observation-check/cli.mjs rewrite <json>       # 只重渲染 md：exit 0 / 1
```

- stdout 逐行 `code: message`；stderr 只留致命异常；错误对象形状 `{ code, message, path? }`。
- `rewrite` 先跑结构与证据校验（不过即 exit 1、md 不动），再重渲染 md 写回**该 json 所在的过程目录**；`MdMissing` 只适用于校验模式（rewrite 遇 md 缺失直接重建）。
- `registeredIds` 取值来源：`import { REGISTERED_IDS } from './registered-ids.mjs'`（单列一句，见 spec §10.2）。

---

## 计划门（②→③，开工前签）

> 判据出处：`skills/dev-workflow/references/stage-2b-plan-gate.md`（三条核对，证据二选一）。本门**不设议会**；**申报人 = 主 agent，签字人 = 独立审计实例**（R2：主 agent 不得自签）。**签字时点 = 本 plan 写完之后、Task 1 开工之前**，不是 Task 12 收尾时——Task 12 产的是 ③ 段出口证据，不是门行。

### 核对一：功能点全覆盖

- **判据**：PRD 归属 S2 的功能点集合 ⊆ 本 plan 覆盖集（差集为空），且每个功能点至少有一条执行步骤。
- **PRD 侧集合**：`docs/prd/20261026205821-agent-card-contract.md:511`（§8 表 S2 行）与 `:539` 同口径 = **F-13～F-16、F-20、F-21** 共 6 个。
- **命令原文（审计复核用）**：`Select-String -Path docs\prd\20261026205821-agent-card-contract.md -Pattern 'F-13～F-16'` → 命中 `:511`、`:539` 两行。

| PRD 功能点 | 本 plan 落点 Task | 覆盖用例（附录 A） |
|---|---|---|
| F-13 产物 schema + 校验器绑定 + `registeredIds` 必填 | Task 3、Task 4 | B15、B19、B01–B06 |
| F-14 四段校验链 + 覆盖七条对账 + 异常不冒泡 | Task 3–6 | B07–B12、C06、D01–D08、E01–E07 |
| F-15 证据七道 | Task 3 | C01–C07 |
| F-16 唯一写盘入口 `writeObservation` | Task 6 | E01、E03–E07 |
| F-20 最小 CLI | Task 7 | E02、E08–E14 |
| F-21 敏感两条判据 + 仓外证据快照法 | Task 3（第 6/7 道 = 代码；第 1 道路径白名单只收仓内相对路径 = 快照法的机制强制） | C01–C05 |

- **命令原文**：`Select-String -Path docs\superpowers\plans\2026-10-27-s2-observation-check.md -Pattern 'F-(13|14|15|16|20|21) '` → 命中上表 6 行（plan 侧集合 6/6，差集 0）。
- **注意同名不同义**：testcase 的 `F01–F04` 组与 PRD 的 `F-01…F-17` 不是同一套号（PRD:123 C-10 已警告）。本表只比 PRD 号，**不得**用 testcase 的 F 组充数。

### 核对二：依赖无环

- **判据**：Task 依赖图是 DAG，且每个 `Consumes` 指向的产物都在本 plan 内。
- **实际形态**：Task 1→12 严格线性（附录 C 提交序同序），每个 Task 的 `Consumes:` 只指向更小编号 Task 或「无」。
- **拓扑序**：`T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12`（可完成，无环）。
- **命令原文**：`Select-String -Path docs\superpowers\plans\2026-10-27-s2-observation-check.md -Pattern '^\- Consumes:'` → 12 行，逐行无「Task 13+」或自指。

### 核对三：功能块 ↔ testcase 一一映射

- **判据**：S2 是一个功能块（PRD §8 一行 = 一个功能块），对应一份 testcase，且该 testcase 覆盖该功能块全部验收项；无悬空。
- **映射**：功能块 S2 ↔ `docs/superpowers/specs/2026-10-27-s2-observation-check-design-testcase.md`（69 条 + 议会派工 B19 = 70 条），逐 ID 落点见**附录 A**。
- **命令原文**：`Get-ChildItem docs\superpowers\specs\*s2-observation-check*` → 2 个（spec + testcase），无第三份、无悬空 testcase。

### 签行（审计签字时照抄，六列必须齐）

```markdown
| ②→③ 计划门 | 1) 功能点全覆盖：PRD F-13～F-16/F-20/F-21（`:511`/`:539`）6 个 ⊆ plan 覆盖 6 个，差集 0（本节表）2) 依赖无环：Task 1→12 线性，拓扑序可完成（本节）3) 功能块↔testcase：S2 ↔ 该 testcase **69 条**逐 ID 有落点（附录 A；议会派工 B19 由 Task 9 Step 6 施工期补入 testcase，门签时尚不存在、不计入本行） | 审计手工核对表三张 + 命令原文：`Select-String … -Pattern 'F-13～F-16'` → `:511`/`:539` 2 命中；`Select-String … -Pattern '^\- Consumes:'` → 12 行无环；附录 A 69 个 ID 全有落点（`Get-ChildItem docs\superpowers\specs\*s2-observation-check*` → 2 份） | 主 agent | 审计 | 计划门通过：S2 可进 ③ 实现 |
```

> `scripts/check-plan.mjs`（S4 交付）当前不存在，故三条核对一律走「审计手工核对表」，表头固定 `核了什么 | 怎么核的 | 结论` 并附命令原文（stage-2b 的「脚本未落地期」口径）。审计只签字不读按**不通过**处理。

---

### Task 1: PRD 码名登记 + A 表并入 + R8 回扫

**Files:**
- Modify: `docs/prd/20261026205821-agent-card-contract.md:321-356`（§4.3 第 2 / 5 道、§4.4 A 表与 B 表）
- Modify: `docs/superpowers/specs/2026-10-27-s2-observation-check-design.md:13`（R3 行括注）
- Modify: `tools/scope-sweep/keywords.json`（仅当 `--check` 报「命中超基线」时登记，见 Step 4）

**Interfaces:**
- Consumes: 无
- Produces: 两个新码名 `EvidenceStructuralRow`、`RepoRootUnresolved`（后续 Task 3 / 4 / 10 的断言逐字依赖）

- [ ] **Step 1: B 表补两行（证据侧 + 根）**

在 `docs/prd/20261026205821-agent-card-contract.md` 的 B 表 `| S2 新增（证据侧） | ... |` 行后追加两行（逐字）：

```markdown
| S2 新增（证据侧） | `EvidenceStructuralRow` | §4.3 第 5 道附带判据：被引用的行本身是纯结构行（`---` / 表格分隔行 / 围栏行）→ 红；与 `EvidenceQuoteTooShort` 分界（结构行可以 ≥10 字） |
| S2 新增（根） | `RepoRootUnresolved` | §4.3 第 2 道：`git rev-parse --show-toplevel` 取不到仓库根 → fail-closed；不得以 `process.cwd()` 或传参兜底 |
```

- [ ] **Step 2: §4.3 两处括注码名**

`§4.3` 第 2 条结尾补 `（取不到 → `RepoRootUnresolved`）`；第 5 条结尾补 `（专属码 `EvidenceStructuralRow`）`。改后两条逐字为：

```markdown
2. 解析根**唯一来源 = 仓库根**（`git rev-parse --show-toplevel`），**不接受传参**；解析后（含软链 realpath）必须落在根内（`EvidencePathOutside`）；根取不到 → fail-closed（`RepoRootUnresolved`）。
5. `quote` 长度二选一：归一化后 **≥10 字**，或 **≥4 字且占该行内容 50% 以上**（`EvidenceQuoteTooShort`）。字数按**码点**计（`[...s].length`）；纯结构行（`---`、表格分隔行、围栏行）不可作证据（`EvidenceStructuralRow`）。
```

- [ ] **Step 3: A 表并入 render.mjs 的 8 码**

A 表 `| 渲染 | `RenderMismatch` `MdMissing` |` 行后加一行，并把表下「8 个已实现但未列」的注改为并入说明：

```markdown
| 渲染·合并 | `MissingTrigger` `MissingCriterion` `MissingLanding` `MissingCriterionImpl` `UnknownLanding` `DuplicateStatement` `OverrideWithoutReason` `PointlessOverride` |
```

```markdown
> A 表当前有 **5 个码有实现但零测试**：`InvalidDocument` `MissingItems` `MissingOpenField` `MissingReason` `UnknownClosure` —— S2 的出口判据要求补测（见 §8）。**已于 2026-10-27 由 S2 施工批次并入 `渲染·合并` 行（8 个码）并补冒烟测试。**
```

- [ ] **Step 4: spec R3 行加码名括注**

`spec:13`（R3 行）末尾追加：`；结构行码名 = `EvidenceStructuralRow`、根取不到码名 = `RepoRootUnresolved`（见 PRD §4.4 B 表，2026-10-27 登记）`。

- [ ] **Step 5: R8 回扫 + 门禁**

```powershell
node scripts/scope-sweep.mjs --check
npm run check
```

Expected: 第一条首行 `sweep ok`、exit 0；第二条末行 `check 全部通过`、exit 0。若 `scope-sweep` 因新词命中共振报红，按 `tools/scope-sweep/keywords.json` 的条目格式登记该口径并把命中列入当次 `impact-sheet`，禁止调高 baseline。

- [ ] **Step 6: Commit**

```powershell
git add docs/prd/20261026205821-agent-card-contract.md docs/superpowers/specs/2026-10-27-s2-observation-check-design.md
git commit -m "docs(s2): 登记 EvidenceStructuralRow / RepoRootUnresolved，A 表并入 render 8 码

判据级口径变更（错误码命名）→ R8 回扫已跑（scope-sweep exit 0）。
未改功能点集合 → 不触发 R5。"
```

---

### Task 2: 迁入提交（11 文件原样，sha256 清单进 commit message）

**Files:**
- Create: `tools/observation-check/*.mjs` ×11（`checks` / `evidence` / `artifact` / `render` / `data` + 6 个 `*.test.mjs`）
- Modify: 无（本提交不得触碰任何既有文件）

**Interfaces:**
- Consumes: Task 1（无代码依赖，仅码名已在 PRD 里）
- Produces: `MIGRATION_COMMIT`（Task 9 的 `baseline.test.mjs` 常量）

- [ ] **Step 1: 建目录并原样复制**

```powershell
New-Item -ItemType Directory -Force tools\observation-check | Out-Null
Copy-Item "C:\Users\HuangChunhua\.retro-skills\observation-check-draft\*.mjs" tools\observation-check\
(Get-ChildItem tools\observation-check\*.mjs).Count
```

Expected: `11`。

- [ ] **Step 2: 生成 sha256 清单（迁入瞬间草稿区实算）**

```powershell
Get-ChildItem "C:\Users\HuangChunhua\.retro-skills\observation-check-draft\*.mjs" | Sort-Object Name | ForEach-Object { "$($_.Name)  $((Get-FileHash $_.FullName -Algorithm SHA256).Hash)" }
```

记下 11 行，**逐行贴进下一步的 commit message**（格式 `<文件名>  <64 位大写 HEX>`）。

- [ ] **Step 3: 迁入时点核验（仓库根）**

```powershell
node --test tools\observation-check\*.test.mjs
```

Expected: `# tests 71 / # pass 71 / # fail 0`（草稿的 `root = process.cwd()` 依赖仓库根；在 `tools\observation-check` 目录内跑会是 61/10，属已知差异，不是缺陷）。

- [ ] **Step 4: 确认本提交只含新增文件**

```powershell
git status --porcelain tools/observation-check
git add tools/observation-check
git diff --cached --name-status
```

Expected: `--name-status` 输出恰 11 行、状态列全为 `A`。

- [ ] **Step 5: 提交（message 内含 11 条 sha256）**

```powershell
git commit -m "feat(s2): 原样迁入 observation-check 11 文件（草稿区 → tools/observation-check）

迁入提交：diff 只有新增，零 M/D/R；行数 888（PRD §0.4 原命令口径，不计空行）。
sha256（迁入瞬间草稿区 Get-FileHash 实算；此后一律经 git show <本提交>:<path> 复算）：
<11 行：文件名 + 两空格 + HEX，按文件名升序>
"
```

- [ ] **Step 6: 记下迁入提交 hash**

```powershell
git rev-parse HEAD
```

Expected: 40 位 hash；写入本 plan 的 Task 9 Step 1（`MIGRATION_COMMIT` 常量）。

---

### Task 3: `registered-ids.mjs` + `evidence.mjs` 改造（root 单源 + 第 5/6/7 道）

**Files:**
- Create: `tools/observation-check/registered-ids.mjs`
- Modify: `tools/observation-check/evidence.mjs`（整文件替换，逐字如下）
- Test: `tools/observation-check/evidence.test.mjs`（Task 9 改夹具 / Task 10 补 C 组）

**Interfaces:**
- Consumes: Task 1 的两个码名
- Produces: `repoRoot()`、`checkEvidence(ev, { read? })`（Task 6 / 9 的夹具与调用方依赖）

- [ ] **Step 1: 写 `registered-ids.mjs`（单源清单）**

```js
// registeredIds 的唯一来源（S2 期）。
// 不变量（S1 落地后切换时保持）：新旧集合**相等**——切到 Object.keys(CHECK_ITEMS) 时，
// 必须断言 Set(REGISTERED_IDS) 与 Set(Object.keys(CHECK_ITEMS)) 相等，随后删除本文件与所有 import。
// 本文件只登记 id 字符串，不含 check 分类字段（分类归 S1 的模型层，S2 不前置依赖）。
export const REGISTERED_IDS = ['k01', 'k02', 'k03'];
```

- [ ] **Step 2: 整文件替换 `evidence.mjs`**

```js
// 证据可解析（七道）：路径相对 → 根内 → 敏感路径 → 存在 → 可读 → 行号 → 含 quote → 长度 → 结构行 → 敏感内容
// 根唯一来源 = git rev-parse --show-toplevel（PRD §4.3-2 / C-03），接口不接受 root 参数。
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { isAbsolute, resolve, sep } from 'node:path';

const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const cpLen = (s) => [...s].length;                       // 字数按码点计（PRD §4.3-5）

const MIN_QUOTE_CHARS = 10;
const MIN_QUOTE_RATIO = 0.5;
const MIN_QUOTE_FLOOR = 4;

// 第 6 道：按 / \ 拆段，任一段命中即红（PRD §4.3-6）
const SENSITIVE_SEGMENTS = [
  /^\.env(\.|$)/, /\.pem$/i, /\.key$/i, /\.p12$/i, /^id_rsa/, /^id_ed25519/,
  /^\.npmrc$/, /^\.netrc$/, /^credentials/i, /secret/i,
];
// 第 7 道：引用内容（PRD §4.3-7，四形态逐字）
const SENSITIVE_QUOTE = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /AKIA[0-9A-Z]{16}/,
  /ghp_[A-Za-z0-9]{36}/,
  /https?:\/\/[^/@\s]+:[^/@\s]+@/,
];
// 第 5 道附带：纯结构行不可作证据（码名 EvidenceStructuralRow，PRD §4.4 B 表 2026-10-27 登记）
const STRUCTURAL_ROW = [
  /^[-*_]{3,}$/,                                   // 水平线 / 标题分隔
  /^(`{3,}|~{3,})/,                                 // 围栏行
  /^\|?(\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?$/,    // 表格分隔行
];

let cachedRoot = null;
export function repoRoot() {
  if (cachedRoot) return cachedRoot;
  try {
    const out = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
    if (!out) throw new Error('git rev-parse 输出为空');
    cachedRoot = realpathSync(out);
    return cachedRoot;
  } catch (e) {
    const err = new Error(`RepoRootUnresolved: 取不到仓库根（${e.message}）`);
    err.code = 'RepoRootUnresolved';
    throw err;
  }
}

const isSensitivePath = (p) => p.split('/').some((seg) => SENSITIVE_SEGMENTS.some((re) => re.test(seg)));

function confine(p, root) {
  if (isAbsolute(p) || /^[A-Za-z]:/.test(p) || p.startsWith('\\\\')) {
    return { error: { code: 'EvidencePathAbsolute', detail: `evidence.path 必须是相对路径：${p}` } };
  }
  const inside = (abs) => abs === root || abs.startsWith(root + sep);
  const abs = resolve(root, p);
  if (!inside(abs)) return { error: { code: 'EvidencePathOutside', detail: `evidence.path 解析后落在根目录外：${p}` } };
  if (existsSync(abs) && !inside(realpathSync(abs))) {
    return { error: { code: 'EvidencePathOutside', detail: `evidence.path 是软链，指向根目录外：${p}` } };
  }
  return { abs };
}

export function checkEvidence(ev, { read = (p) => readFileSync(p, 'utf8') } = {}) {
  if (!ev || typeof ev !== 'object' || Array.isArray(ev)) {
    return { ok: false, code: 'InvalidFieldType', detail: 'evidence 必须是 { path, line, quote }' };
  }
  const { path, line, quote } = ev;
  if (typeof path !== 'string' || !path.trim()) return { ok: false, code: 'InvalidFieldType', detail: 'evidence.path 必填' };
  if (!Number.isInteger(line) || line < 1) return { ok: false, code: 'InvalidFieldType', detail: 'evidence.line 必须是 ≥1 的整数' };
  if (typeof quote !== 'string' || !quote.trim()) return { ok: false, code: 'InvalidFieldType', detail: 'evidence.quote 必填' };

  const normalized = path.replace(/\\/g, '/');            // PRD §4.3-1：反斜杠按 / 归一
  let root;
  try { root = repoRoot(); } catch (e) { return { ok: false, code: e.code ?? 'RepoRootUnresolved', detail: e.message }; }
  const confined = confine(normalized, root);
  if (confined.error) return { ok: false, ...confined.error };
  if (isSensitivePath(normalized)) {
    return { ok: false, code: 'EvidenceSensitivePath', detail: `证据路径命中敏感名单：${normalized}` };
  }
  const abs = confined.abs;
  if (!existsSync(abs)) return { ok: false, code: 'EvidenceNotFound', detail: `文件不存在：${normalized}` };
  let text;
  try { text = String(read(abs)); } catch (e) { return { ok: false, code: 'EvidenceUnreadable', detail: `无法读取 ${normalized}：${e.message}` }; }
  const lines = text.split(/\r?\n/);
  if (line > lines.length) {
    return { ok: false, code: 'EvidenceLineOutOfRange', detail: `${normalized}:${line} 超出文件行数 ${lines.length}` };
  }
  const cited = norm(lines[line - 1]);
  const nq = norm(quote);
  if (!cited.includes(nq)) return { ok: false, code: 'EvidenceQuoteMismatch', detail: `${normalized}:${line} 不含引用片段` };

  const longEnough = cpLen(nq) >= MIN_QUOTE_CHARS;
  const coversLine = cpLen(nq) >= MIN_QUOTE_FLOOR && cpLen(nq) / cpLen(cited) >= MIN_QUOTE_RATIO;
  if (!longEnough && !coversLine) {
    return {
      ok: false,
      code: 'EvidenceQuoteTooShort',
      detail: `引用只有 ${cpLen(nq)} 字（该行 ${cpLen(cited)} 字）：须 ≥${MIN_QUOTE_CHARS} 字，或 ≥${MIN_QUOTE_FLOOR} 字且占该行 ${MIN_QUOTE_RATIO * 100}% 以上`,
    };
  }
  if (STRUCTURAL_ROW.some((re) => re.test(cited))) {
    return { ok: false, code: 'EvidenceStructuralRow', detail: `${normalized}:${line} 是纯结构行，不可作证据` };
  }
  if (SENSITIVE_QUOTE.some((re) => re.test(nq))) {
    return { ok: false, code: 'EvidenceQuoteSensitive', detail: `引用命中敏感内容：${normalized}:${line}` };
  }
  return { ok: true };
}
```

- [ ] **Step 3: 冒烟（此时旧测试仍绿，行为等价面除外）**

```powershell
node --test tools\observation-check\evidence.test.mjs
```

Expected: 旧 22 条里依赖 `agents/` 的那 1 条会红（「正例：真实仓库文件可解析」——root 已改为 git 顶层后其实仍绿）；其余绿。若出现 `RepoRootUnresolved`，说明不在 git 仓库内跑，属环境错误。

---

### Task 4: `checks.mjs` 结构段改造（七条对账 + 缺失码分界）

**Files:**
- Modify: `tools/observation-check/checks.mjs`（第 1-91 行整体替换为下面代码；`normText` / `checkRendered` / `checkPrerequisites` 保留原样，除 Task 5 的渲染改动）
- Test: `tools/observation-check/checks.test.mjs`、`coverage.test.mjs`（Task 9/10）

**Interfaces:**
- Consumes: `checkEvidence`（Task 3）
- Produces: `validateObservation(doc, { registeredIds, resolveEvidence })`，错误对象 `{ code, message, path }`

- [ ] **Step 1: 用下面代码替换 `checks.mjs` 第 1-91 行**

```js
// 结构化产物校验 + 渲染：机器校验 JSON，markdown 只是视图
import { checkEvidence } from './evidence.mjs';

const VERDICTS = new Set(['hit', 'miss', 'na']);
const CLOSURES = new Set([null, 'no-findings', 'blocked']);

function err(list, code, message, path) {
  list.push({ code, message, path });
}

// 结构化 evidence：{ path, line, quote }。给了 resolver 才做「可解析」校验（需要读盘）
function checkEvidenceField(ev, at, errors, resolveEvidence) {
  if (!ev || typeof ev !== 'object' || Array.isArray(ev)) {
    err(errors, 'InvalidFieldType', 'evidence 必须是 { path, line, quote }', `${at}.evidence`);
    return;
  }
  if (resolveEvidence) {
    const r = checkEvidence(ev);
    if (!r.ok) err(errors, r.code, r.detail, `${at}.evidence`);
    return;
  }
  if (typeof ev.path !== 'string' || !Number.isInteger(ev.line) || typeof ev.quote !== 'string') {
    err(errors, 'InvalidFieldType', 'evidence 结构必须为 { path, line, quote }', `${at}.evidence`);
  }
}

// 七条覆盖对账（PRD §4.2 ①）。只在该段各字段类型合法时跑，避免类型错引发级联噪声。
function checkCoverageReconciliation(items, c, registeredIds, errors) {
  const skipped = Array.isArray(c.skipped) ? c.skipped : null;
  const ids = Array.isArray(registeredIds) ? registeredIds : null;
  if (!Array.isArray(items) || !skipped || !ids) return;
  if (!Number.isInteger(c.read) || !Number.isInteger(c.total)) return;

  if (items.length !== c.read) {
    err(errors, 'CoverageMismatch', `items 条数 ${items.length} ≠ coverage.read ${c.read}`, 'coverage.read');
  }
  if (c.total !== ids.length) {
    err(errors, 'CoverageMismatch', `coverage.total ${c.total} ≠ registeredIds 长度 ${ids.length}`, 'coverage.total');
  }
  if (c.read + skipped.length !== c.total) {
    err(errors, 'CoverageMismatch', `read + skipped ${c.read + skipped.length} ≠ total ${c.total}`, 'coverage');
  }
  const unregistered = skipped.filter((id) => !ids.includes(id));
  if (unregistered.length) {
    err(errors, 'CoverageMismatch', `skipped 含未登记 id：${unregistered.join('、')}`, 'coverage.skipped');
  }
  const itemIds = items.map((it) => it && it.id);
  const both = skipped.filter((id) => itemIds.includes(id));
  if (both.length) {
    err(errors, 'CoverageMismatch', `同一 id 又判又跳：${both.join('、')}`, 'coverage.skipped');
  }
}

export function validateObservation(doc, { registeredIds, resolveEvidence = null } = {}) {
  const errors = [];
  const idsKnown = Array.isArray(registeredIds);
  if (!idsKnown) {
    err(errors, 'UnregisteredIdsMissing', '必须传入 registeredIds（本轮登记检查项 id 清单）', 'registeredIds');
  }
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    err(errors, 'InvalidDocument', '产物必须是对象');
    return { errors };
  }

  // round
  if (!Number.isInteger(doc.round) || doc.round < 1) {
    err(errors, 'InvalidFieldType', 'round 必须是 ≥1 的整数', 'round');
  }

  // items
  if (!Array.isArray(doc.items) || doc.items.length === 0) {
    err(errors, 'MissingItems', 'items 必须是非空数组', 'items');
  } else {
    const seen = new Set();
    doc.items.forEach((it, i) => {
      const at = `items[${i}]`;
      if (!it || typeof it !== 'object') return err(errors, 'InvalidFieldType', 'item 必须是对象', at);
      if (idsKnown && !registeredIds.includes(it.id)) err(errors, 'UnknownItem', `未登记的检查项 ${it.id}`, `${at}.id`);
      if (seen.has(it.id)) err(errors, 'DuplicateItem', `检查项 id 重复：${it.id}`, `${at}.id`);
      seen.add(it.id);
      if (!VERDICTS.has(it.verdict)) err(errors, 'UnknownVerdict', 'verdict 只能是 hit/miss/na', `${at}.verdict`);
      if (it.verdict === 'hit') {
        if (it.evidence === undefined) err(errors, 'MissingEvidence', '判 hit 必须带 evidence', `${at}.evidence`);
        else checkEvidenceField(it.evidence, at, errors, resolveEvidence);
      }
      if ((it.verdict === 'miss' || it.verdict === 'na') && !String(it.reason ?? '').trim()) {
        err(errors, 'MissingReason', `判 ${it.verdict} 必须带 reason`, `${at}.reason`);
      }
    });
  }

  // open
  if (!Array.isArray(doc.open)) {
    err(errors, 'InvalidFieldType', 'open 必须是数组（可为空）', 'open');
  } else {
    doc.open.forEach((o, i) => {
      const at = `open[${i}]`;
      if (!o || typeof o !== 'object') return err(errors, 'InvalidFieldType', 'open 项必须是对象', at);
      for (const k of ['object', 'impact', 'suggestion']) {
        if (!String(o[k] ?? '').trim()) err(errors, 'MissingOpenField', `open 项缺 ${k}`, `${at}.${k}`);
      }
      checkEvidenceField(o.evidence, at, errors, resolveEvidence);
    });
  }

  // coverage：类型 / 值域（InvalidCoverage）+ 七条对账（CoverageMismatch）
  const c = doc.coverage;
  if (!c || typeof c !== 'object' || Array.isArray(c)) {
    err(errors, 'MissingCoverage', 'coverage 必须是对象', 'coverage');
  } else {
    if (!Number.isInteger(c.read) || c.read < 0) err(errors, 'InvalidCoverage', 'coverage.read 必须是非负整数', 'coverage.read');
    if (!Number.isInteger(c.total) || c.total < 1) err(errors, 'InvalidCoverage', 'coverage.total 必须是正整数', 'coverage.total');
    if (Number.isInteger(c.read) && Number.isInteger(c.total) && c.read > c.total) {
      err(errors, 'InvalidCoverage', 'coverage.read 不得大于 coverage.total', 'coverage');
    }
    if (!Array.isArray(c.skipped)) err(errors, 'InvalidCoverage', 'coverage.skipped 必须是数组', 'coverage.skipped');
    checkCoverageReconciliation(doc.items, c, registeredIds, errors);
  }

  // closure：与 open 条数做结构对账，不依赖词表
  if (!CLOSURES.has(doc.closure)) {
    err(errors, 'UnknownClosure', 'closure 只能是 null / "no-findings" / "blocked"', 'closure');
  } else if (Array.isArray(doc.open) && doc.open.length > 0 && doc.closure === 'no-findings') {
    err(errors, 'ContradictoryClosure', `open 有 ${doc.open.length} 条，closure 却声明 no-findings`, 'closure');
  }

  return { errors };
}
```

- [ ] **Step 2: 判据自查（对账七条各有一条反例）**

```powershell
node -e "import('./tools/observation-check/checks.mjs').then(({validateObservation:v})=>{const ids=['k01','k02','k03'];const base=()=>({round:3,items:[{id:'k01',verdict:'na',reason:'x'}],open:[],coverage:{read:1,total:3,skipped:['k02','k03']},closure:'no-findings'});const c=(d)=>v(d,{registeredIds:ids}).errors.map(e=>e.code);console.log('ok',JSON.stringify(c(base())));const d1=base();d1.items.push({id:'k01',verdict:'na',reason:'y'});d1.coverage={read:2,total:3,skipped:['k03']};console.log('dup',JSON.stringify(c(d1)));const d2=base();d2.coverage.total=2;console.log('total',JSON.stringify(c(d2)));console.log('noIds',JSON.stringify(v(base()).errors.map(e=>e.code)))})"
```

Expected:
- `ok []`
- `dup` 含 `DuplicateItem`
- `total` 含 `CoverageMismatch`
- `noIds` 含 `UnregisteredIdsMissing`

---

### Task 5: `checks.mjs` 渲染段改造（最小信息集 + 竖线转义 + R-7 横幅 + 新文案）

**Files:**
- Modify: `tools/observation-check/checks.mjs`（`V_LABEL` 起至 `renderObservation` 结束整段替换；`normText` / `checkRendered` 不动）
- Test: `tools/observation-check/render-check.test.mjs`（Task 9/10）

**Interfaces:**
- Consumes: Task 4 的 `validateObservation`（同文件，无导入依赖）
- Produces: `renderObservation(doc)`（首行横幅；hit 行含 `path:line`；open 行含 path 与 line；单元格竖线转义；覆盖度新文案）

- [ ] **Step 1: 用下面代码替换 `checks.mjs` 的 `const V_LABEL = ...` 到 `renderObservation` 函数体结束**

```js
const V_LABEL = { hit: '命中', miss: '未命中', na: '不适用' };

// R-7 版本横幅（PRD §5.4）：渲染器升级时存量归档 md 才有版本声明
const MD_BANNER = '<!-- observation-md v1 -->';

// 单元格转义：ASCII 竖线 → \|（splitRow 口径：代码跨度外的 `\|` 是转义、不切列）
const cell = (v) => String(v ?? '—').replace(/\|/g, '\\|');

// 渲染最小信息集：hit 行必须含 path:line；open 行必须含 evidence 的 path 与 line
const refOf = (ev, withQuote) => {
  if (!ev || typeof ev !== 'object') return '—';
  const head = `${cell(ev.path)}:${ev.line ?? '?'}`;
  return withQuote && ev.quote ? `${head}「${cell(ev.quote)}」` : head;
};

export function renderObservation(doc) {
  const lines = [MD_BANNER, '# 观察表', '', '| 编号 | 结论 | 依据/理由 |', '|---|---|---|'];
  for (const it of doc.items ?? []) {
    const why = it.verdict === 'hit'
      ? refOf(it.evidence, true)
      : it.verdict === 'na' || it.verdict === 'miss'
        ? cell(it.reason)
        : '—';
    lines.push(`| ${cell(it.id)} | ${V_LABEL[it.verdict] ?? cell(it.verdict)} | ${why} |`);
  }
  lines.push('', '## 补充项', '');
  if (!doc.open || doc.open.length === 0) {
    lines.push('无。');
  } else {
    lines.push('| 对象 | 依据 | 影响 | 建议 |', '|---|---|---|---|');
    for (const o of doc.open) {
      lines.push(`| ${cell(o.object)} | ${refOf(o.evidence, false)} | ${cell(o.impact)} | ${cell(o.suggestion)} |`);
    }
  }
  const c = doc.coverage ?? {};
  const skipped = c.skipped ?? [];
  lines.push('', `覆盖度：已判 ${c.read ?? '?'} 条 / 共 ${c.total ?? '?'} 条（跳过 ${skipped.length}：${skipped.map(cell).join('、') || '无'}）`);
  lines.push(`结论：${doc.closure === null || doc.closure === undefined ? '有补充项，无总体结论' : cell(doc.closure)}`);
  return lines.join('\n');
}
```

- [ ] **Step 2: 自查渲染三面（横幅 / path:line / 竖线不破列）**

```powershell
node -e "import('./tools/observation-check/checks.mjs').then(async ({renderObservation:r})=>{const {splitRow}=await import('./tools/execution-matrix/markdown-rows.mjs');const d={round:3,items:[{id:'k01',verdict:'hit',evidence:{path:'f/ev.md',line:3,quote:'甲|乙'}},{id:'k02',verdict:'na',reason:'A || B'}],open:[{object:'筛 | 关键',evidence:{path:'f/o.md',line:9,quote:'q'},impact:'i',suggestion:'s'}],coverage:{read:2,total:3,skipped:['k03']},closure:null};const md=r(d);const rows=md.split('\n').filter(l=>l.startsWith('|'));console.log(md.split('\n')[0]);console.log('hasPathLine',md.includes('f/ev.md:3'),'noObj',!md.includes('[object Object]'));console.log('escaped',md.includes('筛 \\| 关键'));console.log('colsOk',rows.every(l=>splitRow(l).length===splitRow(rows[0]).length));console.log('copy',md.includes('已判 2 条 / 共 3 条'),md.includes('跳过 1：k03'))})"
```

Expected: 首行 `<!-- observation-md v1 -->`；`hasPathLine true noObj true`；`escaped true`；`colsOk true`；`copy true true`。

> 列数判定的对象 = **表格行**（以 `|` 开头的行）。PRD §4.2 ③ 的「每行列数 = 表头列数」作用于表格；非表格行（`无。`、覆盖度行、结论行）不参与，此为可执行口径，Task 10 的 D03 断言按同一口径写。

---

### Task 6: `artifact.mjs` 改造（唯一写盘入口 + 目的地判据 + 原子序 + 错误码收敛）

**Files:**
- Modify: `tools/observation-check/artifact.mjs`（整文件替换，逐字如下）
- Test: `tools/observation-check/artifact.test.mjs`、`write.test.mjs`（Task 9 改夹具 / Task 10 补 E 组）

**Interfaces:**
- Consumes: `validateObservation` / `renderObservation` / `checkRendered`（Task 4/5）、`repoRoot`（Task 3）
- Produces: `validateArtifact` / `validateArtifactExitCode` / `writeObservation` / `resolveWriteTarget`（Task 7 / 9 / 12 依赖）

**覆盖 / 并发 / tmp 清扫口径（议会 L-3 留观项，本 plan 定死，实现不得偏离）**

| 语义 | 定死的口径 |
|---|---|
| 覆盖 | 同名产物重写 = **全量覆盖**（两文件同批重写，幂等；不提供追加 / 局部更新；旧内容只在 git 历史里） |
| 并发 | **不提供文件锁**；tmp 名带 `process.pid` 隔离；rename 原子替换 = 「后写者胜」。约定单写者（同一评审目录同一时刻只由一处写入），并发写不在 S2 承诺面 |
| tmp 清扫 | 成功路径 rename 后 tmp 自然消失；失败路径 `rmSync` 两个 tmp + 回滚已落地 md；**任何 `ok:false` 返回后目录内不得残留 `.tmp-*`**（E06 断言） |
| 半写态 | rename 顺序 **md 先、json 后**；md 成功而 json 失败 → 删刚落地 md（无 json 不得留 md） |

- [ ] **Step 1: 整文件替换 `artifact.mjs`**

```js
// 入口：校验（validateArtifact / validateArtifactExitCode）+ 唯一写盘入口（writeObservation）
// 目的地判据（PRD §4.5）：realpath 在 git 顶层内 + 匹配过程目录正则 + 不在 .git/** + 归档目录只读
import {
  existsSync, readFileSync, realpathSync, renameSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { validateObservation, renderObservation, checkRendered } from './checks.mjs';
import { repoRoot } from './evidence.mjs';

// 目的地硬编码正则（不留配置项 / 环境变量 / skip 开关）
const PROCESS_DIR_RE = /^\.session\/reviews\/[^/]+\/observation-r\d+(-[ab])?\.(json|md)$/;
const ARTIFACT_NAME_RE = /^(observation-r\d+)(-[ab])?$/;

export function resolveWriteTarget({ jsonDir, name }) {
  if (typeof jsonDir !== 'string' || !jsonDir.trim()) {
    return { error: { code: 'InvalidWriteTarget', message: 'jsonDir 必填（过程目录路径）' } };
  }
  if (!existsSync(jsonDir) || !statSync(jsonDir).isDirectory()) {
    return { error: { code: 'InvalidWriteTarget', message: `jsonDir 不存在或不是目录：${jsonDir}` } };
  }
  let root;
  try { root = repoRoot(); } catch (e) {
    return { error: { code: e.code ?? 'RepoRootUnresolved', message: e.message } };
  }
  const real = realpathSync(resolve(jsonDir));
  if (!(real === root || real.startsWith(root + sep))) {
    return { error: { code: 'ArtifactPathOutside', message: `jsonDir 不在仓库内：${jsonDir}` } };
  }
  const jsonPath = join(real, `${name}.json`);
  const mdPath = join(real, `${name}.md`);
  for (const abs of [jsonPath, mdPath]) {
    const rel = relative(root, abs).split(sep).join('/');
    if (rel.startsWith('docs/superpowers/reviews/')) {
      return { error: { code: 'ArtifactPathOutside', message: `归档目录只读：${rel}` } };
    }
    if (rel.split('/').includes('.git')) {
      return { error: { code: 'ArtifactPathOutside', message: `不得写 .git：${rel}` } };
    }
    if (!PROCESS_DIR_RE.test(rel)) {
      return { error: { code: 'ArtifactPathOutside', message: `目的地不在过程目录：${rel}` } };
    }
  }
  return { jsonPath, mdPath };
}

const artifactName = (doc) => `observation-r${doc.round}${doc.instance ? '-' + String(doc.instance).toLowerCase() : ''}`;

function roundMismatch(jsonPath, doc) {
  const m = ARTIFACT_NAME_RE.exec(basename(jsonPath, '.json'));
  if (!m || !doc || !Number.isInteger(doc.round)) return null;
  const n = Number(m[1].slice('observation-r'.length));
  if (n !== doc.round) {
    return { code: 'RoundMismatch', message: `文件名 ${basename(jsonPath)} 的轮次 ${n} ≠ doc.round ${doc.round}`, path: 'round' };
  }
  return null;
}

// InstanceMissing：items 含 check:'ai' 条目时，同目录必须有 -a / -b 两份（PRD §4.1 / §4.4 B 表）
function instanceMissing(doc, jsonPath) {
  if (!Array.isArray(doc.items) || !doc.items.some((it) => it && it.check === 'ai')) return null;
  const m = ARTIFACT_NAME_RE.exec(basename(jsonPath, '.json'));
  if (!m) return null;
  const dir = dirname(jsonPath);
  for (const suffix of ['-a', '-b']) {
    if (!existsSync(join(dir, `${m[1]}${suffix}.json`))) {
      return { code: 'InstanceMissing', message: `${m[1]} 含 check:'ai' 条目，但缺 ${m[1]}${suffix}.json`, path: 'instance' };
    }
  }
  return null;
}

export function validateArtifact(jsonPath, { registeredIds } = {}) {
  if (!existsSync(jsonPath)) {
    return { ok: false, errors: [{ code: 'JsonNotFound', message: `json 不存在：${jsonPath}` }] };
  }
  let doc;
  try { doc = JSON.parse(readFileSync(jsonPath, 'utf8')); } catch (e) {
    return { ok: false, errors: [{ code: 'InvalidJson', message: `JSON 解析失败：${e.message}` }] };
  }

  const errors = [];
  const rm = roundMismatch(jsonPath, doc);
  if (rm) errors.push(rm);
  errors.push(...validateObservation(doc, { registeredIds, resolveEvidence: true }).errors);
  const im = instanceMissing(doc, jsonPath);
  if (im) errors.push(im);

  // 结构错时不比渲染（避免级联噪声）；md 存在性始终必判（缺省不得跳过）
  const mdPath = jsonPath.replace(/\.json$/i, '.md');
  if (!existsSync(mdPath)) {
    errors.push({ code: 'MdMissing', message: `md 不存在：${mdPath}`, path: 'mdPath' });
  } else if (errors.length === 0) {
    let text;
    try { text = readFileSync(mdPath, 'utf8'); } catch (e) {
      // 异常纪律：IO 异常收敛为码，不得冒泡（PRD §4.2）
      errors.push({ code: 'MdUnreadable', message: `md 不可读：${mdPath}（${e.message}）`, path: 'mdPath' });
    }
    if (text !== undefined) {
      const r = checkRendered(doc, text);
      if (!r.ok) errors.push({ code: r.code, message: r.detail, path: 'mdPath' });
    }
  }
  return { ok: errors.length === 0, errors };
}

export function validateArtifactExitCode(jsonPath, { registeredIds } = {}) {
  return validateArtifact(jsonPath, { registeredIds }).ok ? 0 : 1;
}

export function writeObservation(doc, { jsonDir, registeredIds } = {}) {
  const errors = validateObservation(doc, { registeredIds, resolveEvidence: true }).errors;
  if (errors.length > 0) return { ok: false, wrote: false, errors };

  const target = resolveWriteTarget({ jsonDir, name: artifactName(doc) });
  if (target.error) return { ok: false, wrote: false, errors: [target.error] };

  const jsonText = `${JSON.stringify(doc, null, 2)}\n`;
  const fail = atomicWritePair(target.jsonPath, jsonText, target.mdPath, renderObservation(doc));
  if (fail) return { ok: false, wrote: false, errors: [fail] };
  return { ok: true, wrote: true, errors: [] };
}

// 先全部渲染/序列化到内存 → 各写 tmp → 全成功再逐个 rename（md 先、json 后）
// 任一失败：清两个 tmp；md 已落地而 json 失败时删 md（无 json 不得留 md）
function atomicWritePair(jsonPath, jsonText, mdPath, mdText) {
  const jTmp = `${jsonPath}.tmp-${process.pid}`;
  const mTmp = `${mdPath}.tmp-${process.pid}`;
  try {
    writeFileSync(mTmp, mdText, 'utf8');
    writeFileSync(jTmp, jsonText, 'utf8');
    renameSync(mTmp, mdPath);
    try { renameSync(jTmp, jsonPath); }
    catch (e) { rmSync(mdPath, { force: true }); throw e; }
    return null;
  } catch (e) {
    rmSync(mTmp, { force: true });
    rmSync(jTmp, { force: true });
    return { code: 'WriteFailed', message: `写盘失败：${e.message}`, path: 'jsonDir' };
  }
}
```

- [ ] **Step 2: 三态自查（合法正例 / 路径外反例 / md 目录占位）**

```powershell
node -e "import('./tools/observation-check/artifact.mjs').then(async (m)=>{const {mkdtempSync,mkdirSync,writeFileSync,existsSync,rmSync}=await import('node:fs');const {join}=await import('node:path');const {repoRoot}=await import('./tools/observation-check/evidence.mjs');const root=repoRoot();const dir=mkdtempSync(join(root,'.session/reviews/test-obs-check-'));const ev=join(dir,'ev.md');writeFileSync(ev,'第一条真实观察行');const rel=ev.slice(root.length+1).split('\\\\').join('/');const doc={round:3,items:[{id:'k01',verdict:'hit',evidence:{path:rel,line:1,quote:'第一条真实观察行'}},{id:'k02',verdict:'na',reason:'不适用'},{id:'k03',verdict:'miss',reason:'没找到'}],open:[],coverage:{read:2,total:3,skipped:['k03']},closure:'no-findings'};console.log('write',JSON.stringify(m.writeObservation(doc,{jsonDir:dir,registeredIds:['k01','k02','k03']})));console.log('files',(await import('node:fs')).readdirSync(dir).sort().join(','));console.log('outside',JSON.stringify(m.writeObservation(doc,{jsonDir:join(root,'tools'),registeredIds:['k01','k02','k03']})));mkdirSync(join(dir,'observation-r4.md'));const d2={...doc,round:4};console.log('mdDir',JSON.stringify(m.writeObservation(d2,{jsonDir:dir,registeredIds:['k01','k02','k03']})));console.log('tmpLeft',(await import('node:fs')).readdirSync(dir).filter(f=>f.includes('.tmp-')).length);rmSync(dir,{recursive:true,force:true})})"
```

Expected:
- `write {"ok":true,"wrote":true,"errors":[]}`
- `files ev.md,observation-r3.json,observation-r3.md`
- `outside` 含 `ArtifactPathOutside`
- `mdDir` 含 `WriteFailed`，且 `tmpLeft 0`（同时 `observation-r4.json` 不存在）

---

### Task 7: `cli.mjs`（从零新建）

**Files:**
- Create: `tools/observation-check/cli.mjs`
- Test: `tools/observation-check/cli.test.mjs`（Task 10）

**Interfaces:**
- Consumes: `validateArtifact` / `resolveWriteTarget`（Task 6）、`validateObservation` / `renderObservation`（Task 4/5）、`REGISTERED_IDS`（Task 3）
- Produces: CLI 契约（校验 / rewrite / 退出码 0/1/2）

- [ ] **Step 1: 写 `cli.mjs`**

```js
#!/usr/bin/env node
// 最小 CLI：单件校验（exit 0 全过 / 1 有错 / 2 用法错）+ rewrite（只重渲染 md，json 一字节不动）
import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import { validateArtifact, resolveWriteTarget } from './artifact.mjs';
import { validateObservation, renderObservation } from './checks.mjs';
import { REGISTERED_IDS } from './registered-ids.mjs';

const USAGE = [
  '用法：',
  '  node tools/observation-check/cli.mjs <json> [<json>…]   校验（exit 0 全过 / 1 有错）',
  '  node tools/observation-check/cli.mjs rewrite <json>     只重渲染 md（不写 json）',
].join('\n');

const usage = () => { console.error(USAGE); process.exit(2); };
const report = (errors) => { for (const e of errors) process.stdout.write(`${e.code}: ${e.message}\n`); };

const argv = process.argv.slice(2);
if (argv.length === 0) usage();

if (argv[0] === 'rewrite') {
  if (argv.length !== 2) usage();
  const jsonPath = argv[1];
  if (!existsSync(jsonPath)) {
    report([{ code: 'JsonNotFound', message: `json 不存在：${jsonPath}` }]);
    process.exit(1);
  }
  let doc;
  try { doc = JSON.parse(readFileSync(jsonPath, 'utf8')); } catch (e) {
    report([{ code: 'InvalidJson', message: `JSON 解析失败：${e.message}` }]);
    process.exit(1);
  }
  // 裁决：rewrite 必须先过结构与证据校验（坏件不得被「修」成看似合规的 md）
  const errors = validateObservation(doc, { registeredIds: REGISTERED_IDS, resolveEvidence: true }).errors;
  if (errors.length > 0) { report(errors); process.exit(1); }

  const target = resolveWriteTarget({ jsonDir: dirname(jsonPath), name: basename(jsonPath, '.json') });
  if (target.error) { report([target.error]); process.exit(1); }

  const tmp = `${target.mdPath}.tmp-${process.pid}`;
  try {
    writeFileSync(tmp, renderObservation(doc), 'utf8');
    renameSync(tmp, target.mdPath);
  } catch (e) {
    rmSync(tmp, { force: true });
    report([{ code: 'WriteFailed', message: `md 重渲染失败：${e.message}` }]);
    process.exit(1);
  }
  process.exit(0);
}

if (argv[0].startsWith('-')) usage();
const errors = [];
for (const p of argv) errors.push(...validateArtifact(p, { registeredIds: REGISTERED_IDS }).errors);
if (errors.length === 0) process.exit(0);
report(errors);
process.exit(1);
```

- [ ] **Step 2: 四态自查（不存在 / 用法错 / 使用说明）**

```powershell
node tools\observation-check\cli.mjs .session/reviews/x/observation-r9.json; "exit=$LASTEXITCODE"
node tools\observation-check\cli.mjs --no-md; "exit=$LASTEXITCODE"
node tools\observation-check\cli.mjs; "exit=$LASTEXITCODE"
```

Expected: 第一条打印 `JsonNotFound: json 不存在：…` 且 `exit=1`；第二条与第三条打印 `USAGE` 且 `exit=2`。

---

### Task 8: `gate-scan.mjs`（PRD §5.2 三态判定纯函数）

**Files:**
- Create: `tools/observation-check/gate-scan.mjs`
- Test: `tools/observation-check/gate-scan.test.mjs`（Task 10）

**Interfaces:**
- Consumes: 无（纯函数，不读盘、不 import 其它模块）
- Produces: `scanReviewDir(dirName, files)` + 三个常量（S3 接线时直接 import）

- [ ] **Step 1: 写 `gate-scan.mjs`**

```js
// PRD §5.2 归档目录三态判定（纯函数）。运行时门禁接线（check-all.mjs 增段 / 扫描根 / git 断言）归 S3。
export const STOCK_DIR_WHITELIST = new Set(['2026-10-25-1723-s6-eval']);

// 允许文件名类（限 <次>/ 根层与 <次>/cards/ 子层）
export const ALLOWED_FILE_RE = /^(progress\.md|cards\.md|problems\.md|submission\.md|impact-sheet\.md|detective\.md|round-check\.md|delivery-audit\.md)$/;

// 非产物文件白名单（精确相对路径，一次性；9 个）
const STOCK_PREFIX = '2026-10-25-1723-s6-eval/';
export const STOCK_FILE_WHITELIST = new Set([
  'ab-score.md', 'capability-diff.md', 'checklist.md', 'impact-sheet.md', 'rubric.md',
  'cards/card-01.md', 'cards/card-02.md', 'cards/card-03.md', 'cards/card-04.md',
].map((f) => `${STOCK_PREFIX}${f}`));

export const ARTIFACT_RE = /^observation-r\d+(-[ab])?\.(json|md)$/;

// files = <次>/ 下的相对路径数组（如 ['progress.md', 'cards/card-01.md']）
export function scanReviewDir(dirName, files) {
  const codes = [];
  const hasArtifact = files.some((f) => !f.includes('/') && ARTIFACT_RE.test(f));
  if (!hasArtifact && !STOCK_DIR_WHITELIST.has(dirName)) {
    codes.push({ code: 'ArtifactMissing', message: `${dirName} 无 observation 产物且不在存量白名单` });
  }
  const stray = files.filter((f) => {
    if (!f.includes('/') && ARTIFACT_RE.test(f)) return false;
    if (STOCK_FILE_WHITELIST.has(`${dirName}/${f}`)) return false;
    if (f.startsWith('cards/')) return !ALLOWED_FILE_RE.test(f.slice('cards/'.length));
    return !ALLOWED_FILE_RE.test(f);
  });
  if (stray.length) {
    codes.push({ code: 'UnclassifiedArtifact', message: `${dirName} 含未分类文件：${stray.join('、')}` });
  }
  return codes;
}
```

- [ ] **Step 2: 三态自查**

```powershell
node -e "import('./tools/observation-check/gate-scan.mjs').then(({scanReviewDir:s})=>{console.log('missing',s('2026-10-20-0000-no-obs',['progress.md']).map(c=>c.code));console.log('stray',s('2026-10-21-0000-x',['random-notes.md']).map(c=>c.code));console.log('stock',s('2026-10-25-1723-s6-eval',['rubric.md','cards/card-01.md']).map(c=>c.code));console.log('ok',s('2026-10-22-0000-y',['observation-r1.json','observation-r1.md','progress.md','cards/card-01.md']).map(c=>c.code))})"
```

Expected:
- `missing` = `['ArtifactMissing']`（无 `UnclassifiedArtifact`）
- `stray` = `['ArtifactMissing','UnclassifiedArtifact']`
- `stock` = `[]`
- `ok` = `[]`

---

### Task 9: 旧夹具改批（10 条 agents 依赖 + 5 处 coverage 基具 + 2 处旧文案）+ A05 扩展 + F04 指针 + B19 派工

**Files:**
- Create: `tools/observation-check/fixtures.mjs`（测试夹具公共构造器，**不在**迁入 sha256 清单内）
- Create: `tools/observation-check/baseline.test.mjs`
- Modify: `tools/observation-check/checks.test.mjs`、`write.test.mjs`、`render-check.test.mjs`、`artifact.test.mjs`、`adversarial.test.mjs`、`evidence.test.mjs`
- Modify: `tools/observation-check/render.mjs`（仅 demo 段加守卫）
- Modify: `docs/after/20261026164718-agent-card-composition-exploration.md:686`
- Modify: `docs/superpowers/specs/2026-10-27-s2-observation-check-design-testcase.md`（**由 senior-sdet 子代理独立写 B19**，主 agent 只转派工单）

**Interfaces:**
- Consumes: `repoRoot` / `REGISTERED_IDS` / `writeObservation`（Task 3/6）、`MIGRATION_COMMIT`（Task 2 Step 6）
- Produces: `fixtures.mjs`（`makeDir` / `evidenceLines` / `docBase` / `IDS`）供 Task 10 全部新用例复用

- [ ] **Step 1: 写 `fixtures.mjs`**

```js
// 测试夹具公共构造器：临时目录 + 自建证据件 + 合法 doc 基具。
// 纪律：一律 mkdtempSync 自建于仓库内 .session/reviews/ 下，不引用仓库既有文件作证据（PRD §4.3 仓外/自建口径）
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { repoRoot } from './evidence.mjs';
import { REGISTERED_IDS } from './registered-ids.mjs';

export const IDS = REGISTERED_IDS;
export const rel = (abs) => relative(repoRoot(), abs).split(sep).join('/');

export function makeDir(prefix = 'test-obs-check-') {
  const dir = mkdtempSync(join(repoRoot(), '.session', 'reviews', prefix));
  return { dir, dispose: () => rmSync(dir, { recursive: true, force: true }) };
}

// 自建证据件 → { path（相对仓库根）, line, quote }；内容与引用逐字对应
export function evidenceLines(dir, lines, { name = 'ev.md', line = 1 } = {}) {
  const abs = join(dir, name);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, `${lines.join('\n')}\n`, 'utf8');
  return { path: rel(abs), line, quote: lines[line - 1] };
}

// 合法 doc 基具：read = items.length、total = REGISTERED_IDS.length、skipped = 差集（七条对账天然成立）
export function docBase({ evidence, items = null, open = [], closure = 'no-findings', round = 3, instance = null } = {}) {
  const list = items ?? [
    { id: 'k01', verdict: 'hit', evidence },
    { id: 'k02', verdict: 'na', reason: '不适用' },
  ];
  return {
    round,
    instance,
    items: list,
    open,
    coverage: {
      read: list.length,
      total: IDS.length,
      skipped: IDS.filter((id) => !list.some((it) => it.id === id)),
    },
    closure,
  };
}
```

- [ ] **Step 2: 写 `baseline.test.mjs`（A01–A03 / A05 / F01 / F02 / F04）**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { repoRoot } from './evidence.mjs';

const ROOT = repoRoot();
const DIR = join(ROOT, 'tools/observation-check');
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
// Task 2 Step 6 `git rev-parse HEAD` 的 40 位输出，逐字填入
const MIGRATION_COMMIT = '0000000000000000000000000000000000000000';
const EXPLORATION = join(ROOT, 'docs/after/20261026164718-agent-card-composition-exploration.md');
const SELF = basename(fileURLToPath(import.meta.url));

function testFiles() {
  return readdirSync(DIR).filter((f) => f.endsWith('.test.mjs')).map((f) => ({ name: f, text: readFileSync(join(DIR, f), 'utf8') }));
}
function migrationFiles() {
  return git('ls-tree', '--name-only', MIGRATION_COMMIT, 'tools/observation-check/')
    .trim().split(/\r?\n/).map((p) => basename(p)).filter((n) => n.endsWith('.mjs'));
}
function blob(name) {
  return execFileSync('git', ['show', `${MIGRATION_COMMIT}:tools/observation-check/${name}`], { cwd: ROOT, maxBuffer: 1 << 26 });
}

test('A01 迁入提交 diff 只有新增文件（11 个 A）', () => {
  assert.ok(!MIGRATION_COMMIT.startsWith('0000'), '先把 MIGRATION_COMMIT 填成真 hash');
  const rows = git('diff', '--name-status', `${MIGRATION_COMMIT}^`, MIGRATION_COMMIT).trim().split(/\r?\n/);
  assert.equal(rows.length, 11, rows.join('\n'));
  assert.ok(rows.every((r) => /^A\t/.test(r)), rows.join('\n'));
});

test('A02 11 文件 sha256 === 迁入提交 message 登记清单', () => {
  const msg = git('log', '-1', '--format=%B', MIGRATION_COMMIT);
  const listed = new Map([...msg.matchAll(/([A-Za-z0-9_.-]+\.mjs)\s+([0-9A-F]{64})/g)].map((m) => [m[1], m[2]]));
  assert.equal(listed.size, 11, `清单行数 ${listed.size}`);
  const names = migrationFiles();
  assert.equal(names.length, 11);
  for (const n of names) {
    assert.equal(createHash('sha256').update(blob(n)).digest('hex').toUpperCase(), listed.get(n), n);
  }
});

test('A03 迁入版 11 文件合计非空行 = 888', () => {
  const total = migrationFiles().reduce((n, f) => n + blob(f).toString('utf8').split(/\r?\n/).filter((l) => l.length > 0).length, 0);
  assert.equal(total, 888);
});

test('A05 测试对 agents/ 引用 = 0（静态面含 path 字面量扩展）', () => {
  const hits = testFiles()
    .filter(({ name }) => name !== SELF)             // 免扫仅限本审计脚本自身（非证据夹具）
    .flatMap(({ name, text }) => {
      const out = [];
      if (/agents[/\\]/.test(text)) out.push(`${name}: agents/`);
      if (/path:\s*['"`](agents|docs|tools)\//.test(text)) out.push(`${name}: path 字面量`);
      return out;
    });
  assert.deepEqual(hits, []);
});

test('F01 旧 coverage 基具 0 残留', () => {
  const hits = testFiles().filter(({ text }) => text.includes('read: 4, total: 4')).map(({ name }) => name);
  assert.deepEqual(hits, []);
});

test('F02 旧文案 0 残留、新文案 ≥2 处', () => {
  const files = testFiles();
  assert.deepEqual(files.filter(({ text }) => /读 \d+ 部分/.test(text)).map(({ name }) => name), []);
  const hits = files.filter(({ text }) => text.includes('已判')).length;
  assert.ok(hits >= 2, `「已判」命中 ${hits} 处`);
});

test('F04 探索稿 :686 旧 schema 片段 0 残留 + PRD 指针在位', () => {
  const text = readFileSync(EXPLORATION, 'utf8');
  assert.equal((text.match(/coverage: \{ read, total, skipped: \[\] \}/g) ?? []).length, 0);
  assert.ok(text.includes('docs/prd/20261026205821-agent-card-contract.md'), '缺 PRD §4.1 指针');
});
```

- [ ] **Step 3: 逐文件改批（10 条 agents 依赖 + 5 处基具 + 2 处旧文案）**

| 文件 | 改动 | 具体做法 |
|---|---|---|
| `checks.test.mjs` | ① 基具（草稿行 16）② 文本断言（草稿行 80）③ 「接上读盘校验后真实证据仍通过」 | ① 基具换成 `docBase({ evidence: evidenceLines(dir, ['第一条真实观察行'] ) })`，并 `test.after(dispose)`；② 断言改 `/覆盖度：已判 2 条 \/ 共 3 条/`；③ 证据路径改自建件（`makeDir` + `evidenceLines`），不再指向 `agents/` |
| `write.test.mjs` | ① 基具 ② 四条写盘用例（「两个文件都写」/「重复写入幂等」/「写完手改 md → RenderMismatch」/「退出码 0/1」） | 全改 `makeDir()` + `writeObservation(doc, { jsonDir: dir, registeredIds: IDS })`；退出码用例改用 `validateArtifactExitCode` |
| `artifact.test.mjs` | ① 基具 ② 三条（合法 json+md / md 被手改 → RenderMismatch / 退出码） | 改为 `writeObservation` 现造产物再 `validateArtifact`；「md 被手改」在盘上 append 一行制造不一致 |
| `render-check.test.mjs` | ① 基具 ② replace 目标（草稿行 39） | ① 基具换 `docBase`；② `replace('已判 2 条', '已判 1 条')`（新文案，确保 replace 能命中目标——F02 要求 ≥1 命中） |
| `adversarial.test.mjs` | ① 基具 ② A10（行号越界）③ A11（引用不符） | 证据改自建件：A10 `line = lines.length + 1`；A11 `quote: '文件里没有这句'`；断言 `EvidenceLineOutOfRange` / `EvidenceQuoteMismatch` |
| `evidence.test.mjs` | 「正例：真实仓库文件可解析」 | 证据改自建件（`evidenceLines`），断言 `checkEvidence(ev).ok === true` |

改批纪律（R6）：**只改夹具与引用面，不删任何 `assert`**；改完 `git diff <迁入提交>..HEAD -- 'tools/observation-check/*.test.mjs'` 中「以 `-` 开头且含 `assert`」的行数必须为 0（F03 的机器判，见 Step 6）。

- [ ] **Step 4: `render.mjs` demo 段加守卫（I 组冒烟前置；否则 import 即打印）**

文件尾部 3 行 `for (const seat of SEATS) { … }` 整段替换为：

```js
// demo：只在直接执行本文件时打印（import 时不产生噪声）
const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  for (const seat of SEATS) {
    console.log('================ 卡面（给 AI）================');
    console.log(renderCard(seat));
    console.log('================ README（给人）================');
    console.log(renderReadme(seat));
  }
}
```

并在文件首行 import 区补 `import { pathToFileURL } from 'node:url';`。

- [ ] **Step 5: 探索稿 :686 改指针（锚点 5 的「+1 处」）**

把 `docs/after/20261026164718-agent-card-composition-exploration.md:686` 的 schema 片段（`coverage: { read, total, skipped: [] },` 一行）替换为指针行，**其余结论句一字不动**：

```js
// coverage 语义以 docs/prd/20261026205821-agent-card-contract.md §4.1 为唯一来源（2026-10-27 起）；
// 本行原为 schema 片段，已改为指针，避免第二份真相漂移。
```

```powershell
Select-String -Path docs\after\20261026164718-agent-card-composition-exploration.md -Pattern 'coverage: \{ read, total, skipped: \[\] \}'
Select-String -Path docs\after\20261026164718-agent-card-composition-exploration.md -Pattern '20261026205821-agent-card-contract'
```

Expected: 第一条 0 行；第二条 ≥1 行。

- [ ] **Step 6: 派 senior-sdet 独立补 B19（议会 problems.md §2 派工项）**

用 `Agent` 起一个 `senior-sdet` 角色实例（全新上下文），工单逐字：

> 在 `docs/superpowers/specs/2026-10-27-s2-observation-check-design-testcase.md` 补一条用例 B19（registeredIds 单源清单），并在 `tools/observation-check/coverage.test.mjs` 落实现。判据两条：① `tools/observation-check/registered-ids.mjs` 存在且导出非空字符串数组 `REGISTERED_IDS`；② 用 `REGISTERED_IDS.filter(id => id !== 'k02')` 作 `registeredIds`、doc 的 `coverage.total = REGISTERED_IDS.length` → `validateObservation` 必报 `CoverageMismatch`（删一个 id 即对账红）。落点：testcase §1.1 覆盖总表加一行（类型=负、层级=单元、执行=常驻、优先级 P2）、§2 B 组加小节（五要素齐）、§4 计数 `69 → 70`（正 26 / 负 39 / 边界 5）。只改这两处文件，不动其它。

Expected: testcase 内 `B19` 出现 ≥3 次、`用例总数 | **70**`；`node --test tools\observation-check\coverage.test.mjs` 绿。

- [ ] **Step 7: 全量跑 + 禁放宽机器判**

```powershell
node --test tools\observation-check\*.test.mjs
git diff --stat <迁入提交>..HEAD -- "tools/observation-check/*.test.mjs"
git diff <迁入提交>..HEAD -- "tools/observation-check/*.test.mjs" | Select-String -Pattern "^-.*assert"
node -e "const {execFileSync}=require('node:child_process');const out=execFileSync('git',['ls-tree','--name-only','HEAD','tools/observation-check/'],{encoding:'utf8'});console.log('treeFiles',out.trim().split('\n').filter(f=>f.endsWith('.test.mjs')).length)"
```

Expected: 第一条 `# fail 0`（此时 C/D/E/H/I 组尚未补，允许个别新文件缺失导致的计数差异，逐条记录）；第三条输出行数 = 0（禁放宽）；第四条 `treeFiles ≥ 6`（文件名集合 ⊇ 迁入集）。

- [ ] **Step 8: Commit**

```powershell
git add tools/observation-check docs/after/20261026164718-agent-card-composition-exploration.md docs/superpowers/specs/2026-10-27-s2-observation-check-design-testcase.md
git commit -m "test(s2): 夹具改 mkdtemp 自建（root 单源）+ 5 处 coverage 基具重写 + 探索稿指针

禁放宽自查：改造 diff 中「删除且含 assert」= 0；测试文件名超集保持。
B19 由 senior-sdet 独立上下文补写（testcase 69 → 70）。"
```

---

### Task 10: 新增用例（B / C / D / E / F / G / H / I 组）

**Files:**
- Modify: `tools/observation-check/checks.test.mjs`（B01–B06 / B15 / B16）
- Create: `tools/observation-check/coverage.test.mjs`（B07–B14 / B19 / F03）
- Modify: `tools/observation-check/evidence.test.mjs`（C01–C05 / C07）
- Modify: `tools/observation-check/render-check.test.mjs`（D01–D04 / D08）
- Modify: `tools/observation-check/artifact.test.mjs`（B17 / B18 / C06）
- Modify: `tools/observation-check/write.test.mjs`（E01 / E03–E07）
- Create: `tools/observation-check/cli.test.mjs`（E02 / E08–E14）
- Create: `tools/observation-check/gate-scan.test.mjs`（G03–G05）
- Create: `tools/observation-check/render.test.mjs`（I01 / I02）
- Modify: `tools/observation-check/adversarial.test.mjs`（H01–H04）

**Interfaces:**
- Consumes: `fixtures.mjs`（Task 9）、全实现面（Task 3–8）
- Produces: 常驻用例覆盖 testcase §1.1 全表（除 A04/A06/A07/G01/G02 五条验收项）

- [ ] **Step 1: `checks.test.mjs` 结构组（B01–B06 / B15 / B16）**

```js
import { docBase, evidenceLines, makeDir, IDS } from './fixtures.mjs';

const { dir, dispose } = makeDir();
test.after(dispose);
const ev = evidenceLines(dir, ['第一条真实观察行']);

const withItem = (patch) => docBase({ evidence: ev, items: [{ id: 'k01', verdict: 'hit', evidence: ev, ...patch }] });
const CASES = [
  ['B01 InvalidDocument', () => null, 'InvalidDocument'],
  ['B01 InvalidDocument 数组', () => [], 'InvalidDocument'],
  ['B01 InvalidDocument 字符串', () => 'x', 'InvalidDocument'],
  ['B02 MissingItems 缺失', () => ({ ...docBase({ evidence: ev }), items: undefined }), 'MissingItems'],
  ['B02 MissingItems 空数组', () => ({ ...docBase({ evidence: ev }), items: [] }), 'MissingItems'],
  ['B02 MissingItems 字符串', () => ({ ...docBase({ evidence: ev }), items: 'k01' }), 'MissingItems'],
  ['B03 MissingOpenField object', () => ({ ...docBase({ evidence: ev }), open: [{ impact: 'i', suggestion: 's', evidence: ev }] }), 'MissingOpenField'],
  ['B03 MissingOpenField impact', () => ({ ...docBase({ evidence: ev }), open: [{ object: 'o', suggestion: 's', evidence: ev }] }), 'MissingOpenField'],
  ['B03 MissingOpenField suggestion', () => ({ ...docBase({ evidence: ev }), open: [{ object: 'o', impact: 'i', evidence: ev }] }), 'MissingOpenField'],
  ['B04 MissingReason na 无 reason', () => docBase({ items: [{ id: 'k01', verdict: 'na' }] }), 'MissingReason'],
  ['B04 MissingReason na 空白', () => docBase({ items: [{ id: 'k01', verdict: 'na', reason: '  ' }] }), 'MissingReason'],
  ['B05 MissingReason miss 无 reason', () => docBase({ items: [{ id: 'k01', verdict: 'miss' }] }), 'MissingReason'],
  ['B06 UnknownClosure', () => ({ ...docBase({ evidence: ev }), closure: 'done' }), 'UnknownClosure'],
  ['B16 MissingEvidence', () => docBase({ items: [{ id: 'k01', verdict: 'hit' }] }), 'MissingEvidence'],
  ['B16 InvalidFieldType', () => withItem({ evidence: 'not-an-object' }), 'InvalidFieldType'],
];

for (const [name, make, want] of CASES) {
  test(name, () => {
    const codes = validateObservation(make(), { registeredIds: IDS }).errors.map((e) => e.code);
    assert.ok(codes.includes(want), `期望 ${want}，实得 ${JSON.stringify(codes)}`);
  });
}

test('B15 UnregisteredIdsMissing（不传 registeredIds）', () => {
  const codes = validateObservation(docBase({ evidence: ev })).errors.map((e) => e.code);
  assert.ok(codes.includes('UnregisteredIdsMissing'), JSON.stringify(codes));
});
```

- [ ] **Step 2: `coverage.test.mjs`（B07–B14 / B19 / F03）**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateObservation } from './checks.mjs';
import { docBase, evidenceLines, makeDir, IDS } from './fixtures.mjs';
import { REGISTERED_IDS } from './registered-ids.mjs';

const { dir, dispose } = makeDir();
test.after(dispose);
const ev = evidenceLines(dir, ['第一条真实观察行']);
const two = () => [
  { id: 'k01', verdict: 'hit', evidence: ev },
  { id: 'k02', verdict: 'na', reason: '不适用' },
];
const codesOf = (doc, ids = IDS) => validateObservation(doc, { registeredIds: ids }).errors.map((e) => e.code);

test('B07 DuplicateItem', () => {
  const doc = docBase({ items: [...two(), { id: 'k01', verdict: 'na', reason: '重了' }] });
  assert.ok(codesOf(doc).includes('DuplicateItem'));
});

test('B08 CoverageMismatch：items.length ≠ read（两形态）', () => {
  const a = docBase({ items: two() });
  a.coverage.read = 1;                       // items 2 / read 1
  assert.ok(codesOf(a).includes('CoverageMismatch'));
  const b = docBase({ items: [...two(), { id: 'k03', verdict: 'miss', reason: '没找到' }] });
  b.coverage.read = 2;                       // items 3 / read 2
  assert.ok(codesOf(b).includes('CoverageMismatch'));
});

test('B09 CoverageMismatch：total ≠ registeredIds.length', () => {
  const doc = docBase({ items: two() });
  doc.coverage.total = 2;                    // registeredIds 3
  const errors = validateObservation(doc, { registeredIds: IDS }).errors;
  assert.ok(errors.some((e) => e.code === 'CoverageMismatch' && /total/.test(e.message)));
});

test('B10 CoverageMismatch：read + skipped ≠ total（两形态）', () => {
  const a = docBase({ items: two() });
  a.coverage.skipped = ['k03'];              // 2 + 1 ≠ 3? 2+1=3 → 改 read=1 造错
  a.coverage.read = 1;
  assert.ok(validateObservation(a, { registeredIds: IDS }).errors.some((e) => e.code === 'CoverageMismatch' && /read \+ skipped/.test(e.message)));
  const b = docBase({ items: two() });
  b.coverage.total = 4;
  assert.ok(validateObservation(b, { registeredIds: ['k01', 'k02', 'k03'] }).errors.some((e) => e.code === 'CoverageMismatch'));
});

test('B11 CoverageMismatch：skipped 含未登记 id', () => {
  const doc = docBase({ items: two() });
  doc.coverage.skipped = ['k99'];
  const errors = validateObservation(doc, { registeredIds: IDS }).errors;
  assert.ok(errors.some((e) => e.code === 'CoverageMismatch' && /skipped/.test(e.message) && /k99/.test(e.message)));
});

test('B12 CoverageMismatch：items ∩ skipped ≠ ∅', () => {
  const doc = docBase({ items: [{ id: 'k01', verdict: 'hit', evidence: ev }] });
  doc.coverage.read = 1;
  doc.coverage.skipped = ['k01', 'k02'];
  doc.coverage.total = 3;
  assert.ok(validateObservation(doc, { registeredIds: IDS }).errors.some((e) => e.code === 'CoverageMismatch' && /又判又跳/.test(e.message)));
});

test('B13 InvalidCoverage：read > total', () => {
  const doc = docBase({ items: two() });
  doc.coverage.read = 3;
  doc.coverage.total = 2;
  assert.ok(codesOf(doc).includes('InvalidCoverage'));
});

test('B14 正例：skipped 非空且七条全过 → 零错误', () => {
  assert.deepEqual(codesOf(docBase({ items: two() })), []);
});

test('B19 registeredIds 单源清单（议会派工）：清单在位 + 删一个 id 即对账红', () => {
  assert.ok(Array.isArray(REGISTERED_IDS) && REGISTERED_IDS.length > 0);
  const doc = docBase({ items: two() });     // total = REGISTERED_IDS.length
  const codes = validateObservation(doc, { registeredIds: REGISTERED_IDS.filter((id) => id !== 'k02') }).errors.map((e) => e.code);
  assert.ok(codes.includes('CoverageMismatch'), JSON.stringify(codes));
});
```

- [ ] **Step 3: `evidence.test.mjs` 证据组（C01–C05 / C07）**

```js
// 前置：本文件顶部已 import test / assert / checkEvidence（草稿原样保留）；夹具在本块内自建，不依赖文件级 dir
import { evidenceLines, makeDir } from './fixtures.mjs';

const cdir = makeDir();
test.after(cdir.dispose);

const sensitiveNames = ['.env', '.env.local', 'server.pem', 'ca.key', 'client.p12', 'id_rsa', 'id_ed25519_x', '.npmrc', '.netrc', 'credentials.json', 'my-secret-notes.md'];
test('C01 EvidenceSensitivePath：11 形态逐类命中', () => {
  for (const name of sensitiveNames) {
    const ev = evidenceLines(cdir.dir, ['内容足够长的真实观察行'], { name });
    const r = checkEvidence(ev);
    assert.equal(r.code, 'EvidenceSensitivePath', `${name} → ${JSON.stringify(r)}`);
  }
});

test('C02 EvidenceSensitivePath：反斜杠 / 混合分隔', () => {
  for (const p of ['fixtures\\.env', 'a/b\\.env']) {
    const ev = { ...evidenceLines(cdir.dir, ['内容足够长的真实观察行'], { name: '.env' }), path: p };
    assert.equal(checkEvidence(ev).code, 'EvidenceSensitivePath', p);
  }
});

test('C03 假阳性守卫：普通路径不误报', () => {
  for (const name of ['observation.mjs', 'key-terms.md', '.gitignore']) {
    const ev = evidenceLines(cdir.dir, ['内容足够长的真实观察行'], { name });
    assert.notEqual(checkEvidence(ev).code, 'EvidenceSensitivePath', name);
  }
});

test('C04 EvidenceQuoteSensitive：四形态逐字命中', () => {
  const lines = [
    '-----BEGIN RSA PRIVATE KEY-----',
    'AKIAIOSFODNN7EXAMPLE',
    `ghp_${'a'.repeat(36)}`,
    'https://user:pass@example.com/repo',
  ];
  for (let i = 0; i < lines.length; i += 1) {
    const ev = evidenceLines(cdir.dir, lines, { name: 'secrets.md', line: i + 1 });
    assert.equal(checkEvidence(ev).code, 'EvidenceQuoteSensitive', `第 ${i + 1} 行`);
  }
});

test('C05 假阳性守卫：无凭据 URL 零错误', () => {
  const ev = evidenceLines(cdir.dir, ['https://github.com/org/repo/blob/main/a.md', 'https://example.com:8080/docs'], { name: 'urls.md' });
  assert.equal(checkEvidence({ ...ev, line: 1 }).ok, true);
  assert.equal(checkEvidence({ ...ev, line: 2 }).ok, true);
});

test('C07 纯结构行不可作证据（3 形态）', () => {
  const table = evidenceLines(cdir.dir, ['| --- | --- | --- |'], { name: 'struct.md' });
  assert.equal(checkEvidence(table).code, 'EvidenceStructuralRow');      // ① 13 字过长度 → 结构行码
  const fence = evidenceLines(cdir.dir, ['```'], { name: 'fence.md' });
  assert.equal(checkEvidence(fence).code, 'EvidenceQuoteTooShort');      // ② 3 字 → 长度道
  const dash = evidenceLines(cdir.dir, ['---'], { name: 'dash.md' });
  assert.equal(checkEvidence(dash).code, 'EvidenceQuoteTooShort');       // ③ 3 字 → 长度道
});
```

- [ ] **Step 4: `render-check.test.mjs` 渲染组（D01–D04 / D08）**

```js
// 前置：本文件顶部已 import test / assert / renderObservation / checkRendered / writeObservation / validateArtifact / readFileSync / join（草稿原样保留）
import { splitRow } from '../execution-matrix/markdown-rows.mjs';
import { docBase, evidenceLines, makeDir, IDS } from './fixtures.mjs';

const rdir = makeDir();
test.after(rdir.dispose);

test('D01 hit 行含 path:line、全 md 无 [object Object]', () => {
  const md = renderObservation(docBase({ evidence: { path: 'fixtures/ev.md', line: 3, quote: '真实引用' } }));
  assert.match(md, /fixtures\/ev\.md:3/);
  assert.ok(!md.includes('[object Object]'));
});

test('D02 open 行含 evidence 的 path 与 line', () => {
  const ev = { path: 'fixtures/open.md', line: 9, quote: '真实引用' };
  const md = renderObservation(docBase({ evidence: evidenceLines(rdir.dir, ['第一条真实观察行']), open: [{ object: '甲乙结论句', impact: 'i', suggestion: 's', evidence: ev }] }));
  const row = md.split('\n').find((l) => l.includes('甲乙结论句'));
  assert.ok(row.includes(ev.path) && row.includes(String(ev.line)), row);
});

test('D03 竖线转义后表格行列数 = 表头列数', () => {
  const md = renderObservation(docBase({
    evidence: evidenceLines(rdir.dir, ['第一条真实观察行']),
    items: [{ id: 'k01', verdict: 'na', reason: 'A || B' }],
    open: [{ object: '筛 | 关键', impact: 'i', suggestion: 's', evidence: evidenceLines(rdir.dir, ['第一条真实观察行'], { name: 'o.md' }) }],
  }));
  const rows = md.split('\n').filter((l) => l.startsWith('|'));
  const width = splitRow(rows[0]).length;
  assert.ok(rows.every((l) => splitRow(l).length === width), rows.join('\n'));
  assert.ok(md.includes('筛 \\| 关键'));
});

test('D04 含 \\| 的合法产物全链路绿', () => {
  const d = makeDir();
  try {
    const doc = docBase({ evidence: evidenceLines(d.dir, ['第一条真实观察行']), open: [{ object: '筛 | 关键', impact: 'i', suggestion: 's', evidence: evidenceLines(d.dir, ['第一条真实观察行'], { name: 'o.md' }) }] });
    const w = writeObservation(doc, { jsonDir: d.dir, registeredIds: IDS });
    assert.equal(w.ok, true, JSON.stringify(w));
    const r = validateArtifact(join(d.dir, 'observation-r3.json'), { registeredIds: IDS });
    assert.deepEqual(r.errors, []);
    assert.ok(readFileSync(join(d.dir, 'observation-r3.md'), 'utf8').includes('筛 \\| 关键'));
  } finally { d.dispose(); }
});

test('D08 覆盖度文案：已判 N 条 / 共 M 条（跳过 K：…）', () => {
  const md = renderObservation(docBase({ evidence: evidenceLines(rdir.dir, ['第一条真实观察行']) }));
  assert.ok(md.includes('已判 2 条 / 共 3 条'));
  assert.ok(md.includes('跳过 1：k03'));
});
```

- [ ] **Step 5: `write.test.mjs` 写盘组（E01 / E03–E07）**

```js
// 前置：本文件顶部已 import test / assert / writeObservation / validateArtifact / existsSync / readdirSync / join（草稿原样保留）
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { repoRoot } from './evidence.mjs';
import { docBase, evidenceLines, makeDir, IDS } from './fixtures.mjs';

const ROOT = repoRoot();

test('E01 文件名派生：r3 两文件；instance=A → 小写 -a', () => {
  for (const [instance, names] of [
    [null, ['observation-r3.json', 'observation-r3.md']],
    ['A', ['observation-r3-a.json', 'observation-r3-a.md']],
  ]) {
    const f = makeDir();
    const t = makeDir();
    try {
      const ev = evidenceLines(f.dir, ['第一条真实观察行']);
      const w = writeObservation(docBase({ evidence: ev, instance }), { jsonDir: t.dir, registeredIds: IDS });
      assert.equal(w.ok, true, JSON.stringify(w));
      assert.deepEqual(readdirSync(t.dir).sort(), names);   // 目标目录恰两文件，无杂物
    } finally { f.dispose(); t.dispose(); }
  }
});

test('E03 ArtifactPathOutside：非过程目录（tools/ 与 .session/tmp/ 两形态）', () => {
  const f = makeDir();
  try {
    const ev = evidenceLines(f.dir, ['第一条真实观察行']);
    const doc = docBase({ evidence: ev });
    const r1 = writeObservation(doc, { jsonDir: join(ROOT, 'tools'), registeredIds: IDS });
    assert.ok(r1.errors.map((e) => e.code).includes('ArtifactPathOutside'), JSON.stringify(r1));
    assert.equal(existsSync(join(ROOT, 'tools', 'observation-r3.json')), false);

    const tmpRoot = join(ROOT, '.session', 'tmp');
    mkdirSync(tmpRoot, { recursive: true });
    const t2 = mkdtempSync(join(tmpRoot, 'test-artifact-out-'));
    try {
      const r2 = writeObservation(doc, { jsonDir: t2, registeredIds: IDS });
      assert.ok(r2.errors.map((e) => e.code).includes('ArtifactPathOutside'), JSON.stringify(r2));
      assert.equal(existsSync(join(t2, 'observation-r3.json')), false);
    } finally { rmSync(t2, { recursive: true, force: true }); }
  } finally { f.dispose(); }
});

test('E04 ArtifactPathOutside：归档目录只读（含 test- 前缀自建目录）', () => {
  const f = makeDir();
  const arch = mkdtempSync(join(ROOT, 'docs', 'superpowers', 'reviews', 'test-artifact-out-'));
  try {
    const ev = evidenceLines(f.dir, ['第一条真实观察行']);
    const r = writeObservation(docBase({ evidence: ev }), { jsonDir: arch, registeredIds: IDS });
    assert.ok(r.errors.map((e) => e.code).includes('ArtifactPathOutside'), JSON.stringify(r));
    assert.equal(existsSync(join(arch, 'observation-r3.json')), false);
  } finally { rmSync(arch, { recursive: true, force: true }); f.dispose(); }
});

test('E05 合法 jsonDir 正例：.session/reviews/<次>/ 写盘通过 + 读回零错误', () => {
  const f = makeDir();
  const t = makeDir();
  try {
    const ev = evidenceLines(f.dir, ['第一条真实观察行']);
    const w = writeObservation(docBase({ evidence: ev }), { jsonDir: t.dir, registeredIds: IDS });
    assert.equal(w.ok, true, JSON.stringify(w));
    assert.deepEqual(validateArtifact(join(t.dir, 'observation-r3.json'), { registeredIds: IDS }).errors, []);
  } finally { f.dispose(); t.dispose(); }
});

test('E06 WriteFailed：md 侧失败 → json 不落盘 + 零 tmp 残留', () => {
  const f = makeDir();
  const t = makeDir();
  try {
    const ev = evidenceLines(f.dir, ['第一条真实观察行']);
    mkdirSync(join(t.dir, 'observation-r3.md'));                 // 目录占位同名 md → rename 必失败
    const r = writeObservation(docBase({ evidence: ev }), { jsonDir: t.dir, registeredIds: IDS });
    assert.ok(r.errors.map((e) => e.code).includes('WriteFailed'), JSON.stringify(r));
    assert.equal(existsSync(join(t.dir, 'observation-r3.json')), false);   // rename 顺序 md 先 → json 未落地
    assert.equal(readdirSync(t.dir).filter((x) => x.includes('.tmp-')).length, 0);
  } finally { f.dispose(); t.dispose(); }
});

test('E07 InvalidWriteTarget：jsonDir 不存在 / 指向文件（两形态）', () => {
  const f = makeDir();
  try {
    const ev = evidenceLines(f.dir, ['第一条真实观察行']);
    const doc = docBase({ evidence: ev });
    const missing = join(f.dir, 'no-such-dir');
    const r1 = writeObservation(doc, { jsonDir: missing, registeredIds: IDS });
    assert.ok(r1.errors.map((e) => e.code).includes('InvalidWriteTarget'), JSON.stringify(r1));
    assert.equal(existsSync(missing), false);

    const fileAsDir = join(f.dir, 'not-a-dir.txt');
    writeFileSync(fileAsDir, 'x', 'utf8');
    const r2 = writeObservation(doc, { jsonDir: fileAsDir, registeredIds: IDS });
    assert.ok(r2.errors.map((e) => e.code).includes('InvalidWriteTarget'), JSON.stringify(r2));
  } finally { f.dispose(); }
});
```

- [ ] **Step 6: `cli.test.mjs`（E02 / E08–E14，整文件新建）**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateArtifact, writeObservation } from './artifact.mjs';
import { renderObservation, checkRendered } from './checks.mjs';
import { repoRoot } from './evidence.mjs';
import { docBase, evidenceLines, makeDir, IDS } from './fixtures.mjs';

const ROOT = repoRoot();
const CLI = join(dirname(fileURLToPath(import.meta.url)), 'cli.mjs');
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

// 退出码捕获：execFileSync 失败时 e.status / e.stdout / e.stderr 一并取
function runCli(args) {
  try {
    const out = execFileSync(process.execPath, [CLI, ...args], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { status: 0, out };
  } catch (e) {
    return { status: e.status, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

test('E02 RoundMismatch：文件名 r5 与内容 round=3 不一致 → exit 1', () => {
  const f = makeDir();
  const t = makeDir();
  try {
    const ev = evidenceLines(f.dir, ['第一条真实观察行']);
    writeFileSync(join(t.dir, 'observation-r5.json'), `${JSON.stringify(docBase({ evidence: ev }), null, 2)}\n`, 'utf8');
    const r = runCli([join(t.dir, 'observation-r5.json')]);
    assert.equal(r.status, 1);
    assert.ok(r.out.includes('RoundMismatch'), r.out);
  } finally { f.dispose(); t.dispose(); }
});

test('E08 CLI 正例：合法产物 exit 0 且零写盘（清单 + hash 前后相等）', () => {
  const f = makeDir();
  const t = makeDir();
  try {
    const ev = evidenceLines(f.dir, ['第一条真实观察行']);
    assert.equal(writeObservation(docBase({ evidence: ev }), { jsonDir: t.dir, registeredIds: IDS }).ok, true);
    const snap = () => readdirSync(t.dir).sort().map((x) => `${x}:${sha(join(t.dir, x))}`).join('|');
    const before = snap();
    const r = runCli([join(t.dir, 'observation-r3.json')]);
    assert.equal(r.status, 0, r.out);
    assert.equal(snap(), before);
  } finally { f.dispose(); t.dispose(); }
});

test('E09 CLI 反例：结构坏件 exit 1 且两码并列（非首错即停）', () => {
  const f = makeDir();
  const t = makeDir();
  try {
    const ev = evidenceLines(f.dir, ['第一条真实观察行']);
    const bad = { ...docBase({ evidence: ev }), coverage: undefined, items: [{ id: 'k01', verdict: 'bogus' }] };
    writeFileSync(join(t.dir, 'observation-r3.json'), `${JSON.stringify(bad, null, 2)}\n`, 'utf8');
    const r = runCli([join(t.dir, 'observation-r3.json')]);
    assert.equal(r.status, 1);
    assert.ok(r.out.includes('MissingCoverage'), r.out);
    assert.ok(r.out.includes('UnknownVerdict'), r.out);
  } finally { f.dispose(); t.dispose(); }
});

test('E10 CLI：路径不存在 → JsonNotFound + exit 1', () => {
  const r = runCli([join(ROOT, '.session', 'reviews', 'no-such-round', 'observation-r9.json')]);
  assert.equal(r.status, 1);
  assert.ok(r.out.includes('JsonNotFound'), r.out);
});

test('E11 CLI：md 缺失必判 MdMissing（缺省不得跳过）', () => {
  const f = makeDir();
  const t = makeDir();
  try {
    const ev = evidenceLines(f.dir, ['第一条真实观察行']);
    writeFileSync(join(t.dir, 'observation-r3.json'), `${JSON.stringify(docBase({ evidence: ev }), null, 2)}\n`, 'utf8');
    const r = runCli([join(t.dir, 'observation-r3.json')]);
    assert.equal(r.status, 1);
    assert.ok(r.out.includes('MdMissing'), r.out);
  } finally { f.dispose(); t.dispose(); }
});

test('E12 rewrite 只重渲染 md：json 字节不动；坏件 exit 1 且 md 不动', () => {
  const f = makeDir();
  const t = makeDir();
  try {
    const ev = evidenceLines(f.dir, ['第一条真实观察行']);
    const doc = docBase({ evidence: ev });
    assert.equal(writeObservation(doc, { jsonDir: t.dir, registeredIds: IDS }).ok, true);
    const jp = join(t.dir, 'observation-r3.json');
    const mp = join(t.dir, 'observation-r3.md');
    writeFileSync(mp, `${readFileSync(mp, 'utf8')}\n手改一行`, 'utf8');

    const jh = sha(jp);
    const r = runCli(['rewrite', jp]);
    assert.equal(r.status, 0, r.out);
    assert.equal(sha(jp), jh, 'json 被改写');
    assert.equal(checkRendered(doc, readFileSync(mp, 'utf8')).ok, true);

    // 回扫义务（testcase E12「不覆盖」条）：坏件必须先校验再拒，md 一字不动
    const bad = { ...doc, items: [{ id: 'k01', verdict: 'bogus' }] };
    writeFileSync(jp, `${JSON.stringify(bad, null, 2)}\n`, 'utf8');
    const mh = sha(mp);
    const r2 = runCli(['rewrite', jp]);
    assert.equal(r2.status, 1);
    assert.ok(r2.out.includes('UnknownVerdict'), r2.out);
    assert.equal(sha(mp), mh, '坏件被 rewrite 改了 md');
  } finally { f.dispose(); t.dispose(); }
});

test('E13 rewrite 写非过程目录 → ArtifactPathOutside 且 md 不变', () => {
  const f = makeDir();
  const t = mkdtempSync(join(ROOT, 'tools', 'test-rewrite-nonproc-'));
  try {
    const ev = evidenceLines(f.dir, ['第一条真实观察行']);
    const doc = docBase({ evidence: ev });
    const jp = join(t, 'observation-r3.json');
    const mp = join(t, 'observation-r3.md');
    writeFileSync(jp, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
    writeFileSync(mp, renderObservation(doc), 'utf8');
    const mh = sha(mp);
    const r = runCli(['rewrite', jp]);
    assert.equal(r.status, 1);
    assert.ok(r.out.includes('ArtifactPathOutside'), r.out);
    assert.equal(sha(mp), mh);
  } finally { rmSync(t, { recursive: true, force: true }); f.dispose(); }
});

test('E14 归档件要改：复制到同次过程目录 rewrite，归档 hash 不变', () => {
  const f = makeDir();
  const arch = mkdtempSync(join(ROOT, 'docs', 'superpowers', 'reviews', 'test-obs-check-'));
  const proc = mkdtempSync(join(ROOT, '.session', 'reviews', 'test-rewrite-'));
  try {
    const ev = evidenceLines(f.dir, ['第一条真实观察行']);
    const doc = docBase({ evidence: ev });
    const aj = join(arch, 'observation-r3.json');
    const am = join(arch, 'observation-r3.md');
    writeFileSync(aj, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
    writeFileSync(am, renderObservation(doc), 'utf8');
    const before = [sha(aj), sha(am)];

    const pj = join(proc, 'observation-r3.json');
    const pm = join(proc, 'observation-r3.md');
    copyFileSync(aj, pj);
    const r = runCli(['rewrite', pj]);
    assert.equal(r.status, 0, r.out);
    assert.deepEqual([sha(aj), sha(am)], before, '归档件被改写');
    assert.equal(existsSync(pm), true);
    assert.equal(checkRendered(doc, readFileSync(pm, 'utf8')).ok, true);
  } finally {
    rmSync(proc, { recursive: true, force: true });
    rmSync(arch, { recursive: true, force: true });
    f.dispose();
  }
});
```

- [ ] **Step 7: `gate-scan.test.mjs`（G03–G05，整文件新建）**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { ALLOWED_FILE_RE, STOCK_DIR_WHITELIST, STOCK_FILE_WHITELIST, scanReviewDir } from './gate-scan.mjs';

const codesOf = (dir, files) => scanReviewDir(dir, files).map((c) => c.code);

test('G03 ArtifactMissing：无产物且不在存量白名单（允许类文件不误报）', () => {
  assert.deepEqual(codesOf('2026-10-20-0000-no-obs', ['progress.md']), ['ArtifactMissing']);
});

test('G04 UnclassifiedArtifact：杂件与缺产物并列（两形态）', () => {
  assert.ok(codesOf('2026-10-20-0000-stray', ['random-notes.md']).includes('UnclassifiedArtifact'));
  const both = codesOf('2026-10-20-0000-stray', ['random-notes.md', 'progress.md']);
  assert.equal(both.filter((c) => c === 'ArtifactMissing' || c === 'UnclassifiedArtifact').length, 2, both.join(','));
});

test('G05 三态绿分支：存量目录白名单 + 允许类 8 类（含 cards/ 子层）不误报', () => {
  assert.ok(STOCK_DIR_WHITELIST.has('2026-10-25-1723-s6-eval'));
  assert.equal(STOCK_FILE_WHITELIST.size, 9);
  assert.deepEqual(codesOf('2026-10-25-1723-s6-eval', ['rubric.md', 'cards/card-01.md']), []);
  assert.deepEqual(codesOf('2026-10-20-0000-ok', ['observation-r1.json', 'observation-r1.md']), []);

  const allowed = ['progress.md', 'cards.md', 'problems.md', 'submission.md', 'impact-sheet.md', 'detective.md', 'round-check.md', 'delivery-audit.md'];
  assert.deepEqual(allowed.filter((f) => !ALLOWED_FILE_RE.test(f)), []);
  assert.deepEqual(codesOf('2026-10-20-0000-ledger', [...allowed, 'cards/round-check.md']), []);
});
```

- [ ] **Step 8: `adversarial.test.mjs` 对抗组（H01–H04 + A7 期望码同批改）**

**先改一处既有断言（0.2 #5「码细分未做」的收口）**：把草稿 A7 用例的期望码从 `InvalidFieldType` 改为 `MissingEvidence`（B16 分界：hit 无 evidence = 缺字段，不是类型错）：

```js
test('A7 判 hit 却不给 evidence → MissingEvidence', () => {
  const d = base(); d.items = [{ id: 'k01', verdict: 'hit' }];
  assert.ok(codes(d).includes('MissingEvidence'));
});
```

**顶部 import 增补**（与既有 import 并列）：

```js
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitRow } from '../execution-matrix/markdown-rows.mjs';
import { validateArtifact, writeObservation } from './artifact.mjs';
import { checkEvidence } from './evidence.mjs';
import { renderObservation } from './checks.mjs';
import { docBase, evidenceLines, makeDir, IDS } from './fixtures.mjs';
```

**H 组全文追加**（文件末尾）：

```js
// ============ H 组：对抗与边界钉 ============
const DIR = dirname(fileURLToPath(import.meta.url));
const hdir = makeDir();
test.after(hdir.dispose);
const hEv = evidenceLines(hdir.dir, ['第一条真实观察行', '第二条真实观察行']);
const codesH = (doc, opt = {}) => validateObservation(doc, { registeredIds: IDS, ...opt }).errors.map((e) => e.code);
const hBase = () => docBase({ evidence: hEv });
const V = (id, name, testName, expect, run, named = false) => ({ id, name, testName, expect, run, named });

// 对抗分母唯一取数源（PRD §0.5 Q-A-05 闭合载体）：8 具名 + 13 迁入 + 9 新增 = 30
const ATTACK_VECTORS = [
  // ① 具名 8 条（探索稿 :666 原清单的结构化映射）
  V('n01', '代码块藏字段', 'B02 MissingItems', ['MissingItems'], () => codesH({ ...hBase(), items: undefined }), true),
  V('n02', '覆盖度写「无」（两构造）', 'A1 coverage.read 伪装成', ['MissingCoverage', 'InvalidCoverage'], () => {
    const s = hBase(); s.coverage = '无';
    const t = hBase(); t.coverage.read = '4';
    return [...codesH(s), ...codesH(t)];
  }, true),
  V('n03', '列表式补充项（两构造）', 'A3 open 用对象代替数组', ['InvalidFieldType'], () => {
    const s = hBase(); s.open = { object: '§3.1' };
    const t = hBase(); t.open = [{ object: 'o', impact: 'i', suggestion: 's', evidence: '   ' }];
    return [...codesH(s), ...codesH(t)];
  }, true),
  V('n04', '标题变体（id 换未登记变体 k09）', 'A8 检查项 id 未登记', ['UnknownItem'], () => {
    const d = hBase();
    d.items = [{ id: 'k09', verdict: 'na', reason: 'x' }, { id: 'k01', verdict: 'na', reason: 'y' }];
    d.coverage = { read: 2, total: 3, skipped: ['k02', 'k03'] };
    return codesH(d);
  }, true),
  V('n05', '全角竖线（内容不转义、不破列）', 'D03 竖线转义后表格行列数', [], () => {
    const d = hBase();
    d.open = [{ object: '筛｜关键', impact: 'i', suggestion: 's', evidence: hEv }];
    d.closure = null;
    return codesH(d);
  }, true),
  V('n06', '结论换说法（verdict N/A）', 'A5 verdict 写成', ['UnknownVerdict'], () => {
    const d = hBase();
    d.items = [{ id: 'k01', verdict: 'N/A' }];
    d.coverage = { read: 1, total: 3, skipped: ['k02', 'k03'] };
    return codesH(d);
  }, true),
  V('n07', 'mustHave 拼错', 'A12 requires 用 mustHave 拼错', ['UnknownField'], () => checkPrerequisites([{ id: 'x', mustHave: true }], []).errors.map((e) => e.code), true),
  V('n08', 'must 写成字符串', 'A13 requires 的 must 写成字符串', ['InvalidFieldType'], () => checkPrerequisites([{ id: 'x', must: 'false' }], []).errors.map((e) => e.code), true),

  // ② 迁入 13 条（A1–A13 结构化对抗）
  V('m01', 'coverage.read 字符串伪装', 'A1 coverage.read 伪装成', ['InvalidCoverage'], () => { const d = hBase(); d.coverage.read = '4'; return codesH(d); }),
  V('m02', 'coverage.total = 0 空集伪装', 'A2 coverage.total = 0', ['InvalidCoverage'], () => { const d = hBase(); d.coverage.total = 0; return codesH(d); }),
  V('m03', 'open 用对象代替数组', 'A3 open 用对象代替数组', ['InvalidFieldType'], () => { const d = hBase(); d.open = { object: '§3.1' }; return codesH(d); }),
  V('m04', 'open 项 evidence 全空白', 'A4 open 项 evidence', ['InvalidFieldType'], () => { const d = hBase(); d.open = [{ object: '§3.1', impact: 'x', suggestion: 'y', evidence: '   ' }]; return codesH(d); }),
  V('m05', 'verdict 写成 N/A', 'A5 verdict 写成', ['UnknownVerdict'], () => { const d = hBase(); d.items = [{ id: 'k01', verdict: 'N/A' }]; d.coverage = { read: 1, total: 3, skipped: ['k02', 'k03'] }; return codesH(d); }),
  V('m06', 'open 非空 + closure no-findings', 'A6 open 非空 + closure 声明', ['ContradictoryClosure'], () => { const d = hBase(); d.open = [{ object: '§3.1', impact: 'x', suggestion: 'y', evidence: hEv }]; return codesH(d); }),
  V('m07', '判 hit 却不给 evidence', 'A7 判 hit 却不给 evidence', ['MissingEvidence'], () => { const d = hBase(); d.items = [{ id: 'k01', verdict: 'hit' }]; d.coverage = { read: 1, total: 3, skipped: ['k02', 'k03'] }; return codesH(d); }),
  V('m08', '检查项 id 未登记', 'A8 检查项 id 未登记', ['UnknownItem'], () => { const d = hBase(); d.items = [{ id: 'k99', verdict: 'na', reason: 'x' }]; d.coverage = { read: 1, total: 3, skipped: ['k01', 'k02', 'k03'].filter((x) => x !== 'k99') }; return codesH(d); }),
  V('m09', 'evidence 写成字符串', 'A9 evidence 写成字符串', ['InvalidFieldType'], () => { const d = hBase(); d.items = [{ id: 'k01', verdict: 'hit', evidence: 'a.md:12' }]; d.coverage = { read: 1, total: 3, skipped: ['k02', 'k03'] }; return codesH(d); }),
  V('m10', '假证据：行号越界', 'A10 假证据：行号越界', ['EvidenceLineOutOfRange'], () => { const d = hBase(); d.items = [{ id: 'k01', verdict: 'hit', evidence: { ...hEv, line: 9999 } }]; d.coverage = { read: 1, total: 3, skipped: ['k02', 'k03'] }; return codesH(d, { resolveEvidence: true }); }),
  V('m11', '假证据：引用不符', 'A11 假证据：行号对但引用不符', ['EvidenceQuoteMismatch'], () => { const d = hBase(); d.items = [{ id: 'k01', verdict: 'hit', evidence: { ...hEv, line: 1, quote: '文件里没有这句' } }]; d.coverage = { read: 1, total: 3, skipped: ['k02', 'k03'] }; return codesH(d, { resolveEvidence: true }); }),
  V('m12', 'requires 用 mustHave 拼错', 'A12 requires 用 mustHave 拼错', ['UnknownField'], () => checkPrerequisites([{ id: 'x', mustHave: true }], []).errors.map((e) => e.code)),
  V('m13', 'must 写成字符串', 'A13 requires 的 must 写成字符串', ['InvalidFieldType'], () => checkPrerequisites([{ id: 'x', must: 'false' }], []).errors.map((e) => e.code)),

  // ③ 新增 9 条（C 组 3 + B 组 6）
  V('x01', '敏感路径 .env', 'C01 EvidenceSensitivePath', ['EvidenceSensitivePath'], () => [checkEvidence(evidenceLines(hdir.dir, ['内容足够长的真实观察行'], { name: '.env' })).code]),
  V('x02', '敏感内容 AKIA', 'C04 EvidenceQuoteSensitive', ['EvidenceQuoteSensitive'], () => [checkEvidence(evidenceLines(hdir.dir, ['AKIAIOSFODNN7EXAMPLE'], { name: 'secrets.md' })).code]),
  V('x03', '纯结构行', 'C07 纯结构行不可作证据', ['EvidenceStructuralRow'], () => [checkEvidence(evidenceLines(hdir.dir, ['| --- | --- | --- |'], { name: 'struct.md' })).code]),
  V('x04', 'items.id 重复', 'B07 DuplicateItem', ['DuplicateItem'], () => { const d = hBase(); d.items = [...d.items, { id: 'k01', verdict: 'na', reason: '重了' }]; d.coverage = { read: 3, total: 3, skipped: [] }; return codesH(d); }),
  V('x05', 'items.length ≠ read', 'B08 CoverageMismatch', ['CoverageMismatch'], () => { const d = hBase(); d.coverage.read = 1; return codesH(d); }),
  V('x06', 'total ≠ registeredIds.length', 'B09 CoverageMismatch', ['CoverageMismatch'], () => { const d = hBase(); d.coverage.total = 2; return codesH(d); }),
  V('x07', 'read + skipped ≠ total', 'B10 CoverageMismatch', ['CoverageMismatch'], () => { const d = hBase(); d.coverage.skipped = []; return codesH(d); }),
  V('x08', 'skipped 含未登记 id', 'B11 CoverageMismatch', ['CoverageMismatch'], () => { const d = hBase(); d.coverage.skipped = ['k99']; return codesH(d); }),
  V('x09', 'items ∩ skipped ≠ ∅', 'B12 CoverageMismatch', ['CoverageMismatch'], () => {
    const d = hBase();
    d.items = [{ id: 'k01', verdict: 'hit', evidence: hEv }];
    d.coverage = { read: 1, total: 3, skipped: ['k01', 'k02'] };
    return codesH(d);
  }),
];

const missed = (v) => { const c = v.run(); return !v.expect.every((code) => c.includes(code)); };

test('H01 八条具名攻击的结构化映射（0/8 绕过）', () => {
  const named = ATTACK_VECTORS.filter((v) => v.named);
  assert.equal(named.length, 8);
  assert.deepEqual(named.filter(missed).map((v) => v.id), [], '绕过的向量');
  // 第 5 行姊妹断言：全角竖线是内容，不转义且不破列
  const d = hBase();
  d.open = [{ object: '筛｜关键', impact: 'i', suggestion: 's', evidence: hEv }];
  d.closure = null;
  const md = renderObservation(d);
  const rows = md.split('\n').filter((l) => l.startsWith('|'));
  assert.ok(rows.some((l) => l.includes('筛｜关键')));
  assert.ok(rows.every((l) => splitRow(l).length === splitRow(rows[0]).length));
});

test('H02 对抗分母唯一口径：30 条登记向量 + 承接可检索 + 0 绕过', () => {
  assert.equal(ATTACK_VECTORS.length, 30);
  assert.equal(new Set(ATTACK_VECTORS.map((v) => v.id)).size, 30);
  // 承接检索必须排除本文件自身（不排除则常量里的字符串自匹配，检查空转）
  const others = readdirSync(DIR).filter((f) => f.endsWith('.test.mjs') && f !== 'adversarial.test.mjs');
  const corpus = others.map((f) => readFileSync(join(DIR, f), 'utf8')).join('\n');
  assert.deepEqual(ATTACK_VECTORS.filter((v) => !corpus.includes(v.testName)).map((v) => v.id), [], '承接测试检索不到');
  assert.deepEqual(ATTACK_VECTORS.filter(missed).map((v) => v.id), [], '绕过的向量');
});

test('H03 边界钉：json+md 一起改成一致 → 校验过（本机无锚）', () => {
  const t = makeDir();
  try {
    const d = docBase({ evidence: hEv });
    assert.equal(writeObservation(d, { jsonDir: t.dir, registeredIds: IDS }).ok, true);
    const jp = join(t.dir, 'observation-r3.json');
    const mp = join(t.dir, 'observation-r3.md');
    const doc = JSON.parse(readFileSync(jp, 'utf8'));
    doc.items[1] = { id: 'k02', verdict: 'miss', reason: '改口径后未命中' };
    writeFileSync(jp, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
    writeFileSync(mp, renderObservation(doc), 'utf8');
    assert.deepEqual(validateArtifact(jp, { registeredIds: IDS }).errors, []);
    assert.equal(checkRendered(doc, readFileSync(mp, 'utf8')).ok, true);
  } finally { t.dispose(); }
});

test('H04 边界钉：quote 真实但不支撑结论 → 校验过（语义归审计人）', () => {
  const f = makeDir();
  const t = makeDir();
  try {
    const e = evidenceLines(f.dir, ['角色设定', '边界声明'], { name: 'ctx.md', line: 1 });
    assert.equal(writeObservation(docBase({ evidence: e }), { jsonDir: t.dir, registeredIds: IDS }).ok, true);
    assert.deepEqual(validateArtifact(join(t.dir, 'observation-r3.json'), { registeredIds: IDS }).errors, []);
  } finally { f.dispose(); t.dispose(); }
});
```

> H03 需 `writeFileSync`：与顶部 import 增补合并在同一批加（`import { readFileSync, readdirSync, writeFileSync } from 'node:fs';`）。

- [ ] **Step 9: `render.test.mjs`（I01 / I02，整文件新建）**

```js
// A 表并入 8 码冒烟：render.mjs 已实现零测试面（§0.2 #16）。render.mjs 的 demo 循环已由 Task 9 Step 4 加守卫，import 不打印。
import test from 'node:test';
import assert from 'node:assert/strict';
import { personalActions, renderCard } from './render.mjs';
import { SEATS, SHARED_ACTIONS } from './data.mjs';

const clone = () => structuredClone(SEATS[0]);

test('I01 合并纪律三码冒烟（DuplicateStatement / OverrideWithoutReason / PointlessOverride）', () => {
  const a = clone();
  a.own.push({ ...a.own[0] });
  assert.throws(() => personalActions(a), /DuplicateStatement/);

  const b = clone();
  b.own.push({ id: 'a01', kind: 'must', trigger: '写结论时', text: '改了口径' });
  assert.throws(() => personalActions(b), /OverrideWithoutReason/);

  const baseA01 = SHARED_ACTIONS.find((x) => x.id === 'a01');
  const c = clone();
  c.own.push({ ...baseA01, reason: '无差异' });
  assert.throws(() => personalActions(c), /PointlessOverride/);
});

const I02_CASES = [
  ['MissingTrigger', { id: 'x1', kind: 'must', text: 'T', criterion: 'assertion.hasSource', landing: 'deliverable.body' }, /MissingTrigger/],
  ['MissingCriterion', { id: 'x2', kind: 'must', trigger: 'T', text: 'x', landing: 'deliverable.body' }, /MissingCriterion/],
  ['MissingLanding', { id: 'x3', kind: 'must', trigger: 'T', text: 'x', criterion: 'assertion.hasSource' }, /MissingLanding/],
  ['MissingCriterionImpl', { id: 'x4', kind: 'must', trigger: 'T', text: 'x', criterion: 'assertion.nope', landing: 'deliverable.body' }, /MissingCriterionImpl[\s\S]*criterion=assertion\.nope/],
  ['UnknownLanding', { id: 'x5', kind: 'must', trigger: 'T', text: 'x', criterion: 'assertion.hasSource', landing: 'no.such.landing' }, /UnknownLanding[\s\S]*landing=no\.such\.landing/],
];

test('I02 必填与登记五码冒烟（renderCard 消费路径）', () => {
  for (const [name, action, re] of I02_CASES) {
    const s = clone();
    s.own.push(action);
    assert.throws(() => renderCard(s), re, name);
  }
});
```

- [ ] **Step 10: `artifact.test.mjs` 组（B17 / B18 / C06）**

> 本步补的是 `artifact.test.mjs`（testcase:174 指定落点；Task 10 Files 已列 Modify）。三条用例都走「`writeObservation` 现造产物 → `validateArtifact` 入口校验」，不手搓 json/md。

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { validateArtifact, writeObservation } from './artifact.mjs';
import { docBase, evidenceLines, makeDir, IDS } from './fixtures.mjs';

const evi = makeDir();
test.after(evi.dispose);
const ev = evidenceLines(evi.dir, ['第一条真实观察行']);

// k03 带 check:'ai'（PRD §4.1 双实例口径：ai 条目必须有 -a / -b 成对文件）
const aiItems = (evidence) => [
  { id: 'k01', verdict: 'hit', evidence },
  { id: 'k02', verdict: 'na', reason: '不适用' },
  { id: 'k03', check: 'ai', verdict: 'hit', evidence },
];

test('B17 InstanceMissing：ai 条目无 -a/-b 成对文件', () => {
  const t = makeDir();
  try {
    const w = writeObservation(docBase({ evidence: ev, items: aiItems(ev) }), { jsonDir: t.dir, registeredIds: IDS });
    assert.equal(w.ok, true, JSON.stringify(w.errors));
    const r = validateArtifact(join(t.dir, 'observation-r3.json'), { registeredIds: IDS });
    assert.ok(r.errors.map((e) => e.code).includes('InstanceMissing'), JSON.stringify(r.errors));
  } finally { t.dispose(); }
});

test('B18 instance 成对正例：-a / -b 双双零错', () => {
  const t = makeDir();
  try {
    for (const instance of ['A', 'B']) {
      const w = writeObservation(docBase({ evidence: ev, items: aiItems(ev), instance }), { jsonDir: t.dir, registeredIds: IDS });
      assert.equal(w.ok, true, `写 ${instance} 失败：${JSON.stringify(w.errors)}`);
    }
    for (const instance of ['A', 'B']) {
      const r = validateArtifact(join(t.dir, `observation-r3-${instance.toLowerCase()}.json`), { registeredIds: IDS });
      assert.deepEqual(r.errors, [], `${instance}：${JSON.stringify(r.errors)}`);
    }
  } finally { t.dispose(); }
});

test('C06 MdUnreadable：md 被同名目录占位（IO 异常收敛为码，不冒泡）', () => {
  const t = makeDir();
  try {
    const w = writeObservation(docBase({ evidence: ev }), { jsonDir: t.dir, registeredIds: IDS });
    assert.equal(w.ok, true, JSON.stringify(w.errors));
    const mp = join(t.dir, 'observation-r3.md');
    rmSync(mp, { force: true });
    mkdirSync(mp, { recursive: true });          // 用目录占住 md 路径 → readFileSync 抛 EISDIR
    const r = validateArtifact(join(t.dir, 'observation-r3.json'), { registeredIds: IDS });
    assert.equal(r.ok, false);
    assert.deepEqual(r.errors.map((e) => e.code), ['MdUnreadable'], JSON.stringify(r.errors));
  } finally { t.dispose(); }
});
```

Expected: 三条全绿（B17 / B18 属红线驱动：实现落地前必红，落地后转绿；C06 的 `MdUnreadable` 依赖 `artifact.mjs` 的 try-catch 收敛）。

- [ ] **Step 11: 全量跑 + Commit**

```powershell
node --test tools\observation-check\*.test.mjs; "exit=$LASTEXITCODE"
```

Expected: `# fail 0`；`# pass` = 迁入 71 + 本任务新增（逐文件增量见 Task 12 对账表）。

```powershell
git add tools/observation-check
git commit -m "test(s2): B/C/D/E/G/H/I 组新增用例（对账七条 / 证据三道 / 写盘与 CLI / 三态判定 / 对抗 30 向量 / 8 码冒烟）

H02 对抗分母常量 ATTACK_VECTORS = 30（8 具名 + 13 迁入 + 9 新增），Q-A-05 闭合。
A7 期望码 InvalidFieldType → MissingEvidence（与 B16 分界同批）。"
```

---

### Task 11: golden 夹具与 D05–D07

**Files:**
- Create: `tools/observation-check/golden/observation-r3.json`
- Create: `tools/observation-check/golden/observation-r3.expected.md`
- Create: `tools/observation-check/golden.test.mjs`
- Test: `tools/observation-check/golden.test.mjs`

**Interfaces:**
- Consumes: `renderObservation` / `checkRendered`（Task 5）
- Produces: 渲染回归基线（R4「渲染器升级使历史 md 全红」的前置防线）

> **形态独立性声明（必须写进 json 文件同目录的注释无法承载，故写在此处并在提交说明复述）**：golden 是**纯渲染夹具**——只经 `renderObservation` + `checkRendered`，**不经**七条覆盖对账，故其 `total`/`skipped` 不必与 `REGISTERED_IDS`（3 个 id）对齐。D06 要求 hit/miss/na 三态 + open + skipped 同时在场，三者并存必然使 `total` = 4 > `REGISTERED_IDS.length`；这是渲染形态覆盖的刻意选择，**不得**因此改 `REGISTERED_IDS` 或删 D06 形态。

- [ ] **Step 1: 写 `golden/observation-r3.json`（全形态：hit / miss / na / open / skipped）**

```json
{
  "round": 3,
  "instance": null,
  "items": [
    { "id": "k01", "verdict": "hit", "evidence": { "path": "docs/prd/20261026205821-agent-card-contract.md", "line": 337, "quote": "§4.4 A 表" } },
    { "id": "k02", "verdict": "miss", "reason": "未找到对应判据行" },
    { "id": "k03", "verdict": "na", "reason": "本条不适用于本轮" }
  ],
  "open": [
    { "object": "C07 码名归属", "impact": "结构行判据无专属码", "suggestion": "登记 EvidenceStructuralRow", "evidence": { "path": "docs/prd/20261026205821-agent-card-contract.md", "line": 400, "quote": "§4.3 第 5 道" } }
  ],
  "coverage": { "read": 3, "total": 4, "skipped": ["k04"] },
  "closure": null
}
```

- [ ] **Step 2: 由实现生成 `expected.md`，再人工确认三处形态**

```powershell
node -e "import('./tools/observation-check/checks.mjs').then(async (m)=>{const {readFileSync,writeFileSync}=await import('node:fs');const doc=JSON.parse(readFileSync('tools/observation-check/golden/observation-r3.json','utf8'));writeFileSync('tools/observation-check/golden/observation-r3.expected.md', m.renderObservation(doc),'utf8')})"
```

人工逐项确认（缺一项即不许提交）：

1. 首行 = `<!-- observation-md v1 -->`（R-7 横幅）；
2. hit 行第三列含 `docs/prd/20261026205821-agent-card-contract.md:337「§4.4 A 表」`（D01 形态已生效，**不得**是 `[object Object]`）；
3. miss 行第三列 = `未找到对应判据行`；na 行 = `本条不适用于本轮`；
4. open 表行含 `docs/prd/20261026205821-agent-card-contract.md:400`；
5. 覆盖度行 = `覆盖度：已判 3 条 / 共 4 条（跳过 1：k04）`。

- [ ] **Step 3: 写 `golden.test.mjs`（D05–D07）**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkRendered } from './checks.mjs';

const DIR = join(dirname(fileURLToPath(import.meta.url)), 'golden');
const DOC = JSON.parse(readFileSync(join(DIR, 'observation-r3.json'), 'utf8'));
const EXPECTED = readFileSync(join(DIR, 'observation-r3.expected.md'), 'utf8');

test('D05 golden 全文断言：renderObservation === expected.md', () => {
  const r = checkRendered(DOC, EXPECTED);
  assert.equal(r.ok, true, r.detail);
});

test('D06 golden 形态覆盖判别力（三态 + open + skipped）', () => {
  const verdicts = new Set(DOC.items.map((i) => i.verdict));
  const missing = [];
  if (!['hit', 'miss', 'na'].every((v) => verdicts.has(v))) missing.push(`verdict 缺：${[...verdicts].join(',')}`);
  if (!(DOC.open.length >= 1)) missing.push('open 为空');
  if (!(DOC.coverage.skipped.length >= 1)) missing.push('skipped 为空');
  assert.deepEqual(missing, []);
  assert.ok(EXPECTED.includes('未找到对应判据行'));
  assert.ok(EXPECTED.includes('C07 码名归属'));
  assert.ok(EXPECTED.includes('跳过 1：k04'));
});

test('D07 golden 判别力反例：expected 改一字必红且定位到行号', () => {
  const lines = EXPECTED.split(/\r?\n/);
  const i = lines.findIndex((l) => l.includes(':337'));
  assert.ok(i >= 0, 'expected.md 无 :337 行');
  lines[i] = lines[i].replace(':337', ':338');
  const r = checkRendered(DOC, lines.join('\n'));
  assert.equal(r.ok, false);
  assert.ok(r.detail.includes(`第 ${i + 1} 行`), r.detail);
});
```

- [ ] **Step 4: 跑 + Commit**

```powershell
node --test tools\observation-check\golden.test.mjs; "exit=$LASTEXITCODE"
git add tools/observation-check/golden tools/observation-check/golden.test.mjs
git commit -m "test(s2): golden 全形态夹具 + D05-D07（全文一致 / 形态判别力 / 改一字必红）"
```

---

### Task 12: 收尾验收（锚点 2 / 5 / 7 + ③ 段出口证据）

**Files:**
- Test: 无（本任务全部是命令型验收；**不写 `gate-record.md`**——②→③ 门行已在开工前签署，见 `## 计划门（②→③，开工前签）`）

**Interfaces:**
- Consumes: 全部实现与测试（Task 1–11）
- Produces: ③ 段出口证据（双 cwd 全绿 / 静态计数 / 夹具自建 / 未归档态 check 绿 / 归档演练 / 门禁三连），供 ③→④ 使用

- [ ] **Step 1: A04 双 cwd 全绿 + 总数 ≥ 71**

```powershell
$root = (Get-Location).Path
node --test tools\observation-check\*.test.mjs; "rootExit=$LASTEXITCODE"
Set-Location tools\observation-check; node --test *.test.mjs; "dirExit=$LASTEXITCODE"; Set-Location $root
```

Expected: 两次均 `# fail 0`；`dirExit` 那次 `# pass` ≥ 71；`rootExit=0` 且 `dirExit=0`。判据出处：spec §10.8-2「改造起以 `cd tools\observation-check; node --test *.test.mjs` 为正式判据」（`spec:79`）；testcase A04「在仓库根与 tools/observation-check 两个 cwd 各跑一次均 exit 0」（`testcase:236`）。`# pass` 实际值应与 Step 2 的静态计数一致。

- [ ] **Step 2: G02 静态用例计数 + 与 `npm run check` 增量对账**

```powershell
node -e "const {readdirSync,readFileSync}=require('node:fs');const d='tools/observation-check';let n=0;const per={};for(const f of readdirSync(d).filter(x=>x.endsWith('.test.mjs'))){const c=(readFileSync(d+'/'+f,'utf8').match(/\btest\(/gm)||[]).length;per[f]=c;n+=c}console.log(per);console.log('staticTestCount',n)"
```

Expected（逐文件增量见本任务末「用例增量对账表」）：`staticTestCount` = 144；`per` 与表中「合计」列逐项相等，差一项即说明有漏写 / 多写用例，先补齐再往下走。

> **正则必须用 `/\btest\(/gm`，不得写回 `/^test\(/gm`**：`checks.test.mjs` 的 15 条 B 组用例由 `CASES` 数组在循环内生成，`test(name, …)` 带 2 空格缩进（Task 10 Step 1，`plan:1194-1195`）——行首锚定会漏计这 15 条，使 `checks.test.mjs` 只剩 13，与表中 28 不符、`staticTestCount` 只剩 129。改用 `\b` 词界后，顶层 `test(` 与缩进 `test(` 都计入，`test.after(` / `test.skip(` 不会误计。

```powershell
npm run check 2>&1 | Select-String -Pattern '^# (pass|fail)'
```

Expected: `# fail 0`；`# pass` = 迁入前基线 + 144（基线值取自 Task 2 迁入前那次 `npm run check` 的 `# pass`，必须写进 Step 6 的交接说明）。

- [ ] **Step 3: A06 夹具自建复核（临时移走 `agents/detective-observer.md`）**

```powershell
New-Item -ItemType Directory -Force .session\tmp | Out-Null
Move-Item agents\detective-observer.md .session\tmp\detective-observer.md.bak
node --test tools\observation-check\*.test.mjs; "exit=$LASTEXITCODE"
Move-Item .session\tmp\detective-observer.md.bak agents\detective-observer.md
```

Expected: `# fail 0`（= 证据全自建，无 `agents/` 依赖）。**移动后必须立刻移回**（命令写死顺序，失败也要手工补回）。首行 `New-Item -Force` 是必须的：`.session\tmp` 不保证存在（只有 Task 10 E03 跑过才会留下），缺它则单跑本步直接失败。收尾 `.session/tmp` 允许存在但必须为空（仓门禁 ⑤ 段口径：一级只许封闭清单档位；`tmp/` 存在则须为空、不存在则跳过）。

- [ ] **Step 4: A07 未归档态 `npm run check` 全绿**

```powershell
npm run check; "exit=$LASTEXITCODE"
```

Expected: `exit=0`（新文件 golden / fixtures / cli 等不触发既有检查段，含 ⑤ 段 `.session` 一级清单判据）。

- [ ] **Step 5: G01 归档演练（writeObservation → move → git add → check → commit）**

```powershell
New-Item -ItemType Directory -Force .session\reviews\2026-10-27-1200-migration-drill | Out-Null
node -e "import('./tools/observation-check/artifact.mjs').then(({writeObservation:w})=>{const doc={round:3,instance:null,items:[{id:'k01',verdict:'hit',evidence:{path:'tools/observation-check/golden/observation-r3.expected.md',line:1,quote:'<!-- observation-md v1 -->'}},{id:'k02',verdict:'na',reason:'演练'},{id:'k03',verdict:'miss',reason:'演练'}],open:[],coverage:{read:3,total:3,skipped:[]},closure:'no-findings'};console.log(JSON.stringify(w(doc,{jsonDir:'.session/reviews/2026-10-27-1200-migration-drill',registeredIds:['k01','k02','k03']})))})"
New-Item -ItemType Directory -Force docs\superpowers\reviews\2026-10-27-1200-migration-drill | Out-Null
Move-Item .session\reviews\2026-10-27-1200-migration-drill\observation-r3.json docs\superpowers\reviews\2026-10-27-1200-migration-drill\
Move-Item .session\reviews\2026-10-27-1200-migration-drill\observation-r3.md docs\superpowers\reviews\2026-10-27-1200-migration-drill\
git add docs/superpowers/reviews/2026-10-27-1200-migration-drill
npm run check; "checkExit=$LASTEXITCODE"
git status --porcelain -- docs/superpowers/reviews/2026-10-27-1200-migration-drill
```

Expected: write 返回 `{"ok":true,"wrote":true,"errors":[]}`；`checkExit=0`；`git status --porcelain` 只输出两行 `A  …observation-r3.{json,md}`（= 已 staged、未残留未跟踪件）。

提交（由用户确认后执行，**不要**在本任务里擅自 commit 演练产物到主线；演练件本身是合法归档件，留在工作树供用户决定）：

```powershell
git commit -m "docs(s2): 迁移演练归档件（writeObservation → move → check 绿）"
```

- [ ] **Step 6: 门禁三连（③ 段出口证据）**

```powershell
node scripts/scope-sweep.mjs --check; "sweep=$LASTEXITCODE"
node -e "const t=require('fs').readFileSync('skills/dev-workflow/references/gate-record.md','utf8');const rows=t.split(/\r?\n/).map(l=>l.trim()).filter(l=>l.startsWith('|')&&!l.includes('---')&&!l.includes('申报人'));const sp=s=>String(s||'').split(/[、+＋，,\/]/).map(x=>x.trim()).filter(Boolean);const bad=rows.filter(l=>{const c=l.split('|').slice(1,-1).map(x=>x.trim());const a=sp(c[3]),b=sp(c[4]);return !(a.length&&b.length&&!a.some(x=>b.includes(x)))});console.log('rows',rows.length,'bad',bad.length)"
node -e "const t=require('fs').readFileSync('skills/dev-workflow/references/gate-record.md','utf8');console.log('splitting',(t.match(/拆 spec 中/g)||[]).length)"
npm run check; "exit=$LASTEXITCODE"
```

Expected: `sweep=0`（`sweep ok`）；`bad 0`；`splitting ≤ 1`；`exit=0`。

**本步不写 ②→③ 计划门行**——门行已在开工前由审计签署，见本文档 `## 计划门（②→③，开工前签）`。本步四条输出是 **③ 段出口证据**（`npm run check` 绿 + 门禁三连），供 ③→④ 使用。

判据：上面四条命令 `sweep=0` / `bad 0` / `splitting ≤ 1` / `exit=0`，结果写进交接说明，不进 `gate-record.md` 的 ②→③ 行。

- [ ] **Step 7: 用例增量对账表（G02 的逐文件口径，也是「测试都在跑」的静态证据）**

| 文件 | 迁入 | 新增 | 合计 | 新增来源 |
|---|---|---|---|---|
| `checks.test.mjs` | 12 | 16 | 28 | B01×3 / B02×3 / B03×3 / B04×2 / B05 / B06 / B15 / B16×2 |
| `coverage.test.mjs` | 0 | 10 | 10 | B07–B14 / B19 / F03 |
| `evidence.test.mjs` | 22 | 6 | 28 | C01–C05 / C07 |
| `render-check.test.mjs` | 7 | 5 | 12 | D01–D04 / D08 |
| `artifact.test.mjs` | 9 | 3 | 12 | B17 / B18 / C06 |
| `write.test.mjs` | 8 | 6 | 14 | E01 / E03–E07 |
| `cli.test.mjs` | 0 | 8 | 8 | E02 / E08–E14 |
| `gate-scan.test.mjs` | 0 | 3 | 3 | G03–G05 |
| `render.test.mjs` | 0 | 2 | 2 | I01 / I02 |
| `adversarial.test.mjs` | 13 | 4 | 17 | H01–H04（A7 只改期望码，不增数） |
| `baseline.test.mjs` | 0 | 7 | 7 | A01–A03 / A05 / F01 / F02 / F04 |
| `golden.test.mjs` | 0 | 3 | 3 | D05–D07 |
| **合计** | **71** | **73** | **144** | — |

> 这张表是 G02 的机器判据依据：Step 2 的 `per` 输出必须与「合计」列逐项相等，`staticTestCount` 必须 = 144。任一不等 → 先查是漏写还是多写，**不得**改本表迁就实现（改表 = 改分母，属判据级口径变更，须按 R8 回扫 testcase §3 与 PRD §0.5）。

---

## 附录 A：testcase 69 条 + B19 → Task 映射表

> 计数口径：testcase §3 = 69 条 + 议会派工新增 B19 = **70 条**（正 26 / 负 39 / 边界 5）。「执行」列的「常驻」= 进 `tools/observation-check/*.test.mjs` 随 `npm run check` 跑；「验收」= Task 12 命令一次性执行。

| 组 | 用例 ID | 条数 | 落点 Task | 执行 |
|---|---|---|---|---|
| A | A01–A03、A05、F01/F02/F04 | 7 | Task 9（`baseline.test.mjs`） | 常驻 |
| A | A04、A06、A07 | 3 | Task 12 Step 1/3/4 | 验收 |
| B 结构 | B01–B06、B15、B16 | 8 | Task 10 Step 1（`checks.test.mjs`） | 常驻 |
| B 覆盖 | B07–B14、B19、F03 | 10 | Task 10 Step 2（`coverage.test.mjs`） | 常驻 |
| B 实例 | B17、B18 | 2 | Task 10 Step 10（`artifact.test.mjs`） | 常驻 |
| C | C01–C05、C07 | 6 | Task 10 Step 3（`evidence.test.mjs`） | 常驻 |
| C | C06 | 1 | Task 10 Step 10（`artifact.test.mjs`） | 常驻 |
| D | D01–D04、D08 | 5 | Task 10 Step 4（`render-check.test.mjs`） | 常驻 |
| D | D05–D07 | 3 | Task 11（`golden.test.mjs`） | 常驻 |
| E 写盘 | E01、E03–E07 | 6 | Task 10 Step 5（`write.test.mjs`） | 常驻 |
| E CLI | E02、E08–E14 | 8 | Task 10 Step 6（`cli.test.mjs`） | 常驻 |
| G | G03–G05 | 3 | Task 10 Step 7（`gate-scan.test.mjs`） | 常驻 |
| G | G01、G02 | 2 | Task 12 Step 5/2 | 验收 |
| H | H01–H04 | 4 | Task 10 Step 8（`adversarial.test.mjs`） | 常驻 |
| I | I01、I02 | 2 | Task 10 Step 9（`render.test.mjs`） | 常驻 |

**合计**：A 10 + B 20 + C 7 + D 8 + E 14 + G 5 + H 4 + I 2 = **70** ✅

> **口径声明（勿混两套分母）**：「条数」列 = **用例 ID 数**，合计 70 = testcase §3 的 69 条 + 议会派工的 B19。B 结构 8 个 ID 由 **16 个 `test()` 块**覆盖（B01×3 / B02×3 / B03×3 / B04×2 / B05 / B06 / B15 / B16×2）；B 覆盖 10 个 ID 含 F03（F 组用例按落点归入 `coverage.test.mjs`）。**70 ≠ 144**：144 是**test 块数**（71 迁入 + 73 新增，见 Task 12 Step 7），两者只在本表与 Step 7 两处各自成立，不得互相验算。

> B17/B18/C06 的载体说明：testcase 原文标「`artifact.test.mjs`（增补）」——已落为 **Task 10 Step 10** 的独立代码块（三条用例 + 必填 import），不再只靠本表指引实现；断言逐字按 testcase 判据写（B17 `InstanceMissing`、B18 双绿、C06 `mkdirSync('observation-r3.md')` 目录占位派生 `MdUnreadable`）。

## 附录 B：议会留观 9 条 → 落点核对表

> 来源：`.session/reviews/2026-10-27-1102-s2-observation-check-spec/problems.md` §2（触发时机均 = 写 S2 plan 时）。

| # | 留观项 | 落点 | 已落地形态 |
|---|---|---|---|
| 1 | G02 判据 ≥ 基线 + 71 | Task 12 Step 2 + Step 7 | 静态计数 144 + `pass − 基线 = 144` 双向对账 |
| 2 | C07 码名登记 | Task 1（`EvidenceStructuralRow`）+ Task 10 Step 3 | PRD §4.3 第 5 道码名 + C07 逐字断言 |
| 3 | B19（registeredIds 单源） | Task 3（`registered-ids.mjs`）+ Task 10 Step 2 + Step 6 派工（Task 9 Step 6） | 常量在位 + 删 id 即红 + testcase 69→70 |
| 4 | 公开面 5 函数签名 | 「接口小节（公开面）」+ Task 6/7 Interfaces | `validateObservation` / `renderObservation` / `checkRendered` / `checkPrerequisites` / `checkEvidence` + `writeObservation` / `validateArtifact` / `validateArtifactExitCode` / `resolveWriteTarget` 逐字签名 |
| 5 | `git rev-parse` fail-closed 码 | Task 3（`RepoRootUnresolved`）+ Task 1（PRD 登记） | `repoRoot()` throw 带 `e.code`，`resolveWriteTarget` 捕获转码 |
| 6 | 写盘覆盖 / 并发 / tmp | Task 6「覆盖 / 并发 / tmp 清扫口径」表 + E06 | 全量覆盖、无文件锁、失败零 tmp、md 先 rename |
| 7 | A05 扫描扩到 §1.2 全句 | Task 9 Step 2（`baseline.test.mjs`） | `agents[/\\]` + `path: 字面量` 两条静态判，免扫自身 |
| 8 | registeredIds 两态切换不变量 | Task 3（`registered-ids.mjs` 注释）+ Task 10 Step 2（B19） | 「S1 切模型 → 清单来源换、长度只增」注释 + 删 id 对账红 |
| 9 | E14 `finally` 清理 | Task 10 Step 6（E14） | 两目录 `finally` 内 `rmSync`，只在其存在期间做 hash 比对 |

## 附录 C：执行顺序与提交切分

| 提交 | Task | 内容 | 可否独立回滚 |
|---|---|---|---|
| 1 | Task 1 | PRD 码名登记 + A 表并入 + spec 括注 | 是（纯文档） |
| 2 | Task 2 | 11 文件原样迁入（sha256 进 commit message）+ 71/71 | 是（首个代码提交，`MIGRATION_COMMIT` 取它） |
| 3 | Task 3–5 | `registered-ids` / `evidence` / `checks` 改造 | 是（但回滚后 Task 2 的 61/10 差异重现） |
| 4 | Task 6–8 | `artifact` / `cli` / `gate-scan` | 是 |
| 5 | Task 9 | 夹具改批（禁放宽机器判 + B19 派工） | 是 |
| 6 | Task 10 | 新增 73 条用例 | 是 |
| 7 | Task 11 | golden + D05–D07 | 是 |
| 8 | Task 12 | 门禁三连 + ③ 段出口证据（不含演练 commit） | 是（②→③ 门行已在开工前单独签署，不在此提交） |

---

## Self-Review（写完即跑，逐条对照）

**1. spec 覆盖**：spec §10.1 R1–R7 逐个有 Task——R1 → Task 2（+A01–A03）；R2 → Task 9/10（A04/A05/A06 的命令与静态判）；R3 → Task 3/4/8/10（四段校验链 + 三态 + 对抗）；R4 → Task 5/11（横幅 + golden）；R5 → Task 6/7/10（唯一写盘入口 + CLI）；R6 → Task 9/10（`baseline.test.mjs` + 禁放宽）；R7 → Task 12（A07/G01/G02）。spec §10.2 两阶段提交 → Task 2 + Task 3–11；§10.5 S2/S3 边界 → Task 8 头注 + G03 前置说明；§10.8 七锚点 → 附录 A 全表。**无缺口**。

**2. 占位扫描**：全文搜 `TBD` / `TODO` / `待定` / `同 Task N` / 「适当处理」= 0 处。**三处执行期填写**（均在正文显式标注、且各带强制回填动作，不是未标注占位）：① `MIGRATION_COMMIT`（Task 2 Step 6 强制 `git rev-parse HEAD` 逐字填入，A01 有 `!startsWith('0000')` 守卫防漏填）；② golden `expected.md`（Task 11 Step 2 由实现生成 + 五条人工确认）；③ **迁入 commit message 的 sha256 段**（Task 2 Step 5 `plan:217` 的 `<11 行：文件名 + 两空格 + HEX，按文件名升序>`）。

**3. 类型一致**：`writeObservation(doc, { jsonDir, registeredIds })`（Task 6 定义 / Task 10 Step 5–6 调用）一致；`validateArtifact(jsonPath, { registeredIds })`（Task 6 / Task 10 D04/E08 等）一致；`scanReviewDir(dirName, files)`（Task 8 / Task 10 Step 7）一致；`makeDir()` 返回 `{ dir, dispose }`（Task 9 / 全部 Task 10 用例）一致；`evidenceLines(dir, lines, { name, line })` 一致；`docBase({ evidence, items, open, closure, round, instance })` 一致；`renderObservation` / `checkRendered(doc, mdText)` 返回 `{ ok, code?, detail? }`（Task 5 / D05–D07 用 `detail` 而非 `line`）一致。

**4. 本轮修掉的两处漂移**（写 Self-Review 时当场改，不留待执行者发现）：

- Step 3 / Step 4 原先直接用裸 `dir`，而 `evidence.test.mjs` / `render-check.test.mjs` 的既有 `dir` 绑定不可假设——已改为块内自建 `cdir` / `rdir`（`makeDir()` + `test.after`），不依赖文件级状态。
- D07 原打算断言「error 行号字段」，实际 `checkRendered` 只回 `detail`（`第 N 行不同：…`）——已改为正则断言 `detail.includes('第 N 行')`，避免引用不存在的 `r.line`。

**5. 审计预审打回项修复（2026-10-27，六项全修）**：

- **①** G02 静态计数正则 `/^test\(/gm` → `/\btest\(/gm`：`checks.test.mjs` 的 15 条 B 组用例在 `CASES` 循环内缩进生成，行首锚定会漏计 → 28 条变 13 条、总数 144 变 129（Task 12 Step 2）。
- **②** 附录 A 混用两套分母：`B 结构 16` 是 `test()` 块数、`A/C/D/E/G/H/I` 是用例 ID 数 → 已改 `8`，合计行 `B 28` → `B 20`，并加「70 = ID 数 / 144 = test 块数，勿互验」口径声明。
- **③** A04 缺「目录内 cwd」第二跑 → Task 12 Step 1 补 `Set-Location tools\observation-check; node --test *.test.mjs`（spec:79 / testcase:236 双 cwd 判据）。
- **④** 占位声明不实：「仅两处」→「三处执行期填写」（补 `plan:217` 的 sha256 段模板）；计划门行「全文无占位符」→「无未标注占位符」。
- **⑤** Task 12 Step 3 隐式依赖 `.session\tmp` 存在 → 首行补 `New-Item -ItemType Directory -Force .session\tmp`。
- **⑥** `artifact.test.mjs`（B17 / B18 / C06）只有 Files 声明、无 Step → 新增 Task 10 Step 10 独立代码块（原「全量跑 + Commit」顺延为 Step 11），附录 A 两行与载体注同步改指 Step 10。

**6. 第 2 轮审计打回项修复（2026-10-27，两项）**：

- **门行判据错位 + 时序倒置**：原 Task 12 Step 6 的门行四条是「无未标注占位 / 70 条对齐 / 留观 9 条有落点 / 全部 Task 验收命令已跑且绿」——没有一条是 stage-2b 的三条核对，第 4 条属 ③ 出口，且写在实现完成后签署（违反 R1 与 `stage-3-implementation.md:5` 前置）。已改为：新增「## 计划门（②→③，开工前签）」节（三条核对 + 覆盖表 + 签行模板），Task 12 Step 6 降级为 ③ 段出口证据、并把附录 C 第 8 行同步改口。
- **核对一缺输入**：原 plan 全文无 PRD §6 功能点覆盖表（附录 A 只映射 testcase 编号，且 testcase `F01–F04` 与 PRD `F-01…F-17` 同名不同义）。已在计划门节补「PRD F-13～F-16/F-20/F-21 → Task → 用例」三列表，并写明只比 PRD 号、不得拿 testcase F 组充数。


