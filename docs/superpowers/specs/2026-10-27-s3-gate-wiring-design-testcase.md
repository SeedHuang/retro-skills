# S3 门禁接入（gate wiring）配套 testcase

> 归属 spec：`docs/superpowers/specs/2026-10-27-s3-gate-wiring-design.md`（正文 §11；核心决定 R1–R9 `spec:43-51`、代号表 §11.0.1 `spec:22-37`、机制 §11.2 `spec:53-132`、码表 §11.3 `spec:134-147`、差异 D1–D9 `spec:186-194`、裁定 Q1–Q20 `spec:200-219`、八锚点 §11.10 `spec:233-244`）
> 上游 PRD：`docs/prd/20261026205821-agent-card-contract.md` §5.1 `:387-396`、§5.2 `:400-416`、§4.4 `:362`、§8 S3 行 `:518`、§9.1 V-6 `:563`、§9.3 M-2 `:584`、§5.3 `:437-440`
> 锚点出处口径：八锚点一律以 **spec §11.10（`spec:233-244`）** 为准；PRD `:546` 只是 F→S 覆盖表的一行备注（「零产物 / 不可枚举 / 反向清单 / 旁路必须有测试」），**不得**引成「PRD 已定 S3 出口判据」（第 1 轮卡 Q-1-AU4）
> 编写者：**senior-sdet 子代理**（角色卡 `agents/senior-sdet.md`，path B「角色卡逐字贴入通用子代理」）
> 独立性声明：**全新上下文编写**——编写者 ≠ spec 作者、≠ 施工者；未参与 S3 spec 的任何条款起草，未参与 `tools/observation-check/**` / `scripts/check-all.mjs` 的任何实现；**只创建/修订本文件，未改 spec、未改代码、未执行任何 git 写操作**。v2 / v3 / v4 / v5 修订仍由同一 senior-sdet 实例执行（≠ spec 作者、≠ 施工者）：只把**已写回 spec 的裁定**（§11.2 / §11.3 / §11.5 / §11.6 / §11.7 / §11.10）回填进本文件，裁定原文一律以 spec 为准、逐条核对行号后引用，**未反向修改 spec**。
> 编写日期：**2026-10-27**｜版本：**v5（第 4 轮收口修复后）**
> v1 = 首版随 spec 送议会（53 条）。**v2 = 第 1 轮议会 28 张卡答辩裁定回填**（→ 54 条）。**v3 = 第 2 轮议会裁定回填**（TAP 内联正则 / `formatGateLine` 直测 / 根层语义 / 过程根 / 去移动靶，→ 55 条）。**v4 = 第 3 轮议会裁定回填**（多条 `\n` 拼接 / ⑥ 文案单源 / 只按名字判 skip / 账本-only 仍红 + 第 0 步 / 「卡面」限定词）。**v5 = 第 4 轮收口修复**：①**F-24 四出口行号改正**（`EXEMPT_CARDS` 122→**123**、`EXPIRY_EVENT` 123→**124**、`EXPIRY_LANDED` 124→**125**、`disposeCardFindings` 125→**126**，共 15 处；区间 `121-126`→`119-126`；§4.3 的「F-24 区段核查未变」改为逐行实测结论，Q-4-RD1）；②H05 ⑥c 追加「`check-all` 源码不得含 `[observation]` 字面量」（Q-4-AI-P2）；③H01 ①d 的两条 findings 改为**字母序与数组序相反**（`g1 = RenderMismatch`、`g2 = ArtifactMissing`），使「按数组顺序」与「按码排序」两种实现可被区分（Q-4-QA-P2）；④`formatGateLine` 相关措辞统一为**四形态**（零产物 / 有产物 / findings 单条 / findings 多条），"三层/三形态" 只保留在引用 spec 原文处（BE 席 P2）；⑤§4.4 第 4 轮对照。**条数仍 55（H01–H55）**，类型 13 / 24 / 18。
> 命名与落点：spec 文件名去掉 `.md` 后加 `-testcase.md`，同目录（`spec-testcase-gate` 判据 1）

## 0 现状与基线（读用例前先认事实；可复算）

### 0.1 编写时实测（cwd = 仓库根 `d:\Seed\retro-skills`，2026-10-27；v4 修订时逐行复核）

| # | 项 | 实测值 | 取数命令 / 出处 |
|---|---|---|---|
| 1 | 仓门禁（v1 编写时） | exit 0；`# tests 902 / # pass 900 / # fail 0 / # skipped 2`；末行 `check 全部通过` | `npm run check`（**v2 本轮未重跑**：父代理统一跑；数值引 spec §11.0 `spec:20`） |
| 2 | observation-check 套件 | `# tests 166 / # pass 166 / # fail 0 / # skipped 0` | `node --test "tools/observation-check/*.test.mjs"`（cwd = 仓根；v2 本轮实跑） |
| 3 | 归档子目录 / 文件 | 2 个子目录 / 11 个文件；**根层散文件 0** | `(Get-ChildItem docs\superpowers\reviews -Directory \| Measure-Object).Count` → 2；`… -Recurse -File \| Measure-Object).Count` → 11；`… -File \| Measure-Object).Count` → 0（v2 本轮实跑） |
| 4 | 归档产物 | 1 对（`2026-10-27-1200-migration-drill/observation-r3.json\|md`），已跟踪、工作树一致 | `git ls-files --error-unmatch -- <json>` exit 0；同 md exit 0；`git diff --quiet -- <json>` exit 0（v2 本轮实跑） |
| 5 | 存量白名单目录 | 1 个（`2026-10-25-1723-s6-eval/`），9 个文件全在 PRD §5.2 `:412` 精确路径白名单内 | `git ls-files docs/superpowers/reviews/2026-10-25-1723-s6-eval` → 9 行（v2 本轮实跑） |
| 6 | 过程目录 / 产物 | **50 个目录**（每轮评审 +1）/ `observation-r*` **0 件** | `(Get-ChildItem .session\reviews -Directory \| Measure-Object).Count` → 50；`… -Recurse -Filter 'observation-r*' \| Measure-Object).Count` → 0（v2 本轮实跑，2026-10-27 23:37 之后） |
| 7 | `agents/*.md` | 15（= F-24 豁免窗口的 15 张卡） | `(Get-ChildItem agents\*.md \| Measure-Object).Count` → 15（v2 本轮实跑） |
| 8 | S3 三个新模块 | **均不存在** | `Test-Path tools\observation-check\gate-run.mjs` → False；`…\card-exempt.mjs` → False；`Test-Path scripts\test-skip-allowlist.mjs` → False（v2 本轮实跑） |
| 9 | `check-all.mjs` 现有接线 | **0 命中**：无 `⑥` 段、无 `BYPASS`、无 `# skipped` 回读 | `(Select-String -Path scripts\check-all.mjs -Pattern 'observation\|BYPASS\|# skipped').Count` → 0（v2 本轮实跑） |
| 10 | 当前 2 条合法 skip（= R9 白名单对象） | `TC-A10 运行时就位：两条 Test-Path 为 True（aas sync 后本机验）`、`TC-E27 只写源不 aas sync → 本机 Test-Path 为 False（探针式，不碰 dev-workflow 本体）` | 定义在 `tools/docgen/test/dev-workflow-files.test.mjs:100` / `:262`；跳过开关 `RUNTIME_SKIP` 在 `:98`（`DW_RUNTIME_CHECK=1` 才跑，故不进 `npm run check`） |
| 11 | `tools/observation-check/*.test.mjs` | 12 个测试文件（含 `gate-scan.test.mjs` 的 G03–G06） | `(Get-ChildItem tools\observation-check\*.test.mjs).Count` → 12（v2 本轮实跑） |
| 12 | 根模块实测形态（决定注入方式可行） | `repoRoot()` 有进程内缓存（`tools/observation-check/evidence.mjs:39` `cachedRoot`，`:41` 命中即返回）；`gate-scan.mjs` 已导出 `ARTIFACT_RE` / `ALLOWED_FILE_RE` / `ATTACHMENT_RE` / 两份白名单 / `scanReviewDir`（`:2` / `:5` / `:8` / `:12` / `:17` / `:20`） | `Select-String -Path tools\observation-check\evidence.mjs -Pattern 'cachedRoot\|rev-parse'`；`Select-String -Path tools\observation-check\gate-scan.mjs -Pattern '^export'`（v2 本轮实跑，v3 复核未变） |
| 13 | **真仓不变量**：`*-s6-eval` 目录**恰 1 个**（既有测试断言，不是本文件新立） | `policy-pure-source.test.mjs:1580`：`assert.equal(found.length, 1, '应恰有 1 个 *-s6-eval 账单目录…')`；两处扫描逻辑在 `:1059-1063` / `:1574-1579` | `Select-String -Path tools\docgen\test\policy-pure-source.test.mjs -Pattern 's6-eval'`（v3 本轮实跑）→ 决定 H01 的 e2e 段**不得**移走 `2026-10-25-1723-s6-eval` |
| 14 | **真实 TAP 形态**（决定 skip 解析正则） | `ok 9 - TC-A10 运行时就位：两条 Test-Path 为 True（aas sync 后本机验） # SKIP 本机运行时验：设 DW_RUNTIME_CHECK=1 并先 aas sync（不进 npm run check）` / `ok 26 - TC-E27 … # SKIP 同一 reason`；汇总 `# skipped 2`；**不存在独立的 `# SKIP <名>` 行** | `node --test tools/docgen/test/dev-workflow-files.test.mjs`（v3 本轮实跑，cwd = 仓根；只取该文件的 TAP 行） |

**基线结论（决定本文件的可执行语境）**：
1. 第 8 / 9 行说明 **S3 尚未施工**：`runObservationGate` / `disposeCardFindings` / `SKIP_ALLOWLIST` 都不存在，`check-all` 也没有 ⑥ 段。故本文件绝大多数用例**当前不可运行或必红**——这是**红色驱动**（与 S2 testcase 同一形态），不是缺陷。plan 的任务顺序必须「实现 → 全绿验收」，不得先跑测试再补实现。
2. 第 3 / 4 / 5 / 6 / 7 行是 spec §11.0（`spec:14-18`）与 §11.10-2/-3/-7（`spec:238` / `spec:239` / `spec:243`）取数的**同一口径复算**：2 / 11 / 0 / 1 对 / 9 / 50 / 0 / 15 与 spec 一致（spec 写「≥49」，实测 50——过程目录每轮 +1，故本文件一律按「≥49（2026-10-27 23:37 实测 50）」写，不作等值断言，Q16 `spec:215`）。
3. 第 4 行说明锚点 2「归档现状不误红」**可构造**：现存唯一产物已跟踪、干净、四段绿 → 真仓根全扫应为 0 findings（H50 判据）。
4. 第 12 行说明**注入方式只能是子进程**：`repoRoot()` 的 `cachedRoot` 会让同进程内 `chdir` 无效（改根后仍返回第一次的根），故 gate 用例一律 spawn 子进程（Q13 `spec:212`）。
5. 第 13 行是**真仓既有不变量**（第 2 轮卡 Q-2-QA2 / Q-2-BE1 / Q-2-AI2 的根因）：`*-s6-eval` 目录恰 1 个已被 `policy-pure-source.test.mjs:1580` 断言 → 本文件的任何 e2e 构造**不得**移走 `2026-10-25-1723-s6-eval`，否则造出的是「自家测试不变量」的红，不是被测门的红。
6. 第 14 行是**真实 TAP 形态**（第 2 轮卡 Q-2-QA1 / Q-2-BE3 / Q-2-AI3 的根因）：skip 名与 reason **同行内联**在 `ok N - <名> # SKIP <reason>`，**没有**独立的 `# SKIP <名>` 行 → v2 的 `/^# SKIP (.+)$/m` 解析永远得 0 个名字，fail-closed 反而恒红。v3 按 spec `spec:130` 定死的 TAP 内联指令正则解析（见 §0.2-8）。

### 0.2 判读口径（先声明再测，防 plan 期静默换口径）

1. **finding 契约 = spec 明写**（`spec:79-81`）：`finding = { code, path, message }`。
   - **文件级**（四段码、git 两码）：`path` = 该文件**仓内 POSIX 相对路径**；**每个产物文件每条命令最多一条**，不去重、不聚合（`spec:80`）。
   - **目录级**（`ArtifactMissing` / `UnclassifiedArtifact`）：`path` = **`<次>/` 的仓内相对路径**，**杂件文件名留在 `message`**（`spec:81`）——S2 返回值无 `path`（`spec:31`），接线**不得**解析 `message` 反推路径。
   - 归一助手（全文统一）：`const norm = p => String(p).replace(/\\/g, '/').replace(/\/+$/, '')`；断言一律「`norm(f.path)` 与期望串逐字相等 / 集合相等」，**不再用「path 里包含文件名」**（v1 的写法在「纯函数无 path」的事实下不可实现——第 1 轮卡 Q-1-BE1 / Q5 `spec:204`）。
2. **打印归属 = `check-all`，文案由纯函数 `formatGateLine(res)` 产生**（`spec:83-86` / `spec:75`）：`gate-run.mjs` 同模块导出**纯函数 `formatGateLine(res)`**（`spec:75`），`check-all` 只 `console.log(它的返回值)`；gate 本身**不在模块内 print**。三种形态：①有 findings → 逐条 `[observation] <code>: <path> —— <message>`（`spec:84`）；②无 findings → `⑥ 观察产物门禁：扫描 <scannedDirs> 个子目录 / 归档 <archivePairs> 对 / 过程 <processPairs> 对 / findings 0`（`spec:85`）；③零产物分支 → 同一行行尾加「（**归档** 0 件，跳过）」，且**只跳归档侧判定、过程侧照扫**（`spec:86`）。
   - **`scannedDirs` 计义**（`spec:85` / 第 2 轮卡 Q-2-RD1）：= **归档侧被枚举的子目录数**（`docs/superpowers/reviews/` 下的直接子目录），**不含过程目录**。故 H01 的「扫描 0 个子目录」与 H28/H55 的 `processPairs` 是两条独立计数，互不代表。
   - 「对」的计义 = 已存在且成对的 `observation-r<N>(-[ab])?` json + 同名 md 一组，`-a`/`-b` 各自成对（Q14 `spec:213`）。
3. **测试注入 = 子进程**（`spec:77` / Q13 `spec:212`）：`runObservationGate()` **无参数**（`spec:75`），根由 `repoRoot()`（`spec:36`）派生且**进程内缓存** → 同一进程 `chdir` 不可复用。故**所有 gate 用例**一律：`spawn` 一个新 node 进程、`cwd` = `mkdtempSync()` 建的**临时 git 仓库**，子进程调 `runObservationGate()` 并把结果 JSON 写 stdout，父进程回读；临时仓 `finally` 删除。生产路径上不存在第二个 root 来源（R2 `spec:44` / PRD `:424`）。
4. **夹具一律自建**：所有临时根 = `mkdtempSync(join(os.tmpdir(), 's3-gate-'))`；git 仓库夹具同在系统临时目录并 `finally` `rmSync(recursive)`。**不引用 `agents/` 或任何仓内业务文件当夹具**（S2 教训）。唯一例外 = **H41 的验收半段**：F-24 的判据对象本身就是 `agents/*.md` 实跑取数（那是判据来源而非夹具，且只在交付时点核一次）。
5. **合法产物的最小形态**（本文件所有"合法 artifact"的统一构造，可复算）：
   ```js
   const doc = {
     round: 1, instance: null,
     items: [{ id: 'k01', verdict: 'na', reason: '不适用' }, { id: 'k02', verdict: 'na', reason: '不适用' }],
     open: [],
     coverage: { read: 2, total: 3, skipped: ['k03'] },
     closure: 'no-findings',
   };
   const md = renderObservation(doc);   // 用 S2 渲染器产出，天然 RenderMismatch-free
   ```
   选 **全 `na`** 的理由：`validateArtifact` 只在 `hit` / `open.evidence` 上才读盘解析证据，而证据解析根 = `repoRoot()`（`spec:36`）——它锚在**子进程 cwd**，与用例的临时根**同源**（子进程 cwd 就是临时仓，故这不是问题）；全 `na` 的产物根本不触发读盘，在任意临时 root 里四段校验都能独立通过（这条不变量是所有 ⑥ 段用例成立的前提）。
6. **命令写法**：一律写明 cwd = 仓库根；glob 一律加引号（正确形态 = `node --test "tools/observation-check/*.test.mjs"`；裸 `*.test.mjs` 在 PowerShell 下 glob 不展开 → `# tests 0` 且 exit 0 = 假绿，见 §11.6 D7 `spec:192`）。**输出变量约定**：所有 spawn 类用例里的 `out` / `outCombined` 一律 = **stdout 与 stderr 合并后的文本**（`check-all` 的失败行走 `console.error`、通过行走 `console.log`，只取单一流会漏判——H39/H47/H48/H49/H52 都依赖这条）。
7. **全局态用例**：v2 起**不再有任何「进程内改 env」的 gate 用例**（H25 的 `PATH` 清空改为**传给子进程的 env**，不再改本进程）。改**仓内文件系统状态**的用例（H01 的 e2e 段、H39 在真仓 `.session` 建一级散文件、H47/H48 在 `tools/observation-check/` 临时放探针测试文件、H52 在真仓归档目录建子目录）= **验收**（不进常驻），因为会与并发的 ② 段 glob 互踩；一律 `try/finally` 恢复 + `finally` 后 `git status --porcelain` 复核零残留。
   - **H01 的 e2e 段只允许移走演练目录**（`docs/superpowers/reviews/2026-10-27-1200-migration-drill`），且暂存位置必须是**仓外** `mkdtempSync()`：①**不得**放进 `.session/tmp/`（该目录收尾必须为空，`scripts/check-all.mjs:346-360` 会红、`:370` exit 1 → 期望的 exit 0 不可达）；②**不得**移走 `2026-10-25-1723-s6-eval`（`policy-pure-source.test.mjs:1580` 断言 `*-s6-eval` 恰 1 个，移走即把自家不变量搞红 —— 第 2 轮卡 Q-2-QA2 / Q-2-BE1 / Q-2-AI2，见 §0.1-13）。
   - 因此**零产物文案的机械判据不靠真仓状态**：改由直测纯函数 `formatGateLine(res)`（`spec:163` 要求「三种形态逐字断言、不依赖真仓状态」），真仓只用于「移走演练目录后扫到 1 个子目录 / 归档 0 对 / findings 0」这一条 e2e。
8. **skip 解析形态 = TAP 内联指令**（`spec:130` / 第 2 轮卡 Q-2-QA1 / Q-2-BE3 / Q-2-AI3）：唯一正则是 `/^\s*(?:not )?ok\s+\d+\s+-\s+(.*?)\s+#\s+(SKIP|TODO)\b/`，**名字取第 1 捕获组、reason 丢弃**；实跑样本（§0.1-14）：`ok 9 - TC-A10 运行时就位：两条 Test-Path 为 True（aas sync 后本机验） # SKIP 本机运行时验：…` → 名字 = `TC-A10 运行时就位：两条 Test-Path 为 True（aas sync 后本机验）`。**不得**再假设存在独立的 `# SKIP <名>` 行（不存在）；fail-closed 只在「`# skipped M`（M>0）**且**该正则解析出 0 个名字」时触发。
9. **根层语义 = 一律 `UnclassifiedArtifact`**（`spec:99` / D1 `spec:186`）：扫描根的直接文件（不在任何 `<次>/` 内）**不调 `scanReviewDir`、不套允许类白名单**——根层 `progress.md` 这类允许名**同样不豁免**；`ARTIFACT_RE` 只用于区分「产物名 / 非产物名」并写进 `message`。故 H11 / H14 / H54 的判据只断「恰 1 条 `UnclassifiedArtifact` + 无 `ArtifactMissing` + 文件名在 message」，**不断言**根层走了 `ALLOWED_FILE_RE`。

## 1 覆盖总表

执行方式：**常驻** = 写进 `tools/observation-check/*.test.mjs`，随 `npm run check` 的 ② 段跑；**验收** = 收尾命令（`npm run check` 单次 24s 级 / 需全仓状态 / 需真仓文件系统临时改动），在 plan 收尾任务里跑并把输出贴 `gate-record.md`。

**验收类一律不落 `*.test.mjs`**（§11.5 末行 `spec:174`、§11.7 Q11 `spec:210`）：载体 = **plan 收尾任务的命令清单 + 输出贴 `gate-record.md`**。**不钉 `# tests` 增量**（增量按用例数算会与 `test()` 调用数错位，Q11 `spec:210`）；兜底判据 = `# pass + # skipped === # tests` 且 `# tests ≥ 166`（H51）。

