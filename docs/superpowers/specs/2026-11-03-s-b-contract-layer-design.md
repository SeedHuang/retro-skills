> split from `docs/prd/20261102212627-card-data-contract-and-proof/index.md`（2026-11-03）

# 11 S-B 契约层：`issue-card` 三列证据 + 引句校验器 + 卡面策略指针

> 本 spec 只覆盖 PRD §8 的 **S-B 段**。D1–D17 / Q1–Q8 / V1–V12 的正文只活在 PRD，本文只引用编号（PRD §9 双份真相禁令）；引用一律写「PRD D14」这类编号，不抄原文。
> 前置（硬）：S-A 五段闭环（`skills/dev-workflow/references/gate-record.md:81`–`:85`）且 `①@card-data-contract-and-proof` 门行在位（同文件 `:87`，按「判据换载体」登记）。缺任一条不得开工。
> 本仓约定：正文引用 `.mjs` 一律只写**符号名或文件名**，不带行号（行号会漂，`managing-lessons-store` 的行号守卫会判红）。

## 11.0 为什么

- **证据形式是三件事里最贵且会漂的那件**（PRD §1 缺陷 3）：本轮 3 次漂移（脚本行号 / 门行里的文件数 / 门行里的行数），共同点是「把仓内规模写成字面量」。
- **「写出原文引句」共 88 行**（`(Select-String agents\*.md -Pattern '写出原文引句').Count` → 88，本轮复算 = PRD §1 缺陷 7 的值），而 `outputFormats.evidence` 早已定义「摘句 / 文件 + 行号 / 用途」三列（`components/outputFormats.mjs` 的 `evidence.fields`），`tools/observation-check/evidence.mjs` 的 `checkEvidence()` 也已实现「摘句能在源文件检索到且行号那行包含它」——**这 88 行没有一条指向它们**（PRD 缺陷 7）。
- **`issue-card` 的证据仍是 1 列**（`components/outputFormats.mjs` 的 `outputFormats['issue-card'].fields`，7 列）。1 列装三样东西，填的人只能自选其一，判的人无从二值判。
- **策略清单被整段渲染进卡面**（PRD 缺陷 4 / Q6 / D11）：2 张卡（`reviewer-audit` / `detective-observer`）的边界段 **2198 / 2158 字符**（口径：不含 `## 边界` 标题，从下一行起至下一个 `##` 前逐行 `.Length` 求和），其中 4 行是清单类展开——禁写路径 309、命令白名单 542、禁止命令 435、检测盲区 317（`reviewer-audit` 实测）。源早已单份（`policy/**` + 模板），产物是第二份逐字长清单。**数值口径**：PRD §3 Q6 记的是 2260 / 2220（Q8 删 3 项之前）；S-A 删完复测为 **2198 / 2158**（各 −62），本 spec 一律用复测值。
- **`categories` 两处存放**：`card.duty.categories`（纯字符串，如「验收可验证性」）与 `card.categories[].label`（如「验收可验证性核对」）同义不同字，13 席各自维护（PRD Q3 裁定「复用」）。
- **映射用例可能空心**（PRD §4 V7）：用例体写成 `assert.ok(true)` 也能让 `map` 报 `dangling 0`，映射就在，但什么都没验。

## 11.1 核心决定（不可违反）

