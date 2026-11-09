# 出口签字账

> 任务：脚本分层与运行期收口｜PRD：`docs/prd/20261109211349-script-layer-refactor/index.md`｜spec：`docs/superpowers/specs/2026-11-09-script-layer-refactor-design.md`｜plan：`docs/superpowers/plans/2026-11-09-script-layer-refactor.md`

## 出口签字表

| 段 | 出口判据（逐条） | 核了什么（命令输出首行 或 path:line） | 申报人 | 签字人 | 结论 |
|---|---|---|---|---|---|
| ① | 范围 / 目标 / 约束 / 不适用四栏齐（PRD 无 §0 编号，内容在头部 `:3-8`）；功能点清单 4 行与图 4 节点互校（§10 `:230-250`） | `docs/prd/20261109211349-script-layer-refactor/index.md:3-8`；§10 `#L230-L250` | 主 agent（代拟） | 用户 | 过（2026-11-09 用户原话「可以」，口头放行至 ②） |
| ② | spec + testcase 一件交付；外链可达；验收项 ↔ 用例双向；负+边界 43 ≥ 正 26；无待确认；议会 #2 通过（4 轮，P0=0） | `check-plan map` → `missing 0 dangling 0（cases 69 / mapped 69）`；`size` → `spec 243/350 tc 69/80`；审计签收见 `.session/reviews/2026-11-09-215358-script-layer-refactor/submission.md` | 主 agent、senior-sdet | 审计 | 过（议会 #2 四轮收敛，P0=0；末条 P1 已闭合） |
