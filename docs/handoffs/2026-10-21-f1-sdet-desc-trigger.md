# Session 交接：retro-skills → 路 B：修 docgen 写盘机制（有意变更通路）＋顺带修 senior-sdet 描述触发词（2026-10-21）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-21 15:55（Asia/Shanghai） |
| 项目根 | d:\Seed\retro-skills |
| HEAD | 5b518d7；工作树：clean（`git status --short` 无输出，2026-10-21 15:55 实查） |
| 验证基线 | `npm run check` = tests 470/470 pass + fail 0 + cancelled 0；baseline 35/35；0 findings；markdown 225 文件 / 774 表；**EXIT=0**（2026-10-21 15:55 实跑）。typecheck / build：无（本仓 Node 零第三方依赖，无此环节） |
| 继任自 | docs/handoffs/2026-10-20-s4-finalize-plan.md |
| 状态 | **路 A / 路 B 已由用户当场裁定为「路 B」**（2026-10-21，本交接词初稿误写「路 A」，以本节为准）；1 个开放问题（见"开放问题"节：spec 改动范围确认） |

## 项目定位

d:\Seed\retro-skills —— 一套 AI 协作工程体系（议会式多方评审 / 复盘 / 规则库 / 技能库），并用 docgen 管线（组件数据 → 模板 → 生成 → 守卫）把 agent 卡等生成物做成可复算、防手改漂移的产物。

## 现状

- **已完成（本 session，全部已提交于 5b518d7）**：
  1. **docgen P2 · S4 收口**：14 席全部 `replaced`、无「停损未迁」；每席与生成物逐字节相等 + `git diff --numstat -- agents/` 无输出；120 条十键注解由独立子代理判定全 pass；gate ×2 / 冷跑 / `npm run check` 全绿；PRD §6.6 账本已逐席补登。
  2. **三轮 `TRAE-code-review` 全部闭环**：每轮均为「主审列项 → 2 个独立子代理交叉验证 → 用户选全部修复 → 改动 + 实测 → `npm run check` exit 0」。修复内容：`patternRegistry.mjs` 的 `roleSep`、`scripts/check-all.mjs` 捕获 `StateFileInvalid` 并打印被检席名、`pilot-render.test.mjs` 区间切片改行首锚定（`^## 边界$` + 断言恰一处）、testcase 判据与 plan 漂移清理。
  3. **清账**：`docs/after/20261017210609-pending-work-overview.md` 线 F 更新（S4 已完成条目划掉、`剩下四件` → `剩下三件`、线 F-3 触发信号已命中）；`docs/superpowers/plans/2026-10-19-docgen-agent-capability.md` 40 个复选框全勾 + 8 处 `Step 5：提交` 标题改名；`docs/prd/20261019093443-docgen-agent-generation.md` §6.6 账本逐席补登。
  4. **线 C 关闭**（2026-10-21）：不建 `systematic-repair` 技能；三件机制中两件已有归属（review-loop 复查轮 / 议会多席独立 / `evolving-skills`），仅机制①「按病根分组的修复编排」转「候选 + 触发信号」。
  5. **线 G 新增**：历史 plan 的 git 写步骤残留盘点（见"遗留裁决与留观项"）。
- **验证证据**：见元信息表『验证基线』（单源，勿在此重复）。
- **提交状态**：已 commit（5b518d7）；工作树除本交接文档外 clean（`git status --short` 唯一输出 = `?? docs/handoffs/2026-10-21-f1-sdet-desc-trigger.md`，2026-10-21 实查）——该文档由用户决定提交方式，我不执行 git 写操作。
- **工作树异常**：无。

## 过程记录

- `docs/after/20261017210609-pending-work-overview.md`（线 A–G 活账本；**先读尾部「现在的下一步」节 + 线 F 表 + 线 C + 线 G**）
- `docs/superpowers/plans/2026-10-20-docgen-agent-batch.md`（S4 plan，30 步全勾 + 执行记录 + 三轮评审修复小节）
- `docs/superpowers/plans/2026-10-19-docgen-agent-capability.md`（S1 plan，已批量勾选 + 执行状态块）
- `docs/prd/20261019093443-docgen-agent-generation.md` §6.6（迁移状态账本，14 席逐席记录）
- 历史交接词链：`docs/handoffs/2026-10-20-s4-finalize-plan.md` → 本文件

