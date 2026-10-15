# 认知动作规则落点断言实现计划

> **For agentic workers:** 按此计划逐任务实现。步骤用 checkbox（`- [ ]`）跟踪。**本计划不含任何 git 写操作步骤**——每个任务收尾 = 改动留在工作区，最终交用户决定提交方式。

**Goal:** 把「认知动作规则的执行保障」从关键词放行改为落点断言：score.mjs X1/X2 真判据（去处成对 + 文件/槽位双重断言）、X3 改 AI 判、cognitive 判定资产化（仓内 annotations）、core 规则落点定稿、review-log 模板加「全貌确认」槽位、rule-writer 三层补齐。五处同根因，同批改。

**Architecture:** 判据唯一定义在 `rule-inspector/references/criteria.md` §3.3b（含封闭词表），`score.mjs` 是机械执行体（文件断言：提取反引号路径 → resolve 仓库根 → 读文件 → grep 槽位词），`rule-writer` 的 guide 只引用不复制，`recipes.md` 处方同步。core 规则的断言锚点 = 模板文件 `skills/review-log/assets/review-progress-template.md` + 槽位词「全貌确认」。

**Tech Stack:** Node.js（node --test，零外部依赖）、Markdown（规则/技能文档）、JSON（annotations）。

**Spec:** `docs/superpowers/specs/2026-10-15-cognitive-rule-landing-gate-design.md`

## Global Constraints

- 无 git 写操作：每任务收尾改动留工作区，交用户决定提交（用户全局规则 `no-git-write`）。
- **判据词从定稿文本提取，不许反过来**（spec §1.4 P0-2 + §1.5 P0-α）：core 落点文本在 Task 4 定稿，词表以它为准；score.mjs 的词表与 criteria.md §3.3b 同批改、单源在 criteria.md。产物判据用**模式**（spec §4.1 的 regex，含「引用名+块/节/表」形态），**不回到字面词表**。
- **预期与实测不符时的裁决规则**（spec §6 顶部，逐字执行）：实测 ≠ 预期 → 先定性（预期错 → 修预期声明并留痕 / 判据漏 → 收严判据，词表改动回 Task 3 同批）；**不许改判据凑预期，不许看到意外绿默默接受**——意外绿且查无判据依据 = 判据漏。
- **改规则措辞必须过硬闸门**：验收 7 若需改 how-i-must-reason 等规则的产物行表述 → 改前 vs 改后两版 → **等用户确认** → 才落地（rule-inspector SKILL.md 硬闸门 2，spec §1.5 P1-γ）。executor 不得以「plan 授权」绕过。
- **文件断言 fail-closed**：声称的路径 resolve 不到 = 红，不做「找不到就跳过」。
- 断言只认反引号内字面仓内路径；占位符路径（含 `<...>`）、`~` 开头路径不断言；**全部**无占位符反引号路径都要断言（不留「只查第一个」，spec §4.2 多路径策略）。
- 不碰 `skills/review-loop/references/loop.md`（审查判据，review 进行中；接线是收口后的独立小步）。
- 改 `rules/core-working-principles.md` 内容 = 改源即生效（运行时经链接读源仓库），**不需要** `aas sync`；新建 `rules/.inspector-annotations.json` 不是规则（无 frontmatter），完成后跑一次 `aas` 体检确认「需建链接」= 0。
- 每个改 .mjs 的 Step 后立即跑该文件测试；全部 Task 完成后跑全量 `npm run check`。

## 已裁决的待决项（spec §8 全部裁决，executor 不重讨论）

1. X2 = 文件/槽位双重断言（spec §4.2），不是「文本里有反引号路径」。
2. X3 移出机械组，改 annotations AI 判（`x3Done`，同 triCheckDone 模式）。
3. `review-progress-template.md` 本次一起加槽位；用户批本 plan 即批准（若否决，Task 5 移除、core 落点退化为载体词表）。
4. `loop.md` 接线（A4 + 收尾表自检项）= 非本次，已记 `docs/after/`。
5. 初始 cognitive 标注 = core-working-principles + how-i-must-reason 两条（**含 `x3Done: true` 及判定依据**，spec §4.5）——这只是 sweep 起点，Task 2 Step 2 全量判 18 条，不许凭记忆定全量（spec §1.5 P1-δ）。

