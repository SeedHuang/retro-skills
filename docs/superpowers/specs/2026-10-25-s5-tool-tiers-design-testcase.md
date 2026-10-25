# 测试用例：S5 工具档位（`producer`）

> 归属 spec：`docs/superpowers/specs/2026-10-25-s5-tool-tiers-design.md`（**v4** 内容：P-1～P-8 / V-1～V-10 / F1～F14 / D1～D11；split from `docs/prd/20261024073606-dev-workflow-mainline/index.md` 2026-10-24，§12 S5 行 / §9 / D-14 / D-17 / D-18）
> 编写者：`senior-sdet`（**独立子代理，全新上下文**）｜**独立性声明**：编写者 ≠ spec 作者、≠ 施工者；本文件只按 spec v4 + 验收锚点（V-1～V-10、F1～F14、P-1～P-8）+ 仓库现状设计用例，不从实现倒推放宽判据；编写者不修改 spec、不写实现代码。
> 修订记录：v4-t 由主 agent 做 4 处文本收口（B05 cli 路径前缀归一 / B07 取最新条 / B02→B03 FORBIDDEN_PATHS 单源 / A07 六工具口径）；2026-10-24 由 senior-sdet 在全新上下文复核并按测试评委意见修订 9 处（含 P0「由用户执行」假阳性、③ 路径补至 23 条、B05 正向回归样例、D10 正则归一）；2026-10-24 由 senior-sdet 按 spec §3.3「同源硬约束」（spec:149）给 B06 增第 ④ 步（证据表静态断言），切片下界取「同源硬约束」而非「为什么审计只签转录」——后者会把该句里的反面样例（含裸 `git status`）算进表内命令，导致正确 spec 也判红（改前 spec 该三行已全带 `--no-optional-locks`，用原下界必假阳性）；**2026-10-24 第 7 轮：B07 标题同步；B06 扩 diff 动词并新增 ④-b（判者表 + V-8 反例扫描）；`FORBIDDEN_PATHS` 23 项口径（泛词合写 + `spec / plan` 改正则）；B05 切分区间收窄到 ④ 段 + 下界改派生 + 补应拒反例；helper 实现前移为「共用前提（P0 前置）」；B06 路径常量化 + §4 回归清单补一行。**
> 版本：**v4**｜编写日期：2026-10-24｜**2026-10-24 按用户裁定收范围：`research` → S5-R，检测脚本 / CLI B3 门 / 账本模板 → S5-B**（spec v4 §2 / §3.4 / §10 拆出项）｜状态：草稿（**定稿 = 每条用例五要素齐全 + 覆盖总表与 spec 验收项一一对应 + 负例/边界 ≥ 正例**）
> 命名与落点：按 `spec-testcase-gate` 规则判据 1 —— 与 spec 同目录、文件名 = spec 去掉 `.md` + `-testcase.md`。
> **用例 ID 前缀**：本文件统一用 `S5-TC-`。既有测试已占用 `test('TC-` 前缀（例：`tools/docgen/test/dev-workflow-rule.test.mjs:11` 的 `TC-A07`），同名不同义会误导。
> 判据口径声明：本文件所有「判据」要么是「命令 + 退出码 + 关键输出」、要么是可直接照抄的 `assert.*` 表达式；「功能正常」「符合预期」一律不算判据。每条用例标注**来源**：`spec 推导` 或 `实现观察（补充）`；后者只进 §8 建议，不改写 spec 推导用例。

## 0 判据基线（读用例前先认这 11 个事实，全部来自仓库现状，可复核）

| # | 事实 | 出处 |
|---|---|---|
| 1 | **改前现状**只有三档 `readOnly` / `sdet` / `command`；两席按席名三元分派 | `tools/docgen/components/patternRegistry.mjs:30-35`、`agentData.mjs` 尾部 map、`validateAgentData.mjs` 断言 4 |
| 2 | `ToolsViolation` = **集合恰等**（允许集 ⊆ 实际 且 实际 ⊆ 允许集），不是字符串/顺序相等 | `validateAgentData.mjs:40-50` |
| 3 | 卡面 tools 行 = `tools.join(', ')`，**顺序即卡面顺序**，故顺序漂移会被 `gate` 逐字节抓住 | `renderAgent.mjs` |
| 4 | `gate` 打 `baseline N/N`，N = `BASELINE_RULES.length + agentPaths().length`（当前 22 + 15 = 37，只作说明，不作断言常量） | `tools/docgen/components/baseline.mjs`、`scripts/check-all.mjs:101` |
| 5 | `changes[]` 条目字段 = `from/to/at/rejudged/judgeMode/judged[/judgedBy]/machineChecks`；`judgedBy` 来自 `DOCGEN_JUDGED_BY`，缺则拒写盘 | `cli.mjs:278-300`、`:451-483` |
| 6 | **幂等短路排在凭证 / 重判 / 判者三门前**：盘上 == 渲染 → exit 0、`changes` 不追加、不校验凭证 | `cli.mjs:425-432`（`已替换（幂等恢复）` 在 `:430`） |
| 7 | 旁席 `Mismatch` 只有在草稿箱里存在与渲染相同的旁席草稿时才被放行 | `cli.mjs:396-413` |
| 8 | `npm run check` 的 A 组覆盖集 = `state.json` 中 `replaced` 的席（不是 `agentData.length`） | `scripts/check-all.mjs:124-159`、`tools/docgen/state.mjs:7` |
| 9 | 三处流程文档现行写「已授 `command` 档」，实测行号 | `skills/parliament/references/debate-protocol.md:17`、`skills/parliament/assets/round-check.md:21`、`skills/dev-workflow/references/stage-4-quality.md:28`（与 spec §11.3 D9 行号一致） |
| 10 | `counterProbes(files)` **已导出**，但其内部 `noComment` / `noString`（剥注释 / 剥单引号串）**未导出** | `tools/docgen/test/support/dev-workflow-checks.mjs:187-201` |
| 11 | 侦探卡第 4 项固定清单现为 `git --no-optional-locks status --porcelain`；两卡边界节由 `renderBoundary(席)` 渲染（旧常量 `BOUNDARY_COMMAND` 已删，`patternRegistry` 只保留 `boundaryBySeat`，其值即渲染结果） | `agents/detective-observer.md:21` / `:52-59`、`agents/reviewer-audit.md:93-100`、`components/renderBoundary.mjs`、`components/patternRegistry.mjs:31-34` |

**测试文件落点约定**：新用例聚在 `tools/docgen/test/tool-tiers.test.mjs`（spec P-6 已定名）；「改旧断言」类用例落在原文件（`pilot-data` / `pilot-render` / `validate` / `review-fixes`）。凡需改动盘上文件才能构造的场景，一律在 `withRepoCopy()` 副本内执行（`tools/docgen/test/support/dev-workflow-checks.mjs:211-230`：`withRepoCopy` / `runCli` / `runEsm`），**不得触碰真仓库**。

### 0.1 v4 范围收缩对照（本轮删除项 → 去向）

> 本表左列的用例编号**一律是 v3 编号**；v4 §2 中的同名编号可能另有含义（如 v3-B09 是 `touchedSemanticKeys` 用例，v4-B09 是 B3 pending 用例）。检索旧编号时以本节为界。

| # | v3 内容 | v4 处置 | 去向 / 理由 |
|---|---|---|---|
| 1 | `S5-TC-A02`（`tools.research` 逐字五元组 + research 席 boundary） | **删除** | `research` 拆 S5-R（spec §3.4）；A01 不再判 research 是否存在 |
| 2 | `S5-TC-A05` 第 ④ 条「未挂载档位恰为 `['command','research']`」 | **改写** | 按 spec §8 V-2 口径：豁免集 = `[defaultTier, 'command']`，且 `command` 必须是 `tools` 真键（A04） |
| 3 | `S5-TC-D08`（`research` 多一个 `Write`） | **删除** | 无 `research` 档可测；V-1 判别力由 A01（producer 六元组）与 A07（工具名白名单）承担 |
| 4 | `S5-TC-B09`（`touchedSemanticKeys` 边界 → B3） | **删除** | CLI B3 触达门拆 S5-B（spec §2 / §10） |
| 5 | `S5-TC-B10`（漏 `--rejudge` → `UnapprovedChange`） | **删除** | 同上；spec §4「限度」明写无机器门，只靠 V-8 与审计 |
| 6 | `S5-TC-B17`（`verdict !== 'pass'` → 拒写盘） | **删除** | CLI 结论门拆 S5-B |
| 7 | `S5-TC-C07` / `C08`（`session-snapshot` 脚本） | **删除** | 检测脚本拆 S5-B；本 spec 只写「检测限度」（§3.3⑤） |
| 8 | `S5-TC-E08` 的 `progress.md` 段二/段三指针 + `round-check.md` 第 6/7 项 | **删除断言** | 账本模板改造拆 S5-B；只保留 spec V-9 的字面要求 |
| 9 | `S5-TC-E09` 第三条接班条目 | **新增/改写** | spec v4 V-10 要求三条接班条目（research → S5-R / 精算师取数权 → S2 / S5-B） |
| 10 | v2 / v3 两轮修复对照表（30 行，含已删用例编号） | **并入本节并从正文移除** | 各用例的「来源」字段已保留轮次出处；被删用例的修复历史见 git 历史（本文件 v3 版本），避免正文残留失效编号 |

**重编号**：删除后按组内顺序重排，`S5-TC-` 前缀不变。A 11→10、B 17→14、C 10→8、D 11→10、E 9→9，合计 **51**（明细见 §1 / §9）。

## 1 覆盖总表

| 用例 ID | 覆盖的 spec 条目 | 一句话场景 | 类型 | 层级 | 判据类型 | 执行方式 | 优先级 |
|---|---|---|---|---|---|---|---|
| S5-TC-A01 | V-1 / P-1 / §3.1 / F8 | `tools.producer` 逐字六元组 + 四档必需项在位 | 正 | 单元 | 机器 | `node --test tools/docgen/test/tool-tiers.test.mjs` | P0 |
| S5-TC-A02 | V-2 / P-1 / §3.2 / F6 | `tierBySeat` 三席必需映射 + 每值合法 + `defaultTier` | 正 | 单元 | 机器 | 同上 | P0 |
| S5-TC-A03 | V-2 / P-3 / §5 / F5 | `boundaryBySeat` 两席 + 每值非空 + 键须为真实席；`DECLARED_SLOT_SEATS` 由它派生 | 正 | 静态 + 单元 | 机器 | 同上 | P0 |
| S5-TC-A04 | V-2 / §3.1 / §3.2 / F2 / F14 | 三席字面档位 + 每席 tools 落在某个已知档位数组 + 未挂载档位仅 `defaultTier` / `command` | 正 | 单元 | 机器 | 同上 | P0 |
| S5-TC-A05 | V-2 / P-2 / P-3 / F5 | 代码探针：两文件只调 `toolsForSeat(`，不直接读 `patternRegistry.tools` | 正 | 静态 | 机器 | 同上 | P0 |
| S5-TC-A06 | V-2 / §3.2 / F6 | 命名守卫对 `''` / `'Producer'` / `'ghostTier'` 三种坏值必须抛错 | 负 | 单元 | 机器 | 同上 | P0 |
| S5-TC-A07 | V-1 / §3.1 / F1 / F14 | 工具名白名单（拼错 / 大小写 / 残留 `WebFetch` 即红，判别力样例） | 边界 | 单元 | 机器 | 同上 | P1 |
| S5-TC-A08 | V-2 / §3.2 未登记席回落 | 席名大小写敏感：`toolsForSeat('Reviewer-Audit')` = `readOnly` | 边界 | 单元 | 机器 | 同上 | P1 |
| S5-TC-A09 | V-2 / §3.2 原型链键名 / F6 | `constructor` / `toString` / `hasOwnProperty` 均回落 `readOnly` | 边界 | 单元 | 机器 | 同上 | P0 |
| S5-TC-A10 | V-2 / §3.2 默认拒绝 / F2 | A02 的 `defaultTier === 'readOnly'` 判据有判别力（构造值即红 + 改默认值真的扩大权限） | 边界 | 单元 | 机器 | 同上 | P0 |
| S5-TC-B01 | V-3 / P-5 / §11.3 D5 / D6 | 两卡 frontmatter tools 行逐字六元组 | 正 | 集成 | 机器 | 读文件断言 | P0 |
| S5-TC-B02 | V-3 / §3.3①②③④⑤ / §4 T-2 / F3 / F13 | 审计边界节五段齐 + `assertBoundaryClean` + 允许写切片含 `round-check` 不含 `progress.md` + 禁止段两条「不得写」 | 正 | 集成 | 机器 | 读文件断言 | P0 |
| S5-TC-B03 | V-3 / §3.3①②③④⑤ / §4 T-3 / F3 / F13 | 侦探边界节五段齐 + 允许写切片含 `detective.md` 不含 `progress.md` / 新建快照 + 禁止段两条「不得写」 | 正 | 集成 | 机器 | 读文件断言 | P0 |
| S5-TC-B04 | V-3 / §4 T-1 / P-4 | 审计卡「输出格式」含「已授 producer 档」、不含「已授 command 档」且单源 | 正 | 集成 | 机器 | 读文件断言 | P0 |
| S5-TC-B05 | V-3 / §3.3④ / F9 | 以「**禁止**」为界：允许段白名单 + 禁止段点名（含环境变量赋值、`node -e`）+ 允许段无裸 `draft` | 正 | 集成 | 机器 | 读文件 + 正则 | P0 |
| S5-TC-B06 | V-3 / P-2 / §4 T-4 / F9 | 侦探固定清单第 4 项含 `--no-optional-locks status`（数据侧 + 卡面） | 正 | 集成 | 机器 | 读数据 + 读文件 | P0 |
| S5-TC-B07 | V-8 / §4「判者」/ F7 / F10 | `changes[]` 中取 `to === renderSha256` 的全部条目（≥1 条取最新）的 B3 落账四字段（三处一致归人工） | 正 | 集成 | 机器 | 读 JSON fixture | P0 |
| S5-TC-B08 | V-3 / §3.3 / §11.3 D3 / F3 | 真实 `agentData` 的 producer 席 `boundary === renderBoundary(席)` 且不含完整旧句 | 负 | 单元 | 机器 | 单元断言 | P0 |
| S5-TC-B09 | V-8 / §4「时效」/ §6 步骤 5-6 / F10 | B3 `pending` → 拒写盘；写回 `pass` 后落盘；`rejudge-<席>-B3.md` 四字段 | 负 | 集成 | 机器 | 副本内 `runCli` | P0 |
| S5-TC-B10 | V-8 / §4「判者」/ F10 | 缺 `DOCGEN_JUDGED_BY` → `UnapprovedChange` exit 4 且不写盘 | 负 | 集成 | 机器 | 副本内 `runCli` | P0 |
| S5-TC-B11 | V-8 / §7 F7 | 盘上已变但 `lastWrittenHash` 未更新 → `TargetDrift` exit 1 | 负 | 集成 | 机器 | 副本内 `runCli` | P1 |
| S5-TC-B12 | §6「中途不得」/ V-8 | 盘上 == 渲染 → 幂等短路 exit 0、`changes` 不追加 | 边界 | 集成 | 机器 | 副本内 `runCli` | P0 |
| S5-TC-B13 | V-3 假阳性 / 假阴性守卫 / §3.3② | 正文合法提及旧短语不误红；`assertBoundaryClean` / `writeScopeHalves` 与 B02/B03 共用且双向样例 | 边界 | 集成 | 机器 | 读文件 + 构造文本 | P2 |
| S5-TC-B14 | V-3 / F3 | 半改态（tools 六元组 + `DEFAULT_BOUNDARY`）渲染矛盾必须被探针抓到 | 边界 | 单元 | 机器 | 渲染 + 断言 | P0 |
| S5-TC-C01 | V-4 | `gate` exit 0 且输出 `baseline N/N`（N 由基线清单派生） | 正 | 集成 | 机器 | `runCli(gate)` | P0 |
| S5-TC-C02 | V-6 / V-2 / P-2 | 逐席 `tools` = `toolsForSeat`；`tierOf` ∈ `tools` 键；producer 席卡面逐字 | 正 | 集成 + 单元 | 机器 | 读文件 + 单元 | P0 |
| S5-TC-C03 | V-4 / F4 | 往卡注入一字节 → `gate` exit 1、`Mismatch` | 负 | 集成 | 机器 | 副本内 `runCli` | P0 |
| S5-TC-C04 | V-4 | 两卡 `diff` 报零差异（盘上 == 渲染） | 正 | 集成 | 机器 | `runCli(diff)` | P0 |
| S5-TC-C05 | V-4 / V-3 | 只改 `producer` 数组顺序（集合不变）→ 校验绿、`gate` 红 | 边界 | 集成 | 机器 | 单元 + `runCli(gate)` | P0 |
| S5-TC-C06 | V-4 幂等 / 重入 | 连跑两次 `gate` 输出一致、盘上哈希不变 | 边界 | 集成 | 机器 | `runCli(gate)` ×2 | P1 |
| S5-TC-C07 | §6 步骤 10 / V-4 / V-6 | `npm run check` 全绿；覆盖席数 = state 中 `replaced` 席数且 `≥1 且 ≤ agentData.length` | 正 | e2e | 机器 | `npm run check` | P0 |
| S5-TC-C08 | §6 步骤 2 / F4 | 只生成一席草稿 → 旁席 `Mismatch` 挡住 replace | 负 | 集成 | 机器 | 副本内 `runCli` | P1 |
| S5-TC-D01 | V-7 / F2 | readOnly 席加 `Write` → `ToolsViolation` | 负 | 单元 | 机器 | `validateAgentData` | P0 |
| S5-TC-D02 | V-7 / V-2 默认档 | 未映射席带 `WebSearch` → `ToolsViolation` | 负 | 单元 | 机器 | 同上 | P0 |
| S5-TC-D03 | V-7 / §3.2 返回值 | 已挂 producer 席注入 `WebSearch` → `ToolsViolation`，且不连带同档另一席 | 负 | 单元 | 机器 | 同上 | P0 |
| S5-TC-D04 | V-7 / V-6 / F2 | `producer` 六元组整档挂给 readOnly 席 → `ToolsViolation` | 负 | 单元 | 机器 | 同上 | P0 |
| S5-TC-D05 | V-7 假阳性 | producer 席 tools 顺序打乱 → 必须判绿（集合恰等） | 边界 | 单元 | 机器 | 同上 | P0 |
| S5-TC-D06 | V-7 缺口探针 / G-2 | tools 含重复元素 → 当前仍通过（缺口显式记账） | 边界 | 单元 | 机器 | 同上 | P2 |
| S5-TC-D07 | V-7 / §2「不做什么」/ §4 末段 | `senior-sdet` 加 `RunCommand` → `ToolsViolation` | 负 | 单元 | 机器 | 同上 | P0 |
| S5-TC-D08 | V-3 / §11.3 D3 / F3 | producer 席 boundary 删键 / 空串 / 全空格 × 全部 producer 席 → `DescriptionDerivation` | 负 | 单元 | 机器 | 同上 | P0 |
| S5-TC-D09 | §3.2 返回值 / G-4 | tools 冻结后 validate / render 不抛，共享数组长度不变 | 边界 | 单元 | 机器 | 同上 | P2 |
| S5-TC-D10 | §5 展开顺序 / F3 | 条目自带 tools 的展开顺序后门：`...s` 在 `toolsForSeat` 之后（允许拆行）+ 外来 tools 被拒 | 负 | 静态 + 单元 | 机器 | grep + 单元 | P1 |
| S5-TC-E01 | V-5 / §11.3 D7 / P-6 | `pilot-data.test.mjs` 两处 tools 改六元组；`:45` 标题不再写「command 档」 | 正 | 静态 | 机器 | grep + 跑文件 | P0 |
| S5-TC-E02 | V-5 / §11.3 D7 | `pilot-render.test.mjs` tools 行正则改为六元组 | 正 | 静态 | 机器 | grep + 跑文件 | P0 |
| S5-TC-E03 | V-5 / F12 / P-6 | `validate.test.mjs` 标题去档位计数、按 `tools` 派生；`isTierCountLine` 判别力样例 | 正 | 静态 | 机器 | grep + 判别力样例 | P0 |
| S5-TC-E04 | V-5 / F12 | 全仓测试零硬编码档位数量（同一 `isTierCountLine`）+ 旧计数注释守卫 + 样例行不自伤 | 负 | 静态 | 机器 | 全仓扫描 | P0 |
| S5-TC-E05 | V-1 / F8 / §2「不做什么」 | `tools.command` 四元组仍在、`renderBoundary('reviewer-audit')` 非空且 `=== boundaryBySeat['reviewer-audit']` | 正 | 单元 | 机器 | 单元断言 | P0 |
| S5-TC-E06 | V-5 / V-7 / §11.3 D8 | `review-fixes` I5 样本必须是运行时 `readOnly` 席（不是 `data[0]`） | 负 | 单元 + 静态 | 机器 | 单元 + grep | P1 |
| S5-TC-E07 | V-4 / F12 | `gate` 的 `N/N` 由基线清单派生，测试里不出现字面 `37/37` | 边界 | 集成 | 机器 | 单元 + 全仓扫描 | P1 |
| S5-TC-E08 | V-9 / P-7 / F11 | `skills/` 全树无「已授 command 档」+ 三处流程文档含「已授 producer 档」 | 正 | 静态 | 机器 | grep | P0 |
| S5-TC-E09 | V-10 / P-8 / §11.3 D10 / F14 | `open-items.md` 无 `\| B-5 \|`；B-1 换成三条接班条目；仍标未决 | 正 | 静态 | 机器 | 读文件断言 | P1 |

