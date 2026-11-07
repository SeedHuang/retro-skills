# 测试用例：review-ledger-gate.mjs（review 账本轮次账完整性的机器闸门）

> 归属脚本：`review-ledger-gate.mjs`（位于 skills/review-log/scripts/，用法：`node skills/review-log/scripts/review-ledger-gate.mjs <progress.md 路径>`）
> 编写者：`senior-sdet`（实例标识 sd-20261020-a1）｜**独立性声明**：编写者 ≠ 脚本作者（review-ledger-gate.mjs 作者），≠ 施工者；本文件在全新上下文独立编写，用例判据只从脚本头注释 L1-14 的判据与行为推导，不反向放宽判据、不给已有实现盖章。
> 状态：定稿（每条用例五要素齐全；覆盖总表与脚本头注释全部判据一一对应；对应测试已落地 `review-ledger-gate.test.mjs`，24 条全绿）｜最后更新：2026-10-20
> 命名与落点：与脚本同目录；文件名 = 脚本名去掉 `.mjs` 后 + `-testcase.md`。归属技能 review-log。

## 1 覆盖总表

覆盖对象 = `review-ledger-gate.mjs` 头注释 L1-14 列出的全部判据 + 代码行实现。判据出处统一记作「头注释 Lx」或「代码 Lx」。

| 用例 ID | 覆盖的判据（头注释 / 代码行） | 层级 | 正/负 | 判据类型 | 执行方式 | 优先级 |
|---|---|---|---|---|---|---|
| TC-001 | 头注释 L8（HH:MM:SS 合法起止）+ 代码 L91 两侧时间 | 单元 | 正 | 机器 | `node --test skills/review-log/scripts/review-ledger-gate.test.mjs` | P0 |
| TC-002 | 头注释 L8（HH:MM 短格式合法起止） | 单元 | 正 | 机器 | 同上 | P0 |
| TC-003 | 头注释 L8 + 代码 L98-99/L120-121（加粗装饰剥除后判端） | 单元 | 正 | 机器 | 同上 | P1 |
| TC-004 | 代码 L69（括号注释剥除）+ L98-99（装饰 WARN） | 单元 | 正 | 机器 | 同上 | P1 |
| TC-005 | 头注释 L8（显式未取数合法）+ 代码 L96-97（一端未取数 WARN） | 单元 | 正 | 机器 | 同上 | P1 |
| TC-006 | 代码 L80-81（起止整格未取数 WARN） | 单元 | 正 | 机器 | 同上 | P1 |
| TC-007 | 代码 L104-105（两端都标未取数 WARN） | 单元 | 正 | 机器 | 同上 | P1 |
| TC-008 | 代码 L123-124（耗时无 N m 但有说明 WARN） | 单元 | 正 | 机器 | 同上 | P1 |
| TC-009 | 头注释 L9（整格留空 FAIL）+ 代码 L79 | 单元 | 负 | 机器 | 同上 | P0 |
| TC-010 | 头注释 L9（耗时留空 FAIL）+ 代码 L117 | 单元 | 负 | 机器 | 同上 | P0 |
| TC-011 | 头注释 L9（只填一端 X~ FAIL）+ 代码 L89-93 | 单元 | 负 | 机器 | 同上 | P0 |
| TC-012 | 头注释 L9（只填一端 ~X FAIL）+ 代码 L89-93 | 单元 | 负 | 机器 | 同上 | P0 |
| TC-013 | 头注释 L9（裸单时间点无 ~ FAIL，2026-10-20 病根变体）+ 代码 L85-87 | 单元 | 负 | 机器 | 同上 | P0 |
| TC-014 | 头注释 L9（一端格式非法 FAIL）+ 代码 L94-95 | 单元 | 负 | 机器 | 同上 | P0 |
| TC-015 | 头注释 L9（格式非法 FAIL）+ 代码 L108-109（bothEndsPresent 分支） | 单元 | 负 | 机器 | 同上 | P1 |
| TC-016 | 代码 L35-38（未找到轮次账表 exit 2） | 单元 | 负 | 机器 | 同上 | P0 |
| TC-017 | 代码 L43-48（表头缺「耗时」列 exit 2） | 单元 | 负 | 机器 | 同上 | P0 |
| TC-018 | 代码 L35-38（表头行存在但缺「起止」列名 exit 2） | 单元 | 负 | 机器 | 同上 | P1 |
| TC-019 | 代码 L19-22（无参数调用 exit 2 + 用法提示） | 单元 | 负 | 机器 | 同上 | P1 |
| TC-020 | 代码 L25-30（文件读取失败 exit 2） | 单元 | 负 | 机器 | 同上 | P1 |
| TC-021 | 代码 L59-62（轮次账表下无数据行 exit 2） | 单元 | 负 | 机器 | 同上 | P1 |
| TC-022 | 头注释 L11（「起止」「耗时」按列名动态定位，列序调换不静默错位）+ 代码 L42-48 | 单元 | 边界 | 机器 | 同上 | P1 |
| TC-023 | 头注释 L10 软判 ②（轮次账行数 vs 小节数不符 WARN）+ 代码 L129-131 | 单元 | 边界 | 机器 | 同上 | P0 |
| TC-024 | 头注释 L9（只填一端 FAIL）+ 代码 L110-111（无时间点变体，oneSideBlank 之外的路径） | 单元 | 边界 | 机器 | 同上 | P1 |

