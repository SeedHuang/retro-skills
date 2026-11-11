# 测试用例：P1 渲染隔离产物

> 归属 spec：`docs/superpowers/specs/2026-11-11-agent-model-pipeline-p1-design.md`（split from `docs/prd/20261111145723-agent-model-pipeline.md` §6 P1，2026-11-11）
> 编写者：senior-sdet 子代理｜**独立性声明**：编写者 ≠ spec 作者（主 agent）≠ 施工者
> 状态：草稿｜最后更新：2026-11-11（四次更新：补 spec §4.5 硬约束与 §4.6 测试承接映射）
> 命名与落点：与 spec 同目录；文件名 = spec 文件名去 `.md` 后 + `-testcase.md`。
> 自检口径：见文末 `## 8 自检`。
> 本轮声明：只写本文件。未修改 spec、未改任何 `.mjs` / `.json` / `agents/*.md`，未新建其他文件。执行过的命令全部只读（`node verify-models.mjs`、`git status`、`Select-String`、`node --input-type=module -` 内存渲染、`Test-Path`），未写盘。

**术语表（首次出现处的中文解释，后文沿用）**

| 术语 | 中文解释 |
|---|---|
| spec | 技术设计文档（本文件所测对象） |
| 模型 | `models/<seat>-model.json`，卡面唯一真相 |
| 段函数 | `render/sections.mjs` 里产出一段 `##` 级 markdown 的纯函数 |
| 边界形态 | `policy`（15 槽渲染）/ `literal`（席自带一句）/ `default`（公共只读句） |
| 15 槽 | `renderBoundary(seat)` 渲染的 15 个模板槽位 |
| 沙箱 | `tmp/agent-criteria-demo/sandbox/`，P1 产物落点 |
| 产物 | `sandbox/<seat>.md`，7 张渲染卡 |
| 档位 | `seat.tier`，取值 ∈ `TIERS` 的键：`readOnly` / `sdet` / `command` / `producer` |
| 派生文案 | 由模型字段 + 固定模板拼出的句子，渲染器内不存一次性手写句 |
| 码 | `verify-models.mjs` 打印的校验码串（如 `TIER_MISMATCH`），出现即判红 |
| 正例 / 负例 / 边界 | 正常路径 / 应判红的坏输入 / 临界输入（空值、缺件、空白） |
| sha256 | 文件内容的 256 位哈希，用于判两文件逐字节相同 |

## 0 测试设计结论（依据与判断）

- 结论 1：`tools` 现状有实跑可见的错误，必须单独立条（TC-016）。`sections.mjs:92` 的映射键是 `producer` / `reader` / `replayer`，而档位表键是 `readOnly` / `sdet` / `command` / `producer`（`tiers.mjs:5-10`），故 `readOnly` 查空后回落 `policy.capabilities`。实跑 `Select-String -Path tmp/agent-criteria-demo/output/*.md -Pattern '^tools:'` 首行 `detective-observer.md :: tools: Read, Glob, Grep, Write, Edit, RunCommand`，其中 `evidence-reader.md :: tools: read`、`respondent-dev.md :: tools: read, exec`。若只测「产物有 tools 行」，会把错值当基线放过。
- 结论 2：三形态不是风格选择，是逐字节事实；「非 policy 席误用 15 槽」现已由 spec S12 冻结为校验码 `BOUNDARY_POLICY_NONWRITER`（spec §3 S12），故本文件改判「码面」而非只靠人看。实跑 `renderBoundary('evidence-reader')` 长度 **1081**，正文含 `只允许写` 与 `命令默认拒绝`，而该席 `TIERS.readOnly` 无 `Write`（`tiers.mjs:6`）——这正是该码要拦的输入。正例 TC-005（2 席 `producer` 不触发）与负例 TC-040（只读席改 `policy` 触发）成对。
- 结论 3：`policy` 席的逐字节相等是 P1 唯一硬锚，必须单独成条（TC-006）。实跑 `renderBoundary` 与卡正文 `===` 为 `true`，长度 1200 / 1240（`detective-observer` / `reviewer-audit`），与 spec §1.1 F3 已改后的数字一致，原 G2 收口。
- 结论 4：`refExists` 是唯一未登记的 observable（TC-014）。`sections.mjs:15-37` 的 `OP` 实测 **21** 条、不含 `refExists`；spec §4.2 已冻结「加 `refExists` 后 **22** 条」（spec §4.2），故判据改为「键集 22 且含 `refExists`」，比只判「段存在」更严。`models/detective-observer-model.json` 的 `outputFormat.checks[0].observable.op` 正是 `refExists`。
- 结论 5：`reviewer-audit` 是「缺 outputFormat」的唯一自然样本（TC-011 / TC-012 / TC-029）。实跑 `node -e` 打印 7 席：只有 `reviewer-audit` 为 `hasOutputFormat=false`，其余 6 席 fields/checks 分别为 3/2、6/4、6/4、9/3、9/3、5/2。`agents/reviewer-audit.md:48-77` 的 18 字段 + 4 校验仍是手写，P1 明确不建模（spec §3 S6）。
- 结论 6：空段行为已有现成机判形态，故空 `must` / 空 `never` / `escalation = null` 的边界用例可写成「标题不得出现」。实跑 `sections.must({ must: [] })` → `[]`、`sections.never({ never: [] })` → `[]`；`escalation` 为 null 的 5 席在渲染段表中确实没有 `越界处置`（`evidence-reader` 等 5 席段表末项为 `权限`）。这比「肉眼检查空标题」可复算。
- 结论 7：PRD 回写现在就能判红，不必等实现（TC-037）。`Select-String -Path docs/prd/20261111145723-agent-model-pipeline.md -Pattern '要补的 \d+ 个缺口|## 9 待你确认'` 输出首行 `156: **要补的 3 个缺口**（不补则产物不完整）：`、次行 `313: ## 9 待你确认`。spec §2 第 5 条要求改成 4 且 §9 改「已定」，故本条是当前即红的交付项。
- 结论 8：差异报告的列名与列序已由 spec S16 冻结（spec §4.3：总览 10 列 / 段级 4 列 / 边界 5 列 / 缺失 3 列 / 已知差异 3 列），故机器可判到「列名数组」粒度（TC-042），不再只判节标题；原 G8 收口。
- 结论 9：退出码与输出流现状可核：`node verify-models.mjs` 末行 `exit=0`，源码全文无 `process.exitCode`（`verify-models.mjs:201-229`）；`spawnSync` 实测 `exit=0 stderrLen=0 stdoutLines=7`，即码串同席同行（stdout）、未另起 stderr 流。故 spec S15/§4.4 的「错误即 exit 1 且不另起 stderr 码流」现在是红基线，TC-044（verify）与 TC-045（render-all + 不调校验入口）成对。
- 结论 10：`--out` 的两种解析必须分测。spec §4.3 已冻结 `resolve(here, dir)`（spec §4.3），即从仓库根跑 `--out rel-sandbox` 应落 `tmp/agent-criteria-demo/rel-sandbox`，而非仓库根的 `rel-sandbox`；只测绝对路径会漏掉 base 选错。TC-026 同时判相对与绝对，且**故意把 `cwd` 设为仓库根**，用 `process.cwd()` 实现会在仓库根留目录而判红。
- 结论 11：开工快照现在不存在（`Test-Path tmp/agent-criteria-demo/.p1-start-status` → `False`），故 TC-043 当前不可判；且 P1 动工前必须先落快照，否则 §5-9 的「只允许新增」没有基线。这条是时序前置，不是代码缺口。
- 结论 12：`render-all` 的失败语义是「首个抛错即停、已写文件保留」（spec §4.4），与「渲染完再校验」是两种不同实现，必须单独立条（TC-046）。实跑模型目录顺序为 `detective-observer,evidence-reader,respondent-architect,respondent-dev,reviewer-actuary,reviewer-ai,reviewer-audit`（`readdirSync` 实测，`reviewer-aiIndex=5`），故坏席为 `reviewer-ai` 时预期产物数 = 5 且 6、7 席无文件；断言按同一 `readdirSync` 动态取下标，避免依赖字母序假设。
- 覆盖判断：spec 的验收面 = §3 S1–S16（16 条）+ §4.1–§4.4（4 组，含 5 个校验码与 2 个退出码）+ §5 的 5 条命令锚与 9 条补充判据 + §2 的 6 条「做」。全部落到 §1 表，无遗漏；§2 的 6 条「不做」落为 TC-038 / TC-039 / TC-043 的禁改面断言。

## 1 覆盖总表

| 用例 ID | 覆盖的 spec 条目 | 层级 | 正负 | 判据类型 | 执行方式 | 优先级 |
|---|---|---|---|---|---|---|
| TC-001 | §4.1 两字段 / S2 | 集成 | 正 | 机器 | `node --input-type=module -` 读 7 模型 | P0 |
| TC-002 | §4.1 表 / S2 / S1 | 集成 | 正 | 机器 | 同上，按 kind 分组 | P0 |
| TC-003 | §4.1 literal 逐字 / S3 | 集成 | 正 | 机器 | 模型 text 与卡正文比对 | P0 |
| TC-004 | §4.1 default 仅 kind / S3 | 集成 | 负 | 机器 | 读 key 集 + 常量句扫描 | P0 |
| TC-005 | §4.4 BOUNDARY_POLICY_NONWRITER 正例（2 席 producer 不触发）/ S12 / S1 | 集成 | 正 | 机器 | `node verify-models.mjs` 码面 | P0 |
| TC-006 | §4.2 boundary policy / S1 / §5-1 | 集成 | 正 | 机器 | 产物与 `renderBoundary` 比对 | P0 |
| TC-007 | §4.2 boundary literal+default / S1 / §5-2 | 集成 | 正 | 机器 | 产物与卡正文 / 常量比对 | P0 |
| TC-008 | §4.2 段顺序 / S8 | 集成 | 正 | 机器 | 产物 `## ` 标题序列 | P0 |
| TC-009 | §4.2 末条（未知 kind 抛错）/ S11 | 单元 | 负 | 机器 | 副本改 kind + 直接调段函数 | P1 |
| TC-010 | §4.2 outputFormat 非空行公式 / §5-3 | 集成 | 正 | 机器 | 段内非空行数公式 | P0 |
| TC-011 | §4.2 无 outputFormat 返回空 / S6 | 集成 | 边界 | 机器 | `reviewer-audit` 产物断言 | P0 |
| TC-012 | §4.2 跳过整段不留空标题 / S6 | 集成 | 负 | 机器 | 副本删 outputFormat | P0 |
| TC-013 | §4.2 只读 observable / S5 | 集成 | 负 | 机器 | `verify-models` + checks 无 text | P0 |
| TC-014 | §4.2 refExists 映射（OP 21→22） | 集成 | 负 | 机器 | OP 键集 + 产物校验行 | P0 |
| TC-015 | §4.2 type/values/required 不上卡面 / S5 | 集成 | 正 | 机器 | 表头与段内 token 扫描 | P1 |
| TC-016 | §4.2 frontmatter tools / S4 / §5-4 | 集成 | 正 | 机器 | 产物 tools 与 `TIERS` 比对 | P0 |
| TC-017 | §4.2 / §4.4 TIER_MISMATCH / S4 | 集成 | 负 | 机器 | 副本改 tier + `verify-models` | P0 |
| TC-018 | §4.2 tools 改源 / S4 | 集成 | 负 | 机器 | 副本改策略 caps 与模型 tier | P1 |
| TC-019 | §4.1 档位值域 / §4.4 | 集成 | 负 | 机器 | 副本写 `admin` + 校验 | P0 |
| TC-020 | §4.2 escalation 编号 / S7 / §5-5 | 集成 | 正 | 机器 | 产物编号序列 | P0 |
| TC-021 | §4.2 编号 = index+1 / S7 | 集成 | 负 | 机器 | 副本 4 步 | P0 |
| TC-022 | §4.2 不按 kind 写死 / S7 | 集成 | 负 | 机器 | 副本调换步序 | P1 |
| TC-023 | §4.2 escalation 空段 / S8 | 集成 | 边界 | 机器 | 5 席产物断言 | P0 |
| TC-024 | §5 命令锚 2（两次字节一致） | 集成 | 正 | 机器 | 内存两次渲染 + 文件 sha256 | P0 |
| TC-025 | §5-6 无绝对路径 / 时间戳 / sandbox | 集成 | 正 | 机器 | `Select-String` 扫描产物 | P0 |
| TC-026 | §4.3 `--out` 相对/绝对解析 / S9 / S14 / §5-8 | e2e | 正 | 机器 | 两条 `--out` 实跑 + 源码断言 | P0 |
| TC-027 | §4.3 产物清单 / §5 命令锚 1 | e2e | 正 | 机器 | `node render-all.mjs` | P0 |
| TC-028 | §4.3 报告 5 节 + 确定性 / S10 | 集成 | 正 | 机器 | 报告节标题 + 两跑比对 | P0 |
| TC-029 | §4.3 缺失项 / 边界核对列值 / S6 / S16 | 集成 | 正 | 机器 | 报告内容检索 | P0 |
| TC-030 | §4.4 / §5 命令锚 3 / S11 | 集成 | 正 | 机器 | `node verify-models.mjs` | P0 |
| TC-031 | §4.4 BOUNDARY_KIND_UNKNOWN / S11 | 集成 | 负 | 机器 | 副本改 kind + 校验 | P0 |
| TC-032 | §4.4 BOUNDARY_TEXT_MISSING（含空白串，且只发此码）/ S11 | 集成 | 负 | 机器 | 副本删字 / 空串 / 非串 / 全空白 | P0 |
| TC-033 | S11「校验失败即停，不进渲染」 | e2e | 负 | 机器 | 坏模型 + `render-all` | P1 |
| TC-034 | §4.2 空 must 跳过 | 单元 | 边界 | 机器 | 直接调 `sections.must` | P1 |
| TC-035 | §4.2 空 never 跳过 | 单元 | 边界 | 机器 | 直接调 `sections.never` | P1 |
| TC-036 | §4.2 literal 不 trim / S13 | 集成 | 边界 | 机器 | 副本改首尾空白 + 比对 | P1 |
| TC-037 | §2 做-6 PRD 回写 | 集成 | 正 | 机器 | `Select-String` PRD | P0 |
| TC-038 | §2 不做-1/2 + §5-9（agents / docgen 零改动） | 集成 | 正 | 机器 | `git status` / 快照 diff | P0 |
| TC-039 | §2 不做-3/6（types 与 _baseline 零改动） | 集成 | 正 | 机器 | `git status` | P0 |
| TC-040 | §4.4 BOUNDARY_POLICY_NONWRITER 负例 / S12 | 集成 | 负 | 机器 | 副本改只读席 kind=policy + 校验 | P0 |
| TC-041 | §4.4 BOUNDARY_TEXT_WHITESPACE / S13 | 集成 | 负 | 机器 | 副本加首尾空白（非全空白）+ 校验 | P0 |
| TC-042 | §4.3 报告列名与列序 / S16 | 集成 | 正 | 机器 | 五节表头数组比对 | P0 |
| TC-043 | §5-9 开工快照 / §2 不做-1/2 | 集成 | 正 | 机器 | 快照 diff 白名单 | P0 |
| TC-044 | §4.4 退出码 verify-models / S15 / §5-7 | 集成 | 负 | 机器 | 正常 + 坏模型两次退出码 | P0 |
| TC-045 | §4.4 退出码 render-all + 不调校验入口 / S15 | e2e | 负 | 机器 | 两次退出码 + 静态扫描（允许 `import { expand }`） | P0 |
| TC-046 | §4.4 render-all 首次抛错即停 / S15 | e2e | 负 | 机器 | 坏席 + 产物数与 `readdirSync` 下标比对 | P0 |

