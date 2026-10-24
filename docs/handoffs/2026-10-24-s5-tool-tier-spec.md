# Session 交接：retro-skills → S5 工具档位 spec（2026-10-24）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-24 18:26（本机时区） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `e4518c6`；工作树：**clean**（`git status --porcelain` 0 行） |
| 验证基线 | 无 typecheck / build（纯文档 + 脚本仓）；`npm run check` = **608 tests / 606 pass / 0 fail / 2 skipped**、`baseline 37/37`、15 席覆盖、`0 findings`、`④ 260 文件 / 1030 表`、`check 全部通过`（18:26 实跑） |
| 继任自 | `docs/handoffs/2026-10-24-dev-workflow-s1-execute.md` |
| 状态 | 有 1 个开放问题（见「开放问题」Q1） |

## 项目定位

`d:\Seed\retro-skills` —— 面向 AI 编码的规范仓库（`rules/` 条文 + `skills/` 流程 + `agents/` 角色卡 + `tools/docgen/` 生成器 + `skills/parliament/` 议会评审）；本 session 把「开发工作流主干 PRD」送议会 #1 并定稿。

## 现状

- 已完成：
  - PRD 定稿（有条件通过）：`docs/prd/20261024073606-dev-workflow-mainline/index.md:3` 头部状态 = 「定稿（有条件通过，2026-10-24；议会 #1 四轮 + 两次补充复核，P0/P1 = 0）」。
  - ① 段出口签字：`skills/dev-workflow/references/gate-record.md:12` 有 ① 行（申报人 = 产品经理代拟 / 签字人 = 用户 / 结论 = 有条件通过）。
  - 议会 #1 账本：`.session/reviews/2026-10-24-163717-dev-workflow-mainline-prd/`（submission / cards / problems / progress / detective / round-check；**不进 git**）。
  - 三轮后仍继续的规则：PRD §5.1（`index.md:364`）= 3 轮后仍有 P0/P1 → 升级用户、评审继续，直到 P0=0 且 P1=0；P2 挂 `docs/after/`。
  - `command` 档已落地（S5 部分完成）：`tools/docgen/components/patternRegistry.mjs:10` 的 `BOUNDARY_COMMAND` 是「默认拒绝」白名单；`agentData.mjs` 挂给 `reviewer-audit` / `detective-observer`；两张卡已由 docgen 生成（`draft → replace`），`aas sync` 需建链接 0。
  - 侦探越权检测闭环：`skills/parliament/assets/progress.md` 段二有轮初/轮末快照 + reflog 补检；`skills/parliament/references/debate-protocol.md:30` 侦探表含第 4 类「工具越权」。
  - 老账清理：`docs/after/20261017210609-pending-work-overview.md` 已瘦身（只留线 B/D/F/I）；`docs/after/20261024174253-dev-workflow-mainline-open-items.md` 记 A/B 组 + 线 B/D/F。
- 验证证据：见元信息表『验证基线』（单源）。
- 提交状态：已 commit（HEAD `e4518c6`，工作树 clean）。
- 工作树异常：无。

## 过程记录

- 议会 #1 账本：`.session/reviews/2026-10-24-163717-dev-workflow-mainline-prd/progress.md`（先读尾部「轮次账」与「最终结论」）；同目录 `problems.md`（1–4 轮族级台账）、`cards.md`（第 1/2/3 轮卡）、`detective.md`、`round-check.md`。
- 挂账：`docs/after/20261024174253-dev-workflow-mainline-open-items.md`（B 组：`producer`/`research` 未开工、F-22 收尾、档位名表硬编码；存量线 B/D/F）。
- 历史交接词：`docs/handoffs/2026-10-24-mainline-prd-s1.md` → `docs/handoffs/2026-10-24-dev-workflow-s1-execute.md` → 本份。

## 本次任务

为 **S5 工具档位剩余部分**（`producer` / `research`）写 spec + 独立 testcase 并送议会 #2；流程：读 PRD §9/§12 → 写 spec（`docs/superpowers/specs/2026-10-25-s5-tool-tiers-design.md`）→ 同批由 `senior-sdet` 在全新上下文写 testcase（`…-testcase.md`）→ 互测/自检 → 送议会 #2；起点：**写 spec 前的范围确认（开放问题 Q1）**。

## 范围依据

