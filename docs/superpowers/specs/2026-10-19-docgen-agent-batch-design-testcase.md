# 测试用例：Docgen P2 · S4：余下 12 席批量数据搬家

> 归属 spec：`docs/superpowers/specs/2026-10-19-docgen-agent-batch-design.md`（split from `docs/prd/docgen-agent-generation.md`，2026-10-19）
> 编写者：`senior-sdet`（实例标识 `sdet-2026-10-19-docgen-p2-s4`，全新上下文）｜**独立性声明**：编写者 ≠ spec 作者，≠ 施工者；本文件编写期间未读任何 docgen 实现代码，用例全部从 S4 spec 全文（R1–R7 / §3 数据形状 / §4 九步闭环 / §5 W3 / §6 硬约束 / §7 测试表）与 PRD §5 W3 + §6.1–6.4、S1 spec（§6 校验断言 / §7 退出码）、S2 spec（试点模式）的验收锚点推导，不从实现倒推；spec 作者只能核对覆盖与提疑问，不得自行改写本文件的判据。
> 状态：草稿（待评审；**定稿 = 每条用例五要素齐全，且覆盖总表与 spec 验收项一一对应**）｜最后更新：2026-10-19
> 命名与落点：按 `spec-testcase-gate` 规则判据 1（与 spec 同目录；文件名 = spec 文件名去掉 `.md` 后 + `-testcase.md`）。
> 来源标注：本文件 28 条用例**全部为「spec 推导」**；无「实现观察（补充）」类用例（本文件编写时 `tools/docgen/` 尚未实现，仅 S2 试点验证了模型）。「待 plan Task N」中的 N 由 S4 的 writing-plans 分配，本文件不预先占号。

**12 席常量**（本文件复用；= spec §3 三种槽位组合全集，数据逐字取自 `gen-agents.mjs` ROLES 与现 `agents/*.md`）：

`SEATS_12 = [reviewer-product, reviewer-interaction, reviewer-ui, reviewer-frontend, reviewer-backend, reviewer-ops, reviewer-qa, reviewer-ai, reviewer-security, reviewer-actuary, reviewer-reader, detective-observer]`

**判据命令约定**（命令形态以 S1 CLI 为准；本文件判据只写命令 + 退出码 + 关键输出）：

| 代号 | 命令 | 判读 |
|---|---|---|
| C1 | `node tools/docgen/cli.mjs generate --kind agent --name <seat>` | exit 0 = 渲染 vs 现产物一致（无漂移输出）；exit 1 = 漂移 |
| C2 | 黄金断言：读 agentData 派生 description（`在{domain}中担任{role}。{when}时调用`，domain = 议会评审 常量）与迁移前现 `agents/<seat>.md` frontmatter description **逐字比较**（S2 首次落位，S4 复用） | 逐字相等 exit 0；任一字节不等 exit 1 拦截 |
| C3 | `node skills/parliament/scripts/gen-agents.mjs --check` | exit 0 + 输出 `OK：<N> 个 agent 与源数据一致`；exit 1 + 漂移清单 |
| C4 | `git status --short rules/ skills/ agents/` | 空输出 = 干净 |
| C5 | `node tools/docgen/cli.mjs draft ls --name <seat>` | 空列表 = 该名下草稿已清 |
| C6 | 隔目录冷跑：复制仓库（排除 `.git`/`node_modules`）到临时目录，副本内跑 `node tools/docgen/cli.mjs gate` | exit 0 = 冷跑绿 |
| C7 | `npm run check` | 全绿（0 findings） |
| C8 | `node --input-type=module -e "import { validateAgentData } from './tools/docgen/components/validateAgentData.mjs'; ..."` | 直调校验，断言错误码 |

## 1 覆盖总表

| 用例 ID | 覆盖的 spec 条目 | 层级 | 正/负 | 判据类型 | 执行方式 | 优先级 |
|---|---|---|---|---|---|---|
| TC-001 | §5 W3「12 席逐字节一致」+ R5 + §7 测试行 1 | 集成 | 正 | 机器 | C1 × 12 席 | P0 |
| TC-002 | §5 W3「每席 description 派生」+ §7 测试行 2 + §6 硬约束 3 | 集成 | 正 | 机器 | C1 + 派生断言 × 12 席 | P0 |
| TC-003 | §5 W3「每席迁移前黄金断言」+ R3 + P2-遗-7 + §7 测试行 3 + §6 硬约束 4 | 集成 | 正 | 机器 | C2 × 12 席 | P0 |
| TC-004 | R4 + §3 组合 A（reviewer-frontend：SIX_METHODS + issue-card） | 集成 | 正 | 机器 | C8 + C1 | P0 |
| TC-005 | R4 + §3 组合 A（reviewer-backend：SIX_METHODS + issue-card） | 集成 | 正 | 机器 | C8 + C1 | P0 |
| TC-006 | R4 + §3 组合 A（detective-observer：DETECTIVE_RULES + observation 枚举） | 集成 | 正 | 机器 | C8 + C1 | P0 |
| TC-007 | R4 + §3 组合 B（9 席无 sharedBlock + issue-card） | 集成 | 正 | 机器 | C8 + C1 × 9 席 | P1 |
| TC-008 | R2 + §7 测试行 5 + §1 联动四问（跨文件） | 集成 | 正 | 机器 | C3 逐席 | P0 |
| TC-009 | §4 九步闭环（PRD 6.2）+ R1 | e2e | 正 | 机器+人工 | 全流程命令序列 | P0 |
| TC-010 | R6 + §5 W3「逐个巩固」+ PRD 6.3 | e2e | 正 | 机器 | C1+C6+C7+C4+C3+C5 | P0 |
| TC-011 | R7 + S1 触发表断言 c + §1 联动四问（六视角同构） | 集成 | 正 | 机器 | C8（when 两两断言） | P0 |
| TC-012 | §4 推进顺序建议 + R1 + PRD 6.1 | e2e | 正 | 机器+人工 | 账本状态序列 | P1 |
| TC-101 | R3 负例 + §7 测试行 2（拆槽错字） | 集成 | 负 | 机器 | C2 | P0 |
| TC-102 | §4 数据迁移负例 + S1 §6 断言 7（when 格式） | 集成 | 负 | 机器 | C8 → `WhenFormatViolation` | P0 |
| TC-103 | R3 边界 + P2-2 when 提取边界（尾「时」归属） | 集成 | 负/边界 | 机器 | C2 | P0 |
| TC-104 | R7 负例 + S1 触发表断言 c（when 误同） | 集成 | 负 | 机器 | C8（依赖 S1 落码，见 §7） | P1 |
| TC-105 | R4 负例 + S1 §6 断言 5（sharedBlock 引用错） | 集成 | 负 | 机器 | C8 → `SharedBlockMissing` | P0 |
| TC-106 | R2 负例 + §6 硬约束 5（双源残留） | 集成 | 负 | 机器 | grep ROLES + C3 | P1 |
| TC-107 | R1 负例 + §5 W3「逐个巩固」+ PRD 6.1（队列纪律） | e2e | 负 | 机器+人工 | 账本状态序列 | P0 |
| TC-108 | R6 负例 + 九步 step 7 + S1 §5.3（拒红过滤：无关漂移） | 集成 | 负 | 机器 | replace → 拒绝 | P0 |
| TC-109 | R6 边界 + S1 §5.3（拒红过滤：目标自身差异放行） | 集成 | 负/边界 | 机器 | replace → 放行 | P1 |
| TC-110 | R3 时序负例 + P2-遗-7（黄金断言基准时序） | 集成 | 负 | 机器 | 执行时序审计 | P0 |
| TC-111 | §1 联动四问 + S1 R10/R11（迁移中段 registered 态） | 集成 | 负/边界 | 机器 | gate / check-agents | P1 |
| TC-112 | §3 数据形状（tools 模板默认只读三元组） | 集成 | 负 | 机器 | C8 → `ToolsViolation` | P2 |
| TC-113 | §9 ROLES 空数组过渡态边界 | 集成 | 负/边界 | 机器 | C3 | P2 |
| TC-114 | R2 负例 + §7 测试行 5（移除操作波及剩余席） | 集成 | 负 | 机器 | C3 → exit 1 | P1 |
| TC-115 | §6 硬约束 2（D6：手改已巩固席） | 集成 | 负 | 机器 | gate / C7 → `Mismatch` | P1 |
| TC-116 | §6 硬约束 3 + S1 R13（agentData 硬编码 description） | 集成 | 负 | 机器 | C8/gate → `DescriptionDerivation` | P1 |

