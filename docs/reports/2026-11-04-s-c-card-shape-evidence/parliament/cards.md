# 原始卡：S-C 卡面形状 spec + testcase（评审轮 1）

> 卡由各评委独立产出，主持人只汇总去重（不改级别、不改证据）。族分组见 `problems.md`。

## 评委名单（轮 1，执行路径 B）

| 席 | 角色卡 | 关注面 | 结论 | 卡数 |
|---|---|---|---|---|
| `reviewer-reader` | `agents/reviewer-reader.md` | 读者可读性 / 可执行性 | FAIL | 4（P0 1 / P1 1 / P2 2） |
| `reviewer-qa` | `agents/reviewer-qa.md` | 判据强度 / 负例 / 可执行性 | FAIL | 5（P0 4 / P1 1） |
| `reviewer-backend` | `agents/reviewer-backend.md` | 落点真实 / 数据链 / 回退 | FAIL | 4（P0 1 / P1 3） |
| `reviewer-ai` | `agents/reviewer-ai.md` | 指令可执行性 / 一致性 / token | FAIL | 5（P0 1 / P1 3 / P2 1） |
| `reviewer-product` | `agents/reviewer-product.md` | 需求覆盖 / 缩水 / 越界 / 价值 | FAIL | 5（P0 2 / P1 2 / P2 1） |
| `detective-observer` | `agents/detective-observer.md` | 行为核对 | 待轮 1 后 | — |

**合计 23 张**：P0 **9** / P1 **10** / P2 **4**。5 席全 FAIL（P0 非零）。

## 卡原文（按评委）

### `reviewer-reader`（PASS→FAIL：1 P0）

- **R-1｜P0** 表头挂进「判据」列却无「判定取值」主语、也无「写回哪」→ 缺陷 1 以新形态存活。证据 `spec:57`（表头行）vs `PRD:13`。解法：`VERDICT_HINT` 以「判定取值：」开头；本席清单段首给「写回哪」的指针。
- **R-2｜P1** `duty.action` 可出「结论写回本席产物」这类句式合格但空转的卡。证据 `spec:96`/`spec:28`/`spec:178`。解法：逐席写具体产物名，并把「产物名非占位」列为机械判据。
- **R-3｜P2** `trigger.kind` 四值中文判据只住脚本，维护者无文档可读。证据 `spec:104-109`。解法：脚本文件头 + spec §11.5 表（已满足）。
- **R-4｜P2** 表头一行过长且因「逐字含派生串」不可压缩。证据 `spec:57`/`spec:80`。解法：压掉 na 从句。

### `reviewer-qa`（FAIL：4 P0 + 1 P1）

- **Q-1｜P0** `S2-TC-B08` 的副本探针被错指到 `hostTerm` 用例（SC-TC-47），`VERDICT_HINT` 探针零断言 → 即便渲染器改读字面串也全绿。证据 `testcase:817` vs `spec:74`。
- **Q-2｜P0** 删表头一值的负例期望 `ok 14 / bad 1`，但 `checkTable()` 是 15 席共用 → 实际 `bad 15`。证据 `testcase:257` + `renderCard.mjs:117`。
- **Q-3｜P0** SC-TC-26（`right === 13`）与 SC-TC-45（行 17 / 次 18）是**改前基线**，施工后必翻红 → V3 拿不到 `# fail 0`。证据 `testcase:424`/`:633`。
- **Q-4｜P0** 「手写串必红」负例缺失（spec §11.10-2 点名三红里只落两种）。证据 `testcase:249`/`:268`。
- **Q-5｜P1** `COPY` 内取模块值只能 `runEsm`（`node --input-type=module -e`），恰被 §0 禁作判据；`coldRepo` 回 CLI 结果且删副本，「import 副本」不可实现。证据 `testcase:21-22`/`:191`。

### `reviewer-backend`（FAIL：1 P0 + 3 P1）

- **B-1｜P0** 施工清单漏 4 处既有断言 → 照做必红：`sa-data-layer.test.mjs:47`（`shared.json` 恰 3 键）、`pilot-data.test.mjs:25-26`（`trigger` 键集 + `when` 逐字）、`s2-card-rewrite.test.mjs:734`（`F05` 的 `CC.TRISTATE[0]`）。证据 = 三文件原文（已复核）。
- **B-2｜P1** §11.4 把 `reviewer-audit` 的 `when` 改写成 dispatch 语，与 §11.5 的 `occasion` 判据相反 → `kinds {dispatch:11,occasion:1}` 与「四值全用上」不可同时成立。证据 `spec:95`/`spec:107`/`reviewer-audit.json:123`。
- **B-3｜P1** `replace --yes` 照抄会被拒（缺 `--expect-change`/`--rejudge`/`DOCGEN_JUDGED_BY`），且 `fixtures/*.evidence.json` 必变却不在落点表。证据 `tools/docgen/cli.mjs:543-560`。
- **B-4｜P1** 同 Q-3（testcase 现值断言未归一次性档）。

### `reviewer-ai`（FAIL：1 P0 + 3 P1 + 1 P2）

- **A-1｜P0** 同一组 `hit`/`miss`/`na` 在卡上被两处互斥命名（「产物字段名」vs「判据取值」）；被删原句里的「缺 reason = 废卡」在新值里不存在。证据 `agents/reviewer-ai.md:79`（← `renderCard.mjs:98`）/`spec:57`。
- **A-2｜P1** 表头英文三值 + 动作行中文三态 = 第三套说法；守卫只拦英文。证据 `spec:96`/`spec:166`。
- **A-3｜P1** 13 席共用一句模板 → 动作行同质化，「写回⟨本席产物⟩」无登记约束。证据 `spec:96`。
- **A-4｜P1** `kind` 不进卡面 + `occasion` 席的 `when` 被改成 dispatch 语 → AI 会按 dispatch 等点名。证据 `spec:114`/`spec:95`/`spec:107`。
- **A-5｜P2** 无 token 记录（其自测：删 5 行 −33/卡，动作行 +26/卡，基本抵消）。证据 spec/testcase 均无字符对比。

### `reviewer-product`（FAIL：2 P0 + 2 P1 + 1 P2）

- **P-1｜P0** PRD §9③ 的宾语是 `checkItem`，spec 只禁字段 + 表头声明，D6 的「4 条缺返回」零处置且未写进「不在这一轮」→ 静默丢。证据 `spec:31`/`PRD:33`。
- **P-2｜P0** 全文无回退节；PRD 给的回退只覆盖生成物。证据 `PRD:121` vs `spec:38-47`。
- **P-3｜P1** spec 就地改 PRD V9 词面（`20 年经验` → `20 年`）。证据 `spec:140`/`PRD:149`。
- **P-4｜P1** 无量化基线；PRD §8 冻结基线（15 卡 SHA / `# tests` / `cases 80` / 观测项 245–522 与 65–136）未被承接。证据 `spec:7`/`PRD:123`。
- **P-5｜P2** Q4 的「条数 ≤ 5」被「不适用」消化，`每项 ≤ 20` 移到 PRD 未点名的 `categories[].label`。
