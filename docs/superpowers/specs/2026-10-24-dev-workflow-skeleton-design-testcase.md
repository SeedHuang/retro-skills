# 测试用例：开发工作流主干 S1 骨架落地

> 归属 spec：`docs/superpowers/specs/2026-10-24-dev-workflow-skeleton-design.md`（split from `docs/prd/20261024073606-dev-workflow-mainline/index.md` 2026-10-24）
> 编写者：`senior-sdet` 子代理｜**独立性声明**：本文件由独立子代理在全新上下文编写，未参与 spec 设计，也未参与施工
> 编写日期：2026-10-24
> **修订日期 2026-10-24：对齐 spec v5（议会第 2 轮审计后）**：V-14 → 新增 **TC-A14**（`SKILL.md` ① 段过渡口径三要素 + 「S2」失效条件）；F22 → 新增 **TC-E33**（删「代拟者不签字」→ 三命中变两命中必红）；C3 默认常量 **两个 → 三个**（含 `DEFAULT_EXPLORE_NONE`）→ 同步 **TC-B11** 前置与步骤④（该常量文本只在 `patternRegistry` 出现一次）。计数 77 → **79**（正 34 / 负 35 / 边 10）
> **修订日期 2026-10-24（对齐 spec v4／议会第 1 轮答辩后）**：V-2 → **7 份**（+`gate-record.md` 六列表头）、V-3 → **三列 + 段顺序**、§7.5 → **12 处**（+`data.test.mjs:50` 同行注释）、V-8 证据改用 `gate`（**删除 `render13-snapshot.mjs` 依赖**）、C5 BASE_KEYS → **`domain` + `boundary` + `explorePolicy`**、C11 自由探索槽位、P-7 运行时就位、R1–R7 + 例外节 + 议会有条件、D3 扩到**规则数量**、F1–F21、V-1～V-13 → 新增 TC-A10 / A11 / A12 / A13 / B11 / B12 / D09 / E27 / E28 / E29 / E30 / E31 / E32
> 上一版（对齐 spec 三版）：P-5 扩为 **C1–C10**（C10 = `tools/docgen/templates/agent.md.tpl` 的「边界」句改为槽位 `{{BOUNDARY}}`，默认值 = 现句）、P-6 补 **D1–D3** 明细（依赖集合恰等 / README 不再写死技能数量）、§3.2 新增「脚本未落地期的写法」（判据 + 二选一证据）、新增 **F14 / F15 / V-11** → 新增 TC-B10 / TC-D08 / TC-E26，改 TC-A09 / TC-E22 / TC-E23 / TC-E24
> 上一版（对齐 spec 二版）：references 5→6 份、§7.5 三处→11 处一律派生化、新增 C9 / V-9 / V-10 / F11–F13、`evidence-reader` 已定名
> 状态：**定稿**（随 spec 一起送议会；评审意见以议会卡为准）
> 定稿附注（原「草稿 → 定稿」条件，本轮已满足）：每条用例五要素齐 + 负例与边界条数 ≥ 正例 + 覆盖总表每行可回溯到 spec 节号 / V 编号 / F 编号 / C 编号
> 运行环境：Node ≥ 22（`node --test` / `node -e`）/ Windows PowerShell 5.1（命令按 PowerShell 语法给出，**命令串内不使用反引号**——反引号在 PS 双引号串里是转义符）/ `npm run check`（执行体 = `node scripts/check-all.mjs`，环节：①语法 ②全仓测试 ②.5 docgen gate ②.6 执行力度矩阵 ③skill-inspector ④markdown）

**本文件只写「验什么、怎么判、证据长什么样」，不含测试代码。** 测试代码由 plan 的 Task 实现；负例与边界用例是回归资产，必须在 plan 里落成可重跑的断言，不能只留在本文件。

## 0 输入与不测清单

| 项 | 内容 |
|---|---|
| spec 全文 | `docs/superpowers/specs/2026-10-24-dev-workflow-skeleton-design.md`（§0–§11 已逐节读，**五版**；重点回核 §2 P-2 / P-5 / P-6 / P-7 明细、§3.1「议会有条件」与「过渡口径（S2 前有效）」、§3.2「读→产出」闭环、§4 三条硬约束 + 机器判据、§5 R1–R7 与例外节、§7.1 C1–C11（C3 = **三个默认常量**）、§7.3 `domain` 归一化与 `DOMAIN` 回落、§7.5 **12 处**、§9 V-1～V-14） |
| PRD 回核点 | PRD §4 段表（**两格已统一为 PRD 原文**：`无议会` / `；`，唯一真相 = PRD §4）、§3.3（三权）、§6（计划门三条核对 + 审计真读签字）、§12 的 S1 行（references **7 份**）、§10 的 F-17（定名 `evidence-reader`）、§11 的 D-18 / D-19 / D-23 |
| 验收锚点 | spec §9 的 **V-1～V-14（14 条）**；spec §7.1 的 **C1–C11**；spec §7.5 的 **12 处**硬编码计数；spec §2 的 P-6 登记面 3 处（D1–D3）+ **P-7 运行时就位** |
| 已知风险点 | spec §8 的 **F1–F22**；spec §11 的阻塞风险（`evidence-reader` 定名与三字段设计）；spec §7.5 的「只改字面量」回归；spec §7.1 的三条说明（C9 定位、C10/C11 兼容硬约束、`fixedList` 表头摩擦）；spec §10 的两处**零判别力对照**（C4 的 A7 只查节名存在、C11 的 `gate` 只比字节） |
| 不测清单（spec §2「不做什么」） | 议会两张矩阵、`speaker` 卡、`host-duties.md` 拆分、`producer` / `research` 档、`check-prd-graph.mjs`、市场 / 产品经理卡（S2–S5）；S4 才建的 `check-plan.mjs` 本体不测（本 spec 只要求 `stage-2b-plan-gate.md` 写出「判据 + 二选一证据」，A09 / E26 只判文档内容）；`aas` 运行时本身不测（V-12 只在本机验，**不进 `npm run check`**） |
| 公共前置（**施工前**） | 工作目录 = 仓库根 `d:\Seed\retro-skills`；工作树干净 —— `git status --porcelain` **只允许出现本 testcase 文件**。施工前语境下，S1 交付清单内路径（`skills/dev-workflow/**`、`rules/dev-workflow-mainline.md`、`agents/evidence-reader.md`、§7.1 的 C1–C11、§7.5 的 12 处、§2 P-6）**必须仍为未改动状态**；若已出现改动，说明已进入施工后语境，改用下一条前置 |
| 公共前置（**施工后**） | 同上，但工作树允许的路径 = **S1 交付清单内**（spec §2 P-1～P-7 + §7.1 C1–C11 + §7.5 12 处 + §11 施工顺序涉及的全部文件）；清单外路径出现即红（防止顺手改无关文件）。`agents/` 下除 `evidence-reader.md` 外不得有新增 / 修改（TC-D02 判据） |
| 外部依赖提醒 | `skilldependencies/validate.test.mjs:6` 用绝对路径 import 外部仓 `file:///D:/Seed/agent-assets-sync/src/deps.mjs`。该仓缺失时 `npm run check` 会红，**与本次改动无关**，判红前先确认它在位（见 §9 建议 5） |
| 负例构造纪律 | 凡需「破坏仓库再做验红」的用例，一律在一次性副本仓执行：`git worktree add --detach "$env:TEMP\dw-neg" HEAD` → `Push-Location "$env:TEMP\dw-neg"` → 造错 → 跑命令 → `Pop-Location`；禁止直接改主仓（除了可逆的临时改名，且必须在 finally 段还原） |

## 1 覆盖总表

| 用例号 | 覆盖对象（spec 的 V-x / F-x / C-x / §节号） | 用例标题 | 类型 |
|---|---|---|---|
| TC-A01 | §9 V-1 | 三件载体三个路径均存在 | 正例 |
| TC-A02 | §9 V-2、§2 P-2、§5 唯一证据载体 | references 恰 **7 份**、七个文件名逐名命中，且 `gate-record.md` 有六列表头 | 正例 |
| TC-A03 | §4 frontmatter | SKILL.md frontmatter 有 name 与 description（含「不用于」） | 正例 |
| TC-A04 | §9 V-3、§3.1、PRD §4 | 段表六行，**三列**（出口判据 / 谁签 / 议会）与 PRD §4 逐格一致，段标记顺序 `①②②→③③④⑤`，且写明门不是段 | 正例 |
| TC-A05 | §3.2 | 六份 `stage-*.md` 必备五小节齐（`gate-record.md` 不在其列） | 正例 |
| TC-A06 | §3.3 | 两个议会插点在位，计划门显式无议会 | 正例 |
| TC-A07 | §9 V-4、§5 | 规则五段结构齐、含 **R1–R7**、例外节非空（存量 + 时点）、验证节两条自查命令 | 正例 |
| TC-A08 | §3.2 三权归属 | 六份 `stage-*.md` 都有申报 / 定性 / 核对三行口径 | 正例 |
| TC-A09 | §3.2 额外要求 + 末段「脚本未落地期的写法」 | 计划门文档三条核对各含「判据 + 证据取得方式」，并写明脚本上线前由审计手工核对 | 正例 |
| TC-A10 | §9 V-12、§2 **P-7**、§8 F16 | 运行时就位：`aas sync` 后 `aas` 体检「需建链接 0」+ 两条 `Test-Path` 为 True（本机验，不进 CI） | 正例 |
| TC-A11 | §9 V-13、§4「每个段行带读→产出」、§3.2「读→产出」闭环、§8 F17 | 每个段行同时含 `references/stage-N-*.md` + 「已核清单」+「不得进入下一段」 | 正例 |
| TC-A12 | §9 V-13、§4「三权总则」/「取证调度」、§8 F18 | 独立的「三权总则」节与「取证调度」节在位，取证节点名 `evidence-reader` 与「常驻 ≠ 每轮必跑」 | 正例 |
| TC-A13 | §9 V-13、§4「不在 SKILL.md 内联骨架」的机器判据 | `^## (入口条件|出口判据|谁签|三权归属|常见漏项)` 命中 0 | 正例 |
| TC-A14 | §9 **V-14**、§3.1 **过渡口径**、§8 **F22** | `SKILL.md` ① 段正文三要素（用户签字 / 代拟 / 代拟者不签字）全命中 + 「S2」失效条件命中 | 正例 |
| TC-B01 | §9 V-5、§7.4 | evidence-reader 卡与渲染逐字节一致 | 正例 |
| TC-B02 | §6.2 tools、§7.6 | tools 恰等于只读三元组 | 正例 |
| TC-B03 | §9 V-5、§7.3 | description 走 domain 分支且不含「议会评审」 | 正例 |
| TC-B04 | §7.1 C3/C4、§7.2 | outputKind 与 evidence 输出格式齐，结构检查零 findings | 正例 |
| TC-B05 | §6.2 触发 when | when 不含「时调用」且不以「时」结尾 | 正例 |
| TC-B06 | §7.1 C7、§7.4 | state 登记 replaced 且 check-agents 报 15 已接管 | 正例 |
| TC-B07 | §7.1 C8、§7.4 | annotations 十键全为 pass | 正例 |
| TC-B08 | §6.3 | 与 reviewer-reader / detective-observer 职责边界不重叠 | 正例 |
| TC-B09 | §7.6 ToolsViolation 不放松、判据判别力 | tools 顺序不同但集合相等必须判绿（假阳性样例） | 边界 |
| TC-B10 | §9 V-11、§7.1 C10、§6.2 `boundary`、§8 F14 | reader 卡「边界」节为取证角色句、不含「只读评审角色」 | 正例 |
| TC-B11 | §9 V-11、§7.1 **C11**、§6.2 `explorePolicy`、§8 F14 邻域 | reader 卡不含「现场生成 3-5 个」「只答固定清单 = 不合格」，「自由探索」节为「本节不适用…」形态 | 正例 |
| TC-B12 | §7.1 **C5** `BASE_KEYS` 三键 | 带 `boundary` + `explorePolicy` 的条目通过 `validateAgentData`（两键不被判非法） | 正例 |
| TC-C01 | §9 **V-6** | gate 输出 baseline **37/37** 且 exit 0 | 正例 |
| TC-C02 | §7.1 C6 | baseline.json 恰 **37** 条且 evidence-reader 排序位正确 | 正例 |
| TC-C03 | §7.1 C2 | BASELINE_RULES 22 条、agentPaths 15 条且含新规则 | 正例 |
| TC-C04 | §9 V-7 | npm run check 各环节全绿 | 正例 |
| TC-C05 | §8 F8 / F13、§7.5（生产侧已升级 vs `check-baseline.test.mjs:30,36` 仍 35） | 半改（生产侧 15 席 / 22 条且已 `baseline --write`，测试侧字面量仍 35）→ check-baseline 必红 | 负例 |
| TC-C06 | §8 F8 / F13、§7.5 | **12 处**一个字未改 → npm run check 必红 | 负例 |
| TC-C07 | §8 F13、§7.5（data.test.mjs:10） | 同文件第三处 14 未改 → data.test.mjs 必红 | 负例 |
| TC-C08 | §8 F13、§7.5（cli-gate / review-fixes / pilot-gate） | 三个文件的正则 / 计数未改 → 必红 | 负例 |
| TC-C09 | §7.1 C6 | baseline.json 未重生成则 gate 报 BaselineDrift | 边界 |
| TC-C10 | §7.1 C9、§9 V-10 | C9 断言在位：state 键集与 agentData 名字集比对 | 正例 |
| TC-C11 | §8 F13、§7.5「一律派生化」 | **12 处**逐行须为派生表达式 + 全局（剥 `//` 后）0 命中；某处写回字面量必被检出 | 负例 |
| TC-D01 | §9 V-8、§7.6 | **`gate`** exit 0 + `baseline 37/37`；注入一字节 → `Mismatch` 且 exit 1 | 正例 |
| TC-D02 | §9 V-8、§0 公共前置（施工后） | 施工后 `agents/` 只多出 evidence-reader 一个新文件 | 正例 |
| TC-D03 | §7.6 description 句式不变 | 13 席 description 仍走默认分支（`true false`）；`senior-sdet` 单列判 `false false` 且含 `Do not use for` | 正例 |
| TC-D04 | §7.3、§8 F6 | renderAgent 不传 domain 时被 grep 判据抓住 | 负例 |
| TC-D05 | §7.3 domain 输入空间 | `domain` = `''` / `'  '` / `123` 三种内存构造：description 不含「在中担任」「在  中担任」，且 `validateAgentData` 拒绝 | 边界 |
| TC-D06 | §7.6 默认值不变 | 改默认 DOMAIN 则 gate 报 Mismatch | 负例 |
| TC-D07 | §7.1 C5 | domain 字段被接受且只有 evidence-reader 带它 | 正例 |
| TC-D08 | §8 F14、§7.1 C10、§9 V-11 | 边界句退回模板现句 → reader 卡变回「只读评审角色」必被检出（`gate` 抓不住） | 负例 |
| TC-D09 | §7.1 **C11**「不改会怎样」、§9 V-11 | explore 槽位未接线（`explorePolicy` 不被消费）→ **`gate` 仍绿**、reader 卡仍含旧句 → 必须被 B11 抓到 | 负例 |
| TC-E01 | §8 F1 | 出口判据写成形容词必被抓住 | 负例 |
| TC-E02 | §8 F2、§9 V-2 | references 只有 6 份（缺 stage-2b-plan-gate）必红 | 负例 |
| TC-E03 | §8 F2 边界 | references 多一份（8 份）同样必红 | 边界 |
| TC-E04 | §8 F3 | 规则复制 PRD 正文必被抓住 | 负例 |
| TC-E05 | §8 F4 | 手写卡绕过生成器 gate 必非 0 | 负例 |
| TC-E06 | §8 F5、§7.1 C7/C9、§9 V-10 | state 缺一条键 → npm run check 必红，且红在 ②.6（给出判红位置） | 负例 |
| TC-E07 | §8 F6、§7.6 | 给 `agents/reviewer-qa.md` 注入一字节 → `gate` 必报 Mismatch（逐字节判据的正向验证） | 负例 |
| TC-E08 | §8 F7 | evidence 格式退化成问题卡必被抓住 | 负例 |
| TC-E09 | §8 F8 / F13 | 全量门在 **12 处**里只改 1 处时必红 | 负例 |
| TC-E10 | §8 F9、§4 自引用 | 自引用带前缀 skill-inspector 必报 findings | 负例 |
| TC-E11 | §8 F9 边界、§4 跨技能引用 | 跨技能文件路径同样必报 findings | 边界 |
| TC-E12 | §8 F10、§7.1 C2 | 登记了但文件不存在报 DanglingBaselineEntry | 负例 |
| TC-E13 | §6.2 tools、§7.6 | tools 多加 Write 报 ToolsViolation | 负例 |
| TC-E14 | §7.3、§9 V-5 | description 出现「在议会评审中担任」必被抓住 | 负例 |
| TC-E15 | §8 F11、§2 P-6、§9 V-9 | manifest 缺 dev-workflow 或清单文件缺失 → validate.test.mjs 必红 | 负例 |
| TC-E16 | §4 frontmatter、§9 V-7 | SKILL.md 为空或缺 frontmatter 必红 | 边界 |
| TC-E17 | §4 frontmatter、§9 V-7 | SKILL.md 带 BOM 必红 | 边界 |
| TC-E18 | §6.2 触发 when | when 以「时」结尾报 WhenFormatViolation | 边界 |
| TC-E19 | §7.1 C8 边界 | annotations 值为 pending / 缺键时 A 组必红 | 边界 |
| TC-E20 | §7.1 C3、§7.2 | 未登记的 outputKind 报 InvalidOutputKind | 负例 |
| TC-E21 | §8 F12、§9 V-3 | 段表任一格改回旧措辞（`无` / `，` / `任务↔testcase` / `测试绿`）→ `diff cells ≥ 1` 必被检出 | 负例 |
| TC-E22 | §8 F11、§2 P-6 **D2** | 依赖集合恰为 `parliament` + `prd-to-specs`（多一个 / 少一个必红），且 skill 字段与文件名合规 | 负例 |
| TC-E23 | §2 P-6 **D3**、§9 V-9（人工核） | **三份 README**（`README.md` / `docs/guide/skills/README.md` / `docs/guide/rules/README.md`）技能与规则数量都不写死，且都含 `dev-workflow` 一行 | 边界 |
| TC-E24 | §3.2 `stage-2b-plan-gate.md` 额外要求、F1 邻域 | 计划门文档退化成「见 PRD §6」指针 → 必被检出 | 负例 |
| TC-E25 | §6.1 定名、PRD F-17 / D-23 | 裸名 `reader` 与 `evidence-reader` 并存 / 被用来派单 → 必被检出 | 负例 |
| TC-E26 | §8 F15、§3.2「脚本未落地期的写法」 | 计划门只写 `node scripts/check-plan.mjs` 之类命令、无手工核对说明 → 判不通过 | 负例 |
| TC-E27 | §8 F16、§2 **P-7**、§9 V-12 | 只写源不 `aas sync` → `Test-Path` 为 False、`aas` 体检「需建链接 ≥ 1」→ 必红 | 负例 |
| TC-E28 | §8 **F17**、§9 V-13、§3.2「读→产出」闭环 | 某段行改成纯指针（只写「判据见 references/…」）→ 必被 A11 判据抓住 | 负例 |
| TC-E29 | §9 V-13、§4「必须有…节」、§8 **F18** / **F21** | 删掉「三权总则」节或「取证调度」节 → 必红 | 负例 |
| TC-E30 | §8 **F19**、§3.1「议会有条件」、§5 R1 | 议会有 1 张 P0 未清而出口判据全齐 → 判「不得进入下一段」 | 负例 |
| TC-E31 | §8 **F20**、§5「例外」节必写内容 | 例外节只写「无例外」→ 必红（存量 spec 一刀切） | 负例 |
| TC-E32 | §7.1 **C5** `BASE_KEYS`、§7.1 C5 ④ | 从 `BASE_KEYS` 删 `boundary` → `TriggerFieldMisplaced`（证明该键真被声明） | 负例 |
| TC-E33 | §8 **F22**、§9 **V-14** | ① 段删掉「代拟者不签字」→ A14 三命中变两命中必红 | 负例 |

**覆盖核对**：

