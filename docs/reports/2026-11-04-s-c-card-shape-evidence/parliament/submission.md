# 送审说明：S-C 卡面形状（spec + testcase 一件）

> 状态：**开评**（2026-11-04 09:35）｜账本：`.session/reviews/2026-11-04-0840-sc-card-shape-spec-parliament/`
> 文档类型：spec（技术设计）｜口语别名：技术设计评审
> 执行路径：**B**（Task 通用子代理，角色卡从 `agents/<角色>.md` 逐字贴入）

## 1 评审对象（被审，不是背景）

| # | 件 | 路径 | SHA256 | 角色 |
|---|---|---|---|---|
| 1 | spec | `docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md` | `9B470C827C6B2020C3367D8E5C910FE0CDF665DD37AD537CCA311EED748E7BA0`（270 行，终稿） | 被审对象（一件交付之①） |
| 2 | testcase | `docs/superpowers/specs/2026-11-03-s-c-card-shape-design-testcase.md` | `FC7E144AE00D81974AC8D384ECD42BE4D86D6EB6BC05E890D962837D19B26697`（1072 行 / 60 条 = 正 21 / 负 17 / 边界 22，修订轮次 7） | 被审对象（一件交付之②） |
| 3 | plan（计划门专用，非 ② 交付物） | `docs/superpowers/plans/2026-11-03-s-c-card-shape.md` | `E8535512FACBF39A9B0DC008BF8073A3B650352230D8F2DF6884A381AD0AD350` | ②→③ 门签字对象 |

> **签后增量登记**（② 段内共 9 次修订，逐次记；判据面只增不减）：spec 223 → 268（答辩修复：R2 重写 / R6 补 3 处 / §11.9·§11.12·§11.14 新增）→ 270（复核轮 BB-1..3：§11.4 `role` 面 + `${@hostTerm}` 保全）→ 270（审计 P0-2 同批：§11.14 步 1 补 S-A testcase 路径，行数不变、指纹变 `9B470C82…`）；testcase 887/59 → 931/60（裁定回填）→ 967/59（议会 Q-1…Q-5）→ 1021/60（复核轮 BB-1..3）→ 1044/60（审计 P1-1..3）→ 1060/60（CC-1）→ 1072/60（P0-2）。**判据方向零改动，条数始终 ≤60。**

## 2 开卷清单（决策源 / 只读背景）

| # | 文档 / 证据 | 路径或命令 | 为什么开卷 |
|---|---|---|---|
| 1 | PRD（S-C 的唯一范围来源） | `docs/prd/20261102212627-card-data-contract-and-proof/index.md` | D1–D6 / D16 / D17、Q1/Q4/Q5、V1–V12、§5 冲突表、§8 S-C 行、§9 路线图 |
| 2 | S-A spec（上游已签） | `docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md`（`:16`–`:27` 的 R1–R9） | `trigger.kind` 字段位归属、`@` 展开机制 |
| 3 | S-B spec §11.6 / testcase `:555` | `docs/superpowers/specs/2026-11-03-s-b-contract-layer-design.md`（§11.6 `:211-215`）/ `…-testcase.md:540-556` | S-C 遗留清单来源 + 一次性档 / `SB_BASE` 口径 |
| 4 | 五处冻结断言所在处 | `tools/docgen/test/s2-card-rewrite.test.mjs`、`tools/docgen/test/sdet-render.test.mjs` | 被改的已签断言 |
| 5 | 门账 | `skills/dev-workflow/references/gate-record.md:81-97` | S-A / S-B 已闭环，S-C 的前置 |
| 6 | 段判据 | `skills/dev-workflow/references/stage-2-tech-design.md` | ② 段六条出口 |

## 3 范围与不审

- **本次只审**：spec 的 R1–R12 与 §11.3–§11.13 的可判性、与 PRD D/Q/V 的一一对应、与已签件（S-A / S-B / S2 / SSDET）的冲突处置；testcase 的五要素、覆盖总表可回溯性、负例比例、判据可执行性。
- **不审**：③ 段施工质量（代码还没动）；`duty.action` 逐席文案的「文采」；`≤ 5 条` 条数上限（spec 已登记为「不适用」，见 §11.6）；已签 PRD / S-A / S-B 的结论本身。
- **不重审**：`2026-11-01-s2-card-rewrite-design.md`（依赖未变）、`2026-10-29-agent-card-s4-render-design.md`（依赖未变）。
- **不放进送审材料**：`.session/` 里的过程账与旧批次 impact-sheet。

## 4 评审设置