**覆盖核对**：spec 验收项 **V-1～V-10 共 10 条 → 全部有机器用例**。失败面 **F1～F14 共 14 条 → 全部有对位**（F13 的模板改造半属 S5-B，本 spec 只约束写权，由 B02 / B03 / B13 覆盖文本层）。交付物 **P-1～P-8 共 8 条 → 全部对位**：P-1→A01-A04、P-2→A05 / B01 / B06 / C02、P-3→A03 / A05 / D08、P-4→B04、P-5→B01-B04 / B07、P-6→E01-E06、P-7→E08、P-8→E09。

### 1.1 共用前提（P0 前置）：B02 / B03 / B05 / B13 的共享实现

> **本节是 B02 / B03 / B05 / B13 的共享实现，须随 P0 用例同批落地。** 若把这三个符号留在 B13（P2）正文里、按优先级先落 P0，B02 / B03 会直接 `ReferenceError`——故实现不属于 B13 的 P2 范围，B13 只保留双向样例与判别力说明。
> 三个符号一律在 `tools/docgen/test/tool-tiers.test.mjs` **模块顶层声明一次**，不得抄进各自的 `test()` 回调（在某个 `test()` 里另声明，别的 `test()` 引用不到即 `ReferenceError`）。

```js
// ── ③ 路径单源（spec §3.3③ 逐项点名，共 23 条）──────────────────────────────
// **不手抄**：路径清单唯一来源 = S6 定义层 `tools/docgen/policy/definitions/paths.mjs`
// （S6 spec §3.2 / §3.6：S5 testcase 的手抄清单改为派生，否则本文件自己就是第 4 份副本）。口径写死：
//   **21 个数组元素 + 1 个 `pattern` 项 = 22 个定义层点名；卡面 23 项**
//   （`代码、测试` 按 `、` 再切出两项，+ `spec / plan`）。
//   · `代码、测试` 在定义层就合写一条（与 spec §3.3③ 原文同形），故 `FORBIDDEN_PATHS` 是 21 项而非 22 项；
//     拆成单字「代码」「测试」会变成恒真的泛词（任何卡片正文都含这两个字），失去判别力。
//   · `spec / plan` 不进数组（定义层以 `FORBIDDEN_SPEC_PLAN.pattern` 正则源串表达）：实现若写成
//     `spec/plan`（无空格）时数组 `includes` 会误红，改由正则判。
import { pathGroups } from '../policy/definitions/paths.mjs';   // 相对 `tools/docgen/test/tool-tiers.test.mjs`
const FORBIDDEN_PATHS = Object.values(pathGroups).flat();      // = 21 个数组元素（定义层派生）
const pathTokens = () => [...FORBIDDEN_PATHS.flatMap((x) => x.split('、')), 'spec / plan'];   // = 卡面 23 项
const FORBIDDEN_SPEC_PLAN = /spec\s*\/\s*plan/;   // ③ 第 6 项，B02 / B03 各断言一次（与定义层 `FORBIDDEN_SPEC_PLAN.pattern` 同形）

function assertBoundaryClean(text, label = '') {
  const marks = [...text.matchAll(/^## 边界$/gm)];
  assert.equal(marks.length, 1, `${label} 边界节必须恰 1 处`);
  const sec = text.slice(marks[0].index);
  assert.equal(/你是只读评审角色：不得创建、修改、删除任何文件/.test(sec), false, `${label} 完整旧结论句残留`);
  assert.equal(sec.includes('不创建、修改、删除任何文件'), false, `${label} 边界节仍含无条件裸短语`);
  return sec;
}

function writeScopeHalves(sec, label = '') {
  const start = sec.indexOf('只允许写');
  assert.ok(start >= 0, `${label} 边界句缺「只允许写」起点`);
  const cut = sec.indexOf('**禁止写**', start) >= 0 ? sec.indexOf('**禁止写**', start) : sec.indexOf('禁止写', start);
  assert.ok(cut > start, `${label}「只允许写」段后必须紧跟「禁止写」段`);
  return { allowed: sec.slice(start, cut), forbidden: sec.slice(cut) };
}
```

`assertBoundaryClean` 与 `writeScopeHalves` 的**双向样例（该抛 / 该不抛）与判别力说明**在 B13；两者的**行为约定**（`## 边界` 恰 1 处、完整旧句判红、无条件裸短语判红、允许 / 禁止两段必须相邻可切）由 B02 / B03 / B05 直接消费。

## 2 用例明细

### S5-TC-A01 `tools.producer` 逐字六元组 + 四档必需项在位

- **覆盖**：V-1 / P-1 / §3.1 / F8
- **来源**：spec 推导（v4 收范围：`research` 不要求也不禁止；本用例只钉 producer 与必需档位）
- **前置**：`patternRegistry.mjs` 已按 P-1 改完。
- **步骤**：① 导入 `patternRegistry`；② 取 `tools.producer` 与期望数组深比较；③ 断言 `readOnly` / `sdet` / `command` / `producer` 四档都是 `tools` 的真键；④ 断言四档的值都是非空数组。
- **预期**：`['Read','Glob','Grep','Write','Edit','RunCommand']`，顺序即此顺序（§3.1：按 D-14「readOnly + Write + Edit + RunCommand」，不重排）；四档在位；不判 `research`（S5-R 可增）。
- **判据**：
  ```js
  assert.deepEqual(patternRegistry.tools.producer, ['Read','Glob','Grep','Write','Edit','RunCommand']);
  for (const t of ['readOnly','sdet','command','producer']) {
    assert.ok(Object.hasOwn(patternRegistry.tools, t), t);
    assert.ok(Array.isArray(patternRegistry.tools[t]) && patternRegistry.tools[t].length > 0, t);
  }
  ```
- **红绿证据**：红 = 改前 `.producer` 为 `undefined`（`deepEqual` 失败）；删掉 `command` 档 → 第三条红（F8）。绿 = 全过。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不校验该档被谁挂载（归 A02 / A04 / C02）；不校验卡面字节（归 C01）；不判 `research` 是否存在（S5-R 范围）。

### S5-TC-A02 `tierBySeat` 必需映射存在 + 每值合法 + 无未知档位 + `defaultTier`

- **覆盖**：V-2 / P-1 / §3.2 / F6
- **来源**：spec 推导（「去掉键恰三条」来自议会 QA-1-04 / AI-1-04：S2/S3 会加席）
- **前置**：`tierBySeat` / `defaultTier` 已按 P-1 落地。
- **步骤**：① 逐条断言三条必需映射；② 断言 `defaultTier === 'readOnly'`；③ 遍历 `tierBySeat` 每个值，断言 ∈ `Object.keys(tools)`；④ 断言每个键都是 `agentData` 里真实存在的席（防幻影键绕过 A04 的未挂载集合）；⑤ **不作键数量断言**。
- **预期**：`senior-sdet → 'sdet'`、`reviewer-audit → 'producer'`、`detective-observer → 'producer'`；每值都是真实档位名；每个键都是真实席；S2/S3 加席后本条仍绿。
- **判据**：
  - `assert.equal(patternRegistry.tierBySeat['senior-sdet'], 'sdet')`
  - `assert.equal(patternRegistry.tierBySeat['reviewer-audit'], 'producer')`
  - `assert.equal(patternRegistry.tierBySeat['detective-observer'], 'producer')`
  - `assert.equal(patternRegistry.defaultTier, 'readOnly')`
  - `for (const v of Object.values(patternRegistry.tierBySeat)) assert.ok(Object.hasOwn(patternRegistry.tools, v), v)`
  - `const names = new Set(agentData.map((a) => a.name)); for (const n of Object.keys(patternRegistry.tierBySeat)) assert.ok(names.has(n), n)`
- **红绿证据**：红 = 改前无 `tierBySeat`（`TypeError`）；把 `reviewer-audit` 写成 `'Producer'` 时最后一条失败；绿 = 五条全过。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不判「这席该不该是这个档」（Q2 决策）；不判键数量（V-2 只要求必需映射存在，S2/S3 会加席）。`defaultTier` 一条的**判别力**由 A10 单独证明。

### S5-TC-A03 `boundaryBySeat` 必需两席 + 每值非空 + 键须为真实席；`DECLARED_SLOT_SEATS` 由它派生

- **覆盖**：V-2 / P-3 / §5 / F5
- **来源**：spec 推导（派生要求来自 AI-1-04；删「恰两席」来自第 2 轮 QA/AI：S2/S3 会增席）
- **前置**：P-1 / P-3 落地。
- **步骤**：① 断言两席键存在；② 断言每值非空字符串；③ 断言每个键都是 `agentData` 真实席；④ 静态探针 `validateAgentData.mjs` 出现 `Object.keys(patternRegistry.boundaryBySeat)`，且不再出现硬编码三席集合；⑤ **不作键数量断言**。
- **预期**：`reviewer-audit` / `detective-observer` 两键在位且值非空；S2/S3 新增 producer 席时本条仍绿（不撞白名单）。
- **判据**：
  ```js
  for (const n of ['reviewer-audit', 'detective-observer']) {
    assert.equal(Object.hasOwn(patternRegistry.boundaryBySeat, n), true, n);
    const v = patternRegistry.boundaryBySeat[n];
    assert.equal(typeof v === 'string' && v.trim().length > 0, true, n);
  }
  const names = new Set(agentData.map((a) => a.name));
  for (const n of Object.keys(patternRegistry.boundaryBySeat)) assert.ok(names.has(n), `boundaryBySeat 含不存在的席：${n}`);
  assert.match(readRepo('tools/docgen/components/validateAgentData.mjs'), /Object\.keys\(patternRegistry\.boundaryBySeat\)/);
  assert.equal(/new Set\(\['evidence-reader', 'reviewer-audit', 'detective-observer'\]\)/.test(readRepo('tools/docgen/components/validateAgentData.mjs')), false);
  ```
- **红绿证据**：红 = 改前无 `boundaryBySeat`（`TypeError`）、`validateAgentData.mjs:119` 正是硬编码三席；给一个不存在席登记边界（第 3 条红）；绿 = 派生式在位且键真实。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不判键数量；不判「派生集合该不该包含某个新席」（S2/S3 加席时由 `boundaryBySeat` 决定）。

### S5-TC-A04 三席字面档位 + 每席 tools 落在某个已知档位数组 + 未挂载档位仅 `defaultTier` / `command`

- **覆盖**：V-2 / §3.1 / §3.2 / F2 / F14
- **来源**：spec 推导（第 2 轮 AI/QA：删「用 `expectTier` 自算再与 `toolsForSeat` 比」——同源比较等于自证；v4 未挂载口径按 §8 V-2 改为 `[defaultTier, 'command']` 豁免）
- **前置**：`toolsForSeat()` / `tierOf()` 已落地；`agentData` 已按 P-2 改完。
- **步骤**：① 对三席用**字面数组**断言 `toolsForSeat` 返回值（期望值写在测试里，不从映射表推）；② 遍历 `agentData`：每席 tools 必须是数组、每个成员必须属于某个已知档位数组、整个数组必须与某个已知档位数组逐元素相等；③ 断言席名唯一；④ `command` 必须是 `tools` 真键；⑤ 计算「未被任何席挂载的档位」，**过滤掉 `defaultTier` 与保留档 `command` 后必须为空**。
- **预期**：三席逐字命中；其余 12 席落在 `readOnly`（当期），但**不写「其余席必须 readOnly」**——S2/S3 挂 producer 席后本条不撞白名单；`readOnly` 作为 `defaultTier` 允许无席挂载；`command` 作为保留档允许无席挂载；**第三个无人挂载档位即红**（F14：`research` 被顺手加回时本条与 A07 工具白名单双红）。
- **判据**：
  ```js
  const FROZEN = {
    'senior-sdet': ['Read','Glob','Grep','Write','Edit'],
    'reviewer-audit': ['Read','Glob','Grep','Write','Edit','RunCommand'],
    'detective-observer': ['Read','Glob','Grep','Write','Edit','RunCommand'],
  };
  for (const [seat, want] of Object.entries(FROZEN)) assert.deepEqual(toolsForSeat(seat), want, seat);

  const tierArrays = Object.values(patternRegistry.tools);
  const KNOWN_TOOLS = new Set(tierArrays.flat());
  for (const a of agentData) {
    const got = toolsForSeat(a.name);
    assert.ok(Array.isArray(got), `${a.name} 无可解析档位（tierBySeat 写了不存在的档位名？）`);
    for (const t of got) assert.ok(KNOWN_TOOLS.has(t), `${a.name}: 未知工具 ${t}`);
    assert.ok(
      tierArrays.some((tl) => tl.length === got.length && tl.every((t, i) => t === got[i])),
      `${a.name} 的 tools 不等于任何已知档位数组`,
    );
  }

  assert.equal(new Set(agentData.map((a) => a.name)).size, agentData.length);

  assert.equal(Object.hasOwn(patternRegistry.tools, 'command'), true, 'command 是保留档，必须是 tools 真键');
  const mounted = new Set(Object.values(patternRegistry.tierBySeat));
  const unmounted = Object.keys(patternRegistry.tools).filter((t) => !mounted.has(t));
  assert.deepEqual(
    unmounted.filter((t) => ![patternRegistry.defaultTier, 'command'].includes(t)),
    [],
    '除 defaultTier 与保留档 command 外，不得存在无人挂载的档位',
  );
  ```
- **红绿证据**：红 = `tierBySeat` 写了不存在的档位（第 1 条 `Array.isArray` 失败）；新增一个没人挂的档（末条多出该档名）；某席 tools 被拼成 `['Read','Write']`（第 2 条「不等于任何档位数组」红）；删掉 `command` 档却仍写进豁免清单（第 4 条红，防止豁免项变成沉默黑洞）。绿 = 五项全过。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不判席位数（由 `agentData.length` 派生）；不判「数据侧注入」（归 D01-D04）；不判「谁该挂哪档」（Q2）。

### S5-TC-A05 代码探针：两文件只调 `toolsForSeat(`，不直接读 `patternRegistry.tools`

- **覆盖**：V-2 / P-2 / P-3 / F5
- **来源**：spec 推导
- **前置**：`agentData.mjs` 与 `validateAgentData.mjs` 已按 P-2 / P-3 改完。
- **步骤**：① 读两文件全文；② 断言各含 `toolsForSeat(`；③ 断言不再出现按席名三元分派；④ 剥掉 `import` 行后断言不再出现 `patternRegistry.tools`；⑤ 断言 `agentData.mjs` 的按席分派三元表达式整体消失（`s.name === 'reviewer-audit'` 与 `s.name === 'senior-sdet'` 均不再出现）。
- **预期**：两文件均以 `toolsForSeat` 为唯一档位入口；`agentData.mjs` 尾部的三元表达式消失。
- **判据**：
  - `assert.ok(readRepo('tools/docgen/components/agentData.mjs').includes('toolsForSeat('))`
  - `assert.ok(readRepo('tools/docgen/components/validateAgentData.mjs').includes('toolsForSeat('))`
  - `assert.equal(/s\.name === 'senior-sdet'\s*\?/.test(agentSrc), false)`
  - `assert.equal(/a\.name === 'reviewer-audit'/.test(valSrc), false)`
  - `const code = (s) => s.split('\n').filter((l) => !/^\s*import\b/.test(l) && !/^\s*\/\//.test(l)).join('\n'); assert.equal(/patternRegistry\.tools\b/.test(code(valSrc)), false); assert.equal(/patternRegistry\.tools\b/.test(code(agentSrc)), false)`
- **红绿证据**：红 = 改前 `agentData.mjs` 尾部 map 恰是三元分派、`validateAgentData.mjs` 断言 4 按席名分派（实测）；绿 = 四类被禁形态归零。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不判注释里的说明文字（不影响代码形态）。

### S5-TC-A06 命名守卫 `assertTierValuesExist()` 对三种坏值必须抛错

- **覆盖**：V-2 / §3.2 / F6
- **来源**：spec 推导（议会 BE-1-03 / QA-1-02：原守卫断言与改写无关，恒真）
- **前置**：`tierBySeat` / `tools` 已导出；测试内实现守卫（若实现在 P-1 里对 `patternRegistry` 做了 `Object.freeze` / `deepFreeze`，本用例的就地改写会 `TypeError`，须改用注入式桩——导出可替换的 `__setTierForTest` 或工厂，由它产出带坏值的 registry）：
  ```js
  function assertTierValuesExist(tierBySeat, tools) {
    for (const [seat, tier] of Object.entries(tierBySeat)) {
      assert.ok(Object.hasOwn(tools, tier), `${seat} → 未知档位 ${JSON.stringify(tier)}`);
    }
  }
  ```
- **步骤**：① 逐坏值改写 `tierBySeat['reviewer-audit']`；② **先断言改写真的生效**（`toolsForSeat` 返回 `tools[bad]`，坏值时即 `undefined`）；③ 断言守卫抛错；④ `finally` 还原；⑤ 还原后断言守卫不抛、`toolsForSeat` 回到六元组。
- **预期**：`''` / `'Producer'` / `'ghostTier'` 三种形态都让守卫抛「未知档位」；还原后全绿。若实现给运行时加了静默兜底（返回 readOnly），第 ② 步失败——这正是 spec §3.2「不给运行时静默兜底」的机器证据。
- **判据**：
  ```js
  for (const bad of ['', 'Producer', 'ghostTier']) {
    const saved = patternRegistry.tierBySeat['reviewer-audit'];
    try {
      patternRegistry.tierBySeat['reviewer-audit'] = bad;
      assert.equal(toolsForSeat('reviewer-audit'), patternRegistry.tools[bad]); // bad 时两边都是 undefined：改写已生效
      assert.throws(() => assertTierValuesExist(patternRegistry.tierBySeat, patternRegistry.tools), /未知档位/);
    } finally { patternRegistry.tierBySeat['reviewer-audit'] = saved; }
  }
  assert.doesNotThrow(() => assertTierValuesExist(patternRegistry.tierBySeat, patternRegistry.tools));
  assert.deepEqual(toolsForSeat('reviewer-audit'), ['Read','Glob','Grep','Write','Edit','RunCommand']);
  ```
- **红绿证据**：红 = 守卫写成恒真判据时三种坏值都不会抛；绿 = 三抛 + 还原后不抛。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不要求运行时抛错（拦截责任在 CI，见 §3.2）。

### S5-TC-A07 工具名白名单（拼错 / 大小写 / 残留联网工具即红，判别力样例）

- **覆盖**：V-1 / §3.1 / F1 / F14
- **来源**：spec 推导
- **前置**：四档落地。
- **步骤**：① 定义字面白名单 `KNOWN = ['Read','Glob','Grep','Write','Edit','RunCommand']`（**不引用 `patternRegistry.tools`**，否则拼错也会被自身派生放过；不含 `WebSearch` / `WebFetch`）；② 遍历四档所有工具名断言 ∈ `KNOWN`；③ 用两个错样本跑同一判据，断言结果为 `false`：拼错样本 `['Read','Glob','Grep','Websearch']`、残留联网样本 `['Read','Glob','Grep','WebFetch']`。
- **预期**：真实四档全过；两个样本都判不通过（证明判据不是恒真，且 S5-R 的工具没漏进来）。
- **判据**：
  - `for (const [tier, list] of Object.entries(patternRegistry.tools)) for (const t of list) assert.ok(KNOWN.includes(t), `${tier}:${t}`)`
  - `assert.equal(['Read','Glob','Grep','Websearch'].every((t) => KNOWN.includes(t)), false)`
  - `assert.equal(['Read','Glob','Grep','WebFetch'].every((t) => KNOWN.includes(t)), false)`
- **红绿证据**：红 = 任一档写了 `Web Search`（带空格）/ `Websearch` / `WebFetch`；绿 = 全部命中白名单。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：白名单是测试内常量，不代替 A01 的逐字断言。

