# S6 能力差异账单（capability-diff）

> **状态注（2026-10-29）**：本账为 **V-13 历史快照，不作验收依据**（用户 2026-10-29 裁定 V-13 不在本期，S6 本体验收 = V-1～V-12）。重启该课题见 `docs/after/20261029100942-s6-v13-ab-eval-rebuild-open-decisions.md`。

> 生命期：评估期留 `.session/reviews/<本次>/`（本文件）；收口后整目录迁 `docs/superpowers/reviews/<同名>/`（plan T10 Step 5）。
> 判据：V-1（①–④ 段集合 diff **空差**）；**哈希不是通过判据**，只作定位线索（V-2）。
> 取数命令：见 `checklist.md`「取数命令原文」；基线 = `fixtures/capability-baseline.json`（`sourceCommit = a7749b27…`，该 commit 无 `policy/`）。

## 一、逐段能力矩阵（V-1）

| 段 | 项 | 改造前 | 改造后 | 差 | 取数命令 |
|---|---|---|---|---|---|
| ① 档位事实 | tools 集合 = `Read,Glob,Grep,Write,Edit,RunCommand`（6） | 6 | 6 | `=` | `factsFromText(...).tools.length` |
| ① 档位事实 | 档位名 = `producer` | `producer` | `producer` | `=` | `.tier` |
| ② 写入范围 | 可写产物（审计）= `round-check.md` / `delivery-audit.md` | 2 | 2 | `=` | `.canWrite.length` |
| ② 写入范围 | 可写产物（侦探）= `detective.md` | 1 | 1 | `=` | `.canWrite.length` |
| ② 写入范围 | 不得写 = `progress.md` | 1 | 1 | `=` | `.mustNotWrite.length` |
| ③ 明确禁止 | 禁写路径点名片面成员 | 23 | 23 | `=` | `.forbiddenPaths.length`（含 `spec / plan`） |
| ④ 命令默认拒绝 | 允许命令（3 组摊平） | 14 | 14 | `=` | `.allowCmds.length` |
| ④ 命令默认拒绝 | 禁止命令 verb（不含 `env.assign`） | 26 | 26 | `=` | `.denyCmds.length` |
| ④ 命令默认拒绝 | 环境变量形态（`env.assign`） | 5 | 5 | `=` | `.envForms.length` |
| ⑤ 越界后果 | 不做集合 diff（归 V-12 / J01） | — | — | —（不适用） | `J01` 的 8 + 2 子句断言 |

**整族结论**：两席 `diffFacts(baseline, render)` = `{minus: [], plus: []}`、`verdict = pass`（取数见 `checklist.md`）。空差 = 能力不丢、无越权新增。

## 二、逐卡差异（G01 记账位）

| 卡 | 第 1 次重出 from → to | 第 2 次重出 from → to（V-13 回改后） | 差异性质 | 说明 |
|---|---|---|---|---|
| `agents/reviewer-audit.md` | `A8790FC3…770` → `FB7A6D9A…CF4` | `FB7A6D9A…CF4` → `CB97B5FD…AC73` | 措辞改进 + 分段调整（判据语义未变） | ② 段拆「只允许写 / 禁止写」两节；③ 段路径项统一加反引号；④ 段白名单由「；」逐条改「 / 」连接；⑤ 段补「越权清单由越权者写进本人产物（② 段限定的产物 …）」+「复算由独立于越权者的核验席完成」。来源 = 边界段改为 `renderBoundary('reviewer-audit')`（S6 §3.6）；第 2 次 = V-13 回改 |
| `agents/detective-observer.md` | `CF0D27E0…2D6` → `1E6ECD84…2C8` | `1E6ECD84…2C8` → `2605F250…09CC` | 同上 | 同一次渲染改动的两席落地；第 2 次 = V-13 回改 |

## 二′、S4 迁移追加（2026-10-31；G01 记账位）

| 卡 | 差异 | 说明 |
|---|---|---|
| `agents/senior-sdet.md` | 旧手写卡（84 行）→ 新卡（73 行） | S4 迁移最后一席：职责 / 清单 / 边界改由 `agentData` 卡数据渲染；边界句新增 `SDET_BOUNDARY`（非评审席专用句，S6-B 再收）；旧模板 `agent-handwritten.md.tpl` 随 Task 7 退场。凭证见 `tools/docgen/fixtures/senior-sdet.evidence.json` 末条 `changes`（`rejudged=["A1","A2","B3"]`、`judgedBy=reviewer-ai-2026-10-31-senior-sdet-b3`）。 |

## 三、取证锚点

- 两次重出的完整凭证（`from` / `to` / `rejudged` / `judgedBy`）在 `tools/docgen/fixtures/{reviewer-audit,detective-observer}.evidence.json` 的末两条 `changes`：`judgedBy = reviewer-audit-2026-10-25-b3`（第 1 次）/ `reviewer-audit-2026-10-25-b3-r2`（第 2 次），两席均 `rejudged=["B3"]`、`judgeMode="subagent"`。
- 差异全文：`node tools/docgen/cli.mjs diff --kind agent --name <席>`（重出后应无差异）；重出前的逐行差异见 `.superpowers/sdd/2026-10-25-s6-policy-single-source/task-5a-report.md` §3 与 `task-10-v13-round2.md`。
- 判者：B3「职责边界一致」两次均由独立实例重判 pass/pass（第 2 次对象 = 模板回改后的渲染文本）。
- golden：`fixtures/boundary-golden.json` 已换代（追加 `<席>@2`，旧键保留），见 `checklist.md`「交付说明」。
