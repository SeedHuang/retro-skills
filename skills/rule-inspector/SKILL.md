---
name: rule-inspector
description: 体检 rules/ 里的规则——按判据全集评分、出报告、给处方、防劣化。当用户说『体检 rules / 优化 rules』时触发。不自动触发。Do not use for 新建规则、按处方改规则正文（那走 rule-writer）、审查（那走 review-loop）。
---

# rule-inspector：判据驱动的规则检察员

## 触发条件

用户说「体检 rules / 优化 rules」时触发。**不自动触发**——体检活规则是高影响动作，按 `global-ask-before-acting` 必须先拿到指令。

**全库 `--dir` 体检须用户明确要求**（「体检全部规则」类指令）——agent 在修复 / 审查流程中只对**本次改动过的规则**跑 `--file` 复核，不自行扩到全库（2026-10-15 用户指令；既有欠账等用户明确要求才处理，见 `docs/superpowers/specs/2026-10-15-verification-audit-checklist-design.md` §3）。

## 不可越过（硬闸门，写在此处供每轮加载）

> 1. **禁止删除行为边界规则的判据句** —— 没有「问用户就能删」这一档，判据不可触碰。
> 2. **禁止改动判据措辞**，除非：报告「改前 vs 改后」两版 → **等用户确认** → 才落地。
> 3. **禁止为凑分数改规则** —— 分数是体检报告，不是验收标准，不及格不要求砍到线下。
> 4. **禁止把语义判断交给脚本** —— 三检验里的 #1 #2 由 AI 逐条判断并写进报告，不能只写「已检查」。
> 5. **删冗余必须在报告里写出三检验的验证过程** —— 不能只报「已精简」。
> 6. **标题一致性检查是收尾必做** —— 每次报告前对照标题与正文三句：①范围 ②极性 ③对象，全一致才算收尾（判据见 `references/criteria.md` §2.4 标题第 4 项）。
> 7. **检查项变更同步义务（增/改/删检查项时，不许跳过）** —— 每次增加 / 修改 / 删除判据、检查点、词表、处方，必须过同步清单**逐项核销**：① `scripts/score.mjs` 机械常量 ↔ `references/criteria.md` 判据/词表（单源，同批改）② `criteria.md` 检查点 ↔ `references/recipes.md` 处方 ③ 判据/词表 ↔ rule-writer 三层（SKILL 自查 / writing-guide 自查表 / rule-skeleton）④ 检查项 ↔ review 账本模板「验证查账」表行（删检查 → 查账行删；加检查 → 查账行补）⑤ **删检查项反向扫**：全仓 grep 其名字/锚点词，声明处逐个删（防「幽灵检查项」）⑥ **rule-edit-checklist 模板**（本技能 `assets/rule-edit-checklist-template.md`，rule 编辑查账清单的活模板；快照由本技能 `scripts/gen-rule-checklist.mjs` 从该模板展开生成）——检查项增删时同步其 A-F 组行。设计判据见 `docs/superpowers/specs/2026-10-15-verification-audit-checklist-design.md` §5——本条是**单源定义**，其它技能只引用不复制。

## 执行顺序（检查路径闭环，一次一条）

1. **跑评分**：`node skills/rule-inspector/scripts/score.mjs --dir <rules目录> --json`，记录总分与每条得分。**`--dir` 下传 `--cognitive` 会应用到目录内全部文件、误评机械动作型规则，故体检不传；cognitive 判定走 `rules/.inspector-annotations.json`（score.mjs 两种入口都自动发现）：先 AI 判规则是否含认知动作（判据 `references/criteria.md` §3.3b），判定为认知动作型的**写进 annotations 文件**（`{"文件名":{"cognitive":true,"x3Done":true}}`，x3Done 判定依据一行写进报告），再用 `node skills/rule-inspector/scripts/score.mjs --file <该规则> --cognitive` 逐条复核；「认知动作型 / 机械动作型」判定以 annotations 文件为准（可复算证据，判定资产化）。**
2. **出报告**：按 `assets/rule-report-template.md` 模板逐条出「分数 + 明细」报告。
3. **给处方**：对照 `references/recipes.md`，把每类违规映射到可复制的改法。
4. **修复**：一条一条改，**每条过硬闸门（上面 1–6）** 后才落地。
5. **二次审查**：改完重跑评分，**确认分数上升 / 问题核销**；没涨 → 复查改的是不是判据本身，而不是压分。
6. **最终报告**：出「分数 + 明细 + 二次审查核销结论」的终稿。

## 判据与处方去哪读

- 判据全集（来源类型枚举 / 层级规范 / 三检验 / 24 检查点 / 取数命令）：`references/criteria.md`
- 改法处方（每类违规 → 可复制的改法）：`references/recipes.md`
- 体检报告模板（输出用，spec §3 固化）：`assets/rule-report-template.md`
- 评分脚本（确定性、可复现）：`scripts/score.mjs`
