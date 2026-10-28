# Session 交接：retro-skills → S3 ③ 施工（gate wiring 实现 + ④ 质量门）（2026-10-28）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-28 08:54（Asia/Shanghai） |
| 项目根 | d:\Seed\retro-skills |
| HEAD | `8217df2`；工作树：**3 项未提交** —— `M skills/dev-workflow/references/gate-record.md`（+1 行 `②→③@S3`，`git diff --numstat` = `1 0`）、`?? docs/superpowers/plans/2026-10-28-s3-gate-wiring.md`（730 行）、`?? docs/handoffs/2026-10-28-s3-gate-wiring-impl.md`（本文件；取数 `git status --short`，08:56） |
| 验证基线 | unit `166/166`（`node --test "tools/observation-check/*.test.mjs"`，0 fail / 0 skip）+ 仓门禁 `902 tests / 900 pass / 0 fail / 2 skipped`、`baseline 37/37`、`④ markdown 检查通过（300 个文件 / 1279 张表）`、`⑤ .session 结构检查通过`、末行 `check 全部通过`（exit 0）+ `node scripts/scope-sweep.mjs --check` → `sweep ok（命中未超基线、清单齐、scope 齐）`（exit 0）+ R1/R2 自查 `bad 0` / `splitting 0`；以上 **2026-10-28 08:52 实跑**（08:52:06 起、08:52:31 止）。**本 handoff 落盘后复跑**（08:55）：`④` 计数变为 `301 个文件 / 1280 张表`（差值 = 本文件 1 md / 1 表），其余数字不变、`check 全部通过`（exit 0）、`sweep ok`（exit 0） |
| 继任自 | `docs/handoffs/2026-10-28-s3-plan-gate.md` |
| 状态 | 可直开工（0 个开放问题；唯一待用户动作 = 提交本批 3 项改动） |

## 项目定位

d:\Seed\retro-skills —— 一套以「判据可机械判、签字不自签」为纲的开发工作流仓库：PRD / spec / plan 五段流转，`tools/observation-check` 是校验评审观察产物的工具（json 为真源、md 只是视图）；S3 要把它的四段校验链接进 `npm run check` 的 **⑥ 段**（归档三态 + 反向清单 + git 断言 + 过程侧四段 + 旁路 + F-24 窗口 + skip 守卫）。

## 现状

- 已完成：S3 的 **② 段**（spec + testcase，一件齐）已过议会 #2 并签字 —— `skills/dev-workflow/references/gate-record.md:25` 的 `②@S3` 行：4 轮、出卡 28 + 25 + 9 + 3（P0 14 张全闭合）、审计 `delivery-audit.md` §7 终裁「通过（无余条件、打回 0）」；spec 244 行 / `E4A28FEF…F26BD`，testcase 1198 行 / `0330839F…13D25`（**均不得再改**）。
- 已完成：**②→③ 计划门已过并签字** —— `gate-record.md:26` 的 `②→③@S3` 行，独立审计实例共 6 轮：第 1 轮三核全过 + 11 条打回（P1 4 / P2 7）→ 第 2 轮 11/11 已消 → 第 3 轮签后增量登记 → 第 4 轮交付态终核 6/6 → 第 5 轮 P2 补正 → 第 6 轮转录逐字核（2 处差异均 P2、D1 系审计自身缩写笔误）。plan 终态 **730 行 / `65456676E712437631289B0CCF821F4CD6F0A49F4FC4D6480AC5E2B99F2BFFA5`**。
- 已完成：施工计划落盘 `docs/superpowers/plans/2026-10-28-s3-gate-wiring.md`（10 任务 + 接口小节 + 附录 A「55 条 ID → 落点」+ 附录 B 提交切分 + Task 10 的 14 项验收命令）。
- 验证证据：见元信息表『验证基线』（单源，勿在此重复填写）。
- 提交状态：**未提交，由用户自行 commit**（3 项：`gate-record.md` 的 `②→③@S3` 行 + 新 plan + 本 handoff）。审计建议首行 `docs(S3): 施工 plan（730 行）+ ②→③@S3 计划门签字行（gate-record +1 行）`。
- 工作树异常：无（3 项均为本批产物；取数 `git status --short`，08:56）。

## 过程记录

- 计划门账本 `.session/reviews/2026-10-28-0747-s3-plan-gate/`（**先读 `progress.md` 尾部**：12 步过程 + 「未完成」+「账本去留」）：
  - `plan-gate.md`（第 1 轮：11 条打回逐条修法）、`plan-gate-r2.md`（第 2 轮 11/11 已消 + 「可转录关键字段」）、`plan-gate-r3.md`（第 3 轮增量登记）、`plan-gate-final.md`（第 4 轮交付态终核 + 第 5 轮 P2 补正）
  - `gate-transcript-check.md`（第 6 轮转录核）、`impact-sheet.md`（本批当次清单：**本批无判据级改判**，`counts` 与 `baseline.json` 10/10 逐字相同）