**覆盖核对**：spec 验收项共 **26 条**（R1–R7 ×7 + §5 W3 五行 ×5 + §4 九步闭环 ×1 + §4 推进顺序 ×1 + §6 硬约束 ×6 + §7 测试行 ×6）；本表覆盖 **26 条**；未覆盖 **0 条**。

## 2 用例明细

### TC-001 12 席全量渲染逐字节比对（除 description）→ 每席一致

- **覆盖**：§5 W3「12 席逐字节一致」+ R5 + §7 测试行 1
- **前置**：S1 能力地基已落位（CLI/草稿箱/validateAgentData/五档退出码）；S2 试点 reviewer-audit 已巩固；12 席数据已按 spec §3 迁入 `agentData.mjs`；`agents/<12 席>.md` 仍为迁移前现文件（gen-agents 最后产物，黄金快照）；gen-agents ROLES 仍含对应席。
- **步骤**：① 对 SEATS_12 中每席执行 C1；② 收集全部退出码与输出；③ 对任意非零退出码的席，记录漂移输出。
- **预期**：12 席全部 exit 0；输出不含任何 `<seat>.md` 漂移条目（模板槽位漏格 / 数据转录错位在此暴露）。
- **判据**：C1 × 12，全部 exit 0 且无漂移输出文本；任一楼 exit 1 = 红。
- **红绿证据**：红 = 某席模板槽位漏格或数据转录错位时，`generate --kind agent --name <seat>` exit 1，输出含漂移文件与差异；绿 = 数据/模板修正后同一命令 exit 0，无漂移输出。
- **对应测试**：待 plan Task N（建议 `tools/docgen/test/batch-12-seats.test.mjs`）
- **不覆盖**：description 字段的比对（由 TC-002/TC-003 单独覆盖）；模板结构本身的合法性（S1 覆盖）。

### TC-002 12 席 description 派生逐字相等（句式拼装）

- **覆盖**：§5 W3「每席 description 派生」+ §7 测试行 2 + §6 硬约束 3
- **前置**：同 TC-001。
- **步骤**：① 对 SEATS_12 每席取渲染 description；② 与预期派生串 `在议会评审中担任{role}。{when}时调用`（domain = 议会评审 常量，role = ROLES.zh，when = 触发表逐字提取值）逐字比较；③ 任一不等 → 记录该席与差异字节。
- **预期**：12 席渲染 description 逐字等于派生串。关键锚点（已与现文件 frontmatter 逐字核实）：`reviewer-product` = `在议会评审中担任产品评委。当主持人调度对 PRD/spec/plan 做产品视角评审时调用`；`detective-observer` = `在议会评审中担任侦探。每轮答辩结束后由主持人调度做行为核实时调用`；`reviewer-frontend` = `在议会评审中担任前端评委。当主持人调度对 spec/plan/技术方案做前端实现视角评审时调用`。
- **判据**：机器逐字比较，12 席全部 `===`；任一不等 = 红（exit 1）。
- **红绿证据**：红 = when/role 拆槽错字时派生断言 exit 1（description ≠ 句式拼装）；绿 = 修正后逐字相等。
- **对应测试**：待 plan Task N
- **不覆盖**：迁移前黄金断言（TC-003 覆盖）；词表/禁成语断言（S1 W4 覆盖，S4 数据为逐字转录不受词表约束）。

### TC-003 每席迁移前黄金断言：派生 description == 迁移前现文件 frontmatter（时序 = 替换前）

- **覆盖**：§5 W3「每席迁移前黄金断言」+ R3 + P2-遗-7 + §7 测试行 3 + §6 硬约束 4
- **前置**：对应席数据已迁入组件；`agents/<seat>.md` 为**迁移前现文件**（gen-agents 最后产物）；该席尚未执行替换（step 7 之前）。
- **步骤**：① 读 `agents/<seat>.md` frontmatter description；② 读 agentData 派生 description；③ 逐字比较；④ 对 SEATS_12 每席执行。
- **预期**：12 席全部逐字相等（13 席句式本就复现原句，转录正确必然相等；错则拦截）。
- **判据**：C2 × 12，全部 exit 0；任一不等 exit 1 拦截替换。
- **红绿证据**：红 = 派生与现文件任一字节不等 → C2 exit 1，替换被拦；绿 = 逐字相等 → exit 0，可进入落草稿。
- **对应测试**：待 plan Task N（黄金断言实现随 S2 plan Task 落位，S4 复用）
- **不覆盖**：断言执行时序本身（TC-110 覆盖）；替换后的文件内容（TC-010 覆盖）。

### TC-004 组合 A-1：reviewer-frontend（SIX_METHODS + issue-card）validate + 渲染比对

- **覆盖**：R4 + §3 组合 A（sharedBlock 枚举 SIX_METHODS ×2 中的一席）
- **前置**：frontend 数据已按 §3 组合 A 迁入（`sharedBlock: 'SIX_METHODS'`、`outputKind: 'issue-card'`、`when` = `当主持人调度对 spec/plan/技术方案做前端实现视角评审`——不含结尾「时」，见 TC-103 边界与 §8 建议 3）。
- **步骤**：① C8 调 `validateAgentData`；② C1 `generate --kind agent --name reviewer-frontend`；③ 检查 SIX_METHODS 共享块在渲染产物中存在且逐字等于 `gen-agents.mjs` 的 SIX_METHODS 常量。
- **预期**：validate 通过（exit 0）；渲染比对 exit 0；产物含「六手法全过」节。
- **判据**：C8 exit 0 + C1 exit 0 + grep 产物含 `### 六手法全过（技术维度通用，每项必须有结论）`。
- **红绿证据**：红 = sharedBlock 引用错或槽位漏格 → C8 `SharedBlockMissing` / C1 exit 1；绿 = 修正后两命令 exit 0。
- **对应测试**：待 plan Task N
- **不覆盖**：backend 席（TC-005）；observation 枚举（TC-006）。

