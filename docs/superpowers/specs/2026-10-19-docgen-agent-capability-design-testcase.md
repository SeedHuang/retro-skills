# 测试用例：Docgen P2 · S1（能力与终态）

> 归属 spec：`docs/superpowers/specs/2026-10-19-docgen-agent-capability-design.md`（split from `docs/prd/20261019093443-docgen-agent-generation.md` `2026-10-19`）
> 编写者：`senior-sdet`（实例标识 `sdet-2026-10-19-docgen-p2-s1`，全新上下文，未参与 spec 编写、未参与 S1 施工）｜**独立性声明**：编写者 ≠ spec 作者（spec 由 prd-to-specs 拆分流程产出），≠ 施工者（S1 施工者未开始，无自写自判）
> 状态：草稿（**定稿 = 每条用例五要素齐全，且覆盖总表与 spec 验收项一一对应**）｜最后更新：`2026-10-19`（第 3 轮同步：spec 第 3 轮 25 族裁决修复对齐——P0-A 时时调用 / P0-B fallback vacuous / P1-C 码表计数 / P1-D generate×registered / P1-E 测试驱动面 + V6③ / P1-F 拒红判别子 / P1-G 每 name 至多一份草稿 / P1-H baseline / P1-I draft rm --yes / P1-J 断言 3 / P1-K 触发表字段宿主 / P1-L draft 统一码 / P1-M agent 清单派生 / P1-N 35 vs 36 / P1-O fixture 口径 / P1-P 断言 14 / P1-Q 词表裁决 / P2-R 覆盖核对 / P2-S 83 口径 / P2-T 术语定义 / P2-U 节号标注 / P2-V 笔误 / P2-W 守卫补充 / P2-X 断言 1/5 / P2-Y 补断言；改动用例标「spec 第 3 轮修复同步」；**第 4 轮同步：spec 第 4 轮修复对齐**——F1 断言 3 移除 when（TC-041）/ NF-1 name 校验检查序 InvalidName 优先（TC-033/101）/ Q-2-01 断言 14 registered 豁免（TC-084/085）/ N1 sharedBlock 同引用枚举 + 无 sharedBlock 席不渲染（TC-043/096）/ NF-2 generate --kind 缺省（TC-099）/ NF-3 非 agent kind → UnsupportedKind（TC-066/100）/ NF-4 --no-clean 不承接（TC-058/059）/ NF-5 agent 清单字典序（TC-002/012）/ Q-2-03 五类口径 / Q-2-04 15 锚点 / TC-080 四值集 / 审计 Q1 覆盖列锚点 / 审计 Q2 TC-098 正/负标注；新增 TC-099~101；改动用例标「spec 第 4 轮修复同步」；**第 5 轮同步：spec 第 5 轮修复对齐**——UnsupportedKind 入 exit 2 码表 9→10、总码 37→38（TC-061）/ W4 派生断言 registered 豁免与断言 14 同口径（TC-014/046/088 + 新增 TC-102）/ route 重复 → TriggerConflict 与悬空 TriggerMissingRoute 两码区分（TC-047）/ 词表衔接：W5 新增 dc-translator 席同样豁免词表 + 词表首次生效时点 = dc-translate 落地后（TC-013/071）/ gate 无独立注入参数：V10/V10b 由 generate --kind rule --name <目标> --target <副本> 承接（TC-058/059）；新增 TC-102；改动用例标「spec 第 5 轮修复同步」）
> 轮次口径说明：本文件内「第 N 轮」均为 **spec 内部修复轮次**（对应 spec 评审账本 `.session/reviews/2026-10-19-1430-docgen-p2-s1-spec/problems.md` 的裁决轮次），与议会评审轮次无关；「第 3/4/5 轮同步」即 spec 第 3/4/5 轮修复对齐。
> 命名与落点：按 `spec-testcase-gate` 规则判据 1（与 spec 同目录；文件名 = spec 文件名去掉 `.md` 后 + `-testcase.md`）。
> 说明：所有「对应测试」为「待 plan Task N」——S1 施工 plan 尚未落地，Task 编号在 plan 产出后映射；编号一经分配不改号，废弃用例标「作废」并保留，不许删号。

## 1 覆盖总表

| 用例 ID | 覆盖的 spec 条目 | 层级 | 正/负 | 判据类型 | 执行方式 | 优先级 |
|---|---|---|---|---|---|---|
| TC-001 | R1/R3/R14-V1 | e2e | 正 | 机器 | `node tools/docgen/cli.mjs generate --kind rule` | P0 |
| TC-002 | R1/R3 | e2e | 正 | 机器 | `node tools/docgen/cli.mjs generate` | P0 |
| TC-003 | R1/R3 | e2e | 正 | 机器 | `node tools/docgen/cli.mjs generate --kind agent --name <name>` | P0 |
| TC-004 | R1/R4/W6 | e2e | 正 | 机器 | `node tools/docgen/cli.mjs draft --kind agent --name <name>` | P0 |
| TC-005 | R1/R2/W7 | e2e | 正 | 机器 | `node tools/docgen/cli.mjs draft ls` | P1 |
| TC-006 | R1/R2 | e2e | 正 | 机器 | `node tools/docgen/cli.mjs draft rm --name <name>` | P1 |
| TC-007 | R1/R2/I 族（draft rm 缺省删全部需 --yes） | e2e | 负 | 机器 | `node tools/docgen/cli.mjs draft rm`（无 --yes） | P0 |
| TC-008 | R1/R2 | e2e | 正 | 机器 | `node tools/docgen/cli.mjs draft ensure` | P1 |
| TC-009 | R1/R5/W6 | e2e | 正 | 机器 | `node tools/docgen/cli.mjs replace --kind agent --name <name> --draft <草稿> --yes` | P0 |
| TC-010 | R1/R10/W5 | e2e | 正 | 机器 | `node tools/docgen/cli.mjs gate` | P0 |
| TC-011 | R1/R11/W8 | e2e | 正 | 机器 | `node tools/docgen/cli.mjs check-agents` | P0 |
| TC-012 | R1/R12 | e2e | 正 | 机器 | `node tools/docgen/cli.mjs baseline --write` | P0 |
| TC-013 | W5/R12 | e2e | 正 | 机器 | 受控变更旅程全程命令 | P0 |
| TC-014 | R7/§6 全表 | 单元 | 正 | 机器 | `node --test tools/docgen/test/validate.test.mjs` | P0 |
| TC-015 | R13/W4/§8.1 | 单元 | 正 | 机器 | `node --test tools/docgen/test/`（派生断言） | P0 |
| TC-016 | R13/W4/P2-2/§8.1 | 单元 | 正 | 机器 | `node --test tools/docgen/test/`（专属句式） | P0 |
| TC-017 | R6/§5.3-3/W6 | e2e | 正 | 机器 | replace 前置 gate 场景 | P0 |
| TC-018 | R6/§5.3-5/PRD §6.5 | e2e | 正 | 机器 | 多目标逐目标替换 | P1 |
| TC-019 | R11/W8/§8.3 | e2e | 正 | 机器 | `node tools/docgen/cli.mjs check-agents` | P1 |
| TC-020 | R7/R8/序 0 | e2e | 正 | 机器 | `node scripts/check-all.mjs` + 文件存在断言 | P0 |
| TC-021 | R7/W8/§8.3 | e2e | 正 | 机器 | `node scripts/check-all.mjs` | P0 |
| TC-022 | R14-V9 | e2e | 正 | 机器 | generate 连跑两遍 + git 断言 | P0 |
| TC-023 | R8/P2-5/§7-交付物6 | 集成 | 正 | 机器 | `node scripts/check-all.mjs` stdout | P0 |
| TC-024 | R5/§5.4/W6 | e2e | 正 | 机器 | replace 后草稿箱断言 | P1 |
| TC-025 | R2/§5.4 | e2e | 正 | 机器 | 草稿箱落点 + git 断言 | P2 |
| TC-026 | R5/W7/P2-遗-6/§7 | e2e | 负 | 机器 | replace 缺 `--yes` | P0 |
| TC-027 | R4/W7 | e2e | 负 | 机器 | draft 遇旧草稿 | P0 |
| TC-028 | R5/W7 | e2e | 负 | 机器 | 草稿 ≠ 渲染 | P0 |
| TC-029 | §5.2/W7 | e2e | 负 | 机器 | `--draft` 不存在 | P1 |
| TC-030 | W7 | e2e | 负 | 机器 | 同一草稿 replace 二次 | P1 |
| TC-031 | R6/§5.3-3/W7 | e2e | 负 | 机器 | 无关漂移拒红（无草稿手改漂移） | P0 |
| TC-032 | R6/W7 | e2e | 负 | 机器 | baseline 类漂移拒红 | P1 |
| TC-033 | R5/§4/§5.2（第 4 轮 NF-1） | e2e | 负 | 机器 | 替换目标白名单外 / name 逃逸 | P1 |
| TC-034 | R5/§5.2 | e2e | 负 | 机器 | 无组件数据 | P1 |
| TC-035 | R1/§5.2（第 4 轮审计 Q1 补锚点） | e2e | 负 | 机器 | 草稿目录不可写 | P2 |
| TC-036 | R10/W5/R14-V4 | e2e | 负 | 机器 | 清单外新增规则 | P0 |
| TC-037 | R10/W5 | e2e | 负 | 机器 | 篡改已生成 agent | P0 |
| TC-038 | R3/§9-1 | e2e | 负 | 机器 | generate 副作用检查 | P0 |
| TC-039 | §6-1 | 单元 | 负 | 机器 | name 重复 / name 非法 regex | P0 |
| TC-040 | §6-2 | 单元 | 负 | 机器 | 占位符未消费/未闭合 | P1 |
| TC-041 | §6-3（第 4 轮 F1：断言 3 只测 name/tools） | 单元 | 负 | 机器 | agentData 字段缺失（name/tools）→ FrontmatterFieldMissing | P1 |
| TC-042 | §6-4 | 单元 | 负 | 机器 | tools 违规 | P1 |
| TC-043 | §6-5（第 4 轮 N1：同引用枚举同值） | 单元 | 负 | 机器 | sharedBlock 引用缺失 / 同引用枚举值分叉 | P1 |
| TC-044 | §6-6 | e2e | 负 | 机器 | 零漂移破坏 | P0 |
| TC-045 | §6-7 | 单元 | 负 | 机器 | when 含禁字样 / 尾「时」 | P1 |
| TC-046 | §6-8/R13 | 单元 | 负 | 机器 | 派生 description 不符 / 含「时时」 | P0 |
| TC-047 | §6-9/N4 残留（第 5 轮补重复 route） | 单元 | 负 | 机器 | route 悬空 → TriggerMissingRoute / 重复 → TriggerConflict | P1 |
| TC-048 | §6-12 | 单元 | 负 | 机器 | notWhen.refs 越界 | P1 |
| TC-049 | §6-13 | 单元 | 负 | 机器 | fallback 声明非法（值非 true / route 越界） | P1 |
| TC-050 | R14-V2 | e2e | 负 | 机器 | 目标副本改 1 字节 | P0 |
| TC-051 | R14-V2b | e2e | 负 | 机器 | CRLF 不归一 | P1 |
| TC-052 | R14-V3 | e2e | 负 | 机器 | 判据格空/空白/TODO | P1 |
| TC-053 | R14-V5 | e2e | 负 | 机器 | 非法类型 | P1 |
| TC-054 | R14-V6① | e2e | 负 | 机器 | 读 target 替身 | P1 |
| TC-055 | R14-V6② | e2e | 负 | 机器 | 模板贴全文签名 | P1 |
| TC-056 | R14-V7 | e2e | 负 | 机器 | 坏 baseline 五类 | P1 |
| TC-057 | R14-V8 | e2e | 负 | 机器 | BOM/CR/INVALID_UTF8 | P1 |
| TC-058 | R14-V10（第 4 轮 NF-4） | e2e | 负 | 机器 | check-all 拦新增规则 | P0 |
| TC-059 | R14-V10b（第 4 轮 NF-4） | e2e | 负 | 机器 | 差异 target 报 Mismatch | P1 |
| TC-060 | R14-V11 | e2e | 负 | 机器 | 六故障注入 | P1 |
| TC-061 | R9/§7/P2-遗-6（第 5 轮：exit 2 档 10 码） | 单元 | 负 | 机器 | 五档全码表归属（21+10+6+1=38，exit 2 档 10 码含 UnsupportedKind） | P0 |
| TC-062 | §4.1/R13/K 族 | 单元 | 负 | 机器 | agentData 无 description/触发表字段 | P1 |
| TC-063 | §4.2 | 单元 | 负 | 机器 | 拼装引入新词 | P2 |
| TC-064 | §4.1/§6-7 | 单元 | 边界 | 机器 | when 前导连接词 | P2 |
| TC-065 | R2/§5.4 | e2e | 边界 | 机器 | 草稿命名精确匹配 | P2 |
| TC-066 | R1/§5.1（第 4 轮 NF-3 + 审计 Q1 补锚点） | e2e | 负 | 机器 | draft --kind rule → UnsupportedKind | P2 |
| TC-067 | R11/§8.6 | e2e | 边界 | 机器 | registered 态检查/容忍红 | P1 |
| TC-068 | P2-遗-1/§8.6 | 集成 | 边界 | 机器 | 未入队不计 ≤3 | P1 |
| TC-069 | P2-遗-3/R11/W8 | e2e | 边界 | 机器 | 别名保留 | P1 |
| TC-070 | P2-遗-2/§8.6 | 集成 | 边界 | 机器 | 未入队数据迁入置 registered | P1 |
| TC-071 | R13/§8.1/P2-8/Q 族 | 单元 | 边界 | 机器 | 词表推迟至加席流程（P2 内无词表断言） | P1 |
| TC-072 | R5 | e2e | 边界 | 机器 | `--draft` 不受 ROOT 白名单约束 | P2 |
| TC-073 | R5 | e2e | 负 | 机器 | replace 原子性（写失败无半写文件） | P2 |
| TC-074（作废） | R2/§5.4（盲点驱动） | e2e | 边界 | 机器 | 同秒两次 draft 撞名（spec 第 2 轮 §5.4 已定义行为，断言升级见 TC-081） | P2 |
| TC-075 | R15 | 人工 | 边界 | 人工 | 停损计数（修 2 次仍红） | P1 |
| TC-076 | R15 | 人工 | 边界 | 人工 | 环境/基线红不计停损 | P2 |
| TC-077（作废） | R10/§8.6（盲点驱动） | e2e | 边界 | 机器 | registered 对象文件缺失（spec 第 2 轮 §8.6 已定义错误码，断言升级见 TC-082） | P2 |
| TC-078 | §6-10（第 2 轮新增）/P2-8-断言 c | 单元 | 正 | 机器 | `node --test tools/docgen/test/validate.test.mjs`（六视角席 when 两两唯一通过） | P1 |
| TC-079 | §6-10（第 2 轮新增）/P2-8-断言 c | 单元 | 负 | 机器 | validateAgentData 注入两席同 when（单测） | P0 |
| TC-080 | §6-11（第 2 轮新增） | 单元 | 负 | 机器 | validateAgentData 注入非法 outputKind（单测） | P0 |
| TC-081 | R2/§5.4（第 2 轮新增；第 3 轮 L 族统一码 + W 族隔离变量同步） | e2e | 负 | 机器 | 同秒内同 `--name` 连续两次 draft（DOCGEN_DRAFTS_DIR 下） | P1 |
| TC-082 | R10/R11/§8.6（第 2 轮新增） | e2e | 负 | 机器 | 删 registered 对象 `agents/<name>.md` 后 gate + check-agents | P1 |
| TC-083 | R2/§5.4/W 族（第 3 轮扩展 DOCGEN_DRAFTS_DIR） | 集成 | 负 | 机器 | DOCGEN_DRAFTS_DIR 下跑测试套件 + 真实草稿箱快照比对 | P1 |
| TC-084 | §6-14/Q-2-01（第 3 轮新增；第 4 轮豁免口径） | 单元 | 负 | 机器 | 已拆槽席 when 缺省/为空 → MissingWhen（registered 未拆槽席豁免） | P0 |
| TC-085 | §6-14/Q-2-01（第 3 轮新增；第 4 轮豁免口径） | 单元 | 正 | 机器 | 已拆槽席每席 ≥1 条 when 通过 + registered 豁免 | P0 |
| TC-086 | §6-13/B 族（第 3 轮新增） | 单元 | 正 | 机器 | fallback 未声明 = 合法；声明 true 合法 | P0 |
| TC-087 | §6-7/A 族（第 3 轮新增） | 单元 | 负 | 机器 | when 以「时」结尾 → WhenFormatViolation | P0 |
| TC-088 | §6-8/R13/A 族（第 3 轮新增） | 单元 | 负 | 机器 | 派生 description 含「时时」连续字 → DescriptionDerivation | P0 |
| TC-089 | R3/§5.2/D 族（第 3 轮新增） | e2e | 正 | 机器 | generate registered 态豁免（跳过逐字节、容忍红） | P0 |
| TC-090 | R3/§5.2/Y 族（第 3 轮新增） | e2e | 负 | 机器 | generate --name <不存在> → MissingComponentData | P0 |
| TC-091 | R2/§5.4/I 族（第 3 轮新增） | e2e | 正 | 机器 | draft rm --yes 删全部成功 | P0 |
| TC-092 | R6/§5.3-3/F 族（第 3 轮新增） | e2e | 正 | 机器 | 拒红判别子：同源多目标 B 已落草稿放行 | P0 |
| TC-093 | R6/§5.3-3/F 族（第 3 轮新增） | e2e | 负 | 机器 | 拒红判别子：无草稿手改漂移拒 | P0 |
| TC-094 | R11/§8.3/§8.6/W 族（第 3 轮新增） | e2e | 负 | 机器 | 已巩固对象文件缺失 → DanglingBaselineEntry | P0 |
| TC-095 | §6-1/X 族（第 3 轮新增） | 单元 | 负 | 机器 | name 非法 regex → InvalidName | P0 |
| TC-096 | §6-5/X 族/N1（第 3 轮新增；第 4 轮 N1 修正） | 单元 | 正 | 机器 | sharedBlock 同引用枚举同值 + 无 sharedBlock 席不渲染 | P1 |
| TC-097 | §8.2/§6-10/Y 族（第 3 轮新增） | e2e | 正 | 机器 | 新增席 when 与现有 14 席两两不同（断言 10 联动） | P0 |
| TC-098 | R14-V6③（第 3 轮新增；第 4 轮标注正/负） | e2e | 正/负 | 机器 | V6③ 判据增删同步（renderBlocks 数据驱动） | P1 |
| TC-099 | R1/R3/§5.1/§5.2/NF-2（第 4 轮新增） | e2e | 正 | 机器 | generate --kind 缺省 = rule + agent 两清单全遍历 | P0 |
| TC-100 | R5/§5.1/§5.2/NF-3（第 4 轮新增） | e2e | 负 | 机器 | replace --kind rule → UnsupportedKind | P1 |
| TC-101 | §5.2/NF-1（第 4 轮新增） | e2e | 负 | 机器 | CLI 层 --name 逃逸（/、..、\）→ InvalidName | P1 |
| TC-102 | §4.2/§6-8/R13/Q-3-NEW-1（第 5 轮新增） | 单元 | 正 | 机器 | gate×registered：registered 未拆槽席 W4 派生断言豁免（不触发 DescriptionDerivation） | P0 |

**覆盖核对（可复算口径，P2-R 修订；第 3 轮同步，第 4 轮 Q-2-03 修订；第 5 轮同步）**：覆盖锚点按**五类**分项计数（Q-2-03：原「四类」表述与表格五类不符、「不重叠」与 P2-遗 交叉矛盾，均已修正——五类分项中 P2-遗 与 R 编号的交叉按收口口径计入，不宣称「不重叠」），合计 `54` 个独立锚点：

