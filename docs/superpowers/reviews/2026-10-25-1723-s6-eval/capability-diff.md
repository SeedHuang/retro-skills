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

## 二″、P4 D6a 档位补齐（2026-11-11；G01 记账位）

| 卡 | 差异 | 说明 |
|---|---|---|
| agents/ 下 5 卡 | 仅第 4 行 tools | 取证 / 架构答辩 / 研发答辩 / 精算 / AI 声明写产物却无 Write 工具（假写权限）→ SEAT_POLICY 补 write，档位 readOnly/command → sdet/producer，本批 5 卡 tools 行同步重出；边界正文与其余段零变化。凭证见各席 evidence.json 末条 changes。 |

## 二‴、P4 D6b 边界单源化（2026-11-11；G01 记账位）

| 卡 | 差异 | 说明 |
|---|---|---|
| agents/ 下 6 卡 | 边界节整段换成 `renderBoundary` 派生正文 | 取证 / 架构答辩 / 研发答辩 / 精算 / AI / 议长 六席原为手抄边界句（或默认只读句），与新 `Write` 档位自相矛盾（例：「不得创建、修改、删除任何文件」+ `Write`）。现 `boundaryBySeat` 由「档位含 `Write`」现算（9 席），4 个席 JSON 的 `boundary` 字段删除，`speaker` 一并改派生；角色名词由席级 `roleKind` 覆盖（答辩方 / 阅读取证员）。凭证见各席 evidence.json 末条 changes；`S6-TC-G03` 加「席 JSON 不得自带 `boundary`」守卫。 |

## 二⁗、P4 D6b 补丁：边界之外的权限句（2026-11-11；G01 记账位）

| 卡 | 差异 | 说明 |
|---|---|---|
| agents/evidence-reader.md | 职责段「约束」首词 `只读取证` → `取证通读` | 边界段修好后，同一张卡的「职责缘由」（`docs/agents/evidence-reader.md`）仍写「不改任何文件」——该席已是 `sdet` + `Write` + 唯一落点 `evidence.md`。现职责缘由改为「产物只有 `evidence.md`」；`S6-TC-G03` 新增全卡判据：写席的席数据 / docs 投影 / 模型数据三面不得出现「不得创建、修改、删除任何文件」「不改任何文件」「只读评审角色」「只读席位」等全称否定，防止同类漂移从 `## 边界` 以外的段复发。 |

## 三、P4 D6b 复核收口：hostRule 单一文本 + 权限词表单源（2026-11-11；G01 记账位）

| 卡 | 差异 | 说明 |
|---|---|---|
| agents/evidence-reader.md | 边界「禁止写」句改由 `{host}` 占位替换（称谓 = 议会程序账本席），并恢复「段二 / 段三由…从责任席的产出转录」半句 | 复核问题 2：席级不再整句复制 `review.ledger.hostRule`，共享句只有一份文本 |
| agents/speaker.md | `不得填写两张审计表` → `不得替他席填写两张审计表（两张审计表只由责任席填写）` | 复核问题 3：恢复「不得代填」原语义，不再为绕开散文探针 `代填` 而收紧规则 |

## 四、S3 约束登记表：`duty.constraint` → `duty.constraints[]`（2026-11-12；G01 记账位）

| 面 | 差异 | 说明 |
|---|---|---|
| agents/ 全席卡 | **卡面 0 变化** | 18 席 `duty.constraint` 改登记 id 列表，文本由 `policy/definitions/constraints.mjs` 查表派生后仍写回 `duty.constraint`；渲染输出逐字节不变——C02 用 `git show $BASE:agents/*.md` 的 Buffer 比对，C03 用 `fixtures/*.evidence.json` 的 `renderSha256` 交叉核对，两侧均全等，故本批**未重出任何卡**。 |

