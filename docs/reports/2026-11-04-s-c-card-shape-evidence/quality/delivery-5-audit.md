# ⑤ 段交付审计表（S-C 卡面形状）

> **判者标识**：`reviewer-audit@s-c-delivery5-audit-20261104-01`（角色卡 `agents/reviewer-audit.md` 全文 Read 贴入工作上下文后执笔）
> **独立性声明**：本实例为**全新上下文**，**未参与** S-C 的任何施工（③ 段）、**未参与** `quality-4.md`（④ 段 sdet 结论表）与 `quality-4-audit.md`（④ 段核对表）的撰写或复核。本席只做三件事：读仓内只读件、**自跑**只读 / 不落盘的验证命令、把结论写回本文件。
> **三权位置**：本表是⑤ 段的**核对权**（申报 / 定性 / 核对中的第三格）。**不签验收**——签字人 = 用户；申报人 = 主 agent（`delivery-5-claim.md`）。
> **边界与自查**：本席**未改仓内任何文件**（终态 `git status --porcelain` = 1 行，即申报方自己未提交的 `docs/after/20261104150807-…md`，见 §7-1 与 §7-16）；本席唯一写入 = 本文件 + `%TEMP%` 下的日志（**跑完已删**）。未用 `node -e`（全部改用 `scripts/` / `tools/docgen/cli.mjs` / `node --test` / PowerShell 原生 `Select-String`、`Get-FileHash`、`Get-ChildItem`）。未写 `gate-record.md`（⑤ 行由申报方落盘）。

---

## §0 事前三步（全貌确认）

**术语首现解释**（非专业读者读本表所需的最小词表）：`TAP` = Node 测试运行器输出的纯文本报告格式（`# tests / # pass / # fail` 三行即它的汇总头）；`SHA` = 文件内容的摘要指纹（同内容同值，用来证明签字件没被改过）；`diff` / `numstat` / `stat` = git 的两份快照之间的差异 / 逐文件增删行数 / 带条形图的差异概览（**条形图长度 ≠ 增删行数**）；`exit` 码 = 命令的退出码（0 = 成功，非 0 = 失败）；`幂等`（idempotent）= 再跑一次结果与原样一致、不产生新的改动。

**本质**：⑤ 段要判的不是「测试绿不绿」（那是 ④），而是四件：**交付物逐件对得上验收结论、每个数字能被复算、没做完的有实名落点、做出来的东西运行时真的生效**。判据源 `skills/dev-workflow/references/stage-5-delivery.md:10-13`，本表**照抄原序原词**，不自编编号。

**同族**：④ 段判据（60 条逐条结论 / 负例比例 / 反向验证 / 缺口五列 / 漂移三权）已在 `quality-4.md` 与 `quality-4-audit.md` 收口（复核轮判「过」，残余 `P0 0 / P1 0 / P2 0 / P3 1`，见 `quality-4-audit.md:227-231`）。⑤ 只在其加四层（逐件 × 复算 × 落点 × 运行时就位），**不重复 ④ 的工作**。

**边界**：⑤ 不改任何已签件（spec / testcase / plan / 卡面 / 数据 / 实现 / 门行）；本席越界动作 = 0。

**验收**（本表要产出的四件）：① 逐交付物有结论 + 证据位；② N1–N12 每条自跑复算（不采信申报值）；③ D10 / D11 落点真实性与三列齐；④ 判据 4 的「不适用」判定是否成立。

**影响面**：本表落 `.session/reviews/2026-11-04-1328-s-c-quality/`（不进 git）；申报方据此落 `gate-record.md` 的 `⑤@S-C` 行。

**联动四问**：治本 → 本席不只读申报表，对每条数字自跑（治「只信结论」）；副作用 → 本席若把日志写进 `.session/tmp/` 会撞 ⑤ 段结构判据转红（故一律 `%TEMP%`，那个坑 ④ 段已踩过一次，见 `quality-4.md:287`）；跨问题联动 → 申报表 N1 的绿与 D10 这一新交付物**同源**（D10 的写法把门禁写红了，见 §6 P1-1）；跨文件 → `gate-record.md` 是全仓门行唯一载体，本表结论会被后续所有 `check-gate-record` 复算。

---

## §1 四条出口判据逐条（判据原文照抄 `stage-5-delivery.md:10-13`）

| # | 判据（原序原词，逐字照抄） | 本席判定 | 依据（≥2 条、来自 ≥2 个文件） |
|---|---|---|---|
| ① | 交付审计完成：逐交付物核完成判据，每条有结论与证据位（`path:line` 或命令输出首行）。 | **成立** | ① D1–D11 **11 件逐件一行**，每行 6 列（见 §2），无共用结论行（`stage-5-delivery.md:35`「多个交付物共用一条结论」的反例未踩）；② 每行证据位 = `path:line` 或命令首行原文（§2 第 5/6 列），本席**自跑**；③ 结论分布：成立 **10** / 不成立 **1**（D10，理由见 §2 与 §6 P1-1）——**判据本身被满足**（有结论、有证据位），不成立的是**该交付物**，不是本判据。 |
| ② | 数字签字项齐：每条带数字的结论都有取数命令，且审计逐条复算过（不是只看结论）。 | **成立（但其中一条数不符）** | ① N1–N12 **12 条全部自跑**（§3），无一条抄申报值；② 12 条中 **11 条相符、1 条不符**（N1：申报 `# pass 1536 / # fail 0` / `check 全部通过` / exit 0，实测 `# pass 1535 / # fail 1` / `check 未通过` / exit 1，见 §3 N1 与 §7-11）；③ 判据被满足（每条都有命令、本席都复算过），数不符记在 §6 P1-1。 |
| ③ | 未完成项 / 已知限制有明确落点（写进待办文档或明说不在本期），不含「以后再看」这类无落点项。 | **成立** | ① D10 `docs/after/20261104150807-s-c-shape-known-gaps-open-decisions.md` 35 行 / 12 条（G1–G12），10 条未闭合项**逐行**有「等什么 / 谁满足 / 触发信号」三列非空（本席逐行切单元格现算，§4）；② D11 `docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md:21-23` 有「触发与谁兜」表 + `:4` 写「何时搬走：PRD 下一次修订、或出现『逐项判定』的真实消费者」（**事件型、可核**，不是「看情况」）；③ 「以后再看」类：字面命中 **1 行**（D10 `:8`），经读原文 = **定义句**「（具体条件，不是『以后再看』）」，不是落点项 → 语义合规，机械扫会误报，已记 §6 P3-3。 |
| ④ | 运行时生效性可核：凡「新增规则 / 新增技能」类交付，已执行 `aas sync` 且体检为 0 待建链接（本机验）。 | **成立（判定 = 不适用），依据可核** | ① `git diff --name-status eef963e…d1826c0 -- rules/` → **0 个文件**（零新增规则）；`-- skills/` → **1 个文件且为 `M`**（`skills/dev-workflow/references/gate-record.md`，5 insertions / 2 deletions）→ **零新增技能**；② `agents/*.md` 15 份是**既有席卡的重新生成**（非新增技能，文件名集合与 `$BASE` 同集合：`git diff --name-status` 无 `A`）；③ 附带可核（不因「不适用」免检）：`node tools/docgen/cli.mjs generate --readme`（只比不写）→ 首行/末行 `baseline 38/38`、exit 0，随后 `git status --porcelain` = **1 行**（唯一一条 = 申报方未提交的 D10，生成器**零写入**）→ 生成物与渲染器输出一致（幂等）。详见 §5。 |

### §1.1 A 节 过程闭环（A1–A6）

