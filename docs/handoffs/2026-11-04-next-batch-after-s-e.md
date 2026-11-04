# Session 交接：retro-skills → 下一批开工（S-E 旁路批已闭环）（2026-11-04）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-11-04（本机时区，Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | 最后一笔**实质**提交 = `e3e3126`（`docs(dev-workflow): ⑤ 段交付证据（申报清单 + 交付审计，判可终签）+ ③ 行路径串同步`）；本交接词自身所在提交是其后续一笔，取法 = `git rev-parse --short HEAD` 当场打印 |
| 验证基线 | typecheck 无 / build 无 ／ unit `# tests 1541 / # pass 1534 / # fail 0 / # skipped 7` + `baseline 38/38` + `0 findings` + `④ markdown 检查通过（429 个文件 / 1880 张表）` + `⑤ .session 结构检查通过（tmp 为空）` + `[observable] 扫描 107 个 .md / 未豁免命中 0 行 / 已豁免 6 行 / stale 0 条` + 末行 `check 全部通过`；另 `rows 85 bad 0` + `gate-record ok（R1/R2/R6 全过；splitting 0）` + `sweep ok` + `counts.I34:0` + `check-observable ok` + `命名检查通过（docs）` + `check-plan deps → nodes 6 / edges 6`（2026-11-04 末次实跑，含本交接词自身）。**注**：④ 的文件 / 表数会随下批新增 md 漂移，以当场 `npm run check` 为准，勿钉死 |
| 继任自 | `docs/handoffs/2026-11-04-next-batch-after-s-d.md`（上一批收口词；本 session 覆盖其「开工第一问」指派：清 S-D 残余 P3 + `(e)` + G1） |
| 状态 | **有 1 个开放问题（见「开放问题」1，属开工第一问）**；磁盘与 git 状态本身可直开工（`git status --porcelain` 0 行） |

## 项目定位

`d:\Seed\retro-skills` —— 「规则 / 技能 / 角色卡生成器」仓库：`rules/` 与 `skills/` 写方法与判据，`tools/docgen/` 把 15 席数据（`tools/docgen/data/seats/`）渲染成 `agents/*.md` 15 张角色卡 + `docs/agents/**` 16 份投影，`scripts/check-all.mjs` 是总门禁（`npm run check`）。

## 现状

- **已完成：S-E 批（本仓第二个旁路批）五段全闭环** —— ① 旁路 → ② 旁路 → 计划门 → ③ 施工 → ④ 质量 → ⑤ 交付终签。
  - 6 条门行落在 `skills/dev-workflow/references/gate-record.md`（`①@S-E` / `②@S-E` / `②→③@S-E` / `③@S-E` / `④@S-E` / `⑤@S-E`）。⚠️ **行号必须当场打印**（该文件 LF / CRLF 混用，已知 G10）：`Select-String -Path skills\dev-workflow\references\gate-record.md -Pattern '^\| [①②③④⑤]@S-E|^\| ②→③@S-E'`。
  - 本批提交区间：`a495656..HEAD` = **5 笔**（`4fa7bd7` T1–T4 施工 → `142c6b9` T0 + plan + ①②②→③ 门行 → `a0d56c0` ③ 段 → `2b0ad34` ④ 段 → `e3e3126` ⑤ 证据）。
  - `⑤@S-E` 签字人 = 用户，结论 = `过（2026-11-04，用户终签）`，用户原话 `通过（按审计结论终签）` 已逐字转录。
  - **四件交付**：① Task 0 = S-D 残余 ③ 迁账（1 件 + 映射 README，`git hash-object` 前后相等 `c9740b50…`）；② `senior-sdet` 补 `dimension='测试设计'`（`sdet-data.test.mjs` 的「不得有该键」断言翻转为「值逐字相等」）；③ G1 双修（`rationale` 首句去资历表述 + V9 词面加 `十年`，三面计数 0）；④ `S4-TC-B04` 加「每席维度格非空」断言（红档实跑复现，报错点名席名与列名）。
  - **R8**：`keywords.json` 加 `I34` 并 `--freeze`（`counts.I34 = 0`；另 `I27 7→6` / `I31 10→0` / `I33 1→0` 系实况下降，三条取证已写进 plan §7 T4）。
  - **两条 `docs/after` 闭合**：G1 移入 `docs/after/20261104101304-…md` §5.1；`S4-L4` 从 `docs/after/20261031165047-…md` 整节删除（头部计数 4 → 3 条限制）。
