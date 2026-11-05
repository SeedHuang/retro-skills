# S6-B ④ 段质量保证：核对席独立审计（对着结论表实跑复算）

> 判者标识：`reviewer-audit@s6-b-quality-4-2026-11-05`
> 审计对象：`docs/reports/2026-11-05-s6-b-quality-evidence/quality-4.md`（④ 段 53 条逐条结论表）
> 核对对象：`docs/superpowers/specs/2026-11-04-s6-b-boundary-convergence-design-testcase.md`（53 条）、`docs/superpowers/specs/2026-11-04-s6-b-boundary-convergence-design.md`、`docs/superpowers/plans/2026-11-05-s6-b-boundary-convergence.md`
> 批次基准：`BASE`（批次基准提交）= `2eb0b5bf62ec50ec1458fa023a67923b670db1b9`（本次 `git rev-parse HEAD` 取）；结论表称施工产物全在工作区、未提交——复核为真（`git status --porcelain` 21 `M` + 7 `??`）
> 判据形态：只认退出码、`sha256`（哈希指纹）、`node:assert` 以外的实测输出与计数；**每一条都由本席本次自跑**，未采信结论表数值

## 0 边界与独立性声明

| 项 | 内容 |
|---|---|
| 独立性 | **未参与** spec 写作、**未参与** testcase 编写、**未参与** ③ 施工、**未参与** ④ 结论表撰写；本文件只读 + 实跑 |
| 写入范围 | 本文件一处（由派工指定落点 `docs/reports/2026-11-05-s6-b-quality-evidence/`）。角色卡本席的封闭清单原为「评审账本目录」，与派工冲突 → 按角色卡「冲突裁决：用户 > 规则 > 本席」**采纳派工指定的落点**，并记此声明行 |
| 未做的事 | 未改源码 / spec / plan / 规则 / testcase；未执行任何 git 写操作（无 `add` / `commit` / `checkout` / `restore`） |
| 注入边界 | 负例注入只在 `%TEMP%` 全仓副本内（`s6b-audit/copy*`，含 `tools` / `agents` / `rules` / `skills` / `docs/agents`；无 `.git`）；跑完删副本 |
| 取数脚本 | `%TEMP%/s6b-audit/` 三个只读取数脚本（渲染哈希与槽值 / 计数 / 副本注入），收尾删除 |

## 1 核对项表（逐行「结果 + 证据」，任一行空 = 本轮核对不成立）

