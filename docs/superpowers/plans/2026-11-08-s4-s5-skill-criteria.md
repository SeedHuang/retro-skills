# 施工计划：S-4/S-5 skill 判据登记与 residual

> 状态：**施工完成（2026-11-08）**｜验证：`skill-criteria 4 条 / 绿 4 / 红 0`；`npm run check` → `check 全部通过`

> 归属 spec：`docs/superpowers/specs/2026-11-08-s4-s5-skill-criteria-design.md`
**Testcase:** `docs/superpowers/specs/2026-11-08-s4-s5-skill-criteria-design-testcase.md`（36 条：正 12 / 负 19 / 边 5）
> 目标：`docs-placement` 四条判据进入 `tools/docgen/dsl/skills/`，新检查器接入 `check-all` ⑨ 段，S-4/S-5 可复核。

## 0 全局约束

- 只做 `docs-placement` 试点，不迁移其余 12 个 skill。
- 不改外部 `skill-common-script`；新检查器在仓内复用 `schema.mjs` 的 `check` / `checkTestcase` / `judge`。
- 不渲染 skill 正文；`SKILL.md` 仍是人写正文，判据只登记与执行。
- 不改 `dsl/rules` 既有判据与 `rules.json` 投影。
- 每步先跑该步的命令，绿了再进下一步；红灯不跨步。

## 1 任务表

| # | 任务 | 产出 | 依赖 |
|---|---|---|---|
| T1 | `schema.mjs` 支持 `scope: skill:<name>` | `SCOPE_RE` + 两条错误文案 | 无 |
| T2 | 新建检查器与单测 | `scripts/check-skill-criteria.mjs`、`scripts/check-skill-criteria.test.mjs` | Consumes: Task 1 |
| T3 | `docs-placement` 试点数据 | `tools/docgen/dsl/skills/docs-placement.json` + `.testcase.json` | Consumes: Task 2 |
| T4 | 门禁接入 | `package.json`、`scripts/check-all.mjs` ⑨ 段 | Consumes: Task 3 |
| T5 | 收口 | 阶段 3 状态、docs/after 挂账、全量复跑 | Consumes: Task 4 |

**功能点→任务映射**（本批对应阶段 3 的 S-4 / S-5，无 F-xx 功能点）

| 验收项 | 内容 | 任务 |
|---|---|---|
| S-4 | skill 可机判条目在判据引擎登记且 testcase 全绿 | Task 1 / Task 2 / Task 3 / Task 4 |
| S-5 | 每个语义判项有 residual | Task 3 / Task 5 |

## 2 任务小节

### T1 `scope` 扩展

- Consumes: 无
- 产出：`tools/docgen/builders/rules/schema.mjs:191` 的 `SCOPE_RE` 改为 `/^(project|skill):[a-z0-9][a-z0-9-]*$/`；`:310-311` 两条错误文案列出 `global` / `project:<name>` / `skill:<name>`。
- 验收：`node --test --test-name-pattern "S4S5-TC-1[3-7]" scripts/check-skill-criteria.test.mjs` 全绿；`global` / `project:` 既有行为不变。

### T2 检查器

- Consumes: Task 1
- 产出：`scripts/check-skill-criteria.mjs` 扫描 `tools/docgen/dsl/skills/*.json`，校验容器、scope、id 唯一、testcase、正反例、judge；输出首行 `skill-criteria N 条 / 绿 M / 红 K`、末行 `skill-criteria ok`；新建 `scripts/check-skill-criteria.test.mjs` 覆盖正反例与边界。
- 验收：`node --test scripts/check-skill-criteria.test.mjs` 全绿；T3 数据落地后 `node scripts/check-skill-criteria.mjs` exit 0。

### T3 `docs-placement` 试点数据

- Consumes: Task 2
- 产出：`tools/docgen/dsl/skills/docs-placement.json`（4 条判据：naming / session-entry / after-done / bak-readonly）+ `docs-placement.testcase.json`（每条至少 1 正例 + 1 反例，when 不成立给边界 pass）。
- 验收：`node scripts/check-skill-criteria.mjs` 首行 `skill-criteria 4 条 / 绿 M / 红 0`、末行 `skill-criteria ok`、exit 0。