- **验证证据**：见元信息表『验证基线』（单源，勿重复）。
- **提交状态**：全部已 commit（HEAD 见元信息表）；本 session 无未提交改动。

## 过程记录

- `docs/superpowers/plans/2026-11-04-s-e-dimension-and-persona-wordface.md`（**本批 plan 也是完整施工记录**：§1 旁路自证 / §2 任务表 / §2.1 六节（`check-plan deps` 的机械证据位）/ §3 白名单 21 行 / §4 不改清单 / §5 红绿取证 / §5.1 **R8 处置摘要（进 git 的可核副本）** / §6 五行已知限制 / §7 执行记录）
- `docs/reports/2026-11-04-s-e-bypass-audit.md`（①② 旁路判定独立审计；首轮即抓出 **7 条真问题**，含 P1「`check-plan deps` 对本 plan 判 `nodes 0 / edges 0 => fail`」）
- `docs/reports/2026-11-04-s-e-plan-gate.md`（计划门两轮；首轮 P1-A 曾使全仓 `# fail 3`（门行里带了技能名前缀的自引用路径 + 主观词），已闭）
- `docs/reports/2026-11-04-s-e-quality-evidence/`（**④ / ⑤ 段证据账 5 件**：`quality-4.md` / `quality-4-audit.md` / `step-3-audit.md`（③ 段审计，由 `.session` 迁入）/ `delivery-5-claim.md` / `delivery-5-audit.md`）
- `docs/reports/2026-11-04-s-d-evidence/`（S-D 的 impact-sheet 迁档 + 映射 README；本批 Task 0 建的）
- `.session/reviews/2026-11-04-s-e/impact-sheet.md`（本批 R8 正本：33 口径 + 22 命中文件 + 4 处判据级改动 + 13 条 touch 记录；**`.session/` 不进 git**）
- `skills/dev-workflow/references/gate-record.md`（**先读 6 条 S-E 门行**；`⑤@S-E` 行含残余 4 条）
- `docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md`（§1–§4 = D6 押后；§5 主表 **8 行未闭合**（G2/G3/G7/G8/G9/G10/G11/G12）+ §5.1 **6 行已闭合**（G4/G5/G6/时限炸弹/G1））
- 历史交接词链：`2026-11-04-s-c-card-shape.md`（②）→ `…-impl.md`（③）→ `2026-11-04-next-batch-kickoff.md`（S-C ⑤ 收口）→ `2026-11-04-next-batch-after-s-d.md`（S-D 收口 + 本批指派）→ **本件**
- ⚠️ `.session/` 不进 git：换机器 / 重新克隆后本批 `impact-sheet.md` 消失（结论已在 `gate-record.md` 与 plan §5.1 两份）

## 本次任务

下一批开工：**先迁 S-E 的 R8 正本（`.session/reviews/2026-11-04-s-e/impact-sheet.md` → `docs/reports/2026-11-04-s-e-quality-evidence/impact-sheet.md` + 映射 README），再按用户在「开放问题 1」里选的功能项走五段主干**。
流程：①选批次 / 定范围 → ②spec + 独立 `senior-sdet` testcase + 计划门（不设议会）→ ③施工（每任务一 commit）→ ④质量（独立 sdet 结论表 + 独立审计核对）→ ⑤交付（交付审计 + 用户终签）。
**是否走 PRD §4.2 旁路**由独立审计判（`docs/prd/20261024073606-dev-workflow-mainline/index.md:313-337`），不许主 agent 自判（`:335`）。
起点：**①（选批次）**；已闭环前置环节 = S-A / S-B / S-C / S-D / S-E 全部段，勿重做。

## 范围依据

