# S3 门禁接入（gate wiring）设计

> 状态：已签（`②@S3` @ `gate-record.md`，2026-10-27；签字件 SHA 见该行，签后仅本状态行变更）｜上游：`docs/prd/20261026205821-agent-card-contract.md` §8 S3 行（`:518`）｜正文 = 自 PRD 拆出的 §11
> 边界承接：`docs/superpowers/specs/2026-10-27-s2-observation-check-design.md` §10.5（`:60-66`，S2/S3 边界定死，plan 不得自行挪动）
>
> split from `docs/prd/20261026205821-agent-card-contract.md` (2026-10-27)

## 11 S3 门禁接入：check-all 增段 + 归档三态 + git 断言 + 迁移状态机 + 15 卡豁免窗口

### 11.0 为什么

S2 交付的四段校验链**没有任何运行时入口**：`npm run check` 既不扫归档目录 `docs/superpowers/reviews/**`，也不扫过程目录里的产物。三处后果，全部可复算：

| # | 现状 | 取数方式（cwd = 仓库根，本 spec 起笔前实跑） | 后果 |
|---|---|---|---|
| 1 | 归档目录现存 2 个子目录 / 11 个文件，其中 1 **对**产物（演练件 json + md） | `(Get-ChildItem docs\superpowers\reviews -Directory \| Measure-Object).Count` → 2；`(Get-ChildItem docs\superpowers\reviews -Recurse -File \| Measure-Object).Count` → 11 | 这唯一一对产物只被 CLI 手跑过一次（`gate-record.md` ③@S2 第 ⑥ 条），不是门禁判过 |
| 2 | 过程目录**至少 49 个**、`observation-r*` **0 件** | `(Get-ChildItem .session\reviews -Directory \| Measure-Object).Count` → 起笔时 49、2026-10-27 23:37 实测 50（本轮评审账本目录落地后 +1，**每轮 +1**）；`(Get-ChildItem .session\reviews -Recurse -Filter 'observation-r*' \| Measure-Object).Count` → 0 | F-19「义务产出」今天无从触发：没有任何一轮评审被要求交产物 |
| 3 | 归档目录无反向清单，塞进去什么都不会红 | PRD §5.2 `:408`（`UnclassifiedArtifact`）+ S2 纯函数 `tools/observation-check/gate-scan.mjs`（在，但无人调用） | F-18 的「目录级反向清单」停在纯函数层 |

`npm run check` 当前全绿（`# tests 902 / # pass 900 / # fail 0 / # skipped 2`，末行 `check 全部通过`）——**绿不代表产物被校验，只代表没有入口**。S3 补的就是这个入口。

### 11.0.1 代号与符号表（从 §11.2 中间打开也读得懂）

| 代号 / 符号 | 出处 | 一句语义 |
|---|---|---|
| F-17 / F-18 / F-19 / F-22 / F-24 | PRD §6 `:481` / `:482` / `:483` / `:486` / `:488` | 本 spec 覆盖的 5 个功能点：门禁接入 / 归档强制 / 义务产出 / 迁移状态机与旁路 / 15 卡豁免窗口 |
| C-07 | PRD §0.6 `:120` | 门禁旁路只允许「校验器自身故障」，须留痕 + 补跑期限 |
| C-08 | PRD §0.6 `:121` | 15 张存量角色卡只告警不阻断，豁免到期 = S4 首次重生成 |
| C-15 | PRD §0.6 `:128` | `attachments/<file>` 只许一层 |
| V-6 / M-2 | PRD §9.1 `:563` / §9.3 `:584` | 门禁必须能真红：§5.3 第 1–10 行各 1 条红例 + 4 条绿例 |
| `scanReviewDir(dirName, files)` | `tools/observation-check/gate-scan.mjs:20` | S2 纯函数；`files` = `<次>/` 下相对路径数组；**返回 `{code, message}[]`（无 `path` 字段）**；三态 + 反向清单的唯一判据源 |
| `ARTIFACT_RE` / `ALLOWED_FILE_RE` / `ATTACHMENT_RE` | 同上 `:17` / `:5` / `:8` | 产物名正则 / 允许文件名类 8 类 / `attachments/` 一层 |
| `STOCK_DIR_WHITELIST` / `STOCK_FILE_WHITELIST` | 同上 `:2` / `:12` | 存量目录（1 个）/ 非产物文件精确路径（9 个） |
| `REGISTERED_IDS` | `tools/observation-check/registered-ids.mjs:5` | 本轮检查项 id 单源（`k01`–`k03`），四段校验的必填入参 |
| `validateArtifact(jsonPath, { registeredIds })` | `tools/observation-check/artifact.mjs:84` | 四段校验入口，返回 `{ ok, errors[] }`，错误亦为 `{ code, message, path? }` |
| `repoRoot()` | `tools/observation-check/evidence.mjs:40-52` | 仓库根唯一来源 = `git rev-parse --show-toplevel`，**不接受传参**；取不到 → 抛 `RepoRootUnresolved`；**进程内缓存** |
| 「一次评审」 | PRD §5.2 `:400` | 扫描根下的**一个子目录** |

