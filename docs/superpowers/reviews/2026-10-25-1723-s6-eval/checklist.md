# S6 执行清单（checklist）

> 形态沿用 `.session/rule-checks/checklist-*.md`；四本账单之一（spec §9.2）。缺一本不得声明完成。

## 交付说明

| 项 | 内容 |
|---|---|
| 交付对象 | F-24 / S6：两份 producer 席边界句改为「定义层数据 + 模板渲染」 |
| 取数命令（能力矩阵） | `node --input-type=module -e "import {readFileSync} from 'node:fs'; import {factsFromText,diffFacts,verdict} from './tools/docgen/test/support/capability-baseline.mjs'; …"`（完整脚本见本文件「取数命令原文」节）；结论两席 `minus [] / plus [] / verdict pass` |
| 取数命令（基线复算） | `git show a7749b27aa1ee51a91242effa375d2b7e8b1f941:agents/reviewer-audit.md` → T1 抽取器重算 8 字段（H01 ③ 实测复现） |
| 取数命令（能力计数） | `node --test tools/docgen/test/policy-pure-source.test.mjs`（A04/A06/B01/C06/C08/F02 逐项派生，不写死条数） |
| 置信度 | **`mid`**（`tools/execution-matrix/rating.mjs` 口径：4 条记录、出现回归 → 非 `high`）；取数：`ab-score.md` 第 1/2 轮均存在 B < A 的维 |
| golden 是否换代 | **已换代**：`fixtures/boundary-golden.json` 追加 `reviewer-audit@2` = `bb06aee7…`、`detective-observer@2` = `ee0e6731…`（键名 `<席>@<轮次>`、轮次为数字，按 testcase:942 / spec:198 的 `/@\d+$/` 口径）；旧键（`reviewer-audit` / `detective-observer` = 改造前）**保留不删**，作 V-2 定位线索 |
| V-13 结论 | **不通过（`QualityRegression`）**，2 轮用尽；**用户 2026-10-25 裁定「接受」**（记 P2，不开第 3 轮）→ S6 状态 = 施工完成、验收未过（原委见 `ab-score.md`「判定」节）。**状态注（2026-10-29）**：用户当日本裁定 **`V-13` 不在本期**，S6 本体验收 = **V-1～V-12**（A–J 组 70/70 通过）；本行的「验收未过」**只对 V-13 成立**，S6 整体状态见 `skills/dev-workflow/references/gate-record.md` 的 `⑤@S6` 行；V-13 转独立课题 `docs/after/20261029100942-s6-v13-ab-eval-rebuild-open-decisions.md` |
| H07a（基线恒真守卫 ①②） | **已转绿**：`641a7e7` 提交后 HEAD 已含 `tools/docgen/policy`，该条不再跳过；`policy-pure-source` 现 71/71（0 skipped；见「最近一次实跑」） |
| 未提交 | 本批全部改动留在工作树，由用户统一 commit（仓约定） |

## 评测者与盲评隔离（V-13；K05 ②–⑤ 的取数位）

| # | 项 | 判据（怎么算合格） | 取值 / 证据 |
|---|---|---|---|
| 1 | 评测者身份 | **2 个全新上下文子代理**（非 spec 作者、非施工者） | 四次独立 dispatch，各实例只读两张匿名卡（见下方「输入清单」） |
| 2 | 盲评隔离 | 每个实例**只看两张匿名卡**（`card-0N`），**顺序打乱** | 实例 1 与实例 2 的卡序相反（见下方两行） |
| 3 | 评的切片 | 评的是**「边界五段」切片**，不是整卡 | `rubric.md` 八维的判定对象 = 边界段；噪声项（身份 / 触发）不入分 |
| 4 | 轮次上限 | **至多 2 轮**（第 3 轮起记 P2 交用户裁） | 2 轮已用尽，见 `ab-score.md`「判定」 |
| 5 | 输入清单（逐实例） | 逐实例列出**实际读到的文件名**（各 2 个卡文件） | 见下方两行 `输入清单（实例 N）`；不得出现 `mapping.sealed.md` |
| 6 | 映射封存位置 | 映射在 `.session/reviews/2026-10-25-1723-s6-eval-sealed/mapping.sealed.md`，**不得**在评测账目录内 | 目录实测：评测账目录（`docs/superpowers/reviews/2026-10-25-1723-s6-eval/`）内无 `mapping.sealed.md` |

