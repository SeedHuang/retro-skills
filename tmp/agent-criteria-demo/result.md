# reviewer-audit 卡优化：方案、思路、结论（demo 记录）

> 状态：草稿实验，不改正式产物（`agents/reviewer-audit.md` 未动）
> 对象：`models/reviewer-audit-model.json` → `output/reviewer-audit.md`
> 日期：2026-11-09
>
> ⚠️ **越界记录（2026-11-09 晚）**：讨论中途我曾越界改了正式仓库（`boundary.md.tpl`、`seats.mjs`、`outputFormats.mjs`、`renderCard.mjs`、3 张卡、`verifyLedger.mjs`），并被自动提交为 `776c068`。
> 用户已叫停，回滚待执行。**本轮结论以下文 §8 为准，正文 §3/§5 中与 §8 冲突的条目见 §9 标注。**

## 0 这份记录回答什么

一句话：**把角色卡改到「AI 读完能精确执行」的程度，先在一张卡上试，试通了再推广。**

记录三件事：怎么判断、改了什么、还差什么。

## 1 目标与约束

| 项 | 内容 |
|---|---|
| 目标 | 卡面读完，AI 知道读哪、怎么判、写哪、判错怎么办 |
| 约束 | demo 形式，不替换正式卡；一次只做一条，跑通再做下一条 |
| 不做什么 | 不动 `agents/*.md`、不动门禁、不新建 agent 席位 |

## 2 判断标准

**唯一标准：删掉这句，执行结果会不会变。**

| 不成立的判断方式 | 为什么不行 |
|---|---|
| 「我读着觉得是废话」 | 已经读岔过一次（把「交付物」当成被审对象，实际指本席产出） |
| 「字面上重复」 | 重复也可能在防误读，得看删了行为变不变 |

确定能删的只有两类：
1. 卡上别处已有同一信息（删了另一处还在）
2. 指向不存在的东西（读了也没法执行）

## 3 已做的改动

### 3.0 哪些是「用户判定为废话/浪费」的

这一栏只收用户明确说过「废话」「浪费」「不需要」的条目，与后面我判断重复的条目分开记。

| # | 条目 | 用户原话（锚） | 判定依据 | 处置 |
|---|---|---|---|---|
| U1 | 「你只核转录是否逐字一致」 | 「这个是不是上面已经得出结论了……所以这个又多了两句，没用的废话是吗？」 | 同一件事说了两遍 | 删掉前一处（第 86 行末），保留带对象的那句，再合并进清单第 8 条 |
| U2 | 「禁止写：progress.md、gate-record.md」整条 | 「那这个不就是废话了吗？你可以反驳我」 | 白名单已排他，黑名单是它的子集 | 整条删；「只核不改」搬到清单第 8 条 |
| U3 | 「其他一律不写」 | 「前面都已经标题很清楚了，只允许写这两个文件，后面你还写其他一律不写，不是废话吗？」 | 「只允许写 A、B」本身排他 | 删 |
| U4 | 黑名单与白名单并存 | 「只能存在一个，不能同时存在黑名单，又存在白名单，这个是浪费」 | 两套清单维护同一件事 | 只留白名单 |
| U5 | 「；归档后 `docs/superpowers/reviews/<本次>/`」 | 「对于 agent 来说『归档后…』这句话需要知道吗？」 | 归档不由本席执行 | 删 |
| U6 | 第一批六处（类别行、括号解释、pathGroups、②、S5-B、归档后） | 「先把我们刚刚说的哪些废话，先去掉」 | 整体授权按前一轮清单执行 | 全删，明细见 §3.1 |

**不算废话、被归到别处的两类**（避免和上面混）：

| 条目 | 用户的归类 | 实际处置 |
|---|---|---|
| 「每轮 / 终局」括号 | 「是他具体的动作以及动作触发的时机，不应该在写是否禁止和允许这里出现」 | 搬迁（§3.2），不是删 |
| 「角色」分组 | 「这个是角色吗？这不就是两个权限……角色这个分组一点都不准确」 | 拆成两条并列（§3.3） |
| 权限三行用表格 | 「表格，不是不利于 agent 的理解吗？」 | 改列表（§3.3） |

### 3.1 删（附理由）

| 删了什么 | 理由 |
|---|---|
| 「类别：卡片合规核对…」整行 | 下面的清单表七行全有，纯重复 |
| 第 86 行末「你在 round-check.md 核转录逐字一致」 | 与禁止写段那句同一件事，保留带对象的那句 |
| 「（只由议长写，段二 / 段三由议长从责任席的产出转录）」 | 解释议长怎么干活，本席用不上 |
| 「（签字原文由申报人转录，」 | 同上，保留「你只核转录是否逐字一致」 |
| 「以及 ③ 所列全部路径」 | 卡上没有 ③ 的任何定义，空引用 |
| 「禁写集合 = 策略源 pathGroups（六组）与一项模式项」 | 指不着实物；「除上述落点外一律禁止」已覆盖 |
| 「；归档后 docs/superpowers/reviews/<本次>/」 | 归档不由本席执行；留着反而多一个可写位置 |
| 「兜底句：凡 .gitignore 覆盖的路径一律禁止写入」 | 与「只允许写」冲突：账本目录本身就在 .gitignore 里 |
| 「——检测门强化归 S5-B」 | 开发待办，不是执行规则 |
| 「你是评审席（审计）」 | 标题与 frontmatter 的 name 已有 |
| 「档位事实：producer 档 + 六个工具整档授予」 | 与 frontmatter 的 tools 行逐字重复；且「producer 档」在卡上没有定义 |
| 「不假装白名单」 | 改为正面表述「只许跑三组」 |
| 「写入范围是封闭清单」 | 与「只许写这两个文件」重复 |
| 「其余一律不跑」 | 白名单本身排他 |
| 「其他一律不写」 | 同上：写文件的同类句，「只允许写 A、B」已排他 |
| 「（只限 ②）」 | ② 是悬空编号，卡上没有对应段落 |
| 「（逐条命令不在本卡重复）」 | 说了去哪儿找也没说，等于无信息 |
| 「draft（生成）只指生成动作…」 | 白名单已限定三组，draft 不在其中，无需额外解释 |

### 3.2 搬（内容对，位置错）

| 内容 | 从 | 到 | 理由 |
|---|---|---|---|
| 核转录逐字一致 | 「只允许写」句尾 + 「禁止写」括号 | 本席清单第 8 条 | 这是要做的事，不是写入许可 |
| 「每轮 / 终局」 | 写入许可的括号 | 职责第 11 行 | 时机属于动作，不属于权限 |
| 「gate-record 只核不改」 | 「禁止写」括号 | 清单第 8 条 | 动作约束放动作区 |
| 越界之后怎么办 | 混在边界段 | 独立「越界处置」节 | 流程与权限混在一起，读不清哪条是禁令 |

### 3.3 重组

边界段拆成两节：

```
## 权限
- 写文件：只许 <两个文件全路径>
- 跑命令：只许 <三组>；不得带环境变量赋值
- 禁止裁决他人分歧
- 禁止中断评审

## 越界处置
1. 立即停手。
2. 越权清单（四字段）写进 round-check.md。
3. 复算由独立于越权者的核验席完成……（待定，见 §5）
4. 本轮结论作废，直接报用户。
```

四条权限并列，一条规则一行，不再用表格（三行不是同类项，用表格反而暗示同构）。

另修一处标签错位：原文把「不裁决他人分歧 / 无中断评审」归在「角色」这个标签下。它不是角色属性，是两条禁令，已拆成两条并列。

### 3.4 改写

| 原文 | 改后 | 理由 |
|---|---|---|
| 结论写回审计表 | 结论写回 round-check.md（每轮）与 delivery-audit.md（终局） | 「审计表」是简称，新人指不到文件 |
| 只允许写：目录内的产物。round-check.md、delivery-audit.md、审计表 | 只允许写：两个文件全路径 | 「产物」与「三样」并列，实际只有两个文件（审计表 = 那两张表） |
| 写入许可 + 黑名单并存 | 只留白名单 | 黑名单是白名单的子集，并存 = 两处维护 |

## 4 留下的原则（可推广到其他卡）

