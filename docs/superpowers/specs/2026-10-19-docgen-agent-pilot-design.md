# Docgen P2 · S2：试点 1 席（reviewer-audit 数据搬家）

> split from `docs/prd/20261019093443-docgen-agent-generation.md` (2026-10-19)
> 日期：2026-10-19｜状态：待评审（草稿，spec + testcase 一起送议会）｜PRD 状态：已定稿
> **修订版 3（2026-10-19）：按第 2 轮复评修复——补「对 S1 的修订清单」、证据 fixture + `lastWrittenHash`、replace 写序与幂等、generate 覆盖声明、冷跑交付清单、错误码扩展表、模板 `## 共享块` 删除与空块语义**
> 测试用例文件：`docs/superpowers/specs/2026-10-19-docgen-agent-pilot-design-testcase.md`
> 依赖：S1 spec `2026-10-19-docgen-agent-capability-design.md`（能力地基：CLI / 草稿箱 / 守卫 / 退出码）+ PRD §5 W1 + PRD §6.1–6.4

## 0 为什么

P2 的队列第一席是试点（PRD 6.1 序 1）。试点不是「又多搬一个文件」，它是**整个 agent 迁移模型的一次真实验证**：迁移前现文件（黄金快照）能不能反推转录成 docgen 组件数据、description 拆槽后渲染是否逐字复现原文、九步闭环走下来 gate 是否全绿。试点错了，余下 12 席（S4）会带着同样的错搬 12 次；试点对了，S4 就是机械重复。

本 spec 只做一件事：把 `reviewer-audit` 这一席从「迁移前现文件（黄金快照）」转录到「docgen 组件数据 + docgen 生成」，走完九步闭环（PRD 6.2）到巩固（PRD 6.3），并落 W1 验收。PRD 决策原文不复制，引用见 `docs/prd/20261019093443-docgen-agent-generation.md` §3/§5/§6。

**外部编号对照**：

| 编号 | 含义 | 出处 |
|---|---|---|
| P2-2 | description = 派生字段，固定句式 `在{domain}中担任{role}。{when}时调用` | PRD §3 |
| P2-7 | agent 类统一迁移、逐个巩固 | PRD §3 |
| W1 | agent 试点（数据搬家）验收 | PRD §5 |
| 6.2 | 单 agent 闭环九步 | PRD §6 |
| 6.3 | 巩固的定义（六项，达到全部才算） | PRD §6 |
| 6.4 | 失败与回退 | PRD §6 |
| P2-遗-7 | **黄金快照时序**：迁移前现文件是唯一基准；必须在替换前读取，不得用替换后文件当基准 | 本文 R3；来源 PRD 6.2 步 4 |

## 1 全貌确认

| 维度 | 内容 |
|---|---|
| 本质 | 用一席试点证明「黄金快照转录（迁移前现 `agents/reviewer-audit.md` → 组件数据）→ docgen 生成 → 整文件逐字节复现 → 黄金断言 → 替换 → 巩固」整条链成立 |
| 同族 | 同类失败面：description 拆槽错字静默通过、模板补全错位致逐字节不等、转录源误用替换后文件（黄金断言假绿）、模板硬编码该席内容（逐字节绿但 S4 不可复用） |
| 边界 | 只做 `reviewer-audit` 一席；不做其它席（余下 12 席 → S4）、不做 senior-sdet（→ S3）、不做能力地基本身（S1 已完成）；试点只验证模型，不迁移其它席 |
| 验收 | W1（PRD §5）：整文件逐字节一致 + description == 句式拼装结果 + 迁移前黄金断言通过 + 黄金快照 = docgen 产物（快照 = 记录提交号的 git blob）+ 巩固六项 |
| 影响面 | `agentData.mjs`（reviewer-audit 条目 + triggerTable 条目）、`patternRegistry.mjs`（`DOMAIN` + 可注入 domain）、`sharedBlocks.mjs`（新增，AUDIT_RULES 正文）、`outputFormats.mjs`（新增，audit 双格式正文）、`renderAgent.mjs`（新增，纯渲染函数）、`validateAgentData.mjs`（**新增码进 EXIT 表**）、`agent.md.tpl`（全量结构 + `{{TOOLS}}`）、`cli.mjs`（agent 渲染 / gate 漂移收集与导出 / replace 目标哈希复核 + 状态写入 + 幂等恢复 / tmp 清理）、`state.json`（新增，接管状态）、`fixtures/<name>.evidence.json`（新增，步 1/4 证据载体，每席一份）、`acceptance/golden-assert.mjs`（新增，黄金断言脚本：输入 evidence 路径，exit 0/1/2）、`agents/reviewer-audit.md`（替换）、测试 |