| 分项 | 计数 | 构成 |
|---|---|---|
| ① §2 核心决定 R1–R15 | 15 | R1–R15 逐一 |
| ② §6 守卫断言 1–14 | 14 | 含第 3 轮新增断言 14（MissingWhen） |
| ③ §7 退出码档位 | 5 | 0 / 1 / 2 / 3 / 4 |
| ④ §8.4 等价迁移例 | 15 | V1 / V2 / V2b / V3 / V4 / V5 / V6① / V6② / V6③ / V7 / V8 / V9 / V10 / V10b / V11（Q-2-04/读者 P2-1：V6 拆三子例 → 等价迁移锚点共 **15** 个） |
| ⑤ §8.5 P2-遗-1/2/3/6/8 | 5 | 与 R 编号有交叉，按收口口径独立计入（Q-2-03：交叉属锚点复用，非「不重叠」矛盾） |

**合计 = 15 + 14 + 5 + 15 + 5 = 54**。去重推导：W 锚点（W4–W9，6 项）与 §10「测什么」七行**不单独计数**——已全部映射到上述锚点（W4→R13+§6-8、W5→R10/R12、W6→R4/R5、W7→R4/R5/R6、W8→R7/R11、W9→R14；§10 七行分别映射 R1/R2、R4/R5、R7、R9、R6、R14、R13），重复计数必虚高，故剔除。原「43/43」口径因 §6 断言 13→14、V6 ①→③、P2-R 去重推导修订为 `54/54`，未覆盖 `0` 项。

**编号口径（P2-S；第 5 轮更新）**：TC-001~TC-102 共 `102` 个编号；其中 TC-074/TC-077 作废保留（盲点发现记录，标「作废」）；有效用例 `100` 条。负例与边界合计 `66` 条 ≥ 正例 `34` 条（第 4 轮新增：TC-099 正例、TC-100/TC-101 负例；TC-098 标注改「正/负」、计数归负界——判据含正负两态，审计 Q2；第 5 轮新增：TC-102 gate×registered 豁免专项正例）。

