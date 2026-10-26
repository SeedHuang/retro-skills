# agent 卡契约化 + 产物校验门禁（PRD）

> 状态：**待评审（未定稿）**
> 来源：探索稿 `docs/after/20261026164718-agent-card-composition-exploration.md`（§1 现状实测 / §3 数据模型 / §11 形态实验 / §12 增量 / §13 D10 重测 / §14 工程化实测）。
> 定稿后：设计结论并入 `docs/superpowers/specs/`，按 §8 的功能块滚动拆 spec。
> 三档标记：`[已确认]`（用户当场裁定）/ `[已决·代裁]`（AI 代裁 + 理由，用户可推翻）/ `[待确认]` / `[FZ]`（未取证）。

---

## 0 裁决记录与事实基线

### 0.0 §0 硬门状态：**已通过**（2026-10-26，用户签字；市场 / 产品经理两栏留空）

| 栏位 | 状态 | 说明 |
|---|---|---|
| 精算师 | **已签（事后复核）** | 有条件通过，见 §0.5 |
| 市场 | **留空** | 仓库无市场 / 调研角色（mainline F-01 属 S2，未开工）。**用户 2026-10-26 裁定：先空着**，S2 角色落地后补签 |
| 产品经理 | **留空** | 仓库无产品经理卡（F-03，S2 未开工）；`reviewer-product` 是评委不是作者。同上，留空 |
| 用户 | **已签（2026-10-26）** | 依据用户原话「先空着 就说是我通过了」 |

> **用户签字记录（2026-10-26）**：覆盖范围 = §0 四栏状态（精算师已签、市场 / 产品经理留空、用户已签）。这是 **§0 的签字，不是段① 的出口签字**——① 的出口仍需议会 #1 与 `gate-record.md` 的 ① 行。
> **留空两栏的引用限制**（防误读）：市场 / 产品经理两栏留空属用户明示的例外，**不得被引用为「市场已评审」「产品已评审」**；任何后续材料写到这两栏，必须原样写「留空，待 S2 角色补签」。补签条件 = mainline S2 落地。
> 由此：§0 门已过，可按 §8 的执行顺序推进；但 PRD 本身仍为**待评审（未定稿）**，接口径以议会 #1 结论为准。

### 0.1 三档标记

| 标记 | 含义 | 本文中的义务 |
|---|---|---|
| `[已确认]` | 用户当场说过，有出处 | 不得改口径；要改必须回本节重签 |
| `[已决·代裁]` | AI 下结论，附理由与推翻条件 | 用户可逐条划；划掉即改 |
| `[待确认]` | 只有倾向，没有依据 | 定稿前必须收敛为前两档之一 |
| `[FZ]` | 未取证，只作线索 | 不得当事实引用 |

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
| A-9 | **本 PRD 优先级高于 `dev-workflow-mainline`**：取消重叠——`tools/docgen` 模型改造与「全席重生成」归本 PRD；mainline 需重新优化（让出该功能点，按 R5 回它自己的 §0 重签） | 用户 2026-10-26 选项确认（原话「本PRD优先级更高，mainline的prd需要重新优化」）→ 细则见 §7 D-08 |
| A-10 | 市场栏与产品经理栏**不代拟**；两栏**留空**，§0 以**用户签字通过**（2026-10-26），S2 角色落地后补签 | 用户 2026-10-26 选项确认 + 追加原话「先空着 就说是我通过了」→ 见 §0.0 |

### 0.3 事实基线（先读，全部可复算）

| 事实 | 数值 | 取数方式 / 出处 |
|---|---|---|
| 需改造的席位卡 | 15 张 | `Get-ChildItem agents/*.md` → 15 |
| 同义 / 同句副本 | 67 处（4 条句子 × 14 份 + 11 处重复格式） | 探索稿 §1.2 |
| 形态对照实验 | 四轮合计 **233/240**（160/160 + 40/40 + 33/40）；**第一轮**四种形态无差异 | 探索稿 §11（`:268` / `:287` / `:293`） |
| 显式矛盾检测 | **40/40** | 探索稿 §11 第三轮（`:287`） |
| 隐式指代型矛盾 | **17/24**（6 张隐式卡合计）；最坏单例 C01 **0/4** | 探索稿 §11 第四轮（`:295-304`） |
| 文本校验器抗攻击 | 9 条对抗用例 **8 条被绕过** | 探索稿 §14.1（`:666`） |
| 结构化校验器抗攻击 | 原 9 条攻击在结构上不可表达；实测 **0 条通过**（源记录另一处写「0/10」，第 10 例未登记 → 分母待核） | 探索稿 §14.1（`:668`） |
| 校验实现测试 | **71/71 绿** | `node --test C:\Users\HuangChunhua\.retro-skills\observation-check-draft\*.test.mjs` → `# tests 71 / # pass 71 / # fail 0` |
| 模型级缺口 | 4 个缺口 + 2 个口子；`senior-sdet` 现设计下**表达不出来** | 探索稿 §12.10 |

