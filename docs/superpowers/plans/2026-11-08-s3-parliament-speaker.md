# S3 议会独立议长与答辩方：实施计划（批次 A 先施工）

> Spec：`docs/superpowers/specs/2026-11-08-s3-a-speaker-seats-design.md`
**Testcase:** `docs/superpowers/specs/2026-11-08-s3-a-speaker-seats-design-testcase.md`
> 上游：`docs/prd/20261024073606-dev-workflow-mainline/index.md:729-738`（F-10 / F-11 / F-18 / F-19）、`:724`（F-05）、`:725`（F-06）、`:727`（F-08）、`:742`（F-23）
> 批次划分：Task 1–7 = 批次 A（本 spec）；Task 8–12 = 批次 B（S3-B，另起 spec，本计划只定落点不施工）

**执行顺序**：T1 → T2 →（T3 / T4 / T5 / T6 可并行）→ T7 → 验收 A → B 段起点。

## Task 1 三席席数据落盘

- Consumes: 无
- 新建 `tools/docgen/dsl/agents/seats/speaker.json` / `respondent-architect.json` / `respondent-dev.json`
- 每份 = 顶层 6 键（`name` / `role` / `dimension` / `outputKind` / `card` / `trigger`，另可带 `boundary`）+ `card` 恰 8 键；`duty.trigger` 恒 `''`
- `boundary` 写席 JSON 顶层（走 `seatLoader.mjs:112` 的 `...s` 合并），三席各一句，不得复用 `DEFAULT_BOUNDARY`
- 落点验收：S3A-01

## Task 2 席序与档位登记

- Consumes: Task 1
- `components/seatLoader.mjs:12-14` 的 `SEAT_ORDER` 追加三席（目录 ↔ 席序双向恰等）
- `policy/seat-policy.mjs` 加三条：`speaker` = read/write/exec + `check.local`/`git.read`/`docgen.read` + `progress.md`；`respondent-dev` = read/exec + `check.local`/`git.read`；`respondent-architect` = read
- `policy/definitions/seats.mjs` 加三席 `display`（议长 / 架构答辩 / 研发答辩）
- `components/validateAgentData.mjs:114` 的 `DECLARED_SLOT_SEATS` 加三席
- 落点验收：S3A-02、S3A-04

## Task 3 两份输出合同

- Consumes: Task 1
- `components/patternRegistry.mjs` 的 `outputKind` 集合加 `proceeding` / `defense`
- `components/outputFormats.mjs` 加两份 `{fields[], checks[]}`（结构见 spec §8）
- 落点验收：S3A-05

## Task 4 议会席判定去前缀化

- Consumes: Task 1、Task 2
- 导出 `cardPipeline.mjs` 的 `NON_PARL_SEATS` 为唯一源；`check-trigger-kind.mjs:15-16` 改读它，删 `PARL_PREFIXES` 前缀推断
- `test/sc-card-shape.test.mjs:450-457` 同批改为比对 `NON_PARL_SEATS`
- 落点验收：S3A-03

## Task 5 新席出生通路

- Consumes: Task 1、Task 2
- `cli.mjs` 的 `replace` 加 `--new`：前置 = 卡不存在且 `state.json` 已登记 `replaced`；跳过迁移四道证明；不读旧 evidence，写盘后新建（40/64 位 hex 口径见 spec §6）；不追加 `changes`
- `--new` 落在已有卡的席上 → `InvalidArgs`
- `state.json` 先登记三条 `replaced`
- 落点验收：S3A-06、S3A-07

## Task 6 `hostTerm` 改名

- Consumes: Task 1、Task 2
- `dsl/agents/shared.json:5` 改「议长」；手改 `writeScopes.mjs:8,14`、`artifacts.mjs:1-2`、`check-trigger-kind.mjs:4` 的注释/描述串
- `MIXED_PAIR` 保留（删词条归批次 B）
- 落点验收：S3A-08、S3A-09

