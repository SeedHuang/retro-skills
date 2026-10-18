# 测试用例：Docgen P1 一条 rule 的整文件生成（实现设计）

> 归属 spec：`docs/superpowers/specs/2026-10-18-docgen-rule-whole-file-design.md`（split from `docs/prd/docgen-rule-whole-file.md`，2026-10-18）
> 编写者：`senior-sdet`（实例标识 `sdet-2026-10-18-docgen-p1`，全新上下文）｜**独立性声明**：编写者 ≠ spec 作者，≠ 施工者；本文件编写期间未读到任何 docgen 实现（实测 `tools/docgen-spike/` 目录在本轮不存在），用例只从 spec 全文、PRD §4/§5/§6/§8 的验收锚点推导；spec 作者只能核对覆盖与提疑问，不得自行改写本文件的判据。
> 状态：**定稿（内容评审通过；机械检查通过，2026-10-18）**（定稿 = 每条用例五要素齐全 + 覆盖总表与 V1–V11、R1–R15 一一对应）｜最后更新：`2026-10-18`（第 7 轮：按 spec 补的三处口径同步——§5.4 哨兵常量 `SENTINEL_V4` / `SENTINEL_V10` 从 `specTestCaseGate.mjs` 导出、§7.2 涉及 check 的 e2e 在 `DOCGEN_CHECK_ACTIVE=1` 下显式 `t.skip()`、§7.3/§7.4 故障注入副本由 `run.mjs` 启动清理后自建 + 唯一临时名；本文件同步 TC-049、TC-051、TC-057、TC-070 与 §0/§4/§7/§8；**第 8 轮**按 spec 补的最后四处口径再同步——`--case` 枚举含 `V10b`、省略 `--case` 的全量为 **13** 例、`--no-clean` 的 ROOT 归属（测试内 spawn 一律带、顶层 owner 不带）、故障注入副本由 `run.mjs --case Vn` 的用例代码在启动清理后自建、TC-057 并入 §7.2 的 skip 清单且 ROOT 残片预置获 §7.3 明文例外；本文件同步 §0、TC-049/051/052/053/054/057/062/063、§1/§3/§4/§7/§8；**第 9 轮**按 spec §7.3 补的「副本归属两分」口径再同步——`--case Vn` 内的副本由用例代码在启动清理后自建，`--gate` / `--compare` 等非 `--case` 模式的副本允许在 spawn 前预置在 ROOT 内（须带 `--no-clean` + spawn 前先断言存在），同时把第 6 轮的旧断言口径标为历史记录；本文件同步 §0、TC-065、TC-069、TC-068、§7.1、§8；**用例总数不变：71 条 / 正 13 / 负 58**）
> 命名与落点：按 `spec-testcase-gate` 判据 1（与 spec 同目录；文件名 = spec 文件名去 `.md` + `-testcase.md`）。
> 来源标注：本文件 71 条用例**全部为「spec 推导」**（第 5 轮新增 TC-067–TC-071 仍从 spec 推导：F4 依据 spec §7.2「防自递归」段、F15 依据 §7.2 步③.5、F11 依据 §7.1 `TargetReadFailed` 与 `--compare`、F18 依据 §7.1 `--write-baseline`；F13/F14 只是判据实现方式的换装，不新增语义）；无「实现观察（补充）」类用例（实测 `tools/docgen-spike/` 在本轮仍不存在）。§8 建议表中的条目另标状态列，写明「已落地（spec 哪一节）」「不采纳」或「仍开放」。

**第 2 轮改动清单**（TC 编号不删不改号，新用例从 TC-063 起）：

| 改动 | 涉及 TC | 依据（更新后的 spec） |
|---|---|---|
| `InvalidInputPath` 定为输入侧越界码，判据从「拒绝」升级为「码 + path」 | TC-048（改） | §7.1 路径合法性 + 新增实现细化码声明 |
| 错误码矩阵 17 → 18 | §1 | 同上 |
| `--gate` / `--case` 互斥、`--case` 枚举白名单 → exit 2 | TC-063（新） | §7.1 |
| fixture 非 JSON / 读取失败 → exit 3 | TC-064（新） | §4.3 末条 |
| `--out` 经 junction / symlink → realpath 复判后仍拦 | TC-065（新） | §7.1 realpathSync 复判 |
| `UnregisteredHandwritten` 含两个可操作指引词 | TC-041（改） | §6.3 末段 |
| line 口径「CR 不单独成行」 | TC-022（改） | §6.1 步3 |
| R15 施工顺序的可观测后果 | TC-066（新） | R15 |
| 纯模块不得用 `child_process`（静态约束的另一半，防 `execSync` 绕过 fs 探针） | TC-060（改） | §5.5 静态约束（「`child_process` 不在允许依赖内」） |
| `--out` 前缀绕过（`startsWith` 类）机器判据保留；并按 spec 的三段式判定补一条 `..` 穿越分支 | TC-046（改：判据保留 + 新增分支） | §7.1 路径合法性（`rel` 三段判定） |
| 测试代码落点已由 spec 规定，§0 从「提议」改为「与 spec 对齐」 | §0 | §3.1 |

**第 3 轮改动清单**（spec 作者按 §8 建议 11/12 补了两处口径；TC 编号不新增、不重排）：

| 改动 | 涉及 TC | 依据（更新后的 spec） |
|---|---|---|
| 输入侧越界码的退出码从「非 0」升级为「恰为 2」 | TC-048（判据收紧） | §7.1「输入侧越界 → `InvalidInputPath`（`path`，退出码 2）」 |
| realpath 复判只对已存在路径执行，不存在交给读取阶段（**已被第 4 轮取代**：改为「最近的已存在祖先」，见下） | TC-048（不覆盖行改写：三个输入都是已存在的真文件，只走越界分支） | §7.1 新增句 |
| fixture 非 JSON / 读取失败「不分配产品错误码」 | TC-064（不覆盖行改写 + 判据补「不得出现产品码」） | §4.3 末条 |
| §7.1 缺口表：2 行关闭、1 行部分关闭、新增 2 行（**第 4 轮已全部关闭**） | §7.1 | §7.1 + §4.3 |
| §8 建议 11、12 状态更新；新增 13、14（本轮复核新发现） | §8 | 同上 |

**第 4 轮改动清单**（spec 作者按 §8 建议 10/11/12/13/14 补口径；TC 编号不新增、不重排）：

| 改动 | 涉及 TC | 依据（更新后的 spec） |
|---|---|---|
| `--out rules/x.md` 判据补「退出码恰为 2」与「`ROOT` = `.tmp-test`」 | TC-042（判据收紧） | §7.1「**路径根**：`ROOT = <仓库根>/tools/docgen-spike/.tmp-test`」+ 逐码表（路径越界 → 2） |
| 新增「`ROOT` 定义的负例」与一条正向对照 | TC-046（新增分支，不改号） | 同上（若 `ROOT` 误取仓库根，`rules/x.md` 会通过） |
| junction / symlink 从「平台支持时 skip」升级为「可构造时必测」 | TC-065（判据收紧） | §7.1 realpath 改为对「最近的已存在祖先」执行 |
| 输入侧 exit 2 与逐码表一致 → 只补覆盖行引用 | TC-048（只补引用） | §7.1 退出码逐码映射表第 2 行 |
| fixture 读取/解析失败归 3 与逐码表一致 → 只补覆盖行引用 | TC-064（只补引用） | §7.1 退出码逐码映射表第 3 行 |
| 缺口表 3 行关闭、逐码映射行关闭、新增长度/超时行 | §7.1 | §7.1 + §6.1 |
| §8 建议 #4 转「不采纳」，#10 / #11 / #12 / #13 / #14 转「已落地」 | §8 | §7.3 V10 + §6.1 + §7.1 |

**第 5 轮改动清单**（第 1 轮议会评审的 testcase 必修项；TC 编号不删不改号，新用例从 TC-067 起）：

| 族 | 改了什么 | 涉及 TC | 依据（更新后的 spec） |
|---|---|---|---|
| F1 | 「8 个 H2」→ **9 个 H2**，断言改为与 §5.2 的 9 个标题**有序数组**逐项相等 | TC-002；§5 人工项 | §5.2「本模板共 **9 个 H2**：核心判据 + 其余 8 个」 |
| F4 | 自递归：`*.test.mjs` 禁止调 `npm run check` / `check-all.mjs`；TC-049/050 的「对应测试」从 `cli.test.mjs` 改为 `run.mjs::V10b` / `run.mjs::V10`；§0 加硬约束；新增静态断言 | TC-049、TC-050、TC-067（新）、§0 | §7.2「**防自递归**」段 + §7.3 V10 行 |
| F8 | `Mismatch` 输出必须含 `specTestCaseGate.mjs`（内容源指引） | TC-023 | §6.1 末段（Mismatch 消息必含「内容源在 `tools/docgen-spike/specTestCaseGate.mjs::buildData()`」） |
| F16 | `byte === mutatedOffset`、`line === expectedLine` 写成**精确断言**，删掉只匹配 `/byte=\d+/` 的弱判据 | TC-023 | §6.1 步3（`line`/`byte` 的定义） |
| F11 | TC-045 改用 `--compare .tmp-test/**/missing.md` 触发 `GeneratedMissing`；新增 `TargetReadFailed`（`--target` 指向 ROOT 内不存在的文件 → exit 3） | TC-045、TC-068（新） | §7.1 `--compare` 行 + `TargetReadFailed` 段 + 逐码表第 3 行 |
| F13 | TC-058 不再把 `run1.txt/run2.txt` 写进 `.tmp-test/`（启动会删）；改为 Node `execFileSync` 在**内存**比对两次 stdout；期望 `.tmp-test/` 不存在 | TC-058 | R11 / §7.4 启动删 `ROOT` |
| F14 | 全部 `test -e` / `sha256sum` / `diff` 判据换成 Node 内置（`fs.existsSync` / `crypto.createHash` / 字符串 `strictEqual`）；外部命令只留 `git status` / `git hash-object` / `git check-ignore` / `git check-attr` | §0 新增断言工具约定 + TC-023、TC-026、TC-031、TC-040、TC-041、TC-042、TC-046、TC-050、TC-057、TC-058、TC-059、TC-065 | 跨平台可执行性（Windows 原生无 `test -e`/`sha256sum`/`diff`，负断言会恒真） |
| F15 | gate 已加 `assertTemplateClean`：新增 e2e「模板 = target 全文 → `--gate` 报 `TemplateHardcoded` + exit 1」；TC-018 保留单元层 | TC-069（新）；TC-018 不动 | §7.2 步③.5 + §7.1 逐码表（`TemplateHardcoded` → 1） |
| F17 | V9 补 `git check-ignore -q tools/docgen-spike/.tmp-test/x` 退出 0 | TC-058；§4 新增 `.gitignore` 回归行 | §3.1 `.gitignore` 行 + §7.3 V9 行 |
| F18 | `--write-baseline` 正例（新增第 22 条 → 写 → gate 绿 → 撤销）与负例（与 `--gate`/`--case` 同给 → exit 2，baseline 字节不变） | TC-070、TC-071（新） | §7.1 `--write-baseline` 两条 + 互斥三选一 + §7.3 末段 |
| F7 | 头部状态「草稿」→「待评审（内容已定稿，待第 2 轮复核）」 | 文件头 | — |

**第 6 轮改动清单**（spec 作者按第 2 轮 sdet 建议补口径；TC 编号不删不改号，用例总数不变）：

| 族 | 改了什么 | 涉及 TC | 依据（更新后的 spec） |
|---|---|---|---|
| 唯一临时名 | V4 用 `rules/tmp-new-rule-V4.md`、V10 用 `rules/tmp-new-rule-V10.md`；前置 / 哨兵 / 清理 / 后置断言同步；TC-040 的单元层临时规则另用 `rules/tmp-new-rule-TC040.md`（它不经哨兵机制，仅避免与两个哨兵名混淆） | TC-001、TC-023、TC-040、TC-041、TC-049、TC-050、TC-057、TC-063、TC-070、§3、§7.4 MUT | §7.4「**临时文件唯一名**」 |
| 哨兵自愈（本轮新增语义） | 启动对两个唯一文件按「内容 === 各自固定串」自愈并打印「已清理上次中断残留」；近失（哨兵串 + 追加内容）与非哨兵内容都 fail-closed（不删 + `UnregisteredHandwritten` + exit 2） | TC-057（重写） | §7.4 启动段 |
| 退出钩子 | 退出时删本次创建的 `.tmp-test/`；删不掉则保留、由下次启动清理 | TC-058 | §7.4 退出钩子段 |
| 断言模式 × 前置错误 | **历史记录（第 6 轮口径，已被第 8 轮取代，不得当作现状引用）**：第 6 轮曾写成「前置错误不因断言模式变 PASS——`TargetReadFailed` / `TemplateReadFailed` / `GeneratedMissing` 取 3 档、`EnvironmentEOL` / baseline 类 / 路径越界取 2 档，无条件生效」。现行口径见 §7.1「**断言模式与前置错误**」段与下方第 8 轮清单：前置错误只在**不是本例期望**时才用自己的退出码；当该码正是本例期望（V3/V4/V5/V7/V8/V11 等）时按命中处理 `PASS V<n>` + exit 0；只有「用例期望未命中」才 `FAIL V<n>` + exit 1 | TC-068（恢复为有效用例） | §7.1「**断言模式与前置错误**」段（第 8 轮修订） |
| 全量总数 = 12 | 省略 `--case` = V1–V11 + V2b = **12**；删掉「11/12 都接受」 | TC-062 | §7.1 断言模式段末句 |
| 四模式互斥 + `--compare` 进 R14 | 互斥从三模式扩到四模式（gate / case / write-baseline / compare）；`--compare` 纳入 `.tmp-test/**` 白名单 | TC-063、TC-071 | §7.1 CLI 互斥行 + R14 |
| `--write-baseline` × `--baseline` | 同给 → exit 2，且只写默认 `baseline.json`（副本不被写） | TC-071（新分支） | §7.1 `--write-baseline` 行 |
| §8 建议状态 | 六条转「已落地」（本表 #15/#16/#17/#18/#21/#22，即 spec 作者所称的 #21–#26）；#21 残部（嵌套链的「干净树污染」）与 #19/#20 仍开放；**本轮新发现 #23（哨兵串导出点）与 #24（ROOT 内预置副本会被启动清理删掉）** | §8 | 同上 |

**第 7 轮改动清单**（spec 作者补了最后三处口径；TC 编号不删不改号，用例总数不变）：

| 族 | 改了什么 | 涉及 TC | 依据（更新后的 spec） |
|---|---|---|---|
| 哨兵常量导出 | TC-057 的「精确串」分支改为**引用导出的 `SENTINEL_V4` / `SENTINEL_V10`**（从 `specTestCaseGate.mjs` import），不再写「须由实现提供、导出点未定、不得猜字符串」；三支语义（精确 → 自愈删除；近失 → 不删；非哨兵 → 不删）不变 | TC-057、§4 回归清单、§7.1 缺口表 | §5.4「哨兵串 `SENTINEL_V4` / `SENTINEL_V10` 从 `specTestCaseGate.mjs` 导出；V4/V10 与测试引用同一常量，禁止猜字符串」 |
| 显式 `t.skip()` | TC-049 / TC-051 / TC-070 写明「被 check 嵌套（`DOCGEN_CHECK_ACTIVE=1`）时显式 `t.skip()`，skip 原因进 TAP 输出；`run.mjs` 串行编排时照常执行」；TC-051 / TC-070 加「单跑不得出现 `# SKIP`」的判别力断言 + 反例 `MUT-93`，TC-049 因当前无 `*.test.mjs` 包装只写条件式约束（不造恒真空断言） | TC-049、TC-051、TC-070、§0、§7.4 MUT | §7.2「涉及 check 的 e2e（V10/V10b 及 TC-049/051/070）只由 `run.mjs` 串行编排；`node --test` 在 `DOCGEN_CHECK_ACTIVE=1` 下对这些用例**显式 `t.skip()`**，不得靠隐式约定」 |
| 副本自建 + 唯一名 | **历史记录（第 7 轮口径，已被第 9 轮的两分口径取代）**：第 7 轮曾写「故障注入副本一律由 `run.mjs` 在启动清理之后自建，测试不得在 spawn 前预置 ROOT 内文件」；现行口径见 §0「副本生命周期」与第 9 轮清单——`--case Vn` 内仍自建，非 `--case` 模式允许带 `--no-clean` 预置。临时文件唯一名 V4 `-V4.md` / V10 `-V10.md` 不变 | §0、TC-057（预置位置说明） | §7.3（第 9 轮两分口径）+ §7.4 唯一名 |
| §8 状态 | #21 残部、#23、#24 转「已落地」；#19/#20 保留 P2；本轮新发现 #25 / #26（TC-057 在 skip 清单外、TC-057 的 ROOT 残片预置与 §7.3 的冲突） | §8 | 同上 |

**第 8 轮改动清单**（spec 作者补了最后四处口径；TC 编号不删不改号，用例总数不变）：

| 族 | 改了什么 | 涉及 TC | 依据（更新后的 spec） |
|---|---|---|---|
| `--case` 枚举含 `V10b` | 枚举从 `V1..V11\|V2b` 扩为 `V1..V11\|V2b\|V10b`；`--case V10b` 合法且**计入全量** | TC-049、TC-062、TC-063、§1 | §7.1 用法行 + 「省略 `--case` = 跑全部（13 例）」+ 枚举白名单行 |
| 全量 = 13 例 | 省略 `--case` 跑 V1–V11 + V2b + **V10b** = 13；`PASS V<n>` 恰 13 行、末行 `13/13 PASS`；删掉「V10b 不计入」的旧口径 | TC-062、TC-058（不覆盖行）、§1、§3、§7.4 MUT-89 | §7.1 断言模式段末句 + §7.3 V10b 行「计入全量 13」 |
| 前置错误 vs 本例期望 | 前置错误只在「不是本例期望」时才用自己的退出码；当该码正是本例期望（V3/V4/V5/V7/V8/V11 等）时按命中处理：`PASS V<n>` + exit 0 | TC-052（改判据）、TC-053、TC-054、TC-068 | §7.1「断言模式与前置错误」段 |
| `--no-clean` 与 ROOT 归属 | 新增 CLI 参数：跳过启动清理与哨兵自愈；只有顶层 owner 清 ROOT/自愈，**测试内 spawn 一律带 `--no-clean`** | §0（新增一条硬约定）、TC-051/052/053/054/069、TC-057（owner 例外） | §7.1 用法行 + §7.4「ROOT 归属」 |
| 副本由用例代码自建 | 故障注入副本由 `run.mjs --case Vn` 的用例代码在启动清理之后自建（**第 9 轮限定为 `--case` 分支**：非 `--case` 模式允许带 `--no-clean` 预置，见第 9 轮清单） | TC-051/052/053/054（`--case` 分支）、TC-057（例外） | §7.3（第 9 轮两分口径）+ 句末的唯一例外 |
| TC-057 收口 | §7.2 的 skip 清单已列 TC-057；§7.3 已给「TC-057 允许预置 `.tmp-test/stale/x.md`」的明文例外 → 旧的两条「spec 未列/未给例外」全部删除 | TC-057、§0、§1、§7.1、§7.2、§8 #25/#26 | §7.2 第二段 + §7.3 句末 |
| §7.5 交付节点 | 节点 1 去掉了 V9；V9 归「全量收口」；PRD §8 表与索引 P1 状态仍在全绿后一次性写 | 不新增 TC（本文件无节点用例；TC-058 只认 V9 的可观测后果） | §7.5 节点表 + 表下说明 |
| §8 状态 | #21 / #23 / #24 / #25 / #26 全部转「已落地」；只剩 #19 / #20（P2） | §8 | 同上 |

**第 9 轮改动清单**（spec §7.3 补「副本归属两分」，并收口旧断言口径；TC 编号不删不改号，用例总数不变）：

| 族 | 改了什么 | 涉及 TC | 依据（更新后的 spec） |
|---|---|---|---|
| 副本归属两分 | §0 的「副本生命周期」改为 spec §7.3 的两分口径：① `--case Vn` 内的副本由用例代码在启动清理后自建；② `--gate` / `--compare` 等非 `--case` 模式的副本允许在 spawn 前预置在 ROOT 内，但必须带 `--no-clean` 且 spawn 前先断言文件存在；删掉「任何 spawn 前都不得预置」的绝对句（第 7/8 轮的 blanket 措辞仅作历史记录） | §0、TC-065、TC-069 | §7.3 副本归属两分 + §7.1 用法行（`--no-clean`） |
| TC-069 | 改为「测试先建 `TC-069/tpl-full.tpl` → 断言存在 → spawn `--gate --template … --no-clean` → `TemplateHardcoded` + exit 1」；删掉「由 `run.mjs` 自建」与「预置必被删」两处已失效的理由（非 `--case` 模式带 `--no-clean` 时副本不会被启动清理删掉） | TC-069 | 同上 |
| TC-065 | junction / 链接副本同构：先建 link、先在 spawn 前断言存在，再带 `--no-clean` spawn | TC-065 | 同上 |
| 旧断言口径清理 | 「前置错误不因断言模式变 PASS / 2、3 档恒用各自退出码」的绝对陈述改为条件式：该码正是本例期望 → `PASS V<n>` + exit 0；不是本例期望 → 用自己的档位；只有「期望未命中」才 `FAIL V<n>` + exit 1。第 6 轮清单与 §8 #22 标为「历史记录 / 已被第 8 轮取代」，不再作为现状 | §0 第 6 轮清单、§1 TC-068 行、TC-068 覆盖、TC-057 预期⑤、§7.1 缺口表、§8 #22 | §7.1「断言模式与前置错误」段（第 8 轮修订） |

## 0 执行面约定（与 spec §3.1 对齐）

spec §3.1 已把测试代码落点写进文件布局（`tools/docgen-spike/test/*.test.mjs`，运行 `node --test tools/docgen-spike/test/`），本轮起本文件不再「提议」，下表即按 spec 原文展开；单文件运行命令是为定位失败用例而加的参数，不改变落点。

| 测试文件（按 spec §3.1） | 覆盖对象 | 运行命令 |
|---|---|---|
| `tools/docgen-spike/test/validate.test.mjs` | §5.1 模板语法、§5.3 validateData、§5.4 assertTemplateClean | `node --test tools/docgen-spike/test/validate.test.mjs` |
| `tools/docgen-spike/test/compare.test.mjs` | §6.1 compareBuffers、§6.2 checkEnvironment | `node --test tools/docgen-spike/test/compare.test.mjs` |
| `tools/docgen-spike/test/baseline.test.mjs` | §6.3 五步校验与 R9 顺序 | `node --test tools/docgen-spike/test/baseline.test.mjs` |
| `tools/docgen-spike/test/cli.test.mjs` | §7 CLI、退出码、gate、清理、可复跑、**静态断言（防自递归 / 路径白名单 / 模板硬编码）** | `node --test tools/docgen-spike/test/cli.test.mjs` |
| `tools/docgen-spike/run.mjs` | V1–V11 端到端编排（CLI 断言模式） | `node tools/docgen-spike/run.mjs --case V<n>` |

- 全部测试文件落在 `tools/docgen-spike/**`（R7 写入白名单内）；临时数据一律落 `tools/docgen-spike/.tmp-test/TC-<编号>/`。
- spec §7.1 定义 `ROOT = <仓库根>/tools/docgen-spike/.tmp-test`；本文件所有「越界 / 合法」判据都以它为根（TC-042 / TC-046 / TC-048 / TC-065），不按「实现恰好用了哪个目录」反推。
- 断言名约定：`V<n> > <场景>`（例：`V3 > pass 为空串`），便于「对应测试」对号。
- 只用 Node 内置模块（`node:test`、`node:assert`、`node:fs`、`node:path`、`node:crypto`、`node:child_process`），满足 R13。**分层约束**：`node:child_process` 只允许出现在编排层 `run.mjs`/测试代码里（V10 要调 `npm run check`）；纯模块 `specTestCaseGate.mjs` / `compare.mjs` 不得出现（spec §5.5 明写「`child_process` 不在允许依赖内」，TC-060 断言这一点）。
- **硬约束（F4，防自递归）**：`tools/docgen-spike/test/*.test.mjs` **禁止**调用 `npm run check`、`node scripts/check-all.mjs` 或任何会再次进入 `check-all.mjs` 的命令——`check-all.mjs` 会跑 `node --test`，测试文件再跑 check 就无限派生。V10/V10b 只由 `run.mjs` 编排（`--case V10` / `--case V10b`），本文件的 TC-049/TC-050 因此把「对应测试」指向 `run.mjs::V10b` / `run.mjs::V10`，不指向 `cli.test.mjs`。第二道闸是 spec §7.2 的 `DOCGEN_CHECK_ACTIVE=1`（`check-all.mjs` 调 `--gate` 时设置，`run.mjs` 见到即跳过任何 `npm run check` 子调用）；TC-067 用静态扫描把这条约束钉死。
- **嵌套调用的测试隔离（第 7 轮按 spec §7.2 定稿，不再靠隐式约定）**：`check-all.mjs` 会跑 `node --test`，此时外层 V10 正持有 `rules/tmp-new-rule-V10.md`。spec §7.4 的「临时文件唯一名」已解决 **V4 与 V10 互删**（TC-041 的 `finally` 只删 `-V4.md`、TC-050 只删 `-V10.md`）；「干净树污染」由 spec §7.2 明确处理：**涉及 check 的 e2e（V10/V10b 及 TC-049 / TC-051 / TC-057 / TC-070）只由 `run.mjs` 串行编排；`node --test` 在 `DOCGEN_CHECK_ACTIVE=1` 可见时必须对这些用例显式 `t.skip()`**——skip 用 `node:test` 的 `{ skip: '<原因>' }` 或 `t.skip('<原因>')`，原因串必须出现在 TAP 输出的 `# SKIP` 行（不得靠隐式约定、不得靠碰巧顺序）。反向判别力：**不设该变量时这几条必须真的执行**（输出里不得出现它们的 `# SKIP`），否则「一律 skip」会变成变相通过（反例 `MUT-93`）。`run.mjs` 的串行编排路径没有这个变量，**照常执行**。**第 8 轮收口**：spec §7.2 已把 **TC-057** 并入同一份 skip 清单（它写/删 `rules/tmp-new-rule-V10.md`，与外层 V10 冲突），§8 #25 关闭；清单现为 V10/V10b 及 TC-049 / TC-051 / TC-057 / TC-070。
- **副本生命周期（第 9 轮按 spec §7.3 定稿，分两种归属；原 §8 #24 关闭）**：① **`--case Vn` 内的副本**（`--target` / `--template` / `--baseline` / `--compare` / `--out` 指向的文件、junction）由**用例代码在启动清理之后、执行用例之前自建**；此类 spawn 不得预置文件——「谁建这份副本」属于该用例的职责（典型症状：预置被启动清理删掉 → 报 `InvalidBaseline` 而不是 `BaselineDrift`）。凡此类用例（TC-031 / TC-051 / TC-052 / TC-053 / TC-054）一律标注「副本由该例在启动后自建」。② **`--gate` / `--compare` 等非 `--case` 模式的副本**（TC-069）与**测试自行构造的 junction / symlink 副本**（TC-065），**允许**测试在 spawn 前预置在 ROOT 内，但必须同时满足两条：spawn **带 `--no-clean`**（跳过启动清理，副本才不会被删）、spawn 前**先断言文件存在**（`assert.strictEqual(fs.existsSync(p), true)`，否则期望值落空且该支是空断言）。**不带 `--no-clean` 的 spawn 不得预置 ROOT 内文件**；唯一例外是 TC-057 的 `.tmp-test/stale/x.md`（见下）。TC-071 的 `--baseline` 分支断言「副本路径跑完仍不存在」，不需要预置。**不得**把副本改放到 ROOT 之外规避——那会被 R14 判成 `InvalidInputPath`，测试通过的原因就变了。另：TC-057 的 `rules/tmp-new-rule-{V4,V10,TC057}.md` 不在 ROOT（在 `rules/`），启动清理不会删它们，这正是「模拟 SIGKILL 残留」的必要条件。**TC-057 owner 例外**：spec §7.3 明文允许它预置 ROOT 残片 `.tmp-test/stale/x.md`（它要验「启动先删 ROOT」，故 spawn **不带** `--no-clean`，这条是本条的**唯一例外**）；测试仍须在 spawn 前先断言它存在，否则该支是空断言（§8 #26）。
- **`--no-clean` 与 ROOT 归属（第 8 轮按 spec §7.1 / §7.4 定稿）**：**测试内 spawn `run.mjs` 一律带 `--no-clean`**（凡以 `node --test` 为入口、用 `execFileSync` / `spawnSync` 起 `run.mjs` 的都算测试内 spawn：TC-023、TC-051、TC-052、TC-053、TC-054、TC-055、TC-056、TC-063、TC-064、TC-065、TC-068、TC-069、TC-070、TC-071；下文只在 TC-051/052/053/054/069 逐条写明，其余按本条执行、不逐条重复）；**顶层 owner 不带**——只有它清 `ROOT` 与做哨兵自愈。为什么：`--no-clean` 跳过启动清理与哨兵自愈，带与不带决定「谁有权清 `ROOT`」；嵌套进程若不带，会把外层正在使用的 `ROOT` 与临时文件清掉，外层断言随机红绿。**两个例外**：① **TC-057** 验的就是「启动先删 ROOT」，它的 spawn 必须是**不带 `--no-clean` 的 owner**（带了等于把被测行为关掉）——被 `DOCGEN_CHECK_ACTIVE=1` 嵌套时按 §7.2 显式 `t.skip()`，因此不会出现「嵌套身份 + 不带 `--no-clean`」的组合；② **TC-049 / TC-058 / TC-062** 的判据落点是 `run.mjs` 自身或独立 Node 驱动（不放进 `*.test.mjs`），它们本身就是 owner，同样不带。
- **断言工具约定（F14）**：本文件所有判据一律用 Node 内置实现——存在性 `fs.existsSync(p)`（`strictEqual(..., false)`）、哈希 `crypto.createHash('sha256').update(bytes).digest('hex')` 前后 `strictEqual`、内容/字节 `Buffer.compare` 或 `strictEqual`。允许调用的外部命令**只有** `git status --short`、`git hash-object`、`git check-ignore -q`、`git check-attr`（git 自带、三平台行为一致）。**禁止** `test -e`、`sha256sum`、`diff`、`cmp`：Windows 原生 shell 没有这些命令，负断言（「文件不存在」）会因命令找不到而恒真——这种判据看起来是绿的，实际什么都没验。
- 每条用例的后置断言统一为：`git status --short rules/` 空、target 与模板 SHA256 不变（下文不再逐条重复，只在用例有额外后置时写明）。

## 1 覆盖总表

