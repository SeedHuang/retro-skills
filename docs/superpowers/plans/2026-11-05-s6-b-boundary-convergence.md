# S6-B 边界句结构收敛：施工计划

> 状态：**草稿（②→③ 计划门待签）**｜建 2026-11-05｜作者 = 主 agent
> spec：`docs/superpowers/specs/2026-11-04-s6-b-boundary-convergence-design.md`（SHA256 `E5C6AA36…1A30`）
**Testcase:** `docs/superpowers/specs/2026-11-04-s6-b-boundary-convergence-design-testcase.md`（53 条，`F1AF952D…BD39`）

> 功能点：**F-24**（`docs/prd/20261024073606-dev-workflow-mainline/index.md` §10）；不改功能点集合。

## 0 全貌确认

| 项 | 内容 |
|---|---|
| 本质 | 把 `senior-sdet` 的专用字面边界句收回「数据 → 渲染」：路径项对象化 + 写作用域 + 项级排除 + 槽集 15 |
| 同族 | 定义层 `paths` / `seats` / 新增 `writeScopes`；渲染层模板 + `renderBoundary` + `dumpPolicy`；注册表 `patternRegistry`；校验器 `validatePolicy`；**7 个既有测试文件**；**2 个 fixture**；`agents/senior-sdet.md` |
| 边界 | 不改任何席权限语义；不动 `DEFAULT_BOUNDARY` 11 席与 `evidence-reader` 自有句；`docs/agents/**` 零改动；不新增错误码 |
| 验收（可机械判） | `npm run check` 末行 `check 全部通过` + `# fail 0`；`gate` → `baseline 38/38`；`sweep ok`；两评审席卡面 `git diff` 0 行；`agents/senior-sdet.md` 边界段 = `renderBoundary('senior-sdet')` |
| 影响面 | **8 个源文件** + **7 个测试文件** + **2 个 fixture** + 1 张卡面 + 本批 spec/testcase/plan；`docs/agents/**` 零改动 |
| 联动四问·治本 | 单改文案会复发；本批把「首句 / 写入范围 / 禁写项」三处都收进数据 |
| 联动四问·副作用 | `pathGroups` 形态变更会打死 4 个测试文件的派生 helper；3 席接模板会打死 `SB-TC-05/25/40` 与 `S6-TC-E02` 的子断言 → 全部列进 D8 与 T4 |
| 联动四问·跨问题 | 与非评审席同族的还有 `evidence-reader` 自有句与 11 席默认句，本批不扩面 |
| 联动四问·跨页面 | `boundaryBySeat` 只被 `agentData` 消费；`renderBoundary` 只被注册表与测试消费 |

## 1 任务表

| # | 任务 | 产出 | 依赖 |
|---|---|---|---|
| T1 | 定义层：路径项对象化 + 写作用域 + 席位字段 | `paths.mjs`（`{id,text}` 项对象、`代码`/`测试` 拆两项）、`writeScopes.mjs`（新增 2 个 scope）、`seats.mjs`（`senior-sdet` 的 `writeScope` + `clause`） | 无 |
| T2 | 渲染层：模板三槽 + 按席排除 | `boundary.md.tpl`（`{{ROLE_KIND}}` / `{{WRITE_SCOPE}}` / `{{HOST_RULE}}`，删两段账本字面）、`renderBoundary.mjs`（`SLOTS` 15、`slotValues`、`forbiddenPaths(席)`、`listClassMembers` 读 `item.text`） | Consumes: Task 1 |
| T3 | 注册表与校验器：删常量 + 不变量 10/13/14 + 校验排序 | `patternRegistry.mjs`（删 `SDET_BOUNDARY`、`boundaryBySeat['senior-sdet'] = renderBoundary`）、`validatePolicy.mjs`（引用校验 + 显示名扫描 + 排序） | Consumes: Task 2 |
| T4 | 既有测试回归面 + 黄金换代 | `policy-pure-source.test.mjs` / `tool-tiers.test.mjs` / `sa-data-layer.test.mjs` / `sb-contract-layer.test.mjs` / `sdet-render.test.mjs`（按 D8 逐块改判）、`fixtures/boundary-golden.json`（追加 `senior-sdet@1`，旧键不删） | Consumes: Task 3 |
| T5 | 卡面重出与投影核验 | `agents/senior-sdet.md`（`draft` → `replace`）；`docs/agents/**` 零改动断言 | Consumes: Task 4 |
| T6 | 收口：全仓门禁 + R8 + 门行 | `npm run check` / `gate` / `sweep` 绿；`impact-sheet` §2 回填；`gate-record.md` 的 `②→③@S6-B` | Consumes: Task 5 |

