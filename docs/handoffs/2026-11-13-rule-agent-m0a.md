# Session 交接：retro-skills → rule/agent 拉齐 M0a 基线（2026-11-13）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-11-13 18:08（Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `c52528e699cf55cbfa3c52b3b7c96633e2b9d472`；工作树：5 个已跟踪文件 `M` + 1 个未跟踪 plan（逐项见「现状」） |
| 验证基线 | typecheck 无（纯 ESM，无 tsc）+ build 无（无构建步骤）+ unit 779/779（pass 777 + skipped 2）+ e2e 无；另：agents 18/18、baseline 19/19、markdown 574 文件 / 2445 表、判据 5 条 / 绿 34 / 红 0（18:08 实跑，`check 全部通过`）；`size: spec 304/350 tc 62/80 rounds 3/3 => ok` |
| 继任自 | `docs/handoffs/2026-11-13-rule-agent-prd-review.md` |
| 状态 | 可直开工（仅 Task 1）；Task 2 起有 1 个授权前置（见「开放问题」） |

## 项目定位

`d:\Seed\retro-skills` —— 规则 / 技能 / agent 卡与文档生成工具的仓库；本任务把 rule 与 agent 两套文档投影收敛到一套共享块渲染、RuleModel 校验与统一基线。

## 现状

- 已完成：
  - PRD v0.5.1 过 4 轮三方评审（P0=0）：`docs/prd/20261113160000-rule-agent-render-alignment.md`。
  - spec 304 行、testcase 59 条；spec 作者与 testcase 作者互审 3 轮 PASS：`docs/superpowers/specs/2026-11-13-rule-agent-render-alignment-design.md`、同目录 `-testcase.md`、`-testcase-diff.md`。
  - 议会 #2 第 6 轮通过（SD 8/8、AU 7/7，P0=0/P1=0）：`.session/reviews/2026-11-13-163047-spec-testcase-parliament/progress.md:118-139`；签字结论见 `docs/devworkflows/20261113161413-rule-agent-render-alignment/gate-record.md:13`。
  - plan 1301 行已写：`docs/superpowers/plans/2026-11-13-rule-agent-render-alignment.md`。
- 验证证据：见元信息表「验证基线」（单源）。
- 提交状态：未提交；5 个 `M` + 1 个 `??`，由用户决定是否 commit（本次未执行 commit）。
- 工作树异常（`git status --porcelain` 实查）：
  - `M docs/devworkflows/20261113161413-rule-agent-render-alignment/gate-record.md`
  - `M docs/devworkflows/20261113161413-rule-agent-render-alignment/mutual-review.md`
  - `M docs/superpowers/specs/2026-11-13-rule-agent-render-alignment-design-testcase-diff.md`
  - `M docs/superpowers/specs/2026-11-13-rule-agent-render-alignment-design-testcase.md`
  - `M docs/superpowers/specs/2026-11-13-rule-agent-render-alignment-design.md`
  - `?? docs/superpowers/plans/2026-11-13-rule-agent-render-alignment.md`
  - `tmp/rule-json-probe.json` 已删除（本次探针残留）。

## 过程记录

- `.session/reviews/2026-11-13-163047-spec-testcase-parliament/progress.md`（先读尾部 110–140 行）
- 同目录 `problems.md`（第 6 轮 235–246 行）
- 同目录 `cards.md`（第 6 轮 354–360 行）
- `docs/devworkflows/20261113161413-rule-agent-render-alignment/gate-record.md`（② 第 6 轮行 13；D19 节 15–23 行）
- `docs/devworkflows/20261113161413-rule-agent-render-alignment/mutual-review.md`
- 历史交接词链：`docs/handoffs/2026-11-13-rule-agent-prd-review.md` → `docs/handoffs/2026-11-13-rule-agent-m0a.md`

## 本次任务

执行 plan 的 Task 1（M0a 只读基线）；流程：Task 0 D19 门 → Task 1 M0a → Task 2–10（需 D19）→ Task 11 M0b；起点：Task 1（Task 0 只需读一次，当前已知未授权）。

