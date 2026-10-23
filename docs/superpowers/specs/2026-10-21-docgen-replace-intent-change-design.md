# Docgen 写盘通路：迁移期与变更期分派（有意变更）

> 日期：2026-10-21｜状态：**已定稿**（议会 2026-10-21 第 1 轮通过：6 席评审，26 族问题全部处置，审计 8 项关闭）｜触发：`docs/handoffs/2026-10-21-f1-sdet-desc-trigger.md`（用户 2026-10-21 裁定「路 B」）
> 测试用例文件：`docs/superpowers/specs/2026-10-21-docgen-replace-intent-change-design-testcase.md`（由独立 `senior-sdet` 子代理在全新上下文编写）
> 依赖：S1 能力地基（CLI / 错误码五档）、S2 试点（evidence 四字段）、S3（第二套模板 / 黄金快照锚点）、S4 `2026-10-19-docgen-agent-batch-design.md`（R6 双闸门 / R7 卡字节不变）、线 E `2026-10-20-execution-assurance-matrix-design.md`（十键注解契约）

## 0 为什么

迁移闭环证明的是「**搬数据时没有改动内容**」——渲染必须与迁移前提交快照逐字节相等。这是一次性的验收证明，却在 `cmdReplace` 里被写成了**永久前置条件**：

- `cli.mjs:222-224`：`evidence.goldenAssertion !== 'pass'` → `EvidenceInvalid`；
- `cli.mjs:226-228`：`evidence.compareResult !== null` → `EvidenceInvalid`；
- 两者都由 `golden-assert.mjs:15-33` 产出，而它比对的是 `git show <commit>:agents/<名>.md`。

**实测（2026-10-21，内存内改 `when` 后重渲染，未落盘）**：把 senior-sdet 的 `when` 去掉「评审测试策略」一个触发词，快照 description ≠ 新派生 description（`goldenAssertion` 必为 `fail`），`diffSet` 未允许差异 1 行（`compareResult` 必非 null）。双闸门同时为假，且**无法自救**：重开基线要先把改动提交进 git，而改动只能靠 `replace` 写进去——死循环。

后果不是「这一次麻烦」，而是**以后每一次改任意一张卡都被永久挡住**；绕行只能手写盘或手改 evidence，把「禁止手改 agent 卡」的守卫变成摆设。

本 spec 只做一件事：**把写盘检查按阶段分派**——迁移期保留一次性证明，变更期改为「差异必须被一份看过且精确到字节的凭证批准」。不碰渲染器、模板、`gate` 与 `check-all`。

## 1 全貌确认

| 维度 | 内容 |
|---|---|
| 本质 | 时间维度错误：把「迁移期一次性证明」当成了永久前置条件 |
| 同族 | ① `init-evidence` / `golden-assert` 两个迁移期工具没有阶段边界，迁移后仍可跑，会冲掉历史锚点；② S4 testcase TC-107「替换后卡字节不变」同理，只在迁移期成立 |
| 边界 | 只做 agent 卡写盘通路（`replace`）。不碰渲染器 / 模板 / 数据形状 / `gate` / `check-all` / `state` schema；不动其余 13 席内容；不做多基线、回滚、历史版本对比；不做 rule / skill 的写盘通路 |
| 验收 | 迁移期回归全绿（S1–S6 / TC-106）；变更期新场景全绿；`npm run check` 全绿；senior-sdet 的写盘差异恰为 description 一行 |
| 影响面 | ① `tools/docgen/cli.mjs`（新增 `cmdDiff` + `cmdReplace` 分段）；② `tools/docgen/components/validateAgentData.mjs`（错误码表加 2 条）；③ `tools/docgen/evidence.mjs`（校验 `changes` / `rejudged` / `judged` / `machineChecks`；`fail()` 支持可选 message，让 stderr 契约能写出哈希与下一步命令）；④ `tools/docgen/acceptance/init-evidence.mjs` 与 `golden-assert.mjs`（阶段边界）；⑤ `tools/docgen/acceptance/replace-scenarios.mjs` + `tools/docgen/test/`（用例）；⑥ `tools/docgen/components/agentData.mjs` + `agents/senior-sdet.md` + `tools/docgen/fixtures/senior-sdet.evidence.json`（首个使用者）；⑦ `rules/.inspector-annotations.json`（重判 `senior-sdet:A2`） |

> **术语（首次出现即定义）**：「**锚点**」= 迁移期记录在 evidence 里的六项历史证明（`commit` / `blob` / `sha256` / `hashObject` / `goldenAssertion` / `compareResult`，字段细节见 §3.4），一旦迁移完成即冻结；「**幂等**」= 盘上已等于渲染，重复执行不产生任何写入（判定位置见 §3.1 执行次序）；「**A1–A7 / B1–B4 / C1–C4**」= `tools/execution-matrix/criteria.md` 定义的 agent 卡判据代号，其中 A1 / A2 与 B、C 组共 10 项是语义判定（写 annotations），A3–A7 是机器结构检查（不写注解）。

