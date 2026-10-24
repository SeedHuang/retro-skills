# 测试用例：Docgen P2 · S2 试点 1 席（reviewer-audit 数据搬家）——修订版 4 配套

> 归属 spec：`docs/superpowers/specs/2026-10-19-docgen-agent-pilot-design.md`（修订版 3，split from `docs/prd/20261019093443-docgen-agent-generation.md` 2026-10-19）
> 编写者：`senior-sdet`，实例标识 `sdet-2026-10-19-docgen-p2-s2-rev4`。
> **独立性声明**：编写者 ≠ spec 作者（spec 由主持人在别的上下文修订），≠ 施工者（S2 施工 agent 未在本上下文出现）。本文件在全新上下文独立编写，**只依据修订版 3 spec、S1 能力 spec、PRD、黄金快照、当前实现代码与第 1/2/3 轮评审台账推导**，不从施工结果倒推判据。
> 状态：草稿（可送议会；定稿条件 = 五要素齐 + 计数自洽 + 覆盖 38/38 + 送审说明附本文件 §0 取数输出）。
> **计数口径**：用例分「正例 / 边界 / 负例」三列，合格线 = 负例 + 边界 ≥ 正例；本文只此一套口径，取数命令与实测结果见 §0 与 §10。
> 命名与落点：按 `spec-testcase-gate` 判据 1（与 spec 同目录；`<spec 文件名去 .md>-testcase.md`）。
> **修订说明（修订版 4：按第 3 轮 14 项定点问题修复）**：① TC-061 固定必问模式改为黄金文件实测唯一片段并写明实测次数；② TC-074 按新写序（先 state 后 rename）重写，删不可达构造，另补 TC-078（rename 前崩溃）；③ TC-001 evidence 改八字段（含 `renderSha256`）、SHA256 统一大写、账本行不要求「巩固证据」非空；④ TC-024 为 B 建 evidence fixture，A/B 均先 draft 再 replace；⑤ TC-054/057/076 登记口径钉为「S2 §11 + `validateAgentData.EXIT`」，TC-076 扫描集与档位补 `EvidenceInvalid`、`InvalidArgs`；⑥ TC-016/028/029/033/057 的黄金断言执行者钉为 `tools/docgen/acceptance/golden-assert.mjs`（输入 evidence 路径，exit 0/1/2）；⑦ TC-058 写明 `collectGate()`/`gateChecks()` 的导出面；⑧ TC-060 不再 import 未导出的正则常量（改为测试内复制同一正则字面量）；⑨ 删除 §9 原 #13「tools 由 map 注入」建议（spec R2/§3.1 已定条目写入 tools）；⑩ 覆盖分母全文统一为 38；⑪ TC-067 模板编码改为真话（未独立预检）并在 §7 补缺口行；⑫ TC-020 判据改 Node 可执行；⑬ TC-077 桩席钉 `outputKind='audit'`，H2 断言改为「7 顶层 + `outputFormats[kind]` 的 H2 数」；⑭ TC-045 修正逻辑并补 §7「字节相同的 D6 绕过无法用 gate 区分」。
> **修订说明（修订版 3，历史）**：按第 2 轮复评修复 A–L 12 组——A 修 TC-051 计数自相矛盾（检索范围排除 `agents/<本席>.md`，三模式全部预期 1）；B 新增「测试执行模型」（需 replace / `npm run check` / 冷跑 / 真实仓库改写的用例落 `tools/docgen/acceptance/*.mjs`，`*.test.mjs` 禁止 spawn `npm run check`）；C 证据载体改为 `tools/docgen/fixtures/reviewer-audit.evidence.json`，`TargetDrift` 基准改 `lastWrittenHash`；D replace 写序改为「先 state 后 rename」+ 幂等恢复；E `generate` 对已拆槽席恒渲染 + 比对（spec §11 第 3 条）；F 新错误码登记口径改「S2 §11 + EXIT 表」并补登记完整性用例；G 真实目标文件改动一律进仓库副本 + `finally` 恢复/丢弃；H TC-024 补 A 的草稿；I 计数/预期错误逐条修正（TC-048/059/061/062 + 覆盖口径）；J 渲染 API 两层（纯函数 / `renderByName`）在用例中写清调用层；K 模板结构对齐 12 个 H2（5 个在输出格式块内）+ 空共享块边界；L `state.json` version/键集校验 + 冷跑交付清单不依赖 git 跟踪。
> **编号规则**：旧号 TC-001～TC-072 保留原含义（只修判据/落点、不改语义）；**TC-042 作废**（见 §10，理由 = spec §11 第 4 条）；**TC-073～TC-078 为近两轮新增、连续编号**；全文唯一空号 = 作废的 TC-042。

## 0 计数口径与取数方法

**唯一口径**（本文件内任何数字都必须与本口径一致，其它章节不得另立计数）：

| 类别 | 定义 | 判据 |
|---|---|---|
| 正例 | 断言「正常旅程应成立」的用例 | 结论为「实现正确时应通过」 |
| 边界 | 断言「合法但极端的构造下行为仍确定」的用例，或「两态交界处的语义」 | 结论为「不越界、不误判」 |
| 负例 | 断言「错误输入 / 错误状态 / 错误实现必须被拦」的用例 | 结论为「必须红 / 必须拒 / 必须报指定码」 |

**合格线**：负例 + 边界 ≥ 正例。

**取数命令（可复算）**：

```text
# ① 用例总数与三分类（读用例明细里的「类别」行，唯一真相）
node -e "const fs=require('fs');const t=fs.readFileSync('docs/superpowers/specs/2026-10-19-docgen-agent-pilot-design-testcase.md','utf8');const d=t.split(/^### TC-/m).slice(1);const c={'正例':0,'边界':0,'负例':0};for(const s of d){const m=s.match(/- \*\*类别\*\*：(正例|边界|负例)/);if(!m)throw new Error('缺类别行：'+s.slice(0,24));c[m[1]]++;}console.log('cases='+d.length,JSON.stringify(c),'neg+boundary='+(c['负例']+c['边界']));"

# ② 覆盖项行数（读 §1 覆盖总表里以 R / W1 / § 开头的行）
node -e "const fs=require('fs');const t=fs.readFileSync('docs/superpowers/specs/2026-10-19-docgen-agent-pilot-design-testcase.md','utf8');const s=t.split('## 1 覆盖总表')[1].split('## 2 ')[0];console.log('coverageRows='+s.split('\n').filter(l=>/^\| (R[0-9]|W1-|§)/.test(l)).length);"
```

> 本机无 shell 执行环境，本文件的实测计数用 Grep 工具等价取数（`grep -c` 同义），结果见 §10；上面的 node 命令供评审复算，两者必须一致。

### 0.1 测试执行模型（防递归，spec §7）

| 落点 | 装什么 | 硬约束 |
|---|---|---|
| `tools/docgen/test/*.test.mjs` | **纯函数断言**（`renderAgent` 纯函数、`compareBuffers`、`validateAgentData`、`exitCodeFor`、静态源码扫描）与**仓库副本内的断言**（副本目录由 `fs.cpSync` 构造，测试结束 `finally` 删除） | **禁止**在测试内 spawn `npm run check`；**禁止**改写真实仓库的受检文件（`agents/**`、`rules/**`、`tools/docgen/state.json`） |
| `tools/docgen/acceptance/*.mjs` | 需要 `replace` / `draft` 落草稿箱 / 冷跑 / 真实仓库改写的端到端验收用例，由验收人显式执行（`node tools/docgen/acceptance/<name>.mjs`） | 不被 `node --test '**/*.test.mjs'` 匹配；每个用例自带 `finally` 清理（副本丢弃 / 原始字节恢复）；`DOCGEN_DRAFTS_DIR` 指向副本内临时目录，不碰真实草稿箱；`npm run check` 的完整输出由验收人保存，作为巩固第 2 项证据 |

**为什么**：`scripts/check-all.mjs:64` 用 `node --test '**/*.test.mjs'` 跑全仓；若测试文件内再 spawn `npm run check`，`check-all → 测试 → check-all` 无限递归。故把「会触发整仓检查或真实替换」的用例移出 `*.test.mjs`，`npm run check` 只在验收层由人执行一次。

## 1 覆盖总表

> 分母口径（按 `spec-testcase-gate` 判据 3）：**覆盖项 = 规范条目（R / W1 / §3）+ 可验证执行步（§4 九步，每步有独立机器输出）**。算式 = R1–R12（12）+ W1 验收表五行（5）+ §3.1–§3.4（4）+ §4 九步（9）+ §6 硬约束 1–8（8）= **38**。覆盖 **38/38**。

| 条目 | 条目含义（spec 原文要点） | 覆盖用例 | 覆盖数 |
|---|---|---|---|
| R1 | 试点对象 = `reviewer-audit`（含 sharedBlock + outputKind 双格式，槽位组合最全） | TC-002、TC-004、TC-019 | 3 |
| R2 | 数据迁移 = 黄金快照转录 + description 拆槽 + **按宿主分开写**（agentData 与 triggerTable） | TC-002、TC-003、TC-004、TC-005 | 4 |
| R3 | 黄金快照时序：记录提交号 / blob / SHA256 / hash-object；快照 = 该提交的 blob，用 `git show` 读 | TC-001、TC-016、TC-017、TC-033、TC-057 | 5 |
| R4 | 逐字节：黄金断言在前 + 整文件 `compareBuffers(渲染, 快照) === null`，无排除字段 API | TC-007、TC-014、TC-030、TC-031 | 4 |
| R5 | 无同步移除；转录只以 R3 快照为源，不留第二份转录源 | TC-020、TC-051 | 2 |
| R6 | 替换：`collectGate()` + 判别子 + 错误码优先级 + 写入前目标哈希复核（`TargetDrift`，基准 = evidence.`lastWrittenHash`）+ 幂等恢复；含 S2 旅程必经的错误路径 | TC-010、TC-011、TC-023、TC-024、TC-035、TC-036、TC-037、TC-038、TC-039、TC-040、TC-041、TC-043、TC-044、TC-056、TC-058、TC-059、TC-073、TC-074、TC-078 | 19 |
| R7 | 巩固 = PRD 6.3 六项（1 项 N/A 有豁免，1 项含人工抽查） | TC-013、TC-018、TC-047、TC-048、TC-049、TC-050、TC-072 | 7 |
| R8 | description 派生校验：逐字相等 + when 不含「在…中担任 / 时调用」/ 不以「时」结尾 | TC-003、TC-008、TC-015、TC-021、TC-022、TC-025、TC-026、TC-027、TC-028、TC-029、TC-052 | 11 |
| R9 | 已接管席逐字节比对：只对 `replaced` 席；无条目 = registered；`suspended` 豁免 | TC-009、TC-034、TC-045、TC-050、TC-055、TC-072 | 6 |
| R10 | 接管状态机：`state.json` 形状 / 值域 / version 与键集校验 / 唯一写点 / 非法值 `StateFileInvalid` | TC-053、TC-054、TC-055、TC-056、TC-059、TC-076 | 6 |
| R11 | 渲染来源与模板补全：模板全量结构（12 个 H2，5 个在输出格式块内，删除 `## 共享块`）+ 9 槽位 + 纯函数 `renderAgent` / CLI `renderByName` + 空块语义 + 共享块/输出格式载体 | TC-005、TC-006、TC-019、TC-032、TC-060、TC-061、TC-062、TC-063、TC-064、TC-065、TC-066、TC-077 | 12 |
| R12 | 对 S1 的语义修订（§11 十一条，重点第 3 条 generate 覆盖）+ 新错误码与档位（`TargetDrift` 1 / `StateFileInvalid` 2 / `GoldenSnapshotUnavailable` 2 / `EvidenceInvalid` 2 / `InvalidArgs` 2）+ EXIT 表登记 | TC-006、TC-075、TC-054、TC-057、TC-076 | 5 |
| W1-1 | W1 逐字节一致（整文件，替换前） | TC-007、TC-014、TC-030、TC-031 | 4 |
| W1-2 | W1 description 派生逐字相等 | TC-008、TC-015、TC-022 | 3 |
| W1-3 | W1 迁移前黄金断言（派生 == `git show` 快照 frontmatter） | TC-016、TC-028、TC-029、TC-033 | 4 |
| W1-4 | W1 黄金快照 = docgen 产物（快照 = 记录提交号的 blob，非替换后文件） | TC-017、TC-033 | 2 |
| W1-5 | W1 巩固（PRD 6.3 六项，缺一不可） | TC-013、TC-018、TC-047、TC-048 | 4 |
| §3.1 | agentData 条目形状（8 键，无触发表四字段） | TC-002、TC-004、TC-062 | 3 |
| §3.2 | triggerTable 条目（本席 when/route，notWhen/fallback 缺省） | TC-002、TC-003、TC-004 | 3 |
| §3.3 | description 派生串（DOMAIN + role + when + 「时调用」） | TC-003、TC-008、TC-022 | 3 |
| §3.4 | 渲染来源表 + 模板结构逐节顺序（12 个 H2，5 个在输出格式块内）+ 模板纯度 + 专属正文不进模板 + 空共享块语义 | TC-005、TC-019、TC-060、TC-063、TC-064、TC-065、TC-066、TC-067、TC-077 | 9 |
| §4 步1 | 入选：锁定基线四值 → 写 evidence 八字段；PRD §6.6 账本行只作人读镜像 | TC-001、TC-071 | 2 |
| §4 步2 | 数据迁移：分宿主写入 + 模板补全 + 新增三模块 + DOMAIN + `{{TOOLS}}` | TC-002、TC-003、TC-005、TC-060、TC-063、TC-064、TC-065 | 7 |
| §4 步3 | 生成：已拆槽席恒渲染并与当前目标比对（不受 registered 豁免，spec §11 第 3 条），0=一致 / 1=不等，不写盘不落草稿 | TC-006、TC-075 | 2 |
| §4 步4 | 逐字节比对：黄金断言 + 整文件比对；只改组件/模板，不改现产物 | TC-007、TC-030、TC-031、TC-033、TC-045、TC-049 | 6 |
| §4 步5 | 接守卫：baseline 含该席 + 登记「待接管」，**不做逐字节** | TC-009 | 1 |
| §4 步6 | 落草稿：进箱、`agents/*.md` 零改动、原子写 `wx`；未拆槽席拒绝 | TC-010、TC-044、TC-070 | 3 |
| §4 步7 | 替换：collectGate → 幂等恢复 → 目标哈希（`lastWrittenHash`）→ **先写 state=replaced 再 rename 目标** → 清草稿 → 清 tmp → 更新 `lastWrittenHash` | TC-011、TC-056、TC-069、TC-073、TC-074、TC-078 | 6 |
| §4 步8 | 验收：W1 断言 + `npm run check` + 后置干净；**替换后不重跑步 4** | TC-012、TC-046 | 2 |
| §4 步9 | 巩固：连续 2 次 gate 绿（含隔目录冷跑） | TC-013、TC-048、TC-068、TC-072 | 4 |
| §6-1 | 试点期禁止手改 `agents/reviewer-audit.md` | TC-034、TC-045 | 2 |
| §6-2 | description 是派生字段，无独立字段；硬编码 → `DescriptionDerivation` | TC-003、TC-052 | 2 |
| §6-3 | 快照 = git blob；不读工作区活文件；不在替换后读取 | TC-016、TC-017、TC-033、TC-057 | 4 |
| §6-4 | 转录只以 R3 快照为源，不留第二份转录源 | TC-020、TC-051 | 2 |
| §6-5 | 九步顺序不可跳 | TC-046 | 1 |
| §6-6 | `state.json` 唯一机器载体；只有 replace 写；`version`/值域/键集非法 → `StateFileInvalid`；写序先 state 后目标 | TC-053、TC-054、TC-059、TC-073、TC-074、TC-076 | 6 |
| §6-7 | 中断恢复：tmp 非 `.md` 后缀 + 启动清理 + draft `wx` + 目标 == 渲染时幂等恢复 + rename 前崩溃可重跑收敛 + 残留不得被判 `UnregisteredHandwritten` | TC-069、TC-070、TC-011、TC-074、TC-078 | 5 |
| §6-8 | 冷跑只跑 gate；复制清单 = git 跟踪文件 ∪ 本轮新增文件（含 state / 三新模块 / evidence fixture），不含 `.git`，不依赖 git 跟踪；草稿箱重定向到副本内；不跑黄金断言 | TC-048、TC-068、TC-072 | 3 |

**覆盖核对算式**：12（R1–R12）+ 5（W1-1～W1-5）+ 4（§3.1～§3.4）+ 9（§4 步1～步9）+ 8（§6-1～§6-8）= **38**；未覆盖（无任何用例指回的）= **0**。

## 2 用例明细

> 每条含五要素（覆盖 / 前置 / 步骤 / 预期 / 判据）+ 三辅助栏（红绿证据 / 测试落点 / 不覆盖）。
> 「判据」只允许引用**当前真实存在**的 API / 命令 / 错误码，或 spec 明确列为本轮新增的工作项（新增项显式标「本轮新增」）。

### TC-001 入选：锁定黄金快照四值并写入 evidence fixture（账本只作人读镜像）

- **覆盖**：§4 步1｜R3
- **类别**：正例
- **前置**：`agents/reviewer-audit.md` 处于迁移前状态；`tools/docgen/fixtures/reviewer-audit.evidence.json` 尚不存在；仓库在迁移起点（未改任何受检文件）
- **步骤**：① `git log -1 --format=%H -- agents/reviewer-audit.md` 取最后一次提交号；② `git rev-parse <commit>:agents/reviewer-audit.md` 取 blob 哈希；③ 算 SHA256（`createHash('sha256').update(targetBytes).digest('hex').toUpperCase()`，**统一大写十六进制**）；④ `git hash-object --no-filters agents/reviewer-audit.md`；⑤ 写 `tools/docgen/fixtures/reviewer-audit.evidence.json` 八个字段：`commit`/`blob`/`sha256`/`hashObject` 填上述四值，`goldenAssertion`/`compareResult`/`renderSha256` 填 `"pending"`（步 4 回填三项），`lastWrittenHash` = `sha256`（首次替换的 `TargetDrift` 基准）；⑥ PRD §6.6 账本行同步（人读镜像，不作机器判据）：六列存在、状态 = `迁移中`、双哈希列两值齐且分别等于 evidence 的 `hashObject` / `sha256`；**「巩固证据」列此时允许为空**（终态由 TC-071 断言）
- **预期**：fixture 八个字段齐（含 `renderSha256`）；`lastWrittenHash === sha256`；`goldenAssertion`/`compareResult`/`renderSha256 === "pending"`；两个 SHA256 均为大写；账本六列存在、状态 = `迁移中`、双哈希两值齐且与 evidence 相等；不要求「巩固证据」非空
- **判据**：机器 —— `JSON.parse(readFileSync(fixture))` 成功且键集合（排序后）= `['blob','commit','compareResult','goldenAssertion','hashObject','lastWrittenHash','renderSha256','sha256']`；`commit`/`blob` 匹配 `^[0-9a-f]{40}$`；`sha256`/`lastWrittenHash` 匹配 `^[0-9A-F]{64}$`（大写）且两者相等；`git hash-object --no-filters agents/reviewer-audit.md === blob`；`goldenAssertion === 'pending' && compareResult === 'pending' && renderSha256 === 'pending'`；账本行解析出 6 列、状态 = `迁移中`、双哈希列两项分别 `===` evidence 的 `hashObject` / `sha256`；「巩固证据」列不参与本用例断言
- **红绿证据**：红 = 四值任一为空 / `hash-object` 与 `rev-parse` 的 blob 不等（工作区已非提交态）/ SHA256 写成小写或混合大小写 / 未落 fixture 只写账本（步 7 的 `TargetDrift` 无输入）/ 状态不是 `迁移中`；绿 = 八字段齐、双路 blob 一致、双哈希大写且账本与 evidence 对齐
- **测试落点**：`tools/docgen/test/pilot-golden.test.mjs`（只读 fixture 与 git 输出做断言；fixture 由试点执行者在步 1 落盘）
- **不覆盖**：哈希算法本身（git / 系统保证）；账本「巩固证据」列（终态由 TC-071 断言）；账本的手写维护质量（TC-071 只查字段与状态）

