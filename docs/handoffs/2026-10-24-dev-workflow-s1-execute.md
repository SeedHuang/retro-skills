# Session 交接：retro-skills → S1 主干骨架施工（2026-10-24）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-24 12:30（本机时区） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `07f2212`（docs: plan 轮次口径拆分）；工作树：**36 项未提交**（见「现状 · 工作树异常」） |
| 验证基线 | 无 typecheck / build（纯文档 + 脚本仓库）。`npm run check`：**629 用例 / 629 通过 / 0 失败**、`0 findings`、`④ markdown 检查通过（258 个文件 / 1019 张表）`、`check 全部通过`（12:30 实跑）；`npm run doc:name`：`命名检查通过（docs）`（12:25 实跑）；轮次账 `review-ledger-gate.mjs`：**5 行全过**（12:29 实跑） |
| 继任自 | `docs/handoffs/2026-10-24-mainline-prd-s1.md`（内容未被本份取代，按规矩保留不改） |
| 状态 | 可直开工（S1 施工），有 **2 个开放问题**（见「开放问题」） |

## 项目定位

`d:\Seed\retro-skills` —— 面向 AI 编码的规范仓库（`rules/` 条文 + `skills/` 流程 + `agents/` 角色卡 + `skills/parliament/` 议会评审 + `tools/docgen/` 角色卡生成器）；本 session 在其上补完「开发工作流主干」PRD、产出 S1 spec/testcase/plan，并走完 5 轮议会评审（已放行）。

## 现状

- 已完成（本 session，按提交序）：
  - **行号守卫修复**：`skills/managing-lessons-store/scripts/lessons.test.mjs` —— 抽出 `scanLineRefs()`、按 `-transcript.md` 豁免记录型文件（口径对齐 `scripts/doc-rename.mjs` 的 `DEFAULT_SKIP_FILE`）、并把「带路径前缀的引用」按路径解析（修掉同名文件误判）。新增 3 条用例，`npm run check` 由 626/625/1 → 629/629/0（commit `a9257ea`）。
  - **PRD 补完**：`docs/prd/20261024073606-dev-workflow-mainline/index.md` —— §11 的 23 条 D 全部有结论（5 条用户已裁 + 18 条 `[已决·代裁]`），新增 `[已决·代裁]` 标记、§9.1 平台能力实查（`RunCommand` 无法按条白名单 → 整档授予 + 检测门）、§8.3 存量 docgen PRD 借鉴清单、§0.2 记用户「路径 A」裁定、§4 段表 4 格措辞纠错（commit `0744650`）。
  - **S1 spec v7**：`docs/superpowers/specs/2026-10-24-dev-workflow-skeleton-design.md` —— 三件载体（`skills/dev-workflow/`、`rules/dev-workflow-mainline.md`、`agents/evidence-reader.md`）+ C1–C11 生成器改动 + 12 处计数派生化 + F1–F22 失败面 + V-1–V-14 验收 + P-6 登记面 + P-7 `aas sync` + §11 施工顺序（含「新席不走 `replace` 迁移段」）。
  - **S1 testcase**：`docs/superpowers/specs/2026-10-24-dev-workflow-skeleton-design-testcase.md` —— **79 条**（正 34 / 负 35 / 边界 10，负+边 45 ≥ 正 34），由 `senior-sdet` 在全新上下文独立编写、两轮随 spec 修订。
  - **plan v3 + testlanding**：`docs/superpowers/plans/2026-10-24-dev-workflow-skeleton.md`（T0–T10 + T6.5，每条带验收命令）、`…-testlanding.md`（79 → 断言映射 + 负例三桶 + E06/E12/E27 构造方案）。
  - **议会 5 轮**：6 席全量（30 卡 / 21 族）→ 复评（3 P1）→ 3 项复查 → 定向复核（2 席 / 11 卡）→ 极小复查 **放行**；账本见「过程记录」。