**联动四问**：
- **治本了吗**：按 `state` 分派「迁移段 / 变更段」，两类证明各归其位；不是删闸门，是让闸门只在对的阶段生效。治本。
- **有副作用吗**：改的是首次替换的分支条件，写错会让未来新席失去迁移保护 → 用 S1–S6 全量回归 + 「未迁移席内容有差异仍被拒」新用例兜住；变更段放宽的两道闸门用「凭证 + 盘上未动」两道新闸门替代。
- **跨问题联动吗**：`docs/after/20261017210609-pending-work-overview.md` 线 F-3（14 席来源行统一）本质也是「改卡内容」，本机制就绪后它不再需要「重开基线」，是本 spec 的最大附带收益。
- **跨文件吗**：evidence 结构只增不改、`gate` / `check-all` / 渲染器零改动；受影响文件见影响面 ①–⑦。

## 2 核心决定（不可违反）

| # | 决定 | 为什么 |
|---|---|---|
| R1 | **按阶段分派**：`cmdReplace` 以 `readState().agents[name] === 'replaced'` 分流。**迁移段**（≠ replaced，含 `suspended`）保留现有四道证明；**变更段**（= replaced）不再读 `goldenAssertion` / `compareResult` / `renderSha256`，改读变更凭证。`suspended` 席一律落迁移段——本 spec 不提供 suspended 席的变更通路（见 §8） | 迁移期证明对变更期永远为假；不分派就只能永久挡住 |
| R2 | **变更凭证**：变更段必须带 `--expect-change <SHA256>`（大写 64 位 hex，大小写不敏感）。仅当「盘上 ≠ 渲染」时必需；凭证 ≠ `sha256(渲染)` → `UnapprovedChange`（exit 4），卡不动。迁移段出现该参数 → `InvalidArgs`（exit 2） | 证明「这批字节曾被一次 `diff` 完整展示」（不是证明「用户看过」——凭证可由任何人跑 `diff` 得到，本机制**可审计、不可拦截**，见 §8）；凭证一变即失效 |
| R3 | **只读 `diff` 子命令**：`diff --kind agent --name <名>` 打印旧/新哈希、差异块，并输出可直接复制的 `--expect-change` 凭证；**不写任何文件**（含 evidence）。差异为空时打印幂等提示并 exit 0 | 用户要看的 diff 必须来自工具而不是人嘴；读数不落盘才可反复跑 |
| R4 | **变更留痕**：变更成功后在 evidence 追加 `changes[]` 一项 `{from, to, at, rejudged}`；同时更新 `renderSha256` / `lastWrittenHash`。**迁移锚点四字段（`commit` / `blob` / `sha256` / `hashObject`）与 `goldenAssertion` / `compareResult` 冻结不改** | 锚点是「迁移期证明」的历史记录，改写它等于说谎；留痕让「哪次变更被授权」在仓库里可查 |
| R5 | **迁移完成后锚点冻结**：除 `init-evidence` 与 `golden-assert`（两者均被 R6 关在迁移期）外，任何路径都不得改写上述六字段。`readEvidence` 只做类型校验，不因内容变更而放宽 | 与 R4 同源：历史不可改写，否则审计无据。两个例外都必须**在迁移期**才成立——这正是 R6 的职责 |
| R6 | **迁移期工具的阶段边界**：`init-evidence` / `golden-assert` 在 `state[name] === 'replaced'` 时拒绝执行，报 `MigrationPhaseClosed`（exit 2）。判定顺序固定为：① `assertAgentName`（非法 → `InvalidName`，防 `../../x` 路径穿越）→ ② `readState()` 判阶段（已迁即 `MigrationPhaseClosed`，**此步不碰 git**）→ ③ `golden-assert` 再 `readEvidence`（坏 → `EvidenceInvalid`）→ ④ 才跑 git / 写盘 | 这两个工具只对「迁移前的卡」有意义；迁移后跑它们只会冲掉锚点，属纯破坏。次序固定后，无 `.git` 环境下的已迁席仍先报阶段码而非 ENOENT |
| R7 | **重判**：变更若触及判定对象，必须由**独立于施工者的子代理**重判（判定对象 = 渲染产物，与写盘字节相同），按两类落位：**A1 / A2 与 B1–B4 / C1–C4 共 10 键**写回 `rules/.inspector-annotations.json`；**A3–A7 是机器结构项，不写注解**，由 `check-all` 重跑 `checkStruct` 复检，结果记入 `changes[].machineChecks`。重判前必须先读 `tools/execution-matrix/criteria.md` 对应条目，产出 = 每键 `verdict` + 依据（落 `changes[].judged[]`）。`replace` 用 `--rejudge <键列表\|none>` 声明；漏报触达键 → `UnapprovedChange`（exit 4）。触达映射见 §3.6 | 检查者 ≠ 写者；改过的判定对象不能沿用旧判定。A3–A7 在注解里没有位置，硬塞会让键集变成 11 而把 `check-all` 判红 |
| R8 | **与 S4 R6/R7 的关系**：S4 的 R6（双闸门）与 R7（卡字节不变）**只适用迁移期**；迁移后由本 spec 的 R1–R9 定义写盘规则。S4 其余决定与验收不受影响 | 遵守 `docs-convention`：已定稿 spec 原文保留，新 spec 取代其失效部分，不并列两份说法 |
| R9 | **首个使用者 = senior-sdet 描述触发词**：从 `when` 删掉卡内无对应职责的「评审测试策略」，渲染差异必须**恰为 `description` 一行**，其余行逐字节不变（行数与未变行数一律由 `diff` / `git diff --numstat` 现算，不写死）；走变更段（凭证 + `--rejudge A2`）落地 | 用一个真实变更验证新通路；同时修掉线 F 第 1 件 |

