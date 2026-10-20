# Docgen P2 · S4：余下 12 席批量数据搬家

> split from `docs/prd/docgen-agent-generation.md` (2026-10-19)
> 日期：2026-10-19｜状态：待评审（草稿，spec + testcase 一起送议会）｜PRD 状态：已定稿
> 测试用例文件：`docs/superpowers/specs/2026-10-19-docgen-agent-batch-design-testcase.md`
> 依赖：S1 spec（能力地基）+ S2 spec（试点已验证模板与数据形状）+ PRD §5 W3 + PRD §6.1–6.4

## 0 为什么

试点（S2）验证了模型，余下 12 席是**机械重复**——但机械重复不等于可以偷懒。12 席里包含三种槽位组合：含 sharedBlock 的（SIX_METHODS ×2 / DETECTIVE_RULES ×1）、outputKind 两种枚举（issue-card ×11 / observation ×1）、六视角席的 when 同构（靠视角名不同天然两两不同）。每一席的 description 拆槽错一个字、模板槽位漏一格，都会被 W3 的逐字节比对抓到——所以本 spec 的验收锚点就是「12 席逐个走完九步闭环、逐个巩固」，不是「一次搬完」。

本 spec 只做一件事：把余下 12 席逐个从 ROLES 搬家到 docgen 组件，逐个走九步闭环（PRD 6.2）到巩固（PRD 6.3），落 W3 验收。PRD 决策原文不复制，引用见 `docs/prd/docgen-agent-generation.md` §3/§5/§6。

**外部编号对照**：

| 编号 | 含义 | 出处 |
|---|---|---|
| P2-7 | 逐 agent 串行巩固，同类不穿插 | PRD §3 |
| W3 | 12 席余下 agent 逐个验收 | PRD §5 |
| 6.1 | 对象队列与推进顺序（序 3 = 余下 12 席） | PRD §6 |
| P2-遗-7 | 黄金快照时序（迁移前现文件 = gen-agents 最后产物） | problems.md |

## 1 全貌确认

| 维度 | 内容 |
|---|---|
| 本质 | 把试点验证的「数据搬家 → 生成 → 逐字节复现（除 description）→ 黄金断言 → 替换 → 巩固」在 12 席上机械复制，逐席巩固 |
| 同族 | 同类失败面：12 席逐个搬时错字静默通过（when 提取错位）、同构 when 场景误判为冲突、ROLES 递减与 gen-agents --check 计数漂移、某席模板槽位漏格 |
| 边界 | 只做余下 12 席（试点已迁的 reviewer-audit 不再动）；不做 senior-sdet（S3）、不做能力（S1）；每席独立走闭环，逐席巩固后才下一席 |
| 验收 | W3（PRD §5）：12 席每席渲染 = 现产物（除 description）+ 迁移前 description 黄金断言通过；逐个巩固后才下一个 |
| 影响面 | `tools/docgen/components/agentData.mjs`（加 12 条）、`agents/<12 席>.md`（逐个替换）、`gen-agents.mjs` ROLES（逐个移除）、baseline agent 清单（逐个入比对子集） |

**联动四问**：

- **治本了吗**：12 席是试点模型的放大验证——三种槽位组合都覆盖到才算「agent 这一类走扎实」；治本。
- **有副作用吗**：每席替换后 gen-agents ROLES 递减（13→12→…→1），其 `--check` 计数变化是过渡期预期；`npm run check` 的 gate 随比对子集扩容而覆盖更多对象，未迁席由 gen-agents --check 守至 W8（S1 §8.3）。
- **跨问题联动吗**：12 席中六视角席（product/interaction/ui/frontend/backend/qa）when 同构（「当主持人调度对 PRD/spec/plan 做 X 视角评审时调用」），靠视角名不同天然两两不同；不得因同构误判 TriggerConflict（S1 触发表断言 c）。含 sharedBlock 的席（frontend/backend 的 SIX_METHODS、detective-observer 的 DETECTIVE_RULES）要确认 sharedBlock 引用正确。
- **跨文件吗**：`gen-agents.mjs` ROLES 被全部席共用，逐个移除需确认剩余席输出不变（与 S2 同构的回归断言，12 席逐个做）。

## 2 核心决定（不可违反）

