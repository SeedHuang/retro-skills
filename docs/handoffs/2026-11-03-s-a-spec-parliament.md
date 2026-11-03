# Session 交接：retro-skills → S-A spec 送议会评审（2026-11-03）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-11-03 07:33（Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `3fd348a9e4aa50f0455f694633b24470bbe6bd2d`（`docs: 新增 S-A 数据层设计及测试用例、R8 未决决议文档`）；工作树：**1 个未跟踪文件** `docs/handoffs/2026-11-03-s-a-spec-parliament.md`（= 本文档本身；`git status --short` 实查 07:33 时为 clean，落盘本文后多出这一条，由你决定是否 commit） |
| 验证基线 | `npm run check` → `# tests 1405 / # pass 1403 / # fail 0`、`④ markdown 检查通过（380 个文件 / 1608 张表）`、`⑤ .session 结构检查通过`、末行 `check 全部通过`（exit 0）——**07:33:33 实跑**（取数命令 `node skills/review-log/scripts/time.mjs` → `07:33:33`） |
| 继任自 | 无（本 session 首份交接；更早的 PRD 评审是同 session 内完成，无独立 handoff） |
| 状态 | 有 3 个开放问题（见「开放问题」节），**第 1 问是开工第一问** |

## 项目定位

`d:\Seed\retro-skills` —— 一套「规则 / 技能 / 角色卡生成器」仓库：`rules/` 与 `skills/` 写方法与判据，`tools/docgen/` 把组件数据渲染成 `agents/*.md` 15 张角色卡，`scripts/check-all.mjs` 是总门禁。

## 现状

- **已完成**：PRD「卡面数据契约与证据形式」四轮议会评审全部收口，交付审计终判**通过**（账本 `.session/reviews/2026-11-02-221257-card-data-contract-prd/delivery-audit.md` 结论段）；PRD 已追加 §9 Spec 路线图（`docs/prd/20261102212627-card-data-contract-and-proof/index.md:127-147`）；S-A 段 spec 与其 testcase 已落盘并随 HEAD 提交。
- 验证证据：见元信息表『验证基线』（单源，勿在此重复）。
- 提交状态：**已 commit**（hash 见元信息表『HEAD』）；该 commit 含 4 个文件（`git show --stat HEAD`：PRD 147 行、S-A spec 84 行、S-A testcase 463 行、`docs/after/20261102222831-r8-mtime-criterion-open-decisions.md` 26 行）。
- 工作树异常：无（clean）。
- **考古结论（"不存在"类断言）**：PRD 在 git 历史里**只有一次提交**（`git log --oneline -- docs/prd/20261102212627-card-data-contract-and-proof/` 仅 `3fd348a` 一行）。故 r1 的 91 行版、r2 的 115/120 行版、r3 的 122/123 行版**在 git 中不存在**——它们只以「哈希 + 行数」记在评审账本 `submission.md` §6「基线历史」行（该串哈希已无法由任何现存文件复现，回溯只能靠 `problems.md` 的 F/G/H 族表与 `cards.md` 的 47 张卡）。

## 过程记录

- 评审账本目录（**未进 git**，`.session/` 在 `.gitignore` 里）：`.session/reviews/2026-11-02-221257-card-data-contract-prd/`
  - `progress.md`（**先读尾部**：轮次表 r1–r4 + §6 交付审计 + §7 结论）
  - `delivery-audit.md`（终判「通过」+ 6 条不阻断候选）
  - `round-check.md`（r1 首检 + r2/r3/r4 三节 + 4 次复核）
  - `problems.md`（r1 族表 F1–F10、r2 G1–G17、r3 H1–H12、r4 收口、升级说明、各轮终态桶）
  - `cards.md`（47 张卡：r1 32 + 八字段补录 + r2 12 + r3 3）
  - `detective.md`（侦探 r1–r4 四节）
  - `submission.md`（送审说明 + 基线历史）
- 历史交接词：无

## 本次任务

把 **S-A spec + 其 testcase** 送议会做 ② 段（技术设计）评审，过则进 `writing-plans` 出 plan；流程：**② 段议会评审（spec + testcase 作为一件交付物）→ 修 → 复核 → 计划门 → ③ 实现**；起点：**② 段评审送审**（PRD 的 ① 段已闭环，勿重做）。

## 范围依据

- 要读（送审前必读，按顺序）：
  1. `docs/prd/20261102212627-card-data-contract-and-proof/index.md` §9 路线图（`:127-147`）→ 确认 S-A 的边界与验收锚点
  2. 同文件 §8 S-A 行（`:119`）→ 前置：§5 的 `SCAN_FIELDS` 行（`:86`）、`S1-TC-G09` 行（`:87`）、`policy/**` 行（`:89`）须已在 ② 段签收
  3. 同文件 §2 D12（`:39`）/ D16（`:43`）/ D17（`:44`），§3 Q5（`:54`）/ Q7（`:57`）/ Q8（`:58`），§4 V4（`:66`）/ V5（`:67`）/ V10（`:72`）/ V11（`:73`）/ V12（`:74`）
  4. `docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md` §10.1（R1–R9）+ §10.2（D-a…D-d 四条约口径）+ §10.4 硬约束
  5. `docs/superpowers/specs/2026-11-03-s-a-data-layer-design-testcase.md`（29 条：正 10 / 负 10 / 边界 9）
- 勿重做：PRD 的 ① 段评审（账本 `delivery-audit.md` 已判通过）、`docs/agent/` 生成物（`agents/*.md` 是生成物，见 PRD §6 最后一条）。

