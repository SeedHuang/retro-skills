# 测试用例：agent-card S1 定义层（卡面内容模型 + 校验器，F-01～F-08）

> **归属 spec**：`docs/superpowers/specs/2026-10-29-agent-card-s1-card-model-design.md`（**v6，301 行**，内容已定稿、待议会 #2 第 3 轮签字）。
> **上游权威**：`docs/prd/20261026205821-agent-card-contract.md` §3.8 `:243-284`（字段形状唯一权威）/ §3.4 `:194-204` / §3.5 `:205-212`（`subject` 枚举 `:293`）/ §3.6 `:213-218` / §4.4 B 表 S1 组 `:361`（36 个名字，含 `WeakReason`(manual)）/ A 表 `:346`（`MissingCriterionImpl`）/ §6 F-01～F-08 `:463-472` / §8 S1 行 `:516`。
> **编写者**：`senior-sdet`（独立子代理，**全新上下文**）。
> **独立性声明**：编写者 = 本文件唯一作者，**≠ spec 作者、≠ 施工者**；用例只在 spec + PRD 上生长（spec §3–§12、PRD §3.4–§3.8、F-01～F-08），**未参与任何实现**，**未修改 spec / PRD / rule / skill / agent / 业务代码**；对实现的只读观察（`tools/observation-check/{render,checks,registered-ids,data}.mjs`、`tools/docgen/policy/definitions/`、`scripts/check-all.mjs`）只进「来源 = 实现观察（补充）」的用例与 §8 建议表，**不得据此放宽或删掉任何 spec 推导用例**。
> **版本**：**v6.1**（2026-10-29；v6.1 = 组号校正 + `evidenceRequired` 不判项登记，见下一条增量。v6 内容 = **对齐 spec v6 的五处改判**：§8 `:226` M2 的 `path` 粒度 = 判定面（组表序号 1–8 在 `:230-237`）/ §7 `:180` `UnboundLanding` 第三档两形态 / §6 `:147` 码表值 = 判定面字段引用（不写行号）/ §3 `:47-48` 四入口 / §7 `:219` `FreeTextEnum`（`verdict` 面）→ `verdictAllowed` / `compareVerdicts`）｜**日期**：2026-10-29。
> **v6.1 增量说明（对 v6 的改动，逐条可核；**零增删用例、零改断言**，条数仍 58）**：① **组号校正 4 处**（一律按 spec §8 组表实文 `:230-237`：1 枚举字段 / 2 动作触发 / 3 判据文本 / 4 表达式结构 / 5 场景 / 6 信号定义 / 7 开放项 / 8 subject-label）——`本文件:1017` 组 6→**组 5**（场景组）、`本文件:402` 组 4→**组 3**（`InlineThreshold` 属判据文本组的四码之一）、`本文件:1242` 组 4→**组 3**（`InlineTermList` 同属该组）、`本文件:2250` 组 8→**组 7**（该行讲的是开放项三码）。② **登记一条「不判」开项**：PRD `:199` 的 `evidenceRequired: true`（`check:'ai'` 配套）由 spec §10-D22 `:281` 声明「本段不判（归 S4）」，落 **§7 缺口表 S1-G-23** + **§8 建议 #4 标「v6.1 已采纳（不判）」**；**不动任何断言**（K02 ①b 仍只断「挂上该字段也不得判红」）。③ **行号按 spec 现值（301 行）复核**：D22 落在 §10 末（`:281`，未改任何既有行）→ ≤`:281` 的锚点零位移（§8 组表仍 `:230-237`，`:225` / `:226` / `:239` / `:241` / §9 V-3 `:249` 不变）；**§11 起 +1**（11-2 `:287`→`:288`、11-3 `:288`→`:289`），本文件 3 处随之改（`:412` H06 / `:419` J03 / `:1847` J03 正文）。④ **计数未变**：58 / 正 14 / 负 22 / 边界 22（§9 B 段实测输出见下）。
> **v6 增量说明（对 v5 的改动，逐条可核；**只加断言、不增删用例**，条数仍 58）**：① **C01 组 5 / 组 8 改为按 spec `:226` 断「只返回先报那一个」**（M2 粒度 = 判定面，故三码各挂 `scenes[i].id` / `scenes[i].why` 不再推翻该断言），删掉原「须回流 spec（R4）」的注脚；组号一律按 v6 新序号 1–8（`:230-237`）；**C01 组 3 补两条构造**（`判据词[0]+判据词[1]+'少于 3 次'` → `['InlineThreshold']`；去掉「3 次」→ `['AmbiguousCriterion']`），组数仍 8；**组 6 注释写明「两码定义互斥，本组验的是必须读 `SEAT_SIGNALS`」**，全文「八组逐组双命中」改为「**7 组真双命中 + 组 6 误实现对位**」。② **E01 增探针**（`landing = 'review.dir'` 且 `review.dir ∈ unboundVars` → 红，§7 `:180` 第一形态）；**E07 增一格** `review.dir/x` → 绿（守「只对 `env.landings` 做子段逻辑」的误实现）。③ **B01 增值形态断言**（`CARD_MODEL_CODES` 每个值必须是字段引用形态、**不含 `:` 行号**；把某值写成 `:180` 即红，§6 `:147`）。④ **全文入口措辞统一为**「四入口」**（§3 `:47-48`；K04 标题 / 前置 / 覆盖 + B04 前置 + §0.2 / §1 / §3 汇总；K04 另加一条「`verdictAllowed` 不报卡级码」断言）。⑤ **I01 / I02 各增一条 `verdict` 含 `/` → `FreeTextEnum` 负例**（§7 `:219` 入口对照 + `:172` 触发条件）。⑥ **四个词表常量（`THRESHOLD_UNITS` / `PROC_WORDS` / `POINTER_WORDS` / `UNIT_KEY`）移进 §0.3 并从 spec 原文切**（不再与自身字面 `deepEqual`；判据 = 把 spec `:194` 的 `处→spots` 改成 `sites` 时 G05 ④ 必红）。⑦ **`pickSubject()` 过滤加 `validator` 在位**（§5 `:131` `SUBJECT_VALIDATORS` = `validator` 投影，无校验器的 subject 会让基线假红）。⑧ **行号按 v6 实文（300 行）重锚**：新增 1 行 `M2 的 path 粒度`（`:226`）+ 组表两行表头 → §8 整体 +2；§10 新增 D20 / D21（`:279-280`）→ §11 / §12 为 **+4**；≤ `:225` 的锚点逐条 Read 后确认未位移。
> **v5 增量说明（对 v4 的改动，逐条可核）**：① **八处 spec 改判逐条落进用例**——§8 重组 → **C01 八组按 §8 新表重建**（原「组 3 动作判据实现」组已删，新增「判据文本」与「subject / label 面」两组；组 5 场景为**真三码候选**，组 6 为**误实现对位**——见 v6 增量 ①）；§7 `:181` `CheckItem.criterion` 面 → **F03 ④ 改判 + ⑤ 新增「两处各报一次、互不抑制」**；§7 `:180` 最长已登记前缀 → **E01 / E07 加 `deliverable.body` / `deliverable.body/row` 绿 + `no.such.landing` 红**；§5 `:132` 最长前缀 + 归一 → **H02 / H04 加 `docs/superpowers/reviews/x/progress.md` → `process`（防 `docs/` 误吞）与反斜杠同值**；§6 `:147` / `:139` / `:153` / `:155` → **J02 合并码不入码表 + `validateCardModel` 不执行合并**、**K01 缺键 → `UnverifiableOutput`（path `env.<键>`）+ `registeredIds` 单源对账**、**K04 open-world 字段忽略**；§5 `:131` `SUBJECTS` 从 `index.mjs` 导出 → **A01 加 `M.SUBJECTS === SUB.SUBJECTS` 同引用断言**；§4.2 `:112` `SCAN_FIELDS` 键形态 → **G09 ⑨ 加「键数恰 8、逐码一项」**；§7 `:196` rubric 缺 `source` → **G04 第 ⑥ 形态**。② **新增 1 条用例**：**A05「词表全成员对账 + 单位 / 程序词 / 指针词逐条必红」**（读 PRD `:270` 与 `:202` 原文切词对账，补 `InlineThreshold` 七单位、程序词五词、指针词五词的全成员探针）。③ **删恒真**：B02 的 `rows.every((r) => r.code)` 删除；A01 的「有 label 才断」条件断言改为**按表无条件**断。④ **固定行号锚改内容锚**：H06 ⑤ 不再硬编码 `checks.mjs` 111–113，改为按内容定位 `MissingOpenField` 段。⑤ §9 三条 `node -e` 换成 PowerShell `Select-String` 形态（实测输出重跑）。⑥ 全文 `spec :行号` 按 **v5 实文（295 行）** 逐条重锚（273 处反引号锚点 + 13 处非反引号锚点）。
> **行号口径（本版起）**：全文 `spec :行号` 一律按 **spec v6 实文（300 行）** 逐条 Read 对过原文重锚；正文里的 `vN 已写死 / vN 已采纳` 与 `vN §x` 这类版本指针是**采纳轮次标签**（该口径在哪一版首写），**行号本身一律按 v6 核过**（同一口径在后续版本里若只换行不改字，标签仍留 vN、行号改成 v6 位置）。v6 的行号位移来源（逐条可核）：≤ `:225` 的锚点**零位移**（v6 只改了 `:47-48` / `:147` / `:180` 三处的**行内文字**，没增删行）；`## 8` 新增一行「M2 的 `path` 粒度」（`:226`）→ **原 §8 表头 `:226-227` → `:228-229`、组表 `:226-235` → `:230-237`、节末 `:237` → `:239`、`verdict` 面 `:239` → `:241`，即 §8 整段 +1~+2**；§9 随之 **+2**（V-2 `:246` → `:248`、V-3 `:247` → `:249`、V-6 `:250` → `:252`）；§10 加 D20 / D21（`:279-280`）→ **§10 内 +2**（D4 `:261` → `:263`、D5 `:262` → `:264`、D6 `:263` → `:265`、D7 `:264` → `:266`、D9 `:266` → `:268`、D14 `:271` → `:273`、D15 `:272` → `:274`、D16 `:273` → `:275`、D17 `:274` → `:276`、D18 `:275` → `:277`、D19 `:276` → `:278`），§11 与 §12 再叠 §10 的两行 → **+4**（11-2 `:283` → `:287`、11-3 `:284` → `:288`）。本文件**不含任何凭偏移推算的锚点**：每一处都按 v6 实文的内容定位后取行号。**（v6.1 追加：spec 加 §10-D22 `:281` 后 §11 / §12 整体再 +1 → 11-2 `:288`、11-3 `:289`，见 v6.1 增量 ③；上段映射的 `:287` / `:288` 只在 v6（300 行）成立。）**
> **v5 行号口径（历史，已被上一条取代）**：v5 曾按 295 行重锚（§5 `SUBJECTS` +2~+3 / §6 `:142` 与 `:153-155` +3~+9 / §7 表体 +8 / §8 表 `:223` / `:226-235` / §9 与 §10 整体后移）；**v6 起以最新一条为准**，上一条的 `:2xx` 映射只在 v5 文本成立。
> **v2 增量说明（对 v1 的改动，逐条可核）**：① 码数口径改按 spec v3 §7 `:164` 写死的 **36 = 35（PRD `:361` S1 组脚本码）+ 1（A 表 `:346` 的 `MissingCriterionImpl`）**，并把 `TABLE` / `S1_CODES` / `CARD_MODEL_CODES` **三方双向集相等**写成断言（B01 / I04），不再只在建议表里提；② `baseEnv()` 按 spec v3 §6 `:143-144` 补齐 **11 键**（新增 `seatSignals` / `subjects` / `registeredIds`，原「★ §6 未列出的键」注释删除）；③ `open` / `openEmptyReason` / `items[].verdict` 按 spec v3 §4 `:77-78` 归**产物侧** `ObservationDoc`，开放项三码改经 `validateOpenItems`、`DisagreementOpen` 改经 `compareVerdicts`、`SubjectMismatch` 按写死的 `verdictAllowed(subject, objectType, verdict)` 三位置参调用（K04 专测四入口分工——四入口口径见 v6 §3 `:47-48`）；④ `cmd?` / `impl?` 按 spec v3 §4 `:73-74` 收口（K02）；⑤ §8 第 4 组互斥按 spec v6 `:233` 升级为「先报 `UnreadableExpression`」（C01 组 4 + C03）；⑥ 新增 **K04「四入口各自只报自己那族码」**。
> **v3 增量说明（对 v2 的改动，逐条可核）**：① **两条 P0 从「登记缺口」改为「按 v3 新口径断言」**——`S1-G-4 余项②`（`OpenItem` 缺列归哪个码）→ spec v3 §7 `:208` 写死「归 S2 的 `MissingOpenField`，S1 只判三码」，落成新用例 **H06**（改 §7 该行状态为「已闭合」）；`S1-G-7 / S1-G-8`（卡面文本扫描面 + 三个判据文本码的判定面）→ spec v3 §4.1 `:94-99` / §4.2 `:101-112` 写死，落成新用例 **G09**（`SCAN_FIELDS` 边界八态）与 **F05**（两个 `criterion` 分形的假阳性 / 假阴性各一侧）；② 全文 `spec :行号` 按 **v3 实文（269 行）** 逐条重锚（242 处锚点 + 3 处区间锚点 + 1 处误锚修正）；③ **没删任何用例**（54 → 57 只增）；④ **没放宽任何判据**——三处新断言都把「spec 未写死 → 只断『恰一码』」换成 v3 已写死的**具体码 + 具体字段面**断言（收紧）。
> **v4 增量说明（对 v3 的改动，逐条可核）**：① **两条 P0 从「登记缺口」改为「按 v4 新口径断言」**（两条都是本文件上一轮 §7 缺口表登记的项）——`S1-G-16`（`MissingCriterionImpl` 的 `manual` 豁免在 `Action` 上无载体）→ spec v5 §7 `:181` 写死「**动作条目没有 `check` 字段 → 不适用 `manual` 豁免**；`manual` 豁免只对 `CheckItem` 生效（§4.1）」+ §10-D15 `:274`，落成 **F03 的 ④ 重写 + ⑤⑥ 新增对照断言**（豁免承载面 = `CheckItem.check === 'manual'`；`Action.criterion` 未登记且同卡有 manual 条目 → `Action` 仍必报；把 `manual` 写进 `Action` 的契约外 `check` 字段也不构成豁免）；`S1-G-17`（`HardcodedCount` 漏检全角 / 汉字数字）→ spec v5 §7 `:187` 写死「`N` 的字符面 = **半角 + 全角 + 汉字数字**」+ §10-D15 `:274`，落成 **G07 第 ④ 条**（`共３条` / `共三条` 必红，`rationale` 不进扫描面的豁免面保留）；② 全文 `spec :行号` 按 **v4 实文（当时 270 行）** 逐条重锚（**v5 又按 295 行再锚一次，以第 9 行的口径段为准**）（v4 的两处改动 = §7 两行内容替换 + §10 末新增 1 行；本文件无 `≥252` 的 spec 锚点，`spec v3` 的版本标签统一改为 `spec v5`，采纳轮次标签 `v3 已写死` 保留）；③ **没删任何用例**（57 → 57，不增不减，只在 F03 / G07 内部加断言）；④ **没放宽任何判据**——两处都把「spec 未写死 → 只登记缺口」换成 v4 已写死的**具体码 + 具体字符面**断言（收紧）。
> **未做两件事**：**只增不删**（53 → 54 → 57 → 57 → **58**：v1–v4 只增或不动，v5 净增 1 条 A05，**v6 只加断言、零增删**，B02 删的是**恒真断言**不是用例）；**没放宽任何判据**——本版所有改动均为收紧（C01 从「断至多一码」收紧为「断 §8 新表的先报码」，**v6 起按 §8 `:226` 的判定面粒度断「只返回先报那一个」，含组 5 / 组 8**；A01 从条件断言收紧为无条件断言；B01 从「值非空」收紧为「字段引用形态 + 不含行号」；I01 / I02 增 `FreeTextEnum` 探针；F03/E01/E07/H02/H04/G09/G04 全部改成 spec 已写死的**具体码 + 具体 path / 具体前缀**）。
> **命名与落点**：按 `rules/spec-testcase-gate.md` 判据 1 —— 与 spec 同目录；文件名 = spec 去 `.md` 后加 `-testcase.md`。**本文件该路径已由 spec v6 头部第 7 行外链指向**（spec 不内联用例）。
> **用例 ID 前缀**：统一 `S1-TC-`（与 S6 的 `S6-TC-` / S2 的 `S2-TC-` 区分）。
> **判据口径声明**：「判据」列一律是**可直接照抄执行的 `assert.*` 表达式**（含前置非空断言），或「命令 + 退出码 + 关键输出」；「功能正常」「符合预期」不算判据。每条标**来源**：`spec 推导` 或 `实现观察（补充）`。**「对应测试」列统一为 `tools/docgen/test/card-model.test.mjs`**（③ 段施工产出，本文件只定落点）。
> **禁三类失败形态（本仓 S6 审计刚打回的）**：① 恒真判据 → 每条断言前先断前置非空；② 判据互斥 → M1/M2 有专门用例（§1 的 C 组）；③ 缺第三人通道 → 第三方视角用例点名见 §4。

---

## 0 判据基线（读用例前先认这 9 条事实，全部可复核）

| # | 事实 | 出处（可复核） |
|---|---|---|
| 1 | `tools/docgen/card-model/` **当前不存在**（`Test-Path tools\docgen\card-model` → `False`，2026-10-29 实测），故 spec §3 的 12 个模块与本 testcase 的 1 个测试文件**全部由 ③ 段新建**；`tools/docgen/test/card-model.test.mjs` 同样不存在 | 目录清单；`Get-ChildItem tools\docgen\test -Filter *.test.mjs` → **26** 个，无 `card-model.test.mjs` |
| 2 | `npm run check` 的 ② 段用 `node --test '**/*.test.mjs'` **全仓 glob**（`maxBuffer` 64MB、回读 `# tests N` 防 glob 零匹配假绿），故新增测试文件自动入场，`package.json` **零改动**（对齐 spec §1 影响面） | `scripts/check-all.mjs`（行 87）、行 98–104 |
| 3 | S6 定义层现有 7 个文件：`artifacts.mjs` / `capabilities.mjs` / `commands.mjs` / `paths.mjs` / `seats.mjs` / `tiers.mjs`（在 `definitions/`）+ `seat-policy.mjs`——S1 与它们**零接触**（V-6 双向守卫的对照面） | `tools/docgen/policy/**/*.mjs` 清单（7 个） |
| 4 | 合并实现的第二份副本硬编码字段表 = `['trigger','text','criterion','landing']`（**缺 `kind`/`objects`，且多一个 `text`**）——spec §11-1 的登记属实；本段**不修** S2，只在 `OVERRIDABLE_FIELDS` 一侧断言正确集合 | `tools/observation-check/render.mjs`（行 39） |
| 5 | `registeredIds` 现为**手写常量** `['k01','k02','k03']`，文件头注释已写「S1 落地后切换」——V-8 只要求 `registeredIdsOf()` 可取，**不改该文件** | `tools/observation-check/registered-ids.mjs:5` |
| 6 | 仓库内存在**真实的、含「见」字而合法的**业务句：共用动作 `a05` 的 trigger = `遇意见冲突`；同时 `PREDICATES` / `LANDINGS`（真值如 `deliverable.body`）可作第三方素材 | `tools/observation-check/data.mjs:27`、`:14-20` |
| 7 | **码数口径已写死 = 36 个脚本码**（spec §7 `:164`，自 v3 起；v4 未改此口径）：36 = PRD §4.4 `:361` S1 组的 **35 个脚本码**（36 个名字里 `WeakReason` 是 manual）+ **复用 A 表 `:346` 的 `MissingCriterionImpl` 1 个**；另有 **3 个合并码**（A 表复用、不计入 36）与 **1 个 manual**（`WeakReason`、不进码表）。`CARD_MODEL_CODES` 是**唯一码表常量（36 键）** | spec `:164`（码数口径）/ `:47` + `:147`（`CARD_MODEL_CODES`）/ `:248`（V-2）；PRD `:361` / `:346` |
| 8 | spec §6 的 `env` 是 **11 键正式接口**：`seat` / `sharedScenes` / `seatScenes` / `seatSignals` / `predicates` / `landings` / `subjects` / `registeredIds` / `available` / `unboundVars` / `parliamentSeats`；**四个入口签名写死为 `validateCardModel(card, env)` / `validateOpenItems(doc, env, cards)`（第三参 `cards` 用于派生对账，v5 `:139`）/ `compareVerdicts(docA, docB, env)` / `verdictAllowed(subject, objectType, verdict)`**；缺任一 env 键 → `UnverifiableOutput`（`path = env.<键>`）并继续判（v5 `:153`） | spec `:137-144` / `:153` |
| 9 | **入口分工**（spec §6 `:158`）：卡片数据只走 `validateCardModel`；开放项与双实例只走另两个入口，**不合并成一个万能校验**。`open` / `openEmptyReason` / `items[].verdict` 属**产物侧** `ObservationDoc`（`:77-78`），**不属卡片数据**；**`mergeActions()` 是第五个独立调用，3 个合并码「不入 `CARD_MODEL_CODES`」，且 `validateCardModel` 不执行合并**（v5 `:142` / `:147` / `:218`） | spec `:77-78` / `:139-140` / `:147` / `:158` / `:218` |

### 0.1 覆盖账（8 张封闭表 / 36 码 / 8 组互斥 / 8 条验收）

| 项 | 数量 | 复算口径（机器可判） |
|---|---|---|
| 封闭枚举表 | **8** 张 | `Object.keys(T)` 逐表长度 = 8 / 8 / 4 / 5 / 3 / 3 / 5 / 2（V-1，A01） |
| 脚本码 | **36** = 35（PRD `:361` S1 组脚本码）+ 1（A 表 `:346` 复用 `MissingCriterionImpl`） | §0.4 `S1_CODES` 长度 = 36；`TABLE` 行数 = 36；`CARD_MODEL_CODES` 键数 = 36；**三方双向集相等**（B01） |
| manual 码 | **1**（`WeakReason`） | `S1_CODES` 不含它；`CARD_MODEL_CODES` 不含它（V-5，I04） |
| 合并码（**不计入 36**） | **3**（`DuplicateStatement` / `OverrideWithoutReason` / `PointlessOverride`） | `S1_CODES` 不含这三码 → 由 B01 的三方相等自动排除；J02 三码各一构造 |
| 判据互斥组 | **8** 组（M2，spec §8 序号 1–8 在 `:230-237`）+ 1 条不变量（M1，`:224`）+ **M2 的 `path` 粒度 = 判定面**（`:226`） | **7 组真双命中 + 组 6 误实现对位**（C01）：每组一构造，按 `:226` 的判定面粒度断言只返回该组最上方的码（不同下标 path 不推翻该断言）；**M2 只管同一判定面**（`:225`），跨判定面的多码共存由 F03 / C02 守 |
| 验收项 | **V-1～V-8** 共 8 条 | §1 末「验收对位」逐条列出承载用例 |
| 功能点 | **F-01～F-08** 共 8 条 | §1 末「F 对位」逐条列出正向用例（V-7） |

### 0.2 测试设计固定清单（逐条必答）

| # | 项 | 结论（落点） |
|---|---|---|
| 1 | **输入空间** | §4 的 4 个形状（`Card` / `Action` / `CheckItem` / `OpenItem`）+ 产物侧 `ObservationDoc`（`items` / `open` / `openEmptyReason`）× env **11 键** × 空/缺/白空格/类型错。用例覆盖：卡级面（`rationale` 缺 → B04 的 `MissingRationale` 行 / D01 / D04；混称 → G08 / G09；程序词 → G08 / A05；硬编码数量 → G07）；字段级 → B/E/F/G/H/I；产物侧 → H01–H06 / I01 / I02 / K03 / K04 |
| 2 | **状态与转移** | 校验器无状态（纯函数），「转移」退化为**调用次数**：两次调用结果相等（D01）、顺序稳定（D04）、异常后仍继续判（D03） |
| 3 | **失败面** | 36 码逐码 1 个最小红点（B02–B04）+ 每码 path 相符；跨码重叠 **8 组**（C01，spec §8 序号 1–8 = `:230-237`；**7 组真双命中 + 组 6 误实现对位**）+ 表达式族两码分工（C03）+ 四入口分工（K04） |
| 4 | **判据来源** | 只用 spec §4/§4.1/§4.2/§5/§6/§7/§8/§9/§10（v6，300 行）+ PRD §3.4–§3.8/§6；**字数、条数、码数一律现算**，不写死（A01 的 8 个数字除外，那是 V-1 明文） |
| 5 | **确定性** | 全部断言走 `assert.*` 常量比较；无时间、无随机、无 IO（唯一读盘是 J03/J05/J06 的静态扫描、A04/A05/G06/I04 的上游原文读取，与 H06 对 S2 `checks.mjs` 的**内容锚**对账） |
| 6 | **回归资产** | 新测试进全仓 `**/*.test.mjs` glob（事实 2）→ 自动回归；S2 三件（`render.mjs` 行 39 / `registered-ids.mjs` / `checks.mjs`）由 J03 / J05 / J06 的「零改动」断言守，`checks.mjs` 的缺列实现另由 H06 ⑤ **内容锚**守（不锁行号） |
| 7 | **判别力（各一样例）** | 假阳性：G06 `遇意见冲突`（真实句，含「见」但合法）+ E02 共用 8 场景未声明不判红 + H04 Windows 反斜杠 + **F05 `Action.criterion` 上的 3 词表词**（谓词 id 面不扫文本）+ **G09 `rationale` / `description` / `scenes[].why` 三处「不在扫描面」**；假阴性：C03 `{and:[{foo:[]}]}`（可读性与深度两码同 path）+ G07 `rationale` 里的「全部」+ **F05 同文本进 `CheckItem.criterion`** + **G09 `rationale` 里的「收卡」** + **E01 `deliverable.body/row`（最长前缀误写成「首段比较」即红）** |
| 8 | **盲点雷达** | env 11 键接口逐键对账 + 缺键归码（K01）、§4 v2 新列 `cmd?`/`impl?` 与产物侧 `ObservationDoc` 形状（K02）、证据可解析性不判（K03）、**四入口**各自只报自己那族码 + `validateCardModel` 不执行合并（K04）、`deriveScope` 反斜杠 + 最长前缀（H02 / H04）、`InlineThreshold` 单位→键映射（G05 / A05）、两个 `criterion` 的分形（§4.1 `:98-99` → F05）、`SCAN_FIELDS` 八键扫描面（§4.2 `:101-112` → G09）、开放项缺列归 S2（§7 `:208` → H06）、**`manual` 豁免的承载面只在 `CheckItem.check` 上（§7 `:181` + §10-D15 `:274` → F03 ④⑤⑥）**、**`HardcodedCount` 的 `N` 字符面含全角 / 汉字数字（§7 `:187` + §10-D15 `:274` → G07 ①②）**、**`CheckItem.criterion` 缺/空 → 同码（§7 `:181` → F03 ④⑤）**、**rubric 缺 `source` 归 `MissingAiAudit`（§7 `:196` + §10-D16 `:275` → G04 ⑥）**、**`SUBJECTS` 登记表的出口面（§5 `:131` → A01）**、**词表全成员（A05 读 PRD 原文切词）**、**M2 的 `path` 粒度 = 判定面（v6 §8 `:226` + §10-D20 `:279` → C01 组 5 / 组 8）**、**`UnboundLanding` 第三档两形态（v6 §7 `:180` + §10-D21 `:280` → E01 (e) / E07）**、**码表值 = 判定面字段引用、不写行号（v6 §6 `:147` → B01 ⑥）**、**`FreeTextEnum` 的 `verdict` 面归属（v6 §7 `:219` + §8 `:241` → I01 / I02）**、**四入口（v6 §3 `:47-48`）** |
| 9 | **覆盖账** | 58 条：正 14 / 负 22 / 边界 22 → 负+边界 44 ≥ 14；总 58 ≤ 80（§9 计数声明有可复算命令） |

### 0.3 共用 helper（在 `tools/docgen/test/card-model.test.mjs` 模块顶层声明一次，不得抄进各 `test()` 回调）

> 凡判据里出现的符号，本节或 §0.4 必有实现；**不存在「只有签名 + 注释」的 helper**。主语、词表、落点一律**从定义层派生**（不写死中文词，避免「词表改了测试还恒绿」）。

