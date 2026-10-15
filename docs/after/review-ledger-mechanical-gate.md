# 审查过程账的机械闸门（轮次账 / 轮次小节断档）

> **状态：探索中，未定稿。** 本文记的是「已实测的缺口 + 待决的修法」，**不能当结论引用**。
> **何时该搬走**：等「闸门做在哪、判据长什么样」拍板并落地后 → 结论并入 `skills/review-loop/` 的相应 reference，条目从本文迁出（`docs-convention`：`after/` 只放还没做完的，做完即迁走）。

## 已实测的缺口（2026-10-15，R9 查出）

> ⚠️ **本节记的是「当时发现的缺口」，不是待决项**——待决项只在下面的「待办」一节。
> 缺口 1-4 在写进仓库的**同一个 commit（`c5e4f31`）里**已经做过补录 / 补跑，「现状」列写的是**实测后的结果**。下一个人请先读「现状」列，不要照着「缺口」列去找已经不存在的问题。

对象：`.session/reviews/2026-10-14-2248-review-all-to-death/`（本次 review，已跑到 R10）。

| # | 缺口（当时的） | 取数命令与实测结果 | 现状（R9 当轮处理后） |
|---|---|---|---|
| 1 | 轮次小节只到 R6，R7/R8/R9 三节不存在 | `Select-String -Pattern '^## 第 (\d+) 轮' progress.md` → 只命中 1-6 | ✅ **已补录**：同一命令现命中 1-9（progress.md 的 R7/R8/R9 三节 + 补录声明） |
| 2 | 轮次账表只有第 1 轮一行数据 | 补录前该表只有 1 行数据，R2-R9 一行没填 | ✅ **已补录**：现 9 行；耗时列按「不编数字」原则一律标「未取数」 |
| 3 | R7 段一未跑，且当轮无人自记 | `ocr session list`（完整 21 行）无 RANGE = `d4b0e6f` 的 session；对照 R4 同样未跑但**自记了** | ✅ **已补记**：轮次账 L40 与 R7 小节都写明「段一未跑（当轮未自记，R9 查出）」。**但「当时无人自记」是历史事实，不会被补记改掉** |
| 4 | R8 的修复从未被 OCR 审，而下一轮据此判「空转」 | 无 RANGE = `a50118e` 的 session；`1bac4d1f` 的 RANGE 实测 = `590a667`（R7 的 commit） | ✅ **已补跑**：session `daa31e06`（RANGE `a50118e^..HEAD`，1 文件 / **6 条**），全部处置完毕 |

**为什么这四条要合起来看**：单独看是「记账没记全」；合起来看是**账本能显示「已核销」，实际那一格从没跑过** —— 比不记更坏（R6 那条复盘的原话：「过程账缺失导致 P1 无人核销」）。

## 根因（已定位，不是推测）

1. **两个载体职责相近，被当一个用**：`progress.md` 管「这一轮核销了没有」，`problems.md` 管「这一轮发现了什么」。从 R7 起我把「改了什么」写进 commit body、「发现了什么」写进 `problems.md`，**恰好把 `progress.md` 独有的三块（轮次起止 / 三段核销状态 / 本轮结论）全省了**。
2. **上一轮的沉淀只进了散文，没进闸门**：R6 的复盘已经写明「复查轮的逐条核销表必须落进账本」，但那条话**没有任何检查在执行**——所以 R7 又犯了一次，R8 又犯了一次。
3. **模板给了格子，没给「填不完会被谁拦住」**：轮次账表有 ⬜ 方框，长期停在第 1 轮。**有格子没填，比没格子更像「在填」**——读者（和我自己）扫过去不会停。

## 待办