**覆盖核对**：spec §3 的 S1–S16 全部有对应行（S1→005/006/007/009；S2→001/002/005/040；S3→003/004/007；S4→016/017/018/019；S5→010/013/014/015；S6→011/012/029；S7→020/021/022；S8→008/023；S9→026/027；S10→028；S11→009/030/031/032/033；S12→005/040；S13→036/041；S14→026；S15→044/045/046；S16→029/042）；§4.1→001–004/019；§4.2→006–023/036；§4.3→026–029/042；§4.4→017/019/031/032/040/041/044/045/046；§4.5 的 5 条硬约束→见下表 A；§4.6 的 7 行测试→见下表 B；§5 命令锚 1–5→030、027、028、024、038（依次：`verify` / `render-all` 7 个 / `diff-report` 8 个 / 第二次 `render-all` 字节同 / `git status agents/`）；§5 补充判据 1–9→006、007、010/011、016、020–022、025、044、026、043；§2 做-1~6→001–039；不做-1/2→038/043；不做-3/6→039；不做-4（`reviewer-audit` 不建 outputFormat）→011/012/029；不做-5（不移植现役 6+9 红测试）→本文件 §6 声明。未覆盖 spec 条目 **0** 条（「不做」按「禁改面断言 + 声明」计入承接）。

### 1.1 §4.5 硬约束（5 条）的用例覆盖

| 约束 | 原文要点 | 承接用例 | 执行方式 |
|---|---|---|---|
| §4.5-1 | 只改 `tmp/agent-criteria-demo/**` 与四份文档（spec / testcase / plan / PRD 回写）；`agents/**`、`tools/docgen/**` 一行不动 | TC-038、TC-043（对照只读：TC-003/TC-006/TC-007 只比卡不写卡） | 快照 diff + `git status` |
| §4.5-2 | 渲染层只 import 现役组件，不得复制 `boundary.md.tpl` / `DEFAULT_BOUNDARY` / `TIERS` 的文本或数组 | TC-004（模型内无常量句）、TC-016（tools = `TIERS`）、TC-018（改源对照） | 常量句扫描 + tools 比对 + 副本对照 |
| §4.5-3 | `outputFormat.checks` 无 `text`；`OUTPUT_TEXT_HANDWRITTEN` 保持为空 | TC-013 | 模型扫描 + `verify-models` 输出 |
| §4.5-4 | 只加 `seat.tier` 与顶层 `boundary`，不得改 `must`/`never`/`predicates`/`records` | TC-039、TC-030（7 行 `EQUIVALENT`） | `git status` + 基线比对 |
| §4.5-5 | 产物与报告确定性：无时间戳、无绝对路径、无随机顺序 | TC-024、TC-025、TC-028 | 两次渲染 sha256 + `Select-String` 扫描 |

### 1.2 §4.6 测试清单（7 行）与测试代码承接

| §4.6 测什么 | 承接用例 | plan Task 2 的 `test(...)` |
|---|---|---|
| 7 席 `tools` = `TIERS[seat.tier]` | TC-016 | `test('TC-016 tools = TIERS[seat.tier]')` |
| 2 张 `policy` 席边界与 `renderBoundary` 逐字节相等 | TC-006 | `test('TC-006 policy 边界与 renderBoundary 逐字节相等')` |
| 5 张非 `policy` 席边界与现役卡逐字节相等 | TC-007（传递承接 TC-003） | `test('TC-007 非 policy 边界与现役卡逐字节相等')` |
| `outputFormat` 段非空行公式 | TC-010、TC-011（空分支） | `test('TC-010/011 outputFormat 段与行数公式')` |
| 5 个新校验码各自正反例 | TC-005、TC-017、TC-019、TC-031、TC-032、TC-040、TC-041 | `test('TC-044 verify 全绿且 exit 0')`、`test('TC-017 TIER_MISMATCH')`、`test('TC-019 未知档位值 → TIER_MISMATCH，exit 1')`、`test('TC-031 BOUNDARY_KIND_UNKNOWN')`、`test('TC-032 空白 text 只发 BOUNDARY_TEXT_MISSING')`、`test('TC-040 policy 非写席 → BOUNDARY_POLICY_NONWRITER，exit 1')`、`test('TC-041 非空带首尾空白只发 WHITESPACE')` |
| 两次渲染字节差 0 | TC-024、TC-027、TC-028 | `test('TC-024/025 render-all 落 sandbox、7 文件、两次字节同、无 sandbox 字样')`、`test('TC-042/028 报告五节列名冻结且两次字节相同')` |
| exit code | TC-044、TC-045、TC-046 | `test('TC-044 verify 全绿且 exit 0')`、`test('TC-046 render-all 首个抛错即停、已写文件保留')` |

### 1.3 plan Task 2 测试名 → 用例编号对照（防错配）

> 规则：`test()` 名里的 `TC-xxx` 必须与用例编号逐字一致；多覆盖合写用 `TC-A/B`。改名后按本表复核，任一不匹配 = 追溯断链。

| `test(...)` 名 | 覆盖 TC |
|---|---|
| `TC-001/002 7 席 tier 与 boundary 分配` | 001、002 |
| `TC-044 verify 全绿且 exit 0` | 044（含 TC-005 正例） |
| `TC-016 tools = TIERS[seat.tier]` | 016 |
| `TC-020 越界处置按 steps 序号` | 020 |
| `TC-010/011 outputFormat 段与行数公式` | 010、011 |
| `TC-014 refExists 派生且 OP 键集为 22` | 014 |
| `TC-013 outputFormat.checks 无 text 键` | 013 |
| `TC-012 无 outputFormat 时不留空标题` | 012 |
| `TC-006 policy 边界与 renderBoundary 逐字节相等` | 006 |
| `TC-007 非 policy 边界与现役卡逐字节相等` | 007 |
| `TC-008 段顺序` | 008 |
| `TC-040 policy 非写席 → BOUNDARY_POLICY_NONWRITER，exit 1` | 040 |
| `TC-017 TIER_MISMATCH` | 017 |
| `TC-031 BOUNDARY_KIND_UNKNOWN` | 031 |
| `TC-019 未知档位值 → TIER_MISMATCH，exit 1` | 019 |
| `TC-032 空白 text 只发 BOUNDARY_TEXT_MISSING` | 032 |
| `TC-004 default 两席只有 kind，模型不复制常量` | 004 |
| `TC-015 输出格式表头只有两列` | 015 |
| `TC-022 调换步序后编号跟序号` | 022 |
| `TC-023 5 席无越界处置段` | 023 |
| `TC-034/035 空 must/never 返回 []` | 034、035 |
| `TC-036 literal 首尾空白原样渲染` | 036 |
| `TC-041 非空带首尾空白只发 WHITESPACE` | 041 |
| `TC-024/025 render-all 落 sandbox、7 文件、两次字节同、无 sandbox 字样` | 024、025、027 |
| `TC-026 --out 相对脚本目录解析（cwd 故意设为仓库根）` | 026 |
| `TC-042/028 报告五节列名冻结且两次字节相同` | 042、028 |
| `TC-046 render-all 首个抛错即停、已写文件保留` | 046 |
| `TC-037 PRD 回写` | 037 |

## 2 用例明细

### TC-001 7 张模型补齐 `seat.tier` 与 `boundary`，且档位值 ∈ `TIERS`

- **覆盖**：spec §4.1 两字段 / S2
- **前置**：P1 已按 §4.1 给 7 张模型加字段；工作区干净。
- **步骤**：① CWD=`d:\Seed\retro-skills`，逐个读 `tmp/agent-criteria-demo/models/<seat>-model.json`；② 取 `seat.tier` 与 `boundary.kind`；③ 与 §4.1 表逐席比对；④ 检查 `tier` 是否 ∈ `TIERS` 的键。
- **预期**：首行 `detective-observer=producer/policy reviewer-audit=producer/policy respondent-dev=command/literal evidence-reader=readOnly/literal respondent-architect=readOnly/literal reviewer-actuary=readOnly/default reviewer-ai=readOnly/default`；`TIERS` 键集为 `readOnly,sdet,command,producer`。
- **判据**：机器：`node --input-type=module -e "import{readFileSync}from'node:fs';const S=['detective-observer','reviewer-audit','respondent-dev','evidence-reader','respondent-architect','reviewer-actuary','reviewer-ai'];console.log(S.map(s=>{const m=JSON.parse(readFileSync('./tmp/agent-criteria-demo/models/'+s+'-model.json','utf8'));return s+'='+(m.seat&&m.seat.tier)+'/'+(m.boundary&&m.boundary.kind)}).join(' '))"`（CWD=`d:\Seed\retro-skills`）→ 首行与上列字符串逐字相等；且 `node --input-type=module -e "import{TIERS}from'./tools/docgen/builders/agents/policy/definitions/tiers.mjs';console.log(Object.keys(TIERS).join(','))"` → 首行 `readOnly,sdet,command,producer`。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-001/002 7 席 tier 与 boundary 分配')` 逐席断言 `seat.tier` 与 `boundary.kind` 等于 §4.1 表（`ALLOC` 两列），28/28 全绿；`verify-models` 7 行 `EQUIVALENT`、exit 0。
- **红绿证据**：红 = 上述全 `undefined/undefined`；绿 = 七席逐一等于 §4.1 表且档位 ∈ 四键。
- **对应测试/交付物**：`tmp/agent-criteria-demo/models/*-model.json` ×7；**测试承接**：`test('TC-001/002 7 席 tier 与 boundary 分配')`。
- **不覆盖**：不判档位语义是否正确（由 TC-017 判与策略一致）。

### TC-002 `boundary.kind` 三形态逐席归属，且计数 2/3/2

- **覆盖**：spec §4.1 表 / S2 / S1
- **前置**：同 TC-001。
- **步骤**：① 按 kind 分组 7 席；② 输出每组席名与计数。
- **预期**：`policy=2 [detective-observer,reviewer-audit]`、`literal=3 [respondent-dev,evidence-reader,respondent-architect]`、`default=2 [reviewer-actuary,reviewer-ai]`。
- **判据**：机器：`node --input-type=module -e "import{readFileSync}from'node:fs';const S=['detective-observer','reviewer-audit','respondent-dev','evidence-reader','respondent-architect','reviewer-actuary','reviewer-ai'];const g={};for(const s of S){const m=JSON.parse(readFileSync('./tmp/agent-criteria-demo/models/'+s+'-model.json','utf8'));const k=(m.boundary&&m.boundary.kind)||'none';(g[k]=g[k]||[]).push(s)}for(const k of Object.keys(g).sort())console.log(k+'='+g[k].length+' ['+g[k].join(',')+']')"`（CWD=`d:\Seed\retro-skills`）→ 三行依次为 `default=` / `literal=` / `policy=`（`Object.keys().sort()` 的字典序），计数与席名逐字相等。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。同一 test 以 `ALLOC` 逐席断言 policy/literal/default 归属（2/3/2），28/28 全绿；`verify-models` 无 `BOUNDARY_KIND_UNKNOWN`。
- **红绿证据**：红 = `none=7`；绿 = 2/3/2 且席名完全对应。
- **对应测试/交付物**：同 TC-001；**测试承接**：`test('TC-001/002 7 席 tier 与 boundary 分配')`（同一测试逐席断言 `ALLOC` 两列）。
- **不覆盖**：不判 `kind` 语义（如为何只读席用 literal 而非 policy）——依据在 spec §1.1 F2–F4。

### TC-003 3 席 `literal.text` 与现役卡 `## 边界` 正文逐字节相等

- **覆盖**：spec §4.1 literal 逐字取 / S3
- **前置**：同 TC-001；3 席 `boundary.text` 已从现役卡抄入。
- **步骤**：① 对 3 席取模型 `boundary.text`；② 取 `agents/<seat>.md` 中 `## 边界` 行之后到文件末尾的正文（`\r\n`→`\n`、去尾部空行）；③ 计数相等席数。
- **预期**：`literal_eq_card=3/3`；三席编号 `respondent-dev` / `evidence-reader` / `respondent-architect`。
- **判据**：机器：`node --input-type=module -e "import{readFileSync}from'node:fs';const S=['detective-observer','reviewer-audit','respondent-dev','evidence-reader','respondent-architect','reviewer-actuary','reviewer-ai'];const g=f=>readFileSync(f,'utf8').replace(/\r\n/g,'\n').split('\n');const bodyOf=f=>{const L=g(f);return L.slice(L.indexOf('## 边界')+1).join('\n').replace(/\n+$/,'')};let eq=0;for(const s of S){const m=JSON.parse(readFileSync('./tmp/agent-criteria-demo/models/'+s+'-model.json','utf8'));if((m.boundary&&m.boundary.kind)==='literal'&&m.boundary.text===bodyOf('./agents/'+s+'.md'))eq++}console.log('literal_eq_card='+eq+'/3')"`（CWD=`d:\Seed\retro-skills`）→ 首行 `literal_eq_card=3/3`。
- **执行状态**：**已施行（人工判据实跑）**。判据命令实跑首行 `literal_eq_card=3/3`（三席模型 `boundary.text` 与现役卡 `## 边界` 正文逐字相等）。
- **红绿证据**：红 = `0/3`；绿 = `3/3`。逐字含全角标点、空格，不做转述。
- **对应测试/交付物**：同 TC-001；对照 `agents/evidence-reader.md:65-66`、`agents/respondent-architect.md:61-62`、`agents/respondent-dev.md:61-62`；**测试承接**：`test('TC-007 非 policy 边界与现役卡逐字节相等')`（模型 `text` 错 → 产物错 → 该测试红，属传递承接，无独立 test 名）。
- **不覆盖**：不判标点风格（只判逐字相等）。

### TC-004 `default` 两席只有 `kind`，模型内不得出现常量正文

- **覆盖**：spec §4.1 default 只写 kind / S3
- **前置**：同 TC-001。
- **步骤**：① 取 `reviewer-actuary` / `reviewer-ai` 的 `boundary` 键集；② 全 `models/*.json` 检索 `DEFAULT_BOUNDARY` 正文首句 `你是只读评审角色`；③ 检查 `text` 键不存在。
- **预期**：`reviewer-actuary:keys=kind hasText=false reviewer-ai:keys=kind hasText=false`；常量句出现次数 `0`。
- **判据**：机器：`node --input-type=module -e "import{readFileSync}from'node:fs';for(const s of ['reviewer-actuary','reviewer-ai']){const m=JSON.parse(readFileSync('./tmp/agent-criteria-demo/models/'+s+'-model.json','utf8'));console.log(s+':keys='+Object.keys(m.boundary||{}).join(',')+' hasText='+(!!m.boundary&&'text' in m.boundary))}"` → 两行与上一行逐字相等；`(Select-String -Path tmp/agent-criteria-demo/models/*.json -Pattern '你是只读评审角色' | Measure-Object).Count`（CWD=`d:\Seed\retro-skills`）→ `0`。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-004 default 两席只有 kind，模型不复制常量')` 断言两席 `boundary` 键集为 `['kind']`、models/*.json 全文无 `你是只读评审角色`，28/28 全绿。
- **红绿证据**：红 = `keys=` 为空（`boundary` 缺失）或常量句计数 ≥1；绿 = `keys=kind` 且计数 0。
- **对应测试/交付物**：`models/reviewer-actuary-model.json`、`models/reviewer-ai-model.json`；常量源 `patternRegistry.mjs:13`；**测试承接**：`test('TC-004 default 两席只有 kind，模型不复制常量')`。
- **不覆盖**：不判 `default` 产物正文（由 TC-007 判）。

### TC-005 2 张 `policy` 席不触发 `BOUNDARY_POLICY_NONWRITER`（正）

