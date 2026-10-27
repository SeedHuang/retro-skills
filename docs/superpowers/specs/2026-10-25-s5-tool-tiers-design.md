# S5 工具档位：`producer`（`research` 拆出为 S5-R）

> 拆分自 `docs/prd/20261024073606-dev-workflow-mainline/index.md` §12「S5 工具档位」
> 日期：2026-10-24｜版本：**v4（收范围）**｜状态：待评审（spec + testcase 一起送议会 #2）
> 测试用例文件：`docs/superpowers/specs/2026-10-25-s5-tool-tiers-design-testcase.md`
> 依赖：PRD §9 / §9.1（工具档位缺口与平台能力实查）、§12 S5 行、D-14 / D-17 / D-18、F-16；`docs/superpowers/specs/2026-10-24-dev-workflow-skeleton-design.md` §7.1 / §7.6（生成器改动与兼容性先例）
> 用户 2026-10-24 裁定：**S5 只做 `producer`；`research` 拆到独立 spec（S5-R，随 S2 市场卡）**，以收窄范围

## 0.1 读法 / 缩写

| 词 | 含义 | 首次展开处 |
|---|---|---|
| `B-1` | `docs/after/20261024174253-dev-workflow-mainline-open-items.md` 的 B-1 行：`producer` / `research` 档未落地；本 spec 只结 `producer`，`research` 转 S5-R | §2 / §11.3 |
| `B-5` | 同上账本 B-5 行：档位名表两处硬编码；本 spec 收进 `tierBySeat` 后迁出 | §5 / §11.3 |
| `B3` | `tools/execution-matrix/criteria.md` 的「职责边界一致」判定项 | §4 / §8 |
| `tierBySeat` | 席名 → 档位名 的映射表（`patternRegistry` 内，唯一来源） | §3.2 |
| `toolsForSeat` | 按席名取档位工具数组的函数 | §3.2 |
| `boundaryBySeat` | 席名 → 边界句常量 的映射表 | §3.3 |
| `BOUNDARY_*` | `patternRegistry` 导出的边界句常量（`BOUNDARY_COMMAND` / `BOUNDARY_PRODUCER_AUDIT` / `BOUNDARY_PRODUCER_DETECTIVE`） | §3.3 |

## 0 为什么

PRD §9 把工具档位缺口定为「**取证权整条线的断裂**」：审计跑不了 `npm run check` / `git diff`，精算师只能引用别人给的数，产品经理写不了 PRD——取证由被告代跑，三权分离在取证层就塌了（`index.md:582`）。`command` 档 2026-10-24 已落地（审计 / 侦探获得只读命令权），本 spec 只补 `producer`：

- `producer` = `readOnly + Write + Edit + RunCommand`，**整档授予**；「禁写」靠角色卡封闭清单 + 侦探轮初/轮末快照事后检测（D-14，`index.md:611-614`）。
- `research` 档（`readOnly + WebSearch + WebFetch`，只给市场角色）**拆到 S5-R**，随 S2 市场卡一起做（用户 2026-10-24 裁定）。

不做的代价：S3 的独立议长要写记录、跑计数（`index.md:232`）；S2 的精算师要自取数（`index.md:730`）；两处都等 `producer`（`index.md:729`）。这也是 Q1 判「先 S5」的依据。

## 1 全貌确认

| 维度 | 内容 |
|---|---|
| 本质 | 把「按席分档」从两处名字三元表达式，收成 `patternRegistry` 的**单一档位表 + 单一边界句表**；新增 `producer` 档；审计 / 侦探两张卡升档并重写边界句 |
| 同族 | 档位名表两处硬编码（B-5）；卡的工具行与边界句不一致（B3）；只改工具不改边界（卡自我描述错误）；手改 `agents/*.md` 绕过生成器（`Mismatch`）；流程文档仍写旧档位 |
| 边界 | 只做「`producer` 档 + 两席授予 + 两张卡 + 校验器断言 + 测试 + 三处流程文档同步」。**不做**：`research` 档（S5-R）；市场 / 产品经理 / `speaker` 卡（S2 / S3）；检测脚本、CLI B3 门、账本模板改造（见 §10「拆出项」）；PRD 正文 / 功能点集合 |
| 验收 | `producer` 档可读；`tierBySeat` / `boundaryBySeat` 单源；两张卡由 docgen 重生成且 `gate` 逐字节一致；未授权席拿写权必报 `ToolsViolation`；B3 重判有落账要求（无机器门，靠账本核）；`npm run check` 全绿 |
| 影响面 | `tools/docgen/components/{patternRegistry,agentData,validateAgentData,outputFormats}.mjs`；`agents/reviewer-audit.md`、`agents/detective-observer.md`；`tools/docgen/fixtures/{reviewer-audit,detective-observer}.evidence.json`；`tools/docgen/test/{pilot-data,pilot-render,validate,review-fixes}.test.mjs` + 新 `tool-tiers.test.mjs`；`skills/parliament/references/debate-protocol.md`、`skills/parliament/assets/round-check.md`、`skills/dev-workflow/references/stage-4-quality.md`；`docs/after/…open-items.md` |
| 联动四问 | **治本吗**：治——档位与边界都只留一处；**有副作用吗**：给两卡加 Write/Edit 改权限面，必须同批改边界句与固定清单并重判 B3；**跨问题联动吗**：B-5、D-14、B3 是同一处改动的三个面；**跨项目吗**：生成器全仓 15 席共用，默认值漂移是群体事故，用 `gate` 逐字节兜 |

