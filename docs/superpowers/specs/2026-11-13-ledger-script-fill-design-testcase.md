# 账本「脚本填充 + 行定位 + AI 判值」testcase（独立推导）

- 对象 PRD：`docs/prd/20261113124838-ledger-script-fill.md`（v3.1 定稿，2026-11-13）
- 编写者声明：本文件由独立 senior-sdet 实例编写；用例初版从 PRD 与现有代码独立推导（未读设计稿），互查后按对账决议同步了键名、列 label 与 red code 口径（2026-11-13）。
- 覆盖口径：逐条覆盖 F1–F8、§6.1 九项、§6.2 两项（只出数）、§6.4 六类负例，并补 6 项追加边界；PRD 未定命令名处标「按 spec 定义」，不编造子命令。
- 适用范围：账本产物（round-check / delivery-audit 等表格产物）的填充器、定位器、写后校验；回答目标：给出可与 spec 对账的独立验收基线。
- 取证锚：[PRD:27-34](file:///d:/Seed/retro-skills/docs/prd/20261113124838-ledger-script-fill.md#L27-L34)、[PRD:64-101](file:///d:/Seed/retro-skills/docs/prd/20261113124838-ledger-script-fill.md#L64-L101)、[index.json:63-112](file:///d:/Seed/retro-skills/tools/docgen/models/agents/jsons/reviewer-audit/index.json#L63-L112)、[index.json:435-444](file:///d:/Seed/retro-skills/tools/docgen/models/agents/jsons/reviewer-audit/index.json#L435-L444)、[round-check.md:7-27](file:///d:/Seed/retro-skills/skills/parliament-ledger/assets/round-check.md#L7-L27)、[reviewer-audit.md:93-95](file:///d:/Seed/retro-skills/agents/reviewer-audit.md#L93-L95)。
- 术语：机算=脚本算好并写入的格；待判=语义判定留空待 AI 填的格；skipped=解析时跳过、未计入的行数；scanned=实际扫描数据行数；provenance=取数来源（命令+退出码+输出首行+取数时刻含时区）；幂等=重跑前后字节不变。
- 计数口径：TC 共 25 条（矩阵 25 行 + 明细 25 行）；数出方式 `rg -c '^\| TC-' <本文件>`，期望得 50（本席不跑命令，供复核席复算）。

## 1 覆盖矩阵

| TC 编号 | 覆盖（F<n> / §6.1-n / §6.2-n / §6.4-负例名） | 类型 |
|---|---|---|
| TC-01 | F1 / §6.1-1 | 正 |
| TC-02 | F2 | 正 |
| TC-03 | F3 | 正 |
| TC-04 | F4 / §6.1-5 | 正 |
| TC-05 | F5 | 正 |
| TC-06 | F6 / §6.1-9 | 正 |
| TC-07 | F7 / §6.1-6 | 正 |
| TC-08 | F8 / §6.4-重跑幂等 | 正 |
| TC-09 | §6.1-1 | 观测 |
| TC-10 | §6.1-2 | 正 |
| TC-11 | §6.1-3 | 负 |
| TC-12 | §6.1-4 | 负 |
| TC-13 | §6.1-7 / 定位 0 命中 | 正 |
| TC-14 | §6.1-7 / §6.4-坏行 | 负 |
| TC-15 | §6.1-8 | 观测 |
| TC-16 | §6.2-1 | 观测 |
| TC-17 | §6.2-2 | 观测 |
| TC-18 | §6.4-重复行键 | 负 |
| TC-19 | §6.4-围栏内伪表格 | 负 |
| TC-20 | §6.4-CRLF+BOM | 负 |
| TC-21 | §6.4-转义竖线 | 负 |
| TC-22 | §6.3 空值合法清单 | 正 |
| TC-23 | F7 行号与原文件一致 | 正 |
| TC-24 | F5 / §6.3 规则②（机算格为空） | 负 |
| TC-25 | §6.1-9 / F6+F7 键同源 | 正 |

## 2 用例明细

| TC | 前置与夹具 | 步骤（命令原文或动作） | 期望输出（可判） | 覆盖 |
|---|---|---|---|---|
| TC-01 | FX2a=`tmp/fixtures/ledger-fill/clean/round-check.md`（干净骨架：仅表头与空行）；FX1=`tmp/fixtures/ledger-fill/round{1,2,3}/round-check.md`（试点前 3 轮副本）；round1 目标文件不存在 | 对 round1 跑填充器骨架模式（命令名按 spec 定义） | 退出码 0；首行表头 8 列的中文 label 依次为 `项,核对内容,判据,类型,结果,理由,适用性,证据`（按 spec §3 对照表）；数据行数 = 该表行键数；节标题齐备；无 AI 手写字段 | F1 |
| TC-02 | FX2=`tmp/fixtures/ledger-fill/clean/round-check.md` 已跑填充的产物（机算格已填、待判格留 `[待判]`） | 读第 3 项「证据」格 | 格内同时含：取数命令原文（如 `scs ledger numbers <评审目录>`，round-check.md:9）、退出码、输出首行非空、时刻含时区（如 `+08:00`）；四件缺一即失败 | F2 |
| TC-03 | FX2 | 读第 1 项「结果」格，统计全文 `待判` 出现次数 | 该格带「待判」标记且无判定值；`待判` 次数 = 机算格以外应留待判的格数；无「待判」的空格不计入 | F3 |
| TC-04 | FX2 已填机算格 | 抄格内 provenance 命令原样执行（如 `scs ledger numbers <评审目录>`、`scs check landings --ledger <评审目录> --root <项目根>`、`scs ledger gate <评审目录>/progress.md`、`scs time`） | 命令退出码 = 格内记录退出码；输出首行与格内首行逐字节相等 | F4 / §6.1-5 |
| TC-05 | FX2 且 AI 已填全部待判格 | 跑写后校验（按 spec 定义） | 退出码 0；输出 `{reds:[]}`（`reds.length===0`）；若有 red，每项须含 `line/col/code` | F5 |
| TC-06 | FX2 | 跑产物索引（按 spec 定义） | 输出行键集合 = 该表 `checklist.items[].no` 全量（按 index.json:63-112 为 1–8）；无遗漏、无重复；行号列全为整数 | F6 / §6.1-9 |
| TC-07 | FX2 干净表（已知原文行号） | 依次定位 `第 1 项`、`第 4 项`、`第 6 项`（按 spec 定义的定位命令；键名按 PRD v3.1 对账同步） | 三键各 `hits>=1`；返回行号与 Node 逐行索引（`split('\n')` 后按键名取 1-based 行号）结果逐行相等；多命中按行号升序；默认上下文 1 行 | F7 / §6.1-6 |
| TC-08 | FX2 且任一待判格已手填 `hit` | 用 Node 算 sha256（同 TC-15 命令）→ 重跑填充器 → 再算 | 已填待判格字节不变；其余行字节不变；两次 sha256 相同；退出码 0 | F8 / §6.4-重跑幂等 |
| TC-09 | FX1 三轮副本 | 按 §6.4 坏行 / 重复键口径逐轮统计机械项错填数 M（定义：机算格的值与第二人独立复算值不一致的格数；同夹具、同命令、同 `scs --version`） | 每轮输出一行 `round=N errors=M`；M 为整数，第二人按同口径独立复算得同一 M | §6.1-1 |
| TC-10 | FX1 同夹具 | 试点后三轮各跑「填充器 + 校验器」 | 三轮均 `errors=0`，且逐轮明细记录（每条错误一行，无错误写 0）；退出码 0 | §6.1-2 |
| TC-11 | FX2 已填完 | 复核席（非本席）手改一机算格（如第 3 项证据栏数值），再跑校验 | 退出码非 0；`reds` 中存在 `code=machine_overwritten` 且给出该行号；运行席自证结果不计入 | §6.1-3 |
| TC-12 | FX2 两种：a=待判格为空且无标记；b=待判格有标记未填 | 复核席各跑一次校验 | a) `reds` 含 `code=pending_unmarked`；b) `reds` 含 `code=pending_unfilled`；两例退出码均非 0 | §6.1-4 |
| TC-13 | FX2 | 定位不存在的键 `第 99 项` | 退出码 0（非判红）；输出 `hits=0 scanned=<数据行数> skipped=0`；三者同时出现 | §6.1-7 / 定位 0 命中 |
| TC-14 | FX4a=坏行副本（某数据行少一列） | 定位任一存在的键 | 退出码非 0；输出 `skipped>=1` 并给出坏行行号；不得以 `hits>0` 静默成功 | §6.1-7 / §6.4-坏行 |
| TC-15 | FX2 | 定位前用 Node 算 sha256（`node -e "console.log(require('crypto').createHash('sha256').update(require('fs').readFileSync(process.argv[1])).digest('hex'))" <FX2>`），定位 3 个键后再算一次 | 两次输出完全相同；文件内容字节不变（只读） | §6.1-8 |
| TC-16 | FX3=`tmp/fixtures/ledger-fill/long/delivery-audit.md`（≥100 行） | 记 AI 读取字符数基线 → 定位 3 行后记第二次 | 只出数：报告两次中位数与降幅百分比；不设阈值、不判红 | §6.2-1（观测，不设阈值） |
| TC-17 | FX1 三轮 | 试点前后各记工具调用次数 | 只出数：报告中位数与变化量；不设阈值、不判红 | §6.2-2（观测，不设阈值） |
| TC-18 | FX4b=重复行键副本（两行同为 `第 3 项`） | 跑索引 / 校验 | 判红；`reds` 含 `code=duplicate_keys` 并列出重复键与两处行号；退出码非 0 | §6.4-重复行键 |
| TC-19 | FX4c=围栏副本（三反引号代码块内含一行伪装为「第 9 项」的表格行） | 跑索引，并定位 `第 9 项` | 围栏内该行不计入 `scanned`；`第 9 项` 返回 `hits=0 skipped=0`；不判红；退出码 0 | §6.4-围栏内伪表格 |
| TC-20 | FX4d=CRLF+BOM 副本 与 FX4e=LF 副本（内容等价） | 分别跑索引与定位同一 3 键，捕获原始 stdout | 两次输出逐字节一致；行键集合相同；行号相同；`skipped=0` | §6.4-CRLF/BOM |
| TC-21 | FX4f=含「反斜杠 + 竖线」单元格一行 | 跑索引，再定位该行 | 该格仍为单列（不切列）；该行列数 = 表头列数；`skipped=0`；退出码 0 | §6.4-转义竖线 |
| TC-22 | FX2 四格：a=hit 行证据留空；b=miss 且无 reason；c=na 且无 applicability；d=结论通过且打回清单写「无」 | 跑校验 | a) 不判红（`hit` 证据允许空）；b) `reds` 含 `code=missing_reason`；c) `reds` 含 `code=missing_applicability`；d) 不判红（PRD:87-88） | §6.3 空值合法清单 |
| TC-23 | FX2 | 定位 `第 3 项` 得行号 L，再用 Node 回读第 L 行（`node -e "const l=require('fs').readFileSync(process.argv[1],'utf8').split(/\r?\n/);console.log(l[Number(process.argv[2])-1])" <FX2> <L>`） | 回读行文本含 `第 3 项`；L 为 1-based 且与 `index` 输出的行号一致；跨节时输出标明节边界 | F7 行号一致 |
| TC-24 | FX2 将一个机算格置空（模拟脚本失败） | 跑校验 | `reds` 含 `code=machine_empty` 并给行号；脚本失败只允许写「待判」+原因，写任何值即违规 | F5 / §6.3 规则② |
| TC-25 | FX2 | 取索引输出的键集合 A，取定位器支持键集合 B（按 spec 定义导出或逐键探测） | A = B = `checklist.items[].no` 全量；A△B 为空集；缺一即失败 | §6.1-9 / 键同源 |

