# 测试用例：脚本分层与运行期收口

> 归属 spec：`docs/superpowers/specs/2026-11-09-script-layer-refactor-design.md`（split from `docs/prd/20261109211349-script-layer-refactor/index.md`，2026-11-09）
> 编写者：senior-sdet 子代理｜**独立性声明**：编写者 ≠ spec 作者（主 agent）≠ 施工者
> 状态：草稿（定稿 = 每条用例五要素齐全，且覆盖总表与验收锚一一对应）｜最后更新：2026-11-09
> 命名与落点：按 `spec-testcase-gate` 判据 1（与 spec 同目录；文件名 = spec 文件名去 `.md` 后 + `-testcase.md`）。
> 自检口径：见文末 `## 8 自检`（含本席清单）。

**术语表（每个英文术语首次出现处的中文解释，后文沿用）**

| 术语 | 中文解释 |
|---|---|
| spec | 技术设计文档，本任务的实现依据（本文件所测对象） |
| layer | 命令组所属的生命周期层：`build` 构建期 / `dev` 开发期 / `run` 运行期 |
| 命令组 | 策略里 `commandGroups` 的一个条目，装若干条命令；卡面授权的单位是**组名** |
| verb | 命令组内的一条具体命令（字符串形态） |
| 卡面 | `agents/*.md` 中给 agent 读的「边界」段（白名单 / 禁止 / 写作用域） |
| dump | 只读导出：`cli.mjs policy --dump` 打印策略快照，不写盘 |
| exit code | 进程退出码：0 通过 / 1 判定失败 / 2 用法或读取错误 |
| stdout / stderr | 标准输出（正常结果流）/ 标准错误（错误与码流） |
| WARN / FAIL | 警告标签（不判红）/ 失败标签（判红） |
| C2 / C5 | `scs ledger numbers` 的两项检查编号：C2 卡片实数校准、C5 终态对账 |
| landings | 落点：卡片里写的 `path:line` 引用（文件路径 + 行号） |
| 正例 / 负例 / 边界 | 正常路径 / 应判红的坏输入 / 临界输入（空值、缺件、格式变体） |
| scs | 公共命令行工具 `D:\Seed\skill-common-script`，安装后命令名为 `scs` |
| e2e | 端到端测试：从临时目录起跑真实命令，验证跨进程行为 |
| sha256 | 文件内容的 256 位哈希值，用于判断两个文件是否逐字节相同 |
| NonRunGroupGranted | 构建期错误码：席位配置了非运行期（layer≠run）命令组 |
| fallback | 兜底实现：技能被拷走、单源不可达时使用的同语义副本 |
| baseline | 迁移前契约快照：`migration-baseline.json` 里的 exit / 首末行 / code 串 |

**声明**：本轮只写本文件；未修改 spec、业务代码、rule、skill、agent。仅执行过两条只读命令（`Test-Path` 确认 `D:\Seed\skill-common-script\dist\index.js` 存在、`Get-ChildItem` 列 `dist` 首 5 项），未写盘、未跑其他命令。

## 0 测试设计结论（依据与判断）

- 结论 1：必须单测「组级 layer」与「混装」，因为卡面授权单位是组名——`renderBoundary.mjs:72` 为 `function allowGroups(groups) {`；旧组 `check.local` 5 条已混装（`commands.mjs:5` 的 purpose 写「本仓自检与计数」，`commands.mjs:11` 是 `'scs time',`）。新 spec 把混装定义为同组 `layer` 出现两个值（§3.1 表第 3 行），故 TC-005 用 `layer: ['dev','run']` 构造；verb 级生命周期归属仍无机判形态，见 §7 缺口 1。
- 结论 2：C2 的「卡片数」新形态必须单独测，因为现有正则显式只认「卡级」+「张」——`ledger-numbers.ts:129` 为 `if (!/卡级/.test(decl) || !/张/.test(decl)) continue;`；而模板写的正是「卡片数」，见 `skills/parliament-ledger/assets/round-check.md:14`。据此设计 TC-024 ~ TC-028。
- 结论 3：默认值口径已按 spec §5 末行收口——只要求「本仓 `package.json` 的 scs 调用 0 处依赖默认值」（`package.json:12` 的 `check:criteria` 已显式带 `--engine/--data/--projection/--terms/--surface`）；scs 源码默认值归 scs 仓、不在本轮（`2026-11-09-script-layer-refactor-design.md:182`）。据此 TC-054 / TC-055 改为本仓调用面断言，源码扫描移入 §6「不测」。
- 覆盖判断：本 spec 验收锚 = PRD V1–V11（11 条）+ F-01~F-04（4 条），共 15 条，全部落到用例；机制条 R1–R13 与 §3.1–§3.7、§4 硬约束 1–7 逐条落到覆盖总表。

## 1 覆盖总表

| 用例 ID | 覆盖的 spec 条目 | 层级 | 正/负 | 判据类型 | 执行方式 | 优先级 |
|---|---|---|---|---|---|---|
| TC-001 | spec §3.1 R1 R2 / PRD V5 | 单元 | 正 | 机器 | `cli.mjs policy --dump` | P0 |
| TC-002 | spec §3.1 R2 / PRD V5 | 单元 | 正 | 机器 | `cli.mjs policy --dump` | P0 |
| TC-003 | spec §3.1 R1 / PRD V5 | 单元 | 负 | 机器 | 副本 + `policy --dump` | P0 |
| TC-004 | spec §3.1 R1 / PRD V5 | 单元 | 负 | 机器 | 副本 + `policy --dump` | P0 |
| TC-005 | spec §3.1 R1（同组 `layer` 两值）/ §5 行 1 / PRD V5 | 单元 | 负 | 机器 | 副本 + `policy --dump` | P0 |
| TC-006 | spec §3.2（六码登记 EXIT 表）/ PRD V5 | 单元 | 正 | 机器 | import `exitCodeFor` | P1 |
| TC-007 | spec §3.1 R1（同一 verb 不得跨组）/ PRD V5 | 单元 | 负 | 机器 | 副本 + `policy --dump` | P1 |
| TC-008 | spec §3.2 R3 / §4 硬约束 2 / PRD V1 F-01 | 集成 | 正 | 机器 | `renderBoundary` + 卡文件 | P0 |
| TC-009 | spec §3.2 R3 / PRD V1 | 单元 | 负 | 机器 | 副本改渲染器 + 断言探针 | P0 |
| TC-010 | spec §3.2 R3（dump 全量组 + layer）/ F-01 | 集成 | 正 | 机器 | `cli.mjs policy --dump` | P0 |
| TC-011 | spec §3.2 R3（exit 1）/ §3.3 R4 / PRD V1 | 集成 | 负 | 机器 | 副本改席位 + `policy --dump` | P0 |
| TC-012 | spec §3.3 R4 | 单元 | 正 | 机器 | import `seat-policy.mjs` | P0 |
| TC-013 | spec §3.2 R3（exit 1）/ §3.3 R4 | 集成 | 负 | 机器 | 副本改 `__default__` + `policy --dump` | P1 |
| TC-014 | spec §3.2 R3（exit 1，不静默过滤）/ PRD V1 | 集成 | 负 | 机器 | 副本 + `gate` / `draft --drafts` | P0 |
| TC-015 | spec R12 / §4 硬约束 1 / PRD V5 | 单元 | 正 | 机器 | `policy --dump` JSON 断言 | P0 |
| TC-016 | spec R12 / §4 硬约束 1 | 单元 | 负 | 机器 | 副本改 verb 形状 + ESM 断言 | P1 |
| TC-017 | spec R10 / §4 硬约束 5 / PRD V11（门禁测试自带 1 正 1 负） | 集成 | 正 | 机器 | `node --test` + 结构断言 | P0 |
| TC-018 | spec R10 / PRD V11（门禁测试缺负例） | 集成 | 负 | 机器 | 副本删负例 + 同一断言 | P1 |
| TC-019 | spec §3.4 R5 / PRD V4 F-02 | 集成 | 正 | 机器 | `scs ledger numbers` | P0 |
| TC-020 | spec §3.4 R5 / PRD V4 | 集成 | 负 | 机器 | `scs ledger numbers` | P0 |
| TC-021 | spec §3.4 R5（缺行只 WARN） | 集成 | 边界 | 机器 | `scs ledger numbers` | P0 |
| TC-022 | spec §3.4 R5（cards.md 缺失） | 集成 | 边界 | 机器 | `scs ledger numbers` | P0 |
| TC-023 | spec §3.4 R5（正则不匹配） | 集成 | 边界 | 机器 | `scs ledger numbers` | P1 |
| TC-024 | spec §3.5 R6 / PRD V4 F-02 | 集成 | 正 | 机器 | `scs ledger numbers` | P0 |
| TC-025 | spec §3.5 R6 / §5 行 5 / PRD V4 | 集成 | 负 | 机器 | `scs ledger numbers` | P0 |
| TC-026 | spec §3.5 R6（不双计）/ §5 行 5 | 集成 | 边界 | 机器 | `scs ledger numbers` | P0 |
| TC-027 | spec §3.5 R6（新形态分布错）/ PRD V4 | 集成 | 负 | 机器 | `scs ledger numbers` | P0 |
| TC-028 | spec §3.5 R6（括号变体） | 集成 | 边界 | 机器 | `scs ledger numbers` | P1 |
| TC-029 | spec §3.4 模板同步 / PRD V6 | 集成 | 正 | 机器 | `ledger.mjs` + `Select-String` | P0 |
| TC-030 | spec §3.4 模板同步 / PRD V6 负例 | 集成 | 负 | 机器 | 副本改模板 + `ledger.mjs` | P1 |
| TC-031 | spec §3.7（本仓不新建计数脚本）/ PRD V7 | 集成 | 正 | 机器 | 文件名 / 函数名扫描 | P1 |
| TC-032 | spec §3.6 R7 R9 / PRD V8 F-03 | 集成 | 正 | 机器 | `scs check landings` | P0 |
| TC-033 | spec §3.6 R7 / §5 行 6 / PRD V4 | 集成 | 负 | 机器 | `scs check landings` | P0 |
| TC-034 | spec §3.6 R7 / §5 行 6 / PRD V4 | 集成 | 负 | 机器 | `scs check landings` | P0 |
| TC-035 | spec §3.6（URL 跳过）/ §5 行 6 | 集成 | 边界 | 机器 | `scs check landings` | P0 |
| TC-036 | spec §3.6 R7（`--ledger` 必填，缺失 exit 2） | 集成 | 负 | 机器 | `scs check landings` | P0 |
| TC-037 | spec §3.6（账本目录不存在 exit 2） | 集成 | 负 | 机器 | `scs check landings` | P0 |
| TC-038 | spec §3.6（delivery-audit 可选，WARN 走 stderr） | 集成 | 边界 | 机器 | `scs check landings` | P1 |
| TC-039 | spec §3.6（token 正则含反斜杠） | 集成 | 边界 | 机器 | `scs check landings` | P1 |
| TC-040 | spec §3.6 R7 R9 / PRD V2 V8 F-03 | e2e | 正 | 机器 | 临时目录 + `node dist/index.js` | P0 |
| TC-041 | spec §3.6 R7 / PRD V2 V8 负例 | e2e | 负 | 机器 | 临时目录 + 不传参数 | P0 |
| TC-042 | spec R9 / §3.6 与 #7 边界 | 集成 | 正 | 机器 | `scs check landings` + 文件探针 | P0 |
| TC-043 | spec §3.7 R8（映射表 + 基线前置，sample=项目根）/ PRD V10 F-04 | 集成 | 正 | 机器 | `Select-String` + `Test-Path` | P0 |
| TC-044 | spec §3.7 R8（基线逐项 diff，2 组）/ §5 行 7 / PRD V10 | 集成 | 正 | 机器 | 契约对比测试 | P0 |
| TC-045 | spec §3.7 R8 / PRD V10 | 集成 | 负 | 机器 | 契约对比测试 | P0 |
| TC-046 | spec §3.7 R8 / PRD V10 | 集成 | 负 | 机器 | 契约对比测试 | P0 |
| TC-047 | spec §3.7 R8 / PRD V10 | 集成 | 负 | 机器 | 契约对比测试 | P0 |
| TC-048 | spec §3.7 R13 / PRD V3（迁移后命中 0，测试随源删除） | 集成 | 正 | 机器 | 静态扫描 | P0 |
| TC-049 | spec R13 / §3.7 / PRD V3 负例（旧脚本原样留） | 集成 | 负 | 机器 | 副本恢复 score.mjs + 扫描 | P0 |
| TC-050 | spec §3.7 R13（`skill-dir.mjs` 恰 1 份，无兜底副本）/ PRD V3 F-04 | 集成 | 正 | 机器 | 静态扫描 | P0 |
| TC-051 | spec R13 / §3.7 / PRD V3（第二份实现回流） | 集成 | 负 | 机器 | 副本加副本 + 同一扫描 | P1 |
| TC-052 | spec §3.7 R8（基线 skill-inspector 条目，sample=项目根）/ PRD V8 F-04 | e2e | 正 | 机器 | 读 baseline + 新命令 | P0 |
| TC-053 | spec §3.7 R11 / PRD V8 负例 | e2e | 负 | 机器 | 临时目录 + 默认值 | P0 |
| TC-054 | spec R11 / §5 行 9 / PRD V2 V8（本仓调用面 0 处依赖默认值） | 集成 | 正 | 机器 | 解析 `package.json` scripts | P0 |
| TC-055 | spec R11 / §5 行 9（调用面负例） | 集成 | 负 | 机器 | 副本删旗标 + 同一断言 | P0 |
| TC-056 | spec R11 / §4 硬约束 3 | 单元 | 正 | 机器 | `node -e` 读 package.json | P0 |
| TC-057 | spec R11 / PRD V2 负例 | 集成 | 负 | 机器 | 副本跑 `npm run check:criteria` | P1 |
| TC-058 | spec §3.7 / PRD V9 | 集成 | 正 | 机器 | `Test-Path` + `npm test` | P0 |
| TC-059 | spec §3.7 / PRD V9 负例 | 集成 | 负 | 机器 | 同名测试清单比对 | P0 |
| TC-060 | spec §4 硬约束 6 / PRD §7 不改 `agents/*.md` | 集成 | 正 | 机器 | `cli.mjs generate` | P0 |
| TC-061 | spec §4 硬约束 6 / PRD §7 不改 `agents/*.md` 负例 | 集成 | 负 | 机器 | 副本改卡 + `cli.mjs gate` | P0 |
| TC-062 | spec §3.6 R7（`--root` = 项目根） | e2e | 正 | 机器 | `check landings --help` | P1 |
| TC-063 | spec §3.6 R7（相对/绝对路径等价） | e2e | 边界 | 机器 | `scs check landings` | P2 |
| TC-064 | spec §3.1（`GroupEmpty`，run 组空 verbs）/ PRD V5 | 单元 | 负 | 机器 | 副本 + `policy --dump` | P0 |
| TC-065 | spec §3.6（`round-check.md` 必需，缺失 exit 2）/ PRD V4 | 集成 | 负 | 机器 | `scs check landings` | P0 |
| TC-066 | spec §3.6 R7（`--ledger` 按 cwd，不相对 `--root`） | 集成 | 边界 | 机器 | `scs check landings` | P1 |
| TC-067 | spec §3.7（迁移前基线）/ §4 硬约束 7 / PRD V10 | 集成 | 负 | 机器 | 迁移守卫测试 | P0 |
| TC-068 | spec §3.7（基线与新命令有未登记差异）/ PRD V10 | 集成 | 负 | 机器 | 契约对比测试 | P0 |
| TC-069 | spec §3.5 R6（旧声明形态仍命中）/ PRD V4 F-02 | 集成 | 正 | 机器 | `scs ledger numbers` | P0 |

