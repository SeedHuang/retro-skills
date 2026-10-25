fenk哎# docgen 规则单一来源化（B 方案）：开放决策

> 状态：**未决**（设计探索，未定稿）｜创建：2026-10-25 09:43:53
> 来源：用户 2026-10-24/25 对话裁定——「我一开始设计的就是 B；A 这种小修小补没用；要尽早结构化方案，否则离 docgen 原本目的越差越远；问题不止我说的那处」
> 搬走条件：定稿后结论并入新 spec（本文件只留指针）；**本文件不是结论**

## 1 问题：一条规则被抄成 N 份，谁是真相说不清

实测副本（2026-10-25，`git grep`）：

| 规则 | 副本数 | 落点 |
|---|---|---|
| 23 条禁写路径 | **6** | spec `2026-10-25-s5-tool-tiers-design.md` §3.3③；`patternRegistry.mjs` 的两份 `BOUNDARY_PRODUCER_*`；两张卡（渲染产物）；`tool-tiers.test.mjs` 的 `FORBIDDEN_PATHS`；`.gitignore`（部分路径） |
| 14 条命令白名单（含 `git --no-optional-locks …`） | **5+** | spec §3.3④；两份边界句；两张卡；`tool-tiers.test.mjs` 的 `ALLOWED` |
| 审计核对表（第 0 项…第 5 项） | **2**（人工维护） | `outputFormats.mjs` 的 `audit` 模板 ↔ `skills/parliament/assets/round-check.md`：本 session 改「已授 producer 档」时**两处都得手改**才算一致 |
| 侦探处置表 / 共享块 | 2 | `sharedBlocks.mjs` 的 `DETECTIVE_RULES` ↔ `skills/parliament/references/debate-protocol.md` |

三个后果：
1. **漂移无人拦**：spec 加一条禁写路径、常量与卡面不改 → B02/B03 全绿（判据只查「必须包含」，不查「必须等于真相」）。
2. **死常量无人拦**：`BOUNDARY_COMMAND`（`patternRegistry.mjs` 里 command 档那条边界常量）当期无席挂载，测试只断言「非空」+「producer 边界 ≠ 它」→ 删掉里面一条禁止项，没有任何测试会红。
3. **改一处要记得改三处**：本 session 的 T9 就是「三份文档 + 一个常量」四地同改，靠人记。

## 2 为什么 A（补测试）不算解法

补测试 = 再抄一份判据。副本从 6 份变 7 份，判据本身仍会与真相分叉——只是把「漂移」从「规则文本」挪到「测试常量」。这不是 docgen 的目的（生成器应当**从数据产出文本**，而不是让文本与判据各自维护）。

## 3 B 的目标形态（四层，单向依赖）

```
① 数据层（唯一真相）  policy/*.mjs          ← 只有这里写具体路径 / 命令 / 形态
        │
        ▼
② 渲染层（无字面量）  renderBoundary(policy, seat)  ← 散文模板 + 数据槽，模板内不得出现任何路径/命令字面量
        │
        ▼
③ 产物层（可再生成）  agents/*.md            ← gate 逐字节守（已有）
        │
        ▼
④ 判据层（引用数据）  tests 只 import policy，不再手抄常量
```