**覆盖核对**：脚本头注释 L1-14 判据共 4 组（硬判 FAIL 7 项 / 软判 WARN 6 项 / 表头定位 4 项 / 正确放行 5 项），另有 CLI 边界 3 项（无参数、读文件失败、无数据行）与代码分支 2 项（L108-109、L110-111）为自由探索补入。本表覆盖以上全部，24/24；未覆盖 0 项。

## 2 用例明细

### TC-001 HH:MM:SS 完整起止对 + N m 耗时 → 放行 exit 0

- **覆盖**：头注释 L8（起止合法值 HH:MM:SS~HH:MM:SS；耗时合法值 N m）
- **前置**：临时目录下准备 progress.md，含「## 轮次账」小节与标准 5 列表头（轮 / 起止 / 耗时 / 席位 / 本轮核销），1 行数据
- **步骤**：① 写入 `| 1 | 14:00:00~14:10:00 | 10m | 后端 | ✅ |`；② 运行 gate；③ 观察退出码与输出
- **预期**：exit 0；stdout 含「轮次账完整性：1 行全过（0 条软提示）」
- **判据**：`node skills/review-log/scripts/review-ledger-gate.mjs <progress.md>` → 退出码 0，stdout 匹配 `轮次账完整性：1 行全过`
- **红绿证据**：红 = 把起止改成留空（exit 1 + `[FAIL]`）；绿 = 本行完整输入 → exit 0
- **对应测试**：`review-ledger-gate.test.mjs::完整起止对 + 耗时 → exit 0`
- **不覆盖**：HH:MM:SS 与 HH:MM 混用（一端 14:00 一端 14:00:00）——脚本正则两侧独立校验，未单列用例（sidesOk 覆盖），不证明混用被拒

### TC-002 HH:MM 短格式起止对 → 放行 exit 0

- **覆盖**：头注释 L8（起止合法值含 HH:MM~HH:MM）
- **前置**：同 TC-001
- **步骤**：① 写入 `| 1 | 14:00~14:10 | 10m | 后端 | ✅ |`；② 运行 gate；③ 观察退出码
- **预期**：exit 0；stdout 含「1 行全过」
- **判据**：`node skills/review-log/scripts/review-ledger-gate.mjs <progress.md>` → 退出码 0
- **红绿证据**：红 = 短格式被误判 FAIL（正则退化，如只认 HH:MM:SS）；绿 = exit 0
- **对应测试**：`review-ledger-gate.test.mjs::HH:MM 短格式起止对 → exit 0`
- **不覆盖**：HH:MM 与 HH:MM:SS 混用（见 TC-001 不覆盖）

### TC-003 加粗装饰「**14:00~14:10** / **10m**」→ 放行 exit 0 + WARN

- **覆盖**：代码 L69（剥 `**` 装饰）+ L98-99（起止装饰 WARN）+ L120-121（耗时装饰 WARN）
- **前置**：同 TC-001
- **步骤**：① 写入 `| 1 | **14:00~14:10** | **10m** | 后端 | ✅ |`；② 运行 gate；③ 观察退出码与输出
- **预期**：exit 0；stdout 含「起止端带装饰/注释」与「耗时带装饰/注释」两条 WARN
- **判据**：`node skills/review-log/scripts/review-ledger-gate.mjs <progress.md>` → 退出码 0，stdout 匹配 `/装饰/`
- **红绿证据**：红 = 装饰剥除失败导致 `14:00~14:10` 中混入 `**` 被当一端非法（exit 1）；绿 = exit 0 + WARN
- **对应测试**：`review-ledger-gate.test.mjs::加粗装饰「**14:00~14:10**」→ exit 0 + WARN`
- **不覆盖**：嵌套装饰（如 `***14:00***`）——stripDeco 连续替换，未单列用例

### TC-004 括号注释「12:31~16:54（跨 session）」→ 放行 exit 0 + WARN

- **覆盖**：代码 L69（剥中英文括号注释）+ L98-99（装饰 WARN）
- **前置**：同 TC-001
- **步骤**：① 写入 `| 1 | 12:31~16:54（跨 session） | 12m | 后端 | ✅ |`；② 运行 gate；③ 观察退出码与输出
- **预期**：exit 0；stdout 含「起止端带装饰/注释」WARN；耗时列正常无 WARN
- **判据**：`node skills/review-log/scripts/review-ledger-gate.mjs <progress.md>` → 退出码 0，stdout 匹配 `/装饰/`
- **红绿证据**：红 = 注释未剥（`16:54（跨 session）` 被当一端非法，exit 1）；绿 = exit 0 + WARN
- **对应测试**：`review-ledger-gate.test.mjs::括号注释「12:31~16:54（跨 session）」→ exit 0 + WARN`
- **不覆盖**：半角括号与全角括号之外的其它注释形态（如引号、方括号）——脚本只认中英文括号，未单列用例

### TC-005 一端时间一端未取数「13:41~未取数」→ 放行 exit 0 + WARN