**联动四问**：

- **治本了吗**：试点证明模型后 S4 才能机械复制；试点的洞（模板补全错位、when 提取错位、模板硬编码、证据无载体）在搬 12 次前暴露，治本。
- **有副作用吗**：替换 `agents/reviewer-audit.md` 后内容逐字节不变（description 也由句式拼装逐字相等），对下游无感知；新增 `state.json` 只影响 gate/check-agents 的比对子集。
- **跨问题联动吗**：description 拆槽（P2-2）、模板补全、黄金断言（P2-遗-7）、接管状态、证据 fixture 五处互相牵连，必须同批做——错一处在 W1 验收必红。
- **跨文件吗**：`agent.md.tpl` 被 13 席共用；本轮补全为全量结构后，其余席（S4）直接复用；该席专属正文（审计铁律、audit 双格式）**不得进模板**，必须走数据槽。

## 2 核心决定（不可违反）

| # | 决定 | 为什么 |
|---|---|---|
| R1 | **试点对象 = `reviewer-audit`**（PRD 6.1 序 1 示例席） | 它同时含 sharedBlock（AUDIT_RULES）与 outputKind（audit 双格式），模板槽位覆盖最全（F-01 教训：模板结构要与实测对齐） |
| R2 | **数据迁移 = 黄金快照转录 + description 拆槽，且按宿主分开写**：① `agentData` 条目只写 `name/role/dimension/tools/identity/fixedList/sharedBlock/outputKind`（`tools` 写在条目里；允许集仍由 `patternRegistry.tools` 定义）；② 触发表四字段只写 `triggerTable`（本席写 `when/route`，`notWhen/fallback` 缺省不写）。**禁止把 when/route/notWhen/fallback 放进 agentData 条目**（S1 §4.1 单一真相）。description 拆槽：role = 现文件描述句首角色，when = 逐字提取触发子句（含前导「当」，**不含末尾「时」**，句式补「时调用」），domain = `patternRegistry.DOMAIN = '议会评审'` | PRD 6.2 步 2 + P2-2；S1 §4.1 已裁决宿主；内容零改写（措辞/标点/换行逐字保留），仅 description 是派生字段例外 |
| R3 | **黄金快照时序（P2-遗-7）与证据载体**：步 1 记录 ① `git log -1 --format=%H -- agents/<name>.md` ② `git rev-parse <commit>:agents/<name>.md`（blob 哈希）③ SHA256（**统一大写十六进制**）④ `git hash-object --no-filters`；写入 **`tools/docgen/fixtures/<name>.evidence.json`**（每席一份；字段 `commit/blob/sha256/hashObject/goldenAssertion/compareResult/renderSha256/lastWrittenHash`），PRD §6.6 账本行只作人读镜像。**黄金快照 = 该提交里 `agents/<name>.md` 的 blob**，用 `git show <commit>:agents/<name>.md` 读取（黄金断言脚本 `acceptance/golden-assert.mjs` 执行）；不得读工作区活文件，不得在替换后读取 | W1 必须可复算；git blob 是唯一幸存且不可变的基准；`TargetDrift` 与验收脚本必须有机器可读输入；每席一份避免 S4 互相覆盖 |
| R4 | **逐字节比对（6.2 步 4）**：先做 R3 黄金断言（派生 description == 快照 frontmatter description 逐字相等），再做**整文件** `compareBuffers(渲染字节, 快照字节) === null`；两步结果与 `renderSha256 = sha256(渲染字节)` 写入 evidence。步 7/8 必须校验 `renderSha256 === sha256(草稿/目标)`，不等即要求重跑步 4（防步 4 后改组件导致旧结论假绿）。**不使用「排除 description 字段」的比对** | description 已先验相等，整文件比对更强且无需排除 API；绑定渲染哈希防止旧结论过期 |
| R5 | **无同步移除（S1 已整体退役 gen-agents）**：该席数据搬入组件后无需移除任何旧源；转录只以 R3 快照为源，不留第二份转录源 | 不留双源（F-05）；旧源已随 S1 W8 退役 |
| R6 | **替换（6.2 步 7）**：用户确认后 `docgen replace --kind agent --name reviewer-audit --draft <草稿> --yes`。**实现前置（S1 实现遗留，见 `cli.mjs:73/123/188` 注释）**：① gate 拆 `collectGate()`（返回 `{code, path}[]` 漂移清单 D，不抛）与 `gateChecks()`（按优先级抛），两者必须从模块导出供 acceptance 调用；② 判别子**逐字按 S1 §5.3**：允许替换当且仅当 `D ⊆ {目标} ∪ {有草稿且草稿 == 其组件渲染的文件}`（不加「已接管」限定）；③ 错误码优先级 = baseline 类（exit 2）> 非目标 `Mismatch`（exit 1）> 目标自身 `Mismatch`（exit 1）；④ **幂等恢复（先于目标哈希复核）**：若 `state = replaced` 且目标字节 == 当前渲染字节 → 视为上次替换在「rename 后、evidence 更新前」中断：更新 evidence.`lastWrittenHash` = sha256(渲染)、清该名草稿，退出 0；若 state 无条目则不走此分支。⑤ **目标哈希复核（`TargetDrift`，exit 1）**：重算目标 SHA256（大写归一），与 evidence.`lastWrittenHash` 不等 → 拒，草稿保留；**首次替换时 `lastWrittenHash` = 该席 evidence.`sha256`（步 1 记录的现产物哈希）**；⑥ evidence 缺失/字段非法 → `EvidenceInvalid`（exit 2） | P2-4 + S1 §5.3；无完整 D 无法做集合判定；`TargetDrift` 基准必须是「上一次成功写入的哈希」；幂等判定必须先于哈希复核，否则崩溃恢复分支不可达 |
| R7 | **巩固（6.3，六项，缺一不可）**：见 §5 映射表。计数口径：**机器 4 项（1/2/3/6）+ 机器与人工各半 1 项（5）+ N/A 1 项（4）** | 达到全部才算已巩固（PRD 6.3）；「已巩固」是验收标签，不是机器状态 |
| R8 | **description 派生校验**：渲染后断言 `description === 在议会评审中担任审计专员。{when}时调用` 逐字相等；when 不得含「在…中担任 / 时调用」字样、不得以「时」结尾；**gate 在渲染路径做该等值断言**（W4，落在 `cli.mjs` 的 gate/渲染调用处），`validateAgentData` 负责数据层断言（条目不得含独立 description 字段） | W1 + S1 R13；防拆槽错字静默通过（F2-F 教训） |
| R9 | **已接管席逐字节比对（S1 实现遗留）**：`tools/docgen/state.json` 记录「已由 docgen 替换过」的席（`state = replaced`）；gate/check-agents **一律以 state 判定**：`replaced` → 重建逐字节比对（漂移 → exit 1）；无条目 → registered（仅存在性检查）；`suspended` → 存在性检查 + 豁免逐字节。**删除现有 `isRegistered()`（按 triggerTable 有无 when 判定）**；gate 对每个 agent 先做 `existsSync`，再按 state 分流。**时点**：replace 成功后写入 `replaced`，步 8/步 9 的 gate 才比对；步 5 只确认该席在 baseline 清单内并登记「待接管」 | 「已拆槽」与「已接管」是两个维度；现有 when 谓词在步 2 就翻转，会漏掉存在性检查 |
| R10 | **接管状态机（唯一机器载体）**：`state.json` 形状 `{ "version": 1, "agents": { "<name>": "replaced" } }`；值域 `replaced` / `suspended`；**无条目 = registered（文件不存在 = 全量 registered，合法）**。**校验**：`version !== 1`、值非法、键 ∉ `agentData` 名单 → `StateFileInvalid`（exit 2）。**写点**：只有 `replace` 写（同目录临时文件 + rename 原子写；先写 state，再 rename 目标——顺序见 §4 步 7）；回退 = 人工把值改为 `suspended`（值域由 gate 校验）。该文件不是生成物，禁止写入其它内容；**冷跑按 §6-8 的交付清单复制（含该文件），不依赖它是否已被 git 跟踪** | 「已接管 / 未接管 / 停损」必须有机器可读载体；内容字节相同无法反推是否替换过 |
| R11 | **渲染数据来源与模板补全**：① 纯函数 `components/renderAgent.mjs`：`renderAgent(agent, trigger, template, sharedBlocks, outputFormats) → string`（零 fs）；② CLI 薄封装 `renderByName(name)` 负责读模板/映射再调纯函数；③ 模板 `agent.md.tpl` 补全为全量结构，**删除 S1 骨架的 `## 共享块` 包装标题**；④ 空共享块语义：无 `sharedBlock` 的席，`{{SHARED_BLOCK}}` 连同前后空行整段消失（不留下多余空行）；⑤ 槽位与数据源见 §3.4 | `generate` 目前对 agent 不渲染、三槽置空；两层 API 避免「吃 name / 吃数据」两义；空块语义保证 S4 13 席复用 |
| R12 | **对 S1 的修订与错误码扩展**：本 spec 对 S1 的语义改写集中列在 §11，逐条写「S1 原规定 / 本 spec / 理由 / S1 待回写项」；新增错误码与档位见 §11 表。未列入 §11 的 S1 规定继续有效 | 防止「两份 spec 都自称规范」导致实现者按哪份都能自证合法 |