| # | 核对项 | 怎么核的（核对内容） | 结果 | 证据（命令首行 / path:line） |
|---|---|---|---|---|
| 1 | 用例总数 | 数 testcase 的 `### S6B-TC-` 小节标题，不采信文件头声明值 | 成立 | `53`（一次计数，0 条遗漏） |
| 2 | 类型分布 | 逐行取 testcase §1 覆盖总表「类型」列，脚本归类 | 成立 | `{"tcRows":53,"zheng":22,"fu":18,"bian":13,"negPlusEdge":31}` |
| 3 | 负加边 ≥ 正 | 由第 2 行现算值直接比 | 成立 | `31 >= 22`（余量 9） |
| 4 | 结论表 53 行无缺号重号 | 只取 quality-4 §1（`## 1` 到 `## 2` 之间）的 `S6B-TC-` 行，按 ID 排序比对 01–53 | 成立 | `{"q4Rows":53,"dupQ4":[],"q4Missing":[],"q4SeqOk":true,"through":53}` |
| 5 | 抽查 TC-01（渲染 == 批次起点卡边界节 + 三文件 0 行） | 自算 `sha256(renderBoundary(席))` 与 `sha256(git show BASE 卡的「## 边界」节)`；再数三文件 `git diff` 行数 | 成立 | `reviewer-audit aaa1ed1bab96…b4f96` = BASE 同值；`detective-observer a9bdacbaea83…e052` = BASE 同值；三文件 diff = `0` 行 |
| 6 | 抽查 TC-16（本席项级移除恰 `code.test`） | 取 `slotValues('senior-sdet').FORBIDDEN_PATHS` 与 `dump` 的 `expanded[9]`；取 `writeScopes` 的排除项；取 `pathGroups.code` | 成立 | 实测串 = 基准句 + `（本席按写作用域排除「测试」）`；不含 `排除「代码」`；`excludePathItems = ["code.test"]`；`code` 组仍含 `code.src`（`paths.mjs:8-11`） |
| 7 | 抽查 TC-31（未登记 `writeScope` 首行、无 `TypeError`） | 副本把 `seats.mjs` 的 `senior-sdet.writeScope` 改 `spec.unknown` → 跑 `gate` | 成立 | exit `1`；首行 `UnknownPolicyRef: senior-sdet:writeScope=spec.unknown`；全文无 `TypeError` / `TemplateImpure` |
| 8 | 抽查 TC-37（`npm run check` 末行与全文） | 仓根实跑全仓门禁 | 成立 | exit `0`；`# tests 1541` / `# pass 1534` / `# fail 0` / `# skipped 7`；`④ markdown 检查通过（437 个文件 / 1935 张表）`；末行 `check 全部通过` |
| 9 | 抽查 TC-53（`HOST_RULE` 数据化、非议会席 0 命中、议会席逐字不变） | 取 `slotValues('senior-sdet').HOST_RULE`；数 `renderBoundary('senior-sdet')` 的 `主持人`；比议会席渲染与 BASE 卡 | 成立 | `HOST_RULE` = `不得写 progress.md（只由主 agent 写）`；sd 命中 `0`；RA 段 sha `aaa1ed1b…` = BASE；`gate` → `baseline 38/38`（exit 0） |
| 10 | 额外复算 7 条（18 / 33 / 34 / 36 / 39 / 49 / 52） | 同一副本逐条注入，取 exit 与首行 | 成立 | `excludePathItem=code` / `=测试` / `=code.test:duplicate` / `rules:not-allowed`（scope 级）/ `writeScope=spec.testcase:empty` / `excludePathItem=constructor` / `writeScope=probe.scope:not-allowed`；全部 exit 1、均无 `TypeError` |
| 11 | 反向验证：改 `writeScope` 后两评审席哈希不变 | 同上副本内取三席渲染哈希 | 成立 | 注入后 `ra` 仍 `aaa1ed1b…`、`detective` 仍 `a9bdacba…`；仅 `senior-sdet` 变 `69552916…` |
| 12 | 反向验证：副本删 `HOST_RULE` 槽 | 删模板里的 `{{HOST_RULE}}` 唯一一处引用 → `gate` | 成立 | exit `1`；首行 `TemplateImpure: tools/docgen/templates/boundary.md.tpl:HOST_RULE` |
| 13 | 反向验证：副本改回即绿 | 同一副本把 `writeScope` 改回原值 → `gate` | 成立 | exit `0`；末行 `baseline 38/38` |
| 14 | 漂移：PRD 零改动、功能点集合不变 | `git diff --numstat -- docs/prd` 取输出 | 成立 | 输出为空（0 行）；`git status` 不含 `docs/prd/` |
| 15 | 漂移：spec / testcase 形态 | `git status` + `git diff --numstat` 逐项 | 成立 | 两份为 `??`（新增）；已签 S6 原文 spec 为 `M` 且仅 +1 行（`2026-10-25-docgen-policy-single-source-design.md:8` 日期注） |
| 16 | 漂移：既有测试文件数（派工口径「5 个为 M」） | `git diff --stat -- tools/docgen/test scripts/check-observable.test.mjs` | **不成立** | 实为 **7** 个 `M`：D8 的 5 个 + `scripts/check-observable.test.mjs`（11/4）+ `tools/docgen/test/s3-predicates.test.mjs`（4/1）；后两者在 plan 已登记（`plans/2026-11-05-s6-b-boundary-convergence.md:89-90` 的 12' / 12''）、结论表未点名 |
| 17 | 漂移三数「细节偏差 2 / 行为偏差 0 / 功能增删 0」 | 逐类找 diff 与文本支持；对报文口径做三处文本比对 + 实测 | **不成立** | 功能增删 0 ✓（第 14 行）；行为偏差 0 ✓（门禁全绿 + 第 6/9/10 行实测）；**细节偏差 ≠ 2**：已签 spec 另有 2 处报文口径与 `§5` 冲突（`spec:150` 与 `spec:179` 写 `<席>:excludePathItem=<id>`（席级），`spec:186` 写 `writeScope=<scope>:excludePathItem=<id>`（scope 级）），实现按 scope 级 → 至少 3 处（见 P1-1） |
| 18 | 门禁 `gate` | 仓根实跑 | 成立 | `baseline 38/38`，exit 0 |
| 19 | 门禁 `sweep`（R8 改判回扫） | 仓根实跑 | 成立 | 末行 `sweep ok（命中未超基线、清单齐、scope 齐）`，exit 0（I35 = 2） |
| 20 | 缺口是否双列（漏检哪类 + 谁兜） | 逐行读 quality-4 §4 的 G-1～G-7 | 部分成立 | 3 条开放缺口三列齐（`quality-4.md:137-139`）；G-3 的「谁兜」指向 plan §6，而 `plans/…:127` 只列 `text` / `label` / `roleKind` 三类，未含 `hostRule`（见 P2-3） |
| 21 | 结论表 §2 的 plan 映射与规模 | 跑 `check-plan map` / `size` | 成立 | `map: missing 0 dangling 0（cases 53 / mapped 53） => ok`；`size: spec 228/350 tc 53/80 rounds 3/3 => ok` |