## 2 范围与交付物

| # | 交付物 | 类型 | 存在的理由 | 验收锚点 |
|---|---|---|---|---|
| P-1 | `patternRegistry.mjs`：`tools` 增 `producer`；新增 `tierBySeat`、`defaultTier`、`tierOf()`、`toolsForSeat()`、`boundaryBySeat`、`BOUNDARY_PRODUCER_AUDIT`、`BOUNDARY_PRODUCER_DETECTIVE` | 修改 | 档位 / 边界名的唯一来源（B-5）；`BOUNDARY_*` 与 `BOUNDARY_COMMAND` 同处一个文件 | V-1 / V-2 |
| P-2 | `agentData.mjs`：尾部 `map` 改为 `toolsForSeat(s.name)` + `boundaryBySeat[s.name]`；侦探固定清单第 4 项改 `git --no-optional-locks status --porcelain` | 修改 | 去掉按席名三元分派；职责指令与新边界对齐 | V-2 / V-3 |
| P-3 | `validateAgentData.mjs`：断言 4 改用 `toolsForSeat(a.name)`；新增「`producer` 席 `boundary` 缺失 / 为空 → `DescriptionDerivation`」；`DECLARED_SLOT_SEATS` 由 `boundaryBySeat` 派生 | 修改 | 两处档位表合为一处；缺边界不得静默退回默认句 | V-2 / V-7 |
| P-4 | `outputFormats.mjs`：审计输出格式「已授 `command` 档」→「已授 `producer` 档」 | 修改 | 卡面事实与权限一致 | V-3 |
| P-5 | `agents/reviewer-audit.md`、`agents/detective-observer.md` 由 docgen 重生成 | 生成物 | 禁手改卡（`skills/parliament/SKILL.md:15`）；工具行、边界句、固定清单同批变 | V-3 / V-4 / V-8 |
| P-6 | 测试：改 `pilot-data` / `pilot-render` / `validate` / `review-fixes` 四处旧断言；新增 `tools/docgen/test/tool-tiers.test.mjs` | 修改 + 新增 | 旧断言写死 `command` 四元组 / `data[0]` 语义 | V-5 / V-6 |
| P-7 | 三处流程文档同步：「已授 `command` 档」→「已授 `producer` 档」 | 修改 | agent 读流程文档优先于读档位定义 | V-9 |
| P-8 | `docs/after/20261024174253-dev-workflow-mainline-open-items.md`：B-5 迁出；B-1 拆三条接班条目（`research` → S5-R / 精算师取数权 → S2 / S5-B） | 修改 | 待办账本只放没做完的；B-1 含多件事 | V-10 |

**不做什么**：

| 不做 | 理由 |
|---|---|
| `research` 档 | 用户 2026-10-24 裁定拆到 S5-R；本轮 `tools` 不登记 `research` |
| 新建市场 / 产品经理 / `speaker` 卡 | S2 / S3 范围 |
| 删除 `command` 档 | 它是 2026-10-24 刚落地的过渡档；S5 后暂无席位挂载，但保留给 S2 精算师取数 |
| 给 `senior-sdet` 升 `producer` | 它已有 Write / Edit；PRD §12 S5 文件清单未列 `agents/senior-sdet.md`（`index.md:689`），Q2 已裁定「审计 + 侦探」 |
| 给 `reviewer-actuary` 授 `command` | S2 决定；本 spec 不扩范围 |
| 改 PRD 正文 / 功能点集合 / §12 状态列 | PRD 已定稿；S5 完成度由本 spec 的 V-1～V-10 与 `npm run check` 证明 |
| 检测脚本 / CLI B3 门 / 账本模板改造 | 第 2/3 轮议会的 P0/P1 显示它们是独立深水区；拆到 S5-B（见 §10），本 spec 只写「检测限度」不造工具 |

## 3 档位设计

### 3.1 `tools`（四档定义）

```js
export const patternRegistry = {
  tools: {
    readOnly: ['Read', 'Glob', 'Grep'],
    sdet: ['Read', 'Glob', 'Grep', 'Write', 'Edit'],
    command: ['Read', 'Glob', 'Grep', 'RunCommand'],          // 保留；S5 后暂无席位挂载
    producer: ['Read', 'Glob', 'Grep', 'Write', 'Edit', 'RunCommand'],
  },
  tierBySeat: {
    'senior-sdet': 'sdet',
    'reviewer-audit': 'producer',
    'detective-observer': 'producer',
  },
  defaultTier: 'readOnly',
};
```

| 档位 | 工具（逐字） | S5 后谁在用 |
|---|---|---|
| `readOnly` | `Read, Glob, Grep` | 其余 12 席（含 `evidence-reader`） |
| `sdet` | `Read, Glob, Grep, Write, Edit` | `senior-sdet` |
| `command` | `Read, Glob, Grep, RunCommand` | 无（保留，S2 精算师可复用） |
| `producer` | `Read, Glob, Grep, Write, Edit, RunCommand` | `reviewer-audit`、`detective-observer` |