- 验证证据：见元信息表『验证基线』（单源，勿在此重复填写）。
- 提交状态：本 session 4 个 commit 已入库（HEAD `07f2212`）；**其余 36 项未提交，由用户自行 commit**。
- 工作树异常（`git status --porcelain`，12:30 实查，共 36 项）：
  - **M（23 项）**：`docs/after/20261019131757-dc-translator-design.md`；`docs/handoffs/` 7 份；`docs/prd/docgen-index.md`；`docs/superpowers/plans/` 2 份；`docs/superpowers/specs/` 9 份；`package.json`；`rules/docs-convention.md`；`rules/how-i-must-reason.md`。**除后三项外，全部由上上 session 的 `doc-migrate --apply` 路径字符串重写产生**（只改路径，未改结论）。
  - **D（2 项）**：`docs/prd/docgen-agent-generation.md`、`docs/prd/docgen-rule-whole-file.md`（改名后的旧路径）。
  - **??（11 项）**：`docs/handoffs/2026-10-24-{dev-workflow-mainline,mainline-fact-baseline,mainline-prd-s1}.md`（前两份历史交接词 + 本 session 继任源）；`docs/prd/20261018214426-docgen-rule-whole-file.md`、`docs/prd/20261019093443-docgen-agent-generation.md`（改名后的新名）；6 个 `scripts/doc-{name,rename,migrate-stamps}{,.test}.mjs`。
  - **影响**：这批未提交项**不影响** `npm run check`（现仓按磁盘判，12:30 已实测全绿）；但 T0 的「越界判据」必须按 plan §3 T0 的**差集**写法，即开基已有的这 36 项不参与判定。

## 过程记录

- 议会账本目录 `.session/reviews/2026-10-24-110018-dev-workflow-skeleton-spec/`（先读 `progress.md` 尾部「第 5 轮」「最终结论」）：`submission.md`（v5 基线 SHA + 必带件 + 机器证据）/ `progress.md`（5 轮轮次账）/ `problems.md`（§一–§八 + §第 4 轮 8 族）/ `cards.md`（第 1 轮 30 卡 + 第 4 轮 11 卡 + 51 候选）/ `round-check.md`（第 1/2/4 轮）/ `delivery-audit.md`（第 2/3/4/5 轮，末行「放行」）。注：`.session/` 在 `.gitignore` 内，**不进 git**，换机器即失。
- 历史交接词链：`docs/handoffs/2026-10-24-dev-workflow-mainline.md` → `docs/handoffs/2026-10-24-mainline-fact-baseline.md` → `docs/handoffs/2026-10-24-mainline-prd-s1.md` → 本份。

## 本次任务

按 plan 施工 S1 主干骨架（新建 3 件载体 + 改 11 处生成器/登记面 + 落 79 条断言）；流程：**T0 开基存档 → T1–T10 逐步施工（每步一条验收命令）→ T6.5 写 5 个测试文件 → 收尾 V-1～V-14 逐条 + 注入一字节必红**；起点：**T0**。

## 范围依据

- 要读（按此序）：
  1. `docs/superpowers/plans/2026-10-24-dev-workflow-skeleton.md` §3 任务表（T0–T10 + T6.5）、§5 风险（**T2–T4 预期红**）、§6 提交白名单、§7 互测记录（10 条已吸收的坑）。
  2. `docs/superpowers/plans/2026-10-24-dev-workflow-skeleton-testlanding.md` §1 映射表、§2 负例三桶（E06/E12/E27 的构造与复位）。
  3. `docs/superpowers/specs/2026-10-24-dev-workflow-skeleton-design.md` §7.1（C1–C11，尤其 **C5 三键白名单**、**C7 新席通路 + evidence fixture**、**C9 state ⊇ 断言**、**C10/C11 两个槽位**）、§7.5（12 处计数）、§7.6、§9（V-1–V-14）、§11（施工顺序 + 与 S3 交接）。
  4. `docs/superpowers/specs/2026-10-24-dev-workflow-skeleton-design-testcase.md`（只在 T6.5 用；不必通读，按 testlanding 映射表取用）。
- 勿重做：spec / testcase / plan / testlanding 本身（已放行，改它要走回流）；PRD §0–§13（已定稿待用户扫代裁）；`skills/managing-lessons-store/scripts/lessons.test.mjs`（守卫修复已完成，629/629 是它的证据）；`scripts/doc-*.mjs` 六件（上一批改名工具，已存在）。

## 开放问题

1. **PRD 的 18 条 `[已决·代裁]` 是否先扫**；推断：**不阻塞 S1 施工**——议会对 spec+testcase 已放行，施工只依赖 spec 的 C/V 编号；依据：`delivery-audit.md` 末行「放行」+ `submission.md` §11「上游状态」已把「PRD 未过 §0」写进送审前置。请用户：确认（可开工）/ 纠正（先扫代裁）。
2. **工作树 36 项未提交怎么处理**；推断：**施工前由用户自行 commit 或明确忽略**——它们是上上 session 的改名批（21 M + 2 D + 6 `??`）+ 3 份历史 handoff，与本任务无关；依据：本份「现状 · 工作树异常」逐项清单。请用户：确认（我按差集判越界开工，不碰这 36 项）/ 纠正（先提交它们）。

