# S3 议会独立议长与答辩方：出口签字账

| 段 | 出口判据（逐条） | 核了什么（命令输出首行 或 path:line） | 申报人 | 签字人 | 结论 |
|---|---|---|---|---|---|
| ① | §0 四栏齐（有）；功能点清单与流程图双向一一对应（有）；S3 范围经用户 2026-11-08 拍板：拆 S3-A / S3-B、答辩方 3 卡 | `docs/prd/20261024073606-dev-workflow-mainline/index.md:706`（S3 现状）、`:729-731`（F-10 / F-11） | 产品经理（代拟：主 agent） | 用户 | 过（沿用主线 PRD §0，增量范围由用户口头裁定） |
| ② | spec + testcase 一件齐（有）；差异清单留痕（有）；内部对齐零未决（不成立：P0 = 8 族） | `.session/reviews/2026-11-08-185332-s3-a-speaker-seats/problems.md`（17 条 / P0 8 族）、`progress.md`（第 1 轮 5 席 FAIL） | 主 agent、sdet | 审计 | 不过（议会 #2 第 1 轮打回：F01–F08） |
| ②@议会#2终局 | spec + testcase 一件齐（有）；差异清单留痕（有）；内部对齐零未决（P0 = 0 / P1 = 0；P2 挂 2：F17 / F40） | `.session/reviews/2026-11-08-185332-s3-a-speaker-seats/progress.md:25`（第 5 轮 P0 0 / P1 0）、`problems.md:24`（F17）、`:57`（F40）、`submission.md:11-12`（两件哈希） | 主 agent、sdet | 审计 | 过（P0 = 0 / P1 = 0；P2 挂 2 留观，随 S3-A 施工） |