| # | 项 | 本席结论 | 证据 |
|---|---|---|---|
| A1 | 终态对账（④ 交代给 ⑤ 的事 × ⑤ 是否承接） | **承接 12/12，无丢失** | ④ 复核轮结论原文「⑤ 须承接 G4/G5（守卫失效）与其余 10 条缺口」（`quality-4-audit.md:231`）；D10 实有 G1–G12 **12 行**，G4/G5 以「已闭合 + 闭合依据」承接、G6 记 P2、其余 9 条 P3 → 与 `quality-4.md:226`「P0 0 / P1 0 / P2 1（G6）/ P3 9 / 已闭合 2」**逐条相等**（本席切单元格现算）。**本席另履行了 ④ 交代给 ⑤ 的动作**：G6 的「默认档 2 条空壳」提示已进 §1 判据② 与 §6 记录项 P3-6（下沉到申报方写进 ⑤ 门行）；G11 的「⑤ 抽核 1 份 0 diff 投影件」已做（§4-②）。 |
| A2 | P0 / P1 清零 | **复核轮已清零：P0 0 / P1 0** | 首轮：P0 0、**P1 1（P1-1）**、P2 0、P3 8 → 判不过。**复核轮**：P1-1 已闭合（`npm run check` exit 0 / `# fail 0`，§9-2），P0 仍 0，P2 仍 0，P3 剩 8 条**均不阻断**（§9-5）→ 满足「P0 / P1 清零」。 |
| A3 | 落点抽查 ≥3（文件行号真实存在且内容相符） | **抽 5 条，5/5 真实** | ① `quality-4.md:226` 级别计数行（原文「P0 0 / P1 0 / P2 1（G6）/ P3 9」）✓；② `plans/2026-11-03-s-c-card-shape.md:214` Task 0 首行（含 `$BASE=eef963e…` 与 `# tests 1481`）✓；③ `tools/docgen/test/sc-card-shape.test.mjs:890`（`rightBefore === 13` 精确值，SC-TC-26 的「换载体」落点）✓；④ `skills/dev-workflow/references/gate-record.md:100 / 101 / 102 / 104`（四条 S-C 门行，行号用 `Select-String` 校准）✓；⑤ `docs/agents/evidence-reader.md:7-9`（G11 抽核的 0 diff 投影件「职责缘由」段）✓。 |
| A4 | P2 三态齐（位置 / 问题 / 建议 / 是否阻断） | **齐** | §6 每条四列：位置、问题、建议解法、是否阻断（+ 谁兜）。 |
| A5 | 数字一致（与 ④ 对账） | **3 处差异，均已在 §3 写清以谁为准** | ① `# tests 1541` 与 ④ 同（`quality-4.md:35`）；`# pass / # fail` 由 1536/0 → **1535/1**（差因 = D10，见 §3 N1）；② `④ markdown 402 个文件 / 1724 张表` → 现 **403 / 1727**（差 = D10 1 个文件 + 它自带 3 张表，属预期）；③ `rows 71`（④ 时点）→ 现 **72**（= ④ 门行落盘 +1），与申报 N9 的 72 相符。 |
| A6 | 升级项终裁 | **2 项终裁闭合、1 项转下批、1 条残余沿用** | ① G4 / G5（④ 首轮 P1，**升级**到「守卫失效」）→ 申报方提交 `d1826c0` 真删真跑；本席独立复算 `sc-card-shape.test.mjs` SHA = `6422FBD9CC56415F`（与 ④ 修订轮同值）、60 块、单跑 60/60/0/0 → **闭合成立**（但「已闭合」的**证明**在 ④，本席只核终态一致，不重做注入）；② G6（P2）→ **转 S-D 收口**，D10 与 §5 已留实名落点；③ ④ 残余 P3（`gate-record.md` 行尾混用 LF/CRLF 致工具差 1 行）→ **沿用**，本表所有门行引用一律取 `Select-String` 口径（见 §6 P3-5）。 |

### §1.2 本席清单 7 项对号（`agents/reviewer-audit.md:38-46`）

| # | 条目 | 判定 | reason / evidence |
|---|---|---|---|
| 1 | 卡片合规核对 | **hit** | D1–D11 十件有完成判据（§2 第 3 列），问题项 P1-1 给建议解法（§6）。 |
| 2 | 级别匹配核对 | **hit** | P1-1（结论/计数与事实相反 → P1，口径 `quality-4-audit.md:135`：P0 = 判据失去意义、P1 = 结论错或计数错）；P3 四条均不改变任何结论 → 不升格（§6 逐条写理由）。 |
| 3 | 答辩合规核对 | **na** | reason：本段无「答辩」环节——④ 的答辩已随 ④ 复核轮闭环（`quality-4-audit.md:230`「打回项 4/4 ADDRESSED」），⑤ 段无申报方答辩卡。不适用。 |
| 4 | 计数一致核对 | **hit** | 申报 `11 + 12 = 23` 项，本表逐项落到 §2（11 行）/ §3（12 行）；缺口计数 D10 12 条 = 10 未闭合 + 2 已闭合（§4-①）；四类漂移 58+1+1+0 = 60（§3 N10 复核）。 |
| 5 | 轮际对账核对 | **hit** | A1 表：④ 交代 12 项 × D10 承接 12 项逐条相等；差异 0 项。 |
| 6 | 落点真实核对 | **hit** | A3 抽 5 条，5/5 行号真实且内容相符。 |
| 7 | 证据复算核对 | **hit** | §3 12 条自跑 + §7 逐条命令原文与首行；N1 不符由此抓出（不是采信申报值）。 |

---

## §2 B 节：交付物逐件表（D1–D11）

> 约定：第 6 列 = **本席实跑输出的首行原文**（不含自述）；「申报值」仅在 §3 出现。

