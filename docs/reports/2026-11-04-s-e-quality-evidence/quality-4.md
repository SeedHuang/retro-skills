# ④ 段质量结论 · S-E 批（旁路批）

> 判者 = 独立 `senior-sdet` 实例（`agents/senior-sdet.md` 角色卡贴入）｜判日 = 2026-11-04｜判据正本 = `docs/prd/20261024073606-dev-workflow-mainline/index.md`:330（旁路 ④ = 「既有回归 testcase 全过（不新增用例）」）
> 输入空间：基线提交 `a495656`（`git log --oneline -1 a495656` → `a495656 docs(handoff): 基线数字校正 + HEAD 取法说明 + 一条未复现红的留观`）；HEAD = `a0d56c0`。
> 只认命令退出码与计数；注入只做在 `%TEMP%` 全仓副本内，真仓不改。

## §1 判者与独立性声明

- **判者**：独立 sdet 实例，未参与本批 ① / ② 申报、未参与 plan 撰写、未参与 ③ 段施工、未参与 ③ 段审计。独立性只在这一件事上：**本段每一条结论都由本实例本人实跑，不抄 plan §7 / ③ 段审计记录里的数**（两处数字我均独立复算，结果与它们一致，见 §5 的注释）。
- **只读 + 副本注入**：真仓我只读；三处红档都在 `%TEMP%` 全仓副本里构造，三个副本各跑完即删（`Test-Path` 全 `False`，见 §4）。**未改**门账 `gate-record.md`、plan、测试、数据、spec（签字原文由申报人转录，本席不代填——角色卡「禁止 4」）。
- **唯一写入产物**：本件。
- **输入空间原文引句**（判据来源核对）：PRD `:330` 原文 `| ④ | testcase 全过 | 既有回归 testcase 全过（不新增用例） |`；PRD `:329` 原文 `| ③ | npm run check 绿 | 同左（不变） |`（原文该格带反引号，此处为免嵌套已去掉反引号，文字逐字未改）。两条并列说明：旁路 ④ 不另立新判据，只把常轨「testcase 全过」换成「既有回归全过 + 不新增用例」。
- **门账定位**：dev-workflow 技能 references 目录内的门账 `gate-record.md`，`③@S-E` 行 = `:121`（`Select-String -Pattern '@S-E'` 当场打印：`:118` ①、`:119` ②、`:120` ②→③、`:121` ③）。

**角色卡「一定会」五条（逐条作答，不答 = 不合格）**

| # | 判据 | 取值 | reason / evidence |
|---|---|---|---|
| 1 | 结论段依据 ≥ 2 条、各带 path:line、来自 ≥ 2 个不同文件 | hit | §2 每条结论至少 1 条命令证据 + 1 条文件锚；依据来自 PRD `index.md`:330 与 S4 spec `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md`:80 两个不同文件 |
| 2 | 证据可复算：path:line 指向的文件存在且该行含被引摘句 | hit | 抽 3 条当场核：`docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md`:80 = `seatEntry = { name, role, dimension, outputKind, tools, card }`；`tools/docgen/components/validateAgentData.mjs`:111 = `const BASE_KEYS = ['name', 'role', 'dimension', …]`；`docs/agents/senior-sdet.md`:4 = `- 维度：测试设计` |
| 3 | 非专业读者能听懂：英文术语首现行含中文解释，未解释术语计数 = 0 | hit | 首次出现处均给中文：TAP（测试输出逐行文本协议）/ BOM（文件头字节序标记）/ 副本注入（复制全仓到临时目录再改） / 断言（测试内的必须成立条件） |
| 4 | findings 为空时须显式写「全过、无问题」 | na | reason：findings 非空 = 5 条，见 §6；本条的触发条件（集合为空）不成立 |
| 5 | 附录为空时须显式写「全过、无问题」 | na | reason：本件无独立附录（七节即全文），findings 同上为 5 条 |

**席位清单 9 条（取值 hit / miss / na，miss 与 na 带 reason）**

