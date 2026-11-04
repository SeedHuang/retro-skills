# S-E 批次 ②→③ 计划门审计（2026-11-04）

> **判者标识** = `reviewer-audit@agents/reviewer-audit.md（角色卡贴入，独立实例）`，2026-11-04。本席未参与 S-E 范围起草 / plan 撰写 / 施工，也未参与 S-D 任何段落申报。
> **声明**（角色卡「边界 / 禁止 2」）：本件是上级指派的**唯一**写入产物；本席未写 `gate-record.md`、未写 plan、未改任何测试 / 数据 / spec（门行签字原文由申报人转录，本席只核转录逐字一致）。本席只跑只读命令：`check-plan deps`、`git status` / `git cat-file` / `git diff`、`Select-String`、`scope-sweep --check`、`docgen generate --readme`（无 `--apply`，即 `tools/docgen/cli.mjs:85` 的「只比不写」档）。
> **审计对象**：`docs/superpowers/plans/2026-11-04-s-e-dimension-and-persona-wordface.md`（下称 plan）能否过 ②→③ 计划门。判据原文 = `docs/prd/20261024073606-dev-workflow-mainline/index.md:328`（旁路替换判据：**依赖无环 / 变更范围在 plan 白名单内 / 另两条写「不适用（无功能块）」**）+ 常轨 `:285`（本段「议会 = 无」）。
> **口径**：只认命令退出码与计数；`path:line` 一律当场打印（G10：`gate-record.md` 混合换行，行号可差 1）。英文术语首现行附中文解释。**本件只判过程标准，不裁决技术分歧**（词面该不该加 `十年`、B04 该断在哪层，归申报方与 ③ 段）。

## 0 核对项速览（角色卡必填字段 1–4）

| # | 核对项 | 核对内容 | 结果 | 证据（本席自跑） |
|---|---|---|---|---|
| 1 | 依赖无环 | `check-plan deps`（读 plan 的「任务小节 + `Consumes:` 依赖声明行」）对本 plan 的机械判定 | hit（成立） | `deps: cycle 0 dangling 0（nodes 6 / edges 6） => ok`、exit 0（§1） |
| 2 | 变更范围在 plan 白名单内 | `git status --porcelain -uall` 全量清单 ↔ plan §3 逐行比（非抽样）+ 形态（M / A）用 `git cat-file`（读 git 对象内容的只读命令）复核 | hit（成立） | 变更 5 行，逐行落 §3 第 12 / 15 / 16 / 17 / 18 行；白名单外真实变更 **0**；形态 1 M + 4 A 与 §3 声明逐件一致（§2） |
| 3 | R4 零新增设计决策 | plan 内 `^## 新增设计决策` 节命中数；另抽 3 处具体做法核「都能指回既有判据载体」 | hit（成立） | 命中 **0**；3 处载体全部在位（词面数组、`seatEntry` 结构行、`BASE_KEYS`）（§3） |
| 4 | 旁路两条「不适用」写清 | 独立确认 plan 确无功能块（变更清单内无新增 spec / testcase） | hit（成立） | 5 行变更内 spec 0 / testcase 0；`docs/agents` 文件 16 份未变数（§4） |
| 5 | §3 白名单覆盖 §2 全部产出 | 逐任务扫 §2 / §2.1 的「产出」列路径 ↔ §3 21 行 | hit（成立） | 6 个任务全部落在 §3；`.session/**` 由 §3 末行显式排除（§4.2） |
| 6 | plan 数字与现盘一致 | `dimension` 键数、README 维度列非空格数、三面 `十年` 命中数 | hit（成立） | 14/15、14/15、2（`tools/docgen/data/seats/*.json`、`docs/agents/README.md`、三面 `Select-String`）（§4.3） |
| 7 | 现盘门禁实况（**不作本门判据**，只记基线 + 阻断项） | `npm run check` 全跑一遍 | miss（见 §5 P1-A：红 3 条不是本门四条判据项，但会阻断 ③） | `# tests 1541 / # fail 3`，三条 `not ok` = 79 / 661 / 690；`④ markdown 检查通过（423 个文件 / 1835 张表）`；末行 `check 未通过`（§5 P1-A） |

**缺答判据**：本表 7 行逐行有「结果」与「证据」，无空行；第 7 行 `miss` 带 reason（非本门判据项、但阻断下一段）。

### 0.1 A 节 过程闭环

| 项 | 内容 | 结果 | 证据 |
|---|---|---|---|
| A1 终态对账 | 与 `docs/reports/2026-11-04-s-e-bypass-audit.md` §4 的 R1–R7 七条逐条对账 | hit | R1（P1，`deps` 曾 `nodes 0 / edges 0`）**已闭**：复跑 `nodes 6 / edges 6 => ok`；R2 / R3 / R4（P2）已改：plan 第 17 行写「三面合计 2」、第 111 行写「T1 前 14/15 → T1 后 15/15」、§3 第 7 行只列 S4 testcase + §4 第 102 行「S4 spec 正文逐字不动」；R5–R7（P3）归 ④ / ⑤ 段登记，本门不作判 |
| A2 P0P1 清零 | 本门是否挂 P0 / P1 | miss | 本门判据项 **P0 0**；**P1 1 条**（P1-A：现盘 `npm run check` 红 3 条，全部由 `gate-record.md:119` 的 ②@S-E 行文本引起）——不是 ②→③ 四条判据的反例，但按 `:329` 会阻断 ③ 段 |
| A3 落点抽查 ≥3 | 抽查 plan 指向的关键落点是否真实存在且内容相符 | hit | 4 处全实：`docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md:80` = `seatEntry = { name, role, dimension, outputKind, tools, card }`；`tools/docgen/test/sc-card-shape.test.mjs:605` = `const words = ['资深', '20 年']`、同件 `:649` = `for (const w of ['20 年经验', '20 年'])`；`tools/docgen/test/sdet-data.test.mjs:9` 的 `KEYS` 无 `dimension`、`:17` = `assert.equal('dimension' in e, false)`；`tools/docgen/components/validateAgentData.mjs:111` 的 `BASE_KEYS` 已含 `dimension` |
| A4 P2 三态齐 | 本门每条 P2 是否带「触发 / 谁兜 / 建议解法」 | hit | §5 三条 P2 均三样齐（P2-A 归申报方 + ③ 段、P2-B 归申报方、P2-C 归申报方 T4） |
| A5 数字一致 | plan 宣称的数字与现盘复算值 | hit | 14/15、14/15、2、16 份、21 行白名单（展开 24 件）、变更 5 行 —— 全部与 plan 一致；唯一不一致是 §2 T5 的「5 条」vs 列出的 6 个门行 ID（P3-C） |
| A6 升级项终裁 | 是否需要打回 / 升级到用户 | hit | **本门不打回**：旁路两条替换判据（`:328`）全部成立，P2 三条是 plan 文案可核性缺陷、不改变两条判据的真伪。**但 P1-A 须在 ③ 段开工前由申报人闭合**（`gate-record.md:119` 文本致 `npm run check` 红 3 条）；本席禁写该件，故只登记不处置；若申报人拒绝处置，由用户裁定（升级项 1 条） |

