# Session 交接：retro-skills → 补完工作流主干 PRD 并进入 S1（2026-10-24）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-24 09:52（本机时区） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `8c0a7ca99998043927093f1d92e6bf9df33984c4`（docs: 更新文档中关于 after 目录命名的时间戳前缀规则）；工作树：**未提交改动 30 项**（清单见「现状 · 工作树异常」） |
| 验证基线 | 无 typecheck / build 环节（纯脚本 + 文档仓库）。`npm run check`：语法检查通过；`node --test` **626 用例 / 625 通过 / 1 失败**（红项 = `not ok 248` 行号守卫）；docgen gate `baseline 35/35`；skill-inspector `0 findings`；markdown 检查通过（253 个文件 / 975 张表）。`node scripts/doc-name.mjs --check docs` → **命名检查通过**（09:52 实跑） |
| 继任自 | `docs/handoffs/2026-10-24-mainline-fact-baseline.md`（本 session 已按它开工；内容未被本份取代，按规矩保留不改） |
| 状态 | 可直开工，但有 4 个开放问题（见「开放问题」节），第 1 条为开工第一问 |

## 项目定位

`d:\Seed\retro-skills` —— 面向 AI 编码的规范仓库（`rules/` 条文约束 + `skills/` 流程方法 + `agents/` 子代理角色卡 + `skills/parliament/` 议会式评审 + `tools/docgen/` 角色卡生成器）；本 session 在其上设计「开发工作流主干」PRD，并落地了文档命名判据与三个改名工具。

## 现状

- 已完成：**PRD 事实基线回核**——`docs/prd/dev-workflow-mainline/20261024073606-dev-workflow-mainline.md` §0.3 的 FZ-01～FZ-07 全部补到原文 + 行号，§0.4 给出「保留 10 处 / 降级 9 处 / 本轮新裁定 9 条」结论。
- 已完成：**PRD 新增 5 节**（同文件）——§3.4 议长选 A（`speaker` 独立、主持人角色作废、职责二分）、§4.1 交付单位「功能块」（滚动拆不批量）、§5.1 收敛规则（规则 2 复活 + 族映射表 + 侦探三条守恒；规则 1 不采纳；规则 3 改栏位化降级）、§8.0 精算师一票否决 + 三道保险 + 推翻须签字、§8.4 图的可读性双判据 + 一致性全量核对（替代抽查）。
- 已完成：**PRD 改写 6 处**（同文件）——§6 plan 门转 `[已确认]`（0 评委席 + 审计本人读并签字，依赖 `producer` 档）、§8.2 产品评委重写为「#1 触发式 / #2 必选」+ 四个配套判据、§10 新增 F-18～F-22 且 F-05/F-09/F-10 转已确认、§11 标 D-01/D-02/D-03/D-08/D-11 已决、§12 S3/S4 更新、§4 图 F-05 标签同步。
- 已完成：**两条规则**——`rules/how-i-must-reason.md` 新增 §8「提问题必须带解法」（含落点表 / 触发时机 / 验证三处联动）；`rules/docs-convention.md` 文件命名节新增 `docs/prd/` 行 + 三条时间戳总则 + 「机器判据以 `scripts/doc-name.mjs` 为准」。
- 已完成：**三个脚本 + 三份测试**——`scripts/doc-name.mjs`（命名判据唯一实现）、`scripts/doc-rename.mjs`（改名 + 引用重写，默认 dry-run，报告带行号 / 上下文 / link·code·prose 分类）、`scripts/doc-migrate-stamps.mjs`（批量补前缀）；测试 19 条全过（`scripts/*.test.mjs`）。
- 已完成：**文档改名 4 个**——`docs/prd/dev-workflow-mainline/` 下 PRD → `20261024073606-dev-workflow-mainline.md`、transcript → `20261024074213-drawing-parliament-flow-transcript.md`；`docs/prd/` 下 `docgen-agent-generation.md` → `20261019093443-…`、`docgen-rule-whole-file.md` → `20261018214426-…`。`docgen-index.md` **刻意不改**（单份索引，见 `rules/docs-convention.md` 三条总则）。
- 验证证据：见元信息表『验证基线』（单源，勿在此重复填写）。
- 提交状态：未提交，由用户自行 commit（本 session 未执行任何 git 写操作）。
- 工作树异常（`git status --porcelain`，09:52 实查）：
  - **M（21 项）**：`docs/after/20261019131757-dc-translator-design.md`；`docs/handoffs/` 7 份（2026-10-18-docgen-p1-review / 2026-10-18-p2-agent-generation-prd-review / 2026-10-19-docgen-p2-s1-execute / …p2-s2-execute / …p2-s2-parliament / …p2-spec-split / 2026-10-21-f1-sdet-desc-trigger）；`docs/prd/docgen-index.md`；`docs/superpowers/plans/` 2 份；`docs/superpowers/specs/` 9 份；`package.json`；`rules/docs-convention.md`；`rules/how-i-must-reason.md`——其中除后三项外，全部由 `doc-migrate --apply` 的**路径字符串重写**产生（只改路径，未改结论）。
  - **D（2 项）**：`docs/prd/docgen-agent-generation.md`、`docs/prd/docgen-rule-whole-file.md`（改名后的旧路径）。
  - **??（8 项）**：`docs/handoffs/2026-10-24-dev-workflow-mainline.md`、`docs/handoffs/2026-10-24-mainline-fact-baseline.md`、`docs/prd/20261018214426-docgen-rule-whole-file.md`、`docs/prd/20261019093443-docgen-agent-generation.md`、`docs/prd/dev-workflow-mainline/`（整目录）、6 个 `scripts/doc-*.mjs`（3 脚本 + 3 测试）。
  - **唯一红项**：`not ok 248` 由 `docs/prd/dev-workflow-mainline/20261024074213-drawing-parliament-flow-transcript.md` 触发——它引用了 `patternRegistry.mjs 第 14 行` 并附代码片段，片段少空格与真源不逐字相等。记录内容按规矩不改，处置方式见「开放问题」第 1 条。

