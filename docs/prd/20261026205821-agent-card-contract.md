# agent 卡契约化 + 产物校验门禁（PRD）

> 状态：**待评审（未定稿）**｜版本：v3（议会 #1 第 3 轮复核后修订，2026-10-26）｜议会 #1 账本：`.session/reviews/2026-10-26-212645-agent-card-contract-prd/`
> 来源：探索稿 `docs/after/20261026164718-agent-card-composition-exploration.md`（§1 现状实测 / §3 数据模型 / §11 形态实验 / §12 增量 / §13 D10 重测 / §14 工程化实测）。
> 定稿后：设计结论并入 `docs/superpowers/specs/`，按 §8 的功能块滚动拆 spec。
> 三档标记：`[已确认]`（用户当场裁定，出处必在 §0.2）/ `[已决·代裁]`（AI 代裁 + 理由，出处必在 §0.6 或 §7，用户可推翻）/ `[待确认]` / `[FZ]`（未取证）。

---

## 0 裁决记录与事实基线

### 0.0 §0 硬门状态与授权边界

| 栏位 | 状态 | 说明 |
|---|---|---|
| 精算师 | **已签（事后复核）** | 有条件通过，见 §0.5 |
| 市场 | **留空** | 仓库无市场 / 调研角色（mainline F-01 属 S2，未开工）。**用户 2026-10-26 裁定：先空着**，S2 角色落地后补签 |
| 产品经理 | **留空** | 仓库无产品经理卡（mainline F-03，S2 未开工）；`reviewer-product` 是评委不是作者。同上，留空 |
| 用户 | **已签（2026-10-26）** | 依据用户原话「先空着 就说是我通过了」 |

> **用户签字记录（2026-10-26）**：覆盖范围 = §0 四栏状态（精算师已签、市场 / 产品经理留空、用户已签）。这是 **§0 的签字，不是段① 的出口签字**——① 的出口仍需议会 #1 结论与 `gate-record.md` 的 ① 行（议会 #1 第 1 轮结论 = 打回修订，尚未闭口）。
> **留空两栏的引用限制**（防误读）：市场 / 产品经理两栏留空属用户明示的例外，后续材料写到这两栏必须原样写「留空，待 S2 角色补签」；补签条件 = mainline S2 落地。V-11 的机械判据对此句做**排除式**处理（见 §9 V-11）。

**授权边界（三态，读者只看本节即可答「今天能做什么」）** `[已决·代裁 C-09]`

| 层 | 今天允许 | 判据 |
|---|---|---|
| 读 | 全部文档、草稿区、探索稿可读 | — |
| 改文档 | 本 PRD 可按议会结论修订；`docs/superpowers/specs/` 尚未开写 | 段① 出口未签 → 不得进 plan（R1） |
| 改代码 | **禁止**：S1–S4 均未开始；草稿区只读、不得再增内容 | §8 状态列 |

### 0.1 三档标记与编号空间

| 标记 | 含义 | 本文中的义务 |
|---|---|---|
| `[已确认]` | 用户当场说过，**每处必须能在 §0.2 指到 A-x** | 不得改口径；要改必须回本节重签 |
| `[已决·代裁]` | AI 下结论，**每处必须能在 §0.6 指到 C-xx 或 §7 指到 D-xx** | 用户可逐条划；划掉即改 |
| `[待确认]` | 只有倾向，没有依据 | 定稿前必须收敛为前两档之一 |
| `[FZ]` | 未取证，只作线索 | 不得当事实引用 |

**编号空间（防跨 PRD 同名）** `[已决·代裁 C-10]`

| 前缀 | 只指 | 引用他文档时 |
|---|---|---|
| `F-` `S` `V-` `D-` `A-` `C-` | **本文**（本 PRD） | 必须写成 `mainline F-01` / `docs/prd/<路径>:行号`，不得裸写 |
| `M-` `P-` | 本文 §9 的上线后度量 / 产品级验收 | 同上 |

### 0.2 已确认（用户裁定）

| # | 裁决 | 出处 |
|---|---|---|
| A-1 | 合并语义用**同编号覆盖**，不用 `sameAs`：同层同 id 报错、跨层同 id 覆盖、覆盖必须带 `reason`、merge 输出 `overrides[]` 供追责 | 探索稿 §3.3（2026-10-26） |
| A-2 | 卡面「一定会 / 禁止」替代原「共享特质」标签；动作必须带宾语，禁无名指代 | 探索稿 §4.7 / §12.6 |
| A-3 | README **每席一份 + 自动 index** | 探索稿 §12.8 D5 |
| A-4 | 迁移路线：**先试点侦探席**，出对照稿后再铺其余席 | 探索稿 §12.8 D8 |
| A-5 | 程序席称谓：议会内（S3 前）「议长 / 主持人」可并用，同一张卡不得混用；S3 后移除「主持人」；议会外一律「主 agent」 | 探索稿 §12.9 D11 |
| A-6 | 产物**结构化优先**：json 为权威、markdown 只是渲染视图 | 用户「按这个方案改」（2026-10-26） |
| A-7 | 本 PRD 范围 = **卡契约化 + 产物校验门禁**（两个功能块一份 PRD） | 用户 2026-10-26 选项确认 |
| A-8 | 产物校验的强制度 = **归档目录强制**：进 `docs/superpowers/reviews/` 的产物必须过校验且被 git 跟踪；审查过程（`.session/`）只校验不追 | 用户 2026-10-26 选项确认 |
| A-9 | **本 PRD 优先级高于 `dev-workflow-mainline`**：`tools/docgen` 模型改造与「全席重生成」归本 PRD；mainline 需重新优化（让出该功能点，按 R5 回它自己的 §0 重签） | 用户 2026-10-26 选项确认 → 细则见 §7 D-08 |
| A-10 | 市场栏与产品经理栏**不代拟**；两栏**留空**，§0 以**用户签字通过**（2026-10-26），S2 角色落地后补签 | 用户 2026-10-26 选项确认 + 追加原话「先空着 就说是我通过了」→ 见 §0.0 |

> **A-6 的覆盖范围**：A-6 只覆盖 §4（产物合同）与 §5（门禁）的**实施方案**；§3 的模型口径是代裁（C-01～C-03、D-01、D-04～D-06、D-09），不因 A-6 变成用户已确认。

### 0.3 事实基线（修正版，全部可复算）

| 事实 | 数值 | 取数方式 / 出处 |
|---|---|---|
| 需改造的席位卡 | 15 张 / 731 行 / 300 表格行 | `(Get-ChildItem agents\*.md \| Measure-Object).Count` → 15；`(Get-Content agents\*.md \| Measure-Object -Line).Lines` → 731；`Select-String -Path agents\*.md -Pattern '^[|]' \| Measure-Object` → 300 |
| 同义 / 同句副本 | **67 处**（4 条句子 × 14 份 + 11 处重复格式） | 探索稿 §1.2 |
| 副本第二口径（待核） | 探索稿 §8 的验收写「55 处归零」 | 探索稿 `:236`。**两数差 12 的来源未取证 `[FZ]`**；定稿前由 S4 spec 用一条扫描命令给出唯一口径（V-4 / V-8） |
| 形态对照实验 | **三轮**合计 **233/240**（160/160 + 40/40 + 33/40）；第一轮四种形态无差异 | 探索稿 §11（`:268` / `:287` / `:293`）。源记录编号为第一 / 第三 / 第四轮，**第二轮无可计分结果** |
| 显式矛盾检测 | **40/40** | 探索稿 §11 第三轮（`:287`） |
| 隐式指代型矛盾 | **17/24**（6 张隐式卡合计）；最坏单例 C01 **0/4** | 探索稿 §11 第四轮（`:295-304`） |
| 文本校验器抗攻击 | 9 条对抗用例 **8 条被绕过** | 探索稿 §14.1（`:666`） |
| 结构化校验器抗攻击 | 原 9 条攻击在结构上不可表达；实测 **0 条通过**（源记录另一处写「0/10」，第 10 例未登记；**分母已于 2026-10-27 ② 段裁定 = 30 条登记向量，历史 9 / 10 条不进结构化分母**，唯一取数源 `ATTACK_VECTORS.length`，登记见 S2 testcase §0.3-2） | 探索稿 §14.1（`:668`）；`docs/superpowers/specs/2026-10-27-s2-observation-check-design-testcase.md:56` |
| 校验实现测试 | **71/71 绿**（**必须在仓库根执行**） | `cd d:\Seed\retro-skills; node --test 'C:\Users\HuangChunhua\.retro-skills\observation-check-draft\*.test.mjs'` → 71/71。同命令在草稿目录执行得 **61/71**（10 条依赖仓库文件的用例假红） |
| 草稿完整性锚 | 11 文件 / 888 行；**sha256 尚未登记 `[FZ]`** | S2 迁入前必须登记（见 §8 S2 出口判据） |
| 模型级缺口 | 4 个缺口 + 2 个口子；`senior-sdet` 现设计下**表达不出来** | 探索稿 §12.10 |

> **正文纠错（2026-10-26，精算师 Q-A-01 + 议会 #1 AU-1-05）**：本文曾把 `233/240` 写成「四轮合计」、把「C01 单例 0/4」写成整类「0/4」——都是拿最好的那一轮当总数。已按源记录改正。**「为什么必须结构化」的主证据是 §14.1 的 8/9 → 0，不是形态实验。**

