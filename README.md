# retro-skills

一套把「开发过程犯过的错」沉淀成**自动生效规范**的 Agent Skill 套件：采集事实 → 复盘分析 → 归置落地（自动化 / rule / skill / memory），并维护一份跨项目累积的错题集。

## 这套东西解决什么问题

踩过的坑如果没有**固定的去处**，就只能靠人记——人会忘，换了项目、换了对话更是全丢，同类错误反复犯。

本套件把"踩坑"变成一条固定流水线：

```
踩坑/踩坑信号 → 采集事实 → 复盘分析 → 落成能自动生效的载体 → 沉进错题集 KB
```

**关键机理**：复盘产出的载体（全局规则 / 技能 / 自动化）不是文档——它们经活链（symlink / junction）接入运行时目录，**改源即生效**。所以复盘结论不会躺在报告里，下次对话自动带着。复盘流水线的入口、路由与库维护由一组独立技能承担，这组技能已归档到 `bak_skill/`（需要时取回）。

## 安装

```bash
# 从本地路径
npx skills add <本仓库路径> --agent trae-cn -g
# 发布后从 GitHub
npx skills add SeedHuang/retro-skills --agent trae-cn -g
```

`-g` 为全局（跨项目）。安装默认使用 symlink 模式（单一事实源、便于更新）。

> ⚠️ **装好后不要再对同一批技能跑 `npx skills add` / `skills update`**：它会把活链**静默换成副本**（副本不跟源更新，等于第二份真相）。误装后用 `aas sync --replace` 换回活链即可修复（详见 `docs/architecture-history.md` §9 V3 / §12.5）。

## 怎么用：场景速查

拿不准用哪个时看这张表（详细说明见下一节）：

| 你现在的处境 | 用哪个 |
|---|---|
| 要评审 PRD / spec / plan / 文档，找逻辑漏洞、矛盾、盲点，或用户说「开议会」 | `parliament` |
| 已有定稿 PRD，要拆成可独立开发的 spec 与路线图 | `prd-to-specs` |
| 审查最近一次提交引入的冗余代码，抽取合并、出审计报告 | `dry-refactor-newadd` |
| 要把一个需求按「PRD → 技术设计 → 计划门 → 实现 → 质量 → 交付」走完，或判断现在卡在哪一段、本段出口齐没齐 | `dev-workflow` |
| 要新建 / 移动 / 命名 `docs/` 下的文档，或判断内容该进 `after`、`specs`、`.session` 哪一档 | `docs-placement` |
| 要写 / 改 rule、skill、agent、references 的正文，或判断内容该放哪一层 | `carrier-conventions` |
| 要写或复核一条会影响别人决策的断言（判断 / 数据 / 方案），或验别人的话站不站得住 | `assertion-quality` |
| 要给用户讲清楚一件事（说人话、讲机理、举例子） | `plain-language` |

落地的载体（规则 / 技能 / 自动化）在活链上，**改源即生效**——下次对话自动带着，不需要任何人记得"上次学到了什么"。

## 技能与规则：各自的作用与使用时机

详细说明不在 README 里（避免越写越长），拆到独立指南——与上一节「场景速查」配合看：

- **技能**（清单见 `skilldependencies/manifest.json`；各自的作用与使用时机见指南）→ [`docs/guide/skills/`](docs/guide/skills/README.md)
- **全局规则**（清单见 `rules/`；各自的作用与适用范围见指南）→ [`docs/guide/rules/`](docs/guide/rules/README.md)

## 一个完整例子（真实闭环：2026-09-29 回显污染事故）

这是本套件第一次完整跑通的真实案例，全过程可追溯（KB 错题集里有全部产物）：

1. **踩坑**：上一 session 遭遇工具回显污染（假 diff → 假文件路径 → 假 git 输出 → 伪造完整工具调用），连续多步编辑被吞，靠用户手动提交才收口——事故当时没立教训
2. **采集**：新 session 开工复盘，落事实包 `2026-09-29-echo-incident-facts.md`——时间线、计数、异常事件，每条带证据原文（git 实跑输出 / 文件直读行号），零判断
3. **分析**：产出复盘文件（3 个问题、根因、P1/P2 优先级，只引事实包条号）+ 账本追加 **L-019**（状态 `open`）
4. **归置**：按决策树判定为 Step 1a（既有规则触发面未覆盖 → 扩既有），用户裁决扩写全局规则 `import-guard.md`——新增"硬规则 4：编辑确认只信磁盘读回，不信工具回执"（带 provenance：来源 L-019；旧版先备份进 KB）；账本改 `landed(→rule(全局))`
5. **自动生效**：规则源在活链上 → 当天新对话即带上硬规则 4，并在同日一次疑似回显异常中按此纪律拦住（只信磁盘读回，未造成数据问题）——**闭环完成，教训不再依赖任何人记得**

