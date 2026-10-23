# 规则库并入 retro-skills · 执行计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把全局规则源从独立仓库 `my-rules` 迁入 `retro-skills/rules/`，清理全部 my-rules 活引用，并顺带修 use-rule-skills 的两处交互体验。

**Architecture:** 规则与技能本属同一复盘流水线的两种载体，合并后 `retro-skills` 升级为「规范套件」；aas 保持独立、只改配置与文档不改代码（已读实现验证 `srcDir` 只有 env 覆盖 + 配置两处来源，`MY_RULES_SRC` 名字仅活在配置 `env` 字段，代码零改动）。两条生效管道不变：`rules/` → symlink 进 `user_rules/`，`skills/` → junction 进 `skills/`。

**Tech Stack:** markdown / Node（aas 测试）/ aas CLI。无新依赖。

**Spec:** `docs/superpowers/specs/2026-10-10-rules-migration-design.md`

## Global Constraints

- **跨两个仓库**：`d:\Seed\retro-skills` 与 `d:\Seed\agent-assets-sync` 分开改，改动各自留在工作区。
- **no-git-write**：本计划**不含任何 git 写操作**（无 add / commit / push）。每个任务收尾是「改动留在工作区，最终交用户决定提交方式」。
- **历史快照不改**：`docs/handoffs/*`、`docs/architecture-history.md`、`my-rules/README.md` 收编账目、规则正文里的历史反例描述（`landing-sweep.md` 的 L3/L22）、`docs/after/20261007201648-collect-requirements-exploration.md` L184——全是历史记录，原样保留。
- **数字实测**：技能/规则条数不手写，用取数命令（`aas` 体检 / `Get-ChildItem`）拿终态值。
- **改 skill 遵循 `skill-authoring-convention`**：本仓库内引用用相对路径 `rules/...`，不写绝对路径；跨技能引用用技能名。
- **验收红线**：全仓 `grep my-rules` 只剩历史记录，活的引用清零；`aas` 体检规则侧源路径显示 `d:\Seed\retro-skills\rules` 且「已就位 15」。
- **任务执行顺序**：Task 0（校验）最先；Task 1（改配置）必须在 Task 9（重建链接）之前；Task 9 必须在 Task 10（删 my-rules 目录）之前。

---

### Task 0: 迁移前校验（复制完整性 + 排除项）

**Files:**（无文件改动，纯校验）

- [ ] **Step 1: 复制完整性哈希比对**

Run（在 `d:\Seed\retro-skills`）:
```
Get-ChildItem 'd:\Seed\my-rules\rules' -Filter *.md | ForEach-Object { $h1=(Get-FileHash $_.FullName).Hash; $h2=(Get-FileHash ".\rules\$($_.Name)").Hash; if($h1 -ne $h2){ "MISMATCH: $($_.Name)" } }
```
Expected: 无 MISMATCH（15 个文件复制完整）

