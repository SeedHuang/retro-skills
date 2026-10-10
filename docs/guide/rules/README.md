# 十五条全局规则：各自的作用与适用范围

> 这是 README「技能与规则」的展开指南，README 只保留速查表以控制篇幅。规则与技能同逻辑，三字段一一对应：**什么时候生效 / 核心判据 / 不管什么**。**规则源在 `rules/`，改源即生效（运行时是只读链接）。**

### 1. `code-style` — 代码风格

- **什么时候生效**：写 / 改前端代码时（import 路径、列表空态、styled-components）。
- **核心判据**：业务模块内资源用相对路径、公共资源用 `@/`；列表空态统一用 antd `Empty`；`styled.xxx` 定义必须放独立 `sc.tsx`，禁止写在业务组件文件里。
- **不管什么**：其它语言 / 非前端代码的风格。

### 2. `docs-convention` — 项目文档按生命周期状态分目录

- **什么时候生效**：写 / 归类项目文档时。
- **核心判据**：文档第一分类维度是生命周期状态——已定稿进 `specs/`、排期进 `plans/`、交接进 `handoffs/`、**未决进 `docs/after/`**、临时进 `.session/`；一主题一份，命名小写 kebab-case。
- **不管什么**：技能目录语义（归 `skill-assets-convention`）。

### 3. `global-ask-before-acting` — 沟通中未获授权禁止写操作

- **什么时候生效**：用户主动发起沟通时（沟通模式）。
- **核心判据**：先讲清想法 + 给倾向 → 等授权 → 才动手；写操作有封闭清单；只读探查是唯一例外。
- **不管什么**：执行模式（用户明确给执行指令后退出本规则）。

### 4. `how-i-must-reason` — 我的推理纪律

- **什么时候生效**：我要说出口任何结论时。
- **核心判据**：结论必须有判据并标明来源；判据不许是「感觉 / 规模」；遇到问题先判性质（漏 case vs 机制错）；能自己定就自己定；数字一律实测附取数命令；反驳用户必须带依据。
- **不管什么**：内容对错（review 的事）、语气（归 `plain-language-to-user`）、动手前授权（归 `global-ask-before-acting`）。

### 5. `import-guard` — 编辑代码禁止丢失 import

- **什么时候生效**：编辑 `.ts/.tsx/.js/.jsx` 文件时。
- **核心判据**：同一文件只发一次 SearchReplace；import 变更与代码变更合并进同一次；分阶段跑 `tsc --noEmit` 验证；编辑确认只信磁盘读回，不信工具回执。
- **不管什么**：非代码文件（无 import，但仍要核读回）。

### 6. `landing-sweep` — 落地后回头扫声明它的地方

- **什么时候生效**：一件事「落地」（建脚本 / 加规则 / 完成待办）之后。
- **核心判据**：回头扫四类声明它的地方（源码注释 / README / 架构文档 spec·plan / 规则正文），过时描述与数字改掉；数字只留一处并附取数命令。
- **不管什么**：落地动作本身。

### 7. `no-git-write` — 全局 Git 写操作禁令

- **什么时候生效**：任何可能改工作区或 `.git` 的操作前。
- **核心判据**：除非用户在当前对话明确要求，否则禁止主动执行任何 git 写操作（commit / push / merge / checkout / add 等）；读操作（status / log / diff）随时可跑；plan、子代理、脚本里的 commit 步骤都不算授权。
- **不管什么**：git 读操作。

### 8. `plain-language-to-user` — 给用户看的解释一律用大白话

- **什么时候生效**：给用户（人）的任何解释、评审、方案、报告。
- **核心判据**：不用行话与内部编号；不省机理（讲清为什么会这样）；抽象说法必须落到具体例子；一句话一件事。
- **不管什么**：代码注释与内部文档的措辞。

### 9. `poll-deferred-at-start` — 开工时轮询推迟项

- **什么时候生效**：会话开始时。
- **核心判据**：用 `managing-lessons-store` 跑推迟项轮询，逐条核对「复活信号」；报告必须带计数（如「推迟项 N 条，命中 M」）。
- **不管什么**：轮询之外的事项管理。

### 10. `powershell-file-encoding` — PowerShell 写文本禁用 -Encoding UTF8

- **什么时候生效**：PowerShell 5.1 写文本文件时。
- **核心判据**：禁止 `-Encoding UTF8`（会写 UTF-8 BOM，导致下游解析报错）；用 `[IO.File]::WriteAllText` 显式指定无 BOM；写完自查文件头三字节。
- **不管什么**：其它语言 / 工具的文本写入。

### 11. `rules-single-source` — 全局规则只建在源仓库

- **什么时候生效**：新建 / 删除 / 修改全局规则时。
- **核心判据**：规则一律建在 `rules/`（本仓库），禁止直接写运行时 `~\.trae-cn\user_rules\`；改已有内容改源即生效；新增 / 删除后必须跑 `aas sync`；收尾跑 `aas` 体检，「需建链接」应为 0。
- **不管什么**：运行时目录（只读，改了会被同步冲掉）。

### 12. `skill-assets-convention` — 技能目录语义遵循官方标准

- **什么时候生效**：写 / 组织技能（SKILL.md / scripts / references / assets）时。
- **核心判据**：三档官方语义——`scripts\`（可执行）、`references\`（按需加载的文档）、`assets\`（输出用的模板）；产物骨架不内联进 SKILL.md，只留指针。
- **不管什么**：项目文档目录（归 `docs-convention`）。

### 13. `skill-authoring-convention` — 写 skill 禁止用文件路径指路

- **什么时候生效**：写 / 修订 skill（SKILL.md / scripts / references / assets）时。
- **核心判据**：跨技能引用用技能名、禁止写对方技能内部路径；本技能内自引用用相对路径；脚本「直接运行 vs 被 import」判断禁止路径字符串比较（用 `realpathSync` 归一）。
- **不管什么**：读已有 skill 做检查 / 审查（唯一例外）。

### 14. `ts-expect-error` — @ts-expect-error 只在 TS 实际报错时使用

- **什么时候生效**：添加 `@ts-expect-error` 之前。
- **核心判据**：先验证该行 TypeScript 确实报错；跑 `tsc --noEmit` 或看 IDE 诊断；若出现 `Unused '@ts-expect-error' directive.` 直接删除该注释。
- **不管什么**：——

### 15. `vitest-queued-alternative` — Vitest 受限环境 stuck 时改用替代验证

- **什么时候生效**：受限环境中 Vitest 无限 stuck 在 `[queued]` 状态。
- **核心判据**：不反复重试，改用 `GetDiagnostics` + `tsc --noEmit` + 检查最终产物文件结构来验证正确性；测试文件本身保留，在可跑环境正常执行。
- **不管什么**：——
