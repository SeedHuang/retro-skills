 # 测试用例：docgen 规则单一来源化（F-24 / S6）

> 归属 spec：`docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design.md`（**v8 待议会复评版**）。
> **v8 增量（对齐 spec v8）**：① §3.5 由七条扩为 **九条不变量**（新增 #8 席级组内容合法 `:verb` / #9 档位一致）；② 新增 `policy/definitions/tiers.mjs`（档位表下沉，`patternRegistry` 只 re-export）；③ 新增独立导出 `DETECTION_BLIND_SPOTS`（检测盲区 ≠ 禁写清单，槽 11 `{{DETECTION_PATHS}}` 取它）；④ 新增 `components/validatePolicy.mjs`（五码唯一发射点，由 `gate` 与 `policy --dump` 两处调用）；⑤ `SEATS` 定为**对象形状**（`{ display, clause?, escalationWriter?: {slug, artifact} }` + `__default__`）；⑥ **V-1 的「改造后」端取 `factsFromText(renderBoundary(席), probeDict())`**（v9.2 起改为「定义层成员存在性匹配」，签名带字典；**v9.3 起配套 `factsFromBaselineText` = 基线端旧卡切分、不注入字典**，两端可比前提见 H02 ⑤'），`policy --dump` 只作交叉核对；⑦ **V-13 评「边界五段」切片**、评测者 = 2 个全新上下文子代理（非作者 / 非施工）、至多 2 轮；⑧ **置信度阈值纠正**（复用 `tools/execution-matrix/rating.mjs`：记录 ≥3 且零回归 → `high`）。禁止命令集不再写死条数（**由 `policy --dump` 现算**）。
> **历史轮次（压缩）**：v1 首版；v2 V-3 改 closed-world + 黄金只存 sha256；v3 补「判据/前置改判、历史叙述保留」；v4 槽集 11 + ID 谓词含冒号 + `host` 哨兵；v5 第 12 槽 `{{DETECTION_CMD}}` + 纯度三条；v6 统一「七条不变量」；v7 验收改判（V-1 能力矩阵等价 / V-2 降为定位 / 新增 V-11 双向下探 / V-12 子句存在性 / V-13 A/B 盲评 + 四本账单）。
> 功能点：**F-24**（`docs/prd/20261024073606-dev-workflow-mainline/index.md` §10；交付份 S6）
> 编写者：`senior-sdet`（**独立子代理，全新上下文**）｜**独立性声明**：编写者 ≠ spec 作者、≠ 施工者；用例只从 spec（v1 首版 → v8 现行）+ 验收锚点（V-1～V-13）+ §7 失败面 + §3.5 不变量 + §3.6 等价迁移 + §10 不测清单生长，**不从现有实现倒推放宽判据**；编写者不修改 spec、不写实现代码，只读实现用于 §7 盲点登记（已在每条「来源」字段区分）。
> 复核：**同一座位的新实例**（每轮全新上下文，≠ spec 作者、≠ 施工者、≠ 前几轮实例）；2026-10-25 已完成六轮——v2 口径对齐、v3 十一项闭合核验、v4 八条处置核验、v5 最小增量同步（第 12 槽 / 槽集恰合）、v6 统一「七条不变量」、v7 验收口径改判（用户原话取证：`.session/reviews/2026-10-25-111619-s6-policy-parliament/evidence.md`；交接词 `docs/handoffs/2026-10-25-s6-policy-parliament.md:71-72`）。
> 第八轮复核（**议会 #3 返工后**）：**同一座位的新实例**（全新上下文，≠ spec 作者、≠ 施工者）——按议会 #3 第 1 轮的 **32 族问题**（`.session/reviews/2026-10-25-111619-s6-policy-parliament/problems.md` §一–§三）逐族改到 v8：**不删用例、不放宽判据**，只做三类动作——① 判据改成可照抄执行 + 全部 helper 在 §0.3 / §0.4 落地实现；② 口径对齐 spec v8；③ 新增 A09 一条边界用例（CRLF / BOM）。
> 第九轮复核（**议会 #3 复评确认轮**，v9）：**同一座位的新实例**（全新上下文，≠ spec 作者 / ≠ 施工者 / ≠ 上一轮实例）——只核 testcase、不改 spec。逐族核 F1–F32 闭合、核上一轮 6 条 spec 缺口（全闭合：`spec:124` / `:112` / `:187` / `:57` / `:249` / `:165`）、复算计数（76 条 / 正 27 / 负 26 / 边界 23 / 负+边界 49 ≥ 27）、抽检判别力 10 条。**本轮 testcase 侧改动**：A09 由「二选一」收紧为「`Mismatch` 必红」；B02 按 `SEAT_NAMES` 排除保留键 `__default__`；D01 的 `<类别>` 词表补 `tier`；D04 的不变量 8 负例补挂 I02；K06 改 import `rating.mjs`（不再复制阈值）；E01 两席断言改渲染侧、卡文本读副本；I01 去掉恒真断言；F03 补静态只读守卫；J02 标题「五类」→「7 类」；§1 H05 行与用例正文对齐；`spec:` 行号引用按 spec v8 实文校正。
> 第十轮复核（**最终口径对齐轮**，v9.1）：**同一座位的新实例**（全新上下文，≠ spec 作者 / ≠ 施工者 / ≠ 前几轮实例）——主机在第九轮之后又修 spec 6 处：① `seats.mjs` 两席补齐 `escalationWriter` 取值（均 `{slug:'reviewer-audit', artifact:'round-check.md'}`）+ 两种渲染规则；② 槽 6 取值规则（本席自写 / 他席写）；③ `agentData` 条目除 `evidence-reader` 外不得自带 `boundary`；④ §5 dump 的 `commands` 组集 = 允许 3 ∪ 禁止 5 ∪ `seatGroups`；⑤ **V-7 扫描面改判**（S5 spec 的清单原句属历史记录、只判指针；活跃副本 = 定义层 1 + 2 卡）；⑥ §3.4 段名统一为「越**界**后果与限度」。本轮只同步 testcase：E03 / E05 按新 V-7 改写、F01 补 `commands` 组集断言、C01 / C02 / C06 补槽 6 两形态断言、G03 补 S5 既有断言口径、J01 / J02 / C01 / C02 段名注释统一为「越界」、全文件 `spec:行号` 按 spec 现行文逐条校正。**不删用例、不放宽判据**。
> 第十一轮复核（**后端复核第 2 轮返工**，v9.2）：**同一座位的新实例**（全新上下文，≠ spec 作者 / ≠ 施工者 / ≠ 前几轮实例）——按议会 #3 第 2 轮后端 5 张新卡（9 项处置）**只改 testcase**：① 档位表按 **四档**（`readOnly` / `sdet` / `command` / `producer`，`command` 键必须存在）→ A01 / B01 / E07 / F01；② 槽 10 的 ③ 段成员 **23 项**（`pathGroups` 六组展开 ∪ `spec / plan`）→ A04 / A06 / C08 / F02 / H02；③ **V-1 取项方式改判 = 按定义层成员做存在性匹配**（不按反引号切、不靠分隔符猜；`DOCGEN_*` 不进成员集合、`node -e` 属 `network.verbs`）→ 重写 §0.4 的 `factsFromText`；④ `factsFromText` **只有一份实现**且落抽取器 `test/support/capability-baseline.mjs`（不得 import `policy/`）、H01 ③ 改为 `runEsm` **真执行**复算、H07 加「抽取器被执行过」的动态断言；⑤ 修 `norm()` 对字符串 `tier` 的 `TypeError`；⑥ I01 探针按 capability 选席（`exec` → `reviewer-audit`）、I03 探针键带席名（`kind:id@seat`）；⑦ 黄金哈希取自**改造前**文本 + 换代只追加 `<席>@<轮次>` 键 + 「自哈希 → `hashEqual` 恒真」负例；⑧ 可选槽缺省（`senior-sdet` 的 `clause` / `escalationWriter` = 空串）与「显式 `undefined` → `TemplateImpure`」负例（**新增 C09**）；⑨ V-8 措辞改为「加一席只改数据」（已登记席加组 = 1 处数据；新增席 = 2 处数据、零代码）。**不删用例、不放宽判据**；正文 `spec:行号` 按 spec 现行文整体校正。
> 第十二轮复核（**最终口径对齐轮 2**，v9.3）：**同一座位的新实例**（全新上下文，≠ spec 作者 / ≠ 施工者 / ≠ 前几轮实例）——主机在第十一轮之后又修 spec 2 处：① §3.2 `tiers.mjs` 行（`spec:53`）**写死导出名与形状** `export const TIERS = { readOnly:['read'], sdet:['read','write'], command:['read','exec'], producer:['read','write','exec'] }`，并写死「`patternRegistry.tools` 必须是 `TIERS` 的**同一对象引用**（re-export，不深拷贝、不改名）」；② §6 步骤 0 ④（`spec:169`）**写死基线字典来源**：步骤 0 尚无定义层 → 基线端按**旧卡文本切分**（反引号 / 顿号 / 分号 / ` / ` 工具项），改造后端按**定义层成员字典**匹配渲染文本，两端可比前提 = 「基线成员 ⊆ 定义层字典」（H02 ⑤'）。本轮只同步 testcase：`TIERS.tiers` → **`TIERS` 本身**（`Object.keys(TIERS)` / `TIERS.readOnly`，具名导入 `{ TIERS, tierOfCapabilities }`）、同一引用断言改 `assert.equal(patternRegistry.tools, TIERS)`（严格相等）→ A01 / B01 / E07 / F02 / §0.3 `probeDict`；抽取器补**基线端切分口径** `factsFromBaselineText`（不注入字典）与 `runBaselineExtractor` → §0.4 / H01 ③⑦ / H02 ⑤' / H07 ④；§10.5 的 11-1 / 11-2 改为**已闭合**；全文件 `spec:行号` 按 spec 现行文（313 行 = 正文 312 行 + 末空行）校正。**不删用例、不放宽判据**。
> 第十三轮复核（**最终口径对齐轮 3**，v9.4）：**同一座位的新实例**（全新上下文，≠ spec 作者 / ≠ 施工者 / ≠ 前几轮实例）——主机在第十二轮之后又改 spec 4 处：① §3.2 `tiers.mjs`（`spec:53`）把 **`TIERS` 的值改为工具名**（`readOnly:['Read','Glob','Grep']` / `sdet` 五项 / `command:['Read','Glob','Grep','RunCommand']` / `producer` 六项），并写死 `tierOfCapabilities(caps)` = 「`caps` 展开后的工具集 == `TIERS[档]`」的**唯一样**；② §3.2 `paths.mjs`（`spec:55`）+ V-1③（`spec:204`）写死三数口径 = **数组元素 21 / 定义层点名 22 / 卡面成员 23**；③ §7 注（`spec:195`）收窄模板读取失败承诺：只有 `gate` / `policy --dump` **调用期**承诺 `TemplateReadFailed`（exit 3），模块导入期失败不在承诺内（S6-B 候选）——**该承诺已被现行 §7 撤回：导入期失败 = 未捕获异常，不承诺任何码 / 退出码**，`TemplateReadFailed` 不进码表（见 §6 不测表末段同口径）；④ §7 注（`spec:198`）写死黄金换代后的「**当前比对键**」= 同席 `<席>@<轮次>` 轮次最大者、无则取基线键。本轮只改 testcase：A01 ④ / B01 ⑤ / E07 ④ / F01 / F02 的档位值断言改**工具名** + `assert.equal(patternRegistry.tools, TIERS)`（严格相等）+「caps 展开 == `TIERS[tier]`」；H01 ④ 由「`agents/` 零差异」改判「**差异可追 + 越界可抓**」；B01 / C01 / C02 补「当前比对键」断言与「换代后仍取旧基线键 → 定位线索失效 → 红」负例；§0.2 的 `network` 表述按 `network.verbs` 实际成员校正；§10.5 的 11-3 改判已闭合。**不增删用例、不放宽判据**；全文件 `spec:行号` 按 spec 现行文（正文 313 行）重校。
> 第十四轮复核（**槽序与 `network` 成员口径校正**，v9.5）：**同一座位的新实例**（全新上下文，≠ spec 作者 / ≠ 施工者 / ≠ 前几轮实例）——主机在第十三轮之后又改 spec 3 处：① §3.4（`spec:76`）写死「槽集 12 个，**顺序 = 本表行序 = `dump.expanded` 的索引口径**；卡面首次出现顺序不参与判据」；② §5（`spec:162`）写死「`expanded` 顺序 = §3.4 表行序，**第 n 行 → index n−1**；卡面首次出现顺序不参与判据」；③ §3.2 `commands.mjs`（`spec:54`）把 `network.purpose` 写为「安装 / 网络写 / `node -e`（不开放）/ 下载类命令」，并把 **`network.verbs` 成员收窄为恰三项**（`安装` / `网络写` / `node -e`；`下载类命令` 不是 verb，归 `purpose`）。本轮只同步 testcase：全文件 `expanded` 索引按表行序重排（其余项不动，**`envForms = e[8]` / `paths = e[9]` / `detectionPaths = e[10]` / `detectionCmd = e[11]`**）→ §0.4 `factsFromDump`、C06 的 `SLOTS` 序、C08 的槽级取值、F01 / F02、H02 交叉核对；§0.2 的 `network` 行与口径注、§0.4 `denyVerbs` 期望、A02 的「`network.verbs` 恰三项」断言、I02 的逐项探针与计数处同批改；`spec:行号` 按 spec 现行文（正文 313 行）复校（`:201`→`:202`、`:238`→`:239`）。**不增删用例、不放宽判据**。
> 第十五轮复核（**口径落地核验轮**，v9.6）：**同一座位的新实例**（全新上下文，≠ spec 作者 / ≠ 施工者 / ≠ 前几轮实例）——核 v9.5 的声明是否真的落到正文，发现 `expanded` 新序**只落到了 §0.4 `factsFromDump`**，C06 / C08 / F02 仍是旧序（`FORBIDDEN_PATHS` 当 index 8、`ENV_FORMS` 当 index 11、`DETECTION_CMD` 当 index 10）。本轮补齐且不增删用例：① **C06** 删掉「模板中首次出现顺序 = 表顺序」（与 `spec:76`「卡面首次出现顺序不参与判据」相反），改为只判集合相等；`SLOTS` 与预期按表行序重排；② **C08** 槽级取值改 `allow=e[6] / deny=e[7] / paths=e[9]（槽 10）/ env=e[8]（槽 9）`；③ **F02** 改 `expanded[9]`（槽 10 FORBIDDEN_PATHS）/ `expanded[11]`（槽 12 DETECTION_CMD），并补「第 10 位 = FORBIDDEN_PATHS」；④ **A02** 补 `network.verbs` 恰三项 + `下载类命令` 只归 `purpose` 的可执行断言（§0.2 早已声明该断言，正文此前缺失）；⑤ §1 的 F02 行、§10.2 / §10.3 的槽号同步为「槽 12 / index 11」。**不增删用例、不放宽判据**；全文件 `spec:行号` 按 spec 现行文（313 行）复校。
> 第十六轮复核（**`gate` 侧接线补测**，v9.7）：**同一座位的新实例**（全新上下文，≠ spec 作者 / ≠ 施工者 / ≠ 前几轮实例）——按后端席 **Q-4-BE-01**（议会 #3 第 4 轮）的修法，**只增用例、不放宽判据**：新增 **`S6-TC-D06`**（`gate` 侧必须调用 `validatePolicy()`，配置非法 → exit 1 + 五码之一，**不得落 `Mismatch`**、不得静默放行；依据 `spec:196` / `spec:161`）。原五码探针全走 `policy --dump`，`gate` 侧零用例 → 施工只接 dump 也能全绿。同步 §1 覆盖总表、§3 汇总裁定表、§9.B 计数（**78 条 / 正 27 / 负 28 / 边界 23 / 负+边界 51 ≥ 27 / 78 ≤ 80**）；本次新增引用按 spec 现行文（`split(/\r?\n/)` 长 313 = 312 行正文 + 末尾空串）校正。
> 第十七轮复核（**测试评委第 2 轮 3 处返工**，v9.8）：**同一座位的新实例**（全新上下文，≠ spec 作者 / ≠ 施工者 / ≠ 前几轮实例）——按测试评委第 2 轮 3 处（K06 P1 / J01+J02 P2 / A04 P2）**只改 testcase、不删用例、不放宽判据**：① **K06** 不再对 16 行数回归（`Number('pending')=NaN` → 全 pending 也判 `high`），改为**先把 16 行折叠成 4 条记录**（每条 = 某卡某实例的 8 维，helper `abRecords()` / `zeroRecords()` / `isNumericScore()`），记录级判零回归且**分母统一为记录数**，含非数字维时额外断言 `zero < n` 与 `置信度 !== high`；② **J01 / J02** 的 ⑨⑩（审计「核转录」/ 侦探「本席不核签」）由 `scope:'full'` 明确改为 **`scope:'card'`（卡级子句）**，并写死理由：现文这两句在 ② 段，V-12 的「⑤ 段」只约束 ①–⑧；J01 增两条计数断言（`seg5` 恰 8 / `card` 恰 2）；③ **A04** 补 `ledger` / `workspace` 的 `deepEqual` 逐项断言（`ledger` 恰 4 项、`workspace` 恰 9 项按定义层顺序），红点写明「换名不换数 → 必红」。另核 spec §3.6 已写死的三条改判 → **E05 ③ 由「含 `renderBoundary`」收紧为逐条 `WANT` 正则**（E05 / B08 / B14 三种句式），④ 补 `import { pathTokens }` 与「不再称 22 项数组」断言。**不增删用例**。
> 第十八轮复核（**安全席 / 后端席 4 项判据补强**，v9.9）：**同一座位的新实例**（全新上下文，≠ spec 作者 / ≠ 施工者 / ≠ 前几轮实例）——主机在第十七轮之后又改 spec 4 处：① §3.5 #8（`spec:112`）写死不变量 8 方向① 的后缀 = `:not-allowed`；② §3.4（`spec:93`）写死**单趟** `tpl.replace(/…/g, …)`；③ §7（`spec:197`）写死「报文路径一律仓内 POSIX 相对路径，禁绝对路径 / 盘符 / 用户目录 / `file://`」；④ §9.2（`spec:252`）写死**盲评隔离**（实例输入只有两张卡、不得读 `mapping.sealed.md`）。本轮**只改 testcase、不增删用例**：**B11** 补方向①负例（`curl https://x` → `:not-allowed`）；**A08** 补「单趟替换」负例（`display` 含 `{{DETECTION_CMD}}` 原样输出 + `expanded[0]` 不变）；**D01 / C03–C05** 首行路径收紧为「以 `tools/docgen/` 开头」并补绝对路径负例（`assertReportPath` 三条断言）；**K05** 补盲评隔离两条断言（评测账目录内无 `mapping.sealed.md`、每实例输入清单恰 2 个卡文件）。另按**内容**（非偏移）重校全文件 `spec:行号`（正文 313 行）。
> 第十九轮复核（**后端席 Q-5 处置轮**，v9.10）：**同一座位的新实例**（全新上下文，≠ spec 作者 / ≠ 施工者 / ≠ 前几轮实例）——**只改 testcase、不增删用例**：① **清掉 4 处与现行 spec 相反的旧表述**：§6 不测表的「模板 / 配置读取失败」行按 `spec:195` **撤回**「调用期承诺 `TemplateReadFailed`（exit 3）」，改为「导入期（`boundaryBySeat` 顶层求值）失败 = 未捕获异常，**不承诺任何码 / 退出码**」+ 登记 S6-B（触发信号 = 渲染改惰性求值）；§10.6 的 **12-1 改判已关**（现行 §7 四后缀含 `:not-allowed`，`spec:190`）；头部第十三轮的历史句补注「该承诺已被现行 §7 撤回」；头部与 §10 的行数口径统一为**现行 313 行**（`split(/\r?\n/)` 长 313 = 312 行正文 + 末尾空串）。② **B01 补 `tierBySeat` 派生断言**（`spec:120`，后端席 Q-5-BE-01）：键集恰三席（≡ `SEAT_NAMES`）、**不含 `__default__`**、每键值 `=== tierOfCapabilities(SEAT_POLICY[席].capabilities)`（派生值 == 映射值）。**不增删用例、不放宽判据**（计数仍 78 / 正 27 / 负 28 / 边界 23 / 九要素 78/78 / ≤80）。
> 版本：**v9.10（§6 读取失败口径按 `spec` §7 撤回 / §10.6 12-1 已关 / 头部行数口径统一 313 / B01 补 `tierBySeat` 派生断言；其余口径沿 v9.9）**｜编写 / 复核日期：2026-10-25｜状态：**内容已定稿，待议会 ② 段签字**（定稿判据：九要素齐 + 覆盖总表与 V-1～V-13 一一对应 + 负例/边界 ≥ 正例 + 总数 ≤80 —— 四项均满足：78 条 / 51 ≥ 27 / 78 ≤ 80 / 覆盖表逐行有编号）
> 命名与落点：按 `rules/spec-testcase-gate.md` 判据 1 —— 与 spec 同目录、文件名 = spec 去掉 `.md` + `-testcase.md`。
> **用例 ID 前缀**：本文件统一用 `S6-TC-`（与 S5 的 `S5-TC-` 区分；仓库既有 `test('TC-` 前缀归其它 spec）。
> 判据口径声明：「判据」列要么是「命令 + 退出码 + 关键输出」，要么是可直接照抄的 `assert.*` 表达式；「功能正常」「符合预期」不算判据。每条标注**来源**：`spec 推导` 或 `实现观察（补充）`；后者只进 §7 / §8，不改写 spec 推导用例。**「对应测试」列**：新用例落 `tools/docgen/test/policy-pure-source.test.mjs`（spec §6 步骤 6 隐含的新文件；plan 未出前写「待 plan Task N」）。

---

## 0 判据基线（读用例前先认这 14 个事实，全部来自仓库现状，可复核）

| # | 事实 | 出处（可复核） |
|---|---|---|
| 1 | 基线条数 = `BASELINE_RULES`（22 条）+ `agentPaths()`（15 席）= **37**；`gate` 打印 `baseline N/N`，N 由这两个来源现算 | `tools/docgen/components/baseline.mjs:5-21`、`tools/docgen/cli.mjs:136-140` |
| 2 | `gate` 只对 `state.agents[席] === 'replaced'` 的席做逐字节比对（渲染 vs 盘上），其余只查文件存在 | `tools/docgen/cli.mjs:100-110`；`tools/docgen/state.json:3-19`（15 席全 `replaced`） |
| 3 | 两份 producer 边界句现为同一文件里的两个长字符串常量；`boundaryBySeat` 只登记两席 | `tools/docgen/components/patternRegistry.mjs:14`（审计）/ `:15`（侦探）/ `:30-33` |
| 4 | `agentData` 的展开式是 `{ tools, ...(boundaryBySeat[name] ? {boundary} : {}), ...s }` —— **`...s` 在最后**，条目自带 `boundary` 会静默覆盖映射取值 | `tools/docgen/components/agentData.mjs:263-265` |
| 5 | `evidence-reader` 自带一行边界句（不走 `DEFAULT_BOUNDARY`、也不在 `boundaryBySeat`），故 `DEFAULT_BOUNDARY` 的实际消费席 = 15 − 2 producer − 1 evidence-reader = **12** | `tools/docgen/components/agentData.mjs:237`、`renderAgent.mjs:25`；spec v2 §3.6 已写明「13 席（= 15 − 2）与 12 席（= 15 − 2 − 1）是两个口径，不矛盾」 |
| 6 | 23 项路径清单现有副本 = 5 处：两份边界常量、测试里的 `FORBIDDEN_PATHS` 字面数组、两张卡（渲染产物） | `patternRegistry.mjs:14|15`、`tools/docgen/test/tool-tiers.test.mjs:36-41`、`agents/reviewer-audit.md:98`、`agents/detective-observer.md:57` |
| 7 | 现有测试 `tool-tiers.test.mjs` **import 了 `BOUNDARY_COMMAND`**（`:12`）并在 `S5-TC-E05` 断言它非空（`:721-723`）；同批波及面还有 `S5-TC-B08`（`:374-380`）与 `S5-TC-B14`（以前置「`BOUNDARY_COMMAND` 仍可导入」+ `boundary = BOUNDARY_COMMAND` 构造，见 `docs/superpowers/specs/2026-10-25-s5-tool-tiers-design-testcase.md:736`） | 出处逐个拆开：import = `tools/docgen/test/tool-tiers.test.mjs:12`；`S5-TC-B08` = 同文件 `:374-380`；`S5-TC-E05` = 同文件 `:721-723`；`S5-TC-B14` = S5 testcase `:736`。spec v8 §3.6 已把四处列全并给口径（判据与前置必须改判、历史叙述句保留），§6 步骤 4 要求同批改 |
| 8 | `exitCodeFor` 是**封闭映射表**：表里没有的码会抛，`main` 捕获后兜底 exit **2**（不是 1）——新增的五个 **CLI** 码必须先加进表，否则「按 §7 期望 exit 1」必红（第六码 `RenderNotEquivalent` 由施工期断言发射，**不进表**，见 §7） | `tools/docgen/components/validateAgentData.mjs:4-22`、`tools/docgen/cli.mjs:583-596` |
| 9 | `cli.mjs` 子命令分派是 if 链，未知子命令报 `UnsupportedKind`（exit 2）；`parseArgs` 的 flag 白名单按子命令给（`DIFF_FLAGS` / `REPLACE_FLAGS`） | `tools/docgen/cli.mjs:499-521`、`:550-582` |
| 10 | 测试副本工具 `withRepoCopy` 只复制 `tools/docgen`、`tools/execution-matrix`、`rules`、`agents`（**无 `docs/`、`.git`、`skills/`、`scripts/`**，= spec §5 测试环境约束 `spec:165`）；`runCli` 注入 `DOCGEN_DRAFTS_DIR` | `tools/docgen/test/support/dev-workflow-checks.mjs:217-235`；`spec:165` |
| 11 | `tools/docgen/templates/` 现只有 `agent.md.tpl` / `agent-handwritten.md.tpl` / `rule.md.tpl`；`boundary.md.tpl` 与 `policy/` 目录、`components/renderBoundary.mjs` 均不存在 | `tools/docgen/templates/` 目录清单 |
| 12 | **改造前基线尚未落盘**：`fixtures/capability-baseline.json` 不存在，基线 commit 也不写死——由 spec §6 步骤 0 在施工开始时记录（本文件只断言「基线来源可复算 / 同源 / 不等于 HEAD」，不硬编码哈希或 SHA） | spec `:169`；`tools/docgen/fixtures/` 现无该文件 |
| 13 | `docs/superpowers/reviews/` 目录**当前不存在**；`<YYYY-MM-DD-HHMM>-s6-eval/` 与其中四本账单由本轮评估新建（进 git） | 目录清单（`docs/superpowers/` 下现只有 `specs/` / `plans/` / `retro/`）；spec `:239` |
| 14 | **历史口径（v8 已关闭）**：spec v7 及以前在 V-1 段 ④ 写过「禁止命令集 **22 条**」，而按 §0.2 逐组枚举 = 5 + 9 + 7 + 5 = **26 条**（再把 `network` 的 **3 个 `verbs` 字面成员**算进去 = 29）——22 的来源始终不可复算。**spec v8 已把该处改为「由 `policy --dump` 现算」**（`spec:204`），故本文件**不再写死任何条数**：逐项探针的分母一律由定义层现算并记入 `capability-diff.md`（`network` 的 3 个 verb 成员也照此现算，见 §0.2） | spec `:202`（v8 现算口径）；22 / 26 / 29 三口径的差别只留作复核注，不再作为判据输入 |

**测试文件落点约定**：新用例全部聚在 `tools/docgen/test/policy-pure-source.test.mjs`（**新文件**）。凡需改动盘上文件才能构造的场景（改定义层、改配置层、改模板、删一条命令），一律在 `withCopy((d) => { … })` 副本内执行（= `withRepoCopy(fn)` 的包装），**不得触碰真仓库**。涉及 `skills/` 与 `scripts/` 的断言（E05 读 spec 文本除外）不得放副本内（副本不含这两个目录，见事实 10）。

### 0.1 23 项路径 → 6 组的覆盖账（A04 / A06 / E03 / I02 共用同一份明细，不另写第二份）

| 组 ID | 成员（按卡面顺序） | 项数 |
|---|---|---|
| `code` | `代码`、`测试`（合写一项盖 2 项） | 2 |
| `governance` | `rules/`、`skills/`、`agents/` | 3 |
| `docs.input` | `docs/prd/`、`spec / plan`（正则项） | 2 |
| `build` | `tools/`、`scripts/`、`配置与依赖清单` | 3 |
| `ledger` | `docs/after/`、`docs/handoffs/`、`docs/reports/`、`docs/superpowers/retro/` | 4 |
| `workspace` | `.superpowers/`、`lessons/`、`*.local.md`、`**/ledger.md`、`.trae/`、`skills-lock.json`、`node_modules/`、`tools/docgen-spike/.tmp-test/`、`其他评审目录` | 9 |
| **卡面成员合计** | 23（= 定义层点名 22 + `spec / plan`） | **23** |
| **数组元素** | 21（`代码、测试` 合写为 1 个元素，盖 2 项） | **21** |
| **`pattern` 项** | 1（`spec / plan`，以正则源串表达，不进数组） | **1** |

> **口径（spec §3.2 `spec:55` / §8 V-1③ `spec:204` 写死）**：`pathGroups` = **6 组**，共 **21 个数组元素 + 1 个 `pattern` 项 = 22 个定义层点名（卡面 23 项）**。`spec / plan` 以 `pattern` 字段表达（`/spec\s*\/\s*plan/`），不进数组（否则 `spec/plan` 无空格写法会假红）；`代码、测试` 合写一条（拆成单字会变成恒真的泛词）。两项口径与 S5 spec §3.3③ 原文同形。**三个数各有分工（三口径不可互换）**：**数组元素 = 21**（A04 断它）；**定义层点名 = 22**（= 21 个数组元素 + 1 个 `pattern` 项，`pathItems()` 断它，用于「定义层有几个值」）；**卡面成员 = 23**（= 22 再按 `、` 切 `代码、测试` 得 23，`pathTokens()` / 槽 10 断它，`spec:89` = 六组展开 ∪ `spec / plan`）。
> **检测盲区不在这 23 项里**：`.session/` 不在任何组（spec v8 §3.2 的 `DETECTION_BLIND_SPOTS = ['.session/','.superpowers/','lessons/']` 是**独立导出**，不进 `pathGroups`、故不进 ③ 段禁写清单），由槽 11 `{{DETECTION_PATHS}}` 单独注入（J01 ⑦ 断言）。

### 0.2 命令组覆盖账（A02 / A03 / A06 共用）

| 类别 | 组 ID | verbs（按卡面顺序） |
|---|---|---|
| 允许 | `check.local` | `npm run check`、`node scripts/check-all.mjs`、`node scripts/doc-name.mjs --check`、`node scripts/skill-dir.mjs`、`node skills/review-log/scripts/time.mjs` |
| 允许 | `git.read` | `git --no-optional-locks status --porcelain`、`… diff`、`… show`、`… log`、`… reflog show`（均禁 `--output`） |
| 允许 | `docgen.read` | `node tools/docgen/cli.mjs gate`、`… check-agents`、`… diff --kind agent --name <席>`、`… draft ls` |
| 禁止 | `docgen.write` | `draft`（生成）/ `draft rm` / `draft ensure` / `baseline --write` / `replace` |
| 禁止 | `git.write` | `commit` / `push` / `checkout` / `reset` / `restore` / `clean` / `rm` / `reflog expire` / `reflog delete` |
| 禁止 | `fs.write` | `>` / `>>` / `Set-Content` / `Out-File` / `--output` / `--apply` / `--write` |
| 禁止 | `env.assign` | `export VAR=…` / `$env:VAR=…` / `set VAR=…` / `setx VAR …` / `VAR=… node …` |
| 禁止 | `network` | `安装` / `网络写` / `node -e`（**恰三项**；`下载类命令` 是 `purpose` 层的形态描述，**不是 verb**） |

> **口径（spec v8 §3.2 / V-4）**：允许组 **3**、禁止组 **5**（V-4 写「命令 8 组」= 3 + 5，两者一致）；**席级组** `seatGroups`（键 = `seat:<slug>.extra`）**本轮为空集**——B11 / D01 / H05 只在副本内临时登记，真仓库必须为空。A02 断 8 组 + `seatGroups` 空集，A03 断 5 个禁止组 ID。
> **`network` 的 verbs 恰三项、全部进逐项探针分母**：spec v8 §3.2（`spec:54`）写死 `network.verbs` = `安装` / `网络写` / `node -e`（**三条都是字面成员、可逐项复算**）；`下载类命令` 是 `purpose` 层的形态描述（「安装 / 网络写 / `node -e`（不开放）/ 下载类命令」整句归 `purpose`），**不进 `verbs`**。口径一句话：**形态描述进 `purpose`，`verbs` 只放可逐项复算的字面成员**。故 I02 的分母 = 允许组 / 禁止组的**字面 verb**（由 `policy --dump` 现算，含 `network` 的 3 条）+ 23 路径 + 5 禁止组 ID；`network` 的这 3 条都不是合法 ID 形态（`安装` / `网络写` 非 ASCII 起首、`node -e` 含空格）→ 期望码一律 `LiteralInConfig`（由 §0.3 的 `expectedRefCode` 现算，不写死）。A02 另断「`network.verbs` 恰三项 + `下载类命令` 只在 `purpose` 里」，防成员被重新塞回 `verbs`（历史三口径 22 / 26 / 29 的差别见事实 14）。

### 0.3 共用前提（P0 前置）：模块顶层 helper（一）——取数 / 副本 / 派生 / 文本工具

> 在 `tools/docgen/test/policy-pure-source.test.mjs` **模块顶层声明一次**，不得抄进各 `test()` 回调（否则回调间互相 `ReferenceError`）。**凡判据里出现的符号，本节或 §0.4 必有可执行实现**——不存在「只有签名 + 注释」的 helper（议会 #3 F19 / QA-13）。

```js
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { withRepoCopy, runCli, runEsm } from './support/dev-workflow-checks.mjs';
import { agentData } from '../components/agentData.mjs';
import { patternRegistry, DEFAULT_BOUNDARY, toolsForSeat } from '../components/patternRegistry.mjs';
import { exitCodeFor } from '../components/validateAgentData.mjs';
import { BASELINE_RULES, agentPaths } from '../components/baseline.mjs';
import { renderBoundary } from '../components/renderBoundary.mjs';
import { SEAT_POLICY } from '../policy/seat-policy.mjs';
import * as CAP from '../policy/definitions/capabilities.mjs';
import * as CMD from '../policy/definitions/commands.mjs';
import * as PTH from '../policy/definitions/paths.mjs';
import * as ART from '../policy/definitions/artifacts.mjs';
import * as SEATS from '../policy/definitions/seats.mjs';   // SEATS.SEATS：slug → {display, clause?, escalationWriter?: {slug, artifact}}；SEATS.SEAT_NAMES = Object.keys(SEATS.SEATS).filter(k => k !== '__default__')（`__default__` 是保留键、不可授予，spec:57 / :105）
import { TIERS, tierOfCapabilities } from '../policy/definitions/tiers.mjs';   // 档位表下沉（spec:53）：`export const TIERS = {readOnly,sdet,command,producer}`——**`TIERS` 本身就是档位对象**（不是 `TIERS.tiers`），**值是工具名**（`TIERS.producer` = `['Read','Glob','Grep','Write','Edit','RunCommand']`，不是 capability ID）；`tierOfCapabilities(caps)` 同模块导出 = 「caps 展开后的工具集 == `TIERS[档]`」的唯一样
import { factsFromText, factsFromBaselineText, FACTS_KEYS, SEG5 } from './support/capability-baseline.mjs';   // **唯一**抽取实现（两种口径：`factsFromBaselineText` = 基线端旧卡切分 / `factsFromText` = 改造后字典匹配，`spec:169` ④）；落抽取器，本文件只 import，不另写第二份；抽取器不得 import policy/
import { rateFromRecords } from '../../execution-matrix/rating.mjs';   // 置信度档位唯一口径（N=3，spec:256 复用）

const ROOT = process.cwd();            // `node --test` 以仓库根为 cwd；不得写成测试文件相对路径
const PROBE_SEAT = 'senior-sdet';      // I 组逐项探针默认席（read+write、无组、无产物）
// I01 的探针席必须按 capability 选：`senior-sdet` 是 sdet 档（read+write、**无 exec**），
// 把 `RunCommand`（exec）挂在它下面会撞不变量 9（spec:113）→ 必红（后端复核第 2 轮 BE-6）。
// `reviewer-audit` 已含 exec（配置零改动即应绿）。
const probeSeatOf = (cap) => (cap === 'exec' ? 'reviewer-audit' : PROBE_SEAT);
const ID = /^[a-z][a-z0-9.:-]*$/;      // = spec §3.4 归码谓词（与实现同一口径，不另造）
const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex');
// 只剥注释：配置层若用注释藏路径/命令，仍需判红 → 调用方自行决定用剥前还是剥后文本
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

function editInDir(dir, rel, fn) {
  const p = join(dir, rel);
  writeFileSync(p, fn(readFileSync(p, 'utf8')), 'utf8');
}
// withRepoCopy 的真实签名是 withRepoCopy(fn)（dev-workflow-checks.mjs:217-227，内部 finally 删副本）
// → 所有「拿副本路径」的写法一律走 withCopy((d) => { … })；不得写 `const d = withRepoCopy()`
const withCopy = (fn) => withRepoCopy(fn);
function dumpPolicy(dir = ROOT) {
  const r = runCli(dir, ['policy', '--dump']);
  assert.equal(r.status, 0, r.stderr);
  return { r, json: JSON.parse(r.stdout) };
}
const renderBoundaryIn = (dir, seat) => {
  const r = runEsm(dir, `import {renderBoundary} from './tools/docgen/components/renderBoundary.mjs';console.log(renderBoundary(${JSON.stringify(seat)}))`);
  assert.equal(r.status, 0, `渲染失败：${seat}\n${r.stderr}`);
  return r.stdout.replace(/\n$/, '');
};
// 递归取目录下全部文件的 sha256（path → hash）；用于「不写盘 / 只改一个文件」类断言
function dirHashes(dir) {
  const out = {};
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) Object.assign(out, dirHashes(p));
    else out[p.replace(/\\/g, '/')] = sha(readFileSync(p, 'utf8'));
  }
  return out;
}
// 「改动文件集」（E02 用）：键 = `tools/docgen` 下的相对路径 —— 副本目录名不同，不能直接比绝对路径
const toolHashes = (dir) => Object.fromEntries(Object.entries(dirHashes(join(dir, 'tools/docgen')))
  .map(([p, h]) => [p.replace(/\\/g, '/').split('/tools/docgen/')[1], h]));
const changedFiles = (a, b) => {
  const x = toolHashes(a); const y = toolHashes(b);
  return Object.keys({ ...x, ...y }).filter((k) => x[k] !== y[k]).sort();
};

// ---- 副本内构造：改配置某席三键 / 在定义层登记席级组（只动副本，真仓库一律不改）----
function setSeatPolicy(dir, seat, { capabilities, allowGroups, artifacts }) {
  editInDir(dir, 'tools/docgen/policy/seat-policy.mjs', (src) => {
    const key = `'${seat}'`;
    const i = src.indexOf(key);
    assert.ok(i >= 0, `配置层未见席 ${seat}`);
    const open = src.indexOf('{', i + key.length);
    let depth = 0;
    let end = -1;
    for (let p = open; p < src.length; p++) {
      if (src[p] === '{') depth++;
      else if (src[p] === '}' && --depth === 0) { end = p; break; }
    }
    assert.ok(end > open, `席 ${seat} 的配置块不闭合`);
    const body = ` capabilities: ${JSON.stringify(capabilities)}, allowGroups: ${JSON.stringify(allowGroups)}, artifacts: ${JSON.stringify(artifacts)} `;
    return `${src.slice(0, open)}{${body}}${src.slice(end + 1)}`;
  });
}
function insertInObject(dir, rel, decl, entry) {
  editInDir(dir, rel, (src) => {
    const i = src.indexOf(decl);
    assert.ok(i >= 0, `定义层未见 ${decl}（spec §3.2 布局未落？）`);
    const open = src.indexOf('{', i);
    return `${src.slice(0, open + 1)}\n  ${entry}${src.slice(open + 1)}`;
  });
}
const grantGroup = (dir, seat, group) => {
  const cur = SEAT_POLICY[seat] ?? SEAT_POLICY.__default__;
  setSeatPolicy(dir, seat, { ...cur, allowGroups: [...new Set([...cur.allowGroups, group])] });
};
// I01 的「合法使用该项」最小改动：命令 → 挂该组；产物 → 加进 artifacts；工具 → 加该 capability
function applyLegalGrant(dir, p) {
  const cur = SEAT_POLICY[p.seat] ?? SEAT_POLICY.__default__;
  setSeatPolicy(dir, p.seat, {
    capabilities: [...new Set([...cur.capabilities, ...(p.cap ? [p.cap] : [])])],
    allowGroups: [...new Set([...cur.allowGroups, ...(p.group ? [p.group] : [])])],
    artifacts: [...new Set([...cur.artifacts, ...(p.kind === 'artifact' ? [p.id] : [])])],
  });
}
const policyOf = (n) => (Object.hasOwn(SEAT_POLICY, n) ? SEAT_POLICY[n] : SEAT_POLICY.__default__);

// ---- 判据侧派生（禁止手抄）：路径清单 / 允许字面量集全部从定义层取 ----
// pathItems() = **22**（21 个数组元素 + 1 个 pattern 源串）=「定义层有几个值」，**不是** ③ 段成员数（见 §0.1）
const pathItems = () => [...Object.values(PTH.pathGroups).flat(), PTH.FORBIDDEN_SPEC_PLAN.pattern.source];
// pathTokens() = **23**（③ 段成员数）：`代码、测试` 在卡面写作两项，故按「、」再切一次；`spec / plan` 恒在末位
const pathTokens = () => [...Object.values(PTH.pathGroups).flat().flatMap((x) => x.split('、')), 'spec / plan'];
// 「一份路径清单副本」= 单文件命中 ≥ 20 项。用它代替「逐项 git grep」：
// 逐项 grep 会被 `tools/`、`rules/` 这类高频片段带出上百无关命中（全部是代码里的路径拼接），无法判定
const listCopies = (root, files, items = pathTokens(), threshold = 20) =>
  files.filter((f) => items.filter((it) => readFileSync(join(root, f), 'utf8').includes(it)).length >= threshold);

// closed-world 允许集（spec §3.5 不变量2 / §3.7 / §8 V-3）：配置层出现的**每个**字符串字面量都必须是登记 ID
// 组成 = capability ID ∪ 命令组 ID（允许 3 + 禁止 5）∪ 席级组 ID ∪ 产物文件 ID ∪ 席 slug（SEAT_NAMES 的元素）∪ 保留键 `__default__`
// 说明：席 slug 是 SEAT_POLICY 的**对象键**（spec:128 键不计入字面量），但原始扫串会把键一起抓出来，故仍须列入允许集
const ALLOWED_LITERALS = () => new Set([...Object.keys(CAP.capabilities),
  ...Object.keys(CMD.commandGroups), ...Object.keys(CMD.forbiddenGroups), ...Object.keys(CMD.seatGroups ?? {}),
  ...Object.keys(ART.artifacts), ...SEATS.SEAT_NAMES, '__default__']);
// 取「所有引号字面量」：先把反引号统一成单引号（配置层若用模板串同样要查），再抽 '…'
const stringLiterals = (s) => [...stripComments(s).replace(/`/g, "'").matchAll(/'([^'\n]*)'/g)].map((m) => m[1]);

// ---- 文本断言小工具（J 组 / K 组共用）----
const countIn = (text, needle) => (needle instanceof RegExp
  ? (text.match(new RegExp(needle.source, needle.flags.includes('g') ? needle.flags : `${needle.flags}g`)) ?? []).length
  : text.split(needle).length - 1);
// ⑤ 段 = 从「越[界权]后果与限度」到渲染结束（先切段再断言，防 ②/④ 段的同名措辞串味 —— 议会 #3 F24）
// 现文一律是「**越界后果与限度**」：spec v9 起 §3.4 五段结构（spec:76）与两张卡（`agents/reviewer-audit.md:102` /
// `agents/detective-observer.md:61`）都写「越界」；只有 S5 spec §3.3 的**历史原句**写「越权」——故锚点两写法都认，
// 但注释与报文以「越界」为准（见本文件 §7 G-15）
// ⑤ 段锚点 `SEG5` 由抽取器导出（`import { SEG5 }`）——**只有一份**，不在本文件重复声明（否则同模块重名）
const seg5 = (text) => { const m = String(text).match(SEG5); return m ? text.slice(m.index) : ''; };
const card = (name) => readFileSync(join('agents', `${name}.md`), 'utf8');
// 卡面边界节 = `## 边界` 之后到卡尾（两张 producer 卡的该节都是最后一节，已核 `agents/` 全 15 张）
const cardBoundary = (text) => {
  const i = text.indexOf('## 边界');
  return i < 0 ? '' : text.slice(i + '## 边界'.length).replace(/^\r?\n+/, '').trim();
};
const golden = () => JSON.parse(readFileSync('tools/docgen/fixtures/boundary-golden.json', 'utf8'));
const goldenOf = (seat) => golden()[seat];
// 黄金换代后的「**当前比对键**」（`spec:198`）：同席中 `<席>@<轮次>` 轮次**最大者**；无换代键则取基线键。
// 只决定「拿哪个键做定位线索」，不改变任何通过判据（V-2 仍只作定位）。B01 ④ / C01 ⑤ / C02 ⑤ 共用。
const goldenKeyFor = (seat, g = golden()) => {
  const rounds = Object.keys(g)
    .map((k) => [k, k.match(new RegExp(`^${seat}@(\\d+)$`))])
    .filter(([, m]) => m)
    .sort((a, b) => Number(b[1][1]) - Number(a[1][1]));
  return rounds.length > 0 ? rounds[0][0] : seat;
};
const goldenCurOf = (seat, g = golden()) => g[goldenKeyFor(seat, g)];
// 施工期黄金断言（`RenderNotEquivalent` 的**测试侧**发射点：不是 CLI 码，§7）
function assertGolden(seat, text) {
  if (sha(text) === goldenOf(seat)) return;
  const cardLines = cardBoundary(card(seat)).split('\n');
  const firstDiff = String(text).split('\n').find((l, i) => l !== cardLines[i]) ?? '<行数不同>';
  throw new Error(`RenderNotEquivalent: ${seat}:${firstDiff}`);
}

// ---- 逐项探针的记账（I 组共用；I03 断言键集与执行次数）----
// 键带席名（`kind:id@seat`）：同一 id 挂不同席是**两项**（`exec` 探针挂 `reviewer-audit`、其余挂 `senior-sdet`，
// 后端复核第 2 轮 BE-6）——不带席名会让两项互相覆盖，`每项恰 1 次` 就判不出来。
const probesRun = new Map();
const noteProbe = (p) => { const k = `${p.kind}:${p.id}@${p.seat}`; probesRun.set(k, (probesRun.get(k) ?? 0) + 1); };
// §3.4 归码优先级：形态不合 ID → LiteralInConfig；形态合法但未登记 → UnknownPolicyRef
const expectedRefCode = (v) => (ID.test(v) ? 'UnknownPolicyRef' : 'LiteralInConfig');
```

> `pathItems()` / `pathTokens()` 本身是**判据侧**的派生，不是策略副本：两者都从 `PTH.pathGroups` + `FORBIDDEN_SPEC_PLAN` 现算，**不再有 `PATH_23` 字面量**（议会 #3 F12 / QA-14：手抄 21 项会让新测试文件自己变成第 4 份副本，并打破 E03 的「恰 3 文件」）。渲染侧仍以定义层为唯一真相。

### 0.4 共用 helper（二）：五段事实抽取 / 判定函数 / 账单读取（H / I / J / K 组共用）

> 与 §0.3 同样在模块顶层声明一次。**唯一抽取实现落抽取器** `tools/docgen/test/support/capability-baseline.mjs`（本文件只 `import`，不另写第二份）。**抽取器不得 import `policy/`**（否则「空差」恒真，见 H01 ⑤ / H07 ③）——字典由调用方按目标目录注入。
> **两端字典来源写死（`spec:169` §6 步骤 0 ④）**：**基线端**（步骤 0，尚无定义层）由 `factsFromBaselineText` 按**旧卡文本切分**产出（反引号项 / 顿号项 / 分号项 / ` / ` 工具项，**不注入任何字典**）；**改造后端**由 `factsFromText(渲染文本, 定义层字典)` 做存在性匹配。**两端可比的前提** = 「基线成员 ⊆ 定义层字典」（H02 ⑤' 断言，不满足即红并人工复核）。
> **取项方式（`spec:204` V-1，仅改造后端）= 存在性匹配**：以定义层成员为字典在渲染文本里逐项 `text.includes(member)`，返回命中集合；**不按反引号切、不靠分隔符猜**。`DOCGEN_*` 属说明性固定文本（登记白名单、**不进成员集合**）、`安装` / `网络写` / `node -e` 是 `network.verbs` 的**实际成员**——两者都由「字典里有没有」自然区分（基线端则靠切分 + 形态过滤，见下方实现）。
> **段切规则（写死，spec §6 步骤 0 ④ = `spec:169`）**：按五段标题切段（`**档位事实**` / `**只允许写**` / `逐项点名：` / `**命令默认拒绝**` / `**越界后果与限度**`——段名以现文「越界」为准，S5 spec §3.3 的历史原句写「越权」，锚点两写法都认）。
> **黄金样本** = `tools/docgen/fixtures/capability-baseline.golden.json`（审计席 8 字段，供审计独立复算，不由被测代码生成）。

```js
// 五段事实集合（spec §8 V-1 = `spec:204`）的两端口径必须同形才能做集合 diff。
// 段 ⑤（关键子句存在性）不做集合 diff，归 J 组；故 FACTS 只含 ①–④ 的 8 个字段（`FACTS_KEYS` 由抽取器导出、本文件 import）。

// ---- ① 抽取器（**唯一实现**；落 `tools/docgen/test/support/capability-baseline.mjs`，只读文本、不 import policy/）----
// 取项方式（`spec:204` V-1）= **存在性匹配**：拿字典成员逐项 `text.includes(member)` 返回**命中集合**；
// 不按反引号切、不靠分隔符猜 —— `DOCGEN_*`（说明性固定文本）与 `安装` / `网络写` / `node -e`（`network.verbs` 的成员）
// 的差别只取决于「字典里有没有」。字典由调用方注入（抽取器不 import policy/ → 基线不会被改造后的数据带偏）。
export const FACTS_KEYS = ['tools','tier','canWrite','mustNotWrite','forbiddenPaths','allowCmds','denyCmds','envForms'];
export const SEG5 = /越[界权]后果与限度/;   // ⑤ 段锚点（两写法都认）：本文件 `seg5()` 与本模块共用同一份
// 段切（spec §6 步骤 0 ④ = `spec:169`）：按五段标题切；段名「越界」/「越权」两写法都认
export function segments(text) {
  const t = String(text).replace(/\r\n/g, '\n');
  const between = (from, to) => {
    const i = t.indexOf(from);
    if (i < 0) return '';
    const j = to ? t.indexOf(to, i + from.length) : -1;
    return t.slice(i + from.length, j < 0 ? undefined : j);
  };
  const i4 = t.indexOf('**命令默认拒绝**');
  const i5 = t.search(SEG5);
  const d4 = i4 < 0 ? '' : t.slice(i4 + '**命令默认拒绝**'.length, i5 < 0 ? undefined : i5);
  const iB = d4.indexOf('**禁止**');
  return {
    tier: between('**档位事实**', '**只允许写**'),        // ① 档位事实
    write: between('**只允许写**', '**除上述落点外'),      // ② 写入范围
    paths: between('逐项点名：', '；兜底句'),              // ③ 明确禁止（路径清单，23 项）
    allow: iB < 0 ? d4 : d4.slice(0, iB),                // ④ 允许段
    deny: iB < 0 ? '' : d4.slice(iB),                    // ④ 禁止段
  };
}
export function factsFromText(text, dict) {
  const s = segments(text);
  const hit = (members, scope) => [...new Set(members.filter((m) => String(scope ?? '').includes(m)))];
  // tier 是标量不是集合：只在「`<档位>` 档」这一形态上取，且必须恰好命中一个（四档：`spec:53`）
  const tierHit = dict.tiers.filter((t) => new RegExp('`' + t + '`\\s*档').test(s.tier));
  const iFW = Math.max(s.write.indexOf('**禁止写**'), 0);
  const canWrite = hit(dict.artifacts, s.write.slice(0, iFW));
  const mustNotWrite = hit(dict.artifacts, s.write.slice(iFW));
  return {
    tools: hit(dict.tools, s.tier),
    tier: tierHit.length === 1 ? tierHit[0] : '',
    canWrite,
    mustNotWrite: mustNotWrite.filter((x) => !canWrite.includes(x)),
    forbiddenPaths: hit(dict.paths, s.paths),
    allowCmds: hit(dict.allowVerbs, s.allow),
    denyCmds: hit(dict.denyVerbs, s.deny),
    envForms: hit(dict.envVerbs, s.deny),
  };
}

// ---- 基线端（`spec:169` §6 步骤 0 ④）：旧卡文本切分，**不注入字典**（步骤 0 尚无定义层）----
// 切分口径写死四类：反引号项 / 顿号项 / 分号项 / ` / ` 工具项；再叠加**形态过滤**（过滤的是形态，不是字典）。
const spans = (t) => [...String(t ?? '').matchAll(/`([^`\n]+)`/g)].map((m) => m[1].trim());
const splitPlain = (t) => String(t ?? '').split(/[、；;]| \/ /)
  .map((x) => x.trim().replace(/^`|`$/g, '').trim())
  .filter((x) => x && x.length <= 12 && !/[：:。，,*＊（）()]|[@#]/.test(x));
const ENV_FORM = /^(export |\$env:|set |setx |VAR=)/;
const CMD_ITEM = /^(git|npm|node) /;
export function factsFromBaselineText(text) {
  const s = segments(text);
  const run = s.tier.match(/[A-Z][A-Za-z0-9]*(?: \/ [A-Z][A-Za-z0-9]*)+/);   // ` / ` 工具项
  const tier = (s.tier.match(/`([A-Za-z][\w-]*)`\s*档/) ?? [])[1] ?? '';
  const md = (xs) => xs.filter((x) => /^[\w.<>-]+\.md$/.test(x));            // 产物名：不得含 `/`（否则把 gate-record 路径当成产物）
  const iFW = Math.max(s.write.indexOf('**禁止写**'), 0);
  const canWrite = md(spans(s.write.slice(0, iFW)));
  const mustNotWrite = md(spans(s.write.slice(iFW))).filter((x) => !canWrite.includes(x));
  const allowCmds = [...new Set(spans(s.allow))].filter((x) => CMD_ITEM.test(x));   // 允许命令全在反引号内
  const denyAll = [...new Set([...spans(s.deny), ...splitPlain(s.deny)])]
    .filter((x) => x !== 'DOCGEN_*');                                        // 说明性固定文本，不进成员集合
  return {
    tools: run ? run[0].split(' / ') : [],
    tier,
    canWrite,
    mustNotWrite,
    forbiddenPaths: s.paths.split('、').map((x) => x.trim().replace(/^`|`$/g, '')).filter(Boolean),   // ③ 段是纯清单
    allowCmds,
    denyCmds: denyAll.filter((x) => !ENV_FORM.test(x)),                      // 环境变量形态单列，不重复计数
    envForms: denyAll.filter((x) => ENV_FORM.test(x)),
  };
}
```

> **以上 = `tools/docgen/test/support/capability-baseline.mjs` 的全部内容**（抽取器：只读文本、**不得 import `policy/`**；两种口径同文件——`factsFromBaselineText` 供**基线端**（旧卡切分、无字典）、`factsFromText` 供**改造后端**（字典由调用方按目标目录注入））；**以下为本文件（`policy-pure-source.test.mjs`）的测试侧 helper**——两个抽取函数只 `import`，不另写第二份。

```js
// ---- ② 字典（从**目标目录**现算）：副本改了定义层，字典必须跟着变，否则 H05「多一项」测不出 ----
// `denyVerbs` **只剔除 `env.assign`**（该组由 `{{ENV_FORMS}}` 单独注入、`{{DENY_GROUPS}}` 渲染时剔除，
// `spec:87-88`）→ 禁止命令集与环境变量形态两段各自可核，不重复计数。
// 其余 4 个禁止组的 verbs **全部计入**（含 `network` 的 3 个字面成员 `安装` / `网络写` / `node -e`，`spec:54`；
// `下载类命令` 只在 `network.purpose` 里，不进 `verbs` → 不进本字典）。
function probeDict(dir = ROOT) {
  const r = runEsm(dir, `import * as CAP from './tools/docgen/policy/definitions/capabilities.mjs';
import { TIERS } from './tools/docgen/policy/definitions/tiers.mjs';
import * as CMD from './tools/docgen/policy/definitions/commands.mjs';
import * as PTH from './tools/docgen/policy/definitions/paths.mjs';
import * as ART from './tools/docgen/policy/definitions/artifacts.mjs';
const groups = Object.values(PTH.pathGroups).flat();
console.log(JSON.stringify({
  tools: Object.values(CAP.capabilities).flat(),
  tiers: Object.keys(TIERS),
  artifacts: Object.keys(ART.artifacts),
  paths: [...groups.flatMap((x) => x.split('、')), 'spec / plan'],
  allowVerbs: Object.values(CMD.commandGroups).flatMap((g) => g.verbs),
  denyVerbs: Object.entries(CMD.forbiddenGroups).filter(([g]) => g !== 'env.assign').flatMap(([, g]) => g.verbs),
  envVerbs: [...CMD.forbiddenGroups['env.assign'].verbs],
}));`);
  assert.equal(r.status, 0, `字典取数失败（${dir}）\n${r.stderr}`);
  return JSON.parse(r.stdout);
}

// dump 端（**只作交叉核对**）：12 槽 → 同形事实。**槽序 = spec §3.4 表行序，第 n 槽 → index n−1**（`spec:76` / `spec:162`；
// 卡面首次出现顺序不参与判据）。本函数用到的槽：2 TIER → index 1 / 3 CAPABILITIES → index 2 / 4 ARTIFACTS → index 3
// / 7 ALLOW_GROUPS → index 6 / 8 DENY_GROUPS → index 7 / 9 ENV_FORMS → index 8 / 10 FORBIDDEN_PATHS → index 9。
// 注意：`mustNotWrite` 不属 12 槽（它是模板固定片段，属 §3.4 纯度规则 2 的单点类成员）→ dump 端记 null，diff 时跳过。
function factsFromDump(json, seat, dict) {
  const e = json.seats[seat].expanded;
  const hit = (members, scope) => [...new Set(members.filter((m) => String(scope ?? '').includes(m)))];
  const tier = String(e[1] ?? '').trim();                       // 槽 2 TIER
  return {
    tools: hit(dict.tools, e[2]),                               // 槽 3 CAPABILITIES
    tier: dict.tiers.includes(tier) ? tier : '',
    canWrite: hit(dict.artifacts, e[3]),                        // 槽 4 ARTIFACTS
    mustNotWrite: null,
    forbiddenPaths: hit(dict.paths, e[9]),   // 槽 10 FORBIDDEN_PATHS：单层清单（`、` 连接），成员内部可自带 ` / `（如 `spec / plan`）
    allowCmds: hit(dict.allowVerbs, e[6]),                      // 槽 7 ALLOW_GROUPS
    denyCmds: hit(dict.denyVerbs, e[7]),                        // 槽 8 DENY_GROUPS
    envForms: hit(dict.envVerbs, e[8]),                         // 槽 9 ENV_FORMS
  };
}
// minus = 改造后缺（`-`，能力丢了）；plus = 改造后多（`+`，越权）
function diffFacts(before, after) {
  const out = { minus: [], plus: [] };
  for (const k of FACTS_KEYS) {
    if (before[k] == null || after[k] == null) continue;   // dump 端不表达 mustNotWrite → 交叉核对跳过该键
    const b = new Set(before[k]);
    const a = new Set(after[k]);
    out.minus.push(...[...b].filter((v) => !a.has(v)).map((v) => `${k}: ${v}`));
    out.plus.push(...[...a].filter((v) => !b.has(v)).map((v) => `${k}: ${v}`));
  }
  return out;
}
// V-2 降级后的唯一判定函数：**只吃一个对象、且结构里没有哈希位**（red 不等于 fail、green 不等于 pass）
const verdict = ({ minus, plus }) => (minus.length === 0 && plus.length === 0 ? 'pass' : 'fail');

// ---- 账单读取（四本账落 docs/superpowers/reviews/<…>-s6-eval/）----
const evalDir = () => {
  const base = join('docs', 'superpowers', 'reviews');
  const dirs = existsSync(base) ? readdirSync(base).filter((d) => /-s6-eval$/.test(d)) : [];
  assert.equal(dirs.length, 1, `docs/superpowers/reviews 下应有且仅有 1 个 *-s6-eval 目录（实得 ${dirs.length}）`);
  return join(base, dirs[0]);
};
function parseTable(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().startsWith('|'));
  if (lines.length < 3) return [];
  const cols = lines[0].split('|').slice(1, -1).map((s) => s.trim());
  return lines.slice(2).map((l) => Object.fromEntries(l.split('|').slice(1, -1).map((s, i) => [cols[i], s.trim()])));
}
const rowsOf = (file) => parseTable(readFileSync(file.includes('/') ? file : join(evalDir(), file), 'utf8'));
// ab-score.md 的读法（K01 的固定列不变；4 条记录 = **最后一轮**的 4 个小节，每节标题「卡组 k · 实例 i」）
// 两处口径必须与账本一致：① 小节标题 = `### 卡组 1 · 实例 1`（**不带席名、不带 card 映射括注**——映射只留 sealed 文件）；
// ② 账本并存 `## 第 1 轮` / `## 第 2 轮` 两轮 → **只取最后一轮**（两轮 8 节全收会得到 8 条记录，与「2 卡 × 2 实例 = 4」不符）
function abSections() {
  const text = readFileSync(join(evalDir(), 'ab-score.md'), 'utf8');
  // 先按**顶层** `## ` 切轮次（`###` 小节不切），再在轮内按小节切——只取最后一轮
  const rounds = text.split(/\r?\n(?=##[ \t])/).filter((c) => /^##\s*第\s*\d+\s*轮/.test(c));
  assert.ok(rounds.length > 0, 'ab-score.md 缺「## 第 N 轮」轮次标题，无法定位评分小节');
  const out = [];
  for (const c of rounds[rounds.length - 1].split(/\r?\n(?=#{2,4}\s)/)) {
    const m = c.match(/^#{2,4}\s*卡组\s*([12])\s*[·・\-—:：]?\s*实例\s*([12])/);
    if (m) out.push({ card: `卡 ${m[1]}`, instance: `实例 ${m[2]}`, rows: parseTable(c) });
  }
  return out;
}
const DIMS = ['P1', 'P2', 'P3', 'P4', 'E1', 'E2', 'E3', 'E4'];
const scoresOf = (cardNo, dim, side) => abSections().filter((s) => s.card === cardNo)
  .map((s) => s.rows.find((r) => r['维度'] === dim)?.[`${side} 分`] ?? 'pending');
// 终值：两实例一致才取该值；不一致 → pending（须经 K07 的第三人复评后才落终值）
const finalOf = (cardNo, dim, side) => {
  const v = scoresOf(cardNo, dim, side);
  return v.length > 0 && v.every((x) => x === v[0]) ? v[0] : 'pending';
};
const readAbScore = () => ['卡 1', '卡 2'].flatMap((c) => DIMS.map((dim) => ({
  card: c, dim, a: finalOf(c, dim, 'A'), b: finalOf(c, dim, 'B'),
})));
// ---- K06：把 ab-score.md 的 16 行（2 卡 × 2 实例 × 8 维）**折叠成 4 条记录**（每条记录 = 某卡某实例的 8 维）----
// 记录「零回归」= 该记录 8 维**两侧均为数字**且 `B ≥ A`；任一维含 `pending`（或空、`-` 等非数字）→ **该记录不算零回归**。
// 禁止拿 16 行数回归、再用 4 当分母（`rating.mjs:5` 判的是 `zero === records`，`zero` 的语义 = 零回归的**记录**条数）。
const isNumericScore = (x) => x !== undefined && x !== null && String(x).trim() !== '' && Number.isFinite(Number(x));
const abRecords = () => abSections().map((s) => ({
  key: `${s.card} · ${s.instance}`,
  cells: DIMS.map((dim) => {
    const r = s.rows.find((x) => x['维度'] === dim) ?? {};
    return { dim, a: r['A 分'], b: r['B 分'] };
  }),
}));
const zeroRecords = (records) => records.filter((r) => r.cells.every(
  (c) => isNumericScore(c.a) && isNumericScore(c.b) && Number(c.b) >= Number(c.a))).length;
function hasArbitration(cardNo, dim) {
  const t = readFileSync(join(evalDir(), 'ab-score.md'), 'utf8');
  const i = t.indexOf('仲裁');
  if (i < 0) return false;
  return t.slice(i).split(/\r?\n/).some((l) => l.includes(cardNo) && l.includes(dim)
    && /agents\/[\w.-]+\.md:\d+/.test(l));
}
// 证据行可回指：`agents/<卡>.md:<行号>` 且行号在文件范围内，或是某张卡的原文片段
function evidenceResolvable(ev) {
  const m = String(ev).match(/^(agents\/[\w.-]+\.md):(\d+)$/);
  if (m) {
    const lines = readFileSync(m[1], 'utf8').split(/\r?\n/);
    return Number(m[2]) >= 1 && Number(m[2]) <= lines.length;
  }
  return readdirSync('agents').some((f) => readFileSync(join('agents', f), 'utf8').includes(String(ev)));
}

// ---- 基线（H 组）----
const baseJson = () => JSON.parse(readFileSync('tools/docgen/fixtures/capability-baseline.json', 'utf8'));
// 读改造前的卡（只读 git 对象，不碰工作区）：基线复算 / 黄金来源 / A/B 的 A 侧都走这里
const gitShow = (rev, p) => {
  const r = spawnSync('git', ['show', `${rev}:${p}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  assert.equal(r.status, 0, `git show ${rev}:${p} 失败\n${r.stderr}`);
  return r.stdout;
};
// 抽取器必须**被执行**（不是只 grep 源码）：runEsm 真跑一遍，文本经 base64 传入（换行 / 反引号都不会被 shell 吃掉）。
// 只用**基线端切分口径**（`spec:169` §6 步骤 0 ④：步骤 0 尚无定义层 → 不注入字典）；
// 改造后端的字典匹配由本文件直接 `import { factsFromText }` 后调用（H02/H03/H04/H05）。
const runBaselineExtractor = (dir, text) => {
  const b64 = Buffer.from(text, 'utf8').toString('base64');
  const r = runEsm(dir, `import { factsFromBaselineText } from './tools/docgen/test/support/capability-baseline.mjs';
const text = Buffer.from(${JSON.stringify(b64)}, 'base64').toString('utf8');
console.log(JSON.stringify(factsFromBaselineText(text)));`);
  assert.equal(r.status, 0, `基线端抽取器执行失败（${dir}）\n${r.stderr}`);
  return JSON.parse(r.stdout);
};
function assertBaselinePrior(base) {
  assert.match(base.sourceCommit, /^[0-9a-f]{40}$/, '基线缺 sourceCommit（40 位十六进制）');
  const has = (rev, p) => spawnSync('git', ['cat-file', '-e', `${rev}:${p}`], { encoding: 'utf8' }).status === 0;
  assert.equal(has(base.sourceCommit, 'tools/docgen/policy'), false, '基线 commit 必须早于 policy/ 出现');
  assert.equal(has(base.sourceCommit, 'tools/docgen/components/renderBoundary.mjs'), false, '基线 commit 必须早于 renderBoundary 出现');
}

// ---- J 组：10 个断言点 = 8 条 ⑤ 段通用子句（`scope:'seg5'`）+ 2 条席职责（`scope:'card'` = **卡级子句**）----
// ⑨⑩ 的现文落在 ② 段（审计「核转录」/ 侦探「本席不核签」是**席职责句**，不是 ⑤ 段的越界后果要素）——
// 故 V-12 的「⑤ 段存在性」只约束 ①–⑧；⑨⑩ 只在整张卡上判「职责句在位」（卡级），不参与 ⑤ 段切片。
const CLAUSES = [
  { k: '①', why: '越权清单指名文件', scope: 'seg5', re: /越权[\s\S]{0,200}`[\w./-]+\.(md|mjs|json)`/ },
  { k: '②', why: '改前 / 改后 sha256', scope: 'seg5', re: /sha256/i },
  { k: '③', why: '是否可复原', scope: 'seg5', re: /可复原|能否复原|可恢复/ },
  { k: '④', why: '越权清单含「命令原文」（或给出反引号命令实例）', scope: 'seg5', re: /越权[\s\S]{0,240}(命令原文|`(git|node|npm) )/ },
  { k: '⑤', why: '用户执行复原', scope: 'seg5', re: /用户[^。]{0,6}执行|由用户[^。]{0,8}(复原|恢复)/ },
  { k: '⑥', why: '本轮结论作废', scope: 'seg5', re: /本轮[^。]{0,20}(作废|失效)|(作废|失效)[^。]{0,10}本轮/ },
  { k: '⑦', why: '检测限度点名 .session/ 盲区', scope: 'seg5', re: /\.session\// },
  { k: '⑧', why: '检测命令带 --no-optional-locks', scope: 'seg5', re: /git --no-optional-locks status/ },
  { k: '⑨', why: '审计职责：核转录（**卡级**，不属 ⑤ 段存在性）', scope: 'card', seat: 'reviewer-audit', re: /核转录/ },
  { k: '⑩', why: '侦探职责：本席不核签（**卡级**，不属 ⑤ 段存在性）', scope: 'card', seat: 'detective-observer', re: /本席不核签/ },
];
function assertNeedClauses(text, seat = 'reviewer-audit') {
  const seg = seg5(text);
  assert.ok(seg.length > 0, '缺 ⑤ 段（越界后果与限度）');
  for (const c of CLAUSES) {
    if (c.seat && c.seat !== seat) continue;
    // scope:'seg5' → 只在 ⑤ 段切片上判；scope:'card' → 整张卡上判（⑨⑩ 现文在 ② 段，属正常）
    assert.match(c.scope === 'seg5' ? seg : text, c.re,
      `缺${c.scope === 'seg5' ? ' ⑤ 段' : '卡面（卡级）'}要素 ${c.k}：${c.why}`);
  }
  return seg;
}
// 逐子句「缺哪几条」：J02 用它做精确红点断言（assertNeedClauses 只报**第一条**缺，无法证明「删 ⑧ 却报 ⑦」这类错位）
// 口径同 assertNeedClauses：`seg5` 判 ⑤ 段切片、`card` 判整卡（⑨⑩ 是卡级子句）
const missingClauses = (text, seat = 'reviewer-audit') => CLAUSES
  .filter((c) => !c.seat || c.seat === seat)
  .filter((c) => !c.re.test(c.scope === 'seg5' ? seg5(text) : text))
  .map((c) => c.k);

// ---- K08：改分纪律的三个 helper ----
function gitLogCountAfter(since, pathspec = '.') {
  const r = spawnSync('git', ['--no-optional-locks', 'log', `--since=${since}`, '--oneline', '--', pathspec], { encoding: 'utf8' });
  if (r.error) throw r.error;
  return r.stdout.trim() ? r.stdout.trim().split('\n').length : 0;
}
function freezeTime(file) {
  const m = readFileSync(file, 'utf8').match(/冻结[^\n]*?(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2})/);
  assert.ok(m, `${file} 缺「冻结 + 时间戳」标记（K02 ⑤）`);
  return m[1].replace(' ', 'T');
}
const hasRerunStamp = (row) => /重评|重跑|rerun/i.test(Object.values(row).join(' '));
```

> 说明：**判据端一律用 `factsFromText(renderBoundary(席), probeDict())`**（spec `:202` 的 V-1 口径）；`factsFromDump(json, 席, dict)` 只在 H02 作交叉核对——两端若都用 dump，模板漏渲染就测不出（议会 #3 F6 / QA-06）。改造前 = `fixtures/capability-baseline.json`（由**独立**抽取器 `test/support/capability-baseline.mjs` 从 `git show <sourceCommit>:agents/<席>.md` 生成，不得 import `policy/`；H01 ③ 用 `runEsm` **真执行**复算，不只 grep 源码）。

---

## 1 覆盖总表

| 用例 ID | 覆盖的 spec 条目 | 一句话场景 | 类型 | 层级 | 判据类型 | 执行方式 | 优先级 |
|---|---|---|---|---|---|---|---|
| S6-TC-A01 | V-1 / §3.2 定义层表（`capabilities` + `tiers`）/ §3.5 不变量1、9 | `capabilities` 三组逐字 + 值落在六工具白名单内 + **档位表四档齐（含 `command`）、值 = 工具名、`patternRegistry.tools` 同引用、`tierOfCapabilities` = 「caps 展开 == `TIERS[档]`」唯一样** | 正 | 单元 | 机器 | `node --test tools/docgen/test/policy-pure-source.test.mjs` | P0 |
| S6-TC-A02 | V-4 / §3.2 / §3.4 | 命令 8 组（允许 3 / 禁止 5）+ `seatGroups` 本轮为空集 + 每组 `purpose` 与 `verbs` 非空；`network.verbs` **恰三项**（`安装` / `网络写` / `node -e`）、`下载类命令` 只在 `purpose` | 正 | 单元 | 机器 | 同上 | P0 |
| S6-TC-A03 | V-5 / §3.2 / §3.5 不变量4 | 5 个禁止组 ID 在位，且不在任何 `allowGroups` 里 | 正 | 单元 | 机器 | 同上 | P0 |
| S6-TC-A04 | V-4 / §3.2 paths / §8 V-1③ / V-7 | 路径 6 组三口径全覆盖：**21 数组元素 / 22 定义层点名 / 23 卡面成员**，无缺项无多项 | 正 | 单元 | 机器 | 同上 | P0 |
| S6-TC-A05 | §3.2 artifacts / §3.5 不变量1 | `artifacts` 4 项在位、`progress.md` 标 `host`、只描述归属 | 正 | 单元 | 机器 | 同上 | P0 |
| S6-TC-A06 | V-4「组内顺序 = 卡面顺序」/ §3.4 | 卡面切片顺序 == 定义层组内顺序（路径 + 命令两处；段数按定义层派生，不写死） | 边界 | 集成 | 机器 | 读卡 + 单元 | P0 |
| S6-TC-A07 | §3.2「组 ID 稳定」/ §3.4 归码谓词 | 组 ID 唯一 + 符合 v4 谓词（含冒号）+ 命名纪律（无 `/`、反引号、空格、`--`） | 边界 | 单元 | 机器 | 单元断言 | P1 |
| S6-TC-A08 | §3.4 **单趟**替换（`tpl.replace(/…/g, …)`，`spec:93`）/ §3.5 不变量7 边界 / 槽 1 与 `expanded[0]` | 定义层值含 `{{SLOT}}` / `$&` / `$'` / `$$` 时不得被二次展开或二次解释；**`display` 含 `{{DETECTION_CMD}}` 时须原样输出（不得被后一个槽扫掉）、`expanded[0]` 仍是该串** | 边界 | 单元 | 机器 | 单元断言 | P1 |
| S6-TC-A09 | §3.6 编码与换行（`spec:124`）/ §2 第 1 条 / 议会 #3 F30 | 卡面 CRLF / BOM 两例：`gate` **必报 `Mismatch`**（禁归一化后判绿）；渲染侧只产 `\n`、无 BOM | 边界 | 集成 | 机器 | 副本内 `runCli(gate)` | P1 |
| S6-TC-B01 | **V-1**（策略数据面）/ §3.3 / §3.5 不变量9 / §3.6（含 **`tierBySeat` 派生**：`spec:120` 键集恰 `SEAT_NAMES`、不含 `__default__`、派生值 == 映射值）/ §3.2 `tiers`+`seats` | 三席 + `__default__` 策略数据等价；**四档齐（含 `command`）、值 = 工具名**；黄金 4 个基线键齐、**取自改造前**但只记 `hashEqual` 事实；**当前比对键 = 最大轮次 `<席>@<轮次>`（无则基线键）+ 换代取键负例**；可选槽缺省合法；**`tierBySeat` 由 `SEAT_POLICY` 派生（三席、不含 `__default__`）** | 正 | 单元 | 机器 | 单元断言 | P0 |
| S6-TC-B02 | **V-3** / §3.5 不变量1、2 / §3.7 | 真实 `seat-policy.mjs` **closed-world**：三键外零字符串、三键内逐条是登记 ID；对象键 ∈ `SEAT_NAMES`、`__default__` 为保留键、`seatGroups` 键进入候选集 | 正 | 静态 + 单元 | 机器 | 读文件 + 结构走查 | P0 |
| S6-TC-B03 | V-3 / §7 `LiteralInConfig` | 配置层塞路径 → `LiteralInConfig`（带行号） | 负 | 集成 | 机器 | 副本内 `runEsm` | P0 |
| S6-TC-B04 | V-3 / §7 `LiteralInConfig` | 配置层塞反引号命令 → `LiteralInConfig` | 负 | 集成 | 机器 | 同上 | P0 |
| S6-TC-B05 | V-3 / §7 `LiteralInConfig` | 配置层塞 `--flag` → `LiteralInConfig` | 负 | 集成 | 机器 | 同上 | P0 |
| S6-TC-B06 | V-5 / §3.5 不变量1 / §7 `UnknownPolicyRef` | 引用不存在的 capability → `UnknownPolicyRef` | 负 | 集成 | 机器 | 同上 | P0 |
| S6-TC-B07 | V-5 / §3.5 不变量1 / §7 | 引用不存在的组 → `UnknownPolicyRef` | 负 | 集成 | 机器 | 同上 | P0 |
| S6-TC-B08 | V-5 / §3.3 artifacts 约束 / §7 | 引用不存在的 artifact 文件 → `UnknownPolicyRef` | 负 | 集成 | 机器 | 同上 | P0 |
| S6-TC-B09 | V-5 / §3.5 不变量4 / §7 `ForbiddenGroupGranted` | 授予 `docgen.write` → `ForbiddenGroupGranted: 席:组:forbidden` | 负 | 集成 | 机器 | 同上 | P0 |
| S6-TC-B10 | V-5 / §3.3 席级组 / §3.5 不变量5 | 非本席引用 `seat:senior-sdet.extra` → `ForbiddenGroupGranted: 席:组:other-seat` | 负 | 集成 | 机器 | 同上 | P0 |
| S6-TC-B11 | V-1 / V-8 / §3.3 席级组 / §3.5 不变量8（**两方向**） | 本席 `seat:senior-sdet.extra` 合法且只改本席；反例：verb 越出允许集 → `:not-allowed`、撞禁止组 → `:verb` | 正 | 集成 | 机器 | 副本内 `runEsm` | P1 |
| S6-TC-B12 | V-1 / §3.2 未登记席 / §3.3 | 未登记席与原型链键名回落 `__default__` | 边界 | 单元 | 机器 | 单元断言 | P0 |
| S6-TC-B13 | V-3 假阳性守卫 / §3.5 不变量2 / §3.3 | 配置里出现**已登记**产物文件名（`round-check.md`）不得误红（closed-world 下它是登记 ID） | 边界 | 单元 | 机器 | 单元断言 | P1 |
| S6-TC-B14 | V-3 / §3.5 不变量2 / §7 `LiteralInConfig` | 配置层塞非 ID 的**裸命令**（`'git status'`）→ `LiteralInConfig`（spec v2 明列的负例） | 负 | 集成 | 机器 | 副本内 `runEsm` | P0 |
| S6-TC-B15 | V-3 / §3.5 不变量2 / §7 `LiteralInConfig` | 配置层 `artifacts` 塞路径形态非 ID（`'definitions/x.mjs'`）→ `LiteralInConfig`（spec v2 明列的负例） | 负 | 集成 | 机器 | 副本内 `runEsm` | P0 |
| S6-TC-C01 | **V-2（辅助定位）** / V-1 / §3.6 | 审计席：哈希降为定位线索（按**当前比对键**取，换代后取最大轮次），改断「能力 diff 空 + J01 子句齐」 | 边界 | 单元 | 机器 | 单元断言 | P1 |
| S6-TC-C02 | V-2（辅助定位） / V-1 / §3.6 | 侦探席同口径（两席文案不同，须逐席判；含换代取键负例） | 边界 | 单元 | 机器 | 单元断言 | P1 |
| S6-TC-C03 | **V-9** / §3.4 纯度守卫 / §7 `TemplateImpure`（`spec:191` / `spec:197`） | 模板塞路径 → `TemplateImpure`；首行路径**必须以 `tools/docgen/` 开头**（POSIX 相对） | 负 | 集成 | 机器 | 副本内 `runEsm` | P0 |
| S6-TC-C04 | V-9 / §3.4 / §7 `TemplateImpure`（`spec:191` / `spec:197`） | 模板塞反引号命令 → `TemplateImpure`；首行路径以 `tools/docgen/templates/boundary.md.tpl` 开头 | 负 | 集成 | 机器 | 同上 | P0 |
| S6-TC-C05 | V-9 / §3.4 纯度规则 1 vs 2 / §7 | 模板塞**清单类成员**（`npm run check`）→ `TemplateImpure`；单点类 `--write` 留在模板 → 合法（应绿） | 负 | 集成 | 机器 | 同上 | P0 |
| S6-TC-C06 | §3.4 槽表（12 槽）/ §3.5 不变量7 | 12 槽逐槽被引用 + 渲染无 `{{` + 无 `undefined` + 无连续标点；空 `artifacts` 席（`senior-sdet`）不留悬空标点 | 正 | 单元 | 机器 | 单元断言 | P0 |
| S6-TC-C07 | §3.4 槽位替换 / §3.5 不变量7 边界 | 模板出现未声明槽位不得静默保留 | 边界 | 单元 | 机器 | 单元断言 | P1 |
| S6-TC-C08 | §3.4 槽表分隔符 / V-4 | 组间 `、` 或 `；`、组内 ` / `；`{{DENY_GROUPS}}` 剔除 `env.assign`（由 `{{ENV_FORMS}}` 单独注入）；路径槽成员 = **23 项**（含 `spec / plan`） | 边界 | 单元 | 机器 | 单元断言 | P1 |
| S6-TC-C09 | §3.2 `seats.mjs` 可选槽（`spec:57`）/ §3.4 槽值守卫（`spec:93`）/ §7 `TemplateImpure` | **显式传 `undefined`** ≠「缺省未声明」→ `TemplateImpure`（`senior-sdet` 的 `clause` 显式写 `undefined`） | 负 | 集成 | 机器 | 副本内 `runCli(policy --dump)` | P1 |
| S6-TC-D01 | **V-5** 全覆盖 / §7 六码（含**报文路径口径** `spec:197`）/ §3.5 1–9 | 六个错误码各 1 个负例；`ForbiddenGroupGranted` 的 `:forbidden` / `:other-seat` / `:verb` / `:not-allowed` 四种后缀各 1 例；五个 CLI 码 = exit 1 + 首行格式 + **路径以 `tools/docgen/` 开头的 POSIX 相对路径**（绝对路径负例自证） | 负 | 集成 | 机器 | 汇总（各负例命令） | P0 |
| S6-TC-D02 | V-2 / §3.6 / §7「Mismatch 与 RenderNotEquivalent 分工」 | 渲染与基准卡面不等 → `Mismatch`（`gate` 口径） | 负 | 集成 | 机器 | 副本内 `runCli(gate)` | P0 |
| S6-TC-D03 | V-5 / §3.5 不变量3 / §7 `SeatNameInDefinition` | 定义层（`seats.mjs` 之外）出现席 slug → `SeatNameInDefinition`；显示名只许在 `seats.mjs` 映射 | 负 | 集成 | 机器 | 副本内 `runEsm` | P0 |
| S6-TC-D04 | **V-5「九条不变量」** / §3.5 | 九条不变量各有且仅有 1 个负例（§1 表机器可筛，不靠人工声明） | 边界 | 静态 | 机器 | 全文件扫描 | P1 |
| S6-TC-D05 | §7 退出码 / §3.5 | 五个 CLI 码必须进 `EXIT` 映射（未进则落 2）；`RenderNotEquivalent` 不进 CLI 表 | 边界 | 单元 | 机器 | 单元断言 | P0 |
| S6-TC-D06 | §7 注「`gate` 侧必须调用 `validatePolicy()`」（`spec:196`）/ §5 发射点（`spec:161`）/ 五码之二的接线（议会 #3 第 4 轮 Q-4-BE-01） | `gate` 侧接线：配置非法（路径字面量 / 禁止组）→ exit 1 + 五码之一，**不得落 `Mismatch`**、不得静默放行 | 负 | 集成 | 机器 | 副本内 `runCli(gate)` | P0 |
| S6-TC-E01 | **V-6** / §8 V-6 / D1 | **新增**一条禁止路径 → 只改 `definitions/paths.mjs` + 重生成两张卡 → `gate` 绿；其它源文件 0 改动 | 正 | 集成 | 机器 | 副本内 `runCli(gate)` | P0 |
| S6-TC-E02 | **V-8** / §3.6 / §3.3 席级组 / §3.2 `seats` | **已登记席加组 = 1 处数据**（只该席渲染变、`gate` 绿）；**新增席 = 2 处数据、零代码**（其余席渲染零变化） | 正 | 集成 | 机器 | 副本内 `runEsm` + `changedFiles` | P0 |
| S6-TC-E03 | **V-7** / §1 影响面 / D1 | 23 项清单副本收敛到「定义层 1 处 + 2 张卡」；扫描面 = 非 `docs/` + S5 testcase（**S5 spec 不进副本判定**：其清单原句属历史记录，只判指针），**排除 `tools/docgen/test/`** | 正 | 静态 | 机器 | 全仓扫描 | P0 |
| S6-TC-E04 | V-7 / §6 步骤 6 | 测试零手抄：`FORBIDDEN_PATHS` 等从定义层 import | 正 | 静态 | 机器 | 源码探针 | P0 |
| S6-TC-E05 | V-7 / §3.6 S5 文档侧 / §6 步骤 4b / D5 | S5 spec §3.3 / §8 只加指针（不改原句）；S5 testcase 三条改判 + 手抄数组改派生 → 0 手抄 | 正 | 静态 | 机器 | 读文件断言 | P1 |
| S6-TC-E06 | V-7 / §6 步骤 6 | `ALLOWED` / `FORBIDDEN` 两组常量同样来自定义层 | 正 | 静态 | 机器 | 源码探针 | P0 |
| S6-TC-E07 | V-7 / §3.1 单向依赖 / §5 布局 | 定义层单源：`policy/` 文件集精确（含 `definitions/tiers.mjs`），无第二份边界/清单常量文件；**档位表四档单源（值 = 工具名 + re-export 同引用）** | 边界 | 静态 | 机器 | 目录 + 扫描 | P1 |
| S6-TC-F01 | V-10 / §5 `policy --dump` / §3.2 `tiers` | dump 顶层键按 spec §5（含 `tiers` / `seatGroups` / `paths.patterns.specPlan` / `detectionBlindSpots`）；`tiers` = **四档（含 `command`）、值 = 工具名**；每席 `expanded` = 12 项 | 正 | 集成 | 机器 | `runCli(policy --dump)` | P0 |
| S6-TC-F02 | V-10 / §5 / §3.4 槽表 / §3.2 `seats` | 12 槽值可复算 `renderBoundary`（**索引按 §3.4 表行序：第 n 行 → index n−1**）；**槽 2 = `tierOfCapabilities` 且 caps 展开 == `TIERS[档]`、槽 10 = 路径 23 项（index 9）、槽 12 = `git.read` 的 status verb（index 11）**；`senior-sdet` 槽 5 / 槽 6 缺省为空串；两 producer 席与卡面边界节逐字相等 | 正 | 集成 | 机器 | 同上 | P0 |
| S6-TC-F03 | V-10 / §5「不许写盘」/ §10 末条 | 命题收窄「不写**仓内**文件」：副本内比哈希（不在副本跑 git）+ 真仓库根跑 `git --no-optional-locks status --porcelain -- tools/docgen` | 负 | 集成 | 机器 | `runCli` + 哈希 | P0 |
| S6-TC-F04 | §5 / §7 / §3.4 只读 | dump 拒绝写盘类 flag（`--write` / `--out`）→ `InvalidArgs` exit 2 | 负 | 集成 | 机器 | `runCli` | P0 |
| S6-TC-F05 | V-10 / §5 | dump 幂等：连跑两次 stdout 逐字相等 | 边界 | 集成 | 机器 | `runCli` ×2 | P1 |
| S6-TC-F06 | V-10 / §3.1 数据流 | dump 与 `renderBoundary` 同源：定义改一处，两者同变 | 正 | 集成 | 机器 | 副本内 `runEsm` | P1 |
| S6-TC-G01 | **V-2（辅助定位）** / §2 第 2 条 / §11.3 D4 | 字节零变化是「最好情况」；判据改为**差异可追**（每个差异文件在 `capability-diff.md` 有说明行） | 边界 | e2e | 机器 | `git diff --stat` | P1 |
| S6-TC-G02 | **V-10** / V-2 | `gate` → `baseline N/N`，N 派生不写死 | 正 | e2e | 机器 | `runCli(gate)` | P0 |
| S6-TC-G03 | V-1 / §3.6 / §2「不做什么」4 | 12 席不接渲染层，其中**卡面渲 `DEFAULT_BOUNDARY` 的是 11 席**（`senior-sdet` 走手写模板）；`evidence-reader` 边界句不变（**2026-10-31 迁移改判 → 自带边界集合 3→4、`senior-sdet` 改为自带专用句；默认席仍 11；原文保留，见 §G03 加注**） | 正 | 集成 | 机器 | 读卡 + 单元 | P0 |
| S6-TC-G04 | §3.6 / D2 / V-5 | `BOUNDARY_COMMAND` 已删；`:12` import / `S5-TC-B08` / `S5-TC-E05` / `S5-TC-B14` 四处同批改判；S5 testcase 数组改派生；`git status` 读取不因「无命中 exit 1」抛错 | 边界 | 静态 + 单元 | 机器 | 扫描 + 单元 | P0 |
| S6-TC-G05 | V-6 反向验证 / V-2 | 改定义层一条 → `gate` 红（卡面变）→ 改回绿 | 边界 | 集成 | 机器 | 副本内 `runCli(gate)` | P0 |
| S6-TC-H01 | **V-1 基线来源** / §6 步骤 0 ③④⑤ | 基线**同源可复算** + 抽取规则写死 + 黄金样本独立复算（**同一抽取器 `runEsm` 真执行**，不是只 grep 源码）；**基线端按旧卡文本切分**（反引号 / 顿号 / 分号 / ` / ` 工具项，不注入字典）；抽取器不 import 定义层；**`agents/` 差异可追 + 越界可抓**（只许两张 producer 卡 + 逐个进 `capability-diff.md`）；两条取数命令写进 `checklist.md` 交付说明 | 正 | 集成 | 机器 | `git show` + `runBaselineExtractor` | P0 |
| S6-TC-H02 | **V-1 五段集合 diff** / §8 V-1 | 逐席 ①②③④ 四段事实集合 diff **空差**（**改造后 = 存在性匹配 + 定义层字典**；**基线端 = 旧卡切分**）；⑤' **两端可比前提 = 基线成员 ⊆ 定义层字典**；③ 段 23 项含 `spec / plan`；键集不全 / 字典丢项即红 | 正 | 集成 | 机器 | `diffFacts` | P0 |
| S6-TC-H03 | **V-1 负例：能力丢失（路径）** | 副本少一项禁写路径 → diff 出现 `-` → 必红 | 负 | 集成 | 机器 | 副本 + `diffFacts` | P0 |
| S6-TC-H04 | **V-1 负例：能力丢失（命令）** | 副本删一条允许命令 → `-` → 必红 | 负 | 集成 | 机器 | 同上 | P0 |
| S6-TC-H05 | **V-1 越权负例：多一项** | 路径 / 命令 / 已登记允许组各加一项 → `+` → 三个独立断言点各必红；第三项 = 多挂一个**已登记**组（只改配置层一处，不新增登记） | 负 | 集成 | 机器 | 同上 | P0 |
| S6-TC-H06 | **V-2 降级判定表** / §8 V-2 | 哈希红 + diff 空 → **pass**；哈希绿 + diff 非空 → **fail**（哈希不进入判定函数） | 边界 | 集成 | 机器 | 判定函数 + 账单一致 | P0 |
| S6-TC-H07 | **V-1 恒真守卫** / §6 步骤 0 ②③④ / §5「不许写盘」 | 基线取自改造后（`sourceCommit` 含 `policy/`）→ diff 恒空 → 必红；抽取器不 import `policy/`；**抽取器必须被 `runEsm` 真执行过（基线端切分口径，不传字典）**（动态断言） | 负 | 集成 | 机器 | 同 H01 | P0 |
| S6-TC-I01 | **V-11 允许侧下探** | 允许命令（现算）/ 可写产物 / 6 tools **逐项**「使用 → 不被判红」；tool 探针**按 capability 选席**（`exec` → `reviewer-audit`，其余 → `senior-sdet`） | 正 | 集成 | 机器 | 列表驱动 + 副本 | P0 |
| S6-TC-I02 | **V-11 禁止侧下探** | 禁止命令（现算）/ 23 路径 / 5 禁止组 **逐项**「使用 → 必判红」；**期望码由形态谓词现算**；补 `seatGroups` 内禁止 verb 探针 | 负 | 集成 | 机器 | 列表驱动 + 副本 | P0 |
| S6-TC-I03 | **V-11 完备性** | 探针表键集 = 应有集合（`kind:id@seat` 唯一）、每项执行 1 次、删一项即红、禁止抽样 | 边界 | 静态 + 集成 | 机器 | 全表扫描 + 计数 | P0 |
| S6-TC-J01 | **V-12 关键子句存在性** | 先 `seg5(text)` 切 ⑤ 段再断言：越权四要素 + 用户复原 + 本轮作废 + 检测限度 `.session/` + 检测命令 `--no-optional-locks`；另加**审计「核转录」/ 侦探「本席不核签」两句职责（`scope:'card'` = 卡级，不属 ⑤ 段存在性）** | 正 | 单元 | 机器 | 渲染文本切片 | P0 |
| S6-TC-J02 | **V-12 负例：逐子句删除** | **8 类**子句各删一处 → 各红一次（⑤ 段 6 类 + 卡级 2 类）；删前先断 `countIn >= 1`，红点按 `missingClauses` 对位（⑨⑩ 按整卡判） | 负 | 集成 | 机器 | 副本内改模板 | P0 |
| S6-TC-J03 | **V-12 边界：措辞可重排** | 措辞改写但要素齐 → 绿；同时黄金哈希不等（证明 v5 口径会误判） | 边界 | 集成 | 机器 | 副本内改模板 | P1 |
| S6-TC-K01 | **V-13 四本账单** / §9.2 | 评估期落 `.session/reviews/<…>-s6-eval/`；迁移后 `git ls-files docs/superpowers/reviews/<…>-s6-eval/` 四本齐、列名逐字 | 正 | 静态 | 机器 | 表头比对 + `git ls-files` | P0 |
| S6-TC-K02 | **V-13 rubric 冻结版** / §9.1 / §9.2 复用 | 8 维 × 0/1/2 定义齐 + 每维 0 分样例 + 判据来源；复用出处 5 条写死 | 正 | 静态 | 机器 | 表结构断言 | P0 |
| S6-TC-K03 | **V-13 证据行** / §9.2 | 每分必带卡内原文行且可回指；无证据 → 记 `pending`，不得给分 | 负 | 静态 | 机器（字段）+ AI 判（内容） | 账单一致性 | P0 |
| S6-TC-K04 | **V-13 通过判据** / §9.2 评分规则 | 逐维 B ≥ A 且至少一维 B > A；**总分不作判据**（总分高但一维降 → 不过） | 边界 | 集成 | 机器（比较）+ AI 判（分数） | 账单比较 | P0 |
| S6-TC-K05 | **V-13 盲评流程** / §8 V-13 / §9.2 封存与**盲评隔离**（`spec:252`） | 评测者 = 2 个全新上下文子代理（非作者 / 非施工）；评「边界五段」切片；`mapping.sealed.md` **只在** `.session/reviews/<…>-s6-eval/`（评测账目录内不得有）；**每实例输入清单恰 2 个卡文件**；至多 2 轮 | 正 | 静态 | 机器（字段） | 文件断言 | P0 |
| S6-TC-K06 | **V-13 置信度** / §9.2 / `rating.mjs` | 16 行**折叠成 4 条记录**（每条 = 8 维）；4 条**零回归** → 按 `rating.mjs`（记录 ≥3 且零回归）标 **high**；有回归 → `mid`；**含 `pending` 的记录不算零回归 → 不得 high**；从账单现算，不硬编码 `2*2` | 边界 | 静态 | 机器 | 账单 + 交付说明 | P1 |
| S6-TC-K07 | **V-13 分歧仲裁** | 同卡同维两实例差 ≥1 分 → 第三人复评并留分歧记录；未收敛记 `pending`（AI 判，机器只核「分歧被记录」） | 边界 | 静态 | 机器（字段）+ AI 判 | 账单断言 | P1 |
| S6-TC-K08 | **V-13 改分纪律** / §9.2 | rubric 冻结后改分 → 必须记 P2 + **全量重跑**；只改一处 → 必红（用 `gitLogCountAfter` / `freezeTime` / `hasRerunStamp` 三个已实现 helper） | 负 | 静态 | 机器 | 账单 + git 历史 | P1 |

**覆盖核对**（按 spec v8 编号）：spec 验收项 **V-1～V-13 共 13 条 → 全部有用例**：
- **V-1（能力矩阵等价）→ H01/H02/H03/H04/H05/H07**；**改造后一律取 `factsFromText(renderBoundary(席), probeDict())`**（`spec:204`，存在性匹配 + 定义层字典），**基线端按 `spec:169` ④ 旧卡文本切分（不注入字典，H01 ③）**，两端可比前提 = **H02 ⑤'（基线成员 ⊆ 定义层字典）**；`dump` 只作交叉核对；B01 / A01 / G03 作「策略数据面」补充。段 ⑤ 不做集合 diff（键集恰 8 字段），归 V-12；③ 段 = **23 项**（含 `spec / plan`）。
- **V-2（辅助定位，不作通过判据）→ C01/C02/G01**（哈希 / 字节只作定位线索）+ **H06** 判定表。
- **V-3 → B02**（closed-world 正例）/ B03/B04/B05/B13（假阳性守卫）/B14/B15。
- **V-4 → A02/A04/A06/A07**（含 `tiers.mjs` 的档位一致 = 不变量 9）。
- **V-5（九条不变量）→ A03/B06-B10/B11(不变量8)/C03-C06/C07/C09/D01/D03/D04/D05**。
- **V-6 → E01**（新增一条禁止路径只改一处）/ **G05**（反向验证）。
- **V-7 → A04/E03/E04/E05/E06/E07**（扫描面 = 非 `docs/` + S5 testcase，排除 `tools/docgen/test/`；S5 spec 按 `spec:210` 属历史记录、不进副本判定）。
- **V-8 → B11/E02**（度量层 = `renderBoundary` 输出，两形态：已登记席加组 1 处数据 / 新增席 2 处数据，见 `spec:211`）。
- **V-9 → C03/C04/C05/C06/C07**（纯度三条按「清单类 / 单点类」分治，`spec:94-96`）。
- **V-10 → F01-F06/G02**。
- **V-11 → I01/I02/I03**（分母由 dump 现算；「拦」= 判据层）。
- **V-12 → J01/J02/J03**（先切 ⑤ 段；含两句席职责）。
- **V-13 → K01/K02/K03/K04/K05/K06/K07/K08**（评「边界五段」切片、2 个全新上下文子代理、至多 2 轮、4 条零回归 → `high`）。
- **跨平台（议会 #3 F30）→ A09**（CRLF / BOM：`Mismatch` 必红，禁静默归一化；`spec:124`）。

失败面 **§7 六码 → 全部有对位**：`UnknownPolicyRef`→B06/B07/B08（+ I02 按形态谓词现算的 ID 形态 verb）；`LiteralInConfig`→B03/B04/B05/B14/B15（+ I02 的非 ID 形态 verb / 路径探针）；`SeatNameInDefinition`→D03；`ForbiddenGroupGranted`→B09（`:forbidden`）/B10（`:other-seat`）/B11（`:verb`）（+ I02 的 5 组逐项探针）；`TemplateImpure`→C03/C04/C05（C06/C07 兜不变量 7 的「槽集不合」与槽值守卫、**C09** 兜「显式 `undefined`」）；`RenderNotEquivalent`→D01（施工期黄金断言构造，**不是 CLI 码**，D05 反向断言它不进 `EXIT` 表）与 C01/C02（**辅助定位**）；`Mismatch`（既有，非六码之一）→D02 / A09。不变量 **§3.5 九条 → 各有 ≥1 负例**（D04 用机器判据在 §1 表上数）。

---

## 2 用例明细

### S6-TC-A01 `capabilities` 三组逐字 + 值落在六工具白名单内 + 档位表**四档**齐

- **覆盖**：V-1 / §3.2 定义层表（`capabilities` + `tiers`）/ §3.5 不变量1、不变量9
- **来源**：spec 推导（`spec:52` capabilities / `spec:53` tiers：**四档** `readOnly` / `sdet` / `command`（S2 精算师保留档、本轮无挂席）/ `producer`；删 `command` 会让 S5 三条断言必红）
- **前置**：`tools/docgen/policy/definitions/capabilities.mjs` 与 `definitions/tiers.mjs` 已落。
- **步骤**：① 取 `CAP.capabilities` 与具名导入的 `TIERS`；② 断言 `CAP.capabilities` 三键值；③ 把三个数组并集与六工具白名单比较（拼错 / 大写变体 / 联网工具即红）；④ 断言 `TIERS` **四档齐**（含 `command`）、**每档的值是工具名**（∈ `capabilities.mjs` 的工具全集，**不是** capability ID），且 `patternRegistry.tools` 是**同一个对象引用**（`assert.equal(patternRegistry.tools, TIERS)`，严格相等——re-export，不深拷贝、不改名）；⑤ 按「caps 展开 == `TIERS[档]`」判 `tierOfCapabilities` 的唯一样：`['read']`→`readOnly`、`['read','write']`→`sdet`、`['read','exec']`→`command`、`['read','write','exec']`→`producer`，且每个组合的展开结果逐项等于 `TIERS[该档]`。
- **预期**：`read = ['Read','Glob','Grep']`、`write = ['Write','Edit']`、`exec = ['RunCommand']`，顺序即此顺序（名称即卡面顺序）；并集 ⊆ 六工具全集，且全集六项全被覆盖；档位表四档齐且**值是工具名**：`readOnly=['Read','Glob','Grep']` / `sdet=['Read','Glob','Grep','Write','Edit']` / `command=['Read','Glob','Grep','RunCommand']` / `producer=['Read','Glob','Grep','Write','Edit','RunCommand']`；四个 capability 组合各得唯一档名。
- **判据**：
  ```js
  const CAPS = CAP.capabilities;
  assert.deepEqual(CAPS.read, ['Read','Glob','Grep']);
  assert.deepEqual(CAPS.write, ['Write','Edit']);
  assert.deepEqual(CAPS.exec, ['RunCommand']);
  const all = Object.values(CAPS).flat();
  assert.deepEqual([...new Set(all)].sort(), ['Edit','Glob','Grep','Read','RunCommand','Write'].sort());
  // ④ 档位表**四档**（spec:53）：`TIERS` 本身就是档位对象（`export const TIERS = {...}`），**值是工具名**（不是 capability ID）；
  // `command` 是 S2 精算师保留档、本轮无挂席，但键必须存在（S5 既有断言依赖它）
  assert.deepEqual(Object.keys(TIERS), ['readOnly','sdet','command','producer']);
  const TOOLS = new Set(Object.values(CAPS).flat());
  for (const [tier, tools] of Object.entries(TIERS)) {
    assert.ok(Array.isArray(tools) && tools.length > 0, `${tier}: 档位值必须是工具名数组`);
    for (const t of tools) assert.ok(TOOLS.has(t), `${tier}: ${t} 不是 capabilities 里的工具名（档位值不得写成 capability ID）`);
  }
  assert.deepEqual(TIERS.readOnly, ['Read','Glob','Grep']);
  assert.deepEqual(TIERS.sdet, ['Read','Glob','Grep','Write','Edit']);
  assert.deepEqual(TIERS.command, ['Read','Glob','Grep','RunCommand']);
  assert.deepEqual(TIERS.producer, ['Read','Glob','Grep','Write','Edit','RunCommand']);
  // 同一对象引用：**严格相等**（`assert.equal`，不是 `deepEqual`）——re-export 不得深拷贝、不得改名
  assert.equal(patternRegistry.tools, TIERS, '档位表必须 re-export tiers.mjs 的同一对象（不得另存一份 / 不得深拷贝）');
  // ⑤ `tierOfCapabilities` = 「caps 展开后的工具集 == TIERS[档]」的唯一样（spec:53）
  for (const [caps, tier] of [[['read'],'readOnly'], [['read','write'],'sdet'],
    [['read','exec'],'command'], [['read','write','exec'],'producer']]) {
    assert.equal(tierOfCapabilities(caps), tier, `${caps.join('+')} 应判 ${tier}`);
    assert.deepEqual([...caps.flatMap((c) => CAPS[c])].sort(), [...TIERS[tier]].sort(),
      `${caps.join('+')} 展开 ≠ TIERS[${tier}]`);
  }
  ```
- **红绿证据**：红 = 把 `write` 改成 `['Write','Edit','RunCommand']` → 本用例与 B01 同红，且 `renderBoundary` 输出的档位事实段会多一个工具（卡面 `gate` 红）；另一红 = 档位表只落三档（删 `command`）→ 第 ④ 组断言红，且 S5 的三条断言（`tool-tiers.test.mjs` 的档位表 / `toolsForSeat` / `BOUNDARY_COMMAND` 前置）必红（`spec:53` 写死「删 `command` 会让 S5 三条断言必红」）；再一红 = 档位值写回 capability ID（`TIERS.command = ['read','exec']`，v9.3 及以前的口径）→ ④ 的「值 ∈ 工具全集」与 ⑤ 的「展开 == `TIERS[档]`」同时红（`'read'` / `'exec'` 不在六工具全集里）；再一红 = `patternRegistry` 另存一份档位表 → 引用不等；绿 = 三值 + 四档（工具名）+ 四个组合各得唯一档。
- **对应测试**：`tools/docgen/test/policy-pure-source.test.mjs`（新）——待 plan Task N。
- **不覆盖**：档位名 → 工具数组的映射算法（S5 的 `tierBySeat` / `toolsForSeat`，§2「不做什么」1）；`command` 档本轮无挂席的语义（S2 范围）。

### S6-TC-A02 命令 8 组（允许 3 / 禁止 5）+ `seatGroups` 空集 + 每组 `purpose` 与 `verbs` 非空

- **覆盖**：V-4 / §3.2 / §3.4
- **来源**：spec 推导（spec:54：允许组 3 / 禁止组 5 / 席级组 `seatGroups` 本轮为空集）
- **前置**：`definitions/commands.mjs` 已落。
- **步骤**：① 取 `CMD.commandGroups` / `CMD.forbiddenGroups` / `CMD.seatGroups` 键集；② 与 §0.2 的 8 个组 ID 比较；③ 每组断言 `purpose` 非空字符串、`verbs` 是非空数组；④ 断言允许/禁止集合划分；⑤ 断言真仓库 `seatGroups` 为空对象（本轮空集落地，内容由不变量 8 守）；⑥ 断言 `network.verbs` **恰三项**（`安装` / `网络写` / `node -e`），且 `下载类命令` **只在 `purpose`**、不在 `verbs`（`spec:54`：形态描述进 `purpose`，`verbs` 只放可逐项复算的字面成员）。
- **预期**：允许 + 禁止恰 8 组；`seatGroups` 键集为空；`git.read` 的每个 verb 都含 `--no-optional-locks`；`network.verbs` 成员集恰 `{安装, 网络写, node -e}`、`purpose` 含 `下载类命令`。
- **判据**：
  ```js
  const G = CMD.commandGroups;                       // 允许组
  const D = CMD.forbiddenGroups;                     // 禁止组
  assert.deepEqual(Object.keys(G), ['check.local','git.read','docgen.read'], '允许组顺序 = 卡面顺序');
  assert.deepEqual(Object.keys(D), ['docgen.write','git.write','fs.write','env.assign','network']);
  for (const g of [...Object.values(G), ...Object.values(D)]) {
    assert.ok(typeof g.purpose === 'string' && g.purpose.trim().length > 0);
    assert.ok(Array.isArray(g.verbs) && g.verbs.length > 0);
  }
  for (const v of G['git.read'].verbs) assert.match(v, /^git --no-optional-locks /);
  // ⑥ network：verbs 恰三项（spec:54），`下载类命令` 只归 purpose、不得塞回 verbs
  assert.equal(D.network.verbs.length, 3, 'network.verbs 必须恰三项');
  assert.deepEqual([...D.network.verbs].sort(), ['node -e','安装','网络写'].sort());
  assert.equal(D.network.verbs.some((v) => /下载/.test(v)), false, '`下载类命令` 不是 verb（形态描述归 purpose）');
  assert.ok(D.network.purpose.includes('下载类命令'), 'network.purpose 必须含 `下载类命令` 形态描述');
  assert.deepEqual(Object.keys(CMD.seatGroups ?? {}), [], '本轮 seatGroups 必须是空集（只允许副本内构造）');
  ```
- **红绿证据**：红 = 组名写成 `commandGroups` 里漏掉 `docgen.read` → 8 组变 7 组，V-4 口径直接红；另一红 = 往真仓库 `seatGroups` 塞一条「临时用」的组 → ⑤ 段红（该组没有不变量 8 的作者与失效条件）；再一红 = 把 `下载类命令` 塞回 `network.verbs`（变 4 项）→ ⑥ 的「恰三项」断言红；绿 = 8 组齐 + `seatGroups` 空。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：命令在平台是否真被拦（§10 第 1 条，既成事实）；`seatGroups` 内容合法性（B11 + 不变量 8）。

### S6-TC-A03 5 个禁止组在位且不可被授予

- **覆盖**：V-5 / §3.2 / §3.5 不变量4
- **来源**：spec 推导
- **前置**：同 A02。
- **步骤**：① 断言 5 个禁止组 ID 存在；② 遍历 `SEAT_POLICY` 全部席（含 `__default__`）的 `allowGroups`，求与禁止组 ID 的交集。
- **预期**：交集为空；`docgen.write` 的 `purpose` 必须点明「生成 / 删除 / 替换类」而非「只读」。
- **判据**：
  ```js
  const forbidden = new Set(Object.keys(CMD.forbiddenGroups));
  for (const [seat, p] of Object.entries(SEAT_POLICY)) {
    const hit = (p.allowGroups ?? []).filter((g) => forbidden.has(g));
    assert.deepEqual(hit, [], `${seat} 授予了禁止组`);
  }
  ```
- **红绿证据**：红 = `reviewer-audit.allowGroups` 加 `docgen.write` → 本用例第一处即红（B09 另给 CLI 侧报文证据）；绿 = 现状。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：禁止组的报文形态（归 B09）。

### S6-TC-A04 路径 6 组：21 数组元素 / 22 定义层点名 / 23 卡面成员

- **覆盖**：V-4 / §3.2 paths / §8 V-1③ / V-7
- **来源**：spec 推导（明细取自 §0.1 与现边界句逐项点名；**v9.4 口径 `spec:55`**：`pathGroups` 6 组共 **21 个数组元素 + 1 个 `pattern` 项** → **定义层点名 22**；**卡面 ③ 段成员 23** = 22 按 `、` 再切 `代码、测试` 后 + `spec / plan`）
- **前置**：`definitions/paths.mjs` 已落。
- **步骤**：① 断言 6 个组 ID 与顺序；② 各组数组与 §0.1 明细逐组 `deepEqual`（**含 `ledger` 4 项与 `workspace` 9 项逐项断言，不只比长度 / 总数**）；③ 顶层用正则项表达 `spec / plan`（`pattern` 字段）；④ 断言 `代码、测试` 作为**一个**元素存在（不是拆成两项）；⑤ 断言 `DETECTION_BLIND_SPOTS` 独立导出且**不在** `pathGroups` 里。
- **预期**：6 组顺序 `code / governance / docs.input / build / ledger / workspace`；**21 个数组元素**（+ 1 个 pattern = **定义层点名 22**；卡面成员 **23**）；`spec / plan` 不在任何数组里，而在 `FORBIDDEN_SPEC_PLAN.pattern`；`.session/` 只在 `DETECTION_BLIND_SPOTS` 里。**三个数各有分工、不许混用**：`pathItems()` = **22**（= 定义层 21 个数组元素 + 1 个 pattern 源串）用于「定义层有几个值」；`pathTokens()` = **23**（= 渲染后 ③ 段的成员数：`代码、测试` 在卡面写作两项，再加 `spec / plan`）用于「卡面成员有几个」（`spec:89` 槽 10 = `pathGroups` 六组展开 ∪ `spec / plan`）。
- **判据**：
  ```js
  const P = PTH.pathGroups;
  assert.deepEqual(Object.keys(P), ['code','governance','docs.input','build','ledger','workspace']);
  assert.deepEqual(P.code, ['代码、测试']);
  assert.deepEqual(P.governance, ['rules/','skills/','agents/']);
  assert.deepEqual(P['docs.input'], ['docs/prd/']);
  assert.deepEqual(P.build, ['tools/','scripts/','配置与依赖清单']);
  // **成员名逐项断言**（只比长度 → `docs/reports/` 换成 `docs/misc/` 也绿，等于没判）
  assert.deepEqual(P.ledger, ['docs/after/','docs/handoffs/','docs/reports/','docs/superpowers/retro/'],
    'ledger 组必须逐项相等（换名不换数 → 必红）');
  assert.deepEqual(P.workspace, ['.superpowers/','lessons/','*.local.md','**/ledger.md','.trae/',
    'skills-lock.json','node_modules/','tools/docgen-spike/.tmp-test/','其他评审目录'],
    'workspace 恰 9 项且按定义层顺序逐项相等（换名不换数 / 调序 → 必红）');
  assert.equal(Object.values(P).flat().length, 21);        // 21 数组元素（`代码、测试` 合写盖 2 项）
  assert.equal(pathItems().length, 22);                    // **定义层**：21 元素 + 1 pattern 源串（不是 ③ 段成员数）
  assert.equal(pathTokens().length, 23);                   // **卡面**：③ 段成员 23（21 元素按 `、` 再切 = 22，+ `spec / plan`）
  assert.ok(pathTokens().includes('spec / plan'), '第 23 项 `spec / plan` 必须进成员集合（否则 ③ 段只有 22 项）');
  assert.ok(PTH.FORBIDDEN_SPEC_PLAN.pattern instanceof RegExp);
  assert.match('spec / plan', PTH.FORBIDDEN_SPEC_PLAN.pattern);
  assert.match('spec/plan', PTH.FORBIDDEN_SPEC_PLAN.pattern);
  assert.deepEqual(PTH.DETECTION_BLIND_SPOTS, ['.session/','.superpowers/','lessons/']);
  for (const g of Object.values(P)) assert.equal(g.includes('.session/'), false, '检测盲区不得混进禁写清单');
  ```
- **红绿证据**：红 = 漏 `其他评审目录` → 数组元素 20、`pathItems()` 21、`pathTokens()` 22，且卡面少一项 → `gate` 红；另一红 = **把 `ledger` 的 `docs/reports/` 换成 `docs/misc/`**（总数仍 4 项、总元素仍 21、6 组不变）→ `P.ledger` 的 `deepEqual` 红（只比长度 / 总数时这条必漏，故必须逐项断言）；再一红 = `workspace` 两项调序或换名（仍 9 项）→ `P.workspace` 的 `deepEqual` 红；另一红 = 把 `.session/` 塞进 `workspace` 组 → 末条断言红（检测盲区 ≠ 禁写清单，议会 #3 F5）；再一红 = 槽 10 只展开 `pathGroups`、漏掉 `spec / plan` → `pathTokens()` 仍 23、但渲染后 ③ 段成员只有 22（A06 / C08 / F02 / H02 的 23 项断言同时红）；绿 = 21 元素 / `pathItems()` 22 / `pathTokens()` 23。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：路径在 `.gitignore` 里的兜底句（属文本层，G01 逐字节兜）。

### S6-TC-A05 `artifacts` 4 项在位、`progress.md` 标 `host`

- **覆盖**：§3.2 artifacts / §3.5 不变量1
- **来源**：spec 推导
- **前置**：`definitions/artifacts.mjs` 已落。
- **步骤**：① 断言四键；② 断言 `progress.md.host === true`、其余三项无 `host`（或 `false`）；③ 断言每项只含归属描述字段，不含「谁能写」这类权限字段（键集白名单）。
- **预期**：`{ 'round-check.md': { owner: 'reviewer-audit' }, 'delivery-audit.md': {...}, 'detective.md': { owner: 'detective-observer' }, 'progress.md': { owner: 'host', host: true } }`；键集 ⊆ `{owner, host, note}`。
- **判据**：
  ```js
  const A = ART.artifacts;
  assert.deepEqual(Object.keys(A).sort(), ['delivery-audit.md','detective.md','progress.md','round-check.md']);
  assert.equal(A['progress.md'].host, true);
  for (const k of ['round-check.md','delivery-audit.md','detective.md']) assert.notEqual(A[k].host, true, k);
  for (const [f, v] of Object.entries(A)) {
    assert.deepEqual(Object.keys(v).filter((x) => !['owner','host','note'].includes(x)), [], f);
    assert.ok(/\.md$/.test(f), '产物名必须是文件名，不是路径');
  }
  ```
- **红绿证据**：红 = 把 `progress.md` 写成 `'progress.md': { owner: 'host' }`（缺 `host: true`）→ 后续渲染会把 `progress.md` 当席产物列出（越权形态）；绿 = 如上。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：账本模板内容（`assets/round-check.md` 等）——S6-B。

### S6-TC-A06 卡面切片顺序 == 定义层组内顺序（两处）

- **覆盖**：V-4「组内顺序 = 卡面顺序」/ §3.4
- **来源**：spec 推导
- **前置**：两张卡已由 `renderBoundary` 渲染（等价迁移后）。
- **步骤**：① 从两张 producer 卡的边界节切出「逐项点名：…」到「；兜底句」之间的片段，按 `、` 切；② 断言集合 == `pathTokens()`（23 项，派生），且去掉 `spec / plan` 后逐项顺序 == 定义层顺序；③ 对渲染文本切出「只跑下列白名单…」到「**禁止**」之间的片段，断言 `Object.values(CMD.commandGroups).flatMap(g => g.verbs)` 逐项出现且**出现位置单调递增**；④ 两席各跑一次。
- **预期**：两席 ③ 段**成员数 = 23**（定义层 21 个数组元素 + 1 个 `pattern` = **22 个定义层点名**；卡面把 `代码、测试` 拆成两项再加 `spec / plan` = **23**）；组内顺序逐项相等；**段数与项数一律派生**（不写死 21/22/23 之外的常数，也不写死组数）。
- **判据**：
  ```js
  const sec = (t) => t.slice(t.indexOf('逐项点名：'), t.indexOf('；兜底句'));
  const strip = (s) => s.trim().replace(/^`|`$/g, '');
  for (const seat of ['reviewer-audit', 'detective-observer']) {
    // ① 卡面路径段：成员数 = 23（含 `spec / plan`）+ 去掉 pattern 项后的顺序
    const items = sec(card(seat)).split('、').map(strip).filter(Boolean);
    assert.equal(items.length, 23, `${seat}: ③ 段成员数应为 23（不是 22）`);
    assert.deepEqual([...items].sort(), [...pathTokens()].sort(), `${seat}: 路径项集合 ≠ 23 项`);
    const noPattern = (a) => a.filter((x) => x !== 'spec / plan');
    assert.deepEqual(noPattern(items), noPattern(pathTokens()), `${seat}: 组内顺序 ≠ 卡面顺序`);
    // ② 命令段：14 条允许命令逐项出现且位置单调（= 顺序 = 定义层顺序）
    const out = renderBoundary(seat);
    const allowSeg = out.slice(out.indexOf('只跑下列白名单'), out.indexOf('**禁止**'));
    const verbs = Object.values(CMD.commandGroups).flatMap((g) => g.verbs);
    const pos = verbs.map((v) => allowSeg.indexOf(v));
    assert.ok(pos.every((i) => i >= 0), `${seat}: 允许命令缺项`);
    assert.deepEqual([...pos].sort((a, b) => a - b), pos, `${seat}: 允许命令顺序 ≠ 定义层顺序`);
  }
  ```
- **红绿证据**：红 = 定义层把 `workspace` 组内 `.trae/` 与 `lessons/` 调序 → 卡面随之变（`gate` 也红，但本用例定位更准：指出是「顺序」而非「内容」）；另一红 = 只在一条席上做样本（侦探卡的写入范围段整段缺）→ 循环第二圈红；绿 = 两席顺序一致。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：`spec / plan` 正则项在卡面顿号序列里以「一项」出现（其形态由 A04 的 regex 断言兜，本条只断它在集合里）。

### S6-TC-A07 组 ID 唯一且符合 v4 谓词（含冒号）、不含 `/`、反引号、空格、`--`

- **覆盖**：§3.2「组 ID 稳定」/ §3.4 归码优先级（ID 谓词）
- **来源**：spec 推导（**v4 已把 ID 谓词写死为 `^[a-z][a-z0-9.:-]*$`**，容纳带冒号的席级组 `seat:<slug>.extra`；本条按 spec 谓词判形态，再叠加一层更严的命名纪律）
- **前置**：三层定义文件已落。
- **步骤**：① 对所有组 ID（命令 8 + 路径 6 + artifacts 键 4 + capability 3）跑 **spec §3.4 的谓词**；② 再跑命名纪律（不含 `/`、反引号、空格、`--`）；③ 断言跨层唯一。
- **预期**：全部 ID 匹配 `/^[a-z][a-z0-9.:-]*$/`（`docs.input` 与 `seat:<slug>.extra` 两种形态都过；后者只有席级组才有）；命名纪律 0 命中；跨层不重名。
- **判据**：
  ```js
  const ID = /^[a-z][a-z0-9.:-]*$/;        // = spec §3.4 归码谓词（与实现同一口径，不另造）
  const ids = [...Object.keys(CAP.capabilities), ...Object.keys(CMD.commandGroups),
    ...Object.keys(CMD.forbiddenGroups), ...Object.keys(PTH.pathGroups), ...Object.keys(ART.artifacts)];
  for (const id of ids) {
    assert.match(id, ID, id);
    assert.equal(/[\/`\s]|--/.test(id), false, `组 ID 含非法字符：${id}`);   // 命名纪律，严于归码谓词
  }
  assert.equal(new Set(ids).size, ids.length, '组 ID 跨层重名');
  ```
- **红绿证据**：红 = 把 `docs.input` 写成 `docs/input` → spec 谓词与命名纪律双红；另一红 = 实现自造一套更严的谓词（如旧的 `^[a-z][a-z0-9.-]*$`）→ 合法席级组 `seat:senior-sdet.extra` 被判形态错、归码从 `ForbiddenGroupGranted` 漂成 `LiteralInConfig`（B10/B11 同红）；绿 = 如上。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：ID 的语义是否恰当（语义判断，归议会）；归码的类别归属（B14/B15 判形态错 → `LiteralInConfig`，B06–B08 判形态对未登记 → `UnknownPolicyRef`）。

### S6-TC-A08 定义层值含 `{{SLOT}}` / `$&` / `$'` / `$$` 时不得被二次展开

- **覆盖**：§3.4 **单趟**替换（`tpl.replace(/\{\{([A-Z_]+)\}\}/g, …)`，`spec:93`）/ §3.5 不变量7 边界 / 槽 1 `{{SEAT}}` 与 `dump.expanded[0]` 原样（`spec:76` / `spec:162`）
- **来源**：spec 推导（`spec:93`：**单趟** `tpl.replace(/\{\{([A-Z_]+)\}\}/g, (_, k) => values[k])`——槽值不参与二次扫描、不解释 `$&` / `$'` / `$$`；「单趟」= **一次**正则扫描，「12 次 `replaceAll` 顺序替换」与它不等价）+ 实现观察（补充）——议会 #3 F25
- **前置**：两个独立副本（每例一副本）；副本内把某路径组成员改成含 `{{DENY_GROUPS}}` / `$&` / `$'` / `$$` 的字符串，另一副本内把 `reviewer-audit` 的 `display` 改成含 `{{DETECTION_CMD}}` 的字符串（仅用于构造，不改真仓库）。
- **步骤**：① 副本内改定义层（一个成员同时含四种形态）；② `renderBoundaryIn(d, 'reviewer-audit')` 取渲染结果；③ 断言整串**原样出现**（`$&` 不被当成「匹配到的槽名」、`$'` 不被当成「匹配之后的部分」、`{{DENY_GROUPS}}` 不被二次展开）；④ **另一副本**：`display` 含 `{{DETECTION_CMD}}` → 渲染后该字面**原样输出**（不得被后一个槽扫掉），且 `policy --dump` 的 `expanded[0]`（槽 1 `SEAT`）仍等于该字符串。
- **预期**：注入值逐字原样输出——三个字符串特殊序列 + 两个槽位形态都不被二次处理；`expanded[0]` 与 `display` 逐字相等。
- **判据**：
  ```js
  const PROBE = "$&|$'|$$|{{DENY_GROUPS}}";
  withCopy((d) => {
    editInDir(d, 'tools/docgen/policy/definitions/paths.mjs',
      (s) => s.replace("'配置与依赖清单'", JSON.stringify(PROBE)));
    const out = renderBoundaryIn(d, 'reviewer-audit');
    assert.ok(out.includes(PROBE), `注入值被二次解释 / 二次展开：${PROBE}`);
  });
  // ④ 单趟替换（spec:93）：槽值里出现**另一个槽名**时不得被后一个槽扫掉；expanded 的 SEAT 项仍是该字符串
  const SEAT_PROBE = '审计{{DETECTION_CMD}}席';
  withCopy((d) => {
    editInDir(d, 'tools/docgen/policy/definitions/seats.mjs',
      (s) => s.replace("display: '审计'", `display: ${JSON.stringify(SEAT_PROBE)}`));
    const out = renderBoundaryIn(d, 'reviewer-audit');
    assert.ok(out.includes(SEAT_PROBE), `display 里的槽名被二次展开（不是单趟替换）：期望原样 ${SEAT_PROBE}`);
    assert.equal(dumpPolicy(d).json.seats['reviewer-audit'].expanded[0], SEAT_PROBE,
      'expanded[0]（槽 1 SEAT）必须仍是 display 原串');
  });
  ```
- **红绿证据**：红 = 用字符串式 `replaceAll(slot, value)` → `$&` 展开成槽名、`$'` 展开成尾部，`out.includes(PROBE)` 直接红；另一红 = 循环 `replaceAll` 且 `{{DENY_GROUPS}}` 排在 `{{FORBIDDEN_PATHS}}` 之后 → 注入值被展开成禁止组，同样红；**再一红（④ 的判别点）= 改成 12 次 `replaceAll` 顺序替换 → `display` 里的 `{{DETECTION_CMD}}` 会被后一个槽扫掉、`out.includes(SEAT_PROBE)` 与 `expanded[0]` 双双红**；绿 = 单趟正则扫描 + 函数式替换。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：模板作者手写恶意槽位（C07 覆盖「未声明槽位」）；槽值为 `undefined` 的守卫（C06 的「无 `undefined`」断言 + `TemplateImpure`）。

### S6-TC-A09 卡面 CRLF / BOM → `gate` 必报 `Mismatch`（禁归一化后判绿）

- **覆盖**：§3.6 编码与换行（`spec:124`）/ §2 第 1 条 / 议会 #3 F30
- **来源**：spec 推导（`spec:124`：渲染与写入统一 `\n`、UTF-8 **无 BOM**；卡面出现 CRLF / BOM 时 `gate` 报 `Mismatch`，**不静默归一化**——`gate` 是逐字节比较）+ 议会 #3 F30「零 CRLF/BOM fixture」
- **前置**：两个独立副本（一例 CRLF、一例 BOM）。
- **步骤**：① 副本 A：把 `agents/reviewer-audit.md` 全部 `\n` 改 `\r\n`；跑 `gate`；② 副本 B：在文件首加 `\uFEFF`；跑 `gate`；③ 每例断言 `exit 1` 且报文命中 `Mismatch:`——**不得**写成「归一化并绿也可」（spec:124 已写死单一行为）；④ 渲染侧两席只产 `\n`、无 BOM。
- **预期**：渲染器只产 `\n`、无 BOM；盘上有 CRLF / BOM 时 `gate` 必报 `Mismatch`（exit 1），不得归一化后判绿。
- **判据**：
  ```js
  const CASES = [
    { name: 'CRLF', fn: (d) => editInDir(d, 'agents/reviewer-audit.md', (s) => s.replace(/\r?\n/g, '\r\n')) },
    { name: 'BOM', fn: (d) => editInDir(d, 'agents/reviewer-audit.md', (s) => `\uFEFF${s}`) },
  ];
  for (const c of CASES) {
    withCopy((d) => {
      c.fn(d);
      const r = runCli(d, ['gate']);
      assert.equal(r.status, 1, `${c.name}: 卡面 CRLF/BOM 必须判红（spec:124 不静默归一化）`);
      assert.match(r.stderr, /^Mismatch:/m, `${c.name}: 期望 Mismatch，实得 ${r.stderr.split('\n')[0]}`);
    });
  }
  // 渲染侧必须只产 \n、且不带 BOM（与盘上无关）
  for (const s of ['reviewer-audit', 'detective-observer']) {
    const out = renderBoundary(s);
    assert.equal(out.includes('\r'), false, `${s}: 渲染含 CR`);
    assert.equal(out.startsWith('\uFEFF'), false, `${s}: 渲染带 BOM`);
  }
  ```
- **红绿证据**：红 = `gate` 读盘时对行尾 / BOM 归一化后仍判「一致」（`status === 0`）→ 第一条断言即红（这正是 spec:124「不静默归一化」要拦的形态）；另一红 = 模板里有人塞了 `\r` 或 BOM（渲染侧两条断言直接红）；绿 = 两种盘上形态都报 `Mismatch`、渲染侧干净。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：Windows / POSIX 路径分隔符差异（§5 只手动验证第 7 条）。

### S6-TC-B01 三席 + `__default__` 策略数据等价；黄金 4 键齐（哈希只记事实）

- **覆盖**：**V-1**（策略数据面）/ §3.3 / §3.5 不变量9 / §3.6（含 **`tierBySeat` 派生**：派生值 == 映射值、**不含 `__default__`**）/ **V-2 辅助（哈希与字节不作通过判据）** / §3.2 `tiers`（四档）/ §3.2 `seats`（可选槽缺省）
- **来源**：spec 推导（`spec:118` 字节相等「只作定位」；`spec:113` 不变量 9 档位一致；`spec:53` 四档；`spec:57` `display` 必填 / `clause` 与 `escalationWriter` 可缺省；议会 #3 F1 / F4：删掉「sha == 黄金」的硬断言，改记 `hashEqual` 事实；后端复核第 2 轮 BE-1 / BE-7 / BE-8）
- **前置**：`seat-policy.mjs` 已落；改造前的两份边界句已按 spec §3.6 / §6 步骤 3 转成 sha256 黄金（`tools/docgen/fixtures/boundary-golden.json`，**只存哈希、不落全文**）。**黄金一律取自「改造前」文本**：两席 = `git show <sourceCommit>:agents/<席>.md` 的旧卡边界节、`default-boundary` / `evidence-reader-boundary` = 现常量；**不得用改造后渲染自哈希**（否则 `hashEqual` 恒真、定位线索归零，`spec:172`）。**换代规则**：golden 只在迁移 commit 写一次；若 V-13 判 B 更优导致文本变更，同一评估轮内**追加**新键 `<席>@<轮次>` 并在 `checklist.md` 记「golden 已换代」，**旧键不删**。**换代后的「当前比对键」**（`spec:198`）= 同席 `<席>@<轮次>` 中轮次**最大者**，无换代键则取基线键——定位线索永远有终点（`goldenKeyFor` / `goldenCurOf`，§0.3）。
- **步骤**：① 断言 `Object.keys(SEAT_POLICY)` = 三席 + `__default__`；② 每席 `capabilities` / `allowGroups` / `artifacts` 与 §3.3 示例逐项相等；③ **两 producer 席**算 `renderBoundary` 的 sha256 并与黄金比较，**结果只记进 `hashEqual` 布尔**（不进任何失败判据）；④ 黄金表**必须含 §5 写死的 4 个基线键**（换代只许追加 `<席>@<轮次>`，旧键不删；追加键不得替代基线键），且**黄金值取自改造前**（两席 = 旧卡边界节的 sha256、`default-boundary` = `DEFAULT_BOUNDARY` 的 sha256）；④' **当前比对键** = `goldenKeyFor(席)`（同席 `<席>@<轮次>` 轮次最大者，无则基线键，`spec:198`），定位值取 `goldenCurOf(席)`；⑤ 断言 **四档齐**（`readOnly` / `sdet` / `command` / `producer`）+ **档位值是工具名** + `tierOfCapabilities(该席 capabilities)` === 渲染文本里的档位名（不变量 9）+ 该席 `caps` 展开的工具集 == `TIERS[该档位]`；⑥ `senior-sdet` / `__default__` **不设卡面黄金**；⑦ **不变量 9 负例**：副本内把 `senior-sdet.capabilities` 改成 `['read','write','exec']`（与 `tierBySeat` 的 `sdet` 不一致）→ 必须报 `UnknownPolicyRef`；⑧ **可选槽缺省（数据面）**：三席 `display` 全写死、`senior-sdet` 未声明 `escalationWriter`、`clause` 缺省为 `''`（「缺省未声明」≠「显式 `undefined`」——后者由 C09 判 `TemplateImpure`）；⑨ **负例（换代取键）**：构造含 `<席>@1` / `<席>@2` 的黄金副本（值 = 换代后文本哈希）→ `goldenKeyFor` 必须取 `@2`；若仍取旧基线键 → `hashEqual` 恒 false（定位线索失效）→ 红；⑩ **`tierBySeat` 派生断言**（`spec:120`）：键集**恰三席**（`Object.keys(patternRegistry.tierBySeat).sort()` ≡ `['detective-observer','reviewer-audit','senior-sdet']`、≡ `SEAT_NAMES`、且 `Object.hasOwn(…,'__default__') === false`）；每键值 `=== tierOfCapabilities(SEAT_POLICY[席].capabilities)`（**派生值 == 映射值**，不得手写第二份 / 不得手改成别的档）。
- **预期**：`reviewer-audit` / `detective-observer` = `['read','write','exec']` + `['check.local','git.read','docgen.read']`；`senior-sdet` = `['read','write']` + `[]`；`__default__` = `['read']` + `[]`；档位表四档齐（`command` 键在）且**值是工具名**；黄金 4 个基线键齐且取自改造前，**当前比对键** = 轮次最大的 `<席>@<轮次>`（无则基线键）；`hashEqual` 是布尔（相等是最好情况，不相等不判失败——通过与否看 H02 空差 + H06 判定表）；可选槽缺省值合法；`tierBySeat` 键集恰三席、**不含 `__default__`**、三席值 = `producer` / `producer` / `sdet`（全部由 `SEAT_POLICY` 现算派生）。
- **判据**：
  ```js
  assert.deepEqual(Object.keys(SEAT_POLICY), ['reviewer-audit','detective-observer','senior-sdet','__default__']);
  assert.deepEqual(SEAT_POLICY['reviewer-audit'], { capabilities: ['read','write','exec'],
    allowGroups: ['check.local','git.read','docgen.read'], artifacts: ['round-check.md','delivery-audit.md'] });
  assert.deepEqual(SEAT_POLICY['senior-sdet'], { capabilities: ['read','write'], allowGroups: [], artifacts: [] });
  assert.deepEqual(SEAT_POLICY.__default__, { capabilities: ['read'], allowGroups: [], artifacts: [] });
  // ④ 黄金：4 个**基线键**必须在（换代只许追加 `<席>@<轮次>`、旧键不删），且值取自**改造前**文本
  const gk = Object.keys(golden());
  for (const k of ['default-boundary','detective-observer','evidence-reader-boundary','reviewer-audit']) {
    assert.ok(gk.includes(k), `黄金缺基线键 ${k}（换代不得删旧键）`);
  }
  for (const k of gk.filter((x) => x.includes('@'))) assert.match(k, /@\d+$/, `换代键形态应为 <席>@<轮次>：${k}`);
  // ④' 当前比对键（spec:198）：同席 `<席>@<轮次>` 轮次**最大者**；无换代键 → 回落基线键
  for (const s of ['reviewer-audit','detective-observer']) {
    const k = goldenKeyFor(s);
    assert.match(k, new RegExp(`^${s}(@\\d+)?$`), `${s}: 当前比对键形态不对：${k}`);
    const rounds = gk.filter((x) => x.startsWith(`${s}@`)).map((x) => Number(x.split('@')[1]));
    if (rounds.length > 0) assert.equal(k, `${s}@${Math.max(...rounds)}`, `${s}: 当前比对键必须取轮次最大者`);
    else assert.equal(k, s, `${s}: 无换代键时必须回落基线键`);
  }
  assert.equal(goldenOf('default-boundary'), sha(DEFAULT_BOUNDARY), 'default-boundary 必须取自改造前常量');
  const baseRev = baseJson().sourceCommit;
  for (const s of ['reviewer-audit','detective-observer']) {
    assert.equal(goldenOf(s), sha(cardBoundary(gitShow(baseRev, `agents/${s}.md`)).trim()),
      `${s}: 黄金必须取自改造前旧卡（不得用改造后渲染自哈希，spec:172）`);
  }
  // ③ 只取事实，不据此下结论；比对键 = 当前比对键（换代后取最大轮次，否则基线键）
  const hashEqual = sha(renderBoundary('reviewer-audit')) === goldenCurOf('reviewer-audit');
  assert.equal(typeof hashEqual, 'boolean');
  // ⑤ 档位表**四档**（spec:53；`TIERS` 本身是档位对象，值是工具名）+ 不变量 9：capabilities 展开的工具集 ≡ TIERS[档] ≡ toolsForSeat(席)
  assert.deepEqual(Object.keys(TIERS), ['readOnly','sdet','command','producer']);
  const TOOLS = new Set(Object.values(CAP.capabilities).flat());
  for (const [tier, tools] of Object.entries(TIERS)) {
    for (const t of tools) assert.ok(TOOLS.has(t), `${tier}: ${t} 不是工具名（档位值不得写成 capability ID）`);
  }
  // 同引用（spec:53）：`patternRegistry.tools` 就是 `TIERS` 本身（严格相等，不得另存 / 深拷贝 / 改名）
  assert.equal(patternRegistry.tools, TIERS, 'patternRegistry.tools 必须 re-export tiers.mjs 的同一对象');
  for (const s of ['reviewer-audit','detective-observer','senior-sdet']) {
    const expanded = SEAT_POLICY[s].capabilities.flatMap((c) => CAP.capabilities[c]);
    assert.deepEqual([...expanded].sort(), [...toolsForSeat(s)].sort(), `${s}: capabilities 展开 ≠ toolsForSeat`);
    const tier = tierOfCapabilities(SEAT_POLICY[s].capabilities);
    assert.deepEqual([...expanded].sort(), [...TIERS[tier]].sort(), `${s}: caps 展开 ≠ TIERS[${tier}]`);
    assert.equal(tier, factsFromText(renderBoundary(s), probeDict()).tier, s);
  }
  // ⑧ 可选槽缺省（spec:57）：display 三席全写死；clause 缺省 = ''；escalationWriter 缺省 = 未声明（≠ 显式 undefined）
  for (const s of SEATS.SEAT_NAMES) assert.ok(String(SEATS.SEATS[s].display).trim().length > 0, `${s}: display 必须写死非空`);
  assert.equal(SEATS.SEATS['senior-sdet'].display, '测试开发');
  assert.equal(Object.hasOwn(SEATS.SEATS['senior-sdet'], 'escalationWriter'), false, 'senior-sdet 应**缺省** escalationWriter（未声明）');
  assert.equal(SEATS.SEATS['senior-sdet'].clause ?? '', '', "senior-sdet 的 clause 缺省值必须是 ''");
  assert.equal(SEATS.SEATS.__default__.clause, '', "__default__.clause 必须为 ''");
  // 判定函数结构里没有哈希位
  assert.equal(verdict.length, 1);
  assert.equal(verdict({ minus: [], plus: [] }), 'pass');
  // ⑦ 不变量 9 负例：配置展开的档位 ≠ patternRegistry.tierBySeat 的档位 → UnknownPolicyRef
  const tierMismatch = withCopy((d) => {
    setSeatPolicy(d, 'senior-sdet', { ...SEAT_POLICY['senior-sdet'], capabilities: ['read','write','exec'] });
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(tierMismatch.status, 1);
  assert.match(tierMismatch.stderr.split('\n')[0], /^UnknownPolicyRef: senior-sdet:tier=.+$/);
  // ⑨ 负例（换代取键，spec:198）：golden 副本追加 `reviewer-audit@1` / `@2`（值 = 换代后文本哈希）→ 必须取 @2
  const cur = renderBoundary('reviewer-audit');
  const newText = `${cur}\n<!-- V-13 换代后追加的措辞 -->`;
  const gen = { ...golden(), 'reviewer-audit@1': sha(`${cur}\n<!-- round 1 -->`), 'reviewer-audit@2': sha(newText) };
  assert.equal(goldenKeyFor('reviewer-audit', gen), 'reviewer-audit@2', '换代后必须取轮次最大的键（spec:198）');
  assert.equal(gen[goldenKeyFor('reviewer-audit', gen)], sha(newText), '当前比对键必须命中换代后的文本');
  // 反例：换代后仍取旧基线键 → 换代后的文本与基线不等 → hashEqual 恒 false（定位线索失效）→ 必须红
  assert.notEqual(sha(newText), gen['reviewer-audit'], '换代后仍取旧基线键 → 定位线索失效 → 必红');
  // ⑩ tierBySeat **派生**（spec:120）：由 `SEAT_POLICY` 逐 `SEAT_NAMES`（= `Object.keys(SEATS)` 去 `__default__`）调
  // `tierOfCapabilities(caps)` 派生，不再手写第二份；**派生结果不得含 `__default__`**
  assert.deepEqual(Object.keys(patternRegistry.tierBySeat).sort(),
    ['detective-observer','reviewer-audit','senior-sdet'],
    'tierBySeat 键集必须恰为三席（不得含 `__default__`）');
  assert.deepEqual(Object.keys(patternRegistry.tierBySeat).sort(), [...SEATS.SEAT_NAMES].sort(),
    'tierBySeat 键集 ≡ SEAT_NAMES（= Object.keys(SEATS) 去 `__default__`，spec:57 / :120）');
  assert.equal(Object.hasOwn(patternRegistry.tierBySeat, '__default__'), false,
    '派生结果不得含 `__default__`（spec:120：把保留键一起派生进去 → 本断言必红）');
  for (const s of SEATS.SEAT_NAMES) {
    assert.equal(patternRegistry.tierBySeat[s], tierOfCapabilities(SEAT_POLICY[s].capabilities),
      `${s}: 派生值必须 == 映射值（tierBySeat[s] === tierOfCapabilities(SEAT_POLICY[s].capabilities)），不得手改成别的档`);
  }
  assert.deepEqual(
    Object.fromEntries(SEATS.SEAT_NAMES.map((s) => [s, patternRegistry.tierBySeat[s]])),
    { 'reviewer-audit': 'producer', 'detective-observer': 'producer', 'senior-sdet': 'sdet' },
    '三席档位值 = 由 SEAT_POLICY 现算的结果（reviewer-audit / detective-observer = producer，senior-sdet = sdet）');
  ```
- **红绿证据**：红 = 把 `senior-sdet` 的 `capabilities` 写成 `['read']`（丢了写权）→ 其渲染的档位事实段由 `producer` 变 `readOnly`，⑤ 的不变量 9 断言直接红（数据与渲染不同源）；另一红 = 把哈希相等写成 `assert.equal`（v5 口径）→ 模板一旦重排措辞就永久红，与 §2 第 2 条冲突；再一红 = 黄金改用**改造后**渲染自哈希 → ④ 的 `goldenOf(席) === sha(旧卡边界节)` 断言红（自哈希永远「相等」，定位线索归零）；再一红 = 换代时删掉基线键、只留 `<席>@<轮次>` → ④ 的「基线键必须在」红；再一红 = **换代后仍取旧基线键** → ⑨ 的 `notEqual` 与 `goldenKeyFor` 断言同时红（文本已换代、基线键永不相等 → 定位线索失效）；再一红 = 档位值写回 capability ID（`TIERS.command = ['read','exec']`）→ ⑤ 的「值 ∈ 工具全集」与 `caps 展开 ≠ TIERS[档]` 同时红；再一红 = 档位表只剩三档 → ⑤ 的四档断言红；再一红 = 把 `__default__` 也派生进 `tierBySeat`（键集变 4）→ ⑩ 的「键集恰三席」与 `hasOwn('__default__') === false` 两条断言同时红；再一红 = 手把 `senior-sdet` 的 `tierBySeat` 值改成 `producer`（配置未动、映射被手改第二份）→ ⑩ 的「派生值 == 映射值」与三席值断言红（`spec:120` 正是禁手写第二份）；绿 = 数据等价 + 四档（工具名）+ 黄金取自改造前 + 当前比对键取最大轮次 + `hashEqual` 只作事实 + `tierBySeat` 完全由配置派生。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：`tools` 行（S5 已覆盖，`tool-tiers.test.mjs` A01/C02）；`evidence-reader`（§2「不做什么」4）。

### S6-TC-B02 真实 `seat-policy.mjs` closed-world：三键外零字符串、三键内逐条登记

- **覆盖**：**V-3** / §3.5 不变量1 / §3.5 不变量2 / §3.7
- **来源**：spec 推导（v2 已把 V-3 从「三条弱探针」改为 **closed-world**；v8 §3.7 `spec:128-131` 补三条边界：对象键、`__default__` 保留键、`seatGroups` 键入候选集——议会 #3 F4 / F19）
- **前置**：`policy/seat-policy.mjs` 已落；`definitions/seats.mjs` 已落（对象形状 + `__default__`）。
- **步骤**：① 读配置源码（**先剥注释**，防止有人用注释藏路径），抽出全部引号字面量（反引号先归一成单引号），与 `ALLOWED_LITERALS()` 求差集；② **结构面**：遍历 `SEAT_POLICY`，每席键集恰 `{capabilities, allowGroups, artifacts}`，逐个值查定义层；③ **对象键面**：每个对象键 ∈ `Object.keys(SEATS.SEATS)`（= `SEAT_NAMES`），`__default__` 是保留键且 `display` 非空；④ **席级组候选集**：`seatGroups` 的每个键 ∈ `ALLOWED_LITERALS()`（故配了席级组也不必改白名单）；⑤ 顺带跑三条弱探针——**只作快速失败，不作为主判据**。
- **预期**：差集为空；每席三键齐；值全部登记；对象键全部登记；`__default__` 在 `SEATS` 里且 `display` 非空；三条探针 0 命中。
- **判据**：
  ```js
  const src = readFileSync('tools/docgen/policy/seat-policy.mjs', 'utf8');
  const strays = stringLiterals(src).filter((s) => !ALLOWED_LITERALS().has(s));
  assert.deepEqual(strays, [], '配置层出现非登记字符串字面量（closed-world 破坏）');
  for (const [seat, p] of Object.entries(SEAT_POLICY)) {
    assert.deepEqual(Object.keys(p).sort(), ['allowGroups','artifacts','capabilities'], seat);
    for (const c of p.capabilities) assert.ok(Object.hasOwn(CAP.capabilities, c), `${seat}:capability=${c}`);
    for (const g of p.allowGroups) assert.ok(
      Object.hasOwn(CMD.commandGroups, g) || Object.hasOwn(CMD.seatGroups ?? {}, g),
      `${seat}:group=${g}（禁止组不在此放行，见 B09/B10）`);
    for (const a of p.artifacts) assert.ok(Object.hasOwn(ART.artifacts, a), `${seat}:artifact=${a}`);
  }
  // ③ 对象键 ∈ SEAT_NAMES；__default__ 是保留键（**不在** SEAT_NAMES 里，spec:57）且 display 非空
  for (const seat of Object.keys(SEAT_POLICY)) {
    if (seat === '__default__') continue;
    assert.ok(SEATS.SEAT_NAMES.includes(seat), `未登记的对象键：${seat}`);
  }
  assert.ok(Object.hasOwn(SEATS.SEATS, '__default__'), 'SEATS 必须含保留键 __default__');
  assert.equal(SEATS.SEAT_NAMES.includes('__default__'), false, '__default__ 是保留键，不得授予、不得进 SEAT_NAMES');
  assert.ok(String(SEATS.SEATS.__default__.display).trim().length > 0, '__default__.display 不得为空');
  // ④ seatGroups 键进入 closed-world 候选集
  for (const g of Object.keys(CMD.seatGroups ?? {})) assert.ok(ALLOWED_LITERALS().has(g), `席级组 ${g} 未进白名单`);
  // ⑤ 快速失败（不是主判据）：三条弱探针仍 0 命中
  assert.equal(stripComments(src).includes('/'), false);
  assert.equal(stripComments(src).includes('`'), false);
  ```
- **红绿证据**：红 = 配置里塞 `'git status'`（无 `/`、无 `--`、无比引号）→ 三条弱探针全绿、但 closed-world 差集非空 → 本条红（v1 G-1 的缺口，v2 已补）；另一红 = 给未登记席（`ghost-seat`）配一条策略 → ③ 段红（对象键不在 `SEAT_NAMES`）；另一红 = 席级组 `seat:x.extra` 登记后配置引用它、但 `ALLOWED_LITERALS` 未含 `seatGroups` 键 → 差集非空（④ 段证明候选集已含它，避免「一加席级组就得改白名单」）；绿 = 差集为空。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：形态不合 ID 与「ID 形态但未登记」的**归码归属**——spec §3.4 末尾「归码优先级」已写死（先形态 → 后存在性，两条不重复报），负例见 B03/B04/B05/B14/B15 与 B06/B07/B08；谓词本身由 A07 断言，本条不重复。

### S6-TC-B03 配置层塞路径 → `LiteralInConfig`

- **覆盖**：V-3 / §7 `LiteralInConfig`
- **来源**：spec 推导
- **前置**：`withRepoCopy` 副本。
- **步骤**：① 副本内给某席 `allowGroups` 追加 `'docs/after/'`；② `runEsm` 加载配置（或跑 `policy --dump`）；③ 取退出码与 stderr 首行。
- **预期**：exit 1；stderr 首行匹配 `^LiteralInConfig: tools/docgen/policy/seat-policy\.mjs:\d+$`（带行号，可定位）。
- **判据**：
  ```js
  // 五码的发射点 = cli 的 gate / policy --dump（spec:161）；故探针跑 policy --dump，不直接 import 配置模块
  const r = withCopy((d) => {
    grantGroup(d, 'reviewer-audit', 'docs/after/');       // 追加到 allowGroups
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr.split('\n')[0], /^LiteralInConfig: tools\/docgen\/policy\/seat-policy\.mjs:\d+$/);
  ```
- **红绿证据**：红 = 不实现该校验（配置里塞路径后一切照跑，边界句里凭空多出一条非法「组」）；绿 = 如上报文。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：定义层里的路径（合法，正是定义层职责）。

### S6-TC-B04 配置层塞反引号命令 → `LiteralInConfig`

- **覆盖**：V-3 / §7
- **来源**：spec 推导
- **前置**：同 B03。
- **步骤**：副本内把某席 `allowGroups` 追加 `` '`npm run check`' ``（带反引号）；跑 `policy --dump`。
- **预期**：exit 1；首行 `LiteralInConfig: …:<行>`。
- **判据**：
  ```js
  const r = withCopy((d) => {
    grantGroup(d, 'reviewer-audit', '`npm run check`');
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr.split('\n')[0], /^LiteralInConfig: tools\/docgen\/policy\/seat-policy\.mjs:\d+$/);
  ```
- **红绿证据**：红 = 配置层接受反引号串（等于把命令文本搬回配置层，D1 收益归零）；绿 = 报错。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：命令是否 `check.local` 里已存在——即使存在也判红（配置层不许出现命令文本）。

### S6-TC-B05 配置层塞 `--flag` → `LiteralInConfig`

- **覆盖**：V-3 / §7
- **来源**：spec 推导
- **前置**：同 B03。
- **步骤**：副本内给某席 `allowGroups` 追加 `'--write'`；跑 `policy --dump`。
- **预期**：exit 1；首行 `LiteralInConfig: …:<行>`。
- **判据**：
  ```js
  const r = withCopy((d) => {
    grantGroup(d, 'reviewer-audit', '--write');
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr.split('\n')[0], /^LiteralInConfig: tools\/docgen\/policy\/seat-policy\.mjs:\d+$/);
  ```
- **红绿证据**：红 = 配置层接受 `--write`（写权形态从配置层偷偷回流）；绿 = 报错。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：`purpose` 文本里出现 `--flag`（purpose 在定义层，合法）。

### S6-TC-B06 引用不存在的 capability → `UnknownPolicyRef`

- **覆盖**：V-5 / §3.5 不变量1 / §7
- **来源**：spec 推导
- **前置**：同 B03。
- **步骤**：① 副本内把 `senior-sdet.capabilities` 改为 `['read','admin']`；② 跑 `policy --dump`；③ 取退出码与首行。
- **预期**：exit 1；首行 `^UnknownPolicyRef: senior-sdet:capability=admin$`（`<类别>` 词表固定为 `capability|group|artifact`）。**归码口径**：`admin` 过 ID 谓词、只是未登记 → 走存在性判据，**不落** `LiteralInConfig`（spec §3.4 归码优先级）。
- **判据**：
  ```js
  const r = withCopy((d) => {
    setSeatPolicy(d, 'senior-sdet', { ...SEAT_POLICY['senior-sdet'], capabilities: ['read', 'admin'] });
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(r.status, 1);
  assert.equal(r.stderr.split('\n')[0], 'UnknownPolicyRef: senior-sdet:capability=admin');
  ```
- **红绿证据**：红 = 悬空 capability 被静默忽略（该席边界句少一段，`gate` 反而不会报，因为渲染与盘上一致——最难发现的一类）；绿 = 如上。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：悬空组 / 悬空产物（B07 / B08）。

### S6-TC-B07 引用不存在的组 → `UnknownPolicyRef`

- **覆盖**：V-5 / §3.5 不变量1 / §7
- **来源**：spec 推导
- **前置**：同 B03。
- **步骤**：副本内给 `reviewer-audit.allowGroups` 追加 `'git.write2'`；跑 `policy --dump`。
- **预期**：exit 1；首行 `UnknownPolicyRef: reviewer-audit:group=git.write2`（`git.write2` 形态合法、未登记 → `UnknownPolicyRef`）。
- **判据**：
  ```js
  const r = withCopy((d) => {
    grantGroup(d, 'reviewer-audit', 'git.write2');
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(r.status, 1);
  assert.equal(r.stderr.split('\n')[0], 'UnknownPolicyRef: reviewer-audit:group=git.write2');
  ```
- **红绿证据**：红 = 拼错组名被当合法（该席「多一组」而卡面 `gate` 恒绿，因为渲染与盘上同源）；绿 = 报错。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：拼错的组名恰好等于禁止组（归 B09）。

### S6-TC-B08 引用不存在的 artifact 文件 → `UnknownPolicyRef`

- **覆盖**：V-5 / §3.3 artifacts 约束 / §7
- **来源**：spec 推导
- **前置**：同 B03。
- **步骤**：副本内给 `detective-observer.artifacts` 追加 `'snapshot.md'`（`artifacts.mjs` 里没有）；跑 `policy --dump`。
- **预期**：exit 1；首行 `UnknownPolicyRef: detective-observer:artifact=snapshot.md`（`snapshot.md` 形态合法、未登记 → `UnknownPolicyRef`；带 `/` 的 `'definitions/x.mjs'` 归 B15 的 `LiteralInConfig`）。
- **判据**：
  ```js
  const r = withCopy((d) => {
    setSeatPolicy(d, 'detective-observer', { ...SEAT_POLICY['detective-observer'], artifacts: ['detective.md', 'snapshot.md'] });
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(r.status, 1);
  assert.equal(r.stderr.split('\n')[0], 'UnknownPolicyRef: detective-observer:artifact=snapshot.md');
  ```
- **红绿证据**：红 = 新增产物名不登记即被允许 → 边界句允许写一个全仓不存在的文件（越权面扩大且无人知）；绿 = 报错。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：产物归属是否正确（语义，归议会）。

### S6-TC-B09 授予禁止组 `docgen.write` → `ForbiddenGroupGranted`

- **覆盖**：V-5 / §3.5 不变量4 / §7
- **来源**：spec 推导
- **前置**：同 B03。
- **步骤**：副本内给 `reviewer-audit.allowGroups` 追加 `'docgen.write'`（该组在定义层存在，故不触发 `UnknownPolicyRef`）；跑 `policy --dump`。
- **预期**：exit 1；首行 `ForbiddenGroupGranted: reviewer-audit:docgen.write:forbidden`；**不得**先报 `UnknownPolicyRef`（判定顺序：存在性 → 禁用性）。
- **判据**：
  ```js
  const r = withCopy((d) => {
    grantGroup(d, 'reviewer-audit', 'docgen.write');
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(r.status, 1);
  assert.equal(r.stderr.split('\n')[0], 'ForbiddenGroupGranted: reviewer-audit:docgen.write:forbidden');
  ```
- **红绿证据**：红 = 只做存在性校验（该组存在 → 放行 → 审计卡顿时刻获得 `replace` 权，S5 的整个收益被回滚）；绿 = 报错。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：`git.write` / `fs.write` / `env.assign` / `network` 四个组的同类负例（D01 汇总表各给 1 条命令，避免 5 条同构用例灌水）。

### S6-TC-B10 非本席引用 `seat:senior-sdet.extra` → `ForbiddenGroupGranted`

- **覆盖**：V-5 / §3.3 席级组 / §3.5 不变量5
- **来源**：spec 推导
- **前置**：同 B03；副本内先在**定义层登记**席级组 `seat:senior-sdet.extra`（登记位置 = `commands.mjs`，spec §3.5 不变量3 例外②），再挂到 `senior-sdet.allowGroups`（合法，B11），确保该组已存在。
- **步骤**：再给 `reviewer-audit.allowGroups` 追加 `'seat:senior-sdet.extra'`；跑 `policy --dump`。
- **预期**：exit 1；首行 `ForbiddenGroupGranted: reviewer-audit:seat:senior-sdet.extra:other-seat`；**不得**先报 `UnknownPolicyRef`（存在性 → 禁用性/席级性）。
- **判据**：
  ```js
  const r = withCopy((d) => {
    insertInObject(d, 'tools/docgen/policy/definitions/commands.mjs', 'export const seatGroups',
      "'seat:senior-sdet.extra': { purpose: '测试构造', verbs: ['npm run check'] },");
    grantGroup(d, 'senior-sdet', 'seat:senior-sdet.extra');          // 本席合法（B11 正例）
    grantGroup(d, 'reviewer-audit', 'seat:senior-sdet.extra');       // 越席使用
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(r.status, 1);
  assert.equal(r.stderr.split('\n')[0], 'ForbiddenGroupGranted: reviewer-audit:seat:senior-sdet.extra:other-seat');
  ```
- **红绿证据**：红 = 席级组按普通组处理 → 任何席可借用别人的额外组（「只影响一席」的边界被击穿）；绿 = 报错。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：`__default__.allowGroups` 引用席级组（同一谓词的另一种形态，D01 兜）。

### S6-TC-B11 本席 `seat:<名>.extra` 合法且只改本席；席级组 verb 越界 → `:not-allowed` / 撞禁止 → `:verb`

- **覆盖**：V-1 / V-8 / §3.3 席级组 / §3.5 不变量8（**两个方向各一条负例**：① 越出允许集 `:not-allowed` / ② 撞禁止组 `:verb`）
- **来源**：spec 推导（`spec:112` 不变量 8：① `seatGroups[g].verbs` ⊆ 允许组 verbs 并集，**越界 → `ForbiddenGroupGranted`（后缀 `:not-allowed`）**；② 与禁止组 verbs 并集交集为空 → `:verb`；比较粒度 = 按空格切分的 token；议会 #3 F26）
- **前置**：同 B03；副本内先在定义层登记 `seat:senior-sdet.extra`（登记位置 = `commands.mjs`，§3.5 不变量3 例外②）；**三个独立副本**（合法 / 撞禁止 / 越出允许集，互不污染）。
- **步骤**：① 副本内登记席级组 + 给 `senior-sdet` 加 `allowGroups: ['seat:senior-sdet.extra']`；② 跑 `policy --dump`，与真仓库（未改动）的 dump 做键级 diff；③ 另起一个副本：席级组的 verbs 含 `git commit` → 断言 `:verb` 负例；④ **再起一个副本：席级组的 verbs 含 `curl https://x`**（不在任何允许组 verbs 并集里、也不在任何禁止组 verbs 里）→ 断言 **`:not-allowed`**。
- **预期**：② exit 0，`expanded` 只有 `senior-sdet` 变；③ exit 1 + 首行 `ForbiddenGroupGranted: senior-sdet:seat:senior-sdet.extra:verb`；④ exit 1 + 首行 `ForbiddenGroupGranted: senior-sdet:seat:senior-sdet.extra:not-allowed`。
- **判据**：
  ```js
  const before = dumpPolicy(ROOT).json.seats;              // 真仓库：seatGroups 为空
  const after = withCopy((d) => {
    insertInObject(d, 'tools/docgen/policy/definitions/commands.mjs', 'export const seatGroups',
      "'seat:senior-sdet.extra': { purpose: '测试构造', verbs: ['npm run check'] },");
    grantGroup(d, 'senior-sdet', 'seat:senior-sdet.extra');
    return dumpPolicy(d).json.seats;
  });
  const changed = Object.keys(after).filter((s) => JSON.stringify(after[s]) !== JSON.stringify(before[s]));
  assert.deepEqual(changed, ['senior-sdet'], '席级组只许影响本席');
  // ③ 不变量 8 负例：席级组 verbs 与禁止组 verbs 有交集 → :verb
  const bad = withCopy((d) => {
    insertInObject(d, 'tools/docgen/policy/definitions/commands.mjs', 'export const seatGroups',
      "'seat:senior-sdet.extra': { purpose: '测试构造', verbs: ['npm run check', 'git commit'] },");
    grantGroup(d, 'senior-sdet', 'seat:senior-sdet.extra');
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(bad.status, 1);
  assert.equal(bad.stderr.split('\n')[0], 'ForbiddenGroupGranted: senior-sdet:seat:senior-sdet.extra:verb');
  // ④ 不变量 8 方向①（spec:112）：越出**允许组 verbs 并集** → :not-allowed（不是 :verb）
  const outOfAllow = withCopy((d) => {
    insertInObject(d, 'tools/docgen/policy/definitions/commands.mjs', 'export const seatGroups',
      "'seat:senior-sdet.extra': { purpose: '测试构造', verbs: ['curl https://x'] },");
    grantGroup(d, 'senior-sdet', 'seat:senior-sdet.extra');
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(outOfAllow.status, 1);
  assert.equal(outOfAllow.stderr.split('\n')[0], 'ForbiddenGroupGranted: senior-sdet:seat:senior-sdet.extra:not-allowed');
  ```
- **红绿证据**：红 = 席级组被当成普通组写进全局 deny 段 → 两 producer 席的 DENY 段都变、`gate` 红（12 席不接渲染层，故不会「每席都变」）；另一红 = 不变量 8 缺失 → `git commit` 作为席级组 verb 被放行，`bad.status` 为 0（越权面从「组」扩大到「组内 verb」）；**第三红（④ 的判别点）= 只实现「撞禁止组」（②）不实现「越出允许集」（①）→ 断言原样绿**（`curl https://x` 既非禁止 verb 也非允许 verb，无 ① 时会被静默放行）；绿 = 只一席变 + `:verb` / `:not-allowed` 各报一次。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：产物级「只影响一席」的另一形态（E02 用 `check.local` 组做同口径验证）。`git commit` 与 deny verb `commit` 的比较粒度已由 `spec:112` 写死（按空格切分的 token），本用例按 token 判，不再记缺口。

### S6-TC-B12 未登记席与原型链键名回落 `__default__`

- **覆盖**：V-1 / §3.2 未登记席 / §3.3 / §3.7
- **来源**：spec 推导 + 实现观察（补充：`constructor` 能过 `NAME_RE`，S5 已踩过）+ `spec:131`「读配置侧一律 `Object.hasOwn`」
- **前置**：`seat-policy.mjs` 已落。
- **步骤**：对 `'ghost-seat'` / `'Reviewer-Audit'` / `'constructor'` / `'toString'` / `'hasOwnProperty'` / `'__proto__'` / `'__default__'` 七个名字取策略。
- **预期**：前六个都取到 `__default__` 的 `{capabilities:['read'], allowGroups:[], artifacts:[]}`；`'__default__'` 取到自身；查表必须用 `Object.hasOwn`（不能用 `??` 或裸取值）。
- **判据**：
  ```js
  for (const n of ['ghost-seat','Reviewer-Audit','constructor','toString','hasOwnProperty','__proto__']) {
    assert.deepEqual(policyOf(n), SEAT_POLICY.__default__, n);
    assert.equal(Object.hasOwn(SEAT_POLICY, n), false, `${n} 不可能是自有键`);
  }
  assert.deepEqual(policyOf('__default__'), SEAT_POLICY.__default__);
  assert.equal(Object.hasOwn(SEAT_POLICY, '__default__'), true);
  ```
- **红绿证据**：红 = `policyOf = (n) => SEAT_POLICY[n] ?? SEAT_POLICY.__default__` → `constructor` 返回函数对象、`__proto__` 返回 `Object.prototype`，后续 `.capabilities` 为 `undefined`，渲染抛 TypeError；绿 = `Object.hasOwn`。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：`renderBoundary('constructor')`（渲染层入口，C07 兜「非席名输入」）。

### S6-TC-B13 配置里的产物文件名是**登记 ID**，不得误红

- **覆盖**：V-3 假阳性守卫 / §3.5 不变量2 / §3.3
- **来源**：实现观察（补充：`artifacts` 的键本身是 `round-check.md` 这类文件名）+ spec §3.5 不变量2 / §3.7 closed-world（放行理由从「无斜杠」改为「是登记 ID」）
- **前置**：真实配置。
- **步骤**：① 断言 `seat-policy.mjs` 里含 `'round-check.md'`、`'detective.md'`；② 断言这两个串 ∈ `ALLOWED_LITERALS()`（因为它们登记在 `artifacts.mjs`）；③ 对真实配置跑 closed-world 差集（同 B02）。
- **预期**：差集为空——产物文件名靠「已登记」放行，**不是**靠「无 `/`」放行（靠无斜杠放行等于把 `'git status'` 一起放进来）。
- **判据**：
  ```js
  const src = readFileSync('tools/docgen/policy/seat-policy.mjs','utf8');
  assert.match(src, /'round-check\.md'/);
  assert.ok(ALLOWED_LITERALS().has('round-check.md'));
  assert.deepEqual(stringLiterals(src).filter((s) => !ALLOWED_LITERALS().has(s)), []);
  ```
- **红绿证据**：红 = 把「含 `.md`」当路径形态判红 → 正确配置被判违规（假阳性，逼开发者把产物名塞回定义层私有字段，配置层失去归属信息）；另一红 = 只按「无 `/`」放行 → 假阴性（B14 红）；绿 = 按登记表放行。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：`progress.md` 是否被某席引用（A05 断 `host`）；「已登记但不该由该席引用」归 B08。

### S6-TC-B14 配置层塞非 ID 裸命令（`'git status'`）→ `LiteralInConfig`

- **覆盖**：V-3 / §3.5 不变量2 / §7 `LiteralInConfig`
- **来源**：spec 推导（spec v2 §3.5 不变量2 与 §8 V-3 已把 `allowGroups: ['git status']` 定为**必红负例**；v1 本条曾是「缺口记账」）
- **前置**：`withCopy` 副本。
- **步骤**：① 副本内给 `reviewer-audit.allowGroups` 追加 `'git status'`；② 跑 `policy --dump`；③ 取退出码与 stderr 首行。
- **预期**：exit 1；首行 `^LiteralInConfig: tools/docgen/policy/seat-policy\.mjs:\d+$`；**不得**报 `UnknownPolicyRef`（形态不合 ID 谓词 → 先过 closed-world 形态关，spec §3.4 归码优先级）。
- **判据**：
  ```js
  const r = withCopy((d) => {
    grantGroup(d, 'reviewer-audit', 'git status');
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr.split('\n')[0], /^LiteralInConfig: tools\/docgen\/policy\/seat-policy\.mjs:\d+$/);
  ```
- **红绿证据**：红 = 只保留三条弱探针（`/`、反引号、`--flag`）→ `'git status'` 全不命中、命令文本回到配置层且无人发现（v1 G-1 原形）；绿 = closed-world 判红。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：命令字面量出现在**定义层**（合法，正是定义层职责）。

### S6-TC-B15 配置层 `artifacts` 塞路径形态非 ID（`'definitions/x.mjs'`）→ `LiteralInConfig`

- **覆盖**：V-3 / §3.5 不变量2 / §7 `LiteralInConfig`
- **来源**：spec 推导（spec v2 §8 V-3 明列 `artifacts: ['definitions/x.mjs']` **必红**——三键内逐条查表，不是只查 `allowGroups`）
- **前置**：`withRepoCopy` 副本。
- **步骤**：① 副本内给 `reviewer-audit.artifacts` 追加 `'definitions/x.mjs'`；② 跑加载；③ 取退出码与首行。
- **预期**：exit 1；首行 `^LiteralInConfig: tools/docgen/policy/seat-policy\.mjs:\d+$`；**不得**报 `UnknownPolicyRef`（路径形态 ≠ 登记 ID，先判形态）。
- **判据**：同 B14 的断言，注入值换成 `artifacts: ['definitions/x.mjs']`。
- **红绿证据**：红 = 只对 `allowGroups` 做 closed-world、`artifacts` 不做 → 配置层能指向任意文件（产物归位被路径污染）；绿 = 三键逐键查表。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：`capabilities` 的形态类负例（B02 的逐键差集兜；B06 覆盖「ID 形态但未登记」）。**归码复核（v4）**：v4 谓词 `^[a-z][a-z0-9.:-]*$` 虽新增冒号，`definitions/x.mjs` 仍因含 `/` 过不了形态关 → 归码仍是 `LiteralInConfig`（spec §3.4 末尾「先形态、后存在性」）；本条预期不变。

### S6-TC-C01 审计席：哈希只作定位，判据 = 能力 diff 空 + J01 子句齐

- **覆盖**：**V-2（辅助定位）** / V-1 / §3.6 / §3.4 槽 6（`spec:85`，审计 = 本席自写）
- **来源**：spec 推导（`spec:205` V-2「只用于定位，不作通过判据」；`spec:85`：`escalationWriter = {slug:'reviewer-audit', artifact:'round-check.md'}` 与本席相同 → 渲染「审计写 `round-check.md`」；议会 #3 F1 / F6：C01/C02 不再拿哈希当断言）
- **前置**：施工步骤 1（落定义层）完成后，立刻用**改造前**文本算 sha256 写进 `tools/docgen/fixtures/boundary-golden.json`（**只存哈希、不存全文**——存全文等于再造第 6 份副本，与 V-7 冲突）：审计席 = `git show <sourceCommit>:agents/reviewer-audit.md` 的旧卡边界节（= 改造前的 `BOUNDARY_PRODUCER_AUDIT`）；`default-boundary` / `evidence-reader-boundary` = 现常量。**不得用改造后的 `renderBoundary(席)` 自哈希**（自哈希必然相等 → `hashEqual` 恒真 → 定位线索归零，`spec:172`）。换代规则见 B01 前置（只追加 `<席>@<轮次>`、旧键不删）；**当前比对键**按 `spec:198` = 同席 `<席>@<轮次>` 轮次最大者、无则基线键。
- **步骤**：① 算 `sha(renderBoundary('reviewer-audit'))` 与**当前比对键**（`goldenCurOf`）比较，**只把结果记进 `hashEqual`**（写进 `capability-diff.md` 的定位说明）；② 断言能力 diff 空差（改造后 = `factsFromText(renderBoundary(席), probeDict())`）；③ 断言 ⑤ 段子句齐（V-12）；④ 断言槽 6 是**本席自写**形态（`spec:85`）；⑤ 断言黄金**来源 = 改造前**（基线键的值 == 旧卡边界节哈希）；⑥ 负例：副本内改模板一字 → 渲染文本变，但仍不等于改造前黄金（证明黄金不是自哈希）；⑦ 负例：换代后仍取旧基线键 → 定位线索失效 → 红。
- **预期**：哈希相等是最好情况；不相等**不判失败**；真正的通过判据 = ② 空差 + ③ 子句齐；槽 6 = 「审计写 `round-check.md`」；黄金基线键 = 改造前旧卡边界节的 sha256；当前比对键 = 最大轮次键（无换代键即基线键）。
- **判据**：
  ```js
  const seat = 'reviewer-audit';
  const hashEqual = sha(renderBoundary(seat)) === goldenCurOf(seat);   // ① 只取事实（当前比对键，spec:198）
  assert.equal(typeof hashEqual, 'boolean');
  assert.deepEqual(diffFacts(baseJson().seats[seat], factsFromText(renderBoundary(seat), probeDict())),
    { minus: [], plus: [] }, `${seat}: 能力 diff 非空`);            // ② 唯一通过判据
  assert.doesNotThrow(() => assertNeedClauses(renderBoundary(seat), seat));  // ③
  assert.match(renderBoundary(seat), /审计\s*写\s*`round-check\.md`/, '④ 槽 6：审计席应渲染「本席自写」形态');
  // ⑤ 黄金**基线键**的来源 = 改造前（旧卡边界节），不是改造后渲染自哈希
  const before = cardBoundary(gitShow(baseJson().sourceCommit, `agents/${seat}.md`)).trim();
  assert.equal(goldenOf(seat), sha(before), `${seat}: 黄金基线键必须取自改造前文本（spec:172）`);
  // ⑤' 当前比对键（spec:198）：有 `<席>@<轮次>` 取轮次最大者，无则基线键（换代前后同一实现）
  const rounds = Object.keys(golden()).filter((k) => k.startsWith(`${seat}@`)).map((k) => Number(k.split('@')[1]));
  assert.equal(goldenKeyFor(seat), rounds.length > 0 ? `${seat}@${Math.max(...rounds)}` : seat,
    `${seat}: 当前比对键必须取轮次最大者，无换代键则回落基线键`);
  // ⑥ 负例：若黄金取「改造后渲染自哈希」→ 模板改一字仍判相等（hashEqual 恒真）→ 必红
  withCopy((d) => {
    editInDir(d, 'tools/docgen/templates/boundary.md.tpl', (s) => s.replace('**档位事实**', '**档位 事实**'));
    const out = renderBoundaryIn(d, seat);
    assert.notEqual(out, renderBoundary(seat), '构造未生效：模板未被改动');
    assert.notEqual(sha(out), goldenCurOf(seat), '黄金取自改造后 → 文本变了仍判相等（hashEqual 恒真）→ 必红');
  });
  // ⑦ 负例：换代后仍取旧基线键 → 换代文本 ≠ 基线键 → hashEqual 恒 false（定位线索失效）→ 必红
  const cur = renderBoundary(seat);
  const newText = `${cur}\n<!-- V-13 换代后追加的措辞 -->`;
  const gen = { ...golden(), [`${seat}@1`]: sha(`${cur}\n<!-- round 1 -->`), [`${seat}@2`]: sha(newText) };
  assert.equal(goldenKeyFor(seat, gen), `${seat}@2`, '换代后必须取轮次最大的键（spec:198）');
  assert.equal(gen[goldenKeyFor(seat, gen)], sha(newText), '当前比对键必须命中换代后的文本');
  assert.notEqual(sha(newText), gen[seat], '换代后仍取旧基线键 → 定位线索失效 → 必红');
  ```
- **红绿证据**：红 = 把「哈希不等」写成失败判据（v5 口径）→ 模板一重排措辞就永久红，与 §2 第 2 条冲突；另一红 = 模板漏渲染某段 → ② 出现 `minus`；另一红 = 黄金用改造后自哈希 → ⑤ 红（`goldenOf(seat)` ≠ `sha(旧卡边界节)`）、且 ⑥ 的 `notEqual(sha(out), goldenCurOf(seat))` 红（文本变了还相等）；另一红 = 换代后仍取旧基线键（`goldenOf` 当当前键用）→ ⑦ 的 `goldenKeyFor` 与 `notEqual` 同时红；绿 = 空差 + 子句齐（哈希可以不等）+ 基线键取自改造前 + 当前比对键取最大轮次。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：能力是否丢在别的席（H02 逐席兜）；`agents/` 字节变化（G01，同样只作定位）。

### S6-TC-C02 侦探席：同口径（哈希只作定位）

- **覆盖**：**V-2（辅助定位）** / V-1 / §3.6 / §3.4 槽 6（`spec:85`，侦探 = 他席写）
- **来源**：spec 推导（两席文案不同，只用审计席做样本会漏「侦探缺写入范围」——该缺口由逐席 diff 兜；`spec:85`：侦探 `escalationWriter` 指向他席（`reviewer-audit` / `round-check.md`）→ 渲染「交审计在 `round-check.md` 独立复算」）
- **前置**：同 C01（侦探席黄金 = `git show <sourceCommit>:agents/detective-observer.md` 的旧卡边界节，**不是**改造后渲染自哈希）；**当前比对键**按 `spec:198` = 同席 `<席>@<轮次>` 轮次最大者、无则基线键。
- **步骤**：① 算 `sha(renderBoundary('detective-observer'))` 与**当前比对键**（`goldenCurOf`）比较，只记 `hashEqual`；② 能力 diff 空差；③ ⑤ 段子句齐（含侦探专属「本席不核签」）；④ 断言槽 6 是**他席写**形态（`spec:85`）；⑤ 断言黄金**基线键**来源 = 改造前；⑥ 负例：改模板一字 → 渲染变但仍不等于改造前黄金（自哈希口径必红）；⑦ 负例：换代后仍取旧基线键 → 定位线索失效 → 红。
- **预期**：② 空差 + ③ 全齐；槽 6 = 「交审计在 `round-check.md` 独立复算」；哈希不等不判失败，但必须在 `capability-diff.md` 记一条定位说明；黄金基线键取自改造前；当前比对键 = 最大轮次键（无换代键即基线键）。
- **判据**：
  ```js
  const seat = 'detective-observer';
  const hashEqual = sha(renderBoundary(seat)) === goldenCurOf(seat);   // 当前比对键（spec:198）
  assert.equal(typeof hashEqual, 'boolean');
  assert.deepEqual(diffFacts(baseJson().seats[seat], factsFromText(renderBoundary(seat), probeDict())),
    { minus: [], plus: [] }, `${seat}: 能力 diff 非空`);
  assert.doesNotThrow(() => assertNeedClauses(renderBoundary(seat), seat));
  assert.match(seg5(renderBoundary(seat)), /本席不核签/, '侦探职责子句缺失');
  assert.match(renderBoundary(seat), /交\s*审计\s*在\s*`round-check\.md`\s*独立复算/, '④ 槽 6：侦探席应渲染「他席写」形态');
  // ⑤ 黄金**基线键**来源 = 改造前（旧卡边界节）
  const before = cardBoundary(gitShow(baseJson().sourceCommit, `agents/${seat}.md`)).trim();
  assert.equal(goldenOf(seat), sha(before), `${seat}: 黄金基线键必须取自改造前文本（spec:172）`);
  // ⑤' 当前比对键（spec:198）：有 `<席>@<轮次>` 取轮次最大者，无则基线键（换代前后同一实现）
  const rounds = Object.keys(golden()).filter((k) => k.startsWith(`${seat}@`)).map((k) => Number(k.split('@')[1]));
  assert.equal(goldenKeyFor(seat), rounds.length > 0 ? `${seat}@${Math.max(...rounds)}` : seat,
    `${seat}: 当前比对键必须取轮次最大者，无换代键则回落基线键`);
  // ⑥ 负例：自哈希口径 → 文本变了仍「相等」→ 必红
  withCopy((d) => {
    editInDir(d, 'tools/docgen/templates/boundary.md.tpl', (s) => s.replace('**档位事实**', '**档位 事实**'));
    const out = renderBoundaryIn(d, seat);
    assert.notEqual(out, renderBoundary(seat), '构造未生效：模板未被改动');
    assert.notEqual(sha(out), goldenCurOf(seat), '黄金取自改造后 → 文本变了仍判相等（hashEqual 恒真）→ 必红');
  });
  // ⑦ 负例：换代后仍取旧基线键 → 定位线索失效 → 必红
  const cur = renderBoundary(seat);
  const newText = `${cur}\n<!-- V-13 换代后追加的措辞 -->`;
  const gen = { ...golden(), [`${seat}@1`]: sha(`${cur}\n<!-- round 1 -->`), [`${seat}@2`]: sha(newText) };
  assert.equal(goldenKeyFor(seat, gen), `${seat}@2`, '换代后必须取轮次最大的键（spec:198）');
  assert.equal(gen[goldenKeyFor(seat, gen)], sha(newText), '当前比对键必须命中换代后的文本');
  assert.notEqual(sha(newText), gen[seat], '换代后仍取旧基线键 → 定位线索失效 → 必红');
  ```
- **红绿证据**：红 = 模板只覆盖审计席的产物清单 → 侦探席 `canWrite` 少一项 → `minus` 非空；另一红 = 侦探席黄金沿用审计席的（复制粘贴）→ ⑤ 红；再一红 = 黄金用改造后自哈希 → ⑥ 红；再一红 = 换代后仍取旧基线键 → ⑦ 红（`goldenKeyFor` 未取 `@2`、`notEqual` 与当前文本不等）；绿 = 空差 + 基线键取自改造前 + 当前比对键取最大轮次。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：`evidence-reader` 自带边界句（§2「不做什么」4，G03 只断不变）。

### S6-TC-C03 模板塞路径 → `TemplateImpure`

- **覆盖**：**V-9** / §3.5 不变量6 / §3.4 纯度守卫 / §7 `TemplateImpure`（首行路径口径 `spec:197`）
- **来源**：spec 推导（`spec:191` 报文首行 = `TemplateImpure: <模板>:<片段>`；`spec:197` 报文路径一律仓内 POSIX 相对路径 → 模板位置必须以 `tools/docgen/` 开头，禁止绝对路径 / 盘符 / 用户目录 / `file://`）
- **前置**：副本；模板已落。
- **步骤**：① 副本内把 `templates/boundary.md.tpl` 里追加一行 `` `docs/prd/` ``；② 跑 `policy --dump`（`validatePolicy` 的发射点，`spec:161`）；③ 取退出码与首行。
- **预期**：exit 1；首行 `^TemplateImpure: tools/docgen/templates/boundary\.md\.tpl:.+$`（`<片段>` 非空；模板位置 = **仓内 POSIX 相对路径**，`spec:197`）。
- **判据**：
  ```js
  const r = withCopy((d) => {
    editInDir(d, 'tools/docgen/templates/boundary.md.tpl', (s) => `${s}\n\n- 另：\`docs/prd/\` 也不许写。\n`);
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr.split('\n')[0], /^TemplateImpure: tools\/docgen\/templates\/boundary\.md\.tpl:.+$/);
  ```
- **红绿证据**：红 = 纯度守卫缺失 → 有人「顺手」把某条路径写进模板（第二份真相回流，D1 归零）；绿 = 报错。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：路径出现在**定义层**（合法）。
- **判据来源（spec §3.4 已定，v2 的「反引号命令」字符谓词已删除）**：模板里出现的路径 / 命令片段必须能追到某个槽；`TEMPLATE_ALLOWED_LITERALS` **只登记非成员**（出现定义层成员即判红）。`docs/prd/` 是 `definitions/paths.mjs` 的登记项（`docs.input`），故它既不可能合规进白名单，也没有槽可注入 → 本条注入必红。

### S6-TC-C04 模板塞反引号命令 → `TemplateImpure`

- **覆盖**：V-9 / §3.4 / §7 `TemplateImpure`（首行路径口径 `spec:197`）
- **来源**：spec 推导（`spec:191` 报文首行 = `TemplateImpure: <模板>:<片段>`；`spec:197` 报文路径一律仓内 POSIX 相对路径 → 模板位置必须以 `tools/docgen/` 开头）
- **前置**：同 C03。
- **步骤**：副本内模板追加 `` `npm run check` ``（反引号包裹的清单类成员）；跑 `policy --dump`。
- **预期**：exit 1；首行 `^TemplateImpure: tools/docgen/templates/boundary\.md\.tpl:.+$`。
- **判据**：
  ```js
  const r = withCopy((d) => {
    editInDir(d, 'tools/docgen/templates/boundary.md.tpl', (s) => `${s}\n\n- 例：\`npm run check\`。\n`);
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr.split('\n')[0], /^TemplateImpure: tools\/docgen\/templates\/boundary\.md\.tpl:.+$/);
  ```
- **红绿证据**：红 = 模板里出现具体命令（命令文本两处维护）；绿 = 报错。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：反引号用于强调的合法用法——v4 已为 `` `producer` `` 类固定文本留了 `{{TIER}}` 槽（§3.4），模板**不需要**再写死它，故不涉及白名单；若实现仍写死 `` `producer` ``，C06 的「12 槽逐个被引用」与 E02 的分配席变化断言会先红（槽值不随配置变）。

### S6-TC-C05 模板塞清单类成员 → `TemplateImpure`；单点类 `--write` 合法

- **覆盖**：V-9 / §3.4 纯度规则 1 vs 规则 2 / §7
- **来源**：spec 推导（`spec:94-96`：规则 1 = 组 ID / 多词 verb / 路径组成员**不得整项出现**；规则 2 = 单 token 的 flag 允许留在模板但必须 ∈ 定义层对应集合）——议会 #3 F23 / QA-07：C05 与规则 2 曾互斥，注入样本必须换成清单类成员
- **前置**：同 C03。
- **步骤**：① 副本 A：模板追加**裸文本** `npm run check`（清单类成员，不经槽）→ 期望 `TemplateImpure`；② 副本 B：模板追加单点类 `--write`（∈ `commands['fs.write'].verbs`）→ 期望**绿**（规则 2 的存在性校验通过）。
- **预期**：A 判红；B exit 0；`--write` 确实是 `fs.write` 的登记 verb（否则 B 的合法性无据）。
- **判据**：
  ```js
  assert.ok(CMD.forbiddenGroups['fs.write'].verbs.includes('--write'), '--write 必须是 fs.write 的登记 verb');
  // ① 清单类成员（多词 verb）→ 规则 1 判红
  const bad = withCopy((d) => {
    editInDir(d, 'tools/docgen/templates/boundary.md.tpl', (s) => `${s}\n\n- 附注：npm run check 是常用命令。\n`);
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(bad.status, 1);
  assert.match(bad.stderr.split('\n')[0], /^TemplateImpure: tools\/docgen\/templates\/boundary\.md\.tpl:.+$/);
  // ② 单点类成员（单 token flag）→ 规则 2 允许（存在性校验通过）
  const ok = withCopy((d) => {
    editInDir(d, 'tools/docgen/templates/boundary.md.tpl', (s) => `${s}\n\n- 另注：--write 属写盘形态。\n`);
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(ok.status, 0, `单点类 --write 被误判为不纯：${ok.stderr}`);
  ```
- **红绿证据**：红 = 规则 1 仍写成「任何 verb / flag 都不得出现」→ ② 段红（合法模板被判违规，与 `--output` / `--write` 在现卡里的实际用法冲突）；另一红 = 模板里出现清单类成员却被放行 → ① 段红（命令文本两处维护）；绿 = 清单类判红 + 单点类放行。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：`{{DENY_GROUPS}}` 展开后的 `--write`（那是定义层数据，合法）；白名单登记清单类成员（V-9 ②，D01 的 `TemplateImpure` 行兜）。

### S6-TC-C06 模板 12 槽齐 + 渲染后无残留 `{{`

- **覆盖**：§3.4 槽表（v5 = 12 槽）+ **槽 6 两形态**（`spec:85`）/ §3.5 不变量7（槽集恰合）/ §3.2 `seats` 可选槽缺省（`spec:57`）
- **来源**：spec 推导（**v4 把槽集从 7 扩到 11；v5 再补第 12 槽 `DETECTION_CMD`**——取值 = `commands['git.read'].verbs` 的 status 项（只读引用，不复制），各槽在 §3.4 表里都有「取值来源」；**v9.1 补槽 6**：`{{ESCALATION_WRITER}}` 取自 `SEATS[slug].escalationWriter`，按 `spec:85` 分两形态——**本席自写** = 显示名 + 「写」+ 产物名（例 `审计写 round-check.md`）；**他席写** = 「交」+ 显示名 + 「在」+ 产物名 + 「独立复算」（例 `交审计在 round-check.md 独立复算`））
- **前置**：模板与渲染已落。
- **步骤**：① 读模板，提取全部 `{{NAME}}`；② 与 §3.4 表声明的 **12 个槽**比较（**只判集合相等**；模板内首次出现顺序**不参与判据**——槽序唯一口径 = §3.4 表行序 → `dump.expanded` 索引，`spec:76` / `spec:162`，由 F02 按索引断言）；③ 对三席（含空 `artifacts` 的 `senior-sdet`）各渲染一次，断言输出不含 `{{`、不含 `undefined` / `null` / `NaN`、不含连续或悬空标点；④ 断言 12 槽**逐个**至少被引用一次；⑤ **槽 6 两形态各出现一次且互斥**：审计席渲染出「本席自写」形态（`审计写 round-check.md`），侦探席渲染出「他席写」形态（`交审计在 round-check.md 独立复算`）；⑥ **可选槽缺省**：`senior-sdet` 未声明 `clause` / `escalationWriter` 也必须渲染成功、槽值为空串、不留悬空标点、`expanded` 仍 12 项（「显式 `undefined`」的负例归 C09）。
- **预期**：槽集恰 `{SEAT, TIER, CAPABILITIES, ARTIFACTS, SEAT_CLAUSE, ESCALATION_WRITER, ALLOW_GROUPS, DENY_GROUPS, ENV_FORMS, FORBIDDEN_PATHS, DETECTION_PATHS, DETECTION_CMD}`（12 个，按 §3.4 表行序列出）；三席输出干净且无悬空标点（含缺省的 `senior-sdet`）；槽 6 两形态互斥（审计席 = 本席自写形态，侦探席 = 他席写形态）。
- **判据**：
  ```js
  const SLOTS = ['SEAT','TIER','CAPABILITIES','ARTIFACTS','SEAT_CLAUSE','ESCALATION_WRITER',
    'ALLOW_GROUPS','DENY_GROUPS','ENV_FORMS','FORBIDDEN_PATHS','DETECTION_PATHS','DETECTION_CMD'];
  const tpl = readFileSync('tools/docgen/templates/boundary.md.tpl', 'utf8');
  const slots = new Set([...tpl.matchAll(/\{\{([A-Z_]+)\}\}/g)].map((m) => m[1]));
  assert.deepEqual([...slots].sort(), [...SLOTS].sort(), '槽集 ≠ §3.4 表的 12 个');
  for (const s of SLOTS) assert.ok(countIn(tpl, `{{${s}}}`) >= 1, `槽 ${s} 未被引用`);
  for (const seat of ['reviewer-audit','detective-observer','senior-sdet']) {
    const out = renderBoundary(seat);
    assert.equal(out.includes('{{'), false, `${seat}: 残留槽位`);
    assert.equal(/undefined|null|NaN/.test(out), false, `${seat}: 渲染出未定义值`);
    assert.equal(/[、，；：]{2,}|[、，；：]\s*[。；]/.test(out), false, `${seat}: 连续 / 悬空标点`);
  }
  // 空 artifacts 席（senior-sdet）不得因空数组留下悬空标点
  assert.equal(/只允许写[：:]\s*[、。；]/.test(renderBoundary('senior-sdet')), false, '空 artifacts 留下悬空标点');
  // ⑤ 槽 6（{{ESCALATION_WRITER}}）两形态（spec:85）：本席自写 / 他席写
  assert.match(renderBoundary('reviewer-audit'), /审计\s*写\s*`round-check\.md`/, '审计席：应渲染「本席自写」形态');
  assert.match(renderBoundary('detective-observer'), /交\s*审计\s*在\s*`round-check\.md`\s*独立复算/, '侦探席：应渲染「他席写」形态');
  // ⑥ 可选槽缺省（spec:57）：三席 display 全写死；`senior-sdet` 的 clause / escalationWriter **缺省未声明** → 空串、12 项不变
  for (const s of ['reviewer-audit','detective-observer','senior-sdet']) {
    assert.ok(String(SEATS.SEATS[s].display).trim().length > 0, `${s}: display 必须写死非空`);
  }
  const sd = renderBoundary('senior-sdet');
  assert.ok(sd.length > 0, 'senior-sdet 必须能渲染成功（可选槽缺省不是渲染失败）');
  assert.equal(/undefined|null|NaN/.test(sd), false, '缺省槽渲染出未定义值');
  assert.equal(/[、，；：]{2,}|[、，；：]\s*[。；]/.test(sd), false, '缺省槽留下悬空标点');
  assert.equal(dumpPolicy(ROOT).json.seats['senior-sdet'].expanded.length, 12, '缺省槽不得让 expanded 变短');
  ```
- **红绿证据**：红 = 模板写了 `{{ESCLATION_WRITER}}`（拼错）→ 槽集不等且渲染残留 `{{`；另一红 = 漏第 12 槽 `DETECTION_CMD` → 检测段命令只能写死在模板（触发 `TemplateImpure`）或删掉（J01 的检测命令子句缺 → J01 红）；再一红 = `{{ARTIFACTS}}` 为 `''` 时模板写了「内的 、」→ 悬空标点断言红（议会 #3 F4：`senior-sdet` 的 `artifacts` 是空数组）；再一红 = 槽 6 不分情形、一律渲染「本席自写」→ 侦探席的「他席写」断言红（这正是 `spec:85` 分两种形态的理由）；绿 = 12 槽齐且三席输出干净。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：槽值内容是否正确（C01/C02 的能力 diff + A06 的顺序 + F02 的槽值可复算 + F01 的 12 项）；**槽 6 两形态由本条直接断言**（其余槽值仍不逐字比，避免在测试里再造一份数据）。
- **残余（v8 状态）**：v5 已闭合三项（第 12 槽、判定粒度 = 整项相等、成员类别含产物名）。**原残余两类已按 v8 处置**：① 允许段括注的 `--output`、② 非本席产物名（`progress.md` / 侦探卡 `round-check.md`）——v8 §3.4 把纯度改成**清单类 / 单点类分治**（`spec:94-96`）：`--output` 属单点类（∈ `fs.write` verbs，留模板合法），非本席产物名属**整项单点**（∈ `artifacts` 键，留模板合法且经存在性校验），故**无需新槽**（→ §10.4 第 5 条状态「已闭合」）。

### S6-TC-C07 未声明槽位不得静默保留

- **覆盖**：§3.4 槽位替换 / 不变量7 边界
- **来源**：实现观察（补充）——spec 未给「未知槽位」分配错误码，实现可能原样输出。
- **前置**：副本内把模板里 `{{SEAT}}` 改成 `{{SEAT_LABEL}}`。
- **步骤**：① 跑渲染；② 记录行为；③ 断言「要么抛错（码任意，首行含模板名），要么输出不含 `{{`」——**不得**输出含 `{{SEAT_LABEL}}` 的卡面。
- **预期**：失败即抛（推荐复用 `TemplateImpure` 或新增 `UnknownSlot` 并在 `EXIT` 映射，见 §8 建议 7）；静默保留视为违规。
- **判据**：
  ```js
  const out = withCopy((d) => {
    editInDir(d, 'tools/docgen/templates/boundary.md.tpl', (s) => s.replace('{{SEAT}}', '{{SEAT_LABEL}}'));
    return runCli(d, ['policy', '--dump']);      // 槽集校验在 validatePolicy 内（不变量 7）
  });
  assert.ok(out.status !== 0 || !out.stdout.includes('{{'), '未声明槽位被静默保留');
  ```
- **红绿证据**：红 = 模板拼错槽名但卡面照生成（读者看到 `{{SEAT_LABEL}}`，`gate` 因为渲染与盘上… 不同源时反而红；一旦有人手工对齐盘上就永久留下垃圾）；绿 = 抛错。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：错误码取值（spec 未定义，记 G-5）。

### S6-TC-C08 槽级分隔符：组间 `、`/`；`、组内 ` / `；`DENY_GROUPS` 剔除 `env.assign`

- **覆盖**：§3.4 槽表分隔符 / V-4
- **来源**：spec 推导（`spec:86-88`：`{{ALLOW_GROUPS}}` 组间 `；`、组内 ` / `；`{{DENY_GROUPS}}` 组间 `、`、组内 ` / ` 且**剔除 `env.assign`**，由 `{{ENV_FORMS}}` 单独注入）+ 议会 #3 F10（两槽曾覆盖同一组）
- **前置**：三席已可渲染。
- **步骤**：① 取 dump 的 12 槽值；② 断言允许组槽：组间 `；`、组内 ` / `；③ 断言路径槽：统一 `、`（不出现 `；`）；④ 断言 `env.assign` 的 verb **不在** deny 槽、**只在** ENV_FORMS 槽；⑤ 渲染侧两段都在。
- **预期**：四种分隔符各归其位；`env.assign` 只经 `{{ENV_FORMS}}` 出现（不重复注入）。
- **判据**：
  ```js
  const e = dumpPolicy(ROOT).json.seats['reviewer-audit'].expanded;
  // 槽序 = §3.4 表行序（`spec:76` / `spec:162`）：槽 7 ALLOW→index 6 / 槽 8 DENY→index 7
  // / 槽 9 ENV_FORMS→index 8 / 槽 10 FORBIDDEN_PATHS→index 9（卡面首次出现顺序不参与判据）
  const [allowSlot, denySlot, pathSlot, envSlot] = [e[6], e[7], e[9], e[8]];
  assert.ok(allowSlot.includes('；'), '允许组：组间分隔符应为 ；');
  assert.ok(allowSlot.includes(' / '), '允许组：组内分隔符应为 ` / `');
  assert.ok(pathSlot.includes('、') && !pathSlot.includes('；'), '路径清单：统一用 、');
  // ③ 段成员数 = **23**（`spec:89` 槽 10 = `pathGroups` 六组展开 ∪ `spec / plan`）：不是 22
  assert.equal(pathSlot.split('、').filter(Boolean).length, 23, '路径槽成员数应为 23（含 `spec / plan`）');
  assert.ok(pathSlot.includes('spec / plan'), '路径槽必须含 `spec / plan`（第 23 项）');
  for (const v of CMD.forbiddenGroups['env.assign'].verbs) {
    assert.equal(denySlot.includes(v), false, `env.assign verb 混进 DENY_GROUPS：${v}`);
    assert.ok(envSlot.includes(v), `env.assign verb 未进入 ENV_FORMS：${v}`);
  }
  const out = renderBoundary('reviewer-audit');
  assert.match(out, /任何形式的环境变量赋值/, '环境变量段整段缺失');
  assert.ok(out.includes(CMD.forbiddenGroups['env.assign'].verbs[0]), '环境变量形态未渲染');
  const pathSeg = out.slice(out.indexOf('逐项点名：'), out.indexOf('；兜底句'));
  assert.equal(pathSeg.includes(', '), false, '路径段不得用 ", " 连接');
  ```
- **红绿证据**：红 = 统一用 `join(', ')` 渲染路径段 → 卡面分隔符漂移，`gate` 全红且 diff 噪音极大；另一红 = `DENY_GROUPS` 不剔除 `env.assign` → 该组 verb 在 deny 槽与 env 槽各出现一次（④ 段自相重复）；绿 = 各归其位。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：分隔符的美学选择（语义判断）。

### S6-TC-C09 显式 `undefined` 的槽值 → `TemplateImpure`（「缺省未声明」≠「显式 undefined」）

- **覆盖**：§3.2 `seats.mjs` 可选槽（`spec:57`）/ §3.4 槽值守卫（`spec:93`）/ §3.5 不变量7 / §7 `TemplateImpure`
- **来源**：spec 推导（`spec:57` 写死「`clause` 缺省 = `''`、`escalationWriter` 缺省 = 该槽渲染空串；**「缺省未声明」≠「显式传 `undefined`」**（后者判 `TemplateImpure`）」；`spec:93` 槽值为 `undefined` / `null` → `TemplateImpure`、首行片段 = 槽名）
- **前置**：`seats.mjs` 已落；`senior-sdet` 的 `clause` 在真仓库**未声明**（缺省路径 → C06 ⑥ 断空串）。
- **步骤**：① 副本内给 `senior-sdet` 显式写 `clause: undefined`（只动副本）；② 跑 `policy --dump`（`validatePolicy` 的唯一 CLI 发射点，`spec:161`）；③ 取退出码与报文首行；④ 断言真仓库（未改动）在同一席上**不**报该码（缺省是合法路径）。
- **预期**：副本 exit **1**，首行 `^TemplateImpure: .*boundary\.md\.tpl:.*SEAT_CLAUSE$`（片段 = 槽名，`spec:93`）；真仓库 exit 0。
- **判据**：
  ```js
  // ④ 缺省未声明（真仓库）是合法路径：senior-sdet 不声明 clause 时不得报错
  assert.equal(runCli(ROOT, ['policy', '--dump']).status, 0, '缺省未声明被误判为不纯');
  // ①②③ 显式 undefined ≠ 缺省：必须 TemplateImpure，且片段 = 槽名
  const bad = withCopy((d) => {
    editInDir(d, 'tools/docgen/policy/definitions/seats.mjs',
      (s) => s.replace(/'senior-sdet':\s*\{/, "'senior-sdet': { clause: undefined,"));
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(bad.status, 1, '显式 undefined 必须判红');
  assert.match(bad.stderr.split('\n')[0], /^TemplateImpure: .*boundary\.md\.tpl:.*SEAT_CLAUSE$/);
  ```
- **红绿证据**：红 = 实现用 `if (!value)` 判空 → 缺省与显式 `undefined` 走同一分支（缺省被判红 → C06 ③ 三席渲染红；或显式 `undefined` 被放行 → 本条红）；另一红 = 把 `undefined` 直接写进渲染结果 → C06 的「无 `undefined`」断言与本条同时红；绿 = 缺省渲染空串、显式 `undefined` 报 `TemplateImpure`。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：`null` 的同类形态（`spec:93` 与 `undefined` 同码，属同一分支，不重复造用例）；缺省值与语义是否恰当（归议会）。

### S6-TC-D01 六个错误码各 1 个负例：exit 1 + 报文首行格式

- **覆盖**：**V-5** 全覆盖 / §7 六码（含**报文路径口径** `spec:197`）/ §3.5 1–9（不变量 8 两方向：B11 ③ / ④）
- **来源**：spec 推导（**v4 §7 写死 `RenderNotEquivalent` 由施工期断言发出、不是 CLI 运行时错误、CLI 不引入该码**；表内退出口径为「测试退出 1」；**v9.9 补 §7「报文路径一律仓内 POSIX 相对路径」= `spec:197`：首行禁绝对路径 / 盘符 / 用户目录 / `file://`**）+ `spec:112`（不变量 8 的 `:not-allowed` 后缀）
- **前置**：B03–B10 / C03–C05 / D03 已各自构造；`RenderNotEquivalent` 需**单独构造且不经 CLI**（D02 按 §7 分工已改为 `Mismatch`，不再提供该码）：副本内改模板一处（如去掉一个固定空格）→ `renderBoundary` 结果 ≠ `fixtures/boundary-golden.json` 的 sha256 → **迁移期黄金断言**（与 C01/C02 同一实现）抛出该码。
- **步骤**：按 §7 表逐码跑对应构造：五个 **CLI 码**各取 `status` 与 `stderr` 首行；`ForbiddenGroupGranted` 的**四种后缀**（`:forbidden` / `:other-seat` / `:verb` / `:not-allowed`）各给 1 例；`RenderNotEquivalent` 取**测试进程抛错消息首行**（不取 CLI stderr）；每条 CLI 首行再过一遍 `assertReportPath`（§7 路径口径）。
- **预期**：五个 CLI 码全部 exit **1**（不是 2：事实 8 指出未映射码会落 2）；`RenderNotEquivalent` = 黄金断言失败（测试进程非 0）+ 消息首行 `RenderNotEquivalent: <席>:<首处差异行>`；首行格式：

  | 码 | 首行正则 | 构造来源 | 发射者 |
  |---|---|---|---|
  | `UnknownPolicyRef` | `^UnknownPolicyRef: [a-z-]+:(capability\|group\|artifact\|tier)=.+$`（**无文件路径段**，但**仍须过 §7 路径口径**：首行不得含绝对路径 / 盘符 / 用户目录 / `file://`，`spec:197`） | B06 / B07 / B08（+ B01 ⑦ 的 `tier`） | CLI |
  | `LiteralInConfig` | `^LiteralInConfig: tools/docgen/policy/seat-policy\.mjs:\d+$` | B03–B05 / B14 / B15 | CLI |
  | `SeatNameInDefinition` | `^SeatNameInDefinition: tools/docgen/policy/definitions/[a-z]+\.mjs$`（**必须以 `tools/docgen/` 开头**） | D03 | CLI |
  | `ForbiddenGroupGranted` | `^ForbiddenGroupGranted: [a-z-]+:[a-z:.]+:(forbidden\|other-seat\|verb\|not-allowed)$` | B09（`:forbidden`）/ B10（`:other-seat`）/ B11 ③（`:verb`）/ B11 ④（`:not-allowed`） | CLI |
  | `TemplateImpure` | `^TemplateImpure: tools/docgen/templates/boundary\.md\.tpl:.+$`（**必须以 `tools/docgen/` 开头**） | C03–C05 | CLI |
  | `RenderNotEquivalent` | `^RenderNotEquivalent: [a-z-]+:.+$` | 本条新增：模板改一字 → 渲染 ≠ 黄金哈希 | **施工期断言（测试内）**，不是 CLI |
- **判据**：
  ```js
  // 统一探针：副本内构造一次违规 → 跑 policy --dump（五码的唯一 CLI 发射点，spec:161）
  const probe = (edit) => withCopy((d) => { edit(d); return runCli(d, ['policy', '--dump']); });
  const CLI_CASES = [
    ['UnknownPolicyRef',
      (d) => setSeatPolicy(d, 'senior-sdet', { ...SEAT_POLICY['senior-sdet'], capabilities: ['read','admin'] }),
      /^UnknownPolicyRef: senior-sdet:capability=admin$/],
    ['LiteralInConfig',
      (d) => grantGroup(d, 'reviewer-audit', 'docs/after/'),
      /^LiteralInConfig: tools\/docgen\/policy\/seat-policy\.mjs:\d+$/],
    ['SeatNameInDefinition',
      (d) => editInDir(d, 'tools/docgen/policy/definitions/paths.mjs',
        (s) => s.replace("'其他评审目录'", "'其他评审目录-reviewer-audit'")),
      /^SeatNameInDefinition: tools\/docgen\/policy\/definitions\/paths\.mjs$/],
    ['ForbiddenGroupGranted:forbidden',
      (d) => grantGroup(d, 'reviewer-audit', 'docgen.write'),
      /^ForbiddenGroupGranted: reviewer-audit:docgen\.write:forbidden$/],
    ['ForbiddenGroupGranted:other-seat',
      (d) => {
        insertInObject(d, 'tools/docgen/policy/definitions/commands.mjs', 'export const seatGroups',
          "'seat:senior-sdet.extra': { purpose: '测试构造', verbs: ['npm run check'] },");
        grantGroup(d, 'senior-sdet', 'seat:senior-sdet.extra');
        grantGroup(d, 'reviewer-audit', 'seat:senior-sdet.extra');
      },
      /^ForbiddenGroupGranted: reviewer-audit:seat:senior-sdet\.extra:other-seat$/],
    ['ForbiddenGroupGranted:verb',
      (d) => {
        insertInObject(d, 'tools/docgen/policy/definitions/commands.mjs', 'export const seatGroups',
          "'seat:senior-sdet.extra': { purpose: '测试构造', verbs: ['npm run check','git commit'] },");
        grantGroup(d, 'senior-sdet', 'seat:senior-sdet.extra');
      },
      /^ForbiddenGroupGranted: senior-sdet:seat:senior-sdet\.extra:verb$/],
    ['ForbiddenGroupGranted:not-allowed',
      (d) => {
        insertInObject(d, 'tools/docgen/policy/definitions/commands.mjs', 'export const seatGroups',
          "'seat:senior-sdet.extra': { purpose: '测试构造', verbs: ['curl https://x'] },");
        grantGroup(d, 'senior-sdet', 'seat:senior-sdet.extra');
      },
      /^ForbiddenGroupGranted: senior-sdet:seat:senior-sdet\.extra:not-allowed$/],
    ['TemplateImpure',
      (d) => editInDir(d, 'tools/docgen/templates/boundary.md.tpl', (s) => `${s}\n\n- 另：\`docs/prd/\` 也不许写。\n`),
      /^TemplateImpure: tools\/docgen\/templates\/boundary\.md\.tpl:.+$/],
  ];
  // §7 报文路径口径（spec:197）：一律仓内 POSIX 相对路径；禁绝对路径 / 盘符 / 用户目录 / file://
  const ABS = /[A-Za-z]:[\\/]|\/Users\/|\/home\/|file:\/\/|\\\\[A-Za-z0-9._-]+\\/;
  const PATH_CODES = new Set(['LiteralInConfig', 'SeatNameInDefinition', 'TemplateImpure']);
  const assertReportPath = (line, code) => {
    assert.equal(line.includes('\\'), false, `${code}: 首行不得含反斜杠（spec:197 要 POSIX 相对路径）→ ${line}`);
    assert.equal(ABS.test(line), false, `${code}: 首行不得含绝对路径 / 盘符 / 用户目录 / file://（spec:197）→ ${line}`);
    if (PATH_CODES.has(code)) {
      assert.ok(line.startsWith(`${code}: tools/docgen/`),
        `${code}: 报文路径必须以仓内 POSIX 相对路径 tools/docgen/ 开头（spec:197），实得 ${line}`);
    }
  };
  for (const [name, edit, re] of CLI_CASES) {
    const r = probe(edit);
    assert.equal(r.status, 1, `${name}: 五个 CLI 码一律 exit 1（未映射会落 2）`);
    const head = r.stderr.split('\n')[0];
    assert.match(head, re, name);
    assertReportPath(head, name.split(':')[0]);
  }
  // 负例：同一片段写成绝对路径 / 盘符 / 用户目录 / file:// → 上述路径断言必红
  for (const [code, badHead] of [
    ['TemplateImpure', 'TemplateImpure: D:\\Seed\\retro-skills\\tools\\docgen\\templates\\boundary.md.tpl:{{SEAT}}'],
    ['SeatNameInDefinition', 'SeatNameInDefinition: /home/ci/repo/tools/docgen/policy/definitions/paths.mjs'],
    ['LiteralInConfig', 'LiteralInConfig: file:///d:/Seed/retro-skills/tools/docgen/policy/seat-policy.json:12'],
    ['UnknownPolicyRef', 'UnknownPolicyRef: senior-sdet:capability=C:\\Users\\ci\\admin'],
  ]) {
    assert.throws(() => assertReportPath(badHead, code), (e) => e.code === 'ERR_ASSERTION',
      `绝对路径形态必须被判红（spec:197）：${badHead}`);
  }
  // 第六码：施工期断言发射，**不是 CLI 码**
  assert.throws(() => assertGolden('reviewer-audit', `${renderBoundary('reviewer-audit')}多一字`),
    (e) => /^RenderNotEquivalent: reviewer-audit:.+/.test(String(e.message).split('\n')[0]));
  assert.throws(() => exitCodeFor('RenderNotEquivalent'), 'CLI 不引入该码');
  ```
- **红绿证据**：红 = 四个新码未进 `EXIT` 映射 → exit 2 + 首行是码本身但退出码错（`assert.equal(status, 1)` 直接红）；另一红 = 把 `RenderNotEquivalent` 也实现成 CLI 码（`gate` 里抛）→ 与 §7「CLI 不引入该码」冲突，D05 的「不在映射表」断言同时红；**再一红 = 报文里的文件位置写成绝对路径 / 盘符 / 用户目录 / `file://`（或反斜杠分隔）→ `assertReportPath` 三条断言必红（负例块自证）**；**再一红 = 席级组只实现 `:verb` 不实现 `:not-allowed` → 本条第四后缀与 B11 ④ 同红**；绿 = 五 CLI 码 exit 1 + 路径全为 `tools/docgen/` 起头的 POSIX 相对路径 + 黄金断言抛该码。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：报文**次行**的详细信息（spec 只定首行）；`RenderNotEquivalent` 的**发射点**已由 v4 §7 写死（施工期断言、CLI 不引入 —— §10.1 第 6 条已闭合），本条不再记缺口；`Mismatch` 报文的路径形态（`Mismatch` 是既有码，`spec:197` 是 §7 的通用注、不挂在某个码上；D02 / A09 不重复断该条）。

### S6-TC-D02 渲染与基准卡面不等 → `Mismatch`（`gate` 口径）

- **覆盖**：V-2 / §3.6 / §7「两个不一致的职责边界」（`Mismatch` 管产物漂移）
- **来源**：spec 推导（spec §7 末段已定：`gate` 中「渲染 ≠ 盘上」报 `Mismatch`；`RenderNotEquivalent` 管「渲染 ≠ 黄金哈希」，属迁移期断言）
- **前置**：两个副本各构造一次（「改定义层一个字符」与「只改盘上卡」各一例）。
- **步骤**：① 副本内改定义层一个字符（例如把 `；兜底句：` 改成 `；兜底：`），使渲染 ≠ 盘上；② 跑 `gate`；③ 取退出码与首行。
- **预期**：exit 1；stderr 首个非空行以 `Mismatch:` 开头（与既有 `tool-tiers.test.mjs` 里 C03 用例的断言同形态；首行格式以现状实现为准，spec §7 只定码与分工）。**不得**期望 `RenderNotEquivalent`——按 §7 的分工，后者的触发是「渲染 ≠ 黄金哈希」，由迁移期断言报（见 D01 的同码行）。卡面漂移的诊断力由 `Mismatch` 兜，`RenderNotEquivalent` 不得被复用来报产物漂移。
- **判据**：
  ```js
  const r = withCopy((d) => {
    editInDir(d, 'tools/docgen/policy/definitions/paths.mjs',
      (s) => s.replace("'其他评审目录'", "'其他评审目录X'"));
    return runCli(d, ['gate']);
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /^Mismatch:/m);
  assert.equal(/RenderNotEquivalent/.test(r.stderr + r.stdout), false);
  ```
- **红绿证据**：红 = 把「盘上 ≠ 渲染」也报成 `RenderNotEquivalent` → 与 §7 分工冲突（两个码语义混用，「渲染器变了」与「卡被手改」无法区分）；绿 = 报 `Mismatch`。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：卡面整文件字节比对（G01）；`RenderNotEquivalent` 的正例（迁移期黄金断言，见 D01 与 C01/C02）。

### S6-TC-D03 定义层（`seats.mjs` 之外）出现席 slug → `SeatNameInDefinition`；显示名只在 `seats.mjs`

- **覆盖**：V-5 / §3.5 不变量3 / §7 `SeatNameInDefinition`（首行路径口径 `spec:197`）
- **来源**：spec 推导（§3.5 不变量3 已定「席名 = slug」；显示名只许出现在 `definitions/seats.mjs` 的 slug→显示名映射）
- **前置**：同 B03；`definitions/seats.mjs` 已落（导出 `SEATS` 与 `SEAT_NAMES`，spec §5）。
- **步骤**：① 副本内给 `definitions/paths.mjs` 的 `purpose` 文本里加 `reviewer-audit`（注入席 slug）；② 跑加载；③ 取首行；④ 真实仓库静态面：①–③ 之外的三个权限类定义文件不得出现任何席 slug，`seats.mjs` 必须含两 producer 席的显示名，模板与其余定义文件不得含中文显示名。
- **预期**：exit 1；首行 `^SeatNameInDefinition: tools/docgen/policy/definitions/paths\.mjs$`。**判据只认席 slug**（`agentData` 里的 `name`），中文显示名归 `seats.mjs` 管；`artifacts.mjs` 的 `owner` 字段是**归属**不是权限授予，其值必须 ∈ `SEAT_NAMES ∪ {'host'}`（spec §3.5 不变量3 例外①；v4 已补 `host` 哨兵，§10.1 第 4 条闭合）——**`'host'` 只允许配 `host: true`**（当前仅 `progress.md`），席名拼错或 `host` 缺 `host:true` 都判红。
- **判据**：
  ```js
  // ① 静态面：权限类定义文件（capabilities / commands / paths / tiers）不得出现任何席 slug
  const slugs = agentData.map((a) => a.name);
  for (const f of ['capabilities','commands','paths','tiers']) {
    const src = readFileSync(`tools/docgen/policy/definitions/${f}.mjs`, 'utf8');
    assert.deepEqual(slugs.filter((s) => src.includes(s)), [], `${f}.mjs 出现席 slug`);
  }
  // ② 归属面：artifacts.owner 必须是已登记 slug；仅 progress.md 的宿主哨兵 `host`（须同时 host:true）例外
  for (const [f, v] of Object.entries(ART.artifacts)) {
    if (!v.owner) continue;
    if (v.owner === 'host') assert.equal(v.host, true, `${f}: owner=host 必须 host:true`);
    else assert.ok(slugs.includes(v.owner), `${f}: owner=${v.owner}`);
  }
  // ③ 显示名只许在 seats.mjs，且 SEATS 是**对象形态**（spec:57）：slug → { display, clause?, escalationWriter?: {slug, artifact} }
  const seatsSrc = readFileSync('tools/docgen/policy/definitions/seats.mjs', 'utf8');
  assert.match(seatsSrc, /'reviewer-audit'\s*:\s*\{\s*display\s*:\s*'审计'/);
  assert.match(seatsSrc, /'detective-observer'\s*:\s*\{\s*display\s*:\s*'侦探'/);
  for (const f of ['capabilities','commands','paths','artifacts','tiers']) {
    assert.equal(/审计|侦探/.test(readFileSync(`tools/docgen/policy/definitions/${f}.mjs`, 'utf8')), false, f);
  }
  assert.equal(/审计|侦探/.test(readFileSync('tools/docgen/templates/boundary.md.tpl', 'utf8')), false, '模板不得内联显示名');
  for (const [slug, v] of Object.entries(SEATS.SEATS)) {
    assert.ok(String(v.display ?? '').trim().length > 0, `${slug}: display 必填非空`);
    if (v.escalationWriter) {
      assert.ok(v.escalationWriter.slug && v.escalationWriter.artifact, `${slug}: escalationWriter 必须是对象 {slug, artifact}`);
      assert.ok(SEATS.SEAT_NAMES.includes(v.escalationWriter.slug), `${slug}: escalationWriter.slug 未登记`);
    }
  }
  // ④ 副本注入后的报文（`r` = 步骤 ④ 的探针结果）
  const r = withCopy((d) => {
    editInDir(d, 'tools/docgen/policy/definitions/paths.mjs',
      (s) => s.replace("'其他评审目录'", "'其他评审目录-reviewer-audit'"));
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr.split('\n')[0], /^SeatNameInDefinition: tools\/docgen\/policy\/definitions\/paths\.mjs$/);
  ```
- **红绿证据**：红 = 定义层按席写死（`reviewer-audit` 特判）→ 规则又变成「按席散落」，D1 归零；另一红 = 把 `seats.mjs` 写成平面 `slug → '显示名'` 字符串映射 → ③ 的对象形态断言红（`escalationWriter` / `clause` 无处安放，槽 5 / 槽 6 取不到值，议会 #3 F4）；绿 = 报错且显示名只在 `seats.mjs` 的对象里。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：显示名文案是否恰当（语义，归议会）；`seats.mjs` 是否覆盖全部 15 席（§3.2 只要求两 producer 席的显示名可用）。

### S6-TC-D04 九条不变量各有 ≥1 个负例（机器可数）

- **覆盖**：**V-5「九条不变量」** / §3.5
- **来源**：spec 推导（v8 `spec:105-113` 为 **9 条**；`spec:208` V-5 现写「九条不变量」——议会 #3 F1 / F29 要求 D04 给出机器判据，不许只写「人工可复算」）
- **前置**：本文件全部用例已落。
- **步骤**：① 建立「不变量 → 声明覆盖它的用例」索引；② 逐个用例段读原文，断言其覆盖段确实写了 `不变量 N`（防「只在索引里声称」）；③ 对不变量 1–8，断言索引里至少有一个「类型 = 负」的用例；④ 不变量 9 的负例是 B01 的档位不一致分支，断言该分支在 B01 段内显式声明。
- **预期**：9 条各有 ≥1 用例；1–8 各 ≥1 负例；9 的负例在 B01 内可定位。
- **判据**：
  ```js
  const doc = readFileSync('docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design-testcase.md', 'utf8');
  const section = (id) => {
    const i = doc.indexOf(`### ${id} `);
    assert.ok(i >= 0, `缺用例段 ${id}`);
    const j = doc.indexOf('### ', i + 4);
    return doc.slice(i, j < 0 ? undefined : j);
  };
  const INV = {
    1: ['S6-TC-B02','S6-TC-B06','S6-TC-B07'],
    2: ['S6-TC-B02','S6-TC-B14','S6-TC-B15'],
    3: ['S6-TC-D03'],
    4: ['S6-TC-B09'],
    5: ['S6-TC-B10'],
    6: ['S6-TC-C03'],
    7: ['S6-TC-C06','S6-TC-C07'],
    8: ['S6-TC-B11','S6-TC-I02'],
    9: ['S6-TC-B01'],
  };
  assert.equal(Object.keys(INV).length, 9, 'spec §3.5 现为九条不变量（v8）');
  for (const [n, ids] of Object.entries(INV)) {
    assert.ok(ids.length >= 1, `不变量 ${n} 无用例`);
    for (const id of ids) assert.match(section(id), new RegExp(`不变量\\s*${n}(?!\\d)`), `${id} 的覆盖段未声明不变量 ${n}`);
  }
  const rowOf = (id) => doc.split('\n').find((l) => l.startsWith(`| ${id} |`)) ?? '';
  for (const n of ['1','2','3','4','5','6','7','8']) {
    // 「负例」或「边界」（= 负面探针）任一即可，但不得只有正例
    assert.ok(INV[n].some((id) => /\|\s*(负|边界)\s*\|/.test(rowOf(id))), `不变量 ${n} 缺负例 / 边界例`);
  }
  assert.match(section('S6-TC-B01'), /不变量 9 负例/, '不变量 9 的负例必须在 B01 里显式声明');
  ```
- **红绿证据**：红 = 只写不变量 1/2/4 的负例（结构收益只证明一半）→ ③ 段逐个报缺；另一红 = 在该用例「覆盖」里删掉 `不变量 N` 但索引仍声称 → ② 段红（这正是「自我声明」的形态）；绿 = 九条齐。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：不变量之外的新增约束。

### S6-TC-D05 五个 CLI 码必须进 `EXIT` 映射（未进则落 2）；`RenderNotEquivalent` **不进** CLI 表

- **覆盖**：§7 退出码 / §3.5
- **来源**：实现观察（补充：`exitCodeFor` 对未知码抛，`main` 兜底 2）+ spec 推导（**v4 §7：`RenderNotEquivalent` 由施工期断言发出、CLI 不引入该码**）
- **前置**：`validateAgentData.mjs` 的 `EXIT` 已加**五个 CLI 码**。
- **步骤**：① 对五个 CLI 码逐个调 `exitCodeFor`；② 断言均返回 1（不抛）；③ 断言 `RenderNotEquivalent` **不进** CLI 映射（调用即抛，与 `FooCode` 同形）——这是「CLI 不引入该码」的机器判据；④ 断言随便一个没登记的码（如 `FooCode`）抛错（证明映射表是封闭判据，不是恒真）。
- **预期**：五码 → 1；`RenderNotEquivalent` → 抛；`FooCode` → 抛。
- **判据**：
  ```js
  for (const c of ['UnknownPolicyRef','LiteralInConfig','SeatNameInDefinition','ForbiddenGroupGranted','TemplateImpure'])
    assert.equal(exitCodeFor(c), 1, c);
  assert.throws(() => exitCodeFor('RenderNotEquivalent'), 'spec §7：CLI 不引入该码（由施工期断言发出）');
  assert.throws(() => exitCodeFor('FooCode'));
  ```
- **红绿证据**：红 = 只写 `fail('UnknownPolicyRef')` 没加映射 → CLI 退出 2，D01 的 `status===1` 红；另一红 = 把 `RenderNotEquivalent` 当 CLI 码加进 `EXIT` 表 → 与 §7「CLI 不引入」冲突，本条第三处断言抛错失败（也让 D01 里「该码由测试发射」的判据变成两套口径）。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：码的语义命名；测试侧断言抛错的**实现位置**（`policy-pure-source.test.mjs` 内自定，spec 未规定文件名）。

### S6-TC-D06 `gate` 侧接线：配置非法 → exit 1 + 五码之一，**不得落成 `Mismatch`**

- **覆盖**：§7 注「`gate` 侧必须调用 `validatePolicy()`」（`spec:196`）/ §5「发射点：`gate` + `policy --dump`」（`spec:161`）/ 五码之二（`LiteralInConfig`、`ForbiddenGroupGranted`）的 `gate` 侧接线
- **来源**：spec 推导（`spec:196`：`gate` 是唯一运行时防线，配置非法必须 exit 1 并给五个码之一，不得落 `Mismatch` 或被静默放行；`spec:161`：`validatePolicy()` 由 `cli.mjs` 在 `gate` 与 `policy --dump` **两处**调用）+ 议会 #3 第 4 轮后端卡 **Q-4-BE-01**（现有五码探针全走 `policy --dump`，`gate` 侧零用例 → 施工只接 dump 也能全绿）
- **前置**：两个**互相独立**的 `withCopy` 副本（每例一副本，避免前一例的非法配置污染后一例）；`policy/` 定义层 + `seat-policy.mjs` 已落（spec §5）；`gate` 分支已按 `spec:163` 先跑 `validatePolicy()`。
- **步骤**：① 副本 A：给 `reviewer-audit` 的 `allowGroups` 追加一条**路径字面量** `'docs/after/'` → 跑 `runCli(d, ['gate'])`；② 副本 B：同一席授予**禁止组** `docgen.write` → 跑 `runCli(d, ['gate'])`；③ 两次各取 `status` 与 `stderr` 首行。
- **预期**：两次均 `status === 1`；首行分别为 `^LiteralInConfig: `（`spec:99` 归码优先级第 1 档：形态不合 ID 谓词）与 `^ForbiddenGroupGranted: reviewer-audit:docgen\.write`（第 3 档：已登记但属禁止组；后缀 `:forbidden` 由 D01 钉死，本条只钉到组名）；两份输出（stdout + stderr）均**不得**出现 `^Mismatch:`——出现即说明码来自产物比对，不是 `validatePolicy()` 报的。
- **判据**：
  ```js
  const gateProbe = (edit) => withCopy((d) => { edit(d); return runCli(d, ['gate']); });
  // ① 配置层追加路径字面量：形态不合 ID 谓词（spec:99 第 1 档）
  const r1 = gateProbe((d) => grantGroup(d, 'reviewer-audit', 'docs/after/'));
  assert.equal(r1.status, 1, 'gate 侧必须 exit 1（不得静默放行）');
  assert.match(r1.stderr.split('\n')[0], /^LiteralInConfig: /, 'gate 首行必须是 validatePolicy 的码');
  assert.equal(/^Mismatch:/m.test(`${r1.stdout}\n${r1.stderr}`), false, '不得落成 Mismatch（那是产物比对报的）');
  // ② 授予禁止组：已登记但属禁止（spec:99 第 3 档）
  const r2 = gateProbe((d) => grantGroup(d, 'reviewer-audit', 'docgen.write'));
  assert.equal(r2.status, 1);
  assert.match(r2.stderr.split('\n')[0], /^ForbiddenGroupGranted: reviewer-audit:docgen\.write/);
  assert.equal(/^Mismatch:/m.test(`${r2.stdout}\n${r2.stderr}`), false);
  ```
- **红绿证据**：红 = 把 `gate` 里的 `validatePolicy()` 调用删掉（只在 `policy --dump` 接线）→ 副本 A 的配置非法但**卡面渲染不变**，`gate` 静默 exit 0（`status` 与首行断言同时红）；副本 B 若渲染随配置变则会落 `Mismatch`（首行断言 + `Mismatch` 缺席断言同时红，且归因被误导成「产物漂移」）。绿 = 接线在位，两次都是 exit 1 且首行是 `validatePolicy` 的码。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：另外三码（`UnknownPolicyRef` / `SeatNameInDefinition` / `TemplateImpure`）不在 `gate` 侧重复举证——`policy --dump` 已覆盖（D01），避免复制五码矩阵；`validatePolicy()` 之后的逐席比对行为（`Mismatch` 正例见 D02 / A09）。

### S6-TC-E01 新增一条禁止路径 → 只改 `definitions/paths.mjs` + 重生成两张卡 → `gate` 绿

- **覆盖**：**V-6** / §8 V-6 / §11.3 D1
- **来源**：spec 推导（`spec:209` V-6：**新增**一条禁止路径 → 只改 `definitions/paths.mjs` + 重生成两张卡 → `gate` 绿，其它源文件 0 改动；议会 #3 F20：原 E01 实为「删了再恢复」，没测「改一条只动一处」）
- **前置**：`withCopy` 副本（含 `agents/`）。
- **步骤**：① 记录副本内 `tools/docgen/` 全部文件哈希；② 副本内在 `workspace` 组新增 `'vendor/'`；③ 跑 `gate`（必须红）；**两席渲染文本都必须含 `vendor/`**（`gate` 只报首处差异，见 spec §7 注「`gate` 只报首处差异」，故「两席都接上定义层」在渲染层逐个断言，不在 stderr 上数）；④ 把两席的渲染结果写回卡面（= `replace` 的效果；副本内不跑 draft 流程）；⑤ 再跑 `gate`（必须绿 + `baseline N/N`）；⑥ 重算哈希：**只有** `definitions/paths.mjs` 变过（卡面在 `agents/` 下另算）。
- **预期**：③ `Mismatch` + 两席渲染均含新路径；⑤ exit 0；⑥ 源文件改动集恰 1 个。
- **判据**：
  ```js
  withCopy((d) => {
    const snap = () => dirHashes(join(d, 'tools/docgen'));
    const before = snap();
    editInDir(d, 'tools/docgen/policy/definitions/paths.mjs',
      (s) => s.replace("'其他评审目录',", "'其他评审目录',\n  'vendor/',"));
    const red = runCli(d, ['gate']);
    assert.equal(red.status, 1, '新增一条禁止路径必须让卡面失配');
    assert.match(red.stderr, /^Mismatch: agents\/\S+\.md/m, red.stderr.split('\n')[0]);
    for (const seat of ['reviewer-audit','detective-observer']) {
      assert.ok(renderBoundaryIn(d, seat).includes('vendor/'), `${seat} 未接上定义层（渲染缺新增路径）`);
    }
    // 重生成两张卡 = 把渲染结果写回卡尾的边界节（与 replace 同效）；卡文本必须读**副本内**的卡
    for (const seat of ['reviewer-audit','detective-observer']) {
      const text = readFileSync(join(d, 'agents', `${seat}.md`), 'utf8');
      const head = text.slice(0, text.indexOf('## 边界') + '## 边界'.length);
      writeFileSync(join(d, `agents/${seat}.md`), `${head}\n${renderBoundaryIn(d, seat)}\n`, 'utf8');
    }
    const green = runCli(d, ['gate']);
    assert.equal(green.status, 0, green.stderr);
    assert.match(green.stdout, /baseline \d+\/\d+/);
    const after = snap();
    const changed = Object.keys(after).filter((k) => before[k] !== after[k]);
    assert.deepEqual(changed, [join(d, 'tools/docgen/policy/definitions/paths.mjs').replace(/\\/g, '/')],
      '改一条路径只许动一个源文件');
  });
  ```
- **红绿证据**：红 = 新增一条后要改模板 / 测试 / 卡三处才绿（影响面 > 1 源文件 → V-6 失败）；绿 = 只改定义层 + 两卡重生成。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：「删一条但不改变卡面」的写法（如删掉某个 `purpose` 里的修饰词）；`replace` 子命令自身的 draft 流程（S5 已覆盖）。

### S6-TC-E02 V-8「加一席只改数据」两形态：已登记席加组 = 1 处数据；新增席 = 2 处数据、零代码

- **覆盖**：**V-8** / §3.6 / §3.3 席级组 / §3.2 `seats` 可选槽缺省（`spec:57`）
- **来源**：spec 推导（`spec:211` V-8：**副本内给已登记席加一个 `allowGroups` 组 → 只改 `seat-policy.mjs` 一处**、且只该席 `renderBoundary` 输出变；**新增一个席**时改动 = `seats.mjs` 的 `display` + `seat-policy.mjs` 的组（**两处数据、零代码**），其余席渲染零变化；度量层 = 渲染层）
- **前置**：两个独立副本（形态 ①/② 各一个），其余条件相同；`senior-sdet` 的可选槽在真仓库是**缺省未声明**（能渲染、无悬空标点）。
- **步骤**：① 记改前基线：`changedFiles(ROOT, 副本)` 的比对基准 + 3 席 `renderBoundary` 哈希；② **形态 ①（已登记席加组）**：副本内给 `senior-sdet.allowGroups` 加 `'check.local'` → 断言改动文件集恰 `['policy/seat-policy.mjs']`、渲染差异席恰 `['senior-sdet']`、`gate` 仍 exit 0（卡面走手写句，12 席不接渲染层）；③ **形态 ②（新增席）**：另一个副本内 `seats.mjs` 加 `'probe-seat': { display: '探针席' }` + `seat-policy.mjs` 加一条策略 → 断言改动文件集恰 `['policy/definitions/seats.mjs','policy/seat-policy.mjs']`（**两处数据、零代码**）、其余 3 席渲染哈希零变化；④ `senior-sdet` 在副本内仍能渲染、无 `undefined`、无悬空标点（缺省槽不得因加组而变脏）。
- **预期**：形态 ① 只动配置层一处；形态 ② 动两处数据、**零代码**；两种形态下其余席渲染零变化；`gate` 在形态 ① 仍绿（`senior-sdet` 卡面走手写 `DEFAULT_BOUNDARY`，§3.6 本轮只收 2 席，「只影响一席」只能在渲染层量）；15 张卡零变化由 G01 / V-2 单独兜。
- **判据**：
  ```js
  const hashesOf = (d) => JSON.parse(runEsm(d, `import {createHash} from 'node:crypto';
    import {renderBoundary} from './tools/docgen/components/renderBoundary.mjs';
    console.log(JSON.stringify(Object.fromEntries(['reviewer-audit','detective-observer','senior-sdet']
      .map((s) => [s, createHash('sha256').update(renderBoundary(s)).digest('hex')]))))`).stdout);
  const before = hashesOf(ROOT);
  // ① 已登记席加组 → 只改 seat-policy.mjs 一处（数据），只该席渲染变，gate 仍绿
  withCopy((d) => {
    grantGroup(d, 'senior-sdet', 'check.local');
    assert.deepEqual(changedFiles(ROOT, d), ['policy/seat-policy.mjs'], 'V-8①：已登记席加组只应改配置层一处');
    const after = hashesOf(d);
    assert.deepEqual(Object.keys(after).filter((n) => after[n] !== before[n]), ['senior-sdet']);
    assert.equal(runCli(d, ['gate']).status, 0, '卡面必须零变化（12 席不接渲染层）');
    const sd = renderBoundaryIn(d, 'senior-sdet');
    assert.equal(/undefined|null|NaN/.test(sd), false, '缺省槽渲染出未定义值');
    assert.equal(/[、，；：]{2,}|[、，；：]\s*[。；]/.test(sd), false, '缺省槽留下悬空标点');
  });
  // ② 新增席 → 两处数据、零代码；其余席渲染零变化（度量层 = 渲染层）
  withCopy((d) => {
    insertInObject(d, 'tools/docgen/policy/definitions/seats.mjs', 'export const SEATS', "'probe-seat': { display: '探针席' },");
    insertInObject(d, 'tools/docgen/policy/seat-policy.mjs', 'export const SEAT_POLICY',
      "'probe-seat': { capabilities: ['read'], allowGroups: ['check.local'], artifacts: [] },");
    assert.deepEqual(changedFiles(ROOT, d),
      ['policy/definitions/seats.mjs', 'policy/seat-policy.mjs'], 'V-8②：新增席 = 两处数据、零代码');
    const after = hashesOf(d);
    for (const s of ['reviewer-audit','detective-observer','senior-sdet']) assert.equal(after[s], before[s], `${s}: 其余席渲染不得变`);
  });
  ```
- **红绿证据**：红 = 为满足 V-8 让所有席都接 `renderBoundary` → 12 个 default 席卡面全变、`gate` 红（这正是 G-9 的原形，v2 已用「只收 2 席 + 度量层改渲染层」关闭）；另一红 = 把 V-8 写成「只动一个文件」→ 形态 ② 会去改代码（渲染器里加席特判）→ `changedFiles` 多出 `components/*.mjs`，本条红；另一红 = 新增席只加 `seats.mjs` 不加策略 → `policy --dump` 红（不变量 1）；绿 = 形态 ① 1 处数据、形态 ② 2 处数据且零代码。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：`gate` 报文里「恰 1 席」的严格计数（实现可能在首个差异处即退出——见 §8 建议 8）；12 席 `DEFAULT_BOUNDARY` 的逐字不变（G03）；新增席是否要出卡（本轮不增席，`spec:169` 写死改造期不增席）。

### S6-TC-E03 23 项清单副本收敛到「定义层 1 处 + 2 张卡」

- **覆盖**：**V-7** / `spec:210` V-7 扫描面 / D1
- **来源**：spec 推导（`spec:210` 写死扫描面 = **非 `docs/` + S5 testcase**，活跃副本命中处 = 定义层 1 处 + 2 张卡，spec / 测试 / S5 testcase **0 条手抄**；同一句写明「S5 spec 的清单原句按 `docs-convention` 属历史记录、允许保留，但必须有指针」→ **S5 spec 不进副本判定**，其指针由 E05 判；议会 #3 F12 / AC-1：`listCopies` 必须排除 `tools/docgen/test/`，否则新测试文件自己是第 4 份副本）
- **前置**：S6 施工完成（模板已纯、测试已改 import、S5 spec 已指针化、S5 testcase 数组已派生）。
- **步骤**：① `git ls-files` 取 tracked 文件；② 过滤 = 非 `docs/` 的代码/文档类文件 **∪** S5 testcase，**再排除 `tools/docgen/test/`**（判据侧文件不算策略副本）；**不并入 S5 spec**（历史记录，`spec:210`）；③ 对每个文件数 `pathTokens()` 命中数；④ 命中 ≥20 的列为「副本」；⑤ 断言副本集合。
- **预期**：副本集合 == `['tools/docgen/policy/definitions/paths.mjs', 'agents/reviewer-audit.md', 'agents/detective-observer.md']`（定义层 1 处 + 渲染产物 2 张）；模板与测试命中数均 < 20；S5 testcase 命中数 < 20（已改派生 = 0 手抄）；**本 spec 自身**也不内联整份清单（`spec:210` 的「spec 0 条手抄」）。
- **判据**：
  ```js
  const S5_TC = 'docs/superpowers/specs/2026-10-25-s5-tool-tiers-design-testcase.md';
  const S6_SPEC = 'docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design.md';
  const ls = spawnSync('git', ['ls-files'], { encoding: 'utf8' });
  assert.equal(ls.status, 0, ls.stderr);
  const files = ls.stdout.trim().split('\n')
    .filter((f) => /\.(mjs|md|tpl|json)$/.test(f))
    .filter((f) => !f.startsWith('docs/') || f === S5_TC)   // S5 spec 不在扫描面（spec:210：历史记录，只判指针）
    .filter((f) => !f.startsWith('tools/docgen/test/'));
  assert.deepEqual(listCopies(ROOT, files).sort(), [
    'agents/detective-observer.md', 'agents/reviewer-audit.md', 'tools/docgen/policy/definitions/paths.mjs']);
  // spec:210 的「spec 0 条手抄」：本 spec 自身不得内联整份清单（定向单文件，不把 docs/ 并入扫描面）
  assert.deepEqual(listCopies(ROOT, [S6_SPEC]), [], 'S6 spec 自身内联了整份路径清单（应只引用定义层）');
  ```
- **红绿证据**：红 = 模板里留了原句（模板命中 ≥20）→ 副本数 4，本用例点名模板；另一红 = 不排除 `tools/docgen/test/` → 判据文件命中 ≥20，副本集合多一项（判据自己变成副本）；另一红 = 把 S5 spec 重新并入扫描面 → 其历史清单原句命中 ≥20，副本集合多一项（这正是 `spec:210` 把 S5 spec 划为历史记录的原因；该文件的守卫是 E05 的指针断言，不是副本计数）；绿 = 3 处。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：`docs/` 下的历史 spec 与 testcase（存量不改写）；S5 spec 的清单原句是否「整份副本」——按 `spec:210` 它属历史记录，判据改为「指针在位 + 原句保留」（E05），不是本条的副本计数。

### S6-TC-E04 测试零手抄：`FORBIDDEN_PATHS` 等从定义层 import

- **覆盖**：V-7 / §6 步骤 6
- **来源**：spec 推导
- **前置**：测试改造完成。
- **步骤**：① 读 `tools/docgen/test/tool-tiers.test.mjs` 源码；② 断言存在从定义层的 import；③ 用 `listCopies` 判该文件不是副本；④ 断言源码里没有以 `const FORBIDDEN_PATHS = [` 开头的字面数组。
- **预期**：import 在位（`../policy/definitions/paths.mjs`）；文件命中 < 20；无字面数组。
- **判据**：
  ```js
  const src = readFileSync('tools/docgen/test/tool-tiers.test.mjs','utf8');
  assert.match(src, /import\s*\{[^}]*\}\s*from\s*'\.\.\/policy\/definitions\/paths\.mjs'/);
  assert.equal(/const FORBIDDEN_PATHS\s*=\s*\[/.test(src), false);
  assert.deepEqual(listCopies(ROOT, ['tools/docgen/test/tool-tiers.test.mjs']), []);
  ```
- **红绿证据**：红 = 测试里再抄一份清单（第 6 份副本，改定义层时测试不跟随，判据恒真）；绿 = import。
- **对应测试**：改 `tools/docgen/test/tool-tiers.test.mjs:36-41` + 新文件断言——待 plan Task N。
- **不覆盖**：其它测试文件里的路径清单（E03 全仓扫描兜）。

### S6-TC-E05 S5 文档侧：spec 只加指针（不改原句）+ testcase 三条改判 → 0 手抄

- **覆盖**：V-7 / `spec:122` S5 文档侧 / `spec:210`「S5 spec 属历史记录、只判指针」/ §6 步骤 4b / D5
- **来源**：spec 推导（`spec:122`：S5 spec §3.3 与 §8 **加指针**、不改原句不改结论；S5 testcase 的 `E05` / `B08` / `B14` 三条判据与前置改判、手抄数组改派生；`spec:210`：S5 spec 的清单原句按 `docs-convention` **属历史记录、允许保留**，但必须有指针 → 本条不判「S5 spec 是否整份副本」；议会 #3 F15 / AU-4）
- **前置**：S6 步骤 4b 完成。
- **步骤**：① 切出 S5 spec 的 §3.3 与 §8 两节，**各自**断言指针在位（`tools/docgen/policy/` + `policy --dump`）；② 断言 §3.3 的路径清单原句（`逐项点名`）与 V-3 结论句**仍在**（历史记录保留，`spec:210`）；③ 读 S5 testcase，断言三条用例段内已无 `BOUNDARY_COMMAND`，且**逐条命中 `spec:122` 写死的具体断言**（`S5-TC-E05` / `B08` / `B14` 三种句式各不相同，见判据 `WANT`）；④ 断言 S5 testcase 不再有手抄的路径数组（0 手抄），且已改为 `import { pathTokens }` 派生、不再称「22 项数组」。
- **预期**：两节指针各在位；§3.3 / §8 原句未被改写；三条用例段**按 `spec:122` 写死的断言**改判完成（`S5-TC-E05` → `renderBoundary('reviewer-audit')` 非空且 `=== boundaryBySeat['reviewer-audit']`；`S5-TC-B08` → `a.boundary === renderBoundary(席)`；`S5-TC-B14` → 前置改 `DEFAULT_BOUNDARY` 仍可导入 + 断言 `renderBoundary(席) !== DEFAULT_BOUNDARY`）；S5 testcase 无 `const FORBIDDEN_PATHS = [` / `const PATH_23 = [` 字面数组、命中 < 20（已改 `import { pathTokens }` 派生，且不再称「22 项数组」）。
- **判据**：
  ```js
  const S5_SPEC = 'docs/superpowers/specs/2026-10-25-s5-tool-tiers-design.md';
  const S5_TC = 'docs/superpowers/specs/2026-10-25-s5-tool-tiers-design-testcase.md';
  const s5 = readFileSync(S5_SPEC, 'utf8');
  const sec = (head, next) => { const i = s5.indexOf(head); const j = i < 0 ? -1 : s5.indexOf(next, i + head.length); return i < 0 ? '' : s5.slice(i, j < 0 ? undefined : j); };
  // ① 两节各自带指针（spec:122 / spec:210）
  for (const [name, body] of [['§3.3', sec('### 3.3', '### 3.4')], ['§8', sec('## 8 验收', '## 9 测试')]]) {
    assert.ok(body.length > 0, `S5 spec 缺 ${name}`);
    assert.match(body, /tools\/docgen\/policy\//, `${name} 缺「以 policy/ 为准」指针`);
    assert.match(body, /policy --dump/, `${name} 缺「policy --dump 为准」指针`);
  }
  // ② 历史记录保留：§3.3 的清单原句与 V-3 结论句仍在（只加指针、不改原句）
  assert.match(sec('### 3.3', '### 3.4'), /逐项点名/, '§3.3 的路径清单原句必须保留（历史记录，spec:210）');
  assert.match(s5, /V-3/, 'V-3 结论句必须保留（只加指针、不改原句）');
  // ③ S5 testcase 三条改判（**逐条按 spec:122 写死的断言**，不满足于「出现 renderBoundary」）
  const tc = readFileSync(S5_TC, 'utf8');
  const seg = (id) => { const i = tc.indexOf(`### ${id}`); return i < 0 ? '' : tc.slice(i, tc.indexOf('### ', i + 4)); };
  const WANT = {
    'S5-TC-E05': [/renderBoundary\((['"]reviewer-audit['"]|席|seat)\)/, /boundaryBySeat\[(['"]reviewer-audit['"]|席|seat)\]/],
    'S5-TC-B08': [/boundary\s*===\s*renderBoundary/],
    'S5-TC-B14': [/DEFAULT_BOUNDARY/, /!==\s*DEFAULT_BOUNDARY/],
  };
  for (const id of ['S5-TC-B08','S5-TC-E05','S5-TC-B14']) {
    assert.ok(seg(id).length > 0, `缺段 ${id}`);
    assert.equal(/BOUNDARY_COMMAND/.test(seg(id)), false, `${id} 仍以已删常量为判据`);
    for (const re of WANT[id]) assert.match(seg(id), re, `${id} 未按 spec:122 改判（缺 ${re}）`);
  }
  // ④ S5 testcase 0 手抄（字面数组 + 整份清单命中数双判）+ 路径清单改 `import { pathTokens }` 派生
  assert.equal(/const\s+(FORBIDDEN_PATHS|PATH_23)\s*=\s*\[/.test(tc), false, 'S5 testcase 仍有手抄数组');
  assert.deepEqual(listCopies(ROOT, [S5_TC]), [], 'S5 testcase 仍是整份清单副本（应改为派生）');
  assert.match(tc, /import\s*\{[^}]*\bpathTokens\b[^}]*\}/, 'S5 testcase 未改为 `import { pathTokens }` 派生（spec:122 写死）');
  assert.equal(/22\s*项数组/.test(tc), false, 'S5 testcase 仍在称「22 项数组」（应为 21 数组元素 + 1 pattern，用 pathTokens 派生）');
  ```
- **红绿证据**：红 = S5 spec 只在文首加一句「已迁移」而 §3.3 / §8 节内没有指针 → ① 段红（切节后查不到）；另一红 = 为了「0 副本」去删改 §3.3 的清单原句 → ② 段红（与 `docs-convention` 的历史保留冲突，且 `spec:210` 明确允许保留）；另一红 = S5 testcase 只加一句「已迁移」而不改判三条 → ③ 段红；再一红 = 三条只写「见 `renderBoundary`」而不落 `spec:122` 的具体断言（如 B08 少了 `boundary === renderBoundary`、B14 仍拿 `BOUNDARY_COMMAND` 构造半改态）→ ③ 的 `WANT` 逐条正则红；再一红 = S5 testcase 保留整份手抄数组、或改派生却仍称「22 项数组」→ ④ 段红；绿 = 两节指针 + 原句保留 + 三条按 `spec:122` 改判 + 0 手抄。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：S5 spec 的其它结论（`spec:29`：不改已签结论）；S5 spec 的清单原句是否构成「副本」——按 `spec:210` 它属历史记录、不进副本判定（E03 的扫描面已排除 `docs/`）。

### S6-TC-E06 `ALLOWED` / `FORBIDDEN` 两组常量同样来自定义层

- **覆盖**：V-7 / §6 步骤 6
- **来源**：spec 推导
- **前置**：测试改造完成。
- **步骤**：读 `tool-tiers.test.mjs`，断言旧的 `ALLOWED` / `FORBIDDEN` 字面数组已被定义层导入替代（或保留为「从定义层派生的局部变量」而非字面量）。
- **预期**：两组都不以字面数组形式存在；若保留同名变量，其右侧必须是 `Object.values(CMD.commandGroups).flatMap…` 这类派生表达式。
- **判据**：
  ```js
  const src = readFileSync('tools/docgen/test/tool-tiers.test.mjs','utf8');
  assert.equal(/const ALLOWED = \[/.test(src), false);
  assert.equal(/const FORBIDDEN = \[/.test(src), false);
  ```
- **红绿证据**：红 = 只改 `FORBIDDEN_PATHS`、`ALLOWED`/`FORBIDDEN` 仍手抄 → 命令白名单漂移时测试不跟随（假绿）；绿 = 全派生。
- **对应测试**：改 `tool-tiers.test.mjs:270-276` + 新文件断言——待 plan Task N。
- **不覆盖**：合成样例（`SYNTH_ALLOWED` 那类故意构造的假数据，允许是字面量）。

### S6-TC-E07 定义层单源：`policy/` 下无第二份边界/清单常量文件

- **覆盖**：V-7 / §3.1 单向依赖
- **来源**：实现观察（补充）——「新增一个 `policy/legacy.mjs` 存旧句」是最省事的伪迁移
- **前置**：`policy/` 目录已落。
- **步骤**：① 列 `policy/` 下全部文件；② 断言文件集恰 `definitions/{capabilities,tiers,commands,paths,artifacts,seats}.mjs` + `seat-policy.mjs`（`tiers.mjs` 由 §3.2 `spec:53` 引入，§5 布局已列）；③ 对每个文件跑「边界句特征词」扫描（`只允许写`、`逐项点名`、`命令默认拒绝`）；④ 断言 `tiers.mjs` **不是空壳**：`TIERS` 四档齐（含 `command`）、**每档的值是工具名**（不是 capability ID），`tierOfCapabilities` 判「caps 展开 == `TIERS[档]`」，且 `patternRegistry.tools` 与它是**同一对象引用**（`assert.equal`，严格相等）。
- **预期**：文件集精确；边界句特征词只出现在 `definitions/paths.mjs`（`逐项点名` 相关数据）与 `seat-policy.mjs`（0 次）；无文件同时含 3 个特征词（= 一份边界句）；档位表四档齐、**值 = 工具名**、单一来源（re-export 同引用）。
- **判据**：
  ```js
  const ls = spawnSync('git', ['ls-files', 'tools/docgen/policy'], { encoding: 'utf8' });
  assert.equal(ls.status, 0, ls.stderr);
  const files = ls.stdout.trim().split('\n').map((f) => f.replace('tools/docgen/policy/', ''));
  assert.deepEqual(files.sort(), ['definitions/artifacts.mjs','definitions/capabilities.mjs',
    'definitions/commands.mjs','definitions/paths.mjs','definitions/seats.mjs','definitions/tiers.mjs',
    'seat-policy.mjs']);
  const marks = ['只允许写','逐项点名','命令默认拒绝'];
  for (const f of files) {
    const t = readFileSync(`tools/docgen/policy/${f}`, 'utf8');
    assert.ok(marks.filter((m) => t.includes(m)).length < 2, `${f} 疑似含一份边界句`);
  }
  // ④ `tiers.mjs` 必须是真档位表（`TIERS` 四档齐、`command` 键在、**值是工具名**），且 patternRegistry 只是 re-export 同一对象
  assert.deepEqual(Object.keys(TIERS), ['readOnly','sdet','command','producer']);
  const TOOLS = new Set(Object.values(CAP.capabilities).flat());
  for (const [tier, tools] of Object.entries(TIERS)) {
    assert.ok(Array.isArray(tools) && tools.length > 0, `${tier}: 档位值必须是工具名数组`);
    for (const t of tools) assert.ok(TOOLS.has(t), `${tier}: ${t} 不是工具名（档位值不得写成 capability ID）`);
  }
  // 档位语义 = 「caps 展开 == TIERS[档]」的唯一样（spec:53）：command 档 = read + exec 展开的工具名
  assert.equal(tierOfCapabilities(['read','exec']), 'command', 'command 档必须由 read+exec 唯一命中');
  assert.deepEqual([...CAP.capabilities.read, ...CAP.capabilities.exec], TIERS.command,
    'command 档的值必须 = read+exec 展开的工具名');
  assert.equal(patternRegistry.tools, TIERS, 'patternRegistry 必须 re-export tiers.mjs 的同一对象（严格相等，不得深拷贝 / 不得另存一份）');
  ```
- **红绿证据**：红 = 保留 `policy/legacy.mjs` 存原句「留个后路」→ 文件集不等（E03 也可能漏：阈值 20 对单句够但仍算一份）；另一红 = 把档位表留在 `patternRegistry` 而 `policy/definitions/tiers.mjs` 只 re-export 空壳 → 文件集虽然对，但 §3.2 说「下沉到这里」的单一真相没落地（A01 / B01 的不变量 9 会先红，本条 ④ 的四档断言同时红）；另一红 = 删 `command` 档（只留三档）→ ④ 红；再一红 = 档位值写成 capability ID（`TIERS.command = ['read','exec']`）→ ④ 的「值 ∈ 工具名全集」与「command = read+exec 展开」同时红；绿 = 文件集精确 + 四档（工具名）单源。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：`templates/` 下的其它模板（`agent.md.tpl` 等不动）。

### S6-TC-F01 dump JSON 顶层键齐、每席有 `expanded`

- **覆盖**：V-10 / §5
- **来源**：spec 推导
- **前置**：`cli.mjs policy --dump` 已落。
- **步骤**：跑 `runCli(['policy','--dump'])`，解析 JSON，逐键核 spec §5 的顶层形状。
- **预期**：顶层键恰 `{capabilities, tiers, commands, seatGroups, paths, detectionBlindSpots, artifacts, seats}`；`tiers` = **四档**（`readOnly` / `sdet` / `command` / `producer`，`command` 键在）且**值是工具名**（`spec:53`）；`commands` 组集 = **允许 3 组 ∪ 禁止 5 组 ∪ `seatGroups`**（本轮席级组为空集，故 8 组，`spec:162`），每组含 `{purpose, verbs}`；`paths` 每组是数组且 `paths.patterns.specPlan` 是**正则源串**；`detectionBlindSpots` = 3 项；`seats` 的键 = 配置层登记的席（3 席 + `__default__`），每席含 `display` + `expanded` 数组 = **12 项**。
- **判据**：
  ```js
  const { json } = dumpPolicy(ROOT);
  assert.deepEqual(Object.keys(json).sort(),
    ['artifacts','capabilities','commands','detectionBlindSpots','paths','seatGroups','seats','tiers']);
  // tiers 顶层值 = **四档**（含 `command`：S2 精算师保留档，本轮无挂席但键不得删，`spec:53`），**值是工具名**
  assert.deepEqual(Object.keys(json.tiers).sort(), ['command','producer','readOnly','sdet']);
  assert.deepEqual(json.tiers, TIERS, 'dump 的 tiers 必须与 tiers.mjs 同值（值 = 工具名，不是 capability ID）');
  // commands = 允许 3 ∪ 禁止 5 ∪ seatGroups（spec:162；本轮 seatGroups 为空集 → 恰 8 组）
  assert.deepEqual(Object.keys(json.commands).sort(),
    [...Object.keys(CMD.commandGroups), ...Object.keys(CMD.forbiddenGroups), ...Object.keys(CMD.seatGroups ?? {})].sort(),
    'dump 的 commands 组集 ≠ 允许 3 ∪ 禁止 5 ∪ seatGroups');
  for (const [g, v] of Object.entries(json.commands)) { assert.ok(v.purpose && v.verbs.length, g); }
  assert.equal(typeof json.paths.patterns.specPlan, 'string', 'dump 必须用正则源串表达 spec / plan（RegExp 序列化不了）');
  assert.deepEqual(json.detectionBlindSpots, ['.session/','.superpowers/','lessons/']);
  assert.equal(typeof json.seatGroups, 'object');
  for (const [s, v] of Object.entries(json.seats)) {
    assert.ok(String(v.display).trim().length > 0, `${s}: display 缺失`);
    assert.ok(Array.isArray(v.expanded), s);
    assert.equal(v.expanded.length, 12, `${s}: expanded 必须是 12 个槽值（不是整段边界文本）`);
  }
  ```
- **红绿证据**：红 = dump 只输出 `seats`（少了 `paths` / `tiers` / `detectionBlindSpots`）→ 审计无法复算「23 项是否齐」「档位是否一致」「检测盲区取哪里」；另一红 = `paths.patterns.specPlan` 直接塞 `RegExp` → JSON 序列化成 `{}`（`typeof` 不是 string）；绿 = 八键齐。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：dump 的人类可读格式（spec 只定 JSON）。

### S6-TC-F02 dump 的槽级展开可复算 `renderBoundary`；两 producer 席 == 卡面边界节

- **覆盖**：V-10 / §5 / §3.6
- **来源**：spec 推导（§3.6 明确 12 席不接 `renderBoundary`；**v5 §5 已定 `seats[席] = { expanded: string[] }` = 12 个槽值、顺序 = §3.4 表顺序、不设「整段文本」字段** → 本条按**槽级可核**写，且顺序有据可判）
- **前置**：卡与 dump 都已就绪；`cardBoundary` 切片口径同 A06 / C08。
- **步骤**：① 对每个登记席：断言 `expanded` 的每一项都是 `renderBoundary(席)` 的子串（槽值确实是渲染原料，不是另拼一份）；② 断言 `expanded.length === 12`（§3.4 十二槽）且**首位 = `SEAT` 槽值、第 2 位 = `tierOfCapabilities` 槽值、第 3 位 = `CAPABILITIES` 槽值、第 10 位 = `FORBIDDEN_PATHS` 槽值、第 12 位 = `DETECTION_CMD` 槽值**（均按 §3.4 表行序定索引：第 n 行 → index n−1，`spec:76` / `spec:162`；这几项可从 `seats.mjs` + `tiers.mjs` + 配置 + `commands.mjs` 的 `git.read` 派生，故可断言），并断第 2 位与该席 caps 展开的 `TIERS[档]` 相等（`spec:53`）；③ 两 producer 席再从 `agents/席.md` 切出边界节，与 `renderBoundary(席)` 逐字相等；④ `senior-sdet` 的 `expanded` 不得含 producer 的允许组。
- **预期**：槽值全部能在渲染文本里找到（证明同源）；两 producer 席 dump↔render↔卡三处一致；槽 2 = 档位名且**该席 caps 展开 == `TIERS[槽 2]`**（值 = 工具名）；槽 10 成员 = **23 项**（含 `spec / plan`）；`senior-sdet` 只有 `read`/`write` 档与空组、槽 5 / 槽 6 缺省为空串且 `expanded` 仍 12 项，且**不得**拿 dump 与卡比（它的卡面走 `DEFAULT_BOUNDARY`，见 §3.6）。
- **判据**：
  ```js
  const { json } = dumpPolicy(ROOT);
  for (const s of Object.keys(SEAT_POLICY).filter((x) => x !== '__default__')) {
    const out = renderBoundary(s);
    assert.equal(json.seats[s].expanded.length, 12, s);
    for (const v of json.seats[s].expanded) assert.ok(out.includes(v), `${s} 槽值不在渲染文本里：${v}`);
    assert.equal(json.seats[s].expanded[0], SEATS.SEATS[s].display, `${s}: 槽 1 = SEAT`);
    assert.equal(json.seats[s].expanded[1],
      tierOfCapabilities(SEAT_POLICY[s].capabilities), `${s}: 槽 2 = tierOfCapabilities`);
    // 槽 2 与档位表同义（spec:53）：该席 caps 展开后的工具集 == `TIERS[槽 2]`（档位值 = 工具名，不是 capability ID）
    assert.deepEqual([...SEAT_POLICY[s].capabilities.flatMap((c) => CAP.capabilities[c])].sort(),
      [...TIERS[json.seats[s].expanded[1]]].sort(), `${s}: caps 展开 ≠ TIERS[槽 2]`);
    assert.equal(json.seats[s].expanded[2],
      SEAT_POLICY[s].capabilities.flatMap((c) => CAP.capabilities[c]).join(' / '), `${s}: 槽 3 = CAPABILITIES`);
    // §3.4 第 12 槽 = DETECTION_CMD（index 11）：值必须是 commands['git.read'].verbs 里的 status 项本身（只读引用，不复制）
    assert.equal(json.seats[s].expanded[11],
      CMD.commandGroups['git.read'].verbs.find((v) => /status/.test(v)), `${s}: 槽 12 = DETECTION_CMD`);
    // 槽 10（index 9）= FORBIDDEN_PATHS：成员 **23 项**（`pathGroups` 六组展开 ∪ `spec / plan`）；
    // `pathItems()` 的 22 只是「定义层数组元素 + pattern 源串」，不是 ③ 段成员数（`spec:89` / `spec:204` V-1③）
    assert.equal(json.seats[s].expanded[9].split('、').filter(Boolean).length, 23, `${s}: 槽 10 成员数应为 23（不是 22）`);
    assert.ok(json.seats[s].expanded[9].includes('spec / plan'), `${s}: 槽 10 必须含 spec / plan（第 23 项）`);
  }
  for (const s of ['reviewer-audit','detective-observer']) {
    assert.equal(cardBoundary(card(s)).trim(), renderBoundary(s).trim(), s);
  }
  assert.equal(json.seats['senior-sdet'].expanded.join('').includes('docgen.read'), false);
  // 可选槽缺省（spec:57）：`senior-sdet` 未声明 clause / escalationWriter → 槽 5 / 槽 6 = 空串，但 expanded 仍 12 项
  assert.equal(json.seats['senior-sdet'].expanded.length, 12, '缺省槽不得让 expanded 变短');
  assert.equal(json.seats['senior-sdet'].expanded[4], '', '槽 5 = SEAT_CLAUSE：缺省未声明 → 空串');
  assert.equal(json.seats['senior-sdet'].expanded[5], '', '槽 6 = ESCALATION_WRITER：缺省未声明 → 空串');
  assert.equal(/undefined|null|NaN/.test(renderBoundary('senior-sdet')), false, '缺省槽渲染出未定义值');
  ```
- **红绿证据**：红 = dump 走另一条拼装路径（自己拼 `join('、')`、顺序不同）→ 两 producer 席的卡面整段比对先红；若连槽值也另造（读了第二份常量）→ 第 ① 步红；另一红 = 槽 10 只展开 `pathGroups`（22 项、漏 `spec / plan`）→ 23 项断言红；另一红 = 把 `senior-sdet` 缺省的 `escalationWriter` 渲染成 `undefined` 字面量 → 末条与 C06 ⑥ 同时红；另一红 = 档位值写成 capability ID（`TIERS.producer = ['read','write','exec']`）→ 槽 2 的「caps 展开 ≠ `TIERS[槽 2]`」断言红；绿 = 同源 + 槽 2 与 `TIERS` 同义 + 槽 10 为 23 项 + 缺省槽为空串。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：dump 的 `commands` 组集（= 允许 3 ∪ 禁止 5 ∪ `seatGroups`，`spec:162`）由 **F01** 断言，本条不重复；`expanded` 第 4–9 / 11 位的逐位顺序——§5 只写死「顺序 = §3.4 表行序（第 n 行 → index n−1）」（`spec:162`），其中 `SEAT`（位 1）、`CAPABILITIES`（位 3）、`FORBIDDEN_PATHS`（位 10）、`DETECTION_CMD`（位 12）能从 `seats.mjs` + 配置 + `paths.mjs` + `commands.mjs` 派生，故由本条断言；其余槽位若照写期望值，等于在测试里再造一份数据（与 V-7 冲突）。dump 也**未给 `text` 字段**（§8 建议 9 未采纳）→ 段级比对仍走 `renderBoundary` 与卡面切片；`__default__` 的展开差异归 B12（策略层）。

### S6-TC-F03 dump 不写盘

- **覆盖**：V-10 / §5「不许写盘」
- **来源**：spec 推导
- **前置**：干净工作区（`withRepoCopy`）。
- **步骤**：① 副本内比 `tools/docgen/**` 全部文件哈希（**副本无 `.git`，不在副本里跑 git**）；② 真仓库根跑 `git --no-optional-locks status --porcelain -- tools/docgen`：跑 dump 前记一次、后记一次；③ 静态守卫：`policy/**` 与 `components/renderBoundary.mjs` / `components/validatePolicy.mjs` 不得 import 写盘 API 或 `node:child_process`（议会 #3 F27）。
- **预期**：副本内哈希集不变、无 `policy.dump.json` 之类落盘文件；真仓库 `status` 逐字不变；静态面 0 命中写盘 / 子进程能力。**命题只承诺「不写仓内文件」**（§10 末条：仓外不可证）。
- **判据**：
  ```js
  // ① 副本内：只比哈希（不在副本里跑 git —— 副本没有 .git，跑了必错）
  withCopy((d) => {
    const h0 = dirHashes(join(d, 'tools/docgen'));
    dumpPolicy(d);
    assert.deepEqual(dirHashes(join(d, 'tools/docgen')), h0, 'dump 写了仓内文件');
    assert.equal(existsSync(join(d, 'tools/docgen/policy.dump.json')), false);
  });
  // ② 真仓库根：dump 前后 status 逐字不变
  const st = () => spawnSync('git', ['--no-optional-locks', 'status', '--porcelain', '--', 'tools/docgen'],
    { cwd: ROOT, encoding: 'utf8' }).stdout;
  const s0 = st();
  dumpPolicy(ROOT);
  assert.equal(st(), s0, 'dump 改了真仓库工作区');
  // ③ 静态守卫（议会 #3 F27）：定义层与两个新组件不得引入写盘 / 子进程能力——
  //    「只读子命令」才是结构上可证的，而不是只在一次运行里观测到没写
  for (const f of ['components/renderBoundary.mjs', 'components/validatePolicy.mjs',
    'policy/seat-policy.mjs', 'policy/definitions/capabilities.mjs', 'policy/definitions/tiers.mjs',
    'policy/definitions/commands.mjs', 'policy/definitions/paths.mjs',
    'policy/definitions/artifacts.mjs', 'policy/definitions/seats.mjs']) {
    const src = stripComments(readFileSync(join('tools/docgen', f), 'utf8'));
    assert.equal(/writeFileSync|appendFileSync|createWriteStream|node:child_process/.test(src), false,
      `${f}: 引入写盘 / 子进程能力（只读承诺无法静态成立）`);
  }
  ```
- **红绿证据**：红 = 为「方便审计」把 dump 顺手写到 `tools/docgen/policy.dump.json`（只读子命令变成写盘命令，且该文件立刻进 diff，`gate` 后红）；绿 = 无痕。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：dump 的 stdout 是否被日志系统重定向（不可能在本层判，见 §5）。

### S6-TC-F04 dump 拒绝写盘类 flag → `InvalidArgs` exit 2

- **覆盖**：§5 / §7 / §3.4 只读
- **来源**：spec 推导
- **前置**：`policy` 子命令已给 flag 白名单（`POLICY_FLAGS = { '--dump': BOOL }`）。
- **步骤**：对 `['policy','--dump','--write']`、`['policy','--dump','--out','x.json']`、`['policy','--dump','--apply']` 三次跑。
- **预期**：三次都 exit 2；stderr 首行以 `InvalidArgs: ` 开头；**不**创建 `x.json`。
- **判据**：
  ```js
  for (const args of [['policy','--dump','--write'], ['policy','--dump','--out','x.json'], ['policy','--dump','--apply']]) {
    const r = runCli(ROOT, args);                 // 只读子命令：flag 校验在写盘之前，直接在真仓库跑无副作用
    assert.equal(r.status, 2, args.join(' '));
    assert.match(r.stderr.split('\n')[0], /^InvalidArgs: /);
  }
  assert.equal(existsSync(join(ROOT, 'x.json')), false);
  ```
- **红绿证据**：红 = `policy` 不做 flag 校验（`--out` 被静默忽略 → 用户以为写了文件，或未来顺手实现写入）；绿 = exit 2。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：其它子命令的 flag 校验（既有测试已覆盖，见 `cli-gate.test.mjs`）。

### S6-TC-F05 dump 幂等：连跑两次 stdout 逐字相等

- **覆盖**：V-10 / §5
- **来源**：spec 推导
- **前置**：同 F01。
- **步骤**：连跑两次，比较 stdout 字节。
- **预期**：逐字相等（键序稳定：定义层顺序，不用 `JSON.stringify` 的哈希序）；无时间戳 / 无路径前缀差异。
- **判据**：
  ```js
  const a = runCli(ROOT,['policy','--dump']).stdout;
  const b = runCli(ROOT,['policy','--dump']).stdout;
  assert.equal(a, b);
  assert.equal(/20\d\d-\d\d-\d\dT/.test(a), false, 'dump 含时间戳 → 不可复算');
  ```
- **红绿证据**：红 = dump 附带 `generatedAt` 字段 → 两次不等，审计无法比对历史输出；绿 = 稳定。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：跨平台换行差异（`\n` 由 Node 统一，属平台既成事实，见 §5）。

### S6-TC-F06 dump 与 `renderBoundary` 同源：定义改一处两者同变

- **覆盖**：V-10 / §3.1 数据流
- **来源**：spec 推导
- **前置**：`withCopy` 副本。
- **步骤**：① 改前取 dump（`dumpPolicy(ROOT)`）与 render；② 副本内给 `check.local.verbs` 追加一条无害 verb（`node scripts/extra-check.mjs`）；③ 再取两者；④ 断言「dump 变 ⇔ render 变」且变化点一致。
- **预期**：两者都变且互相可推（dump 的 `commands` 与 `seats.expanded` 都能解释 render 的差异）；不得出现「dump 变了 render 没变」。
- **判据**：
  ```js
  const dumpBefore = JSON.stringify(dumpPolicy(ROOT).json);
  const renderBefore = renderBoundary('reviewer-audit');
  const after = withCopy((d) => {
    editInDir(d, 'tools/docgen/policy/definitions/commands.mjs',
      (s) => s.replace("'node scripts/skill-dir.mjs',",
        "'node scripts/skill-dir.mjs','node scripts/extra-check.mjs',"));
    return { dump: dumpPolicy(d).json, render: renderBoundaryIn(d, 'reviewer-audit') };
  });
  assert.notEqual(sha(JSON.stringify(after.dump)), sha(dumpBefore));
  assert.notEqual(sha(after.render), sha(renderBefore));
  assert.equal(after.dump.commands['check.local'].verbs.length,
    JSON.parse(dumpBefore).commands['check.local'].verbs.length + 1);
  assert.ok(after.render.includes('node scripts/extra-check.mjs'), 'render 未反映定义层变更');
  ```
- **红绿证据**：红 = dump 读的是另一份常量（例如自己维护的 JSON）→ 改定义层 dump 不变（审计按 dump 复核会漏）；绿 = 同变。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：dump 的 JSON schema 版本化。

### S6-TC-G01 `agents/` 差异必须可追（字节零变化是最好情况）

- **覆盖**：**V-2（辅助定位）** / §2 第 2 条 / §11.3 D4
- **来源**：spec 推导（`spec:297` D4：卡面**允许措辞改进**，字节相等是最好情况与定位线索；议会 #3 F1 / F6：原「零字节变化」与「至少一维更好」互斥，判据改为「差异可追」）
- **前置**：S6 全部施工完成、工作区仅含 S6 变更。
- **步骤**：① `git --no-optional-locks diff --stat -- agents/`；② `git --no-optional-locks status --porcelain -- agents/`（**含未跟踪**：只查 diff 会漏掉「新写一张卡」）；③ 汇总差异文件集；④ 若差异集非空 → 断言每个差异文件在 `capability-diff.md` 里都有一行说明。
- **预期**：无差异 = 最优（不判失败也不加分）；有差异 = 必须逐个记账——**差异不得静默**。
- **判据**：
  ```js
  const gitOut = (args) => spawnSync('git', ['--no-optional-locks', ...args], { cwd: ROOT, encoding: 'utf8' }).stdout;
  const diffStat = gitOut(['diff', '--stat', '--', 'agents/']);
  const status = gitOut(['status', '--porcelain', '--', 'agents/']);
  const touched = [...new Set(`${diffStat}\n${status}`.split('\n')
    .map((l) => l.match(/agents\/[\w.-]+\.md/)?.[0]).filter(Boolean))];
  if (touched.length > 0) {
    const base = join('docs', 'superpowers', 'reviews');
    const evalName = existsSync(base) ? readdirSync(base).find((x) => /-s6-eval$/.test(x)) : null;
    assert.ok(evalName, '有卡面差异但评估账单目录不存在 → 差异无处记账');
    const notes = readFileSync(join(base, evalName, 'capability-diff.md'), 'utf8');
    for (const f of touched) assert.ok(notes.includes(f), `${f} 有差异但 capability-diff.md 无说明行`);
  }
  ```
- **红绿证据**：红 = 顺手 `replace` 重生成卡却**不记录任何定位说明**（`notes` 里找不到该文件）→ 末条断言红；另一红 = 把「卡面字节变了」直接写成失败判据（v5 口径）→ 与 §2 第 2 条冲突（本条不会因有差异而红）；绿 = 无差异，或差异逐个记账。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：`rules/` 的零变化（S6 不生成规则；`check` 的 A 组另管）。

### S6-TC-G02 `gate` → `baseline N/N`，N 派生不写死

- **覆盖**：**V-10** / V-2
- **来源**：spec 推导
- **前置**：干净树。
- **步骤**：跑 `runCli(ROOT, ['gate'])`，用 `BASELINE_RULES.length + agentPaths().length` 派生 N 后匹配 stdout。
- **预期**：exit 0；stdout 恰一行 `baseline N/N`（N 由派生式给出，当前 37 只作说明）。
- **判据**：
  ```js
  const N = BASELINE_RULES.length + agentPaths().length;
  const r = runCli(ROOT, ['gate']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout.trim(), new RegExp(`^baseline ${N}/${N}$`));
  assert.equal(/37\/37/.test(readFileSync('tools/docgen/test/policy-pure-source.test.mjs','utf8')), false);
  ```
- **红绿证据**：红 = 测试里写死 `37/37`（加席当天必红，S5 E07 已踩过）；绿 = 派生。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：`npm run check` 全量（G02 只跑 gate；全量在命令层，见 §5 第 1 条）。

### S6-TC-G03 `DEFAULT_BOUNDARY` 的 12 席与 `evidence-reader` 边界句不变

> **2026-10-31 迁移改判（用户裁定方案 1；原文不删）**：`senior-sdet` 的职责是写 `testcase.md`，与评审席边界模板「你是评审席 / 只允许写本次评审账本 / 禁写『代码、测试』」结构不同构，S6 原本把它列为「走手写模板、不注入 boundary」的例外。迁移到新卡后必须由它自带专用边界句，否则会退回 `DEFAULT_BOUNDARY`（只读评审角色）而与职责自相矛盾（B3 fail）。故**计数口径改为**：自带边界 = 2 producer + `evidence-reader` + `senior-sdet` = **4**；`senior-sdet` 从「既非自带、也不渲默认的手写模板席」并入「自带」集合，**卡面渲 `DEFAULT_BOUNDARY` 的仍是 11 席**（15 − 4）；其专用句新增黄金键 `senior-sdet-boundary`。结构收敛（按席排除禁写组 + 模板去「评审席」化）归 S6-B，登记见 `docs/after/`。下方原判据保留为历史口径，**现行判据**见本节末块。

- **覆盖**：V-1 / §3.6 / §2「不做什么」3 / `agentData` 条目自带 `boundary` 的守卫（`spec:121`）
- **来源**：spec 推导（§3.6 已明确「本轮只收 2 席，其余 12 席继续用 `DEFAULT_BOUNDARY`，`evidence-reader` 保留自有句」；12 = 15 − 2 − 1 的派生见事实 5；黄金表 4 键见 §5；**`spec:121`：条目不得自带 `boundary`，该守卫沿用 S5 既有断言 `DECLARED_SLOT_SEATS`（`validateAgentData.mjs:118`，= `evidence-reader` ∪ `boundaryBySeat` 的席），本 spec 不新增守卫**）
- **前置**：S6 完成。
- **步骤**：① 派生「自带边界的席」= `Object.keys(boundaryBySeat)` + `'evidence-reader'`（= S5 的 `DECLARED_SLOT_SEATS` 同一集合），再单列手写模板席 `'senior-sdet'`；② 其余席断言 `boundary === DEFAULT_BOUNDARY`；③ **条目自带 `boundary` 只许 ∈ 该集合**（`senior-sdet` 不在其中 → 不得自带，它走 `agent-handwritten.md.tpl`、卡面无 `{{BOUNDARY}}` 槽）；④ `evidence-reader` 与 `DEFAULT_BOUNDARY` 的 sha256 == 黄金（4 键里的两项）。
- **预期**：**11 席**逐字等于 `DEFAULT_BOUNDARY`（12 席不接渲染层，减去走手写模板的 `senior-sdet`）；`evidence-reader` 与 `DEFAULT_BOUNDARY` 都未变；自带 `boundary` 的条目集合 ⊆ `DECLARED_SLOT_SEATS`（越界即红，守卫由 S5 既有断言承担、本条只做同口径复核）。
- **判据**：
  ```js
  const own = new Set([...Object.keys(patternRegistry.boundaryBySeat), 'evidence-reader']);
  const defSeats = agentData.filter((a) => !own.has(a.name) && a.name !== 'senior-sdet');
  assert.equal(own.size, 3, '自带边界 = 2 producer + evidence-reader');
  assert.equal(defSeats.length, 11, '卡面渲 DEFAULT_BOUNDARY 的应为 11 席（12 不接渲染层 − senior-sdet）');
  for (const a of defSeats) assert.equal(a.boundary ?? DEFAULT_BOUNDARY, DEFAULT_BOUNDARY, a.name);
  // ③ 条目自带 boundary 只许 ∈ DECLARED_SLOT_SEATS（S5 既有断言口径，spec:121；不新增守卫）
  assert.equal(agentData.filter((a) => Object.hasOwn(a, 'boundary') && !own.has(a.name)).length, 0,
    '条目自带 boundary 越出 DECLARED_SLOT_SEATS');
  assert.equal(Object.hasOwn(agentData.find((a) => a.name === 'senior-sdet'), 'boundary'), false,
    'senior-sdet 走手写模板，不注入 boundary');
  assert.equal(sha(DEFAULT_BOUNDARY), goldenOf('default-boundary'));
  assert.equal(sha(agentData.find((a) => a.name === 'evidence-reader').boundary), goldenOf('evidence-reader-boundary'));
  ```

**现行判据（2026-10-31 起，替代上方历史块）**：

  ```js
  const own = new Set([...Object.keys(patternRegistry.boundaryBySeat), 'evidence-reader']);
  const defSeats = agentData.filter((a) => !own.has(a.name));
  assert.equal(own.size, 4, '自带边界 = 2 producer + evidence-reader + senior-sdet');
  assert.equal(defSeats.length, 11, '卡面渲 DEFAULT_BOUNDARY 的应为 11 席（15 − 4 自带）');
  for (const a of defSeats) assert.equal(a.boundary ?? DEFAULT_BOUNDARY, DEFAULT_BOUNDARY, a.name);
  assert.equal(agentData.filter((a) => Object.hasOwn(a, 'boundary') && !own.has(a.name)).length, 0,
    '条目自带 boundary 越出 DECLARED_SLOT_SEATS');
  const sd = agentData.find((a) => a.name === 'senior-sdet');
  assert.equal(sd.boundary, patternRegistry.boundaryBySeat['senior-sdet']);
  assert.equal(sha(sd.boundary), goldenOf('senior-sdet-boundary'), '专用边界句黄金必须对位');
  ```

- **红绿证据**：红 = 为了让模板统一，把 `DEFAULT_BOUNDARY` 也改成模板渲染（11 席卡面全变，`gate` 全红）——这正是 §2「不做什么」4 的边界；另一红 = 把 `senior-sdet` 也塞 `boundary`（卡面有 `## 边界` 但渲染走手写模板 → 静默被 `...s` 覆盖或整段错位）→ ③ 段红；再一红 = 给某张 default 卡条目加 `boundary`（绕过 `renderBoundary` 静默换句）→ ③ 段的集合断言红（S5 `DECLARED_SLOT_SEATS` 同口径）；绿 = 11 席 + 两项黄金不变。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：`evidence-reader` 的边界语义是否足够（§10：结构不同构，本轮不收）。

### S6-TC-G04 `BOUNDARY_COMMAND` 已删；`:12` import / `S5-TC-B08` / `S5-TC-E05` / `S5-TC-B14` 四处同批改判

- **覆盖**：§3.6 / D2 / V-5
- **来源**：spec 推导（**v4 §3.6 已把波及面列到四处**：`tool-tiers.test.mjs:12` 的 import、`S5-TC-E05`、`S5-TC-B08`、`S5-TC-B14`，并给口径「判据与前置必须改判；历史叙述句保留不改」—— §10.1 第 7 条闭合）。本条的 `S5-TC-B14` 覆盖原先来自实测（spec v3 未列），现与 spec 一致。
- **前置**：S6 步骤 4 完成。
- **步骤**：① `import * as PR from patternRegistry`，断言无 `BOUNDARY_COMMAND` 导出；② 全仓（`tools/`、`agents/`、`skills/`）grep 该标识符 0 命中；③ 断言 `tool-tiers.test.mjs` 的 `B08` 已改为 `boundary === renderBoundary(name)`；④ 断言 S5 `E05` 已改为「`renderBoundary('reviewer-audit')` 非空」；⑤ S5 testcase 的 `B08` / `E05` / `B14` 三个条目段内不再以 `patternRegistry.BOUNDARY_COMMAND` 作判据或前置（文档其它段的历史叙述不计）。
- **预期**：①② 0 命中；③④ 断言形态都改；⑤ 三段内 0 命中。
- **判据**：
  ```js
  assert.equal(Object.hasOwn(patternRegistry, 'BOUNDARY_COMMAND'), false);
  // 无命中时 git 退出码是 1，**不得**因非 0 就抛错（议会 #3 F19 / AU-5）
  const grep = spawnSync('git', ['grep', '-l', 'BOUNDARY_COMMAND', '--', 'tools/', 'agents/', 'skills/'],
    { cwd: ROOT, encoding: 'utf8' });
  assert.ok([0, 1].includes(grep.status), `git grep 异常退出：${grep.status}\n${grep.stderr}`);
  assert.equal(grep.stdout.trim(), '', '全仓仍有 BOUNDARY_COMMAND');
  const tt = readFileSync('tools/docgen/test/tool-tiers.test.mjs', 'utf8');
  assert.match(tt, /boundary,\s*renderBoundary\(/);
  assert.equal(/BOUNDARY_COMMAND\s*===\s*'string'/.test(tt), false);
  // ⑤ 文档侧：只判三个用例条目段，历史叙述段不计
  const s5tc = readFileSync('docs/superpowers/specs/2026-10-25-s5-tool-tiers-design-testcase.md', 'utf8');
  const seg = (id) => { const i = s5tc.indexOf('### ' + id); return i < 0 ? '' : s5tc.slice(i, s5tc.indexOf('### ', i + 4)); };
  for (const id of ['S5-TC-B08','S5-TC-E05','S5-TC-B14'])
    assert.equal(seg(id).includes('BOUNDARY_COMMAND'), false, id);
  ```
- **红绿证据**：红 = 只删常量不改测试 → `node --test tool-tiers.test.mjs` 直接 import 失败（整文件 0 用例）；另一红 = 只改 B08/E05、漏 B14 → B14 的前置构造（`boundary = BOUNDARY_COMMAND`）引用已删常量，跑即 ReferenceError；绿 = 四处同批改。
- **对应测试**：改 `tool-tiers.test.mjs:12`、`:374`（B08）、`:721-723`（E05），S5 testcase 的 B08 / E05 / B14 + 新文件断言——待 plan Task N。
- **不覆盖**：删常量的值是否留在 git 历史（`git log -S` 属人工，见 §5）；S5 spec 正文里**描述历史事实**的句子（如 §11.3 差异表）按 v4 §3.6 口径**保留不改**（只有「判据 / 前置」类引用必须改判），故不在本条断言范围。

### S6-TC-G05 改定义层一条 → `gate` 红 → 改回绿

- **覆盖**：V-6 反向验证 / V-2
- **来源**：spec 推导
- **前置**：`withCopy` 副本。
- **步骤**：① 改 `paths.mjs` 里 `workspace` 组的 `'其他评审目录'` → `'其他评审目录X'`（该串必进卡面「逐项点名」段，不受渲染实现细节影响）；② 跑 `gate`；③ 改回；④ 再跑。
- **预期**：② exit 1（逐项点名段多一个字符 → 卡面变）；④ exit 0 + `baseline N/N`。
- **判据**：
  ```js
  withCopy((d) => {
    const edit = (from, to) => editInDir(d, 'tools/docgen/policy/definitions/paths.mjs',
      (s) => s.replace(from, to));
    edit("'其他评审目录'", "'其他评审目录X'");
    assert.equal(runCli(d, ['gate']).status, 1, '改数据后 gate 必须红（渲染没接上？）');
    edit("'其他评审目录X'", "'其他评审目录'");
    const ok = runCli(d, ['gate']);
    assert.equal(ok.status, 0, ok.stderr);
    assert.match(ok.stdout, /baseline \d+\/\d+/);
  });
  ```
- **红绿证据**：红 = 数据与卡面脱钩（改数据卡面不变 → 反向验证不成立，说明渲染没接上）；绿 = 红绿可控。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：红时报的是 `Mismatch` 还是 `RenderNotEquivalent`（D02 单独定：按 §7 分工报 `Mismatch`）。

### S6-TC-H01 基线同源可复算（`git show <改造前 commit>:agents/<席>.md` + `capability-baseline.json`）

- **覆盖**：**V-1 基线来源** / `spec:169` §6 步骤 0 ③④⑤（④ = 两端字典来源）
- **来源**：spec 推导（`spec:169` §6 步骤 0 ①–⑤：从**未改**的 commit 导出、抽取器不得 import `policy/`、基线必带 `sourceCommit`、**④ 基线端按旧卡文本切分（反引号 / 顿号 / 分号 / ` / ` 工具项）产出、改造后端按定义层成员字典匹配**、抽取规则写死 + 黄金样本、逃生路径；两条取数命令必须写进交付说明，不许手抄——议会 #3 F6 / F18）
- **前置**：施工步骤 0 完成；`tools/docgen/fixtures/capability-baseline.json` 已提交（**由基线端切分口径产出**——步骤 0 尚无定义层，`spec:169` ④）。
- **步骤**：① 读基线 JSON，断言含 `sourceCommit`（40 位十六进制）与两席键；② `git cat-file -e <sourceCommit>^{commit}` 成功；③ 用**抽取器真执行**（`runBaselineExtractor`：`runEsm` 导入 `test/support/capability-baseline.mjs` 的 `factsFromBaselineText`）对 `git show <sourceCommit>:agents/<席>.md` 的**旧卡文本按切分口径**复算，断言结果与已提交基线**逐字段相等**（基线不是手抄的；**不得只 grep 源码不执行**；此处**不注入定义层字典**——步骤 0 尚无定义层）；④ `sourceCommit !== HEAD`；`git diff --name-only <sourceCommit>..HEAD -- agents/` 的文件集**只许是两张 producer 卡**（`agents/reviewer-audit.md` / `agents/detective-observer.md`；第三张即越界 → 红），且**每个差异文件**在 `capability-diff.md` 里有说明行（按 basename 匹配）——**差异可追 + 越界可抓**（其余 12 席不接渲染层，`spec:117`）；⑤ 抽取器源码（剥注释后）不出现 `policy/`；⑥ `checklist.md` 的「交付说明」节含**两条取数命令原文**（`git show` + 基线导出命令）；⑦ 抽取规则有黄金样本：`fixtures/capability-baseline.golden.json` 必须等于**同一抽取器（`runBaselineExtractor` 真执行）**对**基线提交**的审计席卡的输出（8 字段）。
- **预期**：①–⑦ 全绿；`agents/` 的差异**只出现在两张 producer 卡**且逐个进 `capability-diff.md`（零差异是最好情况，但**不作判据**；越界到第三张卡才是红）；基线可脱离当前工作区复现（换机器 / 换分支都能重算）。
- **判据**：
  ```js
  const base = baseJson();
  assert.match(base.sourceCommit, /^[0-9a-f]{40}$/);
  assert.deepEqual(Object.keys(base.seats).sort(), ['detective-observer','reviewer-audit']);
  const git = (args) => spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  assert.equal(git(['cat-file', '-e', `${base.sourceCommit}^{commit}`]).status, 0);
  assert.notEqual(base.sourceCommit, git(['rev-parse', 'HEAD']).stdout.trim());
  // ④ 差异可追 + 越界可抓：只许两张 producer 卡有差异（其余 12 席不接渲染层，spec:117），且逐个进 capability-diff.md
  const changedCards = git(['diff', '--name-only', `${base.sourceCommit}..HEAD`, '--', 'agents/'])
    .stdout.split('\n').map((l) => l.trim()).filter(Boolean).map((p) => p.replace(/\\/g, '/'));
  const ALLOWED_CARDS = ['agents/reviewer-audit.md', 'agents/detective-observer.md'];
  for (const f of changedCards) {
    assert.ok(ALLOWED_CARDS.includes(f),
      `${f} 越界：只有两 producer 席卡允许相对基线有差异（其余 12 席不接渲染层，spec:117）`);
  }
  if (changedCards.length > 0) {
    const diffNotes = readFileSync(join(evalDir(), 'capability-diff.md'), 'utf8');
    for (const f of changedCards) {
      assert.ok(diffNotes.includes(basename(f)), `${f} 有差异但 capability-diff.md 无说明行（按 basename 匹配）`);
    }
  }
  for (const s of Object.keys(base.seats)) {
    const old = gitShow(base.sourceCommit, `agents/${s}.md`);
    // ③ 抽取器**真执行**（runEsm 导入并跑一遍），不是只 grep 源码；
    // 基线端 = 旧卡切分口径（**不传字典**：步骤 0 尚无定义层，`spec:169` ④）
    assert.deepEqual(runBaselineExtractor(ROOT, old), base.seats[s], `${s}: 基线不可由抽取器复算`);
  }
  // ⑤ 静态面：抽取器不得 import / 引用 policy/（否则基线随改造后数据抖动）
  const ex = stripComments(readFileSync('tools/docgen/test/support/capability-baseline.mjs', 'utf8'));
  assert.equal(/policy\//.test(ex), false, '基线抽取器不得依赖定义层');
  // ⑥ 两条取数命令原文必须出现在 checklist.md 的「交付说明」节
  const notes = readFileSync(join(evalDir(), 'checklist.md'), 'utf8');
  assert.ok(notes.includes(`git show ${base.sourceCommit}:agents/reviewer-audit.md`), '缺 A 组取数命令原文');
  assert.match(notes, /capability-baseline/, '缺基线导出命令原文');
  // ⑦ 抽取规则 + 黄金样本（同一抽取器真执行，独立复算，不由被测代码生成）
  const gold = JSON.parse(readFileSync('tools/docgen/fixtures/capability-baseline.golden.json', 'utf8'));
  assert.deepEqual(Object.keys(gold).sort(), [...FACTS_KEYS].sort(), '黄金样本必须 8 字段');
  assert.deepEqual(gold, runBaselineExtractor(ROOT, gitShow(base.sourceCommit, 'agents/reviewer-audit.md')),
    '黄金样本 ≠ 抽取器（基线端切分口径）对基线审计席的输出（抽取规则漂移）');
  ```
- **红绿证据**：红 = 基线手抄进 JSON（无 `sourceCommit`）→ ②③ 红；另一红 = 基线从 HEAD 导出 → ④ 红（`sourceCommit === HEAD`）；再一红 = **偷改第三张卡**（相对基线多改一张非 producer 卡）→ ④ 的越界断言红（`spec:117`：12 席不接渲染层，改它们说明有东西越界写卡）；再一红 = 两张 producer 卡有差异但 `capability-diff.md` 无对应说明行 → ④ 的记账断言红（差异静默 = 不可追）；再一红 = 抽取器 import `policy/definitions/*` → ⑤ 红（基线随改造后数据变，`diff` 恒空，见 H07）；再一红 = 实现里改用 `grep`/手写正则复算（不经抽取器）→ ③ 的 `runBaselineExtractor` 路径不成立（抽取规则未被执行，H07 ④ 的动态断言同时红）；再一红 = 基线端改成「注入定义层字典再抽旧卡」（违背 `spec:169` ④：步骤 0 尚无定义层，且基线会随改造后数据抖动）→ ③ 与提交基线不等；绿 = ①–⑦ 全绿（差异只在两卡且逐个记账，或无差异）。
- **对应测试**：`policy-pure-source.test.mjs`（新）——待 plan Task N。
- **不覆盖**：抽取器抽得「对不对」（由 H02 的空差 + **⑤'「基线成员 ⊆ 定义层字典」** + H03/H04/H05 的红共同兜：抽错必然让其中至少一条失败）；抽取器模块自身的单测（`runBaselineExtractor` 已覆盖「导入 + 执行」两件事）。

### S6-TC-H02 五段事实集合逐席 diff 空差

- **覆盖**：**V-1** / `spec:204` V-1 ①–④ / `spec:169` §6 步骤 0（④ = 两端字典来源）
- **来源**：spec 推导（`spec:204` V-1 ①–④ 做集合 diff、段 ⑤ 归 V-12；**改造后 = `factsFromText(renderBoundary(席), probeDict())`，dump 只作交叉核对**；**两端字典来源按 `spec:169` ④：基线端 = 旧卡切分（H01 ③）、改造后端 = 定义层成员存在性匹配**，两端可比前提 = ⑤'——议会 #3 F6 / QA-06：原「改造后端取 dump」使模板漏渲染测不出）
- **前置**：H01 绿（基线由**基线端切分**口径产出）；`policy --dump` 可用。
- **步骤**：① 取基线 `base.seats[席]`（**基线端口径 = 旧卡切分**，`spec:169` ④）；② 取**渲染端**事实 `factsFromText(renderBoundary(席), probeDict())`（V-1 口径：改造后取渲染文本 + **按定义层成员做存在性匹配**，`spec:204`）；③ `diffFacts` 求 `minus` / `plus`；④ 断言两者皆空；⑤ 断言比较的**键集**恰为 §0.4 的 `FACTS_KEYS` 8 个（①②③④ 四段），多键少键即红；⑤' **两端可比前提**（`spec:169` ④）：断言 ③ 段成员数 = **23**（含 `spec / plan`）、且**基线里每个成员都仍在定义层字典里**（`基线成员 ⊆ 字典`；不满足即红并人工复核——防「定义层少一项 → 字典同步少一项 → 差集恒空」，也防基线切分多抽出说明性文本）；⑥ 与 `factsFromDump` 做**交叉核对**（同形事实 + 同一字典：渲染端与 dump 端逐项相等；`mustNotWrite` 不在 12 槽 → 跳过）。
- **预期**：两席 `{minus: [], plus: []}`；键集恰 8 个字段；`forbiddenPaths` 恰 23 项且含 `spec / plan`；**基线成员全部 ⊆ 定义层字典**；渲染端与 dump 端在可比的 **7 个键**上逐项相等。
- **判据**：
  ```js
  const base = baseJson();
  const dict = probeDict();
  const { json } = dumpPolicy(ROOT);
  const norm = (v) => (Array.isArray(v) ? v : v == null ? [] : [v])   // `tier` 是字符串 → 先装箱成数组（后端复核第 2 轮 BE-5）
    .flatMap((x) => String(x).split('、')).map((x) => x.trim().replace(/^`|`$/g, '')).filter(Boolean);
  const POOL = { tools: dict.tools, tier: dict.tiers, canWrite: dict.artifacts, mustNotWrite: dict.artifacts,
    forbiddenPaths: dict.paths, allowCmds: dict.allowVerbs, denyCmds: dict.denyVerbs, envForms: dict.envVerbs };
  for (const s of ['reviewer-audit','detective-observer']) {
    const before = base.seats[s];
    const after = factsFromText(renderBoundary(s), dict);      // 判据端 = 渲染文本 + 定义层字典（不是 dump）
    assert.deepEqual(Object.keys(before).sort(), [...FACTS_KEYS].sort(), `${s}: 基线五段键集不全`);
    assert.deepEqual(Object.keys(after).sort(), [...FACTS_KEYS].sort(), `${s}: 改造后五段键集不全`);
    assert.deepEqual(diffFacts(before, after), { minus: [], plus: [] }, s);
    // ⑤' ③ 段成员数 = 23（不是 22）：`spec / plan` 必须能被取到
    assert.equal(after.forbiddenPaths.length, 23, `${s}: ③ 段成员数应为 23（含 spec / plan）`);
    assert.ok(after.forbiddenPaths.includes('spec / plan'), `${s}: factsFromText 必须取到 spec / plan`);
    // ⑤' 两端可比前提（spec:169 ④）：基线成员 ⊆ 定义层字典
    // 基线端是「旧卡切分」、改造后端是「字典匹配」——切分只要多抽出一条说明性文本，这里就红并人工复核；
    // 定义层只要少一项，这里同样红（否则字典同步缩水 → 差集恒空，H07）
    for (const k of FACTS_KEYS) {
      for (const m of norm(before[k])) assert.ok(POOL[k].includes(m), `${s}: 基线成员 ${k}:${m} 不在定义层字典里（基线切分口径错 或 定义层丢项 → 判据将恒真）`);
    }
    // ⑥ 交叉核对：dump 端同形事实 + 同一字典，逐项相等（`denyCmds` 已剔除 env.assign → 与 dump 槽同口径，可直比）
    const viaDump = factsFromDump(json, s, dict);
    for (const k of FACTS_KEYS.filter((x) => x !== 'mustNotWrite')) {
      assert.deepEqual([...new Set(norm(viaDump[k]))].sort(), [...new Set(norm(after[k]))].sort(), `${s}: ${k} 渲染端 ≠ dump 端`);
    }
  }
  ```
- **红绿证据**：红 = 模板漏渲染环境变量形态段（5 条 `env.assign` 形态整段消失）→ `minus` 非空；另一红 = 只比 `forbiddenPaths` 一段就宣布空差 → ⑤ 键集断言红；再一红 = 槽 10 只展开 `pathGroups`（漏 `spec / plan`）→ `after.forbiddenPaths.length` = 22 → ⑤' 红；再一红 = 定义层删掉一条路径（字典同步缩水）→ ⑤' 的「基线成员 ⊆ 字典」红（不是静默空差）；再一红 = **基线端切分口径写错**（把 ② 段里的 `skills/dev-workflow/references/gate-record.md` 当产物、或把 `DOCGEN_*` 收进成员）→ ⑤' 红并人工复核（这正是 `spec:169` ④ 把「两端可比前提」写成断言的原因）；再一红 = 模板把路径清单改成 `join(', ')` → `forbiddenPaths` 渲染端 ≠ dump 端（⑥ 段红）；绿 = 空差 + 23 项。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：段 ⑤ 关键子句（J 组）；「改后是否更精准」（K 组盲评）。

### S6-TC-H03 负例：少一项路径 → diff 出现 `-` → 必红

- **覆盖**：**V-1** 负例（能力丢失）/ `spec:204` V-1③
- **来源**：spec 推导（§2 第 1 条「谁挂哪档、能跑哪些命令、能写哪些文件，一条不变」的反向：少一条即「功能丢了」）
- **前置**：`withCopy` 副本；基线与 dump 可取。
- **步骤**：① 副本内从 `paths.mjs` 的 `workspace` 组删 `'其他评审目录'`；② 副本内取渲染端事实（`factsFromText(renderBoundaryIn(副本目录, 'reviewer-audit'), probeDict(副本目录))`——字典必须按**副本**现算，否则删掉的那项不在字典里、`minus` 恒空）；③ 与基线 diff。
- **预期**：`plus` 空、`minus` 恰 1 项且落在 `forbiddenPaths` 段；判定 `fail`。
- **判据**：
  ```js
  const d = withCopy((dir) => {
    editInDir(dir, 'tools/docgen/policy/definitions/paths.mjs', (s) => s.replace("'其他评审目录',", ''));
    return diffFacts(baseJson().seats['reviewer-audit'],
      factsFromText(renderBoundaryIn(dir, 'reviewer-audit'), probeDict(dir)));
  });
  assert.deepEqual(d.plus, []);
  assert.equal(d.minus.length, 1);
  assert.match(d.minus[0], /^forbiddenPaths: /);
  assert.equal(verdict(d), 'fail');
  ```
- **红绿证据**：红 = 判定只看「多出来的」（只读 `plus`）→ 丢能力被放过，本用例 `assert.notEqual(verdict(d),'pass')` 直接红；绿 = 删一项即 `-`。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：卡面措辞是否变化（V-2 辅助，不作判据）。

### S6-TC-H04 负例：删一条允许命令 → `-` → 必红

- **覆盖**：**V-1** 负例（能力丢失，命令侧）/ `spec:204` V-1④
- **来源**：spec 推导（V-1 段 ④「允许命令集（14 条）」；少一条 = 该席少一种可用手段）
- **前置**：同 H03。
- **步骤**：① 副本内从 `check.local.verbs` 删 `node scripts/skill-dir.mjs`（该组 5 → 4）；② 取渲染端事实；③ 与基线 diff。
- **预期**：`minus` 恰 1 项且落 `allowCmds`；改造后允许命令数 = 基线 − 1；判定 `fail`。
- **判据**：
  ```js
  const before = baseJson().seats['reviewer-audit'].allowCmds.length;
  const after = withCopy((dir) => {
    editInDir(dir, 'tools/docgen/policy/definitions/commands.mjs',
      (s) => s.replace(/\s*'node scripts\/skill-dir\.mjs',/, ''));
    return factsFromText(renderBoundaryIn(dir, 'reviewer-audit'), probeDict(dir));
  });
  const d = diffFacts(baseJson().seats['reviewer-audit'], after);
  assert.equal(after.allowCmds.length, before - 1);
  assert.deepEqual(d.minus.map((x) => x.replace(/^allowCmds: /, '')), ['node scripts/skill-dir.mjs']);
  assert.equal(verdict(d), 'fail');
  ```
- **红绿证据**：红 = 命令集从 dump 另算（例如只算组 ID 不算 verbs）→ 删一条 verb 时 `minus` 为空（漏检），本条红；绿 = 逐 verb 比对。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：命令在平台是否真能跑（§10 第 1 条）。

### S6-TC-H05 越权负例：多一项（路径 / 命令 / 组）→ `+` → 必红

- **覆盖**：**V-1** 越权侧负例 / §2 第 1 条「一条不变」/ `spec:204` V-1 ①②④
- **来源**：spec 推导（「不得新增越权能力」——多一项允许 = 权限扩张；diff 的 `+` 就是这一形态）
- **前置**：同 H03（三个独立副本）。
- **步骤**：三个独立断言点，逐项各一次（第三项只改配置层一处，且**度量席 = 该项自己那一席**）：① `paths.workspace` 加 `'vendor/'`（度量 `reviewer-audit`）；② `check.local.verbs` 加 `node scripts/extra.mjs`（度量 `reviewer-audit`）；③ 给 `senior-sdet` 多挂一个**已登记**允许组 `docgen.read`（度量 **`senior-sdet`**——它的基线取真仓库未改动的渲染；若仍度量 `reviewer-audit`，它本就持有该组 → `plus` 恒 0，判据失效）。
- **预期**：每次 `minus` 空；`plus` 项数 = 该项实际新增的能力条数（①1 / ②1 / ③`docgen.read.verbs.length`）；判定 `fail`。另：**挂载但未登记**（只 `grantGroup` 不登记席级组）→ `policy --dump` 必须直接红，不得静默放行。
- **判据**：
  ```js
  // 每项按**自己那一席**取基线（两 producer 席有基线 JSON；senior-sdet 用真仓库未改动的渲染现算）
  const beforeOf = (seat) => (baseJson().seats[seat] ?? factsFromText(renderBoundary(seat), probeDict()));
  const CASES = [
    ['paths', 'reviewer-audit', (d) => editInDir(d, 'tools/docgen/policy/definitions/paths.mjs',
      (s) => s.replace("'其他评审目录',", "'其他评审目录','vendor/',")), 1],
    ['cmds', 'reviewer-audit', (d) => editInDir(d, 'tools/docgen/policy/definitions/commands.mjs',
      (s) => s.replace("'node scripts/skill-dir.mjs',", "'node scripts/skill-dir.mjs','node scripts/extra.mjs',")), 1],
    ['group', 'senior-sdet', (d) => grantGroup(d, 'senior-sdet', 'docgen.read'), CMD.commandGroups['docgen.read'].verbs.length],
  ];
  for (const [name, seat, edit, expectPlus] of CASES) {
    const diff = withCopy((d) => {
      edit(d);
      dumpPolicy(d);                       // 先断 dump 成功（议会 #3 F19 / QA-15）
      return diffFacts(beforeOf(seat), factsFromText(renderBoundaryIn(d, seat), probeDict(d)));
    });
    assert.deepEqual(diff.minus, [], name);
    assert.equal(diff.plus.length, expectPlus, `${name}: 越权新增未被捕获`);
    assert.equal(verdict(diff), 'fail');
  }
  // 负例：只挂载不登记 → dump 直接红（UnknownPolicyRef），不允许静默放行
  const unmounted = withCopy((d) => {
    grantGroup(d, 'senior-sdet', 'seat:senior-sdet.extra');
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(unmounted.status, 1);
  assert.equal(unmounted.stderr.split('\n')[0], 'UnknownPolicyRef: senior-sdet:group=seat:senior-sdet.extra');
  ```
- **红绿证据**：红 = 只判 `minus`（只查「丢没丢」）→ 越权新增全放过（多一条允许命令 = 权限扩张，卡面照样能渲染，`gate` 不会报）；另一红 = 第三项仍拿 `reviewer-audit` 当度量席（它本就持有 `docgen.read`）→ `plus` 恒 0、断言 `expectPlus` 红；绿 = `+` 逐项必红。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：越权后语义是否危险（§10 第 2 条，语义判断）。

### S6-TC-H06 V-2 降级判定表：哈希红 ≠ 不通过，哈希绿 ≠ 通过

- **覆盖**：**V-2（辅助定位）** / `spec:205` V-2 / §2 第 2 条 / `spec:204` V-1
- **来源**：spec 推导（v7 §8 V-2「**不作为通过/不通过判据**」+ §2.2「不以文本一模一样为验收」；口径源 = 用户「不是要一模一样，而是有的功能不能丢」）
- **前置**：H02 的 `diffFacts` 与 C01/C02 的哈希两路结果都可得。
- **步骤**：构造 2×2 判定表，断言结论**只由 diff 决定**：① diff 空 + 哈希相等 → pass；② diff 空 + 哈希不等 → **pass**（哈希只作定位线索，须记进 `capability-diff.md`）；③ diff 非空 + 哈希相等 → **fail**；④ diff 非空 + 哈希不等 → fail。⑤ 账单侧：`capability-diff.md` 不得出现「哈希相等 → 通过」这类取值。
- **预期**：②③ 是本条的两个关键点——「措辞变了但能力没丢」不得判失败；「哈希绿救不了能力丢」。
- **判据**：
  ```js
  // verdict（§0.4）形参里根本没有哈希 → 结构上保证它不参与判定
  assert.equal(verdict({ minus: [], plus: [], hashEqual: true }), 'pass');
  assert.equal(verdict({ minus: [], plus: [], hashEqual: false }), 'pass');   // v7：哈希红 ≠ 不通过
  assert.equal(verdict({ minus: ['forbiddenPaths: x'], plus: [], hashEqual: true }), 'fail');  // v7：哈希绿 ≠ 通过
  assert.equal(verdict({ minus: [], plus: ['allowCmds: y'], hashEqual: false }), 'fail');
  assert.equal(verdict.length, 1);   // 只有一个入参（对象），不接受第二个「哈希」参数
  const cd = readFileSync(join(evalDir(),'capability-diff.md'),'utf8');
  assert.equal(/哈希\s*(相等|一致)\s*(→|=|：)\s*(通过|pass)/.test(cd), false, '账单把哈希当通过判据');
  ```
- **红绿证据**：红 = 沿用 v5 口径「逐字节相等才算过」→ ② 判 fail，模板一重排措辞就永远过不了（与 §2.2 冲突）；另一红 = 只看哈希相等就宣布通过 → ③ 判 pass，丢一项能力被掩盖。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：`gate` 的「盘上 ≠ 渲染」判定（D02 管）；`RenderNotEquivalent` 施工期断言是否触发（D01）。

### S6-TC-H07 恒真守卫：基线不得取自改造后（或与定义层同源）

- **覆盖**：**V-1** 判据恒真防护 / `spec:169` §6 步骤 0 ②③④（④ = 基线端 = 旧卡切分、不注入字典）
- **来源**：实现观察（补充）+ spec 推导（「空差」若两端同源则**恒真**——这是 V-1 最大的判据失效风险：绿了也说明不了任何事；议会 #3 F6 / H07）
- **前置**：基线已提交；`withCopy` 副本（只改 JSON，不碰 git 对象）。
- **步骤**：① 断言基线 `sourceCommit` 上**不存在** `tools/docgen/policy` 与 `components/renderBoundary.mjs`（改造前的客观标志），而 HEAD 上两者都存在；② 副本内把 `sourceCommit` 改成 HEAD → 同源检查必须红；③ 断言抽取器源码不含 `tools/docgen/policy` 路径串（防「换个写法读定义层」）；④ **动态断言**：用 `runBaselineExtractor` 真跑一遍抽取器（**基线端切分口径、不传入任何字典**，`spec:169` ④），返回 8 字段且 ③ 段 23 项（静态 grep 通过但模块根本没跑 → 抽取规则未验证）。
- **预期**：①② 各自给出明确红点；③ 0 命中；④ 返回 8 字段、`forbiddenPaths` = 23。
- **判据**：
  ```js
  const base = baseJson();
  const has = (rev, p) => spawnSync('git', ['cat-file', '-e', `${rev}:${p}`], { cwd: ROOT, stdio: 'ignore' }).status === 0;
  assert.equal(has(base.sourceCommit, 'tools/docgen/policy'), false, '基线 commit 必须早于 policy/ 出现');
  assert.equal(has(base.sourceCommit, 'tools/docgen/components/renderBoundary.mjs'), false);
  assert.equal(has('HEAD', 'tools/docgen/policy'), true);
  // ② 副本内把 sourceCommit 改成 HEAD 后，同源检查必须报红
  const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim();
  assert.throws(() => withCopy((d) => {
    editInDir(d, 'tools/docgen/fixtures/capability-baseline.json',
      (s) => s.replace(/"sourceCommit"\s*:\s*"[0-9a-f]{40}"/, `"sourceCommit": "${head}"`));
    assertBaselinePrior(JSON.parse(readFileSync(join(d, 'tools/docgen/fixtures/capability-baseline.json'), 'utf8')));
  }), '基线改成 HEAD 仍通过 → 判据恒真');
  // ③ 抽取器不得读定义层
  assert.equal(/tools\/docgen\/policy/.test(stripComments(readFileSync('tools/docgen/test/support/capability-baseline.mjs', 'utf8'))), false);
  // ④ 动态断言：抽取器**确实被执行过**（静态 grep 通过 ≠ 抽取规则被验证）；
  // 基线端 = 旧卡切分口径（不传字典，`spec:169` ④）
  const live = runBaselineExtractor(ROOT, gitShow(base.sourceCommit, 'agents/reviewer-audit.md'));
  assert.deepEqual(Object.keys(live).sort(), [...FACTS_KEYS].sort(), '抽取器未被执行或返回形状不全');
  assert.equal(live.forbiddenPaths.length, 23, '抽取器执行了但没抽出 23 项路径（抽取规则错）');
  ```
- **红绿证据**：红 = 基线从改造后 HEAD 导出（施工顺手的写法）→ ① 红，且 diff 恒空（每一轮都「通过」，判据归零）；另一红 = 抽取器改为读 `policy/` 定义层 → ③ 红；另一红 = 抽取器模块根本没跑起来（语法错 / 导出名漂移，如把 `factsFromBaselineText` 改名）→ ④ 的 `runBaselineExtractor` 直接抛（H01 ③ 也红——「只 grep 源码」通过不了这条）；另一红 = 基线端改成字典匹配口径（注入 `probeDict()`）→ 基线随改造后数据抖动，③ 与提交基线不等、H02 ⑤' 也不再成立；绿 = ①②③④ 全绿。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：基线是否覆盖了全部五段（H02 ⑤ / ⑤' 的键集与子集断言兜）。

### S6-TC-I01 允许集逐项下探：14 命令 / 可写产物 / 6 tools「用不被拦」

- **覆盖**：**V-11** 允许侧 / `spec:214` V-11 / 议会 #3 F18
- **来源**：spec 推导（v7 V-11「允许集逐项构造一次『使用 → 不被拦』；任一项缺探针 = 该能力未验证」）。**口径说明**：spec §10 第 1 条已裁定「平台无参数级授权位」，故「不被拦」= **判据层**（配置校验 + 渲染可指涉），不是运行时拦截——若 spec 未点明该层，见 §10.4 第 3 条
- **前置**：`policy --dump` 可用；`SEAT_POLICY` 已落。
- **步骤**：① 构造探针列表（列表驱动）：允许组 verbs（逐条，现算）+ 各席可写产物（逐项）+ 6 个工具（逐个，**按 capability 选席**：`read` / `write` → `senior-sdet`、`exec` → `reviewer-audit`）；② 每条探针在**独立副本**里构造「该席合法使用该项」的最小改动（命令：把该 verb 所在组挂给探针席；产物：加进该席 `artifacts`；工具：给该席加含该工具的 capability）；③ 断言 dump exit 0（不判红）且该席渲染文本**包含该项**（可指涉）；④ 条数由定义层现算，不写死 14。
- **预期**：每项独立绿；总数 = 允许 verbs + 可写产物数 + tools 数（现算）。`RunCommand` 必须挂 `reviewer-audit`——`senior-sdet` 是 `sdet` 档（无 `exec`），挂它会撞不变量 9 必红。
- **判据**：
  ```js
  const allowVerbs = Object.entries(CMD.commandGroups).flatMap(([group, g]) =>
    g.verbs.map((v) => ({ kind: 'cmd', id: v, group, seat: PROBE_SEAT })));
  const writable = Object.entries(SEAT_POLICY).filter(([s]) => s !== '__default__')
    .flatMap(([s, p]) => p.artifacts.map((a) => ({ kind: 'artifact', id: a, seat: s })));
  const tools = Object.entries(CAP.capabilities)
    .flatMap(([cap, list]) => list.map((t) => ({ kind: 'tool', id: t, cap, seat: probeSeatOf(cap) })));
  const probes = [...allowVerbs, ...writable, ...tools];
  // 恒真式（三部分相加 = 总数）不提供判别力 → 改结构断言：每项 kind/id/seat 齐，且键（含席名）不重名
  for (const p of probes) {
    assert.ok(['cmd', 'artifact', 'tool'].includes(p.kind), `探针缺 kind：${JSON.stringify(p)}`);
    assert.ok(String(p.id ?? '').length > 0, `探针缺 id：${JSON.stringify(p)}`);
    assert.ok(String(p.seat ?? '').length > 0, `探针缺 seat：${p.kind}:${p.id}`);
  }
  assert.equal(new Set(probes.map((p) => `${p.kind}:${p.id}@${p.seat}`)).size, probes.length, '允许侧探针键重名（会互相覆盖计数）');
  for (const p of probes) {
    noteProbe(p);
    withCopy((d) => {
      applyLegalGrant(d, p);
      const r = runCli(d, ['policy', '--dump']);
      assert.equal(r.status, 0, `允许项被判红：${p.kind}:${p.id}@${p.seat}\n${r.stderr}`);
      assert.ok(renderBoundaryIn(d, p.seat).includes(p.id), `允许项在卡面不可指涉：${p.kind}:${p.id}@${p.seat}`);
    });
  }
  ```
- **红绿证据**：红 = 允许项被误判成违规（例如把 `--no-optional-locks` 当 `--flag` 拦掉，或把产物名当路径拦掉）→ 该项 `status !== 0`；另一红 = tool 探针漏 `seat` → `renderBoundaryIn(d, undefined)` 抛错（议会 #3 F19 / QA-12）；另一红 = 统一 `PROBE_SEAT = 'senior-sdet'` 挂 `RunCommand` → `senior-sdet` 档从 `sdet` 变 `producer`，与 `tierBySeat` 不一致 → 不变量 9（`UnknownPolicyRef`）红（后端复核第 2 轮 BE-6，这就是探针席要按 capability 选的原因）；另一红 = 只探 3 条命令（抽样）→ I03 计数红。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：平台运行时是否真放行（§10 第 1 条，既成事实）；`__default__` 的允许集（它无产物无组，B12 兜）。

### S6-TC-I02 禁止集逐项下探：禁止命令 / 23 路径 / 5 禁止组「用必被拦」

- **覆盖**：**V-11** 禁止侧 / `spec:214` V-11 / §3.5 不变量8（`seatGroups` 内禁止 verb → `:verb`）/ 议会 #3 F7
- **来源**：spec 推导（v7 V-11）；禁止命令**条数由定义层现算、不写死 22**（事实 14：spec 的「22 条」与本文件 §0.2 枚举不符 → §10.4 第 2 条）
- **前置**：同 I01。
- **步骤**：① 取禁用 verbs（5 个禁止组逐条，现算；含 `network` 的 **3 个字面 verb** `安装` / `网络写` / `node -e`，**不含**只在 `purpose` 的 `下载类命令`，`spec:54`）+ `pathTokens()` 逐项（23 项）+ 5 个禁止组 ID；② 每条探针在独立副本内构造一次「使用」：verb / 路径 → 作为 `allowGroups` 字面量塞进配置；禁止组 → 授予给审计席；③ 每项断言 `status === 1`，且**期望码由形态谓词现算**（合法 ID 形态 → `UnknownPolicyRef`，否则 `LiteralInConfig`）；禁止组一律 `ForbiddenGroupGranted:…:forbidden`；④ 另补 `seatGroups` 内的禁止 verb 探针 → `:verb`。
- **预期**：每项都判红且归码对位；条数由定义层现算，零抽样。
- **判据**：
  ```js
  const denyVerbs = Object.values(CMD.forbiddenGroups).flatMap((g) => g.verbs);
  const denyGroups = Object.keys(CMD.forbiddenGroups);
  const probes = [
    ...denyVerbs.map((v) => ({ kind: 'deny-verb', id: v, seat: PROBE_SEAT })),
    ...pathTokens().map((p) => ({ kind: 'path', id: p, seat: PROBE_SEAT })),
    // 禁止组必须授予**已登记的 producer 席**（`senior-sdet` 无 exec、无组，授予禁止组也报 `:forbidden`，
    // 但用审计席更贴近真实越权形态；席名进键，I03 才能逐项对位）
    ...denyGroups.map((g) => ({ kind: 'deny-group', id: g, seat: 'reviewer-audit' })),
  ];
  for (const p of probes) {
    noteProbe(p);
    if (p.kind === 'deny-group') {
      const r = withCopy((d) => { grantGroup(d, p.seat, p.id); return runCli(d, ['policy', '--dump']); });
      assert.equal(r.status, 1, `${p.kind}:${p.id}@${p.seat}`);
      assert.equal(r.stderr.split('\n')[0], `ForbiddenGroupGranted: ${p.seat}:${p.id}:forbidden`);
    } else {
      const r = withCopy((d) => { grantGroup(d, p.seat, p.id); return runCli(d, ['policy', '--dump']); });
      assert.equal(r.status, 1, `${p.kind}:${p.id}@${p.seat}`);
      const code = expectedRefCode(p.id);   // 形态谓词现算（议会 #3 F7）
      assert.ok(r.stderr.split('\n')[0].startsWith(`${code}: `),
        `${p.id} 的期望码应为 ${code}，实得 ${r.stderr.split('\n')[0]}`);
    }
  }
  // ④ 席级组内的禁止 verb → :verb（不变量 8）
  const seatGroupVerb = withCopy((d) => {
    insertInObject(d, 'tools/docgen/policy/definitions/commands.mjs', 'export const seatGroups',
      "'seat:senior-sdet.extra': { purpose: '测试构造', verbs: ['git commit'] },");
    grantGroup(d, 'senior-sdet', 'seat:senior-sdet.extra');
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(seatGroupVerb.status, 1);
  assert.match(seatGroupVerb.stderr.split('\n')[0], /^ForbiddenGroupGranted: senior-sdet:seat:senior-sdet\.extra:verb$/);
  ```
- **红绿证据**：红 = 对全部禁止 verb 一律断 `LiteralInConfig`（`commit` / `draft` / `replace` 等 9 个 ID 形态 verb 实际应 `UnknownPolicyRef`）→ 这些项直接红（议会 #3 F7）；另一红 = 只测 `docgen.write` 一组（B09）而其余四组无探针 → 本用例红（每组独立断言）；另一红 = 路径只测 3 条 → I03 计数红。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：平台运行时是否真拦住（§10 第 1 条）；模板侧的路径探针（C03 已覆盖，不重复）。

### S6-TC-I03 探针完备性：键集逐项相等、每项各执行一次、禁止抽样

- **覆盖**：**V-11** 完备性 / §8 V-11「任一项缺探针 = 该能力未验证」
- **来源**：spec 推导 + 实现观察（补充：「逐项」最常被实现成 `slice(0, 3)` 抽样）
- **前置**：I01 / I02 的探针表可取。
- **步骤**：① 生成「应有探针」集合 = 允许（允许 verbs + 可写产物 + tools）∪ 禁止（禁止 verbs + `pathTokens()` + 5 组），每项带**席名**（`exec` → `reviewer-audit`、其余 → `senior-sdet`）；② 断言探针表键集与应有集合**逐项相等**（不是包含），且键为 `kind:id@seat`（**唯一**：同 id 不同 kind / 不同席不得互相覆盖）；③ 断言每项**恰执行 1 次**（I01 / I02 用 `noteProbe` 打点）；④ 负例：从应有集合删一项 → 键集不等必红；⑤ 反抽样静态守卫：探针表不得出现 `.slice(` / `.filter(` 截断。
- **预期**：③ 每项 = 1；④ 删一项即不等；⑤ 0 命中。
- **判据**：
  ```js
  const expected = new Set([
    ...Object.values(CMD.commandGroups).flatMap((g) => g.verbs).map((v) => `cmd:${v}@${PROBE_SEAT}`),
    ...Object.entries(SEAT_POLICY).filter(([s]) => s !== '__default__')
      .flatMap(([s, p]) => p.artifacts.map((a) => `artifact:${a}@${s}`)),
    ...Object.entries(CAP.capabilities).flatMap(([cap, list]) => list.map((t) => `tool:${t}@${probeSeatOf(cap)}`)),
    ...Object.values(CMD.forbiddenGroups).flatMap((g) => g.verbs).map((v) => `deny-verb:${v}@${PROBE_SEAT}`),
    ...pathTokens().map((p) => `path:${p}@${PROBE_SEAT}`),
    ...Object.keys(CMD.forbiddenGroups).map((g) => `deny-group:${g}@reviewer-audit`),
  ]);
  assert.deepEqual([...probesRun.keys()].sort(), [...expected].sort(), '探针表与应有集合不一致（漏项 / 多项）');
  for (const [k, n] of probesRun) assert.equal(n, 1, `探针未执行或重复：${k}`);
  // ② kind:id 唯一：同 id 在不同 kind 下各算一项，不得被覆盖
  assert.equal(new Set([...probesRun.keys()]).size, probesRun.size);
  // ④ 删一项 → 键集必不等（负例）
  const dropped = new Set([...expected].slice(1));
  assert.notDeepEqual([...dropped].sort(), [...probesRun.keys()].sort(), '删项后键集仍相等 → 判据恒真');
  // ⑤ 反抽样静态守卫
  const src = stripComments(readFileSync('tools/docgen/test/policy-pure-source.test.mjs', 'utf8'));
  assert.equal(/allowItems\.slice\(|denyItems\.slice\(|probes\.filter\(/.test(src), false, '禁止抽样：探针表不得截断');
  ```
- **红绿证据**：红 = `for (const p of pathTokens().slice(0, 3))` → ① 键集少 20 项且 ⑤ 静态红；另一红 = 记账键与断言键不同构（`noteProbe` 记 `kind:id`、`expected` 写 `kind:id@seat`）→ ③ 段键集恒不等（这正是后端复核第 2 轮 BE-6 要求键带席名的原因：`exec` 探针挂 `reviewer-audit`、其余挂 `senior-sdet`，席名必须进键才能与 I01 的 `noteProbe` 对位）；绿 = 全量逐项、每项 1 次。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：探针构造是否有语义意义（I02 已按 §7 码对位）。

### S6-TC-J01 关键子句存在性（V-12 正例：不要求整段相等）

- **覆盖**：**V-12** / `spec:215` V-12 / 议会 #3 F24
- **来源**：spec 推导（`spec:215` 逐条必含：越权四要素 / 用户执行复原 / 本轮结论作废 / 检测限度点名 `.session/` / 检测命令带 `--no-optional-locks` / **审计「核转录」与侦探「本席不核签」两句职责**；v7 起散文段判「子句存在性」而非整段相等）
- **前置**：两席可渲染。
- **步骤**：**先 `seg5(text)` 切出 ⑤ 段**（防 ②/④ 段的同名措辞串味），再逐条独立断言：⑤ 段 **8 个通用子句**（`scope:'seg5'`，V-12 的「⑤ 段」只约束这 8 条）+ **两句席职责**（`scope:'card'` = **卡级子句**，在整张卡上判「职责句在位」，不参与 ⑤ 段切片；⑨ 审计「核转录」、⑩ 侦探「本席不核签」——现文写在 ② 段，属正常），共 10 个断言点。
- **预期**：两席各自断言点全绿；**不**要求整段文本相等（措辞可重排，见 J03）；⑨⑩ 被移到 ②/④ 段**不算违约**（卡级子句只要求「在该席卡面出现」）。
- **判据**：
  ```js
  for (const seat of ['reviewer-audit','detective-observer']) {
    const out = renderBoundary(seat);
    const seg = assertNeedClauses(out, seat);              // 内部先 seg5() 再逐条断言
    assert.match(seg, /^越[界权]后果与限度/, `${seat}: ⑤ 段切点不对（现文与 spec §3.4 均写「越界后果与限度」；两写法都认以兼容 S5 spec §3.3 的历史原句）`);
  }
  // ⑨⑩ = **卡级**子句（scope:'card'），**不属于 ⑤ 段存在性**：现文在 ② 段，故 V-12 的「⑤ 段」口径只覆盖 ①–⑧
  assert.equal(CLAUSES.filter((c) => c.scope === 'seg5').length, 8, '⑤ 段通用子句应为 8 条（V-12 的⑤段口径只覆盖这 8 条）');
  assert.equal(CLAUSES.filter((c) => c.scope === 'card').length, 2, '⑨⑩ = 卡级席职责 2 条（不属 ⑤ 段，不得按 seg5 判）');
  assert.equal(CLAUSES.filter((c) => c.seat && c.scope !== 'card').length, 0, '凡带 seat 的子句必须是卡级（席职责不是 ⑤ 段通用要素）');
  ```
- **红绿证据**：红 = 模板把越权清单写成「视情况处理」（四要素全丢但仍能渲染，V-1 diff 也看不出来——这正是 V-12 存在的理由）；另一红 = 不切段、直接在整段文本上跑正则 → ②/④ 段的同名措辞会让「删 ⑤ 段的句子」仍绿（议会 #3 F24）；再一红 = 把 ⑨⑩ 标成 `scope:'seg5'` → 现文它们在 ② 段，两条计数断言（seg5 = 8 / card = 2）先红（否则「⑤ 段」口径会多担两条它不该担的子句，且移段仍绿被误读成违约）；绿 = 8 + 2 共 10 点齐。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：子句是否「够严」（§10 第 2 条，语义判断归议会 + 审计人读）。

### S6-TC-J02 负例：8 类子句各删一处 → 各红一次

- **覆盖**：**V-12** 负例 / §8 V-12
- **来源**：spec 推导（判据不得恒真：要素齐是常态，必须证明「缺了就红」）
- **前置**：`withRepoCopy` 副本；模板已落。
- **步骤**：列表驱动 **8 类**（**⑤ 段 6 类** ②/③/⑤/⑥/⑦/⑧ + **卡级 2 类** ⑨/⑩ → 按承载方式分两类删除）：① **模板内固定文本**（②③⑥⑨⑩）按**关键词**删（不动句子结构，红点可做到「缺哪一条」）；② **槽注入要素**（⑦ 检测盲区 `.session/` 取 `{{DETECTION_PATHS}}`、⑧ 检测命令取 `{{DETECTION_CMD}}`，按纯度规则 1 不得写死在模板）删「检测限度」整句。删前一律先断 `countIn(定位池, needle) >= 1`（实测 ③ 在现句出现 4 次、⑤ 2 次，故不能断「恰 1 次」）。每次用 `missingClauses(...)` 取「缺哪几条」，断言**含被删的那一项**；固定文本类另断言**恰缺这一条**（红点对位：删 ② 不得报 ⑦）。**⑨⑩ 按卡级判**（现文在 ② 段，删的是整张卡上的职责句；不按 `seg5` 切片判）。
- **预期**：8 次各命中目标要素；固定文本类红点精确（`miss` 恰为 1 项），槽注入类 `miss` 含目标项；⑨⑩ 的命中来自**整卡**文本，与 ⑤ 段切片无关。
- **判据**：
  ```js
  const AUD = 'reviewer-audit';
  const DET = 'detective-observer';
  const TPL = 'tools/docgen/templates/boundary.md.tpl';
  const cutText = (re) => (d) => editInDir(d, TPL, (s) => s.replace(re, ''));
  const cutSentence = (re) => (d) => editInDir(d, TPL, (s) => s.split(/(?<=。)/).filter((sen) => !re.test(sen)).join(''));
  const DEL = [
    { k: '②', seat: AUD, pool: /sha256/i,              cut: cutText(/sha256/gi),                          exact: true },
    { k: '③', seat: AUD, pool: /可复原/,                cut: cutText(/可复原|能否复原|可恢复/g),             exact: true },
    { k: '⑤', seat: AUD, pool: /用户[^。]{0,6}执行/,        cut: cutText(/用户执行/g),                          exact: true },
    { k: '⑥', seat: AUD, pool: /本轮[^。]{0,20}(作废|失效)/, cut: cutText(/本轮[^。]{0,20}(作废|失效)/g),      exact: true },
    { k: '⑦', seat: AUD, pool: /\.session\//,          cut: cutSentence(/检测限度/),                       exact: false },
    { k: '⑧', seat: AUD, pool: /git --no-optional-locks status/, cut: cutSentence(/检测限度/),             exact: false },
    // ⑨⑩ = 卡级子句（现文在 ② 段）：按整卡判「职责句缺了」，不按 seg5 切片判
    { k: '⑨', seat: AUD, pool: /核转录/,                cut: cutText(/核转录/g),                            exact: true },
    { k: '⑩', seat: DET, pool: /本席不核签/,            cut: cutText(/本席不核签/g),                        exact: true },
  ];
  for (const c of DEL) {
    const whole = renderBoundary(c.seat);
    assert.ok(countIn(seg5(whole), c.pool) >= 1 || countIn(whole, c.pool) >= 1,
      `删除前要素 ${c.k} 至少出现 1 次（否则删句定位不准）`);
    const hit = withCopy((d) => { c.cut(d); return renderBoundaryIn(d, c.seat); });
    const miss = missingClauses(hit, c.seat);
    if (c.exact) assert.deepEqual(miss, [c.k], `删 ${c.k} 后缺项应为 [${c.k}]，实得 [${miss.join(',')}]（红点未对位）`);
    else assert.ok(miss.includes(c.k), `删 ${c.k} 后缺项 = [${miss.join(',')}]（未命中目标）`);
  }
  ```
- **红绿证据**：红 = J01 用「整段包含 3 个关键词」凑判据 → 删任一子句仍绿（判据被弱化成本条的存在理由）；另一红 = 不先断「至少 1 次」就删句 → 命中的句子可能不在 ⑤ 段，删完 ⑤ 段没变，红点错位（议会 #3 F24）；再一红 = 用 `assert.throws(..., /⑧/)` 断言 → 删 ⑧ 时 ⑦ 也随同一句消失，`assertNeedClauses` 先报 ⑦ 从而**假红**（故改用 `missingClauses` 做「含目标项」断言）；再一红 = 把 ⑨⑩ 按 `seg5` 切片判 → 现文它们在 ② 段，删掉后仍恒绿（本条按**卡级**判才兜住）；绿 = 逐要素命中。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：措辞等价改写（J03）。

### S6-TC-J03 边界：措辞重排但要素齐 → 仍绿（哈希不等也允许）

- **覆盖**：**V-12** 边界 / `spec:215` V-12「不要求整段相等」/ §8 V-2
- **来源**：spec 推导（合法改写从「必红」变「必绿」——这是 v7 口径与 v5「整段相等」的差异点）
- **前置**：同 J02。
- **步骤**：① 副本内改写 ⑤ 段一处措辞（`立即停手` → `立即停止操作`；避开段名与 10 个断言点的关键词），其余照抄；② 跑 J01 断言 → 必须绿；③ 断言黄金哈希**不相等**（证明「合法改写」在 v5 口径下会被误判）；④ 断言能力 diff 为空（判定 pass）。
- **预期**：② 绿；③ 哈希不等；④ pass。
- **判据**：
  ```js
  withCopy((d) => {
    editInDir(d, 'tools/docgen/templates/boundary.md.tpl', (s) => s.replace('立即停手', '立即停止操作'));
    const out = renderBoundaryIn(d, 'reviewer-audit');
    assert.doesNotThrow(() => assertNeedClauses(out, 'reviewer-audit'));   // ② 要素齐即绿
    assert.notEqual(sha(out), goldenOf('reviewer-audit'));                // ③ 哈希不等是预期
    assert.equal(verdict(diffFacts(baseJson().seats['reviewer-audit'],
      factsFromText(out, probeDict(d)))), 'pass');                        // ④ 能力没丢（字典按副本现算）
  });
  ```
- **红绿证据**：红 = 仍以整段相等 / 哈希相等作判据 → 本条 ② 直接红（合法改写被判失败，v7 的核心变更失效）；绿 = 要素齐即过。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：改写后是否「更精准」（K 组盲评）。

### S6-TC-K01 四本账单在位且列齐（V-13 · **不在本期**）

> **K 组整体状态：不在本期（2026-10-29 用户裁定）**
>
> 本组 8 条（`K01`–`K08`）验的是 **V-13 A/B 盲评的评估账本与其纪律**，不是 S6 交付物的功能验收。2026-10-29 裁定：**S6 本体验收 = V-1～V-12（A–J 组 70 条，④ 段实测 70/70 通过）**；K 组 8 条**不在本期**，转独立课题。
>
> **裁定依据**（`docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design.md` §8 表后注，逐条可复算）：
> 1. **K03 ↔ K05① 结构性互斥**：K03 要求「每分必带卡内原文行」，K05① 要求「不得出现席名」；卡面原文本身写有「审计 / 侦探」→ 抄原文必然泄漏席名，两条不可同时满足。
> 2. **另 3 条红同属工具侧**：K04 / K07 缺第三人复评记录、K08 的 `gitLogCountAfter` 默认 pathspec = `.`（数全仓 commit 恒 > 0）。
>
> **保留而非删除**：本组 8 条原文**一字不删**，作为独立课题的输入。课题落点 `docs/after/20261029100942-s6-v13-ab-eval-rebuild-open-decisions.md`。
>
> **对下游的约束**：④ / ⑤ 门行与交接材料**不得**写「A/B 盲评通过」或「质量不降」；只能写「V-1～V-12 通过，K 组不在本期」。

- **覆盖**：**V-13** / §9.2 四本账单 / 议会 #3 F28
- **来源**：spec 推导（`spec:241`：**评估期落 `.session/reviews/<…>-s6-eval/`，收口后整目录迁 `docs/superpowers/reviews/<同名>/` 进 git**，缺一本 = 不得声明完成）
- **前置**：评估完成（spec §6 步骤 9）。
- **步骤**：① **评估期**账单落 `.session/reviews/<YYYY-MM-DD-HHMM>-s6-eval/`（不进 git）；② 收口后**整目录迁移**到 `docs/superpowers/reviews/<同名>/`；③ 断言目标目录恰 1 个 `*-s6-eval`；④ 断言 `git ls-files <该目录>` 命中四本；⑤ 逐本比对表头列名逐字（去 `|` 与空白）；⑥ `.session/` 副本必须已消失（迁移 ≠ 复制）。
- **预期**：四本齐、列名与 §9.2 逐字一致、全部被 git 跟踪、`.session/` 无残留。
- **判据**：
  ```js
  const BASE = join('docs', 'superpowers', 'reviews');
  const dirs = readdirSync(BASE).filter((d) => /-s6-eval$/.test(d));
  assert.equal(dirs.length, 1, '收口后 docs/superpowers/reviews 下应恰 1 个 *-s6-eval');
  const dir = join(BASE, dirs[0]);
  const rel = dir.replace(/\\/g, '/');
  const tracked = spawnSync('git', ['ls-files', rel], { cwd: ROOT, encoding: 'utf8' })
    .stdout.trim().split('\n').filter(Boolean);
  const COLS = { 'rubric.md': ['维度','0','1','2','判据来源'],
    'capability-diff.md': ['段','项','改造前','改造后','差','取数命令'],
    'ab-score.md': ['维度','A 分','B 分','差','A 证据行','B 证据行'],
    'checklist.md': ['阶段','项','判据','状态','证据'] };
  for (const [f, cols] of Object.entries(COLS)) {
    assert.ok(tracked.includes(`${rel}/${f}`), `${f}: 迁移后未进 git`);
    // 表头取法：**首个「表头首格 = 该文件固定列首格」的表**（不是「首个以 | 起首的行」）——
    // checklist.md 顶部有一张「交付说明」表（`| 项 | 内容 |`），固定列表在其后；
    // 另三本账的首表即是固定列表（rubric/ab-score → `维度`、capability-diff → `段`）
    const lines = readFileSync(join(dir, f), 'utf8').split(/\r?\n/);
    let head;
    for (let i = 0; i + 1 < lines.length && !head; i++) {
      if (!lines[i].trim().startsWith('|') || !lines[i + 1].trim().startsWith('|')) continue;
      if (lines[i].split('|').slice(1, -1)[0].trim() === cols[0]) head = lines[i];
    }
    assert.ok(head, `${f}: 未找到表头首格为「${cols[0]}」的表（表头无法定位）`);
    assert.deepEqual(head.split('|').slice(1, -1).map((s) => s.trim()), cols, `${f}: 列不全`);
  }
  assert.equal(existsSync(join('.session', 'reviews', dirs[0])), false, '评估期目录仍在 .session/ → 迁移没做（只复制）');
  ```
- **红绿证据**：红 = 只落 `ab-score.md`（有分数无 rubric / 能力 diff / checklist）→ 缺一本即红；另一红 = 文件留在 `.session/reviews/`（不进 git）或复制后没删 → ④/⑥ 红；另一红 = 列自由发挥（无「A 证据行」）→ 列比对红。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：分数是否正确（K03 / K04）。

### S6-TC-K02 rubric 冻结版结构与复用出处（**不在本期**）

- **覆盖**：**V-13** / §9.1 rubric / §9.2「复用」
- **来源**：spec 推导（§9.1 八维写死 + §9.2 五处复用出处写死）
- **前置**：K01 绿。
- **步骤**：① 断言 `rubric.md` 恰 8 个维度行（P1–P4 / E1–E4）；② 每维 0 / 1 / 2 三格都非空且含**可判词**（计数 / 指涉 / 一致 / 写明 / 可复制执行 / 冲突…），不得是「好 / 差」；③ 每维至少 1 个 0 分样例（卡内短语，不是抽象描述）；④ 五处复用出处写死（criteria 三态 / `score.mjs` / `pattern-table` N=3 / 议会 P0/P1/P2 / checklist 形态），逐条含路径或技能名；⑤ 顶部有「冻结」标记；⑥ **8 维 ID 与 §9.1 逐字一致**（深比较 `['P1','P2','P3','P4','E1','E2','E3','E4']`，不是「数量对就行」）。
- **预期**：8 维 × 3 格齐、0 分样例齐、复用出处 5 条齐、冻结标记在位、8 维 ID 与 spec 逐字一致。
- **判据**：
  ```js
  const rb = readFileSync(join(evalDir(),'rubric.md'),'utf8');
  // 行锚允许首格带维度描述（`P1 歧义词`）：`[PE][1-4]` 之后接一个空白 + 任意非 `|` 内容再收竖线
  const rows = rb.split(/\r?\n/).filter((l)=>/^\|\s*[PE][1-4]\s[^|]*\|/.test(l));
  assert.equal(rows.length, 8);
  // ⑥ 8 维 ID 深比较（与 spec §9.1 逐字一致；缺 / 重 / 拼错即红）
  // 首格带描述 → 切出首格后取**第一个词**再深比较（不是整格比较，否则 `P1 歧义词` 永不等于 `P1`）
  assert.deepEqual(rows.map((l) => l.split('|').slice(1, -1)[0].trim().split(/\s+/)[0]),
    ['P1','P2','P3','P4','E1','E2','E3','E4']);
  for (const l of rows) { const c = l.split('|').slice(1,-1).map((s)=>s.trim());
    for (const i of [1,2,3]) assert.ok(c[i].length >= 4, `0/1/2 定义缺：${l}`);
    assert.match(c[4], /criteria|score\.mjs|pattern-table|议会|checklist/, l); }
  for (const src of ['criteria.md','score.mjs','pattern-table.md','P0','checklist']) assert.match(rb, new RegExp(src.replace('.','\\.')));
  assert.match(rb, /冻结/);
  ```
- **红绿证据**：红 = rubric 只写 8 个维度名、0/1/2 留空（「到时凭感觉」）→ ② 红；另一红 = 自造一套评分口径不写复用出处 → ④ 红（与「复用已有评分体系」冲突）；另一红 = 维度写成 `P1–P4 / E1–E3`（少一维）或 `Q1` → ⑥ 深比较红（议会 #3 F29 / QA-19）。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：阈值是否合理（AI 判，走 K07 分歧渠道）。

### S6-TC-K03 每分必带卡内原文行；无证据记 `pending`（**不在本期**）

- **覆盖**：**V-13** 证据链 / §9.2「任一分无卡内原文行 → 记 pending」
- **来源**：spec 推导（「既不是 0 分也不是通过」是 pending 的定义）
- **类型说明**：**负例（守住不许无证据给分）**
- **前置**：K01 / K02 绿。
- **步骤**：① 遍历 `ab-score.md` 每个数据行：`A 分` / `B 分` ∈ `{0,1,2,pending}`；② 非 `pending` 的行，对应证据列必须非空且形如 `<卡文件>:<行号>` 或**卡内原文片段**，并能**回指到卡**（行号在文件范围内 / 原文 `includes` 为真）；③ 证据为空而给了分 → 必红；④ 证据写「见附注 / 凭经验 / 感觉」这类无卡内原文 → 必红。
- **预期**：每个非 pending 分数都能落到卡内某一行的原文。
- **判据**：
  ```js
  for (const row of rowsOf('ab-score.md')) {
    for (const side of ['A','B']) {
      const score = row[`${side} 分`];
      assert.ok(['0','1','2','pending'].includes(score), `${side} 分非法：${score}`);
      if (score === 'pending') continue;
      const ev = String(row[`${side} 证据行`] ?? '').trim();
      assert.ok(ev.length > 0, `${side} 分=${score} 但无证据行（应记 pending）`);
      assert.equal(/见附注|凭经验|感觉|我认为/.test(ev), false, `证据行不是卡内原文：${ev}`);
      assert.equal(evidenceResolvable(ev), true, `证据行无法回指卡（既非 agents/<卡>.md:行号，也非某张卡的原文片段）：${ev}`);
    }
  }
  ```
- **红绿证据**：红 = 打分表只填数字、证据列写「见附注」→ ③④ 红；绿 = 每分可回指。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：分数本身是否合理（AI 判 + K07 仲裁）。

### S6-TC-K04 通过判据 = 逐维 B ≥ A 且至少一维 B > A；总分不作判据（**不在本期**）

- **覆盖**：**V-13** / §9.2 评分规则
- **来源**：spec 推导（「总分只作参考，不作通过判据；总分高但单维下降仍判不过（防总分掩盖）」）
- **前置**：K03 绿（8 维分数齐）。
- **步骤**：① 从 `ab-score.md` 读**每卡 8 维**（2 卡 × 8 维 = 16 行）A / B 终值；② 任一维为 `pending` → **判失败**（不得声明通过，也不得恒真跳过）；③ 无 pending 时：每维 B ≥ A，且至少一维 B > A；④ 反例守卫：账单里不得存在「总分 ≥ X → 通过」的判据句；⑤ 判定函数自测：总分更高但一维下降 → fail；全等 → tie（不得声明「更好」）。
- **预期**：逐维不降 + 至少一维严格更好；全等 / 任一维下降 / 有 pending 均**不得**声明完成。
- **判据**：
  ```js
  const rows = readAbScore();                       // 2 卡 × 8 维 = 16 行（每卡 8 维）
  assert.equal(DIMS.length, 8, 'rubric 维度数必须为 8');
  assert.equal(rows.length, 16, '2 卡 × 8 维 = 16 行');
  const pending = rows.filter((d) => d.a === 'pending' || d.b === 'pending');
  if (pending.length > 0) assert.fail(`有 ${pending.length} 维 pending（不得声明通过，也不许恒真跳过）`);
  const num = Number;
  const verdictAb = (rs) => rs.some((d) => num(d.b) < num(d.a)) ? 'fail'
    : (rs.some((d) => num(d.b) > num(d.a)) ? 'pass' : 'tie');
  assert.equal(verdictAb(rows), 'pass');
  assert.equal(verdictAb([{a:0,b:2},{a:2,b:1},{a:1,b:1}]), 'fail');   // 总分更高但一维下降
  assert.equal(verdictAb([{a:1,b:1},{a:1,b:2}]), 'pass');
  assert.equal(verdictAb([{a:1,b:1}]), 'tie');                        // 全等不算「至少一维更好」
  assert.equal(/总分\s*(≥|>=|>)\s*\d+\s*(即|则|→)\s*(通过|pass)/.test(readFileSync(join(evalDir(),'ab-score.md'),'utf8')), false);
  ```
- **红绿证据**：红 = 只看总分（8+8 与 9+6 总分都 15，后者降维）→ ⑤ 的 fail 用例与 ④ 的判据句检测同时红；另一红 = 全等也宣布「更好」→ tie 用例红。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：`pending` 的补齐流程（K03 + K07）；各维权重（spec 未设权重，8 维等权——见 §10.4 第 7 条）。

### S6-TC-K05 盲评双实例 + 顺序打乱 + 封存解封（**不在本期**）

- **覆盖**：**V-13** 盲评流程 / `spec:216` V-13 / §9.2 封存与**盲评隔离**（`spec:252`）/ 议会 #3 F16
- **来源**：spec 推导（`spec:216`：**评「边界五段」切片**，不是整卡；**评测者 = 2 个全新上下文子代理（非 spec 作者 / 非施工者）**，每席 2 个独立实例、顺序打乱；**至多 2 轮**。`spec:252`：**评测实例的输入只有两张卡文件（A/B 各一），不得读仓内其他文件、不得读 `mapping.sealed.md`；`mapping.sealed.md` 存 `.session/reviews/<…>-s6-eval-sealed/`（不进 git），评完解封**）
- **前置**：K01 绿（四本账已迁 `docs/superpowers/reviews/<…>-s6-eval/`）。
- **步骤**：① 断言 `ab-score.md` **不出现席名**（`reviewer-audit` / `detective-observer` / `审计` / `侦探`），只出现「卡组 1 / 卡组 2」（小节标题统一为 `卡组 k · 实例 i`，不带席名、不带 card 映射括注）；② **盲评隔离**：`mapping.sealed.md` **不得**出现在评测账目录（`evalDir()`）内，只在 `.session/reviews/<同名>-sealed/`，含「匿名卡 ↔ 真实来源 ↔ A/B」映射与「解封」字段；③ 断言 checklist 记了评测者身份（2 个全新上下文子代理、非作者 / 非施工）；④ 断言评的是「边界五段」切片、轮次上限「至多 2 轮」、两实例记录在位；⑤ **每个评测实例的输入清单恰 2 个文件**（checklist 固定行 `输入清单（实例 N）：<卡 A 文件>、<卡 B 文件>`，按 `、` 切 = 2 项，且不得含 `mapping.sealed.md`）。
- **预期**：①–⑤ 全绿（⑤ 任一项数 ≠ 2 即红：≤1 = 盲评只剩一侧；≥3 = 多读了仓内文件）。
- **判据**：
  ```js
  const ab = readFileSync(join(evalDir(), 'ab-score.md'), 'utf8');
  for (const leak of ['reviewer-audit','detective-observer','审计','侦探'])
    assert.equal(ab.includes(leak), false, `ab-score.md 泄漏席名：${leak}`);
  const ck = readFileSync(join(evalDir(), 'checklist.md'), 'utf8');
  assert.match(ck, /评测者[^\n]*(全新上下文|子代理)/, '未记录评测者身份（2 个全新上下文子代理）');
  assert.match(ck, /非\s*(spec\s*)?作者|≠\s*作者/, '未声明评测者非 spec 作者');
  assert.match(ck, /非施工|≠\s*施工/, '未声明评测者非施工者');
  assert.match(ck, /边界五段|边界\s*5\s*段/, '未写明评「边界五段」切片');
  assert.match(ck, /至多\s*2\s*轮|≤\s*2\s*轮/, '未写轮次上限（至多 2 轮）');
  assert.match(ck, /实例\s*[12]/, '缺两实例记录');
  // ② 盲评隔离（spec:252）：mapping 只在 .session 的**封存目录**（<同名>-sealed），评测账目录内**不存在**
  assert.equal(existsSync(join(evalDir(), 'mapping.sealed.md')), false,
    'mapping.sealed.md 不得进评测账目录（它不进 git，只存 .session/reviews/<…>-s6-eval-sealed/）');
  const sealed = join('.session', 'reviews', basename(evalDir()) + '-sealed', 'mapping.sealed.md');
  assert.ok(existsSync(sealed), `mapping.sealed.md 必须在 ${sealed}`);
  const map = readFileSync(sealed, 'utf8');
  // sealed 记的是**匿名卡 ↔ 真实来源**（card-01 / card-02 …），不含「卡 1 / 卡 2」这类评分小节名
  assert.match(map, /card-0[1-4]/); assert.match(map, /解封/);
  // ⑤ 每个实例的输入清单恰 2 个文件（A/B 各一）
  for (const n of [1, 2]) {
    const m = ck.match(new RegExp(`输入清单（实例 ${n}）：([^\\n]+)`));
    assert.ok(m, `checklist 缺「输入清单（实例 ${n}）」行`);
    const inputs = m[1].split('、').map((s) => s.trim()).filter(Boolean);
    assert.equal(inputs.length, 2, `实例 ${n} 的输入必须恰 2 个文件，实得 ${inputs.length}`);
    assert.equal(inputs.some((f) => /mapping\.sealed\.md/.test(f)), false, '输入清单里不得出现 mapping.sealed.md');
    for (const f of inputs) assert.match(f, /\.md$/, `输入清单只收卡文件（.md）：${f}`);
  }
  ```
- **红绿证据**：红 = 评测者知道哪份是改后（`ab-score.md` 直接写席名，或 mapping 提前解封 / 落进评测账目录）→ 盲评失效，①② 红；另一红 = 未写「评边界五段切片」→ ③④ 段红（按整卡评会把「身份 / 触发」也算进质量分，噪声压过边界句）；**再一红 = 实例输入清单写成 1 项或 3 项（只给 B 卡 / 顺手带上 mapping 或 rubric）→ ⑤ 必红**；绿 = 只写卡号 + mapping 只在 `.session` + 输入恰 2 个卡文件 + 评测者与切片有记录。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：打乱是否真随机（机器不可判，留 §5 人工项）。

### S6-TC-K06 置信度：4 条记录且零回归 → 按 `rating.mjs` 标 `high`（**不在本期**）

- **覆盖**：**V-13** / `spec:256` 置信度 / `tools/execution-matrix/rating.mjs`
- **来源**：spec 推导（`spec:256`：**4 条记录（2 席 × 2 实例）全部零回归 → `high`；出现回归 → `mid`**；阈值来自 `rating.mjs:2-7`「records ≥ 3 && zero === records → high」——议会 #3 F17 纠正了旧口径「≥5 才 high」）
- **前置**：K05 绿（实例记录可取）。
- **步骤**：① **先把** `ab-score.md` **最后一轮**的评分行（**行数 = `abSections()` 的小节数 × 8，由 helpers 现算、不写死**）折叠成 4 条记录（每条记录 = 某卡某实例的 8 维，`abRecords()`），记录数 n = 4；② 逐记录判「零回归」：该记录 8 维**两侧均为数字**且 `B ≥ A` → 计 1 条；**任一维含 `pending`（非数字）→ 该记录不算零回归**（`zeroRecords()`）；③ 直接调用 `rating.mjs` 的 `rateFromRecords({ records: n, zero })` 取档位（**不复制阈值**，否则阈值一改本用例静默漂移；**分母统一为记录数 n，不得混用「评分行数 / 4 条」两个分母**）；④ 断言交付说明写出的档位与该现算值一致（**不硬编码 `2*2`**）；⑤ 含非数字维时额外断言档位 **≠ `high`**。
- **预期**：n=4 且 4 条零回归 → `high`；有回归 → `mid`；n=0 → `low`；含 `pending` 的记录不计零回归 → 档位不得为 `high`；交付说明与现算一致。
- **判据**：
  ```js
  // ① 记录 = 4 条（每条 = 某卡某实例的 8 维）；评分行（= abSections() 小节数 × 8，现算）不得直接当记录，
  //    4 也不得直接当「评分行数」的分母
  const records = abRecords();
  const n = records.length;
  const scoreRows = abSections().reduce((k, s) => k + s.rows.length, 0);
  assert.equal(scoreRows, abSections().length * 8, `每条记录必须恰 8 行评分（实得 ${scoreRows} 行 / ${abSections().length} 节）`);
  assert.equal(n, 4, '应有 4 条记录（2 卡 × 2 实例），每条记录 = 该实例的 8 维');
  assert.equal(records.every((r) => r.cells.length === 8), true,
    '每条记录必须折叠成 8 维（把评分行当记录或每条只装 1 维都算折叠错误）');
  // ② 零回归 = 记录级判定：pending（非数字）→ 该记录不算零回归
  const zero = zeroRecords(records);
  const anyNonNumeric = records.some((r) => r.cells.some((c) => !isNumericScore(c.a) || !isNumericScore(c.b)));
  if (anyNonNumeric) {
    assert.ok(zero < n, `含 pending（非数字）时零回归记录数必须 < ${n}（pending 不得被当成零回归）`);
  }
  // 档位唯一口径 = rating.mjs（spec:256「复用」）；本用例不另造阈值
  // 注意 `zero` 的语义 = **零回归的记录条数**（rating.mjs:5 判 `zero === records`），不是回归条数
  assert.equal(rateFromRecords({ records: 4, zero: 4 }).level, 'high');
  assert.equal(rateFromRecords({ records: 4, zero: 3 }).level, 'mid');
  assert.equal(rateFromRecords({ records: 0, zero: 0 }).level, 'low');
  const expect = rateFromRecords({ records: n, zero }).level;
  // ⑤ 有 pending / 非数字维 → 整体置信度不得为 high
  if (anyNonNumeric) assert.notEqual(expect, 'high', `含 pending（非数字）→ 置信度不得为 high（实得 ${expect}）`);
  const note = readFileSync(join(evalDir(), 'checklist.md'), 'utf8') + readFileSync(join(evalDir(), 'ab-score.md'), 'utf8');
  // 允许 markdown 强调（`置信度: **high**`）不影响判读，但词必须是现算出的那个档位
  const tierRe = (lv) => new RegExp(`置信度\\s*[:：]\\s*\\**\\s*${lv}`);
  assert.match(note, tierRe(expect), `交付说明的置信度应为 ${expect}（n=${n}, 零回归记录=${zero}）`);
  assert.equal(tierRe('high').test(note), expect === 'high',
    '置信度只有「记录 ≥3 且零回归记录 = 记录数」才可写 high（含 pending 时写 high → 红）');
  ```
- **红绿证据**：红 = 4 条零回归却标 `mid`（沿用旧「≥5 才 high」口径）→ 末两条断言红；另一红 = **16 行全写 `pending`**（或任一维 `pending`）而交付说明仍写 `置信度: high` → ② 的 `zero < n` 与 ⑤ 的 `expect !== 'high'` + 末条断言同时红；再一红 = 用 `Number('pending') = NaN` 后仍按「非 `B < A` 即零回归」数 16 行、再拿 4 当分母 → 全 `pending` 也判 `high`（即本用例要堵的缺陷）；再一红 = 把档位手写死而实际回归数 >0 → 现算与文本不一致，同样红；绿 = 现算 = 文本。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：阈值本身是否合理（复用既有 `rating.mjs` 口径，不在本轮讨论）。

### S6-TC-K07 分歧仲裁（AI 判；机器只核「分歧被记录 + 终值合法 + 证据可回指」）（**不在本期**）

- **覆盖**：**V-13** 双实例一致性 / §9.2「改分纪律」前置
- **来源**：spec 推导（§8 V-13「两份各 2 个独立实例」）+ 实现观察（补充：spec **未写**两份结果不一致时的仲裁规则 → §10.4 第 4 条；本条给出最小可执行口径：第三人复评 + 未收敛记 `pending`）
- **前置**：K03 / K05 绿。
- **步骤**：① 对每卡每维比较两个实例的分数；② 若差 ≥ 1 分 → 必须存在第三条记录（第三人复评 / 回读原文重评），且最终值在第三人给出证据行之前记 `pending`；③ 断言分歧记录在位（维度 / 两实例分 / 第三人分 / 证据行）；④ 若两实例一致 → 断言无多余仲裁记录（避免「为分歧而分歧」）。
- **预期**：分歧必被记录；终值 ∈ `{0,1,2,pending}`。
- **判据**：
  ```js
  // 前置：必须先解析出 4 个评分小节，否则下面的 `for` 循环是**空过**（恒真）——分数解析器失效时本用例不得静默判绿
  assert.equal(abSections().length, 4, 'K07：须先解析出 4 个评分小节，否则后面的循环是空过');
  for (const c of ['卡 1','卡 2']) for (const dim of DIMS) {
    const a = scoresOf(c, dim, 'A');                        // A 侧两个实例的原始分
    const b = scoresOf(c, dim, 'B');                        // B 侧两个实例的原始分
    const spread = [...a, ...b].map(Number);
    if (a[0] !== a[1] || b[0] !== b[1]) assert.ok(hasArbitration(c, dim), `${c}/${dim} 两实例分歧未仲裁`);
    assert.ok(['0','1','2','pending'].includes(String(finalOf(c, dim, 'A'))), `${c}/${dim} A 终值非法`);
    assert.ok(['0','1','2','pending'].includes(String(finalOf(c, dim, 'B'))), `${c}/${dim} B 终值非法`);
    assert.ok(spread.every((x) => [0, 1, 2].includes(x)), `${c}/${dim} 原始分越界`);
  }
  ```
- **红绿证据**：红 = 两实例不一致就直接取高分（无人复核）→ ② 的 `hasArbitration` 断言红；绿 = 分歧有第三条证据。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：仲裁人的判断对不对（语义，归议会测试席 / 用户）；分歧阈值 1 分是否合适（spec 未定，§10.4 第 4 条）。
- **⚠️ 判据性质声明**：**本条的评分与仲裁是 AI 判**——机器只核「分歧是否被记录 + 终值合法 + 证据行可回指」。**不得**把「某维分数 = X」写成机器断言（那会把 AI 判伪装成机器判，必然恒真）。

### S6-TC-K08 改分纪律：rubric 冻结后改分必须记 P2 + 全量重跑（**不在本期**）

- **覆盖**：**V-13** / §9.2「改分纪律」
- **来源**：spec 推导（「`rubric.md` 冻结后任何人不得改分；发现 rubric 有缺陷 → 记 P2，**重跑全部打分**，不许只改一处」）
- **前置**：K02 绿（冻结标记在位）。
- **步骤**：① 断言 `rubric.md` 有「冻结」标记（版本 + 时间）；② 用 git 历史判断冻结后是否改过 rubric；③ 若改过 → 账单必须同时含：一条 P2 缺陷记录 + 「全量重跑」记录（8 维 × 2 卡 × 2 实例全部带重评标记）；④ 负例：只重评受影响的那一维 → 必红。
- **预期**：未改 = 无需重跑；改过 = P2 + 全量重跑齐。
- **判据**：
  ```js
  const rb = readFileSync(join(evalDir(),'rubric.md'),'utf8');
  assert.match(rb, /冻结/);
  const changedAfterFreeze = gitLogCountAfter(freezeTime(join(evalDir(),'rubric.md')));
  if (changedAfterFreeze > 0) {
    assert.match(rb, /P2/);
    const rows = rowsOf('ab-score.md');
    assert.equal(rows.filter(hasRerunStamp).length, rows.length, '改分后必须全量重跑（不许只改一处）');
  }
  ```
- **红绿证据**：红 = 只重评「受影响的那一维」→ ④ 红（其余维仍是旧分，跨维不可比）；绿 = 全量重跑。
- **对应测试**：同上（待 plan Task N）。
- **不覆盖**：rubric 改动是否必要（语义归议会）。

---

## 3 负例与边界（汇总裁定表）

> 数量硬门：本表 **51** 条（负 28 + 边界 23）≥ 第 2 节「正」用例 **27** 条；总数 27 + 28 + 23 = **78** ≤ 80。

| 用例 ID | 边界/负例是什么 | 为什么容易漏（真实会发生的形态） | 期望行为 |
|---|---|---|---|
| S6-TC-A06 | 组内顺序被重排但集合不变 | 「整理一下顺序」看起来无害，`gate` 会说「卡面变了」但不说「是顺序」 | 卡面切片顺序 == 定义层组内顺序 |
| S6-TC-A07 | 组 ID 写成 `docs/input` | 想用路径形态命名组，肉眼很自然 | ID 谓词 + 字符集双红 |
| S6-TC-A08 | 定义层值里含 `{{DENY_GROUPS}}` / `$&` / `$'` / `$$`；或某席 `display` 里含 `{{DETECTION_CMD}}` | 字符串式 `replaceAll` 会把 `$&` 当「匹配到的槽名」展开；**改成 12 次 `replaceAll` 顺序替换时，先注入的槽值会被后一个槽扫掉**（`display` 里的槽名被真命令替换） | **单趟**正则替换（`spec:93`）：注入值逐字原样输出，`expanded[0]` 仍是 `display` 原串 |
| S6-TC-A09 | 卡面被改成 CRLF / 加 BOM | 跨平台编辑器一键改行尾；`gate` 逐字节比时若对行尾 / BOM 不敏感，就会「静默通过」 | `Mismatch` 必红（exit 1）；禁归一化后判绿（`spec:124`） |
| S6-TC-B03 | 配置层追加 `'docs/after/'` | 「组名和路径长得差不多」 | `LiteralInConfig` + 行号 |
| S6-TC-B04 | 配置层追加带反引号的命令 | 从旧边界句复制粘贴的残留 | `LiteralInConfig` |
| S6-TC-B05 | 配置层追加 `'--write'` | 想「临时开个口子」 | `LiteralInConfig` |
| S6-TC-B06 | capability 写成 `admin` | 悬空引用会让该席边界句静默少一段，`gate` 反而不报 | `UnknownPolicyRef: 席:capability=admin` |
| S6-TC-B07 | group 拼错成 `git.write2` | 同上；拼错与「禁止组」长得很像 | `UnknownPolicyRef: 席:group=…` |
| S6-TC-B08 | artifact 写成未登记的 `snapshot.md` | 新增产物名不登记就被允许（允许写一个不存在的文件） | `UnknownPolicyRef: 席:artifact=…` |
| S6-TC-B09 | 给审计授予 `docgen.write` | 「审计本来就能跑命令」，顺手把写权也给了 | `ForbiddenGroupGranted: 席:docgen.write:forbidden` |
| S6-TC-B10 | 别的席引用 `seat:senior-sdet.extra` | 席级组看起来就是一个普通组 ID | `ForbiddenGroupGranted: …:other-seat` |
| S6-TC-B12 | 席名命中 `Object.prototype` 键 | 字面量对象查表会命中原型链（S5 已踩过 `constructor`） | 回落 `__default__` 且不抛 |
| S6-TC-B13 | 配置里出现 `round-check.md`（**已登记**产物名） | 把「含 `.md`」或「出现字符串」当违规判 → 正确配置被判违规（假阳性） | 判绿（是登记 ID，closed-world 放行） |
| S6-TC-B14 | 配置层塞 `'git status'` 裸命令 | 三条弱探针（`/`、反引号、`--flag`）全不命中——v1 的缺口原形 | `LiteralInConfig`（closed-world 必红；G-1 已关） |
| S6-TC-B15 | 配置层 `artifacts` 塞 `'definitions/x.mjs'` | 只对 `allowGroups` 做 closed-world、`artifacts` 漏查 | `LiteralInConfig`（三键逐键查表） |
| S6-TC-C03 | 模板追加一条路径 | 「模板里写个示例路径方便阅读」 | `TemplateImpure` |
| S6-TC-C04 | 模板追加反引号命令 | 示例命令很自然 | `TemplateImpure` |
| S6-TC-C05 | ① 模板追加**清单类成员** `npm run check`；② 模板追加单点类 `--write`（后者合法） | 规则 1（成员不得整项出现）与规则 2（单 token flag 允许）曾互相矛盾：按旧口径「`--write` 必红」→ 合法模板被判违规 | ① `TemplateImpure`；② 判绿（`--write` ∈ `fs.write` verbs，规则 2 放行） |
| S6-TC-C07 | 模板槽名拼错（`{{SEAT_LABEL}}`） | 渲染静默输出占位符，卡面看起来「只是内容怪」 | 抛错或输出无 `{{` |
| S6-TC-C08 | 统一用 `join(', ')` 渲染路径段（或槽 10 只展开 22 项、漏 `spec / plan`） | 复用工具函数最省事；「六组展开」很容易漏掉那个正则项 | 分隔符各归其位；路径槽成员 = 23 项 |
| S6-TC-C09 | 把可选槽写成**显式 `undefined`**（`clause: undefined`）而当成「缺省」 | 「没写」与「写了 `undefined`」在 JS 里看起来都是空值，最容易用 `if (!v)` 合并成一个分支 | 缺省 → 渲染空串（合法）；显式 `undefined` → `TemplateImpure`（片段 = 槽名） |
| S6-TC-D01 | 新码未进 `EXIT` 映射；或报文里的文件位置写成绝对路径（`D:\…` / `/home/…` / `file://`）；或席级组只做「撞禁止」不做「越出允许集」 | 只在渲染层 `throw('UnknownPolicyRef')`，忘了映射表；报错里贴本机路径在调试时最省事，贴进日志后无法复算（`spec:197`）；`:verb` 写了就以为不变量 8 已实现 | exit 1 + 首行格式（未映射则 2，必红）；路径以 `tools/docgen/` 开头的 POSIX 相对路径；四后缀 `:forbidden` / `:other-seat` / `:verb` / `:not-allowed` 各 1 例 |
| S6-TC-D02 | 把「盘上 ≠ 渲染」也报成 `RenderNotEquivalent` | 两个「不一致」长得一样，容易混用一个码 | `gate` 报 `Mismatch`；`RenderNotEquivalent` 留给「渲染 ≠ 黄金哈希」 |
| S6-TC-D03 | 定义层出现席名 slug | 按席特判最省心，但等于把配置写回定义层 | `SeatNameInDefinition` |
| S6-TC-D04 | 只写 3 条不变量的负例 | 「九条都写了」是自我声明，没计数 | 九条各 ≥1 用例、1–8 各 ≥1 负例；§1 表 + 用例段双读可机器判 |
| S6-TC-D05 | 映射表被当作「有就行」 | 只测「抛了」，不测退出码；也容易把测试侧断言码误加进 CLI 表 | 五 CLI 码 → 1；`RenderNotEquivalent` / 未知码 → 抛 |
| S6-TC-D06 | `gate` 侧不调 `validatePolicy`（五码只在 `policy --dump` 接了线） | 五码探针全走 dump，「dump 绿」被当成「校验已接」；而 `gate` 才是唯一运行时防线：漏接时配置非法要么被静默放行（exit 0），要么落成 `Mismatch`（看起来像产物漂移，归因错） | 两次均 exit 1 且首行为 `LiteralInConfig: ` / `ForbiddenGroupGranted: reviewer-audit:docgen.write`；两份输出均无 `Mismatch` |
| S6-TC-E07 | 新增 `policy/legacy.mjs` 存旧句 | 「先留着，回头删」= 第 7 份副本 | `policy/` 文件集精确 |
| S6-TC-F03 | dump 顺手写盘 | 「方便审计」 | 无 diff、无新文件 |
| S6-TC-F04 | dump 接受 `--out` | 复制其它子命令的 flag 解析 | `InvalidArgs` exit 2 + 不落盘 |
| S6-TC-F05 | dump 输出含时间戳 / 键序不稳定 | 「加个 `generatedAt` 方便排查」——但两次输出不等，审计无法比对历史 | 两次 stdout 逐字相等、无时间戳 |
| S6-TC-G04 | 删常量但漏改 `:12` import / `S5-TC-B08` / `S5-TC-E05` / `S5-TC-B14` | 四处消费者散在两份文件的不同位置（import、B08、E05、B14 的前置构造），漏一处整文件 0 用例或跑即 ReferenceError | 四处同批改 + 全仓 0 命中 |
| S6-TC-G05 | 数据改了卡面不变 | 渲染没接上（改了定义层却没进渲染路径） | `gate` 必红 |
| S6-TC-C01 | 把「哈希不等」当成失败判据（v5 旧口径）；或黄金改用**改造后渲染自哈希** | 「逐字节相等」是直觉上的等价判据，没人会想到它会让「措辞更好的改写」永远过不了；自哈希更隐蔽——它让 `hashEqual` 恒真、定位线索归零 | 哈希只作定位，结论由 H02 空差出（H06② → pass）；黄金取自改造前（旧卡边界节），改一字必不相等 |
| S6-TC-C02 | 只用审计席做等价样本 | 两席文案不同，侦探席的「写入范围」段可能整段缺失而哈希仍被审计席的相等掩盖 | 逐席 diff（H02）必红 |
| S6-TC-G01 | 卡面字节变了却静默通过（或反之：字节变了直接判失败） | 两种极端都常见：`replace` 顺手重生成卡无人记账，或一有 diff 就宣布失败 | 差异必须进账单定位说明；是否通过看 H02 + K04 |
| S6-TC-H03 | 只判「丢没丢」的一半（只看 `+` 不看 `-`） | 「等价」听起来是「不许多」，容易漏掉「不许少」 | `minus` 逐项必红 |
| S6-TC-H04 | 命令集只比组 ID 不比 verbs | 组 ID 没变就以为命令没变，删一条 verb 无人发现 | 逐 verb 比对，`allowCmds` 少一条即红 |
| S6-TC-H05 | 只判 `-` 不判 `+`（越权新增被放过） | 丢能力会让人紧张，多能力往往被当作「顺手加的便利」 | 路径 / 命令 / 组各加一项 → `+` 分别必红 |
| S6-TC-H07 | 基线取自改造后 HEAD（或抽取器读定义层） | 施工时「顺手从当前 HEAD 导一份」最省事，而这样 diff 恒空、判据归零 | 基线 commit 上必须不存在 `policy/` 与 `renderBoundary.mjs`；否则必红 |
| S6-TC-I02 | 禁止集只测一个代表项（`docgen.write`）；且对所有禁止 verb 一律断 `LiteralInConfig` | B09 已经测了「授予禁止组」，容易误以为整类已覆盖；而 `commit` / `draft` / `replace` 等 9 个 **ID 形态** verb 按归码规则应 `UnknownPolicyRef` | 5 组 / 现算 verbs / 23 路径逐项各一次；期望码由形态谓词现算 |
| S6-TC-I03 | ① 探针实现成 `slice(0, 3)` 抽样；② 允许集某项被**误拦**（`--no-optional-locks` 被当 `--flag`、产物名被当路径） | 「先跑几条验证思路」是调试本能，留在代码里就永远只跑 3 条；误拦比漏拦更隐蔽——卡面照样渲染，那项却永远用不了 | 键集逐项相等 + 每项执行 1 次 + 静态禁截断；I01 逐项 `status === 0` |
| S6-TC-H06 | 总分 / 哈希 / 字节任一「单指标」被当作通过判据 | 单指标最省事、最容易向上解释；「哈希相等」尤其像等价证明 | 判定函数只吃 `{minus, plus}`；四条真值表逐一断言 |
| S6-TC-J02 | 关键子句用「整段含 3 个关键词」凑判据 | 三个词都在就以为要素齐，删掉一类仍绿 | **8 类**逐要素删除各红一次，红点按 `missingClauses` 对位；删前先断 `>= 1` 次 |
| S6-TC-J03 | 措辞改写被判失败（v5 整段相等口径） | 「和原来不一样」被直觉等同于「改坏了」 | 要素齐即 pass；哈希不等是预期 |
| S6-TC-K03 | 无证据给分（证据列写「见附注」） | 打分时注意见里已经想清楚了，觉得不必抄原文 | 无卡内原文行 → 只能记 `pending` |
| S6-TC-K04 | 只看总分（8+8 与 9+6 都 15 分） | 总分是最直观的汇报口径 | 逐维 B ≥ A 且至少一维 B > A；全等记 tie |
| S6-TC-K06 | 4 条零回归却标 `mid`（沿用旧「≥5 才 high」）；或 16 行含 `pending` 仍判 `high`（`Number('pending')=NaN` 被当成「非回归」；分母混用 16 行 / 4 条） | 旧口径写进了 spec 与 testcase，实际 `rating.mjs` 是「记录 ≥3 且零回归 → high」 | 先把 16 行折叠成 4 条记录（每条 = 8 维），记录级判零回归（含 `pending` → 不算零回归），`zero` 分母 = 记录数；含 `pending` 时断言 `置信度 !== high` |
| S6-TC-K07 | 两实例分歧取高分（无人复核） | 取高值最「省事」，且看起来对改后有利 | 分歧必须留第三条记录，未收敛记 `pending` |
| S6-TC-K08 | rubric 冻结后只重评受影响的一维 | 「只改了这一维，为什么全量重跑」 | 全量重跑；否则跨维分数不可比 |

## 4 回归清单

| 如果改了 | 必须重跑 | 为什么 |
|---|---|---|
| `tools/docgen/policy/definitions/*.mjs`（任一） | S6-TC-A01～A09、B01、C01、C02、C06、C08、E01、E03、F02、F06、G05、**H02/H03/H04/H05/H07、I01、I02、J02** | 定义层是唯一真相：改一个字，两席卡面、dump、纯度、顺序、能力矩阵全部受影响 |
| `tools/docgen/policy/definitions/tiers.mjs`（v8 新增，档位表下沉） | **S6-TC-A01（四档齐 + 工具名 + re-export）**、B01（不变量 9 + 四档）、**F01（`tiers` 四档）**、F02（槽 2）、E07（文件集 + 同引用）、D03（不得含席 slug） | `TIERS` 的值是**工具名**（不是 capability ID）；`tierOfCapabilities` = 「caps 展开 == `TIERS[档]`」唯一样，也是槽 2 的唯一来源；`command` 档不得删；与 `patternRegistry` 必须同引用 |
| `tools/docgen/policy/definitions/seats.mjs`（**新增**） | S6-TC-B01、B02、C06、**C09**、D03、E07、F01 | 显示名映射是 `{{SEAT}}` 的唯一来源；可选槽缺省（槽 5 / 槽 6）与「显式 `undefined`」判红都在这里 |
| `tools/docgen/policy/seat-policy.mjs` | S6-TC-B01～B14、E02、E03、F01、F02、F04、G02 | 配置层决定每席展开；悬空/禁用/席级组三类负例都在这里 |
| `tools/docgen/templates/boundary.md.tpl` | S6-TC-C01～C08、**C09**、A06、A08、A09、E03、G01、G02、**J01/J02/J03、I01** | 模板即卡面；改模板 = 立刻 `gate` 红（且要重跑 J 组子句断言与 K 组盲评）；槽值 `undefined` 由 C09 判 `TemplateImpure` |
| `tools/docgen/components/renderBoundary.mjs` | S6-TC-C01、C02、C06、C07、C08、A06、A08、B11、E02、F02、F06 | 渲染器是等价迁移的唯一实现点 |
| `tools/docgen/components/patternRegistry.mjs`（删 `BOUNDARY_COMMAND` / `boundaryBySeat` 改取值） | S6-TC-B01、C01、C02、G03、G04 + S5 全套（`tool-tiers.test.mjs`） | 两席边界句来源改变，S5 的 B08/E05 依赖它 |
| `tools/docgen/components/agentData.mjs`（`boundaryBySeat` 取值来源） | S6-TC-B01、G01、G03、G04 | 卡面由数据渲染；顺序 `...s` 在后（事实 4） |
| `tools/docgen/cli.mjs`（新增 `policy` 子命令 / flag 白名单） | S6-TC-F01～F06、G02 | dump 的全部契约在这里；flag 白名单错误会连带 F04 |
| `tools/docgen/components/validateAgentData.mjs`（`EXIT` 加**五码**） | S6-TC-D01、D05、B03～B10、C03～C05、D02、D03 | 未映射码退出 2；映射表是封闭判据；`RenderNotEquivalent` 不进表 |
| `tools/docgen/fixtures/boundary-golden.json` | S6-TC-B01、C01、C02、G03 | 黄金一变，定位线索全部重算；**黄金取自改造前**、换代只追加 `<席>@<轮次>`、旧键不删；**当前比对键 = 最大轮次键、无则基线键**（`spec:172` / `spec:198`），换代后仍取旧基线键 → 定位线索失效（负例在 B01 ⑨ / C01 ⑦ / C02 ⑦） |
| `tools/docgen/test/tool-tiers.test.mjs`（B08 / E05 / `FORBIDDEN_PATHS` / `ALLOWED` / `FORBIDDEN`） | S6-TC-E04、E06、G04 + S5 的 A 组全部 | 该文件同时消费定义层与常量；改错会整文件崩 |
| `docs/superpowers/specs/2026-10-25-s5-tool-tiers-design.md` §3.3 | S6-TC-E05 | 指针化后是「只加指针、原句保留」的判据样本（按 `spec:210` 不进副本计数） |
| `docs/superpowers/specs/2026-10-25-s5-tool-tiers-design-testcase.md` 的 `S5-TC-B08` / `E05` / `B14` | S6-TC-G04 | 三个条目都消费 `BOUNDARY_COMMAND`（B14 作前置构造），删常量必须同批改判 |
| 未来新增一席（V-8 口径：`seats.mjs` 的 `display` + `seat-policy.mjs` 的组 = **两处数据、零代码**；该席若还要出卡，才另动 `agentData` / 卡模板，不属 V-8 的度量面） | S6-TC-B01、B12、**E02（形态 ②）**、F01、F02、G03 | 加席只改数据；用例必须自动跟随、不出现隐含名单 |
| 未来收 `outputFormats` / `sharedBlocks`（S6-B） | S6-TC-E03、E07（阈值与文件集要放宽） | 本轮的范围边界；S6-B 一落地，副本集合断言必须同步 |
| **`tools/docgen/fixtures/capability-baseline.json`（v7 新增）** | **S6-TC-H01～H07、J03、I01、I02** | 基线是 V-1 的唯一「改造前」真相；基线一变，能力矩阵 diff 的两端全变 |
| **`tools/docgen/test/support/capability-baseline.mjs`（v7 新增抽取器；v9.3 起两入口：`factsFromBaselineText` 基线端切分 / `factsFromText` 改造后字典匹配）** | **S6-TC-H01（③⑤⑦）、H02、H07（③ 静态 + ④ 动态）** | 抽取器读错 / 读了定义层 / 根本没被执行 / 两端用错口径（基线端注入字典）= 基线错 = diff 恒空（判据归零） |
| **`docs/superpowers/reviews/<…>-s6-eval/`（四本账单 + `mapping.sealed.md`，v7 新增）** | **S6-TC-K01～K08、H06（⑤）** | V-13 的唯一证据载体；账单缺项 / 列变 = 盲评不可复核 |

## 5 只手动验证

| 项 | 为什么机器验不了 | 谁验、看什么 |
|---|---|---|
| 边界句语义严度（改写后是否仍「够严」） | 「够不够严」是语义判断，机器只能查关键词在不在 | `reviewer-qa` + 审计：逐句对照改造前卡面（`git show HEAD:agents/reviewer-audit.md`）与 §3.4 五段结构，缺一段即卡 |
| `purpose` 文本是否准确描述该组用途 | 语义判断；机器只能判非空 | `reviewer-product` + 审计：把 8 组 `purpose` 与 §0.2 的 verbs 逐组对照，出现「组内含组外命令」即卡 |
| `npm run check` 的 ③ 段（`skill-inspector`）是否 `0 findings` | `check-all.mjs` 直接透传其 stdout，文案随工具版本变 | 用户 / 审计：看 `npm run check` ③ 段原文，`findings` 计数为 0 |
| `BOUNDARY_COMMAND` 的旧值是否留在 git 历史（可追溯） | 需 `git log -S` 检索历史，非确定性 | 审计：`git log -S'BOUNDARY_COMMAND' --oneline -- tools/docgen/components/patternRegistry.mjs` 有 ≥1 条改造前提交 |
| 两席实际跑命令 / 写产出的行为是否仍与边界句一致 | 运行时行为，机器只能保证文本一致（§10 第 5 条） | 议会侦探实例自证 + 审计抽查 1 轮（证据栏写取数命令 + 输出首行） |
| `policy --dump` 的 stdout 是否被终端/日志重定向到磁盘 | 属调用方行为，子命令只能保证自身不写盘 | 审计：跑一次后 `git --no-optional-locks status --porcelain` 必须为空（与 F03 互证，但重定向由人造成） |
| Windows / POSIX 分隔符是否影响 dump 可复算 | 跨平台差异（路径分隔符）属平台既成事实 | 审计：同一提交在另一平台跑 dump，比对 `seats.expanded` 文本（应无路径拼接，故应逐字相等） |
| **A/B 盲评的「打分本身」**（8 维各给 0/1/2，v7 新增） | 评分是 **AI 判**（语义判断）；机器只能核「字段 / 证据行可回指 / 比较规则 / 总分不作判据」，核不了「这一维到底该不该给 2 分」 | 两份各 2 个独立实例（K05）+ 分歧第三人复评（K07）；用户抽 1 维复核「证据行是否真的支撑该分数」 |
| **A/B 两份卡是否真的打乱、两个实例是否真的互不可见**（v7 新增） | 属流程事实，账单只能记录「实例 ID + 隔离说明」；机器无法证明评测者当时不知道答案 | 审计：核实例记录与隔离说明，抽查实例的输入快照（若留存） |

## 6 不测（带理由）

| 不测什么 | 为什么 |
|---|---|
| 平台能否真拦住白名单外命令 | spec §10 第 1 条：无参数级授权位（PRD §9.1 实查裁定），既成事实 |
| 边界句的语义严度 | spec §10 第 2 条：语义判断，归 `reviewer-qa` + 审计人读（§5 第 1 条） |
| `outputFormats.audit` ↔ `round-check.md`、`sharedBlocks` ↔ `debate-protocol.md` 两组同类副本 | spec §2「不做什么」2 / §10 第 3 条：S6-B 候选 |
| `DEFAULT_BOUNDARY` / `evidence-reader` 的边界句改造 | spec §2「不做什么」3 / §10 第 4 条：结构不同构，本轮只断「不变」（G03） |
| 运行时是否真按边界行动 | spec §10 第 5 条 |
| 权限语义本身是否合理（谁该有命令权） | S5 已签结论（§2「不做什么」1：一条不变）；本 spec 只证「等价」 |
| 档位 → 工具数组的**映射关系**（谁挂哪档、档位含哪些工具） | S5 已签范围；S6 只把档位表**下沉**到 `definitions/tiers.mjs`（四档键与语义不变、**值以工具名表达**，`patternRegistry` re-export 同一对象），不改「谁挂哪档」 |
| 账本模板（`round-check.md` / `progress.md` / `detective.md`）内容 | S6-B；本 spec 只定义「谁拥有」（A05） |
| **模板 / 配置读取失败**的码与退出码 | `spec:195`（§7 注）**已撤回**该承诺：`boundaryBySeat` 在**模块导入期**求值（= 已读模板），失败 = **未捕获异常**，**不承诺任何码 / 退出码**，也不登记新码（`TemplateReadFailed` 不在 §7 码表里）；「渲染改惰性求值（以便给稳定退出码）」连同该错误面一并留 **S6-B**，触发信号 = 渲染改惰性求值。故本文件**不设任何「读取失败 → 稳定码 / 退出码」断言**（设了会与 spec 冲突） |
| `specCaseGate` / 其它生成器（rule） | 不在本 spec 变更半径 |
| PRD 正文与功能点集合 | spec §2「不做什么」5：PRD 只读，改动检测归议会审计 |
| `git commit` / 推送类命令的拦截 | §10 第 1 条同源（平台无参数级授权） |

## 7 缺口与判别力水位

| 缺口 | 漏检哪类反例 | 至少 1 个样例 | 语义由谁兜 | 状态（**v8 复核**） |
|---|---|---|---|---|
| **G-1** 配置层裸命令字面量漏检 | V-3 三条探针（`/`、反引号、`--flag`）对 `'git status'` / `'npm run check'` 全不命中——配置层仍可藏命令文本 | `allowGroups: ['git status']` | `S6-TC-B02`（closed-world 正例）+ `B14` / `B15`（必红负例） | **已关**：spec v2 §3.5 不变量2 与 §8 V-3 改为 closed-world |
| **G-2** 「等价迁移」的证据载体若存全文 = 第 6 份副本 | 用 `fixtures/boundary-*.txt` 存整句 → V-7 的「副本收敛」被自己的黄金打破 | 存两份全文 txt | `S6-TC-C01/C02` 用 **sha256 黄金** | **已关**：spec v2 §3.6 / §6 步骤 3 写死 `boundary-golden.json`（仅哈希） |
| **G-3** V-8「另 13 席」与实测 15 席不符 | 15 席 = 2 producer + 1 evidence-reader + 12 default；「13」按 15−2 数，把 evidence-reader 算进了 default 组 | 文案「其余 13 席」 | `S6-TC-E02`（登记席集合派生）+ `G03`（`agentData.length − own.size` 派生） | **已关**：spec v2 §3.6 注明两口径不矛盾；V-8 不再写死席数 |
| **G-4** 不变量 3「定义层不得出现席名」与 `{{SEAT}}` 槽（审计/侦探）冲突 | 若「席名」含中文显示名，则 `renderBoundary` 无处取「审计」二字 | 模板 `{{SEAT}}` | `S6-TC-D03`（slug 判据 + `seats.mjs` 映射断言） | **已关**：§3.5 定「席名 = slug」、显示名只落 `seats.mjs`；例外① 的 `host` 哨兵已由 v4 补齐（`owner ∈ SEAT_NAMES ∪ {'host'}`，`'host'` 只配 `host: true` —— §10.1 第 4 条闭合） |
| **G-5** 模板纯度「反引号内是命令」谓词未写死 | 误伤合法强调（`` `producer` 档 ``）或漏检（裸 `curl` 写在模板里） | 模板含 `` `producer` `` | `S6-TC-C05`（清单类判红 / 单点类放行）+ `C06`（12 槽 + 逐槽被引用） | **已关（v8）**：`spec:94-96` 按**清单类 / 单点类分治**——清单类（组 ID / 多词 verb / 路径组成员）必须经槽；单点类（`--output` / `--write` / 产物名 / 单词 verb）允许留模板但须 ∈ 定义层集合；其余结构性文本登记白名单。**「允许段 `--output` + 非本席产物名」两类残余因此无需新槽**（C06 已按此改写） |
| **G-6** 未声明槽位无错误码 | spec §3.4 只说「模板内不得含字面量」，没说拼错槽名怎么办；实现可能原样输出 | `{{SEAT_LABEL}}` | `S6-TC-C07`（二选一均合格） | **已关（v8）**：不变量 7「槽集恰合」+ `spec:93` 槽值守卫（`undefined`/`null` → `TemplateImpure`）已把「拼错槽名 / 有值无槽」纳入同一码；C06/C07 双守 |
| **G-7** 删 `BOUNDARY_COMMAND` 的波及面 spec 未点全 | 消费者散在 `tool-tiers.test.mjs:12`（import）、`:374-380`（B08）、`:721-723`（E05），另 S5 testcase 的 `B14` 也以它作前置构造 | `import { BOUNDARY_COMMAND }` | `S6-TC-G04` 断言四处同批改 + 全仓 0 命中 | **已关**：v4 §3.6 列全四处（含 `S5-TC-B14`）并给口径「判据/前置改判、历史叙述句保留」；G04 ⑤ 按此断言（§10.1 第 7 条闭合） |
| **G-8** `agentData` 的 `...s` 在后，条目自带 `boundary` 会覆盖渲染 | 事实 4；日后给某席加 `boundary` 字段时静默绕过渲染（S5 D10 同形问题的 S6 版） | `{ name: 'x', boundary: '手写句' }` | `S6-TC-G03` ③（自带 `boundary` 的条目 ⊆ `DECLARED_SLOT_SEATS`，同口径复核；不另造守卫） | **已收口（v9.1）**：`spec:121` 明写「条目除 `evidence-reader` 外不得自带 `boundary`，沿用 S5 既有断言 `DECLARED_SLOT_SEATS`（由 `boundaryBySeat` 派生），本 spec 不新增守卫」；G03 ③ 断言的集合 = 该断言同一集合 |
| **G-9** V-2（卡面零变化）与 V-8（给某席加一组）在「无组席」上互斥 | V-8 若要求 `agentData` 对所有席走 `renderBoundary`，12 张卡全变、V-2 直接失败 | `renderBoundary('reviewer-qa')` vs `DEFAULT_BOUNDARY` | `S6-TC-E02`（只量 3 个登记席）+ `G03`（12 席 == `DEFAULT_BOUNDARY`）+ E02 的 `gate` 仍绿断言 | **已关**：spec v2 §3.6「只收 2 席、12 席不接」+ V-8 度量层改为 `renderBoundary` 输出 |
| **G-10** 基线**抽取器**与基线 commit 无落点约束（v7 新增） | 「空差」若两端同源则恒真：从 HEAD 导基线、或抽取器 import `policy/`，每轮都「通过」 | `sourceCommit = HEAD` | `S6-TC-H01`（③ 复算 + ⑤ 不 import 定义层）+ `H07`（基线 commit 上不得存在 `policy/`） | **已关（v8）**：`spec:169` §6 步骤 0 ①–⑤ 写死落点（`test/support/capability-baseline.mjs`）、不得 import `policy/`、必带 `sourceCommit`、该 commit 上不得有 `policy/`、抽取规则 + 黄金样本、逃生路径 |
| **G-11** V-11 的「拦」是哪一层未写死（v7 新增） | 平台无参数级授权位（§10 第 1 条），若把 V-11 读成「运行时拦截」，用例永远不可能绿 | 「使用 → 必判红」 | `S6-TC-I01`（判据层不判红）/ `I02`（判据层必判红） | **已关（v8）**：`spec:214` 写明「拦 / 不拦 = 判据层（配置校验 + 渲染可指涉 + 报错码），不是运行时授权」 |
| **G-12** A/B 双实例**分歧无仲裁规则**（v7 新增） | 两实例差 1 分就足以让「逐维 B ≥ A」翻盘；没有仲裁等于谁高分听谁的 | 8 维里 1 维两实例 1 vs 2 | `S6-TC-K07`（分歧必留第三条记录，未收敛记 `pending`） | **已关（v8）**：`spec:258` 写死「同卡同维差 ≥1 分 → 第三人复评；未收敛记 `pending`」 |
| **G-13** V-1 段 ⑤ 与 V-12 的口径重叠（v7 新增） | V-1 写「五段…空集差」同时又写「⑤ 关键子句存在性（见 V-12）」——段 ⑤ 不做集合 diff，按「五段都 diff」实现会拿整段文本比 | 段 ⑤ | `S6-TC-H02`（键集恰 8 字段，不含子句）+ `J01`（子句存在性） | **已关（v8）**：`spec:204` 已写明「段 ⑤ 不做集合 diff（归 V-12）」 |
| **G-14** 议会 #3 的 32 族（本轮改动的总入口） | 前 13 条只覆盖「用例判别力」，不覆盖「spec 与 testcase 两件对读」的系统性缺口（P0 9 张同属「改判只改了被点名处」） | 32 族清单 | 本轮 62 张卡 → 32 族，逐族落在 v8 的 §0–§10 | **已处置**：族级台账见 `.session/reviews/2026-10-25-111619-s6-policy-parliament/problems.md` §一–§三；本文件每条改动的「来源」字段标注族号或 `spec:行号`。**v8 复评确认（v9 复核，2026-10-25）**：本节原记的两条 spec 侧缺口**均已闭合**——① `spec:124` 已写死「渲染与写入统一 `\n` + UTF-8 无 BOM，卡面 CRLF / BOM → `Mismatch`（不静默归一化）」，A09 随之由「二选一」收紧为「`Mismatch` 必红」；② `spec:112` 已写死不变量 8 的比较粒度 = **按空格切分的 token**（如 `git commit` 拆成 `git` / `commit`），B11 的 `:verb` 按 token 判。 |

| **G-15** ⑤ 段段名两写法（v9 复核新增） | 段名若只认一种写法，模板照抄另一种时切段会切空 → J01/J02/C01/C02 全条假红 | `agents/reviewer-audit.md:102` / `agents/detective-observer.md:61` 实测首行 = `越界后果与限度` | `SEG5 = /越[界权]后果与限度/`（`seg5` / `factsFromText` / `J01` 共用同一锚） | **已关（v9.1）**：spec §3.4 五段结构已统一为「越**界**后果与限度」（`spec:76`），与两张卡现文一致；只有 S5 spec §3.3 的历史原句写「越权」——锚点仍两写法都认，注释与报文以「越界」为准 |

**自由探索（固定清单之外，现场扫出的 5 个角落）**：
1. **配置层「零字符串」与 `artifacts` 文件名天然冲突**（`S6-TC-B13`）——v2 的解法是「登记 ID 白名单」：`round-check.md` 因登记在 `artifacts.mjs` 而放行，不是因「无 `/`」放行（否则 `'git status'` 一起漏）。
2. **`{{SEAT}}` 的显示名无处安放**（`S6-TC-D03`）——v2 已定「slug 在定义层、显示名在 `seats.mjs`」；模板固定文本里的 `` `producer` ``、六工具名（` / ` 分隔）与检测段命令在 v5 各有槽（`TIER` / `CAPABILITIES` / `DETECTION_CMD`），槽集扩到 12 个；残余（`--output` 括注 / 非本席产物名）见 §10.3。
3. **注入顺序依赖**（`S6-TC-A08`）——`replaceAll` 循环实现会让「后插入的槽」展开「先插入的值」，只有换序才能暴露；用定义层塞 `{{DENY_GROUPS}}` 可确定性复现。
4. **`policy --dump` 的「只读」是两条义务**（`S6-TC-F03` + `F04`）——不写盘 + 不接受写盘类 flag；只测前者会留下「未来顺手实现 `--out`」的口子。
5. **「其余 N 席零变化」必须派生**（`S6-TC-E02`）——写死 13/14 会在加席当天必红（S5 E07 `37/37` 同形）；v2 后口径改为「登记席集合派生 + 卡面零变化另测」。

## 8 给开发的建议

**状态（v8 复核，2026-10-25）**：**11 已闭合**（`spec:169` §6 步骤 0 ①–⑤）；**12 已闭合**（`spec:214` V-11 = 判据层）；**13 已闭合**（`spec:258` 分歧仲裁）；**14 已闭合**（`spec:25` / `spec:118` / `spec:297` 统一为「字节相等 = 最好情况与定位线索，不作判据」）；**4 已闭合**（`spec:94-96` 清单类 / 单点类分治 → 无需新槽）；**9 部分闭合**（`expanded` 12 槽 + 顺序已写死，仍未给 `text` 字段 → F02 的段级比对仍走 `renderBoundary`，不阻塞）。

**状态（v7 复核，2026-10-25）**：新增建议 **11–14**，其中 **11 / 14 为 P0**——11 = 基线抽取器落点与「不得 import 定义层」未写（不写则「空差」恒真，判据归零）；14 = spec 内三处旧「逐字节」口径（§3.1 ④ / §6 步骤 3 / §11.3 D4）与 §2 第 2 条 / V-2 冲突，施工者会照旧口径停手。12 / 13 为 P1（V-11 的「拦」在哪一层、双实例分歧如何仲裁）。

**状态（v5 复核，2026-10-25）**：**1 / 2 / 5 / 6 / 10 已被 spec 采纳**（依次落到 §3.5 不变量2 + §8 V-3 的 closed-world、§3.6 + §6 步骤 3 的 sha256 黄金、不变量3 的「slug + `seats.mjs` + `host` 哨兵」、§3.6 的 13/12 两口径说明、§3.6「只收 2 席」+ V-8 度量层改渲染层）；**3 已全采纳**（波及面列全到四处 + §7 写明 `Mismatch` 与 `RenderNotEquivalent` 的分工**与发射者**；**D02 已按新分工改判 `Mismatch`**，D01 / D05 已按「该码不是 CLI 码」改判）；**4 已采纳（v5 收尾）**（v4 删字符型谓词、槽集扩到 11；v5 再补第 12 槽 `DETECTION_CMD`、写死成员类别含产物名与「整项相等」粒度；**残余**：允许段括注的 `--output`、非本席产物名仍无槽 → §10.3 第 2 条）；**7 未采纳**（未定义槽位错误码，归 §10.3 不作为阻塞）；**8 以「沿用 S5 既有断言」收口**（spec §11.7 第 6 条：`agentData` 自带 boundary 的守卫由 `DECLARED_SLOT_SEATS` 派生自 `boundaryBySeat` 的既有断言守，本 spec 不重复造；G-8 状态随之更新）；**9 部分采纳**（`expanded` 已写死为 **12 个槽值**、顺序 = §3.4 表顺序 —— §10.1 第 5 条闭合；但仍**未给 `text` 字段** → F02 的段级比对仍走 `renderBoundary`）。

| # | 位置（文件:行 / spec 节号） | 风险或盲点 | 为什么会被忽略 | 具体改法 | 优先级 |
|---|---|---|---|---|---|
| 1 | spec §8 V-3 / §3.5 不变量2 | V-3 只判「`/`、反引号、`--flag`」，配置层塞 `'git status'` 全不命中 → 命令文本仍可回流 | 三条探针看起来已覆盖三类形态，没人想到「裸命令」是第四类 | V-3 判定改为 **closed-world**：配置层所有字符串字面量必须 ∈ 定义层 ID 集合（capability / group / artifact / 席名 / `seat:<名>.extra`），越界即 `LiteralInConfig`；三条探针保留为快速失败。验收：`S6-TC-B02`（closed-world 正例）绿，且删掉该实现时 `B14` / `B15` 红 | P1 |
| 2 | spec §3.6 / §6 步骤 3（黄金断言） | 「与现常量逐字节相等」若落成全文 fixture（两个 `.txt`），等于制造第 6 份副本 —— 与 V-7 的「副本收敛」自相矛盾 | 等价迁移最直觉的写法就是「把旧句存进 fixture 做黄金」 | 黄金只存 **sha256**：`tools/docgen/fixtures/boundary-golden.json = { "reviewer-audit": "<hex>", "detective-observer": "<hex>", "defaultBoundary": "<hex>" }`，由施工步骤 1 用改造前常量计算并提交（spec v2 只取前两键；`defaultBoundary` / `evidenceReader` 见 §10-8。**v4 §5 已把 4 个键名写死为连字符形式**：`default-boundary` / `evidence-reader-boundary`，落地以 v4 为准）。验收：`S6-TC-C01/C02/G03` 绿，且 `E03` 的副本集合仍为 3 文件 | P1 |
| 3 | spec §3.6（`BOUNDARY_COMMAND` 删除）/ 与 §7 `RenderNotEquivalent` | （v1 时）§3.6 只点 `B08`；实测 `tools/docgen/test/tool-tiers.test.mjs:12` import 该常量、`:721-723`（S5-TC-E05）断言它非空 → 删常量后整个文件 import 失败（0 用例）；另 §7 新增 `RenderNotEquivalent` 与现 `gate` 报 `Mismatch` 的职责边界未写 | 常量的「生产者」清了，「消费者」散在两个文件里，grep 才会发现 | §3.6 增两句：① 「同批改 `tool-tiers.test.mjs:12` 的 import 与 S5-TC-E05（改为断言 `renderBoundary('reviewer-audit')` 非空）」；② 「`gate` 中『渲染 ≠ 盘上』一律报 `RenderNotEquivalent`（`Mismatch` 保留给其它比对路径）」。验收：`S6-TC-G04`、`D02` 绿 | P1 |
| 4 | spec §3.4 纯度守卫「模板内不得出现任何 `/` 路径、反引号命令、`--flag` 字面量」 | 「反引号命令」谓词未定义：`` `producer` 档 `` 这类强调会被误判；裸 `curl` 会被漏判 | 「反引号 = 命令」是口语约定，写进校验才需要精确谓词 | 定义为两条：① 反引号内文本若以 `git ` / `npm ` / `node ` / `set ` / `export ` / `curl ` 开头 → 命令（判红）；② 反引号内为单词（无空格、无 `/`）→ 强调（放行）。写进 §3.4 与 `TemplateImpure` 的判定说明。验收：`S6-TC-C04` 红、`` `producer` `` 样例绿 | P2 |
| 5 | spec §3.5 不变量3 与 §3.4 `{{SEAT}}` 槽 | 「定义层不得出现席名」没有区分 slug 与显示名：若含显示名（`审计`/`侦探`），`{{SEAT}}` 的值无处可取；若只含 slug，显示名必须另有来源 | 两条要求写在相隔两节的位置，读单节都自洽 | §3.5 #3 改写为「定义层不得出现 **席名 slug**（`agentData[].name`）」；§3.4 补一句「`{{SEAT}}` 取 `definitions/seats.mjs` 的显示名映射，模板不内联中文」（spec v2 已按后者采纳；落地形态见 `S6-TC-D03`）。同时把 §7 `UnknownPolicyRef` 的 `<类别>` 词表固定为 `capability\|group\|artifact`。验收：`S6-TC-D03` 绿且 `C06` 输出含「审计」二字 | P0 |
| 6 | spec §8 V-8「另 13 席零变化」/ `patternRegistry.mjs:9` 注释 | 实测 15 席 = 2 producer + 1 evidence-reader（自带边界）+ 12 default；「13」是 15−2 的旧口径，把 evidence-reader 误算进 default 组；写死数字会在加席当天必红 | 数字在 spec 与代码注释里各写一份，且都不参与运行 | 两处都改成派生表述：「其余席 = `agentData.length − 1`（`DEFAULT_BOUNDARY` 的实际消费席 = `agentData.length − Object.keys(boundaryBySeat).length − 1`）」。验收：`S6-TC-E02` / `G03` 绿；grep `13 席` 在该两文件 0 命中 | P2 |
| 7 | spec §3.4（未知槽位）/ §7（六码表） | 模板槽名拼错时无指定行为：可能静默输出 `{{SEAT_LABEL}}` 进卡面 | 六码表看起来「已经覆盖模板问题」（`TemplateImpure` 只管字面量） | 二选一并写进 §3.4：① 复用 `TemplateImpure`（首行片段 = 未知槽名）；② 新增 `UnknownSlot` 并同批加进 `validateAgentData.mjs` 的 `EXIT` 映射（exit 1）。推荐 ①（不扩码表）。验收：`S6-TC-C07` 绿（抛错或输出无 `{{`） | P2 |
| 8 | `tools/docgen/components/agentData.mjs:263-265` | `...s` 在 `boundaryBySeat` 之后：任何条目自带 `boundary` 会静默覆盖 `renderBoundary` 的产出（S5 D10 的同形问题） | 现只有 `evidence-reader` 自带（合法，§2 划定不动），所以「暂时没问题」；加席时会踩 | 在 §3.6 增一句「`agentData` 条目除 `evidence-reader` 外不得自带 `boundary`」，并加断言（可为 `S6-TC-G03` 的一条附加断言：`agentData.filter(a => a.boundary && !own.has(a.name)).length === 0`）。验收：给任一条目加 `boundary` 时该断言红 | P2 |
| 9 | spec §5 `policy --dump` 输出形状 | `seats[席].expanded` 是「数组」还是「文本」未写死：数组拼回时如何连接（`, ` / `、` / `\n`）不定 → F02 的比对口径会漂移 | 「dump 只是给人看」——但审计与测试都要**复算** | §5 明确 `seats[席] = { expanded: string[] }` 且**另给** `text` 字段（= `renderBoundary(席)` 原文）；`expanded` 仅作槽级明细。验收：`S6-TC-F01/F02/F05` 绿 | P1 |
| 10 | spec §8 V-8 与 V-2（G-9） | 若为满足 V-8 让 `agentData` 对所有席改走 `renderBoundary`，12 个 default 席的边界句会从手写 `DEFAULT_BOUNDARY` 变成模板输出 → 12 张卡全变，V-2 直接失败 | V-8 说「只影响该席」，读起来与「让所有席都走渲染」不矛盾；冲突只在实现层出现 | 二选一：① **推荐**——`agentData` 仍只对 `boundaryBySeat` 登记的席取值（`renderBoundary` 只在登记席生效），V-8 的影响面在 `renderBoundary` 层量（E02 已按此写）；② 要求模板对「零组零产物席」的输出逐字等于 `DEFAULT_BOUNDARY`，并把该句加入 `boundary-golden.json`。验收：`S6-TC-G03`（12 席 == `DEFAULT_BOUNDARY`）+ `E02`（只一席变）同时绿 | P0 |
| 11 | spec §6 步骤 0（基线导出）/ 新增 `tools/docgen/test/support/capability-baseline.mjs` | v7 的「空差」判据若两端同源则**恒真**（从 HEAD 导基线、或抽取器 import `policy/`），而 spec 只写了「从**未改**的 commit 导出」，没写抽取器落点、也没写「不得依赖定义层」 | 「从改造后导出」是最省事的写法，且它产生的 diff 永远是空的——没有任何迹象表明判据已失效 | ① 把抽取器落点写进 §5 布局（`tools/docgen/test/support/capability-baseline.mjs`）；② 写一句「抽取器只读 `git show <sourceCommit>:agents/*.md`，**不得 import `policy/`**」；③ 基线 JSON 必须带 `sourceCommit`，并写「该 commit 上不得存在 `policy/`」作为改造前标志。验收：`S6-TC-H01` / `H07` 绿 | **P0** |
| 12 | spec §8 V-11「使用 → 不被拦 / 必判红」 | v7 没写「拦」发生在哪一层：平台无参数级授权位（§10 第 1 条），若读成运行时拦截，V-11 永远不可能绿；判据层实现才能落地 | 「拦」这个词天然指向运行时；而 §10 又说不测平台拦截，两处对读会卡死 | §8 V-11 补一句：「本条的『拦 / 不拦』= **判据层**（配置校验 + 渲染可指涉 + 报错码），不是运行时授权；运行时行为见 §10 第 1 条（不测）」。验收：`S6-TC-I01/I02` 与 §10 不自相矛盾 | **P1** |
| 13 | spec §9.1 / §9.2（双实例） | 「两份各 2 个独立实例」没说两实例分数不一致怎么办；差 1 分就足以让「逐维 B ≥ A」翻盘，没有仲裁等于取高者 | 多人评分场景下「取高」是默认习惯，且看起来对改后有利 | §9.2 补一句仲裁规则：「同卡同维两实例差 ≥1 分 → 第三人复评（回读卡内原文）；未收敛前该维记 `pending`，不得给分」。验收：`S6-TC-K07` 绿；`ab-score.md` 有分歧记录 | **P1** |
| 14 | spec §3.1 ④「与改造前逐字节相同（gate 守）」/ §6 步骤 3「不等则停」/ §11.3 D4「做不到等价即失败」vs §2.2 / V-2 | v7 把 V-2 降为辅助，但**这三处仍把「逐字节相等 / 等价迁移」写成失败判据**——施工者照 §6 步骤 3 会在「措辞变了但能力没丢」时停手，与 §2.2 直接冲突 | 改判只在 §8 写了一处，散在 §3.1 / §6 / §11.3 的旧口径没同步；读单节都自洽 | 三处统一改为：「产物层字节相等是**最优结果与定位线索**；不作通过判据；通过判据 = §8 V-1 空差 + V-13 盲评」。`RenderNotEquivalent` 保留为施工期**定位警报**（提醒回看 diff），不写成失败结论。验收：spec 内 `grep '逐字节' / '等价即失败' / '不等则停'` 三处口径一致；`S6-TC-C01/C02/G01/H06/J03` 与 spec 无冲突 | **P0** |

## 9 自检

**A. `spec-testcase-gate` 五条判据逐条打勾**

| # | 判据 | 结论 | 证据 |
|---|---|---|---|
| 1 | 文件存在（同目录、命名 = spec 文件名 + `-testcase.md`） | 过 | `docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design-testcase.md` |
| 2 | 编写者独立（`senior-sdet` 全新上下文，≠ spec 作者、≠ 施工者）+ 文件头「编写者 / 独立性声明」 | 过 | 文件头 `:6`（编写者 + 独立性声明）+ `:8`（第八轮复核人 = 全新实例，仅改 testcase） |
| 3 | 用例九要素齐；负例 + 边界 ≥ 正例；覆盖总表每行指回 spec 编号 | 过 | §2 每条含覆盖 / 来源 / 前置 / 步骤 / 预期 / 判据 / 红绿证据 / 对应测试 / 不覆盖；计数见 B；§1 每行「覆盖的 spec 条目」列均带 V/§/不变量编号 |
| 4 | spec 外链在位，spec 不内联用例 | 过 | spec `:5` 写「测试用例文件：`2026-10-25-docgen-policy-single-source-design-testcase.md`」；spec §9 只写「测什么 / 为什么」，无用例表 |
| 5 | 与 spec 一起送审（开卷清单两件并列） | 待送审时执行 | 本条由议会开评时核，不在本文件内自证 |

**B. 计数（可复算：按 `### S6-TC-` 标题数 + §1「类型」列统计）**

| 项 | 数量 | 明细（复算口径：`Select-String -Pattern '^### S6-TC-'` 计数 = 78；按 §1「类型」列分组计数） |
|---|---|---|
| 用例总数 | **78** | A 组 **9** + B 组 15 + **C 组 9** + **D 组 6** + E 组 7 + F 组 6 + G 组 5 + **H 组 7 + I 组 3 + J 组 3 + K 组 8** |
| 正例（N1） | **27** | A01-A05（5）、B01/B02/B11（3）、C06（1）、E01-E06（6）、F01/F02/F06（3）、G02/G03（2）、**H01/H02（2）、I01（1）、J01（1）、K01/K02/K05（3）**（C01 / C02 / G01 于 v7 由「正」改判为「边界」，因 V-2 降级） |
| 负例（N2） | **28** | B03-B10（8）、B14/B15（2）、C03-C05（3）、**C09（1，v9.2 新增）**、D01-D03（3）、**D06（1，v9.7 新增：`gate` 侧接线）**、F03/F04（2）、**H03/H04/H05/H07（4）、I02（1）、J02（1）、K03/K08（2）** |
| 边界（N3） | **23** | A06-A09（4，**A09 = v8 新增 CRLF/BOM**）、B12/B13（2）、C07/C08（2）、D04/D05（2）、E07（1）、F05（1）、G04/G05（2）、**C01/C02/G01（3，V-2 降级）、H06（1）、I03（1）、J03（1）、K04/K06/K07（3）** |
| 负例 + 边界 | **51** | 51 ≥ 27（N1）→ **硬门通过** |
| 条数上限 | **78** ≤ 80 | 满足 spec 头部「testcase ≤80 条」 |

**B-复算（v9.4 实测，命令 + 输出可复算）**：① 标题计数 `node -e "const t=require('fs').readFileSync('<本文件>','utf8');console.log((t.match(/^### S6-TC-/gm)||[]).length)"` → **77**；② 按 §1「类型」列分组（`split('|')` 取第 4 列）→ `{ '正': 27, '负': 27, '边界': 23 }`，行数 77、无重复 ID；③ 九要素齐全性（逐 `### S6-TC-` 段检查 9 个字段）+ 负+边界 **50 ≥ 27**、**77 ≤ 80** → 全过。**本轮（v9.4）未增删用例**（只改判据 / 加负例断言，不新增用例 ID），故 §3 汇总的 77 / 50 / 27 与本表同源。

**B-复算（v9.7 实测，命令 + 输出可复算）**：`S6-TC-D06` 为第十六轮新增（`gate` 侧接线，议会 #3 第 4 轮后端卡 Q-4-BE-01，依据 `spec:196` / `:161`）→ ① 标题计数 → **78**；② 按 §1「类型」列分组 → `{ '正': 27, '负': 28, '边界': 23 }`，行数 78、无重复 ID；③ 负+边界 **51 ≥ 27**、**78 ≤ 80**；④ 九要素（覆盖 / 来源 / 前置 / 步骤 / 预期 / 判据 / 红绿证据 / 对应测试 / 不覆盖）逐段核 78 段全齐。§3 汇总的 **78 / 51 / 28** 与本表同源。

**B-复算（v9.9 实测，命令 + 输出可复算）**：① 标题计数 `node -e "const t=require('fs').readFileSync('<本文件>','utf8');console.log((t.match(/^### S6-TC-/gm)||[]).length)"` → **78**；② 按 §1「类型」列分组 → `{ '正': 27, '负': 28, '边界': 23 }`，行数 78、无重复 ID；③ 负+边界 **51 ≥ 27**、**78 ≤ 80**；④ 九要素逐段核 78 段全齐。**本轮（v9.9）未增删用例**：只在 B11 / A08 / D01 / C03–C05 / K05 的既有用例内加断言与负例（B11 +`:not-allowed` 一例、A08 +单趟替换一例、D01 +`:not-allowed` 后缀 + `assertReportPath` 四条合成负例、K05 +隔离两条），故计数与 §3 汇总同源。

**C. 覆盖总表逐行可回溯**：§1 共 78 行，每行「覆盖的 spec 条目」列均落在 spec v8 的 §1 / §2 / §3.1–§3.7 / §5 / §6 / §7 / §8（V-x）/ §9.1 / §9.2 / §10 / §11.3 之一，**零行**只写章节名而不带编号。

**D. 未覆盖项与理由**：**V-1～V-13 全部有用例**（对照见 §1 末「覆盖核对」；其中 **V-2 为辅助定位、不作通过判据**，由 H06 判定表锁死）。§7 六码全部有对位（`ForbiddenGroupGranted` 三种后缀分别落在 B09 / B10 / B11）。§3.5 **九条**不变量各有 ≥1 用例，1–8 各 ≥1 负例、9 的负例在 B01 ⑦（D04 用机器判据核）。范围外项（平台参数级授权、语义严度、`outputFormats` / `sharedBlocks`、`DEFAULT_BOUNDARY` / `evidence-reader` 改造、运行时行为、S6-B 账本模板、A/B 的「审美」部分）已在 §6 逐条给出理由与去向；`DEFAULT_BOUNDARY` / `evidence-reader` / `senior-sdet` 保留「不变 / 不注入」断言（G03），不算未覆盖。**AI 判部分有明确边界**：K 组的「打分 / 仲裁」是 AI 判，机器只核字段 / 证据行 / 比较规则（K07 有显式声明）；另见 §5 的两条人工项。

**E. 九要素抽查（首尾各一条）**：`S6-TC-A01`（首）与 `S6-TC-K08`（末）均含覆盖 / 来源 / 前置 / 步骤 / 预期 / 判据 / 红绿证据 / 对应测试 / 不覆盖，共 9 个字段。

**F. 本文件的已知边界**：本文件不写实现代码；「对应测试」中 `tools/docgen/policy-pure-source.test.mjs` 尚未创建，落点由 plan 的 Task 决定（当前一律标「待 plan Task N」——这是允许的唯一占位形态）。**15 条缺口（G-1～G-15）均在 §7 登记**：G-1 / G-2 / G-3 / G-4 / **G-5 / G-6**（v8 关闭）/ G-7 / G-8 / G-9 / **G-10～G-13**（v8 关闭）/ **G-14 = 议会 #3 的 32 族入口**（已处置；两条 spec 侧项经 `spec:124` / `:112` 闭合）/ **G-15 = ⑤ 段段名两写法**（v9 新增；**v9.1 已关**：`spec:76` 统一为「越界」）。第二轮 11 条（§10）全闭合；第三轮 8 条（§10.1）全闭合；第四轮 3 条（§10.2）：第 1 / 3 条闭合、第 2 条由 v8 关闭；第五轮 1 条（§10.3 第 6 条）已于 spec v6 闭合；第六轮（v7）8 条见 **§10.4（v8/v9 已加状态列）**；第 2 轮后端 **3 条（§10.5：11-1 两端字典来源 / 11-2 `TIERS` 形状 / 11-3 抽取器模块职责边界）全闭合**——11-1 / 11-2 经 `spec:169` / `spec:53` 于 v9.3 闭合，11-3 经 `spec:155`（两入口）/ `spec:169`①（唯一实现）于 v9.4 闭合（testcase 按「同一模块两入口、测试只 import」落地，见 §0.3 / §0.4）。

## 10 需 spec 再改（第二轮交付；v4 闭合状态见 §10.1 状态列，第四轮残余见 §10.2，v5 处置见 §10.3，第 2 轮后端残余见 §10.5）

> **行号口径（v9.4，历史时点）**：本文件正文（§0–§9）、§7 的缺口状态、§10.4「状态（v8 复核）」列、§10.5 结论的 `spec:行号` 一律按 **spec 当时版本（该轮正文 308 行、`node` 复算 `split(/\r?\n/)` 长 309；现行 313 行 / 长 313，见下一行口径）**逐条校正（v9.4 整体重校一遍，并逐条回读 spec 对应行确认）：V-1 → `:202`、V-2 → `:203`、V-5 → `:206`、V-6 → `:207`、V-7 → `:208`、V-8 → `:209`、V-11 → `:212`、V-12 → `:213`、V-13 → `:214`、§3.4 槽 10 → `:89`、槽 11 → `:91`、槽集 12 → `:76`、`expanded` 12 槽 → `:162`、四本账单 → `:239`、`checklist.md` 行 → `:246`、评分规则 → `:250`、置信度 → `:252`、改分纪律 → `:254`、D4 → `:293`、`DECLARED_SLOT_SEATS` → `:121`、不变量 1 → `:105`、不变量 7 → `:111`、**`TIERS` 导出名 / 值与同引用 → `:53`**、**§6 步骤 0 ④ 两端字典来源 → `:169`**、**抽取器两入口 → `:155`**、**模板读取失败承诺 → `:195`**、**黄金「当前比对键」→ `:196`**。§10.1 / §10.2 / §10.3 的「spec 现状为什么不够」与「状态（v4/v5）」列是**当时版本的原句与当时行号**（`spec:` 前缀的已随本轮整批指针同步；`:NNN` 简写属历史视角，按 `docs-convention` 不改写）——核当前证据请看正文、§10.4 状态列与 §10.5 的 v9.3 / v9.4 结论。
> **行号口径（v9.9，按内容重校）**：spec 现行文 **313 行**（`node` 复算 `split(/\r?\n/)` 长 313）；本轮**逐条回读 spec 对应行确认**后再改，映射如下（旧 → 新）：V-1 `:203`→`:204`、V-2 `:204`→`:205`、V-5 `:207`→`:208`、V-6 `:208`→`:209`、V-7 `:209`→`:210`、V-8 `:210`→`:211`、V-11 `:213`→`:214`、V-12 `:214`→`:215`、V-13 `:215`→`:216`、当前比对键 `:196`→`:198`（**同一 token `spec:196` 在本文件里有两种含义：`gate` 侧接线仍 = `:196`，当前比对键 = `:198`，已按内容逐处分开**）、四本账单 `:240`→`:241`、`checklist.md` 行 `:247`→`:248`、评分规则 `:251`→`:254`、置信度 `:253`→`:256`、改分纪律 `:255`→`:258`、D4 `:294`→`:297`；`spec:52`–`spec:195` 段（含 `:169` / `:172` / `:161` / `:162` / `:165` / `:191` / `:195`）与 §3.4 槽表、§3.5 九条不变量逐行回读后**与原引用一致、不改**。新增引用：报文路径口径 → `:197`、盲评隔离 → `:252`。全文 305 处 `spec:行号` 中改 **82 处**、保留 5 处 `spec:196`（`gate` 侧接线）。
> **建议（只记录，不改 spec）**：**「行号引用」本身就是漂移源**——同一份文件里 V-1 已先后出现 `:202`（§10 行号口径 v9.4）/ `:203`（正文 v9.8）/ `:204`（现行文）三代，而 `spec:196` 一处 token 承载两种含义（`gate` 接线 / 当前比对键）已经造成过误引。根治办法不是每轮重校行号，而是**改锚点形态**：spec 与 testcase 之间的引用一律以「章节号 + 条号」为主键（如 `§8 V-1③`、`§3.5 #8`、`§7 注 3`），`spec:行号` 只作**可选定位辅助**且不参与判据。建议下一版 spec 在 §7 / §8 的每个条目上加稳定 ID（如 `V-1.3`、`E-197`），使 testcase 可以只引 ID。
> 用途：本文件只能写 testcase，spec 缺口不回改 spec。下列每条给出「卡在哪条用例 → 具体改法 → 验收」，供主 agent 回到 spec 时直接采用。
> 判据：P0 = 用例之间不可能同时绿（实现无法同时满足两条）；P1 = 两套合理实现会给出不同归码/不同断言目标；P2 = 文档或字段形态约定。
> **v4 提示**：下表是第二轮原文（留作历史）。逐条闭合核验见 **§10.1 的「状态（v4）」列**；v4 仍未闭合/部分闭合的项与第四轮新发现见 **§10.1 + §10.2**。
> **v5 提示**：§10.1 第 1 / 2 / 5 条与 §10.2 第 1–3 条已在 v5 处置，逐条结论与仍开项见 **§10.3**；三处冲突时以 §10.3 最新为准。

| # | 卡在哪条（spec 节） | 用例为什么无法与 spec 自洽 | 具体改法（可直接采用） | 验收 | 优先级 |
|---|---|---|---|---|---|
| 10-1 | spec §3.4 槽表 + 纯度守卫 | 现两句边界句的**固定文本**含：`` `producer` ``（反引号）、`Read / Glob / Grep / Write / Edit / RunCommand`（` / ` 分隔）、`.session/reviews/<本次>/` 与 `docs/superpowers/reviews/<本次>/`、`skills/dev-workflow/references/gate-record.md`（路径），以及两席不同的固定子句（「、审计表」/「（轮初 / 轮末快照原文、观察记录、比对结论）」/「且本席不核签」）。7 个槽无法产出这些片段 → 模板若照抄则纯度守卫判红，若删字面量则卡面字节变（V-2 红） | 在 §3.4 槽表补：`{{TIER}}`（`producer`）、`{{CAPABILITIES}}`（以 ` / ` 连接）、`{{LEDGER_PREFIX}}`、`{{GATE_RECORD_PATH}}`、`{{SEAT_CLAUSE}}`（席专属固定子句，落 `definitions/artifacts.mjs` 或 `seats.mjs`），或等价地把「固定片段」登记为定义层数据；同时把纯度守卫改为「模板里的 `/` 路径与反引号内容必须 ∈ 定义层已登记值 ∪ §3.4 固定片段白名单」 | `C06` 的槽集断言与 `C01/C02` 的 sha256 同时绿；`C03/C04/C05` 注入仍红 | **P0** |
| 10-2 | spec §3.4「反引号命令」 | 谓词未写死：现句固定文本自带 `` `producer` ``，按「任何反引号」执行则合法模板必然判红（`C03/C04` 与 `C01/C02` 互斥）；按「任何反引号都放行」则 `C04` 永绿 | §3.4 写死谓词：反引号内文本以 `git ` / `npm ` / `node ` / `set ` / `export ` / `curl ` 开头 → 命令（判红）；反引号内为单词（无空格、无 `/`）→ 强调（放行） | `C04` 注入反引号命令红；`` `producer` `` 样例绿；`C01/C02` 哈希不变 | **P0** |
| 10-3 | spec §3.5 不变量1 / 不变量2 / §7 | 两条判据对「三键内的值」重叠：`allowGroups: ['git status']` 同时命中 `LiteralInConfig`（不变量2）与 `UnknownPolicyRef`（不变量1）；`artifacts: ['snapshot.md']` 与 `['definitions/x.mjs']` 归码不明 | §7 补判定优先级：① 形态不合 ID 谓词（含 `/`、反引号、空格、`--`，即 A07 谓词不过）→ `LiteralInConfig`；② 形态合法但未登记 → `UnknownPolicyRef`；③ 已登记但属禁止组 / 他席席级组 → `ForbiddenGroupGranted` | `B03-B05/B14/B15` → `LiteralInConfig`；`B06-B08` → `UnknownPolicyRef`；`B09/B10` → `ForbiddenGroupGranted` | P1 |
| 10-4 | spec §3.2 / §3.3 席级组 | 席级组 `seat:<slug>.extra` 的**定义层登记位置与形态**未写（§3.2 只有 3 个允许组 + 5 个禁止组）：`B10`「先确保该组已存在」无处落地；`B02` 的 closed-world 允许集无据 | `commands.mjs` 增 `seatGroups`（键 = `seat:<slug>.extra`，值同组结构 `{purpose, verbs}`），`policy --dump` 的 `commands` 合并输出；§3.3 注明「席级组在定义层登记，配置层只引用」 | `B10`/`B11` 副本内新登记后可跑；`B02` 的 `ALLOWED_LITERALS()` 含 `CMD.seatGroups` 键 | P1 |
| 10-5 | spec §3.5 不变量3 的判定范围 | 「定义层的席名指 slug、权限授予不得按 slug 硬编码」未划范围：`artifacts.mjs` 的 `owner: 'reviewer-audit'` 是**归属**字段（合法），若按「任何位置出现 slug 即红」执行则合法定义层必红 | §3.5 #3 补一句：「判定范围 = 权限授予面（`capabilities` 键、`commands` 组与 verbs、`paths` 组与 items 的 `purpose`）；`artifacts.mjs` 的 `owner` 属归属，其值必须是已登记 slug，不视为权限授予」 | `D03` 静态段绿（`artifacts.owner` 不报 `SeatNameInDefinition`），注入 `paths.mjs` 仍红 | P1 |
| 10-6 | spec §5 文件布局 + 导出名 | §3.5 不变量3 / §3.6 引用了 `definitions/seats.mjs`，但 §5 布局只列 4 个定义文件 → `E07` 的文件集断言无据；导出名未定 → `B02`/`D03` 无法写判据 | §5 布局加 `definitions/seats.mjs`，并定导出名 `SEAT_NAMES`（slug → 显示名，含两 producer 席的「审计 / 侦探」；其余席可后补） | `E07` 文件集含 `definitions/seats.mjs`；`D03` 的映射断言可写 | P1 |
| 10-7 | spec §5 `policy --dump` 形状 | `seats[席] = { expanded:[…] }` 未说明 `expanded` 是「槽值数组」还是「整段渲染文本」→ 无法判断「按 dump 复算展开结果」怎么比（`F02` 只能按槽级可核写） | 二选一写进 §5：① 明确 `expanded` = 七个槽的展开值数组（顺序同 §3.4 槽表），另给 `text` = `renderBoundary(席)` 原文；② 明确 `expanded` = 整段文本。推荐 ① | `F01`/`F02`/`F05` 绿；`F02` 若给了 `text`，追加一条「`text` == `renderBoundary`」断言 | P1 |
| 10-8 | spec §3.6 黄金表内容 | §3.6 只写两 producer 席的 sha256；但 V-1 要断「`DEFAULT_BOUNDARY` 的 12 席与 `evidence-reader` 边界句不变」（`G03`），两处哈希无来源 | `boundary-golden.json` 增两键：`defaultBoundary`、`evidenceReader`（仍只存 sha256，不违反 V-7） | `G03` 的 `golden.defaultBoundary` / `golden.evidenceReader` 断言可执行 | P2 |
| 10-9 | spec §3.6 波及面清单 | 只列代码三处（`:12` import / `S5-TC-B08` / `S5-TC-E05`），未列**文档侧**残留：S5 spec `:19,45,119,161,162,227,239` 仍写「`BOUNDARY_COMMAND` 非空 / 三常量同处一文件」，S5 testcase 的 `S5-TC-B08`/`E05`/`B14` 条目同样以该常量为判据 → 删常量后成死指令 | §3.6 增一句：「S5 spec 与 S5 testcase 中对该常量的引用同批改判为 `renderBoundary` 口径（属路径/名称同步，不改结论）」；或明写「这两份文档的对应条目按存量例外不改，但需加一行『已停用』指针」 | `G04` 的 `git grep` 范围扩到 `docs/superpowers/specs/2026-10-25-s5-*` 后 0 命中（或指针在位） | P2 |
| 10-10 | spec §3.5 不变量2「三键之外零字符串」 | `SEAT_POLICY` 的**对象键**（`'reviewer-audit'` 等席 slug）本身就是字符串字面量，且不在三键的值集合内 → 按字面执行会把合法配置判红（`B02` 的 closed-world 差集非空） | §3.5 不变量2 补一句：「对象键 = 席 slug，必须 ∈ `definitions/seats.mjs` 的 `SEAT_NAMES`；`__default__` 为保留键——两类键不视为违规字面量」 | `B02` 的 `strays` 为空（真实配置），且把某席键改成未登记 slug 时 `UnknownPolicyRef` 或 `SeatNameInDefinition` 先红 | P2 |
| 10-11 | spec §3.6 / §7（`RenderNotEquivalent` 与既有 `Mismatch`） | 现有 `gate` 对「渲染 ≠ 盘上」报 `Mismatch`；§7 新增 `RenderNotEquivalent` 但未写谁报哪个码 → `D02` 的断言目标二选一，实现与用例会各选一个 | §3.6 或 §7 补一句：「`gate` 中『渲染 ≠ 盘上』一律报 `RenderNotEquivalent`（附首处差异行）；`Mismatch` 保留给其它比对路径」 | `D02` 首行固定为 `RenderNotEquivalent: <席>:<差异行>`；`G05`/`E01` 仍只断退出码 | P1 |

### 10.1 第三轮核验：8 条的 v4 处置状态（按阻塞度排序）

> 口径：只有「spec 原文能指到落地句」才算闭合。**本表「现状为什么不够」列保留第三轮原文（历史视角，不改写）**；**新增的「状态（v4）」列 = 第四轮逐条核 spec v4 的结论**，依据句写在状态格里（spec:行号）。部分闭合 / 不闭合的项**不删**，由此产生的残余与新发现在 §10.2。**v5 增量见本节末（表内状态列保留 v4 结论，不改写）。**

| # | 卡在哪条（spec 节） | spec 现状为什么不够（第三轮视角） | 具体改法（可直接采用） | 验收 | 优先级 | 状态（v4 复核） |
|---|---|---|---|---|---|---|
| 1 | §3.4 槽表 + 纯度守卫（`C01` / `C02` / `C06`） | 白名单解决了「固定文本可留」，但**槽集仍只有 7 个**，而现两句固定文本里还含定义层成员：`Read / Glob / Grep / Write / Edit / RunCommand`（`capabilities.mjs` 成员）、检测限度段的 `.superpowers/` 与 `lessons/`（`paths.mjs` 成员）、允许段括注的 `--output`（`fs.write` verb）。按规则 1「白名单项不得与定义层任何成员重叠」，这些片段**既不能进白名单、也没有槽可放** → 模板要么判 `TemplateImpure`、要么删字面量使卡面字节变（V-2 红）。规则 1 的「重叠」也没定义成「整项相等」还是「包含」 | ① 补槽：`{{TIER}}`（`producer`）、`{{CAPABILITIES}}`（以 ` / ` 连接）、`{{SEAT_CLAUSE}}`（席专属子句：审计「、审计表」／侦探「（轮初 / 轮末快照原文、观察记录、比对结论）」与「且本席不核签」）、`{{DETECTION_NOTE}}`（检测限度段）；② 或把规则 1 改写成「白名单项不得**等于**定义层成员，且模板中出现的定义层成员必须能追到某个槽位」；③ 同步把 `C06` 的「槽集恰 7 个」改为「槽集 ⊇ 必需槽且 ⊆ 已声明槽」 | `C01` / `C02` 的 sha256 与 `C06` 同时绿；`C03`–`C05` 注入仍红 | **P0** | **部分闭合**：槽集已扩到 **11**（`:72-86`，新增 `TIER` / `CAPABILITIES` / `SEAT_CLAUSE` / `DETECTION_PATHS`，各槽有取值来源），纯度方向改为「成员不得以原文出现、只能经槽注入；白名单只登记非成员」（`:88-91`）→ 第三轮点名的三类已有槽。**仍缺槽的三处成员**：检测段命令 / 允许段括注的 `--output` / 非本席产物名 → §10.2 第 1–2 条 |
| 2 | §3.5 不变量6 + §7 `TemplateImpure` 行（`C03`–`C05`） | §3.4 已删字符型谓词，但 §3.5 #6 仍写「模板含路径 / 命令字面量 → `TemplateImpure`」、§7 报文行仍写「模板含路径/命令字面量」——按字面执行仍是「见字符就红」，会与白名单（账本前缀、`gate-record.md`）冲突 | 两处都加限定：「按 §3.4 的 closed-world 白名单口径判定」 | 同一条注入在 §3.4 与 §3.5/§7 三处得到同一结论 | P1 | **不闭合**：§3.5 #6（`:103`）已改为「按 §3.4 口径」，**但 §7 的「触发」列（`:167`）仍写「模板含路径/命令字面量」** → 三处口径仍不同；另「成员以原文出现」的粒度（整项 / 子串）仍未写死（§3.4 `:89`）→ §10.2 第 2 条 |
| 3 | §3.4 归码优先级（`B10` / `B11` 与 `B03`–`B05` / `B14` / `B15`） | 归码用的 ID 正则是 `^[a-z][a-z0-9.-]*$`，**不含冒号**；而合法席级组写作 `seat:<slug>.extra` → 按该正则会被判成「形态不合法」→ `LiteralInConfig`，与 B10/B11 允许席级组合法互斥 | 正则改为 `^[a-z][a-z0-9.-]*(?::[a-z0-9-]+(?:\.[a-z0-9-]+)?)?$`，或直接写「ID 谓词 = A07 的谓词」 | `seat:senior-sdet.extra` 过形态关；`docs/after/`、`git status`、`--write`、`definitions/x.mjs` 仍不过 | P1 | **闭合**：ID 谓词已改 `^[a-z][a-z0-9.:-]*$`（`:92`），并写死「先形态（`LiteralInConfig`）→ 后存在性（`UnknownPolicyRef`）」；A07 已按同一谓词改写 |
| 4 | §3.5 不变量3 例外① vs §3.2 / `A05` / `D03` | 例外① 要求 `artifacts.owner` 的值 ∈ `SEAT_NAMES`，但 §3.2 与 `A05` 把 `progress.md` 的 `owner` 定为 `host`（宿主哨兵，不是任何席 slug）→ 合法定义层会被自己的不变量判红 | 例外① 改为「`owner` ∈ `SEAT_NAMES` ∪ `{'host'}`，且 `owner='host'` 仅当该项 `host: true`」 | `D03` 绿（`host` 不报错），把某席 owner 拼错仍红 | P1 | **闭合**：例外① 已改为 `owner ∈ SEAT_NAMES ∪ {'host'}` 且 `'host'` 只允许配 `host: true`（`:100`）；D03 的 ② 段按此断言 |
| 5 | §5 黄金表键名 + `expanded` 形状（`G03` / `F02` / `F05`） | 黄金「4 个 sha256」已定但**键名未写死**；`expanded` 已定「7 个槽值字符串数组」但**槽顺序与无 `text` 字段未写死** → G03/F02 的断言键名与顺序只能由实现临时决定 | 写死黄金键名：`reviewer-audit` / `detective-observer` / `defaultBoundary` / `evidenceReader`；写死 `expanded` 顺序 = §3.4 槽表顺序 | `G03` / `F02` / `F05` 可照抄断言 | P2 | **闭合**：黄金 4 键写死为 `reviewer-audit` / `detective-observer` / `default-boundary` / `evidence-reader-boundary`；`expanded` = **11 槽**、顺序 = §3.4 表顺序（`:144-145`）→ G03 / F01 / F02 已同步。未给 `text` 字段（§8 建议 9 未采纳）不影响本组判据 |
| 6 | §7 `RenderNotEquivalent`（`D01`） | §7 表给了它 exit 1 + 报文首行 `<席>:<首处差异行>`，但同页注释说它「由迁移期断言报」——测试断言没有 CLI 首行/退出码，二者不可同时成立；发射点未写死 | 二选一：① 明写由哪个命令发射（如 `gate` 的迁移检查路径或 `check-agents`）；② 把它从 §7 表移出，归「测试断言」并删掉 exit 码 | `D01` 的该行有唯一落点；否则从 D01 的表里移除并在本文件记「无 CLI 发射点」 | P1 | **闭合**：§7 已标注「由施工期断言发出，不是 CLI 运行时错误；CLI 不引入该码」，退出口径写「测试退出 1」（`:168`）→ D01 该行改为「测试抛错 + 消息首行」，D05 反向断言它不进 `EXIT` 表（已同步） |
| 7 | §3.6 波及面清单（`G04`） | 代码三处列全了，S5 文档侧也要求同批改，但**实测 S5 testcase 的 `S5-TC-B14` 也以 `BOUNDARY_COMMAND` 作前置构造**，§3.6 只点了 E05 / B08 → 漏改即 ReferenceError；另「S5 spec 里描述历史事实的句子要不要改」无口径 | §3.6 与 §6 步骤 4 补 `S5-TC-B14`；并注明「S5 文档中作为**判据/前置**的引用必须改判，作为**历史叙述**的句子保留」 | `G04` ⑤ 三段内 0 命中，且 S5 spec 历史叙述不动 | P2 | **闭合**：§3.6 已列四处（含 `S5-TC-B14`）并给口径「判据与前置必须改判；历史叙述句保留不改」（`:110-112`）；G04 的 来源 / 不覆盖 已按此改写 |
| 8 | §8 V-5 行（`D04`） | V-5 的验收项名写「**四条**不变量」，判据列却写「**6 条**不变量各有 1 个负例」——同一行两个数 | 统一为「六条不变量」（§3.5 实为 6 行） | `D04` 的六条计数与 V-5 一致 | P2 | **闭合（v4 口径）**：V-5 的验收项名与判据列已统一为「六条不变量」（`:184`）；D04 的来源段已注明。**v5 后该口径再次失效** → §10.3 第 6 条 |

**v5 状态增量（第五轮，仅列变化项）**：第 1 条 → **闭合**（§3.4 新增第 12 槽 `{{DETECTION_CMD}}`，`spec:91`；槽集 12 见 `spec:76`，`expanded` 12 槽见 `spec:162`；本文件 C06 / F01 / F02 已同步）；第 2 条 → **闭合**（§7 的「触发」列已改为「违反 §3.4 纯度三条（成员原文出现 / 白名单登记成员 / 槽集不合）」，`spec:191`；「成员以原文出现」的粒度已写死为**整项相等、不做子串**，`spec:93`）；第 5 条 → **更新**（`expanded` = **12 槽**，`spec:162`）；第 3 / 4 / 6 / 7 / 8 条不变（v4 已闭合）。另：第 8 条的「六条不变量」口径在 v5 出现新不一致（§3.5 已 7 行，§8 V-5 仍写六条）→ §10.3 第 6 条。

### 10.2 第四轮新发现（v4 下仍开；送议会前请确认）

> 口径与 §10 相同：P0 = 用例之间不可能同时绿（实现无法同时满足两条）；P1 = 两套合理实现会给出不同判据/不同断言目标；P2 = 字段形态或措辞约定。本节的证据全部指到 spec v4 的行号或仓库现有文本；**v5 复核结论见本节末尾的「v5 复核」与 §10.3**。

| # | 卡在哪条（spec 节 / 用例） | spec v4 现状为什么不够（含依据） | 具体改法（可直接采用） | 验收 | 优先级 |
|---|---|---|---|---|---|
| 1 | §3.4 槽表 vs 检测限度段（`C01` / `C02` / `C06`） | 既有两句的检测限度段原文含 `git --no-optional-locks status --porcelain`；它是 `commands.mjs` 的 `git.read` verb（spec §3.2 `:50` 的 verb 清单，与本文件 §0.2 同源），属**定义层成员**。11 槽里**没有命令槽**：`DETECTION_PATHS` 取值来源只写 `paths.workspace` 中「检测盲区」子集（§3.4 `:85`）。照抄 → 触犯「成员不得以原文出现在模板」（`:89`）判 `TemplateImpure`；改写成不引用该命令 → 卡面字节变（V-2 红）→ C01/C02 与 C06 不可能同时绿 | 二选一：① 补槽 `{{DETECTION_CMD}}`（值 = `git.read` 里用于检测的那条 verb，渲染时从 `commands.mjs` 取）；② 若坚持不扩槽，须把该句改为不引用具体命令的措辞，并接受 `gate` 基线更新（与 §3.6「等价迁移、卡面零字节」冲突，不推荐） | `C06` 槽集 = 11（或 12，视 ①）且 `C01`/`C02` 哈希不变；`C03`–`C05` 注入仍红 | **P0** |
| 2 | §3.4「成员以原文出现」的**粒度与成员类别**（`C03`–`C06` / `D03` / `A05`） | ① **粒度未定**：`:89` 只写「以原文出现」，未区分「整项相等」与「子串包含」。按子串读，`skills/dev-workflow/references/gate-record.md`（② 段出现两次）含整项成员 `skills/` → 判红且无槽；按整项读则放行。② **成员类别未闭**：`:89` 的括号只列「工具名、命令、路径」，**产物名未列**，而 `progress.md`（`artifacts.mjs` 成员，§3.2 `:52`）与 ② 段单点的 `round-check.md` 确实要写进模板，`{{ARTIFACTS}}` 只注入本席那 1–2 项（审计 = `round-check.md` + `delivery-audit.md`）→ 非本席产物名无槽 | §3.4 写死两件事：① 粒度 = **整项相等**（成员自身字符串相等才算「以原文出现」，不做子串匹配）；② 成员类别 = 工具名 / 命令 / 路径 / **产物名**。再为非本席产物名补一处注入（新增 `{{HOST_ARTIFACT}}`，或让 `{{ARTIFACTS}}` 之外支持按名引用 `artifacts`），否则只能进白名单——那等于给「成员可写死」开口子（与 V-9 ② 冲突） | `C06` 与 `C01`/`C02` 同绿；`C03`–`C05` 注入仍红；`gate` → 37/37 | **P1** |
| 3 | §3.4 `{{TIER}}` 取值来源（`F02` / `E02`） | `:77` 写「该席配置展开出的档位名」，但 `policy/` 定义层没有档位表：`capabilities` 只有 `read`/`write`/`exec` 三组（§3.2 `:49`），档位名（`producer` / `sdet` / `readOnly`）实际在 S5 的 `patternRegistry.tools` / `tierBySeat`（`tools/docgen/components/patternRegistry.mjs:42-57`）。两套合理实现会给出不同槽值（`producer` / 由能力组合推导的新名字），而 F02 只判「槽值 ∈ 渲染文本」，不会红 | 二选一写进 §3.2 或 §3.4：① 明确 `{{TIER}}` = `patternRegistry.tierOf(slug)`（复用 S5 唯一来源）；② 在定义层新增 `tiers`（capability 组合 → 档位名），`TIER` 取自它 | `F02` 现有槽 1/槽 3 断言可扩展出槽 2 断言；`E02` 给 `senior-sdet` 加组后 `TIER` 不变 | P2 |

**v5 复核**：第 1 条 **闭合**（`spec:91` 第 12 槽 `{{DETECTION_CMD}}` = `commands['git.read'].verbs` 的 status 项、只读引用；C06 槽集改 12、F01 `expanded.length === 12`、F02 增槽 12 断言（`DETECTION_CMD`；**槽序按现行 §3.4 表行序 = index 11**，见 v9.5 口径））；第 2 条 **部分闭合**（粒度 → **整项相等、不做子串**（`spec:93`）；成员类别已含**产物名**（`spec:96`）；**但**两条实例仍无槽：允许段括注的 `--output`、非本席产物名（`progress.md` / 侦探卡 `round-check.md`）→ §10.3 第 2 条）；第 3 条 **闭合**（`spec:89`：`{{TIER}}` = `patternRegistry.tierOf(seat)`，不另立档位名表，一致性由 `SEATS[s].tier === tierOf(s)` 守）。

### 10.3 第五轮核验（v5 处置与仍开项）

> 口径同 §10.1 / §10.2。本表只记 v5 相对 v4 的增量与仍开项，不重写前两节的历史列。

| # | 项（原始出处） | v5 结论 | 依据 | 仍开？ |
|---|---|---|---|---|
| 1 | 检测段命令无槽（§10.2 第 1 条） | **闭合** | `spec:91` 第 12 槽 `{{DETECTION_CMD}}`（取值 = `commands['git.read'].verbs` 的 status 项，只读引用、不复制）；`spec:76` 槽集 12；`spec:162` `expanded` = 12 个槽值；本文件 C06（槽集 12 / 逐槽被引用）、F01（`expanded.length === 12`）、F02（槽 12 == `git.read` 的 status verb，index 11）已同步 | 否 |
| 2 | 「以原文出现」的粒度与成员类别（§10.2 第 2 条） | **部分闭合** | 已闭合部分：粒度 = **整项相等、不做子串**（`spec:93`，含成员的更长路径如 `skills/dev-workflow/references/gate-record.md` 允许登记白名单）；成员类别 = 工具名 / 命令 / 路径 / **产物名**（`spec:96`）。**仍缺注入的两类实例**：① 允许段括注的 `--output`（`fs.write` verb）；② 非本席产物名（禁止写段的 `progress.md`、侦探卡越权段的 `round-check.md`）——`{{ARTIFACTS}}` 只注入本席 1–2 项，且白名单只许登记非成员，故写死 → `TemplateImpure`、不写 → 卡面字节变（V-2 红） | **是（P1）**：建议补 `{{HOST_ARTIFACT}}`（或让 `{{ARTIFACTS}}` 支持按名引用 `artifacts`），或显式承认这两处走白名单例外并同步 V-9 ②；未闭合前 C01/C02 的字节等价与 C06 的槽级纯度仍互斥 |
| 3 | `{{TIER}}` 取值（§10.2 第 3 条） | **闭合** | `spec:89` 取值 = `patternRegistry.tierOf(seat)`；不另立档位名表；一致性由 `SEATS[s].tier === tierOf(s)` 守（记在 V-4） | 否 |
| 4 | 不变量 7「槽集恰合」（§11.7 第 5 条） | **闭合** | `spec:111`：模板槽集 = 渲染器消费的槽集 = 12 个，每个槽至少被引用一次；有槽无人填 / 有值无槽都判 `TemplateImpure`；C06（正例）+ C07（未声明槽位）覆盖 | 否 |
| 5 | `agentData` 条目自带 `boundary`（§11.7 第 6 条） | **收口（不新增守卫）** | `spec:121`：沿用 S5 既有断言（`DECLARED_SLOT_SEATS` 由 `boundaryBySeat` 派生），本 spec 不重复造；§7 G-8 状态已改 | 否 |
| 6 | **新发现**：§8 V-5 仍写「六条不变量」，而 §3.5 已 7 行 | **不一致（P2）** | `spec:111`（#7 槽集恰合）vs **V-5 名称与判据**（v5 时写「六条不变量」/「6 条不变量各有 1 个负例」，当时行号 `:184`；**现行文见 `spec:208`，已改「九条不变量」**）；本文件 D04 已按 §3.5 实际 9 行计数 | **是（P2）**：把 V-5 改成「七条不变量」并给不变量 7 指定 1 个负例（建议 C07）；不改也不阻塞用例执行，但议会核 V-5 时会撞到这两个数 |

**v6 复核（本轮读 spec 时补记）**：第 6 条 **已闭合**——spec `:188` 现写「V-5 | **七条不变量** | 7 条不变量各有 1 个负例…（不变量 7 的负例 = 模板漏槽 / 多槽；含归码优先级…）」，与 §3.5 的 7 行一致；D04 的计数口径与 spec 现已同源。第 2 条（`--output` / 非本席产物名）在 v7 下**降级为 P2**：V-2 不再作通过判据后，「写死 → `TemplateImpure`」与「不写 → 卡面字节变」不再构成死锁（见 §10.4 第 5 条）。

### 10.4 第六轮（v7 口径）核验与新发现

> 口径同前：P0 = 用例之间不可能同时绿；P1 = 两套合理实现会给出不同判据/断言目标；P2 = 字段形态或措辞约定。
> 本轮 spec 侧的关键变化是 **V-1 改判 + V-2 降级 + 新增 V-11/V-12/V-13**，用例已按 v7 同步；下表 8 条是 v7 同步过程中仍无法自洽的点（**原文保留不改写**）。**v8 逐条状态见紧随其后的「状态（v8 复核）」表**。

| # | 项（spec 节 / 行） | spec 现状为什么不够（含依据） | 具体改法（可直接采用） | 验收 | 优先级 |
|---|---|---|---|---|---|
| 1 | 基线抽取器与 `sourceCommit` 无约束（§6 步骤 0，`:156`；§11.9 第 5 条） | 只写「从**未改**的 commit 导出 `fixtures/capability-baseline.json`」，未写：① 抽取器落点；② 抽取器**不得 import `policy/`**；③ 基线 JSON 必须带 `sourceCommit`；④ 该 commit 上不得存在 `policy/`。四条缺任一条，「空差」都可能**恒真**（从 HEAD 导 / 抽取器读定义层） | §5 布局加 `tools/docgen/test/support/capability-baseline.mjs`；§6 步骤 0 补三句：「基线 JSON 必带 `sourceCommit`；抽取器只读 `git show <commit>:agents/*.md`，**不得 import `policy/`**；`sourceCommit` 上不得存在 `tools/docgen/policy/`（改造前客观标志）」 | `S6-TC-H01`（③ 复算 / ⑤ 不 import）与 `H07`（prior 断言）绿；把基线换成 HEAD 导出时 `H07` 必红 | **P0** |
| 2 | 「禁止命令集 **22 条**」不可复算（§8 V-1，`:184`；对照本文件 §0.2） | V-1 段 ④ 写「禁止命令集（22 条）」，而按 §3.2 的 5 个禁止组逐条枚举 = 5 + 9 + 7 + 5 = **26 条**（再把 `network` 的 3 类形态算进去 = 29）。22 从哪来无法追溯 → V-11 的「逐项探针」失去分母 | 二选一写进 §3.2 / §8：① 把 5 个禁止组的 verbs 逐条列全，并把「22」改成枚举值（或「由 `policy --dump` 现算」）；② 若 22 有特定口径（例如不含 `network` 且某些 verb 合并），把该口径写出来 | `S6-TC-I02` 的条数由 `CMD.forbiddenGroups` 现算；`capability-diff.md` 的「项」列与 spec 一致 | **P1** |
| 3 | V-11 的「拦 / 不拦」发生在哪一层未写（§8 V-11，`:194`；§10 第 1 条，`:246`） | §10 第 1 条明确「平台无参数级授权位，不测运行时拦截」；而 V-11 写「使用 → 不被拦 / 必判红」。「拦」字面指向运行时 → 两节对读会得出「V-11 不可测」 | §8 V-11 补一句：「本条的『拦 / 不拦』= **判据层**（配置校验 + 渲染可指涉 + 报错码），不是运行时授权；运行时行为见 §10 第 1 条（不测）」 | `S6-TC-I01` / `I02` 与 §10 不自相矛盾；议会测试席不再追问「运行时怎么验」 | **P1** |
| 4 | A/B 两个实例**分数不一致时无仲裁规则**（§9.1 / §9.2，`:206-240`） | §8 V-13 要求「两份各 2 个独立实例」，§9.2 只写「每条分带证据行、无证据记 pending」，**没写两实例分歧怎么办**。差 1 分就足以让「逐维 B ≥ A」翻盘；无仲裁 = 取高者，等于没有盲评 | §9.2 补仲裁规则：「同卡同维两实例差 ≥1 分 → 第三人复评（回读卡内原文）；未收敛前该维记 `pending`，不得给分；分歧与第三人分同记 `ab-score.md`」 | `S6-TC-K07` 绿；任取一处分歧可在账单里追到第三人证据行 | **P1** |
| 5 | C06 / G-5 的残余两类成员仍无槽（§3.4，`:88-96`） | 允许段括注的 `--output`、非本席产物名（`progress.md` / 侦探卡的 `round-check.md`）既不属「清单类」也不在本席 `artifacts` 注入范围。v5 时构成死锁（写死 → `TemplateImpure`；不写 → 卡面字节变 → V-2 红）。**v7 降级 V-2 后死锁解除**：「改措辞」现在是被允许的路径 | 二选一写进 §3.4：① 补 `{{HOST_ARTIFACT}}`（或让 `{{ARTIFACTS}}` 支持按名引用 `artifacts`），一次性解掉两类；② 明确「这两处允许改写为不引用成员原文的措辞，接受卡面变化，由 V-13 盲评确认质量不降」 | `S6-TC-C06`（槽集 + 逐槽被引用）与 `C03-C05`（注入仍红）绿；`J01` 的子句在两种路径下都齐 | **P2** |
| 6 | V-1「五段 diff 空差」与段 ⑤ 的重叠（§8 V-1，`:184`） | 同一行既写「五段各自的事实集合…空集差」，又写「⑤ 关键子句存在性（见 V-12）」——段 ⑤ 是**存在性断言**，不是集合。按字面实现会对段 ⑤ 拿整段文本做 diff，与 V-12「不要求整段相等」直接冲突 | §8 V-1 补一句：「段 ⑤ 不做集合 diff，按 V-12 的『关键子句存在性』判；集合 diff 只覆盖 ①–④」 | `S6-TC-H02`（键集恰 8 字段，不含子句）+ `J01` 同时绿；实现不再对段 ⑤ 做文本 diff | **P2** |
| 7 | 8 维 rubric 的**权重**未写（§9.2，`:234`） | 「单维 0/1/2，总分满分 16（8×2）」隐含等权，但没写死。若有人给 P 组 / E 组不同权重，总分不再可比，且「至少一维 B > A」的判定也会随权重漂移 | §9.2 补一句：「8 维**等权**，各满分 2；总分仅作参考、不作判据（与通过判据无关）」 | `S6-TC-K04`（满分 16 / 逐维比较）绿；`rubric.md` 不出现权重列 | **P2** |
| 8 | 「交付说明」的落点未定（§6 步骤 0，`:156`；§9.2，`:236`） | 两处都要求「写进交付说明」（取数命令、`未达 high`），但没说交付说明是什么文件、落在哪。H01 ⑥ / K06 的断言需要一个确定的目标文件 | §6 步骤 0 或 §9.2 写明：「交付说明 = `docs/superpowers/reviews/<…>-s6-eval/checklist.md` 顶部『交付说明』节」（复用四本账单之一，不新造第五份文件） | `S6-TC-H01`（⑥ 两条取数命令原文）与 `K06`（`mid` + 未达 high）可在同一文件内断言 | **P2** |

> **状态（v8 复核，2026-10-25）** —— 与上表 8 条逐行对应；「已闭合」一律给 `spec:行号`：

| # | 状态（v8 复核） | 依据 / 理由 | 用例侧同步 |
|---|---|---|---|
| 1 | **已闭合** | `spec:169` §6 步骤 0 ①–⑤ 写死：抽取器落点 `test/support/capability-baseline.mjs`、**不得 import `policy/`**、必带 `sourceCommit`、该 commit 上不得存在 `policy/`、抽取规则 + 黄金样本、逃生路径 | H01（①–⑦）/ H07（prior 断言） |
| 2 | **已闭合** | `spec:204` V-1 段 ④ 改为「禁止命令集**由 `policy --dump` 现算**」，不再出现 22 | 事实 14 改写为历史；I02 分母现算；`capability-diff.md` 记首次现算值 |
| 3 | **已闭合** | `spec:214` V-11 补「拦 / 不拦 = **判据层**（配置校验 + 渲染可指涉 + 报错码），不是运行时授权」 | I01 / I02 按判据层写（I01 `status===0`、I02 必红 + 码对位） |
| 4 | **已闭合** | `spec:258` §9.2 写死仲裁规则：「同卡同维差 ≥1 分 → 第三人复评；未收敛前记 `pending`，不得给分」 | K07 按 `hasArbitration` + 终值 `pending` 断言 |
| 5 | **已闭合** | `spec:94-96` 纯度三条按**清单类 / 单点类分治**：`--output`（`fs.write` 单 token）与非本席产物名（`artifacts` 整项）都属「单点类成员」，允许留模板但须经存在性校验 → **无需新槽**，`{{HOST_ARTIFACT}}` 不再必要 | C05（清单类判红 / 单点类放行）+ C06（12 槽 + 逐槽被引用 + 无悬空标点） |
| 6 | **已闭合** | `spec:204` V-1 已写「**段 ⑤ 不做集合 diff（归 V-12）**」 | H02 键集恰 8 字段 + 渲染端 diff；J01 子句存在性 |
| 7 | **已闭合（v9 复核）** | `spec:254` 写「8 维**等权**、满分 **16**（**不设权重列**）、总分只作参考」——「不设权重列」已进 spec；`rubric.md` 的列集另由 K01 逐字比对（维度 / 0 / 1 / 2 / 判据来源），多一列即红 | K01（列名逐字）+ K04（16 行 = 2 卡 × 8 维）+ K02（8 维 ID 深比较） |
| 8 | **已闭合** | `spec:248` 四本账单表已把交付说明的落点定为 `checklist.md` 顶部「交付说明」节（复用四本之一，不新造第五份） | H01 ⑥（两条取数命令原文在 `checklist.md`）+ K06（置信度档位在同文件） |

> **本轮结论（v9 复核，2026-10-25）**：**P0 = 0，§10.4 的 8 条全闭合**——第 1–8 条均给出 `spec:行号`（第 7 条的「不设权重列」由 `spec:254` 补齐，v8 记的「部分闭合」已回收）。议会 #3 的 32 族逐族处置见 `.session/reviews/2026-10-25-111619-s6-policy-parliament/problems.md` §一–§三；§7 G-14 记的两条 spec 侧缺口（CRLF/BOM、不变量 8 的 token 粒度）经 `spec:124` / `spec:112` 闭合。
>
> **v9.1 处置（原 v9 新发现的裁定结果）**：`spec:210` 已把 V-7 扫描面写死为「**非 `docs/` + S5 testcase**」，并明写「S5 spec 的清单原句按 `docs-convention` 属历史记录、允许保留，但必须有指针」→ **S5 spec 显式不进副本判定**。故本文件已按此改写：`E03` 的副本集合只含「定义层 1 处 + 2 张卡」（S5 testcase 在扫描面内、判「命中 < 20」，S5 spec 不在扫描面）；`E05` 只判「§3.3 / §8 两节指针 + 原句保留 + S5 testcase 三条改判 + 0 手抄」。原「`E03` / `E05` 不可能同时绿」的冲突**已闭合**（`spec:210` 为唯一依据）。

### 10.5 议会 #3 第 2 轮后端复核后新发现（v9.2 提出；11-1 / 11-2 于 v9.3 闭合，**11-3 于 v9.4 闭合**——v9.3 时记「仍开」，历史原文见本节末）

> 本轮按后端 5 张新卡改了 9 项（详见文件头第十一轮），以下是当时改不动、只能回 spec 的部分。**testcase 侧当时已用兜底判据保证不会假绿**，但 spec 不写死时两套合理实现会给出不同结果。**状态（v9.3 复核）：11-1 / 11-2 已被 spec 写死**（依据见本节末结论）；**11-3 = v9.3 新发现，v9.3 时记「仍开（P2）」、v9.4 已闭合**（`spec:155` / `spec:169`①，见本节末）。

| # | 卡在哪条（spec 节） | 为什么两套实现会分歧 | 具体改法（可直接采用） | 验收 | 优先级 |
|---|---|---|---|---|---|
| 11-1 | V-1 的**「改造前」端字典来源**（`spec:204`）+ §6 步骤 0（`spec:169`） | V-1 写「以定义层成员为字典在渲染文本里做存在性匹配」，但基线在**步骤 0** 生成时 `policy/` 还不存在（步骤 1 才落定义层）→ 基线用哪份字典没写：① 用旧卡自身按分隔符切出的清单（§6 步骤 0 ④ 的老口径）；② 用改造后的定义层字典。两端口径不同则 diff 不可比 | 在 §6 步骤 0 ④ 补一句：「基线端字典 = **改造后定义层成员的全集**（步骤 1 落完定义层后，以 `probeDict` 同一实现回抽旧卡，覆盖步骤 0 的首版 JSON）；步骤 0 的首版 JSON 只作交叉核对」；或显式允许「基线只作交叉核对，diff 两端都用定义层字典重抽旧卡」 | H01 ③（抽取器真执行复算）+ H02 ⑤'（基线成员 ⊆ 字典）同时绿；删定义层一条路径 → H02 ⑤' 必红 | **P1** |
| 11-2 | `definitions/tiers.mjs` 的**导出名与 re-export 形态**（`spec:53` / `spec:120`） | §3.2 只说「`tiers.mjs` 四档 + `tierOfCapabilities`」、§3.6 说「档位表改为 re-export」，但没写导出名（`tiers`？）与「re-export = 同一对象引用还是深拷贝」→ A01 / B01 / E07 / F01 只能按 `TIERS.tiers` + `patternRegistry.tools === TIERS.tiers` 判，实现若改名或复制即红（可能是误伤） | §3.2 `tiers.mjs` 行补「导出名 = `tiers`（与 dump 顶层 `tiers` 同名）+ `tierOfCapabilities`」；§3.6 补「`patternRegistry.tools` 必须是**同一对象引用**（不复制、不改写）」 | A01 ④ / B01 ⑤ / E07 ④ / F01 `tiers` 四档断言全绿；`patternRegistry` 复制一份档位表 → 引用不等必红（**v9.3：spec 已按 `TIERS` 本身写死**，断言形态改 `assert.equal(patternRegistry.tools, TIERS)`，见本节结论） | **P2** |
| 11-3 | **抽取器模块的职责边界**（§5 布局 `spec:155` 的「只读旧卡」 vs §6 步骤 0 ④ `spec:169` 的「改造后端按定义层字典匹配渲染文本」） | §5 把 `test/support/capability-baseline.mjs` 描述为「抽取器，**只读旧卡**，不得 import `policy/`」；而 ④ 要求改造后端也用「定义层成员字典匹配渲染文本」。**没说字典匹配这一入口落在哪**：① 同一模块两入口（基线端切分 + 字典匹配）→ 测试只 import 一处；② 字典匹配写在测试文件里 → `policy-pure-source.test.mjs` 出现**第二份解析实现**，与 V-7「测试 0 条手抄」相抵。两种都合理，判据会不同 | §5 布局该行改为「抽取器（**两入口**：基线端＝旧卡文本切分 / 改造后端＝定义层成员字典匹配；只读文本、不得 import `policy/`）」；§6 步骤 0 ① 补一句「两端口径都在该模块内实现，测试只 `import`，不得在测试文件里再写一份解析」 | H01 ③ / H02 / H07 ④ 同绿；E04 类静态扫描：`policy-pure-source.test.mjs` 不出现自写的切分 / 匹配实现（如自行用 `matchAll` 抽反引号项、自行做 `includes` 匹配字典） | **P2** |

> **本轮结论（v9.2）**：P0 = 0；11-1（P1）与 11-2（P2）仍开，已在 testcase 侧用「基线成员 ⊆ 字典」「同引用」两条断言兜住——spec 补上述两句后，这两条断言从「兜」变成「按 spec 明文判」。
>
> **v9.3 复核（本轮口径对齐）**：**11-1 已闭合**——spec §6 步骤 0 ④（`spec:169`）写死「步骤 0 尚无定义层 → **基线端按旧卡文本切分**（反引号 / 顿号 / 分号 / ` / ` 工具项）产出；**改造后端按定义层成员字典匹配**；两端可比前提 = 基线成员 ⊆ 定义层字典」；testcase 侧对应落为 `factsFromBaselineText`（基线端，不注入字典）+ `factsFromText`（改造后，字典匹配），H01 ③ 用 `runBaselineExtractor` **真执行**复算、H02 ⑤' 断「基线成员 ⊆ 定义层字典」、H07 ④ 动态断言抽取器被执行且不 import `policy/`。**11-2 已闭合**——spec §3.2 `tiers.mjs` 行（`spec:53`）写死 `export const TIERS = { readOnly:['read'], sdet:['read','write'], command:['read','exec'], producer:['read','write','exec'] }` 与「`patternRegistry.tools` 必须是 `TIERS` 的同一对象引用（re-export，不深拷贝、不改名）」；testcase 侧 A01 ④ / B01 ⑤ / E07 ④ 统一按 `TIERS` 本身 + `assert.equal(patternRegistry.tools, TIERS)`（严格相等）判，`probeDict` 取 `Object.keys(TIERS)`。两条从「兜」变成「按 spec 明文判」。
>
> **11-3（v9.3 新发现，P2，仍开 → v9.4 已闭合）**：`spec:155`（§5 布局「抽取器…只读旧卡」）与 `spec:169`（§6 步骤 0 ④「改造后端按定义层字典匹配渲染文本」）对同一模块的职责描述不同步——**词典匹配入口落在哪没写死**。testcase 侧已按「同一模块两入口」实现（`factsFromBaselineText` + `factsFromText` 都在 `capability-baseline.mjs`，测试只 `import`），故当前不阻塞；若施工选择在测试文件内另写匹配逻辑，则 V-7「测试 0 条手抄」会被破坏（E04 类静态扫描可发现，但 spec 未给判据）。**不改 spec，仅登记**。
>
> **v9.4 状态（第十三轮复核）**：**11-3 已闭合**（`spec:155` 两入口 / `spec:169`① 唯一实现）——spec §5 布局该行现写「两入口（基线端＝旧卡切分 / 改造后端＝定义层字典匹配），只读旧卡，不得 import `policy/`」，§6 步骤 0 ① 写死「该解析逻辑的**唯一实现**（测试判据 import 它，不复制第二份）」；两处对同一模块的描述已同源，判据落为「同一模块两入口 + 测试只 import」（§0.3 / §0.4 的 import，E04 类静态扫描）。上两段的「仍开」为 v9.3 时的历史结论，原文保留不改写。

### 10.6 第十八轮新发现（v9.9 提出；**12-1 已关**，12-2 仍开）

> 本轮按安全席 / 后端席 4 项补判据时发现 spec 侧 2 处未写死。testcase 已按**更严的一侧**落判据（不放宽），spec 补后即从「兜」变「按明文判」。**状态更新（本轮复核）**：12-1 已由 spec §7 补齐第四后缀 `:not-allowed`（`spec:190`）→ **已关**；12-2 仍开。

| # | 卡在哪条（spec 节） | 为什么两套实现会分歧 | 具体改法（可直接采用） | 验收 | 优先级 |
|---|---|---|---|---|---|
| 12-1（**已关**） | §7 `ForbiddenGroupGranted` 的报文首行模板（`spec:190`）——v9.9 时**未列 `:not-allowed`**，而 §3.5 #8 ①（`spec:112`）已写「越界 → 后缀 `:not-allowed`」；**现行 spec §7 已补该后缀**（四种后缀 `:forbidden` / `:other-seat` / `:verb` / `:not-allowed`） | （历史）实现若按 §7 表做后缀白名单，越界场景只能报 `:forbidden` / `:verb`（或自造后缀），与 §3.5 #8 ① 冲突；testcase 的 B11 ④ 与 D01 第四后缀按 `:not-allowed` 判 → 必红 | §7 `ForbiddenGroupGranted` 行首行模板 = ``ForbiddenGroupGranted: <席>:<组>[:forbidden\|:other-seat\|:verb\|:not-allowed]``（与 §3.5 #8 两个方向的后缀一致）——**已落 `spec:190`** | B11 ④ 与 D01 的 `:not-allowed` 例同时绿；实现漏 `:not-allowed` → 两条同红。**状态：已补（spec §7 四后缀），12-1 已关** | ~~P1~~ 关 |
| 12-2 | §7 注「报文路径一律仓内 POSIX 相对路径」（`spec:197`）**没写覆盖范围**：是否也约束既有 `Mismatch`（`gate` 的产物漂移报文） | 一套实现只在五个新码上守、另一套对全部 CLI 码守 → A09 / D02 的报文形态判据会不同 | 在 `spec:197` 补一句「适用于**全部** CLI 报文首行（含既有 `Mismatch`）；后续新增码沿用同一口径」 | D01 五码路径断言绿；若给 A09 / D02 加同口径断言不得误红 | **P2** |

> **本轮结论（v9.9）**：P0 = 0；**12-1（P1）卡在 D01 / B11**——spec 未补前 testcase 按 §3.5 #8 ① 的 `:not-allowed` 判（取更严侧，不放宽）；**12-2（P2）卡在 D01 的「不覆盖」说明与 A09 / D02**——本轮不重复断 `Mismatch` 的路径形态，等 spec 写明覆盖范围后再加。
>
> **状态更新（本轮复核）**：**12-1 已关**——现行 spec §7 `ForbiddenGroupGranted` 首行模板已含第四后缀 `:not-allowed`（`spec:190`，四后缀齐），B11 ④ 与 D01 的 `:not-allowed` 例由「取更严侧兜住」变为**按明文判**；**12-2 仍开**（`spec:197` 未写「是否约束既有 `Mismatch`」）——testcase 侧仍不重复断 `Mismatch` 的路径形态，等 spec 写明覆盖范围后再加。