- 要读：
  - `docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md` §5 主表 8 行（每条「触发 / 谁兜」）+ §5.1 6 行（别把已闭合的当欠账）
  - `docs/handoffs/2026-10-31-post-s4-backlog.md:57`（下一批候选 a–e；**2026-11-04 22:xx 复核**：`(a)` 已完成、`(c)` 已由 S-D 清掉、`(e)` **本批已完成** → 仍有效的只剩 **`(b)` S6-B 结构收敛** 与 **`(d)` S4-L2 逐席条目数基线**）
  - `docs/after/20261031111000-senior-sdet-boundary-conflict-open-decisions.md` §六（`(b)` 的唯一入口）
  - `docs/after/20261031165047-agent-card-s4-open-items.md:15`（`(d)` S4-L2「删本席 must/never 源条目会静默重建，逐席条目数无基线」）
  - `tools/docgen/test/sc-card-shape.test.mjs:43`（`BASE_HEAD` 冻结值）与 `tools/docgen/test/s3-predicates.test.mjs:50`（`S3_HEAD` 冻结值）——**新批的回退面判据不要指望这两条**
  - `skills/managing-lessons-store/scripts/lessons.test.mjs:1768-1774`（`STRUCT_REPLACED` 3 条）与 `:1800-1812`（前移后的豁免判定）
- 勿重做（已实现，动它即返工）：S-A 数据层、S-B 契约层、S-C 卡面形状、S-D 五段闭合项、S-E 的 `dimension` / G1 词面 / B04 非空 / `I34` 登记、S-C 与 S-D 两次证据账迁移。

## 开放问题

1. **【开工第一问】下一批做哪一项？** 推断：**`(b)` S6-B 结构收敛**（模板去「评审席」化 + 按席排除禁写组）——依据三条：① `(d)` 要先定「逐席条目数基线」的口径（基线值本身无机械来源，属需要用户/产品裁定的内容项），`(b)` 的口径已写在 `docs/after/20261031111000-…md` §六，可直接进 ②；② §5 剩余 8 条 P3 里，G3/G10 是复跑者自查型（不立项也能守）、G11 已被 S-E 的 B04 断言部分覆盖、G2/G7/G8/G9 只在「改对应文件时」触发，**都不构成独立批次**；③ `(b)` 与 S-E 同属「模板/投影面」族，可复用本批刚验过的叫法（`gate` 判漏生成、B04 判空格）。**请用户：确认 `(b)`，或改选 `(d)` / §5 内其它可做项 / 新需求。**
2. 若选 `(b)`：`S6-B` 的「按席排除禁写组」以什么为准（`tools/docgen/policy/**` 的现有禁写组，还是 §六 列的清单）？推断：以 §六 原文为唯一源，不在本批新造清单。**请用户：确认或改正**（非开工第一问，做到该项时再定）。

## 既定约束（不要重新讨论、不要重新选型）

- 五段主干顺序不可乱序、不可自签出口 —— 出处：`rules/dev-workflow-mainline.md` 的 R1 / R2。
- 旁路成立的两条判据 + 「主 agent 自判即违规」 —— 出处：`docs/prd/20261024073606-dev-workflow-mainline/index.md:317-320` 与 `:335`。
- 门行唯一证据载体 = `skills/dev-workflow/references/gate-record.md`，固定 6 列。
- 写 / 改 spec 必须同批产出独立 `senior-sdet` testcase，且与 spec 一起送审 —— 出处：`rules/spec-testcase-gate.md`（旁路批不产生 spec/testcase，故只在非旁路时生效）。
- 改 `rules/` 或 `skills/` 下任一文件后，必须 touch 当次 `impact-sheet.md` 再跑 `node scripts/scope-sweep.mjs --check`（R8 / G12）；**本条是最常踩的坑**：改完 `gate-record.md` 忘记再 touch → `sweep` 报 `FAIL: impact-sheet 早于被扫文件`，连带 4 条 sweep 类用例一起红。
- `npm run check` 是唯一总门禁，通过条件 = 末行 `check 全部通过` 且 `# fail 0` 且无 `not ok`。
- 门行 / 测试文件里**不许写 `skills/<技能名>/…` 前缀路径**（撞 skill-inspector 的自引用守卫），也不许出现主观词（如 `严格`）——本批计划门首轮因此 `# fail 3`。
- **不许在 md 里写裸 `<名>.test.mjs:<行号>`**（裸 `test.mjs` / 裸 `cli.mjs` 会被行号守卫判 `missing` / `ambiguous`）。
- **改已终签门行只许追加在「核了什么」格**，运行时不得碰「结论」格；同类动作逐次报批 —— 用户 2026-11-04 裁定（本批 T0 那处不回滚）。
- `.session/` 永不进 git；`.session/tmp/` 收尾必须为空。
- 存量 spec 不追溯、逐个升级 —— 用户 2026-10-18 裁定。
- **新批的回退面判据要自己立**：`SC-TC-62`（冻结 `cda896f`）与 `S3-TC-K07`（冻结 `90083cd`）只核各自那批的历史面。