> 校验实现目前在**仓库外**的用户级草稿区 `C:\Users\HuangChunhua\.retro-skills\observation-check-draft\`（迁出原因：`npm run check` ⑤ 段要求 `.session/tmp/` 为空，而未定稿的代码又不能进 `tools/`）。它不在版本库里，靠 S2 收进来才成为仓库成果；S2 的首个提交必须**原样迁入 + 跑 71/71**，并在同一提交记 11 个文件的 sha256（见 §8）。

### 0.4 成本与收益基线（实测，2026-10-26）

| 项 | 实测 | 取数命令（照抄可跑，cwd = 仓库根） |
|---|---|---|
| 席位卡体量 | 15 张 / **731 行** / **300 行**表格行 | `(Get-ChildItem agents\*.md \| Measure-Object).Count`；`(Get-Content agents\*.md \| Measure-Object -Line).Lines`；`Select-String -Path agents\*.md -Pattern '^[|]' \| Measure-Object` |
| docgen 侧 agent 存量 | **559 行**（`agentData` 294 + `validateAgentData` 144 + `renderAgent` 46 + `agent.md.tpl` 24 + `agent-handwritten.md.tpl` 51） | `$n='agentData.mjs','validateAgentData.mjs','renderAgent.mjs','agent.md.tpl','agent-handwritten.md.tpl'; Get-ChildItem tools\docgen -Recurse -File \| Where-Object { $n -contains $_.Name } \| ForEach-Object { (Get-Content $_.FullName \| Measure-Object -Line).Lines }` |
| 数据样例 | **15 份** `*.evidence.json` | `Get-ChildItem tools\docgen -Recurse -Filter *.evidence.json \| Measure-Object` |
| 受牵连测试 | **15 个**测试文件引用 agent 数据（`tools/docgen/test` 一层） | `Select-String -Path tools\docgen\test\*.mjs -Pattern 'agentData','renderAgent','validateAgentData' -List \| Measure-Object`（用**多 pattern 数组**，避免在表格里写竖线；写成 `'a\|b'` 时 .NET 正则会把它当字面竖线，恒返回 0） |
| S2 已付成本 | **888 行 / 11 文件 / 71 测试** | `(Get-Content C:\Users\HuangChunhua\.retro-skills\observation-check-draft\*.mjs \| Measure-Object -Line).Lines` |
| 门禁边际耗时 | 全量 `npm run check` **23.9 s / 736 条**（734 pass + 2 skip）；新增 71 条 **0.105 s**（单机瞬时值，不作一致性判据） | `npm run check` 输出的 `# duration_ms`；`node --test <草稿>\*.test.mjs` |
| 双实例判定成本 | `check:'ai'` 条目双实例独立判 → 成本 **×2（未实测 `[FZ]`）** | 由 D-07 的出数门槛量 |
| **收益基线** | 符合本约定的产物 **0 件**（全仓 `observation-r*` 命中 0） | `Get-ChildItem -Recurse -File -Filter 'observation-r*' docs,.session \| Measure-Object` |

> 收益基线为 0 是事实，不是缺陷描述：门禁上线当天会走「0 件，跳过」分支。要让收益可观测，必须有 §9 的 M 组度量 + §2 的**义务产出**条款。

### 0.5 精算师签字（2026-10-26，事后复核）

| 项 | 内容 |
|---|---|
| 结论 | **有条件通过**，不行使否决权 |
| 签字口径 | **事后复核**（PRD 与本 PRD 的 S2 实现都先于本评审完成），不是初判 |
| 依据 | 独立上下文评审，自跑只读取数命令复核 §0.3 / §0.4 全部数字；产出 8 个问题（P0×2 / P1×3 / P2×3） |
| 已闭合 | Q-A-01（数字纠错）、Q-A-02（用户裁定本 PRD 优先）、Q-A-03（§9 M 组 + 收益基线）、Q-A-04（§0.4 成本表 + D-07 出数门槛）、Q-A-05（分母 = 30 条登记向量，S2 testcase §0.3-2；2026-10-27 ② 段签字时闭合）、Q-A-06（顺序改 S2→S3→S1→S4）、Q-A-07（§8 路径）、Q-A-08（§5.2 存量不追溯） |
| **挂起（未闭合）** | **无**——Q-A-05 已于 2026-10-27 ② 段签字时闭合：闭合条件「由 S2 的对抗用例集给出唯一分母」已满足（分母 = 30，唯一取数源 `ATTACK_VECTORS.length`，登记 `docs/superpowers/specs/2026-10-27-s2-observation-check-design-testcase.md:56`），§0.3 的 `[FZ]` 标记同批撤除 |

### 0.6 本轮代裁记录（议会 #1 修订引入，用户可逐条推翻）

| # | 裁决 | 理由 | 推翻条件 |
|---|---|---|---|
| C-01 | **定义层细则的规范性载体 = 本文 §3.8**；探索稿只作实验记录，引用其结论须标 `[FZ]` | `:127`「细则见探索稿」与 V-8「探索稿改指针」互斥；细则无载体则 S1 spec 只能现编（议会 #1 F-R2） | 用户另指定载体 |
| C-02 | `coverage` 语义：`total` = 本轮登记检查项数、`read` = `items` 条数、`skipped` = 未判项 id 清单 | 原字段标 `[已确认]` 却无「数什么」，可自由宣称 4/4（F-E） | 用户改口径 |
| C-03 | 敏感信息两条判据（路径名单 + 内容正则），**不设开关**；正当例外只走版本化 deny-list 的**精确路径** | 泄密不可逆，且开关一旦存在就会在红时被打开（F-H） | 用户裁定放宽 |
| C-04 | 写盘目的地 = **只允许过程目录**（`.session/reviews/<次>/observation-r<N>(-[ab])?.json\|md`）；归档目录只读，归档件**只由 §5.1 迁移动作产生** | 唯一写盘入口不能是任意文件写，也不能直写归档（否则绕开迁移状态机）（SE-2-02 / AU-R2-04） | 用户裁定新增落点 |
| C-05 | 归档迁移状态机 = **move → `git add` → 跑 check → commit**；绿判据 = 索引已跟踪 + 工作树与索引一致 | 原「被跟踪 + 无未提交改动」使迁移永不能以绿收尾（F-B） | 用户另定 |
| C-06 | 卡面**零散文**（`rationale` 只进 README）；完备性判据 = 覆盖本席**全部** checkItem id，不是「全部命中」 | 与探索稿 §12.4 一致；「缺一条 = 不合格」与三态互斥（F-C / F-AI2） | 用户要卡面带说明段 |
| C-07 | 门禁旁路**只允许「校验器自身故障」**，启用须在 commit message 与 `gate-record.md` 留「原因 + 补跑日期」 | 无旁路则一次工具 bug 卡死收尾；有旁路无留痕则等于没有门禁 | 用户否决旁路 |
| C-08 | 存量 15 张角色卡：S1 校验器上线后**只告警不阻断**，豁免到期 = **S4 重生成落地**（事件型） | 新校验器先上、卡后改，否则 15 张角色卡在窗口内不可用（PR-2-05） | 用户要求立即强制 |
| C-09 | 授权边界三态（§0.0）写进文档 | 读者判不出「今天能不能开工」（F-ST） | — |
| C-10 | 本文所有编号只在本文作用域内有效；引用他文档必须带文档前缀 + 全路径 | `:18` 的「F-03，S2」与本文 F-03/S2 同名不同义（F-R） | — |
| C-11 | 卡面数据源落点 = `tools/docgen/components/agentData.mjs`（+ `triggerTable`）；`agents/*.md` 是生成物，S4 首次重生成前允许过渡期手改 | 数据源路径全篇缺失，手改生成物会被静默覆盖（PR-2-03） | 用户另指定数据源 |
| C-12 | 仓外证据一律「快照进 `reviews/<那次>/attachments/` 后引用仓内副本」；不得加额外 root / 绝对路径 / skip 开关 | 证据七道锁仓内，而本 PRD 自身核心证据在仓外（F-W） | 用户裁定放宽 |
| C-13 | `LANDING_VARS` 为**封闭清单**（`review.dir` / `round.no`），新增须同批改 §3.8 该行 | 原写「等」= 开放集，`UnboundLanding` 无从判（AI-2-01 残余） | 用户裁定扩表 |
| C-14 | 归档门禁按「扫描根 = `docs/superpowers/reviews/*/`，一子目录 = 一轮评审」做**三态判定**（有产物 / 存量白名单 / 缺产物） | `ArtifactMissing`、零产物绿、`UnclassifiedArtifact` 三条原互斥，存量现状即触发（QA-R2-02） | 用户另定扫描根 |
| C-15 | §5.2「允许文件名类」补 `<次>/attachments/` 子层（仅一层文件名、不得再嵌套），与 C-12 / §4.3 的仓外证据通道对齐 | 原 §5.2 只列根层与 `cards/`，照 C-12 归档的快照必被判 `UnclassifiedArtifact`——**通道开着、门却锁着**（S2 施工期发现，2026-10-27） | 用户裁定不允许仓外证据入仓 |
| C-16 | §4.2 ① 第 5 条 `skipped ⊆ registeredIds` 按**集合语义**判：`skipped` 内 id 不得重复（重复 → `CoverageMismatch`） | 重复项让 `read + skipped.length === total` 算术「看起来平」，实际有 id 既未判也未跳 → 静默通过（S2 施工期发现，2026-10-27） | 用户裁定 `skipped` 允许重复 |