### TC-002 数据迁移：按宿主分开写入并逐字核对

- **覆盖**：§4 步2｜R1｜R2｜§3.1｜§3.2
- **类别**：正例
- **前置**：S1 已落地（`agentData.mjs` / `triggerTable` / `validateAgentData` 就位，gen-agents 已退役）；快照可按 TC-001 的提交号读取
- **步骤**：① 读快照：frontmatter（name / description / tools）、标题（role / dimension）、「你是谁」（identity）、「固定必问清单」（7 条）、`### 审计铁律`（3 条）与「输出格式」双节；② 按宿主写入：8 个键进 `agentData` 条目，`when`/`route` 进 `triggerTable`；③ 跑 `node --test tools/docgen/test/data.test.mjs`
- **预期**：`agentData` 条目八键齐（name / role / dimension / tools / identity / fixedList / sharedBlock / outputKind）且与快照逐字相等；`triggerTable['reviewer-audit']` 只有 `when`/`route`；条目内无 `when`/`route`/`notWhen`/`fallback`
- **判据**：机器 —— 条目八键逐字 `===`；`Object.keys(triggerTable['reviewer-audit']).sort()` 深度等于 `['route','when']`；`data.test.mjs` 既有断言（`a.when/route/notWhen/fallback === undefined`，行 20-26）退出码 0
- **红绿证据**：红 = 转录错字（如 fixedList 第 4 条写成「卡片数 = 已修复」）或把 when 混进 agentData → 断言 fail；绿 = 八键逐字相等且宿主分离
- **测试落点**：`tools/docgen/test/pilot-data.test.mjs`（复用 `data.test.mjs` 的宿主断言）
- **不覆盖**：description 拆槽（TC-003）；模板层（TC-005）

### TC-003 description 拆槽：三槽位 + 宿主分离 + DOMAIN 常量

- **覆盖**：§4 步2｜R2｜R8｜§3.2｜§3.3｜§6-2
- **类别**：正例
- **前置**：TC-002 的宿主写入完成；本轮新增 `patternRegistry.DOMAIN`
- **步骤**：① 断言条目无独立 `description` 键；② 断言 `role === '审计专员'`、`when` 为触发子句（不含末尾「时」）、`patternRegistry.DOMAIN === '议会评审'`；③ 调 `patternRegistry.description.parliament(role, when)` 取拼装串
- **预期**：拼装串逐字等于 `在议会评审中担任审计专员。当议会评审需要过程标准核对、轮际对账或交付审计时调用`；`when` 逐字等于 `当议会评审需要过程标准核对、轮际对账或交付审计`（无末尾「时」）
- **判据**：机器 —— `agentData` 数组内该条目的 `description === undefined`（**逐条目断言，不是 `'description' in agentData`**）；三个 `===` 全真；`DOMAIN` 被 `parliament` 消费（用非常量 domain 调一次，断言输出随参数变化——本轮新增签名 `parliament(role, when, domain = DOMAIN)`）
- **红绿证据**：红 = when 多提取「时」→ 拼出「时时调用」；DOMAIN 只导出不消费 → 传参不改变输出；绿 = 三槽位正确且常量真被消费
- **测试落点**：`tools/docgen/test/pilot-data.test.mjs`
- **不覆盖**：when 格式拦截路径（TC-025～TC-027）；与快照的黄金比对（TC-016）

### TC-004 数据形状逐字段核对（含 tools 数组）

- **覆盖**：§3.1｜§3.2｜R2｜R1
- **类别**：正例
- **前置**：TC-002 完成
- **步骤**：① 逐字段断言条目：`name`/`role`/`dimension`/`tools`/`identity`/`fixedList`/`sharedBlock`/`outputKind`；② 断言 `notWhen`/`fallback` 缺省（`undefined`）；③ 断言 `fixedList.length === 7` 且逐条逐字
- **预期**：`dimension === '独立（标准核对）'`；`tools` 深等于 `['Read','Glob','Grep']`；`identity === '资深审计专员，只审各项标准是否达到，不裁技术对错，不提新技术问题。'`；`sharedBlock === 'AUDIT_RULES'`；`outputKind === 'audit'`
- **判据**：机器 —— `assert.deepEqual` / `assert.equal` 全通过，`node --test` 退出码 0；`fixedList` 逐条 `===`（含「卡片数 = 已修 + 关闭 + 候选 + 升级 + 带往下轮」）
- **红绿证据**：红 = 任一键值差异（含全角括号、结尾句号）→ fail；绿 = 全等
- **测试落点**：`tools/docgen/test/pilot-data.test.mjs`
- **不覆盖**：字段语义正确性（人工抽查，见 §5）

### TC-005 模板补全：全量结构（12 个 H2，其中 5 个在输出格式块内）+ 逐节顺序 + 九槽位

- **覆盖**：§4 步2｜R2｜R11｜§3.4
- **类别**：正例
- **前置**：`agent.md.tpl` 为 S1 骨架版（缺共享特质 / 自由探索 / 通用纪律 / `{{TOOLS}}`，且带 `## 共享块` 包装标题）
- **调用层**：CLI 薄封装 `renderByName('reviewer-audit')`（读模板 + 映射后调纯函数），见 R11 第 ② 层
- **步骤**：① 补全模板为 §3.4 全量结构并**删除 `## 共享块` 包装标题**；② 用 `renderByName('reviewer-audit')` 渲染；③ 用 evidence 的 `commit` 取 `git show <commit>:agents/reviewer-audit.md`，做 `compareBuffers(render, snapshotBytes)`
- **预期**：`compareBuffers === null`（整文件逐字节相等，含 frontmatter 与尾换行）；节顺序为：frontmatter → `# 角色：{role}（{dimension}）` → `## 你是谁` → `## 共享特质（…）` → `## 固定必问清单（…）` → `## 自由探索（…）` → `## 输出格式`（块内含 `## 核对项` → `## 结论` → `## A 节 过程闭环` → `## B 节 按 doc-taxonomy 完成判据逐交付物核对` → `## 结论` 共 5 个 H2）→ `## 通用纪律` → 可选 `### 审计铁律` → `## 边界`；全文恰 **12 个 H2**（7 个顶层节 + 输出格式块内 5 个）
- **判据**：机器 —— `compareBuffers(...) === null`；模板中九个占位符 `{{NAME}}`/`{{DESCRIPTION}}`/`{{TOOLS}}`/`{{ZH_NAME}}`/`{{DIMENSION}}`/`{{IDENTITY}}`/`{{FIXED_LIST}}`/`{{OUTPUT_FORMAT}}`/`{{SHARED_BLOCK}}` 各出现恰 1 次；模板不含 `## 共享块`；渲染产物按行扫描 `/^## /` 计数 = 12；7 个顶层节按上式顺序出现（顺序扫描，不依赖 `indexOf` 处理重复的 `## 结论`）；`## 输出格式` 与 `## 通用纪律` 之间恰含 5 个 H2
- **红绿证据**：红 = 缺节 / 节序错 / 少一个空行 / 遗留 `## 共享块` → `compareBuffers` 返回 `{code:'Mismatch', line, byte}` 或 H2 计数 ≠ 12；绿 = 返回 `null` 且 12/5 计数成立
- **测试落点**：`tools/docgen/test/pilot-render.test.mjs`
- **不覆盖**：模板纯度（TC-061）；数据驱动（TC-062）；无共享块席的空行语义（TC-077）；其它席复用（S4）

### TC-006 生成：已拆槽席恒渲染并与目标比对（不受 registered 豁免），不写盘不落草稿

- **覆盖**：§4 步3｜R11｜R12（spec §11 第 3 条）
- **类别**：正例
- **前置**：TC-002/003/005 完成；`state.json` 无 `reviewer-audit` 条目（= registered，步 3 的时点本应如此）；草稿箱重定向到临时目录（`DOCGEN_DRAFTS_DIR`）
- **调用层**：`generate` 子命令内部走 `renderByName(name)`（CLI 层）
- **步骤**：① `node tools/docgen/cli.mjs generate --kind agent --name reviewer-audit`；② 检查 `git status --short agents/`；③ `draft ls --name reviewer-audit`；④ 在仓库副本里把目标改 1 字节后重跑同命令；⑤ 丢弃副本
- **预期**：①退出码 0（渲染 == 目标）；②`agents/` 零改动；③草稿箱零新增；④副本内退出码 1（证明命令**真的渲染并比对**，不是只查存在）；**即使 state 无条目（registered），已拆槽席也照样渲染 + 比对**——这是 spec §11 第 3 条对 S1 R3 的覆盖：registered 豁免只适用于 `gate`/`check-agents` 的日常守卫，不适用于 `generate` 生成入口
- **判据**：机器 —— 正常态退出码 0；副本态退出码 1；`git status --short agents/` 无输出；`draft ls` 无输出；进入 ④ 前断言 `state.json` 不存在或 `agents['reviewer-audit'] === undefined`（确认确实处在 registered 态，排除「已 replaced 才比对」的误解）
- **红绿证据**：红 = 沿用 S1 R3 的 registered 豁免（两态都退出 0，说明 `generate` 未渲染）→ 本用例第 ④ 步必红；绿 = 0/1 两态可区分且 registered 态已确认
- **测试落点**：`tools/docgen/test/pilot-render.test.mjs`（步骤 ④ 只在副本内改文件，`finally` 删除副本）
- **不覆盖**：`gate`/`check-agents` 对 registered 的豁免（TC-009）；registered 但已拆槽席的负例细节（TC-075）

### TC-007 逐字节：黄金断言在前 + 整文件比对（替换前）

- **覆盖**：§4 步4｜R4｜W1-1
- **类别**：正例
- **前置**：`tools/docgen/fixtures/reviewer-audit.evidence.json` 的 `commit` 已记录（TC-001）；**尚未执行 replace**
- **步骤**：① 读 evidence 的 `commit`，从 `git show <commit>:agents/reviewer-audit.md` 取快照字节；② 取渲染 frontmatter 的 description 与快照 description 逐字比；③ 相等后再做 `compareBuffers(renderBytes, snapshotBytes)`；④ 两步结果回填 evidence 的 `goldenAssertion` / `compareResult`，并写 `renderSha256 = sha256(渲染字节)`（大写）
- **预期**：②逐字相等；③返回 `null`（整文件含 frontmatter 与尾换行）；④`goldenAssertion` 为通过结果、`compareResult === null`（可序列化为 `null` 或 `"pass"`，字段语义以 spec R4 为准）、`renderSha256` 为大写 64 位十六进制且等于渲染字节 SHA256
- **判据**：机器 —— `derivedDescription === snapshotDescription`；`compareBuffers(renderBytes, snapshotBytes) === null`（函数签名两参数，相等返 `null`，见 `compare.mjs:15-24`）；fixture 的 `goldenAssertion` 非 `"pending"` 且表示通过、`compareResult` 表示 `null`、`renderSha256 === sha256(渲染字节)`
- **红绿证据**：红 = 任一不等 → 断言 fail 并打印首个差异的 `line`/`byte`；绿 = 先验相等且整比 `null`
- **测试落点**：`tools/docgen/test/pilot-render.test.mjs`
- **不覆盖**：description 的内部错字（由 TC-016 黄金断言拦）；替换后的比对（**禁止**，见 TC-012）

### TC-008 description 逐字断言（独立锚点）

- **覆盖**：§4 步4｜R8｜W1-2｜§3.3
- **类别**：正例
- **前置**：无（`parliament` 是纯函数）
- **步骤**：① 取渲染结果 frontmatter 的 description 值；② 与固定期望串逐字比较
- **预期**：等于 `在议会评审中担任审计专员。当议会评审需要过程标准核对、轮际对账或交付审计时调用`（全角标点、句号、无尾随空格）
- **判据**：机器 —— `===` 为真；另断言 `/时时/` 不匹配
- **红绿证据**：红 = 派生引入错字 / 多余空格 / 漏标点；绿 = 逐字相等且无「时时」
- **测试落点**：`tools/docgen/test/pilot-render.test.mjs`
- **不覆盖**：与快照的比对（TC-016）；when 格式（TC-021/025～027）

### TC-009 接守卫（步 5）：baseline 含该席 + 登记待接管 + **不做逐字节**（副本 + 确定性构造）

- **覆盖**：§4 步5｜R9
- **类别**：正例
- **前置**：**仓库副本**（复制 §6-8 交付清单；测试结束 `finally` 删除）；副本内**删除 `state.json` 或确保无 `reviewer-audit` 条目**（构造 registered，不依赖「替换尚未发生」的时序态）
- **步骤**：① 断言 `agentPaths()` 含 `agents/reviewer-audit.md`；② 断言副本 `state.json` 不存在或 `agents['reviewer-audit'] === undefined`（= registered）；③ 在副本内手改 `agents/reviewer-audit.md` 1 字节；④ 在副本内跑 `gate` 与 `check-agents`；⑤ `finally` 丢弃副本
- **预期**：baseline 含该席；state 无条目；手改**不**触发 `Mismatch`（registered 只做存在性检查），`gate` 退出码 0
- **判据**：机器 —— `agentPaths().includes('agents/reviewer-audit.md')` 为真；`JSON.parse(...).agents['reviewer-audit'] === undefined`（缺省即 registered）；副本内手改后 `gate` 退出码 0 且输出不含 `Mismatch`；**真实仓库的 `agents/reviewer-audit.md` 字节在用例前后相等**（副本隔离证据）
- **红绿证据**：红 = 替换前就对该席做逐字节（步 5 与步 8 时序混淆）→ 手改即红、本用例失败；绿 = 手改不报且真实仓库零改动
- **测试落点**：`tools/docgen/test/pilot-state.test.mjs`（副本内断言；`finally` 删除副本，真实仓库只读）
- **不覆盖**：替换后的逐字节激活（TC-034）；`suspended` 豁免（TC-055）

### TC-010 落草稿：进箱、`agents/` 零改动、原子写

- **覆盖**：§4 步6｜R6
- **类别**：正例
- **前置**：TC-005/006/007 通过；草稿箱重定向到临时目录（`DOCGEN_DRAFTS_DIR`，测试结束 `finally` 删除）；该名下无旧草稿
- **步骤**：① 记录替换前 `agents/reviewer-audit.md` 的字节与哈希；② `node tools/docgen/cli.mjs draft --kind agent --name reviewer-audit`；③ `draft ls --name reviewer-audit`；④ 读草稿字节
- **预期**：草稿文件名匹配 `^reviewer-audit--\d{8}-\d{6}\.md$`；草稿字节与内存渲染字节相等；`agents/` 字节不变
- **判据**：机器 —— `draft ls` 恰 1 条且命名匹配；草稿字节 `equals` 渲染字节；第二步前后目标文件哈希相等；真实仓库 `agents/` 无临时文件
- **红绿证据**：红 = draft 碰了 `agents/` / 草稿字节非渲染字节；绿 = 草稿入箱且目标零改动
- **测试落点**：`tools/docgen/test/pilot-replace.test.mjs`（临时草稿箱；不执行 replace，不写真实 `agents/`）
- **不覆盖**：旧稿冲突（TC-037）；未拆槽席拒绝（TC-044）；并发撞名（TC-070）

### TC-011 替换：判别子放行 → 目标哈希复核 → 先写 state=replaced → rename 目标 → 清草稿 → 更新 lastWrittenHash

- **覆盖**：§4 步7｜R6｜R10
- **类别**：正例
- **前置**：**仓库副本**（按 §6-8 交付清单复制，含 `state.json`、三新模块、evidence fixture；测试结束 `finally` 丢弃）；副本草稿箱内草稿 == 渲染；`evidence.lastWrittenHash` == 目标 SHA256（首次替换时它等于迁移快照 SHA256）；用户已确认（`--yes`）
- **步骤**：① **先保存草稿字节副本**（replace 成功会清草稿）；② 在副本内 `node tools/docgen/cli.mjs replace --kind agent --name reviewer-audit --draft <草稿> --yes`；③ 读目标字节、`state.json` 与 evidence；④ `draft ls`；⑤ 查 `.tmp-*` 残留；⑥ `finally` 丢弃副本
- **预期**：退出码 0；目标字节 == ①保存的草稿字节；`state.json` = `{"version":1,"agents":{"reviewer-audit":"replaced"}}`；该名草稿为空；无 `.tmp-*` 残留；evidence.`lastWrittenHash` == 草稿字节的 SHA256（为下一次稳态替换准备基准）
- **判据**：机器 —— 退出码 0；目标 `Buffer.equals(保存的草稿字节)`；`state.json` 深等于上式；`draft ls` 无输出；`readdirSync('agents')` 无 `.tmp-` 前缀文件；evidence.`lastWrittenHash === createHash('sha256').update(草稿字节).digest('hex').toUpperCase()`；写序静态断言：`cmdReplace` 内 state 持久化语句位于 `renameSync(tmp, target)` **之前**（spec §4 步 7 明定「先写 state，再 rename 目标」）；真实仓库零改动
- **红绿证据**：红 = rename 先于 state（崩溃后 state 无条目、目标已变，gate 无法重建比对）/ 目标字节 ≠ 草稿 / 草稿残留 / `lastWrittenHash` 未更新（第二次替换必被 TargetDrift 误拒）；绿 = 六项全过
- **测试落点**：`tools/docgen/acceptance/pilot-replace.acceptance.mjs`（副本内执行；真实仓库只读）
- **不覆盖**：缺 `--yes`（TC-038）、`DraftDrift`（TC-039）、判别子拒绝路径（TC-035/036）、`TargetDrift`（TC-056）、二次替换基准（TC-073）

### TC-012 验收（步 8）：W1 断言读 evidence + `npm run check`（外层执行）+ 后置干净，且**不重跑步 4**

- **覆盖**：§4 步8｜R4｜W1-1
- **类别**：正例
- **前置**：TC-011 替换完成；`tools/docgen/fixtures/reviewer-audit.evidence.json` 的 `goldenAssertion` / `compareResult` / `renderSha256` 已由步 4 回填（不是 `"pending"`）
- **步骤**：① 读 evidence 的 `goldenAssertion`、`compareResult` 与 `renderSha256`（**不重新对活文件比对**）；② 由验收人显式执行 `npm run check` 并保存完整输出（外层执行；**不得由 `*.test.mjs` spawn**）；③ `git status --short rules/ skills/ agents/`；④ `node tools/docgen/cli.mjs gate`
- **预期**：①`goldenAssertion` 为通过、`compareResult` 为 `null`、`renderSha256` 等于替换后目标 SHA256；②全绿（0 findings）；③无输出（替换字节 == 原字节，git 判定无改动）；④退出码 0
- **判据**：机器 —— evidence 三字段齐且表示通过；`npm run check` 退出码 0（输出文件由验收人保存，作为巩固第 2 项证据）；`git status --short rules/ skills/ agents/` 无输出；`gate` 退出码 0
- **红绿证据**：红 = 替换后又拿活文件重跑比对（自证循环）→ ①判负；evidence 仍为 `"pending"` → 步 4 被跳过；绿 = 用保存输出 + gate 重建比对
- **测试落点**：`tools/docgen/acceptance/pilot-consolidation.acceptance.mjs`（验收脚本只读 evidence / 跑 git status / gate；`npm run check` 由人外层执行一次，**不在任何 `*.test.mjs` 内 spawn**）
- **不覆盖**：巩固的二次 gate 与冷跑（TC-013/048）

### TC-013 巩固：PRD 6.3 六项逐项达标