## 过程记录

- `docs/prd/dev-workflow-mainline/20261024073606-dev-workflow-mainline.md`（**先读 §0.4 回核结论 → §11 待确认表 → §8.2 / §5.1 / §4.1 / §3.4 / §8.0 / §8.4**）
- `docs/prd/dev-workflow-mainline/20261024074213-drawing-parliament-flow-transcript.md`（3192 行原始对话记录，本 session 全部「记录 Lxxx」行号的来源）
- `scripts/doc-name.mjs`（命名判据单源，含三类目录 + 三条总则的机器实现）
- 历史交接词：`docs/handoffs/2026-10-24-dev-workflow-mainline.md` → `docs/handoffs/2026-10-24-mainline-fact-baseline.md` → 本份

## 本次任务

补完工作流主干 PRD 的剩余待确认项并写 S1 spec；流程：①逐条裁定剩余 D 项（D-04～D-07、D-09、D-10、D-12～D-23 中未决者）→ ②出「存量三份 docgen PRD 可借鉴点」初稿并与 PRD 合并 → ③写 S1 spec（`docs/superpowers/specs/YYYY-MM-DD-dev-workflow-skeleton-design.md`），同批派 `senior-sdet` 在全新上下文产出 `-testcase.md` → ④按 `submission-matrix` 的 skill/rule/agents 行送议会；起点：①。

## 范围依据

