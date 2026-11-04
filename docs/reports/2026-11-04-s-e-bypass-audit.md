# S-E 旁路审计：PRD §4.2 两条判据逐条取证（2026-11-04）

> **判者标识** = `reviewer-audit@agents/reviewer-audit.md（角色卡贴入，独立实例）`，2026-11-04；本席未参与 S-E 的范围起草 / plan 撰写 / 施工，未参与 S-D 任何段落的申报。
> **声明**（角色卡「边界 / 禁止 2」要求）：本件是上级指派的**唯一**写入产物；本席未写 `skills/dev-workflow/references/gate-record.md`、未写 plan、未改任何测试或数据文件（门行签字原文由申报人转录，本席只核转录逐字一致）。
> **审计对象**：S-E 批（`dimension` 补齐 + G1 人设句堵漏 + S-D 残余 ③ 迁账）能否走 PRD §4.2 旁路。判据原文 = `docs/prd/20261024073606-dev-workflow-mainline/index.md` 第 319 行（判据一）、第 320 行（判据二）、第 326 至 331 行（替换表，其中「既有回归 testcase 全过（不新增用例）」在第 330 行）、第 333 行（签字与证据）、第 335 行（谁判）。
> **口径**：只认命令退出码与计数；每条结论后附本席自跑命令的可复算输出。英文术语首现行附中文解释。**本件为「旁路判据」取证，不裁决技术分歧**（如 `SC-TC-29` 词面该加哪些词、B04 断言该写在哪层）。

## 0 核对项与证据速览

| # | 核对项 | 结果 | 证据（本席自跑） |
|---|---|---|---|
| 1 | 判据一：F 集合差集为空 | hit（成立） | `git diff -U0 -- <两份 PRD>` 输出 0 行、exit 0；两侧计数 48 行 / 24 个 ID 与 0 行 / 0 个 ID，工作树与 HEAD 双向差集 0 / 0（§1） |
| 2 | 判据二：变更清单 ⊆ plan §3 白名单 | hit（成立） | `git status --porcelain -uall` = 4 行，逐行落在 §3 第 12 / 15 / 16 / 17 行；白名单外真实变更 **0**（§2.1） |
| 3 | 判据二：新增 spec = 0 | hit（成立） | 4 行变更中 spec 类文件 **0** 件；`docs/superpowers/specs/**` 当前 `git status` 0 行（§2.3） |
| 4 | 判据二：新增 testcase = 0 | hit（成立） | 4 行变更中 testcase 类文件 **0** 件；两份 testcase 均未进变更清单（§2.3） |
| 5 | 判据二：新增载体（规则 / 技能 / 角色卡 / 新脚本）= 0 | hit（成立） | `rules/` 0 件、`agents/` 0 件、`skills/` 0 件、`scripts/` 0 件；3 件 A 全为 `docs/reports/` 与 `docs/superpowers/plans/` 下纯流程文档（§2.3） |
| 6 | 判据二：3 件 A（新增文件）在 §4.2 第 320 行括号口径下的归类 | hit（按括号口径成立，reason 见 §4 R5） | 第 320 行括号只把「改既有文件的错字 / 措辞 / 注释 / 依赖升级」列入允许，并点名「新增脚本 / 新增规则 / 新增角色卡都不算」；三件 A 非此三类，且非 spec / testcase / 载体（§2.3） |
| 7 | 判据二：迁账件是否「同内容换路径」（可独立复算性） | na（reason：源目录已删且被 `.gitignore` 覆盖，无独立基线可比） | `.session/reviews/2026-11-04-s-d/` → `Test-Path` False；现行 `impact-sheet.md` 的 `git hash-object` = `c9740b50…`，与 plan §7 T0 记录值逐字相等（记录一致、独立性受限，见 §4 R6） |
| 8 | ②→③ 计划门前置：依赖无环有没有机械证据 | miss（reason：脚本对本 plan 判 `nodes 0 / edges 0` → fail，见 §4 R1） | `node scripts/check-plan.mjs deps --plan docs/superpowers/plans/2026-11-04-s-e-dimension-and-persona-wordface.md` → `deps: cycle 0 dangling 0（nodes 0 / edges 0） => fail`、exit 1（§4 R1） |
| 9 | 审计时点全仓门禁实况（不作 ①② 判据，只记基线） | hit（实跑记录） | `npm run check` → `# tests 1541 / # pass 1534 / # fail 0 / # skipped 7`、`baseline 38/38`、`④ markdown 检查通过（421 个文件 / 1820 张表）`、`[observable] 扫描 107 个 .md / 未豁免命中 0 行 / 已豁免 6 行 / stale 0 条`、末行 `check 全部通过`（exit 0） |