- **覆盖**：§4 步9｜R7｜W1-5
- **类别**：正例
- **前置**：TC-012 通过
- **步骤**：① 第 1 次 `gate`；② 按 §6-8 交付清单做隔目录冷跑（副本含 `state.json` / 三新模块 / evidence fixture，不含 `.git`）并第 2 次 `gate`；③ 由验收人外层执行 `npm run check` 并保存完整输出（**不在 `*.test.mjs` 内 spawn**）；④ `git status --short rules/ skills/ agents/`；⑤ 核对第 4 项 N/A 的豁免依据；⑥ 人工抽查 1 处关键格（fixedList 第 4 条）；⑦ `draft ls --name reviewer-audit`
- **预期**：六项全过——① ①②两次 gate 均绿（`state = replaced`）；② `check` 0 findings；③ git status 干净；④ 第 4 项按 S1 W8 判 **N/A**（gen-agents 已整体退役，无「该席停止输出」动作）；⑤ 内容 = 渲染字节（机器）+ 人工抽查 1 处一致；⑥ 该名草稿为空
- **判据**：机器 —— 两次 `gate` 退出码 0；`npm run check` 退出码 0（外层输出文件留存）；`git status --short rules/ skills/ agents/` 无输出；`draft ls` 无输出；第 5 项机器部分由 `compareBuffers === null` 承担，人工部分由 §5 记录（抽查格 = fixedList 第 4 条，写进账本「巩固证据」列）
- **红绿证据**：红 = 任一项不达标即判「未巩固」；绿 = 六项齐
- **测试落点**：`tools/docgen/acceptance/pilot-consolidation.acceptance.mjs`（冷跑副本与 gate 由验收脚本执行；`npm run check` 由人外层执行一次）
- **不覆盖**：停损（TC-049）、回退（TC-050）、冷跑隔离细节（TC-068/072）

### TC-014 W1 逐字节一致（独立验收锚点）

- **覆盖**：W1-1｜R4
- **类别**：正例
- **前置**：**替换前**执行（替换后不再比对，见 TC-012）；evidence fixture 的 `commit` 可用
- **调用层**：CLI 薄封装 `renderByName('reviewer-audit')`（R11 第 ② 层）
- **步骤**：① 从 evidence 的 `commit` 取 `git show <commit>:agents/reviewer-audit.md` 快照字节；② `renderByName('reviewer-audit')` 取渲染字节；③ `compareBuffers(渲染, 快照)`
- **预期**：返回 `null`
- **判据**：机器 —— `=== null`；红时输出 `{line, byte}`
- **红绿证据**：红 = 不等；绿 = `null`
- **测试落点**：`tools/docgen/test/pilot-render.test.mjs`
- **不覆盖**：description 断言（TC-015）；时序错（TC-033）

### TC-015 W1 description 派生（独立验收锚点）

- **覆盖**：W1-2｜R8
- **类别**：正例
- **前置**：无
- **步骤**：① 取派生 description；② 与固定期望串逐字比
- **预期**：逐字相等
- **判据**：机器 —— `===` 为真
- **红绿证据**：红 = 派生错字；绿 = 相等
- **测试落点**：`tools/docgen/test/pilot-render.test.mjs`
- **不覆盖**：硬编码绕过（TC-052）

### TC-016 W1 迁移前黄金断言：基准 = `git show` 的 blob

- **覆盖**：W1-3｜R3｜§6-3
- **类别**：正例
- **前置**：**必须早于 replace**；快照提交号来自 evidence fixture 的 `commit` 字段（TC-001）
- **步骤**：① 读 evidence.`commit`；② 执行 `node tools/docgen/acceptance/golden-assert.mjs --evidence tools/docgen/fixtures/reviewer-audit.evidence.json`（该脚本 `git show <commit>:agents/reviewer-audit.md` 读快照、解析 frontmatter `description`、与派生 description 逐字比较）；③ 记录退出码与 diff 输出
- **预期**：逐字相等，退出码 0；断言通过后才允许进入步 6/7
- **判据**：机器 —— `acceptance/golden-assert.mjs` 退出码 0（退出码语义：0 通过 / 1 description 不等并打印两串 diff / 2 前置不可用，见 TC-057）；该脚本读取快照**只调用 `git show`**（源码静态断言：不含 `readFileSync(join(repo,'agents/reviewer-audit.md'))` 形式的活文件读取）；提交号取自 `tools/docgen/fixtures/reviewer-audit.evidence.json`（命令行只传 evidence 路径），不是硬编码或运行中重取
- **红绿证据**：红 = 拆槽错字（退出码 1）/ 脚本改读工作区文件（源码扫描命中）；绿 = 退出码 0 且来源为 git blob
- **测试落点**：`tools/docgen/test/pilot-golden.test.mjs`（以子进程执行 `acceptance/golden-assert.mjs` 并断言退出码；该脚本不触发整仓检查，无递归）
- **不覆盖**：替换后时序错的证伪（TC-033）；git 不可用（TC-057）

### TC-017 W1 黄金快照 = docgen 产物（快照是记录提交号的 blob）

- **覆盖**：W1-4｜R3｜§6-3
- **类别**：正例
- **前置**：TC-016 通过；未执行 replace
- **步骤**：① 断言快照来源为 evidence.`commit` 对应的 `git show <commit>:<path>`（`acceptance/golden-assert.mjs` 内唯一读取路径）；② 渲染字节与快照字节整比；③ 断言 `acceptance/golden-assert.mjs` 未读取工作区活文件
- **预期**：渲染 == 快照 blob 逐字节；快照不以「替换后的 `agents/reviewer-audit.md`」为基准
- **判据**：机器 —— `compareBuffers(render, gitBlobBytes) === null`；源码扫描 `tools/docgen/acceptance/golden-assert.mjs`：快照读取调用只出现 `git show` 一种（`readFileSync` 的路径不指向 `agents/`）；提交号来源 = evidence fixture（非工作区重取）
- **红绿证据**：红 = 基准取自活文件（替换后恒等）；绿 = 基准取自 blob 且整比 `null`
- **测试落点**：`tools/docgen/test/pilot-golden.test.mjs`
- **不覆盖**：commit 不可用（TC-057）；冷跑（不跑黄金断言，TC-068）

### TC-018 巩固六项证据包映射（第 4 项 N/A + 第 5 项人工抽查落点）

- **覆盖**：R7｜W1-5
- **类别**：边界
- **前置**：TC-013 已执行
- **步骤**：① 核对账本「巩固证据」列是否逐项列出六项证据；② 核对第 4 项是否写明「N/A（gen-agents 已随 S1 W8 退役）」+ 豁免依据；③ 核对第 5 项是否写明人工抽查的具体格（fixedList 第 4 条）与核对结论
- **预期**：六项在证据列各有独立条目，无合并、无缺项；第 4 项带豁免依据；第 5 项带抽查格与结论
- **判据**：机器（部分）+ 人工 —— 账本行文本含 6 个可检索标记（`gate×2`、`check`、`git status`、`N/A`+`S1 W8`、`人工抽查`+`fixedList 第 4 条`、`草稿已清`）；标记数 = 6；人工核对结论由评审确认
- **红绿证据**：红 = 六项被写成 5 项 / 漏人工抽查 / 第 4 项未写豁免依据；绿 = 六标记齐
- **测试落点**：`tools/docgen/acceptance/pilot-consolidation.acceptance.mjs`（读账本与 evidence 断言；不执行 replace / 不 spawn `npm run check`）
- **不覆盖**：各机器项的执行本身（TC-013）；账本其它行（S3/S4）

### TC-019 共享块 + 输出格式双载体：`AUDIT_RULES` 与 audit 双节都真渲染

- **覆盖**：R1｜R11｜§3.4｜§4 步2
- **类别**：正例
- **前置**：本轮新增 `sharedBlocks.mjs` / `outputFormats.mjs`；模板已删除 `## 共享块` 包装标题
- **调用层**：CLI 薄封装 `renderByName('reviewer-audit')`
- **步骤**：① 断言 `sharedBlocks.AUDIT_RULES` 存在且 `sharedBlock: 'AUDIT_RULES'` 可解析；② 断言 `outputFormats.audit` 存在且块内含 5 个 H2；③ 渲染后检查两区块锚点与模板结构
- **预期**：产物含 `### 审计铁律` 与其 3 条正文（逐字），且该块**直接嵌在模板流中**（没有 `## 共享块` 包装标题）；输出格式块内含 5 个 H2：`## 核对项` 1 次、`## 结论` 2 次（轮间核对单与交付审计表各一）、`## A 节 过程闭环` 1 次、`## B 节 按 doc-taxonomy 完成判据逐交付物核对` 1 次；`{{SHARED_BLOCK}}`/`{{OUTPUT_FORMAT}}` 均被真实内容替换（产物不含 `{{`）
- **判据**：机器 —— `sharedBlocks.AUDIT_RULES` 分为 3 条 bullet 且逐字；`outputFormats.audit` 的 H2 计数 = 5（核对项 1 + 结论 2 + A 节 1 + B 节 1）；渲染产物 `!/{{/.test(render)` 且 `!/## 共享块/`；`validateAgentData` 的 `SharedBlockMissing`（断言 5）在 `sharedBlock` 改为非法值时触发（反向自检一次）；全文 H2 计数 = 12
- **红绿证据**：红 = 槽位被置空（现状 `cli.mjs:225-226` 就是空串）→ 产物缺块、整比红；绿 = 两区块齐且逐字
- **测试落点**：`tools/docgen/test/pilot-render.test.mjs`
- **不覆盖**：其它 sharedBlock/outputKind 组合（S4）

### TC-020 转录源唯一：无 gen-agents / ROLES 残留

- **覆盖**：R5｜§6-4
- **类别**：正例
- **前置**：S1 W8 已完成退役
- **步骤**：① 用 Node 列出 git 跟踪文件并计数含 `gen-agents` 的路径；② 统计 `tools/docgen/components/*.mjs` 中源码含 `ROLES` 的文件数；③ evidence fixture 的 `commit` 字段与账本镜像均注明转录源 = 快照 blob
- **预期**：两处匹配数均为 0；`evidence.commit` 匹配 40 位十六进制；账本转录源栏指向 `git show <commit>:agents/reviewer-audit.md`
- **判据**：机器（Node 可执行）—— `const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean)`；`files.filter((f) => f.includes('gen-agents')).length === 0`；`files.filter((f) => f.startsWith('tools/docgen/components/') && f.endsWith('.mjs')).filter((f) => readFileSync(f, 'utf8').includes('ROLES')).length === 0`；`evidence.commit` 匹配 `^[0-9a-f]{40}$` 且账本行含 `git show`；**不用 PowerShell 文本匹配命令**（无匹配时的退出码不可靠）
- **红绿证据**：红 = 残留 gen-agents/ROLES（第二份源）；绿 = 零匹配
- **测试落点**：`tools/docgen/test/pilot-gate.test.mjs`
- **不覆盖**：以硬编码常量形态复活的第二份源（TC-051）

### TC-021 when 格式正例：不含「在…中担任 / 时调用」、不以「时」结尾

- **覆盖**：R8
- **类别**：正例
- **前置**：`validateAgentData` 可运行
- **步骤**：① 对整表跑 `validateAgentData(agentData, triggerTable)`；② 单独断言本席 when
- **预期**：无抛出；when 不匹配 `/在[^。]*中担任|时调用/` 且 `!when.endsWith('时')`
- **判据**：机器 —— `validateAgentData` 不抛；两条正则断言为真
- **红绿证据**：红 = when 含非法字样；绿 = 通过
- **测试落点**：`tools/docgen/test/pilot-data.test.mjs`
- **不覆盖**：非法数据的拦截（TC-025～027）

### TC-022 description 派生正例：等于句式拼装且无「时时」

- **覆盖**：R8｜§3.3
- **类别**：正例
- **前置**：TC-003 完成
- **步骤**：① 取派生 description；② 与 `在{domain}中担任{role}。{when}时调用` 拼装结果比；③ 断言不含「时时」
- **预期**：逐字相等；无「时时」
- **判据**：机器 —— `===` 为真；`!/时时/.test(description)`
- **红绿证据**：红 = 拼装错 / 出现「时时」；绿 = 通过
- **测试落点**：`tools/docgen/test/pilot-data.test.mjs`
- **不覆盖**：硬编码（TC-052）

### TC-023 判别子：已接管席的稳态修改（目标自身差异放行）

- **覆盖**：R6
- **类别**：正例
- **前置**：**仓库副本**（`state = replaced`，目标 == 组件渲染；`finally` 丢弃）；PRD 6.5 稳态旅程
- **步骤**：① 合法改 `triggerTable['reviewer-audit'].when`（追加一段合法触发条件，仍满足格式约束）；② `gate` 观察（应红在目标）；③ `draft`；④ `replace --yes`；⑤ 再 `gate`
- **预期**：②红仅在 `agents/reviewer-audit.md`；④退出码 0；⑤退出码 0（收敛）
- **判据**：机器 —— ②`gate` 退出码 1 且消息含 `reviewer-audit`；④退出码 0 且目标字节 == 新渲染；⑤退出码 0；真实仓库零改动
- **红绿证据**：红 = 目标自身差异也被拒 → 稳态修改无法落盘；绿 = 放行并收敛
- **测试落点**：`tools/docgen/acceptance/pilot-replace.acceptance.mjs`（副本内执行；`finally` 丢弃）
- **不覆盖**：无草稿的非目标漂移（TC-035）；同源多目标（TC-024）

### TC-024 判别子：同源多目标（已有草稿且草稿 == 渲染）放行

- **覆盖**：R6
- **类别**：边界
- **前置**：仓库副本（`finally` 丢弃）；副本内 `state.json` 置 `{"version":1,"agents":{"reviewer-audit":"replaced","reviewer-product":"replaced"}}`，并把 `agents/reviewer-audit.md`、`agents/reviewer-product.md` 分别写成其组件渲染字节（构造「两席都已接管且均绿」的起点）；**两份 evidence 均在**：A 用 `fixtures/reviewer-audit.evidence.json`（TC-001 已建），B 用本轮新建的 `fixtures/reviewer-product.evidence.json`，其 `lastWrittenHash` = **B 当前目标 SHA256（大写）**，其余字段（`commit`/`blob`/`sha256`/`hashObject`）按同一口径记录、`renderSha256` 与两个结果字段为 `"pending"` 或步 4 值
- **步骤**：① 改共享常量 `DOMAIN`（影响两席 description）→ `gate` 应红在 A（`reviewer-audit`）、B（`reviewer-product`）两席；② **先为 A 落草稿**（`draft --kind agent --name reviewer-audit`），断言 A 草稿字节 == A 新渲染；③ **再为 B 落草稿**（`draft --kind agent --name reviewer-product`），断言 B 草稿字节 == B 新渲染；④ `replace A --yes`；⑤ `replace B --yes`；⑥ `gate`
- **预期**：④放行（B 的漂移满足第二集合「有草稿且草稿 == 其渲染」）；⑤放行；⑥退出码 0；A、B 两席草稿在各自 replace 后清空
- **判据**：机器 —— ①`gate` 退出码 1 且消息同时含两席名；②A 草稿字节 `equals` A 渲染字节；③B 草稿字节 `equals` B 渲染字节；④⑤退出码 0；⑥退出码 0；`draft ls --name reviewer-audit` 与 `--name reviewer-product` 均为空；replace 前两份 evidence 的 `lastWrittenHash` 分别 `===` 各自目标当前 SHA256（否则 `TargetDrift` 会误拒 B）
- **红绿证据**：红 = 第二集合未实现（同源多目标被一律拒）→ ④失败；B 缺 evidence 或 `lastWrittenHash` 不是 B 目标哈希 → ⑤报 `TargetDrift`/`EvidenceInvalid`；只给 A 落草稿 → ④失败；绿 = 两草稿各自 == 渲染且逐目标收敛后 gate 绿
- **测试落点**：`tools/docgen/acceptance/pilot-replace.acceptance.mjs`（副本 + state 桩 + 两份 evidence；不改真实仓库）
- **不覆盖**：真实 S4 的 12 席收敛（S4）；并发

### TC-025 when 多提取「时调用」→ `WhenFormatViolation`（exit 1）

- **覆盖**：R8
- **类别**：负例
- **前置**：构造 `when = '当议会评审需要过程标准核对、轮际对账或交付审计时调用'`
- **步骤**：① 注入该 when；② 跑 `validateAgentData(agentData, triggerTable)`
- **预期**：抛 `WhenFormatViolation`；CLI 侧退出码 1
- **判据**：机器 —— `err.code === 'WhenFormatViolation'`；`exitCodeFor('WhenFormatViolation') === 1`
- **红绿证据**：红 = 未拦 → 拼出「…时调用时调用」；绿 = 拦截
- **测试落点**：`tools/docgen/test/pilot-data.test.mjs`
- **不覆盖**：错误消息文案观感

### TC-026 when 把「在议会评审中担任…」当 when → `WhenFormatViolation`

- **覆盖**：R8
- **类别**：负例
- **前置**：构造 `when = '在议会评审中担任审计专员。当议会评审需要过程标准核对、轮际对账或交付审计时'`
- **步骤**：① 注入；② 跑 `validateAgentData`
- **预期**：抛 `WhenFormatViolation`（命中「在…中担任」）
- **判据**：机器 —— `err.code === 'WhenFormatViolation'`
- **红绿证据**：红 = 未拦 → 派生串出现双前缀；绿 = 拦截
- **测试落点**：`tools/docgen/test/pilot-data.test.mjs`
- **不覆盖**：整句被误当 when 时的黄金断言兜底（TC-028）

### TC-027 when 以「时」结尾 → `WhenFormatViolation`（防「时时」）

- **覆盖**：R8
- **类别**：负例
- **前置**：构造 `when = '当议会评审需要过程标准核对、轮际对账或交付审计时'`
- **步骤**：① 注入；② 跑 `validateAgentData`
- **预期**：抛 `WhenFormatViolation`
- **判据**：机器 —— `err.code === 'WhenFormatViolation'`；另断言若绕过校验直接拼装，结果含「时时」（证明该拦截必要）
- **红绿证据**：红 = 未拦 → 「…审计时时调用」；绿 = 拦截
- **测试落点**：`tools/docgen/test/pilot-data.test.mjs`
- **不覆盖**：when 正确但描述仍含「时时」的场景（TC-022 兜底）

### TC-028 role 拆槽错字（审计专员 → 审计员）→ 黄金断言红

- **覆盖**：R8｜W1-3｜§6-3
- **类别**：负例
- **前置**：仓库副本（`finally` 丢弃）；副本内 `agentData` 的 `role` 改为 `'审计员'`
- **步骤**：① 在副本内把 `agentData` 的 `role` 改为 `'审计员'`；② 执行 `node tools/docgen/acceptance/golden-assert.mjs --evidence tools/docgen/fixtures/reviewer-audit.evidence.json`
- **预期**：不等，黄金断言失败（退出码 1），阻止进入 replace
- **判据**：机器 —— `acceptance/golden-assert.mjs` 退出码 1；diff 输出同时含「审计员」与「审计专员」
- **红绿证据**：红 = 黄金断言误过（拆槽错字静默通过）；绿 = 拦截
- **测试落点**：`tools/docgen/test/pilot-golden.test.mjs`
- **不覆盖**：when 错（TC-025～027）；整文件比对对 description 的天然覆盖不足（必须靠本用例）

### TC-029 DOMAIN 常量错（议会评审 → 议会审查）→ 黄金断言红

- **覆盖**：R8｜W1-3
- **类别**：负例
- **前置**：本轮新增 `patternRegistry.DOMAIN`；仓库副本（`finally` 丢弃）；副本内 `DOMAIN` 改为 `'议会审查'`
- **步骤**：① 在副本内把 `DOMAIN` 改为 `'议会审查'`；② 执行 `node tools/docgen/acceptance/golden-assert.mjs --evidence tools/docgen/fixtures/reviewer-audit.evidence.json`
- **预期**：不等，失败退出码 1
- **判据**：机器 —— `acceptance/golden-assert.mjs` 退出码 1；diff 含「议会审查」与「议会评审」
- **红绿证据**：红 = DOMAIN 未被消费（改值不影响输出）→ 断言仍过，本用例失败；绿 = 断言红
- **测试落点**：`tools/docgen/test/pilot-golden.test.mjs`
- **不覆盖**：DOMAIN 错误对其它席的全局影响（S4）；常量消费性由 TC-003 正向证明

### TC-030 转录字段错字（identity / fixedList）→ 整文件比对红

