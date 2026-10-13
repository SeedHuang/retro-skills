# Session 交接：retro-skills → 修复账本衔接 + 跑基线（2026-10-13）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-13 12:10（本机时区） |
| 项目根 | d:\Seed\retro-skills |
| HEAD | 2e3478d；工作树：clean |
| 验证基线 | check.mjs 0 findings + drafts.test.mjs 7/7 pass（2026-10-12 实跑） |
| 继任自 | 无（本主题首份 handoff） |
| 状态 | 可直开工（1+2 是已确认要修的已知 bug，方向无争议） |

## 项目定位

d:\Seed\retro-skills —— 复盘/审查技能套件仓库（review-loop / review-log / rule-writer / rule-inspector 等 Agent Skills + rules/ 全局规则）。

## 现状

- 已完成（上一 session，2026-10-12~13）：
  - L1-L4 分账复查：L1/L4 已机制化（分支锁基线 + 停机判据，实测 2 轮收敛）；L2 处置侧过滤机制在位但**锚点原料缺失**（problems.md 未建）；L3 处置侧全覆盖、源头侧靠兜底
  - 发现流程缺口：review-loop 分支前置第 5 步只建 progress.md、没建 problems.md（L2 过滤空转）
  - wrapper 方案完整设计 + 模型实测：qwen3.8:27b 同源判定 12/12 零误吞（GPU 0.17s/条、冷启动 7.6s、num_ctx=8K 显存 20.2GB）；27B/30B 均不适合 OCR 主审（实测漏检功能性真问题）；GPU 修复完成（CUDA 组件补全，ollama 0.40.3，100% GPU）
  - **独立审查**（子代理 multi-lens 六手法）：结论「不建议按当前形态实施 wrapper」——1 处 P0 自相矛盾 + 误吞无第二次机会 + 成本账无数据支撑；建议先落地 1+2 拿基线数据再决定 wrapper
  - 决策（用户裁定）：**先落地修改 1+2，跑 2-3 场 review 拿基线数据**，wrapper 押后等数据
- 提交状态：工作树 clean（HEAD 2e3478d，本会话无代码改动落地——wrapper 未实现、1+2 未改）
- 工作树异常：无

## 过程记录

