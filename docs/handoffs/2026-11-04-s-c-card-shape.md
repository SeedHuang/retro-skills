# Session 交接：retro-skills → S-C 卡面形状 ② 阶段（写 spec + testcase）（2026-11-04）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-11-04 08:28（本机时区，Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | **以 `git log -1` 为准**（本交接词自身的提交会改变 HEAD，写死即过期）；交接时实查 = `a18b56c`（`docs(gate-record): 落 ⑤@S-B 交付审计行`）；工作树：**clean**（`git status --porcelain` 实跑无输出） |
| 验证基线 | typecheck 无（本仓无 typecheck）/ build 无（无构建）/ unit `# tests 1481 / # pass 1476 / # fail 0 / # skipped 5` + `node tools/docgen/cli.mjs gate` → `baseline 38/38`（15 席 disk == render）+ `node scripts/check-gate-record.mjs` → `rows 68 bad 0` + `node scripts/scope-sweep.mjs --check` → `sweep ok` + `node scripts/check-observable.mjs --check` → `check-observable ok` + 末行 `check 全部通过`（**08:28 实跑**） |
| 继任自 | `docs/handoffs/2026-11-03-sb-contract-impl.md`（它继任自 `docs/handoffs/2026-11-03-card-data-contract-sb-spec.md`） |
| 状态 | **可直开工**；有 2 个开放问题（见下节），均非阻塞 |

## 项目定位

`d:\Seed\retro-skills` —— 一套「规则 / 技能 / 角色卡生成器」仓库：`rules/` 与 `skills/` 写方法与判据，`tools/docgen/` 把 15 席数据（`tools/docgen/data/`）渲染成 `agents/*.md` 15 张角色卡，`scripts/check-all.mjs` 是总门禁（七段 + `[observable]`）。

## 现状

- **已完成**：
  - **S-A 数据层** 五段全闭环（`skills/dev-workflow/references/gate-record.md:81`–`:85`，`②@S-A`…`⑤@S-A` 全签「过」）。
  - **S-B 契约层** 五段全闭环（同文件 `:89`–`:97`）：`②@S-B`（含三次签后增量）/ `②→③@S-B` / `③@S-B` / `④@S-B` / `⑤@S-B`（用户终签原话逐字转录 = `S-B ⑤ 交付审计通过`）。
  - S-B 交付物：`agents/*.md` 15 张重生成 + `tools/docgen/fixtures/*.evidence.json` 15 份（判者 = 独立实例 `reviewer-ai-sb-task6-a1-20261103`）；新脚本 `tools/docgen/check-quotes.mjs`、`tools/docgen/check-case-assert.mjs`；冻结基线 `docs/reports/2026-11-03-s-b-card-sha-baseline.md`；三件已签（spec 245 行 / testcase 867 行 / plan 290 行、52 Step 全勾）。
- **验证证据**：见元信息表『验证基线』（单源，勿在此重复）。
- **提交状态**：S-B 施工批已全部 commit（末四条 = `2cdc600`（Task 8）→ `b21a2eb`（④ 补测）→ `d4c3ebb`/`2eab213`/`d0431ff`（④⑤ 门行校正）→ `a18b56c`（⑤ 终签行））。**本交接词本身尚未 commit**（工作树唯一未跟踪件 `docs/handoffs/2026-11-04-s-c-card-shape.md`），是否提交由用户决定。
- **工作树异常**：无。
- **一处必须先知道的事实**：PRD §8 的「冻结基线」写着 `# tests` = 1405，那是 PRD 写就时的历史值；**现值为 1481**（08:28 实跑）。S-C 的冻结基线一律**开工时重测**，不得引用 1405。

## 过程记录

- `skills/dev-workflow/references/gate-record.md`（**先读 `:89`–`:97` 的 S-B 五条门行**，尤其 `:89` 的「签后增量登记」×3 与 `:97` 的 ⑤ 终签原话）
- `.session/sdd-2026-11-03-sb-contract/progress.md`（S-B 九任务的 ledger：裁决 / 每任务 commit / deferred minor 全在此；**先读尾部**）
- `.session/reviews/2026-11-04-0712-s-b-quality/`（④ 两账 `quality-4.md` 258 行 / `quality-4-audit.md` 187 行 + ⑤ `delivery-audit.md` 193 行）
- `.session/reviews/2026-11-03-s-a-plan-gate/impact-sheet.md`（R8 的「当次清单」，已 touch 36 次；**S-B 没有自己的当次清单**，靠它 + mtime 才绿 —— 见下方 G7）
- 历史交接词链：`docs/handoffs/2026-11-03-card-data-contract-sb-spec.md` → `2026-11-03-sb-contract-impl.md` → 本件
- ⚠️ `.session/` 不进 git：换机器 / 重新克隆后上述评审账全部消失（S-B ⑤ 行 P2-2 已登记该风险）

