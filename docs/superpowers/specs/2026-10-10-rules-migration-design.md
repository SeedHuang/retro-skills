# 规则库并入 retro-skills：迁移设计

> 状态：设计定稿（2026-10-10）｜配套执行计划见 `docs/superpowers/plans/2026-10-10-rules-migration.md`

## 1. 背景与动机

全局规则的源仓库 `my-rules` 与技能套件 `retro-skills` 本是同一条复盘流水线的两种产物（复盘结论要么落成 rule、要么落成 skill），管理规则的技能（`use-rule-skills` / `rule-inspector` / `rule-writer` / `evolving-skills`）也都住在 `retro-skills` 里。两仓库分居割裂，且技能正文里已有 19 处 `my-rules/rules/` 路径引用——这正是「跨技能引用用路径」的老毛病。

**决定**：把 `my-rules/rules/` 的 15 条全局规则迁入 `retro-skills/rules/`，`retro-skills` 从「技能套件」升级为「规范套件」；配套工具 `aas` 只改配置不改代码；`my-rules` 仓库本地删除、远程归档。

**范围外**：`aas` 不并入本仓库（它是通用工具，换编辑器/装远端资产都靠它，独立是对的）。

## 2. 目标布局

```
retro-skills/                 # 规范套件（技能 + 全局规则）
├── rules/                    # 全局规则源（15 个 .md，从 my-rules 迁来）
├── skills/                   # 技能源（17 个，原样）
├── docs/
│   ├── guide/
│   │   ├── skills/README.md  # 技能介绍（目标 17 个，现状 13，缺口见 §6）
│   │   └── rules/README.md   # 规则介绍（15 条，已就位）
│   ├── architecture.md       # 体系总图（活的，要改）
│   └── ...
└── README.md                 # 总览：场景速查 + guide 导航（已精简）
```

生效机制不变，两条管道分开：

| 源 | 运行时 | 形态 |
|---|---|---|
| `retro-skills/rules/` | `~/.trae-cn/user_rules/` | symlink |
| `retro-skills/skills/` | `~/.trae-cn/skills/` | junction |

## 3. 已完成的改动（本 session，作为迁移基线）

| 改动 | 状态 |
|---|---|
| `my-rules/rules/` 15 个文件复制到 `retro-skills/rules/` | ✅（用户操作，实测 15 个文件齐全） |
| README 新增「十五条全局规则」介绍，随后按用户要求拆到 `docs/guide/rules/README.md` | ✅ |
| README「十三个技能」详情拆到 `docs/guide/skills/README.md` | ✅ |
| README 精简为总览（场景速查表 + guide 导航，~215 行 → ~108 行） | ✅ |

## 4. 剩余工作：aas（agent-assets-sync，只改配置与文档，不改代码逻辑）

### 4.1 `sync.config.json`

- `linkTargets[0].srcDir`：`D:/Seed/my-rules/rules` → `D:/Seed/retro-skills/rules`
- `linkTargets[0].env.srcDir`：`MY_RULES_SRC` → `RETRO_SKILLS_RULES`（名字不再带 my-rules，避免误导）
- `sources` 字段目前是 `{}`（README 示例里的 `"myrules"` 只是文档例子，配置里没有实际条目）——确认后无需改

### 4.2 文档与测试

实测引用点（除历史外全改）：

| 文件 | 引用 |
|---|---|
| `README.md` | L73（sources 示例）、L75（srcDir）、L85（`MY_RULES_SRC` 变量名）、L101（关系一节「my-rules 是全局规则源」） |
| `docs/design.md` | L18（srcDir）、L31、L81（my-rules 角色描述）——L57 是历史命名论证，保留 |
| `docs/cli-design.md` | L21、L49（同上）——L212 是历史完成记录，保留 |
| `src/sync.mjs` | L84（注释示例）、L416（提示文本里的变量名）——**仅注释/提示文本，代码逻辑不硬编码变量名**（`pick()` 从 `raw.env` 动态读，见 L118-123），源码零改动 |
| `test/sync.test.mjs` | L302、L305、L306（`MY_RULES_SRC` 是 buildTargets 单元测试**自造的夹具字符串**，不依赖真实配置——改名是语义一致性，不是功能依赖，但建议同步） |

### 4.3 验收

- `aas` 体检：规则侧「已就位 15」、源路径显示 `D:\Seed\retro-skills\rules`
- `aas` 测试套件通过

## 5. 剩余工作：retro-skills 活引用清理

### 5.1 技能正文（19 处实测，全改）

`my-rules/rules/...` → `rules/...`（本仓库内路径）；「在 `D:\Seed\my-rules` 跑 `aas sync`」→「在 `d:\Seed\retro-skills` 跑」。

