# @ts-expect-error 只在 TS 实际报错时使用

**绝对禁止**不加验证就添加 `@ts-expect-error`。

如果 TypeScript 不会对某行代码报错（例如 `number` 类型传 `0` 或 `-1` 不会触发类型错误），那么 `@ts-expect-error` 就是多余的 unused directive。

## 检查方式

- 添加后运行 `tsc --noEmit` 或查看 IDE 诊断
- 如果看到 `Unused '@ts-expect-error' directive.`，直接删除该注释
