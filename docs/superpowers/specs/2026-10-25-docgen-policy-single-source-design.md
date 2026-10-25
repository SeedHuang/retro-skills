# docgen 规则单一来源化（F-24 / S6）设计

> 状态：**内容已定稿，待议会 ② 段签字（v8）**｜创建：2026-10-25
> 功能点：**F-24**（`docs/prd/20261024073606-dev-workflow-mainline/index.md` §10；交付份 S6）
> 测试用例文件：`2026-10-25-docgen-policy-single-source-design-testcase.md`（同批由独立 `senior-sdet` 编写，本 spec 不内联用例）
> 原型与取舍记录：`docs/after/20261025094353-docgen-policy-single-source-open-decisions.md`
> 规模：spec ≤350 行 / testcase ≤80 条 / 议会 ≤3 轮（PRD §4.1 功能块判据）

## 1 全貌

| 维度 | 内容 |
|---|---|
| 本质 | 把「权限规则文本」从散文副本改成**数据 → 渲染**：定义层持字符串，配置层只持组 ID，边界句由两者渲染；改一条规则只动一个文件 |
| 同族 | `patternRegistry` 的三个边界常量与档位表 / `agentData` 的边界取值 / `tool-tiers.test.mjs` 的手抄常量 / S5 spec §3.3 的 23、14 项清单 |
| 边界 | 不改任何席的权限语义；不动 `outputFormats` / `sharedBlocks` / `DEFAULT_BOUNDARY` / `evidence-reader` 的边界句（留 S6-B）；不手改卡 |
| 验收 | V-1～V-13；核心四条：**能力矩阵等价**（功能不丢）、**双向下探**（允许能用 / 禁止拦得住）、**散文子句存在性**、**A/B 盲评**（改后每维 ≥ 改前且至少一维更好）。**不以字节相等为验收判据** |
| 影响面 | 生成器内部结构 + 一套新测试 + 1 个配置校验单元 + 1 个只读子命令；**15 张卡都不重走 B3**；其中 2 张卡面由渲染器产出——若渲染字节与现卡不等，须走 `docgen.replace` 重出，并由 V-1 / V-13 验收 |
| 收益 | 两 producer 席范围内：6 处文本副本 → 1 处数据 + 1 处模板；改一条禁写路径的写入点 **7 → 3**（定义层 1 + 重生成 2 张卡）。真实收益是**消除两席静默分叉**（现两句 4,359 字符、bigram 相似度 0.945，`gate` 查不出分叉）与为 S6-B 摊薄基础设施；**不以「省工时」立论** |

**联动四问**：治本——规则文本从「多处手抄」变为「一处数据 + 一处模板」；副作用——模板化后措辞漂移风险转由 V-1/V-12 与 `gate` 双守；跨问题——S5 遗留的「spec ↔ 常量」漂移同批收口；跨文件——数据、渲染、测试、S5 spec 引用、PRD 验收口径五处必须同批。

## 2 不做什么

1. 不改权限语义：谁挂哪档、能跑哪些命令、能写哪些文件，一条不变（V-1 用**能力矩阵集合 diff** 判）。
2. **不以「文本一模一样」作为验收**：允许措辞重排与改进；被守的是「能力不丢 + 质量不降」（V-1 / V-11～V-13）。
3. 不收 `outputFormats.audit` ↔ `round-check.md`、`sharedBlocks` ↔ `debate-protocol.md`：本轮已有 10 步，且这两处结构未验证能否被同一模板承载；触发条件 = S6-B 立项。
4. 不收 `DEFAULT_BOUNDARY`、`evidence-reader` 的自有边界句：结构不同构（无组、无产物）。触发条件 = 这两处需改字或 S6-B 启动。
5. 不造运行时权限拦截（平台无参数级授权）；本 spec 只保证「文本与判据同源」。
6. **不改 S5 的权限结论**：S5 spec 只加「判据已由 S6 接管」指针（不改原句、不改结论）；因删死常量而失去判据对象的验收项与三条用例，按 §3.6 同批改判。
7. **已知副本（本轮不修，登记待触发）**：`agentData.mjs` 里 `detective-observer` 的 `fixedList[3]` 硬写了 `git --no-optional-locks status --porcelain` 与 `commit|push|checkout|reset|restore|rm`，与 `commands.git.read` / `git.write` 同源且**已漂移**（漏 `clean`、`reflog expire|delete`）。它不属「边界句」，本轮不收；**失效条件 = `clean` / `reflog *` 任一进入 ④ 段，或 S6-B 启动**，届时必须改为从定义层生成。

## 3 设计

### 3.1 分层总则（单向依赖）

```
① 定义层 policy/definitions/*.mjs   唯一写具体字符串（含档位表）
        ↓（按作用分组的稳定 ID）
② 配置层 policy/seat-policy.mjs     只写组 ID，零字符串
        ↓
③ 渲染层 renderBoundary(seat)       模板 + 数据槽；函数式替换
        ↓
④ 产物层 agents/*.md                能力等价（字节仅作定位线索，gate 守漂移）
        ↓
⑤ 判据层 tests                       import 定义层，不手抄
```

### 3.2 定义层

