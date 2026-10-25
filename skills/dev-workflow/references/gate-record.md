# 出口核对记录表（R1–R7 的唯一证据载体）

本表是 `rules/dev-workflow-mainline.md` R1–R7 的唯一证据载体。规则正文不自存任何名单或状态标记，段名与签字人一律以 PRD §4 段表为准。

**怎么填**：每段收口时，由该段申报人加一行。六列缺一列、或「核了什么」为空 / 只写「已核」，该段视为未收口，不得进入下一段（R1）。

**为什么不自存名单**：段与签字人只写在这里会与 PRD §4 两处维护，必漂。本表只记录「这一次核了什么、谁签的」，不复制判据。

| 段 | 出口判据（逐条） | 核了什么（命令输出首行 或 path:line） | 申报人 | 签字人 | 结论 |
|---|---|---|---|---|---|
| ① | §0 四栏齐 + 依据可核；功能点清单与流程图双向一一对应 | `docs/prd/20261024073606-dev-workflow-mainline/index.md#L22-L31`（§0 四栏签署）；议会账 `.session/reviews/2026-10-24-163717-dev-workflow-mainline-prd/`（4 轮 + 2 次补充复核，P0/P1 = 0） | 产品经理（代拟：主 agent） | 用户 | **有条件通过（2026-10-24）**：P2 挂 `docs/after/20261024174253-dev-workflow-mainline-open-items.md` |
| ② | spec + testcase 一件齐；差异清单留痕；内部对齐零未决 | 议会 #2 放行：审计第 8 轮 `PASS`（P0 0 / P1 0 / P2 3）+ 测试第 7 轮 `PASS`（P0 0），两表见 `.session/reviews/2026-10-24-184309-s5-tool-tiers-spec/round-check.md` 与 `delivery-audit.md` 的「第 8 轮（最终）」节；计数：spec **1 份**（`docs/superpowers/specs/2026-10-25-s5-tool-tiers-design.md`，SHA256 `974B477A…BDACD669`）+ testcase **51 条**（22 正 / 16 负 / 13 边界，`C6E8F23B…CE61B242`）；差异清单：`docs/superpowers/specs/2026-10-25-s5-tool-tiers-design.md#L293-L307`（§11.3 D1–D11）；内部未决：`#L280-L283`（Q1–Q4 全有裁定） | 主 agent、sdet | 审计 | **过（2026-10-24）**：只做 `producer`（`research` → S5-R、检测脚本 / CLI B3 门 / 账本模板 → S5-B，见 `#L282-L283`）；候选 6 条见账本 `problems.md` 第 6/7/8 轮「候选」，触发信号已写明 |
| ②→③ | 功能点全覆盖 / 依赖无环 / 功能块↔testcase 一一映射 | 脚本未落地：`scripts/check-plan.mjs` 全仓 0 命中（`docs/prd/20261024073606-dev-workflow-mainline/index.md:688` S4 未开工），按 `index.md:724` + `references/stage-2b-plan-gate.md:32` 走审计手工核对表。① 覆盖：`grep -c 'F-[0-9][0-9]' docs/superpowers/plans/2026-10-25-s5-tool-tiers.md` → 14 行全部 F-16（PRD `index.md:640` = F-16 行、`:712` 派 S5），`research` 去向在位（plan `#L150` → spec `#L282`），缺口 0；② 依赖：节点 `grep -c '^### T[0-9]' <plan>` → 11，边集取自 plan `#L24-L34` 与 `#L154`，拓扑序 T1→T2→T3→T4→T5→T6→T7→T8→T9→T10→T11 可完成、回边 0；③ 映射：`grep -cE '^[|] S5-TC-[A-E][0-9]{2} [|].*[|] P[012] [|]$' docs/superpowers/specs/2026-10-25-s5-tool-tiers-design-testcase.md` → **51**（宽松口径 80，多出 29 = §3 复列的 16 负 + 13 边界），与 plan `#L137-L150` 各任务并集 10+9+8+1+1+0+6+7+1+1+7 = 51 对称差 0。复签：2 条 P1 + 8 条 P2 + 1 条加强项全部闭合（复核明细见 `.session/reviews/2026-10-24-184309-s5-tool-tiers-spec/plan-gate.md`），附注 4 条 P2 已同批修正 | 主 agent、sdet | 审计 | **过（2026-10-24）**：P0/P1 = 0；附注 4 条 P2（cmd `set` 引号 / spec §6 步号锚点 +1 / grep 方言 / §2 图补 T11）已在签后同批修正 |
| ③ | 施工完成、`npm run check` 绿 | 按 `parliament` 技能 `SKILL.md:13` 的 B 路径派座（`agents/reviewer-audit.md` 角色卡逐字贴入通用子代理，实例未参与施工）：`node tools/docgen/cli.mjs gate` → 首行 `baseline 37/37`（exit 0）；`npm run check` → `# tests 655` / `# pass 653` / `# fail 0` / `# skipped 2`、`0 findings`、末行 `check 全部通过`（exit 0，含 `④ markdown 检查通过（265 个文件 / 1064 张表）`）；`node --test tools/docgen/test/tool-tiers.test.mjs` → `# tests 47` / `# pass 47` / `# fail 0`；V-6 零改动以 commit 为锚（工作树已 clean）：`git --no-optional-locks show --stat f58a168` → 仅两卡有差异（`agents/detective-observer.md` 14 行、`agents/reviewer-audit.md` 14 行），其余 13 席零改动；落点抽查 7 处全真：`tools/docgen/components/patternRegistry.mjs:49/52-56/73-75`、`tools/docgen/components/agentData.mjs:265`、`tools/docgen/test/pilot-data.test.mjs:12,45` / `tools/docgen/test/pilot-render.test.mjs:87` / `tools/docgen/test/validate.test.mjs:30` / `tools/docgen/test/review-fixes.test.mjs:56`、`parliament` 技能 `references/debate-protocol.md:17` / `assets/round-check.md:21`、`references/stage-4-quality.md:28`、`docs/after/20261024174253-dev-workflow-mainline-open-items.md:18-20`（B-1a→S5-R / B-1b→S2 / B-1c→S5-B）；证据可复算：交接基线 608（`docs/handoffs/2026-10-24-s5-producer-impl.md:10`）+ 新增 47 = 655 = `# tests`；R1 本表 `:11-13` 三行各 6 列、结论均非空，② 行所引议会两表在 `.session/reviews/2026-10-24-184309-s5-tool-tiers-spec/` 实测在位 | 开发（主 agent） | 审计 | **过（2026-10-24）**：判者标识 `reviewer-audit@agents/reviewer-audit.md（path B 角色卡贴入）2026-10-24`（转录人：主 agent；四字段原文见 `.session/reviews/2026-10-24-2215-s5-producer-impl/audit-exit.md`）；**附 4 条 P2**：① 本行「12 席」计数错（15 − 2 = 13）已改；② `git status` 证据已改锚 commit `f58a168`；③ plan `:3` 状态行已由「待计划门（未定稿）」改为已过计划门 + 已施工；④ `docs/prd/.../index.md` 的 `command` 档 / S5 进度描述已按用户 2026-10-24 指令**按事实更正**（`:571` 四档现状、`:689` S5 状态、`:725` 两席 `producer` 档），未改功能点集合 → 不触发 R5 |
| ④ | testcase 全部条目已执行且逐条有结论；负例与边界条数 ≥ 正例条数 | sdet 逐条结论表 `.session/reviews/2026-10-24-2215-s5-producer-impl/quality-4.md`（51 条逐条有结论：47 条 `ok` + C07 由 `npm run check` 实跑 + E01–E03 由四个旧文件 29 条兜）；审计核对两轮 `.session/reviews/2026-10-24-2215-s5-producer-impl/quality-4-audit.md`（首轮打回、复核轮过）：`node --test tools/docgen/test/tool-tiers.test.mjs` → `# tests 47 / # pass 47 / # fail 0`；`node --test` 四个旧文件 → `# tests 29 / # pass 29 / # fail 0`；`npm run check` → `# pass 653 / # fail 0`、`baseline 37/37`、`0 findings`、`check 全部通过`；计数现算 `51（正 22 / 负 16 / 边界 13）` → 负+边界 29 ≥ 正 22；抽查 3 条落点 `tools/docgen/components/patternRegistry.mjs:49`（A01 `ok 1`）、`:30-33`（B08 `ok 18`）、`:65-69`（A09 `ok 9`）；反向验证（临时副本注入五元组）→ `Mismatch` exit 1；缺口 2 更正核验 `tools/docgen/test/drafts.test.mjs:12-22` → `ok 1 … DraftNameConflict（exit 1）` | 开发（主 agent） | sdet | **过（2026-10-24）**：判者标识 `senior-sdet@agents/senior-sdet.md（path B·复核 r2）2026-10-24`；4 条知情项（缺口 1 E01–E03 无 `S5-TC` 级用例 / 缺口 2 冲突→清理→重跑的闭环无单测 / 缺口 3 B14 命名不可达状态 / 缺口 4 `FORBIDDEN_PATHS` 与 spec §3.3③ 两份手抄）已逐条写明漏检类型与人工兜底；首轮缺口 2 表述失真（把已有覆盖写成「无任何用例」）已按审计打回更正并复核通过 |

