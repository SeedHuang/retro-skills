# Session 交接：rule 判据全集 + 技能套件（inspector/writer）spec 与 plan 定稿，待实现（2026-10-09）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-09（本机时区 Asia/Shanghai） |
| 项目根 | `D:\Seed\retro-skills` |
| 本次产出 | **2 个 spec + 2 个 plan 已定稿并 review 核销**（rule 判据与技能套件 + global-ask 重写），待新 session 实现 |
| 作用对象仓库 | `D:\Seed\my-rules`（规则正文；本 session 已改 `no-git-write.md` 并 aas sync 生效） |
| 验证基线 | spec/plan 经 review-loop 多轮核销（P0/P1/采纳P2=0）；实现时按 plan 的验证命令 |
| 状态 | **spec/plan 定稿，等实现**。实现方 = 新 session 的 agent，按 plan 走 |

## 本次任务（已完成）

**产出「规则体检/编写套件」的设计与计划**——四个文档已定稿：

| 文件 | 内容 |
|---|---|
| `docs/superpowers/specs/2026-10-09-rule-suite-design.md` | **Spec A**：判据全集（检查点 1 分制）+ rule-inspector + rule-writer 套件（**自包含**） |
| `docs/superpowers/specs/2026-10-09-global-ask-rewrite-design.md` | **Spec B**：global-ask-before-acting 重写（模式开关语义，独立后做） |
| `docs/superpowers/plans/2026-10-09-rule-suite.md` | **Plan A**：Spec A 的实现计划（7 任务，先做） |
| `docs/superpowers/plans/2026-10-09-global-ask-rewrite.md` | **Plan B**：Spec B 的实现计划（2 任务，依赖 Plan A 的 inspector） |

历史产出（已提交 `6f7290f`）：`rule-optimizer` 技能本体（SKILL.md/rule-template/criteria/recipes/score.mjs/score.test.mjs/skilldependencies）——**Plan A 会把它改造为 `rule-inspector`**。

## 关键裁决（用户 2026-10-09 定的，实现时不得推翻）

1. **计分方式（用户裁决）**：**每检查点 1 分，满分 = 当前检查点总数（现 24 项）**；报告用「得分/满分」（如 20/24）；**加新检查点只增满分，不重算比例**；级别按**得分率**（健康 ≥90% / 预警 70–89% / 超标 <70%）。
2. **判据维度**：废弃「强度档位」（绝对禁止/禁止/必须都是 must 级，非强度）→ 改**极性**（做/不做）。新增：**执行力度 8 项**（极性/动作内容/条件精细/来源覆盖/冲突裁决/例外从严/触发机制/验证闭环）+ **冗余度**（形式层脚本可查 + 语义层三检验报告）+ **标题评分**（判据式/极性动作对象/反映关键前提/内容一致性）。
3. **global-ask-before-acting 语义 = 模式开关**：用户主动对话 → 规则适用（不擅自执行写代码，主动给新角度）；用户给执行指令 → 退出；执行中用户再对话 → 重新适用。新标题「沟通中未获允许，不得开始执行写代码」（补「沟通中」前提）。
4. **套件拆分**：判据 + 技能套件（inspector/writer）一个 spec（先做）；global-ask 重写独立 spec（后做，重写后用 inspector 验证）。
5. **no-git-write 扩展（已落地生效）**：写实现计划禁止 git add/commit/push 步骤（writing-plans 模板冲突以本规则为准）；**防掠过**——规则不因来源豁免（plan 步骤/子代理/脚本都不算「用户明确要求」，用户在本对话直接说出才算）。
6. **报告模板固化**：`rule-inspector/assets/rule-report-template.md`——检查点明细 + 组 summary（X/N）+ 整体 summary（X/N + 得分率 + 级别）+ 二次审查结论 + 验证。

## 实测结论（影响实现的认知）

- **子代理也加载 user_rules**（实测：implementer 能看到 no-git-write 含最新防掠过小节）——规则「传递」天然存在（全局注入），不必设计传递机制；被掠过的根因是**规则文本层的防掠过不全 + 例外误判**。
- **执行力度核心洞察**：范围大 ≠ 会被掠过（「禁止在 typescript 使用 console.log」宾语可枚举就不掠过）；掠过发生在**触发描述需执行者做语义归类**时。

## 下一步（新 session 要做的事）

1. **执行 Plan A**（`docs/superpowers/plans/2026-10-09-rule-suite.md`，7 任务）：rule-optimizer → rule-inspector 更名 → 判据落地（24 检查点）→ score.mjs/test 扩展 → rule-writer 建好 → skilldependencies + aas sync → 全量基线报告。
2. **执行 Plan B**（`docs/superpowers/plans/2026-10-09-global-ask-rewrite.md`，2 任务）：重写 `my-rules/rules/global-ask-before-acting.md`（正文在 Spec B §3 逐字给出）→ aas sync → rule-inspector 报告验证。
3. **全程遵守**：不 commit（改动留工作区，最终交用户决定提交）；判据以 Spec A §2.4 为准（实现者同读 spec）。
4. 执行方式建议：**Subagent-Driven**（每任务子代理 + 任务间审查 + final review）。

## 注意事项 / 坑

- `skills/rule-optimizer/` 已在 git（提交过）——更名后 git 视角是 deleted+untracked，正常，最终用户提交时处理。
- 更名/新技能后必须 `aas sync`（在 `d:\Seed\my-rules` 跑）重建运行时链接。
- 基线报告（14 条规则的得分/满分/级别）写进 `docs/superpowers/handoffs/` 交付说明（进 git），不写 `.session/`。
- score.mjs 的测试不复制完整代码到 plan（避免副本漂移）——测试用例清单在 Plan A Task 3/4，判据以 spec 为准。
- 历史交接词：`docs/handoffs/`，本 spec 与 `2026-10-08-rule-optimizer-spec-handoff.md`（rule-optimizer 原设计）承接——Plan A 改造它。

## 未验证 / 无法验证的项

- score.mjs 的 24 检查点评分实现**未实跑**（spec/plan 是静态设计，实现按 Plan A Task 3 验证）。
- global-ask 重写后的 inspector 报告（标题/极性/执行力度）未出——Plan B 完成后验证。
- 全量基线报告（14 条规则新得分率）未取——Plan A Task 7 产出。
