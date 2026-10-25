# Session 交接：retro-skills → F-24（S6）送议会与施工（2026-10-25）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-25 11:11（Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `a7749b2`（用户已提交 ④ 行，**未推**：`master...origin/master [ahead 1]`）；工作树：3 处 M + 4 处 `??`（逐项见「现状」节） |
| 验证基线 | `gate` → `baseline 37/37`（exit 0）+ `npm run check` → `# tests 655` / `# pass 653` / `# fail 0` / `# skipped 2`、`0 findings`、`④ markdown 268 文件 / 1100 表`、`⑤ .session 结构通过`、`check 全部通过`（2026-10-25 11:11 实跑） |
| 继任自 | `docs/handoffs/2026-10-24-s5-producer-impl.md` |
| 状态 | 可直开工（议会 #3 未开；spec / testcase 已对齐 v7） |

## 项目定位

`d:\Seed\retro-skills` —— 以 rule / skill / agent 卡为载体的 AI 协作流程仓库；本阶段把「开发工作流五段主干」落成可执行的门，当前在做 **F-24 / S6：docgen 规则单一来源化**（权限/命令/禁写路径按作用分组，定义层持字符串、配置层只持组 ID、边界句由数据渲染）。

## 现状

- 已完成（逐项带出处）：
  - **S5 的 `producer` 档五段全签** —— `skills/dev-workflow/references/gate-record.md` 第 11–15 行：①（用户）/ ②（审计）/ ②→③（审计）/ ③（审计，`reviewer-audit` 角色卡按 path B 派座）/ ④（sdet，判者 `senior-sdet@…（path B·复核 r2）`）。
  - **F-24 已立项并过 §0** —— `docs/prd/20261024073606-dev-workflow-mainline/index.md`：§10 的 `F-24` 行、§12 的 `S6` 行与 F→S 覆盖表第 24 行、§0 用户栏「2026-10-25 二次重签」+ 签字记录段。
  - **spec v7 已定稿待审** —— `docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design.md`（**350 行**，卡在 PRD §4.1 的 ≤350 判据上）；§1 全貌 / §2 不做什么（6 条）/ §3.1–§3.7 设计（分层、12 槽、纯度判据、7 条不变量、closed-world 边界）/ §6 步骤 0–9 / §7 六错误码 / §8 V-1～V-13 / §9.1 rubric 8 维 / §9.2 四本账单与评分规则 / §11.9。
  - **testcase v7 已对齐** —— 同目录 `2026-10-25-docgen-policy-single-source-design-testcase.md`（**75 条**：正 27 / 负 26 / 边界 22 → 负+边界 48 ≥ 27；H/I/J/K 四组覆盖 V-1/V-2/V-11/V-12/V-13）。
  - **主 agent ↔ sdet 已做 6 轮双向复核** —— 累计 42 条反馈、7 条 P0，全部修在送议会前；记账在 spec §11.4–§11.9 与 testcase §7 / §10.1–§10.4。
  - **`.session/` 封闭清单已按用户裁定扩两档** —— `rules/docs-convention.md` 封闭清单表新增 `.session/temp/`（`tmp/` 遗留同义目录）与 `.session/myconversationwithai/`（用户自有对话归档草稿），并注明「不构成先例 / 不进 git、换机即丢」；`scripts/check-all.mjs` 的 `SESSION_ALLOWED` 同步（`:331`）。
- 验证证据：见元信息表『验证基线』（单源，勿重复）。
- 提交状态：**F-24 全部未提交**（3 M + 3 `??`），由用户自行 commit；`a7749b2` 已提交但未推送。
- 工作树异常（逐项）：
  - `M docs/prd/20261024073606-dev-workflow-mainline/index.md` —— F-24 行 / S6 行 / 覆盖表 / §0 二次重签
  - `M rules/docs-convention.md` —— `.session` 封闭清单加两档（用户 2026-10-25 裁定「改规则加白名单」）
  - `M scripts/check-all.mjs` —— `SESSION_ALLOWED` 同步加 `temp`、`myconversationwithai`
  - `?? docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design.md` —— spec v7（350 行）
  - `?? docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design-testcase.md` —— testcase v7（75 条）
  - `?? docs/after/20261025094353-docgen-policy-single-source-open-decisions.md` —— 设计决策档（开放式决策，含 v1 旧草案标注废弃）
  - `?? docs/handoffs/2026-10-25-s6-policy-parliament.md` —— 本交接词（写完即存在，未提交）

## 过程记录