**覆盖核对**：本 spec 的验收锚共 **15** 条（PRD V1–V11 = 11 条；PRD §10 F-01~F-04 = 4 条）；本表覆盖 **15** 条；未覆盖 **0** 条。另：spec 机制条 R1–R13、§3.1–§3.7、§4 硬约束 1–7 均已逐条落到上表（R1→001–007；R2→002；R3→008–014；R4→012–013；R5→019–023、029；R6→024–028、069；R7→032–037、040–041、062–063、065–066；R8→043–047、052、067–068；R9→032、040、042；R10→017–018；R11→054–057；R12→015–016；R13→048–051；§4-1→015；§4-2→009；§4-3→056；§4-4→044；§4-5→017；§4-6→060；§4-7→067）。F-01 覆盖 TC-001~TC-018、TC-064（≥2），F-02 覆盖 TC-019~TC-031、TC-069（≥2），F-03 覆盖 TC-032~TC-042、TC-065~TC-066（≥2），F-04 覆盖 TC-043~TC-059、TC-067~TC-068（≥2）。

## 2 用例明细

### TC-001 四个命令组都带合法 layer → 构建期校验通过

- **覆盖**：spec §3.1 R1 R2 / PRD V5
- **前置**：改造后 `commands.mjs` 已按 §3.1 给四个组加 `layer`；工作区干净。
- **步骤**：① 在仓库根跑 `node tools/docgen/builders/agents/cli.mjs policy --dump`；② 读取 JSON 的 `commands` 字段，逐组取 `layer`。
- **预期**：exit code = 0；四个组 `repo.check` / `tool.time` / `git.read` / `docgen.read` 的 `layer` 分别等于 `dev` / `run` / `run` / `build`；无第五个允许组。
- **判据**：机器：`node tools/docgen/builders/agents/cli.mjs policy --dump` → exit 0，且 JSON 中 `commands['repo.check'].layer === 'dev'`、`commands['tool.time'].layer === 'run'`、`commands['git.read'].layer === 'run'`、`commands['docgen.read'].layer === 'build'`。
- **红绿证据**：红 = 现状 `commands.mjs:3-33` 没有任何 `layer` 键，同一命令输出四组 `undefined`；绿 = 四组 `layer` 分别为 dev/run/run/build 且 exit 0。
- **对应测试**：Task 1；`tools/docgen/builders/agents/test/policy-layer.test.mjs`。
- **不覆盖**：不判每条 verb 的归属是否正确（语义面，见 §7 缺口 1）。

### TC-002 组拆分结构（4 组 / 14 条 verb / 组名不再叫 check.local）

- **覆盖**：spec §3.1 R2 / PRD V5
- **前置**：同 TC-001。
- **步骤**：① 跑 `policy --dump`；② 统计允许组名、每组 verb 条数与总条数。
- **预期**：允许组名恰为 `['repo.check','tool.time','git.read','docgen.read']`；条数 4 / 1 / 5 / 4；总数 14；不再存在 `check.local`。
- **判据**：机器：`node tools/docgen/builders/agents/cli.mjs policy --dump` → exit 0，且组名数组逐项等于上述四项、每组条数 `[4,1,5,4]`、总数 `14`、`commands['check.local'] === undefined`。
- **红绿证据**：红 = 现状 `commands.mjs:3` 只有 `check.local` / `git.read` / `docgen.read` 三组，`check.local` 5 条（含 `scs time`，见 `commands.mjs:5-12`）；绿 = 四组、14 条、无 `check.local`。
- **对应测试**：Task 1；`tools/docgen/builders/agents/test/policy-layer.test.mjs`。
- **不覆盖**：不判 `repo.check` 四条是否应留在 `dev`（语义面，见 §7 缺口 1）。

### TC-003 命令组缺 layer → 构建期红并点名 GroupLayerMissing

- **覆盖**：spec §3.1 R1 / PRD V5
- **前置**：用 `withRepoCopy`（`tools/docgen/builders/agents/test/support/dev-workflow-checks.mjs:251`）建仓库副本。
- **步骤**：① 在副本 `tools/docgen/builders/agents/policy/definitions/commands.mjs` 中删掉 `repo.check` 的 `layer: 'dev',` 一行；② 在副本根跑 `node tools/docgen/builders/agents/cli.mjs policy --dump`。
- **预期**：exit code ≠ 0；stderr 首个非空行以 `GroupLayerMissing: ` 开头。
- **判据**：机器：副本内 `node tools/docgen/builders/agents/cli.mjs policy --dump` → exit 1，stderr 首个非空行匹配 `^GroupLayerMissing: `；真仓库同一命令 exit 0。
- **红绿证据**：红 = 现状实现无 `GroupLayerMissing` 码（`validatePolicy.mjs:88` 起全文无该串），删 layer 后仍 exit 0；绿 = exit 1 且码面点名。
- **对应测试**：Task 1；`tools/docgen/builders/agents/test/policy-layer.test.mjs`。
- **不覆盖**：不判错误信息里是否包含组名（spec §3.1 未冻结报文格式）。

### TC-004 命令组 layer 取非法值 → GroupLayerInvalid

- **覆盖**：spec §3.1 R1 / PRD V5
- **前置**：同 TC-003 的副本。
- **步骤**：① 把 `repo.check` 的 `layer` 改为 `'prod'`；② 副本根跑 `policy --dump`。
- **预期**：exit code ≠ 0；stderr 首个非空行以 `GroupLayerInvalid: ` 开头。
- **判据**：机器：副本内 `policy --dump` → exit 1，stderr 匹配 `^GroupLayerInvalid: `。
- **红绿证据**：红 = 现状无该码，`'prod'` 被静默接受、exit 0；绿 = exit 1 且码面为 `GroupLayerInvalid`。
- **对应测试**：Task 1；`tools/docgen/builders/agents/test/policy-layer.test.mjs`。
- **不覆盖**：不判大小写变体（`RUN`）是否接受（spec 只列 `['build','dev','run']`，视为非法）。

### TC-005 同一组的 `layer` 出现两个值 → GroupMixedLayer

- **覆盖**：spec §3.1 R1（同组 `layer` 两值）/ §5 测试表第 1 行 / PRD V5
- **前置**：仓库副本。
- **步骤**：① 把副本 `repo.check` 的 `layer` 改成数组 `['dev', 'run']`；② 跑 `policy --dump`。
- **预期**：exit code = 1；stderr 首个非空行以 `GroupMixedLayer: ` 开头（`schema` 表第 3 行）。
- **判据**：机器：副本内 `policy --dump` → exit 1，stderr 匹配 `^GroupMixedLayer: `。
- **红绿证据**：红 = 现状无 layer 校验（`validatePolicy.mjs:88-137` 不扫 `layer`），数组值被静默接受、exit 0；绿 = exit 1 且码面为 `GroupMixedLayer`。
- **对应测试**：Task 1；`tools/docgen/builders/agents/test/policy-layer.test.mjs`。
- **不覆盖**：不判「组内 verb 分属 dev / run」的语义混装——spec §3.1 只给组级 `layer`，verb 无 layer 字段，该语义面见 §7 缺口 1。

### TC-006 六个新码必须登记进 EXIT 表 → 全部映射到 exit 1

- **覆盖**：spec §3.2（六码登记 EXIT 表）/ PRD V5
- **前置**：`validateAgentData.mjs` 的 `EXIT` 表已按 §3.2 登记六个新码。
- **步骤**：① import `exitCodeFor`；② 对 `GroupLayerMissing` / `GroupLayerInvalid` / `GroupMixedLayer` / `GroupEmpty` / `VerbDuplicated` / `NonRunGroupGranted` 逐个取退出码；③ 检查是否落 2 或 `undefined`。
- **预期**：六个码全部返回 `1`；没有 `undefined` / `2`（未登记会被 CLI 兜底成 exit 2，冻结的 exit 1 失效）。
- **判据**：机器：`node --input-type=module -e "import {exitCodeFor} from './tools/docgen/builders/agents/components/validateAgentData.mjs';console.log(['GroupLayerMissing','GroupLayerInvalid','GroupMixedLayer','GroupEmpty','VerbDuplicated','NonRunGroupGranted'].map(c=>exitCodeFor(c)).join(','))"` → stdout 首行 `1,1,1,1,1,1`。
- **红绿证据**：红 = 现状 `validateAgentData.mjs:13` 的 `EXIT` 表无这六个码 → 输出 `undefined,…`；绿 = `1,1,1,1,1,1`。
- **对应测试**：Task 1；`tools/docgen/builders/agents/test/policy-layer.test.mjs`。
- **不覆盖**：不判同一输入同时触发两条件时的报码优先级（spec §3.1 未冻结，见 §7 缺口 5）。

### TC-007 同一条 verb 出现在两个组 → VerbDuplicated

- **覆盖**：spec §3.1 R1（同一 verb 不得跨组）/ PRD V5
- **前置**：仓库副本。
- **步骤**：① 在副本新增 `'repo.check2': { layer: 'dev', verbs: ['npm run check'] }`（`npm run check` 已在 `repo.check`）；② 跑 `policy --dump`。
- **预期**：exit code ≠ 0；stderr 首个非空行以 `VerbDuplicated: ` 开头。
- **判据**：机器：副本内 `policy --dump` → exit 1，stderr 匹配 `^VerbDuplicated: `。
- **红绿证据**：红 = 现状无跨组重复检测，副本 exit 0；绿 = exit 1 且码面为 `VerbDuplicated`。
- **对应测试**：Task 1；`tools/docgen/builders/agents/test/policy-layer.test.mjs`。
- **不覆盖**：不判重复检测是否排除禁止组（spec §3.1 只说「两个组」，未说明范围）。

### TC-008 三张 producer 卡面均 0 个非 run 组名

- **覆盖**：spec §3.2 R3 / §4 硬约束 2 / PRD V1 F-01
- **前置**：S3 已完成组拆分、席位改配、卡重生成；`agents/reviewer-audit.md` 等卡为生成物。
- **步骤**：① 渲染 `reviewer-audit` / `detective-observer` / `speaker` 的边界段；② 在 `agents/*.md` 对应行检索四个组名。
- **预期**：三席卡面只出现 `git.read` / `tool.time`；`repo.check` 与 `docgen.read` 出现次数均为 0；旧组名 `check.local` 出现次数为 0。
- **判据**：机器：`node --input-type=module -e "import {renderBoundary} from './tools/docgen/builders/agents/components/renderBoundary.mjs';const s=renderBoundary('speaker');console.log(['repo.check','docgen.read','check.local'].map(g=>s.includes(g)).join(','),s.includes('git.read'),s.includes('tool.time'))"` → stdout 首行 `false,false,false true true`；`Select-String -Path agents/reviewer-audit.md,agents/detective-observer.md,agents/speaker.md -Pattern 'repo.check|docgen.read|check.local'` 命中 0。
- **红绿证据**：红 = 现状卡面写 `check.local` / `git.read` / `docgen.read`（`agents/reviewer-audit.md:92`），断言首行为 `false,true,true true false` 且卡文件命中 3；绿 = 0 命中且只列 run 组。
- **对应测试**：Task 2；`tools/docgen/builders/agents/test/policy-layer-render.test.mjs`。
- **不覆盖**：不判卡面文案可读性（见 §5 只手动验证与 §7 缺口 2）。

### TC-009 渲染器若不再过滤非 run 组 → 卡面探针必须红

- **覆盖**：spec §3.2 R3 / PRD V1
- **前置**：仓库副本。
- **步骤**：① 在副本把 `renderBoundary.mjs` 的 `allowGroups` 改成渲染全部组（去掉 run 过滤与抛错）；② 用 TC-008 的同一渲染命令取 `speaker` 卡面。
- **预期**：卡面出现 `repo.check`；TC-008 的断言（0 命中）在副本内为假（红）。
- **判据**：机器：副本内同一渲染命令 → stdout 含 `repo.check`（`Select-String -Pattern 'repo.check'` 计数 ≥ 1）；真仓库同一命令计数 0。
- **红绿证据**：红 = 现状渲染器无过滤（`renderBoundary.mjs:72-75` 直接拼传入组名），改不改都出现 `check.local`；绿 = 真仓库 0 命中、副本构造下断言失败，证明 TC-008 有判别力。
- **对应测试**：Task 2；`tools/docgen/builders/agents/test/policy-layer-render.test.mjs`。
- **不覆盖**：不判渲染函数是否应抛错（抛错面由 TC-011/013/014 覆盖）。

### TC-010 dump 仍输出全量允许组且每组带 layer

- **覆盖**：spec §3.2 R3 / PRD F-01
- **前置**：同 TC-001。
- **步骤**：① 跑 `policy --dump`；② 检查 `commands` 里四个允许组都存在且 `layer` 非空；③ 检查五个禁止组仍在 `commands` 中。
- **预期**：允许 4 组全在且 `layer ∈ {build,dev,run}`；禁止 5 组（`docgen.write` / `git.write` / `fs.write` / `env.assign` / `network`）也在，未被裁剪。
- **判据**：机器：`policy --dump` → exit 0；JSON 中 `Object.keys(json.commands)` 含 9 个组名；四个允许组 `typeof layer === 'string'`。
- **红绿证据**：红 = 现状 dump 的组对象无 `layer`（`dumpPolicy.mjs:28` 直接展开 `commandGroups`）；绿 = 四组 `layer` 为字符串、9 组齐全。
- **对应测试**：Task 2；`tools/docgen/builders/agents/test/policy-layer-render.test.mjs`。
- **不覆盖**：不判禁止组是否也应带 `layer`（spec §3.1 只给允许组示例，见 §7 缺口 5）。