| ID | 覆盖项（spec 节号 / R / 锚点 / 码） | 一句话场景 | 类型 | 层级 | 执行 | 优先级 |
|---|---|---|---|---|---|---|
| H01 | §11.5 `formatGateLine`（`spec:163`，含**多条 `\n` 拼接**）/ §11.2 打印形态（`spec:83-86`：有 findings / 无 findings / 零产物）/ D1 零产物（`spec:99`）/ Q6（`spec:205`）/ R2（`spec:44`）/ PRD §5.2 `:414` / 锚点1（`spec:237`） | **三段**：①`formatGateLine(res)` **四形态**逐字（零产物 → 行尾「（归档 0 件，跳过）」；有产物无 findings → 四字段计数行；有 findings 单条；**多条 → 逐行 `\n`、顺序 = 数组顺序**）；②gate 返回四字段齐、子进程 stdout 纯 JSON（不打印）；③e2e（验收）只移演练件后 → 「扫描 1 个子目录 / 归档 0 对 / findings 0」且**无**「跳过」后缀 | 正 | 单元 + e2e | 常驻 + 验收 | P0 |
| H02 | 扫描根不可用（`spec:101` / §11.3 `ArtifactNamingOff` `spec:138`）/ PRD `:414` / 锚点1 | 扫描根不存在 → `ArtifactNamingOff` | 负 | 单元 | 常驻 | P0 |
| H03 | 扫描根不可用（`spec:101`）/ `ArtifactNamingOff`（`spec:138`）/ 锚点1 | 扫描根路径是文件（`readdir` 抛 ENOTDIR）→ `ArtifactNamingOff`、不抛栈 | 负 | 单元 | 常驻 | P0 |
| H04 | 三态·存量白名单（`spec:93`）/ PRD `:411` / 锚点2（`spec:238`） | 子目录全在存量目录白名单 → 0 findings（不追溯） | 边界 | 集成 | 常驻 | P1 |
| H05 | R1（`spec:43`）/ R2（`spec:44`）/ R4（`spec:46`，含「根层分支不调 `scanReviewDir`、不套允许类白名单」）/ R5 timeout（`spec:47`）/ Q13（`spec:212`）/ §11.4「不加开关」（`spec:154`）/ §11.5 ⑥ 段**文案单源**（`spec:164`）/ PRD `:400` `:424` | 静态 + 行为：`gate-run.mjs` 无 root 形参、无自建允许类/白名单/产物正则（**根层也不得复用 `ALLOWED_FILE_RE`**）、git 三命令带 `timeout: 30000`；全仓生产调用点 = 1 且实参为空；**`check-all.mjs` 必须调用 `formatGateLine(` 且不得内联 ⑥ 段字面量（计数行与 `[observation]` 前缀两种都不得）**；扫描根由 `repoRoot()` 派生（子目录 cwd 实测） | 负 | 静态 + 集成 | 常驻 | P0 |
| H06 | 三态·有产物（`spec:92`）/ 对计义 Q14（`spec:213`）/ PRD `:405` / R4 | 产物对已 commit 且工作树一致 → 0 findings，`archivePairs 1` / `scannedDirs 1` | 正 | 集成 | 常驻 | P0 |
| H07 | 三态·无产物且不在白名单（`spec:94`）/ **D9 账本-only 仍判红（`spec:194`）/ Q18（`spec:217`）** / 目录级 path（`spec:81`）/ Q5（`spec:204`）/ PRD `:407` `:410` / `ArtifactMissing`（`spec:140`）/ 锚点1 | 子目录无产物且不在白名单 → 恰 1 条 `ArtifactMissing`，`norm(path)` = `docs/superpowers/reviews/<次>`；**两形态**：仅 `progress.md` / **`progress.md`+`cards.md`+`problems.md`（全允许类账本）→ 后者仍红** | 负 | 集成 | 常驻 | P0 |
| H08 | 三态·有非产物文件（`spec:95`）/ 目录级 path + 杂件名留 message（`spec:81`）/ PRD `:408` / `UnclassifiedArtifact`（`spec:141`）/ 锚点1 | 子目录含 `random-notes.md` → `UnclassifiedArtifact`，`norm(path)` = `<次>`，**文件名只在 message** | 负 | 集成 | 常驻 | P0 |
| H09 | PRD `:408`「并列，非替代」/ 锚点1 | 杂件 + 缺产物 → 两码同时出现 | 负 | 集成 | 常驻 | P0 |
| H10 | PRD `:410` 允许文件名类 8 类（含 `cards/` 子层）/ R4 | 8 类齐放 → 无 `UnclassifiedArtifact`（`ArtifactMissing` 仍在） | 边界 | 集成 | 常驻 | P1 |
| H11 | §11.6 D1（`spec:186`）/ 根层散文件（`spec:99`，含「不套允许类白名单」）/ PRD `:408` / 锚点1 | 扫描根**根层**放 `notes.md` → 恰 1 条 `UnclassifiedArtifact`；**再放 `progress.md`（允许名）→ 仍恰 1 条红**；均不得出 `ArtifactMissing` | 负 | 集成 | 常驻 | P0 |
| H12 | PRD `:410` C-15（`spec:29`）/ `ATTACHMENT_RE`（`spec:32`）/ 锚点2 | `<次>/attachments/<file>` 一层 + 已提交产物对 → 0 findings | 边界 | 集成 | 常驻 | P1 |
| H13 | C-15「不得再嵌套」（`spec:29`）/ R4（子层靠纯函数判）/ 目录级 path（`spec:81`） | `attachments/a/b.md` 两层 → 恰 1 条 `UnclassifiedArtifact`，文件名只在 message | 负 | 集成 | 常驻 | P1 |
| H14 | §11.6 D1（`spec:186` / `spec:99`）/ PRD `:408` | 扫描根根层放 `observation-r1.json`（无归属）→ 仍判 `UnclassifiedArtifact`（产物名不豁免） | 负 | 集成 | 常驻 | P1 |
| H15 | §11.6 D2（`spec:187`）/ 成对判定（`spec:97`）/ `JsonNotFound`（`spec:144`）/ 锚点1 | 子目录只有 md、无同名 json → `JsonNotFound`，无 `ArtifactMissing` | 负 | 集成 | 常驻 | P0 |
| H16 | 成对判定（`spec:97`）/ S2 四段码透传（`spec:145`）/ 锚点1 | json 在而 md 缺 → 恰 1 条 `MdMissing`（不改码名） | 负 | 集成 | 常驻 | P0 |
| H17 | S2 四段码透传（`spec:145`）/ 锚点1 | json 结构错（`items: []`）→ `MissingItems` | 负 | 集成 | 常驻 | P0 |
| H18 | S2 四段码透传（`spec:145`）/ PRD §5.3 第 1 行 / 锚点1 | json 未改、md 手改一字 → `RenderMismatch` | 负 | 集成 | 常驻 | P1 |
| H19 | S2 四段码透传（`spec:145`）/ PRD §4.1 双实例 / `InstanceMissing` | 含 `check:'ai'` 条目但缺 `-a`/`-b` → `InstanceMissing` | 负 | 集成 | 常驻 | P2 |
| H20 | 码的用法边界（`spec:147`）/ Q8（`spec:207`）+ Q12（`spec:211`）/ PRD `:405` `:408` | 产物名大写后缀 `observation-r1-A.json` → `ArtifactMissing` + `UnclassifiedArtifact`，且**不报** `ArtifactNamingOff` | 边界 | 集成 | 常驻 | P2 |
| H21 | git 断言表（`spec:107-111`）/ PRD `:405` 第 7+10 行 / R5（`spec:47`）/ 锚点1 | 归档件已 commit 且工作树一致 → 无 `UntrackedArtifact` / `ArtifactDirty` | 正 | 集成 | 常驻 | P0 |
| H22 | finding 粒度（`spec:80`）/ Q5（`spec:204`）/ PRD `:405` / V-6 第 10 行 / `UntrackedArtifact`（`spec:142`）/ 锚点1 | 归档件未 `git add` → **恰 2 条** `UntrackedArtifact`（json + md 各一条），path 逐条精确 | 负 | 集成 | 常驻 | P0 |
| H23 | git 断言表（`spec:111`）/ PRD `:405` / V-6 第 7 行 / `ArtifactDirty`（`spec:143`）/ 锚点1 | 已提交后手改（追加换行，四段仍绿）→ `ArtifactDirty` | 负 | 集成 | 常驻 | P0 |
| H24 | R5 前置探测（`spec:109`）/ D3（`spec:188`）/ `RepoRootUnresolved`（`spec:139`）/ 锚点1 | 临时根不是 git 工作树（`rev-parse` 失败）→ `RepoRootUnresolved`（fail-closed） | 负 | 集成 | 常驻 | P0 |
| H25 | R5「spawn error / 超时 → 同码」（`spec:47`）/ D3（`spec:188`）/ `RepoRootUnresolved`（`spec:139`） | git 子进程起不来（子进程 `PATH` 为空 → spawn `ENOENT`）→ `RepoRootUnresolved` | 边界 | 集成 | 常驻 | P1 |
| H26 | finding 粒度（`spec:80`）/ Q5（`spec:204`）/ PRD `:405`「每个产物文件」/ 锚点1 | json 已跟踪干净、md 未跟踪 → `UntrackedArtifact` 的 path **逐字等于** `<次>/observation-r1.md` | 边界 | 集成 | 常驻 | P1 |
| H27 | R3（`spec:45`）/ 过程侧口径（`spec:103`）/ Q1（`spec:200`）/ PRD `:413` / 锚点3（`spec:239`） | 3 个过程目录、0 产物 → 0 findings，`processPairs 0`，无 `ArtifactMissing` | 正 | 集成 | 常驻 | P0 |
| H28 | R3（`spec:45`）/ 过程侧口径（`spec:103`）/ 零产物只跳归档侧（`spec:86`）/ PRD `:413` / Q16（`spec:215`） | 过程目录有合法产物（未跟踪）→ 0 findings，`processPairs 1`（不做 git 断言） | 正 | 集成 | 常驻 | P0 |
| H29 | R3「只做四段校验」（`spec:45` / `spec:103`）/ 锚点3 | 过程产物缺 md → `MdMissing`（四段真的跑） | 负 | 集成 | 常驻 | P1 |
| H30 | 过程侧口径（`spec:103`）/ Q7（`spec:206`）/ R3 | 过程目录只有 md → findings 为空（`JsonNotFound` / `ArtifactMissing` / `UnclassifiedArtifact` 均不出） | 边界 | 集成 | 常驻 | P1 |
| H31 | R3（`spec:45`）/ PRD `:413` / 锚点3 | 过程目录杂件（`progress.md` + `random.md`）→ 不出 `UnclassifiedArtifact` / `ArtifactMissing` | 边界 | 集成 | 常驻 | P1 |
| H32 | 迁移状态机（`spec:115`，**含第 0 步**）/ D9（`spec:194`）/ Q18（`spec:217`）/ PRD §5.1 `:387-394` 步骤 1、`:391` / F-22 / 锚点1 | **先做第 0 步（`writeObservation` 产出 `observation-r1.json|md`）再 move** → `UntrackedArtifact`，message 含「属预期」与「`git add`」；**不得出 `ArtifactMissing`**（跳过第 0 步只会得 `ArtifactMissing` = 阻断） | 正 | 集成 | 常驻 | P0 |
| H33 | 迁移状态机（`spec:115`）/ PRD `:393` 步骤 2-3 | `git add` 后两码消、0 findings | 正 | 集成 | 常驻 | P0 |
| H34 | 迁移状态机（`spec:115`）/ PRD `:394` 步骤 4 | `commit` 后绿保持 | 正 | 集成 | 常驻 | P1 |
| H35 | PRD `:405` + `:413` 两侧并存 / R3 | 迁移后 `.session` 副本仍在：归档侧报码、过程侧 0 findings（不双报） | 边界 | 集成 | 常驻 | P2 |
| H36 | §11.4「不自动迁移」（`spec:151`）/ §11.7 Q3（`spec:202`）/ 锚点1 | 跑 gate 前后 `HEAD` 与 `status --porcelain` 不变（0 git 写） | 边界 | 集成 | 常驻 | P0 |
| H37 | §11.2 旁路（`spec:117`）/ R6（`spec:48`）/ PRD `:396` 首行 / 锚点5（`spec:241`） | `CHECK_BYPASS=1` + reason → 首行 `BYPASS: <reason>`、⑥ 打印跳过行、exit 0 | 正 | e2e | 验收 | P0 |
| H38 | §11.6 D5（`spec:190`）/ PRD `:396` / 锚点5 | 未给 reason → `BYPASS: (未提供原因)`，仍跳过 | 边界 | e2e | 验收 | P1 |
| H39 | R6「其余段照跑且仍可红」（`spec:48`）/ 锚点5 | 旁路 + ⑤ 段构造红 → exit 1（证明只跳 ⑥） | 负 | e2e | 验收 | P0 |
| H40 | PRD `:396` / 锚点5 | 未设 `CHECK_BYPASS` → 输出无 `BYPASS:` 行（防"旁路常开"静默） | 边界 | e2e | 验收 | P1 |
| H41 | F-24 四出口（`spec:119-126`）/ R7（`spec:49`）/ PRD `:416` / §11.6 D4（`spec:189`）/ 锚点7（`spec:243`） | `EXEMPT_CARDS` 恰 15 且每项形如 `agents/<name>.md`（常驻）；集合与 `agents/*.md` 实跑相等 = **交付时点一次性核**（验收） | 正 | 单元 + e2e | 常驻 + 验收 | P0 |
| H42 | `disposeCardFindings`（`spec:126`）/ PRD `:416` C-08 / 锚点7 | 名单外卡 finding → `blockers` | 负 | 单元 | 常驻 | P0 |
| H43 | 未到期态（`spec:126`）/ Q9（`spec:208`）/ 锚点7 | 名单内 + `landed` 默认 `EXPIRY_LANDED=false` → `warnings`、`blockers` 空 | 边界 | 单元 | 常驻 | P0 |
| H44 | 到期注入签名（`spec:126`）/ Q9（`spec:208`）/ PRD `:416` 事件型 / 锚点7 | 名单内 + 注入 `{ landed: true }` → `blockers`、`warnings` 空；调用前后 `EXPIRY_LANDED` 同值 | 边界 | 单元 | 常驻 | P1 |
| H45 | 豁免窗口状态行模板（`spec:128`，含「**卡面**」限定词）/ Q20（`spec:219`）/ §11.6 D4（`spec:189`）/ 锚点7 | 常量值（`EXPIRY_EVENT` / `EXPIRY_LANDED`）+ `check` 按模板打印状态行（含「**卡面** findings n / 告警 w / 阻断 b」限定词 + 「（S1 未上线：非达标证据）」短语）；**n/w/b 取自 `disposeCardFindings([])` 返回值**，不写字面量 | 边界 | e2e | 验收 | P1 |
| H46 | skip 守卫单源与 TAP 解析（`spec:130`）/ Q19（`spec:218`，**只按名字、不比条数**）/ Q10（`spec:209`）/ R9（`spec:51`）/ 锚点6（`spec:242`） | TAP 内联正则解析 `ok N - <名> # SKIP …` 取名字；**解析集 ⊆** `SKIP_ALLOWLIST`（名单外名即红）；`# skipped > 0` 但解析出 0 个名字 → 判红（fail-closed）；spawn 的 env 删 `DW_RUNTIME_CHECK` | 正 | e2e | 验收 | P0 |
| H47 | 红时文案（`spec:130`）/ Q10（`spec:209`）/ R9 / 锚点6 | 插一条名单外 `skip` 测试 → 红，输出含 `[测试] 名单外 skip：<用例名>` | 负 | e2e | 验收 | P0 |
| H48 | 红时文案（`spec:130`）/ Q10（`spec:209`）/ R9「`# todo M` 同样核」/ 锚点6 | 插一条名单外 `todo` 测试 → 红，输出含 `[测试] 名单外 todo：<用例名>` | 负 | e2e | 验收 | P0 |
| H49 | 计数行（`spec:85`）/ Q6（`spec:205`）/ Q2 段序（`spec:201`）/ Q14（`spec:213`）/ **Q19（`spec:218`，不比条数 → v4 删掉 skipped 断言）** / 锚点4（`spec:240`） | `npm run check` exit 0 + ⑥ 计数行**可解析**（`/过程 \d+ 对/`）+ **单独断过程 0 对** + ⑤ 行在 ⑥ 之前；**不断言 `# skipped`**（条数判已删）；spawn 的 env 删 `DW_RUNTIME_CHECK` | 正 | e2e | 验收 | P0 |
| H50 | 锚点2（`spec:238`：「`scannedDirs ≥ 2 && archivePairs ≥ 1` + 按名断言两目录在位，不钉等值」）/ 锚点3（`spec:239`）/ PRD `:411` `:413` / Q16（`spec:215`） | 真实仓根全扫：`findings === []`、`scannedDirs ≥ 2`、`archivePairs ≥ 1`、`processPairs 0`、**无 `ArtifactMissing`**；**按名**断言 `2026-10-25-1723-s6-eval` 与 `2026-10-27-1200-migration-drill` 均在位；目录数只打印不判 | 正 | e2e | 验收 | P0 |
| H51 | 锚点8（`spec:244`）/ §11.6 D7（`spec:192`）/ Q11（`spec:210`） | 仓根 `node --test "tools/observation-check/*.test.mjs"` → `# tests ≥ 166`、`# fail 0`、`# pass + # skipped === # tests` | 边界 | e2e | 验收 | P0 |
| H52 | findings>0 → failed（`spec:70` / `spec:84`）/ 打印形态（`spec:84`）/ Q6（`spec:205`）/ `ArtifactMissing`（`spec:140`）/ 锚点1 | 真仓归档目录塞一个缺产物子目录 → exit 1 + `[observation] ArtifactMissing: docs/superpowers/reviews/<次> —— <msg>` | 负 | e2e | 验收 | P0 |
| H53 | R8（`spec:50`）/ §11.3 码表（`spec:134-147`）/ PRD §4.4 `:362` | 静态：`gate-run.mjs` 的码字面 ⊆ 4 个门禁码 + S2 源已出现码（自造码 = 0） | 边界 | 静态 | 常驻 | P0 |
| H54 | §11.2 D1 优先级（`spec:99`）/ PRD `:408` / 锚点1 | **根层散文件 + 0 子目录** → 仍红（`UnclassifiedArtifact`），**不是**「0 件，跳过」 | 负 | 单元 | 常驻 | P0 |
| H55 | R3「过程根不存在 → 0 对、不报码」（`spec:45` / `spec:103`）/ §11.5 过程目录口径末项（`spec:168`）/ 锚点3（`spec:239`） | 临时仓**不建** `.session/reviews` → `processPairs 0`、`findings === []`、**不出现 `ArtifactNamingOff`** | 边界 | 单元 | 常驻 | P0 |

### 1.1 覆盖核对（spec 项 → 用例对位；零行无对位）

| spec 项 | 用例 |
|---|---|
| R1 边界不动（不搬纯函数、不重写判据；D1/D2 例外显式登记，`spec:43` / `spec:193`） | H05、H11、H14、H15、H53 |
| R2 扫描根唯一（`spec:44`）：不收 root 形参、不加 CLI / env / 多根 | H05（静态 + 子目录 cwd 行为）、全部 gate 用例的 root 恒为 `<临时仓>/docs/superpowers/reviews` |
| R3 过程目录只四段、无三态、无成对、无 git；**过程根不存在 → 0 对、不报码**（`spec:45`） | H27、H28、H29、H30、H31、H35、**H55** |
| R4 三态与反向清单只调 S2 纯函数（`spec:46`） | H05（无自建判据副本）、H10、H12、H13、H20 |
| R5 git 两条断言 + 一条前置探测 + `timeout: 30000` + fail-closed（`spec:47` / `spec:107-111`） | H21、H22、H23、H24、H25、H26、H32、H05（timeout 静态） |
| R6 旁路只一条总开关、只跳 ⑥、首行打印（`spec:48`） | H37、H38、H39、H40 |
| R7 F-24 窗口登记件（15 卡 + 到期事件 + 处置纯函数 + 状态行，`spec:49`） | H41、H42、H43、H44、H45 |
| R8 不新增错误码（`spec:50`） | H17、H18、H19（透传码逐字）、H24/H25（`RepoRootUnresolved` 为已登记码）、H52（打印码逐字）、H53（码集合封闭） |
| R9 静默 skip 守卫（按用例名白名单，`spec:51` / `spec:130`） | H46、H47、H48 |
| §11.0.1 代号表（`spec:22-37`） | §0.2-1 / §0.2-3 的口径即取自该表（`scanReviewDir` 无 `path`、`repoRoot()` 有缓存） |
| 机制行①「顶部 bypass → 首行」（`spec:59`） | H37、H38 |
| 机制行②「①–⑤ 照旧（bypass 不影响）」 | H39 |
| 机制行③「⑥ 排在 ⑤ 之后、总出口之前」（`spec:61`） | H49（打印顺序） |
| 机制行④「bypass → 打印跳过、不判」（`spec:62`） | H37、H38 |
| 机制行⑤「归档：枚举 → 三态 → 四段 + git」（`spec:64-66`） | H06–H26 |
| 机制行⑥「过程：`observation-r*.json` 四段（无三态 / 无成对 / 无 git）」（`spec:67-68`） | H27–H31 |
| 机制行⑦「返回 `{scannedDirs, archivePairs, processPairs, findings[]}`」（`spec:69`） | H01（四字段齐 + 零值）、H06/H28（非零值） |
| 机制行⑧「findings>0 → failed=true，逐条打印 `[observation] <code>: <path> —— <message>`」（`spec:70`） | H52（打印形态 + exit 1）、H07（码与 path） |
| 机制行⑨「否则打印计数行」（`spec:71`） | H49 |
| §11.2 运行时接线模块：`runObservationGate()` 无参数、不 print（`spec:75`） | H05（静态 + 行为）、H01（子进程 stdout 只有 JSON） |
| §11.2 测试注入 = 子进程 cwd（`spec:77`） | §0.2-3 + 全部 gate 用例的步骤 |
| §11.2 归档三态表·有产物（`spec:92`） | H06、H15–H19、H21–H26、H32–H34 |
| §11.2 归档三态表·无产物但在白名单（`spec:93`） | H04、H10、H50 |
| §11.2 归档三态表·无产物且不在白名单（`spec:94`） | H07、H09、H20、H52 |
| §11.2 归档三态表·有非产物文件（并列，`spec:95`） | H08、H09、H11、H13、H14、H20 |
| §11.2 成对判定（孤立 md / json 在 md 缺，`spec:97`） | H15、H16 |
| §11.2 根层散文件与零产物优先级（D1，`spec:99`：不调 `scanReviewDir`、**不套允许类白名单**） | H11（含 `progress.md` 允许名反例）、H14、H54（0 子目录仍红）、H01（零分支成立条件）、H05 ②（不得要求根层复用 `ALLOWED_FILE_RE`） |
| §11.5 `formatGateLine(res)` 纯函数四形态（`spec:163`，不依赖真仓状态；含多条 `\n` 拼接） | H01（①零产物 ②有产物无 findings ③有 findings 单条 ④多条 `\n` 拼接） |
| §11.5 ⑥ 段**文案单源**（`spec:164`：必须调 `formatGateLine(`、不得内联字面量） | H05 ⑥b / ⑥c（⑥c 覆盖**两种**字面量：计数行 + `[observation]` 前缀） |
| §11.6 D9 + §11.7 Q18（`spec:194` / `spec:217`）：只含允许类账本的归档子目录**仍判 `ArtifactMissing`** | H07 形态 b（`progress.md`+`cards.md`+`problems.md` → 仍恰 1 条 `ArtifactMissing`、无 `UnclassifiedArtifact`） |
| §11.7 Q19（`spec:218`）：skip 守卫**只按名字、不比条数** | H46 ①（解析集 ⊆ 名单）+ 判据②；**H49 不设 skipped 断言** |
| §11.7 Q20（`spec:219`）：豁免行「**卡面** findings」限定词与 ⑥ 段 `findings` 不同量 | H45（正则含 `卡面 findings`） |
| §11.2 扫描根不可用（`spec:101`） | H02（不存在）、H03（不可枚举） |
| §11.2 过程侧口径（`spec:103`，「过程根不存在 → `processPairs 0`、不报码」） | H27、H28、H29、H30、H31、H35、H55 |
| §11.2 git 断言表（`spec:107-111`）+ `-N` 备忘（`spec:113`） | H21、H22、H23、H26（`-N` 备忘见 §5 第 12 条） |
| §11.2 迁移状态机（`spec:115`，含 D9 第 0 步） | H32（第 0 步先产出 → 无 `ArtifactMissing`）、H33、H34、H35、H36 |
| §11.2 旁路（`spec:117`） | H37、H38、H39、H40 |
| §11.2 F-24 四出口（`spec:119-126`） | H41（`EXEMPT_CARDS`）、H42/H43/H44（`disposeCardFindings`）、H45（`EXPIRY_EVENT` / `EXPIRY_LANDED` / 状态行） |
| §11.2 状态行模板（`spec:128`，含「卡面」限定词 / Q20 `spec:219`） | H45（模板 + 「卡面」+ 非达标短语 + 两值打印 + n/w/b 取自真实返回） |
| §11.2 静默 skip 守卫（`spec:130`） | H46、H47、H48 |
| §11.2 finding 形状与粒度（`spec:79-81` / Q5 `spec:204`） | H07（目录级 path）、H08/H13（path 到 `<次>/`、文件名在 message）、H22（恰 2 条）、H26（path 逐字）、H52（打印 path 逐字） |
| §11.2 输出全部由 `check-all` 打印（`spec:83-86`，文案来自 `formatGateLine`）/ Q6 `spec:205` / `scannedDirs` 计义 `spec:85` | H01（**四**形态逐字 + gate 不打印）、H49（计数行可解析 + 过程 0 对 + 跳过后缀缺席）、H52（findings 行逐字） |
| §11.2 「对」的计义（Q14 `spec:213`） | H06（`archivePairs 1`）、H28（`processPairs 1`）、H49（过程 0 对） |
| §11.2 dispose 注入签名（`spec:126` / Q9 `spec:208`） | H43（不传 `landed`）、H44（注入 `{landed:true}`） |
| §11.2 skip 白名单单源 + TAP 内联正则 + **只按名字（Q19 `spec:218`）**（`spec:130` / Q10 `spec:209`） | H46（import `SKIP_ALLOWLIST` + TAP 内联正则解析名 + 解析集 ⊆ 名单 + fail-closed，**不比条数**）、H47（skip 红文案）、H48（todo 红文案） |
| §11.2 施工期预期红（`spec:132` / Q17 `spec:216`） | H32（message 含「属预期」）、H33（add 后绿） |
| §11.3 码的用法边界（`spec:147` / Q8 `spec:207` + Q12 `spec:211`） | H20（不报 `ArtifactNamingOff`；大写后缀不算产物） |
| §11.5 / Q11 验收类载体（`spec:174` / `spec:210`） | H37–H52 的执行列一律「验收」（不落 `*.test.mjs`；载体 = plan 命令清单 + `gate-record.md`） |
| §11.3 `ArtifactNamingOff`（`spec:138`） | H02、H03；**反例** H20（不扩用）、H24/H25（git 故障不报此码）、H55（过程根不存在也不报此码） |
| §11.3 `RepoRootUnresolved`（`spec:139` / D3 `spec:188`） | H24、H25 |
| §11.3 `ArtifactMissing`（`spec:140`） | H07、H09、H10、H20、H50、H52 |
| §11.3 `UnclassifiedArtifact`（`spec:141`） | H08、H09、H11、H13、H14、H20、H54 |
| §11.3 `UntrackedArtifact`（`spec:142`） | H22、H26、H32、H35 |
| §11.3 `ArtifactDirty`（`spec:143`） | H23 |
| §11.3 `JsonNotFound`（`spec:144` / D2 `spec:187`） | H15 |
| §11.3 S2 四段码原样透传（`spec:145`） | H16（`MdMissing`）、H17（`MissingItems`）、H18（`RenderMismatch`）、H19（`InstanceMissing`）、H29（`MdMissing`） |
| §11.6 D1（`spec:186`） | H11、H14、H54 |
| §11.6 D2（`spec:187`） | H15、H16 |
| §11.6 D3（`spec:188`） | H24、H25、H53 |
| §11.6 D4（`spec:189`） | H45（非达标短语）、H41（窗口登记件） |
| §11.6 D5（`spec:190`） | H38 |
| §11.6 D6（`spec:191`） | H46、H47、H48 |
| §11.6 D7（`spec:192`） | H51 |
| §11.6 D8（`spec:193`） | H11、H14（D1 载体 = `gate-run`）、H05（R1 例外显式登记） |
| §11.10 锚点1 门禁真红（`spec:237`） | H01–H03、H07–H09、H11–H20、H22–H26、H52、H54 |
| §11.10 锚点2 归档现状不误红（`spec:238`：下界 `scannedDirs ≥ 2 && archivePairs ≥ 1` + 按名断言两目录） | H06、H50 |
| §11.10 锚点3 过程目录口径（`spec:239`） | H27、H28、H50、H55 |
| §11.10 锚点4 仓门禁不红 + ⑥ 计数（`spec:240`） | H49 |
| §11.10 锚点5 旁路可用且留痕（`spec:241`） | H37、H38、H39、H40 |
| §11.10 锚点6 skip 守卫（`spec:242`） | H46、H47、H48 |
| §11.10 锚点7 F-24 窗口登记（`spec:243`） | H41、H42、H43、H44、H45 |
| §11.10 锚点8 命令写法统一（`spec:244`） | H51 |
| PRD §5.3 V-6 第 7 / 10 行（S3 部分，`:437-440` / `:563`） | H23（第 7 行）、H22（第 10 行） |
| PRD §5.3 V-6 第 8 / 9 行（S3 部分） | H08（第 8 行）、H07（第 9 行） |
| PRD §9.3 M-2 S3 部分（`:584`） | H07–H09、H11–H19、H22–H26、H52、H54（构造式反例全红） |
| PRD §5.1 `:391`「步骤 1 报码属预期」 | H32（message 含「属预期」） |
| PRD §5.2 `:414` 零产物两互斥分支 | H01 vs H02/H03；H01 vs H54（0 子目录 vs 0 子目录 + 根层散文件） |
| PRD §5.2 `:416` 15 卡豁免窗口 | H41–H45 |

### 1.2 落点与夹具约定

- **落点**（plan 可微调文件名，不得改判据）：
  - `tools/observation-check/gate-run.test.mjs`（新）：H01–H36、H53、H54、**H55**（单元 / 集成，全部 mkdtemp 自建 + 子进程注入；H01 的 `formatGateLine` 四形态也在本文件）
  - `tools/observation-check/card-exempt.test.mjs`（新）：H41–H44（纯函数；H41 的集合相等半段除外，见下）
  - **验收类（H37–H40、H45–H52，共 12 条）不落 `*.test.mjs`**（Q11 `spec:210` / §11.5 `spec:174`）：一律写进 **plan 收尾任务的命令清单**，执行后把「命令输出首行 + 退出码」贴 `gate-record.md`。理由 = 落进 `*.test.mjs` 会被 ② 段 `**/*.test.mjs` 全仓 glob（`scripts/check-all.mjs` 的 ② 段 `--test '**/*.test.mjs'` 调用处）收进去 → 每轮 `npm run check` 自跑一次 `check-all`（递归 + 时长翻倍）。**不钉 `# tests` 增量**（Q11 `spec:210`）：兜底判据 = H51 的 `# pass + # skipped === # tests` 且 `# tests ≥ 166`。
  - 两个「双段」用例（H01、H41）：①**H01 = 三段（文案 / 结构 / e2e）**：`formatGateLine(res)` **四形态**逐字（常驻、不依赖真仓）+ gate 返回结构与不打印（常驻）+ e2e「只移演练件后扫到 1 个子目录 / 归档 0 对 / findings 0」（验收；见 §0.2-7）；②H41 = 15 项 + 形态（常驻）+ 集合与 `agents/*.md` 相等（验收，交付时点一次性核）。