### 11.1 核心决定（不可违反）

| # | 决定 | 为什么 |
|---|---|---|
| R1 | **S2 已定判据一字不改**：`scanReviewDir` / `ARTIFACT_RE` / 允许类 / 两份白名单 / `validateArtifact` / `repoRoot` 的签名与判据不动；S3 只新增「列文件 → 调纯函数 → 报码」的接线。**例外（本 spec 新增、显式登记）**：D1 根层散文件、D2 归档侧孤立 md 两条判定在 S2 纯函数里不可表达，载体 = `gate-run` | S2/S3 边界已定死（S2 spec §10.5）；把纯函数搬进 `check-all` 会让 166 条测试与门禁两处维护 |
| R2 | **扫描根唯一**：`<repoRoot>/docs/superpowers/reviews`（= 归档目录，下文「归档侧」同义；`repoRoot()` 派生，**接口不收 root 参数**、不加 CLI 参数、不加环境变量、不支持多根）；取不到根 → `RepoRootUnresolved` 红 | PRD `:424`「root 唯一来源 = git 顶层，接口删掉该参数」；`repoRoot()` 是既有单源 |
| R3 | **过程目录口径**：`.session/reviews/**` 只做四段校验（仅根层 `observation-r*.json`），**不做三态判定、不做成对判定、不做 git 断言、无产物不报 `ArtifactMissing`**；**过程根不存在 → 0 对、不报码**（与 `check-all` ⑤ 段「无该目录则跳过」同口径） | PRD §5.2 `:413`；过程目录每轮 +1（现 ≥49 / 实测 50），套三态会整片假红；干净克隆 / CI 天然无 `.session/` |
| R4 | **三态与反向清单只调 S2 纯函数**：`scanReviewDir(dirName, files)`；S3 不另写允许类 / 白名单 / 产物正则。**根层分支不调 `scanReviewDir`、不套允许类白名单**（见 §11.2 根层段） | 两份实现必漂（`check-all.mjs:214-217` 的 `splitRow` 合成单源即先例） |
| R5 | **git 判据 = 两条断言 + 一条前置探测**：前置 `git rev-parse --is-inside-work-tree`（非 0 / spawn error / 超时 → `RepoRootUnresolved`）；断言 `git ls-files --error-unmatch -- <path>`（非 0 → `UntrackedArtifact`）、`git diff --quiet -- <path>`（非 0 → `ArtifactDirty`）。三条均带 `cwd = repoRoot()` 与 `timeout: 30000` | PRD §5.2 `:405` + §4.3 第 2 道（`RepoRootUnresolved` 已登记）；「无法断言」不得当成「没有问题」 |
| R6 | **旁路只一条总开关** `CHECK_BYPASS=1`（原因取 `CHECK_BYPASS_REASON`），首行打印 `BYPASS: <原因>`，只跳过 ⑥ 段判定，其余段照跑且仍可红 | PRD §5.1 `:396` + §5.2 最小化约束「子项开关」禁止——旁路只能整体 |
| R7 | **F-24 本期交付「窗口登记件」**：15 张卡封闭清单 + 到期事件单源 + 处置纯函数 + `check` 打印窗口状态行；S1 校验器上线后才产出 findings 并由该纯函数处置 | PRD §5.2 `:416`（到期 = S4 首次重生成，事件型）；S1 当前零实现，本期不可能有 findings 源 |
| R8 | **不新增错误码**：只用 PRD 已登记的 `RepoRootUnresolved` / `ArtifactNamingOff` / `UntrackedArtifact` / `ArtifactDirty` / `ArtifactMissing` / `UnclassifiedArtifact` + S2 四段码原样透传 | PRD §4.4 A/B 表；「新增错误码必须先登记 PRD」是既定约束 |
| R9 | **静默 skip 守卫进首批**：`check-all` ② 段把「skipped / todo 不计」改为**按用例名白名单**（现 2 条），名单外即红 | 用户 2026-10-27 裁定（交接词开放问题 3，答「进（推荐）」；转账本目录 `progress.md` §0.1） |

### 11.2 机制

**接线图（扫描根 → 判定 → 报码）**：

```
check-all.mjs
  ├─ 顶部：CHECK_BYPASS=1 → 首行 console.log(`BYPASS: ${reason}`)，bypass=true
  ├─ ①–⑤ 照旧（bypass 不影响）
  ├─ ⑥ 观察产物门禁（新增，排在 ⑤ 之后、总出口之前）
  │    bypass → 打印「⑥ 观察产物门禁跳过（BYPASS）」，不判
  │    否则 → runObservationGate()            // 不传 root；内部 repoRoot()
  │             归档：<repoRoot>/docs/superpowers/reviews
  │                  枚举子目录 → 每个子目录三态（scanReviewDir）
  │                  → 有产物：逐个四段校验 + git 前置探测 + 两条断言
  │             过程：<repoRoot>/.session/reviews/*/ 根层 observation-r*.json
  │                  逐个四段校验（无三态 / 无成对 / 无 git）
  │             返回 { scannedDirs, archivePairs, processPairs, findings[] }
  │    findings.length > 0 → failed = true，逐条打印 `[observation] <code>: <path> —— <message>`
  │    否则打印计数行
  └─ 总出口：failed ? 1 : 0（沿用 check-all 现有出口，不 process.exit）
```