### TC-011 席位配非 run 组 → NonRunGroupGranted 抛错，不静默过滤

- **覆盖**：spec §3.2 R3 / §3.3 R4 / PRD V1
- **前置**：仓库副本。
- **步骤**：① 在副本 `policy/seat-policy.mjs` 给 `reviewer-audit` 的 `allowGroups` 加 `'docgen.read'`（`build` 层）；② 跑 `policy --dump`。
- **预期**：exit code = 1；stderr 首个非空行 `NonRunGroupGranted: reviewer-audit: docgen.read`；stdout 不得输出「看起来正常、只少了该组」的 JSON。
- **判据**：机器：副本内 `policy --dump` → exit 1，stderr 首个非空行匹配 `^NonRunGroupGranted: reviewer-audit: docgen\.read`，stdout 为空或不含 `"seats"`。
- **红绿证据**：红 = 现状配置里三席直接配 `check.local` / `git.read` / `docgen.read`（`seat-policy.mjs:5`），无任何抛错，卡面照常渲染；绿 = 配 `docgen.read` 即 exit 1 并抛错。
- **对应测试**：Task 2；`tools/docgen/builders/agents/test/policy-layer-render.test.mjs`。
- **不覆盖**：不判 stderr 是否包含全部被拒组（本构造只配一个组）。

### TC-012 席位配置与 spec §3.3 表逐项相等

- **覆盖**：spec §3.3 R4
- **前置**：S3 已改 `seat-policy.mjs`。
- **步骤**：① import `SEAT_POLICY`；② 取每席 `allowGroups`；③ 与 §3.3 表比对（按集合比，不按顺序）。
- **预期**：`reviewer-audit` / `detective-observer` / `speaker` = `{git.read, tool.time}`；`respondent-dev` = `{git.read}`；`senior-sdet` / `respondent-architect` / `__default__` = 空集。
- **判据**：机器：`node --input-type=module -e "import {SEAT_POLICY} from './tools/docgen/builders/agents/policy/seat-policy.mjs';console.log(JSON.stringify(Object.fromEntries(Object.entries(SEAT_POLICY).map(([k,v])=>[k,[...v.allowGroups].sort()]))))"` → stdout 的 JSON 与上述期望逐席相等。
- **红绿证据**：红 = 现状 `seat-policy.mjs:5-8` 三席为 `['check.local','git.read','docgen.read']`、`respondent-dev` 为 `['check.local','git.read']`；绿 = 与 §3.3 表一致。
- **对应测试**：Task 2；`tools/docgen/builders/agents/test/policy-layer-render.test.mjs`。
- **不覆盖**：不判 capabilities / artifacts 两项（本轮未改）。

### TC-013 `__default__` 配 dev 组 → 同样抛 NonRunGroupGranted

- **覆盖**：spec §3.2 R3 / §3.3 R4
- **前置**：仓库副本。
- **步骤**：① 把 `__default__.allowGroups` 改为 `['repo.check']`；② 跑 `policy --dump`。
- **预期**：exit code = 1；stderr 首个非空行 `NonRunGroupGranted: __default__: repo.check`；stdout 不含 `"seats"`。
- **判据**：机器：副本内 `policy --dump` → exit 1，stderr 匹配 `^NonRunGroupGranted: __default__: repo\.check`；stdout 为空或不含 `"seats"`。
- **红绿证据**：红 = 现状 `__default__.allowGroups` 为空集且无校验，改成 `['repo.check']` 仍 exit 0；绿 = 抛错。
- **对应测试**：Task 2；`tools/docgen/builders/agents/test/policy-layer-render.test.mjs`。
- **不覆盖**：不判未在 `SEAT_POLICY` 登记的席（回落 `__default__`）是否也触发（同一代码路径）。

### TC-014 配置非 run 组时 gate 中止并点名 NonRunGroupGranted

- **覆盖**：spec §3.2 R3（不静默过滤）/ PRD V1
- **前置**：仓库副本；`$drafts = New-Item -ItemType Directory -Path (Join-Path $env:TEMP ('drafts-' + [guid]::NewGuid()))` 建空草稿目录。
- **步骤**：① 给 `reviewer-audit` 的 `allowGroups` 加 `'docgen.read'`；② 跑 `cli.mjs gate`；③ 用同一坏配置跑 `cli.mjs draft --kind agent --name reviewer-audit --drafts $drafts`；④ 检查草稿目录新增文件数。
- **预期**：`gate` exit 1 且 stderr 首个非空行 `NonRunGroupGranted: reviewer-audit: docgen.read`；`draft` 同样 exit 1、stderr 首行同码；草稿目录新增文件数 = 0（未静默过滤后写盘）。
- **判据**：机器：`node tools/docgen/builders/agents/cli.mjs gate` → exit 1 且 stderr 首行匹配 `^NonRunGroupGranted: reviewer-audit: docgen\.read`；`node tools/docgen/builders/agents/cli.mjs draft --kind agent --name reviewer-audit --drafts $drafts` → exit 1 且 stderr 首行同码；`(Get-ChildItem $drafts -Force | Measure-Object).Count` = 0。
- **红绿证据**：红 = 现状 gate 正常通过并提示 `baseline X/X`，draft 会渲染并写草稿；绿 = 两个入口均 exit 1 且草稿目录为空。
- **对应测试**：Task 2；`tools/docgen/builders/agents/test/policy-layer-render.test.mjs`。
- **不覆盖**：不判 `generate` / `replace` 两个入口（同一 `validatePolicy()` 调用点，由代码审查覆盖）；不判草稿内容。

### TC-015 verb 仍是字符串，且允许组总数 14

- **覆盖**：spec R12 / §4 硬约束 1 / PRD V5
- **前置**：同 TC-001。
- **步骤**：① 跑 `policy --dump`；② 对所有 `verbs` 取 `typeof`；③ 统计允许组 verb 总数。
- **预期**：每个 verb 均为 `string`；允许组总数 14；`git.read` 的 5 条均以 `git --no-optional-locks ` 开头。
- **判据**：机器：`node --input-type=module -e "const m=await import('./tools/docgen/builders/agents/policy/definitions/commands.mjs');const g=m.commandGroups;const v=Object.values(g).flatMap(x=>x.verbs);console.log(v.every(x=>typeof x==='string'),v.length,g['git.read'].verbs.every(x=>x.startsWith('git --no-optional-locks ')))"` → stdout 首行 `true 14 true`。
- **红绿证据**：红 = 若本轮把 verb 对象化，首行变 `false …`；绿 = `true 14 true`。
- **对应测试**：Task 1；`tools/docgen/builders/agents/test/policy-layer.test.mjs`；并重跑 `policy-pure-source.test.mjs`。
- **不覆盖**：不判 verb 的语义归属（见 §7 缺口 1）。

### TC-016 verb 被对象化 → 形状断言必须红

- **覆盖**：spec R12 / §4 硬约束 1
- **前置**：仓库副本。
- **步骤**：① 把 `repo.check.verbs[0]` 改为 `{ cmd: 'npm run check' }`；② 在副本用 TC-015 的同一 `typeof` 断言。
- **预期**：断言输出首字段为 `false`，即用例红。
- **判据**：机器：副本内 `node --input-type=module -e "…同 TC-015…"` → stdout 首行以 `false` 开头；真仓库首行以 `true` 开头。
- **红绿证据**：红 = 真仓库若已对象化则首行 `false`（改造失败）；绿 = 真仓库 `true`、副本构造下 `false`（断言有判别力）。
- **对应测试**：Task 1；`tools/docgen/builders/agents/test/policy-layer.test.mjs`。
- **不覆盖**：不判对象化后功能是否可用（本轮明确不做，见 §6）。

### TC-017 新门禁测试文件自带 1 正 1 负用例（返回 `[]` / 非空）

- **覆盖**：spec R10 / §4 硬约束 5 / PRD V11
- **前置**：新门禁 `scripts/check-command-layer.mjs` 的测试已落在 `tools/docgen/builders/agents/test/policy-layer-render.test.mjs`（plan Task 2 的落点）。
- **步骤**：① 确认测试文件存在；② 跑该测试；③ 检查文件内同时有「返回 `[]` 的正例断言」与「返回非空数组的负例断言」。
- **预期**：测试文件存在；TAP 输出 exit 0 且 `# pass` ≥ 2；含 `deepEqual(scanCards(...), [])` 正例与 `deepEqual(scanCards(...), ['…'])` 非空负例。
- **判据**：机器：`Test-Path tools/docgen/builders/agents/test/policy-layer-render.test.mjs` → `True`；`node --test --test-reporter=tap tools/docgen/builders/agents/test/policy-layer-render.test.mjs` → exit 0 且 stdout 的 `# pass` ≥ 2；`Select-String -Quiet -Path tools/docgen/builders/agents/test/policy-layer-render.test.mjs -Pattern 'deepEqual\([^\n]*\[\]\)'` → `True`；`Select-String -Quiet -Path tools/docgen/builders/agents/test/policy-layer-render.test.mjs -Pattern "deepEqual\([^\n]*\['"` → `True`。
- **红绿证据**：红 = 只有脚本、无测试文件 → `Test-Path` `False`；绿 = 四条全满足。
- **对应测试**：Task 2；`tools/docgen/builders/agents/test/policy-layer-render.test.mjs`（本条自证）。
- **不覆盖**：不判门禁脚本实现是否正确（由 TC-001~TC-014 覆盖判定行为）。

### TC-018 门禁测试缺正例或负例 → 自证断言红

- **覆盖**：spec R10 / PRD V11
- **前置**：`tools/docgen/builders/agents/test/policy-layer-render.test.mjs` 的副本。
- **步骤**：① 在副本删掉非空负例断言（保留 `[]` 正例）；② 跑 TC-017 的四条断言。
- **预期**：非空负例断言缺失，`Select-String -Quiet -Pattern "deepEqual\([^\n]*\['"` 为 `False`，自证判红。
- **判据**：机器：副本上同一 `Select-String -Quiet` → `False`；原文件 → `True`。
- **红绿证据**：红 = 删负例后 `False`；绿 = 原文件 `True`，证明门禁能拦住「只有正例、没有负例」。
- **对应测试**：Task 2；`tools/docgen/builders/agents/test/policy-layer-render.test.mjs`。
- **不覆盖**：不判用例内容是否真能跑（由具体用例承担）。

### TC-019 C5 五数求和 = 卡片数 → 通过

- **覆盖**：spec §3.4 R5 / PRD V4 F-02
- **前置**：临时账本目录 `L`，含 `progress.md`（`## 第 1 轮` 小节、无副本数字）、`cards.md`（3 张卡：`#### BE-1-01 【P0】`、`#### FE-1-01 【P1】`、`#### QA-1-01 【P2】`）、`round-check.md`（第 3 项行的证据栏写 `已修=1 关闭=0 候选=1 升级=0 带往下轮=1`）。
- **步骤**：① 跑 `scs ledger numbers L`；② 看退出码与末行。
- **预期**：exit code = 0；stdout 末行 `账本数字：0 处不一致（1 个轮次小节；cards.md 实际 3 张（P0 1 / P1 1 / P2 1））` 的关键片段 `0 处不一致`。
- **判据**：机器：`scs ledger numbers L` → exit 0，stdout 含 `账本数字：0 处不一致` 且不含 `C5`。
- **红绿证据**：红 = 现状 `ledger-numbers.ts` 无 C5（全文无 `已修` / `带往下轮`），同一夹具 exit 0 但不校验该行 —— 用 TC-020 的坏夹具可证明漏检；绿 = 好夹具 exit 0 且无 C5 报错。
- **对应测试**：Task 3；`D:\Seed\skill-common-script\src\commands\ledger-numbers.test.ts`。
- **不覆盖**：不判 `已修/关闭/候选` 的语义归类（见 §7 缺口 3）。

### TC-020 C5 有行且求和 ≠ 卡片数 → FAIL 并点名两个数

- **覆盖**：spec §3.4 R5 / §5 测试表第 4 行 / PRD V4
- **前置**：同 TC-019，但证据栏写 `已修=2 关闭=0 候选=1 升级=0 带往下轮=1`（求和 4，卡片 3）。
- **步骤**：① 跑 `scs ledger numbers L`；② 看退出码与 FAIL 行。
- **预期**：exit code = 1；stdout 含 `C5 终态对账不符：求和 4 ≠ 卡片数 3`，且该行以 `[FAIL]` 开头。
- **判据**：机器：`scs ledger numbers L` → exit 1，stdout 匹配 `\[FAIL\].*C5 终态对账不符：求和 4 ≠ 卡片数 3`。
- **红绿证据**：红 = 现状同一夹具 exit 0（无 C5）；绿 = exit 1 且点名求和与卡片数。
- **对应测试**：Task 3；`D:\Seed\skill-common-script\src\commands\ledger-numbers.test.ts`。
- **不覆盖**：不判多行 C5 声明如何取（spec 只写「一行」）。

### TC-021 缺 C5 行 → 只 WARN，exit 0

- **覆盖**：spec §3.4 R5（缺行只 WARN）/ §5 测试表第 4 行
- **前置**：同 TC-019，但 `round-check.md` 第 3 项证据栏留空。
- **步骤**：① 跑 `scs ledger numbers L`；② 看退出码与 WARN 行。
- **预期**：exit code = 0；stdout 含 `[WARN] C5 未取数（无第 3 项行）`；无 `[FAIL]`。
- **判据**：机器：`scs ledger numbers L` → exit 0，stdout 匹配 `\[WARN\] C5 未取数（无第 3 项行）`，且 `Select-String -Pattern '\[FAIL\]'` 计数 0。
- **红绿证据**：红 = 若实现把缺行判 FAIL，历史账本会批量假红（exit 1）；绿 = exit 0 且 WARN。
- **对应测试**：Task 3；`D:\Seed\skill-common-script\src\commands\ledger-numbers.test.ts`。
- **不覆盖**：不判同一条 WARN 在一份账本里出现几次（只要求至少一条）。