### TC-005 组合 A-2：reviewer-backend（SIX_METHODS + issue-card）validate + 渲染比对

- **覆盖**：R4 + §3 组合 A（SIX_METHODS 第二席）
- **前置**：同 TC-004（backend 数据）。
- **步骤**：同 TC-004 结构，席名换 `reviewer-backend`。
- **预期**：validate 通过；渲染比对 exit 0；产物含 SIX_METHODS 共享块；两席 SIX_METHODS 共享块逐字一致（同一枚举常量）。
- **判据**：C8 exit 0 + C1 exit 0 + frontend/backend 两产物共享块节逐字相等（diff 无差异）。
- **红绿证据**：红 = 一席共享块渲染与另一席不一致（枚举常量两处定义）→ 比对红；绿 = 同一枚举渲染逐字一致。
- **对应测试**：待 plan Task N
- **不覆盖**：detective-observer（TC-006）。

### TC-006 组合 A-3：detective-observer（DETECTIVE_RULES + observation 枚举）validate + 渲染比对

- **覆盖**：R4 + §3 组合 A（DETECTIVE_RULES）+ outputKind = observation 枚举首次覆盖
- **前置**：detective-observer 数据已按 §3 迁入（`sharedBlock: 'DETECTIVE_RULES'`、`outputKind: 'observation'`、`when` = `每轮答辩结束后由主持人调度做行为核实`——不含结尾「时」，见 TC-103/§8 建议 3）。
- **步骤**：① C8 validate；② C1 渲染比对；③ 检查产物输出格式节 = 「观察记录（侦探用）」模板节（`assets/issue-card.md` 的 observation 节），而非「问题卡」节；④ 检查 DETECTIVE_RULES 共享块存在。
- **预期**：validate 通过；渲染比对 exit 0；observation 输出格式正确渲染。
- **判据**：C8 exit 0 + C1 exit 0 + 产物含「观察记录（侦探用）」节与「侦探处置表」节。
- **红绿证据**：红 = observation 枚举渲染成 issue-card 节（outputKind 映射错）→ 逐字节比对 exit 1；绿 = 修正后 exit 0。
- **对应测试**：待 plan Task N
- **不覆盖**：observation 输出的语义观感（§5 人工覆盖）。

### TC-007 组合 B：9 席无 sharedBlock + issue-card validate + 渲染比对

- **覆盖**：R4 + §3 组合 B（无 sharedBlock + issue-card；实际 9 席 = product/interaction/ui/ops/qa/ai/security/actuary/reader，见 §8 建议 2）
- **前置**：9 席数据已迁入（`sharedBlock: undefined`、`outputKind: 'issue-card'`）。
- **步骤**：① 对 9 席逐席 C8 validate；② 逐席 C1 渲染比对；③ 检查渲染产物**不含**任何共享块节（sharedBlock 缺省 = 不渲染）。
- **预期**：9 席 validate 全部通过；渲染比对全部 exit 0；产物无共享块节残留。
- **判据**：C8 × 9 exit 0 + C1 × 9 exit 0 + 产物 grep 无「六手法全过」「侦探处置表」「审计铁律」节。
- **红绿证据**：红 = 某席误带 sharedBlock 或槽位漏格 → validate/C1 红；绿 = 修正后全绿。
- **对应测试**：待 plan Task N
- **不覆盖**：组合 A 三席（TC-004/005/006）；audit 枚举（S2 已迁，本 spec 无）。

### TC-008 ROLES 逐席移除后 gen-agents 对剩余席输出不变

- **覆盖**：R2 + §7 测试行 5 + §1 联动四问（`gen-agents.mjs` ROLES 被全部席共用）
- **前置**：队列已推进到第 k 席（1 ≤ k ≤ 12）；前 k-1 席已从 ROLES 移除；剩余席仍在 ROLES。
- **步骤**：① 对每个 k，记录剩余席数 N = 13 - k（S2 已移除试点席，实际 N = 12 - k）；② 执行 C3；③ 对剩余席逐一比较其渲染与 `agents/*.md` 是否一致（C3 内部即为逐字节比较）。
- **预期**：每步 C3 exit 0，输出 `OK：<N> 个 agent 与源数据一致`；N 随队列递减（12→11→…→0）；剩余席输出**逐字节不变**。
- **判据**：C3 每步 exit 0 + 输出计数 = 剩余席数 + `git diff --stat agents/` 空（无意外改动）。
- **红绿证据**：红 = 移除操作误伤剩余席 → C3 exit 1 输出漂移清单（见 TC-114）；绿 = 只删目标席 → exit 0 计数递减。
- **对应测试**：待 plan Task N
- **不覆盖**：计数变化 13→12 的过渡容忍（S2 已覆盖）；ROLES 空数组过渡态（TC-113）。

### TC-009 单席九步闭环全流程（以 reviewer-product 为代表，12 席同构执行）

- **覆盖**：§4 九步闭环（入选 → 数据迁移 → 生成 → 逐字节比对 → 接守卫 → 落草稿 → 替换 → 验收 → 巩固）+ R1
- **前置**：S1 能力就位；S2 试点已巩固（证明模型）；`reviewer-product` 为推进顺序建议第 1 席。
- **步骤**：① 入选：`git hash-object agents/reviewer-product.md` + SHA256 双哈希记录；② 数据迁移：ROLES 字段搬入 + description 拆槽 + ROLES 同步移除；③ 生成 C1；④ 逐字节比对（除 description，C1 语义）；⑤ 接守卫：该席入 baseline 比对子集，`npm run check` gate 开始重建比对；⑥ 落草稿 `node tools/docgen/cli.mjs draft --kind agent --name reviewer-product`；⑦ 替换 `node tools/docgen/cli.mjs replace --kind agent --name reviewer-product --draft <草稿> --yes`（先 gate，红 → 拒）；⑧ 验收：W3 断言 + C7 全绿 + C4 干净；⑨ 巩固：C6 冷跑绿。
- **预期**：九步依序完成；任一步失败按 PRD 6.4 回退（只改组件/模板，现产物不动；修 2 次仍红 → 停损）。
- **判据**：全流程命令序列 + C4 干净 + C7 全绿；步骤 4/7/8/9 任一楼 = 闭环未完成。
- **红绿证据**：红 = 跳步（未生成即替换 / 未比对即落草稿）→ replace 缺草稿或 gate 红拦截；绿 = 九步依序走完 → 替换后 gate 绿。
- **对应测试**：待 plan Task N
- **不覆盖**：顺序纪律本身（TC-012/TC-107）；巩固判据全集（TC-010）。

### TC-010 单席巩固判据全集（gate 连续 2 次绿含冷跑 + check 全绿 + git 干净 + 停输出 + 草稿清）

