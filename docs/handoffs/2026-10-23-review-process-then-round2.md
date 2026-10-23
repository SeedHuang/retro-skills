# Session 交接：retro-skills → 评审流程改造（改完再回第 2 轮复评）（2026-10-23）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-23 17:30（Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `65b2702`（分支 `master`）；工作树：**未提交**（4 改 + 15 增，逐项见「现状」） |
| 验证基线 | `node scripts/check-all.mjs` → **exit 0**、`# tests 607 / # pass 607 / # fail 0`、`baseline 35/35`、`0 findings`、`④ markdown 检查通过（248 个文件 / 823 张表）`、末行「check 全部通过」（**17:30:09–17:30:13 实跑**，日志 `.session/reviews/2026-10-23-154036-skill-eval-harness-spec-delta/check-all-handoff.log`，3094 行）；账本闸门 `node skills/review-log/scripts/review-ledger-gate.mjs .session/reviews/2026-10-23-154036-skill-eval-harness-spec-delta/progress.md` → `轮次账完整性：1 行全过（0 条软提示）`、**EXIT=0**（17:29 实跑）。typecheck / build 不适用（本仓库为 Node 脚本 + Markdown 资产，零依赖，无构建产物） |
| 继任自 | `docs/handoffs/2026-10-23-skill-eval-harness-closeout.md`（同日最近一份；本 session 是否由它开工**未取证**，仅按时间序推定） |
| 状态 | 有 2 个开放问题（见「开放问题」节，第 1 条为**开工第一问**） |

## 项目定位

`d:\Seed\retro-skills` —— rule / skill / 多席议会评审 / 复盘套件的资产仓库（Node 零依赖脚本 + Markdown 资产 + 内置守卫 `npm run check`）；当前在审件是一份技能评测工装的 spec（skill-eval-harness），正处在议会评审第 1 轮与第 2 轮之间。

## 现状

- **已完成（第 1 轮的修复侧）**：
  - spec 改 11 处（§3.3-6 二维表 ①–⑤ / §3.3-7 异常明细整段 + verdict 触发条件 / §5⑥ / §7-8），哈希 `13CF4784…07BBC` → **`6217AD9B9DD4137E35AE708C4B6C27AF707B37FADA52887501100FBE131BB182`**（`Get-FileHash` 17:29 实取）。
  - testcase 由 `senior-sdet` 在**全新上下文**二次改写：88 → **100 条**（正 26 / 负 50 / 边界 24），哈希 `DAD20D98…CF7377` → **`DD39E208421B02BD2DF08C933F9AAE5D59A769ADAE45506575FDD03F9C8DA573`**；`Select-String '^### TC-'` → 100（17:29 实取）。
  - 审计 9 项打回**全部订正**（轮际对账 / 终态对账式 / 侦探卡号 / 答辩落点 / 追问轮漏派读者席 / 锚点偏移 / 范围归类 / 轮次账起止与出卡数 / 验证查账 26 行三值），逐项落点见 `problems.md` §九–§十五 + `progress.md` 段一/二/三。
  - 两处用户裁定已落账：① 通过判据改「**P0 = 0 且 P1 全修（不限条数）**」（`problems.md` §8.4、`submission.md` §4）；② **TC-050 暂不改动**（由新增 TC-098 承担该退出码断言）。
- **未完成**：第 1 轮**未闭合** —— 审计判「不通过，9 项打回」，9 项已订正但**未经审计复判**；15 项必须修的 15 项均为「已修待复评」；**第 2 轮未开**（用户要求先改评审流程，改完再回来开）。
- **验证证据**：见元信息表『验证基线』（单源，不在此重复）。
- **提交状态**：**全部未提交**，由用户自行 commit（本 session 遵守用户全局规则「禁止主动执行 git 写操作」，只跑过 `git status` / `git rev-parse` 等读操作）。
- **工作树异常（`git status --porcelain`，17:29 实取）**：
  - 改：`docs/after/20261017210609-pending-work-overview.md`、`docs/superpowers/specs/2026-10-21-skill-eval-harness-design.md`、`…-design-testcase.md`、`package.json`、`skills/managing-lessons-store/scripts/lessons.test.mjs`。
  - 增（未跟踪）：`docs/after/20261022113509-skill-eval-harness-open-decisions.md`、`docs/superpowers/plans/2026-10-22-skill-eval-harness.md`、`evals/`、`scripts/run-eval.mjs`、`scripts/run-eval-core.mjs`、`scripts/run-eval.test.mjs`、`scripts/run-eval-core.test.mjs`、`scripts/check-eval-contract.mjs`、`scripts/check-eval-contract.test.mjs`、`scripts/eval-contract-core.mjs`、`docs/handoffs/` 5 份。
  - **`package.json` 与 `skills/managing-lessons-store/scripts/lessons.test.mjs` 与本轮评审无关**，来源未核（本 session 未取样对比，无法证明是本轮之前还是之中产生的）；提交前请用户自行确认取舍。