| # | 决定 | 为什么 |
|---|---|---|
| R1 | `outputFormats['issue-card'].fields` 由 7 列改 **9 列**，其中三列**派生自 `outputFormats.evidence.fields`**（`...evidence.fields` 展开，不抄字面） | PRD D14 要求「做法指向已注册契约」。抄一份字面就是第二份真相：改 `evidence.fields` 时 `issue-card` 不跟随，且没有任何判据能发现。派生后两者恒等，可加相等断言（§11.4-1） |
| R2 | 引句校验器 = `tools/docgen/check-quotes.mjs`，**复用 `checkEvidence()`**，不新写校验逻辑；语料 = `docs/superpowers/reviews/**/observation-*.json` 的 `items[].evidence`；**fail-closed：扫到的 evidence 少于 2 条也 exit 1** | PRD V6 已定死语料位置与 fail-closed。重写一套校验会与 `EvidenceQuoteMismatch` 等 10 个码分叉；语料为 0 时「绿」等于没验（这正是 r1 审计判 P1 的形态） |
| R3 | **不进 `npm run check`**：`check-quotes.mjs` 是独立脚本，验收在 ③/④/⑤ 门行跑（命令 + 输出首行）。腐化风险落 `docs/after/` 一条（带触发） | 与 S-A 的 `check-shared-refs.mjs` 同口径（该件审计已接受）。理由：语料是**历史观察记录的产物面**，清理 `docs/superpowers/reviews/` 属正常归档动作，接总门禁会让归档即全仓红 |
| R4 | **施工第 1 步 = 产出 1 份真实观察记录**：`docs/superpowers/reviews/<次>/observation-r1.json`，含 **≥2 条** `items[].evidence`（`{path,line,quote}` 三键齐、`checkEvidence` 判 ok）。该记录自身即可复用语料，**不放宽 fail-closed** | PRD V6 要求「S-B 必须先落 1 份含 ≥2 条 evidence 的真实观察记录」。实测现存唯一语料件 `docs/superpowers/reviews/2026-10-27-1200-migration-drill/observation-r3.json` 的 `items` 3 条**全无 `evidence` 键** → 不先造记录，`check-quotes.mjs` 恒 exit 1，V6 在「金态」即红 |
| R5 | 卡面「档位 + 指针」= **5 个清单槽改指针**（禁写路径 / 命令白名单 / 禁止命令 / env 形态 / 检测盲区），**段首句与语义句保留**；卡面**不得再出现「逐项点名」字样** | PRD Q6 的裁定是「渲染粒度」而非「删段」：读者仍需知道「默认拒绝 / 越界即越权」。V8 的机械判据就是 `逐项点名` 计数 → 0，保留该字样 = V8 红。**槽数是 5 不是 4**：模板第 11 行一行含 `DENY_GROUPS` + `ENV_FORMS`（第 2 轮复核实测） |
| R6 | 指针形态 = **策略符号名**（`pathGroups` / `commandGroups` / `forbiddenGroups` / `DETECTION_BLIND_SPOTS`），**不写仓内文件路径** | PRD D13 + Q8 刚把项目专属路径赶出卡面：指回 `tools/docgen/policy/**` 等于把它们放回来。符号名全仓唯一，可 grep 回查 |
| R7 | `duty.categories` **移出数据源、装配期注入**（同 D17 的 `duty.trigger` 法）：席文件写非空值即拒载；注入值 = `card.categories[].label` 逐元素逐字 | PRD Q3「复用」。注入而非删除：装配后的 `card` 仍保留该键 → S-C 的 V12 四字段判据面不变（PRD §4 V12 明确钉 `card.duty.trigger / categories / action / constraint`），S-B 不悄悄改 S-C 的判据面 |
| R8 | `card.duty.categories` **不再渲染**（删「关注类别：」行）：关注点由「本席清单」上方的「类别：」行承担 | 注入后两行字面完全相同，同卡印两遍是纯冗余；`关注类别：` 与 `类别：` 并存时读者得自己判断哪个是权威 |
| R9 | `FORMAT_CHECKS` 第 2 条改为指向三列 + 校验器；**保持 3 条、每条仍含「废卡」与「缺 / 空」** | `s2-card-rewrite.test.mjs` 的 `S2-TC-A06` 钉 `length === 3` 与 `/废卡/ && /[缺空]/`，改文案必须同时满足；D14 要求「做法指向校验器」 |
| R10 | 新增 `tools/docgen/check-case-assert.mjs`（PRD V7）；首次实测输入 = **S-A 的 plan + testcase**（S-B 自身 plan 未生成） | V7 的判据要吃到「映射表」；S-B 的 plan 在 ③ 之前不存在，用 S-A 那对已签件实测才有意义（30 条用例 / 映射 30 条） |
| R11 | 卡面文本是生成物：**模板改 → 2 卡重生成 → `baseline.json` + 2 席 `evidence.json` 同批落盘**；`gate` 必须 exit 0 且 15 席 `disk == render` | 只重生成卡面不更新 evidence，下一次 `replace` 才炸（`EvidenceInvalid` / `TargetDrift`），离改动很远。这是 S-A 已验证过的四件同批（S-A 记 `D-c`） |
| R12 | 同批改写**已签断言**：`sa-data-layer.test.mjs` 的 `TC-006` / `TC-025`、`policy-pure-source.test.mjs` 的三处锚点 / `tool-tiers.test.mjs` 的口径（§11.2.6 逐条列） | 这几处把「卡面必须有逐项点名的 20 项」写成了断言；R5 落地后它们必红。不改 = 改坏即绿，也无法证明 R5 真的落地 |

## 11.2 机制

### 11.2.1 `issue-card` 三列（PRD D14）

现状（`components/outputFormats.mjs` 的 `outputFormats['issue-card']`）：

```
fields: ['编号（Q-轮-序）', '提出角色', '归属维度', '问题描述', '证据', '严重级别', '建议解法']   // 7 列
```

改为 9 列，证据位派生：

```js
// 顺序 = 原顺序的第 5 位处展开三列；其余列不动
fields: [...HEAD, ...evidence.fields, ...TAIL]
// HEAD = ['编号（Q-轮-序）','提出角色','归属维度','问题描述']
// TAIL = ['严重级别','建议解法']
```

硬要求：`issue-card.fields` 中证据三列与 `evidence.fields` **逐字相等**（判据 §11.4-1），且 `fields.length === 9`。

**同族的两处字面都要改，但不是同一条**（议会第 1 轮 RD 的 Q-②-3 指出原文归错文件）：

| 文件 | 现值（逐字） | 改为 |
|---|---|---|
| `components/outputFormats.mjs` 的 `issue-card.checks[0]`（**第 1 条**） | `证据栏必须写文件行号或命令输出，空 = 废卡` | `证据三列（原文摘句 / 文件 + 行号 / 用途）缺任一 = 废卡，三列须由 check-quotes 验真` |
| `card-model/vocab/card-contract.mjs` 的 `FORMAT_CHECKS[1]`（**第 2 条**） | `证据栏为空 = 废卡，须写文件:行号或命令输出首行。` | 同义改写（见 R9）：必须仍含「废卡」与「空」，且 `FORMAT_CHECKS.length === 3` 不变 |

