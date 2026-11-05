# Session 交接：retro-skills 规则库改造 → 阶段 1 施工（2026-11-05）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-11-05 20:40（Asia/Shanghai，`node skills/review-log/scripts/time.mjs` 实跑 20:40:35） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `e299855c39e73bfbf065b6e4463e7c57d2627c5a`（2026-11-05 18:10:52）；工作树：`M rules/docs-convention.md` + `?? docs/prd/20261105182104-rule-refactor/`（PRD 整目录未跟踪） |
| 验证基线 | `npm run doc:name` exit 0「命名检查通过（docs）」+ `npm run check:observable` exit 0「check-observable ok」+ `node scripts/scope-sweep.mjs --check` exit 0「sweep ok」+ rules 23 份 / 47,236 字符 / ≈24,246 tok（20:40 实跑） |
| 继任自 | 无（本任务首份交接） |
| 状态 | 可直开工（PRD 评审已闭环；3 项待用户确认见「开放问题」，均不阻断步骤 0 的前置读取） |

## 项目定位

`d:\Seed\retro-skills` —— 规则（`rules/`）与技能（`skills/`）载体仓；本次任务是把 23 条常驻规则一次性退役、改由 1 条触发声明 + 按需 skill 承载（PRD：`docs/prd/20261105182104-rule-refactor/prd/index.md`）。

## 现状

- 已完成：PRD（index + 4 个 stage）经议会 **4 轮评审 + 1 轮审计复跑**，`delivery-audit` 判 **通过**、`round-check` 判 **过**；P0/P1 全部落点闭合，P2 条件 M1–M5 逐条收口（记录见账本 `problems.md` 的「第 5 节 · P2 条件项收口」）。**尚未开始任何施工**（`rules/` 仍是 23 份，见元信息表验证基线）。
- 验证证据：见元信息表『验证基线』（单源，不重复）。
- 提交状态：全部未提交，由用户自行 commit 或明确授权后由 agent commit（工作树见元信息表 HEAD 行）。
- 工作树异常：无（仅上列 1 改 1 未跟踪；`.session/` 在 `.gitignore` 内，其新增属记账）。

## 过程记录

- `d:\Seed\retro-skills\.session\reviews\2026-11-05-182634-rule-refactor-prd\progress.md`（**先读尾部**：4 轮轮次账 + 最终结论 + 勘误）
- 同目录 `problems.md`（族级台账，含 §十 修订记录 / 第 2–4 轮 / 第 5 节 P2 收口）
- 同目录 `cards.md`（卡面：第 1 轮 72 + 第 2 轮 18 + 第 3 轮 1 + 第 4 轮 3）
- 同目录 `round-check.md` / `delivery-audit.md`（审计两表，末轮「过 / 通过」）
- 同目录 `detective.md`（侦探观察，编号断号已在 progress.md 勘误节登记）
- 历史交接词：无

## 本次任务

按 PRD 阶段 1 执行「23 条规则退出 + 门禁同批改」；流程：门禁同批改（步骤 0）→ 建 bak 23 份（步骤 1）→ 清空 `rules/`（步骤 2）→ `aas sync` 清退运行时链接（步骤 3）；起点：**步骤 0**。

## 范围依据

- 要读：`docs/prd/20261105182104-rule-refactor/prd/stage-1-rules-exit.md` 的 §1（第 8–20 行，步骤 0–3 全清单）、§2（第 22–28 行 bak 规格）、§3（第 33–60 行 23 条处置表与账目校验）、§4（第 62–70 行写范围与回滚闸）、§5（第 72–81 行 V-8/V-9/V-1/V-18/T-1a/T-1b）、§7（第 113–120 行回滚规程）
- 要读：`docs/prd/20261105182104-rule-refactor/prd/index.md` 的 §1（体积账与 47,236 注记）、§4（rule 写作四类）、§7（取数命令，第 119–141 行）
- 要读：`docs/prd/20261105182104-rule-refactor/prd/stage-3-skill-overhaul.md` 的 §2（第 17–28 行 12 条承接位；**阶段 1 只建 bak，不搬内容**）
- 勿重做：PRD 全文修订与议会评审（已闭环，见 `delivery-audit.md` 结论区）；`rules/docs-convention.md` 的两处删除（删 `docs/superpowers/sdd` 留档句、删「空壳：1 个文件」断言）已落地，**不要再改**。

## 开放问题

