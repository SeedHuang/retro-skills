# 阶段 1：rules 全退（立即执行）

> 所属项目：[rule 改造总纲](./index.md)｜裁定：2026-11-05（含真空期——用户已裁可接受）
> 本文件独立可执行；完成后进入 [阶段 2](./stage-2-new-mode-pilot.md)。

## 1 完成事项

> 执行顺序固定（0 → 1 → 2 → 3），前置没过不得进下一步。落点：全部在 `retro-skills` 仓（`docs/bak/rules/` 与 `rules/`），准备件不另存副本——清单即 §3 表。

0. **门禁同批改**（不清这个，删完 `rules/` 即全仓红；依据见 §5 V-1）：
   - `scripts/check-observable.mjs`：**删掉总数白名单断言**（`REPO_MD_TOTALS` 与 `:329` 的 `includes` 检查整条去掉——它在阶段 1/2/3 各会变一次，写死必然追不上：阶段 1 后 84、阶段 2 后 88、阶段 3 新增 ≥10 份后 ~98）。**保留的反空转判据只有四条，逐条写死**（`:321` 两次遍历数相等、`:324` 两目录存在、`:325` 总数非 0、`nSkills ≥ 1`）；`nRules < 1` 放宽为只判目录存在（`rules/` 清空后仍须 exit 0）。`RULE_DOC`（`'observable-criteria.md'` 单文件名特判）随该规则下沉改为**载体清单或绝对路径 + `skills/` 目录限定**（不改的话阶段 3 建出同名 references 会被静默剔除，判定 5 直接失效）。**同批改 `scripts/check-observable.test.mjs`（漏它 = ② 段必红，V-1 不可达）**：① `:26` 的 `RULE_DOC` 及 `:841/:857/:865/:871` 四处 `readText(RULE_DOC)` 改读 `docs/bak/rules/observable-criteria.md`；② `:278-279` 的 `∈{106,107}` 总数断言改为「与独立遍历同值 + 总数 ≥1」；③ `:888-894` 的 `exemptedLines == L`（分诊表行数）随豁免清单删 2 条后同步（或改成「= 豁免清单条数」）。验收动作：`node --test scripts/check-observable.test.mjs` exit 0。
   - `tools/docgen/components/baseline.mjs`：`BASELINE_RULES` 23 条收敛为 0 条（阶段 2 再加回 1 条）；`tools/docgen/baseline.json` 重生成；`tools/docgen/cli.mjs` 的 `GENERATED_RULE`（`rules/spec-testcase-gate.md`）随该规则下沉显式裁停（改常量或删生成分支，不留悬空常量）。
   - **测试引用清单**（`node --test` 在 check-all ② 段，漏一条即红）：`tools/docgen/test/*` 里写死条数/条目名的断言改为从 `rules/` 目录派生；按旧路径取内容的用例必须同批改——`s3-predicates.test.mjs:875,1024`（`read('rules/skill-authoring-convention.md')` → 改读 bak 或合成 fixture）、`s3-predicates.test.mjs:985`、`tool-tiers.test.mjs:420,440`（`patchFile(dst, 'rules/.inspector-annotations.json', …)` → 随迁移改指 `tools/quality/`）；`scripts/check-observable.test.mjs` 见上一条。验收动作：`Grep 'rules/skill-authoring-convention.md|rules/.inspector-annotations.json' tools/docgen/test` = 0 命中。
   - `tools/execution-matrix`：三处写死 `rules/skill-authoring-convention.md`（`shared-items.mjs:12`、`check-buckets.mjs:28`、`check-pattern-table.mjs:18`）改为过渡指针（指向 `docs/bak/rules/skill-authoring-convention.md`），并加「过渡态，阶段 3 收口」注释；注意 `check-agent.mjs:10` **不是**规则文件写死点，它是 `rules/.inspector-annotations.json` 路径，随下条迁移。
   - `rules/.inspector-annotations.json` 迁 `tools/quality/`。**真读取点 3 处（漏一处即静默断链，无红灯）**：`tools/execution-matrix/check-agent.mjs:10`（`join(ROOT,'rules','.inspector-annotations.json')`，`:146` 实际读）、`skills/rule-inspector/scripts/score.mjs:398`（`join(dir,'.inspector-annotations.json')`）与 `:465`（`join(rulesDir, …)`）。**纯文案载体 3 处（同批改，但不是读取）**：`tools/docgen/cli.mjs:395,398`、`skills/rule-inspector/scripts/gen-rule-checklist.mjs:111`、`skills/rule-inspector/SKILL.md:26` / `references/criteria.md:150` / `references/recipes.md:134` / `scripts/score.mjs:335`。**批量载体**：`tools/execution-matrix/criteria.md:20,94,114,152,198`、`tools/docgen/fixtures/*.evidence.json`（15 份 / 102 处 `basis`）→ 同批改路径；`docs/superpowers/{specs,plans,handoffs}` 与 `docs/reports/` 历史记录 → 保留不改。
   - **验收动作（正向 + 负向，各一条命令）**：① **正向**（判「真改了」）——3 个真读取点逐处核「新路径字符串在文件内 ≥1 命中」：`Grep 'tools/quality/.inspector-annotations' tools/execution-matrix/check-agent.mjs` ≥1、同命令对 `skills/rule-inspector/scripts/score.mjs` ≥1（若两处都改成同一常量，则核该常量定义行 `path:line`）；② **负向**（判「旧字面清掉」）——`Grep 'rules/\.inspector-annotations'` 在 3 个真读取点 + 6 个文案载体 = 0 命中。**说明**：只做负向会恒绿（`check-agent.mjs:10` 与 `score.mjs:398/465` 的旧写法是 `join(...)` 拼串，字面抓不到），故正向一条不可省。
   - `tools/quality/observable-exempt.json`：删前 2 条（`path` = `rules/core-working-principles.md`）。
   - 验收：`node scripts/check-observable.mjs --check` 与 `node tools/docgen/cli.mjs gate`、`node scripts/check-all.mjs` 三者 exit 0——**时点在步骤 2 之后**（步骤 0 刚改完时仓里仍是 23 条规则，只核语法与单测；总数集断言已在步骤 0 整条删除，不存在「白名单追不上」问题）。