## 定论（实测简报）

> 结论先行；数字、口径与复跑命令都在「详情」页，引用时以详情页为准。

| 定论 | 简报 | 详情 |
|---|---|---|
| 四维 agent 评估（P2 / P4） | 理解 / 执行 / token 三维达线；性能维任务时延未判定。P4 原始样本未入库，按「结论可读、数据不可复算」引用；P2 评分链路可复现（基线 `d678028` / 样本 `fa67454`）。 | [P2 留档](docs/reports/2026-11-12-agent-model-p2-eval/README.md)、[P4 留档](docs/reports/2026-11-12-agent-model-p4-eval/README.md)、[P2 报告](docs/reports/2026-11-12-agent-model-p2-eval/report-p2-v2.md)、[P4 报告](docs/reports/2026-11-12-agent-model-p4-eval/report-round2.md) |
| 账本脚本填充 + 行定位（T0–T8） | 长账本定位 3 行：134 行 3662 字符 → 1486 字符（-59.4%）；固定 `--fields` + `--context 0` → 536 字符（-85.4%）。按 4 字符 ≈ 1 token 估算，单次约省 544 / 782 token。短账本默认输出反而更贵，需收窄字段。写侧脚本代写表头 / 8 行骨架 / 机算证据，AI 只补待判格。 | [观测](docs/reports/2026-11-13-ledger-script-fill-pilot/observe.md)、[试点后](docs/reports/2026-11-13-ledger-script-fill-pilot/after.md)、[基线](docs/reports/2026-11-13-ledger-script-fill-pilot/baseline.md)、[交接](docs/handoffs/2026-11-13-ledger-script-fill-t8.md) |

- token 数是「字符数 / 4」的估算，不是实测分词；短账本（32 行）默认 3 行查询 1608 字符 vs 全文 1402 字符，建议直接读或加 `--fields` + `--context 0`。
- 账本试点基线 `M=0`：历史 4 列账本会被 fill fail-closed 拒绝，round1..3 为 8 列重建夹具，未复现「错填 >0 → 0」的对照；调用次数基线为估算值。

**复跑脚本**

- 账本试点：[run-pilot.mjs](tools/review-ledger/scripts/run-pilot.mjs) — `node tools/review-ledger/scripts/run-pilot.mjs`
- 账本效率定论：[measure-token-efficiency.mjs](tools/review-ledger/scripts/measure-token-efficiency.mjs) — `npm run measure:ledger`（打印）/ `npm run measure:ledger:check`（比对）；回归守卫 [measure.test.mjs](tools/review-ledger/test/measure.test.mjs)
- 四维评分链路：[reproduce-p2-eval.mjs](docs/reports/2026-11-12-agent-model-p2-eval/raw/reproduce-p2-eval.mjs) — `npm run reproduce:p2-eval`；回归守卫 [reproduce-p2-eval.test.mjs](docs/reports/2026-11-12-agent-model-p2-eval/raw/reproduce-p2-eval.test.mjs)
- 账本全量测试：`node --test "tools/review-ledger/test/*.test.mjs"`

**测试脚本（回归守卫）**

- [measure.test.mjs](tools/review-ledger/test/measure.test.mjs) — 断言 `measure-token-efficiency.mjs --check` 通过，且 `--json` 数值与 README 定论一致；随 `npm run check` 执行。
- [reproduce-p2-eval.test.mjs](docs/reports/2026-11-12-agent-model-p2-eval/raw/reproduce-p2-eval.test.mjs) — 断言 P2 评分链路能从 `d678028` + `fa67454` 复现 `aggregate-v2.csv`；随 `npm run check` 执行。

## 错题集 KB（数据在哪、长什么样）

