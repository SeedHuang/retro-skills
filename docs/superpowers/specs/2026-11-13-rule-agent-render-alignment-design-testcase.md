# rule / agent 文档体系拉齐 testcase（独立推导）

- 对象 PRD：`docs/prd/20261113160000-rule-agent-render-alignment.md`（v0.5.1，2026-11-13）
- 编写者声明：本文件由独立 senior-sdet 实例编写；用例仅从 PRD v0.5.1、仓库现状代码与既有测试独立推导，**未读**设计稿 `docs/superpowers/specs/2026-11-13-rule-agent-render-alignment-design.md`；PRD 未定处一律标「按 spec 定义」并登记到 §3，不编造子命令与错误码。
- 覆盖口径：逐条覆盖 F1（§6.2 五项）、F2（§6.3 四条）、F3（§6.4 五行）、F4 与 Q4 派生（§6.4 末行）、M0a/M0b（§6.1）、F6（§6.5 四行）、D19（§9.2 与 §4 文档联动）、非目标（§3 七条）；F5 只验「首期不做」。
- 适用范围：`tools/docgen/render/`、`tools/docgen/builders/rules/**`、`tools/docgen/builders/agents/cli.mjs` 与 `components/baseline.mjs`、`scripts/check-observable.test.mjs`、`tools/docgen/models/rules/`（5 模型 + rules.json）、M0a 基线报告、`scs check rules` 复评链。
- 回答目标：给出可与 spec 逐条对账的独立验收基线（每条期望落成退出码 / 字段 / 字节 / 行号），并列出 PRD 内部口径冲突供 spec 定夺。
- 取证锚：[PRD:39-44](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L39-L44)、[PRD:81-93](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L81-L93)、[PRD:95-100](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L95-L100)、[PRD:102-106](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L102-L106)、[PRD:108-119](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L108-L119)、[PRD:121-126](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L121-L126)、[PRD:170-173](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L170-L173)、[interpreters.mjs:9-16](file:///d:/Seed/retro-skills/tools/docgen/builders/rules/interpreters.mjs#L9-L16)、[schema.mjs:288-343](file:///d:/Seed/retro-skills/tools/docgen/builders/rules/schema.mjs#L288-L343)、[schema.mjs:345-352](file:///d:/Seed/retro-skills/tools/docgen/builders/rules/schema.mjs#L345-L352)、[build.mjs:12](file:///d:/Seed/retro-skills/tools/docgen/builders/rules/build.mjs#L12)、[build.mjs:31](file:///d:/Seed/retro-skills/tools/docgen/builders/rules/build.mjs#L31)、[cli.mjs:96-114](file:///d:/Seed/retro-skills/tools/docgen/builders/agents/cli.mjs#L96-L114)、[cli.mjs:130-172](file:///d:/Seed/retro-skills/tools/docgen/builders/agents/cli.mjs#L130-L172)、[baseline.mjs:10](file:///d:/Seed/retro-skills/tools/docgen/builders/agents/components/baseline.mjs#L10)、[check-observable.test.mjs:569-576](file:///d:/Seed/retro-skills/scripts/check-observable.test.mjs#L569-L576)、[check-all.mjs:85-90](file:///d:/Seed/retro-skills/scripts/check-all.mjs#L85-L90)、[check-all.mjs:549-566](file:///d:/Seed/retro-skills/scripts/check-all.mjs#L549-L566)、[rules.json:1-3](file:///d:/Seed/retro-skills/tools/docgen/models/rules/rules.json#L1-L3)、[renderedAssets.mjs:5-18](file:///d:/Seed/retro-skills/tools/docgen/builders/agents/components/renderedAssets.mjs#L5-L18)、[docgen-index.md:44](file:///d:/Seed/retro-skills/docs/prd/docgen-index.md#L44)
- 术语：逐字节不变=渲染结果与冻结文件 sha256 相等且 diff 集合为空；漂移=渲染结果与磁盘基准不等；投影=由 rule json 渲染出的 md 副本（不是数据源）；registered model=`rules.json.rules` 内的 rule id；dormant=有 model 但不在 `rules.json` 的 rule；派生=值由 `rules.json` 计算得出而非手写字面量；只读冻结=只新建报告、不改任何被跟踪件；复评=同命令同版本同 annotations 重跑打分；白名单未跟踪件=M0a 允许出现的未跟踪文件（本 PRD / handoff / `docs/reports/` 基线报告）。
- 计数口径：TC 共 59 条（矩阵 59 行 + 明细 59 行）；类型分布 正 21 / 负 25 / 边界 9 / 观测 4；数出方式 `rg -c '^\| TC-' <本文件>` 期望 118（本席不跑命令，供复核席复算）。

## 1 覆盖矩阵

| TC 编号 | 覆盖（F<n> / §6.x-n） | 类型 |
|---|---|---|
| TC-01 | F1 / §6.2-逐字节 | 正 |
| TC-02 | F1 / §6.6 | 正 |
| TC-03 | F1 / §6.2-被消费 | 正 |
| TC-04 | F1 / §6.2-被消费（renderDoc 0 命中） | 边界 |
| TC-05 | F1 / §6.2-删引擎即红 | 负 |
| TC-06 | F1 / §6.2-被消费（两侧 import） | 正 |
| TC-07 | F1 / §4-共享层只做块渲染 | 边界 |
| TC-08 | F1 / §9.1-2（table/转义不进首期） | 边界 |
| TC-09 | F4 / §6.2-dormant 不另立 golden | 观测 |
| TC-10 | F2 / §6.3-正例全过 | 正 |
| TC-11 | F2 / §6.3-缺 landing | 负 |
| TC-12 | F2 / §6.3-非法 op | 负 |
| TC-13 | F2 / §6.3-type 越界 | 负 |
| TC-14 | F2 / §6.3-无 testcase | 负 |
| TC-15 | F2 / §6.3-validate 入口 | 正 |
| TC-16 | F2 / §6.3-validate 等价 | 正 |
| TC-17 | F2 / §6.3-必填字段 | 负 |
| TC-18 | F2 / §6.3-18 算子白名单 | 边界 |
| TC-19 | F2 / §6.3-组合结构 | 负 |
| TC-20 | F2 / §6.3-testcase 正反例 | 负 |
| TC-21 | F2 / §6.3-临时目录不写仓 | 边界 |
| TC-22 | F3 / §6.4-registered 无漂移 | 正 |
| TC-23 | F3 / §6.4-registered 漂移 | 负 |
| TC-24 | F3 / §6.4-非 registered 无漂移 | 正 |
| TC-25 | F3 / §6.4-非 registered 漂移 | 负 |
| TC-26 | F3 / §6.4-非 registered 缺件 | 负 |
| TC-27 | F3 / §6.4-preview 落点 | 正 |
| TC-28 | F3 / §6.4-preview 负例 | 边界 |
| TC-29 | F3 / §6.4-gate 全绿 | 正 |
| TC-30 | F3 / §6.4-未登记手写扫描 | 负 |
| TC-31 | F3 / §6.4-gate 手改 registered | 负 |
| TC-32 | F3 / §6.4-gate 与 check 分工 | 边界 |
| TC-33 | F3 / §6.4-criteria-engine 覆盖面 | 正 |
| TC-34 | F3 / §6.4-gate 覆盖面计数 | 观测 |
| TC-35 | F4 / Q4-派生等式 | 正 |
| TC-36 | F4 / Q4-非空与条数 | 正 |
| TC-37 | F4 / Q4-check-observable:575 | 正 |
| TC-38 | F4 / Q4-新增注册零改码 | 边界 |
| TC-39 | F4 / Q4-空清单 | 负 |
| TC-40 | F4 / §6.1-M0a 字段 | 正 |
| TC-41 | F4 / §6.1-annotations 缺失即失败 | 负 |
| TC-42 | F4 / §6.1-跟踪件洁净 | 负 |
| TC-43 | F4 / §6.1-只读冻结 | 观测 |
| TC-44 | F4 / §6.2-5 份 sha256 | 正 |
| TC-45 | F4 / §6.1-M0b 授权前置 | 边界 |
| TC-46 | F6 / §6.5-57% 基线 | 正 |
| TC-47 | F6 / §6.5-复评不降 | 正 |
| TC-48 | F6 / §6.5-降 ≥1 分中止 | 负 |
| TC-49 | F6 / §6.5-新增红点中止 | 负 |
| TC-50 | F6 / §6.5-回滚三步 | 观测 |
| TC-51 | D19 / §9.2-M0a 无需授权 | 正 |
| TC-52 | D19 / §9.2-M0b/M1 需授权 | 负 |
| TC-53 | D19 / §4-文档联动 | 正 |
| TC-54 | 非目标 / §3-F5 首期不做 | 负 |
| TC-55 | 非目标 / §3-不改评分口径 | 负 |
| TC-56 | 非目标 / §3-不激活 dormant | 负 |
| TC-57 | 非目标 / §3-不新增 rules 投影 | 负 |
| TC-58 | 非目标 / §3-不做四维 | 负 |
| TC-59 | 非目标 / §3-不改文案 | 负 |

## 2 用例明细

| TC | 前置与夹具 | 步骤（命令原文或动作） | 期望输出（可判） | 覆盖 |
|---|---|---|---|---|
| TC-01 | 改造后工作区；5 份 `tools/docgen/models/rules/{evidence-before-conclusion,observable-criteria,import-guard,no-git-write,no-unverified-number}.json` | `node --input-type=module -e "import {readFileSync} from 'node:fs'; import {renderRule} from './tools/docgen/builders/rules/rules.mjs'; for (const id of ['evidence-before-conclusion','observable-criteria','import-guard','no-git-write','no-unverified-number']) { if (renderRule(id)!==readFileSync('tools/docgen/builders/rules/'+id+'.md','utf8')) console.log('DIFF '+id) }"` | 退出码 0；stdout 为空（DIFF 行数 = 0）；5 份文件逐字节相等 | F1 / §6.2 |
| TC-02 | 同上；M0a 已记 18 席 sha256 | `node tools/docgen/builders/agents/cli.mjs generate --kind agent --check` | 退出码 0；stdout 含 `baseline N/N`，N = 18 + `BASELINE_RULES.length`（当前 19）；18 份 `agents/*.md` sha256 与 M0a 记录逐席相等（差异 0 席） | F1 / §6.6 |
| TC-03 | 新引擎已落地 `tools/docgen/render/render.test.mjs` | `node --test tools/docgen/render/render.test.mjs` | 退出码 0；TAP 汇总 `# fail 0`、`# pass >= 5`；该文件顶部 import 路径指向 `./index.mjs`（或 `../render/index.mjs`），不经 `builders/rules/interpreters.mjs` | F1 / §6.2 |
| TC-04 | 改造后全仓 | `rg -n "renderDoc" tools/docgen --glob "*.mjs" --glob "!*.test.mjs"` | 命中行数 = 0；rg 退出码 1（无匹配）。`docs/**` 历史归档不计入；测试文件不计入 | F1 / §6.2 |
| TC-05 | 冷仓副本（`coldRepo` 同款：整仓复制到 tmp）；副本内 `tools/docgen/render/index.mjs` 为新建件 | 副本内 `rm tools/docgen/render/index.mjs` → `node scripts/check-all.mjs` → 复原文件 → 再跑一次 | 删后退出码非 0，输出含 `ERR_MODULE_NOT_FOUND` 或 `Cannot find module` 且点名 `render`；复原后退出码 0、末行 `check 全部通过` | F1 / §6.2 |
| TC-06 | 改造后 | `rg -n "render/index.mjs" tools/docgen/models/agents/render/index.mjs tools/docgen/builders/rules/interpreters.mjs` | 两文件各 ≥1 命中（输出行中同时出现这两个文件路径）；命中总数 ≥ 2；退出码 0 | F1 / §6.2 |
| TC-07 | 新引擎目录 `tools/docgen/render/*.mjs` | `rg -c "writeFileSync\|mkdirSync\|rmSync\|appendFileSync" tools/docgen/render` | 输出为空（0 命中），rg 退出码 1；引擎为纯函数、无 I/O | F1 / §4 |
| TC-08 | 夹具 `tmp/fixtures/render/pipe.json`：`title` 与 `landing` 含 `\|` 字符的最小 rule | 用新引擎渲染该 rule，与 `git show <M0a SHA>:tools/docgen/builders/rules/<同形旧投影>` 口径对比（或与旧 `renderDoc` 输出对比） | 两者逐字节相等；输出中 `\|` 原样保留（未转义为 `\\\|`）；`rg -c "table\|escape" tools/docgen/render` = 0 命中 | F1 / §9.1-2 |
| TC-09 | 改造后；`docs/reports/` 下仅 M0a 基线报告目录 | `ls docs/reports` 并检查新增 golden 文件数；对 4 条 dormant 跑 `npm run check` 的 criteria-engine 段 | 新增 golden 文件数 = 0（4 条 dormant 无独立 golden 目录/文件）；criteria-engine 首行为 `判据 5 条 / 绿 34 / 红 0`（5 份全比对，不因 dormant 缺 golden 而少条） | F4 / §6.2 |
| TC-10 | 5 份 `<id>.json` + 5 份 `<id>.testcase.json` 齐备 | `node tools/docgen/builders/rules/build.mjs` | 退出码 0；末行 `rule-dsl ok`；`样例 N 条` 中 N = 5 份 testcase 的 `cases` 总数（读 5 份 json 求和后相等）；`错误 0 条` | F2 / §6.3 |
| TC-11 | 夹具 `tmp/fixtures/rule-schema/missing-landing.json`：删 `landing` 字段 | `node --input-type=module -e "import {check} from './tools/docgen/builders/rules/schema.mjs'; const out=[]; check(JSON.parse(process.argv[1]),'f.json',out); console.log(out.length, JSON.stringify(out))" "$(cat tmp/fixtures/rule-schema/missing-landing.json)"` | `out.length === 1`；`out[0].code === 'Schema'`；`out[0].message` 含 `缺字段 landing` | F2 / §6.3 |
| TC-12 | 夹具 `tmp/fixtures/rule-schema/bad-op.json`：`assert[0].op = "equals"` | 同 TC-11 命令换夹具 | `out.length === 1`；`out[0].code === 'Schema'`；`out[0].message.includes('op 未注册')` 为 true | F2 / §6.3 |
| TC-13 | 夹具 `tmp/fixtures/rule-schema/bad-type.json`：`type = "持续"` | 同 TC-11 命令换夹具 | `out.length === 1`；`out[0].code === 'TypeInvalid'`；message 含 `只许 持续适用 / 条件触发 / 模式门控` | F2 / §6.3 |
| TC-14 | 临时数据目录 `tmp/fixtures/rule-data/no-testcase/`：仅放 1 份合法 `<id>.json`，无 `.testcase.json` | `node tools/docgen/builders/rules/build.mjs --data-dir tmp/fixtures/rule-data/no-testcase` | 退出码 1；stdout 含 `判据无 testcase（<id>.testcase.json）→ 未验证，不得渲染`；该 id 未在 `builders/rules/` 新增/改写 md（前后 sha256 不变） | F2 / §6.3 |
| TC-15 | 改造后 `build.mjs` | 不传 `--data-dir` 且不设 env，跑 `node tools/docgen/builders/rules/build.mjs`；再 `rg -n "DATA_DIR" tools/docgen/builders/rules/build.mjs` | 第一次退出码 0；第二次输出含 `DATA_DIR` 行且默认值为 `path.join(DIR,'..','..','models','rules')`（即不传参时仍指向仓内数据目录） | F2 / §6.3 |
| TC-16 | 5 份合法 model | `node --input-type=module -e "import {validate} from './tools/docgen/builders/rules/schema.mjs'; ..."` 对 5 份逐份跑 `validate(rule,{testcase,ruleIds:new Set([rule.id])})`；再对 1 份跑 `validate(rule)` | 5 份带 testcase 均返回 `[]`；`validate(rule)` 返回 1 条 `MissingTestcase`；返回数组（不抛）；带 testcase 时 findings 与 `check()` 深度相等 | F2 / §6.3 |
| TC-17 | 夹具 a=`assert: []`；b=`residual:{who:'',sample:1,objectivePath:'x'}` | 同 TC-11 命令各跑一次 | a) `out.length === 1`、code `Schema`、message 含 `assert 必须是非空数组`；b) `out.length === 1`、code `ResidualWhoMissing` | F2 / §6.3 |
| TC-18 | 18 份最小 rule，各用 1 个 `OPS` 键（`eq`…`notForbiddenCommand`）作 `assert[0].op`，配齐该 op 必填参数 | 逐份跑 `validate(rule,{testcase,ruleIds:new Set([rule.id])})`；另造第 19 份 `op: "exists"` | 18 份均 `findings.length === 0`；第 19 份 `findings.length === 1` 且 message 含 `op 未注册` | F2 / §6.3 |
| TC-19 | 夹具 a=`when:{anyOf:[{...}]}`（1 项）；b=`when:{anyOf:[...],allOf:[...]}`（同节点两逻辑键） | 同 TC-11 命令各跑一次 | a) findings 含 code `LogicArity`、message 含 `至少 2 项`；b) findings 含 code `LogicConflict`、message 含 `同一节点出现多个逻辑键`；两例 `out.length === 1` | F2 / §6.3 |
| TC-20 | 夹具 a=`cases` 全为 `expect:'fail'`；b=`cases` 全为 `expect:'pass'` | `node --input-type=module -e "import {checkTestcase} from './tools/docgen/builders/rules/schema.mjs'; const e=[]; checkTestcase(tc,'f.json',new Set([tc.rule]),e); console.log(e)"` | a) `e` 含 `缺正例（防误拦无验证）`；b) `e` 含 `缺反例（防漏判无验证）`；两例 `e.length === 1` | F2 / §6.3 |
| TC-21 | 临时数据目录 `tmp/fixtures/rule-data/full/`（1 model + 1 testcase 全合法）；仓内 `builders/rules/*.md` 先记 5 份 sha256 | 跑 `node tools/docgen/builders/rules/build.mjs --data-dir tmp/fixtures/rule-data/full --out-dir tmp/fixtures/rule-data/full/out --rules-dir tmp/fixtures/rule-data/full/rules`，再重算 5 份 sha256 | 命令退出码 0；仓内 `builders/rules/` 5 份 sha256 全部不变；输出只落临时 `out/` 与 `rules/` | F2 / §6.3 |
| TC-22 | `rules/evidence-before-conclusion.md` 与渲染源同步 | `node tools/docgen/builders/agents/cli.mjs generate --kind rule --name evidence-before-conclusion --check` | 退出码 0；stdout 含 `baseline N/N`，N = 18 + `BASELINE_RULES.length`（当前 19） | F3 / §6.4 |
| TC-23 | 冷仓副本；向 `rules/evidence-before-conclusion.md` 追加一行 `手改一行` | 同 TC-22 命令（副本内） | 退出码 1；stdout 含 `Mismatch` 且点名 `rules/evidence-before-conclusion.md` | F3 / §6.4 |
| TC-24 | dormant `import-guard`：`builders/rules/import-guard.md` 与 model 同步、`rules/import-guard.md` 不存在 | `node tools/docgen/builders/agents/cli.mjs generate --kind rule --name import-guard --check` | 退出码 0；stdout 无 `Mismatch`、无 `DanglingBaselineEntry`。改造后应满足；现状不满足属 M3 实现项（`cli.mjs:101` 先查 `rules/<id>.md`） | F3 / §6.4 |
| TC-25 | 冷仓副本；向 `builders/rules/import-guard.md` 追加一行 | 同 TC-24 命令（副本内） | 退出码 1；stdout 含 `Mismatch` 且点名 `builders/rules/import-guard.md`（路径前缀按 spec 定义，见 §3-D1） | F3 / §6.4 |
| TC-26 | 冷仓副本；`rm builders/rules/import-guard.md` | 同 TC-24 命令（副本内） | 退出码 2；stdout 含 `DanglingBaselineEntry` 且点名 `builders/rules/import-guard.md` | F3 / §6.4 |
| TC-27 | 删除 `tmp/preview/`；记录 `rules/*.md` 与 `builders/rules/*.md` 共 6 份 sha256 | `node tools/docgen/builders/agents/cli.mjs generate --kind rule --name evidence-before-conclusion --preview` | 退出码 0；新增文件仅 `tmp/preview/rules/evidence-before-conclusion.md`（`ls tmp/preview` 无 `agents/`）；6 份 sha256 全不变 | F3 / §6.4 |
| TC-28 | `tmp/preview/` 已清空 | 分别跑 `--name no-such-rule --preview` 与 `--name import-guard --preview`（dormant） | 两次退出码均非 0（`MissingComponentData` → 2）；`tmp/preview/rules/no-such-rule.md` 与 `tmp/preview/rules/import-guard.md` 均不存在；`ls tmp/preview` 不新增任何文件 | F3 / §6.4 |
| TC-29 | 改造后工作区洁净 | `node tools/docgen/builders/agents/cli.mjs gate` | 退出码 0；stdout 含 `baseline N/N`，N = 18 + `BASELINE_RULES.length`（当前 19）；无 `Mismatch` / `DanglingBaselineEntry` / `UnregisteredHandwritten` | F3 / §6.4 |
| TC-30 | 冷仓副本；新建 `rules/import-guard.md`（未注册手写件），内容任意 | 副本内跑 `gate` | 退出码 2；stdout 含 `UnregisteredHandwritten: rules/import-guard.md` | F3 / §6.4 |
| TC-31 | 冷仓副本；向 `rules/evidence-before-conclusion.md` 追加一行 | 副本内跑 `gate` | 退出码 1；stdout 含 `Mismatch: rules/evidence-before-conclusion.md` | F3 / §6.4 |
| TC-32 | 冷仓副本；只改 `builders/rules/no-git-write.md`（dormant 投影）1 字节 | 副本内先跑 `gate`，再跑 `node scripts/check-all.mjs` | `gate` 退出码 0（不扫 builders/）；`npm run check` 退出码非 0（criteria-engine 段判红）→ 证明两层分工无遗漏 | F3 / §6.4 |
| TC-33 | 改造后 | `npm run check` 并取 ⑨ 段前两行 | 首行匹配 `^判据 \d+ 条 / 绿 \d+ / 红 \d+$` 且为 `判据 5 条 / 绿 34 / 红 0`；末行 `criteria-engine ok`；整体退出码 0 | F3 / §6.4 |
| TC-34 | 改造后，`rules.json` 只有 1 个 id | `gate` 与 `npm run check` 各跑一次，比对两者覆盖计数 | `gate` 输出 `baseline N/N`（N = 18 + `BASELINE_RULES.length`，当前 19；= 18 席 + 1 registered）；`npm run check` 输出 `判据 5 条`（= 5 份投影）；两数不互相替代（N ≠ 5，当前 19 ≠ 5） | F3 / §6.4 |
| TC-35 | 改造后 `baseline.mjs` | `node --input-type=module -e "import {BASELINE_RULES} from './tools/docgen/builders/agents/components/baseline.mjs'; import {readFileSync} from 'node:fs'; const ids=JSON.parse(readFileSync('tools/docgen/models/rules/rules.json','utf8').replace(/^\uFEFF/,'')).rules; console.log(JSON.stringify(BASELINE_RULES)===JSON.stringify(ids.map(i=>'rules/'+i+'.md')))"` | 输出 `true`；退出码 0 | F4 / Q4 |
| TC-36 | 同 TC-35 | 同命令追加打印 `BASELINE_RULES.length`、`ids.length` | 两数相等且 `>= 1`；当前值均为 1 | F4 / Q4 |
| TC-37 | 改造后 `scripts/check-observable.test.mjs` | `rg -n "BASELINE_RULES" scripts/check-observable.test.mjs`；再 `node --test scripts/check-observable.test.mjs` | 该文件不再出现正则 `export const BASELINE_RULES = \[`（0 命中该字面量模式）；`node --test` 中 `OCR-S1-TC-F09` 用例 `ok`，`# fail 0` | F4 / Q4 |
| TC-38 | 冷仓副本；`rules.json` 改为 `{"rules":["evidence-before-conclusion","no-git-write"]}`，并为 `no-git-write` 建 `rules/no-git-write.md`（渲染产物） | 副本内跑 TC-35 的 -e 断言，并 `git diff --stat -- tools/docgen/builders/agents/components/baseline.mjs` | 断言输出 `true`；`BASELINE_RULES.length === 2`；`baseline.mjs` 的 git diff 行数 = 0（零改码） | F4 / Q4 |
| TC-39 | 冷仓副本；`rules.json` 改为 `{"rules":[]}` | 副本内跑 `node --test scripts/check-observable.test.mjs`（或派生断言所在测试） | `BASELINE_RULES.length === 0`；派生断言（非空 + 条数相等）失败，`# fail >= 1`，失败信息含 `非空` 或 `rules.json` | F4 / Q4 |
| TC-40 | 改造前 M0a 阶段；`tools/quality/.inspector-annotations.json` 存在 | `scs check rules --root . --terms tools/docgen/models/rules/vocab/observable-terms.json --annotations tools/quality/.inspector-annotations.json` 并写 `docs/reports/2026-11-13-rule-baseline/baseline.json` | 退出码 0；`baseline.json` 为数组且 `length === 1`；每条 key 集合恰为 `{ruleId,score,max,rate,level,reds,exitCode,scsVersion,nodeVersion,annotationsSha256}`（10 键，多一少一即失败）；`ruleId === 'evidence-before-conclusion'` | F4 / §6.1 |
| TC-41 | 冷仓副本；删除 `tools/quality/.inspector-annotations.json`；清空 `docs/reports/` 同名目录 | 副本内跑 TC-40 命令 | 退出码非 0；`docs/reports/2026-11-13-rule-baseline/baseline.json` 不存在；stderr/stdout 不含「替代命令」字样 | F4 / §6.1 |
| TC-42 | 冷仓副本；改任一被跟踪件（如 `README.md` 追加空行） | 先 `git status --porcelain`；再按 §6.1 执行 M0a 冻结判定 | `git status --porcelain` 含 `M README.md`；M0a 冻结判定为「不通过」（被跟踪件不洁净），拒绝产出 baseline.json | F4 / §6.1 |
| TC-43 | M0a 执行前后 | 先清空/记录 `DOCGEN_RULES_DIR`、`DOCGEN_AGENTS_DIR`、`DOCGEN_BASELINE_PATH`、`DOCGEN_TMP_ROOT`；执行前 `git rev-parse HEAD`；M0a 全程后重跑同命令；对 `rules/*.md` 与 `builders/rules/*.md` 共 6 份 `Get-FileHash -Algorithm SHA256` 前后各记一次 | 四个 env 值已记录；两次 HEAD 字符串相同；6 份 sha256 前后全等；`git status --porcelain` 只多出白名单未跟踪件（本 PRD / handoff / `docs/reports/` 报告 / spec+testcase / gate-record）；命令执行者为只读操作 | F4 / §6.1 |
| TC-44 | M0a 已存 5 份 `builders/rules/*.md` sha256 | 改造后重算 5 份 sha256，与 M0a 记录逐份比对 | 5/5 相等；差异集合为空 | F4 / §6.2 |
| TC-45 | 未获用户 D19 重启授权 | 检查是否存在 M0b 执行记录（`rules/*.md` mtime 变化、或 `docs/devworkflows/**/gate-record.md` 含 M0b 条目） | 无 M0b 执行记录时判「未越权」；若存在执行记录但无授权原文 → M0b 无效（红），且执行前后 sha256 记录必须齐备（缺一即无效） | F4 / §6.1 |
| TC-46 | 改造前基线冻结完成 | `scs check rules --root . --terms tools/docgen/models/rules/vocab/observable-terms.json --annotations tools/quality/.inspector-annotations.json` | 退出码 0；输出含 `共 1 文件 / 13 行 / 205 字符，平均得分率 57%（不及格）`；per-rule 分数 `13/23` | F6 / §6.5 |
| TC-47 | 改造后；`scs --version`、`node -v`、annotations sha256 与 M0a 记录全等 | 重跑 TC-46 同一条命令（不增不减参数） | 退出码 0；`score >= 13`、`max === 23`；`reds` 为基线 `reds` 的子集（基线为空时新 reds 也为空）；三版本字段逐一等于 M0a 记录 | F6 / §6.5 |
| TC-48 | 构造「降分」分支：改造分支上任一 active rule `score` 比基线少 1 | 按 §6.5 判定并记录 | 判定为「立即中止」；不进入 M4；产出中止记录（含 `ruleId`、基线分、新分、差值 = 1）；回滚动作交用户执行 | F6 / §6.5 |
| TC-49 | 构造「新增红点」分支：基线 `reds` 为空，新报告 `reds` 非空 | 按 §6.5 判定并记录 | 判定为「立即中止」；记录新增红点的条目原文与条数（≥1）；不得只修 core 后继续 | F6 / §6.5 |
| TC-50 | 已判定中止 | 核对回滚三步命令原文与执行者 | ① `git restore --source=<M0a SHA> --staged --worktree -- rules/ tools/docgen/`；② `git clean -fd -- tools/docgen/render tools/docgen/builders/rules/schema.test.mjs`；③ `git status --porcelain` 只剩白名单未跟踪件；三条命令均由用户执行（记录执行者 ≠ agent），并用 baseline.json 复核 | F6 / §6.5 |
| TC-51 | 仓库根；无 D19 重启记录 | 直接执行 M0a（TC-40/43） | 允许执行且判定通过；不要求授权原文；产出物只有 `docs/reports/<日期>-rule-baseline/` 下新建件 | D19 / §9.2 |
| TC-52 | 无用户 D19 重启记录 | 尝试进入 M0b（跑 `node tools/docgen/builders/rules/build.mjs` 的写盘形态）或 M1（新建 `tools/docgen/render/`） | 判定为「未授权，不得进入」；实际不发生 `rules/*.md` 写入（sha256 不变）、不发生 `tools/docgen/render/` 新建；若已发生则记为越权并按 §6.5-① 回滚 | D19 / §9.2 |
| TC-53 | 用户已给出重启授权 | 读 `docs/prd/docgen-index.md` 第 44 行及其 P3 / P4 状态处 | 第 44 行 D19 状态已更新（不再写「暂停」且含重启日期或「已重启」字样）；P3、P4 状态行同步更新；三处改动均为文档，不改生成链代码 | D19 / §4 |
| TC-54 | 改造后 | 检查 5 份 rule json 顶层 key；`rg -n "\"kind\"\|\"meta\"\|\"tests\"" tools/docgen/models/rules/*.json`（排除 testcase 文件） | 5 份 model 顶层 key ⊆ `ALLOWED_KEYS`（10 键），无 `kind` / `meta` / `tests` 三键；未新增共享外壳文件于 `tools/docgen/render/`（该目录只有渲染块与测试） | 非目标 / §3-F5 |
| TC-55 | M0a 已记 `skills/rule-inspector/references/criteria.md` sha256 | 改造后重算该文件 sha256 | 与 M0a 记录相等（0 差异）；`git diff --stat -- skills/rule-inspector/references/criteria.md` 行数 = 0 | 非目标 / §3 |
| TC-56 | 改造后 | `node -e "console.log(JSON.parse(require('fs').readFileSync('tools/docgen/models/rules/rules.json','utf8')).rules)"` | 输出 `[ 'evidence-before-conclusion' ]`；数组长度 = 1；不含 4 条 dormant 任一 id | 非目标 / §3 |
| TC-57 | 改造后 | `ls rules/*.md` | 文件数 = 1，文件名 `evidence-before-conclusion.md`；无 dormant 投影落入 `rules/` | 非目标 / §3 |
| TC-58 | 改造后 | `rg -l "四维" docs/reports` 并核对命中路径 | 无任何路径指向 rule 四维报告（命中如存在只属 agent 四维历史件）；`docs/reports` 新增目录数 = M0a 基线报告 1 个 | 非目标 / §3 |
| TC-59 | M0a 已记 5 份 model 的 `title` 与 `assert[].label` 快照 | 改造后逐份比对 | 5 份 `title` 全等；`assert[].label` 逐条全等（条数与文本均一致）；差异 0 条 | 非目标 / §3 |

