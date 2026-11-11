# Session 交接：retro-skills → agent 模型流水线 P2 四维评估（2026-11-11）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-11-11 16:55（Asia/Shanghai） |
| 项目根 | d:\Seed\retro-skills |
| HEAD | bc6cd590073edca865b6ebb500d4f29466e099f6（bc6cd59 `feat(docgen): 补全 agent 策略配置与渲染隔离产物`）；工作树：交接时为 clean，本交接词落盘后新增 1 个未跟踪文件 `docs/handoffs/2026-11-11-agent-model-pipeline-p2.md` |
| 验证基线 | unit 28/28（`node --test --test-reporter=tap test-p1.test.mjs` → `# pass 28 / # fail 0`）+ verify 7/7 EQUIVALENT（`node verify-models.mjs`）+ 渲染确定性 1/1 同 sha（连跑两次 `render-all.mjs` 后 `detective-observer.md` 哈希相同）+ `sandbox/*.md` = 8（2026-11-11 16:54–16:55 实跑） |
| 继任自 | docs/handoffs/2026-11-11-agent-model-pipeline-p1.md |
| 状态 | 有 2 个开放问题（见「开放问题」，第 1 条为开工第一问） |

## 项目定位

d:\Seed\retro-skills —— 一套以「模型 JSON → 确定性渲染 → agent 卡面 / 规则 / skill」为主线的工具仓；当前正在把 18 张 agent 卡从手写 markdown 迁到模型驱动，P1（渲染隔离产物）已完成并提交。

## 现状

- 已完成（P1，全部按 `docs/superpowers/plans/2026-11-11-agent-model-pipeline-p1.md` Task 0–9 执行）：
  - PRD 回写：`docs/prd/20261111145723-agent-model-pipeline.md:156` 为「要补的 4 个缺口」，`:313` 为 `## 9 已定`（Q1–Q5 均写「已定：A（依据…）」）。
  - 7 席模型补 `seat.tier` + `boundary`（`tmp/agent-criteria-demo/models/*-model.json`）；3 席 `literal` 边界与现役卡逐字节相等（50/60/46 字）。
  - 渲染器补 `outputFormat` 段、「三形态边界」段、`tools` 改读 `TIERS[seat.tier]`、越界处置按 `steps` 序号（`tmp/agent-criteria-demo/render/sections.mjs`、`render/index.mjs`）。
  - 校验器补 5 码 + `exit 1`（`tmp/agent-criteria-demo/verify-models.mjs:112-120`、`:210-248`）。
  - 产物落 `tmp/agent-criteria-demo/sandbox/`（7 张卡）+ `diff-report.mjs` 生成 5 节报告（`sandbox/diff-report.md`，8 个 md）。
  - 46 条 testcase 执行状态已由 senior-sdet 子代理回填：39 自动化 + 7 人工，0 未施行（`docs/superpowers/specs/2026-11-11-agent-model-pipeline-p1-design-testcase.md` 各条「执行状态」行）。
  - 代码审查 6 条改进项已修：`render-all` 渲染前清 `outDir` 内 `*.md`、`BOUNDARY_POLICY_NONWRITER` 改用 policy 推导 tier、删 `makeHelpers` 死参数 `own`、K1 文案对齐逐席事实、段状态区分「缺段/空正文」、测试抽 `copyCase()`。
- 验证证据：见元信息表『验证基线』（单源）。
- 提交状态：已 commit（bc6cd59，含 5 份 docs、`rules/title-not-stronger-than-criterion.md`、`tools/docgen/**` 4 个文件）。
- 工作树异常：**P1 的实现不入库**。`tmp/` 被 `.gitignore:28` 忽略（`git check-ignore -v tmp/agent-criteria-demo/render/sections.mjs` → `.gitignore:28:tmp/`），`git ls-files tmp` = 0 行，bc6cd59 的 `--stat` 不含 `tmp/`。即 5 个 `.mjs`、7 张模型补丁、7 张产物、报告均只在本机磁盘，清理 `tmp/` 即丢失。

## 过程记录

- `docs/handoffs/2026-11-11-agent-model-pipeline-p1.md`（先读尾部；本轮所有决策的前置上下文）
- `tmp/agent-criteria-demo/.p1-start-status`（P1 开工快照，10 行；用于 TC-043 的「只允许新增」比对）
- `docs/superpowers/specs/2026-11-11-agent-model-pipeline-p1-design.md`（P1 技术设计，S1–S16 判据 + 5 码）
- `docs/superpowers/specs/2026-11-11-agent-model-pipeline-p1-design-testcase.md`（46 条，含 §8 修订与自检、§8.3 六次修订记录）
- 历史交接词链：`docs/handoffs/2026-11-11-agent-model-pipeline-p1.md` → 本文件

## 本次任务

P2 四维评估（AI 理解 / 执行力 / token 消耗 / 性能），对 7 席「现役卡 vs 沙箱产物」做盲测量化，产出 `tmp/agent-criteria-demo/eval/report.md` + `eval/raw/`，报告提交后停下等用户裁决；流程：开工第一问（实现入库）→ 读 PRD §6 P2 与 §7 → 建 `eval/raw/` 与盲测重命名 → 每维每卡 ≥3 轮（独立 subagent，单维单卡）→ 聚合中位数/极差 → `eval/report.md` 出「保留 / 修改 / 回退」结论 → 停下；起点：开工第一问。

## 范围依据