- **覆盖**：头注释 L8（显式「未取数」合法）+ 代码 L96-97（一端未取数 WARN）
- **前置**：同 TC-001
- **步骤**：① 写入 `| 1 | 13:41~未取数 | 10m | 后端 | ✅ |`；② 运行 gate；③ 观察退出码与输出
- **预期**：exit 0；stdout 含「起止一端标「未取数」」WARN
- **判据**：`node skills/review-log/scripts/review-ledger-gate.mjs <progress.md>` → 退出码 0，stdout 匹配 `/未取数/`
- **红绿证据**：红 = 一端未取数被误判 FAIL（exit 1）；绿 = exit 0 + WARN
- **对应测试**：`review-ledger-gate.test.mjs::一端时间一端未取数「13:41~未取数」→ exit 0 + WARN`
- **不覆盖**：另一方向「未取数~14:10」——代码走同一分支（sidesOk + includes 未取数），不重复用例

### TC-006 起止整格「未取数」→ 放行 exit 0 + WARN

- **覆盖**：代码 L80-81（ss === '未取数' 整格 WARN）
- **前置**：同 TC-001
- **步骤**：① 写入 `| 1 | 未取数 | 10m | 后端 | ✅ |`；② 运行 gate；③ 观察退出码与输出
- **预期**：exit 0；stdout 含「起止整格标「未取数」」WARN
- **判据**：`node skills/review-log/scripts/review-ledger-gate.mjs <progress.md>` → 退出码 0，stdout 匹配 `/起止整格标「未取数」/`
- **红绿证据**：红 = 整格未取数被误判 FAIL（exit 1）；绿 = exit 0 + WARN
- **对应测试**：`review-ledger-gate.test.mjs::起止整格「未取数」→ exit 0 + WARN`
- **不覆盖**：TC-007 的两端「未取数~未取数」——走 L104-105 另一分支，本用例只覆盖整格单值

### TC-007 起止两端都标「未取数~未取数」→ 放行 exit 0 + WARN

- **覆盖**：代码 L104-105（parts 全为未取数 WARN）
- **前置**：同 TC-001
- **步骤**：① 写入 `| 1 | 未取数~未取数 | 未取数 | 后端 | ✅ |`；② 运行 gate；③ 观察退出码与输出
- **预期**：exit 0；stdout 含「起止两端都标「未取数」」与「耗时标「未取数」」WARN
- **判据**：`node skills/review-log/scripts/review-ledger-gate.mjs <progress.md>` → 退出码 0，stdout 匹配 `/未取数/`
- **红绿证据**：红 = 两端未取数被误判 FAIL（exit 1）；绿 = exit 0 + WARN
- **对应测试**：`review-ledger-gate.test.mjs::显式「未取数」标注 → exit 0 + WARN`
- **不覆盖**：TC-006 的整格单值「未取数」——本用例只覆盖带 ~ 的两端形态

### TC-008 耗时无 N m 但有说明「跨 session」→ 放行 exit 0 + WARN

- **覆盖**：代码 L123-124（cost 非空、非未取数、无 N m → 按未取数理解 WARN）
- **前置**：同 TC-001
- **步骤**：① 写入 `| 1 | 14:00~14:10 | 跨 session | 后端 | ✅ |`；② 运行 gate；③ 观察退出码与输出
- **预期**：exit 0；stdout 含「耗时无 N m 但有说明」WARN
- **判据**：`node skills/review-log/scripts/review-ledger-gate.mjs <progress.md>` → 退出码 0，stdout 匹配 `/耗时无 N m 但有说明/`
- **红绿证据**：红 = 有说明的耗时被误判 FAIL（exit 1）；绿 = exit 0 + WARN
- **对应测试**：`review-ledger-gate.test.mjs::耗时无 N m 但有说明「跨 session」→ exit 0 + WARN`
- **不覆盖**：说明里恰好含「12m」字样（如「约 12m 跨天」）——会命中 `/\d+m/` 走正常路径，未单列用例

### TC-009 起止列留空 → 拦截 exit 1

- **覆盖**：头注释 L9（整格留空 FAIL）+ 代码 L79
- **前置**：同 TC-001
- **步骤**：① 写入 `| 1 |  | 10m | 后端 | ✅ |`（起止留空）；② 运行 gate；③ 观察退出码与输出
- **预期**：exit 1；stdout 含「第 1 轮：起止列留空」FAIL；不出现「全过」
- **判据**：`node skills/review-log/scripts/review-ledger-gate.mjs <progress.md>` → 退出码 1，stdout 匹配 `/起止列留空/`
- **红绿证据**：红（坏账本）= 该行留空 → exit 1 + `[FAIL]`；绿（补上起止）= 同一账本 → exit 0
- **对应测试**：`review-ledger-gate.test.mjs::起止列留空 → exit 1`
- **不覆盖**：起止留空 + 耗时留空同时存在（两条独立 FAIL 均输出，不覆盖叠加场景）

### TC-010 耗时列留空 → 拦截 exit 1