| # | 交付物 | 完成判据 | 证据位 | 复算命令（本席自跑） | 复算输出首行 | 结论 |
|---|---|---|---|---|---|---|
| **D1** | spec `docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md` | 270 行；SHA 不变（签字件零改动）；含 §11 延期登记（§11.14 回退面 / §11.15 与已签件关系） | `docs/superpowers/plans/2026-11-03-s-c-card-shape.md:214`；`skills/dev-workflow/references/gate-record.md:100`（② 签时 SHA） | `(Get-Content <spec>).Count`；`Get-FileHash -Algorithm SHA256`；`Select-String '^#+ '`（段名清单） | `270`；`9B470C827C6B2020…`；段名末三行为 `## 11.13 / 11.14 / 11.15` | **成立**（SHA 与 `gate-record.md:100` 登记的 `9B470C82…` 逐位同前 16 位） |
| **D2** | testcase `…-design-testcase.md` | 1072 行 / 60 条；SHA 不变；外链在位 | 同上 `:214`（`tc 60/80`）；`gate-record.md:100` | `node scripts/check-plan.mjs size --spec … --testcase … --rounds 3`；`Get-FileHash`；`Select-String '^\| SC-TC-\d{2} \|'` | `size: spec 270/350 tc 60/80 rounds 3/3 => ok`；`FC7E144AE00D8197…`；覆盖总表 **60 行** | **成立** |
| **D3** | plan `docs/superpowers/plans/2026-11-03-s-c-card-shape.md` | Task 0–6 共 7 任务、45 步全勾、无第三态 | plan `:214-220` | `Select-String '- \[x\]'` / `'- \[ \]'` / `'- \[[x ]\]'` | `x=45` / `unchecked=0` / `any=45` | **成立**（230 行；三态互斥由两计数相等坐实） |
| **D4** | 生成器 / 门禁实现（`card-contract.mjs`（实位 `tools/docgen/card-model/vocab/card-contract.mjs`）、`cardFaceIds.mjs`、`renderCard.mjs`、`check-trigger-kind.mjs`、`check-tristate-header.mjs`、`scripts/check-all.mjs`、`scripts/test-skip-allowlist.mjs`、`tools/observation-check/checks.mjs`） | 两个形状脚本 `bad 0`；`check-all` 已接 ②.7 段 | 脚本输出；`scripts/check-all.mjs:218-220` | `node tools/docgen/check-trigger-kind.mjs`；`node tools/docgen/check-tristate-header.mjs`；`Test-Path` 8 份 | `check-trigger-kind: seats 15 / kinds {dispatch:11,occasion:1,moment:1,need:2} / bad 0 => ok`；`check-tristate-header: seats 15 / ok 15 / bad 0 => ok`；8/8 `exists=True` | **成立** |
| **D5** | 数据层 `tools/docgen/data/seats/*.json` 15 份 + `shared.json` | 15 席：`duty.action` 含「写回」、`role` 去「资深」、`trigger.kind` ∈ 四型、`shared.json` 有 `hostTerm` 键 | plan `:216-217` | `node tools/docgen/cli.mjs gate`；`node tools/docgen/check-shared-refs.mjs`；`ConvertFrom-Json` 逐席取 `role` / `card.duty.action` / `trigger.kind` | `baseline 38/38`；`check-shared-refs: seats 15 / dangling 0 / nested 0 / keySet8 15 / keySet12 15 => ok`；`duty_action_writeback=15/15`；`kinds=dispatch:11, need:2, moment:1, occasion:1`；`role_has_zishen=False`；`shared_keys=dutyConstraintDefault,cardRationaleHead,cardRationaleTail,hostTerm` | **成立**（四型集合与 D4 首行 kinds 逐项同值） |
| **D6** | 卡面生成物 `agents/*.md` 15 + `docs/agents/*.md` 16 | 15/15 `disk == render`；16 份由 `generate --readme --apply` 产出 | plan `:220` | `node tools/docgen/cli.mjs gate`；`node tools/docgen/cli.mjs generate --readme`（只比不写）；份数 `Get-ChildItem` | `baseline 38/38`（exit 0）；`baseline 38/38`（exit 0，随后 `git status` 无生成器写入）；`agents_md=15` / `docs_agents_md=16` | **成立** |
| **D7** | fixtures `tools/docgen/fixtures/*.evidence.json` 15 份 | 判别记录随本批追加（`rejudged` = A1/A2） | plan `:220` | `git diff --stat $BASE..HEAD -- tools/docgen/fixtures`；`git diff --numstat` | `15 files changed, 480 insertions(+), 30 deletions(-)`；逐份 `32 / 2` | **成立**（15 份全部改动；申报表「+34」是 diffstat 条长非增删数 → §6 P3-1） |
| **D8** | 回归 `tools/docgen/test/sc-card-shape.test.mjs` | 60 个 `SC-TC-` 块；单跑 60/60/0/0 | `quality-4.md:329`；落点 `tools/docgen/test/sc-card-shape.test.mjs:931`（`blockCount`） | `node --test --test-reporter=tap <file>`；带锚点计数；无锚点对照；`Get-FileHash` | `# tests 60 / # pass 60 / # fail 0 / # skipped 0`（`not ok` = 0，exit 0）；`anchored=60` / `unanchored=61`；`lines=1079`；SHA `6422FBD9CC56415F` | **成立**（多出的 1 是 `tools/docgen/test/sc-card-shape.test.mjs:3` 注释自命中，G3 原样） |
| **D9** | 门行 4 行（②@S-C / ②→③@S-C / ③@S-C / ④@S-C） | 6 列齐、R2 无交集 | `skills/dev-workflow/references/gate-record.md:100 / 101 / 102 / 104` | `node scripts/check-gate-record.mjs`；切单元格取申报人/签字人 | `rows 72 bad 0` + `gate-record ok（R1/R2/R6 全过；splitting 0）`；四行申报∩签字 = ∅（逐行见 §6-R2） | **成立** |
| **D10** | 已知限制落点 `docs/after/20261104150807-s-c-shape-known-gaps-open-decisions.md` | 12 条（G6 P2 + 9 P3 + G4/G5 已闭合）+ 每条「等什么 / 谁满足 / 触发信号」 | 该文件本身（35 行） | `Get-Item`；`Select-String '^\| G\d+ \|'` 切单元格；`npm run check`（**该文件是交付物，必须不破坏门禁**） | `Length=6021` / `35 行`（存在，未跟踪）；`G行=12`，10 条未闭合三列全非空 + 2 条已闭合给「闭合依据」；首轮 `npm run check` → `# fail 1` / 末行 `check 未通过` / **exit 1**；**复核轮 `npm run check` → `# tests 1541 / # pass 1536 / # fail 0 / # skipped 5` / 末行 `check 全部通过` / exit 0**；复核轮裸 `test.mjs` 计数 = **0** | **~~不成立（P1-1）~~ → 复核轮闭合**：首轮不成立（文件与 12 条落点在位、判据字面成立，但**该交付物使全仓门禁转红**：`# fail 1`，根因 = 3–4 处**裸 `tools/docgen/test/sc-card-shape.test.mjs:<N>`** 引用无法定位目标文件，撞 `skills/managing-lessons-store/scripts/lessons.test.mjs:1870`，`missing` 必须为 0）。**复核轮实测**：裸 `test.mjs` 引用 = **0**（全份 `.mjs` 命中 9 处，全部带完整相对路径 `tools/docgen/test/sc-card-shape.test.mjs` / `scripts/scope-sweep.mjs`）；`npm run check` → `# fail 0` / 末行 `check 全部通过` / **exit 0**（§9-2）；守卫测试单文件 `# tests 132 / # pass 132 / # fail 0` / exit 0（§9-3）→ **闭合** |
| **D11** | 延期项落点 `docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md` | Task 0 建立、含「触发 / 谁兜」 | plan `:214` | `Test-Path`；`Get-Item`；`Select-String '触发\|谁兜\|下一次'` | `exists=True`；`Length=2735` / `32 行`；`:21 ## 3 触发与谁兜`、`:23 \| 事项 \| 触发 \| 谁兜 \|`、`:4 何时搬走：PRD 下一次修订、或出现「逐项判定」的真实消费者…` | **成立**（「何时搬走」是事件型可核，非「看情况」） |

---

## §3 数字项复算表（N1–N12）

> 第 4 列 = 本席实跑首行原文；第 5 列 = 与申报相符与否，不符处写清「差在哪 + 以谁为准」。

