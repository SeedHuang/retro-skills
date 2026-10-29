# Session 交接：retro-skills → agent-card S1（定义层）spec + testcase 送议会 #2（2026-10-29）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-29 14:11（Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `88c4b0c`（`docs: S6 V-13 A/B盲评不在本期，转独立课题并更新验收口径`）；工作树：**clean**（`git status --porcelain` 空）；`master` 与 `origin/master` 同步 |
| 验证基线 | `npm run check` → `# tests 1039 / # pass 1037 / # fail 0 / # skipped 2`、`baseline 37/37`、`0 findings`、`④ markdown 检查通过（307 个文件 / 1333 张表）`、末行 `check 全部通过`（exit 0）；`node scripts/check-gate-record.mjs` → `rows 27 bad 0`；`node scripts/scope-sweep.mjs --check` → `sweep ok`；`node scripts/doc-name.mjs --check docs` → `命名检查通过（docs）`（**14:11 实跑**） |
| 继任自 | `docs/handoffs/2026-10-28-s4-plan-gate.md` |
| 状态 | 可直开工（**1 个开工第一问**，见「开放问题」第 1 条） |

## 项目定位

`d:\Seed\retro-skills` —— AI 协作工作流的规则 / 技能 / 机械判据仓库（五段主干：PRD → spec+testcase → 计划门 → 实现 → 质量 → 交付；`npm run check` 是唯一总门禁）。

## 现状

- **已完成（本窗口）**：
  - **S5 的 ⑤**（工具档位交付门）补齐并签：`skills/dev-workflow/references/gate-record.md:35`；交付审计 `.session/reviews/2026-10-29-0845-s5-delivery/delivery-5-s5.md`（13 件全过，4 条条件闭合）。
  - **S6 的 ④⑤** 补齐并签：`gate-record.md:17`（`④@S6`，70/78 通过 + K 组 8 条转课题）、`:18`（`⑤@S6`，用户 2026-10-29 签「过」）。
  - **验收口径变更**：F-24 的验收由 `V-1～V-13` → **`V-1～V-12`**；`V-13`（A/B 盲评）与 8 条 K 组用例**不在本期**。四处载体同批改齐（spec §1 摘要 / `:25` / §8 `V-13` 行 + 表后注 / §9；testcase K 组状态注 + 8 处标题），PRD `docs/prd/20261024073606-dev-workflow-mainline/index.md:724` 加分期说明；课题落 `docs/after/20261029100942-s6-v13-ab-eval-rebuild-open-decisions.md`。
  - **`scripts/check-all.mjs:87` 加 `--test-reporter=tap`**：本机 Node 已升 **v24.22.2**，`node --test` 默认报告器由 `tap` 改 `spec`，而该脚本 ② 段只认 TAP → 原在 Node ≥24 上 `npm run check` 恒红（`package.json` 的 `engines` 声明 `>=22`，故属实现缺陷）。改后全绿（详见 `.session/reviews/2026-10-29-0900-s6-quality/impact-sheet.md` 的「非判据级基础设施修复」节）。
  - S4 五段（`②@S4` / `②→③@S4` / `③@S4` / `④@S4` / `⑤@S4`）已于 2026-10-28 全部签完（`gate-record.md:30-34`）。
- **验证证据**：见元信息表『验证基线』（单源，此处不重复）。
- **提交状态**：已 commit（hash 见元信息表『HEAD』）；已推送，`master` 与远端同步。
- **工作树异常**：无（`git status --porcelain` 空，14:11 实测）。

## 过程记录

- `.session/reviews/2026-10-29-0900-s6-quality/quality-4-s6-audit.md`（**先读 §6 结论 + §3 四处「打回 ②」复核**：审计改判 sdet 的「有条件通过」为「不通过」，并给出 8 条红的归因）
- 同目录 `quality-4-s6.md`（sdet 78 条逐条结论：通过 70 / 不通过 8）、`rebuild-log.md`（双轨返工 8 处）、`impact-sheet.md`（当次改判清单 + 基础设施修复登记）
- `.session/reviews/2026-10-29-1030-s6-delivery/delivery-5-s6.md`（⑤ 交付审计，4 条条件 C1 / C1' / C2 / C3 / C4 已全部闭合）
- `.session/reviews/2026-10-29-0845-s5-delivery/delivery-5-s5.md`（S5 ⑤ 交付审计）
- 历史交接词链：`docs/handoffs/2026-10-28-s3-close.md` → `docs/handoffs/2026-10-28-s4-plan-gate.md` → **本文件**

