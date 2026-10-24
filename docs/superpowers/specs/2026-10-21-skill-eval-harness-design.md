# Skill 行为评测：仓库内用例工装（skill-up 本地化）

> 日期：2026-10-21｜状态：**已定稿（第 9 轮通过，2026-10-22）**（第 8 轮原判「不通过」保留不改；判据校准经第 9 轮确认；终判 P0=0、阻断项=0；**`check-all` 与哈希待终端恢复后补跑**——未跑成前不得声称全绿）｜触发：用户 2026-10-21 决定「参考 skill-up 的测法与脚本，做本地化并入库」
> 测试用例文件：`docs/superpowers/specs/2026-10-21-skill-eval-harness-design-testcase.md`（由独立 `senior-sdet` 子代理在全新上下文编写）
> 依赖：无。本 spec 不动 `skills/` 下任何技能正文、不动 `npm run check`、不动 `tools/`
> 实测依据：`.session/eval/trial/`（三轮试跑，2026-10-21）——**注意**：`.session/` 不进 git，其中的证据只在本 spec 定稿前有效；定稿所需的 5 份关键样本已复制进 `evals/review-triage/fixtures/responses/`（见 §3.1）
> **互测修订（2026-10-22，主 Agent ↔ SDET；第 1 轮 13 条 + 第 2 轮复攻 9 条全部收敛）**：第 1 轮修 S1–S13（路径基准单一化为当时的「技能根目录」——**该基准已于 2026-10-23 改为 `evals/` 目录，见下一条**、`--dry-run` 与 fixture 物化解耦、`git apply --check` 进 ⑥、工具码 × 数据完整性二维表与跨行取码、gate 数据量闸门、`expect`/`judge` 键白名单、`title` 多重集 + 重名即码 4、`frozen` 留痕失效归码 4、禁词双向留痕落 `RECORD.md`）；第 2 轮复攻补：示例块 `oracle` 路径、`repo_fixture` 物化与传参（改为「yaml 写物化路径静态相对值 + runner 按 repo 名物化」）、运行后闸门与 ①–⑦ 分家、跨行取码只算 gate 行、§5⑥ 与优先级对齐、凭据分支优先于二维表①、`.session` 物化的 git 写例外、`runs[].result.passed` 字段路径、A1 的 `CONTRACT.json` 变更期闸门。**A1 契约脚本 `scripts/check-eval-contract.mjs` 纳入交付面**（用户 2026-10-23 裁定；不加 npm script）。账本：`.session/reviews/2026-10-22-093735-skill-eval-harness/clarify.md`。
> **基准修正（2026-10-23，真跑取证后）**：全套相对路径基准由「技能根目录」改为 **`evals/` 目录**（`<eval.yaml 所在目录>/..`）——依据是 skill-up v0.14.0 实测兜底行为（`SKILL.md not found within 10 levels above <evals/技能名>; falling back to <repo>/evals`，随后按该基准解析用例路径失败）。同时 02 用例补齐 `context` 夹具（`repos/command-swap-demo/` + `diffs/command-swap.patch`），其 `anchors` 由 `[]` 改为 `["check:all"]`。改动覆盖 §3.1 目录树 / §3.2.1 / §3.2.2 示例与字段表 / §3.3-1 / §4 步骤 0 / §5①⑤ 与 R1。取证：`.superpowers/sdd/2026-10-22-skill-eval-harness/eval-run-report.md`。
> 议会记录：第 1 轮 2026-10-22 五席评审（52 卡，P0×8）；第 2–4 轮复查各修 P0/P1；**第 5 轮复查 P0=3 不通过（verdict 值域 / dry-run 语义 / TC-038 免责出口）**；**第 6 轮复查 P0=6 族 / 7 张，必须修项 15 族不通过（码 2↔verdict 行互斥 / TC-007 路径断言自相矛盾 / TC-018 样本恒不过 / TC-028 越行格式 / INVALID_ASSERT 无机器可读预期值 / §8 建议前瞻正则）**。**第 7 轮复查（2026-10-22）P0=9 族不通过**（证据词两处相反 / TC-018 样本恒不过 / dry-run 取不到引擎版本 / `flaky=未判定` 值域互斥 / 「与工具同口径含否定豁免」是假平台断言 / 工具非 0 全归 `INVALID_ENV` 与码 1 冲突 / 「工具退 0 无产物」码位冲突 / TC-066 取证被校验 ⑥ 拦死 / `delta` 值域与 TC-030 放行 0），本版已按 9 族修复并同步 testcase v4；第 6 轮修复时曾按 F1–F15 族修 §1.5/§3.1/§3.2.1/§3.3-4~7/§3.4/§3.5/§4/§5⑥⑦⑨。**本版另含 2026-10-22 架构级改造**（用户指令「站在全局角度、看关系逻辑是否闭环、有没有盲点和悖论」）：把「单一标量预期值 + 单一 verdict」重写为**三层判据模型**（L1 用例可用性 / L2 断言可达性 / L3 技能有效性，§1.5 + §3.2.2 机读块），改动覆盖 §1.5 / §2 R5·R7·R8·R10 / §3.1 / §3.2.1 / §3.2.2（新增）/ §3.3-5~7 / §3.4 / §3.5 / §4 / §5 / §6。**另含 2026-10-22 真 fixture 实验后的契约修正**：`apply_diff` 必须嵌在 `context.git` 下（写成 `context.apply_diff` 会被静默忽略）、`context.git.init` 真实存在、且工具只建空仓库不做基线提交（fixture 须自带 baseline 提交）——修正 §1.5 / R5 / §3.1 / §3.2.1 / §4。账本 `.session/reviews/2026-10-22-093735-skill-eval-harness/`。正文中的卡编号（`<席别>-<轮>-<序>`：BE=后端 / AI=AI 席 / RD=读者代表 / QA=测试 / AU=审计）仅作修复溯源，对应账本 `cards.md`。

## 0 为什么

我们现有的验证只有三层，中间缺一层：

| 层 | 工具 | 管得到 | 管不到 |
|---|---|---|---|
| 静态 | `npm run check` | 文件结构、引用一致、markdown 形态 | agent 读完 SKILL.md 会不会照做 |
| 单元 | `node --test` | 脚本逻辑 | 同上 |
| 长期 | `retro-verify` | 复发率（需攒够机会数） | 单次改动、发布前 |

后果是具体的：改一条技能的判据措辞、改一条纪律，**要等下一次真实 session 才知道有没有生效**，而且要攒够样本才敢下结论。

skill-up 提供了这一层：同一道题、同一个模型，跑「装技能 / 不装技能」两遍，比差值。2026-10-21 实测确认它在本机可跑（Windows 原生、不用 Docker），并且抓到了真实差异：

- 用例「命令替换必须 review」：装技能 **1/1 run 全过**（`out/iteration-1`，该 run 内 3 条断言项全过），不装 **0/1 run 全过**（同一轮同类 run，3 条里只过 1 条）——**这是单 run 的历史观察，不是 run 级稳定性结论**（run 级口径见 §1.5 / §3.3-6；后来多迭代实测为装 7/7 run 全过、不装 0/7 run 全过，见 R10）；
- 不装技能时的理由是「需要实跑验证后提交」（要求跑一遍绿），装技能时是「跑绿只证明脚本自己跑得通，不证明这次替换是对的，机器判不了」——**这正是该技能要纠正的行为，现在可以被量化**。

本轮只做一件事：**把这套测法固化成仓库里的工装**——用例进 git、路径不进技能目录、输出不污染仓库、断言有写法规矩、结论有价值判据。不引入 skill-up 作为 `npm run check` 的依赖。

## 1 全貌确认

| 维度 | 内容 |
|---|---|
| 本质 | 缺一层「行为回归」：技能的约束力没有被任何机器证据覆盖 |
| 同族 | ① `retro-verify`（长期复发率）② checklist（人工逐条核对）③ 议会评审（人/代理读文档判断）。三者都在，但都不是「同一 prompt 装/不装对比」 |
| 边界 | 只管**用例工装**（放哪、怎么跑、断言怎么写、结果怎么判）。不管技能正文、不管 CI、不管 Trae CLI（企业旗舰版限制，个人不可用）、不改 `check-all` |
| 验收 | 用例进 git 且不出现在 `skills/` 下；`npm run check` 仍全绿且仍零依赖；一条技能两条例跑出「装/不装」差值且理由正确；断言写法有可判定的规矩 |
| 影响面 | ① 新增 `evals/`（用例 + fixture + 固化样本）② `package.json`（一条 npm script）③ 新增 `scripts/run-eval.mjs` ④ **新增 `scripts/check-eval-contract.mjs`（A1 离线契约脚本；直接 `node` 跑、不加 npm script——2026-10-22 互测 S10，用户 2026-10-23 裁定纳入交付面）** ⑤ 不改 `skills/`、`tools/`、`scripts/check-all.mjs` |

**联动四问**：

- **治本了吗**：治的是「技能约束力无证据」这个根，不是某一条技能的具体错。用例与技能同仓同版本演进，改技能后能立刻看到差值有没有掉。
- **有副作用吗**：① `npm run check` 的 markdown 检查会扫到新增的 `.md`（fixture 的 `plan.md`），必须合规（§4 步骤 6）；② 默认产物目录会落在技能目录旁边（skill-up 的默认行为），必须在脚本里显式改道（R3）；③ 会花模型调用，必须与 `check` 隔离（R2）。
- **跨问题联动吗**：与「断言必须盯错误形态」「fixture 要能实跑判据」两条经验同源——它们不是 skill-up 的知识，是我们写用例时必须遵守的规矩。
- **跨项目吗**：`evals/` 是仓库级工装，不进 `skills/` 就不会随 `npx skills add` 发给用户；不影响使用者。

## 1.5 术语（议会第 1 轮 RD-1-08 修复；第 2 轮 AU-2-03 章节号唯一化）

| 词 | 定义 |
|---|---|
| **三层判据** | 把「这个结论可信吗」拆成三层，**各层只判一件事、只读自己需要的输入、不共享标量**：<br>**L1 用例可用性** = 同一臂的全部 run 结论一致吗（`flaky`）；<br>**L2 断言可达性** = 手写 oracle 样本能满足该用例的 `expect` 断言集吗（`judge` 段的关键词必须是 `expect` 的子集，§3.2.1——否则真跑判分会落在 L2 视野之外）；不过即码 4，不花模型调用；<br>**L3 技能有效性** = 两臂全过率之差达到阈值吗（`delta`）。<br>依赖方向固定且单向：L1 只读原始 `runs[]`；**L2 只读用例 yaml + 手写 oracle + `frozen-ledger` 状态声明（该声明只是「校准过」的标记、一次达标快照与断言/阈值哈希，**不含原始 `runs[]`**），不读原始跑分、不调模型**；L3 只读 L1 的结论 + 原始 `runs[]`，且 L1 未过时 `delta` 只能写「未判定」（2026-10-22 三层改造） |
| **flaky** | **单一定义，全文只有这一处**：同一 `eval_name` + 同一 `configuration`（臂：`with_skill` / `without_skill`）下，把**全部** `iteration-*` 目录的 run 合起来看，run 级结论里既有「全过」又有「未全过」即 flaky。判定口径与用例级聚合（**任一臂 flaky 即该用例 flaky**）见 §3.3-6。**不存在第二套按断言项计的口径**——旧版 R10 的「1/2 命中禁词 = 必然 flaky」已删（2026-10-22 三层改造：同一份数据不能既证明 flaky 又要求非 flaky） |
| **run 级三态** | 每个 run 按 **`runs[].result.passed` / `runs[].result.total`**（2026-10-22 实测：真实 `benchmark.json` 里 `passed` / `total` 在 `result` 对象下，run 顶层没有这两个字段——写成 `run.passed` 会让全部 run 变 `undetermined`、恒报码 2，而桩测试全绿，暴露不出来）判为 `full`（`passed === total > 0`）、`partial`（两者皆为数且 `passed < total`）、`undetermined`（`passed` / `total` 缺失或非数——**实测：run 失败时工具写空值**，2026-10-22 实验：CCR 未启动导致 `claude` 报 `Connection refused`，两臂 run 全为空值；**字段位置写错同样归此**）。`undetermined` 不参与 flaky 判定，也不进率的分母。**三态必须穷举**：上述三式都不命中的数值组合（如 `passed=0,total=0`、`passed > total`）一律归 `undetermined`，并在 stdout 保留原始 `passed/total` 值 |
| **全过率** | 某臂的全过率 = `full` 的 run 数 ÷（`full` + `partial`）的 run 数。分母为 0 → 该臂「未判定」 |
| **delta** | `全过率(with_skill) − 全过率(without_skill)`，**唯一**判「技能有没有用」的指标（R7）。绝对通过率不作判据 |
| **oracle 样本** | `fixtures/oracle/<case-id>.md`：**手写**的正确答案回复，L2 用它离线证明「断言可被正确行为满足」。**不得由模型输出摘录、不得由试跑产出**——否则断言对着自己写的答案自证 |
| **gate / probe 用例** | `gate`：参与 L1 + L3 判定，必须声明 `arms` 与 `delta`；`probe`：只留 flaky 记录与人工复核，**`arms` / `delta` 必须为 null**（禁止填假数值应付格式）。归属写在 `expected.md`（§3.2.2） |
| **baseline** | 不装技能的对照组。`--baseline` 与 `benchmark.enabled: true` 是同一开关的两处表达；**权威 = yaml 的 `benchmark.enabled`**，runner 按 yaml 值决定是否传参（BE-2-03） |
| **fixture 仓库** | 用例 yaml 的 `context.repo_fixture`（仓库目录）+ **`context.git` 段**——`apply_diff` **必须写在 `context.git` 下面**（`context.git.apply_diff`），同级还有 `init` / `checkout` / `remotes`（官方文档《编写评测配置与用例》「用例上下文 — context」；2026-10-22 实测）。**写成 `context.apply_diff` 会被当成未知字段静默忽略，补丁不会打上**（实测：plan.md 保持原样、模型回「不是 git 仓库」）。**`git.init: true` 只建空仓库、不做基线提交**（实测：`.git` 存在、`git log` 报 `does not have any commits yet`、`git status` 全是 `??`、`git diff` 为空）→ 要得到「未提交改动」，**fixture 目录本身必须自带一个已提交的 git 仓库**（实测上传保留 `.git`，`git status` 显示 ` M notes/plan.md`、`git diff` 显示一行翻转）。另：`validate` 与 `--dry-run` 都**不校验** `skills[].path` 与 fixture 路径存在性（2026-10-22 实测）。素材放 `fixtures/repos/` 与 `fixtures/diffs/` |
| **正例证据词** | 断言「必须出现」的词，对应 `expect.must_contain` / `judge.success[].output_contains` |
| **负例禁令词** | 断言「必须不出现」的词，对应 `expect.must_not_contain` |
| **实跑锚点** | 只有真正执行过命令才可能出现的输出（如 fixture 独有的文件行、临时仓库绝对路径），用于区分「实跑证据」与「复述 prompt」（见 R4-④）。**主锚点必须是 prompt 不可推断的事实**（prompt 中未提及的 fixture 文件行 / 随机化文件名 / 临时仓库绝对路径）；`git diff --stat` 的 stat 行（如 `1 file changed, 1 insertion(+), 1 deletion(-)`）可由 prompt 的「只翻转一行」推出，**只作辅助证据、不得单独充当主锚点**（AI-6-05）。锚点还必须同时满足「prompt 中 0 命中」与「手写 oracle 样本中命中」，两点由**启动前闸门机械核对**（§3.2.2 ⑥）；**不得由某次真跑样本反推锚点**——那等于让被检验的那次运行给自己定真值（AI-5-03 / BE-5-05，2026-10-22 三层改造） |