- **覆盖**：头注释 L9（耗时留空 FAIL）+ 代码 L117
- **前置**：同 TC-001
- **步骤**：① 写入 `| 1 | 14:00~14:10 |  | 后端 | ✅ |`（耗时留空）；② 运行 gate；③ 观察退出码与输出
- **预期**：exit 1；stdout 含「第 1 轮：耗时列留空」FAIL
- **判据**：`node skills/review-log/scripts/review-ledger-gate.mjs <progress.md>` → 退出码 1，stdout 匹配 `/耗时列留空/`
- **红绿证据**：红 = 耗时留空 → exit 1 + `[FAIL]`；绿 = 补上 `10m` → exit 0
- **对应测试**：`review-ledger-gate.test.mjs::耗时列留空 → exit 1`
- **不覆盖**：耗时列整格「未取数」（TC-007 已覆盖 WARN 路径）

### TC-011 只填一端「13:41~」→ 拦截 exit 1

- **覆盖**：头注释 L9（只填一端 FAIL）+ 代码 L89-93（oneSideBlank）
- **前置**：同 TC-001
- **步骤**：① 写入 `| 1 | 13:41~ | 10m | 后端 | ✅ |`；② 运行 gate；③ 观察退出码与输出
- **预期**：exit 1；stdout 含「起止只填了一端「13:41~」」FAIL（含缺端提示）
- **判据**：`node skills/review-log/scripts/review-ledger-gate.mjs <progress.md>` → 退出码 1，stdout 匹配 `/只填了一端/`
- **红绿证据**：红 = 该行只填起点 → exit 1；绿 = 补成 `13:41~13:50` → exit 0
- **对应测试**：`review-ledger-gate.test.mjs::只填一端「13:41~」→ exit 1`
- **不覆盖**：`13:41~ `（~ 后带空格）——split 后 trim 成空串，与 `13:41~` 等价，不重复用例

### TC-012 只填一端「~13:41」→ 拦截 exit 1

- **覆盖**：头注释 L9（只填一端 FAIL）+ 代码 L89-93（oneSideBlank）
- **前置**：同 TC-001
- **步骤**：① 写入 `| 1 | ~13:41 | 10m | 后端 | ✅ |`；② 运行 gate；③ 观察退出码与输出
- **预期**：exit 1；stdout 含「起止只填了一端「~13:41」」FAIL
- **判据**：`node skills/review-log/scripts/review-ledger-gate.mjs <progress.md>` → 退出码 1，stdout 匹配 `/只填了一端/`
- **红绿证据**：红 = 该行只填终点 → exit 1；绿 = 补成 `13:30~13:41` → exit 0
- **对应测试**：`review-ledger-gate.test.mjs::只填一端「~13:41」→ exit 1`
- **不覆盖**：起止方向与 TC-011 对称，代码同一分支

### TC-013 裸单时间点无 ~ 分隔「12:39」→ 拦截 exit 1

- **覆盖**：头注释 L9（裸单时间点无 ~，2026-10-20 病根变体）+ 代码 L85-87
- **前置**：同 TC-001
- **步骤**：① 写入 `| 1 | 12:39 | 39m | 后端 | ✅ |`；② 运行 gate；③ 观察退出码与输出
- **预期**：exit 1；stdout 含「起止缺「~」分隔「12:39」」FAIL（提示补「未取数」）
- **判据**：`node skills/review-log/scripts/review-ledger-gate.mjs <progress.md>` → 退出码 1，stdout 匹配 `/缺「~」分隔/`
- **红绿证据**：红 = 裸单时间点（2026-10-20 实测病根：最后一轮只填起点）→ exit 1；绿 = 补成 `12:39~12:50` → exit 0
- **对应测试**：`review-ledger-gate.test.mjs::裸单时间点无 ~ 分隔「12:39」→ exit 1（2026-10-20 病根变体）`
- **不覆盖**：`12:39:00`（HH:MM:SS 裸单时间点）——正则 `/\d{1,2}:\d{2}(?::\d{2})?/` 同样命中、走同一分支，不重复用例

### TC-014 一端格式非法「12:39~12:50abc」→ 拦截 exit 1

- **覆盖**：头注释 L9（一端格式非法 FAIL）+ 代码 L94-95（sidesOk 校验）
- **前置**：同 TC-001
- **步骤**：① 写入 `| 1 | 12:39~12:50abc | 39m | 后端 | ✅ |`；② 运行 gate；③ 观察退出码与输出
- **预期**：exit 1；stdout 含「起止一端格式非法」FAIL（~ 两端应为时间或未取数）
- **判据**：`node skills/review-log/scripts/review-ledger-gate.mjs <progress.md>` → 退出码 1，stdout 匹配 `/一端格式非法/`
- **红绿证据**：红 = 一端带非法后缀 → exit 1；绿 = 改成 `12:39~12:50` → exit 0
- **对应测试**：`review-ledger-gate.test.mjs::无 ~ 分隔的起止「12:39~12:50abc」→ exit 1`
- **不覆盖**：一端为空格「12:39~ 」——空格 trim 后为空，走 oneSideBlank 而非 sidesOk，见 TC-011 不覆盖

### TC-015 起止格式非法「abc~def」→ 拦截 exit 1

