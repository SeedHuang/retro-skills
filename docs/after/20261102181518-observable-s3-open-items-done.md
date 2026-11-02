# 可观察判据 S3 · 交付后遗留（已全部落地）

> 状态：**已全部落地（2026-11-02，增量 D-23 / D-24）**｜创建 2026-11-02｜原 5 条未决项逐条处置完毕，本文件只作历史记录，**不再是待办入口**。

## 5 条的最终落点（逐条可追）

| # | 原遗留 | 落地载体 |
|---|---|---|
| 1 | P2-1 `no-fake-problem` 的 `observable` 未钉「结论」列 | spec §3 表 `:60` + `tools/docgen/card-model/vocab/predicates.mjs:40`（D-23）；旧说法登记 `I30`（基线 0） |
| 2 | P2-2 `out-of-scope-self-disposal` 未点名 `git status --porcelain` 路径集 | spec §3 表 `:62` + `predicates.mjs:54`（D-23，只加前缀） |
| 3 | P2-3 `S3_BASE` 的 env 显式覆盖无用例 | `tools/docgen/test/s3-predicates.test.mjs` 的 `S3-TC-B01` 内子进程断言（用例数仍 80） |
| 4 | P2-4 落门行后未 touch 清单只靠自觉 | `skills/dev-workflow/references/stage-4-quality.md` 的「收口后」+ `skills/dev-workflow/references/gate-record.md` 的「各列口径」（硬步骤 + `FAIL: impact-sheet 早于被扫文件` 红判据） |
| 5 | P2-5 spec §5③ 的 `evaluateText` 措辞与已签 testcase 冲突 | spec §1 `:12` / §2 `:22` / §5③ `:117`（D-24）+ 已签 testcase `:33` / `:102` / `:560` 由独立 sdet 同批顺句 |

## 证据

- ④ 复核：`.session/reviews/2026-11-02-101312-observable-s3-spec/quality-4b.md`（80/80 绿；GAP-11 由「6 贴切 / 2 有差」转为 **8/8 贴切**）
- 增量审计：同目录 `audit-increment-d23.md`
- R8 清单：同目录 `impact-sheet.md` §十八（5 条口径逐条处置 + 29 口径）

## 清理规则（保持）

- 本文件**不设 ✅ 档**；若将来 S3 又产生新遗留，另建一份 `open-decisions` 文件并在开头指回本文件。