---

## 1 要解决什么

| # | 病 | 具体表现 | 后果 |
|---|---|---|---|
| P-1 | 卡面是散文 | 主观标签（「自省」「客观」）、无名指代、同义重复 67 处 | 同一句规则 14 份副本，改一处漏十三处；AI 无法判定「什么时候做什么」 |
| P-2 | 卡面不可验收 | 没有任何一句能被机器判定是否执行 | 议会只能凭印象判「这席尽责了吗」 |
| P-3 | 产物没有合同 | 观察表只有 markdown，字段靠正则猜 | 9 条对抗 8 条绕过：代码块藏字段、全角竖线、结论换说法都能过 |

**根因（一句话）**：卡和产物都是「散文 + 人读」，不是「数据 + 渲染」。所以无论把模板写得多细，判据永远停在语义层，无法机械核对。

---

## 2 范围

**做**

1. 定义层：场景 / 信号 / 动作五要素 / 检查项两层 / 三态 / 开放项 / 前置 / 落点枚举 / 覆盖语义，及其数据校验器（封闭枚举见 §3.8）。
2. 渲染层：一份数据 → 三个投影（卡面 / README / dump），覆盖记录落 `overrides[]`，全席重生成。
3. 产物合同：json schema + 四段校验链 + 唯一写盘入口 + 最小 CLI（`cli.mjs` / `rewrite`）。
4. 门禁：`npm run check` 增一段，归档目录强制（git 索引状态 + 目录级反向清单）。
5. **义务产出** `[已决·代裁 D-12]`：任何一轮**进入 `docs/superpowers/reviews/` 归档**的评审，必须有 `observation-r<N>.json|md`；不进归档的评审不要求。缺件 → `ArtifactMissing`。

**不做**

- 议会流程改造（独立议长、答辩方子代理、两张矩阵）——归 `dev-workflow-mainline` PRD 的 S3。
- README 之外的对外文档。
- 语义判定（「这条引用是否支持这个结论」）——脚本判不了，落 `check: 'manual'` + 独立抽查。
- 逐席重写卡面个性文案——本 PRD 只统一**结构**，个性化内容仍由各席维护者填（数据源见 §3.7）。
- 自动修复产物内容（会掩盖证据造假）；`rewrite` 只重渲染 md，不改 json。

**不因来源豁免**：子代理、脚本、生成器产出的卡与产物，同样要过 §4 的校验与 §5 的门禁。

---

## 3 核心模型

> 规范性细则在 §3.8；本节定口径与判据来源。

### 3.1 场景与信号 `[已决·代裁 C-01]`

动作的触发不写「每轮」，写三层：`scene`（对象）+ `moment`（时间点）+ `repeat`（频率）。信号五类：事件到达 / 产物出现 / 状态转换 / 命令返回 / 差异命中。**无 merge、无覆盖**。

### 3.2 动作五要素 `[已决·代裁 C-01]`

| 要素 | 判据 |
|---|---|
| 触发 | 引用 §3.1 的场景 id，不写自然语言时间 |
| 宾语 | 必填；禁止「该内容 / 上述 / 相关」这类无名指代（`VagueReferent`） |
| 判据 | 谓词 id（如 `ledger.reflectRow.exists`），不写散文 |
| 落点 | 枚举值，可参数化（变量必须登记） |
| 前置 | `requires` 列表，缺前置仍开工 → `MissingPrerequisite` |

### 3.3 合并：同编号覆盖 `[已确认 A-1]`

同层同 id → 报错；跨层同 id → 覆盖，必须带 `reason`；无差异（覆盖后与原件相同）→ 报错；merge 输出 `overrides[]`（base 引用 + changed 字段 + reason），供追责，**不进卡面**。`changed` 必须覆盖**全部可覆盖字段**（含 `kind`），集中一个 `OVERRIDABLE_FIELDS` 常量，禁止逐个手写字段名。

### 3.4 检查项两层 `[已决·代裁 C-01]`

`CATEGORIES`（key + 客观 label）→ `CHECK_ITEMS`（`subject` + `criterion` + `check: 'script'|'ai'|'manual'`）。
判据写法：**「或」拆条、「且」留条**（JSON Logic 表达式）；词表进数组物料，阈值进 `params`。

`check:'ai'` 的条目必须同时给三样，缺一 `AmbiguousCriterion` / `MissingAiAudit`：

| 项 | 判据 |
|---|---|
| `rubric` | 三组边界 `{positive:[…], negative:[…], boundary:[…]}`，每组 ≥1 条，且每条可回指原文 |
| `evidence` | `evidenceRequired: true` |
| `audit` | `{sample:'每轮每条 ai 条目 ≥1 条', command:'<可跑命令>'}`；**不设比例，只设下限：每轮每条 ≥1** |

`rubric` / `criterion` 命中未定义词表（`policy/criterion-terms.json`，起步 6 词：处置 / 依据 / 充分 / 合理 / 及时 / 适当）而无 `definitions` → `AmbiguousCriterion`。
`check:'ai'` 条目**双实例独立判**：两份 verdict 不一致 → 不取多数、不许任一方改判，落一条 `DisagreementOpen` 到 `open`，并把该条目打回改口径。

### 3.5 三态、`subject` 与完备性 `[已决·代裁 C-01 / C-06]`

命中（对象存在且满足）/ 未命中（对象存在但不满足）/ 不适用（对象不存在或类型不匹配）。
对象类型与 `subject` 不符 → **只能判不适用**；判命中或未命中 → `SubjectMismatch`。

**完备性判据**：`items.id ∪ coverage.skipped = registeredIds`（100%）且两者**不相交**——「覆盖」是每条都给过三态或明确未判，**不是「全部命中」**。`must` 动作每轮必须给三态之一；`na` 必带 `reason`，计入 `coverage.read`（已判），**不进 `skipped`**；`na` 连续两轮不减须在 `open` 给理由。
卡面 / 正文出现「缺一条 / 全部 / 共 N 条」这类完整性或数量断言 → `HardcodedCount`（数量必须由数据派生）。

### 3.6 开放项 `openItem` `[已决·代裁 C-01]`

基类（五列 + 证据必带 + 不许重复固定项）+ 派生 `scope`；数量不固定，**0 条合法但须给可核理由**（`EmptyOpenWithoutReason` / `WeakReason`）。
`WeakReason` 判法：理由未引用固定项 id 或文档事实。**它是 `check:'manual'` 条目，不是脚本码**——写进 §4.4 的模型层时须标 `manual`，避免「语义判断被列成脚本码」。
「0 条」**不作为验收目标**——改为「每条补充项必须可回指原文」（探索稿 §13 第三批结论）。

### 3.7 一份数据 → 三投影 `[已确认 A-6]` + 卡面契约 `[已决·代裁 C-06]`

| 投影 | 读者 | 形态 | 硬约束 |
|---|---|---|---|
| 卡面 | AI | 短句 + 判据 id | 自足：**零散文**；出现「见 / 详见 / 参考 / 按 §X」→ `PointerToElsewhere`；散文只进 `rationale` 字段 → README |
| README | 人 | 表格 + 理由 | 每席一份 + 自动 index；`rationale` 必填（`MissingRationale`） |
| dump | 开发 | 合并后全量 JSON | **stdout-only，不落盘、不进门禁**；覆盖记录靠 README 覆盖表追责 |

**卡面段清单 × 必渲染字段**（front matter + 6 段，取代原「9 段」）：

| 段 | 数据来源 | 必渲染 |
|---|---|---|
| front matter | `name` / `description`（只写触发条件）/ `tools` | 三字段齐全 |
| 职责 | `duty`（trigger + objects + action + constraint） | 一句话职责 |
| 一定会 | `must` 动作 | 每条含 trigger（scene id + moment）/ objects / criterion id / landing（**枚举字面值 + 变量名，不渲染运行时值**）/ requires / **三值字面量 hit / miss / na 与 reason 字段名各一行**（不得写节号指针） |
| 禁止 | `never` 动作 | 每条含宾语与判据 id |
| 冲突裁决 | 优先级规则（用户 > 规则 > 本席） | 采纳 / 不采纳 + 认输判据 |
| 本席清单 | `CHECK_ITEMS`（类别 + 条目表） | 类别 label + 条目 id + `criterion` 文字 + `check` 类型 |
| 边界 | 权限物料 | 只写 / 禁写两类清单 |

> **单源**：本表的字段清单与 §9.2 P-B 的扫描判据同源于 `tools/docgen/policy/card-must-fields.json`（S4 建）——两处不得各写一份，改字段只改该文件与本节行数。

**数据源落点** `[已决·代裁 C-11]`：15 席的数据在 `tools/docgen/components/agentData.mjs`（+ `triggerTable`）；`agents/*.md` 是**生成物**。手改 `agents/*.md` 会在下次重生成时被静默覆盖——S4 落地前允许过渡期手改（截止 = S4 首次重生成）；S4 落地后手改由 `node tools/docgen/cli.mjs gate` 报红。

### 3.8 定义层封闭枚举与字段形状（新增，规范性）`[已决·代裁 C-01]`

> 本节是 F-01～F-08 的**唯一权威载体**；探索稿 §3 / §12 只作实验记录，引用其结论须标 `[FZ]`。