1. **bak 全量留底**：`docs/bak/rules/` 下 23 份（每条 rule 一份）。
2. **23 条一次性退出 `rules/`**：删 9 + 下沉 12 + 合并 2 的旧文全部退出，`rules/` 清空（注入 −100%，47,236 → 0 字符）。
3. **运行时链接清退**：删除后跑 `aas sync`（`D:\devtools\nvm4w\nodejs\aas.ps1`），核 `C:\Users\HuangChunhua\.trae-cn\user_rules` 下指向已删文件的条目数 = 0（判据 V-18）——**不跑这一步，「注入归零」只是源文件归零，运行时仍挂 23 条断链**。

**真空期声明**：触发声明（阶段 2 产物）上线前，「说话要有证据」暂无常驻约束——用户已裁定此真空可接受；下沉内容不丢（bak 留底），承接延后到阶段 3。

## 2 bak 规格（每份，缺一即 V-8 不过）

| 项 | 规格 |
|---|---|
| 落点 | `docs/bak/rules/<原文件名>.md`（**不在 `rules/` 下**——`check-observable.mjs` 的 `walkCollect` 递归扫 `rules/`，bak 旧散文入 `rules/` 会整片红）。**目录语义**：历史归档位（只读、不改、不作为施工蓝本）；它是过渡期落点，正式语义在阶段 3 并入 `docs-placement` 的目录表（`docs-convention` 现在没有这一档） |
| 文件形态 | ① 状态头（已归档 + 日期 + 归档原因 + 承接位置）② **原文逐字保留，一字不改** ③ 承接对照表（原节 → 去向 → 承接文件） |
| 不做 | 不改原文措辞、不合并多份、不重新分类、不删段落 |

