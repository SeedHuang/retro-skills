# Session 交接：retro-skills → Docgen P2 拆 spec + testcase + 议会评审（2026-10-19）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-19 13:20（本机时区） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `4ba7c13`；工作树：**clean**（`git status --short` 无输出，13:20 实跑） |
| 验证基线 | `npm run check` → 357 tests（347 pass / 10 skip）/ 0 findings / baseline 21/21 / ④ markdown 检查通过（193 文件 / 600 表）/ exit 0（**13:20 实跑**） |
| 继任自 | `docs/handoffs/2026-10-18-p2-agent-generation-prd-review.md` |
| 状态 | **可直开工**（P2 PRD 已定稿；下一步 = 拆 spec） |

## 项目定位

`d:\Seed\retro-skills` —— 自研复盘/规则/技能/议会评审工作流仓库；当前主线 = docgen（用「组件 → 模板 → 生成 → 守卫」把 rule / skill / agent 的 markdown 生成物从手写改为代码生成并守住）。

## 现状

- **P1（一条 rule 整文件生成）已验证并提交**：spec + testcase 议会评审通过 → 实现 13/13 PASS → 代码审查 → 提交（`b1197d6`）。
- **P2（agent 整文件生成）PRD 议会评审通过（本 session 完成）**：5 轮收敛（第 1 轮 40 卡 → 第 2 轮 27 → 第 3 轮 27 → 第 4 轮 3 → 第 5 轮 3），P0 = 0、必须修项 = 0；PRD 定稿 SHA256 `8C010445...`，索引 P2 状态更新为「已定稿」。核心设计：description 固定句式 `在{domain}中担任{role}。{when}时调用`（P2-2）、槽位模式抽象 + 翻译闭环 + 模式登记册（P2-8）、gen-agents 全家退役（P2-3）、草稿→确认→替换（P2-4）。
- **dc-translator 设计已落**：`docs/after/20261019131757-dc-translator-design.md`（未决：设计已认可，实现押后待 P2 管线建成；作为第一个新增 agent 走 W5 旅程）。
- 验证证据：见元信息表『验证基线』（单源）。
- 提交状态：已 commit（HEAD `4ba7c13` = PRD 修订 + dc-translator 设计 + 索引更新；由用户提交）。
- 工作树异常：无。

## 过程记录

