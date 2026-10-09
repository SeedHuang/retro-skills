---
name: use-rule-skills
description: 入口：新建/优化规则——判定意图 → 路由 rule-writer 起草 / rule-inspector 评分 → 草稿箱管理 → 报告。触发「新建 rule / 优化这个 rule / 裸调用」；依赖 rule-inspector + rule-writer；不自动触发。
---

# use-rule-skills：新建/优化规则的统一入口

## 触发条件

用户说「新建 rule / 我要建 rule」、带路径说「优化这个 rule / 帮我优化这条规则」，或裸调用（只提规则相关但不带明确意图）时触发。**不自动触发**——产出/改动规则是有副作用动作，按 `global-ask-before-acting` 须先沟通确认方向。

## 入口路由（判定意图）

入口第一步必做：判定用户意图，判定表见 `references/routing.md`。

- 显式「新建」→ **新建路径**
- 带路径 /「帮我优化」→ **优化路径**（路径指向 `my-rules/rules/<name>.md`）
- 裸调用（什么都没说）→ **默认新建**

## 两路径流程

新建（8 步）与优化（6 步）的完整流程口径、草稿箱交互（§3.3）与生命周期（§3.4）逐字见 `references/flows.md`，按它执行。核心纪律：

- **入口不自动认领任何草稿**——识别权全给用户；时间戳只用于排序展示，绝不用于自动选择。
- **删除永不静默**——有草稿必问；采纳删除必确认。

## 草稿箱

草稿放 `<用户目录>/.retro-skills/rule-drafts/`（`os.homedir()` 解析，跨平台；Windows = `C:\Users\<名>\.retro-skills\rule-drafts\`）。脚本 `scripts/drafts.mjs`（命名约定 `<规则名>--<YYYYMMDD-HHMMSS>.md`）：

| 命令 | 作用 |
|---|---|
| `node scripts/drafts.mjs ensure` | **幂等**建目录（存在则跳过）；入口每次运行第一步必跑 |
| `node scripts/drafts.mjs ls [规则名]` | 列出草稿，可按规则名过滤；按文件名时间戳倒序；每行 `<名字>（创建 <时间>）` |
| `node scripts/drafts.mjs rm <草稿>` | 删除指定草稿 |
| `node scripts/drafts.mjs rm --rule <规则名> [--keep <草稿>]` | 按规则删除：不带 `--keep` = 删该规则名下所有草稿；带 `--keep` = 保留指定草稿、删其余 |

## 报告

按 `assets/report-template.md` 模板出报告（新建与优化共用骨架，优化多「对比」段）。**数字必须实测**（inspector 跑出来的真数，不是估算）；**不附取数命令**（报告是摘要，不是操作手册）；涨/掉都列，不藏负变化。

## 落地（采纳时）

1. 确认最终 rule 名 → 写 `my-rules/rules/<规则名>.md`（只建源仓库）。
2. `aas sync`（在 `D:\Seed\my-rules` 跑，只建缺失链接）。
3. 删该 rule 名下所有草稿（`drafts rm --rule <规则名>`）——**删前提示一次**「将删除该规则名下所有草稿，要保留的先移出草稿箱」→ 用户确认后删。

## 去哪读

- 意图判定表：`references/routing.md`
- 两路径流程 + 草稿箱交互/生命周期：`references/flows.md`
- 报告模板（输出用）：`assets/report-template.md`
- 草稿箱脚本：`scripts/drafts.mjs`
- 判据权威（评分/判据定义）：`rule-inspector/references/criteria.md`
- 写作指引（起草/自查）：`rule-writer/references/writing-guide.md`