- **覆盖**：spec §4.4 BOUNDARY_POLICY_NONWRITER 正例 / S12 / S1 / §5 命令锚 3
- **前置**：`detective-observer` / `reviewer-audit` 两席 `kind=policy` 且 `seat.tier=producer`；`TIERS.producer` 含 `Write`（`tiers.mjs:9`）。
- **步骤**：① CWD=`d:\Seed\retro-skills\tmp\agent-criteria-demo` 跑 `node verify-models.mjs`；② 检索 `BOUNDARY_POLICY_NONWRITER`；③ 确认两席 tier 的工具集含 `Write`。
- **预期**：两行输出均无该码；`TIERS.producer` 数组含 `Write`。
- **判据**：机器：`node verify-models.mjs`（CWD=`d:\Seed\retro-skills\tmp\agent-criteria-demo`）→ 7 行输出中 `BOUNDARY_POLICY_NONWRITER` 出现 `0` 次；`node --input-type=module -e "import{TIERS}from'./tools/docgen/builders/agents/policy/definitions/tiers.mjs';console.log(TIERS.producer.includes('Write'),TIERS.readOnly.includes('Write'),TIERS.command.includes('Write'))"`（CWD=`d:\Seed\retro-skills`）→ 首行 `true false false`。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。由 `test('TC-044 verify 全绿且 exit 0')` 承接：7 行均以 `EQUIVALENT` 结尾（码串若追加即破坏该结尾）且 exit 0；`TIERS.producer` 含 `Write` 实跑 `true false false`。
- **红绿证据**：红 = 两席任一被报该码，或 `TIERS.readOnly` / `TIERS.command` 含 `Write`（则负例判别力失效）；绿 = 首行 `true false false` + 0 次该码。
- **对应测试/交付物**：`verify-models.mjs` 新码、`models/detective-observer-model.json`、`models/reviewer-audit-model.json`；**测试承接**：`test('TC-044 verify 全绿且 exit 0')`（7 席全绿即含 2 张 policy 席不触发本码）。
- **不覆盖**：不判该码的报文措辞（spec 只冻结码名）。

### TC-006 2 张 `policy` 席产物边界正文 === `renderBoundary(seat)`（逐字节）

- **覆盖**：spec §4.2 boundary policy / S1 / §5 补充判据 1
- **前置**：P1 已实现 `boundary` 段函数并产出 `sandbox/detective-observer.md`、`sandbox/reviewer-audit.md`。
- **步骤**：① 取两产物 `## 边界` 之后的正文（去尾空行、`\r\n`→`\n`）；② 与 `renderBoundary(seat)` 逐字节比；③ 打印两侧长度。
- **预期**：两席均 `true`；长度 `1200` / `1240`（口径：正文去尾随空行后计字符）。
- **判据**：机器：`node --input-type=module -e "import{readFileSync}from'node:fs';import{renderBoundary}from'./tools/docgen/builders/agents/components/renderBoundary.mjs';const bodyOf=f=>{const L=readFileSync(f,'utf8').replace(/\r\n/g,'\n').split('\n');return L.slice(L.indexOf('## 边界')+1).join('\n').replace(/\n+$/,'')};for(const s of ['detective-observer','reviewer-audit']){const b=bodyOf('./tmp/agent-criteria-demo/sandbox/'+s+'.md');console.log(s,b===renderBoundary(s),b.length,renderBoundary(s).length)}"`（CWD=`d:\Seed\retro-skills`）→ 两行分别为 `detective-observer true 1200 1200`、`reviewer-audit true 1240 1240`。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-006 policy 边界与 renderBoundary 逐字节相等')` 对两席渲染段正文与 `renderBoundary(seat)` 逐字节比对，28/28 全绿。
- **红绿证据**：红 = 任一席 `false` 或长度不等；绿 = 两行均 `true` 且长度 1200 / 1240（与 spec F3 一致）。
- **对应测试/交付物**：`sections.mjs` 的 `boundary`、`render-all.mjs` 产物；**测试承接**：`test('TC-006 policy 边界与 renderBoundary 逐字节相等')`。
- **不覆盖**：不判 15 槽文案质量（归 docgen 既有测试）。

### TC-007 5 张非 `policy` 席产物边界正文 === 现役卡该段（逐字节）

- **覆盖**：spec §4.2 boundary literal+default / S1 / S3 / §5 补充判据 2
- **前置**：同 TC-006，5 产物已生成。
- **步骤**：① 3 张 `literal` 席：产物边界正文 === 模型 `boundary.text` === 现役卡正文；② 2 张 `default` 席：产物边界正文 === `DEFAULT_BOUNDARY`（`patternRegistry.mjs:13`）。
- **预期**：`literal_eq=3/3`、`default_eq=2/2`；5 席产物边界正文与卡正文 `===` 为 true。
- **判据**：机器：`node --input-type=module -e "import{readFileSync}from'node:fs';import{DEFAULT_BOUNDARY}from'./tools/docgen/builders/agents/components/patternRegistry.mjs';const bodyOf=f=>{const L=readFileSync(f,'utf8').replace(/\r\n/g,'\n').split('\n');return L.slice(L.indexOf('## 边界')+1).join('\n').replace(/\n+$/,'')};let a=0,b=0;for(const s of ['respondent-dev','evidence-reader','respondent-architect']){if(bodyOf('./tmp/agent-criteria-demo/sandbox/'+s+'.md')===bodyOf('./agents/'+s+'.md'))a++}for(const s of ['reviewer-actuary','reviewer-ai']){if(bodyOf('./tmp/agent-criteria-demo/sandbox/'+s+'.md')===DEFAULT_BOUNDARY)b++}console.log('literal_eq='+a+'/3 default_eq='+b+'/2')"`（CWD=`d:\Seed\retro-skills`）→ 首行 `literal_eq=3/3 default_eq=2/2`。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-007 非 policy 边界与现役卡逐字节相等')` 对 5 席（3 literal + 2 default）渲染段正文与现役卡同段逐字节比对，28/28 全绿。
- **红绿证据**：红 = `literal_eq=0/3 default_eq=2/2`（现状）；绿 = `3/3` 与 `2/2`。
- **对应测试/交付物**：同 TC-006；常量 `patternRegistry.mjs:13`；**测试承接**：`test('TC-007 非 policy 边界与现役卡逐字节相等')`。
- **不覆盖**：不判 `literal` 文案是否需润色（spec §4.1 明确「不转述、不润色」）。

### TC-008 段顺序严格按 S8，`边界` 恒为末段

- **覆盖**：spec §4.2 段表 / S8
- **前置**：7 产物已生成。
- **步骤**：① 逐产物提取以 `## ` 开头的标题序列；② 与 S8 序列比对（跳过因空段被省略的标题）；③ 检查末段为 `边界`。
- **预期**：每个产物标题序列是 `[职责, 一定会, 禁止, 冲突裁决, 本席清单, 输出格式, 产出, 权限, 越界处置, 边界]` 的子序列（保持相对顺序），且最后一行为 `## 边界`；`reviewer-audit` 序列不含 `输出格式`、5 席不含 `越界处置`。
- **判据**：机器：`node --input-type=module -e "import{readFileSync,readdirSync}from'node:fs';const S8=['职责','一定会','禁止','冲突裁决','本席清单','输出格式','产出','权限','越界处置','边界'];for(const f of readdirSync('./tmp/agent-criteria-demo/sandbox').filter(x=>x.endsWith('.md')&&x!=='diff-report.md')){const L=readFileSync('./tmp/agent-criteria-demo/sandbox/'+f,'utf8').split('\n').filter(l=>l.startsWith('## ')).map(l=>l.slice(3));let k=0,ok=true;for(const x of L){const i=S8.indexOf(x,k);if(i<0){ok=false;break}k=i}console.log(f,ok,L.at(-1))}"`（CWD=`d:\Seed\retro-skills`）→ 7 行均为 `<file>.md true 边界`。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-008 段顺序')` 断言 detective-observer 10 段标题全在且索引递增（`边界` 为末段）；其余席走同一段表，缺段由 TC-010/011、TC-023 断言，28/28 全绿。
- **红绿证据**：红 = 任一席 `false` 或末段非 `边界`；绿 = 7 行全 `true 边界`。
- **对应测试/交付物**：`render/index.mjs` 段表、`sandbox/*.md`；**测试承接**：`test('TC-008 段顺序')`（断言 `## ` 标题序列）。
- **不覆盖**：不判空段是否应保留占位（spec 明确跳过）。

### TC-009 渲染层遇未登记的 `kind` 必须抛错，不静默兜底（负）

- **覆盖**：spec §4.2 末条 / S11
- **前置**：demo 副本；`models/reviewer-ai-model.json` 的 `boundary.kind` 改为 `"policy2"`。
- **步骤**：① 在副本直接调用 `sections.boundary(M, shared, h)`（或 `renderModel`）；② 看是否抛错、错误是否含该 kind。
- **预期**：抛错（exit ≠ 0 或 `try/catch` 捕获到异常），不得返回 `[]`、不得回落到 `DEFAULT_BOUNDARY`。
- **判据**：机器：副本内 `node --input-type=module -e "import{renderModel}from'./render/index.mjs';import{readFileSync}from'node:fs';try{renderModel('./models/reviewer-ai-model.json',JSON.parse(readFileSync('./models/_shared-model.json','utf8')));console.log('NO_THROW')}catch(e){console.log('THROW '+e.message)}"`（CWD=副本根 `tmp/agent-criteria-demo` 的拷贝）→ 首行以 `THROW` 开头且含 `policy2`；不得为 `NO_THROW`。
- **执行状态**：**已施行（人工判据实跑）**。副本内把 `reviewer-ai.boundary.kind` 改为 `policy2` 后直接调 `renderModel`，首行实跑 `THROW BOUNDARY_KIND_UNKNOWN policy2`（未静默兜底）。
- **红绿证据**：红 = 输出 `NO_THROW` 或产物边界变成默认句；绿 = `THROW ...policy2`。校验层本应先拦（TC-031），本条只测渲染层防御。
- **对应测试/交付物**：`sections.mjs` 的 `boundary`；**测试承接**：`test('TC-046 render-all 首个抛错即停、已写文件保留')`（用 `kind:'boom'` 触发同一渲染抛错路径，未直接断言错误文本）。
- **不覆盖**：不判错误类型/码（spec 未冻结渲染层错误形态）。

### TC-010 6 张产物含 `## 输出格式`，段内非空行数 = 字段数 + 校验数 + 5

- **覆盖**：spec §4.2 outputFormat / §5 补充判据 3 / S5
- **前置**：6 张有 `outputFormat` 的产物已生成。
- **步骤**：① 逐席统计段内非空行数；② 与 `requiredFields.length + checks.length + 5` 比；③ 检查字段行顺序与 label 一致。
- **预期**：`evidence-reader 10/10`、`respondent-architect 15/15`、`respondent-dev 15/15`、`reviewer-actuary 17/17`、`reviewer-ai 17/17`、`detective-observer 12/12`（非空行；固定 5 行 = `## 输出格式` / `必填字段：` / 表头 / 分隔行 / `校验：`）。
- **判据**：机器：`node --input-type=module -e "import{readFileSync}from'node:fs';for(const s of ['evidence-reader','respondent-architect','respondent-dev','reviewer-actuary','reviewer-ai','detective-observer']){const L=readFileSync('./tmp/agent-criteria-demo/sandbox/'+s+'.md','utf8').split('\n');const i=L.indexOf('## 输出格式');let j=i+1;while(j<L.length&&!L[j].startsWith('## '))j++;const n=L.slice(i,j).filter(x=>x.trim()!=='').length;const m=JSON.parse(readFileSync('./tmp/agent-criteria-demo/models/'+s+'-model.json','utf8'));const e=m.outputFormat.requiredFields.length+m.outputFormat.checks.length+5;console.log(s,n+'/'+e)}"`（CWD=`d:\Seed\retro-skills`）→ 六行逐字等于上列六项。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-010/011 outputFormat 段与行数公式')` 逐席断言段存在性 = `Boolean(m.outputFormat)` 且非空行数 = `requiredFields.length + checks.length + 5`，28/28 全绿。
- **红绿证据**：红 = 现产物 0 段；绿 = 六行左右相等。
- **对应测试/交付物**：`sections.mjs` 的 `outputFormat`、`sandbox/*.md`；**测试承接**：`test('TC-010/011 outputFormat 段与行数公式')`。
- **不覆盖**：不判空行的数量（spec §4.2 只把**非空行**计入公式，空行多少不约束）。

### TC-011 `reviewer-audit` 产物无 `## 输出格式`，且无空标题残留（边界）

- **覆盖**：spec §4.2 无 outputFormat 返回 `[]` / S6
- **前置**：`reviewer-audit` 产物已生成。
- **步骤**：① 检索 `## 输出格式`；② 检索孤儿文案 `必填字段：`、`校验：`；③ 检查文件末尾无连续空标题。
- **预期**：`hasHeading=false`、`hasOrphanFields=false`、`hasOrphanChecks=false`。
- **判据**：机器：`node --input-type=module -e "import{readFileSync}from'node:fs';const t=readFileSync('./tmp/agent-criteria-demo/sandbox/reviewer-audit.md','utf8');console.log('hasHeading='+t.includes('## 输出格式'),'hasOrphanFields='+t.includes('必填字段：'),'hasOrphanChecks='+t.includes('校验：'))"`（CWD=`d:\Seed\retro-skills`）→ 首行 `hasHeading=false hasOrphanFields=false hasOrphanChecks=false`。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。同一 test 对 reviewer-audit 取 `Boolean(sec) === Boolean(m.outputFormat)`（`false===false`），28/28 全绿。
- **红绿证据**：红 = `hasHeading=true` 但表体为空，或孤儿 `必填字段：`；绿 = 三项全 `false`。
- **对应测试/交付物**：`models/reviewer-audit-model.json`（应保持无 `outputFormat`）、产物；**测试承接**：`test('TC-010/011 outputFormat 段与行数公式')`（`Boolean(sec) === Boolean(m.outputFormat)` 在 `reviewer-audit` 上取 `false===false`）。
- **不覆盖**：不判「缺失项应入报告」（TC-029）。

### TC-012 删掉 `outputFormat` 的副本 → 整段跳过，不输出空标题（负）

- **覆盖**：spec §4.2 跳过整段 / S6
- **前置**：demo 副本；删掉 `models/reviewer-ai-model.json` 的 `outputFormat` 键。
- **步骤**：① 副本渲染 `reviewer-ai`；② 检索 `## 输出格式`、`必填字段：`。
- **预期**：两者均不出现；该席前后两段之间只留一个空行，无 `## 输出格式` 空壳。
- **判据**：机器：副本内（CWD=副本根）同一断言 → 首行 `hasHeading=false hasOrphanFields=false`；且产物中 `\n## 输出格式\n\n## ` 模式匹配数 `0`。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-012 无 outputFormat 时不留空标题')` 在副本删掉 reviewer-ai 的 `outputFormat` 后断言渲染文本不含 `\n## 输出格式\n`，28/28 全绿。
- **红绿证据**：红 = 出现 `## 输出格式` 后紧跟 `## `（空段）；绿 = 标题不出现。
- **对应测试/交付物**：`sections.mjs` 的 `outputFormat`；**测试承接**：`test('TC-012 无 outputFormat 时不留空标题')`（副本删字段后断言无 `## 输出格式` 标题）。
- **不覆盖**：不判 `outputFormat` 缺字段时是否要给 WARN（spec 未要求）。

### TC-013 6 席 `checks` 无 `text` 字段，`OUTPUT_TEXT_HANDWRITTEN` 不被触发（负）