| # | 数字（申报值） | 命令（本席自跑） | 本席复算输出首行 | 与申报是否相符 |
|---|---|---|---|---|
| **N1** | `# tests 1541 / # pass 1536 / # fail 0 / # skipped 5`，末行 `check 全部通过`，exit 0 | `npm run check`（日志写 `%TEMP%`，跑完即删）——**首轮 1 次 + 复核轮 1 次** | 首轮：`# tests 1541 / # pass 1535 / # fail 1 / # skipped 5`、末行 `check 未通过`、exit 1。**复核轮：`# tests 1541 / # pass 1536 / # fail 0 / # skipped 5`、`not ok` = 0、末行 `check 全部通过`、exit 0** | **首轮不符 → 复核轮复核：exit 0 + 四个计数行与申报一致**。首轮差因 = 本批 D10 的裸 `test.mjs` 引用把 `lessons.test.mjs` 行号守卫判红（`not ok 308 - 守卫：文档里的「<名>.mjs 第 N 行」引用，行号必须仍有效`）；D10 改全路径后该守卫转绿（§9-2 / §9-3），四项计数与申报**逐字相符** |
| **N2** | `baseline 38/38` | `node tools/docgen/cli.mjs gate` | `baseline 38/38`，末行同值，exit 0 | **相符** |
| **N3** | 60 条 = 正 21 / 负 17 / 边界 22（负+边 39 ≥ 正 21） | `Select-String '^\| SC-TC-\d{2} \|'` 后按第 3/4/5/6/7 列分组（本席自数，不照抄） | 类型 `正例=21 / 负例=17 / 边界=22`（和 = 60）；层级 `单元=30 / 集成=25 / e2e=5`；判据类型 `机器=60`；优先级 `P0=52 / P1=8` | **相符**（5 个维度全同；负+边 39 ≥ 21 ✅；优先级 P1 名单亦同） |
| **N4** | 60 个 `SC-TC-` 块（无锚点为 61，G3） | `Select-String "^\s*test\('SC-TC-"`（带锚点）/ `"test\('SC-TC-"`（对照）/ `Get-Content` 行数 | `anchored=60` / `unanchored=61` / `lines=1079` | **相符**（60 与 61 两值均复现，多出的 1 = `tools/docgen/test/sc-card-shape.test.mjs:3` 注释自命中） |
| **N5** | 15 席 / 16 份投影 | `Get-ChildItem agents\*.md` / `docs\agents\*.md` / `data\seats\*.json` | `agents_md=15` / `docs_agents_md=16` / `seats_json=15` | **相符** |
| **N6** | `size: spec 270/350 tc 60/80 rounds 3/3 => ok` | `node scripts/check-plan.mjs size --spec … --testcase … --rounds 3` | `size: spec 270/350 tc 60/80 rounds 3/3 => ok`，exit 0 | **相符** |
| **N7** | `map: missing 0 dangling 0（cases 60 / mapped 60） => ok` | `node scripts/check-plan.mjs map --plan …` | `map: missing 0 dangling 0（cases 60 / mapped 60） => ok`，exit 0 | **相符** |
| **N8** | `deps: cycle 0 dangling 0（nodes 7 / edges 10） => ok` | `node scripts/check-plan.mjs deps --plan …` | `deps: cycle 0 dangling 0（nodes 7 / edges 10） => ok`，exit 0 | **相符** |
| **N9** | `rows 72 bad 0` | `node scripts/check-gate-record.mjs` | `rows 72 bad 0` + 末行 `gate-record ok（R1/R2/R6 全过；splitting 0）`，exit 0 | **相符**（72 = ④ 时点 71 + ④ 门行 1；⑤ 行尚未落盘，落盘后应为 73） |
| **N10** | 漂移 `一致 58 / 换载体 1 / 判据放宽 1 / 功能增删 0 = 60` | 读 `quality-4.md:241-278` + 对照 testcase 判据行与落点断言（**抽 3 条独立复核**）：SC-TC-26 / SC-TC-45 / SC-TC-62 | ① SC-TC-26：判据行为 `rightBefore === 13`，落点 `tools/docgen/test/sc-card-shape.test.mjs:550` 只 `assert.notEqual(before, right)`，精确 `== 13` 在 `tools/docgen/test/sc-card-shape.test.mjs:890` → **换载体成立**；② SC-TC-45：落点 `:681 if (!SHAPE) return` + `:682-695` 断言面与判据行（17 行 / 18 处 / 必不等）**逐项相符**，但默认档空跑且计 pass → **「一致（默认档空跑）」成立**（缺陷归 G6）；③ SC-TC-62：签名件白名单 A 面 **8 项** / M 面 7 项，落点 `:964-990` A 面 **9 项** / M 面实名 **3** → **判据放宽成立**；④ 功能增删 0：testcase 60 个 ID × 落点 60 个 ID **双向集合比较，差集空** | **相符**（3/3 抽样定性一致；`58+1+1+0=60` 算术自洽；ID 集合无增删） |
| **N11** | `sweep ok`（R8） | `node scripts/scope-sweep.mjs --check`（**未 touch `impact-sheet.md`**——本席禁改仓内文件；见 §6 P3-8） | 首行 `counts {"I1":13,…}`、末行 `sweep ok（命中未超基线、清单齐、scope 齐）`，exit 0 | **相符**（R8 稳；申报方要求「先 touch 再跑」，本席以「不 touch 亦绿」更强） |
| **N12** | `check-observable ok` | `node scripts/check-observable.mjs --check` | `check-observable ok`，exit 0 | **相符**（`npm run check` 内同源行：`[observable] 扫描 107 个 .md / 未豁免命中 0 行 / 已豁免 6 行 / stale 0 条`——D10 落在 `docs/after/`，不在本规则扫描面，故 107 未变） |

**汇总**：首轮 N1–N12 = **相符 11 / 不符 1**（N1）；**复核轮 = 相符 12 / 不符 0**（N1 转绿，其余 11 条复核轮未变，见 §9-6）。

---

## §4 落点核对（D10 / D11）

**① D10（`docs/after/20261104150807-s-c-shape-known-gaps-open-decisions.md`，35 行）**

| 项 | 本席核对 |
|---|---|
| 文件在位 | ✅ `Test-Path` = True（未跟踪，`git status --porcelain` 唯一一行 = 该文件，属申报方待提交件） |
| 条数 | ✅ `^\| G\d+ \|` **12 行**：G1 / G2 / G3 / G6 / G7 / G8 / G9 / G10 / G11 / G12（未闭合 10）+ G4 / G5（已闭合 2） |
| 与 ④ 缺口表对账 | ✅ 级别逐条相等：G6 = **P2**；G1/G2/G3/G7/G8/G9/G10/G11/G12 = **P3**（9 条）；G4/G5 = **闭合** —— 与 `quality-4.md:226` 计数行逐项相等 |
| 「等什么 / 谁满足 / 触发信号」三列 | ✅ **10 条未闭合项逐行三列非空**（本席切单元格现算，空单元格 0 个）；G4/G5 在「已闭合」表内给「原级别 / 闭合依据」（无三列，属合理，见 §6 P3-2） |
| 无「以后再看」类无落点表述 | ✅ 语义合规（每条都有「怎么发现它到点了」）；字面命中 1 行 = `:8` 的**定义句**（见 §6 P3-3） |
| **不破坏门禁** | ❌ **不通过**：该文件 4 处裸 `tools/docgen/test/sc-card-shape.test.mjs:` 引用（`:21` G2 行 `tools/docgen/test/sc-card-shape.test.mjs:964-965`、`:22` G3 行 `tools/docgen/test/sc-card-shape.test.mjs:3` 与 `tools/docgen/test/sc-card-shape.test.mjs:931`、`:34` G4 行 `tools/docgen/test/sc-card-shape.test.mjs:934`）使 `lessons.test.mjs:1851-1872` 的行号守卫判红（实测报 3 处 `找不到目标文件`）→ `npm run check` exit 1（§6 P1-1） |

**② D11（`docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md`，32 行 / 2735 B）**：✅ 在位；`:21` 有 `## 3 触发与谁兜` 表（`:23` 表头 `| 事项 | 触发 | 谁兜 |`）；`:4` 的「何时搬走」为**事件型可核**（PRD 下一次修订 / 出现真实消费者）→ 判据 ③ 满足。

**③ 额外履行 ④ 交代的抽核（G11）**：0 diff 的投影件 = **2 份**（`git diff --name-only $BASE..HEAD -- docs/agents/` = 14 份有改动 vs 目录内 16 份 → 未改动者 `docs/agents/evidence-reader.md`、`docs/agents/reviewer-reader.md`）。本席抽 `evidence-reader.md`：14 行投影只承载 `角色 / 维度 / 输出类型 / 职责缘由 / 覆盖记录`；其数据 `role = 阅读取证员`（与本批 S-C 关闭的字段 `role 去资深` 无关，本就无「资深」）、`duty.action` 与 `trigger.kind`（`need`）**不在投影面** → **0 diff 确属投影面所致、非漏生成**（G11 的判定成立）；且 `generate --readme`（只比不写）exit 0 且零写入，故投影内容与渲染器输出一致。

---

## §5 运行时就位判定核对（判据 ④）

| 核对项 | 申报方判定 | 本席独立复算 | 结论 |
|---|---|---|---|
| 本批是否「新增规则 / 新增技能」 | 不适用 | `git diff --name-status eef963e…d1826c0 -- rules/` → **空**（0 文件）；`-- skills/` → `M skills/dev-workflow/references/gate-record.md`（1 文件、5 insertions / 2 deletions，**修改**非新增）；`agents/*.md` 15 份与 `$BASE` 同集合（无 `A`） | **「不适用」成立**，且依据可核（不是自称） |
| 是否因此免检 | 不免检 | 附带核：`generate --readme`（不写盘）→ `baseline 38/38` / exit 0；随后 `git status --porcelain` = **1 行**（唯一 = 申报方未提交的 D10；**生成器零写入**） | 幂等成立（除本批新增未跟踪落点件外 0 行，见 §6 P3-4） |
| `aas` 体检 | 未执行（无新增可同步） | 本席命令白名单（`check.local` / `git.read` / `docgen.read`）不含 `aas doctor`，**故不跑**；判据④ 触发条件未命中 → 不阻断 | 不阻断开「不适用」；待用户如需可自行跑（记录项 §6 P3-7） |

