# Session 交接：retro-skills → 补齐工作流主干 PRD 的事实基线（2026-10-24）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-24 07:46（本机时区） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `8c0a7ca99998043927093f1d92e6bf9df33984c4`（docs: 更新文档中关于 after 目录命名的时间戳前缀规则）；工作树：2 个未跟踪项 —— `docs/handoffs/2026-10-24-dev-workflow-mainline.md`、`docs/prd/20261024073606-dev-workflow-mainline/`（整目录） |
| 验证基线 | `npm run check` → 语法检查通过；node:test `# tests 607 / # pass 606 / # fail 1`；唯一红项 = `not ok 229 守卫：文档里的「<名>.mjs 第 N 行」引用，行号必须仍有效`（07:46 实跑） |
| 继任自 | `docs/handoffs/2026-10-24-dev-workflow-mainline.md`（本 session 简版交接，内容被本份取代但按规矩保留不改） |
| 状态 | 有 4 个开放问题（见「开放问题」节），其中 1 个为开工第一问 |

## 项目定位

`d:\Seed\retro-skills` —— 一套面向 AI 编码的规范仓库（`rules/` 条文化约束 + `skills/` 流程方法 + `agents/` 子代理角色卡 + `skills/parliament/` 议会式评审 + `tools/docgen/` 角色卡生成器），本 session 在其之上设计「开发工作流主干」。

## 现状

- 已完成：把 2026-10-23～10-24 连续讨论出的「开发工作流主干」落盘成 PRD 草稿 —— `docs/prd/20261024073606-dev-workflow-mainline/index.md`，含 §0 三档标注基线与失忆清单、§1 病根、§3 三层角色与三权分离、§4 五段主干 + 两张议会插点（mermaid flowchart）、§5 两次议会差异矩阵、§6 plan 不设议会论证、§7 分歧举证路由与漂移三分类、§8 产品线补强、§9 工具档位缺口、§10 功能点清单 F-01～F-16、§11 待确认 D-01～D-22、§12 交付拆分 S1–S5、§13 自验收 V-1～V-5、附录 A `check-prd-graph.mjs` 伪代码。
- 已完成：PRD 自验收 V-4 互校 —— §10 中「进流程图＝是」的 12 项（F-01/02/03/04/05/06/07/08/09/10/11/15）在 §4 图中均有节点，图中无孤儿节点（人工核对，非脚本；脚本尚未实现）。
- 已完成：本 session 未改任何代码、`agents/*.md`、`rules/*.md`、`skills/*`（`git status` 证据：仅两个未跟踪项）。
- 验证证据：见元信息表『验证基线』。
- 提交状态：未提交，由用户自行 commit（本 session 无授权，未执行任何 git 写操作）。
- 工作树异常：`npm run check` 唯一红项由 `docs/prd/20261024073606-dev-workflow-mainline/userconversation.md` 触发 —— 该文件引用 `patternRegistry.mjs 第 14 行` 并附了代码片段，但片段少了空格，与真源不逐字相等（报错原文见「开放问题」第 2 条）；该文件由用户放入，非本 session 生成，未改动。

## 过程记录

- `docs/prd/20261024073606-dev-workflow-mainline/index.md`（先读 §0.1 三档标记 → §0.3 失忆清单 → §11 待确认表尾部）
- `docs/prd/20261024073606-dev-workflow-mainline/userconversation.md`（用户提供的另一段会话原始记录；首问为「你能把现在整个议会的流程使用流程图的方式给我一下吗？」）
- `docs/handoffs/2026-10-24-dev-workflow-mainline.md`（本 session 前一份简版交接）
- 历史交接词：`docs/handoffs/2026-10-24-dev-workflow-mainline.md` → `docs/handoffs/2026-10-24-mainline-fact-baseline.md`（本份）

## 本次任务

用原始聊天记录补齐工作流主干 PRD 的事实基线，然后再进 S1；流程：①核对 `[已确认]` 标注 → ②逐条裁定 D-01～D-22 → ③补齐 FZ-01～FZ-07 → ④按结果更新 PRD 状态与 §0 硬门 → ⑤写 S1 spec（同批派 `senior-sdet` 出 testcase）→ ⑥送议会 #? （S1 是否需要议会另定）；起点：环节①。本 session 未进任何环节。

## 范围依据

- 要读：`docs/prd/20261024073606-dev-workflow-mainline/index.md` §0.1（三档标记定义）、§0.2（§0 硬门未通过的证据）、§0.3（FZ-01～FZ-07）、§10（F-01～F-16 与「进流程图」列）、§11（D-01～D-22 与建议栏）、§13（V-1～V-5）
- 要读：`docs/handoffs/2026-10-24-dev-workflow-mainline.md` §3（四行核验规则表：说过/只提议/写歪/记录里没有，四种处置）
- 要读：`skills/parliament/references/host-duties.md` 第 1 行（「主持人与答辩方（主 agent 扮演）」＝自证病源）、第 16–38 行（答辩方编制，零产品角色）
- 要读：`skills/parliament/references/submission-matrix.md` 第 15 行（PRD 行：读者 + 审计）、第 26 行（spec 行：`spec + testcase（一件）`）
- 要读：`skills/parliament/references/assembly-matrix.md` 第 9 行（纯文档仓库行）
- 要读：`tools/docgen/components/patternRegistry.mjs` 第 14 行（工具档位全集只有 `readOnly` / `sdet`）
- 要读：`tools/docgen/test/validate.test.mjs` 第 29 行（`ToolsViolation` 断言锁，改档位必须动它）
- 要读：`agents/reviewer-product.md` 第 4 行（`tools: Read, Glob, Grep`）、第 6 条必问（收益成功指标）
- 要读：`skills/prd-to-specs/references/conventions.md` 第 35 行（mermaid 时序图 + 步骤表的成对先例）
- 勿重做：`docs/prd/20261024073606-dev-workflow-mainline/index.md` 正文已写完，核验后只做「标注升降 + 正文纠错」，不重写结构；§10 清单与 §4 图已互校通过，勿重排 ID