**功能点→任务映射**

| 功能点 | 内容 | 任务 |
|---|---|---|
| F-24 | docgen 规则单一来源化（S6 续作） | Task 1 / Task 2 / Task 3 / Task 4 / Task 5 / Task 6 |

## 2 任务小节（`check-plan deps` 的机械证据位）

### T1 定义层
- Consumes: 无
- 产出：`paths.mjs` 把 `pathGroups` 的每项改为 `{id,text}`（`code` 拆 `code.src` / `code.test`，其余 17 项只加 `id`）；新增 `writeScopes.mjs`（`review.ledger` / `spec.testcase`，后者 `excludePathItems: ['code.test']`）；`seats.mjs` 给 `senior-sdet` 加 `writeScope: 'spec.testcase'` 与 `clause`。
- 验收：`node tools/docgen/cli.mjs policy --dump` 仍产出 `paths.groups` 为 **text 字符串数组**（投影）；`node --input-type=module -e` 取 `Object.values(pathGroups).flat().length` = **19**、`id` 集合无重复。

### T2 渲染层
- Consumes: Task 1
- 产出：模板首句改 `你是{{ROLE_KIND}}（{{SEAT}}）。`、写入范围句改 `**只允许写**：{{WRITE_SCOPE}}。{{ARTIFACTS}}{{SEAT_CLAUSE}}`、禁止写段首改 `{{HOST_RULE}}`，删 `.session/reviews/<本次>/` 与 `docs/superpowers/reviews/<本次>/` 两段字面；`renderBoundary.mjs` 的 `SLOTS` 12→15（`ROLE_KIND` / `WRITE_SCOPE` / `HOST_RULE` 追加末位）、`slotValues` 读 `writeScopes`（未知 scope 渲染空串、不抛）、`forbiddenPaths(席)` 在基准句尾追加排除注；`assertTemplatePure` 读 `text`。
- 验收：两评审席 `renderBoundary` SHA256 与 `BASE` 卡面边界节逐字相等；`slotValues('senior-sdet').FORBIDDEN_PATHS` 含「排除「测试」」；`SLOTS.length` = 15；`slotValues('senior-sdet').HOST_RULE` 含「只由主 agent 写」且不含「主持人」。

### T3 注册表与校验器
- Consumes: Task 2
- 产出：`patternRegistry.mjs` 删 `SDET_BOUNDARY`、`boundaryBySeat['senior-sdet'] = renderBoundary('senior-sdet')`；`validatePolicy.mjs` 增不变量 10（`writeScope` / `excludePathItems` / 保留名 / 显式 `undefined`）、13（按 scope 白名单 ⊆ + 键集恰两值）、14（`spec.testcase` 仅 `senior-sdet`），并把这三项校验排在 `slotValues` 全量循环之前；显示名扫描面追加 `writeScopes.mjs`（只判 `display`）。
- 验收：副本改 `writeScope='spec.unknown'` → `gate` exit 1、首行 `UnknownPolicyRef: senior-sdet:writeScope=spec.unknown`（不含 `TypeError` / `TemplateImpure`）；副本改`excludePathItems=['rules']` → `ForbiddenGroupGranted: writeScope=spec.testcase:excludePathItem=rules:not-allowed`。