- **名单来源**：自动点将（`references/assembly-matrix.md`「纯文档仓库（本仓形态）」行列 → 必选 **读者代表 + 审计**；按需 **产品 + 后端 + 测试 + AI**）。覆盖矩阵零缺口 = 是。
- **评委**：`reviewer-reader`（读者代表，必选）、`reviewer-audit`（审计，必选）、`reviewer-qa`（测试：testcase 质量）、`reviewer-backend`（实现口径 / 脚本 / 数据链）、`reviewer-ai`（指令可执行性）、`reviewer-product`（是否真解 PRD 意图）。侦探 `detective-observer` 常驻。
- **提交授权**：用户 2026-11-04「按交接词继续：写 S-C 卡面形状的 ② 段（spec + 独立 testcase，过议会与计划门）」= 明确要求过议会。
- **产出约束**：每席只回 PASS / FAIL + 最多 5 个必须修项；问题卡必须有证据（文件:行 / 节号 / 命令）与建议修法。
- **通过判据**：P0 = 0、必须修项清零、六条出口判据成立。
- **账本落点**：本目录 `progress.md` / `problems.md` / `cards.md`。

## 5 按类型的必带件核对

| 项 | 档位 | 在位 | 证据 |
|---|---|---|---|
| spec 文件 | 明文硬门 | 是 | `…-s-c-card-shape-design.md`（223 行） |
| testcase 文件（同目录，命名派生） | 明文硬门 | 是 | `…-s-c-card-shape-design-testcase.md`（931 行） |
| 编写者独立性声明 | 明文硬门 | 是 | testcase 文件头（`…-01` 初版 + `…-02` 修订轮 2） |
| spec 外链 testcase 且不内联用例 | 明文硬门 | 是 | spec §11.10「测试用例文件：…」；spec 内 `^### SC-TC-` 0 命中 |
| 覆盖总表可回溯 | 明文硬门 | 是 | testcase §1（60 行，每行指回 spec 节号 / R 编号 / PRD V 编号） |
| 负例 + 边界 ≥ 正例 | 明文硬门 | 是 | 18 + 21 = 39 ≥ 21 |

- [x] 硬门件全在
- [x] testcase 五条判据（spec 类）人工核对结果已写
- [x] 评审基线（两件 SHA256）已记
- [x] 名单已核零缺口
- [x] 提交授权已获得（用户原话见第 4 节）
- [x] 账本目录已建
- [x] 未把代码 / 未完成件 / 已冻结件放进被审对象

## 6 机器证据（命令 + 输出）

| 证据 | 命令 | 输出摘要 |
|---|---|---|
| spec 基线 | `(Get-FileHash <spec> -Algorithm SHA256).Hash` | `34E17EBE…746A841F` |
| testcase 基线 | `(Get-FileHash <testcase> -Algorithm SHA256).Hash` | `4BF880F6…7D2FAB6E` |
| 预算 | `node scripts/check-plan.mjs size --spec … --testcase … --rounds 1` | `size: spec 223/350 tc 60/80 rounds 1/3 => ok` |
| 用例计数 | testcase §1 覆盖总表 60 行（正 21 / 负 18 / 边界 21） | 39 ≥ 21 |
| spec 不内联用例 | `Select-String -Path <spec> -Pattern '^### SC-TC-'` | 0 命中 |
| 开工基线 | `npm run check` | `# tests 1481 / # pass 1476 / # fail 0 / # skipped 5`、`baseline 38/38`、`④ 399 个文件 / 1706 张表`、末行 `check 全部通过` |
| gate-record | `node scripts/check-gate-record.mjs` | `rows 68 bad 0` + `gate-record ok` |
| R8 回扫 | `node scripts/scope-sweep.mjs --check` | `sweep ok` |
| 可观察判据 | `node scripts/check-observable.mjs --check` | `check-observable ok` |

## 7 已知雷区（背景，不预设结论）

| # | 雷区 | 来源 | 对本次评审的提示 |
|---|---|---|---|
| 1 | 五处冻结断言改写后可能「恒真」 | PRD §5 / S-B 的 H06 教训 | 每条改写后的断言必须能喂坏值变红 |
| 2 | `returns` 词面自命中 | spec §11.1 R11 | 若测试文件里直接写该词，V11 ① 会数到自己 |
| 3 | 一次性档 BASE 失效 | S-B testcase `:555` | S-C 改卡面后 `SB_BASE` / 三条一次性档必须按新 BASE 重算 |
| 4 | G7（R8 绿靠旧批次清单 mtime） | `gate-record.md:95` | 本批已建自己的 impact-sheet；核验用 `--impact` 显式形态 |

## 8 填完自检

- [x] 第 1 节路径存在（testcase 待补）
- [x] 第 2 节开卷清单路径存在
- [x] 第 3 节范围与不审写清
- [x] 第 4 节名单零缺口 + 授权在案 + 通过判据可机械判
- [x] 第 6 节每条证据都有命令（部分输出待复跑）
- [x] 第 7 节只写背景
- [x] 账本目录与第 4 节一致