---

## §6 缺口与不合项

> 级别口径（沿用 ④ 审计定级、`quality-4-audit.md:135`）：**P0** = 判据失去意义（假绿 / 恒真 / 结论与事实相反致判据失效）；**P1** = 结论错或计数错但判据方向仍对；**P2** = 记账 / 口径缺陷；**P3** = 记录项。

| # | 级别 | 位置 | 问题 | 建议解法 | 触发信号（怎么发现它到点了） | 谁兜 | 是否阻断 |
|---|---|---|---|---|---|---|---|
| **P1-1** | **P1** | `delivery-5-claim.md:43`（N1 行）+ `docs/after/20261104150807-s-c-shape-known-gaps-open-decisions.md:21 / :22 / :34` | 申报 N1 记「`# pass 1536 / # fail 0` + 末行 `check 全部通过` + exit 0」，**实测 `# pass 1535 / # fail 1` + `check 未通过` + exit 1**。根因 = 本批**新交付的 D10** 用了 4 处**裸 `tools/docgen/test/sc-card-shape.test.mjs:<N>`**（无相对路径），`lessons.test.mjs:1851-1872` 的「文档行号引用」守卫要求「定位不到目标文件的引用数 = 0」，解析出 `test.mjs` 该文件不存在 → 判红（实测报 **3 处** `docs\after\20261104150807-…md → test.mjs`）。**不是环境噪声**：工作树唯一未跟踪件就是 D10；本批 `④ markdown 403 个文件 / 1727 张表` vs ④ 段 `402 / 1724` 的差 = D10 及其 3 张表 | 把 D10 `:21` / `:22`（两处）/ `:34` 的 `tools/docgen/test/sc-card-shape.test.mjs:<N>` 一律写成完整相对路径 `tools/docgen/test/sc-card-shape.test.mjs:<N>`（同文件 `:14` 已是这种写法、未被判红，可照抄）；改完跑 `npm run check`（日志写 `%TEMP%`）必须 exit 0 + 末行 `check 全部通过`；随后把申报表 N1 的四个数与末行改成本次终态 | 任何一次 `npm run check`；或 `Select-String -Path docs\after\*-open-decisions.md -Pattern '(?<![\w\\/.-])test\.mjs'` 命中 ≥1 即命中本缺口 | **申报方（主 agent）**。修完由本席（或另一审计实例）复跑 3 条（`npm run check` / N1 数字 / `git status`）即复核 | ~~**阻断**~~ → **复核轮已闭合、不阻断**（`npm run check` exit 0 / `# fail 0` / 末行 `check 全部通过`，§9-2；D10 裸 `test.mjs` 引用 = 0，§9-4；守卫测试单文件 132/132，§9-3） |
| **P3-1** | P3 | `delivery-5-claim.md:33`（D7 行证据列） | 「15 份均 `+34/-?`」中的 **`+34` 是 `git diff --stat` 的条长图形（32 插入 + 2 删除 + 填充）**，不是增删行数；实际 `15 files changed, 480 insertions(+), 30 deletions(-)` → 每份 **+32 / −2** | 证据列改写 `+32/−2`（或直接引末行 `15 files changed, 480 insertions(+), 30 deletions(-)`） | 用 `git diff --numstat` 对照 `--stat` 条长（同一份文件两个数不同即为本缺口） | 申报方（记账） | 不阻断（不改变「15 份均改动」这一结论，且不在 N 清单内） |
| **P3-2** | P3 | `delivery-5-claim.md:36`（D10 行完成判据）vs `docs/after/20261104150807-…md:30-33` | 完成判据写「**12 条 + 每条**『等什么 / 谁满足 / 触发信号』」，但已闭合的 **G4 / G5 两行**是「原级别 / 闭合依据」两列，没有三列。判据源 `stage-5-delivery.md:12` 只要求「**未完成项 / 已知限制**」有落点——已闭合项不属未完成项，故**实质合规、字面不符** | 把完成判据收窄为「10 条未闭合项逐行三列齐 + 2 条已闭合项给闭合依据」（本表 §2-D10 已按此口径核） | 逐行切单元格数三列空值（本席现算：10 行三列全非空、2 行两列） | 申报方（记账） | 不阻断 |
| **P3-3** | P3 | `docs/after/20261104150807-…md:8` | 「以后再看」**字面命中 1 行**，但那是定义句「（具体条件，不是『以后再看』）」——语义合规，机械扫会误报；判据 ③ 要求「不含『以后再看』这类无落点项」，一个按字面跑的命令会对本文件报红 | 把定义句里的这个词换成不带引号的等价说法（如「不是『后续再说』这类含糊托词」），使 `Select-String '以后再看'` = 0 | `Select-String '以后再看'`（本席复算：1 命中） | 申报方（记账 / 文案） | 不阻断 |
| **P3-4** | P3 | `delivery-5-claim.md:65` | 幂等证据写「`git status --porcelain` → **0 行**」，现实测 **1 行**（`?? docs/after/20261104150807-…md` = 交付物自身未提交）。**幂等结论仍成立**（生成器零写入），但措辞应为「除本批新增未跟踪落点件外 0 行」 | 措辞收窄为「生成器零写入：`git status` 仅 1 行且为未跟踪的本批落点件」 | 跑 `generate --readme` 后看 `git status`（本席复算：1 行） | 申报方（记账） | 不阻断 |
| **P3-5** | P3 | `skills/dev-workflow/references/gate-record.md`（承接 ④ 残余） | 该文件行尾混用 LF / CRLF → `Read` / `Grep` 与 `Select-String` **行号差 1**（本席实测：`Select-String` 给 ②@S-C=`:100`、③@S-C=`:102`、④@S-C=`:104`；`Read` 会各小 1）。任何引用门行行号的材料都可能因此指错行 | 本表**一律用 `Select-String` 口径**并在每处注明；下一批动该文件时统一行尾 | 同一行用两种工具取行号，差 1 即命中 | 申报方（下一批动该文件时）；本席已按 `Select-String` 口径规避 | 不阻断 |
| **P3-6** | P3 | ⑤ 门行（待落盘） | ④ 明确交代「⑤ 交付审计**须注明**默认档 `SC-TC-45/46` 为空壳、真判在一次性档」（`quality-4.md:352`）；本表已在 §1-N10 复核中写明，但**⑤ 门行「核了什么」列也必须带这句**，否则 G6 的承接在门账上失位 | 申报方落 `⑤@S-C` 行时，「核了什么」写：「交付审计 `delivery-5-audit.md` §8 结论行；`npm run check` 终态首行；默认档 `SC-TC-45/46` 为空壳（G6 P2，真判在一次性档）」 | 读 ⑤ 门行正文是否含「空壳 / G6」 | 申报方（落门行者） | 不阻断（记账口径） |
| **P3-7** | P3 | 判据 ④ 的 `aas` 面 | 「不适用」成立，但 `aas` 体检本席**未跑**（不在本席命令白名单）；若用户要求「本机验」这一句也要有原文，需由用户或有权限的席跑 `aas doctor` | 用户终签时如需该行原文，自行跑一次 `aas doctor` 并记 0 待建链接（本批无新增，预期不变） | 用户要求「运行时体检那一行原文」（`stage-5-delivery.md:19`）时 | 用户 / 主 agent | 不阻断 |
| **P3-8** | P3 | `.session/reviews/2026-11-04-1328-s-c-quality/`（无 `impact-sheet.md`） | G12（`quality-4.md:223`）要求「落门行那一批若 diff 含 `gate-record.md`，同批 touch `impact-sheet.md`」。④ 门行落盘时该文件**不存在**，但 `scope-sweep --check` 实测 exit 0（`sweep ok`）→ **R8 的 mtime 判据本批未触发**；风险 = 若 ⑤ 落行时 sweep 报 `impact-sheet 早于被扫文件` 且该文件仍不存在，需先建再 touch | ⑤ 落行后**再跑一次** `node scripts/scope-sweep.mjs --check`，必须 exit 0；若报 mtime 红，先建 `impact-sheet.md` 再 touch（由申报方做，本席禁改仓内文件） | `node scripts/scope-sweep.mjs --check` 输出 `FAIL: impact-sheet 早于被扫文件` | 申报方（落 ⑤ 行者） | 不阻断 |