| 文件 | 内容 | 关键约束 |
|---|---|---|
| `definitions/capabilities.mjs` | `read` = `Read,Glob,Grep`；`write` = `Write,Edit`；`exec` = `RunCommand` | 名称即卡面顺序 |
| `definitions/tiers.mjs` | **导出名、形状与值语义写死**：`export const TIERS = { readOnly:['Read','Glob','Grep'], sdet:['Read','Glob','Grep','Write','Edit'], command:['Read','Glob','Grep','RunCommand'], producer:['Read','Glob','Grep','Write','Edit','RunCommand'] }`（**值是工具名**，与 S5 现表一致）；`export function tierOfCapabilities(caps)` = 「`caps` 按 `capabilities.mjs` 展开后的工具集 == `TIERS[档]`」的唯一样 | S5 的档位表**下沉到这里（四档一个不少）**；`patternRegistry.tools` 必须是 **`TIERS` 的同一对象引用**（re-export，不深拷贝、不改名；删 `command` 会让 S5 三条断言必红） |
| `definitions/commands.mjs` | **允许组 3**：`check.local`、`git.read`、`docgen.read`（各自 `purpose` + `verbs`）<br>**禁止组 5**：`docgen.write`、`git.write`、`fs.write`、`env.assign`、`network`（`network.purpose` 写「安装 / 网络写 / `node -e`（不开放）/ 下载类命令」；**`network.verbs` 成员恰三项**：`安装`、`网络写`、`node -e`）<br>**席级组** `seatGroups`：键 = `seat:<slug>.extra`，本轮为空集 | 组内顺序 = 卡面顺序（V-4）；**`verbs` 只放能逐项复算的字面成员**，形态描述进 `purpose`；**不变量 8** 约束 `seatGroups` 内容 |
| `definitions/paths.mjs` | `pathGroups` **6 组**，**21 个数组元素**（`代码、测试` 合写一个元素、盖 2 个点名项）＋ **1 个 `pattern` 项**；卡面 ③ 段成员 = **23**（数组元素按 `、` 再切得 22 + `spec / plan`）。`FORBIDDEN_SPEC_PLAN.pattern` 以正则源串表达，不进数组；**独立导出** `DETECTION_BLIND_SPOTS = ['.session/','.superpowers/','lessons/']`（**不进** `pathGroups`，故不进 ③ 段禁写清单；与 `workspace` 组的值可重叠，语义独立、互不跟随） | 组内顺序 = 卡面顺序；检测盲区与禁写清单是两件事 |
| `definitions/artifacts.mjs` | 产出归属：`round-check.md`、`delivery-audit.md`、`detective.md`、`progress.md`（后者 `owner='host'` + `host:true`） | 只描述「谁拥有」，不描述「谁能写」；`owner`（归属）与配置层 `artifacts`（可写）**语义不同、不互校** |
| `definitions/seats.mjs` | `SEATS = { '<slug>': { display, clause?, escalationWriter?: { slug, artifact } } }`；**三席 `display` 全写死**（`reviewer-audit` 审计 / `detective-observer` 侦探 / `senior-sdet` 测试开发）；两 producer 席 `escalationWriter` 均 `{ slug: 'reviewer-audit', artifact: 'round-check.md' }`（≠ 本席时渲染「交<display>在 `<artifact>` 独立复算」）；`__default__: { display: '默认席', clause: '' }`；`SEAT_NAMES = Object.keys(SEATS).filter(k => k !== '__default__')`（保留键、不可授予） | `display` 必填非空；**`clause` 缺省 = `''`**、**`escalationWriter` 缺省 = 该槽渲染空串**（模板须保证空值处无悬空标点）；「缺省未声明」≠「显式传 `undefined`」（后者判 `TemplateImpure`） |

### 3.3 配置层

```js
// policy/seat-policy.mjs —— 零字符串：只出现 capabilities 名、allowGroups ID、artifacts 文件名 ID
export const SEAT_POLICY = {
  'reviewer-audit':     { capabilities: ['read','write','exec'], allowGroups: ['check.local','git.read','docgen.read'], artifacts: ['round-check.md','delivery-audit.md'] },
  'detective-observer': { capabilities: ['read','write','exec'], allowGroups: ['check.local','git.read','docgen.read'], artifacts: ['detective.md'] },
  'senior-sdet':        { capabilities: ['read','write'],        allowGroups: [],                                  artifacts: [] },
  __default__:          { capabilities: ['read'],                allowGroups: [],                                  artifacts: [] },
};
```

- 未登记的席一律走 `__default__`（等价 `defaultTier = readOnly`）。
- **席级组** `seat:<席名>.extra` 只允许出现在该席的 `allowGroups` 里；其它席引用即报错（不变量 5）。

### 3.4 渲染层

- `templates/boundary.md.tpl`：五段结构（①档位事实 ②写入范围 ③明确禁止 ④命令默认拒绝 ⑤越**界**后果与限度），**照抄现两句的措辞**。槽集 12 个（**顺序 = 本表行序 = `dump.expanded` 的索引口径**；卡面首次出现顺序不参与判据）：

  | 槽 | 取值来源 | 例 |
  |---|---|---|
  | `{{SEAT}}` | `SEATS[slug].display` | 审计 / 侦探 |
  | `{{TIER}}` | `tierOfCapabilities(配置文件里该席的 capabilities)` | `producer` |
  | `{{CAPABILITIES}}` | `capabilities` 展开（` / ` 连接） | `Read / Glob / Grep / Write / Edit / RunCommand` |
  | `{{ARTIFACTS}}` | 该席 `artifacts` 展开（`、` 连接） | `` `round-check.md`、`delivery-audit.md` `` |
  | `{{SEAT_CLAUSE}}` | `SEATS[slug].clause` | 审计「、审计表」／侦探「（轮初 / 轮末快照原文、观察记录、比对结论）」 |
  | `{{ESCALATION_WRITER}}` | `SEATS[slug].escalationWriter`：本席自写渲染为「<显示名> 写 <产物名>」；他席写渲染为「交<显示名>在 <产物名> 独立复算」 | 审计写 `round-check.md`／侦探「交审计在 `round-check.md` 独立复算」 |
  | `{{ALLOW_GROUPS}}` | 允许组展开：组间 `；`、组内 ` / ` | 见现句 ④ |
  | `{{DENY_GROUPS}}` | 禁止组展开：组间 `、`、组内 ` / `，**剔除 `env.assign`**（由下一槽单独注入） | 见现句 ④ |
  | `{{ENV_FORMS}}` | `commands.env.assign` 展开 | `export VAR=…` 等 |
  | `{{FORBIDDEN_PATHS}}` | `pathGroups` 六组展开 **∪ `FORBIDDEN_SPEC_PLAN` 的卡面形态（`spec / plan`）**（`、` 连接） | 见现句 ③ |
  | `{{DETECTION_PATHS}}` | `DETECTION_BLIND_SPOTS`（` / ` 连接） | `.session/ / .superpowers/ / lessons/` |
  | `{{DETECTION_CMD}}` | `commands['git.read'].verbs` 里的 status 项（**只读引用，不复制**） | `git --no-optional-locks status --porcelain` |

