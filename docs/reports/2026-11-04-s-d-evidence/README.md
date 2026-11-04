# S-D 旁路批：R8 改判影响清单（迁入 git 的存档）

> 迁入时间：2026-11-04（S-E 批 Task 0）｜来源 = `⑤@S-D` 门行结论列残余第 3 条的指派（「触发：换机 / 下一批开工；谁兜 = 下一批按 `⑤@S-B` P2-2 与 `⑤@S-C` 残余 ④ 同款口径整目录迁 `docs/reports/<主题>-evidence/`，只改路径字符串不改结论」）
> 为什么迁：`.session/` 在 `.gitignore` 内，换机器 / 重新克隆即全失；S-D 的改判结论虽已进 `skills/dev-workflow/references/gate-record.md`，但「哪 33 个口径、哪 22 个命中文件、6 处判据级改动各怎么处置」的逐条证据只在这里，丢了 R8 不可复算。

## 1 映射表（原 → 新）

| 原路径（`.session/`，不进 git） | 新路径（本目录） |
|---|---|
| `.session/reviews/2026-11-04-s-d/impact-sheet.md` | `impact-sheet.md` |

共 **1 件**（该目录当时只剩这一件；`progress.md` / `problems.md` 已按 S-D 收口时处置完毕）。

**迁移是「同内容换路径」，不是重写**：正文逐字保留，迁移时**零处路径字符串改写**（实测该件内无裸 `<文件>.mjs:<行号>` 形态引用，不触发行号守卫）。机械判据 = 迁移前后 `git hash-object` 相等。

## 2 本件是什么

- §1 **口径全集 33 个 ID**（本批无一遗漏，含 I11 的「验收命令写法」与 I29 的「比对区间」）；
- §2 **6 处判据级改动**的处置与同族回扫结论（其中 4 条是施工期新增）；
- §3 **命中文件全集 22 个 basename**；
- §4 **13 条 touch 记录**（改 scope 内文件后追加，取 mtime 判红用）。

## 3 引用入口与用法

- 结论侧唯一权威 = `skills/dev-workflow/references/gate-record.md` 的 `⑤@S-D` 行（残余 ③ 已记「兑付」）。
- **本件不会被自动发现**：`scripts/scope-sweep.mjs` 的 `findImpactSheet()` 只扫 `.session/reviews/` 与 `docs/superpowers/reviews/`；本件在 `docs/reports/`，故不会冒充当后续批次的「当次清单」。需要复算 S-D 的 R8 时用显式参数：`node scripts/scope-sweep.mjs --check --impact docs/reports/2026-11-04-s-d-evidence/impact-sheet.md`。
- 后续批次必须自建当次 `impact-sheet.md`（落 `.session/reviews/<新批>/`），不得复用本件。