## 3 细节

### 3.1 闸门矩阵

| 闸门 | 迁移段（state ≠ replaced） | 变更段（state = replaced） |
|---|---|---|
| 草稿字节 == 渲染 | 必须（`DraftDrift` exit 1） | 必须（同左） |
| `evidence.renderSha256 == sha256(渲染)` | 必须（`EvidenceInvalid` exit 2） | **不读** |
| `goldenAssertion === 'pass'` | 必须（`EvidenceInvalid` exit 2） | **不读** |
| `compareResult === null` | 必须（`EvidenceInvalid` exit 2） | **不读** |
| `sha256(盘上) == evidence.lastWrittenHash` | 必须（`TargetDrift` exit 1） | 必须（同左） |
| `collectGate()` 无被阻塞漂移 | 必须 | 必须 |
| `--expect-change == sha256(渲染)` | 不适用（出现即 `InvalidArgs`） | 盘上 ≠ 渲染时必须（`UnapprovedChange` exit 4） |
| `--rejudge` 覆盖 §3.6 触达键 | 不适用（出现即 `InvalidArgs`） | 盘上 ≠ 渲染时必须（`UnapprovedChange` exit 4） |
| 盘上 == 渲染（幂等） | 允许（不写盘；**不校验凭证**） | 允许（不写盘、不追加留痕；**不校验凭证**） |

**执行次序（固定，不得调换）**：草稿字节校验 → 迁移段四道证明（变更段跳过）→ `collectGate()` → **幂等判定（盘上 == 渲染 → 清草稿、更新两个哈希、打印 `已替换（幂等恢复）` 并返回；不写盘、不校验凭证）** → `TargetDrift` → 凭证校验（仅变更段、且盘上 ≠ 渲染时）→ `--rejudge` 触达校验（仅变更段、且盘上 ≠ 渲染时）→ 写盘（rename）→ 置 state → 写 evidence。

> 次序为什么要钉死：`replace-scenarios.mjs` 的 S2 期望 `exit 1 TargetDrift`、S5 期望 `Mismatch`。若把凭证 / 重判校验插到 `TargetDrift` 之前，S2 会变成 exit 4、S5 会变成 `UnapprovedChange`，迁移段回归当场红。
> **幂等判定必须排在 `TargetDrift` 之前**：崩溃窗口（文件已 rename、evidence 未写）重跑时，盘上哈希已不等于 `lastWrittenHash`，若先判 `TargetDrift` 就永远收敛不了；先判幂等才能按 §3.5 收敛。
> 幂等分支不校验凭证：盘上已等于渲染、没有要写的字节，此时没有「未知情写盘」的风险；要求凭证只会让崩溃恢复多一道无意义的手动步骤。

> 「未迁移席想改内容」**故意不放行**：先按迁移闭环把原样搬进来，再走变更段改内容——两件事分开，迁移证明才还有意义。

### 3.2 `diff` 输出契约

命令：`node tools/docgen/cli.mjs diff --kind agent --name <名>`（`--kind` 非 `agent` → `UnsupportedKind`；名非法 → `InvalidName`；条目缺失/未拆槽 → `MissingComponentData`；`agents/<名>.md` 不存在 → `DanglingBaselineEntry`）。**只读**：不写任何文件（含 evidence）；正常路径（参数与条目合法）exit 0，参数 / 条目错误仍按既有档位非 0。**只读不变式**：跑前跑后卡与 evidence 的 sha256 必须完全一致（§5 ②）。