- **替换机制写死**：**单趟** `tpl.replace(/\{\{([A-Z_]+)\}\}/g, (_, k) => values[k])`——槽值不参与二次扫描、不解释 `$&` / `$'` / `$$`；缺失槽 → `TemplateImpure`（首行片段 = 槽名）。槽值为 `undefined` / `null` → `TemplateImpure`；空数组允许渲染为空串，但模板须保证空值处不留悬空标点（由 C06 的「无 `undefined`、无 `{{`、无连续标点」断言守）。
- **纯度守卫（三条；按「清单类 / 单点类」分治）**：
  1. **清单类成员**（组 ID、多词 verb 如 `npm run check`、路径组成员）**不得整项出现在模板**——必须经槽注入；出现即 `TemplateImpure`。
  2. **单点类成员**（单 token 的 flag 如 `--output` / `--write`、产物名如 `round-check.md`、单个词 verb）**允许**作为结构性文本留在模板，但必须 ∈ 定义层对应集合（存在性校验）；查不到即 `TemplateImpure`。
  3. 其余结构性文本（「命令默认拒绝」「越权清单」「sha256」「检测限度」、含成员的更长路径如 `skills/dev-workflow/references/gate-record.md`、席职责散文）登记 `TEMPLATE_ALLOWED_LITERALS`，白名单只登记**非清单类**成员。
  > 判定粒度 = **整项相等**（去反引号与首尾空白），不做子串包含。
- **归码优先级**：先判**形态**——值必须是合法 ID（`^[a-z][a-z0-9.:-]*$`，允许 `seat:<slug>.extra`），不是则 `LiteralInConfig`；形态合法但定义层无此 ID 则 `UnknownPolicyRef`；已登记但属禁止组 / 他席席级组 → `ForbiddenGroupGranted`。三条不重复报。

### 3.5 不变量（全部机器可判，写在 CI 测试里）

| # | 不变量 | 违反时 |
|---|---|---|
| 1 | 配置引用的能力 / 组 / 产物 ID 必须存在于定义层；`SEATS` 必须含 `SEAT_POLICY` 的全部席键 + `__default__` 保留键，且每个 `display` 非空 | `UnknownPolicyRef` |
| 2 | **配置层 closed-world**：除 `capabilities` / `allowGroups` / `artifacts` 三键外不得出现任何字符串字面量；三键内的值也必须是定义层已登记的 ID（逐条查表，不靠弱探针） | `LiteralInConfig` |
| 3 | 「席名」指**席 slug** 作为**权限授予键**：不得按 slug 硬编码 capability / 组。两处例外：① `artifacts.owner` 是**归属**，值 ∈ `SEAT_NAMES ∪ {'host'}` 且 `'host'` 只配 `host: true`；② 席级组键名 `seat:<slug>.extra` 只能在 `commands.mjs` 登记且只能被该 slug 引用。显示名只许出现在 `seats.mjs` | `SeatNameInDefinition` |
| 4 | 配置引用「禁止组」 | `ForbiddenGroupGranted` |
| 5 | 席级组被非本席引用 | `ForbiddenGroupGranted`（后缀 `:other-seat`） |
| 6 | **归一**：模板违反 §3.4 纯度三条，或白名单登记了清单类成员 | `TemplateImpure` |
| 7 | **槽集恰合**：模板槽集 = 渲染器消费的槽集 = §3.4 表的 12 个；每个槽至少被引用一次；有槽无人填 / 有值无槽都判错 | `TemplateImpure` |
| 8 | **席级组内容合法（两个方向各有负例）**：① `seatGroups[g].verbs` ⊆ 允许组 verbs 并集；② 与禁止组 verbs 并集**交集为空**（比较粒度 = **按空格切分的 token**） | ① 越界 → `ForbiddenGroupGranted`（后缀 `:not-allowed`）；② 撞禁止 → `:verb` |
| 9 | **档位一致**：`capabilities` 展开的工具集 ≡ `patternRegistry.toolsForSeat(席)`（同一事实的两处表达必须相等） | `UnknownPolicyRef` |

### 3.6 与现有卡的关系