## 2 核心决定（不可违反）

| # | 决定 | 为什么 |
|---|---|---|
| R1 | **用例放 `evals/`（仓库根），不放 `skills/`**。结构 `evals/<技能名>/{eval.yaml,cases/*.yaml,fixtures/}`，`eval.yaml` 的 `skills[].path` 指回 `../skills/<技能名>`（**相对 `evals/` 目录**；实测：外部绝对路径可正常安装并跑出与内置路径一致的差值） | 技能是产品、评测是工装。放 `skills/` 内会随 `npx skills add` 一起打包，也违反技能目录三档约定 |
| R2 | **不进 `npm run check`**。评测走独立 npm script，`check` 保持零外部依赖、确定性、每次必跑 | `check` 的契约是「不花钱、跑得快、结果确定」；评测会花模型调用且结果有抖动 |
| R3 | **产物目录强制改道**：runner 必须显式传 `--output-dir .session/eval/out/<技能名>/`，禁止依赖默认值 | skill-up 默认产物落在 `skills/<技能名>-workspace`——会污染 `skills/` |
| R4 | **断言只盯错误形态，不盯模板字眼**。① `must_not_contain` 只放「正确答案不会出现的错误推理」（如 `低风险`、`纯文档`）；② 不得把分档标题（`必须 review`）写进 `must_not_contain`——正确答案也会打印 `⚠️ 必须 review：无`；③ 每条用例必须同时具备「正例证据词」与「负例禁令词」；④ **证据来源锚点**：凡技能判据要求「实跑证据」的用例，断言必须包含**prompt 不可推断的主锚点**（fixture 独有的文件行 / 随机化文件名 / 临时仓库绝对路径）；`git diff --stat` 的 stat 行（如 `1 file changed, 1 insertion(+), 1 deletion(-)`）可由 prompt 推出，**只作辅助证据**，不得单独判「含实跑证据」（AI-6-05/RD-6-05） | 议会第 1 轮实测两踩：只看结论词放过错误理由、只看标题误杀正确答案；第 1 轮的「正确样本」自陈「当前会话目录不是 git 仓库」却全过断言——**关键词断言区分不了实跑与复述**，必须加锚点（AI-1-03） |
| R5 | **凡技能判据要求「实跑命令」的用例，必须给真 fixture 仓库**（`context.repo_fixture` + **`context.git.apply_diff`**，**不得**写成 `context.apply_diff`——写错层级会被静默忽略、补丁不生效），且 **fixture 目录必须自带已提交的 git 仓库**（`context.git.init` 只建空仓库、不做基线提交，没有基线就看不到「未提交改动」），不得在 prompt 里粘贴 diff 充当证据。**fixture 字段必须先取证后使用**：① 启动前闸门机械核对 fixture 与 `skills[].path` 路径都存在（§3.3-5 ⑥——`validate` 与 `--dry-run` 都会静默放过不存在的路径，实测）；② 有凭据时按 §4 步骤 0 跑一次真 fixture 用例，确认模型回复出现 fixture 独有内容；无凭据时只能记「真 fixture 未取证」，**不得写成已取证**；③ **baseline 也是机械闸门（仅当该用例声明 `context.git.apply_diff` 时）**：启动前校验 ⑥ 必须核对 fixture 目录下 `.git` 存在、`git rev-parse HEAD` 成功（= 有 baseline 提交）——任一条不成立即码 4（reason=配置错误）并提示先跑 §4 步骤 1 的重建脚本；未声明 `apply_diff` 的用例不查 baseline（TC-023 故意不给 fixture）。**这里不得要求 `git status --porcelain` 非空**：补丁由工装运行期 `apply_diff` 打上，闸门执行时工作区本就该是干净的——把「运行后的观测」当「启动前的前提」会让正确 fixture 恒报码 4（2026-10-22 自检）。`.git` 不入库，克隆后必然缺失，只靠人工自查会让用例静默跑空 | 2026-10-22 实测三条：① 空目录下技能按硬约束把粘贴的 diff 判成必审（忠于规则）；② `apply_diff` 写成 `context.apply_diff` 时补丁完全没生效、工作区无 `.git`；③ 改成 `context.git.init: true` + `context.git.apply_diff` 后有 `.git`、补丁生效，但无提交、`git diff` 为空 → 技能仍判「没有未提交改动」。fixture 自带 `baseline` 提交后，`git status` 出现 ` M notes/plan.md`、`git diff` 出现一行翻转，用例才真正跑进目标场景 |
| R6 | **单次结果不作数**：runner 强制 `--iteration >= 2`（拒绝 `<2` 并提示，非静默抬高），按 §3.3-6 自算 flaky（**单一口径 = run 级、全迭代并集**）；任一条用例 flaky → 该用例结论为「无效（flaky）」（L1） | 实测：同一条用例两遍一过一挂。单次通过率当门禁会今天绿明天红；且工具报告里没有 flaky 字段，必须由 runner 从 `benchmark.json` 的 `runs[]` 自算（BE-1-02） |
| R7 | **基线必开**（`benchmark.enabled: true`；**启动前闸门 ⑦：关掉 → 码 4，不跑**——工具允许关，工装不允许）。指标 = `delta = 全过率(装) − 全过率(不装)`（§1.5），**不是绝对通过率**；每用例的达标下界写 `expected.md` 的 `delta.min`（§3.2.2） | 绝对通过率说不出「技能有没有用」；差值才能。**旧版只用单标量 `required_passed` 判达标，会在「两臂都全过、差值 = 0」时报 VALID——那恰好是唯一要抓的场景**（2026-10-22 三层改造的起因）。对照组构成必须声明：共享默认系统提示 + 默认工具集，差值表述为「技能的边际约束」而非「技能绝对效果」 |
| R8 | **本轮范围只到 `review-triage` 两条用例**。不铺开、不建 CI 门禁。**扩展判据**（下一技能启用，机读口径）：同一技能连续 ≥3 次真跑（每次 `--iteration ≥ 2`），其**全部 gate 用例**的 `delta` 均达阈值、方向一致（`with_skill > without_skill`）且无 flaky → 可选与 `review-triage` 不同任务族（执行类/纪律类）的第二个技能。**「预期值冻结后再首跑」改为状态迁移**：新用例一律 `origin: calibrated`，必须先经一次校准跑并通过 L2 + 达到声明值，才可置 `frozen` 并写 `frozen_since`；**不存在「出生即 frozen」的用例**——旧写法要求「冻结后再首跑」，而首跑前没法校准，首跑不达几乎必然，于是必然把技能误判成退化（2026-10-22 修正） | 先证明方法论成立再谈规模；「成立」要有判据，不是口头 |
| R9 | **结论带引擎与模型边界**。输出三行：①**配置模型**（来自 yaml/环境，注明「请求值」）②**工具观察到的引擎版本**（`observed_configuration.version`，读 `iteration-1/result.json`）③「真实后端未验证，须人工在转发侧确认」。**结论同时限定技能覆盖面**：本轮只覆盖 `review-triage` 两用例，不得外推。**模型账**：存 `.session/eval/state/<技能名>.json`（**产物目录之外**，不被「已存在拒绝 / 删目录重跑」清除——AI-2-02/BE-2-02）；runner 保存上次配置模型，变更时打印「历史结论对该模型不成立，需重跑」 | 实测：报告 `model_name` 就是 yaml 写的配置值，CCR 转发成 GLM 从报告读不出（BE-1-03）；不标注边界的结论会被直接误用；模型账若存产物目录内，删目录重跑时基准必被清空、机制失效 |
| R10 | **预期值先定，跑完再对**。**诚实口径**：本轮预期值仍是试跑校准（`origin: calibrated`），**首轮验收降级为冒烟/回归测试，不代表独立验证**；但从本轮起「预期值本身可不可信」不再靠 mtime 自证——**L2 用离线 oracle 证明断言能被正确行为满足**（不调模型、不读跑分，§3.2.2 ⑤⑥），而「冻结」是状态迁移 `calibrated → frozen`（R8）。<br>**本轮预期值的唯一单源 = `expected.md` 的机读块**（§3.2.2；本节只解释取向并记录**实测结果**，不复述阈值——阈值见 §3.2.2 示例）：<br>· **L1 用例可用性**：gate 用例任一臂 flaky → 该用例不可用，整轮 `INVALID_FLAKY`；<br>· **L2 断言可达性**：每条用例的断言必须被手写 oracle 样本满足——不满足在**启动前**就码 4，不花模型调用；<br>· **L3 技能有效性**：`delta = 全过率(装) − 全过率(不装) ≥ delta.min` 才算达标，绝对通过率不作判据；<br>· **用例 02 = `gate`**：`with_skill` / `without_skill` / `delta` 三个下界都取满值（具体数值见 §3.2.2 示例；实测：装 7/7 全过、不装 0/7 全过）；**该实测所用断言集 = `["必须 review","机器判不了"]`**，其 `assert_hash` 记进 `fixtures/RECORD.md`；**断言集任何改动即作废该实测**，必须重跑校准后方可引用（QA-8C-03）；<br>· **用例 01 = `probe`**：`arms` / `delta` 必须为 null，只留 flaky 记录与人工复核。**2026-10-22 实测（fixture 修好后 4 次真跑 × 每次 3 迭代，每臂 12 个 run）**：装技能 **12/12 run 全过**、不装技能 **0/12 run 全过**、四次均 `flaky=否`、`delta=1.0`——**该 12/12 实测所用断言集 = `["可直接提交","git diff","notes/plan.md"]`**（试跑配置文件 `.session/eval/trial/exp-fixture/review-triage/evals/cases/01-checkbox-fixture.yaml` L12–15），其 `assert_hash` 必须记进 `fixtures/RECORD.md`，**断言集任何改动即作废该实测**（与 02 同一条规矩，2026-10-22 第 9 轮 AU-9-08）；满足 R8「连续 ≥3 次真跑」的升级门槛；本轮按用户 2026-10-22 裁定「先保持 `probe`」，施工时可按 R8 迁移为 `gate`（迁移时按 §3.2.2 示例填 `arms` / `delta` 三个阈值，不得另定一套数值）。**01 的 `must_contain` 必须同时含结论词、证据词与主锚点**（本轮为「可直接提交」+「git diff」+「notes/plan.md」）：实测只留「可直接提交」时，不装技能臂 3 次里 1 次误过 → `flaky=是`、`delta=0.667`；**结论词判别力不足会伪造出 flaky**，这不是模型抖动；<br>· **判定顺序固定**：L2 启动前闸门 → L1 flaky → L3 delta。实测不达 → **先怀疑用例并改用例**，不得改技能去迁就用例（§6-1）；但 `origin: frozen` 的用例不达时判「技能退化」（§3.3-7） | 议会第 1 轮 AI-1-01 铁证：禁词「纯文档」在技能目录 grep 0 命中、只能从模型输出挖出——预期值是倒推的。不承认校准，首轮验收就是自证；第 2 轮 AI-2-01 + 第 3 轮 RD-3-03：用例 02 不装臂必须是 0/2 通过断言（方向写反会让装/不装零差值、与 §3.5/§0 冲突），且「1/2」必然 flaky，统一三处口径 |

## 3 细节

### 3.1 目录结构

```text
evals/
└── review-triage/
    ├── eval.yaml
    ├── expected.md                             # R10 预期值 + 冒烟口径声明 + **机读块**（`schema: eval-expectation/v2`，三层判据的唯一输入，契约见 §3.2.2；先于首次真跑）
    ├── frozen-ledger.json                      # R8 状态迁移留痕（**进 git**）：`origin: frozen` 的唯一凭据，字段见 §3.2.2③
    ├── cases/
    │   ├── 01-checkbox-mechanical.yaml
    │   └── 02-command-swap-semantic.yaml
    └── fixtures/
        ├── CONTRACT.json                           # A1 输出的契约快照（六类文件 sha256；runner 启动前 ⑧ 按它拦「改了没重跑」，§3.4）
        ├── repos/
        │   ├── checkbox-demo/                      # **源目录**（纯文件、不带 `.git`；runner 物化到 `.session/eval/fixture/` 再提交 baseline）
        │   │   └── notes/plan.md                   # 改动前版本（仍为 [ ]）
        │   └── command-swap-demo/                  # 02 的**源目录**（同上；`package.json` + `scripts/{lint,typecheck}.mjs` + `scripts/precommit.sh`）
        ├── diffs/
        │   ├── checkbox.patch                      # 把 [ ] 改为 [x]（01 用，经 context.git.apply_diff 打上）
        │   └── command-swap.patch                  # 把 `npm run check` 换成 `npm run check:all`（02 用，同上）
        ├── oracle/                                  # L2 唯一输入：手写正确答案（§1.5），进 git
        │   ├── 01-checkbox-mechanical.md
        │   └── 02-command-swap-semantic.md
        ├── RECORD.md                               # §4 步骤 0 的自查与取证记录（进 git；不得写进 yaml 的 description / prompt）
        ├── calibration/                            # frozen 留痕凭证：<eval_name>/ 下放该次 benchmark.json + verdict 行（§3.2.2③；有 frozen 用例时才建）
        └── responses/                              # 固化历史样本（进 git，只作人读证据，不参与机器判定）
            ├── 01-with-skill.correct.md
            ├── 01-with-skill.no-execution.md
            ├── 01-with-skill.no-gitdiff-literal.md
            ├── 01-without-skill.wrong.md
            ├── 02-without-skill.run-verify.md
            └── flaky-evidence/                      # flaky 回归证据（同臂多 run，判据 = run 级结论不一致）
                ├── out3-iteration-1-benchmark.json
                └── out3-iteration-2-benchmark.json
```

