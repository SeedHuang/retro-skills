# Session 交接：retro-skills → 下一批开工（S-D 旁路批已闭环）（2026-11-04）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-11-04 18:52（本机时区，Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | **`e977b54`**（`docs(dev-workflow): ⑤@S-D 交付终签（用户原话转录）+ 旁路批首例闭环`）；工作树：**clean**（`git status --porcelain` 实跑 0 行） |
| 验证基线 | typecheck 无（本仓无 typecheck）/ build 无（无构建）/ unit `# tests 1541 / # pass 1534 / # fail 0 / # skipped 7` + `baseline 38/38` + `0 findings` + `④ markdown 检查通过（417 个文件 / 1808 张表）` + `⑤ .session 结构检查通过（一级只含封闭清单档位；tmp/ 为空）` + `[observable] 扫描 107 个 .md / 未豁免命中 0 行 / 已豁免 6 行 / stale 0 条` + 末行 `check 全部通过`（**18:52 实跑**）；另 `rows 79 bad 0` + `gate-record ok（R1/R2/R6 全过；splitting 0）` + `sweep ok` + `check-observable ok` + `命名检查通过（docs）` + `check-plan deps → nodes 6 / edges 7`（18:52 实跑） |
| 继任自 | `docs/handoffs/2026-11-04-next-batch-kickoff.md`（上一批收口词；本 session 覆盖其指派的 4 条残账 + 1 项功能项全段） |
| 状态 | **有 1 个开放问题（见「开放问题」1，属开工第一问）**；磁盘与 git 状态本身可直开工 |

## 项目定位

`d:\Seed\retro-skills` —— 一套「规则 / 技能 / 角色卡生成器」仓库：`rules/` 与 `skills/` 写方法与判据，`tools/docgen/` 把 15 席数据（`tools/docgen/data/seats/`）渲染成 `agents/*.md` 15 张角色卡，`scripts/check-all.mjs` 是总门禁（`npm run check`）。

## 现状

- **已完成：S-D 批（本仓第一个「旁路批」）五段全闭环** —— ① 旁路 → ② 旁路 → 计划门 → ③ 施工 → ④ 质量 → ⑤ 交付终签。
  - 6 条门行落在 `skills/dev-workflow/references/gate-record.md`：`①@S-D` / `②@S-D` / `②→③@S-D` / `③@S-D` / `④@S-D` / `⑤@S-D`。⚠️ **行号必须当场打印**（该文件 LF / CRLF 混用，已知 G10）：
    `Select-String -Path skills\dev-workflow\references\gate-record.md -Pattern '^\| [①②③④⑤]@S-D|^\| ②→③@S-D'`
  - 本批提交区间 `git log --oneline cda896f^..HEAD` → **11 行**（`cda896f` T0 → `e977b54` ⑤ 终签）；数字取法 = `... | Measure-Object -Line`。
  - `⑤@S-D` 签字人 = 用户，结论 = `过（2026-11-04，用户终签）`，用户原话 `通过（按审计结论终签）` 已逐字转录在该行结论列。
  - **五条残账兑付**：T0 ⑤ 收口 2 件进库（`cda896f`）／T1 `SC-TC-62` 开区间→闭区间（`e153d33`，上界冻结 `cda896f`）／T2 G6 `SC-TC-45/46` 改 `t.skip()`（`93c78cd`，全仓 `# skipped 5→7`）／T3 S-C 证据账 11 件迁 `docs/reports/2026-11-04-s-c-card-shape-evidence/`（`148f82c`，含映射 README）／T4 死代码两件删除（`9f83862` + `42705fa`，−77 行）。
  - **施工中额外修掉 3 处真缺陷**（原不在 plan 内，均当场红绿取证，详见 plan §2「施工期实情 1 / 2」与 §5）：① 行号守卫的 `STRUCT_REPLACED` 命中判定原先在「解析成功之后」才生效 → 表达不了「整文件删除」（实测 6 处历史引用落 `missing`），已**前移到解析前**（`skills/managing-lessons-store/scripts/lessons.test.mjs:1800-1812`）；② `S3-TC-K07 不改面` 是第二枚同根炸弹（开区间判「历史件不许改」→ 任何批次改 `docs/after` 就红），已冻结 `S3_HEAD=90083cd`（`tools/docgen/test/s3-predicates.test.mjs:50`）；③ `S4-TC-H03` 只累加 numstat 新增列 → 纯删除提交判 0，已改「改动行数 = 增 + 删」（`tools/docgen/test/card-render.test.mjs:357-363`）。