| 用例 ID | 覆盖的 spec 条目 | 层级 | 正/负 | 判据类型 | 执行方式 | 优先级 |
|---|---|---|---|---|---|---|
| TC-001 | V1；§7.3 行 V1；R6 步⑤⑥ | e2e | 正 | 机器 | `run.mjs --case V1` | P0 |
| TC-002 | §5.2 模板结构（**9 个 H2** 有序数组）；R3；R4 | 单元 | 正 | 机器 | `node --test validate` | P0 |
| TC-003 | R4 确定性；V1 | 单元 | 正 | 机器 | `node --test validate` | P1 |
| TC-004 | §4.3 fixture；§5.1 同 key 多现 | 单元 | 正 | 机器 | `node --test validate` | P1 |
| TC-005 | R1 纯度；§5.5 探针（对照）；V6① | 单元 | 正 | 机器 | `node --test validate` | P0 |
| TC-006 | V6③；R3 数据驱动 | e2e | 正 | 机器 | `run.mjs --case V6` | P0 |
| TC-007 | V3；§5.3 步4 | 单元 | 负 | 机器 | `node --test validate` | P0 |
| TC-008 | §5.3 步2/4（纯空白边界）；V3 | 单元 | 负 | 机器 | `node --test validate` | P1 |
| TC-009 | §5.3 步3；§4.1 fourElements | 单元 | 负 | 机器 | `node --test validate` | P0 |
| TC-010 | §5.3 步4（空数组、index 形态 slot） | 单元 | 负 | 机器 | `node --test validate` | P0 |
| TC-011 | §5.3 步5（三维空数组与空条目） | 单元 | 负 | 机器 | `node --test validate` | P1 |
| TC-012 | §5.3 步1；V5；PRD §3 P1-1 值集 | 单元 | 负 | 机器 | `node --test validate` | P0 |
| TC-013 | §5.3 固定顺序；§6.3 R9 | 单元 | 负 | 机器 | `node --test validate` | P0 |
| TC-014 | §4.3 未知键抛 Error | 单元 | 负 | 机器 | `node --test validate` | P1 |
| TC-015 | §4.3 顶层浅覆盖语义 | 单元 | 负 | 机器 | `node --test validate` | P1 |
| TC-016 | V6①；§5.5；R1 | 单元 | 负 | 机器 | `node --test validate` | P0 |
| TC-017 | §5.5 finally 恢复原函数 | 单元 | 负 | 机器 | `node --test validate` | P0 |
| TC-018 | V6②；§5.4；R2 | 单元 | 负 | 机器 | `node --test validate` | P0 |
| TC-019 | V11①；§5.1 未知 key | 单元 | 负 | 机器 | `node --test validate` | P0 |
| TC-020 | V11②；§5.1 未闭合 | 单元 | 负 | 机器 | `node --test validate` | P0 |
| TC-021 | §5.1 空 key / 表达式 / 嵌套 | 单元 | 负 | 机器 | `node --test validate` | P1 |
| TC-022 | §5.1 line 计算；§6.1 步3「CR 不单独成行」 | 单元 | 负 | 机器 | `node --test validate` / `compare` | P1 |
| TC-023 | V2；§6.1（**精确 `line`/`byte` + 内容源指引**） | e2e | 负 | 机器 | `node --test cli`（内部 spawn `run.mjs --case V2`） | P0 |
| TC-024 | §6.1 步2/3（首字节、前缀） | 单元 | 负 | 机器 | `node --test compare` | P1 |
| TC-025 | V2b；R8（generated 不做环境预检） | e2e | 负 | 机器 | `run.mjs --case V2b` | P0 |
| TC-026 | V8；§6.2 步2；R8 输入角色 | e2e | 负 | 机器 | `run.mjs --case V8` | P0 |
| TC-027 | V8；§6.2 步1 | e2e | 负 | 机器 | `run.mjs --case V8` | P0 |
| TC-028 | §6.2 步3 非法 UTF-8 | 单元 | 负 | 机器 | `node --test compare` | P1 |
| TC-029 | R8 第三输入角色（baseline） | 单元 | 负 | 机器 | `node --test compare` | P1 |
| TC-030 | §6.2 判定顺序 | 单元 | 负 | 机器 | `node --test compare` | P1 |
| TC-031 | V7 前置；R14（--baseline 副本）；R7 后置 | e2e | 正 | 机器 | `run.mjs --case V7` | P0 |
| TC-032 | R5；R4 字典序；§4.2 | 单元 | 正 | 机器 | `node --test baseline` | P0 |
| TC-033 | V7；§6.3 步1（空数组/重复/损坏/缺失） | 单元 | 负 | 机器 | `node --test baseline` | P0 |
| TC-034 | V7；§6.3 步4；R5 | 单元 | 负 | 机器 | `node --test baseline` | P0 |
| TC-035 | V7；§6.3 步2（`..`、反斜杠、非 rules） | 单元 | 负 | 机器 | `node --test baseline` | P0 |
| TC-036 | V7；§6.3 步3 | 单元 | 负 | 机器 | `node --test baseline` | P0 |
| TC-037 | R5 + R9 交互（乱序 → 漂移而非结构错） | 单元 | 负 | 机器 | `node --test baseline` | P1 |
| TC-038 | R9 步1 先于步2 | 单元 | 负 | 机器 | `node --test baseline` | P0 |
| TC-039 | R9 步3 先于步4 | 单元 | 负 | 机器 | `node --test baseline` | P0 |
| TC-040 | R9 步4 先于步5 | 单元 | 负 | 机器 | `node --test baseline` | P0 |
| TC-041 | V4；§6.3 步5（含可操作指引）；§7.4 **唯一名 `tmp-new-rule-V4.md`**；R11 finally | e2e | 负 | 机器 | `run.mjs --case V4` | P0 |
| TC-042 | V11④；§7.1 `--out` 越界 + **`ROOT` 定义** + R10 退出码 2 | 单元 | 负 | 机器 | `node --test cli` | P0 |
| TC-043 | V11⑥；§5 表 WriteFailed | 单元 | 负 | 机器 | `node --test cli` | P1 |
| TC-044 | V11⑤；§7.2 步③ | 单元 | 负 | 机器 | `node --test cli` | P0 |
| TC-045 | V11③；§7.1 `--compare <path>`（只接受 `.tmp-test/**`）；§6.1 `GeneratedMissing`；逐码表（→3） | 单元 | 负 | 机器 | `node --test cli` | P0 |
| TC-046 | §7.1 --out 白名单（前缀绕过 + `..` 穿越 + **`ROOT` 定义负例与正对照**） | 单元 | 负 | 机器 | `node --test cli` | P0 |
| TC-047 | §7.1 --out（Windows 分隔符） | 单元 | 负 | 机器 | `node --test cli` | P1 |
| TC-048 | R14（三个输入覆盖参数越界）；§7.1 `InvalidInputPath` + **逐码表（→2）** + R10 退出码 2；R7 | 单元 | 负 | 机器 | `node --test cli` | P0 |
| TC-049 | V10b 后半；R6 步⑦；§7.2（接线 + 嵌套 check 显式 `t.skip()`）；§7.3「只由 `run.mjs` 编排」+ V10b 行「计入全量 13」；§7.1 枚举（`V10b` 是合法值） | e2e | 正 | 机器 | `run.mjs --case V10b`（内部跑一次 `npm run check`；无 `*.test.mjs` 包装，被包装时须在 `DOCGEN_CHECK_ACTIVE=1` 下显式 skip；本条是 owner，不带 `--no-clean`） | P0 |
| TC-050 | V10；§7.2 接线 + 防自递归；§7.4 **唯一名 `tmp-new-rule-V10.md`**；R11 | e2e | 负 | 机器 | `run.mjs --case V10`（内部跑一次 `npm run check`） | P0 |
| TC-051 | V10b 前半；R6（比对能力）；§7.2（`DOCGEN_CHECK_ACTIVE=1` 显式 `t.skip()`）；§7.3（副本由该例启动后自建）；§7.4（测试内 spawn 带 `--no-clean`）；§7.1 断言模式（本例期望的 `Mismatch` → `PASS V10b` + exit 0） | e2e | 负 | 机器 | `run.mjs --case V10b --no-clean`（前半；`cli.test.mjs` 内带嵌套 skip 选项） | P0 |
| TC-052 | R6（基线能力，不假绿）；§7.3（副本由该例启动后自建）；§7.4（测试内 spawn 带 `--no-clean`）；§7.1 断言模式（`BaselineDrift` 是 V7 的期望 → `PASS V7` + exit 0） | e2e | 负 | 机器 | `run.mjs --case V7 --no-clean` | P0 |
| TC-053 | R10 退出码 1 | 单元 | 负 | 机器 | `node --test cli` | P1 |
| TC-054 | R10 退出码 2 | 单元 | 负 | 机器 | `node --test cli` | P0 |
| TC-055 | R10 退出码 3 | 单元 | 负 | 机器 | `node --test cli` | P0 |
| TC-056 | §7.1 --raw | 单元 | 负 | 机器 | `node --test cli` | P1 |
| TC-057 | R11 启动清理；§5.4 **哨兵常量 `SENTINEL_V4` / `SENTINEL_V10`（从 `specTestCaseGate.mjs` 导出）**；§7.4 **哨兵自愈（精确串 / 近失串 / 非哨兵三种内容）**；§7.2（已列入 skip 清单）；§7.3（ROOT 残片预置的唯一明文例外）；fail-closed | e2e | 负 | 机器 | `run.mjs --case V1`（`cli.test.mjs` 内；本条是 owner，spawn **不带** `--no-clean`；嵌套 check 时按 §7.2 显式 skip） | P0 |
| TC-058 | V9；R4；R11；§7.4 **退出钩子删 `.tmp-test/`**；**`.gitignore` 生效（`git check-ignore`）** | e2e | 正 | 机器 | Node 驱动：`execFileSync` 跑两遍 `run.mjs`，stdout **内存**比对 | P0 |
| TC-059 | R12 双哈希常量 | 单元 | 正 | 机器 | `node --test baseline` | P0 |
| TC-060 | R13 零第三方依赖；§5.5 纯模块无 `child_process` | 单元 | 负 | 机器 | `node --test cli` | P1 |
| TC-061 | R7 + R12 全局后置（目标不被改写） | e2e | 负 | 机器 | 全部用例后置 | P0 |
| TC-062 | §7.1 --case 语义（单值 / 省略 = **13** 例：V1–V11 + V2b + V10b） | e2e | 负 | 机器 | `run.mjs`（`--case V1` 段可在 `cli.test.mjs`；全量段由独立 Node 驱动跑，不进 `*.test.mjs`） | P1 |
| TC-063 | §7.1 **四模式互斥**（gate / case / write-baseline / compare）+ 枚举白名单（`V1..V11\|V2b\|V10b`）；R10 退出码 2 | 单元 | 负 | 机器 | `node --test cli` | P0 |
| TC-064 | §4.3 fixture 非 JSON / 读取失败 → exit 3（§4.3 不分配码名；§7.1 **逐码表第 3 行**）；R10 | 单元 | 负 | 机器 | `node --test cli` | P0 |
| TC-065 | §7.1 realpathSync 复判（对**最近的已存在祖先**执行；junction / symlink 绕过）+ 退出码 2；§7.3（预置副本须带 `--no-clean` + spawn 前断言存在）；R14 | e2e | 负 | 机器（可构造时必测；建不了链接留 1 条显式 skip 转 §5 人工） | `node --test cli` | P0 |
| TC-066 | R15 施工顺序可观测后果；R12；§3.1 `.gitattributes` | 集成 | 正 | 机器 | `node --test cli` | P0 |
| TC-067 | §7.2「**防自递归**」（`*.test.mjs` 禁调 `npm run check` / `check-all.mjs`）+ `DOCGEN_CHECK_ACTIVE=1` 哨兵 | 单元 | 负 | 机器 | `node --test cli` | P0 |
| TC-068 | §7.1 `TargetReadFailed`（`--target` 读失败，exit 3）+ **断言模式与前置错误（条件式）**：`TargetReadFailed` 不是 V1 的期望 → 用它自己的退出码 3（只有当该码正是本例期望时才 `PASS V<n>` + exit 0）；§7.2 步① 先于步③；R10 退出码 3 | 单元 | 负 | 机器 | `node --test cli`（内部 spawn `run.mjs --case V1 --target <ROOT 内缺失> --no-clean`） | P0 |
| TC-069 | §7.2 步③.5 `assertTemplateClean`（gate 也查模板硬编码）；§5.4；§7.1 逐码表 `TemplateHardcoded` → 1；§7.3（非 `--case` 模式的副本可预置：先建 → 断言存在 → 带 `--no-clean` spawn）/§7.4 | e2e | 负 | 机器 | `run.mjs --gate --template <target 全文副本> --no-clean` | P0 |
| TC-070 | §7.1 `--write-baseline`（只写 baseline、不碰 target/template）；§7.2（嵌套 check 显式 `t.skip()`）；§7.3 末段正例；§7.4 唯一名；R5 | e2e | 正 | 机器 | `run.mjs --write-baseline` + `run.mjs --gate`（`cli.test.mjs` 内带嵌套 skip 选项） | P1 |
| TC-071 | §7.1 **四模式互斥**（`--write-baseline` × `--gate` / `--case` / `--compare`）+ `--write-baseline` × `--baseline` → exit 2 且 baseline 一个字节不写 | 单元 | 负 | 机器 | `node --test cli` | P1 |

**错误码覆盖矩阵**（spec §5、§7.3 与 §7.1 共 **19** 个，全部有落点；第 5 轮新增 `TargetReadFailed`，第 2 轮新增 `InvalidInputPath`）：

| 错误码 | 覆盖用例 | 错误码 | 覆盖用例 |
|---|---|---|---|
| MissingSlot | TC-007、TC-008、TC-009、TC-010、TC-011、TC-015 | InvalidBaseline | TC-033、TC-038 |
| MissingPlaceholder | TC-019 | InvalidBaselinePath | TC-035、TC-038 |
| InvalidRuleType | TC-012、TC-013 | DanglingBaselineEntry | TC-036、TC-039 |
| TemplateSyntaxError | TC-020、TC-021、TC-022 | BaselineDrift | TC-034、TC-037、TC-040、TC-052 |
| TemplateHardcoded | TC-018（单元）、**TC-069（gate e2e）** | GeneratedMissing | TC-045（`--compare`） |
| ImpureRender | TC-016 | InvalidOutputPath | TC-042、TC-046、TC-065 |
| UnregisteredHandwritten | TC-041、TC-050、TC-057 | TemplateReadFailed | TC-044、TC-055 |
| Mismatch | TC-023、TC-024、TC-025、TC-051 | WriteFailed | TC-043 |
| EnvironmentEOL | TC-026、TC-027、TC-028、TC-029、TC-030、TC-054 | InvalidInputPath | TC-048 |
| **TargetReadFailed** | **TC-068** | | |

**退出码覆盖矩阵**（R10 + §7.1 逐码映射表；第 4 轮起以逐码表为准，R10 只作为四档语义）：

| 退出码 | 含义 | 覆盖用例 |
|---|---|---|
| 0 | 全绿 / 本例期望命中（§7.1「断言模式与前置错误」的另一半） | TC-001、TC-049、TC-058、TC-070（`--write-baseline` 后 gate 绿）、**TC-051（V10b 前半的 `Mismatch` 是期望 → `PASS V10b` + 0）**、**TC-052（V7 的 `BaselineDrift` 是期望 → `PASS V7` + 0）** |
| 1 | 校验 / 比对类（`MissingSlot`、`MissingPlaceholder`、`InvalidRuleType`、`TemplateSyntaxError`、`TemplateHardcoded`、`ImpureRender`、`Mismatch`） | TC-053、TC-069（`TemplateHardcoded`） |
| 2 | baseline / 环境 / 路径越界（含 §7.1 两个路径码与路径越界）+ 模式互斥 | TC-042、TC-046、TC-048、TC-054、TC-056、TC-057、TC-063、TC-065、TC-071 |
| 3 | IO / 依赖（`GeneratedMissing`、`TemplateReadFailed`、`TargetReadFailed`、`WriteFailed`、fixture 读取/解析失败） | TC-045（`GeneratedMissing`）、TC-055、TC-064、TC-068（`TargetReadFailed`） |

**覆盖核对**：spec 验收锚点共 11 组（V1–V11；其中 V2b、V10b 为 V2、V10 的子锚点）；本表覆盖 11/11（V2b 由 TC-025 显式 `--case V2b` 覆盖，V10b 由 TC-049/TC-051 覆盖）。核心决定 R1–R15 覆盖 15/15（R15 由 TC-066 以「顺序造成的可观测后果」覆盖，顺序本身仍由 plan 的 Task 顺序保证，见 §7.1）。错误码 **19/19**（第 5 轮新增 `TargetReadFailed` → TC-068）。用例总数 **71** 条：正例 **13** / 负例与边界 **58**（负 ≥ 正；§3 表 59 行，多出的一行是 TC-070 的边界形态，该例在 §1 计为正例）。**第 8 轮口径**：省略 `--case` 的全量 = V1–V11 + V2b + V10b = **13 例**（§7.1 已定，TC-062 精确断言 `13/13` 与 13 行 `PASS V<n>`；V10b 计入该总数，`--case V10b` 也是 §7.1 枚举里的合法值）。未覆盖项：spec §10（P2 才撞上的六骨架模板分裂）与 §9（不在这一轮）——理由见 §6；spec §8「只手动验证」一项——见 §5。`--write-baseline` 按 spec §7.3 末段**不新增 V 编号**，由本表 TC-070/TC-071（testcase 的「§7.1 > write-baseline」两条）覆盖。

## 2 用例明细

### TC-001 默认数据内存渲染 → 与 target 逐字节一致且打印 baseline 21/21

- **覆盖**：`V1`（spec §7.3 行 V1）；`R6 步⑤⑥`；PRD §6 V1
- **前置**：干净树；`rules/` 恰 21 个 `.md`（实测当前为 21 个，见 `rules/` 目录）；`tools/docgen-spike/.tmp-test/` 不存在；`rules/tmp-new-rule-V4.md` 与 `rules/tmp-new-rule-V10.md` 均不存在（§7.4 唯一名）
- **步骤**：① `node tools/docgen-spike/run.mjs --case V1`；② 同批取 target 的 `git hash-object` 与 SHA256；③ `git status --short tools/docgen-spike/`
- **预期**：退出码 0；stdout 含 `PASS V1` 与 `baseline 21/21`；②的两个值与 spec §4.4 常量相等；③输出为空（V1 不写盘）
- **判据**：`node tools/docgen-spike/run.mjs --case V1` 退出码 0 且 stdout 同时匹配 `/PASS V1/`、`/baseline 21\/21/`；`git status --short tools/docgen-spike/` 退出码 0 且输出 0 行
- **红绿证据**：红 = plan 未落地时该命令报 `Cannot find module ...run.mjs`（退出码 1）；绿 = 落地后同一命令退出码 0 且两段正则命中
- **对应测试**：`tools/docgen-spike/run.mjs::V1`（待 plan Task N）
- **不覆盖**：不证明模板只含结构（TC-018 管）、不证明 render 未读 target（TC-016 管）——字节相等可被「模板抄全文」与「render 直接读 target」两种作弊同时骗过

### TC-002 渲染结果的结构格式 → 节间一空行、四要素四行、判据表三列、末尾恰好一个换行

- **覆盖**：`§5.2`（**9 个 H2** 的结构与顺序）；`R3`；`R4`
- **前置**：`buildData()` 默认数据；`rule.md.tpl` 为仓库内版本
- **步骤**：① 在内存调用 `render(buildData(), readFileSync(tpl,'utf8'))`；② 用 `/^## .*$/gm` 抽出全部 H2 标题，与下面的有序数组逐项比对；③ 按 `\n` 切分逐节检查；④ 检查文件末尾字节
- **预期**：**9 个 H2** 按 §5.2 顺序出现（§5.2 原文：「本模板共 **9 个 H2**：核心判据 + 其余 8 个；与 target 一致（PRD P1-5 的『另有 8 个』是『除核心判据外还有 8 个』，合计 9）」）。标题序列必须**逐项等于**该有序数组：
  1. `## 四要素声明`
  2. `## 核心判据`
  3. `## 正例 / 反例`
  4. `## 为什么`
  5. `## 适用范围（不因来源豁免）`
  6. `## 冲突裁决`
  7. `## 例外`
  8. `## 触发时机`
  9. `## 验证`

  节标题之间恰好 1 个空行；`fourElements` 展开为 4 行且顺序为 范围/条件/动作/宾语；判据表首行 `| # | 判据 | 怎么算合格 |` 后接分隔行，每条判据一行 `| <no> | **<name>** | <pass> |`；末尾字节序列恰为单个 `0x0A`（倒数第二字节不是 `0x0A`）；**H2 数量恰为 9**（8 与 10 都判红）
- **判据**：`node --test tools/docgen-spike/test/validate.test.mjs` 退出码 0 且 `# fail 0`；断言 `V1 > 结构格式` 通过，其内部为 `assert.deepStrictEqual(rendered.match(/^## .*$/gm), EXPECTED_H2S)`（`EXPECTED_H2S` 即上面 9 项有序数组）+ `assert.strictEqual(h2s.length, 9)` + 逐节空行/表格/四要素/尾换行的 `assert`
- **红绿证据**：红① = 应用 `MUT-08`（把 `{{...}}` 替换改成 `String.replaceAll`，模板中的空行与顺序不再受控）→ 本用例 FAIL；红② = 应用 `MUT-77`（模板漏掉 `## 例外`，只剩 8 个 H2）→ 数组长度 8、逐项比对在第 7 位起错位，本用例 FAIL——这正是第 1 轮 F1 的形态：口径写成 8 时本用例会红，写成 9 才与 target 和 V1 逐字节一致；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/validate.test.mjs::V1 > 结构格式`（待 plan Task N）
- **不覆盖**：不判「每个节的内容是否忠实于 target」（那由 TC-001 的逐字节比对兜）；不判标题文案是否业务正确；不判 H1（`# {{title}}` 由 TC-001 与 TC-004 兜）

### TC-003 同一数据渲染两遍 → 输出逐字节相同（无时间戳、无随机、无环境依赖）

- **覆盖**：`R4`；`V1`（两遍一致是 V1 的前提）
- **前置**：默认数据；模板取仓库内版本；进程 A 与进程 B 分别启动（不同 PID、不同 cwd 之外的一切相同）
- **步骤**：① 进程 A 渲染一次并写 `.tmp-test/TC-003/a.md`；② 进程 B 渲染一次写 `b.md`；③ 用 `Buffer.compare` 比 a/b
- **预期**：`Buffer.compare` 为 0；两份文件都不含 `0x0D`、都不以 `EF BB BF` 开头；a/b 的 mtime 不影响内容
- **判据**：`node --test tools/docgen-spike/test/validate.test.mjs` 退出码 0；断言 `V1 > 两遍逐字节一致` 通过（内部 `assert.strictEqual(Buffer.compare(a,b),0)` 且 `assert.ok(!a.includes(0x0d))`）
- **红绿证据**：红 = 应用 `MUT-09`（render 把 `new Date().toISOString()` 拼进 `sourceLine`）→ 两遍字节不同，本用例 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/validate.test.mjs::V1 > 两遍逐字节一致`（待 plan Task N）
- **不覆盖**：不覆盖跨操作系统（CRLF checkout）差异——那由 `.gitattributes` 与 TC-026 管

### TC-004 合法 fixture 浅覆盖 + 同一占位符多次出现 → 均替换且其余字段不受影响

- **覆盖**：`§4.3`；`§5.1`
- **前置**：`fixture.json` 内容 `{ "polarity": "prohibition" }`；模板中人为放两个 `{{title}}`（用 `.tmp-test/TC-004/tpl.tpl` 副本，不动真模板）
- **步骤**：① 用 fixture 浅覆盖后取 `data.polarity` 与 `data.title`；② 用副本模板渲染；③ 统计渲染结果中 title 原文出现次数
- **预期**：`data.polarity === 'prohibition'`；`data.title` 与默认 data 的 title 相同（浅覆盖不连带改其它键）；渲染结果中 title 原文出现 2 次
- **判据**：`node --test tools/docgen-spike/test/validate.test.mjs` 退出码 0；断言 `V5 > fixture 浅覆盖` 与 `§5.1 > 同 key 多现` 均通过
- **红绿证据**：红 = 应用 `MUT-10`（fixture 改为深合并并把未给的键置空）→ `data.title` 变空串，本用例 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/validate.test.mjs::V5 > fixture 浅覆盖`（待 plan Task N）
- **不覆盖**：不覆盖非法 fixture 键（TC-014）与嵌套部分覆盖（TC-015）

### TC-005 真实 render 在 fs 探针下 → 不产生任何 target 读取（R1 正面对照）

- **覆盖**：`R1`；`§5.5`；`V6①`（正面对照）
- **前置**：默认数据；仓库内模板
- **步骤**：① 用 `withReadProbe(fn, [target])` 包住 `render(data, template)`；② 检查是否抛 `ImpureRender`；③ 静态检查组件模块源码
- **预期**：① 不抛异常，正常返回字符串；② 探针记录的读取路径集合为空；③ `specTestCaseGate.mjs` 源码不出现 `node:fs` 导入（`grep -c "node:fs"` 为 0）
- **判据**：`node --test tools/docgen-spike/test/validate.test.mjs` 退出码 0；断言 `V6 > render 不读 target` 通过；另跑 `node -e "..."` 版 grep 退出码 1（无匹配）
- **红绿证据**：红 = 应用 `MUT-56`（真实 render 改成 `readFileSync(target)` 并直接返回其内容）→ 本用例 FAIL（探针记录的读取路径非空）；绿 = 撤掉 `MUT-56` 后 PASS。注意此时 TC-001 仍绿——这正是本条必须与 TC-001 成对存在的原因
- **对应测试**：`tools/docgen-spike/test/validate.test.mjs::V6 > render 不读 target`（待 plan Task N）
- **不覆盖**：不覆盖探针 API 面之外的读取（`createReadStream` / `fs.promises.open` / `child_process`）——见 §7.1「fs 探针的 API 面」行

### TC-006 数据里增删一条判据 → 输出同步增删，其余字节不变

- **覆盖**：`V6③`；`R3` 数据驱动
- **前置**：默认数据克隆两份：一份删除第 3 条判据，一份在其后插入一条 `{no:6,name:'<测试判据>',pass:'<测试值>'}`
- **步骤**：① 分别渲染两份数据；② 对两份输出做行级 diff（对默认输出）；③ 统计判据表数据行数
- **预期**：删除版少 1 行数据行、插入版多 1 行；两版 diff 行数都恰为 1 行增减（无连带改写）；默认版数据行数 = 5
- **判据**：`node tools/docgen-spike/run.mjs --case V6` 退出码 0，stdout 含 `PASS V6`；`node --test tools/docgen-spike/test/validate.test.mjs` 断言 `V6 > 增删一条判据` 通过
- **红绿证据**：红 = 应用 `MUT-11`（判据表改为常量字符串，不读数据）→ 增删都不改变输出，本用例 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/validate.test.mjs::V6 > 增删一条判据`（待 plan Task N）
- **不覆盖**：不覆盖模板中 per-criterion 行级循环（R3 禁止块级语法，模板不允许出现循环）

### TC-007 第 3 条判据的 pass 置空串 / 纯空白 / `TODO` → MissingSlot 且 slot 指向该格

- **覆盖**：`V3`；`§5.3 步4`
- **前置**：克隆 `buildData()`，按 **`name` 内容**定位第 3 条判据（目标规则第 3 条为「用例合格」），不用行号
- **步骤**：① 依次把该格置 `''`、`'   '`、`'TODO'`；② 每次调用 `validateData()`；③ 检查是否产生输出文件
- **预期**：三次都返回 `{ code: 'MissingSlot', slot: 'criteria.用例合格.pass' }`（若实现取列原文作 name，则 slot 以 `criteria.` 开头、以 `.pass` 结尾、中段含 `用例合格`）；不产生任何输出文件
- **判据**：`node tools/docgen-spike/run.mjs --case V3` 退出码 0 且 stdout 含 `PASS V3`；`node --test validate` 断言 `V3 > pass 为空串`、`V3 > pass 为空格`、`V3 > pass 为 TODO` 三条均通过；`assert.strictEqual(fs.existsSync('tools/docgen-spike/.tmp-test/V3'), false)`（不用 `test -d`，见 §0 断言工具约定）
- **红绿证据**：红 = 应用 `MUT-01`（去掉 `trim()` 判定）→ `'   '` 那条 FAIL；再应用 `MUT-02`（去掉 `TODO` 判定）→ `'TODO'` 那条 FAIL；绿 = 撤掉 MUT 后三条全 PASS
- **对应测试**：`tools/docgen-spike/test/validate.test.mjs::V3 > pass 为空串`（待 plan Task N）
- **不覆盖**：不覆盖其它字段的空值（TC-009/TC-011）；不判错误消息文案

### TC-008 pass 为制表符与全角空格组成的纯空白 → 仍判 MissingSlot（非 ASCII 空白边界）

- **覆盖**：`§5.3 步2/步4` 的「纯空白」边界；`V3`
- **前置**：同上，按 name 定位第 3 条判据的 `pass`
- **步骤**：① 置 `'\t\n'`；② 置 `'\u3000'`（全角空格）；③ 各调一次 `validateData()`
- **预期**：两次都返回 `MissingSlot`，slot 指向该格；不得被当成合法内容
- **判据**：`node --test tools/docgen-spike/test/validate.test.mjs` 退出码 0；断言 `V3 > pass 为制表符` 与 `V3 > pass 为全角空格` 通过
- **红绿证据**：红 = 应用 `MUT-01`（空值判断写成 `value === ''`，不做 trim）→ 两条都 FAIL；绿 = 用 `value.trim() === ''` 后 PASS
- **对应测试**：`tools/docgen-spike/test/validate.test.mjs::V3 > pass 为制表符`（待 plan Task N）
- **不覆盖**：不覆盖含 NBSP（`\u00A0`）的情形——spec 未点名，本文件不预设；若要固定其归属，需 spec 在 §5.3「纯空白」处补一句

### TC-009 fourElements.scope 为空串 → MissingSlot 且 slot 带 `fourElements.` 前缀

- **覆盖**：`§5.3 步3`；`§4.1 fourElements`
- **前置**：克隆默认数据
- **步骤**：① 置 `data.fourElements.scope = ''`；② 调 `validateData()`；③ 依次改 `condition`、`action`、`object` 各置 `'   '`
- **预期**：四次分别返回 `MissingSlot`，slot 分别为 `fourElements.scope`、`fourElements.condition`、`fourElements.action`、`fourElements.object`
- **判据**：`node --test tools/docgen-spike/test/validate.test.mjs` 退出码 0；断言 `V3 > fourElements 四格` 通过（四条 assertion 均绿）
- **红绿证据**：红 = 应用 `MUT-12`（slot 名写成 `fourElements`，不带子键）→ 本用例 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/validate.test.mjs::V3 > fourElements 四格`（待 plan Task N）
- **不覆盖**：不覆盖「slot 名与 PRD §4.1 的 `<section>.<条目>.<列>` 全量对齐」——只在四要素与判据两处取样

### TC-010 criteria 为空数组 / 行内 name 与 pass 同时为空 → slot 用 index 形态

- **覆盖**：`§5.3 步4`（空数组与 index 兜底）
- **前置**：克隆默认数据
- **步骤**：① 置 `data.criteria = []`；② 恢复后把第 2 条的 `name` 与 `pass` 同时置 `''`；③ 各调 `validateData()`
- **预期**：① 返回 `MissingSlot`，slot 恰为 `criteria`；② 返回 `MissingSlot`，slot 为 `criteria.1.pass`（0/1 起由实现定，判据只要求形态为 `criteria.<整数>.pass`）
- **判据**：`node --test tools/docgen-spike/test/validate.test.mjs` 退出码 0；断言 `V3 > criteria 空数组`（`slot === 'criteria'`）与 `V3 > name 也空时用 index`（`/^criteria\.\d+\.pass$/`）通过
- **红绿证据**：红 = 应用 `MUT-03`（删除 `criteria.length === 0` 检查）→ ① FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/validate.test.mjs::V3 > criteria 空数组`（待 plan Task N）
- **不覆盖**：不覆盖 index 从 0 还是 1 起（spec 未定，本文件只校验形态 `criteria.<整数>.pass`）

### TC-011 examples / trigger / verification 的空数组与空条目 → 各自 slot

- **覆盖**：`§5.3 步5`
- **前置**：克隆默认数据
- **步骤**：① 依次置 `examples.positive=[]`、`examples.negative=[]`、`trigger=[]`、`verification=[]` 各调一次；② 恢复后置 `trigger[1]=''`、`examples.positive[0]='   '` 各调一次
- **预期**：六次都返回 `MissingSlot`；字段级空数组的 slot 分别为 `examples.positive`、`examples.negative`、`trigger`、`verification`；条目级为 `trigger.1`、`examples.positive.0`（数字段只校验形态）
- **判据**：`node --test tools/docgen-spike/test/validate.test.mjs` 退出码 0；断言 `V3 > 三段空数组` 与 `V3 > 条目为空` 通过
- **红绿证据**：红 = 应用 `MUT-13`（只校验 `criteria`，跳过步5）→ 六条全 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/validate.test.mjs::V3 > 三段空数组`（待 plan Task N）
- **不覆盖**：不覆盖 `verification` 只有 1 段时是否合法（spec 只要求非空）

### TC-012 非法规则类型三变体 → InvalidRuleType 且 field / value 均非空

- **覆盖**：`§5.3 步1`；`V5`；PRD §3 P1-1 值集
- **前置**：三个 fixture 副本：`{"polarity":"ban"}`、`{"applicability":"sometimes"}`、默认数据但删掉 `applicability` 键
- **步骤**：① 分别浅覆盖后调 `validateData()`；② 检查返回码与两个字段；③ 检查 `value` 字段是否出现
- **预期**：三次都返回 `InvalidRuleType`；① `field='polarity'`、`value='ban'`；② `field='applicability'`、`value='sometimes'`；③ `field='applicability'` 且返回对象上存在 `value` 键（缺失输入时其取值形态由实现定，但键必须在）
- **判据**：`node tools/docgen-spike/run.mjs --case V5` 退出码 0 且 stdout 含 `PASS V5`；`node --test validate` 断言 `V5 > polarity 非法`、`V5 > applicability 非法`、`V5 > applicability 缺失` 通过
- **红绿证据**：红 = 应用 `MUT-04`（删掉枚举校验）→ 三条全 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/validate.test.mjs::V5 > polarity 非法`（待 plan Task N）
- **不覆盖**：不覆盖六种合法组合的骨架（P2，spec §9）；不覆盖 `value` 字段在「缺失」时的具体取值

### TC-013 validateData 的固定判定顺序 → 只报第一个错误

- **覆盖**：`§5.3` 固定顺序；`R9` 同族（顺序决定期望）
- **前置**：克隆默认数据并同时注入两个错误
- **步骤**：① 注入 `polarity='ban'` + `title=''`；② 注入 `title=''` + `fourElements.scope=''`；③ 各调一次
- **预期**：① 只报 `InvalidRuleType`（步1 先于步2），不得报 `MissingSlot`；② 只报 `MissingSlot` 且 `slot='title'`（步2 先于步3），不得报 `fourElements.scope`
- **判据**：`node --test tools/docgen-spike/test/validate.test.mjs` 退出码 0；断言 `V3 > 顺序 类型优先` 与 `V3 > 顺序 title 优先` 通过（两条都断言 `code` 严格等于期望值）
- **红绿证据**：红 = 应用 `MUT-05`（交换步1 与步2）→ ① FAIL；绿 = 恢复顺序后 PASS
- **对应测试**：`tools/docgen-spike/test/validate.test.mjs::V3 > 顺序 类型优先`（待 plan Task N）
- **不覆盖**：不覆盖步2 与步3 之间的其它子字段顺序（同一码内 slot 取舍 spec 未定，本文件只判 `slot` 具体值已由 spec 写明的字段）

### TC-014 fixture 含未声明键 → 抛 Error 且不产出任何产品错误码

- **覆盖**：`§4.3`（未知键直接抛 `Error`，用例自身缺陷不走产品错误码）
- **前置**：fixture 副本 `{ "noSuchKey": 1 }`
- **步骤**：① 加载 fixture 并浅覆盖；② 捕获抛出的异常；③ 检查异常类型与消息
- **预期**：抛出的是 `Error`（非产品错误对象）；消息含未声明键名 `noSuchKey`；不得返回 `{ code: 'MissingSlot' }` 等产品码
- **判据**：`node --test tools/docgen-spike/test/validate.test.mjs` 退出码 0；断言 `V5 > fixture 未知键` 通过（`assert.throws(..., /noSuchKey/)` 且断言返回值无 `code` 字段）
- **红绿证据**：红 = 应用 `MUT-14`（未知键静默忽略）→ 不抛异常，本用例 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/validate.test.mjs::V5 > fixture 未知键`（待 plan Task N）
- **不覆盖**：不覆盖 fixture 语法错误（非 JSON）与文件不存在时的退出码——spec §4.3 已定为 exit 3，由 TC-064 覆盖

### TC-015 fixture 对嵌套对象做部分覆盖 → 兄弟字段因整块替换而报 MissingSlot

- **覆盖**：`§4.3`「只做顶层浅覆盖」
- **前置**：fixture 副本 `{ "fourElements": { "scope": "x" } }`
- **步骤**：① 浅覆盖；② 调 `validateData()`；③ 检查错误 slot
- **预期**：返回 `MissingSlot`，slot 为 `fourElements.condition`（或 action/object 中实现按固定顺序先查到的那个）；不得因 fixture 只给 scope 就判定整块合法
- **判据**：`node --test tools/docgen-spike/test/validate.test.mjs` 退出码 0；断言 `V5 > fixture 嵌套部分覆盖` 通过（`code==='MissingSlot'` 且 `slot` 以 `fourElements.` 开头）
- **红绿证据**：红 = 应用 `MUT-10`（fixture 改深合并）→ 不报错，本用例 FAIL；绿 = 保持浅覆盖后 PASS
- **对应测试**：`tools/docgen-spike/test/validate.test.mjs::V5 > fixture 嵌套部分覆盖`（待 plan Task N）
- **不覆盖**：不判这种语义对使用者是否友好——spec §4.3 已把「嵌套须给全子键」写明（§8 建议 6 主体已落地），「反直觉」本身仍属体验判断

### TC-016 故意读 target 的 render 替身 → ImpureRender 且 path 指向 target