### T4 既有测试回归面 + 黄金换代
- Consumes: Task 3
- 产出：按 spec §6 D8 的 ①–⑩ 逐块改判（4 文件派生 helper 读 `item.text`；`S6-TC-A04` 关系式与 `P.code`；`S6-TC-H02`；槽集 4 块；`S6-TC-F02` 的 `expanded[4]`；`S6-TC-G03`；`S6-TC-E02`；`SB-TC-05/25/40/13`；`sdet-render` 块）；黄金追加 `senior-sdet@1`（旧键不删）。
- 验收：`node --test tools/docgen/test/policy-pure-source.test.mjs`、`tool-tiers.test.mjs`、`sa-data-layer.test.mjs`、`sb-contract-layer.test.mjs`、`sdet-render.test.mjs` 五个文件各 exit 0；`goldenKeyFor('senior-sdet')` = `senior-sdet@1`。

### T5 卡面重出与投影核验
- Consumes: Task 4
- 产出：按 `draft` → 对照 → `replace` 重出 `agents/senior-sdet.md`；`docs/agents/**` 不重生成（投影不承载边界）。
- 验收：`node tools/docgen/cli.mjs gate` → `baseline 38/38`；`git diff -- agents/reviewer-audit.md agents/detective-observer.md` 0 行；`git diff -- docs/agents` 0 行。

### T6 收口
- Consumes: Task 5
- 产出：全仓门禁复跑；`impact-sheet` §2 回填实跑结论；`gate-record.md` 落 `②→③@S6-B` 行。
- 验收：`npm run check` 末行 `check 全部通过` + `# fail 0`；`sweep ok`；`check-gate-record` → `bad 0`。

## 3 白名单（变更清单，逐行可核）

| # | 路径 | 形态 | 由谁写 |
|---|---|---|---|
| 1 | `tools/docgen/policy/definitions/paths.mjs` | M | T1 |
| 2 | `tools/docgen/policy/definitions/writeScopes.mjs` | A | T1 |
| 3 | `tools/docgen/policy/definitions/seats.mjs` | M | T1 |
| 4 | `tools/docgen/templates/boundary.md.tpl` | M | T2 |
| 5 | `tools/docgen/components/renderBoundary.mjs` | M | T2 |
| 5' | `tools/docgen/components/dumpPolicy.mjs` | M（`paths.groups` text 投影） | T2 |
| 6 | `tools/docgen/components/patternRegistry.mjs` | M | T3 |
| 7 | `tools/docgen/components/validatePolicy.mjs` | M | T3 |
| 8 | `tools/docgen/test/policy-pure-source.test.mjs` | M | T4 |
| 9 | `tools/docgen/test/tool-tiers.test.mjs` | M | T4 |
| 10 | `tools/docgen/test/sa-data-layer.test.mjs` | M | T4 |
| 11 | `tools/docgen/test/sb-contract-layer.test.mjs` | M | T4 |
| 12 | `tools/docgen/test/sdet-render.test.mjs` | M | T4 |
| 12' | `scripts/check-observable.test.mjs` | M（S1 守卫改为「只许 S6-B 登记 3 文件」） | T4 |
| 12'' | `tools/docgen/test/s3-predicates.test.mjs` | M（`S3-TC-H06` 回退集去掉 `paths.mjs`，只回退判据表与卡面） | T4 |
| 13 | `tools/docgen/fixtures/boundary-golden.json` | M | T4 |
| 14 | `agents/senior-sdet.md` | M（`replace` 重出） | T5 |
| 15 | `docs/superpowers/specs/2026-11-04-s6-b-boundary-convergence-design.md` | A（② 产物） | ② |
| 16 | `docs/superpowers/specs/2026-11-04-s6-b-boundary-convergence-design-testcase.md` | A（② 产物） | ② |
| 17 | `docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design.md` | M（仅日期注，已在 ② 落） | ② |
| 18 | `docs/superpowers/plans/2026-11-05-s6-b-boundary-convergence.md` | A（本件） | 主 agent |
| 19 | `tools/scope-sweep/keywords.json` | M（已加 I35，② 落） | ② |
| 20 | `tools/scope-sweep/baseline.json` | M（`--freeze`，② 落） | ② |
| 21 | `skills/dev-workflow/references/gate-record.md` | M（`②@S6-B` 已落；本门加 `②→③@S6-B`） | T6 |
| 22 | `.session/reviews/2026-11-04-2134-s6-b-boundary-convergence/impact-sheet.md` | M（过程账，不进 git） | T6 |
| 23 | `tools/docgen/fixtures/senior-sdet.evidence.json` | M（`replace` 写回凭证） | T5 |
| 24 | `docs/reports/2026-11-05-s6-b-plan-gate.md` | A（计划门审计） | ②→③ |
| 25 | `docs/reports/2026-11-05-s6-b-step-3-audit.md` | A（③ 段审计） | T6 |
| 26 | `docs/reports/2026-11-05-s6-b-quality-evidence/quality-4.md` | A（④ 结论表） | ④ |
| 27 | `docs/reports/2026-11-05-s6-b-quality-evidence/quality-4-audit.md` | A（④ 核对表） | ④ |
| 28 | `docs/reports/2026-11-05-s6-b-quality-evidence/delivery-5-audit.md` | A（⑤ 交付审计） | ⑤ |
| 29 | `docs/after/20261031111000-senior-sdet-boundary-conflict-open-decisions.md` | M（§六 加「S6-B 已落地」状态注） | T6 |