- spec 验收项 **V-1～V-14 共 14 条，覆盖 14 条，未覆盖 0**：V-1→A01；V-2→A02/E02/E03；V-3→A04/E21；V-4→A07/E04；V-5→B01–B03/E05/E13/E14；V-6→C01/C02/C09；V-7→C04/E09/E15–E17；V-8→D01/D02/E07；V-9→E15/E22/E23；V-10→B06/C10/E06；V-11→B10/B11/D08/D09；**V-12→A10/E27**；**V-13→A11/A12/A13/E28/E29**；**V-14→A14/E33**。
- §7.1 的 **C1–C11 共 11 处，覆盖 11 处**：C1→B02/B05/B06；C2→C03/E12；**C3→B04/B11/E20**（三个默认常量：旧句单源由 B11 步骤③、`DEFAULT_EXPLORE_NONE` 单源由 B11 步骤④）；C4→B04/E08；C5→D03/D04/D05/D07/**B12/E32**；C6→C02/C09；C7→B06/E06；C8→B07/E19；C9→C10/E06；C10→B10/D08；**C11→B11/D09**。
- §7.5 的 **12 处硬编码，覆盖 12 处**：C06（12 处全未改的整体红）、C05（生产侧已升级 vs `check-baseline:30,36` 仍 35）、C07（`data.test.mjs:10`）、C08（`cli-gate:14,31,58` + `review-fixes:45` + `pilot-gate:38`）、E09（全量门半改）、**C11（12 个 `path:line` 逐行判派生 + 全局剥 `//` 后 0 命中，含 `data.test.mjs:50` 同行注释）**。
- §2 的 **P-6 登记面 3 处（D1–D3），覆盖 3 处**：`skilldependencies/manifest.json`（D1）→E15；`skilldependencies/dev-workflow.json`（D2，含依赖集合恰等）→E15/E22；三份 README（D3，技能与规则数量都不写死）→E23。**P-7 运行时就位 → A10 / E27。**
- §8 的 **F1–F22 共 22 条，每条至少一条负例**（映射见 §3 与 §10 自检表）：F16→A10/E27；F17→A11/E28；F18→A12/E29；F19→E30；F20→E31；F21→A13/E29（结构缺节 / 判据互矛盾）；**F22→A14/E33**（过渡口径只写进 spec、漏进 SKILL.md）。

## 2 用例正文（按 spec §10 的 TC 组 A–E）

> 每条用例五要素齐：覆盖 / 前置 / 步骤 / 预期 / 判据。命令均可在仓库根直接粘贴执行（PowerShell）。
> 负例与边界的「对应测试」统一写「待 plan Task N」——由 plan 落成可重跑断言；正例对应 plan 的实现 Task，编号由 plan 回填。

### TC-A01 三件载体均在磁盘上

- **覆盖**：spec §9 V-1（P-1 / P-3 / P-4 三个交付物）
- **前置**：S1 施工完成；工作树包含三个新文件。
- **步骤**：① `node -e "const fs=require('fs');for(const p of ['skills/dev-workflow/SKILL.md','rules/dev-workflow-mainline.md','agents/evidence-reader.md'])console.log(p,fs.existsSync(p))"`
- **预期**：三行输出，逐行为 `skills/dev-workflow/SKILL.md true`、`rules/dev-workflow-mainline.md true`、`agents/evidence-reader.md true`。
- **判据**：【机器】上面命令 stdout 恰 3 行且每行以 `true` 结尾；任一行为 `false` 即红。

### TC-A02 references 恰七份、七个文件名逐名命中，且 gate-record.md 六列表头在位

- **覆盖**：spec §9 V-2、§2 P-2、§5「唯一证据载体」
- **前置**：`skills/dev-workflow/references/` 目录存在。
- **步骤**：
  ① 全集相等（一个不多、一个不少）：`node -e "const fs=require('fs');const exp=['stage-1-prd.md','stage-2-tech-design.md','stage-2b-plan-gate.md','stage-3-implementation.md','stage-4-quality.md','stage-5-delivery.md','gate-record.md'];const got=fs.readdirSync('skills/dev-workflow/references').filter(x=>x.endsWith('.md')).sort();console.log(got.length);console.log(JSON.stringify(got)===JSON.stringify([...exp].sort()));console.log(JSON.stringify(exp.filter(x=>!got.includes(x))));console.log(JSON.stringify(got.filter(x=>!exp.includes(x))))"`
  ② `gate-record.md` 六列表头（R1–R7 的唯一证据载体）：`node -e "const t=require('fs').readFileSync('skills/dev-workflow/references/gate-record.md','utf8');const cols=['段','出口判据（逐条）','核了什么（命令输出首行 或 path:line）','申报人','签字人','结论'];console.log(cols.every(c=>t.includes(c)));console.log(JSON.stringify(cols.filter(c=>!t.includes(c))))"`
- **预期**：① 四行：`7` / `true` / `[]` / `[]`；② 两行：`true` / `[]`。
- **判据**：【机器】① 第 1 行 `7`、第 2 行 `true`、第 3、4 行均为 `[]`；② 第 1 行 `true`、第 2 行 `[]`（六列名缺任一列即点名）。**本版变化（v4）**：V-2 由 6 份改为 **7 份**（新增 `gate-record.md`）——它是 R1–R7 的唯一证据载体，缺了它规则只能自存名单（与 §5「规则内不再自存任何名单」冲突）。

### TC-A03 SKILL.md frontmatter 有 name 与 description

- **覆盖**：spec §4「frontmatter」行
- **前置**：TC-A01 通过。
- **步骤**：① `node -e "const t=require('fs').readFileSync('skills/dev-workflow/SKILL.md','utf8').replace(/^\uFEFF/,'');const fm=/^---\r?\n([\s\S]*?)\r?\n---/.exec(t);console.log(!!fm);console.log(/^name:\s*dev-workflow\s*$/m.test(t));console.log(/^description:\s*\S/m.test(t));console.log(/不用于|Do not use for/.test(t))"`
- **预期**：四行 `true`、`true`、`true`、`true`（第四行证明 description 写了「不用于什么」）。
- **判据**：【机器】四行全为 `true`。

### TC-A04 段表六行，三列与 PRD §4 逐格一致，段顺序为 ①②②→③③④⑤，且写明门不是段

- **覆盖**：spec §9 V-3、§3.1；PRD §4 段表（**唯一真相 = PRD §4**，v4 已把两格统一为 PRD 原文：`无议会` / `；`）
- **前置**：TC-A01 通过；PRD 与 SKILL.md 都在仓库内。
- **步骤**：
  ① **只比三列**（`出口判据` / `谁签` / `议会`；`名称` 与 `入口` 两列不进比对——SKILL.md 允许把段名从格内拆成单独一列，PRD 写在段标记后），列名驱动、不依赖列顺序、`**` 与首尾空格归一：
  `node -e "const f=require('fs');const rows=p=>{const L=f.readFileSync(p,'utf8').split(/\r?\n/).map(l=>l.trim());const i=L.findIndex(l=>l.startsWith('|')&&l.includes('出口判据'));const c=l=>l.replace(/\*\*/g,'').split('|').slice(1,-1).map(x=>x.trim());const h=c(L[i]);const out=[];for(let k=i+2;k<L.length&&L[k].startsWith('|');k++){out.push(c(L[k]))}return {h,out}};const s=rows('skills/dev-workflow/SKILL.md');const p=rows('docs/prd/20261024073606-dev-workflow-mainline/index.md');let d=0;for(let i=0;i<Math.max(s.out.length,p.out.length);i++)for(const k of ['出口判据','谁签','议会']){const av=(s.out[i]||[])[s.h.indexOf(k)],pv=(p.out[i]||[])[p.h.indexOf(k)];if(av!==pv){d++;console.log('DIFF row',i+1,k,JSON.stringify(av),'!=',JSON.stringify(pv))}}console.log('skill rows',s.out.length,'diff cells',d)"`
  ② 段标记顺序 `①②②→③③④⑤`：`node -e "const f=require('fs');const L=f.readFileSync('skills/dev-workflow/SKILL.md','utf8').split(/\r?\n/).map(l=>l.trim());const i=L.findIndex(l=>l.startsWith('|')&&l.includes('出口判据'));const c=l=>l.replace(/\*\*/g,'').split('|').slice(1,-1).map(x=>x.trim());const idx=c(L[i]).indexOf('段');const seg=[];for(let k=i+2;k<L.length&&L[k].startsWith('|');k++)seg.push(c(L[k])[idx]||'');const j=seg.join(' | ');console.log(seg.length);console.log(j);console.log(/^①.*\| ②(?!→).*\| ②→③.*\| ③.*\| ④.*\| ⑤/.test(j))"`
  ③ 门不是段：`node -e "const t=require('fs').readFileSync('skills/dev-workflow/SKILL.md','utf8');console.log(/门.{0,10}不是段|不是段.{0,10}门/.test(t))"`
- **预期**：步骤① `skill rows 6 diff cells 0`（无 `DIFF` 行）；步骤② 三行：`6`、段列串（形如 `① | ② | ②→③ | ③ | ④ | ⑤`）、`true`；步骤③ `true`。
- **判据**：【机器】步骤①末行恰 `skill rows 6 diff cells 0`；步骤②三行分别 `6` / 顺序为 `①②②→③③④⑤` 的串 / `true`；步骤③ `true`。**本版变化（v4）**：V-3 明确「只比三列 + 段标记顺序」，不再比 `名称` / `入口`——这两列 SKILL.md 允许拆列，逐格比会制造假阳性。段顺序单独判（正则要求 ② 后面紧跟 `②→③`，防把门挤到别的段之后）。

### TC-A05 六份 stage-*.md 必备小节齐（gate-record.md 不在其列）

- **覆盖**：spec §3.2（入口条件 / 出口判据 / 谁签 / 三权归属 / 常见漏项）、§2 P-2（`gate-record.md` 是记录表不是段文档）
- **前置**：TC-A02 通过。
- **步骤**：① `node -e "const fs=require('fs');const d='skills/dev-workflow/references';for(const x of fs.readdirSync(d).filter(f=>f.startsWith('stage-')&&f.endsWith('.md')).sort()){const t=fs.readFileSync(d+'/'+x,'utf8');const miss=['入口','出口','谁签','三权','漏项'].filter(h=>!t.includes(h));console.log(x,miss.length?('MISS:'+miss.join(',')):'OK')}"`
- **预期**：6 行，每行右侧均为 `OK`。
- **判据**：【机器】输出行数 = 6 且不含 `MISS:`（`stage-2b-plan-gate.md` 同样要过这五小节，它是门文档不是例外）。**为什么加 `startsWith('stage-')`**：v4 的 references 有 7 份，`gate-record.md` 是六列表格而非段文档，把它算进来会制造假阳性（它没有也不该有「入口条件 / 谁签」节）。

### TC-A06 两个议会插点在位，计划门显式无议会

- **覆盖**：spec §3.3
- **前置**：TC-A01 通过。
- **步骤**：① `node -e "const t=require('fs').readFileSync('skills/dev-workflow/SKILL.md','utf8');console.log(t.includes('议会 #1'),t.includes('议会 #2'),t.includes('计划门'),/计划门[^。\n]{0,25}无议会|无议会[^。\n]{0,25}计划门|不设议会/.test(t))"`
- **预期**：`true true true true`。
- **判据**：【机器】四项全为 `true`。

### TC-A07 规则五段结构、R1–R7、例外节（存量 + 时点）、验证节两条自查命令

- **覆盖**：spec §9 V-4、§5（R1–R7 + 唯一证据载体 + 例外节必写内容 + 验证节两条命令）
- **前置**：TC-A01 通过。
- **步骤**：
  ① 五段标题：`node -e "const t=require('fs').readFileSync('rules/dev-workflow-mainline.md','utf8');console.log(['适用范围','冲突裁决','例外','触发时机','验证'].map(h=>new RegExp('^##\\s*'+h,'m').test(t)).join(','))"`
  ② R1–R7 七条：`node -e "const t=require('fs').readFileSync('rules/dev-workflow-mainline.md','utf8');console.log([1,2,3,4,5,6,7].map(i=>new RegExp('R'+i+'(?![0-9])').test(t)).join(','))"`
  ③ 例外节非空、含存量豁免与时点、且时点不写「以后 / 下次」：`node -e "const t=require('fs').readFileSync('rules/dev-workflow-mainline.md','utf8');const i=t.indexOf('## 例外');const j=i>-1?t.indexOf('##',i+3):-1;const s=i>-1?t.slice(i,j>-1?j:undefined):'';console.log(i>-1);console.log(s.includes('存量'),/时点|具体日期|可核事件/.test(s),s.trim().length>20);console.log(/以后|下次/.test(s))"`
  ④ 验证节两条自查命令：`node -e "const t=require('fs').readFileSync('rules/dev-workflow-mainline.md','utf8');const i=t.indexOf('## 验证');const s=i>-1?t.slice(i):'';console.log((s.match(/node -e/g)||[]).length);console.log(/签字人[\s\S]{0,40}申报人/.test(s),/拆 spec 中/.test(s))"`
- **预期**：① `true,true,true,true,true`；② `true,true,true,true,true,true,true`；③ 三行 `true` / `true true true` / `false`；④ 第一行 ≥ `2`、第二行 `true true`。
- **判据**：【机器】四步全绿。**本版变化（v4）**：判据由 R1–R6 扩到 **R1–R7**（R7 = 引用长文必须来自 `evidence-reader`）；例外节由「存在即可」收紧为「**非空 + 含存量豁免 + 含时点 + 不得写『以后 / 下次』**」（F20 的防线——25 份零 testcase 存量 spec 一刀切会让规则上线第一天无法开工）；验证节必须给两条可粘贴命令（签字人 ≠ 申报人的行数 = 总行数；「拆 spec 中」行数 ≤ 1）。

### TC-A08 六份 stage-*.md 都有三权归属口径

- **覆盖**：spec §3.2「三权归属」行、PRD §3.3
- **前置**：TC-A02 通过。
- **步骤**：① `node -e "const fs=require('fs');const d='skills/dev-workflow/references';for(const x of fs.readdirSync(d).filter(f=>f.startsWith('stage-')&&f.endsWith('.md')).sort()){const t=fs.readFileSync(d+'/'+x,'utf8');console.log(x,['申报','定性','核对'].every(k=>t.includes(k)))}"`
- **预期**：6 行，右侧全为 `true`。
- **判据**：【机器】6 行全 `true`（`gate-record.md` 不判三权——它的「申报人 / 签字人」两列由 A02 六列判据兜，别在这里重复）。

### TC-A09 计划门三条核对各含「判据 + 证据取得方式」，并写明脚本上线前由审计手工核对

- **覆盖**：spec §3.2「`stage-2b-plan-gate.md` 额外要求」+ 末段「**脚本未落地期的写法**」、§8 F15、PRD §6（三条核对 + 审计真读签字）
- **前置**：TC-A02 通过；该文件存在；`scripts/check-plan.mjs` 在 S1 阶段**不存在**（归 S4）。
- **步骤**：
  ① 三项核对名与命令原文条数：`node -e "const t=require('fs').readFileSync('skills/dev-workflow/references/stage-2b-plan-gate.md','utf8');console.log(t.includes('功能点全覆盖'),t.includes('依赖无环'),t.includes('一一映射'));console.log((t.match(/\bnode\s+\S+/g)||[]).length)"`
  ② 二选一证据的「上线前」分支在位：`node -e "const t=require('fs').readFileSync('skills/dev-workflow/references/stage-2b-plan-gate.md','utf8');console.log(/手工核对/.test(t),/脚本上线前|脚本未落地|归 S4/.test(t),/审计/.test(t))"`
  ③ 「判据」与「证据」两类句子各至少三条（粗探针）：`node -e "const t=require('fs').readFileSync('skills/dev-workflow/references/stage-2b-plan-gate.md','utf8');console.log((t.match(/判据/g)||[]).length);console.log((t.match(/证据/g)||[]).length)"`
  ④ 签字证据要求：`node -e "const t=require('fs').readFileSync('skills/dev-workflow/references/stage-2b-plan-gate.md','utf8');console.log(t.includes('审计'),/签字[\s\S]{0,80}(输出|结论|核对)|(输出|结论|核对)[\s\S]{0,80}签字/.test(t))"`
- **预期**：① `true true true` 与 ≥ `3`（三条核对的命令原文各一条）；② `true true true`；③ 两个数字均 ≥ `3`；④ `true true`。
- **判据**：【机器】① 第 1 行 `true true true`、第 2 行 ≥ 3；② 三项全 `true`；③ 两行均 ≥ 3；④ 两个 `true`。【人工】reviewer-qa 逐条读三条核对，判据 = **每条都能同时回答「判什么（可判定句）」与「证据从哪来」，且明确写出脚本上线前由审计手工核对（逐条填：核了什么 / 怎么核的 / 结论）+ 命令原文**；只写命令、不写手工核对 → 不通过（对应的负例 = TC-E26）。
- **为什么改判据（相对二版）**：二版只数「命令条数 ≥ 3」，而 `check-plan.mjs` 在 S1 阶段不存在——「文档里写了三条命令」在当时是**跑不通的命令**，属 F15。三版 spec §3.2 末段已改为「判据 + 二选一证据」，本用例随之改为判「二选一的两条分支都在位」。命令是否真能跑由 S4 落地后复核，不在本用例判（见 §7 不测）。

### TC-A10 运行时就位：`aas sync` 后体检「需建链接 0」+ 两条 `Test-Path` 为 True

- **覆盖**：spec §9 V-12、§2 P-7、§8 F16（规则与技能只在仓内 = 从未生效）
- **前置**：S1 施工后（含 P-7 已执行）；`aas` CLI 可用（按 `docs/architecture.md:178` 的用法在仓库根执行）；**本机环境验，不进 `npm run check`**。
- **步骤**：
  ① `aas sync`；② `$LASTEXITCODE`
  ③ 体检只取相关栏：`aas *> "$env:TEMP\aas-check.log"; Select-String -Path "$env:TEMP\aas-check.log" -Pattern '需建链接' | ForEach-Object { $_.Line.Trim() }`
  ④ `Test-Path "$HOME\.trae-cn\user_rules\dev-workflow-mainline.md"`
  ⑤ `Test-Path "$HOME\.trae-cn\skills\dev-workflow\SKILL.md"`
- **预期**：② `0`；③ 恰 1 行且含 `需建链接 0`（不得出现 `需建链接 1` 及以上）；④ `True`；⑤ `True`。
- **判据**：【机器，本机环境】② `0` + ③ 该行 + ④⑤ 均 `True`；任一 `False` 或「需建链接 ≥ 1」即红。**判者**：执行 P-7 的人当场看输出（这条无法进 CI——运行时目录在用户 home，CI 机器上不存在）。**为什么必须单列**：`npm run check` 全绿只能证明「仓内文件齐」，与「下轮 agent 真能读到」是两件事（F16 的形态）。

### TC-A11 SKILL.md 每个段行同时含 references 指针 + 「已核清单」+「不得进入下一段」

- **覆盖**：spec §9 V-13、§4「每个段行带读→产出」、§3.2「读→产出」闭环、§8 F17
- **前置**：TC-A01、TC-A04 通过（段表六行可解析）。
- **步骤**：① 逐行探针：`node -e "const f=require('fs');const L=f.readFileSync('skills/dev-workflow/SKILL.md','utf8').split(/\r?\n/).map(l=>l.trim());const i=L.findIndex(l=>l.startsWith('|')&&l.includes('出口判据'));const c=l=>l.replace(/\*\*/g,'').split('|').slice(1,-1).map(x=>x.trim());let n=0,bad=0;for(let k=i+2;k<L.length&&L[k].startsWith('|');k++){const row=c(L[k]).join(' | ');n++;const a=/references\/stage-[^ ，、|)]+\.md/.test(row),b=row.includes('已核清单'),d=row.includes('不得进入下一段');if(!(a&&b&&d)){bad++;console.log('BAD row',n,a,b,d)}}console.log('rows',n,'bad',bad)"`
- **预期**：`rows 6 bad 0`，无 `BAD` 行。
- **判据**：【机器】末行恰 `rows 6 bad 0`；出现 `BAD row` 即点名哪一行缺哪一项（a = 缺 references 指针 / b = 缺「已核清单」 / d = 缺「不得进入下一段」）。**为什么逐行判而不是全文判**：全文出现一次「已核清单」也可能只写在段①，其余五段仍是纯指针（F17 的真实形态）；只有逐行同时命中三项才算闭环。**判据来源**：§3.2 的句式「开工前按 `references/stage-N-*.md` 的出口判据逐条核，产出**已核清单**（`references/gate-record.md` 的表格行），缺清单不得进入下一段」。

### TC-A12 SKILL.md 有独立的「三权总则」节与「取证调度」节

- **覆盖**：spec §9 V-13、§4「必须有「三权总则」节」「必须有「取证调度」节」、§8 F18
- **前置**：TC-A01 通过。
- **步骤**：① 两节内容探针：`node -e "const t=require('fs').readFileSync('skills/dev-workflow/SKILL.md','utf8');const grab=n=>{const i=t.indexOf('## '+n);if(i<0)return '';const j=t.indexOf('## ',i+3);return t.slice(i,j<0?undefined:j)};const a=grab('三权总则'),b=grab('取证调度');console.log(a.length>0,b.length>0);console.log(b.includes('evidence-reader'),/常驻[\s\S]{0,20}每轮/.test(b));console.log(/申报/.test(a),/定性/.test(a),/核对/.test(a))"`
- **预期**：三行：`true true` / `true true` / `true true true`。
- **判据**：【机器】三行全为 `true`（缺任一节或节内缺关键要素即红）。**两节各自防的失败面**：「三权总则」缺 → 出现「申报人自己定性」（PRD §3.3 的底线）；「取证调度」缺 → `evidence-reader` 造出来没人派、主 agent 仍自读（F18，收益为 0）。`/常驻[\s\S]{0,20}每轮/` 判的是「常驻 ≠ 每轮必跑」这句必须写明——否则取证角色会被当成每轮强制环节，拖慢所有任务。

### TC-A13 SKILL.md 不内联五段骨架（机器判据命中 0）

- **覆盖**：spec §9 V-13、§4「不在 SKILL.md 内联骨架」的机器判据
- **前置**：TC-A01 通过。
- **步骤**：① `node -e "const t=require('fs').readFileSync('skills/dev-workflow/SKILL.md','utf8');const m=t.match(/^## (入口条件|出口判据|谁签|三权归属|常见漏项)/gm)||[];console.log(m.length);console.log(JSON.stringify(m))"`
- **预期**：两行：`0` / `[]`。
- **判据**：【机器】第 1 行 `0`、第 2 行 `[]`（命中任一即点名）。**为什么禁这五个标题**：它们是 `references/stage-*.md` 的必备小节；搬进 SKILL.md 就变成「两处维护」，PRD 改一次要同步两处（F3 / F21 的同源病）。注意 `三权总则` 不在禁用集里——它是 SKILL.md **必须有**的独立一节（A12），与段文档里的「三权归属」小节不同物。

### TC-A14 SKILL.md ① 段正文含过渡口径三要素 + 「S2」失效条件

- **覆盖**：spec §9 **V-14**、§3.1「**过渡口径（S2 前有效，产品经理卡落地即删）**」、§8 **F22**
- **前置**：TC-A01 与 TC-A04 通过（`SKILL.md` 在盘、段表可解析、① 段行存在）；S1 施工后语境。
- **步骤**：
  ① 三要素 + `S2` 探针（① 段行 ∪ 「过渡口径」段 为检查范围；`S2` 按全文判）：
  `node -e "const fs=require('fs');const L=fs.readFileSync('skills/dev-workflow/SKILL.md','utf8').split(/\r?\n/).map(l=>l.trim());const i=L.findIndex(l=>l.startsWith('|')&&l.includes('出口判据'));const c=l=>l.replace(/\*\*/g,'').split('|').slice(1,-1).map(x=>x.trim());let row='';for(let k=i+2;k<L.length&&L[k].startsWith('|');k++){const cs=c(L[k]);if((cs[0]||'').startsWith('①'))row=cs.join(' | ')};let para='';const pi=L.findIndex(l=>l.includes('过渡口径'));if(pi>-1){for(let k=pi;k<L.length&&k<pi+7;k++){if(k>pi&&(L[k]===''||L[k].startsWith('|')))break;para=para+' '+L[k]}};const scope=row+' '+para;const kw=['用户签字','代拟','代拟者不签字'];console.log(kw.map(w=>scope.includes(w)).join(' '));console.log(JSON.stringify(kw.filter(w=>!scope.includes(w))));console.log(row.length>0,para.length>0);console.log(/S2/.test(L.join('\n')))"`
