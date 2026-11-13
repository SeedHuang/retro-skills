# 观测项（T7）

> 只出数，不设阈值。

## 读取量（TC-16）

| 指标 | 值 |
|---|---|
| 夹具 | `tmp/fixtures/ledger-fill/long/delivery-audit.md`（134 行） |
| 全文读取字符数 | 3662 |
| 定位 3 行（第 1/4/6 项，context=1）JSON 合计字符数 | 1486 |
| 降幅 | 59.4% |

## 调用次数（TC-17）

| 流程 | 每轮调用次数 | 3 轮中位数 | 说明 |
|---|---|---|---|
| 基线 | 10 | 10 | 按「整文件读取 1 + 8 行手填 + 校验 1」估算，非实测 |
| 试点 | 5 | 5 | fill 1 + query 3 + verify 1 |

变化量：-5（-50%）。

## 复跑

```
node tools/review-ledger/scripts/make-fixtures.mjs --check
node tools/review-ledger/scripts/run-pilot.mjs
node --test "tools/review-ledger/test/*.test.mjs"
```