- `fixtures/repos/checkbox-demo/` 是**源目录**，**以纯文件形式入库、仓库内不带 `.git`**（`context.git.init` 只建空仓库、不做提交；外层 git 会把含 `.git` 的子目录当嵌套仓库 → gitlink / 告警，见 BE-8-08）。**物化按仓库名（不是 case-id）**：runner 启动时把 `evals/<技能名>/fixtures/repos/<repo-name>/` 复制到 `.session/eval/fixture/<技能名>/<repo-name>/`，**每次先删后建**，再 `git init` → `git add -A` → `git commit -m baseline`。**用例 yaml 的 `context.repo_fixture` 直接写物化路径的静态相对值**：`../.session/eval/fixture/<技能名>/<repo-name>`（相对 `evals/` 目录，§3.2.1 单一基准）——**不在运行期改写 yaml**；runner 只按「`repo_fixture` 的 basename 必须对应 `fixtures/repos/<basename>/` 源目录」这条约定物化（2026-10-22 互测：旧稿写「`repo_fixture` 传该副本」但没有任何传递机制，工具只读 yaml，等于跑不到）。这样克隆后不缺 baseline、不污染外层仓库、也不引入第二套改写机制。若 §4 步骤 0 的 `..` 正向观测失败，才退回「复制 yaml 到 `.session/eval-run/` 并改写成绝对路径」的备选方案（备选方案必须同时把该事实写进 `RECORD.md`）。
- 用例文件名（去扩展名）与 yaml `id` 必须逐字相同（BE-1-13）；本 spec 以 yaml `id` 为权威，文件名仅供人读。
- `fixtures/oracle/` 是 L2 的唯一输入：**手写**的正确答案回复（§1.5）。它取代了旧版 `01-with-skill.fixture-correct.md`——那份由模型实跑产出，等于用被检验的那次运行给断言定真值（自证循环，2026-10-22 移除）。
- `fixtures/responses/` 存放从 `.session/eval/trial/` 固化的历史样本：**不参与评测 verdict、不进 runner 判定链**，只作人读证据与「断言词表设计检查」的离线材料；**不得充当 oracle**（旧版让锚点正样本依赖施工期产出，同属自证循环）。**唯一授权的机器用途**：A1 离线契约脚本（`scripts/check-eval-contract.mjs`）按 §3.4「禁词双向验证」核对 `RECORD.md` 登记的反向证据是否真的命中——它不读跑分、不产 verdict、不改变任何用例的合格性结论（2026-10-22 互测 S10；旧稿写「不参与任何机器判定」，让 §3.4 的硬规矩没有执行入口）。
- 新增技能用例时按同一结构追加 `evals/<技能名>/`，不改已有目录。

### 3.2 `eval.yaml` 契约（本轮固定值）

| 字段 | 值 | 说明 |
|---|---|---|
| `schema_version` | `v1alpha1` | 工具固定值 |
| `environment.type` | `none` | 本轮不隔离沙箱；副作用由「只读 prompt + fixture 仓库」兜住 |
| `skills[0].source` | `local_path` | 指向仓库内真技能目录 |
| `skills[0].path` | `../skills/review-triage`（**相对 `evals/` 目录**——工具按兜底基准 `<eval.yaml 所在目录>/..` 解析；上送工具前由 runner 解析成**绝对路径**再注入 yaml） | `skills[].path` 与用例侧路径**同一基准**（§3.2.1），不能以 `skills/<技能名>/` 为基准（技能根由它决定，会循环），也不能写成 `skills/<技能名>`（会解析成 `evals/skills/<技能名>`、找不到）。**不用 `.`**（`path: .` 会被解析成兜底基准本身，见下方已知缺口；实测 `skill-up validate` 不拦）；`../skills/<技能名>` 的解析必须按 §4 步骤 0 做**正向观测**取证（2026-10-22 第 9 轮 BE-9-02、2026-10-23 实测修正） |
| `engine.name` | `claude_code` | 本机唯一已验证可用的引擎 |
| `engine.model.provider` | 占位由 runner 注入（模板 `{provider}` / `{name}`），原文件不留写死的模型名 | 真实形态是 `provider` + `name` 两个子键的对象（RD-1-01）；注入方式 = runner 启动前把模板替换为环境变量值 |
| `cases.files` | `review-triage/cases/01-….yaml` 等（**相对 `evals/` 目录** = `<eval.yaml 所在目录>/..`；本布局就是 `evals/<技能名>/cases/…` 去掉 `evals/` 前缀） | 工具按兜底基准 `<eval.yaml 所在目录>/..` 解析 yaml 内所有用例与 fixture 路径（2026-10-23 实测：`SKILL.md not found within 10 levels above …\evals\review-triage; falling back to …\evals`，随后报 `failed to read case file` + 旧写法那条两层回跳路径（`../../` 再接 `evals/review-triage/cases/01-checkbox-mechanical.yaml`））。官方 FAQ 的说法是「用例与 fixture 路径相对 SKILL.md 所在目录」，是从「技能装在兜底基准下」的习惯布局推的；我们的 `skills/<技能名>/` 不在 `evals/<技能名>/` 的祖先里，故必须写成 `review-triage/…`。**不得**写成两层回跳再进 `evals` 的形式（相对 `evals/` 会再回跳两层、落到仓库外），也不得写成 `skills/<技能名>/…`（解析成 `evals/skills/…`，静默找不到）（2026-10-22 互测 S7 / 2026-10-23 实测修正） |
| `cases.defaults.timeout_seconds` | `240` | 单用例 4 次调用的实测耗时留足余量 |
| `cases.defaults.max_turns` | `8` | 本技能是单轮分流任务，不需要长流程 |
| `benchmark.enabled` | `true` | R7 |
| `report.formats` | `[json, html]` | json 供机械核对，html 供人读 |

> **已知缺口（实测 2026-10-21）**：`skills[].path: .` **不会**被 `skill-up validate` 拒绝（实测 exit 0）。R1 的「必须指向 `../skills/<技能名>`（相对 `evals/` 目录）」**没有工具级强制**，只能靠 §5① 的结构断言（`evals/` 下不得出现 `SKILL.md`、`skills[].path` 解析后必须指向存在的技能目录）兜住。这条缺口不得被写成「工具会拦住」。

### 3.2.1 用例文件契约（议会第 1 轮 RD-1-04 修复）

`cases/*.yaml` 字段（必填，缺一即不合格）：

| 字段 | 语义 |
|---|---|
| `id` | 与文件名（去扩展名）逐字相同 |
| `title` / `description` | 人读说明；`description` 不得含答案暗示。**`eval_name` 的唯一来源 = `title`**（工具把它写进 `benchmark.json` 的 `eval_name`，runner 的 verdict 行用它做 join 键），且**同一 `eval.yaml` 内 `title` 必须唯一**（同名会把两用例并成一组，BE-6-04）；唯一性由 **§3.2.2 ② 的多重集核对**执行（解析全部 `cases.files` 的 `title`，重复即码 4）——旧稿只写「可机械检查」而不指明由哪一条执行，等于没写（2026-10-22 互测 S13） |
| `input.prompt` | 只给输入，不给答案（§3.4） |
| `expect.must_contain` / `must_not_contain` | 门槛检查；禁令词不得含分档标题（R4-②） |
| `judge.type` / `judge.success[].output_contains.{all,any}` | 判分；**同一断言不得在两处给出不同措辞或不同阈值**（试跑版同一断言两份且不一致，无主次）。**硬约束：`judge` 的关键词必须是 `expect` 已声明的词的子集**——L2 只读 `expect`，只写在 `judge` 而 `expect` 没有的词等于绕开 L2（启动前校验 ⑧ 机械核对：出现子集外的词 → 码 4）。**`judge` 复用 `expect` 已声明的词是允许且推荐**的（同一口径两处共用），不算「重复」。**键白名单（2026-10-22 互测 S12）**：本轮 `expect` 只允许 `must_contain` / `must_not_contain`，`judge` 只允许 `type: rule_based` + `success[].output_contains.{all,any}`，且不得使用 `cases.defaults.expect`；官方支持的其它键（`exit_code` / `files_exist` / `file_contains` / `golden_file` / `tool_called` / `output_matches` 等）**本轮一律禁止**——它们参与工具判分与 `passed/total`，但 L2 读不到、`assert_hash` 也不覆盖，用了就等于留一个「冻结后悄悄放宽判据」的口子；越界 → 启动前 ⑧ 码 4。以后要用，必须同批扩 L2 与 `assert_hash` |
| `context.repo_fixture` + `context.git.apply_diff` | R5 fixture。**`apply_diff` 必须嵌在 `context.git` 下**（写成 `context.apply_diff` 会被静默忽略、补丁不生效）；`context.git` 还可写 `init` / `checkout` / `remotes`。**`repo_fixture` 写物化路径的静态相对值** `../.session/eval/fixture/<技能名>/<repo-name>`（相对 `evals/` 目录，§3.1；源目录 = `fixtures/repos/<repo-name>/`，basename 必须与源目录同名），**由 runner 负责物化、不在运行期改写 yaml**。路径必须在启动前校验 ⑥ 核对存在（**物化发生在核对之前**），**有凭据时**按 §4 步骤 0 实测取证，无凭据只能如实记「未取证」 |
| `expect.must_contain` / `expect.must_not_contain` 的**书写形态** | 必须是**块列表**（每项一行、双引号包裹，如 `  - "可直接提交"`）。L2 的机读块核对用行级正则抽这两组词，与 `expected.md` 的 `assert` 块逐项比对（§3.2.2 ④）；写成行内 `[a, b]` → 抽取失败 → 码 4。**`judge` 的 `output_contains.all` / `any` 同样必须是块列表**（行内数组会被抽成空集，使「judge ⊆ expect」恒真、L2 空转——BE-8-07）。`judge` 段不参与 L2（其关键词必须是 `expect` 子集，见上一行） |
| **相对路径基准（单一）** | `cases.files` / `oracle` / `context.repo_fixture` / `context.git.apply_diff` / `skills[].path` 一律相对 **`evals/` 目录**（= `<eval.yaml 所在目录>/..`）解析——**与 skill-up v0.14.0 实测的兜底基准逐字一致**（2026-10-23 实测）。理由：工具把 `<eval.yaml 所在目录>/..` 当作兜底基准，而我们的技能根 `skills/<技能名>/` **不在 `evals/<技能名>/` 的祖先里**，所以旧口径（基准取 `skills/<技能名>/`）在本布局下不成立。实测报错原文摘要：`SKILL.md not found within 10 levels above D:\Seed\retro-skills\evals\review-triage; falling back to D:\Seed\retro-skills\evals`，随后 `failed to read case file` + 旧写法那条两层回跳路径（`../../` 再接 `evals/review-triage/cases/01-checkbox-mechanical.yaml`）——即旧写法会相对 `evals/` 再回跳两层、落到仓库外。本布局的写法：`cases.files` / `oracle` / `apply_diff` 写 `review-triage/…`（如 `review-triage/cases/01-….yaml`、`review-triage/fixtures/oracle/…`、`review-triage/fixtures/diffs/….patch`）；`repo_fixture` 写 `../.session/eval/fixture/<技能名>/<repo-name>`（物化路径，§3.1）；`skills[].path` 写 `../skills/<技能名>`（§3.2）。**`repoRoot` 由 eval.yaml 位置推导**：`repoRoot = <eval.yaml 所在目录>/../..`；**`<eval.yaml 所在目录>/..` 的末级目录必须名为 `evals`**（即 eval.yaml 必须位于 `evals/<技能名>/` 下），否则码 4；`evalsDir = <eval.yaml 所在目录>/..`；`skillRoot = repoRoot/skills/<技能名>`。**故障注入副本必须同构**：`<副本根>/evals/<技能名>/eval.yaml` 与 `<副本根>/skills/<技能名>/` 两层都在——否则副本里的 `review-triage/…` 会解析回真仓库，删 oracle / 改 cases 全部落空（2026-10-22 第 9 轮 BE-9-02；QA 复评指出旧句把「末级 = evals」错挂在 `../..` 上，逻辑上不可能成立，已改为挂在 `..` 上）。runner 自己的路径解析（§3.3-1）与写进 yaml 的值**必须是同一个基准**——两套基准并存会让闸门 ⑥ 全绿而工具找不到文件（2026-10-22 互测 S7：旧稿三处分别写成「eval.yaml 所在目录」「仓库根」「cwd」；2026-10-23 实测再把「技能根目录」统一成 `evals/` 目录）。A1 契约脚本已按此写死（`YAML-1` 要求 `cases.files` 写成 `<技能名>/cases/*.yaml`、`YAML-7` 要求 `skills[].path` 为 `../skills/<技能名>`）。临时副本与仓库正本行为一致（否则副本里删 oracle 会去读正本、负例永远拦不住） |

### 3.2.2 `expected.md` 机读块契约（三层判据的唯一单源，2026-10-22 新增）

