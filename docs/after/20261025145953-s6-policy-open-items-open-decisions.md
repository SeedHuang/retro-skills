# F-24（S6）收官遗留项：待办与押后清单

> 状态：**未决（不属于 F-24 的验收范围）**｜创建：2026-10-25 14:59:53
> 来源：议会 #3（F-24 / S6）账本 `.session/reviews/2026-10-25-111619-s6-policy-parliament/`（`problems.md` §七「候选」与 §十「P2 落态」）
> 搬走条件：下列每条「触发信号」出现时，把对应条目并入下一轮 spec 并从此文件删掉；全部清空后本文件改名为 `-done.md`（只留「已完成区 + 一句话」）。

## 1 下一轮（S6-B）候选

| # | 项 | 锚点 | 触发信号 | 为什么本轮不做 |
|---|---|---|---|---|
| A1 | 侦探固定清单第 4 项的命令副本（`git --no-optional-locks status --porcelain` + `commit|push|...`）改为从定义层生成 | `agentData.mjs` 的 `detective-observer.fixedList[3]`；已漂移（漏 `clean` / `reflog *`） | `clean` / `reflog *` 任一进入 ④ 段，或 S6-B 启动 | 不属「边界句」，本轮 §2 明确只收两席边界句 |
| A2 | `outputFormats.audit` ↔ `round-check.md` 的同类副本 | `spec` §2 第 3 条 | S6-B 立项 | 结构未验证能否被同一模板承载 |
| A3 | `sharedBlocks` ↔ `debate-protocol.md` 的同类副本 | `spec` §2 第 3 条 | S6-B 立项 | 同上 |
| A4 | `DEFAULT_BOUNDARY` / `evidence-reader` 自有边界句收口 | `spec` §2 第 4 条 | 这两处需改字，或 S6-B 启动 | 结构不同构（无组、无产物） |

## 2 工程化二期（本轮只落了 B，未落 C）

| # | 项 | 现状 | 触发信号 |
|---|---|---|---|
| B1 | 把 `doc:sweep -- --check` 接入 `npm run check` | 现在是独立命令（避免无基线的克隆环境直接红） | 基线文件随仓提交且克隆后可用时 |
| B2 | 文档互引改「稳定锚点」（§/V-x/不变量 N），不再写 `文件:行号` | 本轮实测：4 次改 spec 导致 testcase 里 150+ 处行号漂移 | 下一次修订 testcase 时，随改随迁（先迁在审 3 份，共 476 处） |
| B3 | 模板 / 配置读取失败的稳定错误面（exit 3） | 现为「导入期未捕获，不承诺码」，已登记 S6-B | 渲染改惰性求值时 |

## 3 S5 遗留的 4 条知情项（自 S5 ④ 段带过来，F-24 未收）

| # | 项 | 来源 | 触发信号 |
|---|---|---|---|
| C1 | `E01`–`E03` 无 `S5-TC` 级用例 | `gate-record.md` ④ 行「附 4 条 P2」 | S5 下一次修订 |
| C2 | 「冲突→清理→重跑」闭环无单测 | 同上 | 同上 |
| C3 | `B14` 命名指向不可达状态 | 同上 | 同上 |
| C4 | `FORBIDDEN_PATHS` 与 S5 spec §3.3③ 两份手抄 | 同上 | F-24 落地后应已收敛（定义层派生），下次修订时复核并关闭 |

## 4 已在本轮处置、仅作记录（不要重开）

- P2 11 族（F22–F32）全部「采纳已落」，落点见 `problems.md` §十。
- 议会 #3 的 83 张卡全部有正文、答辩记录与落点（`cards.md` / `problems.md`）。
- 「改判回扫」机制已落：规则 R8 + `scripts/scope-sweep.mjs` + 词表 + 基线（见 `docs/mymind/20261025145125-sweep-engineering-decision.md`）。