- **验证证据**：见元信息表『验证基线』（单源，勿重复）。
- **提交状态**：全部已 commit（HEAD 见元信息表）；本 session 无未提交改动。
- **工作树异常**：无（`git status --porcelain` 空；`.session/tmp` 文件数 0）。
- **本批唯一未闭合项（P3，已进 `⑤@S-D` 残余列）**：本批过程账 `impact-sheet.md` 仍住 `.session/reviews/2026-11-04-s-d/`（不进 git，换机即失）→ 见「遗留裁决与留观项」第 1 条。

## 过程记录

- `docs/superpowers/plans/2026-11-04-s-d-residuals-and-dead-code.md`（**本批 plan 也是本批的完整施工记录**：§1 旁路自证 / §2 任务表含两条「施工期实情」/ §3 白名单 26 行 / §5 每处改判的红绿取证要求 / §6 已知限制 8 行 / §7 执行记录 6 行）
- `docs/reports/2026-11-04-s-d-bypass-audit.md`（①② 旁路判定的独立审计记录，127 行；判「旁路成立」并当场抓出 3 条真问题）
- `docs/reports/2026-11-04-s-c-card-shape-evidence/`（S-C 的 ④/⑤ 段与议会证据账 **11 件 + `README.md` 映射表**，已进 git；先读 `README.md` §1 映射与 §2「同批只改了哪几处路径字符串」）
- `.session/reviews/2026-11-04-s-d/impact-sheet.md`（本批 R8 改判影响清单：33 口径 + 22 命中文件 + 6 处判据级改动逐条处置；**`.session/` 不进 git**）
- `skills/dev-workflow/references/gate-record.md`（**先读 6 条 S-D 门行**；`⑤@S-D` 行含 D1–D6 逐交付物核验与 P3 三条）
- `docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md`（§1–§4 = D6 押后；**§5 主表 9 行未闭合**（G1/G2/G3/G7/G8/G9/G10/G11/G12）+ **§5.1 4 行已闭合**（G4/G5/G6/时限炸弹））
- 历史交接词链：`2026-11-03-card-data-contract-sb-spec.md` → `2026-11-03-sb-contract-impl.md` → `2026-11-04-s-c-card-shape.md`（② 段）→ `2026-11-04-s-c-card-shape-impl.md`（③ 段）→ `2026-11-04-next-batch-kickoff.md`（S-C ⑤ 收口 + 本批指派）→ **本件**
- ⚠️ `.session/` 不进 git：换机器 / 重新克隆后上述 2 处账消失（结论已进 `gate-record.md` / plan，逐条证据只有 `.session` 与 `docs/reports/` 两份）

## 本次任务

下一批开工：**先清 S-D 遗留的 1 条 P3（本批 impact-sheet 迁 `docs/reports/`），再按用户在「开放问题 1」里选的功能项走五段主干**。
流程：①选批次 / 定范围 → ②spec + 独立 `senior-sdet` testcase + 计划门（不设议会）→ ③施工（每任务一 commit）→ ④质量（独立 sdet 结论表 + 独立审计核对）→ ⑤交付（交付审计 + 用户终签）。
**是否走 PRD §4.2 旁路**由独立审计判（`docs/prd/20261024073606-dev-workflow-mainline/index.md:313-337`），不许主 agent 自判（`:335`）。
起点：**①（选批次）**；已闭环前置环节 = S-A / S-B / S-C / S-D 的 ②③④⑤ 全部，勿重做。

## 范围依据

- 要读：
  - `docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md` §5 主表 9 行（每条两列「触发 / 谁兜」）+ §5.1 4 行（别把已闭合的当欠账）
  - `docs/handoffs/2026-10-31-post-s4-backlog.md:57`（下一批候选 a–e；**2026-11-04 18:5x 复核结论**：`(a) K-8/K-9 接线` **已完成**〔`scripts/check-all.mjs:433` 已是 `collectCardFindings()` 实算〕，**`(b)` / `(d)` / `(e)` 实测仍有效**）
  - `docs/after/20261031111000-senior-sdet-boundary-conflict-open-decisions.md` §六（`(b)` S6-B 结构收敛的唯一入口）
  - `docs/after/20261031165047-agent-card-s4-open-items.md` `:15`（`(d)` S4-L2「删本席 must/never 源条目会静默重建，逐席条目数无基线」）、`:29`（`(e)` S4-L4「senior-sdet 的 dimension 为空」）
  - `tools/docgen/test/sc-card-shape.test.mjs:43`（`BASE_HEAD` 冻结值）与 `tools/docgen/test/s3-predicates.test.mjs:50`（`S3_HEAD` 冻结值）——**新批的回退面判据不要指望这两条**
  - `skills/managing-lessons-store/scripts/lessons.test.mjs:1768-1774`（`STRUCT_REPLACED` 3 条）与 `:1800-1812`（前移后的豁免判定）