- **覆盖**：R6 + §5 W3「逐个巩固」+ PRD 6.3
- **前置**：对应席已替换（step 7 完成）。
- **步骤**：① `node tools/docgen/cli.mjs gate` 连续 2 次 exit 0；② C6 隔目录冷跑一次 gate exit 0；③ C7 全绿；④ C4 空；⑤ 确认 gen-agents 该席已停输出（ROLES 已移除，C3 输出不含该席）；⑥ C5 该名下草稿为空。
- **预期**：六项判据全部满足才算「已巩固」；缺任一 = 未巩固，队列不得推进（PRD 6.3）。
- **判据**：C1/C6/C7/C4/C3/C5 六合一。
- **红绿证据**：红 = 任一判据不满足（gate 红/冷跑红/check 有 findings/git 脏/草稿残留）→ 该席未巩固，下一席不得开工；绿 = 六项全满足 → 标「已巩固」。
- **对应测试**：待 plan Task N
- **不覆盖**：队列纪律（TC-107）；拒红过滤（TC-108/109）。

### TC-011 六视角席 when 两两不同 → validateAgentData 不误报冲突（断言 c 正例）

- **覆盖**：R7 + S1 触发表断言 c + §1 联动四问（六视角席 when 同构靠视角名天然两两不同）
- **前置**：六视角席 = product / interaction / ui / frontend / backend / qa，when 已按触发表提取。
- **步骤**：① 收集六席 when 值；② 断言两两不同（Set size = 6）；③ C8 调 validateAgentData。
- **预期**：六席 when 两两不同；validateAgentData **不得**报任何触发冲突类错误（同构 ≠ 冲突；「可同时命中 = 议会多点将」由点将矩阵裁决，本 spec 不断言）。
- **判据**：机器：`new Set([...六席 when]).size === 6` + C8 exit 0；若实现按「结构同构」误判冲突 → exit 1 = 假阳性（红）。
- **红绿证据**：红 = 实现把「when 结构同构」当冲突 → C8 误报 exit 1；绿 = 按「when 文本相同才冲突」判 → exit 0。
- **对应测试**：待 plan Task N（依赖 S1 为断言 c 落位，见 §7 缺口 2）
- **不覆盖**：when 误同的负例（TC-104）；调度语义（点将矩阵）。

### TC-012 推进顺序建议逐席执行（product → frontend/backend → detective-observer → 其余 8，账本状态序列）

- **覆盖**：§4 推进顺序建议 + R1 + PRD 6.1 序 3
- **前置**：PRD 6.6 迁移状态账本已落位（见 §7 缺口 4；未落位前为人工核对）。
- **步骤**：① 按建议顺序逐席推进；② 每席巩固后更新账本状态；③ 终态核对账本。
- **预期**：12 席状态序列为 reviewer-product → reviewer-frontend/reviewer-backend（A 组合）→ detective-observer（observation 枚举）→ interaction/ui/ops/qa/ai/security/actuary/reader；「已巩固」状态在推进顺序上严格单调。
- **判据**：机器 = 解析账本断言状态单调且顺序匹配建议；账本未落位前 = 人工（议会评审核对账本状态列 + git 提交顺序）。
- **红绿证据**：红 = 顺序错乱（先搬 detective 再搬 frontend）→ 账本序列与建议不符，验收拦；绿 = 按建议顺序 → 账本单调。
- **对应测试**：待 plan Task N
- **不覆盖**：每席闭环内部（TC-009）。

### TC-101 某席 description 拆槽错字 → 黄金断言拦截（替换前红）

- **覆盖**：R3 负例 + §7 测试行 2（拆槽错字是最隐蔽的假绿，F2-F 教训）
- **前置**：某席数据迁入组件，但 role 或 when 拆槽引入错字（模拟施工转录错误）；替换尚未执行。
- **步骤**：① 在组件数据中把 `reviewer-product` 的 role 改为 `产品评委会`（或 when 改一字）；② 执行 C2。
- **预期**：派生 description ≠ 现文件 frontmatter description（逐字不等）→ C2 exit 1 拦截；替换不执行。
- **判据**：C2 exit 1 + 输出指明差异字段（description 派生 vs 现文件）。
- **红绿证据**：红 = 错字存在 → C2 exit 1（拦截）；绿 = 改正 role 为 `产品评委` → C2 exit 0。
- **对应测试**：待 plan Task N
- **不覆盖**：when 尾「时」边界（TC-103）；基准时序（TC-110）。

### TC-102 when 提取错位（含「在…中担任 / 时调用」字样）→ WhenFormatViolation（exit 1）

- **覆盖**：§4 数据迁移负例 + S1 §6 断言 7
- **前置**：某席 when 数据被错误提取为整句 description（含「在…中担任」或「时调用」字样）。
- **步骤**：① 把 `reviewer-interaction` 的 when 误设为 `在议会评审中担任交互评委。当主持人调度对 PRD/spec/plan 做交互视角评审时调用`（整句）；② C8 validate。
- **预期**：validateAgentData 报 `WhenFormatViolation`，exit 1。
- **判据**：C8 exit 1 + 错误码 `WhenFormatViolation`（S1 §7 退出码 1 档）。
- **红绿证据**：红 = when 含禁止字样 → C8 exit 1 `WhenFormatViolation`；绿 = when 改回触发子句（不含禁止字样）→ exit 0。
- **对应测试**：待 plan Task N
- **不覆盖**：description 派生断言（TC-002/116）。

### TC-103 when 提取边界：结尾「时」归属歧义 → 拼装「时时调用」必被黄金断言拦截

- **覆盖**：R3 边界 + P2-2 when 提取边界（含不含结尾「时」）
- **前置**：该席数据迁入；按 spec §3 示例直译（when 含结尾「时」）——这是 §8 建议 3 指出的 spec 示例与 P2-2 公式矛盾点。
- **步骤**：① 按 S4 §3 示例把 `reviewer-frontend` 的 when 设为 `当主持人调度对 spec/plan/技术方案做前端实现视角评审时`（含尾「时」）；② 拼装 `在{domain}中担任{role}。{when}时调用`；③ 与现文件 frontmatter 比较。
- **预期**：拼装结果 = `…评审时时调用` ≠ 现文件 `…评审时调用` → C2 exit 1 拦截（假阳性式误拦：合法迁移被拦，暴露的是 spec 示例与公式矛盾，不是数据错）。
- **判据**：C2 exit 1 + 差异恰为多余的一个「时」；正确 when = 不含结尾「时」的触发子句（P2-2 触发表示例同口径）。
- **红绿证据**：红 = when 含尾「时」→ C2 exit 1（`…时时调用`）；绿 = when 去掉尾「时」→ C2 exit 0。
- **对应测试**：待 plan Task N
- **不覆盖**：整句 when（TC-102）；拆槽错字（TC-101）。

### TC-104 六视角席 when 误同（提取错位致两席 when 相同）→ 触发冲突断言报错（exit 1）

