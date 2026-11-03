# 冻结基线：S-A 数据层收口（15 席卡面 SHA256）

- 批次：`2026-11-03` S-A 数据层（T1–T5 已提交，T6 = 本收口）
- 用途：给本段「渲染逐字节不变」（PRD V4 / spec R9）留下一份**可复算的终态快照**；改前基线 = `c01ccf3`（T4-补 终点，`agents/` 最后一次被改前的状态）
- 取数命令（cwd = 仓根）：`Get-ChildItem agents\*.md | ForEach-Object { "$($_.Name) " + (Get-FileHash $_.FullName -Algorithm SHA256).Hash }`
- **为什么落 `docs/reports/` 而不是 plan 写的 `docs/superpowers/reviews/<本次>/impact-sheet.md`**（两条都实测判红）：
  1. `scripts/scope-sweep.mjs:80-94` 的 `findImpactSheet()` 按 mtime 自动发现两处 `reviews/` 下最新的 `impact-sheet.md` 当「当次改判清单」；本文件只有 15 席 SHA、不含 R8 的 32 口径计数与命中文件 → 占用该名会让 4 条 sweep 用例判红（T6 审计 P0-1 实测）。本批真清单 = `.session/reviews/2026-11-03-s-a-plan-gate/impact-sheet.md`。
  2. `tools/observation-check/gate-scan.mjs:5` 的 `ALLOWED_FILE_RE` 只认 8 类文件名（`progress` / `cards` / `problems` / `submission` / `impact-sheet` / `detective` / `round-check` / `delivery-audit`），且 `:23` 要求该目录必须有 `observation-rN.(json|md)` 产物 → 非评审产物（冻结基线）放进 `docs/superpowers/reviews/<次>/` 必报 `ArtifactMissing` + `UnclassifiedArtifact`（`npm run check` ⑥ 段实测）。
  - 结论：一次性产出记录按 `docs-convention` 落 `docs/reports/`；`docs/superpowers/reviews/` 只放评审过程账（8 类文件名 + observation 产物）。

## 一、15 席冻结基线

| # | 席 | SHA256 |
|---|---|---|
| 1 | `detective-observer.md` | `ED640983DD8D1AC678ED7CF718F520C4098CFED4FC3DC472455C5C175FBFC440` |
| 2 | `evidence-reader.md` | `E91CB2E4FA871859DD9EC55244AC036FD15D9726AF7F0B394548AE1F63BC1458` |
| 3 | `reviewer-actuary.md` | `76DFB8724800E309730A60CFF3117A1F11CF4C305090395561933D3C7204ED74` |
| 4 | `reviewer-ai.md` | `56849A82F7C959A99870961CD10DA152BABFF1198E1404F6339928A713926E91` |
| 5 | `reviewer-audit.md` | `EA6547BC6C22F9D27AD0BFF891EE3666B2C02C313C175704CE158065F6B72CE8` |
| 6 | `reviewer-backend.md` | `07F071CAE614E3BCB4FCB3224225AABECDD292D87CB6B56BDD231C44EE0D6EC4` |
| 7 | `reviewer-frontend.md` | `26614217EA5FF95CF962EB60859396F0FFB5CB3E987C1A13A5AC9C105D4F3DEC` |
| 8 | `reviewer-interaction.md` | `BB8A75E3FD82FB36C39117045B589E254FE36E3298A4AECC53CD9E5FB4980DAA` |
| 9 | `reviewer-ops.md` | `0A57CA05A36A704AC3381019A0859DA81BBBD40201DC3380EE718FDAA0FFE430` |
| 10 | `reviewer-product.md` | `A08DBC95FD17E8B7F89AEDF6853C53BBAF79E91504680ADC8321AC93B1E10845` |
| 11 | `reviewer-qa.md` | `30E24E64C56288BFF1DD4EDBC1ABE7A985C7E02BBB25EF2C3EC34DE1C29A424E` |
| 12 | `reviewer-reader.md` | `3DDA7570733122E3B13866DB332FE517925E69978B6F229A8F21E5D3AE518F6B` |
| 13 | `reviewer-security.md` | `7151EEDEC3070C81FE146F1284A288FD87D7AA6D7FAEC9B432D471744F36EFB5` |
| 14 | `reviewer-ui.md` | `14CDE3BB9087A82D3D0B9DE17F3F89BD77F814FEC384B32A51CA33379C445366` |
| 15 | `senior-sdet.md` | `B76C0E3F662FD4A86C89B47FD3A57F46331234234ED4B018C5EC84D22D4398ED` |

## 二、改动清单：13 席逐字节不变、2 席只有边界段变（Q8）

`git diff --stat c01ccf3..HEAD -- agents/` → `2 files changed, 2 insertions(+), 2 deletions(-)`：

| 席 | 命中行 | 变的内容 |
|---|---|---|
| `detective-observer.md` | `:78`（1 行） | 「逐项点名」清单删 `lessons/`、`skills-lock.json`、`tools/docgen-spike/.tmp-test/` 三项 |
| `reviewer-audit.md` | `:96`（1 行） | 同上三项 |

其余 13 席在 `c01ccf3..HEAD` 内**零 diff**（`--stat` 只列上 2 个文件）。

## 三、本段验收命令首行（T6 Step 1 实跑；**建本文件之前**的基线态）

| 判据 | 命令 | 输出首行 / 结论 |
|---|---|---|
| V4 渲染不变 | `node tools/docgen/cli.mjs gate` | `baseline 38/38`（exit 0） |
| V5 引用完整性 | `node tools/docgen/check-shared-refs.mjs` | `check-shared-refs: seats 15 / dangling 0 / nested 0 / keySet8 15 / keySet12 15 => ok`（exit 0） |
| V10 字段位 | `node -e "import('./tools/docgen/components/agentData.mjs')…"` | `seats 15 kindSlot 15` |
| 全量门禁 | `npm run check` | `# tests 1434 / # pass 1432 / # fail 0 / # skipped 2`；末行 `check 全部通过`（exit 0） |

> 上表是**建本文件之前**的快照（`2026-11-03 15:34` 实跑）。此后本文件与 `gate-record.md` / plan 的收口改动会改变 markdown 文件/表数与 `# pass`，终值见 §四。

## 四、收口终态（全部改动落盘后复跑）

| 命令 | 输出首行 / 结论 |
|---|---|
| `node tools/docgen/cli.mjs gate` | `baseline 38/38`（exit 0） |
| `npm run check` | `# tests 1434 / # pass 1432 / # fail 0 / # skipped 2`；`baseline 38/38`；`0 findings`；`④ markdown 检查通过（386 个文件 / 1645 张表）`；`⑥ 观察产物门禁：扫描 2 个子目录 / 归档 1 对 / 过程 0 对 / findings 0`；末行 `check 全部通过`（exit 0） |
| `node scripts/scope-sweep.mjs --check` | `counts {…}`（33 口径与基线逐项相同）+ `sweep ok（命中未超基线、清单齐、scope 齐）`（exit 0） |

15 席 SHA 与本文件 §一 **15/15 逐行相等**（独立审计实例脚本比对，mismatch 0）；`git diff --stat c01ccf3..HEAD -- agents/` = `2 files changed, 2 insertions(+), 2 deletions(-)`（13 席零 diff）。