## 本次任务

写 **S-C 卡面形状** 的 ② 段产物（spec + 独立 testcase），过议会与计划门；流程：② 段（spec + `senior-sdet` 独立实例写 testcase + 议会评审 + 计划门）→ ③ 施工（每任务一 commit）→ ④ 质量评估（独立 sdet 实例）→ ⑤ 交付审计（独立审计 + 用户终签）；起点 = **② 段的 spec 起草**（S-C 的 ① 已随 PRD 结束，不在本次范围）。

## 范围依据

- 要读（S-C 的范围唯一来源）：
  - `docs/prd/20261102212627-card-data-contract-and-proof/index.md` **§2 D1–D6·D16、§3 Q1·Q4·Q5、§4 V1–V3·V9·V11·V12、§5 全表、§8 S-C 行（`:121`）、§9 S-C 行（`:137`）与 `:145` 的「你要做 S-C → 读这些」**；§9 末句「D16 / D17 只引用编号、不改写」是硬约束
  - `docs/superpowers/specs/2026-11-03-s-b-contract-layer-design.md` **§11.6（`:212`–`:215`）**：S-C 遗留清单（三态 5 行 / `trigger.kind` 四值 / 斜杠串清零 / 删人设 / `HOST_TERM` / `needs` 槽）
  - `docs/superpowers/specs/2026-11-03-s-b-contract-layer-design-testcase.md` **§0 判据约定**（`PROBE` / `COPY` / `GATE` / `COUNT` 各是什么）+ `:555` 的「单批性声明」（S-C 一改卡面，`SB-TC-06` / `SB-TC-32` 的一次性档与 `SB_BASE` 必须按新 BASE 重算）
  - `tools/docgen/components/renderCard.mjs`、`tools/docgen/templates/*.tpl`、`tools/docgen/card-model/validateCardModel.mjs`、`tools/docgen/test/s2-card-rewrite.test.mjs`（五处冻结断言所在处）、`tools/docgen/test/card-model.test.mjs`（`S1-TC-G09` 行）
- 勿重做（S-A / S-B 已实现，文件级）：`tools/docgen/data/**`（拆 JSON + `@` 引用）、`components/seatLoader.mjs`（注入 + 3 个拒载码）、`components/cardKeys.mjs`、`check-shared-refs.mjs`、`outputFormats.mjs` 的 `issue-card` 三列、`components/renderBoundary.mjs` 的 5 槽指针化、`check-quotes.mjs`、`check-case-assert.mjs`、`docs/reports/2026-11-03-s-b-card-sha-baseline.md`
- 勿改（已签三件）：S-B 的 spec / testcase / plan —— 要动必须回 ② 段重签并在 `gate-record.md` 做「签后增量登记」（S-B 做过三次，样式见 `:89`）

## 开放问题

1. **S-C spec 的文件名用哪个日期**（PRD `:137` 建议 `2026-11-03-s-c-card-shape-design.md`，但实际创建日是 2026-11-04）。推断：**沿用 PRD 建议名 `2026-11-03-…`** —— 依据：PRD `:137` 已用该名做路线图引用，改名会在 PRD 里留一处悬空引用；`docs-convention` 的「前缀 = 创建时刻」在「已被上游引用」时让位一致性。请用户：**确认**或改为 `2026-11-04-…`（若改，须同批改 PRD `:137`，且按 R8 回扫）。
2. **S-C ③ 是否仍按 `subagent-driven-development` 逐任务派新子代理**（S-B 用的这条路）。推断：**沿用** —— 依据：`④`/`⑤` 要求独立实例，③ 若由主 agent 亲自施工会让「施工者 ≠ 复核者」在 ④ 段失去隔离；S-B ledger `.session/sdd-2026-11-03-sb-contract/progress.md` 记录了该做法可用。请用户：**确认**或指定 `executing-plans`。

## 既定约束（不要重新讨论、不要重新选型）