## 范围依据

- 要读：
  - `docs/superpowers/plans/2026-11-13-rule-agent-render-alignment.md` 的 `## Task 0`（55–77 行）与 `## Task 1`（78–257 行）。
  - `docs/superpowers/specs/2026-11-13-rule-agent-render-alignment-design.md` 的 §5.3（164–183 行）与 §6.1（184 行起）。
  - `docs/devworkflows/20261113161413-rule-agent-render-alignment/gate-record.md:15-23`（D19 授权节）。
  - `.session/reviews/2026-11-13-163047-spec-testcase-parliament/progress.md:110-140`（第 6 轮收口）。
- 勿重做：
  - PRD / spec / testcase / 评审账 / plan 均已定稿，**不要重开议会、不要改 spec/testcase**。
  - `tools/docgen/**` 代码在 Task 2 起才动，且需 D19 授权；Task 1 只新建 `scripts/rule-baseline.mjs` 与测试。

## 开放问题

1. **开工第一问：工作树 5 个 `M` 是否先 commit？** 推断：先把 spec/testcase/gate-record/mutual-review/diff 这批判定文档提交，再开 Task 1；依据：plan Task 1 的 `scripts/rule-baseline.mjs` 前置是 `git status --porcelain --untracked-files=no` 为空，当前 5 个 `M` 会让它直接 `exit 2`。请用户：确认提交 / 或授权改用其它前置口径。
2. D19 何时重启？推断：先只做 Task 1（M0a 只读，不改被跟踪件）；Task 2 起等用户明确说「重启 D19」；依据：`gate-record.md:15-23` 仍「未获授权（2026-11-13）」，plan Task 0。请用户：确认 / 纠正。

## 既定约束（不要重新讨论、不要重新选型）

- 18 份 `agents/*.md` 与 5 份 `tools/docgen/builders/rules/*.md` 逐字节不变 —— spec §3 / §6。
- 不改 rule 文案、不改评分口径、不激活 dormant、不新增 `rules/*.md` 投影 —— PRD §3 非目标。
- 共享 IR 首期只含 `h1/h2/h3/para/notes/bullets/ordered/blank/raw`，不做 table / 转义 —— spec §2-D2。
- D19 未授权不得执行 Task 2 起 —— `gate-record.md:15-23`；spec §6.1。
- 评审规则：谁提出问题谁 review，未提问题者视为通过 —— `progress.md:24`（用户 2026-11-13 指令）。
- 所有测试夹具落 `tmp/` —— spec §6 / plan 全局约束。
- M4 四维另立 PRD —— spec §11。

## 遗留裁决与留观项

- 第 4、5 轮时间标「未取数」—— 来源：`progress.md:20-23`；收敛时机：不补造，后续轮次当轮跑 `scs time`。
- 第 5 轮 SD/AU 的 15 张自有卡已复核闭环 —— 来源：`problems.md:235-246`；无需再动。
- `gate-record.md:10-12` 是历史「不过」行，最新结论看第 13 行 —— 来源：`gate-record.md`；收敛时机：Task 10 写 ③ 时保留历史行。

## 开工前先做

1. `git status --porcelain`；确认 5 `M` + 1 `??`；先决定是否提交（Task 1 前置要求被跟踪树干净）。
2. 读 `docs/devworkflows/20261113161413-rule-agent-render-alignment/gate-record.md:15-23`，确认仍「未获授权」。
3. 读 plan `## Task 0` 与 `## Task 1`（55–257 行），按 Step 1–7 执行；不要越过 Task 1。
4. 实跑 `npm run check` 复核元信息表基线；数字不一致先停下。
5. 确认 `tmp/rule-json-probe.json` 已不存在（已删除）。

## 开场话术

读 `docs/handoffs/2026-11-13-rule-agent-m0a.md`，按交接词继续：先确认工作树与 D19，再执行 plan 的 Task 1（M0a 只读基线）；Task 2 起不要动。
