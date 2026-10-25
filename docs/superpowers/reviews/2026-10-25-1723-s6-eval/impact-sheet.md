# S6 / F-24 改判影响清单（impact-sheet，当次）

> 归属：本批（T1–T10，模板渲染单一来源化）的 R8 回扫记账。生命期同 `checklist.md`：评估期留 `.session/reviews/`，收口后随目录迁 `docs/superpowers/reviews/`。
> 判红口径：`node scripts/scope-sweep.mjs --check`（R8 的真判据命令；`npm run doc:sweep -- --check` 在本机 PowerShell + npm 10.9 会吞掉 `--` 后参数，跑到默认分支恒 exit 0，故不作判据）。

## 一、口径逐条处置

| 口径 | 含义 | 命中数（现算） | 处置 | 说明 |
|---|---|---|---|---|
| I1 | 档位 / 席位口径 | 13 | 不改 | 本轮未改档位语义；S5 的「四档」结论原样保留 |
| I2 | 判定粒度 / 词表 | 13 | 不改 | 同上 |
| I3 | 路径清单口径 | 20 | 不改 | 23 项路径的**值**未变；仅改为定义层派生（`paths.mjs`），文档侧表述不动 |
| I4 | 档位表与工具映射（`TIERS`） | 66 | 已改 | 本批把 `TIERS` 下沉到 `definitions/tiers.mjs` 并让 `patternRegistry.tools` 引用同一对象；`patternRegistry.mjs` 的 3 处 `TIERS` 属**合法新增引用**，基线由 63 重冻为 66（差额已逐条核对） |
| I5 | 边界句存放位置 | 14 | 已改 | 边界句从「`patternRegistry` 内的两个长常量」改为「`renderBoundary` 渲染」；`2026-10-25-docgen-policy-single-source-design.md` 的 §3.6 已写死新存放位置，旧描述保留为历史叙述 |
| I6 | 测试侧手抄清单 | 32 | 已改 | `tool-tiers.test.mjs` 的 `FORBIDDEN_PATHS` / `ALLOWED` / `FORBIDDEN` 改为定义层 import；S5 testcase 的同类手抄同步改派生 |
| I7 | S5 判据改判 | 28 | 已改 | S5 spec 加 2 处指针、S5 testcase 的 `B08` / `E05` / `B14` 三条判据改判（历史叙述保留） |
| I9 | 权限语义 / 能力集合 | 74 | 不改 | 两席能力矩阵 `minus/plus` 双空（V-1）；`index.md`（PRD F-24）口径本就写「能力矩阵等价」，无需改判 |
| （I8） | S5 判据改判（`BOUNDARY_COMMAND`） | — | 口径已撤 | 该常量本轮删除，关键词条目随之移除（`keywords.json` 与 `baseline.json` 均已删 I8），无残留口径 |

## 二、命中文件逐条处置

| 文件 | 命中口径 | 处置 | 说明 |
|---|---|---|---|
| `docs/prd/20261024073606-dev-workflow-mainline/index.md` | I1 / I2 / I9 | 不改 | F-24 行口径已是「能力矩阵等价 + 双向探针 + A/B 盲评」；§0 有 2026-10-25 重签 + 验收口径变更留痕（功能点 ID 集合未变，不触 R5） |
| `docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design.md` | I3 / I4 / I5 / I9 | 不改（本批的**上游签字件**） | 本批实现严格按该 spec v8 落地；spec 自身未在本批被改写（除 §11 差异表已含的口径） |
| `docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design-testcase.md` | I3 / I4 / I5 / I6 / I9 | 不改 | 78 条验收清单；本批实现按它落，未反向改判据（个别「判据代码不可执行」处已在 `ab-score` / `checklist` 与 `.superpowers/sdd/…/progress.md` 记为回流项） |
| `tools/docgen/components/patternRegistry.mjs` | I4 | 已改 | 删三常量与 `BOUNDARY_COMMAND`；`tools: TIERS` 同引用；`boundaryBySeat` 走渲染；`tierBySeat` 派生（与 S6 spec §3.6 一致） |

## 三、复算命令

```powershell
node scripts/scope-sweep.mjs --check          # 期望：sweep ok（命中未超基线、清单齐、scope 齐）
node scripts/scope-sweep.mjs --json           # 逐条命中（id / file / line / kind / words）
```
