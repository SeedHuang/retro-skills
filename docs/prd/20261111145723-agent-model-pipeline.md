# agent 模型驱动生成流水线（PRD）

> 状态：P5 已收口（用户终签 2026-11-12；验证通过；账本 `.session/reviews/2026-11-12-1240-p5-close-r2/`）｜创建：2026-11-11
> 替代：`20261019093443-docgen-agent-generation.md`（P2）中「agent 卡怎么生成」这一段；P2 的「草稿 → 确认 → 替换」纪律继续有效
> 研究材料：`tmp/agent-criteria-demo/`（仅作输入，不直接进正式仓；**P5 已执行删除，下文历史引用保留为记录**）
> 硬纪律：除 P5 切换阶段（且逐卡确认）外，**任何阶段不得写 `agents/*.md`**

## 1 背景

### 1.1 现在有三个病

| # | 病 | 实证 | 后果 |
|---|---|---|---|
| 1 | **规则错发**：共享规则按「全席继承」下发，不看本席产出 | `tools/docgen/builders/agents/card-model/vocab/shared-actions.mjs:88-102` 的 `SHARED_USE` 15 席全 = `ALL_SHARED`；`evidence-reader` 卡面同时写着「不出问题卡」与「建议解法栏为空即违规」（`agents/evidence-reader.md:12`、`:66`） | 卡面自相矛盾，AI 只能二选一 |
| 2 | **卡面不可测**：句子含规则 / 动作 / 判断，但没有判据 | 早期手写卡里「不得只提问题不给解法」这类对仗句与「证据可复算」这类无锚断言混排；对应治理记录 `tmp/agent-criteria-demo/deletions.md:52-61` | 执行时还要再翻译一遍，结果不可复算 |
| 3 | **生成物不可复算**：手写与生成并存，门禁只能整卡比对 | 现役 `cardPipeline` 只认内存 `agentData` 的 12 键（`tools/docgen/builders/agents/components/cardKeys.mjs:5-6`），外部模型 JSON 进不来 | 改一处只能靠人读，无法机器判漂移 |

### 1.2 为什么现在做

- 研究期已把 7 张卡抽成模型，展开后与瘦身前逐字节等价（`tmp/agent-criteria-demo/verify-models.mjs` 输出 7 行 `EQUIVALENT`）
- 7 张卡已能被渲染器完整出卡（`node render-all.mjs` 输出 7 行；连续两次渲染字节差 0）
- 策略侧刚补齐（本轮）：`artifacts.mjs` 补 3 个产物、`seat-policy.mjs` 5 席补可写清单、`seats.mjs` 登记 3 席，`POLICY_DIFF` 清零
- 旧生成链已停滞：`policy-pure-source.test.mjs` 6 红、`tool-tiers.test.mjs` 9 红（改动前既有，非本轮引入）

## 2 目标与非目标

**目标**

1. 卡面**只由模型数据经确定性渲染产生**，同一模型两次渲染逐字节相同
2. 卡面每句可回查：断言有 `observable` 支撑，展示文本不被任何判据读取
3. 共享规则按**本席产出**下发，不再全席继承
4. 建模能力产品化为 skill：既能把存量 markdown 转成模型，也能从用户口述生成新 agent
5. 切换后旧生成链退场，`tmp/agent-criteria-demo/` 可删除且无残留引用

**非目标**

- 不改 `agents/` 之外的产物类型（rule / skill 正文生成另行立项；2026-11-12 用户决定**暂停**，见 `docs/prd/docgen-index.md` D19）
- 不在本期实现「判据求值器全量」（负例只做结构检查，`tmp/agent-criteria-demo/open-issues.md` C4）
- 不改 `pathGroups` / `commandGroups` / `capabilities` 的内容（只被引用，不被重定义）
- 不做多语言、不做 agent 运行时框架

## 3 现状盘点（防重复开发、防污染）

### 3.1 真实环境已落地，不能重做

