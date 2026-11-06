# 阶段 2b 测试用例设计（独立 SDET）

> 角色：独立测试设计，不实现、不改 PRD。
> 依据：`stage-2b-rule-dsl-expressiveness.md`（下称 PRD）与 `criteria-engine/README.md`。
> 范围：PRD 可机判或可观察的结论；语义类结论见 §5「不可测条目」。
> 本文件只定义「怎么测、看什么」，不含实现方案与文件改动清单。

## 1. 取数形态与执行约定

| 形态 | 含义 | 本文件用法 |
|---|---|---|
| **PROBE** | 在现仓直接执行命令 / 读文件 / 点计数，对结果断言 | 用于门禁、构建、发布、文档内容、现仓产物 |
| **COPY** | 把 `tools/quality/criteria-engine/` 与 `rules/` 复制到系统临时根，在副本里构造坏数据，再跑副本内 `build.mjs` 或 `node scripts/check-criteria-engine.mjs --root <副本>` | 用于校验闸、判据语义、渲染规格；不污染现仓 |

约定：

- 所有「判红」期望必须同时给出 **退出码** 与 **目标 code**（如 `LabelShape`）；目标 code 未在输出中出现即算失败。
- 所有「渲染」期望给出 **必须出现的字面量子串** 或 **必须不出现的字面量子串**；整文件场景另给逐字节比对口径。
- 计数基线按现仓 5 条判据、34 条 testcase 记（13+7+7+4+3）。若 anchor-forms 落入 `tools/quality/criteria-engine/`，基线变为 6 条 / 38 条；用例内已标注该条件。
- `check-criteria-engine.mjs` 的 `--root` 只改数据根；`rules.json` 的登记表仍读源仓，故「登记判据」类用例统一使用已登记的 `evidence-before-conclusion`。
- **COPY 组统一先重渲染再校验**：凡改了判据 json 或 testcase，先在副本跑 `build.mjs` 重新生成 `md` / `inject.md`，再跑 `--root`；否则必然出现的 `ProjectionDrift` 会掩盖目标结论。负例若 `build.mjs` 已 exit 1，仍以 `--root` 输出中的目标 code 为准，派生红按 §7 口径不计。

## 2. 通用夹具

为避免每条用例重复描述数据，定义三个夹具；用例只写「在夹具上改哪一处」。

- **R-BASE**：临时根内的最小合法判据。字段为：id `r2b-base`、impl `script`、type `持续适用`、scope `global`、title `测试判据`、when 叶子 `flag eq true`、assert 一条叶子 `anchor nonEmpty`（label `锚`，probe `manual`）、residual `{who: reviewer-audit, sample: 3, fields: [anchor], objectivePath: 无}`、landing `答案`、refs 一项。配套 testcase：flag 真且 anchor 有值 → pass；flag 真且 anchor 空 → fail；flag 假 → pass。
- **R-COMBO**：在 R-BASE 的 assert 上换成组合节点的夹具；具体结构随用例给出。所有组合节点带 label 或 name，除非用例专门测缺失。
- **PILOT**：PRD §10 所称 pilot `rule-dsl/` 数据根，含 3 条旧判据（no-git-write / import-guard / no-unverified-number）与新增 `anchor-forms`。若工程实际落在 `tools/quality/criteria-engine/`，用例按同目录执行，只核 4 条 anchor-forms 语义。

## 3. 覆盖矩阵

| PRD 条目 | 覆盖用例 | 备注 / 缺口 |
|---|---|---|
| D-14 散文只能是渲染产物 | A-02、A-03、F-05、I-05 | 数据层由 Schema 白名单拦，产物层由漂移闸拦 |
| D-15 逻辑关系显式建模 | B-01 ~ B-08、H-02 ~ H-05 | anyOf / allOf / oneOf 双向 |
| D-16 同级不许混用逻辑键 | B-17、B-18 | 混用两型各一 |
| D-17 逻辑词唯一出处 = 结构树 | C-03、C-04、C-13 | 逻辑词入 label 判红 |
| D-18 label 必须是名词短语 | C-01 ~ C-08 | 长度、逻辑词、情态词、标点各覆盖 |
| D-19 谓词由算子产出 | C-09、C-12、F-08 | 含 PREDICATE 常量与「label 不得复述谓词」 |
| D-20 删除来源 | A-03、F-05、H-07、H-08、H-08b、I-05 | 字段、渲染、结构闸、说明层四处 |
| D-21 probe 与 landing 分离 | E-12、F-13 | observable-criteria 的迁移为实证 |
| D-22 时序 / 重试 / 回滚不进判据 | A-05 | 白名单拒绝 `retry` / `order` 等字段 |
| D-23 不设 group | A-04 | 白名单拒绝 `group` |
| §2 数据模型全字段 | A-01、A-09 ~ A-15、H-06 | 含 scope / refs 新字段 |
| §3 anyOf | B-01、B-02 | 正反各一 |
| §3 allOf | B-03、B-04 | 正反各一 |
| §3 oneOf | B-05 ~ B-08、B-30 | 两分支 + 三分支四态 |
| §3 not | B-09、B-10、B-29 | 叶子取反 + 组合子取反 |
| §3 unless | B-11 ~ B-14 | 叶子与组合节点各一组 |
| §3 嵌套 ≤ 3 | B-15、B-16 | 深度只数组合节点层数，顶层 = 1（R1 已裁定） |
| §3 同级混用判红 | B-17、B-18 | `LogicConflict` |
| §3 组合元数 ≥ 2 | B-19 ~ B-21 | anyOf / allOf / oneOf |
| §3 when 可递归 | B-25 ~ B-28、B-31 | 含 `always:true` 与 `allOf` |
| §4 label 长度 | C-01、C-02 | 12 / 13 字符边界 |
| §4 label 逻辑词 | C-03、C-04 | 任一 / 恰好；先报 `LogicWordInLabel` |
| §4 label 情态与祈使词 | C-05、C-06、C-09 | 必须 / 执行 / 复述谓词 |
| §4 label 标点 | C-07、C-08 | 冒号 / 斜杠 |
| §4 name | C-10、C-15 | 选填、缺省回退 `field`；label/name 并存按位置取值 |
| §4 LOGIC_LABELS | C-11 | 四个常量逐字核 |
| §4 PREDICATE | C-12、D 组全部正例 | 渲染文案与 OPS 旧标签分离 |
| §5 沿用 4 算子 | D-01 ~ D-15 | 每算子至少 1 正 + 1 反 |
| §5 新增算子 | D-16 ~ D-43 | 按表 14 个、总 18 个；建议 PRD 补数量句 |
| §6 probe kind=command | E-01、E-02 | exit / stdout 两 take |
| §6 probe kind=file | E-03、E-04 | exists / content 两 take |
| §6 probe kind=glob | E-05、E-06 | count / names 两 take |
| §6 probe kind=manual | E-07 | 无「运行」前缀 |
| §6 RuleWithoutProbe + ProbeSchema | E-08 ~ E-11、E-13 | 全部判据都要 probe；E-10 期望红；ProbeSchema 另测 |
| §7 不渲染来源 | F-05 | 整文件不得含「来源」 |
| §7 label 在前、谓词在后 | F-08 | 行首形态 |
| §7 组合节点渲染 | F-09、F-10、C-11、B-29 | 含子父不同类型加括号；not 渲染为 `不得（A 或 B）` |
| §7 unless 渲染 | F-11、C-13 | `（例外：label）` |
| §7 manual 无「运行」前缀 | E-07 | 与 F-08 交叉 |
| §7 标题 / 触发 / 义务头 / 编号 / 另见 / 落点 | F-01 ~ F-07、F-12、F-13、C-14 | 逐行核；refs 两项按顺序渲染 |
| §7 不渲染 residual / type / scope | F-14、F-15 | 元数据不进正文 |
| §7 observable-criteria 样例 | F-16 | BLOCKED：OD-4 正文定稿后激活，当前弱断言 |
| §8 Schema | A-01、A-02、A-11、A-12、A-14、A-15 | 未登记字段 / 缺必填 / impl / type |
| §8 ScopeMissing / ScopeInvalid | A-06、A-07、A-08 | 缺、空名、大写、含下划线 |
| §8 LogicConflict | B-17、B-18 | |
| §8 LogicArity | B-19 ~ B-21 | |
| §8 DepthExceeded | B-16 | 深度口径已裁定 |
| §1 S-1 嵌套组合 label | B-23 | 嵌套无 label 合法；只保留顶层 AssertLabelMissing |
| §8 AssertLabelMissing | B-24 | |
| §8 LabelShape | C-02、C-05 ~ C-09、I-06 | 固定修法文案 |
| §8 LogicWordInLabel | C-03、C-04 | 先报，其余归 LabelShape |
| §8 RuleWithoutProbe | E-09、E-10 | 全部判据 |
| §8 FieldLabelMissing | G-01 ~ G-03 | 含递归收集正例 |
| §8 UnlessLabelMissing（R1 新增） | C-13 | `unless` 存在则 label 必填 |
| §8 ProbeSchema（R1 新增） | E-13 | kind / take / run / path 合法性 |
| §10 旧 18 条不改仍绿 | H-01、I-02 | 哈希 + 18/18 |
| §10 anchor-forms 4 条 | H-02 ~ H-05 | 结构以 PRD 定稿为准 |
| §10 anchor-forms 预算 | K-03 | 100–500 非空白字符 |
| §10 5 份 json 补槽 | H-06、H-06b | evidence testcase 重写并保持 13 条语义 |
| §10 结构闸 V-4 改件 | H-07 | 来源锚删除、判定动作加入 |
| §10 rule-audit-lite 去来源 | H-08、H-08b | 反例 100% 红；正例 0% 绿 |
| §10 README 追加裁定 | H-09 | 缺反例，见 §6 |
| §10 rule-writer 新分支 | H-10、I-09 | |
| §11 V-2b-1 ~ V-2b-11 | I-01 ~ I-11（含 I-01b） | 逐条映射；I-11 BLOCKED |
| §12 风险-2 收紧 | I-12 | 用户签字另计 |
| §12 风险-4 matches 过强 | U-03 | 不可机判 |
| §12 风险-7 发布污染 | I-11 | BLOCKED |
| §13 387 不再是验收值 | K-01 | 改为 100–500 区间 |
| §14 global 进 user_rules | I-11、J-01、J-02、J-03 | |
| §14 project 不进 user_rules | I-11 | BLOCKED |
| §14 数据不得写用户目录 | J-01、J-02 | |
| §14 rule-writer 不出品 | I-10、J-03 | |
| §14 他仓规则由本仓代写 | J-04 | 条件性，见 §6 |