`expected.md` = 人读说明 + **一个** fenced `json` 块；runner 只读那个块。文件内 `json` 围栏块不是恰好一个 → 码 4。

```json
{
  "schema": "eval-expectation/v2",
  "skill": "review-triage",
  "iteration_min": 2,
  "cases": [
    {
      "eval_name": "执行动作替换应判为必须 review",
      "role": "gate",
      "origin": "calibrated",
      "oracle": "review-triage/fixtures/oracle/02-command-swap-semantic.md",
      "anchors": ["check:all"],
      "assert": {
        "must_contain": ["必须 review", "机器判不了"],
        "must_not_contain": ["纯文档", "低风险", "不涉及代码", "不影响代码"]
      },
      "arms": {
        "with_skill": { "min_rate": 1.0 },
        "without_skill": { "max_rate": 0.0 }
      },
      "delta": { "min": 1.0 }
    },
    {
      "eval_name": "纯勾选改动应判为可直接提交",
      "role": "probe",
      "origin": "calibrated",
      "oracle": "review-triage/fixtures/oracle/01-checkbox-mechanical.md",
      "anchors": ["notes/plan.md"],
      "assert": {
        "must_contain": ["可直接提交", "git diff", "notes/plan.md"],
        "must_not_contain": ["纯文档", "低风险", "不涉及代码", "不影响代码"]
      },
      "arms": null,
      "delta": null
    }
  ]
}
```

**字段语义**：

| 字段 | 语义 |
|---|---|
| `eval_name` | **join 键**，与用例 yaml 的 `title` 逐字相同（§3.2.1）；集合必须与 `cases.files` 的 `title` 集合**双向相等** |
| `role` | `gate`（进 L1 + L3）/ `probe`（只进 L1 + 人工复核） |
| `origin` | `calibrated`（试跑校准；不达 → 判「用例需校准」）/ `frozen`（须带 `frozen_since`；不达 → 判「技能退化」） |
| `oracle` | 手写标准答案，**相对 `evals/` 目录**（与 §3.2.1 同一基准；本布局写作 `review-triage/fixtures/oracle/…`）解析；文件必须存在 |
| `anchors` | 主锚点数组。**该用例声明了 `context.git.apply_diff` 时不得为空**（`gate` 不单独强制，判据挂在 `apply_diff` 上）；**只有未声明 `apply_diff` 的用例才允许 `[]`**——本轮 02 已声明 `context.git.apply_diff`（执行动作替换必须实跑才看得见），故其 `anchors` 不得为空、现为 `["check:all"]`；01 同理为 `["notes/plan.md"]`。**不以「`assert.must_contain` 里出现锚点串」为触发条件**：锚点串由 `anchors` 自己定义，拿它当触发会构成循环（`anchors: []` 时条件永不成立、规则空转；2026-10-22 第 9 轮 AI-9-02）。非空时每项必须「prompt 中 0 命中 + oracle 中 ≥1 命中」 |
| `assert` | 与用例 yaml 的 `expect` 两组词**逐项相等**，是 L2 的输入（runner 不解析 YAML 语义，只做行级抽取 + 比对） |
| `arms.*.min_rate` / `max_rate` | 该臂全过率的上下界（0–1）；`gate` 必填，`probe` 必须为 `null` |
| `delta.min` | 达标差值下界，`0 < delta.min ≤ 1`；`gate` 必填，`probe` 必须为 `null`。**阈值粒度**：n=2 时某臂全过率只能取 {0, 0.5, 1}，声明值应落在这些格上（`0.8` 等价于「必须 1.0」）；声明时写明适用的 n（2026-10-22 第 9 轮 AI-9-06，P2 记录） |

**机读块核对 ①–⑦（启动前执行；任一不过 → 码 4、不产 verdict 行、不花模型调用）**：

① JSON 可解析且 `schema === "eval-expectation/v2"`；
② `eval_name` 集合与 `cases.files` 的 `title` **多重集（不去重）**双向相等（缺用例、多写用例都算错），且 `title` 逐个唯一——**重名即码 4**（集合比较会把两条同名用例去重后判「相等」，随后工具把两用例并成一组、flaky 与全过率在混合数据上算，verdict 必错；2026-10-22 互测 S13）；
③ `role ∈ {gate, probe}`、`origin ∈ {calibrated, frozen}`；`origin: frozen` 必须带 `frozen_since`，且 **`evals/<技能名>/frozen-ledger.json`（进 git）**里有同 `eval_name` 的记录，字段至少 `{eval_name, frozen_since, verified_at, arms_snapshot, delta_at_verify, assert_hash}`——无记录或字段缺项 → 码 4；**`assert_hash` 必须覆盖 `assert` + `anchors` + `arms` + `delta`，且 `arms_snapshot` 与当前 `arms` / `delta` 逐项相等——任一不一致 → 该记录失效 → 码 4（reason=配置错误）**，提示按 §4 步骤 3 重新校准并更新 ledger；**不做静默降级为 `calibrated`**（降级会把真实退化报成「用例需校准」，且与 ⑧「③ 不过 → 码 4」互斥——只哈希 `assert` 会让「偷偷抬高阈值」仍算 frozen，把「用例改严了」报成「技能退化」；2026-10-22 互测 S5）。**算法写死**：`assert_hash = sha256(canonical JSON)`，canonical = 键名升序、无多余空白、数值按 JSON 原样；**生成方式**：施工/校准的人用一条 `node -e` 命令算出并写入 ledger，取数命令与结果记进 `fixtures/RECORD.md`，runner 只复算比对、不生成（BE-8-04 / QA-8-03）；**`verified_at` 必须是进 git 的凭证**：把该次校准的 `benchmark.json` 与对应 verdict 行复制到 `evals/<技能名>/fixtures/calibration/<eval_name>/`，ledger 的 `verified_at` 指向该目录，并同时落 `verified_snapshot: {iterations, runs, undet, flaky, delta}`；**不得只指向 `.session/`**（不进 git、克隆即失，会让「已校准」只能靠人记得；2026-10-22 第 9 轮 AI-9-03）；`.session/eval/state/` 只放模型账，不承担冻结留痕；
④ `role` 与 `arms` / `delta` 形态一致；数值域合法：`0 ≤ min_rate ≤ 1`、`0 ≤ max_rate ≤ 1`、`0 < delta.min ≤ 1`，且 `gate` 的 `with_skill.min_rate ≥ 0.8`（防止「两臂都低、差值凑够」被当达标）；**不做「`min_rate ≥ max_rate + delta.min`」式的可达性否决**——那是伪矛盾（`min_rate=0.5 / max_rate=0.0 / delta.min=1.0` 完全可达），而该不等式一旦成立会让 `delta` 判据恒真；`assert` 两组词与用例 yaml 的 `expect` 逐项相等，且 yaml `judge` 段关键词必须是 `expect` 词集的子集（越界 → 码 4）；`anchors` 遵守字段表：**声明了 `context.git.apply_diff` 的用例不得为空**（`gate` 不单独强制，判据挂在 `apply_diff` 上；本轮 02 已声明 `apply_diff`，故 `[]` 不合法、其 `anchors` 现为 `["check:all"]`——`[]` 只对未声明 `apply_diff` 的用例合法）；**`expect` / `judge` 只允许 §3.2.1 键白名单里的键**（出现 `exit_code` / `files_exist` / `file_contains` / `golden_file` / `tool_called` / `output_matches` / `cases.defaults.expect` 任一 → 码 4）；
⑤ `oracle` 文件存在，且用 runner 的断言匹配器（**纯子串匹配，与工具判分同口径**：官方文档口径是「所列字符串均不能出现」，**没有否定豁免**；故本工装也不做豁免，见 §3.4）跑它时**全部断言过**（`must_contain` 全命中、`must_not_contain` 全不命中）；
⑥ `anchors` 每项：「prompt 中 0 命中」+「oracle 中 ≥1 命中」；
⑦ `iteration_min ≥ 2` 且 `iteration_min ≤ 本次 --iteration`（**启动前判据，不过 → 码 4**）。**运行后的数据量闸门不属于 ①–⑦**：它是 §3.3-6 的独立规则（「运行后数据量闸门」，只对 `gate`，归 `INVALID_ENV` / 码 2）——两个阶段、两种码，不得互相冒充（2026-10-22 互测：旧稿把运行后闸门写在 ⑦ 内，与「①–⑦ 任一不过 → 码 4」直接互斥）。

> **为什么这层必须离开跑分**：旧版让预期值、锚点、flaky 三件事共用一份跑分数据，于是出现「同一份证据既证明 flaky 成立、又要求非 flaky 才能达标」这种解不开的悖论（2026-10-22 审计）。L2 只吃 yaml + 手写样本，零成本、结果确定——它把「断言本身立不立得住」变成开跑前就能回答的问题。

### 3.3 runner 契约（`scripts/run-eval.mjs`）

**职责边界**：runner 不做**断言**判分（判分全在 skill-up），但做**稳定性汇总**（从 `benchmark.json` 自算 flaky）与**环境/路径/产物管理**。共七件事：

