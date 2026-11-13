# 出口签字账

> 任务：账本产物脚本填充 + 行定位｜PRD：`docs/prd/20261113124838-ledger-script-fill.md`｜spec：`docs/superpowers/specs/2026-11-13-ledger-script-fill-design.md`｜testcase：`docs/superpowers/specs/2026-11-13-ledger-script-fill-design-testcase.md`｜plan：`docs/superpowers/plans/2026-11-13-ledger-script-fill.md`

## 出口签字表

| 段 | 出口判据（逐条） | 核了什么（命令输出首行 或 path:line） | 申报人 | 签字人 | 结论 |
|---|---|---|---|---|---|
| ① | 范围 / 目标 / 约束 / 非目标齐；F1–F8 与 §6 验收映射在位 | `docs/prd/20261113124838-ledger-script-fill.md:6-40`、`docs/prd/20261113124838-ledger-script-fill.md:64-101` | 主 agent（代拟） | 用户 | 过（PRD v3.1 定稿，用户已放行至实现） |
| ② | spec D1–D12 + testcase 25 条 + 差异清单 9 条一致；计划门机械核对 4 项 + 独立审计签字 | `docs/superpowers/specs/2026-11-13-ledger-script-fill-design.md:11-24`、`docs/superpowers/specs/2026-11-13-ledger-script-fill-design-testcase.md:15-69` | 主 agent（代拟） | 审计 | 过（计划门通过，差异清单双方一致） |
| ②→③ | plan T0 五项 P0 blocker 解除；T1–T7 依赖无环、落点合规 | `docs/superpowers/plans/2026-11-13-ledger-script-fill.md:7-39`、`docs/superpowers/plans/2026-11-13-ledger-script-fill.md:54-62` | 主 agent（代拟） | 审计 | 过（T0 全绿，P0 blocker 解除） |
| ③ | kind 注册表 / 8 列骨架 / 行不预置 / 解析 / 填充 / 定位 / 校验 均落地；`npm run check` 全绿 | `npm run check` 末行 `check 全部通过`；`tools/review-ledger/fill.mjs:52-179` | 主 agent（代拟） | 审计 | 过（T0–T5 实现完成） |
| ④ | 54 条 review-ledger 测试全绿；夹具 11 份 sha256 冻结；试点 3 轮 verify reds=0 | `node --test "tools/review-ledger/test/*.test.mjs"` 输出 `pass 54 / fail 0`；`docs/reports/2026-11-13-ledger-script-fill-pilot/after.md:6-10` | 主 agent（代拟） | senior-sdet | 过（54/54；试点三轮 M=0） |
| ⑤ | 交付物齐（代码 / 夹具 / 试点记录 / 交接）；`npm run check` 全绿；工作树提交待用户 | `npm run check` 末行 `check 全部通过`；`docs/reports/2026-11-13-ledger-script-fill-pilot/observe.md:7-21` | 主 agent（代拟） | 用户 | 过（工具链全绿；提交由用户执行） |
