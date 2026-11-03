# 冻结基线：S-B 契约层收口（15 席卡面 SHA256）

- 批次：`2026-11-03` S-B 契约层（T1–T5 已提交，T6 = 本收口）
- 用途：给本段「卡面文本是生成物」（spec §11.1 R11 / §11.2.7）留一份**可复算的终态快照**；对照历史 = S-A 那张 15 行表 `docs/reports/2026-11-03-s-a-card-sha-baseline.md`
- 改前基线 `BASE` = `029bb29974a714abaf081f52e84b2b1ee2180017`（Task 5 提交；本任务开工前 `git rev-parse HEAD`，此后不再移动）
- 取数命令（cwd = 仓根）：`Get-ChildItem agents\*.md | ForEach-Object { "$($_.Name) " + (Get-FileHash $_.FullName -Algorithm SHA256).Hash }`
- 落 `docs/reports/` 而不落 `docs/superpowers/reviews/<本次>/` 的两条实测理由与 S-A 那份同源（见 `2026-11-03-s-a-card-sha-baseline.md` 开头第 6–9 行），此处不复述。

## 一、15 席冻结基线（S-B 终态）

| # | 席 | S-B SHA256 | S-A SHA256 | 与 S-A 比 |
|---|---|---|---|---|
| 1 | `detective-observer.md` | `B6C20E380119E9A812A5A5D02DA89D6EFF979F5E4FD21D4043394F940C50CA04` | `ED640983DD8D1AC678ED7CF718F520C4098CFED4FC3DC472455C5C175FBFC440` | 变 |
| 2 | `evidence-reader.md` | `09C4919CF3A2C73466311CB15E05D8C637130E646AEB7C20CA9832C95AC6201C` | `E91CB2E4FA871859DD9EC55244AC036FD15D9726AF7F0B394548AE1F63BC1458` | 变 |
| 3 | `reviewer-actuary.md` | `383B211BAB6CD231FB3970A7515DC399F94E2BB865B263C3FA4C42CFF586C476` | `76DFB8724800E309730A60CFF3117A1F11CF4C305090395561933D3C7204ED74` | 变 |
| 4 | `reviewer-ai.md` | `4EF03340544810A463B52675D2B15457242C29082D58D322126DB75D973A8256` | `56849A82F7C959A99870961CD10DA152BABFF1198E1404F6339928A713926E91` | 变 |
| 5 | `reviewer-audit.md` | `91506EA708CB3B7C1D830A0603C79DF2858B4F792D9084064EACEB0E5BC38598` | `EA6547BC6C22F9D27AD0BFF891EE3666B2C02C313C175704CE158065F6B72CE8` | 变 |
| 6 | `reviewer-backend.md` | `D1278F5DC45C68CA4A89CEB393408261B5045C916EC78B596AFC7DE394BC2E5D` | `07F071CAE614E3BCB4FCB3224225AABECDD292D87CB6B56BDD231C44EE0D6EC4` | 变 |
| 7 | `reviewer-frontend.md` | `112D88F2FCECF5C1473C02BCADD2CFD5E11BFDE6D9D5FA452152214ED1C5D547` | `26614217EA5FF95CF962EB60859396F0FFB5CB3E987C1A13A5AC9C105D4F3DEC` | 变 |
| 8 | `reviewer-interaction.md` | `A0C82361A9ED8A7EF48351357429D8908518461C2E8B001FC2F3BE25891BA154` | `BB8A75E3FD82FB36C39117045B589E254FE36E3298A4AECC53CD9E5FB4980DAA` | 变 |
| 9 | `reviewer-ops.md` | `5E0FC1B4A68212D188FB1EB95DE11B620953AF18DC77C2677D2DD13518A3C4FA` | `0A57CA05A36A704AC3381019A0859DA81BBBD40201DC3380EE718FDAA0FFE430` | 变 |
| 10 | `reviewer-product.md` | `1BA14EB29866D2729D78B8D8ADFDEA0F3F22036E45B072F79C43AA28055B3A4D` | `A08DBC95FD17E8B7F89AEDF6853C53BBAF79E91504680ADC8321AC93B1E10845` | 变 |
| 11 | `reviewer-qa.md` | `0CFEF3955BC9192EA9569204CB47DECF82524B3ABEB39DDDF9443D654693B049` | `30E24E64C56288BFF1DD4EDBC1ABE7A985C7E02BBB25EF2C3EC34DE1C29A424E` | 变 |
| 12 | `reviewer-reader.md` | `D9F69172F2B1303345E631D60584156CA71CA3126FF9D63A12D5B45CE532BED2` | `3DDA7570733122E3B13866DB332FE517925E69978B6F229A8F21E5D3AE518F6B` | 变 |
| 13 | `reviewer-security.md` | `1E3C3AA9E1F06F7E0AFB0C27DD3BF9368EB33B1663DFBF03FB6707EFA0F17F12` | `7151EEDEC3070C81FE146F1284A288FD87D7AA6D7FAEC9B432D471744F36EFB5` | 变 |
| 14 | `reviewer-ui.md` | `FB25DA5C1B12BDBA74F10B9005845F09D30CDE70176B3ADA0FB6EAA702D6E5B5` | `14CDE3BB9087A82D3D0B9DE17F3F89BD77F814FEC384B32A51CA33379C445366` | 变 |
| 15 | `senior-sdet.md` | `0C2C87C2A44DADA71C6540B2CCFBA8A4E43D8B2ED0416F3BED4D36C90CB54C57` | `B76C0E3F662FD4A86C89B47FD3A57F46331234234ED4B018C5EC84D22D4398ED` | 变 |