> **正文纠错（2026-10-26，精算师 Q-A-01）**：本文前一版把 `233/240` 写成「240/240 无差异」、把「C01 单例 0/4」写成整类「0/4」——都是拿最好的那一轮当总数。已按源记录改正。「为什么必须结构化」的主证据是 §14.1 的 8/9 → 0，不是形态实验。

> 校验实现目前在**仓库外**的用户级草稿区 `C:\Users\HuangChunhua\.retro-skills\observation-check-draft\`（迁出原因：`npm run check` ⑤ 段要求 `.session/tmp/` 为空，而未定稿的代码又不能进 `tools/`）。它不在版本库里，靠 S2 收进来才成为仓库成果。

### 0.4 成本与收益基线（实测，2026-10-26）

| 项 | 实测 | 取数命令 |
|---|---|---|
| 席位卡体量 | 15 张 / **731 行** / **300 行**表格行 | `(Get-ChildItem agents\*.md \| Measure-Object).Count`；`Get-Content agents\*.md \| Measure-Object -Line`；`Select-String -Path agents\*.md -Pattern '^\|' \| Measure-Object` |
| docgen 侧 agent 存量 | **559 行**（`agentData` 294 + `validateAgentData` 144 + `renderAgent` 46 + `agent.md.tpl` 24 + `agent-handwritten.md.tpl` 51） | `Get-ChildItem tools\docgen -Recurse -File \| Where-Object Name -in … \| % { Get-Content $_.FullName \| Measure-Object -Line }` |
| 数据样例 | **15 份** `*.evidence.json` | `Get-ChildItem tools\docgen -Recurse -Filter *.evidence.json \| Measure-Object` |
| 受牵连测试 | **15 个**测试文件引用 agent 数据（`tools/docgen/test` 一层） | `Select-String -Path tools\docgen\test\*.mjs -Pattern 'agentData\|renderAgent\|validateAgentData' -List \| Measure-Object` |
| S2 已付成本 | **888 行 / 11 文件 / 71 测试** | `Get-Content …\observation-check-draft\*.mjs \| Measure-Object -Line` |
| 门禁边际耗时 | 全量 `npm run check` **23.9 s / 736 条**（734 pass + 2 skip）；新增 71 条 **0.105 s** | `npm run check` 输出的 `# duration_ms`；`node --test …\*.test.mjs` |
| **收益基线** | 符合本约定的产物 **0 件**（全仓 `observation-r*` 命中 0） | `Get-ChildItem -Recurse -Filter 'observation-r*' docs,.session \| Measure-Object` |

> 收益基线为 0 是事实，不是缺陷描述：门禁上线当天会走「0 件，跳过」分支。要让收益可观测，必须有 §9 V-9。

### 0.5 精算师签字（2026-10-26，事后复核）

| 项 | 内容 |
|---|---|
| 结论 | **有条件通过**，不行使否决权 |
| 签字口径 | **事后复核**（PRD 与本 PRD 的 S2 实现都先于本评审完成），不是初判 |
| 依据 | 独立上下文评审，自跑只读取数命令复核 §0.3 / §0.4 全部数字；产出 8 个问题（P0×2 / P1×3 / P2×3） |
| 已处置 | Q-A-01（两处数字纠错）→ 已改 §0.3；Q-A-04（成本无数字）→ 已加 §0.4；Q-A-03（收益不可观测）→ 已加 §9 V-9；Q-A-05（分母不一致）→ 已在 §0.3 标注待核；Q-A-07（路径错）→ 已改 §8；Q-A-08（存量未声明）→ 已加 §5.2 |
| 裁定（2026-10-26 用户） | Q-A-02 → **本 PRD 优先**，mainline 让出「全席重生成」并重签 §0（详见 §7 D-08 / §0.2 A-9）；Q-A-06 → 执行顺序改 S2→S3→S1→S4（`[已决·代裁]`，可推翻） |

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

