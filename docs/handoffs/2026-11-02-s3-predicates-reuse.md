# Session 交接：retro-skills → observable PRD 的 S3「判据与复用」（2026-11-02）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-11-02 08:57（Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `e413a50`（`docs: 补充 S2-card-rewrite 交付审计记录至 gate-record.md`）；工作树：08:56 实查 **clean**（0 行）；本交接文件自身 `?? docs/handoffs/2026-11-02-s3-predicates-reuse.md` **未提交，由用户自行 commit** |
| 验证基线 | `npm run check` → `# tests 1325` / `# pass 1323` / `# fail 0` / `# skipped 2` + `baseline 38/38` + `0 findings` + `④ markdown 通过（368 文件 / 1555 表）` + 末行 `check 全部通过`；`node scripts/check-gate-record.mjs` → `rows 50 bad 0`；`node scripts/scope-sweep.mjs --check` → `sweep ok`（**08:57 实跑**） |
| 继任自 | `docs/handoffs/2026-11-01-s2-impl.md` |
| 状态 | 可直开工（S3 无已定 spec；3 个开放问题见下节，均带推断，不阻断开工第一动作） |

## 项目定位

`d:\Seed\retro-skills` —— 规则 / 技能 / 角色卡的**单一源仓库**（`tools/docgen` 由 `agentData` + 模板渲染 15 张角色卡，`scripts/` 是门禁套件，`docs/prd|specs|plans` 是五段工作流的主线产物）。

## 现状

- 已完成：
  - 本 PRD（`docs/prd/20261031202331-observable-criteria-rollout/index.md`）**S1 清单与校验器** ✅ —— 门行 `②@` / `②→③@` / `③@` / `④@` / `⑤@observable-criteria-rollout` 在 `skills/dev-workflow/references/gate-record.md`。
  - **S2 卡面重构** ✅（2026-11-01 → 11-02）—— 五条门行 `②@` / `②→③@` / `③@` / `④@` / `⑤@S2-card-rewrite` 全在；交付件 = `tools/docgen/card-model/vocab/card-contract.mjs`、`object-names.mjs`、`tools/docgen/components/cardFaceIds.mjs`、`renderCard` + `expectedBullet`、`templates/agent-card.md.tpl`、15 张 `agents/*.md` + `docs/agents/**`、`scripts/check-before-after.mjs`；V-11 复测三席 12→1 / 15→4 / 16→4。
  - **S3 判据与复用** ❌ 未开始。
- 验证证据：见元信息表『验证基线』（单源，勿重复）。
- 提交状态：已 commit（`e413a50`；此前 `bf0831f` / `0a…` 系列的 D19–D22 增量与证据迁移均已入库）。
- 工作树异常：无。

**S3 未开始的取证（已做 git 考古）**：`Get-ChildItem docs/superpowers/specs, docs/superpowers/plans -Filter '*s3*'` 只返回 3 件 `2026-10-27/28-s3-gate-wiring-*`——它们是 `docs/prd/20261026205821-agent-card-contract.md` 的 S3「门禁接入」（门行 `⑤@S3`），**不是**本 PRD 的 S3「判据与复用」；`git log --all --oneline -- 'docs/superpowers/specs/*s3*' 'docs/superpowers/plans/*s3*'` 的 5 个提交（`d1f8f7c` / `2d41e19` / `d81c4dd` / `a9f3bbb` / `8217df2`）全部属 gate-wiring 与门禁脚本，无 `predicates` 改写提交。

## 过程记录

- `.session/reviews/2026-11-01-2200-s2-d17-increment/`（**先读 `progress.md` 尾部**；`audit.md` 为 D17/D18 复签账；另含 `v11-scoring-table.md` / 3 席答卷 / `v11-grading-after.md` / `rejudge-*-B3.md` 的原件）
- `.session/reviews/2026-11-02-s2-d19-increment/audit.md`（D19 落点改判：`cardFaceIds` → `components/`）
- `.session/reviews/2026-11-02-s2-d20-d21-increment/audit.md`（D20 `I06` 改内容级 + D21 基锚）
- `.session/reviews/2026-11-02-s2-d22-increment/audit.md`（D22 基锚再修，含锚算术）
- 进 git 的 V-11 证据（**权威副本**）：`docs/reports/2026-11-01-s2-card-comprehension-baseline-evidence/README.md` + 7 份证据
- 门行总账：`skills/dev-workflow/references/gate-record.md`（搜 `S2-card-rewrite` 与 `observable-criteria-rollout`）
- 历史交接词链：`docs/handoffs/2026-11-01-s2-impl.md` → 本文件

## 本次任务

做本 PRD 的 **S3「判据与复用」**（F-07 `predicates` 8 条改写 + `validatePredicates`、F-08 校验器扩面到卡面与判据表、F-09 两 inspector 四处新增检查点、F-10 三写作流程引用）；流程：**① 需求/ spec + 独立 sdet testcase → ② 议会 + 计划门 → ③ 实现 → ④ sdet 质量 → ⑤ 交付（用户终签）**；起点：**① 段**（spec 落 `docs/superpowers/specs/`、plan 落 `docs/superpowers/plans/`、testcase 与 spec 同目录 `-testcase.md`）。

## 范围依据

