# Session 交接：retro-skills → Docgen 写盘通路施工（2026-10-21）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-21 19:02（Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `5b518d7`（分支 `master`）；工作树：**未 clean**，见「现状 · 工作树异常」 |
| 验证基线 | `npm run check` = tests **470/470** + fail **0** + baseline **35/35** + findings **0** + markdown **231 文件 / 806 张表** + `check 全部通过`（19:03:45 实跑，含本交接文件写入后）。本项目无独立 typecheck / build 脚本 |
| 继任自 | `docs/handoffs/2026-10-21-f1-sdet-desc-trigger.md` |
| 状态 | 可直开工 |

## 项目定位

`d:\Seed\retro-skills` —— AI 协作规则 / 技能 / 议会评审体系的源仓库；其中 `tools/docgen/` 是一条「组件数据 + 模板 → 渲染 → 守卫」的管线，用来生成 `agents/*.md` 的 14 席 agent 卡。

## 现状

- **已完成**：
  - 新 spec 已定稿：`docs/superpowers/specs/2026-10-21-docgen-replace-intent-change-design.md`（抬头状态行已改为「已定稿」，注明议会 2026-10-21 第 1 轮通过）
  - 配套 testcase v2 已定稿：`docs/superpowers/specs/2026-10-21-docgen-replace-intent-change-design-testcase.md`（**67 条** = 正 20 / 负 26 / 边界 21；由独立 `senior-sdet` 实例 `sdet-2026-10-21-docgen-intent-change-r2` 编写）
  - 议会评审第 1 轮已收口：6 席（后端 / 测试 / 审计 / 读者代表 / 安全 / AI）+ 侦探常驻；去重后 **26 族**（P0 2 / P1 14 / P2 10）全部有终态；审计 round-check 打回 8 项已全部关闭
  - 评审账本四件齐：见「过程记录」
- **验证证据**：见元信息表『验证基线』（单源，勿重复填写）
- **提交状态**：**全部未提交，由用户自行 commit**；本 session 未执行任何 git 写操作
- **工作树异常**（取数：`git status --porcelain`）：
  - ` M docs/after/pending-work-overview.md` —— 上一 session 追加的「路 B 已定方向」段落，本 session 未改
  - `?? docs/handoffs/2026-10-21-f1-sdet-desc-trigger.md` —— 上一 session 的交接词（即本文件的「继任自」）
  - `?? docs/superpowers/specs/2026-10-21-docgen-replace-intent-change-design.md` —— 本 session 产出（spec）
  - `?? docs/superpowers/specs/2026-10-21-docgen-replace-intent-change-design-testcase.md` —— 本 session 产出（testcase v2）
  - `?? docs/superpowers/specs/2026-10-21-skill-eval-harness-design.md` —— **不属于本 session**，本 session 从未触碰该路径
  - `?? docs/superpowers/specs/2026-10-21-skill-eval-harness-design-testcase.md` —— 同上
  - `.session/reviews/2026-10-21-183302-docgen-replace-intent-change/` 不进 git（`.session/` 已在 `.gitignore`）

## 过程记录

- `d:\Seed\retro-skills\.session\reviews\2026-10-21-183302-docgen-replace-intent-change\progress.md`（**先读尾部**：范围 / 轮次账 / 三段记录 / 复盘 / 最终结论）
- `d:\Seed\retro-skills\.session\reviews\2026-10-21-183302-docgen-replace-intent-change\problems.md`（**26 族台账**：F1–F26 的级别、原始卡、答辩结论、修法落点、终态；含「不改项与理由」「误报项」「弱项处置」）
- `d:\Seed\retro-skills\.session\reviews\2026-10-21-183302-docgen-replace-intent-change\cards.md`（六席原始卡核心内容 + 必须修项全文）
- `d:\Seed\retro-skills\.session\reviews\2026-10-21-183302-docgen-replace-intent-change\submission.md`（送审说明；§1 与 §6 含终态 SHA 与机器证据）
- 历史交接词：`docs/handoffs/2026-10-21-f1-sdet-desc-trigger.md` → 本文件（链式继任）

## 本次任务

按 spec §4 步 1–6 施工 docgen 写盘通路（迁移期 / 变更期分派 + 变更凭证 + 三项加固），并用首个真实变更（`senior-sdet` 的 description 删掉「评审测试策略」）端到端验收；流程：§4 步 1 改 `cli.mjs` → 步 2 改 `evidence.mjs` / `validateAgentData.mjs` / `init-evidence.mjs` / `golden-assert.mjs` → 步 3 补测试 → 步 4 跑 `npm run check` → 步 5 改数据 → `diff` → **给用户确认 diff** → 独立子代理重判 `A2` → `draft` → `replace --expect-change <凭证> --rejudge A2 --yes` → 步 6 再跑 `npm run check` + `git diff --numstat` → 步 7 账本留痕 → 步 8 留工作区；起点：**§4 步 1**（施工尚未开始，`cli.mjs` 仍是原样）。

## 范围依据