- [ ] **Step 2: 确认 .gitignore 不排除 rules/**

Run: `Select-String -Path .gitignore -Pattern 'rules'`
Expected: 无命中（rules/ 会被 git 追踪）

- [ ] **Step 3: 改动留在工作区（本任务无改动）**

---

### Task 1: aas 配置改路径（sync.config.json）

**Files:**
- Modify: `d:\Seed\agent-assets-sync\sync.config.json`

**Interfaces:**
- Produces: `linkTargets[0].srcDir = "D:/Seed/retro-skills/rules"`；`env.srcDir = "RETRO_SKILLS_RULES"`——Task 9 的 `aas sync --replace` 依赖它。

- [ ] **Step 1: 改规则那条的 srcDir**

`sync.config.json` 里，把：
```
      "srcDir": "D:/Seed/my-rules/rules",
```
改成：
```
      "srcDir": "D:/Seed/retro-skills/rules",
```

- [ ] **Step 2: 改 env 变量名**

把：
```
      "env": { "srcDir": "MY_RULES_SRC", "dstDir": "TRAE_RULES_DST" }
```
改成：
```
      "env": { "srcDir": "RETRO_SKILLS_RULES", "dstDir": "TRAE_RULES_DST" }
```

- [ ] **Step 3: 验证配置可解析 + 体检**

Run: `node -e "const c=require('./sync.config.json'); const t=c.linkTargets[0]; console.log(t.srcDir, t.env.srcDir)"`（在 `d:\Seed\agent-assets-sync`）
Expected: 输出 `D:/Seed/retro-skills/rules { srcDir: 'RETRO_SKILLS_RULES', dstDir: 'TRAE_RULES_DST' }`

Run: `aas`（只体检）
Expected: 规则侧显示「源：D:\Seed\retro-skills\rules」（此时链接仍指向旧路径，会报差异——**这是预期的中间态**，Task 9 才重建）

- [ ] **Step 4: 改动留在工作区（不提交，交用户决定）**

---

### Task 2: aas 文档与测试清理（14 处）

**Files:**
- Modify: `d:\Seed\agent-assets-sync\README.md`（L73/L75/L85/L101）
- Modify: `d:\Seed\agent-assets-sync\docs\design.md`（L18/L31/L81；L57 是历史命名论证，保留）
- Modify: `d:\Seed\agent-assets-sync\docs\cli-design.md`（L21/L49；L212 是历史完成记录，保留）
- Modify: `d:\Seed\agent-assets-sync\src\sync.mjs`（L84 注释、L416 提示文本）
- Modify: `d:\Seed\agent-assets-sync\test\sync.test.mjs`（L302/L305/L306）

**Interfaces:**
- Consumes: Task 1 定的新变量名 `RETRO_SKILLS_RULES`。
- Produces: 文档/测试与真实配置一致。

- [ ] **Step 1: README.md 四处**

- L73：`  "sources": { "myrules": "https://github.com/SeedHuang/my-rules" },   // 源登记（aas add 的短名）` → `  "sources": {},                                     // 源登记（aas add 的短名）`
- L75：`    { "label": "全局规则", "srcDir": "D:/Seed/my-rules/rules", "dstDir": "~/.trae-cn/user_rules",` → 同段 `srcDir` 改为 `"D:/Seed/retro-skills/rules"`
- L85：`| \`MY_RULES_SRC\` / \`RETRO_SKILLS_DIR\` | 两个链接形态的源目录 |` → `| \`RETRO_SKILLS_RULES\` / \`RETRO_SKILLS_DIR\` | 两个链接形态的源目录 |`
- L101：`- \`D:\Seed\my-rules\` —— 全局规则的源（链接形态）` → `- \`D:\Seed\retro-skills\rules\` —— 全局规则的源（链接形态，与技能同仓库）`

- [ ] **Step 2: docs/design.md 两处**（L57 保留）

- L18：`| \`D:\Seed\my-rules\rules\` | \`~\.trae-cn\user_rules\` | ...` → 首列改 `\`D:\Seed\retro-skills\rules\``
- L31：`它同时管 \`my-rules\` 的规则和 \`retro-skills\` 的技能。` → `它同时管 \`retro-skills\` 的规则和技能。`
- L81：`（架构文档、\`my-rules\README.md\`、相关规则正文）` → `（架构文档、README、相关规则正文）`

- [ ] **Step 3: docs/cli-design.md 一处**（L212 保留）

- L21：`| **链接形态**（现状，保留） | 你自己的源仓库（my-rules、retro-skills） | ...` → `| **链接形态**（现状，保留） | 你自己的源仓库（retro-skills：rules/ 与 skills/） | ...`
- L49：`"myrules": "https://github.com/SeedHuang/my-rules"` → 改为 `{}`（与真实配置 `sources: {}` 一致）

- [ ] **Step 4: src/sync.mjs 两处（仅注释/提示文本，代码逻辑不动）**

- L84 注释：`//            { "srcDir": "MY_RULES_SRC", "dstDir": "TRAE_RULES_DST" }` → `//            { "srcDir": "RETRO_SKILLS_RULES", "dstDir": "TRAE_RULES_DST" }`
- L416 提示文本：`（如 MY_RULES_SRC / RETRO_SKILLS_DIR / TRAE_RULES_DST / TRAE_SKILLS_DST）` → `（如 RETRO_SKILLS_RULES / RETRO_SKILLS_DIR / TRAE_RULES_DST / TRAE_SKILLS_DST）`

- [ ] **Step 5: test/sync.test.mjs 三处**

- L302：`env: { srcDir: 'MY_RULES_SRC' },` → `env: { srcDir: 'RETRO_SKILLS_RULES' },`
- L305：`{ env: { MY_RULES_SRC: 'C:/override' } }` → `{ env: { RETRO_SKILLS_RULES: 'C:/override' } }`
- L306：`{ env: { MY_RULES_SRC: '   ' } }` → `{ env: { RETRO_SKILLS_RULES: '   ' } }`

- [ ] **Step 6: 跑 aas 测试**

Run: `node --test test/`（在 `d:\Seed\agent-assets-sync`）
Expected: 全绿（69 个）

Run: `node -e "require('./src/sync.mjs')"`（无语法错误即可）
Expected: 无报错

- [ ] **Step 7: 改动留在工作区**

---

### Task 3: retro-skills 技能正文引用清理（19 处）

**Files:**
- Modify: `d:\Seed\retro-skills\skills\use-rule-skills\SKILL.md`（L17/L44/L45）
- Modify: `d:\Seed\retro-skills\skills\use-rule-skills\references\flows.md`（L68/L81）
- Modify: `d:\Seed\retro-skills\skills\use-rule-skills\references\routing.md`（L8/L12）
- Modify: `d:\Seed\retro-skills\skills\use-rule-skills\assets\report-template.md`（L3/L43）
- Modify: `d:\Seed\retro-skills\skills\rule-inspector\SKILL.md`（L3）
- Modify: `d:\Seed\retro-skills\skills\rule-inspector\references\recipes.md`（L96/L104/L110）
- Modify: `d:\Seed\retro-skills\skills\rule-inspector\scripts\score.mjs`（L305/L322）
- Modify: `d:\Seed\retro-skills\skills\rule-inspector\scripts\score.test.mjs`（L507）
- Modify: `d:\Seed\retro-skills\skills\rule-writer\references\writing-guide.md`（L78）
- Modify: `d:\Seed\retro-skills\skills\writing-after-docs\SKILL.md`（L49/L55）

**Interfaces:**
- Produces: 全部技能正文用本仓库内 `rules/` 路径，不再提 `my-rules`。

- [ ] **Step 1: use-rule-skills 三文件（9 处）**

统一替换规则：`my-rules/rules/` → `rules/`；「在 `D:\Seed\my-rules` 跑 `aas sync`」→「在 `d:\Seed\retro-skills` 跑」。

- SKILL.md L17：`（路径指向 \`my-rules/rules/<name>.md\`）` → `（路径指向 \`rules/<name>.md\`）`
- SKILL.md L44：`写 \`my-rules/rules/<规则名>.md\`（只建源仓库）` → `写 \`rules/<规则名>.md\`（只建源仓库，本仓库）`
- SKILL.md L45：`\`aas sync\`（在 \`D:\Seed\my-rules\` 跑，只建缺失链接）` → `\`aas sync\`（在 \`d:\Seed\retro-skills\` 跑，只建缺失链接）`
- flows.md L68：`写 my-rules/rules/ + aas sync` → `写 rules/ + aas sync`
- flows.md L81：`写 my-rules + aas sync` → `写 rules/ + aas sync`
- routing.md L8：`（路径指向 \`my-rules/rules/<name>.md\`）` → `（路径指向 \`rules/<name>.md\`）`
- routing.md L12：`源规则在 \`my-rules/rules/<name>.md\`` → `源规则在 \`rules/<name>.md\``
- report-template.md L3：`（源：my-rules/rules/<规则名>.md）` → `（源：rules/<规则名>.md）`
- report-template.md L43：`落地：my-rules/rules/<规则名>.md + aas sync` → `落地：rules/<规则名>.md + aas sync`

- [ ] **Step 2: rule-inspector 三文件（7 处）**

- SKILL.md L3 description：`体检 my-rules/rules/ 里的规则` → `体检 rules/ 里的规则`
- recipes.md L96：`（\`my-rules/rules/\`，对每个项目生效）` → `（\`rules/\`，对每个项目生效）`
- recipes.md L104：`**跨仓搬移（\`my-rules\` → 项目仓库）` → `**跨仓搬移（规则库 → 项目仓库）`
- recipes.md L110：`整体搬去项目文档后 \`my-rules\` 删文件` → `整体搬去项目文档后 \`rules/\` 删文件`
- score.mjs L305：`dir: 'D:\\Seed\\my-rules\\rules'` → `dir: 'D:\\Seed\\retro-skills\\rules'`（**同时确认这是唯一硬编码，调用处传 `--dir` 可覆盖**）
- score.mjs L322 注释：`（my-rules/rules）` → `（rules/）`
- score.test.mjs L507：`'--dir', 'D:\\Seed\\my-rules\\rules'` → `'--dir', 'D:\\Seed\\retro-skills\\rules'`

- [ ] **Step 3: rule-writer + writing-after-docs（3 处）**

- rule-writer/references/writing-guide.md L78：`参考 \`my-rules/rules/no-git-write.md\`` → `参考 \`rules/no-git-write.md\``
- writing-after-docs/SKILL.md L49：`（\`my-rules\rules\docs-convention.md\`）` → `（\`rules\docs-convention.md\`）`
- writing-after-docs/SKILL.md L55：`（\`my-rules\rules\docs-convention.md\`，已同步生效）` → `（\`rules\docs-convention.md\`，已同步生效）`

- [ ] **Step 4: 验证技能目录内 my-rules 清零**

Run（在 `d:\Seed\retro-skills`）:
```
Get-ChildItem skills -Recurse -File -Include *.md,*.mjs | Select-String -Pattern 'my-rules|my_rules|MY_RULES'
```
Expected: 无输出（清零）

- [ ] **Step 5: 跑 rule-inspector 脚本测试**

Run（在 `d:\Seed\retro-skills\skills\rule-inspector`）: `node --test scripts/score.test.mjs`
Expected: 全绿（score.test.mjs 用新路径 `d:\Seed\retro-skills\rules` 能跑通）

- [ ] **Step 6: 改动留在工作区**

---

### Task 4: 规则正文 rules-single-source.md 更新

**Files:**
- Modify: `d:\Seed\retro-skills\rules\rules-single-source.md`（L5 活判据；L3 来源行是 provenance，保留原文 + 附迁移注记）

**Interfaces:**
- Produces: 每轮注入的规则不再指向不存在的 `my-rules` 路径。

- [ ] **Step 1: 改 L5 活判据**

把：
```
**新建全局规则一律建在 `my-rules\rules\`，禁止直接写运行时 `~\.trae-cn\user_rules\`。**
```
改成：
```
**新建全局规则一律建在本仓库 `rules\` 目录，禁止直接写运行时 `~\.trae-cn\user_rules\`。**
```

- [ ] **Step 2: L3 来源行附迁移注记（原文保留）**

在 L3 来源行末尾追加（不删原文）：
```
｜2026-10-10 迁移：规则库随 my-rules 并入 retro-skills，路径改为本仓库 `rules/`
```

- [ ] **Step 3: 验证**

Run（在 `d:\Seed\retro-skills`）:
```
Get-ChildItem rules -Filter *.md | Select-String -Pattern 'my-rules'
```
Expected: 只剩 `landing-sweep.md` 的两处历史反例描述（L3/L22，**保留**），`rules-single-source.md` 不再含 `my-rules`（来源行的历史证据除外——见 Step 2 注记）。

- [ ] **Step 4: 改动留在工作区**

---

### Task 5: README 残留清理 + 仓库结构补全

**Files:**
- Modify: `d:\Seed\retro-skills\README.md`（L84；「仓库结构」一节 L93-99）

**Interfaces:**
- Consumes: 无（README 补两行不依赖其它任务输出；技能数 17 由 Task 7 保证，但本任务不读它）。
- Produces: README 无 my-rules；仓库结构列出 `rules/` 与 `docs/guide/`。

- [ ] **Step 1: 改 L84**

把：
```
| 全局规则源（如 `my-rules/rules/`） | `~/.trae-cn/user_rules/` | symlink |
```
改成：
```
| 全局规则源（`rules/`） | `~/.trae-cn/user_rules/` | symlink |
```

- [ ] **Step 2: 「仓库结构」一节补两行**

在现有列表（skills/ 行之后）追加：
```
- `rules/` —— 全局规则源（纯 markdown；**改源即生效**，运行时是只读链接）
- `docs/guide/` —— 技能与规则的分部指南（README 只留速查，详情在这）
```

- [ ] **Step 3: 验证 README 无 my-rules**

Run（在 `d:\Seed\retro-skills`）: `Select-String -Path README.md -Pattern 'my-rules'`
Expected: 无输出

- [ ] **Step 4: 改动留在工作区**

---

### Task 6: docs/architecture.md 更新（三仓库 → 两线）

**Files:**
- Modify: `d:\Seed\retro-skills\docs\architecture.md`（L5/L20/L61/L85/L89/L135/L150/L159/L166/L170/L171/L193/L194/L203/L206）

**Interfaces:**
- Consumes: Task 1 定的新变量名 `RETRO_SKILLS_RULES`；Task 7 的技能数（17）。
- Produces: 体系图反映「规范源（本仓库 rules+skills）+ 工具（aas）」两线。

- [ ] **Step 1: §2 三件套定位表——my-rules 行并入 retro-skills**

- L20 整行：`| **my-rules** | **骨架**——规范的"源" | 全局规范（成品） | D:\Seed\my-rules（git） |` 删除；retro-skills 行（L19）改为 `| **retro-skills** | **引擎 + 骨架**——驱动逻辑 + 规范"源" | 发现 → 分析 → 落地；全局规则 + 技能（rules/ 与 skills/） | D:\Seed\retro-skills（git） |`

- [ ] **Step 2: 数据流图与公理引用**

- L61：`├── 全局 rule：源 my-rules → 运行时 ...` → `├── 全局 rule：源 rules/（本仓库）→ 运行时 ...`
- L85：`**my-rules\rules\rules-single-source.md**` → `**rules\rules-single-source.md**`
- L89：`  my-rules            ──同步──►  ~\.trae-cn\user_rules\` → `  rules/（retro-skills）──同步──►  ~\.trae-cn\user_rules\`

- [ ] **Step 3: §7 仓库清单**

- L150 整行：`| **my-rules** | ✅ 已建（git + GitHub 远程） | 全局 rule 的源... |` → `| **my-rules** | 🗄️ 已归档（2026-10-10 并入 retro-skills） | 历史规则源仓库；本地已删、远程归档 |`
- L135（C1 条目）：`| C1 | **my-rules 仓库** | ✅ 已建（见 §8.1） |` → `| C1 | **my-rules 仓库** | ✅ 已建（见 §8.1）→ 2026-10-10 并入 retro-skills，归档 |`

- [ ] **Step 4: §8 执行顺序历史行（保留，标注迁移）**

- L159：`✅ 1. C1 my-rules bootstrap + C4 同步/体检脚本 → 已完成（见 §8.1）` 保留原文（历史），末尾追加 `；2026-10-10 规则库并入 retro-skills` 注记
- L166 标题：`### 8.1 已完成：my-rules + 同步脚本 + 测试` 保留（历史事件标题）

- [ ] **Step 5: §8.1 路径表与变量名**

- L170：`D:\Seed\my-rules\rules\` → `D:\Seed\retro-skills\rules\`
- L171：`D:\Seed\my-rules\README.md` → `D:\Seed\retro-skills\README.md`
- L193：`源 \`D:\Seed\my-rules\rules\` ＋ \`D:\Seed\retro-skills\skills\`` → `源 \`D:\Seed\retro-skills\rules\` ＋ \`D:\Seed\retro-skills\skills\``；`\`MY_RULES_SRC\` / \`RETRO_SKILLS_DIR\`` → `\`RETRO_SKILLS_RULES\` / \`RETRO_SKILLS_DIR\``
- L194：`（或设 \`MY_RULES_SRC\`）` → `（或设 \`RETRO_SKILLS_RULES\`）`
- L203：`SymbolicLink → \`my-rules\rules\<名字>.md\`` → `SymbolicLink → \`rules\<名字>.md\``
- L206：`改 \`my-rules\` 里的规则` → `改 \`rules/\`（本仓库）里的规则`

- [ ] **Step 6: 验证 architecture.md**

Run（在 `d:\Seed\retro-skills`）: `Select-String -Path docs/architecture.md -Pattern 'my-rules'`
Expected: 只剩 L135/L159/L166 的历史注记中的 my-rules（这是有意保留的历史），无其它活引用

- [ ] **Step 7: 改动留在工作区**

---

### Task 7: guide/skills 补 4 个规则管理技能（13 → 17）

**Files:**
- Modify: `d:\Seed\retro-skills\docs\guide\skills\README.md`（末尾追加 4 个条目，编号接在 13 之后）

**Interfaces:**
- Produces: guide/skills 覆盖全部 17 技能；README 的「场景速查」表可随后补行（可选）。

- [ ] **Step 1: 追加 4 个技能条目**

在文件末尾追加（与现有条目同模板「什么时候用 / 做什么 / 不做什么」）：

````markdown
### 14. `rule-inspector` — 判据驱动的规则检察员

- **什么时候用**：用户说「体检 rules / 优化 rules」。
- **做什么**：按判据全集给 `rules/` 里的规则评分、出报告、给处方、防劣化（体检/评分走它）。
- **不做什么**：新建规则（走 use-rule-skills）、按处方改规则正文（走 rule-writer）、审查（走 review-loop）。

### 15. `rule-writer` — 写新规则 / 按处方优化已有规则

- **什么时候用**：用户说「写一条规则 / 优化这条规则」。
- **做什么**：按判据四要素 + 执行力度 8 项 + 来源行 + 分层级 + 判定词归一，写新规则或按 inspector 处方优化已有规则（写规则的，自然也改规则）。
- **不做什么**：体检/评分/处方（走 rule-inspector）、审查（走 review-loop）。

### 16. `skill-inspector` — 判据驱动的技能检察员

- **什么时候用**：用户说「体检 skills / 优化 skill / 检查技能」。
- **做什么**：按 skill-authoring-convention 判据给 `skills/` 里的技能评分、出报告、给处方、修复优化。
- **不做什么**：新建规则（走 use-rule-skills）、改载体施工（走 evolving-skills）。

### 17. `use-rule-skills` — 新建/优化规则的统一入口

- **什么时候用**：触发「新建 rule / 优化这个 rule / 裸调用」。
- **做什么**：判定意图 → 路由 rule-writer 起草 / rule-inspector 评分 → 草稿箱管理 → 报告（依赖 rule-inspector + rule-writer）。
- **不做什么**：不自动触发；自身不写规则正文（那是 rule-writer）。
````

- [ ] **Step 2: 同步标题与头部**

把文件第 1 行 `# 十三个技能：各自的作用与使用时机` → `# 十七个技能：各自的作用与使用时机`；头部说明「README 只保留速查表」保持不变。

- [ ] **Step 3: 验证**

Run（在 `d:\Seed\retro-skills`）: `Select-String -Path docs/guide/skills/README.md -Pattern '^### '`
Expected: 17 个 `###` 条目

Run（取数命令）: `Get-ChildItem skills -Directory | Measure-Object`（应 = 17，与 guide 对齐）
Expected: 17

- [ ] **Step 4: 改动留在工作区**

---

### Task 8: use-rule-skills 交互改进（采纳选项 + diff 入口）

**Files:**
- Modify: `d:\Seed\retro-skills\skills\use-rule-skills\SKILL.md`（「报告」「落地」两节）
- Modify: `d:\Seed\retro-skills\skills\use-rule-skills\references\flows.md`（§二生命周期表、§四第 8 步、§五第 6 步）
- Modify: `d:\Seed\retro-skills\skills\use-rule-skills\assets\report-template.md`（§三「查看 diff」、§五「落地结论」）

**Interfaces:**
- Produces: 草稿采纳走正文文字选项（不弹窗、不反复追问）；diff 走「查看差异」文字入口 + 代为执行。

- [ ] **Step 1: report-template.md §三——diff 改文字入口**

把：
```
## 三、查看 diff（仅优化；新建写"不适用"）
在当前窗口打开（不新开编辑器），任选其一：
- Trae：`trae-cn -d -r "<源路径>" "<草稿路径>"`
- VSCode：`code -d -r "<源路径>" "<草稿路径>"`
> `-r/--reuse-window` = 复用已打开的窗口。协议链接（`vscode://` / `trae://`）在 Trae 中点击无反应，勿用。
```
改成：
```
## 三、查看 diff（仅优化；新建写"不适用"）
**回复「查看差异」→ 我代为执行命令，在当前窗口打开改前 vs 改后对比（不新开编辑器）。**

（手动也可——任选其一，`-r/--reuse-window` = 复用已打开的窗口；协议链接 `vscode://` / `trae://` 在 Trae 中点击无反应，勿用）
- Trae：`trae-cn -d -r "<源路径>" "<草稿路径>"`
- VSCode：`code -d -r "<源路径>" "<草稿路径>"`
```

- [ ] **Step 2: report-template.md §五——落地结论加两个文字选项**

把：
```
## 五、落地结论
- 落地：rules/<规则名>.md + aas sync ✓ / 待确认
- 草稿：已删除 / 保留
- 残留 findings：无 / 用户接受：<清单>
```
改成：
```
## 五、落地结论（二选一，回复即可，不弹窗不追问）
- 落地：rules/<规则名>.md + aas sync ✓ / 待确认
- 草稿：已删除 / 保留
- 残留 findings：无 / 用户接受：<清单>

**下一步（两个选项，直接回复一个）**：
- 【采纳】→ 我写 `rules/<规则名>.md` + `aas sync` + 删该规则名下草稿（删前再提示一次）
- 【不采纳】→ 保留草稿：继续改 / 放弃（草稿不删，等你说下一步）
```

- [ ] **Step 3: flows.md——生命周期表与落地步骤**

§二生命周期表「采纳落地」行：`删除该规则名下所有草稿；**删前提示一次**「将删除该规则名下所有草稿，要保留的先移出草稿箱」→ 用户确认后删` 后追加一句：**不主动追问采纳——报告末尾给出「【采纳】/【不采纳】」两个文字选项，等用户回复；用户不回复就停住，不弹窗、不反复问。**

§四第 8 步、§五第 6 步「落地」：末尾追加：**按报告 §五的「【采纳】/【不采纳】」两个文字选项走——用户回「采纳」才落地；回「不采纳」保留草稿继续。**

- [ ] **Step 4: SKILL.md「落地」一节**

把：
```
## 落地（采纳时）
1. 确认最终 rule 名 → 写 `rules/<规则名>.md`（只建源仓库，本仓库）。
2. `aas sync`（在 `d:\Seed\retro-skills` 跑，只建缺失链接）。
3. 删该 rule 名下所有草稿（`drafts rm --rule <规则名>`）——**删前提示一次**「将删除该规则名下所有草稿，要保留的先移出草稿箱」→ 用户确认后删。
```
改成：
```
## 落地（用户回「采纳」时）
0. **不主动追问采纳**——写完草稿 + 出报告后停住，报告末尾给「【采纳】/【不采纳】」两个文字选项，等用户回复；不弹窗、不反复问。
1. 确认最终 rule 名 → 写 `rules/<规则名>.md`（只建源仓库，本仓库）。
2. `aas sync`（在 `d:\Seed\retro-skills` 跑，只建缺失链接）。
3. 删该 rule 名下所有草稿（`drafts rm --rule <规则名>`）——**删前提示一次**「将删除该规则名下所有草稿，要保留的先移出草稿箱」→ 用户确认后删。
```

- [ ] **Step 5: 验证**

Run（在 `d:\Seed\retro-skills\skills\use-rule-skills`）: `node scripts/drafts.mjs ensure`（确认脚本仍正常）
Expected: 无报错（幂等建目录）

- [ ] **Step 6: 改动留在工作区**

---

### Task 9: 运行时链接重建 + 全量验证

**Files:**（无文件改动，纯验证）

**Interfaces:**
- Consumes: Task 1（配置已改）、Task 3-6（引用已清理）。
- Produces: 运行时链接指向新源；验收全绿。

- [ ] **Step 1: 重建规则链接**

Run: `aas sync --replace`（在 `d:\Seed\retro-skills`）
Expected: 规则侧把旧链接（指向 `D:\Seed\my-rules\rules`）替换为指向 `D:\Seed\retro-skills\rules`

- [ ] **Step 2: 顺带修 aas 体检报的既有漂移**

Run: `aas update skill-creator`
Expected: skill-creator 条目对齐（这是 aas 体检报的「链接指向别处」漂移，与本次迁移无关但顺带修）

- [ ] **Step 3: 全量体检**

Run: `aas`
Expected: 规则「已就位 15」，源路径 `D:\Seed\retro-skills\rules`；技能「已就位 17」；「需建链接 0 / 需替换 0 / 残留 0」；exit 0

- [ ] **Step 4: 全仓 my-rules 残留扫描（验收红线）**

Run（在 `d:\Seed\retro-skills`）:
```
Get-ChildItem . -Recurse -File -Include *.md,*.mjs,*.json | Where-Object { $_.FullName -notmatch '\\docs\\handoffs\\' -and $_.FullName -notmatch 'architecture-history' -and $_.FullName -notmatch '\\\.session\\' } | Select-String -Pattern 'my-rules|my_rules|MY_RULES'
```
Expected: 只剩 `docs/architecture.md` 的历史注记（L135/L159/L166）、`landing-sweep.md` 的历史反例、`docs/after/` 历史陈述——活的引用清零

Run（在 `d:\Seed\agent-assets-sync`）: `Get-ChildItem . -Recurse -File -Include *.md,*.mjs,*.json -Exclude node_modules | Select-String -Pattern 'my-rules|my_rules|MY_RULES'`
Expected: 无输出（history 里没有，全清）

- [ ] **Step 5: 验证运行时链接指向（全量 15 条）**

Run: `Get-ChildItem "$env:USERPROFILE\.trae-cn\user_rules" -Filter 'rule-*.md' | Select-Object Name, LinkType, Target | Where-Object { $_.LinkType -ne 'SymbolicLink' -or $_.Target -notlike '*retro-skills\rules*' }`
Expected: 无输出（15 条全部 SymbolicLink 且 Target 指向 `d:\Seed\retro-skills\rules\...`）；aas 体检「已就位 15」兜底

- [ ] **Step 6: aas 测试 + score 测试复核**

Run（`d:\Seed\agent-assets-sync`）: `node --test test/`（Expected: 全绿）
Run（`d:\Seed\retro-skills\skills\rule-inspector`）: `node --test scripts/score.test.mjs`（Expected: 全绿）

---

### Task 10: my-rules 本地退役（远程归档待用户指示）

**Files:**
- Delete: `d:\Seed\my-rules`（整个目录，用户已确认「远程归档、本地删除」）

**Interfaces:**
- Consumes: Task 9 已完成（链接已重建指向新源，删旧目录不会断链）。
- Produces: 本地无 my-rules 目录。

- [ ] **Step 1: 删前检查 my-rules 未提交内容**

Run（在 `d:\Seed\my-rules`）: `git status --porcelain`
Expected: 无输出（工作区干净）；**有输出时先暂停**——删除是不可逆操作，先确认未提交内容已推远程或不需要保留，再继续

- [ ] **Step 2: 本地删除**

Run: `Remove-Item -Recurse -Force 'd:\Seed\my-rules'`
（前提：Task 9 已验证链接全部指向 `retro-skills\rules`，删除不会造成中间态断链）

- [ ] **Step 3: 验证**

Run: `Test-Path 'd:\Seed\my-rules'`（Expected: False）
Run: `aas`（Expected: 仍全绿——规则链接指向 retro-skills，与 my-rules 目录无关）

- [ ] **Step 4: 远程归档（不做，等用户指示）**

GitHub `SeedHuang/my-rules` 的归档动作（加 archived 标记 / 重命名后缀）涉及用户账号，**留在待办**：交付时提示用户，由用户执行或明确授权后执行。

---

## 自审记录

- **Spec 覆盖**：§4 aas 配置/文档/测试 → Task 1/2；§5.1 技能正文 → Task 3；§5.2 规则正文 → Task 4；§5.3 README → Task 5、architecture.md → Task 6、after 保留（Global Constraints 已声明）；§6.1 技能缺口 → Task 7；§6.2 交互改进 → Task 8；§7 重建+退役 → Task 9/10；§8 验收判据 → Task 9 Step 3-6。
- **占位符扫描**：无 TBD/TODO；每处替换都给了精确 old→new。
- **一致性**：变量名全计划统一 `RETRO_SKILLS_RULES`；技能数统一 17；规则数统一 15；score.mjs 默认路径 `D:\Seed\retro-skills\rules` 在 Task 3 与 Task 9 一致。

## 评审 Backlog

段二评审（2026-10-10 review-md-to-death）发现与处置见 spec §11 Backlog（本文件不重复，防双份真相）。本计划据评审已补：Task 0（复制校验）、Task 9 Step 5（全量验证）、Task 10 Step 1（删前检查）、Task 5 Interfaces 修正。