## 3 数据形状与渲染来源

> **转录源（R2/R3 落地）**：以下字段值逐字取自 R3 快照（提交里的 `agents/reviewer-audit.md`）；`gen-agents.mjs` 已退役，不再有结构化 ROLES 源。`identity`/`fixedList` 幸存于渲染视图，从此处反推转录。

### 3.1 agentData 条目（`tools/docgen/components/agentData.mjs` 的 SKELETON）

```js
{
  name: 'reviewer-audit',
  role: '审计专员',                      // = 快照描述句首角色
  dimension: '独立（标准核对）',         // 逐字迁入
  tools: ['Read', 'Glob', 'Grep'],       // 条目写入；允许集由 patternRegistry.tools 定义；渲染为 `Read, Glob, Grep`
  identity: '资深审计专员，只审各项标准是否达到，不裁技术对错，不提新技术问题。',  // 逐字
  fixedList: [
    '卡片合规：八字段齐（缺证据或建议解法 = 废卡）',
    '级别匹配：P0 需两处冲突证据；P1 需可复现触发序列；否则应降级',
    '答辩合规：判定（承认/反驳/部分承认）+ 依据 + 修法三字段齐',
    '计数一致：卡片数 = 已修 + 关闭 + 候选 + 升级 + 带往下轮',
    '轮际对账：上轮承诺与本轮开卷清单逐项相等（少 = 蒸发，多 = 无来源）',
    '落点真实：修复对照抽查 ≥3，文件:行号真实存在且内容相符',
    '证据可复算：任抽一条沿证据链能重现结果',
  ],  // 逐字 7 条
  sharedBlock: 'AUDIT_RULES',           // sharedBlocks.mjs 的键
  outputKind: 'audit',                  // outputFormats.mjs 的键
}
```

