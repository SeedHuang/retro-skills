# Docgen P2 · S4：余下 12 席批量数据搬家

> split from `docs/prd/20261019093443-docgen-agent-generation.md` (2026-10-19)
> 日期：2026-10-19｜**修订 3（2026-10-20，议会第 2 轮答辩后）**：影响面⑫补 `cli-gate.test.mjs`（generate 期望不得依赖迁移进度）与 `pilot-render.test.mjs` 三连空行断言收窄；§3 删 fixedList 条数列（条数只由 testcase 现算）；§4.1 明确无共享块空行只在已迁 B 席上验；§5-① 补快照 = HEAD 的等价写法、§5-⑤ 补 check-all 输出席名与降级不收口；§6 补 11–13（槽位特判、测试改写不删断言、降级只 pending）｜**修订 2（2026-10-20，议会第 1 轮答辩后）**：补「空共享块少一个空行」的渲染修复与影响面；`[CONST]` 快照改 `HEAD`（检查点不再依赖未生成的 evidence）；R6 改为双闸门（`goldenAssertion` + `compareResult`）；补四键运行时守卫、注解判定时点/判者落账/降级、12 席注解进 `check-all`；干净口径改为「预期产物之外无改动」；拆批判据补「渲染器语义缺陷 → 回炉不拆批」；常量尺寸数字改为指向 testcase 现算｜**修订 1（2026-10-20）**：数据源由 gen-agents 改为迁移前现卡、四键收归 triggerTable、补四常量/evidence/注解、新增前 3 席检查点｜状态：**已定稿（2026-10-20，议会 5 轮：QA/AI/AU PASS + 审计两表 PASS）**｜PRD 状态：已定稿
> 测试用例文件：`docs/superpowers/specs/2026-10-19-docgen-agent-batch-design-testcase.md`
> 依赖：S1 spec `2026-10-19-docgen-agent-capability-design.md` + S2 spec `2026-10-19-docgen-agent-pilot-design.md` + S3 spec `2026-10-19-docgen-agent-senior-sdet-design.md` + 线 E `tools/execution-matrix/criteria.md` + PRD §5 W3 + PRD §6.1–6.4

## 0 为什么

试点（S2）验证了模型，S3 验证了第二套模板与「唯一允许差异」条款，余下 12 席因此是**机械重复**——但机械重复不等于可以偷懒：12 席里有 11 席连 `triggerTable.when` 都还没有，`sharedBlocks` 与 `outputFormats` 也只实现了试点那一席，且议会席模板从未走过「无共享块」这条分支。任何一席的 when 提取错位、共享常量少一个空行，都会被 W3 的逐字节比对抓到。

本 spec 只做一件事：把余下 12 席逐个从**迁移前现卡**搬进 docgen 组件，逐个走完九步闭环（PRD 6.2）到巩固（PRD 6.3），落 W3 验收。PRD 决策原文不复制，引用见 `docs/prd/20261019093443-docgen-agent-generation.md` §3/§5/§6。

**外部编号对照**：

| 编号 | 含义 | 出处 |
|---|---|---|
| P2-7 | 逐 agent 串行巩固，同类不穿插 | PRD §3 |
| W3 | 12 席余下 agent 逐个验收 | PRD §5 |
| 6.1 | 对象队列与推进顺序（序 3 = 余下 12 席） | PRD §6 |
| P2-遗-7 | 黄金快照时序（迁移前现文件，不是迁移后产物） | S2 spec |

## 1 全貌确认