- 要读：
  - `docs/prd/20261024073606-dev-workflow-mainline/index.md` §9（工具档位缺口、§9.1 平台能力实查）、§12（S5 行与过渡期四条）、§13 V-1～V-9。
  - `tools/docgen/components/patternRegistry.mjs:21-36`（现有三档 + `BOUNDARY_COMMAND`）、`validateAgentData.mjs:40-46`（按席分档）、`agentData.mjs:262`（按名分派）。
  - `rules/spec-testcase-gate.md`（spec+testcase 五条判据）、`rules/dev-workflow-mainline.md`（R1–R7）、`skills/dev-workflow/references/gate-record.md`（① 行示例）。
  - `docs/superpowers/specs/2026-10-24-dev-workflow-skeleton-design.md` §7.1 / §11（生成器改动与施工顺序的既有先例）。
- 勿重做：`command` 档（已落地，含边界重写、卡重生成、aas sync）；`docs/dev-workflow` 主干条文；PRD 正文（已定稿，改动需按 §7.2 回流）；`docs/after/` 里的存量线 B/D/F。

## 开放问题

1. **下一份先做 S5 还是 S3？** 推断：**先 S5**——依据 `index.md:232`（议长 A 依赖 `producer` 档）、`:689`（S5 部分完成、producer 未开工）、`:686`（S3 依赖 S5）；S5 不先到位，S3 的 spec 会写成跑不起来的方案。请用户：确认（S5）/ 纠正（先 S3）。

## 既定约束（不要重新讨论、不要重新选型）

- `producer` = readOnly + Write + Edit + RunCommand，**整档授予**，不假装有参数级白名单 —— `index.md:607-613`（D-14 实查结论）。
- 「禁写」靠角色卡允许清单 + 侦探 `git status` 快照事后检测，不造平台权限层 —— `index.md:613`。
- `research` = readOnly + WebSearch + WebFetch，**只给市场同学** —— `index.md:589`。
- 新角色/角色改动必须走 docgen：`draft → replace`，禁手改 `agents/*.md` —— `skills/parliament/SKILL.md:15`。
- spec 与 testcase 一件交付、testcase 由 `senior-sdet` 独立写、spec 只外链不内联 —— `rules/spec-testcase-gate.md`。
- 3 轮后仍有 P0/P1 不停止，升级用户后继续 —— `index.md:364`。
- 不擅自 commit；改动留工作区待用户处置 —— 用户全局规则（`rules/no-git-write.md`）。

## 遗留裁决与留观项

- `git status/diff` 会刷新 `.git/index` stat，可能让侦探误报「非预期变更」；AI 建议加 `--no-optional-locks` —— 来源：议会 #1 第 7 轮 AI 签字附注；收敛时机：S5 写白名单时一并定。
- 档位名表两处硬编码（`agentData.mjs:262` 与 `validateAgentData.mjs:42-44`）—— 来源：`docs/after/…open-items.md` B 组；收敛时机：S5 收口收进 `patternRegistry.tierBySeat`。
- F-22 的正文解释验收已加 V-9，但 F-22 的 S 列仍是 S2 —— 来源：`index.md:717`；收敛时机：S2 spec。
- 线 I（送审前互测 skill）已决定**不记账、不做** —— 来源：用户 2026-10-24 口头指示。

## 开工前先做

1. `git status --porcelain`（应 clean）+ `npm run check`（应 608/606/0 fail、`baseline 37/37`）；与元信息表基线核对。
2. 读 `docs/prd/20261024073606-dev-workflow-mainline/index.md` §9（`:569-616`）与 §12（`:681-725`），确认 S5 范围只剩 `producer` / `research`。
3. 读 `tools/docgen/components/patternRegistry.mjs:21-36` 与 `validateAgentData.mjs:40-46`，确定 `producer` / `research` 两个新档的允许集与按席分派写法。
4. 读 `rules/spec-testcase-gate.md` 五条判据，再开 spec 文件；spec 落 `docs/superpowers/specs/2026-10-25-s5-tool-tiers-design.md`。
5. 派 `senior-sdet`（全新上下文）写同批 testcase；spec 内只写「测试用例文件：…」外链。

## 开场话术

读 `docs/handoffs/2026-10-24-s5-tool-tier-spec.md`，按交接词继续：为 S5 工具档位剩余部分（`producer` / `research`）写 spec + 独立 testcase 并送议会 #2。注意：先确认开放问题 Q1（S5 优先还是 S3 优先）。