| 项 | 封闭取值 / 形状 | 判据 |
|---|---|---|
| `scene` | 会话 / 议会轮 / 问题卡 / 答辩 / 交付物 / 命令 / 交接 / 判据口径（8 个共用）+ 席位局部 | 同 id 双处 → `DuplicateScene`；被第 2 席引用须上移 → `ScenePromotionRequired`；零引用 → `UnusedScene`；新增无 `why` → `MissingSceneRationale` |
| `moment` | 开始 / 结束 / 之前 / 之后 / 发生时 / 失败时 / 收到时 / 变更时（8） | 一行写两个时刻 → `MultiMomentInOneEntry` |
| `repeat` | `once` / `per-round` / `per-item` / `per-change`（4） | 进独立字段，**不进 label** |
| `signal` | 事件到达 / 产物出现 / 状态转换 / 命令返回 / 差异命中（5） | 每条须有 `observer` + `match`，缺 → `MissingSignal`；`check:'manual'` 须写宣告者 → `UnobservableSignal`；为单个场景新造类别 → `SignalProliferation`；类别非法 → `UnknownSignalType` |
| `openItem` 五列 | `category` / `object` / `evidence`（`path:line` 或命令输出首行）/ `impact` / `suggestion`；派生 `scope` | 缺列 → `MissingOpenField`；超出 `scope` → `OutOfScopeOpenItem`；与固定项重复 → `DuplicateAsOpen` |
| `requires` 元素 | `{ id, kind: 'artifact'\|'fact', must: true\|false }` | 缺 `must:true` 仍开工 → `MissingPrerequisite`，固定句式「缺 X，未开始」 |
| `landing` 变量 | 登记在 `LANDING_VARS` **封闭清单**（`review.dir` / `round.no`） | 表外变量或任意拼接 → `UnboundLanding`；渲染时未赋值 → `UnboundLanding` |
| 检查项硬规则（4） | 数量派生 / label 客观 / label 有主语 / 主语不同不共用 | 见下方「硬规则可执行判据」表 |
| 判据配套（4） | JSON Logic 表达式 / 词表进数组物料 / 阈值进 `params` / 渲染嵌套 ≤1 层 | 见下方「硬规则可执行判据」表 |
| 枚举值形态 | 枚举值不得出现 `/` 分隔的多条件串或自由定义文本 | `FreeTextEnum` |
| `scene` 条目 | `{ id, label, why }` | 缺 `why` → `MissingSceneRationale` |
| `trigger` | `{ scene, moment, repeat }` 三键齐 | 缺任一键 → `MissingSignal`；取值必须命中上表封闭枚举 |
| 动作条目 | `{ id, kind: 'must'\|'never', trigger, objects[], criterion, landing, requires[] }` | 缺 `objects` → `VagueReferent`；缺 `criterion` → `MissingCriterionImpl`；缺 `landing` → `UnboundLanding` |
| `rubric` 条目 | `{ text, source: 'path:line' }` | 缺 `source` → `AmbiguousCriterion` |
| `audit` 记录 | `{ itemId, command, resultPath, line }` | 本轮 `ai` 条目无记录 → `MissingAiAudit` |
| `LANDING_VARS` | **封闭清单**：`review.dir` / `round.no` | 表外变量 → `UnboundLanding`；新增须同批改本行 `[已决·代裁 C-13]` |

**硬规则可执行判据（每条都能一句判死）**

| 码 | 判据 |
|---|---|
| `SubjectiveLabel` | label 命中 `tools/docgen/policy/subjective-terms.json`（起步词：自省 / 客观 / 诚实 / 宽松 / 严格） |
| `MissingSubject` | 条目无 `subject`，或 label 不是「subject + 谓词」派生 |
| `DuplicateCheckItem` | 同一 `subject + criterion` 出现两次 |
| `CrossSubjectSharedItem` | 同一 checkItem id 被两个不同 `subject` 引用（即「主语不同不许共用」） |
| `InlineTermList` | `criterion` 文本内出现枚举词表（≥3 个同类词并列），未放进 `policy/*.json` 数组物料 |
| `InlineThreshold` | `criterion` 文本内出现数字阈值（K / 次数 / 字数），未放进 `params` |
| `UnreadableExpression` | 表达式不是 JSON Logic（含 `&&`、`||` 或自由文本） |
| `NestingTooDeep` | 表达式 AST 深度 > 1 |
| `MissingCriterionImpl` | `criterion` 无脚本实现且未标 `check:'manual'` |
| `FalseScriptCheck` | `check:'script'` 但既无 `cmd` 也无谓词实现 |
| `ProceduralWordOutsideParliament` | 非议会席卡出现「收卡 / 丢卡 / 压卡 / 点名 / 判结束」 |
| `MixedTermInCard` | 同一张卡同时出现「议长」与「主持人」 |

---

## 4 产物合同

### 4.1 schema `[已确认 A-6]` + `[已决·代裁 C-02]`

```js
{
  round: 3,
  instance: 'A' | 'B' | null,     // 仅 check:'ai' 条目双实例判定时出现；单实例为 null
  subject: 'reviewer-detective.card'|'artifact.observation'|…,      // 本轮对象类型（枚举）
  items: [{ id: 'k01', objectType?: '<缺省沿用 subject>',
            verdict: 'hit'|'miss'|'na',
            evidence: { path, line, quote },   // hit 必带
            reason }],                          // miss / na 必带
  open:  [{ category, object, evidence, impact, suggestion, scope }],
  coverage: { read: 4, total: 15, skipped: ['k05','k06','k07','k08','k09','k10','k11','k12','k13','k14','k15'] },
             // read = items.length（含 na）；total = registeredIds.length；skipped = 未判项 id（不在 items 里）
             // 示例省略 items 明细（应为 4 条：k01–k04）
  audits: [{ itemId, command, resultPath, line }],   // check:'ai' 的抽查记录（每轮每条 ≥1，§3.4）
  closure: null | 'no-findings' | 'blocked'
}
```

- `hit` 必带 `evidence`；`miss` / `na` 必带 `reason`；
- `open` 非空时 `closure` 不得为 `no-findings`（`ContradictoryClosure`，结构对账，不依赖词表）；
- 产物 schema 必须有校验器，否则 `UnverifiableOutput`；
- `registeredIds`（本轮登记检查项 id 清单）是**必填入参**，缺失 → `UnregisteredIdsMissing`；它是唯一来源（S2 期放单一常量文件，S1 落地后由 `Object.keys(CHECK_ITEMS)` 派生）。

### 4.2 校验链四段 `[已确认 A-6]`

| 段 | 做什么 | 不过时 |
|---|---|---|
| ① 结构 | 类型 / 必填 / 枚举 / `closure` 与 `open` 对账 + **七条覆盖对账**：`items.id` 唯一、`items.id ⊆ registeredIds`、`items.length === coverage.read`、`read + skipped.length === total`、`skipped ⊆ registeredIds`（**集合语义**：其中 id 不得重复，重复 → `CoverageMismatch`，C-16）、`items.id ∩ skipped = ∅`、`total === registeredIds.length` | 逐条报错，不继续比渲染（避免级联噪声） |
| ② 证据可解析 | 路径白名单 → 存在 → 可读 → 行号 → 该行含 quote → quote 足够长 → **不敏感**（路径名单 + 内容正则） | 逐条报错 |
| ③ 渲染一致 | `mdPath` **必填**；md 必须逐行等于 `renderObservation(doc)`；**渲染最小信息集**：每个 `hit` 行必须含 `path:line`，每个 `open` 行必须含 evidence；单元格内 ASCII 竖线必须转义（口径与 `tools/execution-matrix/markdown-rows.mjs` **共用单源**），并断言**转义后每行列数 = 表头列数**（用同一 `splitRow` 复算） | `RenderMismatch` + 首个差异行号；缺 md → `MdMissing`（**缺省不得跳过**） |
| ④ 写盘 | 前三段全过才落盘；先全部渲染/序列化到内存 → 各写 tmp → 全成功再逐个 rename → 任一失败清 tmp 并返回 `{ok:false,wrote:false,errors}` | **一个字都不写**；失败码 `WriteFailed` / `InvalidWriteTarget` |

**异常纪律**：校验器对任何 IO / 解析异常必须收敛为结构化错误码（`EvidenceUnreadable` / `MdUnreadable` / `WriteFailed`），**不得冒泡**——冒泡会以堆栈中止整段 `check`，把后面的 markdown 与 `.session` 闸门一起丢掉。

### 4.3 证据七道 `[已确认 A-6]` + `[已决·代裁 C-03]`

