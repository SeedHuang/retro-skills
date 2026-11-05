# `docs-convention.md` 改造样本（前 → 后）

> 样本对象：全仓最复杂的一条规则，`rules/docs-convention.md`（176 行 / 12,645 字 / 占注入预算 28%）。
> 「改造前」= 原文逐字副本：[00-baseline/docs-convention-before.md](./docs-convention-before.md)
> 「改造后」= 下方三条（超出单条上限，故拆 3 份），实测共 153 行 / 6,666 字。
> **约束**：判据、边界、禁令一条不丢；只删叙事/实测/历史/内嵌理由，并把藏边界的句子提回正文。

## 一、逐段处置对照

| 原行 | 原文内容 | 判定 | 去向 |
|---|---|---|---|
| 1–3 | 标题 + 两段「用户原话 + 补记」 | 来源（叙事） | **压缩成 1 行来源锚** |
| 5 | 「第一分类维度是生命周期状态」 | 判据（设计原则） | 留，作首句 |
| 7–18 | 目录总表（8 行） | 判据 | 留（去说明性措辞） |
| 20 | 「prd 为什么单列一档」 | **伪装成理由的判据**（「需求定义 vs 实现设计」） | **提回正文**，理由删 |
| 22 | research vs reports | **伪装成理由的判据**（「还会被同一课题续写吗」） | **提回正文**，理由删 |
| 24–29 | 硬约束 1–3（after 语义 / 入口标未决 / 押后） | 判据 | 去 C |
| 30–32 | 硬约束 4（搬走扫引用 + 两个例外 + 运行产物判别法） | 判据 + 边界 | 去 A |
| 33 | 硬约束 5（探索稿不是第二份真相） | 判据 | 去 A |
| 35–45 | 命名表 | 判据 | 去 A |
| 47–55 | 三条总则 + 两类前缀不混用 | 判据 | 去 A |
| 57–60 | 机器判据 / 前缀取值 / 存量搬迁命令 | 判据（含唯一源声明） | 去 A |
| 62–67 | `retro/` 装什么/谁写入/何时删 + 「为什么不进 .session」 | 前三条=判据；最后一句=理由 | 判据去 A；理由去说明层 |
| 69–84 | after/ 阶段表 + 通用约束 4 条 | 判据 | 去 C |
| 86 | 「为什么值得单立一条」 | 理由 | 删，移说明层 |
| 88–98 | `.session/` 判据 + 一级只许文件夹 + 两条机械判据 + 「为什么」 | 判据 + 理由 | 判据去 B；理由压缩成 1 句 |
| 100–115 | 封闭清单表 + 仓库外判据 + 命名 | 判据（单元格内嵌理由需剥离） | 去 B |
| 117–134 | 待决事项：病根 + 判据表 + 三点「为什么」 | 判据表 + **禁令** | 表与禁令去 C；病根/理由去说明层 |
| 135–156 | 待办语义 + 禁 ✅ 档 + 清账判据 + 「为什么不能标记」 | 判据 + 禁令 + 理由 | 判据去 C；理由去说明层 |
| 158–164 | 硬边界 5 条 | 判据 | 去 B（1/2/3/4/5） |
| 166–176 | 与 landing-sweep 衔接 + 正例 | 判据 + 例子 | 判据去 A；正例去说明层 |

## 二、改造后（三条完整正文）

### 文件 A：`rules/docs-convention.md`

<!-- BEGIN FILE: docs-convention.md -->

# 项目文档按「生命周期状态」分目录

> 来源：用户 2026-10-07（分类与 after/）、2026-10-08（临时记录）、2026-10-23（整批改名例外）、2026-10-24（停用横幅例外）裁定｜说明层：`rules/references/docs-convention-rationale.md`

分类维度是**生命周期状态**，不是主题：已定稿与还在探索的放在一起会互相污染。

## 目录总表

| 目录 | 装什么 | 状态标记 | 什么时候搬走 |
|---|---|---|---|
| `docs/prd/` | 需求定义（要做什么 / 为什么 / 验收与 spec 路线图） | 明确写「待评审（未定稿）」或「已定稿」 | 不搬走；被后续 PRD 取代时原文保留 |
| `docs/superpowers/specs/` | 已定稿的设计 | 定稿即生效 | 被取代时原文保留不改 |
| `docs/superpowers/plans/` | 已排期的执行步骤 | 勾选框 + 进度表 | 执行完 → 勾选，不搬走 |
| `docs/handoffs/` | 某次 session 的收尾交接 | 一次性 | 永不改写（路径同步属例外）；新 session 另起一份 |
| `docs/after/` | 未完成 / 待决 / 悬置 | 明确写「未决」 | 做完 → 结论并入 spec，条目迁出 |
| `docs/research/` | 研究课题成果（一课题一目录，`index.md` 为入口） | 不标定稿/未决；**不得被当规范引用** | 不搬走；被后续课题取代时原文保留 |
| `docs/agents/` | 生成物（`README.md` + 每席一份） | 派生视图 | 不搬走 |
| 仓库根 | 体系总图、README | 长期 | — |