- **覆盖**：头注释 L9（格式非法 FAIL）+ 代码 L108-109（bothEndsPresent 分支：两端有值但均非时间格式）
- **前置**：同 TC-001
- **步骤**：① 写入 `| 1 | abc~def | 10m | 后端 | ✅ |`；② 运行 gate；③ 观察退出码与输出
- **预期**：exit 1；stdout 含「起止格式非法「abc~def」」FAIL
- **判据**：`node skills/review-log/scripts/review-ledger-gate.mjs <progress.md>` → 退出码 1，stdout 匹配 `/起止格式非法/`
- **红绿证据**：红 = 两端有值但均非时间格式 → exit 1；绿 = 改为 `12:39~12:50` → exit 0
- **对应测试**：`review-ledger-gate.test.mjs::起止格式非法「abc~def」→ exit 1`
- **不覆盖**：一端时间一端垃圾（走 sidesOk 分支，见 TC-014）；本用例只覆盖「两端都无时间点但都有值」的 L108-109 分支

### TC-016 无表头 → 拒绝 exit 2

- **覆盖**：代码 L35-38（未找到轮次账表 exit 2）
- **前置**：临时目录下准备一份不含轮次账表的 progress.md（如仅 `# 无表头`）
- **步骤**：① 写入内容；② 运行 gate；③ 观察退出码与输出
- **预期**：exit 2；stderr 含「未找到轮次账表」；不产出 FAIL/WARN
- **判据**：`node skills/review-log/scripts/review-ledger-gate.mjs <progress.md>` → 退出码 2，stderr 匹配 `/未找到轮次账表/`
- **红绿证据**：红 = 文档无轮次账表 → exit 2；绿 = 补上标准表头 + 1 行 → exit 0
- **对应测试**：`review-ledger-gate.test.mjs::表头缺失 → exit 2`
- **不覆盖**：表头行存在但列名拼写不同（如「开始时间」）——脚本按「起止」「耗时」字样匹配，视为设计边界，见 §6

### TC-017 表头缺「耗时」列 → 拒绝 exit 2

- **覆盖**：代码 L43-48（colCost === -1 exit 2）
- **前置**：临时目录下准备表头为 `| 轮 | 起止 | 席位 |` 的 progress.md（含「起止」无「耗时」）
- **步骤**：① 写入内容；② 运行 gate；③ 观察退出码与输出
- **预期**：exit 2；stderr 含「轮次账表头缺「起止」或「耗时」列」
- **判据**：`node skills/review-log/scripts/review-ledger-gate.mjs <progress.md>` → 退出码 2，stderr 匹配 `/缺「起止」或「耗时」列/`
- **红绿证据**：红 = 缺「耗时」列 → exit 2；绿 = 补上「耗时」列 → exit 0
- **对应测试**：`review-ledger-gate.test.mjs::表头缺「耗时」列 → exit 2`
- **不覆盖**：缺「起止」列（那是 L35 表头定位失败，见 TC-018）；本用例只覆盖 colCost 缺失的 L45-48 分支

### TC-018 表头行存在但缺「起止」列名 → 拒绝 exit 2

- **覆盖**：代码 L35-38（headerIdx 要求行含「起止」字样，缺则 exit 2）
- **前置**：临时目录下准备表头为 `| 轮 | 耗时 | 席位 |` 的 progress.md（有「轮」无「起止」）
- **步骤**：① 写入内容；② 运行 gate；③ 观察退出码与输出
- **预期**：exit 2；stderr 含「未找到轮次账表」
- **判据**：`node skills/review-log/scripts/review-ledger-gate.mjs <progress.md>` → 退出码 2，stderr 匹配 `/未找到轮次账表/`
- **红绿证据**：红 = 表头缺「起止」列名 → exit 2；绿 = 补上「起止」列 → exit 0
- **对应测试**：`review-ledger-gate.test.mjs::表头缺「起止」列 → exit 2`
- **不覆盖**：完全无表头（TC-016 已覆盖）；本用例特指「表头行在、列名不全」的漏写列名场景（与 TC-016 输入形态不同，代码路径同为 L35-38）

### TC-019 无参数调用 → 拒绝 exit 2 + 用法提示

- **覆盖**：代码 L19-22（缺 target 参数 exit 2）
- **前置**：无（直接在仓库根运行脚本，不带参数）
- **步骤**：① 运行 `node skills/review-log/scripts/review-ledger-gate.mjs`（无参数）；② 观察退出码与输出
- **预期**：exit 2；stderr 含「用法：node skills/review-log/scripts/review-ledger-gate.mjs <progress.md 路径>」
- **判据**：`node skills/review-log/scripts/review-ledger-gate.mjs`（无参数）→ 退出码 2，stderr 匹配 `/用法/`
- **红绿证据**：红 = 无参数调用 → exit 2 + 用法提示；绿 = 带合法文件路径 → 正常执行
- **对应测试**：`review-ledger-gate.test.mjs::无参数调用 → exit 2 + 用法提示`
- **不覆盖**：参数为目录而非文件（readFileSync 对目录在 Windows 抛 EACCES/其它错误，走 TC-020 的读取失败分支，行为平台相关，不单列）

### TC-020 文件不存在 → 拒绝 exit 2 + 读取失败信息

