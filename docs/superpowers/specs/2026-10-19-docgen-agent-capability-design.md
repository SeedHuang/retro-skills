# Docgen P2 · S1：能力与终态（CLI 基建 / 草稿箱 / 守卫迁移 / 终态验收）

> split from `docs/prd/docgen-agent-generation.md` (2026-10-19)
> 日期：2026-10-19｜状态：待评审（草稿，spec + testcase 一起送议会）｜PRD 状态：已定稿（五轮评审通过，SHA256 `8C010445...`）
> 测试用例文件：`docs/superpowers/specs/2026-10-19-docgen-agent-capability-design-testcase.md`
> 依赖：PRD §3/§4/§5/§7/§8；P1 spec `2026-10-18-docgen-rule-whole-file-design.md`（V1–V11 迁移源）

## 0 为什么

P2 把「组件 → 模板 → 生成 → 守卫」扩到 agent 一类。PRD 已定 14 个 agent 的迁移目标（P2-1~P2-8）与九步闭环（§6.2），但**能力地基**还没落成可编码设计：`tools/docgen/` 长什么样、draft/replace/gate 的命令语义、五档退出码怎么映射、gen-agents 的守卫断言迁到哪、check-all 怎么参数化、spike 的 V1–V11 怎么等价承接。没有这份 spec，S2/S3/S4 的施工者会各自发明 CLI 语义和草稿箱行为——上一轮 PRD 评审（F-B/F-06/F-07）已经证明，同一对象被两处不同口径约束时，验收必然假绿。

本 spec 只做一件事：把 PRD 的序 0（能力前置）+ 序 4（能力完备）+ 序 5（终态验收）落成**可编码的模块边界、数据形状、CLI 语义、错误优先级与等价迁移表**。PRD 决策原文不复制，引用见 `docs/prd/docgen-agent-generation.md` §3/§4/§5/§6/§7/§8。

**外部编号对照**：

| 编号 | 含义 | 出处 |
|---|---|---|
| D6 | 生成物禁手改；`npm run check` 只读重渲染并逐字节比对 | 索引 §2 |
| D9 | `description` 只写触发条件；来源是触发表 | 索引 §2 |
| D14 | 只保留一个生成来源：docgen 吸收 `gen-agents` 的 `ROLES` 与 `--check` | 索引 §2 |
| P2-1 | agent 卡 = 骨架 + 槽位模式 + 枚举共享块（双模板） | PRD §3 |
| P2-2 | description = 派生字段，固定句式 `在{domain}中担任{role}。{when}时调用` | PRD §3 |
| P2-3 | gen-agents 全家退役（守卫断言迁入，一双原子删） | PRD §3 |
| P2-4 | 草稿 → 确认 → 替换（永不静默替换） | PRD §3 |
| P2-5 | baseline 两清单（rule 21 + agent 14 = 35 条，增量演进） | PRD §3 |
| P2-6 | 正式管线落位 `tools/docgen/`；spike 保留至验收全绿后删 | PRD §3 |
| P2-7 | agent 类统一迁移、逐个巩固 | PRD §3 |
| P2-8 | 槽位模式抽象 + 翻译闭环（P2 内不验收翻译） | PRD §3 |
| W4 | description 派生锚点 + gate 全 14 席断言 | PRD §5 |
| W5 | gate 扩容 + 新增 1 席受控变更旅程 | PRD §5 |
| W6 | 草稿 → 替换（能力完备） | PRD §5 |
| W7 | 草稿纪律（永不静默替换等） | PRD §5 |
| W8 | gen-agents 退役 | PRD §5 |
| W9 | spike 退役（等价迁移表） | PRD §5 |
| ROLES | `skills/parliament/scripts/gen-agents.mjs` 内 13 席议会角色的结构化数据常量（本份的 agent 数据迁移源） | PRD §1 |
| V1–V11 | P1 spec 的 13 个等价迁移用例（V1 整文件 / V2/V2b 差异 / V3 缺格 / V4 新增 / V5 非法类型 / V6 纯度+硬编码（拆 V6①/②/③）/ V7 坏 baseline / V8 环境 / V9 可复跑 / V10/V10b 入口 / V11 故障注入），见 §8.4 等价迁移表 | P1 spec §7 |
| registered 态 | 组件已有数据、但 `agents/*.md` 尚未替换为 docgen 产物的迁移中对象；跳过逐字节比对、只做登记/存在检查 + 标注未巩固 + 容忍红（迁移期未入队/停损席的守卫载体） | PRD §6.4 + 本 spec §8.6 |
| 族裁决 | 议会多轮评审的裁决记录标记，「X 族」为裁决来源标识（如 A 族 = 时时调用矛盾、B 族 = fallback 断言；来源详见 `.session/reviews/2026-10-19-1430-docgen-p2-s1-spec/problems.md`）；本 spec 中「（X 族裁决）」仅作可追溯性标记，不展开裁决过程 | 本 spec 评审账本 |

## 1 全貌确认

| 维度 | 内容 |
|---|---|
| 本质 | 把「CLI + 草稿箱 + 守卫 + 错误码 + baseline」落成 P2 的共享能力地基，让 S2/S3/S4 的每个 agent 走同一条九步闭环 |
| 同族 | 同类失败面：CLI 语义自造（draft/replace 行为不一）、草稿箱被手改绕过 D6、守卫断言迁移丢断言、退出码档位不定导致 testcase 无法写死、spike 与 docgen 双份真相、check-all 硬编码 21/21 |
| 边界 | 只做能力与终态；**不做**任何单席数据搬家（S2/S3/S4）、不做 description 翻译闭环落地（PRD §1.1 作用域声明）、不做 skill/rule（P3/P4） |
| 验收 | PRD W4/W5/W6/W7/W8/W9 全绿 + 退出码五档 + P2-遗-1/2/3/6/8 吸收；本 spec §10 只写测什么/为什么，具体用例在 testcase 文件 |
| 影响面 | `tools/docgen/**`（新建）、`skills/parliament/scripts/gen-agents.mjs`（删）、`gen-agents.test.mjs`（删）、`scripts/check-all.mjs`（参数化）、`skills/parliament/SKILL.md` + `assembly-matrix.md`（指令改指）、`tools/docgen-spike/**`（W9 后删） |

**联动四问**：

