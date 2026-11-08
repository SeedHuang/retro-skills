# 测试用例：S-4/S-5 skill 判据登记与 residual（设计）

> 归属 spec：`docs/superpowers/specs/2026-11-08-s4-s5-skill-criteria-design.md`（状态：已实施版，2026-11-08）
> **编写者 = 独立 `senior-sdet` 实例（全新上下文）**｜**独立性声明**：本文件由 `senior-sdet` 在全新上下文编写，未参与该 spec 写作（spec 作者 = 主 agent）、未参与实现与 plan；全程只读 spec / `SKILL.md` / `schema.mjs` / `check-all.mjs` / `package.json` 与目录现状，**未改 spec、未改代码、未改 plan、未执行任何 git 写操作**。本次唯一写入产物 = 本文件。
> 命名与落点：按 `skills/carrier-conventions/references/spec-testcase-gate.md` 判据 1（与 spec 同目录；文件名 = spec 文件名去掉 `.md` 后 + `-testcase.md`）。
> 状态：**已实施版**｜最后更新：`2026-11-08`｜用例条数：**正 12 / 负 19 / 边界 5 = 36**（计数见 §1.1；负 + 边 24 ≥ 正 12）。
> **执行方式声明（施工后回填）**：2026-11-08 已落地——`tools/docgen/dsl/skills/docs-placement.json` 与 `scripts/check-skill-criteria.mjs` 在位，`package.json` 有 `check:skill-criteria`。下表红绿证据由 `scripts/check-skill-criteria.test.mjs` 的 25 条测试覆盖；未逐条回填实跑数值。
> 术语对照（首次出现给中文解释）：**判据**（criterion，可机判的一条义务）；**残余**（residual，机器判不了、须人工抽检的部分及其责任席）；**探针**（probe，判据取值来源，如命令退出码、文件是否存在）；**绿 / 红**（通过 / 不通过）；**容器**（container，一份 `.json` 判据集合）；**临时副本**（repo copy，在 `%TEMP%` 复制一份仓内数据后改坏，不碰真仓）。

## 0 判据约定（全表复用；命令在**仓根**执行，Shell = PowerShell 5，`exit` 指进程退出码）