- **收口范围只有两席**：`reviewer-audit` / `detective-observer` 走 `renderBoundary`；**其余 12 席不接渲染层**（其中 11 席卡面渲 `DEFAULT_BOUNDARY`，`senior-sdet` 走手写模板无 `{{BOUNDARY}}` 槽）。
- **等价迁移不是字节等价**：两席渲染结果与现常量**能力等价**即可；字节相等是最优结果与定位线索，**不作通过判据**（V-1 / V-13 才是）。黄金值用 sha256（`fixtures/boundary-golden.json`，4 键：`reviewer-audit` / `detective-observer` / `default-boundary` / `evidence-reader-boundary`），只作定位。
- **`BOUNDARY_COMMAND` 删除**（当期无挂席；值进 git 历史）。波及面必须同批改：`tool-tiers.test.mjs:12` 的 import、`FORBIDDEN_PATHS` / `ALLOWED` / `FORBIDDEN` 三处手抄常量、`S5-TC-E05`、`S5-TC-B08`、`S5-TC-B14`。
- `patternRegistry.mjs`：删三个边界常量；**保留 `boundaryBySeat` 映射形态与导出名**，其值改为 `renderBoundary(席)` 的结果（`renderBoundary` 只依赖 `definitions/*` + `seat-policy`，不反向 import `patternRegistry`，故无初始化环）；档位表改为 re-export `tiers.mjs`。**`tierBySeat` 不再手写第二份**：由 `SEAT_POLICY` **逐 `SEAT_NAMES`（= `Object.keys(SEATS)` 去掉 `__default__`）** 调 `tierOfCapabilities(caps)` 派生（S5 的映射形态与键集保留，值 = 派生结果；**派生结果不得含 `__default__`**）。派生一致性的断言落**本 spec 自己的 B01**（`tierBySeat` 键集恰三席、不含 `__default__`、逐席值 == `tierOfCapabilities`），不改 S5 用例。
- `agentData.mjs` 仍按 `boundaryBySeat[s.name]` 取值（不改取值方式），其余字段与展开顺序不变；**条目自带 `boundary` 的席必须 ⊆ `DECLARED_SLOT_SEATS`**（= `evidence-reader` ∪ `boundaryBySeat` 登记的席；沿用 S5 既有断言，本 spec 不新增守卫）。
- **S5 文档侧（口径：指针 + 判据改判；历史叙述保留）**：S5 spec §3.3 的 23 / 14 项清单加「已迁移，以 `tools/docgen/policy/` + `policy --dump` 为准」指针（**不改原句、不改结论**）；S5 spec §8 加同样指针。S5 testcase 三条**判据/前置**逐条改成（写死，不留解释空间）：① `S5-TC-E05` 的「`BOUNDARY_COMMAND` 非空」→「`renderBoundary('reviewer-audit')` 非空且 `=== boundaryBySeat['reviewer-audit']`」；② `S5-TC-B08` 的「`a.boundary !== BOUNDARY_COMMAND`」→「`a.boundary === renderBoundary(席)`」；③ `S5-TC-B14` 的前置「`BOUNDARY_COMMAND` 仍可导入」→「`DEFAULT_BOUNDARY` 仍可导入」，并用它构造「半改态」，断言 `renderBoundary(席) !== DEFAULT_BOUNDARY`。S5 testcase 里手抄的路径清单（**21 个数组元素 + 1 个 pattern**）改为 `import { pathGroups }` 派生（`pathTokens()` 由判据侧现算，不是定义层导出），不再称「22 项数组」。历史叙述句保留不改。
- **PRD 同步**：PRD F→S 覆盖表的 F-24 行仍写「要求卡面字节不变」，与本 spec 冲突 → 同批改为「能力矩阵等价 + 双向探针 + A/B 盲评（用户 2026-10-25 改判）」。功能点 ID 集合未变，**不触发 §0 重签**（R5 只看功能点集合 diff），但需在 §0 记一行日期化留痕。
- **编码与换行**：渲染与写入统一 `\n`、UTF-8 **无 BOM**；卡面出现 CRLF / BOM 时 `gate` 报 `Mismatch`（不静默归一化）——`gate` 是逐字节比较，归一化会掩盖真实差异。

### 3.7 配置层的 closed-world 边界（避免把合法写法判红）

- `SEAT_POLICY` 的**对象键**（席 slug）与三键名本身不计入「字面量」；键必须 ∈ `SEAT_NAMES`，`__default__` 为保留键。
- 三键的候选集：`capabilities` ⊂ `Object.keys(capabilities)`；`allowGroups` ⊂ 允许组 ∪ 本席席级组；`artifacts` ⊂ `Object.keys(artifacts)`。
- 键集恰为 `capabilities` / `allowGroups` / `artifacts` 三键（多键、少键、拼错键都判 `LiteralInConfig`）。
- 读配置侧一律 `Object.hasOwn`（`__proto__` / `constructor` 键回落 `__default__`）。

## 4 角色与三权

| 权 | 谁 | 判据 |
|---|---|---|
| 申报 | 开发（主 agent） | 交产物与 `npm run check` 输出，不自称通过 |
| 定性 | `senior-sdet`（写 testcase + 逐条判结论） | 不得是施工者；用例 ≤80 条，负例 + 边界 ≥ 正例 |
| 核对 | 审计 | 抽查 ≥3 条，自跑命令复算并比对输出首行 |
| 签字 | ② 审计 / ④ sdet / ⑤ 用户 | 见 `skills/dev-workflow/references/gate-record.md` |

## 5 文件布局与数据流

```
tools/docgen/
├─ policy/
│  ├─ definitions/{capabilities,tiers,commands,paths,artifacts,seats}.mjs
│  └─ seat-policy.mjs
├─ templates/boundary.md.tpl
├─ components/renderBoundary.mjs         ← 新增（渲染 + 纯度守卫）
├─ components/validatePolicy.mjs         ← 新增（配置/模板校验，五码唯一发射点）
├─ components/validateAgentData.mjs      ← 改：EXIT[1] 增五个码
├─ components/patternRegistry.mjs        ← 删三常量 / 档位表改 re-export
├─ components/agentData.mjs              ← 不改取值方式（仍读 boundaryBySeat）
├─ test/support/capability-baseline.mjs  ← 新增：两入口（基线端＝旧卡切分 / 改造后端＝定义层字典匹配），只读旧卡，不得 import policy/
├─ fixtures/boundary-golden.json         ← 4 键 sha256
├─ fixtures/capability-baseline.json     ← 含 sourceCommit
└─ cli.mjs                               ← 新增只读子命令 `policy --dump`（JSON）
```