- **覆盖**：代码 L25-30（readFileSync 失败 exit 2）
- **前置**：无（传入一个不存在的路径）
- **步骤**：① 运行 `node skills/review-log/scripts/review-ledger-gate.mjs <不存在的路径>`；② 观察退出码与输出
- **预期**：exit 2；stderr 含「读取 <路径> 失败」
- **判据**：`node skills/review-log/scripts/review-ledger-gate.mjs <不存在的路径>` → 退出码 2，stderr 匹配 `/读取.*失败/`
- **红绿证据**：红 = 路径不存在 → exit 2 + 读取失败信息；绿 = 换成存在的 progress.md → 正常执行
- **对应测试**：`review-ledger-gate.test.mjs::文件不存在 → exit 2`
- **不覆盖**：文件存在但无读权限（权限错误信息平台相关，失败路径同为 L25-30，不单列）

### TC-021 表头存在但无数据行 → 拒绝 exit 2

- **覆盖**：代码 L59-62（dataRows.length === 0 exit 2）
- **前置**：临时目录下准备 progress.md，仅含「## 轮次账」表头 + 分隔行，无任何数据行
- **步骤**：① 写入内容；② 运行 gate；③ 观察退出码与输出
- **预期**：exit 2；stderr 含「轮次账表下无数据行」
- **判据**：`node skills/review-log/scripts/review-ledger-gate.mjs <progress.md>` → 退出码 2，stderr 匹配 `/轮次账表下无数据行/`
- **红绿证据**：红 = 空表 → exit 2；绿 = 追加 1 行数据 → exit 0
- **对应测试**：`review-ledger-gate.test.mjs::表头存在但无数据行 → exit 2`
- **不覆盖**：数据行行号非数字（如 `| 第1轮 | ...`）——L54 要求 `^\|\s*\d+\s*\|` 开头，非数字行被当表结束，未单列用例

### TC-022 列顺序调换（耗时列非固定列位）→ 仍正确判 exit 0

- **覆盖**：头注释 L11（「起止」「耗时」按表头列名动态定位）+ 代码 L42-48（不硬编码列位）
- **前置**：临时目录下准备 progress.md，表头把「耗时」列调到第 3 位（`| 轮 | 耗时 | 起止（HH:MM:SS） | 席位 | 本轮核销 |`），数据行按新列序填写
- **步骤**：① 写入 `| 1 | 10m | 14:00~14:10 | 后端 | ✅ |`；② 运行 gate；③ 观察退出码
- **预期**：exit 0；stdout 含「1 行全过」——列序调换不静默错位
- **判据**：`node skills/review-log/scripts/review-ledger-gate.mjs <progress.md>` → 退出码 0
- **红绿证据**：红 = 若按固定列位硬编码（colCost=3），该表会把「10m」当起止、把「14:00~14:10」当耗时 → 误报「起止格式非法」exit 1；绿 = 按列名动态定位 → exit 0
- **对应测试**：`review-ledger-gate.test.mjs::列顺序调换（耗时列非固定列位）仍正确判 → exit 0`
- **不覆盖**：列名增加前缀/后缀（如「实际耗时」）——`c.includes('耗时')` 仍命中，未单列；列名完全不含「耗时」字样则 exit 2（见 §6 设计边界）

### TC-023 轮次账行数 vs 小节数不符 → 放行 exit 0 + WARN

- **覆盖**：头注释 L10 软判 ②（行数 ≠ 小节数 WARN）+ 代码 L129-131
- **前置**：临时目录下准备 progress.md：轮次账 2 行数据，但「## 第 N 轮」小节只有 1 个
- **步骤**：① 写入 2 行数据 + 仅 `## 第 1 轮` 小节；② 运行 gate；③ 观察退出码与输出
- **预期**：exit 0；stdout 含「轮次账 2 行 vs 「## 第 N 轮」小节 1 个不一致」
- **判据**：`node skills/review-log/scripts/review-ledger-gate.mjs <progress.md>` → 退出码 0，stdout 匹配 `/小节.*不一致/`
- **红绿证据**：红 = 小节数不符未被发现（软判缺失，账本悄悄漏小节）；绿 = exit 0 + WARN 提示
- **对应测试**：`review-ledger-gate.test.mjs::轮次账行数 vs 小节数不符 → exit 0 + WARN`
- **不覆盖**：小节数为 0（sections === 0 时脚本跳过此软判，避免无小节模板误报）——设计行为，不单列用例

### TC-024 无时间点的只填一端「abc~」→ 拦截 exit 1

- **覆盖**：头注释 L9（只填一端 FAIL）+ 代码 L110-111（不含时间点的只填一端，oneSideBlank 之外的路径）
- **前置**：同 TC-001
- **步骤**：① 写入 `| 1 | abc~ | 10m | 后端 | ✅ |`；② 运行 gate；③ 观察退出码与输出
- **预期**：exit 1；stdout 含「起止只填了一端「abc~」」FAIL
- **判据**：`node skills/review-log/scripts/review-ledger-gate.mjs <progress.md>` → 退出码 1，stdout 匹配 `/只填了一端/`
- **红绿证据**：红 = 无时间点的残缺起止 → exit 1；绿 = 改为 `13:00~13:10` → exit 0
- **对应测试**：`review-ledger-gate.test.mjs::无时间点的只填一端「abc~」→ exit 1`
- **不覆盖**：TC-011/TC-012（含时间点的 oneSideBlank 分支）；本用例覆盖不含时间点的 L103-111 分支，消息文案与 TC-011 同为「只填了一端」，靠代码分支区分