### 3.2 triggerTable 条目（同文件 `triggerTable` 导出）

```js
'reviewer-audit': {
  when: '当议会评审需要过程标准核对、轮际对账或交付审计',   // 不含末尾「时」
  route: 'reviewer-audit',
  // notWhen / fallback：缺省不写（13 席迁移一律缺省）
}
```

**禁止**：以上四字段不得出现在 agentData 条目里（S1 §4.1 与 `data.test.mjs:20-26` 已有断言）。

### 3.3 description 派生

`在议会评审中担任审计专员。当议会评审需要过程标准核对、轮际对账或交付审计时调用`——由 `DOMAIN + role + when + '时调用'` 拼装，逐字等于快照 frontmatter。拼装函数签名固定为 `patternRegistry.description.parliament(role, when, domain = DOMAIN)`（domain 可注入，用于证明 `DOMAIN` 真被消费）。

### 3.4 渲染来源表（R11）

| 模板槽位 | 数据源 | 本席值/规则 |
|---|---|---|
| `{{NAME}}` | agentData.name | `reviewer-audit` |
| `{{DESCRIPTION}}` | patternRegistry.description.parliament(role, when) | 见 §3.3 |
| `{{TOOLS}}` | agentData.tools.join(', ') | `Read, Glob, Grep` |
| `{{ZH_NAME}}` | agentData.role | `审计专员` |
| `{{DIMENSION}}` | agentData.dimension | `独立（标准核对）` |
| `{{IDENTITY}}` | agentData.identity | 逐字 |
| `{{FIXED_LIST}}` | agentData.fixedList → 每行 `\| {i+1} \| {item} \| 待答 \|` | 7 行 |
| `{{OUTPUT_FORMAT}}` | outputFormats[outputKind] | `audit` = 轮间核对单 + 交付审计表两节（逐字；块内含 5 个 H2：核对项 / 结论 / A 节 / B 节 / 结论） |
| `{{SHARED_BLOCK}}` | sharedBlocks[sharedBlock] ?? '' | `AUDIT_RULES` = `### 审计铁律` 3 条（逐字，前后各一空行）；空块时整段（含前后空行）消失 |