`outputFormats` 侧**只改第 1 条（`checks[0]`），第 2 / 3 条不动**（第 2 条是「建议解法栏空 = 废卡」、第 3 条是 P0/P1 证据要求）。两处索引不同源：`outputFormats` 走 `checks[0]`，`card-contract` 走 `FORMAT_CHECKS[1]`——第 2 轮复核实测过这两个下标，别弄混。

为什么不撞 `S4-TC-D01` 的「无指针」断言（`card-render.test.mjs`）：该断言用的 `PROSE_PROBES.pointers` 是「词 + 后随章节号」形态（同文件的 `POINTER_FORM()`），写校验器名不会命中；但**不许**写成「见 §x」「参见」「同上」这类形态。

### 11.2.2 `check-quotes.mjs`（PRD V6）

**输入**：`docs/superpowers/reviews/**/observation-*.json`（文件名口径 = `tools/observation-check/gate-scan.mjs` 的 `ARTIFACT_RE = ^observation-r\d+(-[ab])?\.(json|md)$`）。

**口径**：

1. 逐文件读 JSON；取 `items[]` 中**带 `evidence` 键**的项，逐个交给 `checkEvidence()`（`tools/observation-check/evidence.mjs`）。
2. 任一 `checkEvidence` 返回 `ok: false` → 打印 `文件:items[i].id → 码（detail 首段）`，exit 1。
3. 收集到的 `evidence` 总数 `K < 2` → 打印 `check-quotes: 语料 <K> 条（需 ≥2，fail-closed）`，exit 1。**这条把 R4 的「≥2 条」写成脚本判据**（不是期望值）：`K = 0` 与 `K = 1` 同为红。
4. 全绿 → 首行 `check-quotes: files <N> / evidence <K> / bad 0 => ok`，exit 0。

**不做**：不校验 `verdict` / `reason` / `open` / `coverage`（那是 ⑥ 段观察产物门禁的职责，重复即两套口径）；不判断「引用是否切题」（PRD §4 残余项，归 `residual` —— 机械判不了、只能抽核的残余项，定义在 PRD D14 —— 抽核）。

**语料件（施工第 1 步，R4）——必须走三步，不能只落一个 json**（议会第 1 轮 BE 的 B-03 指出：⑥ 段要求 json 与 md 成对且渲染一致，且归档目录只读）：

1. 在 `.session/reviews/<次名>/` 下用 `tools/observation-check/` 的写入器生成 **`observation-r1.json` + 同名 `.md` 一对**（`artifact.mjs` 的 `PROCESS_DIR_RE` 只认这个过程目录）。
2. 自校验要过 ⑥ 段的四道：`items` 的 `verdict` 合法、`hit` 必带 `evidence`（否则 `MissingEvidence`）、`coverage` 三段对账（`read + skipped = total`）、json 与 md 渲染一致（否则 `RenderMismatch`）。
3. 校验通过后把**这一对**整移到 `docs/superpowers/reviews/2026-11-03-<次名>/` 并 `git add`（写入器不允许直接写归档目录，会抛 `ArtifactPathOutside`）。

**语料要求**：**≥2 条**带 `evidence` 的 `items`，quote 逐字取自源文件该行（`checkEvidence` 会判 `EvidenceQuoteMismatch`）；该目录不得放 8 类账本之外的文件（否则 ⑥ 段报 `UnclassifiedArtifact`）。

### 11.2.3 卡面「档位 + 指针」（PRD Q6 / D11）

**改面 = 模板 4 行文案 + 5 个槽值；槽集仍 12 个、`SLOTS` 顺序不动**（议会第 1 轮 BE / AU 指出两件事，第 2 轮复核又纠正了「4 个槽」的计数：模板第 11 行一行含 `DENY_GROUPS` + `ENV_FORMS` 两槽，所以是 **5 个槽、4 行文案**）。

**槽号口径**：下面用 `SLOTS` 的 **1-based 序数**——`ALLOW_GROUPS`=7 / `DENY_GROUPS`=8 / `ENV_FORMS`=9 / `FORBIDDEN_PATHS`=10 / `DETECTION_PATHS`=11；测试里的槽索引解构是 **0-based**（`e[6]=ALLOW_GROUPS`、`e[7]=DENY_GROUPS`、`e[8]=ENV_FORMS`、`e[9]=FORBIDDEN_PATHS`、`e[10]=DETECTION_PATHS`）。两种口径混用正是「漏改 env 槽仍全绿」的诱因，写测试时必须显式注明用的是哪一种。

**实现路线唯一**：保留 12 槽、只把上述 5 个槽的值改成指针句（换成「删槽」路线要改 `SLOTS` 与 `validatePolicy` 的槽齐全校验，`S6-TC-C06` 的 12 槽断言直接红）。**漏改 `ENV_FORMS` 时没有判据能发现**（§11.4-3 只查 4 个符号名 + `逐项点名`=0），所以 §11.4 增设 env 面的判定：边界段内 env 具体形态项（`FORBIDDEN` 组 `env.assign` 的 verbs）命中数 = 0。