- **覆盖**：R4｜W1-1｜§4 步4
- **类别**：负例
- **前置**：构造 identity 漏结尾句号，或 fixedList 第 4 条写成「卡片数 = 已修复」
- **步骤**：① 用错数据渲染；② `compareBuffers(渲染, 快照)`
- **预期**：返回 `{code:'Mismatch', line, byte}`，位置指向错字处
- **判据**：机器 —— 返回值非 `null`；`line` 落在 identity 行（L10）或 fixedList 第 4 行（L21）
- **红绿证据**：红 = 比对误判为 `null`（假绿）；绿 = 报不等且行号正确
- **测试落点**：`tools/docgen/test/pilot-render.test.mjs`
- **不覆盖**：description 内错字（由黄金断言拦）；修法（必须回炉改组件，不得改现产物，TC-045）

### TC-031 模板补全错位（缺「## 边界」节）→ 整文件比对红

- **覆盖**：R4｜W1-1｜§4 步4
- **类别**：负例
- **前置**：构造缺 `## 边界` 节的模板
- **步骤**：① 用缺节模板渲染；② 整比
- **预期**：返回非 `null`，位置指向快照 L93 附近
- **判据**：机器 —— 返回值 `{code:'Mismatch'}`；`line` 与 L93 相差 ≤ 2
- **红绿证据**：红 = 缺节仍判相等；绿 = 报不等
- **测试落点**：`tools/docgen/test/pilot-render.test.mjs`
- **不覆盖**：占位符残留（TC-032）；空行布局归因（§5 人工 + 建议 #1）

### TC-032 模板残留未消费占位符 → 整文件比对红（不依赖新错误码）

- **覆盖**：R11｜§3.4
- **类别**：负例
- **前置**：构造模板里出现未知占位符 `{{FOO}}`（或 `{{TOOLS` 未闭合）
- **步骤**：① 渲染；② 断言产物仍含 `{{`；③ 整比
- **预期**：产物含字面 `{{FOO}}`（或 `{{TOOLS`），整比红
- **判据**：机器 —— `/{{/.test(render)` 为真；`compareBuffers` 非 `null`；**不使用 `validateAgentData` 断言 `TemplateSyntaxError`**（该函数不读模板，见 `validateAgentData.mjs` 全文无模板入参）
- **红绿证据**：红 = 残留占位符被判相等（模板槽位漏替换静默出货）；绿 = 残留被整比抓住
- **测试落点**：`tools/docgen/test/pilot-render.test.mjs`
- **不覆盖**：rule 侧 `spec.render` 的 `TemplateSyntaxError`（S1/P1 已有）

### TC-033 黄金断言时序错（拿活文件 / 替换后文件当基准）= 恒等假绿，必须被证伪

- **覆盖**：R3｜W1-3｜W1-4｜§4 步4｜§6-3
- **类别**：负例
- **前置**：**仓库副本（含 `.git`，供 `git show` 读取快照；`finally` 丢弃）**；evidence fixture 的 `commit` 已记录；在副本内构造一个**可失败**场景：把 `role` 故意写错为「审计员」，同时把副本的 `agents/reviewer-audit.md` 写成「替换后」形态（description 由错 role 派生，故活文件与派生值恒等）
- **步骤**：① 在副本内以派生值（错 role）渲染并覆盖副本的 `agents/reviewer-audit.md`（模拟替换后）；② 执行 `node tools/docgen/acceptance/golden-assert.mjs --evidence tools/docgen/fixtures/reviewer-audit.evidence.json`（基准 = evidence.`commit` 的 `git show` blob）；③ 在**测试内**另写一份「基准 = 副本工作区活文件（`readFileSync(<copy>/agents/reviewer-audit.md)`）」的对照实现，对同一场景再跑一次；④ `finally` 丢弃副本
- **预期**：②失败（exit 1）；③通过（恒等，无判别力）——两者结论不同，证明「基准取哪儿」是决定性的；验收只能采用②的实现
- **判据**：机器 —— 同一输入下两实现结论必须不同：生产 `acceptance/golden-assert.mjs`（blob 基准）退出码 1、测试内活文件基准对照实现退出码 0；**若两者结论相同，说明生产的黄金断言已退化为读活文件 → 本用例 fail**（对照实现只存在于测试内，不要求生产 API）；两个退出码与 diff 输出在副本删除前写入测试日志（证据留存）；真实仓库零改动
- **红绿证据**：红 = 两个实现结论相同（时序守卫失效，假绿不可被识别）；绿 = 结论可分且副本隔离
- **测试落点**：`tools/docgen/test/pilot-golden.test.mjs`（副本含 `.git`；`finally` 删除，真实仓库只读）
- **不覆盖**：正常时序的正例（TC-016）

### TC-034 已接管席漂移（`replaced` 后手改）→ `gate` / `check-agents` 报 `Mismatch`（exit 1）

- **覆盖**：R9｜§6-1
- **类别**：负例
- **前置**：**仓库副本**（`state.json` 中该席 = `replaced`；副本内目标 == 组件渲染，`gate` 当前绿；`finally` 丢弃）
- **步骤**：① 在副本内手改 `agents/reviewer-audit.md` 1 字节；② 副本内 `gate`；③ 副本内 `check-agents`；④ `finally` 丢弃副本
- **预期**：两者均报该席 `Mismatch`，退出码 1，消息含文件名 `reviewer-audit`；真实仓库零改动
- **判据**：机器 —— 两次退出码均 1；stdout+stderr 含 `Mismatch` 与 `reviewer-audit`；副本删除前保留 stdout/stderr 证据
- **红绿证据**：红 = 手改后仍绿（比对空转，「巩固」假绿）；绿 = 拦截且副本隔离
- **测试落点**：`tools/docgen/test/pilot-gate.test.mjs`（副本内执行；`finally` 删除）
- **不覆盖**：回退到 `suspended`（TC-050）；替换前的同类手改（按 TC-009 不报）

### TC-035 判别子：无草稿的非目标漂移 → 拒绝替换且草稿保留

- **覆盖**：R6
- **类别**：负例
- **前置**：仓库副本；`reviewer-audit` 草稿在箱；制造与目标无关的漂移：手改 `rules/spec-testcase-gate.md` 1 字节（该文件是唯一生成 rule，`gate` 会报 `Mismatch`）
- **步骤**：① 制造上述漂移；② `replace --kind agent --name reviewer-audit --draft <草稿> --yes`
- **预期**：拒绝；退出码 1；消息含 `rules/spec-testcase-gate.md`；目标未动；草稿仍在
- **判据**：机器 —— 退出码 1；stderr 含被漂移文件名；目标哈希不变；`draft ls` 仍 1 条
- **红绿证据**：红 = 只按「文件名 == 目标」放行而漏看草稿绑定 → 无关漂移被静默带入；绿 = 拒 + 草稿保留
- **测试落点**：`tools/docgen/acceptance/pilot-replace.acceptance.mjs`（副本内执行；`finally` 丢弃）
- **不覆盖**：目标自身差异（TC-023）；同源多目标（TC-024）；baseline 类（TC-036）

### TC-036 判别子：清单外新增文件（baseline 类）→ 拒绝替换（exit 2）

- **覆盖**：R6
- **类别**：负例
- **前置**：仓库副本；在 `rules/` 新增清单外文件 `rules/zz-pilot-extra.md`
- **步骤**：① 新增文件；② `replace ... --yes`
- **预期**：拒绝；`UnregisteredHandwritten`；退出码 2（baseline 档）；目标未动；草稿保留
- **判据**：机器 —— 退出码 2；stderr 含 `UnregisteredHandwritten`；目标哈希不变；`draft ls` 仍 1 条
- **红绿证据**：红 = baseline 类漂移被放行；绿 = 拒
- **测试落点**：`tools/docgen/acceptance/pilot-replace.acceptance.mjs`（副本内执行；`finally` 丢弃）
- **不覆盖**：正规加文件入口（S1 `baseline --write`）

### TC-037 draft 遇旧稿 → `DraftNameConflict`（exit 1）

- **覆盖**：R6（草稿纪律）
- **类别**：负例
- **前置**：临时草稿箱（`DOCGEN_DRAFTS_DIR`，`finally` 删除）已有该名草稿 1 条
- **步骤**：① 再跑 `draft --kind agent --name reviewer-audit`
- **预期**：`DraftNameConflict`，退出码 1，不自动生成，草稿数仍 1
- **判据**：机器 —— 退出码 1；stderr 含 `DraftNameConflict`；`draft ls` 计数 1；真实草稿箱零变化
- **红绿证据**：红 = 旧稿被静默覆盖（丢未采纳版本）→ 计数变 2；绿 = 拒
- **测试落点**：`tools/docgen/test/pilot-replace.test.mjs`（临时草稿箱；不执行 replace）
- **不覆盖**：同秒撞名（TC-070）

### TC-038 replace 缺 `--yes` → `NotAuthorized`（exit 4）

- **覆盖**：R6
- **类别**：负例
- **前置**：仓库副本（`finally` 丢弃）；草稿在副本草稿箱
- **步骤**：① `replace --kind agent --name reviewer-audit --draft <草稿>`（无 `--yes`）
- **预期**：`NotAuthorized`，退出码 4；目标不变；草稿保留
- **判据**：机器 —— 退出码 4；目标哈希不变；`draft ls` 计数 1；真实仓库零改动
- **红绿证据**：红 = 无授权位仍替换；绿 = 拒
- **测试落点**：`tools/docgen/acceptance/pilot-replace.acceptance.mjs`（副本内执行）
- **不覆盖**：带 `--yes` 的成功路径（TC-011）

### TC-039 草稿被手改（≠ 组件渲染）→ `DraftDrift`（exit 1）

- **覆盖**：R6（D6 堵死路径）
- **类别**：负例
- **前置**：仓库副本（`finally` 丢弃）；草稿在副本草稿箱；人工改草稿 1 字节
- **步骤**：① 改草稿；② `replace ... --yes`
- **预期**：`DraftDrift`，退出码 1；目标不变
- **判据**：机器 —— 退出码 1；stderr 含 `DraftDrift`；目标哈希不变；真实仓库零改动
- **红绿证据**：红 = 手改草稿被替换（绕过 D6）；绿 = 拒
- **测试落点**：`tools/docgen/acceptance/pilot-replace.acceptance.mjs`（副本内执行）
- **不覆盖**：恢复路径（重新 draft）

### TC-040 草稿不存在 → `DraftNotFound`（exit 3）

- **覆盖**：R6
- **类别**：负例
- **前置**：仓库副本（`finally` 丢弃）；指定不存在的草稿路径
- **步骤**：① `replace ... --draft <不存在> --yes`
- **预期**：`DraftNotFound`，退出码 3
- **判据**：机器 —— 退出码 3；stderr 含 `DraftNotFound`；真实仓库零改动
- **红绿证据**：红 = 读空仍替换；绿 = 拒
- **测试落点**：`tools/docgen/acceptance/pilot-replace.acceptance.mjs`（副本内执行）
- **不覆盖**：草稿路径白名单语义（S1）

### TC-041 同一草稿 replace 两次 → 第二次 `DraftNotFound` 且目标不变

- **覆盖**：R6
- **类别**：负例
- **前置**：仓库副本（`finally` 丢弃）；草稿在副本草稿箱
- **步骤**：① 第一次 `replace --yes`（成功并清草稿）；② 用同一路径再来一次
- **预期**：第一次 0；第二次退出码 3；目标字节保持第一次结果
- **判据**：机器 —— 两次退出码 0 / 3；第二次 stderr 含 `DraftNotFound`；目标哈希两次间不变；真实仓库零改动
- **红绿证据**：红 = 第二次仍成功（草稿未清）；绿 = 拒
- **测试落点**：`tools/docgen/acceptance/pilot-replace.acceptance.mjs`（副本内执行）
- **不覆盖**：幂等语义的一般性（R6 ④ 的幂等恢复见 TC-074 / TC-078）

### TC-043 组件数据缺失（ghost）→ `MissingComponentData`（exit 2）

- **覆盖**：R6（步 7 前置检查）
- **类别**：负例
- **前置**：`agentData` 无 `ghost` 条目
- **步骤**：① `generate --kind agent --name ghost`；② `replace --kind agent --name ghost --draft <任意> --yes`
- **预期**：两命令均 `MissingComponentData`，退出码 2
- **判据**：机器 —— 两次退出码 2；stderr 均含 `MissingComponentData`
- **红绿证据**：红 = 缺数据仍渲染空内容；绿 = 拒
- **测试落点**：`tools/docgen/acceptance/pilot-replace.acceptance.mjs`（副本内执行；`finally` 丢弃）
- **不覆盖**：缺可选字段（notWhen/fallback 缺省合法）的宽容语义

### TC-044 11 席未拆槽 → `draft` 拒绝（`MissingComponentData`，exit 2）

- **覆盖**：R6（步 6 前置）
- **类别**：负例
- **前置**：本轮后拆槽席 = `reviewer-audit` + `reviewer-product` + `senior-sdet` 共 3 席；其余 **11 席**未拆槽（`triggerTable` 无 when）。取 `reviewer-qa` 作样本；临时草稿箱（`DOCGEN_DRAFTS_DIR`，`finally` 删除）
- **步骤**：① `draft --kind agent --name reviewer-qa`；② 检查草稿箱
- **预期**：`MissingComponentData`，退出码 2；草稿箱无该席草稿
- **判据**：机器 —— 退出码 2；stderr 含 `MissingComponentData`；`draft ls --name reviewer-qa` 无输出；真实草稿箱零变化
- **红绿证据**：红 = 未拆槽席产出残缺草稿（description 为空/占位）；绿 = 拒
- **测试落点**：`tools/docgen/test/pilot-replace.test.mjs`（临时草稿箱）
- **不覆盖**：`reviewer-product` 已拆槽可 draft（S1 已覆盖）；S4 的 12 席（S4 = 余下 12 席，其中 11 席未拆槽 + `reviewer-product` 已拆槽）

### TC-045 手改现产物（与渲染不同的字节）→ `gate` 报 `Mismatch`（证明「手改成不同字节」被拦）

- **覆盖**：§6-1｜§4 步4
- **类别**：负例
- **前置**：仓库副本（`finally` 丢弃）；`state.json` 将该席置 `replaced`（模拟已接管），目标文件与组件渲染一致（`gate` 当前绿）
- **步骤**：① 只改组件侧（如给 `triggerTable['reviewer-audit'].when` 追加一段合法子句）使渲染 ≠ 目标 → `gate`；② 手改副本 `agents/reviewer-audit.md` 为**与当前渲染不同的字节**（如行尾追加一个空格）→ `gate`；③ `finally` 丢弃副本
- **预期**：①`Mismatch`，退出码 1，消息含该文件名（组件改动未同步时守卫必红）；②仍 `Mismatch`，退出码 1（手改不能把红改成绿）
- **判据**：机器 —— 两次 `gate` 退出码均 1；stderr 均含 `Mismatch` + `reviewer-audit`；真实仓库零改动
- **红绿证据**：红 = 手改成不同字节后 gate 反而绿（守卫未守比对）；绿 = 两次都拦住
- **测试落点**：`tools/docgen/test/pilot-replace.test.mjs`（副本内执行；`finally` 删除，真实仓库只读）
- **不覆盖**：替换前 registered 态的手改（按 R9 不比对，见 TC-009）；**手写目标恰好等于当前渲染字节的 D6 绕过**（gate 只做字节比较，无法与正常 replace 区分，见 §7 缺口「字节相同的 D6 绕过」）

### TC-046 九步跳步（跳过步 4 直接 draft/replace）→ 验收判负

- **覆盖**：§6-5｜§4 步8
- **类别**：负例
- **前置**：仓库副本（`finally` 丢弃）；构造跳步：只做步 2 → 步 6 → 步 7，不做步 4；evidence fixture 的 `goldenAssertion` / `compareResult` / `renderSha256` 保持 `"pending"`
- **步骤**：① 在副本内按跳步顺序执行；② 跑验收脚本（读 evidence）
- **预期**：替换本身可能成功（`DraftDrift` 只保证「草稿 == 渲染」，不能替代步 4），但**验收必须判负**：evidence 的 `goldenAssertion` / `compareResult` / `renderSha256` 仍为 `"pending"`（步 4 未回填）
- **判据**：机器 —— 验收脚本要求 evidence 的 `commit`/`blob`/`sha256`/`lastWrittenHash` 非空，且 `goldenAssertion`/`compareResult`/`renderSha256` 不是 `"pending"` 并表示为通过 / `null` / 渲染哈希；任一不满足 → 退出码非 0 并打印缺失或未回填字段
- **红绿证据**：红 = 跳步后验收仍全绿（比对可被跳过）；绿 = 验收判负
- **测试落点**：`tools/docgen/acceptance/pilot-consolidation.acceptance.mjs`（副本内执行）
- **不覆盖**：跳步在**替换前**的机器拦截（当前无此闸门，见 §9 建议 #4）

### TC-047 替换成功但该名草稿未清 → 巩固判负

- **覆盖**：R7｜W1-5
- **类别**：负例
- **前置**：仓库副本；替换完成；人为在副本草稿箱放回一条该名草稿（模拟 replace 未清）；`finally` 丢弃
- **步骤**：① `draft ls --name reviewer-audit`；② 跑巩固判定
- **预期**：输出非空 → 巩固判负（不得置「已巩固」）
- **判据**：机器 —— `draft ls` 输出行数 > 0 时巩固脚本退出码非 0；真实草稿箱零变化
- **红绿证据**：红 = 草稿残留仍判已巩固（旧版本可能被误认领）；绿 = 空
- **测试落点**：`tools/docgen/acceptance/pilot-consolidation.acceptance.mjs`
- **不覆盖**：`draft rm` 能力（S1）

### TC-048 隔目录冷跑：只跑 `gate` 且必须绿

- **覆盖**：R7｜§4 步9｜§6-8
- **类别**：边界
- **前置**：替换完成、本目录 `gate` 绿；复制清单 = git 跟踪文件 ∪ 本轮新增文件（`state.json`、`sharedBlocks.mjs`、`outputFormats.mjs`、`renderAgent.mjs`、`fixtures/*.evidence.json`），**不依赖文件是否已被 git 跟踪**
- **步骤**：① 按 §6-8 交付清单复制到临时目录（**不含 `.git`**）；② 设 `DOCGEN_DRAFTS_DIR=<副本内临时目录>`；③ 在副本跑 `node tools/docgen/cli.mjs gate`（**不跑黄金断言、不跑 `npm run check`**）
- **预期**：副本 `gate` 退出码 0，stdout 为 `baseline N/N`，其中 `N === BASELINE_RULES.length + agentPaths().length`（由 `baseline.mjs` 的共享常量计算，**不写死数字**）；副本含 `state.json`、三新模块与 evidence fixture
- **判据**：机器 —— 副本内退出码 0；stdout 匹配 `^baseline (\d+)/\1$` 且捕获值 `N === BASELINE_RULES.length + agentPaths().length`（从 `baseline.mjs` 导入计算）；副本内不存在 `.git` 目录；`existsSync` 断言 `tools/docgen/state.json`、`components/sharedBlocks.mjs`、`components/outputFormats.mjs`、`components/renderAgent.mjs`、`fixtures/reviewer-audit.evidence.json` 五处存在
- **红绿证据**：红 = 本目录绿但副本红（工作区残留 / 复制清单漏文件掩盖漂移）；绿 = 两处均绿且 N 与共享常量一致
- **测试落点**：`tools/docgen/acceptance/pilot-consolidation.acceptance.mjs`（冷跑由验收脚本执行）
- **不覆盖**：`gate` 无缓存层这一事实（本用例只验环境隔离）；副本 `state.json` 的比对激活（TC-072）

### TC-049 同一红项修 2 次仍不等 → 停损（人工）

