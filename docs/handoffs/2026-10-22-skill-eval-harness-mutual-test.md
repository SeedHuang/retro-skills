# Session 交接：retro-skills → skill-eval-harness 互测 + 第 9 轮（2026-10-22）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-22 21:32（Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `65b2702`；工作树：未提交（M: `docs/after/20261017210609-pending-work-overview.md`、两份 skill-eval-harness 文档；?? `docs/after/20261022113509-skill-eval-harness-open-decisions.md`、`docs/handoffs/2026-10-22-skill-eval-harness-round{4,7}.md`、`evals/`） |
| 验证基线 | `node scripts/check-all.mjs`：tests **493/493**、baseline **35/35**、**0 findings**、markdown 239 文件/816 表、check 全部通过（**21:31 实跑**）；spec **338 行** sha256 前 8 位 `8F704B04`；testcase **1033 行** `7ECCF84A`（21:31 实跑） |
| 继任自 | `docs/handoffs/2026-10-22-skill-eval-harness-round7.md` |
| 状态 | 有 3 个开放问题（见「开放问题」）；**互测未跑、第 9 轮未开、A1 未施工** |

## 项目定位

`d:\Seed\retro-skills` —— 沉淀 retro（复盘）/ rule / skill 体系的仓库；本任务是把 skill-up 的技能评测工装本地化，先只做 `review-triage` 一个技能。

## 现状

- 已完成：第 7、8 轮议会并修复；第 8 轮 4 个 P0（G1 退出码来源 / G2 probe 码位 / G3 anchors 残留 / G4 02 理由词）已修；QA-8C 的 5 条中 QA-8C-02/03/04 已落地（spec §4 步骤 0 顺序、TC-051 桩形状、R10 绑定断言集）。
- 验证证据：见元信息表『验证基线』（单源，勿重复）。
- 提交状态：**全部未提交，由用户自行 commit**（用户明令不得自动 commit）。
- 工作树异常：**spec/testcase 状态已从「已定稿」回退为「定稿候选」**——因 QA 指出「主持人事后改判据并反转本轮判定」程序不合规（`problems.md` 第 8 轮段；QA-8C）。
- 关键新规矩（用户 2026-10-23 指定，试行）：**主 Agent ↔ SDET 互测先于送审**——SDET 攻 spec 的盲区/悖论/不闭环；主 Agent 攻 testcase 是否与需求相符；双方在产出物上一致并双签 `clarify.md`，才可提交议会。长期要落成 skill（见 `docs/after/20261017210609-pending-work-overview.md` 线 I）。
- `evals/` 现状：仅有 `evals/review-triage/fixtures/responses/`（**7 个文件**，含 `flaky-evidence/`），`eval.yaml` / `expected.md` / `cases/` / `oracles/` 均未建。

## 过程记录

- `.session/reviews/2026-10-22-093735-skill-eval-harness/progress.md`（先读尾部：轮次账第 8 行）
- 同目录 `problems.md`（第 8 轮段 + **§二 带往清单 14 条**）、`cards.md`、`submission.md`（§4 判据与程序规则）、`round-check.md`、`clarify.md`（互测账本，**空模板待填**）、`a1-assertions.md`（A1 41+6 条断言，**仅清单无代码**）
- `docs/after/20261022113509-skill-eval-harness-open-decisions.md`（本项目未决入口 + 互测待办）
- `docs/after/20261017210609-pending-work-overview.md` 线 I（互测沉淀为 skill 的待办）
- 历史交接词：`...-round4.md` → `...-round7.md` → 本份

## 本次任务

先跑「主 Agent ↔ SDET 互测」并双签，再开第 9 轮议会，然后按修正后的 spec 施工 A1 脚本与 `evals/`。

流程：互测（可多轮）→ 修产物 → 双方确认双签 `clarify.md` → 用户说「开第 9 轮」→ 议会 → 定稿 → 施工 A1（`scripts/check-eval-contract.mjs`）→ 建 `evals/review-triage/` 用例与 oracle。起点：**互测第 1 轮**。

## 范围依据

