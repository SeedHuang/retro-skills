# `check-quotes` 不进总门禁：失效会经 ② 段全仓测试连带变红，但没有专项报码（未决）

> 状态：**未决（已知缺口，非探索中）**｜创建 2026-11-03 21:48｜来源：S-B 契约层 spec `2026-11-03-s-b-contract-layer-design.md` §11.1 R3 / §11.7（用例 `SB-TC-14`）
> 何时搬走：本条的「触发」被处理掉（把 `check-quotes` 接进 ⑥ 段，或给归档动作加一条守卫）之后，把结论并入对应载体，本文件按 `docs-placement` 的「完成=删」清账（不设 ✅ 档）。

## 1 这条在说什么

`node tools/docgen/check-quotes.mjs`（PRD V6 引句校验器）**故意不进** `npm run check` 的**门禁段**（`scripts/check-all.mjs` 与 `package.json` 的 `scripts` 都不含它，`SB-TC-14` 用计数判这两条 = 0）：它的语料是 `docs/superpowers/reviews/**/observation-*.json` 的 `items[].evidence`，而清理 / 归档 `docs/superpowers/reviews/` 是正常动作——接成门禁段会让「归档」直接等于「全仓红」。

**但红仍会从测试面发生，不是「没人会发现」**：`npm run check` 的 ② 段跑全仓 `**/*.test.mjs`，其中 `tools/docgen/builders/agents/test/sb-contract-layer.test.mjs` 的 `SB-TC-03` 对**真仓**语料跑本脚本并断言 exit 0，`SB-TC-15` / `SB-TC-16` / `SB-TC-17` / `SB-TC-30` 也从真仓语料取基线。语料掉到 < 2 条或被移走 → 这些用例红 → ② 段红。所以发现点**不止** ③/④/⑤ 门行实跑。真正的缺口是：**没有一道专项报码**告诉你是「语料没了」，你看到的只是一条测试失败。

| 失效形态 | 现象 | 谁能发现 |
|---|---|---|
| 语料被归档 / 清理到 < 2 条 | 脚本 fail-closed `exit 1`（`语料 <K> 条（需 ≥2，fail-closed）`） | `npm run check` ② 段（`SB-TC-03` 等读真仓语料的用例红）；以及 ③/④/⑤ 门行实跑 |
| 语料只剩 1 份文件 | 同上（`K` 掉到 < 2） | 同上 |
| 脚本被绕过（不再被任何门行调用、且相关用例也一并删掉） | 恒绿，什么都不发生 | 没人（这一档才是真正的缺口） |

## 2 四栏

| 现状 | 触发 | 该做 | 谁兜 |
|---|---|---|---|
| `check-quotes` 是独立脚本，不在 `npm run check` 的门禁段；`scripts/check-all.mjs` 与 `package.json` 的 `scripts` 都不含它（`SB-TC-14` 用计数判这两条 = 0），但 ② 段的全仓测试会连带跑到它（见 §1）。语料现 2 份 json / 3 条 evidence，脚本首行 `check-quotes: files 2 / evidence 3 / bad 0 => ok` | **触发一**：下次改 `scripts/check-all.mjs` 的 ⑥ 段（观察产物门禁）时——那时语料发现口径与 ⑥ 段同源，顺手把 `check-quotes` 接进去或加等价守卫最省事；**触发二**：`docs/superpowers/reviews/**/observation-*.json` 的文件数降到 1 份（脚本 `K` 会掉到 < 2，fail-closed 变红 → ② 段连带红） | 二选一：① 接进 ⑥ 段（须同时决定「归档历史后空语料算不算红」）；② 保持独立，但在 ③/④/⑤ 任一门的 `gate-record.md` 行里把它写成固定实跑项（命令 + 输出首行），使失效在签字面可见、而不是只表现为某条测试红 | 改 ⑥ 段的人（触发一）；语料只剩 1 份时由**当次看到 ② 段红 / 实跑门行的人**（触发二）；本文件的清账由落地者做 |

## 3 为什么不能现在接进门禁

语料是**历史观察记录的产物面**，不是当次仓状态。把它做成门禁段，等于给「历史目录做归档」这一正常动作加了一条「不许动」的隐式约束——而这条约束既不写在规则里，也没有任何判据提示它存在。

**「与 S-A 同口径」这个先例不成立**：S-A 的 `tools/docgen/builders/agents/check-shared-refs.mjs` 同样不进总门禁，但它的用例在**仓副本**里跑（`tools/docgen/builders/agents/test/sa-data-layer.test.mjs` 的 `REFS()`，`spawnSync(..., { cwd: dst })`），不依赖真仓可变内容；`check-quotes` 的用例直接读真仓语料。两者不可比——前者归档任何目录都不影响它的红绿，后者会。

**与 spec 的张力**：spec §11.1 R3 的意图是「归档不得使全仓红」，但按 §1 的事实，语料归档到 < 2 条时 ② 段确实会红。这一耦合留给 ④/⑤ 段裁定：是否需要把语料面回流 ② 段（例如让相关用例改用自造语料 / 副本），本文不预设方案。