- **治本了吗**：把能力地基做成「一份 spec 定义 + 一份 testcase 断言」，不是每个 agent 各发明一套；治本。
- **有副作用吗**：check-all 参数化会改变 `npm run check` 的 gate 调用；spike 迁移会让 P1 的 V1–V11 断言换宿主——这是设计目的，不是副作用，但需等价迁移表兜底。
- **跨问题联动吗**：CLI 语义、守卫迁移、退出码档位、草稿箱四者互相牵连，必须同批实现（见 R6/R7/R8），否则 S2 试点一开工就撞上 draft/replace 未就位（PRD F-03 教训）。
- **跨文件吗**：`check-all.mjs` 是全局入口；`parliament/SKILL.md` 与 `assembly-matrix.md` 的生成指令退役后悬空（PRD F-B 教训），必须同批更新。

## 2 核心决定（不可违反）

| # | 决定 | 为什么 |
|---|---|---|
| R1 | CLI 统一入口 `tools/docgen/cli.mjs`：`generate` / `draft`（`ls`/`rm`/`ensure`）/ `replace` / `gate` / `check-agents` / `baseline --write` 六子命令 | P1 的 spike `run.mjs` 是单命令多 flag；P2 需要草稿箱状态机（draft/replace 多子命令），单命令 flag 会爆炸。统一入口 = 一处解析一处文档 |
| R2 | 草稿箱 `~/.retro-skills/docgen-drafts/`，命名 `<name>--<YYYYMMDD-HHMMSS>.md`；`draft ls` 列出全部、`draft rm --name` 删该名下全部、`draft ensure` 幂等建目录；**每 name 至多一份草稿**（G 族裁决） | 草稿是「未确认的生成物」，必须有独立于 `agents/` 的落点（PRD P2-4）；时间戳命名可区分不同 name 的草稿；`ensure` 幂等语义与 `use-rule-skills/drafts.mjs` 对齐；同 name 已有草稿则 `draft` 拒绝（DraftNameConflict），与「遇旧稿阻断 / replace 后清草稿」一致 |
| R3 | `generate` = 内存渲染 + 比对，不写盘、不落草稿；无 `--name` 时遍历全部（rule + agent 两清单）；**registered 态对象跳过逐字节比对，只登记/存在检查 + 标注未巩固 + 容忍红（D 族裁决）**；`--name <不存在>` → `MissingComponentData` | 纯检查语义（PRD §4 接口）；有 `--name` 精确到单对象便于施工期调试；S1 终态 14 席数据在组件但文件未替换，无此豁免则 generate 必红 |
| R4 | `draft --kind agent --name <name>`：渲染落草稿箱，**不碰 `agents/*.md`**；**遇该名下旧草稿（或同秒撞名）→ 报 `DraftNameConflict`（exit 1），不自动生成**（PRD W7「入口不自动认领」） | 永不静默覆盖（PRD P2-4）；旧草稿自动认领会丢用户未采纳的版本；串行重复 draft 由旧草稿检查拦截，同秒撞名是并发竞态兜底，两者同码（L 族裁决） |
| R5 | `replace --kind agent --name <name> --draft <草稿> [--yes]`：**缺 `--yes` → `NotAuthorized`（exit 4）**；写入 = 临时文件 + rename 原子替换（**临时文件与目标同目录，保证同卷 rename 原子，P2-K 裁决**）；**校验草稿字节 === 组件内存渲染，不等 → `DraftDrift`（exit 1）**；**gate 前置检查按 §5.3 判别子拒红**；`--draft` 读取路径不受 ROOT 白名单约束 | PRD P2-4「永不静默替换」要可机械判（`--yes` 是显式授权位）；原子替换防中断写坏（PRD F-06）；草稿被手改 = 绕过 D6，字节校验堵死（PRD P2-05）；同卷 rename 是 Windows 原子性前提（跨卷 EXDEV 退化，P2-K）；目标对象自身预期差异不构成拒红（PRD §4/6.5，F2-A）；草稿箱在 homedir 不属于 ROOT（PRD P2-05） |
| R6 | **拒红过滤（P2-遗-8）**：replace 前 gate 红时，按 **§5.3 判别子**判定——允许替换当且仅当 `D ⊆ {目标} ∪ {该文件在草稿箱有草稿且草稿 == 组件渲染}`；目标自身差异与「已落草稿的同源多目标」放行，无草稿的手改漂移拒绝 | PRD §4「拒红仅指与目标无关的漂移」缺操作定义；判别子让「同源预期差异 vs 无关漂移」可机械区分（F 族裁决，TC-018/031 区分依据） |
| R7 | **守卫迁移（P2-3）**：`gen-agents.test.mjs` 的 6 条守卫断言（name 唯一 / 占位符 / frontmatter 合法 / tools 只读 / 特质段一致 / 零漂移）**迁入 `validateAgentData` / `check-agents`**；守卫迁移 + 旧测试删除排**队列序 0**（先于试点）；`gen-agents.mjs` 本文件 W8 才删 | PRD F-B：删源后 check-all 必红；守卫断言无承接即丢失；ROLES 递减前先移走硬编码 13 席断言 |
| R8 | **check-all 参数化（P2-5）**：`scripts/check-all.mjs` 的 gate 调用切到 `tools/docgen/cli.mjs gate`；**baseline 断言从共享常量派生 `baseline N/N`**，不再硬编码 21/21；切换与守卫迁移同批（序 0） | PRD §7 交付物 6 + BE-3-02：切换不早则迁移期巩固判据「gate 连续 2 次绿」在 spike gate 下不含 agent 重建比对而空转 |
| R9 | **退出码五档（P2-遗-6）**：0 全绿 / 1 数据校验缺陷 / 2 配置·baseline·环境前置 / 3 IO·依赖 / 4 未授权。逐码映射见 §7 | P1 spec 三档（0/1/2/3）+ PRD 新增 exit 4（NotAuthorized）；CI 需区分「环境没准备好 / 代码写错了 / 没授权」，否则停损误判 |
| R10 | **gate 两清单基线 + 全量重建比对**：rule（21，P1 沿用）+ agent（14）= 35 条路径**常量开工即收录**；已巩固 agent 进比对子集做重建比对，未迁 agent 在常量内做登记/存在检查（registered 态）；清单外新文件 → `UnregisteredHandwritten` | PRD P2-5：迁移中段未迁席不能落盘旧文件触发 UnregisteredHandwritten；已巩固席要逐字节守（D6） |
| R11 | **check-agents = 过渡命令**：等价旧 `gen-agents --check` 的**检查语义**——遍历 baseline 清单内**全部 agent 对象**（含已巩固与 registered 态）；已巩固逐字节比对、exit 0=一致/1=漂移、漂移消息含文件名；registered 态跳过逐字节、做存在性检查 + 标注未巩固 + 容忍红；**存在任何未巩固对象（registered 态）时别名保留，W8 不摘**（P2-遗-3） | PRD W8 + §8(b)：未迁席守卫载体 = check-agents；别名保留颗粒度统一为「存在 registered 态即保留」（P2-遗-3） |
| R12 | **baseline --write**：承接 P1 `--write-baseline` 语义——**渲染当前常量两清单并写 baseline 文件**，非固定 35 条；**合法新增 agent 的入口**（加组件数据 → 生成 → 草稿 → 确认 → 替换 → 刷新 baseline） | PRD §4 + F-08：议会加席时必须有正规路径，否则 gate 必红且无解 |
| R13 | **W4 机械断言**：gate 增加断言 `description == 句式拼装输出`（全 14 席，防组件硬编码 description 绕过派生）+ **`description` 不得含「时时」连续字**（A 族补，防新增席静默出货）；**词表裁决（Q 族）**：P2 内 13 席 + senior-sdet 的 description 全被句式机械锁定，词表无消费对象，落地推迟至加席流程（`dc-translate` skill） | PRD W4 + F-02：防「把 description 当普通字段存」绕过派生；「时时」断言是自证循环（渲染==拼装同源）之外的独立防线；词表只约束未来加席的派生产出（P2-8/F2-L） |
| R14 | **W9 等价迁移表**：P1 的 V1–V11（13 例）在 `tools/docgen/` 等价重建，等价映射表落位（见 §9）；spike 目录保留至 P2 验收全绿后删 | PRD W9 + P2-6：迁移不是重写语义；等价表是 W9 验收的操作定义 |
| R15 | **停损**：沿用 P1（同一红项修复 2 次仍红 → 停止写复盘；环境/基线红不计入停损） | PRD §5 通用前置 |