## 4 不改清单（动了即返工）

- `docs/agents/**`（16 份投影）：本批零改动；只断言零差异。
- `agents/reviewer-audit.md` / `agents/detective-observer.md`：渲染字节不变。
- `evidence-reader` 的边界句与 11 席 `DEFAULT_BOUNDARY`。
- 配置层 `seat-policy.mjs` 三键（closed-world 不变）。
- S6 原文与 S6 testcase 的结论句（只许日期注 + 指针）。
- `tools/docgen/card-model/**`、`tools/docgen/components/agentData.mjs`（取值方式不改）。

## 5 每处改判的红绿取证要求

| 改判 | 绿档（必须实跑） | 红档（必须可重跑构造） |
|---|---|---|
| 两评审席渲染字节不变 | `sha(renderBoundary(席))` == `BASE` 卡面边界节 | 副本改模板首句一个词 → SHA 不等、V-1 红 |
| `senior-sdet` 接渲染 | `agentData` 该席 `boundary === renderBoundary('senior-sdet')`；`git grep SDET_BOUNDARY -- tools/ agents/ skills/` = 0 | 副本回填常量 → 导出面断言红 |
| 项级排除 | `slotValues('senior-sdet')` 含「排除「测试」」；`code.src` 仍在 | 副本把排除项写成组 ID `code` → `UnknownPolicyRef` |
| 白名单 / 键集 | 不变量 13 ⊆ 绿档；`review.ledger` 空集绿 | 副本加第三 scope / 扩 `rules` → `ForbiddenGroupGranted` |
| 校验排序 | 副本改未登记 `writeScope` → 首行 `UnknownPolicyRef`、无 `TypeError` | 副本把校验挪到 `slotValues` 之后 → 首行变 `TypeError`（红档举证） |
| 黄金换代 | `goldenCurOf('senior-sdet')` = `senior-sdet@1`；旧键仍在 | 副本删旧键 / 用改造后自哈希 → 用例红 |

## 6 已知限制（触发 / 谁兜）

- 数据文本字符约束（`text` / `label` / `roleKind` / `hostRule`）→ 触发 = 下次改这四类数据；候选，不阻断。
- 测试元断言（断言测试源码写法）→ 触发 = 下次重构测试；候选。
- 第 2 轮无独立审计核单 → 由第 3 轮终局审计覆盖（`delivery-audit.md`）。
- 本批 53 条 testcase 以命令形态执行（`PROBE` / `COPY` / `COUNT` / `DUMP`），无常驻 `S6B-TC-*` test 块 → 触发 = 下次需要回归时把高价值用例落成常驻块；候选。

## 附录 A：testcase ↔ 任务映射