- **模板专属 vs 数据专属**：共享特质 / 自由探索 / 通用纪律 / 边界 = 模板常量（13 席共用）；`AUDIT_RULES` 与 audit 双格式 = 该席数据（不得写进模板）。
- **模板纯度**：`agent.md.tpl` 正文不得出现任一席的 identity / fixedList 条目 / 角色名 / 审计铁律正文（测试断言，见 §7）。
- **模板结构**（全量）：frontmatter → `# 角色：{role}（{dimension}）` → `## 你是谁` → `## 共享特质（…）` → `## 固定必问清单（…）` → `## 自由探索（…）` → `## 输出格式` → `## 通用纪律` → 可选 `### 审计铁律`（共享块）→ `## 边界`。**删除 S1 骨架的 `## 共享块` 包装标题**（黄金快照中没有这一节）。

## 4 九步闭环执行细则（PRD 6.2 落地）

| 步 | 动作 | 本席具体执行 | 失败回退（6.4） |
|---|---|---|---|
| 1 入选 | 锁定迁移前基线 | 记录提交号 + blob + SHA256 + hash-object，写入 `fixtures/reviewer-audit.evidence.json`；同步 PRD §6.6 账本行（人读镜像） | 快照读不到 → `GoldenSnapshotUnavailable`（exit 2） |
| 2 数据迁移 | 黄金快照转录 + description 拆槽（无同步移除） | 按 §3.1/§3.2 分宿主写入；补全模板（删 `## 共享块`）+ 新增 sharedBlocks/outputFormats/renderAgent；`DOMAIN` 常量化；`{{TOOLS}}`；三码进 `validateAgentData` EXIT 表 | — |
| 3 生成 | `docgen generate --kind agent --name reviewer-audit` | **已拆槽席一律走 `renderByName` + `compareBuffers`**，退出 0=一致 / 1=不等；不写盘、不落草稿。**不带 `--name` 的全遍历**：未拆槽席沿用 S1 R3 的存在性检查，已拆槽席（registered/replaced/suspended）一律渲染 + 比对。**本条覆盖 S1 R3 对 registered 的 generate 豁免**（见 §11） | — |
| 4 逐字节比对 | 黄金断言 + 整文件比对 | ① `acceptance/golden-assert.mjs` 校验派生 description == `git show <commit>:agents/reviewer-audit.md` 的 frontmatter；② `compareBuffers(render, snapshot) === null`；③ 两步结果 + `renderSha256` 写入 evidence | 只改组件/模板，现产物不动；修 2 次仍不等 → 停损（6.4） |
| 5 接守卫 | 确认 baseline + 登记「待接管」 | 确认该席在 `agentPaths()` 的 14 条内；此时 state 无条目（registered），**不做逐字节比对**（细化 PRD 6.2 步 5，理由见 §11）；替换成功后才进比对子集（R9/R10） | — |
| 6 落草稿 | `docgen draft --kind agent --name reviewer-audit` | 草稿进箱，`agents/*.md` 零改动；**以 `wx` 标志直接创建最终草稿文件**，`EEXIST` → `DraftNameConflict`（不做 temp+rename） | 遇旧稿 → `DraftNameConflict`，先 `draft rm` |
| 7 替换 | 用户确认后 `docgen replace ... --yes` | ① `collectGate()` 按 R6 判别子过滤；② **幂等恢复**：`state = replaced` 且目标字节 == 当前渲染 → 更新 evidence.`lastWrittenHash`、清草稿，退出 0；③ 重算目标 SHA256（大写）== evidence.`lastWrittenHash`，否则 `TargetDrift`；④ 校验 evidence.`renderSha256` == sha256(草稿)，不等要求重跑步 4（`EvidenceInvalid`）；⑤ **先原子写 `state.json` = replaced**，再 rename 目标（原子）；⑥ 清草稿；⑦ 更新 evidence.`lastWrittenHash` = sha256(草稿)；启动时清理 `.tmp-<name>-*.part` 残留 | 拒红 → 草稿保留，修组件重走 4–7；⑤ 前后崩溃 → state 已 replaced、目标仍旧 → gate 红（可恢复），重跑 ④⑤ 收敛；rename 后崩溃 → ② 幂等恢复 |
| 8 验收 | W1 断言 + `npm run check` 全绿 + 后置干净 | 见 §5；**替换后不重跑步 4 比对**（自证循环），改为读 evidence 的 `compareResult` + gate 重建比对 | — |
| 9 巩固 | 连续 2 次 gate 绿（含隔目录冷跑） | 冷跑：按 §6-8 的**交付清单**复制（git 跟踪文件 ∪ 本轮影响面新增文件，含 `state.json` 与三新模块；**不含 `.git`**），`DOCGEN_DRAFTS_DIR` 指向副本内临时目录，只跑 `gate`；六项达标后置「已巩固」（账本） | 冷跑红 = 环境/清单问题，判未巩固 |

## 5 W1 验收（本 spec 的验收锚点）

