# V-11 改后复测证据（S2 卡面重构）

> 用途：`docs/reports/2026-11-01-s2-card-comprehension-baseline.md` §7「改后复测」的可复核证据。这些文件原先落在 `.session/reviews/2026-11-01-2200-s2-d17-increment/`（不进 git，换机器即失），④ 段审计判「报告引用了不可复核的证据」→ 收口前迁到本目录（进 git）。

## 文件

| 文件 | 是什么 |
|---|---|
| `v11-scoring-table.md` | **冻结计分表**（34 项 / 5 题），改前改后同一份；出题实例未参与 S2 卡面写作 |
| `v11-answers-reviewer-qa.md` | 改后答卷（`reviewer-qa`；答题实例只给该席卡面） |
| `v11-answers-reviewer-audit.md` | 改后答卷（`reviewer-audit`） |
| `v11-answers-detective-observer.md` | 改后答卷（`detective-observer`） |
| `v11-grading-after.md` | 改后判分留档：每席 2 个独立判分实例逐项 0/1、取交集；`reviewer-audit` 分歧 5 项由第三实例裁定 |
| `rejudge-reviewer-audit-B3.md` | `B3`（职责边界一致）重判记录（判者 `reviewer-ai-2026-11-02-s2-b3`） |
| `rejudge-detective-observer-B3.md` | 同上（detective 席） |

## 结论落点

三席 `L_before → L_after`：`reviewer-qa` 12→1、`reviewer-audit` 15→4、`detective-observer` 16→4；判据 `L_after ≤ ⌊L_before/2⌋` 且净减 ≥1，三席全部达成。读法与未达成项写在报告 §7。

## 与过程账的关系

`.session/reviews/2026-11-01-2200-s2-d17-increment/` 仍有原件（过程账：`audit.md` / `impact-sheet.md` / `progress.md`），`gate-record.md` 的 ③ 行引用的是那份原件路径。**本目录进 git（收口 commit 后即为 tracked 副本），交付与复核以它为准**。