---

### Task 1: score.mjs X 组真判据 + 测试用例 + 红基线

**Files:**
- Modify: `skills/rule-inspector/scripts/score.mjs`
- Modify: `skills/rule-inspector/scripts/score.test.mjs`

**Interfaces:**
- Produces: `X1`（产物模式 + 去处动词 + 去处成对：去处 ∈ 载体词表 ∪ 仓内路径[全部断言存在]）、`X2`（绑定动词 + 反引号仓内路径存在 + 目标文件含槽位词）、`X3`（annotations `x3Done`，AI 判）——供 Task 4/5 验收与 Task 7 全量复核调用。

- [x] **Step 1: 跑出修前现状（证据留档）**

  ```
  node skills/rule-inspector/scripts/score.mjs --file rules/core-working-principles.md --cognitive
  ```
  记录输出（预期：当前判据下 27/28 健康——这是**旧假判据**的输出，作为对照，不是红基线）。
  > ✅ 实测（2026-10-15 13:2x）：`27/28（96%，健康）`——旧假判据放行的对照已留档。

- [x] **Step 2: 改 score.mjs X 组判定**

  按 spec §4.1/§4.2（round-2 修订版，逐字照判据实现）：
  - X1：**产物模式**（regex：`/产物|清单|报告|spec|输出块|「[^」]{2,12}」(?:块|节|表)/`——字面词「确认块」作废）+ **去处动词**（写进/落到/记入/落盘/挂进/绑进——「随」不入表）+ **去处**（载体词：回复/**回答**/报告/commit body/账本/对话记录——**「任务记录」不入表**，或反引号仓内路径[全部无占位符路径 `existsSync` 断言]）成对，**同句或相邻句**（句 = 按 `。；\n` 切分）。
  - X2：绑定动词（挂进/绑进/写进/落到/核销）+ 反引号仓内路径（存在断言；占位符 `<…>` 跳过）+ 路径后**同句**内首个 `「…」` 槽位词（读目标文件 `includes` 断言）。三段任一缺失/断言失败 = fail，msg 写清缺哪段（诊断可执行）。
  - X3：删除 `PATHBIND_RE.test(body)` 判定，改 `opts.x3Done`（annotations 传入，默认 false → 0 分进 findings，处方「AI 判：应激触发是否前置显式化」）。
  - 词表/模式常量集中定义、注释指向 `references/criteria.md` §3.3b（单源声明）；旧 `PRODUCT_RE`/`PATHBIND_RE` 若无其他消费方则删除（先 grep 确认）。
  > ✅ 实测：实现为 `x1ProductLanding` / `x2Binding` 两个函数（score.mjs）；`node --check` 过；`PATHBIND_RE` 全仓 grep 零残留。
  > ⚠️ round-3 补充（执行中发现，spec 漏）：`--file` 模式同样需要 annotations 自动发现，否则验收 7 逐条 `--file --cognitive` 复核时 `x3Done` 传不进去 → X3 永红。已一并实现（`opts = { ...a, ...opts }` + CLI 未传 `--cognitive` 时补回 annotations 的判定）。

- [x] **Step 3: 跑红基线（core 未修、模板未加节）**

  ```
  node skills/rule-inspector/scripts/score.mjs --file rules/core-working-principles.md --cognitive
  ```
  预期：**X2 fail（无绑定声明，必红）**；X1 预期 fail（实测已核：当前 core 全文零反引号路径，「随任务记录可查」无合法动词/载体）。**实测若 X1 意外绿 → 按 Global Constraints 裁决规则定性，不许默默接受**。此输出即验收标准 1 的红基线，抄进本 plan 的 Step 下方。
  > ✅ 实测：**24/28（86% 预警）**——X1 fail「产物与去处未成对」、X2 fail「无三段齐全的绑定声明」、X3 fail（x3Done 未标注，预期内）——与预期逐条一致，无意外绿。