**15/15 全变**（与 S-A 那张逐行都不相等）。

## 二、变更形态：与 S-A 的「13 席只少一行」不一致（**实测 2 席**）

`git diff --numstat 029bb29 -- agents/` 实测三类（合计 `15 files changed, 85 insertions(+), 78 deletions(-)`）：

| 类 | 席 | 增 / 删 | 变的内容 |
|---|---|---|---|
| A（11 席，`outputKind = issue-card`） | `reviewer-actuary` / `reviewer-ai` / `reviewer-backend` / `reviewer-frontend` / `reviewer-interaction` / `reviewer-ops` / `reviewer-product` / `reviewer-qa` / `reviewer-reader` / `reviewer-security` / `reviewer-ui` | +7 / −6 | 删 `关注类别：` 行（−1）+ `输出格式` 段：必填字段 3 行改 5 行（−3/+5）+ 校验 2 行改文案（−2/+2）。后两处来自 §11.1 R1（`issue-card` 7 → 9 列）与 R9（`FORMAT_CHECKS` 第 2 条） |
| B（2 席，非 `issue-card`） | `evidence-reader` / `senior-sdet` | 0 / −1 | 只删 `关注类别：` 行 |
| C（2 席，走边界模板） | `reviewer-audit` / `detective-observer` | +4 / −5 | 删 `关注类别：` 行 + `边界` 段 4 行改指针句（−4/+4） |

**结论与偏差**：spec §11.3 / §11.4-6 / §11.2.7-4 与 testcase `SB-TC-32` 写的「15 张卡全变，13 张只少这一行」在改前提交上**不成立**——`13 席`（= 15 − 2 张指针席）里只有 B 类 2 席是纯 −1，A 类 11 席同时承载 R1 的 `输出格式` 段变更（R1 与「只少一行」互斥，spec 正文未记录这层耦合）。该偏差已在 `.session/sdd-2026-11-03-sb-contract/task-6-report.md` 的「疑点」节点名，控制者裁定前不动 spec / testcase。

## 三、验收命令首行（本任务实跑）

| 判据 | 命令 | 输出首行 / 结论 |
|---|---|---|
| R11 渲染一致 | `node tools/docgen/cli.mjs gate` | `baseline 38/38`（exit 0） |
| 变更面 | `git diff --stat 029bb29 -- agents/` | `15 files changed, 85 insertions(+), 78 deletions(-)` |
| evidence 对齐 | `SHA15` 与 15 份 `fixtures/<席>.evidence.json` 的 `renderSha256` 逐席比 | 不一致 0 席（15/15） |

> 本文件写入时点 = 15 席 `replace` 与 6 条用例全绿之后；此后 `npm run check` 的 `④` 段文件 / 表计数会因本文件自身而变。
