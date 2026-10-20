# tools/execution-matrix/ —— 执行力度矩阵体系

## 目录职责
- `criteria.md`：agent 专属可执行性判据正文单源（A 结构 5 + A 语义 2 + B 4 + C 4 = 15 项）
- `buckets.mjs`：归桶索引数据（每项单独列举，便于机械查「同一项两处」）
- `check-buckets.mjs`：归桶守卫（桶名枚举 / 跨桶重复 / 桶归属 / 无遗漏 / 共享项正文复制 + 引用指针）
- `shared-items.mjs`：共享项（④⑤⑥⑦⑧）判定定义行解析（权威载体 = `rule-inspector` 判据集 §2.4）
- `check-agent.mjs`：A 结构项（A3-A7）机器检查 + 十键（A1/A2 + B×4 + C×4）annotations 三态接收
- `pattern-table.md`：执行力度模式表（正反例种子 + 实测记录登记处）
- `check-pattern-table.mjs`：模式表守卫（种子数 ≥5 / 来源可复算 / 判据正文不含模式表行内容）
- `rating.mjs`：置信度评级现算（N=3，不持久化）
- `rate.mjs`：评级取数 CLI（读 `pattern-table.md` → 算档位）
- `shared-changes/changes.md`：共享项变更台账（R7 硬闸门载体）
- `shared-changes/check-shared-changes.mjs`：R7 硬闸门机械判定（三件套齐全 + 登记与落地一致）

## 边界声明（R2/R3）
- A/B/C 组判据**只查卡文本**（渲染后的 `agents/*.md`），**不查运行时产出**。运行时验证归属：议会评审产出 → parliament（侦探行为核对 + 审计证据核对）；改动验证 → review-loop（复查轮独立重审）。判据越界查运行时 = 与既有体系重复。
- 「谁验证」职责分离：运行时产出的证据由独立方复核，不交给产出的 AI 自评（防自证偏差）；证据必须可重跑（复核 = 真重跑命令/读文件）；「我检查过了」类描述不算证据。
- 评级只决定验收强度：高 → 简化验收；中 → 标准验收；低（新模式/新场景）→ 必须完整验收，不可豁免；高风险（不可逆操作/跨体系改动/用户要求全验）永不免验。

## 落地说明
- 触发机制⑦：暂留 skillAndRuleShared（当前归属），不升格 allShared——agent `when` 是 frontmatter 数据字段，rule/skill 触发时机是正文语义段，不同构（TC-046 语义同构核对）；升格条件满足时按 R7 硬闸门走「改前 vs 改后 + 用户确认」。
- 评级 N 阈值 = 3（spec §6 裁决④）。
- 共享项变更硬闸门（R7）：共享项（④⑤⑥⑦⑧）变更必须「改前 vs 改后两版留齐 + 用户确认」后才落地；登记台账在 `shared-changes/changes.md`，守卫脚本见 `shared-changes/check-shared-changes.mjs`。

## 使用说明
- 全仓检查：`npm run check`（scripts/check-all.mjs 的 ②.6 段已挂钩归桶守卫 + reviewer-audit A 组检查 + 共享项变更硬闸门 + 模式表守卫）
- 归桶守卫：`node --test tools/execution-matrix/check-buckets.test.mjs`
- A 组检查：`node --test tools/execution-matrix/check-agent.test.mjs`
- 模式表守卫：`node --test tools/execution-matrix/check-pattern-table.test.mjs`
- 共享项硬闸门：`node --test tools/execution-matrix/check-shared-changes.test.mjs`
- 评级（纯函数）：`node --test tools/execution-matrix/rating.test.mjs`
- **评级取数（TC-035：命令在载体中显式写出）**：
  - 单场景：`node tools/execution-matrix/rate.mjs "宾语可枚举"` → 输出 `宾语可枚举 → high（records=3, zero=3）`
  - 全部场景：`node tools/execution-matrix/rate.mjs` → 逐行列出
  - 取数源唯一 = `pattern-table.md` 的「实测记录数 / 最近 N 次零回归」两列；**记录数增长 → 档位自动更新（不持久化）**，评级结果每次现算，不落盘。