## 4. 用例

### 4.1 A 组：数据模型、字段与 scope（15 条）

| ID | 覆盖对象 | 前置 | 步骤 | 期望结果 | 形态 |
|---|---|---|---|---|---|
| A-01 | §2 字段表 / §8 Schema | 临时根复制 engine + rules；R-BASE 放进 engine 根，不登记 `rules.json` | 给 R-BASE 补 `scope: global` 与 `refs: ["skills/x.md"]`；跑副本 `build.mjs`，再跑 `check-criteria-engine.mjs --root 副本` | `build.mjs` exit 0，末行 `rule-dsl ok`；生成 `r2b-base.md` 与 `r2b-base.inject.md`；校验器 exit 0，首行 `判据 6 条 / 绿 37 / 红 0`（5 条基线 34 + R-BASE 3；anchor-forms 若也在本目录则为 `7 条 / 绿 41`） | COPY |
| A-02 | D-14 / §8 Schema | 同上 | 在 R-BASE 增加 `rationale: "说明文字"` | `build.mjs` exit 1；stdout 含 `未登记字段 rationale` 与 `描述性字段不允许`；校验器 `--root` exit 1，含 `Schema` | COPY |
| A-03 | D-14 / D-20 / §8 Schema | 同上 | 在 R-BASE 增加 `source: "PRD"` | exit 1；输出含 `未登记字段 source` | COPY |
| A-04 | D-23 / §8 Schema | 同上 | 在 R-BASE 增加 `group: "锚"` | exit 1；输出含 `未登记字段 group` | COPY |
| A-05 | D-22 / §8 Schema | 同上 | 在 R-BASE 分别增加 `retry: 3`、`order: 1`、`rollback: true`，各跑一次 | 三次均 exit 1；输出分别含 `未登记字段 retry`、`未登记字段 order`、`未登记字段 rollback` | COPY |
| A-06 | §8 ScopeMissing | 同上 | 删除 R-BASE 的 `scope` 字段 | exit 1；stderr 含 `ScopeMissing`；不得只有泛化 `Schema` 而无 `ScopeMissing` | COPY |
| A-07 | §8 ScopeInvalid | 同上 | 把 `scope` 改为 `project:`（冒号后为空） | exit 1；stderr 含 `ScopeInvalid`，且点名 `r2b-base` | COPY |
| A-08 | §8 ScopeInvalid | 同上 | 把 `scope` 改为 `GLOBAL` 跑一次；再改为 `project:lpm_x` 跑一次 | 两次均 exit 1；stderr 均含 `ScopeInvalid`，且点名 `r2b-base` | COPY |
| A-09 | §2 scope = project:<name> | 同上 | 把 `scope` 改为 `project:lpm`，其余合法 | exit 0；渲染产物文件仍生成；无 `ScopeInvalid` | COPY |
| A-10 | §2 refs 选填 | 同上 | 删除 R-BASE 的 `refs` 字段；跑 `build.mjs` | exit 0；生成的 `r2b-base.md` 不含 `另见：` 行 | COPY |
| A-11 | §8 Schema / type 枚举 | 同上 | 把 `type` 改为 `持续` | exit 1；输出含 `type 非法枚举` 与 `持续适用 / 条件触发 / 模式门控` | COPY |
| A-12 | §8 Schema / impl | 同上 | 把 `impl` 改为 `manual` | exit 1；输出含 `本执行器只接受 impl=script` | COPY |
| A-13 | §2 assert 必填 / 测试完备 | 同上 | 删除 `r2b-base.testcase.json` | `build.mjs` exit 1；stdout 含逐字文案 `判据无 testcase（r2b-base.testcase.json）→ 未验证，不得渲染`；校验器 `--root` 含 `TestcaseMissing` | COPY |
| A-14 | §2 title 必填 | 同上 | 删除 R-BASE 的 `title` | exit 1；输出含 `缺字段 title` | COPY |
| A-15 | §2 when 必填 | 同上 | 删除 R-BASE 的 `when` | exit 1；输出含 `缺字段 when` | COPY |

### 4.2 B 组：条件语法（31 条）

除注明外，均在临时根新建 `r2b-logic` → 跑 `check-criteria-engine.mjs --root`；判据语义由该判据自己的 testcase 期望值锁死，judge 错则出现 `CaseMismatch`。