**计数**：首轮 **P0 0 / P1 1 / P2 0 / P3 8**（合计 9 条）；**复核轮 P0 0 / P1 0 / P2 0 / P3 8**（P1-1 闭合，8 条 P3 均不阻断，见 §9-5）。P0 档：**全过、无问题**（无假绿、无恒真、无「结论与事实相反致判据失效」）。

**R2 自查（只核已有四行，⑤ 行由申报方落）**：`gate-record.md` `Select-String` 取出四行申报人 / 签字人——`:100` 申报「主 agent、sdet」∩ 签字「审计」= ∅；`:101` 申报「主 agent」∩ 签字「审计（独立实例，未参与 plan 撰写）」= ∅；`:102` 申报「主 agent（施工）」∩ 签字「审计（独立实例，未参与 S-C 写作 / 议会 / 施工）」= ∅；`:104` 申报「开发（主 agent 执行）」∩ 签字「sdet（…独立于 ③ 施工席与 ④ 核对席）」= ∅。`check-gate-record` 亦 `bad 0`（该脚本按 R2 逐行判交集）→ **R2 四行全过**。
**提示（不代填）**：⑤ 行落盘时**申报人 = 主 agent、签字人 = 用户**（`stage-5-delivery.md:17-18`）；本席不写该行（角色卡禁止：签字原文由申报人转录）。

---

## §7 复跑记录（本席实跑命令 + 首行 + exit）

> 全部在 `d:\Seed\retro-skills` 执行，Shell = PowerShell 5。日志一律 `%TEMP%`，**跑完即删**（§7-15）。`node -e` 使用次数 = **0**。

| # | 命令（原文） | 输出首行 / 关键行 | exit |
|---|---|---|---|
| 1 | `git status --porcelain`；`git rev-parse --short HEAD`；`git log --oneline -2` | `?? docs/after/20261104150807-s-c-shape-known-gaps-open-decisions.md`（1 行）；`d1826c0`；上一笔 `68ff6ab` | 0 |
| 2 | `git diff --stat eef963e96c0a2c309c83789e13da5b195b1d4e0c..HEAD -- rules/ skills/` | ` 1 file changed, 5 insertions(+), 2 deletions(-)`（仅 `gate-record.md`） | 0 |
| 3 | `git diff --name-status eef963e…d1826c0 -- rules/ skills/` | `M skills/dev-workflow/references/gate-record.md`（rules/ 0 文件） | 0 |
| 4 | `(Get-Content <spec>/<tc>/<plan>).Count` + `Get-FileHash -Algorithm SHA256` | `270 / 1072 / 230`；`9B470C827C6B2020 / FC7E144AE00D8197 / 6AD6CB6589D0D7D7` | 0 |
| 5 | `Select-String '- \[x\]' / '- \[ \]' / '- \[[x ]\]'`（plan） | `x=45 / unchecked=0 / any=45` | 0 |
| 6 | `node scripts/check-plan.mjs size --spec … --testcase … --rounds 3` | `size: spec 270/350 tc 60/80 rounds 3/3 => ok` | 0 |
| 7 | `node scripts/check-plan.mjs map --plan …` | `map: missing 0 dangling 0（cases 60 / mapped 60） => ok` | 0 |
| 8 | `node scripts/check-plan.mjs deps --plan …` | `deps: cycle 0 dangling 0（nodes 7 / edges 10） => ok` | 0 |
| 9 | `node tools/docgen/check-trigger-kind.mjs`；`node tools/docgen/check-tristate-header.mjs`；`node tools/docgen/check-shared-refs.mjs` | `check-trigger-kind: seats 15 / kinds {dispatch:11,occasion:1,moment:1,need:2} / bad 0 => ok`；`check-tristate-header: seats 15 / ok 15 / bad 0 => ok`；`check-shared-refs: seats 15 / dangling 0 / nested 0 / keySet8 15 / keySet12 15 => ok` | 0 / 0 / 0 |
| 10 | `node tools/docgen/cli.mjs gate` | `baseline 38/38`（末行同值） | 0 |
| 11 | `node --test --test-reporter=tap tools/docgen/test/sc-card-shape.test.mjs`（日志 `%TEMP%`） | `# tests 60 / # pass 60 / # fail 0 / # skipped 0`；`not ok` = 0 | 0 |
| 12 | `Select-String "^\s*test\('SC-TC-"` / `"test\('SC-TC-"` / `Get-FileHash` | `anchored=60 / unanchored=61 / lines=1079`；SHA `6422FBD9CC56415F` | 0 |
| 13 | `git diff --stat / --numstat … -- tools/docgen/fixtures` | `15 files changed, 480 insertions(+), 30 deletions(-)`；逐份 `32 2` | 0 |
| 14 | **`npm run check`**（日志 `%TEMP%`，跑完即删） | `# tests 1541 / # pass 1535 / # fail 1 / # skipped 5`；`④ markdown 检查通过（403 个文件 / 1727 张表）`；`⑤ .session 结构检查通过（…；tmp/ 为空）`；`⑥ 观察产物门禁：扫描 3 个子目录 / 归档 2 对 / 过程 0 对 / findings 0`；`[observable] 扫描 107 个 .md / 未豁免命中 0 行 / 已豁免 6 行 / stale 0 条`；**末行 `check 未通过`** | **1**（失败 = `not ok 308 守卫：文档里的「<名>.mjs 第 N 行」引用，行号必须仍有效（防行号漂移）`，点名 D10 → `test.mjs` 3 处，见 §6 P1-1） |
| 15 | `node scripts/check-gate-record.mjs`；`node scripts/check-observable.mjs --check`；`node scripts/scope-sweep.mjs --check` | `rows 72 bad 0` + `gate-record ok（R1/R2/R6 全过；splitting 0）`；`check-observable ok`；末行 `sweep ok（命中未超基线、清单齐、scope 齐）` | 0 / 0 / 0 |
| 16 | `node tools/docgen/cli.mjs generate --readme`（**不写盘**）+ `git status --porcelain` | `baseline 38/38`；随后 `git status` **1 行**（唯一 = 未跟踪的 D10） | 0 |
| 17 | `Get-ChildItem agents\*.md / docs\agents\*.md / data\seats\*.json / fixtures\*.evidence.json` | `15 / 16 / 15 / 15` | 0 |
| 18 | `ConvertFrom-Json` 逐席取 `role` / `card.duty.action` / `trigger.kind`；`shared.json` 键 | `duty_action_writeback=15/15`；`kinds=dispatch:11, need:2, moment:1, occasion:1`；`role_has_zishen=False`；`shared_keys=…,hostTerm` | 0 |
| 19 | `Select-String '^\| SC-TC-\d{2} \|'` + 按列分组（testcase） | 60 行；类型 `21/17/22`；层级 `30/25/5`；`机器=60`；`P0=52 / P1=8`（与申报全同） | 0 |
| 20 | `Select-String '^\| G\d+ \|'` + 切单元格（D10）；`Select-String '以后再看'` | `G行=12`（10 未闭合三列全非空、2 已闭合两列）；`以后再看` = 1（定义句 `:8`） | 0 |
| 21 | `git diff --name-only $BASE..HEAD -- docs/agents/` + 目录清单比对 | `changed=14 / all=16` → 0 diff = `docs/agents/evidence-reader.md`、`docs/agents/reviewer-reader.md` | 0 |
| 22 | `Select-String '@S-C'` + `-split '\|'` 取申报人 / 签字人（gate-record） | `:100 / :101 / :102 / :104` 四行；四组申报∩签字 = ∅ | 0 |
| 23 | `Get-Item` + `Select-String '触发\|谁兜\|下一次'`（D11） | `Length=2735` / `32 行`；`:21 ## 3 触发与谁兜`；`:23` 表头含「触发 / 谁兜」 | 0 |
| 24 | 收尾：删 `%TEMP%` 日志（`sc-audit-*.log` / `-exit.txt`）；`Get-ChildItem .session\tmp -File` | `%TEMP%` 下 `sc-audit-*` 计数 = **0**；`.session/tmp` 文件数 = **0** | 0 |