| 卡面行 | 现状（`reviewer-audit` 实测） | 改为 |
|---|---|---|
| 禁写路径 | 句末「逐项点名：」后逐项列 20 项（路径与模式项各自反引号包裹），再跟 `.gitignore` 兜底句 | 改指「禁写集合 = 策略源 `pathGroups`（六组）与一项模式项（spec 与 plan 的两种写法）」；`.gitignore` 兜底句原样保留 |
| 命令白名单 | 「**命令默认拒绝**：只跑下列白名单」后逐条列命令（542 字符） | 「**命令默认拒绝**：只跑本席策略 `commandGroups` 的白名单组（本席组 ID = `SEAT_POLICY[<席>].allowGroups` 的键）；组为空 = 无白名单命令，其余一律不跑（逐条命令不在本卡重复）」 |
| 禁止命令 + env | 「**禁止**：」后逐条列 `draft` / `draft rm` / …；env 段列出全部合法形态 | 「**禁止**：策略源 `forbiddenGroups` 的全部命令组」；env 段改为「该组内的 env 形态项（`DOCGEN_*` 只是举例）」 |
| 检测盲区 | 直接列 3 个盲区路径 | 改指策略源 `DETECTION_BLIND_SPOTS`，并保留「被 gitignore / 仓外草稿 / 已提交写都看不见」的语义句 |

**保留不动**：「档位事实」句（`{{TIER}}` + `{{CAPABILITIES}}` 整档工具）、「只允许写」段的 `{{ARTIFACTS}}`（本席产物名）、「禁止写」段的 `progress.md` / `gate-record.md` 两句、越界后果段、复算段。理由见 §11.2.8 的 D-b / D-c。

**模板纯度**：新出现的反引号项（`pathGroups` / `commandGroups` / `forbiddenGroups` / `DETECTION_BLIND_SPOTS`）不是定义层单点成员，必须登记进 `components/renderBoundary.mjs` 的 `TEMPLATE_ALLOWED_LITERALS`；且该白名单**不得**登记清单类成员（`assertTemplatePure` 末尾的自检会判 `ALLOWED_LITERALS:` 红）。新文案里的 `spec` / `plan` **不加反引号**——加反引号会变成 span，命中规则 2（span 必须 ∈ 单点集合或白名单）。

### 11.2.4 `categories` 复用（PRD Q3）

| 现状 | 改为 |
|---|---|
| `seats/*.json` 的 `card.duty.categories` = 纯字符串数组（13 席各一份，与 `card.categories[].label` 同义不同字） | 席文件**删该键**；`card.duty.categories` 在**装配期注入**（注入点 = `components/seatLoader.mjs` 的装配函数，与 `duty.trigger` 注入同一处、同一趟）= `card.categories[].label` **逐元素逐字**（同序，含「核对」后缀，不做字符串变换——变换会造出第三种写法） |
| `renderCard.mjs` 的 `dutyBlock` 渲染「关注类别：…」 | 该行**不再渲染**（R8）；`dutyBlock` 只留 `trigger` / `action` / `constraint` |

**注入点为什么在 loader 而不在 `buildOne`**：D17 的 `duty.trigger` 就在 loader 注入，两个「装配期派生」若分住两处，改其中一处的口径就只生效一半。loader 产物 `agentData[i].card` 仍是 8 键（注入只改 `duty` 内部，不加顶层键），故 `check-shared-refs.mjs` 的 8 键断言面不变（§11.4-5）。

**拒载**：席文件若出现非空 `duty.categories` → 抛 `DutyCategoryMisplaced`（新码，`validateAgentData.mjs` 面；PRD §5 的「`CARD_MODEL_CODES` 36 码零新增」约束指的是 `card-model/validateCardModel` 的码面，两者不是一个码表，S-A 已用同法加过 4 码）。该码的 exit 归 1 须登记进 `validateAgentData.mjs` 的 `EXIT[1]`（与 S-A 四码同段），不进 `CARD_MODEL_CODES`。**判据不能看进程退出码**（loader 在 import 期抛、未登记码的进程退出码同样是 1，看不出差别——议会第 1 轮 BE 的 B-05）：改为「`exitCodeFor('DutyCategoryMisplaced') === 1`（未登记时该函数抛『未知错误码』）且 stderr 首行以该码开头」。

### 11.2.5 `check-case-assert.mjs`（PRD V7）

**输入**：`--plan <plan.md> --testcase <testcase.md>`。

**口径**：

1. 从 plan 里取「用例」列的 ID：**只认表头含「用例」的那张表**（S-A plan 的表头是 `| 用例 ID | 落在 Task |`），逐行取第 1 列做 `TC-\d{3}` / `S\d+-TC-[A-Z]\d\d` 匹配后去重（**三位**：S-A 实际 ID 是 `TC-001`…`TC-030`，按两位写只能取出 4 个唯一值）。**不**在 plan 全文正则扫——同一 ID 会在 Step 标题与代码块注释里反复出现，全文扫的去重值不稳定，会让 `ids <N>` 这个判据随排版漂。S-A 那对已签件实测 = **30**。
2. 在 testcase 里逐 ID 定位用例体（`### <ID>` 或 `test('<ID> …` 起、到下一个同级标题 / 下一个 `test(` 止）。
3. 每个用例体内必须含 **≥1 条** `assert.*`，且**不是恒真断言**。**「恒真」按 token 判，不按字面**（议会第 1 轮 AI 的 Q-4 指出：字面匹配时 `assert.ok( true )` / `assert.ok(1)` 即绕过）：取 `assert.<方法>(<参数>)` 的参数侧 `trim()`，命中 `{true, 1, '1'}` 即记 `hollow`（**`hollow` = 用例体里只剩恒真断言、什么都不验**）。
4. **ID 在 testcase 里找不到用例体 → 记 `missing`，不与 `hollow` 混算**：`missing > 0` 同 exit 1（找不到用例体等于映射悬空，和空心一样没验）。
5. 全过 → `check-case-assert: ids <N> / hollow 0 / missing 0 => ok`（exit 0）；否则逐条列 `ID（行号或 missing）`，exit 1。

