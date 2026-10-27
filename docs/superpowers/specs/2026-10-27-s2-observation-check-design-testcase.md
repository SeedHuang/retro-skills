# S2 观察产物校验器（observation-check）配套 testcase

> 归属 spec：`docs/superpowers/specs/2026-10-27-s2-observation-check-design.md`
> 验收锚点：spec §10.8 七条 = PRD §8 S2 出口判据表（判据与取数命令以 PRD 为准）
> 编写者：senior-sdet 子代理，全新上下文编写
> 独立性声明：编写者 ≠ spec 作者、≠ 施工者；只读 spec / PRD / 草稿区实现与测试，未参与任何实现；业务代码、spec、rule、skill、agent 一律未改动
> B19 编写者 / 独立性声明：senior-sdet 子代理（第二次全新上下文，2026-10-27）；编写者 ≠ spec 作者、≠ 施工者，未参与 B19 以外任何实现
> B20 / G06 编写者 / 独立性声明：senior-sdet 子代理（**第四次全新上下文，2026-10-27**）；编写者 ≠ spec 作者、≠ 施工者，未参与 B20 / G06 对应的任何实现（只读 PRD 代裁行 C-15 / C-16、`tools/observation-check/` 现存实现与常驻测试，用例判据按现存测试逐条对账）；本次只改本 testcase（新增 B20 负例 + G06 边界 + 全量计数与对位表同步）
> R1 修订者 / 独立性声明：senior-sdet 子代理（**第三次全新上下文，2026-10-27**）；本次只改本 testcase（C07 前置定名 + 新增 C08 + 计数与 A01–A03 零提交口径对齐），未改 spec 正文、未改任何代码、未参与实现
> 编写日期：2026-10-27｜版本：**v5**（v2 = 议会 #2 第 1 轮修订：行号勘误 + 口径校正（A02 内容流 hash / A03 原命令口径）+ 测试落点去 `test/` 子目录 + 补 E14 + 8-1 转「已解决」；v3 = 第 2 轮修订 + 侦探 H-01/H-02 补丁：A02 前置定死 commit message 载体、E11「不覆盖」句改指 E14、E14 判据改 node `crypto.createHash`、演练目录改 `test-obs-check-<rand>` 前缀，2026-10-27 12:13）；v4 = 议会派工 B19 补入（2026-10-27，senior-sdet 第二次全新上下文独立编写）；**v5 = R1 修订（2026-10-27，senior-sdet 第三次全新上下文）：F040 清 C07 过期占位（码名已登记 `EvidenceStructuralRow`）+ F010 补 C08 `RepoRootUnresolved` 反例 + 计数改 71 / 26 / 40 / 5 + A01–A03 按「全程零提交」裁定改锚账本 §迁入清单**；**v6 = B20 / G06 补入（2026-10-27，senior-sdet 第四次全新上下文）：B20 = PRD §0.6 C-16 / §4.2 ① 第 5 条集合语义（`skipped` 内 id 重复 → `CoverageMismatch`，message 含「重复」；B10 过期「不覆盖」句改指本条）+ G06 = PRD §5.2 :410 C-15（`<次>/attachments/` 仅一层、文件名不限 8 类）+ 计数改 73 / 26 / 41 / 6**；**v7 = §10 施工期补入登记（2026-10-27，④ 段 senior-sdet 独立实例，未参与施工）：新增 11 条 = X01–X10（负 5 / 边界 5，计入类型）+ X11（现状登记，不计类型）+ 覆盖总表 11 行；计数改「已签 73（26/41/6）+ 补入 11（0/5/5 + 现状 1）」＝ 84 行；已签 73 条的任何结论句一字未动（只追加）**
> 命名与落点：spec 文件名去掉 `-design.md` 后加 `-testcase.md`，同目录（spec-testcase-gate 判据 1）

## 0 判据基线（读用例前先认事实；全部来自仓库与草稿区现状，可复核）

### 0.1 草稿区实测（编写时逐条复算，非转述）