- 输入清单（实例 1）：cards/card-01.md、cards/card-02.md
- 输入清单（实例 2）：cards/card-02.md、cards/card-01.md
- 补充（卡组 2 = 侦探席 A/B 的两个实例，同一规则）：实例 1 读 `cards/card-03.md`、`cards/card-04.md`；实例 2 读 `cards/card-04.md`、`cards/card-03.md`

## 取数命令原文（可复制）

```powershell
node --input-type=module -e "import {readFileSync} from 'node:fs'; import {factsFromText,diffFacts,verdict} from './tools/docgen/test/support/capability-baseline.mjs'; import {renderBoundary} from './tools/docgen/components/renderBoundary.mjs'; import * as CAP from './tools/docgen/policy/definitions/capabilities.mjs'; import * as CMD from './tools/docgen/policy/definitions/commands.mjs'; import * as PTH from './tools/docgen/policy/definitions/paths.mjs'; import * as ART from './tools/docgen/policy/definitions/artifacts.mjs'; import * as SEATS from './tools/docgen/policy/definitions/seats.mjs'; import {TIERS} from './tools/docgen/policy/definitions/tiers.mjs'; const groups=Object.values(PTH.pathGroups).flat(); const dict={tools:Object.values(CAP.capabilities).flat(),tiers:Object.keys(TIERS),artifacts:Object.keys(ART.artifacts),paths:[...groups.flatMap(x=>x.split('、')),'spec / plan'],allowVerbs:Object.values(CMD.commandGroups).flatMap(g=>g.verbs),denyVerbs:Object.entries(CMD.forbiddenGroups).filter(([g])=>g!=='env.assign').flatMap(([,g])=>g.verbs),envVerbs:[...CMD.forbiddenGroups['env.assign'].verbs]}; const base=JSON.parse(readFileSync('tools/docgen/fixtures/capability-baseline.json','utf8')); for(const s of ['reviewer-audit','detective-observer']){const d=diffFacts(base.seats[s],factsFromText(renderBoundary(s),dict)); console.log(s,JSON.stringify({minus:d.minus,plus:d.plus,verdict:verdict(d)}))}"
```

预期输出（两行）：

```
reviewer-audit {"minus":[],"plus":[],"verdict":"pass"}
detective-observer {"minus":[],"plus":[],"verdict":"pass"}
```

## 施工前

| 阶段 | 项 | 判据 | 状态 | 证据 |
|---|---|---|---|---|
| 前 | 开工基线 | `check` 659/0 + `gate` 37/37 + 真 `sweep ok` | ✅ | 交接复核（`.superpowers/sdd/…/progress.md` 首段） |
| 前 | 列名照 spec §9.2 | rubric 8 维等权、不设权重列 | ✅ | `rubric.md` |
| 前 | 盲评隔离 | 实例输入只有两张卡、不读 `mapping.sealed.md` | ✅ | `cards/card-01..04.md` + 四次 dispatch 的输入清单 |

## 施工中

| 阶段 | 项 | 判据 | 状态 | 证据 |
|---|---|---|---|---|
| 中 | T1 基线三件 | 2 tests 绿 + `golden keys 8` + 改造前 commit 无 `policy/` | ✅ | `task-1-report.md` |
| 中 | T2/T3 定义/配置层 | A02/A04/A05/A07/A03/B12 绿 | ✅ | `task-2/3-report.md` |
| 中 | T4 模板/渲染/校验/CLI | A06/C06/C08 + A08/B01–B15/C01–C05/C07/C09 绿 | ✅ | `task-4a/4b-report.md` |
| 中 | T5 接卡 + 重出 | `rejudged=["B3"]` / `judgeMode="subagent"`（两轮：`…-b3`、`…-b3-r2`） | ✅ | 两席 `evidence.json` 末条 `changes` |
| 中 | T6 dump 用例 | F01–F06 绿 | ✅ | `task-6-report.md` |
| 中 | T7 下探/子句 | I01–I03/J01–J03/C01–C02 绿（80 探针） | ✅ | `task-7-report.md` |
| 中 | V-13 回改 | 第 1 轮 B<A → 回改模板三处 → 第 2 轮重评 | ✅（回改已做，重评仍未过） | `ab-score.md` |

