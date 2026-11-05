# 规则库改造 · 阶段 1 交付账（2026-11-05）

> 批次：`docs/prd/20261105182104-rule-refactor/prd/stage-1-rules-exit.md`（阶段 1：rules 全退）
> 授权：用户 2026-11-05（PRD 标已定稿、§4 写范围全授权、单批 `git rm` + 分两个 commit）
> 执行：门禁同批改（步骤 0）→ bak 23 份（步骤 1）→ `rules/` 清空（步骤 2）→ `aas sync` 清退运行时链接（步骤 3）

## 1 验收结果（V-* / T-*）

| 判据 | 判定动作（实跑） | 实得 |
|---|---|---|
| V-8 bak 完整 | `docs/bak/rules/` 计数 + 逐份核状态头 / 原文 / 承接对照表（`node -e` 脚本，21:03） | 23/23，逐份三件齐 |
| V-9 bak 原文零改动 | 清空前：bak 原文段 vs `rules/<file>` 逐字节；清空后再与 `git show HEAD:rules/<file>` 逐字节比对（HEAD = 清空提交的父提交） | 两次均 23/23 逐字相等（diff 行数 = 0） |
| V-1 rules 清空且门禁绿 | `Get-ChildItem rules\*.md` 计数；`node scripts/check-observable.mjs --check`；`node tools/docgen/cli.mjs gate`；`node scripts/check-all.mjs` | 计数 0；`check-observable ok` exit 0；`baseline 15/15` exit 0；`check 全部通过` exit 0 |
| V-18 运行时无断链 | `aas sync --rm-old`（清理残留 23）后：`user_rules` 条目数 + 逐条 `Test-Path Target` | 条目 0、断链 0 |
| T-1a 注入归零（账面） | `(Get-ChildItem rules\*.md \| ForEach-Object { (Get-Content $_.FullName -Raw).Length } \| Measure-Object -Sum).Sum * 0.5133` | 0 tok/轮（T-0 账面 47,236 字符 ≈ 24,246 tok） |
| T-1b 注入归零实测 | **未执行**：需新会话问固定探针 3 次、执行人 ≠ PRD 作者，记录落 `probe-record.md` | 待办（不得由本次施工自证） |

## 2 步骤 0 同批改动清单

- `scripts/check-observable.mjs`：删 `.md` 总数白名单（`REPO_MD_TOTALS` 与 `includes` 断言整条）；反空转收为四条（两次遍历数相等 / 两目录存在 / 总数非 0 / `skills ≥1`），`rules/` 允许为空；`RULE_DOC` 由「同名后缀」改为精确相对路径 `rules/observable-criteria.md`（避免 `skills/**` 同名 references 被静默剔出判定 1–4）。
- `scripts/check-observable.test.mjs`：`RULE_DOC` 改读 `docs/bak/rules/observable-criteria.md` 原文段；B01 的总数断言改为「与独立遍历同值 + ≥1」；E08 改为「现役行（排除已清空的 rules/）对账 + `exemptedLines = 豁免清单条数`」；F09 的 `38/38` 改为从 `baseline.json` 派生。
- `tools/docgen/components/baseline.mjs`：`BASELINE_RULES` 23 → 0；`tools/docgen/baseline.json` 重生成（15 条 = 仅 agents）。
- `tools/docgen/cli.mjs`：`GENERATED_RULE` 常量与生成/比对分支裁停（`rules/spec-testcase-gate.md` 已退役），不留悬空常量。
- 测试引用迁移：`migrate` / `dev-workflow-rule` / `dev-workflow-files` / `card-render` / `s3-predicates` / `dev-workflow-counts` / `review-fixes` / `sc-card-shape` / `tool-tiers` 按新落点改读（bak 原文段或 `tools/quality/`），并把写死条数改为派生。
- `tools/execution-matrix`：`shared-items.mjs` / `check-buckets.mjs` / `check-pattern-table.mjs` 三处 rule 载体改过渡指针（`docs/bak/rules/skill-authoring-convention.md`，阶段 3 收口）；`pattern-table.md` 的来源行同步改指 bak（行号 +1）。
- `rules/.inspector-annotations.json` → `tools/quality/.inspector-annotations.json`：3 个真读取点（`check-agent.mjs`、`score.mjs` 两入口）+ 6 处文案载体 + 15 份 fixtures（102 处 `basis`）同批改；正向（新路径 ≥1 命中）与负向（旧字面 0 命中）两条 grep 均满足。
- `tools/quality/observable-exempt.json`：删前 2 条（`rules/core-working-principles.md`），`stale = 0`。
- `rules/.gitkeep`：清空后 `rules/` 目录仍须存在（`check-observable` P-1 与 docgen gate 都 `readdirSync` 它；git 不跟踪空目录，删光后克隆即红）。文件名非 `.md`，不构成任何 rule 载体、不产生注入。

