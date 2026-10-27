# Session 交接：agent 卡契约化 → 执行 S2 observation-check 计划（2026-10-27）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-27 15:15（本机时区 Asia/Shanghai） |
| 项目根 | d:\Seed\retro-skills |
| HEAD | `a809f27`（docs: 新增 S2 观察表校验器收编入库的设计 spec 和交接记录）；工作树 **10 项未提交**——9 项 `M` + 1 项 `??`，逐项见「现状 · 提交状态」，**由用户自行 commit** |
| 验证基线 | `npm run check` → `# tests 736` / `# pass 734` / `# fail 0` / `# skipped 2`、`baseline 37/37`、`0 findings`、`④ markdown 检查通过（291 个文件 / 1230 张表）`、`⑤ .session 结构检查通过（一级只含封闭清单档位；tmp/ 为空）`、末行 `check 全部通过`（exit 0，**2026-10-27 15:10 实跑**）；写入本交接词后 15:20 复跑 → `# pass 734` / `# fail 0`、`④ 292 个文件 / 1231 张表`、exit 0（与 15:10 差 1 文件 = 本文件）；`node scripts/scope-sweep.mjs --check` → `sweep ok（命中未超基线、清单齐、scope 齐）`（exit 0，15:05 实跑）；`gate-record.md` 两条自查 → `rows 11 bad 0`、`splitting 0`（15:08 实跑） |
| 继任自 | `docs/handoffs/2026-10-27-s2-spec-disposition.md` |
| 状态 | 有 1 个开放问题（执行方式，见「开放问题」= 开工第一问） |

## 项目定位

d:\Seed\retro-skills —— AI 开发工作流仓库（rules / skills / agents / 门禁脚本）；当前主线 = agent 卡契约化：把观察产物（agent 卡评审）从 markdown 自由文本升级为结构化 json 契约 + 校验器。PRD `docs/prd/20261026205821-agent-card-contract.md`；执行顺序 S2 → S3 → S1 → S4（PRD `:515`）。

## 现状

- 已完成：
  1. **② 段已签字**：`skills/dev-workflow/references/gate-record.md:20` 的 `②@S2` 行（申报人 主 agent + sdet，签字人 审计，结论 过）；议会 #2 账本 `.session/reviews/2026-10-27-1102-s2-observation-check-spec/`（2 轮 57 卡；`round-check.md` 判「过（打回 0）」、`delivery-audit.md` 判「通过」、`defense-record.md` 57 条答辩）。
  2. **S2 plan 写完并过两轮审计**：`docs/superpowers/plans/2026-10-27-s2-observation-check.md`（2322 行 / 12 Task，**untracked**）。第 1 轮 6 项打回（G02 静态计数正则、附录 A 分母混用、A04 缺目录内 cwd、占位计数、`.session\tmp` 隐式依赖、`artifact.test.mjs` 无 Step）、第 2 轮 2 项硬伤（计划门行判据错位 + 时序倒置、缺 PRD 功能点覆盖表），全部修完，留痕在 Self-Review §5/§6（`plan:2306-2322`）。
  3. **计划门已签字**：`gate-record.md:21` 的 `②→③@S2` 行——申报人 = 主 agent，签字人 = 审计（独立实例 `d7a56764`，`agents/reviewer-audit.md` 角色卡 path B 贴入，未参与写 plan），结论 **过**。三条核对走「审计手工核对表」（`scripts/check-plan.mjs` 归 S4、当前不存在）：功能点差集 0（PRD `:511`/`:539` = F-13～F-16 / F-20 / F-21 共 6 个，plan 覆盖 `:110-115`）、12 节点线性无环、testcase 69 个 ID 全有落点。
  4. **门禁全绿**（数字见元信息表『验证基线』）。
  5. **代码零落地**：`tools/observation-check/` 尚不存在于仓库；11 文件仍在仓外草稿区（本次实测 11 个文件在位）。
