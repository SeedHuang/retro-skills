# 写 skill 禁止用文件路径指路，脚本守卫必须免疫路径

> 来源：实测/踩坑（2026-10-09）｜证据：跨技能路径引用 4 处残留（retro-collect ×2、multi-lens-review ×2）；Node 守卫路径字符串比较在 Junction 下静默退出｜落地：2026-10-09

## 核心判据

写 skill（新建或修订）时，**禁止用文件路径做跨技能引用**，**禁止用路径字符串比较判断脚本是否直接运行**。两条硬判据，缺一即不合格。

### 判据 ①：跨技能引用用技能名，禁止写对方技能内部文件路径

跨技能引用一律用**技能名**（「调用 `rule-inspector` 技能」「判据以 rule-inspector 技能为准」），禁止写对方技能的内部文件路径（`rule-inspector/references/criteria.md` 这类）。

- 正例：「判据：调用 `rule-inspector` 技能」
- 反例：「判据：`rule-inspector/references/criteria.md`」（诱导 agent 去文件系统找路径，用错 Junction/运行时/源仓库）

### 判据 ②：本技能内自引用用相对路径

本技能自己的 `references/` `scripts/` `assets/` 文件用相对路径（`references/x.md`），禁止带自己技能名前缀（`retro-collect/assets/...`）。

### 判据 ③：脚本「直接运行 vs 被 import」判断禁止路径字符串比较

判断脚本是否直接运行，禁止 `process.argv[1] === fileURLToPath(import.meta.url)` 或 `import.meta.url === pathToFileURL(process.argv[1]).href`——Junction/symlink 下路径字符串必不等 → 静默退出（exit 0 无输出）。

- 正例：`realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))`（Windows 再归一大小写）；Python 用 `if __name__ == "__main__"`；或独立 CLI 入口文件
- 反例：`if (process.argv[1] === fileURLToPath(import.meta.url)) cli()`

### 判据 ④：目录语义遵循 skill-assets-convention

目录语义（scripts/references/assets 三档）按 `skill-assets-convention` 规则执行，本规则不复制其内容。

## 适用范围（不因来源豁免）

以上判据**不因来源豁免**——写 skill 的 agent、子代理、脚本生成、模板产出，都不豁免。任何来源的 skill 产出都要过 check.mjs。

## 冲突裁决

与其他指令 / 模板 / 计划冲突时，以本规则为准；拿不准先停下说明，等用户确认。

## 例外

只有「读已存在的 skill 文件做检查 / 审查」才算例外——检查动作本身不写 skill，不受判据 ①② 约束。

## 触发时机

在写 skill 时（新建或修订 SKILL.md / scripts / references / assets）；在体检 skills/ 目录时。

## 验证

每次编辑后、写完（或改完）skill 后，跑 `check.mjs`，0 findings 才算完成；有 findings 先修再交付。
