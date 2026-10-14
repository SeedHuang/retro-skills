# review-loop 进化设计：验证闸门 + 工程检测前置 + 评论整体设计 + package.json 固化

> 状态：需求已认可，设计待细化（用户 2026-10-14 拍板建 spec）｜路径：Architectural｜来源：2026-10-14 review-all-to-death 实测暴露的 3 个流程缺口 + 用户三轮讨论收敛

## 1. 背景与问题

review-loop 执行 OCR review 后的修复阶段，实测（2026-10-14 execution-assurance all 模式）暴露三个流程缺口：

### 缺口 1：评论被孤立修复，无整体设计
OCR 评论到手后，当前流程直接逐条修（先过滤不改的，剩下逐条处置），**没有把「本轮要修的评论」当一个整体做影响分析**。后果：A 改函数签名、B 改调用点、C 改返回类型这类有前后依赖的评论，孤立修会产生中间态损坏。

实测证据（本次）：OCR 3 条要修的评论（测试覆盖 / JSDoc / 布尔化）恰好是同一契约链——⑤ 布尔化是契约定义者、③ 测试是消费者、④ JSDoc 是记录者。本次碰巧自洽，但那是运气不是机制。

### 缺口 2：进下一轮前缺验证闸门
loop.md 现状：A3 只要求「修复后真实场景实测」、§1 收尾表只要求「整个审查最终完成时跑全量测试」、§3 硬约束只规定「每轮收尾 = commit」。**没有一条强制「修复后、commit 前、进下一轮前，必须先跑语法+测试，全绿才锁基线」**。本次靠自觉跑了（`node --test` 50/50 + `check.mjs` 0 findings），不是流程保证。

### 缺口 3：机械问题不该走 OCR，费 token
OCR 是 LLM 审查，审语法/lint/测试这类**可机械判定的问题**是浪费 token（本次 OCR 4m39s、~74 万 token，其中不少是机械问题）。eslint / tsc / csslint / `node --check` / `node --test` 这类工程检测应在 OCR 之前就执行，遇到问题直接修，不进入 OCR 范围。

### 缺口 4：检查命令散落，无固化入口
本仓所有检查是手工命令（`node --check` + `node --test` + `check.mjs`），没有统一入口，每次 review 都要现拼命令，且**违背**工程化原则（core-working-principles「选载体前先搜已有工具，有轮子就复用，不造轮子」）。

## 2. 目标与非目标

**目标**：
1. 修复前强制「评论关联分析」——把本轮要修的评论当一个整体，先设计再动手。
2. 每轮收尾前强制「验证闸门」——语法+测试全绿才锁基线、才进下一轮。
3. OCR 前置「工程检测」——机械问题用工程工具先修掉，不喂 OCR。
4. 建 `package.json` 固化检查入口——`npm run check` 一条命令覆盖语法+测试+守卫，以后不用改。

**非目标**：
- 不承诺消灭 OCR——OCR 仍负责「逻辑/语义/跨文件一致性」这类工程工具查不出的问题。
- 不为「评论关联分析」建完整 plan + md-review 流程（对解法已被 OCR 判明的单行修复是形式主义）；只对「有未判明设计决策」的评论升级成 plan。

## 3. 方案设计（四条，落 review-loop 技能）

### 3.1 修复前评论关联分析（新增 A4 修复纪律）

**触发**：OCR 评论过滤完、确定「要修的清单」之后、动手修之前。

**动作**：先输出「评论关联分析」块（写进 progress.md 本轮小节）：
| 维度 | 查什么 |
|---|---|
| 同文件/相邻代码 | 哪些评论改同一文件、相邻区域 → **合并修** |
| 先后依赖 | 有没有 A 改签名 → B 改调用点的链 → **先契约后消费**（排序修） |
| 契约影响 | 哪些评论动函数签名 / 返回 / CLI 参数 / 共享常量 → **列调用方数 + 影响面** |
| 预期返回 | 修完后这个函数/CLI 的预期返回变不变 → **写清** |