| 维度 | 内容 |
|---|---|
| 本质 | 把 S2/S3 验证过的「数据搬家 → 生成 → 逐字节复现 → 黄金断言 → 替换 → 巩固」在 12 席上机械复制，逐席巩固 |
| 同族 | 同类失败面：when 提取错位（六视角席同构，靠视角名区分）、共享常量少/多一个空行、无共享块分支的空行、`outputKind` 复用导致渲染形态错、某席注解未判（pending 被当通过） |
| 边界 | 只做余下 12 席（`reviewer-audit` / `senior-sdet` 已迁，不再动）；不做能力（S1）、不做加席旅程（W5）。**粒度 = 一份 spec + 前 3 席代表检查点**（见 §4） |
| 验收 | W3：每席渲染 == 迁移前现卡（整文件逐字节相等）+ 迁移前 description 黄金断言通过 + 十键注解 pass + gate ×2 + `npm run check` 全绿；逐席巩固后才下一席 |
| 影响面 | ① `agentData.mjs`（12 条数据 + `triggerTable` 补 11 席 when）；② `sharedBlocks.mjs`（补 `SIX_METHODS` / `DETECTIVE_RULES`）；③ `outputFormats.mjs`（补 `issue-card` / `observation`）；④ **`renderAgent.mjs`（只改一处：`{{SHARED_BLOCK}}` 为空时只删占位符、保留该行换行；只对该槽位特判，不改 `fill` 通用空值分支）**；⑤ **`validateAgentData.mjs`（断言 15：条目不得含四键，按 outputKind 给允许集上界，不要求 identity/fixedList 必填）**；⑥ **`cli.mjs`（`cmdReplace` 校验 `compareResult === null`）**；⑦ **`scripts/check-all.mjs`（遍历 `state=replaced` 席跑 `checkAgentFile`，输出须含被检席名）**；⑧ `fixtures/<12 席>.evidence.json`；⑨ `state.json`；⑩ `rules/.inspector-annotations.json`（12 席 × 10 键）；⑪ `agents/<12 席>.md`（逐个 replace，**字节不变**）；⑫ **测试同步**：`review-fixes.test.mjs`（`reviewer-qa` 补 when 后同批改）、**`cli-gate.test.mjs`（`generate` 期望值不得依赖「迁移进度」——改为副本注入字节反例）**、**`pilot-render.test.mjs`（补「无共享块席边界前恰一空行」断言；把「禁止三连空行」收窄到「通用纪律末条 → `## 边界`」区间，因 issue-card 输出格式本身含三连换行）**。**不改** `agent.md.tpl` / `compare.mjs` |

**联动四问**：

- **治本了吗**：12 席覆盖 sharedBlock 两种 + outputKind 两种，并把「无共享块」这条从未走过的渲染分支补上守卫；治本。
- **有副作用吗**：`outputFormats` / `sharedBlocks` / `renderAgent` 被 13 席共用，改错会同时波及已巩固的 `reviewer-audit` → 用 `gate` + `pilot-render` 既有金标兜底；`triggerTable` 新增 when 进入断言 10（两两唯一）范围。
- **跨问题联动吗**：六视角席 when 同构（只差视角名），必须逐字提取；`outputKind` 同时决定模板选择 / description 句式 / fixedList 渲染模式（F26，见 PRD 候选账），本 spec 不新增 testcase 席，不触发字段化。
- **跨文件吗**：12 席共用 `agent.md.tpl` 与 `renderAgent.mjs`；一条常量错会波及全批 → 前 3 席检查点专治这个。

**粒度与拆批判据**：一份 spec 覆盖 12 席（审批 1 次），先做 3 席代表（§4），过检查点再复制余 9 席。**若出现下列任一，改为拆两批（6+6）重新送审**：① 检查点发现 3 席无法共用同一套常量/数据形状；② 本 spec 修订后超 250 行；③ testcase 修订后超 700 行；④ 议会指出某条设计会波及全部 12 席。**不触发拆批的特例**：检查点暴露的是渲染器/模板的语义缺陷（如无共享块的空行）→ 回炉改渲染器，并重跑 `pilot-render` / `sdet-render` / `render13-snapshot` 三件（其余 9 席尚无 `when`，不能渲染），不拆批——拆完两批同样红，拆批治不了共用代码的错。

## 2 核心决定（不可违反）