- **覆盖**：R7 负例 + S1 触发表断言 c
- **前置**：`reviewer-interaction` 的 when 被误抄为 `reviewer-product` 的 when（两席 when 完全相同）。
- **步骤**：① 构造两席 when 相同的数据；② C8 validate；③ 断言 when 两两唯一。
- **预期**：断言 c 报错（exit 1，触发冲突族错误码；**该码需 S1 为断言 c 落位**——S1 §6 表 1–11 无「when 两两唯一」行，见 §7 缺口 2，未落位前此用例阻塞）。
- **判据**：C8 exit 1 + 错误码为触发冲突族（`TriggerConflict` 或 S1 为断言 c 新增的码）；修正 when 后 C8 exit 0。
- **红绿证据**：红 = 两席 when 相同且 validate 不报 → 断言 c 失效（假阴性）；绿 = validate 报错拦截。
- **对应测试**：待 plan Task N（依赖 S1 落码）
- **不覆盖**：同构不误判的正例（TC-011）。

### TC-105 sharedBlock 引用错（枚举名拼写错 / 不在登记册）→ SharedBlockMissing（exit 1）

- **覆盖**：R4 负例 + S1 §6 断言 5
- **前置**：某席 sharedBlock 引用错误。
- **步骤**：① 把 `reviewer-frontend` 的 sharedBlock 改为 `SIX_METHOD`（少 S）/ 把 `detective-observer` 的改为 `DETECTIVE`（不在登记册）；② C8 validate。
- **预期**：validateAgentData 报 `SharedBlockMissing`，exit 1（引用不存在于 patternRegistry 枚举）。
- **判据**：C8 exit 1 + 错误码 `SharedBlockMissing`（S1 §7 退出码 1 档）。
- **红绿证据**：红 = 枚举名错 → C8 exit 1 `SharedBlockMissing`；绿 = 改回 `SIX_METHODS` / `DETECTIVE_RULES` → exit 0。
- **对应测试**：待 plan Task N
- **不覆盖**：outputKind 非法枚举（S1 未定义错误码，见 §7 缺口 3）。

### TC-106 ROLES 双源残留（该席数据搬走后仍留 ROLES）→ 拦截

- **覆盖**：R2 负例 + §6 硬约束 5（数据搬走即删，不留双源，F-05 教训）
- **前置**：某席数据已迁入组件；ROLES 中该席条目未删。
- **步骤**：① grep `gen-agents.mjs` 是否仍含该席 `name`；② 执行 C3。
- **预期**：双源违规被拦——该席 name 仍命中 ROLES 即红；C3 仍生成该席（输出计数不递减）即红。
- **判据**：机器：`grep "name: '<seat>'" gen-agents.mjs` 无命中 + C3 输出计数 = 剩余席数（不含该席）。
- **红绿证据**：红 = ROLES 未删 → grep 命中 / C3 计数不递减；绿 = ROLES 移除 → grep 无命中。
- **对应测试**：待 plan Task N
- **不覆盖**：移除操作波及剩余席（TC-114）。

### TC-107 队列纪律：前席未巩固即替换后席 → 验收拦截（账本状态序列违例）

- **覆盖**：R1 负例 + §5 W3「逐个巩固」+ PRD 6.1（逐席巩固后才下一席，P2-7）
- **前置**：PRD 6.6 迁移状态账本已落位（未落位前为人工核对，见 §7 缺口 4）。
- **步骤**：① 模拟队列违规：席 k-1（如 reviewer-product）未达到巩固定义，席 k（如 reviewer-frontend）即执行替换并标「已巩固」；② 核对账本状态序列。
- **预期**：验收拦截——账本中席 k 为「已巩固」而席 k-1 非「已巩固」= 违例，W3「逐个巩固后才下一个」不满足，不得收口。
- **判据**：机器 = 解析账本断言「第 k 席『已巩固』 ⇒ 第 1..k-1 席全部『已巩固』」；账本未落位前 = 人工（议会评审核对状态列）。
- **红绿证据**：红 = 跳席 → 账本序列违例被拦；绿 = 逐席巩固 → 账本单调，验收通过。
- **对应测试**：待 plan Task N（依赖账本落位）
- **不覆盖**：顺序建议本身（TC-012）。

### TC-108 替换前 gate 红（与目标无关漂移）→ 拒绝替换，草稿保留

- **覆盖**：R6 负例 + 九步 step 7 + S1 §5.3 拒红过滤（P2-遗-8）
- **前置**：目标席草稿已生成；仓库存在与目标无关的漂移（如另一未迁席 `agents/*.md` 被改、或清单外新文件）。
- **步骤**：① 制造无关漂移（改一字符到另一席 agents 文件或新增清单外文件）；② 执行 replace。
- **预期**：replace 拒绝，报对应错误（`Mismatch` / baseline 类 / `UnregisteredHandwritten`），exit 非 0；草稿保留（C5 该席草稿仍存在）。
- **判据**：replace exit 非 0 + 错误文本 + C5 显示草稿未清。
- **红绿证据**：红 = 无关漂移存在 → replace 拒（草稿保留）；绿 = 消除无关漂移 → replace 成功。
- **对应测试**：待 plan Task N
- **不覆盖**：目标自身差异放行（TC-109）。

### TC-109 替换前 gate 红但仅目标对象自身预期差异（草稿 == 组件渲染）→ 放行替换（拒红过滤边界）

- **覆盖**：R6 边界 + S1 §5.3 拒红过滤（目标对象自身差异 = 绑定判据，放行；§4/6.5）
- **前置**：目标席草稿 == 组件内存渲染（绑定判据成立）；gate 红仅来自目标对象自身（组件改动后的预期差异，无无关漂移）。
- **步骤**：① 改组件数据（合法稳态修改，PRD 6.5）；② draft 落新草稿；③ 执行 replace --yes。
- **预期**：replace 放行（exit 0），替换后 gate 收敛绿；若实现把目标自身差异也当拒红 → 合法替换被拒 = 假阳性（红）。
- **判据**：replace exit 0 + 替换后 C1/gate exit 0。
- **红绿证据**：红 = 实现把目标自身差异当拒红 → 合法替换被拒（假阳性）；绿 = 绑定判据放行 → 替换成功 gate 绿。
- **对应测试**：待 plan Task N
- **不覆盖**：无关漂移拒绝（TC-108）。

### TC-110 黄金断言时序负例：替换后执行（基准 = 迁移后文件）→ 恒绿假绿，判定违规

- **覆盖**：R3 时序负例 + P2-遗-7（快照 = 迁移前现文件，不得用迁移后文件当基准）
- **前置**：迁移流程中黄金断言被安排在替换（step 7）之后执行。
- **步骤**：① 先替换，后执行 C2；② 观察结果。
- **预期**：替换后现文件 = 组件渲染（派生 description 必与文件一致）→ 断言**恒绿** = 假绿，丧失判别力；流程违规（拿错基准，P2-遗-7）。
- **判据**：机器 = 执行日志/脚本中 C2 必须位于 replace 命令**之前**（时序审计：`grep -n "golden\|黄金" <执行脚本>` 的行序）；替换后执行 = 红。
- **红绿证据**：红 = C2 在 replace 后 → 恒绿假绿（判别力为零）；绿 = C2 在 replace 前（基准 = 迁移前现文件）→ 对错字有判别力（TC-101 能拦）。
- **对应测试**：待 plan Task N
- **不覆盖**：黄金断言比较逻辑本身（TC-003/101/103）。

