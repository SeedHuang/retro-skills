# 出口签字账

> 任务：rule 与 agent 文档体系拉齐｜PRD：`docs/prd/20261113160000-rule-agent-render-alignment.md` v0.5.1｜spec：`docs/superpowers/specs/2026-11-13-rule-agent-render-alignment-design.md`｜testcase：`docs/superpowers/specs/2026-11-13-rule-agent-render-alignment-design-testcase.md`｜plan：`docs/superpowers/plans/2026-11-13-rule-agent-render-alignment.md`（1301 行）

## 出口签字表

| 段 | 出口判据（逐条） | 核了什么（命令输出首行 或 path:line） | 申报人 | 签字人 | 结论 |
|---|---|---|---|---|---|
| ① | §0 四栏（问题/用户/依据/边界）齐；F1–F6 与 §0.1 流程图双向差集为空；每 F 有验收判据；非目标含假设 | `docs/prd/20261113160000-rule-agent-render-alignment.md:9-16`、`:18-23`、`:39-44`、`:46-55` | 主 agent（代拟） | 用户 | 过（2026-11-13 指令“开始写spec 和 testcase”；4 轮三方评审 P0=0） |
| ② | spec + testcase 一件齐；互审 3 轮一致；议会 #2 第 3 轮 P0=0，4 组 P1 待清零 | `size:spec 258/350 tc 62/80=>ok`；`.../parliament/cards.md:218-260`；`.../problems.md:101-140` | 主 agent、senior-sdet | 审计 | 不过（P1 待清零） |
| ②@议会#2-第4轮 | 第 3 轮 4 组修 3 组闭环；第 4 轮 P0=1（TC-20 `tc` 未定义），7 组 P1 已修待复核 | `size: spec 304/350 tc 62/80 rounds 3/3 => ok`；`.session/reviews/2026-11-13-163047-spec-testcase-parliament/cards.md:264-326`；同目录 `problems.md:140-182` | 主 agent、senior-sdet | 审计 | 不过（P0/P1 待清零） |
| ②@议会#2-第5轮 | 第 5 轮 SD/AU 复核：7 组 P1 落点齐，validate 与 gate-record 闭环；TC-20 仍不可执行（P0=1） | `size: spec 304/350 tc 62/80 rounds 3/3 => ok`；`.session/reviews/2026-11-13-163047-spec-testcase-parliament/cards.md:328-352`；同目录 `problems.md:140-198` | 主 agent、senior-sdet | 审计 | 不过（P0 待清零） |
| ②@议会#2-第6轮 | 按用户“谁提问题谁 review”规则：SD 8/8、AU 7/7 自有卡闭环；RD/BE 自动 PASS；P0=0、P1=0 | `size: spec 304/350 tc 62/80 rounds 3/3 => ok`；`.session/reviews/2026-11-13-163047-spec-testcase-parliament/cards.md:354-360`；同目录 `problems.md:235-246` | 主 agent、senior-sdet、reviewer-audit | 审计 | **过（2026-11-13；P0=0，P1=0）** |
| ③ | 5 份 rule 与 18 席逐字节不变；共享引擎被两侧消费（`renderDoc` 仅 3 处）；RuleModel 负例齐；CLI/baseline 派生完成 | `node tools/docgen/builders/agents/cli.mjs gate` → `agents 18/18`、`baseline 19/19`；`npm run check` → `check 全部通过`；`tools/docgen/render/render.test.mjs` 5/5；`scs check rules` → `13 行 / 205 字符 / 57%`（= M0a 13/23）；TC：§6.2 / §4 / §5 / §6.5 全过 | 主 agent（实跑） | 审计（reviewer-audit） | 过（2026-11-13 审计复核；TC-04 口径差转待裁决） |

### ③ 证据附件（2026-11-13，供审计复算）

- `rg -n "renderDoc" tools/docgen --glob "*.mjs" --glob "!*.test.mjs"` → 3 处（`interpreters.mjs:10` 定义、`:31` / `:37` 两处 `render:`）。与 plan Task 10 Step 3「只 3 处」一致；与 testcase TC-04「命中行数 = 0」不一致 → 口径差登记，未擅自改 code / spec / testcase。
- 删引擎负例（`tmp/` 冷仓副本删 `tools/docgen/render/index.mjs` 后跑 `node scripts/check-all.mjs`）→ 退出码 1，`ERR_MODULE_NOT_FOUND ... tools\docgen\render\index.mjs`；副本删除、原仓复原后 `npm run check` → `check 全部通过`。
- `git diff --name-only ae7a627..HEAD -- agents tools/docgen/models/rules` → 空：`agents/*.md` 与 5 份判据 json 自 M0a 前零改动，故 TC-02 的 18 席 sha256、TC-59 的 5 份 `title` / `assert[].label` 快照逐项不变。
- TC 映射（spec §8 全表）：§6.1→TC-40–45、51–53（Task 1/11）；§6.2→TC-01–09、TC-44；§6.3/§4→TC-10–21；§6.4/§5.1→TC-22–39；§6.5→TC-46–50；§6.6→TC-02；§11 非目标→TC-54–59（不在 M1–M3 出口）。

## D19 授权

- 状态：已获授权（2026-11-13）。
- 用户原话：「好的，执行吧」（回应「要开 Task 2 时告诉我一声，并把授权原话给我」）
- 日期：2026-11-13
- M0b 前后 sha256：`rules` 与 `builders` 两组前后逐项相同（`true true`）；见 `docs/reports/2026-11-13-rule-baseline{,-after}/manifest.json`。
- `docgen-index.md` D19/P3/P4：已改（第 44 行，2026-11-13 恢复口径）。
- 执行许可：2026-11-13 读取到用户原话「好的，执行吧」；本 plan Task 2+ 开始执行。

> 本节由 TC-45 判读；不复用 ① 行。获授权后补用户原话、日期、M0b 前后 sha256 与 docgen-index 改动。