### 0.2 B 节 按完成判据逐交付物核对

| 交付物 | 完成判据核对 | 结果 | 证据 |
|---|---|---|---|
| plan §2 任务表 + §2.1 六个任务小节 | 每个任务节各一行 `Consumes:`，且形成无环图 | hit | `nodes 6 / edges 6`、`cycle 0`（§1）；六节标题与 `Consumes` 行在 plan 第 39–67 行 |
| plan §3 白名单 21 行 | 每行有路径 / 形态 / 由谁写三列 | hit | 21 行全三列非空（第 73–93 行）；形态列 M 14 行 / A 7 行 |
| plan §3 白名单路径存在性 | 已存在的 14 个 M 件路径 `Test-Path` | hit | 14/14 `OK`，无 `MISS`（含两份 `docs/after`、`keywords.json`、`baseline.json`） |
| plan §4 不改清单 | 与 §3 是否自相矛盾 | miss | S4 spec 的矛盾已消（§4 第 102 行「只看不动」↔ §3 第 7 行只列 testcase），但 S-C **testcase** 的「其它逐字不动」与 T2 必须改的结论句冲突（§5 P2-A） |
| plan §5 红绿两档 | 每处改判是否有可重跑的红档 | miss | B04 红档缺「副本内重生成」一步（§5 P2-B） |
| plan §6 已知限制 4 行 | 每行「触发 / 谁兜」两列非空 | hit | 4 行两列全非空（第 119–122 行） |

## 1 ① 依赖无环（成立）

**命令原文（仓根 PowerShell 5，2026-11-04）**

```powershell
node scripts/check-plan.mjs deps --plan docs/superpowers/plans/2026-11-04-s-e-dimension-and-persona-wordface.md
```

**首行输出（本席首跑原样记录）**

```
deps: cycle 0 dangling 0（nodes 6 / edges 6） => ok
```
`exit 0`。

**判定**：**成立**。`cycle 0`（无环）、`dangling 0`（无悬空依赖，即每条 `Consumes: Task n` 都指到存在的任务）、`nodes 6 ≥ 6`、`edges 6 ≥ 4`、`exit 0` 五个条件全满足。

**与前批审计的差异（必须写明）**：前批 `2026-11-04-s-e-bypass-audit.md` §4 R1 记录的同一命令输出为 `nodes 0 / edges 0 => fail`（exit 1），根因是 plan 只写 Markdown 任务表、脚本只认「`### T<n>` 任务小节 + 节内 `Consumes:` 行」。本席首跑即 `nodes 6`，说明申报方已补 plan 第 37–67 行的 §2.1 六节（T0 写 `Consumes: 无`，T1→T0、T2→T1、T3→T2、T4→T2、T5→T3/T4），R1 已闭、非假绿。

## 2 ② 变更范围在 plan 白名单内（成立）

**命令原文**

```powershell
git status --porcelain -uall
git cat-file -e HEAD:<path>        # 对 5 件逐件跑
git diff --stat
```

**实际输出（首行 / 计数）**

- `git status --porcelain -uall` → **5 行**：`M` 1 件（plan §3 第 12 行的 `gate-record.md`）+ `??` 4 件（`docs/reports/2026-11-04-s-d-evidence/README.md`、同目录 `impact-sheet.md`、`docs/reports/2026-11-04-s-e-bypass-audit.md`、plan 本身）。
- `git cat-file -e HEAD:<path>` → M 件 **exit 0**（HEAD 存在）；4 件 A **exit 128**（HEAD 无此件）。与 plan §3 声明的形态**逐件一致**（第 12 行 M；第 15 / 16 / 17 / 18 行 A）。
- `git diff --stat` → `1 file changed, 3 insertions(+), 1 deletion(-)`（唯一 M 件；3 增 1 删 = `⑤@S-D` 兑付句 + `①@S-E` / `②@S-E` 两行）。
- `git log --oneline -1` → `a495656 docs(handoff): 基线数字校正 + HEAD 取法说明 + 一条未复现红的留观`。

**逐行比对（非抽样）**

| 变更件 | 形态（实测） | 对应 plan §3 行 | 判定 |
|---|---|---|---|
| `gate-record.md` | M（`cat-file` exit 0） | 第 12 行（M） | 白名单内 |
| `docs/reports/2026-11-04-s-d-evidence/README.md` | A（exit 128） | 第 15 行（A） | 白名单内 |
| `docs/reports/2026-11-04-s-d-evidence/impact-sheet.md` | A（exit 128） | 第 16 行（A） | 白名单内 |
| `docs/reports/2026-11-04-s-e-bypass-audit.md` | A（exit 128） | 第 18 行（A） | 白名单内 |
| plan 本身 | A（exit 128） | 第 17 行（A） | 白名单内 |