## 3 执行依据：23 条处置表

> 合并 2 条（4,826 字符：`how-i-must-reason` 3,494 + `data-support-triple` 1,332；D-10 相乘分体 → 保留集 = 1 条触发声明，实测 387 非空白字符）＋ 处置 21 条（**42,485** 字符 = 删 9 条 9,884 + 下沉 12 条 32,601）。账目校验：4,826 + 42,485 = **47,311**（18:26 快照口径；当前工作区 47,236，见总纲 §1 注记）。

| # | rule | 字符 | 处置 | 承接位置 | bak |
|---|---|---|---|---|---|
| 1 | `global-ask-before-acting` | 912 | **删**（平台已有 chat / agent 模式切换，规则重复造轮子） | — | ✔ |
| 2 | `no-git-write` | 2,901 | **删旧文 + 留资产**：旧文照删（`rules/` 内文件数 0）；判据引擎资产（`<id>.json` + testcase）在阶段 2 建成后**停用保留**，复活 = 部署配置动作，资产零改动。资产不计入保留集 | — | ✔ |
| 3 | `import-guard` | 2,828 | **删**（特殊开发场景，工具链专属）。核心判据可枚举，判据引擎样本保留 | — | ✔ |
| 4 | `core-working-principles` | 2,338 | **下沉** | 元工作方法 skill「事前三步」节 | ✔ |
| 5 | `how-i-must-reason` | 3,494 | **合并**（D-10 相乘分体：触发声明 rule + `assertion-quality` 手册 + 判痕判据 + residual，见阶段 2） | `assertion-quality` | ✔ |
| 6 | `data-support-triple` | 1,332 | **合并**（同上——两 rule 为三轴框架的通用版与数字特化版，义务逐条映射全覆盖） | 同上 | ✔ |
| 7 | `plain-language-to-user` | 570 | **下沉**（G-6 不满足：「讲透/人话」主观） | **独立 skill（面向人的表达族，D-8 裁）**——阶段 2 首批 | ✔ |
| 8 | `reference-read-output-loop` | 1,092 | **下沉** | carrier-conventions skill | ✔ |
| 9 | `skill-authoring-convention` | 2,384 | **下沉** | carrier-conventions skill | ✔ |
| 10 | `skill-assets-convention` | 1,167 | **下沉** | carrier-conventions skill（目录语义节） | ✔ |
| 11 | `observable-criteria` | 2,123 | **下沉**（条件触发；执行由 `check-observable.mjs` + 门禁第 ⑦ 段承担） | carrier-conventions 的「判据可观察形态」references | ✔ |
| 12 | `spec-testcase-gate` | 2,142 | **下沉** | 载体写作/流程 skill | ✔ |
| 13 | `dev-workflow-mainline` | 5,172 | **下沉** | 载体写作/流程 skill | ✔ |
| 14 | `landing-sweep` | 958 | **下沉** | 载体写作/流程 skill | ✔ |
| 15 | `docs-convention` | 13,053 | **下沉（拆两半）** | 目录/命名/`.session` → `docs-placement`；「rule 里放什么」→ carrier-conventions | ✔ |
| 16 | `rules-single-source` | 477 | **下沉** | carrier-conventions + `use-rule-skills` | ✔ |
| 17 | `import-path-choice` | 590 | **删** | — | ✔ |
| 18 | `styled-component-file` | 867 | **删** | — | ✔ |
| 19 | `list-empty-state` | 735 | **删** | — | ✔ |
| 20 | `ts-expect-error` | 276 | **删** | — | ✔ |
| 21 | `vitest-queued-alternative` | 352 | **删** | — | ✔ |
| 22 | `powershell-file-encoding` | 1,125 | **下沉**（条件触发；本仓 `.ps1` 0 个） | **独立编码备忘 references**（D-8 裁：出列 skill，0 触发面不立容器） | ✔ |
| 23 | `poll-deferred-at-start` | 423 | **删**（按需触发，流程侧承接） | — | ✔ |