```js
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as M from '../card-model/index.mjs';            // 对外出口（spec §3 末行）
import * as EN from '../card-model/enums.mjs';
import * as LD from '../card-model/landings.mjs';
import * as SC from '../card-model/scenes.mjs';
import * as SIG from '../card-model/signals.mjs';        // spec v5 §3 `:40`：SEAT_SIGNALS 席局部登记表
import * as SUB from '../card-model/subjects.mjs';
import * as OI from '../card-model/open-items.mjs';
import * as EX from '../card-model/expression.mjs';
import * as MG from '../card-model/merge.mjs';
import * as ST from '../card-model/vocab/subjective-terms.mjs';
import * as CT from '../card-model/vocab/criterion-terms.mjs';

const CM_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'card-model');
const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');   // = 仓库根
const SEAT = 'detective-observer';   // 非议会席（ProceduralWordOutsideParliament 的对照面）
const PARL = 'reviewer-audit';       // 议会席（豁免面）
const ID = /^[a-z][a-z0-9.:-]*$/;

const codes = (r) => r.errors.map((e) => e.code);
const pathsOf = (r) => r.errors.map((e) => e.path);
const green = (r) => {
  assert.equal(r.ok, true, `应绿，实得 ${codes(r).join('|') || '(空)'}`);
  assert.deepEqual(r.errors, []);
};
const only = (r, code, path) => {
  assert.deepEqual(codes(r), [code], `只应报 ${code}，实得 ${codes(r).join('|') || '(空)'}`);
  if (path !== null && path !== undefined) assert.ok(String(pathsOf(r)[0] || '').startsWith(path), `path 应以 ${path} 开头，实得 ${pathsOf(r)[0]}`);
};

// 主语从定义层派生 + 前置非空（否则 MissingSubject 的「label 不含 display」会恒真）
// spec §5 `:131`：`SUBJECT_VALIDATORS` = `SUBJECTS` 的 `validator` 投影（供 `UnverifiableOutput` 判「有没有校验器」）
// → 只取「display 非空 **且** validator 在位」的 subject：无校验器的 subject 一进基线卡就报 UnverifiableOutput，基线绿会假红
const pickSubject = (i = 0) => {
  const ks = Object.keys(SUB.SUBJECTS)
    .filter((k) => SUB.SUBJECTS[k] && String(SUB.SUBJECTS[k].display || '').trim())
    .filter((k) => SUB.SUBJECT_VALIDATORS && SUB.SUBJECT_VALIDATORS[k] != null);
  assert.ok(ks.length > i, `SUBJECTS 至少需 ${i + 1} 项「display 非空 + validator 在位」（当前 ${ks.length}；§5 :131）`);
  return ks[i];
};
const DISPLAY0 = () => SUB.SUBJECTS[pickSubject(0)].display;

const baseEnv = (p = {}) => ({
  seat: SEAT,
  sharedScenes: M.SHARED_SCENES,
  seatScenes: { [SEAT]: [] },
  seatSignals: { [SEAT]: [] },                              // spec v5 §6 `:143` 的正式键（不再是「未列出的键」）
  predicates: new Set(['ledger.row.exists']),
  landings: new Set(['deliverable.body', 'ledger.round.reflect']),   // 真值见 data.mjs 的 14–20 行
  subjects: M.SUBJECTS,                                     // spec v5 §6 `:143` + §5 `:131`：SUBJECTS 由 index.mjs 导出
  registeredIds: M.registeredIdsOf([baseCard()]),           // spec v5 §6 `:143` + §4 `:90`：由派生得到（**单源**，v5 `:154`）
  available: new Set(['question-card.md']),
  unboundVars: new Set(),
  parliamentSeats: new Set([PARL]),
  ...p,
});
// spec v5 §6 `:143-144` 的 11 键（K01 双向对账用：既要逐键在位，也不许 ③ 段私自增键）
// K01 追加：缺任一键 → UnverifiableOutput（path `env.<键>`）并继续判（v5 §6 `:153`）
const ENV_KEYS = ['seat', 'sharedScenes', 'seatScenes', 'seatSignals', 'predicates', 'landings',
  'subjects', 'registeredIds', 'available', 'unboundVars', 'parliamentSeats'];

// 最小合法卡：A01–B05 的绿基线；任一字段被误改都应在某条用例里暴露
// 注意：**不含 `open` / `openEmptyReason`**——它们属产物侧 ObservationDoc（spec v5 §4 `:77-78`）
const baseCard = () => {
  const s = pickSubject(0);
  return {
    seat: SEAT, name: '侦探', description: '每轮答辩结束后开始观察',
    tools: ['Read', 'Glob', 'Grep'],
    duty: { trigger: '每轮答辩结束', categories: ['观察'], action: '给出观察记录', constraint: '只记录不裁决' },
    scenes: [{ id: 'issue.card' }],                       // 共用 id → label/why 可省
    signals: [{ type: 'event.arrive', observer: '轮初快照', match: '问题卡到达' }],
    must: [{
      id: 'observe', kind: 'must',
      trigger: { scene: 'issue.card', moment: 'start', repeat: 'once' },
      objects: ['question-card.md'], criterion: 'ledger.row.exists', landing: 'review.dir',
      requires: [{ id: 'question-card.md', kind: 'artifact', must: true }],
    }],
    never: [{
      id: 'no-verdict', kind: 'never',
      trigger: { scene: 'issue.card', moment: 'end', repeat: 'per-round' },
      objects: ['conclusion.md'], criterion: 'ledger.row.exists', landing: 'review.dir',
      requires: [],
    }],
    categories: [{ key: 'observe', label: '观察项' }],
    checkItems: [{
      id: 'k01', subject: s, label: `${SUB.SUBJECTS[s].display}观察表含证据行`,
      criterion: '观察表每行带路径与行号', check: 'manual', declarer: '侦探',
    }],
    rationale: '本席只核观察表，不改判结论。',
  };
};
const run = (mutate, envPatch) => {
  const c = baseCard();
  if (mutate) mutate(c);
  return M.validateCardModel(c, baseEnv(envPatch));
};
// 产物侧最小文档（spec v5 §4 `:77-78` 的 ObservationDoc；**不属卡片数据**）
const baseDoc = (p = {}) => ({
  items: [{ id: 'k01', verdict: 'hit' }],
  open: [], openEmptyReason: '本轮零补充项（已逐项比对固定项）',
  ...p,
});
const runDoc = (mutate, envPatch, cards) => {
  const d = baseDoc();
  if (mutate) mutate(d);
  // spec v5 §6 `:139`：validateOpenItems(doc, env, cards) —— **第三参 `cards` 必传**
  return M.validateOpenItems(d, baseEnv(envPatch), cards === undefined ? [baseCard()] : cards);
};
// 开放项五列齐的合法条目（scope 与 deriveScope 一致）；object 可替换
const openItem = (object = 'agents/detective-observer.md', scope = 'card') => ({
  category: '缺口', object, evidence: `${object}:12`, impact: '口径不一致', suggestion: '同批修订', scope,
});
const deepFreeze = (o) => {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o)) deepFreeze(v);
  }
  return o;
};

// ── 词表常量（v6 起移进本 helper 块）：**一律从 spec 原文切，不与自身字面 deepEqual** ──
// 来源：spec §7 `:194`（七单位→键映射）/ `:190`（程序词五）/ `:188`（指针词五）；本块只做「切」，判据在各用例。
// 为什么从原文切：常量与自身字面 `deepEqual` 是恒真自比（改 spec 不改常量 → 测试仍绿）。改 spec `:194` 的 `处→spots` → 派生值变 → G05 ④ 与实现比对必红。
const SPEC_LINES = readFileSync(join(REPO, 'docs', 'superpowers', 'specs', '2026-10-29-agent-card-s1-card-model-design.md'), 'utf8').split(/\r?\n/);
const specLine = (n) => {
  const l = SPEC_LINES[n - 1];
  assert.ok(typeof l === 'string' && l.length > 0, `spec :${n} 不得为空（spec 行号已漂移）`);
  return l;
};
const UNIT_KEY = Object.fromEntries([...specLine(194).matchAll(/([^`\s/：；]+)→`([a-z%]+)`/g)].map((m) => [m[1], m[2]]));
const THRESHOLD_UNITS = Object.keys(UNIT_KEY);
const cutList = (lineNo, from, to) => {
  const l = specLine(lineNo);
  const i = l.indexOf(from);
  assert.ok(i >= 0, `spec :${lineNo} 应含「${from}」，实得 ${l}`);
  const tail = l.slice(i + from.length);
  const j = to === null ? tail.length : tail.indexOf(to);
  assert.ok(j > 0, `spec :${lineNo} 的「${from}」之后应能找到终止串「${to}」，实得 ${tail}`);
  const words = tail.slice(0, j).split('/').map((x) => x.replace(/[`*]/g, '').trim()).filter(Boolean);
  assert.ok(words.length > 0, `spec :${lineNo} 不得切出空集（否则逐词探针恒真）`);
  return words;
};
const PROC_WORDS = cutList(190, '文本命中', ' |');     // 程序词五：收卡 / 丢卡 / 压卡 / 点名 / 判结束
const POINTER_WORDS = cutList(188, '命中', '（');      // 指针词五：见 / 详见 / 参见 / 参考 / 按 §
```

### 0.4 登记向量（36 码表驱动：一张 `TABLE`，一次写死、三处复用）

> **写法（V-2 的压缩手段）**：每码一行 `{ fam, code, path, kind, mutate | env | fn }`。`kind:'card'` 变异卡，`kind:'env'` 变异 env，`kind:'fn'` 直接调**非卡级入口**——按 spec v5 §6 `:137-142` 的四个入口：`validateOpenItems(doc, env, cards)`（开放项三码，**第三参 `cards` 必传**）/ `compareVerdicts(docA, docB, env)`（`DisagreementOpen`）/ `verdictAllowed(subject, objectType, verdict)`（`SubjectMismatch`），三者须返回 `{ok, errors[]}` 同形（`verdictAllowed` 的返回形状 **v5 已写死**：`:141`「同样返回 errors 形状，不是布尔」）；第五个调用 `mergeActions(shared, own)` 不属这四入口（`:142` / `:147`），故不在 `TABLE` 里（J02 专测）。`path` 是**前缀**（spec §6 `:157` 只给了三个 path 样例 `must[0].trigger` / `checkItems[2].audit` / `open[0].scope`，其余未写死 → 只判前缀，不判完整串）；`path:null` 表示 spec 未定义 path，本行只判码。

```js
const PRD_S1_CODES = [   // PRD §4.4 :361 的 35 个脚本码（原文顺序，去 WeakReason(manual)）
  'UnverifiableOutput', 'FalseScriptCheck', 'EmptyOpenWithoutReason', 'OutOfScopeOpenItem',
  'DuplicateAsOpen', 'MissingPrerequisite', 'UnboundLanding', 'SubjectMismatch',
  'AmbiguousCriterion', 'MissingAiAudit', 'DuplicateCheckItem', 'CrossSubjectSharedItem',
  'InlineTermList', 'InlineThreshold', 'PointerToElsewhere', 'ProceduralWordOutsideParliament',
  'MixedTermInCard', 'HardcodedCount', 'VagueReferent', 'SubjectiveLabel', 'MissingSubject',
  'UnreadableExpression', 'NestingTooDeep', 'MultiMomentInOneEntry', 'UnknownSignalType',
  'MissingSignal', 'UnobservableSignal', 'SignalProliferation', 'FreeTextEnum', 'DuplicateScene',
  'UnusedScene', 'ScenePromotionRequired', 'MissingSceneRationale', 'MissingRationale',
  'DisagreementOpen',
];
// spec v5 §7 `:166-204` 表 = 35 + MissingCriterionImpl（A 表 `:346` 复用，§10-D4）；口径由 §7 `:164` 写死
const S1_CODES = [...PRD_S1_CODES, 'MissingCriterionImpl'];
const MERGE_CODES = ['DuplicateStatement', 'OverrideWithoutReason', 'PointlessOverride'];   // §7 末：A 表复用，不计入 36
assert.equal(PRD_S1_CODES.length, 35, 'PRD :361 的脚本码必须是 35 个');
assert.equal(S1_CODES.length, 36, 'spec v5 §7 写死 36 = 35（PRD）+ 1（MissingCriterionImpl）');
assert.equal(S1_CODES.includes('WeakReason'), false, 'WeakReason 是 manual，不进脚本码表（spec :204 / V-5）');
for (const c of MERGE_CODES) assert.equal(S1_CODES.includes(c), false, `合并码 ${c} 不计入 36（spec :206）`);

const TABLE = [
  // ── 场景（5）
  { fam: '场景', code: 'DuplicateScene', path: 'scenes', kind: 'card',
    mutate: (c) => { c.scenes.push({ id: 'issue.card' }); } },
  { fam: '场景', code: 'ScenePromotionRequired', path: null, kind: 'env',
    env: { seatScenes: { [SEAT]: ['local.scene'], 'other-seat': ['local.scene'] } } },
  { fam: '场景', code: 'UnusedScene', path: 'scenes', kind: 'card',
    mutate: (c) => { c.scenes.push({ id: 'local.unused', label: '局部场景', why: '本席专用' }); } },
  { fam: '场景', code: 'MissingSceneRationale', path: 'scenes', kind: 'card',
    mutate: (c) => { c.scenes.push({ id: 'local.bare', label: '局部场景' }); } },
  { fam: '场景', code: 'FreeTextEnum', path: 'signals[0].type', kind: 'card',
    mutate: (c) => { c.signals[0].type = 'event.arrive/diff.hit'; } },
  // ── 信号（5）
  { fam: '信号', code: 'MissingSignal', path: 'must[0].trigger', kind: 'card',
    mutate: (c) => { delete c.must[0].trigger.repeat; } },
  { fam: '信号', code: 'UnknownSignalType', path: 'signals[0].type', kind: 'card',
    mutate: (c) => { c.signals[0].type = 'event.unknown'; } },
  { fam: '信号', code: 'UnobservableSignal', path: 'checkItems[0].declarer', kind: 'card',
    mutate: (c) => { delete c.checkItems[0].declarer; } },
  { fam: '信号', code: 'SignalProliferation', path: 'signals[0].type', kind: 'env',
    mutate: (c) => { c.signals[0].type = 'signal.local'; },
    env: { seatSignals: { [SEAT]: ['signal.local'] } } },
  { fam: '信号', code: 'MultiMomentInOneEntry', path: 'must[0].trigger', kind: 'card',
    mutate: (c) => { c.must[0].trigger.moment = '结束时之前'; } },
  // ── 动作（5）
  { fam: '动作', code: 'VagueReferent', path: 'must[0].objects', kind: 'card',
    mutate: (c) => { c.must[0].objects = ['上述']; } },
  { fam: '动作', code: 'MissingPrerequisite', path: 'must[0].requires', kind: 'env',
    env: { available: new Set([]) } },
  { fam: '动作', code: 'UnboundLanding', path: 'must[0].landing', kind: 'card',
    mutate: (c) => { c.must[0].landing = 'other.landing'; } },
  { fam: '动作', code: 'MissingCriterionImpl', path: 'must[0].criterion', kind: 'card',
    mutate: (c) => { delete c.must[0].criterion; } },
  { fam: '动作', code: 'FalseScriptCheck', path: 'checkItems[0]', kind: 'card',
    mutate: (c) => { c.checkItems[0].check = 'script'; delete c.checkItems[0].declarer; } },
  // ── 检查项（8）
  { fam: '检查项', code: 'MissingSubject', path: 'checkItems[0].subject', kind: 'card',
    mutate: (c) => { delete c.checkItems[0].subject; } },
  { fam: '检查项', code: 'DuplicateCheckItem', path: 'checkItems[1]', kind: 'card',
    mutate: (c) => { c.checkItems.push({ ...c.checkItems[0], id: 'k02' }); } },
  { fam: '检查项', code: 'CrossSubjectSharedItem', path: 'checkItems[1].id', kind: 'card',
    mutate: (c) => {
      const s1 = pickSubject(1);                            // 先断前置：需 ≥2 个带 display 的 subject
      c.checkItems.push({ ...c.checkItems[0], subject: s1, label: `${SUB.SUBJECTS[s1].display}观察表含证据行` });
    } },
  { fam: '检查项', code: 'SubjectiveLabel', path: 'checkItems[0].label', kind: 'card',
    mutate: (c) => {
      assert.ok(ST.subjectiveTerms.length > 0, 'subjective-terms 不得为空（否则本码判据恒绿）');
      c.checkItems[0].label = `${SUB.SUBJECTS[pickSubject(0)].display}、${ST.subjectiveTerms[0]}`;
    } },
  { fam: '检查项', code: 'HardcodedCount', path: null, kind: 'card',
    mutate: (c) => { c.duty.action = '给出共 3 条观察'; } },
  { fam: '检查项', code: 'PointerToElsewhere', path: null, kind: 'card',
    mutate: (c) => { c.duty.action = '给出观察记录（见 3）'; } },
  { fam: '检查项', code: 'MixedTermInCard', path: null, kind: 'card',
    mutate: (c) => { c.duty.action = '主持人调度时记录'; c.duty.constraint = '与议长口径一致'; } },
  { fam: '检查项', code: 'ProceduralWordOutsideParliament', path: null, kind: 'card',
    mutate: (c) => { c.duty.action = '收卡'; } },
  // ── 表达式（6）
  { fam: '表达式', code: 'UnreadableExpression', path: 'must[0].expr', kind: 'card',
    mutate: (c) => { c.must[0].expr = 'a && b'; } },
  { fam: '表达式', code: 'NestingTooDeep', path: 'must[0].expr', kind: 'card',
    mutate: (c) => { c.must[0].expr = { and: [{ or: [{ '==': [1, 1] }] }] }; } },
  { fam: '表达式', code: 'InlineTermList', path: 'checkItems[0].criterion', kind: 'card',
    mutate: (c) => {
      assert.ok(CT.criterionTerms.length >= 3, 'criterion-terms 至少 3 词才能构造本码（起步 6 词）');
      c.checkItems[0].criterion = `${CT.criterionTerms[0]}与${CT.criterionTerms[1]}且${CT.criterionTerms[2]}`;
    } },
  { fam: '表达式', code: 'InlineThreshold', path: 'checkItems[0].criterion', kind: 'card',
    mutate: (c) => { c.checkItems[0].criterion = '少于 3 次'; delete c.checkItems[0].params; } },
  { fam: '表达式', code: 'AmbiguousCriterion', path: 'checkItems[0].criterion', kind: 'card',
    mutate: (c) => {
      assert.ok(CT.criterionTerms.length >= 2, 'criterion-terms 至少 2 词才能构造本码');
      c.checkItems[0].criterion = `${CT.criterionTerms[0]}${CT.criterionTerms[1]}`;
      delete c.checkItems[0].definitions;
    } },
  { fam: '表达式', code: 'MissingAiAudit', path: 'checkItems[0].rubric', kind: 'card',
    mutate: (c) => {
      c.checkItems[0].check = 'ai';
      c.checkItems[0].rubric = { positive: [{ text: '有证据行', source: 'agents/detective-observer.md:12' }], negative: [], boundary: [] };
      c.checkItems[0].audit = { sample: '每轮每条 ≥1', command: 'node tools/docgen/cli.mjs gate' };
    } },
  // ── 开放项（3，fn 型：产物侧入口 validateOpenItems(doc, env, cards)，spec v5 §6 `:139`；第三参必传）
  { fam: '开放项', code: 'EmptyOpenWithoutReason', path: null, kind: 'fn',
    fn: () => M.validateOpenItems({ items: [{ id: 'k01', verdict: 'hit' }], open: [], openEmptyReason: '   ' }, baseEnv(), [baseCard()]) },
  { fam: '开放项', code: 'OutOfScopeOpenItem', path: 'open[0].scope', kind: 'fn',
    fn: () => M.validateOpenItems({ items: [{ id: 'k01', verdict: 'hit' }], open: [openItem('agents/detective-observer.md', 'code')] }, baseEnv(), [baseCard()]) },
  { fam: '开放项', code: 'DuplicateAsOpen', path: 'open[0].object', kind: 'fn',
    fn: () => M.validateOpenItems({ items: [{ id: 'k01', verdict: 'hit' }], open: [openItem('k01', 'repo')] }, baseEnv(), [baseCard()]) },
  // ── 三态（1，fn 型：verdictAllowed 三位置参，spec v5 §6 `:141`）
  { fam: '三态', code: 'SubjectMismatch', path: null, kind: 'fn',
    fn: () => SUB.verdictAllowed(pickSubject(0), 'artifact.report', 'hit') },
  // ── 审计（3）
  { fam: '审计', code: 'MissingRationale', path: 'rationale', kind: 'card',
    mutate: (c) => { c.rationale = '   '; } },
  { fam: '审计', code: 'DisagreementOpen', path: null, kind: 'fn',
    fn: () => M.compareVerdicts(                        // spec v5 §6 `:140` 写死的入口名
      { items: [{ id: 'k01', verdict: 'hit' }], open: [] },
      { items: [{ id: 'k01', verdict: 'miss' }], open: [] }, baseEnv()) },
  { fam: '审计', code: 'UnverifiableOutput', path: 'must[0].criterion', kind: 'env',
    mutate: (c) => { c.never = []; },                        // 只留一个判据入口，保证「只报一码」
    env: { predicates: (() => { const p = new Set(['ledger.row.exists']); p.has = () => { throw new Error('boom: predicates 不可用'); }; return p; })() } },
];

let EXECUTED = 0;
function execRow(row) {
  EXECUTED += 1;
  let r;
  if (row.kind === 'fn') r = row.fn();
  else {
    const c = baseCard();
    if (row.mutate) row.mutate(c);
    r = M.validateCardModel(c, baseEnv(row.env || {}));
  }
  assert.deepEqual(codes(r), [row.code], `${row.code}：应只报本码，实得 ${codes(r).join('|') || '(空)'}`);
  if (row.path !== null) assert.ok(String(pathsOf(r)[0] || '').startsWith(row.path), `${row.code}：path 应以 ${row.path} 开头，实得 ${pathsOf(r)[0]}`);
  return r;
}
const rowsOf = (...fams) => TABLE.filter((r) => fams.includes(r.fam));
```

---

## 1 覆盖总表

| 用例 ID | 覆盖的 spec 条目（§ / V / F） | 一句话场景 | 类型 | 层级 | 判据类型 | 执行方式 | 优先级 |
|---|---|---|---|---|---|---|---|
| S1-TC-A01 | V-1 / §5 / §3 单源 / §5 `:131` | 8 张表数量逐项 = 8/8/4/5/3/3/5/2，值全过 id 谓词，各表自 `index` 与各模块**同一引用**，且 `M.SUBJECTS === SUB.SUBJECTS`（v5 `:131` 登记表的唯一出口面） | 正 | 单元 | 机器 | `node --test tools/docgen/test/card-model.test.mjs` | P0 |
| S1-TC-A02 | V-1 / §5「无一开放口」/ §2-6 | 表内容逐项等于期望集合：塞一条「其他 / 等」即红；`REPEATS` / `VERDICTS` / `CHECK_KINDS` / `SCOPES` 只有 id 字面 | 负 | 单元 | 机器 | 同上 | P0 |
| S1-TC-A03 | V-1 / §5 id 谓词 | id 谓词 5 类变异（大写 / 下划线 / 中文 / 含 `/` / 空串）逐项判不过 | 负 | 单元 | 机器 | 同上 | P0 |
| S1-TC-A04 | §5 / PRD `:249-259` 逐字 | 8 个 scene label / 8 个 moment label / 5 个 signal label 与 PRD 原文逐字相等（第三方：上游原文） | 边界 | 静态 | 机器 | 读 PRD + 单元 | P0 |
| S1-TC-A05 | §7 `InlineThreshold` `:194` / `PointerToElsewhere` `:188` / `ProceduralWordOutsideParliament` `:190` / PRD `:270` + `:202` | **词表全成员对账**：PRD `:270`（主观词 5）/ `:202`（判据词 6）原文切词 → `deepEqual` 到 `vocab/*` 两数组；`InlineThreshold` **7 个单位**（次/条/字/个/轮/处/%）逐条必红；程序词 **5 个**逐条必红；指针词 **5 个**逐条必红；**单位 / 程序词 / 指针词三组一律从 spec `:194` / `:190` / `:188` 原文切（§0.3，不自比）** | 负 | 单元 + 静态 | 机器 | 同上 | P0 |
| S1-TC-B01 | V-2 / §7 `:164` 码数口径 / §6 `:147` 码表值形态 / 事实 7 | `TABLE` / `S1_CODES` / `CARD_MODEL_CODES` **三方双向集相等（36）**、无重复行、每行执行恰 1 次，删一行即红；`WeakReason` 与 3 个合并码不在三方任一集合；**每个值必须是字段引用形态且不含 `:` 行号**（写成 `:180` 即红，v6 §6 `:147`） | 边界 | 单元 | 机器 | 单元 | P0 |
| S1-TC-B02 | V-2 / §7 场景族+信号族 | 10 个码各一条最小红点（含 path 前缀） | 负 | 单元 | 机器 | 同上 | P0 |
| S1-TC-B03 | V-2 / §7 动作族+检查项族 | 13 个码各一条最小红点 | 负 | 单元 | 机器 | 同上 | P0 |
| S1-TC-B04 | V-2 / §7 表达式+开放项+三态+审计 | 13 个码各一条最小红点 | 负 | 单元 | 机器 | 同上 | P0 |
| S1-TC-B05 | §7 全族 / §4 | 最小合法卡 → `{ok:true, errors:[]}`（红点的对照绿基线） | 正 | 单元 | 机器 | 同上 | P0 |
| S1-TC-C01 | V-3 / §8 M2 **八组**（编号 1–8 在 `:230-237`）+ §8 `:226`（M2 的 `path` 粒度 = 判定面） | 每组一条「同时可命中 ≥2 码」构造 → **只返回该组最上方那一码**：组 1 `FreeTextEnum`、组 2 `MissingSignal`、组 3 `SubjectiveLabel`（另两构造断 `InlineThreshold` / `AmbiguousCriterion`）、组 4 `UnreadableExpression`、组 5 `DuplicateScene`、组 6 `SignalProliferation`（**误实现对位**，非真双命中）、组 7 `DuplicateAsOpen`、组 8 `UnverifiableOutput`；合计 **7 组真双命中 + 组 6 误实现对位** | 边界 | 单元 | 机器 | 同上 | P0 |
| S1-TC-C02 | V-3 / §6 path 形态 `:157` / §8 M1 `:224` | 全部构造 + 一张多问题卡：同一次返回内 path 唯一 | 边界 | 单元 | 机器 | 同上 | P0 |
| S1-TC-C03 | V-3 / §8 组 4 `:233` / §7 表达式族 `:191-192` | 表达式族两码分工：键非法 → 只报 `UnreadableExpression`；可读但深度 2 → 只报 `NestingTooDeep`；单层可读 → 绿 | 边界 | 单元 | 机器 | 同上 | P0 |
| S1-TC-D01 | V-4 / §6 纯函数 | 深冻结 card + env 后调用成功；两次调用结果 `deepEqual` | 正 | 单元 | 机器 | 同上 | P0 |
| S1-TC-D02 | V-4 / §6 不改入参 | 调用前后入参结构化快照逐字相等 | 正 | 单元 | 机器 | 同上 | P0 |
| S1-TC-D03 | V-4 / §6 异常纪律 | 注入抛异常的 `predicates` → `UnverifiableOutput` 且**其余条目仍被判定** | 边界 | 单元 | 机器 | 同上 | P0 |
| S1-TC-D04 | §6 顺序稳定 | 字段声明顺序不同的等价卡 → `errors` 顺序一致，且合 §6 固定序 | 边界 | 单元 | 机器 | 同上 | P0 |
| S1-TC-E01 | §7 `UnboundLanding` `:180` / §10-D18 `:277` / §10-D21 `:280` / §9 F-08 | landing **五个子面**各一例（缺 / **最长已登记前缀**无命中 / 登记值 + 子段绿 / 子段 ∈ `unboundVars` 红 / **命中的登记值本身 ∈ `unboundVars`** 红）；并写明「首段比较」实现会红在哪（`deliverable.body` 首段 `deliverable` ∉ 登记集 → 误报） | 负 | 单元 | 机器 | 同上 | P0 |
| S1-TC-E02 | §7 `UnusedScene` / §10-D5 | 共用 8 场景未声明不判红；本席声明未用必红 | 边界 | 单元 | 机器 | 同上 | P0 |
| S1-TC-E03 | §7 `MissingSceneRationale` / §4 | 共用 id 省 label/why 合法；局部 id `why` 去空白为空必红 | 边界 | 单元 | 机器 | 同上 | P0 |
| S1-TC-E04 | §7 `MultiMomentInOneEntry` | 单命中子串合法 / 双命中必红 / 数组长 1 合法 / 长 2 必红 | 边界 | 单元 | 机器 | 同上 | P0 |
| S1-TC-E05 | §7 `SignalProliferation` / §10-D6 / F-01 | 局部 type 被 2 个场景引用 → 绿；1 个 → 红（阈值 2） | 正 | 单元 | 机器 | 同上 | P0 |
| S1-TC-E06 | §7 `DuplicateScene` / `ScenePromotionRequired` | 同卡同 id 重复 / 共用 + 席局部双处 / 跨两席登记 | 负 | 单元 | 机器 | 同上 | P0 |
| S1-TC-E07 | §7 `UnboundLanding` 反面 `:180` / F-08 / §5 `LANDING_VARS` `:126` / §10-D18 `:277` / §10-D21 `:280` | `deliverable.body`（登记值）绿、`deliverable.body/row`（登记值 + 子段）绿、**`review.dir/x`（`LANDING_VARS` 登记值 + 子段）绿**、`no.such.landing` 红；「首段比较」与「整串相等」两种错误实现各红在哪逐条写明；**只对 `env.landings` 做子段逻辑**（漏 `LANDING_VARS`）的误实现红在 `review.dir/x` 这条 | 正 | 单元 | 机器 | 同上 | P0 |
| S1-TC-F01 | §7 `MissingPrerequisite` / F-02 | `must:true` 不在 `available` → 红且报文含「缺 X，未开始」；`must:false` 未满足 → 绿 | 负 | 单元 | 机器 | 同上 | P0 |
| S1-TC-F02 | §7 `VagueReferent` | 5 个模糊词逐个 + 缺 / 空 `objects` 全部必红 | 负 | 单元 | 机器 | 同上 | P0 |
| S1-TC-F03 | §7 `MissingCriterionImpl` `:181`（**v5 增设 `CheckItem` 面**）/ `FalseScriptCheck` `:182` / §10-D4 `:263` / **§10-D15 `:274`** / §8 末 `:239`（M2 只管同 path） | 两码分属不同实体（`Action.criterion` vs `CheckItem` 脚本入口）→ 同次返两码、path 各不相同；**`CheckItem.criterion` 缺/空也报同码（`check:'manual'` 豁免）**，两处各报一次、互不抑制；**manual 豁免只承在 `CheckItem.check` 上，`Action.criterion` 未登记一律红**（含「同卡有 manual 条目」「`Action` 上写契约外 `check:'manual'`」两个不豁免对照） | 负 | 单元 | 机器 | 同上 | P0 |
| S1-TC-F04 | F-02 / §4 动作六字段 / §7 `UnboundLanding` | 六字段齐 + `requires:[]` + landing ∈ 并集 → 绿 | 正 | 单元 | 机器 | 同上 | P0 |
| S1-TC-F05 | §4.1 `:94-99`（两个 `criterion` 分形）/ §7 `MissingCriterionImpl` `:181` / `InlineTermList` `:193` / §10-D13 | 3 个词表词文本放 `Action.criterion`（谓词 id 面）→ 只报 `MissingCriterionImpl`、**不报** `InlineTermList`；同文本放 `CheckItem.criterion` → 只报 `InlineTermList`；已登记谓词 id 两侧配齐 → 绿 | 边界 | 单元 | 机器 | 同上 | P0 |
| S1-TC-G01 | §7 `MissingSubject` | `subject` 缺 / `label` 不含 `display` 必红；含 `display` 则绿 | 负 | 单元 | 机器 | 同上 | P0 |
| S1-TC-G02 | §7 `DuplicateCheckItem` / `CrossSubjectSharedItem` | 同 subject + criterion 两次必红；同 id 两 subject 必红；同 id 同 subject 不报后者 | 负 | 单元 | 机器 | 同上 | P0 |
| S1-TC-G03 | §7 `SubjectiveLabel` / PRD `:270` | 起步 5 个主观词逐个 + 4 种分隔符（`、，/空格`）逐项必红 | 负 | 单元 | 机器 | 同上 | P0 |
| S1-TC-G04 | §7 `MissingAiAudit` `:196` / §10-D16 `:275` / PRD §3.4 `:194-200` + `:262` | rubric 三组各缺一组 / 任一条**值无 `path:line`** / 任一条**缺 `source` 键**（＝ PRD `:262` 的收口，§10-D16）/ `audit.sample` 缺 / `audit.command` 缺 → **6 形态必红且只报本码**；合法 ai 条目绿 | 负 | 单元 | 机器 | 同上 | P0 |
| S1-TC-G05 | §7 三码 / F-07 / §8 M2 组 3 / §7 `:194`（**单位→键映射七项**） | `criterion` 带 `definitions` + 数字进 `params` → 三码均不报（判据配齐的正向）；**七单位配齐逐个绿，且映射 `UNIT_KEY` 从 spec `:194` 原文切**（改为 `处→sites` 即红） | 正 | 单元 | 机器 | 同上 | P0 |
| S1-TC-G06 | §7 `PointerToElsewhere` / PRD §3.7 | 真实合法句「遇意见冲突」不判红（假阳性守卫）；「见 3」式指针必红 | 边界 | 单元 | 机器 | 同上 | P0 |
| S1-TC-G07 | §7 `HardcodedCount` `:187`（v4 收紧）/ **§10-D15 `:274`** / §4.2 `:107` | **五形态**（共 3 条 / 共３条 / 共三条 / 缺一项 / 全部命中）必红，全角与汉字形态在 `duty.constraint` / `CheckItem.label` 上也必红；`rationale` 里的「全部」「共３条」不判红（扫描面边界） | 边界 | 单元 | 机器 | 同上 | P0 |
| S1-TC-G08 | §7 `MixedTermInCard` / `ProceduralWordOutsideParliament` | 两词同卡必红；议会席（∈ `parliamentSeats`）同文本豁免 | 边界 | 单元 | 机器 | 同上 | P1 |
| S1-TC-G09 | §4.2 `:101-112`（`SCAN_FIELDS` 八键表 + `:112` **键形态写死**）/ §7 文本四码 `:187-190` / §10-D13 | 违规词塞进 `rationale` / `description` / `scenes[].why` → 该码**不响**；塞进 `duty.constraint` / `CheckItem.label` → **必响**；`rationale` 命中「收卡」「主持人」→ 两码**必响**（∪ `rationale` 那两行）；`SCAN_FIELDS` **键数恰 8、逐码一项**（不得合并成 4 组键）+「含不含 `rationale`」分界逐项对账 | 边界 | 单元 + 静态 | 机器 | 同上 | P0 |
| S1-TC-H01 | §7 `EmptyOpenWithoutReason` / F-06 / PRD §3.6 | `open` 空 + 理由缺 / 白空格 → 红；有理由 → 绿 | 负 | 单元 | 机器 | 同上 | P0 |
| S1-TC-H02 | §5 `deriveScope` `:132-133`（**顺序敏感最长前缀**）/ §7 `OutOfScopeOpenItem` `:198` / §10-D7 `:266` / §10-D17 `:276` | 7 段路径映射逐项；**重点两条守「最长前缀不被 `docs/` 误吞」**：`docs/superpowers/reviews/x/progress.md` → `process`（按首段会误判 `doc`）、`docs/superpowers/specs/x.md` → `doc` | 负 | 单元 | 机器 | 同上 | P0 |
| S1-TC-H03 | §7 `DuplicateAsOpen` `:199` / PRD `:253` / §4 `registeredIds` `:90` | `object` 逐字等于 `registeredIds` 成员 → 红 | 负 | 单元 | 机器 | 同上 | P0 |
| S1-TC-H04 | §5 `deriveScope` `:132`（**先反斜杠归一**）/ §10-D17 `:276` / PRD §4.3 第 1 道同源 | Windows 反斜杠路径按 `/` 归一后派生：`tools\\x.mjs` → `code`、`docs\\superpowers\\reviews\\x\\progress.md` → `process`、`docs\\superpowers\\specs\\x.md` → `doc`（与正斜杠形态**同值**） | 边界 | 单元 | 机器 | 同上 | P1 |
| S1-TC-H05 | F-06 / §4 `OpenItem` 五列 | 五列齐 + `scope` 与派生一致 → 绿（0 条与 N 条两形态合法） | 正 | 单元 | 机器 | 同上 | P0 |
| S1-TC-H06 | §7 末段 `:208`（开放项缺列归 S2）/ §10-D14 `:273` / §11-2 `:288` / PRD `:253` | 缺 `impact`（或缺 `suggestion`）的开放项在 **S1 侧不报任何码**（`MissingOpenField` 归 S2 `checks.mjs`）；空 `open` 无理由 / scope 不符 / 与 `registeredIds` 重名三码**仍各报**；`CARD_MODEL_CODES` 不含 `MissingOpenField`；S2 实现处按**内容锚**定位（不锁行号） | 边界 | 单元 + 静态 | 机器 | 同上 | P0 |
| S1-TC-I01 | §7 `SubjectMismatch` `:200` / §7 `FreeTextEnum` `:172`（`verdict` 面）/ §7 `:219`（入口对照）/ §8 `:241` / PRD §3.5 / F-05 | `verdictAllowed(subject, objectType, verdict)` 三位置参：`hit` / `miss` + 类型不符 → 红；`na` → 绿；`objectType` 缺省沿用 `subject` → 绿；**`verdict = 'hit/miss'`（含 `/`）→ 只报 `FreeTextEnum`**（v6 `:219` 把该面归本入口） | 负 | 单元 | 机器 | 同上 | P0 |
| S1-TC-I02 | §7 `DisagreementOpen` `:202` / §7 `FreeTextEnum` `:172`+`:219` / §6 `compareVerdicts` `:140` / PRD §3.4 双实例 | `compareVerdicts(docA, docB, env)`：同 id 两实例 verdict 不同 → 一条开放项；相同 → 无（不取多数、不改判）；**两实例同写 `verdict = 'hit/miss'`（含 `/`）→ 只报 `FreeTextEnum`、不得报 `DisagreementOpen`**（v6 `:219` / `:241`） | 负 | 单元 | 机器 | 同上 | P0 |
| S1-TC-I03 | §7 `UnverifiableOutput` / §6 | `subject` ∉ `SUBJECT_VALIDATORS` → 红（与 D03 的异常面分开记账） | 负 | 单元 | 机器 | 同上 | P0 |
| S1-TC-I04 | V-5 / §7 manual 行 / PRD `:216` | `CARD_MODEL_CODES` 不含 `WeakReason`；把它注入副本码表即红（第三方：PRD 原文） | 负 | 单元 | 机器 | 同上 | P0 |
| S1-TC-J01 | V-7 / F-01 / F-04 / §4 形状 | 全字段卡（局部 scene 带 label+why、三型 checkItem、categories、signals）→ 绿 | 正 | 单元 | 机器 | 同上 | P0 |
| S1-TC-J02 | F-03 / §7 合并族 `:206` / §10-D9 `:268` / §10-D19 `:278` / §6 `:147` | `OVERRIDABLE_FIELDS` 精确集合（含 `kind`/`objects`）+ 三合并码各一构造；**`mergeActions()` 返回 `{ok, errors}`**、三合并码**不在 `CARD_MODEL_CODES`**、且**含覆盖动作的卡经 `validateCardModel` 不返回任何合并码**（合并与四入口分离） | 正 | 单元 | 机器 | 同上 | P0 |
| S1-TC-J03 | V-8 / §11-3 `:289` / §6 `:154`（registeredIds 单源） | `registeredIdsOf()` = 入参全卡 `checkItems[].id` 并集且去重；`baseEnv().registeredIds` 与之**集合相等**（单源）；S2 的 `REGISTERED_IDS` 未被改 | 正 | 单元 + 静态 | 机器 | 同上 | P0 |
| S1-TC-J04 | V-8 边界 | 单卡 / 无 `checkItems` / 重复 id 三形态（空集为**期望值**，不是空集上 `every`） | 边界 | 单元 | 机器 | 同上 | P1 |
| S1-TC-J05 | V-6 正向 | `card-model/**` 无 `policy/` 引用，`policy/**` 无 `card-model` 引用（双向，前置两目录非空） | 正 | 静态 | 机器 | 同上 | P0 |
| S1-TC-J06 | §3 依赖方向 / §2-2 | `card-model/**` 只 import `node:` 标准库与自身，不 import `observation-check/**` / `components/**` | 正 | 静态 | 机器 | 同上 | P0 |
| S1-TC-K01 | §6 env **11 键**接口 `:143-144` / §6 缺键纪律 `:153` / §6 registeredIds 单源 `:154` / 事实 8 | `baseEnv()` 键集与 11 键双向相等；缺任一键 → **`UnverifiableOutput`（path `env.<键>`）且继续判**（不 fail-fast、不冒泡）；`env.registeredIds` ≠ `registeredIdsOf(cards)` → `UnverifiableOutput`（path `env.registeredIds`） | 边界 | 单元 | 机器 | 同上 | P0 |
| S1-TC-K02 | §4 v3 `CheckItem.cmd?`/`impl?` `:73-74` / §6 非卡片字段 `:155` / §4「形状不做」 | `script` 条目带 `cmd` 或 `impl` → 绿（v2 已列）；**`Card` 上出现本 spec 未列的字段 → 忽略不判（open-world）**；两者都缺 → 红 | 边界 | 单元 | 机器 | 同上 | P1 |
| S1-TC-K03 | §4「证据不判可解析性」`:89` / §2-1 | `open[].evidence` 写不可解析串 → 本段不报任何码（证据七道归 S2） | 边界 | 单元 | 机器 | 同上 | P1 |
| S1-TC-K04 | §6 入口分工 `:158` / §3 `:47-48`（**四入口**）/ §6 非卡片字段 `:155` / §4 `ObservationDoc` `:77-78` / 事实 9 | **四入口**各自只报自己那族码：卡上挂非卡片数据字段（含 `open` / `openEmptyReason` / 任意未列字段）**一律不判**；`validateOpenItems(doc, env, cards)` 不报卡级码；`compareVerdicts` 不报 `SubjectMismatch`；`verdictAllowed` 不报卡级码；`validateCardModel` **不返回任何合并码**（合并只走 `mergeActions`） | 边界 | 单元 | 机器 | 同上 | P0 |

**验收对位（V-1～V-8，逐项有承载用例）**

- **V-1**（8 表数量 + 无开放条目）→ A01 / A02 / A03 / A04。
- **V-2**（36 码各一条最小红点）→ B01（完备性）+ B02 / B03 / B04（逐码）+ B05（对照绿）+ **A05（词表 / 单位 / 程序词 / 指针词的**全成员**探针：36 码里那些「按词表命中」的码逐成员验一遍）**。
- **V-3**（M1 / M2）→ C01（**§8 八组（编号 1–8 = `:230-237`）+ `:226` 的判定面粒度**）/ C02（M1 全量）/ C03（表达式族两码分工）/ K04（**四入口**分工 + 合并分离：同一次调用内每入口只报自己那族码）。
- **V-4**（纯函数四点）→ D01（零 IO + 冻结可调用）/ D02（不改入参）/ D03（异常不中止）/ D04（顺序稳定）。
- **V-5**（`WeakReason` 不在脚本码表）→ I04。
- **V-6**（与 S6 双向零耦合）→ J05（双向扫描）/ J06（依赖方向）。
- **V-7**（F-01～F-08 各有正向）→ 见下「F 对位」。
- **V-8**（`registeredIdsOf()` 并集）→ J03（并集 + 单源对账）/ J04（边界）/ K01（`env.registeredIds` 与派生不一致时的归码）。

**F 对位（F-01～F-08 各有 ≥1 条正向用例）**

| F | 功能点 | 正向用例 |
|---|---|---|
| F-01 | 场景 / 信号模型 | J01（局部 scene + 5 类信号之一合法）、E05（局部信号被 2 场景引用合法） |
| F-02 | 动作五要素 | F04（六字段 + `requires:[]` + 枚举落点全合法） |
| F-03 | 同编号覆盖 | J02（`OVERRIDABLE_FIELDS` 含 `kind`/`objects`；覆盖带 reason 合法） |
| F-04 | 检查项两层 | J01（`categories` + 三型 `checkItems` 同时合法） |
| F-05 | 三态 + subject 匹配 | I01 的 `na` / `objectType` 缺省两个正向断言 |
| F-06 | 开放项五列 + 派生 scope | H05（五列齐 + scope 一致 → 绿） |
| F-07 | 判据表达式化 | G05（`definitions` + `params` 在位 → 三码不报） |
| F-08 | 落点枚举化 | E07（`landings` 已登记值 + `LANDING_VARS` 成员均绿） |

---

## 2 用例明细

### S1-TC-A01 8 张表数量逐项 + 值全过 id 谓词 + 各表同一引用

- **覆盖**：V-1 / spec §5（8 张表与数量）/ spec §3（定义层单源）/ spec §5 `:131`（`SUBJECTS` 由 `index.mjs` 导出）
- **来源**：spec 推导（spec v5 `:115-126` §5 表 / `:37-48` §3 定义层单源 / `:131` `SUBJECTS` 登记表）
- **前置**：`tools/docgen/card-model/enums.mjs`、`landings.mjs`、`scenes.mjs`、`subjects.mjs` 与 `index.mjs` 已落（③ 段产物）。
- **步骤**：① 从 `index` 一次取 8 张表；② 逐表断长度；③ **按表无条件**断取值形态（`id:label` 三表断「对象且 `label` 是非空字符串」、其余五表断「非空字符串」）；④ 断 `index.SHARED_SCENES === scenes.SHARED_SCENES`、`index.LANDING_VARS` 与 `landings.LANDING_VARS` 同值、**`index.SUBJECTS === subjects.SUBJECTS`（同一引用，v5 `:131`）**。
- **预期**：8 / 8 / 4 / 5 / 3 / 3 / 5 / 2；**38** 个取值全过 `^[a-z][a-z0-9.:-]*$`；spec §5 的 8 行里 **3 行是 `id:label`**（`SHARED_SCENES` / `MOMENTS` / `SIGNALS`）、**5 行只给 id 字面**（`REPEATS` / `VERDICTS` / `CHECK_KINDS` / `SCOPES` / `LANDING_VARS`）。
- **判据**：
  ```js
  const T = {
    SHARED_SCENES: M.SHARED_SCENES, MOMENTS: M.MOMENTS, REPEATS: M.REPEATS, SIGNALS: M.SIGNALS,
    VERDICTS: M.VERDICTS, CHECK_KINDS: M.CHECK_KINDS, SCOPES: M.SCOPES, LANDING_VARS: M.LANDING_VARS,
  };
  for (const [name, t] of Object.entries(T)) assert.ok(t && typeof t === 'object', `${name} 必须自 index 可达`);
  assert.deepEqual(Object.fromEntries(Object.entries(T).map(([k, v]) => [k, Object.keys(v).length])),
    { SHARED_SCENES: 8, MOMENTS: 8, REPEATS: 4, SIGNALS: 5, VERDICTS: 3, CHECK_KINDS: 3, SCOPES: 5, LANDING_VARS: 2 });
  // 形态断言**按表无条件**（v5 删掉原「有 label 才断」的条件分支：那条在无 label 的表上恒真）
  const LABELED = ['SHARED_SCENES', 'MOMENTS', 'SIGNALS'];                              // spec §5 的 `id:label` 三行
  const PLAIN = ['REPEATS', 'VERDICTS', 'CHECK_KINDS', 'SCOPES', 'LANDING_VARS'];        // spec §5 只给 id 字面的五行
  let checked = 0;
  for (const [name, t] of Object.entries(T)) {
    for (const [id, v] of Object.entries(t)) {
      assert.ok(ID.test(id), `${name}: id "${id}" 不符 ^[a-z][a-z0-9.:-]*$`);
      if (LABELED.includes(name)) {
        assert.equal(typeof v, 'object', `${name}.${id}: 该表是 id:label 形态（值若为字符串字面 → 说明 label 丢了）`);
        assert.equal(typeof v.label, 'string', `${name}.${id}.label 必须是字符串（typeof v.label 非 string 即红）`);
        assert.ok(v.label.trim(), `${name}.${id}: label 不得为空`);
      } else {
        assert.equal(typeof v, 'string', `${name}.${id}: 该表只给 id 字面（值若是对象 → 说明把 label 结构塞进来了）`);
        assert.ok(v.trim(), `${name}.${id}: 字面不得为空`);
      }
      checked += 1;
    }
  }
  assert.equal(checked, 38, `8 表取值合计应为 38（8+8+4+5+3+3+5+2），实得 ${checked}`);
  assert.equal(M.SHARED_SCENES, SC.SHARED_SCENES, 'SHARED_SCENES 必须同引用（定义层单源，不得两处各写一份）');
  assert.deepEqual({ ...M.LANDING_VARS }, { ...LD.LANDING_VARS }, 'LANDING_VARS 两处取值必须相等');
  // v5 §5 `:131`：SUBJECTS 是登记表（不是第 9 张封闭枚举），出口面 = index.mjs，与 subjects.mjs 必须同一引用
  assert.equal(M.SUBJECTS, SUB.SUBJECTS, 'SUBJECTS 必须由 index.mjs 导出且与 subjects.mjs 同引用（v5 :131）');
  assert.deepEqual(Object.keys(M.SUBJECTS).sort(), Object.keys(M.SUBJECT_VALIDATORS).sort(),
    'SUBJECTS 与 SUBJECT_VALIDATORS 必须是同一批 subject 键（validator 投影）');
  ```
- **红绿证据**：红 = 任一表增删一项（如 `MOMENTS` 加 `on-start`）→ 第 2 组断言红；红 = `REPEATS` 的某项写成 `{ label: 'once' }` → `PLAIN` 分支的 `typeof v === 'string'` 红（v5 起这是**无条件**断言，不再被「没有 label 就跳过」放过）；红 = `scenes.mjs` 另写一份 `SHARED_SCENES` → 引用不等；红 = `index` 未导出 `SUBJECTS`（或导出的是副本）→ 末两条红；绿 = 8 表如 spec §5 + `SUBJECTS` 同引用。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：表与 PRD `:249-264` 的逐字对账（A04）；表的扩展流程（§5「扩展规则」属流程，非代码）；`SUBJECTS` 的成员数（PRD `:293` 仍写省略号，见 §7 缺口 S1-G-12）。

### S1-TC-A02 表内容逐项等于期望集合（塞一条「其他」即红）

- **覆盖**：V-1 / spec §5「本 spec 不含『等』『其他』这类开放集」/ spec v5 §5 `:129`（两张席局部登记表本轮为空集）/ spec §2-6
- **来源**：spec 推导（spec v5 `:128` 扩展规则 + `:129` 登记表）
- **前置**：同 A01；`scenes.mjs` / `signals.mjs` 已落。
- **步骤**：① 逐表断「期望集合 == 实际集合」（期望集合按 spec §5 写死，顺序即表序）；② 断任一 label / id 不含 `等` / `其他` / `…`；③ 断两张席局部登记表 `SEAT_SCENES` / `SEAT_SIGNALS` **为空集**（v3 `:129` 写死「本轮两表为空集」）；④ 用浅拷贝演示「塞一条『其他』即红」（**不修改源表**）。
- **预期**：8 表集合逐项相等；开放词零命中；两登记表为空对象；副本注入后断言红。
- **判据**：
  ```js
  assert.deepEqual(Object.keys(M.SHARED_SCENES), ['session','parliament.round','issue.card','defense','deliverable','command','handoff','criterion']);
  assert.deepEqual(Object.keys(M.MOMENTS), ['start','end','before','after','during','on-fail','on-receive','on-change']);
  assert.deepEqual(Object.keys(M.REPEATS), ['once','per-round','per-item','per-change']);
  assert.deepEqual(Object.keys(M.SIGNALS), ['event.arrive','artifact.appear','state.transition','command.return','diff.hit']);
  assert.deepEqual(Object.keys(M.VERDICTS), ['hit','miss','na']);
  assert.deepEqual(Object.keys(M.CHECK_KINDS), ['script','ai','manual']);
  assert.deepEqual(Object.keys(M.SCOPES), ['card','code','doc','process','repo']);
  assert.deepEqual(Object.keys(M.LANDING_VARS), ['review.dir','round.no']);
  const OPEN_WORDS = /等|其他|…|\.\.\./;
  const allText = JSON.stringify(M.SHARED_SCENES) + JSON.stringify(M.MOMENTS) + JSON.stringify(M.REPEATS)
    + JSON.stringify(M.SIGNALS) + JSON.stringify(M.VERDICTS) + JSON.stringify(M.CHECK_KINDS)
    + JSON.stringify(M.SCOPES) + JSON.stringify(M.LANDING_VARS);
  assert.ok(!OPEN_WORDS.test(allText), `枚举表不得含开放词：${allText.match(OPEN_WORDS)?.[0]}`);
  assert.deepEqual({ ...SC.SEAT_SCENES }, {}, 'spec v5 :129：SEAT_SCENES 本轮必须是空集（内容由 S4 填）');
  assert.deepEqual({ ...SIG.SEAT_SIGNALS }, {}, 'spec v5 :129：SEAT_SIGNALS 本轮必须是空集（内容由 S4 填）');
  const tampered = { ...M.MOMENTS, other: { label: '其他' } };
  assert.notDeepEqual(Object.keys(tampered), Object.keys(M.MOMENTS), '副本注入「其他」后集合必须不等（本断言的用途 = 证明上式不是恒真）');
  ```
- **红绿证据**：红 = 把 `MOMENTS` 的 `on-fail` 改名 → 第 2 组红；红 = 任一 label 写「…等等」→ 开放词断言红；红 = ③ 段顺手给 `SEAT_SCENES` 填了某个席（越过 S4 职责）→ 登记表空集断言红；绿 = spec §5 原表 + 两空集。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：`SUBJECTS` / `SUBJECT_VALIDATORS` 的成员封闭性（v5 `:131` 明写「`SUBJECTS` 是**登记表**、不是第 9 张封闭枚举」，故成员数不由本段封闭；PRD `:293` 的省略号仍是 §7 缺口 S1-G-12 的余项。A01 只断「同引用 + 两投影键集相等」，K01 只测 env 缺键行为）。

### S1-TC-A03 id 谓词 5 类变异逐项判不过

- **覆盖**：V-1 / spec §5「id 谓词（全部表共用）」
- **来源**：spec 推导（spec v5 `:130`「id 谓词（全部表共用）」）
- **前置**：`enums.mjs` 导出 id 谓词（`ID_RE` 或等价导出）。
- **步骤**：正向 8 个合法 id；负向 5 个变异各判不过。
- **预期**：合法全过；5 个变异全不过。
- **判据**：
  ```js
  const RE = EN.ID_RE || EN.ID_PATTERN || ID;   // 定义层若未导出则退回本地同一正则（口径逐字相等，见用例尾断言）
  assert.ok(RE, '定义层必须提供 id 谓词（V-1 的唯一判据载体）');
  for (const ok of ['session','event.arrive','parliament.round','review.dir','on-fail','diff.hit','per-round','artifact.appear']) assert.ok(RE.test(ok), `${ok} 应合法`);
  for (const bad of ['Session','on_fail', '会议', 'event/arrive', '']) assert.ok(!RE.test(bad), `${bad} 应不合法`);
  assert.equal(RE.source, ID.source, '本地 ID 与定义层谓词必须同源同形（否则两处漂移）');
  ```
- **红绿证据**：红 = 谓词放宽为 `^[a-zA-Z]` → 第 2 组红；红 = 谓词写成 `^[a-z][a-z0-9.]*$`（去冒号）→ `event.arrive` 仍过但 `parliament.round` 过、`review.dir` 过——该变异由 A03 的 `on-fail`（连字符）判出；绿 = spec 原谓词。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：谓词对中文 label 的适用性（label 不走 id 谓词）。

### S1-TC-A04 8/8/5 个 label 与 PRD 原文逐字相等（第三方通道）

- **覆盖**：spec §5 `:119-122` / PRD §3.8 `:249`（scene）/ `:250`（moment）/ `:252`（signal）/ 独立性（非作者构造：原文本体即第三方）
- **来源**：spec 推导 + 上游原文对账
- **前置**：能读 `docs/prd/20261026205821-agent-card-contract.md`（**只读**）。
- **步骤**：① 读 PRD 的 `:249`（scene 行）、`:250`（moment 行）、`:252`（signal 行）；② 用 **`[、/]`** 切出中文 label 序列（PRD 原文用「 / 」分隔，**不是 `、`**——v1 只按 `、` 切会切出 1 个，本版已实测校正）；③ 与 8 个 scene label / 8 个 moment label / 5 个 signal label 逐字比较。
- **预期**：三组 label 逐字相等（顺序相同）。
- **判据**：
  ```js
  const prd = readFileSync(join(REPO, 'docs/prd/20261026205821-agent-card-contract.md'), 'utf8').split(/\r?\n/);
  const line = (n) => prd[n - 1];
  const cut = (s) => s.split('|')[2].trim().split('（')[0].split(/[、/]/).map((x) => x.replace(/\s+/g, '').trim()).filter(Boolean);
  const sceneLabels = cut(line(249));       // 会话 / 议会轮 / …
  const momentLabels = cut(line(250));      // 开始 / 结束 / …
  const signalLabels = cut(line(252));      // 事件到达 / …
  assert.equal(sceneLabels.length, 8, `PRD :249 应切出 8 个 scene label，实得 ${sceneLabels.length}`);
  assert.equal(momentLabels.length, 8, `PRD :250 应切出 8 个 moment label，实得 ${momentLabels.length}`);
  assert.equal(signalLabels.length, 5, `PRD :252 应切出 5 个 signal label，实得 ${signalLabels.length}`);
  assert.deepEqual(Object.values(M.SHARED_SCENES).map((v) => v.label), sceneLabels);
  assert.deepEqual(Object.values(M.MOMENTS).map((v) => v.label), momentLabels);
  assert.deepEqual(Object.values(M.SIGNALS).map((v) => v.label), signalLabels);
  ```
- **红绿证据**：红 = 表里把「议会轮」写成「议会」→ 第 5 组红；红 = PRD 改「期间」而表未同步 → 同红（这正是「上游改口径、定义层未回扫」的探针）；红 = 切分只认 `、`（v1 写法）→ 第 1 组绿不了（实测只得 1 项）；绿 = spec §5 与 PRD 现行文一致。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：label 措辞的「好不好」（语义判断，非本段）；`repeat` / `verdict` 等只有 id 的表（PRD 无中文 label 可对账）。

### S1-TC-A05 词表全成员对账 + 单位 / 程序词 / 指针词逐条必红

- **覆盖**：§7 `InlineThreshold` `:194`（**单位→键映射 7 个单位**）/ `PointerToElsewhere` `:188`（指针词 5）/ `ProceduralWordOutsideParliament` `:190`（程序词 5）/ §4.2 `:106`（三码只扫 `checkItems[].criterion`）/ §7 `SubjectiveLabel` `:186` + PRD `:270` / PRD `:202`（判据词 6）
- **来源**：spec 推导 + 上游原文对账（QA 第 1 轮点名的 P1：v1 只钉「起步 5 词 / 一个代表单位 / 一个代表程序词」，成员扩了测试仍绿）
- **前置**：`ST.subjectiveTerms` / `CT.criterionTerms` 已由 `vocab/*.mjs` 导出；PRD 文件可读（**只读**）；`baseCard().checkItems[0]` 是 `manual` 条目（改 `criterion` / `duty.action` 不会叠出其它码）。
- **步骤**：① 读 PRD `:270` 与 `:202` 原文，按 `（起步…词：…）` 切词；② `deepEqual` 到 `ST.subjectiveTerms` / `CT.criterionTerms`（**成员逐个对账，不是「长度 ≥5」**）；③ `InlineThreshold`：7 个单位（次 / 条 / 字 / 个 / 轮 / 处 / %）逐个写进 `criterion`、`params` 缺 → 逐条必红；④ 程序词 5 个（收卡 / 丢卡 / 压卡 / 点名 / 判结束）逐个写进 `duty.action` → 逐条必红；⑤ 指针词 5 个（见 / 详见 / 参见 / 参考 / 按 §）逐个写进 `duty.action` → 逐条必红。
- **预期**：① 两个数组与 PRD 原文逐字相等（5 个 / 6 个）；② 7 + 5 + 5 = **17 个构造全恰一码**，且码名与构造对应（不是「随便报一个码」）。
- **判据**：
  ```js
  const prd = readFileSync(join(REPO, 'docs/prd/20261026205821-agent-card-contract.md'), 'utf8').split(/\r?\n/);
  const cutVocab = (lineNo, label) => {
    const m = prd[lineNo - 1].match(new RegExp(label + '：(.+?)）'));
    assert.ok(m, `PRD :${lineNo} 应写「${label}：…」，实得 ${prd[lineNo - 1]}`);
    const w = m[1].split('/').map((x) => x.replace(/[*`]/g, '').trim()).filter(Boolean);
    assert.ok(w.length > 0, `PRD :${lineNo} 的 ${label} 不得切出空集（否则下面的 deepEqual 恒真）`);
    return w;
  };
  // ① 词表全成员对账（成员、顺序逐字相等；长度也断，防「塞一个词改绿」）
  const subWords = cutVocab(270, '起步词');            // 主观词：自省 / 客观 / 诚实 / 宽松 / 严格
  assert.equal(subWords.length, 5, `PRD :270 的起步主观词应为 5 个，实得 ${subWords.length}`);
  assert.deepEqual(ST.subjectiveTerms, subWords, `vocab/subjective-terms.mjs 必须与 PRD :270 逐字相等，实得 ${ST.subjectiveTerms}`);
  const critWords = cutVocab(202, '起步 6 词');        // 判据词：处置 / 依据 / 充分 / 合理 / 及时 / 适当
  assert.equal(critWords.length, 6, `PRD :202 的起步判据词应为 6 个，实得 ${critWords.length}`);
  assert.deepEqual(CT.criterionTerms, critWords, `vocab/criterion-terms.mjs 必须与 PRD :202 逐字相等，实得 ${CT.criterionTerms}`);
  // ② InlineThreshold：7 个单位**从 spec §7 `:194` 原文切**（§0.3 的 `UNIT_KEY` / `THRESHOLD_UNITS`），缺 params 逐条必红
  assert.ok(THRESHOLD_UNITS.length === 7, `前置：spec :194 应切出 7 个单位，实得 ${THRESHOLD_UNITS.length}（${THRESHOLD_UNITS.join('/')}）`);
  assert.ok(THRESHOLD_UNITS.includes('次'), '前置：`次` 必须在该单位表内（否则探针错位）');
  for (const u of THRESHOLD_UNITS) {
    only(run((c) => { c.checkItems[0].criterion = `少于 3 ${u} 即算通过`; delete c.checkItems[0].params; }), 'InlineThreshold', 'checkItems[0].criterion');
  }
  // ③ 程序词：从 spec §7 `:190` 原文切（§0.3 的 PROC_WORDS），逐条必红（非议会席 SEAT）
  assert.ok(PROC_WORDS.length === 5, `前置：spec :190 应切出 5 个程序词，实得 ${PROC_WORDS.length}（${PROC_WORDS.join('/')}）`);
  for (const w of PROC_WORDS) only(run((c) => { c.duty.action = `${w}并记录`; }), 'ProceduralWordOutsideParliament');
  // ④ 指针词：从 spec §7 `:188` 原文切（§0.3 的 POINTER_WORDS），逐条必红（散文只进 rationale，故卡文本面里的指针词必须报）
  assert.ok(POINTER_WORDS.length === 5, `前置：spec :188 应切出 5 个指针词，实得 ${POINTER_WORDS.length}（${POINTER_WORDS.join('/')}）`);
  for (const w of POINTER_WORDS) only(run((c) => { c.duty.action = `给出观察记录（${w} 3）`; }), 'PointerToElsewhere');
  ```
  （`THRESHOLD_UNITS` / `PROC_WORDS` / `POINTER_WORDS` / `UNIT_KEY` 四个常量**在 §0.3 顶层声明一次，且全部从 spec 原文切**——不再与自身字面 `deepEqual`（自比自恒真）。改 spec `:194` 的 `处→spots` 为 `sites` → `UNIT_KEY` 变 → G05 ④ 与实现比对必红。）
- **红绿证据**：红 = 词表把 PRD 的「诚实」改成「坦诚」而 PRD 未同批改 → ① 的 `deepEqual` 红（这正是「上游改口径、定义层未回扫」的探针，且是**逐成员**红，不是长度红）；红 = `InlineThreshold` 只认 `次`（映射表漏 `处` / `%`）→ ② 对应行实得 `(空)`；红 = 程序词只认「收卡」→ ③ 对应行绿；红 = 指针词按「裸 `见` 子串」匹配 → 「详见」「参见」两条仍红（子串命中），但把 `按 §` 漏掉 → 该行绿（本用例点名该形态）；绿 = 词表与 PRD 一致 + 三族全成员。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：词表的**语义判断**（哪些词该进表属 PRD 决策）；程序词 → 议会席的豁免面（G08 已钉）；`HardcodedCount` 的汉字数字穷举（G07 只钉代表值，S1-G-18 仍开）。

### S1-TC-B01 登记向量完备性：`TABLE` / `S1_CODES` / `CARD_MODEL_CODES` 三方相等 + 每行执行 1 次

- **覆盖**：V-2 / spec §7 `:164`（码数口径写死 36）/ §6 `:147`（`CARD_MODEL_CODES` 是唯一码表，**值 = 判定面字段引用、不写行号**）/ 事实 7
- **来源**：spec 推导（spec v6 §6 `:147`「键 = 码名、值 = 该码的**判定面字段引用**（如 `must[].criterion` / `checkItems[].label`，**不写行号**，故 spec 改版不漂移）」+ §10-D21 `:280`）
- **前置**：§0.4 的 `TABLE` 与 `S1_CODES` 在位；`CARD_MODEL_CODES` 已由 `index.mjs` 导出（spec §3 `:47-48` / §6 `:147`，V-5 的唯一载体）。
- **步骤**：① 行数与码集双向相等；② 无重复码；③ 逐行执行并计数；④ 删一行构造「不齐」自证判据非恒真；⑤ 断 `CARD_MODEL_CODES` 键数**恰 36** 且与 `S1_CODES` 双向相等，`WeakReason` 与 3 个合并码都不在其中；⑥ **断码表值形态 = 判定面字段引用**（v6）：每个值必须匹配字段引用形态（ASCII 标识符 + `.` / `[]`，如 `must[].criterion` / `checkItems[].label` / `SEAT_SCENES`），**且不含 `:`**（行号即 red）。
- **预期**：36 行 == 36 码 == 36 键；每行执行 1 次；36 个值全过形态断言；删掉 `UnusedScene` 行后码集不齐 → 断言红。
- **判据**：
  ```js
  assert.equal(TABLE.length, 36, `TABLE 行数应为 36，实得 ${TABLE.length}`);
  const tableCodes = TABLE.map((r) => r.code);
  assert.equal(new Set(tableCodes).size, tableCodes.length, `TABLE 有重复码：${tableCodes.filter((c, i) => tableCodes.indexOf(c) !== i)}`);
  assert.deepEqual([...tableCodes].sort(), [...S1_CODES].sort(), 'TABLE 码集必须与 §7 表的 36 码双向相等（缺一多一都红）');
  const keySet = Object.keys(M.CARD_MODEL_CODES);
  assert.equal(keySet.length, 36, `spec :147：CARD_MODEL_CODES 必须是 36 键，实得 ${keySet.length}`);
  assert.deepEqual([...keySet].sort(), [...S1_CODES].sort(), 'CARD_MODEL_CODES 键集必须与 §7 的 36 码双向相等（V-2 的唯一完备性判据）');
  assert.equal(keySet.length, tableCodes.length, 'TABLE / S1_CODES / CARD_MODEL_CODES 三方数量必须一致');
  for (const notCode of ['WeakReason', ...MERGE_CODES]) {
    assert.ok(!keySet.includes(notCode), `${notCode} 不得进脚本码表（V-5 / §7 末：manual 与合并码都不计入 36）`);
  }
  // ⑥ v6 §6 :147 值形态 = 判定面字段引用（不写行号）：ASCII 字段引用 + 不含 `:`
  const FIELD_REF = /^[A-Za-z_][A-Za-z0-9_.[\]-]*$/;      // must[] / checkItems[].label / SEAT_SCENES / checkItems 都过
  let shaped = 0;
  for (const [k, v] of Object.entries(M.CARD_MODEL_CODES)) {
    assert.equal(typeof v, 'string', `${k} 的值必须是字符串（§6 :147 值 = 判定面字段引用）`);
    assert.ok(v.trim().length > 0, `码表值不得为空（§6 :147），${k} 的值为 "${v}"`);
    assert.ok(!/[:：]/.test(v), `${k} 的值不得写行号（含 : / ：即违 §6 :147 / §10-D21），实得 "${v}"`);
    assert.ok(FIELD_REF.test(v.trim()), `${k} 的值必须是字段引用形态（如 must[].criterion），实得 "${v}"（散文 / 中文面名都不过，§6 :147）`);
    shaped += 1;
  }
  assert.equal(shaped, 36, `36 个值都必须过形态断言（禁止抽样），实得 ${shaped}`);
  // 非恒真自证：把任一值改成行号写法 → 形态断言必抛（副本不写回源码表）
  const tampered = { ...M.CARD_MODEL_CODES, UnusedScene: ':180' };
  assert.throws(() => {
    assert.ok(!/[:：]/.test(tampered.UnusedScene) && FIELD_REF.test(tampered.UnusedScene.trim()));
  }, '副本把 UnusedScene 写成 ":180" 时形态断言必红（证明上式不是恒真）');
  EXECUTED = 0;
  for (const row of TABLE) execRow(row);
  assert.equal(EXECUTED, TABLE.length, '每行必须执行恰 1 次（禁止抽样）');
  const broken = TABLE.filter((r) => r.code !== 'UnusedScene').map((r) => r.code);
  assert.notDeepEqual([...broken].sort(), [...S1_CODES].sort(), '删一行后码集必须不齐（本断言证明上式不是恒真）');
  ```
- **红绿证据**：红 = 施工漏一个码 → 第 3 组红；红 = 两行同码 → 第 2 组红；红 = `CARD_MODEL_CODES` 多收了一个合并码或 `WeakReason`（凑 37 键）→ 第 4/6 组红；红 = **某个值写成行号**（如 `UnusedScene: ':180'`）→ ⑥ 的「不含 `:`」断言红（v6 收紧点，正对 §6 `:147` / §10-D21）；红 = **值写成中文散文面**（如 `卡文本面（§4.2）`）→ ⑥ 的 `FIELD_REF` 断言红；红 = `CARD_MODEL_CODES` 未导出 → 抛 `TypeError`（该符号是 V-5 的唯一载体）；绿 = 36 行 / 36 码 / 36 键三方对齐 + 36 个值全是字段引用。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：码表值里的**每个值是否逐码指向正确字段**（只判形态与「不含行号」，不判内容对错——那要读 §7 判定面列逐行核，归议会审计）。

### S1-TC-B02 场景族 + 信号族 10 码最小红点

- **覆盖**：V-2 / spec §7（场景 5 码 + 信号 5 码）
- **来源**：spec 推导
- **前置**：§0.4 `TABLE` 在位。
- **步骤**：筛出 `fam ∈ {场景, 信号}` 的 10 行，逐行执行。
- **预期**：每行 `codes(r)` 恰为 `[该码]`，且路径以 `TABLE[i].path` 开头（`ScenePromotionRequired` 除外，spec 未定义其 path）。
- **判据**：
  ```js
  const rows = rowsOf('场景', '信号');
  assert.equal(rows.length, 10, `场景+信号应为 10 码，实得 ${rows.length}`);
  // 前置：每行的 code / mutate|fn 都必须是非空实体（否则 execRow 的「只报本码」会在空构造上恒真）
  assert.equal(rows.filter((r) => typeof r.code === 'string' && r.code.trim()).length, 10,
    '前置：10 行都必须带非空 code 字面（v5 删掉了原 `rows.every((r) => r.code)` 那句恒真断言——空行集上 every 恒真）');
  assert.equal(rows.filter((r) => typeof r.mutate === 'function' || typeof r.fn === 'function').length, 10,
    '前置：10 行都必须有 mutate 或 fn（没有构造就无从判红）');
  for (const row of rows) execRow(row);     // execRow 内含「只报本码」+ path 前缀断言
  ```
- **红绿证据**：红 = `UnknownSignalType` 被实现成「凡不在 `SIGNALS` 即红」而忽略 `SEAT_SIGNALS` → `SignalProliferation` 行会同时出两码 → execRow 红；红 = `MissingSignal` 未覆盖「缺 `repeat`」子面（只判缺 `scene`）→ 该行红；红 = 某行漏写 `mutate`/`fn`（只留 `code`）→ 第 3 组前置红（这是 v5 用来替换「`rows.every` 恒真」的那条断言）；绿 = 两族 10 码如 §7。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：`UnusedScene` / `MissingSceneRationale` 的边界形态（E02 / E03）。

### S1-TC-B03 动作族 + 检查项族 13 码最小红点

- **覆盖**：V-2 / spec §7（动作 5 码 + 检查项 8 码）
- **来源**：spec 推导
- **前置**：同 B02；`subjectiveTerms` / `criterionTerms` 非空（行内已断）。
- **步骤**：筛出 13 行逐行执行。
- **预期**：每行恰一码且 path 前缀相符（`HardcodedCount` / `PointerToElsewhere` / `MixedTermInCard` / `ProceduralWordOutsideParliament` 四行 spec 未定义 path → 只判码）。
- **判据**：
  ```js
  const rows = rowsOf('动作', '检查项');
  assert.equal(rows.length, 13, `动作+检查项应为 13 码，实得 ${rows.length}`);
  for (const row of rows) execRow(row);
  assert.equal(rows.filter((r) => r.path === null).length, 4, 'spec 未定义 path 的卡级文本码应为 4 个（写死数量防止日后偷改成 null 绕过 path 断言）');
  ```
- **红绿证据**：红 = `VagueReferent` 只判「`objects` 缺」不判模糊词 → 该行（`['上述']`）红；红 = `SubjectiveLabel` 只按空格切 → `、` 分隔的行红；绿 = 13 码如 §7。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：`MissingSubject` 的 label 派生细节（G01）、`MissingAiAudit` 的 6 形态（G04）。

### S1-TC-B04 表达式 + 开放项 + 三态 + 审计 13 码最小红点

- **覆盖**：V-2 / spec §7（表达式 6 + 开放项 3 + 三态 1 + 审计 3）
- **来源**：spec 推导
- **前置**：同 B02；**四入口**均已由 `index.mjs` 导出（spec §6 `:137-141`）。
- **步骤**：筛出 13 行逐行执行；`fn` 型行（开放项 3 + `SubjectMismatch` + `DisagreementOpen`）直接调对应入口。
- **预期**：每行恰一码。
- **判据**：
  ```js
  const rows = rowsOf('表达式', '开放项', '三态', '审计');
  assert.equal(rows.length, 13, `表达式+开放项+三态+审计应为 13 码，实得 ${rows.length}`);
  assert.equal(rows.filter((r) => r.kind === 'fn').length, 5,
    'fn 型行应为 5（开放项 3 + SubjectMismatch + DisagreementOpen），且都返回 {ok, errors[]} 同形');
  for (const row of rows) execRow(row);
  ```
- **红绿证据**：红 = `UnreadableExpression` 只判 `&&`/`||` 不判「对象节点键数 ≠ 1 或键 ∉ `ALLOWED_OPS`」→ C03 的第一组构造会暴露；红 = `MissingAiAudit` 只判 `audit` 缺不判 rubric 组数 → 该行红；红 = 开放项三码仍只由 `validateCardModel` 发出（入口分工未落）→ 三行 `fn` 调用直接抛/返回空 → 按 §6 `:158` 判红；绿 = 13 码如 §7。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：`DisagreementOpen` 的「两份产物成对」业务流程（产物侧归 S2/S3，本段只判判定函数）；`verdictAllowed` 的返回形状 **v5 已写死**（`:141`「同样返回 errors 形状，不是布尔」→ I01 直接断 `codes(r)`，本条不再登记为缺口）。

### S1-TC-B05 最小合法卡 → `{ok:true, errors:[]}`

- **覆盖**：spec §7 全族 / spec §4 形状 / 红点的对照绿基线
- **来源**：spec 推导
- **前置**：`baseCard()` 与 `baseEnv()` 在位；`SUBJECTS` 与 `criterionTerms` 非空。
- **步骤**：调用 `run()`（不变异），断绿；再断基线卡自身的前置（防止「空卡恒绿」）。
- **预期**：`ok === true`、`errors === []`；基线卡 6 段字段齐、2 个动作、1 个检查项。
- **判据**：
  ```js
  const c = baseCard();
  assert.ok(c.must.length > 0 && c.checkItems.length > 0 && Object.keys(c.duty).length > 0, '基线卡必须先非空（防止空对象恒绿）');
  assert.ok(String(SUB.SUBJECTS[c.checkItems[0].subject].display).trim(), '基线卡的 subject 必须有 display（否则 MissingSubject 恒真）');
  green(run());
  ```
- **红绿证据**：红 = 基线卡漏 `rationale` → 红（这说明基线卡本身受判据约束，不是「特意构造的免检样本」）；红 = 任一码的判据过宽（如把 `见` 加到基线卡 `duty.constraint` 会红）→ 这是**预期**：G06 的豁免只对「意见」形态成立；红 = 基线卡上挂 `open`（非卡片数据）**不该**让本用例红——那属 K04 的入口分工面，若这里红了说明 `validateCardModel` 越界判开放项。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：卡面文案质量（S4 渲染层）；产物侧 `open` 为空时的理由校验（归 H01 / K04）。

### S1-TC-C01 §8 八组逐组「多码候选构造」→ 只返回该组先报码（7 组真双命中 + 组 6 误实现对位）

- **覆盖**：V-3 / spec §8 M2 **八组**（编号 1–8 在 `:230-237`）/ spec §8 `:226`（**M2 的 `path` 粒度 = 判定面**）/ spec §8 `:225`（M2 只管同一 path）/ spec §8 `:239`（不同 path 多码共存属正常）/ spec §9 V-3（`:249`）
- **来源**：spec 推导（spec v6 §8 `:225-237`；**组序按 `:230-237` 的序号 1–8**：枚举字段取值 → 动作触发 → **判据文本（`checkItems[].criterion` 面，四码）** → 表达式结构 → **场景（三码）** → 信号定义 → 开放项 → **subject / label 面（`checkItems[].label`，三码）**；**判定面粒度**按 `:226`「同组内多个码落在同一判定面时按组序抑制」）
- **前置**：`TABLE` 与 helper 在位；`criterionTerms.length ≥ 3`、`subjectiveTerms.length ≥ 1`（行内已断）。
- **步骤**：逐组构造**同一判定面上可同时命中 ≥2 码**的输入（组 3 另补两条构造：两词 + 阈值 → `InlineThreshold`；两词无阈值 → `AmbiguousCriterion`），断言 `codes(r)` 恰为「§8 该组最上方的码」；另加一条反向断言（未登记的 `type` 只报 `UnknownSignalType`）守组 6 的顺序。**按 `:226` 的判定面粒度断，不看下标的差别**（组 5 三码同判定面 `scenes`、组 8 三码同判定面 `checkItems`）。
- **预期**：八组各只返回一个码，且是该组左列码：组 1 `FreeTextEnum`、组 2 `MissingSignal`、组 3 `SubjectiveLabel`（另两条构造 `InlineThreshold` / `AmbiguousCriterion`）、组 4 `UnreadableExpression`、组 5 `DuplicateScene`、组 6 `SignalProliferation`、组 7 `DuplicateAsOpen`、组 8 `UnverifiableOutput`。**计数口径 = 7 组真双命中（组 1/2/3/4/5/7/8）+ 组 6 误实现对位**（`spec :235` 已写明「两码定义互斥（前者 ∉ 席局部表、后者 ∈ 席局部表），本组防的是不读 `SEAT_SIGNALS` 的误实现」——故组 6 **不是**真双命中）。**原「组 3 动作判据实现」已从 §8 删除**（`:239` 写明 `MissingCriterionImpl` 与 `FalseScriptCheck` 分属两个实体、永不落在同一 path，故**不设组**；两码共存由 F03 ③⑤ 与 C02 守）。
- **判据**：
  ```js
  assert.ok(ST.subjectiveTerms.length >= 1, '前置：subjective-terms 至少 1 词（组 3 / 组 8 的构造依赖它，否则 SubjectiveLabel 判据恒真）');
  assert.ok(CT.criterionTerms.length >= 3, '前置：criterion-terms 至少 3 词（组 3 的 InlineTermList 候选依赖它）');
  const pairs = [
    // 组1 枚举字段取值（:230）：含 / 的串必然不在表内 → FreeTextEnum 先于 UnknownSignalType
    () => { const c = baseCard(); c.signals[0].type = 'event.arrive/diff.hit'; return M.validateCardModel(c, baseEnv()); },
    // 组2 动作触发（:231）：三键缺 → MissingSignal 先于 MultiMomentInOneEntry
    () => { const c = baseCard(); delete c.must[0].trigger.scene; c.must[0].trigger.moment = '结束时之前'; return M.validateCardModel(c, baseEnv()); },
    // 组3 判据文本（:232，checkItems[].criterion 面，四码）：主观词（空格分隔成独立项）+ 3 个判据词 + 数字阈值 + 无 definitions/params
    //   四码候选全成立（SubjectiveLabel / InlineTermList / InlineThreshold / AmbiguousCriterion），按 :232 顺序先报 SubjectiveLabel
    () => {
      const c = baseCard();
      c.checkItems[0].criterion = `${ST.subjectiveTerms[0]} ${CT.criterionTerms[0]}与${CT.criterionTerms[1]}且${CT.criterionTerms[2]} 少于 3 次`;
      delete c.checkItems[0].definitions;
      delete c.checkItems[0].params;
      return M.validateCardModel(c, baseEnv());
    },
    // 组4 表达式结构（:233）：键 foo ∉ ALLOWED_OPS 且深度 2 → 两码候选，先报「不可读」
    () => { const c = baseCard(); c.must[0].expr = { and: [{ foo: [] }] }; return M.validateCardModel(c, baseEnv()); },
    // 组5 场景（:234）：两条**局部** id、均无 why、均零引用 → DuplicateScene / MissingSceneRationale / UnusedScene 三码候选，先报 DuplicateScene
    () => { const c = baseCard(); c.scenes = [{ id: 'issue.card' }, { id: 'local.dup' }, { id: 'local.dup' }]; return M.validateCardModel(c, baseEnv()); },
    // 组6 信号定义（:235）：**两码定义互斥**（UnknownSignalType 要求 ∉ 席局部表、SignalProliferation 要求 ∈ 席局部表），
    //   故本组不是真双命中，而验「实现必须读 SEAT_SIGNALS」：type 是**已登记的席局部**类型且只被 1 个场景引用 → SignalProliferation；
    //   误实现把「不在 SIGNALS 即 Unknown」而不读 SEAT_SIGNALS → 同判定面出 UnknownSignalType（先报），本构造即探该误实现。
    () => { const c = baseCard(); c.signals[0].type = 'signal.local'; return M.validateCardModel(c, baseEnv({ seatSignals: { [SEAT]: ['signal.local'] } })); },
    // 组7 开放项（:236）：本不该是开放项（object === registeredIds 成员）+ scope 错 → 两码候选，先报 DuplicateAsOpen
    () => M.validateOpenItems({ items: [{ id: 'k01', verdict: 'hit' }], open: [openItem('k01', 'code')] }, baseEnv(), [baseCard()]),
    // 组8 subject / label 面（:237，checkItems[].label）：subject 未登记 + label 不含 display + label 命中主观词 → 三码候选，先报 UnverifiableOutput
    () => {
      const c = baseCard();
      c.checkItems[0].subject = 'artifact.not-registered';
      c.checkItems[0].label = ST.subjectiveTerms[0];
      return M.validateCardModel(c, baseEnv());
    },
  ];
  assert.equal(pairs.length, 8, '§8 必须是八组、逐组一构造（v6 :230-237）');
  const got = pairs.map((f) => codes(f()));
  assert.deepEqual(got[0], ['FreeTextEnum'], '组1：含 / 先于「不在表内」（v6 :230）');
  assert.deepEqual(got[1], ['MissingSignal'], '组2：三键缺时无从判多时刻（v6 :231）');
  assert.deepEqual(got[2], ['SubjectiveLabel'], '组3：判据文本四码按 v6 :232 的顺序，先报主观词');
  assert.deepEqual(got[3], ['UnreadableExpression'], '组4：不可读优先于过深（v6 :233）');
  assert.deepEqual(got[4], ['DuplicateScene'], '组5：三码候选（重复 / 缺 why / 零引用）先报「能否成为合法条目」（v6 :234；按 :226 的判定面粒度，不同下标不推翻）');
  assert.deepEqual(got[5], ['SignalProliferation'], '组6：已登记的席局部类型只被 1 场景引用 → 走 :235 的下半段（Unknown 不命中）');
  assert.deepEqual(got[6], ['DuplicateAsOpen'], '组7：先判「本不该是开放项」（v6 :236）');
  assert.deepEqual(got[7], ['UnverifiableOutput'], '组8：先判「这个 subject 有没有校验器」（v6 :237；同判定面 `checkItems`，按 :226 只返回先报那一个）');
  // 组3 的另两条相邻优先对（只补断言，不改组数）：InlineThreshold 先于 AmbiguousCriterion
  const g3Threshold = run((c) => {
    c.checkItems[0].criterion = `${CT.criterionTerms[0]}${CT.criterionTerms[1]}少于 3 次`;
    delete c.checkItems[0].definitions;
    delete c.checkItems[0].params;
  });
  assert.deepEqual(codes(g3Threshold), ['InlineThreshold'],
    `组3 相邻对①：2 词 + 阈值无 params → 先报 InlineThreshold（:232 顺序），实得 ${codes(g3Threshold).join('|') || '(空)'}`);
  assert.ok(String(pathsOf(g3Threshold)[0]).startsWith('checkItems[0].criterion'), '组3 相邻对① path 应落 checkItems[0].criterion');
  const g3Ambiguous = run((c) => {
    c.checkItems[0].criterion = `${CT.criterionTerms[0]}${CT.criterionTerms[1]}`;   // 去掉「3 次」→ 阈值候选不存在
    delete c.checkItems[0].definitions;
    delete c.checkItems[0].params;
  });
  assert.deepEqual(codes(g3Ambiguous), ['AmbiguousCriterion'],
    `组3 相邻对②：2 词无阈值无 definitions → 只报 AmbiguousCriterion（:232 末位），实得 ${codes(g3Ambiguous).join('|') || '(空)'}`);
  // 组6 的另一端（同组顺序的反向守卫）：未登记且不在任何表 → 只报 UnknownSignalType
  assert.deepEqual(codes(run((c) => { c.signals[0].type = 'signal.nowhere'; })),
    ['UnknownSignalType'], '组6 顺序：不在任何表优先于「局部新造」（v6 :235）');
  ```
- **红绿证据**：红 = 组1 实现先报 `UnknownSignalType` → `got[0]` 红；红 = 组3 先报 `InlineThreshold`（把阈值判在主观词之前）→ `got[2]` 红；红 = 组3 的 `SubjectiveLabel` 只认 `label` 不认 `criterion` 文本（§4.2 `:105` 三字段之一）→ `got[2]` 实得 `InlineTermList`；红 = 组3 的相邻对①吞掉了 `InlineThreshold`（把 2 词一律判 `AmbiguousCriterion`）→ `g3Threshold` 实得 `['AmbiguousCriterion']`；红 = 组3 的相邻对②把无阈值也判 `InlineThreshold` → `g3Ambiguous` 实得 `['InlineThreshold']`；红 = 组4 先报 `NestingTooDeep` → `got[3]` 红；红 = 组5 实现只判「同 id 重复」而不判 why/引用 → 该构造仍只出一码但**组 5 的三码候选前提未成立**（本用例的前置注释 + `got[4]` 只断先报码，不证明另两码存在——另两码由 B02 逐码钉）；红 = 组6 实现不读 `SEAT_SIGNALS` → 同判定面出 `UnknownSignalType`、`got[5]` 红；红 = 组8 先报 `MissingSubject` → `got[7]` 红；红 = **实现把三码各挂 `scenes[i]` 的不同子 path（`.id` / `.why`）导致同一次返回出 3 码** → `got[4]` 红——**这按 v6 §8 `:226` 就是实现违约**（M2 的粒度是判定面 `scenes`，不是完整定位串），须改实现，**不得**把断言放宽成「首码对就过」；绿 = v6 §8 `:230-237` 的组表 + `:226` 的判定面粒度。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：`MissingCriterionImpl` × `FalseScriptCheck` 的共存（§8 `:239` 已把它从组表移除，改由 **F03 ③⑤**（两 path 两头）+ **C02 ①**（M1 只判同 path）覆盖）；组 7 的第三码 `EmptyOpenWithoutReason` 与另两码天然不同时命中（`open` 非空时该码不可能触发），故只做两码候选；组 3 的第三/第四相邻对（`InlineTermList` × `InlineThreshold` 以外的组合）由 B03 的逐码红点守。

### S1-TC-C02 M1：同一次返回内 `path` 唯一

- **覆盖**：V-3 / spec §6 path 形态（`:157`）/ spec §8 M1（`:224`）
- **来源**：spec 推导（spec v5 `:157` / `:224`）
- **前置**：`TABLE` 在位。
- **步骤**：① 遍历 `TABLE` 全部 36 构造，断 `pathsOf(r)` 无重复；② 另造一张「多问题卡」（4 个不同 path），断 4 个 path 互不相同且 `errors.length === 4`。
- **预期**：任何一次返回里 path 集合大小 == errors 长度。
- **判据**：
  ```js
  for (const row of TABLE) {
    const r = row.kind === 'fn' ? row.fn() : (() => { const c = baseCard(); row.mutate?.(c); return M.validateCardModel(c, baseEnv(row.env || {})); })();
    const ps = pathsOf(r);
    assert.equal(new Set(ps).size, ps.length, `${row.code}：同 path 出现多码 → 违 M1（${ps.join(',')}）`);
  }
  const multi = run((c) => {
    c.rationale = '  ';
    c.scenes.push({ id: 'local.dead', label: '局部', why: 'x' });
    c.must[0].objects = ['上述'];
    c.checkItems[0].label = `${SUB.SUBJECTS[pickSubject(0)].display}、${ST.subjectiveTerms[0]}`;
  });
  assert.equal(multi.errors.length, 4, `多问题卡应报 4 条（不同 path 的多问题是正常多头），实得 ${codes(multi)}`);
  assert.equal(new Set(pathsOf(multi)).size, 4);
  ```
- **红绿证据**：红 = 某码发射时复用同一 path（如把 `MissingCriterionImpl` 与 `FalseScriptCheck` 都挂在 `checkItems[i]`）→ 第 1 组红；红 = 多问题卡被实现成「首错即停」→ 第 2 组 `errors.length` 断言红（首错即停同样违 §6「继续判后续条目」）；绿 = M1 成立。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：「不同 path 多码」算不算噪声（§8 末段已明确算正常）。

### S1-TC-C03 表达式族两码分工：不可读优先于过深（§8 组 4，`:233`）

- **覆盖**：V-3 / spec §8 **组 4**（`:233`，v5 重排后组号为 4）/ spec §7 `UnreadableExpression`（`:191`）与 `NestingTooDeep`（`:192`）
- **来源**：spec 推导（spec v5 `:233` 写死「先判是不是 JSON Logic，通过才判深度」）
- **前置**：表达式族两码均已实现（B04 已覆盖单码）。
- **步骤**：① 键非法且深度 2（`{and:[{foo:[]}]}`）→ 断言**只报** `UnreadableExpression`；② 全部键合法但深度 2（`{and:[{or:[…]}]}`）→ 断言**只报** `NestingTooDeep`；③ 单层合法表达式（`{and:[{[ALLOWED_OPS 成员]:[…]]}`）→ 绿。
- **预期**：① `['UnreadableExpression']`；② `['NestingTooDeep']`；③ 绿；三者的 path 均以 `must[0].expr` 开头。
- **判据**：
  ```js
  const only = run((c) => { c.must[0].expr = { and: [{ foo: [] }] }; });
  assert.deepEqual(codes(only), ['UnreadableExpression'], '不可读优先：同 path 至多一码且必须先报不可读（v3 :213）');
  assert.equal(pathsOf(only).length, 1, `M1：同 path 至多一码，实得 ${pathsOf(only).join('|')}`);
  assert.ok(String(pathsOf(only)[0]).startsWith('must[0].expr'));
  const deep = run((c) => { c.must[0].expr = { and: [{ or: [{ '==': [1, 1] }] }] }; });
  assert.deepEqual(codes(deep), ['NestingTooDeep'], '可读但算子嵌算子 → 只报过深，不得同时报不可读');
  const flatOp = Object.keys(EX.ALLOWED_OPS)[0];
  assert.ok(flatOp, '前置：ALLOWED_OPS 必须非空（否则第 3 组恒真）');
  green(run((c) => { c.must[0].expr = { [flatOp]: [{ var: 'x' }] }; }));
  ```
- **红绿证据**：红 = 实现把「深度」判在「可读性」之前 → ① 得 `['NestingTooDeep']` → 第 1 组红（v1 此处只断「至多一码」，v2 已收紧）；红 = 实现同时返回两码 → `codes` 长度 2 → 第 1/2 组红（违 M1）；红 = `ALLOWED_OPS` 未导出 → 第 3 组抛 `TypeError`；绿 = 组 4 的两端各只一码。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：`ALLOWED_OPS` 算子集的封闭性逐项（`ALLOWED_OPS` 不在 §5 的 8 张表内，spec 只说「JSON Logic 算子集」、未给封闭清单 → **未登记为缺口**，风险 = 算子集可无限扩；归议会测试评委记录）。

### S1-TC-D01 深冻结 card + env 后调用成功、两次结果相等

- **覆盖**：V-4 / spec §6「不改入参」「纯函数」「顺序稳定」
- **来源**：spec 推导（spec v5 `:149-159` 约束表；纯函数 `:151` / 顺序稳定 `:156`）
- **前置**：`deepFreeze` helper 在位。
- **步骤**：冻结卡与 env（含 `Set` 内的字符串），调用两次，比较结果。
- **预期**：不抛；`ok === true`；两次 `deepEqual`。
- **判据**：
  ```js
  const c = deepFreeze(baseCard());
  const e = deepFreeze(baseEnv());
  assert.ok(Object.isFrozen(c) && Object.isFrozen(c.must[0]) && Object.isFrozen(e), '前置：必须真的冻结到嵌套层');
  const r1 = M.validateCardModel(c, e);
  const r2 = M.validateCardModel(c, e);
  green(r1);
  assert.deepEqual(r1, r2, '纯函数：同输入两次结果必须逐字相等');
  const bad = deepFreeze((() => { const x = baseCard(); x.rationale = '  '; return x; })());
  assert.deepEqual(codes(M.validateCardModel(bad, e)), ['MissingRationale'], '冻结的非法卡也必须能判红（不得因冻结抛 TypeError）');
  ```
- **红绿证据**：红 = 实现往入参写回（如给 `card.must[0]` 挂 `_visited`）→ 严格模式下抛 `TypeError`（`Object.freeze` 生效）；红 = 实现用 `delete` / `sort` 改入参数组 → 同抛；绿 = 只读实现。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：深层 `Map` / `Set` 内容冻结（JS 无法冻结 Set 元素，K01 用缺键而非冻结测 env 健壮性）。

### S1-TC-D02 入参不被改写（调用前后快照逐字相等）

- **覆盖**：V-4 / spec §6「不改入参」
- **来源**：spec 推导
- **前置**：无。
- **步骤**：序列化快照 → 调用 → 再序列化，比较；同时对一张多问题卡重复。
- **预期**：两次快照逐字相等（含 `errors` 非空的那次）。
- **判据**：
  ```js
  const snap = (o) => JSON.stringify(o, (k, v) => (v instanceof Set ? [...v].sort() : v));
  const c = baseCard();
  const before = snap(c);
  const beforeEnv = snap(baseEnv());
  assert.deepEqual(codes(M.validateCardModel(c, baseEnv())), []);
  assert.equal(snap(c), before, '入参卡被改写');
  assert.equal(snap(baseEnv()), beforeEnv, '入参 env 被改写');
  const bad = baseCard();
  bad.must[0].objects = ['上述'];
  const b2 = snap(bad);
  assert.deepEqual(codes(M.validateCardModel(bad, baseEnv())), ['VagueReferent']);
  assert.equal(snap(bad), b2, '报错路径上同样不得改写入参');
  ```
- **红绿证据**：红 = 实现给 `objects` 做 `map` 后写回 → 第 1 组红；红 = 实现对 `env.available` 调 `delete` → 第 2 组红；绿 = 只读。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：`Object.freeze` 场景（D01）。

### S1-TC-D03 异常收敛为 `UnverifiableOutput` 且不中止后续判定

- **覆盖**：V-4 / spec §6 异常纪律（`:152`）/ PRD §4.2 `:321` 同源
- **来源**：spec 推导（spec v5 `:152`）
- **前置**：能注入 `Set` 子类实例（保持 `predicates` 是 Set 形，只让 `has` 抛）。
- **步骤**：① 只让判据入口抛（卡另有 `rationale` 空）→ 期望两条：`UnverifiableOutput` + `MissingRationale`；② 断言不抛到调用栈外（`assert.doesNotThrow`）；③ 断言报文首行 = 异常 message；④ **畸形入参**（`card` 非对象，v5 §6 `:153`「`card` / `doc` 非对象同此码」）→ 同样收敛为该码、不抛。
- **预期**：两个码并存 → 证明「异常后继续判」；`UnverifiableOutput` 的 `message` 含 `boom`；`card = null` 时也是该码。
- **判据**：
  ```js
  const throwing = new Set(['ledger.row.exists']);
  throwing.has = () => { throw new Error('boom: predicates 不可用'); };
  const c = baseCard();
  c.never = [];
  c.rationale = '   ';
  let r;
  assert.doesNotThrow(() => { r = M.validateCardModel(c, baseEnv({ predicates: throwing })); }, '异常不得冒泡中止');
  assert.deepEqual([...codes(r)].sort(), ['MissingRationale', 'UnverifiableOutput'], `应双码并存，实得 ${codes(r)}`);
  const u = r.errors.find((e) => e.code === 'UnverifiableOutput');
  assert.ok(String(u.message).includes('boom'), `message 应取异常首行，实得 ${u.message}`);
  // ④ 畸形入参：v5 §6 `:153` 写死「card / doc 非对象同此码」（原「卡级异常未定义」的缺口已闭合）
  for (const bad of [null, undefined, 'not-a-card', 42]) {
    let rb;
    assert.doesNotThrow(() => { rb = M.validateCardModel(bad, baseEnv()); }, `card=${String(bad)} 不得冒泡`);
    assert.deepEqual(codes(rb), ['UnverifiableOutput'], `card 非对象应只报 UnverifiableOutput，实得 ${codes(rb)}`);
  }
  ```
- **红绿证据**：红 = 无 try/catch → 第 2 组 `doesNotThrow` 红（整段崩掉）；红 = 捕获后 `return` 提前退出 → 第 3 组少了 `MissingRationale`；红 = `card` 为 `null` 时抛 `TypeError`（没做入参类型判定）→ 第 ④ 组 `doesNotThrow` 红；绿 = 收敛 + 继续 + 畸形入参同码。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：异常发生在「判定函数内部但不属 `env` 访问」的其它形态（spec `:152` 只写「任一判定内部抛异常」→ 本条以 `predicates.has` 一处代表）。

### S1-TC-D04 errors 顺序稳定且合 §6 固定序

- **覆盖**：spec §6「顺序稳定：卡级 → scenes → signals → must/never → checkItems」（`:156`；**v5 已把「→ 合并」从该序里删掉**——合并走独立调用 `mergeActions`，不产生 `errors` 顺序，见 `:147`）
- **来源**：spec 推导（spec v5 `:156`）
- **前置**：`baseEnv()` / `baseCard()` 在位；`ST.subjectiveTerms` 非空（行内已断）。
- **步骤**：构造一张四问题卡（卡级 rationale / scenes / must / checkItems 各一），断言码序列；再用「字段声明顺序打乱」的等价卡重跑，断言序列不变。
- **预期**：`['MissingRationale', 'UnusedScene', 'VagueReferent', 'SubjectiveLabel']`，两次一致。
- **判据**：
  ```js
  const mk = (reorder) => {
    const c = baseCard();
    c.rationale = '  ';
    c.scenes.push({ id: 'local.dead', label: '局部', why: 'x' });
    c.must[0].objects = ['上述'];
    c.checkItems[0].label = `${SUB.SUBJECTS[pickSubject(0)].display}、${ST.subjectiveTerms[0]}`;
    if (reorder) return { checkItems: c.checkItems, must: c.must, signals: c.signals, scenes: c.scenes, rationale: c.rationale, ...c };
    return c;
  };
  const order1 = codes(M.validateCardModel(mk(false), baseEnv()));
  const order2 = codes(M.validateCardModel(mk(true), baseEnv()));
  assert.equal(order1.length, 4, `应 4 条，实得 ${order1}`);
  assert.deepEqual(order1, ['MissingRationale', 'UnusedScene', 'VagueReferent', 'SubjectiveLabel'], `顺序不合 §6：${order1}`);
  assert.deepEqual(order2, order1, '字段声明顺序不得影响 errors 顺序');
  ```
- **红绿证据**：红 = 实现按遍历对象的键顺序出码 → `order2` 变（`checkItems` 挪到前面会先出 `SubjectiveLabel`）；红 = 卡级码在最后才发 → 第 3 组红；绿 = §6 固定序。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：同一段内多码的相对顺序（如 scenes 内部两码）——§6 只写段级序 + §8 组内序，两者已由 C01 覆盖组内部分。

### S1-TC-E01 `UnboundLanding` 五个子面（含最长已登记前缀 + 第三档两形态）

- **覆盖**：spec §7 `UnboundLanding`（`:180`，**最长已登记前缀 + `<登记值>/<子段>` + 第三档两形态**）/ §10-D18 `:277` / §10-D21 `:280` / F-08 / spec §6（`env.landings` 与 `env.unboundVars`）
- **来源**：spec 推导（spec v6 `:180`：`landing` 缺；**或** 按**最长已登记前缀**匹配（登记集 = `landings` ∪ `LANDING_VARS`，允许 `<登记值>/<子段>` 形态，**子段按 `/` 逐段判、任一段 ∈ `env.unboundVars` 即红**）后无命中；**或** 命中的**登记值本身** ∈ `env.unboundVars`（变量未赋值；`landing = 'review.dir'` 这一形态））
- **前置**：`baseEnv().landings` 含 `deliverable.body`；`LANDING_VARS` 含 `review.dir` / `round.no`（两形态各自可构造）。
- **步骤**：五构造：(a) `landing` 缺；(b) **最长已登记前缀无命中**（`no.such.landing`）；(c) 登记值 + 子段且子段**不在** `unboundVars` → 绿；(d) 命中登记值但**剩余子段** ∈ `unboundVars` → 红（第二形态）；(e) 命中的**登记值本身** ∈ `unboundVars`（`review.dir` 未赋值）→ 红（第一形态，v6 新增）。
- **预期**：四红一绿，path 均以 `must[0].landing` 开头。
- **判据**：
  ```js
  only(run((c) => { delete c.must[0].landing; }), 'UnboundLanding', 'must[0].landing');                    // (a) 缺
  only(run((c) => { c.must[0].landing = 'no.such.landing'; }), 'UnboundLanding', 'must[0].landing');      // (b) 最长前缀无命中
  green(run((c) => { c.must[0].landing = 'deliverable.body/row'; }));                                     // (c) 登记值 + 子段
  only(run((c) => { c.must[0].landing = 'deliverable.body/row'; }, { unboundVars: new Set(['row']) }),    // (d) 子段未赋值（按 / 逐段判）
    'UnboundLanding', 'must[0].landing');
  // (e) v6 §7 :180 第三档第一形态：命中的**登记值本身**未赋值（LANDING_VARS 的 'review.dir'）
  only(run((c) => { c.must[0].landing = 'review.dir'; }, { unboundVars: new Set(['review.dir']) }),
    'UnboundLanding', 'must[0].landing');                                                                 // (e) 变量本身未赋值
  assert.ok(Object.prototype.hasOwnProperty.call(LD.LANDING_VARS, 'review.dir'), '前置：`review.dir` 必须是 LANDING_VARS 的登记值（否则 (e) 构造不成立）');
  ```
- **红绿证据**：红 = 只实现「缺 / 不在并集」两子面 → (c) 绿不了（按整串比较会把合法值判红）或 (d) 绿（漏 `unboundVars`）；红 = **按「首段」比较**（`deliverable` 当作前缀）→ (c) 红（`deliverable` ∉ 登记集 → 合法值被误报，这正是 E07 第一条守的形态）；红 = 按「最短前缀」/首个命中（`LANDING_VARS` 先于 `landings` 导致 `deliverable.body` 判成别的）→ (c) 红；红 = **只判子段、漏判「登记值本身未赋值」**（v5 的第三档）→ (e) 实得 `(空)`；绿 = 最长前缀 + 子段余量 + `unboundVars` + 变量本身未赋值四面齐。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：`resolveLanding()` 的返回值形态（spec `:38` 只列函数名、未给返回值 → 未登记为缺口，风险低）。

### S1-TC-E02 `UnusedScene`：共用 8 场景未声明不判红

- **覆盖**：spec §7 `UnusedScene`（`:170`）/ §10-D5（`:264`）
- **来源**：spec 推导（spec v5 `:170` / `:264`）
- **前置**：`M.SHARED_SCENES` 恰 8 项（行内已断）；基线卡只声明 `issue.card`。
- **步骤**：① 基线卡（只声明 `issue.card`，另 7 个共用场景未声明）→ 绿；② 声明一个局部场景且无引用 → 红。
- **预期**：① 绿；② 一码。
- **判据**：
  ```js
  assert.ok(Object.keys(M.SHARED_SCENES).length === 8);
  const declared = baseCard().scenes.map((s) => s.id);
  assert.equal(declared.length, 1, '基线卡只声明 1 个共用场景（其余 7 个未声明 → 不得判红）');
  green(run());
  only(run((c) => { c.scenes.push({ id: 'local.dead', label: '局部', why: '本席专用' }); }), 'UnusedScene', 'scenes');
  ```
- **红绿证据**：红 = 实现把「未声明的共用场景」也算未用 → 第 2 组红（任何席都被迫声明全部 8 个，判据恒红）；绿 = D5 口径。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：共用场景「声明了但未用」是否该红（D5 只说共用未声明不判；声明了未用仍按 §7 判 → 该形态归 C01 **组 5**（场景组））。

### S1-TC-E03 `MissingSceneRationale`：共用可省两字段，局部 `why` 白空格必红

- **覆盖**：spec §7 `MissingSceneRationale`（`:171`）/ spec §4 `scene` 条目（`:83`）
- **来源**：spec 推导（spec v5 `:171` / `:83`）
- **前置**：`baseCard().scenes` 只有 1 个共用 id（可省 label/why 的正例面）。
- **步骤**：① 共用 id 只写 `{id}` → 绿；② 局部 id 补 `label` 但 `why = '   '` → 红。
- **预期**：① 绿；② 一码。
- **判据**：
  ```js
  green(run());
  only(run((c) => { c.scenes.push({ id: 'local.bare', label: '局部场景', why: '   ' }); }), 'MissingSceneRationale', 'scenes');
  green(run((c) => { c.scenes.push({ id: 'local.ok', label: '局部场景', why: '本席专用（议会外不判）' }); }));
  ```
- **红绿证据**：红 = 局部 id 缺 `label` 被当成 `MissingSceneRationale` → 第 3 条仍绿但语义错（`label` 缺失 spec 未给码 → §7 缺口 S1-G-4 的相邻项，本用例只用 `why` 判）；红 = `why` 用 `trim()` 后判空 → 第 2 条红得正确；绿 = 形态如 spec。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：缺 `label` 的归码（spec §4 `:83` 要求「局部 id 必须交两字段」，但只给 `why` 缺失配了码 → §7 缺口 S1-G-4 的相邻项）。

### S1-TC-E04 `MultiMomentInOneEntry` 的「子串命中」边界

- **覆盖**：spec §7 `MultiMomentInOneEntry`（`:177`，id 或 label 命中 ≥2 成员）
- **来源**：spec 推导（spec v5 `:177`）
- **前置**：`M.MOMENTS.end.label` 含「结束」、`M.MOMENTS.before.label` 含「之前」（行内已断）。
- **步骤**：四构造：单命中子串（`结束时`）/ 双命中（`结束时之前`）/ 数组长 1 / 数组长 2。
- **预期**：单命中与数组长 1 → 绿；双命中与长 2 → 一码。
- **判据**：
  ```js
  assert.ok(String(M.MOMENTS.end.label).includes('结束') && String(M.MOMENTS.before.label).includes('之前'));
  green(run((c) => { c.must[0].trigger.moment = M.MOMENTS.end.label; }));                       // 「结束」单命中
  only(run((c) => { c.must[0].trigger.moment = `${M.MOMENTS.end.label}${M.MOMENTS.before.label}`; }), 'MultiMomentInOneEntry', 'must[0].trigger');
  green(run((c) => { c.must[0].trigger.moment = ['start']; }));
  only(run((c) => { c.must[0].trigger.moment = ['start', 'end']; }), 'MultiMomentInOneEntry', 'must[0].trigger');
  ```
- **红绿证据**：红 = 实现按「整串等于某个 label」比较 → 第 2 条（拼接串）绿、第 2 组红不出来；红 = 实现不认数组 → 第 3/4 条红；绿 = 「子串命中计数 + 数组长度」双判。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：中文 label 与 id 混写（`on-fail` + `失败时`）的歧义（spec `:177` 只写「命中 ≥2 成员」，未定义 id/label 混写的计数口径 → **未登记为缺口**，风险低；本条只用 label 形态）。

### S1-TC-E05 `SignalProliferation` 阈值 2 的正向与反向

- **覆盖**：F-01 / spec §7 `SignalProliferation`（`:176`）/ §10-D6（`:265`）
- **来源**：spec 推导（spec v5 `:176` / `:265`）
- **前置**：`baseEnv().seatSignals` 可按席注入（spec v5 §6 `:143` 正式键）。
- **步骤**：① 登记局部 type `signal.local`，两个局部场景各被一个动作引用 → 绿；② 只被 1 个场景引用 → 红。
- **预期**：① 绿；② 一码。
- **判据**：
  ```js
  const twoScenes = (c) => {
    c.scenes.push({ id: 'local.a', label: '局部A', why: 'x' }, { id: 'local.b', label: '局部B', why: 'y' });
    c.signals[0].type = 'signal.local';
    c.must.push({ ...c.must[0], id: 'observe-b', trigger: { scene: 'local.b', moment: 'start', repeat: 'once' } });
    c.must[0].trigger.scene = 'local.a';
  };
  green(run(twoScenes, { seatSignals: { [SEAT]: ['signal.local'] } }));
  only(run((c) => { c.signals[0].type = 'signal.local'; }, { seatSignals: { [SEAT]: ['signal.local'] } }), 'SignalProliferation', 'signals[0].type');
  ```
- **红绿证据**：红 = 阈值写成「> 1 个引用才合法」的取反（即被 2 个引用仍红）→ 第 2 组红；红 = 不读 `env.seatSignals`（spec v5 §6 `:143` 已把它列为正式键，缺它即实现违约）→ 第 1 组就被 `UnknownSignalType` 顶掉；绿 = D6 口径。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：「同一场景被两个动作引用」算 1 还是 2（spec `:176` 写「scene 数」但未给计数口径 → **未登记为缺口**，风险低；本用例只构造 distinct 场景）。

### S1-TC-E06 `DuplicateScene` 两子面 + `ScenePromotionRequired`

- **覆盖**：spec §7 `DuplicateScene`（`:168`）/ `ScenePromotionRequired`（`:169`）
- **来源**：spec 推导（spec v5 `:168-169`）
- **前置**：`baseEnv()` 的 `seatScenes` 默认 `{ [SEAT]: [] }`（本席空登记表）。
- **步骤**：① 同卡同 id 出现两次 → 红；② 共用 id 又出现在 `SEAT_SCENES[seat]` → 红；③ 同一局部 id 出现在 2 个席登记表 → 红。
- **预期**：三构造各自一码。
- **判据**：
  ```js
  only(run((c) => { c.scenes = [{ id: 'issue.card' }, { id: 'issue.card' }]; }), 'DuplicateScene', 'scenes');
  only(run((c) => {}, { seatScenes: { [SEAT]: ['issue.card'] } }), 'DuplicateScene');
  only(run((c) => {}, { seatScenes: { [SEAT]: ['local.scene'], 'other-seat': ['local.scene'] } }), 'ScenePromotionRequired');
  green(run((c) => {}, { seatScenes: { [SEAT]: ['local.mine'] } }));
  ```
- **红绿证据**：红 = 只判「卡内重复」不判「共用 + 席局部双处」→ 第 2 条绿；红 = `ScenePromotionRequired` 只看本席 → 第 3 条绿；绿 = 三子面齐。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：`ScenePromotionRequired` 的 path（spec 未定义 → TABLE 中该行为 `path:null`）。

### S1-TC-E07 落点正向：`landings` 已登记值 + `LANDING_VARS` 成员均绿

- **覆盖**：F-08 / spec §5 `LANDING_VARS` 封闭 2 项（`:126`）/ spec §7 `UnboundLanding` 的反面（`:180`，最长已登记前缀 + 子段）/ §10-D18 `:277` / §10-D21 `:280`
- **来源**：spec 推导 + 真实取值（`data.mjs` 行 14–20）
- **前置**：`baseEnv().landings` 含真实取值 `deliverable.body`；`LANDING_VARS` 恰 2 项。
- **步骤**：landing 取六形态：`deliverable.body`（`env.landings` 成员）、`deliverable.body/row`（**登记值 + 子段**）、`review.dir` / `round.no`（`LANDING_VARS` 成员）、**`review.dir/x`（`LANDING_VARS` 登记值 + 子段）** → 均绿；`no.such.landing`（最长已登记前缀无命中）→ 红。
- **预期**：五绿一红。
- **判据**：
  ```js
  assert.ok(Object.keys(LD.LANDING_VARS).length === 2, 'LANDING_VARS 必须恰两项（封闭，C-13）');
  for (const landing of ['deliverable.body', 'deliverable.body/row', 'review.dir', 'round.no', 'review.dir/x']) {
    green(run((c) => { c.must[0].landing = landing; c.never[0].landing = landing; }));
  }
  only(run((c) => { c.must[0].landing = 'no.such.landing'; }), 'UnboundLanding', 'must[0].landing');
  ```
- **红绿证据**：红 = 把 `landings` 当真值表却漏 `deliverable.body` → 第 1 条红（说明基线的 `env.landings` 是真实取值，不是空集）；红 = `LANDING_VARS` 扩成 3 项 → 第 1 组首个断言红（封闭性守卫）；红 = **「首段比较」实现**（取 `deliverable` 当首段去查 `landings ∪ LANDING_VARS`）→ **第 1 条 `deliverable.body` 就红**（登记值本身是多点串，首段 `deliverable` 不在登记集）；红 = **「整串相等」实现**（把 `landing` 整串拿去与登记集比）→ **第 2 条 `deliverable.body/row` 与第 5 条 `review.dir/x` 红**（多出的子段让整串不等）；红 = **「只对 `env.landings` 做子段逻辑」实现**（`LANDING_VARS` 的登记值只按整串比）→ **第 5 条 `review.dir/x` 红**（v6 新增这格正是守该误实现）；绿 = 最长前缀命中 + 子段余量合法（登记集 = `landings` ∪ `LANDING_VARS` 两侧同一套逻辑）。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：子段 ∈ `unboundVars` 的反面（E01 的 (d) 子面）；`resolveLanding()` 的返回值形态（spec `:38` 只列函数名）。

### S1-TC-F01 `MissingPrerequisite` 报文与 `must:false` 豁免

- **覆盖**：F-02 / spec §7 `MissingPrerequisite`（`:179`）/ PRD `:254` 固定句式
- **来源**：spec 推导（spec v5 `:179`）
- **前置**：`baseCard().must[0].requires` 含 `must:true` 的 `question-card.md`；`baseEnv().available` 含它。
- **步骤**：① `must:true` 的 id 不在 `available` → 红且报文固定；② `must:false` 且不在 `available` → 绿。
- **预期**：① 一码 + message 含「缺 `question-card.md`，未开始」；② 绿。
- **判据**：
  ```js
  const r = run((c) => {}, { available: new Set([]) });
  only(r, 'MissingPrerequisite', 'must[0].requires');
  assert.ok(/缺\s*question-card\.md\s*，\s*未开始/.test(r.errors[0].message), `报文应为固定句式，实得 ${r.errors[0].message}`);
  green(run((c) => { c.must[0].requires = [{ id: 'question-card.md', kind: 'artifact', must: false }]; }, { available: new Set([]) }));
  assert.ok(baseCard().never[0].requires.length === 0, '前置：`requires` 允许空数组（§4）');
  ```
- **红绿证据**：红 = 报文写「缺少前置 question-card.md」→ 第 2 组正则红（PRD 要求固定句式）；红 = `must:false` 也被判红 → 第 3 条红；绿 = 两句都成立。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：`requires` 元素缺 `kind` / `must` 非布尔（spec 无码 → §7 缺口 S1-G-11）。

### S1-TC-F02 `VagueReferent`：5 个模糊词 + 缺 / 空 `objects`

- **覆盖**：spec §7 `VagueReferent`（`:178`，`VAGUE_TERMS` 封闭 5 词）
- **来源**：spec 推导（spec v5 `:178`）
- **前置**：`baseCard().must[0].objects` 非空；`VAGUE_TERMS` 的 5 词均非空。
- **步骤**：逐个注入 5 个模糊词；再测缺 `objects`、空数组。
- **预期**：7 构造全部一码；正常宾语 → 绿。
- **判据**：
  ```js
  const VAGUE = ['该内容', '上述', '相关', '前述', '该项'];
  for (const w of VAGUE) only(run((c) => { c.must[0].objects = [w]; }), 'VagueReferent', 'must[0].objects');
  only(run((c) => { delete c.must[0].objects; }), 'VagueReferent', 'must[0].objects');
  only(run((c) => { c.must[0].objects = []; }), 'VagueReferent', 'must[0].objects');
  assert.ok(baseCard().must[0].objects.length > 0);
  green(run((c) => { c.must[0].objects = ['question-card.md', 'observation.md']; }));
  ```
- **红绿证据**：红 = 只判「缺/空」不判词表 → 前 5 条红；红 = 词表扩成 6 词而本表未同批改 → 第 6 个词无探针（本用例只钉 5 词，词表变更须同批改本条与 PRD `:261`）；绿 = 5 词齐。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：模糊词出现在 `criterion` 文本里（那是 `InlineTermList` / `AmbiguousCriterion` 的域）。

### S1-TC-F03 `MissingCriterionImpl` 的两个判定面与 `FalseScriptCheck` 的实体分工

- **覆盖**：spec §7 `MissingCriterionImpl`（`:181`，**v5 增设 `CheckItem.criterion` 面**：「`CheckItem`：`criterion` 缺/空（`check:'manual'` 豁免）；两处 path 不同，**各报一次、互不抑制**」+ v4 收紧句「动作条目没有 `check` 字段 → 不适用 `manual` 豁免」）/ `FalseScriptCheck`（`:182`）/ §10-D4（合并语义，`:263`）/ **§10-D15（`:274`）** / §8 「M2 只管同一 path」+「这两个码不设组」（`:225` / `:239`）/ §4 `Action` 形状无 `check`（`:68-72`）/ §4 `CheckItem.check` 三值（`:73-74`）/ §4.1 两个 `criterion` 分形（`:98-99`）
- **来源**：spec 推导（spec v5 §7 `:181`：① `Action` 侧「字段缺/空 或 id ∉ `env.predicates`」、无 `manual` 豁免载体故**一律**报；② `CheckItem` 侧「`criterion` 缺/空」、`check:'manual'` 豁免；两处 path 不同 → 各报一次）+ 实现观察（补充：`MissingCriterionImpl` 与 `FalseScriptCheck` 判的是不同实体，故「同一 CheckItem 上互斥」不能成立）
- **前置**：基线卡的 Action 带 `criterion`；CheckItem 是 `manual` 条目（带 `declarer`）；**`baseCard().must[0]` 上没有 `check` 字段**（v4 `:181` 的形式前提，先断言，否则「动作侧无豁免载体」只是注释）。
- **步骤**：① 只让 Action 缺 `criterion` → 一码；② 只让 CheckItem 走 `script` 且无 `cmd`/`impl` → 一码；③ 两者同时 → 两码（不同 path）；④ **`CheckItem` 面（v5 新增）**：非 `manual` 条目（`script` 带 `cmd`）删掉 `criterion` → 报 `MissingCriterionImpl`（path `checkItems[0].criterion`），而 `manual` 条目删掉 `criterion` → 绿（豁免）；⑤ **两处各报一次、互不抑制**：`Action.criterion` 缺 + `CheckItem`（非 manual）`criterion` 缺 → 同码两条、两条 path 不同；⑥ **Action 侧不外溢（v4 收紧）**：`Action.criterion` 填未登记谓词 id、**同卡 CheckItem 仍是 `manual`** → `Action` 仍必报，path 落 `must[0].criterion`；⑦ **反向对照**：把 `manual` 写进 `Action` 的契约外 `check` 字段 → 同样不构成豁免，仍必报。
- **预期**：①②各一码且 path 不同；③ 两码共存（M1 允许，因 path 不同）；④ 非 manual 一码 / manual 零码；⑤ `['MissingCriterionImpl','MissingCriterionImpl']`（两条同码，path 集合大小 = 2）；⑥⑦ 各只报 `MissingCriterionImpl`（path = `must[0].criterion`）。
- **判据**：
  ```js
  // 前置（v4 :181 的形式前提）：Action 形状没有 check 字段 → manual 豁免在动作侧无载体
  assert.equal('check' in baseCard().must[0], false, 'Action 不得有 check 字段（spec §4 :68-72；v4 :181 的收紧前提）');
  assert.equal(baseCard().checkItems[0].check, 'manual', '前置：基线 CheckItem 必须是 manual（豁免承载面，§4 :73-74）');
  assert.ok(baseEnv().predicates.has('ledger.row.exists'), '前置：基线动作的谓词 id 已登记（否则第 1 组不成立）');
  // ① Action 缺 criterion → 本码（path must[i].criterion）
  only(run((c) => { delete c.must[0].criterion; }), 'MissingCriterionImpl', 'must[0].criterion');
  // ② CheckItem 走 script 且 cmd/impl 均缺 → 脚本入口码
  only(run((c) => { c.checkItems[0].check = 'script'; delete c.checkItems[0].declarer; }), 'FalseScriptCheck', 'checkItems[0]');
  // ③ 两者同时 → 两码共存（不同 path，M1 允许）
  const both = run((c) => { delete c.must[0].criterion; c.checkItems[0].check = 'script'; delete c.checkItems[0].declarer; });
  assert.deepEqual([...codes(both)].sort(), ['FalseScriptCheck', 'MissingCriterionImpl']);
  assert.equal(new Set(pathsOf(both)).size, 2, '两码必须落在不同 path（否则违 M1，也说明「同一 CheckItem 上互斥」被误实现成同 path）');
  // ④ v5 新增的 CheckItem 面：非 manual 条目缺 criterion 也报同码；manual 条目缺 criterion 仍豁免
  only(run((c) => { c.checkItems[0].check = 'script'; c.checkItems[0].cmd = 'node tools/docgen/cli.mjs gate'; delete c.checkItems[0].criterion; }),
    'MissingCriterionImpl', 'checkItems[0].criterion');                       // 非 manual（script + cmd）→ 报
  green(run((c) => { delete c.checkItems[0].criterion; }));                    // manual → 豁免（不报）
  // ⑤ 两处 path 不同 → 同一次返回里同码报两次、互不抑制（§6 `:157` 只要求同 path 唯一，M1 允许）
  const twice = run((c) => {
    delete c.must[0].criterion;
    c.checkItems[0].check = 'script'; c.checkItems[0].cmd = 'node tools/docgen/cli.mjs gate';
    delete c.checkItems[0].criterion;
  });
  assert.deepEqual(codes(twice), ['MissingCriterionImpl', 'MissingCriterionImpl'],
    `两处各报一次（§6 顺序：must 先于 checkItems），实得 ${codes(twice).join('|') || '(空)'}`);
  assert.equal(new Set(pathsOf(twice)).size, 2, `两条 path 必须不同（must[0].criterion / checkItems[0].criterion），实得 ${pathsOf(twice).join('|')}`);
  assert.ok(String(pathsOf(twice)[0]).startsWith('must[0].criterion') && String(pathsOf(twice)[1]).startsWith('checkItems[0].criterion'),
    `path 顺序应为 must 先、checkItems 后（§6 :156 固定序），实得 ${pathsOf(twice).join('|')}`);
  // ⑥ Action.criterion 未登记 + 同卡有 manual CheckItem → Action 侧仍必报（豁免不外溢到 Action）
  const spill = run((c) => { c.must[0].criterion = 'ledger.unknown.predicate'; });   // 该 id 不在 baseEnv().predicates
  assert.deepEqual(codes(spill), ['MissingCriterionImpl'], `Action.criterion 未登记 → 必报（即使同卡有 manual 条目），实得 ${codes(spill).join('|')}`);
  assert.ok(String(pathsOf(spill)[0]).startsWith('must[0].criterion'), `path 必须落 must[0].criterion，实得 ${pathsOf(spill)[0]}`);
  // ⑦ 反向对照：把 manual 写进 Action 的契约外 check 字段也不构成豁免（v4 :181「动作条目没有 check 字段 → 不适用 manual 豁免」）
  const fake = run((c) => { c.must[0].criterion = 'ledger.unknown.predicate'; c.must[0].check = 'manual'; });
  assert.deepEqual(codes(fake), ['MissingCriterionImpl'], `Action 上的 check 字段不得成为豁免载体，实得 ${codes(fake).join('|')}`);
  ```
- **红绿证据**：红 = 把 `MissingCriterionImpl` 也挂到 `checkItems[i]` 的同一条 path → 第 3 组 path 断言红；红 = **只实现 Action 面、不判 `CheckItem.criterion` 缺/空** → ④ 第一条实得 `(空)`（v5 新增面漏实现）；红 = 把豁免范围放大成「所有 `CheckItem` 都豁免」→ ④ 第一条实得 `(空)`；红 = **两处合并成一条（只报一次）** → ⑤ 实得单条（v5 `:181` 写明「各报一次、互不抑制」）；红 = **把豁免读成「卡上存在任一 manual 条目 → 整卡豁免」** → ⑥ 实得 `(空)`；红 = **认 `Action` 上的 `check` 字段为豁免载体** → ⑦ 实得 `(空)`；绿 = v5 §7 `:181` 的两面分工（动作侧一律按谓词登记判；`CheckItem` 侧判 `criterion` 缺/空且只豁免 manual）。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：`Action.criterion` 与 `CheckItem.criterion` 的**语义差**（前者谓词 id、后者散文）对三个「判据文本」码的影响 → 已由 **F05** 专测（§4.1 / §4.2 / §10-D13）；`manual` 条目缺 `criterion` 在 `CheckItem` 侧**无码可报**——v5 `:181` 已把它定为「豁免」（= 不报），要改成另有码属判据级口径变更，须回流 spec 重审（R4），本文件不自定口径；该项连同「动作侧无豁免载体」即 §7 缺口 **S1-G-16，两版累计已闭合**。

### S1-TC-F04 动作六字段齐 + `requires:[]` + 落点合法 → 绿

- **覆盖**：F-02 / spec §4 动作条目六字段（`:85`）/ spec §7 `UnboundLanding` 的反面（`:180`）
- **来源**：spec 推导（spec v5 `:85` / PRD `:261`）
- **前置**：`baseCard().must[0]` 六字段齐、`never[0].requires` 为空数组。
- **步骤**：保留基线动作（六字段齐、`requires` 非空），再造一个 `requires:[]` 的 `never` 动作，均绿。
- **预期**：两形态绿。
- **判据**：
  ```js
  const SIX = ['id', 'kind', 'trigger', 'objects', 'criterion', 'landing'];
  const a = baseCard().must[0];
  for (const k of SIX) assert.ok(k in a, `动作条目缺字段 ${k}`);
  assert.deepEqual(Object.keys(a.trigger).sort(), ['moment', 'repeat', 'scene'], 'trigger 必须三键齐');
  green(run());
  assert.deepEqual(baseCard().never[0].requires, []);
  green(run((c) => { c.never[0].trigger.repeat = 'once'; }));
  ```
- **红绿证据**：红 = `trigger` 少 `repeat` → 第 2 组红（字段齐这条断言直接咬住 §4）；红 = 空 `requires` 被判 `MissingPrerequisite` → 第 3 组红；绿 = 六字段 + 三键。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：`Action.params` / `expr` / `reason` 的可选性语义（§7 只在合并族与表达式族涉及）。

### S1-TC-F05 两个 `criterion` 的分形：`Action.criterion` 是谓词 id，`CheckItem.criterion` 才是文本扫描面

- **覆盖**：spec §4.1 `:94-99`（两字段形态表）/ spec §7 `MissingCriterionImpl`（`:181`）/ `InlineTermList`（`:193`）/ §10-D13
- **来源**：spec 推导（spec v5 §4.1 `:98`「`Action.criterion` = 谓词 id（如 `ledger.reflectRow.exists`），须 ∈ `env.predicates`；缺字段或未登记 → `MissingCriterionImpl`」+ `:99`「`CheckItem.criterion` = 判据文字，词表 / 阈值 / 表达式三类扫描都在这个文本上做」+ §4.2 `:106`「`InlineTermList` / `InlineThreshold` / `AmbiguousCriterion` **仅** 扫 `checkItems[].criterion`，不扫 `Action.criterion`」）
- **前置**：`CT.criterionTerms` 至少 3 词（行内已断）；`baseEnv().predicates` 恰含 `ledger.row.exists`（`baseCard().must[0].criterion` 已登记）。
- **步骤**：① **假阳性侧**：把 3 个**不同**词表词拼成一句放进 `must[0].criterion`（谓词 id 面，且该串未登记进 `predicates`）→ 只报 `MissingCriterionImpl`，**不得**出现三个扫描码中任一个；② **假阴性侧**：同一句放进 `checkItems[0].criterion`（判据文字面，且删掉 `definitions`）→ 只报 `InlineTermList`，**不得**出现 `MissingCriterionImpl`；③ 配齐侧：`Action.criterion` 恢复为已登记谓词 `ledger.row.exists` → 绿。
- **预期**：① `['MissingCriterionImpl']`；② `['InlineTermList']`；③ `{ok:true, errors:[]}`。
- **判据**：
  ```js
  assert.ok(CT.criterionTerms.length >= 3, '前置：criterion-terms 至少 3 词（否则 InlineTermList 判据恒真）');
  assert.ok(baseEnv().predicates.has('ledger.row.exists'), '前置：第 3 组的谓词 id 必须已登记（否则「配齐即绿」不成立）');
  const three = `${CT.criterionTerms[0]}与${CT.criterionTerms[1]}且${CT.criterionTerms[2]}`;
  const SCAN_CODES = ['InlineTermList', 'InlineThreshold', 'AmbiguousCriterion'];
  // ① 假阳性守卫：Action.criterion 是谓词 id，不是文本扫描面（v3 §4.2 `:106` 的「不扫」列）
  const r1 = run((c) => { c.must[0].criterion = three; });
  assert.deepEqual(codes(r1), ['MissingCriterionImpl'], `Action.criterion 未登记 → 只应报 MissingCriterionImpl（v3 §4.1），实得 ${codes(r1).join('|')}`);
  for (const k of SCAN_CODES) assert.ok(!codes(r1).includes(k), `Action.criterion（谓词 id 面）不得扫出 ${k}（v3 §4.2 第 106 行）`);
  assert.ok(String(pathsOf(r1)[0]).startsWith('must[0].criterion'), `path 应落 must[0].criterion，实得 ${pathsOf(r1)[0]}`);
  // ② 假阴性守卫：同一句进 CheckItem.criterion 必须报 InlineTermList，且不得串成动作码
  const r2 = run((c) => { c.checkItems[0].criterion = three; delete c.checkItems[0].definitions; });
  assert.deepEqual(codes(r2), ['InlineTermList'], `CheckItem.criterion 命中 ≥3 个不同词表词 → 只应报 InlineTermList（§8 组 3 先报规则），实得 ${codes(r2).join('|')}`);
  assert.ok(!codes(r2).includes('MissingCriterionImpl'), 'CheckItem.criterion 是文本面，不得报 MissingCriterionImpl（该码只判 Action.criterion）');
  assert.ok(String(pathsOf(r2)[0]).startsWith('checkItems[0].criterion'), `path 应落 checkItems[0].criterion，实得 ${pathsOf(r2)[0]}`);
  // ③ 配齐侧：两侧各守自己的面 → 绿
  green(run((c) => { c.must[0].criterion = 'ledger.row.exists'; }));
  ```
- **红绿证据**：红 = 实现对 `Action.criterion` 也跑词表扫描（把两字段当同名同义）→ 第 1 组 `codes` 多出 `InlineTermList`（第 2 组循环断言直接点名该码）；红 = 实现只扫 `Action.criterion` 不扫 `CheckItem.criterion`（反向错）→ 第 2 组实得 `(空)`；红 = 两个字段的 `path` 混指（都落 `must[0].criterion`）→ 第 2 组末条 path 断言红；绿 = v3 §4.1 分形 + §4.2 扫描面各行其位。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：`AmbiguousCriterion` 的 1–2 词子面（G05 已钉三码配齐）；`Action` 侧 `manual` 豁免的**无载体**问题已由 spec v5 §7 `:181` + §10-D15 `:274` 收口（「动作条目没有 `check` 字段 → 不适用 `manual` 豁免」），落成 **F03 的 ④⑤⑥**（含「同卡有 manual 条目 Action 仍必报」的对照断言）——原 §7 缺口 **S1-G-16 / §8 建议 #17 已闭合**，本用例只钉两个 `criterion` 的扫描面分形。

### S1-TC-G01 `MissingSubject` 两子面

- **覆盖**：spec §7 `MissingSubject`（`:183`）/ PRD `:271`
- **来源**：spec 推导（spec v5 `:183`）
- **前置**：`pickSubject(0)` 的 `display` 非空（行内已断，否则 label 派生断言恒真）。
- **步骤**：① 删 `subject` → 红；② `label` 换掉 `display` → 红；③ 恢复 → 绿。
- **预期**：①②各一码，path 均在 `checkItems[0]`。
- **判据**：
  ```js
  only(run((c) => { delete c.checkItems[0].subject; }), 'MissingSubject', 'checkItems[0].subject');
  only(run((c) => { c.checkItems[0].label = '观察表含证据行'; }), 'MissingSubject', 'checkItems[0].label');
  assert.ok(String(SUB.SUBJECTS[pickSubject(0)].display).trim(), '前置：display 非空（否则上式恒真）');
  green(run((c) => { c.checkItems[0].label = `${SUB.SUBJECTS[pickSubject(0)].display}含证据行`; }));
  ```
- **红绿证据**：红 = 只判 `subject` 缺、不判 label 派生 → 第 2 条绿；红 = display 为空时 label 判据恒真 → 第 3 组前置断言拦住；绿 = 两子面齐。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：`SUBJECTS` 表的封闭性（§7 缺口 S1-G-12；K01 只测 env 缺键）。

### S1-TC-G02 `DuplicateCheckItem` / `CrossSubjectSharedItem` 与同 id 同 subject 的边界

- **覆盖**：spec §7 两码（`:184` / `:185`）/ PRD `:272-273`
- **来源**：spec 推导（spec v5 `:184-185`）
- **前置**：`SUBJECT_VALIDATORS` 至少 2 项带非空 display（`CrossSubjectSharedItem` 需两主语，行内已断）。
- **步骤**：① 同 subject + criterion 两条 → 红；② 同 id 两 subject → 红；③ 同 id 同 subject 两条（criterion 不同）→ 不报 `CrossSubjectSharedItem`。
- **预期**：①②各一码；③ 无该码（`DuplicateCheckItem` 未必报，故只断不含 `CrossSubjectSharedItem`）。
- **判据**：
  ```js
  only(run((c) => { c.checkItems.push({ ...c.checkItems[0], id: 'k02' }); }), 'DuplicateCheckItem', 'checkItems[1]');
  only(run((c) => {
    const s1 = pickSubject(1);
    c.checkItems.push({ ...c.checkItems[0], subject: s1, label: `${SUB.SUBJECTS[s1].display}X` });
  }), 'CrossSubjectSharedItem', 'checkItems[1].id');
  const same = run((c) => { c.checkItems.push({ ...c.checkItems[0], criterion: '观察表每行带路径与行号且可回指' }); });
  assert.ok(!codes(same).includes('CrossSubjectSharedItem'), `同 id 同 subject 不得报 CrossSubjectSharedItem，实得 ${codes(same)}`);
  ```
- **红绿证据**：红 = `CrossSubjectSharedItem` 用「id 出现两次」判 → 第 3 条红（该码语义是「主语不同不许共用」，不是「id 唯一」）；红 = `DuplicateCheckItem` 用 id 判 → 第 1 条红（该码判 subject + criterion 组合）；绿 = 两码各按自己的判定面。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：`DuplicateCheckItem` 在「同 id 同 subject 不同 criterion」时是否该红（spec 未写 → §8 建议 #4 相邻项）。

### S1-TC-G03 `SubjectiveLabel`：5 词 × 4 种分隔符

- **覆盖**：spec §7 `SubjectiveLabel`（`:186`）/ PRD `:270`（起步 5 词）
- **来源**：spec 推导（spec v5 `:186`）
- **前置**：`ST.subjectiveTerms` 至少 5 词（行内已断）。
- **步骤**：逐词注入（`、` 分隔）；再逐分隔符（`、` / `，` / `/` / 空格）注入同一个词。
- **预期**：9 构造全部一码。
- **判据**：
  ```js
  assert.ok(ST.subjectiveTerms.length >= 5, `subjective-terms 起步 5 词，实得 ${ST.subjectiveTerms.length}`);
  const d = SUB.SUBJECTS[pickSubject(0)].display;
  for (const w of ST.subjectiveTerms.slice(0, 5)) {
    only(run((c) => { c.checkItems[0].label = `${d}、${w}`; }), 'SubjectiveLabel', 'checkItems[0].label');
  }
  for (const sep of ['，', '/', ' ']) {
    only(run((c) => { c.checkItems[0].label = `${d}${sep}${ST.subjectiveTerms[0]}`; }), 'SubjectiveLabel', 'checkItems[0].label');
  }
  only(run((c) => { c.categories[0].label = ST.subjectiveTerms[0]; }), 'SubjectiveLabel', 'categories');
  ```
- **红绿证据**：红 = 只按空格切 → `、` / `，` / `/` 三条红；红 = 只判 `label` 不判 `criterion` 与 `categories` → 末条红；绿 = 4 分隔符全认。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：词表扩展到 `criterion` 的语义（§7 判定面写了 `categories` 与 `checkItems`，`criterion` 文本归表达式族）。

### S1-TC-G04 `MissingAiAudit`：6 形态必红 + 合法 ai 条目绿

- **覆盖**：spec §7 `MissingAiAudit`（`:196`，**v5 收口：rubric 缺 `source` 归本码**）/ §10-D16（`:275`）/ PRD §3.4 `:194-200` + PRD `:262`（`rubric` 条目 `{ text, source: 'path:line' }`，缺 `source` 原文写 `AmbiguousCriterion`）
- **来源**：spec 推导（spec v5 `:196`：「`check === 'ai'` 且（rubric 的 positive/negative/boundary 任一组 < 1 条，或 rubric 任一条无 `path:line`，或 `audit.sample` / `audit.command` 缺）… **rubric 缺 `source` 归本码**（PRD `:262` 的 `AmbiguousCriterion` 在此收口，见 §10-D16）」）
- **前置**：`aiCard()` 基线的三组 rubric 各 1 条且 `audit` 两键齐（先绿再逐项破坏）。
- **步骤**：以合法 ai 条目为基线（三组各 1 条且带 `source`、`audit` 两键齐），逐项破坏 6 形态：positive 空 / negative 空 / boundary 空 / 某条的 `source` **值不是 `path:line`** / 某条**缺 `source` 键**（＝ PRD `:262` 的收口）/ `audit.sample` 缺 / `audit.command` 缺。
- **预期**：7 破坏构造各**只报** `MissingAiAudit`；基线绿。
- **判据**：
  ```js
  const aiCard = () => {
    const c = baseCard();
    c.checkItems[0] = {
      id: 'k01', subject: pickSubject(0), label: `${SUB.SUBJECTS[pickSubject(0)].display}观察表含证据行`,
      criterion: '观察表每行带路径与行号', check: 'ai',
      rubric: {
        positive: [{ text: '有 path:line', source: 'agents/detective-observer.md:12' }],
        negative: [{ text: '只写结论', source: 'agents/detective-observer.md:20' }],
        boundary: [{ text: '一行为空', source: 'agents/detective-observer.md:30' }],
      },
      audit: { sample: '每轮每条 ≥1', command: 'node tools/docgen/cli.mjs gate' },
    };
    return c;
  };
  green(M.validateCardModel(aiCard(), baseEnv()));
  for (const [name, mut] of [
    ['positive 空', (c) => { c.checkItems[0].rubric.positive = []; }],
    ['negative 空', (c) => { c.checkItems[0].rubric.negative = []; }],
    ['boundary 空', (c) => { c.checkItems[0].rubric.boundary = []; }],
    ['source 值不是 path:line', (c) => { c.checkItems[0].rubric.negative[0].source = '看到就行'; }],
    ['缺 source 键（PRD :262 收口）', (c) => { delete c.checkItems[0].rubric.positive[0].source; }],
    ['audit.sample 缺', (c) => { delete c.checkItems[0].audit.sample; }],
    ['audit.command 缺', (c) => { delete c.checkItems[0].audit.command; }],
  ]) {
    const c = aiCard(); mut(c);
    const r = M.validateCardModel(c, baseEnv());
    assert.deepEqual(codes(r), ['MissingAiAudit'], `${name}：应只报 MissingAiAudit，实得 ${codes(r)}`);
  }
  // 收口断言（§10-D16）：rubric 缺 source **不得**报成 AmbiguousCriterion（PRD `:262` 的旧写法在此作废）
  const noSource = aiCard();
  delete noSource.checkItems[0].rubric.positive[0].source;
  assert.ok(!codes(M.validateCardModel(noSource, baseEnv())).includes('AmbiguousCriterion'),
    'PRD :262 的「缺 source → AmbiguousCriterion」已由 §10-D16 收口到 MissingAiAudit（不得同形态双码）');
  ```
- **红绿证据**：红 = 只判 `audit` 两键不判 rubric 组数 → 前 3 个构造绿；红 = 只判「有 `source` 键」不判 `path:line` 形态 → 「source 值不是 path:line」构造绿；红 = **不判「缺 `source` 键」**（只 `if (it.source && !ok(it.source))`）→「缺 source 键」构造绿，v5 收口失效；红 = 把缺 `source` 判成 `AmbiguousCriterion`（照 PRD `:262` 原文）→ 末条收口断言红（且该构造的 `codes` 会是 `['AmbiguousCriterion']`）；绿 = 7 子面齐 + 收口正确。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：`evidenceRequired: true`（PRD `:199` 的字段，**spec §10-D22 `:281` 声明本段不判** → v6.1 登记 §7 缺口 **S1-G-23** / §8 建议 #4「已采纳（不判）」）；rubric 条目的 `text` 语义质量（S4 渲染侧）。

### S1-TC-G05 判据配齐（`definitions` + `params`）时三码均不报（F-07 正向）

- **覆盖**：F-07 / spec §7 三码（`:193-195`）/ spec §8 组 3 的反面（`:232`）/ §7 `:194`（**单位→键映射七项**）
- **来源**：spec 推导（spec v6 `:193-195` / `:232` / `:194`）
- **前置**：`CT.criterionTerms` 至少 3 词（行内已断）；`UNIT_KEY` 由 §0.3 从 spec `:194` 原文切。
- **步骤**：① `criterion` 命中 2 个词但带 `definitions` → 不报 `AmbiguousCriterion`；② `criterion` 含「3 次」且阈值进 `params` → 不报 `InlineThreshold`；③ 词表成员进数组物料后 `criterion` 只引用其 id → 不报 `InlineTermList`；④ **单位→键映射（`:194` 写死七项）**：逐个「数字 + 单位 + 对应键在 `params` 里」→ 绿（映射表本身从 spec 原文切，不写死在测试里）。
- **预期**：三构造 + 7 个映射全绿。
- **判据**：
  ```js
  green(run((c) => {
    c.checkItems[0].criterion = `${CT.criterionTerms[0]}${CT.criterionTerms[1]}`;
    c.checkItems[0].definitions = { [CT.criterionTerms[0]]: '按 agents/detective-observer.md:12 的口径' };
  }));
  green(run((c) => {
    c.checkItems[0].criterion = '同一问题卡少于 3 次观察';
    c.checkItems[0].params = { times: 3 };
  }));
  green(run((c) => {
    assert.ok(CT.criterionTerms.length >= 3);
    c.checkItems[0].criterion = `见 criterion-terms 全部成员（已进数组物料）`.replace('见 ', '');
    c.checkItems[0].definitions = Object.fromEntries(CT.criterionTerms.slice(0, 3).map((t) => [t, '已登记口径']));
  }));
  // ④ spec §7 `:194` 的「单位 → 键」映射：逐个配齐 → 绿（映射来自 §0.3 从 `:194` 原文切，不与自身字面 deepEqual）
  assert.equal(Object.keys(UNIT_KEY).length, 7, `前置：spec :194 应切出 7 个单位→键映射，实得 ${JSON.stringify(UNIT_KEY)}`);
  assert.equal(UNIT_KEY['处'], 'spots', '前置：`处→spots` 必须能从 :194 切出（改 spec 该映射 → 本行即红，这正是「不许自比自」的探针）');
  for (const [unit, key] of Object.entries(UNIT_KEY)) {
    green(run((c) => { c.checkItems[0].criterion = `少于 3 ${unit} 即算通过`; c.checkItems[0].params = { [key]: 3 }; }),
      `单位 ${unit} 的对应键 ${key} 在位时不得报 InlineThreshold`);
  }
  ```
  （`UNIT_KEY` 在 §0.3 顶层声明一次，**值从 spec `:194` 原文切**（不再与自身字面 `deepEqual`）；④ 的第一条只断「七项齐全」，第二条钉 `处→spots` 这一项——spec 把 `处` 的键改掉即红。）
- **红绿证据**：红 = `AmbiguousCriterion` 忽略 `definitions` → 第 1 条红；红 = `InlineThreshold` 只要见数字就报、不看 `params` → 第 2 条红 + ④ 的七条全红；红 = **映射表把 `次` 配成 `count`**（键名错位）→ ④ 的「次」那条绿不了（实得 `['InlineThreshold']`）；红 = **spec `:194` 把 `处→spots` 改成 `sites`** 而实现未改 → `UNIT_KEY['处']` 变 `sites`，构造 `params: { sites: 3 }` → 实得 `['InlineThreshold']` → ④ 红（v6 的验收口径：常量不许自比自）；绿 = 配齐即绿。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：映射**外**单位（如「秒」「页」）的行为（v5 `:194` 写「映射外单位一律红」，A05 ② 以 7 个映射内单位逐条必红；映射外单位的正向探针归 §7 缺口 S1-G-10 的余项，**主口径已由 v5 闭合**）。

### S1-TC-G06 `PointerToElsewhere` 假阳性守卫：真实合法句「遇意见冲突」

- **覆盖**：spec §7 `PointerToElsewhere` / PRD §3.7 `:223-224`（散文只进 `rationale`）
- **来源**：spec 推导 + 实现观察（补充：朴素的「含『见』即红」会把真实句判死）
- **第三方通道**：素材取自仓库现存真实句 `tools/observation-check/data.mjs`（行 27，即「遇意见冲突」），**非本用例作者自造**。
- **前置**：`tools/observation-check/data.mjs` 可读且第 27 行含「遇意见冲突」（行内已断）。
- **步骤**：① 把真实句放进 `duty.constraint` → 必须绿；② `duty.action` 写「见 §3」→ 必红；③ `rationale` 里写「见 §3」→ 必须绿（散文只进 README，不在卡面扫描面）。
- **预期**：①③绿，②红。
- **判据**：
  ```js
  const realLine = readFileSync(join(REPO, 'tools/observation-check/data.mjs'), 'utf8').split(/\r?\n/)[26];
  assert.ok(realLine.includes('遇意见冲突'), `前置：:27 应含真实句，实得 ${realLine}`);
  const realPhrase = realLine.match(/遇意见冲突/)[0];
  assert.ok(realPhrase.includes('见'), '前置：该真实句确实含「见」字（否则本守卫无判别力）');
  green(run((c) => { c.duty.constraint = realPhrase; }));
  only(run((c) => { c.duty.action = '给出观察记录（见 §3）'; }), 'PointerToElsewhere');
  green(run((c) => { c.rationale = '理由见 §3 的判据口径。'; }));
  ```
- **红绿证据**：红 = 实现按裸 `见` 子串匹配 → 第 1 条红（真实句被判死，这是最可能的假阳性）；红 = `rationale` 也进扫描面 → 第 3 条红（与 PRD `:223-224` 冲突）；绿 = 词边界 + 扫描面 = 卡面字段。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：「参考」/「参见」/「按 §」的逐词探针（同词表族，由 B03 的 `PointerToElsewhere` 行给一个代表形态；词表变更须同批改本条）。

### S1-TC-G07 `HardcodedCount` 五形态（含全角 / 汉字数字）+ `rationale` 豁免（扫描面边界）

- **覆盖**：spec §7 `HardcodedCount`（`:187`，三条正则 + **v4 收紧句**：「`N` 的字符面 = **半角 + 全角 + 汉字数字**」）/ **§10-D15（`:274`）** / spec §4.2 `:107`（卡文本面 = `duty.trigger` / `duty.categories[]` / `duty.action` / `duty.constraint` / `Action.objects[]` / `CheckItem.label`；不扫 `rationale`）/ PRD §3.5 完备性
- **来源**：spec 推导（spec v5 §7 `:187` + §10-D15 `:274`：「`\d` 会漏检『共３条 / 共三条』，判据会假绿」）
- **前置**：`baseCard().duty.action` 与 `rationale` 均在位（扫描面内外两端都存在）。
- **步骤**：① **五个形态**逐个注入卡文本面字段（`duty.action`）→ 各必红：`共 3 条`（半角）/ `共３条`（全角）/ `共三条`（汉字数字）/ `缺一项` / `全部命中`；② 全角与汉字形态在另两个卡文本面字段（`duty.constraint` / `CheckItem.label`）上同样必红（`N` 的字符面与字段无关）；③ 同样文字放进 `rationale` → 绿（`rationale` 只进 README，不在卡文本面）。
- **预期**：① 5 个断言全红（各恰一码）；② 2 个断言各恰一码且 path 前缀相符；③ 3 个断言全绿。
- **判据**：
  ```js
  // ① 五形态：半角 / 全角 / 汉字数字 + 「缺一X」+「全部」（v4 :179 的 N 字符面 + 三条正则）
  for (const text of ['给出共 3 条观察', '给出共３条观察', '给出共三条观察', '少写缺一项就算完成', '全部命中时收尾']) {
    only(run((c) => { c.duty.action = text; }), 'HardcodedCount');
  }
  // ② 全角 / 汉字形态在另两个卡文本面字段上同样必红（§4.2 :107 的扫描面逐字段列名）
  only(run((c) => { c.duty.constraint = '共３条以内'; }), 'HardcodedCount', 'duty.constraint');
  only(run((c) => { c.checkItems[0].label = `${SUB.SUBJECTS[pickSubject(0)].display}共三条`; }), 'HardcodedCount', 'checkItems[0].label');
  // ③ 豁免面保留：rationale 不在卡文本面（§4.2 :107 的「不扫」列；v4 未改）
  for (const text of ['本条不写数量（共 3 条属反例）', '全部命中时收尾', '共３条、共三条都属反例']) {
    green(run((c) => { c.rationale = text; }));
  }
  ```
- **红绿证据**：红 = 正则用 `\d`（半角）→ 第 ① 组的**第 2、3 条**红（`共３条` / `共三条` 漏检，v4 的收紧点）；红 = 只归一 `duty.action` 一个字段 → 第 ② 组两条红；红 = 扫描面包含 `rationale` → 第 ③ 组红（这是本用例的核心判别力，v4 未放宽）；绿 = 三条正则 + `N` 含半角/全角/汉字 + 扫描面 = 卡文本面。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：汉字数字的**穷举**（本用例只钉 `三` 一个代表值；`多 / 若干 / 十几` 这类不定量词不属 v4 `:187` 的 `N` 面，spec 未写 → 见 §7 缺口 **S1-G-18**）；全角归一**怎么实现**（v4 写「`N` 的字符面」，未规定是先归一还是分支匹配 → 实现自由，见 §8 建议 #18）。

### S1-TC-G08 `MixedTermInCard` / `ProceduralWordOutsideParliament`：议会席豁免

- **覆盖**：spec §7 两码（`:189` / `:190`）/ PRD F-12 称谓口径
- **来源**：spec 推导（spec v5 `:189-190`）
- **前置**：`baseEnv().parliamentSeats` = `{reviewer-audit}`，`SEAT` 不在其中。
- **步骤**：① 同卡同时出现「议长」「主持人」→ 红；② 只出现一个 → 绿；③ 非议会席写「收卡」→ 红；④ 议会席（∈ `parliamentSeats`）写「收卡」→ 绿。
- **预期**：①③红，②④绿。
- **判据**：
  ```js
  only(run((c) => { c.duty.action = '主持人调度时记录'; c.duty.constraint = '与议长口径一致'; }), 'MixedTermInCard');
  green(run((c) => { c.duty.action = '主持人调度时记录'; }));
  only(run((c) => { c.duty.action = '收卡'; }), 'ProceduralWordOutsideParliament');
  green(run((c) => { c.duty.action = '收卡'; }, { parliamentSeats: new Set([SEAT]) }));
  ```
- **红绿证据**：红 = `ProceduralWordOutsideParliament` 不读 `parliamentSeats` → 第 4 条红（议会席卡被迫不能用程序词）；红 = `MixedTermInCard` 要求「两词都出现」被写成「任一出现即红」→ 第 2 条红；绿 = 两码各按自己的面。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：五个程序词的逐词探针（B03 只给「收卡」一个代表形态；词表变更须同批改本条）。

### S1-TC-G09 `SCAN_FIELDS` 扫描面边界：`rationale` / `description` / `scenes[].why` 三处「不扫」与卡文本面「必扫」

- **覆盖**：spec §4.2 `:101-112`（`SCAN_FIELDS` 表 + **`:112` 键形态写死**：键 = 8 个文本类码名、逐码一项、不合并成 4 组键）/ spec §7 文本四码（`PointerToElsewhere` `:188`、`HardcodedCount` `:187`、`MixedTermInCard` `:189`、`ProceduralWordOutsideParliament` `:190`）/ §10-D13
- **来源**：spec 推导（spec v5 §4.2 `:107`「`PointerToElsewhere` / `HardcodedCount` 扫 卡文本面 = `duty.trigger` / `duty.categories[]` / `duty.action` / `duty.constraint` / `Action.objects[]` / `CheckItem.label`；**不扫** `description`（只写触发条件）、`scenes[].why`、`rationale`」+ `:108`「`MixedTermInCard` / `ProceduralWordOutsideParliament` 扫 卡文本面 **∪** `rationale`；不扫 `description`、`scenes[].why`」+ `:110` 的分界说明 + `:112`「**键 = 上表 8 个码名**（逐码一项，值 = 该码要扫的字段引用数组）；不按「扫描面相同」合并成 4 组键」）
- **前置**：`baseCard()` 为绿基线（B05 已钉）；`scenes` 改造后的局部场景带 `label` + `why` 且被 `must` / `never` 的 `trigger.scene` 引用（否则会叠出 `MissingSceneRationale` / `UnusedScene`，干扰「恰零码」断言）。
- **步骤**：① **不扫 `rationale`（指针码）**：`rationale` 写「详见 §3」→ 不报 `PointerToElsewhere`；② **不扫 `description`（数量码）**：`description` 写「共 3 条」→ 不报 `HardcodedCount`；③ **不扫 `scenes[].why`（数量码）**：局部场景 `why` 写「全部」→ 不报 `HardcodedCount`；④ **必扫卡文本面（数量码）**：`duty.constraint` 写「共 3 条」→ 报 `HardcodedCount`；⑤ **必扫卡文本面（指针码）**：`checkItems[0].label` 追加「见 §3」→ 报 `PointerToElsewhere`；⑥ **∪ `rationale`（程序词）**：`rationale` 写「收卡」→ 报 `ProceduralWordOutsideParliament`；⑦ **不扫 `description`（混称码）**：`description` 同时写「主持人」「议长」→ 不报 `MixedTermInCard`；⑧ **∪ `rationale`（混称码）**：`duty.action` 写「主持人」＋`rationale` 写「议长」→ 报 `MixedTermInCard`；⑨ `SCAN_FIELDS` 常量键集覆盖 8 个文本类码，「含 / 不含 `rationale`」分界逐项对账。
- **预期**：①②③⑦ 全绿（`{ok:true, errors:[]}`）；④⑤⑥⑧ 各只报一码且 path 前缀正确；⑨ 4 项断言全过。
- **判据**：
  ```js
  // ①②③⑦：三处「不在扫描面」的字段 —— 写了违规词也不得报码
  green(run((c) => { c.rationale = '详见 §3 的口径（散文只进此处）'; }));          // ① rationale 不扫指针词
  green(run((c) => { c.description = '每轮答辩结束后开始观察（共 3 条）'; }));      // ② description 不扫数量词
  green(run((c) => {                                                            // ③ scenes[].why 不扫数量词
    c.scenes = [{ id: 'local.why', label: '局部场景', why: '全部命中时记录' }];
    c.must[0].trigger.scene = 'local.why';
    c.never[0].trigger.scene = 'local.why';
  }));
  green(run((c) => { c.description = '主持人调度，议长口径'; }));                  // ⑦ description 不扫混称词
  // ④⑤：卡文本面内同一违规词必须报
  only(run((c) => { c.duty.constraint = '共 3 条以内'; }), 'HardcodedCount', 'duty.constraint');
  only(run((c) => { c.checkItems[0].label = `${SUB.SUBJECTS[pickSubject(0)].display}见 §3`; }), 'PointerToElsewhere', 'checkItems[0].label');
  // ⑥⑧：∪ rationale 的两码 —— rationale 里的违规词必须报
  only(run((c) => { c.rationale = '收卡'; }), 'ProceduralWordOutsideParliament');
  only(run((c) => { c.duty.action = '主持人调度时记录'; c.rationale = '与议长口径一致'; }), 'MixedTermInCard');
  // ⑨ 常量侧对账（v5 `:112` 键形态写死：键 = 8 个码名、逐码一项、不合并成 4 组键）
  const SF = EN.SCAN_FIELDS;
  assert.ok(SF && typeof SF === 'object' && !Array.isArray(SF), 'enums.mjs 必须导出 SCAN_FIELDS 对象（§3 `:37`「文本扫描常量」、v5 §4.2 `:112`）');
  assert.equal(Object.keys(SF).length, 8, `SCAN_FIELDS 必须恰 8 个键（逐码一项），实得 ${Object.keys(SF).length}：${Object.keys(SF).join('|')}`);
  const TEXT_CODES = ['SubjectiveLabel', 'InlineTermList', 'InlineThreshold', 'AmbiguousCriterion',
    'PointerToElsewhere', 'HardcodedCount', 'MixedTermInCard', 'ProceduralWordOutsideParliament'];
  assert.deepEqual(Object.keys(SF).sort(), [...TEXT_CODES].sort(),
    'SCAN_FIELDS 的键集必须逐字等于这 8 个文本类码名（不得合并成「扫描面相同」的 4 组键，v5 :112）');
  for (const k of TEXT_CODES) assert.ok(Object.prototype.hasOwnProperty.call(SF, k), `SCAN_FIELDS 必须为 ${k} 写扫描面（v5 §4.2 八键表）`);
  const flat = (v) => [...(v instanceof Set ? v : Array.isArray(v) ? v : Object.keys(v || {}))].join('|');   // Set / Array / Object 三形态都归一
  const hasR = (k) => flat(SF[k]).includes('rationale');
  assert.equal(hasR('MixedTermInCard'), true, '§4.2 :108：MixedTermInCard 扫 卡文本面 ∪ rationale');
  assert.equal(hasR('ProceduralWordOutsideParliament'), true, '§4.2 :108：ProceduralWordOutsideParliament 扫 卡文本面 ∪ rationale');
  for (const k of ['SubjectiveLabel', 'InlineTermList', 'InlineThreshold', 'AmbiguousCriterion', 'PointerToElsewhere', 'HardcodedCount']) {
    assert.equal(hasR(k), false, `§4.2：${k} 不扫 rationale`);
  }
  assert.equal(flat(SF.InlineTermList).includes('criterion'), true, '§4.2 :106：三码仅扫 checkItems[].criterion');
  assert.equal(flat(SF.SubjectiveLabel).includes('categories'), true, '§4.2 :105：SubjectiveLabel 扫 categories[].label');
  ```
- **红绿证据**：红 = 扫描面取「全卡所有字符串」（实现最省事的做法）→ ①②③⑦ 四条全红（`rationale` / `description` / `why` 里的违规词被扫出）；红 = 只扫 `duty.*`、漏 `CheckItem.label` → 第 ⑤ 条实得 `(空)`（`PointerToElsewhere` 漏检）；红 = 两个 ∪ 码复用了「卡文本面」常量（漏 `rationale`）→ ⑥⑧ 两条实得 `(空)`；红 = `SCAN_FIELDS` 未导出 → ⑨ 首条断言红；红 = **按「扫描面相同」合并成 4 组键**（如 `{ textCodes: [...], cardText: [...], cardTextPlusRationale: [...] }`）→ ⑨ 的 `keys.length === 8` 与 `deepEqual` 两条同时红（这是 v5 `:112` 写死的判别力）；绿 = §4.2 八键逐字 + 两处分界。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：`SCAN_FIELDS` 值的容器形态（Set / Array / Object 都算过，本用例用 `flat()` 归一，不钉死形状——spec `:101-112` 只写「扫哪些字段」，未写容器类型）；`SubjectiveLabel` 的三字段逐字探针（G03 已钉词表 × 分隔符）；`scenes[].why` 的「只判在不在」由 E03 守。

### S1-TC-H01 `EmptyOpenWithoutReason` 与「0 条须可核理由」

- **覆盖**：F-06 / spec §7 `EmptyOpenWithoutReason`（`:197`）/ PRD §3.6 `:215` / §6 入口分工（`:158`）
- **来源**：spec 推导（spec v5 `:197`）
- **前置**：`baseDoc()` 与 `runDoc()` 在位（开放项属产物侧 `ObservationDoc`，spec v5 §4 `:77-78`）。
- **步骤**：① `open: []` + 理由缺 → 红；② 理由白空格 → 红；③ 理由非空 → 绿；④ `open` 非空（无理由字段）→ 绿。
- **预期**：①②红，③④绿。
- **判据**：
  ```js
  only(runDoc((d) => { delete d.openEmptyReason; }), 'EmptyOpenWithoutReason');
  only(runDoc((d) => { d.openEmptyReason = '  '; }), 'EmptyOpenWithoutReason');
  green(runDoc((d) => { d.openEmptyReason = '已逐项比对固定项，无补充'; }));
  green(runDoc((d) => { d.open = [openItem()]; delete d.openEmptyReason; }));
  ```
- **红绿证据**：红 = 白空格用真值判断 → 第 2 条绿；红 = `open` 非空时也要求理由 → 第 4 条红（PRD 只说「0 条须给理由」）；红 = 该码仍由 `validateCardModel` 发出 → 本条三条 `runDoc` 调用全抛/空（入口分工违 §6 `:158`）；绿 = 四形态。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：`WeakReason` 的语义判定（manual，见 I04）。

### S1-TC-H02 `deriveScope` 8 段路径映射逐项（顺序敏感最长前缀）

- **覆盖**：F-06 / spec §5 `deriveScope`（`:132`，**顺序敏感、最长前缀优先**）/ §5 `:133`（「为什么必须是最长前缀」）/ §10-D7 `:266` / §10-D17 `:276` / spec §7 `OutOfScopeOpenItem`（`:198`）
- **来源**：spec 推导（spec v5 `:132`：「先 `object.replace(/\\/g,'/')` 归一，再按**下表自上而下**取首个命中的前缀 —— `docs/superpowers/reviews/`→`process`；`.session/`→`process`；`agents/`→`card`；`tools/`、`scripts/`→`code`；`docs/`→`doc`；其余→`repo`」+ `:133`「按首段一次判定会判成 `doc`，与 `process` 那条相反」）
- **前置**：`runDoc()` 在位（开放项走 `validateOpenItems(doc, env, cards)`）。
- **步骤**：① 逐段断 `deriveScope()` 返回值（8 条，**含两条 `docs/` 前缀的区分**）；② 用一条 scope 错配构造断 `OutOfScopeOpenItem`；③ 断「最长前缀」的判别力：`docs/superpowers/reviews/x/progress.md` 必须 ≠ `doc`。
- **预期**：8 段映射逐项相符（`docs/superpowers/reviews/…` → `process` 而 `docs/superpowers/specs/x.md` → `doc`）；错配一码。
- **判据**：
  ```js
  const MAP = [
    ['agents/detective-observer.md', 'card'],
    ['tools/docgen/card-model/enums.mjs', 'code'],
    ['scripts/check-all.mjs', 'code'],
    ['docs/superpowers/specs/x.md', 'doc'],                 // 只命中 `docs/` 一段 → doc
    ['docs/superpowers/reviews/x/progress.md', 'process'],  // 最长前缀 `docs/superpowers/reviews/` 先命中 → process
    ['.session/reviews/x/progress.md', 'process'],
    ['README.md', 'repo'],
    ['no/prefix/match.txt', 'repo'],
  ];
  for (const [obj, want] of MAP) assert.equal(OI.deriveScope(obj), want, `deriveScope(${obj}) 应为 ${want}`);
  // ③ 最长前缀的判别力（§5 :133 的反例形态）：按「首段」判会得 doc，与规定相反
  assert.equal(OI.deriveScope('docs/superpowers/reviews/x/progress.md'), 'process');
  assert.notEqual(OI.deriveScope('docs/superpowers/reviews/x/progress.md'), 'doc',
    '按首段（docs）判定会得 doc → 与 §5 :132 的 process 相反（这正是 D17 要守的反例）');
  // 顺序敏感的正面：`docs/` 若被判在 `docs/superpowers/reviews/` 之前，specs 那条仍得 doc、reviews 那条必错
  assert.equal(OI.deriveScope('docs/superpowers/specs/x.md'), 'doc', '`docs/` 段不能被 `docs/superpowers/reviews/` 蚕食');
  assert.ok(Object.keys(M.SCOPES).length === 5);
  only(runDoc((d) => { d.open = [openItem('agents/detective-observer.md', 'code')]; }), 'OutOfScopeOpenItem', 'open[0].scope');
  ```
- **红绿证据**：红 = 映射表把 `docs/superpowers/reviews/` 归 `doc`（而非 `process`）→ 该行 + ③ 两条红；红 = 按「首段」判（`path.split('/')[0]`）→ ③ 的 `notEqual` 红（得 `doc`）；红 = 映射顺序写成 `docs/` 在 `docs/superpowers/reviews/` 之前且实现「首个命中即停」→ ③ 红（reviews 得 doc）；红 = 映射读配置文件 → 副本内改配置即红（本用例只钉「写死」的 8 段）；绿 = §5 映射（自上而下最长优先）。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：Windows 反斜杠（H04）；重复前缀的更多组合（如 `.session/reviews/` 已在 `process` 一条里覆盖）；映射表的其它可能条目（如 `docs/superpowers/plans/` 归 `doc` —— spec 未单列，按 `docs/` 段命中）。

### S1-TC-H03 `DuplicateAsOpen`：`object` 逐字等于 `registeredIds` 成员

- **覆盖**：F-06 / spec §7 `DuplicateAsOpen`（`:199`）/ PRD `:253` / §4 `registeredIds` 行（`:90`）
- **来源**：spec 推导（spec v5 `:199` / `:90`）
- **前置**：`runDoc()` 在位；`baseEnv().registeredIds` 由 `M.registeredIdsOf([baseCard()])` 派生（spec v5 §6 `:143`）。
- **步骤**：① `object = 'k01'`（本卡检查项 id）→ 红；② `object` 为其它的路径串 → 绿。
- **预期**：① 一码；② 绿。
- **判据**：
  ```js
  assert.ok(baseCard().checkItems.map((i) => i.id).includes('k01'), '前置：k01 必须在本卡 registeredIds 内');
  assert.ok(baseEnv().registeredIds.has('k01'), 'env.registeredIds 必须由 registeredIdsOf 派生（spec v5 :143），且含 k01');
  only(runDoc((d) => { d.open = [openItem('k01', 'repo')]; }), 'DuplicateAsOpen', 'open[0].object');
  green(runDoc((d) => { d.open = [openItem()]; }));
  ```
- **红绿证据**：红 = 用「含子串」比较（`k01` 命中 `k010`）→ 需即为逐字相等，子串比较会漏（本用例只给精确形态 → 子串风险归 §8 建议 #9）；红 = `env.registeredIds` 取不到 / 空集（实现没按 §6 `:143` 收）→ 第 1 条绿（漏检，K01 专门测 env 接口）；绿 = 逐字相等。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：跨卡重复（`registeredIdsOf` 多卡并集 → J03）。

### S1-TC-H04 Windows 反斜杠路径按 `/` 归一后派生

- **覆盖**：F-06 / spec §5 `deriveScope`（`:132`，**v5 写死「先 `object.replace(/\\/g,'/')` 归一」**）/ §10-D17 `:276` / PRD §4.3 第 1 道同源口径（反斜杠是正当输入）
- **来源**：spec 推导（spec v5 `:132`「先 `object.replace(/\\/g,'/')` 归一，再按**下表自上而下**取首个命中的前缀」）
- **前置**：`runDoc()` 在位。
- **步骤**：三个反斜杠形态各与正斜杠形态**同值**：`tools\docgen\x.mjs` → `code`、`docs\superpowers\reviews\x\progress.md` → `process`、`docs\superpowers\specs\x.md` → `doc`；并断言错配会落 `OutOfScopeOpenItem` 而非「误判为 repo 后假绿」。
- **预期**：三对（正 / 反斜杠）结论相同；错配一码。
- **判据**：
  ```js
  for (const [posix, win, want] of [
    ['tools/docgen/x.mjs', 'tools\\docgen\\x.mjs', 'code'],
    ['docs/superpowers/reviews/x/progress.md', 'docs\\superpowers\\reviews\\x\\progress.md', 'process'],
    ['docs/superpowers/specs/x.md', 'docs\\superpowers\\specs\\x.md', 'doc'],
  ]) {
    assert.equal(OI.deriveScope(posix), want, `正斜杠基线：${posix} 应为 ${want}（先断基线，防「两侧同错」把同值比较变成恒真）`);
    assert.equal(OI.deriveScope(win), want, `反斜杠形态必须同值（否则正当 Windows 写法被判 repo / doc；v5 :132 要求先归一）：${win}`);
  }
  assert.equal(OI.deriveScope('tools\\docgen\\x.mjs'), 'code', '反斜杠 + tools/ → code（不得落 repo）');
  assert.equal(OI.deriveScope('docs\\superpowers\\reviews\\x\\progress.md'), 'process', '反斜杠形态同样走最长前缀 → process');
  assert.equal(OI.deriveScope('docs\\superpowers\\specs\\x.md'), 'doc', '反斜杠形态同样不能被 `docs/superpowers/reviews/` 蚕食');
  only(runDoc((d) => { d.open = [{ category: '缺口', object: 'tools\\docgen\\x.mjs', evidence: 'tools/docgen/x.mjs:1', impact: 'x', suggestion: 'y', scope: 'repo' }]; }), 'OutOfScopeOpenItem', 'open[0].scope');
  ```
- **红绿证据**：红 = 不归一 → 三条 `assert.equal(win, posix)` 全红（全落 `repo`）；红 = 只归一 `\\`→`/` 但改用「首段」判 → 第三条（specs 反斜杠）仍绿、第二条（reviews 反斜杠）红（得 `doc`）；红 = 归一后误把 `docs\\` 当成一段 → 第二/三条红；绿 = 归一 + 最长前缀。（**v5 已把「先归一」写进 §5 `:132`**，本条不再是「按建议钉」——若日后 spec 撤掉归一，须同批改本用例，不得静默删。）
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：UNC / 盘符绝对路径（PRD §4.3 归 S2 证据七道，本段不判证据路径合法性 → K03）。

### S1-TC-H05 开放项五列齐 + scope 派生一致 → 绿（F-06 正向）

- **覆盖**：F-06 / spec §4 `OpenItem` 五列（`:75`）/ spec §7 `OutOfScopeOpenItem` 的反面（`:198`）/ §6 入口（`:139`）
- **来源**：spec 推导（spec v5 `:75` / `:88`）
- **前置**：`runDoc()` 与 `openItem()` 在位。
- **步骤**：① `open: []` + 理由 → 绿；② 一条五列齐且 `scope` = 派生值 → 绿；③ **缺「非派生列」**（`category` / `evidence` / `impact` / `suggestion` 各缺一）→ S1 侧**仍绿**（缺列归 S2 的 `MissingOpenField`，v3 §7 `:208`）；④ **缺「派生列」**（`scope`）→ 由 `OutOfScopeOpenItem` 报（`scope` 缺失 ≠ 派生值，属 v3 §7 `:198` 的合法触发面）；⑤ `CARD_MODEL_CODES` 不含 `MissingOpenField`。
- **预期**：①②绿；③ 四构造全绿；④ 恰一码 `OutOfScopeOpenItem`；⑤ 断言过。
- **判据**：
  ```js
  green(runDoc());
  const full = openItem('.session/reviews/x/progress.md', 'process');
  assert.equal(OI.deriveScope(full.object), 'process');
  green(runDoc((d) => { d.open = [full]; }));
  // ③ 缺非派生列：S1 不复判缺列（v3 §7 :200 + §10-D14）→ 必须仍绿，否则说明实现把缺列归进了 S1 码表
  for (const k of ['category', 'evidence', 'impact', 'suggestion']) {
    const d = baseDoc();
    d.open = [{ ...full }];
    delete d.open[0][k];
    assert.ok(Object.keys(d.open[0]).length >= 2, `前置：缺 ${k} 后条目仍有键，避免空对象把断言变成恒真`);
    green(M.validateOpenItems(d, baseEnv()));
  }
  // ④ 缺派生列 scope：不是「缺列码」，而是 scope 与派生值不一致 → OutOfScopeOpenItem
  const d4 = baseDoc();
  d4.open = [{ ...full }];
  delete d4.open[0].scope;
  assert.deepEqual(codes(M.validateOpenItems(d4, baseEnv())), ['OutOfScopeOpenItem'],
    `缺 scope → 只应报 OutOfScopeOpenItem（v3 §7 :190），实得 ${codes(M.validateOpenItems(d4, baseEnv())).join('|')}`);
  // ⑤ 缺列码归 S2：S1 的 36 码表里不得有它
  assert.equal(Object.keys(M.CARD_MODEL_CODES).includes('MissingOpenField'), false,
    'v3 §7 :200：缺列码 MissingOpenField 归 S2，不进 S1 的 36 码');
  ```
- **红绿证据**：红 = 实现自己复判缺列并报一个码（S1 与 S2 各判一半）→ ③ 四条红；红 = 把 `MissingOpenField` 塞进 `CARD_MODEL_CODES` 凑数 → ⑤ 红且 B01 三方相等同时红；红 = `scope` 缺失也判缺列而不判 scope 不一致 → ④ 实得 `(空)`；绿 = 五列齐 + scope 一致（③ 的缺列绿由 v3 §7 `:208` 的段间分工授权）。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：缺列码**本体**的行为（五列齐 / `evidence` 可解析性）归 S2 `checks.mjs`，由 H06 做跨段对账；缺 `object` 时 `deriveScope(undefined)` 的派生输入形态本用例不构造（`object` 是派生列，缺它属 S2 的缺列面）。

### S1-TC-H06 `validateOpenItems` 只判三码：缺列在 S1 侧不报码（`MissingOpenField` 归 S2）

- **覆盖**：spec §7 末段 `:208`（「开放项缺列（`MissingOpenField`）不归本段」）/ §10-D14 / §11-2（段间分工）/ spec §6 `:139`（`validateOpenItems` 入口）/ PRD `:253`
- **来源**：spec 推导（spec v5 §7 `:208`「S1 的 `validateOpenItems` **只判三码**（`EmptyOpenWithoutReason` / `OutOfScopeOpenItem` / `DuplicateAsOpen`），不复判缺列——两段分工见 §11-2」；同段另有「它是 A 表已实现码（S2 `tools/observation-check/checks.mjs` 判五列齐与 `evidence`）」）
- **前置**：`runDoc()` / `openItem()` / `baseDoc()` 在位；`tools/observation-check/checks.mjs` 存在（**只读**，S2 已签交付，本段零改动）。
- **步骤**：① 缺 `impact` 的五列条目（其余四列齐、`scope` 与派生一致、`object` 不与 `registeredIds` 成员相等）→ S1 侧**不报任何码**；② 同时缺 `impact` + `suggestion` → 仍不报码；③ 三码各构造一次，逐个断言「恰一码 + 码名」；④ `CARD_MODEL_CODES` 不含 `MissingOpenField`；⑤ 静态对账：S2 `checks.mjs` **按内容定位** `MissingOpenField` 的实现段（不锁行号）。
- **预期**：①② `{ok:true, errors:[]}`；③ 三码各一；④ 断言过；⑤ 命中（内容锚）。
- **判据**：
  ```js
  // ① 缺 impact（非派生列）：S1 不复判缺列 → 不得报任何码
  green(runDoc((d) => {
    d.open = [(() => { const o = openItem(); delete o.impact; return o; })()];
  }));
  assert.deepEqual(Object.keys(openItem()).sort(), ['category', 'evidence', 'impact', 'object', 'scope', 'suggestion'], '前置：openItem() 六键（五列 + 派生 scope）');
  // ② 缺两列（impact + suggestion）：仍不报码
  green(runDoc((d) => {
    d.open = [(() => { const o = openItem(); delete o.impact; delete o.suggestion; return o; })()];
  }));
  // ③ 三码仍各报一次（缺列绿不得把三码一起放过）
  only(runDoc((d) => { d.open = []; d.openEmptyReason = '   '; }), 'EmptyOpenWithoutReason');
  only(runDoc((d) => { d.open = [openItem('agents/detective-observer.md', 'code')]; }), 'OutOfScopeOpenItem', 'open[0].scope');
  only(runDoc((d) => { d.open = [openItem('k01', 'repo')]; }), 'DuplicateAsOpen', 'open[0].object');
  // ④ 缺列码不在 S1 码表
  assert.equal(Object.keys(M.CARD_MODEL_CODES).includes('MissingOpenField'), false, '§7 :208：S1 的 36 码不含 MissingOpenField（否则 H05 ③ 必红）');
  // ⑤ 跨段静态对账：**内容锚**（v5 起不再硬编码 S2 行号 111–113——该行号只在 S2 文件自身不变时成立，
  //    S2 任何插入/删除都会让它假红；改为「按内容定位 MissingOpenField 的实现段」）
  const s2 = readFileSync(join(REPO, 'tools/observation-check/checks.mjs'), 'utf8').split(/\r?\n/);
  const hitIdx = s2.findIndex((l) => l.includes('MissingOpenField'));
  assert.ok(hitIdx >= 0, 'S2 checks.mjs 必须仍实现 MissingOpenField（缺列码的唯一实现处，§7 :208）');
  const win = s2.slice(Math.max(0, hitIdx - 12), hitIdx + 6).join('\n');
  assert.ok(/category|object|evidence|impact|suggestion/.test(win),
    `S2 的 MissingOpenField 实现附近应逐个判五列（内容锚窗口失效：${hitIdx + 1} 行前后无字段名）`);
  assert.ok(/evidence/.test(win), 'S2 的缺列实现还必须覆盖 evidence 列（§7 :208「判五列齐与 evidence」）');
  ```
  （**该内容锚的失效条件**：S2 把 `MissingOpenField` 的实现完全委托给另一个文件（本文件里只剩 import / re-export）时，窗口内不再出现字段名 → 断言红；此时须改锚到那个文件，**不得**改成 `assert.ok(true)`。）
- **红绿证据**：红 = 实现把缺列也判进 `validateOpenItems`（两段各判一半）→ ①② 两条红（H05 ③ 同时红）；红 = 缺列不报但三码也一起放过（把整个 open 面跳过）→ ③ 三条中至少一条实得 `(空)`；红 = `MissingOpenField` 进 S1 码表 → ④ 红；红 = S2 侧缺列实现被本段删改（越过 §2-3）→ ⑤ 内容锚红（找不到该内容）；绿 = §7 `:208` 的段间分工 + S2 仍在自己文件里实现该码。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：S2 侧缺列判据的**行为**（五列齐 / `evidence` 是否可解析）——本段只做存在性与内容对账，S2 的行为由其自身测试覆盖（§11-2 分工）；S2 内部的行号位置（**故意不锁**，见 ⑤ 的失效条件）。

### S1-TC-I01 `SubjectMismatch` 三态表

- **覆盖**：F-05 / spec §7 `SubjectMismatch`（`:200`）/ spec §7 `FreeTextEnum`（`:172` 的 `verdict` 面）/ spec §7 `:219`（入口对照：`verdict` 面 → `verdictAllowed` / `compareVerdicts`）/ spec §8 `:241` / spec §6 `verdictAllowed(subject, objectType, verdict)`（`:141`）/ PRD §3.5 `:206-208`
- **来源**：spec 推导（spec v6 `:200` / `:141` / `:172` / `:219` / `:241`）
- **前置**：`verdictAllowed` 三位置参已在 §6 `:141` 写死（v1 的 `{subject,objectType,verdict}` 单对象写法已作废）。
- **步骤**：用 `verdictAllowed(subject, objectType, verdict)` 走三态：类型不符 + `hit` / `miss` → 红；`na` → 绿；`objectType` 缺省（传 `undefined`，沿用 `subject`）+ `hit` → 绿；**`verdict = 'hit/miss'`（含 `/`，不在 `VERDICTS` 内）→ 只报 `FreeTextEnum`**（v6 `:219` 把该面归本入口）。
- **预期**：7 个断言如 PRD §3.5 + 1 条 `FreeTextEnum` 探针。
- **判据**：
  ```js
  const S = pickSubject(0);
  const V = (objectType, verdict) => SUB.verdictAllowed(S, objectType, verdict);
  for (const verdict of ['hit', 'miss']) {
    const r = V('artifact.report', verdict);
    assert.deepEqual(codes(r), ['SubjectMismatch'], `${verdict} + 类型不符应只报 SubjectMismatch，实得 ${codes(r)}`);
  }
  green(V('artifact.report', 'na'));
  green(V(S, 'hit'));
  green(V(undefined, 'hit'));                                     // objectType 缺省沿用 subject
  assert.ok(SUB.subjectMatches(S, S) !== false, 'subjectMatches 对同型必须为真');
  // v6 :172 / :219 / :241：verdict 含 `/` → FreeTextEnum（该面只由 verdictAllowed / compareVerdicts 判；码集去重，不锁条数）
  assert.deepEqual([...new Set(codes(V(S, 'hit/miss')))].sort(), ['FreeTextEnum'],
    `verdict 含 / → 应只报 FreeTextEnum（§7 :219 入口归属），实得 ${codes(V(S, 'hit/miss')).join('|') || '(空)'}`);
  assert.ok(!codes(V(S, 'hit/miss')).includes('SubjectMismatch'), '`hit/miss` 不在 VERDICTS → 不构成三态不匹配（不得夹带 SubjectMismatch）');
  ```
- **红绿证据**：红 = `na` 也被判红 → 第 3 条红（PRD「只能判不适用」）；红 = `objectType` 缺省不沿用 subject → 第 5 条红；红 = **`verdict` 面不判含 `/`**（只判三态）→ `V(S,'hit/miss')` 实得 `(空)`（v6 新增探针）；红 = 把 `verdict` 面判在 `validateCardModel`（卡上无该字段 → 永绿）→ 同一条实得 `(空)`；绿 = 三态表 + `FreeTextEnum` 探针。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：`verdictAllowed` 的返回形状若为布尔时的适配（§8 建议 #7）；同一 `id` 双报条数（S1-G-22 / §8 建议 #22，本断言按码集去重）。

### S1-TC-I02 `DisagreementOpen`：`compareVerdicts(docA, docB, env)` 两实例 verdict 不同 → 一条开放项

- **覆盖**：spec §7 `DisagreementOpen`（`:202`）/ spec §7 `FreeTextEnum`（`:172` + `:219` 的 `verdict` 面）/ spec §8 `:241` / spec §6 `:140`（入口名写死）/ PRD §3.4 `:203`（不取多数、不改判）
- **来源**：spec 推导（spec v6 `:202` / `:140` / `:172` / `:219` / `:241`）
- **前置**：`M.compareVerdicts` 由 `index.mjs` 导出（spec §3 `:41` / §6 `:140`；v1 暂定的 `auditDisagreement` 符号**已作废**）。若施工改用其它名字，本条即红 → 回流 spec，**不得改判据为 `assert.ok(true)`**。
- **步骤**：① 同 id 两实例 `hit` / `miss` → 恰一条 `DisagreementOpen`；② 两实例相同 → 无该码；③ 两实例 items 不同 id → 无该码；④ **两实例同写 `verdict = 'hit/miss'`（含 `/`）→ 只报 `FreeTextEnum`**、不得报 `DisagreementOpen`（v6 `:219` / `:241`）。
- **预期**：① 一码；②③ 零码；④ 码集 = `['FreeTextEnum']`（去重，不锁条数）。
- **判据**：
  ```js
  assert.equal(typeof M.compareVerdicts, 'function', 'spec :140 写死入口名 compareVerdicts，必须由 index 导出');
  const A = { items: [{ id: 'k01', verdict: 'hit' }], open: [] };
  const B = { items: [{ id: 'k01', verdict: 'miss' }], open: [] };
  const r = M.compareVerdicts(A, B, baseEnv());
  assert.deepEqual(codes(r), ['DisagreementOpen'], `应只报 DisagreementOpen，实得 ${codes(r)}`);
  assert.deepEqual(M.compareVerdicts(A, { items: [{ id: 'k01', verdict: 'hit' }], open: [] }, baseEnv()).errors, [], '两实例一致时不得报本码');
  assert.deepEqual(M.compareVerdicts(A, { items: [{ id: 'k02', verdict: 'miss' }], open: [] }, baseEnv()).errors, [], 'items 不同 id 不构成分歧');
  assert.equal(A.items[0].verdict, 'hit', '不得任一方改判（入参不被改写）');
  // ④ v6 :219 / :241：verdict 含 `/` → FreeTextEnum；两侧同值 → 不构成分歧（不得夹带 DisagreementOpen）
  const slashA = { items: [{ id: 'k01', verdict: 'hit/miss' }], open: [] };
  const slashB = { items: [{ id: 'k01', verdict: 'hit/miss' }], open: [] };
  const rSlash = M.compareVerdicts(slashA, slashB, baseEnv());
  assert.deepEqual([...new Set(codes(rSlash))].sort(), ['FreeTextEnum'],
    `verdict 含 / → 应只报 FreeTextEnum（§7 :219），实得 ${codes(rSlash).join('|') || '(空)'}`);
  assert.ok(!codes(rSlash).includes('DisagreementOpen'), '两侧同写 hit/miss → 不构成分歧，不得报 DisagreementOpen');
  ```
- **红绿证据**：红 = 入口未导出 → 第 1 组抛（这正是「§3 `:41` 未列该入口」的暴露）；红 = 实现取多数/任一方胜出 → 第 2 条 `codes` 非 `['DisagreementOpen']`；红 = 实现写回某一方的 `verdict` → 末条红；红 = **`verdict` 面不在本入口判**（只在 `verdictAllowed` 判）→ ④ 实得 `(空)`；绿 = 落一条开放项 + `FreeTextEnum` 探针。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：落下的开放项五列内容（AI / 人工填，脚本只判存在）；同一 `id` 双报条数（S1-G-22 / §8 建议 #22，本断言按码集去重）。

### S1-TC-I03 `UnverifiableOutput` 的第二个判定面：`subject` ∉ `SUBJECT_VALIDATORS`

- **覆盖**：spec §7 `UnverifiableOutput`（`:203`，两个判定面之一）/ spec §6（`:152`）
- **来源**：spec 推导（spec v5 `:203`）
- **前置**：`SUBJECT_VALIDATORS` 不含 `artifact.not-registered`（行内已断）。
- **步骤**：把检查项 `subject` 改成未登记值 → 红且报该码（异常面已由 D03 覆盖，二者分开记账）。
- **预期**：一码。
- **判据**：
  ```js
  const bad = run((c) => { c.checkItems[0].subject = 'artifact.not-registered'; });
  assert.ok(codes(bad).includes('UnverifiableOutput'), `subject 未登记应报 UnverifiableOutput，实得 ${codes(bad)}`);
  assert.ok(!codes(bad).includes('MissingSubject'), `不得同时报 MissingSubject（同一 subject 面归一码），实得 ${codes(bad)}`);
  const ok = run((c) => { c.checkItems[0].subject = pickSubject(0); });
  green(ok);
  ```
- **红绿证据**：红 = 未登记 subject 被当成 `MissingSubject` → 第 2 组红（两码判同一面 → 与 §8 精神冲突，需 spec 明示优先）；绿 = 归 `UnverifiableOutput`。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：卡级异常（card 非对象 → §7 缺口 S1-G-14）。

### S1-TC-I04 `WeakReason` 不进脚本码表（V-5，第三方：PRD 原文）

- **覆盖**：V-5 / spec §7 manual 行（`:204`）/ §6 `:147` / spec §2-6 / PRD `:216`
- **来源**：spec 推导
- **第三方通道**：判据一侧读 PRD `:216` 原文（「它是 `check:'manual'` 条目，不是脚本码」），另一侧读码表键集 —— 两边都不是本文件作者构造的数据。
- **前置**：PRD 文件可读；`CARD_MODEL_CODES` 已由 `index.mjs` 导出。
- **步骤**：① 读 PRD `:216` 断其明写 manual；② 断 `CARD_MODEL_CODES` 恰 36 键且不含 `WeakReason`；③ 副本注入自证判据非恒真。
- **预期**：②通过；③副本必红。
- **判据**：
  ```js
  const prd = readFileSync(join(REPO, 'docs/prd/20261026205821-agent-card-contract.md'), 'utf8').split(/\r?\n/);
  assert.ok(prd[215].includes('manual') && prd[215].includes('WeakReason'), `PRD :216 应明写 WeakReason 是 manual；实得 ${prd[215]}`);
  const keySet = Object.keys(M.CARD_MODEL_CODES);
  assert.equal(keySet.length, 36, `前置：码表必须恰 36 键（spec v5 :147），实得 ${keySet.length}`);
  assert.ok(!keySet.includes('WeakReason'), `脚本码表不得含 WeakReason，实得 ${keySet.filter((k) => /Weak/.test(k))}`);
  const tampered = [...keySet, 'WeakReason'];
  assert.ok(tampered.includes('WeakReason'), '副本注入后必含（证明上式不是恒真）');
  assert.equal(S1_CODES.includes('WeakReason'), false);
  ```
- **红绿证据**：红 = 把 `WeakReason` 加进码表（凑 37 键）→ 第 2/3 组红（V-5 的负例即此）；红 = `CARD_MODEL_CODES` 未导出 → 抛 `TypeError`；绿 = 码表恰 36 键且无 `WeakReason`。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：`WeakReason` 的人工抽查流程（§7 末行写「人力按 §3.6 抽查」，本段不实现）。

### S1-TC-J01 全字段卡正向（F-01 / F-04）

- **覆盖**：V-7 / F-01 / F-04 / spec §4 形状 / spec §5 枚举
- **来源**：spec 推导
- **前置**：基线卡已绿（B05）；`M.SIGNALS` / `M.MOMENTS` / `M.REPEATS` 均非空。
- **步骤**：在基线卡上叠加：局部 scene（label+why+被引用）、第二类信号、三型 checkItem（script 带 cmd / ai 配齐 / manual 带 declarer）、`categories` 两条 → 断绿。
- **预期**：`ok === true`，且各枚举取值全部来自封闭表（写法上不写死字符串）。
- **判据**：
  ```js
  const rich = baseCard();
  rich.scenes.push({ id: 'local.extra', label: '局部场景', why: '本席专用' });
  const sig = Object.keys(M.SIGNALS)[1];
  rich.signals.push({ type: sig, observer: '轮末快照', match: '产物出现' });
  rich.must.push({ ...rich.must[0], id: 'observe2', trigger: { scene: 'local.extra', moment: Object.keys(M.MOMENTS)[1], repeat: Object.keys(M.REPEATS)[1] } });
  rich.categories.push({ key: 'observe2', label: '补充观察项' });
  rich.checkItems.push({ id: 'k02', subject: pickSubject(0), label: `${SUB.SUBJECTS[pickSubject(0)].display}补充行`, criterion: '补充行带路径与行号', check: 'script', cmd: 'node tools/docgen/cli.mjs gate' });
  const r = M.validateCardModel(rich, baseEnv());
  green(r);
  for (const s of rich.scenes) assert.ok(M.SHARED_SCENES[s.id] || s.why, `局部场景 ${s.id} 必须带 why`);
  ```
- **红绿证据**：红 = 第二型 `checkItem` 强制要求 `rubric`（`script` 不该要求）→ 该卡红；红 = 局部 scene 的第二条动作没被算作「引用」→ `UnusedScene` 红；绿 = 全字段合法。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：`ai` 条目的 rubric 内容质量（G04 只判结构）。

### S1-TC-J02 合并族：`OVERRIDABLE_FIELDS` 精确集合 + 三码各一构造（F-03）

- **覆盖**：F-03 / spec §7 合并族（3 码，`:206`）/ §10-D9 `:268` / **§10-D19 `:278`（合并与四入口分离）** / §6 `:142`（`mergeActions(shared, own) → {ok, errors}`）/ §6 `:147`（合并码**不入** `CARD_MODEL_CODES`、`validateCardModel` **不执行合并**）/ §6 `:218`（入口对照表末行）
- **来源**：spec 推导（spec v5 `:206`（字段集合 `OVERRIDABLE_FIELDS = ['kind','trigger','objects','criterion','landing','requires']`）+ `:147`「`mergeActions()` 的 3 个合并码不在 `CARD_MODEL_CODES` 里、也不经上述四入口——合并是独立调用，`validateCardModel` **不执行合并**」）
- **前置**：`merge.mjs` 的 `mergeActions` 入参形状 spec `:142` 写为 `mergeActions(shared, own)` → 本条按「共用动作表 + 本席动作表」两参调用。
- **步骤**：① 断 `OVERRIDABLE_FIELDS` 精确集合（含 `kind`、`objects`）；② 三码各一构造，且断言返回值形状是 **`{ok, errors}`**（不是裸 `errors` 数组）；③ 断言覆盖成功时 `overrides[].changed` 覆盖全部可覆盖字段；④ **分离纪律**：三合并码都**不在** `CARD_MODEL_CODES`；⑤ **含覆盖动作的卡经 `validateCardModel` 不返回任何合并码**。
- **预期**：集合逐字相等；三码可判且 `ok === false`；`changed` ⊆ `OVERRIDABLE_FIELDS`；④ 断言过；⑤ 只报本段自己的码、绝无合并码。
- **判据**：
  ```js
  assert.deepEqual(MG.OVERRIDABLE_FIELDS, ['kind', 'trigger', 'objects', 'criterion', 'landing', 'requires'],
    'PRD §3.3 :187 要求含 kind；S2 render.mjs 的 39 行 的旧表缺 kind/objects（登记 §11-1，本段不修）');
  const base = { id: 'a01', kind: 'must', trigger: { scene: 'issue.card', moment: 'start', repeat: 'once' }, objects: ['x.md'], criterion: 'ledger.row.exists', landing: 'review.dir', requires: [] };
  // ② 三码 + 返回形状（v5 §6 `:142` 写死 {ok, errors}）
  const dup = MG.mergeActions([base], [{ ...base }]);
  assert.deepEqual(dup.errors.map((e) => e.code), ['DuplicateStatement']);
  assert.equal(dup.ok, false, 'mergeActions 返回 {ok, errors}（spec :142）：有合并码时 ok 必须为 false');
  const noReason = MG.mergeActions([base], [{ ...base, objects: ['y.md'] }]);
  assert.deepEqual(noReason.errors.map((e) => e.code), ['OverrideWithoutReason']);
  assert.equal(noReason.ok, false, '同上：{ok, errors} 形状');
  const pointless = MG.mergeActions([base], [{ ...base, reason: '改了' }]);
  assert.deepEqual(pointless.errors.map((e) => e.code), ['PointlessOverride']);
  assert.equal(pointless.ok, false, '同上：{ok, errors} 形状');
  const good = MG.mergeActions([base], [{ ...base, kind: 'never', reason: '升级为禁止' }]);
  assert.deepEqual(good.errors, []);
  assert.equal(good.ok, true, '无合并码时 ok 必须为 true');
  assert.ok(good.overrides.length === 1 && good.overrides[0].changed.length >= 1);
  for (const k of good.overrides[0].changed) assert.ok(MG.OVERRIDABLE_FIELDS.includes(k), `changed 含不可覆盖字段 ${k}`);
  assert.ok(good.overrides[0].changed.includes('kind'), 'kind 必须算可覆盖字段（PRD :187 明文，S2 旧表缺它）');
  // ④ 分离纪律（v5 §6 `:147` / `:218`）：3 个合并码都不在唯一码表里
  for (const c of MERGE_CODES) {
    assert.ok(!Object.keys(M.CARD_MODEL_CODES).includes(c), `合并码 ${c} 不得进 CARD_MODEL_CODES（spec :147）`);
  }
  // ⑤ 含覆盖动作的卡经 validateCardModel **不返回任何合并码**
  const cover = baseCard();
  cover.must.push({ ...cover.must[0], id: 'observe', objects: ['y.md'], reason: '改宾语' });   // 同 id 跨层覆盖的形态
  const rCover = M.validateCardModel(cover, baseEnv());
  for (const c of MERGE_CODES) {
    assert.ok(!codes(rCover).includes(c), `validateCardModel 不执行合并（spec :147 / D19）：实得 ${codes(rCover).join('|')}`);
  }
  assert.equal(typeof MG.mergeActions, 'function', '合并码只能由 mergeActions 发出（入口对照表 :218 末行）');
  ```
- **红绿证据**：红 = 沿用 S2 的 `['trigger','text','criterion','landing']` → 第 1 组+末组双红（这正是 §11-1 副本的偏差）；红 = `PointlessOverride` 不比较 `kind` → `{kind:'never'}` 仍判「零差异」→ 第 5 组红；红 = **`mergeActions` 返回裸数组**（`errors` 不包 `ok`）→ ② 的 `ok` 断言红；红 = **把合并码塞进 `CARD_MODEL_CODES`**（B01 的 36 键会变 39）→ ④ 红 + B01 三方相等同时红；红 = **让 `validateCardModel` 顺手跑合并**（「万能校验」）→ ⑤ 红（且与 `code ∈ CARD_MODEL_CODES` 直接冲突，正是 D19 要堵的形态）；绿 = 六字段集合 + 分离纪律。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：S2 侧的 `personalActions` 改造（§11-1 明写本段不修）；合并的**业务触发时机**（PRD `:187` 未定，属 S4 卡面管线）。

### S1-TC-J03 `registeredIdsOf()` 并集去重 + S2 常量未被改（V-8）

- **覆盖**：V-8 / spec §4 `registeredIds` 行（`:90`）/ §6 `:154`（**registeredIds 单源**：`env.registeredIds` 必须由 `registeredIdsOf(本轮全部卡)` 构造，四入口不自行派生、不回退常量）/ §11-3 `:289`
- **来源**：spec 推导（spec v5 `:90` + `:154`「若 `env.registeredIds` ≠ `registeredIdsOf(cards)` → `validateOpenItems` 返回 `UnverifiableOutput`（`path = env.registeredIds`）」）
- **前置**：`baseCard().checkItems` 恰 1 条且 id = `k01`。
- **步骤**：① 两张卡（id 有重叠）→ 并集去重；② **单源对账**：`baseEnv().registeredIds` 与 `registeredIdsOf([baseCard()])` 集合相等；③ `env.registeredIds` 被人为改掉（≠ `registeredIdsOf(cards)`）→ 经 `validateOpenItems(doc, env, cards)` 报 `UnverifiableOutput`（path `env.registeredIds`）；④ 读 S2 的 `registered-ids.mjs` 断其内容**未变**。
- **预期**：并集 = 去重后的 id 集合；单源一致；不一致时恰一码 `UnverifiableOutput`（path `env.registeredIds`）；S2 文件仍是三条手工 id。
- **判据**：
  ```js
  const a = baseCard();
  const b = baseCard();
  b.checkItems = [{ ...b.checkItems[0], id: 'k02' }, { ...b.checkItems[0], id: 'k01', criterion: '另一条判据文本' }];
  const ids = M.registeredIdsOf([a, b]);
  const want = ['k01', 'k02'];
  assert.deepEqual([...ids].sort(), want, `并集去重应为 ${want}，实得 ${[...ids]}`);
  assert.ok(ids.has('k01') && ids.has('k02'));
  // ② 单源对账（v5 §6 `:154`）：env 里的 registeredIds 与派生结果必须集合相等
  assert.deepEqual([...baseEnv().registeredIds].sort(), [...M.registeredIdsOf([baseCard()])].sort(),
    'env.registeredIds 必须由 registeredIdsOf(本轮全部卡) 构造（单源，spec :154）');
  // ③ 不一致 → UnverifiableOutput（path env.registeredIds），而不是「静默用 env 的错值」
  const wrongEnv = baseEnv({ registeredIds: new Set(['k01', 'ghost-id']) });
  only(M.validateOpenItems(baseDoc(), wrongEnv, [baseCard()]), 'UnverifiableOutput', 'env.registeredIds');
  // ④ S2 常量未被改（§11-3）
  const s2 = readFileSync(join(REPO, 'tools/observation-check/registered-ids.mjs'), 'utf8');
  assert.ok(/REGISTERED_IDS\s*=\s*\[\s*'k01'\s*,\s*'k02'\s*,\s*'k03'\s*\]/.test(s2), 'S2 的 REGISTERED_IDS 不得被本段改动（§11-3：S1 只提供派生，不切常量）');
  ```
- **红绿证据**：红 = 派生用 `flat()` 不去重 → 第 1 组红；红 = `baseEnv().registeredIds` 手写常量（不派生）→ ② 红；红 = **`validateOpenItems` 不核对第三参 `cards`**（第三参被忽略 / 不派生）→ ③ 实得 `(空)`；红 = 顺手把 S2 常量删了 → ④ 红（这条正是 §11-3 的「不修 S2」守卫）；绿 = 并集去重 + 单源 + 不一致即报码。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：切换到派生常量的时点（§11-3 归 S4 首次重生成）；`cards` 缺省（不传第三参）时的行为（spec `:139` 把 `cards` 列为必传，缺参形态未给码 → §7 缺口登记）。

### S1-TC-J04 `registeredIdsOf()` 三边界（空集为期望值，不是空集上 `every`）

- **覆盖**：V-8 边界 / spec §4
- **来源**：spec 推导
- **前置**：`baseCard().checkItems` 恰 1 条（单卡形态的期望值 = 只含 k01 的集合）。
- **步骤**：① 单卡 → 该卡 id 集合；② 无 `checkItems` 卡 → **期望空集**（显式断 `size === 0`）；③ 重复 id → 去重。
- **预期**：① `['k01']`；② `size === 0`（显式）；③ `size === 1`。
- **判据**：
  ```js
  assert.deepEqual([...M.registeredIdsOf([baseCard()])], ['k01']);
  const empty = baseCard();
  empty.checkItems = [];
  const r = M.registeredIdsOf([empty]);
  assert.equal(r.size, 0, '无检查项时必须显式得到空集（不得靠「空集上 every 恒真」蒙过）');
  assert.equal(typeof r.has, 'function', '返回必须是 Set 形（否则下游 `.has` 调用点全崩）');
  const dupe = baseCard();
  dupe.checkItems = [{ ...dupe.checkItems[0] }, { ...dupe.checkItems[0] }];
  assert.equal(M.registeredIdsOf([dupe]).size, 1, '重复 id 必须去重');
  ```
- **红绿证据**：红 = 返回数组且未去重 → 第 3 组红；红 = 无 `checkItems` 时返回 `undefined` → 第 2 组抛（不是 `size === 0`）；绿 = Set + 去重。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：跨卡重复时的「谁登记」追责（本段只判集合）。

### S1-TC-J05 与 S6 双向零耦合（V-6）

- **覆盖**：V-6 / spec §3 依赖方向（`:52`）/ spec §2-2
- **来源**：spec 推导（spec v5 `:52` / `:252`）
- **第三方通道**：只看文件文本里的 import 语句（静态扫描，不看实现内部）。
- **前置**：`card-model/` 与 `policy/` 两目录都存在且各有 `.mjs`（行内已断）。
- **步骤**：① 列 `card-model/**` 全部 `.mjs`（**先断非空**），扫 `policy/` 引用；② 列 `policy/**` 全部 `.mjs`，扫 `card-model` 引用。
- **预期**：两侧零命中。
- **判据**：
  ```js
  const walk = (dir, out = []) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p, out);
      else if (e.name.endsWith('.mjs')) out.push(p);
    }
    return out;
  };
  const cmFiles = walk(CM_DIR);
  assert.ok(cmFiles.length >= 9, `前置：card-model 至少 9 个模块（spec §3），实得 ${cmFiles.length}`);
  const importLines = (p) => readFileSync(p, 'utf8').split(/\r?\n/).filter((l) => /^\s*(import|export)\s/.test(l));
  for (const p of cmFiles) {
    const bad = importLines(p).filter((l) => /policy\//.test(l));
    assert.deepEqual(bad, [], `${p} 不得 import policy/**（V-6 单向）`);
  }
  const polFiles = walk(join(REPO, 'tools/docgen/policy'));
  assert.ok(polFiles.length >= 7, `前置：policy 下至少 7 个模块，实得 ${polFiles.length}`);
  for (const p of polFiles) {
    const bad = importLines(p).filter((l) => /card-model/.test(l));
    assert.deepEqual(bad, [], `${p} 不得反向 import card-model（V-6 双向）`);
  }
  ```
- **红绿证据**：红 = `card-model` 里 `import { SEATS } from '../policy/definitions/seats.mjs'` → 第 1 组红；红 = `policy` 里出现 `card-model` 反向引用 → 第 2 组红；红 = 目录为空时「零命中」恒真 → 两条前置断言拦住（禁恒真的样板）。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：运行时耦合（如动态 `import()` 拼串）——本段只判静态 import 行（残余写入 §7 缺口 S1-G-13）。

### S1-TC-J06 依赖方向：只 `node:` 与自身，不碰 S2 与 `components/`

- **覆盖**：spec §3 依赖方向（`:52`）/ spec §2-2 / spec §2-3
- **来源**：spec 推导（spec v5 `:52`）
- **前置**：`card-model/` 已落且至少 1 个 `.mjs` 模块。
- **步骤**：扫 `card-model/**` 的 import 说明符：只允许 `node:` 前缀与相对路径（且相对路径解析后仍在 `card-model/` 内）。
- **预期**：零越界。
- **判据**：
  ```js
  const specs = (p) => [...readFileSync(p, 'utf8').matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
  for (const p of walk(CM_DIR)) {
    for (const s of specs(p)) {
      const okNode = s.startsWith('node:');
      const resolved = s.startsWith('.') ? join(dirname(p), s) : null;
      const okSelf = resolved && resolved.startsWith(CM_DIR);
      assert.ok(okNode || okSelf, `${p}: 依赖 ${s} 越界（只许 node: 标准库与 card-model 内相对路径）`);
    }
  }
  ```
- **红绿证据**：红 = `import { SHARED_ACTIONS } from '../observation-check/data.mjs'` → 红（这会把 S2 的演示数据拖进 S1）；红 = 用 `../../execution-matrix/markdown-rows.mjs` → 红（跨工具耦合）；绿 = 只依赖标准库与自身。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：第三方依赖（`package.json` 未增依赖这点由 J05/J06 的说明符白名单间接守住；**不新增依赖**是 spec §3「只依赖 node 标准库」的直接后果）。

### S1-TC-K01 env 11 键接口逐键对账 + 缺键 → `UnverifiableOutput`（path `env.<键>`）+ registeredIds 单源

- **覆盖**：spec §6 env 接口（`:143-144`）/ §6 缺键纪律（`:153`）/ §6 registeredIds 单源（`:154`）/ 事实 8 / 事实 9
- **来源**：spec 推导（spec v5 `:143-144` 11 键；`:153`「`env` 缺**任一**键 → 返回 `UnverifiableOutput`（`path = env.<键名>`）并**继续判**（不 fail-fast、不 `undefined` 兜底）；`card` / `doc` 非对象同此码」；`:154`「若 `env.registeredIds` ≠ `registeredIdsOf(cards)` → `validateOpenItems` 返回 `UnverifiableOutput`（`path = env.registeredIds`）」）
- **前置**：`ENV_KEYS` 与 spec v5 §6 `:143-144` 的 11 键逐字一致（本文件写死）。
- **步骤**：① `baseEnv()` 的键集与 `ENV_KEYS`（= §6 写死的 11 键）**双向相等**；② 逐缺一键（连 `{}` 全缺）→ 不抛、`ok === false`，且 **errors 恰为 `UnverifiableOutput`、path = `env.<缺的键>`**；③ **继续判**：缺 `predicates` 且卡另有 `rationale` 空白 → 两条并存（`UnverifiableOutput` + `MissingRationale`）；④ `env.registeredIds` ≠ `registeredIdsOf(cards)` → `validateOpenItems(doc, env, cards)` 报 `UnverifiableOutput`（path `env.registeredIds`）；⑤ 基线 env → 绿。
- **预期**：① 11 == 11；② 每个缺键各一条 `UnverifiableOutput`（path 精确到键名）；③ 双码并存；④ 恰一码；⑤ 绿。
- **判据**：
  ```js
  assert.deepEqual(Object.keys(baseEnv()).sort(), [...ENV_KEYS].sort(),
    'baseEnv 必须与 spec v5 §6 :143-144 的 11 键双向相等（缺一 = 少注入，多一 = 私自扩接口）');
  assert.equal(ENV_KEYS.length, 11, `§6 的 env 应为 11 键，实得 ${ENV_KEYS.length}`);
  // ② 缺键 → UnverifiableOutput，path = env.<键>（v5 §6 :153 已写死归码，不再是「只判 fail-closed」）
  const emptyEnv = {};                                     // 全缺：每个键各报一条，证明逐键判而不是「第一个缺键就停」
  let rAll;
  assert.doesNotThrow(() => { rAll = M.validateCardModel(baseCard(), emptyEnv); }, 'env 全缺不得冒泡');
  assert.equal(rAll.ok, false, 'env 缺键必须 fail-closed（不得默认全绿）');
  for (const key of ENV_KEYS) {
    const miss = rAll.errors.filter((e) => e.code === 'UnverifiableOutput' && String(e.path) === `env.${key}`);
    assert.ok(miss.length >= 1, `缺 ${key} 应报 path=env.${key} 的 UnverifiableOutput，实得 ${JSON.stringify(rAll.errors.map((e) => [e.code, e.path]))}`);
  }
  assert.deepEqual([...new Set(codes(M.validateCardModel(baseCard(), {})))].sort(), ['UnverifiableOutput'],
    'env 全缺时只允许 UnverifiableOutput（不得夹带别的码，也不得用 undefined 兜底把别的码放过）');
  // ③ 继续判（不 fail-fast）：缺 predicates + rationale 空白 → 两码并存
  const bothGap = baseCard();
  bothGap.rationale = '   ';
  const eNoPred = baseEnv(); delete eNoPred.predicates;
  assert.deepEqual([...new Set(codes(M.validateCardModel(bothGap, eNoPred)))].sort(), ['MissingRationale', 'UnverifiableOutput'],
    'env 缺键后必须继续判后续条目（spec :153「并继续判」）');
  // ④ registeredIds 单源（:154）：与派生不一致 → UnverifiableOutput（path env.registeredIds）
  only(M.validateOpenItems(baseDoc(), baseEnv({ registeredIds: new Set(['k01', 'ghost-id']) }), [baseCard()]),
    'UnverifiableOutput', 'env.registeredIds');
  green(run());
  ```
- **红绿证据**：红 = ③ 段实现只收 9 键（漏 `seatSignals` / `subjects` / `registeredIds`）→ 第 1 组红；红 = 缺键时直接 `TypeError` 冒泡 → `doesNotThrow` 红；红 = 缺键按空集兜底（`seatSignals ?? {}`）→ `ok === false` 红（fail-open）；红 = **缺键只报一条、不逐键**（`Object.keys(env).length < 11` 就 `return` 一个泛化错误）→ ② 的逐键 `path=env.<key>` 断言红；红 = **缺键后直接 return**（fail-fast）→ ③ 少了 `MissingRationale`；红 = **`registeredIds` 不核对 `cards`** → ④ 实得 `(空)`；绿 = 11 键 + 逐键归码 + 继续判 + 单源。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：`cards` 第三参**完全不传**时的归码（spec `:139` 只写必传，未给缺参码 → §7 缺口）；`env` 某键**类型错**（如 `predicates` 传数组）时的归码（spec `:153` 只写「缺」，类型错归异常收敛，D03 已覆盖 `has` 抛异常这一形态）。

### S1-TC-K02 §4 v2 已列 `cmd?`/`impl?` 可注入，未列字段不做 closed-world

- **覆盖**：spec §4 `CheckItem`（`:73-74` 已列 `cmd?` / `impl?`）/ spec §7 `FalseScriptCheck`（`:182`）/ spec §4「形状不做的三件事」（`:92`）
- **来源**：spec 推导（spec v5 `:73-74` 补了 `cmd?`/`impl?`，v1 的「§4 形状外字段」表述已作废）
- **前置**：`baseCard().checkItems[0]` 是 `manual` 条目，可改 `check` 值。
- **步骤**：`script` 条目带 `cmd` → 绿；带 `impl`（谓词实现名）→ 绿；两者都缺 → 红（B03 已覆盖）；另在卡上挂 `evidenceRequired`（PRD `:199` 有、spec §10-D22 `:281` 声明本段不判）→ **不得**因此判红（只判 §7 有码的面）。
- **预期**：前三符合；第四绿（未列字段不构成红点）。
- **判据**：
  ```js
  green(run((c) => { c.checkItems[0] = { ...c.checkItems[0], check: 'script', cmd: 'node tools/docgen/cli.mjs gate' }; }));
  green(run((c) => { c.checkItems[0] = { ...c.checkItems[0], check: 'script', impl: 'ledger.row.exists' }; }));
  only(run((c) => { c.checkItems[0] = { ...c.checkItems[0], check: 'script' }; }), 'FalseScriptCheck', 'checkItems[0]');
  green(run((c) => { c.checkItems[0] = { ...c.checkItems[0], check: 'script', cmd: 'x', evidenceRequired: true }; }));
  ```
- **红绿证据**：红 = 校验器做 closed-world 字段检查（未知字段即红）→ 第 1/2/4 组红；红 = 只认 `cmd` 不认 `impl` → 第 2 组红（v3 `:73-74` 两键并列，缺一即不完整）；绿 = 只判 §7 有码的面。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：`impl` 的解析语义（是否要能在 `env.predicates` 里查到 → §8 建议 #4 余项）；`evidenceRequired` 的归码（**spec §10-D22 `:281` 声明本段不判** → §7 缺口 S1-G-23）。

### S1-TC-K03 `open[].evidence` 的**内容**本段不判（边界划在 S1/S2 之间）

- **覆盖**：spec §4「本段不判 evidence 可解析性」（`:89`）/ spec §2-1 / PRD §4.3（证据七道归 S2）
- **来源**：**实现观察（补充）**（S2 已有七道校验 `evidence.mjs`，S1 若重复判会出双码）
- **前置**：`runDoc()` 在位（开放项走 `validateOpenItems`）。
- **步骤**：`evidence` 写不可解析串（无 `path:line` 形态）→ 本段零码；写 `path:line` 形态 → 同样零码。
- **预期**：两形态都绿（S1 只判「有没有这一列」，不判「能不能解析」）。
- **判据**：
  ```js
  const mk = (evidence) => (d) => { d.open = [{ ...openItem(), evidence }]; };
  green(runDoc(mk('随便一句话，没有行号')));
  green(runDoc(mk('agents/detective-observer.md:12')));
  ```
- **红绿证据**：红 = S1 也判「证据必须含 `path:line`」→ 第 1 条红（同一件事两处判，与 §11-2「两段不重叠」冲突）；绿 = 只判列存在。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：证据七道本身（S2 已签交付，本段不碰）。

### S1-TC-K04 四入口各自只报自己那族码（§6 入口分工）

- **覆盖**：spec §6「入口分工」（`:158`）/ §3 `:47-48`（**四入口**：`validateCardModel` / `validateOpenItems` / `compareVerdicts` / `verdictAllowed`）/ §6「非卡片字段」（`:155`，**open-world**）/ §6 `:147`（合并码不经四入口）/ 事实 9 / spec §4 `ObservationDoc` 不属卡片数据（`:77-78`）
- **来源**：spec 推导（spec v6 `:158`「卡片数据只走 `validateCardModel`；开放项走 `validateOpenItems`；双实例 verdict 走 `compareVerdicts`；单条三态走 `verdictAllowed`；合并走 `mergeActions`」+ `:155` open-world + `:147`「合并是独立调用，`validateCardModel` **不执行合并**」+ `:47-48`「**四个入口**」）
- **前置**：**四入口**（`validateCardModel` / `validateOpenItems` / `compareVerdicts` / `verdictAllowed`）均导出；`baseCard()` 为绿基线。
- **步骤**：① 在合法的 `baseCard()` 上挂 `open: []` + `openEmptyReason: '  '`（非卡片数据、且开放项码的触发条件成立）→ `validateCardModel` **不得**报开放项族码；①b 再挂一个完全未列的字段（`evidenceRequired: true`）→ 同样零码（open-world）；② 给 `validateOpenItems` 一份「卡级面本该红」的文档（`items` 里放不匹配的 subject；`doc` 本身无卡字段）→ 只可能报开放项族，**不得**报卡级码（`MissingRationale` / `MixedTermInCard` 等）；③ `compareVerdicts` 的输入 `items` 含 subject 不匹配的条目 → **不得**报 `SubjectMismatch`（该码由 `verdictAllowed` 单独判）；③b **`verdictAllowed` 只发自己的族**（返回里不得出现卡级 / 开放项族码）；④ `validateCardModel` 的返回里**永不出现合并码**（含覆盖动作的卡）。
- **预期**：①①b 零码；② 零码（`open` 合法 + 理由在位的文档）；③③b 零码（③b 只含 `SubjectMismatch`）；④ 零合并码。
- **判据**：
  ```js
  const leaky = baseCard();
  leaky.open = [];
  leaky.openEmptyReason = '   ';
  assert.deepEqual(codes(M.validateCardModel(leaky, baseEnv())), [],
    '开放项不属卡片数据（spec :77-78）：validateCardModel 不得报开放项族码（入口分工 :158）');
  // ①b open-world（:155）：本 spec 未列的字段一律忽略，不得判红
  const unknownField = baseCard();
  unknownField.evidenceRequired = true;
  unknownField.openEmptyReason = '   ';
  assert.deepEqual(codes(M.validateCardModel(unknownField, baseEnv())), [],
    'Card 上的未列字段必须忽略不判（§6 :155 open-world）；若判红说明实现做了 closed-world 字段检查');
  const cardish = { items: [{ id: 'k01', objectType: 'artifact.report', verdict: 'hit' }], open: [], openEmptyReason: '无补充' };
  const rDoc = M.validateOpenItems(cardish, baseEnv(), [baseCard()]);
  assert.ok(!codes(rDoc).includes('MissingRationale'), `validateOpenItems 不得报卡级码，实得 ${codes(rDoc)}`);
  assert.ok(!codes(rDoc).includes('SubjectMismatch'), `SubjectMismatch 不归 open 入口，实得 ${codes(rDoc)}`);
  const rCmp = M.compareVerdicts(cardish, { items: [{ id: 'k01', objectType: 'artifact.report', verdict: 'hit' }], open: [] }, baseEnv());
  assert.ok(!codes(rCmp).includes('SubjectMismatch'), `compareVerdicts 不得报 SubjectMismatch（由 verdictAllowed 单独判，spec :141），实得 ${codes(rCmp)}`);
  // ③b 第四个入口（validateCardModel / validateOpenItems / compareVerdicts / verdictAllowed）各自只报自己的族
  const rVa = SUB.verdictAllowed(pickSubject(0), 'artifact.report', 'hit');
  assert.deepEqual(codes(rVa), ['SubjectMismatch'], `verdictAllowed 只应报 SubjectMismatch，实得 ${codes(rVa).join('|') || '(空)'}`);
  for (const k of ['MissingRationale', 'EmptyOpenWithoutReason', 'DuplicateScene', 'VagueReferent']) {
    assert.ok(!codes(rVa).includes(k), `verdictAllowed 不得报 ${k}（四入口分工，spec :158 / :47-48）`);
  }
  // ④ 合并不经四入口（:147）：含覆盖动作的卡，validateCardModel 也绝不返回合并码
  const cover = baseCard();
  cover.must.push({ ...cover.must[0], id: 'observe', objects: ['y.md'], reason: '改宾语' });
  for (const c of MERGE_CODES) {
    assert.ok(!codes(M.validateCardModel(cover, baseEnv())).includes(c),
      `validateCardModel 不执行合并（:147）：不得返回 ${c}`);
  }
  ```
- **红绿证据**：红 = 把开放项三码塞进 `validateCardModel`（做一个「万能校验」）→ 第 1 组红（违 `:158`）；红 = **做 closed-world 字段检查**（`Card` 上出现未列字段即红）→ ①b 红（这正是 `:155` 要堵的形态）；红 = `validateOpenItems` 顺手判卡级 `rationale` → 第 2 组红；红 = `compareVerdicts` 顺手判三态 → 第 3 组红；红 = **`verdictAllowed` 顺手判卡级 / 开放项族** → ③b 红（v6 新增，正对 §3 `:47-48` 的四入口）；红 = `validateCardModel` 顺手跑合并 → ④ 红；绿 = 四入口 + 合并各守自己的族，未列字段一律忽略。
- **对应测试**：`tools/docgen/test/card-model.test.mjs`
- **不覆盖**：`verdictAllowed` 自身的三态语义（I01 已钉）与 `FreeTextEnum` 面（I01 / I02）；`mergeActions` 的三码（J02）；非卡片字段的**语义解释**（spec 只要「忽略」，不要求解释其内容 → 原 §7 缺口 S1-G-14 由 `:155` 闭合）。

---

## 3 负例与边界汇总（按组）

| 组 | 用例数 | 正 | 负 | 边界 | 备注 |
|---|---|---|---|---|---|
| A（枚举表 / V-1） | 5 | 1 | 3 | 1 | A04 为第三方原文对账；**A05 为词表 / 单位 / 程序词 / 指针词的全成员对账（v5 新增，v6 起三组词表从 spec 原文切）** |
| B（36 码表驱动 / V-2） | 5 | 1 | 3 | 1 | B01 完备性（**v6 增值形态断言：字段引用 + 不含行号**）、B05 对照绿；**B02 的 `rows.every((r) => r.code)` 恒真断言已删，换成「每行必须有 `mutate`/`fn`」前置** |
| C（M1 / M2 / V-3） | 3 | 0 | 0 | 3 | **§8 八组（序号 1–8 = `:230-237`；7 组真双命中 + 组 6 误实现对位）** + M2 判定面粒度（`:226`）+ M1 + 表达式族两码分工 |
| D（纯函数 / V-4） | 4 | 2 | 0 | 2 | 冻结 / 快照 / 异常（含畸形入参）/ 顺序 |
| E（场景 / 信号 / 落点） | 7 | 2 | 2 | 3 | E01 / E07 按 **最长已登记前缀 + 第三档两形态（`:180`）**（`deliverable.body/row` 与 `review.dir/x` 绿、`review.dir` 未赋值红） |
| F（动作） | 5 | 1 | 3 | 1 | F03 钉**两个判定面**（`Action.criterion` + `CheckItem.criterion`，`§7 :181`）；F05 钉 §4.1 的两个 `criterion` 分形 |
| G（检查项 / 判据文本 / 卡面文本） | 9 | 1 | 4 | 4 | G06/G07/G08 为假阳性守卫；G07 钉 §7 `:187` 的 `N` 字符面；**G04 六形态 + rubric 缺 `source` 收口（§10-D16 `:275`）**；**G09 钉 §4.2 `:112` 的八键形态**；G05 钉单位→键映射（**映射从 spec `:194` 切**） |
| H（开放项 / scope） | 6 | 1 | 3 | 2 | H02/H04 钉 **最长前缀 + 反斜杠归一**（`:132-133`）；H06 内容锚（不锁 S2 行号） |
| I（三态 / 审计 / manual） | 4 | 0 | 4 | 0 | I04 为 V-5；**I01 / I02 各增 `verdict` 含 `/` → `FreeTextEnum` 探针（v6 `:219` / `:241`）** |
| J（F 正向 / V-8 / V-6） | 6 | 5 | 0 | 1 | J05/J06 静态扫描；**J02 钉合并与四入口分离（§10-D19 `:278`）**；**J03 钉 `registeredIds` 单源** |
| K（盲点 / 契约守卫） | 4 | 0 | 0 | 4 | K01 env 11 键 + **缺键归码** + 单源；K02 `cmd?`/`impl?` + **open-world 未列字段**；K04 **四入口**分工（含 `verdictAllowed` 只报自己那族）+ 合并分离 |
| **合计** | **58** | **14** | **22** | **22** | 负+边界 **44** ≥ 正 **14**（v6 只加断言、条数不变） |

---

## 4 第三方通道点名（硬约束 9）

| 用例 | 第三方视角的实现方式 | 为什么算「非作者构造」 |
|---|---|---|
| **S1-TC-A04** | label 一侧读 PRD `:249-250-252` 原文并切分，另一侧读定义层 | 判据的两端都不是本文件作者写的字，而是上游原文与被测表 |
| **S1-TC-A05** | 词表一侧读 PRD `:270`（主观词）/`:202`（判据词）原文切词，另一侧读 `vocab/*.mjs` 两个导出数组（`deepEqual` 逐成员）；**单位 / 程序词 / 指针词三组常量一侧读 spec `:194` / `:190` / `:188` 原文切（§0.3），另一侧看实现是否逐成员报码** | 同 A04：词表成员由上游原文裁决，定义层改一个词而 PRD 未同批改即红；三组常量由 spec 原文裁决，改 spec 而不改实现即红（**不自比自**） |
| **S1-TC-G06** | 输入句取自仓库真实业务串 `tools/observation-check/data.mjs`（行 27，即「遇意见冲突」），并先断「该句确实含『见』」 | 句子由仓库既有产物提供，作者只选择它，不修改它 |
| **S1-TC-E07 / H04** | 落点真值取自 `data.mjs`（行 14–20） 的 `LANDINGS`；路径来自真实目录结构 | 同上（真值不是作者编的枚举） |
| **S1-TC-J05 / J06** | 只扫文件文本里的 import 语句（不读实现逻辑），两侧目录都先断非空 | 「只看产物就能判」的静态通道，与实现作者无关 |
| **S1-TC-I04** | 一侧读 PRD `:216` 的「manual」原文，一侧读码表键集 | 判据 = 两份公开文本对账，任一方都无法单方让判据变绿 |
| **S1-TC-B01** | 码集一端来自 PRD `:361` 的 35 码清单 + A 表 `:346` 的 `MissingCriterionImpl`，一端来自 spec v5 §7 `:164` 的 36 口径，第三端读被测 `TABLE` + `CARD_MODEL_CODES` | 完备性由上游清单与 spec 口径**两侧裁决**，不靠作者自述 |
| **S1-TC-H06** | 缺列码的实现处读已签的 S2 `tools/observation-check/checks.mjs`（**按内容定位** `MissingOpenField` 段，不锁行号），S1 侧断言「缺列不报码」 | 判据两端分别是「已签的 S2 实现」与「本段码表键集」，任一方都无法单方让判据变绿 |

---

## 5 只手动验证（不进 `node --test`）

| # | 项 | 为什么不能机器判 | 谁来兜 + 落点 |
|---|---|---|---|
| 1 | 卡面文案「像不像人话」「判据写没写清」 | 语义判断，脚本无此能力 | 议会测试评委 + S4 渲染评审（`docs/prd/…agent-card-contract.md` §3.7） |
| 2 | `WeakReason`（「理由未引用固定项 id 或文档事实」） | spec §7 明标 `manual`，不进码表 | 审计席人工抽查（PRD `:215-216`），落 `open` 一条 |
| 3 | 「`criterion` 文本是否真能支撑 `label` 的断言」 | 语义蕴含 | 议会测试评委；本段只判结构（G04） |

---

## 6 不测（带理由与去向）

| 不测项 | 理由与去向 |
|---|---|
| 渲染 / `agents/*.md` / README / dump | spec §2-1 明写不渲染；F-09～F-12 归 S4 |
| `tools/docgen/policy/**` 的任何行为 | spec §2-2 零接触；J05 只断「无 import」，不断其内容 |
| `tools/observation-check/**` 的改造 | spec §2-3；J03 只断「常量未被改」 |
| CLI 子命令 / 退出码映射 | spec §6 末行「不加新 CLI 子命令、`exitCodeFor` 不动」；本段不接 CLI（§2-5） |
| 15 席内容填充 | F-11 归 S4（spec §10-D10） |
| 门禁接入（`scripts/check-all.mjs` 加段） | F-17～F-19 归 S3（spec §2-5） |
| `WeakReason` 的语义判定 | manual（§2-6 / §7 末行）；见 §5 |
| `evidence` 可解析性 / 敏感内容 | 证据七道归 S2（§4「形状不做」）；K03 只钉边界 |
| 校验器的**真实调用方**（当前无人调用） | spec §12 R4 已登记；本段不宣称收益 |

---

## 7 缺口与判别力水位（spec 没写清 / 脚本判不了的部分，逐条给「谁兜 + 落点 + 验收」）

| # | 缺口 | 漏检哪类反例（至少 1 个样例） | 语义由谁兜 / 落点 | 状态 |
|---|---|---|---|---|
| **S1-G-1** | 码数口径 35 vs 36（v1 标题与 V-2 写 35，§7 表有 36 行） | 施工按 35 实现 → 漏 `MissingCriterionImpl`，B01 三方相等红 | **v2 已写死**（§7 `:164` = 36 = PRD 35 + `MissingCriterionImpl`；§9 V-2 `:248` 同步；§6 `:147` 明写码表 36 键） | **关**（B01 / I04 守） |
| **S1-G-2** | `CARD_MODEL_CODES` 未在 §3 布局与 `index.mjs` 出口面声明 | 施工不导出该常量 → V-5 无法判，B01/I04 直接抛 `TypeError` | **v2 已写死**（§3 `:47` 的 `validateCardModel.mjs` 行 + `:48` 的 `index.mjs` 出口面；§6 `:147` 定义其语义与键数） | **关**（B01 / I04 守） |
| **S1-G-3** | v1 §6 的 `env` 缺 3 个载体（`seatSignals` / `registeredIds` / `subjects`） | 施工按 8 键收 → `UnknownSignalType` / `SignalProliferation` / `DuplicateAsOpen` / `MissingSubject` 永远判不出 | **主线 + 余项都已写死（v5）**：三键补在 v3（§6 `:143-144` = 11 键）；**余项（缺键归码）由 v5 §6 `:153` 写死**——「`env` 缺任一键 → `UnverifiableOutput`（`path = env.<键名>`）并继续判；`card` / `doc` 非对象同此码」 | **闭合**（K01 ①-⑤ 守：11 键双向相等 + 逐键 `path=env.<键>` + 继续判 + `registeredIds` 单源；D03 ④ 守畸形入参） |
| **S1-G-4** | §4 的 `Card` 形状缺 `open` / `openEmptyReason`；`CheckItem` 缺 `cmd` / `impl` / `evidenceRequired`；`OpenItem` 缺列归哪个码；`scenes[].label` 缺失无码（§4 `:83` 要求局部 id 交两字段，只给 `why` 配了码） | `open` 三码与 `FalseScriptCheck` 判的字段在卡上不存在；缺列的开放项无人判；局部 scene 缺 `label` 时无码可报 | **余项②已闭合（v3）**：`CheckItem.cmd?` / `impl?` 已补（`:73-74`）；`open` / `openEmptyReason` 归产物侧 `ObservationDoc`（`:77-78`）；**`OpenItem` 缺列 → `MissingOpenField` 归 S2，S1 只判三码**（§7 `:208` + §10-D14 + §11-2，落 H06）。**余项①**：`evidenceRequired`（PRD `:199`）**已由 §10-D22 `:281` 声明「本段不判」（v6.1 登记为 S1-G-23）**；「局部 scene 缺 `label` 的归码」仍开 | **余项② 已闭合 / 余项①（`evidenceRequired`）已收口（不判）/ `scenes[].label` 归码开（P2）** → §8 建议 #4 |
| **S1-G-5** | `DisagreementOpen` / `SubjectMismatch` 的发射入口与返回形状未声明（v1 §3 只有 `verdictAllowed()`，`auditDisagreement` 从未被声明） | 两码无法从 `validateCardModel(card)` 发出 → V-2「每码一红点」不可执行 | **入口与返回形状均已写死**：v3 §6 `:137-141` 四入口签名（含 `verdictAllowed(subject, objectType, verdict)`）；**v5 `:141` 写死「同样返回 errors 形状，不是布尔」**；`:158` 入口分工；K04 守 | **闭合**（I01 直接断 `codes(r)`；B04 的 5 个 `fn` 行；K04 入口分工） |
| **S1-G-6** | §8 缺一组：`UnreadableExpression` × `NestingTooDeep` 都判同一 `expr`（同一 path） | 算子嵌算子且键非法 → 两码同 path，直接违 M1 | **v2 已写死**（§8 组 4 `:233`：先判是不是 JSON Logic，通过才判深度；v5 重排后组号为 4） | **关**（C01 组 4 / C03 守） |
| **S1-G-7** | 「卡面文本」扫描面未界定（`PointerToElsewhere` / `HardcodedCount` / `MixedTermInCard` / `ProceduralWordOutsideParliament` 判「卡面文本」，`:187-190`） | 扫到 `rationale`（散文，PRD `:223-224` 允许）→ 合法卡被判红；或只扫 `description` → 漏检 | **v3 写死扫描面、v5 写死键形态**（§4.2 `:101-112`：`PointerToElsewhere` / `HardcodedCount` 扫卡文本面、**不扫** `description` / `scenes[].why` / `rationale`；另两码扫 卡文本面 **∪** `rationale`；**`:112` 键 = 8 个码名、逐码一项**；§10-D13） | **关**（G09 八态 + 八键键集 `deepEqual` 守；G06/G07 仍作两端探针） |
| **S1-G-8** | `Action.criterion` 是**谓词 id**（PRD `:181`），`CheckItem.criterion` 是**散文**（PRD `:236`），但 §7 三个「判据文本」码（`:193-195`）未写判定面是哪一侧 | 对 `Action.criterion`（id 串）跑词表扫描 → 误报或永远不命中 | **v3 已写死**（§4.1 `:94-99` 两字段分形 + §4.2 `:106`「仅扫 `checkItems[].criterion`」；§10-D13） | **关**（F05 假阳性 / 假阴性两侧 + G05 配齐侧守） |
| **S1-G-9** | `deriveScope` 未写「反斜杠归一」，Windows 写法落 `repo` | `tools\docgen\x.mjs` 被判 `repo` → `OutOfScopeOpenItem` 误报或漏报 | **v5 已写死**（§5 `:132`「先 `object.replace(/\\/g,'/')` 归一，再按**下表自上而下**取首个命中的前缀」+ §10-D17 `:276`） | **闭合**（H04 三条反斜杠 / 正斜杠同值对 + H02 最长前缀守） |
| **S1-G-10** | `InlineThreshold`（`:194`）的「`params` 无对应键」中「对应键」未定义 | `params: { n: 3 }` 与 `params: { times: 3 }` 两套实现给出不同结论 | **v5 已写死**（§7 `:194`「**单位→键映射写死**：次→`times` / 条→`count` / 字→`chars` / 个→`items` / 轮→`rounds` / 处→`spots` / %→`percent`，映射外单位一律红」） | **闭合**（G05 ④ 七单位配齐绿 + A05 ② 七单位缺 `params` 必红） |
| **S1-G-11** | `requires` 元素形状违规（缺 `kind` / `must` 非布尔）无码 | `requires: [{ id: 'x' }]` 静默通过 | spec 归码（复用 `VagueReferent` 或新码，或明写「形状不判，归 S4」） | **开**（§8 建议 #12；v5 未动该行） |
| **S1-G-12** | `SUBJECTS` 未封闭（不在 §5 的 8 表内；PRD §4.1 `:293` 仍写 `'…'` 省略号） | 主语表日后随意增长，`MissingSubject`/`SubjectMismatch` 判据漂移 | **口径已明确（v5 §5 `:131`）**：`SUBJECTS` 是**登记表、不是第 9 张封闭枚举**（`{ '<subject>': { display, validator } }`，消费面 = `env.subjects` 的构造方与测试），且**从 `index.mjs` 导出**；`SUBJECT_VALIDATORS` 是其 `validator` 投影 | **关（口径）/ 开（PRD `:293` 省略号）** → §8 建议 #13 余项；A01 断「同引用 + 两投影键集相等」 |
| **S1-G-13** | V-6 守卫只判**静态 import 行**；动态 `import()` 拼串、`createRequire`、`process.cwd()` 读文件都拦不住 | 用 `const p = '../policy/' + 'seats.mjs'; await import(p)` 绕过 J05 | 残余接受并登记；J06 已额外限制说明符形态（只 `node:` + 自身相对路径），可拦住大多数写法 | **接受**（残余风险，spec §12 R1 同类） |
| **S1-G-14** | **`Card` 上出现非卡片数据字段（如 `open` / `openEmptyReason`）与畸形入参（`card` 非对象）时的处置未写死** | 实现若做 closed-world 字段检查 → 把合法的「顺手挂了 `open`」的卡判红；若忽略 → 也可能掩盖真实的开放项错误 | **v5 已写死**（§6 `:155`「`Card` 上出现本 spec 未列的字段 → **忽略不判**（open-world）」+ `:153`「`card` / `doc` 非对象 → `UnverifiableOutput`」） | **闭合**（K04 ①/①b open-world + K02 第四组 + D03 ④ 畸形入参） |
| **S1-G-15** | `FreeTextEnum`（`:172`）的判定面含 `verdict`，而 `verdict` 只在产物侧 `ObservationDoc.items[]`（`:78`）/ `VERDICTS` 表上——**该码归哪个入口**未写死 | 实现若在 `validateCardModel` 里判 `card.verdict`（卡上没有此字段）→ 永绿；若在 `compareVerdicts` 里判 → 与 B04 的 `fn` 口径不一致 | **v5 写入口归属、v6 §7 `:219` 补「入口对照」行**（§8 `:241`：「`verdict` 面：卡片数据里没有 `verdict` 字段（它只在产物侧），故该面只由 `verdictAllowed()` / `compareVerdicts()` 两处判」+ §7 `:219` 的族级入口表把它列入 `verdictAllowed` / `compareVerdicts`） | **闭合**（I01 / I02 各一条 `verdict = 'hit/miss'` → 只报 `FreeTextEnum` 的探针；K04 ③ 入口归属守） |
| **S1-G-16** | `MissingCriterionImpl` 的判据 v3 版含「id ∉ `env.predicates` 且该条未标 `check:'manual'`」，但 `Action` 形状（`:68-72`）**没有 `check` 字段**；v5 前 `CheckItem.criterion` 面也未定 | `Action` 侧豁免无载体（施工会自造 `Action.check`）；`CheckItem.criterion` 缺/空无码可报 | **v4 写死动作侧口径、v5 补齐 `CheckItem` 面**（§7 `:181`：`Action` 侧「缺/空 或 id ∉ `env.predicates`」、无 `manual` 豁免；`CheckItem` 侧「`criterion` 缺/空」，`check:'manual'` 豁免；**两处 path 不同、各报一次、互不抑制**）+ §10-D15 `:274` | **闭合**（F03 ①-⑦ 守：Action 面、`CheckItem` 面、两处互不抑制、豁免不溢出、契约外 `check` 不豁免） |
| **S1-G-17** | `HardcodedCount`（`:187`）v3 版的三条正则都用 `\d`（半角数字），全角数字（`共３条`）、汉字数字（`共三条`）都不命中 | 卡面写「共３条」→ 不报 `HardcodedCount`（漏检），而写「共 3 条」才报 | **v4 已写死**（§7 `:187`：「`N` 的字符面 = **半角 + 全角 + 汉字数字**」+ §10-D15 `:274`）：字符面与字段无关，`N` 一律三面认 | **闭合**（G07 ① 第 2/3 条 + ② 两字段守；③ 保留 `rationale` 不进扫描面的豁免面） |
| **S1-G-18** | `HardcodedCount` 的 `N` 面已含半角/全角/汉字数字（v4 `:187`），但**不定量词**（`共若干条` / `共多条` / `共十几条`）与**多字汉字数字**（`共二十三条`）算不算 `N` 未写死 | 卡面写「共若干条」或「共二十三条」→ 实现若只认单字汉字数字即漏检；若按不定量词判又可能误报「共多条口径」这类合法表述 | spec 写明「汉字数字含多位（`十一`～`九十九`）」与「不定量词（多/若干）不属 `N`」两句，或明写「只认数字字符面、不定量词一律不判」 | **开（P2）**（§8 建议 #19；G07 不覆盖项已点名） |
| **S1-G-19** | `validateOpenItems(doc, env, cards)` 的**第三参 `cards` 完全不传**时归什么码（v5 `:139` 只写「第三参 `cards`」，未写缺参形态） | 施工把 `cards` 设为可选（`cards = []`）→ 与 `env.registeredIds` 的派生对账恒等（两边都是空），`DuplicateAsOpen` 失效且不报码 | spec 写明「`cards` 缺/非数组 → `UnverifiableOutput`（`path = cards`）」或明写「必传、缺参即 TypeError 冒泡」 | **开（P2）** → §8 建议 #20；J03 / K01 的「不覆盖」已点名该形态 |
| **S1-G-20** | §8 M2 写「**只管同一 `path`**」，但 §7 判定面列用的是**集合面**名（`scenes` / `signals` / `checkItems`）——「三码各挂 `scenes[i].id` / `scenes[i].why` 算不算同一 path」未写死 | 实现按**完整 path** 判 M2 → 组 5（场景三码）会一次返回 3 条，C01 的 `got[4]` 红；实现按**判定面** 判 → 只返回 1 条 | **v6 已写死**：§8 `:226`「M2 的 `path` 粒度：同组内多个码落在**同一判定面**（= §7「判定面」列，如 `scenes` / `trigger` / `checkItems[].criterion`）时按组序抑制；`errors[].path` 仍按 §6 输出带下标的定位串」+ §10-D20 `:279` | **闭合**（C01 组 5 `got[4]` / 组 8 `got[7]` 直接断言「只返回先报那一个」；§0.1 与 §1 的计数口径同步为「7 组真双命中 + 组 6 误实现对位」） |
| **S1-G-21** | `rubric` 条目缺 `source` **原按 PRD `:262` 判 `AmbiguousCriterion`**，而 §4.1 / §4.2 的 `AmbiguousCriterion` 只判 `criterion` 文本词表、根本不抬头扫 rubric 结构——同形态双码 | 施工照 PRD `:262` 实现 → 同一个「缺 `source`」既可能报 `AmbiguousCriterion`（rubric 面）又报 `MissingAiAudit`（结构面），M1 / 双码风险 | **v5 已写死（收口）**：§7 `:196` 末句「**rubric 缺 `source` 归本码**（PRD `:262` 的 `AmbiguousCriterion` 在此收口，见 §10-D16）」+ §10-D16 `:275` | **闭合**（G04 六形态之⑥「缺 `source` 键」必红 + 末条收口断言「不得报成 `AmbiguousCriterion`」） |
| **S1-G-22** | `FreeTextEnum` 的 `verdict` 面写明「`verdictAllowed()` / `compareVerdicts()` 两处判」（§8 `:241`），但**两处都判时会不会同一次双报 / `compareVerdicts` 是否内部复用 `verdictAllowed`** 未写死 | 实现若在 `compareVerdicts` 内对 A / B 各调一次 `verdictAllowed` → 同一 `id` 可能出 2 条 `FreeTextEnum`（条数口径漂移，M1 只管同 path 不计数） | spec 写明「同一 `id` 的 `FreeTextEnum` 至多 1 条」或「两处只判各自的一半（`verdictAllowed` 判单条、`compareVerdicts` 判成对）」 | **开（P2）** → §8 建议 #22；I01 / I02 的断言已按「码集去重」写（`[...new Set(codes(r))]`），故不因条数而假红 |
| **S1-G-23** | PRD `:199` 的 `evidenceRequired: true`（`check:'ai'` 条目的配套三样之一）**无判定口径**（原登记在 S1-G-4 余项①：spec §4 的 `CheckItem` 未列该字段） | 施工若自造判据（「缺 `evidenceRequired` 即红」）→ 造出恒绿断言；若顺手做 closed-world 字段检查 → 把合法卡判红 | **spec 已声明不判（v6.1 登记）**：§10-D22 `:281`「PRD `:199` 的 `evidenceRequired: true` **本段不判**（归 S4 渲染与门禁）」——`check:'ai'` 的失败面已由 `MissingAiAudit` 判 rubric（三组边界 + `path:line`）与 `audit`（`sample` / `command`），该字段是无失败面的布尔常量（恒 `true`） | **闭合（不判）** → §8 建议 #4 标「v6.1 已采纳（不判）」；守方 = K02 ①b（挂上该字段 → 零码，open-world） |

---

## 8 给开发的建议（只写建议，不动手）

| # | 位置（文件 / spec 节） | 风险或盲点 | 为什么会被忽略 | 具体改法 | 优先级 |
|---|---|---|---|---|---|
| 1 | spec §7 `:164` + §9 V-2 `:248` + PRD `:361` | 码数口径 | **【v2 已采纳】** v2 写死「36 = PRD 35 + `MissingCriterionImpl`」，V-2 同步为 36，§6 `:147` 定 `CARD_MODEL_CODES` 为 36 键 | 无需再改；守方 = B01（三方双向相等）+ I04（`WeakReason` 不在表） | — |
| 2 | spec §3 `:47-48` + §6 `:147` | `CARD_MODEL_CODES` 未声明（V-5 无载体） | **【v2 已采纳；v6 改值的口径】** `:47` 的 `validateCardModel.mjs` 行写明「码表常量 `CARD_MODEL_CODES`（36 个脚本码）+ **四个入口**」、`:48` 的 `index.mjs` 列进出口面、`:147` 定义语义（键 = 码名、**值 = 该码的判定面字段引用（如 `must[].criterion`，不写行号）**） | 无需再改；守方 = B01（键数 36 + 双向相等 + 值形态「字段引用、不含 `:`」）+ I04 | — |
| 3 | spec §6 `env` `:143-144` + `:153` | env 缺 3 个载体 / 缺键归码 | **【v2 补 3 键；v5 采纳余项】** v2 补齐 11 键；**v5 §6 `:153` 写死「`env` 缺任一键 → `UnverifiableOutput`（`path = env.<键名>`）并继续判；`card` / `doc` 非对象同此码」** | 无需再改；守方 = K01（11 键对账 + 逐键 `path=env.<键>` + 继续判）+ D03 ④（畸形入参） | — |
| 4 | spec §4 `:57-79` + §10-D22 `:281` | 形状缺字段 | **【v3 已采纳 余项②；v2 部分采纳；v5 未动；v6.1 已采纳（不判）】** `CheckItem.cmd?` / `impl?` 已补（`:73-74`）、`open` / `openEmptyReason` 归 `ObservationDoc`（`:77-78`）、**`OpenItem` 缺列 → `MissingOpenField` 明确归 S2、S1 只判三码**（§7 `:208` + §10-D14 + §11-2）；**余项① `evidenceRequired`（PRD `:199`）取原文第 ② 条改法**：§10-D22 `:281` 明写「**本段不判**（归 S4 渲染与门禁）」（登记 §7 缺口 **S1-G-23**） | 原文两选一，spec 取了 ②「明写不判，归 S4」→ **§4 无需再改**；验收 = K02 ①b（卡上挂 `evidenceRequired: true` → 零码）+ G04 不覆盖项 | **v6.1 已采纳（不判）**（余项②闭合，H05 ③ + H06 守） |
| 5 | spec §3 `:41` + §6 `:137-142` / `:158` | 三态/审计无入口、符号未定 | **【v2 已采纳；v5 扩为四入口 + 合并独立】** v2 写死入口签名与「入口分工」，`compareVerdicts` 取代 v1 的 `auditDisagreement`；**v5 `:142` 增 `mergeActions(shared, own)` 且明确它不属四入口** | 无需再改；守方 = K04（四入口分工 + 合并分离）+ B04 的 5 个 `fn` 行 + J02 ⑤ | — |
| 6 | spec §8 `:230-237` | 缺「表达式」互斥组 | **【v2 已采纳；v5 重排组号；v6 加序号】** 表达式组现为**组 4**（`:233`）：「`UnreadableExpression` → `NestingTooDeep`（先判是不是 JSON Logic，通过才判深度）」；组表在 v6 已带序号 1–8 | 无需再改；守方 = C01 组 4（断具体码）+ C03（两端分工） | — |
| 7 | spec §6 `:137-141` | `verdictAllowed` 的**返回形状**未写（`{ok, errors[]}` 还是布尔） | **【v5 已采纳】** `:141` 写死「`verdictAllowed(subject, objectType, verdict) → { ok, errors }`（同样返回 errors 形状，不是布尔）」 | 无需再改；守方 = I01（直接断 `codes(r)`） | — |
| 8 | spec §7 卡面文本四码 `:187-190` | 「卡面文本」未界定；`rationale` 是散文豁免区（PRD `:223-224`），若被扫到则合法卡必红 | **【v3 采纳扫描面；v5 采纳键形态】** §4.2 `:101-112` 逐字段列名；**`:112` 写死「键 = 8 个码名、逐码一项、不合并成 4 组键」** | 无需再改；守方 = G09（八态 + 八键 `keys.length === 8` + 键集 `deepEqual`） | — |
| 9 | spec §7 `:193-195` + PRD `:181` | 三个「判据文本」码未写判定面；`Action.criterion` 是 id（PRD `:181`），`CheckItem.criterion` 是散文（PRD `:236`） | **【v3 已采纳】** §4.1 `:94-99` 写明两字段分形 + §4.2 `:106` 写明三码「**仅** 扫 `checkItems[].criterion`，不扫 `Action.criterion`」 | 无需再改；守方 = F05（假阳性 / 假阴性两侧 + path 分指）+ G05（配齐侧） | — |
| 10 | spec §5 `deriveScope` `:132` | 未写反斜杠归一，Windows 正当写法落 `repo` | **【v5 已采纳】** `:132` 写「先 `object.replace(/\\/g,'/')` 归一，再按下表**自上而下**取首个命中的前缀」+ `:133` 给出「首段判定会判成 `doc`」的理由 | 无需再改；守方 = H04（三对正 / 反斜杠同值）+ H02（最长前缀 + `notEqual(…,'doc')`） | — |
| 11 | spec §7 `InlineThreshold` `:194` | 「`params` 无对应键」的「对应键」无定义 | **【v5 已采纳】** `:194` 写死单位→键映射七项（`次→times` / `条→count` / `字→chars` / `个→items` / `轮→rounds` / `处→spots` / `%→percent`），映射外单位一律红 | 无需再改；守方 = G05 ④（七单位配齐绿）+ A05 ②（七单位缺 `params` 必红） | — |
| 12 | spec §7 `MissingPrerequisite` `:179` vs PRD `:254` | `requires` 元素形状（缺 `kind` / `must` 非布尔）无码 | v2 未动；该码只看 `must:true` 的 id，形状违规自然漏 | 归码或明写不判：推荐「形状违规 → `VagueReferent`」并在 §7 该行加子面。验收：F01 加一条形状负例 | **P2** |
| 13 | spec §5 表清单 `:115-126` vs §3 `subjects.mjs`（`:41`） | `SUBJECTS` 不在 8 张封闭表内，而两码依赖它（§7 缺口 S1-G-12）；PRD `:293` 还写着 `'…'` | **【v5 已采纳（口径）】** §5 `:131` 写死「`SUBJECTS` 是**登记表、不是第 9 张封闭枚举**」+ 形状 `{ '<subject>': { display, validator } }` + **从 `index.mjs` 导出**；`SUBJECT_VALIDATORS` 是 `validator` 投影 | **余项（PRD `:293` 省略号）仍开**：删 PRD `:293` 的省略号。验收 = A01 的「同引用 + 两投影键集相等」已绿 + PRD 改后本条再对账 | **P1 → P2**（口径闭合 / PRD 余项开） |
| 14 | `tools/observation-check/render.mjs` 行 39（S2 侧） | §11-1 的登记**属实**（现行表 `['trigger','text','criterion','landing']` 缺 `kind`/`objects`，多 `text`）——本段只在 J02 断言正确集合，**不修 S2** | 「已登记」容易被读成「已处理」 | 维持 §11-1 的处置（S4 首次重生成时收敛），本段零改动。**第 14 项已查，无新增问题** | — |
| 15 | spec §6 `:158` / §4 `:58-67` | **`Card` 上出现非卡片数据字段或入参畸形时的处置未写死** | **【v5 已采纳】** `:155`「`Card` 上出现本 spec 未列的字段 → **忽略不判**（open-world）」+ `:153`「`card` / `doc` 非对象 → `UnverifiableOutput`」 | 无需再改；守方 = K04 ①/①b（open-world）+ K02 第四组 + D03 ④（畸形入参） | — |
| 16 | spec §7 `FreeTextEnum` `:172` + §7 `:219` / §8 `:241` | 判定面含 `verdict`，但 `verdict` 只在产物侧——该码归哪个入口未写死 | **【v5 已采纳入口归属；v6 §7 `:219` 加「入口对照」行】** §8 `:241` 写「`verdict` 面只在产物侧，故该面只由 `verdictAllowed()` / `compareVerdicts()` 两处判」 | **v6 已补探针**：I01 / I02 各一条 `verdict = 'hit/miss'` → 只报 `FreeTextEnum`（码集去重断言）；守方 = K04 ③（入口归属）+ I01 / I02 | — |
| 17 | spec §7 `MissingCriterionImpl` `:181` + §10-D15 `:274` | 判据含「id ∉ `env.predicates` **且该条未标 `check:'manual'`**」，但 `Action`（`:68-72`）没有 `check` 字段（`check` 只在 `CheckItem` `:73-74`）——「manual 豁免」在动作条目上无载体 | **【v4 已采纳；v5 追加 `CheckItem` 面】** v4 §7 `:181` 写「动作条目没有 `check` 字段 → 不适用 `manual` 豁免」；**v5 同行为 `CheckItem.criterion` 补「缺/空（`check:'manual'` 豁免）」并要求「两处 path 不同，各报一次、互不抑制」** | 无需再改；守方 = **F03 ⑥⑦**（⑥ 同卡 manual 条目 + `Action.criterion` 未登记 → Action 仍必报；⑦ `Action` 上写契约外 `check:'manual'` 不豁免）+ **F03 ④⑤**（`CheckItem` 面与两处互不抑制） | — |
| 18 | spec §7 `HardcodedCount` `:187` + §10-D15 `:274` | 三条正则用 `\d`（半角），全角数字 / 汉字数字不命中 | **【v4 已采纳】** v4 §7 `:187` 写「`N` 的字符面 = **半角 + 全角 + 汉字数字**」+ §10-D15 `:274`（理由：`\d` 漏检「共３条 / 共三条」→ 判据假绿）；**未规定实现路径**（先归一还是分支匹配，实现自由，本文件不钉） | 无需再改；守方 = **G07 ①**（`共３条` / `共三条` 必红）+ **G07 ②**（同形态在 `duty.constraint` / `CheckItem.label` 上也必红）+ **G07 ③**（`rationale` 豁免面保留） | — |
| 19 | spec §7 `HardcodedCount` `:187` | `N` 面已含半角/全角/汉字数字，但**不定量词**（`若干` / `多`）与**多字汉字数字**（`二十三`）落在 `N` 面外还是面内没写死 | 读者会把「汉字数字」理解成单字（`一二三…十`）；而「共若干条」同样是硬编码数量表述，漏检后卡面照样写死数量 | §7 该行补两句之一：「汉字数字含多位（`十一`～`九十九`），不定量词（多 / 若干）不属 `N`」或「只认数字字符面，不定量词一律不判」。**验收**：G07 新增两条——`duty.action = '共二十三条'` 按 spec 所选口径定红/绿、`'共若干条'` 按所选口径定红/绿（口径未定前**不得**写进断言，故本版只在 §7 缺口登记） | **P2** |
| 20 | spec §6 `:139` | `validateOpenItems(doc, env, cards)` 的**第三参缺省**形态未给码（S1-G-19） | v5 只写「第三参 `cards`」，未写「不传 / 非数组怎么办」；施工最省事的写法是 `cards = []`，于是「`env.registeredIds` vs 派生」两边都空、对账恒等 → `DuplicateAsOpen` 静默失效 | §6 加一句「`cards` 缺/非数组 → `UnverifiableOutput`（`path = cards`）」，或明写「必传，缺参即 `TypeError` 冒泡（不属本段收敛面）」。**验收**：J03 加一条「不传第三参 → 断言红/抛」；K01 的「不覆盖」已点名 | **P2** |
| 21 | spec §8 `:225` / `:226` / `:230-237` | **M2 的 path 粒度**（S1-G-20）：是「完整 path 串相等」还是「§7 判定面（`scenes` / `signals` / `checkItems`）相等」 | **【v6 已采纳】** §8 `:226` 写死「M2 的 `path` 粒度：同组内多个码落在**同一判定面**（= §7「判定面」列）时按组序抑制；`errors[].path` 仍按 §6 输出带下标的定位串」+ §10-D20 `:279` | 无需再改；守方 = C01 组 5 `got[4]` / 组 8 `got[7]`（断言「只返回先报那一个」，实现按完整串判即红，**不得**放宽断言） | — |
| 22 | spec §8 `:241` + §7 `:219` | `FreeTextEnum` 的 `verdict` 面归 `verdictAllowed()` / `compareVerdicts()` **两处都判**时，同一 `id` 会不会出 2 条（S1-G-22） | 「两处判」只说了归属，没说去重/分工；`compareVerdicts` 内若对 A / B 各调一次 `verdictAllowed`，同一 id 会双报 | §8 `:241` 补一句「同一 `id` 的 `FreeTextEnum` 至多 1 条」，或明写「`verdictAllowed` 判单条、`compareVerdicts` 只判成对差异」。**验收**：I01 / I02 断言改用码集去重（已按此写），spec 改后加「条数 ≤ 1」断言 | **P2** |

**v6 对齐核对（spec v6 的 5 处改判 + 第 2 轮三席点名的 4 条顺手修，逐条闭合）**

| # | v6 改判（spec 位置） | 落在哪条用例 | 状态 |
|---|---|---|---|
| 1 | §8 `:226` M2 的 `path` 粒度 = 判定面；组表带序号 1–8（`:230-237`） | **C01**：组 5 `got[4]` / 组 8 `got[7]` 改断「只返回先报那一个」（不再受「不同下标 path」推翻）；全部组号引用改 1–8；删掉原「须回流 spec（R4）」注脚；**组 3 补两条相邻对构造**（`['InlineThreshold']` / `['AmbiguousCriterion']`），组数仍 8 | 闭合 |
| 2 | §7 `:180` `UnboundLanding` 第三档两形态（登记值本身未赋值 / 子段逐段未赋值） | **E01 增 (e)** `landing = 'review.dir'` + `unboundVars = {'review.dir'}` → 红（第一形态）；(d) 保留子段形态（第二形态，改为按 `/` 逐段判）；**E07 增 `review.dir/x` → 绿**（守「只对 `env.landings` 做子段逻辑」的误实现） | 闭合 |
| 3 | §6 `:147` 码表值 = 判定面字段引用（不写行号） | **B01 ⑥**：`CARD_MODEL_CODES` 每个值必须匹配字段引用形态且不含 `:`；变异写成 `:180` 即红 | 闭合 |
| 4 | §3 `:47-48` 四入口（含 `verdictAllowed`；`mergeActions` 独立） | 全文入口措辞统一为「四入口」（`verdictAllowed` 计入）；**K04 增「`verdictAllowed` 不报卡级码」断言** | 闭合 |
| 5 | §7 `:219` 入口对照新增 `FreeTextEnum`（`verdict` 面）→ `verdictAllowed` / `compareVerdicts` | **I01 / I02 各一条** `verdict = 'hit/miss'` → 只报 `FreeTextEnum`（码集去重）；S1-G-15 状态改「闭合」 | 闭合 |
| 6 | 顺手修① C01 组 6 的真双命中失真（`:235` 写明两码定义互斥） | §0.1 / 文件头 / §1 / §3 汇总的口径统一为「**7 组真双命中 + 组 6 误实现对位**」；C01 组 6 注释点名「两码定义互斥，本组验的是必须读 `SEAT_SIGNALS`」 | 闭合 |
| 7 | 顺手修② C01 组 3 只验 3/6 相邻对 | 组 3 内补 `g3Threshold` / `g3Ambiguous` 两条断言（组数仍 8） | 闭合 |
| 8 | 顺手修③ 四个词表常量自比自（恒真） | §0.3 新增 `SPEC_LINES` / `UNIT_KEY` / `THRESHOLD_UNITS` / `PROC_WORDS` / `POINTER_WORDS`（全部从 spec `:194` / `:190` / `:188` 原文切）；A05 / G05 删掉与自身字面 `deepEqual` 的写法，改为长度前置 + 逐成员探针；验收 = 把 spec `:194` 的 `处→spots` 改成 `sites` → G05 ④ 必红 | 闭合 |
| 9 | 顺手修④ `pickSubject()` 只看 `display` 非空 | 过滤加「`SUBJECT_VALIDATORS[k] != null`」（§5 `:131` 的 validator 投影），避免无校验器 subject 让基线假红 | 闭合 |
| 10 | 顺手修⑤ 行号重锚 + 版本 v6 + 计数重算 | 文件头 v6 增量说明 + 行号口径段（≤ `:225` 零位移、§8 +2、§10 +2、§11/§12 +4）；§9 计数 58 / 14 / 22 / 22（条数零增删） | 闭合 |

**v5 对齐核对（spec 八处改判 + 上轮测试 / 审计席点名的 5 条顺手修，逐条闭合）**

| # | v5 改判（spec 位置） | 落在哪条用例 | 状态 |
|---|---|---|---|
| 1 | §8 重组 + M2 限定同 path（`:225` / `:230-237` / `:239`） | **C01**：八组按新表重建（组 3 = 判据文本四码、组 4 = 表达式、组 5 = 场景三码、组 6 = 信号、组 7 = 开放项、组 8 = subject/label 三码）；组 5 / 组 6 改成真双命中（**v6 更正：组 6 是误实现对位，见上一张表**）；另加「未登记 type 只报 `UnknownSignalType`」反向守卫 | 闭合 |
| 2 | §7 `MissingCriterionImpl` 增设 `CheckItem` 面（`:181`） | **F03** ④（非 manual 缺 `criterion` → 同码，path `checkItems[0].criterion`；manual → 绿）+ ⑤（两处各报一次、互不抑制、path 顺序合 §6 固定序） | 闭合 |
| 3 | §7 `UnboundLanding` 改「最长已登记前缀」+ 允许 `<登记值>/<子段>`（`:180` / `:277`） | **E01**（(c) `deliverable.body/row` 绿、(d) 子段 ∈ `unboundVars` 红）+ **E07**（`deliverable.body` / `deliverable.body/row` 绿、`no.such.landing` 红，并写明「首段比较」与「整串相等」两种错误实现各红在哪） | 闭合 |
| 4 | §5 `deriveScope` 顺序敏感最长前缀 + 先反斜杠归一（`:132-133` / `:276`） | **H02**（8 条映射 + 「reviews → `process` 而非 `doc`」的 `notEqual`）+ **H04**（三对正 / 反斜杠同值，含 specs 反斜杠 → `doc`） | 闭合 |
| 5 | §6 合并与四入口分离 + 三条纪律（`:142` / `:147` / `:153` / `:154` / `:155`） | **J02**（`{ok, errors}` 形状 + 合并码不入码表 + 含覆盖动作的卡经 `validateCardModel` 无合并码）+ **J03**（单源对账 + 不一致即 `UnverifiableOutput`）+ **K01**（缺键 → `path=env.<键>` + 继续判 + 单源）+ **K04**（open-world 未列字段 + 合并不经四入口） | 闭合 |
| 6 | §5 `SUBJECTS` 从 `index.mjs` 导出（登记表，非第 9 张枚举）（`:131`） | **A01**：`assert.equal(M.SUBJECTS, SUB.SUBJECTS)` + 两投影键集相等 | 闭合 |
| 7 | §4.2 `SCAN_FIELDS` 键形态写死（键 = 8 个码名，逐码一项）（`:112`） | **G09 ⑨**：`Object.keys(SF).length === 8` + 键集 `deepEqual` 到 8 码名（合并成 4 组键即红） | 闭合 |
| 8 | §7 `MissingAiAudit` 收口 rubric 缺 `source`（`:196` / `:275`） | **G04**：新增「缺 `source` 键」形态 + 末条收口断言（缺 `source` 不得报成 `AmbiguousCriterion`） | 闭合 |
| 9 | 顺手修① 词表全成员（QA P1） | **A05**（PRD `:270` / `:202` 原文切词 `deepEqual`；`InlineThreshold` 七单位 / 程序词五词 / 指针词五词逐条必红）+ **G05 ④**（七单位配齐绿） | 闭合 |
| 10 | 顺手修② 删恒真 | **B02**（`rows.every((r) => r.code)` 删除，改为「每行必须有非空 code + `mutate`/`fn`」两条前置）+ **A01**（「有 label 才断」的条件分支删除，改为 `LABELED` / `PLAIN` 两组无条件断言） | 闭合 |
| 11 | 顺手修③ 固定行号锚改内容锚 | **H06 ⑤**：按内容定位 `MissingOpenField` 段（不再硬编码 `checks.mjs` 111–113），并写明该锚的失效条件 | 闭合 |
| 12 | 顺手修④ §9 计数命令改非内联 | §9 A 段三条改 PowerShell `Select-String` 形态；B 段实测输出已重跑 | 闭合 |
| 13 | 顺手修⑤ 行号重锚 + 版本 v5 + 计数重算 | 文件头 v5 增量说明 + 行号口径段；273 处反引号锚点 + 13 处非反引号锚点按 v5 实文（295 行）重校；§9 计数 58 / 14 / 22 / 22 | 闭合 |

**v4 对齐核对（2 条 P0，逐条闭合；两条都是上一轮本文件 §7 缺口表登记的项）**

| v4 P0 | 落在哪条用例 | 状态 |
|---|---|---|
| §7 `:181` 收紧「动作条目没有 `check` 字段 → 不适用 `manual` 豁免；豁免只对 `CheckItem` 生效」+ §10-D15 `:274`（原 S1-G-16） | **F03**：④ 重写为「豁免承载面 = `CheckItem.check === 'manual'`」；**⑤ 新增**「`Action.criterion` 未登记 + 同卡某 CheckItem 标 manual → `Action` 仍报 `MissingCriterionImpl`（path 落 `must[0].criterion`）」；**⑥ 新增**「把 `manual` 写进 `Action` 的契约外 `check` 字段同样不构成豁免」；前置新增「`'check' in baseCard().must[0] === false`」的形式断言 | 闭合 |
| §7 `:187` 收紧「`N` 的字符面 = 半角 + 全角 + 汉字数字」+ §10-D15 `:274`（原 S1-G-17） | **G07**：① 由三形态扩为**五形态**（`共 3 条` / `共３条` / `共三条` / `缺一项` / `全部命中` 必红）；**② 新增**同形态在 `duty.constraint` / `CheckItem.label` 上也必红；**③ 保留** `rationale` 不进扫描面的豁免面（并新增全角/汉字形态的 rationale 探针）；原标题「三形态」改「五形态」 | 闭合 |
| 余项（v4 未动，仍开）：`HardcodedCount` 的不定量词 / 多字汉字数字 | G07「不覆盖」点名 → 登记 §7 缺口 **S1-G-18** + §8 建议 #19 | 开（P2） |

**v3 对齐核对（2 条 P0 + 1 处余项，逐条闭合）**

| v3 P0 | 落在哪条用例 | 状态 |
|---|---|---|
| §4.1 两个 `criterion` 分形 + §4.2 `SCAN_FIELDS` 扫描面（原 S1-G-8 / G-7） | **F05**（假阳性 / 假阴性两侧 + path 分指）+ **G09**（八态 + `SCAN_FIELDS` 键集对账）+ G05 / G06 / G07 作两端探针 | 闭合 |
| §7 `:208` 开放项缺列归 S2、S1 只判三码（原 S1-G-4 余项②） | **H06**（缺列不报码 + 三码仍报 + 码表不含 `MissingOpenField` + S2 行号对账）+ **H05 ③** 改断言为「缺非派生列仍绿」 | 闭合 |
| §10-D13 / D14（两条差异补登记） | 上述三条用例的「覆盖 / 来源」列均点名 D13 / D14 | 闭合 |

**v2 对齐核对（6 处 P0，逐条闭合）**

| v2 改动 | 落在哪条用例 | 状态 |
|---|---|---|
| ① 码数 36（35 + `MissingCriterionImpl`，+1 manual，+3 合并码不计） | §0.4 `S1_CODES` / `MERGE_CODES` 顶部断言 + B01 + I04 + §0.1 覆盖账 | 闭合 |
| ② `CARD_MODEL_CODES` 是唯一码表常量（36 键） | B01（三方双向相等 + 值形态）+ I04（`WeakReason` 不在表） | 闭合 |
| ③ `env` 11 键 | §0.3 `baseEnv()` + `ENV_KEYS` + K01（双向对账 + 缺键 fail-closed） | 闭合 |
| ④ 形状：`CheckItem.cmd?`/`impl?` + 产物侧 `ObservationDoc` | K02 + `baseDoc()` + 开放项三码改 `fn` 型（TABLE）+ C01 组 7（开放项） | 闭合 |
| ⑤ 入口签名（**v6 统一为四入口**）+ 入口分工 | TABLE 的 5 个 `fn` 行 + B04（`fn` 行数 5）+ I01（三位置参）+ I02（`compareVerdicts`）+ K04 | 闭合 |
| ⑥ §8 表达式组（`UnreadableExpression` → `NestingTooDeep`） | C01 **组 4**（`got[3]` 断言具体码）+ C03（两端分工） | 闭合 |

---

## 9 计数声明（可复算）

**A. 计数命令（在仓库根执行，PowerShell `Select-String` 形态；区间限定 = 本文件 `### S1-TC-` 标题与 §1 的「类型」列）**

```powershell
$f = 'docs/superpowers/specs/2026-10-29-agent-card-s1-card-model-design-testcase.md'
$c = Get-Content $f
# ① 用例条数（标题计数）
($c | Select-String '^### S1-TC-').Count
# ② 类型分布（§1 表第 4 列）+ 行数 + 去重
$ids   = $c | Select-String '^\| (S1-TC-[A-Z][0-9]+) \|' | ForEach-Object { $_.Matches[0].Groups[1].Value }
$pos   = ($c | Select-String '^\| S1-TC-[A-Z][0-9]+ \| .*\| 正 \|').Count
$neg   = ($c | Select-String '^\| S1-TC-[A-Z][0-9]+ \| .*\| 负 \|').Count
$edge  = ($c | Select-String '^\| S1-TC-[A-Z][0-9]+ \| .*\| 边界 \|').Count
$dupe  = $ids.Count - ($ids | Select-Object -Unique).Count
"rows $($ids.Count) pos $pos neg $neg edge $edge dupe $dupe"
# ③ 「前置」行数（五要素第 3 项）
($c | Select-String '^- \*\*前置\*\*').Count
```

**B. 实测输出（2026-10-29，本文件 v6 定稿时重跑；命令即上方 ① ② ③ 原样，三条均区间限定——① 只数 `^### S1-TC-` 标题、② 只数 §1「类型」列第 4 列、③ 只数行首 `- **前置**` 行；输出首行即判据。**v4 及之前用的是内联 `node -e` 三行**，v5 起改 PowerShell 形态：`node -e` 的引号在 PowerShell 5 下需要多层转义、且正则里的 `|` 会被二次解释，实测容易在 CI 与本地跑出不同结果。**
**复算命令（原样可粘贴）：`$c=Get-Content 'docs/superpowers/specs/2026-10-29-agent-card-s1-card-model-design-testcase.md'; ($c|Select-String '^### S1-TC-').Count; $ids=$c|Select-String '^\| (S1-TC-[A-Z][0-9]+) \|'|%{$_.Matches[0].Groups[1].Value}; $pos=($c|Select-String '^\| S1-TC-[A-Z][0-9]+ \| .*\| 正 \|').Count; $neg=($c|Select-String '^\| S1-TC-[A-Z][0-9]+ \| .*\| 负 \|').Count; $edge=($c|Select-String '^\| S1-TC-[A-Z][0-9]+ \| .*\| 边界 \|').Count; "rows $($ids.Count) pos $pos neg $neg edge $edge dupe $($ids.Count-($ids|Select-Object -Unique).Count)"; ($c|Select-String '^- \*\*前置\*\*').Count`**

```text
titles 58
rows 58 pos 14 neg 22 edge 22 dupe 0
premises 58
```

> v5 → v6 计数变化（**58 → 58**，零增删）：v6 的 8 处改动全部落在既有用例**内部**（C01 组 3 加两条构造 / B01 加值形态断言 / E01 加 (e) / E07 加 `review.dir/x` / I01·I02 加 `FreeTextEnum` 探针 / K04 加 ③b / A05·G05 词表改从 spec 切），类型列一字未改（正 14 / 负 22 / 边界 22）。
> **v6.1 重跑（2026-10-29，组号校正 + `evidenceRequired` 登记之后；命令 = 上方 ①②③ 原样，`Select-String` 形态）**：输出首行原样 `rows 58 pos 14 neg 22 edge 22 dupe 0`（另两行为 `titles 58` 与 `premises 58`）——**58 / 正 14 / 负 22 / 边界 22 全部未变**，与「零增删用例、零改断言」一致。

**C. 结论**

| 项 | 值 | 是否满足硬约束 |
|---|---|---|
| 用例总数 | 58 | ≤ 80 ✔ |
| 正例 | 14 | — |
| 负例 | 22 | — |
| 边界 | 22 | — |
| 负 + 边界 ≥ 正 | 44 ≥ 14 | ✔ |
| 覆盖总表行数 | 58（与用例条数相等，逐行有 ID） | ✔ |
| 五要素齐（覆盖 / 前置 / 步骤 / 预期 / 判据） | 58 / 58 | ✔（命令 ③ `premises 58` = 命令 ① `titles 58`，一条不少） |
| V-1～V-8 逐项有承载用例 | 8 / 8 | ✔（§1 末「验收对位」） |
| F-01～F-08 各有正向用例 | 8 / 8 | ✔（§1 末「F 对位」） |

**D. 自检（`spec-testcase-gate` 五条判据逐条）**

| # | 判据 | 结论 | 证据 |
|---|---|---|---|
| 1 | 文件存在（同目录、命名 = spec 文件名 + `-testcase.md`） | 过 | `docs/superpowers/specs/2026-10-29-agent-card-s1-card-model-design-testcase.md` |
| 2 | 编写者独立（`senior-sdet` 全新上下文，≠ spec 作者 ≠ 施工者）+ 文件头「编写者 / 独立性声明」 | 过 | 文件头第 5–6 行 |
| 3 | 用例五要素齐；负例 + 边界 ≥ 正例；覆盖总表每行指回 spec 编号 | 过 | §2 各条均含 6 个字段（覆盖 / 来源 / 前置 / 步骤 / 预期 / 判据）+ 红绿证据 / 对应测试 / 不覆盖；§1 每行「覆盖的 spec 条目」列均带 §/V/F 编号（**行号已按 spec v6 实文 301 行逐条重锚**）；计数见 C |
| 4 | spec 外链在位，spec 不内联用例 | 过 | spec v6 第 7 行写「测试用例文件：`2026-10-29-agent-card-s1-card-model-design-testcase.md`」；spec 全文无用例表 |
| 5 | 与 spec 一起送审（开卷清单两件并列） | 待送审时执行 | 由议会开评时核，不在本文件内自证 |

**E. 本次判定 spec 是否仍需要回流修订**：spec 累计吸收 **v1 的 6 条 P0**（码数 36 / `CARD_MODEL_CODES` / env 11 键 / 形状 / 入口签名 / §8 表达式组）、**v2 复核的 2 条 P0 + 1 处余项**（§4.1 两 `criterion` 分形 / §4.2 `SCAN_FIELDS` 扫描面 / §7 `:208` 开放项缺列归 S2）、**v3 复核的 2 条 P0**（`S1-G-16` `manual` 豁免在 `Action` 上无载体 / `S1-G-17` `HardcodedCount` 漏检全角与汉字数字）、**v4 复核的 8 处改判**（§8 重组、`CheckItem.criterion` 面、最长已登记前缀、最长前缀 + 归一、合并与四入口分离、`SUBJECTS` 出口面、`SCAN_FIELDS` 键形态、rubric 缺 `source` 收口）、**v6 复核的 5 处改判 + 4 条顺手修**（§8 `:226` 判定面粒度、`:180` 第三档两形态、`§6 :147` 码表值形态、`§3 :47-48` 四入口、`§7 :219` `FreeTextEnum` 入口；组 6 口径更正、组 3 相邻对、词表常量不自比、`pickSubject` 过滤），**累计闭合**（见 §8 末五张「对齐核对」表）。**仍有开项 6 条**（`S1-G-11` `requires` 形状 / `S1-G-12` 余项 PRD `:293` 省略号 / `S1-G-18` 不定量词 / `S1-G-19` `cards` 缺参 / `S1-G-22` `FreeTextEnum` 双报条数 / `S1-G-4` 的 `scenes[].label` 归码；`S1-G-4` 余项① `evidenceRequired` 已由 §10-D22 声明不判〔v6.1 登记 S1-G-23〕、`S1-G-13` 为「接受」项，二者不计），其中 **P0 = 0 条**：

- 已闭合（v5 / v6 新增断言守）：`S1-G-3`（K01 逐键 `path=env.<键>` + 继续判）、`S1-G-5`（I01 / I02 直断 `codes`）、`S1-G-9`（H04 + H02）、`S1-G-10`（G05 ④ + A05 ②）、`S1-G-12`（A01 同引用）、`S1-G-14`（K04 ① / ①b + D03 ④）、`S1-G-15`（**v6：I01 / I02 的 `FreeTextEnum` 探针 + K04 ③**）、`S1-G-16`（F03 ④-⑦）、`S1-G-17`（G07 ①②）、`S1-G-20`（**v6：§8 `:226` 已写死粒度 → C01 组 5 / 组 8 直接断言**）。
- 已收口（v6.1，不判）：`S1-G-4` 余项① `evidenceRequired`（spec §10-D22 `:281` 声明「本段不判」，建议 #4 标「v6.1 已采纳（不判）」；登记留 §7 S1-G-23）。
- 仍开（P2）：`S1-G-11`（`requires` 形状归码，建议 #12）、`S1-G-12` 余项（PRD `:293` 省略号，建议 #13）、`S1-G-18`（不定量词 / 多字汉字数字，建议 #19）、`S1-G-19`（`cards` 缺参码，建议 #20）、`S1-G-22`（`FreeTextEnum` 双报条数，建议 #22）、`S1-G-4` 的 `scenes[].label` 归码（§4 `:83` 要求两字段，只给 `why` 配了码）。

**P0 = 0，P1 = 0**（v6.1：`S1-G-4` 余项① `evidenceRequired` 已由 spec §10-D22 `:281` 声明「本段不判」，不再是缺口；剩 6 条 P2），不影响本文件现有断言的可执行性。`S1-G-20` 已由 v6 §8 `:226` 闭合——若实现仍按「完整 path」判 M2，C01 会红，此时**不得**把 `got[4]` / `got[7]` 放宽成「首码对上就过」，应改实现。
