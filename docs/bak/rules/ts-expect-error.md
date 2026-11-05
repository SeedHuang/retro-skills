> 状态：**已归档**｜日期：2026-11-05（阶段 1 退役）｜归档原因：删除——工具链专属（TypeScript 指令校验）｜承接位置：无（删除）
# @ts-expect-error 只在 TS 实际报错时使用

**绝对禁止**不加验证就添加 `@ts-expect-error`。

如果 TypeScript 不会对某行代码报错（例如 `number` 类型传 `0` 或 `-1` 不会触发类型错误），那么 `@ts-expect-error` 就是多余的 unused directive。

## 检查方式

- 添加后运行 `tsc --noEmit` 或查看 IDE 诊断
- 如果看到 `Unused '@ts-expect-error' directive.`，直接删除该注释
## 承接对照表

| 原节 | 去向 | 承接文件 |
|---|---|---|
| `## 检查方式` | 删除 | 无（删除） |