- **发射点唯一定义**：`validatePolicy()` 由 `cli.mjs` 在 `gate` 与 `policy --dump` 两处调用；五个 CLI 码经 `fail()` 走既有 `码: 报文` 契约并登记 `EXIT[1]`。`RenderNotEquivalent` 由施工期测试断言发出，**不进 CLI 表**。
- `policy --dump` 输出：`{ capabilities, tiers, commands:{group:{purpose,verbs}}, seatGroups, paths:{group:[…],patterns:{specPlan:'<源串>'}}, detectionBlindSpots, artifacts, seats:{席:{display, expanded:[…]}} }`；`commands` = **允许 3 组 ∪ 禁止 5 组 ∪ `seatGroups`**（本轮席级组为空集）。`expanded` = **12 个槽值字符串数组**（**顺序 = §3.4 表行序，第 n 行 → index n−1**；卡面首次出现顺序不参与判据）；**不许写盘**（不写仓内文件），不接受写盘类 flag（`--write` / `--out` / `--apply` → `InvalidArgs` exit 2）。
- `gate` 行为增一条：先跑 `validatePolicy()`，再走既有逐席比对（`Mismatch` 管产物漂移，`RenderNotEquivalent` 管迁移期渲染变化）。
- 数据流：定义层 → 配置层 → `renderBoundary` → `agentData` → `renderAgent` → 卡。
- **测试环境约束**：`withRepoCopy` 副本只含 `tools/docgen`、`tools/execution-matrix`、`rules`、`agents`（**无** `docs/`、`.git`、`skills/`、`scripts/`）。需要读 `docs/`、跑 `git`、读 `skills/` 的断言一律**回真仓库根**只读执行，不得在副本内跑 `git`。

## 6 执行步骤

0. **导出改造前基线 + 留 A 组卡 + 逃生路径**：从**未改**的 commit 导出 `fixtures/capability-baseline.json`（五段事实集合）并把两席旧卡落成 A 组（`git show <sourceCommit>:agents/<席>.md`）。硬约束：① 抽取器落 `test/support/capability-baseline.mjs`，**不得 import `policy/`**，且是该解析逻辑的**唯一实现**（测试判据 import 它，不复制第二份）；② 基线必带 `sourceCommit`，且该 commit 上**不得存在 `policy/`**；③ 选基线前先 `git rev-parse HEAD` 并断言 `agents/`、`tools/docgen/` 无未提交改动，席集合以该 commit 为准、改造期不增席；④ **字典来源写死**：步骤 0 尚无定义层 → 基线端按**旧卡文本切分**（反引号项 / 顿号项 / 分号项 / ` / ` 工具项）产出；改造后端按**定义层成员字典**匹配渲染文本；两端可比的前提 = 「基线成员 ⊆ 定义层字典」（H02 ⑤' 断言），不满足即红并人工复核。落 1 份黄金样本 `fixtures/capability-baseline.golden.json`（审计席 8 字段）供独立复算；⑤ **逃生路径**：dump / 抽取器不可用时，手工取数 = `git show <sourceCommit>:agents/<席>.md` + 逐段读 `definitions/*.mjs`，结果写进 `capability-diff.md` 并标「手工取数」。
1. 落 `definitions/*`：值 = 现两份边界句 + `BOUNDARY_COMMAND` 的**最大集**，语义零变化。
2. 落 `seat-policy.mjs`（3 席 + `__default__`）。
3. 写模板 + `renderBoundary` + `validatePolicy`；黄金 4 键**一律用改造前文本算**（两席取 `git show <sourceCommit>:agents/<席>.md` 的旧卡、`default-boundary` / `evidence-reader-boundary` 取现常量），**不得用改造后渲染自哈希**（否则 `hashEqual` 恒真、定位线索归零）。**换代规则**：golden 只在迁移 commit 写一次；若 V-13 判 B 更优导致文本变更，同一评估轮内**追加**新键 `<席>@<轮次>` 并在 `checklist.md` 记「golden 已换代」，旧键不删。**步骤 3 结束设 checkpoint**：`gate` 37/37 + `npm run check` 全绿才往下。
4. 接 `agentData` / `patternRegistry`；删 `BOUNDARY_COMMAND`；**同批**改 `tool-tiers.test.mjs:12` 的 import 与 `FORBIDDEN_PATHS` / `ALLOWED` / `FORBIDDEN`。
   **4b 同批**：S5 spec §3.3 / §8 加指针；S5 testcase 的 `S5-TC-E05` / `B08` / `B14` 判据与前置改判；S5 testcase 手抄数组改派生。
5. 加 `cli.mjs policy --dump` + 参数白名单 + `EXIT[1]` 五个码 + 对应失败面。
6. 写新测试 `test/policy-pure-source.test.mjs`：定义层派生常量 + 九条不变量 + 纯度守卫 + 抽取器复算。
7. S5 spec §3.3 / §8 指针化（不改结论）。
   **7b**：PRD F-24 行验收口径同步（§3.6 末段）。