### TC-022 cards.md 缺失 → WARN + 跳过 C5（沿用 C2 行为）

- **覆盖**：spec §3.4 R5（cards.md 缺失）
- **前置**：同 TC-019，但删除 `cards.md`；`round-check.md` 仍写 C5 行。
- **步骤**：① 跑 `scs ledger numbers L`；② 看退出码与 WARN。
- **预期**：exit code = 0；stdout 含 `[WARN] 缺 cards.md（C5 已跳过）`；无 `[FAIL]`。
- **判据**：机器：`scs ledger numbers L` → exit 0，stdout 含 `缺 cards.md（C5 已跳过）`，`[FAIL]` 计数 0。
- **红绿证据**：红 = 若 C5 无卡片数可比仍报 FAIL，则退出 1；绿 = exit 0 + WARN。
- **对应测试**：Task 3；`D:\Seed\skill-common-script\src\commands\ledger-numbers.test.ts`。
- **不覆盖**：不判 `progress.md` 缺失（现状 exit 2，见 `ledger-numbers.ts:209`）。

### TC-023 C5 行字段不全 / 顺序错 → 视为未取数（WARN），不判红

- **覆盖**：spec §3.4 R5（正则不匹配）
- **前置**：同 TC-019，证据栏写 `已修=1 关闭=0 候选=1`（缺后两项）。
- **步骤**：① 跑 `scs ledger numbers L`；② 看退出码。
- **预期**：exit code = 0；stdout 含 `[WARN] C5 未取数（无第 3 项行）`；无 FAIL。
- **判据**：机器：`scs ledger numbers L` → exit 0，stdout 匹配 `\[WARN\] C5 未取数（无第 3 项行）`。
- **红绿证据**：红 = 若实现用宽松匹配把 3 个数当 5 个用，会报「求和 2 ≠ 3」假红；绿 = WARN + exit 0。
- **对应测试**：Task 3；`D:\Seed\skill-common-script\src\commands\ledger-numbers.test.ts`。
- **不覆盖**：不判数字间用中文逗号分隔的变体（spec 正则只认空白分隔）。

### TC-024 C2 新形态「卡片数 N（P0 a / P1 b / P2 c）」命中且不误报

- **覆盖**：spec §3.5 R6 / PRD V4 F-02
- **前置**：同 TC-019，`progress.md` 加一行 `卡片数 3（P0 1 / P1 1 / P2 1）`（与 cards.md 实际一致）。
- **步骤**：① 跑 `scs ledger numbers L`；② 看是否无 C2 FAIL。
- **预期**：exit code = 0；无 `[FAIL]`；报告末尾仍给 `cards.md 实际 3 张`。
- **判据**：机器：`scs ledger numbers L` → exit 0，`Select-String -Pattern '\[FAIL\]'` 计数 0。
- **红绿证据**：红 = 现状 `ledger-numbers.ts:129` 的「卡级 + 张」门禁把它跳过，故「不报」不能证明命中；绿 = 与 TC-025 联立（错数必报）证明命中。
- **对应测试**：Task 3；`D:\Seed\skill-common-script\src\commands\ledger-numbers.test.ts`。
- **不覆盖**：本正例单独不足以证明命中，判别力由 TC-025 提供（已在 §3 登记）。

### TC-025 C2 新形态数字与卡片不符 → FAIL 并点名 P 级

- **覆盖**：spec §3.5 R6 / §5 测试表第 5 行 / PRD V4
- **前置**：同 TC-024，但写 `卡片数 4（P0 2 / P1 1 / P2 1）`（算术自洽：2+1+1=4）。
- **步骤**：① 跑 `scs ledger numbers L`；② 看 FAIL 行。
- **预期**：exit code = 1；stdout 含 `C2 与 cards.md 实际计数不符`，且点名 `P0 写 2，实为 1` 与 `总数写 4，实为 3`。
- **判据**：机器：`scs ledger numbers L` → exit 1，stdout 匹配 `C2 与 cards.md 实际计数不符`，并含 `P0 写 2，实为 1`。
- **红绿证据**：红 = 现状对新形态整行跳过，exit 0（漏检）；绿 = exit 1 且点名。
- **对应测试**：Task 3；`D:\Seed\skill-common-script\src\commands\ledger-numbers.test.ts`。
- **不覆盖**：不判 C1（算术）是否同时报 —— 本夹具算术自洽，应只报 C2。

### TC-026 同一行两种声明并存 → 只计一次（FAIL 行数 = 1，不双计）

- **覆盖**：spec §3.5 R6（按行去重，不双计）/ §5 测试表第 5 行
- **前置**：同 TC-019，`progress.md` 写一行：`卡片数 2（P0 0 / P1 1 / P2 1）；2 张（卡级 P0 0 / P1 1 / P2 1）`（两段都与实际 3 张不符；两段算术各自自洽）。
- **步骤**：① 跑 `scs ledger numbers L`；② 统计 `[FAIL]` 行数。
- **预期**：exit code = 1；C2 的 `[FAIL]` 行数恰为 1（同一行只取第一个命中，不因两种写法报两次）。
- **判据**：机器：`$out = & scs ledger numbers L 2>&1`；`$LASTEXITCODE` = 1，且 `(Select-String -InputObject $out -Pattern '\[FAIL\].*C2 与 cards.md' -AllMatches).Matches.Count` = 1。
- **红绿证据**：红 = 若两个正则各判一次，会出 2 条 C2 FAIL；绿 = 恰 1 条。
- **对应测试**：Task 3；`D:\Seed\skill-common-script\src\commands\ledger-numbers.test.ts`。
- **不覆盖**：不判跨行的两种声明是否合并（spec 只写「同一行」）。

### TC-027 C2 新形态总数对、P 级分布错 → 仍 FAIL

- **覆盖**：spec §3.5 R6（新形态分布错）/ PRD V4
- **前置**：同 TC-019，写 `卡片数 3（P0 2 / P1 1 / P2 0）`（求和 3 = 卡片数，但分布错）。
- **步骤**：① 跑 `scs ledger numbers L`；② 看 FAIL 点名项。
- **预期**：exit code = 1；FAIL 点名 `P0 写 2，实为 1` 与 `P2 写 0，实为 1`，不含「总数」差异。
- **判据**：机器：`scs ledger numbers L` → exit 1，stdout 含 `P0 写 2，实为 1` 与 `P2 写 0，实为 1`，且不含 `总数写`。
- **红绿证据**：红 = 现状整行跳过、exit 0；绿 = 逐级点名且不误报总数。
- **对应测试**：Task 3；`D:\Seed\skill-common-script\src\commands\ledger-numbers.test.ts`。
- **不覆盖**：不判缺失的 `【P0】` 卡片标题（C2 现有 WARN 面，见 `ledger-numbers.ts:98`）。

### TC-028 C2 半角括号变体 → 仍能识别并判红

- **覆盖**：spec §3.5 R6（`[（(]` / `[）)]`）
- **前置**：同 TC-019，写 `卡片数 4 (P0 2 / P1 1 / P2 1)`（半角括号，数字错）。
- **步骤**：① 跑 `scs ledger numbers L`；② 看是否 FAIL。
- **预期**：exit code = 1；含 `C2 与 cards.md 实际计数不符`。
- **判据**：机器：`scs ledger numbers L` → exit 1，stdout 匹配 `C2 与 cards.md 实际计数不符`。
- **红绿证据**：红 = 若正则只写全角括号，半角整行漏检、exit 0；绿 = exit 1。
- **对应测试**：Task 3；`D:\Seed\skill-common-script\src\commands\ledger-numbers.test.ts`。
- **不覆盖**：不判中英文混排空格（`P0 1/P1 1`）的变体。

### TC-029 模板数据同步后，第 3 项证据栏含取数格式，ledger 比对通过

- **覆盖**：spec §3.4 模板同步 / PRD V6
- **前置**：`outputFormats.mjs` 的 round-check docs 第 3 项证据栏已加「写 `已修=N 关闭=N 候选=N 升级=N 带往下轮=N`」；`skills/parliament-ledger/assets/round-check.md` 由 `ledger.mjs --apply` 重生成。
- **步骤**：① 跑 `ledger.mjs`（不带 `--apply`，只比对）；② 在生成物里检索该格式串。
- **预期**：exit code = 0；`round-check.md` 第 3 项行含 `已修=N`；模板源 `outputFormats.mjs` 同一处也含该串。
- **判据**：机器：`node tools/docgen/builders/agents/ledger.mjs` → exit 0；`(Select-String -Path skills/parliament-ledger/assets/round-check.md -Pattern '已修=N').Count` ≥ 1。
- **红绿证据**：红 = 现状 `round-check.md:14` 只有散文「卡片数 = 已修 + …」，无取数格式、检索计数 0；绿 = 计数 ≥ 1 且比对 exit 0。
- **对应测试**：Task 3；`tools/docgen/builders/agents/test/ledger.test.mjs`。
- **不覆盖**：不判 `--apply` 的写盘原子性（既有实现面）。

### TC-030 手改模板生成物 → ledger.mjs 比对红

- **覆盖**：spec §3.4 模板同步 / PRD V6 负例
- **前置**：仓库副本。
- **步骤**：① 在副本 `skills/parliament-ledger/assets/round-check.md` 末尾追加一行字；② 跑 `ledger.mjs`。
- **预期**：exit code = 1（漂移）。
- **判据**：机器：副本内 `node tools/docgen/builders/agents/ledger.mjs` → exit 1。
- **红绿证据**：红 = 若不比对生成物（只读源），手改会被放过、exit 0；绿 = exit 1。
- **对应测试**：Task 3；`tools/docgen/builders/agents/test/ledger.test.mjs`。
- **不覆盖**：不判漂移报文的措辞（既有实现面）。

### TC-031 本仓不新建计数脚本（无 count-ledger.mjs / 无计数函数）

- **覆盖**：spec §3.7（本仓不新建计数脚本）/ PRD V7
- **前置**：S2 已完成。
- **步骤**：① 全仓按名找 `count-ledger.mjs`；② 在 `scripts/`、`skills/`、`tools/` 的代码里找 `function countLedger` / `function countLedgerNumbers` 实现。
- **预期**：`count-ledger.mjs` 文件数 0；两个函数名实现数 0（计数实现只在 scs 仓）。
- **判据**：机器：`(Get-ChildItem -Path . -Recurse -Filter count-ledger.mjs | Measure-Object).Count` = 0；`(Get-ChildItem -Path scripts,skills,tools -Recurse -Filter *.mjs | Select-String -Pattern 'function countLedger(Numbers)?\b').Count` = 0。
- **红绿证据**：红 = 新建 `count-ledger.mjs` 或写入 `function countLedger...` → 计数 ≥ 1；绿 = 0 与 0。
- **对应测试**：Task 3；`D:\Seed\skill-common-script\src\commands\ledger-numbers.test.ts`（另加 CI 静态检查）。
- **不覆盖**：不判文档里对 `scs ledger numbers` 的引用次数（只判代码）；不扫 `已修=` / `带往下轮`（`outputFormats.mjs` 模板必含，扫它恒红）。

### TC-032 全部落点存在 → landings ok，exit 0

- **覆盖**：spec §3.6 R7 R9 / PRD V8 F-03
- **前置**：临时项目根 `P`，含 `tools/docgen/builders/agents/cli.mjs`（≥3 行）；临时账本 `L`，`round-check.md` 证据栏写 `tools/docgen/builders/agents/cli.mjs:3`；`delivery-audit.md` 存在且无坏引用。
- **步骤**：① 跑 `scs check landings --root P --ledger L`；② 看首行、第二行与退出码。
- **预期**：exit code = 0；stdout 首行 `landings: missing 0（files 2 / refs 1）`；第二行（末行）`landings ok`；无 missing 清单。
- **判据**：机器：`scs check landings --root P --ledger L` → exit 0，stdout 首行匹配 `^landings: missing 0（files 2 / refs 1）$`，第二行为 `landings ok`。
- **红绿证据**：红 = 现状 scs 无 `check landings` 子命令（`src/commands/check.ts:45-90` 只注册 observable / criteria-engine），命令报未知子命令；绿 = 首行计数 + 第二行 `landings ok`。
- **对应测试**：Task 4；`D:\Seed\skill-common-script\src\commands\check-landings.test.ts`。
- **不覆盖**：不判证据栏命令是否可执行（R9，见 TC-042）。

### TC-033 引用路径不存在 → exit 1，首行 missing 计数，点名该引用

- **覆盖**：spec §3.6 R7 / §5 测试表第 6 行 / PRD V4
- **前置**：同 TC-032，证据栏改为 `docs/nope.md:1`。
- **步骤**：① 跑同一命令；② 看首行与缺失清单。
- **预期**：exit code = 1；stdout 首行匹配 `landings: missing N（files M / refs K）` 且 N ≥ 1；输出中给出 `docs/nope.md:1`。
- **判据**：机器：`scs check landings --root P --ledger L` → exit 1，stdout 首行匹配 `^landings: missing \d+（files \d+ / refs \d+）$`，并含 `docs/nope.md:1`。
- **红绿证据**：红 = 无该命令；绿 = exit 1 且点名。
- **对应测试**：Task 4；`D:\Seed\skill-common-script\src\commands\check-landings.test.ts`。
- **不覆盖**：不判首行 N 是否等于「坏引用总条数」（只要求 ≥1，spec 未冻结重复计数规则，见 §7 缺口 5）。

### TC-034 行号越界（文件存在但行数不足）→ 计入 missing，exit 1

- **覆盖**：spec §3.6（文件行数 < N）/ §5 测试表第 6 行 / PRD V4
- **前置**：同 TC-032，证据栏写 `tools/docgen/builders/agents/cli.mjs:99999`。
- **步骤**：① 跑同一命令；② 看退出码与 missing 数。
- **预期**：exit code = 1；首行 missing N ≥ 1；不得因「文件存在」而放行。
- **判据**：机器：`scs check landings --root P --ledger L` → exit 1，stdout 首行匹配 `^landings: missing [1-9]\d*（`。
- **红绿证据**：红 = 若只判 `existsSync` 不判行数，会 exit 0；绿 = exit 1。
- **对应测试**：Task 4；`D:\Seed\skill-common-script\src\commands\check-landings.test.ts`。
- **不覆盖**：不判行内容是否与断言相符（见 §7 缺口 4）。

### TC-035 URL 不算落点：跳过 `://` 后紧跟的 `path:line`