## 开放问题

1. **S-A spec 是否现在就送议会？**（**开工第一问**）；推断：**送**——依据是 spec 与 testcase 已齐（`spec-testcase-gate` 五条判据的 1/3/4 已满足，第 2 条由 `senior-sdet` 独立编写满足）、且 §8 的 S-A 前置（§5 三行 ② 段签收）只能由议会执行；请用户：确认 / 纠正。
2. **S-B / S-C 是否同时写？**；推断：**先不写**——依据是 PRD §9 依赖图 `S-A → S-B → S-C`，且 S-B 的前置写「S-A」、S-C 的前置写「S-A、S-B」；现在写会在 S-A 评审改 `@` 语法或 `when` 注入方式后返工；请用户：确认 / 纠正。
3. **评审账本是否迁进 git？**；推断：**迁到 `docs/superpowers/reviews/2026-11-02-221257-card-data-contract-prd/`**——依据是 `docs` 目录规则「审查完 → 整目录迁 `docs/superpowers/reviews/`（进 git），再删 `.session/` 副本」，且 `.session/` 不进 git、换机器即失；请用户：确认 / 纠正。

## 既定约束（不要重新讨论、不要重新选型）

- 三态**不新增逐项字段**：唯一判定面 = `tools/observation-check/checks.mjs:92-99`，卡面表头一行由 `VERDICTS` 派生 —— 出处：PRD `:43`（D16）；r3/r4 五席反复确认过。
- `when` 唯一源 = `triggerTable.when`，`duty.trigger` **一律装配期注入**（不取删除分支）—— 出处：PRD `:44`（D17）+ `:81`（§5）。
- `duty.trigger` **保留字段名**、字面清空、装配期赋值 —— 出处：`docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md` §10.2 D-a。
- `@` 只允许**单层**引用，不支持嵌套 —— 同 spec §10.2 D-b。
- `shared.json` 只收「15 席里逐字重复 ≥2 次」的片段 —— 同 spec §10.2 D-d。
- 三段顺序 `S-A → S-B → S-C`，每段独立验收 + 独立回退 —— 出处：PRD §8（`:112-121`）+ §9 依赖图（`:131`）。
- `baseline 38/38` **不作判据**（同一表达式自除自，恒真）—— 出处：PRD §5（`:88`）+ 已签 S3 spec `D-15`。
- `V7`「token 降幅」已**撤出验收表**、降为观测项不设红点 —— 出处：PRD `:76`（观测项段）+ `problems.md` r4 H5 行。
- testcase 必须由 `senior-sdet` 在**全新上下文**编写，spec 作者不得改写其判据 —— 出处：`spec-testcase-gate` 规则判据 2。
- 15 卡是生成物，任何卡面改动走 `draft` → 对照 → `replace --yes` —— 出处：PRD §6（`:95`）。
- 路径约定：`components/**`、`policy/**`、`templates/**` 相对 `tools/docgen/`；`enums.mjs`、`validateCardModel.mjs` 相对 `tools/docgen/card-model/` —— 出处：PRD `:7`。

## 遗留裁决与留观项

- `V7` 现承担「映射用例非空心」（`check-case-assert.mjs` → `hollow 0`），但仓内尚无脚本 —— 来源：`problems.md` r4 H5 行 + `cards.md` r2 的 N-3；收敛时机：**S-B**（S-B outline 第 ⑤ 项）。
- `check-plan.mjs map` 的空心用例判据尚未实现（PRD `:64` 已把该判据指到 V7） —— 来源：r4 审计「V2 后半须写进脚本」；收敛时机：S-B。
- 6 条不阻断候选（例：`cards.md:67` 的卡号计数正则漏 `Q-` 前缀） —— 来源：`delivery-audit.md`「不阻断候选」段；收敛时机：下次触碰该账本时。
- 观测项基线（逐席 `## 本席清单` 段字符和 245–522、判据列 65–136）—— 来源：PRD `:76`/`:123`；收敛时机：S-B 开工时若要量化篇幅，需在 S-B spec 里重定义判据。

## 开工前先做

1. `git status --short`（应无输出）+ `npm run check`（记下 `# tests` 与末行；本交接基线 1405/0）——确认工作树与门禁没漂。
2. 读 `docs/prd/20261102212627-card-data-contract-and-proof/index.md` 的 `:127-147`（§9 路线图）与 `:119`（§8 S-A 行）。
3. 读 `docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md` §10.1 / §10.2 / §10.4，重点核对 R3（`when` 注入）与 R4（两处扫描面）是否与你对代码的理解一致（`tools/docgen/components/agentData.mjs:123`、`:294-295`、`:307`）。
4. 按你的确认（开放问题 3）把 `.session/reviews/2026-11-02-221257-card-data-contract-prd/` 整目录复制到 `docs/superpowers/reviews/` 后再删 `.session/` 副本（`docs` 目录规则的归档要求）。
5. 送审时按 `parliament` 的流程：文档类型 = spec（必带 testcase），送审说明里「开卷清单」至少列 PRD §9/§5/§4 与 S-A spec 全文；账本另立 `docs/superpowers/reviews/<本次>/`（不要复用 PRD 那轮的账本）。

## 开场话术

读 `docs/handoffs/2026-11-03-s-a-spec-parliament.md`，按交接词继续：把 S-A spec + testcase 送议会做 ② 段评审；注意先答开工第一问（是否现在送审）。