| # | 条目 | 取值 | 原文引句 / reason |
|---|---|---|---|
| 1 | 输入空间核对 | hit | 判据原文 = PRD `:330`「既有回归 testcase 全过（不新增用例）」；输入 = 基线 `a495656`..`HEAD a0d56c0` 的 19 个变更文件（M 14 / A 5） |
| 2 | 状态与转移核对 | hit | 门账 `③@S-E` 行结论原文「**过（2026-11-04）**：本段判据（`npm run check` 绿）**成立**」→ 状态从 ③ 已过转入 ④ 待判，本件即该转移的出口 |
| 3 | 失败面核对 | hit | 三处改判各自的失败面都被真红档覆盖（§4 六行）；未覆盖的同类漏检写进 §6 第 1 / 2 条 |
| 4 | 判据来源核对 | hit | 每处改判的判据都能追到既有件：V9 = S-C spec `docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md`:151；B04 = S4 spec `:80`；`dimension` = `validateAgentData.mjs`:111 的 `BASE_KEYS` |
| 5 | 确定性核对 | hit | 同一命令重复跑结论一致：`npm run check` 两次（本件写入前 / 写入后）均 `# fail 0` + 末行 `check 全部通过`；三个红档每次都以同一 `not ok` 行复现 |
| 6 | 回归资产核对 | hit | 全仓 `test(` 块基线 1520 / 70 文件 = HEAD 1520 / 70 文件（逐文件差 0）；`sc-card-shape` 60、`card-render` 61 两侧同值 |
| 7 | 判别力核对 | hit | 三处红档的失败原因都是**断言失败**而非加载失败（`ERR_ASSERTION` + 点名席名/词面），说明注入确实打到判据本体；B04 副本 JSON 首字节 = `123,10,32,32`（无 BOM，排除「解析失败红」） |
| 8 | 盲点雷达核对 | hit | 主动找了 4 类自证漏洞并写进 §6 第 3 / 4 / 5 条（计数口径误报、跨文件搬移用例、副本依赖） |
| 9 | 覆盖账核对 | hit | 覆盖账三项现算：用例块 1520、本条改判 3 处（每处绿红两档齐）、维度格 15/15；见 §5 全表 |

## §2 逐条结论表

| 判据 | 结论 | 证据（命令首行 / path:line） |
|---|---|---|
| **① 既有回归全过** | **过** | `npm run check` → `# tests 1541` / `# pass 1534` / `# fail 0` / `# skipped 7`、`baseline 38/38`、末行 `check 全部通过`，exit 0 |
| ①a 门禁各段未放水 | 过 | 同一次运行内 `check-tristate-header: seats 15 / ok 15 / bad 0 => ok`、`④ markdown 检查通过（423 个文件 / 1840 张表）`、`[observable] 扫描 107 个 .md / 未豁免命中 0 行 / 已豁免 6 行 / stale 0 条` |
| ①b docgen 基线未被改判带歪 | 过 | `node tools/docgen/cli.mjs gate` → `baseline 38/38`，exit 0 |
| **② 不新增用例（向 1：`# tests` 与基线相等）** | **过** | HEAD `# tests 1541`；基线全仓块 1520 / 70 文件与 HEAD 逐文件相等（归一化后用 `Compare-Object` 比对差 0 行），故两侧用例数同源相等 |
| **②a 不新增用例（向 2：块数与 testcase 行数）** | **过** | `git grep -c -E "^\s*test\(" a495656 -- "*.test.mjs"` 求和 **1520**（70 文件）＝ HEAD 同法 **1520**（70 文件）；`sc-card-shape` 60 / `card-render` 61（两侧同值）；testcase 用例行 `^\| SC-TC-\d+` = **60**、`^\| S4-TC-[A-Z]\d+` = **122** |
| ②b 测试文件只许改不许增删 | 过 | `git diff --name-status a495656..HEAD -- '*.test.mjs'` = 3 行，全 **M**（A 0 / D 0）：`tools/docgen/test/card-render.test.mjs`、`tools/docgen/test/sc-card-shape.test.mjs`、`tools/docgen/test/sdet-data.test.mjs` |
| ②c 逐 hunk 阅过 | 过（附一处计数口径修正） | 三个 hunk 逐条读过；`test(` 起头的 `+` 行 = **1**，对应的 `-` 行也 = **1**（`-test('S4-TC-B04 index 表头五列齐'` → `+test('S4-TC-B04 index 表头五列齐 + 每席维度格非空'`）= **改名不是新增**；净块差 0。本条计数口径的余量已登记 §6 第 3 条 |
| **③ 改判一（V9 词面加 `十年`）** | **过（绿红两档齐）** | 绿 = 三面计数 0 + `SC-TC-29` / `SC-TC-31` 单跑 `ℹ pass 2 / ℹ fail 0`；红 = 副本改回旧句 → `not ok 1 - SC-TC-29 …`、`# fail 2`。明细 §4 第 1 组 |
| **④ 改判二（`S4-TC-B04` 维度格非空）** | **过（绿红两档齐）** | 绿 = `✔ S4-TC-B04 index 表头五列齐 + 每席维度格非空`、`ℹ pass 1 / ℹ fail 0`、README 维度格 **15/15** 非空；红 = 副本删键 + 副本内重生成 → `not ok 1 …`、错误信息 `index 席「senior-sdet」的「维度」格为空（spec :80 的 seatEntry 含 dimension）`。明细 §4 第 2 组 |
| **⑤ 改判三（`dimension` 值 = `测试设计`）** | **过（绿红两档齐）** | 绿 = `node --test tools/docgen/test/sdet-data.test.mjs` → `ℹ tests 3 / ℹ pass 3 / ℹ fail 0`；红 = 副本改值为 `测试` → `not ok 1 - TC-002(a)…`、`'测试' !== '测试设计'`。明细 §4 第 3 组 |
| **⑥ RS 面（`sweep` 与 `I34`）** | **过** | `node scripts/scope-sweep.mjs --check` → 末行 `sweep ok（命中未超基线、清单齐、scope 齐）`，exit 0；`counts` 含 `"I34":0` |
| ⑦ 无越界副作用 | 过 | 三个注入副本全删（`Test-Path` 全 `False`、`%TEMP%\se-red*` 残留 0）；收尾 `git status --porcelain` 仅本件 1 行（`?? docs/reports/2026-11-04-s-e-quality-evidence/quality-4.md`），真仓其它文件 0 行改动 |
| ⑧ 本件不破门禁 | 过 | 本件写入后重跑 `npm run check` → `# tests 1541` / `# pass 1534` / `# fail 0` / `# skipped 7` + `baseline 38/38` + 末行 `check 全部通过`（exit 0）；`④ markdown 检查通过（424 个文件 / 1850 张表）`（本件 +1 文件 / +10 表、表全部闭合）；`[行号守卫] 校对 1100 处、锚定 3 处`（无 `missing` / `ambiguous`）；`npm run doc:name` → `命名检查通过（docs）` |