## 3 PRD 理解差异与疑点

| 编号 | PRD 行号 | 我的理解 | 可能的分歧点 |
|---|---|---|---|
| D1 | :32、:71、:74 | 行键 = `checklist.items[].no` 全量；index.json:63-112 是 8 项 no=1..8 | §6.1-6 指定「第 0/3/5 项」、round-check.md:16-23 只有第 0–5 项（6 行）：0 起还是 1 起、第 0 项算不算行键、8 项与 6 行如何对齐 |
| D2 | :27、:107 | 表头 = `templates.columns` 8 列（index.json:435-444） | §7 指认生成物为 4 列 6 行（outputFormats.mjs:70-78）且 P0 blocker 未解除：F1 的「固定表头」此刻按哪份判；若按 4 列，§6.3 的结论/打回清单列无处落 |
| D3 | :86-88 | 三态标注作用于列 | §6.3 有「结论 / 打回清单」列，round-check.md:16-23 只有 4 列，结论在 round-check.md:25-27 是独立小节：三态按列还是按节 |
| D4 | :90 | 待判格「填写前允许空」且「必须带标记」 | 标记写在格内则格非空（与「允许空」字面冲突），写在列外或作前缀则校验需另认形态；两者判定口径未定 |
| D5 | :97、:118 | 坏行计入 skipped 且 skipped>0 判红 | §6.1-7 又要求 0 命中时 `skipped=0`：skipped 语义是「坏行数」还是「未解析行数」；判红依据是 skipped 还是退出码 |
| D6 | :33 | 上下文 N 行、默认 1 | N 是前 1+后 1 共 2 行，还是共 1 行；「跨节标明边界」的字段/形态未定 |
| D7 | :28、:60 | F2 每机算格带「命令 + 输出首行」 | §5 另要「取数时刻（含时区）」：时刻是每格必写，还是每轮/每文件写一次 |
| D8 | :34、:101 | 重跑幂等 = 字节不变 | 「不改其他行」与重跑是否重写表头/节（会改字节）如何相容；骨架已存在时是跳过还是重建未定 |
| D9 | :72 | 不存在键返回 0 命中且 `skipped=0` | `scanned` 是数据行数还是含表头；仅表头无数据行时 `scanned` 计 0 还是计 1 |