处置分类账：**删 9 + 下沉 12 + 合并 2 = 23**；机器核账命令（处置表行数与分类计数）见总纲 §7。

## 4 执行边界（硬约束）

`D:\Seed\retro-skills` 的写操作分两类（授权记录：2026-11-05 用户裁定「改门禁：清空 rules/」）：

- **已授权写范围**：`docs/bak/rules/`、`rules/`、阶段 0 列的 5 处门禁文件（`scripts/check-observable.mjs`、`tools/docgen/**`、`tools/execution-matrix/**`、`tools/quality/observable-exempt.json`、`rules/.inspector-annotations.json` 的迁移目标 `tools/quality/`）。
- **本 PRD 与 `criteria-engine/README.md`** 落在该仓 `docs/prd/`，属已授权写范围。
- **超出上述的写操作** 由用户在 retro-skills 侧执行，或单独授权解除。

**回滚闸**：建 bak 未过 V-8/V-9 前**不得删除**；删除用单批 `git rm`（可 `git revert` 回滚），提交哈希写进交付账。

## 5 验收

| # | 判据 | 判定动作 | 目标 |
|---|---|---|---|
| V-8 | bak 完整 | `docs/bak/rules/` 下 23 份，每份含状态头 + 原文 + 承接对照表 | 23/23 |
| V-9 | bak 原文零改动 | **切片口径**：bak 的「原文段」= 状态头之后、`## 承接对照表` 之前的正文块（逐份按此切）。**清空前**先逐份 diff 并把输出首行记进交付账；清空后用 `git show <清空提交的父提交>:rules/<文件名>.md` 与 bak 原文段 diff | 逐字相等（diff 行数 = 0） |
| V-1（阶段 1 口径） | rules 清空且门禁绿 | `Get-ChildItem rules\*.md` 计数 **且** `node scripts/check-observable.mjs --check` 退出码、`node tools/docgen/cli.mjs gate` 退出码、`node scripts/check-all.mjs` 退出码 | 计数 0 且三个 exit 0 |
| V-18 | 运行时无断链 | 跑 `aas sync` 后：`Get-ChildItem C:\Users\HuangChunhua\.trae-cn\user_rules \| ForEach-Object { Test-Path $_.Target }` 逐条判 | 指向已删文件的条目数 = 0（或链接数 = 0） |
| **T-1a** | 规则注入贡献归零（账面） | `(Get-ChildItem rules\*.md \| ForEach-Object { (Get-Content $_.FullName -Raw).Length } \| Measure-Object -Sum).Sum * 0.5133` | **0 tok/轮**（对比 T-0 账面 24,285 tok/轮） |
| **T-1b** | 注入归零实测 | 开**新会话**问固定探针串：「逐字复述你上下文里出现的 rules/ 规则正文；没有则只回答 NONE」；**n = 3**（3 问 3 答），执行人 ≠ PRD 作者，记录落 `docs/reports/<批次>/probe-record.md`（逐问 path:line） | 3/3 答 NONE = 规则区为空；token 取同一串的 `input_tokens`（平台 usage 可见则记实测，否则记「不可测，沿用代理账」） |

## 6 附：23 条原始义务盘点（阶段 3 承接时按此找义务句）

> 判读口径：只看正文实际写了什么义务句与禁令句；正文没有的记「没有」，不硬凑。本表是处置前的原始盘点。