- 要读：
  - `docs/prd/20261111145723-agent-model-pipeline.md` §6 P2（行 180–188）、§7.1 样本与盲测（行 270–277）、§7.2 四维定义与合格线（行 279–286）、§7.3 独立评估者协议（行 288–293）、§7.4 判定（行 295–301）、§9 已定（行 313–321）
  - `docs/superpowers/specs/2026-11-11-agent-model-pipeline-p1-design-testcase.md` §1 覆盖总表与每条「执行状态」（确认 39 自动 + 7 人工，勿重跑无用项）
  - B 组卡面：`tmp/agent-criteria-demo/sandbox/` 下 7 个 `<seat>.md`；A 组卡面：`agents/<seat>.md` 同名 7 席
  - 报告样例口径：`tmp/agent-criteria-demo/sandbox/diff-report.md`（5 节、列名冻结）
- 勿重做：
  - `tmp/agent-criteria-demo/render/sections.mjs`、`render/index.mjs`、`verify-models.mjs`、`render-all.mjs`、`diff-report.mjs`（P1 已交付并过审）
  - 7 张模型的 `seat.tier` / `boundary` 字段（P1 Task 1 已定，勿再改）
  - PRD §9 已定项（Q1–Q5）与 spec S1–S16（已冻结）

## 开放问题

1. **开工第一问**：P1 的 5 个 `.mjs`、7 张模型补丁与 7 张产物都在被忽略的 `tmp/`，未入库。P2 开工前是否先入库？推断：需要入库，且建议移出 `tmp/`（或 `git add -f`）再开工，否则 P2 报告引用的 B 组卡面随时可能被 `tmp/` 清理抹掉；依据：`.gitignore:28`、`git ls-files tmp` = 0、bc6cd59 `--stat` 不含 `tmp/`。请用户：确认入库方式（移出 tmp / force-add / 保持不入库）。
2. token 维度的「分词器复核」（PRD 行 285）本仓无任何依赖（`package.json` 无 `dependencies`/`devDependencies`）。推断：以「字符数 / 4」估算为主，分词器复核标注为未做或另装依赖；依据：PRD 行 285 与 `package.json:1-18`。请用户：确认是否引入分词器依赖。

## 既定约束（不要重新讨论、不要重新选型）

- 不改 `agents/**` 与 `tools/docgen/**`；P2 对 A 组只读 —— 出处：PRD §6 P1 边界（行 176）、spec §4.5-1
- P2 覆盖全部 7 席，不抽样 —— 出处：PRD §7.1（行 277）
- 盲测 A/B 重命名为 `card-A1.md` / `card-B1.md`，分组表只留主 agent —— 出处：PRD §7.1（行 275）
- 评估者用独立 subagent，只收「卡面路径 + 固定题目 + 固定 fixture」，且一 subagent 只测一维一卡 —— 出处：PRD §7.3（行 290–293）
- 每维每卡 ≥3 轮取中位数并报告极差 —— 出处：PRD §7.1（行 276）
- 报告提交后停下，未获用户确认不得进入 P3 —— 出处：PRD §6 P2（行 188）
- 所有步骤先按 spec / testcase 落盘再施工，先红后绿，判据不由施工者自评 —— 出处：本 session 用户明确要求；P1 沿用的三件套流程（spec / testcase / plan）

## 遗留裁决与留观项

- TC-018（`tools` 改源的双副本对照）未构造，仅做源码静态断言 + 7 席 `tools` 终值 —— 来源：testcase 各条执行状态；收敛时机：P4 触碰 `tools/docgen` 策略时
- `reviewer-audit` 缺 `## 输出格式` 段 —— 来源：`tmp/agent-criteria-demo/sandbox/diff-report.md` 的「缺失项」表；收敛时机：P4 建模
- 代码审查第 1 条的副作用：单独跑 `render-all.mjs` 会清掉 `diff-report.md`，需再跑 `diff-report.mjs` 才是 8 个 md —— 来源：`tmp/agent-criteria-demo/render-all.mjs:15-16`；收敛时机：P2 取 B 组卡面前先跑两个脚本
- token 正文字符估算与「格式 token 不计」的口径未在 PRD 冻结 —— 来源：PRD §7.2（行 285 仅给「字符数 / 4」）；收敛时机：P2 出报告时写明口径

## 开工前先做

1. `cd d:\Seed\retro-skills && git status --short`（预期只有 `?? docs/handoffs/2026-11-11-agent-model-pipeline-p2.md`，即本交接词；若用户已提交则预期无输出）+ `git log -1 --format=%H`（预期 `bc6cd590073edca865b6ebb500d4f29466e099f6`，若已提交本交接词则变为新 hash）
2. 复核基线：`cd tmp/agent-criteria-demo && node --test test-p1.test.mjs`（预期 28/28）、`node verify-models.mjs`（预期 7 行 EQUIVALENT）、`node render-all.mjs` 后 `node diff-report.mjs`（预期 `sandbox/*.md` = 8）
3. 读 `docs/prd/20261111145723-agent-model-pipeline.md` 的 §6 P2（行 180–188）与 §7.1–§7.4（行 270–301），把四维合格线抄成 checklist
4. 读 `docs/superpowers/specs/2026-11-11-agent-model-pipeline-p1-design-testcase.md` §1 表与各条「执行状态」，确认 39 自动 + 7 人工，避免重复验收
5. 先解开放问题 1（实现是否入库），再建 `tmp/agent-criteria-demo/eval/` 与 `eval/raw/`

## 开场话术

读 docs/handoffs/2026-11-11-agent-model-pipeline-p2.md，按交接词继续：P2 四维评估（7 席现役卡 vs 沙箱产物盲测）。注意：先答开工第一问（P1 实现是否入库）。