## 两类边界判据（问句即判据）

| 要判的事 | 判据 |
|---|---|
| PRD 为什么不进 `after/` 也不进 `specs/` | **「需求定义 vs 实现设计」**，不是「定没定稿」 |
| `research/` 与 `reports/` 怎么分 | **「将来还会被同一课题续写或修订吗？」** 会 → `research/`；不会 → `reports/` |

## `retro/`：审查复盘的归档位

- **装什么**：某次审查的轮次复盘（每轮暴露的可重复机制缺陷 + 长复盘全文）。
- **谁写入**：审查进行中写 `.session/reviews/<那一次>/retro-*.md`；**归档时机 = 最后一轮复盘写完立刻**。
- **什么时候删**：不删；只在结论已进 git（规则 / 测试断言 / spec）后删对应那份。

## 硬约束（跨目录）

1. **搬走时必须回头扫引用**：`after/` → `specs/` 后，指向它的指针（KB 索引、其它文档）一并更新；spec / plan / handoff 里的旧路径属历史，保留不改。
   - **例外（2026-10-23）**：整批改名（目录级前缀化 / 批量迁移）时，全仓统一改历史里的旧路径；**只改路径字符串，不动结论与判断**。
   - **运行产物不改**：`prompt.txt` / `stdout.json` / `response.md` / `*.log`。判别法：这段文字是「指向文件的链接」还是「当时运行留下的产物」？前者改，后者不改。
   - **例外（2026-10-24）**：功能被整体删除时，允许在已定稿 spec / 其 testcase / 已排期 plan 的**第一段**加停用横幅，只许三样：①状态 + 日期；②指向 `docs/after/` 停车记录的指针；③git 取回锚点（提交哈希）。**不得改结论句、不得改勾选框**。
2. **探索稿不是第二份真相**：结论一旦定稿只保留一处（spec），探索稿对应段落改为指向 spec 或删除，不并列两处说法。

## 文件命名

| 目录 | 命名形态 | 例子 |
|---|---|---|
| `specs/` | `YYYY-MM-DD-<主题>-design.md` | `2026-10-02-session-dir-layout-design.md` |
| `plans/` | `YYYY-MM-DD-<主题>.md` | `2026-10-02-session-dir-layout.md` |
| `handoffs/` | `YYYY-MM-DD-<主题>.md` | `2026-09-29-session-close.md` |
| `retro/` | `YYYY-MM-DD-<那一次>/retro-<轮次>-<主题>.md` | `2026-10-14-2248-review-all-to-death/retro-07-single-source.md` |
| `docs/prd/` | 时间戳加在主题条目上：单文件 `YYYYMMDDHHmmss-<主题>.md`；多文件用目录名 `YYYYMMDDHHmmss-<主题>/`，目录内文件用原名 | `20261024073606-dev-workflow-mainline/index.md` |
| `docs/research/` | 一课题一目录 `YYYYMMDDHHmmss-<课题>/`；目录内文件用原名；根层不放散文件 | `20261025133825-review-scope-and-sweep/index.md` |
| `after/` | `YYYYMMDDHHmmss-<主题>-<阶段>.md`（小写 kebab-case，前缀 = 文件创建时间） | `20261007201648-collect-requirements-exploration.md` |

**时间戳标记「这个事物在时间上的变动」与「当时的确定/快照」，不是装饰。** 三条总则：

| 总则 | 判据 | 例子 |
|---|---|---|
| 只加在多版本并存处 | 会随时间产生多份并存或需留住起点的才加；同一主题只加一层（主题是目录加目录名，是单文件加文件名） | `20261024073606-dev-workflow-mainline/` |
| 单份确定稿 / 配置不加 | 原地更新、不产生多版本的：`README.md`、`index.md`、`*-index.md`、`overview.md`；`rules/`、`agents/`、`skills/`、`.session/`、各类配置 | `docs/prd/docgen-index.md` |
| 父目录已带时间戳，子文件不加 | 路径上任一祖先目录名以 `YYYYMMDDHHmmss-` 或 `YYYY-MM-DD-` 开头 | `retro/2026-10-14-2248-xxx/retro-07-single-source.md` |

**两类前缀不混用**：兄弟目录带 `YYYY-MM-DD`（定格日期）；`prd/`、`after/`、`research/` 带 `YYYYMMDDHHmmss`（创建时刻）。