- 要读：`docs/superpowers/specs/2026-10-21-skill-eval-harness-design.md` §1（影响面）、§3.2.2（机读块 ①–⑦）、§3.3（三层判据 + 退出码）、§4（施工步骤）、§5（验收九条）、R1–R10；`...-design-testcase.md` 覆盖总表 + TC-029/036/051/061/022；`.session/reviews/.../clarify.md`、`a1-assertions.md`、`submission.md` §4。
- 勿重做：第 8 轮 4 个 P0 的修复；QA-8C-02/03/04 的三处改动（已改）。

## 开放问题

1. **是否现在就跑互测？** 推断：是（用户原话「这次先试行一下」）；做法：派全新上下文 `senior-sdet` 只攻 spec，主 Agent 并行攻 testcase，结果落 `clarify.md`。（开工第一问）
2. **A1 是否纳入 spec 影响面？** 推断：不纳入，`node` 直接跑、不加 npm script，保 spec §5③「package.json 仅新增一条 script」成立（QA-8C-01 的化解方式）。请确认或纠正。
3. **第 9 轮用哪版判据？** 推断：`submission.md` §4 新版（P0 两类 + 阻断项 ≤5 + 每席必须修 ≤3），且第 8 轮原判「不通过」保留不改（QA-8C 程序意见）。请确认。

## 既定约束（不要重新讨论）

- 不自动 commit / push —— 用户全局规则 + 本次明令。
- 开第 N 轮须用户明确说「开第 N 轮」——用户 2026-10-22 指令。
- 判据只在开评前冻结；冻结后变更需测试+审计双签；已出结果轮次原 verdict 不改 —— `submission.md` §4（QA-8C 追加）。
- P0 只算两类（同场景两处互斥 / 必需字段或入口无产生方式）—— 同上。
- 互测先于送审，缺 `clarify.md` 双签不得提交议会 —— `docs/after/20261017210609-pending-work-overview.md` 线 I。
- testcase 由独立 SDET 编写、非 spec 作者 —— 用户全局规则。
- 端到端零依赖、不引新依赖、不改外部二进制 —— spec §1/§5。

## 遗留裁决与留观项

- **带往 14 条**（P2 与超时/n>2 行为用例）—— 来源：`problems.md` §二；收敛时机：第 9 轮或施工时。
- **B1–B6 六条 spec 实质修复未做**：`arms` 下界未在运行层判定、L2 承诺只到「可满足」、数据完整度无阈值、delta 粒度未声明（n=2 时 rate ∈ {0,.5,1}）、n>2 无行为用例、fixture 物化路径语义 —— 来源：`a1-assertions.md` 末尾 + 本对话第 8 轮；收敛时机：第 9 轮。
- **5 条 TC 扩写**（TC-029 arms 下界 / TC-036 n=3 / TC-061 oracle 独立性 / TC-022 仓库内 `.git` / TC-051 已改）—— 来源：QA-8C Q2；收敛时机：第 9 轮。
- `assert_hash` 算法与生成入口、`judge` 书写形态、fixture `.git` 入库形态 —— 已在 spec 写死，但**无脚本验**；收敛时机：A1 施工。

## 开工前先做

1. `git status --short` + `node scripts/check-all.mjs`，确认仍是 **493/493、0 findings**（基线复核）；再核 spec/testcase 行数是否为 338 / 1033。
2. 读 `.session/reviews/2026-10-22-093735-skill-eval-harness/clarify.md` 与 `a1-assertions.md`；读 `submission.md` §4 的判据与程序规则。
3. 派 `senior-sdet`（全新上下文，不给它结论）攻 spec 的盲区/悖论/不闭环；同时主 Agent 逐条核 68 条 testcase 与 spec R/§ 的相符性。
4. 结果写入 `clarify.md`（含证据与处置），修产物后再走第 2 轮，直到双方确认；**双签后才可请用户开第 9 轮**。

## 开场话术

读 docs/handoffs/2026-10-22-skill-eval-harness-mutual-test.md，按交接词继续：先跑主 Agent ↔ SDET 互测并双签，再等我明确说「开第 9 轮」。注意：不要自动 commit。