1. PRD 状态是否现在标「已定稿」？推断：**可以标**——依据 `delivery-audit.md` 末轮判「通过」、`round-check.md` 判「过」，且 `index.md` 第 3 行现仍写「待评审（未定稿）」；请用户：确认标定稿 / 保持待评审。
2. 阶段 1 的写操作由谁执行？推断：**可直接执行**——依据用户 2026-11-05 裁定「改门禁：清空 `rules/`」（记录在 `stage-1` §4 第 64 行）；请用户：确认授权范围（`docs/bak/rules/`、`rules/`、`scripts/check-observable.mjs`、`scripts/check-observable.test.mjs`、`tools/docgen/**`、`tools/execution-matrix/**`、`tools/quality/observable-exempt.json`、`tools/quality/`）。
3. PRD 目录（未跟踪）与本次施工是否同批 commit？推断：**分成两个 commit**（PRD 一份、阶段 1 施工一份），依据 `stage-1` §4 的回滚闸要求「删除用单批 `git rm`，提交哈希写进交付账」；请用户：确认或指定合并方式。

## 既定约束（不要重新讨论、不要重新选型）

- 阶段 1 终态 = **清空 `rules/`**（0 份），不是「保留 1 条占位」 —— 用户 2026-11-05 裁定，记录在 `stage-1` §4。
- **删掉** `check-observable.mjs` 的总数白名单（`REPO_MD_TOTALS` 与第 329 行 `includes` 断言的**整条**），只留反空转四条（第 321/324/325 行 + `nSkills ≥ 1`） —— `stage-1` §1.0 第 11 行。
- bak 落 `docs/bak/rules/`，**原文逐字不改**；「原文段」= 状态头之后、`## 承接对照表` 之前的正文块 —— `stage-1` §2 与 §5 V-9。
- 运行时链接必须清退：清空后跑 `aas sync`，核 `user_rules` 指向已删文件的条目数 = 0（V-18） —— `stage-1` §1 第 3 步、§5。
- 触发声明成品文案实测 **387 非空白字符**，不得再扩（≤500 闸）；改文案须同时更新 `index` §1 与 `stage-2` §2 标题 —— `index` §1 / `stage-2` §2。
- 不新增「第二个归档位」：留档归 superpowers 自己的 `.superpowers/sdd/`，`docs/` 不另存 —— `rules/docs-convention.md` 第 110 行（已删 sdd 归档句）。
- 不动 `00-baseline/`（冻结实验证据）、不动 `stage-4`（本轮不涉及） —— `index` §6 与 `submission.md` §3。

## 遗留裁决与留观项

- F22「00-baseline 自述数字失真」（`docs-convention-after.md` 第 5 行「153 行 / 6,666 字」实测 246 行 / 9,623 字符） —— 来源 `problems.md` 候选表；收敛时机：**阶段 1 建 bak 时同批复算**。
- QA-1-09（P2 卡，随 F22 待复算） —— 来源 `problems.md` §十 P2 三态归属；收敛时机：同上。
- 侦探编号断号（第 3 轮缺 O-29、第 4 轮缺 O-50，且自述条数与编号行数不符） —— 来源 `progress.md` 勘误节；**原文不得改**，以勘误为准。
- `stage-3 §2` 第 15 行的「不搬两句」提示是给阶段 3 的，阶段 1 只建 bak，不搬任何内容 —— 来源 `stage-3` §2 第 26 行。

## 开工前先做

1. `git status --porcelain`（确认仍只有 `M rules/docs-convention.md` + `?? docs/prd/...`）并复跑三条门禁：`npm run doc:name`、`npm run check:observable`、`node scripts/scope-sweep.mjs --check`（应全 exit 0，与元信息表一致）。
2. 读 `docs/prd/20261105182104-rule-refactor/prd/stage-1-rules-exit.md` §1 第 8–20 行，逐条核对步骤 0 的 5 类改动清单（check-observable + 其 test、docgen baseline/cli/测试、execution-matrix、annotations 迁移与验收、豁免清单）。
3. 读同文件 §5 第 72–81 行，把 V-8/V-9/V-1/V-18/T-1a/T-1b 六条判定动作抄成一张验收清单（开工前先有判据，后动手）。
4. 用 `node -e` 或 `Get-ChildItem` 复核 `rules/` 现有 23 份与 47,236 字符，作为 bak 前的基线；同时记下 `docs/bak/rules/` 尚未存在。
5. 读完 `stage-1` §4 第 62–70 行的写范围与回滚闸，确认本次写操作均在已授权清单内；超出部分先停下来问用户。

## 开场话术

读 `docs/handoffs/2026-11-05-rule-refactor-stage-1.md`，按交接词继续：执行 rule 改造 PRD 阶段 1（门禁同批改 → bak 23 份 → 清空 rules → aas sync）。
