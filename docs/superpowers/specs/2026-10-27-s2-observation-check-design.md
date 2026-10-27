> split from `docs/prd/20261026205821-agent-card-contract.md` (2026-10-27)

## 10 S2 产物合同：observation-check 收编入库 + 最小 CLI

### 10.0 为什么

PRD §1 P-3：观察表只有 markdown、字段靠正则猜，文本校验器 9 条对抗用例被绕过 8 条（PRD §0.3「形态对照实验」与 §14.1 实测，主证据是 8/9 → 0）。已绿的 888 行校验实现目前躺在仓库外草稿区（`C:\Users\HuangChunhua\.retro-skills\observation-check-draft\`，11 文件 / 71 测试），不在版本库里就永远成不了仓库成果——**先收进 git 才有价值**（成本已沉没，见 PRD §0.4「S2 已付成本」）。

### 10.1 核心决定（不可违反）

| # | 决定 | 为什么 |
|---|---|---|
| R1 | 草稿**原样迁入** `tools/observation-check/`（迁入提交：diff 只有新增文件，不改一行）；同一提交登记 11 个文件的 sha256，**取值 = 迁入瞬间草稿区 `Get-FileHash` 实算值**（三方基准，防「清单与仓库文件自记自证」绕过） | 迁入即审计锚：改动历史可追、内容可与草稿区三方对账（PRD §8 S2 出口判据「原样迁入」） |
| R2 | 改造提交后基线不退：仓库根测试全绿且**总数 ≥ 71**（71 = 迁入基线数，新增测试另计）；**测试对 `agents/` 的引用数 = 0**（证据夹具一律 `mkdtempSync` 自建——迁入时点 10 条依赖 `agents/` 的用例在仓库根反而绿，属已知情状态，改造提交重写夹具解除）；终验 = 临时移走 `agents/detective-observer.md` 后仍全绿 | 引用仓库文件的测试换机即假红（PRD §8 S2 出口判据「基线不退」+ 终验命令；§0.3 校验实现测试条） |
| R3 | §4.4 B 表 **S2 组**每个错误码至少 1 条反例；A 表 5 个零测试码补齐；三类不出码用例（`skipped` 非空正例、`read > total` 反例、含 ASCII `\|` 字段渲染后列数 = 表头列数）必须有 | 已实现的码没测试 = 拦不住不知道；零测试码列表见 PRD §4.4 A 表注（PRD §8 S2 出口判据「新增判据有测试」） |
| R4 | golden 基线：`observation-r3.json` + `observation-r3.expected.md`（人工写），断言 `renderObservation` 全文等于期望文件 | 渲染器改一行、全仓历史 md 全红；golden 是唯一防回归手段（PRD §8 S2 出口判据「golden 基线」） |
| R5 | `node tools/observation-check/cli.mjs <json>` 能单件校验；`rewrite` 只重渲染 md | 门禁之外必须有单件入口，否则排查只能跑全量（PRD §8 S2 出口判据「CLI 可用」；F-20） |
| R6 | 覆盖语义一次性重写：7 处 fixture + 1 处探索稿指针（探索稿 `:686` schema 片段改为指向 PRD 的指针），禁止放宽断言 | `coverage` 三字段语义是议会 #1 改判口径，旧 fixture 按旧语义会假绿（PRD §8 S2 出口判据「覆盖语义」；C-02） |
| R7 | 归档一件合法产物后 `npm run check` 仍绿 | 收编不能把仓库门禁搞红（PRD §8 S2 出口判据「仓门禁不红」） |

### 10.2 机制

**迁入与改造，两阶段提交**（草稿区 → `tools/observation-check/`）：

- **迁入提交**：① 草稿区 11 文件复制到 `tools/observation-check/`（原样，不改一行；`git mv` 不适用：文件在仓库外）；② 提交只含新增文件，同一提交登记 sha256 清单，**取值 = 迁入瞬间草稿区 `Get-FileHash` 实算值**；③ 仓库根跑 `node --test tools/observation-check/*.test.mjs` → 71/71（草稿 cwd 下 10 条依赖仓库文件的用例在仓库根反而绿，`agents/` 引用此时暂存，属已知情状态）。
- **改造提交起**：证据夹具 `mkdtempSync` 自建重写（10 条假红根源解除）→ §4 判据差距补齐 → `agents/` 引用 = 0、总数 ≥ 71；终验 = 临时移走 `agents/detective-observer.md` 后仍全绿。

**registeredIds 单源清单（前置交付物，PRD §8 硬前置）**：`tools/observation-check/registered-ids.mjs`（名可由 plan 定），登记本轮检查项 id 常量清单，首个改造提交建立；S1 落地后按 §10.6 切 `Object.keys(CHECK_ITEMS)` 派生。

**四段校验链**（PRD §4.2，**骨架已实现**）：结构 → 证据 → 渲染 → 写盘，四段全过才落盘。骨架与 PRD 判据的差距 16 项清单见 testcase §0.2（七条覆盖对账缺 5、敏感两道零实现、ASCII `\|` 转义零实现等）；**S2 实现义务 = §4.1～§4.5 全部判据差距 + §4.4 B 表 S2 组的码 + 最小 CLI**（PRD §8「同批落 §4 的新增判据与最小 CLI」，不止补码）。

**唯一写盘入口**（PRD §4.5，**骨架已实现**）：目标签名 `writeObservation(doc, { jsonDir, registeredIds })`——草稿现状为 `jsonPath/mdPath/root` 任意路径半写态，属 16 项差距之列；文件名由 `doc.round` 派生；目的地正则只允许过程目录。S2 不新增写盘点。

**最小 CLI**（F-20，**从零新建**——草稿区无 cli.mjs）：`cli.mjs <json>` 单件校验（exit 0/1；stdout 逐行错误码；json 在而同名 md 缺 → `MdMissing`，缺省不得跳过，PRD §4.2 ③）+ `rewrite <json>` 就地重渲染同名 md（json 字节不动）。

### 10.3 硬约束（与核心决定交叉引用）

R1–R7 的判据全部来自 PRD §4 / §5 / §8；S2 不越过 PRD 已定边界（A-6 json 权威 / A-8 归档强制 / C-04 只写过程目录 / C-05 迁移状态机）。

### 10.4 测试（只写「测什么 / 为什么」）

| 测什么 | 为什么 |
|---|---|
| §4.4 B 表 S2 组逐码反例；A 表 5 个零测试码；三类不出码用例 | 错误码是合同的执行面，无反例 = 无验证（详见 PRD §8 S2 出口判据「新增判据有测试」） |
| golden 全文断言 | 渲染一致性靠逐字符对比，不能靠抽查（PRD §8 S2 出口判据「golden 基线」） |
| 迁入后 71/71 + 对 `agents/` 零引用 | 基线不退是硬承诺（PRD §8 S2 出口判据「基线不退」） |
| 覆盖语义 7 处 fixture 重写后仍绿 | 语义改判必须同批落到实现（C-02；PRD §8 S2 出口判据「覆盖语义」） |
| 对抗用例集（Q-A-05 分母） | 精算师挂起项：9 条对抗的分母必须由这套用例给出唯一口径（PRD §0.5 Q-A-05） |

**测试用例文件**：`docs/superpowers/specs/2026-10-27-s2-observation-check-design-testcase.md`

**只手动验证**：无（全部可机器判）

**不测**：S1 的模型层错误码（零实现，见 PRD §4.4 B 表 S1 组）；S3 的门禁接入（`check-all.mjs` 增段）；S4 的渲染层（三投影 / 全席重生成）—— 均不在本 spec 范围。

### 10.5 不在这一轮

- S1 定义层（F-01～F-08，`tools/docgen/**` 模型与校验）：未开工，见 PRD §8 S1。
- S3 门禁接入（F-17～F-19、F-22、F-24）：`check-all.mjs` 增段 + git 断言 + 反向清单，见 PRD §8 S3。
- S4 渲染层（F-09～F-12、F-23）：三投影 + 全席重生成，见 PRD §8 S4。

### 10.6 将来才会撞上的一件事

S1 落地后 `registeredIds` 从单一常量文件改为 `Object.keys(CHECK_ITEMS)` 派生（PRD §4.1），届时本 spec 引用的常量文件要同步改。

### 10.7 与既有 spec 的关系

- 新 spec，无取代对象。

### 10.8 验收锚点（= PRD §8 S2 出口判据七条）

1. 原样迁入（含 sha256 清单）
2. 基线不退（迁入基线 71/71；改造后总数 ≥ 71 + `agents/` 零引用 + 移走 `agents/detective-observer.md` 终验）
3. 新增判据有测试（B 表 S2 组 + A 表 5 零测试码 + 三类不出码用例）
4. golden 基线（`observation-r3.json` + expected md）
5. 覆盖语义（7 处 fixture + 1 探索稿指针重写，禁放宽）
6. CLI 可用（`cli.mjs` 单件 + `rewrite`）
7. 仓门禁不红（归档一件合法产物后 `npm run check` 绿）

以上七条即本 spec 的验收锚点，判据与取数命令以 PRD §8 S2 出口判据表为准。