## 3 负例与边界

| 用例 ID | 边界/负例是什么 | 为什么容易漏 | 期望行为 |
|---|---|---|---|
| TC-009 | 起止整格留空 | 收尾人赶时间留空格，视觉上「看不出少」 | exit 1 + `[FAIL] 起止列留空` |
| TC-010 | 耗时整格留空 | 2026-10-20 实测病根：耗时是最先被省掉的字段 | exit 1 + `[FAIL] 耗时列留空` |
| TC-011 | 只填起点 `13:41~` | 填了一半被打断，`~` 后忘了补 | exit 1 + `[FAIL] 只填了一端` |
| TC-012 | 只填终点 `~13:41` | 同上，方向相反 | exit 1 + `[FAIL] 只填了一端` |
| TC-013 | 裸单时间点 `12:39` 无 `~` | 2026-10-20 病根变体：以为「填了就行」，无 ~ 时静默放行会漏网 | exit 1 + `[FAIL] 缺「~」分隔` |
| TC-014 | 一端格式非法 `12:39~12:50abc` | 手滑多敲字符，正则两侧校验是唯一防线 | exit 1 + `[FAIL] 一端格式非法` |
| TC-015 | 两端有值但都非时间格式 `abc~def` | 复制粘贴错列/占位符没清，L108-109 分支最容易被重构误删 | exit 1 + `[FAIL] 起止格式非法` |
| TC-016 | 文档无轮次账表 | 模板没带表 / 表头被手改坏 | exit 2 + `未找到轮次账表` |
| TC-017 | 表头缺「耗时」列 | 模板加列/删列后列名不全 | exit 2 + `缺「起止」或「耗时」列` |
| TC-018 | 表头行在但缺「起止」列名 | 手写表头漏写列名，行数还够，最易被当成「有表」 | exit 2 + `未找到轮次账表` |
| TC-019 | 无参数调用 | 收尾时忘了传路径，脚本须给出可执行的用法而非裸奔 | exit 2 + 用法提示 |
| TC-020 | 文件不存在 / 读不到 | 路径写错、跨机器跑时 .session 未同步 | exit 2 + `读取 <路径> 失败` |
| TC-021 | 表头在但无数据行 | 模板建好没填就收尾 | exit 2 + `轮次账表下无数据行` |
| TC-022 | 列顺序调换（动态定位） | 模板调列序后硬编码列位会静默错位，最隐蔽 | exit 0（正确判） |
| TC-023 | 行数 vs 小节数不符 | 补记一行账但漏写「## 第 N 轮」小节 | exit 0 + WARN（软判 ②） |
| TC-024 | 无时间点的只填一端 `abc~` | oneSideBlank 之外的分支，重构时最易被合并漏掉 | exit 1 + `[FAIL] 只填了一端` |

负例 13 条 + 边界 3 条 = 16 条，≥ 正例 8 条（TC-001~008）。

## 4 回归清单

| 如果改了 | 必须重跑 | 为什么 |
|---|---|---|
| `review-ledger-gate.mjs` 的时间点正则 `/\d{1,2}:\d{2}(?::\d{2})?/`（L82/L91） | TC-001、TC-002、TC-013、TC-014、TC-015、TC-024 | 正则决定「含时间点」判定与两侧格式校验，改一处影响六条判端路径 |
| `review-ledger-gate.mjs` 的起止判端分支（L79-114） | TC-009、TC-011、TC-012、TC-013、TC-014、TC-015、TC-024、TC-006、TC-007、TC-005 | 起止列全部 FAIL/WARN 分支，含装饰剥除后的判端顺序 |
| `review-ledger-gate.mjs` 的耗时判据（L117-125） | TC-010、TC-008、TC-003、TC-007 | 耗时留空 FAIL / 无 N m WARN / 装饰 WARN / 未取数 WARN |
| `review-ledger-gate.mjs` 的表头定位（L35-48） | TC-016、TC-017、TC-018、TC-021、TC-022 | headerIdx / 列名动态定位 / 缺列 exit 2 / 无数据行，同一段代码 |
| `review-ledger-gate.mjs` 的 CLI 入口（L17-30） | TC-019、TC-020 | 无参数 / 读文件失败，exit 2 路径 |
| `review-ledger-gate.mjs` 的 stripDeco（L69） | TC-003、TC-004、TC-008、TC-024 | 装饰/注释剥除影响后续全部判端与耗时判定 |
| `review-ledger-gate.mjs` 任何逻辑改动 | 全部 24 条 | 闸门脚本任何行为变化都可能是「坏账被放行」 |

## 5 只手动验证

