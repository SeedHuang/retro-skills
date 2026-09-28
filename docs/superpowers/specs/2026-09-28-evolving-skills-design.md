# spec：evolving-skills（复盘体系第 2 步 = 架构 C2 + A1 + 转发闸门）

> 日期：2026-09-28｜状态：待用户终审
> 上游：`docs\handoffs\2026-09-28-evolving-skills.md`（交接词）｜体系依据：`docs\architecture.md` §3 L3 / §5 / §6 / §8 / §10
> 流程：brainstorming 四条裁决（见 §2）→ 本 spec → 自审 → 用户终审 → plan → 逐任务实施（技能改动按 writing-skills RED-GREEN）

## 1. 一句话

新建第 6 个技能 `evolving-skills`，作为**载体进化的施工手册**（协议正文 + 三张差异卡）；同时把 `retro-institutionalize` 瘦身为**纯分诊台**（决策树 + 转发），加"载体 = 技能 → 转发"闸门。

## 2. 已定裁决（brainstorming 2026-09-28，不再重开）

| # | 裁决 | 结论 |
|---|---|---|
| D1 | 协议的家 | `skills\evolving-skills\` 文件夹内（安装原子单位；SKILL.md 入口 + `references\` 正文与卡）。教训内容**不入**此文件夹——教训住 KB（独立目录，位置由指针指定、可迁移），两者互相独立 |
| D2 | 差异卡数量 | **3 张**：rule / skill / 自动化。memory 不设卡（纯文本编辑无构建无生效问题，现有写法已够；信号 = memory 真出一次"改坏"再补） |
| D3 | 失败场景先行 | **通用总则**：改任何载体前先写下"现状拦不住的具体场景"。skill = 失败测试（RED，writing-skills）；rule = **一行反例**（轻量版）；自动化 = 失败断言 |
| D4 | multi-lens 本体 | **本期不改**（H1 裸奔无源仓库，改运行时违反公理）。A1 的"抽离"= 抄写并通用化其做法进 evolving-skills；multi-lens 本体的"复盘回流"节替换成转发，等第 3 步收编时一并做 |
| D5 | institutionalize 瘦身幅度 | **方案 A 彻底分家**：改 rule 的手法（备份/确认/失败场景先行）搬进 rule 卡；institutionalize 只留 §5 所列。provenance **格式定义留在 institutionalize**（新增规则也用，单一真相），rule 卡引用 |

## 3. 分工总图（改后）

```
复盘结论："XX 载体本身要改"
        │
   retro-institutionalize（分诊台）
   ├─ 前置检查：复盘文件存在 / KB 迁移锁
   ├─ 决策树 Step 0–5（定载体）
   ├─ ledger 先行（教训先入账再动手）
   ├─ 真冲突判定 / 防重复五处
   └─ 转发闸门：载体 = 技能 → REQUIRED SUB-SKILL: evolving-skills
        │
   evolving-skills（施工方）
   └─ 失败场景先行 → 按差异卡实施 → 验证
```

**边界**：新增规则的归置（决策树直接落 rule/memory/自动化）**不经过** evolving-skills——只有"载体本身要进化"（修订既有载体，或教训的固化建议就是改某技能）才走它。provenance 格式、防重复、冲突判定都留在 institutionalize（新增也用的公共件）。

## 4. evolving-skills 规格

### 4.1 文件结构

```
retro-skills\skills\evolving-skills\
├── SKILL.md                 入口（目标 <150 行）
└── references\
    ├── protocol.md          施工手册正文（六步详解）
    ├── card-rule.md         rule 差异卡
    ├── card-skill.md        skill 差异卡
    └── card-automation.md   自动化差异卡