| # | 决定 | 为什么 |
|---|---|---|
| R1 | **逐个串行、逐席巩固**：按 §4.1 顺序逐席走完九步闭环，**每席巩固后才下一席**；前 3 席过检查点后才进余 9 席 | PRD W3 / P2-7；批量替换会让失败面叠加 |
| R2 | **数据源 = 迁移前现卡**（`agents/<name>.md`，以该席最近一次提交的 blob 为锚），**不是** `gen-agents.mjs`（该文件已不存在，S3 已断言退役） | 零改写必须有确定源；拿不存在的生成器当源 = 对着空气施工 |
| R3 | **四键只住 `triggerTable`**：`when` / `notWhen` / `route` / `fallback` 不进 `agentData` 条目；**11 席需在 `triggerTable` 新增条目**（`agentData` 中这 11 席已有骨架条目，只补 `identity` / `fixedList`，不新增 name），`reviewer-product` 已有条目需按现卡校准。**新增运行时审判者**：`validateAgentData` 断言 15 判条目键集（只禁四键、按 outputKind 给允许集上界，不要求 identity/fixedList 必填；testcase 席白名单含 `heading` / `sourceLine`） | S3 §6-3；无审判者的硬约束 = 靠自觉；上界而非必填 = 不误伤施工中段的骨架条目 |
| R4 | **黄金快照锚点 = 迁移前提交**：每席 `init-evidence` 记录 `commit` / `blob` / `sha256`；`[CONST]` 等只读校验取 `HEAD:agents/<名>.md`（12 席替换后字节不变，故 HEAD 始终等于迁移前内容；开工前由 TC-001 断言工作区 == HEAD） | S3 已实证：替换后现卡即渲染产物，读它 = 自比恒绿 |
| R5 | **每席十键注解**：A1/A2/B1–B4/C1–C4 由**独立于施工者的子代理**判定并落 `rules/.inspector-annotations.json`（三态：`pass` / `fail: 理由` / `pending`）。**判定对象 = 替换后的卡；时点 = §4 步 8；判者与依据必须落评审账本/plan 执行记录**（注解锁本身不记判者，避免改 U1 线 schema）。无独立子代理时只能写 `pending` 并标「降级模式」，不得以自评 `pass` 收口 | 线 E §0.3；检查者 ≠ 写者；不判则 12 席迁完全部 pending，语义守卫等于没接 |
| R6 | **替换前双闸门**：`goldenAssertion === 'pass'`（description 逐字）**且** `compareResult === null`（整文件逐字节）；`cmdReplace` 两处都校验 | 只校验前者时，整文件漂移仍可落盘（第 1 轮 P0） |
| R7 | **议会席卡字节不变**：这 12 席没有「来源声明行」条款，渲染必须与迁移前现卡**整文件逐字节相等**；替换后 `git diff -- agents/<名>.md` 必须为空 | W3；S3 的 `1 1`（numstat 增 1 删 1）口径只适用 senior-sdet |
| R8 | **共享常量与无共享块分支先于数据**：四个常量 + `{{SHARED_BLOCK}}` 空值分支在前 3 席里一次补齐并锁住，余 9 席只改数据 | 常量/渲染器错会波及全批；先锁基础设施，后 9 席才是纯数据复制 |

## 3 数据形状：12 席条目

**条目 8 键**（不含四键）：

```js
{
  name: 'reviewer-frontend',
  role: '前端评委',
  dimension: '技术实现',
  tools: ['Read', 'Glob', 'Grep'],           // patternRegistry.tools.readOnly，由 SKELETON 尾部 map 统一注入
  identity: '<逐字：现卡「你是谁」正文>',
  fixedList: ['<逐字：固定必问清单每条问题文本>'],  // 只存问题列，不含「| N |」与「待答」；渲染走单元格重拼
  sharedBlock: 'SIX_METHODS',                // 无共享块 = undefined
  outputKind: 'issue-card',
}
```

**触发表**（11 席新增，`reviewer-product` 校准）：

| 席 | when（逐字取自现卡 description，**不含末尾「时」**） |
|---|---|
| reviewer-product | 当主持人调度对 PRD/spec/plan 做产品视角评审 |
| reviewer-interaction | 当主持人调度对 PRD/spec/plan 做交互视角评审 |
| reviewer-ui | 当主持人调度对 PRD/spec/plan 做 UI 视角评审 |
| reviewer-frontend | 当主持人调度对 spec/plan/技术方案做前端实现视角评审 |
| reviewer-backend | 当主持人调度对 spec/plan/技术方案做后端视角评审 |
| reviewer-ops | 当主持人调度对 spec/plan/技术方案做交付运维视角评审 |
| reviewer-qa | 当主持人调度对 spec/plan/技术方案做测试视角评审 |
| reviewer-ai | 当主持人调度对 rule/skill/agents/含 AI 指令的文档做 AI 工程视角评审 |
| reviewer-security | 当主持人调度对任意文档做安全风险视角评审 |
| reviewer-actuary | 当主持人调度对任意文档做成本与收益视角评审 |
| reviewer-reader | 当主持人调度对描述性/记录型/任意文档做读者视角评审 |
| detective-observer | 每轮答辩结束后由主持人调度做行为核实 |

> `route` = 席名；`notWhen` 12 席均为 `undefined`（现卡 description 无 `Do not use for`）。

**三种槽位组合（12 席全表）**：