1. **一个信息只出现一次**。重复的地方，只留信息最全的那一处，其余删掉或合并。
2. **一个载体只放一类信息**。权限只写能写什么、能跑什么；动作、时机、处置各回各家。
3. **白名单与黑名单二选一**。同一对象不能同时给允许和禁止两张清单。
4. **路径写全，但不写死绝对路径**。取数类的路径写全；跨技能只写技能名。
5. **判据要能落到「哪份文件、哪一列」**，只写到「正文」「附录」这种粒度，执行时还得猜。
6. **每轮都用的内容可以进卡；偶发事件的细节不进**。越界处置只留本席动作，复算、复原归流程文档。
7. **只凭阅读判断不了要不要删**，得看删掉后行为变不变。

## 5 还差什么（未解决）

### 5.1 卡面本身的缺陷

| # | 问题 | 现状 | 建议 |
|---|---|---|---|
| 1 | 卡上没有指向模板的指针 | 卡只说文件名，没说模板长什么样、去哪拿 | 写「产出格式走 `parliament-ledger` 技能」；技能已建好 |
| 2 | 清单 8 条与 round-check 模板 6 项不一致 | 交集只有 4 条，卡上独有 3 条，模板独有 2 项 | 先对齐成一个版本，再谈脚本 |
| 3 | 三个机械项靠人算 | 计数、落点验证、证据重放 | 模板自己承认「心算必错，实测数错 3 次被拦」→ 应脚本化 |
| 4 | 卡上 18 字段表与模板重复 | 已有两份字段说明 | 有了技能指针后，删掉卡上那张表 |
| 5 | 命令白名单三组是空的 | 只有组名，没有具体命令 | 要么展开，要么删掉这句（现状等于空指令） |
| 6 | 八条判据仍是人工判定 | 缺输入来源 / 允许取值 / 落点粒度 / 违规处置 / 取值方式 / testcase | 一条一条试点：先 `no-fake-problem`，跑通再下一条 |
| 7 | 「复算由核验席完成」留在本席卡上 | 不是本席动作 | 移到议会流程文档 |

### 5.2 写不清导致的执行分叉

| # | 问题 | 为什么会分叉 |
|---|---|---|
| 8 | 「立即停手」在「写越权清单」之前 | 照字面执行会停在第一条，账本也不敢写，越界反而没痕迹 |
| 9 | `na` 算不算答 | 清单说填 na 写 reason 即可，「一定会」说每行必答、缺答 = 不合格；同时成立则 na 既算答又算缺答 |
| 10 | 清单表头叫「判据」，内容却是核对内容描述 | 表名叫判据，填的人不知道这一列该填判据还是做法 |
| 11 | 「结论写回交付物正文」的粒度只到「正文」 | 审计表有 18 个字段，不知道落在哪一行哪一列 |

### 5.3 跨卡的结构问题

| # | 问题 | 影响面 |
|---|---|---|
| 12 | 18 张卡都引用「问题卡」，没有一张说明它有几个字段、去哪拿 | 18/18 |
| 13 | 判据的抽查人写的是本席（`who = reviewer-audit`），而本席自己也在被约束名单里 | 5 条判据 → 自己判自己抽 |

### 5.4 已解决（记在此处防重复发现）

| 问题 | 处置 |
|---|---|
| 模板两份真相：`outputFormats.mjs` 一份、`skills/parliament/assets` 一份 | 2026-11-09 已收口：模板文字只住 `outputFormats.mjs` 的 `docs`，由 `ledger.mjs` 生成到 `skills/parliament-ledger/assets/` |

## 6 下一步顺序

1. 卡上加技能指针（`parliament-ledger`），删掉卡上的 18 字段表。
2. 对齐清单 8 条与模板 6 项，选一个真源。
3. 挑一个机械项写脚本，验证「卡上只写跑哪条命令」这条路。
4. 判据逐条改造：输入来源 → 取值方式 → testcase，一条通了再下一条。

## 7 本轮实测数据

| 项 | 值 |
|---|---|
| 原始卡（改动前） | 3345 字符 / 2906 非空白 / 99 行 |
| 草稿（当前） | 2450 字符 / 2064 非空白 / 95 行 |
| 非空白降幅 | −842 字符（−29.0%） |
| 清单条数 | 7 → 8（新增转录核对） |

> 注：`agents/reviewer-audit.md` 现在已被越界替换成 2681/2399/71 行，**不是原始卡**；原始卡数据取自本记录早期实测，回滚后可复算。

取数命令：

```powershell
node -e "const fs=require('fs');const b=fs.readFileSync('tmp/agent-criteria-demo/output/reviewer-audit.md','utf8');console.log(b.length,b.replace(/\s/g,'').length,b.split(/\r?\n/).length)"
```

## 8 本轮新增结论（2026-11-09 晚，以此为准）

### 8.1 越权记录：唯一入口在过程账

| 结论 | 理由 |
|---|---|
| 越权记录不每个账本都写 | 六份账本各写一份 = 六处副本，改一处漏五处 |
| 唯一入口 = `progress.md` 段二 | 越权是过程事件，过程账是公共账 |
| 不新增 `overreach.md` | 低频、大概率长期为空；已有观察记录与过程账两个载体 |
| 卡上不写「报给谁」 | 汇报对象是流程编排，属 skill；写进卡既不可靠（议长查不出来）又越权 |

### 8.2 越权检测：归主 agent

| 结论 | 理由 |
|---|---|
| 主 agent 派活前后各跑一次 `git status --porcelain` 对比 | 它掌握时序、独立于被检测者、本来就在跑；成本几乎为零 |
| 侦探的「工具越权核对」与主 agent 重复 | 侦探是独立子代理，调用成本远高于一次命令 |
| 「命令原文」只有当事人知道 | `git status` 只能看出文件被动，看不出跑了什么命令 |

### 8.3 卡面越界处置：只留三步

```markdown
## 越界处置

1. 停手。
2. 保留越权信息：文件、改前/改后 sha256、可否复原、命令原文（命令原文只有你知道）。
3. 本轮结论作废，报用户。
```

- 不写「账本照写」：节标题已限定语域，第 2 条已说要保留信息
- 不写「复算由核验席完成」：主语不是本席
- 「检测限度」保留一句短版（同步写进流程文档，不再进卡面）

### 8.4 输出格式：卡面只指针，字段住数据，校验器读数据

| 层 | 管什么 | 位置 |
|---|---|---|
| 卡面 | 只说「按哪张表填」 | 一条指针 |
| 模板 | 给人填的表格结构 | `outputFormats.docs` 生成到 `parliament-ledger/assets` |
| 校验器 | 判产物字段齐不齐、填没填 | 读同一份 `outputFormats` |

- 删除卡上 18 项字段表（列名 / 行项 / 节名混在一张编号表里，且与模板重复）
- 校验器只判痕：文件在不在、表头齐不齐、必填列非空；**不判值合不合理**（归 residual 人工抽检）
- 开发期校验模板与数据一致；评审期才校验产物

### 8.5 与现有规范的冲突（未解决）

| 断言 | 它要求 | 与新方案的关系 |
|---|---|---|
| `S4-TC-D01` | 7 个 outputKind 每份必须结构化 `{fields[], checks[]}`，无散文、无指针 | **正面冲突** |
| `S4-TC-D03` | 输出格式块出现指针词 → 红 | **正面冲突** |
| `S4-TC-D04` | 输出格式块残留散文声明 → 红 | 冲突 |
| 其余约 15 处 | 边界句子句、15 槽、默认边界句 11 席不变、能力 diff、哈希基线 | 属基线锁，需更新期望 |

结论：**卡面改指针不是改文案，是改规范。** 要么先改这三条 spec，要么回滚。

### 8.6 脚本分三个维度（不是一类）

现在把构建期、开发期、运行期三种脚本混在同一张「命令白名单」里，这是根问题。

| 维度 | 什么时候跑 | 谁跑 | 应在哪 | 能否随套件分发 |
|---|---|---|---|---|
| **构建期** | 改数据后重新生成 | 开发者 / CI | `tools/docgen/builders/` | 否 |
| **开发期** | 提交前 / CI | 开发者 | `scripts/` | 否（依赖仓库结构） |
| **运行期** | AI 干活时 | agent / skill | `skills/<名>/scripts/` | 是 |

**混装的具体表现**

| 命令 | 真实维度 | 现状 |
|---|---|---|
| `npm run check`、`scripts/check-all.mjs` | 开发期 | 被写进 agent 卡的「允许命令」 |
| `cli.mjs gate` / `cli.mjs diff` | 构建期 | 同上 |
| `scripts/skill-dir.mjs` | 开发期（兼技能自查） | 同上 |
| `scs time` | 运行期（平台工具链） | 可以留 |