## 3 模块与数据流

### 3.1 文件布局

| 文件 | 职责 | 纯度 |
|---|---|---|
| `tools/docgen/components/agentData.mjs` | `agentData`（14 席：ROLES 13 席迁入 + senior-sdet 转录）+ `triggerTable`（when/route/notWhen/fallback）+ `AGENT_KINDS` | 纯：无 IO、无环境、无时间 |
| `tools/docgen/components/patternRegistry.mjs` | 模式登记册（description 句式 / identity 主句式 / tools 枚举 / outputKind / sharedBlock 枚举）+ 例外机制 | 纯 |
| `tools/docgen/components/validateAgentData.mjs` | `validateAgentData()`：承接 gen-agents.test.mjs 6 条守卫断言 + when 格式约束 + description 派生校验 | 纯 |
| `tools/docgen/components/specTestCaseGate.mjs` | **P1 迁移**：`buildData()`/`render()`/`renderBlocks()`/`BASELINE_RULES`/`renderBaseline()`（rule 侧） | 纯 |
| `tools/docgen/components/compare.mjs` | **P1 迁移（E 族补落点）**：`compareBuffers()`、`checkEnvironment()`、`assertTemplateClean()`、`withReadProbe()`（等价迁移用例 V2/V2b/V6/V7/V8 的函数级承载） | 纯：只吃 Buffer 与路径字符串 |
| `tools/docgen/templates/agent.md.tpl` | 议会席模板（13 席共用；骨架 + 槽位） | 数据 |
| `tools/docgen/templates/agent-handwritten.md.tpl` | senior-sdet 手写卡模板（第二套，含专属节） | 数据 |
| `tools/docgen/templates/rule.md.tpl` | P1 迁移（rule 侧） | 数据 |
| `tools/docgen/baseline.json` | 两清单（rule + agent）合并的生成视图（`renderBaseline()` 输出） | 数据 |
| `tools/docgen/cli.mjs` | 六子命令 CLI、IO、草稿箱、gate、check-agents、baseline --write | 编排层：允许 IO |
| `tools/docgen/test/*.test.mjs` | 单元测试（validate / compare / cli / gate / drafts） | 测试代码 |
| `~/.retro-skills/docgen-drafts/` | 草稿箱（homedir，不入仓库） | 数据 |
| `scripts/check-all.mjs` | gate 调用切到 `tools/docgen/cli.mjs gate`；baseline 断言参数化 | 编排层 |
| `.gitignore` | 追加草稿箱路径（若落仓库内则不需要；草稿箱在 homedir 天然不进 git） | 配置 |

### 3.2 数据流（每步标注成本属性）

| 步 | 动作 | 成本属性 |
|---|---|---|
| ① | `cli.mjs` 解析子命令与参数 | 0 token |
| ② | `generate`：读组件数据 → `validateAgentData()` → `render()` → 内存比对 target | 实跑（读文件） |
| ③ | `draft`：同上渲染 → 写草稿箱 `<name>--<时间戳>.md` | 实跑（写草稿箱） |
| ④ | `replace`：读草稿 → 校验字节 === 内存渲染 → 临时文件 + rename 写 `agents/<name>.md` | 实跑（读草稿 + 写 agents） |
| ⑤ | `gate`：读 baseline 两清单 → 遍历比对（已巩固）→ 登记检查（registered）→ 派生断言（W4） | 实跑 |
| ⑥ | `check-agents`：遍历 agent 对象 → 已巩固逐字节 / registered 存在性 | 实跑 |
| ⑦ | `baseline --write`：渲染当前常量两清单 → 写 baseline 文件 | 实跑 |

## 4 数据模型

### 4.1 `agentData` 条目形状（P2-8 字段映射）

```js
{
  name: 'reviewer-audit',            // 必填，ROLES.name
  role: '审计专员',                   // 必填，= ROLES.zh（P2-8 统一单字段 role，position := role）
  dimension: '独立（标准核对）',      // 13 席有；senior-sdet 无此字段
  // 触发表字段（when/route/notWhen/fallback）只住 triggerTable，agentData 条目不含——单一真相（K 族裁决）
  tools: ['Read', 'Glob', 'Grep'],   // 13 席只读三元组；senior-sdet 追加 Write/Edit
  identity: '...',                   // 转录常量（13 席逐字；senior-sdet 逐字）
  fixedList: ['...'],                // 手写数据字段，转录
  sharedBlock: 'AUDIT_RULES',        // 枚举引用（patternRegistry 内）；senior-sdet 无
  outputKind: 'audit',               // 枚举：issue-card | observation | audit | testcase（testcase 为 senior-sdet 使用；与 §6 断言 11 同口径）
}
```

