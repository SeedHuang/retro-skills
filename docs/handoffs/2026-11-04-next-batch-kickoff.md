# Session 交接：retro-skills → 下一批开工（先清 S-C 残账）（2026-11-04）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-11-04 16:59（本机时区，Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | **`36d8e01`**（`fix(s-c): ⑤ 段落点并入既有白名单件（SC-TC-62 回绿）+ 门行 D10/D11 口径同步`）；工作树：**clean**（`git status --short` 实跑无输出） |
| 验证基线 | typecheck 无（本仓无 typecheck）/ build 无（无构建）/ unit `# tests 1541 / # pass 1536 / # fail 0 / # skipped 5` + `baseline 38/38` + `0 findings` + `④ markdown 检查通过（402 个文件 / 1726 张表）` + `⑤ .session 结构检查通过（tmp/ 为空）` + `[observable] 扫描 107 个 .md / 未豁免命中 0 行 / 已豁免 6 行 / stale 0 条` + 末行 `check 全部通过`（**16:57 实跑，49.7s**）；另 `rows 73 bad 0` + `gate-record ok（R1/R2/R6 全过；splitting 0）` + `sweep ok` + `check-observable ok`（**16:58 实跑**） |
| 继任自 | `docs/handoffs/2026-11-04-s-c-card-shape-impl.md`（③ 段交接词；本 session 覆盖其 ③→④→⑤ 全段） |
| 状态 | **有 1 个开放问题（见「开放问题」1，属开工第一问）**；磁盘与 git 状态本身可直开工 |

## 项目定位

`d:\Seed\retro-skills` —— 一套「规则 / 技能 / 角色卡生成器」仓库：`rules/` 与 `skills/` 写方法与判据，`tools/docgen/` 把 15 席数据（`tools/docgen/data/`）渲染成 `agents/*.md` 15 张角色卡，`scripts/check-all.mjs` 是总门禁（`npm run check`）。

## 现状

- **已完成**：**S-C 卡面形状 五段全闭环**（② spec → 计划门 → ③ 施工 → ④ 质量 → ⑤ 交付终签）。
  - 5 条门行落在 `skills/dev-workflow/references/gate-record.md`：`②@S-C`（`:100`）/ `②→③@S-C`（`:101`）/ `③@S-C`（`:102`）/ `④@S-C`（`:104`）/ `⑤@S-C`（`:106`）。⚠️ 行号是 16:59 当场打印值，**该文件 LF / CRLF 混用会让行号差 1（已知 G10）**，引用前用 `Select-String` 当场复核。
  - 本批提交区间 `git log --oneline eef963e96c0a2c309c83789e13da5b195b1d4e0c..HEAD | Measure-Object -Line` → **12 行**；末三笔 = `d1826c0`（④ G4/G5 守卫修复）→ `31c27df`（⑤ 门行 + 落点件）→ `36d8e01`（落点并入既有白名单件）。
  - `⑤@S-C` 签字人 = 用户，结论 = `过（2026-11-04，用户终签）`，用户原话已逐字转录在该行结论列。
- **验证证据**：见元信息表『验证基线』（单源，勿重复）。
- **提交状态**：全部已 commit（HEAD 见元信息表）；**本 session 无未提交改动**。
- **工作树异常**：无（`git status --short` 空；`.session/tmp` 文件数 0）。
- **未闭合残留 4 条**（正文在 `docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md` §5，`事项 | 触发 | 谁兜` 三列表）：
  - G6（P2）默认档空跑仍计 pass：`SC-TC-45` / `SC-TC-46` 在非 `SB_SHAPE_ONESHOT=1` 档一条断言不跑。
  - P3 九条（G1–G3、G7–G12），各有独立触发条件。
  - 证据账仍在 `.session/reviews/`（不进 git，换机即失）。
  - G4 / G5（原 P1）**已闭合**，见该文 §5.1。

## 过程记录