- ② 段议会账本 `.session/reviews/2026-10-27-233704-s3-gate-wiring-spec/`：`progress.md` §0.1（用户 5 条裁定原话）、`problems.md §3`（延后 4 条 = 本文件「遗留裁决与留观项」的来源）、`impact-sheet.md`（I11 七处处置）
- 历史交接词链：`docs/handoffs/2026-10-27-s3-gate-wiring.md` → `docs/handoffs/2026-10-28-s3-plan-gate.md` → 本文件

## 本次任务

S3 的 ③ 段施工 + 收 ③ 段出口证据（其后 ④ 质量门由 sdet 签、⑤ 由用户签）；流程：按 plan 的 Task 1–9 逐任务「实现 → 写常驻测试 → 跑测试与仓门禁」→ Task 10 跑 14 项验收并把「命令输出首行 + 退出码」贴进 `gate-record.md` 的新行 `③@S3` → 派独立审计实例签 `③@S3` → sdet 逐条结论 `④@S3` → 用户验收 `⑤@S3`；起点：**③ 段 Task 1**（`card-exempt.mjs` + `card-exempt.test.mjs`）。

## 范围依据

- 要读（plan，`docs/superpowers/plans/2026-10-28-s3-gate-wiring.md`）：Global Constraints（`:17-34`）、文件结构（`:36-48`）、接口小节（`:50-80`）、Task 1（`:148`）/ Task 2（`:187`）/ Task 3（`:226`）/ Task 4（`:273`）/ Task 5（`:310`）/ Task 6（`:349`）/ Task 7（`:392`）/ Task 8（`:431`）/ Task 9（`:463`）/ Task 10（`:520`）、附录 A（`:644-706`，逐 ID 行 `:650-704`）、附录 B（`:708`）
- 要读（spec，`docs/superpowers/specs/2026-10-27-s3-gate-wiring-design.md`）：§11.1 R1–R9（`:43-51`）、§11.2 机制（`:53-132`）、§11.3 码表（`:134-147`）、§11.4 不做什么（`:149-156`）、§11.5 测试（`:158-179`）、§11.7 Q1–Q20（`:196-219`）、§11.10 八锚点（`:233-244`）
- 要读（testcase，`docs/superpowers/specs/2026-10-27-s3-gate-wiring-design-testcase.md`）：§0.2 判读口径（`:41`）、§1 覆盖总表（`:71`）、§1.1 覆盖核对（`:135`）、**§1.2 落点与夹具约定（`:218`：夹具助手代码 + 三载体划分）**、§2 用例明细分组（A `:278` / B `:365` / C `:479` / D `:553` / E `:627` / F `:691` / G `:753` / H `:805` / I `:867` / J `:905` / K `:967` / L `:983`）
- 要读（出口判据与先例）：`skills/dev-workflow/references/stage-3-implementation.md`、`skills/dev-workflow/references/stage-4-quality.md`；`gate-record.md` 的 `③@S2`（`:22`）与 `④@S2`（`:23`）两行作证据颗粒度先例
- 勿重做：`tools/observation-check/` 既有 12 个测试文件与全部模块（S2 交付 166 条；红线 = 测试对 `agents/` 引用数 0）；S3 spec 与 testcase（已签）；`tools/scope-sweep/keywords.json` 的 I11 与 `baseline.json`；`gate-record.md` 的 `@S2` 六行与 `②@S3` / `②→③@S3` 两行（签字证据不得改写）

## 开放问题

无。

（非先决项的 P2 备注：门行 D2 —— 证据指针简写为「同目录 `plan-gate-final.md`」，审计第 6 轮判「可追溯性仍在、改不改可选」。若 ③ 收尾时顺手补成全路径，按 `②@S3` 先例作增量登记即可，不重开本门。）

## 既定约束（不要重新讨论、不要重新选型）

