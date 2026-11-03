# Session 交接：retro-skills → S-A 数据层施工（T1 开工）（2026-11-03）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-11-03 10:22（本机时区，Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `fb9a238f1b36cc3f0291c63470663f766ec1ed00`（`chore: 更新依赖`）；工作树：**clean**（`git status --porcelain` 本次实跑无输出） |
| 验证基线 | typecheck 无（本仓无 typecheck）/ build 无（无构建）/ unit `# tests 1405 / # pass 1403 / # fail 0` / ④ markdown `382 文件 / 1635 表` / 末行 `check 全部通过`（`10:21:50` 实跑 `npm run check`，exit 0） |
| 继任自 | `docs/handoffs/2026-11-03-s-a-spec-parliament.md`（已随 `2ab2fe2` 提交） |
| 状态 | **可直开工**；有 3 个开放问题（见「开放问题」节），**第 1 问是开工第一问** |

## 项目定位

`d:\Seed\retro-skills` —— 一套「规则 / 技能 / 角色卡生成器」仓库：`rules/` 与 `skills/` 写方法与判据，`tools/docgen/` 把组件数据渲染成 `agents/*.md` 15 张角色卡，`scripts/check-all.mjs` 是总门禁。

## 现状

- **已完成**：
  - ② 段议会评审闭环：5 席（读者/审计/后端/测试/AI）+ 侦探，33 张卡全处置（P0 8→0），5 席复核 PASS、审计 round-check PASS、侦探 4 条观察全落账；终判「通过」见 `.session/reviews/2026-11-03-082100-s-a-spec-parliament/problems.md` §八。
  - spec §10.2 从占位填成 10.2.1–10.2.10，testcase 29→30 条（正 10 / 负+边界 20），末态 spec SHA `6D5C0A7D…845EC2D2E` / testcase SHA `031CAAAC…8EB296C0`（与仓内现值逐字相等）。
  - 实施 plan 落盘 `docs/superpowers/plans/2026-11-03-s-a-data-layer.md`（895 行，SHA `BF9BA747…522EA5380`），并通过**计划门**：审计席三进三出（FAIL→FAIL→PASS），`deps: cycle 0 dangling 0（nodes 6 / edges 13） => ok`、`map: missing 0 dangling 0（cases 30 / mapped 30） => ok`。
  - 「施工尚未开始」的实证（本次 `Test-Path` 三条实查，`10:22`）：`tools\docgen\data` = **False**、`tools\docgen\components\seatLoader.mjs` = **False**、`tools\docgen\check-shared-refs.mjs` = **False**。
- 验证证据：见元信息表『验证基线』（单源，勿在此重复）。
- 提交状态：**已 commit**（`2ab2fe2` = spec + testcase + 旧 handoff；`fb9a238` = plan）。两批均由**用户**提交，不是 agent 提交。
- 工作树异常：无。

## 过程记录

- 评审账本（**未进 git**，`.session/` 在 `.gitignore` 里）：`.session/reviews/2026-11-03-082100-s-a-spec-parliament/`
  - `problems.md`（**先读 §八 终态对账 + §四 答辩记录 + §九 复核新增卡**）
  - `progress.md`（轮次账 `08:21:00~09:31:57`、段一/二/三、改了什么、复盘、**未验证 3 条**）
  - `cards.md`（首轮 27 卡全文 + P2 候选表）
  - `submission.md`（送审说明 + **基线变更四行**：送审 / 第 1 轮修复 / 第 2 轮复核 / 末态）
- 历史交接词：`docs/handoffs/2026-11-03-s-a-spec-parliament.md` → 本文件（链式继任）

## 本次任务

按 plan 施工 S-A 数据层（T1→T6），**每任务一条 commit、每任务结束 `gate` 必须 exit 0**；流程：③ 实现（T1–T5）→ ④ 质量（T6 的 V4/V5/V10 + 全量门禁）→ ⑤ 交付（`gate-record.md` 的 `③→④` / `④→⑤` 行 + `impact-sheet.md`）；起点：**T1**（建 `tools/docgen/data/shared.json` + 15 席 JSON）。