| 检查 | 判据 | 执行时点 |
|---|---|---|
| 逐字节一致 | `compareBuffers(render, snapshotBytes) === null`（整文件，含 frontmatter 与尾换行）；结果存 evidence.`compareResult` | **替换前** |
| description 派生 | 渲染 description === `在议会评审中担任审计专员。当议会评审需要过程标准核对、轮际对账或交付审计时调用` 逐字相等 | 任意（纯函数） |
| 迁移前黄金断言（P2-遗-7） | 派生 description === `git show <commit>:agents/reviewer-audit.md` 的 frontmatter description 逐字相等；结果存 evidence.`goldenAssertion` | **替换前** |
| 黄金快照 = docgen 产物 | render === 快照 blob 逐字节（由前两条合取）；**快照 = 记录提交号的 git blob，不是替换后文件** | **替换前** |
| 巩固（PRD 6.3 六项） | 见下表，六项缺一不可 | 替换后 |

**巩固六项映射（PRD 6.3 → 本 spec）**：

| # | PRD 6.3 原文项 | 本 spec 落地 | 判定 |
|---|---|---|---|
| 1 | 已进 baseline 比对子集，gate 连续 2 次绿（含隔目录冷跑） | state = `replaced` + gate × 2（含冷跑） | 机器 |
| 2 | `npm run check` 全绿（0 findings） | 同（外层真实调用，测试内不嵌套调用，见 §7） | 机器 |
| 3 | `git status --short rules/ skills/ agents/` 干净 | 同（替换字节 == 原字节，故应无改动） | 机器 |
| 4 | 旧生成来源对该对象已停止输出 | **N/A（豁免）**：gen-agents 已随 S1 W8 整体退役，无「该席停止输出」动作；豁免依据 S1 W8 | 声明 |
| 5 | 对象内容 = 组件渲染的字节，人工抽查 1 处关键格与组件数据一致 | 逐字节比对（机器）+ 人工抽查 1 处（§7，例如 fixedList 第 4 条） | 机器 + 人工 |
| 6 | 草稿箱该名下草稿已清 | `draft ls --name reviewer-audit` 为空 | 机器 |

> 计数口径：**机器 4 项（1/2/3/6）+ 机器与人工各半 1 项（5）+ N/A 1 项（4）**。六项全过后在 PRD §6.6 账本置「已巩固」；`state.json` 仍只表示 `replaced`。

## 6 硬约束

1. 试点期间禁止手改 `agents/reviewer-audit.md`（D6）；任何差异回炉改组件。**测试用例触碰目标文件一律在仓库副本内执行**。
2. description 是派生字段，`agentData` 不存独立 description 字段（S1 R13）；硬编码 description → `DescriptionDerivation`；gate 渲染路径做等值断言。
3. 黄金快照 = 步 1 记录提交号的 git blob（`git show`）；不得读当前工作区文件，不得在替换后读取（P2-遗-7）。
4. 转录只以 R3 快照为源，不留第二份转录源（R5）。
5. 九步顺序不可跳：**入选 → 数据迁移 → 生成 → 逐字节比对 → 接守卫 → 落草稿 → 替换 → 验收 → 巩固**（P2-7 逐个巩固）。
6. `state.json` 是「已接管」的唯一机器载体；只有 `replace` 写它（同目录临时文件 + rename 原子写）；`version/值域/键集` 非法 → `StateFileInvalid`（exit 2）；写序 = 先 state 后目标。
7. 中断恢复：replace 的临时文件用非 `.md` 后缀（`.tmp-<name>-<pid>.part`），启动时先清同前缀残留；draft 用 `wx` 独占创建；残留不得被 gate 判成 `UnregisteredHandwritten`；目标 == 渲染且 state=replaced 时按 R6 ④ 幂等恢复。
8. 冷跑只跑 `gate`，复制清单 = git 跟踪文件 ∪ 本轮影响面新增文件（含 `state.json`、`sharedBlocks.mjs`、`outputFormats.mjs`、`renderAgent.mjs`、`fixtures/*.evidence.json`），**不含 `.git`**；`DOCGEN_DRAFTS_DIR` 指向副本内临时目录；不在冷跑里跑黄金断言（需 git）。冷跑不以「文件已被 git 跟踪」为前提。

## 7 测试