- **覆盖**：spec §3.6（URL 跳过）/ §5 测试表第 6 行
- **前置**：同 TC-032，证据栏写 `见 https://example.com/a.ts:12 以及 tools/docgen/builders/agents/cli.mjs:3`。
- **步骤**：① 跑同一命令；② 看首行计数。
- **预期**：exit code = 0；首行 `landings: missing 0（files 2 / refs 1）`（URL 不计入 refs；`delivery-audit.md` 计入 files）。
- **判据**：机器：`scs check landings --root P --ledger L` → exit 0，stdout 首行匹配 `^landings: missing 0（files 2 / refs 1）$`。
- **红绿证据**：红 = 若不跳过 URL，会把 `example.com/a.ts:12` 当路径 → missing 1、exit 1；绿 = refs 1、exit 0。
- **对应测试**：Task 4；`D:\Seed\skill-common-script\src\commands\check-landings.test.ts`。
- **不覆盖**：不判 `file://` 前缀（spec 只写 `://` 紧邻跳过）。

### TC-036 缺 `--ledger` → exit 2（参数错）

- **覆盖**：spec §3.6 R7（`--ledger` 必填，缺失 exit 2）
- **前置**：同 TC-032 的项目根 `P`。
- **步骤**：① 跑 `scs check landings --root P`（不传账本目录）；② 看退出码与 stderr。
- **预期**：exit code = 2；stderr 一行用法，含 `--ledger`。
- **判据**：机器：`scs check landings --root P` → exit 2，stderr 含 `--ledger`。
- **红绿证据**：红 = 若 `--ledger` 有默认值（如当前目录），会误跑并 exit 0/1；绿 = exit 2。
- **对应测试**：Task 4；`D:\Seed\skill-common-script\src\commands\check-landings.test.ts`。
- **不覆盖**：不判未知旗标（如 `--bogus`）的退出码（spec 未冻结）。

### TC-037 账本目录不存在 → exit 2

- **覆盖**：spec §3.6（账本目录不存在 exit 2）
- **前置**：同 TC-032。
- **步骤**：① 跑 `scs check landings --root P --ledger P\no-such-ledger`；② 看退出码。
- **预期**：exit code = 2；stderr 点名该目录不存在。
- **判据**：机器：同一命令 → exit 2，stderr 含 `no-such-ledger`。
- **红绿证据**：红 = 若静默按空账本通过，会 exit 0；绿 = exit 2。
- **对应测试**：Task 4；`D:\Seed\skill-common-script\src\commands\check-landings.test.ts`。
- **不覆盖**：不判账本内 `round-check.md` 缺失（由 TC-065 覆盖）。

### TC-038 缺 delivery-audit.md → WARN，退出码不变

- **覆盖**：spec §3.6（delivery-audit 可选，缺失 WARN）
- **前置**：同 TC-032，但删除 `delivery-audit.md`。
- **步骤**：① 跑同一命令；② 看退出码与 stdout 首末行；③ stderr 侧 WARN 由测试文件断言。
- **预期**：exit code = 0；stdout 首行 `landings: missing 0（files 1 / refs 1）`、第二行 `landings ok`，且不含 `WARN`；stderr 含 `[WARN] 缺 delivery-audit.md`（由测试文件核对）。
- **判据**：机器：`scs check landings --root P --ledger L` → exit 0；**stdout** 首行匹配 `^landings: missing 0（files 1 / refs 1）$`、第二行 `landings ok`，且 stdout 不含 `WARN`。stderr 的 `[WARN] 缺 delivery-audit.md` 由 `check-landings.test.ts` 用 `spawnSync` 分别取 stdout/stderr 断言。
- **红绿证据**：红 = WARN 写 stdout → 首行被 WARN 挤掉；绿 = stdout 首行计数、第二行 `landings ok`，WARN 只在 stderr。
- **对应测试**：Task 4；`D:\Seed\skill-common-script\src\commands\check-landings.test.ts`（`spawnSync` 分取 stdout/stderr，断言 stderr 含该 WARN）。
- **不覆盖**：不判 WARN 的措辞变体（spec 已逐字冻结）；shell 判据不做文件重定向（重定向符号撞 `fs.write`），stderr 面由测试文件承担。

### TC-039 反斜杠相对路径（Windows 写法）能识别

- **覆盖**：spec §3.6（token 正则含 `\\`）
- **前置**：同 TC-032，证据栏写 `tools\docgen\builders\agents\cli.mjs:3`。
- **步骤**：① 跑同一命令；② 看 refs、首行末行与退出码。
- **预期**：exit code = 0；首行 `landings: missing 0（files 2 / refs 1）`；末行 `landings ok`。
- **判据**：机器：`scs check landings --root P --ledger L` → exit 0，首行匹配 `^landings: missing 0（files 2 / refs 1）$`，末行为 `landings ok`。
- **红绿证据**：红 = 若字符类漏 `\\`，该引用不被识别 → refs 0（或 missing 1）；绿 = refs 1。
- **对应测试**：Task 4；`D:\Seed\skill-common-script\src\commands\check-landings.test.ts`。
- **不覆盖**：不判含盘符绝对路径（`D:\...`）的解析规则（spec 未写，见 §7 缺口 5）。

### TC-040 只拷 scs + 临时项目根与账本 → landings 可跑（不绑本仓）

- **覆盖**：spec §3.6 R7 R9 / §5 测试表第 8 行 / PRD V2 V8 F-03
- **前置**：临时目录 `T`：只放 `D:\Seed\skill-common-script\dist` 与 `package.json`；另建 `P2`（项目根，含一个 ≥3 行文件）与 `L2`（账本，引用该文件）。
- **步骤**：① 跑 `node T\dist\index.js check landings --root P2 --ledger L2`；② 跑 `node T\dist\index.js check landings --help`。
- **预期**：第一条 exit 0、stdout 首行 `landings: missing 0（files 1 / refs 1）`、第二行 `landings ok`（`delivery-audit.md` 的 WARN 在 stderr，不占 stdout）；第二条 exit 0 且帮助里 `--root <dir>` 描述为「项目根（默认当前目录）」。
- **判据**：机器：上述两条命令 → 均 exit 0；第一条 **stdout** 首行匹配 `^landings: missing 0（files 1 / refs 1）$` 且第二行 `landings ok`；帮助 stdout 匹配 `--root <dir>\s+项目根`。
- **红绿证据**：红 = 若命令按自身相对路径找数据，在 `T` 下缺目录 → exit 2；绿 = 两条均 exit 0。
- **对应测试**：Task 4；`D:\Seed\skill-common-script\src\commands\check-landings.test.ts`。
- **不覆盖**：不判 scs 内部实现（由其仓 vitest 覆盖）。

### TC-041 不传 `--root` / `--ledger` 换目录跑 → 失败（不得回落本仓布局）

- **覆盖**：spec §3.6 R7 / PRD V2 V8 负例
- **前置**：同 TC-040 的 `T`；当前工作目录设为 `T`。
- **步骤**：① 在 `T` 下跑 `node dist\index.js check landings`；② 看退出码。
- **预期**：exit code ≠ 0（默认当前目录 `T` 没有账本 → 按 TC-037 语义 exit 2）。
- **判据**：机器：`node dist\index.js check landings`（cwd=`T`）→ exit 2。
- **红绿证据**：红 = 若默认值指向本仓绝对路径，反而能跑通（证明绑仓）；绿 = exit 2。
- **对应测试**：Task 4；`D:\Seed\skill-common-script\src\commands\check-landings.test.ts`。
- **不覆盖**：不判默认值是「当前目录」还是「报错」（spec 仅要求 `--root` 默认当前目录）。

### TC-042 landings 不执行证据栏命令（#7 重放不实现）

- **覆盖**：spec R9 / §3.6 与 #7 的边界 / §5 测试表第 6 行
- **前置**：账本证据栏写 `tools/docgen/builders/agents/cli.mjs:3` 且另含 `node -e "require('fs').writeFileSync('marker.txt','x')"`；在账本目录预置「无 marker.txt」。
- **步骤**：① 跑 `scs check landings --root P --ledger L`；② 检查 `marker.txt` 是否存在。
- **预期**：exit code = 0；`marker.txt` 不存在（命令未被执行）。
- **判据**：机器：`Test-Path L\marker.txt` → `False`；同一命令 exit 0。
- **红绿证据**：红 = 若实现执行证据栏命令，会生成 `marker.txt`（`True`）；绿 = `False` 且 exit 0。
- **对应测试**：Task 4；`D:\Seed\skill-common-script\src\commands\check-landings.test.ts`。
- **不覆盖**：不判「命令字符串是否被安全解析」（不执行即无攻击面）。

### TC-043 「旧路径 → 新命令」映射表 3 行 + 日期注 + 迁移基线文件存在

- **覆盖**：spec §3.7 R8（映射表 + 基线文件前置）/ PRD V10 F-04
- **前置**：S4 迁移交付物已落；`docs/prd/20261105182104-rule-refactor/prd/stage-2b-testcase-sdet.md` 已加日期注（不改原文）；迁移前已写 `docs/devworkflows/20261109211349-script-layer-refactor/migration-baseline.json`。
- **步骤**：① 在 spec §3.7 表格数旧位置行；② 在 stage-2b 文档检索 `2026-11-09`；③ 读基线文件，逐条检查四类字段。
- **预期**：spec 表恰 3 行旧位置（其中 `skill-dir.mjs` 不迁、不占基线条目）；stage-2b 文档含日期注 ≥ 1 处；基线文件 `entries` 恰 2 条（check.mjs / score.mjs），每条有 `exit` / `stdoutFirst` / `stdoutLast` / `codes` 四类信息；`sample` 一律记项目根（不含 `/skills`）。
- **判据**：机器：`(Select-String -Path docs/superpowers/specs/2026-11-09-script-layer-refactor-design.md -Pattern '^\|\s*.?(skills|scripts)/').Count` = 3；`(Select-String -Path docs/prd/20261105182104-rule-refactor/prd/stage-2b-testcase-sdet.md -Pattern '2026-11-09').Count` ≥ 1；`Test-Path docs/devworkflows/20261109211349-script-layer-refactor/migration-baseline.json` → `True`，且 `entries.Count` = 2、每条含 `exit` / `stdoutFirst` / `stdoutLast` / `codes` 四键、`sample` 不匹配 `/skills$`。
- **红绿证据**：红 = 基线文件不存在或 `entries.Count` ≠ 2 → 第三步 `Test-Path` / 解析断言失败；绿 = 三者均满足。
- **对应测试**：Task 6；`scripts/check-migration-contract.test.mjs`。
- **不覆盖**：不判新命令名是否被 scs 仓接受（跨仓，见 §7 缺口 6）。

### TC-044 迁移三类契约与基线逐项比对 → 差异 0

- **覆盖**：spec §3.7 R8（基线逐项 diff）/ §5 测试表第 7 行 / PRD V10
- **前置**：迁移前对两组 CLI 旧脚本（`check.mjs` / `score.mjs`）用固定样本跑过，结果已写入 `docs/devworkflows/20261109211349-script-layer-refactor/migration-baseline.json`（`entries` 恰 2 条，含 exit / stdout 首行 / stdout 末行 / code 串）。
- **步骤**：① 对两组（skills / rules）各跑新命令；② 与基线逐项 diff；③ 检查未登记差异数为 0。
- **预期**：两组均 0 差异；比对报告末行 `contract diffs: 0`（`list skills` 不参与基线 diff）。
- **判据**：机器：`node --test scripts/check-migration-contract.test.mjs` → exit 0，stdout 含 `contract diffs: 0`。
- **红绿证据**：红 = 基线缺失时测试直接失败（无基线不得比对）；任一差异未登记时报告 `contract diffs: ≥1` 且 exit 1；绿 = 0。
- **对应测试**：Task 6；`scripts/check-migration-contract.test.mjs`。
- **不覆盖**：不判新旧命令的「实现是否同源」（只判可观察契约）；不判 `list skills`（库形态，归 TC-052/053 与静态用例）。

### TC-045 新命令 exit 语义变化（0↔1）→ 契约测试红

- **覆盖**：spec §3.7 R8 / PRD V10
- **前置**：同 TC-044；构造「旧脚本返回 1」的夹具（如一条违规规则）。
- **步骤**：① 在副本把新命令实现改成遇同一违规返回 0；② 跑契约测试。
- **预期**：测试 exit 1；差异报告点名 `exit: 1 -> 0`。
- **判据**：机器：副本内 `node --test "<迁移契约测试>"` → exit 1，stdout 含 `exit: 1 -> 0`。
- **红绿证据**：红 = 改造前副本即红；绿 = 真仓库迁移后 0 差异。
- **对应测试**：Task 6；`scripts/check-migration-contract.test.mjs`。
- **不覆盖**：不判 exit 2（用法错）的差异（同类断言，可由同表覆盖）。

### TC-046 新命令 code 串变化 → 契约测试红

- **覆盖**：spec §3.7 R8 / PRD V10
- **前置**：同 TC-044。
- **步骤**：① 在副本把新命令输出中的 `UnknownRuleRef` 改为 `UNKNOWN_RULE_REF`；② 跑契约测试。
- **预期**：测试 exit 1；报告点名缺失 code 串 `UnknownRuleRef`。
- **判据**：机器：副本内 `node --test "<迁移契约测试>"` → exit 1，stdout 含 `UnknownRuleRef`。
- **红绿证据**：红 = 副本红；绿 = 真仓库 0 差异。
- **对应测试**：Task 6；`scripts/check-migration-contract.test.mjs`。
- **不覆盖**：不判 code 串大小写是否「等价」（契约要求逐字不变）。

### TC-047 新命令 stdout 首行 / 末行变化 → 契约测试红

- **覆盖**：spec §3.7 R8 / PRD V10
- **前置**：同 TC-044。
- **步骤**：① 在副本给新命令 stdout 末尾加一行；② 跑契约测试。
- **预期**：测试 exit 1；报告点名「末行」不一致。
- **判据**：机器：副本内 `node --test "<迁移契约测试>"` → exit 1，stdout 含 `last-line`。
- **红绿证据**：红 = 副本红；绿 = 真仓库 0 差异。
- **对应测试**：Task 6；`scripts/check-migration-contract.test.mjs`。
- **不覆盖**：不判中间行差异（spec 只冻结首末行）。

### TC-048 迁移后技能内脚本的技能外引用命中 = 0