| ID | 覆盖对象 | 前置 | 步骤 | 期望结果 | 形态 |
|---|---|---|---|---|---|
| B-01 | §3 anyOf 正例 | R-COMBO：assert 为 `anyOf[anchor nonEmpty, command nonEmpty]` | testcase 一条 `{flag:true, anchor:"", command:"x"}` 期望 pass | 校验器 exit 0；无 `CaseMismatch` | COPY |
| B-02 | §3 anyOf 反例 | 同 B-01 | testcase 一条 `{flag:true, anchor:"", command:""}` 期望 fail | 校验器 exit 0；无 `CaseMismatch` | COPY |
| B-03 | §3 allOf 正例 | assert 为 `allOf[anchor nonEmpty, command nonEmpty]` | testcase 两字段都有值，期望 pass | 校验器 exit 0 | COPY |
| B-04 | §3 allOf 反例 | 同 B-03 | testcase anchor 有值、command 空，期望 fail | 校验器 exit 0 | COPY |
| B-05 | §3 oneOf 正例（仅 A 真） | assert 为 `oneOf[anchor nonEmpty, command nonEmpty]` | testcase anchor 有值、command 空，期望 pass | 校验器 exit 0 | COPY |
| B-06 | §3 oneOf 正例（仅 B 真） | 同 B-05 | testcase anchor 空、command 有值，期望 pass | 校验器 exit 0 | COPY |
| B-07 | §3 oneOf 反例（0 真） | 同 B-05 | testcase 两字段都空，期望 fail | 校验器 exit 0 | COPY |
| B-08 | §3 oneOf 反例（2 真） | 同 B-05 | testcase 两字段都有值，期望 fail | 校验器 exit 0 | COPY |
| B-09 | §3 not 正例 | assert 为 `not{anchor nonEmpty}` | testcase anchor 空，期望 pass | 校验器 exit 0 | COPY |
| B-10 | §3 not 反例 | 同 B-09 | testcase anchor 有值，期望 fail | 校验器 exit 0 | COPY |
| B-11 | §3 unless 叶子正例 | assert 叶子 `anchor nonEmpty` + `unless{skip eq true}` | testcase `{flag:true, anchor:"", skip:true}` 期望 pass | 校验器 exit 0；生成 md 含 `（例外：` | COPY |
| B-12 | §3 unless 叶子反例 | 同 B-11 | testcase `{flag:true, anchor:"", skip:false}` 期望 fail | 校验器 exit 0 | COPY |
| B-13 | §3 unless 挂组合节点正例 | assert `anyOf[anchor, command]` + `unless allOf[skipA eq true, skipB eq true]` | testcase anchor/command 都空、skipA/skipB 都真，期望 pass | 校验器 exit 0 | COPY |
| B-14 | §3 unless 挂组合节点反例 | 同 B-13 | testcase anchor/command 都空、skipA 真 skipB 假，期望 fail | 校验器 exit 0 | COPY |
| B-15 | §3 嵌套深度 3 正例 | assert `anyOf[allOf[not{anchor empty}, command nonEmpty], refPath nonEmpty]` | testcase anchor 有值、command 有值，期望 pass；跑校验器 | 校验器 exit 0；无 `DepthExceeded` | COPY |
| B-16 | §3 深度 4 反例 | 在 B-15 的 `anyOf` 内再套一层 `allOf` | 只跑校验器，不要求判据语义 | exit 1；stderr 含 `DepthExceeded`，点名 `r2b-logic` | COPY |
| B-17 | §8 LogicConflict（anyOf+allOf） | assert 同一节点同时写 `anyOf` 与 `allOf` | 跑校验器 | exit 1；stderr 含 `LogicConflict`，点名 `r2b-logic` | COPY |
| B-18 | §8 LogicConflict（anyOf+not） | 同一节点同时写 `anyOf` 与 `not` | 跑校验器 | exit 1；stderr 含 `LogicConflict` | COPY |
| B-19 | §8 LogicArity（anyOf=1） | assert `anyOf[anchor nonEmpty]` | 跑校验器 | exit 1；stderr 含 `LogicArity` | COPY |
| B-20 | §8 LogicArity（allOf=1） | assert `allOf[anchor nonEmpty]` | 跑校验器 | exit 1；stderr 含 `LogicArity` | COPY |
| B-21 | §8 LogicArity（oneOf=1） | assert `oneOf[anchor nonEmpty]` | 跑校验器 | exit 1；stderr 含 `LogicArity` | COPY |
| B-22 | §8 算子表封闭（嵌套） | 在 `anyOf` 子项里写未注册 op `contains` | 跑校验器 | exit 1；stderr 含 `op 未注册` 与 `contains` | COPY |
| B-23 | §1 S-1 嵌套组合 label | assert 顶层 `anyOf` 有 label `锚`；子 `allOf` 无 label；子叶子字段齐全 | 跑副本 `build.mjs` 与 `check-criteria-engine.mjs --root` | 两者 exit 0；stderr 无 `DeepExpressionUnlabeled`、无 `AssertLabelMissing`；md 含顶层 `锚（以下任一：`，子项不额外出现 label | COPY |
| B-24 | §8 AssertLabelMissing | assert 顶层叶子去掉 `label` | 跑校验器 | exit 1；stderr 含 `AssertLabelMissing` | COPY |
| B-25 | §3 when 递归 / 触发 | when 为 `anyOf[flag eq true, gateRun eq true]`；assert 一条满足即过 | testcase `{flag:false, gateRun:true, anchor:"x"}` 期望 pass | 校验器 exit 0 | COPY |
| B-26 | §3 when 递归 / 不触发 | 同 B-25 | testcase `{flag:false, gateRun:false, anchor:""}` 期望 pass | 校验器 exit 0 | COPY |
| B-27 | §3 always:true 正例 | when 为 `{always:true}`；assert `anchor nonEmpty` | testcase `{anchor:"x"}` 期望 pass；跑副本 `build.mjs` | exit 0；md 含 `> 触发：始终适用` | COPY |
| B-28 | §3 always:true 反例 | 同 B-27 | testcase `{anchor:""}` 期望 fail | 校验器 exit 0 | COPY |
| B-29 | §3 not 套组合子 + 渲染 | assert 为 `not{anyOf[anchor nonEmpty, command nonEmpty]}`，父节点 label `锚` | testcase ① `{flag:true, anchor:"", command:""}` 期望 pass；② `{flag:true, anchor:"x", command:""}` 期望 fail；再跑副本 `build.mjs` 读 md | 校验器 exit 0、无 `CaseMismatch`；md 含 `不得（`，且该括号段内出现 ` 或 `；同一括号段不得出现 ` 且 `（不得渲染成 `不得（A 且 B）`） | COPY |
| B-30 | §3 oneOf 三分支四态 | assert 为 `oneOf[anchor nonEmpty, command nonEmpty, refPath nonEmpty]`，label `锚` | testcase 四条：0 真 expect fail；仅 anchor 真 expect pass；anchor+command 真 expect fail；三字段全真 expect fail | 校验器 exit 0；四条无 `CaseMismatch` | COPY |
| B-31 | §3 when 用 allOf | when 为 `allOf[flag eq true, gateRun eq true]`；assert `anchor nonEmpty` | testcase ① `{flag:true, gateRun:true, anchor:"x"}` 期望 pass；② `{flag:true, gateRun:false, anchor:""}` 期望 pass（不触发） | 校验器 exit 0；无 `CaseMismatch` | COPY |

### 4.3 C 组：label / name / LOGIC_LABELS / PREDICATE（15 条）

除注明外，均在临时根改 `evidence-before-conclusion.json` 的 `assert[0].label`，跑 `check-criteria-engine.mjs --root`；只核目标 code，不把由此产生的 `ProjectionDrift` 当作额外失败。