| 用例 ID | 任务 | 覆盖要点 |
|---|---|---|
| S6B-TC-01 | Task 4 | V-1 两评审席渲染字节不变 |
| S6B-TC-02 | Task 4 | V-1 卡面 = 渲染逐字节 |
| S6B-TC-03 | Task 4 | V-1 判别力（改数据必红） |
| S6B-TC-04 | Task 4 | V-1 黄金不作判据 |
| S6B-TC-05 | Task 3 | V-2 `agentData` 接渲染 |
| S6B-TC-06 | Task 3 | V-2 导出面 / grep 面 |
| S6B-TC-07 | Task 3 | V-2 回填常量必红 |
| S6B-TC-08 | Task 3 | V-2 grep 面宽 |
| S6B-TC-09 | Task 5 | `draft` → `replace` + 投影零改 |
| S6B-TC-10 | Task 2 | V-3 模板去字面 |
| S6B-TC-11 | Task 2 | V-3 槽值 = 数据两字段 |
| S6B-TC-12 | Task 2 | V-3 字面回填必红 |
| S6B-TC-13 | Task 2 | V-3 改数据渲染跟随 |
| S6B-TC-14 | Task 2 | 两字面从白名单删除 |
| S6B-TC-15 | Task 4 | V-3 扫描面判别力 |
| S6B-TC-16 | Task 2 | V-4 / V-5③(a) 项级移除 |
| S6B-TC-17 | Task 2 | V-4 / V-5③(a) 反面 + 不变量 13 |
| S6B-TC-18 | Task 3 | 不变量 10 组 ID / 字面 ≠ 项 ID |
| S6B-TC-19 | Task 2 | §3.5 句尾追加 + V-5⑤ |
| S6B-TC-20 | Task 4 | V-5① 允许写全等 |
| S6B-TC-21 | Task 4 | V-5① 多 / 减授权必红 |
| S6B-TC-22 | Task 4 | V-5② 禁写点名覆盖 |
| S6B-TC-23 | Task 4 | V-5② 覆盖缺口必红 |
| S6B-TC-24 | Task 4 | V-5③(b) 元素文本 diff |
| S6B-TC-25 | Task 1 | §3.1 三数口径 |
| S6B-TC-26 | Task 2 | V-6 槽集 15 / 行序 |
| S6B-TC-27 | Task 2 | V-6 `expanded` 15 |
| S6B-TC-28 | Task 2 | 不变量 11 漏槽 / 多槽 |
| S6B-TC-29 | Task 2 | 旧 12 槽位置不动 |
| S6B-TC-30 | Task 6 | V-7 绿档 + 真仓基线 |
| S6B-TC-31 | Task 3 | V-7 负例一 / 二 |
| S6B-TC-32 | Task 3 | V-7 红非恒真 |
| S6B-TC-33 | Task 3 | 不变量 12 模式项无 `id` |
| S6B-TC-34 | Task 3 | 不变量 10 同一 `id` 只许一次 |
| S6B-TC-35 | Task 3 | 不变量 10 显式 undefined/null/空串 |
| S6B-TC-36 | Task 3 | V-7 负例三 + 不变量 13 |
| S6B-TC-37 | Task 6 | V-8 `npm run check` |
| S6B-TC-38 | Task 6 | V-8 `gate` + `sweep` |
| S6B-TC-39 | Task 3 | 不变量 12 `roleKind` / `label` 非空 |
| S6B-TC-40 | Task 6 | V-8 用例数不降 |
| S6B-TC-41 | Task 1 | §3.1 项对象形态 |
| S6B-TC-42 | Task 1 | §3.1 禁止共用 `id` / 保留名 |
| S6B-TC-43 | Task 1 | §3.3 缺省解析 |
| S6B-TC-44 | Task 1 | §3.3 / V-5④ 旧句第三段 |
| S6B-TC-45 | Task 4 | D6 黄金追加 `senior-sdet@1` |
| S6B-TC-46 | Task 4 | D6 自哈希 / 删旧键必红 |
| S6B-TC-47 | Task 2 | §3.1 / D1' dump 投影 |
| S6B-TC-48 | Task 2 | §3.6 纯度读 `item.text` |
| S6B-TC-49 | Task 3 | 不变量 10 保留名 |
| S6B-TC-50 | Task 3 | 不变量 14 scope 绑定 |
| S6B-TC-51 | Task 3 | 显示名扫描面覆盖两字段 |
| S6B-TC-52 | Task 3 | 不变量 13 键集恰两值 |
| S6B-TC-53 | Task 2 | `HOST_RULE` 数据化 + 非议会席 0 命中「主持人」 |

**覆盖核对**：53 条逐条落 Task 1–6，无悬空、无重复；每条用例至少对应一个任务的产出。
