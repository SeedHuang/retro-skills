# 开发工作流主干 S1：执行计划

> 来源：`docs/superpowers/specs/2026-10-24-dev-workflow-skeleton-design.md`（v6，议会 3 轮「有条件通过」）+ testcase 79 条
> 议会账本：`.session/reviews/2026-10-24-110018-dev-workflow-skeleton-spec/`
> 状态：**v2（已吸收 sdet 7 条挑刺，逐条处置见 §7）**；配套 sdet 文档 = `2026-10-24-dev-workflow-skeleton-testlanding.md`

## 0 全貌确认

| 维度 | 内容 |
|---|---|
| 本质 | 把 spec 的 11 处生成器改动 + 3 件载体 + 79 条断言落成可跑的文件，**每一步都能用一条命令判真假** |
| 同族 | 施工期最可能复发的三类：`BaselineDrift`（C2 一加规则就触发）、`state` 未知键抛 `StateFileInvalid`、14 席渲染被默认值带偏 |
| 边界 | 不写 S2–S5；不改议会矩阵；不建产品经理 / speaker / research 卡 |
| 验收 | `npm run check` 全绿 + `gate` 出 `baseline 37/37` + V-1～V-14 逐条过 + 注入一字节必红 + 79 条断言全绿 |
| 影响面 | `tools/docgen/**`、`agents/`（+1）、`rules/`（+1）、`skills/dev-workflow/**`（新增）、`skilldependencies/**`、三份 README、`scripts/check-all.mjs`、5 个测试文件 |
| 联动四问 | 治本：每条判据落到命令；副作用：动 `agent.md.tpl` / `criteria.md` 波及 15 席，用 `gate` 兜；跨问题：C1–C11 有强制顺序，错序必红；跨文件：`state.json` 与 `agentData` 两头夹 |

## 1 问题总结（按根因分组）

| 组 | 根因 | 议会证据 | 不治的后果 |
|---|---|---|---|
| G1 多份真相 | 同一信息存两处以上且无机器比对：段表 / 默认句 / 计数 | 4 席独立命中段表两格不一致；§7.5 说 11 实为 12；「14 席快照」实为单 fixture | 每次改一处必漂 |
| G2 判据不可判 | 判据停在「说明里点出 / 语感」：R1 / R4 / R6 | v1 的 R1–R6 判定方式列 | 规则每轮加载却判不出来 |
| G3 登记面缺口 | 新席要同登 7 处，漏一个不报错 | C1/C2/C6/C7/C8/C9 + P-6/P-7 | 仓内全绿、运行时零加载 |
| G4 交付物自相矛盾 | 卡片沿用别角色模板常量；B3/B4 让人无路可走 | AI-1-02 / BE-1-05；`criteria.md` L132–148 | 卡自我描述错误，或逼人注入 `pass` |
| G5 测试落地风险 | 35 条负例「对应测试」仍是占位；外部仓绝对路径；CRLF/全角无 fixture | 候选 C-06 / C-50 / C-26 | 验收清单变成有文档无防线 |

## 2 全局对策

| # | 对策 | 落点 | 怎么判 |
|---|---|---|---|
| S1 | 一处真相 + 机器比对（段表三列比对、默认句单源、计数派生化） | spec §3.1/§7.3/§7.5/C3 | TC-A04、TC-E21、TC-C11、TC-B11 |
| S2 | 判据三件套：载体（`gate-record.md` 六列）+ 判定动作（命令/集合/计数阈值） | spec §5 R1–R7 | TC-A02、TC-A07 |
| S3 | 登记面双向夹（`readState` 判 ⊆，C9 判 ⊇，state 缺失也红） | C7 + C9 | TC-B06/B10/C10/E06 |
| S4 | 形态适配而非硬改（槽位化 + 默认值不变 + criteria 声明 `none` 形态） | C10/C11/§6.2 | TC-B10/B11/D08/D09 |
| S5 | 测试落地清单（79 → 79 个断言，负例必须可重跑） | §4 + testlanding | 收尾 grep 去重计数 ≥ 79 |

## 3 任务分解（按 spec §11 顺序，每步带验收命令）