**分级**：
- 解法被 OCR 判明（带建议/diff）+ 单文件 → 关联分析写一行，直接修
- 解法未判明 + 有设计决策（签名/契约变更）→ 写修复 plan（关联表 + 解法 + 调用方影响面），对 plan 做 md-review
- 解法未判明 + 跨文件 + 高影响 → 写 plan + 明确预期返回/调用方清单，plan 做 md-review + 修复后真实场景实测

**验收**：动手修前 progress.md 里有「评论关联分析」块；同文件评论已合并；契约链已排序。

### 3.2 每轮收尾验证闸门（新增收尾步骤）

**位置**：修复完成后 → commit 锁基线前 → 进下一轮前。

**动作**：跑 `npm run check`（见 3.4），**全绿才 commit、才进下一轮**；有红 → 修复 → 重跑 → 直到全绿。

**与 OCR 的关系**：验证闸门抓「修坏了」（测试红/语法错）；抓不到「测试绿但逻辑错」——后者仍由复查轮 OCR 负责。两者互补不替代。

**记录**：验证发现的问题（无论修没修）记进 progress.md 对应轮小节，带命令 + 结果。

### 3.3 OCR 前置工程检测（新增执行顺序步骤）

**位置**：review-loop 执行顺序，OCR 之前。

**动作**：先跑 `npm run check`，机械问题（语法/测试/守卫）直接修掉并锁基线，**不进入 OCR 范围**；OCR 只审工程工具查不出的逻辑/语义问题。

**判据**：`npm run check` 红了 → 先修 → 全绿 → 才跑 OCR。这一步把「可机械判定的问题」从 OCR 的 token 账单里剥离。

### 3.4 package.json 固化检查入口

**在 retro-skills 根目录建 `package.json`**，`scripts.check` 聚合本仓全部检查（最终形态 = 调根 `scripts/check-all.mjs`，由它依次跑语法遍历 → 测试 → 技能守卫，见实现 plan Task 1）：

```json
{
  "name": "retro-skills",
  "private": true,
  "scripts": {
    "check": "node scripts/check-all.mjs"
  }
}
```

**注意**：`node --test` 只编译测试文件及其 import 的模块，**未被引用的脚本（如 `open-view.mjs`）语法错误会漏网**——故 `check-all.mjs` 必须先用 `node --check` 遍历全部非测试 .mjs 做显式语法检查（实测全仓 7 个仅 209ms，成本可忽略），再跑测试，再跑技能守卫。**本仓无 tsconfig/eslint 配置**（纯 Node .mjs，2026-10-08 handoff 确认「无 typecheck/build/e2e」）；将来若引入 tsc/eslint，在 `check-all.mjs`（或 scripts.check）里追加即可，**调用方（review-loop）不用改**——这是「固化入口」的核心收益。

**package.json 两个层级（裁决，勿混）**：
| 层级 | 管什么 | 装在哪 | 本仓现状 |
|---|---|---|---|
| **skill 级 package.json** | 该技能自己运行/测试时**需要什么**（第三方库、模块类型声明） | 技能目录内（如 `skills/xxx/`） | 仅 `skills/use-rule-skills/scripts/package.json` = `{"type":"module"}`（ESM 声明，非依赖清单） |
| **项目根 package.json** | 整个仓库的**工程基建**（check/lint/build 命令、devDependencies） | 仓库根 | 本 spec 新建（仅 scripts.check，零依赖） |

本 spec 建的是**项目根**层级，不影响任何 skill 级 package.json；两层级不冲突。`skilldependencies/`（manifest + 每技能 json）是**技能依赖关系数据**（aas 依赖管理器用），不属于 npm package.json 体系，三者各管一事。