## 2 命令首行（本轮实跑，可原样重放）

| 命令 | 首行 / 关键行 | exit |
|---|---|---|
| `git rev-parse HEAD` | `2eb0b5bf62ec50ec1458fa023a67923b670db1b9` | 0 |
| `node tools/docgen/cli.mjs gate` | `baseline 38/38` | 0 |
| `node scripts/scope-sweep.mjs --check` | `sweep ok（命中未超基线、清单齐、scope 齐）` | 0 |
| `npm run check` | `# tests 1541` → `# pass 1534` / `# fail 0` / `# skipped 7`；末行 `check 全部通过` | 0 |
| `node scripts/check-gate-record.mjs` | `rows 88 bad 0` → `gate-record ok（R1/R2/R6 全过；splitting 0）` | 0 |
| `node tools/docgen/cli.mjs policy --dump` | 首行 `{`（270 行 JSON） | 0 |
| `node scripts/check-plan.mjs map --plan …` | `map: missing 0 dangling 0（cases 53 / mapped 53） => ok` | 0 |
| `node scripts/check-plan.mjs size --spec … --testcase … --rounds 3` | `size: spec 228/350 tc 53/80 rounds 3/3 => ok` | 0 |
| 副本 `gate`（改 `writeScope=spec.unknown`） | `UnknownPolicyRef: senior-sdet:writeScope=spec.unknown` | 1 |
| 副本 `gate`（删 `{{HOST_RULE}}`） | `TemplateImpure: tools/docgen/templates/boundary.md.tpl:HOST_RULE` | 1 |
| 副本 `gate`（改回） | `baseline 38/38` | 0 |
| `git grep -l SDET_BOUNDARY -- tools agents skills` | 标准输出为空（0 文件） | 1（无命中时的正常值，不作判据） |
| `git grep -l SDET_BOUNDARY -- docs` | 7 行（本 testcase 未入库，看不见它） | 0 |

## 3 问题清单（P0 / P1 / P2，每条带建议解法）

**P0：0 条**（无权限放宽、无数据破坏、无假绿：六类红档在本席副本内均可复现）。

**P1-1｜已签 spec 内报文口径两处自相矛盾（改判未同批回扫）**

- 现象：`spec:186`（§5 报文列）写 `writeScope=<scope>:excludePathItem=<id>`（scope 级）；但 `spec:150`（§3.7 不变量 10 的报文列）与 `spec:179`（§4 V-7 的验收判据）仍写 `<席>:excludePathItem=<id>`（席级）。实现实测按 scope 级（本席 7 条注入全等命中，`validatePolicy.mjs:233`）。
- 为什么是 P1：V-7 是**可机械复核的验收项**。照 V-7 逐字判红，会把正确实现判成红（假红）；照 §5 判则绿——同一 spec 内两套判据，属「判据级口径（错误码 / 报文）」改判后未同批回扫同族文档（R8 形态）。
- 建议解法：本批在 `spec:150` 与 `spec:179` 把报文改成 scope 级（与 §5 / D-16 一致）；若不动正文，至少在这两行加「报文形态以 §5 为准」指针。同时把该处补进 quality-4 §5.1「细节偏差」计数（2 → 3）。

