# S-4/S-5：skill 判据登记与 residual（设计）

> 状态：**已实施（2026-11-08）**｜创建：2026-11-08｜来源：阶段 3 验收 S-4 / S-5
> 实施验证：`node scripts/check-skill-criteria.mjs` → `skill-criteria 4 条 / 绿 4 / 红 0`；`npm run check` → `check 全部通过`。
> 本文只定义「要发生什么」；testcase 由 `senior-sdet` 在独立上下文编写，plan 另起。
> 目标：让 skill 的可机判条目进入判据引擎，语义项有 residual，并把检查接进 `check-all` ⑨ 段。

## 1 要解决什么

阶段 3 的 12 条承接已 12/12，但 S-4 / S-5 未过：

- `tools/docgen/dsl/skills/` 只有 `.gitkeep`；
- `check-all` ⑨ 段只跑 `scs check criteria-engine --data tools/docgen/dsl/rules`；
- `docs-placement` 的 `.session` 封闭清单、命名、待办语义没有判据 JSON / testcase / residual。

结果：这些义务只写在 SKILL.md 散文里，改错不会被机器发现；「每个 skill 的可机判条目有登记」无法复核。

## 2 事实基线（可复算）

| # | 事实 | 取数 |
|---|---|---|
| 1 | `scs check criteria-engine` 的 `--data` 只接受一个目录，不可重复 | `scs check criteria-engine --help` → `--data <dir>` 单值 |
| 2 | 引擎按单目录加载 `.json`，并对每条判据强制要求 `md` 投影存在 | `tools/docgen/builders/rules/build.mjs:18-40`；`skill-common-script/src/commands/check-criteria-engine.ts:166-179` |
| 3 | `scope` 目前只允许 `global` / `project:<name>` | `tools/docgen/builders/rules/schema.mjs:191,310-311` |
| 4 | schema 已强制 `residual`（who / sample / objectivePath / fields） | `schema.mjs:332-342` |
| 5 | `checkTestcase` 已强制正例 + 反例 | `schema.mjs:345-353` |
| 6 | `check-all` ⑨ 段只跑 `scs check criteria-engine` 与 `rule-audit-lite` | `scripts/check-all.mjs:519-546` |

结论：不能把 skill 判据直接放进 `dsl/rules`——会被当成 rule，强制生成 `builders/rules/<id>.md`，还会进 rule 预算统计。需要独立的 skills 数据目录与独立检查器。

## 3 方案

### 3.1 数据形态

新增目录 `tools/docgen/dsl/skills/`，每个 skill 两份文件：

```
tools/docgen/dsl/skills/
  docs-placement.json            判据容器
  docs-placement.testcase.json   独立测试
```

判据容器：

```json
{
  "skill": "docs-placement",
  "criteria": [
    {
      "id": "docs-placement-naming",
      "impl": "script",
      "type": "条件触发",
      "scope": "skill:docs-placement",
      "title": "文档命名必须过 doc-name",
      "when": { "field": "writingDocs", "op": "eq", "value": true, "label": "新建或移动 docs 文档时" },
      "assert": [
        { "label": "命名检查", "field": "docNameExitCode", "op": "eq", "value": 0, "probe": { "kind": "manual" } }
      ],
      "residual": {
        "who": "reviewer-audit", "sample": 3,
        "fields": ["docNameExitCode"],
        "objectivePath": "doc:name 已覆盖命名；目录归属由审计抽检"
      },
      "landing": "docs-placement / docs 命名"
    }
  ]
}
```

测试容器：

```json
{
  "skill": "docs-placement",
  "cases": [
    { "criterion": "docs-placement-naming", "input": { "writingDocs": true, "docNameExitCode": 0 }, "expect": "pass" },
    { "criterion": "docs-placement-naming", "input": { "writingDocs": true, "docNameExitCode": 1 }, "expect": "fail" }
  ]
}
```

约束：

- `skill` 必须与文件名去掉 `.json` 后相等；
- `criteria` 非空；`id` 全局唯一；
- 每条判据的 `scope` 必须等于 `skill:<文件名>`；
- 每条判据必须有 testcase；testcase 必须同时含 pass 与 fail；
- testcase 的 `criterion` 必须指向本文件已登记的判据；
- 不做投影：skill 正文（SKILL.md）仍是人写正文，判据只做登记与执行，不渲染。

### 3.2 `scope` 扩展

`schema.mjs` 的 `SCOPE_RE` 从 `project:<name>` 扩为 `project:<name>` / `skill:<name>`：

- `skill:` 的 `<name>` 与 `project:` 同规则：`^[a-z0-9][a-z0-9-]*$`；
- `scope` 缺省 / 非法时，错误文案同步列出三种合法形态；
- 既有 `global` / `project:` 判据零改动。

### 3.3 检查器

新增 `scripts/check-skill-criteria.mjs`，复用 `tools/docgen/builders/rules/schema.mjs` 的 `check` / `checkTestcase` / `judge`，不复制判定语义。

流程：

