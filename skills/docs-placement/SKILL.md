---
name: docs-placement
description: Use when 新建 / 移动 / 命名 docs 下的文档，或判断内容该进 docs/prd、specs、plans、handoffs、after、research、devworkflows、.session；也用于判断待办何时该搬走 / 删除，以及 .session 与 docs/bak 的语义。Do not use for 写文档内容本身（走 plain-language / carrier-conventions）、rule 正文（走 carrier-conventions）、技能资产目录（走 carrier-conventions）。
---

# 项目文档：按生命周期状态分目录

**第一分类维度是生命周期状态，不是主题。** 已定稿与还在探索的放一起，读者分不清哪句是结论、哪句还是猜测。

## 目录表

| 目录 | 装什么 | 状态标记 | 什么时候搬走 |
|---|---|---|---|
| `docs/prd/` | 需求定义：要做什么、为什么、验收与 spec 路线图 | 明写「待评审」或「已定稿」 | 不搬；被取代时原文保留 |
| `docs/superpowers/specs/` | 已定稿的设计 | 定稿即生效 | 被取代时原文保留 |
| `docs/superpowers/plans/` | 已排期的执行步骤 | 勾选框 + 进度表 | 执行完勾选，不搬 |
| `docs/handoffs/` | 某次 session 的收尾交接 | 一次性 | 不改写；新 session 另起 |
| `docs/after/` | 未完成 / 待决 / 悬置 | 明写「未决」 | 做完 → 结论并入 spec，条目迁出 |
| `docs/research/` | 研究课题成果：一个课题一个目录 | 不当规范引用；可执行部分必须已落到 rules / skills / specs | 不搬；被取代时原文保留 |
| `docs/devworkflows/` | dev-workflow 任务出口签字账：一任务一目录，固定 `gate-record.md` | 进行中可追加；收口后保留 | 不搬；同任务增量只追加、不改原结论 |
| `docs/reports/` | 一次性产出记录（评审报告 / 记账 / 证据正文） | 写完即封存 | 不搬 |
| `docs/bak/` | 退役载体的逐字留档（如 rules 原文） | 历史正文逐字保留；只允许补承接对照表与同步状态头里的路径字符串 | 不搬 |

## 硬约束

1. `docs/after/` 只放「还没做完」的：判据 = 这份文档现在能不能当结论引用；能 → `specs/`，不能 → `after/`。
2. 入口写「未决」与「何时搬走」；缺这两项，新 session 会把探索稿当定稿。
3. 「已认可但细节押后」也进 `after/`，并标 parking / 押后 / 待触发时机。
4. 搬走时回扫引用：从 `after/` 迁到 `specs/` 后，指向它的指针一并更新；整批改名时历史记录里的路径字符串一起改，但不得改结论；运行产物（`prompt.txt` / `stdout.json` / `response.md` / `*.log`）不改。
5. 探索稿不是第二份真相：结论定稿后只留一处（`specs/`），探索稿对应段落改为指向 spec 或删掉。

## 文件命名

| 目录 | 命名形态 |
|---|---|
| `specs/` | `YYYY-MM-DD-<主题>-design.md` |
| `plans/` | `YYYY-MM-DD-<主题>.md` |
| `handoffs/` | `YYYY-MM-DD-<主题>.md` |
| `retro/` | `YYYY-MM-DD-<那一次>/retro-<轮次>-<主题>.md` |
| `docs/prd/` | 单文件 `YYYYMMDDHHmmss-<主题>.md`；多文件 `YYYYMMDDHHmmss-<主题>/`，目录内用原名 |
| `docs/research/` | 一个课题一个目录 `YYYYMMDDHHmmss-<课题>/`，入口 `index.md`；根层不放散文件 |
| `docs/after/` | `YYYYMMDDHHmmss-<主题>-<阶段>.md`（阶段：exploration / gap-analysis / open-decisions / done） |
| `docs/devworkflows/` | 一个任务一个目录 `YYYYMMDDHHmmss-<任务名>/`，内固定 `gate-record.md` |

**时间戳三条总则**：只加在多版本并存处；单份确定稿 / 配置不加；父目录已带戳，子文件不加。两类前缀不混用：`YYYY-MM-DD` 用于定格日期，`YYYYMMDDHHmmss` 用于创建时刻。

**机器判据**：`npm run doc:name`。存量补前缀取文件创建时间，用 `npm run doc:migrate` / `npm run doc:rename`。

## `.session/`：不进 git 的过程账本

**判据一句话**：关掉 session 之后还需要吗？需要 → `docs/`；不需要 → `.session/`。

一级只许有明确目的的文件夹，散文件非法（唯一例外 `README.md`）。`npm run check` 的 ⑤ 段自动判；一级条目必须在封闭清单内。

封闭清单：`reviews/`（某次审查的过程账）、`rule-checks/`（一次 rule 编辑的自查账）、`tmp/`（一次性中间产物，收尾必须为空）、`sdd-*`（一次 SDD 执行的账）、`temp/`（`tmp/` 的遗留同义目录，不再新增用途）、`myconversationwithai/`（用户自有对话归档）、`README.md`（现状索引）。

**归档去向**：`reviews/<那一次>/` 处置完 → 整目录迁 `docs/superpowers/reviews/<同名>/`（进 git），再删 `.session/` 副本；`retro-*.md` 必须在本次 session 结束前先迁 `docs/superpowers/retro/`（`.session/` 不进 git，不迁就永久丢失）。

**硬边界**：`.session/` 里不放成果（代码 / 测试 / 定稿结论都要进 git 或 `docs/`）；一个用途只能有一个地方（过程与进度 → `.session/`，结论与待决 → `docs/after/`）；过程账操作规程不在本技能；`.session/` 已在 `.gitignore`；`.superpowers/sdd/` 是 SDD 工作区，不合并、不互相替代。

## 待决与待办

**待决事项只有一处：`docs/after/`，不设第二处。** 判据是「等多久、谁来解」，不是「在不在本次 session」：等用户拍板 / 等外部答复 → `docs/after/`；等「我下次动手」→ 不记账本；这次审查跑到哪 → `.session/reviews/<那一次>/progress.md`。

**待办文件的语义 = 还没做的事，不是做过的事的档案。** 能不能删只看一件事：它现在还在等什么？等不到任何东西了 = 完成 = 删。做完的去处：建议落成规则 → 规则正文；代码改完 → 代码 + 测试；结论定了 → `specs/`；拿不走的（等外部 / 等授权）→ 留，并写清等什么、谁来满足。

**不许出现 ✅ 档**：勾选会让做完的条目有合法容身之处，文件只涨不消。清账判据：超过一半是 ✅ 时，未完成的迁新文件，已完成的整段删；历史由 git 承担。

## 与落地回扫的衔接

`docs/after/` 是「哪些没做」的权威入口。按 `dev-workflow` 技能的回扫判据回扫时，反向也要扫这里：待决清单里已做完的项要从 `after/` 迁走，否则下次会被当成欠账。

## 适用范围

只管项目文档目录（`docs/`），不管技能资产目录——后者按 `carrier-conventions` 的三档骨架判。历史记录不改结论，只允许路径字符串同步（整批改名时）。

## 验证

- `npm run doc:name` → 输出「命名检查通过」；
- `npm run check` → ⑤ 段 `.session` 结构检查通过。
