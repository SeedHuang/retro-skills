# testcase 差异清单（spec 对账后）

> 对象：`2026-11-13-rule-agent-render-alignment-design-testcase.md`｜依据：spec §12 的 12 条对账决议。
> 只列 spec 对账后对 testcase 的改动，不复制用例全文。

| # | TC | 改前 | 改后 | 理由 |
|---|---|---|---|---|
| 1 | TC-04 | `rg -n "renderDoc" tools/docgen --glob "*.mjs"` | 追加 `--glob "!*.test.mjs"` | spec D2：扫描只针对生产 `.mjs`；测试文件可在负例描述中出现 `renderDoc` |
| 2 | TC-21 | `build.mjs --data-dir tmp/.../full` | 追加 `--out-dir tmp/.../full/out --rules-dir tmp/.../full/rules` | spec D5：`--data-dir` 只重定向输入；全量 build 测试需同时重定向输出，才能保证仓内 sha256 不变 |
| 3 | TC-43 | 只记 `DOCGEN_RULES_DIR` / `DOCGEN_AGENTS_DIR` | 追加 `DOCGEN_BASELINE_PATH` / `DOCGEN_TMP_ROOT` | spec D9：gate 基线与 tmp 根也可重定向；M0a 洁净判定需记录四个 env |

未改动：TC-15/16 的 `schema.mjs` 导入（spec D3 已采纳）、TC-24/25/26 的非 registered 基准（spec D1 已采纳）、TC-37 的字面量断言（spec D10 已采纳）。

## 第 1 轮互审（16:25:05）

testcase 作者复读 spec 后判 FAIL，提出 5 条必须改；spec 作者复核后确认其中 3 条为已落地、2 条为真实冲突。处置如下：

| # | TC | 改前 | 改后 | 理由 |
|---|---|---|---|---|
| 4 | TC-27 | dormant `import-guard --preview` 期望 0 | 改 registered `evidence-before-conclusion --preview` | spec D6：preview 只对 registered |
| 5 | TC-28 | 仅 `no-such-rule --preview` | 追加 dormant `import-guard --preview`，两例均 exit 2 | 覆盖 dormant preview 负例 |
| 6 | TC-16 | `validate(rule)` 单参、期望 `[]` | `validate(rule,{testcase,ruleIds})` 期望 `[]`；另跑 `validate(rule)` 期望 `MissingTestcase` | spec D3/D4：返回数组、无 testcase 返回 MissingTestcase |
| 7 | TC-02/22/29/34 | 写死 `baseline 19/19` | `baseline N/N`，N = 18 + `BASELINE_RULES.length`（当前 19） | spec D7：不得写死 19 |
| 8 | TC-24 | 只写「现状不满足」 | 改为「改造后应满足；现状不满足属 M3 实现项」 | 与 spec D1 的可执行判据对齐 |

已落地、无需再改：TC-04 已在第 83 行加 `--glob "!*.test.mjs"`；TC-21 已在第 100 行加 `--out-dir/--rules-dir`；TC-43 已在第 122 行补两个 env。testcase 作者第 1 轮引用的是改前文本，第 2 轮以当前文件为准复核。

## 第 2 轮互审（复评）

testcase 作者复评 7 项整改全部落地；新发现 1 条真实冲突 + 1 条建议：

| # | TC | 改前 | 改后 | 理由 |
|---|---|---|---|---|
| 9 | TC-18 | `validate(rule)` 单参，期望 18 份 0 条 | `validate(rule,{testcase,ruleIds})` | 与 TC-16 新判据一致；单参必返 `MissingTestcase` |
| 10 | TC-26 | `DanglingBaselineEntry` 或 `缺件` | 只写 `DanglingBaselineEntry` | spec D1 锁定唯一码 |

第 3 轮以当前文件复核 TC-18/TC-26 与其余 7 项。