## 本次任务

**路 B（用户 2026-10-21 当场裁定）**：先修 docgen 写盘机制——让 `cmdReplace` 支持「有意变更」（现在它把「与迁移前 git 快照逐字节一致」这个**迁移期一次性证明**当成永久前置条件，导致任何对卡内容的有意修改都被永久挡住）；机制修好后，再顺带修掉 senior-sdet 卡 description 里那个**卡内无对应职责**的触发词「评审测试策略」。

流程（**用户规则的 spec-testcase 硬门已触发**：本次动的是机制，属设计变更）：
① 出「cmdReplace 新机制设计提案」→ **先给用户看** → ② 改已定稿 spec（`docs/superpowers/specs/2026-10-19-docgen-agent-batch-design.md` 的 R6/R7）→ ③ 同批产 testcase（**必须派独立 `senior-sdet` 子代理、全新上下文**；spec 作者不得自写）→ ④ spec + testcase 一起送议会 → ⑤ 施工 → ⑥ 顺带改 description（改底稿 → 渲染 → **给用户看改前改后 diff 确认** → 写盘 → `npm run check` 绿）→ ⑦ 账本留痕。
起点：**①设计提案**（先给用户看，确认后才动 spec）。

要改的 description 内容（仅此一处，两文件对应两行；机制修好后才可合法落盘）：

```
tools/docgen/components/agentData.mjs:262
- when: '当需要为 PRD/spec 设计并编写测试用例（testcase.md）、评审测试策略、或专门找出被忽视的边界与失败场景'
+ when: '当需要为 PRD/spec 设计并编写测试用例（testcase.md），或专门找出被忽视的边界与失败场景'

agents/senior-sdet.md:3（由底稿渲染而来，禁手打）
- description: 资深测试开发工程师（Senior SDET）。当需要为 PRD/spec 设计并编写测试用例（testcase.md）、评审测试策略、或专门找出被忽视的边界与失败场景时调用。Do not use for 修改业务代码、写实现方案、或只读的议会评审（那走 reviewer-qa）。
+ description: 资深测试开发工程师（Senior SDET）。当需要为 PRD/spec 设计并编写测试用例（testcase.md），或专门找出被忽视的边界与失败场景时调用。Do not use for 修改业务代码、写实现方案、或只读的议会评审（那走 reviewer-qa）。
```

## 范围依据

- 要读：`tools/docgen/components/agentData.mjs` 第 **261–265** 行（要改的 `triggerTable['senior-sdet']`）
- 要读：`tools/docgen/components/agentData.mjs` 第 **220–240** 行（senior-sdet 条目本体：`heading` / `role` / `identity` / `fixedList` / `outputKind` / `sourceLine`）
- 要读：`agents/senior-sdet.md` 第 **3** 行（现状 description）、第 **19–23** 行（三件事，**无「评审」**）、第 **82** 行（「不参与议会裁决；你的产出会成为议会（reviewer-qa）的评审对象」）
- 要读：`tools/docgen/acceptance/golden-assert.mjs` 第 **15–23** 行（拿 `git show <commit>:agents/<名>.md` 旧快照比 description —— **迁移期一次性证明**）
- 要读：`tools/docgen/cli.mjs` 第 **201–228** 行（`cmdReplace` 双闸门：`goldenAssertion==='pass'` 且 `compareResult===null`）、第 **74–117** 行（`collectGate`：对 `state=replaced` 席要求「渲染 == 磁盘」）
- 要读：`scripts/check-all.mjs` 第 **94–115** 行（spawn `tools/docgen/cli.mjs gate`）、第 **144** 行（`checkAgentFile`）—— 这决定 `npm run check` 实际跑什么
- 要读：`tools/execution-matrix/criteria.md`（A1/A2/B1–B4/C1–C4 十键判据——「语义正确 + 执行力强」的现成口径）
- 要读（路 B 新增）：`docs/superpowers/specs/2026-10-19-docgen-agent-batch-design.md` 第 **49–52** 行（R4 黄金快照锚点 = 迁移前提交 / R6 替换前双闸门 / R7 议会席卡字节不变）+ §4 步 7（第 139 行）；其 testcase `docs/superpowers/specs/2026-10-19-docgen-agent-batch-design-testcase.md` 的 **TC-106**（第 373–392 行 replace 五模式）、**TC-107**（第 394–403 行卡字节不变）、**TC-110**（第 405–413 行重跑 init-evidence 自毁）—— 这三条正是要被新机制改写/补充的对象
- 要读（路 B 新增）：`docs/prd/20261019093443-docgen-agent-generation.md` §1.1（doc→code→doc 闭环）、`rules/spec-testcase-gate.md`（spec 必配 testcase 的硬门）、`rules/docs-convention.md`（spec 定稿后**原文保留不改**，新 spec 取代旧 spec）
- 勿重做：S1–S4 全部闭环（`tools/docgen/**`、`agents/**`，已提交于 5b518d7）；三轮 code-review 修复（`patternRegistry.mjs` 的 `roleSep`、`check-all.mjs` 的 `StateFileInvalid` 捕获、`pilot-render.test.mjs` 行首锚定切片）；线 E 产物（`tools/execution-matrix/**`）；线 C 关闭结论。