**判定规则（修订版：先看根目录从哪来）**

| 根目录来源 | 例子 | 能否跨仓 | 归哪层 |
|---|---|---|---|
| 写死自身位置（`import.meta.url`） | `skills/skill-inspector/scripts/check.mjs` | 能，随技能走 | 运行期 |
| **参数传入（`--root <dir>`）** | `scs check criteria-engine --root <dir>`（默认当前目录） | 能，任意仓库 | 运行期 / 通用工具 |
| 写死「上上级是仓库根」 | `scripts/check-all.mjs` | 不能 | 开发期 / 构建期 |

辅助两条：
1. **谁调用**：卡 / 技能正文调 → 运行期；npm script / CI 调 → 开发期；docgen 生成流程调 → 构建期
2. **是否随套件拷走**：会 → 运行期

**关键修正**：分界线不在「脚本用途」，在「根目录写法」。
一个开发期校验脚本，只要把根目录改成参数传入，就能被 agent 在任意仓库调用，从而进入运行期。
所以「构建期/开发期/运行期」不是脚本的固有属性，是**当前写法**的属性；写死了才不可复用。

**派生结论**

| 结论 | 影响 |
|---|---|
| 运行期脚本必须住在技能目录里 | 审计的计数 / 落点 / 核对单校验要新建 `parliament-ledger/scripts/` |
| 卡面命令白名单只写运行期可用的 | 14 条砍到 3-4 条 |
| 开发期 / 构建期命令只进 `package.json` | 不进卡面 |
| 「check.local」组名本身有歧义 | 它装的是开发期自检，不该进运行时白名单 |
| 运行期脚本不得写死自己的位置 | 被审仓库路径用 `--root` 传入（对齐 `scs` 的做法） |
| 想把开发期脚本复用给运行时 | 只需把根目录改成参数，不必搬家 |

**待定**
是否把这条三层分类写进 `carrier-conventions`（脚本放哪的判据）。本轮只记录，不落规范。

### 8.7 权限段：用判据 DSL 生成（2026-11-10 实测）

把「权限」写成判据规则（现有 18 个算子），结构校验通过，渲染正文如下。注意：这是**判据文档**形态，不是角色卡段落。

#### 8.7.1 命令名单（`audit-seat-command-scope`）

```markdown
# 审计席命令名单

> 触发：命令执行

义务（全部成立才合规；缺一件 = 不合格）：
1. 命令名单：必须以以下任一项开头：scs time / scs ledger gate / scs ledger numbers / scs check landings --ledger / git --no-optional-locks status --porcelain / git --no-optional-locks diff / git --no-optional-locks show / git --no-optional-locks log / git --no-optional-locks reflog show / node tools/docgen/builders/agents/cli.mjs gate / node tools/docgen/builders/agents/cli.mjs check-agents / node tools/docgen/builders/agents/cli.mjs diff --kind agent --name / node tools/docgen/builders/agents/cli.mjs draft ls

落点：command-record
```

#### 8.7.2 写盘形态（`audit-seat-write-form`）

```markdown
# 审计席写盘形态

> 触发：命令执行

义务（全部成立才合规；缺一件 = 不合格）：
1. 重定向：不得匹配 `(^|\s)\d*>>?\s*\S`
2. 写盘参数：不得包含以下任一：--output / --apply / --write

落点：command-record
```

#### 8.7.3 变量赋值（`audit-seat-env-assign`）

```markdown
# 变量赋值禁令

> 触发：命令执行

义务（全部成立才合规；缺一件 = 不合格）：
1. 变量赋值：不得匹配 `(^|\s)(export\s+\w+\s*=|setx\s+\w+|set\s+\w+\s*=|env\s+\w+=|\$env:\w+\s*=)|^\s*(\w+=\S*\s+)+(\S)|^\s*\w+=\S*\s*$`

落点：command-record
```

#### 8.7.4 判定实测

| 输入命令 | 命令名单 | 写盘形态 | 变量赋值 |
|---|---|---|---|
| `git --no-optional-locks log --oneline` | pass | pass | pass |
| `git --no-optional-locks log --output=x` | pass | **fail** | pass |
| `git log --format=%s>%h` | **fail** | pass | pass（引号内 `>` 不误伤） |
| `cmd > out.txt` | **fail** | **fail** | pass |
| `$env:DOCGEN_BASELINE_PATH=tmp node x.mjs` | **fail** | pass | **fail** |
| `set VAR=1` | **fail** | pass | **fail** |
| `VAR=1`（单独一行） | **fail** | pass | **fail**（修正前漏判） |
| `$env:V = 1`（等号带空格） | **fail** | pass | **fail**（修正前漏判） |
| `setx VAR 1` | **fail** | pass | **fail**（修正前漏判） |
| `curl -d a=b https://x` | **fail** | pass | pass（修正前误伤） |
| `node x.js --flag=1` | **fail** | pass | pass（参数里的 `=` 不误伤） |
| `npm run check` | **fail** | pass | pass |

变量赋值判据共跑 14 条样例，**不符 0 条**（`judge` 实测）。

#### 8.7.5 为什么必须拆三条（前一版错在哪）

| # | 前一版写法 | 问题 |
|---|---|---|
| 1 | 把「不得带 `--output` / `--apply` / `--write`」与「命令名单」放在同一条判据的 `assert` 里 | 三种判据面（授权名单 / 写盘形态 / 变量赋值）混装，渲染出来像「这些命令的参数表」；读者会去核对每条命令有没有 `--apply`——而白名单里只有 `git log` / `diff` / `show` 真有 `--output`（实测 `git --no-optional-locks log --output=<file>` 生成 204 字节文件），`--apply` 只属 `generate`、`--write` 只属 `baseline --write`，两者都不在白名单 |
| 2 | 卡面写「不得带任何形式的环境变量赋值」 | 策略口径是「禁止任何形式的赋值动作」（含独立一行、含 `VAR=… cmd` 前缀）；写成「命令不得带」会把「读环境变量」也误读进去 |
| 3 | 用 `notContains` 判重定向 `>` | 子串匹配会误伤引号内字符（`git log --format=%s>%h`）；换带边界正则后实测不误伤 |
| 4 | `values` 里写 `scs ledger numbers <评审目录>` | 占位符当前缀永远匹配不上真实命令（实测 fail）；规则里只放无占位符前缀 |

**结论**：DSL 与算子没有出错——渲染器只是照声明投影（`notContains` → 「不得包含以下任一」，`notMatches` → 「不得匹配 …」），schema 只查结构与字段，不查语义归属。错在建模粒度：一条判据只装一个面。

#### 8.7.6 evidence-reader 独立复核（2026-11-10）

让 evidence-reader 席只读复核「正则句 vs 自然语言句」，三点指出、三条复验全部成立：

| 复核结论 | 复验（`judge`/正则实测） | 处置 |
|---|---|---|
| 旧正则漏「单独一行赋值」 | `VAR=1` → pass（应 fail） | 加 `^\s*\w+=\S*\s*$` 支 |
| 旧正则漏「等号带空格」 | `$env:V = 1` → pass（应 fail） | 各支改 `\s*=` |
| 旧正则误伤「参数里的 `=`」 | `curl -d a=b https://x` → HIT（应 pass） | 赋值前缀只认命令首位 `^\s*(\w+=\S*\s+)+(\S)` |
| `setx?` 是语法陷阱 | `setx VAR 1` 漏判（`setx?` 只吃 `set`/`setx` 后接 `=`） | 拆成 `setx\s+\w+` 与 `set\s+\w+\s*=` 两支 |
| 「任何形式」不可机判 | 正则只覆盖已枚举形态 | 卡面不写「任何形式」，改枚举 + 边界形态归审计人工 |

修正后自测 14 条（上表 12 条 + `VAR=`、`A=1 B=2 node x` 两条）**不符 0 条**。evidence-reader 的原始结论：「留 A——只有它能被第二人按同一文本复算出同一判定」。

### 8.8 命令条数口径与卡面投放形式

**推荐：9 条（只 run 组），不写条数。** 理由：