**判定**：**成立**。白名单外真实变更 **0**；形态声明与实际逐件相符，无「声明 M 实为 A」这类不一致。白名单其余 16 行属 T1–T5 施工产出，`plan` 第 128–133 行的执行记录显示 T0 完成、T1–T5 未开工 → 此刻不存在对应变更是**批次尚在计划门**，不是漏项。

**效力边界（审计必须写明）**：本判只对「已发生的变更 + plan 声明的白名单」成立。T1–T5 落地后若出现白名单外文件、或 §3 第 20 行的 4 件证据账与第 21 行交接件写出 `docs/` 之外，③ 段须按 `:328` 第②条重核一遍。本件不为未开工的施工背书。

## 3 ③ R4 零新增设计决策（成立）

**命令原文与首行输出**

```powershell
Select-String -Path docs/superpowers/plans/2026-11-04-s-e-dimension-and-persona-wordface.md -Pattern '^## 新增设计决策'
```
输出为空，`hits=0`。

**三处具体做法的载体核对（抽查，逐处给 `path:line`）**

| # | plan 的具体做法 | 既有判据载体 | 核对结果 |
|---|---|---|---|
| 1 | T2 给 `SC-TC-29` / `SC-TC-31` 的词面数组加 `十年` | `tools/docgen/test/sc-card-shape.test.mjs:606` 的 `for (const w of words)`、`:605` 的 `const words = ['资深', '20 年']`、`:649` 的 `for (const w of ['20 年经验', '20 年'])`；口径出处 `docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md:151`（§11.8 的 V9 行）与 `:108`（§11.4「人设词面」段） | 载体在位（改的是既有数组内的元素，不新增用例块） |
| 2 | T3 给 `S4-TC-B04` 块加「README 维度列 15 格非空」 | `tools/docgen/test/card-render.test.mjs:619` 的既有 `test('S4-TC-B04 index 表头五列齐', …)` 块；结构锚 = `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md:80` 的 `seatEntry`（含 `dimension`）；用例行 = `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design-testcase.md:279` 与 `:710` | 载体在位（断言加在既有块体内；`dimension` 的必填语义出 spec 结构行，属既有判据） |
| 3 | T1 给 `senior-sdet` 补 `dimension` 键 | `tools/docgen/components/validateAgentData.mjs:111` 的 `BASE_KEYS` 已含 `dimension`（可选、未要求非空）；`tools/docgen/test/sdet-data.test.mjs:9` 的 `KEYS` 与 `:17` 的「不得有该键」断言是既有翻转对象 | 载体在位（改的是既有键表与既有断言，不新增需求） |

**判定**：**成立**。plan 无「新增设计决策」节；3 处做法全部能指回**已存在**的判据载体（测试文件既有块 / 已签 spec 的结构行 / 校验器的 `BASE_KEYS`），无一处需要回流 spec 重审。第 2 处曾在前批被记为「spec 未定义必填」（R4），现已由 plan §4 第 102 行「S4 spec 正文只看不动、只给 B04 覆盖列补锚 `:80`」定案，矛盾消除。

## 4 ④ 旁路两条「不适用」写清（成立）

判据原文（`:328`）：常轨的「功能点全覆盖」「功能块↔testcase 一一映射」在旁路时写「不适用（无功能块）」。本席独立确认 plan 确无功能块：

```powershell
git status --porcelain -uall          # 5 行，见 §2
Get-ChildItem docs/agents -File       # 16
node tools/docgen/cli.mjs generate --readme   # baseline 38/38, exit 0
```

| 核什么 | 实测 | 判定 |
|---|---|---|
| 变更清单内新增 spec | `docs/superpowers/specs/**` 0 件（5 行里 0 行） | 无新增功能块 |
| 变更清单内新增 testcase | `*-testcase.md` 0 件（5 行里 0 行） | 无新增功能块 |
| plan 是否有功能点 ↔ testcase 映射表 | 无（§2 六任务均为「改既有测试文件内断言 / 改既有数据键 / 迁账 / 收口」） | 无从映射，故「不适用（无功能块）」成立 |
| `docs/agents` 投影面是否被新增文件 | 16 份（15 席 + README），与 plan §0 声明一致；`generate --readme`（只比不写）→ `baseline 38/38` 说明盘上与渲染器输出当前同步 | 未新增 |

### 4.2 §3 白名单是否覆盖 §2 全部产出（逐任务扫，非抽样）

| 任务 | §2 / §2.1 的产出 | 对应 §3 行 | 结论 |
|---|---|---|---|
| T0 | 迁账两件 + 删 `.session/reviews/2026-11-04-s-d/` + `gate-record.md` 兑付登记 | 第 15 / 16 / 12 行；`.session/` 由 §3 末行排除 | 覆盖 |
| T1 | `senior-sdet.json` 加键、`sdet-data.test.mjs` 的 `KEYS` 与 `:17`、重生成 | 第 1 / 2 行；重生成实际变更面 = 第 8 / 9 行 | 覆盖 |
| T2 | `rationale` 首句、`sc-card-shape.test.mjs` 词面、S-C spec 与 testcase 同步、再重生成 | 第 1 / 3 / 5 / 6 / 8 行 | 覆盖（但同步点条数不足，见 §5 P2-A） |
| T3 | `card-render.test.mjs` 的 B04 块、S4 testcase 的 B04 行 | 第 4 / 7 行 | 覆盖 |
| T4 | `keywords.json` 加 `I34`、`--freeze` 重写 `baseline.json`、本批 `impact-sheet.md` | 第 10 / 11 行；`impact-sheet.md` 落 `.session/reviews/2026-11-04-s-e/`，由 §3 末行排除 | 覆盖（但回扫面缺 2 处，见 §5 P2-C） |
| T5 | 6 个门行、两份 `docs/after`、plan §7 | 第 12 / 13 / 14 / 17 行 | 覆盖 |

