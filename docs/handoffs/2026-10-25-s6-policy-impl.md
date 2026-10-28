# Session 交接：retro-skills → S6 / F-24 规则单一来源化施工（2026-10-25）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-25 16:00（Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `a7749b27aa1ee51a91242effa375d2b7e8b1f941`（2026-10-25 09:31）；工作树：**非 clean**，9 改 + 10 未跟踪（逐项见「现状」节） |
| 验证基线 | `npm run check` → `# tests 661` / `# pass 659` / `# fail 0` / `# skipped 2`、`④ markdown 检查通过（273 个文件 / 1123 张表）`、末行 `check 全部通过`；`node tools/docgen/cli.mjs gate` → `baseline 37/37`；`npm run doc:sweep -- --check` → `sweep ok（命中未超基线、清单齐、scope 齐）`（**16:00 实跑**） |
| 继任自 | `docs/handoffs/2026-10-25-s6-policy-parliament.md` |
| 状态 | 有 1 个开放问题（见「开放问题」），其余可直开工 |

## 项目定位

`d:\Seed\retro-skills` —— 一套围绕「规则 / 技能 / 多席议会评审 / 文档生成」的自举工程仓；本次要做的是把 docgen 生成器的权限规则从「两份散文边界句」改成「定义层数据 + 模板渲染」（PRD 功能点 F-24，交付份 S6）。

## 现状

- **议会 #3 已收口**：spec + testcase 过 ② 段，签字在 `skills/dev-workflow/references/gate-record.md` 的 `②@S6` 行（4 轮 + 增量复核；83 张卡 = 62 + 14 + 5 + 2；审计终审判通过）。
- **plan 已出到 v2.3**：`docs/superpowers/plans/2026-10-25-s6-policy-single-source.md`，10 任务 / 78 条用例全覆盖 / 依赖无环；`②→③@S6` 行已签 **v2.2**，v2.3 只改了一处命令（见「开放问题」）。
- **配套已落地**（勿重做）：规则 `R8`（改判回扫）在 `rules/dev-workflow-mainline.md`；扫描脚本 `scripts/scope-sweep.mjs` + `tools/scope-sweep/`（`npm run doc:sweep`）；S5 spec 指针 2 处、S5 testcase 三条判据改判、PRD F-24 行口径改写 + §0 留痕。
- **验证证据**：见元信息表『验证基线』（单源，勿重复填写）。
- **提交状态**：全部改动**未提交，由用户自行 commit**（HEAD 停在 `a7749b2`）。
- **工作树逐项**：
  - 已改（M）：`docs/prd/20261024073606-dev-workflow-mainline/index.md`、`docs/superpowers/specs/2026-10-25-s5-tool-tiers-design.md`、`docs/superpowers/specs/2026-10-25-s5-tool-tiers-design-testcase.md`、`package.json`、`rules/dev-workflow-mainline.md`、`rules/docs-convention.md`、`scripts/check-all.mjs`、`skills/dev-workflow/references/gate-record.md`
  - 未跟踪（??）：`docs/after/20261025094353-docgen-policy-single-source-open-decisions.md`、`docs/after/20261025145953-s6-policy-open-items-open-decisions.md`、`docs/handoffs/2026-10-25-s6-policy-parliament.md`、`docs/mymind/`（2 份决策记录）、`docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design.md`、`docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design-testcase.md`、`docs/superpowers/plans/2026-10-25-s6-policy-single-source.md`、`scripts/scope-sweep.mjs`、`scripts/scope-sweep.test.mjs`、`tools/scope-sweep/`

## 过程记录

- `.session/reviews/2026-10-25-111619-s6-policy-parliament/progress.md`（**先读尾部**，含四轮与增量复核的结论、未取数项）
- 同目录：`cards.md`（83 卡全文 + 答辩）、`problems.md`（五态漏斗 / P2 逐卡落态 / F33–F53 增量卡）、`evidence.md`、`submission.md`（送审基线两 SHA）、`impact-sheet.md`（改判影响清单：只改 / 已改 / 不改 / 将来得改）、`round-check.md`、`delivery-audit.md`、`detective.md`、`plan-gate.md`（**含「v2 返工与终审」节**）
- 历史交接词链：`docs/handoffs/2026-10-25-s6-policy-parliament.md` → 本文件
- 议会账本收口后迁移规则：整目录迁 `docs/superpowers/reviews/2026-10-25-111619-s6-policy-parliament/`（进 git），再删 `.session/` 副本（见 `docs/research/20261025133825-review-scope-and-sweep/index.md` 的落点约定）

## 本次任务

按 plan v2.3 **以子代理逐任务方式施工 T1→T10**（每个任务派一个全新子代理；任务间由主 agent 做两段复核：① 验收命令实跑 + 期望值比对；② 与 spec/testcase 的判据对位）。流程：**T1 基线 → T2 定义层 → T3 配置层 → T4 模板/渲染/校验（含 checkpoint）→ T5 接入+删常量+重出两卡 → T6 `policy --dump` → T7 双向下探+散文子句 → T8 已完成项复核 → T9 全量+反向+基线复核 → T10 A/B 盲评+四本账单**；起点：**T1**（对应 spec §6 步骤 0）。

## 范围依据

