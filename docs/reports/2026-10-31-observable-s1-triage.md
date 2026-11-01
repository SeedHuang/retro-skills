# S1 首日基线分诊表（21 行）

> 落点与封存：本表是 S1（可观察判据）③ 段的**申报件**，写完即封存（不再被后续课题续写，故落 `docs/reports/`）。
> 口径出处：spec `docs/superpowers/specs/2026-10-31-observable-criteria-rollout-design.md` §9.3（`M + P + L = 21`、`exemptedLines = L`、`stale = 0`、`L ≤ 8`）；testcase 常量 14。
> 取数口径：9 词（剔 `完整`）+ **排除标题行**，按**行**计。取数命令（cwd = 仓根，2026-11-01 实跑）：

```powershell
((Get-ChildItem rules,skills -Recurse -Filter *.md | Select-String -Pattern '自省|客观|诚实|宽松|严格|清晰|准确|显著|良好') | Where-Object { $_.Line -notmatch '^\s*#' } | Select-Object -Unique Path,LineNumber | Measure-Object).Count
```

实跑 = **21**。

> 分类口径（三档互斥）：**改文案** = 能把评价换成可判表述（`M`）；**已合格** = 命中行所在最小语义块内本来就有可观察标记（`P`，**不为它补豁免**）；**合法保留** = 只许「术语引用 / 词表自身」（`L`，入豁免且 `reason` 写术语出处）。

## 逐行结论（21 行）

| path:line | 命中词 | 块内 marker（有/无） | 分类（改文案 / 已合格 / 合法保留） | 处置 | 豁免 reason |
|---|---|---|---|---|---|
| `rules/core-working-principles.md:36` | 自省 | 无 | 合法保留 | 不改（术语引用） | 术语引用，不是评价：「自省」是本仓规则概念名；同段已给可判载体（三性验证 / 判据树 / 长期方案落点）。出处 `rules/core-working-principles.md:36` |
| `rules/core-working-principles.md:71` | 自省 | 无 | 合法保留 | 不改（术语引用） | 术语引用，不是评价：「自省」指本规则「事前三步 / 出事之后」的动作名；同节已给可判动作清单。出处 `rules/core-working-principles.md:71` |
| `skills/dev-workflow/references/gate-record.md:14` | 宽松 | 有 | 已合格 | 不改不豁免 | — |
| `skills/parliament/SKILL.md:20` | 客观 | 有 | 已合格 | 不改不豁免 | — |
| `skills/parliament/assets/agent-template.md:13` | 自省,客观,诚实 | 无 | 改文案 | 改：`包容、客观、理性、自省、诚实；` → `逐条按证据判分歧、不确定项如实标注；` | — |
| `skills/parliament/assets/progress.md:100` | 客观 | 有 | 已合格 | 不改不豁免 | — |
| `skills/parliament/references/debate-protocol.md:32` | 诚实 | 有 | 已合格 | 不改不豁免 | — |
| `skills/parliament/references/host-duties.md:42` | 客观 | 无 | 改文案 | 改：`核实问题客观存在性` → `核实问题是否真实存在` | — |
| `skills/retro-collect/SKILL.md:3` | 客观 | 无 | 改文案 | 改：`采集一段开发过程的客观事实` → `采集一段开发过程的事实` | — |
| `skills/retro-collect/SKILL.md:136` | 诚实 | 无 | 改文案 | 改：`要**诚实列出并说明为什么**` → `要**如实列出并说明为什么**` | — |
| `skills/retro-collect/assets/facts-template.md:76` | 诚实 | 无 | 改文案 | 改：`必须诚实列出并说明为什么` → `必须如实列出并说明为什么` | — |
| `skills/retro-collect/assets/userwords-template.md:44` | 客观 | 无 | 改文案 | 改：`情绪轻（客观，` → `情绪轻（不掺评价，` | — |
| `skills/review-loop/references/loop.md:186` | 诚实 | 无 | 改文案 | 改：`至少诚实` → `至少如实说` | — |
| `skills/rule-inspector/references/criteria.md:57` | 宽松 | 有 | 已合格 | 不改不豁免 | — |
| `skills/rule-inspector/references/criteria.md:147` | 自省 | 无 | 合法保留 | 不改（术语引用） | 术语引用，不是评价：「自省」是 `rule-inspector` 认知动作清单里的一项。出处 `skills/rule-inspector/references/criteria.md:147` |
| `skills/rule-inspector/references/recipes.md:41` | 诚实 | 无 | 合法保留 | 不改（术语引用） | 术语引用，不是评价：「诚实」是 `criteria.md` 章节名「诚实边界」的一部分（指向性引用）。出处 `skills/rule-inspector/references/recipes.md:41` |
| `skills/rule-writer/assets/rule-skeleton.md:24` | 自省 | 有 | 已合格 | 不改不豁免 | — |
| `skills/rule-writer/references/writing-guide.md:39` | 自省 | 无 | 合法保留 | 不改（术语引用） | 术语引用，不是评价：「自省」是认知动作清单项（与 `rule-inspector` 同一术语）。出处 `skills/rule-writer/references/writing-guide.md:39` |
| `skills/rule-writer/references/writing-guide.md:104` | 宽松 | 无 | 合法保留 | 不改（术语引用） | 术语引用，不是评价：「宽松词」是 `rule-inspector` 的术语（指「一般 / 通常 / 可能允许」这类词）。出处 `skills/rule-writer/references/writing-guide.md:104` |
| `skills/use-rule-skills/references/flows.md:66` | 自省 | 无 | 已合格 | 围栏代码块内行**不参与判定**（spec §2 `:26`），不产出 hit，不豁免 | — |
| `skills/writing-after-docs/assets/after-template.md:44` | 客观 | 无 | 改文案 | 改：`**客观事实 + 取数命令**` → `**事实 + 取数命令**` | — |

## 对账（spec §9.3 / testcase 常量 14 / E08）

| 项 | 值 | 取数 |
|---|---|---|
| 改文案 `M` | **8** | 上表「分类」列现数 |
| 已合格 `P` | **7** | 同上（其中 6 行由「块内已有 marker」，1 行由「围栏内不参与判定」） |
| 合法保留 `L` | **6** | 同上 |
| 合计 `M + P + L` | **21** | 与取数命令 21 同值 |
| `exemptedLines` | **6**（= `L`） | `node scripts/check-observable.mjs --check --json` 的 `exemptedLines` |
| `stale` | **0** | 同上 `stale.length` |
| 未豁免 `hits` | **0** | 同上 `hits.length` |
| `L ≤ 8` | **成立**（6 ≤ 8） | 同上 |

**为什么 M 类的 `path:line` 仍有效**：M 类改写只在同一行内换词（未增删行），行号未位移；上表「处置」列给出改前 → 改后的原文片段，可逐条 `git diff` 复核。

**为什么不是全豁免蒙绿**：`L = 6` 只覆盖「术语引用」，其余 15 行（8 改文案 + 7 已合格）都不靠豁免；若把 21 行全填「合法保留」，E09 必红（`L = 21 > 8`）。

**为什么有一行「已合格」是围栏内的**：取数命令（`Select-String`）不区分围栏，spec §2 `:26` 规定围栏代码块内行**不参与判定**。故 `skills/use-rule-skills/references/flows.md:66` 在 21 行里但永不产出 hit（校验器实跑的 `hits` 不含它）——它既不改文案，也不该为它写一条永远不生效的空转豁免。
