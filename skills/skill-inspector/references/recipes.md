# skill-inspector 处方：每类命中 → 修法

## ① 跨技能路径引用

**症状**：SKILL.md 写了 `<别的技能名>/references/xxx.md` 或 `<别的技能名>/assets/xxx.md`。

**修法**：改成技能名调用。三步：
1. 引用方写「判据/指引以 `<技能名>` 技能为准」；
2. 确需读对方文件时，Skill 调用该技能，由对方 SKILL.md 指引加载；
3. 删除路径写法，保留技能名。

**例子**：
- 改前：`判据见 rule-inspector/references/criteria.md`
- 改后：`判据以 rule-inspector 技能为准（Skill 调用加载）`

> **AI 判线索（check.mjs 抓不到的形式）**：以下写法也属跨技能文件引用，体检时 AI 人工扫：
> - 拆反引号：`` 按 `evolving-skills` 的 `references/review-flywheel.md` 执行 ``
> - 相对形式但文件在对方目录：`` 调用 `managing-lessons-store` 技能，其 `assets/moments-template.md` 提供结构 ``
> 判据：**凡指向「别的技能目录下的文件」就是跨技能引用，一律改纯技能名**；对方技能自己的文件路径只能由对方 SKILL.md 指引。

## ② 自引用带技能名前缀

**症状**：SKILL.md 写了 `<自己名>/xxx`（如 `retro-collect/assets/x.md`）。

**修法**：去掉技能名前缀，改相对路径。
- 改前：`见 retro-collect/assets/userwords-template.md`
- 改后：`见 assets/userwords-template.md`

## ③ 守卫路径字符串比较

**症状**：scripts 匹配路径字符串比较守卫——含两种操作数顺序（`process.argv[1] === fileURLToPath(import.meta.url)` 或反序 `fileURLToPath(import.meta.url) === process.argv[1]`），以及 `import.meta.url === pathToFileURL(process.argv[1]).href`（或其反序）。

**修法**：换 realpath 归一化（照 score.mjs 已修复样板）：

```js
import { realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
if (process.argv[1]) {
  const self = realpathSync(fileURLToPath(import.meta.url))
  const arg = realpathSync(process.argv[1])
  const same = process.platform === 'win32' ? self.toLowerCase() === arg.toLowerCase() : self === arg
  if (same) cli()
}
```

或 Python `if __name__ == "__main__"`；或独立 CLI 入口文件。

## ④ 目录语义（AI 判）

**症状**：SKILL.md 内联大段模板代码块，或文件放错档（模板进 references、指引进 assets）。

**修法**：按 `skill-assets-convention` 规则：模板 → `assets/`；流程/口径/差异卡 → `references/`；可执行 → `scripts/`。SKILL.md 只留指针。