1. **固定 cwd 与路径解析**（BE-1-01）：用 `fileURLToPath(import.meta.url)` **只定位脚本自身**；`repoRoot` 一律由 eval.yaml 位置推导（下句），**不得**从脚本位置推——两者在 `$env:TEMP` 副本场景会分叉（2026-10-22 第 9 轮 Q-9-补1）。**路径基准由 eval.yaml 位置推导**：`repoRoot = <eval.yaml 所在目录>/../..`；**`<eval.yaml 所在目录>/..` 的末级必须为 `evals`**（eval.yaml 位于 `evals/<技能名>/` 下），否则码 4；`skillRoot = repoRoot/skills/<技能名>`。`spawnSync` 显式传 `cwd: repoRoot`（固定 cwd，BE-1-01）。`skills[].path` 按 `evals/` 目录（`evalsDir`）解析成绝对路径后**注入 yaml**（工具只看到绝对值）；`cases.files` / `repo_fixture` / `apply_diff` / `oracle` 同样由 runner 按 `evalsDir` 解析**用于 ⑥ 与 ⑨ 的校验**，**yaml 里的值保持相对、不改写**（工具按同一基准 `evalsDir` 自己解析）。**不得**给用例侧路径用 cwd / 仓库根 / eval.yaml 目录 / 技能根另算一套——两套基准会让闸门 ⑥ 全绿而工具找不到文件（2026-10-22 互测 S7 / 第 9 轮 BE-9-02）。`--output-dir` 与 `--eval-yaml` 一律先 `resolve()` 成绝对路径再传。
2. **定位二进制**：依次取 `SKILL_UP_BIN` 环境变量 → `PATH` 中的 `skill-up`；都找不到 → 打印安装指引并非 0 退出（不得静默跳过）。`SKILL_UP_BIN` 可指向 `.mjs` 桩（runner 用 `process.execPath` 拉起，QA-1-10）。
3. **固定参数**：默认参数 = `run <解析后 eval.yaml 绝对路径> --output-dir <解析后 .session/eval/out/<技能名> 绝对路径> --iteration <N>`，`N` 默认 2、拒绝 `<2`（R6）；**`--baseline` 按 yaml 的 `benchmark.enabled` 值决定是否传**（yaml=true → 传；false → 不传——BE-2-03，消除两处表达冲突）。**runner 接受显式 `--eval-yaml <path>` / `--output-dir <path>` 覆盖默认值**（供临时副本故障注入与测试场景，如 TC-023/TC-043；显式值同样 resolve 成绝对路径，「产物目录已存在拒绝」对显式 output-dir 同样适用，BE-4-01/QE-4-01）。
4. **注入模型**（RD-1-01，RD-2-02 补失败路径）：启动前把 eval.yaml 模板的 `{provider}` / `{name}` 替换为环境变量 **`EVAL_MODEL_PROVIDER` / `EVAL_MODEL_NAME`（变量名定死，实现不得改名）**，完成后还原原文件。**环境变量缺失 → 退出码 2（环境不可用）并打印缺哪个变量**；**`--dry-run` 不注入模型、也不要求这两个变量已导出**（dry-run 只做前置校验与打印，若校验清单命中缺失也应归码 2，但正常路径不检查变量，RD-6-03/AU-6-05）。还原失败（原文件被污染）→ 报错非 0 退出。**异常安全（BE-4-04）**：注入-还原用 try/finally（正常与 spawn 失败路径均还原）；runner 启动时先检测 eval.yaml 的 `engine.model` 是否仍为模板占位（`{provider}`/`{name}`）——**主判据 = 占位缺失即视为残留**（与厂商无关，换 OpenAI / 自建模型名同样能拦），`claude-|anthropic|glm` 词表只作快速路径、不得当唯一判据（RD-5-04 / BE-5-02）；有残留先还原或报错非 0，防 Ctrl+C/崩溃中断把实际模型名留在仓库文件里。
5. **产物生命周期**（BE-1-06）：`--dry-run` **只做前置校验 + 打印，不执行工具、不写 `<output-dir>` 与 `verdict.md`、不透传工具退出码**（BE-5-01）；这里的「产物」专指**评测产物**（`<output-dir>` / `verdict.md` / 报告），**允许**把 fixture 物化到 `.session/eval/fixture/<技能名>/<repo-name>/`——物化是 ⑥ 的输入，不允许写就与 ⑥ 互斥（2026-10-22 互测 S8）；前置校验固定为 ①–⑨，任一不过按其码退出、**不产 verdict 行、不花模型调用**：① 二进制定位（`SKILL_UP_BIN` → `PATH`，缺失 → 码 2；**dry-run 同样生效**，BE-6-10）② eval.yaml 可解析（坏/缺失 → 码 4）③ 用例集非空（空 → 码 3，reason=`无可用用例`）④ `<output-dir>` 不存在（已存在 → 码 4）⑤ `--iteration ≥ 2`（`<2` → 码 4，参数非法，BE-6-07）⑥ **路径与 fixture（按序执行，不得调换）**：**⑥-1** 源目录 `fixtures/repos/<repo_fixture 的 basename>/` 必须存在（缺 → 码 4，reason=配置错误）；**⑥-2** 物化到 `.session/eval/fixture/<技能名>/<repo-name>/`（先删后建；**所有被引用的 `repo_fixture` 都要物化**，不只是声明了 `apply_diff` 的用例——否则 TC-023 这类故意不给补丁的用例会先撞「路径不存在」）；**⑥-3** **物化后**的 `repo_fixture` / `apply_diff` 解析后必须存在（→ 码 4；**工具不校验这两类**——实测 `path: .` 与不存在的 fixture 目录都被 validate 放过，2026-10-22）；**⑥-4** `skills[].path` 解析后必须存在且含 `SKILL.md`，且 `apply_diff` 必须写在 `context.git` 下（顶层出现 `context.apply_diff` → 码 4）；**⑥-5** 仅对声明了 `context.git.apply_diff` 的用例核 `git rev-parse HEAD` 成功、`git apply --check <补丁>` 退出 0（未声明的不查 baseline；**也不要求工作区干净或有差异**——`git status --porcelain` 非空是运行后观测）。**仓库内 fixture 目录不要求、也不应带 `.git`**（带了会被外层 git 当嵌套仓库）。**所有启动前失败的单行 `<细节>` 必须含失败项编号（①–⑨；⑥ 内为 ⑥-1…⑥-5）与对象名**（如 `apply_diff 层级错` / `fixture 缺 baseline`）——否则无法定位，用例也无法机械判（2026-10-22 第 9 轮 QA-9-03 / RD-9-03 / AU-9-04）。⑦ `benchmark.enabled === true`（→ 码 4，R7）⑧ **配置一致性**：`expected.md` 机读块结构 ①–④ 与 `iteration_min`（→ 码 4，§3.2.2）；**并且 `fixtures/CONTRACT.json` 必须存在、`exit === 0`、其 `files` 里每个文件的当前 sha256 与记录一致**——缺失或不一致 → 码 4（reason=配置错误，提示先跑 A1 `node scripts/check-eval-contract.mjs`；2026-10-22 互测：否则 A1 只是「有人想起来才跑」的纪律，改了判据没人发现）⑨ 机读块 ⑤–⑥：oracle 存在且其断言全过、锚点双向核对（→ 码 4，§3.2.2），全部通过才**逐项打印 ①–⑨ 的通过标记**、打印完整命令行与全部 resolve 后的绝对路径并返回 0。真跑（不带 `--dry-run`）才调用工具，退出码按 §3.3-6 由自判定与表外码例外决定。启动前检查 `<output-dir>` 已存在 → 码 4 退出并提示（避免覆盖旧结果）——本轮选「已存在则拒绝」，写进 §5。
6. **退出码与稳定性汇总**：**工具码只写进行内 `exit=`，runner 码一律按本节末的「工具码 × 数据完整性二维表 ①–⑤」推导**（旧句「skill-up 非 0 → runner 非 0」是二维表引入前的直等，已废止——不装臂失败是设计内事件，见 ①；2026-10-23 审查：该旧句与 ① 相反，留着会让读者二选一）；**flaky 判定（L1）** = 先枚举 `<output-dir>/iteration-*/benchmark.json` **全部取并集**（**不是只读 `iteration-1`**——实测每次 `--iteration` 落一个目录，只读一个会让 flaky 恒判「否」），把全部 `runs[]` 按 **`eval_name + configuration`** 分组（不用 `eval_id`——实测恒为 0，无法区分用例，QA-2-01）；每个 run 先按 §1.5 判三态 `full` / `partial` / `undetermined`（**空 `passed` / `total` 必须归 `undetermined`**：2026-10-22 实验里 `Connection refused` 的 run 就是这种；当成「未全过」会伪造 flaky，当成「全过」会伪造达标）；同组内 `full` 与 `partial` 并存即 flaky，`undetermined` 不参与判定（BE-2-06：同断言配置前提由「本次运行内配置固定」保证）。**用例级聚合 = OR**：任一 `configuration` 为 flaky 即该用例 flaky，verdict 行写 `flaky=是`；一臂抖一臂稳时不得写 `flaky=否`（AI-6-02）。**gate 用例某臂 `determined` run 数为 0 → 该用例未判定 → `INVALID_ENV`、码 2**（数据根本没有，不得写成达标或不达标）；**运行后数据量闸门（2026-10-22 互测 S1）**：**迭代目录数 n 的定义 = 有可解析 `benchmark.json` 且被采纳的 `iteration-*` 目录数**（坏产物所在目录不计入——它没贡献任何 run；一个都解析不出时 n = 0、行内写 `n/a` 不写 `0`；与 §3.3-7 的 `iteration=<n>` 同一个定义，别处不再另算，2026-10-23 审查 F7）；n < `iteration_min` **或** 任一臂 determined run 数 < `iteration_min` → `INVALID_ENV` / 码 2——否则工具在 iteration-1 之后失败时，1 个目录也能凑出 `VALID`，把 R6「单次结果不作数」绕过；**只对 `gate` 生效**（`probe` 不套，见 §3.3-7 的三值封顶——把 probe 的环境抖动升级成码 2 会与「码 0 只看 gate」相反）；**probe 的同类情形只写行内 `flaky=未判定` / `INVALID_ENV`，不改退出码**（码 0 只看 gate——QA-8-02）。**undetermined 必须可见**：verdict 行**恒带** `undet=<装臂 undetermined 数>/<不装臂 undetermined 数>`；任一臂 `undetermined > 0` 时另逐条打印该 run 的 `eval_name` / `configuration` / 原始 `passed,total`——否则「环境失败」会被静默洗成「稳定通过」。**一个 `benchmark.json` 都没有 → stdout 必须打印 `flaky 未判定（无产物）`**，不得打印 `flaky=否` 冒充稳定（BE-6-03 / RD-6-02）。**n=2 的检出上限必须诚实**：单次失败概率 p 时，两次运行观测到不一致的概率 = 2p(1−p) ≤ 50%（p=0.5 时最大）；故 `flaky=否` 只表示「两次观测一致」，**不等于「已验证稳定」**，该语义必须写进 verdict.md 结论边界第 5 行（AI-6-03）。**退出码表**（BE-1-05，2026-10-22 第 8 轮定稿口径）：`0` 全部 **gate** 用例 `VALID` 且 **gate 无 flaky**（probe 的 flaky / env 失败只记行、不改退出码）；`1` gate 用例有 `INVALID_DELTA` / `INVALID_ASSERT`；`2` 环境不可用（二进制/凭据/网络/模型变量缺失/单 run 超时 / **gate 用例某臂 determined run 数 = 0** / **无 `benchmark.json`**）；`3` 结论无效（**gate** flaky、0 用例、或 **gate 用例数 = 0**——全是 probe 时「通过」是空话）；`4` 配置错误（eval.yaml 缺失/坏、`--iteration < 2` 参数非法、**产物目录已存在**、**§3.2.2 机读块 ①–⑦ 任一不过**、**`benchmark.enabled` 非 true**、**`skills[].path` / fixture 路径不存在 / fixture 缺 baseline**）。**工具的 0–4 号退出码不直接决定 runner 码**：工具码只写进行内 `exit=`，runner 码按上表由自判定得出（工具「评测不通过」是否退 1 尚无实测，**不得**把二者等同——BE-8-01）。**唯一例外：工具退出码 ∉ {0,1,2,3,4}（如 5）→ 原样透传**，且此时仍产 verdict 行（QA-2-06 / BE-6-07）。**启动前多条件同时不满足 → 按 ①–⑨ 顺序取首个失败项的码**（顺序优先，不按配置/环境归类优先——BE-8-02）。**进入运行后的多行取码（2026-10-22 互测 S2）**：每行 verdict 先按 §3.3-7 定，runner 码再按跨行优先级 `2 > 3 > 1 > 0` 取最高（环境不可用压过结论无效——一行 gate 结论都不可信时，报「无效」会掩盖「没数据」）；**取码集合 = `role=gate` 的行；`probe` 行只打印、永不参与退出码**（与 §3.3-7 的「probe 三值封顶 / 码 0 只看 gate」同一条规则——否则 gate flaky(3) + probe env(2) 会被 probe 的环境抖动盖成 2，2026-10-22 互测）；**取码集合为空（全 probe 套件）时跨行优先级不适用**（集合为空、无行可取），单列两句：**有 `benchmark.json` → 码 3；一个 `benchmark.json` 都没有 → 码 2**（环境根本没起来时先报「没数据」，不报「结论无效」；2026-10-23 审查 F13）；表外码透传优先于该顺序。**工具码 × 数据完整性二维表（消除「以工具为准 / 原样透传 / 由 verdict 定码」三说并存，2026-10-22 互测 S6）**：① 工具码 0 或 1 + 数据完整 → verdict 按 L1/L3 出，runner 码由 verdict 定（0/1/3），工具码只写进行内 `exit=`；**不得因工具退 1 就把整轮判失败**——本工装设计上就要求不装臂失败，「有用例失败」是常态而非故障（实测 `case01-stability6.log`「3 passed, 3 failed」无 stderr Error，而全挂的 `case01-stability.log`「0 passed, 6 failed」才出现 Error）；② 工具码 2 或 3（自报环境不可用 / 结论无效）+ 有数据 → 以工具为准，verdict 写 `INVALID_ENV`、runner 码取工具码，行内保留 `exit=`；③ 数据不完整（无 `benchmark.json` 或某臂 determined=0 或数据量不足，**或存在 `configuration` ∉ {with_skill, without_skill} 的 run**——后者不属于任何一臂，按 §3.3-7 落 unknown；当正常数据留下会让残缺数据算出 `rate` 并被写成 `VALID`，故 fail-closed 归本格）→ `INVALID_ENV` / 码 2（**只覆盖工具码 ∈ {0,1,2,3,4}；表外码时本条整条不适用——含 verdict 取值，该行按 ④ 判，不得被本条改写成 `INVALID_ENV`**）；④ 工具码 ∉ {0,1,2,3,4} → runner 码原样透传；**有数据时该行 verdict 仍按 L1/L3 出，不得写 `INVALID_ENV`**（③ 的 fail-closed 对表外码整条不适用），无数据时才写 `INVALID_ENV`（**透传优先于 ③**，与「唯一例外」一致；2026-10-22 互测 T-补：两格相交处写明归属；2026-10-23 审查 F1：`unknown run + 表外码` 必须透传，不得被 ③ 翻成 fail-closed）；⑤ **工具码 4（自报配置错误）+ 数据完整 → runner 码 4、该行 `verdict=INVALID_ENV`、行内保留 `exit=4`**——旧表 ①–④ 无格收码 4（① 只收 0/1、② 只收 2/3、③ 是数据不完整、④ 是表外），`pickExitCode` 对码 4 也不透传，于是全 `VALID` 时 runner 会退 0（fail-open：工具自报配置错误而 CI 判绿；2026-10-23 追问轮）；该情形属**运行期**，与「启动前配置错误（runner 自检）不产 verdict 行」不冲突。**码 2 凭据分支（BE-4-03）**：凭据/认证失败只能从工具 stderr 观测，runner 无法预检（API key 不是 runner 的环境变量）。工具退出非 0 且 stderr 命中认证特征正则 `API[ _-]?key|api_key|credential.{0,20}(missing|invalid|not found|required)|\b401\b|\bunauthorized\b|authentication failed|invalid token|token (expired|invalid)`（**忽略大小写**——JS 实现以 `i` flag 编译，正则字面里不写 `(?i)`；按词边界 / 完整词组匹配，不用裸 `auth` / `token` / 无上下文 `credential`——`author`、`tokenize`、正常提示语里的 credential 会误命中，把工具真实的码 1 吞成码 2**，AI-6-P2）→ **覆盖透传归码 2**（透传优先的唯一显式例外）；**该分支优先于二维表 ①**：工具退 1 + 数据完整 + 认证 stderr → 码 2，**不由 verdict 定码**（凭据失败是环境不可用，不是评测结论）——因此 ① 实际只适用于「工具码 0/1 且 stderr 未命中认证特征」（2026-10-22 互测）；工具自身返回 2 → 以工具为准（BE-5-02）。**超时（BE-6-05）可观测口径**：三支信号任一命中即判超时——① 工具产物 `session-result.json` 的 `exit_code: 124`（路径是嵌套的 `<output-dir>/<case-id>/<configuration>/outputs/agent/run/session-result.json`；官方 L180–183 只在「自定义引擎被杀」时合成，本轮内置适配器下多数不出现，故只作一支，2026-10-22 互测 S3）；② 工具 stderr 命中 `timeout` / `timed out` / `超时`；③ runner 自计时墙钟差 > `迭代数 × 用例数 × 2（臂数）× timeout_seconds × 1.5`（旧式漏乘用例数与臂数：实测 2 用例 1 迭代已耗 326.08 s，按旧式 720 s 只剩 10% 余量，正常变慢就会被误判，2026-10-22 互测 S3）→ 判单 run 超时，属环境类 → 该行 `verdict=INVALID_ENV`、行内 `timeout=是`（**退出码只由 `role=gate` 的行按跨行优先级取；`probe` 行的超时只记行、不改退出码**，与「probe 永不参与退出码」同一条）；**「失败行」定义（2026-10-23 审查 F3）**：**失败行 = 工具退出码 ≠ 0 的行；工具退出码 0 → 一律 `timeout=否`**——超时信号只在失败行采集（工具退 0 表示它自己走完了，此后 stdout / stderr 里出现的 `timeout` 字样属模型回复或提示内容，不得当信号）；**信号作用域**：① 逐 run（`session-result.json` 落在 `<output-dir>/<case-id>/<configuration>/…` 下）、③ 整轮（runner 墙钟是整轮一次计时，不归属任何用例，明细里写 `scope=整轮`、不写用例名），② 整轮（工具 stderr 全局一份，命中即记一条 `scope=整轮`）——**逐 run 的信号才写行内 `timeout=是`，整轮信号命中时所有失败行都写 `timeout=是`**（否则「整轮超时但每行都写否」会让留痕自相矛盾）；spawn 本身报错（ENOENT / EINVAL 等，没有工具码）→ `exit=n/a` 且 `timeout=否`；其余失败行 `timeout=否`。**空 `passed/total` 本身不等于超时**（与 `Connection refused` 同形），不得单凭空值判 `timeout=是`。
7. **结论留痕 + 边界打印**：写 `verdict.md`（F2）到 `<output-dir>/verdict.md`。**真跑路径下，工具退出后 runner 先 `mkdirSync(<output-dir>, {recursive:true})` 再写**——该创建发生在 §3.3-5 ④ 的存在性检查**之后**，不构成「产物目录已存在」；启动前失败仍只写 stdout、不建目录（2026-10-22 第 9 轮 BE-9-03：否则桩退出 / spawn 失败 / 超时三种运行期失败下父目录不存在，`verdict.md` 写不进去，留痕链断裂）。**头部固定「结论边界」五要素**：① 配置模型（标注请求值）② 引擎版本（`observed_configuration.version`）③ 真实后端未验证 ④ 覆盖范围「1 技能 / 2 用例」⑤ **稳定性检出上限**（按本次实际迭代数 n 生成：检出率上界 = `1 − p^n − (1−p)^n`，n=2 时 ≤ 50%；「flaky=否」≠ 已验证稳定，§3.3-6，AI-6-03），另加人工确认行 `actual_model=<值|未确认>`（转发侧确认后回填；TC-037 以该行判定，RD-5-05）。**`--dry-run` 下第②要素（引擎版本）必须显式打印 `n/a（dry-run 未执行工具）`**——它只能从 `iteration-1/result.json` 读，dry-run 不产该文件；**不得静默省略**（2026-10-22 互测 T11：旧稿 §5⑦ 写「两处均含五要素」而不留这个口子，dry-run 下不可满足）。随后**每用例一行**（三层各带自己的字段，不再共用一个标量）：`<eval_name>: role=<gate|probe> iteration=<n|n/a> runs=<装臂 determined 数>/<不装臂 determined 数> undet=<装臂 undetermined 数>/<不装臂 undetermined 数> flaky=<是|否|未判定> rate=<装臂全过率>/<不装臂全过率|未判定> delta=<数值|未达|未判定|n/a> verdict=<枚举> [exit=<工具码>] [timeout=<是|否>]`——`<eval_name>` 必须与 `benchmark.json` 的 `eval_name` 字段逐字相同（**join 键用 `eval_name`，不用 `case_id` / `eval_id`：前者只是文件名、后者恒为 0，BE-5-03**）；`iteration=<n>` 的 n = **有可解析 `benchmark.json` 且被采纳的迭代目录数**（与 §3.3-6 运行后数据量闸门同一个定义），**无迭代目录时写 `n/a`（不得写 0）**（BE-4-02）；**n < `expected.md` 的 `iteration_min` 时，该 `gate` 用例行进 `INVALID_ENV`**（数据不够，不得按小 n 出结论；`probe` 行不因此升码——见 §3.3-6 的「只对 gate」；runner 码在 gate 行上按跨行优先级取，单条 gate 时即 2；结论边界第⑤要素一律按**实际 n** 生成，不得按请求的 `--iteration` 打印，2026-10-22 互测 S1）；**`delta` 四值单源**：`数值` = 算出且达标；`未达` = 算出但低于 `delta.min`（**不得写成 `0` 混同**）；`未判定` = L1 未过（gate flaky / env 失败）故不算差值；`n/a` = `probe`（不进 L3）。
   **`verdict.md` 必须留异常明细（2026-10-23 审查 F2/F4/F5/F6/F14；本段是位置与形态的单源）**：除结论边界头与逐用例行外，**全文最后一段**固定为「## 异常明细」（位置写死，下游按「该标题到文件末尾」切片，不得排在逐用例行之前），逐条落纸**五类**异常：① 被跳过的 `benchmark.json`（`detail-kind=skipped-benchmark`：相对 `<output-dir>` 的路径 + 原因）② `configuration` ∉ {with_skill, without_skill} 的 run（`detail-kind=unknown-config`：`eval_name` + 原始 `configuration`）③ `undetermined` 的 run（`detail-kind=undetermined-run`：`eval_name` + `configuration` + 原始 `passed,total`）④ 命中的超时信号（`detail-kind=timeout`：三支哪一支 + `scope=run|整轮`）⑤ **运行期环境失败**（`detail-kind=runtime-env-fail`：`INVALID_ENV` 但 ①–④ 皆不命中——无可用产物 / 数据量不足 / 认证失败 / spawn 错误 / 工具码 2·3·4 / `eval_name` 不属于 `expected.cases`，附 `exit=<码|n/a>` 与命中证据）。**机读契约（判据只认 token，不认措辞）**：每条**恰好一行**、以 `- ` 开头、首段必须是 `detail-kind=<token>`，token 枚举写死为上列五个，**不得自造**；一条 run 同时命中多类时**合并成一条**并写多个 `detail-kind=`（空格分隔）——不得拆成多条，否则「条数」不可计数；同一 `eval_name` + `configuration` 的同类 run 可合并为一条并附 `count=<n>`。**单行约束**：值里的换行 / 回车 / 制表 / 其它控制字符一律转义成 `\n` / `\r` / `\t` / `\uXXXX` 的字面形式，任何值都不得让本条跨行——否则一个含 `\n## ` 或 `\n<eval_name>: role=… verdict=VALID` 的 `configuration` / 路径 / `e.message` 就能伪造段标题与逐用例行，下游按 `^## ` 切片与 token 比对随之误判（2026-10-23 追问轮 F14）。**无异常时写「无」**——不得省略整段：省掉会让读者无法区分「没有异常」与「没写」；「无」的定义 = 上述五类皆 0 条。**效力边界（2026-10-23 追问轮 RD-1）**：明细段有无条目不改变整轮结论的可信度——该不该信只看逐用例行的 `verdict` / `flaky` / `rate` / `undet` 与结论边界五要素；明细的作用是解释这些数字、定位坏产物，**不得被读成「有异常 = 整轮不可信」**（`probe` 超时、坏产物跳过都能与全 `VALID` / 码 0 并存）。**与 stdout 的关系（2026-10-23 审查 F6）**：明细**以 `verdict.md` 为准**，stdout 不承担判决职能；stdout 侧义务保持既有两类（`undetermined` 逐条打印、无产物时打印 `flaky 未判定（无产物）`），坏产物跳过行可以走 stderr。旧稿「stdout 与 `verdict.md` 同源」**已废止**——实现里坏产物走 stderr、超时只进 `verdict.md`，两处逐字相等做不到，写了只会让测试与实现两边对不上。**为什么必须落进 `verdict.md`**：异常只进 stdout 时，看留痕的人只看到 `flaky=未判定` / `verdict=INVALID_ENV`，分不清是坏产物、未知配置还是超时——结论行可读，但读者无法判断该不该信。
   **失败生命周期（RD-6-02 / BE-6-01 / QA-6-04 统一口径）**：
   - **启动前失败**（runner 自检失败，工具从未被 spawn：§3.3-5 的 ①–⑨ 任一不过——eval.yaml 缺失/坏、用例集空、产物目录已存在、`--iteration < 2`、二进制定位失败、模型变量缺失、`skills[].path` / `context.repo_fixture` / `context.git.apply_diff` 解析后不存在、`apply_diff` 写在 `context` 顶层（会被静默忽略）、`benchmark.enabled` 非 true、`expected.md` 机读块 ①–⑦ 任一不过）→ **不产 verdict 行**，只用 stdout 单行打印 `exit=<code> reason=<环境不可用|配置错误|无可用用例> <细节>`；verdict.md 不存在或仅有结论边界头部——不得伪造 `VALID`（BE-5-03）。
   - **运行期失败**（工具非 0 **且**（无 `benchmark.json` 或数据不足以判定）、spawn 报错、单 run 超时、**工具退出 0 但无 `benchmark.json`**）→ **必产 verdict 行**：`iteration=n/a`（无迭代目录）或已产目录时的实际数；`verdict` 取 `INVALID_ENV`，行内附 `exit=<工具码|n/a>` 与 `timeout=<是|否>`。**凭据失败属运行期**（凭据不是 runner 可预检的变量），不得写成「启动前失败、只 stdout」。**反向也写死**：工具码 ∈ {0,1} 且已产出完整 `benchmark.json` 时**不得**写 `INVALID_ENV`——要按 L1/L3 出 `VALID` / `INVALID_FLAKY` / `INVALID_ASSERT` / `INVALID_DELTA`，退出码按 §3.3-6 的二维表（工具码 0/1 → 由 verdict 定；**不得因工具退 1 就把整轮判失败**——不装臂失败是设计内事件）；**工具码 2/3 时以工具为准**（它自报环境不可用 / 结论无效），即使有完整数据也写 `INVALID_ENV` 并在行内保留 `exit=`；表外码 ∉{0..4} 原样透传（2026-10-22 互测 S6：旧稿「工具非 0」未限定码位，与「以工具为准」「原样透传」两条互斥）；否则「评测不通过」会被误写成「环境坏了」，L3 在最常见的失败路径上被整体跳过。
   **verdict 枚举与触发条件（五值，2026-10-22 三层改造）**：`VALID`（全部门槛成立、非 flaky、未超时）/ `INVALID_FLAKY`（L1：**任一** configuration 跨全部迭代 run 级结论不一致）/ `INVALID_ENV`（运行期环境类失败：**触发条件以 §3.3-6 的二维表 ②③⑤ 与「运行后数据量闸门」为准（码位限定同 ③：表外码按 ④ 透传，不得写 `INVALID_ENV`），本节不另列清单**——典型情形 = 凭据 / 网络 / 模型变量 / 单 run 超时 / 某臂 determined=0 或数据量不足 / 无 `benchmark.json` / stderr 命中认证特征）/ `INVALID_ASSERT`（L3：非 env、非 flaky，`origin: calibrated` 的 gate 用例未达 `arms` / `delta` 声明值 → 「用例需校准」）/ `INVALID_DELTA`（L3：非 env、非 flaky，`origin: frozen` 的 gate 用例未达声明值 → 「技能退化」）。多条件同时命中取高优先级：**INVALID_ENV > INVALID_FLAKY > INVALID_ASSERT > INVALID_DELTA**（只在同一行内比较）；**ASSERT 与 DELTA 因 `origin` 互斥**——同一条用例只会落在其中一个（`calibrated` 永不判 DELTA、`frozen` 永不判 ASSERT），这是「不得把真实退化写成用例无效」的机制保证（AI-5-02）。**「配置错误」只在退出码维度出现**——坏配置在启动阶段即码 4、不产生 verdict 行（BE-4-05）。**`probe` 用例的 verdict 只有三种**：`VALID` / `INVALID_FLAKY` / `INVALID_ENV`（不参与 L3，故永不出现 ASSERT / DELTA）。**`probe` 的 `VALID` 只表示「未 flaky、无环境失败」，不代表断言通过**——断言通过率见行内 `rate=`；读结论时不得把 probe 的 VALID 当成「该用例已达标」（2026-10-22 互测 T9）。**gate 用例数 = 0 时仍产 verdict 行供人读，但整轮结论无效、退出码 3**（§3.3-6——全是 probe 的套件没有有效性结论）。`flaky=未判定` 只出现在三种情形：① 无任何 `benchmark.json`（`iteration=n/a`）；② 该用例**任一臂** determined=0（该臂全部 run 为 `undetermined`）；③ **数据量不足**（迭代目录数 < `iteration_min`，或任一臂 determined < `iteration_min` 且 > 0）——**该用例的 `flaky` 一律写 `未判定`（`gate` 行也不写 `否`：观测数不足 `iteration_min` 时「两次一致」没有依据，与 §3.3-6 的运行后数据量闸门同源）**；`gate` 行随之判 `INVALID_ENV`（§3.3-6），`probe` 行的 `verdict` 也写 `INVALID_ENV`（`VALID` 的定义含「非 flaky」，与 `flaky=未判定` 不相容；2026-10-22 第 9 轮 AU-9-07 / AI-9-09），但**不改退出码**（码 0 只看 gate）。任一情形下：**`rate` 与 `flaky` 分开算**——`flaky` 按上面三情形写 `未判定`；`rate` **只在该臂 determined = 0 时**写 `未判定`，determined > 0 时一律按 §1.5 如实算（整行不可算 → `rate=未判定`；单臂不可算 → `<值>/未判定`）。**情形③（数据量不足）只改 `flaky` 与 `delta`（`delta=未判定`），不改写 `rate`**——否则同一行会被要求同时填 `未判定` 与实测值（2026-10-22 第 9 轮 AU-9-01 / BE-9-01 / AI-9-01 / QA-9-06 同一处）。不得与 `否` 混用（2026-10-22 互测：旧稿只列两种，漏了数据量不足；终校验又指出 gate 行取 `否` 会让「n=1 也称一致」）。
   **预期值与达标判据必须单源（AI-6-01）**：唯一来源 = `expected.md` 的机读块 `schema: eval-expectation/v2`（契约与其启动前核对 ①–⑦ 见 §3.2.2）；跑后只用块里的 `arms` / `delta` 对账，机制见 R7。**旧版单标量 `{"required_passed": N, "required_total": M}` 已废弃**——它会在「两臂都全过、差值 = 0」时报 VALID，恰是唯一要抓的场景（R7）；runner 读到旧 `schema` 或旧字段一律按 §3.2.2 ① 判码 4，不做兼容。语义类（错误理由词是否恰当）**不进 verdict 维度**，属人工核对（§5 只手动验证）。
   **`INVALID_ASSERT` / `INVALID_DELTA` 的解释口径**：`origin: calibrated`（试跑校准、冒烟口径）不达 → `INVALID_ASSERT` = 「用例需校准 / 改用例」；`origin: frozen`（已过校准并留痕，R8 状态迁移）不达 → `INVALID_DELTA` = 「技能退化」。**不得把真实退化写成「用例无效」**（AI-5-02）；`origin` 与 `frozen_since` 写在 §3.2.2 机读块内，是唯一来源。
   **模型账（AI-6-04）**：存 `.session/eval/state/<技能名>.json`，结构 = 三元组 `{config_provider, config_name, actual_model}`；`actual_model` 在 verdict.md 的 `actual_model=` 行回填时同步写入。**任一项变化即打印「历史结论对该模型不成立，需重跑」**（只改 `actual_model` 也算）；`actual_model` 为 `未确认` 时额外打印「结论不可外推」。账本丢失 = 首次运行，不提示属预期（BE-6-09）。
   stdout 打印结论边界（五要素，同 verdict.md 头部）与模型账提示（三元组口径，R9）。