**缺答判据**：本表 9 行逐行有「结果」与「证据」，无空行；`miss` 1 行、`na` 1 行，各带 reason。

## 1 ① 旁路判据一：F 集合差集

**命令（仓根 PowerShell 5，2026-11-04）**

```powershell
git log --oneline -1
git status --porcelain -uall
git diff -U0 -- docs/prd/20261024073606-dev-workflow-mainline/index.md docs/prd/20261102212627-card-data-contract-and-proof/index.md
Select-String -Path docs/prd/20261024073606-dev-workflow-mainline/index.md -Pattern '^\| F-\d+'
Select-String -Path docs/prd/20261102212627-card-data-contract-and-proof/index.md -Pattern '^\| F-\d+'
```

**实际输出（首行 / 计数）**

- `git log --oneline -1` → `a495656 docs(handoff): 基线数字校正 + HEAD 取法说明 + 一条未复现红的留观`
- `git status --porcelain -uall` → **4 行**：`M skills/dev-workflow/references/gate-record.md`、`?? docs/reports/2026-11-04-s-d-evidence/README.md`、`?? docs/reports/2026-11-04-s-d-evidence/impact-sheet.md`、`?? docs/superpowers/plans/2026-11-04-s-e-dimension-and-persona-wordface.md`——**无一行落在 `docs/prd/`**
- `git diff -U0 -- <两份 PRD>` → 输出 **0 行**、`diff_exit=0`（`-U0` = 不输出上下文行，故空输出即「无改动」）
- 第一份 PRD 的 `^\| F-\d+` → **48 行 / 去重 24 个 ID**（`F-01`…`F-24`；48 = §10 表 24 行 + 路线图表 24 行，同一 ID 在两表各出现一次）
- 第二份 PRD 的 `^\| F-\d+` → **0 行 / 0 个 ID**（该 PRD 无 §10、无 F 编号，换载体登记见 `skills/dev-workflow/references/gate-record.md`）

**两侧计数与差集**

| 侧 | 文件 | F 行数 | F 唯一 ID 数 | 与 HEAD 版本差集 |
|---|---|---|---|---|
| 左 | `docs/prd/20261024073606-dev-workflow-mainline/index.md` | 48 | 24 | 新增 0 / 消失 0 |
| 右 | `docs/prd/20261102212627-card-data-contract-and-proof/index.md` | 0 | 0 | 新增 0 / 消失 0 |

**结论（判据一）**：**成立**。两份 PRD 的 `git diff -U0` 输出为空（exit 0），工作树 `F` 集合与 HEAD 版本双向差集为 `0 / 0`；集合未变，符合第 319 行「功能点集合不变」。

## 2 ② 旁路判据二：不新增交付物

**判据文本**（`docs/prd/20261024073606-dev-workflow-mainline/index.md` 第 320 行）：不新增 spec / testcase / 载体文件；改既有文件的错字、措辞、注释、依赖升级属允许列；**新增脚本、新增规则、新增角色卡都不算**（即三者出现即违规）。

### 2.1 变更清单 vs plan §3 白名单（逐行比，非抽样）

plan §3 白名单共 **21 行**（第 1 至 14 行形态 M、第 15 至 21 行形态 A；第 20 行是一条展开为 4 件的目录行，故最终展开件数 = 24）。当前工作树实际变更 **4 行**，逐行比对如下：

| # | 路径 | 状态 | `git cat-file -e HEAD:<path>` | 对应 plan §3 行 | 判定 |
|---|---|---|---|---|---|
| 1 | `skills/dev-workflow/references/gate-record.md` | M | exit 0（HEAD 存在） | 第 12 行（M） | 白名单内 |
| 2 | `docs/reports/2026-11-04-s-d-evidence/README.md` | A | exit 128（HEAD 无此件） | 第 15 行（A） | 白名单内 |
| 3 | `docs/reports/2026-11-04-s-d-evidence/impact-sheet.md` | A | exit 128（HEAD 无此件） | 第 16 行（A） | 白名单内 |
| 4 | `docs/superpowers/plans/2026-11-04-s-e-dimension-and-persona-wordface.md` | A | exit 128（HEAD 无此件） | 第 17 行（A） | 白名单内 |