## §3 两向自证（用例数与块数，前后值）

口径：**向 1** 判「用例条数不增」，**向 2** 判「用例块与 testcase 行不增」。两侧都取自同一对提交（基线 `a495656`、HEAD `a0d56c0`），不跨批混算。

| 面 | 基线 `a495656` | HEAD `a0d56c0` | 差 | 取法 |
|---|---|---|---|---|
| `node --test` 的 `# tests` | 1541（基线记录值） | **1541** | 0 | HEAD 实跑；基线值由「块数两侧相等」+ 基线记录背书（见下两行） |
| 全仓 `test(` 块数（`^\s*test\(`） | **1520** / 70 文件 | **1520** / 70 文件 | 0 / 0 | `git grep -c -E "^\s*test\(" <提交> -- "*.test.mjs"` 逐文件求和；归一化后逐文件 `Compare-Object` 差 **0 行** |
| `tools/docgen/test/sc-card-shape.test.mjs` | 60 | 60 | 0 | `git show a495656:<路径>` 与盘上文件各数一次 |
| `tools/docgen/test/card-render.test.mjs` | 61 | 61 | 0 | 同上 |
| 本批测试文件行数变动 | — | +14 / −6（净 +8） | — | `git diff --numstat a495656..HEAD -- '*.test.mjs'` = `9/1` + `2/2` + `3/3` |
| `+` 行中以 `test(` 起头的行 | — | **1** | — | 与 `-` 行 1 条配对（改名），净增 0 |
| testcase 用例行（SC-TC / S4-TC） | 60 / 122 | **60 / 122** | 0 / 0 | `Select-String -Pattern '^\| SC-TC-\d+'` / `'^\| S4-TC-[A-Z]\d+'` 各数一次 |
| 测试文件增删形态 | — | 3 份**全 M** | A 0 / D 0 | `git diff --name-status a495656..HEAD -- '*.test.mjs'` |

**结论**：两向都成立 —— 用例条数（`# tests`）、用例块数（1520）、两份 testcase 的用例行（60 / 122）三项前后相等，且测试文件无 A / D。**本批未新增用例**。

## §4 三处改判的红绿两档实跑值

三组都在 `%TEMP%` 全仓副本内注入；副本内改 JSON 一律用「读全文 → 字符串替换 → 以无 BOM 的 UTF-8 写回」，并在写回后核首字节（无 BOM 时 `{` 的十进制 = `123`）。

### 第 1 组：V9 词面加 `十年`