### 3.4 用例写作规矩（新增用例必须遵守）

| 规矩 | 判据 |
|---|---|
| 正负例配比 | 每条技能至少 1 条「应通过」+ 1 条「应拒绝/应升级」；负例不得少于正例 |
| prompt 只给输入，不给答案 | 不得在 prompt 里暗示该走哪一档 |
| 断言双面 + 理由级 | 每条用例同时有「必须出现」与「必须不出现」，且都是**理由级**词（R4-①②③） |
| 实跑锚点 | 凡判据要求「实跑证据」，断言必须含实跑锚点（R4-④）；**主锚点 = prompt 不可推断的事实**（prompt 中 0 命中、且讲述 prompt 里没有的 fixture 内容——文件行 / 随机化文件名 / 临时仓库绝对路径），`git diff --stat` 的 stat 行（如 `1 file changed, 1 insertion(+), 1 deletion(-)`）可由 prompt 推出，只作辅助证据（AI-6-05）；锚点还必须同时满足「prompt 中 0 命中」与「手写 oracle 中 ≥1 命中」，两点由机读块核对 ⑥ 机械核对（§3.2.2）——**不得由某次真跑样本反推**（BE-5-05，2026-10-22 三层改造） |
| 禁词双向验证 | 两个方向都要有证据：① **正确行为里不出现**——手写 oracle 满足（机读块核对 ⑤ 机械核对）；② **错误行为里确实出现**——至少 1 份真实错误样本（校准跑或 `fixtures/responses/` 历史样本）中命中。**留痕落点 = `fixtures/RECORD.md`**（样本文件:行 + 命中词 + 当时的断言集 `assert_hash`），`expected.md` 人读区只留一行指针；**A1 契约脚本按该留痕复算**（读样本、逐词子串匹配，核对命中的词确实在、行号确实对），核不过 → 非 0；**合格性仍由人工在 §5⑤ 签字**——A1 只做「记录是否自洽」的机械核对，不产生 verdict（AI-1-05，2026-10-22 互测 S10） |
| 改判据必跑 A1 | 改 `eval.yaml` / `cases/**` / `expected.md` / `fixtures/oracle/**` / `fixtures/responses/**` / `frozen-ledger.json` 之后，必须跑 `node scripts/check-eval-contract.mjs review-triage`，0 findings 才可继续；命令与输出摘要追加进 `fixtures/RECORD.md`。**A1 同时写 `fixtures/CONTRACT.json`**（`{schema:"eval-contract/v1", checked_at, exit:0, files:{**相对仓库根**的正斜杠路径: sha256}}`，覆盖上面六类文件；**键不得含 `..` 或盘符**，runner 用 §3.3-1 的同一个 `repoRoot` 展开复算——2026-10-22 第 9 轮 QA-9-04 / BE-9-04：不定基准会在快照层复现「两套路径」）——runner 启动前 ⑧ 按它核对哈希：**没跑 A1、或改了文件没重跑 → 码 4**（这是 A1 的变更期闸门；否则「必须跑」仍只是纪律，2026-10-22 互测） |
| 禁词不做否定豁免（与工具同口径） | `must_not_contain` 按**纯子串**匹配——官方文档口径是「所列字符串均不能出现」，**工具侧没有分句 / 否定语义**（2026-10-22 核对官方文档「expect — 快速门槛检查」）。因此：① **禁词表不得收录正确回答里可能出现的词**，含「不是低风险」这类否定式——真跑时同样判命中；② 正确回答需要否定某禁词时，改用正向表述（如「无风险」）；③ **禁止用前瞻正则**（`(?!.*不是低风险)` 语义相反、跨行失效，QA-5-05）；④ 若主张「否定式可豁免」，必须先用真跑实测证明工具确实豁免——不得凭推断（BE-7-01） |
| fixture 取证 | `repo_fixture` / `apply_diff` 必须先过启动前校验 ⑥ 的路径存在性与 baseline 核对；有凭据时再按 §4 步骤 0 实测取证，无凭据只能记「未取证」（R5） |
| 用例 ID 单源 | yaml `id` = 文件名（去扩展名）（BE-1-13） |
| 不写绝对路径 | yaml 内一律相对 **`evals/` 目录**（§3.2.1 单一基准）；绝对路径只允许出现在 runner 的运行时参数 |
| 不覆盖分档标题 | 禁令词不得含 `可直接提交` / `必须 review` / `不提交` |

