# Trae 适配层（官方 skill-creator 的补充）

> **定位**：官方 skill-creator（Anthropic）管「怎么写 skill 本体」；本文件只补「在我们这套体系里怎么落地」——Trae 差异 + 仓库私有约定。**不重复官方内容**，官方更新直接 pull，本文件只维护不随官方变的差异。
> 目录语义（scripts / references / assets）遵循官方 Agent Skills 标准，见全局规则 `skill-assets-convention.md`，这里不重复。

## 1. 分工（先读这个）

| 场景 | 用谁 |
|---|---|
| 写/改 skill 本体（结构、渐进披露、评测、description） | **官方 skill-creator**（已装：`~\.trae-cn\skills\skill-creator\`） |
| 在我们仓库落地（攒批/评审/进 KB/发布） | evolving-skills 的 `references/protocol.md` + 三张差异卡 |
| Trae 特有（路径、安装） | 本文件 |

## 2. Trae 差异（官方是 Claude Code 的，这些不同）

| 项 | Claude Code（官方默认） | Trae CN（我们） |
|---|---|---|
| 技能运行时目录 | `~/.claude/skills/` | `~\.trae-cn\skills\` |
| 同步/安装 | Claude Code 自带 | **`aas`**（agent-assets-sync） |
| 生效 | 重载 | junction 即时生效（改源即生效） |
| 换编辑器 | — | 改 `aas` 配置，源文件不动 |

- **新技能落点**：写进 `retro-skills\skills\<名>\`（源仓库），`aas sync` 建 junction 到运行时
- **发布纯净**：技能目录只放发布物；教训/题库等个人数据进 KB（`lessons\skills\<名>\`）
- **官方 skill-creator 装的是安装形态**：`aas update skill-creator` 可拉官方更新

## 3. 我们的私有约定（官方没有，写 skill 时叠加）

- 目录语义用官方的：scripts=可执行 / references=按需加载的文档（差异卡、口径）/ assets=输出模板。**不自创判据**
- SKILL.md 只留入口 + 指针，不内联骨架
- 每轮必读的判断规则（硬约束/常见错误）留在 SKILL.md，不外移
- 改我们自己的技能 → 走 evolving-skills 六步协议 + 对应差异卡（失败场景先行→攒批→独立合并→体积守卫→验证）

## 4. 边界（不做什么）

- 不重写官方已有的结构/渐进披露/评测规范
- 不在本文件复制官方 SKILL.md 内容
- 官方更新后差异若有变 → 改本文件对应行，不追着官方文档重写