**判定**：§3 白名单**覆盖** §2 全部产出，无「产出无处落」的缺行。

### 4.3 plan 宣称的数字与现盘复算

```powershell
Select-String -Path tools/docgen/data/seats/*.json -Pattern '"dimension"'      # 14
Select-String -Path docs/agents/README.md -Pattern '^\|'                        # 表体 15 数据行
Get-ChildItem tools/docgen/data/seats/*.json                                    # 15 件
Select-String -Path tools/docgen/data/seats/*.json,agents/*.md,docs/agents/*.md -Pattern '十年'   # 2
```

| 口径 | plan 宣称 | 本席复算 | 一致 |
|---|---|---|---|
| 含 `dimension` 键的席数 | §5 写「T1 前 14/15」 | 15 件中 14 件有键，`senior-sdet` 缺键 | 是 |
| README 维度列非空格数 | §0 验收写「15 格非空」（改后目标）、§5 写「14/15」 | 15 数据行中 14 非空，空行 = `senior-sdet` 那行（`docs/agents/README.md:19`） | 是 |
| 三面 `十年` 命中 | §0 写「现盘三面合计 2（data 1 + 投影 1）」 | 2：`tools/docgen/data/seats/senior-sdet.json:143`、`docs/agents/senior-sdet.md:9` | 是 |
| `docs/agents` 文件数 | §0 写「16 份 = 15 席 + README」 | 16 | 是 |
| §3 白名单行数 | 21 行 | 21 行（第 73–93 行）；第 20 行是目录行、展开 4 件 → 24 件 | 是 |

**判定**：数字全部一致（前批 R2 / R3 已按审计记录改正，本席复算证实）。唯一计数不一致见 §5 P3-C。

## 5 抓到的问题

共 **7 条**：P0 0 / P1 1 / P2 3 / P3 3。每条带触发点与建议解法（角色卡「禁止 1」：不得只提问题不给解法）。

| # | 级别 | 问题 | 证据 | 建议解法 | 复核轮状态（§7） |
|---|---|---|---|---|---|
| P1-A | P1 | **现盘 `npm run check` 红 3 条，三条全部由 `gate-record.md:119`（②@S-E 行）的文本引起** —— ① 该行把「同文件自引用」写成带技能前缀的完整路径（技能名目录 + `/references/gate-record.md`），被 skill-inspector 判「自引用带前缀」；② 该行含主观词「严格」（原文「三件 A 的严格读法风险」），使观察产物守卫按「9 词 + 排标题行」数出的原始命中行 14 行 ≠ 分诊表登记的 13 行。后果：按 `:329` ③ 段要求 `npm run check` 绿，本批此刻**进不了 ③** | 本席实跑 `npm run check`（首跑 `# fail 4`、修完本席产物后复跑 `# fail 3`）：`not ok 79 - OCR-S1-TC-E08`、`not ok 661 - TC-C04 全仓检查的前三环在本仓为绿`、`not ok 690 - TC-E10 自引用带技能名前缀`；用「9 词 + 排标题行」口径独立复算 `rules/` + `skills/` 的原始命中行 = **14**，其中未进分诊表 13 行的那一行 = `gate-record.md`（该物理行 js 计数 118 / `Select-String` 计数 119，差 1 即 plan 口径点名的 G10 混合换行），命中词 `严格`；`Select-String -Path gate-record.md -Pattern '严格'` → 唯一命中该行 | 申报方（本席禁写该件）在该行做两处改写：① 自引用只写文件名 `gate-record.md`（同文件自引用不必带技能前缀）；② 把「严格读法风险」换成可判表述（如「按 `:320` 括号点名列外读法的风险」）。改后复跑 `npm run check` 须 `# fail 0`；未清零不得进 ③ | **ADDRESSED（§7 复核）** |
| P2-A | P2 | plan §4 不改清单写「只许给 §11.8 词面加 `十年`、给 B04 行补预期与覆盖列锚点，**其它逐字不动**」，但 T2 实际必须改 S-C **testcase** 的一句**结论句**（`docs/superpowers/specs/2026-11-03-s-c-card-shape-design-testcase.md:506`「更长的人设句（「有十年以上经验的…」）……**判据不追**」）；且 §2 T2 写「§11.8 两处」，实测 §11.8 只 1 处（`:151`），另一处在 §11.4（`:108`），testcase 侧需同步的点 ≥7 处（`:70` / `:475` / `:477` / `:480` / `:481` / `:499` / `:501` / `:924`） | 上述各 `path:line`；plan 第 51 / 101 行原文 | §4 该行改为「只许：§11.8 `:151` 与 §11.4 `:108` 加 `十年`；S-C testcase `:506` 的『判据不追』改为『判据追 `十年`』，并同步 `:70` / `:475` / `:477` / `:480` / `:481` / `:501` / `:924` 的词面表述」；同时把 §2 T2 的「§11.8 两处」改成「§11.8 `:151` + §11.4 `:108` 各一处」，让 ③ 段能逐行判「同步齐」 | **PARTIALLY（§7 复核）** |
| P2-B | P2 | plan §5「B04 每格非空」的红档不可重跑：它写「副本在 T1 后状态上删 `senior-sdet.json` 的 `dimension` 键 → **README 该格空** → 断言红」，但 B04 断言读的是**盘上** `docs/agents/README.md`（`tools/docgen/test/card-render.test.mjs:620`），只删数据键而不在副本内重生成，README 该格仍是 `测试设计` → 断言**不会红**（红档形同虚设） | `tools/docgen/test/card-render.test.mjs:619-626`；plan 第 111 行原文 | 红档补一步「副本内 `node tools/docgen/cli.mjs generate --readme --apply` 后再断言」；或把断言面改为渲染器返回值（`renderReadme` 的输出串）而非盘上文件——二选一写进 §5，并把「错误信息须点名席名与列名」保留 | **ADDRESSED（§7 复核）** |
| P2-C | P2 | R8（改判回扫）的扫描面漏两处**既有** `十年` 命中：`docs/superpowers/specs/2026-10-19-docgen-agent-senior-sdet-design.md:64`（`identity: '有十年以上经验的测试开发工程师（SDET）。...'`）与 `docs/superpowers/specs/2026-10-21-docgen-replace-intent-change-design-testcase.md:1047`（注入用的旧人设字面量）。这两件都是**已签件**，且 `docs/superpowers/specs/` 不在回扫脚本的「历史类」前缀内，不会被自动放过 | `scripts/scope-sweep.mjs:21-27` 的 `HISTORY_PREFIXES`（只含 handoffs / plans / reviews / retro / after / research）；上述两处 `Select-String` 命中 | T4 把 `I34` 的 `scope` 显式列上这两条路径（该配置禁通配、必须显式列文件），并在本批 `impact-sheet.md` §2 对两处逐条写处置（「改」/「改引用」/「标历史保留 + 理由」）；若判「历史保留」，须写明为何这两处属历史而非活口径 | **PARTIALLY（§7 复核）** |
| P3-A | P3 | plan §0「同族」栏把校验器写成 `validateAgentData.mjs:111`，实路径为 `tools/docgen/components/validateAgentData.mjs:111`；缺 `components/` 一层，③ 段按字面搜会找不到 | `Get-ChildItem tools/docgen -Recurse -Filter 'validateAgentData*'` → 唯一命中 `tools/docgen/components/validateAgentData.mjs` | 改为全相对路径 `tools/docgen/components/validateAgentData.mjs:111` | **ADDRESSED（§7 复核）** |
| P3-B | P3 | R8 证据的落点与回扫脚本的搜索根不一致：`findImpactSheet` 只扫 `.session/reviews/` 与 `docs/superpowers/reviews/`，而 S-D 的既有做法是迁到 `docs/reports/<主题>-evidence/`（本批 T0 刚照做）。若 S-E 收口后照此迁，则本批 `impact-sheet.md` 对 `scope-sweep --check` **不可见**，复核只能人工读 | `scripts/scope-sweep.mjs:80-95`；plan §3 末行与 plan 第 30 行 T0 | 收口时二选一：① 迁 `docs/superpowers/reviews/2026-11-04-s-e/`（脚本认该根）；② 保留在 `docs/reports/2026-11-04-s-e-quality-evidence/` 但须在 `gate-record.md` 的 ⑤ 行写明「不在脚本搜索根内，故 ④ 段复核靠人工读该件」。选哪条都写进 plan §3 末行 | **OPEN（§7 复核）** |
| P3-C | P3 | plan §2 T5 写「五段门行 **5 条**」，同一括号里却列 **6** 个 ID（`①@S-E` / `②@S-E` / `②→③@S-E` / `③@S-E` / `④@S-E` / `⑤@S-E`）；plan §2.1 T5 同样列 6 个 | plan 第 35 行与第 66 行原文 | 改为「6 条（五段 + 计划门）」，与 `gate-record.md` 的既有行数指认一致；`check-gate-record.mjs` 只数行数不查这一句，故只能靠文案自查 | **PARTIALLY（§7 复核）** |