- [x] **Step 4: score.test.mjs 用例（新增 + 重写既有，注入实验双向）**

  **既有 3 条 X 用例按新判据重写**（grep 实核，score.test.mjs L851/862/872）：
  - L851「认知动作型缺声明 → 0 分」：新判据下仍应 fail ✓（fixture 不动，断言不动）
  - L862「认知动作型有声明 → 1 分」：其 fixture「输出思考确认块；挂进每轮收尾检查点」在新判据下**必 fail**（无去处动词、无路径、无槽位）→ **重写 fixture 为真形态**（真路径真槽位），并把旧 fixture 保留为**墓碑用例**（「旧关键词写法现在必须 fail」）
  - L872「非 cognitive 不注册」：不涉判据细节，核对仍绿即可

  **新增至少 4 条**（fixture 用临时规则文件 + `mkdtempSync`）：
  1. 含「确认块」无任何去处 → X1 fail（旧假判据会 pass——墓碑）
  2. 产物模式（如「深度思考」块）+ 去处动词 + 载体词（「写进回复」）→ X1 pass
  3. 绑定声明指向**不存在**的路径 → X2 fail
  4. 绑定声明指向真实模板文件 + 声称的槽位词**不在**该文件中 → X2 fail；槽位词在（临时 fixture 文件构造）→ X2 pass

  跑 `node --test skills/rule-inspector/scripts/score.test.mjs` → 全绿。
  > ✅ 实测：54/54 pass（原 48 + 新 6：声明齐全真路径真槽位 / 墓碑 / 载体词 / 假路径 / 槽位不在 / 非 cognitive 不注册）。

- [x] **Step 5: 核对 import / tsc**

  改动文件跑 `node --check`；确认无未使用 import 残留（本仓无 tsc，用 node --check + 测试覆盖）。
  > ✅ 实测：`node --check` 过；import 加了 `resolve` / `basename`（均有使用点），测试全绿兜底。

### Task 2: cognitive 判定资产化（annotations 自动发现）

**Files:**
- Create: `rules/.inspector-annotations.json`
- Modify: `skills/rule-inspector/scripts/score.mjs`（scoreDir 自动发现）
- Modify: `skills/rule-inspector/scripts/score.test.mjs`（自动发现用例）
- Modify: `skills/rule-inspector/SKILL.md`（L23 执行顺序同步）

- [x] **Step 1: 新建 `rules/.inspector-annotations.json`（含 x3Done 判定，P0-β）**

  ```json
  {
    "core-working-principles.md": { "cognitive": true, "x3Done": true },
    "how-i-must-reason.md": { "cognitive": true, "x3Done": true }
  }
  ```
  x3Done 判定依据（spec §4.5，抄进 Task 7 验收输出表备查）：core 触发在应激时刻但正文已有「**优先级最高，每轮最先**」= 前置显式化；how-i-must-reason 触发节已含「**起手先过**『回答前验证自检』」= 前置显式化。
  写完自查 BOM：`$b=[IO.File]::ReadAllBytes($p); $b[0] -eq 0xEF` → False。
  > ✅ 实测：BOM = False；文件含 3 条（第三条 sweep 见 Step 2）。