1. `path` 必须是**相对路径**（绝对 / 盘符相对 / UNC → `EvidencePathAbsolute`）；反斜杠作分隔符按 `/` 归一（Windows 写法的正当输入，不得判死）。
2. 解析根**唯一来源 = 仓库根**（`git rev-parse --show-toplevel`），**不接受传参**；解析后（含软链 realpath）必须落在根内（`EvidencePathOutside`）；根取不到 → fail-closed（`RepoRootUnresolved`）。
3. 文件可读（指向目录等 → `EvidenceUnreadable`，不得抛异常打崩校验器）。
4. `line` 在文件行数内且该行包含 `quote`（空白归一后比较）。
5. `quote` 长度二选一：归一化后 **≥10 字**，或 **≥4 字且占该行内容 50% 以上**（`EvidenceQuoteTooShort`）。字数按**码点**计（`[...s].length`）；**纯结构行**不可作证据（`EvidenceStructuralRow`），四类 = `---`、表格分隔行、围栏行、**渲染器无条件写入且不含数据的固定骨架行**（版本横幅 `<!-- observation-md vN -->`、`# 观察表`、`## 补充项`、`无。`、两张表头；常量单源 = `tools/observation-check/md-format.mjs`）。**第四类 2026-10-27 补登记**：原三形态被实测绕过——`hit` 直接引用本工具自己产出的横幅即四段全绿，证据链闭环于被证明者自身。
6. **敏感路径**（`EvidenceSensitivePath`）：`path` 按 `/`、`\` 拆段，任一段命中 `.env*` / `*.pem` / `*.key` / `*.p12` / `id_rsa*` / `id_ed25519*` / `.npmrc` / `.netrc` / `credentials*` / `*secret*` → 红。
7. **敏感内容**（`EvidenceQuoteSensitive`）：`quote` 命中 `-----BEGIN [A-Z ]*PRIVATE KEY-----` / `AKIA[0-9A-Z]{16}` / `ghp_[A-Za-z0-9]{36}` / `https?://[^/@\s]+:[^/@\s]+@` → 红。

**仓外证据的合规写法** `[已决·代裁 C-12]`：先把原文行段复制进 `docs/superpowers/reviews/<那次>/attachments/<file>`，产物只引用**仓内副本**；README 标「外部快照」。过程期允许 `.session/reviews/<次>/attachments/` 作临时副本，但**归档前必须搬入 docs 侧**（`.session/` 不进 git，归档证据放那里等于没有）。**不得**允许额外 root、绝对路径或 skip 开关。

> 第 5 条为什么不用单一字数下限：真实卡面有一类正当短引用（`# 角色：侦探`，7 字，占该行 13 字的 54%）。单一 ≥10 会把它判死，逼人往引用里塞相邻文字，反而更假。`[已决·代裁]`

### 4.4 错误码

**A 表：已实现（测试状态见下注）**

| 段 | 错误码 |
|---|---|
| 结构 | `InvalidDocument` `InvalidFieldType` `MissingItems` `UnknownItem` `UnknownVerdict` `MissingReason` `MissingOpenField` `MissingCoverage` `InvalidCoverage` `UnknownClosure` `ContradictoryClosure` `UnknownField` |
| 证据 | `EvidencePathAbsolute` `EvidencePathOutside` `EvidenceNotFound` `EvidenceUnreadable` `EvidenceLineOutOfRange` `EvidenceQuoteMismatch` `EvidenceQuoteTooShort` |
| 渲染 | `RenderMismatch` `MdMissing` |
| 渲染·合并 | `MissingTrigger` `MissingCriterion` `MissingLanding` `MissingCriterionImpl` `UnknownLanding` `DuplicateStatement` `OverrideWithoutReason` `PointlessOverride` |
| 入口 | `JsonNotFound` `InvalidJson` |

> A 表 5 个结构码 `InvalidDocument` `MissingItems` `MissingOpenField` `MissingReason` `UnknownClosure` 原为「有实现但零测试」，S2 出口判据（见 §8）要求补测；已于 2026-10-27 由 S2 施工批次补测（`tools/observation-check/checks.test.mjs:87-99`）。

> A 表 `渲染·合并` 行的 8 个码 `MissingTrigger` `MissingCriterion` `MissingLanding` `MissingCriterionImpl` `UnknownLanding` `DuplicateStatement` `OverrideWithoutReason` `PointlessOverride` 已由同批次落冒烟测试（`tools/observation-check/render.test.mjs:10-30`）。

**B 表：本轮新增 / 待实现（每行：码 → 可执行判据）**

| 组 | 错误码 | 判据 |
|---|---|---|
| S2 新增（产物侧） | `CoverageMismatch` `DuplicateItem` `UnregisteredIdsMissing` `RoundMismatch` `InstanceMissing` `MissingEvidence` `WriteFailed` `InvalidWriteTarget` `ArtifactPathOutside` `ArtifactMissing` `UnclassifiedArtifact` | §4.1 / §4.5 / §5.2；`InstanceMissing` = `items` 含 `check:'ai'` 条目却无 `-a`/`-b` 两份；`MissingEvidence` = `hit` 无 `evidence` |
| S2 新增（证据侧） | `EvidenceSensitivePath` `EvidenceQuoteSensitive` `MdUnreadable` | §4.3 第 6/7 道、§4.2 ③ |
| S2 新增（证据侧） | `EvidenceStructuralRow` | §4.3 第 5 道附带判据：被引用的行本身是纯结构行（`---` / 表格分隔行 / 围栏行 / 渲染器固定骨架行，四类见 §4.3 第 5 道）→ 红；与 `EvidenceQuoteTooShort` 分界（结构行可以 ≥10 字） |
| S2 新增（根） | `RepoRootUnresolved` | §4.3 第 2 道：`git rev-parse --show-toplevel` 取不到仓库根 → fail-closed；不得以 `process.cwd()` 或传参兜底 |
| S1 待实现（模型层，**当前零实现**） | `UnverifiableOutput` `FalseScriptCheck` `EmptyOpenWithoutReason` `WeakReason`(manual) `OutOfScopeOpenItem` `DuplicateAsOpen` `MissingPrerequisite` `UnboundLanding` `SubjectMismatch` `AmbiguousCriterion` `MissingAiAudit` `DuplicateCheckItem` `CrossSubjectSharedItem` `InlineTermList` `InlineThreshold` `PointerToElsewhere` `ProceduralWordOutsideParliament` `MixedTermInCard` `HardcodedCount` `VagueReferent` `SubjectiveLabel` `MissingSubject` `UnreadableExpression` `NestingTooDeep` `MultiMomentInOneEntry` `UnknownSignalType` `MissingSignal` `UnobservableSignal` `SignalProliferation` `FreeTextEnum` `DuplicateScene` `UnusedScene` `ScenePromotionRequired` `MissingSceneRationale` `MissingRationale` `DisagreementOpen` | 逐码判据见 §3.4 / §3.5 / §3.6 / §3.8；`DisagreementOpen` = 双实例 verdict 不一致 |
| 门禁（S3） | `UntrackedArtifact` `ArtifactDirty` `ArtifactNamingOff` | §5.2 |

> **口径声明（议会 #1 F-A 处置）**：A 表的「实测」只覆盖 S2 已实现部分；**B 表的 S1 组是「已命名、未实现」**，不得被引用为「已实测」，也不得被当作 S1 已有实现。

### 4.5 写盘唯一入口 `[已确认 A-6]` + `[已决·代裁 C-04]`

产物只能由 `writeObservation(doc, { jsonDir, registeredIds })` 写出（**不再接收任意 `jsonPath`/`mdPath`**）：

- 文件名由 `doc.round` **派生**：`observation-r${doc.round}${instance ? '-' + instance.toLowerCase() : ''}.json|md`；若调用方另行传入路径且该路径匹配 `observation-r(\d+)`，其 N 必须 === `doc.round`，否则 `RoundMismatch`。
- **目的地判据（只允许过程目录）**：realpath 必须①落在 `git rev-parse --show-toplevel` 内；②匹配 `^\.session/reviews/[^/]+/observation-r\d+(-[ab])?\.(json|md)$`；③不在 `.git/**`。否则 `ArtifactPathOutside`，零写盘。**硬编码正则，不留配置项、不留环境变量、不留 skip 开关。**
- 校验不过 → `{ok:false, wrote:false, errors}`，两个文件都不落；通过则 json 与 md 同时写（见 §4.2 ④ 的「全成功再 rename」），md 由 doc 渲染得到，人手不可写。
- **归档目录（`docs/superpowers/reviews/**`）只读**：`writeObservation` 与 `rewrite` 都**不写**归档目录（命中即 `ArtifactPathOutside`）。归档件要改（含 `RenderMismatch` 修复），一律 `rewrite` 写回 `.session/reviews/<同次>/`，再由 §5.1 的迁移状态机搬过去——**归档只能由迁移动作产生，不能由写盘入口直接产生**。

---

## 5 门禁与追责

### 5.1 时点与迁移状态机 `[已确认 A-8]` + `[已决·代裁 C-05]`

| 时点 | 跑什么 |
|---|---|
| 每次 `npm run check` | 扫约定路径产物，逐个跑四段校验 |
| 新增 / 改动产物 | 提交前必须绿 |
| 审查收尾迁移 | 按下面的状态机，四步固定 |

**迁移状态机（move → `git add` → check → commit）**：

| 步 | 动作 | 期望结果 |
|---|---|---|
| 1 | `.session/reviews/<次>/` → `docs/superpowers/reviews/<次>/` 移动 | 此时 check 报 `UntrackedArtifact`（**属预期**，不得据此判定门禁失效） |
| 2 | `git add` 新目录 | — |
| 3 | `npm run check` | **必须绿**：索引已跟踪 `git ls-files --error-unmatch -- <path>` exit 0；工作树与索引一致 `git diff --quiet -- <path>` exit 0 |
| 4 | `git commit` | 绿保持 |

**旁路（仅工具故障）** `[已决·代裁 C-07]`：`CHECK_BYPASS=1` 只允许在校验器自身故障时使用；启用必须在 commit message 与 `gate-record.md` 同一行写「原因 + 补跑日期」，且补跑必须在下一次评审归档前完成。旁路期间 `npm run check` 必须打印 `BYPASS: <原因>` 首行。