**行数口径（唯一）**：「`<A>` 行」= 按 `\n` 切分后的元素个数（**以换行结尾的文件，末尾空串计入**）。全文所有「N 行」一律按此口径，不得改用「非空行数」。

**中段行格式（唯一）**：每个中段行 = `-` 或 `+` 符号 + **一个空格** + 该侧原文；原文为空行时该行以「符号 + 一个空格」结尾。实现用切片拼接，**禁止 `trim`**。

有差异时输出（行序固定、前缀固定，供机械断言）：

```text
旧 agents/<名>.md  sha256=<旧64>（<A> 行）
新 渲染            sha256=<新64>（<B> 行）
差异 - <a> / + <b>（首处第 <k> 行）
- <旧侧中段逐行>
+ <新侧中段逐行>
凭证 --expect-change <新64>
```

无差异时：

```text
旧 agents/<名>.md  sha256=<64>（<N> 行）
新 渲染            sha256=<64>（<N> 行）
差异 - 0 / + 0（盘上 == 渲染，幂等，无需凭证）
```

差异算法（不引第三方依赖、不 spawn git）：按 `\n` 切行 → 求最长公共前缀 `P` 与最长公共后缀 `S`（`P+S` 不超过较短侧行数）→ 中段逐行打印 `-`（旧）与 `+`（新）→ `a` = 旧中段行数，`b` = 新中段行数，`k` = `P+1`。两处以上分离的小改动会合并成一个大块，这是可读性优先的已知取舍，不影响判据（判据只认哈希）。

### 3.3 错误码

| 码 | 档位 | 触发 | stderr 必须含 |
|---|---|---|---|
| `UnapprovedChange` | exit 4 | 变更段缺凭证 / 凭证不匹配 / `--rejudge` 漏报触达键 | 两个 sha256、缺的是哪一项、下一步命令 |
| `MigrationPhaseClosed` | exit 2 | 迁移期工具在 `replaced` 席上运行 | 席名、工具名、正确通路（`diff` + `replace --expect-change`） |

两条都进 `validateAgentData.mjs` 的 `EXIT` 映射表（`UnapprovedChange` → 4，`MigrationPhaseClosed` → 2）。

**stderr 格式契约（新增，供机械断言）**：所有错误路径的 stderr **首个非空行必须以 `错误码:` 开头**（例：`UnapprovedChange: 盘上=AB… 渲染=CD… 缺 --expect-change，下一步运行 node tools/docgen/cli.mjs diff --kind agent --name senior-sdet`）。这条把「错误码可被脚本按首词读出」变成契约——否则用例只能靠「stderr 含某串」判读，实现换个顺序就会误判。

**未知旗标 → `InvalidArgs`（exit 2）**：`replace` / `diff` 在指定 `sub` 下只接受本文列出的旗标（`--kind` `--name` `--draft` `--yes` `--expect-change` `--rejudge`）；出现其它 `--xxx`（含拼错、含 `--expect-change` 后紧跟另一个 `--` 旗标）→ `InvalidArgs`。现有 `flag()` / `has()` 的宽松解析会静默丢弃未知旗标，必须加白名单，否则「迁移段出现 `--expect-change` → `InvalidArgs`」这条根本落不了地。

**参数取值非法 → 同样 `InvalidArgs`（exit 2）**：`--expect-change` 的值不是 64 位十六进制（大小写不敏感）→ `InvalidArgs`；`--rejudge` 里出现不在 10 个语义键内、也不是 `none` 的键（如 `A3`、`X9`）→ `InvalidArgs`，stderr 列出合法键。两条都不得静默忽略或降级为其它错误码。

### 3.4 evidence schema（只增不改）

```json
{
  "commit": "<40 hex>", "blob": "<40 hex>", "sha256": "<64 hex>", "hashObject": "<40 hex>",
  "goldenAssertion": "pass", "compareResult": null,
  "renderSha256": "<64 hex>", "lastWrittenHash": "<64 hex>",
  "changes": [
    {
      "from": "<64 hex>", "to": "<64 hex>", "at": "2026-10-21T08:00:00.000Z",
      "rejudged": ["A2"],
      "judgeMode": "subagent",
      "judgedBy": "<子代理实例标识，如 sdet-2026-10-21-rejudge-a2>",
      "judged": [{ "key": "A2", "verdict": "pass", "basis": "criteria.md A2 + diff 输出：仅 description 触发词删除" }],
      "machineChecks": { "A3": "pass", "A4": "pass", "A5": "pass", "A6": "pass", "A7": "pass" }
    }
  ]
}
```