## 施工后

| 阶段 | 项 | 判据 | 状态 | 证据 |
|---|---|---|---|---|
| 后 | 全量回归 | `npm run check` → `check 全部通过`（736 tests / 733 pass / 0 fail / 3 skip） | ✅ | 见「最近一次实跑」 |
| 后 | `gate` | `baseline 37/37` | ✅ | 同上 |
| 后 | 真 sweep | `node scripts/scope-sweep.mjs --check` → `sweep ok` | ✅ | 同上 |
| 后 | 能力矩阵 | 两席 `minus/plus` 双空 | ✅ | 取数命令原文 |
| 后 | 四本账单 | `rubric.md` / `capability-diff.md` / `ab-score.md` / `checklist.md` | ✅（本文件） | 同目录 |
| 后 | V-13 | 逐维 B ≥ A 且至少一维 B > A | ❌ **不通过**（QualityRegression，2 轮用尽 → P2 交用户裁） | `ab-score.md` |
| 后 | K 组 8 条（K01–K08） | testcase 78 条全覆盖 | ❌ **未实现（0/8）**；`K04` 的判据就是「V-13 逐维 B≥A」，用户已裁定接受 V-13 不过 → 写它必红；`K05` 要求 `ab-score.md` 不出现席名（现按席分节）。**按用户裁定延期**，登记在 `docs/after/20261025145953-s6-policy-open-items-open-decisions.md` §5 D2（带触发信号）；本批不声明这 8 条已执行，④ 段因此不成立 | 同左 + `progress.md`（Ruling 18/20） |
| 后 | H07a | 提交后跑 `node --test …`（期望 71 pass / 0 skipped） | ✅（`641a7e7` 提交后已跑：71/71） | 本文件「最近一次实跑」 |
| 后 | 目录迁移 | 整目录迁 `docs/superpowers/reviews/2026-10-25-1723-s6-eval/`（四本账 + `impact-sheet.md` + `cards/`）；`mapping.sealed.md` 单独留 `.session/reviews/2026-10-25-1723-s6-eval-sealed/`（K05 的「封存映射不进评测账目录」） | ✅（2026-10-25 已迁；`.session` 侧同名目录已删） | 目录实测 |

## 评审修复（2026-10-25，对 commit 641a7e7 的代码评审）

| # | 问题 | 修法 | 落点 | 定向验证 |
|---|---|---|---|---|
| 1 | 不变量 8 按 token 判禁止交集 → 合法席级组被 `node` / `draft` 等 token 误伤 | 已登记的允许 verb 直接放行；其余按「禁止 verb 的 token 序列」做连续子序列匹配 | `validatePolicy.mjs`（不变量 8 段） | 副本内席级组放 `node scripts/check-all.mjs` → exit 0（修前 `:verb`） |
| 2 | 配置非法时导入期抛 `TemplateImpure: …:TIER`，绕过 `validatePolicy`、首行指错模板 | 渲染层对 caps 做数组归一 + `TIER` 退空串；错由 `validatePolicy` 发码 | `renderBoundary.mjs:131-137` | 副本内 `caps=['write']` → `UnknownPolicyRef: reviewer-audit:tier=unknown`，exit 1、无栈 |
| 3 | `escalationWriter` 的 `slug` / `artifact` 未校验，卡面静默变「默认席写 …」 | 补两条引用面校验，报 `UnknownPolicyRef` | `validatePolicy.mjs`（不变量 1 槽 6 段） | 两种写错各得 `…:escalationWriter=…` / `…:escalationWriter-artifact=…` |
| 4 | R8 的 impact-sheet 可被旧评审清单冒充（取全仓 mtime 最新） | 增「清单不得早于被扫文件」判定（1s 容差）；并为本批补 `impact-sheet.md` | `scope-sweep.mjs:106-121` + 本目录 `impact-sheet.md` | 修前旧清单 → `FAIL: impact-sheet 早于被扫文件`；补本批清单后 `sweep ok` |
| 5 | `lineOf` 取全局首个命中 → 报文行号指错席 | 新增 `lineOfValue`：先定位席块、再在块内找该值 | `validatePolicy.mjs:43-58`、`:109` | 写坏 `senior-sdet` 那行 → 报 `seat-policy.mjs:7`（修前报首处） |
| 6 | `dumpPolicy` 返回定义层现场引用、`dir` 死参 | 返回 `structuredClone(...)`；`dir` 保留 Interface 并注释 | `dumpPolicy.mjs:24-34` | `dump().json.capabilities !== CAP.capabilities`、`json.tiers !== TIERS` |

