# 出口签字账：s4-s5-skill-criteria

> 任务创建 2026-11-08 17:31:06；本文件按 `skills/dev-workflow/references/gate-record-template.md` 落行。全部六行已于 2026-11-08 签字（用户 / 审计 / sdet）。

| 段 | 出口判据（逐条） | 核了什么（命令输出首行 或 path:line） | 申报人 | 签字人 | 结论 |
|---|---|---|---|---|---|
| ① | 阶段 3 PRD 在位；本批无独立 §0，按项目级裁定（2026-11-05 三阶段）+ 用户 2026-11-08「补建 gate-record」执行 | `docs/prd/20261105182104-rule-refactor/prd/stage-3-skill-overhaul.md:1`（S-4/S-5）；用户裁定见 2026-11-08 对话 | 产品经理（主 agent 代拟） | 用户 | 过（用户 2026-11-08 确认：按阶段 3 子批次） |
| ② | spec + testcase + plan 一件齐；差异清单无未决；技改免议会（功能点集合未变） | `docs/superpowers/specs/2026-11-08-s4-s5-skill-criteria-design.md` + 同名 `-testcase.md` + `docs/superpowers/plans/2026-11-08-s4-s5-skill-criteria.md`；`map: missing 0 dangling 0 => ok` | 主 agent + sdet | 审计 | 过（审计 2026-11-08：三件齐；免议会成立；差异项已收口） |
| ②→③ | 功能点全覆盖 / 依赖无环 / 功能块↔testcase 一一映射 | `node scripts/check-plan.mjs map ...` → `=> ok`；`deps` → `=> ok`；`size` → `spec 180/350 tc 36/80 rounds 1/3 => ok` | 主 agent | 审计 | 过（审计 2026-11-08：map/deps/size ok） |
| ③ | 施工完成；`npm run check` 绿 | `npm run check` → `check 全部通过`；`node scripts/check-skill-criteria.mjs` → `skill-criteria 4 条 / 绿 4 / 红 0`；commit `2455640` | 开发（主 agent） | 审计 | 过（审计 2026-11-08：check 全绿） |
| ④ | testcase 全过；负例与边界 ≥ 正例；审计/sdet 复核问题已处置 | `node --test scripts/check-skill-criteria.test.mjs` → `tests 25 / pass 25 / fail 0`；`npm run check` → `# fail 0` | 开发（主 agent） | sdet | 过（sdet 2026-11-08：24/24；补强后 25/25） |
| ⑤ | 交付审计（含数字签字项） | commit `2455640`；`git status --porcelain` 空；`npm run check` → `check 全部通过` | 主 agent | 用户 | 过（用户 2026-11-08 交付终验） |