- **覆盖**：R7（6.4 失败回退）｜§4 步4
- **类别**：负例
- **执行方式**：人工（无自动化落点）
- **前置**：步 4 整比持续不等
- **步骤**：① 第 1 次修组件，整比仍红；② 第 2 次修组件，仍红；③ 停止，写复盘，账本标「停损未迁」
- **预期**：停止继续试；账本记录停损轮次与复盘指针；对象不进入「已巩固」
- **判据**：人工 —— 施工者核对修复轮次计数 ≥ 2 且账本有登记；环境 / baseline 类红不计入停损
- **红绿证据**：红 = 修 2 次仍硬撑 / 停损未登记；绿 = 及时停损并登记
- **测试落点**：人工（账本 + 复盘文件）；无自动化落点
- **不覆盖**：停损席的守卫载体（`suspended`，TC-055）

### TC-050 守卫漂移 → 回退 `suspended` 后 `gate` 收敛

- **覆盖**：R7（6.4 回退）｜R9
- **类别**：负例
- **前置**：仓库副本（`finally` 丢弃）；副本内 `state = replaced` 且该席 `gate` 红
- **步骤**：① 确认红；② 手工把副本 `state.json` 该席值改为 `suspended`（R10 规定的唯一回退动作）；③ 副本内 `gate` 与 `check-agents`
- **预期**：回退后该席只做存在性检查，`gate` 退出码 0；`check-agents` 输出「未巩固」计数包含该席
- **判据**：机器 —— ②后 `gate` 退出码 0；`check-agents` 退出码 0 且输出含未巩固计数；真实仓库零改动
- **红绿证据**：红 = 漂移后仍按 `replaced` 逐字节比对（无回退路径，gate 持续红无解）；绿 = `suspended` 后收敛
- **测试落点**：`tools/docgen/test/pilot-gate.test.mjs`（副本内执行）
- **不覆盖**：`suspended` 席手改不报的豁免语义（TC-055）

### TC-051 第二份转录源复活（硬编码常量形态）→ 验收红

- **覆盖**：R5｜§6-4
- **类别**：负例
- **前置**：构造违规状态：在组件 / 模板 / 脚本里复制一份 identity、fixedList 或审计铁律原文
- **步骤**：① 用三条**具体且唯一**的模式串检索；② 统计每个模式串的命中文件数。检索范围 = `tools/docgen/components/`、`tools/docgen/templates/`、`scripts/` 三处（**排除** `tools/docgen/test/`——测试内引用期望值不算第二份源；**排除** `agents/reviewer-audit.md`——它是 R3 规定的原文基准，不是转录副本）
- **预期**：三个模式各命中 **恰好 1 个文件**——identity 原文 `资深审计专员，只审各项标准是否达到，不裁技术对错，不提新技术问题。` → `agentData.mjs`；fixedList 第 4 条原文 `计数一致：卡片数 = 已修 + 关闭 + 候选 + 升级 + 带往下轮` → `agentData.mjs`；审计铁律第三条原文 `你无中断评审权；不裁决技术分歧；机械绿 ≠ 语义真（限度自知并声明）` → `sharedBlocks.mjs`
- **判据**：机器 —— 三个命中文件数断言均为 **1**（同一口径，不再出现「≤2」这类含基准位的宽口径）；0 也算失败（说明正文没有落到组件数据里）；>1 判负（第二份源复活）
- **红绿证据**：红 = 复制块悄悄复活（两处真相必漂移）或正文根本没进组件（0 命中）；绿 = 三条各 1
- **测试落点**：`tools/docgen/test/pilot-gate.test.mjs`
- **不覆盖**：语义改写型双源（改字后计数不变，由 TC-060/061 的载体断言兜）

### TC-052 组件硬编码 description → 双闸门拦截

- **覆盖**：R8｜§6-2
- **类别**：负例
- **前置**：仓库副本（`finally` 丢弃）；在副本内给 `agentData` 条目加独立 `description` 字段，并让渲染优先用它
- **步骤**：① 在副本内注入字段；② 在副本内跑 `node --test tools/docgen/test/data.test.mjs`；③ 在副本内跑 `gate`（W4 派生断言：渲染 description 必须 === 句式拼装输出）
- **预期**：② 拦红（既有断言 `a.description === undefined`）；③ 若渲染绕开拼装，`DescriptionDerivation`（exit 1）
- **判据**：机器 —— ②退出码非 0；③退出码 1 且 stderr 含 `DescriptionDerivation`；**W4 等值断言为本轮新增**（现行 `validateAgentData.mjs:53-61` 只查「时时」，不含等值比较，须补齐）；真实仓库零改动
- **红绿证据**：红 = 硬编码通过（改 when 时 description 不跟着变）；绿 = 双闸门拦截
- **测试落点**：`tools/docgen/test/pilot-data.test.mjs`（副本内执行）
- **不覆盖**：硬编码值恰好等于派生值的巧合（此时等值断言放行，只剩「字段存在」断言拦——两者合取即判别力边界，见 §7）

### TC-053 `state.json`：形状、值域、唯一写点

- **覆盖**：R10｜§6-6
- **类别**：正例
- **前置**：TC-011 替换成功
- **步骤**：① 读 `tools/docgen/state.json`；② 断言只有该席一条；③ 静态检索写入点
- **预期**：内容 `{"version":1,"agents":{"reviewer-audit":"replaced"}}`；值 ∈ {`replaced`,`suspended`}；`tools/docgen/state.json` 只在 `replace` 成功路径被写
- **判据**：机器 —— `JSON.parse` 深等于上式；值域断言；源码检索 `state.json` 的写调用仅 1 处且在 `cmdReplace` 内（函数边界检查）；该文件位于 `tools/docgen/`，不在巩固第 3 项的三目录白名单内（不污染 `git status --short rules/ skills/ agents/`），但**必须纳入 git**（否则冷跑丢状态，见 TC-072）
- **红绿证据**：红 = 无状态文件（`check-agents` 未巩固计数恒为 14，比对空转）；绿 = 形状正确且写点唯一
- **测试落点**：`tools/docgen/test/pilot-state.test.mjs`
- **不覆盖**：非法值（TC-054）；`suspended`（TC-055）

### TC-054 `state.json` 非法值 → `StateFileInvalid`（exit 2）

- **覆盖**：R10｜§6-6
- **类别**：负例
- **前置**：仓库副本（`finally` 丢弃）；副本 `state.json` 基线为 `{"version":1,"agents":{"reviewer-audit":"replaced"}}`
- **步骤**：① 依次把该席值改为 `'done'`、`''`、`1`、`null`；② 依次把 `version` 改为 `2`、`0`、`"1"`；③ 在 `agents` 里加入 `{"not-an-agent":"replaced"}`（键 ∉ `agentData` 名单）；④ 每次改动后跑 `gate`
- **预期**：①～③ 全部八种构造均 `StateFileInvalid`，退出码 2
- **判据**：机器 —— 八次退出码均 2；stderr 均含 `StateFileInvalid`；该码登记在 **S2 §11 错误码表 + `validateAgentData.EXIT`**（档位 2），并由 TC-076 直接断言 `exitCodeFor('StateFileInvalid') === 2`（防「未登记 → 兜底成 2」恰好遮蔽 bug）；真实仓库零改动
- **红绿证据**：红 = 非法版本 / 非法键集 / 非法值被当作 registered/replaced（静默改变比对子集）；绿 = 八种均 exit 2 且码已登记
- **测试落点**：`tools/docgen/test/pilot-state.test.mjs`（副本内执行）
- **不覆盖**：`state.json` 形状正确时的正向断言（TC-053）；错误码全量登记（TC-076）

### TC-055 `suspended` 席：存在性检查 + 逐字节豁免

- **覆盖**：R9｜R10｜§6-6
- **类别**：边界
- **前置**：仓库副本（`finally` 丢弃）；`state.json` 该席 = `suspended`；目标文件存在
- **步骤**：① 在副本内手改目标 1 字节；② 副本内 `gate`；③ 删除副本目标文件；④ 副本内 `gate`
- **预期**：②退出码 0（豁免逐字节）；④`DanglingBaselineEntry`，退出码 2
- **判据**：机器 —— ②退出码 0 且无 `Mismatch`；④退出码 2 且含 `DanglingBaselineEntry`；真实仓库零改动
- **红绿证据**：红 = `suspended` 仍被逐字节比对（回退无效）/ 文件缺失被静默放过；绿 = 两态符合
- **测试落点**：`tools/docgen/test/pilot-state.test.mjs`（副本内执行）
- **不覆盖**：`suspended` 的决策依据（人工账本）

### TC-056 `TargetDrift`：写入前重算目标哈希不等 → 拒写（exit 1）

- **覆盖**：R6｜§4 步7｜R10
- **类别**：负例
- **前置**：仓库副本（`finally` 丢弃）；`evidence.lastWrittenHash` == 目标当前 SHA256（首次替换时它等于迁移快照 SHA256；后续替换时它等于上一次写入的草稿哈希）；草稿在副本草稿箱且草稿 == 渲染；在 replace 之前手工改目标 1 字节
- **步骤**：① 在副本内改目标；② 在副本内 `replace ... --yes`；③ 读目标 / `state.json` / evidence / 草稿箱
- **预期**：`TargetDrift`，退出码 1；目标保持被改后的字节（**不覆盖**）；`state.json` 不新增条目；草稿保留；evidence.`lastWrittenHash` 不变
- **判据**：机器 —— 退出码 1；stderr 含 `TargetDrift`；目标哈希 = ②前值；`state.json` 无该席；`draft ls` 计数 1；evidence.`lastWrittenHash` 与改目标前相同（证明基准是**上一次成功写入的哈希**，不是迁移快照或活文件现算值）；真实仓库零改动
- **红绿证据**：红 = 目标被覆盖（覆盖了用户未知的手改）/ 用迁移快照当基准（第二次稳态替换必被误拒）；绿 = 拒 + 三样保留
- **测试落点**：`tools/docgen/acceptance/pilot-replace.acceptance.mjs`（副本内执行）
- **不覆盖**：第二次稳态替换的正向通过（TC-073）；首次替换基准的建立（TC-001/TC-011）

### TC-057 `GoldenSnapshotUnavailable`（git show 失败）→ exit 2

- **覆盖**：R3｜§6-3
- **类别**：负例
- **前置**：**本轮新增**该错误码（S2 §11 错误码表 + `validateAgentData.EXIT`）；构造：evidence.`commit` 写成不存在的提交号（`git show deadbeef…:agents/reviewer-audit.md` 失败），或在不含 `.git` 的副本里跑黄金断言
- **步骤**：① 用坏提交号的 evidence 执行 `node tools/docgen/acceptance/golden-assert.mjs --evidence <坏 evidence>`；② 在无 `.git` 副本里执行同一命令；③ `finally` 丢弃副本
- **预期**：两场景均 `GoldenSnapshotUnavailable`，退出码 2（环境/前置档），不是 1（不是数据校验缺陷）
- **判据**：机器 —— `acceptance/golden-assert.mjs` 两次退出码均 2；stderr 均含 `GoldenSnapshotUnavailable`；该码登记在 **S2 §11 错误码表 + `validateAgentData.EXIT`**（档位 2），并由 TC-076 直接断言 `exitCodeFor('GoldenSnapshotUnavailable') === 2`；真实仓库零改动
- **红绿证据**：红 = 被当成 `Mismatch`（exit 1）→ 误判为「组件写错了」并计入停损轮次；绿 = exit 2
- **测试落点**：`tools/docgen/test/pilot-golden.test.mjs`（副本内执行）
- **不覆盖**：缺 `.git` 的冷跑（冷跑不跑黄金断言，TC-068）

### TC-058 `collectGate()` 收集完整漂移清单 D（不抛）

- **覆盖**：R6
- **类别**：负例
- **前置**：**本轮新增** `collectGate()` / `gateChecks()`，且**两者必须从模块导出供 acceptance 调用**（spec R6 ①）：实现二选一——在 `tools/docgen/components/gate.mjs` 导出，或在 `tools/docgen/cli.mjs` 具名导出；仓库副本（`finally` 丢弃）同时制造三类漂移：① 手改生成的 rule（`Mismatch`）；② 在 `agents/` 新增清单外文件（`UnregisteredHandwritten`）；③ `state.json` 置 `replaced` 并手改目标（`Mismatch`）
- **步骤**：① 从导出模块具名导入（`import { collectGate, gateChecks } from '<实现选择的导出模块>'`，候选：`components/gate.mjs` / `cli.mjs`）；② 断言导出面；③ 在副本内调 `collectGate()`（函数级）；④ 断言返回值；⑤ 调 `gateChecks()` 断言抛错
- **预期**：②两个导出均为函数（`typeof 'function'`，`collectGate.length === 0`）；③不抛；④D 含 3 个条目且文件名为上述三者；⑤`gateChecks()` 抛 baseline 类码（按 TC-059 优先级）
- **判据**：机器 —— `typeof collectGate === 'function' && typeof gateChecks === 'function'`；`collectGate().length === 3`；条目字段含 `{code, path}`；`assert.throws(() => gateChecks())` 且 `err.code` 属 baseline 类；真实仓库零改动
- **红绿证据**：红 = 沿用 fail-fast（`cli.mjs:74-114` 首个 `fail()` 即抛）→ 拿不到完整 D，判别子无法判定；绿 = D 完整
- **测试落点**：`tools/docgen/test/pilot-gate.test.mjs`（副本内执行）
- **不覆盖**：判别子集合判定本身（TC-023/024/035/036）

### TC-059 错误码优先级：baseline 类 > 非目标 `Mismatch` > 目标 `Mismatch`

- **覆盖**：R6｜R10｜§6-6
- **类别**：负例
- **前置**：仓库副本（`finally` 丢弃）；漂移载体分别为——`state.json` 非法值（`"done"`）、非目标 `Mismatch`（手改唯一生成 rule `rules/spec-testcase-gate.md`）、目标 `Mismatch`（state 置 `replaced` 后手改 `agents/reviewer-audit.md`）。**不构造三态共存**（非法 state 下 gate 无法走到完整漂移收集，三态同时可达性不成立），按阶梯分别构造
- **步骤**：① **第一档**：副本内 state 置非法值 + 手改生成 rule（state 非法与非目标 `Mismatch` 两态共存）→ `gate`；② **第二档**：把 state 值改回 `replaced`，保留生成 rule 手改，并另将目标手改 1 字节（两类 `Mismatch` 共存）→ `gate`；③ **第三档**：复原生成 rule，只留目标 `Mismatch` → `gate`
- **预期**：①`StateFileInvalid` exit 2（压过非目标 `Mismatch`）；②非目标 `Mismatch` exit 1 且消息含 `rules/spec-testcase-gate.md`（压过目标 `Mismatch`）；③目标 `Mismatch` exit 1
- **判据**：机器 —— 三次退出码 2 / 1 / 1；stderr 首行错误码依次为 `StateFileInvalid` / `Mismatch` / `Mismatch`，且第二阶梯的消息文件名为非目标；真实仓库零改动
- **红绿证据**：红 = 优先级未定义（同一构造两次跑出不同码 → CI 不可判）；绿 = 三阶梯稳定且每档单独可构造
- **测试落点**：`tools/docgen/test/pilot-gate.test.mjs`（副本内执行）
- **不覆盖**：`DanglingBaselineEntry` / `BaselineDrift` 之间的次序（同档，任一即可）

### TC-060 `renderAgent` 纯函数：零 fs、可单测

- **覆盖**：R11｜§3.4
- **类别**：正例
- **前置**：本轮新增 `components/renderAgent.mjs`
- **调用层**：纯函数层 `renderAgent(agent, trigger, template, sharedBlocks, outputFormats)`（R11 第 ① 层；**不测** CLI 薄封装 `renderByName`）
- **步骤**：① 检查该模块源码无 `fs` 导入（静态）；② 检查导出函数签名为上述五参数（`agent` = agentData 条目，`trigger` = triggerTable 条目，`template` = 模板文本，`sharedBlocks` = 共享块映射，`outputFormats` = 输出格式映射）；③ 用同一组输入调两次
- **预期**：无 fs 导入；两次输出逐字节相同；不在函数内读模板 / 不读 `agents/`；函数体只消费入参
- **判据**：机器 —— **测试内复制同一正则字面量** `/(?:from\s*['"]|require\(\s*['"])(?:node:)?fs(?:\/promises)?['"]/` 对 `components/renderAgent.mjs` 源码断言不命中（`compare.mjs:29` 的正则常量**未导出**，不得 import）；或等价断言该模块源码不含 `from 'node:fs'` / `from "node:fs"` / `node:fs/promises` 的导入语句；导出函数 `renderAgent.length === 5` 或签名参数名逐一匹配 `['agent','trigger','template','sharedBlocks','outputFormats']`；两次结果 `equals`；`withReadProbe(fn, [agents 路径])` 期间不命中禁止路径
- **红绿证据**：红 = 渲染函数内读文件（不可单测、无法复用给 S4）/ 签名吃 `name` 而非数据（两义）；绿 = 纯函数五参数
- **测试落点**：`tools/docgen/test/pilot-render.test.mjs`
- **不覆盖**：CLI 薄封装 `renderByName` 的读模板编排（TC-005/006/014 覆盖）

### TC-061 模板纯度：该席专有文本不进 `agent.md.tpl`

- **覆盖**：R11｜§3.4
- **类别**：边界
- **前置**：模板已补全为全量结构
- **调用层**：CLI 薄封装 `renderByName('reviewer-audit')`
- **步骤**：① 读 `agent.md.tpl` 原文；② 用下表四个模式串检索模板；③ 渲染后再检索同样四串；④ 记录四模式在黄金快照与渲染产物中的实测次数
- **模式与实测次数（2026-10-19 对 `agents/reviewer-audit.md` 实测）**：

| # | 模式串 | 快照命中 | 位置 | 为什么这样取 |
|---|---|---|---|---|
| 1 | identity 首段 `资深审计专员，只审各项标准` | 1 | L10 | 该段只出现在 identity |
| 2 | fixedList 第 4 条唯一片段 `计数一致：卡片数 = 已修 + 关闭 + 候选 + 升级 + 带往下轮` | 1 | L21 | **完整句 `卡片数 = 已修 + 关闭 + 候选 + 升级 + 带往下轮` 在快照出现 2 次**（L21 fixedList 第 4 条 + L42 输出格式「第 3 项 本轮终态对账」行），不能作「恰 1」模式；加前缀「计数一致：」后唯一 |
| 3 | 唯一 H1 片段 `# 角色：审计专员（独立（标准核对））` | 1 | L7 | 泛化角色名「审计专员」在快照出现 5 次（description / H1 / identity / 两处声明），必红 |
| 4 | 审计铁律第三条 `你无中断评审权；不裁决技术分歧；机械绿 ≠ 语义真（限度自知并声明）` | 1 | L91 | 该条只出现在共享块 |

- **预期**：模板命中数 = 0 / 0 / 0 / 0；渲染产物命中数 = 1 / 1 / 1 / 1（与上表快照实测次数一致）
- **判据**：机器 —— 模板四计数全 **0**；渲染四计数全 **恰好 1**（不是 ≥1，也不是 2）；四个模式的快照实测次数（1/1/1/1）与位置（L10/L21/L7/L91）记入用例证据；模板另需包含九个占位符各 1 次（与 TC-005 同口径）
- **红绿证据**：红 = 模板命中 > 0（硬编码进 13 席共用模板，S4 换席即崩）或唯一片段计数 ≠ 1；绿 = 模板全 0 且渲染全恰 1
- **测试落点**：`tools/docgen/test/pilot-render.test.mjs`
- **不覆盖**：rule 侧 `assertTemplateClean`（P1 已有，语义不同：它禁「正文行」而非「本席文本」）

### TC-062 数据变异：改数据只改该处输出

- **覆盖**：R11｜§3.1
- **类别**：正例
- **前置**：TC-002 完成
- **步骤**：① 渲染基线；② 只改 `agentData` 条目的 `identity`（追加「（变异）」），再渲染并逐行 diff，复原；③ **循环 7 条 fixedList**：对每条 `fixedList[i]`（i = 0…6）单独追加「（变异）」，每次渲染后逐行 diff 并断言只变该行，随后复原
- **预期**：identity 变异 diff 恰 1 行；7 条 fixedList 每条变异各 diff 恰 1 行（共 8 个独立样例，不再只测第 4 条）；其它行零差异
- **判据**：机器 —— 8 次变异各自 diff 行数 === 1；差异行内容含对应变异标记或该条原文；每次复原后 `compareBuffers(baseline, restored) === null`
- **红绿证据**：红 = 改某条数据输出不变（该条未被消费）/ 影响多处（拼接错位）；绿 = 8 次都只变该处
- **测试落点**：`tools/docgen/test/pilot-render.test.mjs`
- **不覆盖**：模板层对其它席的复用（S4）

