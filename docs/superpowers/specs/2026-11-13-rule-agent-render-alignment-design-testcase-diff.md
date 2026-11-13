# testcase 差异清单（spec 对账后）

> 对象：`2026-11-13-rule-agent-render-alignment-design-testcase.md` 与 spec｜依据：spec §12 的 12 条对账决议 + 议会 #2 各轮裁决。
> 只列对 testcase 与 spec 的改动，不复制用例全文。

| # | TC | 改前 | 改后 | 理由 |
|---|---|---|---|---|
| 1 | TC-04 | `rg -n "renderDoc" tools/docgen --glob "*.mjs"` | 追加 `--glob "!*.test.mjs"` | spec §12-DQ2：扫描只针对生产 `.mjs`；测试文件可在负例描述中出现 `renderDoc` |
| 2 | TC-21 | `build.mjs --data-dir tmp/.../full` | 追加 `--out-dir tmp/.../full/out --rules-dir tmp/.../full/rules` | spec §2-D5：`--data-dir` 只重定向输入；全量 build 测试需同时重定向输出，才能保证仓内 sha256 不变 |
| 3 | TC-43 | 只记 `DOCGEN_RULES_DIR` / `DOCGEN_AGENTS_DIR` | 追加 `DOCGEN_BASELINE_PATH` / `DOCGEN_TMP_ROOT` | spec §12-DQ9：gate 基线与 tmp 根也可重定向；M0a 洁净判定需记录四个 env |

未改动：TC-15/16 的 `schema.mjs` 导入（spec §12-DQ3 已采纳）、TC-24/25/26 的非 registered 基准（spec §12-DQ1 已采纳）、TC-37 的字面量断言（spec §12-DQ10 已采纳）。

## 第 1 轮互审（16:25:05）

testcase 作者复读 spec 后判 FAIL，提出 5 条必须改；spec 作者复核后确认其中 3 条为已落地、2 条为真实冲突。处置如下：

| # | TC | 改前 | 改后 | 理由 |
|---|---|---|---|---|
| 4 | TC-27 | dormant `import-guard --preview` 期望 0 | 改 registered `evidence-before-conclusion --preview` | spec §2-D6：preview 只对 registered |
| 5 | TC-28 | 仅 `no-such-rule --preview` | 追加 dormant `import-guard --preview`，两例均 exit 2 | 覆盖 dormant preview 负例 |
| 6 | TC-16 | `validate(rule)` 单参、期望 `[]` | `validate(rule,{testcase,ruleIds})` 期望 `[]`；另跑 `validate(rule)` 期望 `MissingTestcase` | spec §12-DQ3：返回数组、无 testcase 返回 MissingTestcase |
| 7 | TC-02/22/29/34 | 写死 `baseline 19/19` | `baseline N/N`，N = 18 + `BASELINE_RULES.length`（当前 19） | spec §12-DQ7：不得写死 19 |
| 8 | TC-24 | 只写「现状不满足」 | 改为「改造后应满足；现状不满足属 M3 实现项」 | 与 spec §12-DQ1 的可执行判据对齐 |

已落地、无需再改：TC-04 已在第 83 行加 `--glob "!*.test.mjs"`；TC-21 已在第 100 行加 `--out-dir/--rules-dir`；TC-43 已在第 122 行补两个 env。testcase 作者第 1 轮引用的是改前文本，第 2 轮以当前文件为准复核。

## 第 2 轮互审（复评）

testcase 作者复评 7 项整改全部落地；新发现 1 条真实冲突 + 1 条建议：

| # | TC | 改前 | 改后 | 理由 |
|---|---|---|---|---|
| 9 | TC-18 | `validate(rule)` 单参，期望 18 份 0 条 | `validate(rule,{testcase,ruleIds})` | 与 TC-16 新判据一致；单参必返 `MissingTestcase` |
| 10 | TC-26 | `DanglingBaselineEntry` 或 `缺件` | 只写 `DanglingBaselineEntry` | spec §12-DQ1 锁定唯一码 |

第 3 轮以当前文件复核 TC-18/TC-26 与其余 7 项。

## 议会 #2 修复（第 3 批）

| # | TC | 改后 | 理由 |
|---|---|---|---|
| 11 | TC-16 | 完整 -e 脚本 + `validate` 双参 | spec §12-DQ3 |
| 12 | TC-18 | 按 spec 附录 A 生成 18 算子 | 可执行性 |
| 13 | TC-07/08/54 | 去 `\|`；加正例；TC-54 改 `Object.keys` | rg 判别力 |
| 14 | TC-05/32 | 冷仓副本 `keepGit:true`（TC-39 不依赖 `.git`） | 判别力 |
| 15 | TC-21 | 夹具补 `rules.json` + `git status` | 隔离 |
| 16 | TC-40/42/45 | 指向 `scripts/rule-baseline.mjs` | M0 可执行入口 |
| 17 | TC-50/53 | 回滚/联动补三份文档 | D11 |
| 18 | TC-15 | 正则/行为断言 | P2 |
| 19 | TC-25 | 去「按 spec 定义」，指 §12-DQ1 | 未决清零 |

## 议会 #2 第 3 轮修复（第 4 批）