- **S2/S3 边界定死**：`ArtifactMissing` / `UnclassifiedArtifact` 判定纯函数归 S2（`gate-scan.mjs:20`），`check-all` 增段 / 扫描根 / git 断言归 S3 —— 出处：S2 spec §10.5（`spec:60-66`）+ `gate-record.md:21`
- **S2 已签判据一字不改**（R1）：只新增 `gate-run.mjs` / `card-exempt.mjs` / `test-skip-allowlist.mjs` 与两个测试文件 —— 出处：S3 spec `:43`
- **扫描根唯一、`runObservationGate()` 无参数**：根由 `repoRoot()`（`tools/observation-check/evidence.mjs:40`）派生，测试用子进程 `cwd` 注入 —— 出处：spec `:44` / Q13 `:212` / PRD `:424`
- **不新增错误码**（R8）：只用已登记的 6 个门禁码 + S2 四段码原样透传 —— 出处：spec `:50`
- **验收类不落 `*.test.mjs`**：H37–H40 / H45–H52 共 12 条 + H01③ / H41② = plan Task 10 命令清单 —— 出处：spec `:174` / Q11 `:210`
- **账本-only 归档仍判 `ArtifactMissing`**：`:410` 只免 `UnclassifiedArtifact`；迁移「第 0 步」= 先产出 `observation-r<N>` —— 出处：用户 2026-10-27 裁定 + spec D9 `:194` / Q18 `:217`
- **F-24 只交窗口登记件**（15 卡清单 + 到期事件 + 处置纯函数 + 状态行），到期 = S4 首次重生成时把 `EXPIRY_LANDED` 置 `true` —— 出处：spec `:49` / `:224`
- **R8 只认裸命令** `node scripts/scope-sweep.mjs --check`（不得用 `npm run doc:sweep -- --check`：PowerShell + npm 10.9 吞参、恒假绿）—— 出处：`rules/dev-workflow-mainline.md` R8 + 2026-10-25 勘误
- **不做任何 git 写**：不 move / 不 `git add` / 不 `commit`（迁移四步只是流程义务）—— 出处：spec `:151`
- **签字不自签**：③ 由审计签、④ 由 sdet 签、⑤ 由用户签；申报人 = 开发（主 agent）—— 出处：`rules/dev-workflow-mainline.md` R2
- **夹具一律自建**（`mkdtempSync` + `finally` 清理），不引用 `agents/` 或仓内业务文件当夹具（唯一例外 = H41 验收半段）—— 出处：testcase §0.2-4（`testcase:51`）

## 遗留裁决与留观项

- `EXPIRY_LANDED` 置真动作 —— 来源：② 段账本 `problems.md §3` 行 1；收敛时机：**S4 spec 验收锚点必须写明**
- `check-all` 的 `root`（按文件位置，`scripts/check-all.mjs:28`）与 `repoRoot()`（git 顶层）同进程并存 —— 来源：`§3` 行 2；收敛时机：**下次触碰 `scripts/check-all.mjs:28` 时**；判据 = 两值不等时 ⑥ 段红
- 迁移后不删 `.session/<次>/` 副本会双报（同一坏产物归档侧 + 过程侧各报一次）—— 来源：`§3` 行 3；收敛时机：审查收尾流程
- `git add -N`（intent-to-add）仍报 `ArtifactDirty`（红、无假绿；不识别 `-N` 为既定取舍）—— 来源：`§3` 行 4 + spec `:113`；收敛时机：若需区分 intent-to-add，改判并补 H22 变体
- 存量过程目录 **实测 51 个**（`Get-ChildItem .session\reviews -Directory`）、`observation-r*` 0 件、归档侧 2 子目录 / 11 文件（08:52 实测）—— **不批量迁移、不补历史产物**，plan 不得设批量迁移任务 —— 出处：spec `:225`

## 开工前先做

1. `git status --short`（确认仍是那 3 项未提交，或用户已 commit → 按新 HEAD 重记）；复核基线：`node --test "tools/observation-check/*.test.mjs"`（期望 `166/166`）+ `npm run check`（期望 `902/900/0/2`、`baseline 37/37`、末行 `check 全部通过`）+ `node scripts/scope-sweep.mjs --check`（期望 exit 0）。
2. 读 plan `Task 1`（`:148-186`）与 testcase H41–H44（`:807-854`）：`card-exempt.mjs` 四出口 = `EXEMPT_CARDS`（15 项，名单取自 `Get-ChildItem agents\*.md` 实跑）/ `EXPIRY_EVENT='s4-first-regeneration'` / `EXPIRY_LANDED=false` / `disposeCardFindings(findings, { landed })` → `{ warnings, blockers }`。
3. 按「实现 → 写测试 → 跑」推进，每个任务收尾跑 `npm run check`（exit 0 才进下一任务）；`.session/tmp/` 收尾必须为空（`npm run check` ⑤ 段会红）。
4. **Task 9 是第一次让真仓走 ⑥ 段**：真仓期望 `⑥ 观察产物门禁：扫描 2 个子目录 / 归档 1 对 / 过程 0 对 / findings 0`、exit 0。若不达 → 回查接线（先核是否属迁移步骤 1 的预期态，spec `:132`）；**不得用 `CHECK_BYPASS` 糊过去**。
5. Task 10 的 14 项按「命令 + 期望」逐条跑，输出贴 `gate-record.md` 新行（`③@S3`），再派独立审计实例（`agents/reviewer-audit.md` 角色卡 path B，未参与施工）签；④ 由 `agents/senior-sdet.md` 逐条结论。

## 开场话术

读 `docs/handoffs/2026-10-28-s3-gate-wiring-impl.md`，按交接词继续：做 S3 的 ③ 段施工（按 `docs/superpowers/plans/2026-10-28-s3-gate-wiring.md` 从 Task 1 起），收 ③ 段出口证据。注意：先确认 worktree 那 3 项是否已由用户 commit。