## 4 自检（本席清单逐条）

| # | 条目 | 原文摘句（含锚） | 判定 |
|---|---|---|---|
| 1 | 输入空间核对 | 「固定夹具 = 试点前 3 轮 `round-check` 副本（目录写死）」[PRD:66] | hit |
| 2 | 状态与转移核对 | 「待判格未填即判红」[PRD:29]、「重跑前后已填格与其他行字节不变」[PRD:34] | hit |
| 3 | 失败面核对 | 「0 命中与解析失败必须区分」[PRD:33]、「重复行键 / 坏行 / 围栏内伪表格 / CRLF / BOM」[PRD:94-99] | hit |
| 4 | 判据来源核对 | 「骨架 100% 由脚本生成，AI 不写表头」[PRD:27]、「columns」[index.json:435] | hit |
| 5 | 确定性核对 | 「前后 sha256 相同」[PRD:73]；本文件期望列一律为退出码 / 字段 / 字节 | hit |
| 6 | 回归资产核对 | 「固定 3 个行键」[PRD:71]；FX1–FX4 六份变体可长期复用 | hit |
| 7 | 判别力核对 | 「任一不满足即判红」[PRD:31]；每条负例均有对应正例（TC-13 vs TC-14、TC-03 vs TC-12） | hit |
| 8 | 盲点雷达核对 | 「行键 = `checklist.items[].no`」[PRD:107] | hit（冲突已列 D1/D2） |
| 9 | 覆盖账核对 | F1–F8 [PRD:27-34]、§6.1 九项 [PRD:64-74]、§6.2 两项 [PRD:76-79]、§6.4 六类 [PRD:92-101] | hit：8/8、9/9、2/2、6/6，追加边界 6/6 |

- 正文自检：问题项为空 → 全过、无问题（第 3 节为 PRD 疑点，不计为本文件问题）。

## 5 越界声明与附录

- 越界声明：取证时一次全仓 Grep 的输出夹带了设计稿 `docs/superpowers/specs/2026-11-13-ledger-script-fill-design.md` 第 73 行的 1 行片段（未 Read 该文件、未据其内容写入任何用例，仅因此不采用其命令名）；本次为零写入，无改前/改后 sha256（均为不适用），可复原性 n/a，无复原命令。
- 附录（问题项为空时显式写）：全过、无问题。
- 本文件不修改 PRD、不实现代码。