**Agent-Skill 项目类型不细分（裁决）**：Agent-Skill 项目是「零依赖构建的 monorepo 结构」——工程配置在根、技能是独立单元，但子单元不各自管理依赖、无构建/版本锁定。目前 17 个技能全部同构（Node 脚本 + Markdown，无前端、无构建），review-init 的「Agent Skill 项目」单类型（path = `**/*.{js,mjs,cjs,ts,tsx,jsx}`，ignore = 无前端）即可覆盖全部，**暂不细分**。细分触发信号：出现异构技能（Python 脚本 / 纯文档无脚本 / TS 前端）时再按「Agent Skill 项目 / 纯文档 / TS」拆分类型、派生不同检查规则。

**推翻的历史约束**：2026-09-27 retro-suite plan 的 Global Constraint 1「避免为测试引入 package.json 与依赖」——本次引入是「为了固化检查入口」而非「为测试引依赖」，且**零外部依赖**（只用 Node 内置的 node/npx），不违背「无依赖」的本意，但需在 spec 中显式记录这次推翻及理由。

## 4. 影响面

| 文件 | 改动 |
|---|---|
| `package.json`（新建） | scripts.check 聚合语法+测试+守卫 |
| `skills/review-loop/SKILL.md` | 执行顺序加「OCR 前置工程检测」步骤 |
| `skills/review-loop/references/loop.md` | 修复纪律加 A4（评论关联分析）；收尾加「验证闸门」步骤 |
| `skills/review-log/SKILL.md` | 必填表加「评论关联分析」行；`assets/review-progress-template.md` 加「评论关联分析」小节（A4 产物骨架） |

## 5. 待决项（2026-10-14 全部裁决完毕，移入正文 §3）

1. **A4 落点** → 已裁决：纪律定义在 loop.md A4，产物骨架在 review-log progress.md「本轮改了什么」之前。→ §3.1。
2. **`npm run check` 是否要覆盖 `node --check` 显式语法检查** → 已裁决：**要**。实测 `node --test` 只编译测试文件及其 import 的模块，`open-view.mjs` 等未被引用的脚本语法错误会漏网；`node --check` 全仓遍历 7 个仅 209ms，成本可忽略。→ §3.4。
3. **验证闸门 vs 复查轮 OCR 的边界** → 已裁决：闸门抓「修坏了」（测试红/语法错），复查轮抓「逻辑错」（测试绿但行为错）；在 loop.md §1「整体停机」判据处显式补「进下一轮前验证闸门必须全绿」。→ §3.2 + §3.3。
4. **package.json 两个层级** → 已裁决：skill 级（技能目录内，管该技能需要什么）与项目根级（仓库根，管工程基建）是两回事，本 spec 建项目根级，不冲突。→ §3.4。
5. **Agent-Skill 项目类型是否细分** → 已裁决：暂不细分（17 技能同构，单类型够用）；细分触发信号 = 出现异构技能。→ §3.4。

## 6. 验证方式

1. `npm run check` 一条命令全绿（等价于现手工命令的结果）。
2. 下轮 review 实测：OCR 前置工程检测后，OCR 审的 token/时间下降（取数：OCR session 的 token 用量对比）。
3. 评论关联分析块在 progress.md 出现且影响修复顺序（人工检查）。
4. 验证闸门拦截场景实测：故意引入一个测试红 → 确认被拦在 commit 前。

## 7. 与现有机制的关系

- **工程化优先**（core-working-principles）：能工程化的优先工程化——本 spec 正是把「机械问题检测」从 AI 层（OCR）剥离到工程层（npm run check）。
- **判据单源**：检查命令只在 package.json 一处定义，review-loop 只调 `npm run check`，不重复命令文本。
- **不因来源豁免**：OCR 前置检测对子代理/脚本同样生效（它们也先跑 npm run check）。
- **与 type-rules 的关系**：「Agent Skill 项目」是 review-init 的 ecosystemPresets 之一（2026-10-11 spec），本 spec 为其补上「检查基建」——与项目类型设计不冲突，反而是该类型的配套工程化。
