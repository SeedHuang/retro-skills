# 执行力度模式表（种子 5 行）

> 本表是判据的附属模式库（spec R6）：按场景索引「什么情况下好/不好」的正反例，**唯一载体 = 本文件**，不复制进 `tools/execution-matrix/criteria.md`（两处维护必漂移）。
> 本表也是评级取数登记处（spec §6 裁决②）：每轮实测后补行；「实测记录数 / 最近 N 次零回归」字段供置信度评级取数（N=3，spec §6 裁决④；Task 6 读取本表）。
> 来源可复算（TC-037）：每行来源 = `文件:行号` 形态，目标文件存在（`Test-Path` 可验证）；不写「审计铁律」「据我记忆」类无锚点来源。

| 场景 | 好（什么情况下有效） | 不好（什么情况下失效） | 来源（文件:行号） | 实测记录数 | 最近 N 次零回归 |
|---|---|---|---|---|---|
| 宾语可枚举 | 对象能被数出来时直接匹配不掠过 | 对象是抽象类别需归类时掠过 | `rules/no-git-write.md:14-27`（防掠过节） | 3 | 3 |
| 「只有…才算例外」 | 例外能框死时 | 例外无法枚举时硬框误伤 | `skills/rule-inspector/references/criteria.md:57`（§2.4 ⑥） | 2 | 2 |
| 触发信号可观测 | 有明确时机词时 | 触发需语义归类时 | `skills/rule-inspector/references/criteria.md:58`（§2.4 ⑦） | 3 | 3 |
| 认知动作带去处 | 动作有自然产物时 | 产物是会话载体时应标 x2Carrier | `skills/rule-inspector/references/criteria.md:155-156`（§3.3b X1/X2） | 2 | 2 |
| 证据栏空=不通过 | 机械可查项 | 语义判断项须 AI 判+判据化 | `docs/superpowers/specs/2026-10-20-execution-assurance-matrix-design.md:52`（R3） | 1 | 1 |