- **覆盖**：spec §3.7 R13 / PRD V3（迁移后命中 0）
- **前置**：S4 已完成；`skills/skill-inspector/scripts/check.mjs`、其测试 `check.test.mjs` 与兜底副本、`skills/rule-inspector/scripts/score.mjs` 均已迁 scs 并删除（测试随源删除）。
- **步骤**：① 扫 `skills/**/scripts/*.mjs` 中的 `../../../`；② 统计命中。
- **预期**：命中 = 0（`check.mjs` 2 处 + `check.test.mjs` 3 处 + `score.mjs` 3 处，随文件删除）。
- **判据**：机器：`(Get-ChildItem -Path skills -Recurse -Include *.mjs | Select-String -Pattern '\.\./\.\./\.\./').Count` = 0。
- **红绿证据**：红 = 当前实测 8 处（`check.test.mjs` 3 / `check.mjs` 2 / `score.mjs` 3）；绿 = 0。
- **对应测试**：Task 6；`scripts/check-migration-contract.test.mjs`。
- **不覆盖**：不判 `../../` 两级引用；不判 scs 仓内实现（归 scs）。

### TC-049 把 score.mjs 原样留作技能脚本 → 命中 3，红

- **覆盖**：spec R13 / §3.7 / PRD V3 负例
- **前置**：仓库副本；把改造前的 `skills/rule-inspector/scripts/score.mjs` 恢复（文件内 3 处 `../../../tools/...`）。
- **步骤**：① 在副本跑 TC-048 的同一扫描；② 统计命中。
- **预期**：命中 ≥ 3（`score.mjs:4` / `:15` / `:18`），判红。
- **判据**：机器：副本内同一命令 → 计数 ≥ 3，且命中清单含 `score.mjs`。
- **红绿证据**：红 = 副本 ≥3；绿 = 迁移后真仓库 0（TC-048），证明扫描能拦住「旧脚本原样留下」。
- **对应测试**：Task 6；`scripts/check-migration-contract.test.mjs`。
- **不覆盖**：不判 `gen-rule-checklist.mjs` 是否也含外部引用（PRD 判「先留技能」，另行评估）。

### TC-050 `scripts/skill-dir.mjs` 全仓恰 1 份，无兜底副本

- **覆盖**：spec §3.7 R13（库不迁，保持本仓单源）/ PRD V3 F-04
- **前置**：S4 已完成；`scripts/skill-dir.mjs` 保留；`check.mjs`、`check.test.mjs` 与兜底副本已删除（随迁移）。
- **步骤**：① 全仓找 `skill-dir.mjs`，核对份数与路径；② 找 `listSkillDirsFallback`；③ 在 `scripts/skill-dir.mjs` 之外找 `function listSkillDirs` 实现。
- **预期**：`skill-dir.mjs` 全仓恰 1 份且为 `scripts/skill-dir.mjs`；`listSkillDirsFallback` 命中 0；除 `scripts/skill-dir.mjs` 外任何 `listSkillDirs` 实现 = 0。
- **判据**：机器：`(Get-ChildItem -Path . -Recurse -Filter skill-dir.mjs | Measure-Object).Count` = 1 且路径为 `scripts/skill-dir.mjs`；`(Get-ChildItem -Path scripts,skilldependencies,skills -Recurse -Include *.mjs,*.test.mjs | Select-String -Pattern 'listSkillDirsFallback').Count` = 0；`(Get-ChildItem -Path scripts,skilldependencies,skills -Recurse -Include *.mjs | Where-Object { $_.FullName -notlike '*\scripts\skill-dir.mjs' } | Select-String -Pattern 'function listSkillDirs').Count` = 0。
- **红绿证据**：红 = 当前 `check.mjs` 3 处 + `check.test.mjs` 4 处 = 7 处 `listSkillDirsFallback` → 第二条 ≥1；绿 = 三条全满足。
- **对应测试**：Task 5；`scripts/check-skill-dir-single-source.test.mjs`。
- **不覆盖**：不判 `scs list skills --json` 与库函数是否同语义（R13 要求同语义，由 scs 仓 vitest + TC-052 覆盖）；不判文档 / 历史快照中的提及。

### TC-051 副本在其他技能里再放一份 `skill-dir.mjs` / 第二个实现 → 命中 ≥1，红

- **覆盖**：spec R13 / §3.7 / PRD V3
- **前置**：仓库副本。
- **步骤**：① 在副本 `skills/rule-inspector/scripts/` 再放一份 `skill-dir.mjs`（或第二个 `function listSkillDirs` 实现）；② 跑 TC-050 的同一扫描。
- **预期**：`skill-dir.mjs` 份数 = 2（或 `function listSkillDirs` 越界命中 ≥1），判红。
- **判据**：机器：副本内同一命令 → 第一条计数 = 2（或第三条 ≥1）。
- **红绿证据**：红 = 副本命中 ≥1；绿 = 真仓库全 0（TC-050），证明扫描能拦住「第二份实现回流」。
- **对应测试**：Task 5；`scripts/check-skill-dir-single-source.test.mjs`。
- **不覆盖**：不判副本内容是否与单源等价（语义面，由差分用例运行时判）。

### TC-052 读基线 skill-inspector 条目，与新命令逐项比对

- **覆盖**：spec §3.7 R8 / §5 测试表第 7 行 / PRD V8 F-04
- **前置**：`migration-baseline.json` 含 skill-inspector 条目（`oldCommand` / `sample` / `exit` / `stdoutFirst` / `stdoutLast` / `codes`，`sample` 记**项目根**）；临时目录 `T` 只放 `dist` + `package.json`。
- **步骤**：① 读基线里 skill-inspector 条目的 `sample`（项目根）；② 换算：旧命令是 `check.mjs --dir <sample>/skills`，新命令是 `scs check skills --root <sample>`（同一 `sample`、`--dir` 由 `<sample>/skills` 拼出）；③ 用 `node T\dist\index.js check skills --root <sample>` 跑同一样本；④ 比对 `exit` / `stdoutFirst` / `stdoutLast` / `codes`。
- **预期**：四项逐项相等，差异 0；不出现 `ENOENT`（不依赖本仓目录）；`sample` 本身不含 `/skills` 后缀。
- **判据**：机器：`node --test scripts/check-migration-contract.test.mjs` → exit 0，stdout 含 `skill-inspector: diffs 0`。
- **红绿证据**：红 = 现状无 `check skills` 子命令 / 基线缺失 → 比对失败；绿 = `diffs 0`。
- **对应测试**：Task 6；`scripts/check-migration-contract.test.mjs`。
- **不覆盖**：不判技能判定逻辑本身（迁移不改判定，见 §6）；不再跑旧脚本（旧文件迁移后已删）。

### TC-053 换目录且不传 `--root` → 跑失败（默认值不得回落本仓）

- **覆盖**：spec §3.7 R11 / PRD V8 负例
- **前置**：同 TC-052 的 `T`；cwd 设为 `T`。
- **步骤**：① 在 `T` 跑 `node dist\index.js check skills`；② 看退出码。
- **预期**：exit code = 2（找不到默认目录），不是 0。
- **判据**：机器：`node dist\index.js check skills`（cwd=`T`）→ exit 2。
- **红绿证据**：红 = 若默认值写死本仓绝对路径，在 `T` 下仍 exit 0；绿 = exit 2。
- **对应测试**：Task 6；`D:\Seed\skill-common-script\src\commands\check-skills.test.ts`。
- **不覆盖**：不判 `--root` 省略时是否应等价 cwd（由 TC-052 正例覆盖）。

### TC-054 本仓 `package.json` 的 scs 调用 0 处依赖默认值

- **覆盖**：spec R11 / §5 行 9 / PRD V2 V8（本仓调用面 0 处依赖默认值）
- **前置**：本仓 `package.json` 已改；只检查调用面，不检查 scs 源码。
- **步骤**：① 解析 `package.json` 的全部 `scripts`；② 对含 `scs ` 的脚本检查显式路径旗标：`check criteria-engine` 须含 `--engine/--data/--projection/--terms/--surface`，其余 scs 调用须含 `--terms` 或 `--root`；③ 统计不合规条数。
- **预期**：不合规条数 = 0（0 处依赖默认值）。
- **判据**：机器：`node -e "const p=require('./package.json').scripts;const bad=Object.entries(p).filter(([k,v])=>/scs\s/.test(v)).filter(([k,v])=>/check criteria-engine/.test(v)?!['--engine','--data','--projection','--terms','--surface'].every(f=>v.includes(f)):!(/--terms|--root/.test(v)));console.log('bad='+bad.length);process.exitCode=bad.length?1:0"` → exit 0，stdout `bad=0`。
- **红绿证据**：红 = 任一条 scs 调用删掉显式旗标 → `bad=1`、exit 1；绿 = `bad=0`（现状 `package.json:11-12` 已满足）。
- **对应测试**：Task 6；`scripts/check-migration-contract.test.mjs`。
- **不覆盖**：不判 scs 源码默认值（明确归 scs 仓，见 §6）；不判旗标值是否指向正确目录（语义面）。

### TC-055 本仓某条 scs 调用删掉显式旗标 → 调用面断言红

- **覆盖**：spec R11 / §5 行 9（调用面负例）
- **前置**：仓库副本。
- **步骤**：① 在副本把 `scripts['check:criteria']` 里的 `--engine ...` 一段删掉；② 跑 TC-054 的同一 `node -e` 检查。
- **预期**：输出 `bad=1`（或 ≥1），exit 1。
- **判据**：机器：副本内同一命令 → exit 1，stdout 匹配 `^bad=[1-9]\d*$`。
- **红绿证据**：红 = 副本 red；绿 = 真仓库 `bad=0`（TC-054），证明断言能拦住「依赖默认值」。
- **对应测试**：Task 6；`scripts/check-migration-contract.test.mjs`。
- **不覆盖**：不判删旗标后的实际运行结果（行为面由 TC-057 覆盖）。

### TC-056 本仓 `package.json` 显式传 `--engine/--data/--projection/--terms/--surface`

- **覆盖**：spec R11 / §4 硬约束 3
- **前置**：本仓 `package.json` 已改。
- **步骤**：① 读 `scripts['check:criteria']` 与 `scripts['check:observable']`；② 检索各旗标。
- **预期**：`check:criteria` 含 `--engine`、`--data`、`--projection`、`--terms`、`--surface`；`check:observable` 含 `--terms`。
- **判据**：机器：`node -e "const p=require('./package.json');console.log(p.scripts['check:criteria'])"` → exit 0，输出含上述五个旗标。
- **红绿证据**：红 = 若删掉旗标只留 `scs check criteria-engine`，输出不含 `--engine`；绿 = 五旗标齐全（现状 `package.json:12` 已满足）。
- **对应测试**：Task 6；`scripts/check-migration-contract.test.mjs`。
- **不覆盖**：不判 `--surface` 的目录值是否覆盖全部需扫面（语义面）。

### TC-057 去掉显式传参 → 走默认值找不到目录，exit 2

- **覆盖**：spec R11 / PRD V2 负例
- **前置**：仓库副本，`package.json` 的 `check:criteria` 删掉 `--engine/--data/--projection/--terms`。
- **步骤**：① 在副本跑 `npm run check:criteria`；② 看退出码。
- **预期**：exit code = 2（`判据引擎目录不存在：tools/quality/criteria-engine`）。
- **判据**：机器：副本内 `npm run check:criteria` → exit 2，stderr 含 `判据引擎目录不存在`。
- **红绿证据**：红 = 不改时用默认值即 exit 2（证明默认值已漂）；绿 = 真仓库显式传参 exit 0。
- **对应测试**：Task 6；`scripts/check-migration-contract.test.mjs`。
- **不覆盖**：不判默认值是否应改成 `tools/docgen/...`（spec §6 明确不改）。

### TC-058 每个新命令同目录有 `*.test.ts`，且 `npm test` 全绿

- **覆盖**：spec §3.7 / PRD V9
- **前置**：scs 仓已实现 C5、C2 适配、`check landings`、`check skills`、`check rules`、`list skills`。
- **步骤**：① 检查 `src/commands/` 下新命令均有同名 `.test.ts`；② 跑 scs 的 `npm test`。
- **预期**：新命令测试文件齐全（至少 `ledger-numbers.test.ts` 扩展 + `check-landings.test.ts`）；`npm test` exit 0。
- **判据**：机器：`Test-Path D:\Seed\skill-common-script\src\commands\check-landings.test.ts` → `True`；`npm test`（cwd = scs 仓）→ exit 0。
- **红绿证据**：红 = 现状 `src/commands/` 无 `check-landings.ts` / `check-landings.test.ts`（实现 8 / 测试 5 的缺口，PRD §2-21）；绿 = 齐全且全绿。
- **对应测试**：Task 6；`D:\Seed\skill-common-script\src\commands\check-skills.test.ts`。
- **不覆盖**：不判测试用例的断言强度（由 TC-019~TC-042 覆盖行为面）。

### TC-059 新增命令实现但无同名 test → 清单比对红（不计入通过）

- **覆盖**：spec §3.7 / PRD V9 负例
- **前置**：scs 仓副本。
- **步骤**：① 在副本新增 `src/commands/foo.ts`（无 `foo.test.ts`）；② 跑「实现/测试同名比对」脚本。
- **预期**：缺测清单含 `foo.ts`，计数 ≥1（该命令不计入通过）。
- **判据**：机器：副本内比对脚本 → 输出含 `foo.ts`，exit 1。
- **红绿证据**：红 = 无比对脚本时无法发现；绿 = 真仓缺测清单只剩纯分发 `check` / `help` / `ledger`（PRD §2-21 例外）。
- **对应测试**：Task 6；`scripts/check-migration-contract.test.mjs`。
- **不覆盖**：不判「有 test 但无用例」的空壳文件（语义面，见 §7 缺口 6）。

### TC-060 生成物纪律：`generate` 默认只比不写，exit 0

- **覆盖**：spec §4 硬约束 6 / PRD §7 不改 `agents/*.md`
- **前置**：工作区干净；`agents/*.md` 为重生成后的产物。
- **步骤**：① 跑 `node tools/docgen/builders/agents/cli.mjs generate`；② 看退出码与 stdout 末行。
- **预期**：exit code = 0；stdout 末行 `baseline X/X`；工作区 `git status --porcelain` 无输出。
- **判据**：机器：`node tools/docgen/builders/agents/cli.mjs generate` → exit 0，stdout 末行匹配 `^baseline \d+/\d+$`；`git --no-optional-locks status --porcelain` 无输出。
- **红绿证据**：红 = 手改卡后 generate 仍 exit 0（只比不写是设计），但 `gate` 会红；绿 = 本命令 exit 0 且工作区干净。
- **对应测试**：Task 2；`tools/docgen/builders/agents/test/policy-layer-render.test.mjs`。
- **不覆盖**：不判 `--apply` 写盘（本轮不改卡落盘流程）。