### 3.5 判据对照（本轮两条用例，**权威单源 = R10 + §3.2.2 机读块**）

> 本节只是摘要：**达标数值以 §3.2.2 机读块示例为准、实测结果以 R10 为准**；两处与本节不一致时按它们判（RD-5-07 / AU-6-08）。

| 用例 | role | 测什么 | 达标判据 |
|---|---|---|---|
| `02-command-swap-semantic` | `gate` | 执行动作替换（`npm run check` → `check:all`）是否被判「必须 review」，且理由是「跑绿 ≠ 判据对」 | L2：手写 oracle 满足 `expect` 断言集；L1：任一臂无 flaky；L3：`with_skill` / `without_skill` / `delta` 三个阈值见 §3.2.2 示例（实测结果见 R10，本节不复述数字） |
| `01-checkbox-mechanical` | `probe` | 纯勾选改动是否被判「可直接提交」，且**报出实跑证据**（命令名 + 结果） | **不进 L3**（`arms` / `delta` 为 null）：只要求 L2 oracle 满足断言 + L1 记录 flaky。实测结果见 R10，已达 R8 升级门槛；本轮仍为 `probe`（用户裁定「先保持 probe」） |

## 4 施工步骤

0. **离线预检演练（不花模型调用；在步骤 1–3 的产物与步骤 3.5 的 A1 首跑之后执行——对应产物未就位时把该项记「未预检」，不得记通过）**：按 §3.3-5 的 ①–⑨ 逐项自查——`validate` 通过、`--dry-run` 返回 0（依赖步骤 4 的 runner；未建时记「未预检」）、`expected.md` 机读块 ①–④ 自洽、oracle 断言全过（机读块核对 ⑤）、锚点双向核对（机读块核对 ⑥）、**⑧ 的 `CONTRACT.json` 半边（不得跳过）**，把结果写进 **`evals/review-triage/fixtures/RECORD.md`**（进 git 的取证记录文件；**不得写进 yaml 的 `description` / prompt**，§3.4 禁止答案暗示）。**fixture 侧必须先自查四件**（2026-10-22 实测，缺一用例就跑不进目标场景）：① `apply_diff` 写在 `context.git` 下；② **物化副本**（`.session/eval/fixture/…`）自带 `.git` 且 `git log` 有 baseline 提交（仓库内 fixture 不带 `.git`）；③ 在临时工作区实测 `git status` 出现 ` M notes/plan.md`、`git diff` 出现那一行翻转；④ `git apply --check <补丁>` 退出 0（补丁与 fixture 必须逐字对齐，2026-10-22 互测 S4）。另需实测一次 **yaml 内相对 `evals/` 目录的路径解析**（§3.2.1 单一基准；2026-10-22 互测 S7 / 2026-10-23 实测修正）——判据是「`cases.files` / `oracle` / `repo_fixture` / `apply_diff` / `skills[].path` 与 `eval.yaml` 同根（`evals/`）」，**不得再写两层回跳进 `evals` 的旧形式**（实测会报 `failed to read case file` + 那段两层回跳路径）；判据必须是**正向观测**——工具真加载到用例（报告 / 产物里出现该 case-id），**不得以「没报错」通过**；未测就写「未取证」。**有凭据时**再按 R5 跑一次真 fixture 用例，确认模型回复出现 fixture 独有内容；**无凭据时只能记「真 fixture 未取证」**，不得写成已取证（BE-1-04）。锚点必须在 oracle 里先验过——oracle 中 0 命中就说明该锚点在正确行为里根本没出现，改用例或换锚点。
1. 建 `evals/review-triage/`，迁入两条用例。**02 的断言集按 R10 写死为 `expect.must_contain = ["必须 review","机器判不了"]`，`judge.output_contains` 只复用这两个词**（旧「已验证版本」的 `any: [语义迁移, 执行动作]` 不在 `expect` 里，照抄会被 §3.2.1 子集约束判码 4——2026-10-22 互测 S9）；**01 写死 `expect.must_contain = ["可直接提交","git diff","notes/plan.md"]`，`judge` 只复用这三个词**（删掉 `any: [字面核对, diff]`），并按 R5 建 fixture 仓库与补丁、按 R4-④ 加实跑锚点。**仓库内 fixture 只提交纯文件树、不带 `.git`**；baseline 由 runner 运行期物化（§3.1 / §3.3-5 ⑥）到 `.session/eval/fixture/` 下创建，**不得在仓库内对 fixture 目录执行 `git init` / `commit`**（§6-7）。本地自查只在 `$env:TEMP` 副本里做。步骤写进 `fixtures/RECORD.md`，并在 `expected.md` 人读区注明「`repo_fixture` 必须指向物化副本，否则校验 ⑥ 码 4」。
2. 写两份**手写 oracle 样本** `evals/review-triage/fixtures/oracle/{01-checkbox-mechanical,02-command-swap-semantic}.md`（L2 唯一输入，**不摘录模型输出、不由试跑产出**）；历史响应样本 5 份放 `fixtures/responses/`（只作人读证据）+ 2 份 flaky 证据（`flaky-evidence/out3-iteration-{1,2}-benchmark.json`，从 `.session/eval/trial/out3/` 复制，供 TC-028 回归）。
3. 写 `evals/review-triage/eval.yaml`（§3.2，model 用占位模板）；同批写 `evals/review-triage/expected.md`（**机读块 `schema: eval-expectation/v2`，契约见 §3.2.2** + 「试跑校准（冒烟口径）」声明 + 人工核对区，**必须早于步骤 6 首次真跑**，TC-039/TC-031 以它为对账文件）；本轮尚未冻结任何用例，先建 `frozen-ledger.json` 为空对象 `{}`（一旦有 `origin: frozen` 必须填记录，§3.2.2③）。**`arms` / `delta` 的取值来源必须留痕**：写进 `fixtures/RECORD.md`（来源 = 声明值或某次实测 + 样本路径 + 断言集哈希）；`origin: calibrated` 的阈值允许是「声明值（未校准）」，但**不得无来源**；**置 `frozen` 的那次校准跑必须满足 `iteration ≥ 2`、`flaky=否`、`undet=0`**，并把该次产物路径写进 ledger 的 `verified_at`（2026-10-22 互测 S11：一次侥幸的 1/1 就能同时定阈值与哈希——那是验证侧要挡的，不是阈值来源侧）。
3.5. **A1 首跑（必须在步骤 0 的自查与步骤 6 的首次真跑之前）**：按步骤 9 的规格写 `scripts/check-eval-contract.mjs`，立刻跑一次 `node scripts/check-eval-contract.mjs review-triage`，生成 `fixtures/CONTRACT.json`（六类文件 sha256）并记进 `RECORD.md`。**这一步不能排到步骤 9**——启动前 ⑧ 要读 `CONTRACT.json`，晚于它就会让步骤 0 与步骤 6 全部撞码 4（2026-10-22 第 9 轮 AU-9-04 / RD-9-04 / BE-9-06：A1 刚落进交付面时，产出者排在消费者之后）。
4. 写 `scripts/run-eval.mjs`（§3.3），`package.json` 加 `"eval:review-triage": "node scripts/run-eval.mjs review-triage"`。
5. `.gitignore`：`.session/` 已在忽略列表内；确认无需新增条目。
6. 跑 `npm run eval:review-triage`（需凭据；无凭据时只跑 `--dry-run`），按 §3.5 三层口径对账：L1 `flaky`、L3 `delta ≥ delta.min`；未达先怀疑用例（§6-1）。
7. 跑 `npm run check`。**注意：fixture 的 `plan.md` 会被 markdown 机械检查扫到**（`MD_SKIP_DIRS` 不含 `evals/`）——该文件必须围栏配对、表格列数一致、无 BOM。**markdown 文件数 = 开跑前基数 + §3.1 中本次新增的 `.md` 份数（逐份点清——含 `expected.md`、`fixtures/oracle/*.md`、`fixtures/responses/*.md`、**`fixtures/RECORD.md`** 与 fixture 内的 **`notes/plan.md`**；`eval.yaml` / `*.yaml` 不计）**，基数以当次 `npm run check` 实跑为准、不写死（BE-1-08 / BE-6-06；2026-10-22 第 9 轮 RD-8-04 / QA-9-08 / AI-9-12：旧枚举漏了后两份）。
8. 改动留工作区，提交方式由用户决定（不执行任何 git 写操作）。
9. 写 **A1 离线契约脚本** `scripts/check-eval-contract.mjs`（**不加 npm script**，直接 `node scripts/check-eval-contract.mjs [<技能名>] [--json] [--deep]` 跑；退出码 `0` 全过 / `4` 任一 FAIL / `2` 读不了文件；零第三方依赖）。核对范围 = §3.2 固定字段 + §3.2.1 契约（含键白名单、块列表形态、`judge ⊆ expect`）+ §3.2.2 机读块 ①–⑦ 的离线可判部分 + §3.4 的「禁词双向留痕」（按 `RECORD.md` 记录反查样本是否真命中）。**同时写 `fixtures/CONTRACT.json`**（六类文件的 sha256 快照，见 §3.4），runner 启动前 ⑧ 用它做变更期闸门。**首跑已由步骤 3.5 完成**（本步骤只负责把脚本定稿；定稿若改动了核对逻辑，必须重跑并刷新快照）；此后每次改 `eval.yaml` / `cases/**` / `expected.md` / `fixtures/oracle/**` / `fixtures/responses/**` / `frozen-ledger.json` 都必须重跑（§3.4），命令与结果摘要写进 `fixtures/RECORD.md`。它是**送审前置门**（0 findings 才可提交第 9 轮），不参与 `npm run check`、不产生评测 verdict（2026-10-22 互测 S10，用户 2026-10-23 裁定纳入）。**A1 的 `repoRoot` 一律由 `evals/<技能名>/eval.yaml` 的位置推导，与 §3.3-1 同一条**（不得从脚本位置另算；2026-10-22 第 9 轮 Q-9-补1）。