| Task | 做什么 | 验收命令 | 红则回到 |
|---|---|---|---|
| T0 前置 | 记录开基：`git status --porcelain` 存档；`gate` 取基线（应 `35/35`）；**只允许改动的路径白名单**（见 §6） | 存档文件存在 + gate 输出 35/35 | — |
| T1 | C2 登记规则 + 建 `rules/dev-workflow-mainline.md`（R1–R7 + 例外 + 验证） | `gate` → `baseline 36/36`（**含 C6a：`baseline --write`**） | T0 |
| T2 | C1 数据、C3 枚举与三常量、C4 `evidence` 格式、C5 三键白名单与断言、C10/C11 槽位 | `gate --kind rule` 之类不依赖新卡的检查 + **单测里直接 `renderByName('evidence-reader')` 断言不抛 `MissingSlot`**（此时卡还没落盘，全量 `generate` 必报 `DanglingBaselineEntry`） | T1 |
| T3 | **`draft --kind agent --name evidence-reader` 出草稿**（`generate` 只比对、要求目标已存在）→ 人工对照 → **直接落盘**（新席不走 `replace` 迁移段，见 spec C7）+ 建 `skills/dev-workflow/`（SKILL.md + 7 份 references） | 草稿与 `renderByName` 逐字节一致；落盘后由 T4 的 `check-agents` 做逐字节判定（新席在 `state=replaced` 之前 `gate` 不比对它） | T2 |
| T4 | C7 state 登记（用 `setAgentState`）+ C8 十键 annotations | `node tools/docgen/cli.mjs check-agents` → `已接管 15，未迁移 0`；**再跑 `checkAgentFile('evidence-reader')` 无 findings**（check-agents 不读 annotations，单靠它抓不到 C8） | T3 |
| T5 | C6b `baseline --write`；C9 在 `check-all.mjs` 加 state ⊇ 断言 | `gate` → `baseline 37/37`；人为删一条 state 键 → `npm run check` 红 | T4 |
| T6 | §7.5 的 **12 处**计数派生化（含 `data.test.mjs:50` 注释去数字） | `npm run check` → `# fail 0`；TC-C11 三探针全 0 | T5 |
| T6.5 | **写 5 个测试文件**，把 testcase 79 条落成断言（落点见 testlanding §1） | 五个文件里 `TC-[A-E]` 去重 ≥ 79 且全绿 | T6 |
| T7 | P-6 登记面（manifest + `dev-workflow.json` + 三份 README 去写死数量） | `node --test skilldependencies/validate.test.mjs` exit 0 | T6.5 |
| T8 | P-7 `aas sync` + 体检 | `aas` 体检 → `需建链接 0`；两条 `Test-Path` 为 True | T7 |
| T9 | 反向验证 V-8：副本仓给 `agents/reviewer-qa.md` 末尾加一空格 → `gate` 报 `Mismatch` exit 1 | 复原后 `gate` 绿 | T8 |
| T10 | 收尾：`npm run check` + `doc:name` + V-1～V-14 逐条 | 见各条 | T9 |

## 4 测试落地

- **落点与分组以 sdet 的 `2026-10-24-dev-workflow-skeleton-testlanding.md` §1/§2 为准**（它按可执行性分桶：纯函数单测 / worktree+spawnSync / 只能人工判）。
- **A 组必须拆两个文件**：`dev-workflow-rule.test.mjs`（A07，T1 后即可绿）与 `dev-workflow-files.test.mjs`（A01–A06、A08–A14，T3 后绿）——否则 T1→T3 之间全量门必红。
- **A10（`aas sync`/运行时）不进 `node --test`**：它依赖本机 `~/.trae-cn`，放在 `docs/` 外的一次性脚本或 T8 的人工验收里（testcase A10 自己已标「本机验，不进 CI」）。

## 5 风险与未验证

| 项 | 处理 |
|---|---|
| 中间态必红 | 每步后跑 `gate`；T1 起每步都要求 `gate` 绿（T1 绿在 36/36） |
| 14 席被默认值带偏 | T2 用 `generate` 做渲染比对（不是只跑 validate） |
| 新席 replace 三件证据不可得 | 已定：新席不走上架迁移段，落盘 + `setAgentState`，证据由 `gate` 逐字节代替（spec C7） |
| 外部依赖 `agent-assets-sync` | S1 不修（候选 C-50）；T7 前先确认该仓在位，否则 T7 判红不算缺陷 |
| `aas sync` 改运行时 | 不可逆外溢：T8 前存档 `git status`，sync 只增链接 |
| 施工后 37/37 未实测 | T5 是第一次真验 |

## 6 提交口径（修正版）

