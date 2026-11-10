# 出口签字账

> 任务：脚本分层与运行期收口｜PRD：`docs/prd/20261109211349-script-layer-refactor/index.md`｜spec：`docs/superpowers/specs/2026-11-09-script-layer-refactor-design.md`｜plan：`docs/superpowers/plans/2026-11-09-script-layer-refactor.md`

## 出口签字表

| 段 | 出口判据（逐条） | 核了什么（命令输出首行 或 path:line） | 申报人 | 签字人 | 结论 |
|---|---|---|---|---|---|
| ① | 范围 / 目标 / 约束 / 不适用四栏齐（PRD 无 §0 编号，内容在头部 `:3-8`）；功能点清单 4 行与图 4 节点互校（§10 `:230-250`） | `docs/prd/20261109211349-script-layer-refactor/index.md:3-8`；§10 `#L230-L250` | 主 agent（代拟） | 用户 | 过（2026-11-09 用户原话「可以」，口头放行至 ②） |
| ② | spec + testcase 一件交付；外链可达；验收项 ↔ 用例双向；负+边界 43 ≥ 正 26；无待确认；议会 #2 通过（4 轮，P0=0） | `check-plan map` → `missing 0 dangling 0（cases 69 / mapped 69）`；`size` → `spec 243/350 tc 69/80`；审计签收见 `.session/reviews/2026-11-09-215358-script-layer-refactor/submission.md` | 主 agent、senior-sdet | 审计 | 过（议会 #2 四轮收敛，P0=0；末条 P1 已闭合） |
| ③ | F-01 组级 layer 且卡面只渲染 run 组；F-02 C5 终态对账 + C2 形态；F-03 `scs check landings`；F-04 两 inspector 迁 scs + 基线/映射表 + skill-dir 单源；改动文件无未实现占位 | `npm run check` 末行 `check 全部通过`；`npm test`（scs）末行 `Tests 136 passed (136)`；落点 `tools/docgen/builders/agents/policy/definitions/commands.mjs:7-37` | 主 agent（代拟） | 审计（2026-11-10 独立核验） | 过（F-01～F-04 逐项通过；TODO/FIXME 真实占位 0） |
| ④ | V1/V5 分层门禁绿；V9 四条新命令皆有正负例测试；V11 新门禁有 testcase；V4 机械项负例在位；新增行 skip/恒真断言 0 | `node scripts/check-command-layer.mjs` 首行 `command-layer ok`；负例 `D:\Seed\skill-common-script\src\commands\check-landings.test.ts:32`；`node scripts/check-skill-dir-single-source.mjs` 首行 `skill-dir ok` | 主 agent（代拟） | senior-sdet | 过（V1/V4/V5/V9/V11 全过，风险扫描 0 命中） |
| ⑤ | 4 个功能点交付物齐（代码 / 迁移基线 / 映射表 / 测试）；两仓工作区干净；PRD 状态行更新为已交付 | `git status --porcelain` 无输出；本仓 HEAD `b4bd1a8`、scs HEAD `0bb246e`；`docs/prd/20261109211349-script-layer-refactor/index.md:3` | 主 agent（代拟） | 用户 | 过（2026-11-10 用户「好的，执行吧」授权收口） |
