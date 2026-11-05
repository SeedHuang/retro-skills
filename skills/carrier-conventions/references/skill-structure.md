# 技能目录骨架（承接原 `skill-authoring-convention` / `skill-assets-convention`）

## 三档判据

| 档 | 放什么 | 判据 |
|---|---|---|
| `SKILL.md` | 入口：这个技能干什么、什么时候用、边界、指向 references 的指针 | 只留指针，不内联模板骨架 |
| `references/` | 按需读的细则、判据全集、正反例 | 正文只通过指针进入；被引用的文件必须真实存在 |
| `assets/` | 被复制 / 被填充的模板、清单、差异卡 | 模板骨架一律放这里，不进 SKILL.md |
| `scripts/` | 可执行判定、生成器、校验器 | 判定实现唯一；同一逻辑不得在两处各写一份 |

## 写 skill 的三条硬约束

1. **跨技能引用只写技能名**（如「走 review-loop」）；禁止写对方内部文件路径（`skills/<名>/references/...` 这类写法会被技能自查段判红，判定见 `npm run check` 的 skill-inspector 段）。
2. **自引用写相对路径全称**（`references/foo.md`），不带技能名前缀。
3. **同一文件只有一种叫法**；路径字符串比较不能用来判「直接运行 vs 被 import」，要 `realpath` 双归一。

## 搬动后必扫引用

移动 / 改名 references 后，跑 `npm run check`，末行 `check 全部通过` 且 exit 0；技能自查段须以 `0 findings` 开头。

## 验证

| 判据 | 怎么判 |
|---|---|
| 骨架不内联 | SKILL.md 里没有整段可复制的模板块（人工核 + 评审席确认） |
| 引用可解析 | 所有 `references/...`、`assets/...` 路径 `Test-Path` 为 True |
| 无跨技能路径 | `npm run check` 里技能自查段输出以 `0 findings` 开头 |