**不做**：不判「断言是否切题」（那是评审的事，`residual` 抽核）；不解析 plan 的其他表。

### 11.2.6 同批改写的已签件与断言（PRD §5 / R8）

| 已签件 | 命中处 | 必红理由 / 改写口径 |
|---|---|---|
| `tools/docgen/test/sa-data-layer.test.mjs` | `TC-006`（「逐项点名」行存在且 20 项）、`TC-025`（每卡 `lessons/` 恰 1 行且在「检测限度」行） | **必红**（两处理由不同，议会第 1 轮 AU 的 C-02 勘误过）：`TC-006` 因该行整体消失而红；`TC-025` 因 `lessons/` 从卡面消失而红，**不是**「20 项」——改写时按各自的红因写，保留可红形态 |
| `tools/docgen/test/policy-pure-source.test.mjs` + `tools/docgen/test/support/capability-baseline.mjs` + `tools/docgen/fixtures/capability-baseline.json` | 切片锚 `between('逐项点名：','；兜底句')`（单一实现）；`marks` 标记集；`v.expanded.length === 12`（三处）；槽索引解构 `[e[6], e[7], e[9], e[8]]`；fixture 的 12 槽基线 | **必红**（议会第 1 轮 AU 的 A-03）：切片锚失效 → 判据恒空；`expanded === 12` 因「保留 12 槽」而**不变**，但槽值与 fixture 基线必须同步重记。改写口径 = 「指针句在位 + 槽集仍 12 + 定义层成员数不变」 |
| `tools/docgen/test/tool-tiers.test.mjs` | 要求卡面含**全部** `pathTokens()`、含**全部** allow / forbidden verbs | **必红**（议会第 1 轮 AU 的 A-02 纠正了 §11.2.6 首版把本行判成「可能无需改」）：改写口径 = 「指针句在位 + 定义层成员数不变」，「只允许写 / 命令默认拒绝」段序断言保留 |
| `tools/docgen/test/s2-card-rewrite.test.mjs` | `S2-TC-A06`（`FORMAT_CHECKS` 三条 + 含「废卡」/「缺空」）+ `S2-TC-C09③`（把一条 ID 塞进 `duty.categories` 后要求卡面变，五项 `[true×5]`） | **必红两处**（`S2-TC-C09` 由议会第 1 轮 BE 的 B-04 / AI 的 Q-2 指出）：`A06` 按 R9 改文案后仍须 3 条；`C09` 的第五项改写口径 = 「`categories[].label`（`类别：` 行）影响卡面」 |
| `docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md` | 检测限度段那句「删后该段仍有 2 处命中属预期」（`lessons/`） | **加注**：检测限度行改为指针后该预期句不再成立 → 就地补一条「S-B 指针化后此句失效」的注（**不改结论**，只加注） |

**不是「红才改」清单，是「必红」清单**：上表每一行都有机械红因（议会第 1 轮把它们从「可能无需改」纠正为必红）。施工时逐条实跑确认**红因与表里写的一致**——红因不符要回这张表改，不许改断言去迁就实现。

### 11.2.7 冻结基线与重生成（R11）

1. 施工前先落基线：`node tools/docgen/cli.mjs gate` → `baseline 38/38`（exit 0）；记下改前提交哈希 + **15 席** SHA256（入当次账本，形成 S-B 冻结基线表，落 `docs/reports/`；S-A 那张 15 行表作对照历史）。
2. 模板 + 渲染器改完 → `node tools/docgen/cli.mjs generate` 重生成 15 卡：**15 席内容都变**（2 席边界段 + 15 席「关注类别：」行；其中 13 席只少这一行）。
3. 同批重生成 **15 份** `fixtures/<席>.evidence.json`（`TC-028` 逐 15 席要求 `evidence.renderSha256 == 盘上哈希`）。`baseline.json` 只装路径清单、不含哈希（议会第 1 轮 BE 的 C-01），**卡内容变化不改变它**——「无变化即预期」，不要去改它。
4. 复跑 `gate` → exit 0；与**改前提交**比：`git diff --stat <BASE> -- agents/` = `15 files changed`，且 13 席在 `git diff -U0 <BASE> -- agents/` 里**只有一条删除行、无其它增删**（判据口径见 §11.4-6）。

### 11.2.8 本段内部已定口径

> 编号 `D-a`…`D-d` 是**本节自编号**，与 PRD 的 `D1`–`D17` 无隶属关系；引用写「§11.2.8 D-x」。