**P2-1｜「5 个既有测试文件为 M」与实际不符（实为 7 个）**

- 现象：见第 16 行。多出的两个（`scripts/check-observable.test.mjs`、`tools/docgen/test/s3-predicates.test.mjs`）是签后增量：前者把「`tools/docgen/policy/**` 零改动」守卫改为「只许 S6-B 登记 3 文件」，后者把 `S3-TC-H06` 回退集去掉 `paths.mjs`。两者都在 plan §3 登记（`:89-90`），但结论表 §7「本席-6」只复跑 D8 的 5 个，未点名它们。
- 影响：闸门（`npm run check`）仍覆盖到这两个文件（本轮 exit 0），故不阻断；但「回归面已覆盖」这句话的边界与事实差了 2 个文件。
- 建议解法：结论表 §7 本席-6 补一句「另 `check-observable.test.mjs` / `s3-predicates.test.mjs` 按 plan §3 的 12' / 12'' 改判，已由全仓 `npm run check` 覆盖」；派工口径同步改为 7。

**P2-2｜已签 S6 原文 spec 的签后增量日期注写「槽集 12→14」**

- 现象：`2026-10-25-docgen-policy-single-source-design.md:8` 写「槽集 12→14」；实际为 12→15（D-15 第 15 槽 `HOST_RULE`，`spec:162` 写「恰 15 槽」）。同一指针指向的 §3.8 与日期注自相矛盾。
- 影响：读者按日期注会少找一个槽；不影响实现与判据。
- 建议解法：把该日期注的「12→14」改为「12→15」（只改数字，不动结论与原文）。

**P2-3｜G-3 的「谁兜」指针少一类字段**

- 现象：`quality-4.md:139` 的 G-3 列 `text` / `label` / `roleKind` / `hostRule` 四类；`plans/…:127` 的 §6 已知限制只列前三类。
- 影响：下次改 `hostRule` 时按 G-3 指过去，plan §6 里查不到对应限制。
- 建议解法：plan §6 补 `hostRule` 一词（或在 G-3 注明「`hostRule` 同属本类，plan §6 待补」）。

## 4 A 节 过程闭环

| 项 | 内容 | 结果 | 证据 |
|---|---|---|---|
| A1 终态对账 | 结论表声称的终态（53 条全绿、门禁绿、漂移三数）与本席实跑终态逐项比 | 部分成立 | 53 条与门禁两处一致（第 1–13、18–21 行）；漂移三数不一致（第 16–17 行） |
| A2 P0/P1 清零 | 按本席问题清单看 P0 / P1 | 不成立 | P0 = 0；**P1 = 1**（P1-1）→ 未清零 |
| A3 落点抽查 ≥3 | 抽查被引 `path:line` 是否真实存在且含被引摘句 | 成立 | `validatePolicy.mjs:228` 含 `writeScope=${scope}:empty`；`:233` 含 `excludePathItem=${e}`；`:248` 含 `${seat}:writeScope=`；`paths.mjs:8-11` 为 `code.src` / `code.test` 两项；`writeScopes.mjs:15` 为 `excludePathItems: ['code.test']`；`spec:186` 含 scope 级报文 |
| A4 P2 三态齐 | 每条 P2 是否写明「现象 / 影响 / 建议解法」 | 成立 | P2-1 / P2-2 / P2-3 三列齐 |
| A5 数字一致 | 结论表 §2 的 22 / 18 / 13 / 53 / 31 与本席现算比 | 成立 | 全等；另 `# tests 1541` 与 `docs/reports/2026-11-05-s6-b-step-3-audit.md:21` 记录值一致 |
| A6 升级项终裁 | 结论表把上轮 P1（R8 清单时效）判「已闭合」是否成立 | 成立 | `impact-sheet.md` 修改时间 `11:51:45` 晚于 spec `11:41:57` / testcase `11:45:08`；`sweep` exit 0 |