- [x] **Step 2: 全量 sweep（P1-δ：不许凭记忆定全量）**

  逐条读 `rules/` 全部规则的关键动作，按 criteria.md §3.3b 判「认知动作型 / 机械动作型」：认知型 → 补进 annotations（cognitive + x3Done 判定）；机械型 → 不标。**每条的判定依据一行**（规则名 → 认知/机械 → 依据原文关键词），汇总抄进 Task 7 验收输出表——判定是 AI 判，依据必须可复核。
  > ✅ 实测（两轮关键词 grep + 对边界规则的全文判定）：
  > - `core-working-principles.md` → 认知型（「深度思考」「画全貌」）——x3Done=true（「优先级最高，每轮最先」= 前置显式化）
  > - `how-i-must-reason.md` → 认知型（「先自问三句」L9/L107、「判性质」L51）——x3Done=true（「起手先过」）
  > - `data-support-triple.md` → 认知型（「自问三句」L43——**sweep 新发现，初始两条凭记忆会漏掉它，P1-δ 的价值实证**）——x3Done=true（「每次输出带数据的判断前」= 前置）
  > - `docs-convention.md` → 机械型（「机制缺陷」命中只是 retro/ 目录的语义描述，不是动作）
  > - 其余 14 条：两轮 grep（画全貌/深度思考/自省/追根/列同族/算账/自问/判性质/审视/推演）均无命中，关键动作为跑命令/写文件/禁令归类 → 不标。⚠️ 边界说明：`landing-sweep` / `reference-read-output-loop` 有判断成分但主导动作机械（扫描+改文件），未标——新 session 若有异议按 criteria §3.3b 复核。

- [x] **Step 3: score.mjs 自动发现**

  scoreDir：未显式传 `--annotations` 且 `join(dir, '.inspector-annotations.json')` 存在 → 自动加载；显式传参优先。解析失败 → 中文报错 exit 1（不静默）。
  > ✅ 实测：scoreDir + --file 双入口都实现（--file 是 round-3 补的 spec 漏洞，见 Task 1 Step 2 注记）；`--dir rules` 全量跑通（68% 不及格——X 组开始对标注文件生效）；`--file rules/data-support-triple.md --cognitive` 验证 x3Done 传入（X3 pass、执行力度 8→9）。

- [x] **Step 4: 测试用例 + SKILL.md 同步**

  用例：临时目录放 annotations + 两条规则 → scoreDir 结果中标注文件的 X 组被评估、未标注的不评估。SKILL.md L23 补一句「AI 判定后写进 `rules/.inspector-annotations.json`（判定资产化，不只写单次报告）」。
  > ✅ 已做：SKILL.md L23 已改（判定资产化措辞）。
  > ✅ 已补（新 session）：scoreDir 自动发现用例——临时目录放 `.inspector-annotations.json`（标 cog.md）+ 一标一不标两条规则 → 断言标注文件 执行力度 max 5+3=8（X 组注册）、未标注文件 max 5 不变（不评估 X 组）→ **55/55 全绿**，Task 2 完成。

### Task 3: criteria.md / recipes.md 判据与处方同步

**Files:**
- Modify: `skills/rule-inspector/references/criteria.md`（§3.3b）
- Modify: `skills/rule-inspector/references/recipes.md`（X 类处方）

- [x] **Step 1: §3.3b 改写为落点断言口径**

  X1/X2/X3 三行判据 + 处方列改写（判据定义、封闭词表**全文放这里**——score.mjs 注释指向此处）；X3 标注「AI 判（annotations x3Done），机械组不评」。
  > ✅ 已做：§3.3b 含词表全文 + 窗口语义钉死 + X1 半机械标注 + annotations 资产化声明 + X2 判据锚点例。

- [x] **Step 2: recipes.md 对应处方**

  X1 处方 →「补产物 + 去处（载体词表或仓内路径，路径须 Test-Path 为真）」；X2 处方 →「补绑定动词 + 反引号路径 + 槽位词，三段齐全且目标文件含槽位」。
  > ✅ 已做：新增 **§R8**（recipes.md 原本无 X 处方），含三条改法 + 硬闸门 2 提示 + core 判据锚点例。

- [x] **Step 3: 一致性核对**

  `Select-String 'PRODUCT_RE|PATHBIND_RE' skills/rule-inspector` → 仅 score.mjs 定义处命中；criteria.md 无脚本常量名（判据文档不写实现细节，只写词表与断言语义）。
  > ✅ 实测（13:5x 补跑）：`PRODUCT_RE` 仅 score.mjs L39 定义 + L74 使用；`PATHBIND_RE` **全仓零命中**（删干净）；criteria.md / recipes.md 均无脚本常量名 ✓。