- `agentData` **不存独立 `description` 字段**——description 渲染时派生（P2-2，防硬编码绕过派生）。
- **触发表字段（when/route/notWhen/fallback）只住 `triggerTable`**（单一真相，D8），agentData 条目不含；`validateAgentData(agentData, triggerTable)` 第二参数即该表（K 族裁决；与 PRD P2-8 触发表字段表 L76-81 对齐，S1 不把字段挪进 agentData）。
- 13 席 `notWhen` 一律缺省（未声明 = 合法值）；模板边界节不渲染 notWhen 槽位（P2-2）。
- `when` 槽位格式约束（validateAgentData）：不得含「在…中担任 / 时调用」字样、**不得以「时」结尾**（防把整句 description 当 when 提取 + 防拼装出「时时调用」，A 族裁决）。
- **fallback 形状裁决**：`fallback` 为可选布尔声明位（`true` 表示该 route 为兜底），断言 e 为 **vacuous**（未声明 = 合法值；若声明则值必须为 `true` 且 route ∈ agentData 键集）——与 PRD P2-8 L81 布尔说一致，修正 L91「fallback ∈ agentData 键集」措辞（fallback 是布尔不在键集，B 族裁决，待 PRD 下次同步）。

### 4.2 description 派生（P2-2）

- 13 席：`在{domain}中担任{role}。{when}时调用`
  - `domain` = 共享常量「议会评审」（13 席相同，写死于组件常量，不从各席提取）；
  - `role` = agentData.role（= ROLES.zh）；
  - `when` = 触发表逐字提取（含前导连接词「当 / 每轮」，**不含尾随「时」**——「时调用」的「时」是句式固定部分，非 when 内容；否则拼装出「时时调用」、黄金断言必红。PRD P2-2 触发表例子同口径，A 族裁决）；
  - 拼装禁引入新词。
- senior-sdet 专属句式（手写卡模板例外）：`{身份句}。{when}时调用。Do not use for {notWhen}。`（身份句 / when / notWhen 均逐字取自现 description 原文；when 同样不含尾随「时」）。
- **迁移期一次性黄金断言**：派生 description == 迁移前现 `agents/<name>.md` 的 frontmatter description **逐字相等**（在替换前 6.2 步 7 之前执行，直接读现文件比对；S2 首次落 testcase，S4 复用）。
- **gate 机械断言（防「时时调用」对新席静默出货，A 族补）**：派生 description 不得含「时时」连续字（对全部 14 席 + 未来加席生效；迁移席靠黄金断言兜底，新增席靠此断言兜底——因新增席无现文件、无黄金断言）。
- **W4 派生断言 registered 豁免（第 3 轮 Q-3-NEW-1 裁决）**：W4 派生断言（§6-8/R13）与断言 14 同豁免口径——**S1 阶段仅对已拆槽席生效，registered 未拆槽席豁免，拆槽完成后全量生效**。registered 未拆槽席的 when 未拆槽、无法按句式拼装 description，若按「全 14 席」字面实现则 S1 终态 gate 必红。

### 4.3 `BASELINE` 两清单

