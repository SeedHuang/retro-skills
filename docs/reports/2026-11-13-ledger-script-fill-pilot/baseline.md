# 试点基线（T7）

> 取数：`tools/review-ledger/scripts/run-pilot.mjs`；夹具 = `tmp/fixtures/ledger-fill/round{1,2,3}/round-check.md`。
> 夹具来源：历史 4 列账本会被 fill fail-closed 拒绝（D2），故 round1..3 为 8 列 schema 重建。
> 机械错填 M = `parse_failed` / `duplicate_keys` / `machine_empty` / `machine_overwritten` 的 red 数；pending 单列。
> scs 版本：`0.1.0`

| 轮 | 数据行 | skipped | pending | 机械错填 M | red codes |
|---|---|---|---|---|---|
| round1 | 8 | 0 | 8 | 0 | pending_unfilled×8 |
| round2 | 8 | 0 | 0 | 0 | — |
| round3 | 8 | 0 | 5 | 0 | pending_unfilled×5 |

结论：3 轮机械错填 M 均为 0；pending 8 / 0 / 5 为本轮待判工作量，不计为错填。