- **允许改动的路径白名单**（T0 用它判「有没有越界」）：`tools/docgen/**`、`agents/evidence-reader.md`、`rules/dev-workflow-mainline.md`、`rules/.inspector-annotations.json`、`skills/dev-workflow/**`、`skilldependencies/**`、`scripts/check-all.mjs`、`README.md`、`docs/guide/{skills,rules}/README.md`、`docs/superpowers/{specs,plans}/2026-10-24-dev-workflow-skeleton*`、`docs/prd/dev-workflow-mainline/**`。
- **本 session 额外一件**（不属 spec 交付物，但必须一起提交）：`skills/managing-lessons-store/scripts/lessons.test.mjs` —— 行号守卫的 `-transcript.md` 豁免 + 路径前缀解析修复（`npm run check` 从 626/625/1 → 629/629/0 的那次改动）。**理由写在这里，避免下次被当成「无来源改动」**。
- **不提交**：上一 session 遗留的 21 M / 2 D / 6 `?? scripts/doc-*.mjs`（文档改名批次产物，等用户单独处置）；`.session/`（gitignore）。
- 提交前必跑 `npm run check` + `npm run doc:name`，两条都过才 commit。

## 7 sdet 第 1 轮挑刺的处置（互测记录）

| # | sdet 指出的问题（位置） | 我的判定 | 处置 |
|---|---|---|---|
| 1 | T1 验收必红：C2 一加规则 `renderBaseline()` 就 36 条而磁盘 35 → `BaselineDrift`，且 T1–T10 里没有 C6a | **承认** | T1 验收改 `baseline 36/36`，并把 C6a 明确写进 T1 |
| 2 | T3「草稿→确认→替换」三重阻断：`replace` 迁移段要 `renderSha256` + `goldenAssertion=pass` + `compareResult=null`；`golden-assert.mjs` 用 `parliament(role, when)` 不传 domain → 与 reader 恒不等；且要卡已在 commit 上 | **承认（最关键）** | spec C7 与 §11 施工顺序改写：**新席不走 replace 迁移段**，`generate → 对照 → 落盘 → setAgentState`，证据由 `gate` 逐字节代替 |
| 3 | T2 验收只跑 `validate.test.mjs`，不渲染 → 抓不到 C10/C11 的槽位（`MissingSlot` 只在渲染时抛） | **承认** | T2 验收改 `generate` exit 0 + 三个渲染测试 |
| 4 | A 组落一个文件，但 A01–A06/A11–A14 依赖 T3 产物、A10 依赖本机 `~/.trae-cn` → 文件一落盘就永久红 | **承认** | A 组拆两文件；A10 移出 `node --test` |
| 5 | 79 条断言在施工序里没有落点（T1–T10 无一步写测试） | **承认** | 新增 **T6.5**「写 5 个测试文件」，验收 = 去重计数 ≥ 79 且全绿 |
| 6 | T0「工作树只含本次改动」与 §6「不含 21 M + 2 D + 6 ??」互相否证；且 `lessons.test.mjs` 不在 spec 交付物里却算「本次改动」 | **部分承认** | T0 改成「按白名单判越界」；`lessons.test.mjs` 在 §6 写明来源与理由（它确实是本 session 的守卫修复） |
| 7 | T4 验收 `check-agents` 不读 annotations → C8 写错也绿 | **承认** | T4 验收加 `checkAgentFile('evidence-reader')` 无 findings |

**一致性**：第 1 轮 7 条里 6 条承认、1 条部分承认；无反驳。

### 第 2 轮（sdet 复检，2 条仍阻塞 → 已修）

| # | sdet 指出的问题（位置） | 判定 | 处置 |
|---|---|---|---|
| 8 | T2 验收 `generate` 对**新席**先做存在性检查（`cli.mjs:66-67` / `:300` → `DanglingBaselineEntry`），T2 时卡还没落盘 → exit 2，走不到渲染，抓不到 `MissingSlot` | **承认** | T2 验收改「不依赖新卡的检查 + 单测里 `renderByName('evidence-reader')` 断言不抛」 |
| 9 | `generate` 只比对不写盘；写草稿的是 `draft`（`cli.mjs:305-337`）→ spec §11 ③ 与 plan T3 的「`generate` 出草稿」不可执行 | **承认** | spec §11 ③ 与 T3 全改 `draft --kind agent --name evidence-reader` |
| 10 | T3 的「`gate` 渲染与磁盘一致」对新席是空判（`collectGate` 只比 `replaced` 席，`cli.mjs:103-107`）；真正逐字节判定在 T4 的 `check-agents` | **承认** | T3 验收改为「草稿 == `renderByName`」；逐字节判定归 T4 |

- sdet 自报的「testcase 计数不一致」**为其自身误判**（把 E23 边界算成负例）：逐行实为 **34 / 35 / 10 = 79**，与文件头一致；已在 testlanding §0 订正、§3 回填。testcase 不动。
- **第 2 轮结论：可以开工**（sdet 原文：「改两处即可，不动 spec 结构」→ 两处已改）。