## 范围依据

- 要读（按顺序）：
  1. `docs/superpowers/plans/2026-11-03-s-a-data-layer.md` **全文**（T1–T6 每步 + `## 附录 A 用例落点映射` + `## 回退` + `## 执行记录`）
  2. `docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md`：§10.1 R1–R9、**§10.2.1–10.2.10**（机制全在这）、§10.4 硬约束、§10.5 测试
  3. 同目录 `…-testcase.md`（30 条，用例 ID 见 plan 附录 A 的映射）
  4. `docs/prd/20261102212627-card-data-contract-and-proof/index.md`：§8 S-A 行（`:119`）、§9（`:127-147`）、§5（`:80-92`）、§4 V4/V5/V10（`:66`/`:67`/`:72`）
  5. 实现现状：`tools/docgen/components/agentData.mjs`（`:295` 的 `...s` 置末装配式）、`components/cardPipeline.mjs`（`CARD_KEYS`）、`components/validateAgentData.mjs`（`EXIT` 表 `:13-33`、`BASE_KEYS` `:105`）、`tools/docgen/cli.mjs`（`generate` 只比不写 / `replace` 的 `--expect-change` / `baseline --write`）
- 勿重做：PRD ① 段评审；② 段议会评审（`problems.md` §八 已判「通过」）；spec / testcase / plan 正文（三件均已定稿并提交）；`.session/reviews/2026-11-03-082100-s-a-spec-parliament/` 账本。

## 开放问题

1. **【开工第一问】T1 的 15 席 JSON 怎么产出？**；推断：**用 plan T1 Step 3 的一次性导出脚本**（`.session/tmp/export-seat-data.mjs`，生成后立即删除），不手抄 —— 依据：手抄 15 席等于把「渲染逐字节不变」交给运气，而脚本从当前 `agentData` 机械导出可保证内容同源；请用户：确认 / 纠正。
2. **计划门行是否先落盘再开 T1？**；推断：**先落** —— 依据 R1「进入任一阶段前必须确认上一段出口判据已齐」；且 `skills/dev-workflow/references/gate-record.md` 现有的 `②→③` 行写的是「脚本未落地：`scripts/check-plan.mjs` 全仓 0 命中」（那是 2026-10-25 的旧状态），本次 `deps` / `map` 已实跑 ok，该行需要按本次输出更新；请用户：确认 / 纠正。
3. **每任务单独 commit 照做吗？**；推断：**照做** —— 依据 plan 每个任务的 `Step N: 提交` 都已写好 commit message；且本 session 的两批改动由用户手动 commit，说明接受这种颗粒度；请用户：确认 / 纠正。

## 既定约束（不要重新讨论、不要重新选型）

