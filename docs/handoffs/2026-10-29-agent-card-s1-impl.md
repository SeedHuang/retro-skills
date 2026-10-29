# Session 交接：retro-skills → agent-card S1 的 ③ 施工（2026-10-29）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-29 19:12（Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `7e5a4ec`（`docs: 在 gate-record.md 中新增 S1 ②→③ 阶段的审核记录`；该提交 = plan 689 行 + `gate-record.md` 1 行）；工作树：**clean**（`git status --porcelain` 空串，19:11:43 实测） |
| 验证基线 | `npm run check` → `# tests 1039` / `# pass 1037` / `# fail 0` / `# skipped 2`、`baseline 37/37`、`0 findings`、`④ markdown 检查通过（312 个文件 / 1379 张表）`、末行 `check 全部通过`（exit 0）；`node scripts/check-gate-record.mjs` → `rows 29 bad 0` / `gate-record ok（R1/R2/R6 全过；splitting 0）`；`node scripts/scope-sweep.mjs --check` → `sweep ok（命中未超基线、清单齐、scope 齐）`；`node scripts/doc-name.mjs --check docs` → `命名检查通过（docs）`；`node scripts/check-plan.mjs coverage --plan docs\superpowers\plans\2026-10-29-agent-card-s1-card-model.md --prd docs\prd\20261026205821-agent-card-contract.md --stage S1` → `coverage: gap 0（prd 8 / plan 8）steps ok => ok`；`deps` → `deps: cycle 0 dangling 0（nodes 8 / edges 24） => ok`；`map` → `map: missing 0 dangling 0（cases 66 / mapped 66） => ok`；`size` → `size: spec 301/350 tc 66/80 rounds 3/3 => ok`（全部 exit 0，**19:11:43–19:12:13 实跑**，在 `7e5a4ec` 之后） |
| 继任自 | `docs/handoffs/2026-10-29-agent-card-s1-plan-gate.md` |
| 状态 | 可直开工（开放问题 3 条，仅第 1 条是开工第一问，均不阻断） |

## 项目定位

`d:\Seed\retro-skills` —— AI 协作工作流的规则 / 技能 / 机械判据仓库（五段主干：PRD → spec+testcase → 计划门 → 实现 → 质量 → 交付；`npm run check` 是唯一总门禁）。

## 现状

- **已完成（本窗口）**：
  - **plan 落盘并过 ②→③ 计划门**：`docs/superpowers/plans/2026-10-29-agent-card-s1-card-model.md`（**689 行 / SHA256 `2EFD55BA676ABFF509FED7A210DAF01521388726B0EAEC7DB44FA0E4825ED7D1`**；8 个 Task、功能点→任务映射表 8 行、附录 A 66 行（58 条用例 + 8 条 F 对位行）、附录 B 8 次提交切分）；门行 = `skills/dev-workflow/references/gate-record.md:39`（申报人 = 主 agent、签字人 = 审计、结论「通过（三轮闭环）」）。
  - **审计 review 两轮闭环**（用户指令「和审计一起 review」）：独立审计实例首轮判 **不通过（P1 1 / P2 6）** → 主 agent 全改 → 复核轮判 **通过（原 P1 已闭合）**；复核轮另抓 3 处小项（Task 8 Files 的 `Modify:`→`Create:`、增量登记措辞倒装、`ALLOWED_OPS` 须注明「判定面收窄回 spec `:191` 原文」）也已改完。
  - **首轮 P1 实质**（下个 session 必须知道，防复现）：plan 原文让实现读模块常量 `SEAT_SCENES` / `SEAT_SIGNALS`，而已签 testcase `:524-525` 断言两者**恒空**、局部登记只经 `env` 注入（`testcase:1059/1071/1073/1087-1089`）→ 已改为「判定输入 = `env.seatScenes` / `env.seatSignals`，模块常量只作默认值」。
  - 门行追加「增量登记 + 两处证据勘误」（**不改原签判据与已签证据原句**）：`deps` 由 `edges 21` 变 `edges 24`（补 T1→T5、T1→T6、T2→T6 三条真实依赖）。
- **验证证据**：见元信息表『验证基线』（单源，此处不重复）。
- **提交状态**：已 commit（hash 见元信息表『HEAD』）。**`.session/` 账本不进 git**（过程账只在本地，换机器即失）。
- **工作树异常**：无（`git status --porcelain` 空串）。

## 过程记录