| 项 | 为什么机器验不了 | 谁验、看什么 |
|---|---|---|
| 真实 review 账本（`.session/reviews/<那一次>/progress.md`）的收尾端到端 | 测试用合成 fixture，真实账本含模板外的历史变体、多轮数据、混合列序，机器用例无法穷举真账本形态 | review 收尾者：收尾时跑 gate，核对 exit 0 + 行数 + WARN 是否合理（如实填了未取数的轮次应见 WARN 但可放行） |

## 6 不测（带理由）

| 不测什么 | 为什么 |
|---|---|
| gate 挂在 `npm run check` 的集成 | 设计上就不挂——头注释 L13 说明 .session/ 在 .gitignore，check-all ④ 段跳过它；测了等于测一个不存在的挂载 |
| `time.mjs` 的取数行为 | 非本脚本职责；time.mjs 是另一个脚本，测试归属其自身 |
| 大文件/性能 | progress.md 行数有限（每轮 1 行），无性能风险 |
| 列名不含「起止」「耗时」字样的模板 | 脚本按这两种模板的列名约定动态定位（头注释 L11），列名改写属于模板变更而非脚本缺陷，exit 2 即正确行为 |
| 嵌套装饰（`***`）/ 非括号注释形态 | stripDeco 只剥 `**` 与中英文括号，其它装饰形态不在判据定义内 |
| Windows 路径含空格 | run() helper 用 spawnSync 参数数组传参，无 shell 转义问题；真实 CLI 用法由使用者负责引号 |
| HH:MM:SS 与 HH:MM 混用（一端长格式一端短格式） | 正则两侧独立校验 `^\d{1,2}:\d{2}(?::\d{2})?$`，混用两端各判各的，均合法放行——这是判据定义的行为，不是缺陷，无需用例钉死 |

## 7 缺口与判别力水位

| 缺口 | 漏检哪类反例 | 至少 1 个样例 | 语义由谁兜 |
|---|---|---|---|
| L45 的 `colStartStop === -1` 分支不可达（防御性冗余） | 无法构造「表头行含起止字样但 colStartStop 找不到」的输入——headerIdx（L35）已保证该行含「起止」，findIndex 必命中 | 构造不出样例（代码路径不可达） | 重构/审查时注意该分支为死代码，可安全移除但不得据此误判「缺起止列有独立检查」 |
| 真实账本的「起止」「耗时」列名变体 | 列名改写（如「开始时间」「用时」）不会 FAIL/WARN，只会 exit 2「未找到轮次账表」 | 表头 `| 轮 | 开始时间 | 用时 |` → exit 2 | 模板列名由 review-log / parliament 两种模板约定保证；账本列名与模板漂移由 review-loop 的收尾流程兜（人工核对模板） |
| 软判 ② 在 sections === 0 时静默跳过 | 无「## 第 N 轮」小节的账本不提示小节缺失 | 轮次账 1 行但全文无「## 第 1 轮」→ 无 WARN | 该设计避免无小节模板误报；是否要求「有账必有小节」由收尾人工核对兜底 |
| gate 的「拦截正确性」依赖脚本自身正则不被重构破坏 | 正则被改宽导致坏账（`12:39` 裸时间点）被放行 | `12:39` 被 `/\d{1,2}:\d{2}/` 直接放行而不要求成对 | 由 TC-013 的断言（exit 1 + `缺「~」分隔`）兜——回归清单 §4 已列出必须重跑 TC-013 的改动面 |

## 8 给开发的建议（本批实现已定稿，供后续修订参考）

| # | 位置（文件:行） | 风险或盲点 | 为什么会被忽略 | 具体改法 | 优先级 |
|---|---|---|---|---|---|
| 1 | `review-ledger-gate.mjs` L43-45 | `colStartStop === -1` 分支不可达（headerIdx 已保证行含「起止」） | 防御性写法看似合理，实际是死代码；重构者可能误以为它覆盖了「缺起止列」，实际靠 L35 兜 | 保留无妨（无害防御），但注释注明「colStartStop 必命中，此检查为防御」；或删掉只留 colCost 检查 | P3 |
| 2 | `review-ledger-gate.mjs` L123-124 | 「耗时无 N m 但有说明」仅 WARN，`跨 session` 这类说明会被当「未取数」理解，账本的耗时统计会漏 | 文案友好（「内容对读者可见」）掩盖了「机器拿不到 N m 数字」的事实 | 保持现状可接受（软判语义明确）；若后续要算耗时合计，需把该分支从 WARN 提升为 FAIL，届时重跑 TC-008 | P3 |

---

**完成回报**

- 用例总数：24 条（正 8 / 负 13 / 边界 3；负 + 边 16 ≥ 正 8）
- 覆盖的判据项：脚本头注释 L1-14 四组判据 22 项全覆盖，另补 CLI 边界 2 项（TC-019/020）与代码分支 2 项（TC-015/024），0 未覆盖
- 补充单元测试：9 条（标题见 §2 对应测试字段中标记「senior-sdet 2026-10-20 补充」的条目）：起止整格「未取数」/ 耗时无 N m 但有说明「跨 session」/ 起止格式非法「abc~def」/ 表头缺「起止」列 / 无参数调用 / 文件不存在 / 表头存在但无数据行 / 列顺序调换（耗时列非固定列位）/ 无时间点的只填一端「abc~」
- 验证：详见交付报告正文