| 组合 | 席 | sharedBlock | outputKind |
|---|---|---|---|
| A1 | reviewer-frontend | SIX_METHODS | issue-card |
| A1 | reviewer-backend | SIX_METHODS | issue-card |
| A2 | detective-observer | DETECTIVE_RULES | observation |
| B | reviewer-product | undefined | issue-card |
| B | reviewer-interaction | undefined | issue-card |
| B | reviewer-ui | undefined | issue-card |
| B | reviewer-ops | undefined | issue-card |
| B | reviewer-qa | undefined | issue-card |
| B | reviewer-ai | undefined | issue-card |
| B | reviewer-security | undefined | issue-card |
| B | reviewer-actuary | undefined | issue-card |
| B | reviewer-reader | undefined | issue-card |

> 组合定义：**A1 = SIX_METHODS + issue-card；A2 = DETECTIVE_RULES + observation；B = 无共享块 + issue-card**（表内三列即定义，§4.1 与 testcase 直接引用本定义）。
>
> fixedList 条数不在本 spec 存数：一律由 testcase `[ROWS]` 从**快照的「固定必问清单」节内**现算（整卡 `^\| \d+ \|` 会把共享块表格算进去，禁止用作条数判据）。

**四个缺失常量（本 spec 补齐，全部逐字）**：

| 常量 | 内容来源（现卡） |
|---|---|
| `sharedBlocks.SIX_METHODS` | frontend / backend 的 `### 六手法全过（技术维度通用，每项必须有结论）` 整块（两席逐字相同） |
| `sharedBlocks.DETECTIVE_RULES` | detective-observer 的 `### 侦探处置表` 整块 |
| `outputFormats['issue-card']` | 11 席 `## 输出格式` 标题之后到 `## 通用纪律` 之前的整块（`## 八字段表` + `## 严重级别判据`，11 席逐字相同） |
| `outputFormats.observation` | detective-observer 同区段（`## 五字段表`） |

> 常量的首尾空行与结尾 `\n` 必须与现卡一致（`fill` 只做文本替换）。逐字判据 = testcase `[CONST]`（切片边界写命令、不复制正文）。
>
> **无共享块分支（第 1 轮 P0）**：现模板 `{{SHARED_BLOCK}}` 独占一行且前后无空行，`fill` 空值会连同该行换行一起删除，导致 B 组 9 席在「通用纪律末条」与 `## 边界` 之间少一个空行。修法 = `renderAgent` 对 `{{SHARED_BLOCK}}` 空值**只删占位符、保留该行换行**（即把 `{{SHARED_BLOCK}}` 替换为空串，不删其后的 `\n`；**不得**把值写成 `\n`——那会产生两个空行）；非空分支不变。必须补 `pilot-render.test.mjs` 断言：无共享块席该处恰一个空行。

**description 派生**：`在议会评审中担任{role}。{when}时调用`（domain = `patternRegistry.DOMAIN`），逐字 == 现卡 description。`description` 不存进条目（S1 R13）。ASCII 开头的 role（`UI 评委` / `AI 评委`）在 `担任` 与 role 之间**恰一个空格**（实现落 `patternRegistry.description.parliament`）——否则这 2 席 description 与现卡不逐字相等（2026-10-20 施工期勘误：原式未写明该分隔规则）。

## 4 九步闭环执行细则（每席同构）

每席执行 S2 §4 的九步闭环，本 spec 按 S3 实况补差异：