**运行时接线模块**（新增 `tools/observation-check/gate-run.mjs`）：导出 `runObservationGate()`——**无参数**；根由 `repoRoot()` 派生（失败按 `RepoRootUnresolved` 收敛为 finding，不抛栈）；`registeredIds` 直接 `import { REGISTERED_IDS }`（单源）。gate 只返回结构，**不在模块内 print**；同模块导出**纯函数 `formatGateLine(res)`**（把返回结构渲染成那一行文案，供 `check-all` 调用与单测直测）。

**测试注入方式**（`repoRoot()` 有进程内缓存，`chdir` 不能在同一进程复用）：用例 spawn 一个**新 node 进程**、`cwd = mkdtempSync` 建的临时 git 仓库，由该子进程调 `runObservationGate()` 并回读 JSON；临时仓在 `finally` 里删除。生产路径上不存在第二个 root 来源（R2）。

**finding 形状与粒度**：`finding = { code, path, message }`。
- 文件级（四段码、git 两码）：`path` = 该文件仓内相对路径（POSIX 分隔符）；**每个产物文件每条命令最多一条**，不去重、不聚合；
- 目录级（`ArtifactMissing` / `UnclassifiedArtifact`）：`path` = `<次>/` 的仓内相对路径（`docs/superpowers/reviews/<次>/` 或 `.session/reviews/<次>/`）；**杂件文件名留在 `message`**（S2 返回值无 `path`，接线不得解析 message 反推路径）。

**输出全部由 `check-all` 打印**（文案由 `formatGateLine(res)` 产生，`check-all` 只 `console.log`）：
- 有 findings：逐条 `[observation] <code>: <path> —— <message>`；
- 无 findings：`⑥ 观察产物门禁：扫描 <scannedDirs> 个子目录 / 归档 <archivePairs> 对 / 过程 <processPairs> 对 / findings 0`；**`scannedDirs` = 归档侧被枚举的子目录数（不含过程目录）**；**「对」= 已存在且成对的 `observation-r<N>(-[ab])?` json + 同名 md 一组（`-a`/`-b` 各自成对）**；
- 零产物分支行尾加「（**归档** 0 件，跳过）」——**只跳归档侧判定，过程侧照扫**。

**归档三态（PRD §5.2 `:401-408`）逐条落地**：

| 态 | 判据 | 本段动作 |
|---|---|---|
| 有产物 | 子目录根层存在 `observation-r<N>(-[ab])?.(json\|md)` | 每个 json 跑 `validateArtifact`（四段）；再对 json 与 md 各跑两条 git 断言 |
| 无产物但在存量白名单 | 子目录名 `∈ STOCK_DIR_WHITELIST` | 绿，不追溯（现值 = `2026-10-25-1723-s6-eval`） |
| 无产物且不在白名单 | 其余 | `ArtifactMissing`（`path` = 该 `<次>/`） |
| 有非产物文件 | 既非产物、也不在允许文件名类 / 9 个精确路径白名单内 | `UnclassifiedArtifact`（与上三态**并列**；`path` = `<次>/`） |

**归档侧成对判定**（D2）：以 json 为锚逐个校验；**孤立 md（无同名 json）→ `JsonNotFound`**；json 在而 md 缺 → `MdMissing`（S2 已在 `validateArtifact` 内判，不重写）。

**根层散文件与零产物（D1，优先级定死）**：扫描根下的直接文件（不在任何 `<次>/` 内）**一律 `UnclassifiedArtifact`**——不调 `scanReviewDir`、不套允许类白名单（根层 `progress.md` 这类允许名同样不豁免），`ARTIFACT_RE` 只用来区分「产物名 / 非产物名」并写进 `message`；**「0 件，跳过」只在「子目录数 = 0 且根层无散文件」时成立**。

**扫描根不可用**：扫描根不存在、或 `readdir` 抛错（含路径是文件）→ `ArtifactNamingOff` 红（防「路径写错」当成「没有产物」，PRD §5.2 `:414`）。**过程根存在但不可读（非 ENOENT 的 IO 错误）→ `RepoRootUnresolved`**（环境不可用，fail-closed；不存在 = 0 对、不报码）。

**过程侧口径（R3 的具体化）**：只对 `.session/reviews/<次>/` 根层的 `observation-r*.json` 逐个跑四段校验；**不做**三态判定、**不做**成对判定（过程目录里只有 md 无 json **不报码**——工作区不是交付承诺）、**不做** git 断言。**过程根 `.session/reviews` 不存在时 = `processPairs 0`、不报码**（与 ⑤ 段「无该目录则跳过」同口径）。