8. `gate`（37/37）+ `npm run check` 全绿 + 反向验证（删数据一项必红、配置层塞字面量必红）。
9. **能力矩阵 diff + 双向下探 + A/B 盲评**：`policy --dump` 与 `capability-baseline.json` 做集合 diff（必须空差）；允许/禁止集逐项探针；A/B 两份卡盲评（rubric 见 §9），**至多 2 轮**，第 3 轮起记 P2 交用户裁。
10. 四本账单 + 交付说明（取数命令、置信度、golden 是否换代）。

## 7 失败面与错误码

| 码 | 触发 | 退出码 | 报文首行 |
|---|---|---|---|
| `UnknownPolicyRef` | 配置引用不存在的 ID / 档位不一致（不变量 9） | 1 | `UnknownPolicyRef: <席>:<类别>=<ID>`（`<类别>` 词表写死 = `capability\|group\|artifact\|tier`） |
| `LiteralInConfig` | 配置层出现命令 / 路径字面量 | 1 | `LiteralInConfig: <文件>:<行>` |
| `SeatNameInDefinition` | 定义层出现席 slug（授予面） | 1 | `SeatNameInDefinition: <文件>` |
| `ForbiddenGroupGranted` | 配置引用禁止组 / 越席用席级组 / 席级组撞禁止 verb / 席级组越出允许集 | 1 | `ForbiddenGroupGranted: <席>:<组>[:forbidden\|:other-seat\|:verb\|:not-allowed]` |
| `TemplateImpure` | 违反 §3.4 纯度三条 / 槽集不合 / 槽值 `undefined` | 1 | `TemplateImpure: <模板>:<片段>` |
| `RenderNotEquivalent` | 渲染 ≠ 黄金（**施工期断言发出，不是 CLI 码**，CLI 不引入） | 测试退出 1 | `RenderNotEquivalent: <席>:<首处差异行>` |

> 两个「不一致」的职责边界：`Mismatch`（既有）= 盘上卡 ≠ 渲染结果，`gate` 报，管产物漂移；`RenderNotEquivalent` = 渲染 ≠ 黄金哈希，迁移期断言报，管「改造后渲染器变了」。两者不互相替代。
> 模板 / 配置**读取失败**：`patternRegistry.boundaryBySeat` 在**模块导入期**求值（= 已读模板），失败形态是未捕获异常，**不承诺任何 CLI 码或退出码**，也不登记新码。该形态与「渲染改惰性求值（以便给稳定 exit 3）」一起留 S6-B，触发信号 = 需要稳定错误面时。
> **`gate` 侧必须调用 `validatePolicy()`**：它是本 spec 唯一的运行时防线（配置非法时 `gate` 必须 exit 1 并给五个码之一，不得落成 `Mismatch` 或被静默放行）。
> **报文路径一律仓内 POSIX 相对路径**（形如 `tools/docgen/policy/seat-policy.mjs` 加冒号行号）；**禁止**出现绝对路径、盘符、用户目录（`C:\Users\…`）或 `file://` 前缀——首行会被贴进日志与账本。**适用面 = 上表五个 CLI 码 + `RenderNotEquivalent`**；既有 `Mismatch` 的报文格式本轮不改（保持现状）。
> 黄金换代后「当前比对键」= 同席中 `<席>@<轮次>` 轮次最大者，无则取基线键（保证换代后 V-2 的定位线索仍有终点）。

## 8 验收 V-1～V-13

| # | 验收项 | 判据（可机械复核） |
|---|---|---|
| V-1 | **能力矩阵等价（功能不丢）** | ①–④ 四段各做集合 diff，**空集差**：① tools 集合 + 档位名；② 可写产物集 / 禁写文件集；③ 禁写路径集（数组元素 21 / 定义层点名 22 / 卡面成员 23）；④ 允许命令集（14 条）+ 禁止命令集（**由 `policy --dump` 现算**）+ 环境变量形态。**段 ⑤ 不做集合 diff（归 V-12）**。**取项方式**：以定义层成员为字典在渲染文本里做存在性匹配（不按反引号切、不靠分隔符猜），成员集合 = `pathTokens()` / 各组 `verbs` / `env.assign.verbs`；`DOCGEN_*` 这类说明性固定文本登记白名单但**不进成员集合**。**改造后取渲染文本** `renderBoundary(席)`，`dump` 只作交叉核对；改造前 = `fixtures/capability-baseline.json` |
| V-2 | 迁移期渲染对照（辅助，不作验收） | 两席渲染与黄金哈希比对，只用于定位；**不作通过判据** |
| V-3 | 定义 / 配置分离 | 配置层 closed-world：三键之外零字符串；三键内逐条查定义层（负例 `artifacts: ['definitions/x.mjs']`、`allowGroups: ['git status']` 必红） |
| V-4 | 按作用分组 | 命令 8 组 + 席级组、路径 6 组，每组 `purpose` 非空；组内顺序 = 卡面顺序；`capabilities` 展开 ≡ `toolsForSeat`（不变量 9） |
| V-5 | **九条不变量** | 9 条各有 1 个负例，全部按 §7 报错；含归码优先级（形态错 → `LiteralInConfig`，形态对但未登记 → `UnknownPolicyRef`，已登记属禁止 → `ForbiddenGroupGranted`）；不变量 7 的负例 = 模板漏槽 / 多槽 |
| V-6 | 改一条只动一处 | **新增一条禁止路径** → 只改 `definitions/paths.mjs` + 重生成两张卡 → `gate` 绿；其它源文件 0 改动（反向验证留构造） |
| V-7 | 副本收敛 | 扫描面写死 = **非 `docs/` + S5 testcase**（S5 spec 的清单原句按 `docs-convention` 属历史记录、允许保留，但必须有指针）；活跃副本命中处 = 定义层 1 处 + 2 张卡；**本 spec 自身** / 测试 / S5 testcase **0 条手抄** |
| V-8 | 加一席只改数据 | 副本内给已登记席加一个 `allowGroups` 组 → 只改 `seat-policy.mjs` 一处、且只该席 `renderBoundary` 输出变；**新增一个席**时改动 = `seats.mjs` 的 `display` + `seat-policy.mjs` 的组（两处数据、零代码），其余席渲染零变化（度量层 = 渲染层） |
| V-9 | 纯度守卫有效 | ① 模板塞一条不在白名单的清单类成员 → `TemplateImpure`；② 白名单登记清单类成员 → 同样 `TemplateImpure` |
| V-10 | 全量回归 | `npm run check` → `0 findings` + `check 全部通过`；`policy --dump` 可复算 4 席（3 席 + `__default__`）展开结果 |
| V-11 | **双向下探（能力可用）** | 「拦」= **判据层**（配置校验 + 渲染可指涉 + §7 报错码），不是运行时授权。允许集（14 命令 / 可写产物 / 6 tools）逐项「使用 → 不被拦」；禁止集（禁止命令组 + 23 路径 + 5 禁止组 + 席级组禁止 verb）逐项「使用 → 必判红」，条数由 `policy --dump` 现算 |
| V-12 | **散文子句存在性（⑤ 段）** | 不要求整段相等；逐条断言存在：越权四要素（文件 / 改前改后 sha256 / 是否可复原 / 命令原文）、用户执行复原、本轮结论作废、检测限度（点名 `.session/` 盲区）、检测命令（`--no-optional-locks`）、**审计「核转录」与侦探「本席不核签」两句职责** |
| V-13 | **A/B 盲评（质量不降 + 至少一维更好）** | 取两组卡：A = `git show <改造前 commit>:agents/<席>.md`，B = 改造后渲染；**评「边界五段」切片**，不是整卡。评测者 = 2 个全新上下文子代理（非 spec 作者 / 非施工者），每席 2 个独立实例、顺序打乱；`mapping.sealed.md` 存 `.session/reviews/<…>-s6-eval/`，评完解封。判据：每维 B ≥ A 且至少一维 B > A；任一维 B < A → 不得声明完成（记 `QualityRegression`，回改模板/定义，**至多 2 轮**） |