## 3 R8 回扫与 impact-sheet

- `node scripts/scope-sweep.mjs --check` exit 0、末行 `sweep ok`；34 口径命中数均未超基线。
- 逐处处置清单：`.session/reviews/2026-11-05-2107-rule-refactor-stage-1/impact-sheet.md`（333 处，按文件列处置；本批改动文件标注「保留原文，只迁路径 / 退役载体」）。

## 4 留观项复算（F22 / QA-1-09）

- `00-baseline/docs-convention-after.md` 第 5 行自述「实测共 153 行 / 6,666 字」；**实测** = 247 行（含末尾空行）/ 9,623 字符。
- `00-baseline/docs-convention-before.md` 自述「176 行 / 12,645 字」；**实测** = 177 行（含末尾空行）/ 12,645 字符，与自述一致（行数按「不含末尾换行」口径亦一致）。
- 处置：00-baseline 是冻结实验证据（历史记录不改），本次只在此记勘误，不改原文件；QA-1-09 随本条收口（数字以后以 `node -e` 复算为准）。

## 5 回滚

- 删除用单批 `git rm`（23 条在同一提交内），可 `git revert <本提交>` 回到 23 条 + 运行时链接需重跑 `aas sync` 回填。
- 更细的四步规程见 `stage-1-rules-exit.md` §7。

## 6 提交锚

| 用途 | 哈希 |
|---|---|
| PRD 与交接（用户提交） | `db63506`（`docs: 新增规则改造PRD及相关文档…`，2026-11-05 20:58） |
| PRD 状态标已定稿 | `6df2bb0` |
| **阶段 1 施工（本交付账所指「清空提交」）** | `fd7928c`（父提交 = `6df2bb0`，V-9 的 diff 基准取父提交的 `rules/<file>`） |

## 7 运行环境补充清理（2026-11-05，用户裁定）

- 对象：`~/.trae-cn/skills/skill-creator` —— 账本 `~/.aas/installed.json` 里唯一的第三方安装（`github.com/anthropics/skills` @ `dbd4588`，2026-10-18 装入），`aas sync` 按「账本优先，全类豁免」把它从六类里摘出，每次都以 `aas 安装` 名义留着。
- 事实核对：运行时是指向 `~/.aas/repos/github.com/anthropics/skills/skills/skill-creator` 的 Junction，链接可解析（健康）；本仓 `skills/`、`rules/` 对它零引用；Trae `builtin_skills/` 无同名内置件。
- 处置（用户 2026-11-05 选「移除并销账」）：`aas remove skill-creator --purge --yes` → 摘运行时条目、销账（`entries: []`）、清缓存仓库；随后删除 purge 留下的空目录 `~/.aas/repos/github.com/anthropics`。
- 复验：`aas doctor` 的技能段为「已就位 19 ｜ 需建链接 0 ｜ 需替换 0 ｜ 待迁移旧名 0 ｜ 自家残留 0 ｜ 孤儿(不动) 22」，**`aas 安装` 行消失**；`~/.trae-cn/skills/skill-creator` 与缓存仓库均 `Test-Path` 为 False。
- 未动：`~/.aas/repos/local-aas-e2e2-8d3bfa00`（aas 自带 e2e 测试留下的本地缓存，2 个条目），与本条无关，未删。