- **白名单外真实变更 = 0**。白名单其余 17 行（第 1 至 11、13、14 行与第 18 至 21 行）属 T1–T5 施工产出，当前**尚未开工**（plan §7 执行记录：T0 完成、T1–T5 未开工），故此刻不存在对应变更——这不是漏项，是批次尚在 ① 段。
- 本件 `docs/reports/2026-11-04-s-e-bypass-audit.md` 已在白名单第 18 行登记（S-D 批曾被记为「白名单外 1 件」，本批已提前登记，该缺口不再复现）。
- 当前变更行数 = 4，全部来自 T0（迁账）与 plan 建档；**gate-record 的改动实测量 = 1 行**（`git diff --stat` → `1 file changed, 1 insertion(+), 1 deletion(-)`），内容为 `⑤@S-D` 行尾的兑付登记。

### 2.2 按变更类型计数

| 类型 | 件数 | 构成 |
|---|---|---|
| A（新增文件） | 3 | 1 件 plan + 2 件证据迁账（映射 README + `impact-sheet.md`） |
| M（改既有） | 1 | `skills/dev-workflow/references/gate-record.md` |
| D（删除） | 0 | —— |
| **新增 spec** | **0** | 变更清单内 `docs/superpowers/specs/**` 0 件 |
| **新增 testcase** | **0** | 变更清单内 `*-testcase.md` 0 件；plan §3 第 6 / 7 行两份 testcase 均标 M |
| **新增载体（规则 / 技能 / 角色卡 / 新脚本）** | **0** | `rules/` 0 件、`agents/` 0 件、`skills/` 0 件、`scripts/` 0 件 |

### 2.3 结论（判据二）

**成立**。白名单 21 行（展开 24 件）内，当前 4 件变更全部在白名单内、白名单外 0；新增 spec **0**、新增 testcase **0**、新增载体（规则 / 技能 / 角色卡 / 新脚本）**0**。三件 A 全部为「纯流程文档」（plan / 审计记录 / 证据迁账映射），不属第 320 行点名的三类；该归类的严格读法风险见 §4 R5。

**判据二的效力边界（本席必须写明）**：此刻 T1–T5 未开工，判据二只对「**已发生的变更**」与「**plan 声明的白名单**」成立；T1–T5 落地后若出现白名单外文件，②→③ 计划门（第 328 行「变更范围在 plan 白名单内」）与 ③ 段审计须重新核一遍。本件不能为未开工的施工背书。

## 3 本席的独立判断：改既有判据算不算「新增交付物 / 新增用例」

**待判对象**（plans §2 任务表 T2 / T3）：
- T2：`tools/docgen/test/sc-card-shape.test.mjs` 的 `SC-TC-29` / `SC-TC-31` 词面数组加 `十年`，并同步 `docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md` §11.8 与其 testcase 对应行。
- T3：`tools/docgen/test/card-render.test.mjs` 的 `S4-TC-B04` 块内加「README 维度列 15 格非空」断言，并同步 S4 testcase 的 B04 行。

**判定（两问分开答，不合并）**

| 问 | 判定 | 依据（本席自跑计数） |
|---|---|---|
| 构成「新增交付物」（判据二，第 320 行） | **不构成** | 涉及的两份 spec / 两份 testcase / 两个测试文件**均已在 HEAD 内**（`git cat-file -e HEAD:<path>` → exit 0），属「改既有文件的措辞与判据口径」，落第 320 行括号的允许列；无新文件产生 |
| 构成「新增用例」（第 330 行「既有回归 testcase 全过（不新增用例）」） | **不构成**（按条数口径） | ① 全仓用例块基线 `git grep -c -E "^\s*test\(" HEAD -- "*.test.mjs"` → **1520 块 / 70 文件**；② `tools/docgen/test/sc-card-shape.test.mjs` → `test(` 块 **60**（与 S-D 段 ④ 记录的 `# tests 60` 一致）、`tools/docgen/test/card-render.test.mjs` → `test(` 块 **61**；③ testcase 侧用例行数 `^\| SC-TC-\d+` → **60 行**、`^\| S4-TC-[A-Z]\d+` → **122 行**；④ 两处改动形态经本席读码确认：`SC-TC-29` 改的是**既有数组内的一个元素**（`const words = ['资深', '20 年']`，`tools/docgen/test/sc-card-shape.test.mjs` 第 605 行）、`SC-TC-31` 改的是**既有 `for` 循环的字面量数组**（同文件第 649 行）、`S4-TC-B04` 改的是**既有 `test` 块体内的断言**（`tools/docgen/test/card-render.test.mjs` 第 619 行起）。三者都不新增 `test()` 块、不新增 testcase 表行 |