## 遗留裁决与留观项

- **S-E 残余 ①**：`impact-sheet.md` 仍住 `.session/reviews/2026-11-04-s-e/` → 收敛时机 = **下一批开工时**，整目录迁 `docs/reports/2026-11-04-s-e-quality-evidence/`，迁移 README 写明「复算需 `--impact` 显式指定」（理由：迁走后 `findImpactSheet()` 返回 null，`sweep --check` 会红）。
- **S-E 残余 ②**：T0 曾在已终签的 `⑤@S-D` 行「结论」格尾追加兑付句 → **不回滚**，规则见「既定约束」第 9 条（用户 2026-11-04 裁定）。
- **S-E 残余 ③**：一次**未归因**的 `# fail 1`（⑤ 交付审计 14 次复跑中 2 次：1 次未取到 `not ok` 行名、1 次为审计席自身临时日志 / 表格列数所致；末次门禁绿）。**触发**：再次出现；**谁兜** = 拿到 `not ok` 行名的人（先打印行名再过滤）。
- **S-E 残余 ④**：旁路 ④ 不新增用例，三处改判只有「既有回归 + 注入取证」→ 触发：后续批复核；谁兜 = 复核者按 plan §5 复算红绿两档。
- G2 / G3 / G7 / G8 / G9 / G10 / G11 / G12（8 条 P3）—— 来源：`docs/after/20261104101304-…md` §5 主表；收敛时机：见各行「触发」列。
- `(b)` S6-B / `(d)` S4-L2 —— 来源：`docs/handoffs/2026-10-31-post-s4-backlog.md:57` 与两份 `docs/after`；收敛时机：立项时。

## 开工前先做

1. `git status --porcelain`（期望 0 行）+ 复跑 `npm run check` 并记录实际数字（期望 `# tests 1541 / # pass 1534 / # fail 0 / # skipped 7` + `baseline 38/38` + 末行 `check 全部通过`）；数字与元信息表不符先查清再动。
2. `Select-String -Path skills\dev-workflow\references\gate-record.md -Pattern '^\| [①②③④⑤]@S-E|^\| ②→③@S-E'` 打印 6 行真实行号（G10：LF / CRLF 混用会让行号差 1）并通读 `⑤@S-E` 行六列。
3. 迁 S-E 的 R8 正本：`Copy-Item .session\reviews\2026-11-04-s-e\impact-sheet.md docs\reports\2026-11-04-s-e-quality-evidence\impact-sheet.md` → 先算 `git hash-object` 前后相等 → 写映射 README（照 `docs/reports/2026-11-04-s-d-evidence/README.md` 的 §1–§3 格式）→ 删 `.session/reviews/2026-11-04-s-e/`；**若本批要做任何 `sweep` 判定，须在同一步先建新批 `.session/reviews/<新批>/impact-sheet.md`**，否则 `findImpactSheet()` 找不到当次清单。
4. 读 `docs/after/20261104101304-…md` §5 主表 8 行 + §5.1 6 行，确认哪几条要本批闭合。
5. 核对 `docs/handoffs/2026-10-31-post-s4-backlog.md:57` 的候选：现有效 = `(b)` / `(d)`；`(a)` 已完成（`scripts/check-all.mjs:433` 为 `collectCardFindings()` 实算）、`(c)` 已删、`(e)` 本批已完成（`docs/agents/README.md:19` 维度格已非空）。

## 开场话术

读 `docs/handoffs/2026-11-04-next-batch-after-s-e.md`，按交接词继续：先做「开工前先做」5 条（含迁 S-E 的 R8 正本）并回答开工第一问（下一批做哪项），确认后按五段主干开工。