### 5.2 强制口径 `[已确认 A-8]`

- **扫描根** = `docs/superpowers/reviews/*/`（**一个子目录 = 一轮评审**）。
- **归档目录三态判定** `[已决·代裁 C-14]`：

| 状态 | 判据 | 结果 |
|---|---|---|
| 有产物 | 子目录内存在 `observation-r<N>(-[ab])?.json\|md` | 逐个跑四段校验 + git 断言：`git ls-files --error-unmatch -- <path>` exit 0（→ `UntrackedArtifact`）、`git diff --quiet -- <path>` exit 0（→ `ArtifactDirty`） |
| 无产物但在存量白名单 | 子目录名命中下方一次性白名单 | 绿（不追溯） |
| 无产物且不在白名单 | 其余 | `ArtifactMissing` 红 |
| 有非产物文件 | 文件既非 `observation-r<N>(-[ab])?.json\|md`，也不在「允许文件名类」或 9 个精确路径白名单内 | `UnclassifiedArtifact` 红（与上三态并列，非替代） |

- **允许文件名类（限 `<次>/` 根层、`<次>/cards/` 子层与 `<次>/attachments/` 子层）**：`progress.md` / `cards.md` / `problems.md` / `submission.md` / `impact-sheet.md` / `detective.md` / `round-check.md` / `delivery-audit.md`——评审账本本身就是归档内容，不得因「不是 observation」被判红。`<次>/attachments/` 子层 `[已决·代裁 C-15]` 只许**一层文件名**（`attachments/<file>`，不得再嵌套），承载 §4.3 C-12 的仓外证据快照；其**文件名不限 8 类**（快照保留原文件名，否则「快照进仓」还要为每条证据改名，通道等于虚设）。
- **存量目录白名单（按目录名，一次性）**：`2026-10-25-1723-s6-eval`。
- **非产物文件白名单（按精确相对路径，一次性）**：`2026-10-25-1723-s6-eval/ab-score.md`、`…/capability-diff.md`、`…/checklist.md`、`…/impact-sheet.md`、`…/rubric.md`、`…/cards/card-01.md`、`…/cards/card-02.md`、`…/cards/card-03.md`、`…/cards/card-04.md`（9 个；取数：`Get-ChildItem docs\superpowers\reviews -Recurse -File` → 9）。白名单**只到精确路径**，新增须同批改本行。
- **审查过程目录**（`.session/reviews/…`）：只做四段校验，不做 git 断言（`.session/` 在 `.gitignore` 里，断言必然假红）。
- **零产物** = 扫描根下**无任何子目录** → 打印「0 件，跳过」并 exit 0；扫描根不存在 / 不可枚举 → 红（`ArtifactNamingOff`），防止「路径写错」被当成「没有产物」。
- **存量不追溯（2026-10-26，精算师 Q-A-08）**：本门禁只覆盖 `observation-r*.json|md`。仓库现有的 **10 份** `round-check.md`（存量口径 = `.session/reviews/**` 下、不含本次评审新建的 1 份；`skills/parliament/assets/round-check.md` 是模板不计）与上表 9 个归档件**不迁移、不改格式**，其处置归议会流程 PRD。取数：`Get-ChildItem .session\reviews -Recurse -File -Filter 'round-check.md' | Measure-Object` → 11（含本次新建）；`… -Filter 'observation-r*'` → 0。
- **15 张角色卡豁免窗口** `[已决·代裁 C-08]`：S1 校验器上线后，对逐个列名的 15 个 `agents/*.md` 只告警不阻断；豁免到期 = **S4 首次重生成落地**（事件型）。到期后必须 0 warning。

**最小化约束（四条，防修法放大权限）** `[已决·代裁 C-03/C-04]`：