## 开放问题

1. **（开工第一问）spec 改动范围确认**：改机制要动 `2026-10-19-docgen-agent-batch-design.md` 的 R6（replace 双闸门）/ R7（「议会席卡字节不变」——其文本（spec 第 52 行）本就标注 `W3`，而 W3 是**迁移期验收判据**，迁移完成后该语义失效），并需同步 testcase `…-design-testcase.md` 的 TC-106（replace 五模式）。
   已裁决：**用户 2026-10-21 当场裁定走路 B**（修机制）；原交接词初稿写的「推断路 A」作废。
   待确认：R7 是否**限定为「迁移期」**（推荐——它本就是 W3 迁移期判据）；R6 是否增补「基线可经用户授权重开」的措辞。
   请用户：确认推荐范围 / 纠正。

（原「绕行写盘是否可接受」一问**作废**：路 B 下不再绕行 `replace`，改走合法写盘通路。原交接词初稿「需用户手动搭手写盘」的实测更正仍有效，备查：`npm run check` 只跑 gate / execution-matrix / markdown 三段，**不校验 evidence**，那道门槛只挡 `cli.mjs replace` 自身。）

## 既定约束（不要重新讨论、不要重新选型）

- **全局 Git 写操作禁令**：不执行 `git add` / `git commit` / `git push`，改动留工作区由用户提交 —— 用户全局规则「全局 Git 写操作禁令」。
- **改规则 / 技能 / 卡内容前必须先给用户看改前改后 diff 并获确认**，不许只给「执行 or 不执行」二选一 —— 用户规则（实时 project_memory 明确记载）。
- **testcase 不得由 spec 作者或施工者改写**（须独立 `senior-sdet` 子代理，全新上下文）—— 用户规则「写或修改 spec 时必须同批产出 testcase」。
- **已定走路 B（修机制），不再讨论路 A** —— 用户 2026-10-21 当场裁定。路 A（只修内容、绕行写盘、机制缺陷记待办）已作废。
- **成品必须由底稿渲染而来**，禁止手打 `agents/*.md` 内容 —— docgen 管线设计（`docs/prd/20261019093443-docgen-agent-generation.md` §1.1 doc→code→doc 闭环）。本次「写盘」＝把**渲染输出**落盘，不是手打。
- **落盘文件 LF / UTF-8 / 无 BOM / 末尾恰一个 `\n`** —— 仓库 `.gitattributes` = `* text=auto eol=lf` + `compare.mjs` 的 `checkEnvironment`。
- **权威全量检查入口 = `npm run check`**（= `node scripts/check-all.mjs`）；**不要**用 `node --test <目录>`（本机 Node 22 会 `MODULE_NOT_FOUND`），要单跑用 `node --test tools/docgen/test/*.test.mjs`。