- **共用夹具助手**（各测试文件内本地实现，不新增生产模块）：
  ```js
  import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
  import { spawnSync } from 'node:child_process'
  import { pathToFileURL } from 'node:url'
  import os from 'node:os'

  const GATE_URL = pathToFileURL(join(HERE, 'gate-run.mjs')).href          // HERE = 本测试文件目录
  const DRIVER = `const { runObservationGate } = await import(${JSON.stringify(GATE_URL)});
  process.stdout.write(JSON.stringify(await runObservationGate()))`

  const git = (repo, ...args) => {
    const x = spawnSync('git', args, { cwd: repo, encoding: 'utf8' })
    assert.strictEqual(x.status, 0, `git ${args.join(' ')}: ${x.stderr}`)
    return x
  }
  const mkRepo = ({ session = true } = {}) => {                               // 临时 git 仓 + 根目录
    const r = mkdtempSync(join(os.tmpdir(), 's3-gate-'))
    git(r, 'init'); git(r, 'config', 'user.email', 't@t'); git(r, 'config', 'user.name', 't')
    git(r, 'commit', '--allow-empty', '-m', 'init')          // 必须先有 HEAD，否则 H36 的 rev-parse HEAD exit 128
    mkdirSync(join(r, 'docs', 'superpowers', 'reviews'), { recursive: true })
    if (session) mkdirSync(join(r, '.session', 'reviews'), { recursive: true })   // H55 传 { session: false }
    return r
  }
  // TAP 内联指令解析（spec:130 定死的唯一形态，§0.2-8）：名字取第 1 捕获组，reason 丢弃
  const TAP_DIRECTIVE = /^\s*(?:not )?ok\s+\d+\s+-\s+(.*?)\s+#\s+(SKIP|TODO)\b/
  const tapNames = (out, kind = 'skip') => out.split(/\r?\n/)
    .map(l => l.match(TAP_DIRECTIVE))
    .filter(m => m && m[2].toLowerCase() === kind)
    .map(m => m[1].trim())
  const runGate = (repo, { cwd = repo, env = process.env } = {}) => {       // 子进程注入（Q13 spec:212）
    const x = spawnSync(process.execPath, ['--input-type=module', '-e', DRIVER], { cwd, env, encoding: 'utf8' })
    assert.strictEqual(x.status, 0, x.stderr)      // gate 不抛栈（spec:75）
    assert.strictEqual(x.stderr.trim(), '')        // gate 不 print（spec:75）
    return JSON.parse(x.stdout)                    // stdout 必须是纯 JSON（H01 也据此判「不打印」）
  }
  const norm = (p) => String(p).replace(/\\/g, '/').replace(/\/+$/, '')
  ```
  临时 git 仓库的 `git init` / `add` / `commit` / 手改全部发生在**系统临时目录**（本文件不触碰真仓的索引与历史；H01 文案段 / H39 / H47 / H48 / H52 例外，见其 finally 条款），且每个临时仓在 `finally` 里 `rmSync(r, { recursive: true, force: true })`。
- **回归纪律**：本文件任何用例不得以"引用 `agents/` 或仓内现有产物当夹具"的方式换取绿灯（H41 验收半段例外已在 §0.2-4 说明）。

## 2 用例明细

编号 `H01`–`H55`（H = gate wiring），按文件顺序连续不跳号：H54 = v2 新增（第 1 轮卡 Q-1-BE4，K 组）、H55 = v3 新增（第 2 轮卡 Q-2-BE4，L 组）。每条只测一件事，含五要素（覆盖 / 前置 / 步骤 / 预期 / 判据）+ 来源 / 红绿证据 / 对应测试 / 不覆盖。

**共用前置（每例默认成立，除特别说明）**：
- 被测入口 = `tools/observation-check/gate-run.mjs` 导出的 `runObservationGate()`——**无参数**（`spec:75`）；根由 `repoRoot()`（`spec:36`）派生，且 `repoRoot()` 有进程内缓存（`tools/observation-check/evidence.mjs:39-41`）→ **必须在子进程里调用**（`spec:77` / Q13 `spec:212`）。同模块另有纯函数 `formatGateLine(res)`（`spec:75`），文案用例直接 import 直测、**不 spawn**。
- 注入助手 = `runGate(repo, { cwd, env })`（见 §1.2）：`spawn` `process.execPath`（绝对路径，不依赖 `PATH`）+ `--input-type=module -e <driver>`，`cwd` = 临时 git 仓（或仓内子目录，见 H05），回读 stdout 的纯 JSON。**该形态 v2 本轮已实测可用**（Node v22.12.0，`node --input-type=module -e "await import('file:///…/gate-scan.mjs')"` 正常返回命名导出）。
- 「扫描根」恒 = `<临时仓>/docs/superpowers/reviews`，「过程根」恒 = `<临时仓>/.session/reviews`（R2 唯一根 `spec:44`）。`mkRepo()` 已代建两个空目录**并做一次 `commit --allow-empty`**（否则 H36 的 `git rev-parse HEAD` 会是 exit 128）。**只在本用例专测缺失形态时才不建**：H02/H03（扫描根）、**H55**（过程根；`mkRepo({ session: false })`）。其余用例若缺任一根，会把判据污染成另一条码（`ArtifactNamingOff`，`spec:101`）。
- 合法产物按 §0.2-5 构造；「已提交」= 临时仓内 `git add` + `git commit -m`。
- **判据里的「恰 N 条」型用例，前置必须保证没有多余码来源**：除专测 git 三码的用例外，产物对一律 `git add` + `commit`（第 1 轮卡 Q-1-QA3）。
- TAP 解析统一用 `tapNames(out, 'skip' | 'todo')`（§1.2），即 spec `spec:130` 定死的内联指令正则；**不解析独立 `# SKIP` 行**（不存在，§0.1-14）。

### A 组：扫描根、零产物与静态边界（F-17 / R1 / R2 / R4）

#### H01 `formatGateLine` 四形态逐字（含多条 `\n` 拼接）+ gate 返回结构与不打印 + e2e（只移演练件）

- **覆盖**：§11.5 `formatGateLine` 纯函数**四种形态**（`spec:163`，含「多条 findings → 逐行 `\n` 拼接、顺序 = 数组顺序」）/ §11.2 打印形态（`spec:83-86`：有 findings / 无 findings / 零产物）/ D1 零产物（`spec:99`）/ Q6（`spec:205`）/ R2（`spec:44`）/ PRD §5.2 `:414` / 锚点1（`spec:237`）
- **来源**：`spec:163` 要求「`formatGateLine(res)` 三种形态的文案**逐字断言**，**不依赖真仓状态**；**多条 findings → 逐行 `\n` 拼接**（顺序 = findings 数组顺序）」——理由原文：「只测单条则『逐条打印』退化为『只打首条』」（第 3 轮卡 Q-3-QA1）；另引第 2 轮卡 Q-2-QA2 / Q-2-BE1 / Q-2-AI2 —— v2 用「移走 2 个归档子目录造 0 子目录」的 e2e 会撞 `policy-pure-source.test.mjs:1580` 的 `*-s6-eval` 恰 1 个不变量（见 §0.1-13）；`spec:85` 定死计数行与 `scannedDirs` 计义；`spec:86` 定死「（**归档** 0 件，跳过）」且只跳归档侧；`spec:99` 定死零分支成立条件；`spec:75` 定死「gate 不在模块内 print」。
- **前置**：①文案段 = `mkRepo()` 即可（纯函数，**不 spawn、不碰真仓**）；②结构段 = `mkRepo()`（两空根目录：0 子目录 + 0 散文件）；③e2e 段 = 真仓根，只把 `docs/superpowers/reviews/2026-10-27-1200-migration-drill` 移到**仓外** `mkdtempSync(join(os.tmpdir(),'s3-archive-stash-'))` 暂存（**保留 `2026-10-25-1723-s6-eval` 不动**；**不得**放进 `.session/tmp/`，否则 ⑤ 段收尾检查必红、exit 0 不可达），`finally` 必须移回。
- **步骤**：
  ① 文案段（常驻，直测纯函数）：`import { formatGateLine } from './gate-run.mjs'`，分别喂**四种**返回结构——
     a. 零产物：`{scannedDirs:0, archivePairs:0, processPairs:0, findings:[]}`；
     b. 有产物无 findings：`{scannedDirs:1, archivePairs:1, processPairs:0, findings:[]}`；
     c. 有 findings（单条）：`{scannedDirs:1, archivePairs:1, processPairs:0, findings:[f1]}`，`f1 = {code:'ArtifactMissing', path:'docs/superpowers/reviews/x/', message:'无产物'}`；
     d. **多条 findings（字母序与数组序相反）**：`{scannedDirs:1, archivePairs:1, processPairs:0, findings:[g1, g2]}`，`g1 = {code:'RenderMismatch', path:'docs/superpowers/reviews/x/observation-r1.md', message:'md 与渲染不一致'}`、`g2 = {code:'ArtifactMissing', path:'docs/superpowers/reviews/x/', message:'无产物'}`——**`g1` 的码 `RenderMismatch` 在字母序上排在 `g2` 的 `ArtifactMissing` 之后**，故「按数组顺序输出」与「按码排序输出」会得出两种不同文本（第 4 轮卡 Q-4-QA-P2）；
    取 `formatGateLine(x)` 的返回值逐字比对。
  ② 结构段（常驻）：`const res = runGate(repo)`（子进程 cwd = 临时 git 仓）。
  ③ e2e 段（验收）：移走演练目录后 `spawnSync(process.execPath, ['scripts/check-all.mjs'], { cwd: 仓根, encoding:'utf8' })`，`out` = stdout + stderr 合并；`finally` 移回并核 `git status --porcelain -- docs/superpowers/reviews` 为空串。
- **预期**：
  ①a = `⑥ 观察产物门禁：扫描 0 个子目录 / 归档 0 对 / 过程 0 对 / findings 0（归档 0 件，跳过）`；
  ①b = `⑥ 观察产物门禁：扫描 1 个子目录 / 归档 1 对 / 过程 0 对 / findings 0`（**无**「跳过」后缀）；
  ①c = 单行 `[observation] ArtifactMissing: docs/superpowers/reviews/x/ —— 无产物`（逐条一行、格式 `code: path —— message`）；
  ①d = **两行、固定 `\n` 连接、顺序 = 数组顺序**：先 `[observation] RenderMismatch: docs/superpowers/reviews/x/observation-r1.md —— md 与渲染不一致`，再 `\n` + `[observation] ArtifactMissing: docs/superpowers/reviews/x/ —— 无产物`（**注意：若实现按码字母序排序，会输出 `ArtifactMissing` 在前 → 与期望相反，必红**）；
  ②`findings === []`、`scannedDirs === 0 && archivePairs === 0 && processPairs === 0`、四字段齐、子进程 stdout 纯 JSON 且 stderr 空；
  ③`check-all` exit 0，输出含 `⑥ 观察产物门禁：扫描 1 个子目录 / 归档 0 对 / 过程 0 对 / findings 0`，且该行**不含**「（归档 0 件，跳过）」。
- **判据**：
  ①`assert.strictEqual(formatGateLine(a), '⑥ 观察产物门禁：扫描 0 个子目录 / 归档 0 对 / 过程 0 对 / findings 0（归档 0 件，跳过）')` && `assert.strictEqual(formatGateLine(b), '⑥ 观察产物门禁：扫描 1 个子目录 / 归档 1 对 / 过程 0 对 / findings 0')` && `assert.strictEqual(formatGateLine(c), '[observation] ArtifactMissing: docs/superpowers/reviews/x/ —— 无产物')` && **①d** `assert.strictEqual(formatGateLine(d), '[observation] RenderMismatch: docs/superpowers/reviews/x/observation-r1.md —— md 与渲染不一致\n[observation] ArtifactMissing: docs/superpowers/reviews/x/ —— 无产物')`（四处**逐字**相等，含固定 `\n` 与数组顺序；①d 的 `g1` 码字母序**大于** `g2` 码，故「排序输出」与「数组顺序输出」文本不同、可被区分；不等即红并打印 `JSON.stringify(formatGateLine(x))` 便于看出 `\n` 与空白差异）；
  ②`assert.deepEqual(res.findings, []) && res.scannedDirs === 0 && res.archivePairs === 0 && res.processPairs === 0` && `['scannedDirs','archivePairs','processPairs','findings'].every(k => k in res)`（`runGate` 内部已断言 stderr 空 + stdout 可解析）；
  ③`status === 0` && `out.includes('⑥ 观察产物门禁：扫描 1 个子目录 / 归档 0 对 / 过程 0 对 / findings 0')` && `!/（归档 0 件，跳过）/m.test(out)`；
  ④`finally` 后演练目录已移回 + `git status --porcelain -- docs/superpowers/reviews` 为空串 + `2026-10-25-1723-s6-eval` 目录**全程在位**（`existsSync` 前后均为 true）。
- **红绿证据**：红 = 文案与 `spec:85` 结构不符（四个计数位置漂移 / 零分支缺「（归档 0 件，跳过）」→ 零产物与"扫了但全绿"不可区分）/ 多条 findings 只打首条（`spec:163` 的「逐条」退化为「只打首条」）/ 用 `\r\n` 或 `,` 拼（非固定 `\n`）/ gate 自己 print（stdout 混入非 JSON）；或 e2e 构造踩了自家不变量（移 s6-eval → `policy-pure-source` 红，测的不是被测门）；或零分支写成「整体 return 空」导致过程侧也不扫（`spec:86` 被破）；绿 = 三段判据全过。
- **对应测试**：①②常驻 = `gate-run.test.mjs`（① 直测 `formatGateLine`，不 spawn；含 ①d 多条拼接）；③验收命令（plan 收尾命令清单；全局态：仓外暂存演练目录、`finally` 恢复；输出贴 `gate-record.md`）
- **不覆盖**：真实仓根的归档计数与目录名（H50）；`⑥` 行在 findings>0 时的**端到端**形态（H52；多条拼接的**纯函数**面由本条 ①d 覆盖）；零分支下过程侧**真的被扫**的行为（H28 用「过程侧有产物 → `processPairs 1`」证）。

#### H02 扫描根不存在 → `ArtifactNamingOff`

- **覆盖**：§11.2 扫描根不可用（`spec:101`）/ §11.3 `ArtifactNamingOff`（`spec:138`）/ PRD `:414` / 锚点1
- **来源**：`spec:101`「扫描根不存在、或 `readdir` 抛错 → `ArtifactNamingOff` 红（防『路径写错』当成『没有产物』）」的反例侧
- **前置**：临时 git 仓（`git init` 但不建 `docs/superpowers/reviews`；只建 `.session/reviews`）。
- **步骤**：`const res = runGate(repo)`。
- **预期**：`findings` 恰 1 条，`code === 'ArtifactNamingOff'`，`norm(path)` 以 `docs/superpowers/reviews` 结尾。
- **判据**：`res.findings.length === 1 && res.findings[0].code === 'ArtifactNamingOff' && norm(res.findings[0].path).endsWith('docs/superpowers/reviews')`（`spec:81`：`path` 为仓内 POSIX 相对路径；扫描根不可用时 spec 未定「带不带尾斜杠」，故按归一后结尾比对）。
- **红绿证据**：红 = 扫描根缺失被静默当零产物（路径写错的门禁等于没有）；绿 = 明确报 `ArtifactNamingOff`。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：「扫描根是文件」的另一形态（H03）；`path` 的逐字形态（spec 未定，见判据）。

#### H03 扫描根不可枚举（路径是文件）→ `ArtifactNamingOff`

- **覆盖**：§11.2 扫描根不可用（`spec:101`）/ `ArtifactNamingOff`（`spec:138`）/ 锚点1
- **来源**：`spec:101` 的「不可枚举」字面义务——`readdir` 抛错必须收敛为码，不得冒泡把整段 `check` 打崩（同 PRD §4.2 异常纪律）
- **前置**：临时 git 仓内把 `docs/superpowers/reviews` **建成文件**（`writeFileSync`），使 `readdirSync` 抛 `ENOTDIR`。
- **步骤**：`const res = runGate(repo)`（`runGate` 已断言子进程 exit 0 且 stderr 空 = 不抛栈）。
- **预期**：不抛异常；`findings` 含 `ArtifactNamingOff`。
- **判据**：`runGate` 不抛（`status === 0` 且 stdout 可解析为 JSON）&& `res.findings.some(f => f.code === 'ArtifactNamingOff')`。
- **红绿证据**：红 = `ENOTDIR` 冒泡（子进程非 0 退出，整段 `check` 以堆栈中止、后面各段连带丢失）；绿 = 收敛为码。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：权限类不可枚举（Windows ACL 差异，见 §5 第 8 条）。

#### H04 目录全在存量白名单 → 0 findings（不追溯）

- **覆盖**：三态·存量白名单（`spec:93`）/ `STOCK_DIR_WHITELIST`（`spec:33`）/ PRD `:411` / 锚点2（`spec:238`）
- **来源**：PRD `:411`「存量目录白名单（按目录名，一次性）」，`[已决·代裁 C-14]` 的「绿（不追溯）」
- **前置**：临时 git 仓内建 `docs/superpowers/reviews/2026-10-25-1723-s6-eval/`（两形态各跑一次：空目录 / 放一个 PRD `:412` 白名单内的 `rubric.md`）。
- **步骤**：`runGate(repo)`（两形态各一次，各自独立临时仓）。
- **预期**：0 findings（`ArtifactMissing` 不得出现）。
- **判据**：`assert.deepEqual(res.findings, [])`（两形态各断言一次）。
- **红绿证据**：红 = 白名单目录被当成缺产物报红（存量每轮误红 → 门禁公信力归零）；或白名单写成前缀匹配（`2026-10-25-1723-*` 会让任意仿名目录免检，方向由 H07 反向锁）；绿 = 不追溯。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：白名单目录里 9 个精确路径的**逐文件**正例（`STOCK_FILE_WHITELIST` 由 S2 纯函数直接覆盖，S2 testcase G05 已测；本文件只测接线把**目录名**传对）。

#### H05 静态边界：无 root 形参、无自建判据副本、生产调用点唯一、扫描根由 `repoRoot()` 派生

- **覆盖**：R1（`spec:43`）/ R2（`spec:44`）/ R4（`spec:46`，含**根层分支不调 `scanReviewDir`、不套允许类白名单**）/ R5 timeout（`spec:47`）/ Q13（`spec:212`）/ §11.4「不加开关」（`spec:154`）/ §11.5 ⑥ 段**文案单源**（`spec:164`）/ PRD `:400` `:424`
- **来源**：PRD `:424`「root 保持可传参 → 传 `C:\` 即全盘合法；替代 = root 唯一来源 = git 顶层，**接口删掉该参数**」+ R2（`spec:44`）+ R4（`spec:46`「S3 不另写允许类 / 白名单 / 产物正则」**且**「根层分支不调 `scanReviewDir`、不套允许类白名单」）+ R5（`spec:47`「三条均带 `cwd = repoRoot()` 与 `timeout: 30000`」）+ `spec:99`（根层只允许 `ARTIFACT_RE` 区分产物名、写进 `message`）。**v3 修正**（第 2 轮卡 Q-2-QA5 / Q-2-BE2 / Q-2-AU4 / Q-2-AI5）：v2 ② 的措辞读起来像是要求「根层也按允许类判」，与 `spec:99` 冲突 → 拆成 ②（不许自建常量）与 ③（**根层不得套 `ALLOWED_FILE_RE`**）。**v4 增补**（第 3 轮卡 Q-3-AI1）：按 `spec:164`「`check-all` 的 ⑥ 段**文案单源**——源码必须调用 `formatGateLine(`、且**不得内联** ⑥ 段字面量文案（否则手拼字面量后 H01/H49/H52 仍全绿，文案退回两处维护）」→ ⑥ 增两条静态断言。
- **前置**：`tools/observation-check/gate-run.mjs` 与 `scripts/check-all.mjs` **均已落地**；另备一个临时 git 仓（行为断言用）。
- **步骤**：读 `gate-run.mjs` 源码文本 `src`（并取去掉 import / `from` 行的正文 `body`），跑静态断言 ①–④；再跑行为断言 ⑤；最后按仓内**生产文件清单**跑 ⑥（含 ⑥ 段文案单源的两条）。
  ① **无 root 形参**（允许任意声明形态）：抽取 `runObservationGate` 的声明形参——
     `/(?:export\s+)?(?:async\s+)?function\s+runObservationGate\s*\(([^)]*)\)/` 或 `/(?:export\s+)?(?:const|let|var)\s+runObservationGate\s*=\s*(?:async\s*)?\(([^)]*)\)/` → 形参串 `trim() === ''`；且源码无位置参数 / env 型第二根来源：`!/process\.argv/.test(src)`、`!/process\.env\.[A-Z_]*(ROOT|DIR)[A-Z_]*/.test(src)`；且确实从 `./evidence.mjs` 取根：`/from\s+['"]\.\/evidence\.mjs['"]/.test(src) && /\brepoRoot\s*\(/.test(src)`。
  ② **无自建允许类 / 白名单 / 产物正则**（任意声明形态）：`!/(?:export\s+)?(?:const|let|var)\s+(ARTIFACT_RE|ALLOWED_FILE_RE|ATTACHMENT_RE|STOCK_DIR_WHITELIST|STOCK_FILE_WHITELIST)\s*=/.test(src)`；若用到 `ARTIFACT_RE`，必须 `from './gate-scan.mjs'` 引入（不新写正则字面量）。
  ③ **根层不套允许类白名单**（`spec:99`）：`!/ALLOWED_FILE_RE/.test(body)`——即除 import 行外，`gate-run.mjs` 正文**不得**引用 `ALLOWED_FILE_RE`（子目录内的允许类判定只发生在 `scanReviewDir` 里，`spec:31` / `spec:46`）。`ARTIFACT_RE` **允许**出现（只用于区分「产物名 / 非产物名」并写 `message`），不得据此放行根层文件。
  ④ **只调 S2 纯函数 + timeout**：`/from\s+['"]\.\/gate-scan\.mjs['"]/.test(src)`（`scanReviewDir`）且 `/from\s+['"]\.\/artifact\.mjs['"]/.test(src)`（`validateArtifact`）；git 三命令的 `timeout` 为 30000：`/timeout\s*:\s*30000/.test(src)`。
  ⑤ **扫描根由 `repoRoot()` 派生（行为式）**：临时 git 仓内建 `docs/superpowers/reviews/2026-10-27-1000-r1/` 合法产物对并提交，同在仓内建 `tools/` 目录；`runGate(repo, { cwd: join(repo,'tools') })` → `scannedDirs === 1 && archivePairs === 1 && findings === []`。
  ⑥ **生产调用点 = 1 + ⑥ 段文案单源**：读 `scripts/check-all.mjs` 源码 `ca`。a) 扫全部生产文件（`scripts/**/*.mjs` + `tools/**/*.mjs`，排除 `*.test.mjs`）中匹配 `/runObservationGate\s*\(/` 且**不是定义行**（排除 `function runObservationGate`）的行 → 恰 1 行，位于 `scripts/check-all.mjs`，且该行实参为空（`/runObservationGate\s*\(\s*\)/`）；b) `/formatGateLine\s*\(/.test(ca) === true`（`check-all` 必须**调用**该纯函数产生文案）；c) **两处字面量都不得内联**（`spec:164`）：`!/⑥\s*观察产物门禁：扫描/.test(ca) === true`（不得内联计数行）**且** `!/\[observation\]/.test(ca) === true`（不得内联 findings 行前缀——`[observation]` 只能由 `formatGateLine` 的返回值带出，v5 按第 4 轮卡 Q-4-AI-P2 追加）。
