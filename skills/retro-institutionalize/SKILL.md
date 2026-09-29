---
name: retro-institutionalize
description: Use when 复盘结论已定，需要把教训写回能自动生效的规范（全局规则 / 项目规则 / 自动化 / 技能 / 记忆）；或用户说「把这套经验沉淀下去」「以后别犯这个错了」时。Do not use for 分析出结论（走 retro-analyze）。
---

# 归置落地（retro-institutionalize）

## 前置

输入是一份**复盘文件**路径。复盘文件不存在 → 拒绝，建议先跑 `retro-analyze`。
**KB 未初始化时**（`lessons resolve` 报「未找到错题集指针」）→ 拒绝写入，并 **REQUIRED SUB-SKILL:** 用 `managing-lessons-store` 完成 bootstrap（其第一步须由用户指定 KB 位置，**禁止默认落 C 盘**）。

## 写库前置检查（必做）

写 KB 前先查 `<KB>/.migrating`：**存在 → 拒绝写入**，报告「错题集正在迁移中，请等迁移结束后重试」；不存在 → 继续。

## 归置决策树（核心契约）

```
Step 0  它的「修复方案」是什么？答不出 → 复盘未完成，回炉（禁止往下走）

Step 1  既有承载里有相似的吗？
        （查五处：user_rules/ + <项目>/.trae/rules/ + memory/*.md + 错题集 KB（三区 projects/skills/universal 同表）+ 既有 skills）
        ┌ 有 → 【升级，不新增】为什么既有没拦住？
        │        a. 触发面未覆盖（新场景） → 扩既有触发面（globs/description/作用域）
        │           ⇒ 既有是 rule / skill / 自动化 → REQUIRED SUB-SKILL: evolving-skills（读对应卡；memory 就地改）
        │        b. 既有约束本身有问题     → 修既有（太宽/太窄/判据错）
        │           ⇒ 同上转发（memory 就地改）
        │        c. 载体选错了             → 换载体（goto Step 2）
        └ 无 ↓

Step 2  能否机械判定？（正则 / 脚本 / 测试 / CI 可验，且有执行点）
        能 → 【自动化】写进测试 / lint / 校验脚本 —— 不写成文档
        否 ↓

Step 3  是多步过程 / 技法吗？（有步骤、判断点、反例集）
        是 → 【skill】⇒ REQUIRED SUB-SKILL: evolving-skills（新建/重写按 card-skill.md；教训先入 ledger）
        否 ↓

Step 4  能想象出「违反」的具体形态吗？（可证伪）
        能（约束）     → 【rule】
        不能（事实/偏好） → 【memory】

Step 5  归属（rule 与 memory 通用）
        完全可抽象为通用       → 全局
        有通用内核 + 项目外壳  → 【拆两条】内核→全局，外壳→项目
        完全绑项目             → 项目
```

**Step 1 是强制前置**：默认动作是**升级既有**，新增是必须举证的例外。

**Step 2 的性能闸门**：新增自动化前必须回答「跑在哪个执行点？单次成本多少？」——答不出则不许加。实施细则见 evolving-skills `card-automation.md`。

**逐条落步**：每一条教训都要在复盘的「归置结果」表里记下它走了 Step 几、落到哪个载体与路径。

## 四载体落点

| 载体 | 落点（Windows） | 加载方式 |
|---|---|---|
| 自动化 | 项目内（tests/、校验脚本） | 执行时强制 |
| rule（全局） | `%userprofile%\.trae-cn\user_rules\rule-<epoch>.md` | 全量注入（**无 frontmatter**） |
| rule（项目） | `<项目>/.trae/rules/*.md` | 注入（可条件：`alwaysApply` / `globs` / `description`） |
| skill | 本套件 `skills/<名>/` | 按需加载 |
| memory（全局 / 项目） | `%userprofile%\.trae-cn\memory\user_profile.md` / `…\projects\{project_path}\project_memory.md` | 注入 |

**易错**：`alwaysApply` / `globs` / `description` **只属于项目规则**；全局规则是纯 markdown，**写了无效**。

## 写入顺序（崩溃安全）

```
① 先在 ledger 确保该条目的存在且为 open（含拟载体与拟落点；rule/memory/automation 教训落 `projects\<项目>\` 或 `universal\`，技能教训由 evolving-skills 落 `skills\<技能名>\`）
② 再落规则 / 自动化 / skill 改动
③ 成功后把条目状态改为 landed(→载体)（转发项由 evolving-skills 置，本技能只校验）
```

① 永不后于 ② —— 否则中断会留下「规则已落但无记录」，重跑必然重复落规则。

## 修订既有 rule：走 evolving-skills

修订的实施（失败场景先行 / 备份到 rules-history / 一行式确认）按 `evolving-skills` 的 `card-rule.md` 执行；本技能只负责分诊与 ledger 先行。

## provenance（每条规则强制）

```markdown
# <规则标题：一句祈使句>

> 来源：<KB 条目 ID>｜证据：<原始证据指向>｜落地：YYYY-MM-DD

<正文：规则 + 反例>
```

- 来源**一律用 KB 条目 ID**（不用文件路径——迁移后会失效）
- 规则必须是**可证伪的祈使句**（能想象出违反的具体形态）

## 真冲突判定

两条规则算真冲突 ⇔ ① 作用域重叠 **且** ② 对同一动作给出不相容指令。
否则不算：作用域不相交 → 各自生效；一条被另一条包含 → 更具体者生效。
**真冲突的自动消解本期不做**——停手报给用户，并记入复盘的「附录：规则裁决」。

## 结束时的固定动作

落置完成后：① 在复盘文件的「归置结果」表补落点；② **转发项：确认 evolving-skills 已把 ledger 置 landed(→载体)**；③ 提示用户「**Trae 规则/技能改动建议开新对话才完全生效**」；④ 输出一行「本环节完成——教训已落回规范」。

## 常见错误

| 错误 | 纠正 |
|---|---|
| 项目专属规则写进全局 | 过 Step 5；含项目专有标识（文件/模块/导出名）→ 项目级 |
| 不查重直接新增 | Step 1 必须先查五处 |
| 覆盖旧规则不备份 | 按 evolving-skills `card-rule.md` 备份后修订 |
| 全局规则写了 `alwaysApply` | 全局规则无 frontmatter，写了无效 |
| 先落规则后写条目 | 顺序反了；①必须是条目 |
| 忘了提醒「开新对话生效」 | 收尾必须提示 |
| 跳过决策树、凭直觉选载体 | 必须逐条走 Step 0→5，并在「归置结果」表记下走了哪几步 |
| 写库前不查迁移锁 | 先查 `<KB>/.migrating`，存在即拒绝 |
| 规则正文没有 provenance | 每条规则必须有 `> 来源：<KB 条目 ID>｜证据：…｜落地：…` 行；来源**只能用 KB 条目 ID**（用文件路径会在迁移后失效），证据栏必填 |
| 把复盘产物或规则落在项目仓库里 | 复盘产物落 `<KB>/projects/<项目标识>/`、规则落 `user_rules/` 或 `<项目>/.trae/rules/`——KB 在仓库外；落进仓库等于把个人数据提交出去 |