- 勿重做（已实现，动它即返工）：S-A 数据层（`tools/docgen/data/seats/*.json` / `seatLoader.mjs`）、S-B 契约层（`card-model/vocab/card-contract.mjs`）、S-C 卡面形状（`tools/docgen/test/sc-card-shape.test.mjs` 60 条 + 15 张卡）、S-D 五段闭合项（4 条残账 + 死代码删除 + 3 处实施修正）、S-C 证据账迁移。

## 开放问题

1. **【开工第一问】下一批做哪一项？** 推断：**先清 1 条 P3（impact-sheet 迁 `docs/reports/`，作 Task 0），再从 `(e)` 起手**——依据三条：① `(e)` 改动面最小（1 处数据 + 重生成 16 份投影），且空值位置实测三处在位：`tools/docgen/data/seats/senior-sdet.json` 无 `dimension` 键（`grep` 命中 0）、`docs/agents/senior-sdet.md:4` 是空的「- 维度：」、`docs/agents/README.md:19` 该格为空（其余 14 席均有，取样 `tools/docgen/data/seats/reviewer-audit.json` = `"dimension": "独立（标准核对）"`）；② **做 `(e)` 必然重生成 `docs/agents/**` = `docs/after` §5 的 G1 行的触发条件**（G1 = 人设身份句同义资历表述漏检，`docs/agents/senior-sdet.md` 首句「有十年以上经验的测试开发工程师。」逃过 V9 词面），故 `(e)` 与 G1 **必须同批处置**，否则触发条件被触发又被忽略 = 漂移；③ `(b)` S6-B 范围最大（要动模板去「评审席」化 + 按席排除禁写组），`(d)` 要新增判据与基线段。**请用户：确认「先清 P3 + 做 (e) 并同批处理 G1」，或改选 (b)/(d)/§5 内其它可做项。**
2. 若选 `(e)`：`dimension` 取什么值？推断：**`'测试设计'`**——依据 = `agents/senior-sdet.md:11` 的关注类别是测试设计面，且现有取值口径为短名词（`'产品设计'` / `'技术实现'` / `'独立（标准核对）'`）。**请用户：确认值或改正**（非开工第一问，做到该项时再定）。

## 既定约束（不要重新讨论、不要重新选型）

- 五段主干顺序不可乱序、不可自签出口 —— 出处：`rules/dev-workflow-mainline.md` 的 R1 / R2（R2 = 签字人 ∩ 申报人 = ∅，按 `、+＋，,/` 拆词求交集）。
- 旁路成立的两条判据 + 「主 agent 自判即违规」 —— 出处：`docs/prd/20261024073606-dev-workflow-mainline/index.md:317-320` 与 `:335`。
- 门行唯一证据载体 = `skills/dev-workflow/references/gate-record.md`，固定 6 列；段名单与各段签字人以 PRD §4 段表为唯一来源 —— 出处：`rules/dev-workflow-mainline.md` 的「唯一证据载体」段。
- 写 / 改 spec 必须同批产出独立 `senior-sdet` testcase，且与 spec 一起送审 —— 出处：`rules/spec-testcase-gate.md` 五条判据（旁路批不产生 spec/testcase，故该条只在非旁路时生效）。
- 改 `rules/` 或 `skills/` 下任一文件后，必须 touch 当次 `impact-sheet.md` 再跑 `node scripts/scope-sweep.mjs --check`（R8 / G12）；**本条是本批最常踩的坑**：改完 `gate-record.md` 忘记再 touch → `sweep` 报 `FAIL: impact-sheet 早于被扫文件`，连带 4 条 sweep 类用例一起红。
- `npm run check` 是唯一总门禁，通过条件 = 末行 `check 全部通过` 且 `# fail 0` 且无 `not ok` —— 出处：`scripts/check-all.mjs`。
- 门行 / 测试文件里**不许写 `skills/<技能名>/…` 前缀路径**（撞 skill-inspector 的「自引用带前缀 / 跨技能路径引用」，会让 `# fail` 非 0），要写相对形式或只写文件名 —— 出处：`agents/skill-inspector` 技能 `scripts/check.mjs` 的两条 check；本批踩过两次。
- **不许在 md 里写裸 `<名>.test.mjs:<行号>`**（除非该文件全仓唯一且名字就是它）：裸 `test.mjs` / 裸 `cli.mjs` 会让行号守卫判 `missing` / `ambiguous` —— 出处：`skills/managing-lessons-store/scripts/lessons.test.mjs:1799` 起的正则与 `findByName`。
- `.session/` 永不进 git；`.session/tmp/` 收尾必须为空 —— 出处：`rules/doc-convention.md` 的「临时记录」节。
- 存量 spec 不追溯、逐个升级 —— 出处：用户 2026-10-18 裁定（`rules/spec-testcase-gate.md`「例外」节承接）。
- **新批的回退面判据要自己立**：`SC-TC-62`（冻结在 `cda896f`）与 `S3-TC-K07`（冻结在 `90083cd`）现在都只核各自那批的历史面，不再约束新批 —— 出处：`docs/superpowers/plans/2026-11-04-s-d-residuals-and-dead-code.md` §6 第 1 行。