- 要读：`docs/superpowers/plans/2026-10-25-s6-policy-single-source.md`（**顶部 Global Constraints + 「测试用例 → 任务映射」表 + 每个 Task 的 Files/Interfaces/Steps/验收命令**）
- 要读：`docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design.md` §3（1–7）、§5（布局）、§6（步骤 0–10）、§7（六码）、§8（V-1～V-13）、§9（评估）
- 要读：`docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design-testcase.md` §0.1（三口径 21 / 22 / 23）、§0.2（命令组）、§0.3–§0.4（**62 个 helper 的实现，plan 只说「照抄」，不重复给**）、§1（覆盖总表）
- 勿重做：S5 spec 两处指针（`2026-10-25-s5-tool-tiers-design.md` §3.3 / §8 附近）、S5 testcase 三条判据（`E05` / `B08` / `B14`）、PRD F-24 行与 §0 留痕、`R8` 规则、`doc:sweep` 脚本与基线

## 开放问题

1. **plan v2.3 的 T5 Step 4a 修正要不要审计复签？**（v2.2 签字时的命令写 `--rejudge 边界`，但 `--rejudge` 只接受 `A1`–`C4`；`touchedSemanticKeys()` 只把 `description` 行判 `A2`、「你是谁/身份」节判 `A1`，边界段变更通常无触达键 → v2.3 改为「省略 `--rejudge`，有键才传」）。
   推断：**要复签**（R2：签字件改动需签字人复核），但只需核这一条；依据 `rules/dev-workflow-mainline.md` R1/R2 + `skills/dev-workflow/references/gate-record.md` 的 `②→③@S6` 行。
   请用户：确认「先复签再施工」，还是「施工到 T5 前再复签」（后者可先做 T1–T4，T4 checkpoint 不依赖该命令）。

## 既定约束（不要重新讨论、不要重新选型）

- **不 commit**：每个任务停在「测试绿 + 未提交」，提交由用户执行 —— 本仓长期约定（`docs/handoffs/2026-10-25-s6-policy-parliament.md` 同款）。
- **不改 spec / testcase**：实现中发现 spec 缺定义 → 停手回流 spec，禁止 plan 新增设计（R4，见 `rules/dev-workflow-mainline.md`）。
- **不以字节相等验收**：通过判据 = V-1（能力集合 diff 空差）+ V-13（A/B 逐维不退化）；字节哈希只作定位线索（spec §8 V-2）。
- **卡面只能经 CLI 重出**：`draft` → `diff` 取新 sha → `replace --expect-change <sha> --yes`；禁止手改 `agents/*.md`。
- **`--rejudge` 只收 `A1`–`C4`**：带 `--rejudge` 必须同时设 `DOCGEN_JUDGED_BY`，否则 `UnapprovedChange` 且不写盘（`tools/docgen/cli.mjs` 的 `judgeId()`）。
- **导出名以已签 testcase 为准**：`CAP.capabilities`（小写）、`CMD.*`、`TIERS`；`pathItems()` / `pathTokens()` 是测试侧派生，不是 `PTH` 导出。
- **两个长文本口径已裁**：`CLAUSES` 是数组、元素 5 字段对象；`assertNeedClauses` 成功返回 `seg`、失败即抛（`missingClauses` 才返回缺失列表）。

## 遗留裁决与留观项

- S6-B 候选 4 条 + 工程化二期 3 条 + S5 遗留 4 条 —— 来源：`docs/after/20261025145953-s6-policy-open-items-open-decisions.md`；收敛时机：S6 交付后 / 下一次触碰 `tools/docgen` 时（每条带触发信号）。
- 议会账本仍在 `.session/`（不进 git）—— 收敛时机：T10 收口时整目录迁 `docs/superpowers/reviews/`。
- 一个 3.6 MB 的子代理思考记录被误写进 `docs/mymind/evidences/`，已移出仓库到 `C:\Users\HuangChunhua\.retro-skills\transcripts\s6-parliament-transcript-2026-10-25.md` —— 无需再处理，**不要**把它搬回仓库（会破 `check` 的行号守卫）。

## 开工前先做

1. `git --no-optional-locks status --porcelain` 应得 **9 行 M + 10 行 ??**（与「现状」节逐项对上）；再跑三门复核基线：`npm run check`（期望 `# pass 659 / # fail 0`）、`node tools/docgen/cli.mjs gate`（期望 `baseline 37/37`）、`npm run doc:sweep -- --check`（期望 `sweep ok`）。
2. 读 `docs/superpowers/plans/2026-10-25-s6-policy-single-source.md` 的 Global Constraints 与「测试用例 → 任务映射」表（确认 78 = 各任务之和）。
3. 处理「开放问题 1」：派审计实例只核 v2.3 的那一条命令，签字转录进 `gate-record.md` 的 `②→③@S6` 行（或由用户裁定不重签）。
4. 读 testcase §0.1（三口径 21 / 22 / 23）与 §0.3–§0.4（helper 实现），确保 T2/T4 的断言按原文写、不自造。
5. 开 T1：先写 `tools/docgen/test/support/capability-baseline.test.mjs` 的失败测试（两条），再实现抽取器。

## 开场话术

```text
读 docs/handoffs/2026-10-25-s6-policy-impl.md，按交接词继续：按 plan v2.3 以子代理逐任务方式施工 T1→T10。
注意：先处理「开放问题 1」（plan v2.3 的 T5 Step 4a 是否先复签），且全部改动由我 commit。
```