| 文件 | 处数 |
|---|---|
| `skills/use-rule-skills/SKILL.md` | 3（L17/L44/L45） |
| `skills/use-rule-skills/references/flows.md` | 2（L68/L81） |
| `skills/use-rule-skills/references/routing.md` | 2（L8/L12） |
| `skills/use-rule-skills/assets/report-template.md` | 2（L3/L43） |
| `skills/rule-inspector/SKILL.md` | 1（L3 description） |
| `skills/rule-inspector/references/recipes.md` | 3（L96/L104/L110） |
| `skills/rule-inspector/scripts/score.mjs` | 2（L305 硬编码默认值、L322 注释） |
| `skills/rule-inspector/scripts/score.test.mjs` | 1（L507 硬编码路径） |
| `skills/rule-writer/references/writing-guide.md` | 1（L78） |
| `skills/writing-after-docs/SKILL.md` | 2（L49/L55） |

**score.mjs 路径参数化**（迁移顺带做）：`--dir` 默认值从硬编码 `D:\Seed\my-rules\rules` 改为 `D:\Seed\retro-skills\rules`，调用时显式传参；防止再写死绝对路径。

### 5.2 规则正文

| 文件 | 改什么 |
|---|---|
| `rules/rules-single-source.md` | **L5 活判据**：「新建全局规则一律建在 `my-rules\rules\`」→「建在 retro-skills 仓库的 `rules/` 目录」。L3 来源行是 provenance 历史证据，保留原文，可附一行迁移注记 |
| `rules/landing-sweep.md` | L3/L22 是历史反例描述，**不改**（描述的是过往事件，路径是当时的真值） |

### 5.3 文档

| 文件 | 改什么 |
|---|---|
| `README.md` | L84「全局规则源（如 `my-rules/rules/`）」→「`rules/`」；「仓库结构」一节补 `rules/` 与 `docs/guide/` |
| `docs/architecture.md` | 体系图从「三仓库」改「两线」：规范源（本仓库 rules+skills）+ 工具（aas）；§8.1 的路径表、`MY_RULES_SRC` 变量名、C1「my-rules 仓库」条目等全部实引（grep 到的 14 处） |
| `docs/after/20261007201648-collect-requirements-exploration.md` | L184 提到「新增全局规则 `my-rules\rules\docs-convention.md`」——属活账本里的历史事件记录，**明确：保留不改**（改历史陈述没有收益，且 after 是活账本不是档案） |

**不改（历史快照）**：`docs/handoffs/*`、`docs/architecture-history.md`、`my-rules/README.md`（本地将删，git 历史可查）。

## 6. 剩余工作：技能介绍缺口（发现的治理项之一）

`docs/guide/skills/README.md` 现在只有 13 个技能，实际 17 个。缺口 4 个**规则管理技能**，补进 guide（与现有条目同模板）：

| 技能 | 一句话定位 | 什么时候用 | 做什么 | 不做什么 |
|---|---|---|---|---|
| `rule-inspector` | 判据驱动的规则检察员 | 用户说「体检 rules / 优化 rules」 | 按判据全集给 `rules/` 里的规则评分、出报告、给处方、防劣化 | 新建规则（走 use-rule-skills）、改规则正文（走 rule-writer）、审查（走 review-loop） |
| `rule-writer` | 写规则 / 按处方优化 | 用户说「写一条规则 / 优化这条规则」 | 按判据四要素 + 执行力度 8 项 + 来源行 + 分层级 + 判定词归一写或改规则 | 体检/评分（走 rule-inspector）、审查（走 review-loop） |
| `skill-inspector` | 判据驱动的技能检察员 | 用户说「体检 skills / 优化 skill / 检查技能」 | 按 skill-authoring-convention 判据给 `skills/` 里的技能评分、出报告、给处方、修复优化 | 新建规则（走 use-rule-skills）、改载体施工（走 evolving-skills） |
| `use-rule-skills` | 新建/优化规则的统一入口 | 触发「新建 rule / 优化这个 rule / 裸调用」 | 判定意图 → 路由 rule-writer 起草 / rule-inspector 评分 → 草稿箱管理 → 报告 | 不自动触发；自身不写规则正文（那是 rule-writer） |

对应 README 的「场景速查」表也可考虑补这几行（可选，见执行计划）。

### 6.2 附带改进：use-rule-skills 交互体验（2026-10-10 用户提出）

与 §5.1 的路径清理改的是同一批文件，一起实施：

| 问题 | 现状 | 改法 |
|---|---|---|
| 草稿采纳反复追问 | 落地前「删前提示一次 → 用户确认」，执行时易变成反复追问 | 报告末尾给「**采纳 / 不采纳**」两个**正文文字选项**（醒目列出），**不主动追问、不弹窗**；用户回复任一即走对应分支（采纳 → 落地；不采纳 → 继续改 / 保留草稿 / 放弃） |
| diff 查看无入口 | 报告直接丢 `trae-cn -d -r ...` / `code -d -r ...` 裸命令，用户要自己复制去终端 | 报告给「**【查看差异】**」文字入口，用户回复「查看差异」→ **agent 代为执行命令**在当前窗口打开改前 vs 改后对比（命令保留在入口后面供手动，不丢） |

落点（3 个文件）：
- `skills/use-rule-skills/SKILL.md` ——「报告」「落地」两节的纪律措辞
- `skills/use-rule-skills/references/flows.md` —— §二生命周期表、§四第 8 步、§五第 6 步
- `skills/use-rule-skills/assets/report-template.md` —— §三「查看 diff」、§五「落地结论」

## 7. 剩余工作：运行时重建与仓库退役

1. **改完 aas 配置后**跑 `aas sync --replace`：旧链接指向已删除/即将删除的 `my-rules/rules`，需重建为指向 `retro-skills/rules` 的链接
2. **本地删除** `d:\Seed\my-rules` 目录（用户已确认：远程归档、本地删除）
3. **远程归档** `GitHub SeedHuang/my-rules`：加 archived 标记或改名后缀（具体动作等用户指示，不擅自 push）
4. 顺带处理 aas 体检报的既有漂移：`skill-creator` 条目漂移 → `aas update skill-creator`

## 8. 验收判据

- [ ] `grep -ri "my-rules" d:\Seed\retro-skills d:\Seed\agent-assets-sync`：**只剩历史记录**（`docs/handoffs/`、`docs/architecture-history.md`、规则正文里的历史反例描述），活的引用清零
- [ ] `aas` 体检：规则「已就位 15」且源路径为 `D:\Seed\retro-skills\rules`；技能「已就位 17」；exit 0
- [ ] `aas` 测试套件通过（agent-assets-sync 目录跑）
- [ ] `rule-inspector/scripts/score.mjs` 跑通（`--dir d:\Seed\retro-skills\rules`），测试通过
- [ ] README / guide / architecture.md 数字一致：技能 17、规则 15（附取数命令，不手写）
- [ ] 运行时 `~\.trae-cn\user_rules\` 15 条链接全部指向 `retro-skills\rules\`

## 9. 明确不做

- 不把 `aas` 并入 retro-skills
- 不改历史快照（handoffs / architecture-history / my-rules README 收编账目）
- 不改 KB 错题集条目（`L-020` 等是历史，只增不删）
- 不为「扫 my-rules 残留」新建常驻脚本（一次性验收，用 grep + aas 体检）

## 10. 风险与注意

- **规则正文路径**：`rules-single-source.md` 是每轮注入的规则，漏改会让 agent 把新规则建到不存在的 `my-rules`——排在优先级最前
- **env 变量改名牵连测试**：`MY_RULES_SRC` → `RETRO_SKILLS_RULES` 要同步改 `sync.test.mjs` 的测试夹具，否则测试对不上
- **链接重建时机**：`aas sync --replace` 必须在改完配置之后、删 my-rules 目录之前跑（先重链后删源，避免中间态链接断裂）
- **数字只留一处**：技能/规则条数在 README 一处标注并附取数命令，guide 里不重复计数

## 11. 评审 Backlog（2026-10-10 review-md-to-death 段二）

### 已采纳
| # | 问题 | 落点 |
|---|---|---|
| 1 | §6.1 与 plan Task 7 的 use-rule-skills「不做什么」描述不一致 → 统一为「自身不写规则正文」 | §6.1 表格（已修） |
| 2 | 复制完整性校验缺失 → plan 开头补哈希比对 | plan Task 0（已修） |
| 3 | 删 my-rules 前未检查未提交内容 → plan Task 10 补 | plan Task 10（已修） |

### 已关闭
| # | 问题 | 理由 |
|---|---|---|
| 1 | spec §8 grep 命令与 plan Task 9 排除历史命令表述不同 | 逻辑一致（都要求活的清零、历史保留），plan 更精确，不构成矛盾 |

### 候选
| # | 问题 | 触发信号 |
|---|---|---|
| 1 | 用户 shell 残留 `MY_RULES_SRC` 环境变量 | 执行 Task 2 时发现 aas 读到的 srcDir 异常 |
| 2 | `aas sync --replace` 对「指向别处的链接」的替换行为未实测 | Task 9 Step 1 执行时验证；若 aas 不识别则加 `--rm-old` |
| 3 | `aas update skill-creator` 联网失败 | Task 9 Step 2 失败时跳过，不阻塞主流程（迁移核心不依赖它） |
| 4 | 迁移回滚路径未写明 | 迁移完成但发现问题需回退时（改源回 my-rules + `aas sync --replace` 反向重建） |