- **要读**（按顺序）：
  - spec `docs/superpowers/specs/2026-10-21-docgen-replace-intent-change-design.md`：R1–R9（§2）、§3.1 闸门矩阵 + 执行次序、§3.2 `diff` 契约（行数口径 / 中段行格式）、§3.3 错误码 + stderr 契约 + 参数白名单、§3.4 evidence schema（`changes` / `judged` / `machineChecks`）、§3.5 幂等与 state 次序、§3.6 重判触达映射（表 A / 表 B）、§3.7 首个使用者、§4 施工步骤、§5 验收 ①–⑧、§6 硬约束 1–8、§8 不在这一轮
  - testcase `docs/superpowers/specs/2026-10-21-docgen-replace-intent-change-design-testcase.md`：§1 覆盖总表（67 行）、§2 与 S4 的对应关系、§3.1–§3.8 八组用例、§4 缺口、§5 建议、§6 自检
  - 实现现状：`tools/docgen/cli.mjs` 的 `cmdReplace`（第 201–280 行）、`main()` 参数解析（第 300–330 行）、`collectGate()`（第 75–117 行）、`renderByName()`（第 288–298 行）；`tools/docgen/evidence.mjs`（`readEvidence` / `writeEvidence` / `fail()`）；`tools/docgen/components/validateAgentData.mjs` 的 `EXIT` 表（第 4–18 行）；`tools/docgen/state.mjs`；`tools/docgen/acceptance/init-evidence.mjs`；`tools/docgen/acceptance/golden-assert.mjs`；`tools/docgen/acceptance/replace-scenarios.mjs`（S1–S6）
  - 判据来源：`tools/execution-matrix/criteria.md`（A1–A7 / B/C 组判定对象）、`tools/execution-matrix/check-agent.mjs`（`SEMANTIC_KEYS` 10 键）
- **勿重做**：
  - spec 与 testcase 本身（已定稿；施工若发现 spec 有错，按议会流程另开一轮，不得直接改 testcase 判据）
  - 议会评审（已收口，账本见「过程记录」）
  - `docs/after/pending-work-overview.md` 的线 F 第 1 件描述（上一 session 已写成「路 B」全套步骤；本次只在 §4 步 7 改它的结案状态）

## 开放问题

1. 工作树里那组 `2026-10-21-skill-eval-harness-design.md` / `-testcase.md` 与本任务无关，如何处理？推断：**忽略**，不属于本 session（依据：本 session 从未读写该路径，`git status` 显示为独立未跟踪新增）；请用户：确认可忽略。
2. 施工改动 `agentData.mjs` 的 `when` 后，`tools/docgen/fixtures/senior-sdet.evidence.json` 要不要同步改？推断：**只追加 `changes[]`，不动六项锚点**（依据：spec R4 / R5 与 §3.4「迁移段成功不追加 changes；变更段成功追加一项」）；请用户：确认。

## 既定约束（不要重新讨论、不要重新选型）

- **禁止主动执行任何 git 写操作**（add / commit / push / rebase…），改动一律留工作区 —— 用户全局规则「全局 Git 写操作禁令」
- **testcase 必须由独立 `senior-sdet` 在全新上下文编写 / 修订**，spec 作者不得改写其判据；spec 与 testcase 必须一起送审 —— 用户全局规则「spec-testcase 硬门」
- **已定稿 spec 原文保留不改**，失效部分由新 spec 取代 —— 用户全局规则 `docs-convention`（本 spec §9 已按此声明取代 S4 的 R6 / R7）
- **变更凭证用机械哈希**：`--expect-change <sha256(渲染)>`，不做一次性票据 —— 用户 2026-10-21 裁决
- **三项加固全做**：迁移期工具阶段边界 / evidence 变更留痕 / 变更后重判受影响注解 —— 用户 2026-10-21 裁决
- **`gate` / `check-all` / 渲染器 / 模板 / `state` schema 一律不动** —— spec §6-3
- **禁止手打 `agents/*.md`**，一切内容来自 `draft` → `replace` —— spec §6-7

## 遗留裁决与留观项

- **spec §8 的六条不做项**：多基线/回滚、指纹式注解失效、B/C 组无机械校验、凭证一次性票据（`--issue`）、`suspended` 席变更通路、`DOCGEN_*` env 收紧（含「路径限 cwd 内」的中间态）、触达映射关键字单源、rule / skill 写盘通路 —— 来源：spec §8；收敛时机：后续里程碑，不在本次施工
- **线 F-3（14 席来源行统一）**：机制就绪后可走一次变更段，不再需要「重开基线」 —— 来源：`docs/after/pending-work-overview.md` 线 F-3；收敛时机：本次施工完成后
- **testcase 的 3 条弱项**（与 spec 节号撞名 / 幂等分支不校验凭证 / 触达映射与 `criteria.md` 坐标系差异） —— 来源：`.session/reviews/2026-10-21-183302-docgen-replace-intent-change/problems.md` §弱项处置；收敛时机：下次触碰 testcase 时

## 开工前先做

1. `git status --porcelain` 确认工作树与上文「工作树异常」一致；跑 `npm run check`，确认仍为 **470/470、fail 0、baseline 35/35、0 findings**（不一致先停下查原因，勿在漂移基线上施工）
2. 读 spec 的 §3.1（闸门矩阵 + 执行次序）与 §4（施工步骤），把「执行次序」逐环节抄成待办清单——它是本次施工最容易写错的地方
3. 读 testcase 的 §1 覆盖总表 + §3.1–§3.3 三组（迁移段 / 凭证 / `diff` 契约），确认每组判据能对上即将写的代码
4. 读 `tools/docgen/cli.mjs` 的 `cmdReplace`（201–280）与 `main()`（300–330），标出要改的四处：分段、参数白名单、执行次序、state 置位
5. 读 `.session/reviews/2026-10-21-183302-docgen-replace-intent-change/problems.md` 的 F1 / F2 / F7 三族——它们决定了 `changes` 的字段结构与注解 10 键的边界，写错会让 `check-all` 判红

## 开场话术

```text
读 docs/handoffs/2026-10-21-docgen-replace-intent-change-impl.md，按交接词继续：施工 docgen 写盘通路的迁移期/变更期分派（spec §4 步 1–6），并用 senior-sdet 的 description 改动做端到端验收。注意：先跑 npm run check 复核基线，且全程不执行任何 git 写操作。
```