```

### 4.2 SKILL.md 内容要求

- frontmatter：`name: evolving-skills`；description 写清触发条件（Use when 复盘结论指向改某个载体本身 / institutionalize 转发过来；Do not use for 首次归置新增——那走 institutionalize 决策树）
- 正文节：① 它是什么/不是什么（施工手册，非教训仓库）② 第一步：识别载体 → 读对应卡 ③ 六步速览表 ④ 转发自 institutionalize 时的衔接（教训已在 KB ledger，从账捞起）
- 不复制 references 的正文，只留速览 + 指针

### 4.3 protocol.md（施工手册正文）六步

| 步 | 内容（要点） | 素材出处 |
|---|---|---|
| 0 失败场景先行 | 改前先写下"现状拦不住的具体场景"；skill=失败测试、rule=一行反例、自动化=失败断言 | D3 新总则 |
| 1 先升级不新增 | 查五处既有承载；升级是默认，新增须举证 | institutionalize Step 1 |
| 2 四归因 | 流程缺失 / 知识缺失 / 修复引入 / 假设未显式化——归因决定改哪 | multi-lens lessons.md 格式头 |
| 3 攒批 | 教训先进 KB ledger（open），攒批时机由用户裁决（现在/收口），协议只强制"先进账再动手、动手时同类一起" | multi-lens lessons.md 流转头 |
| 4 独立 agent 合并 | 动手术用 Task 起无偏见子代理：读教训 → 合并 → 返回变更摘要供确认 | multi-lens SKILL.md 飞轮第 3 步 |
| 5 体积守卫 | skill SKILL.md < 500 行；rule 不设行数但须可证伪；自动化不拖慢执行点 | multi-lens 飞轮（<500 行） |
| 6 验证 | 按差异卡各自的验证节 | 各卡 |

### 4.4 三张差异卡内容要点（统一小节结构：改前/改中/改后生效/验证/常见错误）

| 卡 | 改前 | 改中 | 改后生效 | 验证 |
|---|---|---|---|---|
| card-rule.md | 一行反例（旧规则拦不住的场景）；**备份旧版到 KB rules-history**（备份失败即中止） | 新旧一行式对比等用户 y/n（仅修订）；provenance 按 institutionalize 格式 | 开新对话生效（收尾提醒）；`aas` 体检"已就位" | 新场景注入验证（亲历即证）；反例能否被新表述拦住 |
| card-skill.md | 失败场景测试（RED，writing-skills） | 改 SKILL.md/references；同类教训一起合并；**发布纯净**（目录内不放 lessons） | junction 即时生效（V6 未单独验——改完提示用户新对话观察） | RED 转 GREEN；体积 < 500 行；`aas` 体检 junction 就位 |
| card-automation.md | 失败断言 | 写进 tests/lint/校验脚本 | 执行点强制 | 断言转绿；**性能闸门**：执行点 + 单次成本答得出（继承 institutionalize Step 2 闸门） |

## 5. retro-institutionalize 瘦身规格

### 5.1 移出（→ evolving-skills）

| 现有节/段 | 去向 |
|---|---|
| 「修订既有规则：先备份，再一行式确认」整节 | card-rule.md（改前/改中节） |
| Step 2 的性能闸门附注 | card-automation.md（性能闸门小节） |

### 5.2 新增（转发闸门）

**闸门定义**：决策树中**实施对象是某个 skill 本体**的所有分支 → 转发。覆盖三处：

- **Step 1a 扩既有触发面**（当既有是 skill：扩它的 description/触发条件 = 改技能本体）
- **Step 1b 修既有**（当既有是 skill：修它的约束/流程）
- **Step 3 落 skill**（新增或重写一个技能）

转发语义：REQUIRED SUB-SKILL: evolving-skills，按 card-skill.md 实施，教训先入 ledger（精确文案在 plan 定稿）。

### 5.3 保留（不动）

前置检查（复盘文件/迁移锁）、决策树 Step 0–5、ledger 写入顺序、真冲突判定、防重复五处、provenance 格式定义、结束动作（含"开新对话生效"提醒）。

### 5.4 RED-GREEN（对 institutionalize 本身的改动）

- RED：改前 SKILL.md 全文无 `evolving-skills` 字样；决策树走到 Step 3 无任何转发指令（失败场景：agent 会就地按 rule 手法改技能——无攒批、无体积守卫、无独立合并）
- GREEN：Step 1a / 1b / 3 出现转发指令；瘦身后的节挪至 evolving-skills

## 6. 生效与验收

1. `skills\evolving-skills\` 结构如 §4.1；SKILL.md < 150 行
2. `aas` 体检：技能 junction **6 个全部就位**、报告"全部一致"
3. institutionalize：含 evolving-skills 转发（grep 可证）；瘦身后的节在卡中可找到（内容不丢，只搬家）
4. RED-GREEN 证据留档（失败场景 → 修复对照）
5. 全套 `aas` 侧测试 69/69 不回归
6. 【人工】新对话描述一个"改技能"场景，观察 evolving-skills 能否被触发（顺带验 V6：技能内容改后新对话是否即时可见）

## 7. 明确不做

- multi-lens 本体任何改动（D4；其 lessons.md 11 条的迁移 = 第 3 步 A2）
- KB 的 skills\ 区（C3）、三区合一（B1）——第 3 步
- memory 差异卡（D2）、真冲突自动消解、R20 编号重构

## 8. 遗留与顺带

- V6：本任务改技能内容后，新对话观察是否即时可见（交接词遗留裁决）
- R27：下次动体系顺手补第 5 轮评审（本 spec 自审不算）
- R28：下次编辑 architecture.md 顺手把 R28 从"候选"挪"已关闭"（本任务不改 architecture 的 backlog 表则顺延）
- 落地扫：完成后按规则扫 architecture.md / README（retro-skills 与 my-rules）/ 源码注释

## 9. 开放问题

无（四条裁决见 §2；实施细节归 plan）。