- `changes` **可缺省**（现存 14 份 evidence 无此字段，仍合法）。
- 出现时必须是数组；每项**基础四字段**齐全且类型合法：`from` / `to` 为 64 位大写 hex、`at` 为非空字符串（`new Date().toISOString()`）、`rejudged` 为字符串数组（可为空数组）。任一项不合法 → `EvidenceInvalid`。
- **`rejudged` 只允许 10 个语义键**（`A1` `A2` `B1` `B2` `B3` `B4` `C1` `C2` `C3` `C4`）。出现别的键（含 `A3`–`A7`）→ `EvidenceInvalid`。A3–A7 走 `machineChecks`，**不进注解、不进 `rejudged`**。
- `rejudged` 为 `[]` 时：`judged` 必须为 `[]`，`judgedBy` 可省，`judgeMode` 写 `none`。`--rejudge none` 一律记为 `[]`，**不得记 `["none"]`**。
- `rejudged` 非空时：`judged` 必须逐键一条（`key` ∈ `rejudged`），`verdict` ∈ `pass` / `fail`，`basis` 非空；`judgedBy` 必填且**不得等于施工者标识**；`judgeMode` ∈ `subagent` / `self-degraded`（后者只允许出现在「无子代理环境、只出草稿」的场景，且此时 `replace` 必须拒绝写盘）。
- `machineChecks` 每次变更必填，五键 `A3`–`A7` 齐全，值 ∈ `pass` / `fail`；由 `check-all` 的 `checkStruct` 对渲染产物复检得到。
- 迁移段成功：不追加 `changes`。
- 变更段成功且确有差异：追加一项；`from` = 写盘前的 `sha256(盘上)`，`to` = `sha256(渲染)`。
- **单源声明**：`renderSha256` = 渲染哈希、`lastWrittenHash` = 上次写盘哈希、`changes[-1].to` = 最近一次变更的渲染哈希。三者同值属预期，但语义不同，**不得互相推导**——校验一律读各自字段。

### 3.5 幂等与崩溃恢复

- 变更段遇「盘上 == 渲染」走幂等分支：不写盘、不追加留痕，只把 `renderSha256` / `lastWrittenHash` 更新为渲染哈希、清草稿、打印 `已替换（幂等恢复）`。
- **state 置位次序**：`rename` 成功后才 `setAgentState(name, 'replaced')`；rename 失败必须回滚到写盘前的 state。**禁止先置 state 再写盘**——否则一次写失败就把该席从迁移段推进变更段，迁移证明被永久跳过（现有 `cli.mjs:266` 正是先置 state，施工时须调序）。
- 崩溃窗口 = 「文件已 rename、evidence 未写」。重跑落在幂等分支即收敛。**该窗口内的变更留痕会丢失一次**：这是已知取舍（留痕是审计便利，不是判据），不为此引入「预写 / 回填」两阶段状态。
- **`changes[]` 的边界（必须写明，防审计误信）**：它是**本次变更的授权与重判记录**，**不是完整变更史**。幂等恢复、崩溃窗口后补写盘、以及「手工把卡改到与渲染一致再跑 `replace`」这三种情况都不追加 `changes`。完整变更史以 git 为准。

### 3.6 重判触达映射（下限，可多报）

**定位方式**：把旧卡与渲染产物两侧的差异行号**取并集**后，再按下面两张表求下限键集。只按新侧定位会漏掉「整节删除」（此时新侧没有行可查，`--rejudge none` 会被放行）。

**表 A · 语义键（写 `rules/.inspector-annotations.json`，必须报进 `--rejudge`）**

| 差异所在的卡内位置（关键字匹配，不逐字节匹配节名） | `--rejudge` 必含 |
|---|---|
| frontmatter `description:` 行 | `A2` |
| 节名含「你是谁」或「身份」的节（identity 声明段） | `A1` |
| 其余位置（含来源声明行、标题、其它节） | 无（写 `none`） |

**表 B · 机器结构项（不写注解、不必报进 `--rejudge`，由 `machineChecks` 承接）**

| 差异所在的卡内位置 | 复检项 |
|---|---|
| 任一表格的表头行 | `A3` |
| 节名含「固定清单」或「固定必问清单」的节 | `A4` |
| `## 通用纪律` / `## 核对项` 节 | `A5` |
| `## 边界` 节 | `A6` |
| `## 输出格式` 节 | `A7` |

- **为什么 A3–A7 不进 `--rejudge`**：注解契约只有 10 个语义键（`check-agent.mjs` 的 `SEMANTIC_KEYS`），A3–A7 是 `checkStruct` 的机器检查项、没有注解位。硬塞会让该席键集变成 11，把 `check-all` 判红。它们改由 `check-all` 对渲染产物重跑 `checkStruct`，结果记 `changes[].machineChecks`。
- B 组 4 项与 C 组 4 项**不做机械映射**（语义评分，无法从行位置可靠推出），由变更者按语义判断；一旦判断触及，必须一并报进 `--rejudge`。**这是硬约束但无机器校验**——残余缺口记入 §8，由议会与复查轮兜底。
- `--rejudge` 允许超过下限（多报无害），但**每个多报的键也必须在 `judged[]` 里各有一条判定记录**（`key` + `verdict` + `basis`）；只报不判 = 视为漏报。
- 重判 = 对**渲染产物**重新判该键，写入 annotations；`pending` / `fail` 仍由 `check-all` 拦截。重判者必须先读 `tools/execution-matrix/criteria.md` 对应条目，判完把「判了什么、依据是什么」写进 `judged[].basis`——这是「判者与依据落账」的唯一落点。