**本席未裁决的技术分歧**：`十年` 该不该进词面、B04 该断在渲染层还是盘上文件层、`I34` 的 `scope` 具体取哪些文件——归申报方与 ③ 段，本席只给「可核性」层面的解法。

**本席产物自修记录（留痕，不算对方问题）**：本件首稿在首行声明里把路径写成裸文件名 `cli.mjs`（并紧跟行号；仓内有两个同名 `cli.mjs`）→ 行号归位守卫判「命中 2 处、不敢判」，`managing-lessons-store` 技能的测试文件红 1 条（`docs\reports\2026-11-04-s-e-plan-gate.md → cli.mjs（命中 2 处）`）。已自修为全相对路径（`tools/docgen/` 下同名的那一个 + 行号）；复跑该技能测试 → `[行号守卫] 校对 1087 处、锚定 3 处；跳过 1 份记录型文件；结构替换豁免 43 处`、exit 0。**这条不记入对方问题表**，但按「证据复算核对」必须留痕：本席产物自身也要过全仓门禁。

**无问题时显式声明**：`findings` 集合**非空**（7 条），故本条不适用「全过、无问题」；§0 七项核对中 6 项成立、第 7 项 `miss`（现盘门禁红，见 P1-A）；§0.1 A 节 6 项中 4 项 `hit`、A2 与 A6 各带 1 条 P1 的处置约束；§0.2 B 节 4 项成立、2 项 `miss`（对应 P2-A / P2-B）。

## 6 结论

**四条核对：成立 4 / 不成立 0。**

**问题计数**：P0 0 / P1 1 / P2 3 / P3 3（共 7 条，见 §5；P1 一条不是本门判据的反例，但它使 ③ 段的 `npm run check` 判据当前恒红）。

- **① 依赖无环 成立**：`node scripts/check-plan.mjs deps --plan docs/superpowers/plans/2026-11-04-s-e-dimension-and-persona-wordface.md` → `deps: cycle 0 dangling 0（nodes 6 / edges 6） => ok`、exit 0（前批记为 P1 的 `nodes 0` 已闭）。
- **② 变更范围在 plan 白名单内 成立**：`git status --porcelain -uall` 5 行逐行落 plan §3 第 12 / 15 / 16 / 17 / 18 行，白名单外真实变更 0；`git cat-file -e HEAD:<path>` 形态（1 M + 4 A）与 §3 声明逐件一致。
- **③ R4 零新增设计决策 成立**：`^## 新增设计决策` 命中 0；3 处具体做法全部指回既有载体（`tools/docgen/test/sc-card-shape.test.mjs:605` / `:649`、`docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md:80`、`tools/docgen/components/validateAgentData.mjs:111`）。
- **④ 旁路两条「不适用（无功能块）」成立**：变更清单内新增 spec 0 / 新增 testcase 0；plan 无功能点 ↔ testcase 映射表 → 两条常轨判据确无对象。