### S5-TC-A08 席名大小写敏感：`Reviewer-Audit` 回落 `readOnly`

- **覆盖**：V-2 / §3.2 未登记席回落
- **来源**：spec 推导
- **前置**：`tierBySeat` 只有全小写键。
- **步骤**：① 调小写与大写首字母两种席名；② 比较结果。
- **预期**：小写 → producer 六元组；大写 → readOnly 三元组。
- **判据**：
  - `assert.deepEqual(toolsForSeat('Reviewer-Audit'), patternRegistry.tools.readOnly)`
  - `assert.notDeepEqual(toolsForSeat('Reviewer-Audit'), patternRegistry.tools.producer)`
- **红绿证据**：红 = 若做了 `toLowerCase()` 归一或模糊匹配，大写席名拿到写权；绿 = 严格键匹配。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不校验 `NAME_RE` 是否允许大写（`validateAgentData.mjs:24` 已要求全小写）。

### S5-TC-A09 原型链键名 `constructor` / `toString` / `hasOwnProperty` 回落 `readOnly`

- **覆盖**：V-2 / §3.2 原型链键名 / F6
- **来源**：spec 推导
- **前置**：`tierOf` 按 §3.2 用 `Object.hasOwn(patternRegistry.tierBySeat, name)` 判自有键。
- **步骤**：① 三个原型链键名各调一次；② 断言均深等于 `tools.readOnly`；③ 断言 `constructor` 能过 `NAME_RE`。
- **预期**：三者全部回落只读；`constructor` 是可达席名（不是「不可能输入」）。
- **判据**：
  - `for (const n of ['constructor','toString','hasOwnProperty']) assert.deepEqual(toolsForSeat(n), patternRegistry.tools.readOnly, n)`
  - `assert.ok(/^[a-z][a-z0-9-]{0,49}$/.test('constructor'))`
- **红绿证据**：红 = 用 `tierBySeat[name] ?? defaultTier` 直接取值：`constructor` 得函数 → `toolsForSeat` 返回 `undefined` → 校验器在断言 3 先抛 `FrontmatterFieldMissing`（不是 `ToolsViolation`）；绿 = 返回 readOnly。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不判 `tierOf` 的实现写法（只判行为）。

### S5-TC-A10 A02 的 `defaultTier === 'readOnly'` 判据有判别力（构造值即红 + 改默认值真的扩大权限）

- **覆盖**：V-2 / §3.2 默认拒绝 / F2
- **来源**：spec 推导（第 2 轮 QA：原写法自成一题且期望只写回落三元组 → 退化成「值没变就绿」；改为证明 A02 那条**字面判据**的判别力）
- **前置**：同 A02；改写 → 断言 → `finally` 还原。若实现在 P-1 里对 `patternRegistry` 做了 `Object.freeze` / `deepFreeze`，③ 的就地改 `defaultTier` 会 `TypeError`，须改用注入式桩（导出可替换的 `__setTierForTest` / `__setDefaultTierForTest`，或用工厂重建 registry）；② 的构造对象 `{ ...registry, defaultTier: 'producer' }` 不受影响。
- **步骤**：① 用与 A02 同一字面判据的函数断言真实 registry 通过；② 对**构造对象** `{ ...registry, defaultTier: 'producer' }` 跑同一判据，断言抛（这一步就是 A02 判别力的证据）；③ 临时把真实 `defaultTier` 置 `'producer'`，断言 `toolsForSeat('ghost')` 变成 producer 六元组（证明「默认值」不是无害字符串，权限面真的变了）；④ `finally` 还原后断言回落 readOnly。
- **预期**：①④ 通过；② 抛；③ 命中 producer 六元组。缺 ② 则 A02 的断言可能恒真，缺 ③ 则「改默认值会扩大权限」只是猜测。
- **判据**：
  ```js
  const assertReadOnlyDefault = (reg) => assert.equal(reg.defaultTier, 'readOnly');   // 与 A02 同一字面判据
  assertReadOnlyDefault(patternRegistry);
  assert.throws(() => assertReadOnlyDefault({ ...patternRegistry, defaultTier: 'producer' })); // 判别力证据

  const saved = patternRegistry.defaultTier;
  try {
    patternRegistry.defaultTier = 'producer';
    assert.deepEqual(toolsForSeat('ghost'), ['Read','Glob','Grep','Write','Edit','RunCommand']); // 权限面真的变了
  } finally {
    patternRegistry.defaultTier = saved;
  }
  assert.deepEqual(toolsForSeat('ghost'), ['Read','Glob','Grep']);
  ```
- **红绿证据**：红 = 判据写成 `assert.ok(typeof patternRegistry.defaultTier === 'string')`（任何值都绿）；绿 = 构造值即抛 + 权限面变化被观测。期望值用字面数组，不用 `patternRegistry.tools.producer`（避免自证）。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不校验 `defaultTier` 是否该有其它取值（§3.2 已定只有 `readOnly`）。

### S5-TC-B01 两卡 frontmatter tools 行逐字六元组

- **覆盖**：V-3 / P-5 / §11.3 D5 / D6
- **来源**：spec 推导
- **前置**：两卡已由 docgen 重生成（§6 步骤 2-6）。
- **步骤**：① 读两卡；② `/^tools:\s*(.+)$/m` 取行；③ 与期望逐字比较（含逗号后空格）。
- **预期**：均为 `tools: Read, Glob, Grep, Write, Edit, RunCommand`。
- **判据**：`assert.equal(/^tools: .+$/m.exec(card)[0], 'tools: Read, Glob, Grep, Write, Edit, RunCommand')`（两卡各一次）
- **红绿证据**：红 = 改前 `reviewer-audit.md:4` / `detective-observer.md:4` 是四元组；绿 = 逐字相符。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）；旧断言见 E01 / E02
- **不覆盖**：不校验卡面其它节（归 B02 / B03 / B04）。

### S5-TC-B02 审计边界节五段齐 + 允许写切片干净 + 禁止段两条「不得写」

- **覆盖**：V-3 / §3.3①②③④⑤ / §4 T-2 / F3 / F13
- **来源**：spec 推导（五段断言来自议会 QA-1-03；「允许写切片 / 禁止段」口径来自第 3 轮 P1：V-3 要求「含『不得写 `progress.md`』」，故不得再断言整节不含 `progress.md`）
- **前置**：`BOUNDARY_PRODUCER_AUDIT` 已落在 `agentData` 的 `reviewer-audit` 条目，卡已重生成。
- **步骤**：① 调 `assertBoundaryClean(card, 'reviewer-audit')`（该函数＝B02/B03/B13 共用：断言 `^## 边界$` 恰 1 处、完整旧结论句不出现、无条件裸短语「不创建、修改、删除任何文件」不出现），取回边界切片 `sec`；② 逐词断言五段要件（①档位事实 / ②写入范围 / ③明确禁止 / ④命令默认拒绝 / ⑤越权后果与限度）；③ 取 `writeScopeHalves(sec)` 的**允许写切片**（从「只允许写」到「**禁止写**」之前），断言含 `round-check`、不含 `progress.md`、不含 `新建快照`；④ 断言**禁止写段**（「**禁止写**」到节末）含「不得写 `progress.md`」与「不得写 `gate-record.md`」。
- **预期**：①「整档授予」「平台无参数级授权」「不假装白名单」「不裁决他人分歧」「无中断评审」；②`.session/reviews/`、`docs/superpowers/reviews/`、允许写本人产出；③ 全部 23 条禁写路径（**不在此内联**：清单 = 定义层 `pathGroups` 派生值 `FORBIDDEN_PATHS` 按 `、` 再切 + `spec / plan`，与下方 `pathTokens().length === 23` 同一来源；本文件若内联整份清单，自己就成了第 4 份副本）、`任何写文件或重定向`、`.gitignore` 兜底；④ 见 B05 清单；⑤「越权清单」「sha256」「用户执行」「本轮结论作废」「检测限度」「`.session/`」「gitignore」。允许写切片里**只有** `round-check` / `delivery-audit` / 审计表这类本人产出，**不得出现 `progress.md`**。
- **判据**：
  ```js
  const sec = assertBoundaryClean(card, 'reviewer-audit');            // 与 B03 / B05 / B13 同一函数（实现见「共用前提（P0 前置）」节）
  // ③ 路径单源（spec §3.3③ 逐项点名，共 23 条）：FORBIDDEN_PATHS / FORBIDDEN_SPEC_PLAN 定义在
  // 「共用前提（P0 前置）」节（模块顶层一次），B03 复用；不得抄进各自的 test() 回调（抄了会漏项，另声明则 ReferenceError）。
  // `代码、测试` 在 FORBIDDEN_PATHS 里合写一条；`spec / plan` 单列正则（见下方 assert.match），两条都不是单字泛词判据。
  const MARKS = ['整档授予','平台无参数级授权','不假装白名单','不裁决他人分歧','无中断评审',
    '.session/reviews/','docs/superpowers/reviews/','round-check','delivery-audit',
    '封闭清单','任何写文件或重定向',
    // 卡面 ③ 段 = 23 项口径：`代码、测试` 在卡面写作两项，故取 `pathTokens()`（定义层数组按 `、` 再切 + `spec / plan`），
    // 不取 `FORBIDDEN_PATHS`（21 个数组元素，含合写的 `代码、测试`）——与 `tool-tiers.test.mjs` 的 `MARKS` 同一写法
    ...pathTokens(), '.gitignore',
    '越权清单','sha256','用户执行','本轮结论作废','检测限度'];   // §3.3⑤ 原文只写「用户执行」——不要加「由」前缀（2026-10-24 的 P0 假阳性就出在这里）
  for (const w of MARKS) assert.ok(sec.includes(w), w);
  // 卡面 ③ 段成员数口径守：`FORBIDDEN_PATHS` 是定义层派生值（21 个数组元素），按 `、` 再切 + `spec / plan` = 23 项；
  // 定义层若多塞一个 `、` 或漏一组，此处即红（口径见「共用前提」节的注释）
  assert.equal(pathTokens().length, 23, '卡面 ③ 段成员数 ≠ 23');
  assert.match(sec, FORBIDDEN_SPEC_PLAN, '缺 spec / plan（③ 第 6 项；正则判，避免实现写成 `spec/plan` 时误红）');

  const { allowed, forbidden } = writeScopeHalves(sec);               // 与 B03 / B13 同一函数
  assert.ok(allowed.includes('round-check'), '允许写切片缺 round-check');
  assert.equal(allowed.includes('progress.md'), false, 'progress.md 只由主持人写，不得进允许写切片');
  assert.equal(allowed.includes('新建快照'), false, '不得把「新建快照文件」写进允许写切片');

  assert.match(forbidden, /不得写\s*`?progress\.md`?/, '§3.3②：两席均不得写 progress.md');
  assert.match(forbidden, /不得写\s*`?(?:skills\/dev-workflow\/references\/)?gate-record\.md`?/, '§3.3②：两席均不得写 gate-record.md');
  assert.equal(sec.includes('你是只读评审角色：不得创建、修改、删除任何文件'), false, '完整旧结论句残留');
  ```
- **红绿证据**：红 = 改前 `reviewer-audit.md:93-94` 正是 `BOUNDARY_COMMAND`，末句就是完整旧句且含裸短语；漏写「不得写 `progress.md`」→ 倒数第二条红；把 `progress.md` 写进允许写切片（如「只允许写 `progress.md` 与 `round-check.md`」）→ 第三条红。绿 = 五段齐 + 旧句 / 裸短语清零 + 切片干净 + 两条禁令在位。**判别力提示**：「无中断评审」旧句也有（`reviewer-audit.md:94` 末尾），单看它无判别力——本条判别力来自 `assertBoundaryClean` + 允许写切片 + 禁止段双向。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不判边界句「够不够严」（语义判断，§5 第 1 条）；不判 B3 是否通过（归 B07 + §5 第 4 条）。

### S5-TC-B03 侦探边界节五段齐 + 允许写切片只含 `detective.md` + 禁止段两条「不得写」

- **覆盖**：V-3 / §3.3①②③④⑤ / §4 T-3 / F3 / F13
- **来源**：spec 推导（写入落点来自 RD-1-03；`gate-record.md` 禁写来自 SE-1-01；切片口径来自第 3 轮 P1；③ 路径单源 `FORBIDDEN_PATHS` 来自第 5 轮 QA：B02 / B03 各抄一份会漏项）
- **前置**：`BOUNDARY_PRODUCER_DETECTIVE` 已落地，卡已重生成。
- **步骤**：① 同 B02 调 `assertBoundaryClean(card, 'detective-observer')` 取 `sec`；② 断言侦探版五段要件（含 `detective.md`、轮初 / 轮末快照原文；③ 路径直接展开 B02 的 `pathTokens()`（卡面 23 项口径），不在此另抄一份；`spec / plan` 同样用共用前提里的 `FORBIDDEN_SPEC_PLAN` 正则判）；③ 取允许写切片，断言含 `detective.md`、不含 `progress.md`、不含 `新建快照`；④ 断言禁止段含「不得写 `progress.md`」与「不得写 `gate-record.md`」。
- **预期**：五段齐；`detective.md`、`轮初`、`轮末`、③ 全部 23 条禁写路径（与 B02 同源）、「不得写 `progress.md`」、「不得写 `gate-record.md`」、「检测限度」在位；允许写切片里**没有** `progress.md` / 新建快照文件；**不含**完整旧结论句与无条件裸短语。
- **判据**：
  ```js
  const sec = assertBoundaryClean(card, 'detective-observer');
  for (const w of ['整档授予','平台无参数级授权','不假装白名单','不裁决他人分歧','无中断评审',
    '.session/reviews/','detective.md','轮初','轮末','封闭清单','任何写文件或重定向',
    ...pathTokens(), '.gitignore',   // 同上：卡面 ③ 段 = 23 项口径（`代码、测试` 在卡面拆成两项）
    '越权清单','sha256','用户执行','本轮结论作废','检测限度'])
    assert.ok(sec.includes(w), w);
  assert.match(sec, FORBIDDEN_SPEC_PLAN, '缺 spec / plan（③ 第 6 项；与 B02 同一正则）');

  const { allowed, forbidden } = writeScopeHalves(sec);
  assert.ok(allowed.includes('detective.md'), '允许写切片缺 detective.md');
  assert.equal(allowed.includes('progress.md'), false, 'progress.md 只由主持人写');
  assert.equal(allowed.includes('新建快照'), false, '不得把「新建快照文件」写进允许写切片');
  assert.match(forbidden, /不得写\s*`?progress\.md`?/);
  assert.match(forbidden, /不得写\s*`?(?:skills\/dev-workflow\/references\/)?gate-record\.md`?/);
  ```
- **红绿证据**：红 = 改前 `detective-observer.md:52-53` 为 `BOUNDARY_COMMAND`；若把「新建快照文件」写成允许落点（第 3 条红）；若沿用旧口径写成「侦探卡不得出现 `progress.md`」→ 与 §3.3② 要求的禁止子句互斥，本条的禁止段断言会红（该错误注释已在 v4 删除）。绿 = 全中且两段分明。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不校验快照实际落盘（运行时，§5 第 2 条）；不判边界句语义严度（§5 第 1 条）。

### S5-TC-B04 审计卡「输出格式」含「已授 producer 档」、不含「已授 command 档」且单源

- **覆盖**：V-3 / §4 T-1 / P-4
- **来源**：spec 推导
- **前置**：`outputFormats.mjs` 的审计句已改（P-4，实测现文在 `outputFormats.mjs:20`），审计卡已重生成。
- **步骤**：① 切「## 输出格式」到下一个 `## ` 之间片段；② 断言新句在、旧句不在；③ 断言 `outputFormats.mjs` 内新句恰 1 处、旧句 0 处。
- **预期**：卡片段含「已授 producer 档」；两个文件均无「已授 command 档」。
- **判据**：
  - `assert.ok(sec.includes('已授 producer 档'))`
  - `assert.equal(sec.includes('已授 command 档'), false)`
  - `assert.equal((readRepo('tools/docgen/components/outputFormats.mjs').match(/已授 producer 档/g) ?? []).length, 1)`
  - `assert.equal((readRepo('tools/docgen/components/outputFormats.mjs').match(/已授 command 档/g) ?? []).length, 0)`
- **红绿证据**：红 = 改前 `outputFormats.mjs:20` 与 `reviewer-audit.md:50` 均为旧句（实测）；绿 = 双向命中。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不判「审计现在确实该有写权」（Q2 裁定）。

### S5-TC-B05 以「**禁止**」为界：允许段白名单 + 禁止段点名 + 允许段无裸 `draft`