- **位置**：由用户指定，指针在 `~/.agents/lessons.config.json`；**本仓库不含任何个人数据，KB 绝不进本仓库**（2026-10-07 起 KB 可自建**私有** git 仓库作备份，但不得被套进本仓库或其它仓库——`resolve` 会拦）。
- **三区结构**：
  - `projects/<项目>/` —— 项目教训（账本 + 事实包 + 复盘 + rules-history/ 规则旧版备份）
  - `skills/<技能>/` —— 技能自身的教训
  - `universal/` —— 跨项目通用经验
- **账本表**（三区同构）：`ID | 日期 | 归属 | 来源 | 问题 | 根因 | 维度 | 修复 | 载体 | 状态`（2026-10-01 删除冗余「对象」列——与「载体」取值相同；维度取值 5 个：健壮度 / 产品体验 / 协作体验 / 性能 / 安全）
- **条目生命周期**：`open` → `landed(→载体)`；迁移留 `moved(→新位置)` 墓碑；废弃改 `closed(理由)`。条目只增不删。
- 全库编号 `L-NNN` 统一递增（编号计数器记录在 `index.md`）。

## 让结论"自动生效"：与 aas 的配合

复盘落地的载体必须**改源即生效**，运行时目录是只读的（改了会丢）：

| 源 | 运行时 | 形态 |
|---|---|---|
| 全局规则源（`rules/`） | `~/.trae-cn/user_rules/` | symlink |
| 本仓库 `skills/` | `~/.trae-cn/skills/` | junction |

同步 / 体检 / 安装由独立 CLI `aas`（agent-assets-sync）承担。**安全默认：`aas sync` 只建缺失的链接，删类动作要显式 flag**。命令全集、退出码（`0` 一致 / `1` 有差异 / `2` 出错）与配置细节见 `docs/architecture-history.md` §12.5（或 `agent-assets-sync` 的 README）。

## 仓库结构

- `skills/<技能名>/` —— 技能源（`SKILL.md` + `references/` + `assets/`；**改源即生效**，运行时是只读链接）
- `rules/` —— 全局规则源（纯 markdown；**改源即生效**，运行时是只读链接）
- `docs/guide/` —— 技能与规则的分部指南（README 只留速查，详情在这）
- `docs/architecture.md` —— 体系总图（现役架构现状；历史架构与执行顺序见 `docs/architecture-history.md`）
- `docs/superpowers/` —— spec / plan（**已定稿**的设计 / **已排期**的执行）
- `docs/handoffs/` —— 跨 session 交接词（每个 session 收口的交接事实；**一次性快照，定格不改**）
- `docs/after/` —— **未完成 / 待决 / 悬置**的事项（活的账本，做完迁走）——书写规范、目录 / 命名 / 生命周期见 `docs-placement`

## 生成 Agent 卡（维护者）

18 张 `agents/*.md` 是**生成视图**，唯一源是 `tools/docgen/models/agents/jsons/<seat>/index.json`（每席一个目录，含 `_baseline.json`）。改模型 → 生成卡 → 复核，用下面这组命令：

| 命令 | 作用 |
|---|---|
| `npm run agents:preview` | 全量 18 席渲染到 `tmp/preview/agents/`（不入 git，仅供查看） |
| `npm run agents:generate` | 全量 18 席**正式写** `agents/*.md`，写完自动清对应预览 |
| `npm run agents:check` | 只读：重渲染并与现有卡逐字节比对（漂移即 exit 1） |
| `npm run agents:verify` | `gate`：18 席逐字节 + `baseline N/N`（N 由 `rules.json` 派生，不写死；只读） |
| `npm run baseline:check` | 只读：校验 18 份 `_baseline.json` 仍与模型一致 |
| `npm run baseline:update` | 显式刷新基线（模型语义变更后使用，会写盘） |

单席操作在命令后透传参数，例如：

```powershell
npm run agents:preview -- --name reviewer-audit
npm run agents:generate -- --name reviewer-audit
```

约束：

- **正式写要求工作树干净**：除 `tools/docgen/models/agents/jsons/**`、`agents/**`、`tmp/**` 外有未提交改动会报 `DirtyWorkTree`（exit 2）；先提交或在分支上做，确需越过用 `--force`。
- `agents/*.md` 禁止手改；任何变更都从模型重生成。
- 规则（`rules/*.md`）仍走 `generate --kind rule --name <id> --apply`，不在上表。

## 设计文档

- 体系总图（现役）：`docs/architecture.md`；历史架构与执行顺序：`docs/architecture-history.md`
- 套件设计：`docs/superpowers/specs/2026-09-27-retro-suite-design.md`

## License

MIT