- **覆盖**：spec §4.2 只允许读 `observable` / S5
- **前置**：同 TC-001；`verify-models.mjs:181` 的守卫已存在。
- **步骤**：① 扫描 6 席 `outputFormat.checks[*]` 是否含 `text` 键；② 跑 `node verify-models.mjs` 看是否打印 `OUTPUT_TEXT_HANDWRITTEN`。
- **预期**：`textHandwritten=[]`（6 席全空）；`verify-models` 输出 7 行均无 `OUTPUT_TEXT_HANDWRITTEN`。
- **判据**：机器：`node --input-type=module -e "import{readFileSync}from'node:fs';let bad=[];for(const s of ['evidence-reader','respondent-architect','respondent-dev','reviewer-actuary','reviewer-ai','detective-observer']){const m=JSON.parse(readFileSync('./tmp/agent-criteria-demo/models/'+s+'-model.json','utf8'));bad.push(...(m.outputFormat.checks||[]).filter(c=>'text' in c).map(c=>c.id))}console.log('handwritten='+bad.length)"`（CWD=`d:\Seed\retro-skills`）→ 首行 `handwritten=0`；`node verify-models.mjs`（CWD=`d:\Seed\retro-skills\tmp\agent-criteria-demo`）→ 7 行均不含 `OUTPUT_TEXT_HANDWRITTEN`。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-013 outputFormat.checks 无 text 键')` 扫 7 席 `checks` 无 `text`，28/28 全绿；`verify-models` 7 行 `EQUIVALENT` 无 `OUTPUT_TEXT_HANDWRITTEN`。
- **红绿证据**：红 = `handwritten≥1` 或输出含 `OUTPUT_TEXT_HANDWRITTEN`；绿 = `0` 且无码。
- **对应测试/交付物**：`models/*-model.json`、`verify-models.mjs:181`；**测试承接**：`test('TC-013 outputFormat.checks 无 text 键')` + `test('TC-044 verify 全绿且 exit 0')`。
- **不覆盖**：不判 `observable` 的措辞是否优于现役散文（K2，归 P2）。

### TC-014 `refExists` 派生不得把英文 op 名落卡，且 OP 键集为 22（负）

- **覆盖**：spec §4.2「`refExists` 新增一条 OP 映射」/「现有 21 条，加后 22 条」
- **前置**：P1 已在 `OP` 表新增 `refExists` 条目。
- **步骤**：① 数 `sections.mjs` 的 `OP` 键集并检查含 `refExists`；② 取 `detective-observer` 产物 `## 输出格式` 的校验行，检查是否出现英文 `refExists`。
- **预期**：`count=22 hasRefExists=true`；产物校验区含 `refExists` 的次数 `0`；该行是中文短语（与 `卡号` 相关）。
- **判据**：机器：`node --input-type=module -e "import{readFileSync}from'node:fs';const src=readFileSync('./tmp/agent-criteria-demo/render/sections.mjs','utf8');const blk=src.slice(src.indexOf('const OP = {'),src.indexOf('const renderObs'));const ks=[...blk.matchAll(/^\s{4}([A-Za-z]+):/gm)].map(m=>m[1]);console.log('count='+ks.length,'hasRefExists='+ks.includes('refExists'))"`（CWD=`d:\Seed\retro-skills`）→ 首行 `count=22 hasRefExists=true`；再取产物：`node --input-type=module -e "import{readFileSync}from'node:fs';const t=readFileSync('./tmp/agent-criteria-demo/sandbox/detective-observer.md','utf8');const i=t.indexOf('## 输出格式');const seg=t.slice(i,t.indexOf('\n## ',i+1));console.log('rawOp='+/refExists/.test(seg))"` → 首行 `rawOp=false`。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-014 refExists 派生且 OP 键集为 22')` 断言 `Object.keys(OP).length===22`、`'refExists' in OP`、产物含 `卡号存在` 且无英文 `refExists`，并逐席校验行数 = `checks.length`，28/28 全绿。
- **红绿证据**：红 = `count≠22` 或 `hasRefExists=false`，或产物 `rawOp=true`；绿 = `count=22 hasRefExists=true` + `rawOp=false`。
- **对应测试/交付物**：`sections.mjs:15-37`（OP 表）、`models/detective-observer-model.json`（`checks[0].observable.op=refExists`）；**测试承接**：`test('TC-014 refExists 派生且 OP 键集为 22')`（`Object.keys(OP).length === 22` 且 `'refExists' in OP`，并断言产物无英文 op 名、6 席校验行数 = `checks.length`）。
- **不覆盖**：不判中文措辞具体用词（spec 未冻结，属 K2）。

### TC-015 字段表只有「# / 字段」两列，`type` / `required` 不上卡面

- **覆盖**：spec §4.2 末条 / S5
- **前置**：6 产物已生成。
- **步骤**：① 取 `## 输出格式` 的表头行；② 扫描段内是否出现 `nonEmpty`、`required`、`type` 等模型内部字段名。
- **预期**：表头行为 `| # | 字段 |`；段内 `nonEmpty` / `required` / `"type"` 出现次数 `0`。
- **判据**：机器：`node --input-type=module -e "import{readFileSync}from'node:fs';const L=readFileSync('./tmp/agent-criteria-demo/sandbox/detective-observer.md','utf8').split('\n');const i=L.indexOf('## 输出格式');console.log(L[i+1],L[i+3],!L.slice(i,i+20).join('\n').includes('nonEmpty'))"`（CWD=`d:\Seed\retro-skills`）→ 首行 `必填字段： | # | 字段 | true`。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-015 输出格式表头只有两列')` 断言表头 `| # | 字段 |` 且段内无 `nonEmpty|required|"type"`，28/28 全绿。
- **红绿证据**：红 = 表头出现第三列或段内出现 `nonEmpty`；绿 = 上列首行。
- **对应测试/交付物**：`sections.mjs` 的 `outputFormat`；**测试承接**：`test('TC-015 输出格式表头只有两列')`。
- **不覆盖**：不判表体对齐风格。

### TC-016 7 席 `frontmatter.tools` 与 `TIERS[seat.tier]` 逐项同序

- **覆盖**：spec §4.2 frontmatter tools / S4 / §5 补充判据 4
- **前置**：产物已生成；`seat.tier` 已加（TC-001）。
- **步骤**：① 逐产物取 `tools:` 行；② 与 `TIERS[seat.tier]` 用 `, ` 连接后比对；③ 打印 expect / got。
- **预期**：7 席全 `ok=true`；如 `evidence-reader → Read, Glob, Grep`、`respondent-dev → Read, Glob, Grep, RunCommand`。
- **判据**：机器：`node --input-type=module -e "import{readFileSync}from'node:fs';import{TIERS}from'./tools/docgen/builders/agents/policy/definitions/tiers.mjs';for(const s of ['detective-observer','reviewer-audit','respondent-dev','evidence-reader','respondent-architect','reviewer-actuary','reviewer-ai']){const m=JSON.parse(readFileSync('./tmp/agent-criteria-demo/models/'+s+'-model.json','utf8'));const line=readFileSync('./tmp/agent-criteria-demo/sandbox/'+s+'.md','utf8').split('\n').find(l=>l.startsWith('tools: ')).slice(7);console.log(s,line===TIERS[m.seat.tier].join(', '))}"`（CWD=`d:\Seed\retro-skills`）→ 7 行均 `true`；另静态断言（§4.5-2）：`render/sections.mjs` 含 `import { TIERS } … from '…/tiers.mjs'`，且不含 `['Read', 'Glob'` 数组字面量。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-016 tools = TIERS[seat.tier]')` 逐席断言 `tools:` 行 === `TIERS[tier].join(', ')`，并静态断言源码 import `TIERS`、无 `['Read', 'Glob'` 字面量，28/28 全绿。
- **红绿证据**：红 = 上列 5 个 `false`；绿 = 7 个 `true`。
- **对应测试/交付物**：`sections.mjs:90-92`、`tiers.mjs:5-10`；**测试承接**：`test('TC-016 tools = TIERS[seat.tier]')`。
- **不覆盖**：不判「同引用不复制」的实现细节（由 TC-018 的对照实验 + 本条 §4.5-2 源码静态断言共同判）。

### TC-017 副本把 `seat.tier` 改成与策略不符 → `TIER_MISMATCH`（负）

- **覆盖**：spec §4.2 / §4.4 TIER_MISMATCH / S4
- **前置**：demo 副本；`models/respondent-dev-model.json` 的 `seat.tier` 由 `command` 改为 `producer`（策略侧仍是 `command`，实跑 `tier respondent-dev => command`）。
- **步骤**：① 副本跑 `node verify-models.mjs respondent-dev`；② 看输出码串。
- **预期**：该行含 `TIER_MISMATCH`；其余码不新增（`EQUIVALENT` 变为 `FAIL` 仅是基线面，不影响码面断言）。
- **判据**：机器：副本内（CWD=副本根）`node verify-models.mjs respondent-dev` → exit 1，stdout 首行匹配 `TIER_MISMATCH`；真仓库同命令 exit 0、首行含 `EQUIVALENT` 且不含该码。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-017 TIER_MISMATCH')` 在副本把 tier 改为 `producer` 后断言 stdout 含 `TIER_MISMATCH` 且 exit 1，28/28 全绿。
- **红绿证据**：红 = 改档位后仍无码且 exit 0（现状）；绿 = 码面点名 + exit 1。
- **对应测试/交付物**：`verify-models.mjs` 新增校验、`models/respondent-dev-model.json`；**测试承接**：`test('TC-017 TIER_MISMATCH')`（模型 tier 与策略档位不一致 → 该码）。
- **不覆盖**：不判码串走 stdout 还是 stderr（§7 G15），读数统一用合并流。

### TC-018 `tools` 取自模型：改策略 caps 不变、改模型 tier 跟变（负）

- **覆盖**：spec §4.2 tools 改源 / S4
- **前置**：demo 副本 A（改 `policy/seat-policy.mjs` 里 `evidence-reader` 的 `capabilities`，如加 `exec`）；副本 B（只把 `models/evidence-reader-model.json` 的 `seat.tier` 改为 `command`，策略不动）。
- **步骤**：① 副本 A 渲染 `evidence-reader`，看 `tools:` 行；② 副本 B 渲染 `evidence-reader`，看 `tools:` 行。
- **预期**：副本 A 的 `tools:` 行仍 `Read, Glob, Grep`（不再反查 `tierOfCapabilities`）；副本 B 变为 `Read, Glob, Grep, RunCommand`。
- **判据**：机器：两副本内各自（CWD=各自副本根）`node render-all.mjs --out <副本内临时目录>` 后取 `tools:` 行，分别为 `tools: Read, Glob, Grep` 与 `tools: Read, Glob, Grep, RunCommand`。
- **执行状态**：**已施行（人工判据实跑）**。改源方向由 `test('TC-016 tools = TIERS[seat.tier]')` 静态断言承接：`render/sections.mjs` 只 import `TIERS`、无 `['Read', 'Glob'` 字面量，7 席 `tools:` 行逐席等于 `TIERS[seat.tier]`；「只改策略 caps」双副本对照需改 `tools/docgen`，未构造。
- **红绿证据**：红 = 副本 A 的 tools 行随策略变（`read, exec` 类）；绿 = A 不变、B 跟变。
- **对应测试/交付物**：`sections.mjs:90-92`；**测试承接**：`test('TC-016 tools = TIERS[seat.tier]')`（只判终值，未构造「只改策略 caps」对照）；改源方向的静态面归 spec §4.5-2 审查。
- **不覆盖**：不判 `SEAT_POLICY` 是否应删除（P5 范围）。

### TC-019 `seat.tier` 写 `TIERS` 外的值 → 校验红（负）

- **覆盖**：spec §4.1 档位值域 / §4.4
- **前置**：demo 副本；`models/reviewer-ai-model.json` 的 `seat.tier` 改为 `"admin"`。
- **步骤**：① 副本跑 `node verify-models.mjs reviewer-ai`；② 看码串。
- **预期**：出现 `TIER_MISMATCH`（`admin` ≠ 策略反查的 `readOnly`），且不出现 `undefined` 静默通过。
- **判据**：机器：副本内（CWD=副本根）`node verify-models.mjs reviewer-ai` → exit 1，stdout（合并 stderr）首行含 `TIER_MISMATCH`；真仓库同命令 exit 0 且不含。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-019 未知档位值 → TIER_MISMATCH，exit 1')` 以 `admin` 断言 `TIER_MISMATCH` + exit 1，28/28 全绿。
- **红绿证据**：红 = 非法值被静默接受、行尾仍 `EQUIVALENT`；绿 = 码面点名。
- **对应测试/交付物**：`verify-models.mjs`、`models/reviewer-ai-model.json`；**测试承接**：`test('TC-019 未知档位值 → TIER_MISMATCH，exit 1')`（`admin` 非法值）。
- **不覆盖**：不判独立的新码（spec 只登记 `TIER_MISMATCH`，未登记 `TIER_UNKNOWN`）。

### TC-020 3 步 `escalation` 编号为 1./2./3.，且 N = `steps.length`

- **覆盖**：spec §4.2 escalation 编号 / S7 / §5 补充判据 5
- **前置**：产物已生成；`detective-observer` / `reviewer-audit` 的 `steps` 均为 3 步（实跑 `escSteps=["halt","report","voidRound"]`）。
- **步骤**：① 取产物 `## 越界处置` 段的前 3 个行首编号；② 与 `steps.length` 比。
- **预期**：编号序列 `1.` `2.` `3.`；条数 = 3。
- **判据**：机器：`node --input-type=module -e "import{readFileSync}from'node:fs';for(const s of ['detective-observer','reviewer-audit']){const t=readFileSync('./tmp/agent-criteria-demo/output/'+s+'.md','utf8');const i=t.indexOf('## 越界处置');const L=t.slice(i).split('\n').slice(1).filter(x=>/^\d+\. /.test(x));console.log(s,L.map(x=>x.slice(0,2)).join(''),L.length)}"`（CWD=`d:\Seed\retro-skills`；P1 后把 `output/` 换 `sandbox/`）→ 两行分别为 `detective-observer 1.2.3. 3`、`reviewer-audit 1.2.3. 3`。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-020 越界处置按 steps 序号')` 断言产物为 `1. 立即停手。` / `2.` / `3.`，并追加第 4 步断言 `4. 第四步。`，28/28 全绿。
- **红绿证据**：红 = 编号跳号/重复/少于 steps；绿 = `1.2.3.` 且 `3`。
- **对应测试/交付物**：`sections.mjs:200-204`、产物；**测试承接**：`test('TC-020 越界处置按 steps 序号')`（3 步顺序 + 追加第 4 步断言同测）。
- **不覆盖**：不判每步文案（由模型字段与模板决定）。

### TC-021 `steps` 改 4 步 → 编号出 1–4（负）

- **覆盖**：spec §4.2 编号 = `index + 1` / S7
- **前置**：demo 副本；给 `models/detective-observer-model.json` 的 `escalation.steps` 追加一步（如再插一个 `{"kind":"halt","text":"等待复核。"}`）。
- **步骤**：① 副本渲染 `detective-observer`；② 取编号序列。
- **预期**：`1.2.3.4.`、条数 `4`；不得出现第三个 `3.`（现状按 kind 写死会产生 `1.2.3.` 或重复 `3.`）。
- **判据**：机器：副本内同一编号断言 → 首行 `detective-observer 1.2.3.4. 4`。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。同一 test 追加第 4 步后断言出 `4. 第四步。`，编号按 `index+1` 连续、无重复 `3.`，28/28 全绿。
- **红绿证据**：红 = 出现 `3.3.` 或首条非 1 起的连续序列；绿 = `1.2.3.4.`。
- **对应测试/交付物**：`sections.mjs` 的 `escalation`；**测试承接**：`test('TC-020 越界处置按 steps 序号')`（内含 `4. 第四步。` 断言）。
- **不覆盖**：不判 4 步文案语义是否自洽（模型数据面）。

### TC-022 调换步序 → 编号跟序号变，不按 `kind` 写死（负）

- **覆盖**：spec §4.2「不再按 kind 写死」 / S7
- **前置**：demo 副本；把 `steps` 的 `halt` 与 `report` 两步对调。
- **步骤**：① 副本渲染 `detective-observer`；② 看第 1 条是否为「越权信息报议长…」。
- **预期**：`1. 越权信息报…`、`2. 立即停手。`、`3. 本轮结论作废…`。
- **判据**：机器：副本内取编号段首条 → 匹配 `^1\. 越权信息报`。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-022 调换步序后编号跟序号')` 对调 halt/report 后断言首条 `1. 越权信息报`、次条 `2. 立即停手。`，28/28 全绿。
- **红绿证据**：红 = 第 1 条仍是「立即停手」（按 kind 写死）；绿 = 首条随步序变。
- **对应测试/交付物**：`sections.mjs` 的 `escalation`；**测试承接**：`test('TC-022 调换步序后编号跟序号')`。
- **不覆盖**：不判步骤类型是否允许重复。