- **定义 / 配置分层（用户 2026-10-25 追加要求：「按功能、作用分开管理，定义统一，配置与定义分开、互不影响」）**
  - **定义层**（`policy/definitions/*`，跨席稳定，唯一写具体字符串的地方）
    - `capabilities.mjs`：`read` / `write` / `exec` 三种能力 → 对应工具名单（`Read,Glob,Grep` / `Write,Edit` / `RunCommand`）。
    - `commands.mjs`：命令按**作用**分组，每组有稳定 ID 与用途：`check.local`（本地校验）、`git.read`（git 只读）、`docgen.read`（生成器只读子命令）、`docgen.write`（`draft` 生成 / `replace` / `baseline --write`）、`git.write`（`commit/push/checkout/reset/restore/clean/rm`）、`fs.write`（`>` / `>>` / `Set-Content` / `Out-File`）、`env.assign`（`export` / `$env:` / `set` / `setx` / `VAR=… node`）、`network`（安装 / 网络写）。前 3 组 = **允许组（可配）**，后 5 组 = **禁止组（不可配）**。
    - `paths.mjs`：禁写路径按作用分组：`code`（代码 / 测试）、`governance`（`rules/` `skills/` `agents/`）、`docs.input`（`docs/prd/`、spec / plan）、`build`（`tools/` `scripts/` 依赖清单）、`ledger`（`docs/after/` `docs/handoffs/` `docs/reports/` `docs/superpowers/retro/`）、`workspace`（`.superpowers/` `lessons/` `*.local.md` `**/ledger.md` `.trae/` `skills-lock.json` `node_modules/` `tools/docgen-spike/.tmp-test/` 其他评审目录）。
    - `artifacts.mjs`：产出归属（`round-check.md` / `delivery-audit.md` → 审计；`detective.md` → 侦探；`progress.md` → 主持人）。
  - **配置层**（`policy/seat-policy.mjs`，按席可变，**零字符串**）
    ```js
    export const SEAT_POLICY = {
      'reviewer-audit':     { capabilities: ['read','write','exec'], allowGroups: ['check.local','git.read','docgen.read'], artifacts: ['round-check.md','delivery-audit.md'] },
      'detective-observer': { capabilities: ['read','write','exec'], allowGroups: ['check.local','git.read','docgen.read'], artifacts: ['detective.md'] },
      'senior-sdet':        { capabilities: ['read','write'],        allowGroups: [],                                  artifacts: [] },
      __default__:          { capabilities: ['read'],                allowGroups: [],                                  artifacts: [] },
    };
    ```
  - **四条不变量（都可机器判）**
    1. 配置只能引用定义层已存在的 ID；未知 ID → 报错（悬空引用不得静默失效）。
    2. 配置层不得出现命令 / 路径字面量（正则守卫：含 `/`、反引号命令、`--flag` 一律红）——防第二份真相回流。
    3. 定义层不得出现席名（禁止反向耦合）。
    4. **禁止组不可配**：`docgen.write` / `git.write` / `fs.write` / `env.assign` / `network` 五组只能出现在边界句的「禁止」段，配置层引用它们 → 直接报错。**允许项可配，禁止项不可配**——否则「加一行配置」就能越权。
  - **影响面规则**：改公共组 = 全局变更（所有引用该组的席一起变，必须走审查）；某席要特例 → 新增**席级组**（`seat:reviewer-audit.extra`），不改公共组。
  - **数据形状（旧草案，已被上面的分层取代；保留以说明演化）**
  ```js
  // 旧草案（v1）：扁平数组，配置与定义混在一起 —— 已废弃，勿照此实现
  // export const FORBIDDEN_WRITE = […]; export const COMMAND_ALLOWLIST = […]; export const WRITE_SCOPES = { 席名: […] };
  ```
- **渲染层**：`renderBoundary({ seat, policy })` 按五段拼句（①档位事实 ②写入范围 ③明确禁止 ④命令默认拒绝 ⑤越权后果与限度）。散文模板放 `templates/boundary.md.tpl`，与 `agent.md.tpl` 同构。
- **纯度守卫**（关键）：「模板内不得含路径 / 命令字面量」——与既有「模板纯度」用例同思路（`pilot-render.test.mjs` 的 `模板纯度` 那一条）。这条守卫是「防第二份真相」的结构性闸门，比补断言有效。
- **spec 只引用、不列内容**：§3.3③/④ 改成「以 `tools/docgen/policy/` 为准，可用 `node tools/docgen/cli.mjs policy --dump` 复算」。方向必须单向（见待决 1）。
- **判据层**：B02/B03/B05 从「手抄 23/14 项」改为「import policy 后断言卡面 = render(policy)」，并保留 2–3 条**字面锚点**防渲染器被人改坏（锚点数固定，不随规则条数增长）。

