# S2 观察产物校验器 —— ③ 段完工交接（送 ④ sdet）

> 状态：**③ 段实现完成、全分支三轮审查已处置完**；本文件是 ③→④ 的送审材料。
> 执行方式：Subagent-Driven；**全程零提交**（`HEAD` 仍 `f2c7393`，工作树就地 master）。
> 账本（控制方恢复地图，含逐条 Ruling）：`.superpowers/sdd/2026-10-27-s2-observation-check/progress.md`
> plan：`docs/superpowers/plans/2026-10-27-s2-observation-check.md`（Task 1–12 全完）
> spec：`docs/superpowers/specs/2026-10-27-s2-observation-check-design.md`
> testcase：`…-design-testcase.md`（v5，**71 条** = 正 26 / 负 40 / 边界 5）

## 1 交付面

| 类别 | 内容 |
|---|---|
| 新建（未跟踪） | `tools/observation-check/` 共 **23** 个文件：9 个实现（`checks` / `evidence` / `artifact` / `cli` / `gate-scan` / `registered-ids` / `render` / `data` / `fixtures`）+ 12 个 `*.test.mjs` + 2 个 golden 件 |
| 改动（已跟踪，共 19 份） | ① PRD 1 份（码名登记 + §4.3 括注 + A/B 表 + `:347` 注拆句）；② spec 4 份（S2 设计 1 份 = R3 行码名；历史 3 份 = 仅路径前缀）；③ testcase 7 份（S2 1 份 = v4→v5；历史 6 份 = 仅路径前缀）；④ plan 4 份（仅路径前缀）；⑤ handoff 2 份（仅路径前缀）；⑥ 探索稿 1 份（`:686` + `:709` 改指针） |
| 暂存（唯一允许的 `git add`） | 演练归档件 `docs/superpowers/reviews/2026-10-27-1200-migration-drill/observation-r3.{json,md}`（Ruling #1 例外；**未提交**） |
| 测试增量 | 开工前基线 **736/734/0/2** → 现 **883/881/0/2**（+147，恰等于 `tools/observation-check` 逐文件合计） |

## 2 ③ 段出口证据（全部实跑，命令首行原样）

1. **套件**：`node --test tools\observation-check\*.test.mjs` → `# tests 147 / # pass 147 / # fail 0 / # skipped 0`
2. **仓门禁**：`npm run check` → `# tests 883 / # pass 881 / # fail 0 / # skipped 2`、`baseline 37/37`、`check 全部通过`、**exit 0**
3. **双 cwd**（锚点 2）：仓根跑与 `cd tools/observation-check` 跑均 147/147/0、exit 0
4. **夹具自建**（锚点 5）：移走 `agents/detective-observer.md` 后仍 147/147/0，`try/finally` 移回
5. **R8 回扫**：`node scripts/scope-sweep.mjs --check` → `counts {"I1":13,…,I9":74}`、`sweep ok（命中未超基线、清单齐、scope 齐）`、exit 0
6. **门禁三连**：`gate-record.md` 交集自查 `rows 11 bad 0`；`拆 spec 中` 计数 `0`
7. **归档演练**（锚点 7）：`writeObservation` → `{"ok":true,"wrote":true,"errors":[]}`；移入归档目录后 `npm run check` exit 0、`git status --porcelain -- <dir>` 恰 2 行 `A`

## 3 偏离清单（每条都带认输判据，详见账本 Rulings #1–#18）

