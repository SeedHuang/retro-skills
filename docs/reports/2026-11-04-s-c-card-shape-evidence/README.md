# S-C 卡面形状：④ / ⑤ 段与议会证据账（迁入 git 的存档）

> 迁入时间：2026-11-04（S-D T3）｜来源 = `⑤@S-C` 门行结论列残余第 4 条的指派（「触发：换机 / 下一批开工；谁兜 = 收口或下一批开工时整目录迁 `docs/reports/<主题>-evidence/`」）
> 为什么迁：`.session/` 在 `.gitignore` 内，换机器 / 重新克隆即全失；结论虽已进 `skills/dev-workflow/references/gate-record.md`，**逐条证据**却只在这里。

## 1 映射表（原 → 新）

| 原路径（`.session/`，不进 git） | 新路径（本目录） |
|---|---|
| `.session/reviews/2026-11-04-1328-s-c-quality/progress.md` | `quality/progress.md` |
| `.session/reviews/2026-11-04-1328-s-c-quality/quality-4.md` | `quality/quality-4.md` |
| `.session/reviews/2026-11-04-1328-s-c-quality/quality-4-audit.md` | `quality/quality-4-audit.md` |
| `.session/reviews/2026-11-04-1328-s-c-quality/delivery-5-claim.md` | `quality/delivery-5-claim.md` |
| `.session/reviews/2026-11-04-1328-s-c-quality/delivery-5-audit.md` | `quality/delivery-5-audit.md` |
| `.session/reviews/2026-11-04-0840-sc-card-shape-spec-parliament/progress.md` | `parliament/progress.md` |
| `.session/reviews/2026-11-04-0840-sc-card-shape-spec-parliament/cards.md` | `parliament/cards.md` |
| `.session/reviews/2026-11-04-0840-sc-card-shape-spec-parliament/problems.md` | `parliament/problems.md` |
| `.session/reviews/2026-11-04-0840-sc-card-shape-spec-parliament/detective-round1.md` | `parliament/detective-round1.md` |
| `.session/reviews/2026-11-04-0840-sc-card-shape-spec-parliament/submission.md` | `parliament/submission.md` |
| `.session/reviews/2026-11-04-0840-sc-card-shape-spec-parliament/impact-sheet.md` | `parliament/impact-sheet.md` |

**迁移是「同内容换路径」**，不是重写：11 件的正文逐字保留，只动路径字符串（见 §2）。机械判据 = 迁移前后每件的 `git hash-object` 除下列两类改写外相等。

## 2 同批只改了几处路径字符串（结论与数字逐字未动）

| # | 文件 | 改动 | 为什么必须同批改 |
|---|---|---|---|
| 1 | `quality/delivery-5-audit.md`（6 处） | 裸 `test.mjs:<行号>` → `tools/docgen/test/sc-card-shape.test.mjs:<行号>` | 裸名在仓内无同名文件 → 行号守卫判 `missing`（迁进 git 后被扫，实测 6 处红） |
| 2 | `quality/quality-4.md`（6 处） | 同上 | 同上（实测 6 处红） |
| 3 | `parliament/cards.md`（1 处）、`parliament/problems.md`（1 处） | 裸 `cli.mjs:<行号>` → `tools/docgen/cli.mjs:<行号>` | 仓内有两个 `cli.mjs`（`tools/docgen/` 与 `tools/observation-check/`）→ 行号守卫判 `ambiguous`（实测 2 处红）。判据：被引上下文是 `replace --yes` / DOCGEN 参数 → `tools/docgen/cli.mjs`（该文件 685 行，`:543-560` 在位；`tools/observation-check/cli.mjs` 仅 55 行，越界） |

**行号是「当时快照」，不是「现行」**：这批账写于 2026-11-04 S-C 施工期，行号对应**当时代码**。S-D 的 T1 / T2 之后 `tools/docgen/test/sc-card-shape.test.mjs` 有增行（`BASE_HEAD` 常量与两处 `t.skip`），故同一语义现在落在更后的行号。**引证时以 `Select-String` 当场打印为准**（即 S-C 自己登记的 G10「行号可差」口径）。本目录**不重写这些数字**——重写等于改写当时证据。

## 3 各件是什么

- `quality/progress.md`：④ / ⑤ 段的轮次账（每轮做了什么、改了什么）。
- `quality/quality-4.md`：sdet 的 60 条用例逐条结论（含 §5 的 G1–G12 缺口表、§8 的 G4/G5 修订轮）。
- `quality/quality-4-audit.md`：核对席对结论表的独立核对（两轮）。
- `quality/delivery-5-claim.md`：⑤ 段申报清单（D1–D11）。
- `quality/delivery-5-audit.md`：交付审计（八节 + 复核轮 §9，D 11/11 + N 12/12）。
- `parliament/*`：② 段的议会全过程账（3 轮评审 + 侦探 + 答辩 + 提交说明 + 改判影响清单）。

## 4 引用入口

- 结论侧唯一权威 = `skills/dev-workflow/references/gate-record.md` 的 `②@S-C` / `②→③@S-C` / `③@S-C` / `④@S-C` / `⑤@S-C` 五行（每行的「核了什么」列已改指本目录）。
- 未完成项 / 已知限制的落点 = `docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md` §5（G6 已于 S-D T2 闭合移入 §5.1）。