---

## §8 结论

### 判定：**过（复核轮后）**

> **首轮判定历史（保留原样，不改写）**：首轮 = **不过（打回）**，依据两条——① P1-1 未清零（申报 N1 记 `# fail 0` / exit 0，本席首轮实测 `# fail 1` / `check 未通过` / exit 1，§7-14）；② 红由**本批自己的交付物 D10** 造出（3–4 处裸 `tools/docgen/test/sc-card-shape.test.mjs:<N>` 引用撞 `skills/managing-lessons-store/scripts/lessons.test.mjs:1870` 的行号守卫，判定源 `stage-5-delivery.md:12` 的「未完成项有落点」被写红）。首轮打回清单 2 项（补全路径 + 回填 N1 终态数）。

**复核轮闭合情况：申报方 3 项处置 → 3/3 闭合（本席逐项自跑，不采信文字）**

| 处置项 | 申报方说法 | 本席复核实测 | 状态 |
|---|---|---|---|
| 1. D10 的 4 处裸 `tools/docgen/test/sc-card-shape.test.mjs:<N>` 改全路径（另 `:34` 的 `:934`、`:35` 的 `:940-957` 也补） | 已改 | 整份文件正则扫裸引用 = **0**（`(?<![\w\\/.-])test\.mjs` 命中 0）；全份 `.mjs` 命中 9 处，全部 `tools/docgen/test/sc-card-shape.test.mjs` / `scripts/scope-sweep.mjs` 全路径（§9-4）；原先判红的守卫测试单文件 **132/132 pass、fail 0、exit 0**（§9-3） | **闭合** |
| 2. N1 复跑 | `# tests 1541 / # pass 1536 / # fail 0 / # skipped 5`、末行 `check 全部通过`、exit 0 | 本席自跑 `npm run check` → 同上**逐字相符**，`not ok` = 0，**exit 0**（§9-2） | **闭合** |
| 3. ⑤ 门行不先行 | 门行待用户终签后落 | 复核轮 `gate-record.md` 仍 **4 条 S-C 行**（`:100/101/102/104`，`@S-C` 命中 4）；**按流程「门行在用户终签后写」⇒ 不计缺口**；落行时**申报人 = 主 agent、签字人 = 用户**（见下方待终签项 1） | **按流程成立、不计缺口** |

**判定依据（≥2 条、来自 ≥2 个文件）**：
1. **终态门禁已绿**：本席复核轮自跑 `npm run check` → `# tests 1541 / # pass 1536 / # fail 0 / # skipped 5`，末行 `check 全部通过`，exit 0（且内含 `baseline 38/38`、`④ markdown 403/1727`、`⑤ tmp/ 为空`、`⑥ findings 0`、`[observable] 107 / 未豁免 0 / 已豁免 6 / stale 0`），对应 `skills/dev-workflow/references/stage-5-delivery.md:11` 的「数字签字项逐条复算过」。
2. **首轮那条红已由同一断言自身证明转绿**：`skills/managing-lessons-store/scripts/lessons.test.mjs` 单跑 `# tests 132 / # pass 132 / # fail 0`、exit 0，而首轮 `npm run check` 里它正是 `not ok 308`；同时 D10 裸引用计数 0（`docs/after/20261104150807-s-c-shape-known-gaps-open-decisions.md` 全文扫）——即「修的是根因，不是把断言放宽」。
3. **其余交付面未变、仍成立**：D 件 **11/11 相符**（D10 转闭合，其余 D1–D9、D11 复核轮复算未变）、N 项 **12/12 相符**；四条出口判据 **全部成立**（`stage-5-delivery.md:10-13`）；运行时就位「不适用」判定成立（`rules/` diff = 0 文件、`skills/` 仅 1 个 `M`）；落点 12/12 承接（§4 / A1）。

**一句话**：申报方 3 项处置 **3/3 闭合**，本席自跑复核后 P0 0 / P1 0，交付面 11 件 + 12 数字全部对得上 → **判「过」**；剩 8 条 P3 均为记录层、不阻断，可随下一批或用户终签时批量处置。

### 待用户终签的项（用户 = 定性人，本席不签）

1. `gate-record.md` 的 `⑤@S-C` 行由**申报方**在用户终签后落盘（**申报人 = 主 agent、签字人 = 用户**；「核了什么」须带本表 §8 结论行 + `npm run check` 终态首行 `# tests 1541 / # pass 1536 / # fail 0 / # skipped 5` + 「默认档 `SC-TC-45/46` 为空壳（G6 P2，真判在一次性档）」一句，见 P3-6）。本席不代填。
2. `delivery-5-claim.md:43` 的 N1 与复核轮实测**已逐字相符**，用户终签时可直接以本表 §9-2 输出原文为凭。
3. 判据 ④ 的 `aas` 体检原文：本批「不适用」成立（零新增 rule / skill，§5 给 diff 面证据）；若用户要求 `stage-5-delivery.md:19` 的「运行时体检那一行原文」，需用户自行跑 `aas doctor`（P3-7）。
4. §6 的 8 条 P3（P3-1…P3-8）**均不阻断**；其中 P3-1 / P3-2 / P3-3 / P3-4 属申报表与落点文件的记账层，建议一次改完（下次动这两个文件时顺手做，不必单开一轮）。

### 打回清单（复核轮：**已清空**）

| # | 首轮必修 | 状态 |
|---|---|---|
| 1 | D10 裸 `tools/docgen/test/sc-card-shape.test.mjs:<N>` → 全路径 | **已闭合**（核实测见 §9-3 / §9-4） |
| 2 | 申报表 N1 回填终态数 | **已闭合**（`delivery-5-claim.md:43` 与复核轮实测逐字相符，§9-2） |

---

## §9 复核轮

> **轮次性质**：**复核轮**（只验申报方的 3 项处置 + 复跑受影响的断言），**不重走 ④**（60 条用例逐条结论 / 负例比例 / 反向验证 / 缺口五列 / 漂移三权均未重做，其结论仍以 `quality-4.md` / `quality-4-audit.md` 为准）。
> **本席独立性未变**：仍是同一审计实例、仍**未参与**施工与 ④ 结论表；本轮**未改仓内任何文件**（唯一写入 = 本文件 + `%TEMP%` 日志，跑完已删）。

### §9-1 复核轮任务清单（3 项处置 × 自跑验证）

| # | 要验的 | 本席用什么验 | 结论 |
|---|---|---|---|
| 1 | D10 的 4 处裸 `tools/docgen/test/sc-card-shape.test.mjs:<N>` 已改全路径（另 `:34` 的裸 `:934`、`:35` 的裸 `:940-957` 也补） | 整份文件正则扫裸引用 + 逐处打印上下文 | **闭合**（裸引用 0；9 处 `.mjs` 全带完整相对路径，§9-4） |
| 2 | `npm run check` 已回绿 | 本席自跑一次（日志 `%TEMP%`）+ 单跑原判红的守卫测试文件 | **闭合**（exit 0 / `# fail 0` / `check 全部通过`，§9-2；守卫 132/132，§9-3） |
| 3 | ⑤ 门行未落盘 | 数 `gate-record.md` 的 `@S-C` 行 | **按流程成立、不计缺口**（仍 4 行；落行时申报人 = 主 agent、签字人 = 用户，§9-7） |

### §9-2 `npm run check` 复核（本席自跑）