- 草稿区 11 文件（`C:\Users\HuangChunhua\.retro-skills\observation-check-draft\`）：`checks.mjs` / `evidence.mjs` / `artifact.mjs` / `render.mjs` / `data.mjs` + 6 个 `*.test.mjs`，合计 **888 行 / 11 文件**（实测 `Get-Content *.mjs | Measure-Object -Line` = 888，与 PRD §0.4 一致）——该命令**不计空行**；草稿区物理行合计 1015（`(Get-Content *.mjs).Count`，每行都计），两者不可混用（A03 判据取前者）。
- 测试基线 **71 条**：checks 12 + evidence 22 + artifact 9 + write 8 + render-check 7 + adversarial 13（逐文件数 `test(` 计）。
- **仓库根执行 71/71 全绿**（实测 `node --test 草稿\*.test.mjs`，cwd = 仓库根，102ms）；**草稿目录执行 61/71**（实测 10 条 fail）。10 条依赖仓库文件的假红用例（编写者逐条推导并实测对账一致）：
  1. `checks.test.mjs`「正例：接上读盘校验后，真实证据仍通过」（证据 = `agents/detective-observer.md`）
  2. `evidence.test.mjs`「正例：真实仓库文件可解析」
  3. `artifact.test.mjs`「正例：json 合法 + md 与渲染一致」
  4. `artifact.test.mjs`「反例：md 被手改 → RenderMismatch」（草稿 cwd 下证据先红，结构错短路导致渲染比对不跑）
  5. `artifact.test.mjs`「退出码：通过 0 / 失败 1」（合法件在草稿 cwd 下证据假红 → exit 1 ≠ 0）
  6. `write.test.mjs`「正例：合法产物 → 两个文件都写」
  7. `write.test.mjs`「正例：重复写入幂等」
  8. `write.test.mjs`「联动：写完手改 md → 读时校验报 RenderMismatch」
  9. `adversarial.test.mjs` A10（行号越界 → 草稿 cwd 下先报 EvidenceNotFound ≠ 期望码）
  10. `adversarial.test.mjs` A11（引用不符 → 同上）
- 仓门禁现状：`scripts/check-all.mjs:76` 用 `node --test '**/*.test.mjs'` 全仓 glob（0.4 节基线 734 pass + 2 skip；门禁边际 23.9s）——迁入 `tools/observation-check/*.test.mjs` 后自动被 `npm run check` 覆盖，无需新增入口。
- 竖线转义单源：`tools/execution-matrix/markdown-rows.mjs:15`（`splitRow`：代码跨度外的 `\|` 是转义竖线、不切列）——PRD §4.2 ③ 要求渲染转义与它共用单源口径。
- 探索稿现状：`docs/after/20261026164718-agent-card-composition-exploration.md:686` 现为 schema 片段原文（`coverage: { read, total, skipped: [] },`）；`:666` 记录文本版检查器 9 条对抗、8 条具名被绕过（代码块藏字段 / 覆盖度写「无」/ 列表式补充项 / 标题变体 / 全角竖线 / 结论换说法 / mustHave 拼错 / must 写成字符串），第 9 条未具名；`:668` 另一处写「0/10」——分母漂移即 PRD §0.5 Q-A-05 挂起项。
- 存量白名单目录在位：`docs/superpowers/reviews/2026-10-25-1723-s6-eval/`（PRD §5.2 目录白名单唯一成员，实测存在）。

### 0.2 已实现面与 PRD 判据差距（S2 同批必须补齐的实现面；本 testcase 的负例大多落在此表）

| # | PRD 判据（出处） | 草稿现状（path:line） | 差距 |
|---|---|---|---|
| 1 | miss / na 必带 reason（§4.1） | `checks.mjs`（草稿区 行 50-52） 只判 `na` 分支 | **miss 无 reason 假绿**（盲点，B05 对位） |
| 2 | hit 行渲染必须含 path:line（§4.2 ③） | `checks.mjs`（草稿区 行 128-129）：hit 行渲染 `it.evidence` 对象 → 输出 `[object Object]` | 渲染最小信息集未实现（D01 对位） |
| 3 | 覆盖七条对账（§4.2 ①：items.id 唯一 / items ⊆ registeredIds / items.length===read / read+skipped===total / skipped ⊆ registeredIds / items∩skipped=∅ / total===registeredIds.length） | **只实现 1 条**（`UnknownItem`，`checks.mjs`（草稿区 行 47）；`read ≤ total` 归类在 A 表 `InvalidCoverage`，不计入七条） | 6 条对账缺（B07-B12 对位） |
| 4 | registeredIds 必填（§4.1，缺失 → UnregisteredIdsMissing） | `checks.mjs`（草稿区 行 28） 默认 `registeredIds = []`，缺参静默 | B15 对位 |
| 5 | hit 无 evidence → MissingEvidence（§4.4 B 表） | 现报 InvalidFieldType（`checks.mjs`（草稿区 行 14-15）） | 码细分未做（B16 对位；adversarial A7 断言须同批改） |
| 6 | 证据第 6/7 道：敏感路径 / 敏感内容（§4.3） | `evidence.mjs` 七道中 1-5 道已实现，第 6/7 道零实现 | C01-C05 对位 |
| 7 | 纯结构行不可作证据（§4.3 第 5 道附带判据） | 零实现；「\| --- \| --- \| --- \|」13 字可过长度下限（假绿） | C07 对位；**码名已登记 `EvidenceStructuralRow`（PRD :355，2026-10-27）**，G-8 闭合 |
| 8 | md 读失败收敛 MdUnreadable 不冒泡（§4.2 ②/③） | `artifact.mjs`（草稿区 行 22-38） 的 `readFileSync(mdPath)` 无 try-catch，mdPath 为目录时 EISDIR 冒泡 | C06 对位 |
| 9 | ASCII 竖线转义 + splitRow 单源复算列数（§4.2 ③） | `renderObservation` 直接模板拼接，零转义 | D03/D04 对位 |
| 10 | 唯一写盘入口签名 `{ jsonDir, registeredIds }` + 文件名派生 + 目的地正则 + RoundMismatch + 归档只读（§4.5） | `artifact.mjs`（草稿区 行 49-55） 现签名 `{ jsonPath, mdPath, registeredIds, root }` 接收任意路径；目的地判据零实现 | E01-E05/E13/E14 对位；G-3 已解决（spec §10.2 v2 两态标注，见 §8-1） |
| 11 | root 不接受传参、唯一来源 git rev-parse（§4.3 第 2 道 + §5.2 最小化） | `evidence.mjs` / `artifact.mjs` 全部暴露 root 参数（测试传 mkdtemp） | 签名收缩 + 夹具改仓库内自建（§1.2 约定） |
| 12 | 写盘四纪律之「全成功再 rename」「任一失败清 tmp」（§4.2 ④） | `artifact.mjs`（草稿区 行 53-54）：两文件各自 tmp+rename，第一个成功后第二个失败 → 半写态 | E06 对位 |
| 13 | WriteFailed / InvalidWriteTarget（§4.2 ④） | 零实现（写失败直接冒泡） | E06/E07 对位；InvalidWriteTarget 精确判据 PRD 未给（缺口 G-9） |
| 14 | 渲染文案「已判 N 条 / 共 M 条（跳过 K：…）」（§7 D-09 代裁） | `checks.mjs`（草稿区 行 139） 现文案「覆盖度：读 N 部分 / 共 M 部分」 | D08/F02 对位 |
| 15 | md 首行版本横幅 `<!-- observation-md v1 -->`（§5.4 R-7） | 零实现 | **不在 S2 出口判据与 spec R4 内**（缺口 G-7，建议同批） |
| 16 | A 表 8 个已实现未列码（render.mjs：MissingTrigger / MissingCriterion / MissingLanding / MissingCriterionImpl / UnknownLanding / DuplicateStatement / OverrideWithoutReason / PointlessOverride，§4.4 A 表注 2「S2 收进时并入本表」） | `render.mjs`（草稿区 行 33-49） 已实现（throw 带码），但**零测试**（6 个测试文件无一 import render.mjs） | I01/I02 冒烟对位（缺口 G-10） |

### 0.3 判读口径（两处归属歧义，先声明再测；防止 plan 期静默缩小）

1. **ArtifactMissing / UnclassifiedArtifact**：二码判据在 PRD §5.2，运行时门禁（check-all.mjs 增段、扫描根、git 断言）归 S3（F-17～F-19）；但 spec §10.1 R3 与 §10.4 测试表均要求「§4.4 B 表 S2 组每个错误码至少 1 条反例」且无排除条款。本 testcase 按字面义务覆盖：**G03/G04 的测试载体 = S2 在 `tools/observation-check/` 提供目录三态判定的纯函数（含存量白名单常量与允许文件名类清单）**，S3 只负责接线 check-all.mjs。**plan 不得自行挪动**（spec §10.5 已定死：判定纯函数归 S2、运行时接线归 S3）；确需整体挪出 S2 时，须回流议会改 R3 与七锚点第 3 条（走 R8 同批回扫），**不得静默缩小**。
2. **对抗用例集分母（PRD §0.5 Q-A-05）**：分母唯一口径 = **本 testcase §2 H 组登记的攻击向量数**：原文本版 8 条具名攻击（H01 逐条映射）+ adversarial.test.mjs 迁入的 13 条结构化对抗（A1-A13）+ 结构化新增向量（敏感路径 C01 / 敏感内容 C04 / 结构行 C07 / 重复 id B07 / 覆盖伪装 B08-B12）。原第 9 条（未具名）与「0/10」的第 10 例**不进入结构化分母**——结构化口径以登记向量为基数，不以历史清单条数为基数。分母变更 = 判据级口径变更 → 按 R8 同批回扫 PRD §0.3 / §0.5 Q-A-05 行与 H02 的常量。

### 0.4 测试设计九问自答（固定清单逐条；答案已折进用例的「为什么」与分组）

| # | 问题 | 自答（落点） |
|---|---|---|
| 1 | 谁用、从哪进？ | 产物生产者（侦探席/议会）走 `writeObservation`；复核与门禁走 `cli.mjs` 单件校验；读产物的是议会人 + AI。正例沿这三个入口各铺一条（E01/E05、E08、G01） |
| 2 | 每个验收锚点有正例吗？ | spec §10.8 七锚点逐个有正例：锚点1→A01-A03；锚点2→A04-A06；锚点3→B14/B18/C03/C05；锚点4→D05；锚点5→F01/F02/F04；锚点6→E08/E12；锚点7→G01/G02 |
| 3 | 每个错误码有负例吗？ | B 表 S2 组 16 码逐码 ≥1 反例（§1.1 对位表，含 `EvidenceStructuralRow`→C07、`RepoRootUnresolved`→C08）；A 表 5 零测试码 B01-B06；A 表并入 8 码 I01/I02 |
| 4 | 边界测了吗？ | quote 长度边界（4/9/10 字，已有测试保留）；read=total 恰等、skipped=total−read（B14）；instance 成对（B18）；CRLF/幂等（保留）；md 被目录占位（E06）；删 agents 文件后全绿（A06）；拦不住的两类合谋（H03/H04） |
| 5 | 失败可定位吗？ | RenderMismatch 带行号（保留）；每负例断言错误码逐字；CLI 退出码 0/1 + stdout 码清单（E09） |
| 6 | 假阳性守卫有吗？ | 敏感判据不误报（C03/C05）；合法跳过不判红（B14）；全角 ｜ 是内容不转义且不破列（H01-5）；含 ASCII \| 的合法产物全链路绿（D04）；存量白名单不误伤（G05） |
| 7 | 回归面锁了吗？ | golden 三件套（D05-D07）；对抗分母常量（H02）；保留 71 条原测试的意图不删（A04 + F03 + §4 回归清单） |
| 8 | 隔离与依赖注入呢？ | 夹具一律 mkdtempSync 自建于仓库内（root 唯一来源 = git 顶层，见 0.2 #11）；对 `agents/` 引用 = 0（A05）；一次性提交审计用固定 commit hash 常量（A01-A03） |
| 9 | 测不了的谁兜底？ | §6 不测逐条给理由与兜底：S1 模型层零实现、S3 门禁接入、S4 渲染层、V-8 其余四处、语义判定归审计人、Windows 软链实盘构造 |

## 1 覆盖总表

执行方式说明：**常驻** = 进 `tools/observation-check/` 的 node --test 文件，随 `npm run check` 跑；**验收** = 机器命令（命令 + 退出码），因一次性提交审计 / 时长（npm run check 23.9s）/ 全局态（临时移文件）不设常驻，按「执行时点」跑。

> A01–A03 的「零提交口径」是**迁入时点**的验收语境；本批最终已按 spec §10.2 落成两提交（`9f45096` 原样迁入 / `5c63c57` 改造），故其等价锚 = `9f45096`（`git show 9f45096:<path>` 逐文件 sha256 可复算，与提交信息登记值逐字相等），时点等价、判据不变（2026-10-27 补注）。

| ID | 覆盖锚点（spec §10.x / PRD §x） | 一句话场景 | 类型 | 层级 | 执行方式 | 优先级 |
|---|---|---|---|---|---|---|
| A01 | §10.8-1 / §10.1 R1 / PRD §8 | 迁入后 11 文件全为新增（`git status --porcelain` 恰 11 行 `??`、零 M/D/R） | 正 | 集成 | 验收（一次性，零提交口径） | P0 |
| A02 | §10.8-1 / §10.1 R1 / PRD §8 | 11 文件 sha256（对草稿区原件重算）=== 账本 §迁入清单 11 行 | 正 | 集成 | 验收（一次性，零提交口径） | P0 |
| A03 | §10.8-1 / PRD §0.3-0.4 | 草稿区 11 原件合计行数 = 888（原样性对账，PRD §0.4 口径） | 正 | 集成 | 验收（一次性，零提交口径） | P1 |
| A04 | §10.8-2 / §10.1 R2 / PRD §8 | 迁入后（夹具改造完）测试全绿且总数 ≥ 71 | 正 | e2e | 验收（收尾） | P0 |
| A05 | §10.8-2 / §10.1 R2 / PRD §8 | 测试对 `agents/` 引用 = 0（Select-String） | 正 | 静态 | 常驻 | P0 |
| A06 | §10.8-2 / PRD §8 | 临时移走 `agents/detective-observer.md` 后测试仍全绿（复核夹具自建） | 边界 | e2e | 验收（收尾一次性，全局态） | P0 |
| A07 | §10.8-7 / §10.1 R7 / PRD §8 | 迁入后未归档态 `npm run check` 全绿（含 expected.md 等新文件不触发其它检查） | 正 | e2e | 验收（收尾） | P0 |
| B01 | §10.8-3 / PRD §4.4 A 表（零测试码） | doc = null / 数组 / 字符串 → InvalidDocument | 负 | 单元 | 常驻 | P0 |
| B02 | §10.8-3 / PRD §4.4 A 表 | items 缺失 / `[]` / 字符串 → MissingItems | 负 | 单元 | 常驻 | P0 |
| B03 | §10.8-3 / PRD §4.4 A 表 | open 项缺 object / impact / suggestion → MissingOpenField | 负 | 单元 | 常驻 | P0 |
| B04 | §10.8-3 / PRD §4.4 A 表 | na 无 reason / 空白 reason → MissingReason | 负 | 单元 | 常驻 | P0 |
| B05 | §10.8-3 / PRD §4.1「miss / na 必带 reason」 | miss 无 reason → MissingReason（**当前实现只判 na，本条必红**） | 负 | 单元 | 常驻 | P0 |
| B06 | §10.8-3 / PRD §4.4 A 表 | closure 非法值 → UnknownClosure | 负 | 单元 | 常驻 | P0 |
| B07 | §10.8-3 / PRD §4.2 ① / §4.4 B 表 | items.id 重复 → DuplicateItem | 负 | 单元 | 常驻 | P0 |
| B08 | §10.8-3 / PRD §4.2 ① | items.length ≠ coverage.read → CoverageMismatch | 负 | 单元 | 常驻 | P0 |
| B09 | §10.8-3 / PRD §4.2 ① | coverage.total ≠ registeredIds.length → CoverageMismatch | 负 | 单元 | 常驻 | P0 |
| B10 | §10.8-3 / PRD §4.2 ① | read + skipped.length ≠ total → CoverageMismatch | 负 | 单元 | 常驻 | P0 |
| B11 | §10.8-3 / PRD §4.2 ① | skipped 含未登记 id → CoverageMismatch | 负 | 单元 | 常驻 | P0 |
| B12 | §10.8-3 / PRD §4.2 ① | skipped 与 items 相交（同一 id 又判又跳）→ CoverageMismatch | 负 | 单元 | 常驻 | P0 |
| B13 | §10.8-3 三类不出码 / PRD §4.2 ① | coverage.read > total → InvalidCoverage（现有码补直接反例） | 负 | 单元 | 常驻 | P0 |
| B14 | §10.8-3 三类不出码 / PRD §4.2 ① | skipped 非空（部分未判）且七条对账全过 → 零错误码 | 正 | 单元 | 常驻 | P0 |
| B15 | §10.8-3 / PRD §4.1 / §4.4 B 表 | 不传 registeredIds → UnregisteredIdsMissing | 负 | 单元 | 常驻 | P0 |
| B16 | §10.8-3 / PRD §4.4 B 表 | hit 无 evidence → MissingEvidence；hit evidence 非对象 → InvalidFieldType（分界） | 负 | 单元 | 常驻 | P0 |
| B17 | §10.8-3 / PRD §4.1 / §4.4 B 表 | items 含 check:'ai' 条目却无 -a/-b 成对文件 → InstanceMissing | 负 | 集成 | 常驻 | P1 |
| B18 | §10.8-3 / PRD §4.1 | -a / -b 成对双实例 → 双双通过（B17 对照正例） | 正 | 集成 | 常驻 | P1 |
| B19 | §10.8-3 / PRD §4.1 | 删 registeredIds 一个 id（分母缩水）而 coverage.total 不变 → CoverageMismatch（单源清单对账） | 负 | 单元 | 常驻 | P2 |
| B20 | §10.8-3 / PRD §4.2 ① / §0.6 C-16 | skipped 内 id 重复（数组长度虚增掩盖集合语义）→ CoverageMismatch（message 含「重复」） | 负 | 单元 | 常驻 | P0 |
| C01 | §10.8-3 / PRD §4.3 第 6 道 / §4.4 B 表 | 证据路径命中敏感名单逐类 → EvidenceSensitivePath | 负 | 单元 | 常驻 | P0 |
| C02 | §10.8-3 / PRD §4.3 第 6 道 | 分隔符拆段：`dir\.env` 反斜杠写法同样命中 | 负 | 单元 | 常驻 | P1 |
| C03 | §10.8-3 / PRD §4.3 第 6 道 | 普通路径（.md / .mjs）不误报（假阳性守卫） | 正 | 单元 | 常驻 | P0 |
| C04 | §10.8-3 / PRD §4.3 第 7 道 / §4.4 B 表 | quote 含 AKIA / ghp_ / BEGIN PRIVATE KEY / URL 带凭据四形态 → EvidenceQuoteSensitive | 负 | 单元 | 常驻 | P0 |
| C05 | §10.8-3 / PRD §4.3 第 7 道 | 无凭据 URL 与普通文本不误报 | 正 | 单元 | 常驻 | P0 |
| C06 | §10.8-3 / PRD §4.2 ② / §4.4 B 表 | md 存在但不可读（目录占位）→ MdUnreadable 收敛不冒泡 | 负 | 单元 | 常驻 | P0 |
| C07 | §10.8-3 / PRD §4.3 第 5 道 / §4.4 B 表 | 纯结构行（`\| --- \| --- \|`，13 字过长度下限）不可作证据 → EvidenceStructuralRow | 负 | 单元 | 常驻 | P1 |
| C08 | §10.8-3 / PRD §4.3 第 2 道 / §4.4 B 表 | 进程所在目录不在任何 git 仓库内 → RepoRootUnresolved（fail-closed，不退化为 `process.cwd()`） | 负 | 单元 | 常驻（子进程） | P0 |
| D01 | §10.8-3/4 / PRD §4.2 ③ | hit 行渲染含 `path:line`（当前输出 `[object Object]`，本条必红） | 正 | 单元 | 常驻 | P0 |
| D02 | §10.8-3/4 / PRD §4.2 ③ | open 表每行渲染含 evidence 的 path 与 line | 正 | 单元 | 常驻 | P1 |
| D03 | §10.8-3 三类不出码 / PRD §4.2 ③ | 字段含 ASCII `\|` 转义后 splitRow 每行列数 = 表头列数 | 边界 | 单元 | 常驻 | P0 |
| D04 | §10.8-3 / PRD §4.2 ③ | 含 `\|` 的合法产物全链路（写盘 → 读回校验）绿 | 正 | 集成 | 常驻 | P1 |
| D05 | §10.8-4 / §10.1 R4 / PRD §8 | golden：renderObservation(observation-r3.json) 全文 === observation-r3.expected.md | 正 | 单元 | 常驻 | P0 |
| D06 | §10.8-4 / PRD §8 | golden json 覆盖 hit/miss/na/open 非空/skipped 非空全形态（判别力） | 正 | 单元 | 常驻 | P1 |
| D07 | §10.8-4 / PRD §8 | golden 判别力反例：expected.md 手改一字 → 红 | 负 | 单元 | 常驻 | P1 |
| D08 | §10.8-5 / PRD §7 D-09 | 渲染文案为「已判 N 条 / 共 M 条（跳过 K：…）」 | 正 | 单元 | 常驻 | P1 |
| E01 | §10.8-3/6 / PRD §4.5 | writeObservation 新签名：jsonDir + registeredIds，文件名由 round/instance 派生 | 正 | 单元 | 常驻 | P0 |
| E02 | §10.8-3 / PRD §4.4 B 表 | 传入路径 observation-r5 且内容 round=3 → RoundMismatch | 负 | 集成 | 常驻 | P0 |
| E03 | §10.8-3 / PRD §4.5 / §5.3 行 6 | jsonDir 不匹配目的地正则（如 tools/）→ ArtifactPathOutside 零写盘 | 负 | 单元 | 常驻 | P0 |
| E04 | §10.8-3 / PRD §4.5 / §5.3 行 6 | jsonDir 落归档目录 `docs/superpowers/reviews/**` → ArtifactPathOutside（归档只读） | 负 | 单元 | 常驻 | P0 |
| E05 | §10.8-3 / PRD §4.5 | jsonDir = `.session/reviews/<次>/` 合法 → 写盘通过（E03/E04 对照正例） | 正 | 单元 | 常驻 | P0 |
| E06 | §10.8-3 / PRD §4.2 ④ / §4.4 B 表 | md 目标被同名目录占位 → WriteFailed + json 不落盘 + 无 tmp 残留（全成功再 rename） | 负 | 集成 | 常驻 | P0 |
| E07 | §10.8-3 / PRD §4.4 B 表 | jsonDir 不存在 / 指向文件 → InvalidWriteTarget | 负 | 单元 | 常驻 | P1 |
| E08 | §10.8-6 / §10.1 R5 / PRD §4.2 ③ | CLI 单件校验合法产物 → exit 0 | 正 | e2e | 常驻 | P0 |
| E09 | §10.8-6 / PRD §4.2 | CLI 对结构坏件 → exit 1 且 stdout 含错误码清单 | 负 | e2e | 常驻 | P0 |
| E10 | §10.8-6 / PRD §4.2 | CLI 对不存在路径 → exit 1 + JsonNotFound | 负 | e2e | 常驻 | P1 |
| E11 | §10.8-6 / PRD §4.2 ③「缺省不得跳过」 | json 在而同名 md 缺 → CLI 报 MdMissing + exit 1 | 负 | e2e | 常驻 | P1 |
| E12 | §10.8-6 / PRD §2 / §4.5 | rewrite 只重渲染 md：json 字节不动、md === renderObservation | 正 | e2e | 常驻 | P0 |
| E13 | §10.8-6 / PRD §4.5 | rewrite 目标在非过程目录 → ArtifactPathOutside 拒写 | 负 | e2e | 常驻 | P1 |
| E14 | §10.8-6 / PRD §4.5 | 归档件复制到 `.session/reviews/<同次>/` 再 rewrite：归档目录俩文件 hash 不变 | 负 | e2e | 常驻 | P1 |
| F01 | §10.8-5 / §10.1 R6 / PRD §7 C-02 | 旧假夹具形态（`read: 4`）在 5 个测试文件 0 命中；新语义夹具过对账 | 正 | 静态+单元 | 常驻 | P0 |
| F02 | §10.8-5 / §10.1 R6 / PRD §7 D-09 | 测试内文本断言与 replace 目标随 D08 文案同批改（旧文案 0 残留） | 正 | 静态 | 常驻 | P1 |
| F03 | §10.8-5 / §10.1 R6「禁放宽断言」 | 覆盖对账五负例（B08-B12）在夹具重写后仍红（不是删对账换绿） | 负 | 单元 | 常驻 | P0 |
| F04 | §10.8-5 / §10.1 R6 / PRD §8 | 探索稿 :686 schema 片段改为指向 PRD §4.1 的指针 | 正 | 静态 | 常驻 | P1 |
| G01 | §10.8-7 / §10.1 R7 / PRD §5.1 | 归档演练：writeObservation → move → git add → `npm run check` 绿 → commit | 正 | e2e | 验收（收尾） | P0 |
| G02 | §10.8-7 / PRD §8 S2 行 | `npm run check` 测试数增量 = 迁入 71 + 新增（全仓 glob 覆盖证明） | 正 | e2e | 验收（收尾） | P1 |
| G03 | §10.8-3 / PRD §5.2 / §4.4 B 表 | 归档子目录无产物且不在白名单 → ArtifactMissing | 负 | 单元 | 常驻 | P1 |
| G04 | §10.8-3 / PRD §5.2 / §4.4 B 表 | 归档子目录含非产物文件且不在白名单 → UnclassifiedArtifact | 负 | 单元 | 常驻 | P1 |
| G05 | §10.8-3 / PRD §5.2 三态绿分支 | 存量白名单目录 + 允许文件名类 8 类 → 判绿（三态判定正例） | 正 | 单元 | 常驻 | P1 |
| G06 | §10.8-3 / PRD §5.2 :410（C-15） | `attachments/` 子层：一层快照零码、两层嵌套与根层同名 → UnclassifiedArtifact | 边界 | 单元 | 常驻 | P1 |
| H01 | §10.8-3 / PRD §0.5 Q-A-05 / §4.4 B 表注 | 原文本版 8 条具名攻击的结构化映射矩阵（0 绕过） | 负 | 单元 | 常驻 | P0 |
| H02 | §10.8-3 / PRD §0.5 Q-A-05 | 对抗分母唯一口径：常量登记 + 0 绕过计数（Q-A-05 闭合载体） | 边界 | 单元 | 常驻 | P0 |
| H03 | PRD §5.3 行 11（V-6 绿例） | json+md 同改且一致 → 校验过（钉「本机无锚」边界） | 边界 | 单元 | 常驻 | P1 |
| H04 | PRD §5.3 行 12（V-6 绿例） | quote 真实但不支撑结论 → 校验过（语义归审计人） | 边界 | 单元 | 常驻 | P1 |
| I01 | PRD §4.4 A 表注 2 | render.mjs 合并纪律三码冒烟（DuplicateStatement / OverrideWithoutReason / PointlessOverride） | 负 | 单元 | 常驻 | P2 |
| I02 | PRD §4.4 A 表注 2 | render.mjs 必填与登记五码冒烟（MissingTrigger / MissingCriterion / MissingLanding / MissingCriterionImpl / UnknownLanding） | 负 | 单元 | 常驻 | P2 |
| X01 | §10.8-3 / PRD §4.1 | instance 只允许 `'A'`/`'B'`/`null`，其余 → `InvalidFieldType`（含三合法值正例） | 边界 | 单元 | 常驻（`checks.test.mjs`） | P1 |
| X02 | §10.8-3 / PRD §4.4 A 表 | `requires` 非对象项（null / 字符串 / 数组）→ `InvalidFieldType`，不抛 `TypeError` | 负 | 单元 | 常驻 | P1 |
| X03 | §10.8-4 / PRD §4.2 ③ | 结论行由 `open` 派生：open 空 + closure=null 不得写「有补充项」 | 负 | 单元 | 常驻 | P0 |
| X04 | §10.8-3 / PRD §4.3 第 5 道 | 骨架常量单源：渲染输出必须用到 `md-format.mjs` 的六个常量（漂移即红） | 边界 | 单元 | 常驻 | P1 |
| X05 | §10.8-3 / PRD §4.3 第 5 道 / §4.4 B 表 | C07 第四形态：渲染器固定骨架行逐行不可作证据 | 负 | 单元 | 常驻 | P1 |
| X06 | §10.8-3 / PRD §4.3 第 2 道 | 软链 realpath 分支：指向根外 → `EvidencePathOutside`；指向根内 → 放行 | 边界 | 单元 | 常驻 | P1 |
| X07 | §10.8-3/4 / PRD §4.2 ③ | `findBrokenTable`：手造多一列 → 定位行号；围栏内表骨架不算、行首空格的表照判 | 负 | 单元 | 常驻 | P1 |
| X08 | §10.8-3 / PRD §4.2 ③ | 单元格转义与列数守恒：反斜杠+竖线 / 反引号 / 多行字段（`<br>`）三形态 | 边界 | 单元 | 常驻 | P1 |
| X09 | §10.8-4 / PRD §4.2 ③ | README 表格转义（含 `\|` 与换行）逐块列数一致；卡面散文压掉换行 | 边界 | 单元 | 常驻 | P1 |
| X10 | §10.8-3 / PRD §4.2 ④ / §4.4 B 表 | 写盘回滚三分支：md 侧失败 / json 侧失败（有旧 md 恢复）/ json 侧失败（无旧 md 不留 md） | 负 | 集成 | 常驻 | P0 |
| X11 | §10.8-7 / PRD §4.2 | 现状登记：`check-all` 侧 skipped 守卫**未落地**（已撤回、归 S3），不得误以为存在 | 不覆盖（现状） | — | 无测试（代码现状核对） | P2 |

### 1.1 覆盖核对（锚点/决定 → 用例对位；零行无对位）

| 锚点 | 用例 |
|---|---|
| §10.8-1 原样迁入（sha256 清单） | A01、A02、A03 |
| §10.8-2 基线不退（71/71 + agents 零引用） | A04、A05、A06 |
| §10.8-3 B 表 S2 组 16 码 | CoverageMismatch→B08/B09/B10/B11/B12/B19/B20；DuplicateItem→B07；UnregisteredIdsMissing→B15；RoundMismatch→E02；InstanceMissing→B17/B18；MissingEvidence→B16；WriteFailed→E06；InvalidWriteTarget→E07；ArtifactPathOutside→E03/E04/E05/E13；ArtifactMissing→G03；UnclassifiedArtifact→G04/G06；EvidenceSensitivePath→C01/C02/C03；EvidenceQuoteSensitive→C04/C05；MdUnreadable→C06；EvidenceStructuralRow→C07；RepoRootUnresolved→C08 |
| §10.8-3 A 表 5 零测试码 | InvalidDocument→B01；MissingItems→B02；MissingOpenField→B03；MissingReason→B04/B05；UnknownClosure→B06 |
| §10.8-3 三类不出码 | skipped 非空正例→B14；read > total 反例→B13；ASCII \| 列数→D03 |
| §10.8-3 A 表并入 8 码（冒烟） | I01、I02 |
| §10.8-4 golden | D05、D06、D07 |
| §10.8-5 覆盖语义 7 处 fixture + 探索稿指针 | F01、F02、F03、F04、D08、B08-B12 |
| §10.8-6 CLI | E08、E09、E10、E11、E12、E13、E14 |
| §10.8-7 仓门禁不红 | A07、G01、G02 |
| PRD §5.3 V-6（S2 部分：行 1-6、8、9 + 绿例 11、12） | 行1→保留用例+D07；行2-3→保留（EvidenceNotFound/Mismatch/TooShort/PathOutside）；行4→C01/C02；行5→C04；行6→E03/E04；行8→G04；行9→G03；绿例11→H03；绿例12→H04 |
| PRD §9.3 M-2（S2 部分） | H01、H02、C01-C08、B07-B12 |
| PRD §0.5 Q-A-05 | H01、H02（口径见 §0.3-2） |

范围外（行 7 ArtifactDirty / 行 10 UntrackedArtifact / 零产物分支 / 15 卡豁免）：见 §6 不测第 2 条。

### 1.2 测试文件落点与夹具约定

- **落点**（plan 可微调文件名，不得改判据）：
  - `baseline.test.mjs`（新）：A05、F01、F02、F04（静态断言；A01–A03 按「全程零提交」裁定降为一次性验收，不设常驻、不设 `MIGRATION_COMMIT` 常量）
  - `checks.test.mjs`（增补）：B01-B06、B15、B16
  - `coverage.test.mjs`（新）：B07-B14、F03、B19、B20
  - `artifact.test.mjs`（增补）：B17、B18、C06
  - `evidence.test.mjs`（增补）：C01-C05、C07、C08
  - `render-check.test.mjs`（增补）：D01-D04、D08
  - `golden.test.mjs`（新）：D05-D07；golden 夹具 `observation-r3.json` + `observation-r3.expected.md` 与测试同目录或 `fixtures/` 子目录
  - `write.test.mjs`（增补）：E01-E07
  - `cli.test.mjs`（新）：E08-E14
  - `gate-scan.test.mjs`（新）：G03-G06（目录三态判定纯函数，§0.3-1 口径）
  - `adversarial.test.mjs`（增补）：H01-H04
  - `render.test.mjs`（新）：I01、I02
- **夹具约定**（0.2 #11 的连带改造）：root 不传参（唯一来源 git 顶层）后，全部证据夹具 = `mkdtempSync(join(repoRoot, '.session/reviews/test-obs-check-'))` 自建、用完 `rmSync`；产物目的地夹具 = 仓库内 `.session/reviews/<test-次>/`（自建自清）。**选 `.session/reviews/` 而非 `.session/tmp/` 的理由**：门禁 ⑤ 段要求 `.session/tmp/` 收尾为空，夹具建在那里会与门禁判据互踩（每轮测试都留残留 → `npm run check` ⑤ 段红）；`.session/reviews/<test-*>/` 不在 tmp 清空判据内，且与本组过程目录/destination 正则（E03/E04/E05）同族。**任何测试不得引用仓库既有文件作为证据**（A05 静态断言 + A06 行为复核双保险）。
- **保留纪律**：71 条原测试的意图一条不删（只改夹具与断言码名）；改动属「放宽断言」的形态（删对账负例 / doesNotMatch 化 / 跳过）一律禁止（F03 机器判）。
- **golden 夹具**：`observation-r3.json` 人工编写（round=3），证据 path 允许指向 `docs/superpowers/specs/` 下真实文件（golden 断言 D05 只跑渲染比对不读盘，不依赖文件存在；CLI 演练另用现造产物）。

## 2 用例明细

编号前缀 `S2-OC-`（下表省略前缀）。每条含五要素（覆盖 / 前置 / 步骤 / 预期 / 判据）+ 来源 / 红绿证据 / 对应测试 / 不覆盖。判据一律机器可判（命令 + 退出码 + 关键输出）；唯一允许占位 = 「待 plan Task N」。

### A 组：迁入与基线（锚点 1、2）

#### A01 迁入后 11 文件全为新增（零提交口径）

- **覆盖**：§10.8-1 / §10.1 R1 / PRD §8「首个提交 diff 只有新增文件」——按账本 Ruling #1（全程零提交）等价改写为「迁入时点 11 文件全为新增、零 M/D/R」
- **来源**：spec R1 原样迁入决定（迁入与改造分提交，原样性才可审计）；Ruling #1-2 把 A01 降为 Task 2 时点的**一次性验收证据**（A01′）
- **前置**：迁入已完成且**全程零提交**（`.superpowers/sdd/2026-10-27-s2-observation-check/progress.md` Ruling #1：HEAD 保持 `f2c7393`，不产生任何 commit）——无迁入提交 hash 可引；锚点 = 同账本 §迁入清单的 11 行 sha256（迁入瞬间实算值）。
- **步骤**：① Task 2 时点执行 `git status --porcelain tools/observation-check`；② 统计状态列与文件名集。
- **预期**：恰 11 行、逐行状态 `??`（未跟踪 = 全新增）、`M`/`D`/`R` 均 0；文件名集 = 草稿区 11 个 `.mjs` 的同名副本。
- **判据**：输出恰 11 行且逐行以 `?? ` 开头；`Select-String -Pattern '^.[MADR]'` 命中数 = 0。**复跑口径**：本条是**时点事实**——S2 后续任务已在该目录新增 12 个文件（`baseline` / `cli` / `coverage` / `golden` / `gate-scan` / `render` 等测试与 `golden/` 夹具），现在复跑输出 ≠ 11 行**不构成红**；验收取值 = Task 2 时点的输出（贴进账本 / report）。
- **红绿证据**：红 = 迁入时漏文件 / 多文件，或有人把其中任一文件纳管（状态列出现 M/A/D/R）；绿 = 11 行全 `??`。
- **对应测试**：验收命令（一次性；`baseline.test.mjs` 不设 A01 常驻——零提交裁定下它退化为「git status 快照」，无回归判别力）
- **不覆盖**：不判后续任务的合法新增（归 F 组与 §4 回归清单）；不判 commit message（零提交，无对象）。

#### A02 11 文件 sha256 清单重算对账（零提交口径）

- **覆盖**：§10.8-1 / §10.1 R1 / PRD §8「同一提交含 11 个文件的 sha256 清单」——零提交下等价为「清单可复算、与草稿区原件逐字相等」
- **来源**：spec R1；清单是「原样迁入」的唯一数字锚，hash 变 = 有人动过原件
- **前置**：**清单载体 = 账本 §迁入清单**（`.superpowers/sdd/2026-10-27-s2-observation-check/progress.md` 的 11 行 `<name>  <HEX>`，Ruling #1-1 定死；零提交下无 commit 可挂，故不再依赖 commit message）+ 草稿区原件仍在（`C:\Users\HuangChunhua\.retro-skills\observation-check-draft\*.mjs`，11 个）。
- **步骤**：① 用 `node:crypto` 对草稿区 11 个原件逐个算 sha256（`createHash('sha256').update(readFileSync(f)).digest('hex').toUpperCase()`）；② 与账本 §迁入清单逐条比对。
- **预期**：11/11 全等（本文件编写时实跑：11 条 hash 与清单逐字符相等，草稿区仍为 11 个文件）。
- **判据**：对账脚本输出 11 条全等，任一不等输出差异文件名并 exit 1。**不得用当前工作区 `tools/observation-check/` 的文件算 hash 作判据**：改造批次（Task 3-12）已就地改写其中 10 个文件，按工作区比会永久红——「工作区现值 == 清单」不是原样性判据（与 A03「不得按当前文件算行数」同一条纪律）。
- **红绿证据**：红 = 清单与草稿原件对不上（清单被手改 / 抄错 / 原件被替换）；绿 = 11 条 hash 全等。
- **对应测试**：验收命令（一次性；常驻需依赖仓外草稿区目录，违反 §1.2「夹具一律仓内自建」）
- **不覆盖**：不判清单载体是否美观（plan 自决）；不判后续合法改造后的文件状态（那是 G01 / 回归清单的事）。

#### A03 草稿区 11 原件合计行数 = 888（原样性对账）

- **覆盖**：§10.8-1 / PRD §0.3-§0.4（11 文件 / 888 行基线）
- **来源**：spec R1 的「原样」判据需要独立于 hash 清单的第二道账（行数对账 PRD §0.4 已实测登记）；Ruling #1-2 的 A03′
- **前置**：同 A02（清单与原件在位）；草稿区目录仍在。
- **步骤**：用 PRD §0.4 原命令 `(Get-Content <草稿区>\*.mjs | Measure-Object -Line).Lines` 复算。
- **预期**：888（PRD §0.4 原命令口径）。
- **判据**：输出 === 888。**口径说明**：该命令语义 = **不计空行**；草稿区物理行合计为 1015（`(Get-Content <草稿区>\*.mjs).Count`，每行都计），两者不可混用——把 1015 当判据 = 换口径造红。**不得按当前 `tools/observation-check/` 的文件算行数**：改造批次已改写内容，当前值必然 ≠ 888。
- **红绿证据**：红 = 草稿原件丢文件 / 多文件 / 内容被改（同口径行数变）；绿 = 888。
- **对应测试**：验收命令（一次性；依赖仓外草稿区目录，理由同 A02）
- **不覆盖**：不判行级内容一致（A02 的 hash 已覆盖）；888 是原命令口径下的总量账，不锁单文件行数；物理行总数 1015 不作任何判据。

#### A04 迁入后测试全绿且总数 ≥ 71（验收命令）

- **覆盖**：§10.8-2 / §10.1 R2 / PRD §8「cd tools/observation-check; node --test *.test.mjs 全绿」
- **来源**：spec R2 基线不退；71 是迁入基线，改造只增不减
- **前置**：迁入 + 夹具改造 + 新增判据实现全部完成（S2 代码面收尾）。
- **步骤**：① `Set-Location tools\observation-check; node --test`；② 解析汇总行。
- **预期**：`# tests` ≥ 71 + 本 testcase 新增用例数；`# fail` = 0；**任意 cwd 下均绿**（原 10 条仓库依赖假红用例已改自建夹具——见 §0.1 清单）。
- **判据**：`# fail 0` 且 `# tests ≥ 71`；在仓库根与 tools/observation-check 两个 cwd 各跑一次均 exit 0。
- **红绿证据**：红 = 任一假红残留（夹具未改净，任一 cwd fail > 0）；绿 = 双 cwd 全绿。
- **对应测试**：验收命令（S2 收尾跑；常驻重复无判别力，故不设常驻）
- **不覆盖**：不判「71 条原测试名逐一在位」（PRD 出口判据无此项；删除旧测试的行为由 F03 + git diff 审查兜底，判别力水位见 §7）。

#### A05 测试对 `agents/` 引用 = 0

- **覆盖**：§10.8-2 / §10.1 R2 / PRD §8 取数命令
- **来源**：spec R2（迁入后证据夹具一律自建，不引用仓内角色卡——角色卡被手改/删除会让基线漂移）
- **前置**：迁入 + 夹具改造完成。
- **步骤**：`Select-String -Path tools\observation-check\*.test.mjs -Pattern 'agents[/\\]'`。
- **预期**：命中数 = 0（PRD 出口判据原文口径）。
- **判据**：命中数 = 0；> 0 即红并列出文件:行。
- **红绿证据**：红 = 残留一处 `agents/` 字面（夹具改造漏网，基线重新拴在仓内文件上）；绿 = 0。
- **对应测试**：`baseline.test.mjs`（常驻——防未来新增测试再引入仓内依赖）
- **不覆盖**：不判实现文件（非测试）是否引用（实现不引用产物文件，属 review 面）；不判其它仓内路径依赖（夹具约定 §1.2 由 A06 行为级兜住）。

#### A06 移走 `agents/detective-observer.md` 后测试仍全绿（验收命令）

- **覆盖**：§10.8-2 / PRD §8「删掉 agents/detective-observer.md 后仍全绿」
- **来源**：PRD 出口判据的行为级复核（A05 是字面级，本条证明字面为零后行为真的零依赖）
- **前置**：A05 已绿；git 工作区干净（保证可 `git checkout` 恢复）。
- **步骤**：① `Move-Item agents\detective-observer.md agents\detective-observer.md.bak`；② `Set-Location tools\observation-check; node --test`；③ 无论结果如何 `Move-Item` 恢复（finally）；④ `git status --porcelain` 确认零残留。
- **预期**：步骤② exit 0 全绿；步骤④ 输出为空。
- **判据**：② exit 0 + ④ 输出空串；②失败则本条红且必须完成恢复后才许报红。
- **红绿证据**：红 = 任一测试依赖仓内文件（假绿基线被当场抓出）；绿 = 全绿 + 零残留。
- **对应测试**：验收命令（一次性；全局态变更与 node --test 并发跑其它套件会互相踩，故不设常驻——spec §10.4「全部可机器判」不等于全部常驻）
- **不覆盖**：不删其它 agents 卡（PRD 点名只此一张，其它卡被其它测试引用属 docgen 侧）。

#### A07 迁入后未归档态 `npm run check` 全绿（验收命令）

- **覆盖**：§10.8-7 / §10.1 R7 / PRD §8「归档一件合法产物后 npm run check 仍绿」的前半（未归档态）
- **来源**：spec R7 仓门禁不红；新文件（expected.md / observation-r3.json / cli.mjs）可能触发 markdown 检查等非测试段
- **前置**：迁入与实现收尾完成、未做归档演练（G01 是其后半）。
- **步骤**：`npm run check`（仓库根）。
- **预期**：exit 0（PRD 0.4 基线 734 pass + 2 skip 之上叠加 observation-check 全部测试与新段全绿）。
- **判据**：exit 0；若红，定位输出中含 `tools\observation-check` 的段落。
- **红绿证据**：红 = expected.md 触发 markdown 机械检查 / 新增测试假红 / 命名检查咬到新文件；绿 = 全绿。
- **对应测试**：验收命令（23.9s 时长不进常驻）
- **不覆盖**：不判归档后的门禁（G01）；不判 check 各段内部质量（既有门禁自身有回归面）。

### B 组：结构段（锚点 3——A 表 5 零测试码 + B 表覆盖对账类码）

共用夹具约定：`registeredIds` 取自 S2 落地的单源清单（含 k01 script / k02 manual / k03 ai 三类各一，形态按 plan Task N 落地）；结构测试不接读盘校验（`resolveEvidence` 不传，隔离证据段）。

#### B01 InvalidDocument：doc 非对象

- **覆盖**：§10.8-3 / PRD §4.4 A 表零测试码（`checks.mjs`（草稿区 行 30-32） 已实现零测试）
- **来源**：spec R3「A 表 5 个零测试码补齐」
- **前置**：`validateObservation` 已实现该分支。
- **步骤**：① 传 `validateObservation(null)`；② 传 `[]`（数组）；③ 传 `'x'`（字符串）。三形态各跑一次。
- **预期**：三态均 `errors` 含 `InvalidDocument`（第一顺位，先于任何字段判据）。
- **判据**：`codes.includes('InvalidDocument')` 为 true ×3；且不冒异常（返回结构化 errors）。
- **红绿证据**：红 = 实现只在部分形态报码 / 抛异常冒泡；绿 = 三态齐码。
- **对应测试**：`checks.test.mjs`（增补）
- **不覆盖**：不判 doc 含多余顶层键（PRD 未给 UnknownTopField 类判据，缺新键该不该拒属 plan/议会）。

#### B02 MissingItems：items 缺失 / 空数组 / 非数组

- **覆盖**：§10.8-3 / PRD §4.4 A 表零测试码（`checks.mjs`（草稿区 行 41-42） 已实现零测试）
- **来源**：spec R3；空 items 是「假装全跳过」的最廉价攻击面
- **前置**：同 B01。
- **步骤**：① items 键缺失；② `items: []`；③ `items: 'k01 hit'`（字符串）。三形态。
- **预期**：三态均 `MissingItems`（items 必须非空数组——空轮次的正确形态是 coverage.skipped 全集而非零 items）。
- **判据**：`codes.includes('MissingItems')` ×3。
- **红绿证据**：红 = `[]` 被放过（零判等于零证据，产物不可信）；绿 = 三态齐码。
- **对应测试**：`checks.test.mjs`（增补）
- **不覆盖**：不判 items 条数上限（无此判据）。

#### B03 MissingOpenField：open 项缺三要素

- **覆盖**：§10.8-3 / PRD §4.4 A 表零测试码（`checks.mjs`（草稿区 行 63-65） 已实现零测试）
- **来源**：spec R3；open 项是「补充分歧」的载体，缺要素 = 无法对账
- **前置**：同 B01。
- **步骤**：① open 项缺 `object`；② 缺 `impact`；③ 缺 `suggestion`；④ 三键全缺。四形态。
- **预期**：四形态均 `MissingOpenField`（报错定位到缺的键名）。
- **判据**：`codes.includes('MissingOpenField')` ×4；error 的 path 字段含缺失键名（可定位）。
- **红绿证据**：红 = 只判存在性不判键名（定位降级，排障难）；绿 = 四形态齐码带键名。
- **对应测试**：`checks.test.mjs`（增补）
- **不覆盖**：不判三要素内容质量（语义归审计人，H04 同理）。

#### B04 MissingReason：na 无 reason

- **覆盖**：§10.8-3 / PRD §4.4 A 表零测试码（`checks.mjs`（草稿区 行 50-52） 已实现零测试）
- **来源**：spec R3；na = 不适用，不写理由就是拍脑袋
- **前置**：同 B01。
- **步骤**：① na 项缺 reason；② reason 为空白字符串 `'  '`；③ reason 为 `null`。三形态。
- **预期**：三态均 `MissingReason`。
- **判据**：`codes.includes('MissingReason')` ×3。
- **红绿证据**：红 = 空白串绕过（只判 truthy 的实现会放过 `'  '`）；绿 = 三态齐码。
- **对应测试**：`checks.test.mjs`（增补）
- **不覆盖**：miss 分支归 B05（分开设防——一个用例同时断两分支会互相掩盖）。

#### B05 MissingReason：miss 无 reason（实现缺口，当前必红）

- **覆盖**：§10.8-3 / PRD §4.1「miss / na 必带 reason」
- **来源**：**编写者独立发现**——PRD §4.1 写 miss/na 都必带，草稿 `checks.mjs`（草稿区 行 50-52） 只判 `na` 分支，miss 无 reason 当前**假绿**（盲点 G-1）
- **前置**：S2 已按 PRD §4.1 补 miss 分支（本条是缺口修复的验收钉）。
- **步骤**：① miss 项缺 reason；② reason 空白。两形态。
- **预期**：均 `MissingReason`。
- **判据**：`codes.includes('MissingReason')` ×2。
- **红绿证据**：红 = 补实现前（现况：零码，本条失败——这正是要它红的原因）；绿 = 补后齐码。
- **对应测试**：`checks.test.mjs`（增补）
- **不覆盖**：hit 的 reason 属可选（PRD 未要求），不设负例。

#### B06 UnknownClosure：closure 非法值

- **覆盖**：§10.8-3 / PRD §4.4 A 表零测试码（`checks.mjs`（草稿区 行 84-85） 已实现零测试）
- **来源**：spec R3；closure 是「无分歧 / 有分歧已闭合」的结论门，写错值 = 结论门失真
- **前置**：同 B01。
- **步骤**：① `closure: 'done'`；② `closure: '无'`。两形态（正例值 no-findings / blocked / null 由既有测试与 B14 覆盖）。
- **预期**：均 `UnknownClosure`。
- **判据**：`codes.includes('UnknownClosure')` ×2。
- **红绿证据**：红 = 中文近似值被放过（拼写自由）；绿 = 两态齐码。
- **对应测试**：`checks.test.mjs`（增补）
- **不覆盖**：blocked 与 open 的组合语义（open 非空必须 closure=blocked，属 ContradictoryClosure 既有用例保留）。

#### B07 DuplicateItem：items.id 重复

- **覆盖**：§10.8-3 / PRD §4.2 ①（七条对账之一）/ §4.4 B 表 S2 组
- **来源**：spec R3；重复 id = 「一条证据充两条数」，直接击穿覆盖度对账
- **前置**：S2 已实现 items.id 唯一性判据（草稿零实现，0.2 #3）。
- **步骤**：构造 items 含两条 `k01`（coverage.read 按真实条数填 2，其余对账字段全部合法）。
- **预期**：`DuplicateItem`（即使 read 等数字全部对齐，唯一性判据仍独立命中——判据正交）。
- **判据**：`codes.includes('DuplicateItem')`；error 定位第二条重复项的下标。
- **红绿证据**：红 = 唯靠 Set 去重后查 read（两条 k01 若 read=2 可能骗过 items.length 对账——所以唯一性必须独立成码）；绿 = 独立命中。
- **对应测试**：`coverage.test.mjs`（新）
- **不覆盖**：items 内部字段级重复（如同一 item 两条 evidence）——PRD 未要求 id 内 evidence 唯一，不设。

#### B08 CoverageMismatch：items.length ≠ coverage.read

- **覆盖**：§10.8-3 / PRD §4.2 ①
- **来源**：spec R3 + PRD §7 C-02（read 语义 = items 条数含 na）——对账判据的心脏
- **前置**：S2 覆盖对账已实现（0.2 #3）。
- **步骤**：① items 1 条、read=2；② items 2 条、read=1（双向）。注意其它对账字段构造为合法（total、skipped 按 1 条/2 条各自配平），确保红因唯一指向 read 对账。
- **预期**：均 `CoverageMismatch`。
- **判据**：`codes.includes('CoverageMismatch')` ×2；error 文案含 `read` 字样（可定位到是哪条对账失败）。
- **红绿证据**：红 = 草稿现状（无此对账，假绿）；绿 = 双向齐码。
- **对应测试**：`coverage.test.mjs`
- **不覆盖**：read 为负数 / 非整数（归 InvalidFieldType 既有判据，保留测试已盖）。

#### B09 CoverageMismatch：total ≠ registeredIds.length

- **覆盖**：§10.8-3 / PRD §4.2 ①
- **来源**：spec R3 + PRD §7 C-02（total 唯一来源 = 登记清单长度——手写数字即漂移）
- **前置**：同 B08。
- **步骤**：registeredIds 3 项（k01/k02/k03），构造 total=2（items 与 skipped 合计也配成 2，把红因唯一留给 total 对账）。
- **预期**：`CoverageMismatch`。
- **判据**：`codes.includes('CoverageMismatch')`；error 文案含 `total` 字样。
- **红绿证据**：红 = total 手写不与清单对账（夹具老写法 4/4 就是这种假绿）；绿 = 齐码。
- **对应测试**：`coverage.test.mjs`
- **不覆盖**：registeredIds 清单自身的登记质量（单源文件谁维护属流程，非校验器）。

#### B10 CoverageMismatch：read + skipped.length ≠ total

- **覆盖**：§10.8-3 / PRD §4.2 ①
- **来源**：spec R3；加法对账防「判的 + 跳的 ≠ 登记的」半覆盖态
- **前置**：同 B08。
- **步骤**：registeredIds 3 项；items 1 条、skipped 1 条、read=1、total=3（1+1≠3）。反向：items 3 条全判、skipped 0、read=3、total=4 → 3+0≠4。两形态。
- **预期**：均 `CoverageMismatch`。
- **判据**：`codes.includes('CoverageMismatch')` ×2；error 文案含 `read + skipped` 字样。
- **红绿证据**：红 = 草稿现状（skipped 只判数组类型，不做加法）；绿 = 两向齐码。
- **对应测试**：`coverage.test.mjs`
- **不覆盖**：skipped 含重复 id —— **已由 B20 单独覆盖**（码名同为 `CoverageMismatch`、message 含「重复」，依据 PRD §0.6 C-16）。本条只管「数组长度加法」，B20 管「集合语义去重」：两条判据同码不同分支，判据侧必须靠 message 区分（B20 有说明）。

#### B11 CoverageMismatch：skipped 含未登记 id

- **覆盖**：§10.8-3 / PRD §4.2 ①（skipped ⊆ registeredIds）
- **来源**：spec R3；「跳过清单夹私」是比 items 夹私更隐蔽的口子（items 有 UnknownItem 把守，skipped 无人把守）
- **前置**：同 B08。
- **步骤**：skipped 含 `k99`（不在 registeredIds），其余对账配平（read=2、skipped=1、total 按对账凑不成时本条红因可能混入 B09——构造 total=3 且 registeredIds 补 1 项使 total 对账合法，红因唯一指向 skipped 登记）。
- **预期**：`CoverageMismatch`。
- **判据**：`codes.includes('CoverageMismatch')`；error 文案含 `skipped` 与 `k99`。
- **红绿证据**：红 = skipped 无登记校验（编一个 k99 塞进跳过清单即可缩水）；绿 = 齐码。
- **对应测试**：`coverage.test.mjs`
- **不覆盖**：skipped 元素类型（非字符串归 InvalidFieldType 既有判据）。

#### B12 CoverageMismatch：skipped 与 items 相交

- **覆盖**：§10.8-3 / PRD §4.2 ①（items.id ∩ skipped = ∅）
- **来源**：spec R3；「同一 id 又判又跳」让覆盖度读数失真（read 与 skipped 重复计数）
- **前置**：同 B08。
- **步骤**：items 判 k01，skipped 也列 k01（read=1、skipped=1、total=2 配平——加法对账通过，红因唯一留给相交判据）。
- **预期**：`CoverageMismatch`。
- **判据**：`codes.includes('CoverageMismatch')`；error 文案含交集 id。
- **红绿证据**：红 = 只做加法不做交集（1+1=2 通过，但 k01 被双记）；绿 = 齐码。
- **对应测试**：`coverage.test.mjs`
- **不覆盖**：items.id ⊆ registeredIds（UnknownItem 既有码既有用例，保留）。

#### B13 InvalidCoverage：read > total（三类不出码之二）

- **覆盖**：§10.8-3 三类不出码 / PRD §4.2 ①
- **来源**：spec R3 点名三类；草稿 `checks.mjs`（草稿区 行 77-79） 已实现该分支但 71 条中无直接反例（read>total 只被 A1/A2 顺带擦到）
- **前置**：分支已实现。
- **步骤**：read=3、total=2（items 3 条，其余字段类型合法）。
- **预期**：`InvalidCoverage`（现有码——大于关系是值域错误，先于 mismatch 对账报）。
- **判据**：`codes.includes('InvalidCoverage')`。
- **红绿证据**：红 = 值域判据被对账重写时误删（回归钉）；绿 = 齐码。
- **对应测试**：`coverage.test.mjs`
- **不覆盖**：read = total 恰等合法态（归 B14 正例覆盖）。

#### B14 skipped 非空正例：部分未判且对账全过（三类不出码之一）

- **覆盖**：§10.8-3 三类不出码 / PRD §4.2 ① / §4.1 schema 注
- **来源**：spec R3 点名；**对账实现一刀切最常见的翻车 = 把合法「跳过」判红**（假阳性），必须正例钉住
- **前置**：S2 对账实现完成。
- **步骤**：① registeredIds 3 项，items 判 k01（hit 带合法证据）、k03 判 na（带 reason），skipped = ['k02']，read=2、total=3；② `validateObservation` 全跑；③ 断言零错误码。
- **预期**：`codes` 为空数组；closure 按规则可 null（open 为空且未要求闭合）。②④步注意 k03 若为 ai 条目需成对（本条 k03 按注册清单登记为 manual，避开 InstanceMissing——夹具登记形态按 plan Task N）。
- **判据**：`errors.length === 0`；且 renderObservation 的跳过清单含 k02（D08 联动）。
- **红绿证据**：红 = 对账过严（skipped 非空即红 / read<total 即红）；绿 = 零码 + 渲染含跳过清单。
- **对应测试**：`coverage.test.mjs`
- **不覆盖**：skipped 全集（total 项全跳）——PRD 未禁但语义可疑，留给审计；不设正例。

#### B15 UnregisteredIdsMissing：不传 registeredIds

- **覆盖**：§10.8-3 / PRD §4.1（必填入参）/ §4.4 B 表 S2 组
- **来源**：spec R3；**缺清单 = 校验器变成摆设**（草稿 `checks.mjs`（草稿区 行 28） 默认 `[]`，缺参静默通过 UnknownItem 拦截的初判——盲点）
- **前置**：S2 已实现缺参判据。
- **步骤**：`validateObservation(doc)` 不传第二参（registeredIds 缺失，非空数组对照）。
- **预期**：`UnregisteredIdsMissing`（先于一切 items 校验——没有清单任何判都无根）。
- **判据**：`codes.includes('UnregisteredIdsMissing')`；实现若同时报 `UnknownItem` 不判红（PRD 未规定缺参短路，本用例不加码）。
- **红绿证据**：红 = 默认 `[]` 静默（现况）；绿 = 缺参独立成码。
- **对应测试**：`checks.test.mjs`（增补）
- **不覆盖**：registeredIds 传空数组 `[]`（total=0 必然触发 InvalidCoverage 值域错——现有码已拦，不另设码；如 plan 判定 `[]` 也归 UnregisteredIdsMissing，须同批回扫本条与本文件 §1.1）。

#### B16 MissingEvidence：hit 无 evidence（与 InvalidFieldType 分界）

- **覆盖**：§10.8-3 / PRD §4.4 B 表 S2 组（「MissingEvidence = hit 无 evidence」）
- **来源**：spec R3；草稿现报 InvalidFieldType（`checks.mjs`（草稿区 行 14-15）），B 表要求专门码——「缺」与「类型错」混码 = 排障盲
- **前置**：S2 已细分；adversarial A7 的断言已同批从 InvalidFieldType 改为 MissingEvidence。
- **步骤**：① hit 项缺 evidence 键；② hit 项 `evidence: 'path:12'`（字符串旧写法）。
- **预期**：① `MissingEvidence`；② `InvalidFieldType`（分界成立：缺键 ≠ 类型错）。
- **判据**：① `codes.includes('MissingEvidence')` 且不含 InvalidFieldType；② `codes.includes('InvalidFieldType')` 且不含 MissingEvidence。
- **红绿证据**：红 = 二码混报（细分未落地或 A7 未同批改）；绿 = 各归其码。
- **对应测试**：`checks.test.mjs`（增补）；A7 断言改造在 `adversarial.test.mjs`。
- **不覆盖**：evidence 字段内部结构（path/line/quote 缺失归 InvalidFieldType 既有用例保留）。

#### B17 InstanceMissing：ai 条目无 -a/-b 成对文件

- **覆盖**：§10.8-3 / PRD §4.1（instance 双实例）/ §4.4 B 表 S2 组
- **来源**：spec R3；ai 双实例判定若缺一半 = 「一半样本缺席」，判定结论无效
- **前置**：S2 已实现成对判据（触发入口 = `writeObservation` / `validateArtifact` 对目录状态可判；实现点按 plan Task N，用例只锁行为）。
- **步骤**：jsonDir（mkdtemp）内放单份 `observation-r3.json`（items 含 k03 check:'ai'、instance=null），无 `-a`/`-b` 文件；跑入口校验。
- **预期**：`InstanceMissing`。
- **判据**：`codes.includes('InstanceMissing')`。
- **红绿证据**：红 = 单份 ai 判定被静默接受（半样本出结论）；绿 = 齐码。
- **对应测试**：`artifact.test.mjs`（增补）
- **不覆盖**：-a 在而 -b 缺的半对态（同码命中，不另设码）；非 ai 条目单份合法（B18 正例）。

#### B18 instance 成对正例：-a / -b 双双通过

- **覆盖**：§10.8-3 / PRD §4.1
- **来源**：B17 的对照正例（只测反不测正 → 对账过严不可见，假阳性面失守）
- **前置**：同 B17；文件名派生（E01）已实现。
- **步骤**：jsonDir 内两份：`observation-r3-a.json`（instance:'A'，items 判 k03 hit 带合法证据）与 `observation-r3-b.json`（instance:'B' 同构）；逐份跑入口校验。
- **预期**：两份均零 InstanceMissing；`instance` 字段与文件名后缀一致（A↔-a、B↔-b）。
- **判据**：两份 `!codes.includes('InstanceMissing')`；文件名 = `observation-r3-` + instance 小写（PRD §4.5 文件名派生形态）。
- **红绿证据**：红 = 成对判据误伤合法双份（正例翻车）；绿 = 双绿。
- **对应测试**：`artifact.test.mjs`（增补）
- **不覆盖**：-a/-b 两份 items 不一致（同一 id 两实例判得不同——PRD 未禁止，语义属议会记录层，不设）。

#### B19 registeredIds 单源清单：删一个 id 即对账红

- **覆盖**：§10.8-3 / PRD §4.1（registeredIds 单一来源）/ §4.2 ①（七条对账之 total === registeredIds.length）
- **来源**：议会 problems.md §2 派工项——分母若允许各调用点自拼，对账「总分母」这条判据等于没有；必须钉住「唯一来源 = `registered-ids.mjs` 的 `REGISTERED_IDS`」
- **前置**：`tools/observation-check/registered-ids.mjs` 已导出 `REGISTERED_IDS`（Task 3 落地）；`validateObservation` 七条对账已实现（Task 4 落地）
- **步骤**：① 读 `REGISTERED_IDS` 断言为非空字符串数组；② 构造 doc：`coverage.total = REGISTERED_IDS.length`、`coverage.skipped` 含 k02、items 为 k01/k03；③ 以 `REGISTERED_IDS.filter((id) => id !== 'k02')` 作 `registeredIds` 调 `validateObservation`
- **预期**：① 断言通过；②/③ `errors` 含 `CoverageMismatch`（`total` 3 ≠ 分母 2；且 skipped 的 k02 不在分母内）
- **判据**：`errors.some((e) => e.code === 'CoverageMismatch')` 为真（逐字码名）
- **红绿证据**：红 = 分母各调用点自拼、与 `coverage.total` 脱钩（删一个 id 校验仍绿）；绿 = 删一个 id 立刻对账红
- **对应测试**：`coverage.test.mjs`（B19 落地时新建；该文件现同时承载 B07-B14 / F03 / B20，落点见 §1.2）
- **不覆盖**：`REGISTERED_IDS` 内容本身是否等价于 PRD 登记清单（那是数据正确性，属 S2 登记面，不在此用例）

#### B20 CoverageMismatch：skipped 内 id 重复（集合语义）

- **覆盖**：§10.8-3 / PRD §4.2 ① 第 5 条「`skipped ⊆ registeredIds`（**集合语义**：其中 id 不得重复）」/ PRD §0.6 C-16（代裁行，2026-10-27 施工期补）/ §4.4 B 表 `CoverageMismatch`
- **来源**：Ruling #15（施工期发现）——`skipped` 是「未判项 id 清单」，只有按**集合**读，C-02 的 `read + skipped.length === total` 才是真对账；允许重复项时**数组长度虚增**，加法道「看起来平」，而去重后集合少一个 id → 有 id **既未判也未跳**、静默通过。C-16 把这条判据明确进 §4.2 ① 第 5 条；实现对账函数补独立分支（`tools/observation-check/checks.mjs:47-50`：`const dup = skipped.filter((id, i) => skipped.indexOf(id) !== i)` → message `skipped 内 id 重复：…`）
- **前置**：`checkCoverageReconciliation` 含重复分支（已落地）；夹具走 `tools/observation-check/fixtures.mjs` 的 `docBase`（`read = items.length`、`total = REGISTERED_IDS.length`（= 3）、`skipped = 差集`），证据 = `mkdtempSync` 自建件（§1.2 夹具约定）
- **步骤**：① 取 `items = [k01 hit（带自建证据）, k02 na（带 reason）]` 的合法基具（read=2、total=3、skipped 天然 = `['k03']`）；② 覆写 `doc.coverage.skipped = ['k03','k03']`（原 2 个、去重 1 个）；③ `validateObservation(doc, { registeredIds: IDS })`
- **预期**：`errors` 中**至少一条** `CoverageMismatch` 的 message 含「重复」并点名重复 id（`k03`）。本条**不判「只有这一条错」**：本夹具下 `read + skipped.length` = 2+2 = 4 ≠ 3 的加法分支**同时**命中——同码、不同分支、不同判据
- **判据**：`errors.some((e) => e.code === 'CoverageMismatch' && /重复/.test(e.message))` 为真。**必须按 message 定锚，不得只判码名**——只判 `codes.includes('CoverageMismatch')` 会被加法道的红顶替（把重复分支删掉仍绿 = 假绿），这正是本条与 B10 的分界
- **红绿证据**：红 = 无重复分支（构造「假平」件 `read=1`、`skipped=['k03','k03']`、`total=3`：加法道 1+2=3 通过，去重后 read 1 + 去重 1 = 2 ≠ 3，k02 既未判也未跳 → 静默通过）；绿 = 重复 id 立刻报码并点名重复项
- **对应测试**：`coverage.test.mjs`「B20 CoverageMismatch：skipped 内 id 重复 → CoverageMismatch（message 含「重复」）」（夹具 `items = two()`、`doc.coverage.skipped = ['k03','k03']`、断言 `/重复/`）
- **不覆盖**：skipped 含未登记 id（B11）；skipped 与 items 相交（B12）；`skipped` 元素非字符串（`InvalidFieldType` 既有判据）；`items.id` 自身重复（`DuplicateItem`，B07）；「假平」形态（`read=1` + 重复 2 个）本身不作独立断言——它是红绿证据里的失败面推演，判据落在现存常驻测试的单一形态上

### C 组：证据段（锚点 3——B 表证据侧 3 码 + §4.3 第 5-7 道）

共用夹具：`mkdtempSync(join(repoRoot, '.session/reviews/test-obs-check-'))` 自建证据文件（内容按需写；用完 `rmSync`）；root 不传参（git 顶层派生，PRD §4.3 第 2 道）。

#### C01 EvidenceSensitivePath：敏感路径名单逐类命中

- **覆盖**：§10.8-3 / PRD §4.3 第 6 道 / §4.4 B 表 S2 组
- **来源**：spec R3 + 已知风险点②的对偶面——**引用密钥文件当「证据」** 是取证链最直接的泄密口
- **前置**：S2 已实现敏感路径判据（草稿零实现，0.2 #6）。**证据侧必要条件（与 C04 同口径）**：quote ≥ 10 字、长度道必过——长度道不过时先报 `EvidenceQuoteTooShort`，敏感码被长度道遮蔽，本条期望不成立。
- **步骤**：在夹具目录逐个创建下表文件作为证据 path（`quote` 取 ≥10 字的真实 md 片段，见前置），每跑一次 `checkEvidence`：
  `.env`、`.env.local`、`server.pem`、`ca.key`、`client.p12`、`id_rsa`、`id_ed25519_x`、`.npmrc`、`.netrc`、`credentials.json`、`my-secret-notes.md`
- **预期**：11 形态全部 `EvidenceSensitivePath`（PRD 名单 10 类全命中：`.env*` / `*.pem` / `*.key` / `*.p12` / `id_rsa*` / `id_ed25519*` / `.npmrc` / `.netrc` / `credentials*` / `*secret*`）。
- **判据**：11 次 `codes.includes('EvidenceSensitivePath')`；逐类断言（任一类漏判单独红，非合并计数）。
- **红绿证据**：红 = 名单缺类（如只判了 `.env*` 忘了 `*secret*`）；绿 = 11 类齐码。
- **对应测试**：`evidence.test.mjs`（增补）
- **不覆盖**：不判文件内容是否真含密钥（路径命中即拒——内容扫描属第 7 道 C04 的职责边界）。

#### C02 EvidenceSensitivePath：按 `\` 拆段同样命中

- **覆盖**：§10.8-3 / PRD §4.3 第 6 道（「按 / \ 拆段任一段命中」）
- **来源**：spec R3；Windows 正当输入用反斜杠——只按 `/` 拆段的实现会放走 `dir\.env`
- **前置**：同 C01（含证据侧必要条件：quote ≥ 10 字、长度道必过——与 C04 同口径）。
- **步骤**：证据 path 写成 `fixtures\.env`（反斜杠）与 `a/b\.env`（混合分隔）两形态。
- **预期**：均 `EvidenceSensitivePath`。
- **判据**：×2 `codes.includes('EvidenceSensitivePath')`。
- **红绿证据**：红 = 分隔符只认一种（Windows 环境直接漏判）；绿 = 两态齐码。
- **对应测试**：`evidence.test.mjs`（增补）
- **不覆盖**：URL 形态证据（PRD 名单按路径段判，URL 不是本轮证据形态）。

#### C03 敏感路径假阳性守卫：普通路径不误报

- **覆盖**：§10.8-3 / PRD §4.3 第 6 道
- **来源**：判别力面——名单若过宽（如把 `.md` / `.mjs` 全拦），校验器不可用，人人绕行
- **前置**：同 C01。
- **步骤**：证据 path 用 `docs/observation.mjs`、`notes/key-terms.md`（注意含 `key` 字样但不是 `.key` 扩展名）、`.gitignore`。
- **预期**：三路径全部正常走后续道（路径域不报码；文件存在且引用真实时整体通过）。
- **判据**：`!codes.includes('EvidenceSensitivePath')` ×3（其余道的结果不影响本条判据——只断言敏感道零命中）。
- **红绿证据**：红 = `key-terms.md` 被 `*.key` 误伤（扩展名判据写成子串判）或 `.gitignore` 被点文件一刀切；绿 = 三路径零命中。
- **对应测试**：`evidence.test.mjs`（增补）
- **不覆盖**：`.gitignore` 是否「该」可作证据（语义自由度，判据只管不属敏感名单）。

#### C04 EvidenceQuoteSensitive：四形态逐字命中

- **覆盖**：§10.8-3 / PRD §4.3 第 7 道 / §4.4 B 表 S2 组
- **来源**：spec R3 + PRD §10 F-14（快照法可能带出密钥——引文面也要拦）
- **前置**：S2 已实现敏感内容判据（草稿零实现，0.2 #6）。
- **步骤**：夹具文件四行分别含：`-----BEGIN RSA PRIVATE KEY-----`、`AKIAIOSFODNN7EXAMPLE`（AKIA+16 位）、`ghp_` + 36 位字母数字、`https://user:pass@example.com/repo`；quote 逐行引用（长度全达标，避免 EvidenceQuoteTooShort 干扰）。
- **预期**：四形态均 `EvidenceQuoteSensitive`。
- **判据**：×4 `codes.includes('EvidenceQuoteSensitive')`；断言在长度道**之后**仍独立命中（顺序不敏感，只要报码）。
- **红绿证据**：红 = 四正则漏其一（如只写 AKIA 忘 ghp_）；绿 = 四态齐码。
- **对应测试**：`evidence.test.mjs`（增补）
- **不覆盖**：假长度样本（如 AKIA 后只有 10 位——既不匹配 AKIA 正则也不该误报敏感，归长度道；不设交叉用例防两道互相污染断言）。

#### C05 敏感内容假阳性守卫：无凭据 URL 不误报

- **覆盖**：§10.8-3 / PRD §4.3 第 7 道
- **来源**：URL 凭据正则 `https?://[^/@\s]+:[^/@\s]+@` 的边界——**端口写法 `https://host:8080/x` 不带 @ 不命中**，但正则写松（把 `:` 后任意段当凭据）会全仓误伤
- **前置**：同 C04。
- **步骤**：quote 引用 `https://github.com/org/repo/blob/main/a.md` 与 `https://example.com:8080/docs`（带端口无凭据）。
- **预期**：零 `EvidenceQuoteSensitive`（整体校验通过——长度、命中、敏感三道全过）。
- **判据**：`errors.length === 0` ×2。
- **红绿证据**：红 = 端口形态被误报（正则没锚住 `@`）；绿 = 两 URL 全过。
- **对应测试**：`evidence.test.mjs`（增补）
- **不覆盖**：`user@host` 邮箱形态（无 `:pass@`，PRD 正则不拦邮箱——按 PRD 口径执行，不扩名单）。

#### C06 MdUnreadable：md 不可读收敛为码（不冒泡）

- **覆盖**：§10.8-3 / PRD §4.2 ②/③ / §4.4 B 表 S2 组
- **来源**：spec R3 + PRD §4.2 异常纪律「任何 IO 异常必须收敛为结构化错误码，不得冒泡」——草稿 `artifact.mjs` 的 `readFileSync(mdPath)` 无 try（0.2 #8），md 为目录直接 EISDIR 炸出去
- **前置**：S2 已实现 MdUnreadable 收敛。
- **步骤**：`validateArtifact(json合法, { mdPath = 一个存在的目录 })`（existsSync(目录)=true、readFileSync 抛 EISDIR——最稳定的「存在但不可读」构造，跨平台无需 ACL）。
- **预期**：返回结构化 errors 含 `MdUnreadable`，**进程不抛异常**。
- **判据**：`codes.includes('MdUnreadable')` 且调用方无 try 也拿得到返回值（`assert.doesNotThrow` 形态）。
- **红绿证据**：红 = 草稿现状（EISDIR 冒泡，CLI 崩溃退出非 1 的随机码）；绿 = 收敛。
- **对应测试**：`artifact.test.mjs`（增补）
- **不覆盖**：真 ACL 权限拒绝态（构造依赖环境权限，EISDIR 已代表「读失败」类；ACL 态留验收环境观察）。

#### C07 纯结构行不可作证据

- **覆盖**：§10.8-3 / PRD §4.3 第 5 道（纯结构行不可作证据；**四类** = `---`、表格分隔行、围栏行、渲染器固定骨架行——第四类 2026-10-27 补登记）
- **来源**：spec R3 + **编写者独立发现**——`\| --- \| --- \| --- \|` 归一化后 13 字（≥10 字下限），且该行确实包含 quote，长度道与命中道全过 → **结构行假绿**（盲点 G-8；PRD 有判据但未给码名）。**第四类来源（2026-10-27 复核）**：三形态实现完成后，`hit` 改引渲染器自己写的横幅（`<!-- observation-md v1 -->`）仍四段全绿——证据闭环于被证明者自身，故把「本工具无条件写入且不含数据的固定行」并入同一码
- **前置**：S2 已实现结构行判据（命中即返回该码）；**码名已登记 `EvidenceStructuralRow`（与 `EvidenceQuoteTooShort` 的分界 = 结构行可以 ≥10 字）**；骨架常量单源 = `tools/observation-check/md-format.mjs`（渲染侧与校验侧同取这一份）
- **步骤**：① 夹具文件某行为 `| --- | --- | --- |`，quote = 整行（13 字过长度）；② 再测围栏行 ``` ``` ```（3 字——本形态预期被长度道拦，证明结构行判据与长度道的层次：9 字以下不用结构行判据也红）；③ 标题分隔行 `---`（3 字，同②）；④ 渲染器固定骨架行逐行（`MD_SKELETON` 六项：横幅 / `# 观察表` / `## 补充项` / `无。` / 两张表头），各取整行为 quote。
- **预期**：① 红（结构行判据命中）；②③ 红（长度道命中——结构行不是逃逸通道的证明）；④ 红（结构行判据；其中「无。」2 字先被长度道拦，同属红）。
- **判据**：①②③④ `errors.length > 0`；①④ 的码逐字 === `EvidenceStructuralRow`（④ 中 2 字的「无。」允许为 `EvidenceQuoteTooShort`）；②③ `codes.includes('EvidenceQuoteTooShort')`。
- **红绿证据**：红 = ①在草稿现状通过（13 字结构行假绿——这正是缺口）；②③拦住但那是长度道的功劳，不能宣称结构行判据已存在；④在四类落地前返回 `ok:true`（自产常量可作证据）。绿 = ①④ 出 `EvidenceStructuralRow`。
- **对应测试**：`evidence.test.mjs`（C07 / C07 补充 ×2）
- **不覆盖**：围栏行内的真实内容行（围栏内一行 ≥10 字的正文——按 PRD 判据「围栏行」本身才是结构行，内容行可作证据；此边界判读若 plan 有异议，回扫本条）；任意「与本工具无关的零信息行」（语义归审计人，机械判据只认骨架常量与三类结构行）。

#### C08 RepoRootUnresolved：根解析失败必须 fail-closed（不退化为 `process.cwd()`）

- **覆盖**：§10.8-3 / PRD §4.3 第 2 道（`git rev-parse --show-toplevel` 取不到仓库根 → fail-closed；**不得以 `process.cwd()` 或传参兜底**）/ §4.4 B 表 S2 组 `RepoRootUnresolved`（PRD :356）
- **来源**：PRD :527「§4.4 B 表 S2 组的**每个码** ≥1 条反例」——该码在 `tools/observation-check/*.test.mjs` 现命中 **0**（S2 出口的唯一缺口）；只断言「出码」而不断言「换 cwd 仍出码」的话，`process.cwd()` 兜底实现照样能过（在任意目录跑都「合法」），等于判据没了。
- **前置**：
  - S2 已实现两处：`tools/observation-check/evidence.mjs:35-47`（`repoRoot()`：`execFileSync('git', ['rev-parse','--show-toplevel'])` 失败 → 抛 `e.code='RepoRootUnresolved'`）、`tools/observation-check/evidence.mjs:75`（`checkEvidence` 捕获后返回 `{ok:false, code:'RepoRootUnresolved'}`）。
  - `repoRoot()` 带模块级缓存 `cachedRoot`——**必须在全新子进程里跑**：同进程若先跑过任一其它证据用例，缓存已填，根解析不再走 git，本条恒绿（假绿）。
  - 构造目录必须**不在任何 git 仓库内**：`os.tmpdir()` 下 `mkdtempSync` 建空目录（不 `git init`），并在其中再建一层子目录，确保「向上找不到 `.git`」。
- **步骤**：① `mkdtempSync(join(os.tmpdir(), 'obs-check-nogit-'))` → 目录 D；`mkdirSync(join(D,'a','b'), { recursive: true })`；② 预检 `git -C D rev-parse --show-toplevel` 必须**非 0**（若本机 tmpdir 恰落在某个仓库工作树内，本条不可构造：记下环境并注明跳过，不得改判据）；③ 起子进程 `node --input-type=module --eval "<import 语句>"`、`cwd = D`，import 目标用仓库绝对路径（`file:///…/tools/observation-check/evidence.mjs`），调 `checkEvidence({ path: 'x', line: 1, quote: '0123456789' })` 并 `console.log(JSON.stringify(…))`；④ 解析 ③ 的 stdout JSON；⑤ 用完 `rmSync(D, { recursive: true, force: true })`。
- **预期**：③ 退出码 0；stdout JSON 的 `ok === false` 且 `code === 'RepoRootUnresolved'`；**不得**出现 `EvidenceNotFound`（那说明根被解析成了 cwd）。
- **判据**：`JSON.parse(stdout).code === 'RepoRootUnresolved'` && `JSON.parse(stdout).ok === false`（单条断言，机器判）。stderr 里 git 自己的 `fatal: not a git repository` 行**不作判据**——它是被捕获的异常文本。**反例判据（判别力）**：把 `repoRoot()` 的 catch 分支改成 `return process.cwd()` 兜底后重跑本条，必须转红（此时根 = D → `confine` 过 → `D/x` 不存在 → 返回 `EvidenceNotFound`）；该改法**只作一次性判别力演练、不许合入**，演练结论记入 §4 回归清单。
- **红绿证据**：红 = 实现拿 `process.cwd()`（或入参）兜底 → 返回 `EvidenceNotFound` 甚至 `ok:true`；绿 = `code === 'RepoRootUnresolved'`（本文件编写时实跑确认：`{"ok":false,"code":"RepoRootUnresolved",…}`、node exit 0）。
- **对应测试**：`evidence.test.mjs`（由测试代理落地；预期测试名 `C08 RepoRootUnresolved：子进程 cwd 不在任何 git 仓库内 → fail-closed（不退化为 process.cwd）`）
- **不覆盖**：`tools/observation-check/artifact.mjs:30-31` 的同类转码（写盘入口的根解析失败，属写盘段 E 组）；「传参兜底」路径（接口已不接受 root，签名层面由 §1.2 夹具约定 + G-13 兜住）；`git` 可执行文件缺失（`execFileSync` ENOENT 同归本码，与「不在仓库内」同码同判据，另造一遍无判别力）。

### D 组：渲染段与 golden（锚点 3 渲染最小信息集 + 锚点 4）

#### D01 hit 行渲染含 `path:line`（实现缺口，当前必红）

- **覆盖**：§10.8-3/4 / PRD §4.2 ③「每个 hit 行必须含 path:line」
- **来源**：spec R3/R4 + **编写者独立发现**——草稿 `checks.mjs`（草稿区 行 128-129） 把 hit 的 evidence **对象**直接插进模板字符串，渲染输出 `| k01 | 命中 | [object Object] |`（盲点 G-2）：既有测试只断言「命中」两字在，从未看第三列是什么——**golden 若不先修此行，expected.md 冻结的就是 [object Object]**
- **前置**：S2 已修渲染（hit 行第三列 = `path:line` + quote 摘要，形态按 plan Task N，本条只锁 `path:line` 在行内）。
- **步骤**：① 构造 hit 产物（evidence = {path:'fixtures/ev.md', line:3, quote:'...'}）；② `renderObservation`；③ 定位 items 表的 hit 行。
- **预期**：hit 行含 `fixtures/ev.md:3` 子串（逐字）。
- **判据**：`/fixtures\/ev\.md:3/.test(md)` === true；且全 md 不含 `[object Object]`。
- **红绿证据**：红 = 草稿现状（第三列是 `[object Object]`）；绿 = path:line 在行。
- **对应测试**：`render-check.test.mjs`（增补）
- **不覆盖**：quote 在 hit 行的截断长度（形态细节，golden D05 统一冻结）。

#### D02 open 行渲染含 evidence 的 path 与 line

- **覆盖**：§10.8-3/4 / PRD §4.2 ③「每个 open 行必须含 evidence」
- **来源**：spec R3——open 项是「未闭合分歧」，行里没有证据指针 = 读者无法复核分歧是否真实存在
- **前置**：open 渲染已实现 evidence 列（草稿 renderObservation 的 open 段只渲染 object/reason——0.2 #2 同族，需补）。
- **步骤**：构造 open 项（object:'甲乙结论句'，impact/suggestion 齐，evidence = {path, line}）；渲染；定位 open 表行。
- **预期**：该行含 evidence.path 与 line（`path:line` 或表格分列形态，按实现——本条锁两字段都在行内）。
- **判据**：行文本 `includes(ev.path)` 且 `includes(String(ev.line))`。
- **红绿证据**：红 = open 行无证据列（草稿现状）；绿 = 两字段在行。
- **对应测试**：`render-check.test.mjs`（增补）
- **不覆盖**：open 行其余列文案（golden 冻结）。

#### D03 ASCII 竖线转义：渲染后每行列数 = 表头列数（三类不出码之三）

- **覆盖**：§10.8-3 三类不出码 / PRD §4.2 ③「单元格内 ASCII 竖线必须转义（口径与 markdown-rows.mjs 共用单源），并断言转义后每行列数 = 表头列数（用同一 splitRow 复算）」
- **来源**：spec R3 点名三类之一；已知风险点①的姊妹面——**字段带 `|` 渲染炸表，checkRendered 又逐行比对，渲染与校验同时失真而全绿**
- **前置**：S2 已实现转义（`\|` 形态——splitRow 的口径只认 `\|` 为转义竖线，故转义字面锁定）；转义函数与 `tools/execution-matrix/markdown-rows.mjs:15` 的 splitRow 单源复算。
- **步骤**：① 构造产物：open 项 object = `筛 | 关键`、item reason 含 `A || B`（**内容里**的 ASCII 竖线）；② `renderObservation`；③ 逐行 `splitRow`（import 单源函数）复算列数；④ 断言转义字面。
- **预期**：每行列数 === 表头列数；含竖线的单元格在输出里以 `\|` 出现（splitRow 不切列）。
- **判据**：`lines.every(l => splitRow(l).length === splitRow(headerLine).length)`；输出含 `筛 \| 关键` 逐字子串。
- **红绿证据**：红 = 草稿现状（模板直插、竖线撑破表格，无任何码）；绿 = 转义后列数守恒。
- **对应测试**：`render-check.test.mjs`（增补）
- **不覆盖**：全角 `｜`（是合法内容、**不**转义、也不破坏列数——归 H01-5 断言，两形态分开防转义过宽）。

#### D04 含 `\|` 的合法产物全链路正例

- **覆盖**：§10.8-3 / PRD §4.2 ③/④
- **来源**：D03 只断渲染面；转义若与写盘/读回不兼容（如 checkRendered 的 normText 吃掉 `\`），单看渲染绿、全链路断
- **前置**：D03 已实现；`writeObservation` / `validateArtifact` 改造完成。
- **步骤**：含 `\|` 字段的合法产物（证据用自建夹具真实引用）→ `writeObservation` 写盘 → `validateArtifact` 读回。
- **预期**：写盘 `ok:true` 两文件落盘；读回 `errors` 为空（渲染一致含转义字符）。
- **判据**：写盘 `r.ok === true` && 读回 `errors.length === 0`；盘上 md 含 `筛 \| 关键`。
- **红绿证据**：红 = 转义在某一段被二次转义或吃掉（`\\|`/裸 `|`——读回 RenderMismatch）；绿 = 全链路一致。
- **对应测试**：`render-check.test.mjs`（增补）
- **不覆盖**：CRLF checkout 形态（normText 归一化既有用例保留）。

#### D05 golden 全文断言：渲染 === 人工期望文件

- **覆盖**：§10.8-4 / §10.1 R4 / PRD §8「golden：observation-r3.json + observation-r3.expected.md，断言 renderObservation 全文等于期望文件」
- **来源**：spec R4——已知风险点①（渲染器升级使历史 md 全红）的唯一前置防线：升级前任何渲染行为的**无意识漂移**都被 golden 拦下
- **前置**：D01/D02/D08 已实现（expected.md 冻结的是修复后形态）；golden 夹具两文件已人工写好（D06 锁形态覆盖）。
- **步骤**：① `JSON.parse(readFileSync('observation-r3.json'))`；② `renderObservation(doc)`；③ 与 `readFileSync('observation-r3.expected.md')` 经 normText（与 checkRendered 同口径——防 autocrlf 把 expected.md 检出成 CRLF 假红）比对；④ 复用 `checkRendered(doc, expected)` 断言 ok。
- **预期**：`checkRenderation` 全文一致，`ok:true`、零行号差异。
- **判据**：`checkRendered(doc, expectedContent).ok === true`（渲染一致判据与第③段校验同一实现——单源）。
- **红绿证据**：红 = 渲染器任何未同步 golden 的改动（含换行/空白差异）；绿 = 逐行一致。
- **对应测试**：`golden.test.mjs`（新）
- **不覆盖**：expected.md 的「内容正确性」（期望是人工定义——其义务被 D01/D02/D06/D08 拆成可机器断言；D05 只锁「实现 === 期望」）。

#### D06 golden 形态覆盖判别力

- **覆盖**：§10.8-4 / PRD §8
- **来源**：**判别力水位**——golden 若只冻结单一形态（全 hit），渲染器对 miss/na/open/跳过清单的改动不被 golden 拦截，防回归名存实亡
- **前置**：golden 夹具已写。
- **步骤**：解析 observation-r3.json，断言：① items 含 hit / miss / na 三态各 ≥1；② open 非空 ≥1；③ coverage.skipped 非空 ≥1；④ expected.md 含跳过清单段与 open 表段。
- **预期**：四断言全过。
- **判据**：四条件布尔与；任一不满足本条红并列出缺的形态。
- **红绿证据**：红 = golden json 偷懒单形态（防回归空转）；绿 = 全形态冻结。
- **对应测试**：`golden.test.mjs`
- **不覆盖**：instance -a/-b 双实例形态（golden 锁单实例渲染即可——双实例渲染同构，B18 已锁语义）。

#### D07 golden 判别力反例：expected.md 改一字必须红

- **覆盖**：§10.8-4 / PRD §8
- **来源**：**判别力证明**——D05 若是恒真断言（如实现读自己的输出再比自己的输出），上述全部白做；必须证明「期望变了会红」
- **前置**：D05 绿。
- **步骤**：① 读 expected.md 文本，把某 hit 行的 `path:line` 改一个字符（内存中，不落盘）；② `checkRendered(doc, 篡改文本)`。
- **预期**：`ok:false`，且差异定位到被改行号。
- **判据**：`ok === false` 且 error 行号 = 篡改行。
- **红绿证据**：红 = D05 恒真（比对绕过文本）；绿 = 篡改必红 + 行号可定位。
- **对应测试**：`golden.test.mjs`
- **不覆盖**：不篡改 json 侧（renderObservation 是纯函数，json 改 = 输入改，非基线问题）。

#### D08 渲染文案：「已判 N 条 / 共 M 条（跳过 K：…）」

- **覆盖**：§10.8-5 / PRD §7 D-09（[已决·代裁 C-02]：md 文案改「已判 N 条 / 共 M 条（跳过 K：…）」）
- **来源**：C-02 语义改判的连带文案——「读 N 部分」在 items 语义下是误导（read ≠ 读了多少，是判了多少）
- **前置**：S2 已改 renderObservation 文案（草稿 `checks.mjs`（草稿区 行 139） 现文案「覆盖度：读 N 部分 / 共 M 部分」——0.2 #14）。
- **步骤**：B14 正例形态产物（read=2、total=3、skipped=['k02']）→ 渲染 → 找覆盖度行。
- **预期**：行含 `已判 2 条 / 共 3 条` 与 `跳过 1：k02` 形态（N/M/K 由 coverage 派生，非手写）。
- **判据**：`md.includes('已判 2 条 / 共 3 条')` && `md.includes('跳过 1：k02')`。
- **红绿证据**：红 = 草稿现状（「读 2 部分」文案残留）；绿 = 新文案 + 数字派生。
- **对应测试**：`render-check.test.mjs`（增补）
- **不覆盖**：文案其余字句自由度（锚定数字与两个关键词，不锁全句——给措辞留余地，锁死即每次文案微调都红）。

### E 组：写盘入口与 CLI（锚点 6 + B 表写盘类码）

前置总述：本组全部用例以 **PRD §4.5 终态签名**为对象——`writeObservation(doc, { jsonDir, registeredIds })`，文件名由 `doc.round` / `doc.instance` 派生（草稿现签名 `{ jsonPath, mdPath, registeredIds, root }` 与 §4.5 不符，0.2 #10/#11，S2 同批收缩）。目的地基具：仓库内 `.session/reviews/<test-次>/`（mkdtemp 同级自建自清）。

#### E01 文件名派生：`observation-r<N>[‑ab].json|md` 两文件落盘

- **覆盖**：§10.8-3/6 / PRD §4.5「文件名由 doc.round 派生」「不再接收任意 jsonPath/mdPath」
- **来源**：spec R3/R5——文件名派生是 RoundMismatch / InstanceMissing / 目的地正则三个判据的共同基座
- **前置**：新签名落地；合法 doc（round=3，instance=null；证据 = 自建夹具真实引用）。
- **步骤**：① `writeObservation(doc, { jsonDir, registeredIds })`；② 断言 jsonDir 下两文件名；③ instance='A' 再跑一次（另一 jsonDir）。
- **预期**：② `observation-r3.json` + `observation-r3.md`；③ `observation-r3-a.json` + `observation-r3-a.md`（instance 小写）。
- **判据**：四个文件名逐字断言；且 jsonDir 之外零文件产出（`readdirSync(jsonDir).length === 2` ×2）。
- **红绿证据**：红 = 调用方仍能传任意 jsonPath 覆盖派生（旧签名残留）；绿 = 派生唯一 + 目录无杂物。
- **对应测试**：`write.test.mjs`（增补）
- **不覆盖**：round 非正整数（InvalidFieldType 既有判据）。

#### E02 RoundMismatch：路径 N 与内容 round 不一致

- **覆盖**：§10.8-3 / PRD §4.5 / §4.4 B 表 S2 组
- **来源**：spec R3——文件名与内容分头改（改名 / 换轮复用文件）即静默错位；「若调用方另行传入路径且该路径匹配 observation-r(\d+)，其 N 必须 === doc.round」
- **前置**：CLI/单件校验入口已实现一致性判（传路径的入口恰是 CLI 与 rewrite——writeObservation 自派生不会不一致）。
- **步骤**：mkdtemp 内放 `observation-r5.json`（内容 round=3，其余合法）→ `node cli.mjs <该文件>`。
- **预期**：exit 1 + `RoundMismatch`。
- **判据**：退出码 1 且 stderr/stdout 含 `RoundMismatch` 逐字。
- **红绿证据**：红 = 路径与内容对不上无人管（改轮次号不改文件名的漂移静默存活）；绿 = 齐码 + exit 1。
- **对应测试**：`cli.test.mjs`（新）
- **不覆盖**：`observation-r3-a.json` 的 a 与 instance 不一致（同名族判据，PRD 只写 N 对齐——instance 对齐如 plan 判定要管，回扫本条与 §1.1）。

#### E03 ArtifactPathOutside：jsonDir 不匹配目的地正则

- **覆盖**：§10.8-3 / PRD §4.5 / §5.3 行 6
- **来源**：spec R3——「写到约定目录外」是覆盖源码 / 污染仓面的第一道口子
- **前置**：目的地判据已实现：realpath ① git toplevel 内 ② 匹配 `^\.session/reviews/[^/]+/observation-r\d+(-[ab])?\.(json|md)$` ③ 不在 `.git/**`。
- **步骤**：① `jsonDir = <repo>/tools/`（正则不匹配）→ `writeObservation`；② `jsonDir = <repo>/.session/tmp/`（在 .session 但非 reviews/<次>）→ 同跑。
- **预期**：①② 均 `ArtifactPathOutside` 且 `wrote:false`、两文件皆不落盘。
- **判据**：×2 `codes.includes('ArtifactPathOutside')` && `existsSync(任一目标) === false`。
- **红绿证据**：红 = 草稿现状（任意路径都写——0.2 #10）；绿 = 两形态拒写零残留。
- **对应测试**：`write.test.mjs`（增补）
- **不覆盖**：realpath 在 toplevel 外（盘符外路径——传绝对路径形态由 EvidencePathAbsolute 族理念覆盖，PRD §4.5 未单列仓外 jsonDir 码，归 ArtifactPathOutside 同码；如 plan 另立码，回扫）。

#### E04 ArtifactPathOutside：归档目录只读

- **覆盖**：§10.8-3 / PRD §4.5「归档目录 docs/superpowers/reviews/** 只读：命中即 ArtifactPathOutside」
- **来源**：spec R3——归档件被就地改写 = 历史记录被重写（与本仓文档规则「不改历史」同源）
- **前置**：同 E03。
- **步骤**：测试内 `mkdirSync('docs/superpowers/reviews/test-artifact-out-tmp/')`（自建自清——不触碰真实归档件）→ `writeObservation(doc, { jsonDir: 该目录 })`→ finally 删目录。
- **预期**：`ArtifactPathOutside` + 零写盘。
- **判据**：`codes.includes('ArtifactPathOutside')` && 目录内零新增文件。
- **红绿证据**：红 = 归档路径被当普通目录写入；绿 = 拒写。
- **对应测试**：`write.test.mjs`（增补）
- **不覆盖**：真实归档件的改写场景（G01 演练覆盖正路；攻击面已由本条夹具证明）。

#### E05 合法 jsonDir 正例：`.session/reviews/<次>/` 写盘通过

- **覆盖**：§10.8-3 / PRD §4.5
- **来源**：E03/E04 的对照正例——目的地判据过严 = 校验器拒绝一切合法写盘（假阳性面）
- **前置**：同 E03。
- **步骤**：`jsonDir = <repo>/.session/reviews/test-ok-<rand>/` → 合法 doc 写盘 → 读回校验 → 清理。
- **预期**：`ok:true` 两文件落盘；`validateArtifact` 读回零错误。
- **判据**：`r.ok === true` && 读回 `errors.length === 0`。
- **红绿证据**：红 = 正则写错（如把 `<次>` 段写成固定名）；绿 = 全链路过。
- **对应测试**：`write.test.mjs`（增补）
- **不覆盖**：写盘后 move 归档（迁移状态机，G01 验收）。

#### E06 WriteFailed + 全成功再 rename：md 失败则 json 不落盘

- **覆盖**：§10.8-3 / PRD §4.2 ④「任一失败清 tmp 并返回 {ok:false,wrote:false,errors}」+ §4.4 B 表 WriteFailed
- **来源**：**编写者独立发现**——草稿 `artifact.mjs`（草稿区 行 53-54） 两文件各自 tmp+rename：json 成功后 md 失败 → **半写态**（json 在盘、md 无、返回 wrote:false）（盲点 G-6）；PRD §4.2 ④「先全部渲染/序列化 → 各写 tmp → 全成功再逐个 rename」是纪律
- **前置**：S2 已改原子序；WriteFailed 码实现。**必要条件**：断言「json 不落盘」的前提是 spec §10.2 ④ 的 rename 顺序：**md 先、json 后**——没有该顺序时，md rename 失败会让 json 已落盘（半写态断言不成立）。
- **步骤**：jsonDir 内预 `mkdirSync('observation-r3.md')`（目录占位同名文件——跨平台稳定制造 md 侧 rename 失败）→ `writeObservation`（合法 doc）→ 断言三态。
- **预期**：`WriteFailed`；json **不落盘**；jsonDir 无 `*.tmp-*` 残留。
- **判据**：`codes.includes('WriteFailed')` && `existsSync(jsonDir/observation-r3.json) === false` && `readdirSync(jsonDir).filter(f => f.includes('.tmp-')).length === 0`。
- **红绿证据**：红 = 草稿现状（半写态 + tmp 残留）；绿 = 零落盘 + 零 tmp。
- **对应测试**：`write.test.mjs`（增补）
- **不覆盖**：磁盘满 / ACL 拒绝（环境态构造不稳，目录占位已代表「写失败」类；两类若 plan 加注入点可回扫补断言）。

#### E07 InvalidWriteTarget：jsonDir 不存在 / 指向文件

- **覆盖**：§10.8-3 / PRD §4.2 ④ / §4.4 B 表 InvalidWriteTarget
- **来源**：spec R3——PRD 只给码名未给细分判据（缺口 G-9）；本 testcase 采**设计判据**：目标非法（jsonDir 不存在 / 不是目录）→ InvalidWriteTarget，与 WriteFailed（目标合法但写失败）分界；plan 落地若改口径须回扫本条
- **前置**：判据实现。
- **步骤**：① `jsonDir = <repo>/.session/reviews/no-such-dir/`（不存在）；② `jsonDir = 一个现有文件路径`。两形态。
- **预期**：均 `InvalidWriteTarget`，零写盘零 tmp。
- **判据**：×2 `codes.includes('InvalidWriteTarget')` && 目标周边零新增。
- **红绿证据**：红 = 两态混报 WriteFailed（排障分不清「目标错」与「写失败」）；绿 = 分界成立。
- **对应测试**：`write.test.mjs`（增补）
- **不覆盖**：jsonDir 为软链出仓（§4.5 realpath 判据已含，构造归 §6 不测清单第 5 条）。

#### E08 CLI 单件校验正例：合法产物 exit 0

- **覆盖**：§10.8-6 / §10.1 R5 / PRD §2「最小 CLI：单件校验」+ §4.2 ③
- **来源**：spec R5——CLI 是议会人复核产物的唯一命令行入口；只许输出不落盘
- **前置**：cli.mjs 落地（**新增文件**——草稿 11 文件里没有 cli.mjs，sha256 清单不含它）。
- **步骤**：mkdtemp 建目录 → `writeObservation` 现造合法产物（证据 = 自建夹具真实引用）→ `node tools/observation-check/cli.mjs <json>` → 清理。
- **预期**：exit 0；stdout 零 diff、零写盘（运行前后目录文件哈希不变）。
- **判据**：退出码 0 && 目录文件清单 + hash 前后逐项相等。
- **红绿证据**：红 = CLI 顺手「修复」或写日志（只读入口落盘 = 越权）；绿 = 零副作用。
- **对应测试**：`cli.test.mjs`（新）
- **不覆盖**：CLI 输出文案格式（PRD 只锁行为与退出码）。

#### E09 CLI 单件校验反例：结构坏件 exit 1 + 错误码清单

- **覆盖**：§10.8-6 / PRD §4.2
- **来源**：spec R5——坏件必须以**码**告知，否则议会人拿到的只是「不行」
- **前置**：同 E08。
- **步骤**：构造 coverage 缺失 + verdict 非法双错件 → `node cli.mjs <json>`。
- **预期**：exit 1；输出含 `MissingCoverage` 与 `UnknownVerdict` 两码（结构错误全报，非首错即停）。
- **判据**：退出码 1 && stdout/stderr 同时含两码逐字。
- **红绿证据**：红 = 只报首错（漏错 = 复核人修一个再跑一轮，成本翻倍）；绿 = 全错并列。
- **对应测试**：`cli.test.mjs`
- **不覆盖**：错误排序（全报即可，顺序自由）。

#### E10 CLI：不存在的路径 → JsonNotFound

- **覆盖**：§10.8-6 / PRD §4.2
- **来源**：spec R5——路径错是最常见误用（手滑多打一个字符），必须码化不崩溃
- **前置**：同 E08。
- **步骤**：`node tools/observation-check/cli.mjs .session/reviews/x/observation-r9.json`（不存在）。
- **预期**：exit 1 + `JsonNotFound`。
- **判据**：退出码 1 && 输出含 `JsonNotFound`。
- **红绿证据**：红 = 未捕获异常崩溃（退出码非 1 的随机值）；绿 = 收敛。
- **对应测试**：`cli.test.mjs`
- **不覆盖**：路径是目录（同类 IO 态，归 JsonNotFound 族；不逐一设）。

#### E11 CLI：同名 md 缺失 → MdMissing（缺省不得跳过）

- **覆盖**：§10.8-6 / PRD §4.2 ③「mdPath 必填：缺省不得跳过」
- **来源**：spec R5——**「跳过 md」是校验器自废武功的开关**：PRD 明令缺省不得跳过，CLI 无开关
- **前置**：同 E08。
- **步骤**：jsonDir 只放 `observation-r3.json`（无 md）→ `node cli.mjs <json>`。
- **预期**：exit 1 + `MdMissing`（**CLI 必须自动找同名 md 并坚持其存在**——不提供 `--no-md` 类旁路参数）。
- **判据**：退出码 1 && 输出含 `MdMissing`。
- **红绿证据**：红 = CLI 静默只校验 json（md 可被任意篡改而不被复核）；绿 = 坚持双件。
- **对应测试**：`cli.test.mjs`
- **不覆盖**：rewrite 模式下的 md 缺失（rewrite 的职责恰是重建 md——语义相反，E14 覆盖）。

#### E12 rewrite 只重渲染 md：json 字节不动

- **覆盖**：§10.8-6 / §10.1 R5 / PRD §2「自动修复产物内容会掩盖证据造假，故只重渲染 md，不改 json」+ §4.5
- **来源**：spec R5——rewrite 的安全边界 = json 是证据载体一字不动，md 只是它的投影
- **前置**：CLI rewrite 子命令落地；mkdtemp 内现造产物后**手改 md 一字**（制造需 rewrite 的状态）。
- **步骤**：① 记下 json sha256；② `node cli.mjs rewrite <json>`；③ 复算 json sha256；④ 读 md 与 `renderObservation(json)` 比对。
- **预期**：③ hash 前后相等（json 一字节不动）；④ md === 渲染结果（RenderMismatch 消除）。
- **判据**：hash 相等 && `checkRendered(doc, readFileSync(md)).ok === true`。
- **红绿证据**：红 = rewrite 顺手「规范化」json（改 round / 改 coverage 数字——证据被无声重写）；绿 = 只动 md。
- **对应测试**：`cli.test.mjs`
- **不覆盖**：rewrite 前是否先校验 json 证据（证据真假归校验链——rewrite 对假证据件的行为：先跑校验再拒，或直接重渲染；plan 定，若判「必须先校验」则回扫本条加断言）。

#### E13 rewrite 写非过程目录 → ArtifactPathOutside 拒写

- **覆盖**：§10.8-6 / PRD §4.5「归档件要改（含 RenderMismatch 修复），一律 rewrite 写回 .session/reviews/<同次>/，再由 §5.1 迁移状态机搬过去」
- **来源**：spec R5——**rewrite 若允许就地写归档目录 = 「归档只读」被 rewrite 旁路**（E04 的姊妹防线）
- **前置**：同 E12。
- **步骤**：把现造产物放到 `tools/` 下测试目录（非 `.session/reviews/**`）→ `node cli.mjs rewrite <json>`。
- **预期**：exit 1 + `ArtifactPathOutside`，md 不被改写。
- **判据**：退出码 1 && md 前后 hash 相等（未被重写）。
- **红绿证据**：红 = rewrite 无目的地判据（任意目录可写）；绿 = 拒写。
- **对应测试**：`cli.test.mjs`
- **不覆盖**：rewrite 写回 `.session/reviews/<同次>/` 的合法正例（E14 承接——归档件复制到同次过程目录再 rewrite）。

#### E14 归档件要改时不得写归档目录（只在同次过程目录内改写）

- **覆盖**：§10.8-6 / PRD §4.5「归档件要改（含 RenderMismatch 修复），把 json 复制到 `.session/reviews/<同次>/` 再 `rewrite`」+ spec §10.2 最小 CLI 段
- **来源**：spec R5——E04 拦的是「不许写归档目录」，E14 拦的是**改归档件的唯一合法路径**是否被真的走成：施工者图省事直接对归档件跑 rewrite，或让 rewrite 顺着原路径就地回写，历史记录就被无声重写（迁移状态机被旁路）
- **前置**：E04（归档目录拒写）与 E12（rewrite 只重渲染 md）已实现；一件**合法归档件**（json + md 配对，位于自建的 `docs/superpowers/reviews/test-obs-check-<rand>/`——**目录名带 `test-` 前缀**，G03/G04 的存量白名单判据须显式排除 `test-*`；不触碰真实归档件）；同次过程目录 `.session/reviews/test-rewrite-<rand>/` 自建自清；演练目录在 `finally` 内删除（含其中 json/md），只在其存在期间做 sha256 对比，避免残留撞 S3 三态与门禁。
- **步骤**：① 记录归档目录内 `observation-r3.json` 与 `observation-r3.md` 的 sha256；② 把**归档目录里的 json** 复制到 `.session/reviews/test-rewrite-<rand>/`（md 由 rewrite 重建，不复制）；③ `node cli.mjs rewrite .session/reviews/test-rewrite-<rand>/observation-r3.json`（`rewrite` 在 md 缺失时按 json 重建，不报 `MdMissing`，spec §10.2）；④ 复算归档目录内同名两文件 sha256，并断言过程目录内 md 已更新为 `renderObservation(doc)`。
- **预期**：③ exit 0；过程目录内 md 与渲染结果一致（RenderMismatch 消除）；**归档目录内同名文件 sha256 前后相等**（一字未动）。
- **判据**：③ 退出码 0 && 归档目录 md/json 前后 sha256 逐字符相等（**用 node `crypto.createHash('sha256')` 前后比对，不用 `Get-FileHash`**——本用例常驻 `cli.test.mjs`，测试进程内跑不了 PowerShell cmdlet）&& 过程目录 md `checkRendered(doc, readFileSync(md)).ok === true` && 过程目录 md 存在（新生成）。
- **红绿证据**：红 = rewrite 顺着原路径回写归档目录（历史件 hash 变 = 归档只读被旁路，且「复制到同次目录」这步被跳过）；绿 = 归档 hash 不变 + 过程目录 md 重建成功。
- **对应测试**：`cli.test.mjs`
- **不覆盖**：归档目录**拒写**反例（E04 已锁）；非过程目录拒写（E13）；复制后由 §5.1 迁移状态机搬回归档（G01 验收）。

### F 组：覆盖语义改批（锚点 5：7 处 fixture + 1 探索稿指针，禁放宽）

前置总述：锚点 5 构成（PRD §8 :527 原文拆解，逐处可 grep）——**7 处 fixture** = ① 5 处 coverage 基具（草稿实测 `coverage: { read: 4, total: 4, skipped: [] }` 逐字命中 `checks.test.mjs`（草稿区 行 16） / `write.test.mjs`（草稿区 行 16） / `render-check.test.mjs`（草稿区 行 14） / `artifact.test.mjs`（草稿区 行 16） / `adversarial.test.mjs`（草稿区 行 12））＋ checks.test.mjs（草稿区 行 80） 的覆盖度文本断言（`/覆盖度：读 4 部分 \/ 共 4 部分/`）＋ render-check.test.mjs（草稿区 行 39） 的 replace 目标（`'读 4 部分'`）；**+1 处** = 探索稿 :686 schema 片段。改批动因（已知风险②）：5 处基具数字与 items/registeredIds 不对账（基具 registeredIds 2 个、items 2 条，却报 read: 4 / total: 4）——旧口径只判 coverage 自身类型，数字与集合脱钩即「假绿」；B07-B12 七条对账一落地，5 处基具**必红**（B08 `items.length≠read`、B09 `total≠registeredIds.length` 双违反）。本组四条 = 改批的完整性判据：改净（F01）、文案同批（F02）、不缩断言面（F03）、单源指针（F04）。

#### F01 旧 coverage 基具 5 处 0 残留，重写后对账一致

- **覆盖**：§10.8-5 / §10.1 R6 / PRD §7 C-02（改判）+ §8 :527「5 处 coverage 夹具」
- **来源**：spec R6——「假绿」的物证就是这 5 处基具；不锁 0 残留，重写时可以只改 checks 一处、漏其余四处（改漏的文件在七条对账落地瞬间全红，或更糟：被顺手放宽）
- **前置**：B07-B12 七条对账实现落地；5 文件基具已按新语义重写（coverage.read = items.length、coverage.total = registeredIds.length、read + skipped.length = total）。
- **步骤**：① `Select-String -Path tools\observation-check\*.test.mjs -Pattern 'read: 4, total: 4'`；② 逐文件读基具（基具是公共构造器，各文件恰 1 处）：断言 read/total 与 items/registeredIds 对账一致；③ `node --test tools/observation-check/*.test.mjs` 全跑。
- **预期**：① 0 命中；② 5 处基具全部通过 §4.2① 七条对账；③ 全绿（迁入后全绿 = 锚点 2 的前提，A04 联防）。
- **判据**：① 输出行数 = 0 && ③ `# pass` = 总数（exit 0）&& ② 任抽 2 个基具 `coverage.read === items.length && coverage.total === registeredIds.length` 成立。
- **红绿证据**：红 = 任一文件残留旧口径（七条对账一实现即该文件全线红——正是 C-02 改判要抓的假绿形态）；绿 = 5 处同步、对账成立。
- **对应测试**：`baseline.test.mjs`（静态扫描断言 + 基具一致性抽检）
- **不覆盖**：基具 items 从 2 条扩到几条（plan 自决——判据只锁「数字与集合对账一致」，不锁具体条数）。

#### F02 覆盖度文本断言与 replace 目标随 D08 文案同批改

- **覆盖**：§10.8-5 / §10.1 R6 / PRD §7 D-09 + §8 :527（「文本断言 + replace 目标」两处）
- **来源**：spec R6——D08 把渲染文案从「读 N 部分 / 共 M 部分」改判为「已判 N 条 / 共 M 条」；测试里两处引用旧文案（断言正则 + replace 目标），不同批改则 F01 改完基具后这两处立即假红，逼出「顺手放宽」
- **前置**：D08 新文案已落地；草稿实测两处引用：`checks.test.mjs`（草稿区 行 80）（`assert.match(md, /覆盖度：读 4 部分 \/ 共 4 部分/)`）、`render-check.test.mjs`（草稿区 行 39）（`renderObservation(d).replace('读 4 部分', '读 1 部分')`）。
- **步骤**：① `Select-String -Path tools\observation-check\*.test.mjs -Pattern '读 \d+ 部分'`；② `Select-String -Pattern '已判'` 限定渲染断言与 replace 目标；③ 全测试绿。
- **预期**：① 0 命中（旧措辞在测试文件内归零）；② ≥ 2 处（断言 + replace 目标都换到新文案）；③ 绿。
- **判据**：① 行数 = 0 && ② 行数 ≥ 2 && ③ exit 0。
- **红绿证据**：红 = 只改了断言、replace 目标漏改——`replace('读 4 部分', …)` 替换不到目标，md 未被破坏，`RenderMismatch` 负例**假绿**（负例失效却不报错，最阴的放宽形态）；绿 = 两处同步换新。
- **对应测试**：`baseline.test.mjs`（静态断言；replace 目标的新文案命中数 ≥ 1 作为「负例仍有效」的代理判据——replace 能命中目标，负例才有破坏对象）
- **不覆盖**：D08 渲染正确性本体（D08 判）。

#### F03 夹具重写后对账五负例仍红（禁放宽的机器判）

- **覆盖**：§10.8-5 / §10.1 R6「禁止放宽断言」/ §1.2 保留纪律
- **来源**：spec R6——夹具改批是「改测试迁就新实现」的最大舞弊窗口：删掉 B08-B12 任何一条负例，测试照样全绿，断言面却缩了；「禁放宽」若只停在这句话，改批时没人机械判它
- **前置**：F01 完成；B08-B12 五负例已落 `coverage.test.mjs`。
- **步骤**：① `Select-String -Path tools\observation-check\coverage.test.mjs -Pattern 'CoverageMismatch'`；② 同文件扫 `test.skip|test.todo|doesNotMatch`；③ 跑该文件。
- **预期**：① 命中 ≥ 5（五负例各自的断言都在）；② 0 命中；③ 五负例对坏形态全红转绿、全测试 exit 0。
- **判据**：① 计数 ≥ 5 && ② 计数 = 0 && ③ exit 0。
- **红绿证据**：红 = 改批时顺手删/跳过对账负例（全绿但判别力没了——F03 是唯一能抓住这个的用例，A04 只数总数，数不出「删的正好是对账负例」）；绿 = 负例存续且有效。
- **对应测试**：`coverage.test.mjs`（负例计数断言；与 H02 的向量常量登记形成双保险）
- **不覆盖**：B 组其余负例的存续（同型风险，由 A04 总数 ≥ 71 + §4 回归清单联防，不逐一复制本判据）。

#### F04 探索稿 :686 schema 片段改为指向 PRD §4.1 的指针

- **覆盖**：§10.8-5 / §10.1 R6 / PRD §8 :527「探索稿 :686 的 schema 片段改为指针，与 V-8 同批」
- **来源**：spec R6——探索稿 §14.3 代码块是 PRD §4.1 之外的第二份 schema 原文；覆盖语义改判后：686 的旧语义片段若原样保留，读者按它理解 coverage（两处口径必漂移）；「指针重写」改的是指向，不是结论，符合「禁放宽」（不放宽任何断言，只消灭第二份真相）
- **前置**：无（纯文档动作，与 F01 同批提交）。
- **步骤**：① 读 `docs/after/20261026164718-agent-card-composition-exploration.md` :681-689（§14.3 代码块）；② 改后 `Select-String -Path <探索稿> -Pattern 'coverage: \{ read, total, skipped: \[\] \}'`；③ 同文件 `Select-String -Pattern 'PRD.*§4\.1|20261026205821'`（指针字样）。
- **预期**：② 0 命中（schema 片段原文不再存于探索稿）；③ ≥ 1 命中（代码块改为「schema 以 `docs/prd/20261026205821-agent-card-contract.md` §4.1 为唯一来源」类指针）；探索稿其余结论句一字不动。
- **判据**：② 行数 = 0 && ③ 行数 ≥ 1。
- **红绿证据**：红 = 片段保留（第二份 schema 继续漂移——改判后 :686 与 §4.1 必有一处是错的）；绿 = 单源。
- **对应测试**：`baseline.test.mjs`（静态断言；探索稿路径写死为常量——该文件名带时间戳不会漂移）
- **不覆盖**：探索稿其余 V-8 指针重写（**共 4 处**：`:236` / `:394` / `:400-401` / `:746`，PRD §9 V-8 定稿动作——归 §6 不测第 4 条；锚点 5 只义务 :686 这一处）。

### G 组：仓门禁与三态判定（锚点 7 + PRD §5.2 三态）

前置总述：G03-G06 的测试载体按 §0.3-1 口径 = **S2 提供的目录三态判定纯函数**（入参 = 子目录文件清单，内置 PRD §5.2 三态表 + 存量目录白名单常量 `2026-10-25-1723-s6-eval` + 允许文件名类 8 类 + C-15 的 `attachments/` 一层子层 + 非产物精确路径白名单 9 个）；check-all.mjs 接线与 git 断言（UntrackedArtifact / ArtifactDirty）归 S3。G01/G02 为锚点 7 的收尾验收命令，非常驻测试（理由见各条「不覆盖」）。

#### G01 归档演练：writeObservation → move → git add → npm run check 绿 → commit

- **覆盖**：§10.8-7 / §10.1 R7 / PRD §4.5 + §5.1 迁移状态机（C-05：move → git add → 跑 check → commit）
- **来源**：spec R7——锚点 7 的完整语义是「**归档一件合法产物后** `npm run check` 仍绿」；A07 只测未归档态，缺「归档动作走完状态机」这一段
- **前置**：S2 实现全部落地；演练用合法 doc（证据 = mkdtemp 自建件真实引用）。
- **步骤**：① `writeObservation(doc, { jsonDir: '.session/reviews/2026-10-27-xxxx-migration-drill/' })` 落过程产物；② move json+md 两文件到 `docs/superpowers/reviews/2026-10-27-xxxx-migration-drill/`；③ `git add` 两文件；④ 仓库根 `npm run check`；⑤ `git commit`。
- **预期**：④ exit 0（新归档件不触发既有检查段的红——doc-name 前缀、sweep 等）；⑤ 提交成功，`git status` 无两文件残留。
- **判据**：④ 退出码 0 && ⑤ `git status --porcelain -- docs/superpowers/reviews/2026-10-27-xxxx-migration-drill/` 输出为空。
- **红绿证据**：红 = 归档件名 / 落点触发仓内其它检查段（如 doc-name 判归档目录名非法）或四段校验对归档件误报；绿 = 全链走通、门禁不红。
- **对应测试**：验收命令（收尾一次性执行，命令序列 + 判据如上；**不设常驻**——写盘 + move + commit 会污染真仓库工作树，常驻即每轮测试都制造待提交改动，与 `.session/tmp` 「收尾必须为空」冲突）
- **不覆盖**：S3 的 git 断言段接线（`git ls-files --error-unmatch` → UntrackedArtifact、`git diff --quiet` → ArtifactDirty，§6 不测第 2 条）；演练产物的语义质量（四段校验已保证结构合法）。

#### G02 `npm run check` 测试数增量对账（全仓 glob 覆盖实证）

- **覆盖**：§10.8-7 / PRD §8（迁入测试进 glob）+ 已知风险③
- **来源**：spec R7——「迁入后必须全绿」的前提是迁入的 71 条 + 新增**确实被 `npm run check` 跑到**；check-all.mjs:76 用 `node --test '**/*.test.mjs'` 全仓 glob，理论自动覆盖，但「理论」不算判据（新文件若放错目录 / 命名不匹配，A04 在目录内直跑仍绿、仓门禁却静默没跑它们——最阴的假绿）
- **前置**：迁入完成；记录迁入前 `npm run check` 的 `# pass` 基线值。
- **步骤**：① 跑 `npm run check`，记 `# pass N` 与 `# fail`；② 对账：N = 基线 + 71 + 新增用例数（新增数按本 testcase §1.2 落点表计算）；③ 输出全文中抽 3 个新测试名（B08 的 CoverageMismatch 负例、golden、CLI 各一）`Select-String` 逐字检索。
- **预期**：② 吻合；`# fail` = 0；③ 三名全中。
- **判据**：`# pass N` 与对账值相等（差值 = 0）&& `# fail` = 0 && ③ 命中 3/3。
- **红绿证据**：红 = 增量对不上（71 条被 glob 吞掉 / 新文件漏跑）；绿 = 增量吻合、全绿。
- **对应测试**：验收命令（收尾；与 G01 同批执行；不设常驻——对账依赖「迁入前基线值」这个一次性快照）
- **不覆盖**：A04 的「绿不绿」（A04 管 exit code，G02 管「在不在跑」）；`npm run check` 其余段（sweep / doc-name 等）的自身正确性（归既有检查段，S2 只要求不红）。

#### G03 ArtifactMissing：归档子目录无产物且不在存量白名单

- **覆盖**：§10.8-3 / PRD §5.2 :401 / §4.4 B 表 / §0.3-1 判读口径
- **来源**：spec R3 字面义务（B 表 S2 组逐码 ≥1 反例，无排除条款）——三态判定漏 ArtifactMissing 时，「某轮评审没交观察产物」被静默放过，正是门禁要防的事故形态
- **前置**：三态判定纯函数落地（白名单常量在位）。
- **步骤**：构造清单夹具：子目录 `2026-10-20-0000-no-obs/`（目录名不在白名单、内含 `progress.md` 等**允许类**文件、无任何 `observation-r<N>*.json|md`）→ 调判定函数。
- **预期**：返回 `ArtifactMissing`（带目录名）；**不出** UnclassifiedArtifact（progress.md 属允许文件名类，先钉「允许类不误报」，杂件误报由 G04 反向锁）。
- **判据**：`codes.includes('ArtifactMissing')` && `!codes.includes('UnclassifiedArtifact')`。
- **红绿证据**：红 = 判定写成「有允许类文件 = 已交卷」（缺产物被放过）或白名单匹配写宽（`2026-10-25-1723-*` 前缀匹配 = 任意仿名目录免检，违反「只到精确名」）；绿 = 缺产物即红。
- **对应测试**：`gate-scan.test.mjs`（新文件）
- **不覆盖**：扫描根为空 / 不存在的分支（`ArtifactNamingOff` 与「0 件跳过」，S3 接线侧，§6 不测第 2 条）；函数被 check-all.mjs 调用（S3）。

#### G04 UnclassifiedArtifact：非产物文件且不在允许清单（与缺产物并列）

- **覆盖**：§10.8-3 / PRD §5.2 :402 / §4.4 B 表 / §0.3-1 判读口径
- **来源**：spec R3 字面义务——PRD :402 明写「**与上三态并列，非替代**」：一个目录可以同时缺产物 + 含杂件，两码都要出；判定若写成「有文件就不算缺产物」，G03 全部场景假绿
- **前置**：同 G03。
- **步骤**：两个夹具：① 子目录 `2026-10-20-0000-stray/` 含 `random-notes.md`（非 observation 命名、不在 8 类允许文件名、不在 9 精确路径白名单）→ 判定；② 同夹具再补 `progress.md`（仍无产物）→ 判定。
- **预期**：① codes 含 `UnclassifiedArtifact`；② codes **同时**含 `UnclassifiedArtifact` 与 `ArtifactMissing`（并列语义）。
- **判据**：① `codes.includes('UnclassifiedArtifact')` && ② 两码同时出现（`filter(c => ['ArtifactMissing','UnclassifiedArtifact'].includes(c)).length === 2`）。
- **红绿证据**：红 = 只报一码（杂件被「缺产物」吞掉，或反之）——杂件与缺件互为遮蔽；绿 = 并列。
- **对应测试**：`gate-scan.test.mjs`
- **不覆盖**：`ArtifactNamingOff`（S3）；白名单 9 精确路径的逐文件正例（G05-① 经目录白名单覆盖其宿主，正例方向由「存量目录实测不误报」兜底）。

#### G05 三态绿分支：存量白名单目录 + 允许文件名类 8 类不误报

- **覆盖**：§10.8-3 / PRD §5.2 :400 / :404 / :405 / :406（三态绿分支 + 两张白名单）
- **来源**：spec R3——三态判定不能只会喊红：目录白名单与允许文件名类是「存量不追溯」（Q-A-08 裁定）的载体，误报 = 存量归档每轮门禁都红，门禁公信力归零（红海里没人再看真红）
- **前置**：同 G03；仓库实测存量白名单目录在位（`docs/superpowers/reviews/2026-10-25-1723-s6-eval/`，PRD §5.2 :405 唯一成员）。
- **步骤**：三个夹具：① 目录名 `2026-10-25-1723-s6-eval`（命中目录白名单、无产物）→ 判定；② 目录 `2026-10-20-0000-ok/` 含一对合法 `observation-r1.json|md`（writeObservation 现造）→ 判定；③ 目录 `2026-10-20-0000-ledger/` 含 8 类允许文件名各一（progress / cards / problems / submission / impact-sheet / detective / round-check / delivery-audit，其一放 `cards/` 子层）→ 判定。
- **预期**：① 零码（绿）；② 分派产物态，不出三态红码；③ 零码（允许类全过，含子层）。
- **判据**：① `codes.length === 0` && ② `!codes.includes('ArtifactMissing') && !codes.includes('UnclassifiedArtifact')` && ③ `codes.length === 0`。
- **红绿证据**：红 = 允许文件名类漏一类 / 目录白名单常量抄错（存量归档误红）；或白名单写宽成前缀匹配（G03 已反向锁，本条正例侧再钉）；绿 = 三态绿分支全通。
- **对应测试**：`gate-scan.test.mjs`
- **不覆盖**：白名单「只到精确路径」的收紧方向（G03/G04 反例锁）；产物态目录里的产物内容合法性（四段校验的事，B/C/D/E 组覆盖）。

#### G06 attachments/ 子层边界：一层快照不误报、两层嵌套与根层同名判红

- **覆盖**：§10.8-3 / PRD §5.2 :410（C-15：允许文件名类补 `<次>/attachments/` 子层——只许**一层文件名**、不得再嵌套，且该层文件名**不限 8 类**）/ §4.4 B 表 `UnclassifiedArtifact` / PRD §0.2 C-12
- **来源**：C-12 通道（仓外证据快照进 `<次>/attachments/`）原先被 §5.2 的允许文件名类漏列 → 照 C-12 归档必被判 `UnclassifiedArtifact`（「通道开着、门却锁着」，S2 施工期发现，2026-10-27）；C-15 补列后本条钉住「**通道走通 + 边界不放大**」：只许一层（防无底洞嵌套）、只在 `attachments/` 子层（防豁免泛化到 `<次>/` 根层）、文件名不限 8 类（快照保留原名，否则「快照进仓」还要逐条改名，通道等于虚设）
- **前置**：`tools/observation-check/gate-scan.mjs` 已导出 `ATTACHMENT_RE = /^attachments\/[^/]+$/`（`:8`）且在 `stray` 判定里先判 `attachments/` 前缀（`:30`：`if (f.startsWith('attachments/')) return !ATTACHMENT_RE.test(f);`）；三态判定纯函数与存量白名单常量在位（同 G03）
- **步骤**：调 `scanReviewDir(dirName, files)` 三夹具：① 目录 `2026-10-20-0000-ok`、`files = ['observation-r1.json','observation-r1.md','attachments/niku-detection.md']`（C-12 合规写法：快照保留原名，不在 8 类允许名内）；② 同目录把快照换成 `attachments/a/b.md`（两层嵌套）；③ 同文件名放根层 `files = ['observation-r1.json','niku-detection.md']`
- **预期**：① 零码（通道走通）；② 含 `UnclassifiedArtifact`（只许一层）；③ 含 `UnclassifiedArtifact`（根层不享受 `attachments/` 豁免）
- **判据**：① `codes.length === 0` && ② `codes.includes('UnclassifiedArtifact')` && ③ `codes.includes('UnclassifiedArtifact')`——三条各自独立断言，不合并计数（合并后 ① 与 ②/③ 会互相遮蔽）
- **红绿证据**：红 = 正则写宽成 `/^attachments\//`（两层嵌套也放行 → 归档目录成无底洞）或把豁免扩成「任意 `.md` 免检」（根层同名文件放行）；反向红 = 漏列 attachments 层时 ① 被 G04 同族判红（C-12 通道被自家门禁锁死）；绿 = 三夹具各归其位
- **对应测试**：`gate-scan.test.mjs`「G06 attachments/ 子层（PRD §5.2 C-15）：一层快照不误报，两层嵌套与根层同名判红」（三条断言顺序对应上列 ①/②/③）
- **不覆盖**：`attachments/` 内文件的**内容**合法性（`path:line` 真实性与敏感判据由证据七道管，C 组）；「过程期 `.session/reviews/<次>/attachments/` 临时副本、归档前必须搬入 docs 侧」（C-12 的流程义务，机器不判）；`attachments/` 目录本身为空（空目录不在 `files` 清单内，属 S3 扫描根接线）

### H 组：对抗与边界钉（Q-A-05 闭合 + V-6 两条绿例）

前置总述：本组三件事：① H01 把探索稿 :666 的**原文本版 8 条具名攻击**逐条映射到结构化形态并断言 0 绕过（文本版实测 8/9 被绕，结构化若留口子即回到老路）；② H02 把对抗分母落到**唯一常量**（PRD §0.5 Q-A-05 挂起项的闭合载体，口径见 §0.3-2）；③ H03/H04 用**故意绿**的用例钉 PRD §5.3 行 11/12 的边界（校验器**不得**越权拦「无锚的一致改动」与「语义不支撑」——过度收紧比漏拦更伤：红海里没人看真红）。

#### H01 八条具名攻击的结构化映射矩阵（0 绕过）

- **覆盖**：§10.8-3 / PRD §0.5 Q-A-05 + §4.4 B 表注（对抗用例集）/ 探索稿 :666 具名清单
- **来源**：spec R3——「结构化无绕过」不能只停在探索稿 :668 的一句「0/10」；8 条具名攻击是文本版失败面的具名清单，逐条结构化映射 + 断言，才证明改判根因（猜正则 → 判结构）真的生效
- **前置**：八行映射矩阵登记在 `adversarial.test.mjs` 表驱动数据中（攻击名 / 结构化构造 / 期望码 / 承接测试四列）：

| # | 具名攻击（:666 原名） | 结构化构造 | 期望 |
|---|---|---|---|
| 1 | 代码块藏字段 | items 字段整体缺失（JSON 无「藏」：字段只有存在/缺失两态） | `MissingItems`（B02 承接） |
| 2 | 覆盖度写「无」 | `coverage: '无'`；`coverage.read = '4'`（字符串伪装） | `MissingCoverage` / `InvalidCoverage`（A1 承接） |
| 3 | 列表式补充项 | open 非数组（对象）；open 项 evidence 全空白 | `InvalidFieldType`（A3/A4 承接） |
| 4 | 标题变体 | items id 换未登记变体（k09）；前置字段名拼错（mustHave） | `UnknownItem`（A8）/ `UnknownField`（A12 承接） |
| 5 | 全角竖线 | 字段值含全角「｜」 | **零码** + 渲染后该行 splitRow 列数 = 表头列数（全角竖线是内容不是分隔符——与 D03「ASCII `\|` 须转义」互为姊妹断言：一个证明转义有效，一个证明不转义的字面量不破列） |
| 6 | 结论换说法 | `verdict: 'N/A'`（枚举外换说法） | `UnknownVerdict`（A5 承接） |
| 7 | mustHave 拼错 | requires 字段名 `mustHave` | `UnknownField`（A12 承接） |
| 8 | must 写成字符串 | `must: 'false'` | `InvalidFieldType`（A13 承接） |

- **步骤**：① 表驱动逐行执行构造 → `validateObservation` / `checkPrerequisites`（第 5 行另跑渲染 + splitRow）→ 断言期望；② 计数：期望未中记 bypassed 1；③ 输出 `bypassed 0/8`。
- **预期**：8/8 全中；第 5 行零码且列数不变。
- **判据**：表驱动断言 `bypassed === 0` && 第 5 行 `splitRow(line).length === splitRow(headerLine).length`。
- **红绿证据**：红 = 任一行构造后零码或错码（结构化校验器存在「换说法可绕」的口子——文本版 8/9 被绕的回归）；绿 = 0/8。
- **对应测试**：`adversarial.test.mjs`（增补，表驱动）
- **不覆盖**：第 5 行在「读盘校验」侧的行为（checkRendered 全文比对天然覆盖渲染一致性，不重复设）；9 条里的未具名第 9 条（不进结构化分母，§0.3-2 已裁）。

#### H02 对抗分母唯一口径：常量登记 + 0 绕过计数（Q-A-05 闭合载体）

- **覆盖**：§10.8-3 / PRD §0.5 Q-A-05（分母漂移挂起项）/ §0.3-2 判读口径
- **来源**：spec R3——Q-A-05 的病根是分母写在两处（探索稿 :666 记 9 条、:668 记 0/10），改判后必须**一个取数源**：分母 = `adversarial.test.mjs` 顶部常量 `ATTACK_VECTORS.length`，别处只许引用不许复写
- **前置**：常量落地，每条向量四字段：`id` / `攻击名` / `承接测试名` / `期望码`。首版构成（§0.3-2）：8 具名（H01 矩阵）+ 13 迁入（A1-A13）+ 9 新增（C01 敏感路径、C04 敏感内容、C07 结构行、B07 重复 id、B08-B12 覆盖伪装五形态）= **30**。
- **步骤**：① 断言常量在位且每条 id 唯一；② 逐条断言承接测试名在 `tools/observation-check/*.test.mjs` 可检索（登记了但没测 = 空转，分母虚胖）；③ 全分母构造执行一遍，计数 bypassed；④ 断言 `ATTACK_VECTORS.length === 30`（首版恰等，构成拆解同注释）。
- **预期**：四条全过；输出 `bypassed 0/30`。
- **判据**：① `ATTACK_VECTORS` 存在且 id 无重复 && ② 承接测试逐条检索命中（空转数 = 0）&& ③ `bypassed === 0` && ④ `length === 30`。
- **红绿证据**：红 = 常量缺位（分母回到「两处记载」的老路，Q-A-05 不闭合）或登记空转（分母虚胖——「0/30 绕过」里 5 条没测试）；绿 = 唯一取数源 + 分母全实。
- **对应测试**：`adversarial.test.mjs`（常量 + 自洽断言）
- **不覆盖**：各承接用例自身的测试质量（各用例自己的判据管）；分母**变值**流程（缩短 / 扩长 = 判据级口径变更 → R8 同批回扫 PRD §0.5 Q-A-05 行与本文件 §0.3-2，不得静默缩分母——30 → 27 之类必须带 diff 处置记录）。

#### H03 json+md 一起改成一致 → 校验过（钉「本机无锚」边界）

- **覆盖**：PRD §5.3 行 11（V-6）+ R-2（合谋改已接受）/ 探索稿 §5.4 R-2
- **来源**：spec R3 范围内**最容易被「修过头」的边界**：S2 本地无可信锚，json+md 同改一致是**故意不拦**（拦不了：没有基线 hash 可对），靠 git commit diff 让人看见；若后续有人给校验器加「锚点」逻辑，误报全归 S2
- **前置**：writeObservation 现造合法产物于夹具目录。
- **步骤**：① 读 json，改一条 verdict（miss→na，补 reason）并同步改 coverage 对账数字；② 用新 json 重渲染，**覆盖写回 md**（= 攻击者「同改一致」的等价操作）；③ 跑四段校验（validateObservation + checkRendered）。
- **预期**：零错误码、`checkRendered(...).ok === true`——**「拦不住」被钉成机器判**：这是边界证明，不是缺陷。
- **判据**：`errors.length === 0 && ok === true`；若日后本用例翻红，唯一合法解释 = S2 加了锚点机制（越权），须回议会改判 V-6。
- **红绿证据**：红 = 校验器自作聪明加锚（误报正常的一致改动——红海效应）；绿 = 边界钉在位。
- **对应测试**：`adversarial.test.mjs`
- **不覆盖**：PRD §5.3 行 13（绕过入口手写 json——同一「无锚」面，行 13 与行 11 在机器行为上不可区分，本用例一并钉住，不重复设）。

#### H04 quote 真实但不支撑结论 → 校验过（语义归审计人）

- **覆盖**：PRD §5.3 行 12（V-6）/ R-3（语义匹配走 `check:'manual'` + 独立方抽查）
- **来源**：spec R3——证据七道全部是**结构**判据（路径在、行在、quote 在、不敏感）；「引用是否支撑结论」是语义判断，机器无此能力，硬做 = 词表猜测（回到文本版正则猜的老路，8/9 被绕的教训）
- **前置**：mkdtemp 自建证据件（内容两行：「第 7 行：角色设定」「第 8 行：边界声明」）。
- **步骤**：① 构造 doc：某条判 `hit`，evidence 指向自建件第 7 行、quote 逐字真实，但该行内容与「hit 结论」毫无关系（例如结论说「已记录自省」，引用行是「角色设定」）；② 跑四段校验（含读盘校验）。
- **预期**：零错误码——七道结构判据全过（路径真、行真、quote 真、长度够、不敏感），语义不归机器。
- **判据**：`errors.length === 0`；同款「翻红即越权」条款：若翻红，唯一合法解释 = 校验器加了语义判定（V-6 边界被破，回议会）。
- **红绿证据**：红 = 校验器做语义猜测（假阳性风暴：每条真证据都可能「看起来不相关」）；绿 = 结构/语义分界钉死。
- **对应测试**：`adversarial.test.mjs`
- **不覆盖**：语义质量的兜底机制（`check:'manual'` 比例、独立方抽查——归议会流程与审计人，机器不越权）。

### I 组：A 表并入 8 码冒烟（render.mjs 已实现零测试面）

前置总述：PRD §4.4 A 表注 2「S2 收进时并入本表」的 8 个码在草稿 `render.mjs（草稿区 行 27）/:31/:33/:42-48` 已实现（`bad(code, …)` throw），但**零测试**（6 个测试文件无一 import render.mjs——§0.2 #16）。冒烟级义务 = 每码 ≥1 条断言「会抛对码」；不锁实现细节（merge 输出结构、overrides[] 形态归 S4 渲染层，§6 不测第 3 条）。**噪声声明**：`render.mjs`（草稿区 行 127） 有模块尾 demo 循环（`for (const seat of SEATS)`，import 即执行）——冒烟测试以 import 该模块为前置，plan 须先加 main 守卫或剥除 demo（§8 建议 G-12 处置），否则测试输出混入 demo 噪声。

#### I01 合并纪律三码冒烟（DuplicateStatement / OverrideWithoutReason / PointlessOverride）

- **覆盖**：§10.8-3（A 表并入组）/ PRD §4.4 A 表注 2 / §0.2 #16 / 探索稿 §3.3 三条配套
- **来源**：spec R3——「同编号覆盖、覆盖必须带 reason、覆盖必须真有差异」三条合并纪律是卡面数据防漂移的地基；零测试 = 改一个 throw 的码名没人红
- **前置**：render.mjs 迁入且可安全 import（见前置总述噪声声明）；data.mjs 夹具在位（SEATS / SHARED_ACTIONS 形态按草稿）。
- **步骤**：表驱动三构造（走 `personalActions(seat)` 入口）：① `seat.own` 两条同 id → `DuplicateStatement`；② own 条目 id 命中 shared 且无 `reason` → `OverrideWithoutReason`；③ own 条目 id 命中 shared、带 reason、但 trigger/text/criterion/landing 与 base 全同 → `PointlessOverride`。
- **预期**：三构造各抛出，错误对象含对应 code。
- **判据**：`assert.throws(() => personalActions(seat), /DuplicateStatement/)`（三形态 ×3，code 逐字）。
- **红绿证据**：红 = 8 码零测试现状（任何人改码名 / 删 bad() 调用均无红）；绿 = 三码冒烟在位。
- **对应测试**：`render.test.mjs`（新文件）
- **不覆盖**：merge 正常路径输出（actions/overrides 结构——S4）；`SharedUpgradeAffectsOverrides`（探索稿 §3.3 补充项，非 8 码之一）。

#### I02 必填与登记五码冒烟（MissingTrigger / MissingCriterion / MissingLanding / MissingCriterionImpl / UnknownLanding）

- **覆盖**：§10.8-3（A 表并入组）/ PRD §4.4 A 表注 2 + C-13（LANDING_VARS 封闭清单）/ §0.2 #16
- **来源**：spec R3——四要素 + 封闭登记表是「每条可判」的结构前提（PRD C-13：落点枚举封闭，`UnboundLanding` 才有判据）；五码零测试 = 判据登记表（PREDICATES/LANDINGS）被清空也没人红
- **前置**：同 I01。
- **步骤**：表驱动五构造：① action 缺 `trigger` → `MissingTrigger`；② 缺 `criterion` → `MissingCriterion`；③ 缺 `landing` → `MissingLanding`；④ `criterion` 不在 PREDICATES 登记（拼错名）→ `MissingCriterionImpl`；⑤ `landing` 不在 LANDINGS（表外值）→ `UnknownLanding`。五构造走 `labelOf` 消费路径（即 `renderCard` / `renderReadme` 任一入口）触发。
- **预期**：五构造各抛对应 code。
- **判据**：`assert.throws` 五形态 ×5（code 逐字；④⑤ 断言错误信息含未登记的值——`criterion=xxx` / `landing=xxx`，排障可定位）。
- **红绿证据**：红 = 零测试现状（登记表删空不红）；绿 = 五码冒烟在位。
- **对应测试**：`render.test.mjs`
- **不覆盖**：`MissingObject`（探索稿 §3.2 拟义，非 A 表注 2 八码之一——若 plan 裁决收进，属新增判据须补测试，不冒烟凑数）；PREDICATES / LANDINGS 的内容正确性（那是数据层，S4 全席重生成的事）。

## 3 负例与边界汇总

**数量硬门**：73 条 = 正例 26 / 负例 41 / 边界 6；**负例 + 边界 = 47 ≥ 正例 26**（spec-testcase-gate 判据 3）。类型逐条可复算：`Select-String -Path <本文件> -Pattern '^\| [A-I]\d{2} \|.*\| 负 \|'` → 41；`…\| 边界 \|` → 6；`…\| 正 \|` → 26。

**④ 段增补（§10，2026-10-27，不计入上列 73）**：11 条 = 负 5 / 边界 5 / 现状登记 1（X11 无测试，不计类型）；下表只是上列 73 条中负例与边界的汇总，§10 的增补行见 §10 各条自述。含增补后：负 + 边界 = 47 + 10 = **57 ≥ 正 26**，硬门仍过。

判读说明：**负例** = 坏构造必须出码或拒行为（0 码 = 假绿 = 本 testcase 红线）；**边界** = 合法但极易被误判的形态（含两条「故意绿」的边界钉 H03/H04——它们翻红才是缺陷）。

| ID | 类型 | 打的失败面（一句话） | 为什么容易漏（机制） | 期望 |
|---|---|---|---|---|
| B01 | 负 | doc 非对象（null / 数组 / 字符串） | 最外层类型守卫常被「后面反正会炸」跳过 | 三形态全报 `InvalidDocument` |
| B02 | 负 | items 缺失 / `[]` / 字符串 | `[]` 是合法数组——「空轮」与「没交卷」混淆 | 三形态全报 `MissingItems` |
| B03 | 负 | open 项缺 object / impact / suggestion | 逐字段校验只在「有 open」时才走，漏 = 补项残缺也过 | 逐字段报 `MissingOpenField` |
| B04 | 负 | na 无 reason | na 是「没意见」，最易被当成无需理由 | 报 `MissingReason` |
| B05 | 负 | miss 无 reason | **当前实现只判 na（checks.mjs（草稿区 行 50-52））——假绿在位（G-1）** | 报 `MissingReason`（迁入即红，红色驱动实现） |
| B06 | 负 | closure 非法值 | `null` 合法、非 null 非枚举易漏进 truthy 判断 | 报 `UnknownClosure` |
| B07 | 负 | items.id 重复 | 同 id 两判 = 一项两票，七条对账其余全绿 | 报 `DuplicateItem` |
| B08 | 负 | items.length ≠ coverage.read | 数字与集合脱钩 = C-02 假绿本体 | 报 `CoverageMismatch` |
| B09 | 负 | total ≠ registeredIds.length | 分母错则一切对账失真 | 报 `CoverageMismatch` |
| B10 | 负 | read + skipped ≠ total | 三项恒等式缺一环 | 报 `CoverageMismatch` |
| B11 | 负 | skipped 含未登记 id | 「跳过」登记外项 = 洗白未判 | 报 `CoverageMismatch` |
| B12 | 负 | skipped 与 items 相交 | 又判又跳 = 双票 | 报 `CoverageMismatch` |
| B13 | 负 | read > total | 倒挂数字类型合法、语义倒挂（三类不出码之 2） | 报 `InvalidCoverage` |
| B15 | 负 | 不传 registeredIds | 调用方忘传 → 对账无分母静默通过（`checks.mjs`（草稿区 行 28） 默认 `[]`） | 报 `UnregisteredIdsMissing` |
| B16 | 负 | hit 无 evidence；evidence 非对象 | 缺失与类型错两态混报排障瞎；现实现只报 InvalidFieldType（0.2 #5） | 两态分界：`MissingEvidence` / `InvalidFieldType` |
| B17 | 负 | check:'ai' 条目无 -a/-b 成对 | 双实例对账仅 AI 条目触发，低频路径 | 报 `InstanceMissing` |
| B19 | 负 | registeredIds 分母被删一个 id（调用点自拼） | 分母与 `coverage.total` 脱钩 = 「总分母」对账判据等于没有（单源清单未钉死） | 报 `CoverageMismatch` |
| B20 | 负 | skipped 内 id 重复（`['k03','k03']`） | 数组长度虚增让 `read + skipped.length === total`「看起来平」，去重后集合少一个 id → 有 id 既未判也未跳（C-16） | 报 `CoverageMismatch` 且 message 含「重复」 |
| C01 | 负 | 证据路径命中敏感名单（逐类） | .env / 密钥 / 凭据路径作证据 = 泄密通道，第 6 道零实现（G-5） | 逐类全报 `EvidenceSensitivePath` |
| C02 | 负 | 反斜杠拆段 `dir\.env` 绕朴素匹配 | 字符串写法变体绕过 includes 语义 | 报 `EvidenceSensitivePath` |
| C04 | 负 | quote 含 AKIA / ghp_ / BEGIN PRIVATE KEY / 带凭据 URL | 内容侧四形态，第 7 道零实现（G-5） | 逐形态报 `EvidenceQuoteSensitive` |
| C06 | 负 | md 不可读（目录占位） | IO 异常冒泡 = 崩溃不是码（artifact.mjs（草稿区 行 22-38） 无 try-catch） | 收敛报 `MdUnreadable` |
| C07 | 负 | 纯结构行（`\| --- \| …`）作证据 | 13 字过长度下限、quote 也真——长度道命中道全过（G-8 已闭合） | 红（`EvidenceStructuralRow`，PRD :355） |
| C08 | 负 | 进程 cwd 不在任何 git 仓库内（根解析失败） | 取不到根时最省事的兜底就是 `process.cwd()` / 入参——一兜底，「任意目录跑」都合法了 | 报 `RepoRootUnresolved`（fail-closed），不得退化为 `EvidenceNotFound` / `ok:true` |
| D07 | 负 | golden expected.md 手改一字 | golden 无反例 = 摆设：改实现没人发现（已知风险①） | 报 `RenderMismatch`（带行号） |
| E02 | 负 | 路径 r5 + 内容 round=3 | 文件名与内容脱钩 | 报 `RoundMismatch` |
| E03 | 负 | jsonDir = tools/ | 写盘越界 = 覆盖源码通道，目的地判据零实现（G-3） | `ArtifactPathOutside` + 零写盘 |
| E04 | 负 | jsonDir = 归档目录 | 归档只读（C-04），直写 = 绕开迁移状态机 | `ArtifactPathOutside` + 零写盘 |
| E06 | 负 | md 目标被目录占位 → rename 失败 | 半写态：json 落盘 md 没落（G-6）；tmp 残留 = 半写证据 | `WriteFailed` + json 不落盘 + 零 tmp |
| E07 | 负 | jsonDir 不存在 / 指向文件 | 目标错与写失败混报（G-9） | `InvalidWriteTarget` + 零写盘 |
| E09 | 负 | CLI 对双错件 | 首错即停 = 复核人修一个跑一轮 | exit 1 + 两码并列 |
| E10 | 负 | CLI 对不存在路径 | 手滑路径崩溃 = 随机退出码 | exit 1 + `JsonNotFound` |
| E11 | 负 | 同名 md 缺失 | 「跳过 md」是自废武功的旁路（PRD 明令禁） | `MdMissing` + 无跳过开关 |
| E13 | 负 | rewrite 写非过程目录 | rewrite 旁路「归档只读」（E04 姊妹防线） | `ArtifactPathOutside` + md hash 不变 |
| E14 | 负 | 改写归档件时顺手回写归档目录 | 「归档只读」被 rewrite 旁路 = 历史记录被无声重写（迁移状态机被跳过） | 归档目录两文件 sha256 不变 + `rewrite` exit 0 |
| F03 | 负 | 改批时删对账负例换绿 | 全绿但判别力缩水——A04 数不出「删的恰好是负例」 | 计数断言：五负例存续 |
| G03 | 负 | 白名单外目录无产物 | 「没交产物」被静默 = 门禁失效 | `ArtifactMissing`、不出 `UnclassifiedArtifact` |
| G04 | 负 | 杂件且不在允许清单 | 两码互斥遮蔽：有文件 ≠ 已交卷 | `UnclassifiedArtifact`；与缺产物并列 |
| H01 | 负 | 8 条具名攻击结构化重放 | 文本版 8/9 被绕的回归口子 | `bypassed === 0`（8/8 中） |
| I01 | 负 | 合并纪律三构造（同 id / 无 reason / 无差异） | 覆盖无理由、无差异 = 变体漂移地基，零测试（G-10） | 三码逐字抛出 |
| I02 | 负 | 四要素缺失 × 登记表外值 | 登记表清空无红 = 可判性塌方（G-10） | 五码逐字抛出（含定位值） |
| A06 | 边界 | 临时移走 `agents/detective-observer.md` 后全套仍绿 | 「夹具自建」不停留在声明——10 条仓库依赖假红（0.1）的反面证明 | 全绿 + finally 恢复 |
| D03 | 边界 | 字段含 ASCII `\|` 渲染后列数 = 表头 | 朴素 split 劈列 = 下游来源不可解析（三类不出码之 3） | splitRow 列数恰等 |
| H02 | 边界 | 分母常量自洽（30 全实 + 0 空转） | 分母两处记载必漂移——Q-A-05 本体 | 唯一取数源 + `bypassed 0/30` |
| H03 | 边界 | json+md 同改一致 → 校验**过** | 无锚面被「修过头」= 正常一致改动误报 | 零错误码（翻红即越权） |
| H04 | 边界 | quote 真实但不支撑结论 → 校验**过** | 语义判定 = 词表猜测回归（8/9 被绕的教训） | 零错误码（翻红即越权） |
| G06 | 边界 | `attachments/` 子层嵌套两层 / 同名文件放 `<次>/` 根层 | 豁免写宽 = 无底洞（任意嵌套免检）或泛化到根层（任何文件免检） | 一层零码；两层与根层均报 `UnclassifiedArtifact` |

## 4 回归清单（改什么 → 必跑哪些）

执行口径：凡触发下表左列的改动，右列用例**全量重跑**（不是抽查）；`npm run check` 作为总兜底（A07）。

| 改动对象 | 必跑 | 为什么 |
|---|---|---|
| `checks.mjs`（validateObservation：结构 + 七条对账） | B 组全量 + F03 | 结构与对账判据全在这层；F03 防「改实现顺手删负例」 |
| `checks.mjs`（renderObservation / checkRendered） | D01-D08 + F02 + D05-D07（golden） | 渲染一字变 → golden 必红（已知风险①的防回归主闸） |
| `evidence.mjs` | C01-C08 + H01 第 2/5 行 | 证据七道 + 根解析 fail-closed；adversarial A10/A11 的承接面 |
| `artifact.mjs`（writeObservation / atomicWrite） | E01-E07 + B17/B18 + C06 | 写盘链四纪律 + 双实例 + md 读收敛 |
| `cli.mjs` | E08-E14 | CLI 六态（正例 / 全报 / 缺件 / rewrite 边界 / 归档件改写路径） |
| `render.mjs`（personalActions / labelOf） | I01/I02 + D 组全量 | 数据源渲染动一字，产物投影全变 |
| `data.mjs`（SEATS / PREDICATES / LANDINGS） | I01/I02 | 登记表内容变更直接改五码触发面 |
| `tools/execution-matrix/markdown-rows.mjs`（splitRow，仓级单源） | D03/D04 + H01 第 5 行 | 列切口径一动，转义断言与全角竖线断言同批红 |
| 三态判定白名单常量（目录白名单 / 8 类允许名 / 9 精确路径 / `attachments/` 层） | G03/G04/G05/G06 | 白名单一改，三态正反两侧都要重证 |
| registeredIds 供给方式 / 常量 | B15 + B17/B18 + F01 | 分母一变，对账与夹具同批 |
| 渲染器升级（含历史归档 md 兼容） | D05-D07 + §8-2（R-7 横幅同批） | 已知风险①：升级使历史 md 全红——golden 抓回归、横幅管存量声明 |
| 新增对抗向量 | H02（分母常量 + 0 空转）+ R8 回扫 | 分母变值 = 判据级口径变更，登记与回扫同批 |
| 探索稿 :686 / V-8 指针类改动 | F04 | schema 单源 |
| `scripts/check-all.mjs`（glob / 接线——S3 边界，S2 侧只做不红证明） | G02 + A07 | 覆盖证明依赖 glob 形态 |
| 删改任一 `*.test.mjs` | A04 + F03 + H02-② | 意图存续三联防：总数 / 对账负例计数 / 承接测试检索 |

## 5 验收命令清单（无「纯手动验证」一档）

本 testcase **没有纯手动项**：每条判据都是「命令 + 退出码 + 关键输出」。但有 8 条因「一次性时点事实 / 全局态 / 基线快照依赖 / 仓外路径依赖」**不设常驻测试**（常驻 = 进 node --test 文件随 `npm run check` 跑），定义为收尾验收命令——在 plan 的收尾任务里执行并把输出贴进 gate-record。

| ID | 为何非常驻 | 命令与判据 |
|---|---|---|
| A01 | 零提交裁定下它退化为「Task 2 时点快照」——时点后该目录已由后续任务新增 12 个文件，常驻必假红 | 见 §2 A01：迁入时点 `git status --porcelain tools/observation-check` 恰 11 行全 `??`、零 M/D/R（取值 = 时点输出，已记账本 / report） |
| A02 | 常驻需读仓外草稿区目录（`C:\Users\HuangChunhua\.retro-skills\observation-check-draft\`），违反「夹具一律仓内自建」 | `node:crypto` 对草稿区 11 原件重算 sha256 → 11 条全等账本 §迁入清单 |
| A03 | 同上（依赖仓外草稿区） | PRD §0.4 原命令 → 888；不得改按当前工作区文件计数 |
| A04 | 总数断言常驻化会随每次新增用例变值（自证无意义）；要审的是「**迁入那一刻 71 条意图没丢**」这个时点事实 | `cd tools\observation-check; node --test *.test.mjs` → exit 0 且 `# pass ≥ 71`；零提交口径下存证 = 账本 §迁入清单 + 当时的工作区快照（`git status --porcelain`），无提交可 diff |
| A06 | 移走 `agents/` 文件是全局态，常驻会与并发测试互踩 | 临时移 `agents\detective-observer.md` → 全套仍绿 → **finally 恢复**；断言恢复后文件 hash 原值 |
| A07 | `npm run check` 套内自跑 = 递归；时长 23.9s 不宜每轮 | 仓库根 `npm run check` → exit 0（迁入后、未归档态；含 expected.md 等新文件不触发其它检查段） |
| G01 | 写盘 + move + commit 污染真工作树，常驻即每轮制造待提交改动 | §2 G01 命令序列 → ④ `npm run check` exit 0 && ⑤ `git status --porcelain -- <演练目录>` 输出为空 |
| G02 | 对账依赖「迁入前 `# pass` 基线值」这个一次性快照 | `npm run check` 记 `# pass N` → N = 基线 + 71 + 新增；`# fail` = 0；抽 3 个新测试名 `Select-String` 全中 |

## 6 不测清单（带理由与兜底；「不测」≠「不管」）

| # | 不测项 | 理由（一句话） | 兜底（谁管） |
|---|---|---|---|
| 1 | S1 模型层错误码（模型 / 场景 / 信号 / 前置层校验，PRD §8 S1 行） | **零实现**——对空气测不出任何东西；S1 尚未排期 | S1 spec 自带 testcase（spec-testcase-gate 同规则约束 S1 的 testcase 编写者） |
| 2 | S3 门禁接入（check-all.mjs 增段；git 断言 `UntrackedArtifact` :434 / `ArtifactDirty` :431；零产物分支 `ArtifactNamingOff` + 「0 件跳过」:408；15 卡豁免窗口 :410） | 接线对象（扫描根接线、git 子进程断言）归 S3 spec；S2 只义务「判定函数 + 不红」 | 三态判定**纯函数**已钉在 S2（G03-G06）；接线测试归 S3 testcase；G02/A07 证「接入后不红」 |
| 3 | S4 渲染层（三投影 / 全席重生成 / merge 输出 `overrides[]` 结构 / PREDICATES-LANDINGS **内容**正确性） | PRD §8 S4 行未落地，渲染层重构未排期 | I01/I02 冒烟锁「会抛对码」；数据正确性归 S4 全席重生成的验收 |
| 4 | 探索稿其余 V-8 指针（`:236` / `:394` / `:400-401` / `:746`，PRD §9 V-8 :559） | 锚点 5（PRD :527）只义务 `:686` 一处；四处是 V-8 的定稿动作，判据 PRD 已定（manual + `Select-String` 对照） | V-8 定稿批次（S4 spec / 议会收口）执行并自证；F04 已把 S2 义务钉死 |
| 5 | Windows 软链 / 越权实盘构造（`EvidencePathOutside` 的逃逸判据含软链语义） | Windows 建软链需开发者模式 / 管理员，测试环境不稳定（本仓 Node ≥22 无需提权可建 junction，但 junction 语义 ≠ symlink，构造即分叉） | 判定面已锁：路径白名单正例（仓内真路径）+ 出仓路径反例（C 组承接保留用例）；「唯一 root + 白名单」机制本身（PRD C-03）是语义保证 |
| 6 | 语义判定（quote 是否**支撑**结论、verdict 是否如实、reason 是否真话） | 机器无此能力——硬做 = 词表猜测，回到文本版 8/9 被绕的老路（H04 已把「故意不拦」钉成机器判） | PRD R-3：`check:'manual'` + 独立方抽查（比例写入 spec，归议会流程与审计人）；翻红即越权条款反向拦截「偷偷加语义判定」 |
| 7 | 71 条原测试**逐名**比对 | 锚点 2 的判据是「总数 ≥ 71 + 全绿 + agents 零引用 + **意图不删**」，不是「逐名相等」——逐名锁死 = 禁止合法重构（改名 / 合并 / 表驱动化全是本 testcase 明确鼓励的形态） | 意图存续三层联防：F03（对账负例计数）+ H02-②（承接测试检索）+ A04（总数）+ git diff 人审 |

## 7 缺口与判别力水位

### 7.1 编写者独立发现的盲点登记（G-1 ～ G-13）

> 来源：从失败面倒推——逐行比 PRD 判据与草稿实现 / 逐条跑取数命令（0.1 实测）后登记。13 条全部已有对位处置，无一悬空。

| # | 盲点（一句话 + 证据位置） | 对位处置 |
|---|---|---|
| G-1 | miss 无 reason 假绿——`checks.mjs`（草稿区 行 50-52） 只判 na 分支 | B05（迁入即红，红色驱动实现） |
| G-2 | hit 行渲染 `[object Object]`——`checks.mjs`（草稿区 行 128-129）；既有测试只断言「命中」两字在，从未看第三列 | D01（**golden 前必须修**——否则 expected.md 冻结的就是 `[object Object]`） |
| G-3 | spec §10.2 曾称「已实现」与草稿现状不符（写盘入口签名 / 目的地判据，0.2 #10） | **已解决 / 保留为观察**（§8-1）：spec v2 已改「骨架在位 + 判据面未实现」并带 `path:line`（`spec:34` / `spec:36`）；用例侧按 PRD 判据测，不受 spec 声明影响 |
| G-4 | 七条覆盖对账只实现 1 条（`checks.mjs`（草稿区 行 47）） | B07-B12 + F01/F03（夹具改批联防） |
| G-5 | 证据第 6/7 道（敏感路径 / 敏感内容）零实现（`evidence.mjs` 1-5 道已实现） | C01-C05 |
| G-6 | atomicWrite 半写态——`artifact.mjs`（草稿区 行 53-54） 两文件各自 tmp+rename，一成一败即脏产物；tmp 残留无清理断言 | E06（全成功再 rename + 零 tmp 残留） |
| G-7 | R-7 版本横幅（`<!-- observation-md v1 -->`）不在 S2 出口判据与 spec R4 内——渲染器升级时存量归档 md 无版本声明（0.2 #15） | §8-2（同批建议）+ §4 回归清单「渲染器升级」行 |
| G-8 | 纯结构行判据 PRD 未给专属码名（0.2 #7）——「有判据无码名」= 测试断言写不出唯一锚 | **已闭合（2026-10-27）**：B 表登记 `EvidenceStructuralRow`（PRD :355）+ 实现（`tools/observation-check/evidence.mjs:102-103`）+ C07 逐字断言；见 §8-5 状态行 |
| G-9 | InvalidWriteTarget 只有码名无细分判据（0.2 #13） | E07 采设计判据（目标非法 vs 写失败分界）+ plan 落地改口径须回扫本条 |
| G-10 | A 表并入 8 码已实现零测试（0.2 #16） | I01/I02 冒烟 |
| G-11 | ArtifactMissing / UnclassifiedArtifact 的 S2/S3 归属歧义（spec R3 字面 vs PRD F-17/F-19） | §0.3-1 判读口径（按字面义务覆盖）+ G03/G04 + **移交条款**（挪 S3 须回议会改判，不得静默缩小） |
| G-12 | `render.mjs`（草稿区 行 127） 模块尾 demo 循环——import 即执行，测试输出混入噪声 | I 组前置总述 + §8-3（main 守卫建议） |
| G-13 | root 可传参违禁——PRD C-03 最小化四禁之一（root 唯一来源 = git 顶层），草稿 `evidence.mjs` / `artifact.mjs` 全暴露 root 参数（0.2 #11） | §1.2 夹具约定（签名收缩 + 夹具改仓库内自建）+ E 组全组以新签名为对象 |

### 7.2 判别力水位（诚实声明——本 testcase 拦不住什么）

| # | 水位声明 | 联防 |
|---|---|---|
| 1 | **「单删负例」机器拦不全**：A04 拦批量删（总数跌破 71）、F03 拦「删对账负例」、H02-② 拦「删承接测试」；但**其它组的单条负例被删**机器无判据 | git diff 人审 + §4 回归清单；这是三层联防，不是全防 |
| 2 | **迁入即红的负例**（B05 / B16 / C01-C04 / C06 / C07 / D01 / E03-E07 / I 组）：本 testcase 的负例对象是 PRD 判据（含未实现面，0.2 表），实现落地前跑 = 红，**这是设计意图**（红色驱动），不是缺陷 | plan 任务排序必须「实现 → 夹具改批 → 全绿验收」；不能先跑测试再实现 |
| 3 | **rewrite 对假证据件的行为未裁**：「先校验再拒」vs「直接重渲染」plan 定（E12 不覆盖条款）；若裁决「必须先校验」 | 回扫 E12 加断言——本条是已登记的回扫义务，不是悬空 |
| 4 | **C07 码名已定**（G-8 已闭合，2026-10-27：`EvidenceStructuralRow`，PRD :355）：残余水位 = 若有人把结构行判据并回 `EvidenceQuoteTooShort` 或另起码名，C07 立刻红（这正是要的） | 码名属命名类判据级口径——变更须 R8 同批回扫 PRD §4.3 / §4.4 + 本文件 C07 / §1.1 / §3-表；§8-5 已记录登记证据 |
| 5 | **验收命令类的判别力依赖收尾真的跑**：A04 / A06 / A07 / G01 / G02 不进常驻——不跑 = 没有 | 执行义务落 plan 收尾任务 + 输出贴 gate-record（「核了什么」列 = 命令输出首行） |

## 8 给开发（plan / 施工）的建议

> 六条全部带位置 / 风险 / 改法 / 取舍 / 验收 / 优先级（8-1 已由 spec v2 修订解决，改为「已解决 / 保留为观察」并保留下次回滚判据；8-5 已落地，见其状态行）。**本 testcase 不因建议未采纳而放宽判据**——除 §8-5（C07 断言定名的字面前置，已落地）外，其余建议不落地时对应用例按现有判据跑，红 = 如实红。

### 8-1 spec §10.2「已实现」声明与草稿现状不符 → 两态标注【已解决 / 保留为观察】

- **状态**：**已解决**（2026-10-27 spec v2 修订落地）。证据：spec §10.2「四段校验链」段现写「**骨架在位**＋**判据面未实现**」并逐项带草稿 `path:line`（`docs/superpowers/specs/2026-10-27-s2-observation-check-design.md:34`，逐项行号见该处正文）；同段「**两态标注**」原文 = 上列 `path:line` 只证明「函数骨架在」、不证明「判据已实现」，任何「已实现」只允许随 `path:line` 出现并注明未实现面。「唯一写盘入口」段同理（`同文件:36`：骨架在位 + 现状签名 `(doc, { jsonPath, mdPath, registeredIds, root })` 与目标签名 `(doc, { jsonDir, registeredIds })` 逐条列四项差距，含「**rename 顺序 md 先、json 后**」——E06 前置引用此条）。本条不再复述草稿文件的具名行号，避免与 spec 两处维护。
- **保留为观察**：本条不再是进 plan 前的阻塞项，也不再占 P0 位；保留理由 = 若后续有人把 §10.2「骨架在位 + 判据面未实现」改回「已实现」且不带 `path:line`，本条即为回滚判据。
- **观察验收**：`Select-String -Path docs\superpowers\specs\2026-10-27-s2-observation-check-design.md -Pattern '已实现'` 的命中处逐条带 `path:line` 与未实现面说明；`node scripts/scope-sweep.mjs --check` exit 0。
- **优先级**：已解决（降为观察项）。

### 8-2 R-7 版本横幅同批落地（`<!-- observation-md v1 -->`）【P1】

- **位置**：`renderObservation` 输出首行（PRD §5.4 R-7；G-7）。
- **风险**：渲染器升级（已知风险①）时存量归档 md 无版本声明——新校验器对旧 md 全红，复核人分不清「产物坏了」还是「渲染器变了」；事后补横幅 = 重写全部存量 md。
- **改法**：渲染首行加横幅，`checkRendered` 把横幅纳入渲染比对；同批改 golden `expected.md`。
- **取舍**：否掉「横幅进 json」——md 是投影，版本声明归投影层，证据载体不该带渲染版本；否掉「S4 再做」——S2 是渲染器首次进仓，晚一拍 = 第一批归档件就没版本。
- **验收**：D05-D07 golden 含横幅；渲染输出第一行逐字 = 横幅。
- **优先级**：P1（不在 S2 出口判据内，但同批成本最低、事后成本最高）。

### 8-3 render.mjs 模块尾 demo 循环剥除（G-12）【P1】

- **位置**：`render.mjs`（草稿区 行 127）（`for (const seat of SEATS)`，import 即执行）。
- **风险**：任何 import render.mjs 的测试 / 工具都执行 demo（console 输出，演进后可能写盘）——I01/I02 冒烟测试输出混噪声，测试间互相污染的种子。
- **改法**：**剥除** demo（或加 `import.meta.url === pathToFileURL(process.argv[1]).href` main 守卫）；推荐剥除——demo 的使命在草稿期已终结。
- **取舍**：否掉「保留 demo + 守卫」——迁入即定稿件，死路径留着 = 下次体检的扣分项；剥除发生在**改造批**（零提交口径下即 Task 3-12 的就地改写），不在迁入时点，故不影响 A03（判据对象 = **草稿区 11 原件**，888 为草稿基线），不算原样性破坏。
- **验收**：`node -e "import('./render.mjs')"` 零输出零写盘；I01/I02 正常跑。
- **优先级**：P1。

### 8-4 A 表并入 8 码进 PRD 登记（G-10 的 spec / PRD 侧动作）【P1】

- **位置**：PRD §4.4 A 表（注 2「S2 收进时并入本表」）。
- **风险**：8 码不并入 = 游离码——A / B 表是码的唯一登记处，游离码下次审计数不出来；I01/I02 测的码在 PRD 无行号锚，覆盖核对表（§1.1）指不回锚点。
- **改法**：S2 施工批次把 8 码并入 A 表（每码一行判据）；并入属「判据级口径」变更 → **R8 同批回扫**（PRD §4.4 / 本文件 §1.1 对应行）。
- **验收**：A 表逐码有行；`node scripts/scope-sweep.mjs --check` exit 0。
- **优先级**：P1。

### 8-5 C07 码名登记 + R8 回扫（G-8）【已落地 2026-10-27】

- **状态**：**已落地（2026-10-27）**。证据三条：① PRD §4.4 B 表登记 `EvidenceStructuralRow`（`docs/prd/20261026205821-agent-card-contract.md:355`）；② 实现 `tools/observation-check/evidence.mjs:102-103` 命中即返回该码；③ `evidence.test.mjs` 的 C07 用例按该码断言，本文件 C07 前置 / 判据 / §1 覆盖总表 / §3 表 / §1.1 对位表已全部改为定名。R8 回扫的**退出码义务**归实现批（`node scripts/scope-sweep.mjs --check`），本条不代跑。
- **位置**：PRD §4.4 B 表新增一行（或裁决复用第 5 道既有码）；本文件 C07 / §7.2-4。
- **风险**：「纯结构行不可作证据」有判据无码名——C07 断言写不出唯一锚（「断言红」可行，但错误清单认不出它，排障者无法 grep）；这是**唯一阻塞本 testcase 可执行性的建议**。
- **改法**：B 表登记新码（建议名 `EvidenceStructuralRow`，对齐 `Evidence*` 前缀族）；属命名类判据级口径 → R8 同批回扫 PRD §4.3 / §4.4 / 本文件 C07 三处。
- **取舍**：否掉「不登记、靠 detail 文本判」——文本判 = 词表猜测，文本版 8/9 被绕的老路；否掉「塞进 EvidenceQuoteTooShort」——「太短」与「纯结构」语义不同（13 字的结构行并不短），混码 = 排障定位错层。
- **验收**：B 表有行 + C07 断言用定名 + `node scripts/scope-sweep.mjs --check` exit 0。
- **优先级**：P0（S2 施工前定）。

### 8-6 adversarial A7 期望码同批改（0.2 #5）【P0】

- **位置**：草稿 `adversarial.test.mjs`（草稿区 行 49-52）（迁入后对应行）。
- **风险**：A7 现断言「hit 无 evidence → `InvalidFieldType`」，与 B16 的 PRD 判据（→ `MissingEvidence`）**双标矛盾**——B16 实现落地瞬间 A7 假红，或有人为迁就 A7 放弃 MissingEvidence 码（错层：缺失 vs 类型错）。
- **改法**：A7 期望码从 InvalidFieldType 改 `MissingEvidence`，与 B16 实现**同批提交**；A7 原意图（hit 缺 evidence 必红）不变，只改码名。
- **验收**：A7 与 B16 断言同一码；全套绿。
- **优先级**：P0（夹具改批任务内必含，漏改 = 改批提交必红一轮）。

## 9 自检（spec-testcase-gate 五判据 + 计数 + 机器自查）

### 9.1 五判据逐条

| # | 判据 | 自查结果 |
|---|---|---|
| 1 | 文件存在 | ✓ 与 spec 同目录（`docs/superpowers/specs/`）；文件名 = spec 去 `.md` + `-testcase.md` |
| 2 | 编写者独立 | ✓ 文件头「编写者 / 独立性声明」在位：senior-sdet 子代理**全新上下文**，≠ spec 作者、≠ 施工者；所有实现面结论来自独立实测（0.1 的 888 行 / 71+61 双跑 / 白名单在位均为本编写者复算），未从实现倒推放宽任何判据 |
| 3 | 用例合格 | ✓ 73 条五要素齐（覆盖 / 前置 / 步骤 / 预期 / 判据）；负例 + 边界 47 ≥ 正例 26；覆盖总表 73 行每行指回 spec 节号或 PRD 锚点（§1.1 对位零空行）；**④ 段追加 §10 的 11 条同按九项齐，计入后 84 条 / 负 + 边界 57 ≥ 正 26** |
| 4 | spec 外链 | ✓ spec §10.4 末已写「测试用例文件：`docs/superpowers/specs/2026-10-27-s2-observation-check-design-testcase.md`」；spec 内 `^#### ` = 0（未内联）；2026-10-27 12:00 复核 |
| 5 | 一起送审 | 待父代理执行：议会开卷清单同时列 spec + 本 testcase 两份 |

### 9.2 计数与覆盖汇总

| 项 | 值 |
|---|---|
| 用例总数 | **73** = A7 + B20 + C8 + D8 + E14 + F4 + G6 + H4 + I2 |
| 施工期补入（§10，不计入上列 73） | **11** = X10 条（负 5 / 边界 5）+ X11 现状登记 1；计入后全文 `^#### ` 标题 = **84** |
| 正 / 负 / 边界 | 26 / 41 / 6（负 + 边界 47 ≥ 26，硬门过）；计入 §10 后 26 / 46 / 11（负 + 边界 **57** ≥ 26） |
| 常驻 : 验收 | 65 常驻 + 8 验收命令（A01 / A02 / A03 / A04 / A06 / A07 / G01 / G02，§5） |
| 覆盖的 spec 验收项 | §10.8 七锚点全覆盖：① sha256 原样迁入（A01-A03）② 基线不退 71/71 + agents 零引用（A04-A06）③ 新增判据有测试——B 表 S2 组 16 码逐码、A 表 5 零测试码、三类不出码、A 表并入 8 码冒烟（B/C/D/H/I 组）④ golden（D05-D07）⑤ 覆盖语义 7 处 fixture + 1 探索稿指针 + 禁放宽（F 组 + D08）⑥ CLI（E08-E14）⑦ 仓门禁不红（A07/G01/G02） |
| 另覆盖 PRD 侧 | §5.3 V-6 S2 部分（行 1-6、8、9 + 绿例 11、12）、§9.3 M-2 S2 部分、§0.5 Q-A-05（分母闭合） |
| 未覆盖 | §6 七条（S1 / S3 接线 / S4 / V-8 其余四处 / Windows 软链实盘 / 语义判定 / 逐名比对），逐条带兜底 |
| 盲点 | 13 条（G-1 ～ G-13，§7.1），全部有对位处置 |

### 9.3 机器自查命令（仓库根 PowerShell 粘贴；四条判据 = 输出值）

① 用例数 = 84（每条用例一个四级标题；73 已签 + §10 补入 11）：

`(Select-String -Path 'docs\superpowers\specs\2026-10-27-s2-observation-check-design-testcase.md' -Pattern '^#### ').Count` → `84`

② 类型计数 = 26 / 41 / 6（覆盖总表 A–I 行）：

`(Select-String -Path <本文件> -Pattern '^\| [A-I]\d{2} \|.*\| 正 \|').Count` → `26`；同式换 `负` → `41`；换 `边界` → `6`（三条合计 73 = ① − 11）

②b §10 增补行的类型计数（X 前缀，不计入上面三条）：

`(Select-String -Path <本文件> -Pattern '^\| X\d{2} \|.*\| 正 \|').Count` → `0`；`负` → `5`；`边界` → `5`（+ X11「不覆盖（现状）」1 行，不计类型）——② + ②b = 26 / 46 / 11，合计 84 = ①

③ 禁占位词 = 0（大小写敏感；F03 的 `test.todo` 是被扫描的 node:test API 名——小写带点，非占位词，用 `-CaseSensitive` 精确区分）：

`(Select-String -Path <本文件> -Pattern 'TB[D]|TO[D]O|稍后补[充]' -CaseSensitive).Count` → `0`

④ 合法占位（「待 plan Task N」）逐条可核、无一处用作判据——**当前真占位 0 处**（两处已在 2026-10-27 关闭：A01 前置、C07 前置）：

`Select-String -Path <本文件> -Pattern '待 plan Task'` → **3 行** = 1 行规则声明（§2 总述「唯一允许占位 = …」，声明本身不是占位实例）+ 本节 2 行命令文本自引用（④ 本行描述句 + 下列 Pattern 字样），**0 处**在判据字段。两处已关闭的真占位：A01 前置（原 `MIGRATION_COMMIT` 落值 → 零提交裁定下改锚账本 §迁入清单 11 行 sha256）、C07 前置（原「码名待登记」→ 已登记 `EvidenceStructuralRow`，PRD :355）。另 4 处「形态按 plan Task N 落地」（B 组共用夹具 / B14 预期 / B17 前置 / D01 前置；**无「待」字**）属 plan 可自决的实现点，不写在判据字段，不计入占位。

> 编写者按「在输出带数据的结论前必须执行验证闸门」规则已实跑 ①-④：`73` / `26` / `41` / `6` / `0` / 3 行（其中真占位 0 处），与本节声明一致（2026-10-27 实测；同批实跑值另有 A02 的 11 条 sha256 全等、A03 的 888）。
> **④ 段复核（2026-10-27，senior-sdet 独立实例，未参与施工；追加 §10 后重跑）**：①–④ → `84` / `26` / `41` / `6` / `0` / 3 行；②b 增补行 → `0` / `5` / `5`；A02 的 11 条 sha256 与草稿区原件逐条相等（11/11）、A03 的 `888` 不变；`node --test tools/observation-check/*.test.mjs` → `# tests 166 / # pass 166 / # fail 0 / # skipped 0`。

## 10 施工期补入（2026-10-27，不计入 ② 已签的 73 条）

> 出处与边界：本节由 ④ 段质量门（senior-sdet 独立实例，`agents/senior-sdet.md` 角色卡 path B 贴入，未参与施工）在逐条执行 testcase 时补写；**只追加，不改已签 73 条的任何结论句**。对位对象 = 施工期（③ 段之后）新增的判据与测试：③ 送审材料记 **148** 条 test block（`docs/handoffs/2026-10-27-s2-observation-check-close.md`§7「148/148/0」），交付树实测 **166** 条（`node --test tools/observation-check/*.test.mjs` → `# tests 166`），差 18 条。本节只登记其中「有独立判据、既有用例文字未覆盖」的 10 条 + 1 条现状登记，其余增量见 §10.2。
> 编号前缀 `S2-OC-X`；本节条目与 §1 覆盖总表末 11 行一一对应。

### 10.1 用例明细

#### X01 instance 枚举：只允许 `'A'` / `'B'` / `null`

- **覆盖**：§10.8-3 / PRD §4.1（`instance` 三值枚举）/ §4.4 A 表 `InvalidFieldType`
- **来源**：施工期补（④ 段登记）——迁入版对 `instance` 零校验（`git show 9f45096:tools/observation-check/checks.mjs` 无 instance 分支），非法枚举值静默通过，双实例产物可写出第三形态
- **前置**：`tools/observation-check/checks.mjs:77-79` 枚举守卫在位（`undefined` / 缺省按 `null` 处理）
- **步骤**：① `validateObservation({…docBase, instance:'C'})`；② `instance:123`；③ 正例循环 `[null, 'A', 'B']`
- **预期**：①② errors 含 `InvalidFieldType`；③ 零 errors
- **判据**：`codes(...).includes('InvalidFieldType')` 两次为真；`deepEqual(codes(...), [])` 三次为真（逐形态断言，不合并计数）
- **红绿证据**：红 = 迁入版无该分支（`'C'` / `123` 零错误 = 假绿）；绿 = 现出码（`checks.test.mjs` 两条 `ok`）
- **对应测试**：`checks.test.mjs:138`「instance 枚举：C 与数字 → InvalidFieldType（PRD §4.1）」、`checks.test.mjs:143`「instance 枚举正例：null / A / B → 零错误」
- **不覆盖**：`instance` 派生文件名（`-a` / `-b` 小写形态归 E01）；`check:'ai'` 条目的成对文件（B17 / B18）；`instance` 与 `round` 的组合语义（`RoundMismatch` 归 E02）

#### X02 `requires` 非对象项 → `InvalidFieldType`（不得抛 `TypeError`）

- **覆盖**：§10.8-3 / PRD §4.4 A 表 `InvalidFieldType` + §4.2 异常纪律「类型 / IO 异常收敛为码，不得冒泡」
- **来源**：施工期补——迁入版 `checkPrerequisites` 的 `requires.forEach` 直接 `Object.keys(r)`，`requires:[null]` 抛 `TypeError`（`git show 9f45096:tools/observation-check/checks.mjs` 该函数段无类型守卫）
- **前置**：`checks.mjs:243-246`「非对象项（`null` / 字符串 / 数组）→ 收敛为码」分支在位
- **步骤**：`checkPrerequisites([null], [])` / `checkPrerequisites(['x'], [])` / `checkPrerequisites([[]], [])`
- **预期**：三次 `ok:false` 且 errors 含 `InvalidFieldType`；调用方无 try 也拿得到返回值
- **判据**：`r.errors.some((e) => e.code === 'InvalidFieldType')` 三次为真
- **红绿证据**：红 = 迁入版 `Object.keys(null)` 抛类型错误（代码事实：该行无守卫）；绿 = 收敛为码、`ok:false`
- **对应测试**：`checks.test.mjs:149`「requires 非对象项（null / 字符串）→ InvalidFieldType，且不抛 TypeError」
- **不覆盖**：`requires` 整体非数组；`must` 非布尔（adversarial A12 / A13 既有断言）；`requires` 未知字段（`UnknownField`，A12）

#### X03 结论行由 `open` 派生（open 空 + closure=null 不得写「有补充项」）

- **覆盖**：§10.8-4 / PRD §4.2 ③（md 是唯一给人读的投影）
- **来源**：施工期补——迁入版固定写「有补充项，无总体结论」（`git diff 9f45096 HEAD -- tools/observation-check/checks.mjs` 的 minus 行：`结论：${closure === null || undefined ? '有补充项，无总体结论' : closure}`），open 为空时与事实相反
- **前置**：`checks.mjs:179-183` 结论由 `doc.open.length` 派生
- **步骤**：`renderObservation(docBase({ open: [], closure: null }))`
- **预期**：md 含「结论：无补充项」；不含「有补充项」
- **判据**：`assert.match(md, /结论：无补充项/)` **且** `assert.doesNotMatch(md, /有补充项/)`——两向断言，缺一不算
- **红绿证据**：红 = 迁入版（open 空也写「有补充项」）；绿 = 派生正确
- **对应测试**：`checks.test.mjs:157`「渲染：open 为空 + closure=null → 结论不得声称「有补充项」」
- **不覆盖**：`closure:'blocked'` / `'no-findings'` 的文案自由度（枚举归 B06 / adversarial A5）；open 非空 + `no-findings` 的矛盾（`ContradictoryClosure`，A6）

#### X04 骨架常量单源（渲染输出必须用到 `md-format.mjs` 的常量）

- **覆盖**：§10.8-3 / PRD §4.3 第 5 道（结构行判据的常量来源）/ §4.2 ③
- **来源**：施工期补——骨架常量原先两侧各写一份（渲染侧内联字面量、校验侧另拼），格式改一处即漂移，漂移后果是「自己产出的常量又能当证据」（与 X05 同一根因的两面）
- **前置**：`tools/observation-check/md-format.mjs:4-12` 六常量（`MD_BANNER` / `MD_TITLE` / `MD_OPEN_SECTION` / `MD_NONE` / `MD_ITEMS_HEADER` / `MD_OPEN_HEADER`）+ 聚合常量 `MD_SKELETON`；校验侧 `tools/observation-check/evidence.mjs:37` 取同一份
- **步骤**：① 渲染 closed 形态（open 空、closure=null）→ 断言五个常量逐字在输出内；② 渲染 open 非空形态 → 断言 `MD_OPEN_HEADER` 在输出内
- **预期**：六常量逐条命中（缺一即红）
- **判据**：`closed.includes(line)` 五次 + `withOpen.includes(MD_OPEN_HEADER)` 一次，逐条独立断言（失败消息带行名）
- **红绿证据**：红 = 渲染侧内联字面量（改格式忘改常量 → 校验侧仍拿旧常量匹配 = 假绿）；绿 = 六常量全在
- **对应测试**：`checks.test.mjs:170`「骨架常量与渲染输出同源（改格式必须同批改 md-format.mjs）」
- **不覆盖**：常量的措辞美学；`MD_SKELETON` 逐行不可作证据（归 X05）

#### X05 C07 第四形态：渲染器固定骨架行逐行不可作证据

- **覆盖**：§10.8-3 / PRD §4.3 第 5 道（四类结构行之第四类）/ §4.4 B 表 `EvidenceStructuralRow`
- **来源**：施工期补——三形态实现后，`hit` 改引渲染器自己写的横幅（`<!-- observation-md v1 -->`）仍四段全绿：证据闭环于被证明者自身（C07 第四形态，2026-10-27 登记于本文件 C07）
- **前置**：`tools/observation-check/evidence.mjs:116`（`STRUCTURAL_ROW.some(...) || SKELETON_SET.has(cited)`）；`SKELETON_SET` 由 `md-format.mjs` 的 `MD_SKELETON` 派生（`tools/observation-check/evidence.mjs:37`）
- **步骤**：`MD_SKELETON.forEach` 逐行构造证据件（`skeleton-0..5`），各行整行为 quote
- **预期**：六行逐行 → `EvidenceStructuralRow`；其中「无。」2 字先被长度道拦下（`EvidenceQuoteTooShort` 亦算红）
- **判据**：每行 `code === 'EvidenceStructuralRow' || code === 'EvidenceQuoteTooShort'`（逐行断言，行名带进失败消息）
- **红绿证据**：红 = 骨架行判据未接常量（横幅 / 表头 / 「无。」可当证据）；绿 = 六行全拦
- **对应测试**：`evidence.test.mjs:213`「C07 补充：渲染器固定骨架行逐行不可作证据」
- **不覆盖**：与本工具无关的零信息行（语义归审计人）；围栏内 ≥10 字正文（可作证据——C07 不覆盖条款原文）

#### X06 软链 realpath 分支：指向根外 → `EvidencePathOutside`；指向根内 → 放行

- **覆盖**：§10.8-3 / PRD §4.3 第 2 道（`path` 解析后必须落在根内）/ §4.4 B 表 `EvidencePathOutside`
- **来源**：施工期补——`realpath` 分支此前零覆盖：`resolve` 只防 `..`，防不了软链逃逸；D17 曾记「断链软链无法稳定构造」，故改测「链指向根外」这一可稳定构造的形态（junction 在 Windows 无需管理员）
- **前置**：`tools/observation-check/evidence.mjs:59-67` realpath 收敛分支在位
- **步骤**：① 仓库内夹具目录建 junction → 指向 `os.tmpdir()` 下根外目录（内含真实 md），证据 path = `<夹具>/link-out/x.md`；② 同夹具建 junction → 指向夹具内子目录（根内），证据 path = `link-in/y.md`；③ 用完只删链接、不碰目标
- **预期**：① `EvidencePathOutside` 且 detail 含「软链」；② `ok:true`
- **判据**：① `r.code === 'EvidencePathOutside'` 且 `/软链/.test(r.detail)`；② `r.ok === true`——两向断言，只拒根外不够（会把根内一起拒 = 过度拒绝）
- **红绿证据**：红 = 无 realpath 分支（软链逃逸放行）；绿 = 根外拒 / 根内放行
- **对应测试**：`evidence.test.mjs:224`「C02-b 软链指向根外 → EvidencePathOutside（realpath 分支，不是 resolve 分支）」、`evidence.test.mjs:239`「C02-c 软链指向根内 → 正常解析（不过度拒绝）」
- **不覆盖**：断链软链的 `existsSync` 先拦形态（D17：需可注入 fs，归 S4）；junction 以外的 symlink 类型（Windows 需开发者模式，判据同一份）

#### X07 `findBrokenTable` 判别力 + 围栏感知

- **覆盖**：§10.8-3/4 / PRD §4.2 ③「转义后每行列数 = 表头列数，用同一 splitRow 复算」
- **来源**：施工期补——列数守卫若只比「渲染 vs 期望文本」，两边同错仍绿（自洽 ≠ 正确）；`findBrokenTable` 必须有独立判别力，且「什么算表格行」与 `check-all` 同源（围栏内不算表、行首空格的表照算）
- **前置**：`checks.mjs:199` `findBrokenTable`（内部用 `fenceMask` 掩码围栏）；写盘入口同判（`artifact.mjs:137`）
- **步骤**：① 手造 `| a | b |` / `|---|---|` / `| 1 | 2 | 3 |`；② 合法三行；③ 围栏包住的坏表；④ 行首两空格的坏表
- **预期**：① `{ line: 3, want: 2, got: 3 }`（定位到行号）；② `null`；③ `null`（不吃围栏内骨架）；④ `{ line: 3, want: 2, got: 3 }`
- **判据**：①④ `deepEqual(..., { line:3, want:2, got:3 })`；②③ `=== null`——四条独立断言
- **红绿证据**：红 = 只返回布尔（定位不到行号）或把围栏内当表（误报）；绿 = 行号可定位 + 口径与 check-all 一致
- **对应测试**：`render-check.test.mjs:153`（D12 判别力）、`render-check.test.mjs:158`（D13 围栏与行首空格）
- **不覆盖**：`tools/execution-matrix/markdown-rows.mjs` 自身的列数检查（既有门禁回归面）；写盘入口 → `RenderMismatch` 的联动（E0x 面）

#### X08 单元格转义与列数守恒：反斜杠+竖线 / 反引号 / 多行字段

- **覆盖**：§10.8-3 / PRD §4.2 ③
- **来源**：施工期补——D03 只测裸竖线一种：`a\|b`（反斜杠 + 竖线）与代码跨度内竖线两种形态在转义不互逆时会静默切列；多行字段不压 `<br>` 会留孤行（逐块比列数看不出孤行）
- **前置**：转义单源 `tools/execution-matrix/markdown-rows.mjs:41` `escapeCell`（`checks.mjs:148` 直接用）；换行压 `<br>` 在渲染侧
- **步骤**：① `reason = 'a' + 反斜杠 + '|b'` → 渲染 → 逐行 `splitRow` 比列数 + `checkRendered(doc, md).ok`；② `reason = '见 \`a|b\` 片段'` → 同判列数；③ `reason = '第一句\n第二句'`、`impact = '影响一\n影响二'` → 断言压成 `<br>`，并断言无「不以 `|` 开头、又不属骨架行」的孤行
- **预期**：三形态全过
- **判据**：`colsOk`（逐行列数相等）三次 + `checkRendered().ok === true` + `deepEqual(orphans, [])`
- **红绿证据**：红 = 转义与 splitRow 不互逆（字段被切出多余列 / 换行留孤行）；绿 = 列数守恒 + 无孤行。**判别力实测（④ 段变异，见 quality-4）**：把 `escapeCell` 换成恒等函数 → D03 / D09 / D04 转红，**D10 / D11 仍绿**（`\|` 被 splitRow 当转义竖线、代码跨度内竖线本就不切列）→ 本条两个 D10 / D11 形态对「漏转义」无判别力，见 §10.2 缺口 1
- **对应测试**：`render-check.test.mjs:114`（D09）、`:140`（D10）、`:148`（D11）
- **不覆盖**：全角 `｜`（不转义、不破列，归 H01-5）；`<br>` 以外的换行策略（不作判据）

#### X09 README 表格转义 / 卡面散文压换行

- **覆盖**：§10.8-4 / PRD §4.2 ③（README 表格投影与校验侧同源转义）
- **来源**：施工期补——README 是给人读的另一张表，动作文本含 `|` / 换行会破表；卡面是散文，换行不压会把一条 bullet 截成两行
- **前置**：`render.mjs:7` `const cell = escapeCell;`（与 checks 同源）；`renderReadme` 两张表列数不同（动作 7 列 / 覆盖记录 5 列）
- **步骤**：① 追加动作（`trigger: 'T | 触发'`、`text: 'A | B\n第二行'`）→ `renderReadme` → 按连续 `|` 行块分组，逐块与本块表头比列数；② 追加含换行的动作 → `renderCard` → 断言压成同行
- **预期**：① ≥2 个表块、每块每行列数 = 本块表头列数、md 含 `<br>`；② md 含 `第一行 第二行`、不含裸换行
- **判据**：逐块 `filter(l => splitRow(l).length !== width)` 为空 + `md.includes('<br>')` + `includes('第一行 第二行')` + `!includes('第一行\n第二行')`
- **红绿证据**：红 = 用全局首行当宽度（两张表列数不同 → 永远红 / 或写宽成永远绿，Ruling #5 / #12-O2 的形态）或未压换行；绿 = 逐块比 + 换行压掉
- **对应测试**：`render.test.mjs:44`（I03）、`render.test.mjs:64`（I04）
- **不覆盖**：README / 卡面文案措辞；docgen 侧生成物（本工具只渲染自己那两张表）

#### X10 写盘回滚三分支

- **覆盖**：§10.8-3 / PRD §4.2 ④「全成功再 rename；任一失败回滚」（写盘四纪律）/ §4.4 B 表 `WriteFailed`
- **来源**：施工期补——E06 只覆盖「md 侧失败（json 尚未落地）」一支；json 侧失败时 md 已 rename 落地 → 半写态（有 md 无 json）两支未测
- **前置**：`artifact.mjs:146-175` `atomicWritePair`：先写两个 tmp → 旧 md 备份成 `.bak-<pid>` → md 先 rename、json 后 rename → catch 里清 tmp / 删已落地 md / 恢复 `.bak-`；`:159` 只备份普通文件（目录占位不挪）
- **步骤**：① md 目标被同名目录占位 → 写盘（E06 面）；② 先写一次成功（产生旧 md），再把 `observation-r3.json` 位置换成同名目录 → 再写一次；③ 无旧 md + json 位置为同名目录 → 写盘
- **预期**：① `WriteFailed` + json 不落地 + 零 `.tmp-`；② `WriteFailed` + 盘上 md 逐字 === 旧 md + 零 `.tmp-` / `.bak-`；③ `WriteFailed` + md 不存在 + 零 `.tmp-` / `.bak-`
- **判据**：三支各 `errors.includes('WriteFailed')`；② `readFileSync(md) === oldMd`；③ `!existsSync(md)`；②③ `readdirSync` 过滤 `.tmp-` / `.bak-` 为空
- **红绿证据**：红 = 两文件各自 tmp+rename（第一个成功、第二个失败 → 半写态；迁入版 `artifact.mjs` 即此形态，0.2 #12）；绿 = 三支全回滚。**④ 段实测**：`ok 163 / 164 / 165`（E06 / E06b / E06c）
- **对应测试**：`write.test.mjs:173`（E06，已签）、`write.test.mjs:186`（E06b）、`write.test.mjs:208`（E06c）
- **不覆盖**：check-all 侧 skipped 守卫（见 X11）；进程被 kill 级别的原子性（OS 层，不属本工具判据）；`.bak-` 恢复失败分支（catch 内 catch，失败不冒泡）

#### X11 现状登记：`check-all` 侧 skipped 守卫**未落地**（不设用例）

- **覆盖**：§10.8-7 / PRD §4.2（仓门禁是否给「被 skip 掉的测试」留后门）
- **来源**：施工期做过一版「`check-all` 侧 `# skipped > 0` 即红」的守卫，**该守卫已撤回、归 S3**；④ 段登记时不设用例、不设断言，只把现状写下来
- **前置**：`scripts/check-all.mjs:86-93` 现状只回读 `# tests N`（零匹配 / 为 0 判红），**不读 `# skipped`**
- **步骤**：只读核对——`Select-String -Path scripts/check-all.mjs -Pattern 'skipped|skip'` → 0 命中
- **预期**：0 命中（确认无守卫）
- **判据**：命中数 = 0。**若日后命中数 > 0**，说明守卫重新落地 → 必须补正例 / 反例两条用例，本行随之改类型
- **红绿证据**：不适用（本行是现状登记，不是判据）；留它只为防「后人以为有守卫」
- **对应测试**：无（代码现状核对；`scripts/check-all.mjs:86-93`）
- **不覆盖**：S3 的 skipped 守卫设计（触发条件 / 白名单 / 是否连带 `only` / `todo`）——归 S3 落地时补用例；仓内当前 2 条 `# skipped`（`npm run check` 输出）是否为历史遗留，不在此行裁

### 10.2 本节边界与已知缺口（④ 段实测）

1. **D10 / D11 对「漏转义」无判别力（P2）**：变异实测（把 `checks.mjs:148` 的 `escapeCell` 换成恒等函数）后 `render-check.test.mjs` 的 D03 / D09 / D04 转红，而 D10（`a\|b`）与 D11（反引号）仍绿——两者断言的形态本身已被 `splitRow` 的转义 / 代码跨度语义兜住。建议补一条「渲染输出含 `a\\\|b` 逐字」类断言，否则这两条读起来像覆盖了「转义互逆」，实际没有。
2. **4 条增量无独立 ID**：`checks.test.mjs:61/62`（open 缺 `category` / 缺 `evidence`）、`checks.test.mjs:68`（`closure:'blocked'` 正例）、`evidence.test.mjs:259`（`repoRoot` 来源子进程钉）分别落在 B03 / B06 / C08 的行为面内，未另立 ID；若后续要给独立判据，按本节点格式补 X12+ 并同步 §3 / §9.2 / §9.3 计数。
3. **③ 送审材料与交付树的数字差**：`docs/handoffs/2026-10-27-s2-observation-check-close.md`§7 记 148 条 test block，交付树 166 条（差 18）；本节只登记其中 10 条 + 1 条现状，其余增量属上一条。③ 侧材料需在 ④→⑤ 交接时勘误（不属本文件可改范围）。