- `.session/reviews/2026-10-29-1501-agent-card-s1-parliament/`（议会 #2 账本；**先读** `delivery-audit.md` 的「结论」节与 `progress.md` 尾部：三轮时间线 + 候选 C-1～C-5）
- `.session/reviews/2026-10-29-1813-agent-card-s1-plan-gate/`（计划门账：`plan-gate.md` 三段 = 首轮 §1–§7 / 复核轮 §8–§13 / 终态轮 §14–§18，239 行；`impact-sheet.md` = R8 当次清单，13 口径 + 9 命中文件，处置全「不改」）
- 历史交接词：`docs/handoffs/2026-10-28-s4-plan-gate.md` → `docs/handoffs/2026-10-29-agent-card-s1-spec.md` → `docs/handoffs/2026-10-29-agent-card-s1-plan-gate.md` → **本文件**

## 本次任务

按 plan 施工 agent-card S1 定义层（F-01～F-08），产出 `tools/docgen/card-model/` 的 12 个 `.mjs` + `tools/docgen/test/card-model.test.mjs`（58 条常驻用例，进全仓 `**/*.test.mjs` glob 自动回归），并过 ③ 出口（审计签字）；流程：**③ 施工 → ④ 质量 → ⑤ 交付**；起点：**③ 的 Task 1**（②→③ 计划门已过，勿重走、勿再送议会）。

施工过程账本落盘约定：`.session/reviews/2026-10-29-1813-agent-card-s1-plan-gate/impl-3.md`（plan Task 8 Step 4，**最后写**，mtime 须晚于所有被扫文件）。

## 范围依据

- **要读**：
  - `docs/superpowers/plans/2026-10-29-agent-card-s1-card-model.md`：**Global Constraints（`:18-35`，14 条，对每个任务隐含生效）**、**Task 1–Task 8**（`## Task 1:` 起逐段）、**附录 A**（66 行 ID→落点）、**附录 B**（8 次提交切分）、**Self-Review**（5 条，写完即跑）
  - `docs/superpowers/specs/2026-10-29-agent-card-s1-card-model-design.md`：§3 `:35-53`（目录与依赖方向）、§4 `:55-79` + §4.1 `:94-99` + §4.2 `:101-112`（形状 / 两个 `criterion` 分形 / `SCAN_FIELDS`）、§5 `:115-133`（8 张表 / id 谓词 / `SUBJECTS` / `deriveScope`）、§6 `:135-159`（接口 / 纯性 / 异常 / 缺键 / 顺序 / path）、§7 `:166-204`（36 码判据表）、§8 `:222-241`（M1/M2 与 8 组）、§9 `:243-254`（V-1～V-8）、§10 `:256-281`（D1–D22）
  - `docs/superpowers/specs/2026-10-29-agent-card-s1-card-model-design-testcase.md`：§0 `:24-36`（9 条事实）、§0.1 `:38-48`（覆盖账）、§0.2 `:50-62`、**§0.3 `:64-216`（helper 逐字落进测试文件，含 `SPEC_LINES` / `cutList` 从 spec 原文切的常量）**、§0.4 `:218-364`（36 码登记向量 `TABLE`）、§1 `:365-451`（覆盖总表 58 行 + F 对位表 `:441-450`）、§7 `:2136-2162`（缺口表）、§9 `:2255-2299`（计数声明）
  - `skills/dev-workflow/references/stage-3-implementation.md:8-19`（③ 四条出口判据 + 申报人/签字人 + 必附证据）
- **勿重做**：
  - `docs/prd/20261026205821-agent-card-contract.md`（已签；四处词表路径已勘误，功能点与判据零改动）
  - `docs/superpowers/specs/2026-10-29-agent-card-s1-card-model-design.md` 与其 `-testcase.md`（已过议会 #2；**testcase 只能由新的 `senior-sdet` 实例修改，施工者不得代改**）
  - `tools/docgen/policy/**`（S6 单一来源）、`tools/observation-check/**`（S2 已签交付）、`agents/*.md`（15 卡，S4 重生成）、`scripts/check-all.mjs`、`package.json` —— **零改动**（plan Global 1 + spec §2 `:26-31`）
  - `scripts/check-plan.mjs`（S4 已签脚本；`M-1` 的修法**不在本段**，见「开放问题 3」）

## 开放问题