### TC-063 `AUDIT_RULES` 共享块载体：3 条逐字 + 前后各一空行

- **覆盖**：R11｜§3.4｜§4 步2
- **类别**：正例
- **前置**：本轮新增 `sharedBlocks.mjs`
- **步骤**：① 读 `sharedBlocks.AUDIT_RULES`；② 逐条与快照 L89-91 比；③ 检查渲染中该块前后各一空行
- **预期**：三条逐字相等（含「你无中断评审权；不裁决技术分歧；机械绿 ≠ 语义真（限度自知并声明）」）；渲染为 `\n\n### 审计铁律\n<三条>\n\n`，且该块**直接嵌在模板流中**（产物不含 `## 共享块` 包装标题）
- **判据**：机器 —— 三条 `===`；渲染字节在 `### 审计铁律` 前含 `\n\n`、块末后含 `\n\n`；`patternRegistry.sharedBlock` 枚举含 `AUDIT_RULES`；产物 `!/## 共享块/`
- **红绿证据**：红 = 条文被改写 / 少一条 / 空行数错 → 整比红；绿 = 逐字且空行对
- **测试落点**：`tools/docgen/test/pilot-render.test.mjs`
- **不覆盖**：`SIX_METHODS` / `DETECTIVE_RULES`（S4）

### TC-064 `audit` 输出格式载体：两节逐字

- **覆盖**：R11｜§3.4
- **类别**：正例
- **前置**：本轮新增 `outputFormats.mjs`
- **步骤**：① 读 `outputFormats.audit`；② 检查轮间核对单锚点（`> 声明：本核对单必由审计专员本人实例完成…`、`## 核对项` 6 行表、`## 结论`、`> 机械计数由主持人跑命令…`）；③ 检查交付审计表锚点（`> 声明：本审计表必由审计专员本人实例完成…`、`## A 节 过程闭环` 6 行表、`## B 节 按 doc-taxonomy 完成判据逐交付物核对`、`## 结论` 三行）
- **预期**：两节五锚点齐、逐字；`outputKind: 'audit'` 可解析到该常量；产物整比 `null`
- **判据**：机器 —— 五个锚点 `includes` 全真；`patternRegistry.outputKind.has('audit')`；`compareBuffers === null`
- **红绿证据**：红 = 两节被合并/缺 A、B 节/序号错位 → 整比红；绿 = 全齐
- **测试落点**：`tools/docgen/test/pilot-render.test.mjs`
- **不覆盖**：表格观感（人工，§5）；其它 outputKind（S4）

### TC-065 `{{TOOLS}}` 单源：模板不再硬编码、渲染用 `join(', ')`

- **覆盖**：R11｜§4 步2
- **类别**：正例
- **前置**：模板补全
- **步骤**：① 断言模板含 `{{TOOLS}}`；② 断言模板不含字面 `tools: Read, Glob, Grep`；③ 断言渲染 frontmatter 的 tools 行；④ 变异：把 `agentData.tools` 改为 `['Read','Grep']` 后渲染（校验收紧的 `ToolsViolation` 会拦，故只在单测内直接调渲染函数）
- **预期**：②命中 0；③等于 `tools: Read, Glob, Grep`；④渲染行随数据变化为 `tools: Read, Grep`
- **判据**：机器 —— 模板 `includes('{{TOOLS}}')` 为真、`includes('tools: Read, Glob, Grep')` 为假；渲染行 `=== 'tools: Read, Glob, Grep'`；④随数据变化
- **红绿证据**：红 = 模板硬编码（数据字段成死字段，改 tools 不生效）；绿 = 单源
- **测试落点**：`tools/docgen/test/pilot-render.test.mjs`
- **不覆盖**：`tools` 只读白名单校验（S1 断言 4）

### TC-066 `{{FIXED_LIST}}`：7 行、编号 1–7、回答列「待答」

- **覆盖**：R11｜§3.4
- **类别**：正例
- **前置**：TC-002 的 fixedList 就位
- **步骤**：① 渲染；② 提取「固定必问清单」表的数据行；③ 逐行比对
- **预期**：恰 7 行；每行形如 `| {i} | {item} | 待答 |`，`i` 从 1 到 7；item 逐字等于 `fixedList[i-1]`；表头为 `| # | 必问 | 回答 |` + 分隔行；该表位于 `## 固定必问清单` 节内；全文 H2 计数 = 12（其中输出格式块内 5 个，与 TC-005/TC-019 同一锚点口径）
- **判据**：机器 —— 数据行数 = 7；编号序列 `[1..7]`；每行 item `=== fixedList[i-1]`；`待答` 计数 = 7；表格所在节 = `## 固定必问清单`（前后最近 H2 判定）；全文 `/^## /gm` 计数 = 12
- **红绿证据**：红 = 只渲染表头（现状 `cli.mjs:224` 就是只给表头）→ 数据行 0；节锚点错位或 H2 数 ≠ 12 → 结构断言红；绿 = 7 行且编号与节锚点正确
- **测试落点**：`tools/docgen/test/pilot-render.test.mjs`
- **不覆盖**：fixedList 语义正确性（人工）

### TC-067 渲染字节的环境约束：无 BOM、无 CR、尾恰一个 `\n`

- **覆盖**：§3.4（渲染产物形状）
- **类别**：边界
- **前置**：`compare.mjs` 的 `checkEnvironment` 对 `role='generated'` 直接放行（`compare.mjs:82`），故需独立断言
- **步骤**：① 取渲染字节；② 检查前三字节、CR、末尾换行数
- **预期**：无 BOM（前三字节非 `EF BB BF`）；无 `0x0d`；末尾恰一个 `0x0a`（倒数第二字节非 `0x0a`）
- **判据**：机器 —— 以 `checkEnvironment(renderBytes, 'target')` 借用同一套判据（不通过则抛 `EnvironmentEOL`）；显式三项断言亦通过
- **红绿证据**：红 = Windows 下 CRLF / PowerShell 写 BOM → 整比红但归因困难；绿 = 三项通过
- **测试落点**：`tools/docgen/test/pilot-render.test.mjs`
- **不覆盖**：模板文件本身的编码——`cli.mjs` 的 `readTemplate`（`cli.mjs:27-32`）只做 `readFileSync(..., 'utf8')`，**不调用 `checkEnvironment`**；模板 BOM/CRLF 没有独立预检，会原样渲染进产物，由整文件比对（TC-007/TC-014）兜底（见 §7 缺口「模板编码未独立预检」）

### TC-068 冷跑隔离：无 `.git`、草稿箱重定向到副本内、不跑黄金断言

- **覆盖**：§6-8｜§4 步9
- **类别**：边界
- **前置**：TC-048 冷跑脚本；副本按 §6-8 交付清单复制（git 跟踪文件 ∪ 本轮新增文件，不依赖 git 跟踪）
- **步骤**：① 检查副本内无 `.git`；② 检查 `DOCGEN_DRAFTS_DIR` 指向副本内临时目录（不是 `~/.retro-skills/docgen-drafts`）；③ 检查冷跑脚本只调 `gate`；④ 冷跑前后比对真实草稿箱文件清单
- **预期**：①无 `.git`；②环境变量生效；③命令序列只含 `gate`（无黄金断言、无 `npm run check`）；④真实草稿箱零变化
- **判据**：机器 —— `existsSync(join(copy,'.git')) === false`；冷跑 env 断言；脚本中 `git show` 调用数 = 0、`npm run check` 调用数 = 0；真实草稿箱 `readdirSync` 前后深等
- **红绿证据**：红 = 冷跑读真实草稿箱（他人草稿影响结论）/ 调 git 导致 `GoldenSnapshotUnavailable`；绿 = 三项隔离成立
- **测试落点**：`tools/docgen/acceptance/pilot-consolidation.acceptance.mjs`（冷跑由验收脚本执行）
- **不覆盖**：副本 `state.json` 是否携带（TC-072）

### TC-069 tmp 残留：非 `.md` 后缀不被 `gate` 误判，且下次启动清理

- **覆盖**：§6-7｜§4 步7
- **类别**：边界
- **前置**：仓库副本（`finally` 丢弃）；**先为 `reviewer-audit` 落草稿**（否则 replace 会先报 `DraftNotFound`，测不到 tmp 清理）；副本草稿 == 渲染
- **步骤**：① **场景 A**：在副本 `agents/` 只放新后缀残留 `.tmp-reviewer-audit-99999.part` → `gate`；② **场景 B（对照，独立副本或先移除 `.part`）**：只放旧后缀 `.tmp-reviewer-audit-99999.md` → `gate`；③ 恢复场景 A（移除旧后缀、放回新后缀），跑 `replace --yes`（草稿在箱）→ 检查残留
- **预期**：①新后缀不触发 `UnregisteredHandwritten`（`gate` 只扫 `.md`）→ 退出码 0；②旧后缀对照触发 `UnregisteredHandwritten`（证明「扫 `.md`」属实）；③replace 启动时清理 `.tmp-reviewer-audit-*` 残留，替换成功，`agents/` 无 `.tmp-` 前缀文件
- **判据**：机器 —— ①退出码 0 且 stderr 无 `UnregisteredHandwritten`；②退出码 2 且 stderr 含 `UnregisteredHandwritten`（**与 ① 分开跑，不共存**，否则 ① 必红）；③退出码 0 且 `readdirSync('agents').filter(f=>f.startsWith('.tmp-')).length === 0`；真实仓库零改动
- **红绿证据**：红 = 沿用 `.md` 后缀（现状 `cli.mjs:192`）→ 中断后 gate 永久红且无清理入口；缺草稿 → 先报 `DraftNotFound` 测不到清理；绿 = 非 `.md` + 启动清理
- **测试落点**：`tools/docgen/acceptance/pilot-replace.acceptance.mjs`（副本内执行）
- **不覆盖**：进程被 kill 的时序本身（不可确定性复现，改以「预置残留文件」构造）

### TC-070 draft 独占写（`wx`）：源码断言 + 既有文件不被覆盖

- **覆盖**：§6-7｜§4 步6
- **类别**：边界
- **前置**：本轮改造 draft 写入；临时草稿箱（`DOCGEN_DRAFTS_DIR`，`finally` 删除）
- **步骤**：① 静态检查 draft 写入调用带 `{ flag: 'wx' }`；② 预置一个同名草稿后跑 `draft`（应先被「旧稿检查」拦，草稿数仍 1）；③ 断言既有文件字节不变
- **预期**：①写调用带 `wx`；②`DraftNameConflict`（exit 1）；③既有草稿字节不变
- **判据**：机器 —— 源码正则命中 `flag:\s*'wx'`（draft 写入点恰 1 处）；②退出码 1；③字节 `equals` 原值；真实草稿箱零变化
- **红绿证据**：红 = 直接 `writeFileSync`（现状 `cli.mjs:172`）→ 同秒两实例互相覆盖、草稿不可信；绿 = `wx` + 旧稿检查双保险
- **测试落点**：`tools/docgen/test/pilot-replace.test.mjs`（临时草稿箱；不执行 replace）
- **不覆盖**：真并发撞名的行为复现（需可注入时钟；本用例以静态断言兜底，见 §9 建议 #6 与 §7 缺口）

### TC-071 迁移账本行：六列齐 + 状态「已巩固」

- **覆盖**：§4 步1（账本落点 PRD §6.6）
- **类别**：正例
- **前置**：TC-013 六项全过
- **步骤**：① 解析 PRD §6.6 表格中 `reviewer-audit` 行；② 核对六列；③ 核对状态取值
- **预期**：六列均非空；状态 = `已巩固`；「现产物双哈希」列含 `git hash-object` 值与 SHA256 值；「巩固证据」列含 gate 两次绿输出（或指向其记录）
- **判据**：机器（部分）+ 人工 —— markdown 表格解析：该行列数 = 6、空单元格数 = 0；状态 `∈ {'未入队','迁移中','已巩固','停损未迁'}` 且等于 `已巩固`；双哈希列匹配 `[0-9a-f]{40}` 与 `[0-9A-F]{64}`
- **红绿证据**：红 = 账本悬空（只写「记录双哈希」但不落表）/ 状态与 `state.json` 不一致；绿 = 六列齐且状态一致
- **测试落点**：`tools/docgen/acceptance/pilot-consolidation.acceptance.mjs`（解析账本 + 对照 evidence 字段）
- **不覆盖**：账本为记录型文档、不作机器守卫依赖（S1 §8.6）；其它席行（S3/S4）

### TC-072 冷跑副本必须携带 `state.json`（否则 `replaced` 退化为 registered，冷跑假绿）

- **覆盖**：§6-8｜R7｜R9
- **类别**：边界
- **前置**：`state.json` 已存在且该席 = `replaced`；冷跑按 §6-8 交付清单复制（git 跟踪文件 ∪ 本轮新增文件，**不依赖文件是否已被 git 跟踪**）
- **步骤**：① 按交付清单复制到临时目录（不含 `.git`）；② 检查副本含四类文件：`tools/docgen/state.json`、三新模块（`sharedBlocks.mjs` / `outputFormats.mjs` / `renderAgent.mjs`）、`tools/docgen/fixtures/reviewer-audit.evidence.json`；③ 检查副本 `state.json` 值为 `reviewer-audit: replaced`；④ 在副本内故意手改目标 1 字节后跑 `gate`
- **预期**：①副本无 `.git`；②四类文件都存在（不要求 `git ls-files` 命中）；③值正确；④副本 `gate` 必须报 `Mismatch`（证明副本仍对已接管席做逐字节比对）
- **判据**：机器 —— ②`existsSync` 断言四类文件全部存在；③副本 `JSON.parse(...).agents['reviewer-audit'] === 'replaced'`；④副本 `gate` 退出码 1 且含 `Mismatch`；**不使用 `git ls-files` 作为前置判据**（未跟踪的 `state.json` 也必须由交付清单带过去）
- **红绿证据**：红 = 交付清单漏 `state.json` → 副本里该席变 registered → 冷跑 `gate` 绿但**比对空转**（冷跑失去判别力，巩固假绿）；绿 = 四类文件齐且 ④ 报 `Mismatch`
- **测试落点**：`tools/docgen/acceptance/pilot-consolidation.acceptance.mjs`（冷跑由验收脚本执行）
- **不覆盖**：`suspended` 席的冷跑（同机制）

### TC-073 `TargetDrift` 基准 = `lastWrittenHash`：首次替换用快照哈希，第二次稳态替换必须放行

- **覆盖**：R6｜R10｜§4 步7｜§6-6
- **类别**：边界
- **前置**：仓库副本（`finally` 丢弃）；第一次 replace 已成功（TC-011），`state = replaced`；`evidence.lastWrittenHash` **已更新为第一个草稿的 SHA256**（首次替换前它曾等于迁移快照 SHA256）
- **步骤**：① 读 `evidence.lastWrittenHash`，断言它 == 当前目标 SHA256；② 合法修改 `triggerTable['reviewer-audit'].when`（追加一段合法子句，仍过 `WhenFormatViolation` 校验）；③ `draft`；④ `replace --yes`；⑤ `gate`；⑥ 读 `evidence.lastWrittenHash`
- **预期**：④退出码 0（第二次稳态替换不被 `TargetDrift` 误拒）；目标 == 新草稿；`state` 仍为 `replaced`；⑤`gate` 退出码 0；⑥`lastWrittenHash` == 新目标 SHA256
- **判据**：机器 —— ①`lastWrittenHash === sha256(当前目标)`；④退出码 0 且目标 `Buffer.equals(新草稿)`；⑥`lastWrittenHash === sha256(新目标)`；⑤退出码 0；**反例对照**：把 `lastWrittenHash` 改回迁移快照 SHA256 后重跑 ④ → `TargetDrift` exit 1（证明基准确实是 `lastWrittenHash`，不是迁移快照）
- **红绿证据**：红 = 实现把「迁移快照」当永久基准 → 第二次替换必被误拒（稳态旅程卡死）；绿 = 首次快照基准 + 每次成功后滚动更新
- **测试落点**：`tools/docgen/acceptance/pilot-replace.acceptance.mjs`（副本内执行）
- **不覆盖**：首次替换的基准建立（TC-001/TC-011）；`TargetDrift` 拒写路径（TC-056）

### TC-074 replace 幂等恢复（rename 后、evidence 更新前崩溃）→ 退出 0，更新 `lastWrittenHash` + 清草稿

- **覆盖**：R6｜§4 步7｜§6-7
- **类别**：边界
- **前置**：仓库副本（`finally` 丢弃）；`state.json` 该席 = `replaced`；**目标字节 == 当前渲染字节**（模拟上次 `renameSync` 已完成）；草稿在副本草稿箱且草稿 == 渲染（模拟清草稿前崩溃）；`evidence.lastWrittenHash` = **旧值**（≠ 目标/渲染的 SHA256，模拟 evidence 更新前崩溃）
- **步骤**：① 构造上述四态，记录渲染字节（与目标字节相同）与 `lastWrittenHash` 旧值；② `replace --kind agent --name reviewer-audit --draft <草稿> --yes`；③ 读 state / 草稿箱 / 目标 / evidence / tmp 残留
- **预期**：退出码 0（**幂等分支先于 `TargetDrift`**，不得报 `TargetDrift` / `DraftDrift`）；`state.json` 仍为该席 `replaced`；`lastWrittenHash` 更新为 sha256(渲染)（大写）；该名草稿已清；目标字节不变；无 `.tmp-` 残留
- **判据**：机器 —— 退出码 0；`JSON.parse(state).agents['reviewer-audit'] === 'replaced'`；`draft ls` 无输出；目标 `Buffer.equals(①记录的渲染字节)`；evidence.`lastWrittenHash === createHash('sha256').update(渲染字节).digest('hex').toUpperCase()` 且 ≠ 旧值；`readdirSync('agents')` 无 `.tmp-` 前缀；真实仓库零改动
- **红绿证据**：红 = 幂等分支缺失或后置 → 先做 `TargetDrift` 必拒（`lastWrittenHash` 仍是旧值），崩溃后无法自愈；绿 = 退出 0 且只更新 evidence + 清草稿
- **测试落点**：`tools/docgen/acceptance/pilot-replace.acceptance.mjs`（副本内执行）
- **不覆盖**：真实进程 kill 的时序（以「预置四态」构造）；rename 前崩溃（TC-078）；写序本身（TC-011）

### TC-075 registered（state 无条目）但已拆槽席，`generate` 仍必须渲染并比对（改 1 字节 → exit 1）

- **覆盖**：§4 步3｜R11｜R12（spec §11 第 3 条）
- **类别**：负例
- **前置**：仓库副本（`finally` 丢弃）；副本 `state.json` 无 `reviewer-audit` 条目（= registered）；`agentData` / `triggerTable` 已拆槽；在副本内把目标改 1 字节
- **步骤**：① 断言副本 state 无该席条目；② 副本内 `node tools/docgen/cli.mjs generate --kind agent --name reviewer-audit`；③ 记录退出码与输出
- **预期**：退出码 1（不是 0）；输出指向 `reviewer-audit`（若走 `compareBuffers` 则同时含 `Mismatch`），证明 `generate` 没有套用 registered 豁免
- **判据**：机器 —— ②退出码 1；stdout+stderr 含 `reviewer-audit`（实现若用 `compareBuffers`，同时含 `Mismatch`）；真实仓库零改动
- **红绿证据**：红 = 沿用 S1 R3（registered 只查存在）→ 改 1 字节仍退出 0，步 3 的「0=一致 / 1=不等」无从判定；绿 = 已拆槽席恒渲染 + 比对
- **测试落点**：`tools/docgen/test/pilot-render.test.mjs`（副本内执行）
- **不覆盖**：`gate` / `check-agents` 的 registered 豁免（TC-009）；正常态退出 0（TC-006）