### TC-111 迁移中段未迁席 registered 态：gate 只做存在性检查，不报 UnregisteredHandwritten

- **覆盖**：§1 联动四问（未迁席由 gen-agents --check 守至 W8）+ S1 R10/R11（registered 态登记/存在检查）
- **前置**：队列推进到第 k 席；第 k+1..12 席未迁（仍 registered，baseline 常量内）。
- **步骤**：① 执行 `node tools/docgen/cli.mjs gate`；② 执行 `node tools/docgen/cli.mjs check-agents`。
- **预期**：未迁席 = registered 态：gate 只做存在性/登记检查（文件须存在、不可新增清单外文件），不报 `UnregisteredHandwritten`；check-agents 对 registered 态跳过逐字节、标注未巩固、容忍红。
- **判据**：gate exit 0（或仅已巩固席重建比对红，未迁席不产生清单外错误）；check-agents 输出对未迁席标注「未巩固」且不报漂移。
- **红绿证据**：红 = gate 把未迁席当清单外新文件报 `UnregisteredHandwritten`（假阳性）→ 迁移中段不可推进；绿 = registered 存在性检查 → 不报清单外错误。
- **对应测试**：待 plan Task N
- **不覆盖**：registered 计数与收口口径（S1 §8.6 覆盖）。

### TC-112 某席 tools 非只读三元组（含 Write/Edit）→ ToolsViolation（exit 1）

- **覆盖**：§3 数据形状（tools = 模板默认只读三元组 Read, Glob, Grep）
- **前置**：某席 tools 字段被误加写权限。
- **步骤**：① 把 `reviewer-qa` 的 tools 改为 `['Read', 'Glob', 'Grep', 'Write']`；② C8 validate。
- **预期**：validateAgentData 报 `ToolsViolation`，exit 1（13 席只读三元组约束）。
- **判据**：C8 exit 1 + 错误码 `ToolsViolation`（S1 §7 退出码 1 档）。
- **红绿证据**：红 = tools 含写权限 → C8 exit 1；绿 = 恢复只读三元组 → exit 0。
- **对应测试**：待 plan Task N
- **不覆盖**：senior-sdet 的 tools 追加 Write/Edit（S3 覆盖，本 spec 无）。

### TC-113 ROLES 递减至空数组的过渡态边界（12 席全部移除后 --check 行为）

- **覆盖**：§9（12 席迁移结束后 gen-agents ROLES 将只剩空数组或已删）
- **前置**：12 席全部移除完毕；W8（S1 序 5）尚未执行（gen-agents.mjs 仍存在）。
- **步骤**：① 确认 ROLES = `[]`；② 执行 C3；③ 记录退出码与输出。
- **预期**：过渡态行为**可判定**——exit 0 且输出 `OK：0 个 agent 与源数据一致`，或按 S1 W8 删除脚本；不允许「行为未定义/静默崩溃」（该边界行为需 W8 与 S4 衔接明确，见 §7 缺口 5）。
- **判据**：C3 exit 0 + 输出含 `0 个 agent`（或脚本已被 W8 删除，C3 报文件不存在——二选一明确即可）。
- **红绿证据**：红 = ROLES 空数组时 C3 行为未定义（报错/崩溃）；绿 = 明确行为（0 个 agent 或已删）。
- **对应测试**：待 plan Task N
- **不覆盖**：W8 退役验收本身（S1 序 5）。

### TC-114 ROLES 移除操作波及剩余席（误改剩余席数据）→ gen-agents --check 漂移（exit 1）

- **覆盖**：R2 负例 + §7 测试行 5（移除一席不能波及其它在役席）
- **前置**：移除某席时连带改坏一剩余席数据（模拟：把 `reviewer-backend` 的 identity 改一字后从 ROLES 移除 `reviewer-frontend`）。
- **步骤**：① 执行 C3；② 检查输出。
- **预期**：C3 exit 1，漂移清单含 `reviewer-backend.md 与源数据漂移`（剩余席输出被改 = 波及）。
- **判据**：C3 exit 1 + 漂移清单含被波及席文件名 + `git diff --stat agents/` 非空。
- **红绿证据**：红 = 波及剩余席 → C3 exit 1 漂移清单；绿 = 只删目标席 → exit 0 计数递减。
- **对应测试**：待 plan Task N
- **不覆盖**：双源残留（TC-106）。

### TC-115 手改已巩固席 agents/<seat>.md → gate 报 Mismatch（D6 守卫生效）

- **覆盖**：§6 硬约束 2（生成物禁手改，D6；任何差异回炉改组件）
- **前置**：对应席已巩固（已进比对子集）。
- **步骤**：① 在已巩固席 `agents/<seat>.md` 改一字符；② 执行 `node tools/docgen/cli.mjs gate` / C7。
- **预期**：gate/`npm run check` 报 `Mismatch`（exit 1），漂移消息含该席文件名；手改被守卫生效拦截。
- **判据**：gate exit 1 + 错误码 `Mismatch` + 消息含 `<seat>.md`；恢复原字节后 exit 0。
- **红绿证据**：红 = 手改已巩固席 → gate exit 1 `Mismatch`；绿 = 恢复组件渲染字节 → 全绿。
- **对应测试**：待 plan Task N
- **不覆盖**：未巩固席手改语义（registered 态容忍红，S1 R11 覆盖）。

### TC-116 agentData 硬编码 description（绕过派生）→ DescriptionDerivation（exit 1）

- **覆盖**：§6 硬约束 3 + S1 R13（agentData 不存独立 description；W4 机械断言防组件硬编码）
- **前置**：某席 agentData 出现独立 description 字段（施工者把 description 当普通字段存）。
- **步骤**：① 在 `reviewer-ai` 的 agentData 里加 `description: '在议会评审中担任 AI 评委。…时调用'` 字段；② C8 validate / gate。
- **预期**：W4 派生断言报 `DescriptionDerivation`（exit 1）——渲染 description != 句式拼装输出（绕过派生被拦）。
- **判据**：C8/gate exit 1 + 错误码 `DescriptionDerivation`（S1 §7 退出码 1 档）。
- **红绿证据**：红 = 硬编码 description → 派生断言 exit 1；绿 = 删除该字段（只存 role/when 槽位）→ 通过。
- **对应测试**：待 plan Task N
- **不覆盖**：senior-sdet 专属句式（S3 覆盖，转录性质不受词表约束）。

## 3 负例与边界