| # | 已定口径 | 为什么 |
|---|---|---|
| D-a | 指针写**策略符号名**（不加仓内路径） | PRD D13 / Q8 刚把项目专属路径赶出卡面；写 `tools/docgen/policy/…` 等于放回去。符号名全仓唯一，可 grep |
| D-b | 「只允许写」段的 `{{ARTIFACTS}}`（本席产物名）**不指针化** | 产物名是 ②/④/⑤ 门账的锚（`round-check.md` / `delivery-audit.md`），删了读者不知道产出叫什么；它是**契约**（卡面第 7 段输出字段的依据），不是可外置的策略清单 |
| D-c | 「档位事实」句的 `{{TIER}}` + `{{CAPABILITIES}}` **不指针化** | D11 的原话是「卡面只写档位 + 指针」——档位工具清单就是「档位」本身；删掉它，「档位」只剩一个名字，等于把档位定义也外置了 |
| D-d | 语料件放 `docs/superpowers/reviews/<次>/` 根层（与 8 类账本同层），**不放 `.session/`** | `.session/` 不进 git，换机器即失（S-A-Q-6 已登记该风险）；且 ⑥ 段的 `ARTIFACT_RE` 正是按这个位置认产物 |

## 11.3 卡面文本前后对照（2 张卡的边界段；卡面变更面 15 张）

`reviewer-audit` 边界段现 **2198 字符 / 15 行**（口径：不含 `## 边界` 标题；含标题为 16 行）；4 条清单类行合计 **1603 字符**（309 + 542 + 435 + 317）。指针化后这 4 行改为 4 句带符号名的句子。

**卡面变更面 = 15 张卡**（不是 2 张）：2 张因边界段指针化而变，**15 张**因删「关注类别：」行而变（13 张只少这一行）。这条数字由议会第 1 轮 BE 的 B-01 / AI 的 Q-1 纠正，原稿按「只 2 卡变」写是错的。

**观测项（不作验收）**：改后逐席记「边界段字符和」。目标 = 4 条清单行降幅 ≥ 50%；**不设红点**——降幅不是判据，判据是 V8（`逐项点名` = 0）+ 纯度（§11.4-3）。

## 11.4 硬约束（每条都落到一个可跑的退出码）

> 形态统一：**要么直接跑交付脚本（脚本自己 `exit 1`）**，**要么跑测试用例**（`node --test --test-name-pattern "<用例 ID>" tools/docgen/test/sb-contract-layer.test.mjs`）。**不写 `node -e`**（议会第 1 轮 AU 的 A-05：审计席角色卡禁 `node -e`，写了按卡无法执行），**也不把纯计数命令当判据**（同轮 A-04 / AI 的 Q-5：`Select-String` / `git diff` 不设退出码，计数为任何值都 exit 0）。

1. **三列相等**：`issue-card.fields` 的证据三列与 `evidence.fields` **逐元素逐字相等（同序）**，且 `fields.length === 9`。判据 = 用例 **`SB-TC-01`**（`deepEqual`，不是引用相等——实现 `map` 出新数组时引用相等会恒假）。
2. **引句校验器**：`node tools/docgen/check-quotes.mjs` → 首行 `check-quotes: files <N> / evidence <K> / bad 0 => ok`（`K ≥ 2` 由脚本自己判，见 §11.2.2 口径 3），exit 0。负例：`K = 1`、`K = 0`、摘句不在文件、行号不含摘句、行号越界——五种都 exit 1（用例 `SB-TC-18` / `SB-TC-39`）。
3. **模板纯度 + 卡面形态**：① 对**模板**跑 `assertTemplatePure()` 不抛（判渲染文本会恒抛，见 §11.9 Q1）；② 卡面 `逐项点名` 计数 = 0（PRD V8）+ 4 个策略符号名在 2 张卡边界段各命中 ≥1 + 本席组 ID 在位。判据 = 用例 **`SB-TC-05`** / **`SB-TC-31`**（后者统一 `anchors 12/12`）。
4. **映射非空心**：`node tools/docgen/check-case-assert.mjs --plan docs/superpowers/plans/2026-11-03-s-a-data-layer.md --testcase docs/superpowers/specs/2026-11-03-s-a-data-layer-design-testcase.md` → `ids 30 / hollow 0 / missing 0`，exit 0（PRD V7）。
5. **单一来源**：`card.duty.categories` 在 15 席**装配产物**（`agentData[i].card`）中逐席与 `card.categories[].label` `deepEqual`（同序逐字）；任一席文件出现非空 `duty.categories` → `DutyCategoryMisplaced`，判据 = `exitCodeFor('DutyCategoryMisplaced') === 1`（**不是**看进程退出码：loader 在 import 期抛、未登记码的进程退出码同样是 1，看不出差别——议会第 1 轮 BE 的 B-05）+ stderr 首行以该码开头。用例 **`SB-TC-07`** / **`SB-TC-20`**。
6. **渲染一致（带基线）**：改后 `node tools/docgen/cli.mjs gate` exit 0（15 席 `disk == render`）+ 与**改前提交**比 `git diff --stat <BASE> -- agents/` = **15 files changed** + 15 份 `fixtures/<席>.evidence.json` 的 `renderSha256` 与盘上一致（`TC-028` 口径）。**不许**写裸 `git diff --stat -- agents/`（提交前后数字不同）。用例 **`SB-TC-06`** / **`SB-TC-32`**。
7. **全仓门禁**：`npm run check` exit 0、`# fail 0`、末行 `check 全部通过`；`CARD_MODEL_CODES` 仍 36 码、`SCAN_FIELDS` 仍 8 键。
8. **关注点单行（R8 的验收锚）**：卡面 `关注类别：` 计数 = 0，且 `类别：` ≥ 15。为什么必须单列：R8 若没落地，`gate` 在改动前后都绿（两边同时变）。用例 **`SB-TC-08`** / **`SB-TC-37`**（两向判别力：回填该行 → 1 判红；少一行 `类别：` → 14 判红）。
9. **指针不含仓内路径（R6 的验收锚）**：**只判被指针化的那 4 行**（禁写路径 / 命令白名单 / 禁止命令 / 检测盲区）的文本——其内仓内路径形态（`(tools|agents|scripts|skills|rules)/…` 与 `.mjs` / `.json` 反引号形态）命中数 = 0。**不能判整段边界段**：「只允许写」段合法地含 `docs/superpowers/reviews/<本次>/`，判整段会把这条合法路径算成违规、金态即红（侦探第 1 轮实测）。用例 **`SB-TC-24`**（含「取到行数 = 4」的防空转判据）。
10. **env 槽已指针化（防漏改）**：2 张卡边界段内，`env.assign` 的具体形态项（`FORBIDDEN` 组 `env.assign` 的 verbs，如 `VAR=1 cmd` 那类写法）命中数 = 0。为什么必须单列：第 1 轮修复时把槽数从 4 改成 5（`DENY_GROUPS` 与 `ENV_FORMS` 同处模板一行，容易只改前者），而 §11.4-3 只查 4 个符号名与 `逐项点名`，漏改 env 槽仍会全绿（第 2 轮复核发现）。用例 **`SB-TC-41`**。