### TC-076 错误码登记完整性：每个已用码都能 `exitCodeFor` 而不抛，档位与 S2 §11 表一致

- **覆盖**：R12｜R10｜§11 错误码表
- **类别**：负例
- **前置**：本轮新增四码（`TargetDrift` / `StateFileInvalid` / `GoldenSnapshotUnavailable` / `EvidenceInvalid`）+ 既有码 `InvalidArgs` 本轮一并登记；`validateAgentData.EXIT` 已按 S2 §11 扩展
- **步骤**：① 读 S2 §11 错误码表五行：`TargetDrift`→1、`StateFileInvalid`→2、`GoldenSnapshotUnavailable`→2、`EvidenceInvalid`→2、`InvalidArgs`→2；② 对 `tools/docgen/**/*.mjs` 中所有 `fail('CODE')` 与 `e.code = 'CODE'` 的 CODE 字面量逐个调 `exitCodeFor(CODE)`；③ 断言不抛且档位与 §11 表一致；④ 反向：调 `exitCodeFor('__probe_unmapped__')` 必须抛错（证明检查有判别力）
- **预期**：五码档位正确；源码中每个已用错误码都有映射；未登记码抛错
- **判据**：机器 —— `exitCodeFor('TargetDrift') === 1`；`exitCodeFor('StateFileInvalid') === 2`；`exitCodeFor('GoldenSnapshotUnavailable') === 2`；`exitCodeFor('EvidenceInvalid') === 2`；`exitCodeFor('InvalidArgs') === 2`；源码扫描出的每个 CODE 调 `exitCodeFor` 均不抛；`assert.throws(() => exitCodeFor('__probe_unmapped__'))`；登记落点 = **S2 §11 错误码表 + `validateAgentData.EXIT`**
- **红绿证据**：红 = 任一新码未落 `EXIT` 表 → `exitCodeFor` 抛错、`cli.mjs:250-252` 兜底成 2，`TargetDrift` 的 exit 1 被静默改档（2 与 1 的差别被兜底掩盖）；`EvidenceInvalid`/`InvalidArgs` 未登记同理；绿 = 五码可映射且档位一致
- **测试落点**：`tools/docgen/test/pilot-data.test.mjs`（纯函数断言，不执行 replace）
- **不覆盖**：各错误码的触发路径（TC-025～027、TC-037～041、TC-054/057/056）；`EvidenceInvalid` 的三条触发路径（evidence 缺失 / 字段类型非法 / `renderSha256` 与草稿不等）本轮只做码登记与档位断言，触发路径由施工自测（如需强约束应另立用例，本轮定点清单未要求加号）

### TC-077 无 sharedBlock 席：该段连同前后空行整段消失（不留下多余空行）

- **覆盖**：R11｜§3.4
- **类别**：边界
- **前置**：测试桩席（只作为纯函数入参，不写入 `agentData`）：`sharedBlock: undefined`、**`outputKind: 'audit'`（钉住，不依赖缺省，也不让 S4 的 kind 影响本用例）**，其余槽位齐（`role`/`dimension`/`tools`/`identity`/`fixedList`）；模板为补全后的 `agent.md.tpl`
- **调用层**：纯函数 `renderAgent(stubAgent, stubTrigger, template, sharedBlocks, outputFormats)`（R11 第 ① 层）
- **步骤**：① 用桩席渲染；② 用 `reviewer-audit`（有 `AUDIT_RULES`）渲染作对照；③ 检查 `## 通用纪律` 与 `## 边界` 之间的字节
- **预期**：桩席产物不含 `### 审计铁律`、不含 `## 共享块`、不含 `{{`；`## 通用纪律` 与 `## 边界` 之间恰一个空行（无 `\n\n\n` 连续空行）；**H2 计数 = 7（模板顶层节）+ `outputFormats[stubAgent.outputKind]` 的 H2 数**（`outputKind = 'audit'` 时该项实测 5，故 = 12；不写死 12，避免 S4 换 kind 时误判）；对照产物含 `### 审计铁律`
- **判据**：机器 —— `!/### 审计铁律/.test(stubRender)`；`!/## 共享块/.test(stubRender)`；`!/{{/.test(stubRender)`；`stubRender` 中 `## 通用纪律` 与 `## 边界` 之间无 `\n\n\n`；`(stubRender.match(/^## /gm) || []).length === 7 + (outputFormats[stubAgent.outputKind].match(/^## /gm) || []).length` 且断言 `stubAgent.outputKind === 'audit'`（钉住）；对照产物含 `### 审计铁律`
- **红绿证据**：红 = 空块替换成空串但模板仍留前后空行 → 出现连续三个换行（S4 无 sharedBlock 席渲染出多余空行）；绿 = 整段消失且空行数正确
- **测试落点**：`tools/docgen/test/pilot-render.test.mjs`（纯函数，不写仓库文件）
- **不覆盖**：真实无 sharedBlock 席的迁移（S4）；`SIX_METHODS` / `DETECTIVE_RULES` 正文（S4）

### TC-078 replace 幂等恢复（rename 前崩溃：state=replaced、目标仍旧）→ 重跑 replace 成功

- **覆盖**：R6｜§4 步7｜§6-7
- **类别**：边界
- **前置**：仓库副本（`finally` 丢弃）；`state.json` 该席 = `replaced`（模拟「先写 state」已成功）；目标字节 = **替换前旧字节**（≠ 当前渲染，模拟 rename 未执行）；`evidence.lastWrittenHash` = sha256(旧目标)（与目标字节一致）；草稿在副本草稿箱且草稿 == 渲染
- **步骤**：① 构造上述四态；② `replace ... --yes`；③ 读目标 / state / 草稿箱 / evidence
- **预期**：退出码 0；幂等分支不命中（目标 ≠ 渲染）；`TargetDrift` 通过（目标 SHA256 == `lastWrittenHash`）；目标被替换为渲染字节；state 仍为 `replaced`；草稿已清；`lastWrittenHash` 更新为 sha256(渲染)
- **判据**：机器 —— 退出码 0；目标 `Buffer.equals(渲染字节)`；`state` 仍 `replaced`；`draft ls` 无输出；evidence.`lastWrittenHash === sha256(渲染)`；无 `.tmp-` 残留；真实仓库零改动
- **红绿证据**：红 = 把「state=replaced 且目标 ≠ 渲染」误判为幂等并退出 0（目标没替换却清草稿 → 丢内容）/ 或误报 `TargetDrift`（重复替换无法收敛）；绿 = 重跑收敛且目标已是渲染字节
- **测试落点**：`tools/docgen/acceptance/pilot-replace.acceptance.mjs`（副本内执行）
- **不覆盖**：真实进程 kill 时序；rename 后崩溃（TC-074）

## 3 第 1/2 轮评审修复点对账（第 3 轮 14 项定点修复见文件头修订说明）

> 逐族核对「修订版 spec 的修复点是否有用例兜住」。本表只做映射，不复述卡内容（台账在 `.session/reviews/2026-10-19-1936-docgen-p2-s2-pilot/cards.md`）。

### 3.1 第 1 轮评审 19 族

| 族 | 修复点（修订版落地） | 覆盖用例 |
|---|---|---|
| F1 | §3 拆 agentData / triggerTable 两宿主；R2 写明两个写入点 | TC-002、TC-003、TC-004 |
| F2 | 新增 `state.json`；R9 区分「已接管 / 已巩固」；步 5 只登记 | TC-009、TC-034、TC-053、TC-055 |
| F3 | 黄金断言在前 + 整文件比对；删伪 API；断言固定在替换前；TC-033 改可失败 | TC-007、TC-012、TC-014、TC-016、TC-033 |
| F4 | 新增 `sharedBlocks`/`outputFormats`/`renderAgent`；`generate` 对 agent 真渲染 | TC-005、TC-006、TC-019、TC-060、TC-063、TC-064 |
| F5 | 巩固统一为 PRD 6.3 六项（含第 4 项 N/A、第 5 项人工抽查） | TC-013、TC-018 |
| F6 | 计数自有口径 + 取数命令（正 / 边界 / 负三列） | §0、§10（本文件不引 submission 旧数） |
| F7 | 逐条修到可观测量：条目级 `description`、替换前保存草稿字节、残留占位符走整比、可达错误码、具体检索模式 | TC-003、TC-011、TC-032、TC-035、TC-043、TC-051、TC-052、TC-023、TC-024 |
| F8 | 步 1 记四值；替换前重算目标哈希（`TargetDrift`）；黄金断言对 blob 跑 | TC-001、TC-016、TC-017、TC-056、TC-057 |
| F9 | 数据变异 + 模板纯度（模板不得含本席专有正文） | TC-060、TC-061、TC-062 |
| F10 | 导出 `patternRegistry.DOMAIN` 并被句式消费 | TC-003、TC-029 |
| F11 | 本文件不审 submission 证据；§10 只给本文件自己的取数（不引旧稿数字） | §10（完成回报） |
| F12 | 回归清单改指 `agentData.mjs（triggerTable）`；补三条触发；TC-020 用 `-Quiet`/计数 | §4、TC-020 |
| F13 | 「11 席未拆槽；S4 = 12 席、S3 = senior-sdet」 | TC-044、§6、§7 |
| F14 | `{{TOOLS}}` + `join(', ')` 单源 | TC-065 |
| F15 | 账本落点 = PRD §6.6；每条用例给测试落点（无「待 plan Task N」占位） | TC-001、TC-071、全表「测试落点」栏 |
| F16 | 覆盖分母统一为 **38**（算式见 §1）；S1 用例只保留 S2 旅程必经错误路径并补本 spec 锚点 | §1、§6、TC-043/044 |
| F17 | tmp 非 `.md` + 启动清理；draft `wx`；冷跑草稿箱重定向；冷跑理由改述 | TC-048、TC-068、TC-069、TC-070、TC-072 |
| F18 | 引用改为具体代码位置（不引用无定义的内部编号）；删「8 节」改逐节清单 | TC-005、§5、全文引用均落到 `文件:行` |
| F19 | gate 拆 `collectGate()` / `gateChecks()`；写死错误码优先级；按 S1 §5.3 原文表述判别子 | TC-058、TC-059、TC-023、TC-024、TC-035、TC-036 |

**第 1 轮对账结论**：19 族全部有用例兜住，无遗漏族；F6/F11 属「本文件计数与证据口径」类，由 §0 与 §10 承接。

### 3.2 第 2 轮复评 A–L 12 组映射

| 组 | 第 2 轮问题 | 修复点（修订版 3） | 覆盖用例 |
|---|---|---|---|
| A | P0：TC-051 计数自相矛盾（检索含 `agents/` 却预期 1） | 检索范围排除 `agents/<本席>.md`（基准位），只查 `components/`、`templates/`、`scripts/`；三模式同一口径全部预期 1 | TC-051 |
| B | P0：测试内跑 `npm run check` → 无限递归 | §0.1 测试执行模型：需 replace / `npm run check` / 冷跑 / 真实改写的落 `acceptance/*.mjs`；`*.test.mjs` 禁止 spawn `npm run check` | §0.1、TC-012、TC-013、TC-046、TC-048、TC-068、TC-071、TC-072 |
| C | P0/P1：证据载体与 `TargetDrift` 基准 | evidence fixture 八字段（rev4 补 `renderSha256`）；黄金断言读 `commit`；`TargetDrift` 基准 = `lastWrittenHash`；步 4 结果写 `compareResult` | TC-001、TC-012、TC-016、TC-017、TC-033、TC-046、TC-056、TC-073 |
| D | P1：replace 写序、幂等与中断 | 先写 state=replaced 再 rename 目标；`state=replaced` 且目标 == 渲染时更新 `lastWrittenHash` + 清草稿；rename 前崩溃可重跑收敛；TC-069 先落草稿 | TC-011、TC-069、TC-074、TC-078 |
| E | P1：`generate` 与 S1 registered 豁免冲突 | 已拆槽席 `generate` 恒渲染 + 比对；§11 第 3 条 | TC-006、TC-075 |
| F | P1：新增错误码登记 | 新码落 S2 §11 + `validateAgentData.EXIT` 表；补登记完整性用例（rev4 把 `EvidenceInvalid`/`InvalidArgs` 并入扫描集与档位断言） | TC-054、TC-057、TC-076 |
| G | P1：改动真实目标文件 | TC-009/033/034 一律副本内执行 + 确定性构造 + `finally` | TC-009、TC-033、TC-034 |
| H | P1：TC-024 缺 A 的草稿 | 先为 A 落草稿并断言 A 草稿 == A 渲染，再 replace A | TC-024 |
| I | P2：计数与预期错误 | TC-061 用唯一 H1 片段；TC-062 循环 7 条 fixedList；TC-048 不写死 35/35；TC-059 三档分开构造；覆盖口径改写 | TC-048、TC-059、TC-061、TC-062、§1 |
| J | P2：渲染 API 两义 | 纯函数 `renderAgent(agent, trigger, template, sharedBlocks, outputFormats)` / CLI `renderByName(name)` 在用例中写清调用层 | TC-005、TC-006、TC-014、TC-060 |
| K | P2：模板结构与空块 | 删除 `## 共享块`；12 个 H2（5 个在输出格式块内）；空共享块整段消失 | TC-005、TC-019、TC-066、TC-077 |
| L | P2：state 键集/version 与冷跑交付清单 | TC-054 补 version ≠ 1、键 ∉ agentData；TC-048/068/072 按交付清单复制（state / 三新模块 / evidence），不依赖 git 跟踪 | TC-048、TC-054、TC-068、TC-072 |

**第 2 轮对账结论**：A–L 12 组全部有落点、无遗漏；其中 B 的落点包含 §0.1 执行模型本身（不是单条用例）。

## 4 回归清单

> 路径全部落到**真实存在的文件**（`triggerTable` 是 `agentData.mjs` 的具名导出，**不存在** `triggerTable.mjs`）。

| 如果改了 | 必须重跑 | 为什么 |
|---|---|---|
| `tools/docgen/components/agentData.mjs`（条目） | TC-002、TC-003、TC-004、TC-007、TC-008、TC-014、TC-015、TC-016、TC-030、TC-062 | 转录值 / 拆槽是全部比对的前提 |
| `tools/docgen/components/agentData.mjs`（`triggerTable` 导出，行 23-30） | TC-003、TC-008、TC-015、TC-016、TC-021、TC-022、TC-023、TC-025、TC-026、TC-027、TC-075 | when 决定派生 description 与格式校验 |
| `tools/docgen/templates/agent.md.tpl` | TC-005、TC-007、TC-014、TC-031、TC-032、TC-061、TC-065、TC-066、TC-077 | 模板决定渲染字节与槽位结构（含 12 个 H2 与空块语义） |
| `tools/docgen/components/patternRegistry.mjs`（`DOMAIN` / 句式 / 枚举） | TC-003、TC-007、TC-019、TC-029、TC-024、TC-064 | 常量被 13 席共用，改一处影响全体派生 |
| **新增** `tools/docgen/components/sharedBlocks.mjs` | TC-019、TC-063、TC-007、TC-014 | 共享块正文进渲染字节 |
| **新增** `tools/docgen/components/outputFormats.mjs` | TC-019、TC-064、TC-007、TC-014 | 输出格式正文进渲染字节 |
| **新增** `tools/docgen/components/renderAgent.mjs` | TC-005、TC-006、TC-060、TC-062、TC-036、TC-067、TC-075、TC-077 | 渲染入口，纯函数约束与槽位拼装都在它身上 |
| **新增** `tools/docgen/state.json` | TC-009、TC-034、TC-053、TC-054、TC-055、TC-059、TC-072、TC-073、TC-074、TC-078 | 接管状态的唯一载体 |
| **新增** `tools/docgen/fixtures/reviewer-audit.evidence.json` | TC-001、TC-012、TC-016、TC-017、TC-033、TC-046、TC-056、TC-073、TC-074、TC-078 | 步 1/4 证据 + `TargetDrift` 基准（`lastWrittenHash`） |
| `tools/docgen/cli.mjs`（`generate`） | TC-006、TC-012、TC-043、TC-075 | 步 3 的「渲染 + 比对」出口 |
| `tools/docgen/cli.mjs`（`draft` / 草稿箱） | TC-010、TC-037、TC-044、TC-047、TC-070 | 草稿生命周期与拒绝路径 |
| `tools/docgen/cli.mjs`（`replace` / `collectGate` / 判别子 / 优先级 / 幂等） | TC-011、TC-023、TC-024、TC-035、TC-036、TC-038、TC-039、TC-040、TC-041、TC-056、TC-058、TC-059、TC-069、TC-073、TC-074、TC-078 | R6 全部落地在这条路径 |
| `tools/docgen/cli.mjs`（`gate` / `check-agents`） | TC-009、TC-012、TC-013、TC-034、TC-045、TC-048、TC-050、TC-072 | 比对子集与状态驱动 |
| `tools/docgen/components/validateAgentData.mjs` | TC-021、TC-022、TC-025、TC-026、TC-027、TC-052、TC-054、TC-057、TC-076 | when 格式 / 派生等值 / 时时 / 新码 EXIT 表 |
| `tools/docgen/components/compare.mjs` | TC-007、TC-014、TC-030、TC-031、TC-060、TC-067 | `compareBuffers` 签名与 `checkEnvironment` 判据 |
| `tools/docgen/components/baseline.mjs` / `tools/docgen/baseline.json` | TC-009、TC-012、TC-013、TC-020、TC-036、TC-048、TC-071 | 清单与 baseline 字节一致 |
| **`agents/reviewer-audit.md` 本身**（被替换目标） | TC-001、TC-009、TC-011、TC-012、TC-034、TC-045、TC-056、TC-073、TC-074 | 目标即基准与比对对象；任何改动都要重验时序与状态 |
| `docs/prd/20261019093443-docgen-agent-generation.md` §6.6（账本表） | TC-001、TC-071、TC-049、TC-050 | 双哈希 / 停损 / 状态登记处 |
| 冷跑脚本 / 复制清单 | TC-048、TC-068、TC-072 | 复制完整性直接决定冷跑结论可信度 |
| `scripts/check-all.mjs`（gate 调用与 baseline 参数化） | TC-012、TC-013 | 「`npm run check` 全绿」是巩固第 2 项 |

## 5 只手动验证

| 项 | 为什么机器验不了 | 谁验、看什么 |
|---|---|---|
| 替换前后 `agents/reviewer-audit.md` 的观感 | 机器只验字节，不验「读起来还是同一张卡」 | 评审者逐节浏览：frontmatter + 7 个顶层二级节（你是谁 / 共享特质 / 固定必问清单 / 自由探索 / 输出格式 / 通用纪律 / 边界；输出格式块内另有 5 个 H2）+ 可选 `### 审计铁律`，可读性一致 |
| 巩固第 5 项的人工抽查（关键格） | 「这条清单与组件数据一致」需人判语义 | 评审者抽 fixedList 第 4 条，对照 `agentData.mjs` 原文，结论写进账本「巩固证据」列 |
| 连续空行的布局归因 | 整比能判「不等」，但「哪处空白该由模板复现」是设计判断 | 施工者对照快照 L30-31 / L51-53 / L80-81，逐处确认已固化进模板；评审抽查 diff 归因 |
| when 拆槽的语义完整性 | 逐字相等成立不蕴含「触发语义完整」 | 评审者对照 spec §3.2 的 when 值，确认触发子句无截断 |
| 转录字段「零改写」是否夹带润色 | 字节相等只证明没改字；若改后恰好同字节则机器无感 | 评审者通读 identity / fixedList 七条，确认无同义替换 |

## 6 不测（带理由与口径）

