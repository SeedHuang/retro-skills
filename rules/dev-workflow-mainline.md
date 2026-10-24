# 开发工作流主干：五段顺序、出口签字与长文取证

> 来源：PRD `docs/prd/dev-workflow-mainline/20261024073606-dev-workflow-mainline.md` §4 / §6 / §3.3；S1 spec `docs/superpowers/specs/2026-10-24-dev-workflow-skeleton-design.md` §5｜落地：2026-10-24
> 判据锚在 PRD，本规则只写义务句与出处，不复制 PRD 正文。

## 核心判据（R1–R7）

**唯一证据载体**：`skills/dev-workflow/references/gate-record.md`，固定表头 = `段 | 出口判据（逐条） | 核了什么（命令输出首行 或 path:line） | 申报人 | 签字人 | 结论`。R1–R7 全部指它；本规则不自存任何名单或状态标记——段名单与各段签字人以 PRD §4 段表为唯一来源。

| # | 判据（义务句） | 判定方式（可机械判的部分） | 出处 |
|---|---|---|---|
| R1 | 进入任一阶段前，必须确认上一段出口判据已齐；不齐不得开工 | `gate-record.md` 中该段的行必须齐 6 列，「核了什么」列不得为空、不得只写「已核」（须为命令输出首行或 `path:line`）；PRD §4 段表「议会」列非空的段，额外核该次议会通过记录 | PRD §4 |
| R2 | 不得自签出口 | 该行「签字人」≠「申报人」，且签字人必须是 PRD §4 段表该行「谁签」列所列角色；作者定义：PRD→产品经理、spec→主 agent、testcase→sdet、代码→开发、审计结论→审计 | PRD §3.3 |
| R3 | 议会只在两处插点；计划门不设议会 | PRD §4 段表「议会」列非空的段恰为 2 个（①、②），这两段在 `gate-record.md` 中各有行且「结论」列非空；计划门行的「签字人」含「审计」且「核了什么」含命令输出或 `path:line` | PRD §4 / §6 |
| R4 | plan 阶段发现 spec 未定义的东西，必须回流 spec 重审 | plan 文件出现 `## 新增设计决策` 节，或改动触及 spec 标记「不改」的行 → 违规（位置型判据，不靠语感） | PRD §6 |
| R5 | 产品经理改动功能点集合 = 「功能增删」类漂移，必须回 PRD 重签 §0 | 功能点 ID 集合 diff 非空，且 PRD §0 无重签记录 → 违规 | PRD §7.2 |
| R6 | 功能块按块滚动拆，不提前批量拆 | `gate-record.md`（或计划表）中「状态 = 拆 spec 中」的行数 ≤ 1（计数型判据） | PRD §4.1 |
| R7 | 引用长文的结论必须来自 `evidence-reader` 的取证摘要 | 送审 / 交接材料里引用了对话记录、评审账、规范原文的结论，必须带 `path:line` 且能追到一份 `evidence` 产出；无出处 = 违规 | PRD §10 F-17 |

**规则的边界**：R1–R7 只管「主干怎么走」。不写「怎么评审」（调用 `parliament` 技能）、不写「怎么拆 spec」（调用 `prd-to-specs` 技能）、不写「怎么写 testcase」（判据以 `spec-testcase-gate` 规则为准）——重复即漂移。

**为什么每条都要可机械判**：判据停在「说明里点出」时，规则每轮加载却判不出来，等于没有约束。R1–R7 的右列各自给出唯一判定动作（数行数 / 比两个字段 / 判节存在性 / 比集合），能机器判的部分一律机器判。

## 适用范围（不因来源豁免）

- 范围：`docs/prd/`、`docs/superpowers/specs/`、`docs/superpowers/plans/`、代码实现与交付审计这五类主线产物。
- 不因来源豁免——子代理、脚本、模板、AI 生成的产物同样要过；S1 之后新写的任务一律按五段顺序走。
- 只管主干顺序与签字归属，不改各段内部做法（拆 spec、评审、写用例的具体流程归各自技能）。

## 冲突裁决

与「这次先快速交付，回头补 spec」「先写代码再补 PRD」「签字人顺手代签」冲突时，以本规则为准。拿不准先停下说明，等用户确认再动。

## 例外

只有一类：**本规则生效（2026-10-24）前已定稿的存量 spec 不追溯**——按 `spec-testcase-gate` 规则的存量例外处理（用户 2026-10-18 裁定「存量不用管，逐个升级」，此处只承接该裁定，不另立口径）。

进 ③ 时必须在本段 plan 或交接材料里点名两件事：① 存量豁免的是哪几份 spec（写文件名）；② 升级时点 = 该 spec 下一次被修订并进入 plan 的那一刻（事件型，可核），或用户给出的具体日期。禁止把时点写成「看情况」这类不可核的表述。

## 触发时机

- 进入任一阶段（①、②、计划门、③、④、⑤）之前；
- 写或改 `gate-record.md` 的任一行时；
- 把 spec / plan 送议会、或在 plan 阶段想新增 spec 里没写的设计时；
- 引用对话记录、评审账、规范原文下结论时；
- 交接、复盘或审计发现「出口未签就进下一段」时。

## 验证

两条自查命令，可在仓库根直接粘贴执行：

① 签字人 ≠ 申报人的行数 = 总行数（表头与分隔行不计）：

`node -e "const t=require('fs').readFileSync('skills/dev-workflow/references/gate-record.md','utf8');const rows=t.split(/\r?\n/).map(l=>l.trim()).filter(l=>l.startsWith('|')&&!l.includes('---')&&!l.includes('申报人'));const bad=rows.filter(l=>{const c=l.split('|').slice(1,-1).map(x=>x.trim());return !(c[3]&&c[4]&&c[3]!==c[4])});console.log('rows',rows.length,'bad',bad.length)"`

② 「拆 spec 中」行数 ≤ 1：

`node -e "const t=require('fs').readFileSync('skills/dev-workflow/references/gate-record.md','utf8');console.log('splitting',(t.match(/拆 spec 中/g)||[]).length)"`

两条的判据：① `bad 0`；② `splitting` ≤ 1。任一不满足即本规则未过，不得进入下一段。