**顺序固定**：`renderAgent` 直接 `tools.join(', ')`，顺序即卡面顺序；`producer` 按 D-14 的写法「`readOnly + Write + Edit + RunCommand`」，不重排。

### 3.2 按席映射：`tierBySeat` 是唯一来源

```js
export function tierOf(name) {
  return Object.hasOwn(patternRegistry.tierBySeat, name)
    ? patternRegistry.tierBySeat[name]
    : patternRegistry.defaultTier;
}
export function toolsForSeat(name) {
  return patternRegistry.tools[tierOf(name)];
}
```

| 契约 | 判据 |
|---|---|
| 未登记席 | 回落 `defaultTier = 'readOnly'`（默认拒绝） |
| 原型链键名 | `constructor` 能过 `NAME_RE`，但直接取值会命中原型 → 必须 `Object.hasOwn`；否则 `agentData.tools` 为 `undefined`，断言 3 先抛 `FrontmatterFieldMissing`（不是 `ToolsViolation`） |
| 档位值写错 | `toolsForSeat` 返回 `undefined`；由测试「`tierBySeat` 每个值 ∈ `tools` 键」在 CI 拦，**不给运行时静默兜底** |
| 唯一来源 | `agentData` / `validateAgentData` 只调 `toolsForSeat`，不直接读 `patternRegistry.tools`，不按席名三元分派 |
| 返回值 | 返回档位数组本身（共享引用）；调用方不得就地 `push` / `sort`（测试用 `Object.freeze` 探针守） |

### 3.3 `producer` 的边界句（两份，按席不同）

> **已迁移（S6 / F-24）**：两份边界句与 23 / 14 项清单已迁到 `tools/docgen/policy/`，以定义层 + `node tools/docgen/cli.mjs policy --dump` 为准。本节原句按历史记录保留、不改写；判据侧以 S6 spec 为准（`docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design.md` §3.6）。

两份常量与 `BOUNDARY_COMMAND` 同处 `patternRegistry.mjs`；`boundaryBySeat` 只登记两席：

```js
export const patternRegistry = {
  // ...
  boundaryBySeat: {
    'reviewer-audit': BOUNDARY_PRODUCER_AUDIT,
    'detective-observer': BOUNDARY_PRODUCER_DETECTIVE,
  },
};
```

两份边界句必须同时含下列五段（缺一段 = 不通过）：

| 段 | 内容要求 | 为什么必须有 |
|---|---|---|
| ① 档位事实 | 「`producer` 档：Read / Glob / Grep / Write / Edit / RunCommand **整档授予**；**平台无参数级授权，不假装白名单**；写入范围是**封闭清单**；不裁决他人分歧；无中断评审的权力」 | 防止误以为平台会拦；「封闭清单」与「无中断评审」与既有卡同义，V-3 逐词核 |
| ② 写入范围（一人一文件） | **只允许写**：审计——本次评审账本（`.session/reviews/<本次>/`，归档后 `docs/superpowers/reviews/<本次>/`）内的 `round-check.md`、`delivery-audit.md`、审计表；侦探——同一账本内的 `detective.md`（轮初 / 轮末快照原文、观察记录、比对结论）。**禁止写**：不得写 `progress.md`（只由主持人写；段二 / 段三由主持人从侦探 / 审计产出转录；审计在 `round-check.md` 核转录逐字一致）、不得写 `skills/dev-workflow/references/gate-record.md`（签字原文由申报人转录，你只核转录是否逐字一致）、以及 ③ 所列全部路径 | `Write` 是整文件覆盖；同一文件多写者会互相抹掉（`.session/` 在 gitignore 内，不可 git 复原）。一人一文件是平台无行级写权时唯一可执行的替代。**锚固定**：边界切片统一分两刀——「只允许写 → **禁止写**」取写入范围，「④ 命令默认拒绝 → **禁止**」取命令允许段；不按用例编号绑锚 |
| ③ 明确禁止 | 除 ② 所列落点外，**任何写文件或重定向一律禁止**；逐项点名：代码、测试、`rules/`、`skills/`、`agents/`、`docs/prd/`、spec / plan、`tools/`、`scripts/`、配置与依赖清单、`docs/after/`、`docs/handoffs/`、`docs/reports/`、`docs/superpowers/retro/`、`.superpowers/`、`lessons/`、`*.local.md`、`**/ledger.md`、`.trae/`、`skills-lock.json`、`node_modules/`、`tools/docgen-spike/.tmp-test/`、其他评审目录；**兜底句**：凡 `.gitignore` 覆盖的路径一律视为禁止写入 | 把「什么不能写」写死 + `gitignore` 兜底；纯枚举必漏 |
| ④ 命令默认拒绝 | 逐条枚举：`npm run check`；`git --no-optional-locks status --porcelain`；`git --no-optional-locks diff`、`git --no-optional-locks show`、`git --no-optional-locks log`、`git --no-optional-locks reflog show`（禁 `--output`）；`node scripts/check-all.mjs`、`node scripts/doc-name.mjs --check`、`node scripts/skill-dir.mjs`、`node skills/review-log/scripts/time.mjs`；`node tools/docgen/cli.mjs gate`、`… check-agents`、`… diff --kind agent --name <席>`、`… draft ls`。**禁止**：`draft`（生成）/ `draft rm` / `draft ensure`、`baseline --write`、`replace`、`--output` / `--apply` / `--write`、`reflog expire|delete`、`commit` / `push` / `checkout` / `reset` / `restore` / `clean` / `rm`、任何重定向写盘形态（`>` / `>>` / `Set-Content` / `Out-File`）、**任何形式的环境变量赋值**（`export VAR=…` / `$env:VAR=…` / `set VAR=…` / `setx VAR …` / `VAR=… node …`；`DOCGEN_*` 只是举例）、安装 / 网络写；**不开放 `node -e`** | 写权不得顺带放开命令写；`draft` 会写盘、`draft rm` 会删文件、`baseline --write` 是纯写操作；环境变量面枚举必漏（默认拒绝） |
| ⑤ 越权后果与限度 | 越界写 = 越权：立即停手；**越权者写自己那份**（侦探写 `detective.md`、审计写 `round-check.md`）的「越权清单」（文件 + 改前/改后 sha256 + 是否可复原 + 命令原文）；审计在 `round-check.md` 独立复算并在核签行注明；可复原（tracked）→ 复原命令由你给出、用户执行（禁 agent 自跑 `git checkout/restore`）；不可复原（gitignored）→ 以轮初快照为基线，能比对就比对，不能就明写「不可复原 + 缺失基线」；本轮结论作废并直接报用户。**检测限度**：`git --no-optional-locks status --porcelain` 只能看 tracked 工作区；`.session/` / `.superpowers/` / `lessons/` 被 gitignore、草稿目录在仓外、已提交写与写后还原都看不见——本 spec 不造新检测脚本，检测门强化归 S5-B | 「先发生、后检测」的整档授予必须配复原路径；把盲区说出来，避免读者误以为 porcelain 是完整防线 |