## 11.5 测试

| 测什么 | 为什么 |
|---|---|
| 三列由 `evidence.fields` 派生（改 `evidence.fields` 一处，`issue-card` 必跟随） | 这是 R1 唯一能证明「不是第二份字面」的方式；只看「9 列」会被抄写版本骗过 |
| `check-quotes.mjs` 的五种红态：摘句不在文件、行号不含摘句、行号越界、语料 `K = 0`、语料 `K = 1` | fail-closed 是 V6 的核心；`K = 1` 与 `K = 0` 分开测，否则「≥2 条」这条会被实现成「非空即绿」 |
| 语料件本身过 ⑥ 段观察产物门禁（`ArtifactMissing` / `UnclassifiedArtifact` 不报） | R4 造的记录若不被 ⑥ 段认，V6 的语料随时会被归档动作带走 |
| 卡面 4 行指针化后：段首句仍在、符号名在位、`逐项点名` 0 命中、纯度自检不抛 | 少一条都会让「指针化」退化成「删段」（读者失去「默认拒绝」这个语义） |
| 2 卡重生成后 `gate` exit 0 + 与改前提交比 `git diff --stat <BASE> -- agents/` = **15 files**，且 13 席只有一条删除行 | 只改模板不重生成 → 下一次 `replace` 才炸；把 13 席的「只少一行」判成「也改了边界」会掩盖意外改动 |
| `duty.categories` 注入后逐席与 `categories[].label` `deepEqual`；席文件写非空值 → `DutyCategoryMisplaced` | 单源的唯一可判形态；「注入」写错不会报错、只会让卡面显示旧值 |
| 卡面 `关注类别：` 计数 = 0 且 `类别：` ≥ 15（R8） | 不单列就判不出：「渲染一致」在改动前后都绿 |
| `check-case-assert` 对恒真断言必红（`assert.ok(true)` / `assert.ok( true )` / `assert.ok(1)` 三种形态） | 这是 V7 的全部意义；只测字面形态等于把绕过路径留着（议会第 1 轮 AI 的 Q-4） |
| `FORMAT_CHECKS` 仍 3 条、每条含「废卡」与「缺 / 空」 | `s2-card-rewrite.test.mjs` 的既有断言不许破 |
| 卡面边界段内不含仓内路径形态（R6，§11.4-9） | R6 原本只有义务句；指针写成 `policy/definitions/paths.mjs` 时旧判据全绿 |

**测试用例文件**：`2026-11-03-s-b-contract-layer-design-testcase.md`（由 `senior-sdet` 在全新上下文编写；每条用例五要素齐、负例与边界合计 ≥ 正例）

**只手动验证**：卡面文本「读者能不能顺着符号名找回策略源」（人的可用性判断，脚本测不出）

**不测**：卡面排版美学、`residual` 抽核（切题性）、`policy/**` 内容语义（S6 已签零改动，本段只引用）

## 11.6 不在这一轮

- 三态 5 行删除 / 表头三值行 → S-C（`s2-card-rewrite.test.mjs` 五处冻结断言）
- `trigger.kind` 四值校验、斜杠串清零（V10 / V12）→ S-C
- 删人设套话（D1 / D2 / V9）、`HOST_TERM`（Q1）、`needs` 槽删除与长度约束（Q4）→ S-C
- 卡面 7 段结构、front matter、`SCAN_FIELDS` 8 键、12 键契约 → 本段不动
- 把所有 `outputFormats` 的字段都改成指针 → 撞 `S4-TC-D01`（`card-render.test.mjs`），且 D14 只要求「做法指向契约」