## Task 7 重生成与门禁

- Consumes: Task 2、Task 3、Task 4、Task 5、Task 6
- 逐席 `replace --new` → `generate` 比对 → `generate --readme --apply` → `baseline --write` → `gate`
- 同批改已签断言：`card-render.test.mjs:198`（5→7）、`policy-pure-source.test.mjs:1167`（4→7）/`:416`（7）/`:504`（6）/`:1268`（6）、`sc-card-shape.test.mjs:372-377`（12/1/1/4）、`dev-workflow-counts.test.mjs:67`（17/18）；`:1168` 与派生断言不动
- 落点验收：S3A-10、S3A-11、S3A-12、S3A-13、S3A-14

## Task 8 答辩/议长职责二分（批次 B）

- Consumes: Task 7
- `references/host-duties.md` 拆 `speaker-duties.md` + `respondent-duties.md`，删「主 agent 扮演」
- 落点：S3-B spec（待写）

## Task 9 两张矩阵（批次 B）

- Consumes: Task 8
- `assembly-matrix.md` 加议长常驻 + 答辩方镜像编制，更新已过时的 `agentData.mjs` 路径
- `submission-matrix.md` 加「答辩方」列；PRD 行留空待 S2，spec 行加「差异清单」
- 落点：S3-B spec（待写）

## Task 10 族映射表与侦探守恒（批次 B）

- Consumes: Task 9
- 新增 `assets/family-map.md`（原卡号 → 族号 → 理由）；`debate-protocol.md` 加侦探三条守恒核对
- 落点：S3-B spec（待写）

## Task 11 issue-card 级别栏位化（批次 B）

- Consumes: Task 9
- `assets/issue-card.md` 与 `outputFormats.issue-card` 加「不改会导致的具体后果」栏；P0 必写、缺栏自动降 P2、双方级别冲突取 P0 并列依据
- 落点：S3-B spec（待写）

## Task 12 SKILL 与模板改名、议会文档清零（批次 B）

- Consumes: Task 8、Task 9、Task 10、Task 11
- `SKILL.md` 与 `assets/{progress,round-check,delivery-audit,submission}.md` 的「主持人」改「议长」
- 删 `enums.mjs:81` 的 `MIXED_PAIR` 词条；`rg "主持人" skills/parliament tools/docgen agents` = 0
- 落点：S3-B spec（待写）

## 功能点 → 任务映射

| 功能点 | 任务 | 说明 |
|---|---|---|
| F-05 产品评委分工 | Task 9 | 两张矩阵（B 段） |
| F-06 议会 #1 | Task 12 | SKILL 插点形态（B 段） |
| F-08 议会 #2 | Task 12 | SKILL 插点形态（B 段） |
| F-10 独立议长 | Task 1、Task 2、Task 5、Task 6、Task 7 | 批次 A 主交付 |
| F-11 答辩方子代理 | Task 1、Task 2、Task 3、Task 5、Task 7 | 批次 A 主交付 |
| F-18 收敛机制 | Task 10 | 族映射表 + 侦探守恒（B 段） |
| F-19 级别栏位化 | Task 11 | issue-card 栏位（B 段） |
| F-23 旁路判据 | Task 12 | 按旁路执行（B 段） |

## 附录 A 用例 → 任务落点