> 以下为 P5 前现状（2026-11-11 盘点）；现行入口以 §11 取证锚与 §6 P5 表末列为准。

| 能力 | 位置 | 说明 |
|---|---|---|
| 卡渲染管线（P5 后已删） | `tools/docgen/builders/agents/components/cardPipeline.mjs` | 由 `agentData` 内存数据渲染 18 张卡（P5 前现状） |
| 门禁 | `tools/docgen/builders/agents/cli.mjs`（`gate` / `diff` / `draft`） | 重渲染比对 `agents/*.md` |
| 策略三键 | `tools/docgen/builders/agents/policy/seat-policy.mjs` | `capabilities` / `allowGroups` / `artifacts` |
| 产物归属 | `tools/docgen/builders/agents/policy/definitions/artifacts.mjs` | 7 项（本轮新增 3 项） |
| 边界渲染 | `tools/docgen/builders/agents/components/renderBoundary.mjs` | 15 槽，由 `seats` + 策略数据渲染 |
| 类型/档位 | `policy/definitions/tiers.mjs`、`seats.mjs` | 四档、9 席已登记 |

### 3.2 研究期已跑通，可迁移

| 能力 | 位置 | 状态 |
|---|---|---|
| 模型 + 共享块（`extends` + `appliesWhen` + 浅合并） | `tmp/agent-criteria-demo/models/` | 7 张，展开等价 |
| 类型体系（Base / Reviewer / Auditor / Respondent） | `tmp/agent-criteria-demo/types/` | 7/7 判别通过 |
| 语义校验（13 类校验码） | `tmp/agent-criteria-demo/verify-models.mjs` | 7 张全过 |
| 段渲染（9 段） | `tmp/agent-criteria-demo/render/sections.mjs` | 7 张全出卡 |
| 渲染基线（防漂移） | `tmp/agent-criteria-demo/models/_baseline/` + `update-baseline.mjs` | 已建立 |

### 3.3 只有设计、没有实现

| 项 | 出处 | 缺什么 |
|---|---|---|
| 判据求值器（负例真跑） | `open-issues.md` C4 | 只有结构存在性检查 |
| 单元测试 | `open-issues.md` C5 | 10 个模块的测试范围已列，未写 |
| `outputFormat` 段渲染 | 6 张模型有配置，产物 0 处出现 | 段函数未写 |
| `tools` 进模型 | `render/sections.mjs:92` 读现役策略 | 模型 `seat` 无档位字段 |
| 边界段（15 槽）进模型 | 模型无此段 | 现役卡有、新产物无 |

### 3.4 过期 / 不可用材料（不得作为本 PRD 依据）

| 材料 | 过时点 | 替代依据 |
|---|---|---|
| `result.md` §3 / §5 / §6 | 单卡删改的早期结论，写于越界回滚前 | 以 §8 为准（文件自身 `:855-865` 已标） |
| `result.md` §10.1 规则 1–3 | `groups[]` 轴已并入 `permissions` | `interpreter-design.md:110-117` |
| `interpreter-design.md` 开头状态行 | 写「仅 reviewer-audit 跑通」 | 实际 7 张全渲染 |
| `interpreter-design.md` §8 未决 2 | 「其余 6 卡未渲染」 | 同上 |
| `types.md:16` | 写「判别依据是记录集合」 | 与 `types.md:127` 冲突；以 **artifact id** 为准 |
| `open-issues.md` A2 / A3 | 已修 | 文件内已改写为「已修」 |
| `deletions.md` P 类「待决策」表 | 已定为 B（按席裁剪） | 本轮 demo 已按产物收敛 |
| `design-zero-translation.md` §2 | 轴设计未落地；agent 侧已由 `permissions` 表达 | 本文 §4.2 引用其结论，不引用其结构 |
| `verifyLedger.mjs` / `verifyLedger.demo.mjs` | `import './ledger.mjs'` 在 demo 内不存在，无法运行；且属账本校验，与本流水线无关 | 不纳入范围 |

## 4 目标架构

### 4.1 五层管线