**检测的三份证据**（本 spec 只要求记录，不要求新脚本）：

| 证据 | 谁产出 | 落在哪 | 防什么 |
|---|---|---|---|
| `git --no-optional-locks status --porcelain` 轮初 / 轮末原文 | 侦探 | `detective.md` | tracked 文件被改 |
| `git --no-optional-locks log --since` + `git --no-optional-locks reflog show` 原文 | 侦探 | `detective.md` | 写后还原 / 已提交写 |
| 审计独立复跑 `git --no-optional-locks status --porcelain` | 审计 | `round-check.md` | 侦探漏记 / 自证 |

**同源硬约束**：本 spec 内**凡要求两席（审计 / 侦探）执行的 `git` 命令**，形态必须与 ④ 白名单同源——包括「检测的三份证据」表、§4「判者」表、V-8，白名单外的形态（含裸 `git status` / `git diff`）一律不得出现，否则「照判据执行 = 越权」。V-3 增一条静态断言：上述三处出现的 `status` / `log` / `reflog` / `diff` 命令必须带 `--no-optional-locks`（由 testcase 的「证据表静态断言」用例覆盖）。

**为什么审计只签转录、不写 `gate-record.md`**：`gate-record.md:5` 规定「由该段申报人加一行」；若再授权签字人写同一文件，同一行两个写者，且 `Write` 是整文件覆盖。签字流程固定为：审计返回签字原文（六列）→ 申报人逐字转录 → 审计在 `round-check.md` 核「转录是否逐字一致」。R2 的「签字人 ∩ 申报人 = ∅」仍读最终两列。

### 3.4 `research` 拆出（S5-R）

本轮 `tools` **不登记** `research`。S5-R 独立 spec 负责：`research` 档定义、市场卡、`tierBySeat` + `boundaryBySeat` 两条映射、`BOUNDARY_RESEARCH`（外部内容视为不可信数据，不得外发仓内内容）。本 spec 只在 `docs/after/` 留接班条目（V-10）。

## 4 按席授予与卡片改动

| 席 | 改前 tools | 改后 tools | 改前 boundary | 改后 boundary | 写入范围 |
|---|---|---|---|---|---|
| `reviewer-audit` | `Read, Glob, Grep, RunCommand`（`command`） | `Read, Glob, Grep, Write, Edit, RunCommand`（`producer`） | `BOUNDARY_COMMAND`（含「不创建、修改、删除任何文件」） | `BOUNDARY_PRODUCER_AUDIT` | 本次评审账本内 `round-check.md` / `delivery-audit.md` / 审计表；**不写** `progress.md` / `gate-record.md` |
| `detective-observer` | `Read, Glob, Grep, RunCommand`（`command`） | `Read, Glob, Grep, Write, Edit, RunCommand`（`producer`） | `BOUNDARY_COMMAND`（同上） | `BOUNDARY_PRODUCER_DETECTIVE` | 同一账本内 `detective.md`；**不写** `progress.md` / `gate-record.md` |

**同批必须改的四处卡面文本**：