**git 断言（只对归档）**：对每个产物文件的仓内相对路径：

| 命令（`cwd = repoRoot()`，`timeout: 30000`） | 非 0 / 异常 → 码 | 覆盖 PRD §5.3 行 |
|---|---|---|
| `git rev-parse --is-inside-work-tree`（前置探测） | `RepoRootUnresolved` | §4.3 第 2 道（fail-closed） |
| `git ls-files --error-unmatch -- <path>` | `UntrackedArtifact` | 第 10 行（归档件未 `git add`） |
| `git diff --quiet -- <path>` | `ArtifactDirty` | 第 7 行（归档后被手改） |

边界备案（不阻断）：`git add -N`（intent-to-add）态下 `ls-files` exit 0、`diff` exit 1 → 报 `ArtifactDirty`（仍红，无假绿；**不识别 `-N`** 为既定取舍）。

**迁移状态机（F-22，PRD §5.1 `:387-396`）**：S3 **不执行** move / `git add` / `commit`（无 git 写）。机器可判部分 = 三个码 + 期望序列：**第 0 步（D9）= 归档前该轮必须已在 `.session/reviews/<次>/` 由 `writeObservation` 产出 `observation-r<N>`；未经第 0 步就 move，只会得到 `ArtifactMissing`（属阻断，不是「预期红」）**；步骤 1 move 后必然 `UntrackedArtifact`（码消息里写明「属预期，下一步 `git add`」——**该「必然」只对已有产物的目录成立**），步骤 3 `git add` 后两码必消、check 必绿，步骤 4 绿保持。**迁移完成后须删 `.session/<次>/` 副本**（否则同一坏产物会在归档侧与过程侧双报——流程义务，机器不判）。

**旁路（C-07）**：`CHECK_BYPASS=1` 时必须打印首行 `BYPASS: <CHECK_BYPASS_REASON 的值>`；未提供 reason 时打印 `BYPASS: (未提供原因)`（留痕可被审计看见，见 §11.6 D5）。补跑期限与 `gate-record.md` 同行留痕属流程义务，机器不判。

**F-24 存量 15 卡豁免窗口**（新增 `tools/observation-check/card-exempt.mjs`）：

| 出口 | 内容 |
|---|---|
| `EXEMPT_CARDS` | 15 个**精确相对路径**（`agents/<name>.md`），一次性；新增卡不在名单内 → 不享豁免 |
| `EXPIRY_EVENT` | `'s4-first-regeneration'`（PRD §5.2 `:416` 的事件型到期） |
| `EXPIRY_LANDED` | 单源布尔常量，本期 `false` |
| `disposeCardFindings(findings, { landed = EXPIRY_LANDED } = {})` | `file ∈ EXEMPT_CARDS && !landed` → 进 `warnings`；否则进 `blockers`。纯函数，无 IO；`landed` 只供测试注入到期态，生产不传 |

`check-all` ⑥ 段末尾**按模板插值**打印：`[豁免窗口] 15 张角色卡只告警（到期 = S4 首次重生成，EXPIRY_EVENT=<值> / EXPIRY_LANDED=<值>）；卡面 findings <n> / 告警 <w> / 阻断 <b>（S1 未上线：非达标证据）`。**`n/w/b` 取自 `disposeCardFindings([])` 的返回值**（本期真实运行 = 0/0/0，不写字面量）；**「卡面」限定词必须保留**——它与 ⑥ 段的 `findings`（产物问题数）是两个量，同一次输出里不得互相否定。S1 落地后由 S1 校验段把 findings 喂给 `disposeCardFindings`；本期无 findings 源，按 R7 明示不冒充「已达标」。

**静默 skip 守卫（R9）**：`check-all` ② 段在回读 `# tests N` 之外，再按用例名白名单核 `# skipped M` / `# todo M`——白名单单源 = 新增 `scripts/test-skip-allowlist.mjs` 导出的 `SKIP_ALLOWLIST`（用例名字符串数组，现 2 条；随批次同改该文件与本节）；**解析形态定死为 TAP 内联指令**：`/^\s*(?:not )?ok\s+\d+\s+-\s+(.*?)\s+#\s+(SKIP|TODO)\b/`（名字取第 1 捕获组，reason 丢弃；**不存在独立的 `# SKIP <名>` 行**）。**判据只按名字**：解析出的名字 ⊄ `SKIP_ALLOWLIST` → 红，打印 `[测试] 名单外 skip：<用例名>` / `[测试] 名单外 todo：<用例名>`；**「`# skipped M`（M>0）但该正则解析不出任何用例名」= fail-closed 红**。**不比较条数**（`M` 与名单长度可不等：`DW_RUNTIME_CHECK=1` 让 skip 真跑时为 0；S2 的「绝对基线 2」正是因此撤回）。

