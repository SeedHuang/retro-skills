---
name: prd-to-specs
description: Split an existing PRD into independently developable specs with a roadmap index, following bfm-verified conventions. Use when the user asks to 拆分PRD, 生成spec拆分方案, 规划spec路线图, or 优化PRD的里程碑拆分. Do not use for writing implementation plans, writing code, or code review.
---

# PRD → Specs 拆分

把一个已定稿的 PRD 拆分为一组**可独立开发、可独立验收**的 spec，并把拆分结果作为路线图章节写进 PRD。全部句式与结构规范提取自 `bilibili_favorite_manager` 的真实实践（specs/README 索引制、决定必带为什么、JIT 延迟细化）。

## 输入

用户指定一个 PRD 文件路径。开始前先读：

1. PRD 全文
2. 项目现状：已有的 `docs/superpowers/specs/`、`docs/superpowers/plans/`（若有，增量拆分而非重复造）
3. 代码/仓库实际模块边界（拆分要对齐真实变更半径，不是对着文档空切）

## 流程

### 第 1 步 · 提取拆分输入（四件套）

从 PRD 中提取并显式列出：

- **验收标准 / 里程碑**（拆分的锚，每个 spec 必须回溯到它们）
- **硬性约束**（不可违反的 C 类条目，跨 spec 的要提升为 shared）
- **非目标 / YAGNI 清单**（防止拆分时夹带私货）
- **待定决策**（未拍板的，标为开放问题，不得假装已定）

### 第 2 步 · 应用六规则切分

按 `references/quality-gates.md` 的六规则切：垂直切片、依赖 DAG、变更半径不重叠、风险前置、规模上限（单个 spec 对应 plan 约 ≤8 task）、验收锚定。切分时对齐真实模块边界。

### 第 3 步 · 判定 shared（只判定，不建文件）

一份内容预计会被 **≥2 个 spec 的 plan 实际引用**（数据模型、测试策略、日志、前端语言都是典型）→ 在路线图中**标注**它为 shared 候选及其 PRD 出处章节（如"数据模型 → PRD §4.1，将来提为 shared-data-model"）。判定依据是"会被引用"，不是"看起来通用"；引用不明确的先不提，等第二个引用真实出现再说。**shared 文件本身在第一个引用它的 spec 开工时才创建**（且内容用引用指向 PRD，不抄写），或由用户明确要求时提前创建。

### 第 4 步 · 产出路线图（JIT 门）

**默认落点：PRD 内嵌**——在 PRD 中新增（或修订）"§N Spec 路线图"章节，参照 `assets/roadmap-template.md` 的字段结构。**不要为路线图创建任何新文件**（README 索引、shared 文档都不建）；仅当用户明确要求独立索引时才建 `specs/README.md`。

**JIT 门（硬性）**：路线图阶段每个 spec 只允许写——标题、边界一句话、大纲要点、依赖、验收锚点。**禁止出现**：字段级设计、SQL、接口签名、任务步骤。细节推迟到 spec 开工时写（"现在写就是猜"）。

**双份真相禁令（硬性）**：PRD 已定稿的内容（DDL、架构决策、错误处理原则）**只活在 PRD**，严禁复制进任何新文件。后续 spec 一律用引用（"见 PRD §4.1"），不抄写。

### 第 5 步 ·（可选）生成 spec 骨架

**默认不生成任何文件。** 仅当用户明确确认路线图并要求开工下一个 spec 时，才为其生成骨架：用 `assets/spec-template.md`，只填"为什么 + 核心决定表"，其余节留空并注释 `<开工时填充>`。一次只生成一个，不批量。

### 第 6 步 · 自检与评审

逐条过 `references/quality-gates.md` 末尾的自检清单，把结果汇报给用户。建议用户对每个 spec 文档走 `multi-lens-review` 评审后再进入 writing-plans。

## 写作规范（句式一致性）

所有产出物（路线图、spec、后续 plan）一律遵循 `references/conventions.md`：

- 每个决定/约束/测试**必须带"为什么"列**——没有为什么的决定不许写进表
- 表格优先于散文；编号体系跨文件引用（C1 / R1 / S1 / FR-x / Task N）
- 大白话 + 技术双层表述（"它是干什么的"+"怎么做的"）
- 日期与来源标注（洞察是谁的、哪天实测的）
- 禁占位符：TBD / TODO / 稍后补充
- 命名：`shared-*.md` 与 `m{N}[a-z]*-<slug>.md`，无主 spec，文件地位平等

## 产出物清单

1. **PRD 内的 Spec 路线图章节**（默认唯一产出）
2. （仅用户显式确认后）下一个 spec 的骨架文件
3. 自检结果汇报

## 复盘回流（进化飞轮）

使用中发现**本技能应该覆盖但没覆盖**的问题时：

1. **先记录不阻塞**：按复盘套件流程落错题集 KB——`retro-collect` / `retro-analyze`，条目进 `<KB>/skills/prd-to-specs/ledger.md`（教训落点 = 本技能的流程节 / 质量门 / 模板；**不写进本技能目录**，目录保持发布纯净）
2. **提示用户**：「这暴露了拆分方法的盲区（归因 X），可固化进 skill。现在优化还是稍后批量？」
3. 用户同意优化 → 走 `evolving-skills`（六步协议 + 差异卡）——**不在使用当场顺手改**

飞轮：拆分 → 使用 → 发现 → 归因 → 方法进化 → 更准的拆分。