- **预期**：四行：`true true true` / `[]` / `true true`（诊断行）/ `true`。
- **判据**：【机器】第 1 行 `true true true`（三要素全命中）、第 2 行 `[]`（缺失清单为空）、第 4 行 `true`（全文含 `S2`）。**第 3 行是诊断行、不作判据**：它只报告「① 段行是否找到 / 是否另起过渡口径段」，用于定位失败原因。任一硬项不满足即红，**第 2 行直接点名缺哪个要素**（不写「要素不全」这种没法修的话）。
- **检查范围为什么是「① 段行 ∪ 过渡口径段」**：① 的签字人写在段表「谁签」列（spec §3.1），而整句较长时会被拆成紧随的「过渡口径」段落——两种落点都算「① 段正文」；只写在别处（如「三权总则」节、references、README）**不算**，因为读段表的人看不到（F22 的形态就是「写了，但写在了读不到的地方」）。
- **`S2` 为什么按全文判**：spec §3.1 只要求「写出失效条件」，没有指定句式；把「S2 前有效 / 产品经理卡落地即删」塞进表格格内并不现实。故判据只要求 `S2` 命中，**不判句式**——句式是否表达出「失效条件」交 §6 人读。
- **三要素为什么逐项独立**：`代拟` 是 `代拟者不签字` 的子串——删掉后者时前者仍为 `true`，这正是 TC-E33 要构造的「三命中变两命中」；若把三项合并成「是否提到代拟」一次判断，这一句被删就永远发现不了。
- **为什么必须单列（F22）**：过渡口径只写进 spec、没进 SKILL.md 时，A01–A13 全绿也发现不了（载体在、段表在、判据都在，缺的只是那半句）；而后果是 S1 一落地所有任务都卡在 ①——产品经理卡要到 S2 才存在，执行顺序是 S1→S3→S2。负例 = TC-E33。

### TC-B01 evidence-reader 卡与渲染逐字节一致

- **覆盖**：spec §9 V-5、§7.4
- **前置**：C1 + C7 已落地（agentData 有条目、state 为 replaced）。
- **步骤**：① `node tools/docgen/cli.mjs diff --kind agent --name evidence-reader`
- **预期**：exit 0；输出 3 行：第 1 行 `旧 agents/evidence-reader.md  sha256=` 开头、第 2 行 `新 渲染            sha256=` 开头，两行 sha256 值相同；第 3 行恰为 `差异 - 0 / + 0（盘上 == 渲染，幂等，无需凭证）`。
- **判据**：【机器】exit 0 且第 3 行逐字相等；两行 sha256 相等（命令输出中可复算）。

### TC-B02 tools 恰等于只读三元组

- **覆盖**：spec §6.2 `tools`、§7.6「ToolsViolation 不放松」
- **前置**：TC-B01 通过。
- **步骤**：① `node -e "const t=require('fs').readFileSync('agents/evidence-reader.md','utf8');const m=/^tools:\s*(.+)$/m.exec(t);console.log(m&&m[1].trim())"`；② `node --input-type=module -e "import {agentData} from './tools/docgen/components/agentData.mjs'; console.log(agentData.find(a=>a.name==='evidence-reader').tools.join(','))"`
- **预期**：步骤①输出 `Read, Glob, Grep`；步骤②输出 `Read,Glob,Grep`。
- **判据**：【机器】步骤①去空格后恰为 `Read,Glob,Grep`；步骤②恰为 `Read,Glob,Grep`（集合 = {Read, Glob, Grep}，不多不少、顺序不影响）。

### TC-B03 description 走 domain 分支且不含「议会评审」

- **覆盖**：spec §9 V-5、§7.3
- **前置**：C5 已落地（domain 字段被接受且被渲染使用）。
- **步骤**：① `node -e "const t=require('fs').readFileSync('agents/evidence-reader.md','utf8');const d=/^description:\s*(.+)$/m.exec(t)[1];console.log(d);console.log(d.includes('在开发工作流中担任阅读取证员'));console.log(d.includes('议会评审'))"`
- **预期**：第 1 行以 `在开发工作流中担任阅读取证员。` 开头并以 `时调用` 结尾；第 2 行 `true`；第 3 行 `false`。
- **判据**：【机器】第 2 行 `true` 且第 3 行 `false`。

### TC-B04 outputKind 与 evidence 输出格式齐，结构检查零 findings

- **覆盖**：spec §7.1 C3 / C4、§7.2
- **前置**：C3 + C4 已落地；TC-B01 通过。
- **步骤**：① `node --input-type=module -e "import {patternRegistry} from './tools/docgen/components/patternRegistry.mjs'; console.log(patternRegistry.outputKind.has('evidence'))"`；② `node -e "const t=require('fs').readFileSync('agents/evidence-reader.md','utf8');const i=t.indexOf('## 输出格式');const j=t.indexOf('## 通用纪律');const s=t.slice(i,j);console.log(i>-1,j>-1,s.includes('原文摘句'),s.includes('文件'),s.includes('行号'),s.includes('未找到'),s.includes('严重级别'),s.includes('建议解法'))"`；③ `node --input-type=module -e "import {checkAgentFile} from './tools/execution-matrix/check-agent.mjs'; const r=checkAgentFile('evidence-reader'); console.log(r.ok, JSON.stringify(r.findings))"`
- **预期**：步骤① `true`；步骤② `true true true true true true false false`；步骤③ `true []`。
- **判据**：【机器】步骤① `true`；步骤②前 6 项全 `true`、后 2 项全 `false`；步骤③ `ok` 为 `true` 且 findings 为 `[]`。

### TC-B05 when 不含「时调用」且不以「时」结尾

- **覆盖**：spec §6.2 触发表 `when`
- **前置**：C1 已落地。
- **步骤**：① `node --input-type=module -e "import {triggerTable} from './tools/docgen/components/agentData.mjs'; const w=triggerTable['evidence-reader'].when; console.log(w); console.log(w.endsWith('时'), /在[^。]*中担任|时调用/.test(w))"`
- **预期**：第 1 行等于 `当需要通读长文并交出可核对的原文与行号（交接取证 / 事实基线回核）`；第 2 行 `false false`。
- **判据**：【机器】第 2 行 `false false`。

### TC-B06 state 登记 replaced 且 check-agents 报 15 已接管

