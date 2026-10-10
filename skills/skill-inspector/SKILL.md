---
name: skill-inspector
description: 体检 skills/ 里的技能——按 skill-authoring-convention 判据评分、出报告、给处方、修复优化。当用户说『体检 skills / 优化 skill / 检查技能』时触发。不自动触发。Do not use for 新建规则（那走 use-rule-skills）、改载体施工（那走 evolving-skills）。
---

# skill-inspector：判据驱动的技能检察员

## 触发条件

用户说「体检 skills / 优化 skill」时触发。**不自动触发**——体检活技能是高影响动作，按 `global-ask-before-acting` 必须先拿到指令。

## 判据权威

写 skill 的 7 项硬判据在 `skill-authoring-convention` 规则（每轮加载）；本技能只按它执行。

## 执行顺序（检查路径闭环，一次一条）

1. **跑检查**：`node <this-skill-dir>/scripts/check.mjs --dir <skills目录> --json`，记录每 skill 命中。检查脚本口径：`--dir` 须是**含技能子目录（各含 SKILL.md）的 skills 父目录**（传单个技能目录会报错）；扫描目标 = 目录下**真实存在的技能**（未登记 manifest 的新技能也扫——写新 skill 前置自查路径）；① 跨技能路径引用的「已知技能」= **目录真实技能 ∪ manifest 技能**（磁盘不存在且不在 manifest 的名字不报，`docs/` 等假阳性排除）；③ 守卫检查**排除 `*.test.mjs`**（测试里的违规 fixture 是断言素材，不算违规），覆盖 `scripts/` **直接子目录**下的 `.mjs`（嵌套子目录脚本暂不扫——出现嵌套 scripts 时再扩）。有 findings 时 CLI 退出码非 0（脚本化「0 findings 才交付」判定）。
2. **出报告**：按 `assets/report-template.md` 逐 skill 出「findings + 处方」。
3. **给处方**：对照 `references/recipes.md`，把每类命中映射到修法；**跨技能文件引用的「拆反引号 / 相对形式」**（check.mjs 抓不到）由 AI 体检时人工扫，线索见 recipes ①；**目录语义**按 `skill-assets-convention` 规则判（见 recipes ④）。
4. **处方确认**：把清单列给用户，用户勾选改哪些（按 skill 或按类别批）。
5. **修复**：按处方一条一条改；每条过硬闸门（判据措辞不动 / 删冗余过三检验 / 不凑分）。
6. **复检**：改完重跑 check.mjs，确认 0 findings。
7. **最终报告**：分数 + findings 明细 + 修复清单 + 残留（用户接受）。

## 写新 skill 的前置自查

写 skill 之前先读 `skill-authoring-convention` 规则；写完后跑 `node <this-skill-dir>/scripts/check.mjs --dir <skills目录> --json`，0 findings 才交付。

## 判据与处方去哪读

- 判据权威：`skill-authoring-convention` 规则（每轮加载）
- 修法处方（每类命中 → 可复制的改法）：`references/recipes.md`
- 报告模板（输出用）：`assets/report-template.md`
- 检查脚本（确定性、可复现）：`scripts/check.mjs`