## 5 验收

| # | 检查 | 判据 |
|---|---|---|
| ① | 用例位置 | `evals/` 存在且 `skills/` 下无 `evals` 子目录；`skills[].path` 解析后指向存在的技能目录（工具不校验 `.`，见 §3.2 已知缺口）；`git status` 里**施工产物**的新增文件全在 `evals/` 与 `scripts/`（规格与用例文档不属于施工产物） |
| ② | 不污染 `skills/` | 跑完评测后 `skills/` 下无新增目录（特别无 `review-triage-workspace`）；**评测产物**（`<output-dir>` / `verdict.md` / 报告）只落 `.session/eval/out/`；fixture 物化目录 `.session/eval/fixture/<技能名>/<repo-name>/` **不属产物**（§3.3-5 允许且必须存在，2026-10-22 第 9 轮 AU-9-05） |
| ③ | `check` 契约不破 | `npm run check` 全绿；`check-all.mjs` 零改动；`package.json` 仅新增一条 script；`evals/` 下无 `*.test.mjs` |
| ④ | 差值成立（冒烟口径） | 用例 02 达 L3：`arms` 与 `delta` 按 `expected.md` 机读块对账（§3.2.2 是数值单源），且无 flaky；用例 01 为 `probe`，只核 L1 + L2、**不进达标**。本口径为试跑校准后的冒烟测试，**不代表独立验证**（R10） |
| ⑤ | 断言质量 | 每条用例的 `must_not_contain` 不含分档标题；正例证据词与负例禁令词齐备；每条用例都有**手写 oracle** 且其断言全过（机读块核对 ⑤）；两条用例的锚点（01 `notes/plan.md`、02 `check:all`）都在 oracle 中命中且 prompt 中 0 命中（机读块核对 ⑥）；`judge` 关键词是 `expect` 子集（§3.2.1）；`expect` / `judge` 只含白名单键（§3.2.2④）；同一 `eval.yaml` 内 `title` 唯一（§3.2.2②）；禁词双向验证的留痕在 `fixtures/RECORD.md` 且 A1 复核通过（§3.4） |
| ⑥ | 稳定性有账 | `verdict.md` 每行含 `flaky=<是|否|未判定>`、`undet=<n>/<n>` 与 `verdict=<VALID / INVALID_FLAKY / INVALID_ENV / INVALID_ASSERT / INVALID_DELTA 之一>`（机读枚举，口径唯一来源 = §3.3-7）；任一 configuration flaky → 该行 `verdict=INVALID_FLAKY` 且 `flaky=是`（OR 聚合；**在无更高优先级 verdict 时才成立**，优先级见 §3.3-7）；无 `benchmark.json` → `flaky=未判定` + stdout `flaky 未判定（无产物）`；某臂 determined=0 → `flaky=未判定` + `verdict=INVALID_ENV` + 码 2；`delta` 取四值之一（`数值`/`未达`/`未判定`/`n/a`）；**gate 的数据量闸门**（**有可解析 `benchmark.json` 且被采纳的迭代目录数** ≥ `iteration_min` 且每臂 determined ≥ `iteration_min`，否则 `INVALID_ENV` / 码 2）与**跨行取码 `2 > 3 > 1 > 0`** 均成立（§3.3-6）；**`verdict.md` 末段「## 异常明细」在位**，每行以 `- ` 开头、首段含 `detail-kind=` token（五类逐条落纸，无异常写「无」；形态单源 = §3.3-7，2026-10-23 审查 F9 并入本项、不另立验收条目）；`probe` 的 `VALID` 不得被读成「断言通过」（§3.3-7）（「停下改用例」为人工承诺，见 §7 只手动验证） |
| ⑦ | 结论带边界 | runner stdout 与 `verdict.md` 均含五要素：配置模型（标注请求值）+ 引擎版本 + 「真实后端未验证」+ 覆盖范围「1 技能 / 2 用例」+ 稳定性检出上限（按实际 n 生成，n=2 时 ≤ 50%；两次一致 ≠ 已验证稳定）；**`--dry-run` 的引擎版本一项必须显式打印 `n/a（dry-run 未执行工具）`**（不得静默省略，§3.3-7） |
| ⑧ | 素材可重建 | 删掉 `.session/eval/out/` 后重跑：与首轮报告 case 级结论一致、Delta 符号一致（数值允许因模型抖动变化）；`fixtures/responses/` 样本在 git，`.session/` 清理后 B 组断言仍可跑 |
| ⑨ | runner 行为契约（BE-2-05） | 退出码五码位各就位（0/1/2/3/4，工具非表内码如 5 原样透传）；产物目录已存在 → 码 4；`--iteration < 2` → 码 4；`--dry-run` 不写 `<output-dir>` / `verdict.md`（**允许**物化 `.session/eval/fixture/`）、不注入模型、不要求模型变量；模型变量缺失（真跑）→ 码 2；工具退出 0 但无 `benchmark.json` → 码 2 + `INVALID_ENV`（AU-6-07；2026-10-22 修正——归运行期环境类，避免与码 3 的 gate flaky 混用）；**工具码 × 数据完整性按 §3.3-6 二维表逐格成立**（工具码 0/1 + 数据完整 → 由 verdict 定码，不因工具退 1 就把整轮判失败） |
| ⑩ | 契约脚本（A1） | `node scripts/check-eval-contract.mjs review-triage` 退出码 0、0 findings；它覆盖 §3.2 / §3.2.1 / §3.2.2 的离线可判项与 §3.4 的禁词双向留痕复核；`fixtures/CONTRACT.json` 在位、`exit=0`、与其 `files` 记录的当前哈希一致（runner ⑧ 的输入）；命令与输出摘要已在 `fixtures/RECORD.md`；**未进 `npm run check`、未加 npm script**（§1 影响面 ④ / 施工步骤 9） |

## 6 硬约束

1. **不改 `skills/` 下任何技能正文**。用例不通过时先怀疑用例，不迁就改技能（R10）。
2. **不改 `scripts/check-all.mjs`**，不把评测挂进 `npm run check`（R2）。
3. **不改 `tools/`**，不引入 skill-up 作为仓库运行依赖（二进制是外部可选工具）。
4. **断言不得用分档标题充当禁令词**（R4-②）。
5. **要求实跑判据的用例必须有真 fixture 仓库**（R5）；路径存在性由启动前闸门 ⑥ 机械核对，**行为侧取证只在有模型凭据时做**，无凭据必须如实记「未取证」，不得写成已取证。
6. **结论必须标注结论边界五要素**（§3.3-7：配置模型 + 引擎版本 + 真实后端未验证 + 覆盖范围 + 稳定性检出上限，R9）。
7. **不执行任何 git 写操作**；改动留工作区由用户决定提交方式。**两处例外**：① `$env:TEMP` 下测试 fixture 的 `git init` / `git add` / `git apply`（必要时 `git commit`）；② **runner 运行期**在 `.session/eval/fixture/**`（已在 `.gitignore`，属运行期产物、不触碰仓库历史）里物化 fixture 所需的 `git init` / `add` / `commit`。两处都需用户/议会确认后才执行（AU-5-05；`.session` 例外为 2026-10-22 互测补——旧稿只写到 `$env:TEMP`，与 §3.1 的物化要求直接冲突，施工者只能口头豁免）。
8. **`evals/` 下不得出现 `*.test.mjs`**（会被 `npm run check` 顺带执行，破坏 R2 确定性）。
9. **产物目录已存在时 runner 拒绝运行**（BE-1-06），不覆盖旧结果。
10. **三层判据单源**：`flaky` 只在 §1.5 / §3.3-6 定义一次（run 级、全迭代并集），达标数值只在 §3.2.2 的 `expected.md` 机读块定义一次，**实测数字只在 R10 写一次**（别处引用不复述）；**不得在别处另起一套口径**（断言项级 flaky、绝对通过率达标都属违规）。
11. **oracle 必须手写**：`fixtures/oracle/*.md` 不得由模型输出摘录、不得由试跑产出（§1.5）；发现即判该用例不合格——否则断言对着自己写的答案自证。
12. **关键词断言一律写 `expect`**：`judge` 段的关键词必须是 `expect` 已声明的词的子集（§3.2.1）；写在 `judge` 而 `expect` 没有的词会绕开 L2，启动前校验 ⑧ 一律码 4。
13. **A1 契约脚本不得挂进 `npm run check`、不得引入第三方依赖**：它只在施工与改判据时由人跑（§3.4「改判据必跑 A1」/ §4 步骤 9）；挂进 `check` 会把「不花钱、跑得快、结果确定」的契约破坏掉（R2）。

## 7 测试

| # | 测什么 | 为什么 |
|---|---|---|
| 1 | 用例位置与打包边界（`evals/` 不在 `skills/` 内） | R1 的全部价值在于「产品与工装分离」 |
| 2 | 产物改道 + 已存在目录拒绝 | 默认产物落在技能目录旁边；覆盖旧结果 = 拿旧报告下新结论 |
| 3 | `check` 零依赖契约不破 | 评测一旦进 `check`，`check` 会变成「要钱、会抖」的检查 |
| 4 | 断言双面 + 实跑锚点 | 断言质量直接决定差值有没有意义；锚点区分实跑与复述 |
| 5 | fixture 路径闸门与取证边界（`validate` 静默放过不存在的路径；无凭据不得写成已取证） | 未知字段与坏路径被静默放过 = R5 停在纸面 |
| 6 | 三层判据各就各位：L1 迭代稳定性（≥2 拒绝 <2；flaky 自算、全迭代并集、run 三态）/ L2 断言可达性（oracle 断言全过、锚点双向核对）/ L3 差值（`delta ≥ delta.min`，绝对通过率不作判据） | 单次结果不可用；「断言本身立不立得住」必须在开跑前回答；绝对通过率说不出技能有没有用 |
| 7 | 二进制缺失 / 桩 .mjs 透传退出码 | 静默跳过会让「没跑」看起来像「通过」 |
| 8 | 结论边界五要素 + 模型账（三元组任一项变更提示重跑）+ `verdict.md` 的「## 异常明细」段（坏产物 / unknown 配置 / undetermined 跑 / 超时信号 / 运行期环境失败**五类**逐条落纸，每条首段带 `detail-kind=` token、固定为全文末段，无异常写「无」；**不要求与 stdout 逐字同源**） | 结论边界不可丢失；配置值 ≠ 实际值；异常只进 stdout 时，留痕读者分不清是坏产物、未知配置还是超时 |
| 9 | `npm run check` 全量绿（含 fixture plan.md 合规） | 判据只在真入口上算数 |
| 10 | `scripts/run-eval.mjs` 至少一个 `node --test` 覆盖参数拼装/退出码选择/路径 resolve 纯函数 | 新工装也要在守卫之下（BE-1-11） |
| 11 | A1 离线契约脚本：能拦住「机读块 / 断言集被改坏」「`title` 重名」「禁词双向留痕造假」三类，且不读跑分、不产 verdict、不进 `npm run check` | 这三类都是「改坏了也没人报错」的静默失败；只靠文档承诺必然漂移（2026-10-22 互测 S10/S12/S13） |

**测试用例文件**：`docs/superpowers/specs/2026-10-21-skill-eval-harness-design-testcase.md`（由独立 `senior-sdet` 编写；按「位置与产物 / 断言质量 / 稳定性 / runner 行为」分组；覆盖总表指回 R 编号与 § 号）。

**执行环境**：Windows + PowerShell；skill-up 由 `SKILL_UP_BIN` 或 PATH 提供（本机实测 `D:\devtools\skillup\skill-up.exe` v0.14.0）。**评测需要模型凭据**：无凭据时只跑 `validate` 与 `--dry-run` 作结构验证。

**只手动验证**：① 读用例 01 改 fixture 后的真实回复，确认它报的是「实跑得到的证据」而非「复述 prompt 里的 diff」；② flaky 出现后确认真的停下改用例（行为承诺，机器只能查 `verdict=INVALID_FLAKY`）。

**不测**：其他技能的用例（R8）；Trae CLI 引擎（企业旗舰版限制）；CI 接入；并发运行（产物目录固定，单机单人，spec §8 声明）。

## 8 不在这一轮

- 其余 17 个技能的用例（扩展判据见 R8：≥3 轮无 flaky + 差值方向稳定 + 不同任务族 + 预期值冻结后再首跑）。
- CI 门禁 / 提交前自动跑（需先定重复次数、阈值、谁承担调用成本）。
- 自定义引擎适配层。
- `agent_judge`（模型打分）：贵且不稳，本轮全部用确定性判分。
- Trae CLI 引擎：官方限制仅企业旗舰版可用，个人不可用。
- 并发运行（单机单人，产物目录固定）。

## 9 与既有体系的关系

- **不取代** `npm run check`（静态）、`node --test`（脚本层）、`retro-verify`（长期复发率）、议会评审（判断质量）。四者分别回答不同问题；本 spec 只补「同一 prompt 装/不装的差值」这一格。
- **不取代** checklist：checklist 是「这一次动作有没有按规矩做完」，评测是「这条技能对模型有没有约束力」。
- **与 `skill-inspector` 的边界**：`skill-inspector` 体检技能文档的写法，评测验技能对模型的行为；前者判文档，后者判行为。
- **本 spec 不产生新的判据单源**：用例写作规矩（§3.4）是评测工装内部的规矩，不外溢成全局规则；若后续证明它对多类任务都成立，再单独走规则落地。