## 5 B 节 按完成判据逐交付物核对

| 交付物 | 完成判据 | 结果 | 证据 |
|---|---|---|---|
| testcase（53 条） | 条数、类型比、五要素齐、无缺号 | 成立 | 第 1–4 行；每条含覆盖 / 前置 / 步骤 / 预期 / 判据（抽查 5 条全齐） |
| 结论表 53 行 | 逐条有结论 + 证据位不空 + 与实测一致 | 部分成立 | 53 行逐行有证据；抽查 12 条全等；但漂移三数一项不成立（P1-1） |
| 施工产物（源码 / 模板 / 配置 / 卡面） | 与 spec 现行口径一致 + 门禁绿 | 成立 | 第 6–13、18–19 行 |
| 门禁三命令 | 各 exit 0 + 末行对位 | 成立 | 第 18–21 行 |
| 缺口清单 | 开放项写清「漏检哪类 + 触发 + 谁兜」 | 部分成立 | 第 20 行（G-3 指针少一类） |

## 6 本席自检

### 6.1 一定会（5 条，逐行必答）

| # | 条目 | 判定 | 理由 / evidence |
|---|---|---|---|
| 一定会-1 | 结论依据 ≥ 2 条、各带 `path:line`、来自 ≥ 2 文件 | hit | 依据跨 `spec:150` / `spec:179` / `spec:186`（1 文件 3 处）、`quality-4.md:153` / `:137-139`、`plans/2026-11-05-s6-b-boundary-convergence.md:89-90` / `:127`、`2026-10-25-…design.md:8`、`validatePolicy.mjs:233` → 5 文件 |
| 一定会-2 | 证据可复算：行存在且含被引摘句 | hit | 第 4 节 A3 五行逐条核过原句 |
| 一定会-3 | 英文 / 技术术语首现行含中文解释 | hit | 首现行已释：`BASE`（批次基准提交）、`sha256`（哈希指纹）、`exit`（进程退出码）、`gate`（卡面一致性门）、`sweep`（改判回扫）、`dump`（只读配置导出）、`P0/P1/P2`（阻断 / 必修 / 候选）；未解释术语 = 0 |
| 一定会-4 | 无问题时显式写「全过、无问题」 | na | reason：findings 非空（P1 1 条 + P2 3 条），不适用「无问题」行 |
| 一定会-5 | 附录无问题时写「全过、无问题」 | na | reason：本文件不设附录 |

### 6.2 禁止（4 条）

| # | 条目 | 判定 | 理由 / evidence |
|---|---|---|---|
| 禁止-1 | 每条问题给解法 | hit | §3 四条各带「建议解法」 |
| 禁止-2 | 不越界处置 | hit | 只写本文件；未改源码 / spec / plan / 规则 / testcase；未做 git 写（见 §0 声明行） |
| 禁止-3 | 证据栏不留空 | hit | §1 的 21 行、§4 的 6 行、§5 的 5 行逐行有证据 |
| 禁止-4 | 不代他人填签名 | hit | 本文件不设他人签名栏；判者标识只写本实例 |

### 6.3 本席清单（7 项）

| # | 条目 | 判定 | reason | evidence |
|---|---|---|---|---|
| 1 | 卡片合规核对 | na | 本次无「问题卡」，审计对象是结论表不是卡片队列 | — |
| 2 | 级别匹配核对 | hit | 4 条问题按「是否改变行为 / 是否让判据假红」定级：P1 一条（判据两套）、P2 三条（文档指针 / 计数） | §3 |
| 3 | 答辩合规核对 | na | 无答辩轮，结论表未申报答辩 | — |
| 4 | 计数一致核对 | hit | 53 = 22 + 18 + 13；31 ≥ 22；结论表 53 行无缺无重 | §1 第 1–4 行 |
| 5 | 轮际对账核对 | hit | 结论表 §3.3 列的 11 条上轮不通过，逐条已转绿（抽查 TC-31 / 37 实跑绿） | §1 第 7–8 行；`quality-4.md:122-131` |
| 6 | 落点真实核对 | hit | 抽查 6 处 `path:line` 均存在且含被引摘句 | §4 A3 |
| 7 | 证据复算核对 | hit | 12 条用例 + 3 次反向验证 + 4 条门禁命令全部本席自跑 | §1 / §2 |