- **覆盖**：`V6①`；`§5.5`；`R1`
- **前置**：在 `.tmp-test/TC-016/impureStub.mjs` 写一个 `render(data)`，内部 `readFileSync(target)` 并返回其内容
- **步骤**：① 用 `withReadProbe(stub, [target])` 调用；② 捕获异常；③ 检查 `code` 与 `path`
- **预期**：抛 `ImpureRender`；`path` 等于 target 的路径（可解析后比较）；不得返回字符串
- **判据**：`node --test tools/docgen-spike/test/validate.test.mjs` 退出码 0；断言 `V6 > 读 target 的替身被拦` 通过（`assert.throws` 后断言 `code==='ImpureRender'` 且 `path.resolve(err.path)===path.resolve(target)`）
- **红绿证据**：红 = 应用 `MUT-07`（探针换空实现）→ 替身正常返回，本用例 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/validate.test.mjs::V6 > 读 target 的替身被拦`（待 plan Task N）
- **不覆盖**：不覆盖探针之外的读数通道（见 §7.1「fs 探针的 API 面」行）

### TC-017 探针抛错后恢复原函数 → 后续文件读取仍正常

- **覆盖**：`§5.5`「`finally` 恢复原函数」
- **前置**：同 TC-016 的替身
- **步骤**：① 触发一次 `ImpureRender`；② 在 catch 之后调用 `readFileSync(templatePath,'utf8')`；③ 比较 `fs.readFileSync` 与探针安装前的引用
- **预期**：②能正常读到模板内容（长度 > 0）；③为同一函数引用（`===`）
- **判据**：`node --test tools/docgen-spike/test/validate.test.mjs` 退出码 0；断言 `V6 > 探针恢复` 通过
- **红绿证据**：红 = 应用 `MUT-15`（去掉 `finally` 里的恢复语句）→ ②读到探针包装版本、③不等，本用例 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/validate.test.mjs::V6 > 探针恢复`（待 plan Task N）
- **不覆盖**：不覆盖并发场景下两处同时装探针（spec 未要求并发）

### TC-018 模板含 target 的 3 段特征串之一 → TemplateHardcoded 且 snippet 非空

- **覆盖**：`V6②`；`§5.4`；`R2`
- **前置**：`.tmp-test/TC-018/tpl-hardcoded.tpl` = 真模板 + 抄进一段 ≥20 字的 target 原文
- **步骤**：① 对该副本调 `assertTemplateClean()`；② 检查返回码与 `snippet`；③ 对真模板再调一次
- **预期**：①返回 `TemplateHardcoded`，`snippet` 恰为命中的那段特征串（长度 ≥20）；③真模板不报错
- **判据**：`node tools/docgen-spike/run.mjs --case V6` 退出码 0 且 stdout 含 `PASS V6`；`node --test validate` 断言 `V6 > 模板硬编码被拦` 与 `V6 > 真模板干净` 通过
- **红绿证据**：红 = 应用 `MUT-06`（删掉 `assertTemplateClean` 调用）→ ①不报错，本用例 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/validate.test.mjs::V6 > 模板硬编码被拦`（待 plan Task N）
- **不覆盖**：不覆盖 <20 字但业务化的原文（3 段签名抓不到），见 §5 与 §7.1「模板『无业务原文』的完全性」行

### TC-019 模板出现未知占位符 → MissingPlaceholder 且 key 为原文

- **覆盖**：`V11①`；`§5.1` 未知 key
- **前置**：`.tmp-test/TC-019/tpl.tpl` = 真模板 + 一行 `{{unknownKey}}`
- **步骤**：① 对副本调 `render(buildData(), tplText)`；② 捕获异常；③ 检查 `key`
- **预期**：抛 `MissingPlaceholder`；`key === 'unknownKey'`；不返回部分渲染结果
- **判据**：`node tools/docgen-spike/run.mjs --case V11` 退出码 0 且 stdout 含 `PASS V11`；`node --test validate` 断言 `V11 > 未知占位符` 通过
- **红绿证据**：红 = 应用 `MUT-16`（未知 key 替换成空串，不报错）→ 本用例 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/validate.test.mjs::V11 > 未知占位符`（待 plan Task N）
- **不覆盖**：不覆盖「数据里多出的键」（spec 未要求报错）

### TC-020 模板出现未闭合 `{{` → TemplateSyntaxError 且 line 指向该行

