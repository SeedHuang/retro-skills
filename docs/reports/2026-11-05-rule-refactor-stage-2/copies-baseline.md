# 重复副本基线（V-19）

> 判据出处：`docs/prd/20261105182104-rule-refactor/prd/stage-2-new-mode-pilot.md` §7 V-19 / V-2。
> 登记片段：`tools/quality/observable-terms.json` 的 `sharedPhrases` = `["不因来源豁免"]`（唯一源）。

## 1 改造前基线（逐字归档面 = `docs/bak/rules/`）

取数命令（与 `Select-String -AllMatches` 同口径，逐文件计数）：

```powershell
Get-ChildItem docs\bak\rules\*.md | ForEach-Object {
  $n = ([regex]::Matches((Get-Content $_.FullName -Raw), '不因来源豁免')).Count
  if ($n) { "$($_.Name):$n" }
}
```

实测（2026-11-05）：**9 个文件 / 20 处**

| 文件 | 处数 |
|---|---|
| `core-working-principles.md` | 1 |
| `data-support-triple.md` | 3 |
| `dev-workflow-mainline.md` | 3 |
| `global-ask-before-acting.md` | 3 |
| `how-i-must-reason.md` | 2 |
| `observable-criteria.md` | 1 |
| `skill-authoring-convention.md` | 3 |
| `spec-testcase-gate.md` | 3 |
| `styled-component-file.md` | 1 |

> **与 PRD 数字的差异（必须写明）**：PRD §7 V-19 写「2026-11-05 实测：9 个文件 15 处」。本批以同一命令在**逐字归档面**复算得 **20 处**（文件数一致，仅处数不同）。两值不是同一时点/同一文件集的快照：15 处应为改造前某次取样，20 处为当前归档面的可复算值。**本账以可复算值为基线**（取数命令 + 逐文件表在上），不沿用不可复算的 15。

## 2 改造后（承接面 = `skills/**` + `tools/quality/**`，不含归档）

取数命令：`node scripts/check-criteria-engine.mjs` 的 `SharedPhraseCopy` 检查（逐 `.md` 扫全部 `sharedPhrases`）。

| 判据 | 目标 | 实得 |
|---|---|---|
| 承接面命中 | 0 | **0**（2026-11-05 实跑；此前 3 文件 4 处已按 V-2 改写为「来源不豁免」，共享项 ④ 定义同步改口径并登记台账 2026-11-05 行） |
| 归档面命中 | = 基线（20） | **20**（`docs/bak/rules/` 为逐字归档，V-9 要求与源相等，命中必然存在） |

## 3 说明

- 归档面**不入** V-2 的扫描面，只作反向基线：多一处即红（本批 20 = 基线 20）。
- 承接面的唯一措辞迁移记录在 `tools/execution-matrix/shared-changes/changes.md` 的 `2026-11-05 | 来源覆盖④` 行（改前 / 改后 / 用户确认三件齐）。