1. **开工第一问**：③ 是否按 plan **附录 B** 的 8 个提交逐 Task 切（每 Task 一个 commit、可独立回滚）？推断：**是**——附录 B 已给 8 行切分表（提交 1 = Task 1 … 提交 8 = Task 8），且每个提交在全仓无调用方时 `npm run check` 仍可绿。请用户：**确认或纠正**（若希望「全部做完只提一次」，需在开工前说明，附录 B 与门行不再改）。
2. 施工方式：`subagent-driven-development`（每 Task 派子代理）还是主 agent 自己做？推断：**主 agent 自己做**——12 个模块共用同一套 §8 优先级与 §6 契约，且每个 Task 都要往同一个测试文件追加用例（共享 §0.3 helper），拆给多实例易产生两份实现。请用户：**确认或纠正**。
3. `M-1`（`scripts/check-plan.mjs:229` 的 B 载体正则把 testcase「F 对位」表首列 `F-01`…`F-08` 当成用例 ID，`cases 66` ≠ 真值 58）是否在 ③ 段顺手修？推断：**不修**——它是 S4 已签脚本，plan 已把触发登记为「下次修订该脚本或该 testcase 时同批」；本段用附录 A 一并落点即可（`map` 已绿）。请用户：**确认**（若要求本段修，须 testcase 侧与 plan 侧同批排除或删那 8 行，并重记门行指纹）。

## 既定约束（不要重新讨论、不要重新选型）

- **落点** = `tools/docgen/card-model/`（12 个 `.mjs` + `tools/docgen/test/card-model.test.mjs`），与 `tools/docgen/policy/**` **零字节交集** —— 用户 2026-10-29 裁定 **A**；spec §3 `:35-53`。
- **S1 范围 = F-01～F-08（定义层），不渲染**：`agents/*.md` 一字不动，15 卡散文迁移归 S4 —— PRD `:516` + 用户 2026-10-29 确认。
- **执行顺序 S2 → S3 → S1 → S4**（S2/S3 已收口）—— PRD `:521`。
- **`SCAN_FIELDS` 写死在 `enums.mjs`**（唯一写死处，8 键逐码一项、不合并成 4 组键），`validateCardModel.mjs` 只 import 消费 —— 已签 testcase `:1486-1494` 断言 `EN.SCAN_FIELDS`；写错处 G09 必红（plan Task 1 Step 2 / Task 4 Step 2）。
- **席局部登记表的判定输入 = `env.seatScenes` / `env.seatSignals`**；模块常量 `SEAT_SCENES` / `SEAT_SIGNALS` **恒空、只作默认值** —— testcase `:524-525` 断恒空，E05 / E06 / C01 组 6 全经 env 注入。
- **8 张表全部写死在 `enums.mjs`**；`landings.mjs` / `open-items.mjs` 只 re-export + 消费（不做第二份字面）—— spec `:37`「唯一写死处」+ `:38` / `:42`。
- **纯函数、零 IO**，全部上下文经 `env` 11 键注入；异常与缺键收敛为 `UnverifiableOutput`（`path = env.<键名>`）并**继续判** —— spec §6 `:151-153`。
- **四入口**（`validateCardModel` / `validateOpenItems` / `compareVerdicts` / `verdictAllowed`）一律返回 `{ ok, errors }`（不是布尔）；`mergeActions` 是独立第五调用、3 个合并码**不入** `CARD_MODEL_CODES` —— spec §6 `:137-147`。
- **`CARD_MODEL_CODES` 恰 36 键**（35 = PRD `:361` S1 组 + 1 = A 表 `:346` 复用的 `MissingCriterionImpl`），值 = **判定面字段引用（不写行号）**，`WeakReason` 不在表 —— spec §6 `:147` + §7 `:164` + V-5。
- **M1 / M2**：同一次返回内 `path` 唯一；同组先命中先报，**M2 粒度 = 判定面**（`errors[].path` 仍是带下标的定位串）—— spec §8 `:224-239` + §10-D20。
- **本段测试是常驻回归测试，不是 testcase 文件**：编写者 = 施工者，不受独立编写义务约束；**计数口径 = 文件内 `test(` 块个数**（各 Task 末尾 4/14/15/24/38/54/58 即此口径；附录 A 落点去重口径是 3/13/13/21/33/54/58，两者并存不算矛盾）—— plan Global 10。
- **`npm run check` 是唯一总门禁**，每 Task 收尾须 exit 0 —— plan Global 11。
- **R8 回扫用裸命令** `node scripts/scope-sweep.mjs --check`；若报「清单早于被扫文件」，为当批**新落**一份 impact-sheet（先例 = 门行 `②→③@S3` 增量登记节），不得改写旧清单凑绿；**禁用** `npm run doc:sweep -- --check`（PowerShell + npm 10.9 会吞 `--` 后参数、恒 exit 0 = 假绿）—— plan Global 12。
- **`V-13`（A/B 盲评）不在本期**，③/④/⑤ 门行不得引用 —— `skills/dev-workflow/references/gate-record.md:13` 的 `②@S6` 增量登记。