1. 定义层：场景 / 信号 / 动作五要素 / 检查项两层 / 三态 / 开放项 / 前置 / 落点枚举 / 覆盖语义，及其数据校验器。
2. 渲染层：一份数据 → 三个投影（卡面 / README / dump），覆盖记录落 `overrides[]`，15 席重生成。
3. 产物合同：json schema + 四段校验链 + 唯一写盘入口。
4. 门禁：`npm run check` 增一段，归档目录强制（git 跟踪 + 无未提交改动）。

**不做**

- 议会流程改造（独立议长、答辩方子代理、两张矩阵）——归 `dev-workflow-mainline` PRD 的 S3。
- README 之外的对外文档。
- 语义判定（「这条引用是否支持这个结论」）——脚本判不了，落 `check: 'manual'` + 独立抽查。
- 逐席重写卡面个性文案——本 PRD 只统一**结构**，个性化内容仍由各席维护者填。

**不因来源豁免**：子代理、脚本、生成器产出的卡与产物，同样要过 §4 的校验与 §5 的门禁。

---

## 3 核心模型

> 细则见探索稿 §3 / §12，本节只定口径与判据来源，不复制细节。

### 3.1 场景与信号 `[已确认]`

动作的触发不写「每轮」，写三层：`scene`（对象）+ `moment`（时间点）+ `repeat`（频率）。
信号五类：事件到达 / 产物出现 / 状态转换 / 命令返回 / 差异命中。**无 merge、无覆盖**。

### 3.2 动作五要素 `[已确认]`

| 要素 | 判据 |
|---|---|
| 触发 | 引用 §3.1 的场景 id，不写自然语言时间 |
| 宾语 | 必填；禁止「该内容 / 上述 / 相关」这类无名指代 |
| 判据 | 谓词 id（如 `ledger.reflectRow.exists`），不写散文 |
| 落点 | 枚举值，可参数化（如 `observation.table.lastRow`） |
| 前置 | `requires` 列表，缺前置仍开工 → `MissingPrerequisite` |

### 3.3 合并：同编号覆盖 `[已确认]`

同层同 id → 报错；跨层同 id → 覆盖，必须带 `reason`；无差异（覆盖后与原件相同）→ 报错；merge 输出 `overrides[]`（base 引用 + changed 字段 + reason），供追责，**不进卡面**。

### 3.4 检查项两层 `[已确认]`

`CATEGORIES`（key + 客观 label）→ `CHECK_ITEMS`（`subject` + `criterion` + `check: 'script'|'ai'|'manual'`）。
判据写法：**「或」拆条、「且」留条**（JSON Logic 表达式）；词表进数组物料，阈值进 `params`。
`check:'ai'` 的条目必须给**判定口径**，否则各判各的（`AmbiguousCriterion`，来自 §13 第三批实测）。

### 3.5 三态与 `subject` `[已确认]`

命中（对象存在且满足）/ 未命中（对象存在但不满足）/ 不适用（对象不存在或类型不匹配）。
对象类型与 `subject` 不符 → **只能判不适用**；判命中或未命中 → `SubjectMismatch`。

### 3.6 开放项 `openItem` `[已确认]`

基类（五列 + 证据必带 + 不许重复固定项）+ 派生 `scope`；数量不固定，**0 条合法但须给可核理由**（`EmptyOpenWithoutReason` / `WeakReason`）。
「0 条」**不作为验收目标**——改为「每条补充项必须可回指原文」（探索稿 §13 第三批结论）。

### 3.7 一份数据 → 三投影 `[已确认]`

| 投影 | 读者 | 形态 | 硬约束 |
|---|---|---|---|
| 卡面 | AI | 短句 + 判据 id | 自足：禁「详见 / 参见」（`PointerToElsewhere`）；散文只进 note 段且物理隔离 |
| README | 人 | 表格 + 理由 | 每席一份 + 自动 index |
| dump | 开发 | 合并后全量 JSON | 只作预览，不作交付物 |