## 本次任务

开 **agent-card PRD 的 S1（定义层，`F-01`～`F-08`）② 段**：写 spec + 由独立子代理写配套 testcase，两件作为**一件交付物**送**议会 #2**；流程：**② spec+testcase → ②→③ 计划门 → ③ 施工 → ④ 质量 → ⑤ 交付**；起点：**②**（议会 #2 组队与送审）。

spec 落盘约定：`docs/superpowers/specs/2026-10-29-agent-card-s1-card-model-design.md` + 同名 `-testcase.md`（同批、同一目录）。

## 范围依据

- **要读**：
  - `docs/prd/20261026205821-agent-card-contract.md`：§3.8 定义层封闭枚举与字段形状（`:243-284`）、§6 功能点清单 F-01～F-08（`:463-472`）、§8 交付拆分四份 + 执行顺序（`:512-523`）、§4.1 产物 schema（`:287-312`）、§4.4 错误码 A 表与 S1 待实现码（`:337-363`）、§3.2 动作五要素（`:175-184`）、§3.4 检查项两层（`:189-204`）、§3.5 三态与完备性（`:205-212`）、§3.6 开放项（`:213-218`）、§0.4 成本基线（`:85-99`）
  - `skills/dev-workflow/references/stage-2-tech-design.md`（② 段出口判据与 spec 要求）
  - `rules/dev-workflow-mainline.md`（R1–R8：出口签字、议会插点、漂移定性、长文取证）
  - `skills/parliament/SKILL.md:13`（B 路径派独立实例）+ `skills/parliament/references/submission-matrix.md` 的 spec 行（② 段席次）
  - `.session/reviews/2026-10-29-0900-s6-quality/quality-4-s6-audit.md`（S6 刚暴露的「判据互斥 / 缺第三人通道 / helper 恒真」三类失败，S1 设计判据时应避开同样形态）
- **勿重做**：
  - `tools/docgen/policy/**`（S6 的 F-24 单一来源：`definitions/{artifacts,capabilities,commands,paths,seats,tiers}.mjs` + `seat-policy.mjs`）
  - `tools/docgen/components/{renderBoundary,validatePolicy,dumpPolicy,patternRegistry}.mjs` 与 `tools/docgen/templates/boundary.md.tpl`
  - `tools/docgen/test/policy-pure-source.test.mjs`（71 条）与 `tools/docgen/test/tool-tiers.test.mjs`（47 条）
  - `tools/observation-check/**`（S2/S3 交付）
  - `agents/*.md` **15 张卡**（`Get-ChildItem agents/*.md` 实点 = 15；重生成属 **S4**，S1 不碰）

## 开放问题

1. **开工第一问**：S1 的「定义层」与 S6 已落地的 `tools/docgen/policy/definitions/**` 如何划界？推断：**两者是不同轴，S1 应新建独立目录而不是改 `policy/**`** —— 依据：PRD §3.8 全篇字段是 `scene` / `signal` / `action` / `checkItem` / `openItem`（卡面**内容**模型），无一条提权限、命令、路径或档位（那些是 S6 的 `capabilities` / `commands` / `paths` / `tiers`）。建议落点 `tools/docgen/card-model/`。请用户：确认或纠正落点名。
2. S1 是否真的「不渲染」？推断：**是** —— PRD §8 S1 行明写「数据结构 + 校验器（不渲染）」，三投影属 S4（`F-09`～`F-12`）。所以 S1 只交付 schema + validator + 负例测试，`agents/*.md` 一字不动。请用户：确认。
3. 现有 15 张卡的散文内容迁进新数据结构，归 S1 还是 S4？推断：**归 S4**（`F-11` 全席重生成）。S1 只定义「该写什么」，不产出任何卡。请用户：确认。