| 步 | 本席具体执行 |
|---|---|
| 1 入选 | 确认该席卡已提交（`git hash-object agents/<名>.md` == `git rev-parse HEAD:agents/<名>.md`）；跑一次 `node tools/docgen/acceptance/init-evidence.mjs <名>`（**每席只跑一次，替换后禁止重跑**） |
| 2 数据迁移 | 按 §3 写条目 + 触发表；前 3 席同批补齐四个常量与无共享块分支；内容逐字，不润色 |
| 3 生成 | `node tools/docgen/cli.mjs generate --kind agent --name <名>` → **预期 exit 0**（议会席渲染 == 现卡；与 S3 的「替换前 exit 1」不同） |
| 4 逐字节比对 | `compareBuffers(渲染, 现卡)` 必须为 `null`（整文件，含 description）；不等 → 回炉改组件/常量/渲染器，不动现卡 |
| 5 黄金断言 | `node tools/docgen/acceptance/golden-assert.mjs <名>` → `goldenAssertion='pass'` **且** `compareResult=null`；description 派生 vs 快照逐字相等 |
| 6 落草稿 | `draft --kind agent --name <名>`；草稿字节 == 渲染；`agents/` 零改动；留一份草稿副本到临时目录 |
| 7 替换 | 用户确认后 `replace --kind agent --name <名> --draft <草稿> --yes`（双闸门通过才放行）；成功路径清草稿、`state=replaced`、**卡文件字节不变** |
| 8 验收 | `git diff --numstat -- agents/<名>.md` **无输出**；`checkAgentFile('<名>')` 的 A3–A7 0 红；独立子代理判十键注解 pass（判者与依据落账） |
| 9 巩固 | `gate` ×2（含隔目录冷跑 `cold-run.mjs`）+ `npm run check` 全绿 + **干净口径 = 除本 spec 预期产物外无改动**：`git status --short rules/ skills/` 只允许 `M rules/.inspector-annotations.json`；`tools/docgen/state.json`、`tools/docgen/fixtures/<名>.evidence.json` 属预期产物；该席 numstat 空；草稿箱该名已清 |

**§4.1 推进顺序与检查点**：

1. **检查点组（3 席，三种组合各一）**：`reviewer-product`（B）→ `reviewer-frontend`（A1）→ `detective-observer`（A2）。
2. **检查点复核（必须停一次）**：三席均整文件相等 + 四个常量与无共享块分支被复用且未破坏 `reviewer-audit` 金标 + 十键注解接口跑通；任一不成立 → 按 §1 拆批判据处置（渲染器语义缺陷走「回炉不拆批」特例）。**无共享块空行只在已迁 B 席上验（检查点 = `reviewer-product`）**；其余 8 席尚无 `when`，不要求可渲染，不得因此判检查点红。
3. **余 9 席**：`reviewer-backend` → `reviewer-interaction` → `reviewer-ui` → `reviewer-ops` → `reviewer-qa` → `reviewer-ai` → `reviewer-security` → `reviewer-actuary` → `reviewer-reader`，逐席闭环。

> 检查点的价值 = 把「常量/模板/渲染器不通用」这类会波及 12 席的错误，在只改了 3 席时暴露。

## 5 W3 验收（本 spec 的验收锚点）

| # | 检查 | 判据 |
|---|---|---|
| ① | 逐字节一致 | 每席渲染 vs **迁移前快照**（`evidence.commit:agents/<名>.md`；等价写法 = `HEAD:agents/<名>.md`，由 TC-001 保证工作区 == HEAD、R7 保证替换后字节不变）**整文件** `Buffer` 相等 |
| ② | description 派生 | `golden-assert` 的 `snapshotDescription === 派生`；不相等即 `goldenAssertion=fail`，replace 被拒 |
| ③ | 四个常量 + 无共享块分支 | SIX_METHODS / DETECTIVE_RULES / issue-card / observation 逐字进产物；已迁 B 席边界前恰一空行；`pilot-render` 与 `reviewer-audit` gate 仍绿 |
| ④ | 三种组合 | A1 / A2 / B 各至少一席整文件相等；12 席 `validateAgentData`（含断言 15）通过 |
| ⑤ | 十键注解 | 每席 `checkAgentFile(<名>).ok === true`（A1/A2/B1–B4/C1–C4 全 pass，无 pending）；`npm run check` 的 `check-all` 遍历 `state=replaced` 席并**在输出里打印被检席名**，故注解缺失会让 check 红。**降级模式（R5）= 该席不得判通过，W3 不收口**（过程态的 pending 与验收态的「全 pass」分开） |
| ⑥ | 逐席巩固 | 每席按 §4 步 9 六要素；**全部 12 席巩固后才收口** |
| ⑦ | 不波及其他席 | `reviewer-audit`（S2）与 `senior-sdet`（S3）的 gate / golden 断言在 12 席迁移全程保持绿 |

## 6 硬约束