**判定的实质内容（本席不回避）**：上述两处**确实是「判据加严」**——词面清单多一个词、B04 多一条「每格非空」的验收点。按本仓口径，判据加严**不是**旁路的禁止项（旁路只禁「新增交付物」），但必须满足两条前置，缺一即本席改判：

1. **R8 回扫登记在位**：改判据级口径须在当批 `impact-sheet.md` 逐条给出处置，且 `node scripts/scope-sweep.mjs --check` exit 0。plan 任务表 T4 已写「`tools/scope-sweep/keywords.json` 加 `I34`（V9 人设词面旧写法）→ `--freeze` → `--check`」，**前置在位**（本席未预跑，归 ③ 段判）。
2. **新增断言的 spec 锚点在位**：B04 的覆盖列现只写 §3 的 `:54`（index 五列）与 `F-10`（`docs/superpowers/specs/2026-10-29-agent-card-s4-render-design-testcase.md` 第 279 行），而「维度列非空」的最近 spec 锚点是同目录 spec 的结构行（`seatEntry = { name, role, dimension, outputKind, tools, card }`，`docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md` 第 80 行）。T3 须在 testcase 该行补上这个锚点，否则覆盖列指不回 spec 节号（`spec-testcase-gate` 判据 3 的前置）。**这一条现未在 plan 里写明** → 见 §4 R4。

**在 ④ 段如何被复核（若本席判成立，复核口径必须被写死）**：④ 段（第 330 行「既有回归 testcase 全过（不新增用例）」）按 S-D 已跑通的两向自证复核本批：① `# tests` 前后相等（基线 1541，含 `# skipped 7`）；② 用例块数前后相等（相对 HEAD 的 1520 块 / 70 文件，逐文件求和）；③ 新增行中以 `^\s*test\(` 起头的行 = 0（逐 hunk 阅过）；④ 两份 testcase 的用例行数仍为 60 / 122。四条同时成立，才认「不新增用例」。

**认输判据（本席改判条件）**：若申报方给出下列任一可核证据，本席改判为「构成新增用例 / 必须回流 spec 重审」：① T2 / T3 之后的 `test(` 块数 > 基线（任一文件）；② 新增行中出现新的 `test(` 起头块；③ 两份 testcase 用例行数增加；④ S4 spec 全文对 `dimension` 只作可选、无必填语义的原文（则为「新增需求」，按 R4「plan 阶段发现 spec 未定义 → 必须回流 spec 重审」处理，本批须走完整主干 + 议会 #2）。

## 4 本席抓到的真问题

共 **7 条**：P1 1 条、P2 3 条、P3 3 条。每条带触发点与建议解法（角色卡「禁止 1」要求不得只提问题不给解法）。