- **覆盖**：spec §7.1 C7、§7.4、§9 V-10
- **前置**：C7 已落地。
- **步骤**：① `node -e "console.log(require('./tools/docgen/state.json').agents['evidence-reader'])"`；② `node tools/docgen/cli.mjs check-agents`
- **预期**：步骤① `replaced`；步骤② exit 0，输出 `OK：15 个 agent 已检查（已接管 15，未迁移 0）`。
- **判据**：【机器】步骤①逐字 `replaced`；步骤② stdout 含 `15 个 agent` 与 `已接管 15，未迁移 0`（[cli.mjs:156](file:///d:/Seed/retro-skills/tools/docgen/cli.mjs#L156) 的两个数字都从 `agentData.length` / 现算 replaced 派生，不写死）。

### TC-B07 annotations 十键全为 pass

- **覆盖**：spec §7.1 C8、§7.4
- **前置**：C8 已落地。
- **步骤**：① `node -e "const a=require('./rules/.inspector-annotations.json');const k=['A1','A2','B1','B2','B3','B4','C1','C2','C3','C4'];console.log(JSON.stringify(k.filter(x=>a['evidence-reader:'+x]!=='pass')))"`；② `node --input-type=module -e "import {readAnnotations,checkSemantic} from './tools/execution-matrix/check-agent.mjs'; console.log(JSON.stringify(checkSemantic(readAnnotations(),'evidence-reader')))"`
- **预期**：步骤① `[]`；步骤② `[]`。
- **判据**：【机器】两行均为 `[]`。**人工补充**：这十个 `pass` 必须由独立于施工者的实例判过（判者与证据记在评审批次账里）——注入 `pass` 而不判即违规，见 §9 建议 7。

### TC-B08 与 reviewer-reader / detective-observer 的职责边界不重叠

- **覆盖**：spec §6.3、§6.1（定名理由：与 `reviewer-reader` 分族）
- **前置**：三张卡都在 `agents/`。
- **步骤**：① `node -e "const t=require('fs').readFileSync('agents/evidence-reader.md','utf8');console.log(t.includes('不出观点'),t.includes('不出问题卡'),t.includes('不参与评审'))"`；② 打开 `agents/evidence-reader.md`、`agents/reviewer-reader.md`、`agents/detective-observer.md` 的「你是谁」节逐句比对。
- **预期**：步骤① `true true true`；步骤②三张卡的产出物互不相同：evidence 摘要 / 问题卡 / 观察记录，且没有任何一张同时声称做两件事。
- **判据**：【机器】步骤①三项全 `true`；【人工】reviewer-reader 与 detective-observer 各看一遍，无「同一职责出现两次」的句子（判据 = 三份产出物名称不交叉）。

### TC-B09 tools 顺序不同但集合相等必须判绿（假阳性样例）

- **覆盖**：spec §7.6「ToolsViolation 不放松」的判别力（断言 4 是集合恰等，不是字符串相等）
- **前置**：C1 已落地。
- **步骤**：① `node --input-type=module -e "import {agentData,triggerTable} from './tools/docgen/components/agentData.mjs'; import {validateAgentData} from './tools/docgen/components/validateAgentData.mjs'; const d=structuredClone(agentData); d.find(a=>a.name==='evidence-reader').tools=['Grep','Read','Glob']; try{validateAgentData(d,triggerTable);console.log('ok')}catch(e){console.log(e.code)}"`
- **预期**：输出 `ok`。
- **判据**：【机器】输出恰为 `ok`。若输出 `ToolsViolation`，说明实现把「集合相等」写成了「顺序 / 字符串相等」= 假阳性，必须改实现而不是改判据。

### TC-B10 reader 卡「边界」节为取证角色句、不含「只读评审角色」

- **覆盖**：spec §9 V-11、§7.1 C10、§6.2 `boundary`、§8 F14
- **前置**：C10 已落地（模板「边界」节改槽位 `{{BOUNDARY}}`，`renderAgent` 用 `agent.boundary ?? 默认值`）；`agents/evidence-reader.md` 由生成器产出；TC-B01 通过。
- **步骤**：
  ① 边界节内容探针：`node -e "const t=require('fs').readFileSync('agents/evidence-reader.md','utf8');const i=t.lastIndexOf('## 边界');const s=i>-1?t.slice(i):'';console.log(i>-1);console.log(s.includes('只读评审角色'));console.log(s.includes('不得创建、修改、删除任何文件'),s.includes('不出观点'),s.includes('不参与评审'))"`
  ② 两处 grep 对照（旧句无、正句有）：`Select-String -Path agents/evidence-reader.md -Pattern '只读评审角色'`；`Select-String -Path agents/evidence-reader.md -Pattern '只读取证角色'`
  ③ 槽位确实被消费（模板里是槽位、不是硬编码句）：`node -e "const t=require('fs').readFileSync('tools/docgen/templates/agent.md.tpl','utf8');console.log(t.includes('{{BOUNDARY}}'),/你是只读评审角色：[^\r\n]*不裁决他人分歧/.test(t))"`
- **预期**：① 三行：`true` / `false` / `true true true`（第 1 行证明节存在，第 2 行必须 `false`）；② 第 1 条无输出、第 2 条恰 1 行；③ `true false`。
- **判据**：【机器】① 第 1 行 `true`、第 2 行 `false`、第 3 行三个 `true`；② 第 1 条零匹配、第 2 条恰 1 行；③ `true false`。任一不满足即红。
- **为什么必须单独立这条**：C10 的失败形态是「卡自我描述与职责相反」——`evidence-reader` 不评审，却写「你是只读评审角色……无中断评审的权力」。它与 F6 方向相反：**14 席必须逐字节不变，所以任何逐字节比对（`gate`）都发现不了 reader 卡这一句错**（默认值就是旧句），只能直接判卡文（见 TC-D08）。

### TC-B11 reader 卡「自由探索」节为「本节不适用…」形态，不含旧模板句

- **覆盖**：spec §9 V-11、§7.1 **C11**、§7.1 **C3**（默认常量单源）、§6.2 `explorePolicy`、§8 F14 邻域
- **前置**：C11 已落地（模板该节改槽位 `{{EXPLORE}}`，`renderAgent` 按 `explorePolicy === 'none'` 取 `DEFAULT_EXPLORE_NONE`，否则 `DEFAULT_EXPLORE`）；C3 已落地（**默认常量只在 `patternRegistry` 存一份**：`DOMAIN` / `DEFAULT_BOUNDARY` / `DEFAULT_EXPLORE` / `DEFAULT_EXPLORE_NONE` 共四个——口径同 §5 回归清单）；`agents/evidence-reader.md` 由生成器产出；TC-B01 通过。
- **步骤**：
  ① 卡文探针（旧句必须不在、新句必须在）：`node -e "const t=require('fs').readFileSync('agents/evidence-reader.md','utf8');console.log(t.includes('现场生成 3-5 个'),t.includes('只答固定清单 = 不合格'));const i=t.indexOf('## 自由探索');const s=i>-1?t.slice(i):'';console.log(i>-1,/本节不适用/.test(s),/生成 3-5 个/.test(s))"`
  ② 模板只留槽位（旧句不得硬编码在模板里）：`node -e "const t=require('fs').readFileSync('tools/docgen/templates/agent.md.tpl','utf8');console.log(t.includes('{{EXPLORE}}'),t.includes('现场生成 3-5 个'))"`
  ③ 旧句单源（只许出现在 `patternRegistry`）：`node -e "const fs=require('fs');const P=['tools/docgen/components/patternRegistry.mjs','tools/docgen/components/renderAgent.mjs','tools/docgen/templates/agent.md.tpl'];console.log(JSON.stringify(P.map(p=>fs.readFileSync(p,'utf8').includes('现场生成 3-5 个'))))"`
  ④ `DEFAULT_EXPLORE_NONE` 的文本（= 「本节不适用」句）单源（三个默认常量都只在 `patternRegistry` 存一份，C3）：`node -e "const fs=require('fs');const P=['tools/docgen/components/patternRegistry.mjs','tools/docgen/components/renderAgent.mjs','tools/docgen/templates/agent.md.tpl'];const n=t=>(t.match(/本节不适用/g)||[]).length;console.log(JSON.stringify(P.map(p=>n(fs.readFileSync(p,'utf8')))))"`
- **预期**：① 两行：`false false` / `true true false`；② `true false`；③ `[true,false,false]`；④ `[1,0,0]`。
- **判据**：【机器】① 第 1 行 `false false`、第 2 行 `true true false`；② `true false`；③ `[true,false,false]`；④ **`[1,0,0]`**——`DEFAULT_EXPLORE_NONE` 的文本（「本节不适用…」句）必须在 `patternRegistry` 恰出现 **1 次**，在 `renderAgent` 与模板各 **0 次**。任一不满足即红：④ 首项 `0` = 常量没定义（C3 漏做）；末两项非 0 = 同一句在渲染器 / 模板里又写了一遍（两处维护，下一次改默认句必漂，与 C3「三个默认常量只在这里存一份」冲突）。**为什么新增 ④**：③ 只守住旧句（`DEFAULT_EXPLORE`）单源，新句（`DEFAULT_EXPLORE_NONE`）若被复制到 `renderAgent` 或模板，③ 全绿、卡文也对，但单源已破——两条合起来才是「三个常量各存一份」。**为什么必须单独立这条（与 B10 分开）**：C10 管「边界」句（`DEFAULT_BOUNDARY`）、C11 管「自由探索」两句（`DEFAULT_EXPLORE` / `DEFAULT_EXPLORE_NONE`），是两个独立槽位、三个常量。C11 的两条错路都到不了「10 键全 pass」：保留模板句 → B3（职责动作被边界禁止）该判 fail；删掉模板句 → B4（无自由探索要求）该判 fail——所以必须显式改成「本节不适用」并留下理由（`criteria.md` 0.2 的形态适配）。负例见 TC-D09。

### TC-B12 `boundary` + `explorePolicy` 被 `BASE_KEYS` 接受（不判非法）

- **覆盖**：spec §7.1 **C5**（`BASE_KEYS` 加 `domain` / `boundary` / `explorePolicy` 三键）
- **前置**：C5 已落地。
- **步骤**：① `node --input-type=module -e "import {agentData,triggerTable} from './tools/docgen/components/agentData.mjs'; import {validateAgentData} from './tools/docgen/components/validateAgentData.mjs'; try{validateAgentData(agentData,triggerTable);console.log('ok')}catch(e){console.log(e.code)}; const a=agentData.find(x=>x.name==='evidence-reader'); console.log(typeof a.boundary==='string'&&a.boundary.length>0, a.explorePolicy)"`
- **预期**：两行：`ok` / `true none`。
- **判据**：【机器】第 1 行 `ok`、第 2 行 `true none`。**失败态**：`BASE_KEYS` 没加这两键 → 断言 15 把它们当多余键 → `TriggerFieldMisplaced`（负例 = TC-E32）；或数据里漏写 `explorePolicy` → 第 2 行为 `true undefined`（说明 C11 的槽位没有输入）。**为什么与 D07 分列**：D07 判的是 `domain` 被接受且只有 reader 带它；本条判 `boundary` / `explorePolicy` 这两个**新增槽位字段**本身没被判非法——三种字段是三处独立的断言改动（C5 ①/②/④）。

### TC-C01 gate 输出 baseline 37/37

- **覆盖**：spec §9 V-6（37 = 22 rule + 15 agent，从 `BASELINE_RULES.length + agentPaths().length` 派生）
- **前置**：C1–C11 全部落地；C6b 已重跑 `baseline --write`。
- **步骤**：① `node tools/docgen/cli.mjs gate`
- **预期**：exit 0；stdout 恰 1 行 `baseline 37/37`；stderr 空。
- **判据**：【机器】exit 0 且 stdout 逐字 `baseline 37/37`。

### TC-C02 baseline.json 恰 37 条且排序位正确

- **覆盖**：spec §7.1 C6
- **前置**：C6b 已用 `node tools/docgen/cli.mjs baseline --write` 重生成（35 → 37：22 rule + 15 agent）。
- **步骤**：① `node -e "const j=require('./tools/docgen/baseline.json');console.log(j.length);console.log(j.indexOf('agents/evidence-reader.md')-j.indexOf('agents/detective-observer.md'))"`；② `node -e "const j=require('./tools/docgen/baseline.json');console.log(j[j.length-1])"`
- **预期**：步骤① `37` 与 `1`（evidence-reader 紧跟在 detective-observer 之后，字典序正确）；步骤② 最后一条是 `agents/` 开头（rule 在前、agent 按字典序在后）。
- **判据**：【机器】步骤①两行恰为 `37` 与 `1`；步骤②以 `agents/` 开头。

### TC-C03 BASELINE_RULES 22 条且含新规则

- **覆盖**：spec §7.1 C2
- **前置**：C2 已落地。
- **步骤**：① `node --input-type=module -e "import {BASELINE_RULES,agentPaths} from './tools/docgen/components/baseline.mjs'; console.log(BASELINE_RULES.length, agentPaths().length, BASELINE_RULES.includes('rules/dev-workflow-mainline.md'))"`
- **预期**：`22 15 true`。
- **判据**：【机器】输出逐字 `22 15 true`。

### TC-C04 npm run check 各环节全绿

- **覆盖**：spec §9 V-7
- **前置**：以上正例全绿；工作树干净；`D:/Seed/agent-assets-sync` 在位（见 §0 外部依赖提醒）。
- **步骤**：① `npm run check`；② `$LASTEXITCODE`
- **预期**：exit 0；stdout 同时含 `① 语法检查通过`、`baseline 37/37`、`A 组+十键检查已覆盖 15 席`、`0 findings`、`④ markdown 检查通过`、`check 全部通过`；node --test 汇总含 `# fail 0`。
- **判据**：【机器】exit 0 且上述六段文本同时出现，`# fail 0`。

### TC-C05 半改：生产侧已升级、测试侧仍 35 → check-baseline 必红

- **覆盖**：spec §8 F8 / F13、§7.5（`check-baseline.test.mjs:30,36` 仍写 35，而生产侧已是 37）
- **前置**：副本仓；**生产侧已升级**（`agentData` 15 席、`BASELINE_RULES` 22 条、已跑 `baseline --write` → 37 条），**测试侧仍 35**（`:30` 写 `35`、`:36` 写 `/baseline 35\/35/`，未改）。
- **步骤**：① `node --test tools/docgen/test/check-baseline.test.mjs`
- **预期**：exit 1；输出含 `ERR_ASSERTION`，且同时出现 `+ 37` 与 `- 35`（若按建议改成派生，则失败态表现为 `37 !== 35`）。
- **判据**：【机器】exit 1 且输出含 `ERR_ASSERTION`。**正确改法（本用例要防的反面）**：`check-baseline.test.mjs:30` 改 `assert.equal(json.length, BASELINE_RULES.length + agentPaths().length)`（从 [baseline.mjs](file:///d:/Seed/retro-skills/tools/docgen/components/baseline.mjs) 派生）、`:36` 的正则由同一常量拼出——**不是**把 `35` 换成 `37`。对应测试：待 plan Task N。

### TC-C06 12 处一个字未改 → npm run check 必红

- **覆盖**：spec §8 F8 / F13、§7.5（**12 处全未改**的整体红）
- **前置**：副本仓。生成器与数据已改（15 席 / 37 条），但 §7.5 表里的 **12 处**计数一个字未动。
- **步骤**：① `npm run check`；② `$LASTEXITCODE`
- **预期**：exit 1；stderr 末行 `check 未通过`；stdout 的 node --test 汇总 `# fail` ≥ 1，且失败列表跨 ≥ 3 个测试文件（data / check-baseline / cli-gate / e2e-final / review-fixes / pilot-gate 中的多个）。
- **判据**：【机器】exit 1 且 stderr 含 `check 未通过`；`# fail` ≥ 1。**正确改法**：12 处一律改为派生（`agentData.length` / `new Set(names).size === names.length` / `BASELINE_RULES.length + agentPaths().length` / 由共享常量拼正则 / `未迁移 ${agentData.length}`），字面量只允许留在 `test(...)` 标题里；`data.test.mjs:50` 的同行注释直接删数字。对应测试：待 plan Task N。

### TC-C07 data.test.mjs 第三处硬编码未改必红

- **覆盖**：spec §8 F13、§7.5 第 2 行（`tools/docgen/test/data.test.mjs:10` 的 `new Set(names).size, 14`；属 12 处之一）
- **前置**：副本仓。只把 `data.test.mjs:8` 与 `data.test.mjs:41` 改成派生表达式，`:10` 的 `new Set(names).size` 仍比 `14`。
- **步骤**：① `node --test tools/docgen/test/data.test.mjs`
- **预期**：exit 1；输出含 `ERR_ASSERTION` 与 `15 !== 14`。
- **判据**：【机器】exit 1 且输出含 `ERR_ASSERTION`。**正确改法**：`:10` 改 `assert.equal(new Set(names).size, names.length)`（自比，永远派生），或直接删掉这条冗余断言（`:8` 已保证数量）。对应测试：待 plan Task N。

### TC-C08 cli-gate / review-fixes / pilot-gate 的计数未改必红

- **覆盖**：spec §8 F13、§7.5 第 4–12 行中的五处（`cli-gate.test.mjs:14,31,58`、`review-fixes.test.mjs:45`、`pilot-gate.test.mjs:38`，均属 12 处）
- **前置**：副本仓。按 §7.5 只改了 `data.test.mjs`（3 行 + 1 处注释）、`check-baseline.test.mjs`、`e2e-final.test.mjs` 三个文件，这五处未改。
- **步骤**：① `node --test tools/docgen/test/cli-gate.test.mjs tools/docgen/test/review-fixes.test.mjs tools/docgen/test/pilot-gate.test.mjs`
- **预期**：exit 1；输出含 `did not match the regular expression`（三处 `baseline 35/35`）与 `未迁移 14`（pilot-gate 的计数）。
- **判据**：【机器】exit 1 且输出含上述两串。**正确改法**：`baseline N/N` 的正则由 `BASELINE_RULES.length + agentPaths().length` 拼出；`pilot-gate` 改 `` `未迁移 ${agentData.length}` ``（它已 import `agentData`，[pilot-gate.test.mjs:7](file:///d:/Seed/retro-skills/tools/docgen/test/pilot-gate.test.mjs#L7)）。对应测试：待 plan Task N。

### TC-C09 baseline.json 未重生成则 gate 报 BaselineDrift

- **覆盖**：spec §7.1 C6
- **前置**：副本仓；`BASELINE_RULES` 已加新规则（22 条）与 agentData 已 15 席，但 `baseline.json` 仍是旧的 35 条。
- **步骤**：① `node tools/docgen/cli.mjs gate`；② `$LASTEXITCODE`
- **预期**：exit 2；stderr 首行以 `BaselineDrift:` 开头。
- **判据**：【机器】exit 2 且 stderr 首行前缀 `BaselineDrift:`。对应测试：待 plan Task N。

### TC-C10 C9 断言在位：state 键集与 agentData 名字集比对

- **覆盖**：spec §7.1 C9、§9 V-10
- **前置**：C9 已落地；`npm run check` 在正常态为绿。
- **步骤**：
  ① 数据源接上：`Select-String -Path scripts/check-all.mjs -Pattern 'agentData' | ForEach-Object { "$($_.LineNumber): $($_.Line.Trim())" }`
  ② 两个来源都在位：`node -e "const t=require('fs').readFileSync('scripts/check-all.mjs','utf8');console.log(/readState\(\)/.test(t),/agentData/.test(t))"`
  ③ 正常态全绿且覆盖 15 席：`npm run check` → 看 stdout
- **预期**：步骤① ≥ 1 行（至少一条 import / 引用 `agentData`，说明名字集真被取到）；步骤② `true true`；步骤③ exit 0，stdout 含 `A 组+十键检查已覆盖 15 席`。
- **判据**：【机器】步骤①非空、步骤② `true true`、步骤③ exit 0 + 该行。**本用例只证「断言接上了两个数据源」，不能证「比的是差集」**——真正的行为证据是 TC-E06（删一条 state 键必红）。这条存在性判据是 grep 代理，缺口已登记到 §8。对应测试：待 plan Task N。
- **落点已定（不可改判）**：断言必须写在 `scripts/check-all.mjs`，**不是** `tools/docgen/state.mjs` 的 `readState()`。断言下沉 `readState()` 已被 spec §7.1「C9 为什么不放进 `readState()`」否决，理由是 **state 文件缺失时返回空表是既有语义**（`pilot-gate.test.mjs` 依赖「state 缺失 = 全量 registered」），下沉会改掉这条语义并波及多个测试。因此本用例步骤①的 grep 目标只能是 `scripts/check-all.mjs`；若在那里查不到、却在 `state.mjs` 里查到同名断言，判**不符合 spec**（而非「更彻底的实现」）。

### TC-C11 §7.5 的 12 处逐行派生化 + 全局（剥 `//` 后）0 命中

- **覆盖**：spec §8 F13、§7.5「一律派生化，不许只改字面量」（**12 处 = 11 处断言行 + 1 处同行注释**）
- **前置**：正常态（12 处已按 §7.5「处置」列改完）；副本仓用于构造态。12 个 `path:line` 如下（行号取**施工前 HEAD**；施工后若行号漂移，用步骤②③的明细重新定位，判据不变）：

| # | path:line | 现值（施工前） | 处置后必须满足 |
|---|---|---|---|
| 1 | `tools/docgen/test/data.test.mjs:8` | `assert.equal(agentData.length, 14)` | 与 `new Set(agentData.map(a=>a.name)).size` 自比 + 断言含 `evidence-reader` |
| 2 | `tools/docgen/test/data.test.mjs:10` | `new Set(names).size, 14` | `new Set(names).size === names.length` |
| 3 | `tools/docgen/test/data.test.mjs:41` | `paths.length, 14` | `paths.length === agentData.length` |
| 4 | **`tools/docgen/test/data.test.mjs:50`** | 同行注释 `// 21 + 14 = 35` | 注释里的数字删除（改 `// rule 数 + agent 数`） |
| 5 | `tools/docgen/test/check-baseline.test.mjs:30` | `json.length, 35` | `BASELINE_RULES.length + agentPaths().length` |
| 6 | `tools/docgen/test/check-baseline.test.mjs:36` | `/baseline 35\/35/` | 由共享常量拼正则 |
| 7 | `tools/docgen/test/e2e-final.test.mjs:29` | `n, 35` | 同上（注释「35 开工 / 36 新增后」同步改 37） |
| 8 | `tools/docgen/test/cli-gate.test.mjs:14` | `/baseline 35\/35/` | 同上 |
| 9 | `tools/docgen/test/cli-gate.test.mjs:31` | `/baseline 35\/35/` | 同上 |
| 10 | `tools/docgen/test/cli-gate.test.mjs:58` | `/baseline 35\/35/` | 同上 |
| 11 | `tools/docgen/test/review-fixes.test.mjs:45` | `/baseline 35\/35/` | 同上 |
| 12 | `tools/docgen/test/pilot-gate.test.mjs:38` | `/已接管 0，未迁移 14/` | `未迁移 ${agentData.length}` |

- **步骤**：
  ① 12 个 `path:line` 逐行判（**整行**含注释，因为第 12 处就是注释）：`node -e "const fs=require('fs');const P=[['tools/docgen/test/data.test.mjs',8],['tools/docgen/test/data.test.mjs',10],['tools/docgen/test/data.test.mjs',41],['tools/docgen/test/data.test.mjs',50],['tools/docgen/test/check-baseline.test.mjs',30],['tools/docgen/test/check-baseline.test.mjs',36],['tools/docgen/test/e2e-final.test.mjs',29],['tools/docgen/test/cli-gate.test.mjs',14],['tools/docgen/test/cli-gate.test.mjs',31],['tools/docgen/test/cli-gate.test.mjs',58],['tools/docgen/test/review-fixes.test.mjs',45],['tools/docgen/test/pilot-gate.test.mjs',38]];let h=0;for(const p of P){const L=fs.readFileSync(p[0],'utf8').split(/\r?\n/);const line=L[p[1]-1]||'';if(/(?<![0-9])(14|15|35|36|37)(?![0-9])/.test(line)){h++;console.log('LITERAL',p[0]+':'+p[1],line.trim())}}console.log('hits',h)"`
  ② 全局（`tools/docgen/test/*.test.mjs`，剥 `//` 注释与单引号字符串后）`35|36|37` 命中 0：`node -e "const fs=require('fs'),path=require('path');const d='tools/docgen/test';let h=0;for(const f of fs.readdirSync(d).filter(x=>x.endsWith('.test.mjs'))){fs.readFileSync(path.join(d,f),'utf8').split(/\r?\n/).forEach((l,i)=>{const code=l.replace(/\/\/.*$/,'').replace(/'(?:[^'\\]|\\.)*'/g,'');if(/(?<![0-9])(35|36|37)(?![0-9])/.test(code)){h++;console.log(f+':'+(i+1),l.trim())}})}console.log('hits',h)"`
  ③ 全局断言行（`14|15` 的席位计数余量）命中 0：`node -e "const fs=require('fs'),path=require('path');const d='tools/docgen/test';let h=0;for(const f of fs.readdirSync(d).filter(x=>x.endsWith('.test.mjs'))){fs.readFileSync(path.join(d,f),'utf8').split(/\r?\n/).forEach((l,i)=>{const code=l.replace(/\/\/.*$/,'');if(/assert\.(equal|strictEqual|deepEqual|match|ok)\([^\r\n]*(?<![0-9])(14|15)(?![0-9])/.test(code)){h++;console.log(f+':'+(i+1),l.trim())}})}console.log('hits',h)"`
- **预期**：① `hits 0`（无 `LITERAL` 行）；② `hits 0`（无明细行）；③ `hits 0`。
- **判据**：【机器】三行末均 `hits 0` 且无明细行。**基线对照（判别力）**：施工前 ① 命中 **12** 行（11 处断言 + `data.test.mjs:50` 注释），② 命中 ≥ 5 行，③ 命中 2 行；构造态把任一处写成 `assert.equal(n, 37)` 或 `assert.match(stdout, /baseline 37\/37/)` → ① 或 ②③ 命中 1 行并被点名。**为什么第 12 处单独算一处**：它是同行注释里的 `21 + 14 = 35`——不删的话，所有「全局 0 命中」型判据永远红（spec §7.5 已把它列为一行，处置 = 删数字，不是改数字）。**为什么 ② 要剥字符串**：字面量允许留在 `test(...)` 标题里（如「35 开工 / 37 新增后」），不剥会把合法标题判成违规 = 假阳性。对应测试：待 plan Task N。

### TC-D01 `gate` 逐字节兜住 14 席；给 reviewer-qa.md 注入一字节必报 Mismatch

- **覆盖**：spec §9 V-8、§7.6「逐字节不变」+「**不要用 `render13-snapshot.mjs`**」
- **前置**：正常态（C1–C11 已落地，`state.json` 的 **15 席全为 `replaced`**）；副本仓用于构造态。
- **步骤**：
  ① 正常态：`node tools/docgen/cli.mjs gate`；② `$LASTEXITCODE`
  ③ 副本仓注入一字节（末尾加一个空格）：`node -e "require('fs').appendFileSync('agents/reviewer-qa.md',' ')"`
  ④ 副本仓：`node tools/docgen/cli.mjs gate`；⑤ `$LASTEXITCODE`
- **预期**：① stdout 恰 1 行 `baseline 37/37`、stderr 空；② `0`；④ stderr 首行以 `Mismatch:` 开头且点名 `agents/reviewer-qa.md`；⑤ `1`。
- **判据**：【机器】② `0` + ① 该行；⑤ `1` + ④ 首行前缀 `Mismatch:`。**为什么改用 `gate`、删掉快照**：`render13-snapshot.mjs` 只渲染一个 `fixture-13`、不遍历 `agentData` → 改前改后恒等（**零判别力**，spec §7.6 明令不要用）。`gate` 对 `state=replaced` 的每一席做 `compareBuffers`，注入一字节必红——这才是「现有席位零回归」的硬证据。**注入点为什么选 `reviewer-qa.md`**：改动面最小（一个文件、一个字节），且它是 14 席之一、`state=replaced`，走的就是被兜的那条路径。

### TC-D02 施工后 `agents/` 只多出 evidence-reader 一个新文件

- **覆盖**：spec §9 V-8、§0 公共前置（施工后：只允许 S1 交付清单内路径）
- **前置**：**施工后语境**（S1 已施工、改动尚未提交，或已 stash 回工作树）；`agents/` 下无临时文件。
- **步骤**：① `git status --porcelain agents/`；② `git diff --stat -- agents/`
- **预期**：步骤①恰 1 行 `?? agents/evidence-reader.md`；步骤②空输出。
- **判据**：【机器】步骤①行数 = 1 且以 `agents/evidence-reader.md` 结尾、不含 ` M `；步骤②退出码 0 且无输出。**施工前语境下本用例不成立**（此时 `?? agents/evidence-reader.md` 不该出现）——所以前置必须写清是施工后；若施工前就出现该行，说明有人提前建了卡（F4 的形态）。

### TC-D03 13 席 description 仍走默认分支，`senior-sdet` 单列按手写卡判

- **覆盖**：spec §7.6「description 句式不变」（既有 14 席 = 13 席议会席 + 1 席 `outputKind: testcase` 的手写卡）
- **前置**：TC-D02 通过（14 个旧卡文件未被修改）。
- **步骤**：① `node -e "const f=require('fs');const d=f.readdirSync('agents').filter(x=>x.endsWith('.md')&&x!=='evidence-reader.md').sort();console.log(d.length);for(const x of d){const m=/^description:\s*(.+)$/m.exec(f.readFileSync('agents/'+x,'utf8'));const s=m?m[1]:'MISSING';console.log(x,s.includes('在议会评审中担任'),s.includes('开发工作流'),s.includes('Do not use for'))}"`
- **预期**：第 1 行 `14`；随后 **13 行**为 `true false false`（议会席：仍写「在议会评审中担任」、不含「开发工作流」、不含 `Do not use for`）；**恰 1 行**为 `senior-sdet.md false false true`（它是 `outputKind: testcase` 的手写卡，走 `description.handwritten` 分支，description 里本来就有 `Do not use for`）。
- **判据**：【机器】行数 15；第 1 行 `14`；之后 13 行逐行 `true false false` 且文件名不含 `senior-sdet.md`；`senior-sdet.md` 那行必须 `false false true`。**为什么必须分流**：把 15 行一律要求 `true false` 会把 `senior-sdet` 判成违规（假阳性）——它的 description 是手写句式（「资深测试开发工程师（Senior SDET）。当需要…时调用。Do not use for …」），从来没有「在议会评审中担任」。这一处是三版之前判据的假阳性来源。

### TC-D04 renderAgent 不传 domain 时被 grep 判据抓住

- **覆盖**：spec §7.3、§8 F6（domain 未接线的失败形态）
- **前置**：TC-B03 已通过在正常态。
- **步骤**：① `node -e "const t=require('fs').readFileSync('agents/evidence-reader.md','utf8');console.log(/^description:.*在议会评审中担任/m.test(t))"`；② `Select-String -Path agents/evidence-reader.md -Pattern '在议会评审中担任'`
- **预期**：步骤① `false`；步骤②无输出。
- **判据**：【机器】步骤① `false` 且步骤②无输出。**失败态 = 实现只改了 agentData 加了 domain 字段、但 renderAgent 仍调默认参数**，此时两处都翻成 `true` / 有匹配行 → 红。对应测试：待 plan Task N。

### TC-D05 domain 输入空间：`''` / `'  '` / `123` 都不许拼出空 domain 句，且 `validateAgentData` 拒绝

- **覆盖**：spec §7.3（`??` 拦不住空串：`''` → 「在中担任」，全空格 → 「在  中担任」，非字符串被隐式转换）、§7.1 C5 ②
- **前置**：C5 已落地（`renderAgent` 用归一化后的值：`typeof === 'string' ? trim() : ''`，再 `|| DOMAIN`——**引用 `patternRegistry` 导出的 `DOMAIN` 常量，不得内联 `'议会评审'` 字面量**，见 spec §7.3；断言 8 追加「`domain` 存在时 trim 非空」）；**不改仓库（内存构造）**。
- **步骤**：① `node --input-type=module -e "import {readFileSync} from 'fs'; import {agentData,triggerTable} from './tools/docgen/components/agentData.mjs'; import {validateAgentData} from './tools/docgen/components/validateAgentData.mjs'; import {renderAgent} from './tools/docgen/components/renderAgent.mjs'; const tpl=readFileSync('tools/docgen/templates/agent.md.tpl','utf8'); for(const v of ['','  ',123]){const d=structuredClone(agentData); const a=d.find(x=>x.name==='evidence-reader'); a.domain=v; let line='MISSING'; try{const t=renderAgent({agent:a,trigger:triggerTable[a.name],template:tpl,sharedBlocks:{},outputFormats:{}}); const m=/^description:\s*(.+)$/m.exec(t); line=m?m[1]:'MISSING';}catch(e){line='THROW:'+e.code;} let code='NO_THROW'; try{validateAgentData(d,triggerTable);}catch(e){code=e.code;} console.log(JSON.stringify(v),line.includes('在中担任'),line.includes('在  中担任'),code); }"`
- **预期**：三行，逐行为 `"" false false DescriptionDerivation` / `"  " false false DescriptionDerivation` / `123 false false DescriptionDerivation`。
- **判据**：【机器】三行均满足：第 2、3 项为 `false false`（description 不得含「在中担任」或「在  中担任」——两种情况分别对应空串与全空格），第 4 项为 `DescriptionDerivation`（**不得是 `NO_THROW`**，也不得是新造的错误码——`exitCodeFor` 对未知码会抛 `未知错误码`）。**为什么三种都要构造**：`domain=''` 走 `||` 兜底却挡不住全空格；`123` 走隐式转换会拼出「在123中担任」——三种输入三种错法，只测一种会漏。**判据来源**：spec §7.3 的改法原文（`const d = typeof agent.domain === 'string' ? agent.domain.trim() : ''` + 非空校验）。

### TC-D06 改默认 DOMAIN 则 gate 报 Mismatch

- **覆盖**：spec §7.6「默认值不变」
- **前置**：副本仓；把 `tools/docgen/components/patternRegistry.mjs` 的 `DOMAIN` 改成 `议事厅`（模拟默认值漂移）。
- **步骤**：① `node tools/docgen/cli.mjs gate`；② `$LASTEXITCODE`
- **预期**：exit 1；stderr 首行以 `Mismatch:` 开头（14 席卡与渲染不再逐字节一致）。
- **判据**：【机器】exit 1 且 stderr 首行前缀 `Mismatch:`。对应测试：待 plan Task N。

### TC-D07 domain 字段被接受且只有 evidence-reader 带它

- **覆盖**：spec §7.1 C5
- **前置**：C5 已落地。
- **步骤**：① `node --input-type=module -e "import {agentData,triggerTable} from './tools/docgen/components/agentData.mjs'; import {validateAgentData} from './tools/docgen/components/validateAgentData.mjs'; try{validateAgentData(agentData,triggerTable);console.log('ok')}catch(e){console.log(e.code)}; console.log(agentData.find(a=>a.name==='evidence-reader').domain); console.log(agentData.filter(a=>a.domain!==undefined).length)"`
- **预期**：三行 `ok`、`开发工作流`、`1`。
- **判据**：【机器】三行逐字相等（第三行 `1` 证明没有给旧 14 席加 domain）。

### TC-D08 边界句退回模板现句 → reader 卡变回「只读评审角色」必被检出

- **覆盖**：spec §8 F14、§7.1 C10（含「C10 的兼容硬约束」）、§9 V-11
- **前置**：C10 已落地；TC-B10 在正常态为绿（卡内不含「只读评审角色」）。
- **步骤**：
  ① 正常态探针：`node -e "const t=require('fs').readFileSync('agents/evidence-reader.md','utf8');const s=t.slice(t.lastIndexOf('## 边界'));console.log(s.includes('只读评审角色'))"`
  ② 构造「模板退回硬编码现句」（等价于 C10 未落地）：不写盘，用内存里被还原的模板重渲染 reader 卡并看边界节：`node --input-type=module -e "import {readFileSync} from 'fs'; import {agentData,triggerTable} from './tools/docgen/components/agentData.mjs'; import {renderAgent} from './tools/docgen/components/renderAgent.mjs'; const hard='你是只读评审角色：不得创建、修改、删除任何文件；不裁决他人分歧；无中断评审的权力。'; const tpl=readFileSync('tools/docgen/templates/agent.md.tpl','utf8').replace('{{BOUNDARY}}',hard); const a=agentData.find(x=>x.name==='evidence-reader'); const t=renderAgent({agent:a,trigger:triggerTable[a.name],template:tpl,sharedBlocks:{},outputFormats:{}}); const s=t.slice(t.lastIndexOf('## 边界')); console.log(s.includes('只读评审角色')); console.log(s.includes('不得创建、修改、删除任何文件'))"`
  ③ 对照（为什么 `gate` 抓不住）：同一构造下 14 席渲染与盘上卡逐字节比对：`node --input-type=module -e "import {readFileSync} from 'fs'; import {agentData,triggerTable} from './tools/docgen/components/agentData.mjs'; import {renderAgent} from './tools/docgen/components/renderAgent.mjs'; const hard='你是只读评审角色：不得创建、修改、删除任何文件；不裁决他人分歧；无中断评审的权力。'; const tpl=readFileSync('tools/docgen/templates/agent.md.tpl','utf8').replace('{{BOUNDARY}}',hard); let d=0; for(const a of agentData){ if(a.name==='evidence-reader') continue; const t=renderAgent({agent:a,trigger:triggerTable[a.name],template:tpl,sharedBlocks:{},outputFormats:{}}); if(t!==readFileSync('agents/'+a.name+'.md','utf8')) d++; } console.log('diff14',d)"`
- **预期**：① `false`；② `true` 与 `true`；③ `diff14 0`。
- **判据**：【机器】① `false`（正常态）；② 第 1 行 `true`（失败态复现成功：退回现句后 reader 卡会自我描述错误）；③ `diff14 0`。**关键判别点**：旧句与新句**都含**「不得创建、修改、删除任何文件」，所以只查这一句会误判为通过——判别力全在「只读评审角色」这一项（TC-B10 步骤①第 2 行）。**结论**：C10 漏做或半做（槽位加了但 `renderAgent` 没传 `boundary`）时，14 席逐字节（`gate`）都是绿的，**唯一能抓住的是 B10 的卡文判据**；不允许用「`gate` 未报 Mismatch」当作 C10 已做的证据。

### TC-D09 explore 槽位未接线 → `gate` 仍绿、卡仍含旧句，只有 B11 抓得住

- **覆盖**：spec §7.1 **C11**「不改会怎样」、§9 V-11、§6.2 `explorePolicy`
- **前置**：C11 已落地；TC-B11 在正常态为绿（卡内「自由探索」节为「本节不适用…」）；不改仓库（内存构造）。
- **步骤**：
  ① 判别力探针（同一份数据、只换 `explorePolicy`，两次渲染必须不同）：`node --input-type=module -e "import {readFileSync} from 'fs'; import {agentData,triggerTable} from './tools/docgen/components/agentData.mjs'; import {renderAgent} from './tools/docgen/components/renderAgent.mjs'; const tpl=readFileSync('tools/docgen/templates/agent.md.tpl','utf8'); const base=agentData.find(x=>x.name==='evidence-reader'); const render=k=>{const a=structuredClone(base); a.explorePolicy=k; return renderAgent({agent:a,trigger:triggerTable[a.name],template:tpl,sharedBlocks:{},outputFormats:{}});}; const none=render('none'),full=render('full'); console.log(none!==full); console.log(none.includes('本节不适用'),full.includes('现场生成 3-5 个'));"`
  ② `gate` 的零判别力对照：`node tools/docgen/cli.mjs gate`；③ `$LASTEXITCODE`
- **预期**：① 两行：`true` / `true true`；② stdout `baseline 37/37`；③ `0`。
- **判据**：【机器】① 第 1 行 `true`（两版渲染确实不同 → 说明 `explorePolicy` 真被消费）、第 2 行 `true true`（none 版是「本节不适用」、full 版是旧句）；②③ 绿。**失败态与结论**：若 `renderAgent` 忽略 `explorePolicy`（槽位未接线），① 第 1 行变 `false`、第 2 行变 `false false` → 本用例与 B11 同时红；而 `gate` 在「盘上卡 = 同一渲染器产物」时永远 exit 0（②③ 仍绿）——它只比字节、不比「字段是否被消费」，**零判别力**。因此 C11 不许拿「`gate` 绿」当作已做的证据，唯一防线是 B11 的卡文判据（与 D08 对 C10 的结论同构）。

### TC-E01 出口判据写成形容词必被抓住

- **覆盖**：spec §8 F1
- **前置**：正常态。
- **步骤**：① `node -e "const f=require('fs');const L=f.readFileSync('skills/dev-workflow/SKILL.md','utf8').split(/\r?\n/).map(l=>l.trim());const i=L.findIndex(l=>l.startsWith('|')&&l.includes('出口判据'));const c=l=>l.replace(/\*\*/g,'').split('|').slice(1,-1).map(x=>x.trim());const idx=c(L[i]).indexOf('出口判据');const out=[];for(let k=i+2;k<L.length&&L[k].startsWith('|');k++)out.push(c(L[k])[idx]||'');const bad=['质量达标','符合要求','尽量','完善','合理','比较好'];console.log(out.length);console.log(out.filter(x=>bad.some(w=>x.includes(w))).join(' '))"`
- **预期**：两行：`6`、第 2 行空（六个出口格无一命中禁用词）。
- **判据**：【机器】第 1 行 `6`、第 2 行为空；失败态（某行写「质量达标」）= 该词被打印出去 → 红。第二道（每格非空）：`node -e "const f=require('fs');const L=f.readFileSync('skills/dev-workflow/SKILL.md','utf8').split(/\r?\n/).map(l=>l.trim());const i=L.findIndex(l=>l.startsWith('|')&&l.includes('出口判据'));const c=l=>l.replace(/\*\*/g,'').split('|').slice(1,-1).map(x=>x.trim());const idx=c(L[i]).indexOf('出口判据');const out=[];for(let k=i+2;k<L.length&&L[k].startsWith('|');k++)out.push(c(L[k])[idx]||'');console.log(out.filter(x=>x.length<4).length)"` 必须输出 `0`。「是否真是可判定句」的语义判断不在本用例，交 §6 的 reviewer-qa 人工读。对应测试：待 plan Task N。

### TC-E02 references 只有 6 份（缺 stage-2b-plan-gate）必红

- **覆盖**：spec §8 F2、§9 V-2（「尤其漏 `stage-2b-plan-gate.md`」）
- **前置**：副本仓；把 `skills/dev-workflow/references/stage-2b-plan-gate.md` 改名成 `.bak`。
- **步骤**：① `node -e "const f=require('fs').readdirSync('skills/dev-workflow/references').filter(x=>x.endsWith('.md'));console.log(f.length);console.log(JSON.stringify(['stage-2b-plan-gate.md'].filter(x=>!f.includes(x))))"`
- **预期**：输出 `6` 与 `["stage-2b-plan-gate.md"]`（正常态为 `7` 与 `[]`）。
- **判据**：【机器】第 1 行 ≠ `7` → 红，且第 2 行点名缺失文件；验收以 TC-A02 为门。对应测试：待 plan Task N。

### TC-E03 references 多一份同样必红

- **覆盖**：spec §8 F2 边界（「恰有」是双向约束）
- **前置**：副本仓；新增 `skills/dev-workflow/references/stage-6-extra.md`。
- **步骤**：① `node -e "const f=require('fs').readdirSync('skills/dev-workflow/references').filter(x=>x.endsWith('.md'));console.log(f.length)"`
- **预期**：输出 `8`（正常态为 `7`）。
- **判据**：【机器】输出 ≠ `7` → 红。对应测试：待 plan Task N。

### TC-E04 规则复制 PRD 正文必被抓住

- **覆盖**：spec §8 F3
- **前置**：正常态。
- **步骤**：① `node -e "const t=require('fs').readFileSync('rules/dev-workflow-mainline.md','utf8');const banned=['功能点清单与流程图双向一一对应','spec + testcase 一件齐','功能点全覆盖 / 依赖无环','交付审计（含数字签字项）'];console.log(JSON.stringify(banned.filter(s=>t.includes(s))))"`；② `node -e "const t=require('fs').readFileSync('rules/dev-workflow-mainline.md','utf8');console.log((t.match(/PRD §/g)||[]).length)"`
- **预期**：步骤① `[]`；步骤② ≥ 6（R1–R6 各自带出处）。
- **判据**：【机器】步骤① `[]` 且步骤②数字 ≥ 6。对应测试：待 plan Task N。

### TC-E05 手写卡绕过生成器 gate 必非 0

- **覆盖**：spec §8 F4
- **前置**：副本仓。构造 A：把 `evidence-reader` 条目从 `tools/docgen/components/agentData.mjs` 里删掉（卡文件保留）。构造 B：保留条目，另加一个手写文件 `agents/ghost-handwritten.md`。
- **步骤**：① 构造 A 下 `node tools/docgen/cli.mjs gate`；② 构造 A 下 `node --input-type=module -e "import {collectGate} from './tools/docgen/cli.mjs'; console.log(collectGate().map(d=>d.code+':'+d.path).join('\n'))"`；③ 构造 B 下 `node tools/docgen/cli.mjs gate`
- **预期**：步骤① exit 2（**首个错误码可能是 `BaselineDrift`**：baseline.json 与常量同时漂移，gate 只打印首个错误）；步骤② 明细含 `UnregisteredHandwritten:agents/evidence-reader.md`；步骤③ exit 2 且 stderr 首行以 `UnregisteredHandwritten:` 开头（`agents/ghost-handwritten.md`）。
- **判据**：【机器】步骤① exit ≠ 0；步骤②含指定串；步骤③ exit 2 + 首行前缀 `UnregisteredHandwritten:`。**为什么分两步**：`gateChecks()` 只报首个错误，单看 gate 输出无法证明是这个守卫命中——必须用 `collectGate()` 明细兜底。对应测试：待 plan Task N。

### TC-E06 state 缺一条键 → npm run check 必红（红在 ②.6）；state 文件整体缺失也必红

- **覆盖**：spec §8 F5、§7.1 C7 / C9、§9 V-10（C9 的行为证据 + **fail-closed 的两条形态**）
- **前置**：副本仓。**构造 A**：从 `tools/docgen/state.json` 删掉 `"evidence-reader": "replaced"` 这一项；**构造 B**：整个 `tools/docgen/state.json` 删除。
- **步骤**（构造 A）：
  ① `node tools/docgen/cli.mjs gate`；② `$LASTEXITCODE`
  ③ `npm run check *> "$env:TEMP\e06.log"`；④ `$LASTEXITCODE`
  ⑤ `Select-String -Path "$env:TEMP\e06.log" -Pattern 'execution-matrix.*evidence-reader|evidence-reader.*(缺|漏|未登记)' | ForEach-Object { $_.Line.Trim() }`
  ⑥ `Select-String -Path "$env:TEMP\e06.log" -Pattern '# fail'`
  ⑦ `Select-String -Path "$env:TEMP\e06.log" -Pattern 'check 未通过'`
  步骤（构造 B）：
  ⑧ `Remove-Item tools/docgen/state.json`，再跑 ③；⑨ `$LASTEXITCODE`
  ⑩ `Select-String -Path "$env:TEMP\e06.log" -Pattern 'state'`（看红因是否指向 state 缺失）
- **预期**：② `0` 且输出 `baseline 37/37`（**gate 抓不到**：它只对 replaced 席做等值检查，缺 state 时只做存在性检查）；④ `1`；⑤ ≥ 1 行，形如 `[execution-matrix] state 覆盖不全：缺 evidence-reader`（必须同时点名 `execution-matrix` 与 `evidence-reader`）；⑥ `# fail 0`（**证明红不是测试带来的，而是 ②.6 的 C9 断言**）；⑦ 1 行（stderr 末行）；⑨ `1`；⑩ ≥ 1 行且含 `state`。
- **判据**：【机器】② `0`（证伪证据：不能靠 gate 发现）；④ `1`；⑤ ≥ 1 行且同时含 `execution-matrix` 与 `evidence-reader`；⑥ `# fail 0`；⑦ 命中；⑨ `1` + ⑩ 命中。**红的位置 = `scripts/check-all.mjs` 的 ②.6 执行力度矩阵环节**（[check-all.mjs:114-149](file:///d:/Seed/retro-skills/scripts/check-all.mjs#L114-L149) 现有 replaced 席循环之前插入 C9 断言处）。若实现把消息写成别的措辞，只要同行出现这两个 token 即可；只写「state 不一致」不点名缺哪个 = 不满足 C9 的「打印缺哪个」，判不通过。**构造 B 为什么必须单列（v4 新增）**：C9 明确「**state 文件整体缺失也一律报红**」，不沿用「缺失 = 全量 registered」的宽松语义；而 `readState()` 本身仍返回空表（`pilot-gate.test.mjs` 依赖这条语义，不能改）——所以红只能出现在 `check-all`，这与 A 同一个落点。**落点锁定**：断言下沉 `readState()` 已被 spec §7.1 否决；若实现把断言放进 `state.mjs`，②.5 的 `gate` 会先红（②.6 到不了），按实现偏差判红并在送审说明里记一笔语义变更风险。对应测试：待 plan Task N。

### TC-E07 给另一席注入一字节 → `gate` 必报 Mismatch（独立注入点）

- **覆盖**：spec §8 F6、§7.6（逐字节判据的第二个注入点）
- **前置**：副本仓；给 `agents/reviewer-ai.md` 末尾追加一个空格：`node -e "require('fs').appendFileSync('agents/reviewer-ai.md',' ')"`。
- **步骤**：① `node tools/docgen/cli.mjs gate`；② `$LASTEXITCODE`
- **预期**：exit 1；stderr 首行以 `Mismatch:` 开头且点名 `agents/reviewer-ai.md`。
- **判据**：【机器】exit 1 且 stderr 首行前缀 `Mismatch:`。**为什么与 D01 各注一席**：单个注入点可能被「针对某个文件特殊处理」骗过；两个不同席位各注一字节仍全被检出，才证明 `gate` 是遍历 `state=replaced` 全集的（`agents/*.md` 一个也不漏）。对应测试：待 plan Task N。

### TC-E08 evidence 格式退化成问题卡必被抓住

- **覆盖**：spec §8 F7、§7.2
- **前置**：正常态。
- **步骤**：① `node -e "const t=require('fs').readFileSync('agents/evidence-reader.md','utf8');const i=t.indexOf('## 输出格式');const j=t.indexOf('## 通用纪律');const s=t.slice(i,j);console.log(s.includes('严重级别'),s.includes('建议解法'),s.includes('P0'),s.includes('原文摘句'),s.includes('未找到'))"`
- **预期**：`false false false true true`。
- **判据**：【机器】前三项 `false`、后两项 `true`。对应测试：待 plan Task N。

### TC-E09 全量门在 12 处里只改 1 处时必红

- **覆盖**：spec §8 F8 / F13（走完整门的关键负例）
- **前置**：副本仓；**12 处里只把 `tools/docgen/test/data.test.mjs:8` 改成派生表达式**，其余 11 处未动。
- **步骤**：① `npm run check`；② `$LASTEXITCODE`
- **预期**：exit 1；stderr 末行 `check 未通过`；stdout 含 `# fail` 后跟非 0 数字。
- **判据**：【机器】exit 1 且 stderr 含 `check 未通过`。**正确改法**：12 处全部改派生（见 TC-C06），不做「逐处改数字」。对应测试：待 plan Task N。

### TC-E10 自引用带前缀 skill-inspector 必报 findings

- **覆盖**：spec §8 F9、§4「自引用用相对路径」
- **前置**：正常态先跑一次基线；构造：副本仓在 `skills/dev-workflow/SKILL.md` 里加一行指向 `dev-workflow/references/stage-1-prd.md` 的引用。
- **步骤**：① 正常态 `node skills/skill-inspector/scripts/check.mjs`；② 构造态 `node skills/skill-inspector/scripts/check.mjs --json`
- **预期**：步骤① exit 0 且输出 `0 findings（加 --json 看明细）`；步骤② exit 1，findings 里存在 `"skill":"dev-workflow"` 且 `"check":"自引用带前缀"` 的条目。
- **判据**：【机器】步骤① exit 0 + `0 findings`；步骤② exit 1 且 JSON 命中上述两字段。对应测试：待 plan Task N。

### TC-E11 跨技能文件路径同样必报 findings

- **覆盖**：spec §8 F9 边界、§4「跨技能引用只写技能名」
- **前置**：正常态；构造：副本仓在 SKILL.md 写 `parliament/references/submission-matrix.md` 这类对方技能内部路径。
- **步骤**：① `node skills/skill-inspector/scripts/check.mjs --json`
- **预期**：正常态 findings 为空数组；构造态出现 `"check":"跨技能路径引用"`。
- **判据**：【机器】正常态 `findings` 长度 0；构造态含指定 check 值。对应测试：待 plan Task N。

### TC-E12 登记了但文件不存在报 DanglingBaselineEntry

- **覆盖**：spec §8 F10、§7.1 C2
- **前置**：副本仓；把 `rules/dev-workflow-mainline.md` 改名为 `.bak`（`BASELINE_RULES` 仍登记它）。
- **步骤**：① `node tools/docgen/cli.mjs gate`；② `$LASTEXITCODE`；③ `node --input-type=module -e "import {collectGate} from './tools/docgen/cli.mjs'; console.log(collectGate().map(d=>d.code).join(','))"`
- **预期**：步骤① stderr 首行以 `DanglingBaselineEntry:` 开头且点名 `rules/dev-workflow-mainline.md`；步骤② `2`；步骤③ 输出含 `DanglingBaselineEntry`。
- **判据**：【机器】exit 2 + 首行前缀 `DanglingBaselineEntry:`。对应测试：待 plan Task N。

### TC-E13 tools 多加 Write 报 ToolsViolation

- **覆盖**：spec §6.2 `tools`、§7.6
- **前置**：C1 已落地；不需要改仓库（内存注入）。
- **步骤**：① `node --input-type=module -e "import {agentData,triggerTable} from './tools/docgen/components/agentData.mjs'; import {validateAgentData} from './tools/docgen/components/validateAgentData.mjs'; const d=structuredClone(agentData); d.find(a=>a.name==='evidence-reader').tools.push('Write'); try{validateAgentData(d,triggerTable);console.log('NO_THROW')}catch(e){console.log(e.code)}"`
- **预期**：输出 `ToolsViolation`。
- **判据**：【机器】输出恰为 `ToolsViolation`（输出 `NO_THROW` 即红）。对应测试：待 plan Task N。

### TC-E14 description 出现「在议会评审中担任」必被抓住

- **覆盖**：spec §7.3、§9 V-5
- **前置**：正常态。
- **步骤**：① `node -e "const t=require('fs').readFileSync('agents/evidence-reader.md','utf8');console.log(/^description:.*在议会评审中担任/m.test(t))"`；② `Select-String -Path agents/evidence-reader.md -Pattern '在议会评审中担任'`
- **预期**：步骤① `false`；步骤②无输出（`Select-String` 零匹配时 stdout 为空）。
- **判据**：【机器】步骤① `false` 且步骤②无输出；任一为真/有匹配 = 红。对应测试：待 plan Task N。

### TC-E15 manifest 缺 dev-workflow 或清单文件缺失 → validate.test.mjs 必红

- **覆盖**：spec §8 F11、§2 P-6（`skilldependencies/manifest.json` + `skilldependencies/dev-workflow.json`）、§9 V-9
- **前置**：正常态已登记；副本仓构造 A（从 `manifest.json` 的 `skills` 里删 `"dev-workflow"`，清单文件保留）、构造 B（删掉 `skilldependencies/dev-workflow.json`，manifest 保留）。
- **步骤**：
  ① 正常态：`Test-Path skilldependencies/dev-workflow.json`；
  ② 正常态：`node -e "console.log(require('./skilldependencies/manifest.json').skills.includes('dev-workflow'))"`；
  ③ 正常态：`node --test skilldependencies/validate.test.mjs`；
  ④ 构造 A：同 ③；
  ⑤ 构造 B：同 ③
- **预期**：① `True`；② `true`；③ exit 0；④ exit 1，失败列表含 `manifest.json：skills 列表与文件一一对应`（[skilldependencies/validate.test.mjs:12-16](file:///d:/Seed/retro-skills/skilldependencies/validate.test.mjs#L12-L16)）与 `skills/ 目录与 manifest 一一对应`（[skilldependencies/validate.test.mjs:36-42](file:///d:/Seed/retro-skills/skilldependencies/validate.test.mjs#L36-L42)）；⑤ exit 1，失败列表含 `manifest.json：skills 列表与文件一一对应`（清单文件少了，manifest 与文件集合不再相等）。
- **判据**：【机器】①②③ 正常态成立；④⑤ 均 exit 1 且命中各自指定的失败用例名。这两个红同时也是 `npm run check` 变红的来源之一。对应测试：待 plan Task N。

### TC-E16 SKILL.md 为空或缺 frontmatter 必红

- **覆盖**：spec §4 frontmatter、§9 V-7（边界）
- **前置**：副本仓；`node -e "require('fs').writeFileSync('skills/dev-workflow/SKILL.md','')"`（0 字节）。
- **步骤**：① `node -e "const t=require('fs').readFileSync('skills/dev-workflow/SKILL.md','utf8');console.log(/^---\r?\n[\s\S]*?\r?\n---/.test(t))"`；② `npm run check`
- **预期**：步骤① `false`；步骤② exit 1 且 stderr 含 `skills/dev-workflow/SKILL.md:1 frontmatter 缺失或未闭合`。
- **判据**：【机器】步骤① `false` 且步骤② exit 1 + 该文本（`check-all.mjs` 的 FM_RE 与本命令同一口径）。对应测试：待 plan Task N。

### TC-E17 SKILL.md 带 BOM 必红

- **覆盖**：spec §4 frontmatter、§9 V-7（边界，本仓已两次因 BOM 出事）
- **前置**：副本仓；`node -e "const f=require('fs');f.writeFileSync('skills/dev-workflow/SKILL.md',Buffer.concat([Buffer.from([0xEF,0xBB,0xBF]),f.readFileSync('skills/dev-workflow/SKILL.md')]))"`。
- **步骤**：① `node -e "const b=require('fs').readFileSync('skills/dev-workflow/SKILL.md').subarray(0,3);console.log(b[0]===0xEF&&b[1]===0xBB&&b[2]===0xBF)"`；② `npm run check`
- **预期**：步骤① `true`（说明确实注入了 BOM）；步骤② exit 1 且 stderr 含 `skills/dev-workflow/SKILL.md:1 文件带 UTF-8 BOM`。
- **判据**：【机器】步骤② exit 1 + 该文本。对应测试：待 plan Task N。

### TC-E18 when 以「时」结尾报 WhenFormatViolation

- **覆盖**：spec §6.2 触发 `when`（边界）
- **前置**：C1 已落地；内存注入，不改仓库。
- **步骤**：① `node --input-type=module -e "import {agentData,triggerTable} from './tools/docgen/components/agentData.mjs'; import {validateAgentData} from './tools/docgen/components/validateAgentData.mjs'; triggerTable['evidence-reader'].when='当需要通读长文时'; try{validateAgentData(agentData,triggerTable);console.log('NO_THROW')}catch(e){console.log(e.code)}"`
- **预期**：输出 `WhenFormatViolation`。
- **判据**：【机器】输出恰为 `WhenFormatViolation`。对应测试：待 plan Task N。

### TC-E19 annotations 值为 pending / 缺键时 A 组必红

- **覆盖**：spec §7.1 C8 边界、§7.4
- **前置**：C8 已落地。
- **步骤**：① `node --input-type=module -e "import {checkSemantic} from './tools/execution-matrix/check-agent.mjs'; console.log(JSON.stringify(checkSemantic({'evidence-reader:A1':'pending'},'evidence-reader').map(f=>f.code)))"`；② `node --input-type=module -e "import {readAnnotations,checkSemantic} from './tools/execution-matrix/check-agent.mjs'; console.log(JSON.stringify(checkSemantic(readAnnotations(),'evidence-reader')))"`
- **预期**：步骤① `["A1","A2","B1","B2","B3","B4","C1","C2","C3","C4"]`（缺键按 pending 处理）；步骤② `[]`。
- **判据**：【机器】步骤①长度 10 且首项 `A1`；步骤② `[]`。对应测试：待 plan Task N。

### TC-E20 未登记的 outputKind 报 InvalidOutputKind

- **覆盖**：spec §7.1 C3、§7.2（负例，证明枚举守卫存在）
- **前置**：C3 已落地；内存注入。
- **步骤**：① `node --input-type=module -e "import {agentData,triggerTable} from './tools/docgen/components/agentData.mjs'; import {validateAgentData} from './tools/docgen/components/validateAgentData.mjs'; const d=structuredClone(agentData); d.find(a=>a.name==='evidence-reader').outputKind='evidence-x'; try{validateAgentData(d,triggerTable);console.log('NO_THROW')}catch(e){console.log(e.code)}"`
- **预期**：输出 `InvalidOutputKind`。
- **判据**：【机器】输出恰为 `InvalidOutputKind`。对应测试：待 plan Task N。

### TC-E21 段表任一格改回旧措辞 → `diff cells ≥ 1` 必被检出

- **覆盖**：spec §8 F12、§9 V-3；PRD §4 段表（**唯一真相 = PRD §4**；v4 已把两格统一为 PRD 原文：`无议会` / `；`）
- **前置**：正常态（PRD §4 与 SKILL.md 的「出口判据 / 谁签 / 议会」三列逐格一致）；副本仓逐个构造。
- **步骤**：
  ① 正常态探针（与 TC-A04 步骤①同一命令）：`node -e "const f=require('fs');const rows=p=>{const L=f.readFileSync(p,'utf8').split(/\r?\n/).map(l=>l.trim());const i=L.findIndex(l=>l.startsWith('|')&&l.includes('出口判据'));const c=l=>l.replace(/\*\*/g,'').split('|').slice(1,-1).map(x=>x.trim());const h=c(L[i]);const out=[];for(let k=i+2;k<L.length&&L[k].startsWith('|');k++){out.push(c(L[k]))}return {h,out}};const s=rows('skills/dev-workflow/SKILL.md');const p=rows('docs/prd/20261024073606-dev-workflow-mainline/index.md');let d=0;for(let i=0;i<Math.max(s.out.length,p.out.length);i++)for(const k of ['出口判据','谁签','议会']){const av=(s.out[i]||[])[s.h.indexOf(k)],pv=(p.out[i]||[])[p.h.indexOf(k)];if(av!==pv){d++;console.log('DIFF row',i+1,k,JSON.stringify(av),'!=',JSON.stringify(pv))}}console.log('diff cells',d)"`
  ② 四个构造（每个在独立副本仓，每次只改一格）：
     构造 A：段表「议会」列某格 `无议会` → `无`（旧措辞，PRD 原文是 `无议会`）；
     构造 B：「出口判据」列某格句内的 `；` → `，`（旧标点）；
     构造 C：②→③ 行出口判据 → `任务↔testcase 一一映射`；
     构造 D：③ 行出口判据 → `测试绿`。
  ③ 每个构造各跑一次步骤①的命令。
- **预期**：步骤① `diff cells 0` 且无 `DIFF` 行；步骤③ 四个构造各自 `diff cells ≥ 1`（A / B 为 `1`，C / D 为 `1`），且 `DIFF` 行点名被改的那一格（右侧值 = 上述旧措辞）。
- **判据**：【机器】步骤① `diff cells 0`；步骤③ 每个构造 `diff cells ≥ 1` 且 DIFF 行的「右侧值」属于 `{无, ，, 任务↔testcase 一一映射, 测试绿}` 之一。**为什么是「≥ 1」而不是固定 3**：v4 只比三列，单格漂移是最小可构造单位；固定 3 会把「只改一格的漂移」放过（旧版判据的漏洞）。**A / B 两格为什么值得单列**：它们是 v4 刚从 `无` / `，` 改成 PRD 原文 `无议会` / `；` 的两处——最容易在后续修订里被「顺手改回去」，而两份表各自读都通顺（F12 的典型形态）。对应测试：待 plan Task N。

### TC-E22 依赖集合恰为 parliament + prd-to-specs，字段与文件名合规

- **覆盖**：spec §8 F11、§2 P-6 **D2**（依赖集合**恰为** `parliament` + `prd-to-specs`）、§9 V-9
- **前置**：`skilldependencies/dev-workflow.json` 已新建；`D:/Seed/agent-assets-sync` 在位（[validate.test.mjs:6](file:///d:/Seed/retro-skills/skilldependencies/validate.test.mjs#L6) 从该仓 import `readManifest`）。
- **步骤**：
  ① 依赖集合恰等（只读 JSON 比对，不依赖外部仓）：`node -e "const j=require('./skilldependencies/dev-workflow.json');const got=j.dependencies.skills.map(x=>x.name).sort();const exp=['parliament','prd-to-specs'].sort();console.log(j.skill);console.log(JSON.stringify(got));console.log(JSON.stringify(exp));console.log(JSON.stringify(got)===JSON.stringify(exp))"`
  ② schemaVersion：`node -e "console.log(require('./skilldependencies/dev-workflow.json').schemaVersion)"`
  ③ 正常态测试：`node --test skilldependencies/validate.test.mjs`
  ④ 副本仓四个构造：A（删 `"skill"` 字段）→ 跑 ③；B（`"skill": "dev_workflow"`）→ 跑 ③；C（依赖里删掉 `prd-to-specs`）→ 跑 ①；D（依赖里多一个 `{"name":"speaker"}`）→ 跑 ①
- **预期**：① 四行：`dev-workflow` / `["parliament","prd-to-specs"]` / `["parliament","prd-to-specs"]` / `true`；② `1`；③ exit 0（`# pass` ≥ 4）；④ A exit 1 且含 `依赖清单缺 skill 名`（由外部仓 `deps.mjs` 的第 21 行抛出，经 `readManifest` 传到测试、断言未捕获 → 用例失败）；B exit 1 且含 `与文件名`（外部仓 `deps.mjs` 的第 23–25 行）；C、D 的第 4 行为 `false`。
- **判据**：【机器】① 第 1 行 `dev-workflow`、第 4 行 `true`（**集合必须恰等：少一个 `prd-to-specs` 或多一个 `speaker` 都变 `false`**，排序后逐项比对，顺序与重复不影响）；② `1`；③ exit 0；④ A 命中 `依赖清单缺 skill 名`、B 命中 `与文件名`、C/D 第 4 行 `false`。**注意**：④ 的 A/B 红来自 `readManifest` 抛错，不是断言消息——判据用「命中错误文本」而不是「命中测试名」。**相对二版**：二版只判 schema（字段齐、名字符），判不了「依赖选得对不对」；三版 spec D2 已把集合写死，故本条改为可机器判的集合恰等（多 / 少各有构造）。

### TC-E23 三份 README 的技能与规则数量都不写死，且新条目在位

- **覆盖**：spec §2 P-6 **D3**（加 `dev-workflow` 一行；**技能与规则数量都不再写死**）、§9 V-9（人工核）
- **前置**：正常态（manifest 已含 `dev-workflow`）；`README.md`、`docs/guide/skills/README.md`、`docs/guide/rules/README.md` 三份都已改。
- **步骤**：
  ① 数量表述禁词探针（**三份**，技能与规则都查）：`node -e "const fs=require('fs');const bad=/([一二三四五六七八九十百]{2,}个技能)|([一二三四五六七八九十百]{2,}条)|(技能[^。\r\n]{0,6}[（(][一二三四五六七八九十百]{2,}个)|([0-9]+\s*个技能)|([0-9]+\s*条规则)/;for(const p of ['README.md','docs/guide/skills/README.md','docs/guide/rules/README.md']){const t=fs.readFileSync(p,'utf8');const m=t.match(bad);console.log(p,!!m,m?m[0]:'')}"`
  ② 技能行在位（根 README + 技能指南）：`node -e "const fs=require('fs');for(const p of ['README.md','docs/guide/skills/README.md']){console.log(p,fs.readFileSync(p,'utf8').includes('dev-workflow'))}"`
  ③ 规则行在位（规则指南）：`node -e "const fs=require('fs');console.log(fs.readFileSync('docs/guide/rules/README.md','utf8').includes('dev-workflow-mainline'))"`
  ④ 技能数派生比对（两边都派生，不写死）：`node -e "const fs=require('fs');const sk=require('./skilldependencies/manifest.json').skills.length;const sg=[...fs.readFileSync('docs/guide/skills/README.md','utf8').matchAll(/^### \d+\. /gm)].length;console.log(sk,sg,sk===sg)"`
  ⑤ 人工读：`README.md` 的「场景速查」表（[README.md:35-46](file:///d:/Seed/retro-skills/README.md#L35-L46)）+ 技能指南中 `dev-workflow` 那一节 + 规则指南中 `dev-workflow-mainline` 那一节。
- **预期**：① 三行第 2 项均为 `false`（无中文 / 阿拉伯数字的技能数或规则数表述）；② 两行 `true`；③ `true`；④ 第 3 项 `true`（manifest 技能数 == 技能指南 `### N.` 节数，施工后应为 19 == 19）；⑤ 场景行存在且能一句话说清何时用；两节都含「什么时候用 / 做什么 / 不做什么」。
- **判据**：【机器】① 三行均 `false`；② 两行 `true`；③ `true`；④ 第 3 项 `true`（数字由输出给出，判据里不写死任何具体数字）。【人工】reviewer-qa 看 ⑤，判据 = 场景行存在且能一句话说清何时用；「不做什么」不得与 `skills/dev-workflow/SKILL.md` 冲突。**失败态**：只改 manifest 与清单文件、没动三份 README → ② 有 `false` / ③ `false`；仍保留「十八个技能」或「二十条」→ ① 命中 `十八个技能` / `二十条` → 红。**本版变化（v4）**：D3 由「技能数量不写死」扩到「**规则数量也不写死**」，README 由两份扩到**三份**（`docs/guide/rules/README.md` 已在列），禁词探针加 `[一二三四五六七八九十百]{2,}条`——它与 `个技能` 是两个不同的写死点，只查一个会漏。对应测试：待 plan Task N。

### TC-E24 计划门文档退化成「见 PRD §6」指针 → 必被检出

- **覆盖**：spec §3.2「`stage-2b-plan-gate.md` 额外要求」、F1 邻域（文档写成指针 = 判据落不了地）
- **前置**：正常态；副本仓构造：把 `stage-2b-plan-gate.md` 里三条核对所在段落整段删掉，只留一句「计划门判据见 PRD §6」。
- **步骤**：① 正常态跑 TC-A09 的步骤①–④；② 构造态跑同一组命令
- **预期**：① `true true true` / ≥ `3` / `true true true` / 两个 ≥ `3` / `true true`；② 三项核对名可能仍在（若指针句写了名字），但命令数为 `0`、「手工核对」为 `false`、「判据」「证据」计数均 `< 3`、「签字…输出」关联句为 `false`。
- **判据**：【机器】正常态如 A09；构造态任一硬项不满足即红（命令数 `< 3`、`手工核对` 为 `false`、两个计数 `< 3`、关联句 `false` 四者取或）。**与 TC-E26 的分工**：E24 是「整段退化成指针」（连命令都没有）；E26 是「命令都在、只缺手工核对说明」（F15 的核心形态，也是最容易被当成合格交付的形态）。**为什么容易漏**：文件存在 + 五小节齐（A05 全绿）+ 关键词若被顺手写进指针句也能骗过关键词检查——只有「判据 / 证据 / 手工核对 / 签字附输出」四个面一起看才抓得住。对应测试：待 plan Task N。

### TC-E25 裸名 reader 与 evidence-reader 并存 / 被用来派单 → 必被检出

- **覆盖**：spec §6.1（定名 `evidence-reader` 而非暂名 `reader`）、PRD F-17 / D-23、§6.3 边界
- **前置**：正常态；`agents/` 下只有 `evidence-reader.md` 与 `reviewer-reader.md` 两张 reader 系卡。
- **步骤**：
  ① `Test-Path agents/reader.md`；
  ② `node -e "const f=require('fs');console.log(f.readdirSync('agents').filter(x=>/^reader\.md$/.test(x)).length)"`；
  ③ `node --input-type=module -e "import {agentData} from './tools/docgen/components/agentData.mjs'; console.log(agentData.some(a=>a.name==='reader'), agentData.some(a=>a.name==='evidence-reader'))"`；
  ④ `Select-String -Path skills/dev-workflow/SKILL.md,rules/dev-workflow-mainline.md -Pattern '(?<!evidence-)(?<!reviewer-)reader'`
- **预期**：① `False`；② `0`；③ `false true`；④ 无输出。
- **判据**：【机器】① `False`、② `0`、③ `false true`、④ 无输出。**失败态**：有人按 PRD 旧暂名建了 `agents/reader.md`，或 SKILL.md / rule 写「派 reader 取证」→ ① `True` / ③ 首个 `true` / ④ 命中（`(?<!reviewer-)` 已排除 `reviewer-reader`，所以命中即真违规）。**为什么要这条**：`agents/reviewer-reader.md` 已存在，裸 `reader` 会让派单在主 agent 侧反复出错——这正是 §6.1 改名的理由，理由必须有对应判据兜住。对应测试：待 plan Task N。

### TC-E26 计划门只写命令、无手工核对说明 → 判不通过

- **覆盖**：spec §8 F15、§3.2 末段「脚本未落地期的写法」、PRD §6
- **前置**：正常态（TC-A09 全绿）；副本仓构造：把 `stage-2b-plan-gate.md` 里所有含「手工核对 / 脚本上线前 / 脚本未落地 / 归 S4」的说明句删掉，只保留三条 `node scripts/check-plan.mjs ...` 命令与签字句。
- **步骤**：
  ① 机器辅助探针（正常态）：`node -e "const t=require('fs').readFileSync('skills/dev-workflow/references/stage-2b-plan-gate.md','utf8');console.log((t.match(/手工核对/g)||[]).length)"`
  ② 机器辅助探针（构造态）：同一命令
  ③ 人工判：逐条读三条核对，看每条是否同时有「判据」与「证据取得方式（二选一）」
- **预期**：① ≥ `1`；② `0`（构造成功：只剩命令，没有任何「上线前怎么核」的说明）；③ 构造态三条核对只有命令。
- **判据**：【人工】主判——审计 / reviewer-qa 逐条读，判据 = **每条核对都写成「判据 + 二选一证据」**：脚本上线后分支 = 命令 + 输出；脚本上线前分支 = 审计手工核对表（逐条填：核了什么 / 怎么核的 / 结论）+ 原始命令原文。**三条里任一条只有命令、没有上线前的手工核对说明 → 整份判不通过**（是打回，不是「建议补」）。【机器】辅助：构造态 `手工核对` 计数为 `0` 是强信号；但计数 ≥ 1 不足以证明「三条都写了」——所以最终判据是人判，机器只做初筛。命令本身能否跑（S4 落地后）不在本用例判。
- **为什么这条不能省**：命令写对了、三个核对名写对了、五小节齐了，机器判据全绿——但 S1 阶段 `check-plan.mjs` 不存在，照着跑会报 `Cannot find module`。这正是 F15 的形态：**「文档看起来已落地」与「现在就能照做」之间的差**。对应测试：待 plan Task N。

### TC-E27 只写源不 `aas sync` → 运行时无链接、体检「需建链接 ≥ 1」必红

- **覆盖**：spec §8 F16、§2 **P-7**、§9 V-12
- **前置**：本机环境；用**可逆探针**（不碰 `dev-workflow` 本体）：在主仓临时新建 `rules/tmp-e27-unsynced.md`（一行 `#` 标题 + 五段空标题占位），**不跑 `aas sync`**。
- **步骤**：
  ① `Test-Path "$HOME\.trae-cn\user_rules\tmp-e27-unsynced.md"`
  ② 体检：`aas *> "$env:TEMP\e27.log"; Select-String -Path "$env:TEMP\e27.log" -Pattern '需建链接|tmp-e27-unsynced' | ForEach-Object { $_.Line.Trim() }`
  ③ 清理并复位：`Remove-Item rules/tmp-e27-unsynced.md`；`aas sync`；再跑 ②
- **预期**：① `False`；② 命中 ≥ 1 行，含 `需建链接 1`（或 ≥ 1）且点名 `tmp-e27-unsynced`；③ 清理后 ② 回到 `需建链接 0`。
- **判据**：【机器，本机环境】① `False` + ② ≥ 1 行且含 `需建链接` 与非 0 数 + ③ 回到 0。**收尾硬约束**：探针文件必须删除并重跑 `aas sync`，`git status --porcelain` 必须回到「只允许本 testcase 文件」；未复位即视为本用例未完成（不是「已知残留」）。**为什么这样构造**：直接「不 sync `dev-workflow`」不可逆（会把用户已 sync 好的链接留成缺失态）；用临时规则名做探针，既证明「源存在 ≠ 运行时存在」这条判据真能红，又不影响真实规则。**为什么值得单列**：`npm run check` 对这条**完全无感**（仓内文件齐、测试全绿），只有 `aas` 体检能发现（F16）。

### TC-E28 某段行改成纯指针 → 必被 A11 判据抓住

- **覆盖**：§8 **F17**、§9 V-13、§3.2「读→产出」闭环
- **前置**：副本仓；把段①行的「读→产出」句换成纯指针：`判据见 references/stage-1-prd.md`（删掉「已核清单」「不得进入下一段」）。
- **步骤**：① 跑 TC-A11 步骤①同一命令
- **预期**：出现 `BAD row 1 true false false`（a 命中、b/d 缺失），末行 `rows 6 bad 1`。
- **判据**：【机器】末行 `bad` ≥ 1 且 `BAD` 行点名第 1 行、三项为 `true false false`。**为什么容易漏**：指针句里确实有 `references/stage-1-prd.md`（a 项为 `true`），只查「有没有 references 指针」会判绿——F17 的形态正是「看起来指到了，但没要求产出」，所以判据必须三项同时成立。对应测试：待 plan Task N。

### TC-E29 删掉「三权总则」节或「取证调度」节 → 必红

- **覆盖**：§9 V-13、§4「必须有「三权总则」节 / 「取证调度」节」、§8 **F18** / **F21**
- **前置**：副本仓两个构造：**A** 删整节「三权总则」；**B** 删整节「取证调度」。
- **步骤**：① 两个构造各自跑 TC-A12 步骤①同一命令
- **预期**：构造 A → `false true` / `true true` / `false false false`；构造 B → `true false` / `false false` / `true true true`。
- **判据**：【机器】构造 A 第 1 行首个为 `false`、构造 B 第 1 行第二个为 `false`，任一即红（正常态三行全 true）。**两个构造为什么都要**：A 防「申报人自己定性」（PRD §3.3 的底线），B 防「`evidence-reader` 造出来没人派」（F18，收益为 0）——只删一个时另一个仍绿，单一构造会让漏检看起来像通过。对应测试：待 plan Task N。

### TC-E30 议会有 1 张 P0 未清而出口判据全齐 → 判「不得进入下一段」

- **覆盖**：§8 **F19**、§3.1「议会有条件」、§5 R1
- **前置**：正常态（SKILL.md 含「议会有条件」段）；构造态 = `gate-record.md` 的 ② 行六列全齐，同时议会评审账里有「1 张 P0 未清」。
- **步骤**：
  ① 机器探针（同一段必须同时写「议会通过」与「不得进入下一段」）：`node -e "const t=require('fs').readFileSync('skills/dev-workflow/SKILL.md','utf8');console.log(/议会通过[\s\S]{0,160}不得进入下一段|不得进入下一段[\s\S]{0,160}议会通过/.test(t));console.log(/P0/.test(t))"`
  ② 人工判：把构造态交 reviewer-qa / 审计，按 SKILL.md 该段 + R1 判「能否进入段③」。
- **预期**：① `true` / `true`；② 判「**不得进入下一段**」（结论必须是「留在本段」）。
- **判据**：【机器】两项 `true`。【人工】**谁判**：reviewer-qa（或审计）；**看什么**：`gate-record.md` 的 ② 行六列 + 议会评审账里「P0 未清 1 张」；**判据**：结论 = 「不得进入下一段」，且理由引用「议会通过」条款。判成「出口齐 → 可通过」= 不通过（F19）。**为什么必须单列**：收口是**两个合取项**（出口判据齐 **且** 议会通过），只测出口齐（A04 / A11）会漏掉后一项；这类「两处各自成立却互相矛盾」正是本轮 6 席抓到 4 个 P0 的同源模式（F21）。对应测试：待 plan Task N。

### TC-E31 例外节只写「无例外」→ 必红

- **覆盖**：§8 **F20**、§5「例外」节必写内容
- **前置**：副本仓；把 `## 例外` 节正文整段替换为 `无例外。`
- **步骤**：① 跑 TC-A07 步骤③同一命令
- **预期**：`true` / `false false false` / `false`（节存在，但无「存量」、无时点、长度不足）。
- **判据**：【机器】第 2 行三项不全为 `true` 即红（正常态 `true true true`）。**为什么容易漏**：五段标题齐（A07 步骤①全 true）+ 文件存在 = 看起来结构完整；「无例外」在语法上完全满足「有这一节」。本仓现有 25 份零 testcase 的存量 spec，一刀切会让规则上线第一天大面积无法开工（§5 明文：例外节只写「无例外」= 不通过）。对应测试：待 plan Task N。

### TC-E32 从 `BASE_KEYS` 删 `boundary` → `TriggerFieldMisplaced`

- **覆盖**：§7.1 **C5** `BASE_KEYS` 三键、§7.1 C5 ④
- **前置**：副本仓；改 `tools/docgen/components/validateAgentData.mjs`，把 `BASE_KEYS` 数组里的 `'boundary', ` 删掉（其余不动）。
- **步骤**：
  ① 构造：`node -e "const f=require('fs'),p='tools/docgen/components/validateAgentData.mjs';const t=f.readFileSync(p,'utf8');const n=t.replace(/[']boundary['],/,'');console.log('patched',n!==t);f.writeFileSync(p,n)"`
  ② `node --input-type=module -e "import {agentData,triggerTable} from './tools/docgen/components/agentData.mjs'; import {validateAgentData} from './tools/docgen/components/validateAgentData.mjs'; try{validateAgentData(agentData,triggerTable);console.log('NO_THROW')}catch(e){console.log(e.code)}"`
- **预期**：① `patched true`；② `TriggerFieldMisplaced`。
- **判据**：【机器】① `true`（构造成功，否则说明源码写法与预期不同，先核对再判）；② 恰为 `TriggerFieldMisplaced`。**三个失败态的读法**：`NO_THROW` → `boundary` 根本没被 `BASE_KEYS` 管住（字段是死字段，C5 ① 没做）；抛 `未知错误码` → 实现新造了错误码（`exitCodeFor` 对未知码会抛，spec 明令复用既有码）；`DescriptionDerivation` → 删错了键。**为什么只能改源**：`BASE_KEYS` 是模块内常量（当前未导出），无法 import 后改；所以「三键真在 `BASE_KEYS` 里」由本条（反向）+ **B12**（正向）两条合起来判。对应测试：待 plan Task N。

### TC-E33 ① 段删掉「代拟者不签字」→ 三命中变两命中必红

- **覆盖**：§8 **F22**、§9 **V-14**、§3.1「过渡口径」
- **前置**：副本仓（按 §0 负例构造纪律：`git worktree add --detach "$env:TEMP\dw-neg" HEAD` → `Push-Location`）；**TC-A14 在副本仓为绿**（三要素三命中），否则先修正常态再构造。
- **步骤**：
  ① 删要素（全局删，避免 ① 行与过渡口径段各写一次时残留一处）：`node -e "const f=require('fs'),p='skills/dev-workflow/SKILL.md';const t=f.readFileSync(p,'utf8');const k=t.split('代拟者不签字').length-1;f.writeFileSync(p,t.split('代拟者不签字').join(''));console.log('removed',k)"`
  ② 跑 **TC-A14 步骤①** 同一命令
- **预期**：① `removed` ≥ `1`；② 四行：`true true false` / `["代拟者不签字"]` / 诊断行 / `true`。
- **判据**：【机器】① `removed` ≥ `1`；② 第 1 行恰 `true true false`（**三命中变两命中**：`用户签字` 与 `代拟` 仍命中，`代拟者不签字` 变 `false`）、第 2 行恰 `["代拟者不签字"]`（点名缺哪一个）、第 4 行仍为 `true`（`S2` 未被连带删除 —— 证明这次红**只来自三要素**，不是把整句删掉带来的连锁失败）。
- **构造失败怎么读**：① `removed 0` = ① 段本来就没写该要素（TC-A14 本应已红）；此时**不得判「本条通过」**，先回正常态核 A14，再重做构造。
- **可回退**：`Pop-Location` 后 `git worktree remove`；主仓一字未动。
- **为什么容易漏**：删掉的是一句话里的后半句——文件仍完整、段表仍六行、A01–A13 与 A11 的「已核清单」全绿；而且 `代拟` 仍在（同一句里还有「代拟：主 agent」），**只查「代拟」或只查「用户签字」都会判绿**。这正是「过渡口径写了一半」的真实形态：签字人写对了，却没说「代拟者不签字」，于是代拟的人可以顺手把字签了（三权分离当场失效）。对应测试：待 plan Task N。

## 3 负例与边界清单（F1–F22 逐条映射：35 条负例 + 10 条边界；另附 2 条守卫本体正例 B10 / B11 供对照）

| 用例号 | 失败面 | 边界 / 负例是什么 | 为什么容易漏 | 期望行为 |
|---|---|---|---|---|
| TC-E01 | F1 | 段表出口判据写成「质量达标 / 符合要求 / 合理」 | 段名和列名都写对了，只有格子是形容词，扫一眼看不出来 | 禁用词命中即红；出口格必须含可判定 token |
| TC-E24 | F1 邻域 | 计划门文档写成「见 PRD §6」指针 | 文件在、五小节齐，看起来已交付 | 命令数 ≥ 3、`手工核对` 为真、判据 / 证据计数各 ≥ 3、签字附输出句在位（四者取或即红） |
| TC-E26 | F15 | 计划门三段只写 `node scripts/check-plan.mjs ...`，没有任何「脚本上线前由审计手工核对」的说明 | 三个核对名写对了、命令格式也对，看起来是最「落地」的写法；而该脚本 S1 阶段不存在 | 三条核对每条必须含「判据 + 二选一证据」，缺上线前分支即打回（人判 + `手工核对` 计数辅助） |
| TC-D08 | F14 | 模板边界句退回硬编码现句 → reader 卡变回「只读评审角色」 | 14 席逐字节与 `gate` 全绿（默认值就是旧句），只有 reader 卡这一句错 | 卡文判据必红；同时用 `diff14 0` 证明 `gate` 无判别力 |
| TC-D09 | F14 邻域 / C11 | explore 槽位未接线（`explorePolicy` 不被消费） | 盘上卡与渲染同源 → `gate` 恒绿；卡里仍是「现场生成 3-5 个…」 | `none` / `full` 两次渲染必须不同；不同即 B11 与 D09 同时红 |
| TC-B10 | F14（守卫本体） | reader 卡「边界」节写成取证角色句、不含「只读评审角色」 | 卡是生成物，人不会逐字读末节；旧句与新句都含「不得创建、修改、删除任何文件」，易误判为已改 | 第 2 项 `false` + 三个正句项 `true`；模板里必须是槽位而非硬编码句 |
| TC-B11 | C11（守卫本体） | reader 卡「自由探索」节写成「本节不适用…」，旧模板句零命中 | 卡是生成物；旧句在新卡里可能只残留在模板里，卡上已看不到 | 旧句两项 `false`；`本节不适用` 在位且节内无「生成 3-5 个」；**三个默认常量只在 `patternRegistry` 存一份**（旧句与新句各出现一次，`renderAgent` / 模板各 0 次） |
| TC-E02 | F2 | references 只有 6 份（缺计划门） | 目录仍在、SKILL.md 指针仍在，缺一份没有引用会断 | 计数 ≠ 7 即红，且点名缺失文件 |
| TC-E03 | F2 | references 多出一份 stage-6 | 「至少七份」的宽松口径会放过 | 计数 ≠ 7 即红（恰有是双向约束） |
| TC-E04 | F3 | 规则里抄 PRD 判据正文 | 抄的是「对的话」，读起来完全合理 | 与 PRD 原文句逐字命中的清单必须为空；PRD § 引用数 ≥ 6 |
| TC-E05 | F4 | evidence-reader 卡手写、agentData 无条目 | 卡文件内容看起来完全正常，只有生成器知道它不该存在 | gate exit 非 0；collectGate 明细含 UnregisteredHandwritten |
| TC-E06 | F5 | agentData 有、state.json 无（缺一条键 **或整文件缺失**） | gate 仍绿（只做存在性检查），A 组静默少一席 | `npm run check` 在 ②.6 红且点名缺哪个；整文件缺失同样红；`# fail 0` 证明不是测试红 |
| TC-E07 | F6 | 给 `reviewer-ai.md` 注入一字节 | 单个注入点可能被「针对某个文件特殊处理」骗过 | `gate` 报 Mismatch、exit 1（第二个独立注入点） |
| TC-D04 | F6 | domain 只加在数据、未接线渲染 | 数据侧测试全绿 | description grep 命中即红 |
| TC-D06 | F6 | 默认 DOMAIN 被改 | 改默认值只影响 14 席，局部测试看不出来 | gate 报 Mismatch，exit 1 |
| TC-E08 | F7 | evidence 格式退化成问题卡（级别 / 建议解法） | 模板里换个表头就能「看起来更完整」 | 输出格式节内不得出现严重级别 / 建议解法 / P0 |
| TC-C05 | F8 / F13 | 生产侧已升级、测试侧仍 35 | 两处断言分在两个文件里，单跑 data.test.mjs 是绿的 | check-baseline 的 node --test exit 1 |
| TC-C06 | F8 / F13 | **12 处**一个字未改 | 生成器侧已改，跑 gate 是绿的，误以为收工 | npm run check exit 1 + check 未通过 |
| TC-C07 | F13 | 同文件第三处 `new Set(names).size, 14` 未改 | 它和上一行长得几乎一样 | node --test 红 |
| TC-C08 | F13 | cli-gate / review-fixes / pilot-gate 的计数未改 | 散在三个文件、五个断点 | node --test 红（正则不匹配 / 未迁移 14） |
| TC-E09 | F8 | 全量门在 12 处里只改一处 | 单跑某个测试文件是绿的，只有全量才红 | npm run check exit 1 + check 未通过 |
| TC-C11 | F13 | 某处改回字面量（37 / 35 / 15 / 14），或 `data.test.mjs:50` 注释留数字 | 「改成 37 就绿了」是最省事的做法，当下完全正确；注释里的数字更没人看 | 12 个 `path:line` 逐行 0 命中 + 全局剥 `//` 后 0 命中 |
| TC-E10 | F9 | SKILL.md 写自引用带技能名前缀 | 路径本身是对的（相对仓库根也对） | skill-inspector 报「自引用带前缀」、exit 1 |
| TC-E11 | F9 | 写对方技能内部文件路径 | 读者确实需要那份文件，写法看似更贴心 | skill-inspector 报「跨技能路径引用」 |
| TC-E12 | F10 | BASELINE_RULES 登记了、文件不存在 | 只看常量文件会以为已落地 | gate 报 DanglingBaselineEntry，exit 2 |
| TC-E15 | F11 | 新技能未登记 manifest / 清单文件缺失 | spec 的改动清单里原来没有它，但它在 npm run check 内 | validate.test.mjs exit 1 |
| TC-E22 | F11 | dev-workflow.json 缺 skill 字段 / 缺一个依赖 / 多一个依赖 | 文件存在、JSON 也能 parse，看起来「登记完」了 | 集合恰等为 `parliament` + `prd-to-specs`；schema 断言 exit 1 |
| TC-E21 | F12 | 段表某格改回旧措辞（`无` / `，` / `任务↔testcase` / `测试绿`） | 两份表各自读都通顺，不逐格比对看不出来 | DIFF 行出现，`diff cells ≥ 1` |
| TC-E23 | F11（V-9）/ D3 | 三份 README 未加新条目，或仍写死技能数 / **规则数**（`十八个` / `二十条`） | 中文数字不像 `35` / `14` 那么扎眼，grep 数字搜不到；把 18 改成 19 看起来就像「已同步」 | 三份都零命中数量表述；技能 / 规则行都在位；manifest 技能数 == 技能指南节数 |
| TC-E27 | F16 | 只写源不 `aas sync` | `npm run check` 全绿（仓内文件齐），与「运行时真能加载」是两件事 | `Test-Path` 为 False + 体检「需建链接 ≥ 1」；复位后回 0 |
| TC-E28 | F17 | 某段行改成纯指针（只写「判据见 references/…」） | 指针里确实有 `references/stage-1-prd.md`，只查「有没有指针」会判绿 | A11 逐行判据 `bad ≥ 1`，点名缺「已核清单」「不得进入下一段」 |
| TC-E29 | F18 / F21 | 删掉「三权总则」节或「取证调度」节 | 五段表还在、SKILL.md 仍能读，少一节不影响「看起来完整」 | A12 三行出现 `false`（两个构造各命中一处） |
| TC-E30 | F19 | 议会 1 张 P0 未清、而出口判据全齐 | 出口六列全齐 → 误以为「可进下一段」；议会通过是另一个合取项 | 人工判「不得进入下一段」；机器判 SKILL.md 同段含「议会通过」「P0」「不得进入下一段」 |
| TC-E31 | F20 | 例外节只写「无例外」 | 五段标题齐、文件在，「无例外」语法上满足「有这一节」 | A07 例外节三项不全为真即红（存量 / 时点 / 非空） |
| TC-E32 | C5（BASE_KEYS） | 从 `BASE_KEYS` 删 `boundary` | 正向（B12 全绿）看起来说明字段已支持，其实可能只是没校验到 | `TriggerFieldMisplaced`（字段真被声明）；`NO_THROW` = 死字段 |
| TC-E33 | F22 / V-14 | ① 段里删掉「代拟者不签字」（同一句的「代拟」仍在） | 半句话而已，文件完整、段表六行、A01–A13 全绿；只查「代拟」或「用户签字」都会判绿 | A14 三命中变两命中（`true true false`），缺失清单点名「代拟者不签字」，`S2` 仍 `true` |
| TC-E13 | §6.2 | tools 多加一个 Write | 只读角色多一个写工具，功能上「更方便」 | ToolsViolation（恰等，不是包含） |
| TC-E14 | §7.3 | description 里出现「在议会评审中担任」 | 生成器自动派生，人不会逐字读 | grep 命中即红 |
| TC-E16 | §4 | SKILL.md 0 字节或缺 frontmatter | 文件存在即被当成「已交付」 | markdown 检查报 frontmatter 缺失 |
| TC-E17 | §4 | SKILL.md 带 UTF-8 BOM | 编辑器默认可写 BOM，肉眼不可见 | markdown 检查报 BOM |
| TC-E18 | §6.2 | when 以「时」结尾 | 中文语感上「…时」很自然 | WhenFormatViolation |
| TC-E19 | §7.4 | annotations 值为 pending 或干脆缺键 | 缺键不报错，按 pending 才红 | 10 个键全 pending → A 组 findings |
| TC-E20 | §7.2 | outputKind 未入枚举 | 新枚举值「先加上再说」常见 | InvalidOutputKind |
| TC-E25 | §6.1 | 裸名 `reader.md` 与 `evidence-reader.md` 并存 / 用裸名派单 | PRD 旧暂名仍是 `reader`，照 PRD 写就错 | 文件不存在 + 零派单引用 |
| TC-B09 | §7.6 | tools 顺序不同（集合相等） | 实现若写成字符串比较会误杀 | 必须判绿（假阳性样例） |
| TC-C09 | §7.1 C6 | baseline.json 未重生成 | gate 打印的计数是派生值，看起来仍是绿的 | BaselineDrift，exit 2 |
| TC-D05 | §7.3 | domain 传 `''` / `'  '` / `123` | 三种写法在 JS 里都「合法」，`??` 全拦不住 | description 不含空 domain 句 + `validateAgentData` 抛 `DescriptionDerivation` |

## 4 用例计数表

| 类型 | 条数 | 用例号 |
|---|---|---|
| 正例 | 34 | A01–A14、B01–B08、B10–B12、C01–C04、C10、D01–D03、D07 |
| 负例 | 35 | C05–C08、C11、D04、D06、D08、D09、E01、E02、E04–E10、E12–E15、E20–E22、E24–E33 |
| 边界 | 10 | B09、C09、D05、E03、E11、E16、E17、E18、E19、E23 |
| 合计 | 79 | 全部 |

**硬门判定：负例 35 + 边界 10 = 45 ≥ 正例 34 → 成立。** 未通过「凑数」达成：这 45 条（35 负 + 10 边界）里每一条都能指回 spec 的 F 编号 / V 编号 / C 编号 / §节号（见 §1 覆盖总表）。**v5 新增 2 条**：A14（V-14 / §3.1 过渡口径 / F22）、E33（F22 / V-14 反向构造）；**v5 改判 1 条**：B11（C3 默认常量 两个 → **三个**，新增步骤④判 `DEFAULT_EXPLORE_NONE` 单源 = `[1,0,0]`）。**v4 新增 13 条**：A10（V-12 / P-7 / F16）、A11–A13（V-13 / F17 / F18）、B11（C11 / V-11）、B12（C5 三键）、D09（C11 零判别力）、E27（F16）、E28（F17）、E29（F18 / F21）、E30（F19）、E31（F20）、E32（C5 反向）；**v4 改判 13 条**：A02（7 份 + 六列表头）、A04（三列 + 段顺序）、A05 / A08（只判 `stage-*`）、A07（R1–R7 + 例外节 + 验证节）、C01–C03（37）、C05–C08 / E09（12 处）、C11（12 处逐行 + 全局）、D01 / E07（改 `gate`，删快照）、D02（施工后）、D03（13 席 + senior-sdet 分流）、D05（三值输入空间）、E02 / E03（7 份基线）、E06（+ 整文件缺失）、E21（四类旧措辞 / ≥ 1）、E23（三份 + 规则数量）。

## 5 回归清单（改了什么必须重跑什么）

| 如果改了 | 必须重跑 | 为什么 |
|---|---|---|
| `tools/docgen/components/agentData.mjs` | A01–A13、B01–B12、C01–C04、C10、D01–D09、E13、E18、E20、E32 | 席位数、`boundary` / `domain` / `explorePolicy` 与两个清单都从它派生 |
| `tools/docgen/components/baseline.mjs` | C01–C04、C09、C11、E12、E15 | baseline 条数与 gate 打印值同源 |
| `tools/docgen/baseline.json` | C01、C02、C09、C04 | 逐字节比对对象 |
| `tools/docgen/components/patternRegistry.mjs` | B02、B04、B10、B11、D01–D09、E13、E20 | tools、outputKind、`DOMAIN` / `DEFAULT_BOUNDARY` / `DEFAULT_EXPLORE` / `DEFAULT_EXPLORE_NONE` **四者只存一份**（B11 步骤③④分别守旧句与新句） |
| `tools/docgen/components/validateAgentData.mjs` | B09、B12、D05、D07、E13、E18、E20、E32 | 断言集、`BASE_KEYS` 三键与错误码档位 |
| `tools/docgen/components/renderAgent.mjs` | B01、B03、B10、B11、D01–D09 | 15 席同一入口；`boundary` / `domain` / `explorePolicy` 是否真被传进去 |
| `tools/docgen/templates/agent.md.tpl` | B10、B11、D01、D03、D08、D09、E07 | 两个槽位 `{{BOUNDARY}}` / `{{EXPLORE}}`；改一处动 15 席 |
| `tools/docgen/state.json` | B06、E06、C04、C10 | A 组覆盖集从 state 现算；C9 比对键集 |
| `rules/.inspector-annotations.json` | B07、E19、C04 | A1–C4 语义键来源 |
| `scripts/check-all.mjs` | C04、C10、E06、E09、E16、E17 | C9 断言落点（含「state 整文件缺失也红」的 fail-closed） |
| `tools/docgen/test/*.test.mjs` | C05–C09、C11、C04、E09 | 12 处派生与 baseline 断言 |
| `skills/dev-workflow/**` | A01–A14、E01–E04、E10、E11、E16、E17、E24、E26、E28–E31、E33、C04 | 技能守卫与 markdown 检查全量扫；段表 / 读→产出 / 三权总则 / 取证调度 / 议会有条件 / ① 段过渡口径 |
| `rules/dev-workflow-mainline.md` | A07、E04、E12、E25、E31、C04 | 五段结构、R1–R7、例外节、baseline 登记、裸名 reader |
| `skilldependencies/manifest.json` / `skilldependencies/dev-workflow.json` | E15、E22、E23、C04 | 技能目录与清单文件一一对应 |
| `README.md` / `docs/guide/skills/README.md` / `docs/guide/rules/README.md` | E23 | 「技能与规则数量都不写死」+ 三个新条目行（人工核） |
| `agents/evidence-reader.md` | B01–B08、B10、B11、D01–D03、D08、D09、E08、E13、E14、E25 | 卡是生成物；「边界」与「自由探索」两节措辞各由一条用例兜 |
| `rules/`（新增 / 删除规则文件）+ `aas sync` | A10、E27 | 新增规则不 sync = 运行时永不加载（P-7） |

## 6 只手动验证（机器验不了的）

| 项 | 为什么机器验不了 | 谁验、看什么 |
|---|---|---|
| 出口判据是否真是「可判定句」 | 「像判据」是语义判断，token 白名单只能挡最粗的形容词 | reviewer-qa：段表 6 行 + 6 份 `stage-*.md` 的出口节逐条读，判据 = 每条能回答「有 / 无 / 相等 / 命令退出码」 |
| 计划门三条核对是否真写了「上线前手工核对」分支 | 机器只能数「手工核对」出现次数，判不了「三条都写了」 | reviewer-qa / 审计：逐条读三条核对，判据 = 每条同时有「判据句」与「证据取得方式」；上线前分支必须写出「核了什么 / 怎么核的 / 结论」三列（TC-E26 已给打回样例） |
| reader 卡「边界」措辞是否与职责一致 | 「取证角色」是语义判断，机器只能判「不含旧句」 | 议会 #2 评委：读 `agents/evidence-reader.md` 末节与 §6.2 `boundary` 定义，判据 = 不出现「评审 / 裁决他人分歧 / 中断评审」这类自我定位（TC-B10 只挡旧句，挡不住换了措辞的同类错） |
| reader 卡「自由探索」是否真的不提问 | 机器只判两句旧措辞不在、「本节不适用」在位 | 议会 #2 评委：读「自由探索」节与「固定必问清单」表头那句摩擦说明，判据 = 全文没有任何「现场生成问题」的要求；`criteria.md` 0.2 的形态适配理由必须写明「该形态已显式声明不提问」 |
| 议会有条件是否真按「P0 = 0」判 | 机器只能判句子在位，判不了「要不要放行」 | reviewer-qa / 审计：按 TC-E30 的构造态（出口六列齐 + 1 张 P0 未清）判结论，判据 = 「不得进入下一段」 |
| ① 段过渡口径的失效条件是否真能执行 | A14 只判 `S2` 命中，判不了「S2 前有效」有没有说清**什么时候删、删什么**（写成「S2 相关」也能命中） | 议会 #2 评委：读 `SKILL.md` ① 段 / 过渡口径段，判据 = 同时能回答「在哪之前有效」与「什么事件发生后删除（产品经理卡落地）」；且「代拟者不签字」必须与「产品经理一职由主 agent 代拟」写在同一句或紧邻处，不拆到两节 |
| 三权归属是否真的分给了不同的人 | 文字里有三个词不代表真的分权 | reviewer-audit：对照 PRD §3.3，看每段的签字人是否 ≠ 该产物作者，且「三权总则」节写的是「申报人不得自定性」 |
| evidence 摘要是否「不改写原文」 | 改写与摘录的差别只有比对原文才知道 | reviewer-reader：抽 3 条摘要回原文逐字比对 |
| description 路由是否「不骗人」 | 句式对 ≠ 触发时机对 | 议会 #2 评委：读 description 判断「什么任务该派它」是否与 §6.3 边界一致 |
| annotations 的 pass 是否真判过 | 值本身就是判定结果，脚本无法证伪 | 审计：核判者实例身份与判定证据（读了哪节、哪条反例） |
| R1–R7 是否写成义务句 | 「必须 / 不得」的语感是语义 | reviewer-ai：逐条看开头动词，判据 = 每条以「必须 / 不得」起句 |
| README / 三份 guide 的「什么时候用 / 不做什么」写得对不对 | 数字能机器对，措辞不能 | reviewer-qa：看根 README 场景速查行 + 技能指南 `dev-workflow` 节 + 规则指南 `dev-workflow-mainline` 节 |

## 7 不测（带理由）

| 不测什么 | 为什么 |
|---|---|
| 议会两张矩阵、`speaker` 卡、`host-duties.md` 拆分 | spec §2「不做什么」明确排除（S3） |
| `producer` / `research` 工具档、`ToolsViolation` 的档位扩展 | S5 范围；本 spec 只要求「不放松现有三 / 五元组」 |
| `check-prd-graph.mjs`、市场 / 产品经理卡 | S2 / S4 范围 |
| `scripts/check-plan.mjs` 本体（计划门的执行脚本） | S4 才建；S1 只要求 `stage-2b-plan-gate.md` 写出「判据 + 二选一证据」（A09 / E24 / E26 只判文档内容与二选一分支是否在位，不判命令能否真跑） |
| 「依赖声明是否与实际调用一致」（`dev-workflow` 正文是否真的引用这两个技能） | D2 已把依赖集合写死 → **集合本身由 E22 判**；但「声明了却没用 / 用了却没声明」属语义，只能人读（见 §9 建议 3） |
| 用户是否认可 PRD §11 的 18 条代裁 | 那是 PRD 的待确认清单，不是本 spec 的验收项 |
| `aas` CLI 自身的链接机制（软链 / junction 的实现细节） | V-12 只要求「需建链接 0 + 两条 `Test-Path` 为 True」这两个可观测结果，工具内部实现不属 S1 |
| PRD §4 段表本身的业务正确性 | V-3 只判「SKILL.md 与 PRD §4 一致」；PRD 段表对不对是 PRD 评审（议会 #1）的事 |
| `criteria.md` 的 A/B/C 三态判定内容本身 | C11 只要求 0.2 补一条「`explorePolicy: none` 形态适配」；判定质量归 `rule-inspector` 技能 |

## 8 缺口与判别力水位

| 缺口 | 漏检哪类反例 | 至少 1 个样例 | 语义由谁兜 |
|---|---|---|---|
| C9 断言「存在性」只能 grep 数据源，不能证「比的是差集」 | 引了 `agentData` 但没真比对（写了个空循环 / 只打印） | `check-all.mjs` 里 `agentData` 出现但缺键场景不红 | TC-E06 的行为证据（缺键 / 整文件缺失两个构造）；**断言位置已定在 `check-all.mjs`**（spec §7.1 否决下沉 `readState()`，见建议 2） |
| 计划门三条核对在 S1 阶段指向不存在的脚本 | 文档写了 `node scripts/check-plan.mjs ...`，谁都不跑 | A09 全绿但命令执行报 `Cannot find module` | v4 已要求「判据 + 二选一证据」→ A09 / E26 判；残余（手工核对表是否真填）由 reviewer-qa / 审计人读（建议 1） |
| 三份 README 的数量表述 | 换成别的写法（如「全部技能」「清单见 manifest」）虽不违规，但「数字仍在别处」会再漂 | E23 禁词探针只挡中文 / 阿拉伯数字 + `个技能` / `条` | 建议 4（D3 已定「不写死」，残余靠人读） |
| **规则指南已漂 1 条**（实测 `docs/guide/rules/README.md` 20 节 vs `rules/*.md` 21 份） | 只改标题不写死数量，漂移就「看不见」了——数量不再写死正是为了不再逐条对齐 | E23 只判「不写死」+ 新条目在位，判不了「旧的那条还在不在」 | 建议 8（差集核对）；E23 不把「补齐 21 条」写成硬门（超出 S1 范围） |
| 「出口判据可判定」只能查 token，不能查语义 | 用「已齐」这种含糊词也能过 token 检查 | 出口格写「材料已齐」 | reviewer-qa 人工读 |
| annotations 的 pass 无法证伪 | 施工者自己填 pass | 十键全 pass 但无人读过 §6.3 | 审计核判者身份与证据 |
| C10 / C11 只判「不含旧句」，挡不住换成别的评审 / 提问措辞 | 把「只读评审角色」改成「仅参与评审」、把「本节不适用」改成「本节从简」也能过 B10 / B11 | `## 边界` 节写「你是评审角色，不写代码」；`## 自由探索` 节写「本角色不需要提问，但可现场补充」 | 议会 #2 读措辞与职责是否一致（B10 / B11 / D08 / D09 已挡旧句与槽位未接线四种形态，见建议 6 / 9） |
| TC-C11 的 12 个 `path:line` 会随施工漂移 | 施工后行号变了，逐行探针读到别的行 → 假阳性 / 假阴性 | 实现往 `data.test.mjs` 顶部加两行 import，`:50` 变 `:52` | 用例已给兜底：漂移后用步骤②③的全量明细重新定位（不靠死行号） |
| TC-E32 依赖源码字面形态（`'boundary',`） | 实现若把 `BASE_KEYS` 写成多行或常量拼接，替换会失败 | `BASE_KEYS` 改成 `[...base, 'domain']` 之类 | 用例已要求「构造失败先核对再判」（`patched false` 不算通过） |
| `validate.test.mjs` 依赖外部仓绝对路径 | 换机器 / 该仓缺失时 V-9 相关判据全红，与改动无关 | `file:///D:/Seed/agent-assets-sync/src/deps.mjs` 不存在 → E15/E22 全红 | 建议 5 |

**判别力样例（必须都在）**：假阳性 = TC-B09（tools 顺序不同但集合相等，必须判绿）；假阳性第二例 = **TC-D03**（`senior-sdet` 是手写卡，description 本来就没有「在议会评审中担任」，一律要求 `true false` 会误杀）；假阴性 = TC-E14（description 含「在议会评审中担任」但其余全对，必须判红）；**第三条**：TC-C11（字面量 37 当下全绿、下次加席才炸——用 grep 把它提前到当期）；**第四条（假阴性第二例）**：TC-D08（C10 半改时 14 席逐字节与 `gate` 全绿，只有 reader 卡末节那句错）；**第五条（v4 新增）**：TC-D09（C11 半改时 `gate` 同样全绿——两次渲染对比才抓得住，「`gate` 绿」在 C10 / C11 这两题上零判别力）。

## 9 给开发的建议

| # | 位置（文件:行 / spec 节号） | 风险或盲点 | 为什么会被忽略 | 具体改法 | 优先级 |
|---|---|---|---|---|---|
| 1 | spec §3.2「`stage-2b-plan-gate.md` 额外要求」+ 末段「脚本未落地期的写法」；PRD §6 | 三版已把要求改成「判据 + 二选一证据」，但没给可照抄的句式——施工者极易写成「三条命令 + 一句『脚本归 S4』」，结果三条里只有一条带手工核对，机器与人都看不出缺 | 三个核对名是真的、命令格式也对，写出来像是最「落地」的版本 | 在 `stage-2b-plan-gate.md` 每条核对下固定三行：① `判据：<有 / 无 / 相等 / 计数型句子>`；② `证据（脚本上线后）：> node scripts/check-plan.mjs <子命令>` + `输出：<贴 stdout 首行>`；③ `证据（脚本上线前，S1 适用）：审计手工核对表`，表头固定 `核了什么 | 怎么核的 | 结论`。并把「签字必须附 ② 或 ③」写进「谁签」节。**验收**：TC-A09 四步全绿 + 从 `TC-E26` 的构造态（删掉 ③ 的所有句子）能被判不通过 | P1 |
| 2 | spec §7.1 C9 及其「C9 为什么不放进 `readState()`」；`scripts/check-all.mjs:121-149` | 残余风险记录（**不建议在 S1 实施**）：C9 只保护 `npm run check` 这条路径；`gate` / `check-agents` 直调 `readState()` 时不设防，将来新增消费方仍可能漏看「state 缺席」 | `readState()` 已校验「键不在 agentData」（多键），容易误以为「键集问题它都管」 | **spec 已否决下沉**，理由成立：`readState()` 在 state 文件缺失时返回空表是既有语义（`pilot-gate.test.mjs` 依赖「state 缺失 = 全量 registered」），下沉会改语义并波及多个测试。因此本 spec 内不改，只做两件事：① C9 的报错必须**点名缺哪个席**（「打印缺哪个」是 spec 原文要求，也是唯一能让直调路径露出的线索）；② 保留 `check-agents` 的「未迁移 0」作为第二道可见信号（§7.4）。**验收**：TC-C10（断言在 `check-all.mjs`）+ TC-E06（删键必红、`# fail 0`）。要改下沉，另开 spec 并先改 `pilot-gate.test.mjs` 的前置语义 | P2（降级：仅记录） |
| 3 | spec §2 P-6 **D2**；`skilldependencies/dev-workflow.json`（新建）；`skilldependencies/validate.test.mjs` | D2 已把依赖集合写死为 `parliament` + `prd-to-specs`，但**没有任何测试守它**——现在只有 schema 校验（skill 名存在 + 与文件名一致），把依赖删掉一个，测试仍绿 | 有 `parliament.json` 可照抄，抄了就算完；「依赖集合对不对」不在测试里，只在 spec 表格里 | 在 `skilldependencies/validate.test.mjs` 加一条断言：`readManifest('skilldependencies/dev-workflow.json').skills.map(s=>s.name).sort()` 必须 `deepEqual ['parliament','prd-to-specs']`（顺序无关、数量恰等）。把「依赖变更」变成必须同时改测试的显式动作。**验收**：正常态 `node --test skilldependencies/validate.test.mjs` exit 0；删掉 `prd-to-specs` 后同一命令 exit 1；多一个 `speaker` 后亦 exit 1（同 TC-E22 构造 C / D） | P1 |
| 4 | `README.md:53-54`、`docs/guide/skills/README.md:1`、`docs/guide/rules/README.md:1` | 技能数写成中文数字硬编码（`十八个`），规则数同样（`二十条`），下次加技能 / 加规则必再改三处 → 与 §7.5 的 F13 同一个病 | 中文数字不像 `35`/`14` 那么扎眼，grep 数字搜不到 | spec D3 已裁定「技能与规则数量都不写死」→ 三处标题改为不含数量的表述（如 `# 技能清单（清单见 skilldependencies/manifest.json）`、`# 全局规则（清单见 rules/）`），README 的「技能**（十八个…）**」「全局规则（二十条…）」两行同样去掉数字；三个新条目行照加。数量只在 manifest / `rules/` 各有一处真相。**验收**：TC-E23 步骤①（三份禁词零命中，含 `[一二三四五六七八九十百]{2,}条`）+ 步骤④（manifest 技能数 == 技能指南节数）均绿；若有人把数字加回来，①立即命中 | P2 |
| 5 | `skilldependencies/validate.test.mjs:6` | 用绝对路径 import 外部仓 `file:///D:/Seed/agent-assets-sync/src/deps.mjs`：换机器、该仓不在原位时 `npm run check` 必红，且红因与本次改动无关，排查会绕远 | 它在本机一直绿，从来没人质疑 import 路径 | 改为仓库内可解析的依赖（把 `readManifest` 的校验语义内联成本仓 `skilldependencies/read-manifest.mjs`，或从 `package.json` 的依赖路径解析），并在用例前置里去掉该外部前提。**验收**：`node --test skilldependencies/validate.test.mjs` 在 `D:/Seed/agent-assets-sync` 改名后仍 exit 0 | P1 |
| 6 | spec §7.1 **C10**；`tools/docgen/templates/agent.md.tpl:31` | C10 已定「边界句改槽位」方案，但**半改可静默通过**：模板加了 `{{BOUNDARY}}`、`renderAgent` 却仍写死默认句 → 14 席逐字节全绿（`gate` 也全绿），只有 reader 卡末节自我描述错误 | 模板是共用的，改一处会动 15 席；而「14 席不变」正好会被误当成「改得对」的证据 | ① 默认句只在 `patternRegistry` 存一份常量，由 `renderAgent` 的 `agent.boundary ?? 默认` 分支引用；模板只留 `{{BOUNDARY}}` 槽位，**禁止模板与 renderAgent 各写一遍旧句**（写两处必然漂移）；② `validateAgentData` 加一致性断言：当 `agent.boundary` 存在且 ≠ 默认句时，`renderAgent(agent)` 的产物**不得包含**默认句里的判别性片段（「只读评审角色」）；③ 不用 `identity` 里「请按取证角色理解」这类补丁——那是让读者替实现兜底。**验收**：TC-B10 三步全绿 + TC-D08 的构造态（槽位未接线）必被 B10 抓到；**不要用 `render13-snapshot.mjs` 作证据**（它只渲染一个 fixture，零判别力，spec §7.6 已明令） | P1 |
| 7 | `tools/docgen/components/validateAgentData.mjs:58-66`（断言 8） | 断言 8 只查 `derived.includes('时时')`，不校验 domain 是否真的传进去了；C5 半改（只加字段不接线）能过断言 8 —— spec §7.1 C5 已要求「追加一致性」，但判据未给可判定的写法 | 现有断言「看起来已经覆盖了 description」 | 断言 8 追加两件事：① 当 `a.domain` 存在时，先 `trim()`、非空（`''` / `'  '` / 非字符串一律 `DescriptionDerivation`）；② `derived` 必须真的包含归一化后的 domain（**不要写 `includes('')`**，那恒真）。**验收**：TC-D05 三行均 `false false DescriptionDerivation`；把 `renderAgent` 的归一化分支改回 `'议会评审'`，`validateAgentData` 抛 `DescriptionDerivation`（当前实现下不会抛 → 说明缺这条） | P1 |
| 8 | `docs/guide/rules/README.md:1`（标题 `# 二十条全局规则…`）与 `rules/*.md`（**实测 21 份**，2026-10-24） | 规则指南已漂 1 条：标题写「二十条」，`rules/` 实为 21 份 → 有 1 条规则从没进指南。改成「不写死数量」后，这个差集**再也不会被数字暴露** | 中文数字不扎眼；数量只在标题里，grep 数字搜不到；而 D3 要求删掉数字，正好把唯一的线索删了 | ① 标题按建议 4 改成不含数量的表述；② **顺带核一次差集**：`ls rules/*.md` 与指南 `### N.` 逐名比对，把缺的那条补一节（或在该规则文件头部注明「不进指南」的理由）。**验收**：E23 步骤① / ⑤ 绿 + 差集为空或每项有显式理由（这条不写成 E23 硬门——补齐旧规则超出 S1 范围，但**必须留一条可复算的差集命令**给下一个人） | P2 |
| 9 | spec §7.1 **C11**；`tools/docgen/templates/agent.md.tpl:18-19`、`tools/execution-matrix/criteria.md` 0.2 | C11 是三处改动（模板槽位 / `renderAgent` 分支 / `criteria.md` 形态适配），任一漏做都会被「10 键全 pass」掩盖；若旧句同时留在 `renderAgent` 与 `patternRegistry`，两处必然漂移 | 模板句「看起来只是措辞」，改不改都渲染得出来；`criteria.md` 的形态适配理由最容易被跳过 | ① **三个默认常量**只在 `patternRegistry` 存一份（`DEFAULT_BOUNDARY` / `DEFAULT_EXPLORE` / `DEFAULT_EXPLORE_NONE`，C3），`renderAgent` 与模板一律引用、不复制文本；② `renderAgent` 按 `agent.explorePolicy === 'none'` 选常量，模板只留 `{{EXPLORE}}`；③ `criteria.md` 0.2 写明「`explorePolicy: none` 形态下 B4（自由探索要求）/ C2 按形态适配判 pass，理由 = 该形态已显式声明不提问」，通用纪律「只提问题不给解法」同款。**验收**：TC-B11 **四步**全绿（步骤④ = `DEFAULT_EXPLORE_NONE` 单源 `[1,0,0]`）+ TC-D09 的判别力探针（`none` / `full` 两次渲染必须不同；`gate` 在这题上零判别力） | P1 |

## 10 自检

| 检查项 | 结果 | 数字 / 证据 |
|---|---|---|
| 每条用例五要素（覆盖 / 前置 / 步骤 / 预期 / 判据）齐 | 通过 | 79 / 79 条均含五要素，无 TBD / TODO |
| 用例号格式（组号 + 两位序号）且全文唯一 | 通过 | A01–A14（14）、B01–B12（12）、C01–C11（11）、D01–D09（9）、E01–E33（33），共 79 个，无重复 |
| 用例总数 | 通过 | 79（v5 由 77 → 79：新增 A14 / E33 两条） |
| 正例数 | 通过 | 34（A 14 + B 11 + C 5 + D 4） |
| 负例数 | 通过 | 35（C 5 + D 4 + E 26） |
| 边界数 | 通过 | 10（B09、C09、D05、E03、E11、E16、E17、E18、E19、E23） |
| 负例 + 边界 ≥ 正例（硬门） | 通过 | 35 + 10 = 45 ≥ 34 |
| 覆盖总表每行可指回 spec | 通过 | 79 行全部指向 V-x / C-x / F-x / §节号 / D-x / P-x；无不可回溯行 |
| V-1～V-14 全覆盖 | 通过 | V-1→A01；V-2→A02/E02/E03；V-3→A04/E21；V-4→A07/E04；V-5→B01–B03/E05/E13/E14；V-6→C01/C02/C09；V-7→C04/E09/E15–E17；V-8→D01/D02/E07；V-9→E15/E22/E23；V-10→B06/C10/E06；V-11→B10/B11/D08/D09；V-12→A10/E27；V-13→A11/A12/A13/E28/E29；**V-14→A14/E33** |
| §7.1 C1–C11 全覆盖 | 通过 | C1→B02/B05/B06；C2→C03/E12；**C3→B04/B11/E20**（三个默认常量：旧句 ③、新句 ④）；C4→B04/E08；C5→B12/D03–D05/D07/E32；C6→C02/C09；C7→B06/E06；C8→B07/E19；C9→C10/E06；C10→B10/D08；C11→B11/D09 |
| §7.5 的 12 处硬编码全覆盖 | 通过 | C06（12 处全未改的整体红）；C05（生产侧已升级 vs `check-baseline:30,36`）；C07（`data.test.mjs:10`）；C08（`cli-gate 14/31/58`、`review-fixes 45`、`pilot-gate 38`）；E09（全量门只改一处）；C11（12 个 `path:line` 逐行 + 全局剥 `//` 后 0 命中，含 `data.test.mjs:50` 注释） |
| §2 P-6（D1–D3）+ P-7 全覆盖 | 通过 | D1→E15；D2→E15/E22（集合恰等 + 多 / 少构造）；D3→E23（三份 README、技能与规则数量都不写死）；**P-7→A10/E27** |
| F1–F22 每条至少一条负例 | 通过 | F1 E01/E24；F2 E02/E03；F3 E04；F4 E05；F5 E06；F6 E07/D04/D06；F7 E08；F8 C05/C06/E09；F9 E10/E11；F10 E12；F11 E15/E22/E23；F12 E21；F13 C05–C08/C11/E09；F14 B10/D08；F15 E26；**F16 A10/E27；F17 A11/E28；F18 A12/E29；F19 E30；F20 E31；F21 A13/E29；F22 A14/E33** |
| v4 的 16 项改动逐条落实 | 通过 | ①36→37 → C01/C02/C03/C04/E06；②V-2 7 份 + 六列表头 → A02/E02/E03；③V-3 三列 + 段顺序 → A04/E21；④前置拆两段 → §0 两行 + D02；⑤§7.5 12 处 → C05–C08/C11/E09；⑥状态改定稿 → 文件头；⑦V-8 换 `gate`、删快照 → D01/E07；⑧D03 按 outputKind 分流 → D03；⑨C05 前置补齐 → C05；⑩P-7 → A10/E27；⑪C11 自由探索 → B11/D09；⑫domain 输入空间 → D05；⑬V-13 结构 → A11–A13/E28/E29；⑭BASE_KEYS 三键 → B12/E32；⑮R7 / 例外 / 议会条件 → A07/E30/E31；⑯D3 扩规则数量 → E23 |
| v5 的 5 处改动逐条落实 | 通过 | ①§3.1 过渡口径 → A14（三要素 + `S2`）+ E33（删「代拟者不签字」必红）；②§8 F22 → A14/E33（覆盖列均写 F22）；③§9 V-14 → A14（覆盖列写 V-14 + §3.1 过渡口径）；④§7.1 C3 三个默认常量 → B11 前置 + 步骤④（`DEFAULT_EXPLORE_NONE` 单源 `[1,0,0]`）；⑤§7.3 回落值引用 `DOMAIN` 常量 → 由 D06 兜（内联 `'议会评审'` 时改 `DOMAIN` 不生效 → 该用例期望的 `Mismatch` 不出现即判红），**无需新增用例** |
| 判据可机器复算 | 通过 | 73 条纯机器判；6 条含人工判（A09 三条核对、B07 判者身份、B08 三卡边界比对、E23 README 措辞、E26 二选一证据、E30 议会放行判定），均写清谁看、看什么；无一条用「实现结果」当预期（预期值来自 spec 原文 / PRD §4 / 常量派生式 / 模板现句原文 / ① 段三要素原文） |
| 判据来源无自证循环 | 通过 | 37 来自 `22 rule + 15 agent`（spec §7.1 C6 / §9 V-6）；`无议会` / `；` 来自 PRD §4 原文；旧措辞（`无` / `，` / `任务↔testcase` / `测试绿`）来自 v4 修订前的表；`description` 句式来自现有 14 张卡的实测行；`Mismatch` / `BaselineDrift` / `TriggerFieldMisplaced` / `DescriptionDerivation` 均来自 `validateAgentData.mjs` 的既有多错误码表 |
| 命令可在 PowerShell 直接跑 | 通过 | 全部命令无内嵌反引号、无 bash 专有语法；`*>` 重定向、`Test-Path`、`Remove-Item`、`Select-String` 均为 PS 5.1 原生；`node -e` 串内只用单引号与正则 |
| 只写用例、未改实现 / spec / 其它文件 | 通过 | 本次仅修订本文件 |