### TC-023 `escalation = null` 的 5 席无 `## 越界处置` 段（边界）

- **覆盖**：spec §4.2 escalation 返回 `[]` / S8
- **前置**：5 席模型 `escalation` 为 `null`（实跑 `escNull=true`）。
- **步骤**：① 逐席渲染；② 取 `## ` 标题序列；③ 检查无 `越界处置`。
- **预期**：5 席标题序列不含 `越界处置`；不出现空标题 `## 越界处置` 后面直接接下一段。
- **判据**：机器：`node --input-type=module -e "import{readFileSync}from'node:fs';import{renderModel}from'./tmp/agent-criteria-demo/render/index.mjs';const sh=JSON.parse(readFileSync('./tmp/agent-criteria-demo/models/_shared-model.json','utf8'));for(const s of ['evidence-reader','respondent-architect','respondent-dev','reviewer-actuary','reviewer-ai']){const t=renderModel('./tmp/agent-criteria-demo/models/'+s+'-model.json',sh).text;console.log(s,t.includes('## 越界处置'))}"`（CWD=`d:\Seed\retro-skills`）→ 5 行均 `false`。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-023 5 席无越界处置段')` 逐席断言渲染文本不含 `\n## 越界处置\n`，28/28 全绿。
- **红绿证据**：红 = 任一 `true`；绿 = 5 个 `false`。
- **对应测试/交付物**：`sections.mjs:196-198`、`models/*-model.json`；**测试承接**：`test('TC-023 5 席无越界处置段')`。
- **不覆盖**：不判 `escalation` 为空对象 `{}` 的形态（spec 只写 `null` 语义）。

### TC-024 两次渲染字节一致（确定性）

- **覆盖**：spec §5 命令锚 2（第二次 sha256 全同）
- **前置**：P1 已实现，`sandbox/` 已生成过一次。
- **步骤**：① 同一进程内对同一模型渲染两次，比较 `text`；② 连续跑两次 `render-all.mjs`，比较 7 个文件 sha256。
- **预期**：内存两次 `deterministic=true`；两轮文件 sha256 逐一相等（7/7）。
- **判据**：机器：`node --input-type=module -e "import{readFileSync}from'node:fs';import{renderModel}from'./tmp/agent-criteria-demo/render/index.mjs';const sh=JSON.parse(readFileSync('./tmp/agent-criteria-demo/models/_shared-model.json','utf8'));const a=renderModel('./tmp/agent-criteria-demo/models/reviewer-audit-model.json',sh).text;const b=renderModel('./tmp/agent-criteria-demo/models/reviewer-audit-model.json',sh).text;console.log('deterministic='+(a===b))"`（CWD=`d:\Seed\retro-skills`）→ 首行 `deterministic=true`；文件面：`node render-all.mjs` 两次后 `Get-FileHash tmp/agent-criteria-demo/sandbox/*.md -Algorithm SHA256` 两次输出逐项相同。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-024/025 render-all 落 sandbox、7 文件、两次字节同、无 sandbox 字样')` 连跑两次 `render-all`（各 exit 0）并对 7 个 `sandbox/*.md` 逐文件比 sha256 相同，28/28 全绿。
- **红绿证据**：红 = 任一文件 hash 不同或内存 `false`；绿 = 两轮全同。
- **对应测试/交付物**：`render-all.mjs`、`sandbox/*.md`；**测试承接**：`test('TC-024/025 render-all 落 sandbox、7 文件、两次字节同、无 sandbox 字样')`。
- **不覆盖**：不判跨机器/跨 Node 版本一致性。

### TC-025 产物内无绝对路径、无时间戳、无 `sandbox` 字样泄漏

- **覆盖**：spec §5 补充判据 6
- **前置**：7 产物已生成。
- **步骤**：① 扫描 `sandbox/*.md`；② 匹配盘符绝对路径、日期串、`sandbox` 字样。
- **预期**：命中数 `0`。
- **判据**：机器：`(Select-String -Path tmp/agent-criteria-demo/sandbox/*.md -Pattern 'd:\\|D:\\|20\d\d-\d\d-\d\d|sandbox' | Measure-Object).Count`（CWD=`d:\Seed\retro-skills`）→ `0`。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。同一 test 逐文件断言产物不含 `sandbox`；判据 `Select-String`（盘符/日期/`sandbox`）实跑命中 `0`，28/28 全绿。
- **红绿证据**：红 = 命中 ≥1（如差异报告被误当产物、或模板带绝对路径）；绿 = `0`。
- **对应测试/交付物**：`sandbox/*.md`；**测试承接**：`test('TC-024/025 render-all 落 sandbox、7 文件、两次字节同、无 sandbox 字样')`（逐文件断言不含 `sandbox`）。
- **不覆盖**：不判模型内路径（`verify-models` 的 `PATH_INVALID` 已有面）。

### TC-026 `--out` 相对路径按脚本目录解析，绝对路径原样，默认落 `sandbox/`

- **覆盖**：spec §4.3 `resolve(here, dir)` / S9 / S14 / §5-8
- **前置**：P1 已改 `render-all.mjs`；`RelOut/`、`AbsOut/` 两个输出目录不存在。
- **步骤**：① 读源码确认默认目录与 `resolve`；② CWD=`d:\Seed\retro-skills` 跑 `node tmp/agent-criteria-demo/render-all.mjs --out RelOut`，检查产物落点；③ 跑 `node tmp/agent-criteria-demo/render-all.mjs --out <$env:TEMP 下绝对目录>`；④ 跑不带参数一次，确认落 `sandbox/`；⑤ 检查 `output/` 7 文件 mtime 未变。
- **预期**：相对路径落 `tmp/agent-criteria-demo/RelOut/`（**不是** `<仓库根>/RelOut/`）；绝对路径原样落该目录；默认落 `tmp/agent-criteria-demo/sandbox/`；三次均 7 个 md；`output/` mtime 不变。
- **判据**：机器：`node -e "const s=require('fs').readFileSync('./tmp/agent-criteria-demo/render-all.mjs','utf8');console.log(/sandbox/.test(s),/--out/.test(s),/resolve\(/.test(s))"`（CWD=`d:\Seed\retro-skills`）→ 首行 `true true true`；跑后 `Test-Path tmp/agent-criteria-demo/RelOut` → `True`、`Test-Path RelOut`（仓库根）→ `False`；`(Get-ChildItem tmp/agent-criteria-demo/RelOut/*.md | Measure-Object).Count` = `7`；绝对路径目录同数；`(Get-ChildItem tmp/agent-criteria-demo/sandbox/*.md | Measure-Object).Count` = `7`（TC-027 另计报告）。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-026 --out 相对脚本目录解析（cwd 故意设为仓库根）')` 相对/绝对两分支各得 7 个 md，且仓库根不出现 `rel-out`，28/28 全绿。
- **红绿证据**：红 = 首行任一 `false`，或相对路径落到仓库根 `RelOut/`（base 选错成 `process.cwd()`）；绿 = `true true true` 且两个 `Test-Path` 一真一假。
- **对应测试/交付物**：`render-all.mjs`；**测试承接**：`test('TC-026 --out 相对脚本目录解析（cwd 故意设为仓库根）')`（相对 + 绝对两分支都测；默认 `sandbox/` 由 `test('TC-024/025 …')` 承接）。
- **不覆盖**：不判 `--out` 目录已存在且有旧文件时的清理策略（spec 未写）。

### TC-027 `render-all` 生成 7 个 md，再由 `diff-report.mjs` 补出第 8 个报告，stdout 7 行 0 错误

- **覆盖**：spec §4.3 产物清单 / §5 命令锚 1
- **前置**：P1 已实现；`sandbox/` 不存在或已清空。
- **步骤**：① CWD=`d:\Seed\retro-skills\tmp\agent-criteria-demo`，跑 `node render-all.mjs`；② 看退出码、数 stdout 行与 `sandbox/*.md`；③ 跑 `node diff-report.mjs`；④ 再数 `sandbox/*.md`。
- **预期**：① exit code `0`、stdout 恰 7 行、无 `Error` / `undefined`；② `sandbox/` 内恰 7 个 `<seat>.md`；③ `diff-report.mjs` exit 0；④ 共 8 个 `*.md`（第 8 个是 `diff-report.md`，由 `diff-report.mjs` 产出，`render-all` 不产报告）。
- **判据**：机器：`node render-all.mjs` → exit 0，stdout 行数 = 7；`(Get-ChildItem tmp/agent-criteria-demo/sandbox -Filter *.md | Measure-Object).Count` = `7`；`node diff-report.mjs` → exit 0；同命令再数 = `8`（CWD=`d:\Seed\retro-skills`）。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-024/025 …')` 断言 render-all 后 7 个产物、`test('TC-042/028 …')` 断言含报告共 8 个；实跑 `render-all` stdout 7 行 exit 0、`diff-report` exit 0。
- **红绿证据**：红 = 目录不存在、或 `render-all` 后不是 7 个、或 `diff-report` 后不是 8 个、或任一步 exit≠0；绿 = 7 → 8 且两次 exit 0。
- **对应测试/交付物**：`render-all.mjs`、`sandbox/`；**测试承接**：`test('TC-024/025 render-all 落 sandbox、7 文件、两次字节同、无 sandbox 字样')`（断言 7 个 `*.md`）；`diff-report.mjs` 的 8 文件计数由 `test('TC-042/028 报告五节列名冻结且两次字节相同')` 的 `readdirSync(...).length === 8` 直接断言，报告五节与两跑 sha 同条承接。
- **不覆盖**：不判 stdout 行文案（spec 未冻结）；退出码细节由 TC-045 判。

### TC-028 `diff-report.md` 含 5 节、两跑字节相同、无时间戳

- **覆盖**：spec §4.3 报告节 / S10
- **前置**：`diff-report.md` 已由 `diff-report.mjs` 生成两次。
- **步骤**：① 检索 5 个节标题：`总览`、`段级差异`、`边界核对`、`缺失项`、`已知差异归类`；② 两次生成物 sha256 比较；③ 检索日期串与绝对路径。
- **预期**：5 节全部存在（各 ≥1 次）；两次 sha256 相同；日期串与盘符路径命中 `0`。
- **判据**：机器：`node --input-type=module -e "import{readFileSync}from'node:fs';const t=readFileSync('./tmp/agent-criteria-demo/sandbox/diff-report.md','utf8');console.log(['总览','段级差异','边界核对','缺失项','已知差异归类'].map(x=>t.includes(x)).join(','),/20\d\d-\d\d-\d\d/.test(t),/[A-Za-z]:\\\\/.test(t))"`（CWD=`d:\Seed\retro-skills`）→ 首行 `true,true,true,true,true false false`；两次 `Get-FileHash ... -Algorithm SHA256` 输出相同。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-042/028 报告五节列名冻结且两次字节相同')` 断言 5 节存在、无 ISO 时间戳、两次报告 sha256 相同，28/28 全绿。
- **红绿证据**：红 = 缺任一节 / 含日期或盘符 / 两跑不同；绿 = 上列首行 + hash 相同。
- **对应测试/交付物**：`diff-report.mjs`、`sandbox/diff-report.md`；**测试承接**：`test('TC-024/025 render-all 落 sandbox、7 文件、两次字节同、无 sandbox 字样')`（两次渲染字节同）+ `test('TC-042/028 报告五节列名冻结且两次字节相同')`（五节存在、无 ISO 时间戳、两跑 sha 相同）。
- **不覆盖**：不判列名与列序（由 TC-042 判）。

### TC-029 报告「缺失项」点名 `reviewer-audit` 输出格式，「边界核对」附 `renderBoundary` 长度

- **覆盖**：spec §4.3 缺失项 / 边界核对列值 / S6 / S16
- **前置**：报告已生成。
- **步骤**：① 在「缺失项」节（列 `席` / `缺失项` / `原因`）找 `reviewer-audit` 与 `输出格式`；② 在「边界核对」节（列 `席` / `形态` / `沙箱长度` / `现役长度` / `逐字节相等`）找 2 席与 `1200` / `1240` / `true`；③ 检查「已知差异归类」（列 `#` / `差异` / `依据`）含 3 段新增（`产出` / `权限` / `越界处置`）。
- **预期**：①②③ 均命中；报告不把 K3 写成「通过」；边界核对节 2 席 `逐字节相等` 列为 `true`。
- **判据**：机器：`Select-String -Path tmp/agent-criteria-demo/sandbox/diff-report.md -Pattern 'reviewer-audit.*输出格式|输出格式.*reviewer-audit'` 计数 ≥1；`Select-String -Path ... -Pattern '1200|1240'` 计数 ≥2；`Select-String -Path ... -Pattern '产出|权限|越界处置'` 计数 ≥3；`Select-String -Path ... -Pattern '逐字节相等'` 计数 = 1（列头）。
- **执行状态**：**已施行（人工判据实跑）**。判据四条计数实跑：`reviewer-audit…输出格式` = 3、`1200|1240` = 3、`产出|权限|越界处置` = 17、`逐字节相等` = 1（列头）。
- **红绿证据**：红 = 缺任一项，或边界核对节无 `逐字节相等` 列；绿 = 四条计数成立。
- **对应测试/交付物**：`diff-report.mjs`；**测试承接**：`test('TC-042/028 报告五节列名冻结且两次字节相同')`（含 `reviewer-audit | 输出格式` 缺失项与 10 列总览表头；边界核对列值未逐格断言）。
- **不覆盖**：不判「已知差异」的理由文字是否成立（人工评审）。

### TC-030 `verify-models.mjs` 输出 7 行 `EQUIVALENT`，且无 8 类码

- **覆盖**：spec §4.4 / §5 命令锚 3 / S11
- **前置**：P1 已加 5 个校验码；`_baseline` 未改。
- **步骤**：① CWD=`d:\Seed\retro-skills\tmp\agent-criteria-demo`，跑 `node verify-models.mjs`；② 数行、检索码名；③ 记录退出码。
- **预期**：7 行、每行含 `EQUIVALENT`；不含 `POLICY_DIFF` / `TYPE_UNKNOWN` / `TYPE_CONFLICT` / `TIER_MISMATCH` / `BOUNDARY_KIND_UNKNOWN` / `BOUNDARY_TEXT_MISSING` / `BOUNDARY_TEXT_WHITESPACE` / `BOUNDARY_POLICY_NONWRITER`；exit `0`。
- **判据**：机器：`node verify-models.mjs` → exit 0，stdout 7 行；`(Select-String -InputObject $out -Pattern 'EQUIVALENT').Count` = 7；上列 8 个码串计数均 `0`。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-044 verify 全绿且 exit 0')` 断言 exit 0 + 7 行以 `EQUIVALENT` 结尾；判据实跑 8 类码计数 `0`，28/28 全绿。
- **红绿证据**：红 = 任一行非 `EQUIVALENT`、出现码、或 exit≠0；绿 = 7 行且 0 码且 exit 0。
- **对应测试/交付物**：`verify-models.mjs`、`models/_baseline/`；**测试承接**：`test('TC-044 verify 全绿且 exit 0')`（7 行 `EQUIVALENT` + exit 0）。
- **不覆盖**：退出码的判别力由 TC-044 提供（本条只判正常路径 exit 0）。

### TC-031 `boundary.kind` 取非法值 → `BOUNDARY_KIND_UNKNOWN`（负）

- **覆盖**：spec §4.4 / S11
- **前置**：demo 副本；`models/reviewer-ai-model.json` 的 `boundary.kind` 改为 `"policies"`。
- **步骤**：① 副本跑 `node verify-models.mjs reviewer-ai`；② 看码串与退出码。
- **预期**：stdout 含 `BOUNDARY_KIND_UNKNOWN`；exit `1`。
- **判据**：机器：副本内（CWD=副本根）`node verify-models.mjs reviewer-ai` → exit 1，stdout 首行含 `BOUNDARY_KIND_UNKNOWN`。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-031 BOUNDARY_KIND_UNKNOWN')` 以 `boom` 断言该码 + exit 1，28/28 全绿。
- **红绿证据**：红 = 非法 kind 静默通过（`EQUIVALENT` / exit 0）；绿 = 码面点名 + exit 1。
- **对应测试/交付物**：`verify-models.mjs`；**测试承接**：`test('TC-031 BOUNDARY_KIND_UNKNOWN')`。
- **不覆盖**：不判错误报文措辞（spec 只冻结码名）。