```
jsons/<seat>/index.json + jsons/_shared.json       ① 数据层
      │  extends 展开（rules 按 appliesWhen 过滤，records/forms 浅合并）
      ▼
类型判别 + 结构校验 + 语义校验                       ② 校验层
      │  失败即停，不进入渲染
      ▼
段装配（按类型选段清单）                             ③ 渲染层
      │  每段一个纯函数；无手写句子
      ▼
output/<seat>.md  →  （P5 后）agents/<seat>.md       ④ 产物层
      │
      ▼
基线比对 / 门禁                                      ⑤ 防漂层
```

### 4.2 三条不变量

| # | 不变量 | 判据 | 违反后果 |
|---|---|---|---|
| I1 | **单一数据源**：卡面每句话都能在数据里找到来源 | 展示文本外的句子必须由字段派生；`checkCriteria.summary` / `outputFormat.checks[].text` 手写即红 | `SummaryHandwritten` / `OutputTextHandwritten` |
| I2 | **机械渲染**：同输入同输出 | 连跑两次字节差 = 0 | 渲染器含随机/时间/环境依赖 |
| I3 | **标题不弱于判据**：给人读的名称不得强于可观测断言 | 断言词必须能在 `observable` 找到对应 op | `TitleDrift` |

### 4.3 类型体系

判别依据是**产出的 artifact id**，不是字段存在性、不是 `records`（`respondent-architect` 也读问题卡）：

| 子类 | 判别 | 额外约束 |
|---|---|---|
| `ReviewerModel` | 产出 `artifact.issueCard` | 必含 `predicates.issue-without-solution` |
| `AuditorModel` | 产出 `artifact.roundCheck` 或 `artifact.deliveryAudit` | 必含 `verdicts` |
| `RespondentModel` | 产出 `artifact.factSummary` / `artifact.defenseRecord` / `artifact.detective` | 不得产出 `artifact.issueCard` |

### 4.4 渲染规则

沿用 `tmp/agent-criteria-demo/interpreter-design.md` 规则 1–43（含规则 43：目标为 `issue.card.*` 的规则只下发给出问题卡的席）。

## 5 关键决策

| # | 决策 | 理由 |
|---|---|---|
| D1 | 模型是唯一真相，markdown 是视图 | 研究期结论；对齐 docgen 既有 D1 |
| D2 | 一个 `outputKind` 一个产物文件，多席按 `section` 分节 | 避免「按席命名」导致 5 个同义文件 |
| D3 | 共享规则用 `appliesWhen` 按席过滤，不按全量继承 | A2 根因；新校验码 `ISSUE_RULE_ON_NON_ISSUER` 兜底 |
| D4 | 权限只写一处：`permissions.{action,write,command}` | 收敛前的四处表达必然不同步 |
| D5 | 写权限白名单 = `seat.artifacts` | 声明了产物却「不得写任何文件」是矛盾 |
| D6 | 判据摘要 / 表格注由数据派生，不存手写字段 | I1 |
| D7 | 判定方必须具名（`本席` / 命令原文 / `抽检：{who}`） | 「机判」「半机判」无主语、无定义 |
| D8 | 自证布尔不算判据，必须换外部事实 | 本席自己填「已核对」= 没判 |
| D9 | 边界段（14 槽）继续由现役 `renderBoundary` 产出，作为模型的一个段接入 | 现役已有 7 处测试钉住该段；重写风险高于复用。槽数历程：15 → 12（2026-11-12 事实归属，允许项移入权限段）→ 14（2026-11-13 新增 `WRITE_FORBID` / `WRITE_FALLBACK`） |
| D10 | 新产物先进 `sandbox/`，与 `agents/` 并存比对 | 满足「不影响现在的 agent」 |
| D11 | 存量迁移逐席串行：建模 → 校验 → 渲染 → 人工确认 → 下一个 | 单件流，对齐 docgen D11 |
| D12 | 切换只在 P5 一次做完，不做半量替换 | 半量会让 gate 无法判定基线 |

