# 可观察判据 S3 · 交付后遗留（未决）

> 状态：**未决（5 条，全部带触发信号）**｜创建 2026-11-02｜来源：S3（`docs/superpowers/plans/2026-11-02-observable-s3.md`）④ 段质量判定的 P2 四条（`.session/reviews/2026-11-02-101312-observable-s3-spec/quality-4.md` §8）+ ⑤ 段交付审计复核轮的 P2 一条（同目录 `delivery-5.md` §10）｜落点判定：`docs/after/`（都还没做，不属 spec 定稿）
> **何时搬走**：任一条做完 → 结论并入 spec（判据级须回 ② 段）或实现与测试（文案级），本文件删该条；全部清空后本文件改为 `done` 档并保留为历史记录。

## 1 P2-1：`no-fake-problem` 的 `observable` 未钉进载体列点名的「结论」列

- **现状**：spec §3 表给 `no-fake-problem` 的载体是「`audit` 产物『结论』列 + findings 集合」，而 `tools/docgen/card-model/vocab/predicates.mjs` 的 `observable` 第 ① 条只写「findings 集合为空时**正文**含『全过』行」——把「全过」写进别的段也能过。机判（`S3-TC-D04` 的 `assertCarriers`：列非空 + token ⊆ 已声明集）判不出来，属语义面缺口（GAP-11 触发）。
- **触发**：下次改 `predicates.mjs`（新增 / 改写任一条 predicate）时，或 ② 段再次复签 8 条 label 文案时。
- **该做时做什么**：把第 ① 条改为「`audit` 产物的**结论列**含『全过』行（findings 集合为空时）」；同批重跑 `tools/docgen/test/s3-predicates.test.mjs`（`C01` / `D05` / `D06` / `E01` 覆盖），并回 ② 段复签（属判据级改判，`label` 未变故 15 卡不受影响）。
- **谁兜**：下一次动 `predicates` 的主 agent + ② 段审计。

## 2 P2-2：`out-of-scope-self-disposal` 的 `observable` 未点名 `git status --porcelain` 路径集

- **现状**：spec §3 表给该条的载体是「`git status --porcelain` 路径集 + 交付物正文」，而 `observable` 第 ① 条只写「越界处置动作 计数 = 0」——**从哪个输出数**没写；正文侧（「声明」行 + `path:line`）对得上。
- **触发**：同 P2-1（下次改 `predicates.mjs` 或 ② 段复签时）。
- **该做时做什么**：把第 ① 条改为「`git status --porcelain` 路径集中的越界处置动作 计数 = 0」；同批重跑 `s3-predicates.test.mjs` 并回 ② 段复签。
- **谁兜**：下一次动 `predicates` 的主 agent + ② 段审计。

## 3 P2-3：`S3_BASE` 的 env 显式覆盖路径无专门用例

- **现状**：GAP-10 已判**可关闭**（`tools/docgen/test/s3-predicates.test.mjs:43` 把锚显式钉成 `process.env.S3_BASE || 'b5e11aa'`，全文件 `git log` 0 命中，降级分支已删）；但 `S3_BASE=<sha>` 显式覆盖这条路径没有断言兜——若下次有人改常量写法，用例仍会按默认值绿。
- **触发**：S4 起需要换锚（D22 的既定语义是「S3 起须显式换锚」），或有人首次用 `S3_BASE` 跑跨批比对时。
- **该做时做什么**：在 `S3-TC-B01` 现状的 `t.diagnostic` 后补 1 条「子进程注入 `S3_BASE=b5e11aa` 时 `OLD_LABELS.length === 8`」的断言（约 6 行）；属加断言，不改判据语义 → 不需回 ② 段。
- **谁兜**：S4 的主 agent + ④ 段 sdet 复核。

## 4 P2-4：D-13 抽核在真仓实做会顶掉 R8 的 mtime 判据

- **现状**：④ 段按 `D-13` 在真仓抽 2 席「改一字节必红 / 还原转绿」，`git checkout` 把被复原文件的 mtime 刷到当下 → `scripts/scope-sweep.mjs` 的「impact-sheet 不早于被扫文件」判据变红（连带 4 条 sweep 用例红）；本轮靠把 mtime 设回原值才恢复绿。**同一形态还有第二个来源**：`skills/dev-workflow/references/gate-record.md` 在 `I11` 的 scope 内，落 ④ / ⑤ 门行本身就是「改了 scope 文件」→ 必须随后 touch 当次 `impact-sheet.md`；⑤ 段审计 P1-1 即此（`delivery-5.md` §8）。两次都靠「记得 touch」兜，属靠自觉。
- **触发**：下一次任何「改 scope 内文件再复原」的动作（D-13 型抽核 / 红探针 / 门行落盘）。
- **该做时做什么**：二选一并写进 `skills/dev-workflow/references/stage-4-quality.md` 或 `scripts/scope-sweep.mjs` 的使用说明——（A，首选）`S3-TC-K04` 与门禁里的 sweep 调用统一加 `--impact <当次清单>`（源码 `:116-118` 明写显式指定后不再比 mtime），把「不靠 mtime」变成判据的默认形态；（B）保留 mtime 判据，但把「门行落盘后 touch 清单」「抽核后复原 mtime」写成段必做步骤并由脚本在缺步骤时报红。
- **谁兜**：下一次做 ④ 段抽核的 sdet + 改该规则 / 脚本的主 agent。

## 5 P2-5：spec §5③ 的「import `evaluateText` 仅作对照」与已签 testcase 冲突

- **现状**：spec §5 检查点 ③ 写「import `evaluateText` **仅作对照**」，而 `skills/rule-inspector/scripts/score.mjs` 实际只读 `observable-terms.json` 的 `markers` 正则、**没有** import `evaluateText`；已签 testcase 两条断言反过来要求「⑨ 判定里不出现 `evaluateText`」（`tools/docgen/test/s3-predicates.test.mjs:176` / `:871`）。⇒ 实现与 testcase 一致，**spec 措辞落后**（照 spec 原文写会把 `evaluateText` 读进来，反而撞已签断言）。
- **触发**：下一次修订 `docs/superpowers/specs/2026-11-02-observable-s3-predicates-reuse-design.md`（S3 的 spec 被任何后续任务引用并重议时）。
- **该做时做什么**：把 §5 ③ 的「import `evaluateText` 仅作对照」改为「**不** import `evaluateText`（判定本体只用 `markers` 正则；`evaluateText` 仅作口径参照，写在注释里）」；属措辞顺句，不改判据 → 不需回 ② 段、不需重跑用例。
- **谁兜**：下一次改该 spec 的主 agent + 该次 ② 段审计。

## 清理规则

- 本文件**不设 ✅ 档**：做完一条就删一条（结论进 spec / 实现 / 测试），不留「已完成」行。
- 5 条全清后，把文件瘦成一句话「S3 遗留已全部落地（日期）」并把文件名阶段位改为 `done`。