- 要读：`docs/prd/dev-workflow-mainline/20261024073606-dev-workflow-mainline.md` §0.4（回核结论与降级原因）、§3.4（议长 A 与 `producer` 档的连带依赖）、§4.1（功能块定义与三条「不许」）、§5.1（族映射表与三条守恒、级别栏位化）、§6（plan 门：0 评委席 + 审计真读）、§8.0（精算师三道保险）、§8.2（产品评委四个配套判据）、§8.4（图双判据 + 全量对照表）、§10（F-01～F-22）、§11（D-01～D-23 与已决状态）、§12（S1–S5）。
- 要读：`rules/docs-convention.md`「文件命名」节（三条时间戳总则 + 机器判据指向）。
- 要读：`rules/how-i-must-reason.md` §8（提问题必须带解法：具体动作 / 取舍 / 验收）。
- 要读：`scripts/doc-name.mjs` 顶部注释与 `judge()`（命名判据的唯一实现，文字表冲突时以它为准）。
- 要读：`skills/parliament/references/submission-matrix.md` L11–L12（PRD / spec 行）与 L14–L16（rule / skill / agents 行）——决定 S1 送审的主责评委。
- 勿重做：`scripts/doc-name.mjs`、`scripts/doc-rename.mjs`、`scripts/doc-migrate-stamps.mjs` 及其三份测试（19 条全过）；PRD §0.1–§10 的既有结构（只做标注升降与正文纠错）；`rules/how-i-must-reason.md` §8 与 `rules/docs-convention.md` 文件命名节。

## 开放问题

1. **（开工第一问）`not ok 248` 行号守卫是否给 `-transcript.md` 加豁免**；推断：**加**——在 `skills/managing-lessons-store/scripts/lessons.test.mjs` 的行号守卫（测试体自 L1717 起）过滤 basename 以 `-transcript.md` 结尾的文件并打印跳过数，同时补两条用例（`xxx-transcript.md` 写漂移行号**不**报错；普通 `.md` 写漂移行号**仍**报错），改完应为 `# fail 0`（用例数 626 → 628）。依据：该文件是用户放入的原始记录，改内容等于改写历史（`rules/docs-convention.md` 硬约束 4「运行产物不改」），而 `npm run check` 全绿是既定基线。请用户：确认 / 纠正。
2. **剩余 D 项是否按建议全部采纳**；推断：D-04（议会 #1 走方案 A）、D-05（#2 答辩方 = leader + 主 agent + sdet + respondent-dev）、D-06（`respondent-dev` 用 1 个换背景）、D-07（纯文档行精算师升必选、测试在 #2 升必选）、D-09 / D-10（同步三档分级 + 同步决策记录表 4 列）、D-12 / D-13（功能点强制 ID + 只收 mermaid 源码）、D-15 / D-16 / D-17（`research` 档、联网不给产品经理、工具档位单列 S5）、D-18（S1→S3→S2→S4 + S5）、D-19（`reviewer-*` / `respondent-*` 命名）、D-21（PRD §4 改名）、D-22（产品经理写权须回签 §0）、D-23（reader 常驻）**全部按建议采纳**；D-14（`producer` 档含 RunCommand 白名单）**先验平台能力再定**（能不能按条白名单未知）。依据：PRD §11 各条「我的建议」栏。请用户：确认 / 逐条纠正。
3. **存量三份 docgen PRD 的借鉴初稿现在做还是并入 S1**；推断：**现在做**——`docs/prd/docgen-index.md`（索引）、`docs/prd/20261019093443-docgen-agent-generation.md`、`docs/prd/20261018214426-docgen-rule-whole-file.md`，只提取结构件（§0 裁决记录形态、完成判据表、角色分工表、生成流程约束），产出 200 字以内的「可借鉴 / 不借鉴」清单并写进 PRD §8.3。依据：用户 2026-10-24 明确要求「这个你要去借鉴啊，然后去思考……但是要有初稿」。请用户：确认 / 纠正。
4. **S1 是否需要送议会**；推断：**需要**——S1 产出 `skills/dev-workflow/SKILL.md`、主干判据 rule、`agents/reader.md`，按 `skills/parliament/references/submission-matrix.md` 的 skill / rule / agents 三行各有主责评委（AI + 审计），且项目既有硬约束「议会核心机制变更必须走 spec + testcase 送议会」。请用户：确认 / 纠正。