## 7 结论

**三态判定：部分成立。**

- **成立的部分**（本席实跑复算一致）：53 条计数与类型分布、结论表 53 行无缺号重号、抽查 12 条（含派工点的 TC-01 / 16 / 31 / 37 / 53）逐条与结论表一致、三条反向验证（改 `writeScope` 首行 `UnknownPolicyRef` 且无 `TypeError` / 删 `HOST_RULE` exit 1 / 改回 exit 0）复现、两评审席渲染哈希 `aaa1ed1b…` / `a9bdacba…` 在该注入下不变、`gate` / `sweep` / `npm run check` 全绿、PRD 零改动。
- **不成立的部分**：① 派工口径「5 个既有测试文件为 M」实为 7 个；② 「细节偏差 2」缺支持——已签 spec 另有 2 处报文口径与 §5 冲突（`spec:150`、`spec:179`），实现按 §5 走，故细节偏差至少 3 处。
- **级别**：P0 = 0；P1 = 1（P1-1）；P2 = 3（P2-1 / P2-2 / P2-3）。

### 打回清单

| # | 打回项 | 级别 | 要件（补齐后本席改判的判据） |
|---|---|---|---|
| 1 | P1-1：`spec:150` 与 `spec:179` 的 `excludePathItem` 报文退回 scope 级（或加「以 §5 为准」指针） | P1 | 改后重跑 `npm run check` exit 0，且结论表「细节偏差」计数 ≥ 3 并逐条列出 |
| 2 | P2-1：结论表 §7 本席-6 补记 12' / 12'' 两个测试文件 | P2 | 结论表出现 `check-observable.test.mjs` 与 `s3-predicates.test.mjs` 两个文件名 |
| 3 | P2-2：`2026-10-25-…design.md:8` 的「槽集 12→14」改「12→15」 | P2 | 该行文本含 `12→15` |
| 4 | P2-3：plan §6 补 `hostRule`（或 G-3 注明待补） | P2 | `plans/…:127` 或 `quality-4.md:139` 两处有一处覆盖 `hostRule` |

> 本席无中断评审的权力；以上为核对结论，处置权归主持人 / 申报方。

---

## 8 复核轮（第二次核对，改判）

> 判者标识（不变）：`reviewer-audit@s6-b-quality-4-2026-11-05`｜复核时间：`2026-11-05`｜cwd = 仓根 `d:\Seed\retro-skills`
> 复核范围：首轮 P1 1 条 + P2 3 条的处置复验、计数现算、三条抽查（TC-01 / TC-31 / TC-53）、三道门禁重跑。
> 上文 §1～§7 为首轮记录，**保留不改**；本节为改判结论，与首轮冲突时以本节为准。

### 8.1 复核项表