- **覆盖**：V-3 / §3.3④ / F9
- **来源**：spec 推导（议会 SE-1-03；第 2 轮 security/AI：禁止段必须点名 `draft` 生成 / `draft rm` / `draft ensure` / `baseline --write` / `replace` / 任何形式环境变量赋值；第 3 轮收范围后删 `session-snapshot.mjs`）
- **前置**：两份 producer 边界句已落地。
- **步骤**：① 对两卡各取边界切片；② **先把切片收窄到 ④ 段**（`sec.slice(sec.indexOf('命令默认拒绝'))`），再用该段内的 `**禁止**` 切出 `allowed`（前）/ `forbidden`（后），两个锚点都必须存在（照 spec §3.3② 末句「锚固定」：命令允许段只取「④ 命令默认拒绝 → **禁止**」；不收窄会把 ② 的「禁止写」段与 ③ 的 23 条路径一起算进 `allowed`）；③ 允许段逐条断言白名单命令在位（**禁止竖线连写**，故 `diff` / `show` / `log` 三条各自出现）；④ 禁止段逐条断言禁项在位（含 `draft` / `draft rm` / `draft ensure` / `baseline --write` / `replace` / `export` / `$env:` / 环境变量赋值 / `node -e`）；⑤ 允许段的 `cli.mjs <sub>` token ⊆ 白名单（`node <路径>/cli.mjs <sub>` 与 `cli.mjs <sub>` 视为同一条命令，不因路径前缀判红），且**不得出现裸 `draft`**（只许 `draft ls`）；⑥ 用合成允许段（含 `node tools/docgen/cli.mjs gate` 与 `node tools/docgen/cli.mjs draft ls`）跑同一守卫，断言为绿（正向样例，防「守卫恒红 / 只收到 0 条命令」的静默回归），再往同一合成段加一条 `node scripts/session-snapshot.mjs`，断言同一守卫**必须判红**（应拒反例，防守卫恒绿）。
- **预期**：允许段：`npm run check`、`git --no-optional-locks status --porcelain`、`git --no-optional-locks diff`、`git --no-optional-locks show`、`git --no-optional-locks log`、`git --no-optional-locks reflog show`、`node scripts/check-all.mjs`、`node scripts/doc-name.mjs --check`、`node scripts/skill-dir.mjs`、`node skills/review-log/scripts/time.mjs`、`cli.mjs gate`、`check-agents`、`diff --kind agent --name`、`draft ls`。禁止段：`draft`（生成）/ `draft rm` / `draft ensure` / `baseline --write` / `replace` / `--output` / `--apply` / `--write` / `reflog expire` / `commit` / `push` / `checkout` / `reset` / `restore` / `clean` / `rm` / `Set-Content` / `Out-File` / `export` / `$env:` / 环境变量赋值 / `node -e`。
- **判据**：
  ```js
  const sec = assertBoundaryClean(card, seat);
  // 锚固定（spec §3.3② 末句）：命令允许段只取 ④ 段内「**禁止**」之前的部分。
  // 不收窄会把 ② 的「禁止写」段（progress.md / gate-record.md）与 ③ 的 23 条路径一起包进 allowed，
  // 于是「③ 段里出现 draft 字样」也会让下面的裸 draft 断言误红（隐性耦合）。
  const sec4Start = sec.indexOf('命令默认拒绝');                      // ④ 段起点
  assert.ok(sec4Start >= 0, '边界句缺 ④「命令默认拒绝」段');
  const sec4 = sec.slice(sec4Start);
  const cut = sec4.indexOf('**禁止**');
  assert.ok(cut > 0, '④ 段缺少「**禁止**」切分点');
  const allowed = sec4.slice(0, cut);
  const forbidden = sec4.slice(cut);

  const ALLOWED = ['npm run check', 'git --no-optional-locks status --porcelain', 'git --no-optional-locks diff',
    'git --no-optional-locks show', 'git --no-optional-locks log', 'git --no-optional-locks reflog show',
    'node scripts/check-all.mjs', 'node scripts/doc-name.mjs --check', 'node scripts/skill-dir.mjs',
    'node skills/review-log/scripts/time.mjs', 'cli.mjs gate',
    'check-agents', 'diff --kind agent --name', 'draft ls'];
  const FORBIDDEN = ['draft', 'draft rm', 'draft ensure', 'baseline --write', 'replace',
    '--output', '--apply', '--write', 'reflog expire', 'commit', 'push', 'checkout', 'reset', 'restore',
    'clean', 'rm', 'Set-Content', 'Out-File', 'export', '$env:', '环境变量赋值', 'node -e'];

  for (const w of ALLOWED) assert.ok(allowed.includes(w), `允许段缺：${w}`);
  for (const w of FORBIDDEN) assert.ok(forbidden.includes(w), `禁止段缺：${w}`);
  // 环境变量默认拒绝的四种形态（spec §3.3④）：不能只查 DOCGEN_* 或三个关键词
  assert.match(forbidden, /任何形式的环境变量赋值/, '缺「任何形式的环境变量赋值」总句');
  assert.match(forbidden, /\bset\s+[A-Za-z_]\w*=/i, '缺 `set VAR=…` 形态');
  assert.match(forbidden, /\b[A-Z_][A-Z0-9_]*=\S+\s+node\b/, '缺 `VAR=… node …` 形态');
  assert.match(forbidden, /\bsetx\b/i, '缺 `setx` 形态');

  const subs = [...allowed.matchAll(/cli\.mjs\s+(draft\s+[a-z-]+|[a-z-]+)/g)].map((m) => m[1]);
  for (const s of subs) assert.ok(['gate', 'check-agents', 'diff', 'draft ls'].includes(s), s);
  assert.equal(/draft(?!\s?ls)/.test(allowed), false, '允许段只许 `draft ls`，不得出现裸 `draft`');

  // 允许段不得出现白名单外命令（防「多一条 session-snapshot 也绿」）
  // 归一路径前缀：`node <任意路径>/cli.mjs <sub>` 与 `cli.mjs <sub>` 是同一条命令，交给上面的 subs 白名单判；
  // 这里只查其余命令，避免把合法的 `node tools/docgen/cli.mjs gate` 判红
  const cmdsOf = (text) => [...text.matchAll(/`([^`]+)`/g)].map((m) => m[1].trim())
    .filter((s) => /^(npm run|git --no-optional-locks|node )/.test(s))
    .filter((s) => !/cli\.mjs\s/.test(s));
  const assertWithinWhitelist = (cmds, label) => {
    for (const c of cmds) assert.ok(ALLOWED.some((w) => c === w || c.startsWith(w + ' ')), `${label}出现白名单外命令：${c}`);
  };

  const allowedCmds = cmdsOf(allowed);
  // 下限由白名单派生（当前 14 条 → 7）：写死常量会在白名单收缩后变成「收到 0 条也未必红」，派生值随白名单一起动
  assert.ok(allowedCmds.length >= Math.ceil(ALLOWED.length / 2), '允许段命令未被反引号包住？');
  assertWithinWhitelist(allowedCmds, '允许段');

  // 正向样例（防静默回归）：同一守卫对合成允许段必须全绿，且确实收到 >= 6 条命令
  const SYNTH_ALLOWED = ['`npm run check`', '`git --no-optional-locks status --porcelain`',
    '`git --no-optional-locks diff`', '`git --no-optional-locks show`', '`git --no-optional-locks log`',
    '`node scripts/check-all.mjs`', '`node scripts/skill-dir.mjs`',
    '`node tools/docgen/cli.mjs gate`', '`node tools/docgen/cli.mjs draft ls`'];
  const synthCmds = cmdsOf(SYNTH_ALLOWED.join('\n'));
  assert.ok(synthCmds.length >= 6, '正向样例未收到命令，样例失效');
  assert.doesNotThrow(() => assertWithinWhitelist(synthCmds, '正向样例'));

  // 应拒反例（同一守卫必须判红）：合成允许段里多一条白名单外脚本。
  // `scripts/session-snapshot.mjs` 已拆 S5-B、spec §3.3④ 未列；它不含 `cli.mjs`，只能由本守卫拦。
  const BAD_ALLOWED = [...SYNTH_ALLOWED, '`node scripts/session-snapshot.mjs`'];
  assert.throws(() => assertWithinWhitelist(cmdsOf(BAD_ALLOWED.join('\n')), '应拒样例'), /session-snapshot/);
  ```
- **红绿证据**：红 = 改前 `BOUNDARY_COMMAND` 写 `gate|check-agents|diff|draft ls` 竖线连写（`patternRegistry.mjs:10`），`draft` 看起来与 `gate` 同级；把 `draft` 生成放进允许段 → 第 5 条红；禁止段只写 `DOCGEN_*` 不写环境变量赋值形式 → 第 4 条红；把 `node scripts/session-snapshot.mjs` 留在允许段 → 末块白名单守卫红（该脚本已拆 S5-B，spec §3.3④ 未列；它不含 `cli.mjs`，故由该守卫拦，不再由第 3 条拦）。**切片收窄的红绿**：不收窄（仍在整个 `sec` 上找 `**禁止**`）时，③ 段里再加一条 `draft` 字样（例如「不得生成 `draft`」）会让第 5 条误红；收窄到 ④ 段后该情形不再误红（③ 段增删与命令白名单解耦）。**应拒反例**：`BAD_ALLOWED` 多出的 `node scripts/session-snapshot.mjs` 必须让 `assert.throws(..., /session-snapshot/)` 通过；若守卫恒绿（不抛），本条红。绿 = 收窄切分 + 双向点名 + token 守卫 + 正向样例 + 应拒反例全过。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不校验平台是否真拦命令（无参数级授权位，检测在轮末三件套 + S5-B）。

### S5-TC-B06 侦探固定清单第 4 项含 `--no-optional-locks status`（数据侧 + 卡面）

- **覆盖**：V-3 / P-2 / §4 T-4 / F9
- **来源**：spec 推导（议会 AI-1-03 P0）
- **前置**：`agentData.mjs` 已按 T-4 改（实测现文 `agentData.mjs:215` 为裸 `git status --porcelain`）；卡已重生成。
- **步骤**：① 读 `agentData` 的侦探条目 `fixedList[3]`；② 断言含新命令、不含裸 `本轮 \`git status --porcelain\``；③ 读卡面第 4 行断言同句；④ 读 spec 的 §3.3「检测的三份证据」表（三行），断言表内每条 `git … status|log|reflog|diff` 命令都带 `--no-optional-locks`，且不出现裸 `git status` / 裸 `git log` / 裸 `git reflog`（`diff` 当前表内没有，属未来防护：表里一旦加 `git diff`，同一断言即生效）；④-b 扫 spec 的 §4「判者」表与 V-8 行两段，断言段内每条 `git diff` 都带 `--no-optional-locks`，且每段命中数 ≥ 1（防「一条都没扫到」恒绿）——对应 spec §3.3「同源硬约束」句把「检测的三份证据表、§4 判者表、V-8」列为三处同源。
- **预期**：数据与卡面一致，均用 `git --no-optional-locks status --porcelain`。§3.3 证据表三行内的 `status` / `log` / `reflog`（及未来的 `diff`）命令均带 `--no-optional-locks`。④-b：§4「判者」表与 V-8 行两段各命中 ≥1 条 `git diff`，且全部带 `--no-optional-locks`、无裸 `git diff`。
- **判据**：
  - `assert.match(agentData.find((a) => a.name === 'detective-observer').fixedList[3], /git --no-optional-locks status --porcelain/)`
  - `assert.equal(/本轮 `git status --porcelain`/.test(agentData.find((a) => a.name === 'detective-observer').fixedList[3]), false)`
  - `assert.match(card, /^\| 4 \| .*git --no-optional-locks status --porcelain.*\| 待答 \|$/m)`
  - **④ / ④-b spec 静态断言**（不依赖 `path:line`，只切表体 / 稳定文案锚做正则；spec 路径抽常量并在断言消息里回显）：
    ```js
    const SPEC_PATH = 'docs/superpowers/specs/2026-10-25-s5-tool-tiers-design.md';
    const specText = readRepo(SPEC_PATH);

    // ④ 证据表。动词集含 status / log / reflog / diff：当前表内只有前三种，diff 属未来防护（行为不变）。
    // 下界取表后紧邻的「同源硬约束」句，不取「为什么审计只签转录」：后者会把「同源硬约束」整句包进来，
    // 而该句本身以「（含裸 `git status`）」举反面样例（spec:149），会被下面的正则当成表内命令 → 正确 spec 也判红（假阳性）。
    const tblStart = specText.indexOf('| 证据 | 谁产出 | 落在哪 | 防什么 |');
    const tblEnd = specText.indexOf('**同源硬约束**');
    assert.ok(tblStart >= 0 && tblEnd > tblStart, `锚点缺失：${SPEC_PATH} 未找到「检测的三份证据」表头或「同源硬约束」句`);
    const specSec = specText.slice(tblStart, tblEnd);
    const gitCmds = [...specSec.matchAll(/git\s+[^`|]*?(?:status|log|reflog|diff)[^`|]*/g)].map((m) => m[0].trim());
    assert.ok(gitCmds.length >= 3, `证据表命令未被反引号包住？（${SPEC_PATH} §3.3 检测的三份证据）`);
    for (const c of gitCmds) assert.ok(c.includes('--no-optional-locks'), `证据表命令缺 --no-optional-locks：${c}（${SPEC_PATH} §3.3）`);

    // ④-b §4「判者」表 + V-8 行：两段内的 `git diff` 都必须带 `--no-optional-locks`（§3.3「同源硬约束」要求三处同源）。
    // 切片锚用稳定文案（表标题 / 相邻小节标题 / 相邻验收行），不用 path:line —— 行号会随 spec 修订漂移。
    // 注：匹配式写成 `git\b[^`|]*?\bdiff\b[^`|]*`（而非 `git\s+diff`）——白名单形态是 `git --no-optional-locks diff`，
    //     用 `git\s+diff` 只能匹配裸形态，正确 spec 会命中 0 条、撞上「命中数 ≥1」而恒红。
    const segs = {
      '§4「判者」表': [specText.indexOf('B3 的落账要求（本 spec 不造机器门）'), specText.indexOf('为什么 `senior-sdet` 不升 `producer`')],
      'V-8 行': [specText.indexOf('| V-8 |'), specText.indexOf('| V-9 |')],
    };
    for (const [name, [s, e]] of Object.entries(segs)) {
      assert.ok(s >= 0 && e > s, `锚点缺失：${SPEC_PATH} 的${name}切片（锚文案被改？）`);
      const hits = [...specText.slice(s, e).matchAll(/git\b[^`|]*?\bdiff\b[^`|]*/g)].map((m) => m[0].trim());
      assert.ok(hits.length >= 1, `${SPEC_PATH} 的${name}未见 git diff（锚切错或命令被删？防「一条都没扫到」恒绿）`);
      for (const c of hits) assert.ok(c.includes('--no-optional-locks'), `${name}的 git diff 缺 --no-optional-locks：${c}（${SPEC_PATH}）`);
    }
    ```
- **红绿证据**：红 = 改前侦探条目与卡面 `detective-observer.md:21` 都是裸 `git status`，职责动作被新边界禁止 → B3 应判 fail 而 V-8 要 pass 的互斥；绿 = 两处同句。④ 红 = 证据表写裸 `git status --porcelain`（改前 spec 即此形）；绿 = 表内三行 4 条命令全带 `--no-optional-locks`。④-b 红 = 判者表或 V-8 写成裸 `git diff -U0`（改前 spec 即此形）；绿 = 两段都写成 `git --no-optional-locks diff -U0`（锚切片各命中 1 条）。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不判该命令实际是否刷新 `.git/index`（属平台行为，`--no-optional-locks` 已按 PRD 口径兜）；不判账本模板 `progress.md:40` 的同类裸命令（模板改造拆 S5-B，见 §8 建议 3）；不判证据表命令是否真被执行（运行时归 §5 人工 + 侦探记录）；④-b 只扫 §4「判者」表与 V-8 两段，不扫全文其余 `git diff`（如 §6 步骤 3 给主持人看的 `git diff --no-index` 两版对照，不在两席白名单内）。

### S5-TC-B07 `changes[]` 中 `to === renderSha256` 的全部条目（≥1，按 `at` 取最新）的 B3 落账四字段（三处一致归人工）

- **覆盖**：V-8 / §4「判者」/ F7 / F10
- **来源**：spec 推导（第 2 轮 AI/QA：`changes.at(-1)` 会指向后来追加的条目；第 4 轮 QA：三处逐字一致不读 `.session/`，归 §5 人工）
- **前置**：两席各跑完一次 `replace --rejudge B3 --yes`（§6 步骤 6）；同批写了 `rejudge-<席>-B3.md`，并在本轮 `progress.md` 的「B3 重判派工」节记了判者标识（这两件**不在机器用例读**，归 §5 第 4 条）。
- **步骤**：① 读两份 tracked evidence fixture；② 取 `changes` 里 `to === ev.renderSha256` 的**全部**条目（≥1 条），按 `at` 升序取最新一条作为被测对象（写后还原可能产生同哈希多条，不把「唯一性」当永久不变量）；③ 四条落账断言；④ 三处标识（`changes[].judgedBy` / `rejudge-<席>-B3.md` / `progress.md` 派工节）逐字一致归 §5 第 4 条人工核。
- **预期**：该条 `rejudged` 含 `'B3'`；`judgeMode === 'subagent'`；`judgedBy` 非空；`judged` 中 B3 的 `verdict === 'pass'`。三处一致由审计人工核，不由本机读 `.session/`。
- **判据**：
  ```js
  for (const [seat, p] of Object.entries({
    'reviewer-audit': 'tools/docgen/fixtures/reviewer-audit.evidence.json',
    'detective-observer': 'tools/docgen/fixtures/detective-observer.evidence.json',
  })) {
    const ev = JSON.parse(readRepo(p));
    const hits = ev.changes.filter((c) => c.to === ev.renderSha256);
    assert.ok(hits.length >= 1, `${seat}: 缺 to === renderSha256 的变更记录`);
    // 写后还原可能出现同一哈希多条；按 at 取最新一条，不把「唯一性」当永久不变量
    const c = hits.slice().sort((a, b) => String(a.at).localeCompare(String(b.at))).at(-1);
    assert.ok(c.rejudged.includes('B3'), seat);
    assert.equal(c.judgeMode, 'subagent', seat);
    assert.equal(typeof c.judgedBy === 'string' && c.judgedBy.trim().length > 0, true, seat);
    assert.equal(c.judged.find((j) => j.key === 'B3').verdict, 'pass', seat);
  }
  ```
- **红绿证据**：红 = 改前两份 evidence 的每条 `changes[]` 都是 `rejudged: []` / `judgeMode: "none"`；若后续再追加一条 replace，`at(-1)` 会指向新条目而漏掉 B3 这条（本条用 `to === renderSha256` 定位）。绿 = 命中 ≥1 条且按 `at` 排序后的最新条四字段齐。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不判「这次判是不是真的新判的」（G-6）；不判「漏 `--rejudge` 是否被运行时拦」（spec §4「限度」明写无机器门，归 S5-B）；**`rejudge-<席>-B3.md` 与 `progress.md` 派工节的三处逐字一致归 §5 第 4 条人工核**（`.session/` 不进 git，机器用例不读它，避免克隆/CI 必红）。

### S5-TC-B08 真实 `agentData` 的 producer 席 boundary 必须等于 `renderBoundary(席)` 且不含完整旧句

- **覆盖**：V-3 / §3.3 / §11.3 D3 / F3
- **来源**：spec 推导（议会 BE-1-03「原自证用例」）；**判据由 S6 改判**（S6 spec §3.6 ②：旧的边界常量为死常量已删，判据对象改为渲染结果）
- **前置**：P-1 / P-2 落地（`tierBySeat` + `boundaryBySeat`）；S6 已落 S6 侧组件——`renderBoundary` 从 `components/renderBoundary.mjs` 导入、`boundaryBySeat` 从 `components/patternRegistry.mjs` 导入。
- **步骤**：① 从 `tierBySeat` 派生 producer 席；② 对每席取 `agentData` 条目的 `boundary`；③ 断言它等于 `renderBoundary(席)`、不含完整旧结论句、且等于 `boundaryBySeat[席]`（后者的值由 `renderBoundary` 派生，S6 spec §3.6）。
- **预期**：两席都换成了各自的 producer 边界句，且与 `renderBoundary(席)` 逐字相等；若只改 tools 不改 boundary，本条在施工前必红、施工后必绿。
- **判据**：
  ```js
  const producers = Object.keys(patternRegistry.tierBySeat).filter((n) => patternRegistry.tierBySeat[n] === 'producer');
  assert.ok(producers.length >= 2);
  for (const n of producers) {
    const a = agentData.find((x) => x.name === n);
    assert.equal(a.boundary, renderBoundary(n), n);                         // 判据主体（S6 spec §3.6 ②）
    assert.equal(a.boundary, patternRegistry.boundaryBySeat[n], n);         // 映射值同源，两者必须相等
    assert.equal(/你是只读评审角色：不得创建、修改、删除任何文件/.test(a.boundary ?? ''), false, n);
  }
  ```
- **红绿证据**：红 = 施工前 `tierBySeat` 不存在（`TypeError`），或两席 boundary 与 `renderBoundary(席)` 不等（改前 `agentData.mjs` 尾部 map 实测给的是旧的边界常量，与渲染结果不等）；只改 `boundaryBySeat` 不改 `agentData` 取值 → 第二条红。绿 = 逐席 `a.boundary === renderBoundary(席)`、与映射值相等且不含完整旧句。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不判边界句语义是否覆盖职责（§5 第 1 条）。

### S5-TC-B09 B3 `pending` → 拒写盘；写回 `pass` 后落盘；`rejudge-<席>-B3.md` 四字段

- **覆盖**：V-8 / §4「时效」/ §6 步骤 5-6 / F10
- **来源**：spec 推导（议会 SE-1-05；第 2 轮 QA/AI：补四字段与「判后值」状态；第 3 轮收范围：不再断言 `fail` 分支被拦——spec 明写无机器门）
- **前置**：副本内只改 `outputFormats.mjs` 的审计句（只影响 audit 席），生成 `reviewer-audit` 草稿并取新 sha；`DOCGEN_JUDGED_BY=s5-sdet-rejudge`；在**副本内**建 `.session/reviews/s5-b09/` 并写 `rejudge-reviewer-audit-B3.md`（不读真实仓 `.session/`）。
- **步骤**：① 副本 `rules/.inspector-annotations.json` 置 `reviewer-audit:B3 = "pending"`，写 `rejudge-reviewer-audit-B3.md`（判前值 `pending` / 判后值 `pending` / 判者标识 / 判据锚 `criteria.md:134-141`），跑 `replace … --rejudge B3 --yes`；② 断言 exit 4、报文含 `reviewer-audit:B3` 与 `非 pass/fail`、`changes` 不追加、卡哈希不变；③ 把注解改为 `"pass"`，同步把 md 的判后值改为 `pass`，重跑同一命令（失败路径不删草稿）；④ 断言 exit 0、卡哈希 = 新 sha、`changes` +1、`to === renderSha256` 那条 `rejudged === ['B3']` 且 `judgedBy` 与 md 判者标识逐字相等；⑤ 断言 md 四字段齐。
- **预期**：`pending` 三态之外一律拒写；写回 `pass` 后才落盘；`rejudge-<席>-B3.md` 四字段（判前 `pending` / 判后值 / 判者标识 / 判据锚）+ 转录人齐。
- **判据**：
  ```js
  // ① 判前态
  assert.equal(r1.status, 4);
  assert.match(r1.stdout + r1.stderr, /reviewer-audit:B3/);
  assert.match(r1.stdout + r1.stderr, /非 pass\/fail/);
  assert.equal(changesLen1, changesLen0);
  assert.equal(sha256(card1), sha256(card0));

  // ② 判后态
  assert.equal(r2.status, 0);
  assert.equal(sha256(card2), newSha);
  const last = ev2.changes.filter((c) => c.to === ev2.renderSha256).at(-1);
  assert.deepEqual(last.rejudged, ['B3']);
  assert.equal(last.judgedBy, 's5-sdet-rejudge');

  // ③ 四字段（读副本内账本，不读真实仓 .session/）
  // 注：本步只验落盘形状与四字段（形状断言），不证明判者独立——md 是本用例自己写的，
  //    对产品零判别力；独立性归 §5 人工那条「B3 重判是否真由独立子代理完成」（三处逐字相等 + annotations 前后确有变化）
  const md = readFileSync(join(dst, '.session/reviews/s5-b09/rejudge-reviewer-audit-B3.md'), 'utf8');
  assert.match(md, /判前值[:：]\s*`?pending`?/);
  assert.match(md, /判后值[:：]\s*`?pass`?/);
  assert.match(md, /判者标识[:：]\s*`?s5-sdet-rejudge`?/);
  assert.match(md, /判据锚[:：].*criteria\.md:134-141/);
  assert.match(md, /转录人[:：]\s*\S+/);
  ```
- **红绿证据**：红 = 若 `buildJudged` 把未知值按 `pass` 处理，第 ① 步会写盘（「没判也算判了」）；绿 = 两态分明 + 四字段 + 转录人齐。`rejudge-<席>-B3.md` 落点已由 spec §4 写死为 `.session/reviews/<本次>/`。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不判 `fail: 理由` 分支（spec v4 无机器门，结论门归 S5-B；本轮靠 V-8 的事后 `pass` 断言与审计人工核）；不判「判者是否真独立」（§5 第 4 条）。

### S5-TC-B10 缺 `DOCGEN_JUDGED_BY` → `UnapprovedChange` exit 4 且不写盘

- **覆盖**：V-8 / §4「判者」/ F10
- **来源**：spec 推导
- **前置**：同 B09 的差异构造；副本注解 `reviewer-audit:B3 = "pass"`（让 `buildJudged` 先过，才轮到判者门；`cli.mjs:459` 先于 `:460` 的 `judgeId`）；调用时**删除** `DOCGEN_JUDGED_BY`。
- **步骤**：① 跑 `replace --rejudge B3 --yes`；② 记录卡哈希与 `changes` 长度。
- **预期**：exit 4；报文含 `缺少判者标识`；不写盘。
- **判据**：
  - `assert.equal(r.status, 4)`
  - `assert.match(r.stdout + r.stderr, /缺少判者标识/)`
  - `assert.equal(sha256(after), sha256(before))`
  - `assert.equal(changesLenAfter, changesLenBefore)`
- **红绿证据**：红 = 若实现给默认判者名（历史做法 `annotations-writer`），本条 exit 0 并写盘；绿 = 无 env 即 exit 4。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不校验「传了 env 就一定独立」（§5 第 4 条）。

### S5-TC-B11 盘上已变但 `lastWrittenHash` 未更新 → `TargetDrift` exit 1

- **覆盖**：V-8 / §7 F7
- **来源**：spec 推导
- **前置**：副本内往 `agents/reviewer-audit.md` 追加一字节（模拟手改 / 崩溃残留），草稿按当前渲染生成，`--expect-change` 用新 sha。
- **步骤**：① 跑 `replace … --yes`；② 断言退出码与错误码；③ 断言盘上字节未被覆盖。
- **预期**：exit 1；stderr 以 `TargetDrift:` 开头；卡字节不变。
- **判据**：
  - `assert.equal(r.status, 1)`
  - `assert.match(r.stderr, /^TargetDrift:/m)`
  - `assert.equal(sha256(after), sha256(before))`
- **红绿证据**：红 = 跳过 `lastWrittenHash` 比对会直接覆盖并掩盖漂移；绿 = 报错且不写盘。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不校验迁移段的 `renderSha256` 漂移分支（不在本 spec 变更半径）。

### S5-TC-B12 盘上 == 渲染 → 幂等短路 exit 0、`changes` 不追加

- **覆盖**：§6「中途不得」/ V-8
- **来源**：spec 推导（议会 BE-1-04）
- **前置**：副本内两席已 `replaced` 且盘上 == 渲染；生成一份等于渲染的草稿；**不传** `--expect-change` / `--rejudge` / `DOCGEN_JUDGED_BY`。
- **步骤**：① 记录 `changes` 长度与卡哈希；② 跑 `replace --kind agent --name reviewer-audit --draft <草稿> --yes`；③ 断言输出与状态。
- **预期**：exit 0；stdout 含 `已替换（幂等恢复）`；卡哈希不变；`changes` 长度不变（短路排在凭证 / 重判 / 判者三门前）。
- **判据**：
  - `assert.equal(r.status, 0)`
  - `assert.match(r.stdout, /已替换（幂等恢复）/)`
  - `assert.equal(changesLenAfter, changesLenBefore)`
  - `assert.equal(sha256(after), sha256(before))`
- **红绿证据**：红 = 测试前置没构造「盘上 ≠ 渲染」，把 exit 0 误判成「拒写盘」（§6「中途不得」原文点名的坑）；绿 = 短路语义被单独钉住。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不判幂等分支对 evidence 的 `renderSha256` 更新（实现细节，不产生 `changes` 条目）。

### S5-TC-B13 正文合法提及旧短语不得误红；`assertBoundaryClean` / `writeScopeHalves` 与 B02/B03 共用且双向样例

- **覆盖**：V-3 假阳性 / 假阴性守卫 / §3.3②
- **来源**：实现观察（补充）（议会 QA-1-01 的假阳性教训；第 2 轮 QA：B02/B03 必须共用同一函数；第 3 轮 P1：新增 `writeScopeHalves` 解决「允许清单 vs 禁止子句同段共存」的假红）
- **前置**：B02 / B03 / B05 与本用例共用同一组函数；**实现见「共用前提（P0 前置）」节**（`assertBoundaryClean` / `writeScopeHalves` / `FORBIDDEN_PATHS` / `FORBIDDEN_SPEC_PLAN` 在 `tool-tiers.test.mjs` 模块顶层声明一次，须随 P0 同批落地）。本用例只给**双向样例与判别力说明**，不重复实现。
- **步骤**：① 对真实卡调用，断言不抛并返回切片；② 构造「正文含旧短语 + 边界节干净」→ 不抛（假阳性守卫）；③ 构造「边界节含无条件裸短语」→ 抛；④ 构造「边界节含完整旧结论句」→ 抛；⑤ 构造两处 `## 边界` → 抛；⑥ 对「允许段写 round-check、禁止段写不得写 progress.md」的合成边界句跑 `writeScopeHalves`，断言 `allowed` 干净且 `forbidden` 命中两条禁令（证明切片能把同段共存的两类句子分开，不会互相误伤）。
- **预期**：② 不抛；③④⑤ 抛；⑥ 两段分明（同一函数，无第二套口径）。
- **判据**：
  ```js
  assert.ok(assertBoundaryClean(card, 'card').length > 0);                                   // ①
  assert.doesNotThrow(() => assertBoundaryClean('## 通用纪律\n禁止创建、修改、删除任何文件\n\n## 边界\n只允许写本人产出。'));  // ②
  assert.throws(() => assertBoundaryClean('## 边界\n除落点外，不创建、修改、删除任何文件。'), /裸短语/);                    // ③
  assert.throws(() => assertBoundaryClean('## 边界\n你是只读评审角色：不得创建、修改、删除任何文件'), /旧结论句/);            // ④
  assert.throws(() => assertBoundaryClean('## 边界\nA\n## 边界\nB'), /恰 1 处/);                                          // ⑤

  const SAMPLE = '## 边界\n只允许写 `round-check-<轮次>.md`。**禁止写**：不得写 `progress.md`，也不得写 `skills/dev-workflow/references/gate-record.md`。';
  const { allowed, forbidden } = writeScopeHalves(SAMPLE);
  assert.equal(allowed.includes('progress.md'), false);
  assert.ok(allowed.includes('round-check'));
  assert.match(forbidden, /不得写\s*`?progress\.md`?/);
  assert.match(forbidden, /不得写\s*`?(?:skills\/dev-workflow\/references\/)?gate-record\.md`?/);
  ```
- **红绿证据**：红 = 用「整卡 `includes` → 判红」时正文合法提及即假阳性（② 会抛）；只判完整句不判裸短语时 ③ 会漏；沿用 v3 的「整节不含 `progress.md`」判据时 ⑥ 的合成句必红（这正是第 3 轮 P1 报的自相矛盾）。绿 = 切片 + 双条判据 + 两段切分。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）；切片先例 `pilot-render.test.mjs:102-107`
- **不覆盖**：不判边界节出现第二处 `## 边界` 的处置（判红即可）。

### S5-TC-B14 半改态（tools 六元组 + `DEFAULT_BOUNDARY`）渲染矛盾必须被探针抓到

- **覆盖**：V-3 / F3
- **来源**：spec 推导；**半改态的边界侧取值由 S6 改判**（S6 spec §3.6 ③：旧的边界常量为死常量已删，改用 `DEFAULT_BOUNDARY` 构造）
- **前置**：`DEFAULT_BOUNDARY` 仍可导入（`components/patternRegistry.mjs`）；`renderBoundary` 从 `components/renderBoundary.mjs` 导入（旧的边界常量已由 S6 删除，不得再引用）。
- **步骤**：① 构造半改态 agent（`tools = tools.producer`，`boundary = DEFAULT_BOUNDARY`）；② `renderAgent` 渲染；③ 断言矛盾探针命中；④ 断言 `renderBoundary(席) !== DEFAULT_BOUNDARY`（半改态与正确渲染不等，故探针有判别力）；⑤ 断言该态下 `gate` 无判别力（盘上==渲染即绿），故不能靠 `gate` 兜。
- **预期**：渲染产物同时含 `Write` / `Edit` 与完整旧句（`DEFAULT_BOUNDARY` 首句即「你是只读评审角色：不得创建、修改、删除任何文件」）→ 探针返回 `true`；且正确渲染结果与该半改态不等。
- **判据**：
  - `assert.match(rendered, /^tools: Read, Glob, Grep, Write, Edit, RunCommand$/m)`
  - `assert.ok(rendered.slice(rendered.lastIndexOf('## 边界')).includes('你是只读评审角色：不得创建、修改、删除任何文件'))`
  - `assert.equal(hasWrite && hasOldClause, true)`
  - `assert.notEqual(renderBoundary('reviewer-audit'), DEFAULT_BOUNDARY)`
- **红绿证据**：红 = 不写探针，「改 tools 忘改 boundary」只能等 B3 人工重判，机器侧全绿；或 `renderBoundary(席)` 退化成 `DEFAULT_BOUNDARY`（模板 / 定义层坏了）→ 最后一条红。绿 = 探针命中且渲染结果 ≠ 默认边界。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不判矛盾句该怎么改（§3.3 已给两份文本）。

### S5-TC-C01 `gate` exit 0 且输出 `baseline N/N`（N 派生）

- **覆盖**：V-4
- **来源**：spec 推导
- **前置**：两席已 replace、其余席未动。
- **步骤**：① `node tools/docgen/cli.mjs gate`；② 读退出码与 stdout；③ `N` 由 `BASELINE_RULES.length + agentPaths().length` 现算。
- **预期**：exit 0；stdout 含 `baseline N/N`；无 `Mismatch` / `DraftDrift` / `DanglingBaselineEntry`。
- **判据**：
  - `assert.equal(r.status, 0, r.stdout + r.stderr)`
  - `const N = BASELINE_RULES.length + agentPaths().length; assert.match(r.stdout, new RegExp('^baseline ' + N + '/' + N + '$', 'm'))`
- **红绿证据**：红 = 只改源不改卡（或反之）报 `Mismatch` exit 1；绿 = `N/N`。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）；同类先例 `dev-workflow-counts.test.mjs:18-24`
- **不覆盖**：不把 37 当常量（派生性归 E07）。

### S5-TC-C02 逐席 `tools` = `toolsForSeat`；`tierOf` ∈ `tools` 键；producer 席卡面逐字

- **覆盖**：V-6 / V-2 / P-2
- **来源**：spec 推导（议会 QA-1-04：原用例写死 `PRODUCERS` 两名；第 2 轮 QA/AI：删「其余席档位 ∉ {producer,research}」——S2/S3 会挂新席）
- **前置**：`agentData.mjs` 已按 P-2 改完。
- **步骤**：① 从 `tierBySeat` 派生 producer 席集合（不写字面名单）；② 逐席断言 `tools` 深等于 `toolsForSeat(a.name)`，且 `tierOf(a.name)` 是 `tools` 的真实键；③ 逐席断言 `tools` 与某个已知档位数组逐元素相等（防止 `...s` 覆盖或默认分支写错）；④ 对 producer 席逐席读卡面 tools 行，断言逐字等于该席 `tools.join(', ')`。
- **预期**：S3 给 `speaker` 挂 producer 后，该席自动落进 producer 集，不撞白名单；任何席的 tools 漂到「不在任何档位里的组合」即红。
- **判据**：
  ```js
  const PRODUCERS = Object.keys(patternRegistry.tierBySeat).filter((n) => patternRegistry.tierBySeat[n] === 'producer');
  assert.ok(PRODUCERS.length >= 2);
  const tierArrays = Object.values(patternRegistry.tools);

  for (const a of agentData) {
    assert.deepEqual(a.tools, toolsForSeat(a.name), a.name);
    assert.ok(Object.hasOwn(patternRegistry.tools, tierOf(a.name)), `${a.name} → 未知档位 ${tierOf(a.name)}`);
    const got = a.tools;
    assert.ok(tierArrays.some((tl) => tl.length === got.length && tl.every((t, i) => t === got[i])), `${a.name} 的 tools 不等于任何已知档位数组`);
  }

  for (const n of PRODUCERS) {
    const a = agentData.find((x) => x.name === n);
    assert.match(readRepo(`agents/${n}.md`), new RegExp('^tools: ' + a.tools.join(', ') + '$', 'm'), n);
  }
  ```
- **红绿证据**：红 = 若 `toolsForSeat` 默认分支写错或 `...s` 覆盖 tools，第 2 条断言失败；把某席档位改成不存在的档位但卡面仍是 readOnly（第 4 条红）。绿 = 派生集合下全等。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不校验剩余席正文（`gate` 逐字节兜）；不判席位数；不判「其余席档位 ∉ {producer}」（S2/S3 会挂新席，锁死会误红）。

### S5-TC-C03 注入一字节 → `gate` exit 1、`Mismatch`

- **覆盖**：V-4 / F4
- **来源**：spec 推导
- **前置**：`withRepoCopy()` 副本。
- **步骤**：① 往副本 `agents/reviewer-audit.md` 末尾追加一个空格；② 跑 `gate`；③ 用 `collectGate()` 取明细。
- **预期**：exit 1；stderr 首行匹配 `^Mismatch:`；明细含 `Mismatch:agents/reviewer-audit.md`。
- **判据**：
  - `assert.equal(r.status, 1)`
  - `assert.match(r.stderr, /^Mismatch:/m)`
  - `assert.ok(runEsm(dst, "import {collectGate} from './tools/docgen/cli.mjs'; console.log(collectGate().map(d=>d.code+':'+d.path).join('|'))").stdout.includes('Mismatch:agents/reviewer-audit.md'))`
- **红绿证据**：红 = 手改卡而 `gate` 仍绿 = 禁手改卡无守卫；绿 = 注入即报。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）；先例 `evidence-reader.test.mjs:125-141`
- **不覆盖**：不校验「谁改的」（`gate` 只判 bytes）。

### S5-TC-C04 两卡 `diff` 报零差异

- **覆盖**：V-4
- **来源**：spec 推导
- **前置**：两席已 replace。
- **步骤**：① 对两席各跑 `diff --kind agent --name <席>`。
- **预期**：exit 0；stdout 含 `差异 - 0 / + 0（盘上 == 渲染，幂等，无需凭证）`。
- **判据**：
  - `assert.equal(r.status, 0)`
  - `assert.ok(r.stdout.includes('差异 - 0 / + 0（盘上 == 渲染，幂等，无需凭证）'))`（两席各一次）
- **红绿证据**：红 = 源改了卡没重生成时差异计数非 0；绿 = 幂等。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）；先例 `evidence-reader.test.mjs:22-28`
- **不覆盖**：不判差异内容是否正确（逐字节归 C01）。

### S5-TC-C05 只改 `producer` 数组顺序（集合不变）→ 校验绿、`gate` 红

- **覆盖**：V-4 / V-3
- **来源**：spec 推导
- **前置**：副本内把 `tools.producer` 改成 `['Glob','Read','Grep','Edit','Write','RunCommand']` 并同批生成草稿。
- **步骤**：① 断言 `validateAgentData` 不抛（集合恰等）；② 跑 `gate`。
- **预期**：校验通过；`gate` exit 1（卡面顺序变了）。
- **判据**：
  - `assert.doesNotThrow(() => validateAgentData(agentData, triggerTable))`
  - `assert.equal(gate.status, 1)`
- **红绿证据**：红 = 把「顺序一致」写进 `ToolsViolation` → 第 1 条误红；只靠校验不靠 `gate` → 顺序漂移静默改卡面。绿 = 一绿一红，各守一面。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不判哪种顺序才对（§3.1 已定，归 A01）。

### S5-TC-C06 连跑两次 `gate` 输出一致、卡哈希不变（幂等 / 重入）

- **覆盖**：V-4 幂等 / 重入
- **来源**：实现观察（补充）
- **前置**：仓库干净、两席已 replace。
- **步骤**：① 记录两卡与两份 evidence 的 sha256；② 跑两次 `gate`；③ 比较输出与哈希。
- **预期**：两次 stdout 逐字相同、均 exit 0；四个文件哈希不变（`gate` 只读）。
- **判据**：
  - `assert.equal(g1.stdout, g2.stdout)`；`assert.equal(g1.status, 0)`；`assert.equal(g2.status, 0)`
  - `assert.deepEqual(hashesAfter, hashesBefore)`
- **红绿证据**：红 = `gate` 顺手写 evidence / state（为「留痕」偷偷落账）；绿 = 哈希全等。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）；先例 `pilot-gate.test.mjs`
- **不覆盖**：不校验 `replace` 的幂等恢复分支（归 B12）。

### S5-TC-C07 `npm run check` 全绿；覆盖席数 = state 中 `replaced` 席数且 `≥1 且 ≤ agentData.length`

- **覆盖**：§6 步骤 10 / V-4 / V-6
- **来源**：spec 推导（议会 QA-1-01 / 缺陷 8：原用例过严；第 2 轮 P2：⑤ 段允许「通过或跳过」）
- **前置**：P-1～P-8 完成、工作区无残留草稿。
- **步骤**：① `npm run check`；② 读退出码与关键行；③ 解析覆盖行席数；④ 从 `readState()` 现算 `replaced` 席数。
- **预期**：exit 0；末行 `check 全部通过`；覆盖席数 = `replaced` 席数，且 `≥1 且 ≤ agentData.length`；`baseline N/N`、`④ markdown 检查通过`、`⑤ .session 结构检查通过` **或** `⑤ .session 结构检查跳过`（`.session/` 不存在时跳过——规则明文允许）均在。
- **判据**：
  - `assert.equal(r.status, 0, r.stdout + r.stderr)`
  - `assert.match(r.stdout, /^check 全部通过$/m)`
  - `const m = /A 组\+十键检查已覆盖 (\d+) 席/.exec(r.stdout); const n = Number(m[1]); const replaced = Object.values(readState().agents).filter((s) => s === 'replaced').length; assert.equal(n, replaced); assert.ok(n >= 1 && n <= agentData.length)`
  - `const N = BASELINE_RULES.length + agentPaths().length; assert.match(r.stdout, new RegExp('^baseline ' + N + '/' + N + '$', 'm'))`
  - `assert.match(r.stdout, /⑤ \.session 结构检查(通过|跳过)/)`
- **红绿证据**：红 = 任一环节红即非 0（B3 仍 `pending`、测试未同步、卡与源不一致）；绿 = 全绿且覆盖数同源。把 ⑤ 写成只许「通过」会在克隆 / CI（无 `.session/`）环境下必红。
- **对应测试**：`npm run check`（`scripts/check-all.mjs:124-159`）
- **不覆盖**：不替代 `skill-inspector` 自身判据（§5 第 8 条）；不要求覆盖数 = `agentData.length`（加席中间态允许 `replaced` 少）。

### S5-TC-C08 只生成一席草稿 → 旁席 `Mismatch` 挡住 replace

- **覆盖**：§6 步骤 2 / F4
- **来源**：实现观察（补充）（议会 BE-1-04）
- **前置**：副本内只改侦探的 `fixedList[3]`（让侦探渲染 ≠ 盘上）；只生成 `reviewer-audit` 草稿（不改审计源，草稿 == 审计渲染）。
- **步骤**：① `draft --name reviewer-audit`；② `replace --name reviewer-audit --draft <草稿> --yes`；③ 用 `collectGate()` 取明细。
- **预期**：exit 1；stderr `^Mismatch:`；明细含 `Mismatch:agents/detective-observer.md`（旁席没有同批草稿，故不被放行）。
- **判据**：
  - `assert.equal(r.status, 1)`
  - `assert.match(r.stderr, /^Mismatch:/m)`
  - `assert.ok(runEsm(dst, "import {collectGate} from './tools/docgen/cli.mjs'; console.log(collectGate().map(d=>d.code+':'+d.path).join('|'))").stdout.includes('Mismatch:agents/detective-observer.md'))`
- **红绿证据**：红 = `allowed()` 对旁席无条件放行 → 单席替换悄悄让侦探卡与源脱节；绿 = 被旁席 `Mismatch` 挡住。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不校验两席同批生成后是否都能替换（B09 的正半已覆盖审计席）。

### S5-TC-D01 readOnly 席加 `Write` → `ToolsViolation`

- **覆盖**：V-7 / F2
- **来源**：spec 推导
- **前置**：`validateAgentData` 已按 P-3 改用 `toolsForSeat`。
- **步骤**：① `structuredClone(agentData)` 后按席重建 `tools`；② 给 `evidence-reader.tools` push `'Write'`；③ 调校验。
- **预期**：抛 `ToolsViolation`（实际多出一个不在允许集的工具）。
- **判据**：`assert.throws(() => validateAgentData(d, triggerTable), (e) => e.code === 'ToolsViolation')`
- **红绿证据**：红 = 允许集退化成 `includes` 子集判断 → 写权静默放开；绿 = 抛错。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）；先例 `evidence-reader.test.mjs:248-252`
- **不覆盖**：不校验 `evidence-reader` 的边界句（S1 既有验收）。

### S5-TC-D02 未映射席带 `WebSearch` → `ToolsViolation`

- **覆盖**：V-7 / V-2 默认档
- **来源**：spec 推导
- **前置**：`tierBySeat` 无 `reviewer-qa` 键（回落 `readOnly`）。
- **步骤**：① 克隆并重建 `tools`；② 给 `reviewer-qa.tools` 加 `'WebSearch'`；③ 调校验。
- **预期**：抛 `ToolsViolation`（回落 readOnly，联网权不静默放行）。
- **判据**：`assert.throws(() => validateAgentData(d, triggerTable), (e) => e.code === 'ToolsViolation')`
- **红绿证据**：红 = 默认档被改成含联网权的档 → 全仓联网；绿 = 抛错。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不校验 S2 建市场卡后的挂载（归 S5-R / S2）。

### S5-TC-D03 已挂 producer 席注入 `WebSearch` → `ToolsViolation`，且不连带同档另一席

- **覆盖**：V-7 / §3.2 返回值
- **来源**：spec 推导（议会 QA 缺陷 10：共享数组引用）
- **前置**：`tierBySeat` 里至少两席 = producer。
- **步骤**：① 克隆 `agentData` 并**按席重建** `tools = [...a.tools]`；② 给第一席注入 `'WebSearch'`；③ 断言第二席 tools 仍等于其档位（未被连带）；④ 调校验。
- **预期**：抛 `ToolsViolation`；第二席不受影响（证明注入是按席副本，不是共享引用）。
- **判据**：
  - `const producers = Object.keys(patternRegistry.tierBySeat).filter((n) => patternRegistry.tierBySeat[n] === 'producer'); const [p1, p2] = producers;`
  - `assert.deepEqual(d.find((a) => a.name === p2).tools, toolsForSeat(p2))`
  - `assert.throws(() => validateAgentData(d, triggerTable), (e) => e.code === 'ToolsViolation')`
- **红绿证据**：红 = 直接 `structuredClone` 后仍共享同档数组（两席 tools 是同一实例）→ 甲席改动连带乙席，第 2 条失败；绿 = 按席重建后互不影响。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不判 `toolsForSeat` 该不该返回拷贝（G-4，§8 建议 7）。

### S5-TC-D04 `producer` 六元组整档挂给 readOnly 席 → `ToolsViolation`

- **覆盖**：V-7 / V-6 / F2
- **来源**：spec 推导
- **前置**：同 D01。
- **步骤**：① 克隆并重建 `tools`；② 把 `reviewer-qa.tools` 整体替换为 `toolsForSeat('reviewer-audit')` 的拷贝；③ 调校验。
- **预期**：抛 `ToolsViolation`（映射错键的最小复现；`gate` 对此态可能全绿，因盘上卡与渲染同源）。
- **判据**：`assert.throws(() => validateAgentData(d, triggerTable), (e) => e.code === 'ToolsViolation')`
- **红绿证据**：红 = 若 `tierBySeat` 错把 `reviewer-qa` 映射成 producer，此条会绿 → 权限静默扩大；绿 = 抛错。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不判「谁有权决定给写权」（Q2 决策）。

### S5-TC-D05 producer 席 tools 顺序打乱 → 必须判绿（假阳性守卫）

- **覆盖**：V-7 假阳性 / §3.2
- **来源**：spec 推导
- **前置**：同 D03。
- **步骤**：① 克隆并重建 `tools`；② 把 producer 席 tools 置为任意排列；③ 调校验。
- **预期**：不抛（`ToolsViolation` 是集合恰等，不是顺序相等）。
- **判据**：`assert.doesNotThrow(() => validateAgentData(d, triggerTable))`
- **红绿证据**：红 = 校验改成 `deepEqual(a.tools, allowed)` → 本应合理的重排被判错；绿 = 不抛。与 C05 配对：校验守集合、`gate` 守顺序。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）；先例 `evidence-reader.test.mjs:70-74`
- **不覆盖**：不校验顺序错了卡面会不会错（归 C05 的 `gate` 红）。

### S5-TC-D06 tools 含重复元素 → 当前通过（缺口显式记账）

- **覆盖**：V-7 缺口探针 / G-2
- **来源**：实现观察（补充）
- **前置**：同 D05。
- **步骤**：① 克隆并重建 `tools`；② 置 `['Read','Read','Glob','Grep','Write','Edit','RunCommand']`；③ 记录是否抛；④ 断言「当前事实」。
- **预期**：`validateAgentData` **不抛**（双向集合包含都成立）；本条把缺口固化：若哪天加了唯一性断言，本条会红并提示改为 `assert.throws`。
- **判据**：
  - `let threw = false; try { validateAgentData(d, triggerTable); } catch { threw = true; } assert.equal(threw, false)`
  - §7 必须存在 G-2 条目（同批维护）
- **红绿证据**：红 = 把 `false` 写成 `true`（期望被拒）→ 暴露缺口；绿 = 与当前实现一致且缺口已记账。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不要求本 spec 修该缺口（§8 建议 8）。

### S5-TC-D07 `senior-sdet` 加 `RunCommand` → `ToolsViolation`（sdet ≠ producer）

- **覆盖**：V-7 / §2「不做什么」/ §4 末段
- **来源**：spec 推导
- **前置**：`tierBySeat['senior-sdet'] = 'sdet'`，`sdet` 档 = 五元组。
- **步骤**：① 克隆并重建 `tools`；② 给 `senior-sdet.tools` 加 `'RunCommand'`；③ 调校验。
- **预期**：抛 `ToolsViolation`——「不给 `senior-sdet` 升 producer」的机器守卫。
- **判据**：`assert.throws(() => validateAgentData(d, triggerTable), (e) => e.code === 'ToolsViolation')`
- **红绿证据**：红 = 有人把 `sdet` 档顺手扩成含 `RunCommand` → 决策被静默推翻；绿 = 抛错。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不判将来 S3 该不该给 sdet 命令权（届时改档位定义 + 改本条）。

### S5-TC-D08 producer 席 boundary 删键 / 空串 / 全空格 × 全部 producer 席 → `DescriptionDerivation`

- **覆盖**：V-3 / §11.3 D3 / F3
- **来源**：spec 推导（议会 AU-1-03：空串/全空格现码已抛，只有删键是新增；QA-1-05：原用例只测审计席）
- **前置**：`agentData` 两 producer 席各自有非空 `boundary`；`validateAgentData` 已按 D3 增加「`tierOf(a.name) === 'producer'` 且缺 / 空 boundary → `DescriptionDerivation`」。
- **步骤**：① 从 `tierBySeat` 派生 producer 席，断言至少两席且两席 boundary 互不相等；② 逐席 × 三形态（`delete` / `''` / `'   '`）克隆后注入并断言抛；③ 对照组：未改动克隆不抛。
- **预期**：三种形态全部抛 `DescriptionDerivation`；两席 boundary 不同（防复制粘贴把审计句贴给侦探）；正常数据通过。
- **判据**：
  ```js
  const producers = Object.keys(patternRegistry.tierBySeat).filter((n) => patternRegistry.tierBySeat[n] === 'producer');
  assert.ok(producers.length >= 2);
  assert.notEqual(agentData.find((a) => a.name === producers[0]).boundary, agentData.find((a) => a.name === producers[1]).boundary);
  for (const n of producers) {
    for (const mutate of [(d) => delete d.boundary, (d) => { d.boundary = ''; }, (d) => { d.boundary = '   '; }]) {
      const data = structuredClone(agentData).map((a) => ({ ...a, ...(a.tools ? { tools: [...a.tools] } : {}) }));
      mutate(data.find((a) => a.name === n));
      assert.throws(() => validateAgentData(data, triggerTable), (e) => e.code === 'DescriptionDerivation', n);
    }
  }
  assert.doesNotThrow(() => validateAgentData(structuredClone(agentData), triggerTable));
  ```
- **红绿证据**：分形态记账——**删键**：现码 `'boundary' in a === false` 不进 `validateAgentData.mjs:131-132` 分支，改前不抛（本 spec 新增）；**空串 / 全空格**：`validateAgentData.mjs:131-132` 已抛，属回归（改坏即红）。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不校验 message 文案；不覆盖 `null` / 数字等非字符串的类型分支（同错误码归一条断言）；不覆盖 `research` 席的同类分支（归 S5-R）。

### S5-TC-D09 tools 冻结后 `validate` / `render` 不抛，共享数组长度不变

- **覆盖**：§3.2 返回值 / G-4
- **来源**：实现观察（补充）
- **前置**：`toolsForSeat` 返回的是 `patternRegistry.tools[x]` 的同一引用。
- **步骤**：① 克隆并把每席 `tools` 深冻结；② 调 `validateAgentData`；③ 调 `renderAgent`；④ 连跑 3 次后比较 `tools.producer.length`。
- **预期**：两者都不修改入参数组（任何 `push` / `sort` 会在冻结态抛 `TypeError`）；档位数组长度不变。
- **判据**：
  - `assert.doesNotThrow(() => validateAgentData(frozen, triggerTable))`
  - `assert.doesNotThrow(() => renderAgent({ agent: frozen[0], trigger: triggerTable[frozen[0].name], template, sharedBlocks, outputFormats }))`
  - `const before = patternRegistry.tools.producer.length; /* 3 次调用后 */ assert.equal(patternRegistry.tools.producer.length, before)`
- **红绿证据**：红 = 校验器或渲染器「顺手归一」`sort()` → 冻结态抛；共享引用被外部 `push` → 长度变。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不要求返回深拷贝（§8 建议 7，加固而非验收项）。

### S5-TC-D10 条目自带 tools 的展开顺序后门：`...s` 在 `toolsForSeat` 之后（允许拆行）+ 外来 tools 被拒

- **覆盖**：§5 展开顺序 / F3
- **来源**：spec 推导（§5「展开顺序硬约束」+ 测试构造；第 2 轮 QA：map 可拆多行，不绑同一行）
- **前置**：`agentData.mjs` 尾部 map 已改为 `toolsForSeat(s.name)`。
- **步骤**：① 读 `agentData.mjs`，用空白归一的 `/tools:\s*toolsForSeat\(\s*s\.name\s*\)/` 全局匹配，断言恰 1 处并取其 `index` 作为 `i`；② 从 `i` 往后找 `...s` 的位置 `j`，断言 `j > i` 且 `j - i < 400`（允许 map 拆行，但必须在同一次对象展开内）；③ 构造「producer 席 tools 被换成只读三元组」的数据，断言 `ToolsViolation`。
- **预期**：`...s` 一定在 `tools` 之后（否则条目自带 tools 会静默覆盖档位）；外来 tools 不能通过校验（集合恰等）。
- **判据**：
  ```js
  const src = readRepo('tools/docgen/components/agentData.mjs');
  const TOOLS_CALL = /tools:\s*toolsForSeat\(\s*s\.name\s*\)/;          // 空白归一，不绑单行字面
  const hits = [...src.matchAll(new RegExp(TOOLS_CALL.source, 'g'))];
  assert.equal(hits.length, 1, '`tools: toolsForSeat(s.name)` 必须恰 1 处（空白归一后）');
  const i = hits[0].index;
  const j = src.indexOf('...s', i);
  assert.ok(j > i, '`...s` 必须在 tools 之后（否则条目自带 tools 静默覆盖档位）');
  assert.ok(j - i < 400, '`...s` 距 `tools` 过远，可能不是同一次对象展开');

  mutated.find((a) => a.name === 'reviewer-audit').tools = ['Read', 'Glob', 'Grep'];
  assert.throws(() => validateAgentData(mutated, triggerTable), (e) => e.code === 'ToolsViolation');
  ```
- **红绿证据**：红 = 把 `...s` 写在 `tools:` 之前，条目自带 `tools` 会覆盖档位且校验看到的是被覆盖值（自洽绿）；把 map 拆成三行且 `...s` 落在别的对象里（第 3 条 `j - i` 超限）；绿 = 顺序 + 行为双守。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不要求运行时禁止条目带 `tools`（注释 + 测试兜，§5 口径）。

### S5-TC-E01 `pilot-data.test.mjs` 两处 tools 改六元组；`:45` 标题不再写「command 档」

- **覆盖**：V-5 / §11.3 D7 / P-6
- **来源**：spec 推导（第 2 轮 P2 顺批：`pilot-data.test.mjs:45` 标题也写死了「command 档」）
- **前置**：`agentData` 已升档。
- **步骤**：① 读文件；② 断言四元组字面量 0 处；③ 断言六元组字面量 2 处；④ 断言标题不再写「command 档」、改写为「producer 档」；⑤ 跑该文件。
- **预期**：`['Read','Glob','Grep','RunCommand']` 0 处；`['Read','Glob','Grep','Write','Edit','RunCommand']` 2 处；`detective-observer tools = command 档` 0 处、`detective-observer tools = producer 档` 1 处；文件全绿。
- **判据**：
  - `assert.equal((src.match(/'Read', 'Glob', 'Grep', 'RunCommand'/g) ?? []).length, 0)`
  - `assert.equal((src.match(/'Read', 'Glob', 'Grep', 'Write', 'Edit', 'RunCommand'/g) ?? []).length, 2)`
  - `assert.equal(/detective-observer tools = command 档/.test(src), false)`
  - `assert.match(src, /detective-observer tools = producer 档/)`
  - `assert.equal(run('node --test tools/docgen/test/pilot-data.test.mjs').status, 0)`
- **红绿证据**：红 = 改前 `pilot-data.test.mjs:12` 与 `:47` 各一处四元组、`:45` 标题写「command 档」（实测）；绿 = 两处六元组 + 标题改 producer。
- **对应测试**：`tools/docgen/test/pilot-data.test.mjs`（本用例即改这个文件）
- **不覆盖**：不改该文件其它断言（八键、`identity`、`fixedList` 等与档位无关）。

### S5-TC-E02 `pilot-render.test.mjs` 的 tools 行正则改为六元组

- **覆盖**：V-5 / §11.3 D7
- **来源**：spec 推导
- **前置**：同 E01。
- **步骤**：① 读文件；② 断言旧正则不在、新正则恰 1 处；③ 跑该文件。
- **预期**：`/^tools: Read, Glob, Grep, RunCommand$/m` 0 处；六元组正则恰 1 处；全绿。
- **判据**：
  - `assert.equal(src.includes('/^tools: Read, Glob, Grep, RunCommand$/m'), false)`
  - `assert.equal((src.match(/\^tools: Read, Glob, Grep, Write, Edit, RunCommand\$\/m/g) ?? []).length, 1)`
  - `assert.equal(run('node --test tools/docgen/test/pilot-render.test.mjs').status, 0)`
- **红绿证据**：红 = 改前 `pilot-render.test.mjs:87` 是四元组正则，而渲染已是六元组 → `assert.match` 失败；绿 = 改后通过。
- **对应测试**：`tools/docgen/test/pilot-render.test.mjs`（本用例即改这个文件）
- **不覆盖**：不改 `fixedList` 行数断言（与档位无关）。

### S5-TC-E03 `validate.test.mjs` 标题去档位计数、按 `tools` 派生；`isTierCountLine` 判别力样例

- **覆盖**：V-5 / F12 / P-6
- **来源**：spec 推导（议会 QA-1-01；第 2 轮 QA/AI：样例行被全仓扫描判红 → 改由「同一谓词 + 运行时拼样例」解决）
- **前置**：四档落地。support 模块（`tools/docgen/test/support/dev-workflow-checks.mjs`）已把剥离逻辑导出为单源（现有内部 `noComment` / `noString` 就地改名复用，**不另起实现**）：
  ```js
  export const stripComments = (l) => l.replace(/\/\/.*$/, '');
  export const stripCommentsAndStrings = (l) => stripComments(l)
    .replace(/'(?:[^'\\]|\\.)*'/g, '').replace(/"(?:[^"\\]|\\.)*"/g, '');
  // 计数判据：必须看见标题（标题是字符串）→ 用剥注释文本；「退出码 N 档」显式排除
  export const isTierCountLine = (l) => /[四五六]档/.test(stripComments(l)) && !/退出码/.test(stripComments(l));
  ```
  说明：`counterProbes`（`support/dev-workflow-checks.mjs:187-201`）内部的 `noString` 未导出（实测），故本用例要求实现把它导出为 `stripCommentsAndStrings` 并由 `counterProbes` 复用同一实现——**不允许第二套口径**。`stripCommentsAndStrings` 只用于证明「样例行在源文本层不可见」（E04 不误红的机制），不用于计数判据（否则标题必逃检）。
- **步骤**：① 用**运行时拼出的样例行**证明判据判别力（`String.fromCharCode(0x4e94)` 拼「五」，源文件里不出现「五档」连写）；② 断言注释行与「退出码 N 档」不误红；③ 扫 `validate.test.mjs` 全文，断言工具档位计数 0 行；④ 断言派生式在位。
- **预期**：坏标题命中、注释行不命中、「退出码五档」不命中、字符串内的真实计数仍命中；`validate.test.mjs` 的 `bad` 列表为 `[]`；文件内出现 `Object.keys(patternRegistry.tools)` 或 `Object.entries(...)`。
- **判据**：
  ```js
  import { readRepo, counterProbes, stripCommentsAndStrings, isTierCountLine } from './support/dev-workflow-checks.mjs';

  const TIER_CN = String.fromCharCode(0x4e94); // 五（拼出来，源文本不含「五档」连写 → E04 扫不到）
  assert.equal(isTierCountLine(`test('断言 4：tools 按席分档（15 席 / ${TIER_CN}档）', () => {})`), true);   // ① 判别力
  assert.equal(isTierCountLine(`// 旧注释：${TIER_CN}档：readOnly 12`), false);                            // ② 注释被剥
  assert.equal(isTierCountLine(`test('退出码${TIER_CN}档映射：exitCodeFor 对齐 §7')`), false);              // ② 语境排除
  assert.equal(isTierCountLine(`const t = '${TIER_CN}档';`), true);                                        // ① 字符串内仍判

  const src = readRepo('tools/docgen/test/validate.test.mjs');
  assert.deepEqual(src.split(/\r?\n/).filter(isTierCountLine), []);                                        // ③ 目标文件归零
  assert.match(src, /Object\.(keys|entries)\(patternRegistry\.tools\)/);                                   // ④ 派生式
  ```
- **红绿证据**：红 = 改前 `tools/docgen/test/validate.test.mjs:29` 标题写「15 席 / 四档」（实测）→ ③ 的 `bad` 非空；只改成「五档」也红（F12 原文理由：只换字面量下次再加档重犯）；若把 `isTierCountLine` 定义在**剥字符串**的文本上，①③ 全部失效（标题是字符串，必逃检）。绿 = 派生式在位且 0 行。
- **对应测试**：`tools/docgen/test/validate.test.mjs`（本用例即改这个文件）+ `support/dev-workflow-checks.mjs`（新增三处导出）
- **不覆盖**：不改该文件其它 14 条断言的逻辑；不判 `counterProbes` 既有两类探针的语义（既有测试覆盖）。

### S5-TC-E04 全仓测试零硬编码档位数量（同一 `isTierCountLine`）+ 旧计数注释守卫 + 样例行不自伤

- **覆盖**：V-5 / F12
- **来源**：spec 推导（议会 QA-1-01；第 2 轮 QA/AI：与 E03 共用同一谓词，且本文件自身不得被样例行扫红）
- **前置**：P-6 全部改完；E03 的样例行已用运行时拼接（源文本无「五档」连写）。
- **步骤**：① 用 `readCounterFiles()` 取全部测试文件；② 逐文件按 **E03 的同一个** `isTierCountLine` 过滤；③ 断言 `validateAgentData.mjs` 注释不含旧档位计数；④ 断言 E03 所在文件（`tool-tiers.test.mjs`）源文本里 `[四五六]档` 出现 0 次（样例行不自伤的结构证据）；⑤ 用 `counterProbes` 做同源行为交叉核（注释内数字不算）。
- **预期**：工具档位语境的档位计数 0 命中；「退出码 N 档」不误红；`readOnly 12` / `sdet 1` / `command 2` 在 `validateAgentData.mjs` 中 0 命中；`tool-tiers.test.mjs` 自身不被扫红。
- **判据**：
  ```js
  import { readCounterFiles, readRepo, counterProbes, isTierCountLine } from './support/dev-workflow-checks.mjs';

  for (const [f, s] of Object.entries(readCounterFiles())) {
    assert.deepEqual(s.split(/\r?\n/).filter(isTierCountLine), [], f);
  }
  assert.equal(/readOnly 12|sdet 1|command 2/.test(readRepo('tools/docgen/components/validateAgentData.mjs')), false);
  assert.equal((readRepo('tools/docgen/test/tool-tiers.test.mjs').match(/[四五六]档/g) ?? []).length, 0, '样例行必须运行时拼接，否则本文件自伤');
  assert.deepEqual(counterProbes({ 'fixture.test.mjs': "const a = 15; // 注释里的 15 不算" }).baseline, []);  // 同源：也剥注释
  ```
- **红绿证据**：红 = 改前 `tools/docgen/test/validate.test.mjs:29` 命中「四档」、`validateAgentData.mjs:40` 命中「15 席 / 四档：readOnly 12、sdet 1、command 2」（实测）；把 E03 的样例写成字面「五档」→ 第 3 条红；绿 = 三项归零且不误伤「退出码五档」（`tools/docgen/test/validate.test.mjs:91`）。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不禁止测试名里写「15 席」（席位数由 `agentData.length` 派生，一致性归 A04）；不判 `counterProbes` 两类探针的阈值。

### S5-TC-E05 `tools.command` 四元组仍在、`renderBoundary('reviewer-audit')` 非空且等于 `boundaryBySeat` 值

- **覆盖**：V-1 / F8 / §2「不做什么」
- **来源**：spec 推导（第 2 轮 QA：删「无席挂 command」——S2 可能把精算师挂 `command`，锁当期会误红）；**判据由 S6 改判**（S6 spec §3.6 ①：旧的边界常量为死常量已删，改为「渲染结果非空且 === 映射值」）
- **前置**：P-1 / P-2 改完（`command` 档从「两席在用」变为「保留」）；S6 已落 `components/renderBoundary.mjs` 与 `components/patternRegistry.mjs` 的 `boundaryBySeat` 映射（`renderBoundary` / `boundaryBySeat` 分别从这两个文件导入）。
- **步骤**：① 断言 `tools.command` 四元组；② 断言 `renderBoundary('reviewer-audit')` 非空**且** `=== boundaryBySeat['reviewer-audit']`。
- **预期**：四元组保留（实测改前 `patternRegistry.mjs:34`）；渲染结果非空且与映射值相等（`boundaryBySeat` 的值由 `renderBoundary` 派生，S6 spec §3.6）。**不判当期是否有人挂 `command`**。
- **判据**：
  - `assert.deepEqual(patternRegistry.tools.command, ['Read', 'Glob', 'Grep', 'RunCommand'])`
  - `const rendered = renderBoundary('reviewer-audit'); assert.equal(typeof rendered === 'string' && rendered.length > 0, true)`
  - `assert.equal(rendered, patternRegistry.boundaryBySeat['reviewer-audit'])`
- **红绿证据**：红 = 为「干净」删掉 `command` 档 → 第一条红（F8）；渲染结果为空串、或与 `boundaryBySeat['reviewer-audit']` 不等（只改定义层 / 模板 / 席位数据的一边）→ 第二、三条红。绿 = 四元组在位 + 渲染非空且与映射值相等。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不判将来该由谁挂 `command`（S2）；不判当期是否有人挂（会与 S2 决策撞车）。

### S5-TC-E06 `review-fixes` I5 样本必须是运行时 `readOnly` 席（不是 `data[0]`）

- **覆盖**：V-5 / V-7 / §11.3 D8
- **来源**：实现观察（补充）（议会 QA-1-01 的假阴性教训；spec §11.3 D8 已点名 `data[0]` 语义变化）
- **前置**：`data[0]` = `reviewer-audit`（`agentData.mjs` 首条），升档后为 producer（实测该文件 I5 用例现用 `data[0]`）。
- **步骤**：① 克隆并重建 `tools`；② 取 `reviewer-qa` 样本，**运行时断言** `tierOf(sample.name) === 'readOnly'`；③ 样本多带 `Write`，断言 `ToolsViolation`；④ 读 `review-fixes.test.mjs`，断言不再用 `data[0]` 当普通席。
- **预期**：样本的「只读」语义由 `tierOf` 在运行时钉住；越权行为真实被拒；源码里 `data[0]` 写法清零。
- **判据**：
  ```js
  const sample = d.find((a) => a.name === 'reviewer-qa');
  assert.equal(tierOf(sample.name), 'readOnly');
  sample.tools = [...toolsForSeat(sample.name), 'Write'];
  assert.throws(() => validateAgentData(d, triggerTable), (e) => e.code === 'ToolsViolation');
  const src = readRepo('tools/docgen/test/review-fixes.test.mjs');
  assert.equal(/data\[0\]\.tools = \[\.\.\.patternRegistry\.tools\.readOnly, 'Write'\]/.test(src), false);
  ```
- **红绿证据**：红 = 保持 `data[0]`：升档后它仍是 producer，用例虽绿但命题已从「readOnly 越权被拒」变成「producer 少给工具被拒」（假阴性）；绿 = 运行时 `tierOf === 'readOnly'` + 真实越权。
- **对应测试**：`tools/docgen/test/review-fixes.test.mjs`（本用例即改这个文件）+ `tool-tiers.test.mjs`
- **不覆盖**：不改该用例的期望错误码与「恰等」判法。

### S5-TC-E07 `gate` 的 `N/N` 由基线清单派生，测试里不出现字面 `37/37`

- **覆盖**：V-4 / F12
- **来源**：spec 推导
- **前置**：`baseline.mjs` 导出 `BASELINE_RULES` / `agentPaths()`。
- **步骤**：① 计算 `N`；② 断言基线席数 = 现役席数；③ 断言 `gate` 输出匹配派生正则；④ 扫描**除自身外**的测试源，断言不出现「baseline + 字面数字」。
- **预期**：`N` 派生（当前 37，只作说明）；其他测试文件内 `37/37` 0 处。
- **判据**：
  - `const N = BASELINE_RULES.length + agentPaths().length; assert.ok(N > 0)`
  - `assert.equal(agentPaths().length, agentData.length)`
  - `assert.match(gate.stdout, new RegExp('^baseline ' + N + '/' + N + '$', 'm'))`
  - `for (const [f, s] of Object.entries(readCounterFiles())) if (f !== 'tool-tiers.test.mjs') assert.equal(/baseline \d+\/\d+/.test(s), false, f)`
- **红绿证据**：红 = 把 `37/37` 写进测试（spec §6 步骤 7 直译），S2 加席后必红一次；绿 = 派生式。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不校验基线清单该含哪些文件（`check-baseline.test.mjs` 已覆盖）。

### S5-TC-E08 `skills/` 全树无「已授 command 档」+ 三处流程文档含「已授 producer 档」

- **覆盖**：V-9 / P-7 / F11
- **来源**：spec 推导（议会 PR-1-01；第 2 轮 PR/AI：扩到 `skills/` 全树；第 3 轮收范围：账本模板改造拆 S5-B，本条只留 V-9 字面要求）
- **前置**：P-7 完成（三处文档：`debate-protocol.md:17`、`round-check.md:21`、`stage-4-quality.md:28`，实测行号）。
- **步骤**：① 递归扫 `skills/` 下全部 `.md`，断言旧句 0 处；② 断言扫描集非空（防「扫了 0 个文件」的恒真）；③ 三处文档逐个断言新句在位。
- **预期**：`skills/` 全树旧句 0；三处文档新句在位。
- **判据**：
  ```js
  const OLD = /已授\s*`command`\s*档/;
  const NEW = /已授\s*`producer`\s*档/;
  const files = [...mdFilesUnder('skills')];
  assert.ok(files.length > 0, 'skills/ 下必须扫到 markdown 文件（防恒真）');
  for (const [f, s] of files) assert.equal(OLD.test(s), false, f);

  const DOCS = ['skills/parliament/references/debate-protocol.md',
                'skills/parliament/assets/round-check.md',
                'skills/dev-workflow/references/stage-4-quality.md'];
  for (const p of DOCS) assert.match(readRepo(p), NEW, p);
  ```
- **红绿证据**：红 = 改前三处文档分别命中 `debate-protocol.md:17`、`round-check.md:21`、`stage-4-quality.md:28`（实测）；漏改任意一处 → 第 1 条或第 3 条红。绿 = 全树归零 + 三处命中。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不判流程执行时 agent 是否真的用上写权（§6「不测」）；不判账本模板（`progress.md` / `round-check.md` 结构改造归 S5-B）；不判 PRD 正文（本 spec 不改 PRD）。

### S5-TC-E09 `open-items.md` 无 `| B-5 |`；B-1 换成三条接班条目；仍标未决

- **覆盖**：V-10 / P-8 / §11.3 D10 / F14
- **来源**：spec 推导（议会 PR-1-04；第 3 轮收范围：B-1 拆三条接班条目）
- **前置**：P-8 完成（改前实测：`| B-1 |` 在 `open-items.md:18`、`| B-5 |` 在 `:20`）。
- **步骤**：① 读 `docs/after/20261024174253-dev-workflow-mainline-open-items.md`；② 断言 `| B-5 |` 与 `| B-1 |` 都不在；③ 断言存在**三条**接班条目：`research` → S5-R（触发 = S2 市场卡）、精算师取数权 → S2、S5-B（检测脚本 / CLI B3 门 / 账本模板改造）；④ 断言仍标「未决」。
- **预期**：B-5 迁出；B-1 拆成三条（不是整行删掉销账）；账本整体保留且仍为未决。
- **判据**：
  ```js
  assert.equal(src.includes('| B-5 |'), false);
  assert.equal(src.includes('| B-1 |'), false);
  const rows = src.split(/\r?\n/).filter((l) => l.startsWith('|'));
  assert.ok(rows.some((l) => /research/.test(l) && /S5-R/.test(l) && /S2/.test(l)), '缺 research → S5-R 接班条目');
  assert.ok(rows.some((l) => /精算师|reviewer-actuary/.test(l) && /取数|command/.test(l) && /S2/.test(l)), '缺精算师取数权 → S2 接班条目');
  assert.ok(rows.some((l) => /S5-B/.test(l) && /检测|B3|模板/.test(l)), '缺 S5-B 接班条目');
  assert.match(src, /状态：\*\*未决\*\*/);
  ```
- **红绿证据**：红 = 改前 `:18` 是 `| B-1 |`、`:20` 是 `| B-5 |`（实测）；整行删 B-1 会销掉三件未完成事（第 3 条三个 `rows.some` 至少一个红）。绿 = 拆分 + 迁出 + 未决在位。
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs`（待 plan Task N）
- **不覆盖**：不校验 PRD 状态行（spec §2：不改 PRD 正文）；不判条目编号（编号可重排，只判内容三件）。

## 3 负例与边界（汇总裁定表）

> 数量硬门：本表 **29** 条 ≥ 第 2 节「正」用例 **22** 条。

| 用例 ID | 边界/负例是什么 | 为什么容易漏（真实会发生的形态） | 期望行为 |
|---|---|---|---|
| S5-TC-A06 | `tierBySeat` 值 = 空串 / `'Producer'` / 不存在的档位名 | `??` 拦不住空串（同仓 `resolveDomain` 的既有教训）；大小写靠肉眼 | 命名守卫抛「未知档位」；且先证明改写生效 |
| S5-TC-A07 | 工具名拼错 / 大小写错（`Websearch`）/ 残留 `WebFetch` | 手抄工具名 + 平台对名字大小写敏感；S5-R 的工具容易顺手留下 | 白名单判据判红 |
| S5-TC-A08 | 席名大小写不同（`Reviewer-Audit`） | 有人以为查表会自动归一 | 回落 `readOnly`（默认拒绝） |
| S5-TC-A09 | 席名命中 `Object.prototype` 键（`constructor`） | 字面量对象查表会命中原型链；`constructor` 能过 `NAME_RE` | 回落 `readOnly` |
| S5-TC-A10 | `defaultTier` 被改成 `producer` | 「默认值」改动只有一行，review 容易当无关变更放过 | A02 的字面判据对构造值即红；改默认值确实把 `ghost` 抬成 producer（权限面可观测） |
| S5-TC-B08 | 只改 tools、boundary 仍是 `BOUNDARY_COMMAND` | 两个文件两处改，容易只改一处；`gate` 对此态恒绿 | producer 席 boundary 必不等于旧常量 |
| S5-TC-B09 | `B3` 注解为 `pending` | 重判子代理只回了话、没写回文件 | 拒写盘；写回 `pass` 才落盘；四字段齐 |
| S5-TC-B10 | 缺 `DOCGEN_JUDGED_BY` | 本地跑顺手省略环境变量；历史上曾有占位默认名 | `UnapprovedChange` exit 4，不写盘 |
| S5-TC-B11 | 盘上卡已变但 evidence 哈希未更新 | 手改卡 / 上次 replace 崩溃 | `TargetDrift` exit 1 |
| S5-TC-B12 | 盘上 == 渲染时跑 `replace` | 测试前置没构造差异，把 exit 0 当「拒写盘」 | 幂等恢复 exit 0，`changes` 不追加 |
| S5-TC-B13 | 正文合法提及旧短语 → 误红；边界节残留裸短语 / 完整旧句 → 漏红；允许句与禁止句同段 → 互相误伤 | 「整卡 `includes`」写法的经典假阳性；只判完整句会漏裸短语；按整节判 `progress.md` 会与 §3.3② 的自相矛盾 | 只判边界节切片 + 双条判据 + 允许/禁止两段切分（与 B02/B03 同一组函数） |
| S5-TC-B14 | 半改态（六元组 tools + 只读边界） | 只改一个文件；渲染自洽，`gate` 抓不到 | 矛盾探针命中 |
| S5-TC-C03 | 手改 `agents/*.md` 一字节 | 「就改个错别字」 | `gate` exit 1 + `Mismatch` |
| S5-TC-C05 | 只改 tools 顺序、集合不变 | 重排数组看起来是「整理」，校验照样绿 | `gate` exit 1（逐字节） |
| S5-TC-C06 | 连跑两次 `gate` | 只读命令顺手落痕（「反正方便」） | 输出逐字相同、文件哈希不变 |
| S5-TC-C08 | 只生成一席草稿 | 先替换一席「看起来更快」 | 旁席 `Mismatch` 挡住 |
| S5-TC-D01 | readOnly 席多一个 `Write` | 最直白的越权形态 | `ToolsViolation` |
| S5-TC-D02 | 未映射席带 `WebSearch` | 容易误以为「S5-R 登记过联网档就等于给了」 | `ToolsViolation`（回落 readOnly） |
| S5-TC-D03 | producer 席加 `WebSearch` / 同档两席共享数组 | 「已经是高权限席了，多一个无所谓」；克隆后仍共享引用 | `ToolsViolation` 且乙席不被连带 |
| S5-TC-D04 | `producer` 整档挂给 readOnly 席 | 映射表复制粘贴改错键 | `ToolsViolation` |
| S5-TC-D05 | producer 席 tools 顺序打乱 | 把「集合相等」误当「顺序相等」→ 假阳性 | 判绿 |
| S5-TC-D06 | tools 含重复元素 | 手写数组 + `push` 漏判重复；双向包含都成立 | 当前通过 → G-2 已登记 |
| S5-TC-D07 | `senior-sdet` 加 `RunCommand` | 「sdet 反正已经能写，加个命令权而已」 | `ToolsViolation` |
| S5-TC-D08 | producer 席 boundary 删键 / 空串 / 全空格 | 删键时现码「有键才校验」，静默退回默认句；只测审计席会漏侦探 | `DescriptionDerivation`（三形态 × 全 producer 席） |
| S5-TC-D09 | `tools` 被冻结后校验 / 渲染 | 有人为「规范化」加 `sort()` / `push()` | 不抛，且档位数组长度不变 |
| S5-TC-D10 | 条目自带 tools 覆盖档位（`...s` 位置错 / map 拆行后跑偏） | `...s` 放最后是硬约束，注释挡不住人；拆行后肉眼难判 | 源码顺序（`j > i` 且间距 < 400）+ 外来 tools 被拒 |
| S5-TC-E04 | 测试里写死档位数量 / 注释旧计数 / 样例行自伤 | 历史踩点（「四档 / 608 tests」）；宽 grep 误伤「退出码五档」；样例字面量把自己扫红 | 同一谓词下工具档位语境 0 命中、旧注释 0 命中、样例行源文本 0 命中 |
| S5-TC-E06 | 用 `data[0]` 当「普通席」样本 | 数组顺序变了，测试仍绿但命题已换 | 运行时 `tierOf === 'readOnly'` |
| S5-TC-E07 | 判据里写死 `37/37` | spec 步骤 7 写「当前 37」，直译进测试 = 下次加席必红 | 派生 `N` |

## 4 回归清单

| 如果改了 | 必须重跑 | 为什么 |
|---|---|---|
| `patternRegistry.mjs`（`tools` / `tierBySeat` / `defaultTier` / `toolsForSeat` / `boundaryBySeat` / `BOUNDARY_*`） | S5-TC-A01～A10、C01、C02、C05、D01～D10、E05 | 档位表是权限面唯一真相，15 席全部派生自它 |
| `agentData.mjs`（尾部 map / 两席 boundary / 侦探固定清单第 4 项） | S5-TC-A04、A05、B01～B03、B06、B08、C01、C02、D08、D10 | 卡面由数据渲染，数据错 = 至少 2 席错 |
| `validateAgentData.mjs`（断言 4 / 槽位白名单 / producer 缺边界分支） | S5-TC-A03、A05、D01～D10、C07、E04 | 校验粒度一变，全部负例的期望值都变 |
| `outputFormats.mjs` | S5-TC-B04、C01 | 审计输出格式直接进卡面 |
| `cli.mjs` 的 `buildJudged` / `judgeId` / 幂等分支 | S5-TC-B09～B12、C08 | 时效门、判者门、短路语义都在这里（触达门 / 结论门归 S5-B） |
| `agents/reviewer-audit.md` / `agents/detective-observer.md`（任何字节） | S5-TC-B01～B08、C01、C03、C04、C08 | 只许经 docgen 改；手改必 `Mismatch` |
| `docs/superpowers/specs/2026-10-25-s5-tool-tiers-design.md` 的 §3.3 检测证据表 / §4 判者表 / V-8 的命令形态改动 | 必跑 S5-TC-B06（③④ 与 ④-b） | 三处 `git` 命令必须与 §3.3④ 白名单同源（§3.3「同源硬约束」）；B06 的锚用稳定文案，行号漂移不影响 |
| `rules/.inspector-annotations.json` 的 `*:B3` | S5-TC-B07、B09、C07 | `buildJudged` 机械转录该值 |
| `rejudge-<席>-B3.md` / 本轮 `progress.md` 派工节 | S5-TC-B07、B09 | 判者三处一致的第三、第四处证据 |
| `tools/docgen/fixtures/{reviewer-audit,detective-observer}.evidence.json` | S5-TC-B07、B09、B11、C06 | 重判留痕与漂移判定的唯一载体 |
| `tools/docgen/components/baseline.mjs` / `baseline.json` / `state.json` | S5-TC-C01、C07、E07 | `baseline N/N` 与覆盖席数由此派生 |
| `tools/docgen/test/support/dev-workflow-checks.mjs`（新增 `stripComments` / `stripCommentsAndStrings` / `isTierCountLine`，`counterProbes` 改用它） | S5-TC-E03、E04 + 既有 12 处计数探针用例 | 剥离口径一变，全部计数探针的假阳性/假阴性一起变 |
| 三处流程文档（`debate-protocol.md` / `round-check.md` / `stage-4-quality.md`） | S5-TC-E08 | agent 读流程文档优先于读档位定义 |
| `docs/after/…open-items.md` | S5-TC-E09 | B-1 / B-5 的收口口径 |
| `pilot-data` / `pilot-render` / `validate` / `review-fixes` 四处测试 | S5-TC-E01～E04、E06 | 旧断言写死档位，漏改必红 |
| 未来 S2/S3 加席（`tierBySeat` + `boundaryBySeat`） | S5-TC-A02、A03、A04、C02、C07、E07 | 加席只改映射，测试必须自动跟随、不出现隐含名单 |
| 未来 S5-R 加 `research` 档 | S5-TC-A02、A07、E09 | A01 已不判 research 存在性；A02 的映射校验与 E09 的接班条目会随 S5-R 更新 |

## 5 只手动验证

| 项 | 为什么机器验不了 | 谁验、看什么 |
|---|---|---|
| 两份边界句的「写入范围」是否真覆盖两席职责产出位（§3.3②） | 「够不够严」是语义判断；机器只能查关键词在不在 | `reviewer-qa` + 审计：逐条把 §3.3② 的写入对象与两席实际产出（核对单 / 审计表 / 观察记录 / 快照原文）对照，缺一项即卡 |
| 侦探的轮初 / 轮末快照是否真落了 `detective.md` | 属运行时产物，本 spec 只定边界文本（账本模板改造归 S5-B） | 议会侦探实例自证 + 审计抽查 1-2 轮（证据栏写「取数命令 + 输出」） |
| 审计是否真核了「签字原文转录逐字一致」（§3.3 末段） | 需要人对着 `gate-record.md` 六列逐行比对，并核用户签字行的「核了什么」出处 | 审计：逐行核六列；用户签字行必须带 `docs/handoffs/<文件>:行` 或本轮对话路径 |
| `progress.md` 段二 / 段三是否由主持人**逐字转录**侦探 / 审计产出 | 两席已被禁止写 `progress.md`，误抄后只有第三方能发现；属运行时流程 | 审计：用 `git diff --no-index` 或逐行比对 `progress.md` 段二/段三 与 `detective.md` / 审计核对单原文，证据栏贴不一致行号；不一致即卡 |
| B3 重判是否真由**独立**子代理完成 | `judgedBy` 只证「谁跑了命令」，不证「判是不是新做的」（G-6） | 审计：核对 `DOCGEN_JUDGED_BY` 标识与 `rejudge-<席>-B3.md`、`progress.md` 派工节三处逐字相等，且 annotations 该键在重判前后确有变化 |
| 漏带 `--rejudge B3` 时是否被人发现 | spec §4「限度」明写无机器门（检测门强化归 S5-B） | 审计：核两席 `replace` 命令原文是否都带 `--rejudge B3`，并与 `changes[].rejudged` 对账 |
| 越权写已发生后的复原实操（§3.3⑤） | 涉及「由用户执行复原命令 + 审计复算清单」，是流程不是代码 | 审计：越权清单含文件 + 改前/改后 sha256 + 是否可复原 + 命令原文；复原命令由用户执行 |
| 无子代理环境降级（§4「降级」） | 需要判断「本环境是否真无子代理」，不可确定性复现 | 申报人：报告首行须标「降级模式（B3 未独立重判）」且不得执行 `replace`；审计核报告首行与 `state.json` 是否一致 |
| `skill-inspector` 是否 `0 findings` | `check-all.mjs` 直接透传其 stdout，文案随工具版本变 | 用户 / 审计：看 `npm run check` 的 ③ 段原文，`findings` 计数为 0 |
| 卡面「已授 producer 档」是否与审计实际能力相符 | 涉及「审计被允许做什么」的业务判断 | `reviewer-product`：对照 §3.3① 档位事实段，确认无「假装有白名单」的表述 |

## 6 不测（带理由）

| 不测什么 | 为什么 |
|---|---|
| 市场 / 产品经理 / `speaker` 卡的 tools 与边界 | spec §2「不做什么」：S2 / S3 范围 |
| `research` 档的定义、卡面边界与挂席 | spec §3.4：`research` 整体拆 S5-R（含 `tierBySeat` / `boundaryBySeat` 两条映射与 `BOUNDARY_RESEARCH`）；本轮连档位都不登记 |
| 「本轮是否有席挂 `research` / `command`」 | S2 / S3 决策；写进用例会在挂席当天必红（A04 / E05 已改为豁免式或删除该断言） |
| `reviewer-actuary` 是否该挂 `command` | §2「不做什么」：本轮不扩范围，S2 决定（接班条目见 E09） |
| 检测脚本（`session-snapshot`）、CLI B3 机器门（`touchedSemanticKeys` / verdict 门）、`progress.md` 与 `round-check.md` 模板改造、`round-check` 第 6/7 项 | spec §2 / §10：整体拆 S5-B；本 spec 只写「检测限度」（§3.3⑤）不造工具，故 v3 的 C07 / C08 / B09 / B10 / B17 与 E08 的模板断言全部移除 |
| 「漏 `--rejudge` 是否被运行时拦」 | spec §4「限度」明写无机器门；只靠 V-8 事后核 + 审计（B07 / §5 第 5 条） |
| `check-prd-graph.mjs` 相关命令 | F-15 归 S2，命令尚不存在；`producer` 边界句因此不预写该命令 |
| PRD 正文与功能点集合是否被改动 | spec §2「不改 PRD 正文 / 功能点集合」；PRD 只读，改动检测归议会审计 |
| 平台是否真的支持参数级白名单 | PRD §9.1 已实查并裁定「不支持」（D-14）；属既成事实 |
| `replace` 的迁移段（`EvidenceInvalid` / `goldenAssertion` 等） | 不在本 spec 变更半径，既有测试已覆盖 |
| `producer` 两席在真实评审里的使用情况（自跑命令 / 写本人产出） | spec v4 未设运行时验收项（收范围后无「演练」条目）；由议会流程自证 + §5 第 1 / 2 条人工抽查 |

## 7 缺口与判别力水位

**已由 spec 收口（编号作废不复用）**：

- **G-1**「原型链键名绕过默认拒绝」→ spec §3.2 已要求 `tierOf` 用 `Object.hasOwn` 判自有键；对应用例 `S5-TC-A09`（现为 spec 边界用例，非缺口）。
- **G-3**「`producer` 席可缺 `boundary`」→ spec §3.3 + §11.3 D3 已要求 `DescriptionDerivation`；对应用例 `S5-TC-D08`（现为负例，期望抛错）。
- **G-8**「V-2 第 4 条与保留档互斥」→ spec v4 §8 V-2 已写成「`tools` 每个档位 ∈ `Object.values(tierBySeat)` ∪ `[defaultTier, 'command']`」；`S5-TC-A04` 按该口径断言，**缺口关闭**。

| 缺口 | 漏检哪类反例 | 至少 1 个样例 | 语义由谁兜 |
|---|---|---|---|
| **G-2** tools 含重复元素不被拦 | 重复工具名能通过双向集合包含，卡面会渲染出 `Read, Read` | `['Read','Read','Glob','Grep','Write','Edit','RunCommand']` | `S5-TC-D06`（探针）+ §8 建议 8 |
| **G-4** `toolsForSeat` 返回共享数组引用 | 任一处就地 `push` / `sort` 会污染全仓同档所有席（producer 两席共享同一数组） | `patternRegistry.tools.producer.push('X')` | `S5-TC-D03` / `S5-TC-D09` + §8 建议 7 |
| **G-6** 旧 `pass` 与「新重判」不可区分 | `judgedBy` 只证「谁跑了 replace」，annotations 里旧的 `pass` 会被机械转录成「重判通过」 | `rules/.inspector-annotations.json` 现为 `"pass"` | **spec 三道结构门降低但不消除**：时效门（B09，先 `pending`）、判者门（B10 + B07 三处逐字）、降级门（§5 第 7 条）。**剩余限度**：`pending → pass` 的写回仍可由同一实例完成——门只证「值变过」，不证「换人判过」；触达门与结论门拆到 S5-B 后，本轮**没有**「漏 `--rejudge`」与「判 `fail` 仍写盘」的机器拦截，故仍需 §5 第 4 / 5 条人工核 |
| **G-9** 允许清单与禁止子句在同一段文本里 | V-3 要求两卡「含『不得写 `progress.md`』」，若按整节判「不含 `progress.md`」必自相矛盾 | `progress.md` 同时出现在允许句与禁止句 | `S5-TC-B02` / `B03` 判**允许写切片**（`只允许写` → `**禁止写**`）+ 判**禁止写段**必须含两条禁令；切片函数由 `S5-TC-B13` 单源提供 |
| **G-10** 档位计数判据的「剥串」两难 | 标题里的计数在单引号串内：剥串则漏检（`tools/docgen/test/validate.test.mjs:29` 会逃），不剥串则负例夹具自伤 | 样例行 | `S5-TC-E03` / `E04`：计数判据用剥注释文本，样例行用 `String.fromCharCode` 运行时拼出；单一谓词 `isTierCountLine` |
| **G-11**（新）spec V-3 写短名 `gate-record.md`，§3.3② 写全路径 | 按 V-3 字面做子串判据会把完全合规的边界句判红（假阳性） | §3.3② 原文用全路径 | `S5-TC-B02` / `B03` / `B13` 统一用正则允许「短名或全路径」两种写法 |
| **G-12**（已收口）`tools.research` 缺席断言的跨 spec 过期 | v4 已从 A01 删除「research 不存在」断言；S5-R 落地时不再出现「守卫必红」 | 无 | 已收口：A01 只钉四档必需项，不判 research |

**自由探索（固定清单之外，现场扫出的 6 个角落）**：

1. **映射键可以是「不存在的席」**（`S5-TC-A02` / `A03`）——`tierBySeat` / `boundaryBySeat` 都可以写一个 `market-researcher` 占位键，`toolsForSeat` 照样返回档位数组，测试若只查「值合法」不会红。新增守卫：键必须是 `agentData` 里真实存在的席。
2. **未挂载档位可以悄悄长出第三档**（`S5-TC-A04`）——「登记了没人用」是死配置；`readOnly`（作为 `defaultTier`）与 `command`（作为保留档）是两个合法例外，第三个即违规。这条把「显式保留清单」变成可判，并且**同时挡住 S5-R 的 `research` 顺手加回来**。
3. **`data[0]` 的语义漂移**（`S5-TC-E06`）——升档改变了数组首项的含义，测试仍绿但命题被换，属最难发现的假阴性；用运行时 `tierOf === 'readOnly'` 钉住语义，而不是按名字过滤。
4. **共享数组引用**（`S5-TC-D03` / `D09`）——`structuredClone` 出来的两席仍共享同档数组；甲席注入会连带乙席，负例可能因此假红/假绿。
5. **「完整旧句」+「无条件裸短语」+「允许/禁止两段」三层判据**（`S5-TC-B02` / `B03` / `B13`）——新边界句会自然地写「禁止创建、修改、删除任何文件」，用裸短语判红会误伤；但只判完整句又会漏掉「旧口径以裸短语残留」；而 §3.3② 又要求同段里同时出现允许落点与两条禁令，按整节判必自相矛盾。三者共用 `assertBoundaryClean` + `writeScopeHalves`。
6. **证据链条目定位**（`S5-TC-B07`）——`changes.at(-1)` 在「同一轮多次 replace」时会指向错条；`to === renderSha256` 才是这条证据的身份。

## 8 给开发的建议

| # | 位置（文件:行 / spec 节号） | 风险或盲点 | 为什么会被忽略 | 具体改法 | 优先级 |
|---|---|---|---|---|---|
| 1 | spec §8 V-3 与 §3.3② | **已收口**：V-3 允许短名或全路径；B02/B03/B13 用正则兼容两种写法 | — | 已收口 | 已收口 |
| 2 | spec §8 V-1「不得登记 `research`」+ §3.4 | **已收口**：V-1 已写「本轮不得登记 research（A04+A07 双红）；S5-R 落地时同批改五档」 | — | 已收口 | 已收口 |
| 3 | `skills/parliament/assets/progress.md:40` vs spec §7 F9 | F9 只要求「边界句 + 固定清单」强制 `--no-optional-locks`，但账本模板段二仍写裸 `git status --porcelain`（实测 `:40`）；主持人是照模板抄原文的人，会绕过 F9 的口径 | 模板改造已拆 S5-B，容易被理解为「模板全部不用管」 | §7 F9 行补一句「模板 `progress.md:40` 的同类命令同步归 S5-B（该行号已在 S5-B 接班条目点名）」；或在 §10 拆出项行写死该行号。验收：S5-B spec 的输入清单含 `progress.md:40` | P2 |
| 4 | `tools/docgen/components/validateAgentData.mjs:40` | 注释仍写「15 席 / 四档：readOnly 12、sdet 1、command 2」，与改后四档 + 两席 producer 不符 | 注释不参与运行，施工容易漏；旧计数会误导后来的档位统计 | 注释改为「按 `toolsForSeat` 分档（席位数从 `agentData.length` 派生，档位数从 `Object.keys(tools)` 派生）」，不写具体数字。验收：`S5-TC-E04` 的旧计数守卫绿 | P2 |
| 5 | `tools/docgen/cli.mjs:459-460`（`buildJudged` 先于 `judgeId`） | 缺 `DOCGEN_JUDGED_BY` 时，若 annotations 也非 `pass`，先报「重判未完成」而不是「缺少判者标识」；测试与排障都要先置 `pass` | 两个门相邻，报错顺序看起来无关紧要 | 两条路：① 保持现状，在 spec §6 步骤 6 写明「先置 `pass` 再验判者门」（B09 / B10 前置已按此写）；② 把 `judgeId` 提到 `buildJudged` 之前，让「缺判者」永远先报。推荐 ①（不改执行顺序，风险最小）。验收：`S5-TC-B10` 的前置注释与实现一致 | P2 |
| 6 | spec §4「B3 的落账要求」表「触达」与「限度」两行 | 「触达」行说判据是「V-8 核 `changes[].rejudged` 含 B3」，而「限度」行提到的 `touchedSemanticKeys` 已随 CLI 门拆到 S5-B；读者容易误以为本轮还有触达门 | 两行紧邻但主语不同（一行讲义务、一行讲限度） | 「限度」行改为「本 spec 无触达门（`touchedSemanticKeys` 改造归 S5-B）；重判触达只靠 `replace` 命令带 `--rejudge B3` + V-8 事后核」。验收：spec 全文不再出现「本 spec 提供触达门」这类可误读表述 | P2 |
| 7 | `tools/docgen/components/patternRegistry.mjs`（`toolsForSeat` 返回值） | 返回同一数组引用；任一处就地 `push` / `sort` 会污染全仓同档所有席（producer 两席共享） | 「只读消费」是口头约定；测试里 `structuredClone` 掩盖了风险 | 二选一：① `toolsForSeat` 返回 `[...arr]`；② 用 `Object.freeze` 冻结各档数组（零拷贝，越权修改直接抛）。推荐 ②。验收：`S5-TC-D09` + `S5-TC-D03` 绿 | P2 |
| 8 | `tools/docgen/components/validateAgentData.mjs:40-50`（断言 4） | tools 含重复元素能通过双向集合包含；卡面会渲染出 `Read, Read`，`gate` 也绿（盘上==渲染） | 双向 `every/includes` 看起来「已经很严」（恰等），没想到它是多重集判等 | 加一行：`if (new Set(a.tools).size !== a.tools.length) fail('ToolsViolation', { name: a.name, reason: 'tools 含重复项' })`。验收：`S5-TC-D06` 由 `assert.equal(threw, false)` 改为 `assert.throws(..., ToolsViolation)` | P2 |
| 9 | `tools/docgen/test/support/dev-workflow-checks.mjs:187-201` | `noComment` / `noString` 只在 `counterProbes` 内部，未导出；E03/E04 需要同一剥离口径，否则长出第二套 | 「反正只有一个文件用到」——两个新用例一出现就必须共用 | 导出 `stripComments` / `stripCommentsAndStrings`（`noString` 就地改名复用，`counterProbes` 改用它），新增导出 `isTierCountLine`。**注意**：`isTierCountLine` 必须用**剥注释、保留字符串**的文本（否则 `tools/docgen/test/validate.test.mjs:29` 这类标题必逃检）。验收：`S5-TC-E03` 四条样例 + `E04` 全仓扫描绿 | P1 |
| 10 | spec §4 门②（`rejudge-<席>-B3.md` 落点） | **已采纳**：spec v4 已写死 `.session/reviews/<本次>/rejudge-<席>-B3.md` | — | 测试按该路径定位；归档后随账本迁 `docs/superpowers/reviews/<本次>/` | 已收口 |
| 11 | spec §8 V-10 / §2 拆出项 | **已采纳**：spec v4 V-10 已改为**三条**接班条目（research → S5-R / 精算师取数权 → S2 / S5-B），E09 已断言三条 | — | 已收口 | 已收口 |

## 9 自检

**A. `spec-testcase-gate` 五条判据逐条打勾**

| # | 判据 | 结论 | 证据 |
|---|---|---|---|
| 1 | 文件存在（同目录、命名 = spec 文件名 + `-testcase.md`） | 过 | `docs/superpowers/specs/2026-10-25-s5-tool-tiers-design-testcase.md` |
| 2 | 编写者独立（`senior-sdet` 全新上下文，≠ spec 作者、≠ 施工者）+ 文件头「编写者 / 独立性声明」 | 过 | 文件头第 2-4 行（归属 spec v4 / 编写者 + 独立性声明 / 版本 v4 + 收范围说明） |
| 3 | 用例五要素齐（覆盖 / 前置 / 步骤 / 预期 / 判据）；负例 + 边界 ≥ 正例；覆盖总表每行指回 spec 编号 | 过 | §2 每条含五要素 + 来源 + 红绿证据 + 对应测试 + 不覆盖；计数见 B；§1 每行「覆盖的 spec 条目」列均填 V/F/§/P/D/T 编号 |
| 4 | spec 外链在位，且 spec 不内联用例 | 过 | spec v4 `:5` 与 `:258` 各有「测试用例文件：…」；spec §9 只写「测什么 / 为什么」 |
| 5 | 与 spec 一起送审（开卷清单两件并列） | 待送审时执行 | 本条由议会开评时核，不在本文件内自证 |

**B. 计数（可复算：按 `### S5-TC-` 标题数 + §1「类型」列统计）**

| 项 | 数量 | 明细 |
|---|---|---|
| 用例总数 | **51** | A 组 10 + B 组 14 + C 组 8 + D 组 10 + E 组 9 |
| 正例（N1） | **22** | A01-A05（5）、B01-B07（7）、C01/C02/C04/C07（4）、E01/E02/E03/E05/E08/E09（6） |
| 负例（N2） | **16** | A06（1）、B08-B11（4）、C03/C08（2）、D01-D04/D07/D08/D10（7）、E04/E06（2） |
| 边界（N3） | **13** | A07-A10（4）、B12-B14（3）、C05/C06（2）、D05/D06/D09（3）、E07（1） |
| 负例 + 边界 | **29** | 29 ≥ 22（N1）→ **硬门通过** |

**C. 覆盖总表逐行可回溯**：§1 共 51 行，每行「覆盖的 spec 条目」列均落在 spec 的 §2（P-x）/ §3.x / §4（T-x、D5/D6、B3 落账表）/ §5 / §6 / §7（F-x）/ §8（V-x）/ §11.3（D-x）之一，**零行**只写章节名而不带编号。

**D. 未覆盖项与理由**：**V-1～V-10 全部有机器用例**（无手动项）。**F1～F14 全部有对位**：F13 的「模板改造」半属 S5-B，本 spec 只约束写权（B02 / B03 / B13）。**P-1～P-8 全部有对位**。范围外项（市场 / 产品经理 / `speaker` 卡、`research` 档与卡面、检测脚本 / CLI B3 门 / 账本模板、`reviewer-actuary` 命令权、`check-prd-graph.mjs`、PRD 全文件改动、运行时使用情况）已在 §6「不测」逐条给出理由与去向。

**E. 五要素抽查（首尾各一条）**：`S5-TC-A01`（首）与 `S5-TC-E09`（末）均含覆盖 / 前置 / 步骤 / 预期 / 判据 + 来源 + 红绿证据 + 对应测试 / 不覆盖，共 9 个字段。

**F. 本文件的已知边界**：本文件不写实现代码；「对应测试」中的新文件 `tools/docgen/test/tool-tiers.test.mjs` 由 plan 的 Task 落地（spec P-6 已定名），落地前该列一律写「待 plan Task N」——这是模板允许的唯一占位形态，不含 TBD / TODO。G-8 已由 spec v4 收口并删除；G-12 已收口；**6 条开着的缺口**（G-2 / G-4 / G-6 / G-9 / G-10 沿袭 + G-11 新登记）均在 §7 登记并给出兜底位置或建议条目。