## 遗留裁决与留观项

- `M-1` 机制缺陷（`check-plan` 的 ID 载体虚高 8 条）—— 来源：plan 遗留表 `M-1`（`plan:185`）；收敛时机：**下次修订 `scripts/check-plan.mjs` 或该 testcase 时同批**（两侧必须同批，否则附录 A 会变 `dangling 8`）。
- `L-1` `CheckItem.criterion` 与 S6 `tools/execution-matrix/criteria.md` 三态可能交叉 —— 来源：plan `L-1`；收敛时机：③ 写该判据时判「复用还是另立词表」，冲突即**回 ② 段**。
- `L-4` testcase §7 剩余 6 条 P2（`S1-G-11` / `-12` 余项 / `-18` / `-19` / `-22` / `S1-G-4` 的 `scenes[].label` 归码）—— 来源：`testcase:2315-2316`；收敛时机：③ 逐条判「采纳 / 不采纳」并留痕，**采纳 = 改用例须派新 sdet 实例**。
- `L-5` `ALLOWED_OPS` 的具体算子清单 spec `:191` 未枚举 —— 来源：plan `L-5`；收敛时机：③ 写 `expression.mjs` 时若与 spec 对不上就回 ② 段补一行，不得在 ③ 段自行增删算子。
- `C-1`～`C-5` 议会台账候选（全 P2，带触发信号）—— 来源：`.session/reviews/2026-10-29-1501-agent-card-s1-parliament/delivery-audit.md` §C + `problems.md`；与 ③ 无直接关系，触碰对应文件时同批处理。
- `L-2` `registeredIds` 单源切换（S2 `tools/observation-check/registered-ids.mjs:5` 仍是手写常量）/ `L-3` 15 卡豁免窗口 —— 收敛时机均为 **S4 首次重生成**，本段只交 `registeredIdsOf()`、不接线、不触发。

## 开工前先做

1. `git status --porcelain`（应空串；`git log --oneline -1` 应 `7e5a4ec`）+ 复跑元信息表『验证基线』的七条命令（`npm run check` / `node scripts/check-gate-record.mjs` / 裸 `node scripts/scope-sweep.mjs --check` / `node scripts/doc-name.mjs --check docs` / `check-plan` 的 `coverage` `deps` `map` `size`），数值应与基线逐项相同。
2. 读 plan 的 **Global Constraints（`:18-35`）** + **Task 1** 全部 Step（`## Task 1:` 段至 `## Task 2:` 前）+ **附录 B**；读 spec §3 `:35-53` / §5 `:115-133`；读 testcase §0.3 `:64-216`（helper 逐字，不得改写常量来源）。
3. 建 `tools/docgen/card-model/enums.mjs`：Task 1 Step 1（8 张冻结表，值逐字）+ Step 2（`ID_NAME_RE` / `VAGUE_TERMS` 5 / `HARDCODED_COUNT` 三条式 / `POINTER_WORDS` 5 / `PROC_WORDS` 5 / `MIXED_PAIR` / **`SCAN_FIELDS` 8 键**）+ Step 3 两个 vocab（`PRD:270` 5 词、`PRD:202` 6 词）。
4. 建 `landings.mjs`（`resolveLanding` 三档）/ `scenes.mjs` / `signals.mjs`（Step 4–5，判定入参收 `env.seatScenes` / `env.seatSignals`）+ `index.mjs` v1（Step 6，只导出已建面，头部注释写死终态 = §3 `:48` 的 18 项）。
5. 建 `tools/docgen/test/card-model.test.mjs` 骨架（Step 7：§0.3 helper 逐字落盘，import 只列已建模块）+ A 组 4 条（A02 / A03 / A04 / A05①）；收尾 `node --test "tools/docgen/test/card-model.test.mjs"` 与 `npm run check` 均 exit 0 后，按附录 B 提交第 1 个 commit。

## 开场话术

读 `docs/handoffs/2026-10-29-agent-card-s1-impl.md`，按交接词继续：开工 agent-card S1 的 ③ 施工（从 plan 的 Task 1 起，产出 `tools/docgen/card-model/` 的 12 个 `.mjs` + `tools/docgen/test/card-model.test.mjs`，过 ③ 出口由审计签字）。注意：开工第一问是「③ 是否按附录 B 的 8 个提交逐 Task 切」，先与我确认再动手。