- 要读：
  - `docs/prd/20261031202331-observable-criteria-rollout/index.md` §8（**行 297–325**，含 S3 行、F→S 覆盖表、S3 的 R8 前置）、§6（F-07–F-10 定义）、§9.2（V-8 / V-9 / V-10）、§7 决策清单
  - `docs/superpowers/specs/2026-11-01-s2-card-rewrite-design.md` §6（D1–D22 差异清单）与 §5（V 组）—— 承接上一块的终态口径
  - `tools/docgen/card-model/vocab/predicates.mjs`（**8 条 label 现形**，08:56 实测 8 条）、`tools/execution-matrix/criteria.md`（判据正文 A/B/C 组）、`rules/observable-criteria.md`（F-10 先行产物）
- 勿重做：S2 已签的 `card-contract.mjs` / `object-names.mjs` / `components/cardFaceIds.mjs` / `renderCard` + `expectedBullet` / 15 张卡 / `docs/agents` / `scripts/check-before-after.mjs`（门行 `③@S2-card-rewrite` 已签，重做即漂移）

## 开放问题

1. **S3 拆一份还是两份 spec？** 推断：**两份**——A 份「F-07 8 条 label 改写 + F-08 校验器扩面」、B 份「F-09 两 inspector 新增检查点 + F-10 三写作流程引用」。依据：PRD §8 行 305 写「S3 内部顺序 = F-07 → F-08 → F-09 / F-10」，且 F-07 触 R8（须先 `scope-sweep --check` exit 0）——一份装不下两段不同前置。请用户：确认 / 纠正。
2. **8 条新 label 文案由谁定？** 推断：**我出草案**（每条给 `observable` ≥1 / `negativeSample` 非空 / `residual.who` 非空），走 ② 段议会复签后定稿。依据：PRD §9.2 V-8 的三条逐条断言 + 「缺 testcase 不得送议会」。请用户：确认 / 纠正。
3. **F-07 改 label 后 15 卡是否同批重生成？** 推断：**必须同批**。依据：`tools/docgen/components/renderCard.mjs` 的 `criterionName` 直接取 `PREDICATES[c].label`，label 一改卡面即变，不重生成则 `gate` 报 `Mismatch`（`③@S2-card-rewrite` 行的「15 席 disk == render」判据会红）。请用户：确认 / 纠正。

## 既定约束（不要重新讨论、不要重新选型）

- **S2 的 D1–D22 是终态**，不重开 —— 出处：`docs/superpowers/specs/2026-11-01-s2-card-rewrite-design.md` §6 + `gate-record.md` 的 `②@S2-card-rewrite` / `-d17` / `-d19` 行
- **`cardFaceIds` 必须留 `tools/docgen/components/`**，不得搬回 `card-model/` —— D19；S1 spec §3 依赖红线 + `S1-TC-J06`（搬回即红）
- **`S2_BASE` 锚 = 最后一次触及 `agents/` 的提交**（工作区脏取它本身、干净取它的父）；**S3 进 ③ 时须显式换锚** —— D22 + `⑤@S2-card-rewrite` 行 P2④
- **扫描面分期 C-6**：S1 只扫 `rules/` + `skills/`；卡面与 `predicates` 面才归 S3 —— PRD §8 行 305
- **15 卡不得手改**，只走 `draft` → 确认 → `replace --yes` 两步写盘 —— spec §3 #7 / D11
- **改判据级口径（含 8 条 label）必须 R8 回扫**：先 `node scripts/scope-sweep.mjs --check` exit 0，并在当次 `impact-sheet.md` 给 8 条旧 label 的每个命中处处置（改 / 改引用 / 标历史保留） —— PRD §8 行 307
- 本仓门禁基线不钉死：数字按实跑漂移，**以本次实跑为准** —— `rules/docs-convention.md` + 历次门行口径

## 遗留裁决与留观项

- `I22`–`I24` 未登记 `tools/scope-sweep/keywords.json`（D20 / D21 / D22 的旧说法） —— 来源：`gate-record.md` 的 `⑤@S2-card-rewrite` 行 P2①；收敛时机：下一次登记 R8 口径时一并冻改前值
- `spec §4-D3` 未写「token 归一化 / 尾部剥离」一步（现只在 `components/cardFaceIds.mjs` 注释里） —— 同 ⑤ 行 P2②；收敛时机：下次改该 spec 时补一句或加子条
- detective fixture 的 `changes` 第 12/13 条同 `judgedBy`（同批重判两次落笔，非异常） —— 来源：`④@S2-card-rewrite` 行；收敛时机：触碰该 fixture 时在注解里注明

## 开工前先做

1. `git status --porcelain` 确认 0 行，并 `npm run check` 复核元信息表的基线数字（1325 / 1323 / 0 / 2 + `check 全部通过`）
2. 读 `docs/prd/20261031202331-observable-criteria-rollout/index.md` §8（行 297–325）与 §6 的 F-07–F-10 四行
3. 读 `tools/docgen/card-model/vocab/predicates.mjs` 的 8 条与 `tools/execution-matrix/criteria.md` 的 A/B/C 组，标出「label ↔ 判据正文」的对应关系（F-07 的改前基线）
4. `node scripts/scope-sweep.mjs --check` 跑一次（F-07 的 R8 前置）；若需新增口径，先 `--freeze` 记改前值
5. 建 S3 spec，并派**独立 sdet 子代理**在同批写 testcase（缺 testcase 不得进 ②）

## 开场话术

读 `docs/handoffs/2026-11-02-s3-predicates-reuse.md`，按交接词继续：做本 PRD 的 S3「判据与复用」（F-07–F-10），从 ① 段起。