### Task 4: core 规则修复（落点定稿，判据锚点）

**Files:**
- Modify: `rules/core-working-principles.md`

- [x] **Step 1: 按 spec §4.3 定稿两处**

  L11 后加适用枚举（逐字用 spec §4.3 文本）；L18 产物行定稿（逐字用 spec §4.3 文本）。**不许改其它措辞**（硬闸门：判据措辞改动最小化，本项已经用户逐字认可）。
  > ✅ 已做：git diff 显示 core 仅 +2 行改 1 行（适用枚举 + 产物行），其它措辞未动。

- [x] **Step 2: 断言锚点核对**

  定稿文本中的反引号路径 `skills/review-log/assets/review-progress-template.md` → `Test-Path` 为 True；槽位词「全貌确认」此时在模板中 **0 命中**（Task 5 才加）——记录这个状态。
  > ✅ 实测：模板路径存在（Task 5 注入实验间接验证）；「全貌确认」此时模板 0 命中——红基线（24/28）中 X2 红的原因即此，状态已由 Task 1 Step 3 的输出留档。

### Task 5: review-progress-template.md 加「全貌确认」槽位

**Files:**
- Modify: `skills/review-log/assets/review-progress-template.md`

- [x] **Step 1: 按 spec §4.4 加节**

  在「评论关联分析」小节之前插入「全貌确认」节（六维表：本质/同族（grep 命令+命中数）/边界/验收（可跑断言）/影响面/联动四问；无修复轮写「不适用」一行——防「留空分不清不需要和忘了写」）。
  > ✅ 已做：+14 行（git diff 实核）。

- [x] **Step 2: 验收标准 2（修后绿）**

  ```
  node skills/rule-inspector/scripts/score.mjs --file rules/core-working-principles.md --cognitive
  ```
  预期：X1 pass（产物模式「全貌确认」块 + 去处动词「写进/挂进」+ 路径存在）、X2 pass（路径存在 + 模板含「全貌确认」）、X3 pass（Task 2 annotations 的 x3Done）。若 fail：按 msg 定位缺哪段，**修声明或修词表对齐（词表改动须回 Task 3 同批）**，不许单侧凑绿；意外结果按 Global Constraints 裁决规则定性。
  > ✅ 实测：**27/28（96%，健康）**——执行力度 **11/11**（X1/X2/X3 全过），仅剩「三检验报告未做」（AI 侧，跑体检时做，不属本判据）。

- [x] **Step 3: 注入实验（验收标准 3/4）**

  a) 临时从模板删「全貌确认」标题行 → 复跑 → X2 fail → 还原 → pass。
  b) core 落点路径临时改 `skills/xx/不存在.md` → 复跑 → X2 fail → 还原 → pass。
  两次注入后 `git diff --exit-code` 对应文件为干净态（还原彻底）。
  > ✅ 实测 b（假路径）：X1「声称的落点路径不存在：skills/xx/no-such.md」+ X2「绑定路径不存在」**双红**（执行力度 9/11）→ 还原后 27/28 健康。
  > ✅ 实测 a（槽位删失）：⚠️ **第一次只删标题行 → X2 没红**——教训：节内注释「全貌确认不适用」仍含槽位词（grep 命中），「删标题 ≠ 删节」；**重做删整节（371 字符）→ X2 红「目标文件不含声明的槽位」** → 还原绿。
  > ✅ 还原核对：`git diff --stat` 两文件只剩预期改动（模板 +14 / core +4-1），注入零残留。

### Task 6: rule-writer 三层补齐

**Files:**
- Modify: `skills/rule-writer/SKILL.md`
- Modify: `skills/rule-writer/references/writing-guide.md`
- Modify: `skills/rule-writer/assets/rule-skeleton.md`

- [x] **Step 1: SKILL.md** L28 自查清单加「+ 认知动作 X1/X2/X3（含认知动作时必查，缺一项回写）」；L35 「8 项自查表」→「8 项 + 认知动作 X 组自查表」。
  > ✅ 已做：L28 自查含 X1 产物去处 / X2 文件槽位断言 / X3 AI 判 + 「缺一项回写，不许交付」；L35 同步。