- [ ] **给 review-loop 加一条机械核对**：每轮收尾断言「轮次账表的最高轮号 == 轮次小节数」且「上一轮基线 commit 在 `ocr session list` 里有对应 RANGE 的 session（或显式标注未跑 + 理由）」。
  - **未决**：这条检查放哪 —— ① `scripts/check-all.mjs` ⑤ 段 ② `skills/review-loop/scripts/` ③ `skills/review-log/scripts/`
  - **判据（已实测，给的是结论不是选项）**：
    - 三个候选目录**都真实存在**：`Test-Path scripts\check-all.mjs` → True；`Get-ChildItem skills\review-loop\scripts` → `review-init.mjs` / `review-init.test.mjs` / `update-review-project-type.mjs`；`Get-ChildItem skills\review-log\scripts` → `time.mjs`
    - **目录由谁创建**：`skills/review-loop/scripts/review-init.mjs`（分支前置第 5 步在跑它）
    - **目录内容语义归谁**：`.session/reviews/<那一次>/` 的骨架与必填表在 `skills/review-log/assets/review-progress-template.md`，「每轮必填」判据在 review-log 的 SKILL.md
    - **① 明确排除**：`scripts/check-all.mjs` 的 ④ 段有 `MD_SKIP_DIRS` 排除 `.session/`，且它扫的是**仓库内**文件，`.session/` 又在 `.gitignore` 里 → 把检查塞进 `npm run check` 等于让闸门管 gitignore 的目录
  - **结论：放 ③ `skills/review-log/scripts/`**——检查要读 progress.md 骨架，而骨架与判据同源（同一技能的 `assets/` + `SKILL.md`）；若做成 `npm run check` 的一段，会与 ① 的排除规则直接冲突
- [ ] **模板补一句「填不出就写未取数，不许留空 / 不许只留 ⬜」**：留空与「没跑」在文件里长得一样（都读成「在填」）。
- [ ] **段一「未跑」的自记要成为硬要求**：R4 自记了、R7 没自记——同一个模板、同一个 agent，两轮行为不一致，说明它靠自觉。

## R9-R10 追加：其他「落盘纪律」待办

> 这两条与上文主题相邻但不同（一条管审查产物、一条管 `after/` 写法），同属「落盘的东西会不会骗读者」，故并入本文，不另开文件。

- [ ] **段二的「自洽确认区」每条 ✅ 必须能填出「取数命令 + 关键输出」两格，填不出降级成 🔶「未核」**
  - **来源**：R9。子代理在段二确认区写「`collectScanFiles` 确实用它拼路径 → 已修对，无残留」，实测该常量引用数 = 0；同轮 OCR 独立报出同一条。
  - **要改的载体**：`multi-lens-review` 技能的角色面板判据（不在 review 范围内，需另起一轮）。
  - **完成判据**：对 `multi-lens-review` 的 `references/` 跑一次「确认区 ✅ 行必须含反引号命令」的检查，人工抽查 3 条确认命令能跑。
- [ ] **`docs-convention` 给 `after/` 加一条：「写现状必须同时写时间戳或现状列」**
  - **来源**：R10。`review-ledger-mechanical-gate.md` 的「已实测的缺口」表列的 4 条，在写进仓库的同一个 commit 里就被补完了，文档仍写成「缺口」——地基在落盘那一刻就过期了。
  - **要改的载体**：`rules/docs-convention.md`（改判据文件，需另起一轮）。
  - **完成判据**：`Select-String -Path rules/docs-convention.md -Pattern '现状列|时间戳'` 命中 ≥ 1 行，且该行含「不许只写现状」这类禁止句。

## parking（已认可但押后）

> ⚠️ **上面 3 条待办一条都没押后**，parking 只针对「补耗时取数」这一项。别把整件事当成已押后。

- **parking**：把本次 R7-R9 的耗时补取数。**理由**：当时没跑 `time.mjs`，数据已不可取，编数字比留空更坏。等下次 review 按新纪律跑满两轮后，再评估「耗时列是否值得保留在模板里」——若机械核对落地后耗时仍无人取，说明这一列本身就是无效字段。