## 11.7 将来才会撞上的一件事

`check-quotes.mjs` 不进总门禁（R3）。若将来有人清理 `docs/superpowers/reviews/` 把语料件归档掉，`check-quotes` 会 fail-closed 变红，但**没有任何门禁会提示**——直到下一次 ③/④/⑤ 门行实跑。落 `docs/after/` 一条（触发 = 下次改 ⑥ 段观察产物门禁，或 `docs/superpowers/reviews/**/observation-*.json` 的文件数降到 1）。

## 11.8 与既有 spec 的关系

- **增量改** `2026-10-29-agent-card-s4-render-design.md` 的 `S4-TC-D01`（`outputFormats` 结构断言）：只改 `issue-card` 的 `fields` 条数（7 → 9），「5 个 outputKind / 无指针 / 两数组」三条判据不变
- **就地加注** `2026-11-03-s-a-data-layer-design.md` 的检测限度预期句（`lessons/` 命中数失效），**不改结论**
- **改写** S-A 已签 testcase 的两条断言（`TC-006` / `TC-025`）——属改已签件，须在 `gate-record.md` 的 `②@S-A` 行做「签后增量登记」
- **保留** PRD 全部 D/Q/V 正文；**取代** 无

## 11.9 差异清单

> 本表记录 spec 与 testcase 的**理解差异**（② 段出口判据之一：差异清单留痕）。testcase 由独立 `senior-sdet` 实例编写（实例标识 `senior-sdet@s-b-contract-layer-testcase-20261103-01`），交付后逐条裁定如下；**8 条已全部裁定并回填 spec**，未决 0。

| # | 差异点 | spec 原口径 | testcase 指出 | 裁定（回填位置） |
|---|---|---|---|---|
| Q1 | `assertTemplatePure` 判模板还是判卡面文本 | §11.4-3 原写「对 2 张卡的边界段跑」，字面指向渲染文本 | 渲染文本里清单成员本就是逐项反引号展开，规则 1 必红 → 该判据在任何实现下恒抛 | **按「判模板」**：§11.4-3 已改为两件分开判（模板跑自检 / 卡面判 `逐项点名 = 0` + 符号名在位） |
| Q2 | `K ≥ 2` 是判据还是期望值 | §11.4-2 写 `K ≥ 2`，§11.2.2 只写「0 条 → exit 1」 | 同一输入 `K = 1` 在两种读法下红绿相反 | **按「判据」**：§11.2.2 口径 3 已改为 `K < 2 → exit 1`，与 R4 合成一条 |
| Q3 | `issue-card.checks` 三条全不改 vs 第 2 条改文案 | §11.2.1 说「三条不改」，R9 说「第 2 条改」 | 同一条 check 只能一种文案 | **按 R9**：§11.2.1 已写明「`outputFormats.checks[0]` 改、`FORMAT_CHECKS[1]` 改，两侧各余两条不动」（两处索引不同源，第 2 轮复核实测），并写明不撞无指针断言的理由（`PROSE_PROBES.pointers` 是「词 + 后随章节号」形态） |
| Q4 | 逐席 `===` 是引用相等还是结构相等 | §11.4-5 写 `===` | 实现 `map` 出新数组时引用相等恒假而语义正确 | **按结构相等**：§11.4-5 已改 `deepEqual`（同序逐字） |
| Q5 | `check-case-assert` 的「用例」列取数口径 | §11.2.5 只写「从 plan 里取用例列」 | 全文正则扫的去重值随排版漂（同一 ID 在 Step 标题 / 代码块反复出现） | **按表头含「用例」的那张表**；并补 `missing` 计数（找不到用例体 ≠ 空心，但同为 exit 1）——已回填 §11.2.5 口径 1 / 4-5 |
| Q6 | `git diff --stat -- agents/` 的比较基准 | §11.4-6 写裸命令 = 2 files | 提交前后输出不同（提交后为 0），不可复算 | **按「改前提交哈希」**：§11.4-6 / §11.2.7-4 已改为 `git diff --stat <BASE>` + 与 S-A SHA 基线表逐行比对 |
| Q7 | R8（删「关注类别：」行）无验收锚 | §11.1 R8 只是决定，无判据 | `disk == render` 在改动前后都绿 → R8 落地与否完全不可判 | **补一条硬约束**：§11.4-8 新增 `关注类别：` 计数 = 0 且 `类别：` ≥ 15 |
| Q8 | `duty.categories` 注入点在 loader 还是 `buildOne` | §11.2.4 只说「装配期注入（同 D17）」 | 两处取数点不同；loader 注入会碰 8 键断言面 | **按 loader**（与 D17 同处同趟）：§11.2.4 已写明注入文件与理由，并说明 8 键面不变 |

**另**：testcase 附了 6 条「给开发的建议」（A-1…A-6），属施工注意（临时副本注入、`ARTIFACT_RE` 发现口径、拒绝行号兜底、已签断言改写要保留可红形态、新码登记 `EXIT[1]`），**不进 spec 判据面**，由 ③ 段的 plan 承接。