## 9 测什么 / 为什么

用 `docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design-testcase.md`（同批独立编写）。本 spec 只说明意图：**测语义等价**（V-1 / V-11）、**测结构约束**（V-3～V-5、V-9）、**测可维护性**（V-6～V-8、V-10）、**测质量不降**（V-13）。

### 9.1 A/B 盲评 rubric（8 维，每维 0/1/2）

通用定义：**0** = 明显不可执行或含糊；**1** = 可执行但有歧义；**2** = 精确、可直接执行。逐维 0 分样例由 testcase 维护。

| 组 | 维度 | 一句话判据 |
|---|---|---|
| 精准 P | P1 歧义词 | 「尽量/合理/视情况/如有必要/等」计数 = 0 |
| 精准 P | P2 可指涉 | 每条规则能指到 path / 命令 / 组 ID / 字段名 |
| 精准 P | P3 一致性 | 同一事实（如 git 命令形态）卡内多处一致 |
| 精准 P | P4 无含糊兜底 | 无「其他/等等」式开放清单 |
| 执行 E | E1 禁止可检 | 每条禁止项写明「怎么发现」（命令 / 快照 / 复核方） |
| 执行 E | E2 命令可直接跑 | 每条允许命令含完整参数、可直接复制执行 |
| 执行 E | E3 后果闭环 | 越权后果写明 谁记 / 记什么 / 谁核 / 何时作废 |
| 执行 E | E4 无自相矛盾 | 要求做的动作与允许的能力不冲突 |

### 9.2 评估体系：账单、清单、评分与阈值（复用既有机制）

**复用**（出处写死）：① 三态 `pass / fail / pending` 沿用 `tools/execution-matrix/criteria.md` + `annotations`；② 「按项计分 + 满分现算 + 分数不持久化」沿用 `skills/rule-inspector` 的 `score.mjs`；③ 置信度沿用 `tools/execution-matrix/rating.mjs`（`N = 3`：记录 ≥3 且零回归 → `high`，有记录但不全 → `mid`，无记录 → `low`）；④ 缺陷分级沿用议会卡 P0/P1/P2；⑤ checklist 形态沿用 `.session/rule-checks/checklist-*.md`。

**四本账单**（评估期落 `.session/reviews/<YYYY-MM-DD-HHMM>-s6-eval/`；评估收口后整目录迁 `docs/superpowers/reviews/<同名>/` **进 git**，缺一本 = 不得声明完成）：

| 账单 | 内容 | 固定列 |
|---|---|---|
| `rubric.md` | 冻结版评分表（8 维 × 0/1/2 + 0 分样例） | 维度 / 0 / 1 / 2 / 判据来源 |
| `capability-diff.md` | 能力矩阵 diff（V-1） | 段 / 项 / 改造前 / 改造后 / 差（`-` 丢 / `+` 越权 / `=`）/ 取数命令 |
| `ab-score.md` | A/B 逐维分数（V-13） | 维度 / A 分 / B 分 / 差 / A 证据行 / B 证据行 |
| `checklist.md` | 执行清单（施工前 / 中 / 后 + 顶部「交付说明」节） | 阶段 / 项 / 判据 / 状态 / 证据 |

**工作量口径**：2 席 × 2 实例 × 8 维 × 2 侧 = **32 格评分、64 条证据行**（不是「4 条记录」）。