| 测什么 | 为什么 |
|---|---|
| 整文件逐字节一致（先黄金断言后整比） | W1 核心；模板补全错位/数据转录错位会在这暴露 |
| description 派生逐字相等 | 拆槽错字静默通过是最隐蔽的假绿（F2-F 教训） |
| 黄金快照时序（读 `git show` 的 blob） | 拿错基准 = 黄金断言假绿（P2-遗-7）；读活文件则替换后恒等 |
| 数据形状分宿主（agentData 不含触发表字段） | S1 §4.1 单一真相；混写会被既有 `data.test.mjs` 拦红 |
| 已接管席逐字节比对 + 拒红判别子 + `TargetDrift`（R9/R6） | 能力不激活则「巩固」与「替换前 gate」假绿/卡死 |
| 模板纯度 + 数据变异（7 条 fixedList 全覆盖） | 逐字节绿不等于数据驱动；防把该席内容硬编码进 13 席共用模板 |
| 九步闭环到巩固（六项） | 试点未巩固 S4 不能开工 |

**测试执行模型（防递归）**：需要 `replace` / `npm run check` / 冷跑 / 真实仓库改写的验收用例，一律放在 `tools/docgen/acceptance/*.mjs` 独立脚本（不被 `node --test '**/*.test.mjs'` 匹配），由验收人显式执行；留在 `*.test.mjs` 的用例只做纯函数/副本内断言，且**禁止**在测试内 spawn `npm run check`。`npm run check` 的完整输出作为巩固第 2 项证据由验收人保存。

**测试用例文件**：`docs/superpowers/specs/2026-10-19-docgen-agent-pilot-design-testcase.md`（由 `senior-sdet` 独立编写；每条用例五要素、负例 ≥ 正例、覆盖总表指回本 spec 的 R 编号与 W1 锚点）

**只手动验证**：替换前后 `agents/reviewer-audit.md` 的内容观感；人工抽查 1 处关键格（如 fixedList 第 4 条）与组件数据一致（PRD 6.3 第 5 项的一半）。

**不测**：能力地基本身（S1 覆盖）；其它席迁移（S4）；senior-sdet 转录（S3）；description 翻译闭环（PRD §1.1 作用域，P2 内不验收）。

## 8 不在这一轮

- 余下 12 席——S4，试点验证模型后才开工。
- senior-sdet 转录——S3。
- 能力地基本身（CLI/草稿箱/守卫/退出码）——S1 已完成；已接管席比对 + gate 漂移收集 + 拒红判别子 + 状态文件 + 渲染改造是 S1 实现遗留 / 本轮必须实现（R6/R9/R10/R11）。
- gen-agents 全家退役——已在 S1 W8 完成，本 spec 无相关动作。

## 9 将来才会撞上的一件事

试点验证的是「模板与数据形状对现有 agent 卡片成立」。P3/P4 引入 skill/rule 生成时，agent 的 `agent.md.tpl` 是否会因为要复用到其它 kind 的槽位而被「通用化」——届时不能硬改 agent 模板迁就其它 kind（D1 逻辑进组件），正确方向是每 kind 一套模板。本轮只点名，不定案。

## 10 与既有 spec 的关系

- **不取代**任何既有 spec 的全文；**对 S1 的逐条语义修订集中在 §11**（未列入 §11 的 S1 规定继续有效）。
- **引用** `docs/prd/20261019093443-docgen-agent-generation.md` §5 W1 + §6.1–6.4 作为验收与流程源；不复制决策原文。
- **依赖** S1 spec `2026-10-19-docgen-agent-capability-design.md`（能力地基：CLI/草稿箱/守卫/退出码/拒红过滤）。
- **供 S4 依赖**：试点验证的模板与数据形状是 S4 的复制模板。

## 11 对 S1 的修订清单与错误码扩展

> 本 spec 与 S1 定稿有语义差异的条目全部列在这里；施工者按本表执行。标「S1 待回写」的条目需要在 S1 侧同步（由用户裁决，S2 不擅自改 S1 正文）。

