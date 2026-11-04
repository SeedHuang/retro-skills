# S-C ⑤ 段交付申报清单（申报人：主 agent）

供核对席（审计）逐条复算。本文件是「申报」面，不是结论面；结论由审计在 `delivery-5-audit.md` 出，定性由用户在 `gate-record.md` 的 ⑤@S-C 行签。

## §0 全貌确认（事前三步，落实 2026-10-14 规则）

**本质**：⑤ 段要回答的不是「测试绿不绿」（那是 ④），而是「**交付物是否一一对得上验收结论、每个数字能否被复算、没做完的有没有实名落点、做出来的东西运行时是否真的生效**」。判据源 `skills/dev-workflow/references/stage-5-delivery.md:10-13` 四条。

**同族**：④ 段判据（用例逐条结论 / 反向验证 / 缺口五列 / 漂移三权）已在 `quality-4.md` 与 `quality-4-audit.md` 收口；⑤ 只在其上加「逐交付物 × 数字复算 × 落点 × 运行时就位」四层，不重复 ④ 的工作。

**边界**：⑤ 不改任何已签件（spec / testcase / 卡面 / 断言）；只允许新增落点文档（`docs/after/`）与门行。审计不签验收（签字人 = 用户）。

**验收**（本段要产出的四件）：① 交付审计表逐交付物有结论 + 证据位；② 每个数字项有取数命令且审计**本人复算**（不是看我的结论）；③ 未完成项落点实名（见 `docs/after/20261104150807-s-c-shape-known-gaps-open-decisions.md`）；④ 运行时就位判定（本批零新增 rule / skill → 判「不适用」，但给出可核依据）。

**影响面**：`gate-record.md` 增 1 行（⑤@S-C）；`docs/after/` 增 1 份；`.session/` 增 2 份（本清单 + 审计表）。不改实现。

**联动四问**：
- 治本吗：⑤ 判「数字可复算」而非「数字好看」——审计必须自己跑一遍（本清单每条都给命令），治的是「只信结论」这个根因。
- 有副作用吗：新增 `docs/after/` 一份会进 `scope-sweep` 的 `after` 面与 `check-observable` 扫描 → 已按可观察形态写（每条都有「怎么发现它到点了」）。
- 跨问题联动吗：G6 与 G4/G5 同族（都是「守卫无判别力」）；G4/G5 已闭合，G6 属「覆盖账虚高」，本批**不改**已签断言 → 走落点（用户口径「本批不改已签断言」）。
- 跨页面/项目吗：`gate-record.md` 是全仓门行唯一载体，本行会进后续所有 `check-gate-record` 复算 → 必须 6 列齐、R2 无交集。

## §1 交付物清单（逐件：完成判据 / 证据位 / 取数命令）

| # | 交付物 | 完成判据 | 证据位 | 取数命令（审计自行复算） |
|---|---|---|---|---|
| D1 | spec 定稿件 `docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md` | 270 行；SHA 不变（签字件零改动） | `docs/superpowers/plans/2026-11-03-s-c-card-shape.md:214` | `Get-Content <spec>`.Count → 270；`Get-FileHash -Algorithm SHA256` → `9B470C82…E7BA0` |
| D2 | testcase 签字件 `…-design-testcase.md` | 1072 行 / 60 条；SHA 不变 | 同上 `:214`（`tc 60/80`） | `node scripts/check-plan.mjs size --spec <spec> --testcase <tc> --rounds 3` → `spec 270/350 tc 60/80 rounds 3/3 => ok` |
| D3 | plan `docs/superpowers/plans/2026-11-03-s-c-card-shape.md` | Task 0–6 共 7 任务、45 步全勾 | plan `:214-220` | `Select-String -Pattern '- \[x\]'` → 45；`- \[[x ]\]` → 45 |
| D4 | 生成器 / 门禁实现（`card-contract.mjs`、`cardFaceIds.mjs`、`renderCard.mjs`、`check-trigger-kind.mjs`、`check-tristate-header.mjs`、`scripts/check-all.mjs`、`scripts/test-skip-allowlist.mjs`、`tools/observation-check/checks.mjs`） | 两个形状脚本 `bad 0`；`check-all` 已接 ②.7 段 | `check-trigger-kind.mjs` / `check-tristate-header.mjs` 输出 | `node tools/docgen/check-trigger-kind.mjs` → `seats 15 / kinds {dispatch:11,occasion:1,moment:1,need:2} / bad 0 => ok`；`node tools/docgen/check-tristate-header.mjs` → `seats 15 / ok 15 / bad 0 => ok` |
| D5 | 数据层 15 份 `tools/docgen/data/seats/*.json` + `shared.json` | 15 席全部改：`duty.action` 写回、`role` 去「资深」、`trigger.kind` 四型、`hostTerm` 键 | plan `:216-217` | `node tools/docgen/cli.mjs gate` → `baseline 38/38`；`check-shared-refs` → `keySet8 15 / keySet12 15 => ok`（Task 2 记录） |
| D6 | 卡面生成物 `agents/*.md` 15 份 + `docs/agents/*.md` 16 份（README + 15） | 15/15 `disk == render`；16 份由 `generate --readme --apply` 产出 | plan `:220` | `node tools/docgen/cli.mjs gate` → `baseline 38/38` + exit 0；份数：`Get-ChildItem agents\*.md` → 15、`docs\agents\*.md` → 16 |
| D7 | fixtures `tools/docgen/fixtures/*.evidence.json` 15 份 | 判别记录随本批追加（`rejudged` = A1/A2） | plan `:220` | `git diff --stat $BASE..HEAD -- tools/docgen/fixtures` → 15 份均 +34/-? |
| D8 | 回归测试 `tools/docgen/test/sc-card-shape.test.mjs` | **60** 个 `SC-TC-` 块；单跑 60/60/0/0 | `quality-4.md` §7 R1 | `node --test --test-reporter=tap tools/docgen/test/sc-card-shape.test.mjs` → `# tests 60 / # pass 60 / # fail 0 / # skipped 0`；块数用带锚点命令 `select-string -Pattern "^\s*test\('SC-TC-"` → 60（见 G3） |
| D9 | 门行 4 行（②@S-C / ②→③@S-C / ③@S-C / ④@S-C） | 6 列齐、R2 无交集 | `skills/dev-workflow/references/gate-record.md` | `node scripts/check-gate-record.mjs` → `rows 72 bad 0` + `gate-record ok` |
| D10 | 已知限制落点 `docs/after/20261104150807-s-c-shape-known-gaps-open-decisions.md` | 12 条（G6 P2 + 9 条 P3 + G4/G5 已闭合）+ 每条「等什么 / 谁满足 / 触发信号」 | 本文件 | `Select-String -Path docs/after/20261104150807-*.md -Pattern '触发信号'`；`Get-Item` 存在 |
| D11 | 延期项落点 `docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md` | Task 0 建、含「触发 / 谁兜」 | plan `:214` | `Get-Item` 存在（2735 B） |