## 6 阶段

### P1 渲染隔离产物（对应实现步骤 1）

**目标**：7 张模型渲染成「可替换现役卡」的完整卡面，落在隔离目录，`agents/` 零改动。

**输入**：`models/` 7 张 + 渲染器。

**要补的 4 个缺口**（不补则产物不完整）：

| # | 缺口 | 具体改动 | 验收 |
|---|---|---|---|
| 1 | `outputFormat` 段未渲染（6 张有配置，产物 0 处） | 新增段函数：`requiredFields` 渲染为字段表，`checks` 说明由 `observable` 派生 | 6 张产物出现该段；无手写 `text` |
| 2 | `tools` 取自现役策略，不在模型 | 模型增 `seat.tier`（四档之一）；渲染器改读模型 | 改模型档位 → 产物 `tools` 行跟变 |
| 3 | 边界段（15 槽）未接入 | 模型增 `boundary` 段声明（引用 `seats` / 策略数据），渲染时调 `renderBoundary` | 产物含 15 槽；与现役卡该段逐字一致 |
| 4 | 越界处置编号硬编码 `1.` | 按 `steps` 序号渲染 | 4 步时输出 1–4 |

**产出**：`tmp/agent-criteria-demo/sandbox/<seat>.md` ×7 + 差异报告（`sandbox/diff-report.md`：段级差异、字符数、缺失项）。

**验收**：

```
node render-all.mjs          → 7 行，0 错误
node render-all.mjs（第二次）→ 7 个文件字节差 0
node verify-models.mjs       → 7 行 EQUIVALENT，无 POLICY_DIFF / TYPE_* / ISSUE_RULE_ON_NON_ISSUER
git status --short agents/   → 空
```

**边界**：不写 `agents/`、不改 `tools/docgen/**`。

**回滚**：删除 `sandbox/` 即可，无外部影响。

### P2 四维评估（对应实现步骤 2）——本阶段结束后**停下**

**目标**：用独立评估者量化「新产物 vs 现役卡」，产出调优清单，不进入下一步。

**产出**：`tmp/agent-criteria-demo/eval/report.md` + 原始数据 `eval/raw/`。

**验收**：四维各 ≥3 轮、盲测、口径见 §7；报告含每维中位数与极差，以及「保留 / 修改 / 回退」结论。

**停下条件**：报告提交后由用户决定是否调优、调完再重跑 P2。**未获确认不得进入 P3。**

### P3 建模 skill 化（对应实现步骤 3）

**目标**：把「markdown → 模型」拆解能力做成可复用 skill，产出草稿模型，不直接写正式仓。

**产出**：

```
skills/agent-modeling/
  SKILL.md                 七阶流程 + 触发条件 + 与渲染器的接口
  references/
    grammar-gaps.md        八类语法部件与缺口四元组
    checks.md              校验码清单（含 43 条渲染规则索引）
    model-schema.md        模型字段、extends / appliesWhen / 浅合并
    permissions.md         permissions 三维 + permissionGroups
  scripts/
    verify.mjs             展开 + 等价性 + 权限 + 标题校验
    render.mjs             单卡渲染
```

**输入形态（两种都要支持）**：

| 输入 | 走法 |
|---|---|
| 存量 `agents/<seat>.md` | 拆解 → 缺口四元组 → 补模型 → 校验 → 渲染 → 与原文 diff |
| 用户口述「这个 agent 要做什么」 | 先出模型草稿 → 用户确认语义 → 再渲染 |

**关键约束**：skill 只写 `drafts/`，不写 `agents/`；渲染预览落 `drafts/<seat>.md`。

**验收**：用 1 张已建模卡（`reviewer-actuary`）回放，skill 产出的模型与现模型展开后等价；`skills/agent-modeling` 通过 skill 体检。

### P4 存量迁移 + 复评（对应实现步骤 4）

**目标**：11 席未建模的卡（`reviewer-product` / `interaction` / `ui` / `frontend` / `backend` / `ops` / `qa` / `security` / `reader` / `senior-sdet` / `speaker`）全部建模，18 席整体复评。