| 档 | 命令 / 构造 | 结果原文（首行或关键行） | 退出码 | 副本 |
|---|---|---|---|---|
| 绿 | 真仓：`Select-String -Path tools\docgen\data\seats\*.json,agents\*.md,docs\agents\*.md -Pattern '资深\|20 年\|十年' -AllMatches` | 合计 **0**（分面 `data=0 agents=0 docs=0`） | 0 | — |
| 绿 | 真仓：`node --test --test-name-pattern "SC-TC-29\|SC-TC-31" tools/docgen/test/sc-card-shape.test.mjs` | `✔ SC-TC-29 人设词三面清零（含外层 role / agents / docs/agents）+ sdet-data 回归 + 占位保全 (110.0811ms)`、`✔ SC-TC-31 …`、`ℹ tests 2 / ℹ pass 2 / ℹ fail 0` | 0 | — |
| 红 | 副本 `se-red1-1230489948`：把 `tools/docgen/data/seats/senior-sdet.json`:144 的 `rationale` 首句改回「有十年以上经验的测试开发工程师。」→ 跑 `node --test --test-reporter=tap --test-name-pattern "SC-TC-29" tools/docgen/test/sc-card-shape.test.mjs` | 命令首行 `not ok 1 - SC-TC-29 人设词三面清零（含外层 role / agents / docs/agents）+ sdet-data 回归 + 占位保全`；失败原因 `error: seats 面（含外层 role）不得含「十年」` + `1 !== 0`；`# fail 2`（30 号与 31 号两条同红）；副本内 `data` 面 `十年` = **1** | 1 | 已删，`Test-Path` = **False** |

### 第 2 组：`S4-TC-B04` 维度格非空

| 档 | 命令 / 构造 | 结果原文（首行或关键行） | 退出码 | 副本 |
|---|---|---|---|---|
| 绿 | 真仓：`node --test --test-name-pattern "S4-TC-B04" tools/docgen/test/card-render.test.mjs` | `✔ S4-TC-B04 index 表头五列齐 + 每席维度格非空 (1.0128ms)`、`ℹ tests 1 / ℹ pass 1 / ℹ fail 0` | 0 | — |
| 绿 | 真仓：`docs/agents/README.md` 数据行 15 行，第 3 列（维度）非空 **15/15**；单席头抽核 15 席全非空（`senior-sdet.md`:4 = `- 维度：测试设计`） | `data rows = 15 / dim non-empty = 15` | 0 | — |
| 红 | 副本 `se-red2-1135871878`：删 `tools/docgen/data/seats/senior-sdet.json`:4 的 `"dimension": "测试设计",` 行（无 BOM 写回，首字节 `123,10,32,32`）→ **副本内**跑 `node tools/docgen/cli.mjs generate --readme --apply`（`docs/agents 已写入（16 份，全内存 rename 落盘）`、`baseline 38/38`，exit 0；README 该席维度格变空）→ 跑 `node --test --test-reporter=tap --test-name-pattern "S4-TC-B04" tools/docgen/test/card-render.test.mjs` | 命令首行 `not ok 1 - S4-TC-B04 index 表头五列齐 + 每席维度格非空`；错误信息原文 `error: 'index 席「senior-sdet」的「维度」格为空（spec :80 的 seatEntry 含 dimension）'`（`AssertionError` / `actual: ''`）；`# fail 1` | 1 | 已删，`Test-Path` = **False** |

### 第 3 组：`dimension` 值 = `测试设计`

| 档 | 命令 / 构造 | 结果原文（首行或关键行） | 退出码 | 副本 |
|---|---|---|---|---|
| 绿 | 真仓：`node --test tools/docgen/test/sdet-data.test.mjs` | `✔ TC-002(a)：新卡键集齐 + 四键互斥 + 9 条 checkItems + 档位/边界来自单源 (0.8065ms)`、`ℹ tests 3 / ℹ pass 3 / ℹ fail 0`（另 `TC-007` / `TC-004` 同绿） | 0 | — |
| 红 | 副本 `se-red3-1001964903`：把 `tools/docgen/data/seats/senior-sdet.json`:4 的值改成 `"dimension": "测试"`（无 BOM 写回）→ 跑 `node --test --test-reporter=tap tools/docgen/test/sdet-data.test.mjs` | 命令首行 `not ok 1 - TC-002(a)：新卡键集齐 + 四键互斥 + 9 条 checkItems + 档位/边界来自单源`；错误信息原文 `Expected values to be strictly equal:` + `'测试' !== '测试设计'`；`# fail 1` | 1 | 已删，`Test-Path` = **False** |