- **前缀取值**：文件创建那一刻的本机时间；之后阶段变化、内容更新都不改前缀。
- **存量与搬迁**：补前缀取实际创建时间（`Get-Item <path> | Select CreationTime`）；批量用 `npm run doc:migrate -- --dir <目录>`（默认 dry-run），单个用 `npm run doc:rename -- <旧> <新> [--apply]`。
- **机器判据**：命名合规一律以 `scripts/doc-name.mjs` 为准（`npm run doc:name`）；文字表与脚本冲突以脚本为准，改口径只改脚本与本节一处。

## 与 landing-sweep 的衔接

`docs/after/` 是「哪些没做」的权威入口；`landing-sweep` 反向也扫这里：待决项已做完的，必须从 `after/` 迁走，否则下次会被当成欠账。

<!-- END FILE: docs-convention.md -->

### 文件 B：`rules/session-dir-convention.md`

<!-- BEGIN FILE: session-dir-convention.md -->

# `.session/`：不进 git 的过程账本

> 来源：用户 2026-10-08、2026-10-24、2026-10-25 裁定｜说明层：`rules/references/docs-convention-rationale.md`

**判据**：关掉 session 之后还需要吗？需要 → 进 `docs/`（进 git）；不需要 → 进 `.session/`。

**一级只许「有明确目的的文件夹」**：第一层只能是文件夹，文件夹名必须说明装什么、什么时候能删；**散落在第一层的文件一律不合法**，唯一例外是本目录索引 `README.md`。

**判据（可机械判，两条同时生效，②为主）**：
① `Get-ChildItem .session -File` 的输出只能是 `README.md` 一个；
② `npm run check` 的 ⑤ 段自动执行同一判据（一级条目必须在封闭清单内；`sdd-*` 按前缀放行；`.session/` 不存在时跳过）。

## 封闭清单（加新的前先回答「为什么塞不进已有的档」）

| 落点 | 装什么 | 什么时候删 |
|---|---|---|
| `.session/reviews/<YYYY-MM-DD-HHMM>-<kebab-case>/` | 审查过程账：`progress.md`（逐轮追加）+ `problems.md`（漏斗）+ `retro-*.md`（0 或多个） | 处置完 → 整目录迁 `docs/superpowers/reviews/<同名>/` 后删副本；**`retro-*.md` 必须在 session 结束前先迁 `docs/superpowers/retro/`** |
| `docs/superpowers/reviews/<YYYY-MM-DD-HHMM>-<kebab-case>/` | 已处置完的审查全过程账（进 git） | 不删；被取代时原文保留 |
| `.session/rule-checks/checklist-<YYYYMMDD-HHmmss>.md` | 一次「编辑 rule」动作的自查账（rule-inspector 生成） | 该动作收尾（全行确认执行）后删；结论已进 git |
| `.session/tmp/` | 一次性中间产物：命令日志、临时脚本、抓下来的原文、草稿；**不得放结论/配置/跨 session 有用的东西** | session 收尾**必须为空**（⑤ 段逐个报残留） |
| `.session/sdd-<YYYY-MM-DD>-<主题>/` | 一次 SDD 执行的账（task brief / report / review / progress） | 收尾后整目录删；确需留档迁 `docs/superpowers/sdd/<同名>/` |
| `.session/temp/` | `tmp/` 的遗留同义目录；**新文件一律写 `tmp/`；本档只容留存量、不再新增用途** | 存量可清空；清空后可删；不构成本条先例 |
| `.session/myconversationwithai/` | 用户自有的对话归档草稿 | 由用户决定；不构成本条先例 |
| `.session/README.md` | 目录现状 | 不删 |

