# 当前要做的事（未决）

> 起笔 2026-10-17 / 最近更新 2026-10-24｜状态：**未决 / 活账本**｜落点：`docs/after/`（进 git）。做完一条删一条（不设 ✅ 档）；全部做完时瘦成一句话并改名 `20261017210609-pending-work-overview-done.md`（前缀保留原创建时间）。
> 2026-10-24 清账：已完成的线（A 议会小毛病 / C systematic-repair 关闭 / E 执行力度矩阵 / F 的 S3+S4+第 1 件 / H 评测工装关闭）**整段删除**，只留下面的未决项；历史见 git 与各自 spec / 停车文档。

## 线 B：rule-writer / rule-inspector 的 41 个问题（未开工）

议会验收抓出两技能 41 个问题（6 严重 / 10 中 / 25 轻）。**不逐条修**，按病根归 6 类、一类一类修：①词表与检查规则对不上 ②草稿评分与命令不完整 ③判断结果没留档 ④同物多名 / 数字对不上 ⑤文档模板旧内容（含一条教违规 git 操作） ⑥测试覆盖不全。

- 修法方案：`docs/reports/2026-10-16-1-rule-writer-rule-inspector-深度评审报告/soluation.md`（六簇）
- 触发：动手修这一批时，顺带看线 D-2 的「按病根分组修复编排」要不要落载体

## 线 D：两个留观（不急）

1. 议会的审计数数可脚本化——跑熟（>3 场）后再考虑。
2. 「按病根分组的修复编排」是否需要独立载体——修 41 问题时按真实卡点定，不预先设计。

## 线 F：docgen P2 剩余三件（待用户拍板）

| # | 事项 | 现状 / 下一步 |
|---|---|---|
| 2 | `tools/execution-matrix/criteria.md` C 组缺「模板形态适配」条款 | C1/C4 按「回答列 / 证据列」写，手写卡无这两列会被系统性误伤；属判据正文变更，要按变更流程走 |
| 3 | agent 来源行只有「维护来源」、无「权威来源」 | 仅 `senior-sdet` 有来源行，答得出「怎么来的」、答不出「谁授权」；机制已就绪（走变更段 `diff` → `replace --expect-change … --rejudge none`）；统一 14 席属范围变更，需改 spec 重走议会 |
| 4 | `changes[].judged[]` 只能转录、不能证明独立重判 | `--rejudge` 只给键名，`verdict` 取自注解现值，`judgedBy` 靠 env `DOCGEN_JUDGED_BY`，独立性无机械校验；**等用户拍板是否另起 spec 定「重判落账通道」**；另：`DOCGEN_JUDGED_BY` 是第 4 个 env，spec §8 只列 3 个，收口时要么补进 spec、要么换通道 |

## 线 G：历史 plan 里的 git 写步骤残留（待拍板）

`docs/superpowers/plans/2026-09-29-aas-skill-deps.md` 有 9 组 `git add` + `git commit`（18 行），与「计划禁止 git 写步骤」冲突，照做会误执行。其余 12 份 plan 的 `git add/commit` 字样均为禁令声明，合规。

- 二选一：① 只改这一份，把 commit 步骤改为「改动留工作区」；② 13 份历史 plan 统一在开头加免责声明、正文原文保留。

## 线 I：主 Agent ↔ SDET 互测（沉淀为 skill；试行中）

spec 作者与 testcase 作者在**提交议会前**互测：SDET 攻 spec 的盲区 / 悖论 / 不闭环；主 Agent 攻 testcase 是否对得上需求；双签后才可送审。

1. **定落点**：倾向 A——新建 skill `pre-submission-crosscheck`（SKILL + `references/spec-attack.md`、`references/testcase-vs-requirements.md`、`assets/clarify.template.md`），`parliament` 加闸门「缺 `clarify.md` 双签 → 不得开评」；B（并入 senior-sdet + 送审前置）改动小但动作被拆两半。
2. **写判据（可机械判）**：SDET 每条攻击带「两处原文 / 一个走不通的构造」；主 Agent 每条带「TC 号 + 判据行 + 对应 R/§」；缺证据不进结论。
3. **双向拒绝权**（用户 2026-10-23 补充）：双方都可拒绝对方建议，但须同时给 ①依据 ②认输判据 ③替代或「保留 + 复活条件」；「不想改 / 改动大」不是理由；`clarify.template.md` 每条争议三列必填，缺一列不计入一致结论。
4. **接入闸门**：`parliament` 送审必带件加 `clarify.md`（双签 + 未闭合差异清单）。
5. **试行复盘**：用 skill-eval-harness 那次的互测记录验证措辞，再定稿。

- 验收：`skill-inspector` 体检通过 + 下一次 spec 提交时实际走一轮、`clarify.md` 为开评必需件。

## 收尾提醒

- 不自动提交 git，改动留工作区。
- 每步跑 `npm run check`，全绿才算完。
- 议会相关文件走「改源头 → 生成 → 校验」，禁止手改生成物。