## 既定约束（不要重新讨论、不要重新选型）

- 新席**不走** `replace` 迁移段（迁移段要 `renderSha256`/`goldenAssertion`/`compareResult` 三件，而 `golden-assert.mjs` L31 不传 domain、且要求卡已在 commit 上）；通路 = `draft` → 校验即落盘 → `setAgentState` —— spec §7.1 C7 + §11 ③。
- 施工顺序固定：C2 → **C6a** → C1/C3/C4/C5/C10/C11 → `draft`+落盘 → C7 → C8 → **C6b** → C9 → 12 处计数 → `aas sync` → 写测试 → 收尾；错序必红 —— spec §11。
- `gate` 只在 **T1 绿（36/36）** 与 **T5 起绿（37/37）**；T2–T4 预期红（先 `DanglingBaselineEntry` 后 `BaselineDrift`）—— plan §5。
- 计数断言一律派生化，禁止只改字面量；`data.test.mjs:50` 的注释数字要删 —— spec §7.5。
- `evidence-reader` 的 `tools` 恰等于 `patternRegistry.tools.readOnly`；`validateAgentData` 的 `BASE_KEYS` 加 `domain`/`boundary`/`explorePolicy` 三键 —— spec §7.1 C5。
- 模板槽位化（`{{BOUNDARY}}` / `{{EXPLORE}}`）**默认值不变**，14 席渲染必须逐字节不变，由 `gate` 兜 —— spec §7.6。
- 新规则 / 新技能落地后必须 `aas sync` + `aas` 体检「需建链接 0」 —— `rules/rules-single-source.md` L8。
- 不新增 scripts / assets 到 `skills/dev-workflow/`；SKILL.md 不内联骨架 —— spec §4。
- 只提交白名单内的路径；`.session/` 不进 git —— plan §6。
- 禁止未经用户明确要求执行 git 写操作（本 session 已获授权提交过 4 次，下个 session 若无明示需再确认）—— 用户全局规则。

## 遗留裁决与留观项

- 议会候选 **48 条**未并入族（`cards.md` §候选）；最高优先 3 条：C-06（79 条负例须在 plan 落成断言 → 已在 T6.5 承接）、C-45（S1 与 S3 改同一批生成器文件 → 已写进 spec §11「与 S3 的交接」）、C-50（`skilldependencies/validate.test.mjs` 绝对路径 import 外部仓 → S1 不修，T7 前先确认 `D:/Seed/agent-assets-sync` 在位）。来源：`delivery-audit.md` 候选节；收敛时机：T6.5 / S3 spec / T7。
- `aas sync` 改运行时目录属**不可逆外溢**：T8 前先存档 `git status`，sync 只增链接 —— spec §2 P-7 + plan §5。
- 施工后 `baseline 37/37` 与「注入一字节必红」均未实测（现仓只有 35/35）—— 来源：`progress.md`「未验证项」；收敛时机：T5 / T9。
- S3 的「13 张卡重生成」口径在 S1 后已是 **15 席**（含 `evidence-reader`），S3 spec 必须改这一处 —— spec §11「与 S3 的交接」。

## 开工前先做

1. `git status --porcelain` 与 `node tools/docgen/cli.mjs gate`（应 `baseline 35/35`）；把开基状态存到 `.session/reviews/2026-10-24-110018-dev-workflow-skeleton-spec/baseline-status.txt`（T0 的差集判据靠它）。
2. 读 `docs/superpowers/plans/2026-10-24-dev-workflow-skeleton.md` §3 + §5 + §6（任务表 / 预期红 / 提交白名单）。
3. 读 `docs/superpowers/specs/2026-10-24-dev-workflow-skeleton-design.md` §7.1 的 C5/C7/C9/C10/C11 五行 + §11 施工顺序行。
4. 读 `docs/superpowers/plans/2026-10-24-dev-workflow-skeleton-testlanding.md` §1 + §2（79 → 断言映射与 E06/E12/E27 构造）。
5. 确认 `D:/Seed/agent-assets-sync` 在位（T7 会跑 `skilldependencies/validate.test.mjs`，它绝对路径 import 该仓）。

## 开场话术

读 `docs/handoffs/2026-10-24-dev-workflow-s1-execute.md`，按交接词继续：按 plan 施工 S1 主干骨架（T0→T10 + T6.5）。注意：先做 T0 开基存档（差集判越界），T2–T4 预期 `gate` 红是正常的。
