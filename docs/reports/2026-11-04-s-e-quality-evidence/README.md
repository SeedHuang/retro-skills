# S-E 旁路批：R8 改判影响清单（迁入 git 的存档）

> 迁入时间：2026-11-04（S-E+1 批开工第一步）｜来源 = `⑤@S-E` 门行结论列残余第 1 条的指派（「触发：换机 / S-E+1 开工；谁兜 = S-E+1 批开工时整目录迁 `docs/reports/2026-11-04-s-e-quality-evidence/`，迁移 README 写明『复算需 `--impact` 显式指定』」）
> 为什么迁：`.session/` 在 `.gitignore` 内，换机器 / 重新克隆即全失；S-E 的改判结论虽已进 `skills/dev-workflow/references/gate-record.md`，但「哪 33 个口径、哪 22 个命中文件、4 处判据级改动各怎么处置」的逐条证据只在这里，丢了 R8 不可复算。

## 1 映射表（原 → 新）

| 原路径（`.session/`，不进 git） | 新路径（本目录） |
|---|---|
| `.session/reviews/2026-11-04-s-e/impact-sheet.md` | `impact-sheet.md` |

共 **1 件**（该目录当时只剩这一件；`progress.md` / `problems.md` 已在 S-E 收口时处置完毕并删除）。

**迁移是「同内容换路径」，不是重写**：正文逐字保留，迁移时**零处路径字符串改写**（件内「落点说明」一行写的是迁移前的历史落点，按历史保留不改）。机械判据 = 迁移前后 `git hash-object` 相等：两侧均为 `e1ff53357f0cb3cadabd9159fd72dfa0c65dd459`。

## 2 本件是什么

- §0 全貌确认（本质 / 同族 / 边界 / 验收 / 影响面 + 联动四问）；
- §1 口径全集 **33 个 ID**（编号到 `I34`，其中 `I8` 未登记）；
- §2 **4 处判据级改动**的处置与同族回扫结论；
- §3 命中文件全集 **22 个 basename**；
- §4 **13 条 touch 记录**（改 scope 内文件后追加，取 mtime 判红用）。

## 3 引用入口与用法

- 结论侧唯一权威 = `skills/dev-workflow/references/gate-record.md` 的 `⑤@S-E` 行。
- **本件不会被自动发现**：`scripts/scope-sweep.mjs` 的 `findImpactSheet()` 只扫 `.session/reviews/` 与 `docs/superpowers/reviews/`；本件在 `docs/reports/`，故不会冒充当后续批次的「当次清单」。需要复算 S-E 的 R8 时用显式参数：`node scripts/scope-sweep.mjs --check --impact docs/reports/2026-11-04-s-e-quality-evidence/impact-sheet.md`。
- 后续批次必须自建当次 `impact-sheet.md`（落 `.session/reviews/<新批>/`），不得复用本件。