## 开放问题

1. **（开工第一问）** 你放入的 `20261024074213-drawing-parliament-flow-transcript.md` 是否就是「当时的聊天记录」；推断：**不是** —— 该文件首问是「把现在整个议会的流程用流程图给我一下」，通篇讲现有议会主流程与三类关卡，未见 2026-10-23～10-24 的工作流主干设计讨论（五段合并、两次议会、plan 机械门、议长独立等）；依据：该文件第 9–30 行内容。请用户：确认它够不够用来核 `[已确认]`，或补上后者。
2. `npm run check` 红项如何处置；推断：`20261024074213-drawing-parliament-flow-transcript.md` 转述真源代码时重排了空格（守卫要求引用片段逐字相等，报错原文：`期望片段：tools: { readOnly: ['Read','Glob','Grep'], sdet: [...] }` / `实际第 14 行附近：tools: { readOnly: ['Read', 'Glob', 'Grep'], sdet: [...] }`）。候选：A 把该文件里的片段改成与真源逐字一致；B 把该处引用改为不含片段（只写文件名 + 行号）；C 判为守卫误报、给记录型文档加豁免。选择需用户定，因为该文件是用户放入的原始记录，改它等于改记录。
3. 中文文件名是否规范化；推断：应改成 kebab-case（如 `20261024074213-drawing-parliament-flow-transcript.md`），依据是 `docs/` 目录命名规则禁中文；但未获授权，本 session 未改名。
4. D-01（撤销「产品评委在 PRD 评审退场」）与 D-03（PRD 行、spec 行均加产品评委必选）是否成立；推断：成立 —— 依据 PRD §8.2 的核实表：两次议会评委席均无产品评委，产品设计从未被独立第三方审过（对应病根 G3）。请用户：确认/纠正。

## 既定约束（不要重新讨论、不要重新选型）

- 需求讨论期不得擅自写文件，动笔须明确授权 —— 用户全局规则
- spec 必须同批由 `senior-sdet` 在全新上下文产出 testcase；spec 只写「测什么 / 为什么」并外链用例文件，不内联用例 —— `rules/spec-testcase-gate.md` 五判据 + 用户全局规则
- 议会核心机制变更（答辩方构成、角色职责、点将矩阵）必须走 spec + testcase 送议会，不得零散改文档 —— 项目记忆 hard constraint
- plan 阶段不设议会，只设「脚本机械核对 + 独立审计签字」；plan 里发现 spec 未定项必须回流 spec 重审 —— PRD §6
- PRD 只含「做什么」，不含技术实现细节 —— 项目约定（PRD 与 spec 的分工）
- 存量 spec 不追溯补 testcase，按「一个个升级」处理 —— 用户 2026-10-18 裁定
- 决策唯一权威在 PRD；handoff 不复制结论 —— `docs/` 目录规则硬约束 5（避免第二份真相）

## 遗留裁决与留观项

- 工具档位 `producer` 的 RunCommand 是否支持逐条白名单（若平台只能整档给命令工具，「禁写操作」退化为靠角色卡自觉，方案需改成只给脚本入口） —— 来源：PRD §9；收敛时机：S5 spec 之前
- `check-prd-graph.mjs` 的 A 段形态门是否过严（要求同时存在 `sequenceDiagram` 与 `flowchart`、且禁止一切图片引用） —— 来源：PRD 附录 A；收敛时机：S2 / S4 spec
- `respondent-dev` 取 1 个换背景还是 3 个独立 —— 来源：PRD §11 D-06；收敛时机：S3 spec

## 开工前先做

1. `git status --porcelain` 确认工作树仍只有 `docs/handoffs/2026-10-24-dev-workflow-mainline.md` 与 `docs/prd/20261024073606-dev-workflow-mainline/` 两个未跟踪项；再跑 `npm run check` 复核基线（当前 607 / 606 / 1，红项见元信息表）。
2. 读 `docs/prd/20261024073606-dev-workflow-mainline/index.md` §0.1，记住三档标记的判据后再读任何结论。
3. 读 `docs/handoffs/2026-10-24-dev-workflow-mainline.md` §3 的四行核验规则表，按其处置方式核 `[已确认]`。
4. 先解「开放问题」第 1、2 条，再进核验（第 1 条决定核验素材是否够用，第 2 条决定基线是否绿）。
5. 核验完成前不写 S1 spec；写 S1 时同批派 `senior-sdet`，不自己顺手写用例。

## 开场话术

读 `docs/handoffs/2026-10-24-mainline-fact-baseline.md`，按交接词继续：用聊天记录补齐工作流主干 PRD 的事实基线（核 `[已确认]` + 划 D-01～D-22 + 补 FZ-01～FZ-07）。注意：先解开工第一问（那份对话记录是否够用），并处理 `npm run check` 的唯一红项。