### 3.7 首个使用者：senior-sdet（R9）

**改前 / 改后：`agentData.mjs` 的 `triggerTable['senior-sdet'].when`**

```diff
- when: '当需要为 PRD/spec 设计并编写测试用例（testcase.md）、评审测试策略、或专门找出被忽视的边界与失败场景'
+ when: '当需要为 PRD/spec 设计并编写测试用例（testcase.md），或专门找出被忽视的边界与失败场景'
```

**改前 / 改后：渲染出的 `agents/senior-sdet.md` 第 3 行 `description`**（「`N` 行中仅 1 行不同」的行数一律由 `diff` 现算，不写死）

```diff
- description: 资深测试开发工程师（Senior SDET）。当需要为 PRD/spec 设计并编写测试用例（testcase.md）、评审测试策略、或专门找出被忽视的边界与失败场景时调用。Do not use for 修改业务代码、写实现方案、或只读的议会评审（那走 reviewer-qa）。
+ description: 资深测试开发工程师（Senior SDET）。当需要为 PRD/spec 设计并编写测试用例（testcase.md），或专门找出被忽视的边界与失败场景时调用。Do not use for 修改业务代码、写实现方案、或只读的议会评审（那走 reviewer-qa）。
```

理由：卡内「你负责三件事」（`agents/senior-sdet.md:19-23`）没有「评审测试策略」这一项，`## 边界` 节（`agents/senior-sdet.md:83`）还写明「不参与议会裁决」；删触发词而不是补职责。触达 `A2`，需独立子代理重判并写回 annotations，`replace` 带 `--rejudge A2`。

## 4 施工步骤

1. 改 `cli.mjs`：
   - 新增 `cmdDiff` 与 `main` 分发；`cmdDiff` 全部错误走既有 `fail()`（档位见 §3.2）。
   - `cmdReplace` 按 R1 分两段，闸门次序严格按 §3.1「执行次序」；迁移段出现 `--expect-change` / `--rejudge` → `InvalidArgs`。
   - 参数白名单（§3.3 末条）：指定 `sub` 下出现白名单外的 `--xxx` → `InvalidArgs`；`--expect-change` 后紧跟 `--` 开头的内容视为缺值 → `InvalidArgs`。
   - `state` 置位调序：`rename` 成功后才 `setAgentState`，失败回滚（§3.5）。
   - 抽 `diffLines(old, new)` 与 `sha256Hex(buf)` 为单点，`cmdDiff` 与 `cmdReplace` 共用——否则「给人看的 diff」与「写盘判的字节」会各写一份、日后脱钩。
2. 改 `validateAgentData.mjs`（`EXIT` 表加 `UnapprovedChange` → 4、`MigrationPhaseClosed` → 2）、`evidence.mjs`（`changes` / `rejudged` / `judged` / `machineChecks` 校验；`fail()` 支持可选 `msg`，让 §3.3 的 stderr 契约能写出两个哈希与下一步命令）、`init-evidence.mjs` / `golden-assert.mjs`（严格按 R6 四步次序 + `try/catch` 打印 `MigrationPhaseClosed` 并 exit 2）。
3. 改测试：`replace-scenarios.mjs` 补变更段场景，保留 S1–S6；新增 `tools/docgen/test/replace-change.test.mjs`（差异算法、凭证、触达映射、阶段边界、`machineChecks`）。
4. 跑 `npm run check`（应全绿：施工期尚未改数据，盘上与渲染一致）。
5. 改 `agentData.mjs` 的 `when` → 跑 `diff` → **把 diff 原样给用户确认**（确认判据见下）→ 独立子代理重判 `senior-sdet:A2` 并写回 annotations → `draft` → `replace --expect-change <凭证> --rejudge A2 --yes`。
   - **确认判据**：`diff` 输出的 `-`/`+` 中段恰为要改的那 1 行 `description`（不多不少），且末行凭证哈希 == `diff` 头部打印的「新渲染 sha256」。两条都成立才算用户确认过；缺一不许继续。