## 遗留裁决与留观项

- **S-D P3 ③（本批唯一未闭合项）**：`.session/reviews/2026-11-04-s-d/impact-sheet.md` 仍在 `.session/`（不进 git）—— 来源：`gate-record.md` 的 `⑤@S-D` 结论列残余 ③；收敛时机：**下一批开工时**（按 `⑤@S-B` P2-2 / `⑤@S-C` 残余 ④ 同款口径整目录迁 `docs/reports/<主题>-evidence/`，只改路径字符串不改结论）。
- G1 / G2 / G3 / G7 / G8 / G10 / G11 / G12（8 条 P3）—— 来源：`docs/after/20261104101304-…md` §5 主表；收敛时机：见各行「触发」列（其中 **G1 的触发 = 下一次 `docs/agents` 生成**，与 `(e)` 同批）。
- `(b)` S6-B 结构收敛 / `(d)` S4-L2 逐席条目数基线 —— 来源：`docs/handoffs/2026-10-31-post-s4-backlog.md:57` 与两份 `docs/after`；收敛时机：立项时。
- `STRUCT_REPLACED` 裸名按 basename 匹配的**误豁免风险** —— 来源：plan §6 倒数第 2 行；收敛时机：出现与已删件同名的新文件时（新增登记前须确认 basename 仍唯一）。
- 旁路 ④「不新增用例」使 S-D 三处改判只有「既有回归 + 注入取证」做证据（无专用新用例）—— 来源：plan §6 末行；收敛时机：后续批复核本批改判时按 plan §5 逐处复算红绿两档。

## 开工前先做

1. `git status --porcelain`（期望 0 行）+ 复跑 `npm run check` 并记录实际数字（期望 `# tests 1541 / # pass 1534 / # fail 0 / # skipped 7` + `baseline 38/38` + 末行 `check 全部通过`，约 48 s）；数字与元信息表不符时先查清原因再动。
2. `Select-String -Path skills\dev-workflow\references\gate-record.md -Pattern '^\| [①②③④⑤]@S-D|^\| ②→③@S-D'` 打印 6 行门行真实行号（G10：LF / CRLF 混用会让行号差 1）并通读 `⑤@S-D` 行六列。
3. 读 `docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md` §5 主表 9 行 + §5.1 4 行，确认哪几条要本批闭合（注意 G1 与 `(e)` 绑定）。
4. 核对 `docs/handoffs/2026-10-31-post-s4-backlog.md:57` 的 a–e 是否仍有效：`(a)` 已完成（`scripts/check-all.mjs:433` 为 `collectCardFindings()` 实算，旧「非达标证据」句已删），只留 `(b)(d)(e)` 给用户选。
5. 若选 `(e)`：读现行载体 `tools/docgen/data/seats/senior-sdet.json`（**S4-L4 原文写的是 `agentData.mjs`，该载体已由 S-A T3 迁为 `data/seats/*.json`，按旧路径找会空**）、`tools/docgen/data/seats/reviewer-audit.json` 的 `dimension` 取值样例、`agents/senior-sdet.md` 与 `docs/agents/senior-sdet.md:4` 的空「- 维度：」、`docs/agents/README.md:19` 空格；再预读 §5 的 G1 行（补 dimension 必重生成 `docs/agents/**` = G1 触发）。

## 开场话术

读 `docs/handoffs/2026-11-04-next-batch-after-s-d.md`，按交接词继续：先做「开工前先做」5 条并回答开工第一问（下一批做哪项），确认后按五段主干开工。注意 S-D 遗留了 1 条 P3（`.session/reviews/2026-11-04-s-d/impact-sheet.md` 待迁 `docs/reports/`），本批开工时一并清掉。