## 过程记录

- 本轮账本（**先读尾部**）：`.session/reviews/2026-10-23-154036-skill-eval-harness-spec-delta/`
  - `progress.md`（尾部三节最关键：「本轮结论」含未验证项单列、「本轮复盘」、「验证查账」26 行）
  - `problems.md`（族级台账：§一–§七 = 17 族 + 10 候选；§八 = 终态对账 8.1 / 必须修 15 项 8.2 / 落点表 8.3 / 判据裁定 8.4 / 元发现 8.5；§九–§十四 = 侦探、追问轮、读者补派；**§十五 = sdet 4 项存疑判定**）
  - `cards.md`（41 张原始卡 + 「锚点订正表」）、`round-check.md`（审计核对单，判「不通过 9 项」）、`submission.md`（送审说明，§1 两件哈希 / §3 范围 / §4 名单与判据 / §8 自检）
  - `check-all.log`（修复后跑的守卫全文）、`check-all-handoff.log`（本次交接实跑，3094 行）
- 上轮账本（轮际对账对象）：`.session/reviews/2026-10-22-093735-skill-eval-harness/`（7 个文件：a1-assertions / cards / clarify / problems / progress / round-check / submission）
- 被审件：`docs/superpowers/specs/2026-10-21-skill-eval-harness-design.md`、`…-design-testcase.md`
- 历史交接词链：`2026-10-22-skill-eval-harness-round7.md` → `2026-10-22-skill-eval-harness-mutual-test.md` → `2026-10-23-skill-eval-harness-task2.md` → `2026-10-23-skill-eval-harness-closeout.md` → 本文件

## 本次任务

**先按用户即将给出的要求改造评审流程**（涉及 `skills/parliament`、`skills/review-log` 的机制与模板），**改完再回到本目录开第 2 轮复评**（第 2 轮只审 spec §3.3-6 / §3.3-7 / §7-8 与 TC-080~TC-100 的增量，其余不重审 —— 依据 `submission.md` §3）。流程：用户给出改造要求 → 按项目规矩（议会机制变更 = spec + 独立 testcase 送议会）定案并落地 → 回到第 2 轮开评 → 15 项「已修待复评」逐项复判 → 按新判据判通过与否。起点：**等用户的改造要求**（尚未给出，见开放问题第 1 条）。

## 范围依据

- **要读**：
  - `.session/reviews/2026-10-23-154036-skill-eval-harness-spec-delta/submission.md` §3（范围与不审）、§4（名单 / 通过判据 / 判据变更记录）
  - `.session/reviews/2026-10-23-154036-skill-eval-harness-spec-delta/problems.md` §8.3（15 项落点表）、§8.4（判据裁定）、§七（10 项候选）、§十五（sdet 4 项）
  - `docs/superpowers/specs/2026-10-21-skill-eval-harness-design.md` L233（二维表 ①–⑤）、L234–L243（结论留痕）、L293（§5⑥）、L326（§7-8）
  - `docs/superpowers/specs/2026-10-21-skill-eval-harness-design-testcase.md` TC-080~TC-100 段（含覆盖总表与负例表）
  - `skills/parliament/assets/submission.md` L30-40（默认判据就地位置）、`skills/parliament/assets/progress.md` L55-60（验收行模板）
- **勿重做**：spec 的 11 处改动、testcase 的 100 条（哈希见元信息）、`cards.md` 41 卡与锚点订正表、`problems.md` §八 终态对账、`check-all` 全绿基线。

## 开放问题

