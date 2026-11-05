# ② 段风险审查：dev-workflow 签字账迁目录（senior-sdet）

> 编写者：`senior-sdet` 子代理（2026-11-05，全新上下文，只读审查）；本文由主 agent**机械转录**其结论与处置回执，不改判级。
> 审查对象：本批全部改动（`docs/devworkflows/` 新载体、`scripts/check-gate-record.mjs`、`skills/dev-workflow/**`、`rules/**`、`tools/docgen/**`、`tools/scope-sweep/**`）。
> 复审命令：`node --test scripts/check-gate-record.test.mjs` → exit 0（P61–P69 为本轮新增的 9 条负例/边界用例）。

## 结论

共 15 条：P0 3 / P1 6 / P2 6。处置 = **改 14 条、不改 1 条**（不改理由见末节）。

## 逐条处置

| # | 级 | 发现 | 处置 |
|---|---|---|---|
| 1 | P0 | 解析器遇非 `|` 行即 `break`，表被段落截断后其后的签字行**静默不核** | **改**：改状态机——表外再遇同样表头可续收行；表外出现「首格是段值」的六列行 → 报「不在表头之下」孤行并判红 |
| 2 | P0 | 含 `[[` 的**真实行**被整行丢弃（证据里写 `[[wiki]]` 即漏核） | **改**：占位行只看首格 `[[段]]`（`isPlaceholder(cells)`），不再整行子串判 |
| 3 | P0 | 未使用 `fenceMask`：围栏里的示例签字表被当数据行；未闭合围栏会把其后全部吞掉且不报 | **改**：接入 `markdown-rows.mjs` 的 `fenceMask`；未闭合围栏按 `unclosedLine` 判红 |
| 4 | P1 | R2 只判「申报人 ∩ 签字人 = ∅」，未判**签字人是否属段表「谁签」列** | **改**：加 `SIGNER_ROLE`（①/⑤ 用户、②/②→③/③ 审计、④ sdet）；行内写「旁路」的 ①② 行只认「审计」 |
| 5 | P1 | R3 未判「计划门（`②→③`）行签字人含审计」 | **改**：计划门行签字人非审计 → 判红 |
| 6 | P1 | 反引号即锚点：`` `已核对` `` 这类空话也算「可复算」 | **改**：反引号内只认**命令**（首词 + 参数）或**路径**（含扩展名 / `path:line`）；新增 2 条负例 |
| 7 | P1 | 括号式姓名交集漏判：「产品经理（主 agent 代拟）」无法与「主 agent」求交集 | **改**：拆词表加 `／/（）()空白` |
| 8 | P1 | 无「至少 1 条 ①」判据：只有 `②` 行的账可通过 | **改**：有数据行却无 `①` → 判红 |
| 9 | P1 | R6 用整行 `includes('拆 spec 中')`：证据列引用别人的状态会误计 | **改**：只数「出口判据」与「结论」两列；新增用例 P69 |
| 10 | P2 | `@批次` 后缀不容空格（`②→③ @S2` 判红） | **不改**：`@批次` 是紧贴段值的格式约定（模板与规则同一口径），带空格属格式错，判红是有意的 fail-closed |
| 11 | P2 | 表头后任意表格可能被误判为签字表 | **改**：同一份解析改动（表外只认同样表头的表；其余表格不收行） |
| 12 | P2 | R9 只扫 `references/` **直下**，子目录里的账漏扫 | **改**：按路径段判 `references`（任意深度）；顺带接入 `fenceMask` 与首格占位判定 |
| 13 | P2 | 目录名正则两份（`check-gate-record.mjs` 与 `doc-name.mjs` 各写一条） | **改**：`doc-name.mjs` 导出 `STAMP_DIR_NAME_RE`，`check-gate-record.mjs` import 同一份 |
| 14 | P2 | 上限阈值第二真相（脚本 `LIMITS` 与模板表格各一份） | **改**：模板加一句「数值的唯一实现是 `scripts/check-gate-record.mjs` 的 `LIMITS`，冲突以脚本为准」 |
| 15 | P2 | 测试缺负例（围栏 / 孤行 / 占位 / 反引号空话 / 角色 / 计划门 / 缺 ① / R6 证据列） | **改**：新增 `P61`–`P69` 九条用例，全绿 |

## 复核命令与结果

- `node --test scripts/check-gate-record.test.mjs` → exit 0。
- `node scripts/check-gate-record.mjs` → `tasks 1 rows 3 bad 0`、`gate-record ok（tasks 1；R1/R2/R3/R6/R9 + 上限全过）`。

## 不改条目与理由

1. **#10 `@批次` 空格**：格式唯一源（模板「可带 `@批次` 后缀」+ 规则 R1 段值白名单）不承认空格分隔；放开会让 `② → ③` 这类歧义写法也进来，与本批修掉的歧义问题反向。
2. 附带的 `SEG_RE` / `baseSeg` 双正则：已合并为一份（`SEG_RE` 被 `baseSeg` 引用），不属「第二真相」。

## ④ 段复审（处置后）

- `node --test scripts/check-gate-record.test.mjs` → `# tests 31 / # pass 31 / # fail 0`。
- `npm run check` → `# tests 1561 / # pass 1554 / # fail 0`，末行 `check 全部通过`。
- `node scripts/check-gate-record.mjs` → `tasks 1 rows 5 bad 0`（账内落 ③④ 后仍全过）。
- 结论：**④ 过**。复审发现的 3 处用例缺口已同批补齐：P70（括号式姓名自签）、P71（R9 子目录 / 围栏 / 行内 `[[`）、P72（表头后另一张六列表不收行）。