**副本清理总账**：`se-red1` / `se-red2` / `se-red3` 三个目录逐个删除后各报 `Test-Path = False`；`Get-ChildItem %TEMP%\se-red*` → `leftover dirs = 0`。

## §5 计数与比例（现算）

| 项 | 值 | 比例 / 算式 | 取法 |
|---|---|---|---|
| 用例总数 | 1541 | — | `npm run check` 的 `# tests 1541` |
| 通过 | 1534 | 1534 / 1541 = **99.55%** | 同上 `# pass 1534` |
| 失败 | 0 | 0 / 1541 = **0.00%** | 同上 `# fail 0` |
| 跳过 | 7 | 7 / 1541 = **0.45%** | 同上 `# skipped 7` |
| 用例块 | 1520 / 70 文件 | 平均 21.71 块/文件（1520 / 70） | `git grep -c` 求和；两侧同值 |
| 本批改判 | 3 处 | 每处 2 档（绿 / 红）= 6 格，实跑 **6 / 6** | §4 |
| 红档判别力 | 3 / 3 为断言失败 | 3 / 3 = **100%**（无一条是加载失败或解析失败） | §4 错误信息均为 `ERR_ASSERTION` |
| 三面人设词 | 0 | `data` 0 / `agents` 0 / `docs/agents` 0 | `Select-String -AllMatches` 三面各数 |
| README 维度格非空 | 15 / 15 | 15 / 15 = **100%** | 现算 README 数据行第 3 列 |
| 单席头「维度」非空（抽核） | 15 / 15 | 15 / 15 = **100%** | 逐份取第 4 行 |
| 变更文件 | 19 | M 14 / A 5 | `git diff --name-status a495656..HEAD` 计行 |
| 其中测试文件 | 3 | 3 / 19 = 15.79%，全 M | 同上 |
| `sweep` 命中键 | 34 个 | `I34` = **0** | `scope-sweep --check` 的 `counts` 行 |
| markdown 门禁 | 423 文件 / **1840** 表 | 本件写入后 = 424 文件 / 1850 表（+1 文件 / +10 表，全闭合） | `npm run check` 的 ④ 段（本件写入**前** / 写入后各跑一次） |
| 观察面 | 107 md | 命中 0 / 豁免 6 / stale 0 | `[observable]` 行 |

**两处数字的核对说明（不放过任何一处对不上）**：

1. ③ 段审计记 `1839` 张表，本段实测 `1840` —— 差 1 张。成因可复算：`a0d56c0` 在 ③ 审计跑完之后往 plan 加了 §5.1「R8 处置摘要」表（`git show a0d56c0` 该件 `+` 行含表头 `| # | 改动 | R8 处置 | 回扫结论（可复算） |` 与其 4 行正文）→ +1 张表。非判据漂移。
2. ③ 段的 `# tests / # skipped` 与本段完全同值（1541 / 7），两段独立实跑得同一结果，说明该数不是转录来的。

## §6 缺口表

每行四列齐；**共 5 条**（非「0 条」——本段确实找到 5 处能漏检的形态，其中 2 条属本批既有判据的已知限制、3 条是本段自证过程中新发现的）。

| # | 漏检哪类 | 触发 | 该做 | 谁兜 |
|---|---|---|---|---|
| 1 | 人设词面仍是**词面枚举**（`资深` / `20 年` / `十年`），同义资历表述（「十余年」「多年」「15 年」「20 余载」）全部漏检 | 有人用枚举外的说法写资历句 | 把 V9 由「词面」改成「位置型」：人设面（`rationale` 首句 / 卡面人设句）禁任何资历年限表述，判据落在句式而非词表 | 下一批（已登记在 plan §6 第 1 行）；本段只登记不改判 |
| 2 | `S4-TC-B04` 只判 `README.md` 的**维度列**非空，不判单席头 `- 维度：` 行 | 单席头被写成空 `- 维度：` 而 README 仍有值 | 加「单席头与 README 同值 / 同非空」断言（同一席两处取值互校） | 下一批加断言；本段已**抽核** 15 席单席头全非空（§4 第 2 组绿档第 2 行），故本批无实漏 |
| 3 | 「`+` 行中以 `test(` 起头的行 = 0」这条计数口径在**改名**时会误报（本批实测 +1 / −1 配对、净增 0，但按字面口径会判 1） | 用例名被改而块本体不动 | 把口径写成「`test(` 块**净差** = 0 且 `+test(` 与 `-test(` 配对核」 | 后续复核本批者按 §3 的配对口径复算；口径正本在 plan §5，改它属改判，走下一批 |
| 4 | 「不新增用例」只由两个总数（块数 / `# tests`）背书，**跨文件搬移**用例（A 件删块 + B 件加块、总数守恒）可静默通过 | 后续批把用例从一份测试文件搬到另一份 | 把「逐文件块数表两侧比对」当常驻判据（本段已手工做，70 / 70 文件差 0 行） | 本段判者已做一次；要常驻须写进脚本（属功能增删，须回 PRD，非本批可做） |
| 5 | 红档可信度依赖「副本能独立跑」：若将来测试引入外部依赖或网络，副本内注入会退化成加载失败红，判别力失真 | 测试首次引入 npm 依赖 | 注入脚本先跑一次**未注入**的绿灯，绿灯不过就停（本批已隐含满足：副本内 `generate` 与三次红档都在无依赖状态下跑通） | 后续批的 ④ 段判者；本段已在 §4 逐档记录「红档原因 = 断言失败」以留证 |