| # | 决定 | 为什么 |
|---|---|---|
| R1 | **逐个串行，不批量**：12 席按 PRD 6.1 序 3 逐个走完九步闭环到巩固，**每席巩固后才下一席**；同类不穿插（P2-7） | W3「逐个巩固后才下一个」；批量迁移让失败面叠加，错一席带歪整批 |
| R2 | **每席数据迁移同 S2 模式**：ROLES 字段搬家 + description 拆槽（role = zh，when 逐字提取，domain = 共享常量）+ **ROLES 同步移除** | PRD 6.2 步 2；内容零改写，仅 description 派生 |
| R3 | **每席迁移前黄金断言（P2-遗-7）**：替换前，派生 description == 迁移前现 `agents/<name>.md` 的 frontmatter description **逐字相等**（直接读现文件比对） | 同 S2 R3；快照 = 迁移前现文件（= gen-agents 最后产物） |
| R4 | **三种槽位组合全覆盖**：sharedBlock（SIX_METHODS/DETECTIVE_RULES）+ outputKind 三枚举（issue-card/observation/audit）+ when 同构（六视角席）——12 席的每席都过 validateAgentData + 渲染逐字节比对 | 试点只验了 audit 一种组合；三种组合全绿才算 agent 类走扎实（S1 §2 R10/§8.1） |
| R5 | **逐字节比对同 S2**：渲染 vs 现产物，除 description 外必须相等；不等 → 回炉改组件，禁止改现产物（D6） | W3 核心判据 |
| R6 | **每席巩固定义同 S2**：替换后 gate 连续 2 次绿（含隔目录冷跑）+ `npm run check` 全绿 + `git status --short rules/ skills/ agents/` 干净 + gen-agents 该席已停输出 + 草稿箱已清 | PRD 6.3 |
| R7 | **触发表断言 c 的同构场景处理**：六视角席 when 两两不得完全相同（视角名不同天然满足）；「可同时命中 = 议会多点将」由点将矩阵裁决，本 spec 不断言 | S1 触发表断言清单 c（P2-8）；不得因同构误拒 |

## 3 数据形状：12 席条目（三种槽位组合）

**组合 A · sharedBlock + outputKind（3 席）**：

```js
// frontend / backend：sharedBlock = SIX_METHODS，outputKind = issue-card
{ name: 'reviewer-frontend', role: '前端评委', dimension: '技术实现',
  when: '当主持人调度对 spec/plan/技术方案做前端实现视角评审',   // 逐字提取触发子句（不含末尾「时」，句式补「时调用」）
  route: 'reviewer-frontend', notWhen: undefined,
  tools: ['Read', 'Glob', 'Grep'], identity: '<逐字>', fixedList: ['<逐字 8 条>'],
  sharedBlock: 'SIX_METHODS', outputKind: 'issue-card' }

// detective-observer：sharedBlock = DETECTIVE_RULES，outputKind = observation
{ name: 'detective-observer', role: '侦探', dimension: '独立观察',
  when: '每轮答辩结束后由主持人调度做行为核实',   // 逐字提取触发子句（无「时」尾缀，句式补「时调用」）
  route: 'detective-observer', notWhen: undefined,
  tools: ['Read', 'Glob', 'Grep'], identity: '<逐字>', fixedList: ['<逐字 3 条>'],
  sharedBlock: 'DETECTIVE_RULES', outputKind: 'observation' }
```

**组合 B · 无 sharedBlock + outputKind = issue-card（9 席）**：product / interaction / ui / ops / qa / ai / security / actuary / reader——`sharedBlock: undefined`，其余同构。

**组合 C · outputKind = audit（0 席）**：`reviewer-audit` 已由 S2 迁入，本 spec 不含。

> 说明：reviewer-audit（S2 已迁）的 outputKind = audit；12 席中无第二席 audit。三种槽位组合由 A（2 席 SIX_METHODS + 1 席 DETECTIVE_RULES）+ B（9 席 issue-card）+ C（0 席 audit）构成——sharedBlock 两种 + outputKind 两种枚举（issue-card / observation）全覆盖（12 席合计：issue-card 11 + observation 1）。

## 4 九步闭环执行细则（PRD 6.2 落地，每席同构）

12 席中每一席都执行 S2 §4 的九步闭环表（入选 → 数据迁移 → 生成 → 逐字节比对 → 接守卫 → 落草稿 → 替换 → 验收 → 巩固），差异仅在：

- 数据迁移的字段值不同（§3 三种组合）；
- 接守卫时该席入 baseline 比对子集；
- 替换用 `docgen replace --kind agent --name <该席名> --draft <草稿> --yes`。

**推进顺序建议**（按 PRD 6.1 序 3，每席巩固后才下一席）：

1. `reviewer-product`（无 sharedBlock，最简）——先验证 B 组合；
2. `reviewer-frontend` / `reviewer-backend`（sharedBlock = SIX_METHODS）——验证 A 组合；
3. `detective-observer`（sharedBlock = DETECTIVE_RULES + outputKind = observation）——验证 observation 枚举；
4. 其余 8 席（interaction/ui/ops/qa/ai/security/actuary/reader）逐个。

