# 阶段 3 遗留：skill 判据登记与 residual（未决）

> 状态：**未决**｜创建：2026-11-08 16:47:44｜来源：2026-11-08 阶段 3 收尾审计 + sdet 复核
> 何时搬走：S-4 / S-5 落进判据引擎与各 skill 后，把结论并入阶段 3 PRD，本文件删除。

## 1 这条在说什么

阶段 3 的 12 条承接已 12/12，但验收表里的两项还没做：

- **S-4**「每个 skill 的可机判条目在判据引擎有登记且 testcase 全绿」。
- **S-5**「判心 residual 齐（每个语义判项有 residual{who, sample, fields, 客观化路径}）」。

现状证据：

- `tools/docgen/dsl/skills/` 只有 `.gitkeep`。
- `scripts/check-all.mjs` ⑨ 段只传 `--data tools/docgen/dsl/rules`，没有 skills 数据。
- 新技能 `docs-placement` 的 `.session` 封闭清单、命名、待办语义没有判据 json / testcase / residual。

## 2 要做什么

1. 定 skills 判据的数据形态与目录：`tools/docgen/dsl/skills/<skill>.json` + `.testcase.json`。
2. 把 `docs-placement` 的可机判项登记为判据：`npm run doc:name` exit 0、`.session` 一级条目在封闭清单、references 指针存在。
3. 语义项（如「不许 ✅ 档」）落 residual{who, sample, fields, 客观化路径}。
4. 把 `check-all` ⑨ 段 / `check:criteria` 扩到 skills 数据，或写明豁免与理由。

## 3 完成判据

- `tools/docgen/dsl/skills/` 下至少 `docs-placement.json` + `docs-placement.testcase.json` 在位；
- `npm run check:criteria` 输出包含 skills 判据且全绿；
- `docs-placement` 的每个可机判项有判据 ID，语义项有 residual。