## 4 迁移步骤（8 步，按主线走）

1. 立功能块：PRD 加功能点（编号待定，见待决 3）→ spec + testcase（独立 sdet）→ 议会 → 计划门。
2. 落 `policy/definitions/*` 与 `policy/seat-policy.mjs`：值 = 现三处副本的**最大集**，先做**等价迁移**（语义零变化）；配置层只写组 ID。
3. 写 `renderBoundary` + 模板；用黄金断言证明「新渲染 == 现卡逐字节」。
4. 逐卡 `draft` → 用户确认两版差异 → B3 独立重判 → `replace`（只动被影响的席；其余席 zero-diff）。
5. spec §3.3③/④ 改引用，删手抄清单（历史留存以「原文不改 + 指针」处理）。
6. 测试改造：`FORBIDDEN_PATHS` / `ALLOWED` / `FORBIDDEN` 改从定义层导入；加纯度守卫 + 四条不变量测试（悬空 ID 必红、配置层含字面量必红、定义层含席名必红、配置引用禁止组必红）。
7. 删死常量：`BOUNDARY_COMMAND` 要么挂席要么删除（现无挂载 → 建议删，值进 policy 注释）。
8. 全量 `npm run check` + `gate` + 反向验证（改 policy 一项 → 必红且只需改一处）。

## 5 验收（结构性，不看条数）

- `git grep` 23 条路径：命中处 = `policy/*.mjs` + 2 张渲染卡（允许） + spec 里 0 条内容清单 + 测试里 0 条手抄。
- 删 `policy` 里任意一条命令 → `npm run check` 必红，且**不需要动第二个文件**才能修好（当前需要动 2–4 处，正是病灶）。
- 给某席加一条命令 = 只改 `seat-policy.mjs` 一行（引一个新组），定义层与其它席零变化。
- 配置层引用一个不存在的组 / 引用一个禁止组 → 必红。
- 模板纯度守卫在：往模板里塞任意一条禁写路径 → 必红。

## 6 影响面与代价

- 必改：`patternRegistry.mjs`（3 个边界常量）、`agentData.mjs`（取边界的方式）、`tool-tiers.test.mjs`（B02/B03/B05）、spec §3.3、3 张卡（2 张 producer + 可能 `evidence-reader` 自带边界）。
- 需要重生成卡 → 走 `draft → 确认 → B3 重判 → replace`，不能手改。
- 风险：卡面字节全变 → 若渲染等价性做不严，B02/B03 会假红；故第 3 步的黄金断言是硬门。

## 7 待决（需用户拍板）

1. **真相方向**：spec 列清单、脚本解析（源=spec）↔ 代码为源、spec 只引用（源=code）。**建议 code 为源**（可执行、可测、能反查）；spec 只写「为什么这样定」。
2. **范围**：本轮只收「工具权限」（边界句 + 23/14 清单），`outputFormats.audit ⟷ round-check.md`、`sharedBlocks ⟷ debate-protocol.md` 留下一轮？还是同批（同类病，但会动 `skills/` 结构，工作量与回归面更大）。
3. **编号与排序**：新功能块叫什么、插在哪（S3 之前 / 之后）。S3 已依赖 `producer` 落地，本项不阻塞 S3。
4. **分组粒度**：命令 8 组（允许 3 / 禁止 5）与路径 6 组是否够用？越细 → 配置越精确、组数越多；越粗 → 改一组波及面越大。建议先按上面 8+6 落地，出现「某席只要组内一半」时再加席级组。
5. **席级例外组**（`seat:<name>.extra`）本批做还是后置？做 → 配置能表达「只给这一席」；不做 → 某席特例只能改公共组（波及面大）。建议**本批就做**，否则第一条特例出现时会退回改公共组。

## 8 本轮不做（已签内容不回滚）

- ③/④ 已签的边界句与测试按现状保留；本文件只登记「应改成什么样」，不在已签范围里偷改（R4）。