| # | S1 原规定 | 本 spec | 理由 | S1 待回写 |
|---|---|---|---|---|
| 1 | 比对子集触发 = 「已巩固 agent」（S1 R10/§4.3） | 触发 = `state = replaced`（已由 docgen 替换过） | 避免「巩固要 gate 绿、gate 绿要已巩固」的循环；「已巩固」仍是六项验收标签 | 是：S1 R10/§4.3 的「已巩固」改为「已接管（replaced）」 |
| 2 | 判别子第二集合 = 有草稿且草稿 == 渲染（S1 §5.3） | **逐字相同**（不加「已接管」限定） | 与 S1 原文一致，避免自称原文却改写 | 否 |
| 3 | `generate` 对 registered 席跳过逐字节比对（S1 R3） | 已拆槽席的 `generate` **恒渲染 + 比对**；豁免只适用于 `gate`/`check-agents` 的日常守卫 | 步 3 是生成入口，必须有比对结论才能进步 4 | 是：S1 R3 补「generate 入口不适用 registered 豁免」 |
| 4 | replace 目标白名单外 → `InvalidOutputPath`（S1 §5.2；S1 testcase TC-033 场景② 为 P0） | **不在 S2 重复测**：当前 S1 实现 `cli.mjs:191` 直接 `join`、未经 `assertInside`，该分支不可达；S2 testcase 的 TC-042 作废理由与归属写在此 | 用现状实现否定已定稿规格不可接受；必须显式记账，不能静默作废 | 是：S1 实现补 `assertInside` 或 S1 spec 明确该分支移除（用户裁决） |
| 5 | `registered` = 未拆槽（S1 实现 `cli.mjs:22`） | `registered` = `state.json` 无条目（未接管）；「未拆槽」不再作为 registered 判据 | 一词一义；拆槽后 step 2 就翻转，无法表达「未替换」 | 是：S1 实现删除 `isRegistered()`，改用 state |
| 6 | check-agents 输出「未巩固 N」（S1 R11） | 未巩固 = state 无条目 + `suspended`；`replaced` 不计入未巩固 | 「已接管」不等于「已巩固」，输出要能区分两态 | 是：S1 输出口径随 state 调整 |
| 7 | PRD 6.2 步 5「对象加入比对子集，gate 开始重建比对」 | 步 5 只登记「待接管」；比对从步 8（replace 成功后）开始 | 替换前目标与渲染字节相同，逐字节比对无判别力；手改由 `TargetDrift` 兜 | 否（对 PRD 的细化，已在步 5 注明） |
| 8 | S1 §4.2「黄金断言直接读现文件比对」 | **只读 R3 记录的 git blob（`git show <commit>:...`）**，不得读工作区活文件 | 替换后活文件 == 派生产物，读活文件会恒等假绿（P2-遗-7 的根因） | 是：S1 §4.2 改口径 |
| 9 | S1 §9 #6「gen-agents 数据搬走即删该席（ROLES 递减）」 | **N/A**：`gen-agents.mjs` 已随 S1 W8 整体退役，无按席删除动作 | 无旧源可删；保留删除动作会诱导施工者找不存在的文件 | 是：S1 §9 #6 标「已由 W8 覆盖」 |
| 10 | S1 §6.4/§8.6「回退 = 降级 registered 态」 | 回退 = `state = suspended`（保留「替换过又回退」的历史）；`registered` 只表示从未接管 | 一词一义；直接用 S1 的 registered 会丢掉「曾经替换过」的事实 | 是：S1 回退口径同步 |
| 11 | S1 §5.2 replace 检查序：读草稿 → `DraftDrift` → gate | S2 步 7 序：`collectGate` + 判别子 → 幂等 → `TargetDrift` → evidence 校验 → 写 state → rename → 清草稿。`DraftDrift` 仍在校验草稿==渲染时生效；多类错误并存按 R6 ③ 优先级 | 判别子需要完整 D，必须先收集；否则 gate fail-fast 拿不到 D | 否（S2 旅程内的顺序细化；S1 能力语义不变） |

> **穷举声明**：本表声称覆盖 S2 对 S1 的全部语义差异；若发现漏列，按缺陷处理（补入本表并同步 S1 待回写），不得以「未列入即继续有效」放行。未列入的 S1 规定继续有效。

**新增错误码（本轮扩展，需先进 `validateAgentData.mjs` 的 EXIT 表）**：

| 码 | 退出档 | 触发 | 登记落点 |
|---|---|---|---|
| `TargetDrift` | 1 | replace 写入前，目标 SHA256 ≠ evidence.`lastWrittenHash` | `validateAgentData.mjs` EXIT 表 + 单测「每个已用码都能 `exitCodeFor` 而不抛」 |
| `StateFileInvalid` | 2 | `state.json` version ≠ 1 / 值非法 / 键 ∉ agentData | 同上 |
| `GoldenSnapshotUnavailable` | 2 | `git show <commit>:...` 失败（坏提交号 / 无 `.git` / blob 不存在） | 同上 |
| `EvidenceInvalid` | 2 | evidence 缺失 / 字段类型非法 / `renderSha256` 与草稿不等 | 同上 |
| `InvalidArgs` | 2 | 既有码（`compare.mjs` 的未知角色等）；本轮一并登记进 EXIT 表，避免兜底成 2 掩盖漏登记 | 同上 |

> 档位与 S1 §7 五档（0/1/2/3/4）不冲突；S1 §7 表作为历史定义保留，S2 的扩展以本表 + 代码 EXIT 表为准（S1 待回写一行指针）。
