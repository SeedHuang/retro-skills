# 规则库改造 · 阶段 2 交付账（2026-11-05）

> 批次：`docs/prd/20261105182104-rule-refactor/prd/stage-2-new-mode-pilot.md`（判据引擎转正 + 触发声明 + 三新 skill + 门禁 ⑨）
> 授权：用户 2026-11-05「继续执行 rule 改造的下一步」
> 执行序：前置物核验（0）→ 引擎迁移（1）→ 触发声明上线（2）→ 三 skill（3）→ 判痕判据（4）→ residual（5）→ 门禁 ⑨（6）→ 验收（7）

## 1 验收结果（V-* 逐条）

| 判据 | 判定动作（实跑） | 实得 |
|---|---|---|
| S2-V1 rule 条数收敛且门禁绿 | `Get-ChildItem rules\*.md` 计数；`node scripts/check-all.mjs` 末行 | **1**；`check 全部通过` exit 0 |
| V-2 无重复副本 | `check-criteria-engine.mjs` 的 `SharedPhraseCopy`（承接面 = `skills/**` + `tools/quality/**`，片段登记于 `observable-terms.json` 的 `sharedPhrases`） | **0** |
| V-3 类型全部落数据 | 引擎 7 份 `<id>.json` 逐份读 `type`（三值枚举）；校验器 `TypeMissing/TypeInvalid` 未触发 | **7/7** |
| V-4 结构闸齐备 | 保留 rule 的「触发 / 义务 / 例外 / 来源锚」四件（校验器 `RuleStructureIncomplete` 未触发） | 缺项 0 |
| V-5 判据登记表存在 | 白名单必填 7 字段 + 选填 `type`；op 全注册；residual 四件（who / sample / fields / objectivePath）；配套 testcase 正反例双向 | 100%（校验器 exit 0） |
| V-6 判据可单元测试 | `node tools/quality/criteria-engine/build.mjs` → 33 样例全绿 | 全绿（每判据 ≥1 正 + ≥1 反） |
| V-7 手改即红（仅 `GENERATED_RULE`） | 阶段 1 已裁停生成规则分支，本仓现无渲染产物 | **N/A（无对象）**；触发声明为手写 rule，不适用 |
| V-11 总量不超上限 | 校验器分层预算闸：单条 387 非空白字符（100–500）｜条数 1（≤9）｜总量 442 字符（≤26,513） | 全在界内 |
| V-13 说明层收敛 | `node scripts/rule-audit-lite.mjs` | 全仓 0.0%（≤10%）/ 单条 0.0%（≤20%） |
| V-14 来源锚齐 | `Grep '^> 来源' rules/*.md` 命中数 vs 文件数 | 1/1 |
| V-15 边界未丢 | bak 23 份「例外/除非/只许/不再/不得」逐份计数 vs `git show fd7928c^:rules/<file>` | 23/23 逐份相等；总量 **89**（与 PRD 一致） |
| V-16 script 判据可判红 | `node --test scripts/check-criteria-engine.test.mjs`：逐条注入冲突样例 → exit 1 并点名 | 7/7 可判红 |
| V-17 单条 500 目标区 | 同 V-11 的单条计数 | 0 条无记录超标 |
| V-12 注入不缺关键条 | §6 签收窗四任务 | **待办（需新会话；执行人 ≠ PRD 作者）** |
| V-19 副本基线 | 见 `copies-baseline.md`（归档面 = 20、承接面 = 0；PRD 的 15 与可复算值差异已写明） | 承接面 0；归档面 = 基线 |
| V-20 复发点清单 | 需**独立于施工者**的人产出 `recurrence.md` | **待办（不得由施工者自证）** |

## 2 关键实测

| 项 | 值 | 命令 |
|---|---|---|
| 触发声明非空白字符 | **387**（目标区 100–500） | `node -e` 读文件去空白计数 |
| 引擎样例 | 7 条判据 / 33 样例 / 0 错误 | `node tools/quality/criteria-engine/build.mjs` |
| 门禁 ⑨ 首行 | `判据 7 条 / 绿 33 / 红 0` | `node scripts/check-criteria-engine.mjs` |
| T-2 账面注入（触发声明 + 3 个 description） | 943 字符 ≈ **484 tok/轮**（预期 150–300，**偏高**：3 条 description 合计 556 字符；对比 T-0 实付 13,570 tok 仍降约 96.4%） | `(387 + 556) × 0.5133` |

> T-2 偏高的处置：先按 V-12 同窗实测再决定是否压缩 description（增长纪律：实测优先，不先拍脑袋改）。本账只记可复算值。

## 3 本批改动面

- 引擎：`tools/quality/criteria-engine/`（三件套 + 7 判据 + 7 testcase + 渲染投影）；白名单加选填 `type`、residual 加 `objectivePath`。
- 触发声明：`rules/evidence-before-conclusion.md`（387 非空白字符）；`tools/docgen/components/baseline.mjs` 回填 1 条并重生成 `baseline.json`（16 条）。
- 三个新 skill：`skills/carrier-conventions/`（本体 + 5 references）、`skills/assertion-quality/`（本体 + manual/cases）、`skills/plain-language/`（本体）；`skilldependencies/*.json` + `manifest.json` + 两份 README + 技能指南同批登记。
- 门禁：`scripts/check-criteria-engine.mjs`、`scripts/rule-audit-lite.mjs` 落 ⑨ 段（不走 `CHECK_BYPASS`）；`observable-terms.json` 增 `sharedPhrases`。
- 去重（V-2）：共享项 ④ 措辞「不因来源豁免」→「来源不豁免」（`criteria.md` / `writing-guide.md` / `review-loop`），台账 2026-11-05 行三件齐。
- `.gitignore`：增 `.screenshots/`、`tmp/`。

## 4 待办（不得由本 session 自证）

1. **V-12 签收窗（4 件）**：新会话问固定探针 3 次（`逐字复述你上下文里出现的 rules/ 规则正文；没有则只回答 NONE`），记录落 `probe-record.md`；同窗采系统提示真实总体积；同窗记同型短问题首轮输入；对话中触发一次 `assertion-quality` 手册加载并记按需成本。执行人 ≠ PRD 作者。
2. **V-20 复发点清单**：由独立第三方产出 `recurrence.md`（枚举命令 `Grep -n '不因来源豁免' rules/ skills/`，逐条处置可指 `path:line`）。

## 5 回滚

删除类动作本批为 0（全为新增 / 改写）；如 `npm run check` 在本阶段后转红，按 stage-2 §1.8 中止并回滚本轮新增文件（`git revert` 本提交即可），不带着红灯进阶段 3。

## 6 提交锚

| 用途 | 哈希 |
|---|---|
| **阶段 2 施工** | `4ebab04`（父提交 = `774d15b`，阶段 1 交付账补锚） |