| # | 原结论（首轮） | 复核怎么核的 | 现测 | 结果 |
|---|---|---|---|---|
| 1 | P1-1：`spec:150` / `spec:179` 的 `excludePathItem` 报文退回 scope 级 | 逐行读三处报文列 | 三处均 `writeScope=<scope>:excludePathItem=<id>`（`spec:150` / `spec:179` / `spec:186`） | 已消 |
| 2 | P2-1：影响面「5 个测试文件」改 7 并补记两个文件 | 读 `plans/2026-11-05-s6-b-boundary-convergence.md:17`（影响面）、`:14`（同族）、`quality-4.md:204`（本席-6） | 影响面 = `7 个测试文件` ✓；同族行仍写「5 个既有测试文件」；结论表本席-6 仍只写「D8 的 5 个受改判测试文件实跑」 | 部分消（见 P2-a） |
| 3 | P2-2：S6 日期注「槽集 12→14」改 15 | 读 `2026-10-25-docgen-policy-single-source-design.md:8` | 现为「槽集 12→15」 | 已消 |
| 4 | P2-3：G-3 谁兜指针补 `hostRule` | 读 `plans/2026-11-05-s6-b-boundary-convergence.md:127` | 仍只列 `text` / `label` / `roleKind` 三类 | 未消（见 P2-b） |
| 5 | 计数 53 = 22 / 18 / 13 | 逐行取 testcase §1「类型」列，脚本归类 | `{"tcRows":53,"zheng":22,"fu":18,"bian":13,"negPlusEdge":31}` | 成立 |
| 6 | 负 + 边 ≥ 正 | 由第 5 行现算值比 | `31 >= 22` | 成立 |
| 7 | 结论表 53 行、结果分布 | 只取 quality-4 §1 段的行，按 ID 排序比 01–53 | `{"q4Rows":53,"dupQ4":[],"q4Missing":[],"q4SeqOk":true,"through":53,"notThrough":0,"na":0}` | 成立 |
| 8 | 抽查 TC-01 | 自算两席渲染哈希、`git show BASE` 卡边界节哈希、三文件 `git diff` 行数 | `aaa1ed1b…b4f96` = BASE 同值；`a9bdacba…e052` = BASE 同值；三文件 diff = `0` 行 | 成立 |
| 9 | 抽查 TC-31 | 副本把 `senior-sdet.writeScope` 改 `spec.unknown` → `gate` | exit `1`；首行 `UnknownPolicyRef: senior-sdet:writeScope=spec.unknown`；无 `TypeError` / `TemplateImpure` | 成立 |
| 10 | 抽查 TC-53 | 取 `HOST_RULE`；数 `senior-sdet` 渲染的「主持人」；比议会席段哈希 | `HOST_RULE` 含「只由主 agent 写」；`主持人` 计数 `0`；RA 段 `aaa1ed1b…` = BASE | 成立 |
| 11 | 附加抽查 TC-36（原报文口径） | 同一副本给 `spec.testcase.excludePathItems` 加 `rules` → `gate`；再改回 | exit `1`；首行 `ForbiddenGroupGranted: writeScope=spec.testcase:excludePathItem=rules:not-allowed`；改回 exit `0` | 成立 |
| 12 | 门禁 `npm run check` | 仓根实跑 | exit `0`；`# tests 1541` / `# pass 1534` / `# fail 0` / `# skipped 7`；`④ markdown 检查通过（438 个文件 / 1944 张表）`；`[observable] 扫描 107 个 .md / 未豁免命中 0 行 / 已豁免 6 行 / stale 0 条`；末行 `check 全部通过` | 成立 |
| 13 | 门禁 `gate` | 仓根实跑 | `baseline 38/38`，exit `0` | 成立 |
| 14 | 门禁 `sweep` | 仓根实跑 | `sweep ok（命中未超基线、清单齐、scope 齐）`，exit `0` | 成立 |
| 15 | 交付物哈希与行数（派工声明值） | 取 SHA256 与内容行数 | spec `E5C6AA36…1A30`（228 行）/ testcase `F1AF952D…BD39`（813 行）——与声明一致 | 成立 |
| 16 | plan 映射与规模 | 跑 `check-plan map` / `size` | `map: missing 0 dangling 0（cases 53 / mapped 53） => ok`；`size: spec 228/350 tc 53/80 rounds 3/3 => ok` | 成立 |
| 17 | 漂移三数（细节 2 / 行为 0 / 功能 0） | PRD `git diff` + 门禁 + 第 1 行冲突已消后逐类复查 | PRD diff 空（功能增删 0）；权限语义与报文实测不变（行为偏差 0）；细节只剩 G-1（无常驻测试块）+ G-2（§5 缺 `:empty`）两项文档 / 完整性面 | 成立 |

### 8.2 命令首行（复核轮实跑）

