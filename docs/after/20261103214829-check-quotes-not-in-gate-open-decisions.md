# `check-quotes` 不进总门禁 ⇒ 它失效时没有任何门禁会提示（未决）

> 状态：**未决（已知缺口，非探索中）**｜创建 2026-11-03 21:48｜来源：S-B 契约层 spec `2026-11-03-s-b-contract-layer-design.md` §11.1 R3 / §11.7（用例 `SB-TC-14`）
> 何时搬走：本条的「触发」被处理掉（把 `check-quotes` 接进 ⑥ 段，或给归档动作加一条守卫）之后，把结论并入对应载体，本文件按 `writing-after-docs` 的「做完就删」清账（不设 ✅ 档）。

## 1 这条在说什么

`node tools/docgen/check-quotes.mjs`（PRD V6 引句校验器）**故意不进** `npm run check`：它的语料是 `docs/superpowers/reviews/**/observation-*.json` 的 `items[].evidence`，而清理 / 归档 `docs/superpowers/reviews/` 是正常动作——接进总门禁会让「归档」等于「全仓红」。

代价：这道校验**失效时没有任何门禁会提示**。它有两个失效入口，都不报错、只变红或变绿：

| 失效形态 | 现象 | 谁能发现 |
|---|---|---|
| 语料被归档 / 清理到 < 2 条 | 脚本 fail-closed `exit 1`（`语料 <K> 条（需 ≥2，fail-closed）`） | 只有**手动实跑** ③/④/⑤ 门行的人 |
| 语料只剩 1 份文件 | 同上（`K` 掉到 < 2） | 同上 |
| 脚本被绕过（不再被任何门行调用） | 恒绿，什么都不发生 | 没人 |

## 2 四栏

| 现状 | 触发 | 该做 | 谁兜 |
|---|---|---|---|
| `check-quotes` 是独立脚本，不进 `npm run check`；`scripts/check-all.mjs` 与 `package.json` 的 `scripts` 都不含它（`SB-TC-14` 用计数判这两条 = 0）。语料现 2 份 json / 3 条 evidence，脚本首行 `check-quotes: files 2 / evidence 3 / bad 0 => ok` | **触发一**：下次改 `scripts/check-all.mjs` 的 ⑥ 段（观察产物门禁）时——那时语料发现口径与 ⑥ 段同源，顺手把 `check-quotes` 接进去或加等价守卫最省事；**触发二**：`docs/superpowers/reviews/**/observation-*.json` 的文件数降到 1 份（脚本 `K` 会掉到 < 2，直接 fail-closed 变红） | 二选一：① 接进 ⑥ 段（须同时决定「归档历史后空语料算不算红」）；② 保持独立，但在 ③/④/⑤ 任一门的 `gate-record.md` 行里把它写成固定实跑项（命令 + 输出首行），使失效在签字面可见 | 改 ⑥ 段的人（触发一）；语料只剩 1 份时由**当次实跑门行的人**（触发二）；本文件的清账由落地者做 |

## 3 为什么不能现在接进门禁

语料是**历史观察记录的产物面**，不是当次仓状态。把它做成硬门禁，等于给「历史目录做归档」这一正常动作加了一条「不许动」的隐式约束——而这条约束既不写在规则里，也没有任何判据提示它存在。

同口径先例：S-A 的 `tools/docgen/check-shared-refs.mjs` 也不进总门禁（理由见 `2026-11-03-s-a-data-layer-design.md`），审计已接受。