| 代号 | 命令 / 形态 | 备注 |
|---|---|---|
| `CK` | `node scripts/check-skill-criteria.mjs` | 新检查器；判 `exit` + 首行 + 末行；**已落地（2026-11-08）** |
| `CKP` | `node --test --test-name-pattern "S4S5-TC-NN" scripts/check-skill-criteria.test.mjs` | 断言一律 `node:assert/strict`；只取数，不当 `npm run check` 的替代 |
| `CHECK` | `npm run check` | 门禁总入口；判末行 `check 全部通过` / `check 未通过` |
| `CE` | `npm run check:criteria` | 既有判据引擎入口；判末行 `criteria-engine ok`（零回归） |
| `DOCN` | `npm run doc:name` | 命名机判；判 exit 0 |
| `COPY` | 把 `tools/docgen/dsl/skills/`（必要时加 `scripts/`、`package.json`）复制到 `%TEMP%\s4s5-<用例号>\` 后在副本内改数据，再在副本根跑 `CK` | 只读真仓；副本用完即删；**副本内不跑 git** |
| `COUNT` | `$c = <取数表达式>; if ($c -ne 0) { exit 1 }; exit 0` | 不得拿 `Select-String` / `git grep` 的进程退出码当判据 |

### 0.1 施工后实测（2026-11-08；施工前快照见 git 历史）

| 项 | 现值 | 取数（首行可复算） |
|---|---|---|
| skills 数据目录 | `docs-placement.json` + `docs-placement.testcase.json` 在位；`.gitkeep` 仍在 | `Get-ChildItem tools/docgen/dsl/skills -Force` |
| 新检查器 | `scripts/check-skill-criteria.mjs` 在位 | `Test-Path scripts/check-skill-criteria.mjs` → `True` |
| `package.json` 脚本 | 有 `check:skill-criteria` | `package.json` 第 4–14 行 |
| `scope` 正则 | 同时匹配 `project:<name>` / `skill:<name>` | `tools/docgen/builders/rules/schema.mjs:191`（`SCOPE_RE`） |
| `scope` 错误文案 | 列 `global` / `project:<name>` / `skill:<name>` | `schema.mjs:310`（`ScopeMissing`）/ `schema.mjs:311`（`ScopeInvalid`） |
| `residual` 强制 | 已强制 `who` / `sample` / `objectivePath`，且 `fields` 须指向已出现字段 | `schema.mjs:332-342` |
| testcase 正反例强制 | 已强制非空 `cases` + 至少一条 `pass` + 至少一条 `fail` | `schema.mjs:345-353` |
| ⑨ 段现状 | 跑 `scs check criteria-engine`、`scripts/check-skill-criteria.mjs` 与 `rule-audit-lite`；首行分别计数，末行 `criteria-engine ok` / `skill-criteria ok` | `scripts/check-all.mjs:519-550` |
| ⑨ 段失败口径 | 任一失败 → 打印 `check 未通过`、`process.exitCode = 1` | `scripts/check-all.mjs:562-563` |
| `.session` 封闭清单 | `reviews/` `rule-checks/` `tmp/` `sdd-*` `temp/` `myconversationwithai/` `README.md` | `skills/docs-placement/SKILL.md:56` |
| after 完成口径 | 完成 = 删，不设 ✅ 档 | `skills/docs-placement/SKILL.md:70` |
| `docs/bak` 只读口径 | 只允许补承接对照表与同步状态头里的路径字符串 | `skills/docs-placement/SKILL.md:22` |
| 命名机判 | `npm run doc:name` | `skills/docs-placement/SKILL.md:48`；`package.json` 第 6 行 |

### 0.2 用例写作口径（写错就假红 / 假绿）

1. **「绿」只认三件事**：`exit 0`、首行正则、末行全等；不认「看起来像通过」的语气判断。
2. **N 的口径 = 容器里 `criteria` 的条数**（本批 `docs-placement` = 4），**不是** testcase `cases` 的条数；`M + K = N`。落 TC-31。
3. **红档的「末行」**：只有全绿才允许出现 `skill-criteria ok`；有红时末行不得等于该串（spec §3.3 步骤 8）。落 TC-30。
4. **`project:` 与 `skill:` 分工**：`project:` 仍是合法 `scope`，schema 不报错；把它用在 skill 容器里由**检查器**判 `CriterionScopeMismatch`（scope 必须等于 `skill:<文件名>`）。落 TC-15。
5. **判心项 = `after-done` / `bak-readonly`**（spec §3.5 表「性质」列），二者必须另有 residual 断言（TC-24 / TC-27），不得只靠 judge 绿。
6. **已落地项由 `scripts/check-skill-criteria.test.mjs` 覆盖（2026-11-08）**：本文件不逐条抄实跑数值。

## 1 覆盖总表

| 用例 ID | 覆盖的 spec 条目 | 层级 | 类型 | 判据类型 | 执行方式 | 优先级 |
|---|---|---|---|---|---|---|
| S4S5-TC-01 | §3.1 数据形态（两份文件在位 / `skill` = 文件名 / `criteria` 非空 / scope 一致 / id 唯一） | 单元 | 正例 | 机器 | `CKP` | P0 |
| S4S5-TC-02 | §3.1 约束 + §3.3 `SkillFileShape`（容器非对象 / 缺 `skill` / `criteria` 为空 / 非数组） | 集成 | 负例 | 机器 | `COPY` + `CK` | P0 |
| S4S5-TC-03 | §3.1「`skill` 必须与文件名去掉 `.json` 后相等」+ `SkillNameMismatch` | 集成 | 负例 | 机器 | `COPY` + `CK` | P0 |
| S4S5-TC-04 | §3.1「每条判据 `scope` 必须等于 `skill:<文件名>`」+ `CriterionScopeMismatch` | 集成 | 负例 | 机器 | `COPY` + `CK` | P0 |
| S4S5-TC-05 | §3.1「`id` 全局唯一」+ `DuplicateId`（同文件 / 跨文件两输入） | 集成 | 负例 | 机器 | `COPY` + `CK` | P0 |
| S4S5-TC-06 | §3.3 步骤 4 + `SkillTestcaseMissing` | 集成 | 负例 | 机器 | `COPY` + `CK` | P0 |
| S4S5-TC-07 | §3.3 步骤 7「任一条判据无 testcase → 红」+ `TestcaseMissing` | 集成 | 负例 | 机器 | `COPY` + `CK` | P0 |
| S4S5-TC-08 | §3.3 步骤 7「无正例 / 无反例 → 红」 | 集成 | 负例 | 机器 | `COPY` + `CK` | P0 |
| S4S5-TC-09 | §3.3 步骤 5 + §3.1「`criterion` 必须指向本文件已登记判据」+ `UnknownCriterion` | 集成 | 负例 | 机器 | `COPY` + `CK` | P0 |
| S4S5-TC-10 | §3.3 步骤 6 + `CaseMismatch`（两个方向） | 集成 | 负例 | 机器 | `COPY` + `CK` | P0 |
| S4S5-TC-11 | §3.3 步骤 4「校验 `skill` 匹配、`cases` 非空」 | 集成 | 负例 | 机器 | `COPY` + `CK` | P0 |
| S4S5-TC-12 | §3.3 步骤 1 扫描面（排除 `*.testcase.json`、非 `.json`） | 集成 | 边界 | 机器 | `COPY` + `CK` | P1 |
| S4S5-TC-13 | §3.2 `scope: skill:<name>` 正例 | 单元 | 正例 | 机器 | `CKP` | P0 |
| S4S5-TC-14 | §3.2 name 规则 `^[a-z0-9][a-z0-9-]*$` + `ScopeInvalid` | 单元 | 负例 | 机器 | `CKP` | P0 |
| S4S5-TC-15 | §3.2 + §3.1 scope 相等（`project:` 误用于 skill 容器） | 集成 | 负例 | 机器 | `COPY` + `CK` | P0 |
| S4S5-TC-16 | §3.2「`scope` 缺省 → 错误文案列出三种合法形态」+ `ScopeMissing` | 单元 | 负例 | 机器 | `CKP` | P0 |
| S4S5-TC-17 | §3.2 末条「既有 `global` / `project:` 判据零改动」 | 单元 | 边界 | 机器 | `CKP` | P0 |
| S4S5-TC-18 | §3.5 `docs-placement-naming` 正例 | 单元 | 正例 | 机器 | `CKP` | P0 |
| S4S5-TC-19 | §3.5 `docs-placement-naming` 反例（两输入） | 单元 | 负例 | 机器 | `CKP` | P0 |
| S4S5-TC-20 | §3.5 `docs-placement-session-entry` 正例（封闭清单 / `sdd-*` 两输入） | 单元 | 正例 | 机器 | `CKP` | P0 |
| S4S5-TC-21 | §3.5 `docs-placement-session-entry` 反例（清单外 / 前缀不符两输入） | 单元 | 负例 | 机器 | `CKP` | P0 |
| S4S5-TC-22 | §3.5 `docs-placement-after-done` 正例 | 单元 | 正例 | 机器 | `CKP` | P0 |
| S4S5-TC-23 | §3.5 `docs-placement-after-done` 反例（`deleted=false` / `tombstone=true`） | 单元 | 负例 | 机器 | `CKP` | P0 |
| S4S5-TC-24 | §3.5 判心项 residual（`after-done` 四字段合规） | 单元 | 正例 | 机器 | `CKP` | P0 |
| S4S5-TC-25 | §3.5 `docs-placement-bak-readonly` 正例（两输入） | 单元 | 正例 | 机器 | `CKP` | P0 |
| S4S5-TC-26 | §3.5 `docs-placement-bak-readonly` 反例 | 单元 | 负例 | 机器 | `CKP` | P0 |
| S4S5-TC-27 | §3.5 判心项 residual（`bak-readonly` 四字段合规） | 单元 | 正例 | 机器 | `CKP` | P0 |
| S4S5-TC-28 | §3.3 步骤 6（`when` 不成立 = 不触发 = pass） | 单元 | 边界 | 机器 | `CKP` | P0 |
| S4S5-TC-29 | §3.3 步骤 8 输出契约（首行正则 + 末行全等 + `exit 0`） | 集成 | 正例 | 机器 | `CK` | P0 |
| S4S5-TC-30 | §3.3 步骤 8 红档（`exit 1`、末行不得为 `ok`、报文前缀） | 集成 | 负例 | 机器 | `COPY` + `CK` | P0 |
| S4S5-TC-31 | §3.3 步骤 8 计数自洽（N = criteria 条数、M + K = N） | 集成 | 边界 | 机器 | `COPY` + `CK` | P1 |
| S4S5-TC-32 | §3.4 门禁接入（`npm run check` 含 `skill-criteria ok`，末行 `check 全部通过`） | e2e | 正例 | 机器 | `CHECK` | P0 |
| S4S5-TC-33 | §3.4「任一段失败 → `check 未通过`」 | e2e | 负例 | 机器 | `COPY` + `CHECK` | P0 |
| S4S5-TC-34 | §4「既有 rule 零回归」+ `criteria-engine ok` | e2e | 正例 | 机器 | `CE` + `COUNT` | P0 |
| S4S5-TC-35 | §3.4 `package.json` 新增 `check:skill-criteria` 独立入口 | 集成 | 正例 | 机器 | `npm run check:skill-criteria` | P1 |
| S4S5-TC-36 | §3.1 + §3.3 步骤 1（空目录 / 0 条判据的边界） | 集成 | 边界 | 机器 | `CK` | P2 |

### 1.1 计数核算（现算）

- **正例（12）**：S4S5-TC-01 / 13 / 18 / 20 / 22 / 24 / 25 / 27 / 29 / 32 / 34 / 35
- **负例（19）**：S4S5-TC-02 / 03 / 04 / 05 / 06 / 07 / 08 / 09 / 10 / 11 / 14 / 15 / 16 / 19 / 21 / 23 / 26 / 30 / 33
- **边界（5）**：S4S5-TC-12 / 17 / 28 / 31 / 36
- 合计 **36**；**负 + 边 = 24 ≥ 正 = 12**，成立。
- spec §5 验收项映射：V-1 → 01 / 12 / 29；V-2 → 29 / 30 / 31；V-3 → 32 / 33 / 35；V-4 → 01 / 07 / 18–27；V-5 → 24 / 27；V-6 → 02–11 / 30；V-7 → 17 / 34（逐条见 §3）。

## 2 用例明细

> 全节 `COPY` 用例的统一形态：在 `%TEMP%` 副本内**只改一处数据**，在副本根跑 `CK` 取 `exit` + 首行 + 末行，父测试自己断言。真仓一律只读。
> 全节 `CKP` 用例的统一形态：断言写在 `scripts/check-skill-criteria.test.mjs`（施工方新建）的对应 `test('S4S5-TC-NN …')` 块内，用 `node:assert/strict`。

### S4S5-TC-01 两份文件在位，且容器五条结构约束全成立

- **覆盖**：spec §3.1 数据形态与全部约束（`skill` = 文件名、`criteria` 非空、`scope` 相等、`id` 唯一）+ §4 V-1 / V-4 的「每 skill 两份文件」形状
- **前置**：施工完成，`tools/docgen/dsl/skills/docs-placement.json` 与 `docs-placement.testcase.json` 已建
- **步骤**：① `Test-Path` 两个路径，取两个布尔值；② 读容器 `JSON.parse`，断言 `typeof === 'object'` 且非数组；③ 断言 `skill === 'docs-placement'`；④ 断言 `Array.isArray(criteria) && criteria.length > 0`；⑤ 断言每条 `c.scope === 'skill:docs-placement'`；⑥ 断言 `new Set(criteria.map(c => c.id)).size === criteria.length`
- **预期**：① 两值均 `True`；②–⑥ 全成立
- **判据**：`CKP` **exit 0**（六组断言全过即 0）
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；已施工：两文件在位（`Test-Path` 均 True）
- **对应测试**：`test('S4S5-TC-01 …')`
- **不覆盖**：检查器输出契约（S4S5-TC-29）；判据语义是否判得对（S4S5-TC-18～27）

### S4S5-TC-02 表驱动：容器非对象 / 缺 `skill` / `criteria` 空 / 非数组 → 各 `SkillFileShape`

- **覆盖**：spec §3.1 约束 + §3.3 错误码表 `SkillFileShape`（触发 = 容器不是对象 / 缺 `skill` / `criteria` 非数组或为空）
- **前置**：`COPY` 可改 `docs-placement.json`
- **步骤**：① 副本内把整个容器改成 `[]` → `CK`；② 改回后删 `skill` 键 → `CK`；③ 改回后设 `criteria: []` → `CK`；④ 改回后设 `criteria: {}` → `CK`；每次取 `exit`、首行、stderr 首行
- **预期**：四次均 **exit 1**；stderr 均以 `[skill-criteria]` 开头且含 `docs-placement.json` 与 `SkillFileShape`；四次首行 `红` 数 ≥ 1
- **判据**：表驱动四行各 `assert.equal(exit, 1)` + `assert.match(stderr首行, /^\[skill-criteria\] .*SkillFileShape/)`
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；判别力：若检查器只做 `JSON.parse` 不校验形状，`[]` / `{}` 两种输入会 `exit 0` → 本条红
- **对应测试**：`test('S4S5-TC-02 …')`
- **不覆盖**：`.testcase.json` 的形状坏（S4S5-TC-11）

### S4S5-TC-03 `skill` 与文件名不一致 → `SkillNameMismatch`

- **覆盖**：spec §3.1「`skill` 必须与文件名去掉 `.json` 后相等」+ §3.3 `SkillNameMismatch` + §6 R-3
- **前置**：`COPY`
- **步骤**：① 副本内把 `skill` 改为 `docs-placements`（文件名仍 `docs-placement.json`）→ `CK`；② 取 `exit` 与 stderr 首行
- **预期**：exit 1；首行含 `[skill-criteria]`、`docs-placement.json`、`SkillNameMismatch`
- **判据**：`assert.equal(exit, 1)` + 三个 `includes` 全真
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；判别力：若检查器按 `criteria` 里的 id 前缀推断 skill 名，改 `skill` 字段不会被发现 → exit 0
- **对应测试**：`test('S4S5-TC-03 …')`
- **不覆盖**：`skill` 缺失（归 S4S5-TC-02 的 `SkillFileShape`）

### S4S5-TC-04 任一条 `scope` ≠ `skill:<文件名>` → `CriterionScopeMismatch`

- **覆盖**：spec §3.1「每条判据的 `scope` 必须等于 `skill:<文件名>`」+ §3.3 `CriterionScopeMismatch`
- **前置**：`COPY`
- **步骤**：① 副本内把第一条判据 `scope` 改为 `skill:docs-placed` → `CK`；② 取 `exit` 与 stderr 首行
- **预期**：exit 1；首行含 `CriterionScopeMismatch` 与 `skill:docs-placed`
- **判据**：`assert.equal(exit, 1)` + 首行两个 `includes`
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；判别力：若只调 `check()`（schema 只判形态），`skill:docs-placed` 形态合法 → exit 0
- **对应测试**：`test('S4S5-TC-04 …')`
- **不覆盖**：`project:` 误用（S4S5-TC-15）；形态非法（S4S5-TC-14）

### S4S5-TC-05 表驱动：`id` 同文件重复 / 跨文件重复 → 各 `DuplicateId`

- **覆盖**：spec §3.1「`id` 全局唯一」+ §3.3 步骤 3「收集 id，重复即红」+ `DuplicateId`
- **前置**：`COPY`
- **步骤**：① 副本内把第二条判据 `id` 改成与第一条相同 → `CK`；② 改回，再新建 `probe-skill.json`（`skill: "probe-skill"`，含一条 `id: "docs-placement-naming"` 的判据）+ 同名 `.testcase.json` → `CK`；每次取 `exit` 与首行
- **预期**：两次均 exit 1；stderr 均含 `DuplicateId` 与 `docs-placement-naming`；首行红数 ≥ 1
- **判据**：表驱动两行各 `assert.equal(exit, 1)` + stderr 两个 `includes`
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；判别力：若只在单文件内去重（按文件分开收集），第 ② 个输入会 exit 0 → 本条红
- **对应测试**：`test('S4S5-TC-05 …')`
- **不覆盖**：id 形态是否合规（schema 只要求非空字符串，`schema.mjs:300`）

### S4S5-TC-06 整个 `.testcase.json` 缺失 → `SkillTestcaseMissing`

- **覆盖**：spec §3.3 步骤 4 与错误码 `SkillTestcaseMissing`
- **前置**：`COPY`
- **步骤**：① 副本内删除 `docs-placement.testcase.json` → `CK`；② 取 `exit` 与首行
- **预期**：exit 1；首行含 `SkillTestcaseMissing`
- **判据**：`assert.equal(exit, 1)` + `includes('SkillTestcaseMissing')`
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；判别力：若读不到 testcase 时静默跳过，exit 0（正是 spec §3.3 步骤 7 要堵的洞）
- **对应测试**：`test('S4S5-TC-06 …')`
- **不覆盖**：testcase 在但某判据无 case（S4S5-TC-07）

### S4S5-TC-07 某判据在 testcase 里无任何 case → `TestcaseMissing`

- **覆盖**：spec §3.3 步骤 7「任一条判据无 testcase → 红」+ 错误码 `TestcaseMissing`
- **前置**：`COPY`
- **步骤**：① 副本内把 `docs-placement.testcase.json` 中指向 `docs-placement-bak-readonly` 的两条 case 全部删掉（其余三条保留 pass + fail）→ `CK`；② 取 `exit` 与首行
- **预期**：exit 1；首行含 `TestcaseMissing` 与 `docs-placement-bak-readonly`
- **判据**：`assert.equal(exit, 1)` + 首行两个 `includes`
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；判别力：若按「有 cases 就算」判，删掉一条判据的 case 仍 exit 0 → 本条红
- **对应测试**：`test('S4S5-TC-07 …')`
- **不覆盖**：cases 存在但缺正例 / 缺反例（S4S5-TC-08）

### S4S5-TC-08 表驱动：只剩正例 / 只剩反例 → 各红

- **覆盖**：spec §3.3 步骤 7「无正例 / 无反例 → 红」；`schema.mjs:345-353` 的 `checkTestcase` 已有同义强制
- **前置**：`COPY`；`docs-placement-naming` 的两条 case 分别为 pass / fail
- **步骤**：① 副本内删掉 `docs-placement-naming` 的 `expect: "fail"` 那条（只留正例）→ `CK`；② 改回后删掉 `expect: "pass"` 那条（只留反例）→ `CK`；每次取 `exit`、首行、stderr 全文
- **预期**：两次均 exit 1；stderr 分别含 `缺反例` / `缺正例`（`checkTestcase` 现有文案）；两次首行 `红` 数 ≥ 1
- **判据**：表驱动两行各 `assert.equal(exit, 1)` + `assert.match(stderr, /缺反例|缺正例/)`（两次取到的那一个）
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**。已定：spec 码表补 `TestcaseSchema`；本用例判 `exit 1` + `TestcaseSchema`。
- **对应测试**：`test('S4S5-TC-08 …')`
- **不覆盖**：`expect` 取值非法（`checkTestcase` 已有 `cases[i].expect 只许 pass/fail`，归 S4S5-TC-11）

### S4S5-TC-09 testcase 的 `criterion` 未登记 → `UnknownCriterion`

- **覆盖**：spec §3.1「testcase 的 `criterion` 必须指向本文件已登记的判据」+ §3.3 `UnknownCriterion` + 步骤 5（按 `criterion` 分组）
- **前置**：`COPY`
- **步骤**：① 副本内把一条 case 的 `criterion` 改成 `docs-placement-unknown`，并再补一条同名 `expect: "fail"` 以满足正反例门槛 → `CK`；② 取 `exit` 与首行
- **预期**：exit 1；首行含 `UnknownCriterion` 与 `docs-placement-unknown`
- **判据**：`assert.equal(exit, 1)` + 首行两个 `includes`
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；判别力：若按 `cases` 全量 `judge` 而不校验归属，未知 `criterion` 会被静默忽略 → exit 0
- **对应测试**：`test('S4S5-TC-09 …')`
- **不覆盖**：`criterion` 拼错但恰好指向另一条已登记判据（此时不报未知，改由 S4S5-TC-10 的 mismatch 兜）

### S4S5-TC-10 表驱动：`expect` 与 `judge` 结果不符 → 各 `CaseMismatch`

- **覆盖**：spec §3.3 步骤 6「逐条 `judge(criterion, input)`，与 `expect` 比对」+ 错误码 `CaseMismatch`
- **前置**：`COPY`
- **步骤**：① 副本内把 `docs-placement-naming` 的**正例**输入（`docNameExitCode: 0`、`pathInDocs: true`）标成 `expect: "fail"` → `CK`；② 改回后把**反例**输入（`docNameExitCode: 1`）标成 `expect: "pass"` → `CK`；每次取 `exit` 与首行
- **预期**：两次均 exit 1；首行均含 `CaseMismatch` 与 `docs-placement-naming`
- **判据**：表驱动两行各 `assert.equal(exit, 1)` + 首行两个 `includes`
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；判别力：若只跑 `checkTestcase`（它只查「有没有 pass / fail」）而不实跑 `judge`，两次都会 exit 0 → 本条红
- **对应测试**：`test('S4S5-TC-10 …')`
- **不覆盖**：判据本身的语义是否合理（属 §3.5 设计评审，用例只判「实现与登记一致」）

### S4S5-TC-11 表驱动：testcase 容器形状坏（`skill` 不匹配 / `cases` 为空）→ 各红

- **覆盖**：spec §3.3 步骤 4「读同名 `.testcase.json`；校验 `skill` 匹配、`cases` 非空」
- **前置**：`COPY`
- **步骤**：① 副本内把 `docs-placement.testcase.json` 的 `skill` 改为 `other-skill` → `CK`；② 改回后设 `cases: []` → `CK`；每次取 `exit` 与 stderr 首行
- **预期**：两次均 exit 1；stderr 首行以 `[skill-criteria]` 开头且含 `docs-placement.testcase.json`；两次首行 `红` 数 ≥ 1
- **判据**：表驱动两行各 `assert.equal(exit, 1)` + `assert.match(stderr首行, /^\[skill-criteria\] .*docs-placement\.testcase\.json/)`
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**。已定：`SkillTestcaseShape`（spec §3.3 码表）
- **对应测试**：`test('S4S5-TC-11 …')`
- **不覆盖**：`expect` 非法枚举（同上一条理由，归 `checkTestcase` 既有能力，不另立用例）

### S4S5-TC-12 扫描面边界：非 `.json` 文件与孤立 `.testcase.json` 不参与容器扫描

- **覆盖**：spec §3.3 步骤 1「扫描 `tools/docgen/dsl/skills/*.json`，排除 `*.testcase.json`」
- **前置**：`COPY`；现状目录已含 `.gitkeep`
- **步骤**：① 在副本 skills 目录新增 `notes.md`（任意内容）与 `.gitkeep`（已存在）→ `CK`；② 再新增孤立 `zzz.testcase.json`（无同名 `zzz.json`）→ `CK`；每次取 `exit` 与首行
- **预期**：两次均 exit 0；首行 `N` 恒为 4（只数 `docs-placement.json` 这一个容器）
- **判据**：`CK` 两次 **exit 0** + `assert.match(首行, /^skill-criteria 4 条 \/ 绿 4 \/ 红 0$/)`
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**。已定：孤立 `.testcase.json` 一律忽略（spec §3.3 步骤 1）
- **对应测试**：`test('S4S5-TC-12 …')`
- **不覆盖**：`notes.md` 的语法是否正确（不读内容）

### S4S5-TC-13 `scope: skill:docs-placement` 通过结构校验

- **覆盖**：spec §3.2 第 1 条（`SCOPE_RE` 扩为 `project:<name>` / `skill:<name>`）
- **前置**：施工后 `SCOPE_RE` 已扩
- **步骤**：① `CKP` 内直接 `import { check } from '<仓根>/tools/docgen/builders/rules/schema.mjs'`，构造一条合法判据（`scope: 'skill:docs-placement'`，其余字段按 §3.1 示例）→ 调 `check()`；② 断言 findings 中**不含** `ScopeMissing` / `ScopeInvalid`
- **预期**：findings 为空（或至少无这两码）
- **判据**：`CKP` **exit 0**
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；已施工：`schema.mjs:191` 的 `SCOPE_RE` 已同时匹配 `project:` / `skill:`
- **对应测试**：`test('S4S5-TC-13 …')`
- **不覆盖**：检查器侧的 scope 相等判定（S4S5-TC-04）

### S4S5-TC-14 `skill:Bad_Name` → `ScopeInvalid`

- **覆盖**：spec §3.2「`skill:` 的 `<name>` 与 `project:` 同规则：`^[a-z0-9][a-z0-9-]*$`」+ `ScopeInvalid`
- **前置**：施工后
- **步骤**：① `CKP` 内用 `scope: 'skill:Bad_Name'` 调 `check()`；② 断言 findings 含 `ScopeInvalid`，且其 `message` 含 `Bad_Name`
- **预期**：`ScopeInvalid` 命中
- **判据**：`CKP` **exit 0**（两条断言）
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；判别力：若把 `skill:` 做成「只判前缀、name 不校验」，`Bad_Name` 会通过 → 本条红
- **对应测试**：`test('S4S5-TC-14 …')`
- **不覆盖**：`skill:` 空名（`skill:`）——同一正则分支，归本用例表驱动可加第三输入，不另立条目

### S4S5-TC-15 `project:docs-placement` 用在 skill 容器 → `CriterionScopeMismatch`（不是 `ScopeInvalid`）

- **覆盖**：spec §3.1 scope 相等约束 + §3.2 末条（既有 `project:` 不改语义）+ §0.2 口径 4
- **前置**：`COPY`
- **步骤**：① 副本内把第一条判据 `scope` 改为 `project:docs-placement` → `CK`；② 取 `exit`、首行、stderr 首行
- **预期**：exit 1；首行含 `CriterionScopeMismatch`；**不含** `ScopeInvalid`（`project:docs-placement` 形态合法，错的是「不等于 `skill:<文件名>`」）
- **判据**：`assert.equal(exit, 1)` + `includes('CriterionScopeMismatch')` + `assert.equal(stderr.includes('ScopeInvalid'), false)`
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；判别力：若检查器只调 `check()` 不判相等，`project:docs-placement` 会 exit 0 → 本条红
- **对应测试**：`test('S4S5-TC-15 …')`
- **不覆盖**：`project:` 空名仍 `ScopeInvalid`（S4S5-TC-17 第 ③ 步）

### S4S5-TC-16 缺 `scope` → `ScopeMissing`，且文案列出**三种**合法形态

- **覆盖**：spec §3.2「`scope` 缺省 / 非法时，错误文案同步列出三种合法形态」
- **前置**：施工后
- **步骤**：① `CKP` 内构造一条删掉 `scope` 键的判据 → `check()`；② 断言 findings 含 `ScopeMissing`；③ 断言该 `message` 同时含 `global`、`project:`、`skill:`
- **预期**：②③ 全真
- **判据**：`CKP` **exit 0**
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；已施工：`schema.mjs:310-311` 文案列三种形态
- **对应测试**：`test('S4S5-TC-16 …')`
- **不覆盖**：`ScopeInvalid` 的文案三形态（同批应改，建议在 TC-14 内加一条 `message` 含三形态的断言，见 §4 O-3）

### S4S5-TC-17 既有 `global` / `project:<name>` 判据结构校验零改动

- **覆盖**：spec §3.2 末条「既有 `global` / `project:` 判据零改动」+ §6 R-1
- **前置**：施工后
- **步骤**：① `CKP` 内用 `scope: 'global'` 与 `scope: 'project:lpm'` 各构造一条合法判据 → `check()`，断言两次 findings 均不含 `ScopeMissing` / `ScopeInvalid`；② 用 `scope: 'project:'`（空名）→ 断言仍报 `ScopeInvalid`；③ 用 `scope: 'GLOBAL'` → 断言仍报 `ScopeInvalid`
- **预期**：①②③ 全真
- **判据**：`CKP` **exit 0**
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；现状 ①②③ 即为绿（`SCOPE_RE` 已如此），本用例防施工时把正则改宽（如误写成 `^(project|skill):[a-z0-9-]*$` 放行空名）
- **对应测试**：`test('S4S5-TC-17 …')`
- **不覆盖**：`dsl/rules` 全部判据的实跑（S4S5-TC-34）

### S4S5-TC-18 `docs-placement-naming` 正例：命名过 + 落在 docs 内 → pass

- **覆盖**：spec §3.5 表第 1 行（`docNameExitCode = 0` 且 `pathInDocs = true`）
- **前置**：`docs-placement.json` 已按 §3.1 示例登记该判据
- **步骤**：① `CKP` 内 `judge(criterion, { writingDocs: true, docNameExitCode: 0, pathInDocs: true })`；② 断言返回值 `=== 'pass'`
- **预期**：`'pass'`
- **判据**：`CKP` **exit 0**
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；已施工：`docs-placement-naming` 已登记
- **对应测试**：`test('S4S5-TC-18 …')`
- **不覆盖**：`doc:name` 自身是否可靠（已有 `npm run doc:name`，见 `package.json` 第 6 行）

### S4S5-TC-19 `docs-placement-naming` 反例：命名失败 / 落点不在 docs 内 → 各 fail

- **覆盖**：spec §3.5 表第 1 行两个合取项（任一不成立即 fail）
- **前置**：同 TC-18
- **步骤**：① `judge(…, { writingDocs: true, docNameExitCode: 1, pathInDocs: true })`；② `judge(…, { writingDocs: true, docNameExitCode: 0, pathInDocs: false })`
- **预期**：两次均 `'fail'`
- **判据**：`CKP` **exit 0**（两条 `assert.equal`）
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；判别力：若判据只写 `docNameExitCode` 一个 assert，第 ② 个输入会 pass → 本条红
- **对应测试**：`test('S4S5-TC-19 …')`
- **不覆盖**：`writingDocs: false` 的未触发态（S4S5-TC-28）

### S4S5-TC-20 `docs-placement-session-entry` 正例：封闭清单内 / `sdd-*` 前缀 → 各 pass

- **覆盖**：spec §3.5 表第 2 行（在封闭清单内，或 `sdd-*` 前缀）+ `skills/docs-placement/SKILL.md:56` 的清单
- **前置**：同 TC-18
- **步骤**：① `judge(…, { addingSessionEntry: true, entryInClosedList: true, isSddPrefix: false })`；② `judge(…, { addingSessionEntry: true, entryInClosedList: false, isSddPrefix: true })`
- **预期**：两次均 `'pass'`
- **判据**：`CKP` **exit 0**
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；判别力：清单若被写成 `startsWith('reviews/')`，输入 `reviews` 会 fail → 本条红
- **对应测试**：`test('S4S5-TC-20 …')`
- **不覆盖**：清单是否该含 `README.md`（`SKILL.md:56` 已写，属 spec 事实，不另判）

### S4S5-TC-21 `docs-placement-session-entry` 反例：清单外散文件 / 前缀不符 → 各 fail

- **覆盖**：spec §3.5 表第 2 行 + `SKILL.md:54`「一级只许有明确目的的文件夹，散文件非法」
- **前置**：同 TC-18
- **步骤**：① `judge(…, { addingSessionEntry: true, entryInClosedList: false, isSddPrefix: false })`；② `judge(…, { addingSessionEntry: true, entryInClosedList: false, isSddPrefix: 'sddX' })`
- **预期**：两次均 `'fail'`
- **判据**：`CKP` **exit 0**
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；判别力：若前缀判据写成 `includes('sdd')`，`sddX` 会 pass → 本条红
- **对应测试**：`test('S4S5-TC-21 …')`
- **不覆盖**：`tmp/` 非空（属 ⑤ 段既有检查，不在本 spec）

### S4S5-TC-22 `docs-placement-after-done` 正例：已删且未留墓碑 → pass

- **覆盖**：spec §3.5 表第 3 行（`deleted = true` 且 `tombstone = false`）+ `SKILL.md:70`「完成 = 删，不设 ✅ 档」
- **前置**：同 TC-18
- **步骤**：① `judge(…, { afterItemDone: true, deleted: true, tombstone: false })`
- **预期**：`'pass'`
- **判据**：`CKP` **exit 0**
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**
- **对应测试**：`test('S4S5-TC-22 …')`
- **不覆盖**：残余抽检（S4S5-TC-24）

### S4S5-TC-23 `docs-placement-after-done` 反例：未删 / 留墓碑 → 各 fail

- **覆盖**：spec §3.5 表第 3 行两个合取项
- **前置**：同 TC-18
- **步骤**：① `judge(…, { afterItemDone: true, deleted: false, tombstone: false })`；② `judge(…, { afterItemDone: true, deleted: true, tombstone: true })`
- **预期**：两次均 `'fail'`
- **判据**：`CKP` **exit 0**
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；判别力：若判据只写 `deleted`，第 ② 个输入会 pass（墓碑被当成合规）→ 与本项目「删掉 ✅ 档」口径冲突
- **对应测试**：`test('S4S5-TC-23 …')`
- **不覆盖**：未触发态（S4S5-TC-28）

### S4S5-TC-24 【判心项】`after-done` 的 residual 四字段合规

- **覆盖**：spec §3.5 末段「判心项的 `residual.who` = `reviewer-audit`，`fields` 指向对应输入字段，`objectivePath` 写明后续客观化路线」+ `schema.mjs:332-342` 的强制
- **前置**：`docs-placement.json` 已登记
- **步骤**：① 取 `docs-placement-after-done` 这条判据；② 断言 `residual` 是对象；③ 断言 `residual.who === 'reviewer-audit'`；④ 断言 `Number.isInteger(residual.sample) && residual.sample > 0`；⑤ 断言 `Array.isArray(residual.fields) && residual.fields.length > 0`，且每个字段都在该判据 `when` / `assert` 出现过的字段集里；⑥ 断言 `typeof residual.objectivePath === 'string' && residual.objectivePath.trim() !== ''`；⑦ 对该判据调 `check()`，断言 findings 为空
- **预期**：②–⑦ 全真
- **判据**：`CKP` **exit 0**
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；判别力：把 `who` 写成 `''` 或把 `fields` 指向 `deletedX` 时，`check()` 会报 `ResidualWhoMissing` / `FieldLabelMissing` → ⑦ 必红（`schema.mjs:336-341`）
- **对应测试**：`test('S4S5-TC-24 …')`
- **不覆盖**：`sample` 取 3 是否合适（spec 只要求正整数，审美不判）

### S4S5-TC-25 `docs-placement-bak-readonly` 正例：只改承接对照表 / 只改状态头路径 → 各 pass

- **覆盖**：spec §3.5 表第 4 行 + `SKILL.md:22`「只允许补承接对照表与同步状态头里的路径字符串」
- **前置**：同 TC-18
- **步骤**：① `judge(…, { editingBakBody: true, onlyPathOrCrosstable: true, changedSections: ['承接对照表'] })`；② `judge(…, { editingBakBody: true, onlyPathOrCrosstable: true, statusHeaderPathOnly: true })`
- **预期**：两次均 `'pass'`
- **判据**：`CKP` **exit 0**
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；判别力：若判据要求「必须有承接对照表改动」，第 ② 个输入会 fail → 与本条两条允许路径冲突
- **对应测试**：`test('S4S5-TC-25 …')`
- **不覆盖**：残余抽检（S4S5-TC-27）

### S4S5-TC-26 `docs-placement-bak-readonly` 反例：改正文结论 → fail

- **覆盖**：spec §3.5 表第 4 行（只改承接对照表或状态头路径，其余正文只读）
- **前置**：同 TC-18
- **步骤**：① `judge(…, { editingBakBody: true, onlyPathOrCrosstable: false, changedSections: ['正文结论'] })`
- **预期**：`'fail'`
- **判据**：`CKP` **exit 0**
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；判别力：若判据写成 `changedSections.length <= 1`（只限条数不限名），单改正文结论会 pass → 本条红
- **对应测试**：`test('S4S5-TC-26 …')`
- **不覆盖**：同时改承接表与正文（应 fail；与单改同一 assert，不重复立条）

### S4S5-TC-27 【判心项】`bak-readonly` 的 residual 四字段合规

- **覆盖**：spec §3.5 末段（判心项 residual 同形要求）
- **前置**：`docs-placement.json` 已登记
- **步骤**：① 取 `docs-placement-bak-readonly` 判据；②–⑦ 与 S4S5-TC-24 同形（`who === 'reviewer-audit'`、`sample` 正整数、`fields` 非空且 ⊆ 字段集、`objectivePath` 非空、`check()` findings 为空）
- **预期**：②–⑦ 全真
- **判据**：`CKP` **exit 0**
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；判别力：若把该条当「可机判」省掉 `residual`，`check()` 会报 `缺字段 residual`（`schema.mjs:333-334`）→ ⑦ 必红
- **对应测试**：`test('S4S5-TC-27 …')`
- **不覆盖**：`objectivePath` 的措辞是否真能客观化（属 spec 评审，机器只判非空）

### S4S5-TC-28 边界：`when` 不成立 = 不触发 = pass（失败输入也不再判红）

- **覆盖**：spec §3.3 步骤 6 依赖的 `judge` 语义（`schema.mjs:118-122`：`when` 不成立即 `pass`）
- **前置**：同 TC-18
- **步骤**：① `judge(naming, { writingDocs: false, docNameExitCode: 1, pathInDocs: false })`；② `judge(afterDone, { afterItemDone: false, deleted: false, tombstone: true })`
- **预期**：两次均 `'pass'`（未触发）
- **判据**：`CKP` **exit 0**
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；判别力：若判据把 `when` 写成 `always: true`，第 ① 个输入会 fail（把「不写文档」判成违规）→ 本条红
- **对应测试**：`test('S4S5-TC-28 …')`
- **不覆盖**：`when` 的表达式写得好不好（属 §3.5 设计）

### S4S5-TC-29 检查器绿档输出契约：首行正则 + 末行 `skill-criteria ok` + `exit 0`

- **覆盖**：spec §3.3 步骤 8 第 1 句 + §4 V-2
- **前置**：施工完成，四判据全绿
- **步骤**：① `CK`；② 取 stdout 首行、末行、`exit`
- **预期**：`exit 0`；首行匹配 `^skill-criteria \d+ 条 \/ 绿 \d+ \/ 红 \d+$`；末行**全等** `skill-criteria ok`
- **判据**：`CK` **exit 0** + 正则命中 + `assert.equal(末行, 'skill-criteria ok')`
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；判别力：若把中文「条 / 绿 / 红」写成英文或漏掉条数，正则即红；末行若多带前缀（如 `[skill-criteria] ok`）全等即红
- **对应测试**：一次性 e2e（写进当次账本）
- **不覆盖**：红档（S4S5-TC-30）；计数自洽（S4S5-TC-31）

### S4S5-TC-30 红档：`exit 1`、末行不得为 `ok`、报文前缀 `[skill-criteria] file code：message`

- **覆盖**：spec §3.3 步骤 8 第 2 句（`exit 0/1`）+ §6 R-4（失败时打印 `[skill-criteria] file code：message`）
- **前置**：`COPY`
- **步骤**：① 副本内删掉 `docs-placement-bak-readonly` 的两条 case → `CK`；② 取 `exit`、首行、末行、stderr 首行
- **预期**：`exit 1`；首行 `红` 数 ≥ 1；末行**不等于** `skill-criteria ok`；stderr 首行匹配 `^\[skill-criteria\] .+ .+：.+`
- **判据**：`assert.equal(exit, 1)` + `assert.match(首行, /红 [1-9]/)` + `assert.notEqual(末行, 'skill-criteria ok')` + 报文正则
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；判别力：若红档也打印 `skill-criteria ok`（把 ok 当「跑完了」），第三条断言即红；若报文不带文件名，定位失败（R-4 要消的正是这个）
- **对应测试**：`test('S4S5-TC-30 …')`
- **不覆盖**：具体 code 名（各负例 TC-02～TC-11 分别钉）

### S4S5-TC-31 边界：首行计数自洽（N = criteria 条数，M + K = N，不随 cases 变）

- **覆盖**：spec §3.3 步骤 8 首行口径 + §0.2 口径 2
- **前置**：`COPY`
- **步骤**：① 真仓 `CK`，解析首行得 `N₁ / M₁ / K₁`；② 断言 `N₁ === 4`（容器 `criteria` 长度）且 `M₁ + K₁ === N₁`；③ 副本内把 `docs-placement-naming` 的 cases 由 2 条加到 4 条（多补一条 pass、一条 fail）→ `CK`，解析得 `N₂`；④ 断言 `N₂ === N₁`
- **预期**：②④ 全真
- **判据**：`CK` 一次 **exit 0** + `CKP` **exit 0**（②④ 的断言）
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；判别力：若把 cases 条数当 N，第 ③ 步后 N 会从 4 变 8 → ④ 红
- **对应测试**：`test('S4S5-TC-31 …')`
- **不覆盖**：`M` / `K` 与具体哪条判据绿的对应关系（失败清单由 TC-30 的报文兜）

### S4S5-TC-32 门禁：`npm run check` 输出含 `skill-criteria ok`，末行 `check 全部通过`

- **覆盖**：spec §3.4 第 2–4 条 + §4 **V-3**
- **前置**：施工后（⑨ 段已追加 `node scripts/check-skill-criteria.mjs`）
- **步骤**：① `CHECK`；② 取 `exit`、stdout 全文、末行；③ 断言全文含 `skill-criteria ok`；④ 断言全文含 `criteria-engine ok`（两段都在）；⑤ 断言末行含 `check 全部通过`
- **预期**：① exit 0；③④⑤ 全真
- **判据**：`CHECK` **exit 0** + 三个 `includes`
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；判别力：若只把脚本加进 `package.json` 而未接 ⑨ 段，③ 必假（`check-all.mjs:537` 的 `scRun` 才真正调用）
- **对应测试**：一次性 e2e（写进当次账本）
- **不覆盖**：`# tests` / `# fail 0` 的具体数值（只判两段自证行，避免抄旧值）

### S4S5-TC-33 门禁负例：⑨ 段任一失败 → `check 未通过` 且 exit 非 0

- **覆盖**：spec §3.4「两者都过才算 ⑨ 段通过；任一段失败 → `check 未通过`」+ `scripts/check-all.mjs:562-563`
- **前置**：`COPY` 到 `%TEMP%` 整仓副本（需要 `scripts/check-all.mjs` 可跑）
- **步骤**：① 副本内删掉 `docs-placement-bak-readonly` 的两条 case（制造 skill-criteria 红）→ 副本根跑 `node scripts/check-all.mjs`；② 取 `exit`、stdout、stderr；③ 断言 `exit ≠ 0`；④ 断言 stderr 含 `check 未通过`；⑤ 断言 stdout **不含** `check 全部通过`
- **预期**：③④⑤ 全真
- **判据**：`assert.notEqual(exit, 0)` + `assert.match(stderr, /check 未通过/)` + `assert.equal(stdout.includes('check 全部通过'), false)`
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；判别力：若新检查器的失败没有并入 `failed` 变量（只 `console.error`），`check-all` 仍会打 `check 全部通过` → ⑤ 红
- **对应测试**：一次性 e2e（写进当次账本）
- **不覆盖**：`rule-audit-lite` 段同时失败（同一 `failed` 分支，不重复构造）

### S4S5-TC-34 既有判据引擎零回归：`criteria-engine ok`，且 `builders/rules` 投影零差异

- **覆盖**：spec §4 **V-7** + §5「不改 `dsl/rules` 的既有判据与 `rules.json` 投影」
- **前置**：施工后；`BASE` = 施工前 `git rev-parse HEAD`
- **步骤**：① `CE`，取 `exit`、首行、末行；② 断言首行匹配 `^判据 \d+ 条 \/ 绿 \d+ \/ 红 0$`；③ 断言末行全等 `criteria-engine ok`；④ `git diff --stat <BASE> -- tools/docgen/builders/rules`，取行数
- **预期**：① exit 0；②③ 真；④ 0 行
- **判据**：`CE` **exit 0** + 正则 + 末行全等 + `COUNT`（④ = 0 行；不看 `git diff` 退出码）
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；已施工：`check-all.mjs` ⑨ 段已跑该命令，仍绿
- **对应测试**：一次性 e2e
- **不覆盖**：`dsl/rules` 判据条数是否变化（本批明写「不改」，若有变化即 ④ 之外的新事实，须另报）

### S4S5-TC-35 独立脚本入口：`npm run check:skill-criteria` 可单跑

- **覆盖**：spec §3.4 第 1 条（`package.json` 新增脚本）
- **前置**：施工后
- **步骤**：① 读 `package.json` 的 `scripts`，断言含键 `check:skill-criteria`；② 跑 `npm run check:skill-criteria`，取 `exit` 与末行
- **预期**：① 键存在；② exit 0，末行 `skill-criteria ok`
- **判据**：`CKP`（或等价断言）exit 0 + `npm run check:skill-criteria` **exit 0** + 末行全等
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**；已施工：`package.json` 已有 `check:skill-criteria`
- **对应测试**：一次性 e2e
- **不覆盖**：脚本名可否不同（spec §3.4 已写死该名）

### S4S5-TC-36 边界：skills 目录只有 `.gitkeep`（0 条判据）

- **覆盖**：spec §3.3 步骤 1 / 步骤 8 的零输入情形（spec **未定义**，见 §4 O-2）
- **前置**：`COPY` 到只含 `.gitkeep` 的空 `skills/` 目录
- **步骤**：① 副本 `skills/` 内只留 `.gitkeep` → `CK`；② 取 `exit`、首行、末行
- **预期**：exit 0；首行 `skill-criteria 0 条 / 绿 0 / 红 0`；末行 `skill-criteria ok`
- **判据**：`CK` **exit 0** + 首行全等 `skill-criteria 0 条 / 绿 0 / 红 0` + 末行全等
- **红绿证据**：**已由 check-skill-criteria.test.mjs 覆盖（2026-11-08）**。已定：0 条 = 绿；目录缺失 = `SkillDirMissing`（spec §3.3）
- **对应测试**：`test('S4S5-TC-36 …')`
- **不覆盖**：`docs-placement` 单文件被删（按 0 条 = 绿，与 TC-36 同口径；目录缺失才是 `SkillDirMissing`）

## 3 覆盖核对（spec §5 验收面 V-1～V-7 逐条 → 用例）

| 验收项 | 正例 | 负例 | 边界 | 覆盖状态 |
|---|---|---|---|---|
| **V-1** skills 数据在位（两份文件均 `True`） | 01 | — | 12 | 覆盖（文件在位 + 形状；扫描面边界由 12 判） |
| **V-2** 检查器全绿（首行计数 + 末行 `ok` + `exit 0`） | 29 | 30 | 31 | 覆盖（红档末行不得为 `ok`；计数自洽由 31 判） |
| **V-3** 门禁接入（`npm run check` 含 `skill-criteria ok`，末行 `check 全部通过`） | 32 / 35 | 33 | — | 覆盖（⑨ 段失败口径由 33 判） |
| **V-4** S-4 映射（4 条判据全登记、每条有 testcase） | 01 / 18 / 20 / 22 / 25 | 06 / 07 / 08 | — | 覆盖（四条判据各有正例；缺 testcase / 缺正反例各有用例） |
| **V-5** S-5 映射（4 条判据都有 residual 四字段） | 24 / 27 | — | — | 覆盖（两个判心项各一条 residual 断言；另两非判心项由 `check()` 强制兜底，见 §4 O-4） |
| **V-6** 负例（删 testcase / 改错 scope / 去反例 / 改错 expect → 必红） | — | 06 / 15 / 08 / 10 | — | 覆盖（再加 02/03/04/05/07/09/11 共 11 条负例） |
| **V-7** 既有 rule 零回归（`criteria-engine ok`、投影不变） | 34 | — | 17 | 覆盖（结构层由 17 判，实跑由 34 判） |

**结构面补充（不在 V 表但 spec §3 明写）**：

| spec 条目 | 用例 |
|---|---|
| §3.1 容器形状 / `skill` = 文件名 / `criteria` 非空 | 01（正）/ 02 / 03 |
| §3.1 `id` 全局唯一 | 05（同文件 + 跨文件） |
| §3.1 `scope` = `skill:<文件名>` | 04（不等）/ 15（`project:` 误用） |
| §3.1 testcase `criterion` 指向已登记判据 | 09 |
| §3.2 `SCOPE_RE` 扩三种形态 + name 规则 + 文案三形态 | 13 / 14 / 16 / 17 |
| §3.3 步骤 1 扫描面 | 12 / 36 |
| §3.3 步骤 4 testcase 容器形状 | 06 / 11 |
| §3.3 步骤 6 `judge` 比对 | 10 / 28 |
| §3.3 步骤 7 正反例门槛 | 07 / 08 |
| §3.3 步骤 8 输出契约 | 29 / 30 / 31 |
| §3.4 脚本入口 / ⑨ 段接法 | 32 / 33 / 35 |
| §3.5 `naming` | 18 / 19 / 28 |
| §3.5 `session-entry` | 20 / 21 |
| §3.5 `after-done` + residual | 22 / 23 / 24 |
| §3.5 `bak-readonly` + residual | 25 / 26 / 27 |
| §6 R-3（容器与文件名不一致漏扫） | 03 / 12 |
| §6 R-4（失败定位） | 30 |

**未覆盖的 spec 条目**：0 条（§4「不做什么」五条属范围排除，不是验收面；已在下述 O-4 / O-6 显式登记两处 spec 沉默点）。

## 4 给开发的建议（6 条；每条「改哪里 / 怎么改 / 为什么这里会炸 / 落点」）

1. **【O-1】补「无正例 / 无反例 / testcase 容器形状坏」的错误码与文案**
   改哪里：spec §3.3 错误码表（`tools/docgen/dsl/skills/` 的检查器与 spec 同批）。
   怎么改：至少补 `TestcaseIncomplete`（无正例 / 无反例）与 `SkillTestcaseShape`（`skill` 不匹配 / `cases` 非空），或明写「归 `TestcaseMissing` / `SkillFileShape`」。
   为什么这里会炸：现表只有 8 个 code，TC-08 / TC-11 的两种输入落不到任何 code；实现可自由选，用例期望会与实现分叉（本文件已按「不钉 code」处理）。
   落点：S4S5-TC-08 / 11。
2. **【O-2】定义「零判据 / 单 skill 数据被删」的门禁语义**
   改哪里：spec §3.3 步骤 8。
   怎么改：二选一并写死——（a）0 条 = 绿（本用例现取的口径）；（b）0 条 = 红（防 `skills/` 被清空后门禁假绿）。
   为什么这里会炸：`.gitkeep` 是当前唯一内容；若不定死，施工方与用例方会各写一套，`exit 0/1` 相反。
   落点：S4S5-TC-36（若改 (b)，本条期望改 `exit 1` + `红 1`）。
3. **【O-3】`ScopeInvalid` 的文案也要列三种形态**
   改哪里：`tools/docgen/builders/rules/schema.mjs:311`。
   怎么改：`scope 非法 → …（只许 global / project:<name> / skill:<name>，name 匹配 ^[a-z0-9][a-z0-9-]*$）`；`ScopeMissing`（第 310 行）同改。
   为什么这里会炸：spec §3.2 明写「`scope` 缺省 / 非法时，错误文案同步列出三种合法形态」，只改 `ScopeMissing` 会漏一半；且两处文案不一致会让使用者以为 `skill:` 只对缺省情形合法。
   落点：S4S5-TC-16（缺省侧）；建议在 S4S5-TC-14 追加 `message` 三形态断言。
4. **【O-4】「每条判据都有 residual」不能只靠两个判心项的用例**
   改哪里：spec §3.5 末段。
   怎么改：明写「四条判据全部要带 `residual`（`schema.mjs` 已强制），判心项另加 `who = reviewer-audit` 的语义要求」；或接受「非判心项的 residual 只由 `check()` 兜」。
   为什么这里会炸：现 spec 只说「每条判据都必须带 `residual`」但又只给判心项写 `who` 规则；若实现给 `naming` 填 `who: 'auto'`，`check()` 仍绿，但 §4 V-5「4 条判据都有 residual 四字段」会被读成必须有 `reviewer-audit` → 口径分叉。
   落点：S4S5-TC-24 / 27（判心项）；非判心项现由 S4S5-TC-01 的 `check()` 兜（`schema.mjs:332-342`）。
5. **【O-5】复用 `checkTestcase` 时必须补 `rule` 键**
   改哪里：`scripts/check-skill-criteria.mjs`。
   怎么改：按 `criterion` 分组后拼 `{ rule: criterionId, cases }` 再调 `checkTestcase(tc, file, ruleIds, errors)`；`ruleIds` 传本文件已登记的 id 集合。
   为什么这里会炸：`checkTestcase` 第一行就查 `tc.rule`（`schema.mjs:346`）；直接传 `{ skill, cases }` 会报「引用的 rule 不存在 → undefined」→ 全红且报错指不到真因。
   落点：S4S5-TC-09 / 10。
6. **【O-6】孤立 `.testcase.json` 的处理写进 spec**
   改哪里：spec §3.3 步骤 1 / 步骤 4。
   怎么改：明写「无同名容器的 `.testcase.json` 一律忽略」或「报 `SkillFileShape`」。
   为什么这里会炸：步骤 1 只说「扫描 `*.json`，排除 `*.testcase.json`」，没说孤立件怎么办；扫描面写错会漏扫（R-3）或多扫（假红）。
   落点：S4S5-TC-12。

## 5 异议与裁定（6 处已定，2026-11-08）

| # | 抓到什么 | 处置 | 本文件落点 |
|---|---|---|---|
| O-1 | spec §3.3 码表缺「无正例 / 无反例 / testcase 形状坏」 | 已写建议 1；用例按「不钉 code、只判 exit + 关键词」写 | S4S5-TC-08 / 11 |
| O-2 | 零判据 / 单 skill 数据被删的绿红语义未定义 | 已写建议 2；用例按最小契约「0 条 = 绿」钉死并标注 | S4S5-TC-36 |
| O-3 | `ScopeInvalid` 文案是否同步三形态未写死 | 已写建议 3；缺省侧用例已判，非法侧建议追加断言 | S4S5-TC-14 / 16 |
| O-4 | 非判心项的 residual 是否也须 `reviewer-audit` | 已写建议 4；判心项各一条 residual 用例 | S4S5-TC-24 / 27 |
| O-5 | 复用时 `checkTestcase` 的 `rule` 键拼装未写 | 已写建议 5；负例已覆盖 | S4S5-TC-09 / 10 |
| O-6 | 孤立 `.testcase.json` 的处置未写 | 已写建议 6；边界用例已钉「忽略」 | S4S5-TC-12 |

> **2026-11-08 收口**：O-1 → 码表补 `TestcaseSchema` / `SkillTestcaseShape`；O-2 → 0 条 = 绿、缺目录 = `SkillDirMissing`；O-3 → `ScopeInvalid` 文案列三形态；O-4/O-5/O-6 按实现口径落地（判心 residual / `checkTestcase` 拼装 / 孤立 testcase 忽略）。本节不再是"未决"。

**结论（依据 ≥ 2 条、来自 ≥ 2 个不同文件）**：① spec §3.3 步骤 8 只定义了绿档输出与 `exit 0/1`，未定义红档末行，故本文件把「红档末行不得为 `ok`」作为显式判据（`docs/superpowers/specs/2026-11-08-s4-s5-skill-criteria-design.md` §3.3 步骤 8）；② 现有 `checkTestcase` 已强制正反例（`tools/docgen/builders/rules/schema.mjs:345-353`），故「去反例必红」有既成实现可依；③ 现有 ⑨ 段失败口径是 `check 未通过` + `exitCode = 1`（`scripts/check-all.mjs:562-563`），故门禁负例判据不必新造。三条一致 → 本文件判据可执行、无自造语义。

## 6 本席自检（角色卡「一定会」5 条 + 本席清单 9 条；判定只许 `hit` / `miss` / `na` + `reason` + `evidence`）

| # | 条目 | 判定 | 证据（path:line 或命令输出首行） |
|---|---|---|---|
| 一定会-1 | 交付物结束（立场不偏、按项目长期判断）：结论段依据 ≥ 2 条、来自 ≥ 2 文件 | `hit` | 依据① `docs/superpowers/specs/2026-11-08-s4-s5-skill-criteria-design.md` §3.3 / §3.5 / §5；依据② `tools/docgen/builders/rules/schema.mjs:332-353`（residual 与 testcase 强制）；依据③ `scripts/check-all.mjs:519`（criteria-engine）/ `:537`（skill-criteria）/ `:562-563`（失败口径）→ 3 条、3 文件；结论已写回 §5 末段 |
| 一定会-2 | 证据可复算：引用行存在且含被引摘句 | `hit` | `package.json:4-14` 有 `check:skill-criteria`；`schema.mjs:191` 的 `SCOPE_RE` 已同时匹配 `project:` / `skill:`；`schema.mjs:310-311` 文案列三形态；`check-all.mjs:519` 跑 `criteria-engine`，`:537` 起跑 `skill-criteria`；`Get-ChildItem tools/docgen/dsl/skills` 含 `docs-placement.json` 与 `.testcase.json` |
| 一定会-3 | 非专业读者能听懂：英文术语首现行含中文解释 | `hit` | 文件头术语对照给了 判据 / 残余 / 探针 / 绿红 / 容器 / 临时副本；正文对 `probe`、`residual`、`expect`、`judge` 均在首现行给中文解释；未解释术语计数 = 0 |
| 一定会-4 | 无问题时显式写「全过、无问题」 | `hit` | §5 已写「findings 集合为空」对应的结论行；6 条 O 项均有处置与落点，无未处置项 |
| 一定会-5 | 附录无问题时显式写「全过、无问题」 | `na` | reason：本文件不设附录，无可判对象 |
| 本席-1 | 输入空间核对 | `hit` | §0.1 列全输入面：施工前 skills 目录（仅 `.gitkeep`）/ 检查器不存在 / `package.json` 脚本表 / `SCOPE_RE` / 两处 scope 文案 / residual 与 testcase 强制 / ⑨ 段命令与失败口径 / 四条判据的语义来源（`skills/docs-placement/SKILL.md:22,48,56,70`） |
| 本席-2 | 状态与转移核对 | `hit` | 状态写了两侧：施工前（无数据、无检查器、scope 只认 `project:`）→ 施工后（4 条判据、绿档、门禁接入）；状态转移由 TC-01（无→有）、TC-17（旧形态保持）、TC-29/32（红→绿）判 |
| 本席-3 | 失败面核对 | `hit` | 8 个 spec 错误码各有负例：`SkillFileShape`（02）、`SkillNameMismatch`（03）、`CriterionScopeMismatch`（04/15）、`DuplicateId`（05）、`TestcaseMissing`（07）、`UnknownCriterion`（09）、`CaseMismatch`（10）、`SkillTestcaseMissing`（06）；另 `ScopeMissing`/`ScopeInvalid`（14/16/17）与 `TestcaseSchema` / `SkillTestcaseShape`（08/11） |
| 本席-4 | 判据来源核对 | `hit` | 每条「覆盖」栏指回 spec §3.1–§3.5 或 §5 V-N；§3 逐条对表；未覆盖 = 0 |
| 本席-5 | 确定性核对 | `hit` | 所有判据 = `exit code` / 全等 / 正则 / 计数 / 报文前缀；无「看语气」；所有用例由 `check-skill-criteria.test.mjs` 的 25 条测试覆盖；N/M/K 口径在 §0.2 口径 2 钉死 |
| 本席-6 | 回归资产核对 | `hit` | §4 建议 3 点名 `schema.mjs` 两处文案；建议 5 点名 `checkTestcase` 的 `rule` 键；TC-34 判 `builders/rules` 投影零差异；TC-32 判既有 `criteria-engine ok` 与新增 `skill-criteria ok` 两行并存 |
| 本席-7 | 判别力核对 | `hit` | 每条负例都写「不改会怎样」：02（只 parse 不校验 → 绿）、03（按 id 前缀推断 → 绿）、05（单文件去重 → 跨文件绿）、10（只跑 `checkTestcase` → 绿）、15（只调 `check()` → 绿）、17（正则改宽 → 放行空名）、23（只判 `deleted` → 墓碑绿）、30（红档也打 ok → 断言红）、33（失败未并入 `failed` → 仍打「全部通过」） |
| 本席-8 | 盲点雷达核对 | `hit` | 抓到 6 处 spec 沉默点并全部转为建议：O-1 码表缺口 / O-2 零判据语义 / O-3 文案两处不同步 / O-4 非判心项 residual / O-5 `checkTestcase` 的 `rule` 键 / O-6 孤立 testcase；对应 TC-08·11 / 36 / 14·16 / 24·27 / 09·10 / 12 |
| 本席-9 | 覆盖账核对 | `hit` | §1.1 现算：正 12 / 负 19 / 边 5 = 36；负 + 边 24 ≥ 正 12；V-1～V-7 全覆盖；四条 `docs-placement` 判据各有 ≥ 1 正例 + ≥ 1 反例（18/19、20/21、22/23、25/26）；两个判心项各有 residual 用例（24/27） |

**禁止 4 条自检**：① 每条问题都给了写法（§4 六条 + §5 每行「本文件落点」）；② **未越界处置**——本轮唯一写入 = 本文件，未改 spec / 代码 / plan / 规则，未跑 git 写操作；③ 证据栏无空行（上表逐行有 path:line 或命令首行）；④ 未代任何他席填签名（本文件无签名栏）。
