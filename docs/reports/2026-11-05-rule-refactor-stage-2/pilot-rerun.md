# 阶段 2 · 前置物核验与迁移实跑记录（2026-11-05）

> 对应 `docs/prd/20261105182104-rule-refactor/prd/stage-2-new-mode-pilot.md` §1 步骤 0 / 步骤 1。

## 1 前置物核验（步骤 0）

- 落点：`D:\Seed\evo-retro-skills-inspector\tmp\rule-dsl\` —— **实物在**（走「迁移」路径，不重建）。
- 实物清单（15 件）：`schema.mjs` / `interpreters.mjs` / `build.mjs` + 3 组 `<id>.json` + `<id>.testcase.json` + 3 份渲染投影（`.md` / `.inject.md`）。
- 原址重跑（cwd = `D:\Seed\evo-retro-skills-inspector\tmp\rule-dsl`）：

```
import-guard.json: 7 条样例已判（测试在 import-guard.testcase.json）
no-git-write.json: 7 条样例已判（测试在 no-git-write.testcase.json）
no-unverified-number.json: 4 条样例已判（测试在 no-unverified-number.testcase.json）

解释器 2 个（md / inject），样例 18 条，错误 0 条
rule-dsl ok          ← exit 0
```

## 2 迁移（步骤 1）

- 三件套 + 6 个数据文件复制到 `tools/quality/criteria-engine/`；`build.mjs` 在新址重跑，投影 `.md` / `.inject.md` 由渲染生成（不手工复制）。

```
...（7 条判据逐条打印，见下）
解释器 2 个（md / inject），样例 33 条，错误 0 条
rule-dsl ok          ← exit 0
```

| 判据 | 样例数 |
|---|---|
| `import-guard` | 7 |
| `no-git-write` | 7 |
| `no-unverified-number` | 4 |
| `anchor-present` | 5 |
| `target-present` | 3 |
| `materials-four` | 4 |
| `observable-criteria` | 3 |
| **合计** | **33** |

## 3 迁移后的两处变更（相对试点实物）

1. **白名单扩为 8 字段**：新增选填 `type`（枚举 `持续适用 / 条件触发 / 模式门控`），原 7 字段仍全部必填 —— 判据出处 stage-2 §7 V-3。
2. **residual 增第 4 件**：每条 residual 除 `who / sample / fields` 外补 `objectivePath`（客观化路径），校验器强制非空 —— 判据出处 stage-2 §1.5。

## 4 单源约束遵守情况

- `observable-criteria` 只登记「跑 `node scripts/check-observable.mjs --check` 且 exit 0」的引用（`assert` = `checkObservableExit eq 0`），**未复制** `markers` 正则与 `samples`；词表唯一源仍是 `tools/quality/observable-terms.json`。