---

## 4 产物合同

### 4.1 schema `[已确认]`

```js
{
  round: 3,
  items: [{ id: 'k01', verdict: 'hit'|'miss'|'na', evidence: { path, line, quote }, reason }],
  open:  [{ /* 五列 + evidence */ }],
  coverage: { read: 4, total: 4, skipped: [] },
  closure: null | 'no-findings' | 'blocked'
}
```

- `hit` 必带 `evidence`；`na` 必带 `reason`；
- `open` 非空时 `closure` 不得为 `no-findings`（`ContradictoryClosure`，结构对账，不依赖词表）；
- 产物 schema 必须有校验器，否则 `UnverifiableOutput`。

### 4.2 校验链四段 `[已确认]`

| 段 | 做什么 | 不过时 |
|---|---|---|
| ① 结构 | 类型 / 必填 / 枚举 / `closure` 与 `open` 条数对账 | 逐条报错，不继续比渲染（避免级联噪声） |
| ② 证据可解析 | 路径白名单 → 存在 → 行号 → 该行含 quote → quote 足够长 | 逐条报错 |
| ③ 渲染一致 | md 必须逐行等于 `renderObservation(doc)` | `RenderMismatch` + 首个差异行号 |
| ④ 写盘 | 前三段全过才落盘；原子写（临时文件 + rename） | **一个字都不写** |

### 4.3 证据五道 `[已确认]`

1. `path` 必须是**相对路径**（绝对 / 盘符相对 / UNC → `EvidencePathAbsolute`）；
2. 解析后（含软链 realpath）必须落在根目录内（`EvidencePathOutside`）；根默认当前目录，fail-closed；
3. 文件可读（指向目录等 → `EvidenceUnreadable`，不得抛异常打崩校验器）；
4. `line` 在文件行数内且该行包含 `quote`（空白归一后比较）；
5. `quote` 长度二选一：归一化后 **≥10 字**，或 **≥4 字且占该行内容 50% 以上**（`EvidenceQuoteTooShort`）。

> 第 5 条为什么不用单一字数下限：真实卡面有一类正当短引用（`# 角色：侦探`，7 字，占该行 13 字的 54%）。单一 ≥10 会把它判死，逼人往引用里塞相邻文字，反而更假。`[已决·代裁]`

### 4.4 错误码（实测，非「拟」）

| 段 | 错误码 |
|---|---|
| 结构 | `InvalidDocument` `InvalidFieldType` `MissingItems` `UnknownItem` `UnknownVerdict` `MissingReason` `MissingOpenField` `MissingCoverage` `InvalidCoverage` `UnknownClosure` `ContradictoryClosure` `UnknownField` |
| 证据 | `EvidencePathAbsolute` `EvidencePathOutside` `EvidenceNotFound` `EvidenceUnreadable` `EvidenceLineOutOfRange` `EvidenceQuoteMismatch` `EvidenceQuoteTooShort` |
| 渲染 | `RenderMismatch` |
| 入口 | `JsonNotFound` `InvalidJson` `MdMissing` |

模型层另有：`UnverifiableOutput` `FalseScriptCheck` `EmptyOpenWithoutReason` `WeakReason` `OutOfScopeOpenItem` `DuplicateAsOpen` `MissingPrerequisite` `UnboundLanding` `SubjectMismatch` `AmbiguousCriterion` `DuplicateCheckItem` `PointerToElsewhere` `ProceduralWordOutsideParliament` `MixedTermInCard`。

### 4.5 写盘唯一入口 `[已确认]`

产物只能由 `writeObservation(doc, { jsonPath, mdPath, registeredIds, root })` 写出：校验不过返回 `{ ok:false, wrote:false, errors }`，两个文件都不落；通过则 json 与 md 同时原子写，md 由 doc 渲染得到，人手不可写。

---

## 5 门禁与追责

### 5.1 时点 `[已确认]`

| 时点 | 跑什么 |
|---|---|
| 每次 `npm run check` | 扫约定路径产物，逐个跑四段校验 |
| 审查收尾（`.session/reviews/` → `docs/superpowers/reviews/` 迁移） | 迁移**前后各跑一次**（只认临时目录 = 没装） |
| 新增 / 改动产物 | 提交前必须绿 |

### 5.2 强制口径 `[已确认]`（A-8）