| # | 级别 | 问题 | 证据 | 建议解法 | 谁兜 |
|---|---|---|---|---|---|
| R1 | P1 | ②→③ 计划门的「依赖无环」对本 plan **无机械证据**：任务表写成 Markdown 表格，`check-plan deps` 只认 `^##/### T<n>` 节标题 + 节内 `Consumes:` 行 → `nodes 0` 直接 fail。与 S-D 批同一坑（S-D 首跑同样 `edges 0`） | `node scripts/check-plan.mjs deps --plan docs/superpowers/plans/2026-11-04-s-e-dimension-and-persona-wordface.md` → `deps: cycle 0 dangling 0（nodes 0 / edges 0） => fail`、exit 1 | 在 plan §2 之外补 6 个任务小节（`### T0` … `### T5`），每个节内写一行 `Consumes: Task n`（T0 写 `Consumes: 无`）；改后复跑须 `edges ≥ 5`、`cycle 0`、exit 0 | 申报方（主 agent） |
| R2 | P2 | plan §0「联动四问·副作用」写「改前现盘命中 **1**（`senior-sdet.json:143`）」，但 `SC-TC-29` / `31` 的判据是**三面求和**；三面实测 `十年` = **2**（data 1 + `docs/agents` 投影 1），不是 1 | 本席实跑：`Select-String -Path tools/docgen/data/seats/*.json,agents/*.md,docs/agents/*.md -Pattern '十年'` → 2 命中（`tools/docgen/data/seats/senior-sdet.json` 第 143 行、`docs/agents/senior-sdet.md` 第 9 行）；`资深` = 0 / 0 / 0、`20 年` = 0 / 0 / 0 | plan §0 该格改为「三面合计 **2**（data 1 + docs/agents 投影 1）；改文案并重生成后归 0」 | 申报方（主 agent） |
| R3 | P2 | plan §5「B04 每格非空」绿档写「**现盘 15/15 非空**」，实况是 **14/15**——`senior-sdet` 是唯一缺 `dimension` 键的一席（正是本批 T1 要补的那一席） | 本席实跑：逐件读 `tools/docgen/data/seats/*.json` → `files=15 hasKey=14 emptyOrMissing=1`（`senior-sdet.json` 无该键）；`docs/agents/README.md` 该席行第三格为空 | plan §5 改为「T1 前 14/15（`senior-sdet` 缺键）→ T1 后 15/15 → 断言绿」；红档构造须写明「副本删 `dimension` 键」是相对 T1 后状态 | 申报方（主 agent） |
| R4 | P2 | plan §3 白名单只列 S-C spec（第 5 行），**未列 S4 spec**；而 plan §4 不改清单却写「S-C / S4 两份 spec 的结论句与数字（只许给 §11.8 词面与 B04 预期加词面…）」——两节对「要不要动 S4 spec」自相矛盾。同时 T3 新增的「维度列非空」断言在 S4 spec 中无明文判据，B04 覆盖列也未给锚点 | `Select-String` plan §3 → 21 行内无 `2026-10-29-agent-card-s4-render-design.md`；`docs/superpowers/specs/2026-10-29-agent-card-s4-render-design-testcase.md` 第 279 行覆盖列 = §3 的 `:54` + `F-10`；S4 spec 第 54 行只定义 README 五列结构 | 二选一，写进 plan 让 ②→③ 能判：① 只改 testcase 的覆盖列，补锚到 S4 spec 第 80 行的 `seatEntry`（白名单第 7 行已允许）；② 要动 S4 spec 正文就在 §3 补一行（并说明它属既有 F-10 覆盖范围）。两者都不做 = 覆盖列指不回 spec | 申报方（主 agent）+ ②→③ 计划门审计 |
| R5 | P3 | 三件 A（plan / 本件审计记录 / 证据迁账 2 件）在**严格读法**下可被判「新增文件 = 新增交付物」；第 320 行括号只把「新增脚本 / 新增规则 / 新增角色卡」点名为不算 | 本件 §2.1、§2.2；PRD 第 320 行原文 | ② 门行「核了什么」写明分类依据：三件 A 均非 spec / testcase / 载体，且第 320 行点名的三类实测 0；不得只写「不新增」不给依据 | 申报方 + ② 门签字审计 |
| R6 | P3 | 迁账件的「同内容换路径」**无法被本席独立复算**：源目录 `.session/reviews/2026-11-04-s-d/` 已被删且被 `.gitignore` 覆盖，无独立基线 | 源目录 `Test-Path` False；现行文件 `git hash-object` = `c9740b500df9db93d5310f08794afbfbabe85045`，与 plan §7 T0 记录值逐字相等 | ④ / ⑤ 段复核时不得只引「相等」；须引「与 plan §7 所记 hash 逐字相等 + 源已删」两件事实并列，并注明独立性受限 | ④ / ⑤ 段 |
| R7 | P3 | T0 在**已终签**的 `⑤@S-D` 行内追加了一句兑付登记，超出该行残余 ③ 自定的「只改路径字符串不改结论」；虽属残余闭合，仍是对已签历史行文本的改动 | `git diff --stat -- skills/dev-workflow/references/gate-record.md` → `1 file changed, 1 insertion(+), 1 deletion(-)`；差异只有 `⑤@S-D` 行尾的「（2026-11-04 S-E T0 已兑付：…）」一句 | 不必回滚：在 ⑤ 段「已知偏离」栏登记这一处，并写明「只追加兑付指针、未改任何结论句与勾选」；下次同类动作前先请用户确认 | ⑤ 段申报方 |