| 不测什么 | 为什么 | 口径声明 |
|---|---|---|
| S1 能力机制的实现本身（六子命令语义 / 草稿箱生命周期 / 退出码五档定义 / 拒红过滤的框架 / 已拆槽锚点席的派生） | S1 已覆盖；本 spec 只引用其错误码与命令 | **本文件保留的 S1 错误码用例（TC-037～TC-041、TC-043）只测「S2 旅程必经的错误路径」**，且覆盖列同时锚到 R6，不是重测 S1 机制 |
| 其它议会席迁移（S4 = 余下 12 席，其中 11 席未拆槽 + `reviewer-product` 已拆槽） | 试点只验证模型 | S4 复用本文件 TC-016 的黄金断言口径 |
| `senior-sdet` 转录（S3） | 第二套模板 + 专属句式，边界不同 | S3 独立验收 |
| description 翻译闭环 / 词表 | PRD §1.1 作用域声明，P2 内不执行不验收 | 本文件不设词表断言 |
| gen-agents 退役动作本身 | S1 W8 已完成 | 只验「无残留」（TC-020/051） |
| `baseline --write` 新增席受控旅程 | S1 W5 覆盖 | — |
| skill / rule 生成 | P3 / P4 | — |
| 触发表热更新 / 多语言 / `comp:<Name>` 解析器 | PRD §2 边界 | — |
| 送审说明的机器证据终态（旧稿数字） | 属 submission 文档，不属 testcase 的判定对象 | 本文件**不重复**任何 submission 数字；§10 只给本文件自己的取数 |

## 7 缺口与判别力水位

| 缺口 | 漏检哪类反例 | 至少 1 个样例 | 语义由谁兜 |
|---|---|---|---|
| 假阳性：实现正确却被判错 | 换行/编码类环境差异 | 开发者 `core.autocrlf=true`，工作区快照读出 CRLF → 整比红，实现其实正确 | `checkEnvironment` 先验（BOM/CR/尾换行）+ 建议补 `.gitattributes` 固定 `eol=lf`；TC-067 把该先验变成断言 |
| 假阴性：错了却判对 | 硬编码值恰好等于派生值 | 组件里存了一份 description，且内容与拼装结果逐字相同 → 整比绿、等值断言绿 | 只剩「条目无独立 `description` 字段」断言（TC-003/052 的前半）＋ 模板纯度（TC-061）＋ 代码评审；这是 R8 判别力的真实边界，无法完全机械闭合 |
| 假阴性：替换前目标被手改 | `state` 无条目时 gate 不比目标 | 迁移期有人手改 `agents/reviewer-audit.md` 一字节，`gate` 仍绿（按 R9 设计如此） | 靠 TC-011 的目标哈希复核（`TargetDrift`）与 TC-001 的步 1 记录兜；注意：**只在 `replace` 时兜，日常 gate 不兜** |
| 「已巩固」无法反推是否真替换过 | 字节相同 ↔ 未替换 | 有人手工把文件写成组件渲染字节并把 `state.json` 置 `replaced` | 状态文件是声明式的，不证伪；靠替换路径的 `--yes` + `TargetDrift` + 账本记录共同担保 |
| 并发撞名（同秒两实例 draft）不可确定性复现 | 竞争窗口毫秒级 | 两终端同一秒各跑一次 `draft` | TC-070 用源码 `wx` 静态断言兜底；行为级复现需可注入时钟（建议 #6） |
| 空行布局的字节级复现 | 归因靠人 | 模板少复现一个空行 → 整比红但 `line` 指向模糊 | 整比 + §5 人工逐处核对 |
| 快照字段值本身的权威性 | 快照若在迁移前被手改，转录会把错字固化 | identity 若在迁移前被改过一次，黄金断言仍以它为准 | TC-001 八字段 evidence + 账本留痕 + 施工前评审确认快照干净（无更强机器手段） |
| 第二次稳态替换被 `TargetDrift` 误拒 | 基准若固定用迁移快照 | 第一次替换成功、组件合法改动后第二次 replace 被拒 → 稳态旅程卡死 | TC-073 断言 `lastWrittenHash` 滚动更新 + 反例对照（改回快照哈希 → TargetDrift） |
| 空共享块留下多余空行 | 空串替换不等于「整段消失」 | 无 `sharedBlock` 席渲染出 `## 通用纪律` 与 `## 边界` 之间的连续空行 → 整比红但归因困难 | TC-077 用桩席断言「无 `\n\n\n`」且对照产物含 `### 审计铁律` |
| evidence 未回填仍判验收绿 | `"pending"` 被当成通过值 | 跳过步 4 直接替换，`compareResult` 仍是 `"pending"`，验收脚本若只查字段存在就放行 | TC-012/TC-046 要求 `goldenAssertion`/`compareResult`/`renderSha256` 不是 `"pending"` |
| 模板编码未独立预检（假阳性来源） | 模板带 BOM / CRLF 时无专门错误码 | PowerShell 写出的 `agent.md.tpl` 带 UTF-8 BOM → 渲染产物首字节带 BOM → 整比红，但 `readTemplate`（`cli.mjs:27-32`）不调用 `checkEnvironment`，归因只能靠人 | 整文件比对（TC-007/TC-014）兜底 + §5 人工 diff 归因；建议在 `readTemplate` 处补 `checkEnvironment(buffer, 'template', path)`（属 S1 读取层，未在本轮实现） |
| 字节相同的 D6 绕过无法用 gate 区分 | 手写目标恰好等于当前渲染 | 组件已改、未走 replace，直接手写 `agents/reviewer-audit.md` = 新渲染 → `gate` 绿，与正常替换不可区分 | gate 只做字节比较；靠账本记录 + `replace --yes` 留痕 + 人工评审兜（`state.json` 只声明 replaced，不证伪） |

## 8 自由探索（本 spec 特有的 4 个角落）

| # | 角落 | 为什么最可能出事 | 落到哪 |
|---|---|---|---|
| 1 | 快照的不可变性只靠 git，没有仓内副本 | 浅克隆 / rebase 改写历史 / gc 后提交号失效 → 黄金断言直接不可跑（`GoldenSnapshotUnavailable`），而迁移账本只有哈希没有内容 | TC-057 锁退出码；建议 #2 要求落仓内 fixture |
| 2 | `DOMAIN` 导出但可能不被句式消费 | 只导出常量、函数体仍写死字面量 → 测试绿、单源未建立，未来加席改常量无效 | TC-003 的「传参改变输出」断言 |
| 3 | 冷跑复制清单若只按「git 跟踪文件」会丢未跟踪的 `state.json` / 三新模块 / evidence | 冷跑副本里该席退回 registered → gate 绿但比对空转，巩固第 1 项假绿；或 golden 断言所需证据缺失 | TC-048（四类文件存在）、TC-072（state 值 + gate 报 Mismatch）、TC-068（隔离） |
| 4 | 模板槽位把 `{{DIMENSION}}` 包在括号里，遇到无 dimension 格式的席会留空括号 | S3 的 senior-sdet 若无 dimension，会渲染出 `（…（）` 类残形 | 本 spec 不触（S2 席有 dimension）；建议 #7 提醒 S3 在第二套模板里处理 |

## 9 给开发的建议

> 来源 = 实现观察（`cli.mjs` / `compare.mjs` / `patternRegistry.mjs` / `validateAgentData.mjs` / `agent.md.tpl` / `agentData.mjs`）与修订 spec 联动分析。**不改本文件任何用例**（铁律 2/3）。

| # | 位置（文件:行 / spec 节号） | 风险或盲点 | 为什么会被忽略 | 具体改法 | 优先级 |
|---|---|---|---|---|---|
| 1 | `tools/docgen/cli.mjs:209-227`（`renderAgent`） | `{{FIXED_LIST}}` 只给表头、`{{OUTPUT_FORMAT}}`/`{{SHARED_BLOCK}}` 置空、未消费 `tools` → W1 必红 | 三步改造分散在三个新文件里，容易只做模板不做渲染 | 改成：`tools: agentData.tools.join(', ')`；fixedList 逐行 `\| i \| item \| 待答 \|`；`sharedBlocks[sharedBlock] ?? ''`；`outputFormats[outputKind]` | P0 |
| 2 | `tools/docgen/fixtures/reviewer-audit.evidence.json`（R3 / §4 步 1 与步 7） | 修订版 3 已规定八字段（含 `renderSha256`），但实现必须**真读真写**：步 4 回填 `goldenAssertion`/`compareResult`/`renderSha256`；`lastWrittenHash` 首次 = 迁移快照 SHA256、每次 replace 成功后滚动更新为草稿哈希；SHA256 统一大写 | 建了文件却不回填 / 不滚动更新 / 写成小写，验收读不到步 4 结论，第二次替换被 `TargetDrift` 误拒 | 在步 4 写回三个字段；`cmdReplace` 成功后写 `lastWrittenHash = sha256(草稿字节).toUpperCase()`；`TargetDrift` 比较对象只认该字段（TC-073 已断言滚动语义） | P0 |
| 3 | `tools/docgen/cli.mjs:57-67`（`generate` agent 分支） | 只做存在性检查、不渲染，步 3 的「0=一致 / 1=不等」无从判定；F4 未真正修掉 | 现网 `generate` 一直绿，没人注意它从没渲染过 agent | 已拆槽席**恒**走 `renderAgent` + `compareBuffers`（`generate` 是渲染入口，不受 registered 豁免约束——步 3 时目标本就是 registered）；按 `state` 分流的只有 `gate`/`check-agents` | P0 |
| 4 | §6-5「九步顺序不可跳」在替换前无机器闸门 | 跳过步 4 也能替换成功（`DraftDrift` 只保证「草稿 == 渲染」），只有验收阶段的证据检查能抓 | 都以为 gate 会兜，但 gate 对 registered 席不比对 | 把黄金断言内联进 `replace`（写入前用 fixture 的 blob 验一次描述），或在 `replace` 输出里强制打印步 4 证据的引用；二者取一即可机器化 | P1 |
| 5 | `tools/docgen/components/validateAgentData.mjs:4-19`（`EXIT` 表） | 新增码 `TargetDrift` / `StateFileInvalid` / `GoldenSnapshotUnavailable` / `EvidenceInvalid` 未落表 → `exitCodeFor` 抛错，`cli.mjs:250-252` 兜底成 2，`TargetDrift` 的「应 exit 1」被静默改档；既有码 `InvalidArgs` 也需一并登记 | 兜底分支让错误码看起来正常，测试若不查 stderr 就发现不了 | 按 **S2 §11 + `validateAgentData.EXIT`** 先落表（`TargetDrift` 1；其余四码 2）再使用；TC-076 已把「每个已用码都能 `exitCodeFor` 而不抛」变成断言 | P0 |
| 6 | `tools/docgen/cli.mjs:142`（`ts()`）与 `:172`（draft 写） | 时间戳取系统时钟，同秒撞名无法确定性复现 → `wx` 分支永远测不到 | 没有注入点，测试只能靠静态断言 | 提供可注入时钟（如 `DOCGEN_FAKE_NOW`）或允许 `ts` 作为参数传入；写入改 `{ flag: 'wx' }` 并把 `EEXIST` 映射为 `DraftNameConflict` | P1 |
| 7 | `tools/docgen/templates/agent.md.tpl:7` 与 `agent-handwritten.md.tpl:7` | 标题行 `# 角色：{{ZH_NAME}}（{{DIMENSION}}）`：senior-sdet 无 `dimension`，`renderAgent` 用 `?? ''` 会渲染出空括号 | S2 只看这一席（有 dimension），S3 才会撞上 | 第二套模板去掉 dimension 括号（或改成条件化标题）；`agent-handwritten.md.tpl:4` 的 `tools` 硬编码也应改 `{{TOOLS}}` | P2 |
| 8 | `tools/docgen/cli.mjs:192`（tmp 后缀）与 `:110-113`（`.md` 扫描） | tmp 用 `.md` 后缀 → 中断残留被 `UnregisteredHandwritten` 判红，且无清理入口 | 中断场景少见，本地复现一次就永久红 | 后缀改 `.part`（非 `.md`），`replace` 启动先 `rm` 同前缀残留；TC-069 已按此写 | P1 |
| 9 | `tools/docgen/components/patternRegistry.mjs:4` | `'议会评审'` 写死在函数体，无导出常量，改字要考虑全局却无处可改 | 只有一行，看起来无所谓 | 导出 `DOMAIN` 并让 `parliament` 以默认参数消费；TC-003 会验证「传参改变输出」 | P1 |
| 10 | `tools/docgen/components/validateAgentData.mjs:53-61` | 断言 8 只查「时时」，**没有**「渲染 description === 句式拼装」等值比较 → R8 的 W4 断言实际未实现 | 「时时」断言看起来已经守住了 description | 补等值比较（渲染值 vs 拼装值），不等 → `DescriptionDerivation`；否则 TC-052 的第 ③ 步无从触发 | P0 |
| 11 | `tools/docgen/cli.mjs:122-133`（`check-agents`） | 未巩固计数无条件 `+1`，全部 14 席恒算未巩固；无 `state` 读取 | 输出看起来合理（14 席都未迁），S2 后会静默错 | 按 `state.json` 分流：`replaced` 逐字节 + 不计未巩固；`suspended`/registered 只查存在并计入未巩固 | P0 |
| 12 | `tools/docgen/cli.mjs:74-114`（`gateChecks`） | `fail()` 即抛，拿不到完整漂移清单 D，判别子无法判定；错误码优先级无处表达 | 恒绿 gate 下从没需要过 D | 拆 `collectGate()`（收集 `{code,path}`，不抛）+ `gateChecks()`（按优先级抛）；`cmdGate`/`cmdReplace` 两个调用点分别用 | P0 |
| 13 | 冷跑复制清单（spec §6-8） | 若冷跑脚本只复制「git 跟踪文件」，未跟踪的 `state.json` / 三新模块 / evidence 会丢 → 副本退回 registered、比对空转，巩固第 1 项假绿 | 人们默认「git 跟踪 = 仓库全部」，而 state.json 是运行期新增文件 | 冷跑按 §6-8 交付清单复制：git 跟踪文件 ∪ 本轮新增文件（`state.json`、`sharedBlocks.mjs`、`outputFormats.mjs`、`renderAgent.mjs`、`fixtures/*.evidence.json`），**不以 git 跟踪为前提**；副本加「四类文件存在 + state 值正确」断言（TC-048/TC-072） | P0 |

## 10 完成回报

**用例计数**（口径见 §0；实测取数见下表）：

| 项 | 值 | 取数方式 |
|---|---|---|
| 用例总数 | 77 | 用例明细里 `### TC-` 标题数（TC-001～TC-041、TC-043～TC-078；TC-042 作废不计） |
| 正例 | 30 | 明细中 `- **类别**：正例` 行数 |
| 边界 | 14 | 明细中 `- **类别**：边界` 行数 |
| 负例 | 33 | 明细中 `- **类别**：负例` 行数 |
| 负例 + 边界 | 47 | 33 + 14，**≥ 正例 30**（合格） |

**实测取数（本环境无 shell，用 Grep 工具等价 `grep -c`，结果与上表一致；评审可用 §0 的 node 命令复算）**：

```text
pattern "^- \*\*类别\*\*：正例"      → 30 行
pattern "^- \*\*类别\*\*：边界"      → 14 行
pattern "^- \*\*类别\*\*：负例"      → 33 行
pattern "^### TC-"                    → 77 行
pattern "^\| (R[0-9]|W1-|§)"          → 38 行（覆盖总表）
```

**覆盖项总数与覆盖数**：

- 覆盖项总数 = 12（R1–R12）+ 5（W1-1～W1-5）+ 4（§3.1–§3.4）+ 9（§4 步1–步9）+ 8（§6-1～§6-8）= **38**。
- 覆盖数 = **38/38**（§1 每行「覆盖用例」列均非空；未覆盖 0）。

**本文件新增用例（第 2 轮，A–L 12 组）：**

| 编号 | 主题 | 修复组 |
|---|---|---|
| TC-073 | `TargetDrift` 基准 = `lastWrittenHash`：首次快照 / 第二次稳态替换放行 | C、I |
| TC-074 | replace 幂等恢复（rename 后、evidence 更新前崩溃 → 更新 `lastWrittenHash` + 清草稿） | D |
| TC-075 | registered 但已拆槽席的 `generate` 仍渲染 + 比对 | E |
| TC-076 | 错误码登记完整性（`exitCodeFor` 不抛 + 档位一致） | F |
| TC-077 | 无 sharedBlock 席的空块语义（不留下多余空行） | K |

**本文件新增用例（第 3 轮，rev4 定点 14 项）：**

| 编号 | 主题 | 对应定点项 |
|---|---|---|
| TC-078 | replace 幂等恢复（rename 前崩溃：`state=replaced`、目标仍旧、`lastWrittenHash=旧值` → 重跑 replace 成功） | 第 2 项 |

**上一轮（第 1 轮，F 族）新增用例（保留原编号与含义）：**

| 编号 | 主题 | 修复族 |
|---|---|---|
| TC-053 | `state.json` 形状 / 值域 / 唯一写点 | F2、F19 |
| TC-054 | `StateFileInvalid`（exit 2） | F2、F18 |
| TC-055 | `suspended` 存在性检查 + 逐字节豁免 | F2、F19 |
| TC-056 | `TargetDrift`（写入前哈希复核 + 三样保留） | F8、F19 |
| TC-057 | `GoldenSnapshotUnavailable`（git show 失败 exit 2） | F8、F18 |
| TC-058 | `collectGate()` 收集完整漂移清单 D | F19 |
| TC-059 | 错误码优先级三阶梯 | F19 |
| TC-060 | `renderAgent` 纯函数零 fs | F4、F9 |
| TC-061 | 模板纯度（该席专有文本不进模板） | F9 |
| TC-062 | 数据变异（只改该处输出） | F9 |
| TC-063 | `AUDIT_RULES` 共享块载体 | F4 |
| TC-064 | `audit` 输出格式载体 | F4 |
| TC-065 | `{{TOOLS}}` 单源 | F14 |
| TC-066 | `{{FIXED_LIST}}` 7 行渲染 | F4 |
| TC-067 | 渲染字节环境约束 | F3、F9 |
| TC-068 | 冷跑隔离（无 `.git` / 草稿箱重定向 / 不跑黄金断言） | F17 |
| TC-069 | tmp 残留（非 `.md` + 启动清理） | F17 |
| TC-070 | draft 独占写 `wx` | F17 |
| TC-071 | 迁移账本行六列 + 状态一致 | F15 |
| TC-072 | 冷跑副本必须携带 `state.json` | F17、F2（本文件自由探索新增） |

**删除 / 作废的旧版用例**：

| 编号 | 原因 |
|---|---|
| TC-042（旧：`replace` 目标在替换白名单外 → `InvalidOutputPath`） | **不在 S2 重复测（spec §11 第 4 条）**：当前 S1 实现 `cli.mjs:191` 直接 `join`、未经 `assertInside`，该分支不可达；用现状实现否定已定稿规格不可接受，必须显式记账而非静默作废。归属 = S1 实现补 `assertInside` 或 S1 spec 明确移除该分支（用户裁决）。不设替代号。 |

（除 TC-042 外，旧号 TC-001～TC-041、TC-043～TC-072 全部保留原含义，只修判据 / 落点；TC-073～TC-078 为近两轮新增。）

**仍存在的缺口及为何可接受**：

| 缺口 | 为何可接受 |
|---|---|
| 硬编码 description 且值恰好等于派生值 → 机器静默 | 三重兜底使该场景需要「刻意构造巧合」：条目字段断言（TC-003/052）+ 模板纯度（TC-061）+ 代码评审；完全机械化需要「数据来源追踪」，超出本轮范围 |
| 同秒并发撞名无行为级复现 | 需可注入时钟（建议 #6）；已用源码 `wx` 静态断言兜底，且「旧稿检查」已覆盖串行重复 |
| 迁移前 registered 席手改不被日常 `gate` 发现 | 这是 R9 的设计边界（比对子集只含 `replaced`）；`TargetDrift` 在替换时兜，账本留痕；若要日常兜需把「待接管席」也纳入比对，与 S1 registered 口径冲突，不在本轮 |
| 空行布局 / 观感的归因 | 整比已保证字节正确，归因属人工（§5），不影响验收判据 |
| 快照在迁移前已被手改的情形 | 机器无法区分「原文」与「被手改的原文」；由 TC-001 八字段 evidence 留痕 + 施工前评审确认快照干净兜底 |