- 渲染逐字节不变：任何一步结束 `node tools/docgen/cli.mjs gate` 必须 **exit 0** —— spec §10.1 R9 / PRD V4。
- `card` 的键集**恰等** 12 键，键名唯一源 `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md:89` —— PRD V5 / spec R2。
- 条目顶层 `BASE_KEYS` 9 键不变；`trigger` 段必须在加载期拆出，不得出现在条目上 —— spec §10.2.2 / `validateAgentData.mjs:105`。
- `SCAN_FIELDS` **仍 8 键**（逐码一项）；`CARD_MODEL_CODES` **仍 36 码零新增**（新增 4 码只进 `validateAgentData` 的 `EXIT` 表）—— PRD D16④ / spec §10.2.6。
- `duty.trigger` 保留字段名、席文件里恒 `""`，非空 = 拒载 `TriggerFieldMisplaced` —— spec §10.2.10 D-a。
- `@` 只允许**单层**；`shared.json` 值内不得再出现 `@` / `${@` —— spec §10.2.3 规则 1 / D-b。
- 插值**必须**用函数替换或 `split/join`（禁 `str.replace(re, str)`，否则 `$&` 被当替换模式）—— spec §10.2.3。
- `shared.json` 只收实测逐字重复 3 键：`dutyConstraintDefault`(12) / `cardRationaleHead`(12) / `cardRationaleTail`(11) —— spec §10.2.2。
- 装配式变量名 `s` + 展开符 `...s` **不能改**：`tool-tiers.test.mjs` 认 `tools:\s*toolsForSeat\(\s*s\.name\s*\)` 且 `indexOf('...s')` —— spec §10.2.9 / plan T2 Step 3 注释。
- 薄壳**先 `import` 再 `export`**，不得纯再导出 —— spec §10.2.5 第 7 步（`card-render.test.mjs` 的 `INJECT_BAD` 依赖本地绑定）。
- `agents/*.md` 是生成物，只走 `draft` → `replace`，禁止手改 —— PRD §6 / `cli.mjs` 的 `cmdGenerate` 只比不写。
- `baseline 38/38` **不作判据**（同式自除恒真）—— PRD §5 `:88`。

## 遗留裁决与留观项

- 4 个新码（`DanglingSharedRef` / `EmptySharedValue` / `NestedSharedRef` / `CardKeySetMismatch`）**只登记未实现** —— 来源：spec §10.2.6；收敛时机：**T2**。
- `tools/docgen/acceptance/replace-scenarios.mjs` 实测 **9/11 红**（`Mismatch: state.json 缺席`，既有债，不属 S-A）—— 来源：testcase TC-028 的修订说明；收敛时机：T3 删死 helper 时**只删 helper、不修其余**，另立账。
- 「`check-shared-refs.mjs` 不进 `npm run check` 独立段」是**裁决**（理由：loader import 期 fail-closed + 29 条 import 兜底）—— 来源：spec §10.2.6 末段；收敛时机：若 T2 后发现兜底不成立，**回 spec 改判**，不得就地改。
- 三次复核轮未单独 `time.mjs` 取数（本 session 执行缺口，已并入总耗时记明）—— 来源：`progress.md`「未验证」第 1 条；不阻塞施工，下轮起守时。

## 开工前先做

1. `git status --short`（**应无输出**）+ `npm run check`（记下 `# tests` 与末行；本交接基线 `1405 / 0`，`10:21:50` 实跑）——确认工作树与门禁没漂。
2. `Test-Path tools\docgen\data` → 应为 **False**（本交接 `10:22` 实查）；若为 True，说明有人先动过，先查 `git log -- tools/docgen/data`。
3. 读 plan 的 T1 全节（尤其 `Step 3` 的导出脚本代码）与 spec §10.2.2 键切分表 + §10.2.5 加载时序；核 `Select-String -Path tools\docgen\components\agentData.mjs -Pattern '...s'` 仍命中 `:295` 那一行。
4. 更新 `skills/dev-workflow/references/gate-record.md` 的 `②→③` 行（旧行写「脚本未落地」，本次改为 `deps: cycle 0 dangling 0… => ok` / `map: missing 0 dangling 0… => ok` 首行），再跑 `node scripts/check-gate-record.mjs` 应 `rows N bad 0` / `gate-record ok`。
5. 开 T1：按 plan `Step 1` 先写失败测试（TC-001）→ `Step 2` 跑红 → `Step 3` 跑导出脚本 → `Step 5` `gate` 必须仍 exit 0（**本任务不动任何代码**）。

## 开场话术

读 `docs/handoffs/2026-11-03-s-a-data-layer-impl.md`，按交接词继续：从 T1 开工 S-A 数据层施工。注意：先答开工第一问（T1 的 JSON 用导出脚本还是手抄），并先把 `gate-record.md` 的 `②→③` 计划门行按本次 deps/map 输出更新。