**节奏**：逐席串行，一席一闭环：

```
skill 建模 → verify 全绿 → 渲染 → 与 agents/<seat>.md 段级 diff → 人工确认 → 下一席
```

**产出**：18 张模型 + `eval/report-round2.md`。

**验收**：

```
18 张全 EQUIVALENT
逐席沙箱产物 vs 现役卡：无「未解释差异」（每处差异在 diff 报告中归类为「改进」并给出依据）
四维抽测：至少覆盖 6 席（Reviewer ≥2 / Respondent ≥2；`AuditorModel` 全测——本仓仅 `reviewer-audit` 1 席）；抽测口径以 §7.1 为唯一源
```

**边界**：仍不写 `agents/`。

### P5 切换与清理（对应实现步骤 5）

**替换面（缺一即不算干净）**：

| # | 面 | 动作 | 完成 / 证据锚 |
|---|---|---|---|
| 1 | 生成方法 | `cardPipeline` 的入口从 `agentData` 改为 `models/`；保留原函数作为兼容层或删除 | 完成：`models/` 为唯一入口；`tools/docgen/models/agents/source.mjs:1-3`（不再经 `agentData` / `triggerTable` / `seatLoader`，旧链已退场） |
| 2 | 配置文件 | `agentData.mjs` / `triggerTable` / `SHARED_MUST` / `SHARED_NEVER` / `SHARED_USE` 由模型取代 | 完成：旧配置链已删；同锚 `tools/docgen/models/agents/source.mjs:1-3` |
| 3 | 渲染引擎 | `renderCard.mjs`（P5 后由 `components/renderByName.mjs` 承接，见 `tools/docgen/builders/agents/cli.mjs:12`、`:24`）/ `renderBoundary` 的消费方式改为读模型段 | 完成：`cli.mjs:12`、`:24` 指向 `components/renderByName.mjs` |
| 4 | 产物 | `agents/*.md` 全部由 `models/` 渲染；`gate` 对 18 席逐字节比对（切换前基线见 `p5-pre-switch` tag = commit `fa67454`；该 tag 仅本地，未推远端） | 完成：`cli.mjs gate` → `agents 18/18` + `baseline 20/20`（主 agent 2026-11-12 12:46 实跑，exit 0） |
| 5 | 门禁 | `gate` 改为比对新基线；`npm run check` 全绿 | 完成：`npm run check` → `# pass 693` / `# fail 0` / 末行 `check 全部通过`（2026-11-12 12:46 实跑） |
| 6 | 测试 | 6 + 9 个既有红必须清零或按新基线重写；新增模型/渲染/校验单测（`open-issues.md` C5 范围） | 完成：`tools/docgen/models/agents/test/` 现有 7 个测试文件（c5-matrix / source / verify-negatives / types / render-sections / boundary-source / skill-root）；旧红测文件已不在该目录 |
| 7 | 文档 | 旧 PRD 的生成章节标注「被本文替代」；`docs/prd/docgen-index.md` 增一行 | 完成：旧 PRD `20261019093443-docgen-agent-generation.md:4`、`:131` 已标「被替代（P5，2026-11-12）」；`docs/prd/docgen-index.md:11` 标「生成章节被 P5 替代」 |
| 8 | 清理 | 删除 `tmp/agent-criteria-demo/`；**代码/配置面** grep 无 `agent-criteria-demo` 引用（`docs/` 历史记录按 `docs-placement`「历史记录不改」保留） | 完成：代码面 Grep `agent-criteria-demo` → 0 处；`tmp/agent-criteria-demo/` 不存在 |

**验收**：

```
npm run check                      → 全绿（exit 0）
node tools/docgen/builders/agents/cli.mjs gate → agents 18/18，exit 0
grep -r "agent-criteria-demo" tools scripts skills rules agents → 0 处（docs/ 历史记录按 docs-placement 不改）
grep -c '"replaced"' tools/docgen/builders/agents/state.json → 18；gate 逐字节比对 18 席全等，无手改残留
```