1. **开工第一问：评审流程具体要改什么？** 推断（依据 = `progress.md`「本轮复盘」的「落点（怎么让它不再犯）」列，本轮实测暴露 5 条机制缺陷）：① 通过判据「必须修项 ≤5」→ 选项①（现只改了本次 `submission.md` §4，`skills/parliament/assets/submission.md` L36 与 `assets/progress.md` L58 仍写 ≤5）；② 追问轮派单必须从送审说明 §4 名单机械取（本轮按「谁出过卡」派，漏派读者席）；③ 卡片锚点写法改成「关键词 + 节号」、行号统一由订正表给（本轮 spec 一改导致 5 类锚点全 +1）；④ 卡数与对账式必须附 `rg -c` 取数命令（本轮出现过 37≠30 的假等式）；⑤ testcase 判据不得从实现措辞倒推。**请用户**：确认这 5 条是否就是改造范围，或直接给出清单。
2. **改造本身要不要按「议会机制变更 → spec + testcase 送议会」走？** 推断：要（依据 = 项目记忆「议会核心机制变更（答辩方构成、角色职责、点将矩阵调整）必须走 spec + testcase 送议会评审流程」，以及用户全局规则「写/改 spec 必须同批产出独立 testcase」）。**请用户**：确认，或指定走轻量路径。

## 既定约束（不要重新讨论、不要重新选型）

- **禁止任何 git 写操作**，除非用户当轮直接明说 —— 用户全局规则「全局 Git 写操作禁令」；本 session 全程只读 git。
- **改/写 spec 必须同批产出独立编写的 testcase**（`senior-sdet` 全新上下文、≠ spec 作者、≠ 施工者；文件名 = spec 去 `.md` 加 `-testcase.md`；spec 只写「测试用例文件：<路径>」外链）—— 用户全局规则「testcase 硬门」五判据。
- **评审轮次只在用户明确指令时开启**，不得自动开下一轮 —— 项目记忆硬约束。
- **通过判据 = 「P0 = 0 且 P1 全修（不限条数）」**（第 2 轮起生效，第 1 轮结论不追改）—— `problems.md` §8.4 + `submission.md` §4。
- **TC-050 暂不改动**，其全 probe 退出码断言由 TC-098 承担 —— 用户 2026-10-23 裁定（`problems.md` §十 F13）。
- **15 项必须修只是「已修待复评」**，不得在第 2 轮复判前说成已闭合 —— `progress.md`「本轮结论」。

## 遗留裁决与留观项

- **15 项必须修（P0 1 + P1 14）** —— 来源：`problems.md` §8.3；收敛时机：第 2 轮复评逐项复判。
- **F15（TC-086 c 档不可执行）未修**（P2 非必须；要么授权 runner 导出超时判定纯函数、要么挂「未取证」）—— 来源：`problems.md` §十 F15；收敛时机：用户拍板。
- **10 项候选**（含本轮新增 SD-2 超时支缺闭集 token、SD-3 两处 ⑤ 同号）—— 来源：`problems.md` §七；收敛时机：各自触发信号（扩到第二个技能 / 改逐用例行格式 / 出现实际误读案例）。
- **实现与条文已知不一致**：spec ⑤ 格要求码 4 fail-closed，`scripts/run-eval.mjs` 的 `pickExitCode` 仍对码 4 不透传 —— 来源：`problems.md` §8.3 + `progress.md`「未验证项」第 1 条；收敛时机：施工期，不得当成已修。
- **动手前那次 `check-all` 全文未落盘（取证缺陷）** —— 来源：`progress.md` 范围节；已用 `check-all.log` / `check-all-handoff.log` 补证，无需再动。

## 开工前先做

1. `cd d:\Seed\retro-skills; git rev-parse --short HEAD; git status --porcelain` —— HEAD 应为 `65b2702`；重取两件哈希确认未被改动：`(Get-FileHash docs/superpowers/specs/2026-10-21-skill-eval-harness-design.md -Algorithm SHA256).Hash` 应为 `6217AD9B…BB182`，同法取 testcase 应为 `DD39E208…8A573`。
2. 读 `.session/reviews/2026-10-23-154036-skill-eval-harness-spec-delta/progress.md` 尾部三节（本轮结论 / 未验证项 / 本轮复盘）。
3. 读 `skills/parliament/assets/submission.md` L30-40 与 `skills/parliament/assets/progress.md` L55-60，确认「≤5」当前落在哪两处；再读 `skills/parliament/SKILL.md` 的追问轮与审计核对规程段。
4. **先问用户开放问题第 1 条（改造清单）**，不要自拟范围直接开工；同时确认第 2 条（是否走 spec + testcase 送议会）。
5. 若定案：按约定先写 `docs/superpowers/specs/YYYY-MM-DD-<主题>-design.md`，同时派 `senior-sdet` 写同名 `-testcase.md`，再送议会；改完 `node scripts/check-all.mjs` 必须 exit 0 并落盘日志。

## 开场话术

读 `docs/handoffs/2026-10-23-review-process-then-round2.md`，按交接词继续：先按我给的要求改造评审流程，改完再回到 skill-eval-harness spec 增量第 2 轮复评。