**施工期预期红**：⑥ 段在第 1 次 move（迁移演练 / 首次归档）之前，对既有归档目录应为 0 findings；施工中若出现 `UntrackedArtifact`，属迁移步骤 1 的预期态（见上）。plan 收尾的「绿」判据从「`git add` 完成」那一刻起算。

### 11.3 错误码映射（全部为已登记码，新增 0）

| 码 | 触发点 | 出处 |
|---|---|---|
| `ArtifactNamingOff` | **仅**扫描根不存在 / 不可枚举（含路径是文件） | PRD §5.2 `:414` |
| `RepoRootUnresolved` | `repoRoot()` 取不到根；git 前置探测失败 / spawn error / 超时 | PRD §4.4 B 表「S2 新增（根）」+ §4.3 第 2 道 |
| `ArtifactMissing` | 归档子目录无产物且不在存量目录白名单 | PRD §5.2 `:407` |
| `UnclassifiedArtifact` | 子目录含未分类文件；扫描根根层散文件 | PRD §5.2 `:408`（根层散文件为本 spec 扩用，见 D1） |
| `UntrackedArtifact` | `git ls-files --error-unmatch` 非 0 | PRD §5.2 `:405` |
| `ArtifactDirty` | `git diff --quiet` 非 0 | PRD §5.2 `:405` |
| `JsonNotFound` | 归档侧孤立 md（md 在、json 缺） | PRD §4.4 A 表「入口」组（见 D2） |
| S2 四段码 | 原样透传（`InvalidDocument` / `Evidence*` / `RenderMismatch` / `MdMissing` / `CoverageMismatch` …） | PRD §4.2 / S2 spec §10 |

**码的用法边界（防扩用）**：`ArtifactNamingOff` 不用于 git 故障、不用于产物命名不合规；产物文件名不合规（如 `observation-r1-A.json` 大写后缀）按其三态后果判（`ArtifactMissing` + `UnclassifiedArtifact`）；`JsonNotFound` 只用于归档侧孤立 md。

### 11.4 硬约束与边界（不做什么）

- **不自动迁移**：不执行 move / `git add` / `commit`；迁移四步是流程义务，S3 只给机器判据。
- **不校验 `agents/*.md` 内容**：F-24 只登记窗口（R7），卡面校验归 S1。
- **不改 S2 已签判据**：`tools/observation-check/*` 中 S2 已交付模块签名与判据不动；S3 只新增 `gate-run.mjs` / `card-exempt.mjs`（+ 测试）。
- **不加开关**：扫描根不可配置、根不可传参、单个子项不可 skip；唯一开关是 R6 的整体旁路。
- **不改 `.gitignore`**，不对 `.session/` 做 git 断言（PRD §5.2 `:413`）。
- **不扩允许文件名类**：新增类须回流 PRD §5.2（C-15 已定只到 `attachments/<file>` 一层）。

### 11.5 测试（只写「测什么 / 为什么」）

| 测什么 | 为什么 |
|---|---|
| 零产物分支（子目录 0 且根层无散文件 → 「归档 0 件，跳过」+ exit 0，**过程侧仍扫**）；扫描根缺失 / 是文件 → `ArtifactNamingOff` | F-17 两条互斥分支各自要有反例，否则「路径写错」会被当成「没有产物」（PRD §5.2 `:414`） |
| `formatGateLine(res)` 纯函数：零产物 / 有产物 / 有 findings 三种形态的文案逐字断言（**不依赖真仓状态**）；**多条 findings → 逐行 `\n` 拼接**（顺序 = findings 数组顺序） | 文案是 ⑥ 段唯一现场证据；若只用 e2e 测，会与既有「归档目录必须在场」的测试不变量互踩；只测单条则「逐条打印」退化为「只打首条」 |
| `check-all` 的 ⑥ 段**文案单源**：源码必须调用 `formatGateLine(`、且不得内联 ⑥ 段字面量文案 | 否则手拼字面量后 H01/H49/H52 仍全绿，文案退回两处维护（R4 防的漂移形态） |
| 归档三态 + 反向清单（`cards/` / `attachments/` 子层、根层散文件、根层产物名不豁免、**只含允许类账本的目录仍 `ArtifactMissing`**） | F-18/F-19；S2 纯函数已测三态，本段测**接线没把入参接错**（目录名、相对路径、子层裁剪、根层优先级）；账本-only 定音见 D9 |
| 归档侧成对判定（孤立 md → `JsonNotFound`；缺 md → `MdMissing`）与四段码透传 | D2；不判则孤立 md 既算「有产物」（绿）又从不被校验 |
| git 三态（前置探测失败 / `UntrackedArtifact` / `ArtifactDirty`）+ `add -N` 备忘 | PRD §5.3 第 7/10 行 + V-6 的 10 条红例；S3 出口判据「git 索引断言必须有测试」 |
| 过程目录口径（0 产物 → 0 findings；有产物 → 四段校验但无 git 断言；只有 md → 不出码；**过程根不存在 → 0 对、不报码**） | R3 的负例：套错口径会整片假红；干净克隆 / CI 无 `.session/` |
| 迁移状态机四步在临时 git 仓库的期望序列（move 后 `UntrackedArtifact` → `git add` 后两码消 → `commit` 后绿） | F-22；「步骤 1 报码属预期」必须可复现，否则会被当成门禁失效（PRD §5.1 `:391`） |
| 旁路：`CHECK_BYPASS=1` 首行 `BYPASS: <原因>` + ⑥ 跳过 + 其余段仍可红；无 reason 的可审计文案；未开启时无 `BYPASS:` 行 | F-22 的旁路一半；首行要求是 PRD 明文（`:396`） |
| F-24：`EXEMPT_CARDS` = 15 项且每项 `agents/<name>.md` 形态；`disposeCardFindings` 未到期 / 已到期两态；名单外卡不享豁免；状态行按模板插值 + 「非达标证据」短语 | 封闭清单与事件型到期是本功能点全部内容（C-08）；集合恒等会随新增卡误红（S2 撤销「绝对基线 2」同型教训） |
| 静默 skip 守卫：白名单 2 条绿；名单外 skip / todo 红；skipped>0 但解析不出名字红 | R9；「skipped 被当成通过」是 S2 已踩过的假绿形态 |
| `npm run check` 整体不红 + 新增 ⑥ 段打印四个计数 | 收编不能把仓门禁搞红（同 S2 R7）；计数行是「扫了没扫」的唯一现场证据 |
| 验收类用例**不落 `*.test.mjs`**：需要 spawn `check-all` 或改全仓状态的用例，写成 plan 收尾任务的命令清单，输出贴 `gate-record.md` | 落进 `*.test.mjs` 会被 ② 段 `**/*.test.mjs` 收进 → 每轮 self-run `check-all` 递归、时长翻倍（Q11） |

