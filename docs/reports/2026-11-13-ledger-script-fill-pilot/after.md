# 试点后（T7）

> 流程：clean 骨架 → `fillText`（显式命令 `audit.spot=node -e "console.log('ok')"`）→ AI 补齐剩余待判 → `verify`。
> 产物副本：`tmp/fixtures/ledger-fill-pilot/after/round{1,2,3}/round-check.md`。

| 轮 | 行数 | 机算 | 填充后待判 | AI 补齐 | verify reds | 机械错填 M |
|---|---|---|---|---|---|---|
| round1 | 8 | 1 | 7 | 7 | 0 | 0 |
| round2 | 8 | 1 | 7 | 7 | 0 | 0 |
| round3 | 8 | 1 | 7 | 7 | 0 | 0 |

结论：3 轮 verify reds 与机械错填 M 均为 0。
