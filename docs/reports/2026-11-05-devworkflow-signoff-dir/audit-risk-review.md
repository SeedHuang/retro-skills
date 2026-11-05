# ② 段风险审查：dev-workflow 签字账迁目录（reviewer-audit）

> 编写者：`reviewer-audit` 子代理（2026-11-05，全新上下文，只读审查）；本文由主 agent**机械转录**其结论与处置回执，不改判级。
> 审查对象：本批全部改动（PRD `docs/prd/20261105160504-devworkflow-signoff-dir/`、`scripts/check-gate-record.mjs`、`skills/dev-workflow/**`、`rules/**`、`tools/docgen/**`、`tools/scope-sweep/**`、`docs/guide/**`）。
> 复审命令：`npm run check`（exit 0）+ `node scripts/scope-sweep.mjs --check`（exit 0）。

## 结论

共 12 条：P0 2 / P1 4 / P2 6。处置 = **改 9 条、不改 3 条**（不改理由见末节）。

## 逐条处置

| # | 级 | 发现 | 处置 |
|---|---|---|---|
| 1 | P0 | 技改例外写成「功能点集合 diff 为空、**且不新增交付物**」——本批新增了模板 / 目录档 / 脚本，照字面本批自己不合格 | **改**：例外条件改为「功能点集合 diff 为空（无新增 / 删除 / 改判功能点）」，并明写**同批允许新增交付物**；只点 PRD `index.md:21` 已自认「不满足 §4.2 字面条件」 |
| 2 | P0 | ② 行证据只是 PRD 里的用户原话（U-7）；例外要求的 `docs/reports/<批次>/` 两份审查结论**未落盘** | **改**：本目录落 `sdet-risk-review.md` / `audit-risk-review.md` 两份；② 行证据改指这两份的 `path:line` |
| 3 | P1 | ②→③ 行用「PRD §7」代替 plan 作证据，缺规则依据 | **不改**：PRD §7 即本批的计划（S1/S2/S3 + 每任务出口判据）；R1 只要求「命令输出首行或 `path:line`」的可复算锚点，未规定计划必须是独立文件。②→③ 行结论已写明「PRD §7 即本批计划」 |
| 4 | P1 | `tools/scope-sweep/baseline.json` 的 I11 计数仍是旧值（7），实跑 4 | **改**：I11 去掉已删 / 已迁路径后跑 `node scripts/scope-sweep.mjs --freeze` 重冻结，再 `--check` 绿 |
| 5 | P1 | PRD D-11 决定「上游 PRD 加停用横幅」，但 0 命中；两份上游 PRD 仍指旧载体 | **改**：4 份上游 PRD 各加「载体已迁」横幅——3 份（dev-workflow-mainline / observable-criteria-rollout / card-data-contract-and-proof）并进原状态行（不新增行，防行号锚漂移）；`agent-card-contract.md` 落**文末附录 D**（S2 `I03 / I05` 要求零删除行、其 `:250/:251/:253/:271` 仍是活锚）。删除提交用 `git log --diff-filter=D -1 --format=%H -- <旧路径>` 取回（本批未提交，横幅写该命令而非硬编码 sha，D-11 已同批改写） |
| 6 | P1 | `docs/devworkflows/` 未纳入 docgen `paths.mjs` 的 ledger 禁写组 | **不改**：PRD `index.md:111` 已写不纳入理由——① 边界模板与 `renderBoundary.mjs` 已用字面句禁止写 `docs/devworkflows/**/gate-record.md`（agent 侧禁写已生效）；② 纳入会让定义层 19 项变 20 项，连动 15 席边界黄金哈希与 S6 计数断言全部重冻结，超出本批处置面 |
| 7 | P2 | `SKILL.md` 的 `description` 未写签字账落点 | **改**：description 加「签字账落 `docs/devworkflows/<任务目录>/gate-record.md`（模板在 `references/gate-record-template.md`）」 |
| 8 | P2 | `stage-4-quality.md:57` 仍写「impact-sheet 在 I11 scope 内」（错口径） | **改**：改写为「impact-sheet 的 mtime 不得早于任一被扫文件（`scope-sweep` 自动发现规则）；它自身不在 I11 scope 内」 |
| 9 | P2 | `keywords.json` 新登记了 `gate-record-template.md`，与 PRD「不登记新路径」相反 | **改**：删掉该登记，I11 scope 回到 8 个存量文件 |
| 10 | P2 | `docs/reports/2026-10-31-observable-s1-triage.md` 的 21→20 改动未进当次 impact-sheet | **改**：impact-sheet 追加该文件的处置（与 observables 分诊对账） |
| 11 | P2 | ① 行证据指 PRD 标题行（`:1`），不是 ① 出口的实质内容 | **改**：① 行证据改指 `docs/prd/20261105160504-devworkflow-signoff-dir/index.md:21`（技改口径与 ① 走法） |
| 12 | P2 | `tools/docgen/test/sc-card-shape.test.mjs` / `s2-card-rewrite.test.mjs` 仍留旧路径 | **不改**：两处是该批（S-C / S2）专属断言里的**白名单 / 豁免项**，绑定的是那一批 diff 的真实路径；改成新路径会让用例失去对象（且本批未改那两批的交付事实） |

## 复核命令与结果

- `node scripts/check-gate-record.mjs` → `tasks 1 rows 3 bad 0`。
- `node scripts/scope-sweep.mjs --check` → `sweep ok`（重冻结后）。
- `npm run check` → `# fail 0`；`tasks 1 rows 3 bad 0`；`check 全部通过`。

## 不改条目与理由

1. **#3 计划非独立文件**：本批 PRD §7 就是计划（任务批次 + 出口判据），另造一份 plan 文件只会形成第二份真相；R1 未要求计划必须是独立文件。
2. **#6 ledger 组**：见上表处置栏与 PRD `index.md:111`；`renderBoundary` 已把「不得写 `docs/devworkflows/**/gate-record.md`」写进全部 15 席边界（改模板同批重生成 3 张卡）。
3. **#12 两处历史测试**：它们是历史批次断言的白名单，不是活文档路径；改路径等于改写那一批的交付事实。

## ③ 段复审（处置后）

- `node scripts/check-gate-record.mjs` → `tasks 1 rows 5 bad 0`（账内落 ③④ 后）。
- `node scripts/scope-sweep.mjs --check` → `sweep ok`（I11 = 4）。
- `npm run check` → `# pass 1554 / # fail 0`、末行 `check 全部通过`。
- 结论：**③ 过**——9 条「改」逐条落地，无 P0/P1 遗留。遗留 P2：本文与 `impact-sheet.md` 有两处「四份都在首段」的旧表述，已同批改成「3 份并进状态行 + 1 份落文末」。