**盲评隔离**：评测实例的输入**只有两张卡文件**（A/B 各一），不得读仓内其他文件、不得读 `mapping.sealed.md`；`mapping.sealed.md` 存 `.session/reviews/<…>-s6-eval/`（不进 git），评完解封。由 K05 的「评测目录内无 mapping + 实例输入清单」断言守。

**评分规则**：单维 0/1/2，8 维**等权**、满分 **16**（**不设权重列**）；总分只作参考，**不作通过判据**；通过判据 = 逐维 B ≥ A 且至少一维 B > A。任一分无「卡内原文行」证据 → 记 **pending**（既不是 0 分也不是通过），pending 存在即不得声明通过。

**置信度**：4 条记录（2 席 × 2 实例）全部零回归 → `high`；出现回归 → `mid`。交付说明必须写实际档位与取数（`node tools/execution-matrix/rate.mjs` 口径）。

**改分纪律**：`rubric.md` 冻结后不得改分；发现缺陷 → 记 P2，**重跑全部打分**。两实例同维分歧 ≥1 分 → 第三人复评；未收敛记 `pending`（不许取平均）。

## 10 不测

| 不测 | 理由 |
|---|---|
| 平台是否真能拦住白名单外命令 | 无参数级授权位（PRD §9.1 实查裁定），既成事实 |
| 边界句的语义严度 | 语义判断，归议会 `reviewer-qa` + 审计人读 |
| `outputFormats` / `sharedBlocks` 的同类副本 | 范围外（S6-B） |
| `DEFAULT_BOUNDARY` / `evidence-reader` 边界 | 结构不同构，本轮不收 |
| 运行时是否真的按边界行动 | 运行时行为归议会流程与侦探快照 |
| A/B 的「审美」部分 | 只评 P/E 八项可指涉判据 |
| dump 是否写仓外临时文件 | 只承诺「不写仓内文件」；仓外不可证 |

## 11 裁决与差异

### 11.1 已定裁决（来源：PRD §10 F-24 立项 + 交接词 §既定约束）

| # | 问题 | 裁定 |
|---|---|---|
| Q1 | 走「补测试」还是「结构化」 | 结构化（定义统一 + 配置分离） |
| Q2 | 定义与配置的关系 | 定义统一、配置分离、互不影响 |
| Q3 | 是否单独立功能点 | 是：F-24 / S6，PRD §0 已两次重签 |

### 11.2 议会开放项（议会 #3 已裁）

| # | 开放项 | 裁决 |
|---|---|---|
| Q4 | 席级组本批做还是后置 | 本批做（空集落地 + 不变量 8 守内容） |
| Q5 | `policy --dump` 本批做还是后置 | 本批做（审计与测试都要能自取数） |
| Q6 | 分组粒度 8 + 6 是否够 | 先按此落地；出现「只要组内一半」再加席级组（受不变量 8 约束） |

### 11.3 差异清单（相对现状）

| # | 差异 | 为什么必须 |
|---|---|---|
| D1 | 两 producer 席范围内的规则文本：6 处副本 → 1 处数据 + 1 处模板；改一条禁写路径写入点 7 → 3 | 本 spec 的唯一目的；收益是防分叉 |
| D2 | 删除 `BOUNDARY_COMMAND`（无挂席） | 无守卫的死常量（值留 git 历史） |
| D3 | 测试判据从「手抄常量 + 包含」改为「import 定义层 + 渲染等价」，保留 3 条字面锚点 | 防判据成为第 7 份副本 |
| D4 | 卡面**允许措辞改进**；字节相等是最好情况与定位线索，**不作判据** | 结构变更不该惊动产物，但质量要能更好（V-1 / V-13） |
| D5 | S5 spec §3.3 / §8 加指针、S5 testcase 三条改判 | 否则 S5 仍以死常量为判据 |
| D6 | 新增 `policy --dump` 只读子命令 + `components/validatePolicy.mjs` | 让 spec / 审计 / 测试能按需取数，且五码有唯一发射点 |
| D7 | 侦探固定清单命令副本**本轮不改**（登记待触发） | 不属边界句；失效条件见 §2 第 7 条 |

### 11.4 复核与议会 #3 记录

| 阶段 | 结果 |
|---|---|
| 送议会前 | 主 agent ↔ `senior-sdet` 6 轮双向复核，累计 42 条、7 条 P0 全修（分轮明细与逐条依据见 testcase §10，本表不复制数字） |
| 议会 #3 第 1 轮 | 6 席（后端 / 测试 / 审计 / 产品 / 精算 / 安全）+ 侦探；62 张卡 → 32 族；全族承认或部分承认，零驳回、零误报 |
| 议会 #3 第 2–4 轮 | 增量复核：后端 10 + 测试 2 + 安全 2 + 审计 5 = 21 张卡（F33–F53），全部承认；全轮合计 **83 张卡** |
| v8 处置 | F1–F53 全部落本文件与 testcase；F13 / F15 采「范围不变 + 指针化」；账本 `.session/reviews/2026-10-25-111619-s6-policy-parliament/` |

### 11.5 用户追加的验收口径（v7 起生效）

用户原话要点（`docs/handoffs/2026-10-25-s6-policy-parliament.md:71-72`，取证摘要见本账本 `evidence.md`）：「不是要一模一样，而是**有的功能不能丢**」；「agent 走草稿模式，所以可以对比两个 agent 文档（改前 / 改后），看哪个**更精准、执行力更强**」。据此：V-1 改判能力矩阵等价、V-2 降为辅助、新增 V-11 双向下探 / V-12 子句存在性 / V-13 A/B 盲评。