- **覆盖**：`V11②`；`§5.1` 未闭合
- **前置**：`.tmp-test/TC-020/tpl.tpl` = 真模板，把其中一处 `{{why}}` 改成 `{{why`
- **步骤**：① 调 `render` 或 `assertTemplateSyntax`；② 捕获异常；③ 检查 `line`
- **预期**：抛 `TemplateSyntaxError`；`line` 等于该 `{{` 所在行（1 起）
- **判据**：`node --test tools/docgen-spike/test/validate.test.mjs` 退出码 0；断言 `V11 > 未闭合` 通过（`code==='TemplateSyntaxError'` 且 `line` 为该行号）
- **红绿证据**：红 = 应用 `MUT-08`（正则全局替换，未闭合静默跳过）→ 不抛异常，本用例 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/validate.test.mjs::V11 > 未闭合`（待 plan Task N）
- **不覆盖**：不覆盖 `line` 在 CRLF 模板下的计算（输入角色含 CR 会先被 `EnvironmentEOL` 拦，见 TC-026）

### TC-021 空 key `{{}}` / 表达式 `{{a+b}}` / 嵌套 `{{a{{b}}` → 均为 TemplateSyntaxError

- **覆盖**：`§5.1` 白名单外语法
- **前置**：三份模板副本，各含一处上述形态
- **步骤**：① 分别调用渲染；② 各捕获异常并取 `line`
- **预期**：三次都抛 `TemplateSyntaxError`，`line` 分别为各 `{{` 所在行；不得把 `a+b` 当未知占位符（`MissingPlaceholder` 是「语法合法但数据无此键」）
- **判据**：`node --test tools/docgen-spike/test/validate.test.mjs` 退出码 0；断言 `§5.1 > 空 key`、`§5.1 > 表达式`、`§5.1 > 嵌套` 通过
- **红绿证据**：红 = 应用 `MUT-08` → 三条中有两条不抛异常，本用例 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/validate.test.mjs::§5.1 > 表达式`（待 plan Task N）
- **不覆盖**：不覆盖 `{{ key }}`（带空格）——spec 说 key 无空格，属同类，本用例不单列

### TC-022 line 计算口径：坏占位符前有 2 个换行 → line 恰为 3；比较对象含 `\r` 时不单独成行

- **覆盖**：`§5.1`「`line` = 该 `{{` 之前 `\n` 的数量 + 1」；`§6.1 步3`「`0x0D` 不单独成行」
- **前置**：① 模板副本第 3 行放 `{{bad`（前两行各以 `\n` 结束）；② 一对 Buffer：`expected = 'a\nbc\ndef'`、`actual = 'a\nbc\rdef'`（差异字节在 index 5，差异前只有 1 个 `0x0A`、差异前无 `0x0D`）
- **步骤**：① 渲染①的模板；② 捕获异常并读 `line`；③ 调 `compareBuffers(actual, expected)`；④ 读返回的 `line` 与 `byte`
- **预期**：②`line === 3`（不是 4、不是字节偏移）；④`line === 2`、`byte === 5`——若实现把 `0x0D` 也当行尾，`line` 会算成 3，本步专门抓这一类
- **判据**：`node --test tools/docgen-spike/test/validate.test.mjs` 与 `node --test tools/docgen-spike/test/compare.test.mjs` 均退出码 0；断言 `§5.1 > line 计算`（`assert.strictEqual(err.line, 3)`）与 `§6.1 > CR 不成行`（`assert.strictEqual(r.line, 2)` 且 `assert.strictEqual(r.byte, 5)`）通过
- **红绿证据**：红① = 应用 `MUT-17`（line 用字符偏移）→ ②的值不等于 3，本用例 FAIL；红② = 应用 `MUT-61`（line 统计时把 `0x0D` 也计为换行，或先把 `\r\n` 归一）→ ④的 `line` 变 3，本用例 FAIL；绿 = 两者都不应用时 PASS
- **对应测试**：`tools/docgen-spike/test/validate.test.mjs::§5.1 > line 计算`、`tools/docgen-spike/test/compare.test.mjs::§6.1 > CR 不成行`（待 plan Task N）
- **不覆盖**：不覆盖「模板本身含 CRLF 时的行号」——模板属输入角色，会先被 `EnvironmentEOL` 拦（TC-026），到不了行号计算

### TC-023 生成物副本改 1 个 ASCII 字节 → Mismatch 且 `line`/`byte` **精确等于期望值**，消息指向内容源，target 哈希不变

- **覆盖**：`V2`；`§6.1` 步3（`line`/`byte` 定义）；`§6.1` 末段（`Mismatch` 消息必含「内容源在 `tools/docgen-spike/specTestCaseGate.mjs::buildData()`」）；`R7`（target 只读）
- **前置**：`.tmp-test/` 与 `rules/tmp-new-rule-V4.md` / `rules/tmp-new-rule-V10.md` 均不存在；把 target 与模板的字节读进内存并算 SHA256（`crypto.createHash('sha256')`）
- **构造（本文件固定，V2 必须照此实现）**：把渲染结果中**第 1 个 `0x0A` 之后第 1 个非 `0x0A` 字节**改成 `0x40`（`@`）。在 target 上该位置是 `>`（第 3 行行首），故 `mutatedOffset` = 该 `>` 的下标、`expectedLine` = **3**（`mutatedOffset` 之前有 2 个 `0x0A`，`2 + 1 = 3`）
- **步骤**：① 读 target 字节，按上一行规则独立算出 `mutatedOffset`（不读实现打印的值），并断言 `targetBytes[mutatedOffset] === 0x3E`；② `node tools/docgen-spike/run.mjs --case V2`；③ 从 stdout 取 `byte=` 与 `line=` 的数值、以及是否出现内容源指引；④ 重算 target 与模板 SHA256
- **预期**：①`mutatedOffset` 有确定值且该字节是 `>`；②退出码 0 且 stdout 含 `PASS V2`；③`byte === mutatedOffset`（**精确相等**，不是「落在附近」）、`line === 3`（**精确相等**）、`Mismatch`，且同时出现 `specTestCaseGate.mjs` 与 `buildData`（内容源指引，缺一即 FAIL）；④两个 SHA256 与①前逐字节相同
- **判据**：`node --test tools/docgen-spike/test/cli.test.mjs` 退出码 0；断言 `V2 > 精确偏移与指引` 通过——内部：`assert.strictEqual(r.byte, mutatedOffset)`、`assert.strictEqual(r.line, expectedLine)`、`assert.strictEqual(expectedLine, 3)`、`assert.match(stdout, /Mismatch/)`、`assert.match(stdout, /specTestCaseGate\.mjs/)`、`assert.match(stdout, /buildData/)`、两次 `strictEqual(sha256Before, sha256After)`。**不保留** `/byte=\d+/` 这类只验格式的弱判据
- **红绿证据**：红① = 应用 `MUT-18`（比对前先 `toString().trim()` 归一）→ 单字节改动被吞，没有 `Mismatch`，本用例 FAIL；红② = 应用 `MUT-78`（`line` 用「字节偏移 ÷ 平均行长」估算或差 1）→ `line !== 3`，本用例 FAIL；红③ = 应用 `MUT-76`（`Mismatch` 消息只留 `line`/`byte`，删掉「内容源在 …」那行）→ 指引断言 FAIL；绿 = 三者都不应用时 PASS
- **对应测试**：`tools/docgen-spike/test/cli.test.mjs::V2 > 精确偏移与指引`（内部只 spawn `run.mjs --case V2`，不调 `npm run check`，故不触发自递归，见 §0 硬约束与 TC-067）；构造与输出由 `tools/docgen-spike/run.mjs::V2` 承担（待 plan Task N）
- **不覆盖**：不覆盖「实现自选别的固定偏移」——本文件把 V2 的构造位置钉死在第 1 个换行后的首个非换行字节；若施工者改了位置，本用例判红是**预期**（期望值必须可独立复算）。也不覆盖 CRLF 形态（TC-025）

### TC-024 首字节差异 → line=1；生成物是 target 真前缀 → index 取 min(length) 且不越界

- **覆盖**：`§6.1 步2/步3` 边界
- **前置**：两个 Buffer 对：`('aXbc', 'aYbc')` 与 `(expected='abcdef', actual='abc')`（actual 为真前缀）
- **步骤**：① 分别调 `compareBuffers(actual, expected)`；② 检查返回；③ 检查 `line` 与 `byte`
- **预期**：①`{code:'Mismatch', line:1, byte:1}`；②`{code:'Mismatch', line:1, byte:3}`（index=min=3）；三次调用都不抛 RangeError
- **判据**：`node --test tools/docgen-spike/test/compare.test.mjs` 退出码 0；断言 `§6.1 > 首字节差异` 与 `§6.1 > 前缀关系` 通过
- **红绿证据**：红 = 应用 `MUT-19`（前缀情形用 `actual.length` 取字节导致 `undefined` 或越界）→ ②的 `byte` 不等于 3 或抛异常，本用例 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/compare.test.mjs::§6.1 > 前缀关系`（待 plan Task N）
- **不覆盖**：不覆盖两边都为空 Buffer（相等，`{ok:true}`），属平凡情形

### TC-025 生成物副本把一个 `\n` 换成 `\r\n` → Mismatch 而非 EnvironmentEOL（不做 EOL 归一）

- **覆盖**：`V2b`；`R8`（`.tmp-test/` 下作为比对对象的 generated 副本不预检）
- **前置**：`.tmp-test/V2b/` 不存在；target 与模板 SHA256 先记录
- **步骤**：① `node tools/docgen-spike/run.mjs --case V2b`；② 检查该例返回码；③ 重算两个 SHA256
- **预期**：返回 `Mismatch`（**不是** `EnvironmentEOL`）；②的 SHA256 不变
- **判据**：`node tools/docgen-spike/run.mjs --case V2b` 退出码 0 且 stdout 匹配 `/PASS V2b/` 与 `/Mismatch/`，且**不**匹配 `/EnvironmentEOL/`
- **红绿证据**：红 = 应用 `MUT-20`（比对前把 `\r\n` 归一成 `\n`）→ 返回全等，本用例 FAIL；红（第二种）= 应用 `MUT-21`（对 generated 也做环境预检）→ 返回 `EnvironmentEOL`，本用例 FAIL；绿 = 两者都不应用时 PASS
- **对应测试**：`tools/docgen-spike/run.mjs::V2b`（待 plan Task N）
- **不覆盖**：不覆盖真实 target 含 CR 的情形（那是 TC-026，属输入角色）

### TC-026 模板副本 CRLF 化 → EnvironmentEOL（violation=CR，path 指向副本）

- **覆盖**：`V8`；`§6.2 步2`；`R8` 输入角色
- **前置**：`.tmp-test/V8/rule.md.tpl` = 真模板 CRLF 化；`--template` 指向它；真模板 SHA256 先记录
- **步骤**：① `node tools/docgen-spike/run.mjs --case V8`；② 检查 `code`、`path`、`violation`；③ 重算真模板 SHA256
- **预期**：`EnvironmentEOL`，`violation='CR'`，`path` 解析后等于该副本路径；③不变
- **判据**：`run.mjs --case V8` 退出码 0 且 stdout 匹配 `/PASS V8/`、`/EnvironmentEOL/`、`/violation=CR/`；真模板 SHA256 前后由 `crypto.createHash('sha256')` 算出并 `strictEqual`（不用 `sha256sum`，见 §0 断言工具约定）
- **红绿证据**：红 = 应用 `MUT-22`（`checkEnvironment` 只查 BOM）→ 不报 CR，本用例 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/run.mjs::V8`（待 plan Task N）
- **不覆盖**：不覆盖 baseline 输入角色含 CR（TC-029）

### TC-027 target 副本加 UTF-8 BOM → EnvironmentEOL（violation=BOM）

- **覆盖**：`V8`；`§6.2 步1`
- **前置**：`.tmp-test/V8/target-bom.md` = 真 target 前加 `EF BB BF`；`--target` 指向它；真 target SHA256 先记录
- **步骤**：① 运行 V8 的 BOM 分支；② 检查 `violation` 与 `path`；③ 重算真 target SHA256 与 `git hash-object`
- **预期**：`EnvironmentEOL`，`violation='BOM'`，`path` 为该副本；③三项不变
- **判据**：`run.mjs --case V8` 退出码 0 且 stdout 匹配 `/violation=BOM/`；`git hash-object rules/spec-testcase-gate.md` 与 `TARGET_GIT_HASH` 相等
- **红绿证据**：红 = 应用 `MUT-23`（`checkEnvironment` 去掉 BOM 判断）→ 变成后续 Mismatch 或不报错，本用例 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/run.mjs::V8`（待 plan Task N）
- **不覆盖**：不覆盖 BOM 出现在文件中部的情形（不是合法 BOM 位置，spec 只查前 3 字节）

### TC-028 target 副本含非法 UTF-8 字节 → EnvironmentEOL（violation=INVALID_UTF8）

- **覆盖**：`§6.2 步3`
- **前置**：副本在文件中段插入单字节 `0xFF`（非 UTF-8 起始字节）
- **步骤**：① 调 `checkEnvironment(buffer, path)`；② 检查 `violation`
- **预期**：`violation='INVALID_UTF8'`；不抛 `TypeError`（`TextDecoder` 的 fatal 异常必须被转换成产品错误码）
- **判据**：`node --test tools/docgen-spike/test/compare.test.mjs` 退出码 0；断言 `§6.2 > 非法 UTF-8` 通过
- **红绿证据**：红 = 应用 `MUT-24`（用 `buffer.toString('utf8')` 代替 `TextDecoder({fatal:true})`）→ 非法字节被替换成 `U+FFFD` 不报错，本用例 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/compare.test.mjs::§6.2 > 非法 UTF-8`（待 plan Task N）
- **不覆盖**：不覆盖截断的多字节序列（如末尾半个汉字）——同属 INVALID_UTF8，本用例不单列

### TC-029 baseline 副本含 CR → EnvironmentEOL（R8 的第三个输入角色）

- **覆盖**：`R8`「按输入角色检查」；`§6.2`
- **前置**：`.tmp-test/TC-029/baseline-cr.json` = 真 baseline 的每行末尾加 `\r`；`--baseline` 指向它
- **步骤**：① 调 `checkEnvironment` 或跑 `--gate --baseline`；② 检查 `code`、`violation`、`path`
- **预期**：`EnvironmentEOL`，`violation='CR'`，`path` 指向该副本；不得报 `BaselineDrift`
- **判据**：`node --test tools/docgen-spike/test/compare.test.mjs` 退出码 0；断言 `§6.2 > baseline 含 CR` 通过
- **红绿证据**：红 = 应用 `MUT-22`（只查 BOM）→ 走到第 4 步报 `BaselineDrift`，本用例 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/compare.test.mjs::§6.2 > baseline 含 CR`（待 plan Task N）
- **不覆盖**：不覆盖「baseline 是合法 JSON 但有 CR」与「JSON 损坏」的优先级（TC-033）

### TC-030 同时含 BOM + CR + 非法字节 → 只报 BOM（§6.2 固定顺序）

- **覆盖**：`§6.2` 判定顺序
- **前置**：Buffer = `EF BB BF` + `'a\r\n'` 的字节 + `0xFF`
- **步骤**：① 调 `checkEnvironment`；② 检查 `violation`
- **预期**：`violation='BOM'`，不报 `CR`、不报 `INVALID_UTF8`
- **判据**：`node --test tools/docgen-spike/test/compare.test.mjs` 退出码 0；断言 `§6.2 > 顺序 BOM 优先` 通过
- **红绿证据**：红 = 应用 `MUT-25`（把 UTF-8 解码放到最前）→ `violation='INVALID_UTF8'`，本用例 FAIL；绿 = 恢复顺序后 PASS
- **对应测试**：`tools/docgen-spike/test/compare.test.mjs::§6.2 > 顺序 BOM 优先`（待 plan Task N）
- **不覆盖**：不覆盖 CR 与非法字节并发时的相对顺序（BOM 已短路，该组合不可达）

### TC-031 合法 baseline 副本 + `--baseline` 指向 → 五步全过，且本体 SHA256 不变

- **覆盖**：`V7` 前置；`R14`（`--baseline` 只接受 `.tmp-test/**`）；`R7`
- **前置**：真 `baseline.json` 原样副本（**由 V7 在启动后自建**到 `.tmp-test/V7/baseline.json`；本副本属 `--case Vn` 内 → 由用例代码在启动清理之后自建（spec §7.3 第①类），测试不得预置，预置也会被 §7.4 启动清理删掉）；记录真 baseline 的 SHA256
- **步骤**：① 跑 `--case V7` 的合法基线分支；② 检查该分支 PASS；③ 重算真 baseline 的 SHA256
- **预期**：合法分支 PASS 且无任何错误码；③不变（复制品被改，本体不动）
- **判据**：`run.mjs --case V7` 退出码 0 且 stdout 含 `PASS V7`；真 `tools/docgen-spike/baseline.json` 的 SHA256 前后由 `crypto.createHash('sha256').update(fs.readFileSync(...)).digest('hex')` 算出并 `strictEqual`（不用 `sha256sum`）
- **红绿证据**：红 = 应用 `MUT-26`（`--baseline` 参数被忽略，永远读仓库内文件）→ 后续 TC-034/TC-037 全 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/run.mjs::V7`（待 plan Task N）
- **不覆盖**：不覆盖「合法新增一条 rule 的完整流程」——消息指引已由 spec §6.3 落地（§8 建议 9），但「谁来改 baseline、怎么评审」仍属 P2

### TC-032 baseline.json 字节内容 === 常量渲染结果，且路径字典序

- **覆盖**：`R5`；`R4` 字典序；`§4.2`
- **前置**：仓库内 `tools/docgen-spike/baseline.json` 与 `specTestCaseGate.mjs` 均已落地
- **步骤**：① `renderBaseline(BASELINE_RULES)`；② 与磁盘文件 `Buffer.compare`；③ 检查 `BASELINE_RULES` 是否严格升序
- **预期**：①与②字节相等；③`BASELINE_RULES` 全为 POSIX 相对路径、以 `rules/` 开头、按码点严格升序；条目数 21（与实测 `rules/` 21 个 `.md` 一致）
- **判据**：`node --test tools/docgen-spike/test/baseline.test.mjs` 退出码 0；断言 `R5 > baseline 与常量一致`、`R5 > 字典序`、`R5 > 21 条` 通过
- **红绿证据**：红 = 应用 `MUT-27`（`renderBaseline` 用 `JSON.stringify(BASELINE_RULES)` 不带缩进与尾换行）→ 字节不等，本用例 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/baseline.test.mjs::R5 > baseline 与常量一致`（待 plan Task N）
- **不覆盖**：不覆盖 21 这个数字的长期稳定性（spec §4.2 写的是 v1 快照；新增 rule 后变 22 属受控变更，见 §8 建议 9 的状态）

### TC-033 baseline 空数组 / 条目重复 / JSON 损坏 / 文件缺失 → 均 InvalidBaseline

- **覆盖**：`V7`；`§6.3 步1`
- **前置**：四份副本：`[]`、原文件追加一条已存在路径、内容 `{ "a": 1 }` 与截断的 `[`、以及一个不存在的路径
- **步骤**：① 依次用 `--baseline` 指向四份输入；② 各自的返回码与 `path`
- **预期**：四次都 `InvalidBaseline`，`path` 指向被指向的文件（或期望路径）；不得报 `BaselineDrift` 或 `DanglingBaselineEntry`
- **判据**：`node --test tools/docgen-spike/test/baseline.test.mjs` 退出码 0；断言 `§6.3 > 空数组`、`> 重复条目`、`> JSON 损坏`、`> 非数组`、`> 文件缺失` 通过
- **红绿证据**：红 = 应用 `MUT-28`（步1 只用 `try/catch` 包 `JSON.parse` 且跳过重复检测）→ 重复与损坏两条 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/baseline.test.mjs::§6.3 > 重复条目`（待 plan Task N）
- **不覆盖**：不覆盖「文件存在但无读权限」（需 chmod，Windows 不可构造，见 §5）

### TC-034 baseline 删一条 → BaselineDrift（不是 Dangling、不是 InvalidBaseline）

- **覆盖**：`V7`；`§6.3 步4`；`R5`
- **前置**：副本 = 真 baseline 少一行（21 → 20），其余合法
- **步骤**：① `--baseline` 指向副本；② 检查返回码与 `path`
- **预期**：`BaselineDrift`；不报步1/2/3 的码；`path` 非空
- **判据**：`node --test tools/docgen-spike/test/baseline.test.mjs` 退出码 0；断言 `§6.3 > 缺项漂移` 通过（`code==='BaselineDrift'`）
- **红绿证据**：红 = 应用 `MUT-29`（跳过步4，不比对常量）→ 不报错，本用例 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/baseline.test.mjs::§6.3 > 缺项漂移`（待 plan Task N）
- **不覆盖**：不覆盖多出的条目（PD 规定由其它码先行拦截，见 TC-036/TC-038）

### TC-035 baseline 路径含 `..` / 反斜杠 / 不在 rules 下 → InvalidBaselinePath

- **覆盖**：`V7`；`§6.3 步2`
- **前置**：三份副本，各追加一条：`rules/../rules/x.md`、`rules\x.md`、`tools/x.md`
- **步骤**：① 依次校验；② 检查返回码与 `path`
- **预期**：三次都 `InvalidBaselinePath`；`path` 等于那条非法条目；不得走到步3（`DanglingBaselineEntry`）
- **判据**：`node --test tools/docgen-spike/test/baseline.test.mjs` 退出码 0；断言 `§6.3 > 含点段`、`> 含反斜杠`、`> 非 rules 路径` 通过
- **红绿证据**：红 = 应用 `MUT-30`（删除正则里的反斜杠拦截）→ 第二条 FAIL；再应用 `MUT-31`（只判后缀 `.md`）→ 第三条 FAIL；绿 = 撤掉后全 PASS
- **对应测试**：`tools/docgen-spike/test/baseline.test.mjs::§6.3 > 含反斜杠`（待 plan Task N）
- **不覆盖**：不覆盖路径大小写（Windows 不敏感）——spec §7.1 只写了「对 `realpathSync` 结果复判（含大小写）」，本用例不单列（§8 建议 2 已落地，残留见 §7.2 第 8 项）

### TC-036 baseline 加一条不存在的路径 → DanglingBaselineEntry

- **覆盖**：`V7`；`§6.3 步3`
- **前置**：副本追加 `rules/does-not-exist.md`（格式合法、文件不存在）
- **步骤**：① 校验；② 检查返回码与 `path`
- **预期**：`DanglingBaselineEntry`；`path='rules/does-not-exist.md'`
- **判据**：`node --test tools/docgen-spike/test/baseline.test.mjs` 退出码 0；断言 `§6.3 > 悬空条目` 通过
- **红绿证据**：红 = 应用 `MUT-32`（跳过步3 存在性检查）→ 变成 `BaselineDrift`，本用例 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/baseline.test.mjs::§6.3 > 悬空条目`（待 plan Task N）
- **不覆盖**：不覆盖「条目存在但是目录」（`rules/` 本身）——被步2 正则先拦

### TC-037 同一集合但乱序 → BaselineDrift（第 4 步逐字节比对先于第 5 步）

- **覆盖**：`R5` + `R9` 交互
- **前置**：副本 = 真 baseline 的 21 条全部保留但逆序
- **步骤**：① 校验；② 检查返回码
- **预期**：`BaselineDrift`（不是 `InvalidBaseline`，因为步1 只查重复不查顺序；不是 `UnregisteredHandwritten`，因为集合相同）
- **判据**：`node --test tools/docgen-spike/test/baseline.test.mjs` 退出码 0；断言 `§6.3 > 乱序漂移` 通过
- **红绿证据**：红 = 应用 `MUT-33`（步1 增加「必须有序」判断）→ 返回 `InvalidBaseline`，本用例 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/baseline.test.mjs::§6.3 > 乱序漂移`（待 plan Task N）
- **不覆盖**：不覆盖「顺序是否稳定跨平台」（码点排序在跨平台一致，见 R4）

### TC-038 重复条目 + 非法路径同时存在 → 只报 InvalidBaseline（R9 步1 先于步2）

- **覆盖**：`R9`；`§6.3` 表
- **前置**：副本 = 21 条 + 重复一条合法条目 + 一条含 `..` 的条目
- **步骤**：① 校验；② 检查返回码
- **预期**：`InvalidBaseline`；不得报 `InvalidBaselinePath`
- **判据**：`node --test tools/docgen-spike/test/baseline.test.mjs` 退出码 0；断言 `R9 > 结构先于路径` 通过
- **红绿证据**：红 = 应用 `MUT-34`（把步2 提到步1 前）→ 返回 `InvalidBaselinePath`，本用例 FAIL；绿 = 恢复顺序后 PASS
- **对应测试**：`tools/docgen-spike/test/baseline.test.mjs::R9 > 结构先于路径`（待 plan Task N）
- **不覆盖**：不覆盖步2 与步3 的并发（TC-036 已固定）

### TC-039 删一条 + 加一条不存在 → 只报 DanglingBaselineEntry（R9 步3 先于步4）

- **覆盖**：`R9`
- **前置**：副本 = 21 条删 1 条 + 追加 `rules/nope.md`
- **步骤**：① 校验；② 检查返回码
- **预期**：`DanglingBaselineEntry`；不得报 `BaselineDrift`
- **判据**：`node --test tools/docgen-spike/test/baseline.test.mjs` 退出码 0；断言 `R9 > 悬空先于漂移` 通过
- **红绿证据**：红 = 应用 `MUT-35`（把步4 提到步3 前）→ 返回 `BaselineDrift`，本用例 FAIL；绿 = 恢复顺序后 PASS
- **对应测试**：`tools/docgen-spike/test/baseline.test.mjs::R9 > 悬空先于漂移`（待 plan Task N）
- **不覆盖**：不覆盖基线外新增与漂移的并发（TC-040）

### TC-040 删一条 + 基线外新增 `rules/tmp-new-rule-TC040.md` → 只报 BaselineDrift（R9 步4 先于步5）

- **覆盖**：`R9`；`§6.3 步4/步5`
- **前置**：用真 baseline 少一条的副本；同时创建 `rules/tmp-new-rule-TC040.md`（本用例自建自删；**它不经 `run.mjs` 的 V4/V10 哨兵机制**，用专属名避免与 TC-041/TC-050/TC-057 的两个哨兵名混淆）
- **步骤**：① `--baseline` 指向副本运行校验；② 检查返回码；③ 删除临时文件
- **预期**：`BaselineDrift`；不得报 `UnregisteredHandwritten`；③后文件不存在
- **判据**：`node --test tools/docgen-spike/test/baseline.test.mjs` 退出码 0；断言 `R9 > 漂移先于新增` 通过；`assert.strictEqual(fs.existsSync('rules/tmp-new-rule-TC040.md'), false)`
- **红绿证据**：红 = 应用 `MUT-36`（把步5 提到步4 前）→ 返回 `UnregisteredHandwritten`，本用例 FAIL；绿 = 恢复顺序后 PASS
- **对应测试**：`tools/docgen-spike/test/baseline.test.mjs::R9 > 漂移先于新增`（待 plan Task N）
- **不覆盖**：不覆盖「基线内文件内容被改」（P1-3 明确不比对内容）

### TC-041 基线外新建 `rules/tmp-new-rule-V4.md` → UnregisteredHandwritten 且消息含两条可操作指引，用例结束文件不存在

- **覆盖**：`V4`；`§6.3 步5`（含末段「消息必须包含可操作指引」）；`§7.4` **临时文件唯一名（V4 用 `tmp-new-rule-V4.md`）**；`R11` finally
- **前置**：`rules/tmp-new-rule-V4.md` 不存在；启动**不得**清它（内容不等于 V4 固定哨兵串时按 fail-closed 处理，见 TC-057）
- **步骤**：① `node tools/docgen-spike/run.mjs --case V4`；② 检查返回码、`path` 与消息正文；③ 用例结束后检查文件与 `git status`
- **预期**：stdout 含 `UnregisteredHandwritten` 与 `path=rules/tmp-new-rule-V4.md`；消息正文**同时**出现 `BASELINE_RULES`（并入哪个常量）与 `renderBaseline`（用哪个函数覆盖 `baseline.json`）两个词；退出码 0（断言模式把期望失败记为 PASS）；③`-V4.md` 文件不存在、`-V10.md` 不存在、`git status --short rules/` 为空
- **判据**：`run.mjs --case V4` 退出码 0 且 stdout 匹配 `/PASS V4/`、`/UnregisteredHandwritten/`、`/rules[\/\\]tmp-new-rule-V4\.md/`、`/BASELINE_RULES/`、`/renderBaseline/`；随后 `assert.strictEqual(fs.existsSync('rules/tmp-new-rule-V4.md'), false)` 且 `assert.strictEqual(fs.existsSync('rules/tmp-new-rule-V10.md'), false)`；`git status --short rules/` 输出 0 行
- **红绿证据**：红① = 应用 `MUT-37`（finally 里不删本用例创建的文件）→ ③文件存在，本用例 FAIL；红② = 应用 `MUT-62`（消息只留「规则未登记」，删掉两条指引）→ `BASELINE_RULES`/`renderBaseline` 两段正则不命中，本用例 FAIL；红③ = 应用 `MUT-84`（V4 与 V10 共用 `rules/tmp-new-rule.md`）→ `path` 正则不命中 `-V4`，且嵌套链里会删掉 V10 的哨兵，本用例 FAIL；绿 = 三者都不应用时 PASS
- **对应测试**：`tools/docgen-spike/run.mjs::V4`（待 plan Task N）
- **不覆盖**：不覆盖「文件已存在时是否先删再建」（V4 前置要求它不存在）；不判指引文案的措辞好坏（spec 只要求两个词在场，措辞见 §5 人工项）；不覆盖哨兵自愈（TC-057 管）

### TC-042 `--out rules/x.md` → InvalidOutputPath + 退出码 2，且真 rules 目录未增文件

- **覆盖**：`V11④`；`§7.1` 路径根定义（`ROOT = <仓库根>/tools/docgen-spike/.tmp-test`）与 `--out` 白名单；`§7.1` 退出码逐码映射表（路径越界 → 2）；`R10`
- **前置**：`rules/x.md` 不存在；记录跑前 `rules/*.md` 数量（实测 21）与 `git status --short rules/` 为空
- **步骤**：① 跑 `--out rules/x.md`（配合需要落盘的用例）；② 取 `code` 与 `path`；③ 取退出码；④ 检查 `rules/` 的 `.md` 数量与 `git status`
- **预期**：`InvalidOutputPath`；`path` 非空（解析后等于 `<仓库根>/rules/x.md`）；**退出码恰为 2**（§7.1 逐码表：路径越界 → 2，不是 1 也不是 3）；根因是 `<仓库根>/rules/x.md` **不在 `ROOT = <仓库根>/tools/docgen-spike/.tmp-test` 之下**（`path.relative(ROOT, abs)` 会算成 `../../../rules/x.md`，以 `..` 开头）；④`rules/x.md` 不存在、`.md` 数量仍 21、`git status --short rules/` 为空
- **判据**：`node --test tools/docgen-spike/test/cli.test.mjs` 退出码 0；断言 `V11 > out 越界` 通过（`code === 'InvalidOutputPath'` 且 `path` 非空 且 **`exitCode === 2`**）；`assert.strictEqual(fs.existsSync('rules/x.md'), false)`
- **红绿证据**：红① = 应用 `MUT-38`（去掉 `--out` 白名单校验）→ 文件被写进 `rules/`，本用例 FAIL；红② = 应用 `MUT-68`（把 `ROOT` 取成仓库根）→ `rel = 'rules/x.md'` 不以 `..` 开头、非绝对，三段判定放行，文件被写出，本用例 FAIL；红③ = 应用 `MUT-49`（退出码不分档，全用 1）→ `exitCode === 2` 断言 FAIL；绿 = 三个 MUT 都不应用时 PASS
- **对应测试**：`tools/docgen-spike/test/cli.test.mjs::V11 > out 越界`（待 plan Task N）
- **不覆盖**：不覆盖符号链接 / junction 绕过（Windows `mklink /J`）——见 TC-065；不覆盖「`ROOT` 取成比 `.tmp-test` 更窄的子目录」——见 TC-046 的正向对照分支；本条只保证 `rules/` 直接路径被拦且退出码为 2

### TC-043 `--out` 指向一个已存在目录 → WriteFailed 且 path 与 errno 非空

- **覆盖**：`V11⑥`；`§5` 表 `WriteFailed`
- **前置**：`.tmp-test/TC-043/adir/` 已存在
- **步骤**：① `--out tools/docgen-spike/.tmp-test/TC-043/adir`；② 检查 `code`、`path`、`errno`
- **预期**：`WriteFailed`；`path` 指向该目录；`errno` 为字符串（如 `EISDIR`），非空
- **判据**：`node --test tools/docgen-spike/test/cli.test.mjs` 退出码 0；断言 `V11 > out 指向目录` 通过（三个字段均非空）
- **红绿证据**：红 = 应用 `MUT-39`（写盘异常直接向上抛，不包装错误码）→ 得到原始 `Error` 而非 `WriteFailed`，本用例 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/cli.test.mjs::V11 > out 指向目录`（待 plan Task N）
- **不覆盖**：不覆盖磁盘满/只读盘（环境不可构造）

### TC-044 模板路径不存在 → TemplateReadFailed 且 path 非空

- **覆盖**：`V11⑤`；`§7.2 步③`
- **前置**：`.tmp-test/V11/nope.tpl` 不存在
- **步骤**：① `--template tools/docgen-spike/.tmp-test/V11/nope.tpl`（跑需要读模板的模式）；② 检查 `code` 与 `path`
- **预期**：`TemplateReadFailed`；`path` 非空；不得先报 `EnvironmentEOL`
- **判据**：`node --test tools/docgen-spike/test/cli.test.mjs` 退出码 0；断言 `V11 > 模板不存在` 通过
- **红绿证据**：红 = 应用 `MUT-40`（读模板不加 try/catch）→ 抛 `ENOENT` 原始错误，本用例 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/cli.test.mjs::V11 > 模板不存在`（待 plan Task N）
- **不覆盖**：不覆盖模板存在但无读权限（见 §5）

### TC-045 `--compare` 指向 ROOT 内不存在的生成物 → GeneratedMissing + path + exit 3

- **覆盖**：`V11③`；`§7.1`「`--compare <path>`：把 `path`（只接受 `.tmp-test/**`）当作待比对生成物，与 target 比对；不存在 → `GeneratedMissing`（exit 3）」；`§7.1` 退出码逐码映射表第 3 行（IO / 依赖 → 3）
- **前置**：`tools/docgen-spike/.tmp-test/TC-045/missing.md` **不存在**（父目录可以存在或不存在，两种都跑一次）；记录 target SHA256（内存）
- **步骤**：① `node tools/docgen-spike/run.mjs --compare tools/docgen-spike/.tmp-test/TC-045/missing.md`；② 取 `code`、`path`、退出码与输出；③ 重算 target SHA256
- **预期**：`GeneratedMissing`；`path` 非空且解析后等于传入路径；**退出码恰为 3**（不是 1：这不是「用例未达预期」；也不是 `InvalidInputPath`：路径在 `ROOT` 内合法）；不得报 `Mismatch`；③不变
- **判据**：`node --test tools/docgen-spike/test/cli.test.mjs` 退出码 0；断言 `V11 > 生成物缺失` 通过——内部：`assert.strictEqual(r.code, 'GeneratedMissing')`、`assert.ok(r.path.length > 0)`、`assert.strictEqual(r.exitCode, 3)`、`assert.doesNotMatch(stdout, /Mismatch/)`；target SHA256 前后 `strictEqual`
- **红绿证据**：红① = 应用 `MUT-41`（读生成物失败时返回空 Buffer）→ 变成 `Mismatch`，本用例 FAIL；红② = 应用 `MUT-49`（退出码全用 1）→ `exitCode === 3` 断言 FAIL；绿 = 两者都不应用时 PASS
- **对应测试**：`tools/docgen-spike/test/cli.test.mjs::V11 > 生成物缺失`（待 plan Task N）
- **不覆盖**：不覆盖生成物是目录的情形（`--out` 指向目录由 TC-043 覆盖）；`--compare` 越界现已并入 R14 白名单（§8 #16 已落地），但**越界分支仍未单列用例**——TC-045 只测 ROOT 内缺失，互斥侧由 TC-063 / TC-071 覆盖；若要把「`--compare` 指到 `rules/x.md` → `InvalidInputPath` + exit 2」写成独立断言，需新增用例（本文件不改号，登记为待补）

### TC-046 `--out` 指向 `.tmp-testx/` / `..` 穿越 / `rules/x.md` → 均 InvalidOutputPath（含 `ROOT` 定义负例）

- **覆盖**：`§7.1`「**路径根**：`ROOT = <仓库根>/tools/docgen-spike/.tmp-test`」+ 三段式 `rel = path.relative(ROOT, path.resolve(p))` 判定；`§7.1` 逐码表（路径越界 → 2）；`ROOT` 定义的负例与正对照
- **前置**：`.tmp-testx/` 目录存在（本用例自建自删）；`rules/x.md` 不存在；记录 `rules/*.md` 数量（实测 21）与跑前 `git status --short rules/` 为空
- **步骤**：① `--out tools/docgen-spike/.tmp-testx/a.md`（字符串前缀绕过）；② `--out tools/docgen-spike/.tmp-test/../../../rules/x.md`（`..` 穿越，解析后就是 `<仓库根>/rules/x.md`）；③ `--out rules/x.md`（**`ROOT` 定义负例**：只有 `ROOT` 恰为 `.tmp-test` 时才会被拦）；④ `--out tools/docgen-spike/.tmp-test/TC-046-pos/a.md`（**正对照**：证明 `ROOT` 没有为了通过越界断言而被收窄到某个用例目录）；⑤ 各取 `code`、`path`、退出码；⑥ 检查两个越界目标文件（`.tmp-testx/a.md`、`rules/x.md`）是否被写出、`rules/` 的 `.md` 数量与 `git status`；⑦ 清理两个自建目录
- **预期**：①②③都 `InvalidOutputPath`、`path` 非空、**退出码恰为 2**；③是本条的核心判别点——若实现把 `ROOT` 取成**仓库根**，`rel = 'rules/x.md'` 不以 `..` 开头、也非绝对路径，三段判定会放行并真的写出 `rules/x.md`，本用例必须判红；④`--out` 被接受且文件落在 `.tmp-test/TC-046-pos/a.md`；⑥两个越界目标都不存在、`rules/` 仍 21 个 `.md`、`git status --short rules/` 为空
- **判据**：`node --test tools/docgen-spike/test/cli.test.mjs` 退出码 0；断言 `§7.1 > 前缀绕过`、`§7.1 > 点段穿越`、`§7.1 > ROOT 定义负例` 三条通过（每条：`code === 'InvalidOutputPath'` 且 `exitCode === 2` 且 `path` 非空；第三条额外断言 `assert.strictEqual(fs.existsSync('rules/x.md'), false)`）；断言 `§7.1 > ROOT 正对照` 通过（`exitCode === 0` 且落点为 `.tmp-test/TC-046-pos/a.md`）；另断言 `fs.existsSync('tools/docgen-spike/.tmp-testx/a.md') === false` 与 `fs.existsSync('rules/x.md') === false`
- **红绿证据**：红① = 应用 `MUT-42`（白名单用 `startsWith('.tmp-test')` 字符串前缀）→ ①放行并写出文件，本用例 FAIL；红② = 应用 `MUT-66`（`path.resolve` 后直接判 `startsWith(OUT_ROOT)`，不先算 `path.relative`）→ ②放行，本用例 FAIL；红③ = 应用 `MUT-68`（`ROOT` 取仓库根）→ ③放行，本用例 FAIL；红④ = 应用 `MUT-69`（`ROOT` 收窄成 `.tmp-test/<某一用例目录>`）→ ④被误拒，本用例 FAIL；绿 = 四个 MUT 都不应用时 PASS
- **对应测试**：`tools/docgen-spike/test/cli.test.mjs::§7.1 > 前缀绕过`、`§7.1 > 点段穿越`、`§7.1 > ROOT 定义负例`、`§7.1 > ROOT 正对照`（待 plan Task N）
- **不覆盖**：不覆盖 junction / symlink 形态（TC-065）——字符串与 `..` 都拦住了，链接仍可绕过，两者互补；不覆盖「`--out` 省略时的默认落点」（spec 只说覆盖参数必须在 `ROOT` 下，默认落点由 §7.3 用例各自的固定位置决定）

### TC-047 `--out` 用 Windows 反斜杠分隔符 → 与正斜杠等效，落点仍在 `.tmp-test/` 内

- **覆盖**：`§7.1`；跨平台差异（Windows 路径分隔符）
- **前置**：在 Windows 上运行；`.tmp-test/TC-047/` 不存在
- **步骤**：① `--out tools\docgen-spike\.tmp-test\TC-047\a.md`；② 检查是否被接受；③ 解析实际落盘路径
- **预期**：被接受（或与正斜杠版本行为完全一致）；③`path.resolve` 后位于 `tools/docgen-spike/.tmp-test/TC-047/` 内；不得因分隔符不同而误判越界
- **判据**：`node --test tools/docgen-spike/test/cli.test.mjs` 退出码 0；断言 `§7.1 > 反斜杠等价` 通过（两次调用结果一致，落点相同）
- **红绿证据**：红 = 应用 `MUT-43`（白名单用字符串 `startsWith('tools/docgen-spike/.tmp-test/')`）→ 反斜杠版本被判越界，本用例 FAIL；绿 = 先用 `path.resolve` 归一后 PASS
- **对应测试**：`tools/docgen-spike/test/cli.test.mjs::§7.1 > 反斜杠等价`（待 plan Task N）
- **不覆盖**：不覆盖 Linux 上反斜杠是否被当作普通字符——spec 只说「按 `path` 处理」，未规定 POSIX 下的语义，本文件不预设

### TC-048 三个输入覆盖参数指向 `.tmp-test/` 之外 → `InvalidInputPath` + `path` + exit 2，且真文件不被读取或改写

- **覆盖**：`R14`；`§7.1` 路径合法性（输入侧越界码 `InvalidInputPath`，**退出码 2**）；`§7.1` 退出码逐码映射表第 2 行（路径类 → 2，与本节口径一致）；`R10` 退出码 2；`R7`
- **前置**：记录真 target 的 SHA256；记录真模板（`rule.md.tpl`）与真 baseline（`baseline.json`）的 SHA256
- **步骤**：① `--target rules/docs-convention.md`；② `--template rules/spec-testcase-gate.md`；③ `--baseline rules/index.md`；④ 三次各自取返回码、`code`、`path`；⑤ 重算三份真文件的 SHA256
- **预期**：三次都返回 `InvalidInputPath`（不是 `InvalidOutputPath`，也不是 `TemplateReadFailed`/`InvalidBaseline`）；`path` 非空且解析后等于传入的越界路径；**退出码恰为 2**（spec §7.1 把输入侧与输出侧越界码同归 2）；⑤三份 SHA256 全部不变；不得静默改为使用该文件
- **判据**：`node --test tools/docgen-spike/test/cli.test.mjs` 退出码 0；断言 `R14 > target 越界`、`R14 > template 越界`、`R14 > baseline 越界` 通过（每条：`code === 'InvalidInputPath'` 且 `typeof path === 'string' && path.length > 0` 且 **`exitCode === 2`**）；三次 SHA256 逐对 `strictEqual`
- **红绿证据**：红① = 应用 `MUT-44`（只校验 `--out`，不校验 `--target`）→ 命令以真 rules 文件为目标跑完，本用例 FAIL；红② = 应用 `MUT-63`（越界时抛 `InvalidOutputPath` 或只打印一行 stderr 不给码）→ `code` 断言 FAIL；红③ = 应用 `MUT-49`（退出码不分档，全用 1）→ `exitCode === 2` 断言 FAIL；绿 = 三个 MUT 都不应用时 PASS
- **对应测试**：`tools/docgen-spike/test/cli.test.mjs::R14 > target 越界`、`R14 > template 越界`、`R14 > baseline 越界`（待 plan Task N）
- **不覆盖**：不覆盖 junction/symlink 形态（TC-065）；也不覆盖「路径不存在时 realpath 复判会不会抢在读取层之前」——spec §7.1 现行口径是「从 `abs` 向上找**最近的已存在祖先** `probe` 再复判」，因此不存在路径照样能复判、且不会抛 `ENOENT`，读取失败仍由读取层报 `TemplateReadFailed` / `GeneratedMissing`；本用例三个输入都指向**已存在**的真文件，只走越界分支，该口径的正面验证由 TC-044（模板不存在 → `TemplateReadFailed`）、TC-055（exit 3）承担

### TC-049 干净树跑 V10b 后半（内部一次 `npm run check`）→ 退出 0 且输出含 baseline 21/21

- **覆盖**：`V10b` 后半；`R6 步⑦`；`§7.2`（接线 + **涉及 check 的 e2e 在 `DOCGEN_CHECK_ACTIVE=1` 下显式 `t.skip()`**）；`§7.3`「V10/V10b 只由 `run.mjs` 编排，不在 `*.test.mjs` 内调用」+ V10b 行「计入全量 13」；`§7.1` 枚举 `V1..V11|V2b|V10b`（`--case V10b` 是合法值）与「省略 `--case` 跑全部（13 例）」
- **与全量口径的一致性（第 8 轮）**：`--case V10b` 是 §7.1 枚举里的合法单值（不再只是 V10 的子锚点），且 §7.1 已明确「省略 `--case` 的全量 **13** 例包含 V10b」。因此本条（单跑）与 TC-062（全量）是**同一个 13 元素集合的两个视角**：单跑能过、全量里也必须出现它的 `PASS V10b`；旧口径「V10b 不计入总数」已废除，任何按旧口径实现的「12 例汇总」都会在 TC-062 判红。本条由 `run.mjs --case V10b` 自身编排，是**顶层 owner**，命令**不带** `--no-clean`（§0 的 owner 归属）
- **前置**：干净树；`rules/tmp-new-rule-V4.md` 与 `rules/tmp-new-rule-V10.md` 均不存在；`tools/docgen-spike/.tmp-test/` 不存在；`scripts/check-all.mjs` 已接线
- **嵌套 check 场景的执行约束（spec §7.2）**：本条属于「涉及 check 的 e2e」，只由 `run.mjs` 串行编排（`--case V10b`）。若它被任何 `*.test.mjs` 覆盖，该测试必须在 `DOCGEN_CHECK_ACTIVE=1` 可见时**显式 `t.skip()`**——写法为 `test('V10b > 干净树 check 绿', { skip: process.env.DOCGEN_CHECK_ACTIVE === '1' ? 'nested check: 外层 V10 持有 rules/tmp-new-rule-V10.md，干净树前提不成立（spec §7.2）' : false }, ...)`，原因串必须出现在 TAP 的 `# SKIP` 行；**不得靠隐式约定、不得靠碰巧顺序**。`run.mjs` 串行编排时环境里没有该变量，**照常执行**。当前不另设 V10b 的独立包装：TC-051 已在 `cli.test.mjs` 里 spawn `--case V10b --no-clean`（同一进程同时覆盖本条），那份 spawn 在 `DOCGEN_CHECK_ACTIVE=1` 下显式 `t.skip()`，因此 `check-all → node --test` 这一层不会再派生第三个 `run.mjs`，链路深度有界；测试文件本身仍禁止直接调 `npm run check` / `check-all`（TC-067 静态断言）
- **步骤**：① `node tools/docgen-spike/run.mjs --case V10b`（该例后半会起一次 `npm run check`）；② 检查退出码；③ 检查输出中的 gate 行与 `PASS V10b`
- **预期**：退出码 0；输出含 `PASS V10b` 与 `baseline 21/21`；既有四类检查的输出与接线前一致（不出现新增 failure）；skip 只发生在「被 check 嵌套」这一场景，串行编排路径不得被跳过
- **判据**：`node tools/docgen-spike/run.mjs --case V10b` 退出码 0 且 stdout 匹配 `/PASS V10b/`、`/baseline 21\/21/`；**判别力补丁**：一旦为它加 `*.test.mjs` 包装，该包装在**不设** `DOCGEN_CHECK_ACTIVE` 时必须真的执行（输出里不得出现它的 `# SKIP`）——该断言由 TC-051 的包装承担（它 spawn 同一条 `--case V10b`），本条不重复写，避免两个包装各自派生一次 `run.mjs`；防「一律 skip」的反例 `MUT-93`
- **红绿证据**：红① = 接线前（`scripts/check-all.mjs` 无 gate 调用）→ 输出无 `baseline 21/21`，本用例 FAIL；红② = 应用 `MUT-93`（测试里无条件 skip，不看 `DOCGEN_CHECK_ACTIVE`）→ TC-051 的包装在单跑时出现 `# SKIP`，本条的 `baseline 21/21` 也不会在单跑路径被验到，由 TC-051 / TC-070 的同类断言判红；绿 = 接线后同一命令命中、且包装在单跑时不出现 `# SKIP`
- **对应测试**：`tools/docgen-spike/run.mjs::V10b`（干净树分支；待 plan Task N）。**不指向 `cli.test.mjs`**：`check-all.mjs` 会跑 `node --test`，测试文件里再跑 `npm run check` 就是无限派生（第 1 轮评审 F4）；该约束由 TC-067 静态断言守。直接手敲 `npm run check` 只允许作为人工排障，不作为自动化判据
- **不覆盖**：不覆盖 CI 环境的 Node 版本差异（R13 只要求 ≥22）；不覆盖 V10b 前半（TC-051）；**被 `check-all` 嵌套调用时本条的「干净树」前提不成立**（外层 V10 正持有 `rules/tmp-new-rule-V10.md`，R9 步5 会先报 `UnregisteredHandwritten`）——该场景由 spec §7.2 的显式 `t.skip()` 处理（见上），skip 数必须可辨认，不得用它冒充 PASS

### TC-050 单跑 V10：自建 `rules/tmp-new-rule-V10.md` → `npm run check` 非 0 且含 UnregisteredHandwritten

- **覆盖**：`V10`；`§7.2` 接线；`§7.4` **临时文件唯一名（V10 用 `tmp-new-rule-V10.md`）**；`R11` 清理
- **前置**：`rules/tmp-new-rule-V10.md` 与 `rules/tmp-new-rule-V4.md` 均不存在（V10 自建前者）；记录跑前 `git status --short rules/` 为空
- **步骤**：① `node tools/docgen-spike/run.mjs --case V10`；② 检查其内部 `npm run check` 的结果；③ 用例后检查两个文件与 git status
- **预期**：①退出码 0 且 stdout 含 `PASS V10`；②该例断言「check 退出码非 0 且输出含 `UnregisteredHandwritten`」；③`-V10.md` 不存在、`-V4.md` 不存在、git status 为空
- **判据**：`run.mjs --case V10` 退出码 0 且 stdout 匹配 `/PASS V10/`；随后 `assert.strictEqual(fs.existsSync('rules/tmp-new-rule-V10.md'), false)` 且 `assert.strictEqual(fs.existsSync('rules/tmp-new-rule-V4.md'), false)`；`git status --short rules/` 输出 0 行
- **红绿证据**：红① = 应用 `MUT-45`（check-all 里不接 gate）→ V10 内 check 退出 0，该例 FAIL；红② = 应用 `MUT-84`（V4 与 V10 共用同一个文件名）→ 外层的 `-V4.md` 会被本用例的 `finally` 误删，TC-041 与 TC-050 在嵌套链里互相打红；绿 = 接线且两个唯一名都不被改成共用名时 PASS
- **对应测试**：`tools/docgen-spike/run.mjs::V10`（待 plan Task N）。**不指向 `cli.test.mjs`**：若 V10 的编排落在测试文件里，`check-all.mjs` 跑 `node --test` 时会经「测试 → `npm run check` → `check-all` → `node --test`」无限派生（第 1 轮评审 F4）；`run.mjs` 侧的 `DOCGEN_CHECK_ACTIVE=1` 是第二道闸，TC-067 静态断言把「测试文件不得出现 `npm run check` / `check-all`」钉死
- **不覆盖**：不覆盖 V10 与 V4 同时运行时的文件竞争（`--case` 单值，串行；唯一名的作用是**嵌套链**里互不误删，见 §0）；不覆盖 V10 内部 gate 的细节（TC-051/TC-052 各自覆盖）；不覆盖哨兵自愈（TC-057）

### TC-051 target 副本改 1 个可打印字节 + `--gate` → Mismatch（门的比对能力；经 `--case V10b` 前半执行）

- **覆盖**：`V10b` 前半；`R6`「不能只做基线」；`§7.2`「涉及 check 的 e2e 在 `DOCGEN_CHECK_ACTIVE=1` 下显式 `t.skip()`」；`§7.3`「`--case Vn` 内的副本由用例代码在启动清理之后自建（第①类），此类 spawn 不得预置」；`§7.4`「测试侧 spawn 一律带 `--no-clean`」；`§7.1`「断言模式与前置错误」（`Mismatch` 正是 V10b 前半的期望 → 按命中处理：`PASS V10b` + exit 0）
- **前置**：`.tmp-test/V10b/target.md` = 真 target 改 1 个 ASCII 字节（如把某处 `x` 改成 `y`；**由 `run.mjs --case V10b` 的用例代码在启动清理之后自建**，测试只传路径、不得预置——本副本属 §7.3 第①类（`--case Vn` 内），预置也违反归属）；真 target SHA256 先记录
- **嵌套 check 场景的执行约束（spec §7.2）**：该测试在 `DOCGEN_CHECK_ACTIVE=1` 可见时**显式 `t.skip()`**——`test('V10b > gate 比对能力', { skip: process.env.DOCGEN_CHECK_ACTIVE === '1' ? 'nested check: 外层 V10 持有 rules/tmp-new-rule-V10.md，基线步5 先于比对（spec §7.2）' : false }, ...)`，原因串必须出现在 TAP 的 `# SKIP` 行；skip 只针对「被 check 嵌套」这一场景，`run.mjs` 串行编排或单跑 `node --test`（无该变量）时**照常执行**
- **步骤**：① `node tools/docgen-spike/run.mjs --case V10b --no-clean`（前半：该例启动后自建 `target.md` 副本，再以 `--target` 跑内部 `--gate`；`--no-clean` 是 §7.4 对测试侧 spawn 的硬要求——不得清掉外层正在使用的 ROOT）；② 检查输出与退出码；③ 重算真 target SHA256
- **预期**：输出含 `Mismatch`（含 line/byte，前半命中即本例期望）；stdout 含 `PASS V10b`、**退出码 0**（不是 1：`Mismatch` 是 V10b 的期望结果，按 §7.1「断言模式与前置错误」命中处理）；③不变；本测试只在「被 check 嵌套」时 skip，其它两条路径不得 skip
- **判据**：`run.mjs --case V10b --no-clean` 退出码 `=== 0`，stdout 同时匹配 `/PASS V10b/`、`/Mismatch/`、`/line=\d+/`，且**不**匹配 `/FAIL V10b/`；两次 SHA256 一致；**且** `node --test tools/docgen-spike/test/cli.test.mjs`（不设 `DOCGEN_CHECK_ACTIVE`）输出里本用例不得出现 `# SKIP`（反例 `MUT-93`）
- **红绿证据**：红① = 应用 `MUT-46`（gate 只做基线不做 compare）→ 前半拿不到 `Mismatch`，该例判 `FAIL V10b` + exit 1，本用例的 `PASS V10b` / exit 0 断言 FAIL；红② = 应用 `MUT-93`（无条件 skip 或不看变量）→ 单跑时出现 `# SKIP`，末条判据 FAIL；红③ = 应用 `MUT-95`（测试侧 spawn 漏掉 `--no-clean`）→ 嵌套时清掉外层 ROOT，外层用例随执行顺序随机红绿（§0 的 owner 归属即为此）；绿 = 三者都不应用时 PASS
- **对应测试**：`tools/docgen-spike/test/cli.test.mjs::V10b > gate 比对能力`（待 plan Task N；测试体带 `DOCGEN_CHECK_ACTIVE=1` 的显式 skip 选项，spawn 命令为 `run.mjs --case V10b --no-clean`）。**为什么不再单跑 `--gate --target <副本>`**：`--gate` 属非 `--case` 模式，副本**理论上**可以在 spawn 前预置（须带 `--no-clean`），但此时 ROOT 的归属在两次 spawn 之间已切换——前一次用例的退出钩子已把 ROOT 删掉，预置的副本得由测试自己重建并断言存在，等于把 V10b 前半的语义抄一遍；因此仍按「该例自建」执行，既省一套预置逻辑，也保持「V10b 是一个整体」的语义
- **不覆盖**：不覆盖同时出现基线错与内容错的优先级（TC-052）；**被 `check-all` 嵌套调用时会先命中 V10 留下的 `UnregisteredHandwritten`（基线第 5 步先于比对），本条的 `Mismatch` 期望只在干净树下成立**——该场景由 spec §7.2 的显式 `t.skip()` 处理（见上）；skip 不得被当作通过，也不得扩大到串行编排路径

### TC-052 `--gate` + 漂移 baseline 副本 → BaselineDrift，不因 target 一致而假绿（经 `--case V7` 的漂移分支执行）

- **覆盖**：`R6`「入口基线校验」；`R9`；`§7.3`（V7 行：复制 baseline 到 `.tmp-test/V7/`，副本由 `run.mjs --case Vn` 的用例代码在启动清理之后自建——`--case` 分支（第①类））；`§7.4`（测试侧 spawn 带 `--no-clean`）；`§7.1` 断言模式（`BaselineDrift` 是 V7 的期望结果 → `PASS V7` + exit 0，不是 exit 2）
- **前置**：`.tmp-test/V7/` 下由该例自建的那份「删一条」baseline 副本（文件名由 V7 用例代码决定，**测试不预置**——本副本属 `--case Vn` 内（§7.3 第①类），由用例代码在启动清理之后自建；预置还会被启动清理删掉 → 误报 `InvalidBaseline` 而不是 `BaselineDrift`）；target 未改
- **步骤**：① `node tools/docgen-spike/run.mjs --case V7 --no-clean`（该例启动后自建副本，再走 gate 的基线步；`--no-clean` 是 §7.4 对测试侧 spawn 的硬要求）；② 检查输出与退出码；③ 复算真 `baseline.json` 与 target 的 SHA256
- **预期**：输出含 `BaselineDrift`（漂移分支命中即本例期望）；stdout 含 `PASS V7`、**退出码 0**（§7.1：该码正是本例期望时按命中处理，不再套用「baseline 类 → 2」）；**不得**输出 `baseline 21/21`（否则就是「target 一致但基线已漂移」的假绿）；③两份 SHA256 不变
- **判据**：`node tools/docgen-spike/test/cli.test.mjs` 退出码 0；断言 `R6 > gate 基线能力` 通过——内部 spawn `run.mjs --case V7 --no-clean`，`exitCode === 0`、输出匹配 `/PASS V7/`、`/BaselineDrift/`，且 `doesNotMatch(/baseline 21\/21/)`、`doesNotMatch(/FAIL V7/)`；两份 SHA256 前后 `strictEqual`
- **红绿证据**：红 = 应用 `MUT-47`（gate 里把基线校验包在 `try{}catch{}` 里吞掉）→ 输出 21/21、该例判红（`FAIL V7` + exit 1），本用例 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/cli.test.mjs::R6 > gate 基线能力`（待 plan Task N）
- **不覆盖**：不覆盖 `--gate` 与 `--case` 同时给出的行为（spec §7.1 已定为互斥并以 exit 2 拒绝，由 TC-063 覆盖）；**不再单跑 `--gate --baseline <副本>`**：该路径理论上可带 `--no-clean` 预置副本（§7.3 第②类），但会与「V7 副本由该例自建」的语义重复，且另起一次 spawn 时前一次用例的退出钩子已把 ROOT 删掉、副本须由测试重建并断言存在——本用例只锁「不假绿」，不为它再造一套预置逻辑

### TC-053 退出码 1：`--case V1` + 差异 target → 用例未达预期

- **覆盖**：`R10` 退出码 1；`§7.1` 断言模式（差异内容属「用例期望未命中」→ `FAIL V<n>` + exit 1；不是 2/3 的前置错误档）；`§7.3`（副本由 `run.mjs --case Vn` 的用例代码在启动清理之后自建）；`§7.4`（测试侧 spawn 带 `--no-clean`）
- **前置**：`.tmp-test/TC-053/target.md` = 真 target 改 1 字节（V1 期望字节相等，必然不达；**由 `run.mjs --case V1` 的用例代码在启动清理之后自建**，测试只传路径、不预置——本副本属 `--case Vn` 内（§7.3 第①类））
- **步骤**：① `node tools/docgen-spike/run.mjs --case V1 --target tools/docgen-spike/.tmp-test/TC-053/target.md --no-clean`（测试内 spawn 一律带 `--no-clean`，§7.4）；② 检查退出码与输出
- **预期**：退出码恰为 1；stdout 含 `FAIL V1`（不得是 `PASS V1`）；也不得出现 `EnvironmentEOL` / `TargetReadFailed` / `TemplateReadFailed`（副本是合法 LF 文本、确实存在，不该落到 2/3 档）
- **判据**：命令退出码 `=== 1`；stdout 匹配 `/FAIL V1/` 且 `doesNotMatch(/PASS V1|EnvironmentEOL|TargetReadFailed|TemplateReadFailed/)`
- **红绿证据**：红 = 应用 `MUT-48`（任何情况都返回 0）→ 退出码 0，本用例 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/cli.test.mjs::R10 > 退出码 1`（待 plan Task N）
- **不覆盖**：不覆盖多个用例部分失败时的汇总（省略 `--case` 时全跑，见 TC-062）

### TC-054 退出码 2：`--case V1` + CRLF 模板 → 环境前置失败

- **覆盖**：`R10` 退出码 2；`§6.2`；`§7.1` 断言模式（`EnvironmentEOL` 不是 V1 的期望结果 → 用它自己的退出码 2，不套「命中期望 → PASS」；同一 `EnvironmentEOL` 在 V8 里才是期望 → TC-026 判 `PASS V8`）；`§7.3`（副本由 `run.mjs --case Vn` 的用例代码在启动清理之后自建）；`§7.4`（测试侧 spawn 带 `--no-clean`）
- **前置**：`.tmp-test/TC-054/tpl-crlf.tpl` = 真模板 CRLF 化（**由 `run.mjs --case V1` 的用例代码在启动清理之后自建**，测试只传路径、不预置——本副本属 `--case Vn` 内（§7.3 第①类），预置也会被启动清理删掉 → 误报 `TemplateReadFailed`）
- **步骤**：① `node tools/docgen-spike/run.mjs --case V1 --template tools/docgen-spike/.tmp-test/TC-054/tpl-crlf.tpl --no-clean`（测试内 spawn 一律带 `--no-clean`，§7.4）；② 检查退出码与输出
- **预期**：退出码恰为 2（`EnvironmentEOL` 不是 V1 的期望 → 用它自己的档位 2，不套「命中期望 → `PASS V1`」；只有当该码正是本例期望时才 `PASS` + 0，见 TC-026 的 V8）；输出含 `EnvironmentEOL` 与 `violation=CR`；不得输出 `PASS V1`、也不得输出 `FAIL V1`（后者是「期望未命中」的 exit 1 形态）
- **判据**：命令退出码 `=== 2`；输出匹配 `/EnvironmentEOL/` 与 `/violation=CR/`，且 `doesNotMatch(/PASS V1|FAIL V1/)`
- **红绿证据**：红 = 应用 `MUT-49`（退出码全用 1）→ 得到 1，本用例 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/cli.test.mjs::R10 > 退出码 2`（待 plan Task N）
- **不覆盖**：不覆盖 baseline 类错误映射到 2 的路径（TC-057 覆盖）

### TC-055 退出码 3：`--gate` + 模板不存在 → IO 失败

- **覆盖**：`R10` 退出码 3；`§7.2 步③`
- **前置**：`.tmp-test/TC-055/nope.tpl` 不存在
- **步骤**：① `run.mjs --gate --template <不存在的副本>`；② 检查退出码与输出
- **预期**：退出码恰为 3；输出含 `TemplateReadFailed`；不得报 `EnvironmentEOL`
- **判据**：命令退出码 `=== 3`；输出匹配 `/TemplateReadFailed/`
- **红绿证据**：红 = 应用 `MUT-49`（退出码全用 1）→ 得到 1，本用例 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/cli.test.mjs::R10 > 退出码 3`（待 plan Task N）
- **不覆盖**：不覆盖依赖缺失（零依赖，R13/TC-060）

### TC-056 `--raw` → 错误原文冒泡且固定退出 2

- **覆盖**：`§7.1` --raw；`R10`
- **前置**：同 TC-055 的缺失模板
- **步骤**：① `run.mjs --raw --gate --template <不存在>`；② 检查输出与退出码
- **预期**：输出为原始错误文本（含 `ENOENT` 或 `TemplateReadFailed` 原文之一）；退出码恰为 2（不是 3）
- **判据**：命令退出码 `=== 2`；stderr 或 stdout 非空且不是 `PASS/FAIL` 汇总格式（不匹配 `/PASS V\d/`、`/FAIL V\d/`）
- **红绿证据**：红 = 应用 `MUT-50`（`--raw` 未识别，走普通路径）→ 退出码 3，本用例 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/cli.test.mjs::§7.1 > raw`（待 plan Task N）
- **不覆盖**：不判 `--raw` 下是否仍写临时文件（spec 未定）

### TC-057 启动清 `.tmp-test/` + 哨兵自愈（精确串）；近失与非哨兵内容 fail-closed（退出 2）

- **覆盖**：`R11`；`§7.4` 启动段（只删 `tools/docgen-spike/.tmp-test/` 并重建 `ROOT`；对 V4/V10 唯一临时文件做哨兵自愈：**内容 === 各自写入的固定串** → 删除并打印「已清理上次中断残留」，否则按 `UnregisteredHandwritten` fail-closed）；`§7.4`「ROOT 归属」（顶层 owner 不带 `--no-clean`，嵌套进程才带）；`§7.2`（**本条已列入涉及 check 的 e2e skip 清单**）；`§5.4`（`SENTINEL_V4` / `SENTINEL_V10` **从 `specTestCaseGate.mjs` 导出**，V4/V10 与测试引用同一常量，禁止猜字符串）；`§7.3`（副本归属两分：`--case Vn` 内的副本由用例代码自建；非 `--case` 模式可带 `--no-clean` 预置；**本条是 owner、不带 `--no-clean`，属唯一明文例外**——允许预置 `.tmp-test/stale/x.md`）；`§7.4` **临时文件唯一名（V4 `-V4.md` / V10 `-V10.md`）**；`§6.3 步5` 的可观测后果
- **前置**：测试自己预置四份「上次被 SIGKILL」的现场，**哨兵常量一律 import 自模块、不在本文件写字符串**：`import { SENTINEL_V4, SENTINEL_V10 } from '<仓库根>/tools/docgen-spike/specTestCaseGate.mjs'`（§5.4 的导出点；不得用 `run.mjs` 里的另一份副本，也不得在测试里硬编码字面量——那会退化成自证循环）
  1. `tools/docgen-spike/.tmp-test/stale/x.md`（ROOT 内残留；**测试在 spawn 前先 `assert.strictEqual(fs.existsSync(...), true)` 断言它确实被建出来**，否则「启动后被删」是空断言）
  2. `rules/tmp-new-rule-V4.md`，内容 = `SENTINEL_V4`（**精确等于**，逐字节）→ 应被自愈删除
  3. `rules/tmp-new-rule-V10.md`，内容 = `SENTINEL_V10 + '\n# extra\n'`（近失：不等于哨兵串）→ 不得删
  4. `rules/tmp-new-rule-TC057.md`，内容 = 任意非哨兵文本 → 不得删

  三个 `rules/` 下的文件**不在 ROOT 内**（§7.3 的副本归属只管 `.tmp-test/` 里的预置），启动清理不会删它们——这正是「模拟残留」的必要条件；第 1 项在 ROOT 内，而本条 spawn **不带 `--no-clean`**（owner），属 spec §7.3 给出的**唯一明文例外**（「TC-057 要验『启动先删 ROOT』，允许在 spawn 前预置 `.tmp-test/stale/x.md`」），不构成违规
- **步骤**：① `node tools/docgen-spike/run.mjs --case V1`（**不带 `--no-clean`**：本条就是顶层 owner，验的正是启动清理与哨兵自愈，带上等于把被测行为关掉；被 `DOCGEN_CHECK_ACTIVE=1` 嵌套时按 §7.2 显式 `t.skip()`，不会以嵌套身份执行）；② 检查四个路径是否存在；③ 取退出码与 stdout；④ 测试自己在 `finally` 里删除仍存在的 `-V10.md` 与 `TC057.md` 并复检为 `false`
- **预期**：①`.tmp-test/stale/x.md` **不存在**（ROOT 先被删再重建，且 spawn 前它确实存在）；②`-V4.md` **不存在**（与 `SENTINEL_V4` 逐字节相等 → 自愈）且 stdout 含「已清理上次中断残留」；③`-V10.md` **仍存在**（与 `SENTINEL_V10` 只差一个追加行 → 近失不算哨兵，必须精确相等才自愈）；④`TC057.md` **仍存在**；⑤退出码恰为 2（两个残留让 baseline 步5 报错 → `UnregisteredHandwritten` 的档位是 2；它**不是** V1 的期望，故按自己的档位退出，只有当该码正是本例期望时才 `PASS V1` + exit 0），输出含 `UnregisteredHandwritten` 且**不**出现 `PASS V1`
- **判据**：`run.mjs --case V1` 退出码 `=== 2`；stdout 匹配 `/UnregisteredHandwritten/`、`/已清理上次中断残留/`，且 `doesNotMatch(/PASS V1/)`；`assert.strictEqual(fs.existsSync('tools/docgen-spike/.tmp-test/stale/x.md'), false)`；`assert.strictEqual(fs.existsSync('rules/tmp-new-rule-V4.md'), false)`；`assert.strictEqual(fs.existsSync('rules/tmp-new-rule-V10.md'), true)`；`assert.strictEqual(fs.existsSync('rules/tmp-new-rule-TC057.md'), true)`；`finally` 删除后两者并复检 `false`。**常量来源断言**：测试里不得出现哨兵字面量——`const src = fs.readFileSync('tools/docgen-spike/test/cli.test.mjs','utf8'); assert.ok(!src.includes(SENTINEL_V4) && !src.includes(SENTINEL_V10))`（用 `includes` 而不是拼 `RegExp`：哨兵串可能含正则元字符，拼正则会随机误判；更稳妥的是 CI 侧静态扫描，标为待 plan Task N）
- **红绿证据**：红① = 应用 `MUT-51`（启动无条件删 `rules/tmp-new-rule-*.md`、不校验内容）→ ③④两个非哨兵文件消失，第三/第四断言 FAIL；红② = 应用 `MUT-85`（哨兵比对写成 `includes` 或前缀匹配）→ ③近失文件被误删，第三断言 FAIL；红③ = 应用 `MUT-86`（启动不删 ROOT）→ `stale/x.md` 残留，第一断言 FAIL；红④ = 把测试里的 `SENTINEL_V4` 换成手抄字面量、同时把 `specTestCaseGate.mjs` 的常量改一个字符 → 本用例仍绿（说明已退化），常量来源断言 FAIL；绿 = 三个 MUT 都不应用、且常量确实 import 自模块时 PASS
- **对应测试**：`tools/docgen-spike/test/cli.test.mjs::R11 > 启动清理与哨兵自愈`（待 plan Task N）。**执行约束**：本条会写入并删除 `rules/tmp-new-rule-V10.md`（近失内容会覆盖外层 V10 的哨兵），spec §7.2 已把**本条列入同一份 skip 清单**——被 `check-all` 嵌套（`DOCGEN_CHECK_ACTIVE=1` 可见）时**显式 `t.skip()`**，原因写「本条读写 `rules/tmp-new-rule-V10.md`，与外层 V10 冲突」；串行/单跑时照常执行（此时它是 owner，spawn 不带 `--no-clean`）
- **不覆盖**：不覆盖真实 SIGKILL（见 §5 手工项与 §7.1「真实中断」行）；不覆盖 SIGINT / SIGTERM 的同步清理（要 spawn 子进程并在确切的写文件窗口发信号，属另一类时序，登记 §5 人工项）；不覆盖「删除失败则保留、下次启动清理」的**删除失败**分支（Windows 下构造文件被占用不可靠，登记 §5 手工项）；**被 `check-all` 嵌套调用时会删掉外层 V10 的 `-V10.md` 哨兵**（本条故意写同名文件）——该场景由 spec §7.2 的显式 `t.skip()` 处理，skip 不得被当作通过

### TC-058 连跑两遍全部用例（stdout 内存比对）→ 两遍逐字一致、git status 空、`.tmp-test/` 无残留且被 gitignore

- **覆盖**：`V9`；`R4`；`R11`；`§7.4` **退出钩子（删除本次创建的 `.tmp-test/`；删不掉则保留、下次启动清理）**；`§7.3` V9 行（`git check-ignore -q tools/docgen-spike/.tmp-test/x` 退出 0）；`§3.1` `.gitignore` 行；`§7.5`（V9 属「全量收口」，**不在节点 1–3**；PRD §8 表与索引 P1 状态仍须等全量 13 例全绿后一次性写——本条只验 V9 的可观测后果，不替 PRD 落账）
- **前置**：干净树；`rules/tmp-new-rule-V4.md` 与 `rules/tmp-new-rule-V10.md` 均不存在；`tools/docgen-spike/.tmp-test/` 不存在
- **步骤**：① 用 Node 驱动在**内存**里跑两遍 `node tools/docgen-spike/run.mjs`（`execFileSync` 捕获 stdout，退出码非 0 由 `execFileSync` 直接抛出）；② `assert.strictEqual(out1, out2)`；③ `git status --short rules/`、`git status --short tools/docgen-spike/`；④ `fs.existsSync('tools/docgen-spike/.tmp-test')`；⑤ `git check-ignore -q tools/docgen-spike/.tmp-test/x`
- **关键约束（F13）**：**两遍日志都不许落到 `.tmp-test/` 里**——第二遍启动会删掉整个 `ROOT`，落在里面的 `run1.txt` 会在比对前消失（这正是第 1 轮评审抓到的自毁判据）；也不许写到仓库其它位置（R7 的写入白名单只有 `.tmp-test/`，写到外面等于污染工作区）。唯一可行落点是**内存**
- **预期**：①两遍退出码都 0（`execFileSync` 不抛）；②两段 stdout 逐字符相等；③两条 git status 都 0 行；④`.tmp-test/` **不存在**（进程退出后无残留；§7.4 退出钩子负责删，删不掉则保留并由下次启动清，见 TC-057）；⑤退出码 0（`.tmp-test/` 已进 `.gitignore`，临时文件永远不会被误提交）
- **判据**：以下四条全部成立——
  1. `node -e "const{execFileSync}=require('node:child_process'),assert=require('node:assert'),fs=require('node:fs');const run=()=>execFileSync(process.execPath,['tools/docgen-spike/run.mjs'],{encoding:'utf8'});const a=run(),b=run();assert.strictEqual(a,b);assert.strictEqual(fs.existsSync('tools/docgen-spike/.tmp-test'),false)"` 退出码 0（**内存比对 + 无残留**一次判完）
  2. `git status --short rules/` 输出 0 行
  3. `git status --short tools/docgen-spike/` 输出 0 行
  4. `git check-ignore -q tools/docgen-spike/.tmp-test/x` 退出码 0
  全部判据只用 Node 内置与 `git`，**不用** `diff` / `test -d`（见 §0 断言工具约定）
- **红绿证据**：红① = 应用 `MUT-87`（去掉退出钩子里的 `fs.rmSync(ROOT)`，只在启动清）→ 跑完 `.tmp-test/` 仍存在，判据 1 FAIL；红② = 应用 `MUT-09`（render 拼时间戳）→ 两遍 stdout 不同，判据 1 FAIL；红③ = 去掉 `.gitignore` 里的 `tools/docgen-spike/.tmp-test/`（`MUT-79`）→ 判据 4 退出 1，本用例 FAIL；绿 = 都不应用时四条全 PASS。**注**：`MUT-37`（`finally` 不删用例目录）自 §7.4 退出钩子落地后不再由本条抓住（进程退出时整体删 ROOT），它只由 TC-041 的「用例结束文件不存在」断言抓
- **对应测试**：`tools/docgen-spike/run.mjs::V9`（编排层）+ 上述 Node 驱动（判据落点是独立驱动，**不放进 `*.test.mjs`**：`run.mjs` 全量跑会经 V10 调 `npm run check`，若本条又挂在测试文件里就构成自递归，见 §0 硬约束与 TC-067）。待 plan Task N
- **不覆盖**：不覆盖并发两个进程同时跑（`--case` 设计为串行，spec 未要求并发）；不覆盖真实 SIGKILL（TC-057 与 §5 人工项）；不覆盖「退出钩子删除失败」分支（保留后由下次启动清，Windows 下不可靠构造，§5 人工项）；`--case` 全量汇总为 **13** 例（V1–V11 + V2b + V10b），由 TC-062 精确断言

### TC-059 `TARGET_GIT_HASH` 与 `TARGET_SHA256` 常量与实文件一致（双保险）

- **覆盖**：`R12`
- **前置**：target 未被改动（`git status --short rules/spec-testcase-gate.md` 空）
- **步骤**：① 读模块导出的两个常量；② 跑 `git hash-object rules/spec-testcase-gate.md`；③ 用 `crypto.createHash('sha256').update(fs.readFileSync('rules/spec-testcase-gate.md')).digest('hex')` 算 SHA256（不用 `sha256sum`，见 §0 断言工具约定）
- **预期**：两个常量分别等于②③的结果；且两个常量都存在（不得只锁一个）
- **判据**：`node --test tools/docgen-spike/test/baseline.test.mjs` 退出码 0；断言 `R12 > 双哈希一致` 通过（两次 `strictEqual`）
- **红绿证据**：红 = 应用 `MUT-52`（只保留 SHA256，删掉 git hash）→ 断言「两个都存在」FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/baseline.test.mjs::R12 > 双哈希一致`（待 plan Task N）
- **不覆盖**：不覆盖 `.gitattributes` 未生效时工作区被 autocrlf 改写的情形（§8 建议 8 已由 R15 落地；现场克隆仍属人工，见 §5）

### TC-060 三个模块的 import 全为 Node 内置 → 零第三方依赖；纯模块不得用 `child_process`

- **覆盖**：`R13`；`§5.5` 静态约束（「`child_process` 不在允许依赖内」）
- **前置**：`specTestCaseGate.mjs`、`compare.mjs`、`run.mjs` 已落地
- **步骤**：① 提取三文件的 `import ... from '<spec>'`；② 检查每个 spec 是否以 `node:` 开头；③ 单独检查 `specTestCaseGate.mjs` 与 `compare.mjs` 是否 import 了 `node:child_process`（或用 `require`/动态 `import()` 取到它）；④ `npm ls --depth=0` 或检查 `node_modules` 是否新增
- **预期**：②全部以 `node:` 开头（`node:fs`/`node:path`/`node:crypto`/`node:assert`/`node:test`/`node:child_process`）；③两个纯模块都不出现 `child_process`（否则可 `execSync('cat target')` 绕过 fs 探针）；④无新增依赖目录
- **判据**：`node --test tools/docgen-spike/test/cli.test.mjs` 退出码 0；断言 `R13 > 只用内置模块`、`R13 > 纯模块无 child_process` 通过（内部对文件逐个 `assert` 前缀 + 对两个纯模块 `assert.ok(!src.includes('child_process'))`）
- **红绿证据**：红① = 应用 `MUT-53`（`compare.mjs` 改为 `import _ from 'lodash'`）→ 断言 FAIL；红② = 应用 `MUT-67`（`specTestCaseGate.mjs` 用 `execSync('cat <target>')` 取内容）→ 纯模块断言 FAIL，且 TC-005 的 fs 探针也抓不到；绿 = 都不应用时 PASS
- **对应测试**：`tools/docgen-spike/test/cli.test.mjs::R13 > 只用内置模块`（待 plan Task N）
- **不覆盖**：不覆盖 Node 22 与 24 的 API 差异（R13 只要求 ≥22）

### TC-061 全部用例跑完后 target 与模板未被改写（R7 + R12 全局后置）

- **覆盖**：`R7`；`R12`
- **前置**：跑全部用例前记录 `git hash-object` 与 SHA256（target、模板、baseline 三份）
- **步骤**：① 跑全部用例（含 V4/V10 与所有故障注入）；② 重算三份哈希；③ `git status --short rules/`、`git diff --stat tools/docgen-spike/rule.md.tpl`
- **预期**：②三份哈希全部不变；③两条输出为空
- **判据**：`node tools/docgen-spike/run.mjs` 退出码 0；三组哈希逐对相等（`strictEqual`）；`git status --short rules/` 0 行；`git diff --stat tools/docgen-spike/rule.md.tpl` 0 行
- **红绿证据**：红 = 应用 `MUT-54`（V8 的 BOM 注入直接改真 target）→ 哈希变化，本用例 FAIL；绿 = 撤掉 MUT 后 PASS
- **对应测试**：`tools/docgen-spike/test/cli.test.mjs::R7 > 目标只读`（待 plan Task N）
- **不覆盖**：不覆盖「用例失败后 Ctrl-C 中途退出」的残留（TC-057 已覆盖其可观测后果）

### TC-062 `--case V1` 只跑该例；省略 `--case` 跑 **13** 例（V1–V11 + V2b + V10b）并输出 `13/13 PASS`

- **覆盖**：`§7.1`「省略 --case = 跑全部（**13** 例）」+「省略 `--case` 跑 V1–V11 + V2b + V10b = **13** 个用例」+ 枚举 `V1..V11|V2b|V10b`；`§7.3` V10b 行「计入全量 13」；`V9` 的汇总格式
- **前置**：干净树；`rules/tmp-new-rule-V4.md` 与 `rules/tmp-new-rule-V10.md` 均不存在；`.tmp-test/` 不存在；`scripts/check-all.mjs` 已接线（全量含 V10/V10b，两例都会各起一次 `npm run check`）
- **步骤**：① `node tools/docgen-spike/run.mjs --case V1`（单值段，可在 `cli.test.mjs` 内 spawn，带 `--no-clean`）；② `node tools/docgen-spike/run.mjs`（无参数 = 13 例全量；**由顶层 owner 执行**——不进 `*.test.mjs`、不设 `DOCGEN_CHECK_ACTIVE`，理由见「对应测试」）；③ 比对两次输出的用例编号集合与汇总行
- **预期**：①输出只含 `V1` 的结果行（不出现 `V2`、`V2b`、`V10b` 等）；②输出含 V1–V11 + V2b + V10b **全部 13 个**结果行，其中 `PASS V2b`、`PASS V10b` 各 1 行，末行恰为 `13/13 PASS`（`total = 13`，V10b **计入**）；两次退出码都 0
- **判据**：①stdout 匹配 `/^PASS V1$/m`，且不匹配 `/PASS V(2|2b|3|4|5|6|7|8|9|10|10b|11)\b/`，`^PASS V\d+b?$` 行数 `=== 1`；②stdout 匹配 `/^PASS V2b$/m`、`/^PASS V10b$/m`、`/^PASS V11$/m`、`/^13\/13 PASS$/m`，且 `^PASS V\d+b?$` 行数 **`=== 13`**（V1–V11 共 11 行 + V2b 1 行 + V10b 1 行）；两次退出码 `=== 0`；**不得**再接受 `11/11`、`12/12`、`11/12` 等其它总数（V10b 不计入是第 8 轮已废除的旧口径）
- **红绿证据**：红① = 应用 `MUT-55`（`--case` 被忽略，永远全跑）→ ①里出现 `V2`，本用例 FAIL；红② = 应用 `MUT-88`（全量总数写死 11、把 V2b 排除在编排外）→ ②的行数与 `13/13` 断言 FAIL；红③ = 应用 `MUT-89`（**全量总数写死 12、把 V10b 排除在无参编排外**——即第 8 轮前的旧口径）→ ②的行数变 12、汇总变 `12/12`，本用例 FAIL；绿 = 三者都不应用时 PASS
- **对应测试**：① `tools/docgen-spike/test/cli.test.mjs::§7.1 > case 语义`（待 plan Task N）；② **独立 Node 驱动**（与 TC-058 同形，不进 `*.test.mjs`）——全量必含 V10/V10b，两例都会调 `npm run check`，若本条挂在测试文件里就构成「测试 → check → node --test → 测试」无限派生（§0 硬约束与 TC-067）；驱动作为顶层 owner 执行，**不带** `--no-clean`
- **不覆盖**：不覆盖 `--case` 传入非法值（如 `V12`）与四模式同给的行为——见 TC-063 / TC-071；`--case V10b` 的**内部断言**由 TC-049/TC-051 覆盖，但它的 `PASS V10b` 必须在本条的全量里出现（两者是同一集合的两个视角，见 TC-049 的一致性说明）

### TC-063 `--gate` / `--case` / `--compare` 两两同给 → exit 2 + stderr 互斥提示；`--case` 不在 `V1..V11|V2b|V10b` 内 → exit 2 + usage

- **覆盖**：`§7.1`「`--gate` / `--case` / `--write-baseline` / `--compare` **四者互斥**；同给 → exit 2 + stderr 提示」「`--case` 非 `V1..V11|V2b|V10b` → exit 2 + usage」；`R10` 退出码 2；`R14`（`--compare` 只接受 `.tmp-test/**`）
- **前置**：干净树；`rules/tmp-new-rule-V4.md` 与 `rules/tmp-new-rule-V10.md` 均不存在；记录跑前 `git status --short tools/docgen-spike/` 为空
- **步骤**：① `node tools/docgen-spike/run.mjs --gate --case V1`（`--gate` 在前、在后各跑一次，共 2 次）；② `node tools/docgen-spike/run.mjs --case V12`；③ `node tools/docgen-spike/run.mjs --case V1 --compare tools/docgen-spike/.tmp-test/TC-063/gen.md`（**`--compare` 也是模式之一**，与 `--case` 同给同样必须被拒）；④ 四次各自取退出码与 stderr/stdout 文本；⑤ 跑后查 `git status --short tools/docgen-spike/`。四次都由 `cli.test.mjs` spawn，按 §0/§7.4 一律带 `--no-clean`（本条在参数解析阶段即退出 2，`--no-clean` 只保证不清外层 ROOT）
- **预期**：四次退出码都恰为 2；①stderr 同时出现 `--gate` 与 `--case` 两个字面量，并含「互斥 / 不可同用 / 不能同用 / mutually exclusive」之一，两次都不得进入任一模式；②stderr 含 usage（列出 `V1..V11` 的可选值，`V2b` / `V10b` 可出现）；③stderr 同时出现 `--case` 与 `--compare` 及互斥措辞，且不得因生成物不存在而先报 `GeneratedMissing`（模式冲突在校验阶段先短路）；四次都不得出现 `PASS V*` / `FAIL V*` 汇总行、不得写盘；⑤仍为空
- **判据**：四次命令退出码 `=== 2`；①两次 stderr 均匹配 `/--gate/` 且 `/--case/` 且 `/互斥|不可同用|不能同用|mutually exclusive/i`；②stderr 匹配 `/V1\.\.V11/` 且 `/usage|用法/i`；③stderr 匹配 `/--case/` 且 `/--compare/` 且 `/互斥|不可同用|不能同用|mutually exclusive/i`，且 `doesNotMatch(/GeneratedMissing/)`；四次输出均不匹配 `/PASS V\d/`、`/FAIL V\d/`；`git status --short tools/docgen-spike/` 输出 0 行
- **红绿证据**：红① = 应用 `MUT-58`（去掉互斥校验，按参数出现顺序取最后一个）→ ①跑成一次正常执行（退出 0 或 1，且出现 `PASS V1`），本用例 FAIL；红② = 应用 `MUT-64`（`--case` 不校验枚举，`V12` 被当成「未知用例，跳过」）→ ②退出 0，本用例 FAIL；红③ = 应用 `MUT-90`（互斥只覆盖三模式、漏掉 `--compare`）→ ③跑成 `--compare` 分支报 `GeneratedMissing`（exit 3），本用例 FAIL；绿 = 三者都不应用时 PASS
- **对应测试**：`tools/docgen-spike/test/cli.test.mjs::§7.1 > 模式互斥`（待 plan Task N）
- **不覆盖**：不覆盖「同给时该优先谁」——spec 已定为不允许同给，不存在优先级；不覆盖 `--case v1`（小写）——spec 只列大写 `V1..V11|V2b|V10b`，未规定大小写归一，本文件不预设（若要固定需 spec 补一句）；互斥提示的**具体文案** spec 只写「stderr 提示」，正则里那组同义词是本文件定义的语义等价集（等价性由 §5 人工项复核），不是 spec 原文

### TC-064 fixture 非 JSON / 文件不存在 → 退出码 3（IO / 依赖层），不得当成用例失败

- **覆盖**：`§4.3` 末条「fixture 读取失败或非 JSON → 退出码 `3`」；`§4.3`「不分配产品错误码（属用例输入缺陷）」；`§7.1` 退出码逐码映射表第 3 行（fixture 读取/解析失败归 3，与本节口径一致）；`R10` 退出码 3
- **前置**：`.tmp-test/TC-064/broken.json` 内容为 `{bad`（非法 JSON）；`.tmp-test/TC-064/nope.json` 不存在
- **步骤**：① `run.mjs --case V5 --fixture tools/docgen-spike/.tmp-test/TC-064/broken.json`；② `run.mjs --case V5 --fixture tools/docgen-spike/.tmp-test/TC-064/nope.json`；③ 各取退出码与输出；④ 检查两次都未产出 `PASS V5` / `FAIL V5`
- **预期**：两次退出码都恰为 3（不是 1：非法 fixture 不是「用例未达预期」）；输出非空（能看出是 fixture 这一层失败）；输出里**不得出现产品错误码**（如 `MissingSlot` / `InvalidRuleType`）——spec §4.3 已明确这类失败不分配产品错误码；④两次都不得出现 `PASS V5` / `FAIL V5`
- **判据**：两条命令退出码 `=== 3`；合并后的 stdout+stderr 长度 > 0、不匹配 `/PASS V5/`、`/FAIL V5/`，且不匹配 `/MissingSlot|InvalidRuleType/`；`node --test tools/docgen-spike/test/cli.test.mjs` 退出码 0 且断言 `§4.3 > fixture 非 JSON`、`§4.3 > fixture 不存在` 通过
- **红绿证据**：红① = 应用 `MUT-59`（`JSON.parse` 失败时退化成空对象继续跑）→ 走到 `validateData` 报 `MissingSlot`、退出 1，本用例 FAIL（退出码与「不得出现产品码」两条同时红）；红② = 应用 `MUT-65`（读不到 fixture 时忽略、用默认数据继续）→ 退出 0 且出现 `PASS V5`，本用例 FAIL；绿 = 两者都不应用时 PASS
- **对应测试**：`tools/docgen-spike/test/cli.test.mjs::§4.3 > fixture 非 JSON`（待 plan Task N）
- **不覆盖**：不覆盖「fixture 非 JSON 时输出哪个**错误码**」——spec §4.3 明确**不分配产品错误码**（属用例输入缺陷），故本用例只断言退出码 3 与「不出现产品码」，不断言任何 `code` 值；不覆盖 fixture 是目录的情形（IO 层同族，不单列）

### TC-065 `.tmp-test/` 内经 junction / symlink 指向 `rules/` → realpath 复判后仍 `InvalidOutputPath`（可构造时必测）

- **覆盖**：`§7.1` realpath 复判「从 `abs` 向上找到**最近的已存在祖先** `probe`，取 `realRoot = realpathSync(root)`、`realProbe = realpathSync(probe)`，再判 `path.join(realProbe, path.relative(probe, abs))` 是否在 `root` 内」；`§7.1` 逐码表（路径越界 → 2）；`§7.3`（测试预置副本的两条前提：spawn 带 `--no-clean`、spawn 前先断言文件存在）；`§7.4`（测试侧 spawn 带 `--no-clean`）；`R14`；`E2` 前缀绕过的第二种形态
- **前置**：`.tmp-test/TC-065/` 由测试自身创建，并用 `fs.symlinkSync(rulesDir, linkPath, 'junction')`（Windows）或 `'dir'`（POSIX）把 `.tmp-test/TC-065/link` 指向仓库 `rules/`；**建完先在 spawn 前断言存在**：`assert.strictEqual(fs.existsSync(link), true)`（§7.3：预置副本必须能证明「它真的在」，否则「启动后仍被拦」可能只是链接没建出来）；记录 `rules/` 当前 `.md` 数量（实测 21）与 `git status --short rules/`
- **链接构造的硬要求**：**可构造时必测，不得预先 skip**。构造顺序为「先试 `fs.symlinkSync(..., 'junction')`（Windows 无需管理员）→ 失败再试 `'dir'`（POSIX / 开发者模式）→ 仍失败才 skip」。skip 只允许 1 条，且必须可见（`node --test` 输出 `# skip 1`），同时转 §5 的人工项；「平台支持但用例图省事跳过」不算合法 skip
- **步骤**：① 建好 link 后**先断言存在**：`assert.strictEqual(fs.existsSync(link), true)` 且 `fs.lstatSync(link).isSymbolicLink() === true` 且 `fs.realpathSync(link)` 落在仓库 `rules/` 内（**链接本身要先被验证是真的指过去了**，否则后续断言无意义）；② `node tools/docgen-spike/run.mjs --out tools/docgen-spike/.tmp-test/TC-065/link/tc065-probe.md --no-clean`（`--no-clean` 是预置副本的必备条件：带上它才不会被启动清理删掉；也是 §7.4 对测试侧 spawn 的硬要求）；③ 取 `code`、`path`、退出码；④ 检查 `rules/tc065-probe.md` 是否被写出、`rules/` 的 `.md` 数量；⑤ 删除 link 与探针文件后查 `git status --short rules/`
- **预期**：②字符串判定看着完全合法（`rel` 不以 `..` 开头、非绝对），但复判时 `probe` = `.tmp-test/TC-065/link`（最近的已存在祖先），`realProbe` 落在 `rules/` 内 → `InvalidOutputPath`，`path` 非空，**退出码恰为 2**；④探针文件不存在、`rules/` 仍 21 个 `.md`；⑤`git status --short rules/` 为空；平台建不了链接时：1 条显式 skip + §5 人工项，不得静默通过
- **判据**：`node --test tools/docgen-spike/test/cli.test.mjs` 退出码 0；断言 `§7.1 > junction 绕过被拦` 通过（`code === 'InvalidOutputPath'` 且 `exitCode === 2` 且 `path` 非空 且 `assert.strictEqual(fs.existsSync('rules/tc065-probe.md'), false)` 且 `rules/` 的 `.md` 数量不变）；**且 spawn 前已断言 `assert.strictEqual(fs.existsSync(link), true)`**（否则「链接没被启动清理删掉」是空断言）；仅当三次链接尝试全部失败时，`node --test` 输出出现 1 条 `# skip 1` 且断言名同为 `§7.1 > junction 绕过被拦`（skip 与否在报告里必须可辨认）
- **红绿证据**：红① = 应用 `MUT-57`（只做字符串 `path.relative` 判定，不做 `realpathSync` 复判）→ 放行并把文件写进 `rules/`，本用例 FAIL；红② = 应用 `MUT-70`（按「只对已存在路径复判」的字面执行——`--out` 目标文件不存在就整段跳过复判）→ 同样放行写进 `rules/`，本用例 FAIL；红③ = 应用 `MUT-49`（退出码全用 1）→ `exitCode === 2` 断言 FAIL；绿 = 三个 MUT 都不应用、且按「最近已存在祖先」复判后 PASS
- **对应测试**：`tools/docgen-spike/test/cli.test.mjs::§7.1 > junction 绕过被拦`（待 plan Task N）
- **不覆盖**：不覆盖 NTFS 硬链接（`mklink /H` 只能同卷、且是文件级）与大小写变体（`.TMP-TEST`）——后者在 Windows 大小写不敏感文件系统上等价，由同一 `realpathSync` 复判兜底但本用例不单列；判据保留 TC-046 的纯字符串前缀绕过，两条互补：TC-046 管「没走 realpath 就放行」，TC-065 管「走了字符串判定仍被链接骗过」
- **口径依据（第 4 轮起为「已定」）**：spec §7.1 已把复判对象定为「最近的已存在祖先」，因此 `link/tc065-probe.md` 这种「链接存在、文件不存在」的组合**必然**被复判覆盖，本用例不再是「待澄清」状态；若实现按「目标文件不存在就跳过复判」执行，即 `MUT-70`，本用例判红

### TC-066 R15 施工顺序的可观测后果：`.gitattributes` 在位、三个文本文件工作区为 LF、双哈希常量一致

- **覆盖**：`R15`（施工顺序）；`R12`；`§3.1` `.gitattributes` 行；`R4`（LF 确定性）
- **前置**：仓库根 `.gitattributes` 已落地（**实测 2026-10-18 仓库根不存在该文件**，故本条当前必红，是 R15 第一步的验收）；target / 模板 / baseline 三份文件已在工作区
- **步骤**：① 读仓库根 `.gitattributes`，检查含 LF 规则（`eol=lf`）；② `git check-attr eol -- rules/spec-testcase-gate.md tools/docgen-spike/rule.md.tpl tools/docgen-spike/baseline.json`；③ 读三份文件字节，检查不含 `0x0D`；④ 比较 `TARGET_GIT_HASH` 与 `git hash-object rules/spec-testcase-gate.md`、`TARGET_SHA256` 与实算 SHA256
- **预期**：①文件存在且含 `eol=lf` 规则；②三个路径的 `eol` 属性均为 `lf`；③三份都无 CR；④两个常量与实算值相等（与 TC-059 互补：TC-059 只比常量与实算，本条还要求「顺序造成的环境前提」成立，即 `.gitattributes` 先在位、工作区是 LF）
- **判据**：`node --test tools/docgen-spike/test/cli.test.mjs` 退出码 0；断言 `R15 > gitattributes 生效`、`R15 > 工作区无 CR`、`R15 > 双哈希一致` 通过；`git check-attr eol -- rules/spec-testcase-gate.md` 输出含 `eol: lf`
- **红绿证据**：红 = 当前状态（仓库根无 `.gitattributes`，实测 `Glob .gitattributes` 无文件）→ ①FAIL，本用例 FAIL；绿 = R15 第一步落地（`.gitattributes` 强制 LF）且常量在 LF 工作区上计算后 PASS
- **对应测试**：`tools/docgen-spike/test/cli.test.mjs::R15 > gitattributes 生效`（待 plan Task N）
- **不覆盖**：不覆盖「施工者是否真按 `.gitattributes` → 确认 LF → 算常量 → 接 gate 的**先后顺序**执行」——顺序是过程事实，运行期不可观测，**由 plan 的 Task 顺序保证**（见 §7.1 缺口）；本条只测顺序造成的可见后果。也不覆盖 `core.autocrlf=true` 且 `.gitattributes` 未生效的克隆（见 §5 人工项）

### TC-067 静态扫描：`*.test.mjs` 不出现 `npm run check` / `check-all`，且哨兵变量在位

- **覆盖**：`§7.2`「**防自递归**：`tools/docgen-spike/test/*.test.mjs` 禁止调用 `npm run check` / `check-all.mjs`；V10/V10b 只由 `run.mjs` 编排」；`§7.3` V10 行；`R13`（`child_process` 只在 `run.mjs` 与 `test/`）
- **前置**：`tools/docgen-spike/test/*.test.mjs`、`tools/docgen-spike/run.mjs`、`scripts/check-all.mjs` 均已落地
- **步骤**：① 逐个读 `tools/docgen-spike/test/*.test.mjs` 源码（`fs.readdirSync` + `readFileSync`）；② 对每个文件断言不匹配 `/npm\s+run\s+check|check-all/`；③ 读 `scripts/check-all.mjs`，断言出现 `DOCGEN_CHECK_ACTIVE`（说明 gate 调用时设置了哨兵）；④ 读 `run.mjs`，断言出现 `DOCGEN_CHECK_ACTIVE`（说明它按哨兵跳过 `npm run check` 子调用）；⑤ 正对照：`run.mjs` 源码里能找到 `V10` 与 `V10b` 的编排分支（证明两条 e2e 有落点，而不是被「禁止」到无处可跑）
- **预期**：②命中 0 个文件；③④各至少 1 处；⑤两个标识各至少 1 处
- **判据**：`node --test tools/docgen-spike/test/cli.test.mjs` 退出码 0；断言 `§7.2 > 防自递归静态扫描` 通过——内部：对每个 `*.test.mjs` `assert.doesNotMatch(src, /npm\s+run\s+check|check-all/)`、`assert.match(checkAllSrc, /DOCGEN_CHECK_ACTIVE/)`、`assert.match(runSrc, /DOCGEN_CHECK_ACTIVE/)`、`assert.match(runSrc, /V10b/)`
- **红绿证据**：红① = 应用 `MUT-75`（在 `cli.test.mjs` 里加 `execSync('npm run check')`）→ ②命中，本用例 FAIL；红② = 应用 `MUT-80`（`check-all.mjs` 不设 `DOCGEN_CHECK_ACTIVE`）→ ③FAIL；绿 = 两者都不应用时 PASS
- **对应测试**：`tools/docgen-spike/test/cli.test.mjs::§7.2 > 防自递归静态扫描`（待 plan Task N）
- **不覆盖**：不覆盖拼接写法（`'npm ' + 'run check'`、`process.env.npm_lifecycle_event` 间接判断）——静态扫描只认字面量，这一层由 §7.1 缺口表的人工评审兜；也不覆盖「`check-all.mjs` 是否真的调用了 `node --test`」（接线本身由 TC-049/TC-050 从外部验）

### TC-068 `--case V1` + `--target` 指向 ROOT 内不存在的文件 → TargetReadFailed + exit 3（不是 InvalidInputPath / TemplateReadFailed / EnvironmentEOL，也不是 FAIL V1）

- **覆盖**：`§7.1`「`TargetReadFailed`（`path`，exit 3）：`--target` 读失败；PRD §5 未列，属实现细化」；`§7.1` **断言模式与前置错误（条件式，第 8 轮修订）**：「前置错误只在**不是本例期望**时才用自己的退出码——`GeneratedMissing` / `TemplateReadFailed` / `TargetReadFailed` / `WriteFailed` 取 3，`EnvironmentEOL` / baseline 类 / 路径越界取 2；当该码正是本例期望（V3/V4/V5/V7/V8/V11 等）时按命中处理 `PASS V<n>` + exit 0；只有『用例期望未命中』才 `FAIL V<n>` + exit 1」——本条跑的是 V1，其期望是「逐字节一致」，`TargetReadFailed` 不是它的期望，故 exit 3（旧第 6 轮的「一律不因断言模式变 PASS」绝对口径已被第 8 轮取代，不再引用）；`§7.1` 逐码表第 3 行；`§7.2` 步①（先 `checkEnvironment(target / template / baseline)`）；`§7.4`（测试侧 spawn 带 `--no-clean`）；`R10` 退出码 3
- **前置**：`tools/docgen-spike/.tmp-test/TC-068/` 目录存在（**由启动清理重建 ROOT**，测试不预置文件；本条的输入就是「不存在的文件」）、`nope.md` **不存在**；真 target 与真模板的 SHA256 先记录（内存）
- **步骤**：① `node tools/docgen-spike/run.mjs --case V1 --target tools/docgen-spike/.tmp-test/TC-068/nope.md --no-clean`（测试内 spawn 一律带 `--no-clean`，§7.4）；② 取 `code`、`path`、退出码与输出；③ 重算真 target / 真模板 SHA256
- **预期**：`TargetReadFailed`、`path` 非空（解析后等于传入路径）、**退出码恰为 3**；**不得**是 `InvalidInputPath`（路径在 `ROOT` 内，合法）、`TemplateReadFailed`（模板没动）、`EnvironmentEOL`（没有字节可查）；也**不得**出现 `PASS V1`（前置错误不算「用例命中期望」）——退出码 3 已经把它与「未命中 → `FAIL V1` + exit 1」区分开；③不变
- **判据**：`node --test tools/docgen-spike/test/cli.test.mjs` 退出码 0；断言 `§7.1 > case 模式 target 读失败` 通过——内部：`assert.strictEqual(r.code, 'TargetReadFailed')`、`assert.ok(r.path.length > 0)`、`assert.strictEqual(r.exitCode, 3)`、`assert.doesNotMatch(out, /InvalidInputPath|TemplateReadFailed|EnvironmentEOL|PASS V1/)`；两次 SHA256 `strictEqual`
- **红绿证据**：红① = 应用 `MUT-73`（读 target 失败时返回空 Buffer）→ 走到 `EnvironmentEOL`/`Mismatch`，本用例 FAIL；红② = 应用 `MUT-49`（退出码全用 1）→ `exitCode === 3` 断言 FAIL；红③ = 应用 `MUT-81`（把 target 读失败归到 `InvalidInputPath`）→ `code` 断言 FAIL；红④ = 应用 `MUT-91`（断言模式把所有前置错误压成 `FAIL V1` + exit 1）→ 退出码 1，本用例 FAIL；绿 = 四者都不应用时 PASS
- **对应测试**：`tools/docgen-spike/test/cli.test.mjs::§7.1 > case 模式 target 读失败`（待 plan Task N）。注意 V11 的 6 个故障注入里**没有**这一条（§7.3 的 V11 只列 `--compare` 缺生成物），`TargetReadFailed` 是 §7.1 新增码，故断言名用 `§7.1` 前缀而非 `V11`
- **不覆盖**：不覆盖 `ROOT` 之外的 target（TC-048）；不覆盖无读权限（Windows 不可构造，见 §5）；不覆盖 target 是目录（同类 IO 失败，不单列）；不覆盖 `--case` 下模板 / baseline / 环境三类前置错误（同一条优先级规则的其它入口：模板 → TC-055 的 gate 侧、环境 → TC-054 的 `--case` 侧、baseline → TC-057）

### TC-069 `--gate` + 模板内容 = target 全文 → TemplateHardcoded + exit 1（门必须查模板硬编码）

- **覆盖**：`§7.2` 步③.5（`assertTemplateClean(template) → TemplateHardcoded exit 1`）；`§5.4`；`§7.1` 逐码表（`TemplateHardcoded` → 1）；`§7.1` 断言模式（条件式：gate 的期望是绿，`TemplateHardcoded` **不是**本例期望 → 用它自己的档位 1，不套「命中期望 → PASS」；只有当该码正是本例期望时才 `PASS` + exit 0）；`§7.3`（本条走非 `--case` 的 `--gate` → 副本**允许**在 spawn 前预置在 ROOT 内，但必须带 `--no-clean` 且 spawn 前先断言存在）；`§7.4`（测试侧 spawn 带 `--no-clean`）；`R2`（模板只放结构）；`R6`（gate 的完整性）
- **前置**：测试**自己建** `.tmp-test/TC-069/tpl-full.tpl` = **真 target 的完整字节**（不是 3 段签名，是全文；LF、无 BOM，因此能通过 `checkEnvironment`），建完**先断言存在**：`assert.strictEqual(fs.existsSync(tplFull), true)`（§7.3 第②类：非 `--case` 模式允许预置，前提是 spawn 带 `--no-clean`；不先断言就无法区分「副本被启动清理删了」与「gate 没做模板检查」）；真 target 与真模板的 SHA256 先记录
- **步骤**：① 建 `tpl-full.tpl`（内容 = 真 target 字节）→ ② 断言它存在（`fs.existsSync === true`）→ ③ `node tools/docgen-spike/run.mjs --gate --template tools/docgen-spike/.tmp-test/TC-069/tpl-full.tpl --no-clean`（`--no-clean` 是预置副本的必备条件：带上它才不会被启动清理删掉；也是 §7.4 对测试侧 spawn 的硬要求）→ ④ 取 `code`、`snippet`、退出码；⑤ 检查输出是否出现 `baseline 21/21` 与 `Mismatch`；⑥ 重算真 target / 真模板 SHA256
- **预期**：③`TemplateHardcoded`（`snippet` 非空）、**退出码恰为 1**；⑤**不得**出现 `baseline 21/21`（步③.5 先短路，走不到步⑦），**不得**出现 `Mismatch`（走不到步⑥）；⑥两份 SHA256 不变
- **为什么这条必须存在**：模板 = target 全文时，`render` 把「模板」原样/近乎原样输出，`compareBuffers` 很可能**相等** → 若 gate 漏了步③.5，`npm run check` 就全绿，而这正是 R2 要堵的「模板贴全文也能字节相等」；TC-018 只测单元层 `assertTemplateClean`，覆盖不到「gate 有没有调用它」
- **判据**：测试先 `fs.writeFileSync(tplFull, targetBytes)` 并 `assert.strictEqual(fs.existsSync(tplFull), true)`；随后 `run.mjs --gate --template <全文副本> --no-clean` 退出码 `=== 1` 且合并输出匹配 `/TemplateHardcoded/`、`/snippet/`，且**不**匹配 `/baseline 21\/21/`、`/Mismatch/`；`node --test tools/docgen-spike/test/cli.test.mjs` 退出码 0 且断言 `§7.2 > gate 模板硬编码` 通过；两次 SHA256 `strictEqual`
- **红绿证据**：红 = 应用 `MUT-72`（gate 删掉步③.5，不调 `assertTemplateClean`）→ 输出 `baseline 21/21` 且 exit 0（假绿），本用例 FAIL；绿 = 步③.5 在位时 PASS
- **对应测试**：`tools/docgen-spike/test/cli.test.mjs::§7.2 > gate 模板硬编码`（内部只 spawn `run.mjs --gate --template <全文副本> --no-clean`，不调 `npm run check`；副本由测试自建并断言存在）；TC-018 保留为单元层
- **不覆盖**：不覆盖「模板里塞 <20 字业务改写」（3 段签名抓不到）——属 §5 人工项；不覆盖 `--case` 模式下是否也查模板（spec §7.2 只规定 gate；`--case` 的模板校验由 TC-018 的单元断言兜）

### TC-070 `--write-baseline` 正例：手改坏的 baseline 被覆盖回常量渲染结果 → gate 绿 → 撤销

- **覆盖**：`§7.1`「`--write-baseline`：把 `renderBaseline(BASELINE_RULES)` 写到 `tools/docgen-spike/baseline.json`；不碰 target / template；用于合法新增 rule」；`§7.2`「涉及 check 的 e2e（含 TC-070）在 `DOCGEN_CHECK_ACTIVE=1` 下显式 `t.skip()`」；`§7.3` 末段正例；`R5`（baseline 是生成视图）；`R7`（写入白名单）；`R12`（target 不动）
- **前置**：干净树；把 `tools/docgen-spike/baseline.json` 的原始字节读进内存并算 SHA256；记录真 target 与真模板 SHA256；`rules/tmp-new-rule-V4.md` 与 `rules/tmp-new-rule-V10.md` 均不存在（§7.4 唯一名）；`.tmp-test/` 不存在
- **嵌套 check 场景的执行约束（spec §7.2）**：该测试在 `DOCGEN_CHECK_ACTIVE=1` 可见时**显式 `t.skip()`**——`test('§7.1 > write-baseline 恢复', { skip: process.env.DOCGEN_CHECK_ACTIVE === '1' ? 'nested check: 外层 V10 持有 rules/tmp-new-rule-V10.md，④ 的 gate 绿不成立（spec §7.2）' : false }, ...)`，原因串必须出现在 TAP 的 `# SKIP` 行；skip 只针对「被 check 嵌套」这一场景，`run.mjs` 串行编排 / 单跑 `node --test`（无该变量）时**照常执行**（它是唯一会写仓库内非 `.tmp-test` 文件的入口，跳过即等于当天没验）
- **步骤**：① 把 `baseline.json` 改坏（删掉最后一条，模拟「手改过 / 旧快照」）；② `node tools/docgen-spike/run.mjs --write-baseline`；③ 读回 `baseline.json`：字节必须 === `renderBaseline(BASELINE_RULES)`，条目数 === `BASELINE_RULES.length`，末字节是 `0x0A`；④ `node tools/docgen-spike/run.mjs --gate`；⑤ 把内存里的原始字节写回（`fs.writeFileSync`），复算 SHA256；⑥ 查 target/模板 SHA256、`git status --short rules/`、`.tmp-test`
- **预期**：②退出码 0；③字节相等、条目 21、单个尾换行；④退出码 0 且输出含 `baseline 21/21`（写回后基线不再漂移）；⑤恢复后 SHA256 与①前相等；⑥target/模板不变、`git status --short rules/` 0 行、`.tmp-test/` 不存在；skip 只发生在「被 check 嵌套」这一场景
- **判据**：两条 `run.mjs` 命令退出码均为 0；`assert.ok(written.equals(Buffer.from(renderBaseline(BASELINE_RULES), 'utf8')))`；`assert.strictEqual(entries.length, BASELINE_RULES.length)`；`assert.match(gateStdout, /baseline 21\/21/)`；恢复后 `strictEqual(sha256Before, sha256After)`；`assert.strictEqual(fs.existsSync('tools/docgen-spike/.tmp-test'), false)`；**且** `node --test tools/docgen-spike/test/cli.test.mjs`（不设 `DOCGEN_CHECK_ACTIVE`）输出里本用例不得出现 `# SKIP`（反例 `MUT-93`）。全程只用 Node 内置，不改 target / 模板
- **红绿证据**：红① = 应用 `MUT-71`（`--write-baseline` 少写尾换行或只写前 N 条）→ ③字节不等，且随后 gate 报 `BaselineDrift`，本用例 FAIL；红② = 应用 `MUT-82`（`--write-baseline` 顺带重写 target）→ ⑥target SHA256 变，本用例 FAIL；红③ = 应用 `MUT-93`（无条件 skip）→ 单跑时出现 `# SKIP`，末条判据 FAIL；绿 = 三者都不应用时 PASS
- **对应测试**：`tools/docgen-spike/test/cli.test.mjs::§7.1 > write-baseline 恢复`（内部 spawn `run.mjs --write-baseline` 与 `run.mjs --gate`，两条都不调 `npm run check`；两条 spawn 均带 `--no-clean`，§0/§7.4；测试体带 `DOCGEN_CHECK_ACTIVE=1` 的显式 skip 选项）；待 plan Task N
- **「新增第 22 条」那一步为什么不进本条**：完整流程要求先改 `specTestCaseGate.mjs::BASELINE_RULES` 常量（源码改动），与 R7 的写入白名单、R12「施工期 target diff 为空」冲突，还会让运行中的 `npm run check` 基线在中途从 21 变 22。因此**常量变更那一步登记为 §5 人工项**（受控变更时由施工者跑一次：新增 rule → 把路径并入 `BASELINE_RULES` → `--write-baseline` → `--gate` 绿 → 撤销）；本条把其中**机器可判的闭环**（写 → 字节等于常量渲染 → gate 绿 → 撤销后哈希复原）钉死
- **不覆盖**：不覆盖常量变更本身（§5）；`--write-baseline` 与 `--baseline` 同给的语义已由 spec §7.1 定为 exit 2，归 TC-071 覆盖；**被 `check-all` 嵌套调用时 ④ 的「gate 绿」不成立**（外层 V10 正持有 `rules/tmp-new-rule-V10.md`，R9 步5 会先报 `UnregisteredHandwritten`）——该场景由 spec §7.2 的显式 `t.skip()` 处理（见上），skip 不得被当作通过，也不得扩大到串行编排路径

### TC-071 `--write-baseline` 与 `--gate` / `--case` / `--compare` / `--baseline` 同给 → exit 2，且 baseline 一个字节都不写

- **覆盖**：`§7.1`「`--gate` / `--case` / `--write-baseline` / `--compare` **四者互斥**；同给 → exit 2 + stderr 提示」+「`--write-baseline` … 与 `--baseline` 同给 → exit 2（只写默认 `baseline.json`）」；`R10` 退出码 2；`R14`（`--baseline` 只接受 `.tmp-test/**`）
- **前置**：干净树；把 `tools/docgen-spike/baseline.json` 的原始字节读进内存并算 SHA256；`--baseline` 的目标路径 `tools/docgen-spike/.tmp-test/TC-071/baseline-copy.json` **不存在**（启动清理也会保证它不存在——因此本条的「副本不被写」用「跑完仍不存在」断言，不预置文件，符合 §7.3）；记录跑前 `git status --short tools/docgen-spike/` 为空
- **步骤**：① `run.mjs --write-baseline --gate`；② `run.mjs --gate --write-baseline`（顺序反转）；③ `run.mjs --write-baseline --case V1`；④ `run.mjs --write-baseline --compare tools/docgen-spike/.tmp-test/TC-071/gen.md`；⑤ `run.mjs --write-baseline --baseline tools/docgen-spike/.tmp-test/TC-071/baseline-copy.json`；⑥ 五次各取退出码与 stderr；⑦ 读回默认 `baseline.json` 与内存字节比对，并检查 `--baseline` 目标路径
- **预期**：五次退出码都恰为 2；每次 stderr 同时出现冲突的两个字面量（`--write-baseline` 与 `--gate` / `--case` / `--compare` / `--baseline`），并含「互斥 / 不可同用 / 不能同用 / mutually exclusive」之一；③不得进入 case 模式、④不得进入 compare 模式（不得先报 `GeneratedMissing`）；⑦**默认 `baseline.json` 一个字节未写**，且 `--baseline` 指向的副本路径**仍不存在**（spec：`--write-baseline` 只写默认 `baseline.json`，`--baseline` 永远不是写入目标；实现也不得顺手创建它）；五次都不得出现 `PASS V\d` / `FAIL V\d` 汇总行；`git status --short tools/docgen-spike/` 仍为空
- **判据**：五条命令退出码均 `=== 2`；`assert.match(stderr, /--write-baseline/)` 且对应另一个参数名在场、且含互斥措辞；`assert.ok(fs.readFileSync('tools/docgen-spike/baseline.json').equals(before))`；`assert.strictEqual(fs.existsSync('tools/docgen-spike/.tmp-test/TC-071/baseline-copy.json'), false)`；五次输出均 `doesNotMatch(/PASS V\d|FAIL V\d/)`
- **红绿证据**：红① = 应用 `MUT-74`（去掉四模式互斥校验，按出现顺序取最后一个）→ ②跑成了 gate（exit 0/1）或 ③真的进入 case 模式，本用例 FAIL；红② = 应用 `MUT-83`（`--write-baseline` 先写盘再校验互斥）→ ⑦默认 baseline 字节不等，本用例 FAIL；红③ = 应用 `MUT-92`（`--write-baseline --baseline` 不拒绝、照写默认 `baseline.json`）→ ⑤退出 0 且默认文件被改，本用例 FAIL；红④ = 应用 `MUT-90`（互斥漏掉 `--compare`）→ ④报 `GeneratedMissing`（exit 3）或直接比对，本用例 FAIL；绿 = 四者都不应用时 PASS
- **对应测试**：`tools/docgen-spike/test/cli.test.mjs::§7.1 > write-baseline 互斥`（待 plan Task N）
- **不覆盖**：不覆盖提示文案可读性（§5 人工项）；不覆盖「同给时写副本而非默认文件」这一假定路径——spec 已定为「只写默认 `baseline.json`」，本条用「同给即拒绝、两边都不动」断言，若将来放宽为允许同给，本条需按新口径重写（记录在此，避免被当成漏测）

## 3 负例与边界

> 说明：本表与 §2 中出现的 `TODO` 是被测**输入值**（spec §5.3 要求对 `TODO` 报 `MissingSlot`），不是本文件的待办占位；本文件不含任何待办占位，唯一占位是「待 plan Task N」。

| 用例 ID | 边界/负例是什么 | 为什么容易漏 | 期望行为 |
|---|---|---|---|
| TC-007 | pass 为 `''` / 空格 / `TODO` | 三者症状相同但触发路径不同，容易只测一种 | MissingSlot + slot 指向该格 |
| TC-008 | 纯空白含制表符与全角空格 | 只用 `=== ''` 判断就漏，且肉眼看着「有空」 | 仍判 MissingSlot |
| TC-009 | fourElements 四个子格分别空 | 只看整块是否为空会漏子键 | MissingSlot + `fourElements.<key>` |
| TC-010 | criteria 空数组；行内 name 与 pass 双空 | index 兜底表单 spec 只一行，最易实现成 name 空就崩 | MissingSlot + `criteria` 或 `criteria.<index>.pass` |
| TC-011 | examples / trigger / verification 三类空容器与空条目 | 只测 criteria 会漏三维 | 各自 slot |
| TC-012 | polarity `ban`、applicability `sometimes`、applicability 缺失 | 缺失与非法是两种入口 | InvalidRuleType + field/value |
| TC-013 | 同时两个错，看顺序 | 顺序不定则期望值随实现摆动 | 只报第一个 |
| TC-014 | fixture 未声明键 | 静默忽略会让「测试写错」伪装成「产品正常」 | 抛 Error，不走产品码 |
| TC-015 | fixture 只覆盖嵌套对象的一个子键 | 浅覆盖 = 整块替换，看着像深合并 | 兄弟字段 MissingSlot |
| TC-016 | render 替身读 target | 真实 render 不读，但探针本身可能失效 | ImpureRender + path |
| TC-017 | 探针抛错后未恢复 | 一次拦到就把后续所有 IO 弄挂，症状离现场很远 | 恢复原函数，后续读正常 |
| TC-018 | 模板抄 target 原文 | 字节比对照样过，最隐蔽的假绿 | TemplateHardcoded + snippet |
| TC-019 | 未知占位符 | 替换成空串也「能跑」 | MissingPlaceholder + key |
| TC-020 | 未闭合 `{{` | 正则全局替换会静默跳过 | TemplateSyntaxError + line |
| TC-021 | `{{}}` / `{{a+b}}` / 嵌套 `{{` | 三种都「像占位符」，容易都归到未知键 | 均为 TemplateSyntaxError |
| TC-022 | line 口径（第 3 行）；比较对象含 `\r` | 容易把字节偏移当行号；也容易把 `\r` 当行尾（CRLF 归一化的同类病） | `line=3`；含 `\r` 时只按 `0x0A` 计 → `line=2` |
| TC-023 | 改 1 个 ASCII 字节（固定位置：第 1 个 `\n` 之后首个非 `\n` 字节） | 任何 trim/归一都会吞掉；`line` 差 1 看不出来；只打印 `byte=`/`line=` 而不指内容源，手改生成物的人照样不知道该改哪一边 | Mismatch + `byte === mutatedOffset` + `line === 3` + 消息含 `specTestCaseGate.mjs` 与 `buildData` |
| TC-024 | 首字节差异；生成物是 target 真前缀 | 前缀情形最容易越界或返回 undefined | index=min(length)，不抛异常 |
| TC-025 | 一个 `\n` 换成 `\r\n` | 只要做了 EOL 归一就假绿（V2b 的全部意义） | Mismatch，不是 EnvironmentEOL |
| TC-026 | 模板 CRLF | 只查 target 不查模板就漏 | EnvironmentEOL + CR |
| TC-027 | target 带 BOM | Windows 编辑器常见，易被当内容差异 | EnvironmentEOL + BOM |
| TC-028 | 非法 UTF-8 字节 | `toString('utf8')` 会静默替换成 U+FFFD | INVALID_UTF8 |
| TC-029 | baseline 含 CR | `--baseline` 是第三输入角色，最易漏 | EnvironmentEOL + CR |
| TC-030 | BOM + CR + 非法字节同时存在 | 顺序不定则 violation 随机 | 只报 BOM |
| TC-033 | baseline 空数组 / 重复 / JSON 损坏 / 文件缺失 | 四类都归 InvalidBaseline，容易只测一类 | 均 InvalidBaseline |
| TC-034 | 删一条 | 不比对常量就永绿 | BaselineDrift |
| TC-035 | `..` / 反斜杠 / 非 rules 路径 | 正则写宽就放过，写出路径穿越 | InvalidBaselinePath |
| TC-036 | 条目指向不存在文件 | 只查格式不查存在就漏 | DanglingBaselineEntry |
| TC-037 | 集合相同但乱序 | 容易被判成结构错误 | BaselineDrift |
| TC-038 | 重复 + 非法路径并存 | 顺序错则报错码随实现变 | 只报 InvalidBaseline |
| TC-039 | 删一条 + 加不存在 | 同上 | 只报 DanglingBaselineEntry |
| TC-040 | 删一条 + 基线外新增 | 同上，且第 5 步最容易提前 | 只报 BaselineDrift |
| TC-041 | 基线外新手写 rule（唯一名 `-V4.md`）；消息缺可操作指引 | 不删就永久红，第二遍起全崩；消息只报「未登记」会让正常受控变更被当成 gate 坏了；与 V10 共用文件名则嵌套时互删 | UnregisteredHandwritten（含 `BASELINE_RULES` + `renderBaseline`），用例后 `-V4.md` / `-V10.md` 都不存在 |
| TC-042 | `--out rules/x.md` | 写字白名单是「不可逆损坏」的最后一道闸；`ROOT` 若误取仓库根，`rules/x.md` 反而「合法」 | InvalidOutputPath + exit 2，rules 目录不变 |
| TC-043 | `--out` 指向目录 | 原始 EISDIR 未包装就丢错误码 | WriteFailed + path + errno |
| TC-044 | 模板不存在 | 未 try/catch 就漏出 ENOENT | TemplateReadFailed |
| TC-045 | `--compare` 指向 ROOT 内不存在的生成物 | 读失败返回空 Buffer 会变成 Mismatch；只判「报错」会把 IO 失败（3）误判成用例失败（1） | GeneratedMissing + path + **exit 3**，不出现 Mismatch |
| TC-046 | `--out` 指向 `.tmp-testx/`；`..` 穿越到 `rules/`；`rules/x.md`（`ROOT` 定义负例） | 字符串前缀判断的经典绕过；`path.resolve` 后直接 `startsWith` 也拦不住 `..`；`ROOT` 取错则 `rules/x.md` 通过 | 三条都 InvalidOutputPath + exit 2，越界目标都不写出；另要有一条 `ROOT` 正对照（`.tmp-test/` 下其它子目录必须能写） |
| TC-047 | `--out` 用反斜杠 | Windows 上正反斜杠混用是常态 | 与正斜杠等价 |
| TC-048 | 三个输入覆盖参数指向真 rules | 只护 `--out` 会留下改真文件的入口；只判「拒绝」无法区分「越界拒绝」与「读文件失败」；不钉退出码就分不清「路径越界」与「IO 失败」 | `InvalidInputPath` + `path` + exit 2 + 真文件不变 |
| TC-050 | 单跑 V10，内部再跑 `npm run check`；编排落点 | 门未接线时 V10 的断言会静默变成「check 退出 0」；若编排落在 `*.test.mjs` 里，`check-all` 跑测试又会调 check → 无限派生 | check 非 0 + UnregisteredHandwritten；编排只在 `run.mjs` |
| TC-051 | `--gate` + 只改 1 字节的 target 副本（副本由 `--case V10b` 前半自建） | 只做基线不做比对的 gate 会全绿 | Mismatch + line/byte（本例期望 → `PASS V10b` + exit 0） |
| TC-052 | `--gate` + 漂移 baseline 副本（副本由 `--case V7` 自建） | 基线校验被 try/catch 吞掉就假绿 | BaselineDrift，不出 21/21（本例期望 → `PASS V7` + exit 0） |
| TC-053 | 用例未达预期 | 全返回 0 的实现在 CI 里看不出来 | 退出码 1 |
| TC-054 | 环境前置失败 | 与「用例失败」混用会让停损误判 | 退出码 2 |
| TC-055 | IO 失败 | 与「环境未准备好」混用会掩盖缺文件 | 退出码 3 |
| TC-056 | `--raw` | 两个模式混跑会让自动化读到非结构化输出 | 原文冒泡 + 固定 2 |
| TC-057 | SIGKILL 留下的两个唯一哨兵文件：精确串（`SENTINEL_V4` / `SENTINEL_V10`，import 自 `specTestCaseGate.mjs`）/ 近失（串 + 追加行）/ 非哨兵内容 | 启动若「顺手」无条件删 `tmp-new-rule-*.md`，会把上次中断伪装成正常；若哨兵比对写成 `includes`/前缀，会把「像哨兵」的第三方文件也删掉 | 精确串 → 删除 + 打印「已清理上次中断残留」；近失与非哨兵 → 保留 + UnregisteredHandwritten + exit 2 |
| TC-060 | 引入第三方依赖；纯模块用 `child_process` 绕过探针 | 单机能跑、干净环境跑不了；`execSync('cat target')` 能绕过只替换 fs API 的探针 | 只用 `node:` 内置；两个纯模块不含 `child_process` |
| TC-061 | 故障注入改到真文件 | 一次 Ctrl-C 就可能不可逆写坏 golden | 三份哈希全不变 |
| TC-062 | `--case` 被忽略；全量总数口径 | 「只跑一例」失效会让故障注入互相污染；总数写 11 会漏跑 V2b（CRLF 归一这类假绿只有 V2b 抓得住），写 12 会漏跑 V10b（「干净树 check 接线后仍绿」只有 V10b 后半抓得住） | 单值只跑该例；全量恰 13 例（V1–V11 + V2b + V10b）+ `13/13 PASS` |
| TC-063 | `--gate` 与 `--case` 同给；`--case V12`；`--case` 与 `--compare` 同给 | 每个参数各有明文，组合从没人写；实现按出现顺序取最后一个 → 同一条命令两次跑出不同模式；漏掉 `--compare` 时它会抢先报 `GeneratedMissing` | exit 2 + stderr 互斥提示 / usage，不进入任何模式 |
| TC-064 | fixture 非 JSON / fixture 文件不存在 | `JSON.parse` 失败退化成空对象，会把「测试写错了」伪装成「规则数据缺字段」（退出 1），停损时误判为代码问题 | exit 3，不产出 PASS/FAIL 行，不出现产品错误码 |
| TC-065 | `.tmp-test/` 内 junction / symlink 指向 `rules/` | 字符串前缀完全合法，只有 realpath 才能识破；漏了就等于给了一条绕过 `--out` 白名单的暗路；「输出文件尚不存在」还会诱使实现整段跳过复判 | InvalidOutputPath + exit 2，`rules/` 不增文件；链接可构造时必测，建不了才允许 1 条显式 skip |
| TC-067 | `*.test.mjs` 里调 `npm run check` / `check-all` | 单看测试文件像「顺手加一条 e2e」，实际是 `check → node --test → 测试 → check` 无限派生；CI 会卡死或栈溢出，而本地单跑测试不触发 | 测试文件里 0 命中；`DOCGEN_CHECK_ACTIVE` 在 `check-all.mjs` 与 `run.mjs` 都在位 |
| TC-068 | `--case V1` + `--target` 指向 ROOT 内不存在的文件 | 读失败返回空 Buffer 会变成 `EnvironmentEOL`/`Mismatch`；归到 `InvalidInputPath` 会把「文件没了」误报成「路径越界」（两者引导用户去改完全不同的地方）；断言模式若把前置错误压成 `FAIL V1` + exit 1，CI 会把「环境没准备好」算成「代码写错」 | TargetReadFailed + path + exit 3，且不出现 InvalidInputPath / TemplateReadFailed / EnvironmentEOL / PASS V1 |
| TC-069 | 模板内容 = target 全文（走 `--gate`） | 模板贴全文时 `render` 输出几乎就是 target，`compareBuffers` 相等 → gate 假绿；TC-018 只测单元层，测不到「gate 有没有调用 `assertTemplateClean`」 | TemplateHardcoded + snippet + exit 1，不出现 `baseline 21/21` / `Mismatch` |
| TC-070 | `--write-baseline` 覆盖手改坏的 baseline | 写半截（少尾换行/少条目）会让 gate 继续红，而「命令退出 0」看起来像成功；顺带重写 target 则等于给了一条改真文件的暗路 | baseline 字节 === `renderBaseline(BASELINE_RULES)`、条目数一致、单个尾换行；gate 绿；撤销后哈希复原；target 不变 |
| TC-071 | `--write-baseline` 与 `--gate` / `--case` / `--compare` / `--baseline` 同给 | 四者各有明文，两两组合没人写；实现按出现顺序取最后一个 → 同一条命令这次只写不验、下次只验不写；`--baseline` 还可能把写入目标悄悄改成副本 | 五次都 exit 2 + 互斥提示；默认 `baseline.json` 不变；副本路径未被创建 |

## 4 回归清单

| 如果改了 | 必须重跑 | 为什么 |
|---|---|---|
| `specTestCaseGate.mjs::buildData` | TC-001、TC-004、TC-006、TC-007、TC-009、TC-010、TC-011、TC-019、TC-020、TC-021、TC-022、TC-031、TC-032、TC-049 | 数据是 golden 的来源，一个字段改动即全量重建 |
| `rule.md.tpl` | TC-001、TC-002、TC-003、TC-018、TC-019、TC-020、TC-021、TC-022、TC-026、TC-051、TC-058 | 模板即结构；同时影响硬编码签名与字节比对 |
| `compare.mjs::compareBuffers` | TC-023、TC-024、TC-025、TC-051、TC-022 | 比对语义（含前缀与 line 口径、`\r` 不成行）全在此 |
| `compare.mjs::checkEnvironment` | TC-026、TC-027、TC-028、TC-029、TC-030、TC-054、TC-057 | 顺序与三类 violation 全在此 |
| `run.mjs` baseline 校验 | TC-031、TC-033、TC-034、TC-035、TC-036、TC-037、TC-038、TC-039、TC-040、TC-041、TC-049、TC-052、TC-057 | R9 顺序一改，期望值全变 |
| `run.mjs` CLI 与退出码 | TC-042、TC-043、TC-044、TC-045、TC-046、TC-047、TC-048、TC-053、TC-054、TC-055、TC-056、TC-062、TC-063、TC-064、TC-065、TC-068、TC-071 | R10 是 CI 的判据；`--gate`/`--case`/`--write-baseline` 互斥、fixture 退出码 3、`TargetReadFailed`、realpath 复判都在参数解析层 |
| `run.mjs --write-baseline` | TC-070、TC-071 | 唯一会写仓库内非 `.tmp-test` 文件的入口（`baseline.json`），写半截会让门永久红 |
| `run.mjs` 清理逻辑 | TC-041、TC-050、TC-057、TC-058、TC-061 | 清理是 V9 的唯一保证；退出钩子（§7.4）删 `ROOT` 是「无残留」的来源 |
| `specTestCaseGate.mjs::SENTINEL_V4` / `SENTINEL_V10`（§5.4 的导出点） | TC-057 | 哨兵串是「自愈」与「fail-closed」的唯一分界；串一变，历史残片不再被识别；测试与 V4/V10 **引用同一常量**（导出点变更即测试失效，不允许测试侧另抄一份） |
| `scripts/check-all.mjs` | TC-049、TC-050、TC-052、TC-067 | 门接线点 + `DOCGEN_CHECK_ACTIVE` 哨兵 |
| `tools/docgen-spike/test/*.test.mjs`（任何测试文件） | TC-067（以及受它保护的 TC-049/TC-050/TC-058） | 测试文件里出现 `npm run check` / `check-all` 即自递归；改测试文件必须重跑静态扫描 |
| `.gitignore` | TC-058 | 少了 `tools/docgen-spike/.tmp-test/` 就会把临时文件误提交（`git check-ignore` 退出非 0） |
| `.gitattributes` | TC-003、TC-026、TC-027、TC-028、TC-058、TC-059、TC-066 | EOL 规则变化会改工作区字节与哈希（R15 第一环） |
| `specTestCaseGate.mjs::BASELINE_RULES` / `renderBaseline` | TC-032、TC-041、TC-052、TC-070 | 常量是入口强制来源，也是 `UnregisteredHandwritten` 指引文案里点名的两个词，还是 `--write-baseline` 的写入内容 |
| `specTestCaseGate.mjs::TARGET_SIGNATURES` / 双哈希常量 | TC-018、TC-059、TC-066、TC-069 | 签名一变硬编码检测失效（gate 也依赖它）；常量一变等于换了一把锁 |
| `rules/spec-testcase-gate.md`（target） | 全部 P0 用例 | 触发 R12：两个哈希常量必须重算；施工期该文件 diff 不为空即视为施工违规 |

## 5 只手动验证

| 项 | 为什么机器验不了 | 谁验、看什么 |
|---|---|---|
| 模板是否「只含结构、不含业务原文」的完整判断 | 机器只能查 3 段 ≥20 字签名，抓不到 <20 字但业务化的改写 | 评审人（reviewer-qa）对照 spec §5.2 逐节打开 `rule.md.tpl` 与 target，确认 **9 个 H2** 节里只有标题、表头、占位符与列表前缀 |
| 6 条 V11 错误消息对使用者是否可操作 | 字段非空可机器断言，文案好坏不可 | senior-sdet + reviewer-backend 读 6 条输出，确认每条都写清「哪个文件、哪个参数、下一步改什么」 |
| 真实 SIGKILL / 断电后的恢复 | 需要真实中断时序，无法稳定构造 | 施工者在本机手工 `kill -9` 一次 V4 中途进程，再由评审人确认：残留文件未被自动删除、下一次运行退出 2 而不是假绿；若残留内容恰为哨兵串，下次启动应打印「已清理上次中断残留」并继续 |
| Ctrl-C（SIGINT / SIGTERM）的同步清理 | 要在「临时文件已创建、用例未结束」的窗口内发信号；自动化只能在受限时机下重复尝试，不稳定 | 施工者手工在 V4/V10 跑到一半时按 Ctrl-C，评审人确认：`rules/tmp-new-rule-V4.md` / `-V10.md` 与 `.tmp-test/` 均被清掉（不依赖下一次启动） |
| 退出钩子「删除 `.tmp-test/` 失败」分支 | 要让 `fs.rmSync` 失败需占用文件句柄（Windows 不可靠、Linux 属另一平台），自动化会引入平台依赖 | 施工者在 Windows 上先用编辑器/进程占用 `.tmp-test/` 内某文件再退出，评审人确认：退出时删除失败、残留被保留；下一次启动清理掉 `.tmp-test/`（不因残留而假绿）；若残留里有非哨兵的 `rules/*.md`，按 `UnregisteredHandwritten` fail-closed（TC-057） |
| 无读权限文件（模板 / 生成物） | Windows 下不可构造，需 Linux + chmod | 由 CI（若启用 Linux 矩阵）或评审人在 WSL 手工跑一次，看是否得到 `TemplateReadFailed`/`WriteFailed` |
| junction / symlink 绕过（**仅当 TC-065 的三次链接尝试全部失败时的兜底**） | 链接创建本身要靠系统能力；三次都失败才只能留 skip（`EPERM`/`EINVAL`），而字符串判定看不出链接 | 施工者在 WSL / Linux（或管理员 cmd `mklink /J`）手工建一次链接，评审人确认：`--out` 指进链接得到 `InvalidOutputPath`（退出码 2）、`rules/` 未增文件、`git status --short rules/` 为空 |
| `--gate`/`--case` 互斥提示与 `InvalidInputPath` 的文案可操作性 | 机器只断言「参数名在场 + exit 2」，判不了「读者知不知道下一步」；互斥措辞还属本文件定义的语义等价集 | senior-sdet + reviewer-backend 读两类 stderr 各一条，确认都写清「哪个参数冲突 / 该去掉哪个 / 覆盖路径该放哪」 |
| `Mismatch` 的内容源指引是否真能指路 | 机器只断言 `specTestCaseGate.mjs` 与 `buildData` 两个词在场（TC-023），判不了「第一次手改生成物的人看完是否知道该改哪一边」 | reviewer-backend 读一条真实 `Mismatch` 输出，确认它明确写出「`rules/spec-testcase-gate.md` 是生成视图，内容源在 `tools/docgen-spike/specTestCaseGate.mjs::buildData()`」 |
| `--write-baseline` 的「新增第 22 条」受控变更流程 | 该流程要先改 `specTestCaseGate.mjs::BASELINE_RULES` 常量（源码改动），与 R7 写入白名单 / R12「施工期 target diff 为空」冲突，不能在测试运行期做（TC-070 只覆盖机器可判的闭环） | 施工者在一次真实受控变更中跑一次：新增 rule → 路径并入 `BASELINE_RULES` → `--write-baseline` → `--gate` 绿 → 撤销；评审人核对 `baseline.json` 的 diff 只有那一条、且 target 与模板无 diff |

## 6 不测（带理由）

| 不测什么 | 为什么 |
|---|---|
| 写回 `rules/*.md` 的命令 | P2 做（spec §9、PRD §2）；本 spec 只用内存重建证明可重建 |
| 六种规则类型组合的骨架（「持续适用 × 义务」无触发时机节等） | P2 做（spec §9、PRD P1-1）；本轮只验枚举 + 5 格义务模板 |
| skill / agent 的模板、description、触发表 | P2（spec §9） |
| 存量迁移与迁移后的同步 | P3（spec §9） |
| spec 片段 / region 生成 | D18 明确不做（spec §9） |
| 通用 rule 模板 | spec §9：`rule.md.tpl` 只服务目标 rule |
| 目标规则 L60「（PRD 的 S4）」悬空引用的修复 | spec §2「不做」+ PRD P1-4：施工期 target diff 必须为空，该问题登记 P3 |
| 规则内容本身的写法质量（是否够格当一条 rule） | 属 `rule-inspector` 的评分范围，不属于生成器验收 |
| 跨组件引用语法、预算类断言 | P2（PRD §2「不做」） |

## 7 缺口与判别力水位

### 7.1 机器查不了的缺口

| 缺口 | 漏检哪类反例 | 至少 1 个样例 | 语义由谁兜 |
|---|---|---|---|
| 模板「无业务原文」的完全性 | 把一段 <20 字但业务化的文字写进模板（3 段签名抓不到） | 模板把 `## 核心判据` 改写成 `## 核心判据（五条缺一不可）` | 评审人对照 spec §5.2 人工抽查（§5 已登记） |
| fs 探针的 API 面 | 用探针未替换的 API 读 target | render 替身用 `fs.createReadStream(target)` 或 `fs.promises.open(target)` | spec §5.5 已把「替换面或 Proxy」与「组件不得 import `node:fs`」写死（TC-005 断言静态约束）；剩余部分（是否真的覆盖全部导出）由 reviewer-backend 代码评审兜 |
| 错误消息的可操作性 | 字段齐全但文案让人不知道怎么修 | `BaselineDrift` 只说「不一致」，不说要改哪个文件 | senior-sdet 人工读（§5 已登记）；`UnregisteredHandwritten` 的两个指引词已由 TC-041 机器断言 |
| 真实中断（SIGKILL）下的自动恢复 | exit 钩子不执行的场景 | V4 创建文件后立刻 `kill -9` | **已定（spec §7.4）：启动对 V4/V10 唯一临时文件做哨兵自愈（精确串 → 删除 + 打印「已清理上次中断残留」；近失 / 非哨兵 → `UnregisteredHandwritten` fail-closed）**；TC-057 覆盖三个内容变体；真实 SIGKILL 时序仍属人工（§5） |
| 真实 Windows 克隆（`core.autocrlf=true` 且 `.gitattributes` 未生效） | 只有 `.gitattributes` 生效后的结果被测过 | 新机器首次 clone 后直接跑 `npm run check` | R15 已把 `.gitattributes` 排为第一环（TC-066 验可见后果）；克隆现场仍属人工（§5） |
| R15 的「先后顺序」本身 | 顺序是过程事实，跑完之后无法从产物反推「常量是不是在 LF 工作区上算的」 | 先在 CRLF 工作区算常量、后落 `.gitattributes`：TC-066 的「工作区无 CR」会绿，但常量已错 | 由 plan 的 Task 顺序保证（`.gitattributes` → 确认 LF → 算常量 → 接 gate）；TC-066 只验顺序造成的可见后果 |
| `--out` 经 junction / symlink 绕过（平台建不了链接时） | 只有三次链接尝试都失败时才会只剩人工兜底；此时字符串判定看不出链接 | `fs.symlinkSync(rules, '.tmp-test/TC-065/link', 'junction')` 后 `--out` 指进 link | spec §7.1 已要求「最近已存在祖先」realpath 复判；**默认由 TC-065 机器跑**（Windows junction 不需管理员），仅建不了链接时留 1 条显式 skip 并转本表人工项 |
| `realpathSync` 复判与「文件不存在」的优先级 | 路径不存在时若直接 `realpathSync(abs)` 会抛 `ENOENT`，抢在 `TemplateReadFailed` / `GeneratedMissing` 之前 | `--template .tmp-test/V11/nope.tpl`（TC-044/TC-055 的输入） | **已定（spec §7.1）：从 `abs` 向上找最近的已存在祖先 `probe`，`realRoot = realpathSync(root)`、`realProbe = realpathSync(probe)` 后判 `path.join(realProbe, path.relative(probe, abs))` 是否在 `root` 内**——不存在路径也能复判、且不会抛 `ENOENT`；TC-044 / TC-055 的判据即该口径的正面验证 |
| 输入侧 / 输出侧的复判分叉 | 曾出现「只对已存在路径复判」在输出侧等于永不复判（输出文件通常尚不存在） | `--out .tmp-test/TC-065/link/tc065-probe.md`（link 存在、探针文件不存在） | **已定（spec §7.1）：统一按「最近的已存在祖先」复判，输入侧与输出侧不再分叉**；TC-065 判据即正面验证，`MUT-70`（按字面跳过输出侧复判）为其反例 |
| fixture 非 JSON 的**错误码** | 曾缺码名 → 只能断言退出码 | fixture 写成 `{bad` | **已关闭（spec §4.3）：明确不分配产品错误码（属用例输入缺陷），只给退出码 3**；TC-064 断言 exit 3 + 不出现产品码 |
| 错误码 → 退出码的逐码映射 | R10 只给四类；逐个码归哪一档曾无出处 | TC-048 曾只能断言「非 0」，而 TC-054 能断言「恰为 2」 | **已定（§7.1 表 + 断言模式段，第 8 轮修订为条件式）：1 = 用例期望未命中、2 = baseline/环境/路径越界、3 = IO/依赖（fixture 读取/解析失败也归 3）**；断言模式不改变「档位」本身，只决定「是否按命中处理」——该码**正是本例期望** → `PASS V<n>` + exit 0；**不是本例期望** → 用自己的档位（2 或 3）；只有「期望未命中」才 `FAIL V<n>` + exit 1（第 6 轮「一律不得压成 PASS / FAIL+1」的绝对说法已被取代，仅作历史记录）。TC-042/046/048/054/056/057/063/065/**071** 断 2、TC-045/**055**/064/**068** 断 3、TC-053/**069** 断 1、TC-070 断 0。**残部已关闭**：`--case V1 --target <不存在>` 现由 §7.1 断言模式段定为 exit 3（`TargetReadFailed` 不是 V1 的期望），TC-068 已恢复为该分支（§8 #22） |
| §7.1 里 `ROOT` 是哪个目录 | 若实现把 `ROOT` 取成仓库根，`--out rules/x.md` 与 `--out .tmp-testx/a.md` 都会通过三段判定 → 白名单形同虚设 | `--out rules/x.md`（在仓库根之内，三段判定看不出「不该写」） | **已定（spec §7.1）：`ROOT = <仓库根>/tools/docgen-spike/.tmp-test`**；TC-042 判 `rules/x.md` 必被拦且 exit 2，TC-046 另加「`ROOT` 定义负例 + 正对照」（`MUT-68` 取仓库根 / `MUT-69` 收窄根 都会判红） |
| 字段长度上限 / 超时语义 | 曾属「不会发生」的假设：超长输入与挂起没有判据 | 10MB 的单行 `pass`、或 gate 卡住不返回 | **已定（§6.1）：「不设字段长度上限；不设超时（Node 默认）；大文件按内容处理」**——这是明确的设计选择，不是未定义行为，故不单列用例（见 §7.2 第 1、3 项） |
| 防自递归静态扫描的绕过形态 | TC-067 只对测试文件源码做字面量扫描；拼接（`'npm ' + 'run check'`）、`process.env.npm_lifecycle_event` 间接判断、或用 shell 脚本包一层都能绕过 | 在 `cli.test.mjs` 里写 `execSync(['npm','run','check'].join(' '))` | spec §7.2 已要求「测试文件禁止调用」+ `DOCGEN_CHECK_ACTIVE` 哨兵（第二道闸）；字面量之外的形态由 reviewer-backend 代码评审兜 |
| gate 之外的模式是否也做模板硬编码检查 | spec §7.2 只把 `assertTemplateClean` 写进 gate 的步③.5；`--case V*` 路径是否调用它没有规定，机器不能替未定义行为写期望 | `run.mjs --case V1 --template <.tmp-test 内的全文副本>` | TC-018 在单元层锁死 `assertTemplateClean` 本身；`--case` 路径的语义由 reviewer-backend 在当前 spec 范围内判定（若要一致，需 spec 补一句，见 §8 建议 #20） |
| 哨兵串怎么被测试拿到（§7.4） | — | 测试想构造 `rules/tmp-new-rule-V4.md` = 精确哨兵串 | **已关闭（spec §5.4）：`SENTINEL_V4` / `SENTINEL_V10` 从 `specTestCaseGate.mjs` 导出，V4/V10 与测试引用同一常量，禁止猜字符串**；TC-057 的「精确串」分支按 import 常量写，另加「测试里不得出现哨兵字面量」的来源断言 |
| 嵌套 `npm run check` 时「干净树」被污染（§7.4 + §0） | 唯一名只解决 V4/V10 互删；外层 V10 持有 `-V10.md` 时，TC-049/TC-051/TC-070 会先命中 `UnregisteredHandwritten` | `npm run check` → `node --test` → TC-051 期望 `Mismatch` 却拿到 `UnregisteredHandwritten` | **已关闭（spec §7.2，第 8 轮补齐清单）：涉及 check 的 e2e（V10/V10b 及 TC-049/051/057/070）只由 `run.mjs` 串行编排；`node --test` 在 `DOCGEN_CHECK_ACTIVE=1` 下对这些用例显式 `t.skip()`（skip 原因进 TAP）**；TC-049/051/070 已写明该口径与「单跑不得 skip」的反向判据（`MUT-93`），TC-057 已按同一口径写明；§8 #25 关闭 |
| ROOT 内预置副本 vs 启动清理（§7.4 + R14） | 故障注入副本只能放 `.tmp-test/**`（R14），但启动先删 `.tmp-test/`（§7.4）→ 不带 `--no-clean` 时 spawn 前预置的副本必被删，用例读到「文件不存在」 | `--gate --baseline .tmp-test/TC-052/baseline-missing.json`（期望 `BaselineDrift`，实际只能拿到 `InvalidBaseline`） | **已关闭（spec §7.3；第 9 轮起为「副本归属两分」）**：① `--case Vn` 内的副本由用例代码在启动清理之后自建（TC-031/051/052/053/054 按此写）；② `--gate` / `--compare` 等非 `--case` 模式的副本**允许**在 spawn 前预置，但必须带 `--no-clean`（否则仍会被启动清理删掉）且 spawn 前先断言存在（TC-065/069 按此写）；TC-071 用「跑完仍不存在」断言避开预置；**唯一「不带 `--no-clean` 仍预置」的例外**是 TC-057 的 ROOT 残片（`stale/x.md`，§8 #26） |

### 7.2 测试设计固定清单逐项结论

| # | 必答项 | 结论 |
|---|---|---|
| 1 | 输入空间（有效/无效/边界/空/不存在/非法/重复/超长/特殊字符） | 已覆盖：有效（TC-001/004/070）、空串与纯空白（TC-007/008）、空数组（TC-010/011）、不存在（TC-044/045/064、**TC-068（`--target` 不存在但在 ROOT 内）**）、非法类型（TC-012）、重复（TC-033/038）、重复占位符（TC-004）、BOM/CR/非法 UTF-8（TC-026–030）、反斜杠与 `..`（TC-035/047）、CRLF（TC-025/026）、含 `\r` 的比对对象（TC-022）、非法 `--case` 值（TC-063）、非法 fixture（TC-064）、junction/symlink 路径（TC-065）、`ROOT` 外的绝对/相对形态（TC-042/046）、**模板内容 = target 全文（TC-069）**、**`--write-baseline` 无输入（TC-070）与「与 `--baseline` 同给」（TC-071）**、**哨兵内容三变体：精确串 / 近失串 / 非哨兵（TC-057）**。**超长**：spec §6.1 已定「不设字段长度上限」，属明确设计选择而非未定义行为，不单列用例（第 4 轮由 §8 建议 10 收口） |
| 2 | 状态与转移 | 本 spec 无长驻状态机；等价物是「输入角色 × 校验阶段 × 模式」。已穷举：target/template/baseline 三个输入角色（TC-026/027/029）、generated 副本不作为输入角色（TC-025）、**四个模式 gate / 断言 / write-baseline / compare（TC-049/051/052/053、TC-070、TC-045）**、四模式互斥与枚举非法（TC-063、**TC-071**）、退出码四态（TC-049/053/054/055/063/064/068/069/070）、**启动态与退出态**（启动清 ROOT + 哨兵自愈 TC-057；退出钩子删 ROOT TC-058）。不可达态：`.tmp-test/` 下 generated 副本不做环境预检（TC-025 用「不得出现 EnvironmentEOL」固定）；四模式两两并存态按 §7.1 定为不可达（同给即 exit 2） |
| 3 | 失败面（文件 IO / 进程 / 权限 / 超时 / 配额） | 已覆盖：读失败（TC-044、fixture 读失败 TC-064、**`--target` 读失败 TC-068**）、写失败（TC-043）、生成物缺失（TC-045）、模板篡改（TC-018 单元 + **TC-069 走 gate**）、target 被读（TC-016）、进程内钩子（TC-017/TC-057）、参数冲突（TC-063、**TC-071**）、路径越界（TC-042/046/048/065）、**测试自身递归（TC-067）**、**baseline 被手改（TC-070）**。**权限与磁盘满未覆盖**：Windows 不可构造，登记为 §5 手工项；**超时**：spec §6.1 已定「不设超时（Node 默认）」，属明确设计选择，不单列用例（第 4 轮由 §8 建议 10 收口） |
| 4 | 判据来源 | 每条判据的期望值来源已写进用例：「spec 原文」（如 `line = \n 数量 + 1`、字段名、9 个 H2 的有序数组）、「不变量」（哈希前后相同、`git status` 为空、`.tmp-test/` 退出后不存在）、「常量」（21 条、`JSON.stringify(...,null,2)+'\n'`）。**无自证循环**：没有任何一条用例以「实现输出长这样」当期望；TC-001 的期望来自 target 字节本身，**TC-023 的 `byte`/`line` 由测试读 target 字节独立复算（不采信实现打印的数值）**，TC-058 的期望来自「两遍输出相等」这一不变量；**哨兵期望值来自 `specTestCaseGate.mjs` 导出的 `SENTINEL_V4` / `SENTINEL_V10`（与 V4/V10 同一常量，§5.4），不是测试侧抄写的字面量**（反例 `MUT-94`） |
| 5 | 确定性 | kill / 并发 / 时序三类都换成了可构造状态：SIGKILL → 预置残留文件（TC-057）；并发 → 不测并发，改为串行 + 单例目录（TC-058）；时序 → 两遍比对（TC-003/058）。无可重复性缺口 |
| 6 | 回归资产 | §4 已给「改 X 必跑 Y」**16 行**（第 6 轮新增「哨兵串常量」一行）；历史 bug 已固化为用例：卡片的 25 张里可机判的部分全部落成 TC（V1 不写盘 → TC-001；V2 改副本 → TC-023；模板抄全文 → TC-018/069；render 读 target → TC-016；baseline 手改 → TC-031/052/070；清理不碰 rules → TC-057；`--out` 白名单绕过 → TC-046/065）。**第 1 轮议会评审的 testcase 缺陷也固化成断言**：F1（8 vs 9 个 H2）→ TC-002 的有序数组；F4（自递归）→ TC-067 静态扫描；F8/F16（Mismatch 无指引 / 偏移只验格式）→ TC-023 的精确断言；F11（GeneratedMissing 无入口、target 读失败无码）→ TC-045/TC-068；F15（gate 漏 `assertTemplateClean`）→ TC-069；F13（日志落点被启动清理删掉）→ TC-058 的内存比对；F14（Windows 命令缺失导致负断言恒真）→ §0 断言工具约定。**第 6 轮新增回归点**：唯一名互删 → TC-041/TC-050；哨兵自愈与近失 → TC-057；退出钩子 → TC-058；全量 12 → TC-062。**第 7 轮新增**：哨兵常量的「来源」不许手抄 → TC-057（`MUT-94`）；嵌套 check 的显式 skip 与「单跑不得 skip」→ TC-049/051/070（`MUT-93`）。**第 8 轮新增回归点**：全量 13（含 V10b）→ TC-062（`MUT-88`/`MUT-89`）；`--no-clean` 的 owner 归属 + 副本由用例代码自建 → §0 与 TC-051/052/053/054；TC-057 并入 skip 清单 → TC-057（§7.2 已列）。**第 9 轮新增回归点**：副本归属两分（`--case` 自建 / 非 `--case` 带 `--no-clean` 预置 + 先断言存在）→ §0 与 TC-065/TC-069；旧断言口径的「现状陈述」清零 → §0 第 6 轮清单与 §8 #22 |
| 7 | 判别力（假阳性/假阴性各一例） | 假阳性样例：TC-047（Windows 反斜杠）——若实现用字符串前缀，合法写法会被误判越界，本用例能抓住；第二例：TC-071（`--write-baseline` 与 `--gate` 同给）——若实现「先写再校验」，命令报错退出 2 但文件已被改，只看退出码会误判为合格。假阴性样例：TC-025（CRLF 归一）——实现做了归一仍能「过」V1，只有 V2b 能判错；第二例：TC-069（gate 漏 `assertTemplateClean`）——模板贴全文时 `compareBuffers` 相等，`npm run check` 全绿，只有这条 e2e 能判错 |
| 8 | 盲点雷达（脏状态/中断/幂等/顺序依赖/跨平台） | 脏状态接管 → TC-057（ROOT 残留 + 两种哨兵残留 + 非哨兵残留）；中断恢复 → TC-057 + §5 手工项（SIGKILL / SIGINT / 删除失败三行）；幂等 → TC-003/058；顺序依赖 → TC-013/030/038/039/040/063；跨平台（大小写/路径/编码）→ TC-047（分隔符）、TC-035（反斜杠）、TC-026–030（编码）、TC-065（junction/symlink）、TC-066（`.gitattributes` 与 LF）。**第 6 轮新增两类**：①哨兵「近失」——内容 = 哨兵串 + 追加行必须**不**被自愈（TC-057，反例 `MUT-85`）；②嵌套执行时的「干净树污染」——唯一名只解决互删，外层 V10 的哨兵仍会污染 TC-049/051/070 的期望。**第 7 轮收口**：②由 spec §7.2 的显式 `t.skip()` 处理（TC-049/051/070 已写明，且加「单跑不得 skip」的反向判据 `MUT-93`）；哨兵串改由 `specTestCaseGate.mjs` 导出、测试 import（§5.4），并加了「测试里不得出现哨兵字面量」的来源断言。**第 8 轮全部收口**：TC-057 已并入 §7.2 的 skip 清单（#25 关闭）；ROOT 残片预置已由 §7.3 句末的明文例外允许、且测试须先断言它存在（#26 关闭）。**第 8 轮新增一类**：`--no-clean` 的 owner 归属——测试内 spawn 若不带，会清掉外层正在使用的 ROOT/临时文件，外层断言随执行顺序红绿（§0 硬约定；TC-057 是 owner 例外）。**第 9 轮新增一类**：预置副本的「先断言存在」——TC-065/TC-069 带 `--no-clean` 预置后若不先断言 `existsSync === true`，就无法区分「副本被启动了清理」与「被测行为没发生」，断言退化成空断言（spec §7.3 第②类的必备动作）。**大小写变体（`.TMP-TEST`）未单列用例**：Windows 文件系统大小写不敏感，spec §7.1 已把大小写纳入 `realpathSync` 复判的说明，由 TC-065 同一复判兜底 |
| 9 | 覆盖账 | spec 11 组验收锚点覆盖 11/11；R1–R15 覆盖 15/15；错误码 **19/19**；负例/边界 **58** 条 ≥ 正例 **13** 条（共 **71** 条；§3 表 59 行，含 TC-070 的边界形态）；§1 每行都指回具体 V 编号 / R 编号 / spec 节号 |

### 7.3 自由探索：这份 spec 与这个仓库最可能出事的 8 个角落

| # | 角落 | 为什么这份 spec 会撞上 | 已落到哪 |
|---|---|---|---|
| E1 | `--case <V1..V11>` 枚举封闭，边界用例只能塞进某个 V 例内部断言 | 新增边界（全角空格、`.tmp-testx`、乱序、fixture 非法）没有独立编号，失败时只看到「V3 FAIL」，无法定位是哪条 | 判据改用「断言名」定位（§0 约定）；CLI 层边界（互斥、枚举、fixture 退出码）已由 TC-063/064 单独覆盖，不再挤进 V 例 |
| E2 | `--out` 白名单的字符串前缀比较 | `tools/docgen-spike/.tmp-testx/` 与 `.tmp-test/../../rules/x.md` 都能通过 `startsWith`；`.tmp-test/` 内建 junction 指向 `rules/` 时字符串完全合法；还有一层更早的坑——`ROOT` 若取成仓库根，`rules/x.md` 本身就是「合法」的 | 四层用例接力：TC-046（`.tmp-testx` 前缀绕过 + `..` 穿越 + `ROOT` 定义负例/正对照）、TC-047（反斜杠）、TC-065（junction/symlink 经 realpath 复判）；spec §7.1 已写死 `ROOT` 定义 + `path.relative` + 「最近已存在祖先」realpath 双判 |
| E3 | fs 探针只替换 3 个 API | `fs.promises.open`、`createReadStream`、`node:fs/promises` 默认导入、`child_process` 全部绕过 | spec §5.5 已要求「扩展替换面或对 `node:fs` 导出做 Proxy」+ 静态约束；TC-005 断言组件源码不出现 `node:fs` |
| E4 | V10 调 `npm run check`，而 check 会调 `run.mjs --gate`，且 check 还会跑 `node --test` | 链路 `run.mjs(V10) → check-all → node --test → 测试 → npm run check → …`：CI 时间翻倍只是小问题，**真正致命的是测试文件里跑 check 造成无限派生**（第 1 轮评审 F4） | **已落地（spec §7.2 防自递归段 + §7.3 V10）：测试文件禁调 `npm run check`/`check-all`，V10/V10b 只由 `run.mjs` 编排，`DOCGEN_CHECK_ACTIVE=1` 为第二道闸；gate 的失败原因会盖住 V10 断言的问题仍按 spec 裁定「只认最终退出码与关键输出、不认子进程链路」不采纳**——TC-067 静态扫描 + TC-049/TC-050 按此写 |
| E5 | 21 条基线常量与仓库现实的同步点 | 实测 `rules/` 当前恰 21 个 `.md`（本轮 Glob 复核仍为 21）；但仓库根**没有** `.gitattributes`（本轮 Glob 复核仍无） | TC-032 断言 21 条与字典序；`.gitattributes` 缺失由 TC-066 直接判红（R15 第一环） |
| E6 | `git hash-object` 不做换行转换 | 若工作区因 `core.autocrlf` 变成 CRLF，`TARGET_GIT_HASH` 与仓库 blob 不一致，而环境检查会先把 CRLF 报成 `EnvironmentEOL`（fail-closed） | TC-059 断言常量与命令输出一致；R15 已把「先 `.gitattributes`、再算常量」写成施工顺序（TC-066 验可见后果） |
| E7 | `realpathSync` 与「文件不存在」的优先级 | §7.1 要求对 `realpathSync` 结果复判，但路径不存在时直接 `realpathSync(abs)` 会抛 `ENOENT`——它会抢在 `TemplateReadFailed`（TC-044）与 `GeneratedMissing`（TC-045）之前，把「文件没了」误报成「路径越界」 | **已落定（spec §7.1）**：复判改为「从 `abs` 向上找最近的已存在祖先 `probe`」+ `realProbe`/`realRoot` 对齐后判包含，输入侧与输出侧同口径、不会抛 `ENOENT`；TC-044/TC-055 是该口径的正面验证，TC-065 验证输出侧不再被「文件尚不存在」豁免（反例 `MUT-70`） |
| E8 | `--write-baseline` 是**唯一**会写仓库内非 `.tmp-test` 文件的入口 | R7 说「所有变异只发生在 `.tmp-test/` 副本或内存」，而 §7.1 让 `--write-baseline` 写 `tools/docgen-spike/baseline.json`——两条规则是「受控例外」关系，实现很容易顺手把 target/模板也一起重写，或在互斥校验之前就先落盘，或把 `--baseline` 副本当写入目标 | TC-070（写出的字节必须 === `renderBaseline(BASELINE_RULES)`、条目数与常量一致、target/模板 SHA256 不变、撤销后哈希复原）、TC-071（与 `--gate`/`--case`/`--compare`/`--baseline` 同给时默认文件与副本都一个字节不写）；「新增第 22 条」的常量变更部分归 §5 人工项（§8 建议 #19） |

### 7.4 MUT 目录（判别力样本，红绿证据引用这里）

| MUT | 改什么 | 必须被哪条用例抓住 |
|---|---|---|
| MUT-01 | 空值判断写成 `value === ''`（不去 trim） | TC-007、TC-008 |
| MUT-02 | 去掉 `TODO` 判定 | TC-007 |
| MUT-03 | 删除 `criteria.length === 0` 检查 | TC-010 |
| MUT-04 | 删除 `applicability` / `polarity` 枚举校验 | TC-012 |
| MUT-05 | 交换 `validateData` 步1 与步2 | TC-013 |
| MUT-06 | 删除 `assertTemplateClean` 调用 | TC-018 |
| MUT-07 | fs 探针换空实现 | TC-016 |
| MUT-08 | 占位符替换改成 `replaceAll` 正则，未闭合静默跳过 | TC-002、TC-020、TC-021 |
| MUT-09 | render 拼入 `new Date().toISOString()` | TC-003 |
| MUT-10 | fixture 改深合并 / 把未给键置空 | TC-004、TC-015 |
| MUT-11 | 判据表改为常量字符串，不读数据 | TC-006 |
| MUT-12 | slot 名写成 `fourElements`（不带子键） | TC-009 |
| MUT-13 | 只校验 criteria，跳过步5 | TC-011 |
| MUT-14 | fixture 未知键静默忽略 | TC-014 |
| MUT-15 | 探针 `finally` 不恢复原函数 | TC-017 |
| MUT-16 | 未知占位符替换成空串 | TC-019 |
| MUT-17 | `line` 用字符偏移代替换行计数 | TC-022 |
| MUT-18 | 比对前 `toString().trim()` 归一 | TC-023 |
| MUT-19 | 前缀情形用 `actual.length` 取字节 | TC-024 |
| MUT-20 | 比对前把 `\r\n` 归一成 `\n` | TC-025 |
| MUT-21 | 对 generated 副本也做环境预检 | TC-025 |
| MUT-22 | `checkEnvironment` 只查 BOM | TC-026、TC-029 |
| MUT-23 | `checkEnvironment` 去掉 BOM 判断 | TC-027 |
| MUT-24 | 用 `buffer.toString('utf8')` 代替 `TextDecoder({fatal:true})` | TC-028 |
| MUT-25 | UTF-8 解码提到 BOM 判断之前 | TC-030 |
| MUT-26 | `--baseline` 被忽略，永远读仓库内文件 | TC-031、TC-034、TC-037 |
| MUT-27 | `renderBaseline` 用无缩进无尾换行的 stringify | TC-032 |
| MUT-28 | 步1 只用 try/catch 包 parse，且跳过重复检测 | TC-033 |
| MUT-29 | 跳过步4（不比对常量） | TC-034 |
| MUT-30 | 删除正则里的反斜杠拦截 | TC-035 |
| MUT-31 | 路径只判 `.md` 后缀 | TC-035 |
| MUT-32 | 跳过步3（存在性） | TC-036 |
| MUT-33 | 步1 增加「必须有序」判断 | TC-037 |
| MUT-34 | 把步2 提到步1 前 | TC-038 |
| MUT-35 | 把步4 提到步3 前 | TC-039 |
| MUT-36 | 把步5 提到步4 前 | TC-040 |
| MUT-37 | `finally` 不删本用例创建的文件 | TC-041、TC-058 |
| MUT-38 | 去掉 `--out` 白名单校验 | TC-042 |
| MUT-39 | 写盘异常不包装成 `WriteFailed` | TC-043 |
| MUT-40 | 读模板不加 try/catch | TC-044 |
| MUT-41 | 读生成物失败时返回空 Buffer | TC-045 |
| MUT-42 | 白名单用 `startsWith('.tmp-test')` 字符串前缀 | TC-046 |
| MUT-43 | 白名单用带正斜杠的完整字符串前缀 | TC-047 |
| MUT-44 | 只校验 `--out`，不校验 `--target` | TC-048 |
| MUT-45 | `check-all.mjs` 不接 gate | TC-050 |
| MUT-46 | gate 只做基线不做 compare | TC-051 |
| MUT-47 | gate 把基线校验包在 `try{}catch{}` 里吞掉 | TC-052 |
| MUT-48 | 任何情况都返回退出码 0 | TC-053 |
| MUT-49 | 退出码全用 1（不分档，不用 2/3） | TC-042、TC-048、TC-054、TC-055、TC-065 |
| MUT-50 | `--raw` 未实现，走普通路径 | TC-056 |
| MUT-51 | 启动无条件删 `rules/tmp-new-rule-*.md`（不校验哨兵内容） | TC-057 |
| MUT-52 | 只保留 SHA256，删掉 git hash 常量 | TC-059 |
| MUT-53 | `compare.mjs` 引入第三方包 | TC-060 |
| MUT-54 | V8 的 BOM 注入直接改真 target | TC-061 |
| MUT-55 | `--case` 被忽略，永远全跑 | TC-062 |
| MUT-56 | 真实 render 改成读 target 并返回其内容 | TC-005 |
| MUT-57 | 只做字符串 `path.relative` 判定，不做 `realpathSync` 复判 | TC-065 |
| MUT-58 | 去掉 `--gate` / `--case` 互斥校验（按出现顺序取最后一个） | TC-063 |
| MUT-59 | fixture `JSON.parse` 失败退化成空对象继续跑 | TC-064 |
| MUT-60 | 删除 `.gitattributes` 的 LF 规则（或该文件缺失） | TC-066 |
| MUT-61 | line 统计把 `0x0D` 也计为换行（或先把 `\r\n` 归一） | TC-022 |
| MUT-62 | `UnregisteredHandwritten` 消息删掉 `BASELINE_RULES` / `renderBaseline` 两条指引 | TC-041 |
| MUT-63 | 输入侧越界抛 `InvalidOutputPath`（或只打一行 stderr 不给码） | TC-048 |
| MUT-64 | `--case` 不校验枚举（`V12` 当成「未知用例，跳过」） | TC-063 |
| MUT-65 | 读不到 fixture 时忽略，用默认数据继续 | TC-064 |
| MUT-66 | `path.resolve` 后直接判 `startsWith(OUT_ROOT)`，不先算 `path.relative` | TC-046 |
| MUT-67 | `specTestCaseGate.mjs` 用 `execSync('cat <target>')` 取内容（绕过 fs 探针） | TC-060、TC-005 |
| MUT-68 | `ROOT` 取成仓库根（而非 `tools/docgen-spike/.tmp-test`） | TC-042、TC-046 |
| MUT-69 | `ROOT` 收窄成 `.tmp-test/<某一用例目录>`（为通过越界断言而缩小白名单） | TC-046（正对照分支） |
| MUT-70 | 输出侧按「目标文件不存在就跳过 realpath 复判」的字面实现（等价于输出侧永不复判） | TC-065 |
| MUT-71 | `--write-baseline` 少写尾换行或只写前 N 条 | TC-070 |
| MUT-72 | gate 删掉步③.5（不调 `assertTemplateClean`） | TC-069 |
| MUT-73 | 读 `--target` 失败时返回空 Buffer | TC-068 |
| MUT-74 | 去掉 `--gate`/`--case`/`--write-baseline` 三元互斥校验（按出现顺序取最后一个） | TC-071 |
| MUT-75 | `*.test.mjs` 里加 `execSync('npm run check')`（自递归） | TC-067 |
| MUT-76 | `Mismatch` 消息删掉「内容源在 `specTestCaseGate.mjs::buildData()`」那行 | TC-023 |
| MUT-77 | 模板漏掉 `## 例外`（只剩 8 个 H2） | TC-002 |
| MUT-78 | `line` 用字节偏移估算或差 1 | TC-023 |
| MUT-79 | 去掉 `.gitignore` 里的 `tools/docgen-spike/.tmp-test/` | TC-058 |
| MUT-80 | `check-all.mjs` 调 `--gate` 时不设 `DOCGEN_CHECK_ACTIVE` | TC-067 |
| MUT-81 | 把 `--target` 读失败归到 `InvalidInputPath` | TC-068 |
| MUT-82 | `--write-baseline` 顺带重写 target | TC-070 |
| MUT-83 | `--write-baseline` 先写盘、后校验互斥 | TC-071 |
| MUT-84 | V4 与 V10 共用 `rules/tmp-new-rule.md`（不按 §7.4 唯一名） | TC-041、TC-050 |
| MUT-85 | 哨兵比对写成 `includes` / 前缀匹配（把「哨兵串 + 追加行」也当哨兵删掉） | TC-057 |
| MUT-86 | 启动不删 `tools/docgen-spike/.tmp-test/`（只重建、不清残留） | TC-057 |
| MUT-87 | 去掉退出钩子里的 `fs.rmSync(ROOT)`（只在启动清） | TC-058 |
| MUT-88 | 全量总数写死 11（把 V2b 排除在无参编排外） | TC-062 |
| MUT-89 | 全量总数写死 12（把 V10b 排除在无参编排外——第 8 轮前的旧口径） | TC-062 |
| MUT-90 | 互斥只覆盖 gate / case / write-baseline，漏掉 `--compare` | TC-063、TC-071 |
| MUT-91 | 断言模式把所有前置错误压成 `FAIL V<n>` + exit 1（不按逐码表保留 2/3） | TC-068 |
| MUT-92 | `--write-baseline --baseline` 不拒绝、照写默认 `baseline.json` | TC-071 |
| MUT-93 | 涉及 check 的 e2e 在 `node --test` 里**无条件** skip（不看 `DOCGEN_CHECK_ACTIVE`）或用隐式约定（只靠执行顺序） | TC-049、TC-051、TC-070 |
| MUT-94 | 测试侧手抄哨兵字面量，不 import `SENTINEL_V4` / `SENTINEL_V10` | TC-057 |
| MUT-95 | 测试侧 spawn `run.mjs` 不带 `--no-clean`（嵌套时清掉外层 ROOT 或做哨兵自愈） | TC-051、TC-052、TC-053、TC-054、TC-069；反方向由 TC-057 守（owner 必须**不带** `--no-clean`，否则启动清理不发生） |

## 8 给开发的建议

**读法**：第 9 轮之后共 **26 条：23 条已落地（#21 / #23 / #24 / #25 / #26 的残部均已在 spec 补齐，其中 #24 / #26 第 9 轮改为「副本归属两分」口径）、1 条不采纳（第 4 条）、2 条仍开放（#19 / #20，均 P2）**。各轮吸收顺序：第 3 轮吸收第 11 条、关闭第 12 条一半；第 4 轮定义 `ROOT`（关 14）、realpath 改「最近的已存在祖先」（关 13、彻底关掉 11 的隐患）、补逐码映射表（关 12 残部）、§6.1 定「不设长度上限 / 不设超时」（关 10），按 V10 收窄断言把第 4 条裁定为不采纳；**第 6 轮吸收 #15 / #16 / #17 / #18 / #22（spec §7.4 退出钩子、R14 收入 `--compare`、全量口径、`--write-baseline` × `--baseline`、断言模式与前置错误），并把 #21 的唯一名部分落地（§7.4）；同时本轮自查新发现 #23 / #24**。**第 8 轮吸收 #25 / #26 与全量 13 例；第 9 轮把 #24 / #26 的落地描述改成「副本归属两分」，并把 #22 的落地描述改成条件式**。表中保留原条目并加「状态」列，方便下一轮判断「这条是不是已经改过」。

**第 5 轮（第 1 轮议会评审）的修复落点**：testcase 侧的 **F1 / F4 / F7 / F8 / F11 / F13 / F14 / F15 / F16 / F17 / F18** 已在前面的用例与 §0 约定里落地（见文件头「第 5 轮改动清单」）；spec 侧对应改动也已由 spec 作者同步（§5.2「9 个 H2」、§7.1 `--case <V1..V11|V2b>`（第 8 轮扩为含 `V10b`） / `--compare` / `--write-baseline` / `TargetReadFailed` / 三模式互斥、§7.2 步③.5 `assertTemplateClean` + 防自递归、§4.1 占位符来源表、§7.4 哨兵自愈）。

**第 6 轮（spec 作者吸收本轮建议）的落点**：§7.1「断言模式与前置错误」段（关 #22、并让 TC-068 回到 `--case` 分支）、全量口径（关 #17；第 8 轮再改为 13 例）、四模式互斥 + `--compare` 进 R14（关 #16）、`--write-baseline` × `--baseline` 同给 → exit 2（关 #18）、§7.4 退出钩子（关 #15）、§7.4 临时文件唯一名（#21 的互删部分）。

**第 7 轮（spec 作者补最后三处口径）的落点**：§5.4 哨兵常量导出（关 #23）、§7.2 涉及 check 的 e2e 显式 `t.skip()`（关 #21 的「干净树污染」残部）、§7.3 副本由 `run.mjs` 启动清理后自建 + §7.4 唯一名（关 #24）。

**第 8 轮（spec 作者补最后四处口径）的落点**：§7.1 `--case` 枚举含 `V10b` + 全量 **13** 例（TC-062 改判据、TC-049 补一致性说明、TC-063 同步枚举）、§7.1 断言模式补「该码正是本例期望 → `PASS V<n>` + exit 0」（TC-052 改判据，TC-053/054/068 补边界）、§7.1/§7.4 新增 `--no-clean` 与 ROOT 归属（§0 新增硬约定，TC-051/052/053/054/069 的 spawn 带 `--no-clean`，TC-057 为 owner 例外）、§7.3 副本由 `run.mjs --case Vn` 的用例代码自建（TC-051/052/053/054 前置改写；**TC-069 的这条写法已被第 9 轮取代**）、§7.2 把 **TC-057** 并入 skip 清单 + §7.3 给 ROOT 残片明文例外（**关 #25 / #26**）。**仍需处理**：只剩 #19（「新增第 22 条」只能人工，P2）与 #20（`--case` 是否也查模板硬编码，P2）。

**第 9 轮（spec §7.3 补「副本归属两分」）的落点**：§7.3 区分① `--case Vn` 内的副本由用例代码在启动清理后自建、② `--gate` / `--compare` 等非 `--case` 模式的副本可在 spawn 前预置（须带 `--no-clean` + spawn 前先断言存在），并保留 TC-057 的 owner 例外→ §0 硬约定改写（删掉「任何 spawn 前都不得预置」的绝对句）、TC-069（先建 → 断言 → 带 `--no-clean` spawn）、TC-065（junction 同构）、TC-031/051/052/053/054 的引用改为「`--case` 分支」、§7.1 缺口表与 §8 #24 / #26 的落地描述改为两分口径；同时把第 6 轮的旧断言口径（前置错误恒用 2/3 档、不因断言模式变 PASS）标为历史记录，§8 #22 改为条件式原文。**仍未解决**：只剩 #19（P2）与 #20（P2）。

| # | 位置（文件:行 / spec 节号） | 风险或盲点 | 为什么会被忽略 | 具体改法 | 优先级 | 状态 |
|---|---|---|---|---|---|---|
| 1 | spec §7.1 CLI；`--gate` 与 `--case` 同时给出 | 两个模式同时给时优先级未定义；实现会按参数出现顺序随机生效，测试无法写稳定判据 | 两个参数各有明文，组合没人写过 | 在参数解析末尾加互斥校验：同时给即报错，并在 stderr 写明「--gate 与 --case 不可同用」 | P1 | **已落地（spec §7.1：互斥 + exit 2 + stderr 提示；用例 TC-063）** |
| 2 | spec §7.1 `--out` 白名单；R14 | `startsWith` 字符串前缀可被 `.tmp-testx/` 与 `.tmp-test/../../rules/x.md` 绕过；Windows 大小写不敏感（`.TMP-TEST`）也会误判 | 「只接受 `.tmp-test/**`」写起来像一行前缀判断 | 统一走 `path.relative` 三段判定，再对 `realpathSync` 结果复判一次（防 junction/symlink/大小写） | P0 | **已落地（spec §7.1：`path.relative` + `realpathSync` 双判；用例 TC-046/047/065）** |
| 3 | spec §5.5 探针 | 只替换 `readFileSync`/`promises.readFile`/`openSync`，`fs.promises.open`、`createReadStream`、`node:fs/promises` 默认导入、`child_process` 全绕过 → V6① 可被作弊实现骗过 | 只列了三个最常用的 API | ① 探针扩展替换面或对 `node:fs` 导出做 Proxy；② 静态断言组件源码不得出现 `node:fs` | P0 | **已落地（spec §5.5：Proxy 或扩展替换面 + 静态约束；用例 TC-005）** |
| 4 | spec §7.2 接线 + §7.3 V10 | V10 内跑 `npm run check`，而 check 会调 `run.mjs --gate`：链路 `run.mjs(V10) → check-all → run.mjs(gate)`，CI 时间翻倍，且 gate 的失败会盖住 V10 的断言失败 | 两处各自看都合理，拼起来才成链 | ① 用 `DOCGEN_GATE_DISABLED=1` 之类的环境变量断开内层 gate；② V10 内调 check 时不带该变量；③ 断言只认「退出非 0 + 含 UnregisteredHandwritten」，不认链路 | P0 | **不采纳（spec §7.3 V10：只断言最终退出码与关键输出，不断言子进程链路；嵌套 gate 是预期，不引入 `DOCGEN_GATE_DISABLED`）** |
| 5 | spec §5 错误码表 + R14 | `--template`/`--target`/`--baseline` 越出 `.tmp-test/**` 时**没有错误码** → 测试只能断言「非 0」，无法区分越界拒绝与读取失败 | 错误码表是按「写」侧列全的，输入侧漏了 | 新增 `InvalidInputPath {path}` 并在错误码表补一行；同时定好它归 R10 哪一类 | P0 | **已落地（spec §7.1 新增 `InvalidInputPath`，并写明其退出码为 2；用例 TC-048 判据已收紧为 `exitCode === 2`）**。残部：无（其余码的逐码归属已由 §7.1 逐码表落地，见第 12 条） |
| 6 | spec §4.3 fixture | 浅覆盖对嵌套对象是**整块替换**，测试作者会误以为自己写错 fixture；非 JSON 的退出码未定 | 「浅覆盖」是设计正确，但对使用者反直觉 | ① 明确写「嵌套对象须给全子键」；② 定 fixture 非 JSON / 读取失败的退出码 | P1 | **已落地（spec §4.3：整键替换 + 须给全子键 + 非 JSON/读取失败 → exit 3；用例 TC-015/064）**。残部：无（§4.3 已明说这类失败**不分配产品错误码**，TC-064 只断言 exit 3 + 不出现产品码） |
| 7 | spec §3.1 / §8 | 未规定测试代码落点与运行命令 → testcase 的「对应测试」无处对号 | spec 只管产品代码，测试代码被默认「plan 会想」 | 在 §3.1 增加 `tools/docgen-spike/test/*.test.mjs` 与 `node --test tools/docgen-spike/test/` | P1 | **已落地（spec §3.1；本文件 §0 已对齐）** |
| 8 | spec §3.1 `.gitattributes` + R12 | 先接 gate 后落 `.gitattributes`，Windows 克隆首跑必红；`git hash-object` 不做换行转换，工作区被 autocrlf 改写后常量与仓库 blob 不一致 | 两件事分属「配置」与「常量」，看起来无关 | 把 `.gitattributes` 排为第一个 Task，同一 Task 里重检工作区、再算两个常量 | P0 | **已落地（spec R15：`.gitattributes` → 确认 LF → 算常量 → 接 gate；用例 TC-066 验可见后果）** |
| 9 | spec §6.3 步5；R5 | 新增一条 rule 就红，而错误消息不含「怎么合法新增」→ 使用者会当成 gate 坏了 | 强制本身是设计目的，缺的是流程 | `UnregisteredHandwritten` 消息追加「并入 `BASELINE_RULES`、重跑 `renderBaseline()` 覆盖 `baseline.json`」；并指明合法新增流程 | P1 | **已落地（spec §6.3 末段；用例 TC-041 断言两个指引词在场）。残留：文案措辞好坏仍属人工（§5）** |
| 10 | spec §5 / §6.1 步3 | 三处口径：① 字段长度上限；② 超时语义；③ `line` 与 CRLF 的交互 | 三者都是「不会发生」的假设，直到真的发生 | ① §6.1 写明「line 按 `0x0A` 计数」；② §5 写明「不设长度上限」；③ 若引入超时，补错误码与退出码归属 | P2 | **已落地（spec §6.1：① 不设字段长度上限；② 不设超时（Node 默认）；③ `line` 按 `0x0A` 计数 → 用例 TC-022）** |
| 11 | spec §7.1 realpath 复判 × §7.2 步③ × V11⑤ | `realpathSync` 对不存在的路径直接抛 `ENOENT`；若先做路径合法性再做读取，`--template .tmp-test/nope.tpl` 会报「路径越界」而不是 `TemplateReadFailed`，TC-044/TC-055 的期望值随之落空 | 「路径校验」与「读文件」被写成两段互不相干的代码，谁先谁后没人规定 | 在 §7.1 补一句顺序：路径合法性只对**已存在**的路径做 realpath 复判；不存在时把错误交给读取层（`TemplateReadFailed` / `GeneratedMissing`），不得用 `InvalidInputPath` 顶替 | P0 | **已落地（spec §7.1：复判对象改为「最近的已存在祖先」`probe`，`realRoot`/`realProbe` 对齐后判包含；不会抛 `ENOENT`，输入/输出同口径）**。用例 TC-044 / TC-055 判据不变；TC-048 只走越界分支（三个输入都是已存在的真文件）；TC-065 验证输出侧不再被「文件尚不存在」豁免（反例 `MUT-70`） |
| 12 | spec §7.1 退出码归属；§4.3 fixture 非 JSON | ① R10 只给四类退出码，未逐码列明；`InvalidInputPath` 归 2 还是 3 不明 → 用例只能断言「非 0」；② fixture 非 JSON 只定 exit 3，没给错误码名 → 断言只能打到退出码 | 四类退出码看上去已经「够用」，逐码映射被当成实现细节 | ① 在 spec 补一张「错误码 → 退出码」映射表（至少覆盖 `InvalidInputPath`/`InvalidOutputPath`/`TemplateReadFailed`/`GeneratedMissing`/`EnvironmentEOL`/`Baseline*`/`InvalidRuleType`）；② 给 fixture 非 JSON 定一个码名（或在 §4.3 明说「无码名，只是 exit 3」） | P2 | **已落地（spec §7.1 退出码逐码映射表：1 = 校验/比对类、2 = baseline/环境/路径越界、3 = IO/依赖，fixture 读取/解析失败归 3 且仍不分配码名）**。TC-053 断 1、TC-042/046/048/054/056/057/063/065 断 2、TC-055/064 断 3 |
| 13 | spec §7.1「realpath 复判**只对已存在路径**执行」 | 该句没区分输入侧与输出侧。`--out` 的目标文件通常**尚不存在** → 按字面执行等于输出侧永不复判，`--out` 经 junction / symlink 指向 `rules/` 就能重新绕过白名单（正是 TC-065 的输入形态），而同一节前半句仍承诺「防 junction / symlink」 | 这句是为修「读模板时 `ENOENT` 抢跑」（第 11 条）而补的，写的时候只想着输入侧的读取目标；输出侧看起来「反正要新建文件」 | 在 §7.1 补一句区分：**输入侧**（template / target / baseline / generated）不存在时跳过 realpath 复判、交给读取层；**输出侧**改为对「最近的已存在祖先目录」做 `realpathSync` 复判（`--out` 的父目录通常存在，不存在则上溯到存在的那一级），再判断是否落在 `rules/` 等价路径内 | P0 | **已落地（spec §7.1：复判统一按「最近的已存在祖先」执行，输入侧与输出侧不再分叉；`--out` 的目标文件不存在也照样复判）**。TC-065 判据已升级为「可构造时必测 + `InvalidOutputPath` & exit 2」，反例 `MUT-70` |
| 14 | spec §7.1 路径合法性公式里的 `ROOT` | 该符号全篇没有定义。若实现取成**仓库根**，`--out rules/x.md` 的三字符串判定会通过（`rel = 'rules/x.md'` 不以 `..` 开头、非绝对）→ 白名单形同虚设；TC-042 / TC-046 的期望值随之落空 | 公式本身看着完备，`ROOT` 像是「显然的那个根」；而 R14 的 `.tmp-test/**` 与 §7.1 的 `ROOT` 分处两节，读 §7.1 时不会自动回去对 | 在 §7.1 把符号定死：`ROOT` = `tools/docgen-spike/.tmp-test`（即 R14 的白名单根），并在公式后补一句「`rel` 即相对 `.tmp-test/` 的路径」；`--out` 的落点为 `ROOT` 的子路径 | P1 | **已落地（spec §7.1：`ROOT = <仓库根>/tools/docgen-spike/.tmp-test` 已定义）**。TC-042 断 `rules/x.md` → `InvalidOutputPath` + exit 2；TC-046 另加 `ROOT` 定义负例与正对照（反例 `MUT-68` 取仓库根、`MUT-69` 收窄根） |
| 15 | spec §7.4 清理 + R11 | 只写了「启动删 `.tmp-test/` 并重建 `ROOT`」「每例 `try/finally` 删本用例目录」，**没写进程正常退出后 `ROOT` 本身是否删除**。TC-058 按「退出后 `.tmp-test/` 不存在」判（V9 也要求「无 `.tmp-test/` 残留」），若实现只在启动清、退出后保留空目录，TC-058 会红，而实现方会认为「spec 没要求删」 | 「启动清」和「退出清」看起来是一件事，写一处就以为写全了；空目录在 git 里不可见，本地也「看着干净」 | 在 §7.4 补一句：进程结束（正常返回 / `process.exit()` / SIGINT / SIGTERM）时在 `process.on('exit')` / 信号钩子里 `fs.rmSync(ROOT, { recursive: true, force: true })`；启动仍先删再建。TC-058 的判据不动 | P1 | **已落地（spec §7.4 退出钩子：退出时删除本次创建的 `.tmp-test/`；删除失败则保留、由下次启动清理）**｜TC-058 判据不变（`git status` 空 + `.tmp-test/` 不存在 + `git check-ignore` 退出 0）；「删除失败」分支转 §5 人工项 |
| 16 | spec §7.1 `--compare` + R14 | `--compare <path>` 明写「只接受 `.tmp-test/**`」，但 R14 的越界白名单只列了 `--template` / `--target` / `--baseline`，逐码表也没说 `--compare` 越界归哪个码。实现可能放行（读到仓库真文件就比对）、也可能报 `InvalidInputPath`，测试无法写稳定判据 | `--compare` 是第 1 轮评审为补 `GeneratedMissing` 入口新加的，写的时候只想了「路径不存在」这一半 | 把 `--compare` 并入 R14 与 `assertInside(ROOT, p)` 的适用范围，越界 → `InvalidInputPath`（exit 2）；在 §7.1 逐码表的 2 档里点明「含 `--compare`」 | P1 | **已落地（R14 已把 `--compare` 并入白名单，与 `--target`/`--template`/`--baseline` 同走 `assertInside(ROOT, p)`）**｜越界分支由 TC-063（`--case` + `--compare` 同给）与 TC-071（`--write-baseline` + `--compare` 同给）覆盖互斥侧，TC-045 仍只测 ROOT 内缺失 |
| 17 | spec §7.1 `--case` 枚举 + 断言模式末行 | `--case <V1..V11\|V2b>` 把 V2b 纳入合法值，但「省略 `--case` 跑全部」的 `<n>/<total>` 里 **`total` 是 11 还是 12** 没写。V2b 是 V2 的子锚点、独立成例，两种口径都能自圆其说；实现选哪个都能说「符合 spec」，而 CI 的汇总断言只能二选一 | 汇总行格式被当成输出细节，「哪些算一例」没人写下来 | 在 §7.1 或 §7.3 补一句：全量跑 = `V1..V11` 共 11 例（V2b 只由显式 `--case V2b` 触发），或明确 `total = 12`。定稿后把 TC-062 的 `(11\|12)` 收紧成单一值 | P1 | **已落地（spec §7.1 断言模式段末句；第 8 轮修订为：省略 `--case` 跑 V1–V11 + V2b + V10b = **13**，V10b 计入）**｜TC-062 已改为 `13/13 PASS` + 13 行断言（反例 `MUT-88` 总数写 11 / `MUT-89` 总数写 12） |
| 18 | spec §7.1 `--write-baseline` 与 `--baseline` 的交互 | `--write-baseline` 说「写到 `tools/docgen-spike/baseline.json`」，但没写**同时给 `--baseline <副本>` 时**写哪一边：写固定路径（副本被忽略）、写副本（等于绕过 R14 的写入白名单把结果写到 `.tmp-test` 外？）。两者都不在互斥三元组里，组合是允许的但语义为空 | 单看每个参数都清楚，`--baseline` 是「读哪份」、`--write-baseline` 是「写哪份」，一组合就没人定义 | 在 §7.1 写明：`--write-baseline` 固定写 `tools/docgen-spike/baseline.json`，`--baseline` 对它无效（或把二者也纳入互斥）。补一句后 TC-071 可加一条分支 | P1 | **已落地（spec §7.1：与 `--baseline` 同给 → exit 2；`--write-baseline` 只写默认 `baseline.json`）**｜TC-071 第 ⑤ 分支断言「默认文件与副本都一个字节未写」（反例 `MUT-92`） |
| 19 | spec §7.1 `--write-baseline` + §7.3 末段「新增第 22 条」正例 | 该正例要求「新增第 22 条 → `--write-baseline` → gate 绿」，但第 22 条必须先进 `BASELINE_RULES` 常量（源码改动）——这不在任何测试的写入白名单内，也无法在 `npm run check` 运行期间安全地做（基线中途从 21 变 22）。结果：这条正例只能人工跑，自动化只能覆盖「写回常量渲染结果」这一半 | 「合法新增流程」被当成一次普通用例，没人注意它要改源码常量 | 二选一：① 承认它是受控变更流程，spec §7.3 末段改写「由施工者在受控变更时人工执行，testcase 只覆盖写回闭环」（现 §5 人工项按此写）；② 若真要自动化，加一个只读的环境变量入口（如 `DOCGEN_BASELINE_EXTRA`）让测试不改源码，但那是新设计，需单独评审 | P2 | **仍开放**（TC-070 覆盖机器可判闭环；常量变更部分在 §5 人工项） |
| 20 | spec §7.2 步③.5（只写进 gate） | `assertTemplateClean` 只在 gate 的步③.5 出现，`--case V*` 路径是否也做模板硬编码检查没有规定。若 `--case` 不做，施工者用「全文模板 + `--case V1`」仍可能拿到 PASS（V1 走内存 render + compare，模板=target 时字节相等） | gate 与 case 是两套流程，写 gate 时只想着日常门 | 在 §7.2 补一句：模板读取后**所有模式**都过 `assertTemplateClean`（放在读模板之后、渲染之前），或明说只有 gate 查、并说明 `--case` 下的风险可接受 | P2 | **仍开放**（TC-018 锁单元层；TC-069 只覆盖 gate；`--case` 路径的语义待 spec 定） |
| 21 | spec §7.2 防自递归段 + §7.4 清理 + §7.3 V10 | 嵌套链 `run.mjs(V10) → check-all → node --test → 测试内 spawn run.mjs` 里，V10 正持有 `rules/tmp-new-rule-V10.md`，而四条用例依赖干净树或独占该文件（TC-049 干净 check、TC-051 `Mismatch`、TC-057 预置并删除哨兵、TC-070 gate 绿）。spec 只写了「测试文件禁止调 `npm run check`」，没写这些用例在嵌套调用时怎么隔离；`DOCGEN_CHECK_ACTIVE=1` 也只规定影响 `run.mjs` 的 npm 子调用 | 防自递归写的是「不要递归」，没人接着问「不递归了，但外层正持有哨兵时内层测试还能不能跑」；本地单跑测试永远看不到这个问题，只有 `npm run check` 才暴露 | 在 §7.2 补一条测试隔离规则，二选一：① `check-all.mjs` 把 `DOCGEN_CHECK_ACTIVE=1` 也传给 `node --test`，依赖干净树的用例见该变量即 `t.skip()`（skip 数必须可辨认）；② 规定每条用例用各自的规则文件名（如 `rules/tmp-new-rule-<用例>.md`），并让 `UnregisteredHandwritten` 的扫描与清理都按文件名前缀区分。推荐 ②（隔离靠结构，不靠环境变量） | P1 | **已落地（spec §7.4 唯一名 + §7.2 显式 `t.skip()`：涉及 check 的 e2e（V10/V10b 与 TC-049/051/057/070）只由 `run.mjs` 串行编排，`node --test` 在 `DOCGEN_CHECK_ACTIVE=1` 下对这些用例显式 skip，原因进 TAP；TC-049/051/070 已写明，并加「单跑不得 skip」的反向判据 `MUT-93`）**｜**第 8 轮补齐**：清单已含 TC-057，残部关闭（#25 一并关闭） |
| 22 | spec §7.1 断言模式 vs 逐码映射表 | 两条口径在 `--case` 模式下打架：断言模式说「未命中用例期望 = `FAIL V<n>` + exit 1」，逐码表说 `TargetReadFailed` → exit 3、`TemplateReadFailed` → exit 3、`EnvironmentEOL` → exit 2。于是 `run.mjs --case V1 --target <不存在>` 到底给 1 还是 3 没有答案；同一命令两种实现都能自称合规，CI 的停损会把「环境没准备好」算成「用例失败」或反过来 | 两条规则各自都自洽（一条讲「用例视角的判定」，一条讲「错误码的档位」），交叉点没人写；V11 的 6 个注入都走 gate 模式，所以平时不暴露 | 在 §7.1 断言模式段补一句优先级：**环境/IO/路径类（逐码表 2 档、3 档）在 `--case` 模式下仍按逐码表退出，只有 1 档错误才走「命中期望 → PASS / 未命中 → FAIL+1」**；或反过来明说「`--case` 下一律 FAIL+1，逐码表只适用 gate / CLI 模式」。定稿后 TC-068 可补一条 `--case` 分支（**第 8 轮定稿在「按逐码表退出」之上再补半句：该码正是本例期望时按命中处理 → `PASS V<n>` + exit 0；见右侧状态列**） | P1 | **已落地（spec §7.1「断言模式与前置错误」段，第 8 轮修订为条件式）**：前置错误只在**不是本例期望**时才用自己的档位（逐码表 2 档 / 3 档）；当该码**正是本例期望**时按命中处理 → `PASS V<n>` + exit 0；只有「用例期望未命中」才 `FAIL V<n>` + exit 1。**第 6 轮的绝对口径（前置错误不因断言模式变 PASS、2 档恒 2 / 3 档恒 3）已被第 8 轮取代，仅作历史记录，不得当作现状引用**｜TC-068 已恢复为 `--case V1 --target <ROOT 内缺失>`，断言 exit 3（`TargetReadFailed` 不是 V1 的期望）+ 不出现 `PASS V1`（反例 `MUT-91`） |
| 23 | spec §7.4 启动段（哨兵自愈） | 「内容等于各自写入的固定串」是两个**实现侧常量**，但 spec 没规定它们怎么暴露给测试。TC-057 要预置「精确等于哨兵串」的文件；若测试只能猜字符串，就是自证循环；若完全拿不到，这条分支只能永远 skip | 「固定串」看起来是普通实现细节，写的时候不会想到「测试要构造它」；而 TC-057 的另外两个变体（近失 / 非哨兵）不需要精确串，容易让人以为整条用例已可跑 | 在 §7.4 补一句：两个哨兵串必须从可导入常量导出（例如 `run.mjs` 导出 `TMP_SENTINELS = { V4, V10 }`，或从 `specTestCaseGate.mjs` 导出），供测试与运行时共用同一份；导出点确定后把 TC-057 的「精确串」分支从「待 plan Task N」改为可执行 | P1 | **已落地（spec §5.4：`SENTINEL_V4` / `SENTINEL_V10` 从 `specTestCaseGate.mjs` 导出，V4/V10 与测试引用同一常量、禁止猜字符串）**｜TC-057 已改为 `import` 这两个常量，「精确串」分支可执行，并加「测试里不得出现哨兵字面量」的来源断言（反例 `MUT-94`） |
| 24 | spec §7.4 启动清理 × §7.1/R14 副本白名单 | **启动先删 ROOT**，而 R14 要求故障注入副本只能放 ROOT 内 → 测试**无法在 spawn 前预置副本**（必被删）。受影响：TC-031 / TC-051 / TC-052 / TC-054 / TC-065 / TC-069（TC-071 的 `--baseline` 分支已改为「跑完副本路径仍不存在」，不受影响）。症状：副本消失后报 `InvalidBaseline` / `TemplateReadFailed` / `GeneratedMissing`，期望的 `BaselineDrift` / `EnvironmentEOL` / `Mismatch` / `InvalidOutputPath` 永远拿不到；把副本挪到 ROOT 外图省事，又会被 `InvalidInputPath` 拦下（测试通过的原因变了） | 「启动清理」在 §7.4、「副本白名单」在 §7.1/R14，各自看都对；只有把两条放进同一条执行链（spawn → 清理 → 解析参数 → 读副本）才会撞 | 三选一：① 所有故障注入改为 `--case Vn` 内部自建（V7/V8/V10b 已按此写），gate 模式不外挂副本；② 启动清理改为「先解析参数，只清与本次运行无关的目录」；③ 提供显式注入钩子（如 `--seed <case>`）在清理之后、读文件之前建副本。推荐 ①（与现有 V 例一致，不新增语法） | P0 | **已落地（spec §7.3；第 9 轮起为「副本归属两分」）**：① `--case Vn` 内的副本由用例代码在启动清理之后自建（TC-031/051/052/053/054 按此写）；② `--gate` / `--compare` 等非 `--case` 模式的副本允许在 spawn 前预置在 ROOT 内，前提是 spawn 带 `--no-clean` 且 spawn 前先断言文件存在（TC-065/069 第 9 轮按此改写）。TC-071 用「跑完副本路径仍不存在」断言避开预置；`InvalidInputPath` 的对照值不变。**例外**：TC-057 的 `.tmp-test/stale/x.md`（#26） |
| 25 | spec §7.2「涉及 check 的 e2e」清单；§7.4 启动清理 | 清单只列 **V10/V10b + TC-049/051/070**，但 **TC-057 也会写并删除 `rules/tmp-new-rule-V10.md`**（近失内容覆盖外层 V10 的哨兵）、并在运行期持有 `rules/tmp-new-rule-TC057.md`。嵌套 `npm run check` 时它仍在跑：外层门可能先看到被改写的 `-V10.md`，或在自己的 `node --test` 期间丢失哨兵 → 外层的 `UnregisteredHandwritten` 断言随执行顺序红绿不定 | 清单是按「谁调了 `npm run check`」列的，TC-057 自己不调 check，所以被漏掉；而它破坏的是**别人的**前提，本地单跑永远看不到 | 把 TC-057 并入 §7.2 的同一份 skip 清单（`DOCGEN_CHECK_ACTIVE=1` 下显式 `t.skip()`，原因写「本条读写 `rules/tmp-new-rule-V10.md`，与外层 V10 冲突」），并在 §0 的隔离段同步；若将来改用「每条用例独立文件名」的结构隔离，则本项自动失效 | P1 | **已落地（spec §7.2 第 8 轮把 TC-057 并入同一份 skip 清单：`DOCGEN_CHECK_ACTIVE=1` 下显式 `t.skip()`，原因写「本条读写 `rules/tmp-new-rule-V10.md`，与外层 V10 冲突」；§0 的隔离段已同步）**｜TC-057 已写明「嵌套时显式 skip、串行/单跑照常执行」；清单现为 V10/V10b + TC-049/051/057/070 |
| 26 | spec §7.3（第 8 轮前的 blanket 措辞：「测试不得在 spawn 前预置 ROOT 内文件」）× TC-057 第 1 支 | TC-057 要验「启动先删 ROOT」，就必须在 spawn 前把 `tools/docgen-spike/.tmp-test/stale/x.md` 放进去；按当时的 blanket 措辞这被禁止。若照字面执行，该断言变成「一个从未存在过的文件不存在」——恒真、验不出任何东西（典型空断言） | §7.3 写的是「副本」（`--target`/`--baseline` 等被读取的输入），TC-057 的残片不是输入而是「待清理对象」；两类东西共用一句话就被误伤 | 在 §7.3 补一个显式例外：**TC-057 的 ROOT 残片允许预置**，且测试必须在 spawn 前先断言它存在（`existsSync === true`），否则该支作废；或提供 `--seed <case>` 钩子，由 `run.mjs` 在清理之后、跑用例之前建残片（与 #24 的 ③ 同构）。**不得**把残片挪到 ROOT 外（那就不验启动清理了） | P2 | **已落地（spec §7.3；第 9 轮口径）**：**不带 `--no-clean` 的 spawn 不得预置 ROOT 内文件**，**唯一例外**是 TC-057 的 `.tmp-test/stale/x.md`（它是 owner、spawn 不带 `--no-clean`，验的正是启动清理）；带 `--no-clean` 的非 `--case` spawn 则允许预置，前提是 spawn 前先断言存在｜TC-057 已写明 spawn 前先 `assert.strictEqual(fs.existsSync(...), true)`，否则该支是空断言 |