**回滚**：切换前打 tag（`p5-pre-switch` = commit `fa67454`；仅本地，未推远端）；回滚 = 恢复 tag + 还原 `agentData` 入口。

## 7 四维评估协议

### 7.1 样本与盲测

| 项 | 规则 |
|---|---|
| 对照 | 现役 `agents/<seat>.md`（A 组） vs 沙箱新产物（B 组） |
| 盲测 | 文件重命名为 `card-A1.md` / `card-B1.md`，评估者不知道分组；分组表只留主 agent |
| 重复 | 每维每卡 ≥3 轮，取中位数；报告极差 |
| 样本 | P2 覆盖全部 7 席；P4 抽测 6 席（三子类全覆盖；`AuditorModel` 只有 `reviewer-audit` 一席，按 1 席全测计） |

### 7.2 四个维度

| 维度 | 定义 | 取数方法 | 合格线 |
|---|---|---|---|
| **AI 理解** | 只给卡面，答固定 8 问的准确率 | 8 问：触发时机 / 作用对象 / 判什么 / 判定取值 / 写哪个文件哪个节 / 判错怎么办 / 三条禁令 / 产物必填字段；答案与模型事实逐条比对 | B ≥ A，且 B ≥ 7/8 |
| **执行力** | 给固定 fixture，按卡产出产物，结构 + 判据命中率 | fixture 三件：1 张含缺陷问题卡、1 份答辩记录、1 次越界写盘；产物用结构校验器判「表在不在 / 列齐不齐 / 必填非空」，判据命中人工 rubric 0/1/2 | B ≥ A；越界识别不得回退 |
| **token 消耗** | 卡面 token + 单任务 token | 卡面：字符数 / 4 估算 + 分词器复核；单任务：subagent 实测输入+输出 | B ≤ A × 1.1 |
| **性能** | 渲染耗时 + 单任务时延 + 工具调用次数 | 渲染：连跑 10 次取中位数；任务：wall-clock；调用次数：工具日志计数 | 渲染 ≤ 200ms/卡；任务时延不劣于 A |

### 7.3 独立评估者协议

- 评估必须由**独立 subagent** 执行：不带主对话上下文，只收到「卡面路径 + 固定题目 + 固定 fixture」
- 每个 subagent 只测一个维度、一张卡，避免相互污染
- 返回结构化 JSON（`{seat, version, dimension, items[{q, answer, expected, hit}]}`），主 agent 只做聚合
- 同一轮内 A/B 组各起独立 subagent，不共用会话

### 7.4 判定

| 结果 | 动作 |
|---|---|
| 四维全部达线 | 进入下一阶段 |
| 任一维退化 >10% | 回 P1 调优（定位到段/规则），调完重跑本阶段 |
| 理解或执行力退化 | 优先查「边界段是否缺失」「规则是否错发」，不得用文字润色掩盖 |
| 某维关键指标缺测（如任务时延未打点） | 该维判「未判定」，不得计入「四维全部达线」；须补测或用户书面豁免，并在报告标注 |

> 已知缺测：任务时延（subagent wall-clock）自 P2 起未打点，性能维只到渲染侧；按本表不得宣称「四维全部达线」。

## 8 风险

| # | 风险 | 影响 | 缓解 |
|---|---|---|---|
| R1 | 边界段（14 槽）接入方式与现役不一致 | 切换后 gate 全红 | P1 先把该段做成「逐字节对齐」验收项 |
| R2 | 18 席里 11 席未建模，拆解中可能发现新语法缺口 | P4 延期 | 每席先出缺口四元组，攒到 3 条同类再扩 schema |
| R3 | 现役 6 + 9 个已知红测试 | P5 无法判定「切换成功」 | 切换前先清零或按新基线重写，作为 P5 前置门 |
| R4 | 模型体积增长导致 token 反超 | 四维之一退化 | 共享块 + `appliesWhen` 已压缩（幅度未复核；原数字无推导记录，2026-11-12 复核判定不可复算）；P2 用实测数据决定是否继续瘦身 |
| R5 | skill 产出模型质量不稳定 | P4 逐席返工 | skill 内置固定校验码；不通过即不出草稿 |