- [x] **Step 2: writing-guide.md** X 组自查问题升级为落点断言口径（spec §4.6 表格逐字），保持「判据见 criteria §3.3b，不复制全文」的单源声明。
  > ✅ 已做（新 session）：X1 改「产物是否带**去处**（载体词表或仓内路径，路径能用 `Select-String` / `Test-Path` 查到）」；X2 改「是否指名**挂进哪个文件的哪个槽位**，且目标文件真有该槽位（用 Select-String 验命中）」；X3 不变；单源声明保留。
- [x] **Step 3: rule-skeleton.md** 加「认知动作专属（含认知动作时必填）」节：产物去处 + 必经路径绑定（反引号路径 + 槽位词）两个必填位，附一行注释「路径与槽位会被 rule-inspector 文件断言——写了不存在的落点会红」。
  > ✅ 已做（新 session）：文末加节，两个必填位 + 断言红注一行，判据指向 rule-inspector criteria §3.3b（不复制全文）。

> **Task 6 进度：3/3**（Step 1 上个 session 完成；Step 2/3 新 session 已补，spec §4.6 表格逐字照抄）。

### Task 7: 全量验收（spec §6 全部 8 条）

- [x] **Step 1: 逐条跑 spec §6 验收 1-6**（红基线/修后绿/双向注入/测试全绿/闸门），把每条命令 + 实际输出抄在本 Step 下方。
  > 验收 1-4 已在 Task 1/5 实跑；5/6 本次实跑（55→57/57；npm run check 247/247）——全部抄录见下表。
- [x] **Step 2: 验收 7 —— annotations 标注的认知规则逐条复核（含硬闸门）**

  对 Task 2 sweep 标注的**每条**认知规则跑：
  ```
  node skills/rule-inspector/scripts/score.mjs --file rules/how-i-must-reason.md --cognitive --json
  ```
  预期 how-i-must-reason 的 X1 可能红（产物「回答附来源」无去处动词表述）。**处置必须走硬闸门**（rule-inspector SKILL.md 硬闸门 2，spec §1.5 P1-γ）：
  1. 起草改前 vs 改后两版（最小改动：产物行补「写进回答」类去处动词表述）；
  2. **停下来等用户确认**——executor 不得自行落地；
  3. 用户确认后才改，复跑至绿。不许扩词表凑绿。
  > ✅ 实测根因 ≠ 预告（X1 红另有 `references/*.md` 通配误伤一因；X2 红未预告）；已按硬闸门 2 交用户 15:0x 确认（决策 A1 通配跳过 + B1 x2Carrier 分流 + C 产物行措辞），三条全绿（见下表行 7）。
- [x] **Step 3: 验收 8 —— `aas` 体检**「需建链接」= 0。
  > ✅ 规则区需建链接 0（见下表行 8）；技能区差异为既有状态非本 plan 引入。
- [x] **Step 4: 全量 `npm run check`** → 240+ 用例全绿、0 findings、markdown 段通过。
  > ✅ 247/247、守卫 0 findings、markdown 过（136 文件/409 表），exit 0。
- [x] **Step 5: 收尾对账**——对照 spec §6 八条逐条标 ✅/❌；有 ❌ 不许宣布完成。改动全部留在工作区，交用户决定提交方式。
  > ✅ 八条全过（见下表）；plan 全部 Task 1-7 完成，改动留工作区，提交方式交用户。

---

## 验收输出位（Task 7 抄录处）

> **进度注记（2026-10-15 本 session，15:0x）**：验收 1-8 全部实跑且通过（见下表）。Task 2 Step 4 + Task 6 Step 2/3 本次已补完；验收 7 实测根因 ≠ 预告（`*` 通配误伤 + X2 适用边界），按硬闸门 2 交用户确认（A1 通配跳过 / B1 x2Carrier 分流 / C 产物行措辞）后三条规则全绿。**plan 全部完成，改动留在工作区，提交方式交用户**。

