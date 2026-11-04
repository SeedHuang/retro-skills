# Session 交接：retro-skills → S-C 卡面形状 ③ 段（施工）（2026-11-04）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-11-04 11:57（本机时区，Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | **`eef963e`**（`docs(s-c): 落 S-C 卡面形状 ② 段（spec + 独立 testcase + plan + 计划门）`）；工作树：**clean**（`git status --porcelain` 实跑无输出） |
| 验证基线 | typecheck 无（本仓无 typecheck）/ build 无（无构建）/ unit `# tests 1481 / # pass 1476 / # fail 0 / # skipped 5` + `baseline 38/38` + 末行 `check 全部通过` + `rows 70 bad 0` + `sweep ok` + `check-observable ok` + `size: spec 270/350 tc 60/80 rounds 3/3 => ok`（**11:56 实跑**） |
| 继任自 | `docs/handoffs/2026-11-04-s-c-card-shape.md`（本次 ② 段交接词，已随 `eef963e` 提交） |
| 状态 | **可直开工**；2 个开放问题（见下节），均非阻塞 |

## 项目定位

`d:\Seed\retro-skills` —— 一套「规则 / 技能 / 角色卡生成器」仓库：`rules/` 与 `skills/` 写方法与判据，`tools/docgen/` 把 15 席数据（`tools/docgen/data/`）渲染成 `agents/*.md` 15 张角色卡，`scripts/check-all.mjs` 是总门禁。

## 现状

- **已完成**：
  - **S-A 数据层 / S-B 契约层** 五段全闭环（`skills/dev-workflow/references/gate-record.md:81`–`:97`）。
  - **S-C ② 段全闭环**（本次 batch）：
    - spec `docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md`（**270 行 / `9B470C82…E7BA0`**）
    - testcase `docs/superpowers/specs/2026-11-03-s-c-card-shape-design-testcase.md`（**1072 行 / 60 条** = 正 21 / 负 17 / 边界 22 / `FC7E144A…B26697`；由独立 `senior-sdet` 实例 `…-01` 起、7 轮修订）
    - plan `docs/superpowers/plans/2026-11-03-s-c-card-shape.md`（7 任务 / 附录 A 60 行 / `E8535512…D0AD350`；执行记录表**全「未开工」**）
    - 门行 2 条：`gate-record.md:99`（`②@S-C`，**过 / P0 = 0**）、`:100`（`②→③@S-C`，**通过**）
    - D6 延期落点 `docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md`
- **验证证据**：见元信息表『验证基线』（单源，勿重复）。
- **提交状态**：`eef963e` 已含上述 6 个文件（1692 insertions）；**③ 段改动尚未开始**。
- **工作树异常**：无。

## 过程记录

- `skills/dev-workflow/references/gate-record.md`（**先读 `:99`–`:100` 的 S-C 两条门行**，`:99` 内有「签后增量登记 9 次」与「R2 自查」）
- `docs/superpowers/plans/2026-11-03-s-c-card-shape.md`（**先读「任务」与「执行记录」两节**；Task 0–6 的步骤即施工清单）
- `docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md`（§11.1 R1–R12、§11.2 落点表、§11.9 硬约束、§11.13 施工命令、§11.14 回退面）
- `.session/reviews/2026-11-04-0840-sc-card-shape-spec-parliament/`（议会全过程账：`progress.md`（时间线 + 收口说明）/ `cards.md`（轮 1 的 23 张卡原文）/ `problems.md`（8 族 + 答辩 + 复核轮）/ `detective-round1.md` / `submission.md` / `impact-sheet.md`）
- 历史交接词链：`docs/handoffs/2026-11-03-card-data-contract-sb-spec.md` → `2026-11-03-sb-contract-impl.md` → `2026-11-04-s-c-card-shape.md` → 本件
- ⚠️ `.session/` 不进 git：换机器 / 重新克隆后上述过程账全部消失（结论已进 `gate-record.md`）

## 本次任务

做 **S-C 卡面形状的 ③ 段（施工）**：按 plan 的 Task 0–6 逐任务施工、每任务一 commit；流程：③ 施工（`subagent-driven-development` 逐任务派子代理）→ ④ 质量评估（独立 sdet 实例）→ ⑤ 交付审计（独立审计 + 用户终签）；**起点 = Task 0（开工基线复核）**；② 段（spec / testcase / 议会 #2 / 计划门）**已闭环，不要重开**。

## 范围依据