### TC-061 手改一张卡 → `gate` 红并点名该路径

- **覆盖**：spec §4 硬约束 6 / PRD §7 不改 `agents/*.md` 负例
- **前置**：仓库副本。
- **步骤**：① 在副本 `agents/reviewer-audit.md` 末尾追加一个字节；② 跑 `cli.mjs gate`。
- **预期**：exit code = 1；stderr 首个非空行以 `Mismatch: ` 开头并含 `agents/reviewer-audit.md`。
- **判据**：机器：副本内 `node tools/docgen/builders/agents/cli.mjs gate` → exit 1，stderr 匹配 `^Mismatch: .*agents/reviewer-audit\.md`。
- **红绿证据**：红 = 副本手改即红；绿 = 真仓库 gate exit 0。
- **对应测试**：Task 2；`tools/docgen/builders/agents/test/policy-layer-render.test.mjs`。
- **不覆盖**：不判 `replace` 的凭证机制（不属于本 spec）。

### TC-062 `--root` 在帮助里定义为「项目根（默认当前目录）」

- **覆盖**：spec §3.6 R7
- **前置**：新命令已注册。
- **步骤**：① 跑 `scs check landings --help`；② 检索 `--root` 描述。
- **预期**：exit code = 0；输出含 `--root <dir>` 且描述含「项目根」与「默认当前目录」。
- **判据**：机器：`scs check landings --help` → exit 0，stdout 匹配 `--root <dir>\s+项目根（默认当前目录）`。
- **红绿证据**：红 = 现状无该子命令；绿 = 帮助文本如上。
- **对应测试**：Task 4；`D:\Seed\skill-common-script\src\commands\check-landings.test.ts`。
- **不覆盖**：不判 `--data` / `--engine` 的同类描述（R7 已覆盖，由既有命令帮助承担）。

### TC-063 `--root` 相对路径与绝对路径等价

- **覆盖**：spec §3.6 R7（`--root` 解析口径）
- **前置**：同 TC-032；cwd 设为项目根的父目录。
- **步骤**：① 跑 `scs check landings --root P --ledger L`（`P` 为相对路径）；② 换成绝对路径再跑一次。
- **预期**：两次 exit code 相同（均 0）；两次首行均为 `landings: missing 0（files 2 / refs 1）`，末行均为 `landings ok`。
- **判据**：机器：两条命令 → 均 exit 0，首行均匹配 `^landings: missing 0（files 2 / refs 1）$`，末行均为 `landings ok`。
- **红绿证据**：红 = 若实现只认绝对路径，相对路径那次 exit 2；绿 = 两次一致。
- **对应测试**：Task 4；`D:\Seed\skill-common-script\src\commands\check-landings.test.ts`。
- **不覆盖**：不判符号链接 / 大小写归一（Windows 平台语义，见 §6）。

### TC-064 run 组（`tool.time`）verbs 为空 → 仍报 GroupEmpty

- **覆盖**：spec §3.1（`GroupEmpty`，run 组空 verbs）/ PRD V5
- **前置**：仓库副本；其余三组合法。
- **步骤**：① 把 `tool.time.verbs` 改成 `[]`（`layer: 'run'` 保持不变）；② 跑 `policy --dump`。
- **预期**：exit code = 1；stderr 首个非空行 `GroupEmpty: tool.time`；不因该组是 run 组而放行，也不连报其它三组。
- **判据**：机器：`$err = & node tools/docgen/builders/agents/cli.mjs policy --dump 2>&1`；`$LASTEXITCODE` = 1，`$err` 首个非空行匹配 `^GroupEmpty: tool\.time`，且 `(Select-String -InputObject $err -Pattern '^Group').Count` = 1。
- **红绿证据**：红 = 现状空 verbs 直接通过（`validatePolicy.mjs:106-131` 不扫 verbs），exit 0；绿 = exit 1 且只报该组。
- **对应测试**：Task 1；`tools/docgen/builders/agents/test/policy-layer.test.mjs`。
- **不覆盖**：不判 `verbs` 键缺失（`undefined`）与空数组是否同码（spec 只写「为空」）。

### TC-065 账本目录存在但缺 `round-check.md` → exit 2

- **覆盖**：spec §3.6（`round-check.md` 必需，缺失 exit 2）/ PRD V4
- **前置**：临时账本目录 `L` 只放 `cards.md`，不放 `round-check.md`。
- **步骤**：① 跑 `scs check landings --root P --ledger L`；② 看退出码与 stderr。
- **预期**：exit code = 2；stderr 含 `不是账本目录（缺 round-check.md）`。
- **判据**：机器：同一命令 → exit 2，stderr 匹配 `不是账本目录（缺 round-check\.md）`。
- **红绿证据**：红 = 若把缺 `round-check.md` 当空账本 → 首行 `landings: missing 0 …` 且 exit 0；绿 = exit 2 且报文点名缺件。
- **对应测试**：Task 4；`D:\Seed\skill-common-script\src\commands\check-landings.test.ts`。
- **不覆盖**：不判 `round-check.md` 存在但无第 3 项行（spec 已并入同一 WARN 文案，由 TC-021 覆盖）。

### TC-066 `--ledger` 按 cwd 解析，不相对 `--root`

- **覆盖**：spec §3.6 R7（`--ledger` 按 cwd，不相对 `--root`）
- **前置**：cwd = `T`；`T\proj` 为项目根（含被引文件），`T\ledger` 为账本；`T\proj\ledger` 不存在。
- **步骤**：① 在 `T` 跑 `scs check landings --root proj --ledger ledger`；② 看退出码。
- **预期**：exit code = 0、stdout 首行 `landings: missing 0（files 1 / refs 1）`、末行 `landings ok`（缺 `delivery-audit.md` 的 WARN 在 stderr，不占 stdout；账本从 cwd 解析；若错误地相对 `--root` 解析，会找不到 `proj\ledger` → exit 2）。
- **判据**：机器：同一命令 → exit 0，**stdout** 首行匹配 `^landings: missing 0（files 1 / refs 1）$`，末行 `landings ok`。
- **红绿证据**：红 = 实现把 `--ledger` 拼到 `--root` 后 → exit 2；绿 = exit 0。
- **对应测试**：Task 4；`D:\Seed\skill-common-script\src\commands\check-landings.test.ts`。
- **不覆盖**：不判 `--root` 缺省时的 cwd 值（由 TC-062 / TC-063 覆盖）。

### TC-067 无 `migration-baseline.json` 就改调用方 → 判不通过

- **覆盖**：spec §3.7（迁移前基线）/ §4 硬约束 7 / PRD V10
- **前置**：仓库副本；删除基线文件，并删除旧脚本 `skills/rule-inspector/scripts/score.mjs`、把其消费方改为新命令（模拟「先切调用方」）。
- **步骤**：① 在副本跑迁移守卫脚本；② 看退出码与报文。
- **预期**：守卫 exit 1；报文点名「缺迁移基线，不得改调用方」类信息（含 `migration-baseline.json`）。
- **判据**：机器：副本内 `node --test "<迁移守卫测试>"` → exit 1，stdout/stderr 含 `migration-baseline.json`。
- **红绿证据**：红 = 无守卫时半迁移可通过；绿 = 有基线且旧脚本/新命令状态一致时 exit 0。
- **对应测试**：Task 6；`scripts/check-migration-contract.test.mjs`。
- **不覆盖**：不判 scs 是否已发布（发布状态由「新命令可跑」间接体现，见 §7 缺口 6）。

### TC-068 基线与新命令有未登记差异 → 判不通过

- **覆盖**：spec §3.7（未登记差异）/ PRD V10
- **前置**：仓库副本；基线文件存在；映射表「契约变化」列留空。
- **步骤**：① 在副本让新命令对同一样本多输出一行（模拟未登记差异）；② 跑契约比对。
- **预期**：比对 exit 1；报告点名该差异且标注「未登记」。
- **判据**：机器：副本内 `node --test "<迁移契约测试>"` → exit 1，stdout 含 `unregistered`。
- **红绿证据**：红 = 未登记差异被放过 → exit 0；绿 = exit 1 且标注 `unregistered`。
- **对应测试**：Task 6；`scripts/check-migration-contract.test.mjs`。
- **不覆盖**：不判「已登记差异」的合法性（理由是否成立由人工评审）。

### TC-069 旧声明形态「N 张（卡级 …）」仍命中且不误报

- **覆盖**：spec §3.5 R6（原 `RE_ARITH` 分支保留）/ PRD V4 F-02
- **前置**：账本 `L`：`cards.md` 含 2 张卡（`#### BE-1-01 【P1】`、`#### FE-1-01 【P2】`）；`progress.md` 先写好样本 `2 张（卡级 P0 0 / P1 1 / P2 1）`；`round-check.md` 无 C5 行。
- **步骤**：① 好样本跑 `scs ledger numbers L`；② 把 `progress.md` 改为错数样本 `2 张（卡级 P0 1 / P1 1 / P2 0）`；③ 再跑一次。
- **预期**：好样本 exit 0、无 C2 FAIL；错数样本 exit 1、stdout 含 `C2 与 cards.md 实际计数不符`。两步都成立才算绿。
- **判据**：机器：好样本 `scs ledger numbers L` → exit 0 且不含 `C2 与 cards.md 实际计数不符`；错数样本同一命令 → exit 1 且 stdout 匹配 `C2 与 cards.md 实际计数不符`。
- **红绿证据**：红 = 若适配新形态时误删「卡级 + 张」分支，错数样本仍 exit 0（漏检）；绿 = 好样本 0、错数样本 FAIL，证明旧分支仍生效。
- **对应测试**：Task 3；`D:\Seed\skill-common-script\src\commands\ledger-numbers.test.ts`。
- **不覆盖**：不判旧形态的算术错（C1 既有分支，见 TC-019~TC-023）。

## 3 负例与边界

| 用例 ID | 边界/负例是什么 | 为什么容易漏 | 期望行为 |
|---|---|---|---|
| TC-003 | 命令组缺 `layer` | 只测「有 layer 的组」会漏掉漏标 | `GroupLayerMissing`，exit 1 |
| TC-004 | `layer` 取 `'prod'` | 只测合法值容易漏掉拼错 | `GroupLayerInvalid`，exit 1 |
| TC-005 | 同一组 `layer` 写成两个值（`['dev','run']`） | 只测「单组 layer 存在」会漏掉数组形态 | `GroupMixedLayer`，exit 1 |
| TC-007 | 同一 verb 跨两个组 | 组名不同看不出重复 | `VerbDuplicated`，exit 1 |
| TC-009 | 渲染器不再过滤非 run 组 | 只断言「真仓库 0 命中」无法证明断言有牙 | 副本卡面出现 `repo.check`，探针红 |
| TC-011 | 席位配 build 组 | 静默过滤会让错误配置长期潜伏 | `NonRunGroupGranted: reviewer-audit: docgen.read`，exit 1 |
| TC-013 | `__default__` 配 dev 组 | 只测具名席会漏掉落回席 | `NonRunGroupGranted: __default__: repo.check`，exit 1 |
| TC-014 | 配置非法时 gate / draft 的退出码与首行 | 「报错了但码不对 / 仍写草稿」最难发现 | 两入口均 exit 1，首行 `NonRunGroupGranted`，草稿 0 新增 |
| TC-016 | verb 被对象化 | 现有测试按字符串断言，形状变化会大面积红 | `typeof` 断言输出 `false` |
| TC-018 | 门禁测试缺负例 | 只有正例也能全绿，最容易混过验收 | 负例断言缺失 → 自证红 |
| TC-020 | C5 有行且求和 ≠ 卡片数 | 只测相等会漏掉「判红」能力 | `[FAIL] C5 终态对账不符：求和 4 ≠ 卡片数 3`，exit 1 |
| TC-021 | 缺 C5 行 | 判红会造成历史账本批量假红 | `[WARN] C5 未取数（无第 3 项行）`，exit 0 |
| TC-022 | `cards.md` 缺失 | 无实数可比时容易空指针 / 假红 | WARN + 跳过，exit 0 |
| TC-023 | C5 行字段不全 | 宽松正则会拿 3 个数当 5 个用 | WARN 未取数，exit 0 |
| TC-025 | C2 新形态数字错 | 只测正确数字无法证明命中 | `C2 与 cards.md 实际计数不符`，exit 1 |
| TC-026 | 同一行两种声明并存 | 两种写法都匹配 → 双计误报 | C2 FAIL 恰 1 条 |
| TC-027 | 总数对、P 级分布错 | 只比总数会放过分布错 | 点名 P0 / P2 差异 |
| TC-028 | 半角括号 | 模板用全角，实现易只写全角 | 仍判红 |
| TC-030 | 手改模板生成物 | 只比对源不比对产物会放过手改 | `ledger.mjs` exit 1 |
| TC-033 | 落点路径不存在 | 只测全过无判别力 | 首行 `missing N`，exit 1，点名引用 |
| TC-034 | 行号越界 | 只判 `existsSync` 会放过 | 计入 missing，exit 1 |
| TC-035 | URL 混在证据栏 | 正则会把 URL 当路径 | URL 跳过，refs 不计 |
| TC-036 | 缺 `--ledger` | 有默认值就会静默跑错目录 | exit 2，stderr 含 `--ledger` |
| TC-037 | 账本目录不存在 | 空账本可被当「全过」 | exit 2，点名目录 |
| TC-038 | 可选件 `delivery-audit.md` 缺失 | WARN 若走 stdout 会挤掉首行计数 | stderr 含 WARN，stdout 首行 `missing 0`、次行 `landings ok` |
| TC-039 | Windows 反斜杠路径 | 正则字符类易漏 `\\` | 识别为 1 条 ref（`files 2 / refs 1`），exit 0 |
| TC-041 | 不传参数换目录 | 默认值回落本仓会「恰好能跑」 | exit 2 |
| TC-045 | 迁移后 exit 语义变 | 0 与 1 反过来最难察觉 | 契约测试红，点名 `exit: 1 -> 0` |
| TC-046 | 迁移后 code 串变 | 大小写改动看起来无害 | 契约测试红，点名 code |
| TC-047 | 迁移后首末行变 | 中间行变了契约不管，首末行易漏 | 契约测试红，点名 `last-line` |
| TC-049 | 副本恢复旧 `score.mjs`（含 3 处 `../../../tools/...`） | 「旧脚本还能跑」是最常见拖延 | 命中 ≥3，红 |
| TC-051 | 副本其他技能里再放一份 `skill-dir.mjs` / 第二个实现 | 「删了又长回来」是最常见的单源回退 | `skill-dir.mjs` 份数 = 2 或越界实现 ≥1，红 |
| TC-053 | 换目录用默认值 | 默认值绑本仓时仍能跑 | exit 2 |
| TC-055 | 本仓某条 scs 调用删掉显式旗标 | 默认值能跑，静默错 | 调用面断言 `bad≥1`，exit 1 |
| TC-057 | 去掉显式传参 | 默认值已漂，静默错 | exit 2，`判据引擎目录不存在` |
| TC-059 | 有实现无同名 test | 纯分发例外会被滥用 | 缺测清单命中 `foo.ts`，exit 1 |
| TC-061 | 手改生成卡 | 卡是生成物，最易被手改 | `Mismatch: …reviewer-audit.md`，exit 1 |
| TC-063 | `--root` 相对路径 | 只测绝对路径会漏解析口径 | 两次 exit 0 且首行一致 |
| TC-064 | run 组 verbs 为空 | 「run 组只渲染」容易被误解为「run 组可不填」 | `GroupEmpty: tool.time`，exit 1 |
| TC-065 | 账本缺 `round-check.md` | 空账本容易被当「全过」 | exit 2，`不是账本目录（缺 round-check.md）` |
| TC-066 | `--ledger` 被错误地相对 `--root` 解析 | 两个参数各按 cwd 解析，最易拼错 | exit 0，首行 `missing 0`，末行 `landings ok` |
| TC-067 | 无基线就改调用方（半迁移） | 旧脚本删了、新命令没基线，事后无法比对 | 守卫 exit 1，点名 `migration-baseline.json` |
| TC-068 | 有基线但差异未登记 | 「差不多」被当「无差异」 | 比对 exit 1，标注 `unregistered` |