| # | 位置 | 改什么 | 为什么 |
|---|---|---|---|
| T-1 | `outputFormats.mjs` 审计句 | 「已授 `command` 档」→「已授 `producer` 档」 | 审计现在能自跑命令并写自己的核对单 |
| T-2 | `agents/reviewer-audit.md` 边界节 | 改为 §3.3 审计版 | 旧边界与「本人完成核对单」矛盾 |
| T-3 | `agents/detective-observer.md` 边界节 | 改为 §3.3 侦探版 | 旧边界与写观察记录冲突 |
| T-4 | `agentData.mjs` 侦探固定清单第 4 项 | 裸 `git status --porcelain` → `git --no-optional-locks status --porcelain` | 职责指令必须在边界白名单内，否则 B3 判「职责动作被边界禁止」 |

**B3 必须重判**：B3 的判定对象是「职责段 vs 边界段」（`criteria.md:134-141`）。本轮改了边界段与固定清单，故两张卡都走 `--rejudge B3`，由**独立子代理**重判并把 `reviewer-audit:B3` / `detective-observer:B3` 写回 `rules/.inspector-annotations.json`。

**B3 的落账要求（本 spec 不造机器门）**：

| 项 | 做法 | 判据 |
|---|---|---|
| 触达 | `--rejudge B3` 必须出现在两席 `replace` 命令里 | V-8 核 `changes[].rejudged` 含 B3 |
| 时效 | 施工前把 `<席>:B3` 置 `pending`；独立子代理判完写回 `pass` / `fail: 理由`；判者**只返回**四字段原文（判前 pending / 判后值 / 判者标识 / 判据锚），由**主持人逐字转录**进 `.session/reviews/<本次>/rejudge-<席>-B3.md`，md 头增「转录人」字段 | V-8 核四字段 + 转录人；`buildJudged` 拒 `pending`。判者不写文件（普通评审席无 Write），避免给判者开 `rules/` 或 `producer` 写权 |
| 判者 | `DOCGEN_JUDGED_BY`、`rejudge-<席>-B3.md` 的判者标识、`progress.md` 派工节三处逐字相等；`rules/.inspector-annotations.json` 由主持人**只改 `<席>:B3` 一个键** | 审计核三处 + `git --no-optional-locks diff -U0` 只命中该键；转录不证明独立，只是「谁判的」可追 |
| 限度 | `touchedSemanticKeys` 只覆盖 A1/A2，**不覆盖边界段**，所以「漏 `--rejudge`」没有机器拦截，只能靠 V-8 与审计 | 明写，不假装有门 |
| 降级 | 无子代理环境不得执行 `replace`；报告首行标「降级模式（B3 未独立重判）」，S5 不标完成 | 承接 `spec-testcase-gate` |

**为什么 `senior-sdet` 不升 `producer`**：`sdet` 档已含 Write / Edit，升 `producer` 只多 `RunCommand`；Q2 已裁定首批只给审计 + 侦探；S2 / S3 若要给新产品经理 / `speaker`，加 `tierBySeat` + `boundaryBySeat` 两条映射即可。

## 5 单源化（B-5）

| 位置 | 改前 | 改后 |
|---|---|---|
| `agentData.mjs` 尾部 map | 按席名三元分派 tools 与 boundary | `].map((s) => ({ tools: toolsForSeat(s.name), ...(boundaryBySeat[s.name] ? { boundary: boundaryBySeat[s.name] } : {}), ...s }))` |
| `validateAgentData.mjs` 断言 4 | 按席名三元分派允许集 | `const allowed = toolsForSeat(a.name);` |
| `validateAgentData.mjs` 槽位白名单 | 硬编码三席 | `new Set(['evidence-reader', ...Object.keys(patternRegistry.boundaryBySeat)])` |

**展开顺序硬约束**：`...s` 在最后；条目不得自带 `tools` / `boundary`（否则静默覆盖档位）。map 上方加注释，测试构造「条目自带 tools」断言 `ToolsViolation`。

**断言 4 的判别力口径**：`agentData.tools` 与 `allowed` 是同一数组实例（`toolsForSeat` 同源），断言 4 只挡「数据侧注入 / 条目自带 tools」；档位映射本身写错由测试的字面期望守（不是断言 4）。

## 6 施工顺序