- 要读：
  - `docs/superpowers/plans/2026-11-03-s-c-card-shape.md` —— 「File Structure（施工白名单）」/ Task 0–6 / 「附录 A：用例 → 任务落点」/「风险与回落」
  - `docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md` —— §11.1（R1–R12）/ §11.2（13+2 个落点）/ §11.3（表头形态 + 10 处冻结断言改写表）/ §11.4（斜杠串 + 动作句式 + 人设 + role）/ §11.5（四型 + `cardPipeline.mjs:29` 第二处名单）/ §11.6（Q4）/ §11.7（`HOST_TERM` 五条判据）/ §11.9（硬约束）/ §11.13（`replace` 完整命令）/ §11.14（回退面）
  - `docs/superpowers/specs/2026-11-03-s-c-card-shape-design-testcase.md` —— §0（`PROBE` / `COPY` / `COPY-取数` / `COUNT` / `SHAPE` 约定）、§1 覆盖总表、§2 各条 `SC-TC-*`、§5 差异清单
  - `docs/prd/20261102212627-card-data-contract-and-proof/index.md` —— §2 D1–D6·D16、§3 Q1/Q4/Q5、§4 V1–V3·V9–V12、§5 全表、§8 S-C 行（`:121`）、§9（`:137`·`:145`·`:147`）
  - 现盘实现（判改动点与既有断言）：`tools/docgen/card-model/vocab/card-contract.mjs`、`tools/docgen/components/renderCard.mjs`、`tools/docgen/components/cardFaceIds.mjs`、`tools/docgen/components/seatLoader.mjs`、`tools/docgen/components/cardPipeline.mjs`、`tools/docgen/card-model/enums.mjs`、`tools/docgen/data/shared.json` + `data/seats/*.json`、`tools/docgen/cli.mjs:540-582`、`scripts/check-all.mjs:136-216`
- 勿重做（S-A / S-B 已实现，文件级）：`tools/docgen/data/**` 的 `@` 展开机制、`components/seatLoader.mjs`（注入 + 拒载码，**只加 `kind` 透传，不改其它**）、`components/cardKeys.mjs`、`check-shared-refs.mjs`、`outputFormats.mjs` 的 `issue-card` 三列、`components/renderBoundary.mjs` 的 5 槽指针化、`check-quotes.mjs`、`check-case-assert.mjs`、`docs/reports/2026-11-03-s-b-card-sha-baseline.md`
- 勿改（已签三件 + PRD）：`docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md` / 其 testcase / plan —— **要动必须回 ② 段重签并在 `gate-record.md:99` 做「签后增量登记」**；PRD 正文 0 改动（D16 / D17 只引用编号，PRD `:147`）

## 开放问题

1. **③ 是否仍按 `subagent-driven-development` 逐任务派新子代理**；推断：**沿用** —— 依据：S-B 走的就是这条路（`gate-record.md:93` 的 ③ 行 = 主 agent 施工 + 任务级 commit），且 ④/⑤ 要求「施工者 ≠ 复核者」，主 agent 亲自写会让隔离失效；见 `.session/reviews/2026-11-04-0840-sc-card-shape-spec-parliament/progress.md` 的 S-A/S-B 沿用记录。请用户：确认或改指定 `executing-plans`。
2. **`sb-contract-layer.test.mjs:951` 的 `SB_BASE` 默认常量要不要在本批换值**；推断：**要换**（现默认 `2c186c28e4aba776395657829aded2e14b10fca0` 是 S-B 批次基准，S-C 改卡面后 `SB-TC-06/32/25④` 的一次性形态断言会全红），做法见 plan Task 5「改写为 S-C 形态（或降为不变量）+ `SB_BASE` 换本批 `$BASE`」，且 `scripts/test-skip-allowlist.mjs` 的 3 条名字须同批同步。请用户：确认或要求只靠 env 覆盖不改默认值。

## 既定约束（不要重新讨论、不要重新选型）