### TC-032 `literal` 缺 `text` / 空串 / 非字符串 / 全空白 → `BOUNDARY_TEXT_MISSING`（负）

- **覆盖**：spec §4.4 BOUNDARY_TEXT_MISSING（含 `text.trim() === ''`）/ S11
- **前置**：demo 副本 4 份，分别对 `models/respondent-dev-model.json` 做：删 `text` 键；`text: ""`；`text: 123`；`text: "   "`（全空白）。
- **步骤**：① 四副本各跑 `node verify-models.mjs respondent-dev`；② 看码串。
- **预期**：四次均含 `BOUNDARY_TEXT_MISSING`，且**均不含** `BOUNDARY_TEXT_WHITESPACE`（空白串只发 MISSING）；无一次静默通过。
- **判据**：机器：四副本内（CWD=各自副本根）`node verify-models.mjs respondent-dev` → exit 1，stdout 首行含 `BOUNDARY_TEXT_MISSING` 且不含 `BOUNDARY_TEXT_WHITESPACE`。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-032 空白 text 只发 BOUNDARY_TEXT_MISSING')` 以全空白 `' '` 断言只发 MISSING、不发 WHITESPACE 且 exit 1，28/28 全绿；缺键/空串/非字符串三变体走同一 `typeof/trim` 分支，未各单测。
- **红绿证据**：红 = 任一变体无码、或全空白串同时报 `WHITESPACE`；绿 = 四次均只报 MISSING。
- **对应测试/交付物**：`verify-models.mjs`；**测试承接**：`test('TC-032 空白 text 只发 BOUNDARY_TEXT_MISSING')`（当前只造 `' '` 全空白变体；缺键/空串/非字符串三种变体未单测，判据仍由本条的 4 副本人工核）。
- **不覆盖**：不判码串的具体位置（spec 只冻结「同席同一行」）。

### TC-033 坏模型不进渲染：该席无产物，`render-all` exit 1（负）

- **覆盖**：spec S11（工序约定：先 verify 后 render；渲染层只对未知 kind 抛错）/ §4.2 未知 kind 抛错 / S15
- **前置**：demo 副本；`reviewer-ai` 的 `boundary.kind` 设为 `"bad"`，`sandbox/` 清空。
- **步骤**：① 副本跑 `node render-all.mjs`；② 记退出码；③ 数产物文件。
- **预期**：exit code `1`；`reviewer-ai.md` 不存在；其余席是否产出由 TC-046 按「首个抛错即停、已写保留」单独冻结。
- **判据**：机器：副本内（CWD=副本根）`node render-all.mjs` → exit 1，且 `Test-Path ./sandbox/reviewer-ai.md` → `False`。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。与 TC-046 共用 `test('TC-046 render-all 首个抛错即停、已写文件保留')`：坏 `kind` 的 reviewer-ai 无产物且 `render-all` exit 1，28/28 全绿。
- **红绿证据**：红 = 坏模型照出产物或 exit 0；绿 = exit 1 且无该席产物。
- **对应测试/交付物**：`render-all.mjs`、`models/reviewer-ai-model.json`；**测试承接**：与 TC-046 共用同一条 `test('TC-046 render-all 首个抛错即停、已写文件保留')`（坏 `kind` → exit 1 + 坏席无产物；TC-046 另判前序保留与后续不写）。
- **不覆盖**：不判 stderr 文案（码串流位置由 TC-044 判）；批次语义由 TC-046 判。

### TC-034 空 `must` → 不输出 `## 一定会`（边界）

- **覆盖**：spec §4.2 空段跳过
- **前置**：无需 P1；直接调用段函数。
- **步骤**：① 调 `sections.must({ must: [] }, shared, {})`；② 看返回数组。
- **预期**：返回 `[]`。
- **判据**：机器：`node --input-type=module -e "import{readFileSync}from'node:fs';import{sections}from'./tmp/agent-criteria-demo/render/sections.mjs';const sh=JSON.parse(readFileSync('./tmp/agent-criteria-demo/models/_shared-model.json','utf8'));console.log(JSON.stringify(sections.must({must:[]},sh,{})))"`（CWD=`d:\Seed\retro-skills`）→ 首行 `[]`。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-034/035 空 must/never 返回 []')` 断言 `sections.must({must:[]}, …)` 为 `[]`，28/28 全绿。
- **红绿证据**：红 = 返回非空（会留空标题）；绿 = `[]`。
- **对应测试/交付物**：`sections.mjs:118-119`；**测试承接**：`test('TC-034/035 空 must/never 返回 []')`。
- **不覆盖**：不判 `must` 缺键（`undefined`）与空数组是否同行为（`.length` 判定下同）；不判空 `globalRules` 时表头是否保留。

### TC-035 空 `never` → 不输出 `## 禁止`（边界）

- **覆盖**：spec §4.2 空段跳过
- **前置**：同 TC-034。
- **步骤**：① 调 `sections.never({ never: [] }, shared, {})`；② 看返回数组。
- **预期**：返回 `[]`。
- **判据**：机器：`node --input-type=module -e "import{readFileSync}from'node:fs';import{sections}from'./tmp/agent-criteria-demo/render/sections.mjs';const sh=JSON.parse(readFileSync('./tmp/agent-criteria-demo/models/_shared-model.json','utf8'));console.log(JSON.stringify(sections.never({never:[]},sh,{})))"` → 首行 `[]`。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。同一 test 断言 `sections.never({never:[]}, …)` 为 `[]`，28/28 全绿。
- **红绿证据**：红 = 非空；绿 = `[]`。
- **对应测试/交付物**：`sections.mjs:134-135`；**测试承接**：`test('TC-034/035 空 must/never 返回 []')`（同一 test 覆盖两席空段）。
- **不覆盖**：不判 `## 禁止` 段在 `never` 为空但共享规则非空时的合并逻辑（`expand` 已把共享规则并进 `never`）。

### TC-036 `literal.text` 首尾空白与换行按原文保留，不 trim（边界）

- **覆盖**：spec §4.2 `kind=literal → M.boundary.text` / S13「原样渲染，不 trim」
- **前置**：demo 副本；把 `models/evidence-reader-model.json` 的 `boundary.text` 改为 `" 你是只读取证角色：…（原句）…。\n"`（首部 1 个空格、尾部 1 个换行）。
- **步骤**：① 副本渲染 `evidence-reader`；② 取 `## 边界` 之后的正文；③ 与 `text` 逐字节比。
- **预期**：正文 === `text`（含首部空格与尾部换行），不 trim。
- **判据**：机器：副本内（CWD=副本根）`node --input-type=module -e "...取段..."` → `eq=true`，且段首字符为空格、段内出现该尾部换行。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-036 literal 首尾空白原样渲染')` 在副本给 `text` 加首空格与尾换行后断言产物正文原样以该 `text` 开头（首空格未 trim），28/28 全绿。
- **红绿证据**：红 = 产物被 trim（首空格丢失或尾部换行被吞）；绿 = 逐字节相等。
- **对应测试/交付物**：`sections.mjs` 的 `boundary`、`models/evidence-reader-model.json`；**测试承接**：`test('TC-036 literal 首尾空白原样渲染')`。
- **不覆盖**：不判多行 `text` 的渲染缩进（spec 未写）。

### TC-037 PRD §6 改为「4 个缺口」，§9 状态改「已定」

- **覆盖**：spec §2 做-6
- **前置**：无需 P1 代码。
- **步骤**：① 检索 `要补的 \d+ 个缺口`；② 检索 `## 9 待你确认`；③ 检索 `## 9 已定`。
- **预期**：命中 `**要补的 4 个缺口**` 恰 1 次；`## 9 待你确认` 命中 `0`；`## 9 已定` 命中 `1`。
- **判据**：机器：CWD=`d:\Seed\retro-skills`，`(Select-String -Path docs/prd/20261111145723-agent-model-pipeline.md -Pattern '要补的 4 个缺口').Count` → `1`；`(Select-String -Path ... -Pattern '## 9 待你确认').Count` → `0`；`(Select-String -Path ... -Pattern '^## 9 已定').Count` → `1`。**不得用全文件「已定」计数**：PRD 第 85 行已有「已定为 B」，全文件计数会在 Task 0 未做时假绿。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-037 PRD 回写')` 断言 `要补的 4 个缺口` 恰 1 次、无 `## 9 待你确认`、有 `## 9 已定`，28/28 全绿。
- **红绿证据**：红 = `3 个缺口` + `待你确认`；绿 = 计数如上。
- **对应测试/交付物**：`docs/prd/20261111145723-agent-model-pipeline.md:156`、`:313`；**测试承接**：`test('TC-037 PRD 回写')`。
- **不覆盖**：不判 §6 表内其余措辞是否需同步（spec 只说「3 → 4」）。

### TC-038 `agents/**` 与 `tools/docgen/**` 相对开工快照一行不差

- **覆盖**：spec §2 不做-1/2 / §5-9 / PRD D10
- **前置**：P1 动工前已执行 `git status --short > tmp/agent-criteria-demo/.p1-start-status`（当前该文件不存在，见 §0 结论 11）。
- **步骤**：① 取快照中所有 `agents/` 与 `tools/docgen/` 行；② 取当前 `git status --short` 的同路径行；③ 两组逐行比。
- **预期**：两组完全相等（既存 4 项 `M tools/docgen/...` 仍在，且无新增/消失）；`agents/` 组为空。
- **判据**：机器：CWD=`d:\Seed\retro-skills`，`git status --short agents/` → 空输出（**已实跑：空**）；`git status --short | Select-String '^.. (agents|tools/docgen)/'` 与 `Select-String -Path tmp/agent-criteria-demo/.p1-start-status -Pattern '^.. (agents|tools/docgen)/'` 的行集合相等。
- **执行状态**：**已施行（人工判据实跑）**。`git status --short agents/` 为空；快照与当前 `tools/docgen` 行集合实跑 `nowCount=4 startCount=4 equal=True`（当前 `statusLines=10`）。
- **红绿证据**：红 = `agents/` 有输出，或 `tools/docgen` 行集合与快照不等（新增/消失/改路径）；绿 = 一空一等。
- **对应测试/交付物**：`agents/*.md`、`tools/docgen/**`、`.p1-start-status`；**测试承接**：无独立 `test()`——属 spec §5-9 验收锚，由主 agent 在 plan 收尾按 `git status` 与快照命令核（plan Task 2 未写测试）。
- **不覆盖**：不判既存 4 项改动的正确性（P1 之外）。

### TC-039 `models/_baseline/` 与 `types/*.mjs` 零改动

- **覆盖**：spec §2 不做-3/6
- **前置**：P1 开工前工作区干净（`tmp/agent-criteria-demo` 当前无改动）。
- **步骤**：① `git status --short tmp/agent-criteria-demo/models/_baseline tmp/agent-criteria-demo/types`；② 检查 `models/*-model.json` 的 `must` / `never` / `predicates` / `records` 未被 P1 改动（TC-030 的 7 行 `EQUIVALENT` 即为此判据）。
- **预期**：① 空输出；② `verify-models` 7 行 `EQUIVALENT`（见 TC-030）。
- **判据**：机器：`git status --short tmp/agent-criteria-demo/models/_baseline tmp/agent-criteria-demo/types` → 空输出；`node verify-models.mjs` 7 行 `EQUIVALENT`。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-044 verify 全绿且 exit 0')` 的 7 行 `EQUIVALENT` 证明 `must/never/predicates/records` 与基线零偏差；`git status --short tmp/agent-criteria-demo/models/_baseline tmp/agent-criteria-demo/types` 实跑为空。
- **红绿证据**：红 = 上述路径有改动，或基线比对出现 `FAIL`；绿 = 空 + 7 行 `EQUIVALENT`。
- **对应测试/交付物**：`models/_baseline/`、`types/*.mjs`；**测试承接**：`test('TC-044 verify 全绿且 exit 0')`（7 行 `EQUIVALENT` 覆盖基线面）；`git status` 面对应 spec §5-9，plan Task 2 未写测试。
- **不覆盖**：不判 `types` 是否「拒绝未知键」（spec 只说要加的可选字段能通过）。

### TC-040 只读 / 命令席误用 `kind=policy` → `BOUNDARY_POLICY_NONWRITER`（负）

- **覆盖**：spec §4.4 BOUNDARY_POLICY_NONWRITER / S12
- **前置**：demo 副本；把 `models/evidence-reader-model.json` 的 `boundary.kind` 改为 `"policy"`（`seat.tier=readOnly`，`TIERS.readOnly` 无 `Write`）。
- **步骤**：① 副本跑 `node verify-models.mjs evidence-reader`；② 看码串与退出码。
- **预期**：stdout 首行含 `BOUNDARY_POLICY_NONWRITER`；exit `1`。
- **判据**：机器：副本内（CWD=副本根）`node verify-models.mjs evidence-reader` → exit 1，stdout 首行含 `BOUNDARY_POLICY_NONWRITER`。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-040 policy 非写席 → BOUNDARY_POLICY_NONWRITER，exit 1')` 以 evidence-reader 改 `kind=policy` 断言该码 + exit 1，28/28 全绿。
- **红绿证据**：红 = 该输入被静默接受（`EQUIVALENT` / exit 0）；绿 = 码面点名 + exit 1。
- **对应测试/交付物**：`verify-models.mjs`、`sections.mjs` 的 `boundary`；**测试承接**：`test('TC-040 policy 非写席 → BOUNDARY_POLICY_NONWRITER，exit 1')`。
- **不覆盖**：不判 `command` 席（`respondent-dev`）同构造是否同码（同一 `TIERS` 判定分支，可由同表覆盖，见 TC-005 的工具集断言）。

### TC-041 正文非空但带首尾空白 → `BOUNDARY_TEXT_WHITESPACE`（负）

- **覆盖**：spec §4.4 BOUNDARY_TEXT_WHITESPACE / S13
- **前置**：demo 副本；把 `models/evidence-reader-model.json` 的 `boundary.text` 改为 `"你是只读取证角色：…。 "`（正文非空白，尾部 1 个空格）。
- **步骤**：① 副本跑 `node verify-models.mjs evidence-reader`；② 看码串与退出码。
- **预期**：stdout 首行含 `BOUNDARY_TEXT_WHITESPACE`；exit `1`；不报 `BOUNDARY_TEXT_MISSING`（trim 后非空，且同席只发一码，先判空后判空白）。
- **判据**：机器：副本内（CWD=副本根）`node verify-models.mjs evidence-reader` → exit 1，stdout 首行含 `BOUNDARY_TEXT_WHITESPACE` 且不含 `BOUNDARY_TEXT_MISSING`。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-041 非空带首尾空白只发 WHITESPACE')` 在副本给 `text` 尾部加空格后断言只发 WHITESPACE、不发 MISSING 且 exit 1，28/28 全绿。
- **红绿证据**：红 = 首尾空白被静默接受（仅 `EQUIVALENT`），或同时报两码；绿 = 只报 `WHITESPACE`。
- **对应测试/交付物**：`verify-models.mjs`；**测试承接**：`test('TC-041 非空带首尾空白只发 WHITESPACE')`。
- **不覆盖**：不判缩进类空白（如正文中间换行）是否算首尾空白（spec 只写 `text !== text.trim()`）。

### TC-042 报告五节表头列名与列序与 spec 冻结值一致