**测试用例文件**：`docs/superpowers/specs/2026-10-27-s3-gate-wiring-design-testcase.md`

**只手动验证**：无（全部可机器判）。**验收类用例的载体 = plan 命令清单 + `gate-record.md` 输出**，不是 `*.test.mjs`。

**不测**：S1 模型层错误码（零实现）；S4 渲染层与全席重生成；`agents/*.md` 内容校验（S1）；M 组上线后度量（PRD §9.3，判定时点未到）。

### 11.6 差异清单（本 spec 相对 PRD 的处置，逐条留痕）

| # | 差异 | 处置 | 为什么不是漂移 |
|---|---|---|---|
| D1 | PRD §5.2 只定义「子目录」三态，未定义**扫描根根层散文件** | 判 `UnclassifiedArtifact`；根层产物名不豁免；「0 件跳过」只在根层无散文件时成立 | 与 F-18「目录级反向清单」同向收紧；否则根层可塞无限文件而不红 |
| D2 | PRD 未定义**归档侧孤立 md（无同名 json）** | 判 `JsonNotFound`（A 表已登记码，语义即「json 不存在」） | 不新增码（R8）；不判则该文件既算「有产物」（绿）又从不被校验 |
| D3 | PRD 只把 `RepoRootUnresolved` 定义在证据第 2 道（取根失败） | 扩用到门禁：`repoRoot()` 失败、git 前置探测失败 / 超时 | 同一条「取不到根 = fail-closed」判据；不再用 `ArtifactNamingOff` 承担 git 故障（码名与触发不符） |
| D4 | F-24 在 PRD 中描述为「S1 上线后只告警不阻断」 | S3 交付窗口登记件 + 处置纯函数 + 状态行；findings 源归 S1 | S1 零实现（PRD §4.4 B 表 S1 组「当前零实现」），S3 期无 findings 可处置；到期事件仍按 PRD 的 S4 首次重生成 |
| D5 | PRD 写旁路「`CHECK_BYPASS=1` + 留痕」，未定义原因来源 | 原因取 `CHECK_BYPASS_REASON`；缺失时打印 `(未提供原因)` 仍旁路 | 留痕目的（审计每轮核 `BYPASS:` 行）已达成；新增码需回 PRD 登记，本批不做（R8） |
| D6 | PRD 未提 skip 守卫 | 进 S3 首批（R9） | 用户 2026-10-27 裁定（`progress.md` §0.1）；属门禁防假绿，不涉功能点集合 |
| D7 | S2 spec §10.8-2 / S2 testcase A04 / PRD §8 S2 出口判据的验收命令原写作「先 `cd` 进子目录再给裸 glob」 | 统一改为**仓根** `node --test "tools/observation-check/*.test.mjs"`（带引号 glob + 写明 cwd），同批改上述三处 + 本 spec | 用户 2026-10-27 裁定（开放问题 1）；原写法缺 cwd 时 glob 不展开 → `# tests 0` 且 exit 0（假绿）；回扫见本目录 `impact-sheet.md` |
| D8 | R1 的「S2 一字不改」与 D1/D2 需要新判定存在张力 | **显式声明例外**：D1/D2 是「接线期判定」，载体 `gate-run`，不回流 S2 | 把根层/孤立 md 塞回 S2 纯函数要改 S2 已签判据与 166 条测试，成本与风险都更高 |
| D9 | PRD `:410`「评审账本本身就是归档内容，不得因『不是 observation』被判红」与 `:407` `ArtifactMissing` / D-12 义务产出存在字面张力 | **按 D-12 定音（用户 2026-10-27 裁定：仍判红）**：`:410` 只免 `UnclassifiedArtifact`，不免义务产出——**只含允许类账本、无 `observation-r<N>` 的归档子目录仍报 `ArtifactMissing`**；迁移状态机加「第 0 步」，见 §11.2 | D-12 是 PRD 已决条款（`:507`），`:410` 的语境是「有非产物文件」态；两者分工，不构成改判 |