- **S-C 只动卡面形状**：三态承载、动作返回、trigger 四型、长度约束、删人设、`HOST_TERM` —— 出处：PRD `:121` + `:137`
- **D16 / D17 只引用编号、不在实现里改写**（尤其「不新增 `checkItem.returns`」）—— 出处：PRD `:147` + `:43`
- **卡面是生成物，只能 `draft` → `diff` → `replace`**（`generate` 只比不写）；`replace` 必须带 `--expect-change <即将写盘字节的 sha256>` + `--rejudge <触达语义键>`，判者由 `DOCGEN_JUDGED_BY` 提供且**独立于施工者** —— 出处：spec §11.13 + `tools/docgen/cli.mjs:543-560`（缺旗标即 `UnapprovedChange`）
- **`reviewer-audit` 的 `when` 一字不动**（改成 dispatch 语会被 `tools/docgen/test/pilot-data.test.mjs:26` 的逐字断言拦住，且会让 `occasion` 空转）—— 出处：spec §11.5 第一段
- **`duty.action` 禁写三态词**（英文 `hit/miss/na` 与中文「命中/未命中/不适用」都不写）；「写回」后的产物名须非占位且 15 席 ≥ 3 种 —— 出处：spec §11.1 R8
- **一次性 / 批次形态断言归 `SB_SHAPE_ONESHOT=1`**，`SB_BASE` 由环境变量覆盖 —— 出处：S-B testcase `:555` + spec §11.9
- **本批必须自建 / 维护自己的 impact-sheet 且覆盖 33 个口径 ID + 全部命中文件**：漏写会让 `sweep` 报「清单缺口径」并把 4 条 sweep 用例一起带红（② 段实测踩过 `# fail 4`）—— 出处：spec §11.9 表内两条
- **`# tests` 不得低于 1481 + 本批新增**（删用例凑绿 = 做坏）—— 出处：PRD `:125`
- **改任一判据级口径必须回扫**：`node scripts/scope-sweep.mjs --check` exit 0 + 当次 `impact-sheet.md` 登记 —— 出处：`rules/dev-workflow-mainline.md` R8
- **判据禁 `node -e`**（审计席角色卡禁止）；计数不用 `Select-String` / `git diff` 的退出码 —— 出处：`docs/after/20261103210731-testcase-criterion-execution-open-decisions.md:3-20`
- **每任务一 commit** —— 出处：用户 2026-11-03 口径（S-A/S-B 两批都是这么落的）

## 遗留裁决与留观项

- **G7（R8 的绿靠 mtime）** —— 来源：`gate-record.md:95`（④@S-B 行）+ `docs/after/20261102222831-r8-mtime-criterion-open-decisions.md`（未决）；**本批已有自己的清单**：`.session/reviews/2026-11-04-0840-sc-card-shape-spec-parliament/impact-sheet.md`（33 口径 + 18 命中文件）；收敛时机 = ③ 每次改 scope 内文件后 touch 它，或改用 `--impact` 显式传入
- **G9（④ 补测块不入条数账）** —— 来源：`gate-record.md:95`；收敛时机：S-C 的 ④ 段（照此口径）
- **P2-2（②④⑤ 过程账只在 `.session/`，换机即失）** —— 来源：`gate-record.md:97`；收敛时机：换机 / 下批开工时迁 `docs/reports/<主题>-evidence/`
- **D6「逐项返回文案重写」押后** —— 来源：spec §11.12 + `docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md`；收敛时机：PRD 下一次修订或出现「逐项判定」的真实消费者
- **`trigger.kind` 投影到卡面 / `docs/agents` 留观** —— 来源：spec §11.5 末条；收敛时机：首次出现「按 kind 选席」的需求
- **P2-3（testcase「60 条」为自设上限）** —— 来源：`cards.md` 的审计 P2-3；60 = 本批自设（`stage-2-tech-design.md:32` 的阈值是 80）；收敛时机：④ 段若要加补测，按阈值 80 计、不必守 60
- **S-A 未闭合项里与 S-C 相交的两条** —— 来源：`docs/after/20261103164513-s-a-quality-open-items-open-decisions.md`：`S-A-Q-2`（12 键字面探针缺位）、`S-A-Q-3`（`S5-TC-D10` 的注入面）；收敛时机：本批若触碰 `seatLoader` / `check-shared-refs` / `tool-tiers` 就顺带补（plan Task 2/5 会碰后两者）

## 开工前先做

1. `git status --porcelain`（应空）+ `git rev-parse HEAD`（应 `eef963e`），再跑 `npm run check` 记下 `# tests / # fail / # skipped` 与 `baseline 38/38`（**执行记录里的 `$BASE` 就是这一步的 HEAD**；不要沿用任何历史数字）。
2. 读 `docs/superpowers/plans/2026-11-03-s-c-card-shape.md` 的 Task 0 全节 + File Structure 表，逐条确认落点在白名单内（落点外一律不写）。
3. 读 `skills/dev-workflow/references/gate-record.md:99`–`:100`（S-C 两条门行）与 spec §11.9 的硬约束表（尤其 `impact-sheet` 33 ID、`SB_BASE`、`# tests` 三条）。
4. 跑 `node scripts/check-plan.mjs map --plan docs/superpowers/plans/2026-11-03-s-c-card-shape.md` 与 `… deps --plan <同上>`，记下 `cases 60 / mapped 60` 与 `nodes 7 / edges 10`（施工前基线）。
5. 读 `tools/docgen/test/sb-contract-layer.test.mjs` 的 `:944-956`（`SB_SHAPE_ONESHOT` / `SB_BASE` / `ONESHOT` 三处）与 `scripts/test-skip-allowlist.mjs` 全文件——Task 5 要动这两处，先看清现状再改。

## 开场话术

读 `docs/handoffs/2026-11-04-s-c-card-shape-impl.md`，按交接词继续：做 S-C 卡面形状的 ③ 段（按 plan 的 Task 0–6 逐任务施工，每任务一 commit）。