- **归档目录**（`docs/superpowers/reviews/**/observation-r*.json|md`）：必须过四段校验 **且**被 git 跟踪（未跟踪 → `UntrackedArtifact`）、**且**无未提交改动（→ `ArtifactDirty`）。
- **审查过程目录**（`.session/reviews/…`）：只做四段校验，不做 git 断言（`.session/` 在 `.gitignore` 里，断言必然假红）。
- **零产物**：打印「0 件，跳过」且 exit 0，否则新建分支首次跑 check 即红。
- **存量不追溯**（2026-10-26，精算师 Q-A-08）：本门禁只覆盖 `observation-r*.json|md`。仓库现有的 **11 份** `round-check.md` 与 `docs/superpowers/reviews/` 下既有 **9 个**文件**不迁移、不改格式**，其处置归议会流程 PRD；读者不得据此认为门禁覆盖全部产物。取数：`Get-ChildItem -Recurse -File -Filter 'round-check.md' | Measure-Object` → 11；`… -Filter 'observation-r*'` → 0。

### 5.3 边界（说清楚拦不住什么）

| 场景 | 能不能拦 | 说明 |
|---|---|---|
| 手写 md 冒充产物 | 能 | 渲染比对不过 |
| 引用指向不存在 / 不匹配 / 过短 | 能 | 证据五道 |
| 引用出了仓库 | 能 | 路径白名单 |
| 产物被手改 | 能（归档后） | `ArtifactDirty` |
| json 与 md **一起**改成一致 | **不能** | 本地无可信锚；靠 git commit 的 diff 让人看见 |
| 引用是否**支撑**结论 | **不能** | 读语义，脚本无此能力 |

### 5.4 残余风险（已知并接受）

| # | 风险 | 处置 |
|---|---|---|
| R-1 | 过程产物（`.session/`）改动不可追 | 接受；归档时把差异带进 commit |
| R-2 | 合谋改（json + md 同时改一致） | 接受；靠评审看 diff，不靠机器 |
| R-3 | 证据与结论的语义匹配 | `check:'manual'` + 独立方抽查，抽查比例写入 spec |
| R-4 | 开放项「0 条」路径实测样本少 | 已改口径：不作为验收目标，改为「每条可回指原文」 |

---

## 6 功能点清单

> 本表是本文的功能点权威清单；ID 变更需重签本节。

| ID | 功能点 | 归属 | 来源 |
|---|---|---|---|
| F-01 | 场景 / 信号模型（`scene` + `moment` + `repeat`；五类信号，无 merge） | 定义层 | 探索稿 §12.1 |
| F-02 | 动作五要素（触发 / 宾语 / 判据 id / 落点 / 前置 `requires`） | 定义层 | 探索稿 §3.2 / §12.10.4 |
| F-03 | 同编号覆盖（同层报错 + `reason` 必填 + 无差异报错 + `overrides[]`） | 定义层 | A-1 |
| F-04 | 检查项两层（`CATEGORIES` + `CHECK_ITEMS`，含 `subject` / `criterion` / `check` 三类） | 定义层 | 探索稿 §12.2 / §12.10.2 |
| F-05 | 检查项三态 + `subject` 类型匹配（`SubjectMismatch`） | 定义层 | 探索稿 §12.10.9 |
| F-06 | 开放项 `openItem`（基类五列 + 派生 `scope`；0 条须可核理由） | 定义层 | 探索稿 §12.10.3 |
| F-07 | 判据表达式化（「或」拆条、「且」留条；词表进数组、阈值进 `params`） | 定义层 | 探索稿 §12.3 |
| F-08 | 落点枚举化 + 参数化（`UnboundLanding`） | 定义层 | 探索稿 §12.10.5 |
| F-09 | 卡面自足（禁指针 `PointerToElsewhere`；散文只进 note 且物理隔离） | 渲染层 | 探索稿 §12.4 |
| F-10 | 一份数据三投影（卡面 / README 每席一份 + 自动 index / dump） | 渲染层 | A-3、探索稿 §2 |
| F-11 | 全席重生成（**落地时点的 `agents/*.md` 全集**，当前 15，随 mainline S2/S3 增长；先侦探试点对照稿，再铺满） | 渲染层 | A-4；取数 `Get-ChildItem agents/*.md \| Measure-Object` |
| F-12 | 称谓口径（议会内过渡期可并用、不得混用；议会外主 agent） | 渲染层 | A-5 |
| F-13 | 产物 schema + 校验器绑定（`UnverifiableOutput`） | 产物 | 探索稿 §12.10.1 |
| F-14 | 四段校验链（结构 / 证据 / 渲染 / 写盘） | 产物 | §4.2 |
| F-15 | 证据五道（路径白名单 / 存在 / 可读 / 行号命中 / 最小长度） | 产物 | §4.3 |
| F-16 | 唯一写盘入口 `writeObservation`（校验不过零写盘、原子写、md 派生） | 产物 | §4.5 |
| F-17 | 门禁接入 `npm run check`（零产物跳过） | 门禁 | §5.1 |
| F-18 | 归档目录强制（git 跟踪 + 无未提交改动） | 门禁 | A-8、§5.2 |