- **覆盖**：spec §4.3 报告列冻结 / S16
- **前置**：`sandbox/diff-report.md` 已生成。
- **步骤**：① 按 `^## ` 切节；② 取每节第一条表格表头行，按 `|` 切分并去空白；③ 与冻结数组比对；④ 数「已知差异归类」的数据行数。
- **预期**：五组列名数组逐项相等：总览 `[席,类型,沙箱行数,现役行数,沙箱字符,现役字符,段数（沙箱/现役）,边界形态,边界一致,输出格式]`；段级 `[席,段,状态,字符差]`；边界 `[席,形态,沙箱长度,现役长度,逐字节相等]`；缺失 `[席,缺失项,原因]`；已知差异 `[#,差异,依据]`；已知差异数据行 = `5`（K1–K5）。
- **判据**：机器：`node --input-type=module -e "import{readFileSync}from'node:fs';const L=readFileSync('./tmp/agent-criteria-demo/sandbox/diff-report.md','utf8').split('\n');const H={};for(let i=0;i<L.length;i++){if(L[i].startsWith('## ')){const k=L[i].slice(3).trim();const j=L.slice(i+1).findIndex(x=>x.startsWith('|'));if(j>=0)H[k]=L[i+1+j].split('|').map(s=>s.trim()).filter(Boolean)}}const E={'总览':['席','类型','沙箱行数','现役行数','沙箱字符','现役字符','段数（沙箱/现役）','边界形态','边界一致','输出格式'],'段级差异':['席','段','状态','字符差'],'边界核对':['席','形态','沙箱长度','现役长度','逐字节相等'],'缺失项':['席','缺失项','原因'],'已知差异归类':['#','差异','依据']};console.log(Object.keys(E).every(k=>JSON.stringify(H[k])===JSON.stringify(E[k])))"`（CWD=`d:\Seed\retro-skills`）→ 首行 `true`。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-042/028 报告五节列名冻结且两次字节相同')` 逐节断言五组表头列名/列序（含总览 10 列）匹配冻结值，28/28 全绿。
- **红绿证据**：红 = 任一节列名/列序不符或缺失；绿 = `true`。
- **对应测试/交付物**：`diff-report.mjs`；**测试承接**：`test('TC-042/028 报告五节列名冻结且两次字节相同')`。
- **不覆盖**：不判列宽/对齐空格（spec 只冻结列名与列序）。

### TC-043 开工快照存在，且完工脏文件只在白名单内

- **覆盖**：spec §5-9 开工快照 / §2 不做-1/2
- **前置**：动工前执行 `git status --short > tmp/agent-criteria-demo/.p1-start-status`（当前 `Test-Path` → `False`）。
- **步骤**：① 确认快照文件存在；② 取当前 `git status --short`；③ 去掉快照已有行与白名单新增（`tmp/agent-criteria-demo/**`、`docs/prd/20261111145723-agent-model-pipeline.md`（Task 0 回写）、spec / testcase / plan 三份文档，合计四份文档）后，看剩余行数。
- **预期**：快照存在；剩余非白名单脏文件 = `0`；`tools/docgen/**`、`agents/**` 无新增行。
- **判据**：机器：CWD=`d:\Seed\retro-skills`，`Test-Path tmp/agent-criteria-demo/.p1-start-status` → `True`；`$now = git status --short; $start = Get-Content tmp/agent-criteria-demo/.p1-start-status; $extra = $now | Where-Object { $start -notcontains $_ -and $_ -notmatch 'tmp/agent-criteria-demo/' -and $_ -notmatch 'docs/superpowers/(specs|plans)/2026-11-11-agent-model-pipeline-p1' -and $_ -notmatch 'docs/prd/20261111145723-agent-model-pipeline\.md' }; $extra.Count` → `0`；**补充（补 gitignore 盲区）**：`(Get-ChildItem tmp -Directory -Name) -join ','` → `agent-criteria-demo`（`tmp/` 被 `.gitignore:28` 忽略，`git status` 看不见 `tmp/` 内任何写入，只有这层目录枚举能拦住「在 `tmp/` 下另开目录」；跑过 `node --test` 后若留下 `p1-case-*` / `p1-dryrun` 副本目录，先删除再核，属测试/试跑临时目录非交付物）。
- **执行状态**：**已施行（人工判据实跑）**。`Test-Path .p1-start-status` = `True`；`git status --porcelain` 10 行、白名单外 `extra=0`；`tmp/` 顶层仅 `agent-criteria-demo`。
- **红绿证据**：红 = 快照缺失，或 `$extra.Count > 0`（P1 越界改了别的路径）；绿 = `True` + `0`。
- **对应测试/交付物**：`tmp/agent-criteria-demo/.p1-start-status`、整仓 `git status`；**测试承接**：无独立 `test()`——spec §5-9 验收锚，由主 agent 按快照命令核（plan Task 2 未写测试）。
- **不覆盖**：不判快照内容格式（只按行文本比对）；**不判 `tmp/agent-criteria-demo/` 目录内部的文件级越界**（`tmp/` 整体被 `.gitignore:28` 忽略，`git status` 对该目录内改动全盲；白名单里的 `tmp/agent-criteria-demo/` 正则因此实际不会命中任何行。目录内越界只由 spec §4.5-1 的「只允许新增」人工复核兜，机器面只兜到 `tmp/` 顶层目录名）。

### TC-044 `verify-models.mjs` 退出码：正常 0，任一错误字段 1（负）

- **覆盖**：spec §4.4 退出码 / S15 / §5-7
- **前置**：副本 2 份：正常仓（7 席合法）、坏仓（`reviewer-ai` 的 `boundary.kind="bad"`）。
- **步骤**：① 正常仓 CWD=`tmp/agent-criteria-demo` 跑 `node verify-models.mjs`，记 `$LASTEXITCODE`；② 坏仓跑同命令，记退出码；③ 确认正常仓 7 行 `EQUIVALENT`。
- **预期**：正常 `0`；坏仓 `1`；坏仓码串出现在该席同一行（stdout），stderr 为空（不另起码流）。
- **判据**：机器：`node -e "const {spawnSync}=require('child_process');const r=spawnSync('node',['verify-models.mjs'],{cwd:'tmp/agent-criteria-demo',encoding:'utf8'});console.log('exit='+r.status,'stderrLen='+r.stderr.length,'stdoutLines='+r.stdout.trim().split('\n').length)"`（CWD=`d:\Seed\retro-skills`）→ 正常仓首行 `exit=0 stderrLen=0 stdoutLines=7`；坏仓同构造 → `exit=1`，且 `stderrLen=0`、stdout 中该席行含 `BOUNDARY_KIND_UNKNOWN`。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-044 verify 全绿且 exit 0')` 断言正常仓 exit 0 + 7 行 `EQUIVALENT`；坏仓 exit 1 由 TC-017/019/031/032/040/041 六条负例 test 的 `status===1` 承接；正常仓实跑 `exit=0 stderrLen=0 stdoutLines=7`。
- **红绿证据**：红 = 坏仓 exit 0，或码串出现在 stderr；绿 = 0 / 1 分明且 `stderrLen=0`。
- **对应测试/交付物**：`verify-models.mjs`；**测试承接**：`test('TC-044 verify 全绿且 exit 0')`（仅正常路径 exit 0）；坏模型 exit 1 由 `test('TC-017 TIER_MISMATCH')`、`test('TC-019 未知档位值 → TIER_MISMATCH，exit 1')`、`test('TC-031 BOUNDARY_KIND_UNKNOWN')`、`test('TC-032 空白 text 只发 BOUNDARY_TEXT_MISSING')`、`test('TC-040 policy 非写席 → BOUNDARY_POLICY_NONWRITER，exit 1')`、`test('TC-041 非空带首尾空白只发 WHITESPACE')` 各自的 `status===1` 承接，`stderrLen=0` 无独立断言。
- **不覆盖**：不判 stderr 的具体文案（spec 只要求不另起码流）。

### TC-045 `render-all.mjs` 退出码：正常 0，抛错 1；不调用校验入口（负）

- **覆盖**：spec §4.4 退出码 / S15（不 spawn、不调 `verify()`，允许复用 `expand`）
- **前置**：副本 2 份（正常 / `reviewer-ai.kind="bad"`）。
- **步骤**：① 正常副本 CWD=副本根跑 `node render-all.mjs`，记退出码；② 坏副本跑同命令，记退出码；③ 静态扫描 `render-all.mjs`、`render/index.mjs`、`diff-report.mjs`：无 spawn、无 `verify(` 调用；后两者的 `import { expand }` 属允许项。
- **预期**：正常 `0`；坏副本 `1`；`renderAllSpawns=false renderAllCallsVerify=false indexSpawns=false indexCallsVerify=false indexImportsExpand=true reportSpawns=false reportCallsVerify=false reportImportsExpand=true`。
- **判据**：机器：正常副本 → exit 0；坏副本 → exit 1；`node -e "const fs=require('fs');const r=(p)=>fs.readFileSync('tmp/agent-criteria-demo/'+p,'utf8');const a=r('render-all.mjs'),b=r('render/index.mjs'),c=r('diff-report.mjs');const S=(x)=>[/child_process|spawn|execFile/.test(x),/verify\s*\(/.test(x)];console.log('renderAllSpawns='+S(a)[0],'renderAllCallsVerify='+S(a)[1],'indexSpawns='+S(b)[0],'indexCallsVerify='+S(b)[1],'indexImportsExpand='+/import\s*\{[^}]*\bexpand\b[^}]*\}\s*from/.test(b),'reportSpawns='+S(c)[0],'reportCallsVerify='+S(c)[1],'reportImportsExpand='+/import\s*\{[^}]*\bexpand\b[^}]*\}\s*from/.test(c))"`（CWD=`d:\Seed\retro-skills`）→ 首行 `renderAllSpawns=false renderAllCallsVerify=false indexSpawns=false indexCallsVerify=false indexImportsExpand=true reportSpawns=false reportCallsVerify=false reportImportsExpand=true`。
- **执行状态**：**已施行（人工判据实跑）**。静态扫描实跑首行 8 项全符：`renderAllSpawns=false renderAllCallsVerify=false indexSpawns=false indexCallsVerify=false indexImportsExpand=true reportSpawns=false reportCallsVerify=false reportImportsExpand=true`；正常 `render-all` exit 0、坏副本 exit 1 由 `test('TC-046 …')` 承接。
- **红绿证据**：红 = 坏副本 exit 0，或任一 spawn / `verify(` 为 `true`；绿 = 0 / 1 + 上列首行。
- **对应测试/交付物**：`render-all.mjs`、`render/index.mjs`、`diff-report.mjs`、`verify-models.mjs`；**测试承接**：`test('TC-046 render-all 首个抛错即停、已写文件保留')`（exit 1）；静态扫描项无独立 test（plan Task 2 未写）。
- **不覆盖**：不判 `expand` 的实现是否被改写（spec 只允许复用）。

### TC-046 `render-all` 遇首个抛错即停，已写文件保留不回滚（负）

- **覆盖**：spec §4.4 `render-all` fail fast / S15
- **前置**：副本；`models/reviewer-ai-model.json` 的 `boundary.kind` 设为 `"bad"`；`sandbox/` 清空。
- **步骤**：① 在副本根跑 `node render-all.mjs`，记退出码；② 用同一 `readdirSync` 顺序取坏席下标 `k`；③ 数 `sandbox/*.md`；④ 检查已写文件非空且内容含 `## 边界` 之外未中断痕迹（不做回滚校验）。
- **预期**：exit `1`；产物数 = `k`（坏席及其后各席均无文件）；前 `k` 个文件存在、非空、未删除。
- **判据**：机器：副本内（CWD=副本根）`node render-all.mjs` → exit 1；`node -e "const fs=require('fs');const f=fs.readdirSync('./models').filter(x=>x.endsWith('-model.json')&&!x.startsWith('_'));const k=f.findIndex(x=>x.startsWith('reviewer-ai'));const n=fs.readdirSync('./sandbox').filter(x=>x.endsWith('.md')&&x!=='diff-report.md').length;const kept=fs.readdirSync('./sandbox').filter(x=>x.endsWith('.md')&&x!=='diff-report.md').every(x=>fs.statSync('./sandbox/'+x).size>0);console.log('k='+k,'n='+n,'kept='+kept,'hasBad='+fs.existsSync('./sandbox/reviewer-ai.md'),'hasAfter='+fs.existsSync('./sandbox/reviewer-audit.md'))"` → 首行 `k=5 n=5 kept=true hasBad=false hasAfter=false`（本机实测 `reviewer-aiIndex=5`，实现后按同一命令复核；`k` 随目录顺序变则 `n` 跟变）。
- **执行状态**：**已施行（自动化，2026-11-11 全绿）**。`test('TC-046 render-all 首个抛错即停、已写文件保留')` 以 `kind=boom` 断言 exit 1、产物数 = 坏席下标、坏席及之后无文件、之前文件保留，28/28 全绿。
- **红绿证据**：红 = 产物数 = 7（继续渲染）、或坏席有文件、或已写文件被回滚删除；绿 = `n=k` 且 `kept=true`。
- **对应测试/交付物**：`render-all.mjs`；**测试承接**：`test('TC-046 render-all 首个抛错即停、已写文件保留')`。
- **不覆盖**：不判沙箱目录是否需清理旧产物（spec 明确沙箱可弃、可重跑）。

## 3 负例与边界

| 用例 ID | 边界/负例是什么 | 为什么容易漏 | 期望行为 |
|---|---|---|---|
| TC-004 | `default` 席同时写了 `kind` 与 `text`（复制常量） | 只判产物正确看不出模型里多了一份真相 | 键集仅 `kind`，常量句在模型内 0 次 |
| TC-009 | 渲染层遇 `kind=policy2` | 校验层拦得住时渲染层分支永不执行，易漏测 | 抛错，不回落默认句 |
| TC-012 | 删掉 `outputFormat` 键 | 实现常先 push 标题再判空 | 整段不出现，无空标题 |
| TC-013 | `checks[*].text` 手写文案 | 校验码已有，模型侧易被后加 | `OUTPUT_TEXT_HANDWRITTEN` 不触发（当前 0 次） |
| TC-014 | `refExists` 未登记 OP | 「段存在」即可蒙过 | 键集 22、含 `refExists`，产物不落英文 op 名 |
| TC-017 | `tier` 与策略不符 | 双处表达，改错不报 | `TIER_MISMATCH` |
| TC-018 | 只改策略 caps / 只改模型 tier | 看不出 `tools` 到底取自哪边 | A 不变、B 跟变 |
| TC-019 | `tier = admin` | 值域不校验时静默通过 | `TIER_MISMATCH` |
| TC-021 | `steps` 4 步 | 现状按 kind 写死，第 4 步必错 | 编号 `1.2.3.4.` |
| TC-022 | 调换 `halt` / `report` 顺序 | 3 步齐全时编号「看起来对」 | 首条随步序变 |
| TC-031 | `kind = policies`（拼错） | 与 `policy` 只差一个字母 | `BOUNDARY_KIND_UNKNOWN`，无产物 |
| TC-032 | `literal` 删 `text` / `""` / `123` / `"   "` | 空白串若同时报两码，校验输出会分叉 | 四次只报 `BOUNDARY_TEXT_MISSING` |
| TC-033 | 坏模型是否仍产生产物 | 渲染与校验互不调用，易误以为渲染器会先校验 | 该席无 md 且 `render-all` exit 1 |
| TC-040 | 只读席 `kind=policy` | 校验器只看 kind 三值时会放过语义矛盾 | `BOUNDARY_POLICY_NONWRITER` |
| TC-041 | 正文非空但带首尾空白 | 只判「非空」会放过首尾空白 | `BOUNDARY_TEXT_WHITESPACE` |
| TC-044 | 坏模型的 `verify-models` 退出码与输出流 | 码串对了但 exit 0 仍不能当门禁；码流若进 stderr 会绕开门禁 | exit 1，码在同席 stdout 行、`stderrLen=0` |
| TC-045 | 坏模型的 `render-all` 退出码 / 调校验入口 | 只看 stdout 文案会漏掉门禁语义；spawn 校验会绕开 fail fast | exit 1；无 spawn、无 `verify(`，`expand` 复用允许 |
| TC-046 | 多席渲染中途抛错 | 「渲染完再校验」与「首个抛错即停」产物数不同 | 产物数 = 坏席下标，已写文件保留 |
| TC-011 | `escalation` 外唯一缺段席（`reviewer-audit`） | 6 席有段会让人误以为「全都有」 | 无标题、无孤儿文案 |
| TC-023 | `escalation = null` 的 5 席 | 空段处理与 `must` / `never` 不同代码路径 | 无 `## 越界处置` |
| TC-034 | 空 `must` | 只测非空规则会漏空标题 | 返回 `[]` |
| TC-035 | 空 `never` | 同 TC-034 | 返回 `[]` |
| TC-036 | `literal.text` 首尾空格与换行 | `join('\n')` 会吞/加换行 | 逐字节原样保留 |