1. 改 `patternRegistry.mjs`（P-1）→ `agentData.mjs`（P-2）→ `validateAgentData.mjs`（P-3）→ `outputFormats.mjs`（P-4）。
2. **两席草稿必须都生成后，才能执行第一次 `replace`**：旁席 `Mismatch` 只有在草稿目录存在与 render 相同的草稿时才被放行（`tools/docgen/cli.mjs:396-413`）。
3. 把「改前 `agents/<席>.md` vs 改后草稿」两版对照展示给用户（`git diff --no-index`），**确认替换内容本身后才执行 `replace`**（`skills/parliament/SKILL.md:15`）。
4. `node tools/docgen/cli.mjs diff --kind agent --name <席>` 取 `--expect-change <新 sha256>`。
5. **B3 重判**：`<席>:B3` 置 `"pending"`；独立子代理按 `criteria.md:134-141` 重判，**只返回**四字段原文；主持人逐字转录进 `.session/reviews/<本次>/rejudge-<席>-B3.md`（含「转录人」），并在 `progress.md` 派工节记同一判者标识；主持人只改 `<席>:B3` 一个注解键。**无子代理 → 停，不得 replace**。
6. `DOCGEN_JUDGED_BY=<判者标识> node tools/docgen/cli.mjs replace --kind agent --name <席> --draft <草稿> --expect-change <sha> --rejudge B3 --yes`；两席各跑一次。
7. `node tools/docgen/cli.mjs gate` → exit 0 且 `baseline N/N`（N 从 `BASELINE_RULES.length + agentPaths().length` 派生，当前 37）。
8. 改四处旧测试 + 新增 `tool-tiers.test.mjs`（P-6）。
9. 同步三处流程文档（P-7）。
10. `npm run check` → 全绿、`0 findings`、覆盖席数 = `state.json` 中 `replaced` 席数（≥1 且 ≤ `agentData.length`）。
11. 账本（P-8）：B-5 迁出；B-1 拆三条接班条目（`research` → S5-R / 精算师取数权 → S2 / S5-B）。

**中途不得**：手改 `agents/*.md`；跳过 B3 重判；用旧 `--expect-change` 凭证重试；把 `evidence.json` 手工改哈希；在盘上 == 渲染时把 `replace` 的 exit 0 当作「拒写盘」（幂等短路在凭证 / 重判 / 判者三门前，`tools/docgen/cli.mjs:425-432`）。
**中断重试**：已有草稿时先 `node tools/docgen/cli.mjs draft rm --name <席> --yes`，否则 `DraftNameConflict`（`tools/docgen/cli.mjs:339-340`）。

## 7 失败面

| # | 会怎么坏 | 怎么发现 | 怎么防 |
|---|---|---|---|
| F1 | 工具名拼错 / 顺序漂移 | 逐字数组断言 / `gate` | V-1 / V-4 |
| F2 | `producer` 错挂给 readOnly 席 | 该席多出 Write/Edit，`gate` 不红 | V-6 逐席；负例加 Write → `ToolsViolation` |
| F3 | 只改 tools 不改边界 / `producer` 席漏 boundary | 卡面「可写」与「不得创建」并存；漏写退回默认句 | 运行时断言 + V-3 + B3 重判 |
| F4 | 手改 `agents/*.md` | `gate` `Mismatch` | 只走 draft → replace |
| F5 | 档位表仍两处维护 | 两文件直接读 `patternRegistry.tools` 或三元分派 | V-2 代码探针 |
| F6 | `tierBySeat` 值写错 / 原型链键名 | `toolsForSeat` 返回 `undefined`；`constructor` 抛 `FrontmatterFieldMissing` | V-2 |
| F7 | 卡已改但 evidence 未留记录 | `TargetDrift` | replace 自动追加 `changes[]`；V-8 |
| F8 | 误删 `command` 档 / `BOUNDARY_COMMAND` | PRD §9 档位清单漂移 | V-1；§2 不做什么 |
| F9 | `git status` 刷新 `.git/index` 误报 | 轮末快照出现「非预期变更」 | 边界句 + 固定清单强制 `--no-optional-locks` |
| F10 | B3 重判漏做 / 用旧 `pass` 顶替 | V-8 四字段全绿但没真判 | pending-first + 三处判者标识 + 审计核；**明写无机器门** |
| F11 | 流程文档仍写 `command` 档 | agent 以为不能写 | P-7 + V-9 |
| F12 | 测试写死「四档 / 608 / 37/37」 | 加档后必红 | V-5 派生 |
| F13 | `progress.md` / `round-check.md` 多写者 | 后写者抹掉前写者 | §3.3② 一人一文件；本 spec 不改模板，只约束写权 |
| F14 | `research` 被误当本轮范围 | 有人在本 spec 里加 research 档 | §2 / §3.4；S5-R 接班条目 |

## 8 验收

> **判据已由 S6 接管（F-24）**：`BOUNDARY_COMMAND` 已删除（当期无挂席），凡以它作判据的验收项以 S6 spec §3.6 为准——`S5-TC-E05` / `B08` / `B14` 三条已改判为 `renderBoundary` 口径。本节原句按历史记录保留、不改写。
>
> **口径指针（只加指针、不改上表原句）**：档位 / 命令 / 路径 / 产物 / 席数据的唯一来源是 `tools/docgen/policy/`（`definitions/*.mjs` + `seat-policy.mjs`）；本表凡涉配置与档位的现值，以 `policy --dump` 的输出为准（`node tools/docgen/cli.mjs policy --dump`）。