## 3 PRD 理解差异与疑点

> 以下疑点已在 spec §12 定版；本表保留原始记录，最终口径以 spec §12 为准。

| 编号 | PRD 行号 | 我的理解 | 可能的分歧点（供 spec 对账） |
|---|---|---|---|
| D1 | [PRD:116](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L116)、[cli.mjs:99-105](file:///d:/Seed/retro-skills/tools/docgen/builders/agents/cli.mjs#L99-L105) | 非 registered `--check` 的基准是 `builders/rules/<id>.md`，漂移 1、缺件 2 | 现码先查 `rules/<id>.md`（`cli.mjs:101`），dormant 该文件不存在 → 恒 exit 2（`DanglingBaselineEntry`），故 TC-24 现状不满足。spec 需定：是否改判基准路径、错误码用 `Mismatch` 还是新码、是否仍保留对 `rules/<id>.md` 的检查 |
| D2 | [PRD:99](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L99)、[interpreters.mjs:9](file:///d:/Seed/retro-skills/tools/docgen/builders/rules/interpreters.mjs#L9) | `renderDoc` 在 `tools/docgen/**/*.mjs` 0 命中 = 该标识符连同局部别名、测试内引用全要清 | 若共享引擎导出名仍叫 `renderDoc`（只在 `render/index.mjs` 定义），该条自相矛盾。spec 需定：0 命中的扫描范围是否含 `*.test.mjs`、是否允许在 `render/index.mjs` 内保留同名导出 |
| D3 | [PRD:105](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L105)、[build.mjs:12](file:///d:/Seed/retro-skills/tools/docgen/builders/rules/build.mjs#L12) | 负例落 `schema.test.mjs`（新建）；「无 testcase」由 `build.mjs:31` 抛，需 `--data-dir` 或 env 注入 | 二选一未定（argv vs env）；`DATA_DIR` 是模块级 const，env 方案必须在 import 期读取。spec 需定注入形态与临时目录约定（TC-14/TC-15/TC-21 依赖此） |
| D4 | [PRD:42](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L42)、[PRD:100](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L100) | F4 要求「5 个 model 的冻结 sha256 报告」 | §6.2 又说 4 条 dormant「不另立 golden」。5 份 sha256 冻结 vs dormant 无 golden 是否冲突：冻结报告是「证据」还是「golden 判据」需明确（TC-09/TC-44 按「5 份都记 sha256、但 dormant 不建独立 golden 文件」理解） |
| D5 | [PRD:87](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L87) | `baseline.json` 每条含 `exitCode` | `scs check rules` 一次跑全部 rule，只有一个进程退出码；per-rule `exitCode` 语义未定（是否记「若单跑该 rule 的退出码」）。TC-40 只断言字段存在，不断言取值 |
| D6 | [PRD:104](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L104)、[schema.mjs:288](file:///d:/Seed/retro-skills/tools/docgen/builders/rules/schema.mjs#L288) | `RuleModel.validate` 与现有 `check()` 重叠 | `validate` 返回 findings 数组还是抛异常未定；TC-16 按「返回数组、与 `check` deepEqual」写，spec 若定为抛错需改判据 |
| D7 | [PRD:44](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L44)、[PRD:54](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L54) | F6 判据是「分数不下降、红点不新增」 | 非目标写「不提升 rule 的质量分数」。若改造后分数意外 +1，按 F6 通过、按非目标算偏差。spec 需定「提升」是否也算失控（TC-47 现按 ≥ 基线写） |
| D8 | [PRD:112](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L112) | gate 覆盖面 = 18 席 + 1 registered rule + 未登记手写扫描 | `baseline 19/19` 的 19 = `BASELINE_RULES.length + agentPaths().length`；若 Q4 派生后 rules.json 增加条目，19 会变。TC-34 只按「当前 1 条」判，spec 需定是否写死 19 |
| D9 | [PRD:126](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L126)、[PRD:147](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L147) | 回滚 = `git restore --source=<M0a SHA> --staged --worktree -- rules/ tools/docgen/` 起三步 | M0a 时 PRD 与 baseline 报告为未跟踪件，`restore --source` 不会处理它们；`git clean -fd` 只点名两个路径，其余新建件（如 `tmp/fixtures`）是否也需清理未定。spec 需给白名单全集 |
| D10 | [PRD:86](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L86)、[check-all.mjs:89](file:///d:/Seed/retro-skills/scripts/check-all.mjs#L89) | M0a 要清空或记录 `DOCGEN_RULES_DIR` / `DOCGEN_AGENTS_DIR` | 未提 `DOCGEN_BASELINE_PATH`（`cli.mjs:40` 可重定向 gate 基线）与 `DOCGEN_TMP_ROOT`；spec 需定 M0a 是否也记录这两个 env（TC-43 的洁净判定依赖） |
| D11 | [PRD:119](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L119) | 派生断言 = 非空 + 条数相等 + 等于 `rules.map(...)`；`check-observable.test.mjs:575` 不得只删守卫 | 现断言是正则匹配字面量 `export const BASELINE_RULES = [`（[check-observable.test.mjs:575](file:///d:/Seed/retro-skills/scripts/check-observable.test.mjs#L575)）。改为派生断言后，`BASELINE_RULES` 是否仍须以数组字面量形态存在于 `baseline.mjs`（如 `['rules/'+...]` 的临时量）未定；TC-37 按「不再匹配该字面量」写 |
| D12 | [PRD:83](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L83)、[PRD:100](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L100) | M0a 只新建报告；M0b 才写盘 | TC-45 判「无执行记录即未越权」。若 M0a 需要 `docs/reports/` 新目录，`git status` 会多未跟踪项，需与 §6.1「只含预期未跟踪件」逐字对齐；spec 需给出白名单目录清单 |

## 4 自检（本席清单逐条）

| # | 条目 | 原文摘句（含锚） | 判定 |
|---|---|---|---|
| 1 | 输入空间核对 | 「5 个 rule model 的渲染结果与 §6.1 冻结的 md 逐字节相等」[PRD:97](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L97)；「18 席 JSON + 3 个模型类型」[PRD:65](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L65)；5 份 model 与 5 份投影已核（`models/rules/*.json` 5 份、`builders/rules/*.md` 5 份） | hit |
| 2 | 状态与转移核对 | 「M0a 只读冻结…→ M0b 写盘验证…→ M1…→ M2…→ M3」[PRD:151-157](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L151-L157)；「未获授权不执行」[PRD:93](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L93) | hit（TC-45/51/52/53 覆盖 M0a→M0b 的授权门与状态） |
| 3 | 失败面核对 | 「缺 `landing`、非法 op、type 越界各一条」[PRD:105](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L105)；「分数下降 ≥1 分或新增红点，立即中止」[PRD:126](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L126) | hit（TC-11/12/13/14/48/49 逐条落负例） |
| 4 | 判据来源核对 | 「`check()` 的 finding code」[PRD:105](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L105) 对应 [schema.mjs:288-343](file:///d:/Seed/retro-skills/tools/docgen/builders/rules/schema.mjs#L288-L343)；`TypeInvalid` / `op 未注册` 原文见 [schema.mjs:308](file:///d:/Seed/retro-skills/tools/docgen/builders/rules/schema.mjs#L308) 与 [schema.mjs:248](file:///d:/Seed/retro-skills/tools/docgen/builders/rules/schema.mjs#L248) | hit |
| 5 | 确定性核对 | 「差异集合必须为空」「退出码 1 / 2」[PRD:97](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L97)、[PRD:116](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L116)；本文件期望列一律为退出码 / 字段 / 字节 / 行号，无形容词 | hit |
| 6 | 回归资产核对 | 「`BASELINE_RULES` 派生断言…M3 同步更新 `scripts/check-observable.test.mjs:575`」[PRD:119](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L119)；TC-35–39 可直接长期复用（冷仓副本夹具） | hit |
| 7 | 判别力核对 | 「删引擎必须使 `npm run check` 变红」[PRD:99](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L99)；每条负例均有配对正例：TC-23↔TC-22、TC-25/26↔TC-24、TC-30/31↔TC-29、TC-39↔TC-35、TC-41/42↔TC-40、TC-48/49↔TC-47、TC-52↔TC-51、TC-56↔TC-36 | hit |
| 8 | 盲点雷达核对 | 「非 registered model 的 `--check`：以 `builders/rules/<id>.md` 为基准」[PRD:116](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L116)；现码 `cli.mjs:101` 先查 `rules/<id>.md` 构成盲点，已登记 §3-D1；`renderDoc` 0 命中与导出的矛盾登记 §3-D2 | hit（冲突已列 D1/D2/D3/D11） |
| 9 | 覆盖账核对 | F1–F6 [PRD:39-44](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L39-L44)；§6.1 五项 [PRD:83-93](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L83-L93)；§6.2 五项 [PRD:95-100](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L95-L100)；§6.3 四条 [PRD:102-106](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L102-L106)；§6.4 五行 [PRD:108-119](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L108-L119)；§6.5 四项 [PRD:121-126](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L121-L126)；§9.2 两条 [PRD:170-173](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L170-L173)；§3 七条 [PRD:46-55](file:///d:/Seed/retro-skills/docs/prd/20261113160000-rule-agent-render-alignment.md#L46-L55) | hit：F1 9/9、F2 12/12、F3 13/13、F4/Q4 11/11、F6 5/5、D19 3/3、非目标 6/6 |

- 正文自检：问题项为空 → 全过、无问题（§3 为 PRD 疑点与对账清单，不计为本文件缺陷）。

## 5 越界声明与附录

- 越界声明：本席未读设计稿 `docs/superpowers/specs/2026-11-13-rule-agent-render-alignment-design.md`（零读取）；未改代码、未改 PRD、未改 spec；未跑任何命令。本次为零越界处置动作，故无可复原性判定（n/a），无改前/改后 sha256，无复原命令。
- 附录（问题项为空时显式写）：全过、无问题。
- 本文件不修改 PRD、不实现代码、不代他人签署判定。
