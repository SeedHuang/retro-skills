# 项目类型注册与规则派生（review-loop 规则对症）

> 目标：让 OCR 的审查规则对症下药（L3）。OCR 按文件扩展名分配规则，会把 React 检查项塞进 Node CLI 项目 → 模型被清单逼着凑 low 评论。本卡定义：怎么建全局类型注册表、首次 review 怎么选类型、怎么派生项目 rule.json。
> 依据：spec `docs/superpowers/specs/2026-10-10-review-loop-l3-project-type-design.md`（v2.1；本卡是它的落地形态）

## 适用性

只对「OCR 能审到代码」的项目生效（有 `.js/.ts/.py/.go/...` 代码文件）。**纯 Markdown 仓库**（md 不在 OCR 白名单，实测 `unsupported_ext`）走 md 模式（调用 `multi-lens-review` 技能），不生成 `.opencodereview/`。

## 两个层（缺一不可）

| 层 | 文件 | 进 git |
|---|---|---|
| **全局注册表** | `~/.retro-skills/reviewconfig/activeProjectTypes.config.json` | **否**（个人机器配置） |
| **项目派生** | 项目内 `.opencodereview/rule.json` | **是**（OCR 硬编码读它） |

- **为什么项目层必须有**：OCR 把 rule.json 读取路径**硬编码**在 `.opencodereview/rule.json`（实测 `ocr rules check` 输出 `Source: Project (.opencodereview/rule.json)`）——每个项目必须派生一份，OCR 才吃得到
- **项目内类型指针**：`.reviewconfig/project-type` 记一行类型名——下次 review 读它复用，不用重新问。**不用 rule.json 注释字段**（OCR 会读 rule.json，注释可能污染 prompt）
- **真相源 = 全局注册表 + 项目内一行指针**。项目内没有第二份类型声明

## 三层预设

| 层 | 放哪 | 谁有 |
|---|---|---|
| **languagePresets**（语言级） | review-init.mjs 常量 | 人人有（Python/Go/Java/C#/Rust…，带 path） |
| **ecosystemPresets**（生态级） | review-init.mjs 常量 | 人人有（JS + H5 家族） |
| **activeProjectTypes**（个人累积） | 全局注册表 | 各人自己的 |

- **rule 配置只跟「语言 + 端」有关，不跟具体框架**——Python FastAPI 和 Python 大模型 rule 几乎一样（path 按语言 + 忽略前端检查），不用给每个框架建类型
- **别人用技能遇到 Python/Go 项目**：languagePresets 兜底，不用提 issue 改预设

## 初始化（review-init.mjs）

跑 `node scripts/review-init.mjs`（本技能 scripts 下，实现版 v1，幂等）：

1. 确保 `~/.retro-skills/reviewconfig/` 存在
2. 确保 `activeProjectTypes.config.json` 存在（不存在写种子：node-cli / electron / react / cli / electron-monorepo / react-node-monorepo，均带 path + ignore；**不覆盖已有**；种子经临时文件 + 原子改名落盘，中断不留半截文件）
3. 注册表**读失败 / JSON 解析失败 / 结构非法**（`activeProjectTypes` 缺失或非数组）→ **报错停止，不自动覆盖**（防丢用户数据），提示人工处理——读失败与解析失败分报，别把系统错误误说成「JSON 坏」
4. 输出候选集 JSON = languagePresets ∪ ecosystemPresets ∪ activeProjectTypes（给 agent 匹配用；**按名字去重**——electron 同时在 ecosystem 与种子注册表，不去重会破坏「唯一命中直接落地」）

## 选择流程（首次 review / 重设类型）

**分支前置阶段，项目无类型指针 → 走选择流程。类型随时可重设。**

```
用户描述项目类型（自然语言，例：「这是个 H5 前端项目」）
  ↓
agent 匹配：从 候选集（review-init 输出）里找
  ├─ 唯一命中 → 直接落地（不二次确认）
  ├─ 多候选 → 列出来给用户选（例：纯静态 H5 / React H5 / Vue H5 / 小程序 H5 / Angular H5）
  └─ 无候选 → 新建类型条目 + 问用户这种类型要忽略什么检查
  ↓
落地（三步一起）：
  ① 写 activeProjectTypes.config.json（没有的类型加进去；已有的跳过）
  ② 派生项目 .opencodereview/rule.json（按该类型 rule 配置）
  ③ 写项目类型指针 .reviewconfig/project-type（一行类型名）
```

**只问一次**：问完**立即落盘**（注册表 + 派生 + 指针），中途关窗口下次也不重复问。

## 派生 rule.json 的形态

```json
{
  "rules": [
    {
      "path": "<该类型的 path，如 **/*.{js,mjs,cjs,ts,tsx,jsx}>",
      "rule": "<ignore 声明；派生自 activeProjectTypes.config.json 的 <类型名> 条目，不要直接改本文件>",
      "merge_system_rule": true
    }
  ]
}
```

- **叠加语义（`merge_system_rule: true`）**：系统规则全保留 + 我们的忽略声明追加在后——模型读声明跳过 React 项；万一判断错，系统规则兜底还在。**已实测通过**（2026-10-11，aas 20 文件 8 评论 React 类=0）
- **覆盖手写 rule.json 必须先问**：覆盖前看文件是否存在且非本流程生成（无「派生自…」互指注释）→ 报告「保留还是替换？」走确认，**不静默覆盖**
- **验证**：`ocr rules check <文件>` 应显示 `Source: Project (.opencodereview/rule.json)` 且输出含 `## User-Specific Rules` 段

## 若叠加实测无效（B 计划，备用）

| 顺序 | 手段 |
|---|---|
| B1 | 改措辞：「忽略前端检查」→「本项目无 React 代码，**禁止**报 React 类问题」 |
| B2 | 换 `merge_system_rule: false` 完全替换（系统规则有用项一起丢） |
| B3 | 替换时手写精简版系统规则（死代码/空值/原型污染/错误处理） |
| B4 | 退回 A2 处置侧过滤（低价值评论按「不改」吞掉） |

## 与本技能其它卡的关系

- 选择流程只在**分支前置做一次**（启动 review 时）——`loop.md` §1 开场动作**不做**任何类型探测（spec v2 明确不做，见 spec §八 改动 3）
- **混合项目**（前后端同仓）不忽略前端（React 检查抓真问题），后端被 React 项骚扰的噪音交给 A2 处置侧过滤（见 `loop.md` §1 修复纪律，判据按性质：影响行为的改、纯样式/优化的不改）