6. 跑 `npm run check`（应全绿）；核对 `git diff --numstat -- agents/senior-sdet.md` 输出为「1 行新增 / 1 行删除」，且 `git diff` 只有 `description` 一行。
7. 账本留痕：`docs/after/20261017210609-pending-work-overview.md` 线 F 第 1 件结案；线 F-3 补「机制就绪，可走变更段」的指针。
8. 改动留工作区，提交方式由用户决定（不执行任何 git 写操作）。

## 5 验收

| # | 检查 | 判据 |
|---|---|---|
| ① | 迁移段不回归 | S1–S6 与 S4 的 TC-106 全绿；`state ≠ replaced` 的席内容有差异时仍被 `EvidenceInvalid` 拒。**S1–S6 = `tools/docgen/acceptance/replace-scenarios.mjs` 的六个场景**（首次替换成功 / `TargetDrift` / 幂等恢复 / rename 前崩溃 / 非目标漂移 / 错误路径），跑该脚本即覆盖 |
| ② | `diff` 只读且契约稳定 | 跑前跑后卡与 evidence 的 sha256 不变；输出行前缀与 §3.2 一致；无差异时给出幂等提示且 exit 0 |
| ③ | 凭证强制 | 缺凭证 / 凭证错误 / 用旧凭证 → `UnapprovedChange`（exit 4）且卡字节不变；正确凭证 → 写盘成功 |
| ④ | 留痕与冻结 | 成功变更后 `changes` 追加一项；迁移锚点四字段与 `goldenAssertion` / `compareResult` 与变更前完全一致 |
| ⑤ | 阶段边界 | `init-evidence` / `golden-assert` 在 `replaced` 席 → `MigrationPhaseClosed`（exit 2），evidence 不被改写 |
| ⑥ | 重判 | 差异触及 `description` 而 `--rejudge` 不含 `A2` → 拒；含 `A2` 且由独立子代理重判为 `pass` → 过；`changes[-1].judgedBy` ≠ 施工者标识、`judged[]` 每键有 `verdict` 与 `basis`；多报的键同样各有判定记录；`machineChecks` 五键齐全；`check-all` 0 红 |
| ⑦ | 首个使用者 | senior-sdet 的盘上差异恰为 `description` 一行（`git diff --numstat` 输出「1 行新增 / 1 行删除」），其余行逐字节不变（行数由 `diff` 现算，不写死） |
| ⑧ | 全量绿 | `npm run check` 全绿（tests 全过 / baseline 35/35 / 0 findings / markdown 全过）；`gate` 绿；`generate` 0 drift |

## 6 硬约束

1. 迁移锚点四字段与 `goldenAssertion` / `compareResult` 冻结：除 `init-evidence` 与 `golden-assert`（两者均被 R6 关在迁移期）外，任何路径不得改写。
2. 凭证 = 即将写盘的渲染字节的 sha256（大写 64 位 hex）；不得用旧哈希、不得用 diff 文本哈希替代。
3. `diff` 不得写任何文件；`gate` / `check-all` / 渲染器 / 模板 / `state` schema 本 spec 一律不动。
4. 迁移段与变更段互斥：迁移段出现 `--expect-change` 或 `--rejudge` 即 `InvalidArgs`。
5. 幂等分支不写盘、不追加留痕、不校验凭证。
6. 重判必须由独立于施工者的子代理完成（用户规则：检查者 ≠ 写者）；判者与依据的**唯一落点**是 `changes[].judgedBy` 与 `changes[].judged[].basis`，无子代理环境只能出草稿并标 `judgeMode: self-degraded`，此时 `replace` 必须拒绝写盘。
7. 禁止手打 `agents/*.md`；一切内容来自渲染（`draft` → `replace`）。
8. 新增错误码必须同时进 `EXIT` 映射表，否则 `exitCodeFor` 抛「未知错误码」。

## 7 测试

| # | 测什么 | 为什么 |
|---|---|---|
| 1 | 迁移段回归（S1–S6 / TC-106） | 分派改的是首次替换的分支条件，写错会让新席失去迁移保护 |
| 2 | `diff` 只读 + 输出契约 + 差异算法 | 用户看到的差异必须是工具算的；契约不稳则凭证与用例都不可断言 |
| 3 | 凭证三态（缺 / 错 / 过期）+ 成功路径 | 凭证是变更期唯一的「有意」证明，假绿代价最大 |
| 4 | 留痕追加 + 六字段冻结 | 锚点被改写则历史审计失效 |
| 5 | 阶段边界（两个迁移期工具） | 没有阶段边界的工具 = 随时能销毁锚点 |
| 6 | 重判触达映射（漏报拒 / 多报必须逐键有判定记录）+ `machineChecks` 五键 | 改过的判定对象不能沿用旧判定；A3–A7 没有注解位，只能走机器复检 |
| 7 | 首个使用者 senior-sdet 的真实变更（numstat 1 增 1 删） | 真实变更端到端验证；行数一律现算，不写死 |
| 8 | `npm run check` 全量绿 | 判据只在真入口上算数 |