**findings 汇总（非空，故 §1 第 4 / 5 条判 na）**：P0 0 / P1 0 / P2 0 / P3 5（上表 5 条都是「已知限制 + 后续批兜」级，不影响本批 ④ 过门）。

## §7 漂移定性

| # | 改判 | 定性 | 依据（可复算） |
|---|---|---|---|
| 1 | V9 人设词面加 `十年` | **一致** | 词表与判据同批同改：S-C spec `docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md`:151（`资深 / 20 年经验 / 20 年 / 十年 计数 0`）与测试数组（`tools/docgen/test/sc-card-shape.test.mjs`:605、`:649` 两处加词）逐字对应；testcase `:475` / `:477` / `:499` / `:501` / `:503` 同批同步；三面计数 0 与用例绿两档都对上。**加严**，非放宽 |
| 2 | `S4-TC-B04` 维度格非空 | **换载体** | 判据本体早已存在（S4 spec `:80` 的 `seatEntry = { name, role, dimension, outputKind, tools, card }`，本批该件正文**逐字未改**）；本批做的只是给它补一个**可执行载体**（断言落在 `tools/docgen/test/card-render.test.mjs`:619 起的 12 行）。判据内容未变，故不是放宽、不是功能增删 |
| 3 | `senior-sdet` 补 `dimension = '测试设计'` | **一致** | 键位是校验器既有口径（`tools/docgen/components/validateAgentData.mjs`:111 的 `BASE_KEYS` 本就含 `dimension`），补齐后 15 席键集同构；`tools/docgen/test/sdet-data.test.mjs`:17 的断言由「不得有该键」翻转为「值逐字相等」，方向是**对齐 spec 结构行**，不是放宽 |

**本批 3 处改判无一为「判据放宽」、无一为「功能增删」**：F 集合（PRD §10 的 `F-01`…`F-24`）零变化（① 段独立审计已判成立）；三处改判只落在既有 `F-xx` 覆盖范围（V9 属 S-C 的既有验收项、B04 属 S4 的既有验收项、`dimension` 属 S4 结构行），无新增交付物、无新增用例。

**「旁路 ④ 不新增用例」与 §6 缺口表如何使改判可复核**：

1. **不给新用例 = 判据变严时不能靠「加一条用例」蒙过去**，所以本段只能用两种手段：**既有回归**（1541 条全过，其中 60 + 61 + 3 条正是被改判触及的三份文件）**＋** **注入取证**（把判据打回旧形态，看既有用例是否真的红）。三处红档因此都是「既有用例变红」而不是「新用例变绿」——这正是旁路 ④ 的判别力所在。
2. **缺口表把「改判没管到的形态」逐条留名**（5 条），每条都写清触发条件与谁兜。复核者不必信任本段结论：拿 §6 任一行去构造一次，就能验「本段的绿是真的绿、红是真的红」。
3. **可复核的锚点全在本件与 plan §5.1（都进 git）**：每处改判的绿红两档都给了命令原文 + 错误信息原文 + 副本编号与清理结果；副本编号在 `.session/` 之外即可重建（复制全仓 → 按 §4「命令 / 构造」列做注入即可复现）。

---

**判者签名**：独立 sdet 实例（`agents/senior-sdet.md` 角色卡贴入，未参与 S-E 批的 ①② 申报 / plan / ③ 施工 / ③ 审计）｜2026-11-04