**依据（≥2 条，均带 `path:line`，取自 4 个不同文件）**

1. `docs/prd/20261024073606-dev-workflow-mainline/index.md:328`——「②→③ | 依赖无环；变更范围在 plan 白名单内；另两条写『不适用（无功能块）』」，本席据此四条判。
2. `docs/prd/20261024073606-dev-workflow-mainline/index.md:285`——本段「议会 = 无」，故本门无需议会记录（R3 对旁路批无对象）。
3. `docs/superpowers/plans/2026-11-04-s-e-dimension-and-persona-wordface.md:37-67`——§2.1 六个任务小节与 `Consumes:` 行，是 `nodes 6 / edges 6` 的唯一来源。
4. `docs/superpowers/plans/2026-11-04-s-e-dimension-and-persona-wordface.md:73-93`——§3 白名单 21 行，本席逐行比对变更清单。
5. `docs/reports/2026-11-04-s-e-bypass-audit.md:117`——前批 R1 的原始失败输出（与本席复跑对照，证明 R1 已闭而非假绿）。
6. `scripts/scope-sweep.mjs:21-27` 与 `:80-95`——历史类前缀清单与 `findImpactSheet` 搜索根，是 P2-C / P3-B 的取数来源。

**建议落进 `②→③@S-E` 门行「核了什么」的首行证据句（一行，可直接转录，本席不代填签字）**

`旁路（PRD §4.2 :328）；① 依赖无环 = node scripts/check-plan.mjs deps --plan docs/superpowers/plans/2026-11-04-s-e-dimension-and-persona-wordface.md → deps: cycle 0 dangling 0（nodes 6 / edges 6） => ok（exit 0）；② 变更范围 = git status --porcelain -uall 5 行，逐行落 plan §3 白名单第 12 / 15 / 16 / 17 / 18 行、白名单外真实变更 0，形态 git cat-file -e HEAD:<path> 为 1 M（exit 0）+ 4 A（exit 128）与 §3 声明逐件一致；③ R4 = Select-String -Path <plan> -Pattern '^## 新增设计决策' → 0 命中；④ 另两条「不适用（无功能块）」成立 = 变更清单内新增 spec 0 / 新增 testcase 0、plan 无功能点↔testcase 映射；四条核对成立 4 / 不成立 0；问题 P0 0 / P1 1 / P2 3 / P3 3（P1 = 现盘 npm run check # fail 3，三条全由 gate-record.md 的 ②@S-E 行文本引起，进 ③ 前须由申报人清零）；审计记录 docs/reports/2026-11-04-s-e-plan-gate.md`

**本门「过」的边界**：＝「可进 ③」，不等于 ③ 已施工、不等于 §3 白名单后续不被突破。T1–T5 落地后若出现第 12 / 15 / 16 / 17 / 18 行以外的文件，`③@S-E` 须按 `:328` 第②条重核。

**进 ③ 的硬前置（本门唯一阻断项，见 P1-A）**：现盘 `npm run check` = `# tests 1541 / # fail 3`，三条全由 `gate-record.md` 的 ②@S-E 行文本引起（自引用带技能前缀 + 主观词「严格」）。按 `:329` ③ 段判据要求 `npm run check` 绿，故**申报人须先改该行两处文字并复跑到 `# fail 0`**，再开工 ③；本席不代改（角色卡禁止写 `gate-record.md`）。改完本席可复核：复核命令 = `npm run check` 末行 `check 全部通过`。

**打回清单**：**本门四条判据打回 0 条**（无一条不成立）；**但进 ③ 前有 1 条硬前置**（P1-A，须由申报人清零）。P2 三条不阻断本门，但建议 ③ 段**开工前**同批改 plan 文案（P2-A / P2-B 若不改，③ 段会按字面执行而留下「已签 testcase 与新断言互相矛盾」「红档不可重跑」两处取证漏洞）；P3 三条随批修即可。

## 7 复核轮（2026-11-04）

> **复核对象**：申报方对 §5 七条的返工。**本席只复跑，不采信文字**。首轮正文与 §6 结论不改；状态回填在 §5 末列（见上表），明细在本节。
> **判者标识不变**：`reviewer-audit@agents/reviewer-audit.md（角色卡贴入，独立实例）`，2026-11-04；本席仍未写 `gate-record.md`、plan、测试与数据。

### 7.1 六条主张的处置逐条复跑