---

## 7 待确认清单

| ID | 待确认项 | 建议 | 状态 |
|---|---|---|---|
| D-01 | 检查项共用粒度 | 主语相同才共用（`k*` / `s*` 分开），配 `DuplicateCheckItem` | `[已决·代裁]`：分开。理由：主语不同则判据不可复用，硬合会让一个条目判两类对象，正是 §12.10.9 主体错位的来源 |
| D-02 | 产物路径与命名 | 过程 `.session/reviews/<那次>/observation-r<N>.json|md`；收尾随目录迁 `docs/superpowers/reviews/<同名>/` | `[已决·代裁]`：不新造目录，复用既有 reviews 迁移规则；`r<N>` 与 `round` 字段同源，防止「文件说第 3 轮、内容写第 2 轮」 |
| D-03 | 门禁失败的处置 | 阻断：`check` 非 0，不允许带红送审 | `[已决·代裁]`：阻断。不设 warning 档——可忽略的告警等于没有告警 |
| D-04 | 「0 条开放项」是否作验收目标 | 不作目标，改「每条可回指原文」 | `[已决·代裁]`：三批实验均未观测到 0 条（探索稿 §13），继续当目标会诱导硬凑或造假 |
| D-05 | 试点期旧卡怎么处理 | 试点期保留旧卡作对照；铺开后删除旧槽位散文，不留双份 | `[已决·代裁]`：不留双份。两份说法必然漂移（`docs-convention` 硬约束 5） |
| D-06 | `check:'ai'` 与 `check:'script'` 的比例目标 | 不设比例，只要求每条 `ai` 有判定口径 | `[已决·代裁]`：设比例会逼人把语义题硬标成 script（`FalseScriptCheck`） |
| D-07 | 15 席一次铺 vs 逐席滚动 | 逐席滚动，且**出数门槛**：试点席完成后用 `git diff --numstat agents/ tools/docgen/` 量单席改动行数 + 工时，×14 + 20% 缓冲 = 剩余工期，再决定批大小 | `[已决·代裁]`：改自「待确认」。PRD 里填一个凭空的工期数字比留白更坏；改成一个可执行的测量门槛，数字由实测产生 |
| D-08 | 与 `dev-workflow-mainline` 的边界：哪份 PRD 负责 `tools/docgen` 模型改造与「全席重生成」 | **已定（2026-10-26 用户裁定）**：本 PRD 优先。`tools/docgen` 模型改造与「全席重生成」归本 PRD（S1 / S4）；mainline S3 只留 `speaker` + `respondent-*` 新卡与两张矩阵，S6 只留权限 / 字符串单源 | `[已确认]`。连带待办：mainline 需重新优化并重签 §0（功能点集合变化，按 R5），登记于 `docs/after/20261026211515-mainline-prd-reoptimize-open-decisions.md`；原证据 `mainline/index.md:689`（S3 行）、`:693`（S6 行） |

---

## 8 交付拆分（S1–S4）