## §2 数字签字项（每条：数字 / 取数命令 / 我实跑的首行输出）

| # | 数字 | 命令 | 实跑首行（2026-11-04） |
|---|---|---|---|
| N1 | `# tests 1541 / # pass 1536 / # fail 0 / # skipped 5` | `npm run check` | `# tests 1541` … 末行 `check 全部通过`；exit 0 |
| N2 | `baseline 38/38` | `node tools/docgen/cli.mjs gate` | `baseline 38/38`，exit 0 |
| N3 | 60 条 = 正 21 / 负 17 / 边界 22 | `quality-4.md` §3 现算（审计须独立数一遍） | 39 ≥ 21（现算） |
| N4 | 60 个 `SC-TC-` 块 | 带锚点 `select-string "^\s*test\('SC-TC-"` | 60（无锚点为 61，见 G3） |
| N5 | 15 席 / 16 份投影 | `Get-ChildItem agents\*.md` / `docs\agents\*.md` | 15 / 16 |
| N6 | `size: spec 270/350 tc 60/80 rounds 3/3 => ok` | `node scripts/check-plan.mjs size --spec … --testcase … --rounds 3` | 原文如上 |
| N7 | `map: missing 0 dangling 0（cases 60 / mapped 60） => ok` | `node scripts/check-plan.mjs map --plan …` | 原文如上 |
| N8 | `deps: cycle 0 dangling 0（nodes 7 / edges 10） => ok` | `node scripts/check-plan.mjs deps --plan …` | 原文如上 |
| N9 | `rows 72 bad 0` | `node scripts/check-gate-record.mjs` | `rows 72 bad 0` + `gate-record ok（R1/R2/R6 全过；splitting 0）` |
| N10 | 漂移 `一致 58 / 换载体 1 / 判据放宽 1 / 功能增删 0 = 60` | `quality-4.md` §6 逐条表（审计抽 ≥3 条复核） | 见 `quality-4.md:243-246` |
| N11 | `sweep ok`（R8） | 先 touch `impact-sheet.md` → `node scripts/scope-sweep.mjs --check` | `sweep ok（命中未超基线、清单齐、scope 齐）` |
| N12 | `check-observable ok` | `node scripts/check-observable.mjs --check` | `check-observable ok` |

## §3 未完成项 / 已知限制落点

见 D10 / D11。**不含「以后再看」类无落点项**：每条都有「触发信号」列（怎么发现它到点了）。

## §4 运行时就位（判据 4 的判定与依据）

**判定：不适用。** 依据：本批 `git diff --stat $BASE..HEAD -- rules/ skills/` → 仅 `skills/dev-workflow/references/gate-record.md`（`5 insertions / 2 deletions`，门行登记），**零新增 rule、零新增 skill**；`agents/*.md` 是既有 15 席卡面重生成（非新增技能）。

**附带可核项（不因「不适用」就免检）**：
- `node tools/docgen/cli.mjs generate --readme`（不写盘）→ 打印 `baseline 38/38`，随后 `git status --porcelain` → 0 行 ⇒ **生成物与渲染器输出一致（幂等）**。
- 本机 `aas` 存在（`D:\devtools\nvm4w\nodejs\aas.ps1`），但本批无新增 rule / skill 可同步 → 不执行 `aas sync`；若用户要求仍可跑，判据不变。

## §5 交给审计的核对指令

1. 逐条对 D1–D11 跑取数命令，**自跑**，不只读本表；任一条对不上 = 该交付物「不过」。
2. 对 N1–N12 逐条复算；特别是 N1（`# tests`）、N3（数量分类）、N10（漂移计数）必须自己数。
3. 核 G6（P2）在 D10 里有落点与触发信号；核 D10 无「以后再看」类表述。
4. 核 R2：⑤@S-C 行（我落盘后）申报人与签字人无交集。
5. 判 §4「不适用」是否成立（依据 = `rules/` `skills/` 的 diff 面）。
6. 不签验收：签字人 = 用户。