| # | 申报方主张的处置 | 本席复跑命令与首行输出 | 状态 |
|---|---|---|---|
| P1-A | ②@S-E 行两处文字：去技能前缀自引用路径、`严格`→`逐字` | `npm run check` → `# tests 1541` / `# fail 0` / `check 全部通过`（exit 0）；`Select-String -Path gate-record.md -Pattern '严格'` → **0 命中**（`逐字` 28 命中）；三条故障用例单独复跑全绿：`✔ OCR-S1-TC-E08 分诊表对账 …`、`✔ TC-E10 自引用带技能名前缀 …`、`✔ TC-C04 全仓检查的前三环在本仓为绿 …` | **ADDRESSED** |
| P2-1（首轮 P2-A） | plan §4 加「T2 必改例外」：S-C testcase `:506` 判据不追 → 已覆盖；`:70` 词面口径改三词面 | plan 第 101 行原文已含「**例外（T2 必改）**：S-C testcase 的 `:506` 原写「不覆盖…判据不追」，**与加严后的 V9 互斥 → 同批改为「已覆盖（词面新增 `十年`）」**；同节 `:70` 的词面口径…改为三词面」——**例外句在位且写了为什么必须改**，不再与「不改清单」自相矛盾。**残留**：第 32 行（§2 任务表 T2）与第 51 行（§2.1 T2）仍写「S-C spec **§11.8 两处**」；实测该 spec 的词面貌只 2 处且分属两节——`:108`（§11.4「人设词面」）与 `:151`（§11.8 V9 行），故「§11.8 两处」的节号归属仍不实 | **PARTIALLY** |
| P2-2（首轮 P2-B） | plan §5 B04 红档补「副本内跑 `node tools/docgen/cli.mjs generate --readme --apply`」 | plan 第 111 行原文已含该步 → 构造链完整：删 `dimension` 键 → 副本内重生成 → README 该格空 → 断言红。**可执行性本席已验**：`coldRepo`（`tools/docgen/test/support/card-fixtures.mjs:36`）把已跟踪 + 未跟踪未忽略文件复制到临时目录、并以 `cwd = copy` 跑 CLI（`runCli(args, copy, …)`），于是 CLI 的 `REPO_ROOT` 指向副本、`--apply` 落在副本的 `docs/agents`，不污染真仓 | **ADDRESSED** |
| P2-3（首轮 P2-C） | 本批 `impact-sheet.md` §2 第 1 行登记两处历史件，处置 = 历史保留不改 | 两处实体确在且含旧句：`docs/superpowers/specs/2026-10-19-docgen-agent-senior-sdet-design.md:64` 含 `十年`（`identity` 逐字转录）、`docs/superpowers/specs/2026-10-21-docgen-replace-intent-change-design-testcase.md:1047` 含 `十年`（`Inject … '有十年以上经验的测试开发工程师（SDET）'`）；二者均在 `docs/superpowers/specs/` 下，而 V9 三面 = `data/seats/**` / `agents/*.md` / `docs/agents/*.md` → **确不在扫描面内**，处置与口径相符。**残留**：该行引的锚「`:128` 覆盖行指向 `:1047`」不实——`:128` 是块结束的 `}`；该 Inject 属 §3.3（节头 `:855`）内、覆盖行为 `:1039` | **PARTIALLY** |
| P3-① | plan T5 由「五段门行 5 条」改「六条段门行（6 个 ID）」 | 第 35 行（§2 任务表 T5）已改「六条段门行（`①@S-E` … `⑤@S-E`）」✓；**第 66 行（§2.1 T5）仍写「五段门行 5 条」+ 6 个 ID**、**第 84 行（§3 第 12 行）仍写「M（T0 兑付 + 5 条门行）」** | **PARTIALLY** |
| P3-② | plan §0 校验器路径补全 | 第 12 行现为 `tools/docgen/components/validateAgentData.mjs:111`（`BASE_KEYS` 已含 `dimension`，实测该文件在该路径存在且该行确为 `BASE_KEYS` 定义） | **ADDRESSED** |
| P3-B（未被要求处置，本席补记） | —（申报方未处置，但 `impact-sheet.md` 已写「收口时整单迁 `docs/reports/2026-11-04-s-e-evidence/`」） | `findImpactSheet` 的两根 = `.session/reviews/` 与 `docs/superpowers/reviews/`；`docs/reports/…-evidence/` **不在其中** → 若按该计划迁，本批证据对 `scope-sweep --check` 不可见（复核只能人工读） | **OPEN** |

### 7.2 返工是否引入新红（四道自查 + 全仓门禁）

| 命令 | 首行输出（本席实跑） | 结论 |
|---|---|---|
| `node scripts/check-plan.mjs deps --plan docs/superpowers/plans/2026-11-04-s-e-dimension-and-persona-wordface.md` | `deps: cycle 0 dangling 0（nodes 6 / edges 6） => ok`（exit 0） | 与首轮同值，返工未动任务小节 |
| `node scripts/scope-sweep.mjs --check` | `counts {"I1":13,…,"I33":0}` + `sweep ok（命中未超基线、清单齐、scope 齐）`（exit 0） | 绿；**注意 `counts` 内仍无 `I34`** → T4（加 `I34` 并 `--freeze`）尚未开工，属 ③ 段范围，本门不作判 |
| `node scripts/check-gate-record.mjs` | `rows 81 bad 0` + `gate-record ok（R1/R2/R6 全过；splitting 0）`（exit 0） | 绿；本席另实测 S-E 段现有 **2 行**（`①@S-E` 在 `:118`、`②@S-E` 在 `:119`），`②→③@S-E` **尚未落行**（待本门签字后由申报人转录） |
| `node scripts/check-observable.mjs --check` | `check-observable ok`（exit 0；门禁段另报「扫描 107 个 .md / 未豁免命中 0 行 / 已豁免 6 行 / stale 0 条」） | 绿 |
| `npm run check` | `# tests 1541` / `# fail 0` / `④ markdown 检查通过（423 个文件 / 1835 张表）` / 末行 `check 全部通过`（exit 0）。**补注**：本节追加后复跑同命令 → `423 个文件 / 1839 张表`（+4 = 本节 4 张表），`# fail 0` / `check 全部通过` 不变 | 绿（首轮 `# fail 3` → 现 `# fail 0`） |

### 7.3 变更清单与 plan §3 白名单再比（逐行，非抽样）

`git status --porcelain -uall` → **6 行**（较首轮 +1：本件）：