| # | 验收项 | 判据 |
|---|---|---|
| V-1 | 四档必需项逐字正确 | `tools.producer` 深等于 `['Read','Glob','Grep','Write','Edit','RunCommand']`；`tools.command` 仍在；`BOUNDARY_COMMAND` / `BOUNDARY_PRODUCER_AUDIT` / `BOUNDARY_PRODUCER_DETECTIVE` 非空；本轮 `tools` **不得**登记 `research`（违反 = A04 第三档守卫 + A07 工具白名单双红）；S5-R 落地时同批改五档并同步 A01/A07 |
| V-2 | 按席映射单源 | `tierBySeat` 含 `senior-sdet → sdet`、`reviewer-audit → producer`、`detective-observer → producer`；`boundaryBySeat` 含两席且值非空（不判键数量）；`defaultTier === 'readOnly'`；`tierBySeat` 每个值 ∈ `tools` 键；`tools` 每个档位 ∈ `Object.values(tierBySeat)` ∪ `[defaultTier, 'command']`；`toolsForSeat('ghost')` / `('constructor')` 深等于 readOnly；两文件出现 `toolsForSeat(` 且不出现 `patternRegistry.tools`（import 除外） |
| V-3 | 两卡工具行、固定清单与边界句正确 | tools 行逐字六元组；`boundary` 非空；边界节含「整档授予」「封闭清单」「平台无参数级授权」「不假装白名单」「本轮结论作废」「无中断评审」；不含无条件裸短语「不创建、修改、删除任何文件」；两卡含「不得写 `gate-record.md`」**或全路径 `skills/dev-workflow/references/gate-record.md`**（二者之一即可）与「不得写 `progress.md`」；审计卡含 `round-check.md`、侦探卡含 `detective.md`；侦探固定清单第 4 项含 `--no-optional-locks status`；§3.3 检测证据表、§4 判者表与 V-8 里的 `status` / `log` / `reflog` / `diff` 命令全部带 `--no-optional-locks`（不得出现裸 `git status` / `git diff`）；审计卡「输出格式」含「已授 producer 档」且不含「已授 command 档」 |
| V-4 | 卡与源逐字节一致 | `gate` exit 0；`baseline N/N`（N 派生） |
| V-5 | 旧测试同步且计数派生 | 四处旧测试按 §11.3 D7/D8 改；`validate.test.mjs` 标题按 `tools` 派生；不新增写死档位数量 / 用例总数 / `37/37`；`validateAgentData.mjs` 注释不含旧计数 |
| V-6 | 其余席零回归 | 未挂 `producer` 的席 tools 仍等于 readOnly / sdet；`gate` 逐席比对（席数 = `agentData.length`） |
| V-7 | 未授权席拿不到写权 | readOnly 席注入 `Write` → `ToolsViolation`；`producer` 席注入 `WebSearch` → `ToolsViolation`；未注入时恰等于 producer 六元组 |
| V-8 | B3 重判落账 | `changes[]` 中 `to === renderSha256` 的**全部**条目（≥1 条，按 `at` 升序取最新一条）的 `rejudged` 含 B3、`judgeMode === 'subagent'`、`judgedBy` 与 `rejudge-<席>-B3.md` / `progress.md` 派工节三处逐字相等、B3 verdict pass；`rejudge-<席>-B3.md` 四字段齐、判前 = pending、转录人非空；`git --no-optional-locks diff -U0 rules/.inspector-annotations.json` 只命中 `<席>:B3`。**限度**：不证明判者独立；漏 `--rejudge` 无机器门，靠本项与审计 |
| V-9 | 流程文档同步 | `skills/` 下 `grep '已授 .command. 档'` = 0；三处文档含「已授 `producer` 档」 |
| V-10 | 账本收口 | `open-items.md` 无 `\| B-5 \|`；B-1 已替换为**三条**接班条目：`research` → S5-R（触发 = S2 市场卡）、精算师取数权 → S2、S5-B（检测脚本 / CLI B3 门 / 账本模板改造）；仍标「未决」 |

## 9 测试（测什么 / 为什么）

| 测什么 | 为什么 | 用例出处 |
|---|---|---|
| 四档定义、`tierBySeat` / `boundaryBySeat` 单源、未知席 / 原型链回落（V-1 / V-2） | 档位表是权限面的唯一真相 | TC-A 组 |
| 两卡 tools 行、固定清单、边界句五段、审计输出格式（V-3 / V-8） | 卡面是 agent 唯一能读到的权限边界 | TC-B 组 |
| 生成物一致性、其余席零回归（V-4 / V-6） | 全仓共用一个渲染器 | TC-C 组 |
| 未授权席拿写权、命令白名单、B3 落账、幂等短路（V-7 / V-8 / F9 / F10） | 只测「能做什么」不测「不能做什么」= 守卫只在顺利路径有效 | TC-D 组 |
| 旧测试同步、计数派生、`command` 档保留、流程文档同步（V-5 / V-9 / F8 / F12） | 写死数字是历史踩点 | TC-E 组 |

**测试用例文件**：`docs/superpowers/specs/2026-10-25-s5-tool-tiers-design-testcase.md`（由 `senior-sdet` 在全新上下文独立编写；本 spec 只写「测什么 / 为什么」，不内联用例）

## 10 依赖、顺序与拆出项