- 分层 PRD 已定「卡面命令白名单只渲染 `layer=run` 的组」（`docs/prd/20261109211349-script-layer-refactor/index.md:80` D4），验收判据是「卡面出现 `layer≠run` 的 verb 数 = 0」（同文件 `:169` V1）。
- 14 条是分层前的旧口径（dev 4 + run 6 + build 4）；分层后卡面只剩 run 组。
- 审计若需被审仓库的 `npm run check` 输出，属「申报人产出证据、审计核输出首行」，不由审计席自跑（`round-check.md` 的取数口径本来就是「命令 + 输出」）。

条数本身不进卡面：名单逐条列出即可（本文 8.8 的示例同样不写「N 条」）。

**卡面可投放形式（按代价从低到高）**

1. **（推荐）指针 + 判据文档**：卡面一句，命令清单住 `rules/audit-seat-command-scope.md`（渲染物，单一来源）：

   ```markdown
   跑命令：白名单见判据 `audit-seat-command-scope`（名单外一律不跑）；`--output` / `--apply` / `--write` / 重定向 / 环境变量赋值一律禁止。
   ```

2. **卡面内联「义务行」形态**（去掉「触发 / 落点」外壳，只留三段）：

   ```markdown
   ## 权限

   - 写文件
     - 允许：`.session/reviews/<本次>/round-check.md`、`.session/reviews/<本次>/delivery-audit.md`
     - 禁止：任何路径含 `..`
   - 跑命令
     - 允许：白名单如下，名单外一律不跑——
       - `scs time`
       - `scs ledger gate`、`scs ledger numbers`、`scs check landings --ledger`
       - `git --no-optional-locks status --porcelain`、`git --no-optional-locks diff`、`git --no-optional-locks show`、`git --no-optional-locks log`、`git --no-optional-locks reflog show`
     - 禁止：任何写盘形态（`--output`、`--apply`、`--write`、`>`、`>>`）
     - 禁止：任何变量赋值形态（`export VAR=…`、`set VAR=…`、`setx VAR …`、`env VAR=… <命令>`、`$env:VAR=…`、`VAR=… <命令>` 前缀、整行 `VAR=…`）
   - 禁止裁决他人分歧。
   - 禁止中断评审。
   ```

   归属由层级表达（允许 / 禁止挂在轴下），不再靠相邻推断；句式仍是 `只许` / `禁止：任何 {集合名}`。这就是「轴」的落点：写文件轴与命令轴（`denyByDefault`）+ 路径形态、写盘形态、变量赋值形态（`allowByDefault`）；形态禁令约束的是命令，不含「这些命令的参数表」之意。

   代价：卡面从生成物退回半手写，`disk == render` 与指针化断言（SB-TC-31 / tool-tiers）需同步改。

3. **维持现役形态**：卡面只点名「白名单组」，命令清单只住策略 `commands.mjs`；读者要看得跳一次。

排序：**1 > 3 > 2**——2 的契约成本最高，收益只是少一次跳转。

### 8.9 核心要求与设计方案（数据 → 脚本投影，零人工翻译）

**核心要求（2026-11-10 定，后续以此为准）**

1. 建模产物定稿后，**引擎机械产出** markdown 判据 / 卡面片段；
2. 产出物必须 AI 可理解、逻辑顺畅、**不漂移**（逐字节可复现）；
3. **润色也走固定 script**，生成环节不许插人工/AI 翻译；
4. 同一套流程覆盖判据、skill、agent、rule 等所有产物。

**设计方案**：[design-zero-translation.md](design-zero-translation.md)；落地改动清单见 §8.10。

要点：产物模型由 `pattern` 单点扩成 `forms: [{text, pattern}]`；新增算子 `notMatchAnyOf`——判定取 pattern 并集，谓词渲染取 text 枚举，**两个投影同源**；每个 `text` 必须在 testcase 有 ≥1 条 fail 样例（`FormUncovered`），否则红。这样「卡面说的」与「机器判的」不可能不同步。

**通用形式：一条「轴」**（不同场景共用同一引擎）

```json
{ "subject": "command", "policy": "denyByDefault", "allow": ["<formId>"], "forbid": [] }
```

| `policy` | 判定 | 判据谓词 | 卡面句式 |
|---|---|---|---|
| `denyByDefault` | `allow` 至少命中一条 | 必须以以下任一项开头：A / B / … | 只许以下项（名单外一律禁止）：A / B / … |
| `allowByDefault` | `forbid` 全部不命中 | 不得出现以下任一：A / B / … | 默认允许；禁止任何 {集合名}：A / B / … |

句式模板固定、由 `policy` 选词：**对象唯一 → `禁止 X`；对象是集合 → `禁止任何 {集合名}：{枚举}`**；允许侧统一 `只许 …`。「允许所有 X，除了 Y」= `allowByDefault + forbid:[Y]`，卡面写「默认允许；禁止任何 {集合名}：Y」，不需要第五种句式。「任何」是全称，判据只覆盖已登记 form，未登记形态归 residual 人工抽检；同一轴不同时给 `allow` 与 `forbid`。

- `subject`：受控面（`command` / `writePath` / `paramForm` / `envForm` …）；
- `allow` / `forbid`：**登记过的 form ID**，不放裸字符串（守 closed-world）；
- 默认值必须显式写，不靠口头约定——命令是穷举白名单（默认拒），形态是黑名单（默认放），两者不能统一成一个默认值。

**本仓已有的同构结构**（可被这套形式统一）：`commandGroups` + `forbiddenGroups`（命令轴）、`pathGroups`（路径轴）、`artifacts`（写文件轴）、`env.assign`（envForm 轴）。场景差异只在轴清单、ID 与默认值。

**本卡面的实例**：命令轴（denyByDefault，9 条）+ 写文件轴（denyByDefault，2 个产物）+ 写盘形态轴（allowByDefault）+ env 形态轴（allowByDefault）。

**本次演示**：[output/reviewer-audit.md](output/reviewer-audit.md) 的「权限」段已按该设计改写——
- 写文件 1 条（含 `..` 越界）；
- 跑命令：白名单逐条列出、**不写条数**、另起一行「名单外一律不跑」；
- 写盘形态、变量赋值各一条独立形态禁令（不再挂在「跑命令」下当参数表）；
- 两条行为禁令各自成行。

**与草案原稿的差异**：原稿写 14 条（dev 4 + run 6 + build 4）。按现策略「卡面只渲染 `layer=run` 组」，机械生成是 **9 条**（`scs time` 1 + `audit.lookup` 3 + `git.read` 5）；`npm run check` 与 4 条 `cli.mjs` 属 dev/build，不在卡面。要保留它们得改策略，不是改卡面。

**未改动**：`tools/docgen/**` 任何运行代码、`agents/*.md` 任何现役卡、`dsl/rules/*.json`（均未新增/修改）。

### 8.10 落地改动清单（模型 / 校验 / 解释器，判定算法不动）

**分层结论**

| 层 | 改不改 | 改动性质 |
|---|---|---|
| 数据模型 | **要改** | 新增「轴」容器（`axes`）与形态登记（`forms`） |
| 校验 | **要改** | 新结构的结构校验 + 新码 |
| 解释器 | **要改** | 新增判据版 / 卡面版两个投影 |
| 判定语义 | **基本不改** | 轴不产生新算法；只有需要「多形态并成一条正则」时才加 `notMatchAnyOf` |

只改解释器不可行：分组信息不在数据里，渲染时只能靠规则 id 或顺序猜，等于把「分组」退回人工——与零翻译目标冲突。

**1. 数据模型**

- `tools/docgen/dsl/rules/<id>.json` 新增可选 `axes`：

```json
{ "axes": [
  { "subject": "writePath", "policy": "denyByDefault",  "allow": ["artifact.round-check", "artifact.delivery-audit"] },
  { "subject": "writePath", "policy": "allowByDefault", "forbid": ["path.parentEscape"] },
  { "subject": "command",   "policy": "denyByDefault",  "allow": ["cmd.scs.time", "cmd.git.log"] },
  { "subject": "command",   "policy": "allowByDefault", "forbid": ["form.fs.write", "form.env.assign"] }
] }
```

- 约束：`policy` 必填且只认 `denyByDefault` / `allowByDefault`；同轴不同时给 `allow` 与 `forbid`；`allow`/`forbid` 只放登记 ID。
- 兼容：无 `axes` 的规则照旧走 `when`/`assert`，现有 4 条规则免迁移。

**2. 形态登记层**