### 11.7 内部对齐记录（问项与裁定，零未决）

| # | 问题 | 裁定 | 依据 |
|---|---|---|---|
| Q1 | 过程目录要不要也做三态判定？ | **不**。只四段校验 | PRD §5.2 `:413`；过程目录 50 且每轮 +1，会整片假红（R3） |
| Q2 | `check-all` 新段编号？ | **⑥**，排在现有 ⑤ 之后 | 现有段 ①–⑤（`check-all.mjs:5-6`），追加不重排，diff 最小 |
| Q3 | 迁移状态机是否要提供脚本一键执行？ | **不**。不提供任何 git 写命令 | 迁移四步含 `commit`，自动化会把「谁提交的」抹掉；R2「不得自签」同类风险 |
| Q4 | 命令写法统一的影响范围？ | 活判据载体 4 处（PRD §8 S2 出口判据、S2 spec §10.8-2 与 §10.2、S2 testcase A04 与引用行、本 spec）；历史件（S2 plan / 两份 handoff / `gate-record` 已实跑行）**标历史保留不改** | R8 处置三选一（改 / 改引用 / 标历史保留）；运行证据不得改写 |
| Q5 | finding 的字段名与粒度？ | `{ code, path, message }`；文件级每文件每命令最多一条；目录级 `path = <次>/`，杂件名留 `message`；不聚合、不去重 | 回读对象是测试唯一机械锚；聚合会藏起 md 侧漏报；S2 返回值无 `path`（R1 不改 S2） |
| Q6 | ⑥ 计数行文案与打印方？ | `check-all` 打印四计数（扫描 N 个子目录 / 归档 N 对 / 过程 N 对 / findings N）；零产物行尾「（归档 0 件，跳过）」；gate 不 print | 一个段只留一个打印出口；四计数是「哪一段没跑」的诊断面 |
| Q7 | 过程目录里孤立 md 怎么判？ | **不报码**（过程侧不做成对判定） | 工作区不是交付承诺；判红只制造噪声（与 R3 一致） |
| Q8 | 产物文件名不合规报什么码？ | 不报 `ArtifactNamingOff`，按三态后果判 | 改报会把「目录缺产物」的真红吞成命名红，且须回 PRD 改码语义（R8） |
| Q9 | 到期态不可构造怎么办？ | `disposeCardFindings(findings, { landed = EXPIRY_LANDED } = {})`，生产不传、测试注入 | 只测未到期态会让到期分支成为死代码；测试改仓内常量违反「测试不得写业务代码」 |
| Q10 | skip 白名单载体与红时文案？ | 单源 `scripts/test-skip-allowlist.mjs` 的 `SKIP_ALLOWLIST`；红时 `[测试] 名单外 skip：<用例名>`；解析不出名字 fail-closed | 内联进 `check-all` 会与 glob/解析混在一处，且测试只能扫文本、无法 import 断言 |
| Q11 | 验收类用例的落地形态？ | **不落 `*.test.mjs`**：写成 plan 收尾任务的命令清单，输出贴 `gate-record.md`；**不钉 `# tests` 增量**，用「`# pass + # skipped = # tests` 且 `# tests ≥ 166`」兜底 | 落进 `*.test.mjs` 会被 ② 段全仓 glob 收进 → 递归；增量按用例数算会与 `test()` 调用数错位 |
| Q12 | 产物名大写后缀（`observation-r1-A.json`）算不算产物？ | 不算（`ARTIFACT_RE` 只认小写 `-[ab]`），按三态后果判 | 正则语义由 S2 纯函数单源，本 spec 不另立 |
| Q13 | `runObservationGate` 要不要收 `root` 参数？ | **不收**。内部 `repoRoot()`；测试用子进程 `cwd` = 临时 git 仓库注入 | PRD `:424`「接口删掉该参数」；`repoRoot()` 有进程内缓存，同进程 `chdir` 不可复用 |
| Q14 | 「对」怎么数？ | 一对 = 已存在且成对的 json + 同名 md（`-a`/`-b` 各自成对） | 计数行与锚点要能逐字核；「件 / 对」混用会让数字对不上 |
| Q15 | git 超时？ | 三条命令统一 `timeout: 30000`，超时按 `RepoRootUnresolved` 收敛 | 无超时会让 `npm run check` 遇锁无界等待 |
| Q16 | 过程目录数 / 归档数写死吗？ | **不写死**：过程写「≥49（2026-10-27 实测 50，每轮 +1）」，判据只断 `processPairs === 0` 与「无 `ArtifactMissing`」；归档断 `scannedDirs ≥ 2 && archivePairs ≥ 1` 并**按名断言**存量白名单目录与演练目录在位，不钉等值 | 移动靶（每轮评审 +1；plan 的迁移演练会让归档 +1）；同 S2 撤回「绝对基线 2」的教训 |
| Q17 | 施工期 ⑥ 段红怎么办？ | 迁移步骤 1 的 `UntrackedArtifact` 属预期；plan 的「绿」判据从 `git add` 完成起算 | PRD §5.1 `:391` 明写「属预期，不得据此判定门禁失效」 |
| Q18 | 只含允许类账本、无产物的归档子目录判什么？ | **`ArtifactMissing` 红**（`:410` 只免 `UnclassifiedArtifact`）；迁移前加「第 0 步」= 先产出 `observation-r<N>` | 用户 2026-10-27 裁定「按 D-12：仍判红」；D-12 见 PRD `:507` |
| Q19 | skip 守卫要比条数吗？ | **不比**：只按名字判（名字 ⊄ 名单 → 红；解析 0 名且 M>0 → 红） | `DW_RUNTIME_CHECK=1` 时 skip 可为 0，条数相等会假红（同 S2 撤回「绝对基线 2」） |
| Q20 | ⑥ 段输出里的 `findings` 与豁免行里的 `findings` 同名吗？ | 不同量：豁免行写「**卡面** findings <n>」（来自 `disposeCardFindings([])`） | 同一次输出不得互相否定；不加限定词会被读成「产物 0 问题」 |