| ID | 覆盖对象 | 前置 | 步骤 | 期望结果 | 形态 |
|---|---|---|---|---|---|
| C-01 | §4 label 长度边界（12） | 同上 | label 改为 `取数命令与引用路径核验值`（12 字符）；跑副本 `build.mjs` | exit 0；md 含该 label | COPY |
| C-02 | §4 label 超长（13） | 同上 | label 改为 `取数命令与引用路径核验值X`（13 字符） | exit 1；stderr 含 `LabelShape` 与固定修法 `label 只许名词短语（≤12 字符、不含逻辑词/情态词/标点）；谓词由算子产出` | COPY |
| C-03 | D-17 / §4 逻辑词 | 同上 | label 改为 `任一锚点`（无其他违规） | exit 1；stderr 含 `LogicWordInLabel` 与 `任一`；同一行不出现 `LabelShape`（逻辑词由前者先报） | COPY |
| C-04 | D-17 / §4 逻辑词 | 同上 | label 改为 `恰好锚点`（无其他违规） | exit 1；stderr 含 `LogicWordInLabel` 与 `恰好`；同一行不出现 `LabelShape` | COPY |
| C-05 | §4 情态词 | 同上 | label 改为 `必须锚` | exit 1；stderr 含 `LabelShape` 与固定修法全文（同 C-02） | COPY |
| C-06 | §4 祈使词 | 同上 | label 改为 `执行取数` | exit 1；stderr 含 `LabelShape` 与固定修法全文 | COPY |
| C-07 | §4 标点（冒号） | 同上 | label 改为 `锚点：路径` | exit 1；stderr 含 `LabelShape` 与固定修法全文 | COPY |
| C-08 | §4 标点（斜杠） | 同上 | label 改为 `锚点/路径` | exit 1；stderr 含 `LabelShape` 与固定修法全文 | COPY |
| C-09 | D-19 label 不得承载谓词 | 同上 | label 改为 `命令必须非空` | exit 1；stderr 含 `LabelShape` 与固定修法全文 | COPY |
| C-10 | §4 name 选填 + 回退 | 临时根 R-COMBO：`anyOf` 一个叶子带 `name: 取数命令`，另一个叶子不写 `name` 且 `field: refPath` | 跑副本 `build.mjs` | exit 0；md 同时含显式 `取数命令` 与回退字段名 `refPath` | COPY |
| C-11 | §4 LOGIC_LABELS 四值 | 临时根 R-COMBO 同时构造 anyOf / allOf / oneOf / not | 跑副本 `build.mjs` | exit 0；md 同时含 `以下任一`、`全部满足`、`恰好一个`、`不得` | COPY |
| C-12 | D-19 / §5 PREDICATE | 临时根把 assert 改为 `containsAny values ["a","b"]` | 跑副本 `build.mjs` | md 含 `必须包含以下任一：a / b`，且不含旧算子文案 `包含任一字面量` | COPY |
| C-13 | §4 unless 的 label 渲染 + 必填 | 临时根 assert 增加 `unless` 并带 label `跳过核` | ① 跑副本 `build.mjs`；② 删除 `unless.label` 后跑 `check-criteria-engine.mjs --root` | ① exit 0；md 含 `（例外：跳过核）`；② exit 1；stderr 含 `UnlessLabelMissing` 与 `跳过核` 所在义务 | COPY |
| C-14 | §7 refs 两项渲染 | R-BASE 的 `refs` 改为 `["skills/a.md", "skills/b.md"]` | 跑副本 `build.mjs` | exit 0；md 出现一行以 `另见：` 开头，且该行按顺序同时含 `skills/a.md` 与 `skills/b.md` | COPY |
| C-15 | OD-13 叶子 label 与 name 并存 | R-COMBO 两条 assert：① 顶层叶子同时有 `label: 锚` 与 `name: 取数命令`；② `anyOf` 子项叶子同样两者都有，父节点 label `锚形式` | 跑副本 `build.mjs` | exit 0；① 顶层义务行用 `锚：`；② 组合子项位置用 `取数命令`；两处不混用 | COPY |

### 4.4 D 组：算子（43 条）

每条用例均使用临时根 R-BASE：把 `assert[0]` 改为目标 op，并修改 testcase。下表把「输入 / expect / 判定结果」拆成三列：`expect` 是 testcase 写的期望值，`判定结果` 是 judge 应返回的实得值；两者相等才是绿。

| ID | 覆盖对象 | 前置 | 输入 | expect | 判定结果 | 渲染期望 | 形态 |
|---|---|---|---|---|---|---|---|
| D-01 | §5 `eq` true 正例 | R-BASE，assert `eq value true` | `anchor:true` | pass | pass | md 含 `必须成立` | COPY |
| D-02 | §5 `eq` true 反例 | 同上 | `anchor:false` | fail | fail | md 含 `必须成立` | COPY |
| D-03 | §5 `eq` false 正例 | R-BASE，assert `eq value false` | `anchor:false` | pass | pass | md 含 `必须不成立` | COPY |
| D-04 | §5 `eq` false 反例 | 同上 | `anchor:true` | fail | fail | md 含 `必须不成立` | COPY |
| D-05 | §5 `eq` 其他值正例 | R-BASE，assert `eq value "abc"` | `anchor:"abc"` | pass | pass | md 含 `必须等于` 与 `abc` | COPY |
| D-06 | §5 `eq` 其他值反例 | 同上 | `anchor:"abd"` | fail | fail | md 含 `必须等于` 与 `abc` | COPY |
| D-07 | §5 `nonEmpty` 正例 | R-BASE，assert `nonEmpty` | `anchor:"x"` | pass | pass | md 含 `必须非空` | COPY |
| D-08 | §5 `nonEmpty` 反例 | 同上 | `anchor:""` | fail | fail | md 含 `必须非空` | COPY |
| D-09 | §5 `nonEmpty` 空白反例 | 同上 | `anchor:"   "` | fail | fail | md 含 `必须非空` | COPY |
| D-10 | §5 `containsAny` 正例 | R-BASE，assert `containsAny values ["a","b"]` | `anchor:"xxbxx"` | pass | pass | md 含 `必须包含以下任一：a / b` | COPY |
| D-11 | §5 `containsAny` 反例 | 同上 | `anchor:"xx"` | fail | fail | md 含 `必须包含以下任一：a / b` | COPY |
| D-12 | §5 `notForbiddenCommand` 正例 | 临时根 no-git-write 判据 | `command:"git status"` | pass | pass | md 含 `必须不在禁止清单内`、`允许：`、`禁止：`，且列出 `git status` 与 `git commit` | COPY |
| D-13 | §5 `notForbiddenCommand` 反例 | 同上 | `command:"git commit -m x"`，`userNamed:false` | fail | fail | md 同 D-12 的清单 | COPY |
| D-14 | §5 `notForbiddenCommand` 最长允许优先正例 | 同上 | `command:"git remote -v"` | pass | pass | md 同 D-12 的清单 | COPY |
| D-15 | §5 `notForbiddenCommand` 最长允许优先反例 | 同上 | `command:"git remote add origin"` | fail | fail | md 同 D-12 的清单 | COPY |
| D-16 | §5 `empty` 正例 | R-BASE，assert `empty` | `anchor:""` | pass | pass | md 含 `必须为空` | COPY |
| D-17 | §5 `empty` 反例 | 同上 | `anchor:"x"` | fail | fail | md 含 `必须为空` | COPY |
| D-18 | §5 `notContains` 正例 | R-BASE，assert `notContains values ["x","y"]` | `anchor:"abc"` | pass | pass | md 含 `不得包含以下任一：x / y` | COPY |
| D-19 | §5 `notContains` 反例 | 同上 | `anchor:"xabc"` | fail | fail | md 含 `不得包含以下任一：x / y` | COPY |
| D-20 | §5 `startsWithAny` 正例 | R-BASE，assert `startsWithAny values ["node ","Get-ChildItem"]` | `anchor:"node tmp/x.mjs"` | pass | pass | md 含 `必须以以下任一项开头：node  / Get-ChildItem` | COPY |
| D-21 | §5 `startsWithAny` 反例 | 同上 | `anchor:"我觉得是 30%"` | fail | fail | md 含 `必须以以下任一项开头` | COPY |
| D-22 | §5 `matches` 正例 | R-BASE，assert `matches pattern "^TODO:"` | `anchor:"TODO: fix"` | pass | pass | md 含 `必须匹配` 与 `^TODO:` | COPY |
| D-23 | §5 `matches` 反例 | 同上 | `anchor:"FIXME"` | fail | fail | md 含 `必须匹配` 与 `^TODO:` | COPY |
| D-24 | §5 `notMatches` 正例 | R-BASE，assert `notMatches pattern "TODO"` | `anchor:"clean"` | pass | pass | md 含 `不得匹配` 与 `TODO` | COPY |
| D-25 | §5 `notMatches` 反例 | 同上 | `anchor:"TODO: fix"` | fail | fail | md 含 `不得匹配` 与 `TODO` | COPY |
| D-26 | §5 `gt` 正例 | R-BASE，assert `gt value 3` | `anchor:5` | pass | pass | md 含 `必须大于` 与 `3` | COPY |
| D-27 | §5 `gt` 边界反例 | 同上 | `anchor:3` | fail | fail | md 含 `必须大于` 与 `3` | COPY |
| D-28 | §5 `gte` 正例 | R-BASE，assert `gte value 3` | `anchor:3` | pass | pass | md 含 `≥` 与 `3` | COPY |
| D-29 | §5 `gte` 反例 | 同上 | `anchor:2` | fail | fail | md 含 `≥` 与 `3` | COPY |
| D-30 | §5 `lt` 正例 | R-BASE，assert `lt value 3` | `anchor:2` | pass | pass | md 含 `必须小于` 与 `3` | COPY |
| D-31 | §5 `lt` 边界反例 | 同上 | `anchor:3` | fail | fail | md 含 `必须小于` 与 `3` | COPY |
| D-32 | §5 `lte` 正例 | R-BASE，assert `lte value 3` | `anchor:3` | pass | pass | md 含 `≤` 与 `3` | COPY |
| D-33 | §5 `lte` 反例 | 同上 | `anchor:4` | fail | fail | md 含 `≤` 与 `3` | COPY |
| D-34 | §5 `countEq` 正例 | R-BASE，assert `countEq value 2` | `anchor:2` | pass | pass | md 含 `计数必须等于 2` | COPY |
| D-35 | §5 `countEq` 反例 | 同上 | `anchor:3` | fail | fail | md 含 `计数必须等于 2` | COPY |
| D-36 | §5 `countLte` 正例 | R-BASE，assert `countLte value 3` | `anchor:2` | pass | pass | md 含 `计数必须 ≤ 3` | COPY |
| D-37 | §5 `countLte` 反例 | 同上 | `anchor:4` | fail | fail | md 含 `计数必须 ≤ 3` | COPY |
| D-38 | §5 `countGte` 正例 | R-BASE，assert `countGte value 3` | `anchor:3` | pass | pass | md 含 `计数必须 ≥ 3` | COPY |
| D-39 | §5 `countGte` 反例 | 同上 | `anchor:2` | fail | fail | md 含 `计数必须 ≥ 3` | COPY |
| D-40 | §5 `includesAll` 正例 | R-BASE，assert `includesAll values ["a","b"]` | `anchor:["b","a","c"]` | pass | pass | md 含 `必须包含全部：a / b` | COPY |
| D-41 | §5 `includesAll` 反例 | 同上 | `anchor:["a","c"]` | fail | fail | md 含 `必须包含全部：a / b` | COPY |
| D-42 | §5 `includesAny` 正例 | R-BASE，assert `includesAny values ["a","b"]` | `anchor:["a","c"]` | pass | pass | md 含 `必须包含以下任一项：a / b` | COPY |
| D-43 | §5 `includesAny` 反例 | 同上 | `anchor:["c"]` | fail | fail | md 含 `必须包含以下任一项：a / b` | COPY |