- **S-C 只动卡面形状**：三态承载、动作返回、trigger 四型、长度约束、删人设、`HOST_TERM` —— 出处：PRD `:121` + `:137`。
- **D16 / D17 只引用编号、不在 spec 里改写** —— 出处：PRD `:147`（「跨文件关键设计决定」）。
- **卡面是生成物，只能 `draft` + `replace`**（`generate` 只比不写）；`replace` 触达语义键时必须 `--rejudge`，且判定必须由**独立于施工者的子代理**产出（`judgedBy` ≠ 施工者）—— 出处：S-B spec §11.2.7 第 2–3 步 + 2026-10-21 replace spec R7 + S-B Task 6 的回退重做（`7432346` 被 revert 的直接原因）。
- **常驻测试只留不变量，批次形态断言归 `SB_SHAPE_ONESHOT=1`**；BASE 由 `SB_BASE` 覆盖 —— 出处：S-B testcase `:555` + `tools/docgen/test/sb-contract-layer.test.mjs:949-952`。
- **`# tests` 不得低于基线**（删用例凑绿即做坏）—— 出处：PRD `:125` 的「做坏判据」。
- **改任一判据级口径必须回扫**：`node scripts/scope-sweep.mjs --check` exit 0 + 当次 `impact-sheet.md` 登记 —— 出处：`rules/dev-workflow-mainline.md` R8；S-B 三次改判都这么走（`gate-record.md:89`）。
- **testcase 的判据命令必须真跑过一次** —— 出处：`docs/after/20261103210731-testcase-criterion-execution-open-decisions.md:3-16`（S-B ② 议会抓出的 P0 实例：`Select-String -Recurse` 参数不存在 + 路径写错）。

## 遗留裁决与留观项

- **G7（R8 的绿靠旧批次清单的 mtime）** —— 来源：`gate-record.md:95`（④ 行）+ `docs/after/20261102222831-r8-mtime-criterion-open-decisions.md`（未决）；收敛时机：S-C 一旦改判据级口径就要新建**自己的**当次 `impact-sheet.md`，或改用 `--impact` 显式传入。
- **G9（④ 补测块不入 41 条计数）** —— 来源：`gate-record.md:95`；收敛时机：S-C 的 ④ 段（照此口径，别把补测块算进 testcase 条数）。
- **S-B 的批次形态断言与 `SB_BASE`** —— 来源：S-B testcase `:555`；收敛时机：S-C 改卡面后，一次性档（`SB-TC-06` / `SB-TC-32` / `SB-TC-25④`）须按 S-C 的 BASE 重算（默认常量 `tools/docgen/test/sb-contract-layer.test.mjs:952` 届时也要换）。
- **`scripts/test-skip-allowlist.mjs` 的 3 条一次性档白名单** —— 来源：该文件 `:8-10`；收敛时机：S-C 若新增默认 skip 的用例，须同批登记进白名单，否则 `check-all` 的「名单外 skip」判红。
- **P2-2（④⑤ 过程账只在 `.session/`，换机即失）** —— 来源：`gate-record.md:97`；收敛时机：换机 / 下批开工时迁 `docs/reports/<主题>-evidence/`。
- **S-A 未闭合项里与 S-C 相交的两条** —— 来源：`docs/after/20261103164513-s-a-quality-open-items-open-decisions.md`：`S-A-Q-2`（12 键字面探针缺位）、`S-A-Q-3`（`S5-TC-D10` 的注入面）；收敛时机：S-C 若触碰 `seatLoader` / `check-shared-refs` / `tool-tiers` 就顺带补。

## 开工前先做

1. `git status --porcelain`（应空）+ `git rev-parse HEAD`，再跑 `npm run check` 记下 `# tests` 与 `baseline 38/38`（确认与元信息表一致；**不要**沿用 PRD §8 的 1405）。
2. 读 `docs/prd/20261102212627-card-data-contract-and-proof/index.md` 的 §2 D1–D6·D16 / §3 Q1·Q4·Q5 / §4 V1–V3·V9·V11·V12 / §5 全表 / §8 `:121` / §9 `:137`·`:145`·`:147`。
3. 读 `docs/superpowers/specs/2026-11-03-s-b-contract-layer-design.md` §11.6（`:212`–`:215`）与 `skills/dev-workflow/references/gate-record.md:89`–`:97`（照 ② 行的写法做 spec+testcase 的签后增量登记）。
4. 读 `docs/after/20261102222831-r8-mtime-criterion-open-decisions.md` 与 `docs/after/20261103210731-testcase-criterion-execution-open-decisions.md`（前者决定你这次要不要建自己的 impact-sheet；后者决定 testcase 判据必须实跑）。
5. 起草前先跑 `node scripts/check-plan.mjs size --spec <新 spec> --testcase <新 testcase> --rounds 1` 看一下预算（`spec ≤350 行` / `testcase ≤80 条`），避免写完后超限再拆。

## 开场话术

读 `docs/handoffs/2026-11-04-s-c-card-shape.md`，按交接词继续：写 S-C 卡面形状的 ② 段（spec + 独立 testcase，过议会与计划门）。