| 项 | 值 |
|---|---|
| 命令 | `npm run check`（日志重定向到 `%TEMP%\sc-audit-check2.log`，**不写 `.session/tmp`**；跑完已删） |
| 四个计数行 | `# tests 1541` / `# pass 1536` / `# fail 0` / `# skipped 5` |
| `not ok` 计数 | **0** |
| 段内关键行 | `baseline 38/38`（gate）；`④ markdown 检查通过（403 个文件 / 1727 张表）`；`⑤ .session 结构检查通过（一级只含封闭清单档位；tmp/ 为空）`；`⑥ 观察产物门禁：扫描 3 个子目录 / 归档 2 对 / 过程 0 对 / findings 0`；`[observable] 扫描 107 个 .md / 未豁免命中 0 行 / 已豁免 6 行 / stale 0 条` |
| 末行 | **`check 全部通过`** |
| **exit 码** | **0** |
| 与申报比 | 四个计数行 + 末行 **逐字相符**；首轮的 `# pass 1535 / # fail 1 / check 未通过 / exit 1` 已不再复现 |

### §9-3 守卫测试单文件复核（首轮 `not ok 308` 的那一条）

| 项 | 值 |
|---|---|
| 文件 | `skills/managing-lessons-store/scripts/lessons.test.mjs`（内含「文档里的『<名>.mjs 第 N 行』引用，行号必须仍有效」守卫，判定点在 `:1870`「`missing` 必须为 0」） |
| 命令 | `node --test --test-reporter=tap skills/managing-lessons-store/scripts/lessons.test.mjs` |
| 输出 | `# tests 132` / `# pass 132` / `# fail 0` / `# skipped 0`；`not ok` = **0** |
| exit | **0** |
| 判读 | 首轮全仓 `not ok 308` 就是它；**现单文件 132/132 全绿** ⇒ 首轮的红是被 D10 的裸引用触发的，D10 改全路径后**同一断言自身转绿**（不是把断言放宽、不是把该文件排除） |

### §9-4 D10 裸引用全份扫描（关键闭合证据）

| 项 | 值 |
|---|---|
| 扫描对象 | `docs/after/20261104150807-s-c-shape-known-gaps-open-decisions.md`（35 行，未跟踪件） |
| 裸 `<名>.test.mjs` 命中（正则 `(?<![\w\\/.-])test\.mjs`） | **0** |
| 全份 `.mjs` 命中 | **9 处，全部带完整相对路径**：8 处 `tools/docgen/test/sc-card-shape.test.mjs`（`:14` G6 段、`:21` G2 段、`:22` G3 段 2 处、`:23` G7 段、`:24` G8 段、`:26` G10 段、`:34` G4 段、`:35` G5 段 —— 逐处打印上下文核对）+ 1 处 `scripts/scope-sweep.mjs`（`:28` G12 段） |
| 判读 | 首轮报「`test.mjs` 找不到目标文件 3 处」→ 现 **0 处**；且这 9 处指向的文件 `tools/docgen/test/sc-card-shape.test.mjs`、`scripts/scope-sweep.mjs` 均实际存在，守卫能定位（不是靠例外放行） |

### §9-5 D10 落点面复核（12 条三列 / 无无落点表述）

| 核对项 | 复核轮实测 |
|---|---|
| 条数 | `^\| G\d+ \|` = **12 行**（G1/G2/G3/G6/G7/G8/G9/G10/G11/G12 未闭合 10 + G4/G5 已闭合 2） |
| 三列非空 | 10 条未闭合项：逐行切单元格，「已知限制 / 等什么 / 谁满足 / 触发信号」**内容列空值 0**；G4/G5 给「原级别 / 闭合依据」两列（合理，见 P3-2） |
| 「以后再看」类 | `以后再看` 字面 **1 命中**，位置 `:8`，原文「每一行必须能回答三件事：**等什么**（具体条件，不是「以后再看」）、**谁来满足**、**怎么发现它到点了**（触发信号）」→ **定义句、非落点项**；`看情况` / `后续再说` / `待定` / `TODO` 命中 **0** → **语义上无「以后再看」类表述**（字面误报记 P3-3，未处置，不阻断） |
| 判读 | 判据 ③（`stage-5-delivery.md:12`）**成立**；P3-2 / P3-3 仍为记录层残余 |

### §9-6 其余交付面复核（确认「修的是根因、没牵连别处」）

| 项 | 复核轮实测 | 结论 |
|---|---|---|
| `git status --porcelain` | **1 行**：`?? docs/after/20261104150807-s-c-shape-known-gaps-open-decisions.md`（仍是申报方未提交的落点件） | 无新增改动混入；本席零写入 |
| `HEAD` | `d1826c0`（与首轮同；复核轮**无新提交**） | 申报方只改了未跟踪的 D10，未改已签件 / 实现 / 门行 |
| `gate-record.md` | `^\|` 74 行 / `@S-C` **4 行**（`:100/101/102/104`，`check-gate-record` 首轮值 `rows 72 bad 0` 不变） | ⑤ 行**未落盘**（按流程），R2 面不变 |
| D1–D9 / D11 交付物 | 首轮证据位与输出首行未变（`npm run check` 复核轮的 `baseline 38/38`、`403/1727`、`[observable] 107/0/6/0` 与首轮同值；`agents 15 / docs/agents 16`；`rows 72`） | **维持「成立」** |
| N2–N12 | 复核轮随 `npm run check` 复跑，值与首轮同（N2 38/38；N9 72；N11/N12 绿） | **维持「相符」** |
| D10 完成判据说辞 P3 | `delivery-5-claim.md:36` 仍写「12 条 + 每条三列」、`:33` 仍写「+34」、`:65` 仍写「0 行」 | **P3-1 / P3-2 / P3-4 未处置**（均不阻断，仍挂账） |

### §9-7 R2 说明（⑤ 门行落盘时）

`gate-record.md` 现仍为 4 条 S-C 行，四行「申报人 ∩ 签字人」= ∅（首轮已逐行核对，`check-gate-record` 判 `bad 0`，未变）。**⑤ 行落盘时**：申报人 = **主 agent**、签字人 = **用户**（`stage-5-delivery.md:17-18`）——两人不相交，R2 成立；本席**不代填**该行（角色卡禁止：签字原文由申报人转录）。

### §9-8 复核轮复跑记录 + 收尾

| # | 命令 | 输出首行 / 关键行 | exit |
|---|---|---|---|
| 1 | `npm run check`（日志 `%TEMP%`） | `# tests 1541 / # pass 1536 / # fail 0 / # skipped 5`；末行 `check 全部通过` | **0** |
| 2 | `node --test --test-reporter=tap skills/managing-lessons-store/scripts/lessons.test.mjs`（日志 `%TEMP%`） | `# tests 132 / # pass 132 / # fail 0 / # skipped 0`；`not ok` = 0 | 0 |
| 3 | `[regex]::Matches(ReadAllText(D10), '(?<![\w\\/.-])test\.mjs').Count`（PowerShell 原生正则） | `bare=0` / `any_mjs=9`（9 处全路径） | 0 |
| 4 | `Select-String '^\| G\d+ \|'` + 切单元格；`Select-String '以后再看\|看情况\|后续再说\|待定\|TODO'`（D10） | `G行=12`；10 条三列空值 0；`以后再看=1`（`:8` 定义句）、其余 0 | 0 |
| 5 | `git status --porcelain`；`git rev-parse --short HEAD`；`Select-String '@S-C'`（gate-record） | 1 行（`?? docs/after/20261104150807-…md`）；`d1826c0`；`SC_rows=4` / `gate_rows=74` | 0 |
| 6 | 收尾：`Remove-Item "$env:TEMP\sc-audit*"`；`.session/tmp` 文件数 | `%TEMP%` 下 `sc-audit*` = **0**；`.session/tmp` = **0** | 0 |

**复核轮判定：过。** 3 项处置 **3/3 闭合**；P0 0 / P1 0；D 件 11/11 成立、N 项 12/12 相符；8 条 P3 不阻断。**待用户终签的 ⑤ 门行由申报方落**（申报人 = 主 agent、签字人 = 用户）。