## 5 W3 验收（本 spec 的验收锚点）

| 检查 | 判据 |
|---|---|
| 12 席逐字节一致 | 每席 `docgen generate --kind agent --name <席名>` 渲染 vs `agents/<席名>.md`，`Buffer.compare` **除 description 字段外** === 0 |
| 每席 description 派生 | 渲染 description === `在议会评审中担任{role}。{when}时调用` 逐字相等（domain = 议会评审 常量） |
| **每席迁移前黄金断言（P2-遗-7）** | 替换前，派生 description === 迁移前现文件 frontmatter description **逐字相等**（直接读现文件比对） |
| 三种槽位组合全绿 | sharedBlock 两枚举（SIX_METHODS/DETECTIVE_RULES）+ outputKind 两枚举（issue-card/observation）均通过 validateAgentData + 渲染比对 |
| 逐个巩固 | 每席替换后 gate 连续 2 次绿（含隔目录冷跑）+ `npm run check` 全绿 + `git status --short rules/ skills/ agents/` 干净 + gen-agents 该席已停输出 + 草稿箱已清；**全部 12 席巩固后才收口** |

## 6 硬约束

1. 逐个串行、逐个巩固，不批量、不穿插（R1，P2-7）。
2. 每席禁止手改 `agents/<席名>.md`（D6）；任何差异回炉改组件。
3. 每席 description 是派生字段，`agentData` 不存独立 description（S1 R13）。
4. 每席黄金快照 = 迁移前现文件（gen-agents 最后产物），不得用迁移后文件当基准（R3，P2-遗-7）。
5. 每席 ROLES 搬走即删，不留双源（R2）。
6. 六视角席 when 同构不构成 TriggerConflict（R7，S1 触发表断言 c）。

## 7 测试

| 测什么 | 为什么 |
|---|---|
| 12 席逐字节一致（除 description） | W3 核心；模板槽位漏格/转录错位在这暴露 |
| 每席 description 派生逐字相等 | 拆槽错字是最隐蔽的假绿（F2-F 教训） |
| 每席迁移前黄金断言 | 拿错基准 = 黄金断言假绿（P2-遗-7） |
| 三种槽位组合全覆盖 | 试点只验 audit；sharedBlock/observation 组合在 12 席才首次覆盖 |
| ROLES 逐席移除后 gen-agents 对剩余席输出不变 | 移除一席不能波及其它在役席 |
| 逐席巩固 | 任一席未巩固 = 队列卡在该席（P2-7） |

**测试用例文件**：`docs/superpowers/specs/2026-10-19-docgen-agent-batch-design-testcase.md`（由 `senior-sdet` 独立编写；每条用例五要素、负例 ≥ 正例、覆盖总表指回本 spec 的 R 编号与 W3 锚点）

**只手动验证**：12 席逐席替换后角色卡语义观感（机器验字节，人验「读起来还是同一张席卡」）；detective-observer 的 observation 输出格式渲染观感。

**不测**：能力地基本身（S1）；试点席（S2 已迁）；senior-sdet（S3）；description 翻译闭环（PRD §1.1 作用域，P2 内不验收）。

## 8 不在这一轮

- 试点席 reviewer-audit——S2 已迁，本 spec 不再动。
- senior-sdet 转录——S3。
- 能力完备（W6/W7 幂等）——S1 序 4。
- gen-agents 全家退役（W8）与 spike 退役（W9）——S1 序 5（本 spec 只逐席移除 ROLES，`gen-agents.mjs` 文件本身由 W8 删）。

## 9 将来才会撞上的一件事

12 席迁移结束后，gen-agents ROLES 将只剩空数组（或已删）。届时「议会加席」的入口 = S1 的 `baseline --write` 受控变更旅程（W5）。本 spec 不做加席，但逐席迁移积累的 when 提取经验（六视角席同构）会成为未来加席时触发表的数据样本。本轮只点名，不定案。

## 10 与既有 spec 的关系

- **不取代**任何既有 spec。
- **引用** `docs/prd/docgen-agent-generation.md` §5 W3 + §6.1–6.4 作为验收与流程源；不复制决策原文。
- **依赖** S1 spec（能力地基）+ S2 spec（试点已验证模板与数据形状，本 spec 复制其模式）。
- **衔接** S1 §8.6：12 席全部巩固后，若无停损未迁，P2 达到理想收口（14 席无未迁）。