**本席未裁决技术分歧**：`SC-TC-29` / `31` 词面该不该加 `十年`、B04 该断在 code 层还是 testcase 层、`I34` 该怎么写——均归申报方与 ③ 段，本席只记过程标准核对结论。

**无问题时显式声明**：`findings` 集合**非空**（7 条），故本条不适用「全过、无问题」；§0 九项中除第 7 项（`na`）、第 8 项（`miss`）外的 7 项均成立。

## 5 结论

**旁路两条判据：成立 2 / 不成立 0。**

- **判据一（F 集合不变）成立**：两份 PRD 的 `git diff -U0` 输出 0 行、exit 0；两侧 48 行 / 24 个 ID 与 0 行 / 0 个 ID。
- **判据二（不新增交付物）成立**：变更清单 4 件全部落在 plan §3 白名单，白名单外 0；新增 spec 0 / testcase 0 / 载体 0。
- **本席的独立判断**：T2 / T3 的「既有判据内加严」**不构成**新增交付物，**也不构成**新增用例（用例块基线 1520 / 70 文件、两文件 60 / 61、testcase 行 60 / 122 均不变）；但它是判据加严，须以 R8 登记（plan T4 已在位）与覆盖列补锚（§4 R4）为前置。

**依据（≥2 条，均带 `path:line`，取自 4 个不同文件）**

1. `docs/prd/20261024073606-dev-workflow-mainline/index.md:319`——「功能点集合不变：§10 的 `F-xx` 集合 diff 为空」；本席实测两侧 48 / 24 与 0 / 0、双向差集 0 / 0。
2. `docs/prd/20261024073606-dev-workflow-mainline/index.md:320`——「不新增 spec / testcase / 载体文件」，并点名「新增脚本 / 新增规则 / 新增角色卡都不算」；本席实测三类均为 0。
3. `docs/prd/20261024073606-dev-workflow-mainline/index.md:330`——④ 段旁路判据「既有回归 testcase 全过（不新增用例）」；本席以用例块计数（1520 / 60 / 61）与 testcase 行数（60 / 122）给出「条数不变」的机械依据。
4. `docs/superpowers/plans/2026-11-04-s-e-dimension-and-persona-wordface.md:39` 起（§3 白名单 21 行表头区）至第 61 行止——白名单 21 行；本席以 `git status --porcelain -uall` 4 行逐行比到第 12 / 15 / 16 / 17 行，白名单外 0。
5. `skills/dev-workflow/references/gate-record.md:108` 与 `:109`（`①@S-D` / `②@S-D` 两行）——本仓此前唯一一次旁路实跑，本件的「核了什么」写法与它同口径（F 集合差集结论 + 变更清单两样齐）。

**建议落进 `①@S-E` / `②@S-E` 门行的「核了什么」首行证据句（可直接转录，一行）**

`旁路（PRD §4.2 第 319 / 320 / 333 行）；F 集合差集 = 空（git diff -U0 -- docs/prd/20261024073606-dev-workflow-mainline/index.md docs/prd/20261102212627-card-data-contract-and-proof/index.md → 输出 0 行、exit 0；两侧计数 = 48 行 / 24 个唯一 ID（F-01…F-24）与 0 行 / 0 个 ID；双向差集 0 / 0）；变更清单 = git status --porcelain -uall 4 行逐行落 plan §3 白名单第 12 / 15 / 16 / 17 行、白名单外 0；新增 spec 0 / 新增 testcase 0 / 新增载体（规则 / 技能 / 角色卡 / 新脚本）0；审计记录 docs/reports/2026-11-04-s-e-bypass-audit.md`

**本件对后续段的约束（必须被下游读到）**

- 本件只为 ① / ② 段取证；T1–T5 落地后若出现白名单外文件，②→③ 计划门与 ③ 段须重核（§2.3 效力边界）。
- §4 R1（`check-plan deps` exit 1）**会在 ②→③ 计划门当场变红**，须先补任务小节 + `Consumes:` 行再送计划门。
- §4 R2 / R3 是 plan 内的数字不实，不改不影响旁路成立，但会在 ③ / ④ 段的「数字签字项齐」处被复算抓出，建议同批改。
