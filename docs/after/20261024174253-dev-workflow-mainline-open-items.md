# 开发工作流主干：议会 #1 收口遗留（未决）

> 状态：**未决**｜创建：2026-10-24 17:42:53｜来源：议会 #1 三轮评审 + 补充复核（账本 `.session/reviews/2026-10-24-163717-dev-workflow-mainline-prd/`）
> 搬走条件：逐条做完后把结论并入 `docs/prd/20261024073606-dev-workflow-mainline/index.md` 或对应 spec，本条迁出；**本文件不是结论**。

## A 收口前必须处理（阻塞 PRD 定稿）

| # | 事项 | 现状 | 处理动作 | 完成判据 |
|---|---|---|---|---|
| A-1 | PRD 未正式过议会 | 3 轮后仍有 P0/P1 时按新规升级用户；P0 文档层已清零、P1 见下 | 用户终裁：判「有条件通过」并把结论写进 `gate-record.md` ① 行（申报人 = 产品经理代拟，签字人 = 用户） | ① 行六列齐、结论非空；PRD 头部状态改「定稿」 |

> **已收口（2026-10-24）**：A-2 §0 快照按「基线作废、首版按 F 全新增」写明；A-3 侦探快照两栏已进 `progress` 模板；B-2 已加 V-9；B-4 已加侦探 tools 断言。四条不再挂账。

## B 未开工（不阻塞 PRD 定稿）

| # | 事项 | 现状 | 去向 |
|---|---|---|---|
| B-1a | `research` 档（`readOnly + WebSearch + WebFetch`）与市场卡 | 未开工（S5 只做 `producer`，`tools` 未登记 `research`） | S5-R：另立 spec，**触发 = S2 市场卡**；本仓 spec §3.4 已写死其范围 |
| B-1b | 精算师（`reviewer-actuary`）取数权 | 未开工；`command` 档已保留但当期无席挂载 | S2：给精算师挂 `command`（或 `producer`），由 S2 定 |
| B-1c | S5-B：检测脚本（`.session/` 盲区）/ CLI B3 机器门 / 账本模板改造 | 拆出项，未开工 | S5-B：另立 spec（议会 #2 第 2/3 轮的独立深水区） |
| B-2 | F-22 只落一半（节点数检查进 S2，正文解释未进） | 正文解释已加 V-9（2026-10-24） | 已收口；S2 落地时核一次 |
| B-7 | 全部改动未提交 git | 工作区改动 | 用户决定提交方式后执行 |

## 存量待办（线 B / D / F，2026-10-24 并入）

| 线 | 事项 | 现状 | 触发 / 去向 |
|---|---|---|---|
| B | `rule-writer` / `rule-inspector` 的 **41 个问题**（6 严重 / 10 中 / 25 轻） | 未开工；修法 = 按 6 类病根成批修，不逐条修 | 方案 `docs/reports/2026-10-16-1-rule-writer-rule-inspector-深度评审报告/soluation.md` |
| D | ① 议会的审计数数可脚本化；② 「按病根分组的修复编排」是否要独立载体 | 留观，不急 | ① 跑熟 >3 场后；② 修 41 问题时按真实卡点定 |
| F | docgen P2 剩余三件：① `criteria.md` C 组缺「模板形态适配」；② agent 来源行缺「权威来源」；③ `judged[]` 只能转录、不能证明独立重判 | 待用户拍板 | **具名接班（2026-10-29 S5 ⑤ 交付审计改判；原写「S5 收口时同批处理」= 触发已过未处置）**：① → 下次修订 `tools/execution-matrix/criteria.md` 时把 `:12-16` 的「0.2 模板形态适配」覆盖到 C 组 4 项（`:156/:165/:174/:183`），或明说 C 组不适用；② → 下次改 `tools/docgen/policy/definitions/seats.mjs` 时补 `sourceLine`（现 `tools/docgen/components/renderAgent.mjs:33` 只有 `{{SOURCE_LINE}}` 占位、0 席填值）；③ → 另起 spec 定「重判落账通道」（与 `B-1c` CLI B3 机器门同批考虑） |

## C S5 收口接班（2026-10-28 `④` 行 4 条 P2 的去向；2026-10-29 补落点）

> 来源：`skills/dev-workflow/references/gate-record.md:18`（S5 的 `④` 行结论）+ S5 `⑤` 交付审计 `.session/reviews/2026-10-29-0845-s5-delivery/delivery-5-s5.md` §3（该审计判「4 条 P2 均无 git 内落点」）。四条都在 ④ 段被 sdet 记为「知情项」，此处给 git 内唯一落点。

| # | 事项 | 现状 | 触发 / 去向 |
|---|---|---|---|
| C-1 | `E01`–`E03`（三席「<10 行」卡片体量断言）**无 `S5-TC-` 级用例** | 未处置：断言只在 `tools/docgen/test/tool-tiers.test.mjs` 内以间接形式存在，testcase 无对应 ID | 触发 = 下次改 `tools/docgen/test/pilot-data.test.mjs` 的标题串时，同批把「<10 行」断言显式补进 `tool-tiers.test.mjs`（不改已签 testcase，改由常驻测试兜） |
| C-2 | 「`DraftNameConflict` → `draft rm --yes` → 重跑」**闭环无单测** | 未处置：`tools/docgen/test/drafts.test.mjs:12-21` 只钉冲突 exit 1，不含清理后重跑 | 触发 = S5-B（`B-1c` 账本 / CLI 门改造）时同批补 B 组负例：造残留草稿 → 首跑 exit 1 → `draft rm --yes` → 再跑 exit 0 |
| C-3 | ④ P2 ③ B14 命名不可达状态（`BOUNDARY_COMMAND`） | **已闭合（登记）**：S6 `641a7e7` 把 `S5-TC-B14` 构造值改为 `DEFAULT_BOUNDARY` 并同步 `tool-tiers.test.mjs`；spec `:239` 已加「判据已由 S6 接管（F-24）」指针 | 无需动作；`④` 行原句按「运行证据不得重写」保留 |
| C-4 | ④ P2 ④ `FORBIDDEN_PATHS` 与 spec §3.3③ **两份手抄** | **主体已闭合（登记）**：`tool-tiers.test.mjs:15/:40/:43` 改由 `tools/docgen/policy/definitions/paths.mjs` 派生 + 新增 `assert.equal(pathTokens().length, 23)` 计数断言（S6 `641a7e7`）；**残留半份** = spec `:139` 仍为散文手抄清单 | 残留触发 = 下次修订该 spec 时改为「只外指 `paths.mjs`、不重复清单」 |
| C-5 | S5 签字件（spec / testcase）被 S6 改写；S5 plan 指纹过期 | **已登记**：S6 `641a7e7` 改 spec +6 行（3 条指针）、testcase 86 行（B08 / B14 / E05 三条改判 + 清单派生注释），`198c156` 再改路径前缀；`docs/superpowers/plans/2026-10-25-s5-tool-tiers.md:4-5` 仍写签时值 `974B477A…BDACD669` / `C6E8F23B…CE61B242`，现值 `838D899B…` / `493554A1…` | 复签判定 = **不需重开 ②**（判据级改判已由 `②@S6` / `③@S6` 行登记，原签判据未变）；plan 指纹触发 = 下次修订该 plan 时按 R10② 重记 |