| 份 | 内容 | 涉及文件 | 依赖 |
|---|---|---|---|
| **S1** 定义层 | F-01～F-08：数据结构 + 校验器（不渲染） | `tools/docgen/**`（模型与校验）、`tools/docgen/test/*.test.mjs` 断言 | 无 |
| **S2** 产物合同 | F-13～F-16：把 `C:\Users\HuangChunhua\.retro-skills\observation-check-draft\` 的实现收进 `tools/observation-check/`（补独立 testcase，71 条为基线） | `tools/observation-check/**`、`scripts/check-all.mjs`（已用 `**/*.test.mjs` 全仓 glob，**不需**新增 `package.json` 入口——先核对再决定） | 软依赖 S1：`registeredIds` 由调用方注入，可先用静态清单 |
| **S3** 门禁接入 | F-17～F-18：`check-all.mjs` 增段、零产物跳过、归档目录 git 断言、存量不追溯声明 | `scripts/check-all.mjs`、`docs/superpowers/reviews/**` 约定 | S2 |
| **S4** 渲染层 | F-09～F-12：三投影 + 覆盖记录 + 全席重生成（侦探先行） | `tools/docgen/templates/**`、`agents/*.md`、`README` 生成物 | S1、S3 |

**执行顺序：S2 → S3 → S1 → S4** `[已决·代裁]`（2026-10-26 精算师 Q-A-06 后改，原为 S1 先行，可推翻）。

理由：① S2 的 888 行已写完且 71 条测试绿，成本已沉没，先收进 git 才有价值；② S2 对 S1 只是**软依赖**（`registeredIds` 由调用方注入：草稿 `checks.mjs` 用 `registeredIds.includes(...)` 判断，`artifact.mjs` 的默认值是空数组），先落不阻塞；③ 「门禁先立」这条理由支持的是 **S2/S3 早于 S4**，不支持 S1 早于 S2/S3；④ S1 是成本最大且唯一没有实测数的一份（§0.4 只量到存量体量，没量改造量），不该排在已绿的一份之前。

**最小闭环**：若只想止血（让已付的 888 行不再躺在仓库外、产物有机器验收），做 **S2 + S3** 即可，合计约 1 份 spec + 1 份 testcase + 一段门禁。S1 + S4 是第二段，可按 D-07 出的单席实测成本再决策。

**F → S 覆盖表**

| F | S | 备注 |
|---|---|---|
| F-01～F-08 | S1 | 定义层一次做齐；判据 id 是后三份的共用词汇表 |
| F-09～F-12 | S4 | 渲染层；F-11 需 S3 的门禁做逐批验收 |
| F-13～F-16 | S2 | 产物合同；实现已有 71 条测试，搬入时补齐独立用例 |
| F-17～F-18 | S3 | 门禁；零产物分支必须有测试 |

**每份的规矩**：同批由 `senior-sdet` 在全新上下文产出 testcase，spec 只写「测什么 / 为什么」并外链用例文件；缺 testcase 不得送议会、不得进 plan。

---

## 9 验收（本文档自身）

| # | 验收项 | 判据 |
|---|---|---|
| V-1 | 三档标记齐全 | 每条裁决都有标记，无未标记结论；`[待确认]` 定稿前必须为 0（现为 **0 条**；D-07、D-08 已于 2026-10-26 收敛） |
| V-2 | 待确认可逐条划 | §7 每个 D 都有建议与结论栏 |
| V-3 | 功能点有落点 | §8 F→S 表覆盖 F-01～F-18，无空格 |
| V-4 | 数字可复算 | §0.3 每个数字带取数方式；不得引用未标注来源的数字 |
| V-5 | 范围与用户裁定一致 | §2「做 / 不做」逐条能对上 §0.2 的 A-7 / A-8 |
| V-6 | 门禁能真红 | 按 §5 造 5 种反例，每种都必须红且错误码对得上；零产物必须绿 |
| V-7 | 残余风险有处置 | §5.4 四条各有处置，且处置可执行（不是「注意一下」） |
| V-8 | 探索稿与 PRD 不并存两说 | 结论只在 PRD 一处；探索稿相应段落改为指针，不并列 |
| V-9 | **收益可核**（2026-10-26 精算师 Q-A-03 补） | 判据三条同时成立：① 下一批 **≥5 次**同规模评审中，观察表 **100%** 由 `writeObservation` 写出且四段校验全绿；② 至少拦到 **1 例** `RenderMismatch`（手写 md 冒充）与 **1 例** `EvidenceQuoteTooShort`；③ 同规模评审的轮次与墙钟对比 `dev-workflow-mainline` V-6 基线（294 分 27 秒）。基线 = 今天 **0 件**（§0.4）。判定时点 = S3 落地后首次归档迁移；此前不判 |
| V-10 | 成本可复算 | §0.4 每一行在本机可粘贴复算且结果一致；D-07 的工期数字必须由试点实测产生，不得手填 |
| V-11 | §0 状态与四栏一致 | §0.0 状态句必须与四栏记录一致：精算师已签（事后复核）、市场 / 产品经理**留空**（用户 2026-10-26 裁定）、用户已签（同日）→ 写「已通过」。另：全文不得出现「市场已评审」「产品已评审」——这两栏是留空，不是已审 |

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
| §4 产物合同 | §14（全节） |
| §5 门禁 | §14.7、§14.8 |
| §9 V-4 的数字来源 | §0.3、§11、§13、§14.6 |

---

## 附录 B　精算师评审问题表（2026-10-26 原文转录）

> 来源：`reviewer-actuary` 独立上下文评审（事后复核）。完整叙述见当次会话；下表按原产出的八字段表转录，仅压缩「问题描述」措辞，证据与级别不改。

| 编号 | 维度 | 问题（摘要） | 证据 | 级别 | 处置 |
|---|---|---|---|---|---|
| Q-A-01 | 数字真实性 | 「形态 240/240」「隐式 0/4」与源记录不符：实为 233/240（160+40+33）、隐性六卡 17/24（C01 单例 0/4） | 探索稿 `:268` / `:287` / `:293` / `:295-304`；本文原 `:40` / `:42` | P0 | **已改** §0.3 + 纠错注 |
| Q-A-02 | 跨 PRD 成本归属 | 本 PRD S1/S4 与 mainline S3/S6 同时认领 `tools/docgen` 与「全席重生成」；「15」是静态数，S2/S3 还会新增席位 | 本文 S4 行；`mainline/index.md:689` / `:693` / `:690` | P0 | **已决**（用户 2026-10-26）：本 PRD 优先 → §7 D-08 / §0.2 A-9；mainline 重优化待办登记 `docs/after/20261026211515-mainline-prd-reoptimize-open-decisions.md` |
| Q-A-03 | 收益可验证性 | §9 无收益项；今天 0 件产物，门禁上线即「0 件跳过」，收益不可观测 | `observation-r*` 全仓 0；`docs/superpowers/reviews` 9 文件 0 件合规；`.session/reviews` 46 目录；`mainline:749`（V-6 先例） | P1 | **已改** §9 V-9 + §0.4 收益基线 |
| Q-A-04 | 成本量化缺失 | 成本侧零数字；S1 爆炸半径（559 行 + 15 fixture + 15–21 个测试文件）未列；单席成本被 D-07 留白 | `agentData` 294 + `validateAgentData` 144 + `renderAgent` 46 + `agent.md.tpl` 24 + `agent-handwritten.md.tpl` 51；卡面 731 行 | P1 | **已改** §0.4 成本表；D-07 改出数门槛 |
| Q-A-05 | 数字口径 | 「9 条 8 绕过」与「0/10」分母不一致，第 10 例不可查 | 探索稿 `:666` / `:668` | P1 | **已标注** §0.3「分母待核」 |
| Q-A-06 | 排期与收益顺序 | 「S1 先行」只被「门禁先立」支持，而门禁是 S2/S3；S2 已绿且对 S1 是软依赖 | 草稿 `checks.mjs` 的 `registeredIds.includes(...)` 判断与 `artifact.mjs` 的空数组默认值；草稿 888 行 71 测试绿 | P2 | **已改** §8 顺序 → S2→S3→S1→S4，标代裁可推翻 |
| Q-A-07 | 路径可核性 | §8 S1 写 `test/*.test.mjs`，本仓根目录无 `test/`；S2 的 `package.json` 入口与 `check-all` 全仓 glob 重复 | 根目录无 `test`；`scripts/check-all.mjs:76` | P2 | **已改** §8 两行 |
| Q-A-08 | 存量与范围声明 | 只认 `observation-r*`，现存 `round-check.md` 与归档件不在判据内，未声明存量处置 | 全仓 `round-check.md` **11 份**（精算师原写 10，本 PRD 复数为 11）；`docs/superpowers/reviews` 9 文件；`观察表` 字样 0 命中 | P2 | **已改** §5.2 存量不追溯 |