| # | 偏离 | 原因（证据） |
|---|---|---|
| 1 | **全程零提交**；A01–A03 从常驻测试降为一次性验收证据；sha256 锚改账本「§迁入清单」 | 用户两次确认「不用提交」→「全程零提交」，与 spec §10.2 把清单写进 commit message 冲突 |
| 2 | 账本写入归控制方，不进实现者交付面 | SDD「controller 拥有 ledger」 |
| 3 | 11 文件原名迁入致 `evidence.mjs` 撞名 → 改 7 处历史裸名引用为带路径前缀 | spec §10.1 R1 原样迁入（文件名与 sha256 已定）vs R7 仓门禁不红 |
| 4 | Task 3–8 期间「仓门禁不红」降级为「红集 ⊆ 已记账集」；Task 9 收尾 `# fail 1`（A7 归 Task 10） | 旧夹具 27 条红全部归 Task 9/10；plan 的预期值（`# fail 0`）实测不可能 |
| 5 | D03 用例改为**按表分组**比对列宽 | items 3 列 / open 4 列，plan 的「全局同宽」任何实现都必假 |
| 6 | `artifact.mjs` 偏离 plan 逐字：三处 IO 收敛 + 覆盖写失败**回滚旧 md** | plan 逐字违反已签 PRD §4.2（异常不冒泡 / 失败即一个字都不写）；实测自引用 doc 逸出 |
| 7 | `cli.mjs` 偏离 plan 逐字：`rewrite -x` → exit 2；清理动作包 try | spec `:38`「argv 只接受位置参数」+ PRD §4.2 |
| 8 | `gate-scan` 的 `ok` 样本更正（代码不改） | PRD `:406` 允许文件名类只到根层与 `cards/`；`cards/card-NN.md` 只在精确白名单内合法 |
| 9 | 新建 `cli.mjs` 撞名 → 122 处历史 `cli.mjs:N` 补 `tools/docgen/` 前缀 | 同 #3 机制（同一类问题只用一个机制） |
| 10 | `baseline.test.mjs` F01/F02 补 `SELF` 例外 | 自指命中（plan 逐字缺 filter） |
| 11 | 「禁放宽」判据由「删含 assert 的行 = 0」改为「每文件 assert 条数净减 0 且成对」 | plan 自己要求改断言，字面判据互斥 |
| 12 | Task 10 的 9 处**用例侧** plan 缺陷（O1–O7 + C05 quote + D04 closure + import 漏 `checkRendered`） | 实现面一字未改；逐条列出见账本 |
| 13 | 用例计数改「逐文件 runtime `# tests`」 | 静态 `\btest\(` 与实跑块数无稳定关系（表驱动少计 14、字面量多计） |
| 14 | 审查 29 条四类处置（就地修 5 / 补判据 1 / 补覆盖 11 / 文档 4 / 标注 1 / 回流 1 / wont-fix 3 / 观察 4） | 见 §4 |
| 15 | `skipped` 内重复 id → 新增 `CoverageMismatch`（**判据级**） | PRD C-02 `:115`「skipped = 未判项 id 清单」的集合语义；`read+skipped=total` 算术被重复项骗过 → k03 静默通过 |
| 16 | wont-fix 三条：golden 数据不重冻（加「渲染夹具」标注）／`gate-scan` 不动／`rewrite` 的 md 名仍按 json 文件名 | testcase `:187` 明文允许 golden 只跑渲染；合法产物下两种派生同值 |
| 17 | 29 条分三批执行（实现 ∥ 文档 → 测试 → 控制方复核） | F001 加 `category` 会让夹具转红，必须与断言批次串行才能归因 |
| 18 | 批 2 四处「更严/结构变更」：F03 切片后移、`repoRoot` 加子进程判据、B16 改由 items 分支变异证明、E04 改用既有归档目录 | 每处均先说「原写法变异不红/会留残留」，再改；见账本 Ruling #18 |

**plan 与实测口径不符处（供 sdet 判是否需要回流）**：Task 9 Step 7 的 `# fail 0`（实测只能到 `# fail 1`）／Task 12 Step 2 的静态用例计数（已由 Ruling #13 替换）／Task 10 的 9 处用例缺陷（Ruling #12）／Task 6 与 Task 7 的逐字代码（Ruling #6/#7）。

## 4 待决（四项，都要人签字，③ 段不自裁）

1. **F030 —— PRD 内部冲突（判据级，必须回流）**：C-12 `docs/prd/20261026205821-agent-card-contract.md:125` 要求仓外证据「快照进 `reviews/<那次>/attachments/` 后引用仓内副本」；而 §5.2 `:406` 的允许文件名类只到 `<次>/` 根层与 `<次>/cards/`。照 C-12 办的归档必被 C-14 门禁判 `UnclassifiedArtifact`。**三选一**：① §5.2 允许 `<次>/attachments/<file>`（倾向，唯一让 C-12 闭环）；② C-12 改落点；③ 维持现状并在 C-12 注明「attachments 须同批登记白名单」。改任一边都触发 R8 回扫 + testcase 同步。
2. **Ruling #15 的 PRD 措辞确认**：是否在 PRD §4.2 ① 补一句「`skipped` 内 id 不得重复，重复 → `CoverageMismatch`」（实现与测试已落，仅缺 PRD 逐字依据）。
3. **`gate-record.md` 的 ③→④ 门行**：本轮**未写**（②→③ 门行是开工前由审计签的）。按 R2，申报人 = 开发（主 agent），签字人 = **独立审计**，不得自签。
4. **提交**：控制方零提交，工作树保持原样。当前暂存区只有 2 个演练归档件；`tools/observation-check/` 全部未跟踪。提交由用户决定（若选提交，Ruling #1 的 A01–A03 口径可恢复为 plan 原样）。