## 既定约束（不要重新讨论、不要重新选型）

- 写或改 spec 必须同批由 `senior-sdet` 在全新上下文产出 testcase，spec 只写「测什么 / 为什么」并外链用例文件 —— `rules/spec-testcase-gate.md` 五判据 + 用户全局规则。
- 需求讨论期不得擅自写文件，动笔须明确授权 —— 用户全局规则（`rules/global-ask-before-acting.md`）。
- 禁止主动执行任何 git 写操作；只允许 `status` / `log` / `diff` / `show` —— 用户全局规则。
- 命名合规性以 `scripts/doc-name.mjs` 为准（时间戳三条总则：多版本并存处才加 / 单份稿与配置不加 / 父目录已带时间戳则子文件不加）—— `rules/docs-convention.md` 文件命名节。
- 时间戳前缀取值 = 文件创建时刻（`birthtime`），不取当天日期 —— `rules/docs-convention.md` 文件命名节。
- plan 阶段不设议会，只设「脚本机械核对 + 审计本人读并签字」；plan 里发现 spec 未定项必须回流 spec 重审 —— PRD §6。
- 议会只在两处插点：PRD 后、spec + testcase 后 —— PRD §4 / §5。
- 存量 spec 不追溯补 testcase，按「一个个升级」处理 —— 用户 2026-10-18 裁定。
- 提问题必须带解法（具体动作 + 取舍 + 验收），否则视为没提 —— `rules/how-i-must-reason.md` §8。

## 遗留裁决与留观项

- `producer` 档的 RunCommand 能否按条白名单（若平台只能整档给命令工具，「禁写操作」退化为靠角色卡自觉，方案要改成只给脚本入口）—— 来源：PRD §9；收敛时机：S5 spec 之前。
- `check-prd-graph.mjs` 的 A 段形态门是否过严（要求 flowchart 与 sequenceDiagram 同时存在、禁一切图片引用）—— 来源：PRD 附录 A；收敛时机：S2 / S4 spec。
- `respondent-dev` 取 1 个换背景还是 3 个独立（D-06）—— 来源：PRD §11；收敛时机：S3 spec。
- 记录型 transcript 内部第 3157 行仍指向 PRD 的旧名（改名后成陈旧链接，按「记录内容不改」保留）—— 来源：`rules/docs-convention.md` 硬约束 4；收敛时机：无（已知代价）。
- `docs/prd/docgen-index.md` 不加时间戳（单份索引）—— 来源：`rules/docs-convention.md` 三条总则；收敛时机：无（判据已定）。

## 开工前先做

1. `git status --porcelain` 核对工作树仍是本份元信息表所列 30 项；再跑 `npm run check` 复核基线（应为 626 / 625 / 1，红项 = `not ok 248`）。
2. 读 `docs/prd/dev-workflow-mainline/20261024073606-dev-workflow-mainline.md` §0.4 与 §11 全表，先分清「已决 5 条」与「仍待 17 条」，避免重开已决项。
3. 读同文件 §8.2 的四个配套判据与 §5.1 的族映射表，这三处是本次讨论最晚定稿的，后续 spec 必须与之一致。
4. 读 `docs/prd/docgen-index.md`、`docs/prd/20261019093443-docgen-agent-generation.md`、`docs/prd/20261018214426-docgen-rule-whole-file.md`，抽出可借鉴结构件（为开放问题 3 的初稿）。
5. 写 S1 spec 时同批派 `senior-sdet` 出 testcase，路径约定：`docs/superpowers/specs/YYYY-MM-DD-dev-workflow-skeleton-design.md` + 同名 `-testcase.md`。

## 开场话术

读 `docs/handoffs/2026-10-24-mainline-prd-s1.md`，按交接词继续：补完工作流主干 PRD 的剩余待确认项并写 S1 spec。注意：先处理开放问题第 1 条（`not ok 248` 行号守卫的 transcript 豁免），再动 D 项。