- 新增 `tools/docgen/dsl/rules/vocab/forms.json`：每条 `{ id, text, pattern }`（前缀型用 `prefix`）。
- `text` 供渲染、`pattern`/`prefix` 供判定；**同一条 form 内两者绑定**，改一处必须改另一处。

**3. 校验（`tools/docgen/builders/rules/schema.mjs`）**

- `walkCond` 旁新增 `walkAxes`；新码：

| 码 | 触发 |
|---|---|
| `AxisEmpty` | `axes` 为空数组 |
| `PolicyMissing` / `PolicyInvalid` | 缺 `policy` / 非枚举值 |
| `AxisBothAllowForbid` | 同轴同时给 `allow` 与 `forbid` |
| `FormUnknown` | 引用了未登记的 form ID |
| `FormUncovered` | 某 form 在 testcase 中没有 ≥1 条 fail 样例 |

**4. 判定（同文件 `judge`）**

- 有 `axes` 时逐轴判：`denyByDefault` → `allow` 命中 ≥1；`allowByDefault` → `forbid` 全不命中。
- 复用现有 `startsWithAny` / `notMatches` 的 `norm` 与前缀比较，**不新增算法**。
- 仅当需要「一条正则表达多形态」时才加 `notMatchAnyOf`（那时 `OPS` 18→19，才动判定语义）。

**5. 解释器（`interpreters.mjs` + 卡面侧）**

| 投影 | 模板 |
|---|---|
| 判据版 | `1. {subject}：允许 A / B；禁止 C / D` |
| 卡面版 | `- {轴名}` → `- 允许：…` / `- 禁止：任何 {集合名}（枚举）` |

- 定词由 `policy` 决定：`denyByDefault` → `只许以下项（名单外一律禁止）`；`allowByDefault` → `默认允许；禁止任何 {集合名}`。
- 卡面侧由 `cardPipeline` / `renderByName` 新增一段渲染，读同一份 `axes`；判据与卡面同源。

**5.1 本席清单投影（`checklist` → 表格）**

| 项 | 规则 |
|---|---|
| 表头 | `columns` 直出；第 3 列改写为 `判据（{headerRule}）`——三态口径只声明一次 |
| 分隔行 | 由 `columns.length` 生成，不写死 4 列 |
| 数据行 | `| {no} | {title} | {checkCriteria[criterion].label} | {kindLabels[kind]} |` |
| 未登记 | `criterion` 查不到 → 抛 `UnknownCriterion`，**不得渲染空串**（空串会被读成「无判据」） |
| 幂等 | 同一份数据渲染两次逐字节相同 |