- 验证证据：见元信息表『验证基线』（单源，勿在此重复填写）。
- 提交状态：**10 项未提交，由用户自行 commit**（`git status --porcelain` 实查）：
  - `M docs/prd/20261026205821-agent-card-contract.md`（8 行，S2 码名登记相关）
  - `M docs/superpowers/specs/2026-10-27-s2-observation-check-design.md`（34 行）
  - `M docs/superpowers/specs/2026-10-27-s2-observation-check-design-testcase.md`（160 行）
  - `M skills/dev-workflow/references/gate-record.md`（+2 行 = `②→③@S2` 签字行）
  - `M docs/handoffs/2026-10-27-s2-spec-disposition.md`（2 行）
  - `?? docs/superpowers/plans/2026-10-27-s2-observation-check.md`（**签字件，必须进 git**）
  - `M agents/reviewer-audit.md` +1、`M skills/parliament/assets/round-check.md` +1、`M tools/docgen/components/outputFormats.mjs` +1 —— 三处同源：同一句「转录行口径」在生成器源与两处生成物各加一行（`git diff --stat` 证据）
  - `M tools/docgen/fixtures/reviewer-audit.evidence.json`（10 行变更，`judgedBy` / `changes` 末两条）
- 工作树异常：无字节级异常；`.session/tmp/` 为空（⑤ 段实判）。

## 过程记录

- `.session/reviews/2026-10-27-1102-s2-observation-check-spec/problems.md` §2（议会 #2 留观 10 条，每条带触发时机 = 写 S2 plan 时；plan 附录 B `:2264-2279` 已逐条落点）
- 同目录 `round-check.md` / `delivery-audit.md` / `defense-record.md`（先读尾部）
- **计划门两轮审计原文只在上一段对话里**（独立实例 `d7a56764`），未落盘；结论与判据已逐字进 `gate-record.md:21`「核了什么」「结论」两列
- 历史交接词链：`docs/handoffs/2026-10-24-session-close.md` → `docs/handoffs/2026-10-26-agent-card-contract-prd-review.md` → `docs/handoffs/2026-10-27-s2-spec-disposition.md` → 本份

## 本次任务

执行 S2 plan 的 Task 1–12（当前代码零落地）：`docs/superpowers/plans/2026-10-27-s2-observation-check.md`。

流程（plan 已切好 12 个 Task，每个带验收命令）：
1. Task 1（纯文档：PRD 码名登记 + A 表并入 + R8 回扫）
2. Task 2（迁入 11 文件，diff 只有 11 个 `A`，sha256 进 commit message，仓库根 `node --test tools/observation-check/*.test.mjs` 核 71/71）
3. Task 3–8（`registered-ids` / `evidence` / `checks` 结构段与渲染段 / `artifact` / `cli` / `gate-scan`）
4. Task 9（旧夹具改批 + A05 扩展 + B19 派工）→ Task 10（新增 73 条用例）→ Task 11（golden + D05–D07）
5. Task 12（收尾验收：A04 双 cwd、G02 静态计数、A06 夹具自建、A07 未归档态 check、G01 归档演练、门禁三连）→ **产 ③ 段出口证据**（不写门行）
6. ③→④：sdet 逐条结 testcase（签字人 = sdet，不得自签）

起点：**Task 1**。

## 范围依据

- 要读：
  - `docs/superpowers/plans/2026-10-27-s2-observation-check.md` `:15-28`（Global Constraints，10 条对所有 Task 生效）、`:98-141`（计划门三条核对 + 功能点覆盖表 + 签行）、`:143` 起 Task 1–12、`:2236` 附录 A（69 条 + B19 → Task 映射）、`:2280-2294` 附录 C（提交切分 8 刀）、`:2295-2322` Self-Review（含两轮审计修复留痕，§5 `:2308` / §6 `:2317`）
  - `docs/superpowers/specs/2026-10-27-s2-observation-check-design.md`（86 行）：§10.1 R1–R7、§10.2 两阶段提交、§10.5 S2/S3 边界、§10.8 七锚点（`spec:79` 是双 cwd 判据原文）
  - `docs/superpowers/specs/2026-10-27-s2-observation-check-design-testcase.md`（1297 行，69 条）：§0.2 16 项实现差距表、§3 用例总表、§7 13 条盲点水位；执行每个 Task 前读该 Task 对应的用例原文（附录 A 有 ID → Step 的映射）
  - `docs/prd/20261026205821-agent-card-contract.md` `:511` / `:539`（S2 范围 = F-13～F-16 / F-20 / F-21）、§4.3、§4.5、`:324`（证据必须落在仓内 = 快照法的机制依据）