1. 逐席串行、逐席巩固，不批量、不穿插；前 3 席检查点不许跳过（R1）。
2. 数据源只能是迁移前现卡；拿不存在的 `gen-agents.mjs` 当源 = 违反 R2。
3. 四键只住 `triggerTable`，条目 8 键；违规由断言 15 判红（R3）。
4. 每席 `init-evidence` 只跑一次；替换后禁止重跑（R4）。
5. 每席先 `golden-assert` 再 `replace`；`goldenAssertion !== 'pass'` 或 `compareResult !== null` 时 replace 必须被拒（R6）。
6. 议会席无来源行条款：替换后卡文件字节必须不变，numstat 必须为空（R7）。
7. 共享常量与无共享块分支先落并锁住，再复制余 9 席（R8）。
8. 禁止手改 `agents/<名>.md`；差异回炉改组件/常量/渲染器。
9. 十键注解由独立子代理判定（步 8、判换后卡），判者与依据落账；施工者不得自评；无子代理只能 pending + 降级标记（R5）。
10. 干净口径只认「预期产物之外无改动」，不得把每席必然产生的 `rules/.inspector-annotations.json` 当脏（R5/R1 冲突点）。
11. `{{SHARED_BLOCK}}` 空值保留换行**只对该槽位特判**，不得改 `fill` 的通用空值分支（会波及所有空槽位，破坏 hand-written 模板与议会席）。
12. 测试同步是「按新语义改写、保留判别力」，**不是删断言变绿**：`cli-gate` 的 `generate` 期望改为副本注入字节反例；`pilot-render` 的三连空行断言收窄到「通用纪律末条 → `## 边界`」区间（issue-card 输出格式本身含三连换行）。
13. 降级模式（无独立子代理）只能写 `pending` 并标降级，**不得以过程态收口**；W3 要求「无 pending」。

## 7 测试

| # | 测什么 | 为什么 |
|---|---|---|
| 1 | 12 席整文件逐字节等于迁移前快照 | W3 核心；常量/空行少一处即红 |
| 2 | 每席 description 派生逐字 | 六视角席 when 同构，错一个字最隐蔽 |
| 3 | 四个常量 + 无共享块空行 + 不波及其他席 | 常量与渲染器是共享的，错一处波及整批 |
| 4 | 四键运行时守卫（断言 15）+ when 提取 | 无审判者的硬约束 = 靠自觉 |
| 5 | 十键注解机械接收 + 进 `check-all` | pending / fail / 非字符串均红；收口不能靠人记 |
| 6 | 替换后卡字节不变 + numstat 空 | 与 S3 的 `1 1` 区分开，防误判 |
| 7 | 双闸门（golden + compareResult）| 只验 description 会放行整文件漂移 |
| 8 | 逐席巩固六要素 + 干净口径 | 任一席未巩固 = 队列卡住 |

**测试用例文件**：`docs/superpowers/specs/2026-10-19-docgen-agent-batch-design-testcase.md`（由 `senior-sdet` 独立编写；按「组合类别 + 检查点」组织，不按 12 席复制 12 份；覆盖总表指回本 spec 的 R 编号/§ 号）。

**执行环境**：Windows + PowerShell；命令一律用仓库内 `node` 脚本，字节写盘用 `writeFileSync`（禁 PS `>` / `Out-File` / `git show --output`）。

**只手动验证**：12 席逐席替换后语义观感（机器验字节，人验「读起来还是同一张卡」）；detective-observer 的 observation 输出格式观感。

**不测**：能力地基本身（S1）；已迁两席（S2/S3）；description 翻译闭环；词表实现（P2 内无）。

## 8 不在这一轮

- `reviewer-audit`（S2 已迁）与 `senior-sdet`（S3 已迁）。
- 加席旅程（W5）与 `baseline --write`。
- 能力完备（W6/W7）。
- 旧生成器相关动作（`gen-agents.mjs` 已不存在，无需「逐席移除 ROLES」）。

## 9 将来才会撞上的一件事

12 席迁完后，`outputKind` 同时决定「模板选择 / description 句式 / fixedList 渲染模式」三职（F26）会成为下一个瓶颈：新增 agent 或想复用议会席模板的 testcase 席时，必须先做字段化。本轮不拆，只点名。

## 10 与既有 spec 的关系

- **不取代**任何既有 spec。
- **引用** PRD §5 W3 + §6.1–6.4 作为验收与流程源；不复制决策原文。
- **依赖** S1（能力地基）+ S2（议会席模板/试点闭环）+ S3（`diffSet`、黄金快照锚点、`goldenAssertion` 闸门、第二套模板）。
- **衔接** 线 E `criteria.md`：每席十键注解按 A/B/C 判据判；判据正文不在此复制。
- **衔接** S1 §8.6：12 席全部巩固后，若无停损未迁，P2 达到理想收口（14 席无未迁）。