**仓库外的东西不进这里**：外部工具参考资料、跨仓库配置与草稿放 `C:\Users\HuangChunhua\.retro-skills\`。**判据：这份东西换到别的项目还用得上吗？**

**命名**：`reviews/` 用 kebab-case + 时间戳；中文标题写文件首行、不进路径；复盘文件 `retro-<轮次>-<主题>.md`；`rule-checks/` 用 `checklist-<YYYYMMDD-HHmmss>.md`。

## 硬边界

1. **`.session/` 里不放成果**：代码、测试断言、定稿结论都要进 git 或 `docs/`。
2. **一个用途只能有一个地方**：过程与进度 → `.session/`；结论与待决 → `docs/after/`。
3. **过程账的操作规程走技能 `review-log`**；本节只定义目录语义，两者不重复。
4. **`.session/` 已在 `.gitignore` 里，别去掉。**
5. **与 `.superpowers/sdd/` 不合并、不互相替代**：前者是审查过程与待办的账本。

<!-- END FILE: session-dir-convention.md -->

### 文件 C：`rules/after-doc-convention.md`

<!-- BEGIN FILE: after-doc-convention.md -->

# `docs/after/`：未完成 / 待决 / 悬置

> 来源：用户 2026-10-07、2026-10-08 裁定｜说明层：`rules/references/docs-convention-rationale.md`

## 放进 `after/` 的判据

**「这份文档现在能不能当结论引用？」** 能 → 进 `specs/`；不能（还在权衡、还有待决项）→ 进 `after/`。

- **入口必须写明「未决」与「何时该搬走」**，否则新 session 会把探索稿当定稿引用。
- **「已认可但细节押后」也要写进 `after/`，并标清押后理由**；用「parking / 押后 / 待触发时机」字样把「押后」与「废弃」区分开。

## 待决事项只有一处

判据 = **「这件事等多久、谁来解？」** 按此选表内一行；**表外事项不得另设落点**。

| 事项 | 落点 |
|---|---|
| 等用户拍板（可能等几天） | `docs/after/` |
| 等外部答复 | `docs/after/` |
| 等「我下一次动手」 | 不记账（写代码注释或 progress 未完成小节） |
| 这次审查跑到哪了 | `.session/reviews/<那次>/progress.md` |

**禁止**：`.session/` 下任何文件不得承载待决清单。

## 待办文件的语义

**一条待办能不能删，只看它现在还在等什么**；等不到任何东西 = 完成 = 删。

| 做完的东西 | 落点 |
|---|---|
| 建议落成规则了 | 规则正文 |
| 代码改完了 | 代码 + 测试断言 |
| 结论定了 | `docs/after/`（未决）或 `specs/`（已定稿） |
| 拿不走的（等外部、等授权） | 留，且写清「等什么、谁来满足」 |

- **禁止出现 ✅ 档**：勾选这个动作本身就是设计错误。
- **清账判据**：一个待办文件里超过一半是 ✅ → ①未完成的迁进新文件；②已完成的整段删掉。

## 阶段标记

`after/` 文件名 = 创建时刻 + 主题 + 当前阶段：`exploration`（还在探索）/ `gap-analysis`（查差距）/ `open-decisions`（只剩待决）/ `done`（全部待办已做，瘦成已完成区）。

## 通用命名约束

- 小写 kebab-case；**禁用**中文、空格、`YYYY-MM-DD-` 前缀、`.`（除扩展名）。
- **一主题一份**：同一主题的待决项追加到同一篇，不新建。
- **唯一例外**：单篇待办超过 15 条时，按同主题内不同类别拆两篇，**两篇开头互相写指针**；拆出来的必须是同主题的不同类别。
- 名字写「主题」不写「类别」：`collect-requirements-exploration` ✅ / `exploration-doc-1` ❌。

<!-- END FILE: after-doc-convention.md -->

## 三、说明层骨架（新增，按需读，不进每轮注入）

`rules/references/docs-convention-rationale.md`：

```md
# docs-convention 说明层

## R1 为什么按生命周期分目录（2026-10-07 / 2026-10-08）
- 用户原话：……（原文见 git 历史）
- 病根：未定稿讨论只能留在对话里 / 长期与短期混放。

## R2 `.session/reviews/` 为什么"迁后删副本"（2026-10-18）
- 病根：此前 26 个目录从未被删；直接删会丢过程账。

## R3 待决事项为什么只能有一处（2026-10-08）
- 病根：分界线曾画成"临时 vs 长期"；实测同一件事两处各有一份。

## R4 为什么禁止 ✅ 档（2026-10-08）
- 实测：8 条已落地建议 + 5 条已做完改动长期挂着；半年后分不清哪行是活的。

## R5 命名为什么值得单立一条
- 反例：collect-explore.md / 收集需求.md / 2026-10-07-collect.md 三种风格并存。

## R6 landing-sweep 正例
- 2026-10-07 建 `docs/after/20261007201648-collect-requirements-exploration.md`，并在 KB index「重启前待决」加指针。
```

## 四、体积对比

| 项 | 改造前 | 改造后（实测） | 变化 |
|---|---|---|---|
| 条数 | 1 | **3** | +2 条（每条独立可判） |
| 总行数 | 176 | **153** | −13% |
| 总字数 | 12,645 | **6,666** | **−47%** |
| 最大单条 | 12,645（占注入预算 28%） | **3,489**（`docs-convention.md`，约占 20k 预算的 17%） | −72% |
| 单条明细 | — | A 69 行 / 3,489 字；B 36 行 / 1,915 字；C 48 行 / 1,262 字 | — |

**一个诚实的偏差**：拆完后最大一条 3,489 字，**仍高于建议的 3,000 上限**。两条退路：①把上限设成 3,500 字；②把 A 里的「文件命名」表再拆成第 4 条。我倾向 ①——3,489 字已经在可执行范围内，再拆会让"命名规则"和"目录规则"割裂。