**测试用例文件**：`docs/superpowers/specs/2026-10-21-docgen-replace-intent-change-design-testcase.md`（由 `senior-sdet` 在全新上下文独立编写；按「迁移段 / 变更段 / 阶段边界 / 首个使用者」分组，不按命令复制；覆盖总表须指回本 spec 的 R 编号与 § 号）。

**执行环境**：Windows + PowerShell；一律用仓库内 `node` 脚本，字节写盘用 `writeFileSync`（禁 PS `>` / `Out-File`）。

**只手动验证**：把 `diff` 的输出读一遍，确认「这确实是我要改的那一行」；senior-sdet 卡改后读起来仍是同一张卡。

**不测**：渲染器 / 模板 / `gate` / `check-all`（本 spec 不动）；其余 13 席内容。

## 8 不在这一轮

- 多基线、回滚、历史版本对比。
- **注解随卡自动失效的指纹式机械校验**：需要改 execution-matrix 的注解契约（每席键集恰 10 的既有口径），属另一条线；本轮用 R7 的「触达映射 + 声明 + 独立重判」兜住，残余缺口记 `docs/after/`。
- **B 组 4 项 + C 组 4 项无机械校验**：它们无法从行位置可靠推出，只能靠变更者自觉报 + 议会与复查轮兜底。要机械化就得给每键定「判定对象的指纹」，属上一条同一件事，本轮不做。
- **凭证绑定旧侧的一次性票据**（`diff --issue` 出一张含旧侧哈希与签发时间的票据、`replace --ticket` 用后即删）：能把「diff 之后盘上被换掉、凭证仍有效」这个窗口也堵上。本轮不做——它要新增文件、新增状态与清理规则，超出「机械哈希凭证」的既定范围；**本轮的已知边界是「可审计、不可拦截」**：凭证可由任何人跑 `diff` 得到，`changes[].from` 事后能看出授权与写盘是否错位，但拦不住。
- **`suspended` 席的变更通路**：R1 已把 `suspended` 归入迁移段，本 spec 不提供这类席的写盘方式；需要时另立 spec。
- **`DOCGEN_*` 环境变量覆盖不构成安全边界**：`DOCGEN_STATE_PATH` / `DOCGEN_EVIDENCE_DIR` / `DOCGEN_DRAFTS_DIR` 允许任意指向，这是测试与工具复用所必需（`replace-scenarios.mjs` 的副本仓正靠它构造迁移段/变更段场景）。因此「分派键可被手改」「evidence 可被指到自造文件」是**已知边界**，不是漏洞：本 spec 只保证「正常路径下的证明与留痕」，不保证「有人蓄意伪造环境时的不可绕过」。写盘路径一律拒绝 env 会把 S1–S6 的副本构造一并打死，本轮不采纳。
  - 若后续要收紧，**最小中间态**是「要求三个 env 的路径都落在 `cwd` 内」（副本仓的 env 全在副本内，仍然通过），而不是一律拒绝。本轮不做：它会新增一条路径校验与错误码，超出本 spec 的写盘面。
- **触达映射的关键字集合应放共享模块单源**：§3.6 表 A 已把节名匹配改为关键字（「你是谁」或「身份」），但这份关键字集合目前只写在 spec 里，实现与 `check-agent.mjs` 的节名判定各有一份。把它们收进一个共享模块属 execution-matrix 的改造，本轮不做。
- rule / skill 的写盘通路（`replace` 目前只支持 agent）。
- 线 F-3（14 席来源行统一）：机制就绪后单独走一次变更段，不在本 spec 内动内容。

## 9 与既有 spec 的关系

- **取代声明**：S4 `2026-10-19-docgen-agent-batch-design.md` 的 **R6 / R7 只适用迁移期**（迁移完成后其语义失效）；迁移后的写盘规则由本 spec R1–R9 定义。S4 的 R1–R5、R8 与 §5 其余验收条不受影响。旧 spec 与旧 testcase 原文保留不改（`docs-convention`）。
- **S4 testcase 的处置**：TC-106（replace 五模式）仍有效（迁移段）；**TC-107（替换后卡字节不变）与 TC-110（重跑 init-evidence 自毁）降级为迁移期 / 历史用例**，其判据不得用于变更段；TC-110 的结论在本 spec 下更强——阶段边界直接拒跑，不必等它自毁。
- **不改** S1 的错误码五档架构，只在 `EXIT` 映射表新增两条。
- **不改** S3 的黄金快照锚点语义，只是把它限定在迁移期使用。
- **衔接** 线 E 十键注解：本 spec 只规定「何时必须重判」，注解的判定口径与落位仍归 `tools/execution-matrix/criteria.md`，不在此复制。