| 用例 ID | 任务 | 验收 ID |
|---|---|---|
| S3A-TC-01 | Task 1 | S3A-01 |
| S3A-TC-02 | Task 1 | S3A-01 |
| S3A-TC-03 | Task 1 | S3A-01 |
| S3A-TC-04 | Task 1 | S3A-01 |
| S3A-TC-05 | Task 1 | S3A-01 |
| S3A-TC-06 | Task 2 | S3A-02 |
| S3A-TC-07 | Task 2 | S3A-02 |
| S3A-TC-08 | Task 2 | S3A-02 |
| S3A-TC-09 | Task 2 | S3A-02 |
| S3A-TC-10 | Task 2 | S3A-02 |
| S3A-TC-11 | Task 4 | S3A-03 |
| S3A-TC-12 | Task 4 | S3A-03 |
| S3A-TC-13 | Task 4 | S3A-03 |
| S3A-TC-14 | Task 4 | S3A-03 |
| S3A-TC-15 | Task 2 | S3A-04 |
| S3A-TC-16 | Task 2 | S3A-04 |
| S3A-TC-17 | Task 2 | S3A-04 |
| S3A-TC-18 | Task 3 | S3A-05 |
| S3A-TC-19 | Task 3 | S3A-05 |
| S3A-TC-20 | Task 3 | S3A-05 |
| S3A-TC-21 | Task 3 | S3A-05 |
| S3A-TC-22 | Task 5 | S3A-06 |
| S3A-TC-23 | Task 5 | S3A-06 |
| S3A-TC-24 | Task 5 | S3A-06 |
| S3A-TC-25 | Task 5 | S3A-06 |
| S3A-TC-26 | Task 5 | S3A-06 |
| S3A-TC-27 | Task 5 | S3A-06 |
| S3A-TC-28 | Task 5 | S3A-07 |
| S3A-TC-29 | Task 5 | S3A-07 |
| S3A-TC-30 | Task 6 | S3A-08 |
| S3A-TC-31 | Task 6 | S3A-08 |
| S3A-TC-32 | Task 6 | S3A-08 |
| S3A-TC-33 | Task 6 | S3A-09 |
| S3A-TC-34 | Task 6 | S3A-09 |
| S3A-TC-35 | Task 6 | S3A-09 |
| S3A-TC-36 | Task 7 | S3A-10 |
| S3A-TC-37 | Task 7 | S3A-10 |
| S3A-TC-38 | Task 7 | S3A-10 |
| S3A-TC-39 | Task 7 | S3A-11 |
| S3A-TC-40 | Task 7 | S3A-11 |
| S3A-TC-41 | Task 7 | S3A-11 |
| S3A-TC-42 | Task 7 | S3A-11 |
| S3A-TC-43 | Task 7 | S3A-12 |
| S3A-TC-44 | Task 7 | S3A-12 |
| S3A-TC-45 | Task 7 | S3A-12 |
| S3A-TC-46 | Task 7 | S3A-13 |
| S3A-TC-47 | Task 7 | S3A-13 |
| S3A-TC-48 | Task 7 | S3A-13 |
| S3A-TC-49 | Task 7 | S3A-13 |
| S3A-TC-50 | Task 7 | S3A-13 |
| S3A-TC-51 | Task 7 | S3A-14 |
| S3A-TC-52 | Task 7 | S3A-14 |
| S3A-TC-53 | Task 7 | S3A-14 |
| S3A-TC-54 | Task 7 | S3A-14 |
| S3A-TC-55 | Task 7 | S3A-14 |
| S3A-TC-56 | Task 7 | S3A-14 |
| S3A-TC-57 | Task 7 | S3A-14 |
| S3A-TC-58 | Task 7 | S3A-14 |
| S3A-TC-59 | Task 2 | S3A-02 |
| S3A-TC-60 | Task 6 | S3A-09 |
| S3A-TC-61 | Task 4 | S3A-03 |
| S3A-TC-62 | Task 7 | S3A-11 |
| S3A-TC-63 | Task 4 | S3A-03 |
| S3A-TC-64 | Task 7 | S3A-10 |
| S3A-TC-65 | Task 2 | S3A-04 |
| S3A-TC-66 | Task 5 | S3A-06 |
| S3A-TC-67 | Task 5 | S3A-06 |
| S3A-TC-68 | Task 2 | S3A-01 |
| S3A-TC-69 | Task 5 | S3A-06 |
| S3A-TC-70 | Task 5 | S3A-06 |
| S3A-TC-71 | Task 2 | S3A-01 |