1. 扫描 `tools/docgen/dsl/skills/*.json`，排除 `*.testcase.json`；
2. 校验容器形状：`skill` 匹配文件名、`criteria` 非空；
3. 逐条 `check(criterion)`；校验 `scope === skill:<name>`；收集 id，重复即红；
4. 读同名 `.testcase.json`；校验 `skill` 匹配、`cases` 非空；
5. 按 `criterion` 分组，逐条调用 `checkTestcase({ rule: id, cases }, ...)`；
6. 逐条 `judge(criterion, input)`，与 `expect` 比对；
7. 任一条判据无 testcase / 无正例 / 无反例 → 红；
8. 输出契约：首行 `skill-criteria N 条 / 绿 M / 红 K`，末行 `skill-criteria ok`；exit 0/1。
   - `N` 恒为容器 `criteria` 条数，`M + K = N`。
   - `UnknownCriterion`、`SkillDirMissing` 等测试级 finding 只进 stderr 与 exit code，不并入 `N/M/K`；红档末行不得为 `skill-criteria ok`。

错误码（前缀 `[skill-criteria]`）：

| code | 触发 |
|---|---|
| `SkillFileShape` | 容器不是对象 / 缺 `skill` / `criteria` 非数组或为空 |
| `SkillNameMismatch` | `skill` 与文件名不一致 |
| `CriterionScopeMismatch` | `scope` 不等于 `skill:<name>` |
| `DuplicateId` | 判据 id 在 skills 内重复 |
| `TestcaseMissing` | 某判据没有 testcase |
| `UnknownCriterion` | testcase 的 `criterion` 不在本文件判据里 |
| `CaseMismatch` | `judge` 结果与 `expect` 不一致 |
| `CaseInputInvalid` | `judge` 因 `input` 为 null / 非对象而抛错 |
| `SkillTestcaseMissing` | 整个 `.testcase.json` 缺失 |
| `SkillDirMissing` | `tools/docgen/dsl/skills/` 目录不存在（fail-closed） |

### 3.4 门禁接法

- `package.json` 新增 `"check:skill-criteria": "node scripts/check-skill-criteria.mjs"`；
- `check-all` ⑨ 段在 `scs check criteria-engine` 之后追加 `node scripts/check-skill-criteria.mjs`；
- 两者都过才算 ⑨ 段通过；任一段失败 → `check 未通过`；
- 输出与 ⑨ 段现有契约同构：首行计数、末行 `skill-criteria ok`，便于自证。

### 3.5 `docs-placement` 试点判据

本批只落 `docs-placement`，其余 skill 后续按同一形态增量登记。

| id | 触发 | 义务 | 性质 |
|---|---|---|---|
| `docs-placement-naming` | 新建 / 移动 docs 文档 | `docNameExitCode = 0` 且 `pathInDocs = true` | 可机判（输入由 `doc:name` 提供） |
| `docs-placement-session-entry` | 新增 `.session` 一级条目 | 在封闭清单内，或 `sdd-*` 前缀 | 可机判（输入由 ⑤ 段提供） |
| `docs-placement-after-done` | after 条目做完 | `deleted = true` 且 `tombstone = false` | 判心 + residual |
| `docs-placement-bak-readonly` | 改 `docs/bak` 正文 | 只改承接对照表或状态头路径 | 判心 + residual |

每条判据都必须带 `residual`（schema 已强制）；判心项的 `residual.who` = `reviewer-audit`，`fields` 指向对应输入字段，`objectivePath` 写明后续客观化路线。

## 4 不做什么

- 不在本批迁移全部 13 个 skill；只做 `docs-placement` 试点。
- 不改 `skill-common-script`（外部 CLI）的接口。
- 不渲染 skill 正文；SKILL.md 仍是人写正文，判据只登记与执行。
- 不改 `dsl/rules` 的既有判据与 `rules.json` 投影。
- 不新增 rule 预算闸；skill 判据的条数上限待多 skill 落地后再定。

## 5 验收

| # | 判据 | 判定动作 |
|---|---|---|
| V-1 | skills 数据在位 | `Test-Path tools/docgen/dsl/skills/docs-placement.json` 与 `.testcase.json` 均为 True |
| V-2 | 检查器全绿 | `node scripts/check-skill-criteria.mjs` 首行 `skill-criteria 4 条 / 绿 N / 红 0`，末行 `skill-criteria ok`，exit 0 |
| V-3 | 门禁接入 | `npm run check` 输出含 `skill-criteria ok`，末行 `check 全部通过` |
| V-4 | S-4 映射 | 4 条判据全部在 `docs-placement.json` 登记，且每条有 testcase |
| V-5 | S-5 映射 | 4 条判据都有 `residual{who, sample, fields, objectivePath}` |
| V-6 | 负例 | 删 testcase / 改错 scope / 去反例 / 改错 expect，检查器必红（testcase 覆盖） |
| V-7 | 既有 rule 零回归 | `scs check criteria-engine` 仍 `criteria-engine ok`；`rules/` 投影不变 |

## 6 风险

| # | 风险 | 缓解 |
|---|---|---|
| R-1 | `scope: skill:` 改动影响既有 schema 测试 | 同批更新 schema 测试的正反例；`global` / `project:` 用例保持 |
| R-2 | 手工 probe 不是真正机判 | residual 明确 `who/sample/objectivePath`；后续可把 `doc:name` / ⑤ 段输出接成脚本输入 |
| R-3 | 数据容器与文件名不一致导致漏扫 | 检查器强制 `skill` = 文件名，且 id 全局唯一 |
| R-4 | ⑨ 段变长 / 失败定位变难 | 两段各自输出首行计数与末行 ok；失败时打印 `[skill-criteria] file code：message` |