## 遗留裁决与留观项

- **线 F-2**：`tools/execution-matrix/criteria.md` 的 C 组缺「模板形态适配」条款（§0.2 只覆盖 A 组）—— 来源：`docs/after/20261017210609-pending-work-overview.md` 线 F 表第 2 行；收敛时机：线 E 判据下次修订（属判据正文变更，走判据/规则变更流程，不顺手改）。
- **线 F-3**：14 席 agent 来源行只写「维护来源」没写「权威来源」（现仅 senior-sdet 有来源行，`agents/senior-sdet.md:9`，值在 `agentData.sourceLine`）—— 来源：同上第 3 行；**触发信号已命中（14 席已全 `replaced`）**；收敛时机：用户拍板后统一，若要 14 席统一属范围变更，需改 spec 重走议会。
- **线 G**：`docs/superpowers/plans/` 下 git 写步骤残留盘点（实测：13 份 plan / 45 行 grep 命中）——其中**只有 `2026-09-29-aas-skill-deps.md` 是真正要执行的 9 组 add+commit（18 行）**，其余 12 份命中全是「禁止 git 写操作」的**声明行**（合规，不动）；`2026-10-14-review-loop-evolution.md:230` 是 review 分支内的 commit 格式指引（review-loop 是本禁令唯一例外，保留）—— 来源：`20261017210609-pending-work-overview.md` 线 G；收敛时机：用户拍板（只改那 1 份 / 13 份统一加免责声明）。
- **docgen 机制缺陷（已由用户裁定升格为「本次主线任务」，不再是留观项）**：`cmdReplace` 的写盘前置条件把「迁移期一次性证明」（`golden-assert.mjs:15-23` 拿 `git show <commit>:agents/<名>.md` 旧快照比 description）当成永久门槛（`tools/docgen/cli.mjs:219-228`：`goldenAssertion!=='pass'` → `EvidenceInvalid`；`compareResult!==null` → `EvidenceInvalid`），**不支持「有意变更」**—— 来源：本 session 实测；收敛时机：**本次（路 B）**，要动 spec P2 R6/R7 + testcase TC-106。
- **线 C 候选机制①**「按病根分组的修复编排」—— 来源：`20261017210609-pending-work-overview.md` 线 C（已关闭结论的低半部分）；收敛时机：真动手修 41 问题（或下一批混合债）时，以真实卡点决定落点。

## 开工前先做

1. `git status --short`（应无输出）、`git log -1 --format=%h`（应为 `5b518d7`），然后跑 `npm run check` 复核基线（应 `tests 470` / `pass 470` / `fail 0`、`baseline 35/35`、`0 findings`、markdown 225 文件 / 774 表、EXIT=0）。
2. 读 `docs/after/20261017210609-pending-work-overview.md` 尾部「现在的下一步」节 + 线 F 表（3 行）+ 线 C（关闭结论）+ 线 G。
3. 读 `tools/docgen/components/agentData.mjs` 第 261–265 行（要改的 `when`）与第 220–240 行（条目本体）。
4. 读 `agents/senior-sdet.md` 第 3 行（现状 description）、第 19–23 行（三件事）、第 82 行（不参与议会裁决）。
5. 读 `tools/docgen/acceptance/golden-assert.mjs` 第 15–23 行 + `tools/docgen/cli.mjs` 第 201–228 行，理解「写盘门槛为何在迁移后挡路」。
6. 先出「`cmdReplace` 新机制设计提案」给用户看（**用户已裁定路 B，不再问路 A/B**），**确认设计后才动 spec**；随后按 `spec-testcase-gate` 规则派独立 `senior-sdet` 子代理写 testcase。

## 开场话术

读 docs/handoffs/2026-10-21-f1-sdet-desc-trigger.md，按交接词继续：「路 B」——先修 docgen 写盘机制（让 `cmdReplace` 支持有意变更），再顺带修掉 senior-sdet 卡 description 里「评审测试策略」这个卡内无对应职责的触发词。注意：路已定（B），先出设计提案给我看，确认后才动 spec。