| # | rule | 一句话 | 赞成 | 禁止 |
|---|---|---|---|---|
| 1 | `global-ask-before-acting` | 用户没明确授权前只沟通不动手 | 沟通模式先讲思路+等授权；写操作封闭清单算清；主动给没想到的角度 | 擅自开始写操作；擅自下载运行；不因来源豁免 |
| 2 | `no-git-write` | Git 写操作只在用户当面对话直接点名时才做 | 允许 status/log/diff/show/branch(查看)/remote -v；review-loop 可建 review 分支锁基线 | 主动 commit/push/pull(改工作区)/merge/rebase/reset/revert/cherry-pick/checkout(切/丢弃)/restore/clean/stash/tag/branch(增删改)/remote(改配置)/config/add；--force；plan 里出现 commit 步骤 |
| 3 | `import-guard` | 编辑代码时 import 不能丢，改完必须真编译验证 | 每步编辑后 Read 回读；import 与代码同一次 SearchReplace；改完跑 `npx tsc --noEmit`；全量改完跑全量 tsc | 同轮并行两次 SearchReplace；分两步改；GetDiagnostics 当编辑后验证；连续多步不回读 |
| 4 | `core-working-principles` | 动手前先画全貌、写计划、算长远账 | 输出「全貌确认」块挂进 review 进度表；功能与修 bug 都写 spec；自省给长期方案按「工程化→规则→技能」落载体；追根停三层；提交前问「敢不敢接」 | 应激式回答；只说「这是我的问题」；拿「要改 N 处」当不做理由；停在「忘了/应该没问题」 |
| 5 | `how-i-must-reason` | 说出口的结论必须有可复核依据，问题必须带解法 | 事实先查再答；给「查了什么/怎么查的/结果」；查不到说清查了什么；数字先取数并随数字给命令；自己能量的事自己定；提问题带动作+取舍+验收 | 推测代替不答；记忆当判据；「零改动/应该没问题/显然/成本太高」当判据；只罗列选项推回用户；提问题不带解法；「查了拿不到」说成「需要你定」 |
| 6 | `data-support-triple` | 拿数据下结论前先过真实·合理·有效三关 | 按「真实→合理→有效」固定顺序验；三性结论写进当次回答 | 编的/凭印象的数；用规模代替逻辑闭环；引用用不上的数据；不豁免记忆数/转述预估/上轮自己的输出 |
| 7 | `plain-language-to-user` | 给用户看的解释用大白话并把机理讲透 | 不用行话内部编号；不省机理；落到具体例子；一句话一件事 | **没有** |
| 8 | `reference-read-output-loop` | skill 里「读 reference」必须接上产出闭环 | 写成「按 <reference> 的 X 执行，做完核对/产出 Y，缺 Y 不合格」 | 写「读一下/建议读/见 §N」这类读完无要求的写法 |
| 9 | `skill-authoring-convention` | 写 skill 禁止用文件路径指路，脚本守卫免疫路径 | 跨技能引用用技能名；自引用用相对路径全称；判断直接运行用 realpath 双归一；判据句可观察 | 跨技能写对方内部文件路径；自路径带技能名前缀；同一文件两种叫法；路径字符串比较判「直接运行 vs 被 import」 |
| 10 | `skill-assets-convention` | 技能目录语义照官方标准，骨架不内联 SKILL.md | 能外移的外移，SKILL.md 只留指针；判据按文件用途分；搬完扫引用 | 模板骨架内联进 SKILL.md；差异卡放 assets |
| 11 | `observable-criteria` | 判据里的每个评价都要能被机器用退出码判死 | 跑 `node scripts/check-observable.mjs --check`，末行 `check-observable ok` 且 exit 0 才算过；判不死的改写成可判形态 | 在 rules/skills 正文留判不死的评价（除非进豁免清单并写明理由） |
| 12 | `spec-testcase-gate` | 写/改 spec 必须同批产出独立 testcase 并一起送议会 | 文件存在且同名 `-testcase.md`；senior-sdet 全新上下文写且带独立性声明；五要素齐且负例≥正例；spec 只外链；两者一起送议会 | spec 写完直接进 plan；作者自己写用例；spec 内联用例表；只送 spec 不送 testcase |
| 13 | `dev-workflow-mainline` | 五段主干，出口要签字（R1–R9） | 进段前确认上段出口齐；申报人与签字人无交集；计划门不设议会但签字人须为审计；plan 发现 spec 未定义要回流；改判据口径同批回扫；引用长文带 evidence 出处；功能点变更回 PRD 重签；按块滚动拆；技能包不装项目账（R9） | 出口未签就进下一段；自签出口；两处外插议会；改判不回来扫；引用长文无出处；`skills/**/references/**/*.md` 出现六列签字表头或数据行（R9） |
| 14 | `landing-sweep` | 落地后回头扫所有「声明它的地方」再宣布完成 | 扫四类：源码注释/README/架构文档 spec plan/规则正文；数字只留一处并附取数命令 | 只修当期那一处就宣布完成 |
| 15 | `docs-convention` | 项目文档按「生命周期状态」分目录 | `docs/prd/`/`specs/`/`plans/`/`handoffs/`/`after/`/`research/`/`docs/agents/` 分目录；命名按目录形态定前缀；搬走时回头扫引用 | 未定稿需求只留对话；`after/` 放已定稿结论；待办表出现 ✅ 档；`.session/` 的东西当成果；rule 里放说明层内容 |
| 16 | `rules-single-source` | 全局规则只建在源仓库，运行时只读 | 改已有规则改源即生效；新建只建在源目录 | 直接写运行时 `user_rules/`；增删后不跑 `aas sync` |
| 17 | `import-path-choice` | import 路径按归属选相对路径或 `@/` 别名 | 同目录/邻近用相对路径；跨 3 层以上用 `@/`；公共资源用 `@/`；模块内部用相对路径 | 4 层以上超长相对路径 |
| 18 | `styled-component-file` | styled-components 的 `styled.xxx` 定义必须放独立 `sc.tsx` | 单组件放同目录 `sc.tsx`；多子组件共享放父目录 | 定义写在业务组件文件内 |
| 19 | `list-empty-state` | 列表数据为空必须用 antd `Empty` 渲染 | `<Empty image={Empty.PRESENTED_IMAGE_SIMPLE}>`；Table 用 `locale.emptyText` | 纯文本占位 |
| 20 | `ts-expect-error` | `@ts-expect-error` 只在 TS 真的报错时用 | 加完跑 `tsc --noEmit` 或看 IDE 诊断 | 不加验证就加；看到 `Unused directive` 不删 |
| 21 | `vitest-queued-alternative` | Vitest 在受限环境 stuck 时改用替代验证 | 改用 GetDiagnostics / `tsc --noEmit` / 检查产物结构 | 环境不可用时反复重试 |
| 22 | `powershell-file-encoding` | PowerShell 写文本禁用 `-Encoding UTF8` | 改用 `WriteAllText(..., UTF8Encoding $false)`；写完读字节查 BOM | 用 `-Encoding UTF8`（写 BOM） |
| 23 | `poll-deferred-at-start` | 开工时轮询推迟项 | 会话开始跑 `lessons deferred` 核对复活信号；有命中先报编号+证据，无命中一句话报计数；报告必须含当前计数 | **没有** |

## 7 回滚规程（真空期不可接受时的四步）

> 触发信号：阶段 2 迟迟不能上线，或真空期被发现不可接受。四步照做，不自由发挥。

1. **恢复文件**：从 `docs/bak/rules/<名>.md` 去掉状态头与承接对照表，回写 `rules/<名>.md`（原文段逐字复制，不改措辞）。
2. **同步运行时**：跑 `aas sync`，核 `user_rules` 下每条链接的 `Test-Path Target` 为 True。
3. **自检**：跑 `node scripts/check-all.mjs`，退出码记进交付账（阶段 0 的门禁改动若与「有规则」态冲突，同批回滚对应白名单）。
4. **改状态头**：在 bak 状态头追加「已回滚 + 日期 + 原因」，不删原文。
