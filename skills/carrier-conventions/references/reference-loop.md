# 「读 reference」必须接产出闭环

## 判据

写 skill / rule 时，凡要求读某个 reference，必须写成闭环：

> 按 `<reference 路径>` 的 X 执行，做完核对 / 产出 Y，缺 Y 不合格。

## 正例

```
按 `references/checklist.md` 的 A–F 组逐项执行，做完把勾选结果写进
`.session/rule-checks/checklist-<时间戳>.md`；缺该文件 = 不合格。
```

## 反例（读完没有任何要求）

- 「读一下 `references/checklist.md`」
- 「建议读 `references/criteria.md`」
- 「见 `references/foo.md` §N」

三类都判为不合格：读者读完不知道要做什么、做完不知道交什么。

## 自查（送审前）

1. `Grep -n '读一下|建议读|见 ' <skill 目录>` 命中 = 0；
2. 每个被引用的 reference 路径 `Test-Path` 为 True；
3. 每个引用句都写得出「产出物是什么、缺了怎么判不合格」。