| 禁止的走偏 | 为什么 | 替代 |
|---|---|---|
| 多根 / 目录前缀白名单 | 第三个根总能被加进去 | 单锚 = git 顶层；白名单只到文件级精确正则 |
| `skipSensitive` / `--allow-sensitive` 开关 | 红的时候第一反应就是打开它 | 正当例外只走版本化 deny-list 的精确相对路径 |
| `root` 保持可传参 | 传 `C:\` 即全盘合法 | root 唯一来源 = git 顶层，接口删掉该参数 |
| 归档目录级豁免 | 一个目录级豁免 = 该目录永久免检 | 存量按精确文件名 + 一次性列出 |

### 5.3 边界（说清楚拦不住什么）

| # | 场景 | 能不能拦 | 错误码 / 说明 |
|---|---|---|---|
| 1 | 手写 md 冒充产物 | 能 | `RenderMismatch`（mdPath 必填，缺省不跳过） |
| 2 | 引用指向不存在 / 不匹配 / 过短 | 能 | `EvidenceNotFound` / `EvidenceQuoteMismatch` / `EvidenceQuoteTooShort` |
| 3 | 引用出了仓库 | 能 | `EvidencePathOutside`（路径白名单 + 唯一 root） |
| 4 | 引用敏感文件 | 能 | `EvidenceSensitivePath`；**名单外的密钥形态拦不住**（§5.4 R-5） |
| 5 | 引用敏感内容 | 能 | `EvidenceQuoteSensitive`；同上 |
| 6 | 写到约定目录之外 / 覆盖源码 | 能 | `ArtifactPathOutside`（§4.5 目的地正则） |
| 7 | 产物被手改（归档后） | 能 | `ArtifactDirty`（`git diff --quiet` 非 0） |
| 8 | 归档目录里塞非产物文件 | 能 | `UnclassifiedArtifact`（精确路径白名单） |
| 9 | 归档子目录缺产物 | 能 | `ArtifactMissing`（非存量白名单目录） |
| 10 | 归档件未 `git add` | 能 | `UntrackedArtifact`（`git ls-files --error-unmatch` 非 0） |
| 11 | json 与 md **一起**改成一致 | **不能** | 本地无可信锚；靠 git commit 的 diff 让人看见 |
| 12 | 引用是否**支撑**结论 | **不能** | 读语义，脚本无此能力 |
| 13 | 绕过入口直接手写 json | **不能** | 事后无法区分；靠 commit diff + 第 9 条兜住「没有产物」 |

### 5.4 残余风险（已知并接受）

| # | 风险 | 处置 |
|---|---|---|
| R-1 | 过程产物（`.session/`）改动不可追 | 接受；归档时把差异带进 commit |
| R-2 | 合谋改（json + md 同时改一致） | 接受；靠评审看 diff，不靠机器 |
| R-3 | 证据与结论的语义匹配 | `check:'manual'` + 独立方抽查，比例写入 spec；单人维护时自评风险写进 S3 spec |
| R-4 | 开放项「0 条」路径实测样本少 | 已改口径：不作为验收目标，改为「每条可回指原文」 |
| R-5 | 敏感内容名单外的密钥形态 | 接受；名单可增长（版本化），误判走精确路径 deny-list |
| R-6 | 旁路被滥用 | 留痕 + 补跑期限；审计每轮核 `BYPASS:` 行 |
| R-7 | 渲染器升级使历史产物全部 `RenderMismatch` | md 首行由渲染器写 `<!-- observation-md v1 -->`；升级必须同批重生成全部归档 md 并在同一 commit |

---

## 6 功能点清单

> 本表是本文的功能点权威清单；ID 变更需重签本节。

| ID | 功能点 | 归属 | 来源 |
|---|---|---|---|
| F-01 | 场景 / 信号模型（`scene` + `moment` + `repeat`；五类信号，无 merge） | 定义层 | §3.8 |
| F-02 | 动作五要素（触发 / 宾语 / 判据 id / 落点 / 前置 `requires`） | 定义层 | §3.2 / §3.8 |
| F-03 | 同编号覆盖（同层报错 + `reason` 必填 + 无差异报错 + `overrides[]` 含全字段） | 定义层 | A-1 |
| F-04 | 检查项两层（`CATEGORIES` + `CHECK_ITEMS`，含 `subject` / `criterion` / `check` 三类） | 定义层 | §3.4 / §3.8 |
| F-05 | 检查项三态 + `subject` 类型匹配 + 完备性判据 | 定义层 | §3.5 |
| F-06 | 开放项 `openItem`（基类五列 + 派生 `scope`；0 条须可核理由） | 定义层 | §3.6 / §3.8 |
| F-07 | 判据表达式化（「或」拆条、「且」留条；词表进数组、阈值进 `params`） | 定义层 | §3.8 |
| F-08 | 落点枚举化 + 参数化（`LANDING_VARS`、`UnboundLanding`） | 定义层 | §3.8 |
| F-09 | 卡面零散文 + 自足（`PointerToElsewhere`；`rationale` 只进 README） | 渲染层 | §3.7 |
| F-10 | 一份数据三投影（卡面 / README 每席一份 + 自动 index / dump stdout-only） | 渲染层 | A-3、§3.7 |
| F-11 | 全席重生成（**落地时点的 `agents/*.md` 全集**，当前 15；先侦探试点对照稿，再铺满） | 渲染层 | A-4；取数 `Get-ChildItem agents/*.md \| Measure-Object` |
| F-12 | 称谓口径（议会内过渡期可并用、不得混用；议会外主 agent） | 渲染层 | A-5 |
| F-13 | 产物 schema + 校验器绑定 + `registeredIds` 必填（`UnverifiableOutput` / `UnregisteredIdsMissing`） | 产物 | §4.1 |
| F-14 | 四段校验链（结构 / 证据 / 渲染 / 写盘）+ 覆盖七条对账 + 异常不冒泡 | 产物 | §4.2 |
| F-15 | 证据七道（路径白名单 / 存在 / 可读 / 行号命中 / 最小长度 / 敏感路径 / 敏感内容） | 产物 | §4.3 |
| F-16 | 唯一写盘入口 `writeObservation`（文件名派生 / 目的地正则 / 校验不过零写盘 / 全成功再 rename / md 派生） | 产物 | §4.5 |
| F-17 | 门禁接入 `npm run check`（零产物跳过 + 扫描根不可枚举即红） | 门禁 | §5.1 / §5.2 |
| F-18 | 归档目录强制（git 索引状态 + 目录级反向清单 `UnclassifiedArtifact`） | 门禁 | §5.2 |
| F-19 | 义务产出（进归档的评审必须有 `observation-r<N>`；缺 → `ArtifactMissing`） | 门禁 | §2、§7 D-12 |
| F-20 | 最小 CLI（`node tools/observation-check/cli.mjs <json>` 单件校验；`rewrite` 只重渲染 md） | 产物 | §8 S2 |
| F-21 | 敏感信息两条判据 + 仓外证据快照法 | 产物 | §4.3 |
| F-22 | 迁移状态机 + 工具故障旁路（留痕） | 门禁 | §5.1 |
| F-23 | 卡面数据源落点 + 手改生成物的告警 | 渲染层 | §3.7 |
| F-24 | 存量 15 卡豁免窗口（到期 = S4 首次重生成） | 门禁 | §5.2 |

---

## 7 待确认清单

| ID | 待确认项 | 建议 | 状态 |
|---|---|---|---|
| D-01 | 检查项共用粒度 | 主语相同才共用（`k*` / `s*` 分开），配 `DuplicateCheckItem` | `[已决·代裁]`：分开 |
| D-02 | 产物路径与命名 | 过程 `.session/reviews/<那次>/observation-r<N>.json\|md`；收尾随目录迁 `docs/superpowers/reviews/<同名>/`；文件名由 `doc.round` 派生 | `[已决·代裁]`：不新造目录；`r<N>` 与 `round` 同源并**由代码保证**（§4.5） |
| D-03 | 门禁失败的处置 | 阻断：`check` 非 0，不允许带红送审 | `[已决·代裁]`：阻断；唯一例外是 C-07 旁路 |
| D-04 | 「0 条开放项」是否作验收目标 | 不作目标，改「每条可回指原文」 | `[已决·代裁]` |
| D-05 | 试点期旧卡怎么处理 | 试点期保留旧卡作对照；铺开后删除旧槽位散文，不留双份 | `[已决·代裁]`：不留双份 |
| D-06 | `check:'ai'` 与 `check:'script'` 的比例目标 | 不设比例，只要求每条 `ai` 有 rubric + **每轮每条 ≥1 条 audit** | `[已决·代裁]` |
| D-07 | 15 席一次铺 vs 逐席滚动 | 逐席滚动，且**出数门槛**：试点席完成后用 `git diff --numstat agents/ tools/docgen/` 量单席改动行数 + 工时，×14 + 20% 缓冲 = 剩余工期 | `[已决·代裁]`：数字由实测产生，PRD 不填 |
| D-08 | 与 `dev-workflow-mainline` 的边界 | **已定（2026-10-26 用户裁定）**：本 PRD 优先；`tools/docgen` 模型改造与全席重生成归本 PRD（S1/S4）；mainline S3 只留 `speaker` + `respondent-*` 新卡与两张矩阵，S6 只留权限 / 字符串单源 | `[已确认]`；连带待办 `docs/after/20261026211515-mainline-prd-reoptimize-open-decisions.md` |
| D-09 | `coverage` 语义 | `total` = 登记检查项数、`read` = items 条数、`skipped` = 未判项 id | `[已决·代裁 C-02]`：可对账优先；md 文案改「已判 N 条 / 共 M 条（跳过 K：…）」 |
| D-10 | 工具故障旁路 | 允许，仅限校验器自身故障，留痕 + 补跑期限 | `[已决·代裁 C-07]` |
| D-11 | 卡面散文去哪 | 全部落 `rationale`，只进 README；卡面零散文 | `[已决·代裁 C-06]` |
| D-12 | 义务产出范围 | 进归档的评审必须有 `observation-r<N>`；不进归档不要求 | `[已决·代裁]`；推翻条件 = 用户认为成本过高 |
| D-13 | 存量的 10 份 `round-check.md` / 9 个归档件 | 不迁移、不改格式、按精确名进白名单 | `[已决·代裁]`；处置归议会流程 PRD |

---

## 8 交付拆分（S1–S4）

| 份 | 内容 | 涉及文件 | 依赖 | 状态 |
|---|---|---|---|---|
| **S1** 定义层 | F-01～F-08：数据结构 + 校验器（不渲染） | `tools/docgen/**`（模型与校验）、`tools/docgen/test/*.test.mjs` | 无 | 未开始 |
| **S2** 产物合同 | F-13～F-16、F-20、F-21：把草稿收进 `tools/observation-check/`，**同批**落 §4 的新增判据与最小 CLI；补独立 testcase | `tools/observation-check/**`、`scripts/check-all.mjs`（已用 `**/*.test.mjs` 全仓 glob，**不需**新增 `package.json` 入口） | **硬前置**：`registeredIds` 单源清单（§4.1） | 草稿在仓外，未入库 |
| **S3** 门禁接入 | F-17～F-19、F-22、F-24：`check-all.mjs` 增段、零产物分支、扫描根不可枚举即红、git 索引断言、目录反向清单、迁移状态机与旁路、15 卡豁免窗口 | `scripts/check-all.mjs`、`docs/superpowers/reviews/**` 约定 | S2 | 未开始 |
| **S4** 渲染层 | F-09～F-12、F-23：三投影 + 覆盖记录 + 全席重生成（侦探先行） | `tools/docgen/templates/**`、`agents/*.md`、README 生成物 | S1、S3 | 未开始 |

**执行顺序：S2 → S3 → S1 → S4** `[已决·代裁]`（2026-10-26 精算师 Q-A-06 后改，原为 S1 先行，可推翻）。

理由：① S2 的 888 行已写完且 71 条测试绿，成本已沉没，先收进 git 才有价值；② 「门禁先立」只支持 **S2/S3 早于 S4**，不支持 S1 早于 S2/S3；③ S1 是成本最大且唯一没有改造实测数的一份（§0.4 只量到存量体量）；④ S2 对 S1 只是**软依赖**这一说法已撤销——`registeredIds` 必填使 S2 事实上需要一份 id 单源清单（可先用单一常量文件，S1 落地后改为 `Object.keys(CHECK_ITEMS)`）。

**S2 出口判据（不是「71/71 绿」）**：

| 判据 | 可核方式 |
|---|---|
| 原样迁入 | 首个提交 diff 只有新增文件；同一提交含 11 个文件的 sha256 清单 |
| 基线不退 | `cd tools/observation-check; node --test *.test.mjs` 全绿；**且测试对 `agents/` 的引用数 = 0**（`Select-String -Path tools\observation-check\*.test.mjs -Pattern 'agents[/\\]'` → 0）；证据夹具一律 `mkdtempSync` 自建（删掉 `agents/detective-observer.md` 后仍全绿） |
| 新增判据有测试 | §4.4 B 表 S2 组的每个码 ≥1 条反例；A 表 5 个零测试码补齐；另补三类不出码的必要用例：`skipped` 非空正例、`read > total` 反例、**含 ASCII `\|` 的字段渲染后列数 = 表头列数** |
| golden 基线 | `observation-r3.json` + `observation-r3.expected.md`（人工写），断言 `renderObservation` 全文等于期望文件 |
| 覆盖语义 | **7 处 fixture + 1 处探索稿指针**一次性重写（5 处 `coverage` 夹具 + 草稿 `checks.test.mjs` 的覆盖度文本断言 + 草稿 `render-check.test.mjs` 的 replace 目标 = 7 处 fixture；外加探索稿 `:686` 的 schema 片段改为指针，与 V-8 同批），**禁止放宽断言** |
| CLI 可用 | `node tools/observation-check/cli.mjs <json>` 能单件校验；`rewrite` 能只重渲染 md |
| 仓门禁不红 | 归档一件合法产物后 `npm run check` 仍绿 |

**最小闭环**：若只想止血，做 **S2 + S3**（合计约 1 份 spec + 1 份 testcase + 一段门禁 + 一个最小 CLI）。S1 + S4 是第二段，按 D-07 出的单席实测成本再决策。

**F → S 覆盖表**

| F | S | 备注 |
|---|---|---|
| F-01～F-08 | S1 | 定义层一次做齐；判据 id 是后三份的共用词汇表 |
| F-09～F-12、F-23 | S4 | 渲染层；F-11 需 S3 的门禁做逐批验收 |
| F-13～F-16、F-20、F-21 | S2 | 产物合同 + 最小 CLI + 证据新增判据 |
| F-17～F-19、F-22、F-24 | S3 | 门禁；零产物 / 不可枚举 / 反向清单 / 旁路必须有测试 |

**每份的规矩**：同批由 `senior-sdet` 在全新上下文产出 testcase，spec 只写「测什么 / 为什么」并外链用例文件；缺 testcase 不得送议会、不得进 plan。无子代理环境时只能出草稿并在文件头标「降级模式（角色卡内联）」，不得定稿。

---

## 9 验收

### 9.1 本文档自身（V 组）

| # | 验收项 | 判据 | 验证方式 |
|---|---|---|---|
| V-1 | 三档标记齐全且**出处可核** | 每条结论有标记；每个 `[已确认]` 能在 §0.2 指到 A-x，每个 `[已决·代裁]` 能指到 C-xx 或 D-xx；**作为结论标记的 `[待确认]` = 0**（只允许出现在文首图例、§0.1 定义行、V-1 本行三处） | auto：`Select-String -Pattern '\[已确认\]','\[已决·代裁\]'` 逐处对 §0.2 / §0.6 / §7（多 pattern 数组）；`Select-String -Pattern '\[待确认\]'` 命中数 = 3 |
| V-2 | 待确认可逐条划 | §7 每个 D 都有建议与状态 | manual：用户逐条划 |
| V-3 | 功能点有落点 | §8 F→S 表覆盖 F-01～F-24，无空格 | auto：`Select-String -Pattern '^[|] F-\d+ [|]'` 计数 = 24（该 pattern 不含 §8 的 `\| F-01～F-08 \|` 范围行），且与覆盖表一一对应 |
| V-4 | 数字可复算 | §0.3 / §0.4 每个数字带取数方式**且带 cwd**；不得引用未标注来源的数字 | auto：逐行照抄命令复算，计数类逐字一致 |
| V-5 | 范围与用户裁定一致 | §2「做 / 不做」逐条能对上 A-7 / A-8；新增第 5 条对 D-12 | manual |
| V-6 | 门禁能真红 | **§5.3 第 1–10 行各 1 条红例**（错误码逐行见该表）+ **4 条绿例**：第 11 行（json+md 同改）、第 12 行（语义不支撑）、零产物（扫描根无子目录）、存量白名单目录 | auto：S2/S3 testcase 逐条构造，断言码逐字相等 |
| V-7 | 残余风险有处置 | §5.4 七条各有处置，且处置可执行 | manual |
| V-8 | 探索稿与 PRD 不并存两说 | 结论只在 §3.8 / §4 一处；定稿动作 = 把探索稿 `:236`（55 处）、`:394`（四轮实测）、`:400-401`（散文口径）、`:746`（git 断言）四处改为指向本文的指针 | manual + `Select-String` 对照 |
| V-9（上线后度量，见 §9.3） | 收益可核 | 见 §9.3 M-1～M-4 | auto + manual |
| V-10 | 成本可复算 | §0.4 计数 / 行数 / 文件数类**逐字一致**；墙钟类只录环境与量级（同机 ±30%），不作一致性判据 | auto |
| V-11 | §0 状态与四栏一致 | §0.0 状态句与四栏一致；正文**不得出现**「市场已评审」「产品已评审」——**本行与 §0.0 引用句不计** | auto：`Select-String -Pattern '市场已评审','产品已评审'`（多 pattern 数组）只允许命中 §0.0 禁令句与 V-11 本行 |
| V-12 | **声明面 ≤ 证据面** | 全文每个「实测 / 已实现 / 已强制 / 已对账」必须能指到实现文件:行或测试；指不到 → 必须改写成「未实现 / 待 S1 / 约定」 | auto：`Select-String -Pattern '实测','已实现','已强制'`（多 pattern 数组）逐处核；manual：核措辞强度 |

### 9.2 产品级验收（P 组，承接 §1 三病）

| # | 病 | 验收项 | 判据 |
|---|---|---|---|
| P-A | P-1 副本 | 副本归零 | 主口径 67 处（4 句 ×14 + 11 处格式）；S4 后扫描命中 0。探索稿的 55 处口径 `[FZ]`，由 S4 spec 用一条命令统一（差值来源须写清） |
| P-B | P-2 不可验收 | 每条卡面断言可回指判据 id / 落点 | 脚本扫描：卡面每行 `must` 必须含 `criterion` id 与 `landing` 值，缺失即红 |
| P-C | P-3 无合同 | 归档产物 100% 由 `writeObservation` 写出且四段绿 | `npm run check` 全绿 + 无 `ArtifactMissing` |

### 9.3 上线后度量（M 组，判定时点 = 首次含 `observation-r<N>` 的归档迁移完成后）

| # | 度量 | 达标线 | 判定 |
|---|---|---|---|
| M-1 | 双实例一致率 | `check:'ai'` 条目双实例 verdict 一致率 **100%**；不一致必须落 `DisagreementOpen` | auto：两份 json 的 `items[].verdict` diff |
| M-2 | 对抗拦截 | S2/S3 的构造式反例**全部红**（不是「实盘偶发」）；覆盖 §5.3 **第 1–10 行全部**（含两条敏感判据） | auto：testcase |
| M-3 | 成本对比 | **同规模** = 同一份 PRD 送审 + ≥5 张问题卡 + ≥3 席位 + 归档进 `docs/superpowers/reviews/`（四项全中）；达标线 ≤ **2 评审轮** 且**整场墙钟**（送审说明准备 → 归档迁移完成）≤ **90 分钟**；并列记录相对「294 分 27 秒」基线的实际值（同一口径：整场墙钟） | manual：按本节口径复算，两人得同一数字 |
| M-4 | 收益样本 | 判定时点起，覆盖产物评审 **≥5 次**，其中 `observation-r*` 命中 ≥5 件 | auto：`Get-ChildItem -Recurse -Filter 'observation-r*'` |

---

## 附录 A　与探索稿的对应关系（只作索引，不复制结论）

| 本文 | 探索稿 |
|---|---|
| §3.1 场景与信号 | §12.1 |
| §3.2 动作五要素 | §3.2、§12.10.4、§12.10.5 |
| §3.3 同编号覆盖 | §3.3 |
| §3.4 检查项两层 | §12.2、§12.3、§12.10.2 |
| §3.5 三态与 subject | §12.10.9 |
| §3.6 开放项 | §12.10.3、§13 第三批 |
| §3.7 三投影 | §2、§6、§12.4、§12.5 |
| §3.8 定义层封闭枚举 | §12.1、§12.2、§12.3、§12.7、§12.10.3～§12.10.5 |
| §4 产物合同 | §14（全节） |
| §5 门禁 | §14.7、§14.8 |
| §9 V-4 的数字来源 | §0.3、§11、§13、§14.6 |

## 附录 B　精算师评审问题表（2026-10-26 原文转录）

> 来源：`reviewer-actuary` 独立上下文评审（事后复核）。下表按原产出的八字段表转录，仅压缩「问题描述」措辞，**证据与级别不改**；「判定」列由议会 #1 处置时补，不改原卡。

| 编号 | 维度 | 问题（摘要） | 证据 | 级别 | 判定 | 处置 |
|---|---|---|---|---|---|---|
| Q-A-01 | 数字真实性 | 「形态 240/240」「隐式 0/4」与源记录不符：实为 233/240（160+40+33）、隐性六卡 17/24（C01 单例 0/4） | 探索稿 `:268` / `:287` / `:293` / `:295-304` | P0 | 承认 | 已改 §0.3 + 纠错注 |
| Q-A-02 | 跨 PRD 成本归属 | 本 PRD S1/S4 与 mainline S3/S6 同时认领 `tools/docgen` 与「全席重生成」 | `mainline/index.md:689` / `:693` / `:690` | P0 | 承认（用户裁） | 本 PRD 优先 → §7 D-08 / A-9；mainline 重优化待办已登记 |
| Q-A-03 | 收益可验证性 | §9 无收益项；今天 0 件产物，门禁上线即「0 件跳过」 | `observation-r*` 全仓 0；mainline `:749` | P1 | 承认 | §9.3 M 组 + §0.4 收益基线 + §2 义务产出 |
| Q-A-04 | 成本量化缺失 | 成本侧零数字；S1 爆炸半径未列；单席成本被 D-07 留白 | `agentData` 294 + … = 559；卡面 731 行 | P1 | 承认 | §0.4 成本表；D-07 改出数门槛 |
| Q-A-05 | 数字口径 | 「9 条 8 绕过」与「0/10」分母不一致，第 10 例不可查 | 探索稿 `:666` / `:668` | P1 | 承认 | **已闭合（2026-10-27 ② 段）**：分母 = 30 条登记向量（S2 testcase §0.3-2 / `ATTACK_VECTORS.length`）；历史 9 / 10 条不进结构化分母，§0.3 `[FZ]` 同批撤 |
| Q-A-06 | 排期与收益顺序 | 「S1 先行」只被「门禁先立」支持，而门禁是 S2/S3 | 草稿 888 行 71 测试绿 | P2 | 承认 | §8 顺序 → S2→S3→S1→S4 |
| Q-A-07 | 路径可核性 | §8 S1 写 `test/*.test.mjs`，本仓根目录无 `test/` | 根目录无 `test`；`scripts/check-all.mjs:76` | P2 | 承认 | 已改 §8 两行 |
| Q-A-08 | 存量与范围声明 | 只认 `observation-r*`，现存 `round-check.md` 与归档件不在判据内 | `round-check.md` 11 份；`docs/superpowers/reviews` 9 文件 | P2 | 承认 | §5.2 存量不追溯 + 精确名白名单 |