- **预期**：①–④、⑥ 全过；⑤ `scannedDirs 1` / `archivePairs 1` / `findings []`。
- **判据**：①–⑥ 布尔断言全真（任一假 → 红，并打印命中的片段 / 调用点列表以便排障；⑥c 命中时打印该内联行，`[observation]` 与计数行两种字面量分别报）。
- **红绿证据**：红 = 第二份实现（两份判据必漂，正是 S2/S3 边界被破的形态）；或保留 `root` 形参 / 加 `--root` / 环境变量开关（传 `C:\` 即全盘合法）；或把 `ALLOWED_FILE_RE` 用到根层（`progress.md` 在根层被放行 → 与 `spec:99` 冲突，H11 会红）；或 `check-all` 手拼 ⑥ 段字面量而不调 `formatGateLine`（文案退回两处维护、H01/H49/H52 仍全绿 → `spec:164` 被破；`[observation]` 前缀或计数行任一被内联即命中 ⑥c）；或扫描根取 `process.cwd()`（⑤ 在 `cwd = <repo>/tools` 下会得到 0 子目录 → 必红）；或漏 `timeout`（无超时遇锁无界等待，Q15 `spec:214`）；绿 = 单源 + 单根 + 根层不放行 + 唯一调用点 + 文案单源。
- **对应测试**：`gate-run.test.mjs`（静态 + 行为段）
- **不覆盖**：运行期行为细目（H01–H36 是行为侧）；`gate-scan.mjs` 自身判据不变（那是 S2 的 166 条测试 + spec R1 的 scope，S3 不重复测）；「日后加个 `rootOverride` 选项」这类语义扩展（⑥a 只锁当前调用点，语义面靠 R2 规则）；`formatGateLine` **函数体**的渲染细节（由 H01 四形态行为断言覆盖，静态只锁「谁产生文案」）。

### B 组：归档三态与反向清单（F-18 / F-19 / R4）

#### H06 有产物 + 已提交 + 工作树一致 → 0 findings

- **覆盖**：三态·有产物（`spec:92`）/ 对计义（Q14 `spec:213`）/ PRD `:405` / R4 / 锚点1、锚点2
- **来源**：三态绿分支。S2 纯函数已测「判绿」，本段要测的是**接线把入参接对了**：目录名、相对路径、md 与 json 两个文件名都要进对
- **前置**：`mkRepo()`；`docs/superpowers/reviews/2026-10-27-1000-r1/` 内写合法产物对（§0.2-5），`git add` + `git commit`。
- **步骤**：`const res = runGate(repo)`。
- **预期**：`findings` 长度 0；`archivePairs === 1`、`scannedDirs === 1`。
- **判据**：`assert.deepEqual(res.findings, [])` && `res.archivePairs === 1` && `res.scannedDirs === 1`（「对」的计义 = Q14 `spec:213`：成对的 json + 同名 md 一组）。
- **红绿证据**：红 = 接线把 md 漏进 `files`（三态判空 → `ArtifactMissing`）或路径前缀拼错（产物不被识别 → 同上）；绿 = 0 findings + 计数正确。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：`-a`/`-b` 双实例的「对」数（`-a`/`-b` 各自成对，计义已在 `spec:213` 定死，本用例按单实例 1 对断言；双实例形态由 H22 的条数判据同源覆盖）。

#### H07 子目录无产物且不在白名单 → `ArtifactMissing`

- **覆盖**：三态·无产物且不在白名单（`spec:94`）/ 目录级 path（`spec:81`）/ Q5（`spec:204`）/ Q18（`spec:217`）/ **D9（`spec:194`，用户裁定「按 D-12：仍判红」）** / PRD `:407` `:410` / `ArtifactMissing`（`spec:140`）/ 锚点1
- **来源**：PRD `:407` 反例；也是 `:411` 白名单「只到精确名」的收紧方向（仿名目录必须红）；`path` 形态按 `spec:81`（目录级 finding 的 `path` = `<次>/` 的仓内相对路径）。**v4 增补**（第 3 轮卡 Q-3-BE2 / D9）：PRD `:410`「评审账本本身就是归档内容，不得因『不是 observation』被判红」与 `:407` / D-12 有字面张力，spec 已由 D9（`spec:194`）+ Q18（`spec:217`）定音——**`:410` 只免 `UnclassifiedArtifact`，不免义务产出**：只含允许类账本、无 `observation-r<N>` 的归档子目录**仍报 `ArtifactMissing`**。
- **前置**：`mkRepo()`；两形态各跑一次独立临时仓：
  a. `docs/superpowers/reviews/2026-10-20-0000-no-obs/` 内只放 `progress.md`（允许文件名类，`spec:32`）；
  b. **账本-only 形态**：同名子目录内放 `progress.md` + `cards.md` + `problems.md`（**全部是允许类**，无产物）。
- **步骤**：`const res = runGate(repo)`（两形态各一次）。
- **预期**：两形态均 `findings` 恰 1 条，`code === 'ArtifactMissing'`，`norm(path) === 'docs/superpowers/reviews/2026-10-20-0000-no-obs'`；**均不**出 `UnclassifiedArtifact`（三份账本都在允许类内）。
- **判据**：对每形态分别 `res.findings.length === 1 && res.findings[0].code === 'ArtifactMissing' && norm(res.findings[0].path) === 'docs/superpowers/reviews/2026-10-20-0000-no-obs'` && `!res.findings.some(f => f.code === 'UnclassifiedArtifact')`。**形态 b 是本条的判别力所在**：若实现把 `:410`「账本不得被判红」读成「无产物也放行」，形态 b 会 0 findings → 必红。
- **红绿证据**：红 = 「有允许类文件 = 已交卷」（缺产物被放过）/ 账本-only 目录被 `:410` 免掉义务产出（D9 被绕）/ 白名单前缀匹配（仿名目录免检）；绿 = 缺产物即红、允许类不误报。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：`message` 文案（无判据）；`ArtifactMissing` 与杂件并列的形态（H09）；`:410` 与 `:407` 的**条款级**取舍（属 PRD D-12 裁定，本文件只验机器后果）。

#### H08 子目录含杂件 → `UnclassifiedArtifact`（`path` 到 `<次>/`，文件名只在 message）

- **覆盖**：三态·有非产物文件（`spec:95`）/ 目录级 path + 杂件名留 message（`spec:81`）/ PRD `:408` / `UnclassifiedArtifact`（`spec:141`）/ 锚点1 / PRD §5.3 V-6 第 8 行
- **来源**：`spec:95`「既非产物、也不在允许文件名类 / 9 个精确路径白名单内 → `UnclassifiedArtifact`（`path` = `<次>/`）」+ `spec:81`「**杂件文件名留在 `message`**（S2 返回值无 `path`，接线不得解析 message 反推路径）」。v1 断言「`path` 含 `random-notes.md`」在纯函数无 `path` 的事实下不可实现（第 1 轮卡 Q-1-BE1）。
- **前置**：`mkRepo()`；`docs/superpowers/reviews/2026-10-27-1000-r1/` 内放合法产物对（`git add` + `commit`）+ `random-notes.md`。
- **步骤**：`const res = runGate(repo)`。
- **预期**：`findings` 恰 1 条 `UnclassifiedArtifact`；`norm(path) === 'docs/superpowers/reviews/2026-10-27-1000-r1'`（**不含**文件名）；`message` 含 `random-notes.md`。
- **判据**：`const un = res.findings.filter(f => f.code === 'UnclassifiedArtifact'); un.length === 1 && norm(un[0].path) === 'docs/superpowers/reviews/2026-10-27-1000-r1' && /random-notes\.md/.test(un[0].message)` && `res.findings.length === 1`（产物对已提交，故 git 两码与四段码均不出）。
- **红绿证据**：红 = 反向清单只在纯函数层、接线没传 `files`（塞什么都不会红，正是 S3 要补的入口）；或 `path` 被拼到文件名（`spec:81` 被破，与「S2 无 path」的事实冲突 → 只能靠解析 message，禁用）；绿 = 杂件报码且 path/message 各就各位。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：`cards/` 与 `attachments/` 子层的**分类正确性**（H10 / H12 / H13 钉接线，纯函数逻辑归 S2 G05/G06）。

#### H09 杂件 + 缺产物 → 两码并列

- **覆盖**：PRD `:408`「**与上三态并列，非替代**」/ `spec:95` / 锚点1
- **来源**：并列语义是 PRD 明文；接线若把三态写成 if/else，缺产物与杂件会互相遮蔽（S2 testcase G04 已把纯函数钉住，本用例钉接线不合并）
- **前置**：`mkRepo()`；`<次>/` 内只放 `random-notes.md`（无产物）。
- **步骤**：`const res = runGate(repo)`。
- **预期**：`findings` 中同时存在 `ArtifactMissing` 与 `UnclassifiedArtifact`。
- **判据**：`const cs = res.findings.map(f => f.code); cs.includes('ArtifactMissing') && cs.includes('UnclassifiedArtifact')`。
- **红绿证据**：红 = 只报一码（杂件被「缺产物」吞掉或反之）；绿 = 并列双码。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：双码的顺序（spec 未定，不测）。

#### H10 允许文件名类 8 类（含 `cards/` 子层）→ 不误报

- **覆盖**：PRD `:410` 允许文件名类 8 类 / R4（子层靠纯函数）/ `ALLOWED_FILE_RE`（`spec:32`）/ 锚点2
- **来源**：允许类漏一类 = 合法评审账本被判红（PRD `:410`：「评审账本本身就是归档内容，不得因『不是 observation』被判红」）
- **前置**：`mkRepo()`；`<次>/` 放 8 类允许文件名各一 + `cards/round-check.md`（子层形态），不建产物。
- **步骤**：`const res = runGate(repo)`。
- **预期**：**不出** `UnclassifiedArtifact`；`ArtifactMissing` 仍出（该目录不在存量白名单）。
- **判据**：`const cs = res.findings.map(f => f.code); !cs.includes('UnclassifiedArtifact') && cs.includes('ArtifactMissing')`。
- **红绿证据**：红 = 接线把 `cards/` 前缀裁掉导致子层文件名当根层判（或反之）；或允许类清单被接线侧覆盖成子集；绿 = 8 类 + 子层全过。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：9 精确路径白名单的逐文件匹配（S2 G05 覆盖其宿主目录；接线传 `dirName` 的形式由 H04 钉）。

#### H11 扫描根根层散文件 → 恰 1 条 `UnclassifiedArtifact`（含 `progress.md` 允许名反例），不得出 `ArtifactMissing`（D1）

- **覆盖**：§11.6 D1（`spec:186`）/ 根层散文件（`spec:99`，含「不套允许类白名单」）/ PRD `:408` / `§11.3 UnclassifiedArtifact`（`spec:141`）/ 锚点1
- **来源**：`spec:99`「扫描根下的直接文件（不在任何 `<次>/` 内）**一律 `UnclassifiedArtifact`**——**不调 `scanReviewDir`、不套允许类白名单**（根层 `progress.md` 这类允许名同样不豁免），`ARTIFACT_RE` 只用来区分『产物名 / 非产物名』并写进 `message`」。这是 S3 的接线期判定（D1，载体 `gate-run`，`spec:193`），与 S2 纯函数（只接受 `<次>/` 内相对路径，`spec:31`）是两条路径。
- **前置**：`mkRepo()`；`docs/superpowers/reviews/` 下同时建一个合法产物子目录（`git add` + `commit`，避免 git 两码干扰）；两形态各跑一次独立临时仓：
  a. 根层放 `notes.md`（非允许名）；
  b. 根层放 `progress.md`（**允许文件名类成员**，`spec:32`）。
- **步骤**：`const res = runGate(repo)`（两形态各一次）。
- **预期**：两形态均 `findings` 恰 1 条 `UnclassifiedArtifact`，`message` 含该文件名（`notes.md` / `progress.md`），`norm(path)` **不**指向任何 `<次>/`；均不得出 `ArtifactMissing`。
- **判据**：对每形态分别 `const un = res.findings.filter(f => f.code === 'UnclassifiedArtifact'); un.length === 1 && new RegExp(fileName.replace('.', '\\.')).test(un[0].message)` && `!res.findings.some(f => f.code === 'ArtifactMissing')` && `res.findings.length === 1`。**形态 b 是本条的判别力所在**：若实现把 `ALLOWED_FILE_RE` 套到根层（沿用了 8 类允许名），`progress.md` 会被放行 → `un.length === 0` → 必红。
- **红绿证据**：红 = 根层不判（可塞无限文件而不红，F-18「目录级反向清单」被绕过）；或根层套了允许类白名单（`progress.md` 放行 → 免检出口，`spec:99` 被破）；或根层被当「不可枚举」报 `ArtifactNamingOff`（码扩用，`spec:147` 禁）；绿 = 两形态均恰 1 条、且合法子目录不产生其它码。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：根层放**产物名**文件的形态（H14）；0 子目录 + 根层散文件（H54）；根层文件的 `path` 究竟带不带扫描根前缀（spec 未逐字定，故本条只断「`path` 不指向某个 `<次>/` + 文件名在 message」）。

#### H12 `attachments/<file>` 一层快照 → 不误报

- **覆盖**：PRD `:410` C-15（`spec:29`）/ `ATTACHMENT_RE`（`spec:32`）/ 锚点2
- **来源**：PRD `:410` `<次>/attachments/` 只许一层、文件名不限 8 类（C-12 通道）；接线若把子层文件当根层判，C-12 通道会被自家门禁锁死
- **前置**：`mkRepo()`；`<次>/` 内合法产物对（`git add` + `commit`）+ `attachments/niku-detection.md`（不在 8 类内，属快照；一并 `git add` + `commit`）。
- **步骤**：`const res = runGate(repo)`。
- **预期**：0 findings（产物齐 + 快照一层）。
- **判据**：`assert.deepEqual(res.findings, [])`。
- **红绿证据**：红 = 接线把 `attachments/<file>` 当成未分类（走根层允许类判定）；绿 = 通道走通。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：快照**内容**合法性（证据七道归 S2 C 组）；空 `attachments/` 目录（无文件则不进 `files`）。

#### H13 `attachments/a/b.md` 两层嵌套 → 恰 1 条 `UnclassifiedArtifact`（文件名在 message）

- **覆盖**：PRD `:410` C-15「不得再嵌套」（`spec:29`）/ R4 / 目录级 path（`spec:81`）/ 锚点1
- **来源**：C-15 只许一层的收紧方向；接线必须把**相对路径原样**传给纯函数（裁成一层 = 无底洞嵌套放行）；断言形态按 `spec:81`（目录级 path 到 `<次>/`，文件名留 message）
- **前置**：`mkRepo()`；`<次>/` 内合法产物对（`git add` + `commit`）+ `attachments/a/b.md`。
- **步骤**：`const res = runGate(repo)`。
- **预期**：`findings` 恰 1 条 `UnclassifiedArtifact`；`norm(path) === 'docs/superpowers/reviews/<次>'`（不含 `attachments/…`）；`message` 含 `attachments/a/b.md`。
- **判据**：`const un = res.findings.filter(f => f.code === 'UnclassifiedArtifact'); un.length === 1 && norm(un[0].path) === 'docs/superpowers/reviews/2026-10-27-1000-r1' && /attachments\/a\/b\.md/.test(un[0].message)`。
- **红绿证据**：红 = 递归列举时只保留 basename（两层被压成一层而放行）；或 `path` 被拼到文件（`spec:81` 被破）；绿 = 原样相对路径交给纯函数、码与文案各就各位。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：深层目录里的**产物名**文件（是否算产物：`ARTIFACT_RE` 已要求不带 `/`，纯函数侧语义由 S2 覆盖）。

#### H14 扫描根根层放产物名文件 → 仍判 `UnclassifiedArtifact`（D1 强形态）

- **覆盖**：§11.6 D1（`spec:186` / `spec:99`）/ PRD `:408` / 锚点1
- **来源**：`spec:99`「根层 `observation-r1.json` **同样不豁免**」——文件名**像**产物但不在任何 `<次>/` 内，无归属；若按产物放行，等于在扫描根根层开了免检出口
- **前置**：`mkRepo()`；`docs/superpowers/reviews/observation-r1.json`（根层），同时建一个合法产物子目录并 `git add` + `commit`。
- **步骤**：`const res = runGate(repo)`。
- **预期**：`findings` 恰 1 条 `UnclassifiedArtifact`；`message` 含 `observation-r1.json`；不得出 `ArtifactMissing`（合法子目录不产生码）。
- **判据**：`const un = res.findings.filter(f => f.code === 'UnclassifiedArtifact'); un.length === 1 && /observation-r1\.json/.test(un[0].message)` && `!res.findings.some(f => f.code === 'ArtifactMissing')` && `res.findings.length === 1`。
- **红绿证据**：红 = 根层产物名文件被当产物（无 `<次>/` 归属也放行，D1 被绕）；绿 = 无归属即报。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：根层该文件是否同时被四段校验（spec 未要求：无归属文件不校验内容）；根层该文件的 `path` 逐字形态（同 H11）。

### C 组：产物成对与四段码透传（D2 / R8 / 锚点1）

#### H15 孤立 md（无同名 json）→ `JsonNotFound`

- **覆盖**：§11.6 D2（`spec:187`）/ 成对判定（`spec:97`）/ `JsonNotFound`（`spec:144`）/ 锚点1
- **来源**：`spec:97`「以 json 为锚逐个校验；**孤立 md（无同名 json）→ `JsonNotFound`**」——不判则该文件既算「有产物」（绿）又从不被校验
- **前置**：`mkRepo()`；`<次>/observation-r1.md`（内容任意，`git add` + `commit` 以免 git 侧干扰）。
- **步骤**：`const res = runGate(repo)`。
- **预期**：`findings` 含 `JsonNotFound`（且无 `ArtifactMissing`——三态按 md 存在判「有产物」）。
- **判据**：`const cs = res.findings.map(f => f.code); cs.includes('JsonNotFound') && !cs.includes('ArtifactMissing')`。
- **红绿证据**：红 = 孤立 md 被当合法产物（零校验放行）；绿 = `JsonNotFound`。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：过程目录里的孤立 md（过程侧不做成对判定，Q7 `spec:206` → H30 已钉住"不报码"）。

#### H16 json 在而 md 缺 → `MdMissing`（S2 透传，不重写码）

- **覆盖**：成对判定（`spec:97`）/ S2 四段码原样透传（`spec:145`）/ 锚点1
- **来源**：`spec:97`「json 在而 md 缺 → `MdMissing`（S2 已在 `validateArtifact` 内判，**不重写**）」
- **前置**：`mkRepo()`；`<次>/observation-r1.json`（合法 doc，**`git add` + `commit`**）+ 无 md。
- **步骤**：`const res = runGate(repo)`。
- **预期**：`findings` 恰 1 条且 `code === 'MdMissing'`，**不含**任何自造码。
- **判据**：`res.findings.length === 1 && res.findings[0].code === 'MdMissing'`（v2：前置补 `git add` + `commit`，否则未跟踪的 json 会多出 `UntrackedArtifact`、`every(仅 MdMissing)` 必红）。
- **红绿证据**：红 = 接线另起码名（如 `MdNotRendered`）或跳过 md 存在性；或前置未提交导致多码（v1 缺陷，Q-1-QA3）；绿 = 原码透传且唯一条。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：CLI 侧同码（S2 E11 已测）。

#### H17 结构错（`items: []`）→ `MissingItems` 透传

- **覆盖**：S2 四段码透传（`spec:145`）/ R8（`spec:50`）/ 锚点1
- **来源**：门禁必须真红（V-6 之外的"四段逐码"面）：结构错不得因「渲染错先短路」而漏报
- **前置**：`mkRepo()`；`<次>/observation-r1.json` = 合法 doc 但 `items: []`（`coverage.read` 同步改 0）；md 用 `renderObservation(该 doc)` 产出（保证渲染一致，只留结构错）；两件 `git add` + `commit`。
- **步骤**：`const res = runGate(repo)`。
- **预期**：`findings` 含 `MissingItems`。
- **判据**：`res.findings.some(f => f.code === 'MissingItems')`。
- **红绿证据**：红 = 四段链没接（坏件放行）；绿 = 码逐字透传。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：其余 S2 结构码逐码（S2 testcase B 组 20 条已覆盖；本文件按「透传链路至少 1 码」设 1 条 + H18/H19 各 1 条，避免与 S2 重复测纯函数内部）。

#### H18 md 手改 → `RenderMismatch` 透传

- **覆盖**：S2 四段码透传（`spec:145`）/ PRD §5.3 第 1 行 / 锚点1
- **来源**：PRD §5.3 第 1 行「手写 md 冒充产物 → `RenderMismatch`」；门禁侧的形态 = 归档件 md 被手改
- **前置**：`mkRepo()`；`<次>/` 内合法产物对（`git add` + `commit`），然后只改 md（把 `覆盖度：已判 2 条` 改一个字）。
- **步骤**：`const res = runGate(repo)`。
- **预期**：`findings` 含 `RenderMismatch`（附带行号在 message 内，由 S2 保证）。
- **判据**：`res.findings.some(f => f.code === 'RenderMismatch')`。
- **红绿证据**：红 = 渲染比对未接（只判 json 存在性）；绿 = 码透传。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：同改 json+md 的"无锚"面（PRD §5.3 第 11 行，S2 H03 已裁「故意不拦」）；本条同时会出 `ArtifactDirty`（判据用 `some`，容忍）。

#### H19 含 `check:'ai'` 条目缺 `-a`/`-b` → `InstanceMissing` 透传

- **覆盖**：S2 四段码透传（`spec:145`）/ `validateArtifact`（`spec:35`）/ PRD §4.1 双实例
- **来源**：`validateArtifact` 的 `instanceMissing` 是四段链的一环（`tools/observation-check/artifact.mjs:71-84`）；接线若只调 `validateObservation` 会漏这一环——本用例钉"调的是 `validateArtifact` 而不是更弱的入口"
- **前置**：`mkRepo()`；`<次>/observation-r1.json` = 合法 doc，但 `items[0]` 加 `check: 'ai'`（`{id:'k01', verdict:'na', reason:'不适用', check:'ai'}`），仅 `observation-r1.json|md` 一对，无 `-a` / `-b`；两件 `git add` + `commit`。
- **步骤**：`const res = runGate(repo)`。
- **预期**：`findings` 含 `InstanceMissing`。
- **判据**：`res.findings.some(f => f.code === 'InstanceMissing')`。
- **红绿证据**：红 = 接线调 `validateObservation` 而非 `validateArtifact`（四段少一段，双实例对账整段失效）；绿 = 码透传。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：`-a`/`-b` 成对正例（S2 B18）；`InstanceMissing` 是否也应扫 `-a` 单体（spec 未要求）。

#### H20 产物名大写后缀 → 无产物（`ArtifactMissing`）+ 未分类，且不报 `ArtifactNamingOff`

- **覆盖**：码的用法边界（`spec:147`）/ Q8（`spec:207`）+ Q12（`spec:211`）/ `ARTIFACT_RE`（`spec:32`）/ PRD `:405` `:408`
- **来源**：`ARTIFACT_RE` 只认小写 `-a`/`-b`（`gate-scan.mjs:17`，Q12 已裁定"大写后缀不算产物"）；写错大小写的文件按三态就是「非产物」→ 既算缺产物也算未分类；同时 `spec:147` 明文「`ArtifactNamingOff` **不**用于 git 故障、不用于产物命名不合规」。这一条钉**接线没有偷偷扩正则**（R4）且没有扩用码（R8）
- **前置**：`mkRepo()`；`<次>/observation-r1-A.json|md`（大写 `A`），无小写后缀产物。
- **步骤**：`const res = runGate(repo)`。
- **预期**：`findings` 含 `ArtifactMissing` 与 `UnclassifiedArtifact`（两码并列，同 H09 机制）；**不出** `ArtifactNamingOff`。
- **判据**：`const cs = res.findings.map(f => f.code); cs.includes('ArtifactMissing') && cs.includes('UnclassifiedArtifact') && !cs.includes('ArtifactNamingOff')`。
- **红绿证据**：红 = 接线放宽正则（大写也当产物 → 命名错被放行）或扩用 `ArtifactNamingOff`（把"目录缺产物"的真红吞成命名红，`spec:147` 被破）；绿 = 按三态后果判、两码在场且无命名码。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：`ArtifactNamingOff` 在扫描根不可用（H02/H03）与 git 不可用（H24/H25，改报 `RepoRootUnresolved`）两条正当路径上的正例。

### D 组：git 断言三码与 fail-closed（R5 / V-6 第 7、10 行）

#### H21 已提交且工作树一致 → 无 `UntrackedArtifact` / `ArtifactDirty`

- **覆盖**：git 断言表（`spec:107-111`）/ PRD `:405` 第 7+10 行 / R5（`spec:47`）/ 锚点1
- **来源**：`spec:109-111` 的正例侧——`git rev-parse --is-inside-work-tree` exit 0、`git ls-files --error-unmatch` exit 0、`git diff --quiet` exit 0
- **前置**：`mkRepo()`；`<次>/` 合法产物对已 `git add` + `git commit`，且无后续修改。
- **步骤**：`const res = runGate(repo)`。
- **预期**：`findings` 长度 0。
- **判据**：`assert.deepEqual(res.findings, [])`。
- **红绿证据**：红 = 断言命令拼错（如漏 `--`，路径被当 revisions → 误报）或误把 `git diff --quiet` 的 exit 0 当"有差异"；或前置探测命令写错；绿 = 0 findings。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：`git diff --quiet` 的缓存/未跟踪语义细节（H23/H26 分别钉单侧）；命令是否真带 `timeout: 30000`（H05 ③ 静态断）。

#### H22 归档件未 `git add` → 恰 2 条 `UntrackedArtifact`

- **覆盖**：finding 粒度（`spec:80`）/ Q5（`spec:204`）/ PRD `:405` / V-6 第 10 行 / `UntrackedArtifact`（`spec:142`）/ 锚点1
- **来源**：`spec:110`「`git ls-files --error-unmatch -- <path>` 非 0 → `UntrackedArtifact`」+ `spec:80`「**每个产物文件每条命令最多一条**，不去重、不聚合」→ json 与 md 各一条（共 2 条）
- **前置**：`mkRepo()`；`<次>` = `2026-10-27-1000-r1`；合法产物对**已写盘、未 `git add`**。
- **步骤**：`const res = runGate(repo)`。
- **预期**：`findings` 中恰 **2 条** `UntrackedArtifact`，`norm(path)` 分别为 `docs/superpowers/reviews/2026-10-27-1000-r1/observation-r1.json` 与 `…/observation-r1.md`；无 `ArtifactDirty`。
- **判据**：`const un = res.findings.filter(f => f.code === 'UntrackedArtifact'); un.length === 2` && `assert.deepEqual(un.map(f => norm(f.path)).sort(), ['docs/superpowers/reviews/2026-10-27-1000-r1/observation-r1.json','docs/superpowers/reviews/2026-10-27-1000-r1/observation-r1.md'].sort())` && `!res.findings.some(f => f.code === 'ArtifactDirty')`。
- **红绿证据**：红 = 未断言索引（归档件没 add 就"绿"，PRD §5.3 第 10 行整条失效）；或按码去重成 1 条（md 侧漏跟踪被 json 的码掩盖，`spec:80` 被破）；绿 = 两条各自的 path 精确在位且不误报 dirty。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：`git add` 后两码消（H33）；`-a`/`-b` 双实例的条数（4 文件 → 4 条，未另设用例，同一判据由本条覆盖形态）。

#### H23 已提交后手改 → `ArtifactDirty`

- **覆盖**：git 断言表（`spec:111`）/ PRD `:405` / V-6 第 7 行 / `ArtifactDirty`（`spec:143`）/ 锚点1
- **来源**：`spec:111`「`git diff --quiet` 非 0 → `ArtifactDirty`」/ PRD §5.3 第 7 行「产物被手改（归档后）」
- **前置**：`mkRepo()`；产物对已 commit；随后对 json **只追加一个换行**（JSON 仍可解析、四段仍绿），使工作树 ≠ 索引但内容仍合法。
- **步骤**：`const res = runGate(repo)`。
- **预期**：`findings` 含 `ArtifactDirty`，且不含 `UntrackedArtifact`（文件仍跟踪）。
- **判据**：`const cs = res.findings.map(f => f.code); cs.includes('ArtifactDirty') && !cs.includes('UntrackedArtifact')`。
- **红绿证据**：红 = 只断言 `ls-files`（已跟踪即绿 → 归档后手改无人发现）；绿 = 报 `ArtifactDirty`。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：手改后内容**语义**是否可靠（PRD §5.3 第 11–13 行，机器拦不住，S2 已裁）。

#### H24 临时根不是 git 工作树 → `RepoRootUnresolved`（fail-closed）

- **覆盖**：R5 前置探测（`spec:109`）/ §11.6 D3（`spec:188`）/ `RepoRootUnresolved`（`spec:139`）/ `repoRoot()`（`spec:36`）/ 锚点1
- **来源**：`spec:109`「前置 `git rev-parse --is-inside-work-tree`（非 0 / spawn error / 超时 → `RepoRootUnresolved`）」+ D3（`spec:188`：PRD 只把该码定义在证据第 2 道，本 spec **显式扩用到门禁**；理由 = 「取不到根 = fail-closed」不再用 `ArtifactNamingOff` 承担 git 故障——码名与触发不符，第 1 轮卡 Q-1-BE3）。
- **前置**：临时根**不** `git init`（`mkdtempSync` 后只建 `docs/superpowers/reviews/<次>/` 合法产物对 + `.session/reviews/`）；放在系统临时目录、**不嵌在任何既有 git 仓内**。
- **步骤**：`const res = runGate(repo)`。
- **预期**：`findings` 含 `RepoRootUnresolved`；**不得**返回空 findings（「无法断言」≠「没有问题」）。
- **判据**：`res.findings.some(f => f.code === 'RepoRootUnresolved')` && `res.findings.length > 0`。
- **红绿证据**：红 = `rev-parse` 失败被当"跳过 git 断言"（无 git 环境 = 门禁静默关闭）；或仍报 `ArtifactNamingOff`（码名与触发不符、且同一故障在 S2/S3 出两个码，`spec:139` / `spec:188` 被破）；绿 = fail-closed 且码正确。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：`repoRoot()` 在 S2 证据链上的同码（S2 C08 已测）。

#### H25 git 子进程起不来（子进程 `PATH` 空）→ `RepoRootUnresolved`

- **覆盖**：R5（`spec:47`「非 0 / spawn error / 超时 → `RepoRootUnresolved`」）/ D3（`spec:188`）/ `RepoRootUnresolved`（`spec:139`）
- **来源**：`spec:47` 把 spawn 失败并列进 fail-closed；`spawnSync` 的 `error` 非空（`ENOENT`）与「退出码非 0」是两种不同失败，都必须收敛为码。v2 起**不改本进程 env**——`PATH` 只经 `runGate(repo, { env })` 传给子进程（Q13 的子进程注入带来的附带好处：不再需要进程内全局态）。
- **前置**：`mkRepo()` + 已提交的合法产物对；调用时 env = `{ ...process.env, PATH: '' }`（子进程用 `process.execPath` 绝对路径启动，故 node 本身能起）。
- **步骤**：`const res = runGate(repo, { env: { ...process.env, PATH: '' } })`。
- **预期**：`findings` 含 `RepoRootUnresolved`；不抛异常（`runGate` 已断言子进程 exit 0）。
- **判据**：`runGate` 不抛 && `res.findings.some(f => f.code === 'RepoRootUnresolved')`；且 `assert.strictEqual(process.env.PATH, PATH_BEFORE)`（**本用例不改本进程 env**，此断言即证）。
- **红绿证据**：红 = spawn `error` 被当"命令返回非 0 之外的正常情况"（环境坏掉时门禁假绿）；或报 `ArtifactNamingOff`（同 H24）；绿 = fail-closed 且码正确、本进程 env 未被改动。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：git 存在但慢/挂起（超时路径本身需要造慢 git，不稳；只由 H05 ③ 静态断 `timeout: 30000` + R5 的口径兜底，见 §5 第 13 条）。

#### H26 只断言 json 会漏 md：md 未跟踪仍报 `UntrackedArtifact`

- **覆盖**：finding 粒度（`spec:80`）/ Q5（`spec:204`）/ PRD `:405`「对每个产物文件」/ 锚点1
- **来源**：`spec:80` 与 `spec:110` 都写「**每个产物文件**的仓内相对路径」——json 与 md 各两条。只断言 json 是常见漏法；`spec:80` 已定死 `path` 为仓内 POSIX 相对路径，故本条按逐字相等断言
- **前置**：`mkRepo()`；`<次>` = `2026-10-27-1000-r1`；产物对已写盘；**只** `git add` json 并 commit，md 保持未跟踪。
- **步骤**：`const res = runGate(repo)`。
- **预期**：`findings` 中 `UntrackedArtifact` 恰 1 条，`norm(path)` **逐字等于** `docs/superpowers/reviews/2026-10-27-1000-r1/observation-r1.md`。
- **判据**：`const un = res.findings.filter(f => f.code === 'UntrackedArtifact'); un.length === 1 && norm(un[0].path) === 'docs/superpowers/reviews/2026-10-27-1000-r1/observation-r1.md'`。
- **红绿证据**：红 = 只对 json 跑断言（md 没进 git 无人发现，PRD §5.3 第 10 行对 md 半失效）或 path 用了反斜杠/绝对路径（`spec:80` 被破，grep 与日志不一致）；绿 = 一条、path 逐字。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：json 侧同码（H22 已覆盖两条的集合）。

### E 组：过程目录口径（R3 / PRD `:413` / 锚点3）

> **本组共用前置（v2 补，第 1 轮卡 Q-1-RD1）**：每个用例的临时仓都必须**先建空的 `docs/superpowers/reviews/`**（`mkRepo()` 已代建）——否则扫描根不存在 → `ArtifactNamingOff`（`spec:101`）会把「过程侧口径」的判据污染成另一条码，H28/H30/H31 的 `deepEqual([])` 必红。

#### H27 3 个过程目录、0 产物 → 0 findings，无 `ArtifactMissing`

- **覆盖**：R3（`spec:45`）/ 过程侧口径（`spec:103`）/ Q1（`spec:200`）/ PRD `:413` / 锚点3（`spec:239`）/ Q16（`spec:215`）
- **来源**：R3 负例：现过程目录 **≥49（2026-10-27 23:37 实测 50，每轮评审 +1）**、`observation-r*` 0 件；套三态会整片假红（PRD `:413` 明写只做四段校验）。目录数**不写死**（Q16）。
- **前置**：`mkRepo()`；`.session/reviews/` 下建 3 个空目录（如 `2026-10-27-1000-a` / `-b` / `-c`）；`docs/superpowers/reviews/` 为空（0 子目录、0 散文件）。
- **步骤**：`const res = runGate(repo)`。
- **预期**：`findings` 长度 0；`processPairs === 0`。
- **判据**：`assert.deepEqual(res.findings, [])` && `res.processPairs === 0`；并显式 `!res.findings.some(f => f.code === 'ArtifactMissing')`（防"空数组先过"掩盖）。
- **红绿证据**：红 = 过程目录套三态（每目录一条 `ArtifactMissing` → 数十条假红，门禁公信力归零）；绿 = 0 findings。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：`processPairs` 的**计义**（已由 Q14 `spec:213` 定死，本条按 0 对断言）；真实过程目录现状由 H50 核（目录数只打印不判）。

#### H28 过程目录合法产物（未跟踪）→ 0 findings，`processPairs 1`（不做 git 断言）

- **覆盖**：R3（`spec:45`）/ 过程侧口径（`spec:103`）/ 零产物只跳归档侧（`spec:86`）/ PRD `:413` / Q16（`spec:215`）
- **来源**：PRD `:413`：`.session/` 在 `.gitignore` 里，断言必然假红 → 过程侧必须**完全不**跑 git 断言。本用例是"断言没被误加到过程侧"的行为证明；同时证 `spec:86`「归档 0 件只跳归档侧、过程侧照扫」。
- **前置**：`mkRepo()`；`.session/reviews/2026-10-27-1000-p/` 内写合法产物对（未 `git add`；`.session` 未 ignore，故"未跟踪"是可断言的——正因如此，若接线误加断言，本条必红）；`docs/superpowers/reviews/` 空。
- **步骤**：`const res = runGate(repo)`。
- **预期**：`findings` 长度 0，`processPairs === 1`（归档侧 0 对但过程侧仍被扫）。
- **判据**：`assert.deepEqual(res.findings, [])` && `res.processPairs === 1` && `res.archivePairs === 0`。
- **红绿证据**：红 = git 断言被套到过程侧（每条过程产物假红 `UntrackedArtifact`）；或零产物分支把过程侧一起跳过（`processPairs` 会是 0，`spec:86` 被破）；绿 = 0 findings + 1 对。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：真仓 `.session/reviews/` 现 50 目录（H50 用真仓根核，目录数打印不判）。

#### H29 过程产物缺 md → `MdMissing`（四段仍跑）

- **覆盖**：R3「只做四段校验」（`spec:45` / `spec:103`）/ 锚点3
- **来源**：R3 说的是「**只**做四段校验」——即四段必须**真的跑**，不是"过程侧什么都不查"
- **前置**：`mkRepo()`；`.session/reviews/<次>/observation-r1.json`（合法 doc，无 md）；`docs/superpowers/reviews/` 空。
- **步骤**：`const res = runGate(repo)`。
- **预期**：`findings` 含 `MdMissing`。
- **判据**：`res.findings.some(f => f.code === 'MdMissing')`。
- **红绿证据**：红 = 过程侧只列目录不校验（坏过程产物放行）；绿 = 码透传。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：过程侧其余 S2 码逐码（同 H17 理由，纯函数内部归 S2）。

#### H30 过程目录只有 md → 三码均不出，findings 为空

- **覆盖**：过程侧口径（`spec:103`）/ Q7（`spec:206`）/ R3（`spec:45`）/ 锚点3
- **来源**：Q7 已裁定「**不报码**（过程侧不做成对判定）」（`spec:206`）；`spec:103` 原文：「过程目录里只有 md 无 json **不报码**——工作区不是交付承诺」。本条因此把三码全部钉住（`JsonNotFound` 是裁定新增的缺席项）。
- **前置**：`mkRepo()`；`.session/reviews/<次>/observation-r1.md`（无 json）；`docs/superpowers/reviews/` 空。
- **步骤**：`const res = runGate(repo)`。
- **预期**：`findings` **为空**（既无 `JsonNotFound`，也无 `ArtifactMissing` / `UnclassifiedArtifact`）。
- **判据**：`assert.deepEqual(res.findings, [])`（一条断言覆盖三码缺席；并单独 `console.log(codes)` 便于排障）。
- **红绿证据**：红 = 过程侧套了三态/反向清单（R3 被破，数十目录假红 + 过程 md 被判杂件）或把归档侧的 `JsonNotFound` 误用到过程侧（`spec:103` 被破）；绿 = findings 空。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：归档侧孤立 md 的 `JsonNotFound`（H15）；过程侧缺 md 的 `MdMissing`（H29）。

#### H31 过程目录杂件 → 不出 `UnclassifiedArtifact` / `ArtifactMissing`

- **覆盖**：R3（`spec:45`）/ PRD `:413` / 锚点3
- **来源**：过程目录里本来就有 `progress.md` / `problems.md` 等评审账，还可能混入草稿；R3 明写不做三态 → 不得按反向清单判红
- **前置**：`mkRepo()`；`.session/reviews/<次>/` 放 `progress.md` 与 `random-notes.md`（无产物）；`docs/superpowers/reviews/` 空。
- **步骤**：`const res = runGate(repo)`。
- **预期**：`findings` 长度 0。
- **判据**：`assert.deepEqual(res.findings, [])`。
- **红绿证据**：红 = 反向清单被套到过程侧（杂件假红）；绿 = 0 findings。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：杂件内容检查（不存在此判据）。

### F 组：迁移状态机（F-22 / PRD §5.1 `:387-396`）

#### H32 步骤 1（move 后）→ `UntrackedArtifact`，message 写明「属预期」与「`git add`」

- **覆盖**：迁移状态机（`spec:115`）**含第 0 步（D9 `spec:194`）/ Q18（`spec:217`）** / PRD `:387-394` 步骤 1、`:391` / F-22 / 锚点1
- **来源**：PRD `:391`「此时 check 报 `UntrackedArtifact`（**属预期**，不得据此判定门禁失效）」+ `spec:115`「码消息里写明『属预期，下一步 `git add`』——**该『必然』只对已有产物的目录成立**」。**v4 增补**（第 3 轮卡 Q-3-BE2 / D9）：`spec:115` 把**第 0 步**写入状态机——「归档前该轮必须已在 `.session/reviews/<次>/` 由 `writeObservation` 产出 `observation-r<N>`；**未经第 0 步就 move，只会得到 `ArtifactMissing`（属阻断，不是「预期红」）**」。故本条前置必须先造出产物，否则测到的不是步骤 1 的预期态。
- **前置**：`mkRepo()`；**第 0 步（必做）**：先用 `writeObservation` 在 `.session/reviews/<次>/` 产出 `observation-r1.json` + `observation-r1.md`（合法产物对，见 §0.2-5）；随后 `renameSync` 整个目录到 `docs/superpowers/reviews/<同名>/`（模拟流程动作；**S3 不做这个动作，是测试替它做**）。
- **步骤**：`const res = runGate(repo)`。
- **预期**：`findings` 含 `UntrackedArtifact`；该 finding 的 `message` 同时含「属预期」与 `git add`；且**不含 `ArtifactMissing`**（第 0 步已产出 → 三态判「有产物」，走的是步骤 1 的预期态）。
- **判据**：`const f = res.findings.find(x => x.code === 'UntrackedArtifact'); f && /属预期/.test(f.message) && /git add/.test(f.message)` && `!res.findings.some(x => x.code === 'ArtifactMissing')`。
- **红绿证据**：红 = 消息只有码无解释（运维按"门禁失效"报障，PRD `:391` 的免责失效）；或**跳过第 0 步**就 move（此时只出 `ArtifactMissing` —— 那是阻断、不是预期红，`spec:115` 的「只对已有产物成立」被读漏）；绿 = 消息可读且逐字含两关键词、且无 `ArtifactMissing`。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：move 动作本身（流程义务，S3 不执行，见 §5 第 5 条）；`gate-record.md` 留痕（流程义务）；`writeObservation` 自身的产出一致性（S2 已测，本条只把它当第 0 步的前置）。

#### H33 步骤 2-3（`git add` 后）→ 两码消、0 findings

- **覆盖**：迁移状态机（`spec:115`）/ PRD `:393` 步骤 2-3 / 锚点1
- **来源**：PRD `:393`「`npm run check` 必须绿：索引已跟踪 exit 0；工作树与索引一致 exit 0」
- **前置**：H32 终态基础上执行 `git add -A`（同一临时仓内连续操作）。
- **步骤**：`const res = runGate(repo)`。
- **预期**：`findings` 长度 0。
- **判据**：`assert.deepEqual(res.findings, [])`。
- **红绿证据**：红 = add 后仍报 `UntrackedArtifact`（断言命令与索引语义不符，如漏 `--`）或报 `ArtifactDirty`（`git add` 后暂存区与工作树一致，不该脏）；绿 = 0 findings。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：真仓跑 `npm run check` 的端到端（H49 覆盖仓门禁绿，但不复演迁移）。

#### H34 步骤 4（`commit` 后）→ 绿保持

- **覆盖**：迁移状态机（`spec:115`）/ PRD `:394` 步骤 4 / 锚点1
- **来源**：PRD `:394`「`git commit` → 绿保持」
- **前置**：H33 终态基础上 `git commit -m 'drill'`。
- **步骤**：`const res = runGate(repo)`。
- **预期**：`findings` 长度 0。
- **判据**：`assert.deepEqual(res.findings, [])`。
- **红绿证据**：红 = `git diff --quiet` 只在工作树-索引层判定却把提交后也判脏（说明用错了命令，如 `git diff HEAD` 语义混淆）；绿 = 保持绿。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：commit 动作本身（§5 第 5 条）。

#### H35 迁移后过程副本仍在：归档报码、过程侧 0 findings（不双报）

- **覆盖**：PRD `:405` + `:413` 两侧独立性 / R3（`spec:45`）
- **来源**：真实迁移常见中间态（`.session` 副本未删）：两侧必须各自按自己的口径判，不能一边的问题串到另一边（`spec:115` 明文「迁移完成后须删副本」属流程义务，机器不判）
- **前置**：`mkRepo()`；`docs/superpowers/reviews/<次>/` 与 `.session/reviews/<次>/` **同时**存在同一产物对，且归档侧未 `git add`。
- **步骤**：`const res = runGate(repo)`。
- **预期**：`findings` 全为 `UntrackedArtifact`（归档侧），过程侧不出任何码。
- **判据**：`res.findings.length > 0 && res.findings.every(f => f.code === 'UntrackedArtifact')` && `res.findings.some(f => norm(f.path).startsWith('docs/superpowers/reviews/'))`。
- **红绿证据**：红 = 过程侧被套 git 断言（同一产物报两遍）或归档侧漏报；绿 = 两侧口径分离。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：过程副本是否该删（流程义务）。

#### H36 跑 gate 前后 `HEAD` 与 `status` 不变（0 git 写）

- **覆盖**：§11.4「不自动迁移」（`spec:151`）/ Q3（`spec:202`）/ R2 同类风险（"谁提交的"不得被抹掉）
- **来源**：`spec:151` 明写不执行 move / `git add` / `commit`；Q3 拒绝提供一键脚本。这个"不做"必须可观测，否则"顺手 add 一下"没人发现
- **前置**：`mkRepo()`；归档侧有**未跟踪**产物对（最容易被"顺手 add"的形态）；记录 `git rev-parse HEAD` 与 `git status --porcelain` 的快照。
- **步骤**：① 快照 HEAD + status；② `runGate(repo)`（findings 不为空也无妨）；③ 再取快照比对。
- **预期**：两次 `HEAD` 相同；两次 `status --porcelain` 文本完全相同；临时目录文件清单不变。
- **判据**：`head1 === head2 && status1 === status2` && 目录文件清单前后相同。
- **红绿证据**：红 = gate 静默 `git add`（工作树状态被改，迁移"谁提交的"被抹）；绿 = 零写。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：`git gc` 之类内部副作用（无判据意义）；真仓的 0 写（同一判据，本用例在临时仓库已证）。

### G 组：旁路（R6 / PRD `:396` / §11.6 D5 / 锚点5）

> 本组四条**必须** spawn `node scripts/check-all.mjs`（真脚本，cwd = 仓根），故一律列为**验收**：单次约 24s，跑完把输出首行与退出码贴 `gate-record.md`（Q11 `spec:210`）。

#### H37 `CHECK_BYPASS=1` + reason → 首行 `BYPASS: <reason>`、⑥ 跳过、exit 0

- **覆盖**：旁路（`spec:117`）/ R6（`spec:48`）/ PRD `:396` 首行要求 / 锚点5（`spec:241`）
- **来源**：PRD `:396`「旁路期间 `npm run check` 必须打印 `BYPASS: <原因>` 首行」——首行是审计每轮的唯一可见痕迹
- **前置**：仓根；`CHECK_BYPASS=1`、`CHECK_BYPASS_REASON=validator-bug-2026-10-27`。
- **步骤**：`spawnSync(process.execPath, ['scripts/check-all.mjs'], { cwd: 仓根, env: {...process.env, CHECK_BYPASS:'1', CHECK_BYPASS_REASON:'validator-bug-2026-10-27'}, encoding:'utf8' })`；`out` = stdout + stderr 合并。
- **预期**：exit 0；`out.split(/\r?\n/)[0].trim() === 'BYPASS: validator-bug-2026-10-27'`；输出含 `⑥ 观察产物门禁跳过（BYPASS）`（`spec:62` 定死文案）。
- **判据**：`status === 0` && 首行逐字相等 && `out.includes('⑥ 观察产物门禁跳过（BYPASS）')`。
- **红绿证据**：红 = 旁路无首行（审计看不见旁路 → PRD `:396` 留痕落空）；或旁路顺带跳掉别的段；绿 = 首行 + 跳过文案 + 全绿。
- **对应测试**：验收命令（plan 收尾命令清单，不落 `*.test.mjs`；输出贴 `gate-record.md`）
- **不覆盖**：commit message 与 `gate-record.md` 同行留痕（流程义务，机器不判）；旁路期间的补跑期限（同上）。

#### H38 未给 reason → `BYPASS: (未提供原因)` 且仍跳过

- **覆盖**：§11.6 D5（`spec:190`）/ PRD `:396` / 锚点5
- **来源**：`spec:190` + `spec:117`「未提供 reason 时打印 `BYPASS: (未提供原因)`」——不给 reason 不得变成"拒绝旁路"（那会逼人在真故障时改代码）
- **前置**：仓根；`CHECK_BYPASS=1`、**不设** `CHECK_BYPASS_REASON`（从 env 里删除该键）。
- **步骤**：同 H37 spawn，env 删去 `CHECK_BYPASS_REASON`。
- **预期**：exit 0；首行 === `BYPASS: (未提供原因)`；含 ⑥ 跳过文案。
- **判据**：`status === 0` && 首行逐字 === `BYPASS: (未提供原因)` && `out.includes('⑥ 观察产物门禁跳过（BYPASS）')`。
- **红绿证据**：红 = 缺 reason 时拒绝旁路（故障期卡死）或首行留空（无法审计）；绿 = 缺省文案 + 仍旁路。
- **对应测试**：验收命令（plan 收尾命令清单，不落 `*.test.mjs`；输出贴 `gate-record.md`）
- **不覆盖**：reason 内容质量（无判据）。

#### H39 旁路只跳 ⑥：⑤ 段构造红 → exit 1

- **覆盖**：R6「只跳过 ⑥ 段判定，其余段照跑且仍可红」（`spec:48`）/ 锚点5
- **来源**：R6 明文 + PRD §5.2 最小化约束「子项开关」禁止——旁路只能是整体、不能变成"顺手绕过 ⑤"的通用开关
- **前置**：仓根；先建一个 ⑤ 段必红的构造（`.session/<随机名>.md` 一级散文件，⑤ 段判据见 `scripts/check-all.mjs:331-360`）；`CHECK_BYPASS=1` + reason。
- **步骤**：① `writeFileSync(join(仓根,'.session', `bypass-probe-${process.pid}.md`), 'x')`；② spawn `check-all`（带 BYPASS env）；③ `finally` `rmSync` 该文件；④ 复核 `git status --porcelain` 零残留（`.session/` 被 gitignore，故只核文件已删）。
- **预期**：exit **1**；输出含 `BYPASS:` 首行、含 `[session]` 红行、且含 ⑥ 跳过文案（即 ⑥ 确实被跳、⑤ 确实没被跳）。
- **判据**：`status === 1 && /\[session\]/.test(out) && /BYPASS:/.test(out) && /⑥ 观察产物门禁跳过（BYPASS）/.test(out)`；`finally` 后文件不存在。
- **红绿证据**：红 = 旁路后整段退出 0（旁路变成"全绿开关"，F-18 的整个门禁可被一键关掉）；绿 = 只跳 ⑥、其它段照常红。
- **对应测试**：验收命令（plan 收尾命令清单，不落 `*.test.mjs`；全局态，`finally` 恢复；输出贴 `gate-record.md`）
- **不覆盖**：⑤ 段自身的判据质量（既有门禁回归面）。

#### H40 未设旁路 → 输出无 `BYPASS:` 行

- **覆盖**：PRD `:396` / 锚点5
- **来源**：反向守卫：首行只有"给了开关才出现"，否则旁路可能被写成常打印（审计读到 `BYPASS:` 却没人开开关 → 留痕语义崩）
- **前置**：仓根；env 中**删除** `CHECK_BYPASS` 与 `CHECK_BYPASS_REASON`。
- **步骤**：spawn `check-all`（正常 env），`out` = 合并流。
- **预期**：exit 0；`out` 中 `/^BYPASS:/m` 命中 0；含 ⑥ 计数行（细节由 H49 断）。
- **判据**：`status === 0 && !/^BYPASS:/m.test(out)`。
- **红绿证据**：红 = 旁路常量默认开 / 首行无条件打印（审计被假留痕污染）；绿 = 无 `BYPASS:` 行。
- **对应测试**：验收命令（plan 收尾命令清单，不落 `*.test.mjs`；输出贴 `gate-record.md`）
- **不覆盖**：H49 的计数细节（分开断，避免一例测两件事）。

### H 组：F-24 存量 15 卡豁免窗口（R7 / PRD `:416` / 锚点7）

#### H41 `EXEMPT_CARDS` 恰 15 且每项形如 `agents/<name>.md`（常驻）；集合相等 = 交付时点一次性核（验收）

- **覆盖**：F-24 四出口（`spec:119-126`）/ R7（`spec:49`）/ PRD `:416` C-08 / §11.6 D4（`spec:189`）/ 锚点7（`spec:243`）
- **来源**：`spec:123`「`EXEMPT_CARDS`：15 个**精确相对路径**（`agents/<name>.md`），**一次性**；新增卡不在名单内 → 不享豁免」。**为什么不把「集合 = `agents/*.md` 实跑」写成常驻等值断言**（第 1 轮卡 Q-1-QA4）：`spec:123` 明写「一次性；新增卡不在名单内 → 不享豁免」→ 未来新增第 16 张卡时，常驻等值断言的唯一修法是把新卡塞进 `EXEMPT_CARDS`（= 自动豁免），方向与 C-08 相反；这与 S2 已撤回的「绝对基线 2」是同一型教训（把「交付时点的一次性对账」写成常驻判据 → 为过测而改判据）。
- **前置**：`tools/observation-check/card-exempt.mjs` 已落地，导出 `EXEMPT_CARDS`（数组或 Set 均可，测试统一 `[...EXEMPT_CARDS]`）。
- **步骤**：① 常驻段：`const listed = [...EXEMPT_CARDS]`；② 验收段（交付时点一次）：`node --input-type=module -e "…"` 比对 `[...EXEMPT_CARDS].sort()` 与 `readdirSync('agents').filter(f=>f.endsWith('.md')).map(f=>'agents/'+f).sort()`，打印 `{"equal":true,"real":[…],"listed":[…]}`。
- **预期**：① `length === 15` 且每项匹配 `^agents/[a-z0-9-]+\.md$`；② 打印 `"equal":true`（两侧差集为空时附打印差集以便排障）。
- **判据**：①`EXEMPT_CARDS.length === 15 && [...EXEMPT_CARDS].every(p => /^agents\/[a-z0-9-]+\.md$/.test(p))`；②验收命令输出 `"equal":true`（不等则把两侧差集贴 `gate-record.md` 并**先查是否新增卡**，不直接改名单）。
- **红绿证据**：红 = 清单抄错 / 多列一张（常驻段即红）/ 名单里出现非 `agents/<name>.md` 形态（豁免被扩用到任意路径）；绿 = 15 项且形态全对；集合相等在交付时点单次核（新增卡片导致的差异不构成常驻红）。
- **对应测试**：①常驻 = `card-exempt.test.mjs`；②验收命令（plan 收尾命令清单，交付时点一次性核；输出贴 `gate-record.md`）
- **不覆盖**：卡面内容是否合规（S1，见 §5 第 3 条）；`agents/*.md` 的**可编辑性**（验收段刻意读真 `agents/` 目录，见 §0.2-4 例外说明）。

#### H42 名单外卡 finding → `blockers`

- **覆盖**：`disposeCardFindings`（`spec:126`）/ PRD `:416` C-08 / 锚点7
- **来源**：PRD `:416`「对**逐个列名**的 15 个 `agents/*.md` 只告警」——列名之外不享豁免，否则豁免等于"所有卡都只告警"
- **前置**：同 H41（`card-exempt.mjs` 已落地）。
- **步骤**：`disposeCardFindings([{ file: 'agents/zz-nonexistent-card.md', code: 'HardcodedCount' }])`（构造 finding 只需 `file` 字段，`spec:126` 判定式即 `file ∈ EXEMPT_CARDS`）；`landed` 不传（生产形态）。
- **预期**：`blockers.length === 1`、`warnings.length === 0`；blocker 的 `file === 'agents/zz-nonexistent-card.md'`。
- **判据**：`r.blockers.length === 1 && r.warnings.length === 0 && r.blockers[0].file === 'agents/zz-nonexistent-card.md'`。
- **红绿证据**：红 = 名单外也进 warnings（豁免被泛化到全部卡）；绿 = 进 blockers。
- **对应测试**：`card-exempt.test.mjs`
- **不覆盖**：finding 的其它字段（生产上由 S1 产出，本期无 findings 源，`spec:128` 明示）。

#### H43 名单内 + 未到期 → `warnings`，`blockers` 空

- **覆盖**：未到期态（`spec:126`）/ Q9（`spec:208`）/ R7 未到期态 / 锚点7
- **来源**：`spec:126`「`file ∈ EXEMPT_CARDS && !landed` → 进 `warnings`；否则进 `blockers`」，`landed` 默认值 = 单源常量 `EXPIRY_LANDED`（`spec:125`，本期 `false`，实测值见 H45）
- **前置**：同 H41；本条**不传** `landed`（走默认值）。
- **步骤**：`const [a, b] = [...EXEMPT_CARDS].slice(0, 2); console.log({ picked: [a, b] }); const r = disposeCardFindings([{ file: a }, { file: b }])`——**两名一律从名单实跑集合取前两个，不写死任何名字**（v1 写死 `agents/detective.md` 而该文件不存在，必假红：第 1 轮卡 Q-1-QA2）。
- **预期**：`warnings.length === 2`、`blockers.length === 0`（默认 `landed = EXPIRY_LANDED = false` 生效）；打印出的两名均可被 `EXEMPT_CARDS` 命中。
- **判据**：`r.warnings.length === 2 && r.blockers.length === 0` && `[a, b].every(p => [...EXEMPT_CARDS].includes(p))` && 取到两名非空（`a && b`）。
- **红绿证据**：红 = 未到期就阻断（15 席现网卡全红，S1 一上线即阻塞）；或默认值没接上常量（`landed` 默认 `true` → 同样全红）；或取到不存在的卡名（v1 缺陷，改名单才可能过测 = 扩豁免风险）；绿 = 只告警。
- **对应测试**：`card-exempt.test.mjs`
- **不覆盖**：到期后的行为（H44）；`landed` 默认值是否真的取常量（H45 已断言 `EXPIRY_LANDED === false`，本条只看行为结果）。

#### H44 名单内 + 注入 `{ landed: true }` → `blockers`

- **覆盖**：到期注入签名（`spec:126`）/ Q9（`spec:208`）/ R7 到期态 / PRD `:416` 事件型 / 锚点7
- **来源**：Q9 裁定「`disposeCardFindings(findings, { landed = EXPIRY_LANDED } = {})`，**生产不传、测试注入**」（`spec:126` / `spec:208`）——到期态由参数注入构造，不需要"复制源码改常量"
- **前置**：同 H41；`EXPIRY_LANDED` 仍为 `false`（仓内源码零改动）。
- **步骤**：`const [a, b] = [...EXEMPT_CARDS].slice(0, 2); const before = EXPIRY_LANDED; const r = disposeCardFindings([{ file: a }, { file: b }], { landed: true })`。
- **预期**：`blockers.length === 2`、`warnings.length === 0`。
- **判据**：`r.blockers.length === 2 && r.warnings.length === 0` && `before === EXPIRY_LANDED` && `EXPIRY_LANDED === false`（调用前后同一值：注入只影响本次调用、不改单源常量；v3 修正 v2 的 `EXEMPT_LANDED` 笔误 —— 第 2 轮卡 Q-2-QA3）。
- **红绿证据**：红 = 到期分支不存在 / 写成"永远 warnings"（到期事件永不触发 → PRD `:416` 的"到期后 0 warning"永远不可达）；或 `landed` 参数被忽略（传 `true` 仍进 warnings）；绿 = 注入即阻断、常量未被改写。
- **对应测试**：`card-exempt.test.mjs`
- **不覆盖**：到期事件由 S4 首次重生成"置真"的动作（S4 落地，见 §5 第 2 条）；生产调用不传 `landed` 的形态（H43 覆盖）。

#### H45 常量值 + `check` 按模板打印状态行（含「**卡面**」限定词、`EXPIRY_EVENT` / `EXPIRY_LANDED` 与「非达标证据」短语）

- **覆盖**：状态行模板（`spec:128`，含「**卡面** findings」限定词）/ Q20（`spec:219`）/ `EXPIRY_EVENT`（`spec:124`）/ `EXPIRY_LANDED`（`spec:125`）/ §11.6 D4（`spec:189`）/ 锚点7
- **来源**：`spec:128` 定死模板：`[豁免窗口] 15 张角色卡只告警（到期 = S4 首次重生成，EXPIRY_EVENT=<值> / EXPIRY_LANDED=<值>）；**卡面** findings <n> / 告警 <w> / 阻断 <b>（S1 未上线：非达标证据）`，并明写两点：①「**`n/w/b` 取自 `disposeCardFindings([])` 的返回值**（本期真实运行 = 0/0/0，**不写字面量**）」；②「**『卡面』限定词必须保留**——它与 ⑥ 段的 `findings`（产物问题数）是两个量，同一次输出里不得互相否定」（Q20 `spec:219` / 第 3 轮卡 Q-3-RD3：不加限定词会被读成「产物 0 问题」）。v1 把计数写字面量并逐字锁死 → S1 上线后必说谎（第 1 轮卡 Q-1-BE5 / Q-1-AI4）；v2 只锁模板与两常量；v3 补「n/w/b = 真实返回」；**v4 补「卡面」限定词**。
- **前置**：仓根；`card-exempt.mjs` 已落地；`check-all` ⑥ 段已接线。
- **步骤**：① `import` 断言两常量字面值，并算出 `const empty = disposeCardFindings([])` 的返回值（`{findings:0, warnings:0, blockers:0}` 形态，字段名以实做为准确认）；② spawn `check-all`（正常 env）捕获合并流，检索状态行；③ 断言状态行含「**卡面**」限定词，且三个计数与 `empty` 的对应字段一致。
- **预期**：`EXPIRY_EVENT === 's4-first-regeneration'`、`EXPIRY_LANDED === false`；输出含一行匹配 `/\[豁免窗口\] 15 张角色卡只告警（到期 = S4 首次重生成，EXPIRY_EVENT=s4-first-regeneration \/ EXPIRY_LANDED=false）；卡面 findings \d+ \/ 告警 \d+ \/ 阻断 \d+（S1 未上线：非达标证据）/`；该行解析出的 n/w/b 逐个等于 `disposeCardFindings([])` 返回的对应计数。
- **判据**：两常量逐字相等 && 上述正则命中（**含 `卡面 findings` 这一限定词**；写成裸 `findings \d+` 即不与 ⑥ 段区分 → 红）&& `status === 0` && 输出含 `（S1 未上线：非达标证据）` 短语 && 输出含 `EXPIRY_EVENT=` 与 `EXPIRY_LANDED=`（常量被真读，不是 write-only）&& `n === empty.findings && w === empty.warnings && b === empty.blockers`（把 `empty` 的字段名按实做对齐；不等即说明计数被写成了字面量）。
- **红绿证据**：红 = 状态行被删 / 计数被写成"已达标"（无「非达标证据」短语）/ **丢了「卡面」限定词**（读者把 `findings 0` 当成「产物 0 问题」，与 ⑥ 段计数互相否定，Q20）/ `EXPIRY_LANDED` 被提前置真（豁免提前失效，15 席全红）/ `EXPIRY_EVENT` 从不被打印（常量 write-only，到期事件在代码层不可观测）；绿 = 常量与模板（含「卡面」）逐字在位、两值被打印、三计数来自真实返回。
- **对应测试**：常量半 = `card-exempt.test.mjs`（常驻）；状态行半 = 验收命令（plan 收尾命令清单，不落 `*.test.mjs`；输出贴 `gate-record.md`）
- **不覆盖**：S1 上线后状态行计数会变（本期无 findings 源，故只锁模板与两值，不锁数字）；⑥ 段产物计数与本行「卡面」计数的**数值联动**（两者独立，正因如此才需要限定词，Q20）。

### I 组：静默 skip 守卫（R9 / 锚点6）

#### H46 TAP 内联指令解析出的 skip 名 **⊆** `SKIP_ALLOWLIST`（只按名字判）；解析出 0 个名字 → 判红（fail-closed）

- **覆盖**：skip 守卫单源与 TAP 解析（`spec:130`）/ **只按名字、不比条数（Q19 `spec:218`）** / Q10（`spec:209`）/ R9（`spec:51`）/ 锚点6（`spec:242`）
- **来源**：`spec:130` 定死「**解析形态定死为 TAP 内联指令**：`/^\s*(?:not )?ok\s+\d+\s+-\s+(.*?)\s+#\s+(SKIP|TODO)\b/`（名字取第 1 捕获组，reason 丢弃；**不存在独立的 `# SKIP <名>` 行**）」+「**判据只按名字**：解析出的名字 ⊄ `SKIP_ALLOWLIST` → 红 …… **『`# skipped M`（M>0）但该正则解析不出任何用例名』= fail-closed 红**」+「**不比较条数**（`M` 与名单长度可不等：`DW_RUNTIME_CHECK=1` 让 skip 真跑时为 0）」。实跑样本见 §0.1-14：`ok 9 - TC-A10 运行时就位：两条 Test-Path 为 True（aas sync 后本机验） # SKIP 本机运行时验：…`。v4 按第 3 轮卡 Q-3-BE1 删掉 v3 的「与名单长度相等」断言（那是条数判）。
- **前置**：仓根；`check-all.mjs` ② 段已按 `SKIP_ALLOWLIST` 加守卫（不再扫源码文本）。**spawn 的 env 必须删除 `DW_RUNTIME_CHECK`**（`const env = { ...process.env }; delete env.DW_RUNTIME_CHECK`）：该变量被设时那 2 条 skip 会真跑 → `# skipped 0`、解析集为空 → 会被 fail-closed 误判成红（第 3 轮卡 Q-3-AI2）。若父 shell 已设该变量，先 `Remove-Item Env:DW_RUNTIME_CHECK` 再跑。
- **步骤**：① `import { SKIP_ALLOWLIST } from '../../scripts/test-skip-allowlist.mjs'`（**不断言条数**）；② spawn `check-all`（`env` 已删 `DW_RUNTIME_CHECK`），`out` = 合并流，取 `# skipped N`（`N` 只用于 ③ 的 fail-closed 前置，**不与名单长度比较**）；③ `const parsed = tapNames(out, 'skip')`（§1.2 / §0.2-8 的唯一正则）；④ 断言 `parsed` 每一项都 ∈ `SKIP_ALLOWLIST`（**方向：解析集 ⊆ 名单**）；⑤ fail-closed：`N > 0 && parsed.length === 0` → `assert.fail(...)`。
- **预期**：`status === 0`；`parsed.length === Number(skipped)`（解析出的名字数与汇总计数自洽）；**解析集 ⊆ `SKIP_ALLOWLIST`**（无名单外名字）；`SKIP_ALLOWLIST` 里可以有本期未出现的项（不算红——`DW_RUNTIME_CHECK` 或分支差异会让它为 0）。
- **判据**：①`assert.deepEqual(parsed.filter(n => !SKIP_ALLOWLIST.includes(n)), [])`（**名单外名即红**，并把逐个名字打印出来；方向只此一向，倒过来会因名单冗余项假红）；②`status === 0 && Number(skipped) === parsed.length`；③**fail-closed**：`Number(skipped) > 0 && parsed.length === 0` → 直接 `assert.fail('skip 名解析失败：skipped>0 但 TAP 内联正则解析出 0 个名字')`。**不写任何条数比较**（`=== SKIP_ALLOWLIST.length` 一律禁止，Q19 `spec:218`）。
- **红绿证据**：红 = 仍假设独立 `# SKIP <名>` 行（v2 的 `/^# SKIP (.+)$/m` 恒解析 0 个 → fail-closed 恒红）；或按条数比（`DW_RUNTIME_CHECK=1` 时为 0 → 假红，Q19）；或 spawn 未删 `DW_RUNTIME_CHECK`（父 shell 设了就同样假红，Q-3-AI2）；或名单载体仍内联在 `check-all.mjs`（`spec:130` 单源被破）；或解析不到名字仍判绿（假绿）；绿 = 单源 import + TAP 内联解析 + 解析集 ⊆ 名单。
- **对应测试**：验收命令（plan 收尾命令清单，不落 `*.test.mjs`；输出贴 `gate-record.md`）
- **不覆盖**：实现侧「`# skipped > 0` 但解析不出名字 → `check-all` 自己红」这条分支的**独立构造**（现网拿不到这种输出，构造手段不稳，见 §5 第 11 条）；`# skipped` 值为 0 的分支（无判据需求）；`todo` 侧（H48）；`SKIP_ALLOWLIST` 的**条数**（Q19 明确不比）。

#### H47 插一条名单外 `skip` 测试 → 红

- **覆盖**：红时文案（`spec:130`）/ Q10（`spec:209`）/ R9（`spec:51`）/ 锚点6
- **来源**：`spec:130` 定死红时文案 `[测试] 名单外 skip：<用例名>`；不构造就永远不知道守卫是否真的在查（`skipped` 被当通过的假绿是 S2 已踩过的形态）
- **前置**：仓根；临时新建 `tools/observation-check/zz-skip-probe.test.mjs`，内容 = 一条 `test('ZZ probe 名单外 skip', { skip: true }, () => {})`。
- **步骤**：① 写该文件；② spawn `check-all`；③ `finally` `rmSync` 该文件；④ `git status --porcelain` 复核零残留（文件在未被 add 的前提下删除）。
- **预期**：exit **1**；`out`（合并流）含一行 `[测试] 名单外 skip：ZZ probe 名单外 skip`。
- **判据**：`status === 1 && /\[测试\] 名单外 skip：ZZ probe 名单外 skip/.test(out)`；`finally` 后文件不存在。
- **红绿证据**：红 = 守卫按数量判或未实现（新增 skip 静默通过）；或红行不点名（`spec:130` 的文案被改，排障者无从定位）；绿 = 文案逐字 + 点名报红。
- **对应测试**：验收命令（plan 收尾命令清单，不落 `*.test.mjs`；全局态，`finally` 恢复；输出贴 `gate-record.md`）
- **不覆盖**：`SKIP_ALLOWLIST` 内容（H46）。

#### H48 插一条名单外 `todo` 测试 → 红

- **覆盖**：红时文案（`spec:130`）/ Q10（`spec:209`）/ R9「`# todo M` 同样核」（`spec:51` / `spec:130`）/ 锚点6
- **来源**：`spec:130` 明写 `# skipped M` / `# todo M` 一并核——`todo` 与 `skip` 是同一"不计入通过"的假绿面，只拦 skip 等于留一半口子；红时文案 `[测试] 名单外 todo：<用例名>`。
- **前置**：同 H47，文件内容 = `test('ZZ probe 名单外 todo', { todo: true }, () => {})`。
- **步骤**：同 H47（写 → spawn → finally 删 → 复核）。
- **预期**：exit **1**；`# todo 1` 与 `[测试] 名单外 todo：ZZ probe 名单外 todo` 同在输出。
- **判据**：`status === 1 && /\[测试\] 名单外 todo：ZZ probe 名单外 todo/.test(out) && /#\s*todo\s+1/.test(out)`。
- **红绿证据**：红 = 只核 skip 不核 todo（todo 测试静默计零）；绿 = 文案逐字 + 点名报红。
- **对应测试**：验收命令（plan 收尾命令清单，不落 `*.test.mjs`；全局态，`finally` 恢复；输出贴 `gate-record.md`）
- **不覆盖**：`todo` 在白名单内的情形（当前白名单无 todo 项，spec 未给合法 todo）。

### J 组：整体不红、现状复算与码集合封闭

#### H49 `npm run check` 全绿 + ⑥ 计数行可解析 + 过程 0 对 + ⑤ 在 ⑥ 之前

- **覆盖**：计数行（`spec:85`）/ Q6（`spec:205`）/ Q2 段序（`spec:201`）/ Q14 计义（`spec:213`）/ Q19（`spec:218`，**不比条数**）/ Q16（`spec:215`）/ 锚点4（`spec:240`）
- **来源**：`spec:240`「`npm run check` 全绿且新增 ⑥ 段打印四个计数」+ `spec:85` 计数行文案 + `spec:201`「⑥ 排在现有 ⑤ 之后」。**v2 不逐字锁整行**（第 1 轮卡 Q-1-QA5 / Q-1-AI3 / Q-1-RD2）：过程目录每轮 +1，任何等值断言都必在验收期漂；改为**可解析形态 + 对「过程 0 对」单独断**（Q16 明文：目录数打印不判）。**v4 按第 3 轮卡 Q-3-BE1 删除原「`# skipped` 数 = `SKIP_ALLOWLIST.length`」断言**：`spec:130` + Q19（`spec:218`）已定「**不比较条数**」（`DW_RUNTIME_CHECK=1` 时 skip 会真跑为 0，条数相等会假红）。
- **前置**：仓根；S3 全部接线完成；`.session/tmp/` 已清空（否则 ⑤ 红）；归档现状 = 2 子目录 / 1 对产物、过程侧 0 对（§0.1 实测）。**spawn 的 env 删除 `DW_RUNTIME_CHECK`**（第 3 轮卡 Q-3-AI2：该变量被设时那 2 条 skip 真跑 → `# skipped 0`，与 §0.1 基线不同态；若父 shell 已设，先 `Remove-Item Env:DW_RUNTIME_CHECK`）。
- **步骤**：spawn `check-all`（cwd = 仓根，`env` 已删 `DW_RUNTIME_CHECK`），`out` = stdout + stderr 合并。
- **预期**：exit 0；末行 `check 全部通过`；`out` 含一行匹配 `^⑥ 观察产物门禁：扫描 \d+ 个子目录 \/ 归档 \d+ 对 \/ 过程 \d+ 对 \/ findings 0$`（无「（归档 0 件，跳过）」后缀——扫描根有子目录）；该行解析出的**过程对数 = 0**；`⑤` 行在 `⑥` 行之前。
- **判据**：`status === 0` && `/check 全部通过/.test(out)` && `const m = out.match(/^⑥ 观察产物门禁：扫描 (\d+) 个子目录 \/ 归档 (\d+) 对 \/ 过程 (\d+) 对 \/ findings 0$/m)` 命中 && `Number(m[3]) === 0` && 该行不含 `（归档 0 件，跳过）` && `out.indexOf('⑤') < out.indexOf('⑥')`。**本条不含任何 `# skipped` 断言**（条数判已删，skip 守卫由 H46 按名字判）。
- **红绿证据**：红 = 无关文件让门禁变红 / ⑥ 段无计数行（"扫了没扫"无现场证据）/ 计数行文案与 `spec:85` 的结构不符（四个计数的位置漂移，人工复核失去锚）/ 过程对数 ≠ 0（过程侧冒出了成对产物，R3 口径或扫描根有问题）/ ⑥ 排在 ⑤ 之前（Q2 被改）；绿 = 全绿 + 计数行可解析 + 过程 0 对 + 顺序正确。
- **对应测试**：验收命令（plan 收尾命令清单；`npm run check` ~24s，不落 `*.test.mjs`——套内自跑会递归，Q11 `spec:210`；输出贴 `gate-record.md`）
- **不覆盖**：`scannedDirs` / `archivePairs` 的**数值来源**（H06/H50 分别核；本条只判结构可解析 + 过程 0 对）；零产物分支的行尾后缀（H01）。

#### H50 真实仓根全扫：0 findings、`scannedDirs ≥ 2`、`archivePairs ≥ 1`、过程 0 对，且两目录按名在位（计数只打印不判）

- **覆盖**：锚点2（`spec:238`）/ 锚点3（`spec:239`）/ PRD `:411` `:413` / Q16（`spec:215`）/ 锚点1 的"不误红"侧
- **来源**：`spec:238`（锚点 2）明写「**判据取下界** `scannedDirs ≥ 2 && archivePairs ≥ 1` + **按名断言两目录在位**（plan 的迁移演练会使计数 +1，**不钉等值**）」+ `spec:239`（锚点 3）「过程目录（≥49）0 产物 → 0 findings，无 `ArtifactMissing`」+ `spec:215`（Q16）「过程目录数**不写死**：判据只断 `processPairs === 0` 与『无 `ArtifactMissing`』，目录数打印不判」。v3 修正 v2 的等值断言（第 2 轮卡 Q-2-QA6 / Q-2-AI4 / Q-2-RD1）。
- **前置**：仓根工作树干净（归档件已 commit、无 M）；`.session/tmp/` 清空。
- **步骤**：由真仓根调 gate——`spawnSync(process.execPath, ['--input-type=module','-e', DRIVER], { cwd: 仓根 })`（driver 同 §1.2，`repoRoot()` 在子进程内取真仓根）；同时取**按名**证据 `existsSync(join(仓根,'docs','superpowers','reviews', 名))`（两个名字各一次）与**不判**的两个目录计数。
- **预期**：`findings === []`；`scannedDirs ≥ 2`；`archivePairs ≥ 1`；`processPairs === 0`；`2026-10-25-1723-s6-eval` 与 `2026-10-27-1200-migration-drill` 两个子目录**均在位**；打印出的过程目录数 **≥49**（2026-10-27 23:37 实测 50，每轮 +1）。
- **判据**：`assert.deepEqual(res.findings, [])` && `res.scannedDirs >= 2 && res.archivePairs >= 1 && res.processPairs === 0` && `!res.findings.some(f => f.code === 'ArtifactMissing')` && `existsSync(<s6-eval>) && existsSync(<migration-drill>)`；**过程目录数与 `scannedDirs/archivePairs` 的绝对值只进输出、不进断言**（下界 + 按名两者合起来已保证「这两个真目录确实被枚举并被判绿」，同时容纳 plan 的迁移演练带来的 +1）。
- **红绿证据**：红 = 存量白名单目录被误红（存量不追溯失效）/ 演练件被判码（现存唯一产物本已四段绿 + 已 commit）/ 过程目录假红 / 两个具名目录有一不在位（有人误删或改名，锚点 2 的前提消失）；绿 = 0 findings + 下界成立 + 两目录按名在位。
- **对应测试**：验收命令（真仓根依赖"当前归档现状"这一时点事实，不设常驻；输出贴 `gate-record.md`）
- **不覆盖**：归档目录未来的增长（下界已容纳 +1，新增目录须按 §4 回归清单重跑本条）；过程目录数的绝对值（Q16：移动靶，打印不判）；`scannedDirs` 计义之外的其它计数（见 §0.2-2）。

#### H51 锚点8：仓根 `node --test "tools/observation-check/*.test.mjs"` → `# tests ≥ 166`、`# fail 0`、`# pass + # skipped = # tests`

- **覆盖**：锚点8（`spec:244`）/ §11.6 D7 命令写法（`spec:192`）/ Q11（`spec:210`）
- **来源**：`spec:244` + `spec:192`：D7 把命令统一为"仓根 + 带引号 glob"，理由 = 裸 glob 不展开得 `# tests 0` 且 exit 0（假绿）；Q11 明确**不钉 `# tests` 增量**（增量按用例数算会与 `test()` 调用数错位），兜底 = `# pass + # skipped === # tests` 且 `# tests ≥ 166`。
- **前置**：S3 全部测试落地。
- **步骤**：仓根执行 `node --test "tools/observation-check/*.test.mjs"`，解析汇总行 `# tests` / `# pass` / `# fail` / `# skipped`。
- **预期**：exit 0；`# tests ≥ 166`（S2 基线只增不减）；`# fail 0`；`# pass + # skipped === # tests`。
- **判据**：`status === 0` && `Number(tests) >= 166` && `Number(fail) === 0` && `Number(pass) + Number(skipped) === Number(tests)`。
- **红绿证据**：红 = 命令写法退回"先 cd 再裸 glob"（`# tests 0` 假绿）/ 新增测试有红 / 有 `# todo`（会让 pass+skipped < tests）；绿 = 锚点 8 达标。
- **对应测试**：验收命令（嵌套 `node --test` 会与 ② 段互踩，不设常驻；输出贴 `gate-record.md`）
- **不覆盖**：单个测试名逐条在位（判据是"总数只增 + 全绿 + 三数自洽"，逐名锁死会禁合法重构）；`# tests` 的具体增量值（Q11 明确不钉）。

#### H52 e2e：塞一个缺产物目录 → exit 1 + `[observation] ArtifactMissing: <path> —— <msg>`

- **覆盖**：findings>0 → failed（`spec:70` / `spec:84`）/ 打印形态（`spec:84`）/ 目录级 path（`spec:81`）/ Q5（`spec:204`）+ Q6（`spec:205`）/ `ArtifactMissing`（`spec:140`）/ 锚点1
- **来源**：锚点 1「门禁真红」的**端到端口**：判定层报码（H07）与"门禁真的红、真的打印"是两件事；打印格式 `[observation] <code>: <path> —— <message>`（`spec:84`）与 `path` = 仓内 POSIX 相对路径（`spec:81`）都是 spec 定死的现场证据。
- **前置**：仓根；临时新建 `docs/superpowers/reviews/2026-10-27-9999-probe/`（空目录，不在存量白名单）。
- **步骤**：① `mkdirSync` 该目录；② spawn `check-all`；③ `finally` `rmdirSync`；④ `git status --porcelain` 复核零残留。
- **预期**：exit **1**；`outCombined` 含一行匹配 `^\[observation\] ArtifactMissing: docs/superpowers/reviews/2026-10-27-9999-probe/? —— .+$`；末行 `check 未通过`。
- **判据**：`status === 1 && /\[observation\] ArtifactMissing: docs\/superpowers\/reviews\/2026-10-27-9999-probe\/? —— .+/m.test(outCombined) && /check 未通过/.test(outCombined)`；`finally` 后目录不存在。
- **红绿证据**：红 = ⑥ 段只判定不接 `failed` 出口（报码却仍 exit 0 → 门禁形同虚设）/ 打印无 path、path 用反斜杠或绝对路径（`spec:81` 被破）或分隔符与 `spec:84` 不一致；绿 = 真红 + 格式逐字。
- **对应测试**：验收命令（plan 收尾命令清单，不落 `*.test.mjs`；全局态，`finally` 恢复；输出贴 `gate-record.md`）
- **不覆盖**：findings 之间的**语义顺序**（`spec:80` 不按目录聚合、不按码去重，但未定排序规则——无判据）；多条拼接的**行格式与 `\n` 连接**由 **H01 ①d** 覆盖（`spec:163`「多条 findings → 逐行 `\n` 拼接、顺序 = 数组顺序」；v4 修正 v3 这里「由本条单条形态覆盖」的错误声明 —— 第 3 轮卡 Q-3-QA1）。

#### H53 静态：`gate-run.mjs` 码字面 ⊆ 4 个门禁码 + S2 源已出现码（自造 = 0）

- **覆盖**：R8（`spec:50`）/ §11.3 码表（`spec:134-147`）/ PRD §4.4 `:362`
- **来源**：R8「不新增错误码」——新增码必须先回 PRD 登记；这条只能靠"码字面全部可溯源"来机械判。v2 起门禁侧码集 = `{UntrackedArtifact, ArtifactDirty, ArtifactNamingOff, RepoRootUnresolved}`（D3 `spec:188` 把 git 故障归到 `RepoRootUnresolved`，第 1 轮卡 Q-1-BE3）。
- **前置**：`gate-run.mjs` 已落地；S2 四源（`gate-scan.mjs` / `artifact.mjs` / `checks.mjs` / `evidence.mjs`）在场。
- **步骤**：① 抽取 `gate-run.mjs` 全部 `code: '...'` 字面量；② 逐个判定：`∈ {UntrackedArtifact, ArtifactDirty, ArtifactNamingOff, RepoRootUnresolved}` **或** 该字面量在四个 S2 源文件文本里出现过（= 透传，非自造）。
- **预期**：违规字面量 = 0（打印每一条违规项以便排障）。
- **判据**：`const bad = literals.filter(c => !GATE.has(c) && !S2_TEXT.includes(`'${c}'`) && !S2_TEXT.includes(`"${c}"`)); assert.deepEqual(bad, [])`。
- **红绿证据**：红 = 接线自造码（如 `MdNotRendered` / `ArtifactNamingMismatch`），排障者 grep 不到、PRD 无法登记；或把 git 故障另起新码而非用已登记的 `RepoRootUnresolved`；绿 = 全部可溯源。
- **对应测试**：`gate-run.test.mjs`（静态段）
- **不覆盖**：S2 源内码名本身的正确性（S2 166 条测试 + PRD §4.4 A/B 表）；`card-exempt.mjs` 的 findings 码（本期无 findings 源，`spec:128` 明示）。

### K 组：D1 优先级反例（v2 新增，Q-1-BE4）

> 本组只有 H54。编号追加在末尾以保持 H01–H54 **按文件顺序连续不跳号**（内容归属 D1，对位见 §1.1「§11.2 根层散文件与零产物优先级」行）。

#### H54 根层散文件 + 0 子目录 → 仍红（`UnclassifiedArtifact`），不是「0 件，跳过」

- **覆盖**：§11.2 D1 优先级（`spec:99`）/ PRD `:408` / §11.3 `UnclassifiedArtifact`（`spec:141`）/ 锚点1（`spec:237`）
- **来源**：`spec:99` 定死了优先级——「根层散文件一律 `UnclassifiedArtifact`……**『0 件，跳过』只在『子目录数 = 0 且根层无散文件』时成立**」。不钉这条就等于留了一个免检出口：只往扫描根塞文件、永不建子目录（第 1 轮卡 Q-1-BE4 指出的正是这个组合）。
- **前置**：`mkRepo()` 后**不建任何子目录**，只在扫描根根层写 `notes.md`（`.session/reviews/` 保持空）。
- **步骤**：`const res = runGate(repo)`。
- **预期**：`findings` 恰 1 条 `UnclassifiedArtifact`；`scannedDirs === 0`；**不**出 `ArtifactMissing`（无子目录可缺产物）。
- **判据**：`const un = res.findings.filter(f => f.code === 'UnclassifiedArtifact'); un.length === 1 && /notes\.md/.test(un[0].message)` && `!res.findings.some(f => f.code === 'ArtifactMissing')` && `res.scannedDirs === 0` && `res.findings.length === 1`。
- **红绿证据**：红 = 零产物分支先于根层检查（`scannedDirs === 0` 即「0 件，跳过」→ 根层塞文件永不红，F-18 的目录级反向清单被绕过）；绿 = 0 子目录但根层有散文件仍报码。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：`check-all` 侧的打印形态（本条的「不是 0 件跳过」在 gate 层已定：findings 非空；打印侧的两种形态由 H01（`formatGateLine` 四形态）与 H52（findings 行）各钉一侧）；根层散文件与子目录**并存**的形态（H11）。

### L 组：过程根不存在（v3 新增，Q-2-BE4）

> 本组只有 H55，追加在末尾以保持 H01–H55 **按文件顺序连续不跳号**（内容归属 R3 / §11.2 过程侧口径，对位见 §1.1）。

#### H55 临时仓不建 `.session/reviews` → `processPairs 0`、`findings === []`、不出现 `ArtifactNamingOff`

- **覆盖**：R3「过程根不存在 → 0 对、不报码」（`spec:45`）/ §11.2 过程侧口径末句（`spec:103`）/ §11.5 过程目录口径末项（`spec:168`）/ 锚点3（`spec:239`）/ §11.3 `ArtifactNamingOff` 用法边界（`spec:147`，反例）
- **来源**：`spec:103` 末句「**过程根 `.session/reviews` 不存在时 = `processPairs 0`、不报码**（与 ⑤ 段『无该目录则跳过』同口径）」+ R3（`spec:45`）同款措辞。理由 = 干净克隆 / CI 天然没有 `.session/`（该目录不进 git），若把它当「扫描根不可用」报 `ArtifactNamingOff`，则**任何干净环境一上来就红**——码的用法边界（`spec:147`）也明确 `ArtifactNamingOff` 只用于**归档侧扫描根**不可用。
- **前置**：`mkRepo({ session: false })`——临时 git 仓已 `git init` + `commit --allow-empty`，`docs/superpowers/reviews/` 为**空目录**（0 子目录、0 散文件），`.session/reviews` **不建**。
- **步骤**：`const res = runGate(repo)`。
- **预期**：`processPairs === 0`；`findings === []`；`scannedDirs === 0`、`archivePairs === 0`；**不出现** `ArtifactNamingOff`（也不出现任何码）。
- **判据**：`assert.deepEqual(res.findings, [])` && `res.processPairs === 0 && res.scannedDirs === 0 && res.archivePairs === 0` && `!res.findings.some(f => f.code === 'ArtifactNamingOff')`（显式写出，防"空数组先过"掩盖语义）。
- **红绿证据**：红 = 把「过程根不存在」当扫描根不可用 → `ArtifactNamingOff`（干净克隆 / CI 恒红，门禁不可用）；或反过来漏扫过程侧（`processPairs` 非 0 或抛栈）；绿 = 0 findings + 0 对 + 无码。
- **对应测试**：`gate-run.test.mjs`
- **不覆盖**：过程根**存在但为空**的形态（H27 已覆盖 3 个空子目录 → `processPairs 0`）；档位级「⑤ 段无 `.session/` 则跳过」的文案（既有门禁回归面，`scripts/check-all.mjs:364`）。

## 3 负例与边界汇总

**数量硬门（自证）**：

| 项 | 值 | 复算方式（cwd = 仓根） |
|---|---|---|
| 用例总数 | **55**（H01–H55，按文件顺序连续不跳号） | `(Select-String -Path 'docs\superpowers\specs\2026-10-27-s3-gate-wiring-design-testcase.md' -Pattern '^#### ').Count` → 55 |
| 正例 | **13** | `(Select-String -Path <本文件> -Pattern '^\| H\d{2} \|.*\| 正 \|[^\|]*\| (常驻\|验收)[^\|]*\|').Count` → 13 |
| 负例 | **24** | 同式换 `\| 负 \|` → 24 |
| 边界 | **18** | 同式换 `\| 边界 \|` → 18（三条合计 55 = ①；H55 计入边界） |
| **负例 + 边界 vs 正例** | **42 ≥ 13**（3.2 倍） | 硬门（`spec-testcase-gate` 判据 3）通过 |
| 常驻 : 验收 | **43 : 12**（验收 = H37–H40、H45–H52 共 12 条；H01 / H41 各另有验收半段，主归属常驻） | 见各条「对应测试」字段；载体按 Q11（`spec:210`）= plan 命令清单 + `gate-record.md`；**不推 `# tests` 增量** |

> 计数口径说明：类型三条正则必须带尾部 `\| (常驻\|验收)[^\|]*\|`——只有 §1 覆盖总表有「执行」列，本节（§3）的类型列格式不同，不加该尾巴会把本节的汇总行也计进去（重复计数）；`[^\|]*` 用于容纳 H01 / H41 的「常驻 + 验收」双段写法。

判读说明：**负例** = 坏构造必须出码 / 必须红（0 码 = 假绿 = 本 testcase 红线）；**边界** = 合法但极易被误判的形态（含 H12/H30/H31/H35/H40 这类"故意绿"的守卫——它们翻红才是缺陷）。

| ID | 类型 | 打的失败面（一句话） | 为什么容易漏（机制） | 期望 |
|---|---|---|---|---|
| H02 | 负 | 扫描根不存在 | 最省事的实现是 `mkdirSync` 兜底 / `existsSync` 为假时 return 空 findings | `ArtifactNamingOff` |
| H03 | 负 | 扫描根是文件（`ENOTDIR`） | IO 异常冒泡 = 整段 `check` 以堆栈中止 | `ArtifactNamingOff`，不抛 |
| H05 | 负 | 第二个 root 来源 / 自建判据副本 / 根层套允许类 / 多调用点 / **内联 ⑥ 段字面量** | "复制一段正则过来更快"，两份实现必漂（S2 教训 `splitRow`）；或保留 `root` 形参便于测试；或把 `ALLOWED_FILE_RE` 顺手用到根层；或 `check-all` 手拼 `[observation]` / 计数行 | ①–⑥ 全真（含 `cwd=<repo>/tools` 的行为断言 + `ALLOWED_FILE_RE` 不在正文 + `formatGateLine(` 在、两种字面量都不在） |
| H07 | 负 | 白名单外目录缺产物（含**只含允许类账本**） | 「有允许类文件 = 已交卷」；或把 PRD `:410` 读成「账本-only 也放行」（D9 被绕）；或白名单写成前缀匹配 | 两形态均恰 1 条 `ArtifactMissing`，`norm(path)` 逐字 = `<次>`，无 `UnclassifiedArtifact` |
| H08 | 负 | 目录含杂件 | 反向清单停在纯函数层，接线根本不传 `files`；或解析 message 反推文件名 | `UnclassifiedArtifact`，path 到 `<次>/`、文件名在 message |
| H09 | 负 | 杂件 + 缺产物并列 | 实现写成 if/else，两码互相遮蔽 | 两码同现 |
| H11 | 负 | 扫描根根层散文件（D1，含 `progress.md` 允许名） | PRD 只定义子目录三态，根层"没有归属"最容易被跳过；把允许类套到根层 → `progress.md` 成免检出口 | 两形态均恰 1 条 `UnclassifiedArtifact`，无 `ArtifactMissing` |
| H13 | 负 | `attachments/` 两层嵌套 | 递归列举时只留 basename（子层被压成一层 → 无底洞放行） | 恰 1 条 `UnclassifiedArtifact`，文件名只在 message |
| H14 | 负 | 根层放**产物名**文件（D1 强形态） | 见到产物名就当产物，忽略"无 `<次>/` 归属" | 恰 1 条 `UnclassifiedArtifact` |
| H54 | 负 | 根层散文件 **+ 0 子目录**（D1 优先级） | 零产物分支先于根层检查 → 「0 件，跳过」成了免检出口 | 仍红：恰 1 条 `UnclassifiedArtifact`，`scannedDirs 0` |
| H15 | 负 | 孤立 md（D2） | 三态看 `ARTIFACT_RE` 含 md → 判"有产物"绿；再以 json 为锚校验 → json 不在 | `JsonNotFound` |
| H16 | 负 | json 在 md 缺 | 接线若自己拼 md 路径或跳过 md 存在性；或前置未提交致多码 | **恰 1 条** `MdMissing` |
| H17 | 负 | json 结构错 | 渲染错短路后结构错被吞；或根本没接四段 | `MissingItems` |
| H18 | 负 | 归档件 md 被手改 | 只判 json 存在性 = PRD §5.3 第 1 行失效 | `RenderMismatch` |
| H19 | 负 | `check:'ai'` 缺 `-a`/`-b` | 接线调 `validateObservation`（弱入口）而非 `validateArtifact` | `InstanceMissing` |
| H22 | 负 | 归档件未 `git add` | 断言命令漏 `--`（路径被当 revision）或干脆不断言索引；或按码去重成 1 条 | **恰 2 条** `UntrackedArtifact`（json + md 各一条、path 逐条相等） |
| H23 | 负 | 提交后手改 | 只断言 `ls-files`（已跟踪即绿）漏掉工作树 | `ArtifactDirty` |
| H24 | 负 | 非 git 工作树 | `rev-parse` 失败被当"跳过 git 段"（"无法断言"≠"没问题"） | `RepoRootUnresolved`（不抛栈） |
| H29 | 负 | 过程产物缺 md | "过程侧只列目录不校验"（把"只做四段"读成"什么都不做"） | `MdMissing` |
| H39 | 负 | 旁路顺手跳过 ⑤ | 旁路若写成全局 `process.exit(0)` / 提前 return，整段门禁可一键关 | exit 1 + ⑤ 红行在 |
| H42 | 负 | 名单外卡 | 豁免写成"所有 `agents/*.md`" = 名单形同虚设 | `blockers` |
| H47 | 负 | 名单外 `skip` | 守卫按数量判（"恰好 2 条"）或未实现 | exit 1 + `[测试] 名单外 skip：<用例名>` |
| H48 | 负 | 名单外 `todo` | 只核 `skip` 不核 `todo`，一半假绿口子 | exit 1 + `[测试] 名单外 todo：<用例名>` |
| H52 | 负 | ⑥ 只报码不接 `failed` | 判定段与总出口未连（"报了但没红"） | exit 1 + 打印格式逐字 |
| H04 | 边界 | 全在存量白名单 | 白名单写成前缀匹配 / 目录名抄错 | 0 findings |
| H10 | 边界 | 8 类允许文件名（含 `cards/`） | 子层裁剪错、清单抄漏一类 | 无 `UnclassifiedArtifact` |
| H12 | 边界 | `attachments/` 一层快照 | 把子层当根层判 → C-12 通道被自家门禁锁死 | 0 findings |
| H20 | 边界 | 大写后缀产物名 | 偷偷放宽正则（命名错被放行） / 或扩用 `ArtifactNamingOff`（`spec:147`） | 两码并列 + **不报** `ArtifactNamingOff` |
| H25 | 边界 | git spawn 失败（子进程 `PATH` 空） | `spawnSync.error` 非空被当"正常返回 0 之外"的普通情况 | `RepoRootUnresolved`，本进程 env 未改 |
| H26 | 边界 | 只对 json 做 git 断言 | 两文件各两条断言，md 侧最易漏 | `.md` 的 `UntrackedArtifact`，`norm(path)` 逐字 |
| H30 | 边界 | 过程目录只有 md | 过程侧套成对判定 / 三态 | findings 全空（`JsonNotFound`/`ArtifactMissing`/`UnclassifiedArtifact` 均不出，`spec:103`） |
| H31 | 边界 | 过程目录杂件 | 反向清单被套到过程侧（数十目录假红） | 0 findings |
| H35 | 边界 | 迁移后两侧副本并存 | 两侧口径串味（过程侧报归档的码 / 归档侧漏报） | 全 `UntrackedArtifact` 且过程侧 0 |
| H36 | 边界 | 门禁"顺手 `git add`" | spec 说不做，不观测就等于允许（Q3 的同类风险） | HEAD / status 前后不变 |
| H38 | 边界 | 缺 reason 时是否仍旁路 | 缺 reason 被判"非法旁路"（故障期卡死） | `BYPASS: (未提供原因)` + 仍跳过 |
| H40 | 边界 | 旁路常开 / 首行无条件打印 | 留痕被假 `BYPASS:` 污染 | 无 `BYPASS:` 行 |
| H43 | 边界 | 未到期就阻断 | 15 席现网卡全红（S1 上线即阻塞）；或取到不存在的卡名 | `warnings` 2 / `blockers` 0（两名取自 `EXEMPT_CARDS` 前两个） |
| H44 | 边界 | 到期分支永不触发 | 到期事件不可达（`EXPIRY_LANDED` 只写不读）；或 `landed` 参数被忽略 | 注入 `{landed:true}` → `blockers` 2，常量未改 |
| H45 | 边界 | 状态行被删 / 冒充"已达标" / 常量 write-only / **丢「卡面」限定词** | 计数行是"扫了没扫"的唯一现场证据；字面量锁定会随 S1 上线说谎；裸 `findings` 会被读成「产物 0 问题」（Q20） | 两常量逐字 + 模板命中（含 `卡面 findings`）+ 非达标短语 + 两值被打印 |
| H51 | 边界 | 命令退回裸 glob | PowerShell 下 glob 不展开 → `# tests 0` + exit 0（假绿） | `# tests ≥ 166` / `# fail 0` / `pass + skipped = tests` |
| H53 | 边界 | 接线自造码 / git 故障另起新码 | 自造码排障 grep 不到、PRD 无法登记 | 违规字面量 0 |
| H55 | 边界 | 过程根 `.session/reviews` 不存在（干净克隆 / CI） | 把「过程根缺失」当扫描根不可用 → 报 `ArtifactNamingOff`，干净环境恒红；或反过来漏扫过程侧 | `findings === []`、`processPairs 0`、**无 `ArtifactNamingOff`** |

## 4 与 spec 的差异 / 待澄清 → **已全部按议会裁定落入 spec（第 1 轮 C1–C8 + 第 2 轮 Q-2 系列）**

**状态：C1–C8 全部「已按第 1 轮答辩裁定落入 spec §11.x」；第 2 轮追加的裁定（TAP 解析 / `formatGateLine` / 根层语义 / 过程根 / 去移动靶等）见 §4.2 逐卡对照**（2026-10-27，spec 已二次重写并同步行号）。本节保留原「未定义 / 不可测之处」与「建议 + 取舍 + 验收」作为**裁定依据**（当时为何要提），右列给出裁定落点与本文件的处置。**本节只作登记**：本文件不改 spec（角色卡铁律 3），裁定原文一律以 spec 为准。

| # | 原「未定义 / 不可测」之处（裁定依据，保留） | 裁定（`spec:行号`） | 裁定后本文件的处置 | 影响用例 | 状态 |
|---|---|---|---|---|---|
| C1 | **finding 的字段名与粒度**未写死：只给打印格式 `[observation] <code>: <path> —— <message>`，没说字段名、没说"一文件一条"还是"一目录一条"/"同码去重" → 用例只能靠"包含关系"兜底 | **Q5**（`spec:79-81` / `spec:204`）：`finding = { code, path, message }`；文件级 `path` = 该文件仓内 POSIX 相对路径、每文件每命令最多一条；**目录级 `path` = `<次>/`，杂件名留 `message`** | H07 / H22 / H26 / H52 直接断言 `f.code` 与 `norm(f.path)`；H08 / H13 改为「path 到 `<次>/`、文件名在 message」；H11 / H14 改「恰 1 条 + 无 ArtifactMissing + 文件名在 message」 | H07、H08、H11、H13、H14、H22、H26、H52 | **已裁定（Q5）** |
| C2 | **计数行文案与数字顺序**未定死；「0 件，跳过」**未写谁打印**；零分支与根层散文件的优先级未定 | **Q6**（`spec:83-86` / `spec:205`）+ **D1**（`spec:99`）：输出全部由 `check-all` 打印；零产物分支 = 「子目录 0 **且** 根层无散文件」，行尾「（**归档** 0 件，跳过）」且**只跳归档侧**；根层散文件一律红 | H01 拆双段（gate 返回 + 不打印 / `check-all` 逐字含「（归档 0 件，跳过）」）；H49 改「可解析形态 + 单独断过程 0 对」；新增 H54 钉优先级 | H01、H49、H54 | **已裁定（Q6 + D1）** |
| C3 | **过程目录"只有 md 无 json"**的处置未写 → H30 只能断"两码不出" | **Q7**（`spec:103` / `spec:206`）：过程侧**不做**成对判定，孤立 md **不报码** | H30 明确断言三码均不出且 `findings` 为空；E 组共用前置补空 `docs/superpowers/reviews/` | H30、H27、H28、H31 | **已裁定（Q7）** |
| C4 | **每个文件的断言条数 / 同码去重**未定：json 与 md 各未跟踪时是 2 条还是 1 条 | **Q5 同批覆盖**（`spec:80` / `spec:204`）：每文件每命令最多一条、不按码去重 | H22 断言**恰 2 条**且两条 `norm(path)` 集合逐字相等；H26 断言 `norm(path)` 逐字等于 `<次>/observation-r1.md` | H22、H26 | **已裁定（Q5 并 C1）** |
| C5 | **产物文件名不合规**（大写后缀）该报什么码未明；码名 `ArtifactNamingOff` 字面像"命名错"→ 易扩用 | **Q8**（`spec:147` / `spec:207`）+ **Q12**（`spec:211`）：`ArtifactNamingOff` 只用于「扫描根不可用」；git 故障归 `RepoRootUnresolved`；命名不合规按三态后果判；大写后缀**不算产物** | H20 判据含 `!cs.includes('ArtifactNamingOff')`；H24/H25 改断 `RepoRootUnresolved`；H53 码集加该码 | H20、H24、H25、H53 | **已裁定（Q8 + Q12 + D3）** |
| C6 | **到期态不可直接构造**：`EXPIRY_LANDED` 恒 `false`，无注入点 | **Q9**（`spec:126` / `spec:208`）：签名 = `disposeCardFindings(findings, { landed = EXPIRY_LANDED } = {})`，**生产不传、测试注入** | H44 改为 `{ landed: true }` 注入并断言常量未改；H43 明确"不传 `landed`" | H43、H44 | **已裁定（Q9）** |
| C7 | **skip 白名单载体与红时文案**未定；红时打印什么、解析不出名字怎么办 | **Q10**（`spec:130` / `spec:209`）：单源 = `scripts/test-skip-allowlist.mjs` 的 `SKIP_ALLOWLIST`；红时 `[测试] 名单外 skip：<用例名>`；**`skipped > 0` 但解析不出名字 = fail-closed 红** | H46 改 `import` + 解析 `# SKIP` 名后 `deepEqual` + 解析失败即 `assert.fail`；H47/H48 断言文案逐字 | H46、H47、H48 | **已裁定（Q10）** |
| C8 | **验收类用例的落地形态**未写：H37–H52 共 12 条 spawn `check-all` 或改全局态，落 `*.test.mjs` 会被 ② 段全仓 glob 收进 → 递归 | **Q11**（`spec:174` / `spec:210`）：验收类**不落 `*.test.mjs`**，写成 plan 收尾命令清单 + 输出贴 `gate-record.md`；**不钉 `# tests` 增量**，兜底 = `pass + skipped = tests` 且 `tests ≥ 166` | H37–H52 的「执行」列一律 = 验收；§1 执行方式与 §1.2 落点写明载体；删掉一切 `# tests` 增量写法；H51 改三数自洽 | H37–H52（12 条）、H51 | **已裁定（Q11）** |

**裁定后的处理原则**：C1–C8 全部关闭；本文件按 §4.1 的 28 张卡逐条回填（第 1 轮，新增 H54），再按 §4.2 的 18 张卡回填（第 2 轮，新增 H55）→ **总数 54 → 55、类型 13 / 24 / 18**。

### 4.1 第 1 轮议会修复对照（卡号 → 改了哪条用例 / 哪条断言）

> 供第 2 轮审计核对。表的右列一律给「文件 + 节号 / 用例号 + 断言」；「不属本文件」的卡单列说明。

| 卡号 | 核实结论 | 本文件的处置 |
|---|---|---|
| Q-1-AU1 | 客观存在（P0） | §0.2-3 改为「子进程 cwd 注入」；§1.2 给 `runGate` 助手；H05 新增 ①（无 root 形参、无 argv/env 型第二根来源、确从 `evidence.mjs` 取根）与 ⑤（全仓生产调用点 = 1、实参为空）；§2 共用前置改「无参数 + 子进程」 |
| Q-1-AI1 | 客观存在（与 AU1 同根） | 同 AU1（H05 ①/⑤）；并采纳其反驳——不写「实参恒为 check-all 的 root 常量」这类无对象断言 |
| Q-1-BE2 | 客观存在（P0，与 AU1 同根） | §0.1-12 / §0.2-3（`cachedRoot` 决定只能子进程）；H05 ③ 加 `timeout: 30000` 静态断言；§1.2 `runGate` 断言子进程 stderr 为空 |
| Q-1-AU2 | 部分成立 | H11 / H14 不再要求「根层文件走 `scanReviewDir` 语义」：判据改「恰 1 条 `UnclassifiedArtifact` + 无 `ArtifactMissing` + 文件名在 message」；§1.1 增「根层分支不调 `scanReviewDir`」对位（`spec:99` / `spec:193`） |
| Q-1-AI5 | 部分成立 | 同 AU2（H11 / H14）；H15/H16 明确 D2 是 `validateArtifact` 透传（`spec:97`） |
| Q-1-BE1 | 客观存在（P0） | H08 / H13 断言改为「`norm(path)` = `<次>` + `message` 含文件名」；§0.2-1 写死 finding 契约与 `norm()` 归一规则 |
| Q-1-AU3 | 部分成立（降 P2） | 本文件对 R9 的引用一律带 spec 出处：`spec:51`（R9）/ `spec:130`（守卫）/ `spec:191`（D6）；不再出现「用户确认」式无出处引用 |
| Q-1-AU4 | 客观存在 | 文件头新增「锚点出处口径」：一律引 §11.10（`spec:238-244`）；全文不再出现把 PRD `:546` 称「S3 出口判据」的写法 |
| Q-1-AU5 | 客观存在 | **不属本文件**（改 `submission.md` 的行数与取数命令），本文件只登记 |
| Q-1-QA1 / Q-1-RD4 | 客观存在（P0） | 删除 5 处「对应测试 = `check-all` 门禁测试文件」写法，统一改「验收命令（plan 收尾命令清单，不落 `*.test.mjs`；输出贴 `gate-record.md`）」：H37 / H38 / H39 / H40 / H45（H45 常量半归 `card-exempt.test.mjs` 常驻） |
| Q-1-QA2 | 客观存在 | H43 改 `const [a, b] = [...EXEMPT_CARDS].slice(0, 2)` + `console.log({ picked: [a, b] })`；H44 同步；判据加「两名均可被 `EXEMPT_CARDS` 命中」 |
| Q-1-QA3 | 客观存在 | H11 / H12 / H16 前置补「产物对 `git add` + `commit`」；同批 H13 / H15 / H17 / H18 / H19 也补（避免多余码干扰「恰 N 条」型判据） |
| Q-1-QA4 | 客观存在 | H41 降级：常驻只断 `length === 15` + 每项 `^agents/[a-z0-9-]+\.md$`；集合相等 → 验收命令（交付时点一次性核）；理由写进 H41「来源」（新增第 16 卡不得被自动豁免） |
| Q-1-QA5 / Q-1-AI3 / Q-1-RD2 | 客观存在 | 全文「49」改「≥49（2026-10-27 23:37 实测 50，每轮评审 +1）」；H50 删目录数等值断言（只打印）；H49 改「可解析形态 + 单独断过程 0 对」 |
| Q-1-QA6 | 客观存在 | §6.2 ② 的 `(常驻\|验收)` 组内转义改真选择符 `(常驻\|验收)`，并贴实跑值 13 / 24 / 17 |
| Q-1-QA7 | 客观存在 | H05 ① 允许任意声明形态并要求「形参与 `repoRoot()` 实取」；H05 ② 用 `(?:export )?(const\|let\|var)` 形态；扫描根断言改**行为式**（`cwd = <repo>/tools` 下仍扫到 `<repo>/docs/superpowers/reviews`） |
| Q-1-QA8 | 客观存在 | H46 改「解析 `# SKIP` 用例名后 `deepEqual(解析集, SKIP_ALLOWLIST)`」+ fail-closed（`skipped > 0 && parsed.length === 0` → `assert.fail`） |
| Q-1-BE3 | 客观存在 | H24 / H25 期望码改 `RepoRootUnresolved`；H20 / H11 / H53 的相关措辞同步（`ArtifactNamingOff` 只留扫描根不可用） |
| Q-1-BE4 | 客观存在 | 新增 **H54**（根层散文件 + 0 子目录 → 仍红）；§1 总表 / §1.1 / §3 计数同批更新（53 → 54） |
| Q-1-BE5 / Q-1-AI4 | 客观存在 | H45 改为断「状态行模板 + `EXPIRY_EVENT` / `EXPIRY_LANDED` 打印值 + 『（S1 未上线：非达标证据）』短语」，**不锁计数数字** |
| Q-1-RD1 | 客观存在（P0） | E 组加「共用前置」块：每个临时仓先建空 `docs/superpowers/reviews/`（`mkRepo()` 代建）；H01 零分支文案改「（归档 0 件，跳过）」 |
| Q-1-RD2 | 客观存在 | 「对」的计义改引 Q14（`spec:213`）——H06 / H27 / H28 / H49 不再写「spec 未明写」 |
| Q-1-RD3 | 客观存在 | §0.2-1 / §0.2-3 直接引 §11.0.1 代号表（`spec:22-37`），把「`scanReviewDir` 无 `path`」「`repoRoot()` 有缓存」写成先声明后测的口径 |
| Q-1-RD5 | 部分成立 | 引用改 `spec:47`「两条断言 + 一条前置探测」与 `spec:107-111` 表（含 `spec:113` 的 `-N` 备忘，见 §5 第 12 条） |
| Q-1-AI2 | 客观存在（P0） | H01 文案段改为**仓外** `mkdtempSync` 暂存（`finally` 移回），§0.2-7 写明「不得放进 `.session/tmp/`」及原因（`check-all.mjs:346-360` / `:370`） |
| Q-1-QA-其余（Q13 / Q16） | 客观存在 | Q13 → §0.2-3 + 全部 gate 用例步骤；Q16 → H50（目录数只打印不判）、H27/H49 同口径 |

### 4.2 第 2 轮议会修复对照（Q-2 卡号 → 改了哪条用例 / 哪条断言）

> 供第 3 轮（或交付审计）逐卡核对。右列一律给「用例号 + 具体断言 / 节号」；全部改动只落在本文件。

| 卡号 | 本文件的处置 |
|---|---|
| Q-2-QA1 / Q-2-BE3 / Q-2-AI3 | **TAP 解析（P0）**：§0.2-8 写死唯一正则 `/^\s*(?:not )?ok\s+\d+\s+-\s+(.*?)\s+#\s+(SKIP\|TODO)\b/`（名字取第 1 捕获组、reason 丢弃）；§1.2 增 `TAP_DIRECTIVE` + `tapNames()` 助手；§0.1-14 贴**本轮实跑**的 TAP 样本（`ok 9 - TC-A10 … # SKIP …`）；H46 删掉 `/^# SKIP (.+)$/m` 假设、fail-closed 改为「`skipped>0` **且**该正则解析出 0 个名字」；§2 共用前置加「统一用 `tapNames`、不解析独立 `# SKIP` 行」 |
| Q-2-QA2 / Q-2-BE1 / Q-2-AI2 | **H01 文案段（P0）**：删掉「移走 2 个归档子目录造 0 子目录」的 e2e；改为 ①直测纯函数 `formatGateLine(res)` 三形态逐字（常驻、不碰真仓）②gate 返回结构 + 不打印（常驻）③e2e 只移 `2026-10-27-1200-migration-drill`、**保留 s6-eval**、断「扫描 1 个子目录 / 归档 0 对 / findings 0」且不含跳过后缀（验收）；§0.1-13 记 `policy-pure-source.test.mjs:1580` 的 s6-eval 不变量为根因；§0.2-7 写明「只许移演练目录 + 仓外暂存」；§1 总表 H01 行、§1.2 双段说明同步 |
| Q-2-QA3 | **H44 笔误**：判据由 `EXEMPT_LANDED === false` 改为 `before === EXPIRY_LANDED && EXPIRY_LANDED === false`（`before` = 调用前取值，表达「调用前后同值」） |
| Q-2-QA4 | **夹具**：`mkRepo()` 增 `git commit --allow-empty -m init`（§1.2），并在 §2 共用前置注明理由（否则 H36 的 `git rev-parse HEAD` 为 exit 128） |
| Q-2-QA5 / Q-2-BE2 / Q-2-AU4 / Q-2-AI5 | **根层语义（P0）**：§0.2-9 写死「根层一律 `UnclassifiedArtifact`、不调 `scanReviewDir`、不套允许类白名单，`ARTIFACT_RE` 只用于 message 区分」；H05 静态断言拆为 ②（不许自建常量）+ **③ 新增「`ALLOWED_FILE_RE` 不得出现在正文」**（删掉 v2「根层也须复用 `ALLOWED_FILE_RE`」的暗示）；H11 增**形态 b：根层 `progress.md`（允许名）仍恰 1 条红**；§1.1 增两条对位 |
| Q-2-QA6 / Q-2-AI4 / Q-2-BE5 | **去移动靶**：H49 的 `# skipped` 由写死 2 改为 `Number(skipped) === SKIP_ALLOWLIST.length`；H46 删掉 `SKIP_ALLOWLIST.length === 2`（只比内容）——**注：该 H49 断言已在 v4 按 Q-3-BE1 / Q19（`spec:218`「不比较条数」）整体删除，见 §4.3；本节只记第 2 轮当时状态** |
| Q-2-BE4 | **新增用例**：H55（L 组）「临时仓不建 `.session/reviews` → `processPairs 0`、`findings === []`、**不出现 `ArtifactNamingOff`**」；`mkRepo({ session: false })` 落进 §1.2；§1 总表 / §1.1（R3、§11.2 过程侧、锚点 3、`ArtifactNamingOff` 反例）/ §3 边界表同批加行 |
| Q-2-RD1 | **`scannedDirs` 计义**：§0.2-2 新增子条「= 归档侧被枚举子目录数，**不含过程目录**」，并说明 H01 与 H28/H55 是两条独立计数；H50 的判据与「不覆盖」同步引用 |
| Q-2-RD5 | **自检⑤**：删掉「用该文件名 grep」的写法（避免把禁建文件名写回本文件），改为「按 `cards.md` Q-1-QA1 证据列所列文件名复核，命中 0」；§6.2 ⑤ 同步 |
| Q-2-BE5 / Q-2-AI4（F-24 状态行） | **H45**：除模板命中 + 两常量打印 + 「（S1 未上线：非达标证据）」短语外，新增「**n/w/b 必须等于 `disposeCardFindings([])` 的返回计数**」；§1 总表 H45 行同步注明「不写字面量」 |
| 出处更新（全部卡共用） | 全部 `spec:N` 按当时 spec 重算（§11.6 D1–D8、§11.7 Q1–Q17、§11.8、§11.10 锚点 1–8 逐条核对）；锚点 2 的表述改为「下界 + 按名断言」（H50）；新增 `spec:163`（`formatGateLine` 行）、`spec:168`（过程目录口径末项）两处引用 |

### 4.3 第 3 轮议会修复对照（Q-3 卡号 → 落点）

> 供第 4 轮（或交付审计）逐卡核对。右列一律给「用例号 + 具体断言 / 节号」。

| 卡号 | 本文件的处置 |
|---|---|
| Q-3-QA1（P1） | **H01 ①d 新增「多条 findings」形态**：`d = { scannedDirs:1, archivePairs:1, processPairs:0, findings:[f1, f2] }` → `assert.strictEqual(formatGateLine(d), '<行1>\n<行2>')`（逐字、固定 `\n`、顺序 = 数组顺序，`spec:163`）；H01 标题 / 覆盖 / 判据 / §1 总表 / §1.1 同步改「四形态」；**并改正 §5 的错误声明**：H52「不覆盖」里 v3 写的「多条拼接由本条单条形态覆盖」→「多条拼接的**行格式与 `\n` 连接**由 **H01 ①d** 覆盖」 |
| Q-3-AI1（P1） | **H05 ⑥ 增两条静态断言**（`spec:164`）：b) `/formatGateLine\s*\(/.test(ca) === true`（`check-all` 必须调用纯函数产生文案）；c) `!/⑥\s*观察产物门禁：扫描/.test(ca) === true`（不得内联 ⑥ 段字面量）；H05 前置 / 覆盖 / 红绿 / §1 总表 / §1.1 同步 |
| Q-3-AI2（P1） | **H46 / H49 前置与步骤统一「spawn 的 env 删除 `DW_RUNTIME_CHECK`」**（`const env = { ...process.env }; delete env.DW_RUNTIME_CHECK`，并写明父 shell 已设时先 `Remove-Item Env:DW_RUNTIME_CHECK`）；理由 = 该变量被设时那 2 条 skip 真跑 → `# skipped 0`、解析集空 → fail-closed 假红 |
| Q-3-BE1（P1） | **skip 判据只按名字**：H46 ① 改 `assert.deepEqual(parsed.filter(n => !SKIP_ALLOWLIST.includes(n)), [])`（**解析集 ⊆ 名单、名单外名即红**）+ ② `Number(skipped) === parsed.length`（自洽，**不比名单长度**）+ ③ `M>0 && parsed.length === 0` → fail-closed 红；**H49 删掉**「`# skipped` 数 = `SKIP_ALLOWLIST.length`」整条断言（预期 / 判据 / 红绿 / 总表 / §1.1 全部清掉），依据 Q19 `spec:218` |
| Q-3-BE2 / D9（P0，用户裁定「按 D-12：仍判红」） | **H07 增形态 b**：`<次>/` 内只放 `progress.md` + `cards.md` + `problems.md`（全允许类账本）→ 仍恰 1 条 `ArtifactMissing`、**不**出 `UnclassifiedArtifact`（与形态 a 同判据）；覆盖新增 D9（`spec:194`）/ Q18（`spec:217`）/ PRD `:410`；**H32 补「第 0 步」**：前置先用 `writeObservation` 在 `.session/reviews/<次>/` 产出 `observation-r1.json|md` 再 move，判据加 `!findings.some(code==='ArtifactMissing')`，并写明「未经第 0 步就 move 只会得 `ArtifactMissing`（属阻断、不是预期红）」（`spec:115`） |
| Q-3-RD1（P1） | **F-24 及全量行号重算**：§11.6 D1–D9 → `spec:186-194`、§11.7 Q1–Q20 → `spec:200-219`、§11.8 → `spec:221-226`、§11.10 锚点 1–8 → `spec:237-244`；**F-24 区段实测（v5 逐行核，命令 = `Get-Content <spec>` 按行号取内容 + `Select-String -Pattern 'EXEMPT_CARDS|EXPIRY_EVENT|EXPIRY_LANDED|disposeCardFindings'`）**：F-24 小节标题 = **119**、表头 = 121、`EXEMPT_CARDS` = **123**、`EXPIRY_EVENT` = **124**、`EXPIRY_LANDED` = **125**、`disposeCardFindings(…)` = **126**、⑥ 状态行（`[豁免窗口] …`）= **128**——v4 曾把四出口写成 122/123/124/125（整体低 1 行），v5 已按实测改正（见 §4.4）；H41–H45 与 §1 总表 / §1.1 同步（`spec:189` D4、`spec:208` Q9、`spec:243` 锚点 7） |
| Q-3-RD3（P1） | **H45 断「卡面」限定词**：正则改 `/…）；卡面 findings \d+ \/ 告警 \d+ \/ 阻断 \d+（S1 未上线：非达标证据）/`，判据明写「写成裸 `findings \d+` 即红（会与 ⑥ 段计数互相否定）」；覆盖加 Q20（`spec:219`）；§1 总表 / §1.1 / §3 同步 |
| 全量出处（所有卡共用，`spec:N`） | 脚本化重算：区间替换 4 处（`216-222`→`221-226`、`228-239`→`233-244`、`194-214`→`200-219`、`184-192`→`186-194`）+ 单点映射（163 不变；167→168；173/175/177/179→174/176/178/180；185–192→186–193；198–214→200–216；219→224；228–239 单点 +5），共 186 处 |

### 4.4 第 4 轮收口修复对照（Q-4 卡号 → 落点）

> 供第 5 轮 / 交付审计逐卡核对。本轮只改本文件。

| 卡号 | 本文件的处置 |
|---|---|
| Q-4-RD1（P1，15 处行号低 1） | **F-24 四条出口按实测改正**（实测命令 = `Get-Content docs\superpowers\specs\2026-10-27-s3-gate-wiring-design.md` 逐行 + `Select-String -Pattern 'EXEMPT_CARDS|EXPIRY_EVENT|EXPIRY_LANDED|disposeCardFindings'`，结果 123/124/125/126）：`EXEMPT_CARDS` 122→**123**（H41 来源 / 总表）；`EXPIRY_EVENT` 123→**124**、`EXPIRY_LANDED` 124→**125**（H45 覆盖、H43 来源）；`disposeCardFindings` 125→**126**（H42/H43/H44 覆盖、H42 步骤、§1.1 dispose 行、§4 C6 行、H43/H44 来源）；共 **15 处**改号。区间统一 `spec:121-126`→**`spec:119-126`**（F-24 小节起止）；改前指向 `EXEMPT_CARDS` 那格（原号 = 122）改后**已无残留**（用 `Select-String` 检索该旧号 → 0 命中，本行不写旧号字面量以免自命中）。§4.3 的 Q-3-RD1 行由「F-24 区段核查未变」改为**逐行实测结论**（119 / 121 / 123 / 124 / 125 / 126 / 128 七点） |
| Q-4-AI-P2（P2） | **H05 ⑥c 加严**：除「不得内联计数行」外，追加 `!/\[observation\]/.test(ca) === true`——`check-all` 源码不得出现 `[observation]` 前缀字面量（只能由 `formatGateLine` 的返回值带出）；判据写明两种字面量分别报；§3 H05 行、H05 红绿同步 |
| Q-4-QA-P2（P2） | **H01 ①d 判别力**：两条 findings 改为 `g1 = {code:'RenderMismatch', …}`、`g2 = {code:'ArtifactMissing', …}`——`g1` 的码在**字母序上大于** `g2`，故「按数组顺序输出」（期望：RenderMismatch 在前）与「按码排序输出」（会得 ArtifactMissing 在前）文本不同，实现可被区分；预期 / 判据 / 红绿三处同步写明 |
| BE 席 P2（措辞漂移） | **统一为四形态**：§1 总表 H01「三层」→「三段」+「四形态」；§1.2 双段说明「三层 / 三形态」→「三段（文案 / 结构 / e2e）/ 四形态」；§1.2 落点「三形态」→「四形态」；H01 覆盖「§11.2 三形态文案」→「§11.2 打印形态（有 findings / 无 findings / 零产物）」；H54 不覆盖「三形态」→「四形态」；§4.2 Q-2-QA2 行「三形态」→「四形态」。**保留**引用 spec 原文处的一处「三种形态」（`spec:163` 原话），不属本文件的措辞漂移 |

## 5 不覆盖声明（指回 spec §11.5「不测」`spec:180` 与 §11.8「不在这一轮」`spec:221-226`）

| # | 不测项 | 理由（一句话） | 兜底（谁管） |
|---|---|---|---|
| 1 | S1 模型层错误码（F-01～F-08，含 15 卡内容校验） | **零实现**（PRD §4.4 B 表 S1 组「当前零实现」），对空气测不出东西 | S1 spec 自带 testcase（`spec-testcase-gate` 同规则约束）；H41–H45 只测窗口登记件 |
| 2 | S4 渲染层 / 全席重生成 / F-24 到期事件**本体** | `spec:224` 明列不在本轮；"到期 = S4 首次重生成落地那一刻把单源开关置真"这个动作只能由 S4 执行 | S4 spec 的验收；H44 已把"到期后的处置行为"钉住（不依赖 S4 落地），H45 已把 `EXPIRY_EVENT` 钉成可被打印读取 |
| 3 | `agents/*.md` **内容**校验（PRD `:416` 的"只告警"对象是什么码） | 卡面判据属 S1；本期无 findings 源（`spec:128` 明示） | S1 校验器 + `disposeCardFindings`（H42–H44 已测其处置语义） |
| 4 | M 组上线后度量（PRD §9.3 M-1～M-4，`:584`） | 判定时点 = 首次含 `observation-r<N>` 的归档迁移完成后；当前 `processPairs = 0`，时点未到 | S3 上线后的度量批（PRD §9.3）；H50 只核"现在不误红" |
| 5 | 迁移四步中的 **move / `git add` / `commit` 本身** | 流程义务（PRD `:387-394`），且 `spec:151` / Q3（`spec:202`）明写 S3 **不提供**脚本 —— 机器不判"人做没做" | 审查收尾流程 + `gate-record.md` 留痕；H32–H34 只验"做完之后的门禁期望序列"，H36 验"门禁自己不写" |
| 6 | 旁路期间的**补跑期限**与 commit message / `gate-record.md` 同行留痕 | 流程义务（PRD `:396`），无机器判据 | 审计核 `BYPASS:` 行（H37/H38 保证这行在）+ 业务留痕 |
| 7 | 语义判定（`quote` 是否**支撑**结论、verdict 是否如实） | 结构判据拦不住语义（PRD §5.3 第 12 行，S2 H04 已把"故意不拦"钉成机器判） | `check:'manual'` + 独立方抽查（议会流程 / 审计人） |
| 8 | 权限类 IO 失败（ACL 只读目录、文件被占用、磁盘满） | 本仓测试环境在 Windows 上无法稳定构造；H03 已覆盖 `ENOTDIR` 这一确定性形态 | 真实故障由 `ArtifactNamingOff` 收敛（同 H03 口径，plan 可补） |
| 9 | 15 卡"到期后 0 warning"的**规模效应**（15 席同时阻断的体验） | 属 S4 落地的运营判断，不是 S3 判据 | S4 全席重生成的验收 |
| 10 | `npm run check` 新增 ⑥ 段后**时长回归**（24s 是否变慢） | 本仓没有时长判据（V-10 口径：墙钟只录环境与量级，不作一致性判据） | 人工观察 + `gate-record.md` 记录 |
| 11 | **`# skipped > 0` 但解析不出用例名**时 `check-all` 自己红的这条分支（实现侧 fail-closed 的独立构造） | 现网拿不到这种输出：`# skipped M` 与 `ok N - <名> # SKIP …` 同源（`node --test` 的 TAP 汇总），构造「有计数无名字」要么污染 TAP、要么依赖未文档化的 reporter 行为，不稳 | 判据侧由 H46 的**测试 fail-closed**（`tapNames()` 解析为空即 `assert.fail`）守住「不放行」；实现侧分支在 plan 收尾交付审计时做一次性人工核（`gate-record.md` 写「已核 `spec:130` 末句分支：`check-all` 用同一条 TAP 内联正则且解析为空即红」+ 代码行号） |
| 12 | `git add -N`（intent-to-add）态的精确归类 | `spec:113` 已把取舍写成"边界备案（不阻断）：`-N` 态下 `ls-files` exit 0、`diff` exit 1 → 报 `ArtifactDirty`（仍红，无假绿；**不识别 `-N`**）" | 同一条已裁定的取舍由 H23 的行为面（`diff` 非 0 → `ArtifactDirty`）间接覆盖；`-N` 专项构造不另设用例（构造需 `git add -N`，且结论与 H23 同码） |
| 13 | git 命令**超时**路径的行为构造（造一个慢 git 让 30s 超时触发） | 造稳定超时需要包装 git 二进制 / 长锁，跨平台不稳 | R5（`spec:47`）的口径 + H05 ③ 的 `timeout: 30000` 静态断言兜底；超时的收敛码与 H25 同码（`RepoRootUnresolved`） |
| 14 | **过程根存在但不可读**（非 ENOENT 的 IO 错误 → `spec:101` 规定报 `RepoRootUnresolved`） | 本仓 Windows 环境无法稳定构造「目录存在但 `readdir` 抛非 ENOENT」这一形态（同第 8 条权限类）；H55 只覆盖**不存在**（`processPairs 0`、不报码）这一可构造侧 | 真实故障由 `RepoRootUnresolved` 收敛（fail-closed，与 H24/H25 同码）；plan 收尾可补一条 ACL 探针（若环境允许） |

## 6 自检（spec-testcase-gate 五判据 + 机器自查）

### 6.1 五判据逐条

| # | 判据 | 自查结果 |
|---|---|---|
| 1 | 文件存在 | ✅ 与 spec 同目录（`docs/superpowers/specs/`）；文件名 = spec 去 `.md` + `-testcase.md` |
| 2 | 编写者独立 | ✅ 文件头「编写者 / 独立性声明」在位：senior-sdet 子代理**全新上下文**，≠ spec 作者、≠ 施工者；§0 全部数字为本编写者独立实跑（含 166/166/0/0、2 / 11 / 0、1 对已跟踪、9、50 / 0、15、12、三个新模块均不存在、`check-all` 0 命中、2 条 skip 名、`cachedRoot` 与 `gate-scan.mjs` 导出清单；v3 追加 `policy-pure-source.test.mjs:1580` 的 s6-eval 不变量与真实 TAP 样本；v4 复核未变），未从实现倒推放宽任何判据 |
| 3 | 用例合格 | ✅ **55 条**五要素齐（覆盖 / 前置 / 步骤 / 预期 / 判据）；负例 + 边界 42 ≥ 正例 13；覆盖总表 55 行 + §1.1 对位零空行（spec R1–R9、§11.0.1 代号表、§11.2 每行、§11.3 每码、§11.5（含 `formatGateLine` 四形态与 ⑥ 段文案单源两行）、§11.6 D1–D9、§11.7 相关 Q（含 Q18/Q19/Q20）、§11.10 每锚点均有对位） |
| 4 | spec 外链 | ✅ spec §11.5 末已写「测试用例文件：`docs/superpowers/specs/2026-10-27-s3-gate-wiring-design-testcase.md`」（`spec:176`），并写明「只手动验证：无」+「验收类用例的载体 = plan 命令清单 + `gate-record.md`」（`spec:178`）；本文件未内联进 spec |
| 5 | 一起送审 | 待父代理执行：议会开卷清单同时列 spec + 本 testcase 两份；§4.1（第 1 轮 28 卡）、§4.2（第 2 轮 18 卡）、§4.3（第 3 轮 9 卡：Q-3-AU1 / QA1 / BE1 / BE2 / RD1 / RD2 / RD3 / AI1 / AI2；本表按根因合并为 7 行）、§4.4（第 4 轮 1 P1 + 3 P2）随同批送审，供下一轮逐卡核对 |

### 6.2 机器自查命令（cwd = 仓根，PowerShell；四条判据 = 输出值）

① 用例数 = 55：`(Select-String -Path 'docs\superpowers\specs\2026-10-27-s3-gate-wiring-design-testcase.md' -Pattern '^#### ').Count` → `55`

② 类型计数 = 13 / 24 / 18：`(Select-String -Path <本文件> -Pattern '^\| H\d{2} \|.*\| 正 \|[^|]*\| (常驻|验收)[^|]*\|').Count` → 13；同式换 `负` → 24；换 `边界` → 18（三条合计 55 = ①）。**尾部 `\| (常驻|验收)[^|]*\|` 不可省**：§3 汇总表的类型列格式与 §1 不同，省掉会把 §3 的行重复计入；`[^|]*` 用于容纳 H01 / H41 的「常驻 + 验收」双段写法。（v2 修正 v1 的组内转义错误：`(常驻\|验收)` 在 PowerShell 里是**字面竖线**，实测得 0 —— 第 1 轮卡 Q-1-QA6。）

③ 编号连续不跳号：`(Select-String -Path <本文件> -Pattern '^#### H\d{2} ' | ForEach-Object { $_.Line.Substring(5,3) }) -join ','` → `H01,H02,…,H55` 连续（H54 在 K 组、H55 在 L 组，均在文件末尾，故顺序递增）

④ 禁占位词 = 0（剔除 spec 固定正则字面量）：`(Select-String -Path <本文件> -Pattern 'TB[D]|TO[D]O|稍后补[充]' -CaseSensitive | Where-Object { $_.Line -notmatch 'SKIP' }).Count` → `0`。**实测交代**：不过滤时得 **4**，4 处**全部**是 `spec:130` 固定 TAP 正则里的 `(SKIP|TODO)`（出现在 §0.2-8 / §1.2 的 `TAP_DIRECTIVE` / H46 来源 / §4.2），那是**被引用的规范字面量**、不是待补占位词，故按「剔除含 `SKIP` 的行」计数（实测 0）。`todo` 作为 node:test API 名出现在 H48 时是小写带语义的正文，按 `-CaseSensitive` 与词形区分。

⑤ 验收载体形态：H37–H52 的「对应测试」字段一律以「验收命令（plan 收尾命令清单，不落 `*.test.mjs`；输出贴 `gate-record.md`）」开头——本文件**不存在**以「验收专用测试文件名」为载体的写法（v1 的 5 处已全删，Q11 `spec:210` / 第 1 轮卡 Q-1-QA1、Q-1-RD4）；复核方式改为「按 `cards.md` 中 Q-1-QA1 卡**证据列所列文件名**检索本文件，命中数 = 0」（v3 按第 2 轮卡 Q-2-RD5 改，不把该文件名写回本文件）。

> 编写者按「在输出带数据的结论前必须执行验证闸门」已实跑 ①–⑤，实测值见本节；§0.1 的 14 行基线为同批实跑（第 1 行除外，见其备注）。