## 各列口径

- **段**：写 PRD §4 段表第一列的原样标记（`①` / `②` / `②→③` / `③` / `④` / `⑤`）；同一段有多个任务时写 `段@任务`（`@` 前必须是原样标记，任务 = PRD / plan 路径 +#sha 前 8）。
- **出口判据（逐条）**：逐条抄该段出口判据，一条一行或分号分隔；不得只写「见段文档」。
- **核了什么（命令输出首行 或 path:line）**：必须是可复算的证据。命令输出只贴首行（含结论的那一行）；文件证据写 `path:line`。不得写「已核」「看过了」。
- **申报人**：该段产物作者（定义见 R2）。
- **签字人**：PRD §4 段表该行「谁签」列的角色；**不得与申报人有交集**（R2；交集 = 自签）。议会列非空的段，签字前必须先有该次议会通过记录（R1）；旁路时（PRD §4.2）① / ② 行签字人 = **审计（单一签字）**，以审计的集合 diff 结论代替议会记录，并在「核了什么」写明「旁路 + 集合 diff 为空 + 无新增交付物」。
- **结论**：`过` / `不过 + 打回清单`；留空 = 未收口。

## 与各条判据的对应

- R1 出口齐才开工 → 本表该段行六列齐且证据列有效。
- R2 不得自签 → 「签字人集合 ∩ 申报人集合 = ∅」（集合按 `、 + ＋ ， , /` 拆词），且签字人属于段表「谁签」列。
- R3 议会只两插点 → 段表「议会」列非空的段恰 2 个（①、②），这两行必须各有行且「结论」非空；计划门行「签字人」含审计。
- R4 plan 新增设计决策 → 不回本表，直接判 plan 文件的节（有 `## 新增设计决策` 即违规）。
- R5 功能点集合被改 → 回 PRD §0 重签，本表 ① 行随之失效，需重填。
- R6 功能块滚动拆 → 同一时刻处于拆分中的功能块 ≤ 1（在 plan 侧计数）。
- R7 长文结论必须取证 → 引用长文的结论在「核了什么」列写 `path:line`，并可追到 `evidence-reader` 的取证产出。