### 4.5 E 组：probe（13 条）

| ID | 覆盖对象 | 前置 | 步骤 | 期望结果 | 形态 |
|---|---|---|---|---|---|
| E-01 | §6 command + exit | 临时根 R-BASE 的 assert 带 `probe: command, run: "node scripts/x.mjs", take: exit`，op 为 `eq 0` | 跑副本 `build.mjs` | md 第 1 条义务行逐字为 `1. 锚：运行 `node scripts/x.mjs`，取退出码；必须等于 0` | COPY |
| E-02 | §6 command + stdout | 同上，`take: stdout` | 跑副本 `build.mjs` | md 含 `取输出首行；`，且整行按 `{probe 渲染}；{谓词}` 分号拼接 | COPY |
| E-03 | §6 file + exists | probe 改为 `file, path: "docs/x.md", take: exists` | 跑副本 `build.mjs` | md 含 `检查 `docs/x.md` 是否存在` | COPY |
| E-04 | §6 file + content | probe 改为 `file, take: content` | 跑副本 `build.mjs` | md 含 `读取 `docs/x.md` 内容` | COPY |
| E-05 | §6 glob + count | probe 改为 `glob, path: "docs/*.md", take: count` | 跑副本 `build.mjs` | md 含 `统计 `docs/*.md` 的文件数` | COPY |
| E-06 | §6 glob + names | probe 改为 `glob, take: names` | 跑副本 `build.mjs` | md 含 `列出文件名` | COPY |
| E-07 | §6 manual 渲染 | probe 改为 `manual` | 跑副本 `build.mjs` | md 该义务行不含 `运行`；含 `锚：` 与 `必须非空` | COPY |
| E-08 | §6 RuleWithoutProbe 正例 | 临时根 `evidence-before-conclusion` 补齐 9 条 assert 的 probe | 跑 `check-criteria-engine.mjs --root` | exit 0；stderr 无 `RuleWithoutProbe` | COPY |
| E-09 | §6 RuleWithoutProbe 反例 | 临时根删除 `evidence-before-conclusion.json` 的 `assert[0].probe` | 跑 `check-criteria-engine.mjs --root` | exit 1；stderr 含 `RuleWithoutProbe` 与 `evidence-before-conclusion` | COPY |
| E-10 | §6 RuleWithoutProbe 全量约束 | 临时根删除 `observable-criteria.json` 的唯一 assert 的 probe（该判据不在 `rules.json`） | 跑 `check-criteria-engine.mjs --root` | exit 1；stderr 含 `RuleWithoutProbe` 与 `observable-criteria`（全部判据都要求 probe） | COPY |
| E-11 | §6 只约束 assert 顶层 | 临时根在 `evidence-before-conclusion` 的 assert 内嵌 `anyOf`，顶层有 probe、子叶子无 probe | 跑 `check-criteria-engine.mjs --root` | exit 0；无 `RuleWithoutProbe` | COPY |
| E-12 | D-21 / §10 observable 迁移 | 现仓 `observable-criteria.json` | 读取 json 的 probe 与 landing；跑副本 `build.mjs` 后读 md | json：probe.kind=`command`、take=`exit`、run 即 `node scripts/check-observable.mjs --check`；landing=`check-observable 输出`；md 落点行为 `落点：check-observable 输出`，且该行不含 `node scripts/` | PROBE |
| E-13 | §8 ProbeSchema 四类非法 | 临时根 R-BASE 逐次改 probe 四处 | ① `kind:"shell"`；② `kind:"command"` 缺 `run`；③ `kind:"file"` 缺 `path`；④ `kind:"command", take:"tail"`；每次跑 `--root` | 四次均 exit 1；stderr 均含 `ProbeSchema` 并点名对应字段 | COPY |

### 4.6 F 组：渲染规格（17 条）

| ID | 覆盖对象 | 前置 | 步骤 | 期望结果 | 形态 |
|---|---|---|---|---|---|
| F-01 | §7 标题 | 临时根 R-BASE，跑副本 `build.mjs` | 读 `r2b-base.md` 首行 | 首行逐字为 `# 测试判据` | COPY |
| F-02 | §7 触发 label | R-BASE 的 when 带 label `持续适用` | 跑副本 `build.mjs` | 第 3 行逐字为 `> 触发：持续适用` | COPY |
| F-03 | §3 / §7 always 渲染 | when 为 `{always:true}` | 跑副本 `build.mjs` | md 含 `> 触发：始终适用` | COPY |
| F-04 | §2 / §7 when 无 label 回退 | when 为叶子且无 label | 跑副本 `build.mjs` | md 第 3 行逐字为 `> 触发：flag 等于 true` | COPY |
| F-05 | D-20 / §7 不渲染来源 | R-BASE | 读生成的 md 全文 | 全文不出现子串 `来源`；不以 `> 来源` 开头 | COPY |
| F-06 | §7 义务头 | R-BASE | 读 md 义务段首行 | 逐字为 `义务（全部成立才合规；缺一件 = 不合格）：` | COPY |
| F-07 | §7 编号义务 | R-BASE 两条 assert | 读 md | 依次出现行首 `1. ` 与 `2. `，且 `1.` 后为 label | COPY |
| F-08 | D-19 / §7 label 在前、谓词在后 | R-BASE（probe 为 manual） | 读 md 第 1 条义务行 | 逐字为 `1. 锚：必须非空`；`锚：` 在谓词之前，且无 `运行` 前缀 | COPY |
| F-09 | §7 组合节点渲染 | R-COMBO `anyOf[anchor, command]`，父 label `锚形式` | 跑副本 `build.mjs` | md 含 `锚形式（以下任一：` | COPY |
| F-10 | §7 子父逻辑类型不同加括号 | R-COMBO `anyOf[allOf[...], refPath]` | 跑副本 `build.mjs` | md 含 `（以下任一：` 且其内部出现 `（全部满足：` | COPY |
| F-11 | §7 unless 渲染 | R-BASE 一条 assert 带 `unless` label `跳过核` | 跑副本 `build.mjs` | md 含 `（例外：跳过核）` | COPY |
| F-12 | §7 另见行 | R-BASE 保留 `refs: ["skills/x.md"]` | 跑副本 `build.mjs` | md 含逐字行 `另见：skills/x.md` | COPY |
| F-13 | §7 落点行 | R-BASE | 跑副本 `build.mjs` | md 含逐字行 `落点：答案` | COPY |
| F-14 | §2 residual 不渲染 | R-BASE 的 residual 含 who/sample/fields | 读 md 全文 | 全文不含 `残余（抽检）`，不含 `reviewer-audit ×3` | COPY |
| F-15 | §2 type/scope 不渲染 | R-BASE | 读 md 全文 | 全文不含 `scope`、不含 `global`、不含 `持续适用`（触发 label 若同名则改 label 后再测） | COPY |
| F-16 | §7 observable 样例逐字节 | 现仓 `observable-criteria` | 跑 `build.mjs` 后读 `tools/quality/criteria-engine/observable-criteria.md` | **状态 BLOCKED：OD-4 正文定稿后激活**。当前弱断言：md 必须含 `运行 `node scripts/check-observable.mjs --check`，取退出码；必须等于 0`，且不得含旧的连写 `退出码必须等于 0`。激活后改逐字节比对 | PROBE |
| F-17 | §10 evidence 重渲染 | 现仓 `evidence-before-conclusion` | 跑 `build.mjs` 后读 `rules/evidence-before-conclusion.md` | 全文无 `来源`；含 `（以下任一：` 与 `（例外：`；每条义务行先 label 后谓词 | PROBE |

### 4.7 G 组：FieldLabelMissing 与闸的可追溯性（4 条）

| ID | 覆盖对象 | 前置 | 步骤 | 期望结果 | 形态 |
|---|---|---|---|---|---|
| G-01 | §8 递归 knownFields 正例 | 临时根 R-COMBO 的嵌套叶子里有字段 `nestedAnchor`；`residual.fields` 写 `["nestedAnchor"]` | 跑校验器 | exit 0；stderr 无 `FieldLabelMissing`（证明递归收集生效） | COPY |
| G-02 | §8 FieldLabelMissing 反例（指 title） | 临时根 R-BASE 的 `residual.fields` 改为 `["title"]` | 跑校验器 | exit 1；stderr 含 `FieldLabelMissing` 与 `title` | COPY |
| G-03 | §8 FieldLabelMissing 反例（指不存在字段） | `residual.fields` 改为 `["missingField"]` | 跑校验器 | exit 1；stderr 含 `FieldLabelMissing` 与 `missingField` | COPY |
| G-04 | §8 闸输出可定位 | 临时根同一判据同时制造 `ScopeMissing` 与 `LabelShape` | 跑校验器 | exit 1；stderr 至少两条，各自含判据文件名与对应 code；`ScopeMissing` 与 `LabelShape` 均出现 | COPY |

### 4.8 H 组：迁移与兼容（12 条）

| ID | 覆盖对象 | 前置 | 步骤 | 期望结果 | 形态 |
|---|---|---|---|---|---|
| H-01 | §10 / V-2b-2 旧 18 条不改 | 开工前记录 3 份 testcase 的 SHA256（no-git-write / import-guard / no-unverified-number） | 施工后重算哈希；跑 `build.mjs` | 3 份哈希与开工前逐份相等；输出逐条为 `no-git-write: 7 条样例已判`、`import-guard: 7 条`、`no-unverified-number: 4 条`；3 条规则无 RED；合计 18/18 | PROBE |
| H-02 | §10 anchor-forms 任一非空 pass | PILOT 内 `anchor-forms`：when `writesConclusion eq true`；assert[0] `anyOf[anchorPathLine, anchorCommandOutput, anchorReference]`；assert[1] `notContains values ["见上文","同上"]`。**结构以 PRD 定稿为准（OD-9）** | testcase `{writesConclusion:true, anchorPathLine:"", anchorCommandOutput:"npm run check → exit 0", anchorReference:"", anchorText:"有效"}` 期望 pass；跑 `check-criteria-engine.mjs --root PILOT` | 该判据 4 条样例全绿；exit 0 | COPY |
| H-03 | §10 anchor-forms 三锚全空 fail | 同 H-02，结构待 PRD 定稿 | testcase `{writesConclusion:true, anchorPathLine:"", anchorCommandOutput:"", anchorReference:"", anchorText:"有效"}` 期望 fail | 该判据 4 条全绿；exit 0 | COPY |
| H-04 | §10 anchor-forms 含禁词 fail | 同 H-02，结构待 PRD 定稿 | testcase `{writesConclusion:true, anchorPathLine:"docs/a.md:12", anchorCommandOutput:"", anchorReference:"", anchorText:"见上文"}` 期望 fail | 该判据 4 条全绿；exit 0 | COPY |
| H-05 | §10 anchor-forms 不触发 pass | 同 H-02，结构待 PRD 定稿 | testcase `{writesConclusion:false, anchorPathLine:"", anchorCommandOutput:"", anchorReference:"", anchorText:"见上文"}` 期望 pass | 该判据 4 条全绿；exit 0 | COPY |
| H-06 | §10 5 份 json 补槽 | 现仓 `tools/quality/criteria-engine/` 5 份判据 | 跑 `check-criteria-engine.mjs` | exit 0；无 `AssertLabelMissing`、`RuleWithoutProbe`（全部判据）、`FieldLabelMissing`；5 份均能渲染 | PROBE |
| H-06b | §10 evidence testcase 重写 | 施工后 `evidence-before-conclusion.json` 与 `.testcase.json` | 跑 `build.mjs`，确认输出同时含 `evidence-before-conclusion` 与 `13 条样例已判`；**按键名精确匹配**检索 testcase 的 key（不得用子串匹配） | 13/13 无 `CaseMismatch`；样例含「无有效锚」反例（`anchorPathLine` 为「我记得是这样」等不含 `:行号` 的形态，兼覆盖三锚全空）；testcase 的 key 中不出现旧字段名 `lookupReport`、`isCompoundDerivation`（任一精确命中即失败） | PROBE |
| H-07 | §10 结构闸 V-4 改件 | 临时根复制 engine + rules；手写一个未登记 `rules/r2b-struct.md`，含 `# 标题`、`> 触发：始终适用`、`义务（全部成立才合规；缺一件 = 不合格）：`、`（例外：只许 X）`，但无任何判定动作词 | 跑 `check-criteria-engine.mjs --root` | exit 1；stderr 含 `RuleStructureIncomplete` 且 missing 列表含 `判定动作`；missing 列表不含 `来源锚` | COPY |
| H-08 | §10 rule-audit-lite 去来源（反例） | 临时根复制 `scripts/rule-audit-lite.mjs` 与 `rules/`；`rules/` 只放一个文件，内容仅 `> 来源：ABCDEFGHIJ` | 在临时根跑副本 `scripts/rule-audit-lite.mjs` | exit 1；stdout 逐字含 `说明层 全仓 100.0%`（该行被当说明层，不再是结构行） | COPY |
| H-08b | §10 rule-audit-lite 去来源（正例） | 同 H-08 同一路径，改为仅含义务句 `- 必须执行检查`（删掉来源行） | 在临时根跑副本 `scripts/rule-audit-lite.mjs` | exit 0；stdout 逐字含 `说明层 全仓 0.0%`；末行 `rule-audit-lite ok` | COPY |
| H-09 | §10 README 追加裁定 | 现仓 `criteria-engine/README.md` | 检索三条裁定关键词：`逻辑关系显式建模`、`label 只命名`、`判定动作与记录落点分离` | 三串各命中 ≥1 次，且位于 §六 裁定表内 | PROBE |
| H-10 | §10.1 rule-writer 新分支 | 现仓 `skills/rule-writer/` | 查 `references/criteria-dsl.md` 是否存在；检索 SKILL.md 是否含该路径；检索该 reference 是否含 `字段表`、`条件语法`、`label`、`算子表`、`probe`、`渲染`、`校验闸`、`验收命令` | 文件存在；SKILL.md 含 `references/criteria-dsl.md`；八个主题词各命中 ≥1 次 | PROBE |

### 4.9 I 组：验收 V-2b-1 ~ V-2b-11（13 条）

| ID | 覆盖对象 | 前置 | 步骤 | 期望结果 | 形态 |
|---|---|---|---|---|---|
| I-01 | V-2b-1 | PRD 指定的 PILOT 根（3 旧 + anchor-forms） | 跑 `build.mjs` | exit 0；末行 `rule-dsl ok`；输出 `样例 22 条，错误 0 条`；样例数 18+4=22 | PROBE |
| I-01b | V-2b-1 现仓口径补充 | 现仓 `tools/quality/criteria-engine` 5 判据 | 跑 `build.mjs` | exit 0；末行 `rule-dsl ok`；样例数 34（anchor-forms 若落本目录则 38）；这是现仓独立口径，不与 I-01 的 22 混用 | PROBE |
| I-02 | V-2b-2 | 同 H-01 | 施工后核对 18 条 testcase 逐条未改；跑 PILOT `build.mjs` | 18/18 绿；3 份 testcase 哈希不变；exit 0 | PROBE |
| I-03 | V-2b-3 | 现仓 | 跑 `node scripts/check-criteria-engine.mjs` | exit 0；首行匹配 `判据 5 条 / 绿 34 / 红 0`（anchor-forms 落本目录时为 `判据 6 条 / 绿 38 / 红 0`）；末行 `criteria-engine ok` | PROBE |
| I-04 | V-2b-4 | 现仓 | 跑 `node scripts/check-all.mjs` | exit 0；含 `criteria-engine ok`、`rule-audit-lite ok`、`[observable] 扫描`、`check 全部通过`；无任何 `[criteria-engine]` 红行 | PROBE |
| I-05 | V-2b-5 | 临时根复制 engine + rules | 在 `rules/evidence-before-conclusion.md` 末尾追加 1 个字符 `X`；跑 `check-criteria-engine.mjs --root` | exit 1；stderr 含 `RuleProjectionDrift` 与 `rules/evidence-before-conclusion.md` | COPY |
| I-06 | V-2b-6 | 临时根 | 把 `evidence-before-conclusion` 的 assert[0].label 改为 `附上取数命令`；跑 `--root` | exit 1；stderr 含 `LabelShape` 与固定修法 `label 只许名词短语（≤12 字符、不含逻辑词/情态词/标点）；谓词由算子产出` | COPY |
| I-07 | V-2b-7 | 临时根 PILOT 内的 `anchor-forms` | 把 assert[0] 的 `anyOf` 改为三条平铺叶子（隐式 AND）；保留原 4 条 testcase；跑 `--root` | exit 1；stderr 含 `CaseMismatch`，case 为「任一非空 pass」那条，`expect: pass`、`got: fail` | COPY |
| I-08 | V-2b-8 | 临时根，`evidence-before-conclusion` 登记在 `rules.json` | 删除 `assert[0].probe`；跑 `--root` | exit 1；stderr 含 `RuleWithoutProbe` 与 `evidence-before-conclusion` | COPY |
| I-09 | V-2b-9 | 人工驱动 rule-writer，指定一个全新规则需求 | 对 rule-writer 说「写一条规则：<需求>」；收集本仓 `tools/quality/criteria-engine/` 产物 | 恰好 2 个文件：`<id>.json` 与 `<id>.testcase.json`；无 `<id>.md`、无散文正文；不进 use-rule-skills `.md` 草稿箱；对产物跑 `build.mjs` 与 `check-criteria-engine.mjs` 均 exit 0 | PROBE（人工触发） |
| I-10 | V-2b-10 | 本机已装 aas | 读 `~/.aas/installed.json` | 不存在 name/path 含 `rule-writer` 的条目，命中计数 = 0 | PROBE |
| I-11 | V-2b-11 / §14 scope 分发 | **BLOCKED（发布侧尚无 scope 过滤实现）**；激活后：临时构造 `global` 与 `project:lpm` 两条可渲染规则 | 执行 `aas sync`；观测 ① `~/.trae-cn/user_rules/<global-id>.md` 存在；② `~/.trae-cn/user_rules/<project-id>.md` 不存在；③ 目标仓 `rules/<project-id>.md` 存在；④ 命令 exit 0；测试后删除临时发布物 | 四项观测全部成立；任一不成立即失败 | PROBE（BLOCKED） |
| I-12 | §12 风险-2 收紧语义 | 临时根复制 no-unverified-number 的判据与 testcase | 把 assert[1] 的 `containsAny` 改为 `startsWithAny`，values 不变；保留旧 4 条 testcase，另加一条 `{hasStatistic:true, command:"echo x; rg foo"}` 期望 fail；跑 `--root` | 改后：exit 0，无 `CaseMismatch`，旧 4 条 + 新 1 条共 5/5 绿；若实现未收紧（仍是 containsAny），同一条会 `expect fail / got pass` → exit 1。收紧是否获用户签字另计，不属机判 | COPY |

### 4.10 J 组：出品边界（4 条）

| ID | 覆盖对象 | 前置 | 步骤 | 期望结果 | 形态 |
|---|---|---|---|---|---|
| J-01 | §14-1 判据数据不进用户目录 | 本机用户目录可读；已列出 5 条判据 id | 在 `~/.trae-cn/**` 检索文件名等于 `<id>.json`、`<id>.testcase.json`、`rules.json` 的文件（id 取 5 条判据）；排除 `installed.json` | 命中文件数 = 0 | PROBE |
| J-02 | §14-1 数据不进 aas 数据区 | 同上 | 在 `~/.aas/**` 按同一文件名清单检索；排除 `installed.json` | 命中文件数 = 0 | PROBE |
| J-03 | §14-2 rule-writer 不出品（三态合并） | 同一台机器实测 `~/.trae-cn/skills/rule-writer` | 查路径；存在时解析 junction/symlink 目标，按实际状态判 | ① 不存在 → pass；② 存在且目标 = 本仓 `skills/rule-writer`（活链）→ fail，报告注明「活链出品」；③ 存在但目标为副本 / 断链 / 他处 → fail，报告注明「形态异常」。只有①合规 | PROBE |
| J-04 | §14-3 他仓不建第二份判据数据 | 指定一个已发布 `project:<name>` 的目标仓 | 在目标仓检索 `tools/quality/criteria-engine/<id>.json` 与 `<id>.testcase.json` | 命中文件数 = 0；目标仓只有发布的 `rules/<id>.md`。无目标仓时本条不可执行，见 §5 | PROBE（条件性） |

### 4.11 K 组：体积与说明层（3 条）

| ID | 覆盖对象 | 前置 | 步骤 | 期望结果 | 形态 |
|---|---|---|---|---|---|
| K-01 | §13 387 不再为验收值 / V-17 | 现仓 `rules/evidence-before-conclusion.md` | 去掉空白后计字符数；再人为追加 500 个非空白字符到副本并跑 `--root` | 原文件非空白字符数在 100–500 之间；不以 387 作为通过条件；追加后 stderr 含 `RuleOverBudget` 与 `max: 500` | PROBE + COPY |
| K-02 | §10 / V-13 说明层闸仍生效 | 现仓 | 跑 `node scripts/rule-audit-lite.mjs` | exit 0；首行含 `说明层 全仓` 且括号内 `≤10%`、`单条 max` 且括号内 `≤20%`；末行 `rule-audit-lite ok` | PROBE |
| K-03 | §10 anchor-forms 预算 | PILOT 根（含 3 旧 + anchor-forms） | 跑副本 `build.mjs` 生成 `rules/anchor-forms.md`；去掉空白后计字符数 | 非空白字符数在 100–500 之间；`check-criteria-engine.mjs --root PILOT` exit 0，无 `RuleOverBudget` / `RuleUnderBudget` | COPY |

## 5. 不可测条目

以下条目不能写出「可观察判红」的用例；硬凑会得到假绿。按处置去向单列。

| # | 条目 | 为什么不可测 | 处置 |
|---|---|---|---|
| U-01 | D-18「label 是否真的是名词短语」 | 动名兼类词（验证 / 回读）无法机判；PRD §4 已承认 | 归 residual：`reviewer-audit` 抽 3 条核；不新增用例 |
| U-02 | residual 抽检是否真的执行 | 人在收口时的行为，不是快照可判数据 | 归流程 / residual，不进判据 |
| U-03 | 风险-4 `matches` 用途限定为「内容形态」 | 「内容形态」是语义判断，正则本身可写任意判定 | 归 residual / reviewer-audit 抽检；不改判据 |
| U-04 | D-22 的 skill 侧时序、执行、重试、回滚 | 属于 skill 骨架行为，跨轮次、不可单快照重放 | 归 skill 测试与 residual；本阶段判据只测「字段被白名单拒绝」 |
| U-05 | 数值算子遇到字符串、无效正则 | 值类型写「数字」「标量」，但没有类型闸与错误契约 | 改判据（类型前置校验）或改 PRD；现不硬凑用例 |
| U-06 | §14-3「别的仓要规则由本仓代写」 | 创作流程约束，不是产物字节可判 | 归人工流程 / residual 审计；仅 J-04 做产物残留检查 |
| U-07 | V-2b-9 的「AI 不写散文」意图 | 只能测产物形状；模型是否想写散文不可观察 | 产物形状归 I-09；意图归 SKILL 行为抽检 / residual |
| U-08 | 风险-2「收紧需用户单独签」 | 签字是流程动作，不是判据 | 归签字流程；I-12 只测语义是否真的收紧 |

> 原六项（name 缺失 / unless.label / probe 合法性 / 深度口径 / scope 字符集 / when 回退）经 R1 裁定后已可测，移出本节：`name` 选填回退 → C-10；`unless.label` 必填 → C-13；`ProbeSchema` → E-13；深度口径 → B-15/B-16；scope 字符集 → A-07/A-08；when 回退 → F-04。

## 6. 正反例缺口与 R1 裁定

### 6.1 双向性缺口

| 用例 / 条目 | 缺哪向 | 原因 | 处置 |
|---|---|---|---|
| H-09 README 追加裁定 | 缺反例 | 文档条目存在性无违规形态，且无对应闸 | 属文档一致性；若要机判需新增判据，否则留 reviewer-audit |
| H-10 criteria-dsl 指针 | 缺反例 | 同上，指针缺失没有门禁 | 属文档一致性；建议阶段 3 再上闸 |
| J-04 他仓第二份数据 | 缺反例（条件性） | 需要真实目标仓；无仓时无法构造 | 有目标仓时执行；无仓时登记为环境缺口 |

> F 组渲染用例的正反两向由同一断言覆盖：要求「必须出现」的是正例断言，要求「不得出现」的是反例断言；任一方向不符即该用例失败，故不另列「缺反例」。

### 6.2 R1 已对齐裁定（原 OD 清单）

| OD | R1 裁定 | 本文落点 |
|---|---|---|
| **OD-1** | PRD 未给算子数量；§5.2 表实列 14 个、总 18 个；建议 PRD 补一句「新增 14 个，总 18 个」，不算缺陷 | D-16 ~ D-43 按 14 个设计 |
| **OD-2** | 验收根拆开：V-2b-1 = PILOT 根 22 条；现仓根 34 条，anchor-forms 落入后 38 条；两套不混 | I-01、I-01b、I-03 |
| **OD-3** | `LogicWordInLabel` 先报，`LabelShape` 报其余；修法固定为「label 只许名词短语（≤12 字符、不含逻辑词/情态词/标点）；谓词由算子产出」 | C-02 ~ C-09、I-06 |
| **OD-4** | probe 与谓词拼接固定为 `{probe 渲染}；{谓词}`（分号）；逐字样例：`1. 可观察检查：运行 `node scripts/check-observable.mjs --check`，取退出码；必须等于 0` | E-01、E-02、F-08、F-16（待 PRD 正文同步后激活） |
| **OD-5** | `RuleWithoutProbe` 改为全部判据都要求顶层 probe，不再只限 `rules.json` 登记项 | E-10 期望翻转为红、H-06 |
| **OD-6** | 深度只数组合节点层数，顶层组合 = 1，叶子不计 | B-15、B-16 |
| **OD-7** | `scope` 的 name 字符集 `^[a-z0-9][a-z0-9-]*$`；`project:` 空名、大写、含下划线均 `ScopeInvalid` | A-07、A-08、A-09 |
| **OD-8** | `includesAny` 谓词改为「必须包含以下任一项：A / B」 | D-42、D-43 |
| **OD-9** | `anchor-forms` 的 json 由 PRD 补进；PRD 落定前 H-02 ~ H-05 标注「结构以 PRD 定稿为准」 | H-02 ~ H-05、I-07 |
| **OD-10** | `when` 无 label 回退样例固定为 `> 触发：flag 等于 true` | F-04 |
| **OD-11** | `DeepExpressionUnlabeled` 判定对象 = 组合节点自身，顶层组合也必须有 label | B-23 |
| **OD-12** | rule-writer 2b 交付落点 = 本仓 `tools/quality/criteria-engine/<id>.json` + `<id>.testcase.json`；不进 `.md` 草稿箱 | I-09 |
| **OD-13** | 叶子同时有 `label` 与 `name`：顶层义务用 `label`，组合子项用 `name`；两者并存不报错 | C-15 |

## 7. 执行与判定口径

1. **先跑基线**：`node tools/quality/criteria-engine/build.mjs`、`node scripts/check-criteria-engine.mjs`、`node scripts/check-all.mjs` 各一次，记录 exit 与首末行；基线不绿则阶段 2b 用例整体阻塞。
2. **COPY 组统一在系统临时根执行**：复制 `<repo>/tools/quality/criteria-engine` 到 `<tmp>/tools/quality/criteria-engine`、复制 `<repo>/rules` 到 `<tmp>/rules`；坏数据只写副本，结束后删除临时根。
3. **判红优先级**：目标 code 出现即该用例通过；若同时出现 `ProjectionDrift`、`ProjectionMissing` 等派生红，不作为该用例失败，但必须在报告里列出，避免「用漂移红冒充校验红」。
4. **计数类断言写死数**：I-03 的 `绿 34` 以现仓 34 条 testcase 为基线；A-01 的夹具判据另加 3 条，故为 `判据 6 条 / 绿 37`；任何新增 testcase 都必须同步改期望值，不允许写「约」。
5. **V-2b-11 发布测试必须清理**：临时发布到 `user_rules` 的文件在用例结束后删除，避免污染下一轮基线；清理动作本身也作为用例通过条件之一。

## 8. 用例总数与缺口摘要

- 用例总数：**170 条**（A 15 + B 31 + C 15 + D 43 + E 13 + F 17 + G 4 + H 12 + I 13 + J 4 + K 3 = 170）。R2 与 R1 持平：J-03a/b 并为 J-03（-1）、新增 H-06b（+1）。
- 覆盖矩阵缺口：R1 已对齐 OD-1 ~ OD-13；仍挂起的是 F-16（OD-4 正文同步后激活）与 I-11（发布侧 scope 过滤未实现，BLOCKED）。
- 不可测条目：8 条，已按 residual / 改判据 / 改 PRD 分置，见 §5。