### 11.8 不在这一轮

- S1 定义层：F-01～F-08（含 15 卡内容校验）——PRD §8 S1。
- S4 渲染层：F-09～F-12、F-23（含全席重生成与 F-24 到期事件）——PRD §8 S4。**S4 承接项（本 spec 指派）**：首次重生成落地那一刻必须把 `card-exempt.mjs` 的 `EXPIRY_LANDED` 置 `true`（事件型到期的唯一开关），并在 S4 spec 的验收锚点里写明。
- 自动迁移命令、归档件批量搬移：属流程动作，S3 不提供脚本。**存量过程目录（≥49 个，现 50）不批量迁移、不补历史产物**；迁与不迁由各评审轮自行决定，迁则按 D-12 第 0 步先产出 `observation-r<N>`。
- M 组上线后度量（PRD §9.3）：判定时点 = 首次含 `observation-r<N>` 的归档迁移完成后。

### 11.9 与既有 spec 的关系

- 承接 `docs/superpowers/specs/2026-10-27-s2-observation-check-design.md` §10.5（S2/S3 边界定死）；不取代任何 spec。
- 本 spec 不修改 S2 spec 的判据，只按 §11.6 D7 改一处**命令写法**并留痕。

### 11.10 验收锚点（本 spec 自定 8 条；逐条挂 PRD 出处）

| # | 锚点 | 出处 / 可核方式 |
|---|---|---|
| 1 | 门禁真红 | PRD §5.3 `:437-440`（第 7–10 行）+ §9.1 V-6 `:563` + §8 S3 行备注 `:546`（「零产物 / 不可枚举 / 反向清单 / 旁路必须有测试」）：各 1 条红例 |
| 2 | 归档现状不误红 | PRD §5.2 `:401-408`：现 2 个归档子目录（存量白名单 1 + 演练目录 1，含 1 对产物）扫后 0 findings；判据取下界 `scannedDirs ≥ 2 && archivePairs ≥ 1` + 按名断言两目录在位（plan 的迁移演练会使计数 +1，不钉等值） |
| 3 | 过程目录口径 | PRD §5.2 `:413`：过程目录（≥49）0 产物 → 0 findings，无 `ArtifactMissing` |
| 4 | 仓门禁不红 | PRD §2-4 `:152`：`npm run check` 全绿且新增 ⑥ 段打印四个计数 |
| 5 | 旁路可用且留痕 | PRD §5.1 `:396`：`CHECK_BYPASS=1` → 首行 `BYPASS: <原因>`，⑥ 跳过，其余段仍可红 |
| 6 | skip 守卫 | PRD 未提（用户 2026-10-27 裁定，`progress.md` §0.1）：名单外 skip/todo → 红；白名单 2 条 → 绿 |
| 7 | F-24 窗口登记 | PRD §5.2 `:416`：`EXEMPT_CARDS` = 15 项且形态为 `agents/<name>.md`；处置纯函数两态；状态行模板 + 非达标标记 |
| 8 | 命令写法统一 | PRD §8 S2 出口判据 `:530`（2026-10-27 统一）：仓根 `node --test "tools/observation-check/*.test.mjs"` → `# tests 166 / # pass 166 / # fail 0` |