| 用例 ID | 边界/负例是什么 | 为什么容易漏 | 期望行为 |
|---|---|---|---|
| TC-101 | 拆槽错字（role/when 转录错一字） | 13 席句式本就复现原句，转录错误若不比对现文件就静默通过（F2-F 教训） | C2 逐字不等 → exit 1 拦截替换 |
| TC-102 | when 提取错位为整句 description（含禁止字样） | 把整句当 when 提取是最自然的错法（S1 断言 7 专门防它） | `WhenFormatViolation` exit 1 |
| TC-103 | when 提取边界：结尾「时」归属 | spec §3 示例含尾「时」、与 P2-2 公式拼装矛盾，照示例直译必出「时时调用」 | 黄金断言拦截；when 应取不含尾「时」的触发子句 |
| TC-104 | 两席 when 完全相同（误抄） | 六视角席结构同构，复制粘贴同构文本是高频误操作 | 断言 c 报错 exit 1（依赖 S1 落码） |
| TC-105 | sharedBlock 枚举名拼错/不在登记册 | 枚举引用错一字即渲染缺整块，逐字节比对前 validate 就该拦 | `SharedBlockMissing` exit 1 |
| TC-106 | ROLES 双源残留（搬走未删） | 数据搬入组件后「顺手留着旧源」最自然（F-05 教训） | grep 命中即红，C3 计数不递减即红 |
| TC-107 | 前席未巩固即跳下一席 | 队列纪律是流程属性，无账本就无证据可查 | 账本状态序列违例 → 验收拦截 |
| TC-108 | 替换前 gate 红（与目标无关漂移） | 迁移期多对象共存，无关漂移最容易混进「预期差异」被放行 | replace 拒绝、草稿保留 |
| TC-109 | 替换前 gate 红（仅目标自身预期差异） | 反向漏法：把「该放行的绑定判据」当拒红 | replace 放行，替换后 gate 收敛 |
| TC-110 | 黄金断言时序错（替换后执行） | 快照时序是隐性前提，拿迁移后文件当基准 = 恒绿假绿（P2-遗-7） | 时序审计：C2 必须在 replace 前 |
| TC-111 | 迁移中段未迁席被当清单外新文件 | registered 态语义容易与「已巩固」混淆 | 未迁席只做存在性检查，不报 `UnregisteredHandwritten` |
| TC-112 | 某席 tools 被误加写权限 | 只读三元组是模板默认，手工加字段时容易顺手加 Write | `ToolsViolation` exit 1 |
| TC-113 | ROLES 空数组过渡态行为未定义 | 12 席搬完到 W8 之间 ROLES = [] 是真实过渡态，行为没定义 = 不可判定 | exit 0 `OK：0 个 agent` 或脚本已删，二选一明确 |
| TC-114 | ROLES 移除操作波及剩余席 | 同文件多处编辑，删 A 顺手改坏 B 是真实风险 | C3 exit 1 漂移清单含被波及席 |
| TC-115 | 已巩固席被手改 | D6 纪律靠守卫执行，手改后 gate 不红 = 守卫失效 | gate `Mismatch` exit 1 拦截 |
| TC-116 | agentData 硬编码 description 绕过派生 | 把派生字段当普通字段存是最隐蔽的绕过（F-02 教训） | `DescriptionDerivation` exit 1 |

> 负例与边界 16 条 ≥ 正例 12 条（§3 数量要求满足）。

## 4 回归清单

| 如果改了 | 必须重跑 | 为什么 |
|---|---|---|
| `tools/docgen/components/agentData.mjs`（任一席数据） | TC-001、TC-002、TC-003、TC-004/005/006/007（对应席组合）、TC-008 | 数据形状决定渲染字节与派生 description，一处错连坐逐字节与黄金断言 |
| `tools/docgen/components/patternRegistry.mjs`（sharedBlock 枚举 / description 句式） | TC-004/005/006、TC-002、TC-105 | sharedBlock 引用与派生句式同源于登记册 |
| `tools/docgen/components/triggerTable.mjs`（when） | TC-002、TC-003、TC-011、TC-104 | when 是派生与断言 c 的输入 |
| `tools/docgen/components/validateAgentData.mjs` | TC-102、TC-104、TC-105、TC-112、TC-116、TC-011 | when/route/sharedBlock/tools/派生断言全在这 |
| `tools/docgen/templates/agent.md.tpl` | TC-001（全 12 席）、TC-004/005/006/007 | 模板槽位漏格只在逐字节比对暴露 |
| `skills/parliament/scripts/gen-agents.mjs`（ROLES） | TC-008、TC-106、TC-113、TC-114 | ROLES 是 gen-agents 唯一数据源，也是逐席移除的编辑点 |
| `tools/docgen/cli.mjs`（replace / 拒红过滤 / gate） | TC-108、TC-109、TC-010、TC-115 | 替换语义、拒红过滤、gate 守卫是 replace/gate 的行为 |
| 黄金断言实现（S2 落位，S4 复用） | TC-003、TC-101、TC-103、TC-110 | 时序与比较基准是断言判别力的来源 |

## 5 只手动验证

| 项 | 为什么机器验不了 | 谁验、看什么 |
|---|---|---|
| 12 席逐席替换后角色卡语义观感 | 机器只验字节一致，无法判「读起来还是同一张席卡」（拆槽后语义是否因槽位切割而受损） | 用户 / 议会评审：替换前后并排读，重点看「你是谁」与「固定必问清单」两节语义一致 |
| detective-observer 的 observation 输出格式渲染观感 | 机器只验字节，无法判「观察记录（侦探用）」表格渲染是否可读、节结构是否完整 | 用户 / 施工者：看 `agents/detective-observer.md` 输出格式节 |
| 过渡期 `gen-agents --check` 输出文本计数递减（12→…→0）的可读性 | 计数变化是预期，但「输出文本变化是否造成下游误读」需人确认 | 议会评审：过渡期抽查 C3 输出文本 |

## 6 不测（带理由）

| 不测什么 | 为什么 |
|---|---|
| 能力地基本身（CLI 六子命令语义 / 草稿箱 / 五档退出码 / 守卫迁移 / W4/W6/W7） | S1 覆盖；本 spec 只消费这些能力（S4 边界「不做能力」） |
| 试点席 reviewer-audit 的再验证 | S2 已迁已巩固；本 spec 不再动（spec §8） |
| senior-sdet 转录 | S3 覆盖（专属句式 / 词表不适用） |
| description 翻译闭环（完形填空 / 翻译质量三标准） | PRD §1.1 作用域声明，P2 内不验收 |
| W8 gen-agents 全家退役、W9 spike 退役 | S1 序 5；本 spec 只逐席移除 ROLES（spec §8） |
| 「可同时命中 = 议会多点将」的调度裁决 | R7 明确本 spec 不断言，由点将矩阵裁决 |
| 未来加席旅程（W5 受控变更 / baseline --write） | S1 序 5 终态验收覆盖 |

## 7 缺口与判别力水位

