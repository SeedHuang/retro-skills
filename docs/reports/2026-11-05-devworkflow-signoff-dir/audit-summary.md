# 审计摘要：出口签字账迁 `docs/devworkflows/`（devworkflow-signoff-dir）

> 批次提交：`6062189`（2026-11-05 18:05:11）｜PRD：`docs/prd/20261105160504-devworkflow-signoff-dir/index.md`｜任务账：`docs/devworkflows/20261105144045-devworkflow-signoff-dir/gate-record.md`
> 类型：技术改造（功能点 ID 集合 diff 为空）→ 按用户裁定 U-7 免议会；免议会不免签字，审计与 sdet 分别留痕。
> 审计结论：**施工完整、判据可复算、无 P0/P1 遗留**；⑤ 交付行待用户签，本批尚未收口（见 §6）。

## §1 改了什么（一句话）

签字账从「技能包单文件」`skills/dev-workflow/references/gate-record.md`（350,094 字节 / 148 行）迁成「按任务分目录」`docs/devworkflows/<YYYYMMDDHHmmss>-<任务名>/gate-record.md`（首个实例 2,753 字节 / 13 行）；旧账整份删除、不迁移；校验器改为扫目录 + fail-closed 解析，并接门禁第 ⑧ 段。

## §2 变更规模（按面）

| 面 | 文件数 | 代表文件 |
|---|---|---|
| `scripts/` | 6 | `check-gate-record.mjs`（主改）、`check-all.mjs`（接 ⑧ 段）、`doc-name.mjs`（`STAMP_DIRS` 加 `docs/devworkflows`） |
| `skills/` | 9 | 删 `references/gate-record.md`；新增 `references/gate-record-template.md`（格式唯一源）；6 份段文档改指向 |
| `rules/` | 2 | `dev-workflow-mainline.md`（R1/R2/R3/R6/R9 口径）、`docs-convention.md`（`docs/devworkflows` 定位） |
| `agents/` | 3 | `senior-sdet` / `reviewer-audit` / `detective-observer`：禁止写入路径换新载体 |
| `tools/` | 12 | `renderBoundary.mjs`（模板字面量白名单）、`scope-sweep/{baseline,keywords}.json`、4 份测试与夹具 |
| `docs/` | 11 | 新 PRD、新任务账、两份审查报告、上游 PRD 的「载体已迁」横幅 |

合计 43 文件 / +1165 / −312。

## §3 判据变更（R1 / R2 / R3 / R6 / R9）

| 判据 | 新口径（可机械判） |
|---|---|
| R1 | 「核了什么」须有可复算锚点：`path:line`、`#L数字`、反引号内**路径**（含扩展名）或**命令**（首词属 `npm/node/npx/pnpm/yarn/git/...` 白名单）；`` `已核对` ``、`` `check 全部通过` `` 不算锚点 |
| R2 | 申报人 ∩ 签字人 = ∅（按 `、+＋，,／/（）()空白` 拆词；通用限定语 `主/agent/代拟/主持/转录/转述` 不参与交集）；签字人须属段表「谁签」列（①/⑤ 用户、②/②→③/③ 审计、④ sdet）；**旁路只认 `结论`列**，旁路的 ①② 行签字人 = 审计 |
| R3 | 有数据行必须有 `①`；出现 `②→③` 及之后的行时 `①`、`②` 逐行判结论非空；计划门行签字人须含「审计」（段值可带 `@批次`，**逐行判**） |
| R6 | 「拆 spec 中」的数据行 ≤ 1，只数 `出口判据` 与 `结论` 两列（证据列引用不计） |
| R9 | `skills/**/references/**/*.md`（任意深度）不得出现签字表头或六列数据行；模板与首格 `[[...]]` 占位行豁免；未闭合围栏判红 |
| 上限 | 单份 ≤ 40 KB；整行 ≤ 800、出口判据 ≤ 300、核了什么 ≤ 250、结论 ≤ 120（唯一实现 = `scripts/check-gate-record.mjs` 的 `LIMITS`） |