| # | TC / spec | 改后 | 理由 |
|---|---|---|---|
| 20 | spec §5.1 | `dataDir` 定为平铺数据目录（含 `<id>.json` + `rules.json`）；`outDir`=解释器投影、`rulesDir`=注册正文，三者列默认值 | 消除 `dataDir`=仓根二义 |
| 21 | TC-14 | 夹具补 `rules.json`（列出该 id） | 与 spec §5.1 的 `dataDir` 契约一致 |
| 22 | TC-15 | 默认目录断言改 `rg "models.*rules"` 命中，绑定路径不绑定拼接写法 | 避免 `DIR`/`REPO` 写法差异导致假红 |
| 23 | spec 附录 A | 增「最小合法 rule 骨架」（id/impl/type/scope/title/when/assert/residual/refs/landing + manual probe） | TC-18 可直接执行 |
| 24 | TC-18 | 指附录 A 骨架；第 19 份同骨架仅换 `op:"exists"`；断言 `findings[0].code === 'Schema'` | 可执行性 + 单条 finding |
| 25 | spec §4.1 / DQ3 | `validate` 统一 `{code,message}[]`；`checkTestcase` 字符串包成 `Testcase`；无 testcase 返回 `MissingTestcase` | TC-16 的 `x.code` 不假红 |
| 26 | TC-39 | ① 清空 `rules.json` ② 删 `rules/evidence-before-conclusion.md` ③ `baseline --write` ④ 只跑 F09 | 否则 `gate` 先因未登记手写 exit 2，或 573 行 `baseline N/N` 先红，到不了 575 派生断言 |

## 议会 #2 第 4 轮修复（第 5 批）

| # | TC / spec | 改后 | 理由 |
|---|---|---|---|
| 27 | spec §4.1 | `validate` 实现顺序：先 `check`，4 参 `checkTestcase(..., ruleIds ?? new Set([rule.id]), raw)`，字符串包 `Testcase`；无 testcase 追加 `MissingTestcase`；`name = rule?.id ?? 'rule'`；导出 `RuleModel` 本体 | 4 参实参、默认值与不早退 |
| 28 | spec §4.2 | message 改「**含** `缺反例…`」；无 testcase 行注明先跑 `check` | 原字符串带 `<name>: ` 前缀 |
| 29 | spec §4.2 | 夹具段补 `<id>.json` + `rules.json`，并注明基地取附录 A 骨架 | 与 §5.1 及 TC-14/17 对齐 |
| 30 | spec §5.1 | 增：outDir/rulesDir `mkdirSync(recursive)`；严格 argv；缺 rules.json → `InvalidInputPath` stderr exit 2；env 只在 build main 读；透传点显式传参 | 消除实现二选一 |
| 31 | spec §10 | coldRepo 定版 `keepGit=false` 参数；check-all 清洗清单列 7 个 env | 夹具能力与 env 泄漏 |
| 32 | spec §8 | 增「§5.1 build 目录参数 → TC-14/15/21」映射 | 覆盖账 |
| 33 | TC-20 | `-e` 改为 `readFileSync(process.argv[1])` 读夹具；夹具命名 a/b | **P0**：原命令 `tc` 未定义 |
| 34 | TC-16 | 增负例：缺反例 testcase → `code==='Testcase'` 且 `JSON.stringify(f)!==c` | 原断言 `[]===[]` 恒真 |
| 35 | TC-14 | 增 b 分支：删 `rules.json` → exit 2 + `InvalidInputPath` + sha256 不变 | 补 §5.1 新契约覆盖 |
| 36 | TC-21 | 断言 `full/out/<id>.md` 与 `full/rules/<id>.md` 各 1 份且含 fixture label；前置声明两目录不存在 | 漏透传仍绿 |
| 37 | TC-18 | 第 19 份同样配附录 B testcase | findings 恰 1 条 |
| 38 | TC-39 | 清 4 个 env；判据改「F09 not ok + 失败点不在 573」；570 表述改 `scs check observable --check` | 消息文案不属 spec；env 可改重定向 |
| 39 | TC-03/07/08/11/12/13/15/17/28/32/37/42 | 变异改「期望文件改 1 字节」；正例固定 `tmp/fixtures/render/*.mjs`；schema 夹具以附录 A 骨架为基底；TC-15 拆两次 rg；TC-28 补 `--kind rule` 并允许空目录；TC-32/TC-05 用 `coldRepo({keepGit:true})`；TC-37 跑字面量数组正则；TC-42 断 exit 2 | 判别力/假红/夹具 |
| 40 | diff 头 | 改「testcase + spec 改动」 | 与第 4/5 批实际内容一致 |
| 41 | TC-20 | 尾参保留 `$(cat <夹具路径>)`，脚本改回 `JSON.parse(process.argv[1])` | 第 5 轮两席复核：`readFileSync` + 内容是路径契约错，P0 未真修 |
| 42 | TC-14 | 增 c 分支：加 `--bogus` → `InvalidArgs` exit 2 | 补 §5.1 严格 argv 契约覆盖 |
| 43 | TC-16 | 增 c：`validate(r,{testcase:t})` 不传 `ruleIds`，断言不抛 | 补默认值覆盖 |
| 44 | spec §12-DQ3 / diff #14 | TC 编号与 keepGit 口径对齐正文 | 跨章节一致 |