- 议会 #2 账本：`.session/reviews/2026-10-24-184309-s5-tool-tiers-spec/`（**先读 `progress.md` 与 `problems.md` 尾部**；含 `round-check.md` / `delivery-audit.md` 的「第 8 轮（最终）」、`submission.md`、`plan-gate.md`）
- S5 ③④ 账本：`.session/reviews/2026-10-24-2215-s5-producer-impl/`（**先读 `progress.md` 尾部与备注节**；含 `rejudge-reviewer-audit-B3.md`、`rejudge-detective-observer-B3.md`、`audit-exit.md`、`quality-4.md`、`quality-4-audit.md`）
- F-24 设计决策档：`docs/after/20261025094353-docgen-policy-single-source-open-decisions.md`（**它不是结论**；结论性内容已并入 spec v7，冲突时以 spec 为准）
- 历史交接词：`docs/handoffs/2026-10-24-s5-tool-tier-spec.md` → `docs/handoffs/2026-10-24-s5-producer-impl.md` → 本份

## 本次任务

开**议会 #3** 审 F-24 的 spec + testcase（一件齐），返工后走计划门，再进 ③ 施工；流程：议会组队与送审 → 答辩与修复（≤3 评审轮）→ 审计终局表 → 计划门（`scripts/check-plan.mjs` 未落地，按 `references/stage-2b-plan-gate.md` 手工核对表）→ ③ 按 spec §6 步骤 0–9 施工 → ④ 质量（sdet 定性）→ ⑤ 交付（用户签）；起点：**议会 #3 组队与送审说明**。

## 范围依据

- 要读：
  - `docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design.md`：§1（第 9–19 行）、§2 不做什么（第 21–29 行）、§3.1–§3.7（第 31–130 行）、§5 文件布局（第 118–150 行附近）、§6 步骤 0–9（第 152–170 行）、§7 六码（第 172–185 行）、§8 V-1～V-13（第 186–200 行）、§9.1 rubric / §9.2 评估体系（第 202–242 行）、§11.3 差异清单与 §11.9（第 270–350 行）
  - `docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design-testcase.md`：文件头（第 1–10 行，独立性声明与版本）、§0.4 共用 helper、§1 覆盖总表、§3 汇总计数、§10.1–§10.4（残余与 spec 缺口，**含 2 条 P2 未决**）
  - `skills/parliament/SKILL.md`：第 11–18 行（执行路径 A/B/C 与「提交授权」）、总流程 0–7 节
  - `skills/parliament/references/assembly-matrix.md` 与 `references/submission-matrix.md`（点将与必带件）
  - `skills/parliament/references/doc-taxonomy.md`（本次文档类型 = 设计文档 + 测试用例）
  - `rules/dev-workflow-mainline.md`（R1–R7）、`rules/spec-testcase-gate.md`（spec/testcase 五条判据）
  - `skills/dev-workflow/references/gate-record.md` 第 11–15 行（前四段已签）
- 勿重做：S5 五段签字（`gate-record.md` 第 11–15 行）；PRD 的 F-24 / S6 / §0 重签（`index.md` §0 与 §10 / §12）；spec 与 testcase 的 6 轮对齐（已收敛，改动须走议会返工而非私下改）；`.session` 封闭清单两档（已按用户裁定落地并过 check）。

## 开放问题

1. **议会 #3 的送审授权**是否已成立？推断：**已成立**，依据是用户 2026-10-25 原话「好的，开议会吧」（本 session 末）；请用户：确认（若未授权则先按 `skills/parliament/SKILL.md` 第 18 行问一次）。
2. testcase §10.4 的 2 条 P2 是否作为议会开放项？（a）`--output` 与非本席产物名在模板里无槽，（b）V-1 段 ⑤ 与 V-12 边界重叠。推断：**作为开放项交议会裁决**，依据是 spec §11.9 已写「第 7 轮起不再私下往返，余下分歧由议会在开卷时裁决」；请用户：确认。
3. 是否把 S5 遗留的 4 条知情项随 S6 同批收（E01–E03 无 `S5-TC` 级用例 / 冲突→清理→重跑无单测 / B14 命名不可达状态 / `FORBIDDEN_PATHS` 与 spec §3.3③ 两份手抄）？推断：**本批不收，登记 `docs/after/` 接班**，依据是它们不在 F-24 范围（spec §2 只收边界句单源化）；请用户：确认。

## 既定约束（不要重新讨论、不要重新选型）