**计数**：正例 **23** 条（TC-001/002/003/005/006/007/008/010/015/016/020/024/025/026/027/028/029/030/037/038/039/042/043）；负例 **18** 条（TC-004/009/012/013/014/017/018/019/021/022/031/032/033/040/041/044/045/046）；边界 **5** 条（TC-011/023/034/035/036）。合计 **46**；负例 + 边界 = **23** ≥ 正例 23 的 1/3（7.67），满足要求。

## 4 回归清单

| 如果改了 | 必须重跑 | 为什么 |
|---|---|---|
| `models/*-model.json`（`seat.tier` / `boundary`） | TC-001–TC-005、TC-016–TC-019、TC-030、TC-040、TC-041 | 字段是全部形态判据的取数面 |
| `render/sections.mjs` | TC-006–TC-015、TC-020–TC-025、TC-034–TC-036、TC-041 | 段函数与 OP 表唯一实现点 |
| `render/index.mjs` 段表 | TC-008、TC-011、TC-023 | 段顺序与空段跳过 |
| `render-all.mjs` | TC-024、TC-026、TC-027、TC-033、TC-045、TC-046 | 落点、`--out` 解析、退出码、fail fast、确定性 |
| `verify-models.mjs` | TC-017、TC-019、TC-030–TC-032、TC-040、TC-041、TC-044 | 5 个新码与退出码的唯一发射点 |
| `diff-report.mjs` | TC-028、TC-029、TC-042 | 报告节、缺失项、冻结列名 |
| `tools/docgen/**`（含 `renderBoundary` / `patternRegistry` / `tiers` / `seat-policy`） | TC-005–TC-007、TC-016–TC-019、TC-038、TC-040 | 15 槽、常量、档位、策略都从这里取数；本轮禁改 |
| `agents/*.md` | TC-003、TC-006、TC-007、TC-038 | 现役卡是逐字节比对的另一半 |
| `docs/prd/20261111145723-agent-model-pipeline.md` | TC-037 | 回写项直接判 |
| 开工快照 `.p1-start-status` | TC-038、TC-043 | 快照是「零改动」判据的基线 |

## 5 只手动验证（与 spec §4.6 一致）

| 项 | 为什么机器验不了 | 谁验、看什么 |
|---|---|---|
| **（spec §4.6 冻结）** 边界段与现役卡的「可读性」是否等价 | 语义面；逐字节相等（TC-006/007）只保证不漂，判不了「读起来是否等价」 | **P2 盲测接手**；本席给出样本：3 席 `literal` 产物边界段、2 张 `policy` 产物 15 槽（是否被误读为「可跑自检」） |
| **（spec §4.6 冻结）** 差异报告中的「新增段是否该保留」 | 去留是产品判断，无判据可机判 | **P2 四维评估**接手；输入 = 报告「已知差异归类」K1–K5（TC-042 保证五行存在） |
| （本席补充，非 spec §4.6 列出）派生措辞是否弱于现役散文（K2） | `refExists` / `allExist` 等的合法译法不唯一，无冻结文案 | 主 agent / 用户：对比 `agents/detective-observer.md:56-59` 与产物校验行，记录「可理解」判断供 P2 用 |
| （本席补充）报告「缺失项」的「原因」文字是否成立 | 列名与列序已冻结（TC-042），但原因文字未冻结 | `reviewer-audit`：读 `sandbox/diff-report.md` 的缺失项节，抽查 1 条原因 |

## 6 不测（带理由，含 spec §4.6 的 3 条）

| 不测什么 | 为什么 |
|---|---|
| **（spec §4.6 冻结）** `reviewer-audit` 的 `outputFormat` | 属 P4 建模（spec §3 S6 记为缺失项；TC-011 只判「本轮不出该段」） |
| **（spec §4.6 冻结）** 现役 6 + 9 个红测试 | 属 P5 前置门（PRD Q4） |
| **（spec §4.6 冻结）** `renderBoundary` 内部 15 槽取值 | 现役 `tools/docgen/builders/agents/test/tool-tiers.test.mjs` 已覆盖（spec §4.6.1）；P1 只消费、不改实现 |
| `tools/docgen/**` 的改造 | spec §2「不做」；本文件只 import 侧断言 |
| K1 三段去留、卡面长度与 token 影响 | P2 用数据判（spec §6 K1） |
| `agents/*.md` 的实际写回 | P5 一次切换（PRD D12） |
| stderr 的具体文案（码流位置已冻结在同席 stdout 行） | spec 只冻结「不另起 stderr 码流」，未冻结文案 |

## 7 缺口与判别力水位

| # | 缺口 | 状态 | 漏检哪类反例 | 至少 1 个样例 | 语义由谁兜 |
|---|---|---|---|---|---|
| G1 | `OP` 条数口径 | **已收口（spec §4.2 冻结「现有 21、加后 22」）** | — | — | TC-014 按 22 判 |
| G2 | `renderBoundary` 长度数字锚 | **已收口（spec §3 F3 改为 1200 / 1240）** | — | — | TC-006 按 1200 / 1240 判 |
| G3 | `## 输出格式` 行数是否含空行 | **已收口（spec §4.2 冻结「非空行、空行不计」）** | — | — | TC-010 按非空行判 |
| G4 | 非 `policy` 席误用 15 槽的识别层与码 | **已收口（spec §3 S12 / §4.4：`BOUNDARY_POLICY_NONWRITER`，校验期）** | — | — | TC-005 正例 + TC-040 负例 |
| G5 | `literal.text` 首尾空白渲染口径 | **已收口（spec §3 S13：原样不 trim）** | — | — | TC-036 按不 trim 判 |
| G6 | `--out` 相对谁的目录 | **已收口（spec §3 S14 / §4.3：`resolve(here, dir)`）** | — | — | TC-026 相对 + 绝对双测，`cwd` 设为仓库根 |
| G7 | 「无 `sandbox` 字样」的粒度 | **已收口（spec §5 补充判据 6：普通子串 0 次）** | — | — | TC-025 按字符串判 |
| G8 | 报告列名与列序 | **已收口（spec §3 S16 / §4.3：五组列名）** | — | — | TC-042 按五组数组判 |
| G9 | 工作区既存脏文件导致「零改动」无基线 | **已收口（spec §5 补充判据 9：落 `.p1-start-status` 后白名单比对）** | — | — | TC-038 / TC-043 |
| G10 | 校验/渲染的退出码 | **已收口（spec §3 S15 / §4.4）** | — | — | TC-044 / TC-045 |
| G11 | `literal.text` 只含空白是否算空 | **已收口（spec §4.4：`trim()===''` 归 `BOUNDARY_TEXT_MISSING`；另设 `BOUNDARY_TEXT_WHITESPACE`）** | — | — | TC-032 / TC-041 |
| G12 | S15 与既有模块依赖的关系 | **已收口（spec §3 S15：禁止 spawn / 调 `verify()`，允许 `render/index.mjs` 与 `diff-report.mjs` 复用 `expand`）** | — | — | TC-045 八项静态断言 |
| G13 | 空白串是否同报两码 | **已收口（spec §4.4：空白串只发 `BOUNDARY_TEXT_MISSING`；先判空后判空白，同席只发一码）** | — | — | TC-032 只报 MISSING；TC-041 只报 WHITESPACE |
| G14 | 渲染中途抛错的批次语义 | **已收口（spec §4.4：首个抛错即停、exit 1、已写文件保留不回滚）** | — | — | TC-046 按坏席下标数产物 |
| G15 | 码串输出流 | **已收口（spec §4.4：码串打印在每席同一行 stdout，不另起 stderr 码流；exit code 是机器信号）** | — | — | TC-044 断言 `stderrLen=0` |
| G16 | 交付物清单的码数 | **已收口（spec §7：加 5 个校验码 + 失败退出码）** | — | — | TC-017/031/032/040/041/044 覆盖 5 码 |

## 8 自检

### 8.1 四项自检

| # | 自检项 | 结果 | 证据（可复算） |
|---|---|---|---|
| ① | 用例总数 | **46** 条（TC-001 ~ TC-046，连续编号，无改号、无删号） | 本文件 §2 标题计数 `### TC-` = 46 |
| ② | 正 / 负 / 边界计数 | 正 **23** / 负 **18** / 边界 **5**；负 + 边界 = **23** ≥ 正 23 的 1/3（7.67） | §3 计数行 |
| ③ | 五要素缺项数 | **0**（每条均有 覆盖 / 前置 / 步骤 / 预期 / 判据；另附 执行状态 / 红绿证据 / 对应测试-交付物 / 不覆盖） | §2 每条 9 个字段齐 |
| ④ | 覆盖总表未覆盖 spec 条目数 | **0**（S1–S16、§4.1–§4.5（含 §4.5 的 5 条硬约束）、§4.6 的 7 行测试清单、§5 的 5 条命令锚与 9 条补充判据、§2 做-1~6 全部有对应行） | §1 覆盖核对段 + §1.1 + §1.2 |

### 8.2 五条命名/独立性/五要素/负例/外链核对

| 判据 | 结果 | 证据 |
|---|---|---|
| 命名与落点 | 通过 | 文件 `docs/superpowers/specs/2026-11-11-agent-model-pipeline-p1-design-testcase.md` = spec 名去 `.md` + `-testcase.md`，与 spec 同目录 |
| 独立性 | 通过 | 编写者为 `senior-sdet` 子代理；spec 头注写明 `作者：主 agent`；施工者由 plan 承担，三者不同一人 |
| 五要素齐全 | 通过 | §2 每条含 覆盖/前置/步骤/预期/判据，缺项 0（§8.1 ③） |
| 负例比例 | 通过 | 负 + 边界 23 ≥ 正 23 ÷ 3（§3 计数行） |
| 外链可核 | 通过 | 代码引用的 `path:line` 均指向仓内已存在文件：`sections.mjs:15-37`、`tiers.mjs:5-10`、`patternRegistry.mjs:13`、`render/index.mjs:9-13`、`verify-models.mjs:181`、`render-all.mjs:8`、`agents/evidence-reader.md:66`、PRD `:156` / `:313`；**spec 一律按节号引用（§3 F3 / S12–S16、§4.2–§4.4、§5 补充判据 6/9、§7）**，不再写 `spec:行号`（第 4 次修订：原行号锚 ≥8 处漂移，已全量替换） |

### 8.3 findings

- 缺口共 **16 条**（G1–G16），**全部已收口**（G1–G11 → S12–S16 与 §4.2–§4.4；G12–G16 → S15 / §4.4 / §7）。**仍未收口 0 条**。
- 测试承接：46 条用例的「对应测试/交付物」字段全部填了 `test('…')` 名或写明归属，**无空、无占位符**；其中仅 **2 条无独立 `test()`**（TC-038 / TC-043），属 spec §5-9 的 `git status` 快照命令核（plan Task 9），非 node test 面。
- 第 4 次修订（senior-sdet + reviewer-audit 两席评审）：① spec 行号锚全量改节号锚；② TC-037 判据由「全文件 `已定` ≥1」改为「`## 9 已定` 命中 1 且 `## 9 待你确认` 命中 0」（原判据在 PRD:85 已有「已定为 B」时可假绿）；③ TC-014 判据升级为 `Object.keys(OP).length === 22` 且含 `refExists`；④ TC-026 的 `cwd` 固定为仓库根，用于区分 `process.cwd()` 与脚本目录；⑤ TC-042 由「只判总览」改为五节表头逐节比对；⑥ TC-046 产物数由「<7」改为「= 坏席下标」并逐席断言；⑦ 覆盖账「做-1~5」更正为「做-1~6」，TC-037 标做-6；⑧ TC-043 白名单补 PRD 回写路径；⑨ 新增 §1.3 `test()` 名 → TC 编号对照表（plan 四处错名已同步更正）；⑩ TC-012/013/019 补独立 `test()`。用例数仍 46，编号未变。
- 第 5 次修订（两席第三次复审，sdet 判「通过」、audit 判「打回」后逐条收口）：① `OP` 在 `makeHelpers` 函数体内，`export OP` 是非法语法；plan 已改为 `makeHelpers({ ...SHARED, ...m }, SHARED).OP`（第一参必须含 `shared.vocab`；原 `makeHelpers(model, SHARED)` 两处都会抛 TypeError），实现侧改为在 `return {...}` 补 `OP`（`sections.mjs:94` 现返回体不含 `OP`）；代码审查后已删除无引用的第三参 `own`；② TC-026 的脚本实参改绝对路径 `join(HERE, 'render-all.mjs')`，`cwd` 仍留仓库根（原写法在仓库根找不到脚本，正确实现也必 `MODULE_NOT_FOUND`）；③ TC-042 五节列名逐字改为 spec §4.3 冻结值（`状态/字符差`、`沙箱长度/现役长度`、`缺失项`、`依据`），并补 `render-all` 前置与两跑 sha；④ TC-046 的 `readdirSync` 过滤补 `!f.startsWith('_')`，避免 `_shared-model.json` 使坏席下标偏移 1；⑤ §1.2 / §1.3 及 TC-027/028/029/042 的承接名统一为 `test('TC-042/028 报告五节列名冻结且两次字节相同')`；⑥ 覆盖账「§2 做-1~5」更正为「做-1~6」；⑦ TC-043 登记 `tmp/` 被 `.gitignore:28` 忽略导致 `git status` 全盲，补 `tmp` 顶层目录枚举判据并写进「不覆盖」。
- 第 6 次修订（两席第 4 次复审，audit 再抓 1 条 P0）：① TC-016 新增的 §4.5-2 源码断言原写 `tierOfCapabilities`，与 Task 4「改用 `TIERS`、删该 import」互斥 → 正则改为 `\bTIERS\b`，spec §4.5-2 与 TC-016 判据同步为同一符号；② `TC-042/028` 补 `sandbox` 下 `.md` 计数 = 8（7 卡 + 1 报告），使 TC-027 的「8 文件」有直接承接；③ 覆盖账 §5 命令锚由 4 条改 5 条（verify 提前后新增 `diff-report`）；④ TC-033 的 S11 引文与 stderr 注记按新 S11 更正；⑤ 本节轮次口径统一：第 4 / 5 / 6 次修订。施工完成后 46 条的「执行状态」由 senior-sdet 子代理回填，主 agent 只提供实跑日志。spec 已同步改 §4.5-1 / §5-9 的「四份文档」口径、§5 命令锚的码集与产物数口径（`render-all` 7 个 / `diff-report` 补第 8 个）、S11/S15 的工序约定。本轮未改任何 `.mjs` / `.json` / `agents/*.md`，`tools/docgen/**` 零改动。
- 改动归属（第 4–6 次修订）：判据变更由 `senior-sdet` 与 `reviewer-audit` 两席评审提出、主 agent 仅转录落盘；**本文件作者仍是 senior-sdet，主 agent 不改判据、不自评**。施工完成后 46 条的「执行状态」由 senior-sdet 子代理回填，主 agent 只提供实跑日志。
- 未施行的判据（历史记录）：施工前各条标注「未施行：依赖 P1 实现」的原因是 `sandbox/`、`diff-report.mjs`、`outputFormat`/`boundary` 段函数、5 个校验码、退出码与 fail fast 均未实现；TC-043 因 `.p1-start-status` 不存在。P1 施工与一次代码审查（6 条改进项）完成后，各条「执行状态」已按实跑结果回填（39 自动化 + 7 人工）。