## 9 已定

| # | 问题 | 选项 | 已定 |
|---|---|---|---|
| Q1 | 新产物是否保留现役「边界」14 槽段 | A 保留（D9）／B 用三段式（产出 / 权限 / 越界处置）替代 | 已定：A（依据：2 席写权限席逐字节对齐 `renderBoundary`，切换风险最低；只读席用 literal/default 两形态，不套 14 槽） |
| Q2 | `outputFormat` 段是否保留 | A 补渲染／B 从模型删除 | 已定：A（依据：6 张模型已有 `outputFormat` 配置，产物 0 处，缺口已实测） |
| Q3 | `tools` 放模型哪个字段 | A `seat.tier`（四档）／B `seat.capabilities`（细粒度） | 已定：A（依据：与现役档位表 `tiers.mjs` 同源，避免两处定义漂移） |
| Q4 | P5 前是否必须先清 6 + 9 个既有红 | A 必须／B 允许按新基线重写并保留红灯清单 | 已定：A（依据：切换判据依赖「全绿」，B 只作兜底；现有红测试不属 P1） |
| Q5 | 评估用 fixture 由谁写 | A 我写，你审／B 你指定场景 | 已定：A（依据：测试用例已由独立 sdet 席产出 46 条，评审两轮通过） |

## 10 术语

| 词 | 含义 |
|---|---|
| 模型 | `jsons/<seat>/index.json`，卡面唯一真相 |
| 共享块 | `jsons/_shared.json`，被 `extends` 引用 |
| `appliesWhen` | 规则下发条件：`"*"` 或席 id 数组 |
| 段 | 卡面的一个 `##` 级块，由一个段函数产出 |
| 缺口四元组 | `{path, code, missing, fixTarget}`，code 为闭集 |
| 沙箱 | `tmp/agent-criteria-demo/sandbox/`，P1–P4 的产物落点 |
| fixture | 固定测试输入件；本协议为「1 张含缺陷问题卡 / 1 份答辩记录 / 1 次越界写盘」三件 |
| token | 模型分词计量单位；本协议按字符数 / 4 估算 + 分词器复核（见 §7.2） |

## 11 取证锚

> 本表为 PRD 创建（2026-11-11）时的取证快照。P5 已删除 `tmp/agent-criteria-demo/` 与 `card-model/`：标「P5 前」的锚用 `git show p5-pre-switch:<path>` 或 `git show fa67454:<path>` 复核；现行锚以 `tools/docgen/models/agents/` 路径为准。

| 断言 | 锚 |
|---|---|
| 7 张卡展开等价 | `node tools/docgen/models/agents/verify-models.mjs` → 18 行 `EQUIVALENT`（P5 前为 tmp 下 7 行） |
| 渲染确定性 | 连跑两次 `node render-all.mjs`，7 文件字节差 0 |
| `outputFormat` 未渲染 | `jsons/*/index.json` 中 6 处配置（P5 期路径 `models/*-model.json`）；`output/*.md` 中「## 输出格式」0 处 |
| `tools` 不在模型 | `tmp/agent-criteria-demo/render/sections.mjs:92` |
| 越界编号硬编码 | `tmp/agent-criteria-demo/render/sections.mjs:201` |
| 规则全席继承 | `tools/docgen/builders/agents/card-model/vocab/shared-actions.mjs:88-102` |
| 现役卡自相矛盾 | `agents/evidence-reader.md:12`、`:66`（P5 前；现行对应 `:25`） |
| 既有红灯 | `node --test tools/docgen/builders/agents/test/policy-pure-source.test.mjs` → 6 红；`tool-tiers.test.mjs` → 9 红（改动前既有） |