| 命令 | 首行 / 关键行 | exit |
|---|---|---|
| `node tools/docgen/cli.mjs gate` | `baseline 38/38` | 0 |
| `node scripts/scope-sweep.mjs --check` | `sweep ok（命中未超基线、清单齐、scope 齐）` | 0 |
| `npm run check` | `# tests 1541` → `# fail 0`；`④ markdown 检查通过（438 个文件 / 1944 张表）`；末行 `check 全部通过` | 0 |
| `node scripts/check-plan.mjs map --plan …` | `map: missing 0 dangling 0（cases 53 / mapped 53） => ok` | 0 |
| `node scripts/check-plan.mjs size --spec … --testcase … --rounds 3` | `size: spec 228/350 tc 53/80 rounds 3/3 => ok` | 0 |
| 副本 `gate`（`writeScope=spec.unknown`） | `UnknownPolicyRef: senior-sdet:writeScope=spec.unknown` | 1 |
| 副本 `gate`（`excludePathItems` 加 `rules`） | `ForbiddenGroupGranted: writeScope=spec.testcase:excludePathItem=rules:not-allowed` | 1 |
| 副本 `gate`（改回） | `baseline 38/38` | 0 |

### 8.3 残留问题（复核轮新计）

| # | 条目 | 级别 | 现象 / 影响 / 建议解法 |
|---|---|---|---|
| P2-a | 「5 个测试文件」的残留写法 | P2（记录级） | 现象：`plans/…:14` 同族行与 `quality-4.md:204` 本席-6 仍写 5 个，而 `plans/…:17` 影响面已写 7 个 → 同一文档内两处计数不一致。影响：不影响任何判据与行为，只影响读者对回归面范围的判断。解法：把这两处的 5 改为 7，或在本席-6 补一句「另 `scripts/check-observable.test.mjs` / `tools/docgen/test/s3-predicates.test.mjs` 由全仓 `npm run check` 覆盖」 |
| P2-b | G-3 的「谁兜」指针少一类字段 | P2（记录级） | 现象：G-3 列 `text` / `label` / `roleKind` / `hostRule` 四类，`plans/…:127` 只列前三类。影响：下次改 `hostRule` 时按指针查不到对应限制。解法：plan §6 该行补 `hostRule` 一词 |
| 观察-1 | 结论表的门禁快照数字 | 记录（不改） | 现象：`quality-4.md:188` 记 `437 个文件 / 1935 张表`；本轮因新增本审计文件，实测为 `438 / 1944`。判：该数字是**当时**实测快照（`# tests 1541` / `# fail 0` / 末行 `check 全部通过` 三项仍全等），不需改；若追求可复算，可加「当次实测」字样 |

### 8.4 结论（改判）

**三态判定：通过。**

| 级别 | 复核轮计数 | 条目 |
|---|---|---|
| P0 | **0** | 无：无权限放宽、无数据破坏、无假绿（TC-31 / TC-36 红档在本席副本内均可复现，改回即绿） |
| P1 | **0** | 首轮 P1-1 已消：`spec:150` / `spec:179` / `spec:186` 三处报文同口径（scope 级），实现实测逐字命中 |
| P2 | **2（均为记录级）** | P2-a（「5 个测试文件」两处残留写法）、P2-b（plan §6 未含 `hostRule`）；两条都不改变行为、不改变任何判据 |
| 观察 | **1** | 观察-1（门禁快照数字随本轮新增文件变为 438 / 1944，属快照过期） |

**改判依据（逐条对 ④ 段出口）**：53 条用例现算 `22 / 18 / 13 = 53` 且 `负+边 31 ≥ 正 22`；结论表 53 行无缺号重号、`通过 53 / 不通过 0 / 不适用 0`；三条抽查（TC-01 / TC-31 / TC-53）与结论表逐条一致，另加 TC-36 一致；三道门禁全绿（`baseline 38/38` / `sweep ok` / `check 全部通过`，`# fail 0`）；`check-plan` 映射 53/53、规模 228/350 与 53/80 均在限内；漂移三数（细节 2 / 行为 0 / 功能 0）有 diff 与实测支持。

**首轮打回清单处置状态**：① P1-1 已消；② P2-1 影响面已改 7（残留两处写法，转本节 P2-a）；③ P2-2 已消；④ P2-3 未消（转本节 P2-b）。**四条中 2 条已消、1 条部分消、1 条未消；无 P0 / P1 残留。**

**对 ④ 段的处置建议**：④ 段结论可按「通过」进入 ⑤ 交付；P2-a / P2-b 建议在 ⑤ 交付签字前顺手改（两处各改一词 / 一句），不构成打回。