| 项 | 说明 |
|---|---|
| 上游 | PRD §9 / §9.1（D-14）、D-17 / D-18、§12 S5 行；S1 spec §7.6 |
| 下游 | S3（`speaker` 挂 `producer`）；S2（产品经理挂 `producer`；精算师取数权若需命令权挂 `command`）；**S5-R**（`research` + 市场卡） |
| 施工前置 | ① 段已签、议会 #1 已过；两张卡改造前须经用户对照确认；`state.json` 两席为 `replaced` |
| 阻塞风险 | 若用户否决写权，两卡回退 `command`，§3.3 / §4 重做；若只批一席，未批准席保留 `command`，映射删对应一行；若平台新增参数级授权，按 D-14 认输判据改回平台预防 |
| 无子代理环境 | 只能出草稿；报告首行标「降级模式（B3 未独立重判）」，不得 `replace`，S5 不标完成 |
| **拆出项（S5-B，另立 spec）** | 检测脚本（`.session/` 盲区）、CLI B3 机器门（`touchedSemanticKeys` / verdict 门）、`progress.md` / `round-check.md` 一人一文件模板改造、`round-check` 第 6/7 项。第 2/3 轮议会证明它们是独立深水区，混入本 spec 会持续产生新 P0 |
| 不在本 spec 内 | `research` 档与其卡（S5-R）；市场 / 产品经理 / `speaker` 卡；`check-prd-graph.mjs`；PRD 正文与状态列。

## 11 裁决记录与差异清单

### 11.1 本段关闭的裁决（用户 2026-10-24）

| # | 问题 | 裁定 | 依据 |
|---|---|---|---|
| Q1 | 先 S5 还是 S3 | **先 S5** | S3 依赖 `producer`（`index.md:686`）、S2 的精算师自取数也要它（`index.md:730`） |
| Q2 | `producer` 首批授予哪些席 | **`reviewer-audit` + `detective-observer`**；`senior-sdet` 保持 `sdet` | PRD §12 S5 文件清单只列两卡（`index.md:689`）；Q2 用户确认 |
| Q3 | `research` 怎么落 | **拆到 S5-R**，本 spec 不登记 `research` | 用户 2026-10-24「把 producer 和 research 分开，减少范围」 |
| Q4 | 第 2/3 轮引入的检测脚本 / CLI B3 门 / 账本模板怎么办 | **拆到 S5-B**，本 spec 只保留检测限度声明 | 用户「减少范围」；避免独立深水区持续产生新 P0 |

### 11.2 遗留裁决的收口

| 遗留项 | 来源 | 本 spec 的处置 |
|---|---|---|
| `git status/diff` 刷新 `.git/index` 误报 | 议会 #1 第 7 轮 AI 附注；`docs/handoffs/2026-10-24-s5-tool-tier-spec.md:67` | 边界句与固定清单强制 `--no-optional-locks` |
| 档位名表两处硬编码（B-5） | `docs/after/…open-items.md:20` | §5 收进 `tierBySeat` / `boundaryBySeat`；V-2 探针 |
| `.session/` 等 gitignored 写区不可检测 | 第 2/3 轮议会 | 本 spec §3.3⑤ 写明限度；检测强化拆 S5-B |

### 11.3 差异清单

| # | 位置 | 改前 | 改后 | 为什么 |
|---|---|---|---|---|
| D1 | `patternRegistry.mjs` | 三档（readOnly / sdet / command） | 四档（+ producer）+ `tierBySeat` + `defaultTier` + `toolsForSeat` + `boundaryBySeat` + 两个 `BOUNDARY_PRODUCER_*` | F-16 的 producer 部分；B-5 |
| D2 | `agentData.mjs` 尾部 map | 按席名三元分派 | `toolsForSeat` + `boundaryBySeat`；侦探固定清单加 `--no-optional-locks` | 去第二份表；职责与边界对齐 |
| D3 | `validateAgentData.mjs` | 按席名三元分派；槽位白名单硬编码 | `toolsForSeat`；producer 缺/空 boundary → `DescriptionDerivation`；白名单派生 | 断言与数据同源 |
| D4 | `outputFormats.mjs` | 「已授 command 档」 | 「已授 producer 档」 | 卡面事实一致 |
| D5 | `agents/reviewer-audit.md` | tools 四元组；旧边界 | tools 六元组；producer 审计版（不写 progress / gate-record） | D-14 + Q2 |
| D6 | `agents/detective-observer.md` | tools 四元组；裸 `git status`；旧边界 | tools 六元组；`--no-optional-locks`；producer 侦探版 | D-14 + Q2 |
| D7 | `pilot-data` / `pilot-render` / `validate` 测试 | 写死 command 四元组 / 四档 | 六元组 / 派生 | 不改必红 |
| D8 | `review-fixes.test.mjs` I5 | `data[0]` 当普通席 | 显式取 `reviewer-qa` | 升档后 `data[0]` 是 producer |
| D9 | `skills/parliament/references/debate-protocol.md:17`、`skills/parliament/assets/round-check.md:21`、`skills/dev-workflow/references/stage-4-quality.md:28` | 「已授 command 档」 | 「已授 producer 档」 | 流程文档与卡面一致 |
| D10 | `docs/after/…open-items.md:18,20` | B-1 / B-5 未决 | B-5 迁出；B-1 拆三条（research → S5-R / actuary → S2 / S5-B） | 待办账本只放没做完的 |
| D11 | `docs/after/…open-items.md` | 无 S5-B 条目 | 含在 D10 的第三条接班条目里，不另立行 | 拆出项不能凭空消失 |