| spec §6 | 命令 | 实际输出 | 过否 |
|---|---|---|---|
| 1 修前红基线 | Task 1 Step 3 | **24/28（86% 预警）**：X1 fail（产物无去处成对）、X2 fail（无三段齐全绑定）、X3 fail（x3Done 未标注，预期内）；对照：旧判据 27/28 健康 = 假判据铁证 | ✅ |
| 2 修后绿 | Task 5 Step 2 | **27/28（96% 健康）**：执行力度 11/11，X1/X2/X3 全过 | ✅ |
| 3 注入 a 槽位删失 | Task 5 Step 3 | 删整节（371 字符）→ X2 红「目标文件不含声明的槽位「全貌确认」」→ 还原绿。⚠️ 首次只删标题行没红（节内注释仍含槽位词）——「删标题 ≠ 删节」教训已记 | ✅ |
| 4 注入 b 假路径 | Task 5 Step 3 | 路径改 `skills/xx/no-such.md` → X1+X2 双红（执行力度 9/11）→ 还原 27/28 绿；`git diff` 注入零残留 | ✅ |
| 5 score.test 全绿 | Task 1 Step 4 + Task 2 Step 4 + 验收 7 | **63/63 pass**（54 基线 + Task2 Step4 +1 + 验收7 +2 = 57；R13 段一 OCR 补 6 条测试有效性 = 63。⚠️ 原「+3」写错——A1/B1 实际新增 2 条用例（glob 跳过 / x2Carrier），非 3，已修正） | ✅ |
| 6 npm run check | 本次 14:3x + 17:5x 复跑 | ①语法过 ②**253/253**（原 245 + score.test.mjs 补用例 +8，check.test.mjs 批 1 修复后不变 27）③守卫 0 findings ④markdown 过（137 文件 / 414 表，验证查账 spec 落盘后 +1）。⚠️ 首跑 2 findings：criteria L159 / recipes L144 跨技能路径引用（Task 3 的 X2 锚点例写了 `skills/review-log/...` 路径）→ 按「写 skill 禁止路径指路」改为技能名 + 裸文件名引用 → 复跑 0 findings | ✅ |
| 7 认知规则逐条复核（含 sweep 判定依据全表） | 本次 14:4x 实跑 + 15:0x 确认落地 | 三条全绿：core 27/28 健康；how-i-must-reason **26/27 健康**；data-support-triple **26/27 健康**（均仅剩 AI 侧「三检验报告」已知项）。处置（用户 15:0x 确认硬闸门 2）：① 产物行补去处动词+载体（how L17 / data L37「写进当次回答」）② A1 判据修：score.mjs 通配路径 `*` 跳过断言 + criteria §3.3b 窗口语义同步 ③ B1 分流：annotations 加 `x2Carrier:true`（两条会话载体规则 X2 不评、满分 +2；文件类规则仍强制，core 不标）。测试 +2（glob 跳过 / x2Carrier max+2），57/57；`npm run check` 253/253 全绿 exit 0 | ✅ |
| 8 aas 体检 | 本次 14:3x 实跑 | 规则区：已就位 18 ｜ **需建链接 0** ｜ 需替换 0 ｜ 待迁移 0 ｜ 残留 0（annotations 未破坏规则同步）。⚠️ 技能区需建链接 1（review-triage 缺链接）+ skill-creator 漂移——均为既有状态、非本 plan 引入（本 plan 只改既有技能内容，未增删技能），不在本验收范围 | ✅（规则区） |
| （附）x3Done / x2Carrier 判定依据 | x3Done：core = 「优先级最高，每轮最先」；how-i-must-reason = 「起手先过」；data-support-triple = 「每次输出带数据的判断前」。x2Carrier：how-i-must-reason / data-support-triple 产物去处 = 回答（会话载体、无自然文件落点）→ true；core 产物落点 = 模板文件 → 不标（X2 强制）——sweep 依据全表见 Task 2 Step 2 注记 | | |
