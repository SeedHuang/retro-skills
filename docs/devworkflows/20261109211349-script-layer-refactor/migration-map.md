# 迁移映射：「旧路径 → 新命令」与冻结契约

> 依据：`docs/superpowers/specs/2026-11-09-script-layer-refactor-design.md` §3.7 / R8 / R13。
> 基线快照：`migration-baseline.json`（迁移前对两个 CLI 入口跑同一固定样本所得，sample = 项目根 `.`）。
> 契约三类：**命令**（exit code / code 串 / 首末行）、**路径**（数据根 / 产物路径）、**参数语义**。

| 旧位置 | 新命令 | 冻结契约 | 契约变化 |
|---|---|---|---|
| `skills/skill-inspector/scripts/check.mjs` | `scs check skills --root <项目根> --manifest <清单>` | exit **0 / 1**（旧脚本无 2）；stdout 首末行 `0 findings（加 --json 看明细）`；`--json` 输出 `{ findings }` 逐项不变；无 code 串 | `--dir`（skills 父目录）→ `--root`（项目根，技能目录 = `<root>/skills`）；`--manifest` 取消仓内默认值（R11，须显式传）；旧文件、`check.test.mjs` 与 `listSkillDirsFallback` 兜底副本一并删除 |
| `skills/rule-inspector/scripts/score.mjs` | `scs check rules --root <项目根> --terms <词表> [--file <规则>]` | exit **0 / 1 / 2**（0 通过 / 1 文件或读取错误 / 2 参数错误）；stdout 首末行 `共 N 文件 / N 行 / N 字符，平均得分率 N%（级别）` 逐字不变；`--json` 的 `files[].checks[]` / `groups` / `findings` 字段不变；无 code 串 | `--dir` / `--repo-root` → `--root`（规则库 = `<root>/rules`）；新增**必填** `--terms`（R11：不写死仓内布局）；`--annotations` 取消仓级默认值，改由调用方显式传（目录内 `.inspector-annotations.json` 仍自动发现）；其余 flag 名保留（`--file` / `--rules-dir` / `--json` / `--tri-check` / `--cognitive` / `--baseline` / `--type`）；exit 2 的触发面从「`--file` 与 `--dir` 互斥」改为「缺 `--terms` 等参数错误」 |
| `scripts/skill-dir.mjs` | **不迁**；语义由静态门禁锁单源（`scripts/check-skill-dir-single-source.mjs`） | 纯函数语义不变（输出目录名数组；`ENOENT` 静默跳过、其余错误抛出）；无 CLI，不占迁移基线条目 | 无契约变化；只删除 `check.mjs` 里的兜底副本 |

## 逐项 diff 结论（迁移后复跑同一样本）

| 条目 | exit | stdoutFirst | stdoutLast | codes |
|---|---|---|---|---|
| skill-inspector | 一致（0） | 一致 | 一致 | 一致（空） |
| rule-inspector | 一致（0） | 一致 | 一致 | 一致（空） |

另做 `--json` 全量比对：两个入口的 JSON 结构逐字节一致（仅 `measuredAt` / `dir` 两个时间与路径字段按新入口重算）。