- 勿重做：
  - 仓外草稿区 11 文件已写完且 71 测试绿：`C:\Users\HuangChunhua\.retro-skills\observation-check-draft\`（本次实测 11 个文件在位）——Task 2 是「原样迁入」，**不得顺手改代码**
  - spec / testcase 已定稿（② 段签字），**不得重开设计讨论**；发现缺口只能回流 spec 重审（R4）

## 开放问题

1. **（开工第一问）执行方式选哪个**：Subagent-Driven（每 Task 派独立子代理 + 审查检查点）还是 Inline（主 agent 顺序做）？
   推断：**走 Subagent-Driven**——依据 plan `:3` 的 REQUIRED SUB-SKILL 行明写 `superpowers:subagent-driven-development (recommended)`，且 12 个 Task 已切好边界、各有独立验收命令，适合逐任务派工；Inline 的代价是 2322 行 plan 全留在单一上下文里。请用户：确认 / 纠正。

## 既定约束（不要重新讨论、不要重新选型）

- 迁入提交必须原样：diff 只有 11 个 `A`、零 `M`/`D`/`R`，sha256 清单载体 = 该提交的 commit message（不新增第 12 个文件）—— plan `:19` GC1 / spec §10.2
- root 唯一来源 = `git rev-parse --show-toplevel`；取不到 → `RepoRootUnresolved` fail-closed；禁 `process.cwd()` 兜底 / 多根 / skip 开关 —— plan `:21` GC3
- 归档只读：`docs/superpowers/reviews/**` 不接受写入（命中即 `ArtifactPathOutside`）—— plan `:22` GC4
- 禁放宽断言：改造 diff 中「被删除且含 `assert`」的行数 = 0 —— plan `:25` GC7
- 夹具一律 `mkdtempSync(join(repoRoot(), '.session/reviews/test-obs-check-'))` 自建，测试对 `agents/` 引用 = 0 —— plan `:26` GC8
- 两套分母不得互算：**70 = 用例 ID 数**（69 + B19）、**144 = test 块数**（71 迁入 + 73 新增）—— plan `:2238` 口径声明
- 改任一判据级口径必须 `node scripts/scope-sweep.mjs --check` → exit 0；**禁用** `npm run doc:sweep -- --check`（PowerShell + npm 10.9 吞参假绿）—— plan `:24` GC6 / 用户规则 R8
- 不得自签出口：③→④ 申报人 = 开发、签字人 = sdet；⑤ 签字人 = 用户 —— PRD §3.3 / R2
- 计划门已签（`gate-record.md:21`），**不要重签、不要重开议会** —— 本门不设议会，stage-2b

## 遗留裁决与留观项

- 议会 #2 留观 10 条（含 B19 派工 = 四重载体：Task 3 常量 + Task 9 Step 6 派工 + Task 10 Step 2 用例 + 附录 A 登记）—— 来源 `problems.md §2`；收敛时机 = S2 各 Task 落地时
- P2 备案：F-21「仓外证据快照法」的仓内约束实由证据第 1+2 道共同判（`PRD:324`「解析后必须落在根内」），README「外部快照」标注属 S4 渲染层 —— 来源 `gate-record.md:21` 结论列；收敛时机 = S4 落地
- plan 内 7 处 `node -e` 取证命令（静态计数、门禁对账等）属**施工取证**，不属审计取证（审计白名单禁 `node -e`）—— 收敛时机：若 ③→④ 或 ⑤ 审计判其不满足「取数命令可复算」，改为落 `.mjs` 脚本
- 计划门两轮核对表原文未落盘（只在上一段对话）—— 收敛时机：若需复核原文，重开审计实例按 `gate-record.md:21` 复算三条

## 开工前先做

1. `git status --porcelain` 确认仍是 10 项未提交；再跑 `npm run check`，`# pass` 必须 = **734**（不等于就先查有无新改动，别带着漂移开工）
2. 确认草稿区在位：`(Get-ChildItem "C:\Users\HuangChunhua\.retro-skills\observation-check-draft" -File | Measure-Object).Count` → **11**
3. 读 `docs/superpowers/plans/2026-10-27-s2-observation-check.md` `:15-28`（Global Constraints）与 `:98-141`（计划门节）
4. 读 testcase `docs/superpowers/specs/2026-10-27-s2-observation-check-design-testcase.md` §0.2（16 项差距表）+ §3（69 条总表），对照附录 A 确认 Task 10 的 73 条新增用例来源
5. 先做 Task 1（纯文档，可独立提交），提交后再 Task 2 迁入——两步不要合并成一个提交（附录 C 的切分就是为可回滚）

## 开场话术

读 `docs/handoffs/2026-10-27-s2-observation-check-impl.md`，按交接词继续：执行 S2 plan 的 Task 1–12。