- **核心方案文档**：`d:\Seed\retro-skills\.session\temp\2026-10-12-review-loop-accounting-gap.md`（先读尾部——含修改 1/2/3 全案 + 模型实测 + 审查后补充的实现细节）
- 分账分析：`d:\Seed\retro-skills\.session\temp\2026-10-10-config-layering-review-accounting.md`（L1-L4/A1-A3 背景）
- review 历史账本：`d:\Seed\retro-skills\.session\reviews\`（多次 review 的过程账，problems.md 缺口实例见 2026-10-12-1916 / 2026-10-12-2030）
- 历史交接词：无（本主题首份）

## 本次任务

**落地修改 1+2（review-loop 账本衔接修复）+ 跑基线数据，为 wrapper 决策取证**。

流程：
1. **现状基线（对照组）**：用户会先跑一轮 code review——**不修 1+2 先跑**，记录「重复问题占比」（无锚点时 OCR 重复报的比例）。这是「要不要动手」的依据
2. **落地修改 1+2**：
   - 修改 1：review-loop SKILL.md「分支前置」第 5 步 → 改为「建 progress.md + problems.md」（problems.md 逐字用 review-log 骨架模板 `skills/review-log/assets/review-problems-template.md`）
   - 修改 2：loop.md「处置前的重复判定过滤」处 → 加强制：每轮处置后「不改/误报」进锚点区、「候选」进候选区；缺锚点 = 本轮账本不全
3. **修复后基线（实验组）**：再跑 2 场 review，记录「处置侧过滤覆盖率 / agent 漏执行率」——「要不要 wrapper」的依据
4. 两份数据齐了 → wrapper 决策（见开放问题 1）

起点：环节 1（现状基线，等用户先跑 code review 顺手攒）。

## 范围依据

- 要读（开工前）：
  - `d:\Seed\retro-skills\.session\temp\2026-10-12-review-loop-accounting-gap.md` §二修改 1/2 节 + §三待决
  - `d:\Seed\retro-skills\skills\review-loop\SKILL.md`「分支前置」第 4-5 步（改第 5 步）
  - `d:\Seed\retro-skills\skills\review-loop\references\loop.md` §1「处置前的重复判定过滤」（改此处加强制）+ §3 硬约束
  - `d:\Seed\retro-skills\skills\review-log\SKILL.md`（「目录里两个文件」定义）+ `skills\review-log\assets\review-problems-template.md`（骨架模板）
- 勿重做（已定版/已完成）：
  - 模型选型：27B 锁定裁决（12/12）、不做 OCR 主审（实测漏检）——不要重新选型
  - GPU 修复：ollama 已 100% GPU（0.40.3）——不要重装
  - OCR 配置：`~/.opencodereview/config.json` provider 已恢复 deepseek（ollama custom_providers 保留备用）
  - 独立审查结论（18 个问题）——wrapper 大改时才逐条处置，1+2 阶段不需要重跑审查

## 开放问题

1. **wrapper 是否实施**（开工先决——第 2-3 场基线数据出来后问）：推断「等数据」；依据：审查员成本账（loop.md 现有处置侧过滤「成本恒为零」，wrapper 必要性未证明）；请用户：用基线数据拍板
2. 审查报告 18 个问题如何处置（P0 矛盾：文档「OCR 期间不加载」vs「并行预热」自相矛盾；误吞无第二次机会——需加防误吞兜底）：推断「wrapper 大改时逐条修」；请用户：确认时机
3. spec 范围（修改 1+2 轻量记录即可，wrapper spec 等数据后）：推断「1+2 不做完整 spec，wrapper 数据后单独 spec」；请用户：确认

## 既定约束（不要重新讨论）

- **不主动 commit / push**（用户全局规则 no-git-write）：1+2 改动留工作区，最终交用户决定提交方式 —— 出处：用户全局规则
- 写 skill 文档必过「读→产出」闭环 + 禁用文件路径指路 + `check.mjs` 0 findings —— 出处：用户全局规则（reference-read-output-loop / skill-authoring-convention）
- 修改 1+2 是已确认要修的已知 bug（方向无争议，审查员确认「方向正确」）——出处：用户 2026-10-12 裁定 + 独立审查
- 27B 裁决模型锁定、不做主审——出处：本会话实测（12/12 vs 主审漏检）
- 校准系统（概率表/对数桶）已决定砍掉——出处：审查员 + 本会话精算结论

## 遗留裁决与留观项

- wrapper 预热用「简单规则 + 本次即时信号」（S1 无代码→不预热 / 中大 diff + P(use|桶) + GPU 空闲→预热），不用复杂校准系统 —— 来源：本会话讨论 + 独立审查；收敛时机：wrapper 决策时
- 锚点格式演进（指纹主键，行号退位）只在 wrapper 实施时动，1+2 阶段 problems.md 用现有模板 —— 收敛时机：wrapper 决策时
- `~/.opencodereview/config.json` 里 custom_providers.ollama.model 现为 qwen3:30b-a3b（备用配置），切回 27B 用 `ocr config set model qwen3.8:27b` —— 收敛时机：下次用 ollama 时

## 开工前先做

1. `git status --short` 确认工作树 clean；读 `d:\Seed\retro-skills\.session\temp\2026-10-12-review-loop-accounting-gap.md` 尾部
2. 读 `skills/review-loop/SKILL.md`「分支前置」第 4-5 步 + `skills/review-loop/references/loop.md` §1「处置前的重复判定过滤」——修改 1/2 的落点
3. 读 `skills/review-log/SKILL.md` + `skills/review-log/assets/review-problems-template.md`——problems.md 骨架来源
4. 跑 `node skills/skill-inspector/scripts/check.mjs` 确认 0 findings（改完后再跑一次）
5. 确认 `~/.opencodereview/config.json` provider=deepseek（用户 codereview 依赖）；`ollama list` 确认 27B 在

## 开场话术

读 `docs/handoffs/2026-10-13-fix-accounting-baseline.md`，按交接词继续：落地 review-loop 账本衔接修复（修改 1+2）并跑基线数据。