解析 fail-closed：围栏掩码（示例表不计 / 未闭合判红）、表被截断后的六列孤行判红、占位行只按首格判、`tasks 0` 与缺 `gate-record.md` 均判红、`docs/devworkflows` 非目录给结构化 reason。

## §4 验证（全部为实测输出，可复算）

| 命令 | 实测 |
|---|---|
| `node scripts/check-gate-record.mjs` | `tasks 1 rows 7 bad 0` / `gate-record ok` |
| `node --test scripts/check-gate-record.test.mjs` | `# pass 36 / # fail 0` |
| `node scripts/scope-sweep.mjs --check` | `sweep ok（命中未超基线、清单齐、scope 齐）`，I11 = 4 |
| `npm run check` | `# tests 1566 / # pass 1559 / # fail 0 / # skipped 7`；`[observable] 扫描 107 个 .md / 未命中 0 行 / stale 0`；`tasks 1 rows 7 bad 0`；末行 `check 全部通过` |

## §5 审查处置汇总（三轮）

| 轮次 | 条目 | 处置 | 落点 |
|---|---|---|---|
| sdet 风险审查 | 15（P0 3 / P1 6 / P2 6） | 改 14 / 不改 1（`@批次` 后缀保持「不含空格」） | `sdet-risk-review.md` |
| 审计风险审查 | 12（P0 2 / P1 4 / P2 6） | 改 9 / 不改 3（`②→③` 以 PRD §7 代 plan、ledger 组不纳入、两处历史测试留旧路径） | `audit-risk-review.md` |
| 代码审查（通用） | 7 | 全改：R3 逐行判、R9 未闭合围栏、命令锚点白名单、旁路只认结论列、`checkDir` 非目录、限定语不参与交集、段号守卫 `=== 8`；补 P73–P77 五条负例 | 任务账 `③@审查修复` / `④@审查修复`；改判登记见 `.session/reviews/2026-11-05-1700-devworkflow-signoff-dir/impact-sheet.md` |

## §6 残余风险与未决项

| # | 项 | 说明 | 建议 |
|---|---|---|---|
| 1 | ⑤ 交付行未签 | R2 不许自签，须用户签；本批自 ⑤ 起才算收口 | 用户验收后补 `⑤` 行，再跑 `check-gate-record` |
| 2 | `tasks 0` 判红对新项目的影响 | 首次采用本技能的项目若尚无任何任务目录，门禁 ⑧ 段会红（fail-closed 的已知代价，PRD 未写例外） | 首个任务进 ① 段时建目录即自然消解；如认为不该红，需另立 PRD 加「零任务放行」例外 |
| 3 | 两处历史测试仍引用旧路径 | `tools/docgen/test/s2-card-rewrite.test.mjs:1041`、`sc-card-shape.test.mjs:1001` —— 它们是**旧提交 blob 比对基线**，改名会让基线失效 | 保留；新仓另起时按新载体重写这两处基线 |
| 4 | 上游 PRD 只加横幅、不改正文 | 4 份上游 PRD 用「3 份并进原状态行 + 1 份落文末附录 D」，避免第三方用例的行号锚漂移 | 历史签字件，维持不改 |
| 5 | 旧账取回锚点 | 旧账已整份删除，正文只在 `HEAD~1`（提交 `6062189` 之前）可取：`git show HEAD~1:skills/dev-workflow/references/gate-record.md` | 需要查历史门行时用该命令，不在工作区恢复旧文件 |

## §7 回滚

本批是单个提交 `6062189`：

| 动作 | 命令 |
|---|---|
| 整体回退 | `git revert 6062189` |
| 只取回旧账正文 | `git show HEAD~1:skills/dev-workflow/references/gate-record.md` |
| 回退后必须重跑 | `npm run check`（`check-gate-record` 与 `scope-sweep` 均会因载体回退而红/绿变化） |