- rule 清单：P1 的 `BASELINE_RULES`（21 条）沿用，路径 `rules/*.md`。
- agent 清单：**= `Object.keys(agentData)` 的字典序排序**（14 席：13 席 + senior-sdet；新增席自动入清单——单一真相，M 族裁决 + NF-5 裁决补字典序；`Object.keys` 是插入序非字典序，必须显式 sort）；不设独立常量，防第二份真相。
- **路径形态**：两清单条目均为 **POSIX 路径**（`rules/xxx.md` / `agents/xxx.md`）、**字典序**、经 `path.posix` 归一（Windows 下不经归一会产生 `\`，撞上 `InvalidBaselinePath` 拒绝 `\` 的校验；承接 P1 §4.2/R4，H 族裁决）。
- **baseline 文件落点**：`tools/docgen/baseline.json`（rule + agent 两清单合并的生成视图，`JSON.stringify(...,2)+'\n'`；P1 的 spike baseline.json 随 W9 迁移，H 族裁决）。
- 常量在 P2 开工即收录全部 35 条路径（21 rule + 14 agent = **开工基线 35**；随 W5 新增席演进为 36+，见 §8.2）；`renderBaseline()` 渲染两清单。
- 增量演进 = **比对子集演进**：已巩固 agent 进比对子集做重建比对；未迁 agent 在常量内只做登记/存在检查。

### 4.4 模式登记册（P2-8）

- `patternRegistry`：每个槽位一条模式定义 = 句式 / 枚举 / 常量 + 变量槽位 + 机械校验。
- 已识别模式：description 句式（13 席）；identity 主句式「资深{role}，对{dim1}与{dim2}有经验直觉」**仅作未来加席目标句式——13 席现状全部视为已识别例外（常量转录不动）**；负责/不负责列表（主干派生，P2 内仅登记不生效）；tools（只读三元组 + 追加）；outputKind / sharedBlock（枚举）。
- 例外流程：套不进 → 记录（原文 + 原因）→ 用户/评审裁决 → 进化模式；同字段第二次套不进 = 该模式必须进化。

## 5 CLI 语义

### 5.1 命令总览

```text
node tools/docgen/cli.mjs generate [--kind rule|agent] [--name <name>]   # --kind 缺省 = 两清单全遍历（NF-2）
node tools/docgen/cli.mjs draft --kind agent --name <name>        # 落草稿箱；遇旧草稿列出不自动生成；非 agent kind → UnsupportedKind（exit 2，NF-3）
node tools/docgen/cli.mjs draft ls [--name <name>]
node tools/docgen/cli.mjs draft rm [--name <name>] [--yes]        # 无 --name 删全部需 --yes 授权
node tools/docgen/cli.mjs draft ensure
node tools/docgen/cli.mjs replace --kind agent --name <name> --draft <草稿> [--yes]  # 非 agent kind → UnsupportedKind（exit 2，NF-3）
node tools/docgen/cli.mjs gate
node tools/docgen/cli.mjs check-agents
node tools/docgen/cli.mjs baseline --write
```

> **测试驱动面（E 族裁决，承接 P1 §7.1 R14）**：`generate` 额外接受 P1 的故障注入覆盖参数 `--template/--target/--baseline/--compare/--fixture/--out`，**仅限 `.tmp-test/**` 副本**（沿用 P1 assertInside 三段判定：resolve → relative 越界 → realpath 复判），默认用仓库内文件——V2/V2b/V6/V7/V8/V11 的等价迁移用例靠这些参数在副本上注入故障；输入侧越界 → `InvalidInputPath`（exit 2）、输出侧 → `InvalidOutputPath`（exit 2）。`--raw` 错误原文冒泡固定 exit 2（P1 §7.1 语义保留）。**`gate` 无独立注入参数（第 3 轮 Q3-F2 裁决）**：gate 只读仓库内真文件（`rules/*.md` + `agents/*.md` + `tools/docgen/baseline.json`），V10/V10b 的故障注入（新增规则、差异 target）由 **`generate --kind rule --name <目标> --target <副本>` 承接**（与 V2 行同机制），不依赖 gate 参数。

### 5.2 子命令行为细则

| 子命令 | 行为 | 关键错误 |
|---|---|---|
| `generate` | 内存渲染 + 比对；**`--kind` 缺省 = rule + agent 两清单全遍历**（NF-2 裁决）；有 `--name` 精确到单对象。**registered 态对象跳过逐字节比对，只做登记/存在检查 + 标注未巩固 + 容忍红（与 R10 gate、R11 check-agents 同口径，D 族裁决）**；`--name <不存在>` → 报错 | 组件数据缺失 → `MissingComponentData`（exit 2）；name 不存在 → `MissingComponentData`（exit 2，Y 族补） |
| `draft` | 渲染 → 写草稿箱 `<name>--<YYYYMMDD-HHMMSS>.md`；**遇该名下旧草稿 → 列出 + 报 `DraftNameConflict`（exit 1），不自动生成** | 草稿目录不可写 → `DraftWriteFailed`（exit 3）；遇旧草稿 / 同秒撞名 → `DraftNameConflict`（exit 1，L 族裁决统一） |
| `draft ls` | 列出草稿（带时间）；`--name` 过滤 | — |
| `draft rm` | 删该名下草稿；**无 `--name` 删全部需 `--yes` 授权，缺省 → `NotAuthorized`（exit 4，I 族裁决）** | 无 `--name` 且无 `--yes` → `NotAuthorized`（exit 4） |
| `draft ensure` | 幂等建草稿箱目录 | — |
| `replace` | **检查序（P2 补，后端自由探索 3 裁决）**：参数校验（`--yes` / 路径白名单）→ 读草稿 → 字节校验 === 内存渲染 → gate 前置（拒红过滤）→ 临时文件 + rename 写 `agents/<name>.md` → 清该名下草稿 | 缺 `--yes` → `NotAuthorized`（exit 4）；草稿不存在 → `DraftNotFound`（exit 3）；草稿 ≠ 渲染 → `DraftDrift`（exit 1）；目标在替换白名单外 → `InvalidOutputPath`（exit 2）；无组件数据 → `MissingComponentData`（exit 2） |
| `gate` | 两清单基线 + 全量重建比对 + W4 派生断言 + **「description 不含时时」机械断言（A 族补）** | 沿用 P1 gate 错误族 + agent 侧新增 |
| `check-agents` | 遍历全部 agent 对象；已巩固逐字节 / registered 存在性；**registered 文件缺失 → `DanglingBaselineEntry`（exit 2，与 gate 同码，W 族裁决）** | exit 0=一致 / 1=漂移 / 2=存在性失败（文件缺失） |
| `baseline --write` | 渲染当前常量两清单写 `tools/docgen/baseline.json`（**非并发安全，单实例执行，W 族裁决**） | — |

> **name → 路径映射校验（前端自由探索 F1 裁决 + 第 2 轮 NF-1 裁决）**：检查序固定——① 先过格式校验 `^[a-z][a-z0-9-]{0,49}$`（不合法 → `InvalidName` exit 1）；② 格式通过后 `resolve('agents/'+name+'.md')` + assertInside 复判（越界 → `InvalidOutputPath` exit 2）。**regex 不允许 `/`、`\`、`.`，故「含 `/`/`..` 逃逸」在格式校验即被拦（InvalidName）**；assertInside 复判只兜格式通过后的路径越界（如 name 合法但 resolve 结果异常），不是逃逸字符的主拦截层。两码顺序明确，testcase 可写死。

### 5.3 replace 拒红过滤（P2-遗-8，R6 的操作定义）

1. replace 前先跑 `gate`（读 baseline 两清单 + 全量重建比对）；
2. gate 红时收集漂移条目清单（按文件名）D；
3. **判别子（F 族裁决，可机械判）**：允许替换当且仅当 `D ⊆ {目标对象} ∪ {该文件在草稿箱有草稿且草稿 == 其组件渲染}`——即「已在同一迁移旅程中落过草稿」的文件视同源预期差异放行（多目标收敛场景：同组件改动已为 B 落过草稿 → 替换 A 时 B 的红放行）；**无草稿的手改漂移（如手改 `agents/B.md`）→ 拒绝替换**，报对应错误码，草稿保留；
4. 其余漂移条目（baseline 类 / 新增清单外文件）→ **拒绝替换**，报对应错误码，草稿保留；
5. 同一组件改动引发的多目标差异视为同源预期差异，允许逐目标替换收敛。

### 5.4 草稿箱生命周期

- **每 name 至多一份草稿**（G 族裁决）：命名 `<name>--<YYYYMMDD-HHMMSS>.md`；同 name 已有草稿则 `draft` 拒绝（`DraftNameConflict`），先 `draft rm --name` 才能再生成——与「遇旧稿阻断」「replace 后清草稿」天然一致；不存在「同 name 多版本并存」状态。
- **draft 拒绝生成（L 族裁决统一码）**：无论因该名下已有旧草稿，还是同秒撞名（并发竞态兜底），一律报 `DraftNameConflict`（exit 1）——串行重复 draft 由旧草稿检查拦截，同秒撞名是并发竞态下的兜底场景，两者同码。
- `draft rm`：删指定 name 草稿；**无 `--name` 删全部需 `--yes` 授权**（缺省 → `NotAuthorized` exit 4，I 族裁决）。
- `replace` 成功后清该名下草稿。
- 草稿箱在 `~/.retro-skills/docgen-drafts/`，不进仓库、不进 git。
- **测试隔离**：测试代码不得写真实 `~/.retro-skills/docgen-drafts/`（尤其 `draft rm --yes` 删全部会污染真实草稿箱）——沿用 P1 测试隔离机制 + 新增 `DOCGEN_DRAFTS_DIR` 重定向变量（P1 的 DOCGEN_TEST_MODE 只重定向 TMP_ROOT/RULES_DIR/BASELINE_PATH，草稿箱重定向是 P2 扩展；check-all.mjs 的测试变量剥离逻辑同步扩展，W 族裁决）。

## 6 校验与守卫（迁移 gen-agents.test.mjs 6 条断言）

`validateAgentData(agentData, triggerTable)` 按固定顺序检查，返回第一个错误：

| # | 断言（迁移自 gen-agents.test.mjs） | 失败码 |
|---|---|---|
| 1 | **name 合法 + 唯一**（跨全部 agent 对象）：name 匹配 `^[a-z][a-z0-9-]{0,49}$` 且唯一（X 族裁决：承接 gen-agents.test.mjs 断言 1 的 regex，不只留「唯一」） | `DuplicateAgentName` / `InvalidName`（exit 1） |
| 2 | 模板占位符全被消费（agent.md.tpl / agent-handwritten.md.tpl 无未闭合占位符） | `TemplateSyntaxError`（exit 1，P1 已有） |
| 3 | **agentData 字段完整性**（J 族裁决，断言对象 = 纯数据）：name / tools 必填非空；**when 存在性由断言 14/MissingWhen 独占**（第 2 轮 F1 裁决：同一触发条件不得两码，断言 3 不查 when）；**渲染输出 frontmatter 完整性（name/description/tools 三字段）由断言 6 逐字节兜底**——数据层查字段、输出层查字节，不查不存在的 description 字段 | `FrontmatterFieldMissing`（exit 1，P2 新码） |
| 4 | tools 只读（13 席 = 只读三元组；senior-sdet = 数据字段追加 Write/Edit） | `ToolsViolation`（exit 1） |
| 5 | 特质段一致（sharedBlock 引用存在于 patternRegistry 枚举 + **引用同一枚举的席值一致** + 无 sharedBlock 席不渲染该节——真实 ROLES 仅 4/13 席有 sharedBlock 且三值 AUDIT_RULES/SIX_METHODS/DETECTIVE_RULES，第 2 轮 N1 裁决修正「13 席同值」为「同引用枚举同值」；承接 gen-agents.test.mjs「特质段一致」） | `SharedBlockMissing`（exit 1） |
| 6 | 零漂移（渲染结果 == 已生成 target；由 gate/check-agents 承接） | `Mismatch`（exit 1，P1 已有） |
| 7 | **when 格式约束**：不含「在…中担任 / 时调用」字样、**不以「时」结尾**（A 族补：尾「时」会拼装出「时时调用」） | `WhenFormatViolation`（exit 1） |
| 8 | **description 派生断言**：渲染 description == 句式拼装输出（全 14 席，**其中 registered 未拆槽席豁免，见 §4.2——与断言 14 同豁免口径**）+ **不得含「时时」连续字**（A 族补，防新增席静默出货） | `DescriptionDerivation`（exit 1） |
| 9 | **route 唯一且存在**：route ∈ agentData 键集；**同一触发表条目 route 键不得重复**（N4 残留裁决补机械句——重复 route 与悬空 route 是两失败面，删除对象报 `TriggerMissingRoute`、双席抢 route 报 `TriggerConflict`，CI 可区分） | `TriggerMissingRoute` / `TriggerConflict`（exit 1） |
| 10 | **when 集合两两唯一**：任何两席 when 不得完全相同（同构场景区分度，PRD P2-8 断言 c——六视角席因视角名不同天然两两不同；「可同时命中 = 议会多点将」由点将矩阵裁决，本份不断言） | `DuplicateWhen`（exit 1，本 spec 在 PRD 基础上补的操作码） |
| 11 | **outputKind 枚举合法**：outputKind ∈ { issue-card, observation, audit, testcase }（与 §4.1 同口径） | `InvalidOutputKind`（exit 1，本 spec 补） |
| 12 | **notWhen 引用合法**：notWhen.refs ⊆ agentData 键集 | `TriggerConflict`（exit 1） |
| 13 | **fallback 断言 e（vacuous，B 族裁决）**：未声明 = 合法；若声明则值必须为 `true` 且 route ∈ agentData 键集 | `TriggerMissingRoute`（exit 1，仅在声明且非法时触发） |
| 14 | **每 agent ≥ 1 条 when**（PRD P2-8 断言 a，P 族补——原遗漏）：triggerTable 中每席 when 非空；**S1 阶段仅对已拆槽席生效，registered 未拆槽席豁免，拆槽完成后全量生效**（第 2 轮 Q-2-01 裁决，与 W4 派生断言同豁免口径） | `MissingWhen`（exit 1，本 spec 补） |

## 7 退出码五档映射（P2-遗-6）

| 退出码 | 档位 | 错误码 |
|---|---|---|
| 0 | 全绿 | 无错误 |
| 1 | 数据校验缺陷 | `MissingSlot`、`MissingPlaceholder`、`InvalidRuleType`、`TemplateSyntaxError`、`TemplateHardcoded`、`ImpureRender`、`Mismatch`、`DuplicateAgentName`、`InvalidName`、`FrontmatterFieldMissing`、`ToolsViolation`、`SharedBlockMissing`、`WhenFormatViolation`、`DescriptionDerivation`、`TriggerMissingRoute`、`TriggerConflict`、`DuplicateWhen`、`InvalidOutputKind`、`MissingWhen`、`DraftDrift`、`DraftNameConflict` |
| 2 | 配置 / baseline / 环境前置 | `UnregisteredHandwritten`、`InvalidBaseline`、`InvalidBaselinePath`、`DanglingBaselineEntry`、`BaselineDrift`、`EnvironmentEOL`、`InvalidInputPath`、`InvalidOutputPath`、`MissingComponentData`、`UnsupportedKind` |
| 3 | IO / 依赖 | `GeneratedMissing`、`TemplateReadFailed`、`TargetReadFailed`、`WriteFailed`、`DraftNotFound`、`DraftWriteFailed` |
| 4 | 未授权 | `NotAuthorized` |

> P1 spec 的 0/1/2/3 码表为历史定义保留；本 spec 定义五档完整映射（P2-遗-6）。testcase 覆盖 exit 4。

## 8 终态验收（W4 / W5 / W8 / W9）

### 8.1 W4 description 派生

- 固定锚点：`reviewer-product` + `senior-sdet` 各 1 个的触发表数据 → 派生 description == 句式拼装结果**逐字相等**。
- gate 增加断言 `description == 句式拼装输出`（全 14 席，防组件硬编码 description 绕过派生）。
- **词表裁决（Q 族）**：P2 内 **13 席 + senior-sdet 的 description 全被句式机械锁定**（13 席固定句式拼装、senior-sdet 逐字复现），**词表无消费对象**——词表（禁成语/模糊词，如「大概/基本/显然/宁缺毋滥」类）落地推迟至**加席流程**（`dc-translate` skill 的 `fuzzy-word-scan.mjs`，见 `docs/after/dc-translator-design.md` §5），届时对新增席的派生产出生效。故 W4 不设词表断言；testcase TC-071 相应改判据（13 席句式锁定 + senior-sdet 逐字豁免，无词表断言）。

### 8.2 W5 gate 扩容 + 新增入口

- `gate` 跑两清单基线 + 重建比对（**开工基线 35 条 = 21 rule + 14 agent**，比对子集随迁移演进）。
- **新增 1 席受控变更旅程**（dc-translator 试点，衔接 `docs/after/dc-translator-design.md` §7）：加组件数据（agentData + triggerTable，**新席 when 须与现有 14 席两两不同**——断言 10 联动）→ 生成 → 草稿 → 确认 → 替换 → `baseline --write` → gate 绿。
- **词表生效时点（N3 残留裁决）**：W5 旅程新增的 dc-translator 席 **description 同样豁免词表**（与 13 席/senior-sdet 一致，句式机械锁定）；**词表第一次生效时点 = `dc-translate` skill 落地后的加席流程**（届时 description 由 AI 翻译而非句式拼装，词表才有消费对象）——消除「加席流程 = W5」的误判。TC-071 判据按此口径（P2 内无词表断言）。
- **终态基线随新增演进（N 族裁决）**：旅程新增 dc-translator 后 agent 清单 = 15，终态常量 = 21 rule + 15 agent = **36 条**；gate 输出 `baseline 36/36`。`baseline --write` 按 R12 渲染当前常量两清单——35 是开工基线，36 是旅程后终态，不硬编码固定值（testcase 从常量派生 N，不写死 35/35）。
- 清单外新增任一类文件 → `UnregisteredHandwritten`；篡改任一已生成 agent → `Mismatch`。

### 8.3 W8 gen-agents 退役

- `gen-agents.test.mjs` 已在序 0 删（6 条守卫断言迁入 validateAgentData / check-agents）。
- W8 删 `gen-agents.mjs` 后 `npm run check` 全绿。
- `check-agents` 检查语义与旧 `--check` 等价（遍历全部 agent 对象：已巩固逐字节 / exit 0=一致、1=漂移 / 漂移消息含文件名，输出文本允许 13→14 计数变化；registered 态跳过逐字节、存在性检查 + 标注未巩固 + 容忍红；**registered 对象文件缺失 → `DanglingBaselineEntry`（exit 2），与 gate 同码，W 族裁决**）。
- `parliament/SKILL.md` L15 与 `assembly-matrix.md` L31 的生成指令改指 docgen 流程。
- **存在任何未巩固对象（registered 态）时 check-agents 别名保留**（P2-遗-3）。

### 8.4 W9 spike 退役 + 等价迁移表（R14）

P1 的 V1–V11（13 例，其中 V6 拆为 V6①/②/③ 三子例 → 本 spec 等价迁移锚点共 **15 个**，Q-2-04/读者 P2-1 口径统一）在 `tools/docgen/` 等价重建。等价迁移表：

| P1 用例 | docgen 等价承接 | 说明 |
|---|---|---|
| V1 整文件模型 | `generate --kind rule` 内存渲染比对 | 逐字节一致、不写盘、打印 baseline N/N |
| V2 / V2b 差异比对 | `generate --kind rule --name <目标>` + `.tmp-test/` 副本改字节 | `Mismatch` line/byte；CRLF 不做 EOL 归一 |
| V3 缺格 | `validateData()`（specTestCaseGate 迁移） | `MissingSlot` 指向该格 |
| V4 新增规则 | `gate` 扫 `rules/*.md` 清单外 → `UnregisteredHandwritten` | 哨兵自愈沿用 |
| V5 非法类型 | `validateData()` | `InvalidRuleType` |
| V6 纯度 + 模板硬编码 | `assertTemplateClean` + fs 探针迁移 + **判据增删同步（V6③，AU-1-01 补）** | 防读 target / 模板贴全文 / 增删判据 → 渲染输出同步增删（renderBlocks 数据驱动断言） |
| V7 坏 baseline | `gate` baseline 校验（R9 顺序沿用） | `InvalidBaseline*` / `DanglingBaselineEntry` / `BaselineDrift` |
| V8 环境 | `checkEnvironment` 迁移 | BOM / CR / INVALID_UTF8 顺序 |
| V9 可复跑 | `generate` 两遍输出逐字一致 + 无残留 | 含 git check-ignore |
| V10 / V10b 入口强制 | `gate`（check-all 调用）；**`--no-clean` 不承接**（docgen `generate` 不写盘、无启动清理语义，V10/V10b 由 `gate` 读仓库真文件 + `.tmp-test/**` 副本承接） | 新增规则被拦 / 差异 target 报 Mismatch |
| V11 故障注入 | cli.mjs 参数校验 | 占位符 / 越界 / 缺失错误码 |

> 等价迁移表须在 spec 里（PRD W9「等价迁移表由 P2 spec 定义并落位」）。V1–V11 断言在 docgen 全绿后，`tools/docgen-spike/` 删除（P2-6）。

### 8.5 P2-遗吸收

| 遗留 | 吸收点 |
|---|---|
| P2-遗-1 | 未入队 registered 席**不计入**「带未迁 ≤3」上限——见 §8.6 |
| P2-遗-2 | 未入队席无停损记录，豁免 §8(b)(a) 的复盘指针要求——见 §8.6 |
| P2-遗-3 | 别名保留颗粒度统一「存在任何 registered 态对象时保留」——R11 |
| P2-遗-6 | 退出码五档完整映射 + testcase 覆盖 exit 4——§7 |
| P2-遗-8 | replace 拒红按漂移条目文件名过滤——R6/§5.3 |

### 8.6 未入队 registered 席的收口口径（P2-遗-1/2）

- 未入队席（队列未轮到）的 ROLES 数据在 W8 删 `gen-agents.mjs` 前迁入 docgen 组件并置 **registered 态**（数据源不随退役丢失）。
- **未入队 registered 席不计入「带未迁 ≤3」上限**（P2-遗-1）。
- 未入队席无停损轮次，**豁免 §8(b)(a) 的「含停损轮次与复盘指针」登记要求**（P2-遗-2）；守卫 = baseline 登记/存在检查 + check-agents（并入 registered 豁免口径）。
- §8(c) 补迁数据源 = 已迁入 docgen 的 registered 数据，P3 开工时从 registered 态转比对子集。
- **registered 态对象文件缺失**（baseline 清单内存在、但 `agents/<name>.md` 文件不存在）→ 报 `DanglingBaselineEntry`（exit 2），不允许静默通过（未入队席文件被删时 gate 不得假绿）。
- **已巩固对象文件缺失**（W 族裁决）：同属「baseline 清单内有、文件不存在」，与 registered 同口径报 `DanglingBaselineEntry`（exit 2）。
- **迁移状态账本**（P2-遗-4 吸收）：随队列推进维护 PRD §6.6 账本（对象/类型/状态/双哈希/迁移日期/巩固证据）；账本为记录型文档手写，不作为机器守卫依赖；TC-068/070/075 前置「账本存在」以引用 PRD §6.6 为准。

## 9 硬约束

1. `generate` 不写盘、不落草稿；`draft`/`replace` 才写（R3/R4/R5）。
2. replace 永不静默替换——缺 `--yes` 必拒（R5）。**`draft rm`（无 `--name` 删全部）同样需 `--yes` 授权，缺省必拒（I 族裁决）**。
3. 草稿 ≠ 组件渲染，replace 必拒 `DraftDrift`（R5）。
4. 守卫迁移 + check-all 参数化必须同批（序 0）完成（R8，BE-3-02）。
5. `agents/*.md` 是生成视图，禁止手改（D6）；改 agent = 改组件数据 → 生成 → 草稿 → 确认 → 替换。
6. `gen-agents.mjs` 数据搬走即删该席（ROLES 递减，不留双源）——但删除动作在 S2/S3/S4 执行，本 spec 只定义迁移机制。
7. description 是派生字段，`agentData` 不存独立 description 字段（R13）。
8. 退出码五档，任何新错误码必须先落映射表再使用（R9）。
9. `check-agents` 是过渡命令，存在 registered 态对象时别名保留（R11）。
10. **九步闭环步 7 的 replace 必须带 `--yes`**（AI-P2-A8 裁决）：用户确认 = 授权位，PRD 6.2 步 7 字面命令缺 `--yes`，照抄即卡死——S2/S3/S4 施工时以本 spec 为准。

## 10 测试

| 测什么 | 为什么 |
|---|---|
| 六子命令的 CLI 语义 | draft/replace 行为不一 = S2 试点一开工就翻车（F-03 教训） |
| 草稿箱生命周期 | 草稿被手改 = 绕过 D6；replace 后清草稿防止旧版本残留 |
| 守卫断言迁移 | gen-agents.test.mjs 6 断言无承接即丢失（F-B 教训） |
| 退出码五档映射 | CI 需区分环境 / 代码 / 授权（P2-遗-6） |
| 拒红过滤 | replace 拒红按文件名过滤是 P2-遗-8 的操作定义 |
| 等价迁移表 | W9 验收的操作定义（V1–V11 在 docgen 等价承接） |
| W4 派生断言 | 防组件硬编码 description 绕过派生（F-02 教训） |

**测试用例文件**：`docs/superpowers/specs/2026-10-19-docgen-agent-capability-design-testcase.md`（由 `senior-sdet` 独立编写；每条用例五要素、负例 ≥ 正例、覆盖总表指回本 spec 的 R 编号与 W 锚点）

**只手动验证**：真实草稿箱交互的「draft ls 带时间列出」的观感（机器可断言语义，观感需人看）；parliament 技能文档改指 docgen 后的可读性。

**不测**：单席数据搬家（S2/S3/S4）、description 翻译闭环（PRD §1.1 作用域，P2 内不验收）、skill/rule 生成（P3/P4）、翻译质量三标准自评（S3 覆盖）。

## 11 不在这一轮

- 单席数据搬家（S2/S3/S4）；本 spec 只提供能力地基。
- description 翻译闭环（完形填空）——PRD §1.1 作用域声明，P2 内不执行不验收。
- skill / rule 六骨架——P3/P4。
- 触发表热更新 / 多语言——PRD §2 边界。
- 跨组件引用解析器 `comp:<Name>`——P1 决定只写不解析，沿用。

## 12 将来才会撞上的一件事

P3（rule 六骨架）复用本 spec 的 `tools/docgen/` 管线与草稿机制时，「agent 专用槽位」与「rule 专用槽位」会并存于同一套组件。届时不能靠给 `cli.mjs` 加分支硬塞（D1 逻辑进组件会被 CLI 层污染）——正确方向是**每个 kind 一套数据形状 + 模板 + validate**，CLI 只负责按 `--kind` 选路由。本轮只点名，不定案。

## 13 与既有 spec 的关系

- **不取代**任何既有 spec。
- **引用** `docs/prd/docgen-agent-generation.md` §3/§4/§5/§6/§7/§8 作为决策源；不复制决策原文。
- **引用** `2026-10-18-docgen-rule-whole-file-design.md`（P1）作为 V1–V11 等价迁移的源（§8.4 等价迁移表）；本 spec 的 rule 侧组件迁移自 P1，语义不变。
- **供 S2/S3/S4 依赖**：能力地基（CLI / 草稿箱 / 守卫 / 退出码）是本份的交付，S2/S3/S4 spec 引用本 spec 的 R 编号。
- **不触碰** `2026-10-17-parliament-design.md`（它管议会流程，与本生成器无重叠；parliament 技能目录的 gen-agents 引用清理在本 spec §8.3 覆盖）。