### T4 门禁接入

- Consumes: Task 3
- 产出：`package.json` 增加 `"check:skill-criteria": "node scripts/check-skill-criteria.mjs"`；`scripts/check-all.mjs` ⑨ 段在 `scs check criteria-engine` 后追加 `node scripts/check-skill-criteria.mjs`，任一失败 → `check 未通过`。
- 验收：`npm run check:skill-criteria` → `skill-criteria ok`；`npm run check` 输出含 `criteria-engine ok` 与 `skill-criteria ok`，末行 `check 全部通过`。

### T5 收口

- Consumes: Task 4
- 产出：阶段 3 S-4/S-5 状态改「已落（2026-11-08，docs-placement 试点）」；删除 `docs/after/20261108164744-stage3-s4-s5-skill-criteria-open-decisions.md`；更新 impact-sheet；全量复跑。
- 验收：`npm run doc:name` → `命名检查通过（docs）`；`npm run check:criteria` → `criteria-engine ok`；`npm run check` → `check 全部通过`。

## 3 计划门自检

| 门 | 判据 | 本计划 |
|---|---|---|
| 功能点全覆盖 | spec §3.1–§3.5、§5 V-1–V-7 都有任务 | T1–T5 全映射 |
| 依赖无环 | T1→T2→T3→T4→T5 | 线性，无环 |
| 功能块↔testcase 映射 | 每个任务能指到 S4S5-TC 编号 | 见附录 A |

## 附录 A 用例→任务映射

| 用例 ID | 任务 | 覆盖要点 |
|---|---|---|
| S4S5-TC-01 | Task 2 | 容器结构 |
| S4S5-TC-02 | Task 2 | 容器形状反例 |
| S4S5-TC-03 | Task 2 | skill 名不匹配 |
| S4S5-TC-04 | Task 2 | scope 不匹配 |
| S4S5-TC-05 | Task 2 | id 重复 |
| S4S5-TC-06 | Task 2 | 整个 testcase 缺失 |
| S4S5-TC-07 | Task 2 | 单条判据无 testcase |
| S4S5-TC-08 | Task 2 | 缺正例 / 缺反例 |
| S4S5-TC-09 | Task 2 | 未知 criterion |
| S4S5-TC-10 | Task 2 | case 与 expect 不符 |
| S4S5-TC-11 | Task 2 | testcase 容器坏 |
| S4S5-TC-12 | Task 2 | 扫描面边界 |
| S4S5-TC-13 | Task 1 | skill scope 正例 |
| S4S5-TC-14 | Task 1 | skill name 非法 |
| S4S5-TC-15 | Task 1 | project 误用于 skill 容器 |
| S4S5-TC-16 | Task 1 | 缺 scope |
| S4S5-TC-17 | Task 1 | global / project 零改动 |
| S4S5-TC-18 | Task 3 | naming 正例 |
| S4S5-TC-19 | Task 3 | naming 反例 |
| S4S5-TC-20 | Task 3 | session-entry 正例 |
| S4S5-TC-21 | Task 3 | session-entry 反例 |
| S4S5-TC-22 | Task 3 | after-done 正例 |
| S4S5-TC-23 | Task 3 | after-done 反例 |
| S4S5-TC-24 | Task 3 | after-done residual |
| S4S5-TC-25 | Task 3 | bak-readonly 正例 |
| S4S5-TC-26 | Task 3 | bak-readonly 反例 |
| S4S5-TC-27 | Task 3 | bak-readonly residual |
| S4S5-TC-28 | Task 3 | when 不成立边界 |
| S4S5-TC-29 | Task 2 | 绿档输出契约 |
| S4S5-TC-30 | Task 2 | 红档输出契约 |
| S4S5-TC-31 | Task 2 | 计数自洽 |
| S4S5-TC-32 | Task 5 | 门禁全绿 |
| S4S5-TC-33 | Task 4 | 门禁负例 |
| S4S5-TC-34 | Task 5 | 既有引擎零回归 |
| S4S5-TC-35 | Task 4 | 独立脚本入口 |
| S4S5-TC-36 | Task 2 | 空目录边界 |
