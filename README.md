# retro-skills

一套把「开发过程犯过的错」沉淀成**自动生效规范**的 Agent Skill 套件：采集事实 → 复盘分析 → 归置落地（自动化 / rule / skill / memory），并维护一份跨项目累积的错题集。

## 这套东西解决什么问题

踩过的坑如果没有**固定的去处**，就只能靠人记——人会忘，换了项目、换了对话更是全丢，同类错误反复犯。

本套件把"踩坑"变成一条固定流水线：

```
踩坑/踩坑信号 → 采集事实 → 复盘分析 → 落成能自动生效的载体 → 沉进错题集 KB
                (retro-collect)  (retro-analyze)  (retro-institutionalize)      (managing-lessons-store)
```

**关键机理**：复盘产出的载体（全局规则 / 技能 / 自动化）不是文档——它们经活链（symlink / junction）接入运行时目录，**改源即生效**。所以复盘结论不会躺在报告里，下次对话自动带着。整套流水线的入口、路由与库维护由另外两个技能承担：`using-retrospective`（判断时机、路由）与 `managing-lessons-store`（管库）。

## 安装

```bash
# 从本地路径
npx skills add <本仓库路径> --agent trae-cn -g
# 发布后从 GitHub
npx skills add SeedHuang/retro-skills --agent trae-cn -g
```

`-g` 为全局（跨项目）。安装默认使用 symlink 模式（单一事实源、便于更新）。

> ⚠️ **装好后不要再对同一批技能跑 `npx skills add` / `skills update`**：它会把活链**静默换成副本**（副本不跟源更新，等于第二份真相）。误装后用 `aas sync --replace` 换回活链即可修复（详见 `docs/architecture-history.md` §9 V3 / `docs/architecture.md` §8.1）。

## 怎么用：场景速查

拿不准用哪个时看这张表（详细说明见下一节）：

| 你现在的处境 | 用哪个 |
|---|---|
| 阶段 / 里程碑收口、session 收尾，想复盘 | `using-retrospective`（入口，自动路由） |
| 要复盘，但还没有事实包 | `retro-collect` |
| 有事实包，要分析出问题 / 根因 / 优先级 | `retro-analyze` |
| 复盘已有结论，要把教训写回规范 | `retro-institutionalize` |
| 要改 rule / skill / 自动化本体（施工） | `evolving-skills` |
| 要验证某个**已落地**的 skill / rule / 自动化有没有效 | `retro-verify` |
| 要评审 PRD / spec / 技术方案文档，找逻辑漏洞、悖论、盲点 | `multi-lens-review` |
| 已有定稿 PRD，要拆成可独立开发的 spec 与路线图 | `prd-to-specs` |
| 库未初始化 / 库要搬家 / 会话开始轮询 / 看库的规模与薄弱面 | `managing-lessons-store` |
| 审查最近一次提交引入的冗余代码，抽取合并、出审计报告 | `dry-refactor-newadd` |

典型闭环：**喊入口 → 采事实 → 复盘分析 → 归置落地 → 验证（`retro-verify`）**。落地的载体（规则 / 技能 / 自动化）在活链上，**改源即生效**——下次对话自动带着，不需要任何人记得"上次学到了什么"；改完由 `retro-verify` 看**有没有真管用**。

## 技能与规则：各自的作用与使用时机

详细说明不在 README 里（避免越写越长），拆到独立指南——与上一节「场景速查」配合看：

- **技能**（十三个，各自的作用与使用时机）→ [`docs/guide/skills/`](docs/guide/skills/README.md)
- **全局规则**（十五条，各自的作用与适用范围）→ [`docs/guide/rules/`](docs/guide/rules/README.md)

## 一个完整例子（真实闭环：2026-09-29 回显污染事故）

这是本套件第一次完整跑通的真实案例，全过程可追溯（KB 错题集里有全部产物）：

1. **踩坑**：上一 session 遭遇工具回显污染（假 diff → 假文件路径 → 假 git 输出 → 伪造完整工具调用），连续多步编辑被吞，靠用户手动提交才收口——事故当时没立教训
2. **采集**（`retro-collect`）：新 session 开工复盘，落事实包 `2026-09-29-echo-incident-facts.md`——时间线、计数、异常事件，每条带证据原文（git 实跑输出 / 文件直读行号），零判断
3. **分析**（`retro-analyze`）：产出复盘文件（3 个问题、根因、P1/P2 优先级，只引事实包条号）+ 账本追加 **L-019**（状态 `open`）
4. **归置**（`retro-institutionalize`）：按决策树判定为 Step 1a（既有规则触发面未覆盖 → 扩既有），用户裁决扩写全局规则 `import-guard.md`——新增"硬规则 4：编辑确认只信磁盘读回，不信工具回执"（带 provenance：来源 L-019；旧版先备份进 KB）；账本改 `landed(→rule(全局))`
5. **自动生效**：规则源在活链上 → 当天新对话即带上硬规则 4，并在同日一次疑似回显异常中按此纪律拦住（只信磁盘读回，未造成数据问题）——**闭环完成，教训不再依赖任何人记得**

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
| 全局规则源（如 `my-rules/rules/`） | `~/.trae-cn/user_rules/` | symlink |
| 本仓库 `skills/` | `~/.trae-cn/skills/` | junction |

同步 / 体检 / 安装由独立 CLI `aas`（agent-assets-sync）承担。**安全默认：`aas sync` 只建缺失的链接，删类动作要显式 flag**。命令全集、退出码（`0` 一致 / `1` 有差异 / `2` 出错）与配置细节见 `docs/architecture.md` §8.1（或 `agent-assets-sync` 的 README）。

## 会话开始的固定动作

每次会话开始先跑推迟项轮询（`lessons.mjs deferred`），报告**必须带计数**（如"推迟项 9 条，命中 2"）——有命中先向用户提出，无命中一句话带计数报告。防的是：挂账的事项没人记得、悄悄蒸发。

## 仓库结构

- `skills/<技能名>/` —— 技能源（`SKILL.md` + `references/` + `assets/`；**改源即生效**，运行时是只读链接）
- `docs/architecture.md` —— 体系总图与全部裁决（含执行顺序、待验证项、隐患挂账）
- `docs/superpowers/` —— spec / plan（**已定稿**的设计 / **已排期**的执行）
- `docs/handoffs/` —— 跨 session 交接词（每个 session 收口的交接事实；**一次性快照，定格不改**）
- `docs/after/` —— **未完成 / 待决 / 悬置**的事项（活的账本，做完迁走）——由 `writing-after-docs` 写；目录语义见全局规则 `docs-convention`

## 设计文档

- 体系总图与全部裁决：`docs/architecture.md`
- 套件设计：`docs/superpowers/specs/2026-09-27-retro-suite-design.md`

## License

MIT