- `.session/reviews/2026-11-04-1328-s-c-quality/`（**先读 `progress.md` 尾部**；其余：`quality-4.md`（sdet 结论表 60 条，56 KB）/ `quality-4-audit.md`（审计核对 39 KB）/ `delivery-5-claim.md`（⑤ 申报清单 9 KB）/ `delivery-5-audit.md`（交付审计 52 KB，含 §9 复核轮））
- `.session/reviews/2026-11-04-0840-sc-card-shape-spec-parliament/`（议会全过程账：`progress.md` / `cards.md` / `problems.md` / `detective-round1.md` / `submission.md` / `impact-sheet.md`）
- `skills/dev-workflow/references/gate-record.md`（**先读 S-C 五条门行**；`⑤@S-C` 行含 D1–D11 交付物核验与 N1–N12 数字项复算结果）
- `docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md`（§1–§4 = D6 押后；**§5 = ④ 段 12 条已知限制的落点**）
- 历史交接词链：`docs/handoffs/2026-11-03-card-data-contract-sb-spec.md` → `2026-11-03-sb-contract-impl.md` → `2026-11-04-s-c-card-shape.md`（② 段）→ `2026-11-04-s-c-card-shape-impl.md`（③ 段）→ **本件**
- ⚠️ `.session/` 不进 git：换机器 / 重新克隆后上述两份过程账全部消失（结论已进 `gate-record.md`，但逐条证据没有）

## 本次任务

下一批开工：**先把 S-C 的 4 条残留清账**（其中「迁证据账」「G6 改 `t.skip()`」「把新文件纳入白名单」三件必须与前移 `SC-TC-62` 基线同批做），再按用户在「开放问题 1」里选的功能项走五段主干。
流程：①选批次 / 定范围 → ②spec + 独立 `senior-sdet` testcase + 计划门（不设议会）→ ③施工（每任务一 commit）→ ④质量（独立 sdet 结论表 + 独立审计核对）→ ⑤交付（交付审计 + 用户终签）。
起点：**①（选批次）**；已闭环前置环节 = S-A / S-B / S-C 的 ②③④⑤ 全部，勿重做。

## 范围依据

- 要读：
  - `skills/dev-workflow/references/gate-record.md` 的 `⑤@S-C` 行（先 `Select-String -Pattern '^\| ⑤@S-C'` 打印行号）
  - `docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md` §5（12 行 + §5.1 已闭合 2 行）
  - `tools/docgen/test/sc-card-shape.test.mjs:970-1020`（`SC-TC-62` 的 `AFTER_PATH` / `NEW_PATHS` 9 项 / `M_PREFIXES` 5 项 / `M_REALS` 3 项）
  - 同文件 `:940-957`（`SC-TC-56` 的 `withRepoCopy` 真删真跑形态，G5 修复后的写法）
  - `docs/handoffs/2026-10-31-post-s4-backlog.md:57`（下一批候选 a–e，**可能已过期，见开工前第 5 条**）
  - `skills/dev-workflow/references/stage-1-prd.md`（① 段出口判据与三权）
- 勿重做（已实现，动它即返工）：S-A 数据层（`tools/docgen/components/agentData.mjs` / `seatLoader.mjs` 等）、S-B 契约层（`tools/docgen/card-model/vocab/card-contract.mjs`）、S-C 卡面形状（`tools/docgen/test/sc-card-shape.test.mjs` 60 条用例 + 15 张卡重生成结果）。

## 开放问题

1. **【开工第一问】下一批做哪一项？** 推断：**先做「S-C 残账清账」**（依据：`docs/after/20261104101304-…md` §5 的首行 G6 与 SC-TC-62 的机制——`git diff --name-status eef963e` 里任何新增文件都落在 A 面 9 项白名单之外，会让 `# fail` 变 1，已实测两次；不先解开这个卡点，下一批任何新文件都进不了库），清账完成后再选功能项。功能项候选取自 `docs/handoffs/2026-10-31-post-s4-backlog.md:57` 的 a–e，但**该清单写于 S-C 之前**，至少 (a)「K-8/K-9 接线」疑似已完成（证据：`npm run check` 输出中有用例名「check-all.mjs：卡面 findings 实算（K-8/K-9 接线），旧「非达标证据」句已删」）。请用户：**确认「先清账」+ 从核对后仍有效的候选里选一项**。

## 既定约束（不要重新讨论、不要重新选型）