- 渲染器只查 `checkCriteria` / `kindLabels`，**不写任何判据文字**；
- 落地改动点（现役）：`cardPipeline` 的 criterion 单元格由「直出字段」改为「查登记表 `label`」；`checkItems[].criterion` 改存 ID；
- 守卫沿用：表头逐字含 `VERDICT_HINT`（[check-tristate-header.mjs](file:///d:/Seed/retro-skills/tools/docgen/builders/agents/check-tristate-header.mjs)）、类型列三值（`S2-TC-D01`）。

**5.2 已定：判据登记表独立（采用选项 2）**

现役 `PREDICATES` 是 `must` / `never` 的 `criterion` 取值域（8 条，交付物判据）；审计的 8 条是另一族（核对审计产物）。**裁定：新开一张表，不并入 `PREDICATES`。**

| 项 | 落地形态 |
|---|---|
| 登记表 | 新文件 `tools/docgen/builders/agents/card-model/vocab/audit-criteria.mjs`，导出 `AUDIT_CRITERIA` |
| 模型字段 | 本文 §10 的 `checkCriteria` 即该表内容，Key 不变 |
| 引用方 | `checklist.items[].criterion` 只查 `AUDIT_CRITERIA`；`must` / `never` 只查 `PREDICATES` |
| 校验 | 两表 closed-world 各自独立；跨表引用 → `UnknownCriterion` |
| 理由 | 并入会让 `must` 可误引用审计判据；分表后两族取值域互不污染 |

**6. 文档与测试**

- `skills/rule-writer/references/criteria-dsl.md`：补 `axes` / `forms` / `checklist` / `checkCriteria` 字段与上表新码。
- 测试：每轴正反例各 ≥1；每个 form 至少 1 条 fail 样例；`checklist` 行数 = `items.length`、每行 `criterion` 已登记；若加新算子，同步算子数断言（18→19）。
- 沿用现有门：`node --test` 失败即红。

**7. 验收**

```
node tools/docgen/builders/rules/build.mjs     → 末行 rule-dsl ok
npm run check:criteria                          → 末行 criteria-engine ok
npm run check                                   → 末行 check 全部通过
```

**8. 不做**

- 不改任何 `agents/*.md` 现役卡（除非同批改策略）；
- 不在渲染层写死命令/形态字面量（守 closed-world）；
- 不强制迁移旧规则。

### 8.11 设计原则（本轮踩坑提炼）

适用范围：本套「建模 + 解释引擎」的设计与后续落地（判据 / 卡面 / 模板 / 规则正文）。

| # | 原则 | 本轮反例 | 正确做法 |
|---|---|---|---|
| 1 | **先查同源，再建字段**：建模前先问「这条信息已有来源吗」 | `outputs.path` 写成裸路径，与 `forms` 的 artifact 路径重复 | 只引用 `artifact.*` ID，路径从 `forms` 取 |
| 2 | **能同源就不靠校验兜**：判据是补救，不是首选 | 倒推出「新增 `OutputPathNotAllowed` 校验器」 | 同源后只剩一条集合包含断言，放现有模型校验器（不新增子系统） |
| 3 | **动手前先对齐现役实现**：现役没做的事，先假设它有理由 | 没先问「现役为什么不交叉校验」 | 现役两处同源于 `policy.artifacts`，所以本就不需要 |

**判据优先级**：同源 > 校验 > 人工。

**建模前自检三问**

1. 这条信息已有来源吗？
2. 能引用 ID 而不复制值吗？
3. 复制后谁保证一致？

**拆不动时先分型：句子问题，不是 DSL 问题**

适用范围：重构 agent 卡 / 判据时，一段话越拆越别扭的场合。

| 型 | 症状 | 真正病根 | 处置 | 本仓实例 |
|---|---|---|---|---|
| A 复合句 | 一句里塞了两件事，拆开后两边都不完整 | 一句话承担了两个语义 | **拆句**，模型不动 | 「只许 N 条，其他一律不跑」：前半是名单，后半是排他声明；后件不是废话，是 SB-TC-31 钉住的契约锚 |
| B 指代不明 | 一句话有两个主语，读完不知道说的是谁 | 对象没绑定 | **先绑主语**，再拆 | 「交付物」曾把「被审对象」和「本席产出」读岔（§2） |
| C 谓语缺定义 | 动作词读得懂，但写不出判法 | 该动作没有可观测展开 | **去代码/文档找定义所在的那一行**；找不到 = 规范空白 | 「可复现触发序列」能从 `outputFormats.mjs` 的 issue-card checks 借到定义，不是靠读词 |
| D 真冲突 | 两句各自成立，放一起矛盾 | 取舍问题，不是句子问题 | **不拆，交人** | `S4-TC-D01` 要结构化 vs 卡面只指针（§8.5）；`na` 算不算答（§5.2 第 9 条） |

**扩 DSL 的判据**：拆的过程中要新增算子/字段才装得下时，先删掉这个新字段，看句子还读不读得通。

- 读得通 → 是句子缺话，加字段只是把猜测固化。
- 读不通 → 才是原语缺口，且等第二次出现（rule of two）再扩。

**固定顺序**：拆句 → 绑主语 → 找谓语出处 → 冲突交人 → 最后才扩 DSL。

**越拆越麻烦的可靠信号**：同一句结构改到第三次还别扭，通常是 A 与 B 混在一起——在用结构补语义（例如加 `scope` 字段去「表达」本该写清的主语）。

**同一形状的错误，本轮出现三次**

| 版本 | 症状 | 病根 |
|---|---|---|
| v1 | 一条规则塞三种判据面（名单 + 写盘参数 + 变量赋值） | 先写句子，后补结构 |
| v2 | `axes` 扁平、分组靠 `subject` 推导 | 先想渲染，后补层级 |
| v3 | `outputs.path` 写裸路径、想加新校验器 | 先想可测，后补同源 |

### 8.12 组件化路线：四族原子（先原子，后组合）

**原则**：先把原子组件稳定下来，组合组件等出现第二个消费者再抽。抽取的唯一验收标准是**产物逐字节不变**——变了就说明两者不同构，必须回退并在清单里标「不可合并」。

**四族原子（按我们模型 + 现役实际用到的清点）**

| 族 | 原子 | 已有消费者 |
|---|---|---|
| 渲染 | `heading` / `para` / `bullets` / `nestedBullets` / `orderedList` / `notes` / `table` / `keyValue` / `inlineCode` / `frontmatter` | cardPipeline、ledger.mjs、rules/build.mjs |
| 数据 | `enum` / `idRef` / `form` / `axis` / `criterion` / `fieldSpec` / `step` / `residual` / `policy` / `keysWhitelist` / `rank` / `decisionCase` | 本模型 §10 |
| 布局 | `sectionOrder` / `slotOrder` / `spacing` / `groupBreak` / `nestingDepth` / `titlePattern` | 卡片七段、forms.group、冲突裁决无空行 |
| 判定 | `verdict`（三态 + 必填标记）/ `probe` / `testcase` / `errorCode` | rules DSL、本模型校验 |

**registry 形状**

```js
{ type, family: 'render'|'data'|'layout'|'judge', props, invariants, emit?/validate? }
```

- `family='render'`：`emit(props) -> Block[]`；
- `family='data'`：只有 `validate(props)`，无渲染（由组合组件投影）；
- `family='layout'`：`apply(blocks) -> blocks`（排序、插空行、缩进）；
- `family='judge'`：`evaluate(input) -> pass|fail`。

**抽取顺序（仍守 rule of two）**

| 步 | 抽什么 | 依据 |
|---|---|---|
| 1 | `table` | ledger.mjs 已有块渲染、卡片本席清单、demo 三处 |
| 2 | `enumText` | `verdicts` / `kindLabels` / 现役 `TYPE_LABELS` |
| 3 | `spacing` | 冲突裁决「标题后不空行」vs 其他段空行，现役两套写法 |
| 4 | `criterionRef` | 本席清单 / 一定会 / 禁止 三处都引用判据 id |

**暂不抽**：`decisionCase` / `step` / `frontmatter` / `titlePattern` —— 各只有一处消费者。

**停止条件**：任一步若产物字节必须变化，立即回退并把该项标「不可合并（非同构）」。

### 8.13 尚未建模的段（草案 L1–28）

| 段 | 现役数据源 | 建模要点 | 可测性 |
|---|---|---|---|
| frontmatter | `trigger` + 席 id + 档位 | `name` / `description` 由 `trigger.when` 派生；`tools` 由 `capabilities` 展开 | 可测：tools = 档位工具集 |
| 职责 | `card.duty {trigger, action, constraint}` | `action` 里的结论落点改引 `artifact.*` id，不写裸文件名 | 半测：落点是否在允许集 |
| 一定会 | `SHARED_MUST`（[shared-actions.mjs](file:///d:/Seed/retro-skills/tools/docgen/builders/agents/card-model/vocab/shared-actions.mjs)）+ `criterion → PREDICATES` | 每条 = 触发场景 + 对象 + `criterion.label` + `landing`；5 条里 4 条同判据（`no-fake-problem` 出现两次，区分正文/附录） | 可测：条目数、判据已登记；判据本身 manual |
| 禁止 | `SHARED_NEVER` + `PREDICATES` | 同样是「对象 + criterion」结构，渲染为「不得…」 | 同上 |

**一个重要交叉验证**：一定会 / 禁止 引用的 `criterion` 属 `PREDICATES`（8 条交付物判据），而本席清单引用 `AUDIT_CRITERIA`（8 条审计判据）。这两族正好印证 §5.2 的分表决定——同名字段 `criterion`，两个取值域。

### 8.14 agent 完整建模：11 维 + 2 横切

> 本表是 2026-11-10 的快照。身份已建模（`seat.tier` 由 `seat-policy` 派生）、权限已收敛为 `permissions`、`bans`/`groups` 已删除；最新状态见 [open-issues.md](open-issues.md)。

**出发点**：agent 卡是**产出物**，不是程序。它只该回答「谁、何时、对什么、按什么判、判完写哪」；「怎么查、怎么算、怎么填」下沉 skill。三层建模（结构 / 语义 / 命令）不够——它们各自只覆盖了模型的一部分。

**判据建模为什么独立成层**

| 理由 | 说明 |
|---|---|
| 内容正交 | 结构只管「有一节叫判据」，语义只管「名词指谁」，都不管「怎么判」 |
| 依赖单向 | 判据消费语义（`observable` 引用 `records`），语义不认识判据 |
| 验收不同 | 结构靠 schema 齐全性，语义靠名词全覆盖，判据靠**负例必须判失败**；混层就无法单独跑 |

判据层的最小载体是四件套：`action` / `observable[]` / `negative` / `residual`。

**三种建模之外的完整维度（三圈）**

判断完整性的标准：第一圈全齐、第二圈按需齐、第三圈有跨卡登记。

第一圈（每张卡都必须有）

| # | 维度 | 回答什么 | 现有载体 | 现状 |
|---|---|---|---|---|
| 1 | 身份 | 它是谁、挂什么工具 | frontmatter（[output/reviewer-audit.md](output/reviewer-audit.md)） | **未建模**（§8.13 已列） |
| 2 | 结构 | 有哪些段、顺序、槽 | 卡模板 + `checklist.columns` | 部分；「一定会/禁止」行内槽不固定 |
| 3 | 语义（名词） | 每个词指哪个对象/落点 | `vocab` + `records` | 有；落点仍写裸对象名 |
| 4 | 判据（动词） | 怎么判、什么算命中、miss 之后怎么办 | `predicates` + `checkCriteria` + `verdicts` | 判定有，**判定后果缺** |
| 5 | 规则条目 | 哪些必须做、哪些禁止 | `must` / `never` / `bans` | 有；`trigger` 每条复制 |
| 6 | 时机 | 何时触发、每轮还是终局 | 内嵌在 `trigger` | 有；未独立成层 |

第二圈（有对应产物或交互才建）

| # | 维度 | 回答什么 | 现有载体 | 现状 |
|---|---|---|---|---|
| 7 | 命令 | 能跑什么、什么形态禁止 | `forms` + `groups` | 有；卡面手写全称，无 form ID |
| 8 | 写入 | 能写哪、路径边界 | `groups` 写文件轴 | 有 |
| 9 | 产物 | 产出长什么样、取值域 | `templates` + `outputs` + `verdicts` | 有；写法正确（只给指针） |
| 10 | 决策 | 冲突怎么裁、没覆盖怎么办 | `conflict.decision` | 有（3×3 含 undefined） |
| 11 | 异常 | 越界/失败怎么办 | `escalation` | 有；报告字段格式仍在卡上 |

第三圈（跨卡才能完整）

| # | 维度 | 回答什么 | 现状 | 缺口 |
|---|---|---|---|---|
| 12 | 关系 | 向谁报、听谁的、与谁并列 | 散在两处：`escalation.recipients`、`conflict.rankLabels` | **未独立**；「议长」写两遍 |
| 13 | 输入 | 数据从哪来、取不到怎么办 | 隐含在 `records[].source`（如 `progress.md 段二`） | **未独立**；无「取不到就停」规则 |

横切属性（不是维度，每层都要带）

| 属性 | 回答 | 载体 |
|---|---|---|
| 验收 | 这条规则怎么测 | `negative` / `machineCmd` / schema |
| 残余 | 测不了的部分谁判、抽几条 | `residual{who,sample,fields,objective}` |

**13 项差距表（现状 × 缺口）**

| # | 维度 | 圈 | 缺口 | 补法 |
|---|---|---|---|---|
| 1 | 身份 | 一 | frontmatter 无 schema 无数据源 | `name` / `description` 由 `trigger.when` 派生；`tools` 由 `capabilities` 展开（§8.13） |
| 2 | 结构 | 一 | 「一定会/禁止」行内槽不固定 | 定行模板：`时机｜对象｜判据｜落点`，槽名进 schema |
| 3 | 语义 | 一 | 落点是裸对象名（`deliverable.body`） | 改引 `artifact.*` ID，路径从 `forms` 取 |
| 4 | 判据 | 一 | 有 hit/miss/na 取值，无 miss 后果 | 补 `verdictOnMiss`：是否阻断、是否重审、写哪 |
| 5 | 规则 | 一 | `trigger` 9 条全同（实测 `uniqueTriggers 1`） | 提 `defaultTrigger` 到外层，条目只写例外 |
| 6 | 时机 | 一 | 内嵌在规则里，未独立 | 升为顶层 `timing`，被 `must` / `never` 引用 |
| 7 | 命令 | 二 | 卡面手写命令全称，无 form ID | 卡面只引 `groups[].id`，全文由 `forms.text` 渲染 |
| 8 | 写入 | 二 | — | 保持 |
| 9 | 产物 | 二 | — | 保持（指针 + 白名单，是标准写法） |
| 10 | 决策 | 二 | — | 保持（3×3 是真逻辑，不简化） |
| 11 | 异常 | 二 | 四字段报告格式写在卡上 | 格式下沉模板，卡上只留「停手 / 报议长 / 作废」 |
| 12 | 关系 | 三 | 席位拓扑散落两处 | 建 `relations{self, superior, peers, rank}`，两处都引用节点 ID |
| 13 | 输入 | 三 | 无「输入缺失」处置 | `records[].source` 升格为 `inputs[]`，缺输入走独立分支（不是越界） |

**另一处半缺：能力**——`tools`（粗粒度「能用 RunCommand」）与命令白名单（细粒度「只能跑这些」）是两级约束，未声明从属。默认应是 **tools 为上限、白名单为实限**，但需显式写进身份层。

**层间引用方向（必须单向）**

```
records(名词) ──> 判据(observable)
timing + 对象 + 判据 ──> 规则条目(must/never)
规则条目 ──> 决策(改判) / 异常(中止)
relations ──> 异常(报给谁)
写入(落点) + verdicts(取值) ──> 产物
```

下层不引用上层。一旦破例（如判据里写「用于一定会第 2 行」），就是漂移源头。

**第一期改造顺序**

1. 补第一圈缺口：身份（1）、时机（6）、结构行模板（2）、规则去重（5）
2. 补第三圈：关系（12）、输入（13）
3. 补判据下游：miss 后果（4）
4. 下沉三处操作细节：清单检查步骤、命令全称、越界报告格式

### 8.15 翻译点 → 语法缺口：缺什么、补哪、怎么验

**触发**：读模型文件或卡面时，若需要「再翻译一次」才能知道要做什么，说明此处缺一个语法部件。

**输出格式（固定四元组，不再写「这里是散文」）**

```
{ path, code, missing, fixTarget }
```

- `path`：模型文件路径（`$.a.b[0].c`）或卡面行号
- `code`：缺口码，取下方闭集
- `missing`：缺的**语法部件**及其形状，不是病情描述
- `fixTarget`：`model` / `engine` / `both`

**八类语法部件（闭集）**

| 部件 | 缺了会怎样 | 形状 | 补在 |
|---|---|---|---|
| `Expr` 条件表达式 | 条件只能写成字符串，如 `"a < b"` | `{lhs, op, rhs}` | model + engine `evalExpr` |
| `Ref` 引用 | 指令里说「写明 X」，但 X 没有契约 | `mustCarry: <recordId>` | model + engine 存在性校验 |
| `Enum` 封闭取值 | 自由动词，取值无法穷举 | `{values:[...]}` | model + engine 成员校验 |
| `FieldId` 标识符 | 字段名是中文条件短语，op 无法静态引用 | `{id, label}` | model + engine 解析 |
| `Negation` 否定态 | 违规描述另写一遍，与槽脱钩 | `negate(slot)` | engine |
| `Display` 展示命名空间 | 展示文本被当逻辑读 | `display.*`，禁 op 引用 | engine |
| `Migration` 数据未迁移 | 语法已存在，数据仍是旧形态 | — | model |
| `Definition` 定义缺失 | 抽象谓词没有可判定的映射表，如「tools 允许的能力」 | `tiers` / `capabilities` / `requires` | both |

**G1–G12 映射（本卡实测）**

| # | 位置 | code | missing | fixTarget | 验收 |
|---|---|---|---|---|---|
| 1 | `escalation.residual.objectivePath` | `Migration` | `objective{target,coverage,blocker}` | model | 规则 25 |
| 2 | `conflict.decision.cases[*].when` | `Expr` | `{lhs, op, rhs}` | both | 3×3 穷举 + 无重叠 |
| 3 | `records.transcript.shape[4].when` | `Expr` | `{field, op, value}` | both | 条件必填可求值 |
| 4 | `conflict.phrases.*.must` | `Ref` | `mustCarry` + 目标 record | both | 引用存在、字段可定位 |
| 5 | `outputs.items[*].action` | `Enum` | `{values:["fill"]}` | model | 成员校验 |
| 6 | `predicates.*.violation` | `Negation` | `negate(slot)` | engine | 同一逻辑只出现一次 |
| 7 | `predicates.no-fake-problem.slots[0].then` | `Negation` | `{op:"lineExists", ofRef}` | both | then 可执行 |
| 8 | `conflict.phrases.adopt.verb` | `Display` | verb 只留动作词 | model | verb 不含条件 |
| 9 | `records.*.shape[].label`（是否…/求和/无需…） | `FieldId` | `{id, label}` | model | `op.field` 可静态解析 |
| 10 | `checkCriteria.*.residual.objective.blocker` | `Enum` | `blockerCode` | model | code 在闭集 |
| 11 | `predicates.impartial-long-term.label` | `LabelSlotBinding` | 拆 predicate 或 label 只留一件 | model | label 与 slot 一一对应 |
| 12 | `checklist.items[*].category` vs 派生 label | `Migration` | 删 category，由引擎派生 | model | 单一命名来源 |

**检查器分两段**

静态段（不渲染即可判）

| code | 判定 |
|---|---|
| `ExprString` | `when`/`then` 是 string 且含运算符 |
| `RefMissing` | `mustCarry` 等引用的 record 不存在 |
| `EnumOpen` | `action`/`kind`/`op` 不在闭集 |
| `FieldIdMissing` | `shape[]` 无 `id` |
| `ProseLeaf` | 叶子字符串被 op 读取，且不在闭集 |
| `UndefinedTerm` | 出现「能力」「充分」「合理」等抽象词，且无 `capabilities` / `definitions` 映射 |

渲染期断言（需跑一遍产物）

| code | 判定 |
|---|---|
| `DisplayLeak` | `label`/`text`/`category` 被任何 op 读取 |
| `NegationDrift` | `violation` 文本与 slot 否定态不一致 |

**输出样例**

```json
{"path":"$.conflict.decision.cases[0].when","code":"ExprString","missing":"Expr{lhs,op,rhs}","fixTarget":"both"}
```

**执行顺序**：`Migration` > `Expr` > `Ref` > `Enum` > `FieldId` > `Negation` > `Display`。

先修前四类（都是静态可判），`Negation`/`Display` 依赖渲染器，放第二批。

**行为承诺**：此后遇到需要翻译的地方，一律输出上述四元组，不再用形容词。

完整方法论（七阶：归位 → 拆解 → 定义 → 判据化 → 重写 → 验证 → 收口）见 [modeling-methodology.md](modeling-methodology.md)。

解释器侧（校验器 / 渲染器 / diff 最小闭环，含 §10.1 的扩展规则 26–37）见 [interpreter-design.md](interpreter-design.md)。

6 张现役卡的删除账（D 可删 / S 下沉 / C 转注 / P 待决策）见 [deletions.md](deletions.md)。

待决策、待现役同步、解释器未实现项见 [open-issues.md](open-issues.md)。

## 9 已过期条目（保留原文，标注替代）

| 位置 | 原结论 | 现状 | 替代 |
|---|---|---|---|
| §3.2 表「越界之后怎么办」 | 独立「越界处置」节，写进 round-check | 已变 | §8.1：唯一入口在过程账；卡上不写汇报对象 |
| §3.3 代码块 | 越界处置 4 条（含复算、写进 round-check） | 已变 | §8.3：3 条 |
| §5.1 第 4 条 | 有了技能指针后删掉卡上 18 字段表 | 已升级 | §8.4：指针 + 校验器读数据 |
| §5.2 第 8 条 | 停手与写清单顺序冲突，需加「账本照写」 | 已否定 | 节标题已限定语域，不加 |
| §5.1 第 1 条 | 卡上没有指向模板的指针 | 仍在，但方案变了 | §8.4 |
| §6 下一步 1 | 卡上加指针 + 删 18 字段表 | 已尝试，撞规范红 | §8.5：先改 spec 或回滚 |
| §1 约束「不动 agents/*.md、不动门禁」 | — | **已被我违反，待回滚** | 见页首越界记录 |

## 10 终版模型（JSON 已抽出）

模型正文见 [models/reviewer-audit-model.json](models/reviewer-audit-model.json)——本文不再内联，避免同一份模型两处维护。

规模：7 个卡模型 + `_shared-model.json`；权限集中在 `permissions`，`bans` / `groups` 已并入；判据摘要由 observable 派生。

渲染基准：[`output/reviewer-audit.md`](output/reviewer-audit.md)（由 [render-card.mjs](render-card.mjs) 从模型生成）；逐字节验证见 §8.10。

校验：[verify-models.mjs](verify-models.mjs)（展开 + 等价性 + 权限 + 策略一致性）；基线更新：[update-baseline.mjs](update-baseline.mjs)。

### 10.1 渲染规则（1–25 旧版；26–41 见 interpreter-design.md）

> 规则 1–3 的 `groups[]` 轴已并入 `permissions`；实际实现以 [interpreter-design.md](interpreter-design.md) 与 [render-card.mjs](render-card.mjs) 为准。

1. **层级**：`groups[]` → 顶层分组（`title` 即组标题）；`groups[].axes[]` 顺序 = 输出顺序；`forms` 是登记表，只按 id 引用。
2. **允许**（`denyByDefault`）：条目按 `forms[].group` 分行——组数 > 1 用 `允许：白名单如下，名单外一律不跑——` + 子项；组数 ≤ 1 用单行 `允许：A、B`。
3. **禁止**（`allowByDefault`）：1 条 form → `禁止：任何{text}`；多条 → `禁止：任何{label}（{texts}）`。
4. **禁令**：`bans[].text` 原样落顶层；`residual{who,sample,fields,objectivePath}` 不进正文。
5. **文本**：`text` 已是显示串（含反引号），渲染器直接拼接，不再加壳。
6. **越界处置**：`title` → 二级标题；`steps[]` 按 `kind` 分发——`text` 原样；`report` → `越权信息报{recipients[to]}：{report.fields[].text 用「、」连接}。`；`voidRound` → `本轮结论作废，报{recipients[to]}。`。
7. **产出**：`outputs.items[]` → `- {phase}：按`{templates[t].skill}`技能的{templates[t].label}{action}，写回`{forms[artifact].text}``；同技能第二条起用「按同技能的{label}」。
8. **产物键名**：`- 产物字段名只许 {keys 用「 / 」连接}；自造键 = 不合规`。
9. **本席清单**：表头第 3 列 = `判据（判定取值：{verdicts 渲染}）`；数据行 `| {no} | {seat.display}席卡：{category} | {criterionLabel} | {kindLabels[kind]} |`（`criterionLabel` 见规则 23）；分隔行按列数生成。
10. **判据登记**：`checkCriteria[*]` 必须含 `action` / `observable[]`（非空）/ `negative` / `residual{who,sample,fields,objectivePath}`；`items[].criterion` 必须已登记 → `UnknownCriterion` / `CriterionIncomplete`。
11. **判定取值**：`verdicts.enum` 的 `id`/`label` 唯一、`requireApplicability ⊆ requireReason`、`onMissingReason` 非空；`seat.display` 是「{display}席卡：」前缀唯一来源，`items[]` 只存 `category`。
12. **冲突裁决**：标题与列表之间不空行；首行 `- 优先级：{order 经 rankLabels 映射后用「 > 」连接}。`；随后遍历 `decision.cases`（`result` 非空）→ `- {phrases[result].label}：{direction}判断与本席冲突时{verb}，{must}。`。
13. **一定会**：标题后不空行；先两条固定注，空一行；按 `must[]` 顺序、每 action 按 `targets[]` 展开，编号连续：`- {n}｜{scene}{moment}（{repeat}）：对{object}，要求{predicateSentence}，结论写回{landing}。`
14. **禁止**：与上一段之间空一行；标题后不空行；按 `never[]`、`targets[]` 展开：`- {n}｜不得{predicateSentence}（针对{object}）；出现即违反。`
15. **作用域展开**：`targets[]` 每项一行、编号跨 action 连续；`criterion` 每 action 只出现一次；校验 `TargetInvalid` / `TargetDuplicated`。
16. **逻辑与文案同源**：`phrases` 键集 = `decision.cases[].result` 集（去 `null`）→ `PhraseMissing` / `PhraseOrphan`；`order` 恰含 `rankLabels` 键；3×3 全覆盖、无重叠、方向一致、缺口显式 → `DecisionGapUndeclared` / `DecisionOverlap` / `DecisionInconsistent`。
17. **判据句 = label + 槽**：`predicateSentence = label + ('——' + slots.map(renderSlot).join('、')) + ('；' + violation)`。槽渲染：`countGte`→`{主语} 计数 ≥ {value}`；`countEq`→`{主语} 计数 = {value}`；`distinctGte`→`来自 ≥ {value} 个不同{byLabel ?? by}`；`eachCarries`→`{主语}各带 {value}`；`whenEmpty`→`{主语} 为空时，{then}`；`allExist`→`{主语}逐项存在`；`fieldNonEmpty`→`{rec}{field.label}非空`；`fieldEmpty`→`{rec}{field.label}为空`；`fieldMissing`→`{rec}{field.label}缺 {value}`；`fieldNeq`→`{rec}{left.label} ≠ {right.label}`；`fieldEnumIn`→`{rec}{field.label} ∈ {values}`；`fieldsEq`→`{rec}{left.label} = {right.label}`；`fieldTrue`→`{rec}{field.label}为真`；`eachTrue`→`{rec}{field.label}逐项为真`；`eachFirstOcc`→`{of} 首现行含 {must}`。**主语** = `ofRef ? records[ofRef].label : of`。
18. **槽校验**：`op` 已注册；数值槽 `value` 为非负整数；`values` 非空且无重复；必填键齐（`value` / `must` / `then` / `field` / `left`+`right`）→ `SlotInvalid`；`field`/`left`/`right`/`by` 必须在 `shape` 内且有 `label` → `SlotFieldUnknown`。语义：`must` 的槽写合规态，`never` 的槽写违规态。
19. **记录契约**：`records[*]` 声明 `label` / `unit` / `source` / `shape[]`（字段、类型、必填、条件必填）；`residual.fields` 只许引用已声明字段 → `RecordFieldUnknown`。
20. **槽主语二选一**：`of`（自由短语）或 `ofRef`（已登记记录）→ `SlotSubjectInvalid`；`by` ∈ 该记录 `shape`。
21. **记录验真**：`records[*].verify` 的 `op` ∈ {`quoteInLine`, `lineExists`}、引用字段 ∈ `shape` → `RecordVerifyInvalid`；不通过即该记录作废。
22. **可观测信号**：`bans[*].signal` = 单条件或 `{allOf:[≥2]}`；`op` ∈ {`eq`,`neq`,`nonEmpty`,`enumIn`}；`ofRef` 已登记、`field` ∈ shape → `SignalInvalid`；不进卡面。
23. **判据 label 派生（不单独存）**：`checkCriteria[*]` 只存 `action`（`verify`/`recount`/`spotCheck`/`replay`/`compare`）；`criterionLabel = actionLabel + observables 主语去重后用「、」连接`，主语 = `{rec.label}{shape[].label}`，拉丁与中文相接处补一个空格。
24. **负例可执行**：`checkCriteria[*].negative = {input, expect:'fail', failsOn}`；校验时跑该判据的 `observable`，要求至少一条失败且 `failsOn` 对位 → `NegativeInputInvalid` / `NegativeNotFailing` / `NegativeFailsOnMismatch`。
25. **机械化状态（取代 objectivePath 散文）**：`residual.objective = {target, coverage, machineCmd?, blocker?, why?}`——`target` ∈ {`machine`, `manual`}；`coverage` ∈ {`full`, `partial`}；`full` 必须有 `machineCmd` 且**不得**有 `blocker`；`partial` 必须有 `blocker`；`manual` 必须有 `why`；`machineCmd` 必须命中命令白名单的某个 `prefix` → `ObjectiveInvalid` / `ObjectiveCmdUnknown`。状态由字段推导，不再手写「何时能机判」。