**覆盖指认**：覆盖表每条用例覆盖列指回上述锚点（R 编号 / §6-N / §7 档位 / V 例 / P2-遗-N / 族裁决）；TC-084~098（第 3 轮新增）补齐断言 14、fallback vacuous、时时断言（尾「时」+「时时」）、generate×registered、draft rm --yes、拒红判别子（有草稿/无草稿）、文件缺失 exit 2（registered + 已巩固）、name 非法 regex、sharedBlock 同值、新增席 when 唯一、V6③ 判据增删同步。spec §10「测什么」七行逐行有对应用例。**纯节号覆盖列可追溯至对应 R 编号**（TC-035→R1/§5.2、TC-066→R1/§5.1，审计 Q1）。**第 4 轮新增/同步**：TC-099~101 分别锚定 NF-2（generate --kind 缺省两清单遍历）/ NF-3（replace 非 agent kind → UnsupportedKind）/ NF-1（CLI 层 --name 逃逸 → InvalidName 检查序①）；TC-033 判据对齐 NF-1（name 逃逸 = InvalidName（exit 1）而非 InvalidOutputPath）；TC-084/085 对齐 Q-2-01（断言 14 仅对已拆槽席生效，registered 未拆槽席豁免）；TC-043/096 对齐 N1（同引用枚举同值 + 无 sharedBlock 席不渲染）；TC-058/059 对齐 NF-4（--no-clean 不承接，由 gate 读仓库真文件 + .tmp-test/** 承接）；TC-066/100 对齐 NF-3；TC-002/012 补 NF-5（agent 清单字典序排序）；TC-098 标注改「正/负」（审计 Q2）；TC-080 不覆盖措辞改「§4.1 已列 4 值」（§8 建议 1 已落地）。**第 5 轮同步**：TC-061 判据改 38 码（exit 2 档 10 码含 UnsupportedKind）；TC-014/046/088 补 W4 派生断言 registered 豁免（Q-3-NEW-1，与断言 14 同口径）；TC-047 补 route 重复 → TriggerConflict 分支（N4 残留裁决，与悬空 TriggerMissingRoute 两码区分）；TC-013/071 补词表衔接（W5 新增 dc-translator 席同样豁免词表 + 词表首次生效时点 = dc-translate 落地后）；TC-058/059 补 gate 无独立注入参数、V10/V10b 由 generate --kind rule --name <目标> --target <副本> 承接（Q3-F2）；新增 TC-102（gate×registered 豁免专项）。

## 2 用例明细

### TC-001 generate --kind rule 内存渲染比对（V1 等价承接）→ exit 0 且不写盘

- **覆盖**：`R1 / R3 / R14-V1（整文件模型等价承接）`
- **前置**：`tools/docgen/` 已落位（组件 / 模板 / cli）；baseline 两清单常量已收录（迁移期 rule 21，终态 rule+agent 随常量演进：开工 35，W5 后 36+，P1-N）；干净工作树
- **步骤**：① `node tools/docgen/cli.mjs generate --kind rule`；② 检查 stdout；③ `git status --short rules/ tools/docgen/`
- **预期**：逐字节一致（无漂移报告）；打印 `baseline N/N`（N 从共享常量派生，迁移期 21，终态随常量演进：开工 35 = 21+14，W5 新增席后 36+，不写死，P1-N）；不写盘、不落草稿
- **判据**：退出码 0；stdout 含 `baseline <N>/<N>`（N = 常量派生值，非硬编码）；`git status --short rules/` 为空（生成物零改动）；草稿箱目录无新增
- **红绿证据**：红 = `node tools/docgen/cli.mjs generate --kind rule` 退出码非 0 或报 `Mismatch`（迁移前等价重建未完成）；绿 = 同一命令退出码 0 且 stdout 含 `baseline N/N` 一致报告
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 agent 侧逐席比对（S2/S3/S4）；不覆盖写盘路径（`draft`/`replace` 是写盘入口）

### TC-002 generate 无 --name 遍历两清单全部对象

- **覆盖**：`R1 / R3（无 --name 遍历全部 rule + agent 两清单）；agent 清单 = Object.keys(agentData) 派生 + 字典序排序（P1-M / NF-5：Object.keys 是插入序非字典序，必须显式 sort）`
- **前置**：同 TC-001；agentData 全 14 席已入组件（13 席 ROLES 迁入 + senior-sdet 转录）；registered 态席存在性满足（S1 序 0 按 §8.6 收录 14 席 registered 态，P1-O：when/route 拆槽由 S2/S3/S4 完成，本用例针对已具完整组件数据的席）
- **步骤**：① `node tools/docgen/cli.mjs generate`；② 读 stdout 对象清单
- **预期**：输出覆盖 rule 清单全部 + agent 清单全部 14 席，每对象一行一致/漂移结论（registered 席标注未巩固、不逐字节比对）
- **判据**：退出码 0；stdout 中 agent 对象数 = `Object.keys(agentData).length`（= 14，常量派生，非硬编码）；`git status --short` 为空
- **红绿证据**：红 = stdout 缺 agent 对象（只跑了 rule 清单）；绿 = 两清单全遍历且无漂移
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 registered 态对象的逐字节比对（那由 check-agents/gate 承接）；不覆盖 registered 对象文件缺失（TC-082）

### TC-003 generate --kind agent --name 精确到单对象

- **覆盖**：`R1 / R3（--name 精确到单对象，便于施工期调试）`
- **前置**：同 TC-002
- **步骤**：① `node tools/docgen/cli.mjs generate --kind agent --name reviewer-audit`；② 读 stdout
- **预期**：只输出 reviewer-audit 一个对象的比对结论，不遍历其它对象
- **判据**：退出码 0；stdout 仅含 `reviewer-audit`，不含其它 agent 名称
- **红绿证据**：红 = 命令忽略 `--name` 仍遍历全部 / 对不存在 name 误报其它码；绿 = 精确到单对象
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 `--name` 对 rule 侧的行为（V1 族用例覆盖）；不覆盖 `--name` 不存在 → `MissingComponentData`（TC-090，P1-D/Y 族）

### TC-004 draft --kind agent 落草稿箱且 agents/ 零改动

- **覆盖**：`R1 / R4 / W6（草稿 → 替换，落草稿不碰 agents/*.md）`
- **前置**：草稿箱不存在或为空；`agents/<name>.md` 已存在（对象已收编）
- **步骤**：① `node tools/docgen/cli.mjs draft --kind agent --name reviewer-audit`；② `git status --short agents/`；③ 列出草稿箱
- **预期**：草稿箱出现 `reviewer-audit--<YYYYMMDD-HHMMSS>.md`；`agents/` 零改动；草稿内容 = 内存渲染字节
- **判据**：退出码 0；`git status --short agents/` 为空；草稿箱文件存在且文件名匹配 `^reviewer-audit--\d{8}-\d{6}\.md$`；草稿内容与 `generate --kind agent --name reviewer-audit` 的渲染结果 `Buffer.compare` 相等
- **红绿证据**：红 = draft 直接写 `agents/*.md`（git status 非空）；绿 = agents/ 零改动、草稿落箱
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖「遇旧草稿」分支（TC-027）

### TC-005 draft ls 列出全部草稿（机器语义部分）

- **覆盖**：`R1 / R2 / W7（draft ls 带时间列出；每 name 至多一份草稿，G 族）`
- **前置**：草稿箱已有 ≥2 个不同 name 的草稿（每 name 至多一份）
- **步骤**：① `node tools/docgen/cli.mjs draft ls`；② `node tools/docgen/cli.mjs draft ls --name <name>`
- **预期**：无 --name 列出全部草稿（每行 name + 时间戳）；带 --name 只列该 name 下的草稿（至多一份）
- **判据**：退出码 0；stdout 行数 = 草稿箱文件数（无 --name）/ ≤1（带 --name，每 name 至多一份）；每行含 `--` 与时间戳形态
- **红绿证据**：红 = 带 --name 仍列出全部 / 同 name 出现两行；绿 = 过滤正确 + 每 name 至多一行
- **对应测试**：待 plan Task N
- **不覆盖**：时间戳的「观感」（可读性）为人工项，见 §5

### TC-006 draft rm --name 删该名下全部

- **覆盖**：`R1 / R2（draft rm --name 删该名下全部；每 name 至多一份草稿，G 族）`
- **前置**：草稿箱某 name 下 1 份草稿，另有其它 name 草稿（每 name 至多一份）
- **步骤**：① `node tools/docgen/cli.mjs draft rm --name <name>`；② `node tools/docgen/cli.mjs draft ls`
- **预期**：该 name 下草稿删除；其它 name 草稿保留
- **判据**：退出码 0；`draft ls` 输出不再含该 name；其它 name 行数不变
- **红绿证据**：红 = 误删其它 name 或漏删；绿 = 该 name 删除、其余保留
- **对应测试**：待 plan Task N
- **不覆盖**：删全部（无 --name）见 TC-007（需 --yes）/ TC-091（带 --yes）

### TC-007（spec 第 3 轮修复同步）draft rm 无 --name 且无 --yes → NotAuthorized exit 4

- **覆盖**：`R1 / R2 / I 族（draft rm 无 --name 删全部需 --yes 授权，缺省 → NotAuthorized（exit 4））`
- **前置**：草稿箱 ≥2 个 name 的草稿
- **步骤**：① `node tools/docgen/cli.mjs draft rm`（无 --name、无 --yes）；② 检查草稿箱
- **预期**：拒绝删除；报 `NotAuthorized`；exit 4；草稿箱内容不变
- **判据**：退出码 4；输出含 `NotAuthorized`；草稿箱文件集与运行前一致
- **红绿证据**：红 = 无 --yes 仍删全部（未授权破坏性操作）；绿 = NotAuthorized（exit 4）拒绝
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖带 --yes 删全部的成功路径（TC-091）

### TC-008 draft ensure 幂等建目录

- **覆盖**：`R1 / R2（draft ensure 幂等建目录，语义与 use-rule-skills/drafts.mjs 对齐）`
- **前置**：草稿箱目录不存在；再次运行时目录已存在
- **步骤**：① 首跑 `node tools/docgen/cli.mjs draft ensure`；② 二跑同命令
- **预期**：首次创建目录，二次无报错（幂等）；目录存在
- **判据**：两次退出码均 0；目录存在；二跑无「已存在」类错误输出
- **红绿证据**：红 = 二跑报错（非幂等）；绿 = 二跑静默成功
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖目录权限拒绝（TC-035）

### TC-009 replace --yes 完整成功路径

- **覆盖**：`R1 / R5 / W6（字节校验 → gate 前置 → 原子替换 → 清草稿 → gate 绿）`
- **前置**：组件数据已改（合法稳态修改）；`draft` 已落草稿；`agents/<name>.md` 为目标对象
- **步骤**：① `node tools/docgen/cli.mjs replace --kind agent --name <name> --draft <草稿> --yes`；② `node tools/docgen/cli.mjs gate`；③ 草稿箱检查
- **预期**：草稿字节 === 内存渲染（校验过）；目标自身差异被 gate 前置排除；`agents/<name>.md` = 草稿字节；替换后该 name 下草稿已清；gate 全绿
- **判据**：replace 退出码 0；`gate` 退出码 0；`Buffer.compare(agents/<name>.md, 草稿)` 相等；`draft ls --name <name>` 为空
- **红绿证据**：红 = 缺 `--yes` 被拒（见 TC-026）或草稿校验未做（手改草稿仍替换）；绿 = 上述全通过
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖与目标无关的 gate 红（TC-031/032）

### TC-010 gate 两清单基线 + 重建比对全绿

- **覆盖**：`R1 / R10 / W5（gate 跑两清单基线 + 重建比对，35 条常量开工即收录，比对子集随迁移演进）`
- **前置**：全部 rule（21）已巩固；已迁移 agent 已巩固；registered 态对象存在性满足（S1 序 0 按 §8.6 收录 14 席 registered 态，P1-O：when/route 拆槽由 S2/S3/S4 完成，本用例针对已具完整组件数据的席）
- **步骤**：① `node tools/docgen/cli.mjs gate`
- **预期**：baseline 两清单校验过；已巩固对象重建比对无漂移；registered 对象登记/存在检查过；W4 派生断言全过（含「时时」机械断言）；打印 `baseline N/N`（N 从共享常量派生）
- **判据**：退出码 0；stdout 含 `baseline N/N`（N = 常量派生：开工基线 35 = 21 rule + 14 agent；W5 新增席后随常量演进为 36+，**不写死 35/35，P1-N**）；无 `Mismatch` / `UnregisteredHandwritten` 输出
- **红绿证据**：红 = 篡改一个已巩固 agent 后 gate 仍 exit 0（重建比对未生效）；绿 = 篡改后 gate exit 1 报 `Mismatch`
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 gate 的错误分档（TC-036/037/056/061 覆盖）

### TC-011 check-agents 已巩固对象逐字节一致 → exit 0

- **覆盖**：`R1 / R11 / W8（已巩固逐字节比对、exit 0=一致）`
- **前置**：≥1 个已巩固 agent；无 registered 态对象（或存在时按 TC-067 口径）
- **步骤**：① `node tools/docgen/cli.mjs check-agents`
- **预期**：遍历全部 agent 对象；已巩固对象逐字节比对一致
- **判据**：退出码 0；stdout 标注已巩固对象全部一致，无漂移行
- **红绿证据**：红 = 手改一个已巩固 agent 后仍 exit 0；绿 = exit 1 且漂移消息含文件名
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 registered 态（TC-067）

### TC-012 baseline --write 渲染当前常量两清单写 baseline

- **覆盖**：`R1 / R12 / §4.3（承接 P1 --write-baseline 语义；非固定 35 条；agent 清单 = Object.keys(agentData) 派生 + 字典序排序（NF-5）；两清单条目为 POSIX 路径、字典序、经 path.posix 归一，P1-H）`
- **前置**：记录当前常量两清单（rule + agent 路径集）
- **步骤**：① `node tools/docgen/cli.mjs baseline --write`；② 读 baseline 文件；③ `node tools/docgen/cli.mjs gate`
- **预期**：baseline 文件 = 当前常量两清单的渲染（`JSON.stringify(..., 2) + '\n'` 口径，落点 `tools/docgen/baseline.json`）；条目均为 POSIX 路径（无 `\`）且字典序；gate 校验 baseline 无漂移
- **判据**：退出码 0；baseline 文件字节 === `renderBaseline(常量)`；条目含 `\` 断言 0（path.posix 归一，Windows 下不经归一会撞 `InvalidBaselinePath`）；条目按字典序排列；gate 退出码 0
- **红绿证据**：红 = 新增一条合法 agent 路径后 gate 报 `UnregisteredHandwritten`（未走 --write）/ Windows 下路径含 `\` 触发 `InvalidBaselinePath`；绿 = 走 --write 后 gate 绿
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖受控变更旅程全流程（TC-013）

### TC-013（spec 第 5 轮修复同步）新增 1 席受控变更旅程（W5 终态验收）

- **覆盖**：`W5 / R12（加组件数据 → 生成 → 草稿 → 确认 → 替换 → baseline --write → gate 绿）；新增席 when 与现有 14 席两两不同（断言 10 联动，P2-Y）；replace 必须带 --yes（§9-10，P2-Y）；新增席 description 同样豁免词表（N3 残留裁决：词表第一次生效时点 = dc-translate skill 落地后的加席流程）`
- **前置**：干净树；`docs/after/20261019131757-dc-translator-design.md` 的试点对象已具备组件数据口径；新增席 when 构造为与现有 14 席两两不同
- **步骤**：① 加组件数据（agentData + triggerTable）；② `generate --kind agent --name <新增>`；③ `draft --kind agent --name <新增>`；④ `replace --kind agent --name <新增> --draft <草稿> --yes`；⑤ `baseline --write`；⑥ `gate`
- **预期**：旅程每步退出码 0；新增席进入 baseline 常量；新增席 when 不撞现有席（断言 10 联动，否则 `DuplicateWhen`）；新增席 description 同样豁免词表（与 13 席/senior-sdet 一致，句式机械锁定，词表首次生效时点 = dc-translate 落地后，P2 内不触发词表断言）；最终 gate 绿；`git status --short agents/ rules/ skills/` 干净
- **判据**：步骤 ①–⑥ 退出码均 0；replace 显式带 `--yes`（九步闭环步 7 口径，§9-10，缺省被拒则旅程卡死）；gate stdout 含 `baseline N/N`（N = 常量派生：旅程前 35 = 21+14，旅程后 36 = 21+15，**不写死 35/35 或 36/36，P1-N**）；后置 `git status --short` 干净
- **红绿证据**：红 = ⑤ 之前跑 gate 报 `UnregisteredHandwritten`（新增席未登记）/ 新增席 when 撞现有席仍绿（断言 10 失效）/ replace 漏 --yes 被拒 / 新增席 description 被 P2 内词表断言误拦；绿 = 全旅程走完 gate 绿
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖翻译闭环（PRD §1.1，P2 内不验收）；不覆盖该席的数据准确性（S2/S4）；新增席 when 唯一性的独立负例见 TC-097；不覆盖词表对新增席的首个生效点（dc-translate 落地后，届时 description 由 AI 翻译而非句式拼装，见 TC-071）

### TC-014（spec 第 5 轮修复同步）validateAgentData 全 14 席通过（守卫迁移总入口）

- **覆盖**：`R7 / §6 全表（validateAgentData 承接 6 条迁移断言 + 8 条新增断言，含第 3 轮断言 14 MissingWhen，共 14 条）；W4 派生断言 registered 豁免（§4.2 Q-3-NEW-1：与断言 14 同豁免口径——S1 阶段仅对已拆槽席生效，registered 未拆槽席豁免，拆槽完成后全量生效）`
- **前置**：agentData 14 席 + triggerTable 完整；两模板（agent.md.tpl / agent-handwritten.md.tpl）就位；对未拆槽席按 P1-O 口径以 registered 态存在性通过；registered 未拆槽席不参与 W4 派生断言（Q-3-NEW-1，when 未拆槽无法按句式拼装）
- **步骤**：① `node --test tools/docgen/test/validate.test.mjs`（或等价单测入口）
- **预期**：对 14 席全量校验无错误；返回第一个错误的口径未触发（全部通过）；registered 未拆槽席的 when 未拆槽不触发 `DescriptionDerivation`（W4 派生断言豁免生效）
- **判据**：退出码 0；测试用例全过；无任一错误码抛出的断言失败；W4 派生断言对 registered 未拆槽席按豁免口径执行（不抛 `DescriptionDerivation`）
- **红绿证据**：红 = 迁移后校验器对现有 14 席误报（迁移丢数据）/ registered 未拆槽席被 W4 派生断言误伤（豁免失效）；绿 = 全过
- **对应测试**：待 plan Task N
- **不覆盖**：单条断言失败分支由 TC-039~049/078~080/084~088/095/096 覆盖（第 3 轮断言 14 的失败分支为 TC-084，正例为 TC-085）；W4 派生断言 registered 豁免的专项见 TC-102

### TC-015 W4 锚点 reviewer-product 派生 description 逐字相等

- **覆盖**：`R13 / W4 / §8.1（固定锚点 reviewer-product 的触发表数据 → 派生 == 句式拼装逐字相等）`
- **前置**：reviewer-product 的 when 已逐字提取进触发表；domain 常量「议会评审」在位
- **步骤**：① 取 reviewer-product 组件数据；② 按句式 `在{domain}中担任{role}。{when}时调用` 拼装；③ 与渲染输出 description 比对
- **预期**：派生 description == 句式拼装结果逐字相等；== 迁移前现 `agents/reviewer-product.md` frontmatter description
- **判据**：`Buffer.compare`（或字符串严格相等）为零；gate 对该席的派生断言通过（exit 0）
- **红绿证据**：红 = 组件硬编码 description 字段绕过派生（gate 派生断言 exit 1 报 `DescriptionDerivation`）；绿 = 派生正确 gate 绿
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖迁移期黄金断言的现场执行（S2 首次落）

### TC-016 W4 锚点 senior-sdet 专属句式逐字复现

- **覆盖**：`R13 / W4 / P2-2 / §8.1（专属句式 {身份句}。{when}时调用。Do not use for {notWhen}。逐字复现）`
- **前置**：senior-sdet 已转录为组件数据（agent-handwritten.md.tpl）；身份句 / when / notWhen 逐字取自现 description 原文
- **步骤**：① 取 senior-sdet 组件数据；② 按专属句式拼装；③ 与渲染输出 description 比对；④ 与现 `agents/senior-sdet.md` frontmatter description 比对
- **预期**：派生 description == 专属句式拼装结果逐字相等 == 现 description 原文；拼装不引入新词
- **判据**：字符串严格相等通过；gate 对 senior-sdet 的派生断言 exit 0；P2 内无词表断言（Q 族裁决：词表推迟至加席流程，见 TC-071），该席不被词表拦截
- **红绿证据**：红 = 转录改写（措辞变化）导致逐字不等；绿 = 逐字复现
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖手写正文转录（W2，S3）

### TC-017 目标对象自身预期差异放行（拒红过滤第 3 条）

- **覆盖**：`R6 / §5.3-3 / W6 / F 族（判别子 D ⊆ {目标} ∪ {该文件有草稿且草稿==渲染}；目标对象自身差异属 {目标} → 放行）`
- **前置**：组件数据合法改动；draft 已落；此时 gate 对目标对象红（预期差异）
- **步骤**：① 跑 `gate`（确认目标对象红、其它对象绿）；② `replace --kind agent --name <name> --draft <草稿> --yes`
- **预期**：目标对象自身差异被 gate 前置排除（判别子 {目标} 成员），替换放行；替换后 gate 全绿
- **判据**：replace 退出码 0；替换后 `gate` 退出码 0（目标差异已收敛）
- **红绿证据**：红 = 目标自身差异被当成拒红拒绝替换；绿 = 放行替换并收敛
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖与目标无关的漂移（TC-031/032/093）

### TC-018 同一组件改动引发的多目标差异逐目标替换收敛

- **覆盖**：`R6 / §5.3-5 / PRD §6.5（共享模式改动影响多 agent = 同源预期差异，逐目标替换收敛；P2-U 节号标注修正）`
- **前置**：patternRegistry 共享模式改动（如 sharedBlock 措辞变更）影响 ≥2 个 agent
- **步骤**：① 对目标 A `draft` → `replace --yes`（此时 B 仍红 = 同源预期）；② 对目标 B `draft` → `replace --yes`；③ `gate`
- **预期**：步骤 ① 替换 A 成功（B 的红不构成拒红）；步骤 ② 替换 B 成功；全部目标替换后 gate 才绿
- **判据**：两步 replace 退出码均 0；中间态 gate 红不阻止逐目标收敛；终态 gate 退出码 0
- **红绿证据**：红 = 替换 A 时因 B 漂移被拒（把同源差异当无关漂移）；绿 = 逐目标收敛
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖「未改组件却红」的排查路径（PRD §6.4 回退，人工）；不覆盖「B 已落草稿」的判别子放行路径（TC-092）

### TC-019 check-agents 语义等价旧 --check（遍历全部对象）

- **覆盖**：`R11 / W8 / §8.3（检查语义与旧 --check 等价；输出文本允许 13→14 计数变化）`
- **前置**：全部 14 席已在 docgen 组件（终态）
- **步骤**：① `node tools/docgen/cli.mjs check-agents`；② 对照旧 `gen-agents --check` 的语义清单逐项核对
- **预期**：遍历 baseline 清单内全部 agent 对象（含已巩固与 registered）；已巩固逐字节比对；漂移消息含文件名；输出计数为 14（旧为 13 属允许变化）
- **判据**：退出码 0（一致）；stdout 覆盖 14 席对象名；漂移场景（手改后）退出码 1 且消息含 `<name>.md`
- **红绿证据**：红 = 只检查已巩固席、跳过 registered 席；绿 = 全对象遍历
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖别名保留（TC-069）

### TC-020 守卫迁移 + check-all 参数化同批（序 0）

- **覆盖**：`R7 / R8 / §9-4（守卫迁移 + check-all 参数化必须同批完成，序 0；BE-3-02）`
- **前置**：S1 施工序 0 完成
- **步骤**：① 断言 `skills/parliament/scripts/gen-agents.test.mjs` 已删除；② 断言 6 条守卫断言在 `validateAgentData` / `check-agents` 中可触发（用 TC-039~044 负例验证）；③ 断言 `scripts/check-all.mjs` 的 gate 调用指向 `tools/docgen/cli.mjs gate`；④ `node scripts/check-all.mjs`
- **预期**：旧测试文件不存在；守卫断言有承接；check-all 不再调用 `tools/docgen-spike/run.mjs --gate`；check 全绿
- **判据**：`fs.existsSync('skills/parliament/scripts/gen-agents.test.mjs') === false`（P2-V 笔误修正：`Test.existSync` → `fs.existsSync`）；check-all.mjs 源码含 `tools/docgen/cli.mjs gate` 且不含 `docgen-spike` gate 调用（读文件核对）；`node scripts/check-all.mjs` 退出码 0
- **红绿证据**：红 = 删了测试但守卫断言无承接（check-all 仍绿但守卫失效——迁移前状态）；绿 = 同批完成且断言可触发
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 W8 的 `gen-agents.mjs` 删除（TC-021）

### TC-021 W8 删 gen-agents.mjs 后 npm run check 全绿

- **覆盖**：`R7 / W8 / §8.3（W8 删 gen-agents.mjs 后 npm run check 全绿）`
- **前置**：全部 14 席数据已迁入 docgen 组件（含未入队席置 registered 态）
- **步骤**：① 确认 `skills/parliament/scripts/gen-agents.mjs` 已删除；② `node scripts/check-all.mjs`
- **预期**：删除后 check 全绿（守卫由 docgen gate + check-agents 承接，无悬空引用）；parliament 技能目录无 gen-agents 残留引用
- **判据**：`check-all.mjs` 退出码 0；`Grep('gen-agents', 'skills/parliament')` 命中 0（SKILL.md / assembly-matrix.md 已改指 docgen 流程）
- **红绿证据**：红 = 删除后 `npm run check` 报「模块不存在」或议会文档仍指 gen-agents；绿 = 全绿 + 零残留引用
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 parliament 文档改指后的可读性（§5 人工项）

### TC-022 V9 可复跑：两遍输出逐字一致 + 无残留

- **覆盖**：`R14-V9（generate 两遍输出逐字一致 + 无残留 + git check-ignore）`
- **前置**：全部等价迁移用例已实现；干净树
- **步骤**：① `node tools/docgen/cli.mjs generate` 第一遍存输出；② 第二遍存输出；③ 逐字比对两遍；④ 检查残留；⑤ `git check-ignore` 验证临时目录被忽略
- **预期**：两遍输出逐字一致；无 `.tmp-test/` 残留；临时测试路径在 `.gitignore` 内
- **判据**：两遍输出 `Buffer.compare` 相等；`git status --short rules/ tools/docgen/` 为空；`git check-ignore -q tools/docgen/.tmp-test/x` 退出 0
- **红绿证据**：红 = 第二遍有残留文件导致不一致（迁移前 spike 已知风险）；绿 = 两遍一致无残留
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 agent 侧可复跑细节（由各 TC 各自断言）

### TC-023 check-all baseline N/N 从常量派生（非硬编码 21/21）

- **覆盖**：`R8 / P2-5 / §7-交付物6（baseline 断言从共享常量派生 baseline N/N，不再硬编码 21/21）`
- **前置**：check-all 参数化完成
- **步骤**：① 读 `scripts/check-all.mjs` 源码；② `node scripts/check-all.mjs` 看 stdout；③ 改共享常量（增删一条路径）后重跑
- **预期**：gate 调用输出 `baseline N/N` 随共享常量变化（21 → N），源码无 `21/21` 字面量硬编码
- **判据**：源码 Grep `baseline 21/21` 命中 0（或命中处为注释）；常量增删后 stdout 的 N 同步变化；check 退出码 0
- **红绿证据**：红 = 现状 check-all.mjs L103 硬编码 `/baseline 21\/21/`（实测存在，迁移前红）；绿 = 改为常量派生
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖常量本身的数量（迁移期 21，终态随常量演进：开工 35，W5 新增席后 36+，由迁移推进）

### TC-024 replace 成功后该名下草稿已清

- **覆盖**：`R5 / §5.4 / W6（replace 成功后清该名下全部草稿；每 name 至多一份草稿，G 族）`
- **前置**：某 name 下 1 份草稿（每 name 至多一份，G 族）
- **步骤**：① `replace --kind agent --name <name> --draft <草稿> --yes`；② `draft ls --name <name>`
- **预期**：替换成功后该 name 下草稿被清
- **判据**：replace 退出码 0；`draft ls --name <name>` 输出为空
- **红绿证据**：红 = 替换后草稿残留；绿 = 该 name 下清空
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖替换失败时草稿保留（TC-031/032/093 断言）

### TC-025 草稿箱 homedir 落点 + 不进 git

- **覆盖**：`R2 / §5.4（草稿箱 ~/.retro-skills/docgen-drafts/，不进仓库、不进 git）`
- **前置**：草稿已产生
- **步骤**：① 确认草稿箱绝对路径；② `git status --short` 全仓
- **预期**：草稿箱位于 homedir（`~/.retro-skills/docgen-drafts/`），仓库内无草稿副本；git 无草稿相关改动
- **判据**：`git status --short` 不含 docgen-drafts 路径；草稿箱路径以 `os.homedir()` 开头（Node 单测断言）
- **红绿证据**：红 = 草稿被写入仓库内（git status 出现未跟踪文件）；绿 = homedir 落点干净
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖「若落仓库内则 .gitignore」的替代方案（spec §3.1 已定 homedir 优先）

### TC-026 replace 缺 --yes → NotAuthorized exit 4

- **覆盖**：`R5 / W7 / P2-遗-6 / §7（永不静默替换；缺 --yes → NotAuthorized（exit 4））`
- **前置**：草稿已落；`agents/<name>.md` 存在
- **步骤**：① `node tools/docgen/cli.mjs replace --kind agent --name <name> --draft <草稿>`（无 --yes）
- **预期**：拒绝替换；`NotAuthorized`；exit 4；`agents/<name>.md` 不变；草稿保留
- **判据**：退出码 4；stderr/stdout 含 `NotAuthorized`；`git status --short agents/` 为空
- **红绿证据**：红 = 无 --yes 仍替换（静默替换）；绿 = exit 4 拒绝
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖带 --yes 的成功路径（TC-009）

### TC-027（spec 第 3 轮修复同步）draft 遇该名下旧草稿 → DraftNameConflict exit 1

- **覆盖**：`R4 / W7 / L 族（遇该名下旧草稿 / 同秒撞名 → 一律 DraftNameConflict（exit 1），不自动生成——PRD W7「入口不自动认领」）`
- **前置**：该 name 下已有 ≥1 个草稿
- **步骤**：① `node tools/docgen/cli.mjs draft --kind agent --name <name>`
- **预期**：列出该 name 下旧草稿（带时间）；报 `DraftNameConflict`；exit 1；不生成新草稿
- **判据**：退出码 1；输出含 `DraftNameConflict` 与旧草稿文件名；草稿箱文件数不变（无新增时间戳文件）
- **红绿证据**：红 = 自动生成新草稿认领旧稿 / 报其它码；绿 = DraftNameConflict（exit 1）+ 列出旧稿
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖先 `draft rm` 后的成功路径（TC-004）；不覆盖同秒撞名场景（TC-081，同一统一码）

### TC-028 草稿 ≠ 组件渲染 → DraftDrift exit 1

- **覆盖**：`R5 / W7 / §9-3（草稿被手改 = 绕过 D6；字节校验堵死）`
- **前置**：草稿已落；对草稿文件追加一行/改一个字节
- **步骤**：① `replace --kind agent --name <name> --draft <草稿> --yes`
- **预期**：校验草稿字节 === 内存渲染不等 → `DraftDrift`；exit 1；`agents/<name>.md` 不变
- **判据**：退出码 1；输出含 `DraftDrift`；`git status --short agents/` 为空
- **红绿证据**：红 = 手改草稿仍被替换（字节校验缺失）；绿 = DraftDrift 拒绝
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖草稿与渲染一致的场景（TC-009）

### TC-029 --draft 不存在 → DraftNotFound exit 3

- **覆盖**：`§5.2 / W7（--draft 不存在 → DraftNotFound（exit 3））`
- **前置**：指向不存在的草稿路径
- **步骤**：① `replace --kind agent --name <name> --draft <不存在的路径> --yes`
- **预期**：`DraftNotFound`；exit 3；`agents/<name>.md` 不变
- **判据**：退出码 3；输出含 `DraftNotFound`
- **红绿证据**：红 = 文件不存在却静默当空草稿替换；绿 = DraftNotFound
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖草稿存在但非法的路径形态（TC-072 边界）

### TC-030 同一草稿 replace 两次 → 第二次 DraftNotFound

- **覆盖**：`W7（同一草稿 replace 两次 → DraftNotFound（exit 3）且 agents/<name>.md 不变）`
- **前置**：草稿已落；第一次 replace 成功（该 name 下草稿已清）
- **步骤**：① 第一次 `replace --yes`（成功）；② 用同一草稿路径第二次 `replace --yes`
- **预期**：第一次成功；第二次 `DraftNotFound`（exit 3）；`agents/<name>.md` 保持第一次替换结果
- **判据**：第二次退出码 3；输出含 `DraftNotFound`；`git status --short agents/` 为空（无二次写）
- **红绿证据**：红 = 第二次重复替换覆盖；绿 = 二次拒绝
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖第二次替换内容与第一次不同（草稿已不存在，无此分支）

### TC-031 与目标无关 gate 红（未巩固席无草稿手改漂移）→ 拒绝替换草稿保留

- **覆盖**：`R6 / §5.3-3 / W7（判别子：无草稿的手改漂移 → 拒绝替换，草稿保留；P1-F 归属修正：未巩固席被手改且无草稿属 §5.3-3 而非 §5.3-4）`
- **前置**：目标 A 草稿已落；另一未巩固 agent B 的 `agents/B.md` 被手改（gate 红且与 A 无关）
- **步骤**：① `replace --kind agent --name A --draft <草稿> --yes`
- **预期**：gate 前置红 → 拒绝替换；报 `Mismatch`（B 的漂移）；草稿保留（不清、不删）
- **判据**：replace 退出码非 0（1 档 `Mismatch`）；输出含 B 的文件名；`draft ls --name A` 仍有草稿；`agents/A.md` 不变
- **红绿证据**：红 = 忽略无关漂移直接替换；绿 = 拒红 + 草稿保留
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖目标自身差异（TC-017 放行）

### TC-032 与目标无关 gate 红（baseline 类漂移）→ 拒绝替换报 baseline 错误

- **覆盖**：`R6 / W7（baseline 类漂移 → 拒绝替换，报 baseline 类错误）`
- **前置**：目标 A 草稿已落；baseline 文件被手改（BaselineDrift）
- **步骤**：① `replace --kind agent --name A --draft <草稿> --yes`
- **预期**：拒绝替换；报 baseline 类错误码（`BaselineDrift` 等，exit 2）；草稿保留
- **判据**：replace 退出码 2；输出含 baseline 类错误码；`draft ls --name A` 仍有草稿
- **红绿证据**：红 = baseline 漂移被忽略直接替换；绿 = 拒红
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 baseline 校验本身的细节（TC-056）

### TC-033（spec 第 4 轮修复同步）替换目标白名单外 / name 逃逸 → InvalidOutputPath / InvalidName（NF-1 检查序）

- **覆盖**：`R5 / §4 / §5.2（替换白名单只约束 agents/*.md；name→路径校验检查序 = ①格式 ^[a-z][a-z0-9-]{0,49}$（InvalidName exit 1）②assertInside 复判（InvalidOutputPath exit 2），第 4 轮 NF-1——regex 不允许 / \ .，故含 `/`/`..` 逃逸在格式层即被拦，不是 InvalidOutputPath）`
- **前置**：草稿已落
- **步骤**：① `replace --kind agent --name "foo/../bar" --draft <草稿> --yes`（name 含逃逸字符）；② 输出侧越界（generate `--out` 指向 rules/ 外，等价 replace 白名单外）
- **预期**：场景 ① name 含 `/`/`..` 在格式层被拦 → `InvalidName`（exit 1，NF-1）；场景 ② 输出目标不在 `agents/*.md` 白名单 → `InvalidOutputPath`（exit 2）
- **判据**：场景 ① 退出码 1 且输出含 `InvalidName`；场景 ② 退出码 2 且输出含 `InvalidOutputPath`
- **红绿证据**：红 = name 逃逸被当 InvalidOutputPath（exit 2，错误码二义 NF-1 前状态）/ 越界目标被写入；绿 = 检查序稳定（格式层 InvalidName 优先、assertInside 复判兜底 InvalidOutputPath）
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖读取侧白名单（`--draft` 不受限，TC-072）；不覆盖 name 逃逸的完整形态（`/`、`..`、`\` 专项见 TC-101）

### TC-034 replace 无组件数据 → MissingComponentData exit 2

- **覆盖**：`R5 / §5.2（replace 未找到组件数据 → MissingComponentData（新码，exit 2））`
- **前置**：草稿已落；组件中不存在该 name 的对象（或组件数据被删）
- **步骤**：① `replace --kind agent --name <不存在> --draft <草稿> --yes`
- **预期**：`MissingComponentData`；exit 2
- **判据**：退出码 2；输出含 `MissingComponentData`
- **红绿证据**：红 = 无组件数据仍按草稿内容写入；绿 = 拒绝
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖组件数据存在但渲染失败（归 §6 错误族）

### TC-035 草稿目录不可写 → DraftWriteFailed exit 3

- **覆盖**：`§5.2（草稿目录不可写 → DraftWriteFailed（exit 3））`
- **前置**：草稿箱目录权限设为只读（或指向不可写路径）
- **步骤**：① `node tools/docgen/cli.mjs draft --kind agent --name <name>`
- **预期**：`DraftWriteFailed`；exit 3；`agents/*.md` 零改动
- **判据**：退出码 3；输出含 `DraftWriteFailed`；`git status --short agents/` 为空
- **红绿证据**：红 = 写失败被当成功（exit 0）；绿 = DraftWriteFailed
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖目录不存在的场景（ensure 幂等建目录，TC-008）

### TC-036 清单外新增规则文件 → UnregisteredHandwritten

- **覆盖**：`R10 / W5 / R14-V4（清单外新增任一类文件 → UnregisteredHandwritten；哨兵自愈沿用）`
- **前置**：`rules/tmp-new-rule-V4.md` 不存在
- **步骤**：① 创建 `rules/tmp-new-rule-V4.md`；② `node tools/docgen/cli.mjs gate`；③ 清理
- **预期**：gate 报 `UnregisteredHandwritten`；exit 2；输出含可操作指引（把路径并入清单 + 重跑 --write）
- **判据**：退出码 2；输出含 `UnregisteredHandwritten` 与受控变更指引
- **红绿证据**：红 = 清单外文件不报（baseline 扫描缺失）；绿 = 报 UnregisteredHandwritten
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖新增 agent 文件的等价场景（W5 受控旅程 TC-013 的正路径 + 本用例的 rule 负路径）

### TC-037 篡改任一已生成 agent 一个字节 → Mismatch

- **覆盖**：`R10 / W5（篡改任一已生成 agent → Mismatch；D6 逐字节守）`
- **前置**：任一已巩固 agent（如 reviewer-audit）基线正常
- **步骤**：① 对 `agents/reviewer-audit.md` 改 1 个可打印 ASCII 字节；② `node tools/docgen/cli.mjs gate`；③ 还原
- **预期**：gate 报 `Mismatch` 含 line/byte；exit 1
- **判据**：退出码 1；输出含 `Mismatch` 与 `line`/`byte`
- **红绿证据**：红 = 手改后 gate 仍绿（重建比对未含 agent）；绿 = Mismatch
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 CRLF 类环境差异（TC-057）

### TC-038 generate 副作用检查：不写盘、不落草稿

- **覆盖**：`R3 / §9-1（generate 不写盘、不落草稿，纯检查语义）`
- **前置**：干净树；草稿箱记录当前内容
- **步骤**：① `node tools/docgen/cli.mjs generate`；② 全仓 git status；③ 草稿箱内容
- **预期**：无任何文件写入；草稿箱零变化
- **判据**：退出码 0；`git status --short rules/ agents/ skills/ tools/` 为空；草稿箱文件集与运行前一致
- **红绿证据**：红 = generate 写盘/落草稿（副作用）；绿 = 纯内存
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 generate 的输出文本内容（TC-001/002/003）

### TC-039（spec 第 3 轮修复同步）name 重复 / name 非法 → DuplicateAgentName / InvalidName exit 1

- **覆盖**：`§6-1 / X 族（name 合法（^[a-z][a-z0-9-]{0,49}$）+ 唯一，跨全部 agent 对象——承接 gen-agents.test.mjs 断言 1 的 regex，不只留「唯一」）`
- **前置**：agentData 注入两个同名对象（测试数据）
- **步骤**：① 运行 `validateAgentData()` 单测（注入重复 name）；② 注入非法 name（大写/下划线/空/超长）再跑
- **预期**：重复 name → 返回 `DuplicateAgentName`；非法 name → 返回 `InvalidName`；CLI 层均 exit 1
- **判据**：单测断言错误码（重复 → `DuplicateAgentName`；非法 → `InvalidName`）；CLI 场景退出码 1
- **红绿证据**：红 = 重复 name 或非法 name 不报；绿 = 对应错误码
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖非法 regex 的精确边界清单（专项见 TC-095）；不覆盖 CLI 层 name→路径校验（§5.2 NF-1：格式层 InvalidName（exit 1）优先、assertInside 复判 InvalidOutputPath（exit 2），专项见 TC-101）

### TC-040 模板占位符未消费/未闭合 → TemplateSyntaxError exit 1

- **覆盖**：`§6-2（agent.md.tpl / agent-handwritten.md.tpl 无未闭合占位符）`
- **前置**：模板注入未闭合 `{{` / 未知 key
- **步骤**：① 运行 validateAgentData 或渲染路径（注入坏模板）
- **预期**：返回 `TemplateSyntaxError`（含 line）；CLI 层 exit 1
- **判据**：单测断言错误码与 line；CLI 场景退出码 1
- **红绿证据**：红 = 未闭合占位符静默通过（模板残留 `{{`）；绿 = TemplateSyntaxError
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖模板结构完整性的人工抽查（§5）

### TC-041（spec 第 4 轮修复同步）agentData 字段缺失（name/tools）→ FrontmatterFieldMissing exit 1

- **覆盖**：`§6-3 / J 族 / F1（agentData 字段完整性：name / tools 必填非空——断言对象 = 纯数据；when 存在性由断言 14/MissingWhen 独占（第 4 轮 F1 裁决：同一触发条件不得两码，断言 3 不查 when）；渲染输出 frontmatter 完整性（name/description/tools）由断言 6 逐字节兜底，数据层不查不存在的 description 字段）`
- **前置**：agentData 注入缺 name / 缺 tools 的对象（测试数据）
- **步骤**：① 运行 validateAgentData（注入缺字段数据：缺 name、缺 tools 两态）
- **预期**：两态均返回 `FrontmatterFieldMissing`；CLI 层 exit 1
- **判据**：单测断言错误码 = `FrontmatterFieldMissing`；CLI 场景退出码 1
- **红绿证据**：红 = 缺字段仍渲染通过 / when 缺失被误判 FrontmatterFieldMissing（F1 前两码冲突态）；绿 = FrontmatterFieldMissing（仅 name/tools）
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖输出层 frontmatter 三字段（name/description/tools）——由断言 6 逐字节兜底（TC-044/037）；不覆盖正文块/格缺失（那归 `MissingSlot`，P1 已有，V3 覆盖）；不覆盖 when 缺失（断言 14/MissingWhen 独占，TC-084）

### TC-042 tools 违规（13 席带写权限）→ ToolsViolation exit 1

- **覆盖**：`§6-4（tools 只读：13 席 = 只读三元组 Read, Glob, Grep；senior-sdet = 追加 Write/Edit）`
- **前置**：agentData 注入 13 席之一带 `Write`/`Edit` 的对象
- **步骤**：① 运行 validateAgentData（注入违规 tools）
- **预期**：返回 `ToolsViolation`；CLI 层 exit 1
- **判据**：单测断言错误码；CLI 场景退出码 1
- **红绿证据**：红 = 13 席带写权限不报；绿 = ToolsViolation
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 senior-sdet 允许 Write/Edit 的正例（TC-014 全通过隐含）

### TC-043（spec 第 4 轮修复同步）sharedBlock 引用缺失 / 同引用枚举值分叉 → SharedBlockMissing exit 1

- **覆盖**：`§6-5 / X 族 / N1（特质段一致：sharedBlock 引用存在于 patternRegistry 枚举 + 引用同一枚举的席值一致 + 无 sharedBlock 席不渲染该节——真实 ROLES 仅 4/13 席有 sharedBlock，三值 AUDIT_RULES/SIX_METHODS/DETECTIVE_RULES，第 4 轮 N1 修正「13 席同值」为「同引用枚举同值」）`
- **前置**：agentData 注入 sharedBlock 指向不存在的枚举；或注入引用同一枚举但值分叉的席数据
- **步骤**：① 运行 validateAgentData（注入悬空 sharedBlock）；② 注入引用同一枚举但值分叉的席数据再跑
- **预期**：悬空引用 → 返回 `SharedBlockMissing`；引用同一枚举但值分叉 → 同样返回 `SharedBlockMissing`；CLI 层均 exit 1
- **判据**：单测断言错误码；CLI 场景退出码 1
- **红绿证据**：红 = 悬空 sharedBlock 静默渲染出空段 / 同引用枚举值分叉不报；绿 = SharedBlockMissing
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖同引用枚举同值 + 无 sharedBlock 席不渲染的正例（TC-096）

### TC-044 零漂移破坏（渲染 ≠ target）→ Mismatch exit 1

- **覆盖**：`§6-6（零漂移：渲染结果 == 已生成 target；由 gate/check-agents 承接）`
- **前置**：任一已巩固 agent 基线正常
- **步骤**：① 手改 `agents/<name>.md` 一个字节；② `gate` / `check-agents`
- **预期**：报 `Mismatch`（含文件名）；exit 1
- **判据**：`check-agents` 退出码 1；消息含 `<name>.md`；`gate` 同断言
- **红绿证据**：红 = 漂移不报；绿 = Mismatch 含文件名
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 check-agents 与 gate 的消息格式差异（两者均须含文件名）

### TC-045（spec 第 3 轮修复同步）when 含禁字样 / 尾「时」→ WhenFormatViolation exit 1

- **覆盖**：`§6-7 / §4.1 / A 族（when 槽位格式约束：不得含「在…中担任 / 时调用」字样、不得以「时」结尾——防把整句 description 当 when 提取 + 防拼装出「时时调用」）`
- **前置**：agentData 注入 when 含禁字样 / 以「时」结尾（测试数据）
- **步骤**：① 注入含「在…中担任」的 when；② 注入含「时调用」的 when；③ 注入以「时」结尾的 when；④ 逐次运行 validateAgentData
- **预期**：三类违规 when 均返回 `WhenFormatViolation`；CLI 层 exit 1
- **判据**：单测断言错误码；CLI 场景退出码 1
- **红绿证据**：红 = 整句 description 被当 when 提取 / 尾「时」不报（派生拼装出「时时调用」、黄金断言必红）；绿 = WhenFormatViolation
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 when 前导连接词合法的边界（TC-064）；尾「时」的独立专项见 TC-087；派生输出「时时」的独立断言见 TC-088

### TC-046（spec 第 3 轮修复同步；第 5 轮补 W4 registered 豁免）派生 description ≠ 句式拼装 / 含「时时」→ DescriptionDerivation exit 1

- **覆盖**：`§6-8 / R13 / §8.1 / A 族（渲染 description == 句式拼装输出 + 不得含「时时」连续字，对已拆槽席生效；防组件硬编码 description 绕过派生 + 防新增席静默出货）；W4 派生断言 registered 豁免（§4.2 Q-3-NEW-1：与断言 14 同口径，S1 阶段仅对已拆槽席生效，registered 未拆槽席豁免）`
- **前置**：agentData 注入独立 description 字段（违反 §4.1 数据形状）或 when 与句式不符；或 when 尾含「时」导致派生 description 含「时时」；注入对象为**已拆槽席**（registered 未拆槽席豁免，不触发本断言）
- **步骤**：① 运行派生断言 / gate 的 W4 断言（注入违规数据）
- **预期**：返回 `DescriptionDerivation`；CLI 层 exit 1（该席为已拆槽席；registered 未拆槽席 when 未拆槽不触发）
- **判据**：单测断言错误码；gate 场景退出码 1 且输出含该席名称
- **红绿证据**：红 = 组件存 description 字段且 gate 不查（F-02 教训复现路径）/ 派生含「时时」仍绿（新增席静默出货）/ registered 未拆槽席被误判（豁免失效）；绿 = DescriptionDerivation（对已拆槽席）
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖派生正确路径（TC-015/016）；「时时」机械断言的独立注入见 TC-088；registered 未拆槽席的 W4 豁免专项见 TC-102

### TC-047（spec 第 5 轮修复同步）route 悬空 / 重复：悬空 → TriggerMissingRoute、重复 → TriggerConflict exit 1

- **覆盖**：`§6-9 / P2-8-触发表断言 b（route 唯一且存在：route ∈ agentData 键集；同一触发表条目 route 键不得重复——悬空 route 与重复 route 是两失败面，删除对象报 TriggerMissingRoute、双席抢 route 报 TriggerConflict，CI 可区分，N4 残留裁决）`
- **前置**：triggerTable 注入 route 指向不存在的对象（悬空态）；再构造同一触发表条目内 route 键重复（重复态）
- **步骤**：① 运行 validateAgentData（注入悬空 route）；② 运行 validateAgentData（注入同条目重复 route）
- **预期**：悬空 → `TriggerMissingRoute`；重复 → `TriggerConflict`；两态均 CLI 层 exit 1
- **判据**：单测断言错误码（悬空 `TriggerMissingRoute` / 重复 `TriggerConflict`，两码区分）；CLI 场景退出码 1
- **红绿证据**：红 = 悬空与重复同码（CI 无法区分「删对象」与「双席抢 route」）/ 重复 route 静默通过；绿 = 两失败面两码
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 notWhen.refs 越界（TC-048，同报 `TriggerConflict` 但数据面不同）；不覆盖 fallback 声明非法（TC-049，报 `TriggerMissingRoute` 仅声明且非法时）

### TC-048 notWhen.refs 越界 → TriggerConflict exit 1

- **覆盖**：`§6-12 / P2-8-触发表断言 d（notWhen 结构化 { text, refs: [route] }，refs ⊆ agentData 键集）`
- **前置**：agentData 注入 notWhen.refs 含不存在的 route
- **步骤**：① 运行 validateAgentData（注入越界 refs）
- **预期**：返回 `TriggerConflict`；CLI 层 exit 1
- **判据**：单测断言错误码；CLI 场景退出码 1
- **红绿证据**：红 = refs 越界不报；绿 = TriggerConflict
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 notWhen 缺省为合法值的边界（§4.1，TC-014 全通过隐含）

### TC-049（spec 第 3 轮修复同步）fallback 声明非法（值非 true / route 越界）→ TriggerMissingRoute exit 1

- **覆盖**：`§6-13 / P2-8-触发表断言 e / B 族（fallback 为可选布尔声明位：未声明 = 合法（vacuous）；若声明则值必须为 true 且 route ∈ agentData 键集）`
- **前置**：agentData 注入声明 fallback 但值为 false / 值非布尔；或声明 fallback 但 route 不在键集
- **步骤**：① 运行 validateAgentData（注入违规 fallback）
- **预期**：声明非法 → 返回 `TriggerMissingRoute`；CLI 层 exit 1；未声明 / 声明 true 合法（不触发，见 TC-086）
- **判据**：单测断言错误码；CLI 场景退出码 1
- **红绿证据**：红 = fallback=false 或 route 越界仍通过；绿 = TriggerMissingRoute（仅在声明且非法时触发）
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖未声明 fallback 的合法路径（TC-086）；不覆盖「未命中 any when 时真实路由」——PRD P2-8 明确 P2 不断言（未来调度职责）

### TC-050 V2 差异比对：目标副本改 1 字节 → Mismatch line/byte

- **覆盖**：`R14-V2（generate --kind rule --name <目标> + .tmp-test/ 副本改字节 → Mismatch line/byte）`
- **前置**：`.tmp-test/` 下规则目标副本已生成
- **步骤**：① 对副本固定位置改 1 个 ASCII 字节；② 对该副本跑比对
- **预期**：`Mismatch` 且 `line`/`byte` 非空；target 本体 hash 不变
- **判据**：命令退出码 1；输出含 `Mismatch` + `line` + `byte`；`git status --short rules/` 为空
- **红绿证据**：红 = 改字节不报（迁移前 spike 已知问题复现路径）；绿 = Mismatch 定位
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 CRLF 变体（TC-051）

### TC-051 V2b CRLF 不归一：中部 \n→\r\n → Mismatch

- **覆盖**：`R14-V2b（CRLF 不做 EOL 归一；换行差异必须报 Mismatch）`
- **前置**：`.tmp-test/` 下副本已生成
- **步骤**：① 把副本中部一个 `\n` 换成 `\r\n`；② 比对
- **预期**：`Mismatch`（EOL 差异被检出，不归一）
- **判据**：命令退出码 1；输出含 `Mismatch`
- **红绿证据**：红 = CRLF 被 EOL 归一掩盖（假绿）；绿 = Mismatch
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖输入角色文件的环境预检（TC-057，V2b 的副本角色不预检）

### TC-052 V3 缺格：判据 pass 置 ''/' '/TODO → MissingSlot 指向该格

- **覆盖**：`R14-V3（validateData 迁移；MissingSlot 指向该格；无输出文件）`
- **前置**：默认组件数据；按内容定位第 3 条判据的 pass
- **步骤**：① 依次把 pass 置 `''` / `'   '` / `'TODO'`；② 运行 validateData
- **预期**：`MissingSlot` 且 `slot` 指向该格；无输出文件
- **判据**：命令退出码 1；输出含 `MissingSlot` 与 `criteria.<name>.pass`（或 index 形态）
- **红绿证据**：红 = 空格/TODO 不报；绿 = MissingSlot 定位到格
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 agent 侧缺格（senior-sdet 转录字段缺格的错误族由 §6 断言覆盖）

### TC-053 V5 非法类型 → InvalidRuleType

- **覆盖**：`R14-V5（validateData：polarity 不在二值 / applicability 不在三值 → InvalidRuleType + field/value）`
- **前置**：默认规则数据
- **步骤**：① 两次 fixture：`polarity:'ban'`、`applicability:'sometimes'`；② 运行 validateData
- **预期**：`InvalidRuleType` 且 `field`/`value` 非空
- **判据**：命令退出码 1；输出含 `InvalidRuleType` + `field` + `value`
- **红绿证据**：红 = 非法枚举不报；绿 = InvalidRuleType
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 agent 侧枚举（outputKind/sharedBlock 枚举由 §6-5 断言覆盖）

### TC-054 V6① 读 target 的 render 替身 → ImpureRender

- **覆盖**：`R14-V6①（fs 读取探针迁移：render 读 target → ImpureRender；防「直接返回 target 内容」作弊实现）`
- **前置**：`.tmp-test/` 下写读 target 的 impureStub 替身
- **步骤**：① 在读取探针下调用替身 render
- **预期**：`ImpureRender` 且 `path` 指向被读文件
- **判据**：命令退出码 1；输出含 `ImpureRender`
- **红绿证据**：红 = 探针缺失时作弊实现通过 V1；绿 = ImpureRender
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖静态约束（组件文件不得 import fs / child_process，P1 R13；并入实现时由静态断言覆盖）

### TC-055 V6② 模板贴全文（3 段签名）→ TemplateHardcoded

- **覆盖**：`R14-V6②（assertTemplateClean + fs 探针迁移；模板含任一 ≥20 字签名 → TemplateHardcoded）`
- **前置**：3 段 ≥20 字 target 原文特征串常量
- **步骤**：① 把签名串注入模板；② 运行模板清洁检查
- **预期**：`TemplateHardcoded` 且 `snippet` 为命中的签名
- **判据**：命令退出码 1；输出含 `TemplateHardcoded` 与 `snippet`
- **红绿证据**：红 = 模板贴全文仍过（V1 字节相等假绿）；绿 = TemplateHardcoded
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖模板「只含结构」的完整性证明（机器只查签名，人工抽查见 §5）

### TC-056 V7 坏 baseline 五类 → 对应错误码

- **覆盖**：`R14-V7（gate baseline 校验（R9 顺序沿用）：InvalidBaseline* / DanglingBaselineEntry / BaselineDrift）`
- **前置**：复制 baseline 到 `.tmp-test/`；按类构造坏 baseline
- **步骤**：① 分别构造：删一条 / 加重复 / 加不存在路径 / 置空 / 含 `..` 或 `\`；② 逐个跑 gate
- **预期**：依次 `BaselineDrift` / `InvalidBaseline`（重复）/ `DanglingBaselineEntry` / `InvalidBaseline`（空）/ `InvalidBaselinePath`；只报第一个（R9 顺序）
- **判据**：每个场景命令退出码 2；输出含对应错误码
- **红绿证据**：红 = 错误优先级顺序不定（同份坏 baseline 期望随实现红绿不定）；绿 = R9 顺序稳定
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 agent 清单侧的 baseline 校验差异（与 rule 侧共用同一校验器，语义相同）

### TC-057 V8 环境：BOM / CR / INVALID_UTF8 顺序

- **覆盖**：`R14-V8（checkEnvironment 迁移：BOM / CR / INVALID_UTF8 顺序；只对输入角色检查）`
- **前置**：复制模板与 target 到 `.tmp-test/`；分别构造三类坏文件
- **步骤**：① 模板改 CRLF；② target 加 `\r`；③ target 加 BOM；④ 逐个跑 gate
- **预期**：依次 `EnvironmentEOL` + `violation`（CR / CR / BOM 语义按 P1 顺序：BOM → CR → INVALID_UTF8）；本体 hash 不变
- **判据**：命令退出码 2；输出含 `EnvironmentEOL` 与 `violation`；`git status --short` 为空
- **红绿证据**：红 = CRLF 被误诊成渲染差异（输入角色未预检）；绿 = EnvironmentEOL 分诊
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 `.tmp-test/` 下比对对象副本的环境预检豁免（P1 R8 分界，迁移语义保留）

### TC-058（spec 第 5 轮修复同步）V10 check-all 拦新增规则（入口强制；注入机制 = gate 只读仓库真文件）

- **覆盖**：`R14-V10 / NF-4（gate（check-all 调用）新增规则被拦；只由 cli/check-all 编排，不在 node --test 内调用；--no-clean 不承接——docgen generate 不写盘、无启动清理语义；gate 无独立注入参数（Q3-F2）：gate 只读仓库内真文件（rules/*.md + agents/*.md + tools/docgen/baseline.json），V10 新增规则故障注入 = 在仓库内创建真实 rules/ 文件，由 gate 读真文件拦截，不依赖 gate 参数）`
- **前置**：`rules/tmp-new-rule-V10.md` 不存在
- **步骤**：① 创建该文件（V10 注入机制：gate 无注入参数，新增规则直接落仓库真路径，gate 读真文件即拦截）；② `node scripts/check-all.mjs`；③ 删除
- **预期**：check 退出非 0；输出含 `UnregisteredHandwritten`；只断言最终退出码与关键输出
- **判据**：`check-all.mjs` 退出码非 0；stdout 含 `UnregisteredHandwritten`
- **红绿证据**：红 = 新增规则 check 仍绿（入口基线缺失）/ gate 实现依赖注入参数（违反 Q3-F2 无注入参数裁决）；绿 = 拦截
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖子进程链路细节（V10 只认最终退出码与关键输出，P1 口径）；不覆盖 gate 的差异 target 注入（V10b，TC-059 由 generate --target <副本> 承接）

### TC-059（spec 第 5 轮修复同步）V10b 差异 target → Mismatch；干净树 exit 0（注入 = generate --target <副本>）

- **覆盖**：`R14-V10b / NF-4（差异 target 报 Mismatch；干净树跑 gate exit 0；--no-clean 不承接；gate 无独立注入参数（Q3-F2）——差异 target 的故障注入由 generate --kind rule --name <目标> --target <副本> 承接（与 V2 行同机制），不依赖 gate 参数）`
- **前置**：干净树；`.tmp-test/` 下目标副本改 1 个可打印 ASCII 字节（经 `generate --kind rule --name <目标> --target <副本>` 注入差异）
- **步骤**：① 经 `generate --kind rule --name <目标> --target <副本>` 注入差异副本（对副本改字节 → Mismatch）；② 干净树跑 gate
- **预期**：前者 `Mismatch`（exit 1）；后者 exit 0
- **判据**：场景 ① 退出码 1 且含 `Mismatch`；场景 ② 退出码 0；注入路径走 `--target <副本>`（不依赖 gate 参数，Q3-F2）
- **红绿证据**：红 = 差异 target gate 仍绿 / gate 被实现成接受注入参数（违反 Q3-F2 无注入参数裁决）；绿 = Mismatch / exit 0 分诊
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 check-all 嵌套场景的 env 透传（P1 实现细节，迁移语义保留）；不覆盖 V10 新增规则注入（TC-058 走仓库真路径）

### TC-060 V11 六故障注入 → 对应错误码

- **覆盖**：`R14-V11（cli.mjs 参数校验：占位符 / 越界 / 缺失错误码）`
- **前置**：`.tmp-test/` 可用
- **步骤**：① 六个故障注入：未知占位符 / 未闭合 `{{` / `--compare` 缺生成物 / `--out` 越界指向 rules/ / 模板不存在 / `--out` 指向目录
- **预期**：依次 `MissingPlaceholder` / `TemplateSyntaxError` / `GeneratedMissing` / `InvalidOutputPath` / `TemplateReadFailed` / `WriteFailed`，必带字段非空
- **判据**：每场景命令退出码与错误码匹配（1/1/3/2/3/3），输出含对应码与字段
- **红绿证据**：红 = 任一注入静默通过或错误码档位错；绿 = 全对
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 agent 侧 CLI 参数校验（draft/replace 参数族由 TC-026~035 覆盖）

### TC-061（spec 第 5 轮修复同步）退出码五档全码表归属抽查（0/1/2/3/4，21+10+6+1=38）

- **覆盖**：`R9 / §7 / P2-遗-6（五档完整映射：0 全绿 / 1 数据校验 / 2 配置·baseline·环境 / 3 IO·依赖 / 4 未授权）；exit 2 档含 UnsupportedKind（第 5 轮补，9→10 码）`
- **前置**：§7 码表已实现；每档取代表码构造触发场景
- **步骤**：① exit 0：全绿 gate；② exit 1：`DraftDrift`；③ exit 2：`UnregisteredHandwritten`；④ exit 3：`DraftNotFound`；⑤ exit 4：replace 缺 `--yes`
- **预期**：五档各自映射正确；§7 表内每个错误码归属档位与实现一致（参数化扫描全码表）
- **判据**：五个场景退出码分别 0/1/2/3/4；全码表参数化断言（§7 表 **21+10+6+1 = 38** 个码逐一归属，P1-C：exit 1 档 21 码（含第 2 轮 `DuplicateWhen` / `InvalidOutputKind` + 第 3 轮 `InvalidName` / `MissingWhen`）、exit 2 档 10 码（含第 5 轮补 `UnsupportedKind`，9→10）、exit 3 档 6 码、exit 4 档 1 码）
- **红绿证据**：红 = 任一码档位错（如 DraftDrift 归 3）/ UnsupportedKind 未入 exit 2 档（NF-3 的码无档位归属）；绿 = 全对；红（历史）= P1 三档无 exit 4
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖新错误码未落映射表即使用的情形（§9-8 硬约束，由评审核对）

### TC-062（spec 第 3 轮修复同步）agentData 不存 description 与触发表字段（K 族单一真相）

- **覆盖**：`§4.1 / R13 / §9-7 / K 族（description 是派生字段，agentData 不存独立 description 字段；触发表字段 when/route/notWhen/fallback 只住 triggerTable，agentData 条目不含——单一真相）`
- **前置**：组件数据源（agentData + triggerTable）
- **步骤**：① 对 agentData 数据结构做字段白名单断言；② 核对 triggerTable 字段宿主
- **预期**：任何 agent 条目无 `description` / `when` / `route` / `notWhen` / `fallback` 键；触发表四字段仅存在于 triggerTable；description 仅由渲染派生
- **判据**：单测断言 `Object.keys(agentData[name])` 与 {description, when, route, notWhen, fallback} 交集为空；triggerTable 含 when/route/notWhen/fallback 槽；全 14 席遍历通过
- **红绿证据**：红 = 组件出现 description 字段（硬编码绕过派生）或触发表字段混入 agentData（双源漂移）；绿 = 单一真相
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖派生输出正确性（TC-015/016/046）

### TC-063 派生拼装引入新词 → 拒

- **覆盖**：`§4.2（拼装禁引入新词；domain/role/when 均为设计期常量或逐字提取）`
- **前置**：构造 when 含句式外新词（测试数据）
- **步骤**：① 运行派生断言
- **预期**：派生结果与「逐字提取 + 常量拼装」不符 → 被拒（`DescriptionDerivation` 或拼装校验失败）
- **判据**：命令退出码 1；输出含 `DescriptionDerivation`
- **红绿证据**：红 = 拼装随意加词仍绿；绿 = 拒
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖词表（禁成语/模糊词）断言（TC-071）

### TC-064 when 前导连接词边界（13 席须含「当/每轮」）

- **覆盖**：`§4.1 / §6-7（when 逐字提取含前导连接词「当 / 每轮」）`
- **前置**：13 席触发表数据
- **步骤**：① 断言 13 席 when 均以「当」或「每轮」开头；② 构造无连接词 when 跑校验
- **预期**：13 席合法；无连接词的 when 不被 §6-7 禁字样误伤但缺失连接词时应由派生断言检出（输出与现 description 不符）
- **判据**：单测断言连接词正则（`^当|^每轮`）13 席全命中；无连接词场景 exit 1
- **红绿证据**：红 = 提取丢连接词仍逐字相等（提取错误）；绿 = 连接词在位/缺失被检出
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 senior-sdet 专属句式的 when（转录性质，W2/S3）

### TC-065（spec 第 3 轮修复同步）草稿命名 <name>--<YYYYMMDD-HHMMSS>.md 精确匹配 + 每 name 至多一份

- **覆盖**：`R2 / §5.4 / G 族（命名 <name>--<YYYYMMDD-HHMMSS>.md；每 name 至多一份草稿——不存在「同 name 多版本并存」状态）`
- **前置**：一次 draft 已产生草稿
- **步骤**：① 列出草稿文件名；② 正则匹配
- **预期**：文件名严格匹配 `^<name>--\d{8}-\d{6}\.md$`；同 name 仅一份草稿
- **判据**：正则全命中；同 name 下草稿文件数 ≤1（G 族每 name 至多一份）；不同 name 产生不同文件名
- **红绿证据**：红 = 命名不含时间戳 / 同 name 出现第二份草稿（多版本并存）；绿 = 精确匹配 + 至多一份
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖同秒撞名（TC-081）；不覆盖「先 rm 后再生成」的再生成路径（TC-004）

### TC-066（spec 第 4 轮修复同步）draft --kind rule（非 agent kind）→ UnsupportedKind exit 2

- **覆盖**：`R1 / §5.1 / NF-3（draft 只支持 --kind agent；非 agent kind → UnsupportedKind（exit 2），第 4 轮 NF-3 明确错误码）`
- **前置**：cli 就位
- **步骤**：① `node tools/docgen/cli.mjs draft --kind rule --name spec-testcase-gate`
- **预期**：拒绝并报 `UnsupportedKind`；exit 2；不产生任何草稿
- **判据**：退出码 2；输出含 `UnsupportedKind`；草稿箱无新增文件
- **红绿证据**：红 = 静默接受非法 kind / 报非 2 档错误码；绿 = UnsupportedKind（exit 2）
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 generate --kind rule（合法，TC-001）；不覆盖 replace 侧非 agent kind（TC-100）

### TC-067 registered 态：存在性检查 + 标注未巩固 + 容忍红

- **覆盖**：`R11 / §8.6（registered 态跳过逐字节、做存在性检查 + 标注未巩固 + 容忍红）`
- **前置**：存在 registered 态对象（未入队席，组件有数据、agents/*.md 在）
- **步骤**：① `node tools/docgen/cli.mjs check-agents`；② 手改该 registered 对象的 agents/<name>.md 一字节；③ 再跑 check-agents
- **预期**：步骤 ① 对该对象标注「未巩固」但 exit 0（容忍红）；步骤 ② 后仍 exit 0（跳过逐字节比对）但存在性检查通过
- **判据**：两跑均退出码 0；stdout 含「未巩固」标注；对象文件存在性检查通过
- **红绿证据**：红 = registered 对象被逐字节比对（exit 1 误报）；绿 = 容忍红
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 registered 对象文件缺失（TC-077，盲点驱动）

### TC-068 未入队 registered 席不计入带未迁 ≤3 上限

- **覆盖**：`P2-遗-1 / §8.6（未入队 registered 席不计入「带未迁 ≤3」上限）`
- **前置**：迁移状态账本（PRD §6.6）存在；存在 registered 席与停损未迁席
- **步骤**：① 统计「停损未迁」席数；② 核对 registered 席是否计入
- **预期**：带未迁计数仅含「停损未迁」（≤3），未入队 registered 席不占名额；账本状态口径可区分
- **判据**：账本断言（集成测试）：registered 席不计入 ≤3 判断；计数 = 停损未迁数
- **红绿证据**：红 = registered 席被计入上限导致误判收口条件；绿 = 不计入
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖收口条件的业务裁决（§8 例外收口，议会/用户）

### TC-069 存在 registered 态对象时 check-agents 别名保留

- **覆盖**：`P2-遗-3 / R11 / W8（别名保留颗粒度统一：存在任何 registered 态对象时保留，W8 不摘）`
- **前置**：存在 ≥1 个 registered 态对象
- **步骤**：① W8 完成（gen-agents.mjs 已删）后，② `node tools/docgen/cli.mjs check-agents`
- **预期**：check-agents 命令仍可调用（别名保留）；无 registered 态对象时该命令才允许摘除（终态）
- **判据**：存在 registered 态时命令退出码 0 且可执行；终态（无 registered）时命令摘除与否由实现按 R11 处置，测试断言「存在 registered → 命令在」成立
- **红绿证据**：红 = 存在 registered 态仍摘别名（未迁对象失去守卫载体）；绿 = 保留
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖别名摘除的精确时机（终态验收后，由迁移收口处置）

### TC-070 未入队席数据 W8 前迁入 docgen 置 registered 态

- **覆盖**：`P2-遗-2 / §8.6（W8 删 gen-agents.mjs 前，未入队席 ROLES 数据迁入 docgen 组件并置 registered 态，数据源不随退役丢失）`
- **前置**：队列中仍有未入队席
- **步骤**：① W8 删除 gen-agents.mjs 前检查组件数据；② 删除后检查
- **预期**：删除前未入队席数据已在 docgen 组件（registered 态）；删除后数据不丢失；该席无停损记录、豁免复盘指针登记要求
- **判据**：组件数据含未入队席（agentData 键集覆盖）；`gen-agents.mjs` 删除后 `generate` 仍能渲染该席（registered）；账本该席无停损轮次字段
- **红绿证据**：红 = 删除后未入队席数据丢失（组件缺该席）；绿 = 数据在 registered 态保全
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 P3 开工时 registered → 比对子集的转轨（§8(c)，P3 验收）

### TC-071（spec 第 3 轮修复同步；第 5 轮补词表衔接）词表裁决：P2 内无消费对象，推迟至加席流程

- **覆盖**：`R13 / §8.1 / §8.2 / P2-8 / Q 族 + N3 残留裁决（词表裁决：P2 内 13 席 + senior-sdet 的 description 全被句式机械锁定（13 席固定句式拼装、senior-sdet 逐字复现），W5 新增 dc-translator 席 description 同样豁免词表（与 13 席/senior-sdet 一致，句式机械锁定）——词表无消费对象，落地推迟至加席流程（dc-translate skill 的 fuzzy-word-scan.mjs）；**词表第一次生效时点 = dc-translate skill 落地后的加席流程**（届时 description 由 AI 翻译而非句式拼装，词表才有消费对象），W4/W5 均不设词表断言）`
- **前置**：W4 派生断言已实现（句式拼装 + 「时时」机械断言）
- **步骤**：① 跑 gate（W4 断言）；② 核对 gate 输出是否含词表相关错误码；③ 核对词表机制（fuzzy-word-scan）在 P2 内是否有消费点
- **预期**：P2 内 gate 无词表断言（无 fuzzy-word 相关错误码被触发）；词表机制不在 P2 内生效；原「词表约束 13 席派生」口径不再适用（13 席句式锁定 + senior-sdet 逐字豁免 + W5 新增席同样豁免，词表首次生效时点 = dc-translate 落地后）
- **判据**：gate 退出码 0（派生断言全过，无词表项）；源码 Grep 词表消费点指向 dc-translate（加席流程）而非 gate/任何 W4/W5 路径；TC-071 判据随 Q 族裁决 + N3 残留裁决更新为「无词表断言」
- **红绿证据**：红 = P2 内实现词表断言（13 席 identity 转录常量「经验直觉」被误拦 → 假阳性）/ W5 新增席 description 被词表误拦（把「加席流程 = W5」误判成词表生效点）；绿 = 词表推迟，无消费对象
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖词表条目内容本身（加席流程 dc-translate 阶段实现）；不覆盖词表第一次生效点（dc-translate 落地后，届时 description 由 AI 翻译而非句式拼装，词表才有消费对象）；不覆盖 W5 旅程本身（TC-013）

### TC-072 --draft 读取不受 ROOT 白名单约束

- **覆盖**：`R5（--draft 读取路径不受 ROOT 白名单约束（草稿箱在 homedir，不属于 ROOT））`
- **前置**：草稿在 homedir 草稿箱内；替换目标仍在 agents/ 白名单内
- **步骤**：① 用 homedir 草稿箱内绝对路径作 --draft 执行 replace --yes
- **预期**：读取侧不报 `InvalidInputPath`（homedir 路径合法）；写入侧仍限 agents/*.md
- **判据**：replace 退出码 0（草稿字节校验通过场景）；或对越界写入目标报 `InvalidOutputPath`（exit 2）但读取侧不报
- **红绿证据**：红 = homedir 草稿被 ROOT 白名单误拦（InvalidInputPath）；绿 = 读取放行写入受限
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖草稿箱路径本身在 homedir 的确认（TC-025）

### TC-073 replace 原子性：写入失败/中断不产生半写文件

- **覆盖**：`R5（写入 = 临时文件 + rename 原子替换；防中断写坏（PRD F-06））`
- **前置**：草稿已落；构造写入失败场景（目标目录权限、磁盘满模拟或故障注入点）
- **步骤**：① 触发写入中途失败；② 检查 agents/<name>.md
- **预期**：目标文件保持原字节（无半写、无截断）；错误码 `WriteFailed`（exit 3）；草稿保留
- **判据**：`agents/<name>.md` 字节 === 替换前字节；命令退出码 3；`draft ls --name` 草稿仍在
- **红绿证据**：红 = 中断后目标文件半写（旧内容被截断）；绿 = 原子性保持
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 SIGKILL 级中断（原子 rename 本身保证，注入点不可达时登记 §7）

### TC-074（作废）同秒两次 draft 撞名（时间戳粒度边界）

- **覆盖**：`R2 / §5.4（盲点驱动：命名粒度秒，同秒两次 draft 可能同文件名）——**作废**：spec 第 2 轮 §5.4 已定义行为（同秒撞名 → 列冲突报错），断言升级见 TC-081；本用例保留作盲点发现记录`
- **前置**：草稿箱空
- **步骤**：① 同秒内连续两次 `draft --kind agent --name <name>`（先 rm 旧稿或不同 name 两次）
- **预期**：两次草稿可区分（追加后缀 / 拒绝第二次 / 时间戳含更细粒度）——实现三选一，测试断言「两次 draft 不得静默覆盖同一文件名」
- **判据**：草稿箱文件数 = 2 或第二次报错；文件名两两不同
- **红绿证据**：红 = 两次同文件名静默覆盖（丢失一次草稿）；绿 = 可区分
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖跨秒多次 draft（TC-065 已覆盖可区分性）

### TC-075 停损计数：同一红项修复 2 次仍红 → 停止

- **覆盖**：`R15（同一红项修复 2 次仍红 → 停止写复盘；对象标「停损未迁」）`
- **前置**：迁移执行现场（S2/S3/S4 迁移期）
- **步骤**：① 记录某红项修复轮次；② 第 2 次修复后仍红；③ 核对行为
- **预期**：停止对该对象继续修复并写复盘；对象标「停损未迁」；队列停在对象
- **判据**：人工：迁移执行者核「修复 2 次仍红 → 停止」；账本（PRD §6.6）该对象状态 = 停损未迁 + 复盘指针
- **红绿证据**：红 = 修 2 次仍红继续死磕；绿 = 停止并登记
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖停损后的守卫机制（registered 态 + check-agents，TC-067/070 覆盖）

### TC-076 环境/基线红不计入停损

- **覆盖**：`R15（环境/基线红不计入停损，先修环境再继续）`
- **前置**：迁移执行现场；出现 `EnvironmentEOL` / baseline 类红
- **步骤**：① 记录红项；② 核对是否计入停损计数
- **预期**：环境/基线红不计入停损计数；修复环境后继续
- **判据**：人工：迁移执行者核「环境/基线红先修环境」；计数不含该红项
- **红绿证据**：红 = 环境红被算成停损导致误停；绿 = 不计入
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖环境红的具体修复（CI/环境配置）

### TC-077（作废）registered 对象文件缺失（错误码未定义）

- **覆盖**：`R10 / §8.6（盲点驱动：registered 态对象的存在性检查——文件缺失时的行为 spec 未定义，推断 DanglingBaselineEntry（exit 2））——**作废**：spec 第 2 轮 §8.6 已定义错误码 DanglingBaselineEntry（exit 2），断言升级见 TC-082；本用例保留作盲点发现记录`
- **前置**：存在 registered 态对象
- **步骤**：① 删除该对象的 `agents/<name>.md`；② `gate`；③ `check-agents`
- **预期**：gate 检出文件缺失（存在性检查失败，推断 exit 2 baseline 族）；check-agents 对该对象报存在性失败——具体错误码以实现落地为准，测试先断言「必须非 0 且含该文件名」
- **判据**：两命令退出码非 0；输出含该 name；具体码按实现核对（本用例先锁行为，码待实现评审对齐）
- **红绿证据**：红 = 文件缺失被容忍（exit 0 假绿）；绿 = 非 0 检出
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖该场景的精确错误码归属（spec 未定义，登记 §7 缺口 1）

### TC-078（spec 第 2 轮增量修订补充）when 集合两两唯一正例：六视角席通过

- **覆盖**：`§6-10（第 2 轮新增）/ P2-8-触发表断言 c（when 集合两两唯一；六视角席因视角名不同天然两两不同；「可同时命中 = 议会多点将」由点将矩阵裁决，本份不断言）`
- **前置**：agentData 14 席 + triggerTable 完整（13 席 when 逐字提取 + senior-sdet 转录 when）；六视角席 when 各异
- **步骤**：① 运行 validateAgentData 全量校验（14 席）；② 对 when 集合做 pairwise 唯一断言
- **预期**：全 14 席通过；when 集合两两唯一（集合大小 == 席数）；无 `DuplicateWhen` 抛出
- **判据**：单测退出码 0；pairwise 唯一断言（`new Set(whenList).size === whenList.length`）通过
- **红绿证据**：红 = 六视角席 when 被提取塌缩（视角名丢失导致两两相同）→ 误报 `DuplicateWhen`；绿 = 全过
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖「可同时命中 = 议会多点将」的调度裁决（P2-8 明确本份不断言）；不覆盖两席 when 相同的负例（TC-079）

### TC-079（spec 第 2 轮增量修订补充）两席 when 相同 → DuplicateWhen exit 1

- **覆盖**：`§6-10（第 2 轮新增）/ P2-8-触发表断言 c（任何两席 when 不得完全相同——同构场景区分度）`
- **前置**：agentData 注入两个对象 when 完全相同（复制粘贴漏改视角名场景）
- **步骤**：① 运行 validateAgentData（注入重复 when）
- **预期**：返回 `DuplicateWhen`；CLI 层 exit 1
- **判据**：单测断言错误码 = `DuplicateWhen`；CLI 场景退出码 1
- **红绿证据**：红 = 两席同 when 不报；绿 = DuplicateWhen
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖「同 when 但不同 route」的语义（spec 断言按 when 字符串判唯一，不跨字段豁免）

### TC-080（spec 第 2 轮增量修订补充）outputKind 非法枚举 → InvalidOutputKind exit 1

- **覆盖**：`§6-11（第 2 轮新增）（outputKind ∈ { issue-card, observation, audit, testcase } 枚举合法）`
- **前置**：agentData 注入 outputKind 为枚举外值（如 'report' / '' / 'DOC'）
- **步骤**：① 运行 validateAgentData（注入非法 outputKind）
- **预期**：返回 `InvalidOutputKind`；CLI 层 exit 1
- **判据**：单测断言错误码；CLI 场景退出码 1
- **红绿证据**：红 = 非法枚举静默通过（渲染出未知 kind）；绿 = InvalidOutputKind
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 4 个合法枚举成员的正例（TC-014 全通过隐含覆盖）；不覆盖 sharedBlock 枚举（TC-043）；枚举集合以 §6-11 四值为准（§4.1 已列 4 值（含 testcase），与 §6-11 同口径，§8 给开发的建议 1 已落地）

### TC-081（spec 第 2 轮增量修订补充）同秒同 --name 重复 draft → 列冲突报错不静默覆盖

- **覆盖**：`R2 / §5.4（第 2 轮新增：同秒撞名保护——时间戳粒度到秒，同秒内同 --name 重复 draft 不得静默覆盖，列冲突报错）`
- **前置**：草稿箱空；`DOCGEN_DRAFTS_DIR` 已设置（重定向到临时草稿箱，测试隔离见 TC-083）
- **步骤**：① 同秒内连续两次 `draft --kind agent --name <name>`（注入固定时间戳或真实同秒两次调用）
- **预期**：第一次落草稿成功；第二次报冲突（提示新草稿已存在，请 `draft rm` 或等下一秒重试）；不得静默覆盖第一次草稿
- **判据**：第一次退出码 0 且草稿箱文件数 = 1；第二次退出码 1 且输出含 `DraftNameConflict` 与已存在草稿文件名；第二次后草稿箱文件数仍 = 1（内容未被替换）；无仓库 `git status` 改动（草稿在临时箱）
- **红绿证据**：红 = 第二次同文件名静默覆盖（文件数 = 1 但内容被替换，或文件数变 0）；绿 = `DraftNameConflict`（exit 1）+ 首稿保留
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖跨秒多次 draft 的可区分性（TC-065）；不覆盖「draft rm 后重试」成功路径（TC-004）

### TC-082（spec 第 2 轮增量修订补充）registered 对象文件缺失 → DanglingBaselineEntry exit 2

- **覆盖**：`R10 / R11 / §8.6（第 2 轮新增：registered 态对象文件缺失——baseline 清单内存在但 agents/<name>.md 不存在 → DanglingBaselineEntry（exit 2），不允许静默通过）`
- **前置**：存在 registered 态对象（未入队席，baseline 清单内登记）
- **步骤**：① 删除该对象的 `agents/<name>.md`；② `gate`；③ `check-agents`
- **预期**：gate 报 `DanglingBaselineEntry`（exit 2）；check-agents 对该对象报存在性失败（非 0 且含文件名）；两者均不得 exit 0 假绿
- **判据**：gate 退出码 2 且输出含 `DanglingBaselineEntry` 与文件名；check-agents 退出码非 0 且输出含该文件名
- **红绿证据**：红 = 文件缺失 gate 仍 exit 0（spec §8.6 明令禁止的假绿）；绿 = DanglingBaselineEntry 检出
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖已巩固对象文件缺失（spec 第 3 轮 §8.6 已定同码 `DanglingBaselineEntry`（exit 2），专项见 TC-094）；不覆盖文件存在但被篡改（TC-037/044）

### TC-083（spec 第 3 轮修复同步）测试隔离：测试不得写真实草稿箱（DOCGEN_DRAFTS_DIR 重定向）

- **覆盖**：`R2 / §5.4 / W 族（第 3 轮扩展：测试隔离——测试代码不得写真实 ~/.retro-skills/docgen-drafts/；P1 的 DOCGEN_TEST_MODE 只重定向 TMP_ROOT/RULES_DIR/BASELINE_PATH，草稿箱重定向由新增 `DOCGEN_DRAFTS_DIR` 变量承担（P2 扩展）；check-all.mjs 的测试变量剥离逻辑同步扩展）`
- **前置**：`DOCGEN_DRAFTS_DIR` 机制已实现（草稿箱重定向）；记录真实草稿箱当前内容（快照）
- **步骤**：① 设置 `DOCGEN_DRAFTS_DIR`（指向临时目录，正常 CLI 不设置）；② 跑完整 draft/replace/rm 测试套件（含 `draft rm --yes` 删全部）；③ 检查真实 `~/.retro-skills/docgen-drafts/` 内容；④ Grep 测试源码是否引用真实草稿箱路径；⑤ 核对 check-all.mjs 剥离逻辑含 DOCGEN_DRAFTS_DIR
- **预期**：测试全程只写临时草稿箱（经 DOCGEN_DRAFTS_DIR）；真实草稿箱零变化（无新增 / 无删除 / 无修改）；测试源码不引用真实路径字面量；check-all 剥离逻辑覆盖 DOCGEN_DRAFTS_DIR（防测试变量泄漏进子进程）
- **判据**：运行前后真实草稿箱文件集不变（目录快照比对）；`Grep('retro-skills/docgen-drafts', 'tools/docgen/test')` 命中 0；DOCGEN_DRAFTS_DIR 下草稿落点在临时目录（单测断言路径以 `os.tmpdir()` 或测试目录开头）；`Grep('DOCGEN_DRAFTS_DIR', 'scripts/check-all.mjs')` 命中 ≥1（剥离逻辑同步，W 族）
- **红绿证据**：红 = 测试跑完真实草稿箱出现残留或真实草稿被 rm（污染）/ check-all 未剥离 DOCGEN_DRAFTS_DIR 导致测试变量泄漏；绿 = 隔离生效
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖正常 CLI 的草稿箱落点（TC-025）；不覆盖 P1 既有 DOCGEN_TEST_MODE 隔离机制的实现细节（沿用，草稿箱维度由 DOCGEN_DRAFTS_DIR 承担）

### TC-084（spec 第 4 轮修复同步）断言 14：已拆槽席 when 缺省/为空 → MissingWhen exit 1（registered 未拆槽席豁免）

- **覆盖**：`§6-14 / P2-8-触发表断言 a / P 族 / Q-2-01（每 agent ≥ 1 条 when；S1 阶段仅对已拆槽席生效，registered 未拆槽席豁免，拆槽完成后全量生效——与 W4 派生断言同豁免口径）`
- **前置**：agentData 14 席 + triggerTable；构造某**已拆槽**席 when 缺省 / when 为 `''` / 全空白（registered 未拆槽席不触发本断言）
- **步骤**：① 依次注入 when 缺省、`''`、全空白三态；② 运行 validateAgentData
- **预期**：三态均返回 `MissingWhen`；CLI 层 exit 1（该席为已拆槽席；registered 未拆槽席 when 缺省不触发）
- **判据**：单测断言错误码 = `MissingWhen`（对已拆槽席）；CLI 场景退出码 1
- **红绿证据**：红 = 已拆槽席 when 缺省不报（触发表漏槽静默出货）/ registered 未拆槽席被误判 MissingWhen（Q-2-01 豁免失效）；绿 = 已拆槽席 MissingWhen + registered 豁免
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖已拆槽席每席 ≥1 when 的正例（TC-085）；不覆盖 when 格式违规（TC-045/087）

### TC-085（spec 第 4 轮修复同步）断言 14 正例：已拆槽席每席 ≥1 条 when + registered 豁免

- **覆盖**：`§6-14 / P2-8-触发表断言 a / Q-2-01（triggerTable 中已拆槽席 when 非空；registered 未拆槽席豁免——S1 序 0 收录的已具完整组件数据的席；P1-O 口径 when/route 拆槽由 S2/S3/S4 完成；与 W4 派生断言同豁免口径）`
- **前置**：agentData 14 席 + triggerTable 完整；对未拆槽席按 Q-2-01 口径以 registered 态豁免（不要求 when 非空）
- **步骤**：① 运行 validateAgentData 全量校验；② 断言 triggerTable 中已拆槽席 when 非空
- **预期**：已拆槽席全部通过；registered 未拆槽席豁免（不报 `MissingWhen`）；无 `MissingWhen` 抛出
- **判据**：单测退出码 0；已拆槽席 when 均非空；registered 未拆槽席不参与断言 14
- **红绿证据**：红 = 已拆槽席 when 被误判缺失（拆槽管道错误）/ registered 未拆槽席被断言 14 误伤（豁免失效）；绿 = 全过 + 豁免
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 when 缺失的负例（TC-084）

### TC-086（spec 第 3 轮修复同步）断言 13 正例：fallback 未声明 = 合法；声明 true = 合法

- **覆盖**：`§6-13 / P2-8-触发表断言 e / B 族（fallback 为可选布尔声明位：未声明 = 合法（vacuous）；若声明则值必须为 true 且 route ∈ agentData 键集）`
- **前置**：agentData 14 席 + triggerTable；13 席 notWhen/fallback 一律缺省；构造某席声明 fallback=true 且 route 在键集内
- **步骤**：① 对全部席运行 validateAgentData；② 注入声明 fallback=true + route ∈ 键集的席再跑
- **预期**：未声明席通过（vacuous 合法）；声明 true + route 合法席通过；无 `TriggerMissingRoute` 抛出
- **判据**：单测退出码 0；两态均通过
- **红绿证据**：红 = 未声明 fallback 被误判非法（旧断言 e「fallback ∈ 键集」措辞复现）；绿 = vacuous 合法
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖声明非法的负例（TC-049）

### TC-087（spec 第 3 轮修复同步）when 以「时」结尾 → WhenFormatViolation exit 1（防「时时调用」）

- **覆盖**：`§6-7 / §4.1 / A 族（when 不得以「时」结尾——「时调用」的「时」是句式固定部分，非 when 内容；否则拼装出「时时调用」）`
- **前置**：agentData 注入 when 以「时」结尾（如「当每轮评审时」——提取时错误包含尾「时」）
- **步骤**：① 运行 validateAgentData（注入尾「时」when）；② 派生 description 校验
- **预期**：返回 `WhenFormatViolation`；CLI 层 exit 1
- **判据**：单测断言错误码；CLI 场景退出码 1
- **红绿证据**：红 = 尾「时」when 通过（派生拼装出「时时调用」、黄金断言必红）；绿 = WhenFormatViolation
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 when 含整句字样（TC-045 步骤 ①②）；不覆盖派生输出「时时」的独立断言（TC-088）

### TC-088（spec 第 3 轮修复同步；第 5 轮补 registered 豁免）派生 description 含「时时」连续字 → DescriptionDerivation exit 1

- **覆盖**：`§6-8 / R13 / §4.2 / A 族（gate 机械断言：派生 description 不得含「时时」连续字，对已拆槽席生效——新增席无现文件、无黄金断言，靠此断言兜底，防静默出货）；W4 派生断言 registered 豁免（Q-3-NEW-1：时时断言属 §6-8 派生断言族，与断言 14 同豁免口径，registered 未拆槽席豁免）`
- **前置**：构造 when 含尾「时」或 when 提取错误，使派生 description 出现「时时」连续字（绕过 §6-7 时）；注入对象为**已拆槽席**（registered 未拆槽席豁免，不触发）
- **步骤**：① 注入使派生 description 含「时时」的 when；② 运行派生断言 / gate 的机械断言
- **预期**：返回 `DescriptionDerivation`；CLI 层 exit 1（该席为已拆槽席；registered 未拆槽席 when 未拆槽不触发）
- **判据**：单测断言错误码；gate 场景退出码 1 且输出含该席名称
- **红绿证据**：红 = 派生 description 含「时时」仍绿（新增席静默出货，自证循环之外的最后防线）/ registered 未拆槽席被误判（豁免失效）；绿 = DescriptionDerivation（对已拆槽席）
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 when 尾「时」在数据层的拦截（TC-087）；不覆盖迁移席黄金断言（S2/S4）；registered 未拆槽席的 W4 豁免专项见 TC-102

### TC-089（spec 第 3 轮修复同步）generate 对 registered 态对象跳过逐字节、只登记/存在检查 + 容忍红

- **覆盖**：`R3 / §5.2 / D 族（generate 对 registered 态对象跳过逐字节比对，只做登记/存在检查 + 标注未巩固 + 容忍红——S1 终态 14 席数据在组件但文件未替换，无此豁免则 generate 必红）`
- **前置**：存在 registered 态对象（组件有数据、agents/<name>.md 在、未巩固）；已巩固对象基线正常
- **步骤**：① `node tools/docgen/cli.mjs generate`；② 手改 registered 对象 `agents/<name>.md` 一字节；③ 再跑 generate
- **预期**：步骤 ① exit 0（registered 席标注未巩固、不逐字节比对）；步骤 ③ 仍 exit 0（容忍红）；已巩固对象仍逐字节守
- **判据**：两次 generate 退出码均 0；stdout 对 registered 席含「未巩固」标注且无 `Mismatch`；已巩固对象无漂移
- **红绿证据**：红 = registered 对象被逐字节比对（exit 1 误报）/ registered 文件缺失未检查；绿 = 豁免生效
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 registered 文件缺失（TC-082）；不覆盖 check-agents 侧 registered 豁免（TC-067）

### TC-090（spec 第 3 轮修复同步）generate --name <不存在> → MissingComponentData exit 2

- **覆盖**：`R3 / §5.2 / Y 族（--name <不存在> → MissingComponentData（exit 2））`
- **前置**：cli 就位；name 不在 agentData 键集（也不在 rule 清单）
- **步骤**：① `node tools/docgen/cli.mjs generate --kind agent --name <不存在>`
- **预期**：报 `MissingComponentData`；exit 2
- **判据**：退出码 2；输出含 `MissingComponentData`
- **红绿证据**：红 = 对不存在 name 静默遍历全部（调试期误当全量）/ 报其它码；绿 = MissingComponentData（exit 2）
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 name 格式非法（§5.2 NF-1：格式层 → InvalidName（exit 1），专项见 TC-101）；不覆盖 replace 侧无组件数据（TC-034）

### TC-091（spec 第 3 轮修复同步）draft rm --yes 删全部成功路径

- **覆盖**：`R2 / §5.4 / I 族（无 --name 删全部需 --yes 授权；带 --yes 则删全部）`
- **前置**：草稿箱 ≥2 个 name 的草稿；`DOCGEN_DRAFTS_DIR` 已设置（测试隔离，不碰真实草稿箱）
- **步骤**：① `node tools/docgen/cli.mjs draft rm --yes`；② `node tools/docgen/cli.mjs draft ls`
- **预期**：草稿箱清空；`NotAuthorized` 不触发（--yes 授权位在）
- **判据**：退出码 0；`draft ls` 输出为空；草稿箱目录无 `.md` 文件（临时箱）
- **红绿证据**：红 = 带 --yes 仍拒（授权位实现错）；绿 = 删全部成功
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖无 --yes 被拒（TC-007）

### TC-092（spec 第 3 轮修复同步）拒红判别子：同源多目标 B 已落草稿（草稿==渲染）→ 替换 A 时 B 的红放行

- **覆盖**：`R6 / §5.3-3 / F 族（判别子：允许替换当且仅当 D ⊆ {目标} ∪ {该文件在草稿箱有草稿且草稿 == 其组件渲染}——已落草稿的同源多目标放行）`
- **前置**：同一组件改动引发 A、B 两目标差异；A、B 均已在同一迁移旅程落过草稿（草稿 == 组件渲染）；`agents/A.md` 为目标
- **步骤**：① `replace --kind agent --name A --draft <A 草稿> --yes`；② `gate`
- **预期**：判别子判定 D ⊆ {A} ∪ {B（有草稿且==渲染）} → 替换 A 放行；B 的差异属同源预期，不构成拒红
- **判据**：replace 退出码 0；替换后 gate 对 A 绿（B 的 registered/已落稿状态按 §8.6 口径）；B 草稿保留
- **红绿证据**：红 = B 有草稿仍被当无关漂移拒红（判别子未实现）；绿 = 放行
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 B 无草稿的手改漂移（TC-093/031）；不覆盖逐目标收敛（TC-018）

### TC-093（spec 第 3 轮修复同步）拒红判别子：无草稿的手改漂移 → 拒绝替换

- **覆盖**：`R6 / §5.3-3 / F 族（无草稿的手改漂移（如手改 agents/B.md）→ 拒绝替换，报对应错误码，草稿保留）`
- **前置**：目标 A 草稿已落；已巩固对象 B 被手改（`agents/B.md` 一字节）且 B 在草稿箱无草稿
- **步骤**：① `replace --kind agent --name A --draft <A 草稿> --yes`
- **预期**：判别子判定 B 无草稿（∉ 放行集）→ 拒绝替换；报 `Mismatch`（B 漂移）；草稿保留
- **判据**：replace 退出码非 0（1 档 `Mismatch`）；输出含 B 的文件名；`draft ls --name A` 仍有草稿；`agents/A.md` 不变
- **红绿证据**：红 = 无草稿的手改漂移被放行（D6 被绕过）；绿 = 拒红 + 草稿保留
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 B 未巩固且被手改（TC-031）；不覆盖 B 已落草稿同源放行（TC-092）

### TC-094（spec 第 3 轮修复同步）已巩固对象文件缺失 → DanglingBaselineEntry exit 2

- **覆盖**：`R11 / §8.3 / §8.6 / W 族（已巩固对象文件缺失——baseline 清单内有、agents/<name>.md 文件不存在，与 registered 同口径报 DanglingBaselineEntry（exit 2），不允许静默通过）`
- **前置**：存在已巩固对象（已替换入 agents/，baseline 清单内登记）
- **步骤**：① 删除该对象的 `agents/<name>.md`；② `gate`；③ `check-agents`
- **预期**：gate 报 `DanglingBaselineEntry`（exit 2）；check-agents 退出码非 0 且含该文件名；两者均不得 exit 0 假绿
- **判据**：gate 退出码 2 且输出含 `DanglingBaselineEntry` 与文件名；check-agents 退出码非 0 且输出含该文件名
- **红绿证据**：红 = 已巩固文件缺失 gate 仍 exit 0（W 族裁决前的历史盲点）；绿 = DanglingBaselineEntry 检出
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 registered 对象文件缺失（TC-082）；不覆盖文件存在但被篡改（TC-037/044）

### TC-095（spec 第 3 轮修复同步）name 非法 regex → InvalidName exit 1（断言 1 合法性部分）

- **覆盖**：`§6-1 / X 族（name 匹配 ^[a-z][a-z0-9-]{0,49}$：首字符必须小写字母、仅小写字母/数字/连字符、长度 ≤50）`
- **前置**：agentData 注入非法 name 各态（测试数据）
- **步骤**：① 注入：首字符大写 `Reviewer-audit`、含下划线 `reviewer_audit`、空串 `''`、超长（51 字符）、仅连字符 `-`；② 逐次运行 validateAgentData
- **预期**：五态均返回 `InvalidName`；CLI 层 exit 1
- **判据**：单测断言错误码 = `InvalidName`；CLI 场景退出码 1
- **红绿证据**：红 = 非法 name 静默通过（regex 未承接旧 gen-agents 断言 1）；绿 = InvalidName
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 name 唯一性（TC-039）；不覆盖 CLI 层 name→路径校验（§5.2 NF-1：格式层 InvalidName（exit 1）优先、assertInside 复判 InvalidOutputPath（exit 2），专项见 TC-101）

### TC-096（spec 第 4 轮修复同步）sharedBlock 同引用枚举同值正例 + 无 sharedBlock 席不渲染该节

- **覆盖**：`§6-5 / X 族 / N1（引用同一枚举的席值一致 + 无 sharedBlock 席不渲染该节——真实 ROLES 仅 4/13 席有 sharedBlock，三值 AUDIT_RULES/SIX_METHODS/DETECTIVE_RULES，第 4 轮 N1 修正「13 席同值」为「同引用枚举同值」）`
- **前置**：agentData 全 14 席 + patternRegistry 枚举完整；真实数据形态：仅 4/13 席声明 sharedBlock（AUDIT_RULES / SIX_METHODS / DETECTIVE_RULES 三值），其余席无 sharedBlock 字段（senior-sdet 无此字段）
- **步骤**：① 遍历声明 sharedBlock 的席；② 断言引用同一枚举的席值一致；③ 渲染无 sharedBlock 席并断言输出不含 sharedBlock 节
- **预期**：引用同一枚举的席值一致（AUDIT_RULES / SIX_METHODS / DETECTIVE_RULES 各组内无分叉）；无 sharedBlock 席渲染输出不出现该节；无 `SharedBlockMissing`
- **判据**：单测断言：引用同一枚举的席值两两一致（各组内无分叉）；无 sharedBlock 席的渲染输出 Grep sharedBlock 节内容命中 0；无 `SharedBlockMissing` 抛出
- **红绿证据**：红 = 同引用枚举值分叉（复制粘贴漏改枚举名）/ 无 sharedBlock 席仍渲染出该节（节渲染条件错，N1）；绿 = 同值 + 不渲染
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖悬空引用负例（TC-043）

### TC-097（spec 第 3 轮修复同步）新增席 when 与现有 14 席两两不同（断言 10 联动）

- **覆盖**：`§8.2 / §6-10 / Y 族（W5 新增席（dc-translator 试点）when 须与现有 14 席两两不同——断言 10 联动，否则 DuplicateWhen）`
- **前置**：现有 14 席 when 集合；新增席 when 构造两态：与现有某席相同 / 全不同
- **步骤**：① 注入新增席 when == 现有某席 when；② 运行 validateAgentData（应 `DuplicateWhen`）；③ 改为全不同的 when 再跑
- **预期**：态 ① `DuplicateWhen`（exit 1）；态 ② 通过（断言 10 不误伤）
- **判据**：单测断言两态错误码 / 通过；CLI 场景 exit 1 / 0
- **红绿证据**：红 = 新增席 when 撞现有席仍过（同构无区分度，断言 10 失效）；绿 = 联动检出
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖受控变更旅程全流程（TC-013）；不覆盖现有 14 席内部两两唯一（TC-078/079）

### TC-098（spec 第 3 轮修复同步；第 4 轮标注正/负）V6③ 判据增删同步：renderBlocks 数据驱动断言（判据含正负两态，审计 Q2）

- **覆盖**：`R14-V6③（P1 等价迁移，E 族补：判据增删 → 渲染输出同步增删——renderBlocks 数据驱动断言，防「判据增删与渲染输出不同步」）`
- **前置**：`.tmp-test/` 副本；组件数据含判据集
- **步骤**：① 在组件数据中新增一条判据（组件侧增）；② 重渲染并比对 target；③ 删除一条判据（组件侧删）；④ 再比对
- **预期**：组件增判据 → 渲染输出相应增块（比对通过）；组件删判据 → 输出相应删块（比对通过）；增删不同步（仅改组件未改输出）→ 报 `Mismatch`
- **判据**：命令退出码 0（组件与输出同步增删时）/ 1（增删不同步，输出含 `Mismatch` 与 line/byte）
- **红绿证据**：红 = 组件增删判据但渲染输出不随之增删仍通过（renderBlocks 未数据驱动）；绿 = 同步检出
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 V6① 读 target 替身（TC-054）；不覆盖 V6② 模板贴全文（TC-055）

### TC-099（spec 第 4 轮修复同步）generate --kind 缺省 = rule + agent 两清单全遍历（NF-2）

- **覆盖**：`R1 / R3 / §5.1 / §5.2 / NF-2（--kind 缺省 = 两清单全遍历；--kind 是可选参数（[--kind rule|agent]），缺省不缩小遍历范围——rule 21 + agent 14 全跑）`
- **前置**：同 TC-002；cli 就位；agentData 全 14 席 + rule 组件数据完整；registered 态席存在性满足（S1 序 0 按 §8.6 收录）
- **步骤**：① `node tools/docgen/cli.mjs generate`（无 --kind、无 --name）；② 分别跑 `generate --kind rule` 与 `generate --kind agent` 存输出；③ 比对并集
- **预期**：无 --kind 时输出覆盖 rule 清单全部 + agent 清单全部（两清单全遍历，非只 rule）；与显式 --kind 两次调用的输出并集一致
- **判据**：退出码 0；stdout 含 rule 对象数（21，常量派生）+ agent 对象数（14 = `Object.keys(agentData).length`，NF-5 字典序）；stdout 覆盖集合 = 两次显式 --kind 调用的并集；`git status --short` 为空
- **红绿证据**：红 = 缺省只遍历 rule 清单（agent 被漏）/ 只遍历 agent（rule 被漏）；绿 = 两清单全遍历
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 --name 精确单对象（TC-003/090）；不覆盖 registered 豁免细节（TC-089）；不覆盖显式 --kind rule/agent 单独（TC-001/TC-002 覆盖无 --kind 无 --name，本用例聚焦 NF-2 缺省语义）

### TC-100（spec 第 4 轮修复同步）replace --kind rule（非 agent kind）→ UnsupportedKind exit 2（NF-3）

- **覆盖**：`R5 / §5.1 / §5.2 / NF-3（replace 只支持 --kind agent；非 agent kind → UnsupportedKind（exit 2）——与 draft 侧同码，第 4 轮 NF-3 明确）`
- **前置**：cli 就位；草稿已落（任意 name）
- **步骤**：① `node tools/docgen/cli.mjs replace --kind rule --name <name> --draft <草稿> --yes`
- **预期**：拒绝并报 `UnsupportedKind`；exit 2；不写 agents/、不清草稿
- **判据**：退出码 2；输出含 `UnsupportedKind`；`git status --short agents/` 为空；`draft ls --name <name>` 草稿仍在
- **红绿证据**：红 = 非 agent kind 被静默接受（把 rule 当 agent 写）/ 报错档位非 2；绿 = UnsupportedKind（exit 2）
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 draft 侧非 agent kind（TC-066）；不覆盖 replace 成功路径（TC-009）

### TC-101（spec 第 4 轮修复同步）CLI 层 --name 逃逸（含 /、..、\）→ InvalidName exit 1（NF-1 检查序①格式层拦截）

- **覆盖**：`§5.2 / NF-1（name→路径校验检查序 = ①格式 ^[a-z][a-z0-9-]{0,49}$（InvalidName exit 1）②assertInside 复判（InvalidOutputPath exit 2）；regex 不允许 / \ .，故「含 /、.. 逃逸」在格式层即被拦（InvalidName），不是 InvalidOutputPath）`
- **前置**：cli 就位；草稿已落（供 replace 侧触发）
- **步骤**：① `generate --kind agent --name "foo/../bar"`；② `generate --kind agent --name "a/b"`；③ `replace --kind agent --name "..\\evil" --draft <草稿> --yes`；④ `draft --kind agent --name "foo..bar"`
- **预期**：四态均报 `InvalidName`；exit 1；不进入路径解析（草稿箱 / agents/ 零改动）
- **判据**：四个场景退出码均 1；输出均含 `InvalidName`；`git status --short agents/` 为空；草稿箱无新增文件
- **红绿证据**：红 = name 逃逸被当 InvalidOutputPath（exit 2，错误码二义 NF-1 前状态）/ 逃逸字符未被格式层拦截直接进 assertInside；绿 = InvalidName（exit 1）统一
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖 name 合法但 resolve 异常的 assertInside 复判层（InvalidOutputPath，TC-033 场景 ②）；不覆盖数据层 name regex 边界（TC-095）

### TC-102（spec 第 5 轮修复同步）gate×registered 豁免：registered 未拆槽席不触发 W4 派生断言（DescriptionDerivation）

- **覆盖**：`§4.2 / §6-8 / R13 / Q-3-NEW-1（W4 派生断言与断言 14 同豁免口径：S1 阶段仅对已拆槽席生效，registered 未拆槽席豁免——when 未拆槽无法按句式拼装 description，若按「全 14 席」字面实现则 S1 终态 gate 必红；拆槽完成后全量生效）`
- **前置**：存在 registered 未拆槽席（组件有数据、when 未拆槽、`agents/<name>.md` 在、未巩固）；已拆槽席数据正常
- **步骤**：① 对全 14 席运行 W4 派生断言（含「时时」机械断言）/ `gate`；② 核对 registered 未拆槽席是否被误报 `DescriptionDerivation`
- **预期**：registered 未拆槽席不触发 `DescriptionDerivation`（豁免生效，与断言 14 同口径）；已拆槽席仍受 W4 派生断言约束（派生不符 / 含「时时」仍报）
- **判据**：单测断言 registered 未拆槽席豁免（不抛 `DescriptionDerivation`）；gate 场景退出码 0（S1 终态无假红）；已拆槽席违规仍 exit 1
- **红绿证据**：红 = registered 未拆槽席被 W4 派生断言误伤（when 未拆槽无法拼装 → S1 终态 gate 必红，Q-3-NEW-1 豁免失效）；绿 = 豁免生效
- **对应测试**：待 plan Task N
- **不覆盖**：不覆盖已拆槽席的 W4 派生断言失败分支（TC-046/088）；不覆盖断言 14 的 registered 豁免（TC-084/085）；不覆盖 generate 逐字节比对的 registered 豁免（TC-089）

## 3 负例与边界

> 表名口径（P2-V）：本表既列负例也列验证性**正例/边界**（TC-078、TC-085/086/089/091/092/096/097/099 等正例列入以便对照），「正/负」以覆盖总表标注为准；作废用例（TC-074/077）保留行。

| 用例 ID | 边界/负例是什么 | 为什么容易漏 | 期望行为 |
|---|---|---|---|
| TC-007 | draft rm 无 --name 且无 --yes | 破坏性操作默认不设授权位（I 族） | `NotAuthorized` exit 4，草稿箱不变 |
| TC-026 | replace 缺 `--yes` | 开发者默认「有草稿就是授权」 | `NotAuthorized` exit 4，零改动 |
| TC-027 | draft 遇旧草稿 | 想当然「直接覆盖旧的」 | `DraftNameConflict` exit 1，列出旧稿不自动生成 |
| TC-028 | 草稿被手改 | 草稿在 homedir「看不见就不防」 | `DraftDrift` exit 1 拒绝 |
| TC-029 | `--draft` 指向不存在路径 | 草稿路径写错时静默当空 | `DraftNotFound` exit 3 |
| TC-030 | 同一草稿 replace 两次 | 重放请求场景 | 第二次 `DraftNotFound` exit 3 |
| TC-031 | 与目标无关的未巩固席漂移 | 迁移期最常见现场（别的席在动） | 拒红 + 草稿保留 |
| TC-032 | 与目标无关的 baseline 漂移 | baseline 与草稿分属两处心智 | 拒红报 baseline 族错误 |
| TC-033 | 替换目标白名单外 / name 逃逸 | 参数越界注入（NF-1：逃逸字符在格式层被拦） | `InvalidName`（exit 1）/ `InvalidOutputPath`（exit 2） |
| TC-034 | replace 无组件数据 | 组件删除与草稿残留不同步 | `MissingComponentData` exit 2 |
| TC-035 | 草稿目录不可写 | 权限场景只在 CI 出现 | `DraftWriteFailed` exit 3 |
| TC-036 | 清单外新增规则文件 | 「加一条规则」是最常见的真实动作 | `UnregisteredHandwritten` exit 2 |
| TC-037 | 手改已生成 agent 一个字节 | 手改「看起来没坏」 | `Mismatch` exit 1 |
| TC-038 | generate 副作用 | 纯检查语义被实现成写盘 | 零写盘、零草稿 |
| TC-039 | name 重复 / name 非法 regex | 加席时复制粘贴改名漏改；regex 未承接旧断言 1 | `DuplicateAgentName` / `InvalidName` exit 1 |
| TC-040 | 模板占位符未闭合/未知 key | 模板编辑漏一个 `}}` | `TemplateSyntaxError` exit 1 |
| TC-041 | agentData 缺 name/tools（断言 3 只查这两字段；when 缺省由 TC-084 独占） | 断言对象是纯数据（J 族），输出层由断言 6 兜底；when 缺失不得两码（F1） | `FrontmatterFieldMissing` exit 1 |
| TC-042 | 13 席 tools 带写权限 | 未来加席时误给写权限 | `ToolsViolation` exit 1 |
| TC-043 | sharedBlock 引用悬空 / 同引用枚举值分叉 | 枚举改名忘同步引用；加席复制漏改枚举名（N1：非「13 席同值」） | `SharedBlockMissing` exit 1 |
| TC-044 | 渲染 ≠ target | D6 的核心防线 | `Mismatch` exit 1 含文件名 |
| TC-045 | when 含整句 description 字样 / 尾「时」 | 提取时把整句当 when；尾「时」拼出「时时调用」 | `WhenFormatViolation` exit 1 |
| TC-046 | 组件硬编码 description / 派生含「时时」 | F-02 实测教训；新增席静默出货 | `DescriptionDerivation` exit 1 |
| TC-047 | route 悬空 / 重复 | 触发表指向已删对象；同一触发表条目 route 键重复（N4 残留裁决：两失败面两码，CI 可区分） | 悬空 `TriggerMissingRoute` / 重复 `TriggerConflict`，均 exit 1 |
| TC-048 | notWhen.refs 越界 | 防误触发字段指向不存在 | `TriggerConflict` exit 1 |
| TC-049 | fallback 声明非法（值非 true / route 越界） | 兜底路由声明错（B 族 vacuous：未声明 = 合法） | `TriggerMissingRoute` exit 1 |
| TC-050 | 目标副本改 1 字节 | 字节级差异最容易静默 | `Mismatch` line/byte 非空 |
| TC-051 | CRLF 不归一 | EOL 归一化掩盖差异是 P1 已知坑 | `Mismatch`（不归一） |
| TC-052 | 判据格空/空白/TODO | 空格与 TODO 视觉「像有内容」 | `MissingSlot` 指向该格 |
| TC-053 | 非法枚举类型 | 新类型组合加进枚举外值 | `InvalidRuleType` + field/value |
| TC-054 | render 读 target 作弊实现 | 最隐蔽的假绿（V6 核心） | `ImpureRender` |
| TC-055 | 模板贴全文 | 字节相等假绿的另一路 | `TemplateHardcoded` |
| TC-056 | 坏 baseline 五类 | 手改 baseline 是入口强制最直接绕过 | 按 R9 顺序报对应码 |
| TC-057 | BOM/CR/INVALID_UTF8 | Windows 环境编码误诊 | `EnvironmentEOL` 分诊 |
| TC-058 | 新增规则过 check-all | 入口基线缺一条就整体失守 | 非 0 + `UnregisteredHandwritten` |
| TC-059 | 差异 target 过 gate | 只做基线不做比对 = 假绿 | `Mismatch` / 干净树 exit 0 |
| TC-060 | 六类故障注入 | 参数校验缺一条 = 一条绕过路 | 对应错误码 + 字段非空 |
| TC-061 | 退出码档位错置 | 档位不定则 testcase 无法写死 | 0/1/2/3/4 全码表归属正确（21+10+6+1=38，exit 2 档 10 码含 UnsupportedKind） |
| TC-062 | agentData 存 description / 触发表字段 | 派生字段被当普通字段存；触发表字段双源（K 族） | 字段白名单拒绝（单一真相） |
| TC-063 | 拼装引入新词 | 拼装器自由发挥 | 派生断言拒绝 |
| TC-064 | when 缺前导连接词 | 逐字提取漏连接词 | 派生断言检出（与现 description 不符） |
| TC-065 | 草稿命名不含时间戳 / 同 name 多份 | 多次草稿不可区分；G 族每 name 至多一份 | 严格 `<name>--YYYYMMDD-HHMMSS.md` + 至多一份 |
| TC-066 | draft --kind rule | 以为 rule 也有草稿（NF-3） | `UnsupportedKind` exit 2 + 无草稿 |
| TC-067 | registered 态对象被逐字节比对 | 把未迁席当已巩固席 | 存在性检查 + 容忍红 |
| TC-068 | registered 席计入 ≤3 上限 | 收口计数口径错 | 不计入 |
| TC-069 | 有 registered 态仍摘别名 | 未迁席失去守卫载体 | 别名保留 |
| TC-070 | 未入队席数据随 gen-agents 删除丢失 | 数据源随退役丢失 | W8 前置迁入 registered 态 |
| TC-071 | P2 内设词表断言误拦转录常量 | Q 族裁决 + N3 残留裁决：P2 内词表无消费对象（13 席/senior-sdet/W5 新增 dc-translator 席全句式机械锁定；词表首次生效时点 = dc-translate 落地后） | 词表推迟至 dc-translate 落地后加席流程，W4/W5 均不设词表断言 |
| TC-072 | homedir 草稿被 ROOT 白名单误拦 | 草稿箱不属于 ROOT | 读取放行、写入仍受限 |
| TC-073 | 写入中断产生半写文件 | 中断写坏生成物不可逆 | 原子替换 + `WriteFailed` |
| TC-074（作废） | 同秒两次 draft 撞名 | 时间戳粒度秒 | spec 第 2 轮 §5.4 已定义：列冲突报错（断言升级见 TC-081） |
| TC-075 | 修 2 次仍红继续死磕 | 停损是过程纪律 | 停止 + 标停损未迁 |
| TC-076 | 环境/基线红计入停损 | 停损计数误判 | 不计入 |
| TC-077（作废） | registered 对象文件缺失 | spec §8.6 已定义错误码 | `DanglingBaselineEntry` exit 2（断言升级见 TC-082） |
| TC-078 | 六视角席 when 两两唯一（同构区分度） | 六席视角名不同 → when 天然不同，提取若吃掉视角名则同构塌缩 | 全 14 席通过 |
| TC-079 | 两席 when 完全相同 | 复制粘贴漏改视角名 | `DuplicateWhen` exit 1 |
| TC-080 | outputKind 枚举外值 | 新 kind 直接加进数据未登记枚举 | `InvalidOutputKind` exit 1 |
| TC-081 | 同秒撞名静默覆盖 | 秒粒度时间戳同秒覆盖丢版本 | 列冲突报错 + 首稿保留 |
| TC-082 | registered 文件缺失 gate 假绿 | 未入队席文件被误删/丢失 | `DanglingBaselineEntry` exit 2 |
| TC-083 | 测试污染真实草稿箱 | 测试跑完残留 / `draft rm` 误删真实草稿 | 零写入真实草稿箱（DOCGEN_DRAFTS_DIR 重定向，W 族） |
| TC-084 | triggerTable 已拆槽席 when 缺省/为空 | 触发表漏槽静默出货（P 族补的断言 14；Q-2-01：registered 未拆槽席豁免） | `MissingWhen` exit 1 |
| TC-085 | 已拆槽席每席 ≥1 when + registered 豁免（正例） | 拆槽管道误判 / 豁免失效（Q-2-01） | 全过 + 豁免 |
| TC-086 | fallback 未声明/声明 true 合法（正例） | 旧措辞「fallback ∈ 键集」与布尔说不符（B 族） | vacuous 合法；声明非法才报 |
| TC-087 | when 以「时」结尾 | 提取时把句式固定「时」当 when 内容（A 族） | `WhenFormatViolation` exit 1 |
| TC-088 | 派生 description 含「时时」连续字 | 新增席无黄金断言，机械断言是最后防线（A 族） | `DescriptionDerivation` exit 1 |
| TC-089 | registered 对象被逐字节比对（正例：豁免） | 无豁免则 S1 终态 generate 必红（D 族） | 跳过逐字节、容忍红、标注未巩固 |
| TC-090 | generate --name 不存在 | 调试期静默遍历全部（Y 族） | `MissingComponentData` exit 2 |
| TC-091 | draft rm --yes 删全部（正例：授权位在） | 授权位实现错 | 删全部成功 |
| TC-092 | 同源多目标 B 已落草稿（正例：放行） | 判别子把同源差异当无关漂移（F 族） | 放行 |
| TC-093 | 无草稿手改漂移 | 判别子缺「有草稿」条件就绕过 D6（F 族） | 拒红 + 草稿保留 |
| TC-094 | 已巩固对象文件缺失 | W 族裁决前的历史盲点 | `DanglingBaselineEntry` exit 2 |
| TC-095 | name 非法 regex（大写/下划线/空/超长） | regex 未承接旧 gen-agents 断言 1（X 族） | `InvalidName` exit 1 |
| TC-096 | sharedBlock 同引用枚举同值 + 无 sharedBlock 席不渲染（正例） | 加席复制漏改枚举名；节渲染条件错（X 族/N1） | 同值通过 + 不渲染 |
| TC-097 | 新增席 when 撞现有席（正例：两两不同） | 断言 10 联动失效（Y 族） | `DuplicateWhen` / 全不同通过 |
| TC-098 | 判据增删与渲染输出不同步 | renderBlocks 未数据驱动（E 族 V6③） | `Mismatch` / 同步增删通过 |
| TC-099 | generate --kind 缺省漏清单（正例） | 缺省语义误实现为只跑 rule（NF-2） | 两清单全遍历 |
| TC-100 | replace --kind rule | 以为 replace 支持非 agent kind（NF-3） | `UnsupportedKind` exit 2 |
| TC-101 | --name 含 /、..、\ 逃逸 | 逃逸字符绕过格式层直接进路径解析（NF-1） | `InvalidName` exit 1（格式层拦截） |
| TC-102 | registered 未拆槽席被 W4 派生断言误伤（正例：豁免） | when 未拆槽无法按句式拼装，字面「全 14 席」实现致 S1 终态 gate 必红（Q-3-NEW-1） | 豁免：registered 未拆槽席不触发 `DescriptionDerivation`（与断言 14 同口径） |

## 4 回归清单

| 如果改了 | 必须重跑 | 为什么 |
|---|---|---|
| `tools/docgen/components/agentData.mjs` | TC-002/003/014/015/016/039/046/062/063/064/071/080/084/085/086/095/096/097/102 | 组件数据是派生与校验的输入源（含 outputKind 字段，断言 11 的宿主；name/sharedBlock 断言 1/5 的宿主），改错一处全族断言联动 |
| `tools/docgen/components/triggerTable.mjs` | TC-015/016/047/048/049/064/078/079/084/085/086/097 | 触发表是 when/route/notWhen/fallback 断言的数据源（when 两两唯一断言 10、断言 14 MissingWhen 直指它） |
| `tools/docgen/components/patternRegistry.mjs` | TC-018/043/071/080/096 | 共享模式改动影响多目标（同源预期差异）与枚举断言（outputKind 枚举、sharedBlock 枚举住这里） |
| `tools/docgen/components/validateAgentData.mjs` | TC-014/039~049/061/078~080/084~088/095/096/097/102 | 14 条守卫断言全部住在该校验器（第 3 轮新增断言 14 MissingWhen 的宿主；W4 派生断言 registered 豁免 Q-3-NEW-1 的执行点） |
| `tools/docgen/components/specTestCaseGate.mjs`（P1 迁移） | TC-001/050~060/098 | 等价迁移表 V1–V11 的 rule 侧宿主（V6③ renderBlocks 数据驱动） |
| `tools/docgen/components/compare.mjs`（P1 迁移，E 族补落点） | TC-050/051/054/055/057/060/098 | `compareBuffers()` / `checkEnvironment()` / `assertTemplateClean()` / `withReadProbe()` 的函数级承载（V2/V2b/V6①/V6②/V8/V11） |
| `tools/docgen/templates/agent.md.tpl` | TC-040/055/014 | 13 席共用模板，占位符与硬编码断言直指它 |
| `tools/docgen/templates/agent-handwritten.md.tpl` | TC-016/040/055 | senior-sdet 专属模板 |
| `tools/docgen/cli.mjs`（draft/replace/gate 逻辑） | TC-004~012/017/024~035/067/069/072/073/081~094/099~101/102 | 六子命令语义 + 草稿箱生命周期（含同秒撞名保护、DOCGEN_DRAFTS_DIR 隔离、registered 豁免、拒红判别子、文件缺失码、--kind 缺省/校验、name→路径校验）全在这；gate 侧 W4 派生断言 registered 豁免（Q-3-NEW-1）出口在此 |
| `scripts/check-all.mjs` | TC-020/021/023/058 | R8 参数化与 gate 调用切换的对象 |
| `tools/docgen/cli.mjs` 退出码映射 | TC-061/026/028/029/033/034/035 | §7 五档映射的单一真相源 |
| 删 `gen-agents.mjs` / 更新 parliament 文档 | TC-021/020/070/069 | W8 退役 + 引用清理 + 未入队数据保全 |
| baseline 常量（两清单路径集） | TC-010/012/013/023/036/082 | 常量变化直接影响 N/N 与清单外断言；registered 登记项变化触发 DanglingBaselineEntry |
| `.gitignore` / 草稿箱路径配置 | TC-025/022 | 不进 git 与临时目录忽略断言 |

## 5 只手动验证

| 项 | 为什么机器验不了 | 谁验、看什么 |
|---|---|---|
| `draft ls` 时间戳列出的观感 | 机器只能断言语义（行数/过滤），「时间格式是否一眼可读」需人判断 | 评审人：看 `draft ls` 输出，时间戳是否清晰区分同 name 多次草稿 |
| parliament `SKILL.md` L15 与 `assembly-matrix.md` L31 改指 docgen 后的可读性 | 改指后「指令是否可读、是否悬空」是语义判断 | 评审人：读两处指令，确认读者能据此走 docgen 流程而非 gen-agents |
| 模板结构只含结构、不含业务原文的完整性 | 机器只查 3 段签名（TC-055），不能证明「没有别的原文」 | 评审人：对照 spec §5.2 与两模板抽查全文 |
| 停损流程执行（TC-075/076） | 停损是迁移期过程纪律，需真实迁移现场观察 | 迁移执行者 + 议会：核对「修 2 次仍红 → 停止」真实发生 |

## 6 不测（带理由）

| 不测什么 | 为什么 |
|---|---|
| 单席数据搬家（13 席逐个 ROLES 搬家 + senior-sdet 转录） | S2/S3/S4 各自的验收（W1/W2/W3）；S1 只提供能力地基 |
| 迁移期黄金断言「派生 description == 现文件 frontmatter 逐字相等」的现场执行 | spec §4.2 明确 S2 首次落 testcase、S4 复用；S1 只保证派生管线字节可复现（TC-015/016 覆盖机制） |
| description 翻译闭环（完形填空） | PRD §1.1 作用域声明：P2 内不执行不验收 |
| skill / rule 六骨架生成 | P3/P4 |
| 翻译质量三标准自评（详细/逻辑化/可测） | S3 覆盖（转录场景） |
| 触发表热更新 / 多语言 | PRD §2 边界 |
| 跨组件引用解析器 `comp:<Name>` | P1 决定只写不解析，沿用 |
| 未命中 any when 时真实路由的调度 | P2-8 断言 e 明确 P2 不断言（未来调度职责） |
| 九步闭环（6.2）的现场走查 | 每个 agent 的闭环执行是 S2/S3/S4 的验收动作（W1/W2/W3），S1 提供命令能力（TC-004/009/013 覆盖能力本身） |

## 7 缺口与判别力水位

| 缺口 | 漏检哪类反例 | 至少 1 个样例 | 语义由谁兜 |
|---|---|---|---|
| ~~registered 对象文件缺失的错误码未定义（TC-077）~~ **已解决**（spec 第 2 轮 §8.6 定义 `DanglingBaselineEntry`（exit 2）；第 3 轮 W 族补充已巩固对象文件缺失同码，专项 TC-094） | 未迁席/已巩固席文件被误删/丢失时 gate 假绿 | 删除 `agents/<未入队席>.md` 或 `agents/<已巩固席>.md` 后 gate 仍 exit 0 | spec §8.6 + TC-082/094 锁定断言 |
| ~~W4 禁用词表条目未定义（TC-071 只锁作用域）~~ **已解决**（spec 第 3 轮 Q 族裁决：P2 内 13 席 + senior-sdet 的 description 全被句式机械锁定，词表无消费对象——落地推迟至加席流程 dc-translate 的 fuzzy-word-scan.mjs，W4 不设词表断言） | 原：13 席派生产出含模糊词；现：加席时新增席派生产出含模糊词 | 新增席（dc-translator 及以后）description 出现「大概率 / 基本」类模糊词但词表未生效 | spec §8.1 Q 族裁决 + TC-071 新判据（无词表断言）；dc-translate（加席流程）阶段落地词表 |
| ~~草稿箱测试隔离机制未定义~~ **已解决**（spec 第 2 轮 §5.4 沿用 P1 `DOCGEN_TEST_MODE` 重定向；第 3 轮 W 族补 `DOCGEN_DRAFTS_DIR` 承担草稿箱维度） | 测试污染真实 homedir 草稿箱（draft rm 删全部误删真实草稿） | 跑完测试后 `~/.retro-skills/docgen-drafts/` 残留测试数据 | spec §5.4 + TC-083 断言隔离生效（DOCGEN_DRAFTS_DIR） |
| ~~同秒两次 draft 撞名（TC-074）~~ **已解决**（spec 第 2 轮 §5.4 定义列冲突报错） | 秒粒度时间戳同秒覆盖 | 同一秒内两次 draft 产生同文件名 | spec §5.4 + TC-081 锁定断言（冲突提示 + 首稿保留） |
| 停损（R15）是过程纪律非可测行为 | 修 2 次仍红继续死磕（无机器断言） | 迁移期某红项第 3 次修复仍红但继续 | 迁移执行者 + 议会评审；PRD §6.6 账本状态字段兜底 |
| **判别力样例（假阳性）** | 词表误拦转录常量 | 13 席 identity 现含「经验直觉」属转录常量，若 P2 内实现词表断言则被误拦 → 假阳性 | TC-071 新判据（P2 内无词表断言，推迟至加席流程）；评审对照 Q 族裁决 |
| **判别力样例（假阴性）** | 迁移期「gate 连续 2 次绿」空转绿 | 守卫迁移与 check-all 参数化不同批：spike gate 不含 agent 重建比对，试点席「巩固」判据无 agent 内容而空转 | TC-020 断言「同批」+ TC-037 断言「篡改 agent 必红」锁住；BE-3-02 |
| `--draft` 指向 agents/ 内已生成文件自身 | 读取侧不受白名单约束时，把生成视图当草稿重放（字节校验一致则无变化，安全但语义边界模糊） | `--draft agents/reviewer-audit.md`（草稿 == 渲染则静默替换为自身） | 实现按 R5 语义（读取放行、写入受限）；评审确认该场景无害 |

## 8 给开发的建议（spec 第 3 轮修复同步中发现）

| # | 位置（spec 节号） | 风险或盲点 | 为什么会被忽略 | 具体改法 | 优先级 |
|---|---|---|---|---|---|
| 1 | spec §4.1（agentData 形状注释） vs §6 断言 11 | outputKind 注释枚举 3 值（issue-card / observation / audit）与断言 11 枚举 4 值（含 testcase）口径不一致 | §4.1 注释只列「当前在用的值」，§6-11 定义「合法全集」；两处都合理但读者会以为冲突 | **已解决**：spec 第 2 轮已把 §4.1 注释改为四值集（含 testcase），与 §6-11 同口径 | P2（已落地） |
| 2 | spec §5.4 / §7 | 同秒撞名保护只定义行为（列冲突报错），未定义退出码与错误码 | spec 聚焦行为不聚焦码；但 §9-8 硬约束「任何新错误码必须先落映射表」，实现时必然要定 | **已解决**：spec 第 2 轮已定 `DraftNameConflict`（exit 1，数据校验缺陷档），§7 表已登记；TC-081 判据已加严为 exit 1 + `DraftNameConflict` | P1（已落地） |
| 3 | spec §8.6 | 已巩固对象文件缺失的错误码未显式定义（只写了 registered 态） | §8.6 因 P2-遗 议题只写未入队席；已巩固席文件缺失同样属 baseline 悬空，但 spec 未点名 | **已解决**：spec 第 3 轮 W 族裁决已补 §8.6「已巩固对象文件缺失同属 baseline 清单内有、文件不存在，与 registered 同口径报 `DanglingBaselineEntry`（exit 2）」；TC-094 专项锁定断言 | P3（已落地） |
| 4 | spec §5.2（generate） vs §5.2（replace） | `generate --name <不存在>` 的语义原 spec 只写「报错」，未点名错误码；`replace` 侧已有 `MissingComponentData` | generate 是纯检查命令，施工者可能随手报 `InvalidName` 或直接遍历全量；两侧错误族不一致会导致 testcase 无法写死 | **已解决**：spec 第 3 轮 Y 族裁决已补「generate --name <不存在> → `MissingComponentData`（exit 2）」；TC-090 锁定断言 | P2（已落地） |
| 5 | spec §4.2「gate 机械断言…对全部 14 席 + 未来加席生效」（L143） vs §4.2 Q-3-NEW-1（L144） | 「全 14 席」字面与「registered 未拆槽席豁免」并存，实现者按字面「全 14 席」写循环会把 registered 未拆槽席拖进 W4 派生断言 → S1 终态 gate 必红（when 未拆槽无法拼装） | 两段同节、裁决不同步，读者先看到「全 14 席」后看到豁免，容易漏第二段 | 实现 W4 派生断言（§6-8）时按**已拆槽席**粒度遍历，registered 未拆槽席走豁免分支（不抛 `DescriptionDerivation`）；与断言 14（MissingWhen）共用同一「已拆槽」判定 | P0 |
| 6 | spec §5.1 Q3-F2「gate 无独立注入参数」 | 施工者沿用 P1 习惯给 gate 顺手加 `--target/--fixture` 类注入参数，违反裁决；V10/V10b 的故障注入会误挂在 gate 上 | gate 继承 P1 spike 入口的 flag 惯性；「无注入参数」是新裁决，容易按旧习惯实现 | gate 不接受任何注入参数（只读仓库真文件）；V10 新增规则注入 = 创建真实 rules/ 文件、V10b 差异 target 注入 = `generate --kind rule --name <目标> --target <副本>`；TC-058/059 判据按此执行 | P1 |