- P2 PRD 评审账本：`d:\Seed\retro-skills\.session\reviews\2026-10-19-0950-docgen-p2-prd\`（**先读 `progress.md` 尾部**：最终结论节；`cards.md` 含第 1–2 轮卡 + 族级摘要，`problems.md` 含全部 5 轮族台账 + P2 级遗留 P2-遗-1~9，`submission.md` 送审说明 + 各轮修复记录）。
- dc-translator 设计：`docs/after/20261019131757-dc-translator-design.md`（未决 + 待办 §11）。
- 历史交接词：`docs/handoffs/2026-10-18-p2-agent-generation-prd-review.md` → `docs/handoffs/2026-10-18-docgen-p1-review.md`（链式）。

## 本次任务

**P2 agent 生成拆 spec**；流程：拆 spec（prd-to-specs，按 agent 类一组，内部按对象粒度分任务）→ spec + 独立 testcase（`spec-testcase-gate` 判据 1–5，由 senior-sdet 全新上下文编写）→ spec + testcase 议会评审（一起送审）→ writing-plans → 实现（逐 agent 串行巩固）→ 代码审查 → 提交。起点：**拆 spec**。

## 范围依据

- 要读：
  - `docs/prd/20261019093443-docgen-agent-generation.md` 全文（§2 范围、§3 P2-1~P2-8、§4 接口、§5 验收 W1–W9、§6 逐步迁移、§7 交付物、§8 收口、§9 与 spec/testcase 关系——拆分提示在 §9）
  - `docs/prd/docgen-index.md`（§1 PRD 清单/状态、§2 D1–D18、§4 评审规则）
  - `.session/reviews/2026-10-19-0950-docgen-p2-prd/problems.md` §第 3–5 轮「P2 级遗留 P2-遗-1~9」（spec 拆分时逐条吸收）
  - `docs/after/20261019131757-dc-translator-design.md`（dc-translator = 第一个新增 agent 的试点对象，衔接 W5「新增 agent 入口」验收）
  - 现状参照：`skills/parliament/scripts/gen-agents.mjs`（ROLES 数据源）、`agents/senior-sdet.md`（手写转录对象）、`agents/reviewer-*.md`（13 席产物）
- 勿重做：P1 的 `tools/docgen-spike/`（V1–V11、gate、baseline、13/13 PASS）；P2 PRD 已定稿的决策与边界（P2-1~P2-8，用户多轮确认）。

## 开放问题

1. **P2 spec 的拆分粒度**（开工第一问，先决条件）——推断：按 PRD §9「agent 类一组」拆，即**一份 spec**（`2026-10-19-docgen-agent-generation-design.md`）+ 一份独立 testcase，内部按对象粒度（试点/senior-sdet/余下 12 席/草稿能力/终态验收）分任务；也可按对象拆多份。请用户：确认一份还是多份。
2. **testcase 数量与覆盖**——推断：按 W1–W9 九条验收 + 错误码（含 exit 4）+ 失败回退（6.4）+ 稳态旅程（6.5）设计，负例与边界 ≥ 正例（判据 3）。请用户：确认覆盖范围。
3. **P2 级遗留吸收**——P2-遗-1~9（未入队席计数、退出码五档、黄金快照时序等）在 spec 中吸收；推断：全部写入 spec 对应节 + testcase。请用户：确认是否全部吸收。

## 既定约束（不要重新讨论、不要重新选型）

- 单件流：做完一件 → 审 → 修，再下一件；本仓串行 —— `docgen-index.md` D11。
- 生成物禁手改；`npm run check` 只读重渲染并逐字节比对 —— D6。
- 只保留一个生成来源：docgen 吸收 gen-agents 的 ROLES 与 --check —— D14。
- `description` 只写触发条件；来源是触发表（P2 的 agent 侧解读见 PRD P2-2）—— D9。
- 存量按需迁移，不追溯 —— D16。
- v1 不做 spec 片段生成；spec 不参与生成 —— D18。
- P2 只做 agent；skill（P4）、rule 六骨架（P3）另行立项 —— 用户 2026-10-18 + PRD §2。
- 生成 agent/rule/skill 必须有草稿，不直接替换现有 —— 用户 2026-10-18（PRD P2-4）。
- P2 范围 = 13 席数据搬家 + senior-sdet 转录 = 14 个；真实内容转录仅 1 个文件 —— 用户 2026-10-18（PRD §2）。
- 逐 agent 串行巩固，同类不穿插 —— 用户 2026-10-18（PRD P2-7）。
- description 固定句式 / 槽位模式抽象 / 翻译闭环 / 责任边界（校验器打回 AI 重翻不推回用户）—— 用户 2026-10-19 多轮确认（PRD P2-2 / P2-8 / §1.1）。
- **spec 必须同批产出独立 testcase，一起送议会** —— `spec-testcase-gate` 规则（用户 2026-10-18）。
- **禁止主动执行 git 写操作**（commit/push 等），改动留工作区交用户决定 —— 用户全局规则。

## 遗留裁决与留观项

- L-007（正则扫源码被注释字面量误触发）、L-009（testcase 数值期望未复算）：账本 `D:\Seed\lessons\projects\retro-skills\ledger.md`，保持 open；收敛时机：下次触碰 testcase 静态检查时。
- P2 级遗留 P2-遗-1~9（未入队席 ≤3 计数、§8(b)(a) 对未入队席不适用、别名措辞、第 3–5 轮卡落盘、round-check 补做、退出码五档、黄金快照时序、拒红过滤、翻译三标准）—— 来源：`.session/reviews/2026-10-19-0950-docgen-p2-prd/problems.md`；收敛时机：本次 spec 拆分时吸收。
- dc-translator 实现押后（待 P2 管线建成）—— 来源：`docs/after/20261019131757-dc-translator-design.md`；收敛时机：P2 实现期。

## 开工前先做

1. `git status --short` 确认工作树 clean；`npm run check` 复核基线（应 0 findings / baseline 21/21 / ④ markdown 通过）。
2. 读 `docs/prd/20261019093443-docgen-agent-generation.md` §9「与 spec / testcase 的关系」+ §5 W1–W9 + §4 错误码（拆 spec 的验收锚点与接口）。
3. 读 `.session/reviews/2026-10-19-0950-docgen-p2-prd/problems.md` §第 3–5 轮 P2-遗-1~9（spec 拆分吸收清单）。
4. 读 `docs/after/20261019131757-dc-translator-design.md` §7 落地时机（衔接新增 agent 入口验收）。
5. 问用户：拆 spec 粒度（一份 vs 多份）+ testcase 覆盖范围（开放问题 1/2）。

## 开场话术

读 `docs/handoffs/2026-10-19-docgen-p2-spec-split.md`，按交接词继续：P2 agent 生成拆 spec（先问拆分粒度与 testcase 覆盖范围）。
