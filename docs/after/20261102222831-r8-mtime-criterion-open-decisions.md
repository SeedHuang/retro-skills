# R8 回扫的「当次清单」判据靠 mtime，提交后必红（未决）

> 状态：**未决**｜创建 2026-11-02｜来源：议会 r1 对 `docs/prd/20261102212627-card-data-contract-and-proof/` 的评审（6 席中 3 席指出：该缺陷与「卡面数据契约」不同族，应移出该 PRD）
> **何时搬走**：`scripts/scope-sweep.mjs` 的「当次清单」判定改为不依赖 mtime（或写明 `--impact` 为唯一合法用法）后，结论并入该脚本注释与 `dev-workflow` 技能的回扫判据，本文件删。

## 现状

`scripts/scope-sweep.mjs:119-125` 用 **mtime** 判「这份 `impact-sheet.md` 是不是当次改判的清单」：若清单 mtime 早于任一 scope 文件 → 报 `FAIL: impact-sheet 早于被扫文件`。

而 `commit` / `checkout` 会刷新被提交文件的 mtime，清单却在 `.session/`（不进 git、不被提交）。**结果是每次提交后 `npm run check` 必红**，必须 touch 一次清单才绿。

2026-11-02 实证：`90083cd` 提交后 `sweep` 报红，5 个 scope 文件 mtime 比清单新 1~2 秒；touch 清单后即绿。同一形态在本轮又出现一次（`e369f21` 提交后）。

## 触发

- 任何「改 scope 内文件 → 提交」的动作；
- 任何在真仓做「改文件再复原」的抽核（`git checkout` 同样刷 mtime）。

## 该做时做什么（二选一）

- **A（首选，结构性）**：`sweep` 与门禁里的调用统一加 `--impact <当次清单>`（`scope-sweep.mjs:116-118` 明写显式指定后不再比 mtime），把「不靠 mtime」变成默认形态；`S3-TC-K04` 同步改。
- **B（保守）**：保留 mtime 判据，但把「门行落盘后 touch 清单」写成段必做步骤，并由脚本在缺步骤时报「应 touch」而不是「不是当次」。

## 谁兜

下一次改 `scope-sweep.mjs` 或 `dev-workflow` 规则的主 agent + 该次 ② 段审计。
