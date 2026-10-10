# Vitest 在受限环境 stuck 时改用替代验证

在部分沙箱或受限环境中，Vitest 的 worker pool（forks/threads）可能无法启动，测试会无限 stuck 在 `[queued]` 状态。

## 替代验证方案

当测试环境不可用时，不要反复重试，改用以下方式验证代码正确性：

1. **GetDiagnostics** — 对改动的文件调用 IDE 诊断，确认零错误
2. **`tsc --noEmit`** — 运行 TypeScript 编译检查（如果项目支持）
3. **检查最终产物的文件结构** — 确认 import/export 路径正确

## 注意

测试文件本身仍然应该保留（在 CI 或本地环境可正常执行），只是在受限环境中跳过运行验证。
