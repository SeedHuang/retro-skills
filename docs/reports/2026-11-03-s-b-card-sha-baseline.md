# 冻结基线：S-B 契约层重生成（15 席卡面 SHA256）

- 批次：`2026-11-03` S-B 契约层（T6 = 15 卡重生成 + 15 份 evidence + 本基线表）
- 用途：给 spec §11.2.7 第 1 / 4 步（R11）留一份**可复算的终态快照**；改前基线 = `2c186c2`（② 段回流修订后的提交，`agents/` 在该提交上的状态与 S-A 收口表逐行相同）
- 取数命令（cwd = 仓根）：`Get-ChildItem agents\*.md | ForEach-Object { "$($_.Name) " + (Get-FileHash $_.FullName -Algorithm SHA256).Hash }`
- 落点说明：与 S-A 那张同因——`docs/superpowers/reviews/<本次>/` 只收 8 类评审产物 + `observation-rN` 语料（`tools/observation-check/gate-scan.mjs`），一次性产出记录按 `docs-convention` 落 `docs/reports/`。

## 一、15 席冻结基线（重生成后）

| # | 席 | SHA256 |
|---|---|---|
| 1 | `detective-observer.md` | `B6C20E380119E9A812A5A5D02DA89D6EFF979F5E4FD21D4043394F940C50CA04` |
| 2 | `evidence-reader.md` | `09C4919CF3A2C73466311CB15E05D8C637130E646AEB7C20CA9832C95AC6201C` |
| 3 | `reviewer-actuary.md` | `383B211BAB6CD231FB3970A7515DC399F94E2BB865B263C3FA4C42CFF586C476` |
| 4 | `reviewer-ai.md` | `4EF03340544810A463B52675D2B15457242C29082D58D322126DB75D973A8256` |
| 5 | `reviewer-audit.md` | `91506EA708CB3B7C1D830A0603C79DF2858B4F792D9084064EACEB0E5BC38598` |
| 6 | `reviewer-backend.md` | `D1278F5DC45C68CA4A89CEB393408261B5045C916EC78B596AFC7DE394BC2E5D` |
| 7 | `reviewer-frontend.md` | `112D88F2FCECF5C1473C02BCADD2CFD5E11BFDE6D9D5FA452152214ED1C5D547` |
| 8 | `reviewer-interaction.md` | `A0C82361A9ED8A7EF48351357429D8908518461C2E8B001FC2F3BE25891BA154` |
| 9 | `reviewer-ops.md` | `5E0FC1B4A68212D188FB1EB95DE11B620953AF18DC77C2677D2DD13518A3C4FA` |
| 10 | `reviewer-product.md` | `1BA14EB29866D2729D78B8D8ADFDEA0F3F22036E45B072F79C43AA28055B3A4D` |
| 11 | `reviewer-qa.md` | `0CFEF3955BC9192EA9569204CB47DECF82524B3ABEB39DDDF9443D654693B049` |
| 12 | `reviewer-reader.md` | `D9F69172F2B1303345E631D60584156CA71CA3126FF9D63A12D5B45CE532BED2` |
| 13 | `reviewer-security.md` | `1E3C3AA9E1F06F7E0AFB0C27DD3BF9368EB33B1663DFBF03FB6707EFA0F17F12` |
| 14 | `reviewer-ui.md` | `FB25DA5C1B12BDBA74F10B9005845F09D30CDE70176B3ADA0FB6EAA702D6E5B5` |
| 15 | `senior-sdet.md` | `0C2C87C2A44DADA71C6540B2CCFBA8A4E43D8B2ED0416F3BED4D36C90CB54C57` |

15 份 `tools/docgen/fixtures/<席>.evidence.json` 的 `renderSha256` 与本表**逐席相等**（mismatch 0，由 `replace` 同批写回，未手改）。

## 二、与 S-A 那张（`2026-11-03-s-a-card-sha-baseline.md`）的对照

**15/15 全变**：S-A 表 15 行与 `2c186c2` 上的盘上哈希逐行相同（该表定稿后 `agents/` 只被 S-B 这批动过），重生成后 15 行无一行重合。

`git diff --numstat 2c186c2 -- agents/` 实测为三分类（spec §11.2.7 第 4 步口径；旧稿「13 席只少一行」已作废）：

| 形态 | 席数 | 席 | 变更内容 |
|---|---|---|---|
| `0 / −1` | 2 | `evidence-reader`、`senior-sdet` | 只删「职责」段的 `关注类别：` 行 |
| `+7 / −6` | 11 | 其余 11 席（非指针） | `issue-card` 输出格式：证据位 1 行拆 3 行 + 编号顺延（+5/−3）+ 两条 checks 文案改写（+2/−2）+ 删 `关注类别：`（−1） |
| `+4 / −5` | 2 | `reviewer-audit`、`detective-observer` | 边界段 4 行改为策略符号名指针（+4/−4）+ 删 `关注类别：`（−1） |

`git diff --stat 2c186c2 -- agents/` 末行 = `15 files changed, 85 insertions(+), 78 deletions(-)`；`--name-only` = 15 行。

## 三、验收命令首行（重生成后实跑）

| 判据 | 命令 | 输出首行 / 结论 |
|---|---|---|
| R11 渲染一致 | `node tools/docgen/cli.mjs gate` | `baseline 38/38`（exit 0） |
| §11.4-6 / §11.4-8 / §11.2.7 | `node --test tools/docgen/test/sb-contract-layer.test.mjs` | `tests 35 / pass 35 / fail 0`（含 SB-TC-06 / 08 / 25 / 26 / 32 / 37） |
| §11.4-8 卡面 | `agents/*.md` 计数 | `关注类别：` = 0 / `类别：` = 15 |

## 四、口径边界

- 本表只记 SHA 与变更形态；`baseline.json` 只装路径清单、不含哈希 → **本批不改它**（spec §11.2.7 第 3 步）。
- 本表是**终态快照**，不是判据：判据在 `SB-TC-06` / `SB-TC-32`（与 `2c186c2` 比 + 位置型三段），表值过期不改判据。