| # | 变更件 | 形态 | plan §3 行 | 判定 |
|---|---|---|---|---|
| 1 | `gate-record.md` | M（`git cat-file -e HEAD:<path>` → exit 0） | 第 12 行（M） | 白名单内 |
| 2 | `docs/reports/2026-11-04-s-d-evidence/README.md` | A（exit 128） | 第 15 行（A） | 白名单内 |
| 3 | `docs/reports/2026-11-04-s-d-evidence/impact-sheet.md` | A（exit 128） | 第 16 行（A） | 白名单内 |
| 4 | `docs/reports/2026-11-04-s-e-bypass-audit.md` | A（exit 128） | 第 18 行（A） | 白名单内 |
| 5 | `docs/reports/2026-11-04-s-e-plan-gate.md`（**本件**） | A（exit 128） | **第 19 行（A）** | 白名单内（**已被覆盖**，不需补行） |
| 6 | `docs/superpowers/plans/2026-11-04-s-e-dimension-and-persona-wordface.md` | A（exit 128） | 第 17 行（A） | 白名单内 |

- **白名单外真实变更 = 0**。
- 本批 `impact-sheet.md`（`.session/reviews/2026-11-04-s-e/impact-sheet.md`）不在 `git status` 里：`git check-ignore -v` → `.gitignore:12:.session/`（exit 0），即**被忽略、不计入变更清单**，与 plan §3 末行的排除声明一致。
- 形态与 §3 声明逐件相符（1 M + 5 A），无「声明 M 实为 A」的不一致。

### 7.4 复核轮新抓到的残留（均 P3，不阻断放行）

| # | 级别 | 残留 | 证据 | 建议解法 |
|---|---|---|---|---|
| R1 | P3 | `②@S-E` 行的「核了什么」仍是**落行当时快照**（「变更清单 = `git status --porcelain -uall` **4 行**」、只列第 12 / 15 / 16 / 17 行），与本席复核时的 **6 行**（+第 18 / 19 行两件审计记录）不符 | `gate-record.md:119` 原文；本席 `git status` 6 行（§7.3） | `②→③@S-E` 行「核了什么」写明「本门复核时变更 6 行（较 `②@S-E` 快照 +2：第 18 / 19 行两件审计记录，均已在 §3 登记）」；或回填 `②@S-E` 行 |
| R2 | P3 | 本批 `impact-sheet.md` 内部数字自相矛盾：§0 第 18 行写「改前现盘**1 处**命中（`tools/docgen/data/seats/senior-sdet.json:143`）」，§2 第 1 行写「改前现盘三面合计 **2**」 | 该件 `:18` 与 `:63` 原文 | 把 §0 第 18 行改为「三面合计 2（data 1 + `docs/agents` 投影 1）」；§0 第 13 行的校验器路径同批补全为 `tools/docgen/components/validateAgentData.mjs:111` |
| R3 | P3 | P2-3 登记行引的锚不实（见 §7.1 该行「残留」）：`:128` 是 `}`，正确锚为 §3.3 节头 `:855` 或覆盖行 `:1039` | `docs/superpowers/specs/2026-10-21-docgen-replace-intent-change-design-testcase.md:128` = `}`；`:1047` 为该 Inject 行 | 登记行把「`:128` 覆盖行」改成「§3.3（`:855`）覆盖行 `:1039`」，只改锚不改「历史保留」结论 |

### 7.5 复核轮结论

**六条状态**：`ADDRESSED` 3（P1-A / P2-2 / P3-②）、`PARTIALLY` 3（P2-1 / P2-3 / P3-①）、另 `OPEN` 1（P3-B，未被要求处置，本席补记）。

**可否放行 ③：可以放行。** 依据：① 首轮唯一阻断项 P1-A 已闭——`npm run check` 由 `# fail 3` 转 `# fail 0` / 末行 `check 全部通过`，三条故障用例逐个复绿；② 四条判据（依赖无环 / 白名单内 / R4 零新增设计决策 / 两条「不适用」）返工后**仍成立 4 / 不成立 0**，`deps` 与首轮同值；③ 四道自查命令全绿，返工未引入新红；④ 白名单外变更仍为 0，本件（plan-gate）已被 §3 第 19 行覆盖。
**放行的附带条件（不阻断）**：3 条 `PARTIALLY` 的残留（P2-1 的「§11.8 两处」节号、P2-3 的 `:128` 锚、P3-① 的 §2.1 / §3 两处「5 条」）+ 本节 R1–R3 三条 P3，建议由申报方在**开工 ③ 前同批**改文案；它们不影响判据真伪，但会让 ③ 段按字面执行时留下「锚不准 / 计数不一致」的可核性缺口。`P3-B`（R8 证据落点不在脚本搜索根内）留在 ⑤ 段处置。

**建议落进 `②→③@S-E` 门行「核了什么」的一行证据句（复核轮版，可直接转录；本席不代填签字）**

`旁路（PRD §4.2 :328）；复核轮（2026-11-04，首轮 P1-A 已闭）——① 依赖无环 = node scripts/check-plan.mjs deps --plan docs/superpowers/plans/2026-11-04-s-e-dimension-and-persona-wordface.md → deps: cycle 0 dangling 0（nodes 6 / edges 6） => ok（exit 0）；② 变更范围 = git status --porcelain -uall 6 行，逐行落 plan §3 白名单第 12 / 15 / 16 / 17 / 18 / 19 行、白名单外真实变更 0，形态 git cat-file -e HEAD:<path> 为 1 M（exit 0）+ 5 A（exit 128）与 §3 声明逐件一致；③ R4 = plan 内 '^## 新增设计决策' 0 命中；④ 另两条「不适用（无功能块）」成立 = 新增 spec 0 / 新增 testcase 0；返工未引入新红 = node scripts/scope-sweep.mjs --check → sweep ok、node scripts/check-gate-record.mjs → rows 81 bad 0、node scripts/check-observable.mjs --check → check-observable ok、npm run check → # tests 1541 / # fail 0 / 末行 check 全部通过；四条核对成立 4 / 不成立 0；状态 ADDRESSED 3 / PARTIALLY 3 / OPEN 1（P3 级，均不阻断）；审计记录 docs/reports/2026-11-04-s-e-plan-gate.md（§7）`