## 5 留观（本轮不改，登记待裁）

| # | 内容 | 去向 |
|---|---|---|
| D16 | `cli.test.mjs` E04 用例名从「自建 test- 目录」改为「既有归档目录、零新建」，testcase E04 文案可能不一致 | sdet 判；下一批同步 testcase |
| D17 | F002（`realpath` 兜底）**无对应用例**：Windows 上断链软链先被 `existsSync` 挡掉，无法稳定构造 | 代码层 fail-closed 已落；补测需 S4 设计可注入 fs |
| D18 | C08 用例含 `t.skip` 逃生口（tmpdir 若落在 git 工作树内则跳过） | S4 考虑 CI 固定 tmpdir 后去掉 |
| D19 | 探索稿 `:723` 仍指仓外草稿区；其 `§14.4` 错误码表未与 PRD A/B 表同步；`state.mjs:7` 裸名（守卫绿但不符合 Ruling #3 前缀口径） | 随下轮修订 / S4 批量对齐 |
| D20 | 派工的两处行号/目录误差（F042 实在 `plans/`；F043 只有 `:709` 相关） | 已按实读修正，仅留痕 |

## 6 复核方式（sdet 可直接粘贴）

```powershell
node --test tools\observation-check\*.test.mjs                 # 147/147/0
npm run check                                                  # 883/881/0/2、baseline 37/37、exit 0
node scripts/scope-sweep.mjs --check                            # sweep ok、exit 0
git status --porcelain                                         # 22 行；暂存区仅 2 个归档件
git rev-parse --short HEAD                                     # f2c7393
```

审查证据链：三份只读审查（实现正确性 / 测试忠实度 / 文档一致性）的 29 条 findings 与逐条处置，见账本 `## 全貌确认`＋`Ruling #14–#18`；子代理原始报告在 `.superpowers/sdd/2026-10-27-s2-observation-check/task-r1-{impl,docs,testcase}-report.md`、`task-r2-test-report.md`。

## 7 补记（同日，Ruling #19 落地后；本节优先于第 4 / 6 节）

本文件第 4 节的两项「待决」已在本文件定稿当日闭环，**第 6 节的数字以本节为准**（原数字保留作当时快照）：

- **第 4 节第 1 项（F030）→ 已闭环**：PRD §5.2「允许文件名类」补 `<次>/attachments/` 子层（仅一层、文件名不限 8 类），并记 §0.6 代裁行 **C-15**；`tools/observation-check/gate-scan.mjs:8` 新增 `ATTACHMENT_RE`、`:30` 加 `attachments/` 分支；`gate-scan.test.mjs` 新增 **G06**。
- **第 4 节第 2 项（Ruling #15 措辞）→ 已闭环**：PRD §4.2 ① 第 5 条改为 `skipped ⊆ registeredIds`（**集合语义**：id 不得重复，重复 → `CoverageMismatch`），并记代裁行 **C-16**；testcase 补 **B20** 用例、B10 过期「不覆盖」句改指 B20。
- **testcase 计数**：71 → **73**（正 26 / 负 41 / 边界 6；负+边界 47 ≥ 正 26）。
- **复核值（本节为准）**：`node --test tools\observation-check\*.test.mjs` → **148/148/0**；`npm run check` → **884/882/0/2**、`baseline 37/37`、`check 全部通过`、exit 0；`node scripts/scope-sweep.mjs --check` → `sweep ok`、exit 0；`git status --porcelain` → **23 行**（新增 `?? docs/handoffs/2026-10-27-s2-observation-check-close.md`）；`git rev-parse --short HEAD` → `f2c7393`。
- **仍未闭环的两项**：③→④ 门行（申报 = 开发，签字 = 独立审计，按 R2 不自签）；提交（用户自办，控制方零提交口径不变）。
