# 阶段 3：skill 全面改造 + 下沉承接

> 所属项目：[rule 改造总纲](./index.md)｜前置：[阶段 2](./stage-2-new-mode-pilot.md) 完成
> 推迟依据（2026-11-05 裁定）：现有 19 个 skill 是老模式（散文卡面、manual 判据），将向判据引擎模式大改——12 条下沉内容届时一起改造，**同一内容只改一遍，不做二次搬家**。阶段 1 至本阶段之间，未承接内容的唯一真相位 = bak（`docs/bak/rules/`）；已承接项（见 §2「现状」列）以承接文件为准——**不得再从 bak 反向复制，否则变成第二份真相**。

## 1 完成事项

1. **19 个老 skill 向新模式改造**（见 §3 改造原则）。
2. **12 条下沉内容承接**（见 §2 对照表，逐条落到承接位；义务句按 [阶段 1 附录](./stage-1-rules-exit.md) 原始盘点提取）。
3. **powershell-file-encoding 落独立编码备忘**（references 单文件，不立 skill 容器——0 触发面）。
4. 承接完成后：bak 各份的承接对照表补 `path:line` 指向实际承接文件。

## 2 下沉承接对照表（12 条，零遗漏判据）

| # | rule（原字符） | 承接位置（具体文件） | 承接要点 | 现状（2026-11-08 核） |
|---|---|---|---|---|
| 4 | `core-working-principles`（2,338） | `skills/dev-workflow/references/meta-working-principles.md`（不新立 skill 容器） | 画全貌 + 写计划 + 算长远账；自省长期方案按「工程化→规则→技能」落载体 | 已承接（2026-11-08） |
| 7 | `plain-language-to-user`（570） | `skills/plain-language/SKILL.md`（**阶段 2 已建**——本阶段核对承接完整） | 四义务 + 冲突裁决 | 已承接 |
| 8 | `reference-read-output-loop`（1,092） | `skills/carrier-conventions/references/reference-loop.md` | 「读 reference」必须接产出闭环——「按 X 执行，产出 Y，缺 Y 不合格」 | 已承接 |
| 9 | `skill-authoring-convention`（2,384） | `skills/carrier-conventions/references/skill-structure.md` | 禁文件路径指路；脚本守卫免疫路径（realpath 双归一） | 已承接 |
| 10 | `skill-assets-convention`（1,167） | `skills/carrier-conventions/references/skill-structure.md` | 官方标准目录语义；骨架不内联 SKILL.md | 已承接（与 #9 合并为一份） |
| 11 | `observable-criteria`（2,123） | `skills/carrier-conventions/references/observable.md` | 每个评价能被机器退出码判死；执行仍在 `check-observable.mjs` + 门禁 ⑦ 段 | 已承接 |
| 12 | `spec-testcase-gate`（2,142） | `skills/carrier-conventions/references/spec-testcase-gate.md` | 五条判据：同批独立 testcase、senior-sdet 独立写、五要素、外链、一起送审 | 待建 |
| 13 | `dev-workflow-mainline`（5,172） | `skills/dev-workflow/SKILL.md`（段表 + 签字节 + 义务边界）+ `skills/dev-workflow/references/gate-record-template.md` | 五段主干 + 出口签字（**R1–R9**，机械判据由 `check-gate-record.mjs` 承担；**references 只给模板指针，不贴六列样例表**——撞 R9 红） | 已承接（2026-11-08：义务边界 + R1–R9 + 活载体守护 TC-A15） |
| 14 | `landing-sweep`（958） | `skills/dev-workflow/references/landing-sweep.md` | 落地后回头扫四类声明处 | 已承接（2026-11-08） |
| 15 | `docs-convention`（13,053，**拆两半**） | 目录/命名/`.session`/`docs/bak` 语义 → `skills/writing-after-docs/SKILL.md`；「rule 里放什么」→ `skills/carrier-conventions/references/rule-content.md` | 拆分承接。**不搬两句（均已从原规则删除，2026-11-05）**：① `.session/sdd-*` 的「留档迁 `docs/superpowers/sdd/`」（该目录不存在，留档归插件自己的 `.superpowers/sdd/`）；② 「`.superpowers/sdd/` 实测当前是空壳：1 个文件」（实测 13 个任务目录，该断言已过期） | 部分承接（「rule 里放什么」已落 `rule-content.md`；`writing-after-docs` 待建） |
| 16 | `rules-single-source`（477） | `skills/carrier-conventions/references/single-source.md` + `skills/use-rule-skills/SKILL.md` | 只建源仓库、运行时只读；增删后跑 `aas sync` | 已承接 |
| 22 | `powershell-file-encoding`（1,125） | `skills/carrier-conventions/references/powershell-encoding.md`（references 单文件，不立容器） | 禁 `-Encoding UTF8`（写 BOM）；`WriteAllText(..., UTF8Encoding $false)` | 待建 |

## 3 skill 改造原则（老模式 → 判据引擎模式）

1. **判据分流**（与 rule 侧同款三问）：能写成「出现 X 且缺 Y = 违规」的可机判条目 → 判据引擎（判据 json + 独立 testcase）；语义判据 → AI 判 + residual 登记；流程编排 → skill 骨架本体。
2. **本体短**：skill 正文只留触发 + 流程骨架 + 指针；手册、模板、清单进 references（厚内容不罚钱——按需加载）。
3. **单源渲染**：判据变更改数据（判据 json），卡面/正文由渲染产出，手改即红——沿用 docgen 管线「数据 → 渲染 → 生成物」既有模式。
4. **判心登记**：各 skill 内 AI 判项逐条配 `residual{who, sample, fields, 客观化路径}`——老模式连这层都没有，逐条补齐。
5. **三类不进判据引擎**：语义判据（讲透/合理）、流程编排（时序依赖）、模板/知识样例（无违规形态）——各归 skill 骨架 / references。

## 4 验收

| # | 判据 | 判定动作 | 目标 |
|---|---|---|---|
| S-1 | 承接零遗漏 | §2 对照表 12 条逐条 `path:line` 可指到实际承接文件（路径已点名，缺文件即红） | 12/12 |
| S-2 | 义务句无丢失 | 对照 [阶段 1 附录](./stage-1-rules-exit.md) 义务盘点逐条核对承接处覆盖；`dev-workflow` 按原文 R1–R9 **九条**逐条对（含 R9 技能包不装项目账） | 0 丢失 |
| S-3 | bak 对照表补全 | 12 份 bak 的承接对照表行指向实存文件（hash 四件套或 path:line） | 12/12 |
| S-4 | skill 判据登记 | 每个 skill 的可机判条目在判据引擎有登记且 testcase 全绿 | 全绿 |
| S-5 | 判心 residual 齐 | 每个语义判项有 residual{who, sample, fields, 客观化路径} | 齐备 |
| S-6 | powershell 编码备忘 | 独立 references 文件存在且可检索 | 存在 |

> **当前进度（2026-11-08）**：S-1 是阶段 3 完成后的判据，不是当前状态。§2 现状列：9 条已承接（#4 / #7 / #8 / #9 / #10 / #11 / #13 / #14 / #16），1 条部分（#15），2 条待建（#12 / #22）；逐项 `Test-Path` 可核。