## 既定约束（不要重新讨论、不要重新选型）

- **执行顺序 `S2 → S3 → S1 → S4`**，S2/S3 已收口，故现在做 S1 —— 出处：PRD §8 `docs/prd/20261026205821-agent-card-contract.md:521`。
- **S1 范围 = `F-01`～`F-08`（定义层），不含渲染** —— 出处：同文件 §8 `:516` + §6 `:465-472`。
- **不做渲染层 S4**（`F-09`～`F-12`、`F-23`、全席重生成、`EXPIRY_LANDED`）—— 出处：S4 依赖 S1，且 `docs/handoffs/2026-10-28-s4-plan-gate.md:62` 已记「不做渲染层 S4」。
- **② 段必须 spec + 独立 testcase 一件交付**，testcase 由独立子代理在全新上下文编写 —— 出处：用户规则 `spec-testcase-gate`（五条判据）。
- **`V-13`（A/B 盲评）不在本期**，S1 的验收也不得引用它 —— 出处：spec `docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design.md` §8 表后注 + `gate-record.md:13`。
- **`npm run check` 是唯一总门禁**，任何改动须让它 exit 0 —— 出处：`scripts/check-all.mjs` + `package.json` 的 `check` 脚本。

## 遗留裁决与留观项

- **`checkItem.criterion` 与 S6 的 `criteria.md` 三态可能交叉** —— 来源：`docs/after/20261025145953-s6-policy-open-items-open-decisions.md` 的 D1（spec §3.5 #8 口径偏离：实现允许清单里的 verb 优先于 token 交集）；收敛时机 = S1 设计 `checkItem.criterion` 字段时，判断是复用 `tools/execution-matrix/criteria.md` 还是另立词表。
- **S6 的「判据互斥 / 缺第三人通道 / helper 恒真」三类失败形态** —— 来源：`.session/reviews/2026-10-29-0900-s6-quality/quality-4-s6-audit.md` §1.2 / §3；收敛时机 = S1 写 testcase 判据时，逐条自问「这条会不会和另一条互斥」「这条是不是恒真」。
- **15 卡豁免窗口到期 = S4 首次重生成** —— 来源：PRD `F-24` `:488`；S1 不触发，记于此以免误判。

## 开工前先做

1. 跑 `git status --porcelain`（应为空）+ 复跑三基线：`npm run check`（应 `1039/1037/0/2` + `check 全部通过`）、`node scripts/check-gate-record.mjs`（应 `rows 27 bad 0`）、`node scripts/scope-sweep.mjs --check`（应 `sweep ok`）。
2. 读 `docs/prd/20261026205821-agent-card-contract.md` 的 §3.8（`:243-284`）与 §6 `F-01`～`F-08`（`:463-472`）—— 这是 S1 要定义的全部字段与判据。
3. 读 `skills/dev-workflow/references/stage-2-tech-design.md` 与 `rules/dev-workflow-mainline.md` 的 R1–R8，确认 ② 段出口判据与议会插点。
4. 读 `tools/docgen/policy/definitions/` 六个文件 + `tools/docgen/test/policy-pure-source.test.mjs` 的 A 组用例，确认与 S6 的边界（S1 新建目录，不改这里）。
5. 读 `.session/reviews/2026-10-29-0900-s6-quality/quality-4-s6-audit.md` 的 §6 结论与 §3 四处复核，记下三类失败形态以免重犯。

## 开场话术

读 `docs/handoffs/2026-10-29-agent-card-s1-spec.md`，按交接词继续：开 agent-card S1（定义层 `F-01`～`F-08`）的 ② 段，写 spec + 独立 testcase 后送议会 #2。注意：开工第一问是「S1 定义层与 S6 的 `tools/docgen/policy/**` 如何划界（建议新建 `tools/docgen/card-model/`）」，先与我确认落点再动手。