- 五段主干顺序不可乱序、不可自签出口 —— 出处：`rules/dev-workflow-mainline.md` 的 R1 / R2（R2 = 签字人 ∩ 申报人 = ∅，按 `、+＋，,/` 拆词求交集）。
- 门行唯一证据载体 = `skills/dev-workflow/references/gate-record.md`，固定 6 列；段名单与各段签字人以 PRD §4 段表为唯一来源 —— 出处：`rules/dev-workflow-mainline.md` 的「唯一证据载体」段。
- 写 / 改 spec 必须同批产出独立 `senior-sdet` testcase，且与 spec 一起送审 —— 出处：`rules/spec-testcase-gate.md` 五条判据。
- 判据 / 审计岗禁 `node -e`；取数形态按 testcase §0（`PROBE` / `COPY` / `COPY-取数`）—— 出处：`docs/superpowers/specs/2026-11-03-s-c-card-shape-design-testcase.md` §0。
- 改 `rules/` 或 `skills/` 下任一文件后，必须 touch 当次 `impact-sheet.md` 再跑 `node scripts/scope-sweep.mjs --check`（R8 / G12）—— 出处：`rules/dev-workflow-mainline.md` 的 R8。
- `npm run check` 是唯一总门禁，通过条件 = 末行 `check 全部通过` 且 `# fail 0` 且无 `not ok` —— 出处：`scripts/check-all.mjs`。
- `.session/` 永不进 git；`.session/tmp/` 收尾必须为空 —— 出处：`rules/doc-convention.md` 的「临时记录」节。
- 存量 spec 不追溯、逐个升级 —— 出处：用户 2026-10-18 裁定（`rules/spec-testcase-gate.md`「例外」节承接）。

## 遗留裁决与留观项

- G6（P2）：默认档 `SC-TC-45` / `SC-TC-46` 空跑仍计 pass —— 来源：`.session/reviews/2026-11-04-1328-s-c-quality/quality-4.md` §5；收敛时机：下一批开工（改 `t.skip()` 或显式 skip 名，需用户授权改判）。
- G1–G3、G7–G12（P3 九条）—— 来源：同上；收敛时机：见 `docs/after/20261104101304-…md` §5 各自的「触发」列（分别是 `docs/agents` 下次生成 / spec 下次修订 / 复跑者用带锚点命令 / 直接读 testcase 时 / 单跑用例时 / spec §11.14-15 修订 / 引用门行行号时 / docgen 加正向断言时 / 每次落门行）。
- 证据账迁移：`.session/reviews/2026-11-04-1328-s-c-quality/`（5 文件）+ `2026-11-04-0840-sc-card-shape-spec-parliament/`（6 文件）→ `docs/reports/<主题>-evidence/` —— 来源：`⑤@S-C` 行结论列残余第 4 条；收敛时机：**下一批开工时**（现在迁会让 `SC-TC-62` 红，因新增文件在 A 面白名单外）。

## 开工前先做

1. `git status --porcelain`（期望空）+ 复跑 `npm run check` 并记录实际数字（期望 `# tests 1541 / # pass 1536 / # fail 0 / # skipped 5` + 末行 `check 全部通过`）；数字与元信息表不符时先查清原因再动。
2. `Select-String -Path skills\dev-workflow\references\gate-record.md -Pattern '^\| ⑤@S-C'` 打印真实行号（G10：行号可差 1）并通读该行六列。
3. 读 `docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md` §5 全表（12 行）+ §5.1（已闭合 2 行），确认哪几条要本批闭合。
4. 读 `tools/docgen/test/sc-card-shape.test.mjs:970-1020`，确认改白名单 / 前移 `SB_BASE` 的具体位置；**这一步属判据级改动**，动笔前必须先取得用户授权（R8 要求同批回扫）。
5. 核对 `docs/handoffs/2026-10-31-post-s4-backlog.md:57` 的 a–e 是否仍有效（至少 (a) K-8/K-9 疑似已完成），把过期项标掉，只留真候选给用户选。

## 开场话术

读 `docs/handoffs/2026-11-04-next-batch-kickoff.md`，按交接词继续：先做「开工前先做」5 条并回答开工第一问（下一批做哪项），确认后按五段主干开工。注意：`.session/` 里的两份过程账尚未迁 git，本批开工前要同批迁到 `docs/reports/`。