| 缺口 | 漏检哪类反例 | 至少 1 个样例 | 语义由谁兜 |
|---|---|---|---|
| when 提取边界（含不含结尾「时」） | when 收进尾「时」→ 拼装「时时调用」，黄金断言误拦（假阳性式误拦） | S4 §3 示例 `detective-observer` when = `每轮答辩结束后由主持人调度做行为核实时` → 派生 `…核实时时调用` ≠ 现文件；正确 when = 不含尾「时」（PRD P2-2 触发表示例同口径） | TC-103 拦 + spec §3 示例修正（§8 建议 3） |
| 「when 两两唯一」断言未落码 | 六视角席 when 误同静默通过（断言 c 无宿主） | interaction 误抄 product 的 when，两席 when 完全相同，validate 不报 | S1 需为断言 c 落错误码（阻塞点）；TC-104 依赖它 |
| outputKind 非法枚举错误码未定义 | 枚举错值无宿主错误码 | `outputKind: 'issue-car'` 应报什么码，S1 §6 表未定义 | S1 补映射；本文件不编造错误码 |
| 迁移状态账本未落位文件位置 | 队列纪律无机器证据可查 | 席 2 已替换而席 1 未巩固，账本无记录可核对 | PRD 6.6 账本落位（阻塞点）；TC-012/107 依赖它 |
| ROLES 空数组过渡态行为未定义 | 12 席搬完到 W8 之间 `--check` 不可判定 | `ROLES = []` 时 C3 输出/退出码无定义 | TC-113 钉边界；W8（S1）删除该脚本收口 |
| 语义观感（字节一致 ≠ 语义一致） | 机器全绿但人读不顺（断句/槽位切割的读感问题） | 迁移后 description 由句式拼装而非逐字转录，长期维护措辞与迁移前不同 | §5 人工验收（用户 / 议会评审） |

**判别力水位**：

- **假阳性样例（真实合理却被判错）**：① 六视角席 when 结构同构被误判触发冲突（TC-011 守）；② 目标对象自身预期差异被拒红过滤误拒（TC-109 守）；③ 迁移中段未迁席被误报 `UnregisteredHandwritten`（TC-111 守）；④ 过渡期 ROLES 计数递减被误判漂移（TC-008/113 守）。
- **假阴性样例（错了却判对）**：① 黄金断言时序错（替换后执行，基准 = 迁移后文件）→ 恒绿假绿（TC-110 守）；② 拆槽错字但黄金断言未执行 → 替换带错字落盘（TC-101/003 守）；③ 双源残留但 gen-agents 仍生成该席 → `--check` 不报（需 TC-106 的 grep 独立兜）；④ 硬编码 description 绕过派生 → W4 断言拦（TC-116 守）。
- **机器可判占比**：28 条中 25 条机器可判；TC-009（全流程）、TC-012/TC-107（队列顺序）为机器+人工双通道；语义观感由 §5 人工兜。依赖两个阻塞点（S1 为断言 c 落码、PRD 6.6 账本落位）的用例（TC-104、TC-012/107）须在阻塞点解除后生效。

## 8 给开发的建议

| # | 位置（文件 / spec 节号） | 风险或盲点 | 为什么会被忽略 | 具体改法 | 优先级 |
|---|---|---|---|---|---|
| 1 | S4 spec §0「outputKind 三种枚举（issue-card ×10…）」 | 计数错：12 席内 issue-card 实际 **11** 席（+ observation 1 席），×10 少一；若把 audit ×1 算进 12 席又与 §3「无 C（audit 已迁）」矛盾 | §0 概览句，读者不会逐席数 | 改为「issue-card ×11 / observation ×1」（12 席内）；audit 属 S2 已迁，不并入本 spec 计数 | P1 |
| 2 | S4 spec §3 组合 B「8 席：product / interaction / ui / ops / qa / ai / security / actuary」 | 组合 B 漏列 `reviewer-reader`：§4 推进顺序「其余 8 席」含 reader，B 组合实际 **9** 席；§3 与 §4 口径互相矛盾 | 清单式罗列，漏一席不易察觉；但 R4「三种槽位组合全覆盖」要求 reader 也入 B 组合验证 | §3 组合 B 补 `reviewer-reader`，改为 9 席；§4 其余 8 席口径不变（两处数字对齐） | P1 |
| 3 | S4 spec §3 组合 A 的 when 示例（frontend / detective-observer 均以「时」结尾） | when 示例含结尾「时」，与 P2-2 句式 `在{domain}中担任{role}。{when}时调用` 拼装矛盾：照示例直译得 `…评审时时调用` / `…核实时时调用`，黄金断言必拦（误拦合法迁移）。S2 spec §3 的 reviewer-audit when 示例同病 | spec 抄 ROLES description 时把整句抄进 when，未按「触发子句 = 去掉前后缀」切分；PRD P2-2 触发表示例（无尾「时」）才是正确口径 | when 字段统一取「不含结尾『时』的触发子句」（如 frontend = `当主持人调度对 spec/plan/技术方案做前端实现视角评审`）；S2 spec §3 同步修正 | P0 |
| 4 | S1 spec §6 校验清单（断言 1–11） | 「when 两两唯一」断言（PRD P2-8 断言清单 c）在 S1 校验表**无对应行、无错误码**；S4 R7 引用它但无宿主 | 断言清单 c 在 PRD 里是「触发表断言」，S1 拆分时只落了 notWhen/route/fallback，漏 when 唯一性 | S1 校验清单补「when 集合两两唯一」断言行并落错误码（建议归触发冲突族，exit 1），S4 TC-104 依赖此码 | P0 |
| 5 | S1 spec §6/§7（outputKind 枚举校验） | outputKind 非法枚举（如 `issue-car`）无错误码定义；S4 三组合矩阵中枚举合法性无处可判 | S1 只定义了 sharedBlock 枚举校验（断言 5），outputKind 枚举校验未落断言行 | S1 补 outputKind ∈ {issue-card, observation, audit} 的校验断言与错误码（归数据校验缺陷，exit 1） | P1 |
| 6 | PRD §6.6 迁移状态账本 | 账本未落位文件位置与格式；S4 TC-012/TC-107 的机器判据（队列纪律）依赖账本可解析 | 账本语义在 PRD 里定义了，但「放哪、什么格式、谁来写」未定；没有文件就没有机器证据 | 随 S4 plan 落位账本（建议 `.session/reviews/` 或 `docs/superpowers/reviews/` 内 `migration-ledger.md`，状态列 = PRD 6.6 四态），使队列纪律可机器核对 | P1 |
| 7 | S4 spec §9 + S1 W8 衔接 | 12 席搬完到 W8 之间 `gen-agents.mjs` ROLES = 空数组，`--check` 行为未定义（TC-113 边界） | 过渡态窗口被两头（S4 逐席移除、S1 W8 删文件）都当成对方负责，中间态无人定义 | S1 W8 或 S4 §9 明确一句：ROLES 空数组时 `--check` 输出 `OK：0 个 agent`（exit 0），或提前执行 W8 删除；二选一写入对应 spec | P2 |

> 第 1–3 条为 spec 内部事实性错误（计数 / 漏席 / when 尾「时」），施工者照 spec 直译会产出错误结果或误拦，属 P0/P1；第 4–7 条为跨 spec 缺口（错误码未落 / 账本未落位 / 过渡态未定义），是 S4 用例生效的阻塞点或边界钉。