修复后复跑：`policy-pure-source` 71/71、`tool-tiers` 47/47、`scope-sweep.test` 6/6、`gate` `baseline 37/37`、`npm run check` `check 全部通过`（736 tests / 734 pass / 0 fail / 2 skip）、`node scripts/scope-sweep.mjs --check` → `sweep ok`。两卡 `diff` 零差异（本次修复不改合法配置的渲染结果）。

### 评审修复第 2 轮（对上面那份修复 diff 的复评，4 条新引入风险）

| # | 新引入的问题 | 修法 | 验证 |
|---|---|---|---|
| 1 | 显式 `--impact` 也被 mtime 守卫否决（该 flag 的覆盖能力被消掉） | mtime 守卫移入 `if (!impactPath)`：**自动发现**才比 mtime，显式指定视为声明式覆盖 | 显式指向一份 mtime 做旧到 2020 的清单 → 无 mtime 理由（`#1 explicit reasons= (无)`） |
| 2 | 「先写清单、后改文档」会反复红（与 #1 同一处） | 同上（常规序可用 `--impact` 显式过） | 同时验「自动发现」仍能拦旧清单：把本批清单 mtime 改旧 → `FAIL: impact-sheet 早于被扫文件`；还原后 `sweep ok` |
| 3 | `lineOfValue` 的块尾正则写死 2 空格缩进，换排版会指到别席 | 块尾改缩进无关 `/^\s*'[^']+'\s*:\s*\{/` | 副本改成 4 空格 + 多行配置，写坏 `senior-sdet.capabilities` → 报在该席自己的 capabilities 行（不再指到首个命中） |
| 4 | 不变量 8「允许 verb 放行」使 allow-list 被盲信，且与 spec §3.5 #8 口径漂移 | **按方案不改代码**：保留放行（否则 `draft ls` / `node scripts/*` 误伤无解），在代码注释里写明偏离与代价，记入回流项 | 代码注释（`validatePolicy.mjs` 不变量 8 段）+ 本表 + `progress.md` 的 Ruling 19 |

第 2 轮复跑（同上五条命令）：`scope-sweep.test` 6/6、`policy-pure-source` 71/71、`tool-tiers` 47/47、`gate` 37/37、`npm run check` 736/734/0/2 → `check 全部通过`、`sweep ok`；`.session/tmp/` 残留 0。

## 最近一次实跑（2026-10-25 评审修复后）

```
node --test tools/docgen/test/policy-pure-source.test.mjs   → # tests 71 / # pass 71 / # fail 0（H07a 已随 commit 转绿）
node --test tools/docgen/test/tool-tiers.test.mjs           → # tests 47 / # pass 47 / # fail 0
node --test scripts/scope-sweep.test.mjs                    → # tests 6 / # pass 6 / # fail 0
node tools/docgen/cli.mjs gate                              → baseline 37/37
npm run check                                               → # tests 736 / # pass 734 / # fail 0 / # skipped 2；check 全部通过
node scripts/scope-sweep.mjs --check                        → sweep ok
```