- **只做 F-24（S6）**：不收 `outputFormats` ↔ `round-check.md`、`sharedBlocks` ↔ `debate-protocol.md`，不动 `DEFAULT_BOUNDARY` / `evidence-reader` 边界句 —— 出处：spec §2 第 3–4 条。
- **不改权限语义**：谁挂哪档、能跑哪些命令、能写哪些文件一条不变 —— 出处：spec §2 第 1 条；判据 V-1（能力矩阵集合 diff）。
- **不以「文本一模一样」为验收**：字节/哈希只作定位线索 —— 出处：spec §2 第 2 条、V-2、§11.9（用户 2026-10-25「不是要一模一样，而是有的功能不能丢」）。
- **质量不降且至少一维更好**：A/B 盲评 8 维（P1–P4 / E1–E4），逐维 B ≥ A 且至少一维严格更好 —— 出处：spec V-13 + §9.1；用户原话「对比改前改后，哪个更精准、执行力更强」。
- **四本账单 + checklist + 评分复用既有机制**：`rubric.md` / `capability-diff.md` / `ab-score.md` / `checklist.md` 落 `docs/superpowers/reviews/<…>-s6-eval/`（进 git）；三态沿用 `tools/execution-matrix/criteria.md`、计分沿用 `skills/rule-inspector` 的 `score.mjs`、置信度沿用 `pattern-table.md`（N=3 → 本次只能 `mid`）—— 出处：spec §9.2。
- **派座走 path B**：通用子代理 + 角色卡逐字贴入（`reviewer-audit` / `senior-sdet` 都不是可用的 `subagent_type` 枚举值，实测被拒）—— 出处：`skills/parliament/SKILL.md:13`。
- **spec 每改一次必须回给 sdet 复核一轮**，双方确认过同一版才送审 —— 出处：spec §11.5 末段（用户 2026-10-25「主 agent 和 sdet 相互之间沟通」）。
- **不擅自 commit / push**：F-24 全部改动由用户提交；`a7749b2` 未推 —— 出处：用户全局规则与本 session 实际做法。
- **不手改 `agents/*.md`**：必须经 docgen 生成 + B3 重判 —— 出处：`skills/parliament/SKILL.md:15`。

## 遗留裁决与留观项

- S5 的 4 条知情项（见开放问题 3）—— 来源：`gate-record.md` 第 15 行「附 4 条 P2」+ `.session/reviews/2026-10-24-2215-s5-producer-impl/quality-4.md` 缺口清单；收敛时机：F-24 收官时决定是否并入 `docs/after/`。
- `.session/reviews/` 41 个目录未迁 `docs/superpowers/reviews/` —— 来源：`.session/README.md`「待办：`reviews/` 的归档迁移还没做」；收敛时机：用户 2026-10-24 裁定「reviews 不删」，暂缓。
- `.session/myconversationwithai/` 与 `.session/temp/` 不进 git（换机即丢）—— 来源：`rules/docs-convention.md` 封闭清单新增两行；收敛时机：用户要长期留存时迁 `docs/reports/`。

## 开工前先做

1. `git --no-optional-locks status --porcelain`：应恰为 3 处 M（PRD `index.md` / `rules/docs-convention.md` / `scripts/check-all.mjs`）+ 4 处 `??`（spec / testcase / after 决策档 / 本交接词；若用户已提交则相应减少）；有差异先查清再动手。
2. 复核基线：`node tools/docgen/cli.mjs gate` → `baseline 37/37`；`npm run check` → `655 / 653 / 0 fail`、`0 findings`、`check 全部通过`（应 = 元信息表数字）。
3. 读 `docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design.md` 的 §2、§3.4、§8、§9.2、§11.9；再读 testcase 的 §0.4 与 §10.4（2 条 P2 开放项）。
4. 读 `skills/parliament/SKILL.md` 第 0–2 节 + `references/assembly-matrix.md` + `references/submission-matrix.md`，按项目类型 × 文档类型点将并核覆盖矩阵零缺口；预期需 产品 / 测试 / 审计 / 精算师 / 安全 五席（安全因「权限面」入场）。
5. 建议会账本 `.session/reviews/<YYYY-MM-DD-HHMMSS>-s6-policy-parliament/`（`progress.md` + `problems.md` + `cards.md`，模板见 `skills/parliament/assets/`），并把送审说明填进 `assets/submission.md`（open 件 = spec + testcase 两件）。

## 开场话术

```text
读 docs/handoffs/2026-10-25-s6-policy-parliament.md，按交接词继续：开议会 #3 审 F-24（S6）的 spec + testcase，返工后过计划门再施工。注意：先核对 git status 应为 3 M + 3 ??，且 F-24 改动全部未提交（由用户 commit）。
```