**计数**：负例 + 边界 **43** 条；正例 **26** 条；43 ≥ 26，满足「负例 + 边界 ≥ 正例」。

## 4 回归清单

| 如果改了 | 必须重跑 | 为什么 |
|---|---|---|
| `policy/definitions/commands.mjs` | TC-001、TC-002、TC-005、TC-007、TC-010、TC-015、TC-016 | 组名 / layer / verb 全部从这里取数 |
| `components/renderBoundary.mjs` | TC-008、TC-009、TC-011、TC-013、TC-014 | 卡面渲染与抛错边界 |
| `policy/seat-policy.mjs` | TC-011、TC-012、TC-013、TC-014 | 席位配置是抛错的输入 |
| `components/validatePolicy.mjs` | TC-003、TC-004、TC-005、TC-006、TC-007、TC-064 | 五个码的唯一发射点 |
| `components/dumpPolicy.mjs` | TC-010、TC-015 | dump 形状是审计与测试的取数面 |
| `components/outputFormats.mjs` 或 `ledger.mjs` | TC-029、TC-030 | 模板唯一源与投影 |
| `skills/parliament-ledger/assets/round-check.md` | TC-029、TC-030、TC-019~TC-023 | 账本模板是 C5 的输入形态 |
| `scs` 的 `ledger-numbers.ts` | TC-019~TC-031、TC-069 | C5 / C2 的判定实现 |
| `scs` 的 `check.ts`（命令注册） | TC-032~TC-042、TC-052、TC-053、TC-062、TC-063、TC-065、TC-066 | landings / skills / rules 的入口 |
| 本仓 `package.json` 的 scs 调用面 | TC-054、TC-055、TC-057 | 显式传参是唯一防线（默认值归 scs 仓） |
| `package.json` 的 scripts | TC-056、TC-057 | 显式传参的调用面 |
| `agents/*.md` 或卡渲染数据 | TC-008、TC-009、TC-060、TC-061 | 卡是生成物，改数据必须重生成 |
| 迁移映射表 / 旧脚本消费方 / `migration-baseline.json` | TC-043~TC-053、TC-067、TC-068 | 契约与调用点同批变化，基线是比对前提 |

## 5 只手动验证

| 项 | 为什么机器验不了 | 谁验、看什么 |
|---|---|---|
| `scs` 全局安装后的真实调用（`scs --version` / `scs help`） | 依赖全局安装环境；`dist` 直跑不等于安装链可用 | 用户或主 agent：`scs --version` 输出 `0.1.0`，`scs help` 列出新子命令 |
| 生成卡的人工可读性（卡面句子是否被 agent 误读为「可跑自检」） | 语义理解，无判据可机判 | 用户 / 议会 #2：读 `agents/reviewer-audit.md` 边界段，确认只列 `git.read` / `tool.time` 且语义无歧义 |
| C5 五类去向（已修 / 关闭 / 候选 / 升级 / 带往下轮）的归类是否正确 | 只判求和相等，无法判「这张卡算已修还是关闭」 | `reviewer-audit`：抽查 1–2 张卡与去向表，核对归类 |
| `landings` 引用行内容是否与卡片断言相符 | 只判路径存在与行号范围，不懂语义 | `reviewer-audit`：按 `round-check.md` 要求抽查 ≥3 条 |
| 迁移后 `stage-2b-testcase-sdet.md` 170 条历史用例是否真能按新命令跑 | 历史快照与新命令不同批，需人工映射 | 主 agent：按映射表抽跑 3–5 条，记录不可跑项 |

## 6 不测（带理由）

| 不测什么 | 为什么 |
|---|---|
| `scs` 命令的内部实现细节（算法、数据结构、性能） | 由 scs 仓自己的 vitest 覆盖；本仓只冻结可观察契约（spec §5 末行） |
| Git 读命令本身的正确性（`git status/diff/show/log/reflog` 行为） | 平台保证；本 spec 只规定「组内放哪几条」 |
| S5 校验器接 `outputFormats.docs` | 不在本 spec 范围（spec §6 首条，阻塞于 result.md §8.5） |
| #7 证据重放（执行证据栏命令） | 明确不实现（R9 / PRD D13）；TC-042 只验证「不执行」 |
| `verbs` 对象化 | 明确另立（R12）；TC-015 / TC-016 只验证「保持字符串形状」 |
| 卡面文案删改 / 八条判据改造 / 越界处置流程 | PRD「不适用」清单；本 spec 不碰 |
| 模板唯一源的重新设计 | 已收口（PRD §2 末注），本 spec 只加一句取数格式 |
| `scs` 源码默认值扫描（`tools/quality/...`） | 归 scs 仓、不在本轮（spec §5 末行与 §6 第 4 条）；本仓只测调用面（TC-054/055/056/057） |
| scs 不可用时降级为只跑 `git.read` | PRD §8-3 明确由 S3 定降级条款，本轮未冻结；无法写死判据 |
| `scs` 默认值应改成什么 | spec §6 明确「不要求改动 scs 默认值」；只测「不新增 + 本仓显式传参」 |
| `stage-2b-testcase-sdet.md` 原文改写 | 只允许加日期注 + 映射表（spec §3.7 / §8），不测其正文 |

## 7 缺口与判别力水位

| 缺口 | 漏检哪类反例 | 至少 1 个样例 | 语义由谁兜 |
|---|---|---|---|
| 1. 组级 `layer` 的语义归类无法机判：机器只判 `layer` 值合法、同组不出现两值，判不了「这个组标 dev 对不对」；verb 无 layer 字段，组内 verb 的生命周期归属没有机判形态 | 把构建期命令塞进标为 `dev` 的组，机器认为合法 | `repo.check` 里新增 `node tools/docgen/builders/agents/cli.mjs generate`（构建期）却仍标 `dev` | 议会 #2 审 spec §3.1；`reviewer-audit` 审卡面；落地后由用户抽检 |
| 2. 卡面「可读性」与「不误导」无法机判：0 个非 run 组名可判，但句子是否让 agent 理解成「可以跑自检」判不了 | 卡面写「`commandGroups` 的 `git.read` / `tool.time` 白名单组」但仍被误读为可跑 `npm run check` | 新 agent 首轮尝试跑 `npm run check` | 用户 / 议会评审卡面文本（§5 第 2 行） |
| 3. C5 的「归类真实性」无法机判：只判五数求和 = 卡片数，判不了「这张卡是否真已修」 | 把未修的卡计入「已修」使求和恰好相等 | `cards.md` 3 张、卡 1 实为「候选」却记 `已修=1 候选=1` | `reviewer-audit` 抽查 1–2 张（§5 第 3 行） |
| 4. `landings` 只判 `path:line` 存在性与行号范围，判不了「该行内容是否支持卡片断言」 | 行号指向文件里另一段无关内容，仍算「存在」 | `cli.mjs:3` 真实存在，但卡片断言说「该行定义 X」实际不是 | `reviewer-audit` 按 `round-check.md` 抽查 ≥3 条（§5 第 4 行） |
| 5. 同一输入同时触发两个条件时的报码优先级未冻结（如一组既缺 `layer` 又 `verbs: []`，先报哪个码）；机器只保证单条件正确 | 双条件夹具得到非预期码，用例无法断言 | `repo.check` 删 `layer` 且 `verbs: []`，期望 `GroupLayerMissing` 还是 `GroupEmpty` 无定论 | spec 作者 / 议会 #2 裁决后回填；裁决前用例只测单条件 |
| 6. 迁移基线需「迁移前」快照，而 scs 是独立仓、发布节奏不受本仓控制；若 scs 未发布就先切调用方，基线有值但新命令跑不了 | 基线齐全、旧脚本已删、新命令未发布 → 临时绿但不可复算 | `skills/rule-inspector/scripts/score.mjs` 已删、`scs check rules` 报未知子命令 | TC-067 守卫拦半迁移；主 agent 冻结基线；用户裁定发布节奏（PRD §8-9） |

## 8 自检

### 8.1 四项自检

| # | 自检项 | 结果 | 证据（可复算） |
|---|---|---|---|
| ① | 用例总数 | **69** 条（TC-001 ~ TC-069，连续编号，无改号、无删号） | 本文件 §2 标题计数 `### TC-` = 69 |
| ② | 正 / 负 / 边界计数 | 正 **26** / 负 **33** / 边界 **10**；负 + 边界 = **43** ≥ 正 26 | §3 计数行「负例 + 边界 43 条；正例 26 条」 |
| ③ | 五要素缺项数 | **0**（每条均有 覆盖 / 前置 / 步骤 / 预期 / 判据；另附 红绿证据 / 对应测试 / 不覆盖） | §2 每条 8 个字段齐 |
| ④ | 覆盖总表未覆盖 spec 条目数 | **0**（R1–R13、§3.1–§3.7、§4 硬约束 1–7、PRD V1–V11、F-01~F-04 全部有对应行） | §1 覆盖核对段 |

**findings 说明**：修订后原 5 条疑问中的 4 条已在 spec 解决（码表对应、`NonRunGroupGranted` 退出码、landings 参数语义、默认值口径）；剩余 **2 条**（§7 缺口 5 的报码优先级、缺口 6 的跨仓发布时序），**非空**，故不写「全过、无问题」；均只登记、未代改 spec。若后续 spec 修订使 findings 归零，此处应显式改记为「全过、无问题」。

**spec-testcase-gate 五条判据核对**：命名（与 spec 同目录、文件名 = spec 名去 `.md` + `-testcase.md`）通过；独立性（编写者 `senior-sdet` 子代理 ≠ spec 作者主 agent ≠ 施工者）通过；五要素与负例比例（五要素缺项 0；负 + 边界 43 ≥ 正 26）通过；外链（正文引用的 `path:line` 均指向仓内已存在文件，无仓外/失效链接）通过；一起送审（本文件须与 spec 同批提交，由主 agent 执行）。

### 8.2 本席清单核对

> 字段口径：`hit` = 已核对命中；`miss` = 应做未做（须 reason）；`na` = 不适用（须 reason）；`evidence` 必须 path:line 或命令输出首行；`verdict` = pass / fail。

| # | 条目 | 结果 | reason | evidence | verdict |
|---|---|---|---|---|---|
| 1 | SDET 席卡：输入空间核对 | hit | — | `docs/superpowers/specs/2026-11-09-script-layer-refactor-design.md:5`（`**范围**：PRD §10 的 F-01 ~ F-04（S1–S4）。S5 不在本 spec。`） | pass |
| 2 | SDET 席卡：状态与转移核对 | hit | — | `tools/docgen/builders/agents/policy/definitions/commands.mjs:3`（`export const commandGroups = {`，组态由 layer 三值决定）；`components/renderBoundary.mjs:72`（`function allowGroups(groups) {`，卡面转移点） | pass |
| 3 | SDET 席卡：失败面核对 | hit | — | `components/validatePolicy.mjs:88`（`export function validatePolicy() {`，六码唯一发射点；新增 GroupLayer* 与 NonRunGroupGranted 落此） | pass |
| 4 | SDET 席卡：判据来源核对 | hit | — | `docs/prd/20261109211349-script-layer-refactor/index.md:169`（`V1` 行起 11 条验收锚） | pass |
| 5 | SDET 席卡：确定性核对 | hit | — | `D:\Seed\skill-common-script\src\commands\ledger-numbers.ts:214`（`const out = [...result.warns.map(...`，输出行序固定）；§2 每条判据均给固定输入与固定退出码 | pass |
| 6 | SDET 席卡：回归资产核对 | hit | — | `tools/docgen/builders/agents/test/policy-pure-source.test.mjs:221`（`assert.deepEqual(Object.keys(G), ['check.local','git.read','docgen.read'], …`） | pass |
| 7 | SDET 席卡：判别力核对 | hit | — | `D:\Seed\skill-common-script\src\commands\ledger-numbers.ts:129`（`if (!/卡级/.test(decl) \|\| !/张/.test(decl)) continue;`，证明「新形态正例」单独不判别，故配 TC-025/026/028） | pass |
| 8 | SDET 席卡：盲点雷达核对 | hit | — | `skills/parliament-ledger/assets/round-check.md:14`（`第 3 项 本轮终态对账` 只有散文，无取数格式 → 语义面缺口来源） | pass |
| 9 | SDET 席卡：覆盖账核对 | hit | — | §1 覆盖核对段（验收锚 15 条全覆盖；F-01~F-04 各 ≥2 条） | pass |
