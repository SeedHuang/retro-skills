# agent 卡生成：从"角色设定"到"可执行契约"（探索稿）

> 状态：**探索中，未定稿**。本稿是 2026-10-25/26 对话的收敛记录，未经议会评审。
> 定稿后：结论并入 `docs/superpowers/specs/`，本稿"待决项"（§7）迁出或结案。
> 相关：S6（F-24 边界单源化）已完成施工、验收未过；本稿是其后续演进方向。
> 最后更新：2026-10-26，增补 §12（**修订** §3.1 场景结构、§6 卡面形态、§7 待决项，并补齐检查项两层结构）；D1 已定（同编号覆盖，见 §3.3）；增补 §14（产物校验与写盘门禁的工程化实测，含三条残余缺口结论）。

---

## §1 问题：现状是什么样（实测）

### 1.1 卡面由模板 + 数据生成，但"句子"仍是散文

- `tools/docgen/templates/agent.md.tpl` 里 `## 共享特质` 是**写死的一段话**（第 12–13 行），没有槽、没有 id。
- `## 固定必问清单` 的表头与"缺答 = 不合格"也写死在模板（第 15 行）。
- 4 条必问在 `agentData.mjs:211-216` 是**匿名字符串数组**：有数据位置，但无 id、无类型、无判据关联。
- 第 4 条里手抄了 `git --no-optional-locks status --porcelain` 与 `commit|push|…`，与 `commands.mjs` 形成副本关系。

### 1.2 同义/同句副本：67 处（4 条句子 × 14 份 + 11 处重复格式）

| 句子 | 份数 | 备注 |
|---|---|---|
| 「证据可复算：引用文件:行号或命令输出，禁止凭印象断言」 | 14 | `senior-sdet.md:72` 已漂移（多"或 spec 节号"、末尾句号） |
| 「只提问题不给解法 = 无效产出」 | 14 | 见 §4.6：这是"无效产出"的一个实例，不是同义词 |
| 「没问题时显式写『固定 N 条全过，自由 M 条，均无问题』」 | 14 + 11 | 11 张卡的"确认项表"里又写一遍（同卡两视角） |
| 「超出职责的事：记录进产出，不自行处置」 | 14 | — |
| 「审计专员本人实例完成；主持人代填即违规；证据栏空 = 不通过」 | 3（`reviewer-audit.md:32/54/90`） | 同卡内重复 |
| 「只记录不裁决」 | 3（`detective-observer.md:10/50/53`） | 措辞不一，且第 53 行是"他人分歧" |
| 「必须引用真实卡号」 | 2（`detective-observer.md:33/50`） | 同卡内重复 |

取数命令（仓库根执行，可逐条复算）：

```bash
grep -rl "证据可复算" agents/ | wc -l            # 14
grep -rl "只提问题不给解法" agents/ | wc -l      # 14
grep -rl "超出职责的事" agents/ | wc -l          # 14
grep -rn "不裁决" agents/detective-observer.md   # 3 处（:10 / :50 / :53）
grep -rn "真实卡号" agents/detective-observer.md # 2 处（:33 / :50）
```

### 1.3 宾语缺失与指代不明

- `detective-observer.md:10`「只记录不裁决」——不裁决**什么**？
- `:50`「你只记录不裁决」——同上，无宾语；
- `:44`「记录进产出，不自行处置」——处置**什么**？
- `:53`「不裁决**他人**分歧」——"他人"指答辩双方还是其他席？
- 因为没宾语，`:10` 与 `:18-21`（要求判断三类行为、记 P0 形态）**互相矛盾**。

代词实测：`他们 / 她们 / 它们` 在 `agents/` 中 **0 处**；问题集中在"他人 / 责任席 / 核验席"这类无名指代。

---

## §2 目标：一份数据 → 多个投影

```
policy/                         ← 唯一可编辑处（AI 只写这里）
  actions/shared.mjs            ← 共用动作
  actions/seat/<席>.mjs         ← 本席动作（use / own / sameAs）
  scenes.mjs / moments.mjs      ← 场景、时间点、频率登记表
  definitions/*.mjs             ← 能力、档位、命令、路径、产物（已有）
        │
        ├─ renderCard   ──→ agents/<席>.md        给 AI：句子，一句一条件
        ├─ renderReadme ──→ docs/agents/<席>.md   给人：表格，可扫读
        └─ policy --dump ─→ 预览（含合并来源、覆盖/变体理由）
```

三条硬约束：

1. **AI 只写数据，不写 `.md`**；生成的 md 顶部带「本文件由 … 生成，请改数据源」；
2. 两个渲染器共用同一份 `personalAction`（先合并，再分别投影）；
3. 卡面与 README 各有一份快照，`gate` 双向核对。

已跑通的最小 demo：用户级草稿区 `C:\Users\HuangChunhua\.retro-skills\observation-check-draft\`（`data.mjs` + `render.mjs`，`node render.mjs` 输出两投影）。

---

## §3 数据模型

### 3.1 场景（已并入 §12.1）

本节旧版已删除，避免与 §12.1 并存两份说法；原文见 git 历史。现行定义见 §12.1（场景 / 时间点 / 频率三层，信号五类，场景是原子、无 merge）。

### 3.2 动作（可执行四要素）

```js
{
  id: 'a02', kind: 'must',            // must | never
  scene: 'parliament-round', moment: 'end',
  object: '自省结论',                  // 宾语，必填
  text: '写一条自省：本轮修正哪条判断、下轮改什么；无则「无 + 依据」',
  criterion: 'ledger.reflectRow.exists',  // 判据：谓词 id，必填
  landing: 'ledger.round.reflect',        // 落点：枚举，必填
  effect: 'void',                         // 可选：命中的后果（见 §4.6）
}
```

四要素缺一不可：`MissingTrigger` / `MissingCriterion` / `MissingLanding`；宾语缺失 → `MissingObject`。

### 3.3 合并：同编号覆盖（已定，2026-10-26）

```js
// sharedActions
{ id: 'a02', kind: 'must', trigger: '每轮收尾',
  text: '写一条自省：本轮修正哪条判断、下轮改什么；无则写「无 + 依据」',
  criterion: 'ledger.reflectRow.exists', landing: 'ledger.round.reflect' }

// customerActions（侦探）：同 id 即覆盖；必须带 reason
{ id: 'a02', kind: 'must', trigger: '每轮收尾',
  text: '在观察表末行写自省：…', criterion: 'observation.row.exists', landing: 'observation.table.lastRow',
  reason: '本席无账本写入权（不得写 progress.md）' }
```

合并输出（`personalAction` 是算出来的，不落盘）：

```js
merge(shared, own) → {
  actions: [ ... ],          // 生效：本席版
  overrides: [{
    id: 'a02', seat: 'detective-observer',
    base: { ... },           // 直接引用共用原件（源文件永远在，无需另存）
    changed: ['text', 'criterion', 'landing'],
    reason: '本席无账本写入权',
  }],
}
```

三条配套：

1. **跨层同 id = 覆盖（合法）；同一层内重复 = 报错**（`DuplicateStatement`）；
2. **覆盖必须带 `reason`**（`OverrideWithoutReason`）；
3. **覆盖后必须真有差异**（`PointlessOverride`）；merge **必须输出 `overrides[]`**（base 引用 + 变化字段 + 理由），供 dump / README / 检查使用。

补充：

- 顺序：先共用（按登记顺序）、后本席；`use` 数组写法顺序不影响结果；
- 共用条目被升级时，列出所有覆盖它的席要求复核（`SharedUpgradeAffectsOverrides`）。

### 3.4 权限层

权限（`allow` / `deny`）可以并进同一 action 模型（kind 扩展），也可以继续用现有 `capabilities / allowGroups / artifacts`。若并入：**本席只能收紧、不能放宽**（`PermissionEscalation`）。

---

## §4 规则（从对话中收敛）

1. **原子唯一**：同一规则/场景只有一个 id、一处定义；同义合并，上位/下位不得混为一谈。
2. **引用而非复制**：共用句只能引用，正文不得出现其全文（`InlinedSharedText`）。
3. **动词必带宾语**：不裁决**责任与后果**、不处置**他人产出**；宾语写字面，不用代词。
4. **指代必须可解析**：禁用"他人 / 对方 / 该席"等无名指代（`VagueReferent`），必须指向已登记 id。
5. **正反不双写**：同一件事只在一侧（禁止可扫描的放 never；需存在性判定的放 must），否则 `DuplicateCriterion`。
6. **上位概念不当作同义**：`无效产出` 是判定标签，不是某条规则；其下每条触发规则独立存在（`SubsumptionError`）。
7. **每条必须可判**：触发 + 动作 + 判据 + 落点；"说人话"类要求还需给可执行的量化条件。
8. **结构颗粒度匹配语义形状**：枚举用表格；条件-动作-例外用句子；优先级单独成段。

### 4.6 关于"无效产出"

```js
{ id: 'r.no-solution', trigger: '出问题卡时', text: '每条问题必须带处置建议', effect: 'void' }
{ id: 'r.plain',       trigger: '写面向用户的正文', text: '按「说人话」四条', effect: 'void' }
{ id: 'r.evidence',    trigger: '写结论时', text: '每条断言带出处', effect: 'void' }

{ verdict: '无效产出', when: ['r.no-solution', 'r.plain', 'r.evidence'] }   // 只写一次
```

### 4.7 "说人话"的可执行版（讨论结论）

> 凡面向用户的正文（不含代码块、表格、引用原文），必须同时满足：
> ① 缩写与内部术语首次出现就地解释；② 单句 ≤25 字；③ 每个结论句后跟一句「这意味着：」；
> ④ 同一段内「机制/体系/能力/闭环/落地/维度」合计 ≤2 次。任一违反 = 不合格。

- 阈值参数化（存 `policy/plain.json`），句子只引用；
- 机器判定：`check:plain` 逐段报 `path:line` + 违反项 + 改法，通过时打印段数；
- 语义兜底：交无上下文实例复述，复述失真 = 不合格；
- 专名（`path:line`、P0/P1/P2、`npm run check`）登记进专名表，首次出现解释。

---

## §5 错误码清单（拟）

| 错误码 | 触发 |
|---|---|
| `DuplicateStatement` | 同一规则在卡内出现两次 |
| `InlinedSharedText` | 共用句全文被复制进卡面，而非引用 |
| `MissingObject` | 动作缺宾语 |
| `VagueReferent` | 出现"他人/对方/该席"等未解析指代 |
| `SubsumptionError` | 上位概念被当作下位同义词 |
| `MissingTrigger` / `MissingCriterion` / `MissingLanding` | 四要素缺失 |
| `DuplicateCriterion` | 同一判据正反双写 |
| `DuplicateScene` / `UnusedScene` / `ScenePromotionRequired` / `MissingSceneRationale` | 场景原子规则 |
| `UnknownScene` / `UnknownMoment` / `FrequencyInLabel` | 枚举校验 |
| `OverrideWithoutReason` / `PointlessVariant` | 变体缺理由 / 变体无差异 |
| `PermissionEscalation` | 本席权限比共用更宽 |
| `OrphanBlock` | 卡面某块不属于数据/权限/一定/禁止/裁决 |

---

## §6 两个投影的样子（demo 实跑结果）

卡面（给 AI，句子）：

```markdown
## 一定会（缺一条 = 不合格）
- 写结论时：每条断言附 `path:line` 或命令首行；无出处的不写。（判定：断言可回指）
- 每轮收尾：在观察表末行写自省：本轮修正哪条判断、下轮改什么；无则写「无 + 依据」。（判定：观察表有末行）

## 禁止
- 任何判定，不得以「感觉 / 应该 / 大概」作依据。
```

README（给人，表格）：

| 编号 | 类型 | 触发 | 动作 | 判定 | 落点 | 来源 |
|---|---|---|---|---|---|---|
| a02 | 一定会 | 议会轮·结束 | 在观察表末行写自省… | 观察表有末行 | 观察表末行 | **本席变体**（理由：本席无账本写入权） |

---

## §7 待决项（已并入 §12.8）

本表已删除，避免与 §12.8 并存两份待决清单；原文见 git 历史。现行待决见 §12.8（D5、D8 已定；D1 待拍板；新增 D9、D10）。

---

## §8 试点与验收

**试点**：侦探席（结构最复杂）+ 一个纯只读席（`evidence-reader`，验证"不同形状"也能生成）。

**验收判据**：

1. 同一份数据两次渲染，字节相等（确定性）；
2. `use` 顺序打乱，产物不变（顺序无关）；
3. 两份产物（卡 + README）均通过 `gate` 快照比对；
4. 手改 `.md` 必被 `gate` 拦（`Mismatch`）；
5. §5 的 13 个错误码各有至少 1 条测试；
6. 卡面不出现表格、不出现代词与无名指代（脚本扫描）；
7. 现存的 55 处副本在迁移后归零（对比扫描）。

---

## §9 与"低代码平台"的关系（用户裁定）

- 长期目标：物料库 + 插槽 + 编排 + 预览，形同低代码平台；
- **短期不做**（生产成本太高）；当前只做"数据源收敛 + 组件拼装"；
- 参考范式（只借契约，不借代码）：Projen（组件 + 合成 + 快照）、Backstage Scaffolder（dry-run 预览）、OPA（策略即数据 + 单测）、docassemble（条件子句）。

---

## §10 临时产物

- `C:\Users\HuangChunhua\.retro-skills\observation-check-draft\`：最小可跑 demo（数据 + 合并 + 两投影 + 产物校验），已迁出仓库（原因见 §14.9），定稿后迁回 `tools/observation-check/`。

---

## §11 形态对照实验（2026-10-26）

**设计**：4 种形态 × 20 个案例 × 2 个无上下文实例 = 160 次判定。

| 形态 | 说明 |
|---|---|
| 句子 | 一段话，内含嵌套条件（"若级别为 P0，还须同时…"） |
| 叙述表 | 表格，单元格内是完整句子 |
| 决策表 | 表格，单元格只放 `是/否/—/P0/P1`，按行匹配 |
| 并列规则 | 默认有效 + 6 条"命中即无效"，无嵌套 |

**规则**：卡号真实 / 依据齐 / 有解法 / 非重提无新证据 / 若 P0 则须两处冲突证据 + 复核记录（P1、P2 不受限）。
**案例**：20 个，含 4 个 P0 嵌套边界（缺证据、缺复核、两者皆缺、三条证据）、1 个卡号错字（字母 O）、2 个 P2 免检项。

**结果**：**160/160 全对，四种形态无差异。**

**结论**：

1. 在"规则本身无矛盾、无重复"的前提下，**形态不影响判定准确率**；
2. V-13 掉分应归因于**内容矛盾与重复**（同一维度两处描述），而不是"用了表格"或"用了散文"；
3. 四种形态唯一的可观察差异在**可审计性**：决策表能报"命中第 N 行"，并列规则能报"命中第 N 条"，句子与叙述表只能报"违反某条"。

**局限（必须写明）**：

- 天花板效应：案例字段化、规则仅 6 个条件，题太简单；
- 未覆盖两个关键变量：① 规则自相矛盾（V-13 的真实场景）；② 规则数量膨胀（真实卡数十条，注意力稀释）；
- 2 实例/形态，无法排除小差异。

**下一步**：把"矛盾"设为唯一变量再测一次（同一规则内两处描述同一维度且不一致，看四种形态能否发现），这比测形态更有价值。

### 第三轮：显式矛盾检测（2026-10-26）

- 设计：10 卡（8 个显式矛盾 + 2 个对照）× 2 排版（段落 / 分条）× 2 实例 = 40；
- 结果：**40/40**，8 个矛盾全部定位到正确两处，2 个对照正确判"无矛盾"，两排版无差异；
- 结论：显式矛盾（3 vs 2、25 字 vs 40 字、禁止 vs 允许）与排版无关，谁都能看出来。

### 第四轮：隐式矛盾检测（指代消解型，2026-10-26）

- 设计：10 卡（6 隐式 + 2 显式 + 2 对照）× 2 排版 × 2 实例 = 40；
- 结果：**33/40**（段落 16/20、分条 17/20）。

| 案例 | 矛盾类型 | 检测率 |
|---|---|---|
| C01 | 「本人产物」＝两份 vs 后文只写一份 | **0/4** |
| C05 | 「上述文件」＝两份 vs 「该文件」单数 | **1/4** |
| C02 | 表格两行 vs 「三条」 | 4/4 |
| C03 | 产物分工 vs 「都写进 round-check.md」 | 4/4 |
| C04 | 本席=侦探 vs 核验席=审计，却本席自算 | 4/4 |
| C06 | 责任席=评委 vs 答辩方转录 | 4/4 |
| C07 / C08（显式） | 3 vs 2；25 vs 40 | 8/8 |
| C09 / C10（对照） | 无矛盾 | 8/8 |

- **关键发现**：真正的盲区不是排版，而是**指代消解型矛盾**——信息全在文内，但需要"把'本人产物'展开成具体文件列表"再跨句比对，四个实例全部漏判（C01 0/4）。这与 V-13 掉分同源（「由越权者写进本人产物」vs「审计写 `round-check.md`」）。
- 与排版的关系：段落 16/20 vs 分条 17/20，差 1 例，属噪声，**不能据此说分条更好**。

**由此确立两条工程结论（有实测支撑）**：

1. 禁止无名指代（`VagueReferent`）不是洁癖：指代型矛盾正是检测盲区，必须要求每个指代展开成具体文件/角色 id；
2. 同维度"数量"必须由数据派生（如 `objects.length`），不能手写"三条/两份"——否则文本与实际数量冲突时没人能发现。

---

## §12 2026-10-26 讨论增量（修订 §3.1 / §6 / §7）

### 12.1 场景与信号（取代 §3.1）

**三层拆分，不再用一句字符串表达触发。**

| 层 | 取值 | 说明 |
|---|---|---|
| `scene` | 对象（名词） | 会话 / 议会轮 / 问题卡 / 答辩 / 交付物 / 命令 / 交接 / 判据口径 |
| `moment` | 生命周期点（封闭枚举） | 开始 / 结束 / 之前 / 之后 / 发生时 / 失败时 / 收到时 / 变更时 |
| `repeat` | `once / per-round / per-item / per-change` | **独立字段，不进 label** |

**`signal` 改成可判结构**（原 `'A / B'` 是缺陷，不是简写）：

```js
session: {
  label: '会话',
  moments: {
    start: { when: { and: [ {'==':[{var:'event.type'},'user.message']}, {'==':[{var:'state.turn'},0]} ] }, check: 'script' },
    end:   { when: { or:  [ {'==':[{var:'event.type'},'session.close']} ] }, check: 'manual', observer: 'user' },
  },
}
```

- 信号只允许 5 类：**事件到达 / 产物出现 / 状态转换 / 命令返回 / 差异命中**（`UnknownSignalType`）；
- 每条必须有 `observer` + `match`，否则 `MissingSignal`；`check:'manual'` 必须写明"谁来宣告"（`UnobservableSignal`）；
- 一行里出现两个时刻（`A / B`）→ `MultiMomentInOneEntry`，必须拆成两个 moment。

**场景收拢结果（8 个共用 + 席位局部）**：会话、议会轮、问题卡、答辩、交付物、命令、交接、判据口径；「结论」并入交付物，「冲突 / 承诺」不登记（不是对象）。席位局部示例：侦探的「轮快照」。

**规则**：场景是原子，**没有 merge、没有覆盖**；同 id 双处 → `DuplicateScene`；被第 2 席引用 → 必须上移（`ScenePromotionRequired`）；零引用 → `UnusedScene`；新增必须写 `why`（`MissingSceneRationale`）。

### 12.2 检查项：两层结构（新增）

```js
// 第一层：类别（key + 客观 label + items）
CATEGORIES = {
  'card-malformed':      { label: '评委卡不合规', items: ['k01','k02','k03','k04'] },
  'defense-unsupported': { label: '答辩依据缺失', items: ['k05','k06','k07','k08'] },
  'host-process-breach': { label: '主持流程缺失', items: ['k09','k10','k11'] },
  'tool-overreach':      { label: '工具越权',     items: ['k12','k13'] },
  'observation-incomplete': { label: '观察记录不完整', items: ['k14','k15'] },
}

// 第二层：条目（一条一判据）
CHECK_ITEMS = {
  k06: { label:'答辩依据含禁用措辞', criterion:'defense.rebuttal.hasVagueWord',
         check:'script', cmd:'node scripts/check-vague.mjs <file>', lexicon:'vague-words' },
  k08: { label:'答辩连续 K 轮无新证据仍维持原立场',
         when:{ and:[ {'>=':[{var:'defense.roundsNoNewEvidence'},{var:'params.K'}]},
                      {'==':[{var:'defense.position.maintained'},true]} ] },
         params:{ K:2 }, check:'script', evidence:['defense.rounds','defense.lastRound.stance'] },
}
```

四条硬规则：

1. **数量不写死**：卡面"共 N 类 M 项"由 `use.length` 派生；正文出现"三类/5 条"→ `HardcodedCount`；
2. **label 必须客观**：禁用"刁难 / 回避 / 失职 / 故意 / 恶意"（`SubjectiveLabel`）——意图不可判；
3. **label 必须有主语**："缺证据字段"不合格，必须写"**被审卡**缺证据字段"（`MissingSubject`）；
4. **主语不同不许共用**：侦探查别人用 `k01`（`card.*`），审计查自己用 `s01`（`self.card.*`），同 id 两处定义 → `DuplicateCheckItem`。

### 12.3 判据怎么写：或拆条、且留条

| 关系 | 处理 | 原因 |
|---|---|---|
| **或**（缺证据 / 缺解法 / 级别不匹配） | 拆成多个 checkItem | 三个不同事实，需分别定位、分别取证 |
| **且**（连续 K 轮 + 无新证据 + 维持立场） | 留一条，内部用表达式连接子谓词 | 拆开会让语义变成"命中任一"，判定与计数同时错 |

配套：

- 谓词（`criterion` / `P.*`）必须有实现或标 `check:'manual'`，否则 `MissingCriterionImpl`；
- 可增长的内容（禁用词表）放**数组物料**（`policy/lexicon.mjs`），不进 label；
- 可调阈值（K、字数上限）放 `params` / `policy/plain.json`，正文不写数字；
- 表达式用 JSON Logic（无优先级歧义）；卡面出现 `&&`、`||`、括号嵌套 → `UnreadableExpression`；渲染时若需 >1 层嵌套，必须走"拆条 / 决策表 / 谓词 / 线性步骤"（`NestingTooDeep`）。

### 12.4 卡面自足与散文隔离（取代 §6 的形态结论）

**四轮实测**（§11）结论：形态与句长不影响准确率；决定因素是**内容矛盾**与**指代**。由此确定：

| 规则 | 说明 |
|---|---|
| **卡面自足** | AI 执行所需的全部输入必须在卡面内；出现"见 / 详见 / 参考 X" → `PointerToElsewhere` |
| **能脚本判的交给脚本** | 卡面只写"跑哪条命令 + 什么算失败"，词表/阈值留在脚本侧 |
| **散文只给人** | 动机、取舍、失败案例 → `rationale` 字段 → README；**不进卡面** |
| **不许靠标注隔离** | 「以下为说明，不产生判据」不可靠（AI 仍会当判据）；`NoteLooksLikeRule` 只是廉价网 |
| **README 由数据渲染** | 编号为对账键；手改即 `Mismatch` |
| **理由也是数据** | `rationale` 必填（`MissingRationale`），否则 README 只能手写、必然漂 |

### 12.5 未来卡面（6 段，取代"9 段"）

```
front matter（name / description / tools）
职责        ← 由 duty 字段派生（trigger + objects + action + constraint）
一定会      ← must 动作 + 本席清单（逐条三态：命中/未命中/不适用 + 依据）
禁止        ← never 动作
冲突裁决    ← 优先级规则
本席清单    ← checkItems（类别 + 条目表）
边界        ← 权限物料渲染
```

「共享特质」「你是谁」「通用纪律」三个散文段**全部消失**，内容迁入上面的动作与清单（映射见 §12.6 说明）。

### 12.6 共享特质的去向（不可丢约束）

| 原句 | 迁成 |
|---|---|
| 客观、自省、诚实 | `must` 断言带出处；`must` 每轮写自省 |
| 说人话 | `must` 缩写首现解释 / 单句 ≤25 字 / 结论后「这意味着：」 |
| 落地 | `must` 承诺写落点 + 检查时点 |
| 主动发现问题 | `must` 每轮报 ≥1 条或写"无新问题 + 依据" |
| 采纳意见与保持主见 | `must`（冲突裁决）采纳/不采纳 + 理由 + 认输判据；用户 > 规则 > 本席 |
| 包容、理性 | 已被"客观"覆盖，删（见 §4 去重结论） |

### 12.7 错误码补充（追加 §5）

| 错误码 | 触发 |
|---|---|
| `MultiMomentInOneEntry` | 一行里写了两个时点（`A / B`） |
| `UnknownSignalType` / `MissingSignal` / `UnobservableSignal` | 信号类别非法 / 缺 observer+match / manual 无宣告者 |
| `SignalProliferation` | 为单个场景新造信号类别 |
| `FreeTextEnum` | 枚举值里出现 `/` 分隔的多条件串或自由定义文本 |
| `SubjectiveLabel` | label 含意图词（刁难/回避/失职/故意/恶意） |
| `MissingSubject` | label 未写明"谁" |
| `DuplicateCheckItem` / `UnknownCheckItem` / `UnusedCheckItem` | 检查项重复定义 / 引用未登记 / 登记未引用 |
| `MissingCriterionImpl` | 谓词无脚本实现且未标 manual |
| `HardcodedCount` | 正文手写"三类 / 两份"等数量 |
| `PointerToElsewhere` | 卡面出现"见 / 详见 / 参考 X" |
| `NoteLooksLikeRule` | note 含情态词或规则句式 |
| `UnreadableExpression` / `NestingTooDeep` | 卡面出现逻辑符号 / 嵌套超过一层 |
| `MissingRationale` | 动作缺理由字段 |

### 12.8 待决项更新（取代 §7 中 D1、D5、D8）

| # | 待决 | 现状与倾向 |
|---|---|---|
| D1 | 本席差异的表达方式 | **已定（2026-10-26）：同编号覆盖**——同层重复报错 + `reason` 必填 + 无差异报错 + merge 输出 `overrides[]`；细则见 §3.3 |
| D5 | README 粒度 | 已定：**每席一份 + 自动 index**（用户 2026-10-26 确认） |
| D8 | 迁移路线 | 已定：**先试点侦探席**，产出对照稿后再铺 14 席 |
| D9（新） | 检查项共用粒度 | 倾向：**主语相同才共用**（`k*` / `s*` 分开），并配 `DuplicateCheckItem` |
| D10（新） | 固定 5 条 + other 的可行性 | **部分验证**：硬套未复现（对照组无新增误判）；三态边界与主体错位已修（§12.10.9）；**0 条分支仍未测到**（见 §13） |
| D11（新） | 程序席的称谓 | **已定（2026-10-26）**：议会内「议长 / 主持人」暂可并用；**议会改造（S3）完成后移除「主持人」**；议会外一律「主 agent」，且不得使用程序动作词 |

### 12.9 程序席称谓（D11 裁定与到期判据）

| 情形 | 用词 | 说明 |
|---|---|---|
| 议会内（S3 前） | 议长 或 主持人（二者皆可） | 过渡容忍；同一张卡内不得混用两种写法 |
| 议会内（S3 后） | 议长 | 「主持人」移除 |
| 议会外 | 主 agent | 不得出现"收卡 / 丢卡 / 压卡 / 判结束 / 点名"等程序动作词 |

**到期判据（"议会做完"必须可判，不接受"看情况"）**：PRD S3 的交付物全部落地（`agents/speaker.md` + `respondent-*` + 两张矩阵 + `host-duties` 拆分 + `issue-card` 级别栏位 + 15 卡重生成 + 相关测试绿），届时：

```bash
grep -rn "主持人" agents/ skills/parliament/ tools/docgen/ | wc -l   # 必须为 0
```

`docs/` 下的历史记录（PRD / specs / handoff）不计入。

**配套校验**：`ProceduralWordOutsideParliament`——非议会席卡出现程序动作词即红；`MixedTermInCard`——同一张卡同时出现「议长」与「主持人」即红（过渡期也要消混用）。

### 12.10 模型级缺口（补五块，15 席才能全覆盖）

**压测背景**：按现设计逐席过一遍 15 个 agent，发现 4 个模型级缺口 + 2 个口子；其中 `senior-sdet` 现在表达不出来。缺口不是某席特殊，补齐后全体受益。

#### 12.10.1 产物 schema（输出合同）

`landing` 只说明"写哪"，**output 说明"写成什么结构"**：

```js
OUTPUTS = {
  // 结构不在这里手抄，统一指向 schema 文件（唯一来源），避免"示例缺节"变成第二份定义
  'testcase.7sections': {
    file: 'testcase.md',
    schema: 'schemas/testcase.v1.json',
    validate: 'node scripts/check-testcase.mjs',
  },
  'observation.5fields': {
    file: 'detective.md',
    schema: 'schemas/observation.v1.json',
    validate: 'node scripts/check-observation.mjs',
  },
  'round-check.tables': {
    file: 'round-check.md',
    schema: 'schemas/round-check.v1.json',
    validate: 'node scripts/check-round-check.mjs',
  },
}
```

规则：

- 每个产物必须有脚本校验器，否则 `UnverifiableOutput`（"有结构但没人核"等于没有）；
- **结构进数据，方法进 skill**：七节怎么写（`prd-to-specs` + `spec-testcase-gate`）留在 skill，结构与校验进数据层。

#### 12.10.2 判据第三类：`check: 'ai'`

| 类型 | 用于 | 约束 |
|---|---|---|
| `script` | 可形式化的判定 | 必须有实现 |
| `ai` | 语义判定（安全/交互/运维视角） | **必须写判据 + 必须带证据 + 必须可抽查** |
| `manual` | 只能人判 | 必须写"谁来判 + 落点" |

- 不允许把语义判定伪装成 script（`FalseScriptCheck`）；
- `ai` 类必须登记抽查方式（抽样命令 / 抽查比例），抽查不过计误判。

#### 12.10.3 开放生成项（openItem）：基类 + 派生

```js
OPEN_ITEM_BASE = {
  fields: ['category', 'object', 'evidence', 'impact', 'suggestion'],
  evidence: { pattern: 'path:line | 命令输出首行' },
  mustNotDuplicate: 'checkItems',
};

OPEN_SCOPES = {
  'detective-observer': ['round-behavior', 'tool-use', 'host-process'],
  'senior-sdet':        ['spec-gap', 'coverage-gap', 'impl-risk'],
  'reviewer-qa':        ['testability', 'edge-case', 'regression'],
};
```

规则：

1. **格式固定**（五列 + 证据必带），自由只体现在"问什么"；
2. **空间受限**：提问必须落在 `scope` 内（`OutOfScopeOpenItem`）；
3. **数量不设下限**：0 条合法，但必须写可核理由（`EmptyOpenWithoutReason` / `WeakReason`——理由要引用固定项 id 或文档事实）；
4. **升格机制**：同类自由项连续出现（如 3 次）→ 提议登记为固定项，让清单自演进。

#### 12.10.4 前置条件 `requires`（动作第五要素）

```js
requires: [
  { id: 'spec.fullText',      kind: 'artifact', must: true },
  { id: 'acceptance.anchors', kind: 'fact',     must: true },
  { id: 'notTest.list',       kind: 'fact',     must: false },
]
```

- 缺 `must: true` → **停手**，固定句式「缺 X，未开始」（`MissingPrerequisite`）；
- 动作五要素：**触发 / 宾语 / 判据 / 落点 / 前置**。

#### 12.10.5 落点参数化

```js
landing: 'review.dir/<file>'    // 变量由运行时给出
```

- 变量必须登记（`LANDING_VARS`: `review.dir` / `round.no` 等）；
- 渲染时未赋值 → `UnboundLanding`；
- 禁止任意拼接（否则等于自由文本）。

#### 12.10.6 归层表

| 要解决的问题 | 归哪层 | 判据 |
|---|---|---|
| 产物结构（七节 / 五列 / 表头） | 数据 schema + 脚本 | 要能机械核对 |
| 怎么写好产物 | skill（已有） | 需判断，不可枚举 |
| 开放项 | 数据（base + scope）+ 统计脚本 | 下限/字段可判；"问什么"不可判 |
| `requires` | 数据（第五要素） | 缺前置即停，可判 |
| 动态落点 | 数据（变量登记）+ 脚本校验 | 路径可变但变量封闭 |

#### 12.10.7 压测结论

| Agent | 补缺口后 | 依赖 |
|---|---|---|
| `detective-observer` | ✅ | openItem |
| `reviewer-audit` | ✅ | 产物 schema |
| `evidence-reader` | ✅ | 席位局部场景（取证）+ 产物 schema |
| 11 个 `reviewer-*` | ✅ | `check:'ai'` |
| `senior-sdet` | ✅ | 产物 schema + requires + openItem |

**四块补齐 → 15/15 可表达；不补 → `senior-sdet` 表达不出来。**

#### 12.10.8 新增错误码

| 错误码 | 触发 |
|---|---|
| `UnverifiableOutput` | 产物有结构但没有校验器 |
| `FalseScriptCheck` | 语义判定被标成 script |
| `EmptyOpenWithoutReason` / `WeakReason` | 开放项为 0 且无理由 / 理由不可核 |
| `OutOfScopeOpenItem` / `DuplicateAsOpen` | 越出 scope / 与固定项同义 |
| `MissingPrerequisite` | 缺 must 前置仍开工 |
| `UnboundLanding` | 落点变量未赋值 |

#### 12.10.9 检查项三态与 `subject`（2026-10-26 补）

**三态定义（写进卡面）**：

| 态 | 定义 | 必写 |
|---|---|---|
| 命中 | 对象**存在**且满足判据 | 对象 id + `path:line` 证据 |
| 未命中 | 对象**存在**但不满足判据 | 对象 id + 一句依据 |
| 不适用 | 对象**不存在**，或**类型不匹配** | 理由（说明为什么本轮没有该对象） |

**检查项必须声明适用对象类型**：

```js
k01: { label: '被审卡缺证据字段', subject: 'card',  criterion: 'card.evidence.empty', check: 'script' }
k14: { label: '观察记录缺卡号',   subject: 'observation', … }
```

- 对象类型与 `subject` 不符 → **只能判"不适用"**；判命中/未命中 → `SubjectMismatch`；
- 目的：堵住"对象不是卡、却因为'没有卡字段'而判命中"这种主体错位。

**测试规范（出题侧）**：

1. 合成样本不得引用仓库里不存在的文件/参数（否则被核出的是样本问题，不是对象问题）；
2. 所有对照组统一"不读文件、不调工具"，否则不可比。

---

## §13 D10 重测记录（2026-10-26）

**设计**：干净样本 ×2；对照组（只给命中/未命中）×2；节选输入 ×2。

| 观察 | 结论 |
|---|---|
| 节选输入（P2 修法） | **2/2 正确**输出「前置缺失 + 未开始核对」→ P2 修复有效 |
| 三态使用 | 同输入不同实例给出不同态（k03：不适用 vs 未命中；k01：命中 vs 不适用）→ 边界未定义（已由 §12.10.9 修） |
| 主体错位 | 对象是 spec、条目主语是"被审卡"，仍判"命中"（理由："spec 没有证据字段"）→ 已由 `subject` 规则修 |
| 对照组 | 未出现新增误判；误判仍集中在 k01 → "不给'不适用'就会硬套"**不成立** |
| 0 条分支 | **两次都未走到**；样本引用了仓库不存在的 `dir-init.mjs` / `--sep`，被实例核出 → 样本不自洽 |
| 测试条件 | 干净组漏写"不读文件"，实例自行取证 → 两组不可比（已写入测试规范） |

**仍未验证**：开放项为 0 的分支（需要一个"无缺陷且类型匹配"的样本）。

### 第三批：类型匹配 + 自洽样本（2026-10-26）

**设计**：5 条 `subject: spec` 的固定项；样本为完整 spec（无外部依赖）；禁止读文件；2 实例。

| 观察 | 结论 |
|---|---|
| 0 条分支 | **仍未出现**：两实例各报 4–5 条补充项，且每条都能对上样本里的真实缺口（§1 目标无验收、§3.1 命令不可粘贴、无 testcase 外链） |
| 条目 k04 判定分歧 | 同一句"风险条目无处置且无落点"，实例 1 判**命中**、实例 2 判**未命中**——分歧点在"'判定方式'算不算处置" |
| 结论 | ① 「硬套」至此 0 次；② 「0 条」在实践中罕见（真文档通常有缺口）；③ **`check:'ai'` 条目出现判定分歧**，根因是条目措辞含歧义词（"处置"未定义） |

**由此新增两条**：

1. `check:'ai'` 条目必须给出**判定口径**（"处置"= 具体动作 + 落点，不含判定方式），否则各判各的（`AmbiguousCriterion`）；
2. 「0 条」不作为验收目标——改为"补充项每条必须可回指原文"，防止无中生有即可。

---

## §14 产物校验与写盘门禁（工程化实测，2026-10-26）

> 本节记录**已跑通的实现**，不是设计构想。代码在 `C:\Users\HuangChunhua\.retro-skills\observation-check-draft\`（仓库外，未进 git，见 §14.9）。

### 14.1 为什么从"校验 markdown"改成"校验 json"

文本版检查器跑 9 条对抗用例，**8 条被绕过**：代码块藏字段、覆盖度写「无」、列表式补充项、标题变体、全角竖线、结论换说法、`mustHave` 拼错、`must` 写成字符串。

根因不是正则不够狠，而是**用正则在猜自然语言的结构**，攻击面无穷。改为「json 为权威 + markdown 只是渲染视图」后，同一批对抗用例 **0/10 绕过**：字段要么在要么不在，没有"换个说法"的余地。

### 14.2 检查链（四段，顺序固定）

| 段 | 做什么 | 不通过时的行为 |
|---|---|---|
| ① 结构 | 字段类型、必填、枚举、`closure` 与 `open` 条数对账 | 逐条报错，**不继续比渲染**（避免级联噪声） |
| ② 证据可解析 | 路径白名单 → 文件存在 → 行号在范围内 → 该行含 quote → quote 足够长 | 同左，逐条报错 |
| ③ 渲染一致 | md 必须逐行等于 `renderObservation(doc)` | `RenderMismatch`（带首个差异行号） |
| ④ 写盘 | 只有前三段全过才落盘；原子写（临时文件 + rename） | 不过 → **一个字都不写**；json 与 md 同时产出 |

### 14.3 产物契约（当前版本）

```js
{
  round: 3,
  items: [{ id: 'k01', verdict: 'hit'|'miss'|'na', evidence: { path, line, quote }, reason }],
  open: [{ …五列 + 证据 }],
// coverage 语义以 docs/prd/20261026205821-agent-card-contract.md §4.1 为唯一来源（2026-10-27 起）；
// 本行原为 schema 片段，已改为指针，避免第二份真相漂移。
  closure: null | 'no-findings' | 'blocked'
}
```

- `hit` 必带 `evidence`；`na` 必带 `reason`；`open` 非空时 `closure` 不得为 `no-findings`（`ContradictoryClosure`，不依赖词表）。

### 14.4 已实现的错误码（实测，非拟）

| 段 | 错误码 |
|---|---|
| 结构 | `InvalidDocument` `InvalidFieldType` `MissingItems` `UnknownItem` `UnknownVerdict` `MissingReason` `MissingOpenField` `MissingCoverage` `InvalidCoverage` `UnknownClosure` `ContradictoryClosure` `UnknownField` |
| 证据 | `EvidencePathAbsolute` `EvidencePathOutside` `EvidenceNotFound` `EvidenceUnreadable` `EvidenceLineOutOfRange` `EvidenceQuoteMismatch` `EvidenceQuoteTooShort` |
| 渲染 | `RenderMismatch` |
| 入口 | `JsonNotFound` `InvalidJson` `MdMissing` |

### 14.5 本轮新增的两道闸

**引用最小长度**（`EvidenceQuoteTooShort`）：单字引用（如 `quote: "的"`）原来能过，因为"该行确实包含"。判据改为二选一——归一化后 ≥10 字，**或** ≥4 字且占该行内容 50% 以上。

为什么不用单一字数下限：卡面真实引用里有一类正当短引用（`# 角色：侦探`，7 字，占该行 13 字的 54%）。单一 ≥10 会把它判死，逼人往引用里塞相邻文字，反而更假。

**证据路径白名单**：只接受相对路径（绝对 / `C:x` 盘符相对 / UNC → `EvidencePathAbsolute`）；解析后（含软链 realpath）越出根目录 → `EvidencePathOutside`；校验与读盘用同一绝对路径（避免"校验的是 A、读的是 B"）。根解析口径以 `docs/prd/20261026205821-agent-card-contract.md` §4.3 第 2 道为准（根唯一来源 = `git rev-parse --show-toplevel`，不接受传参、不得 `process.cwd()` 兜底；本文旧写法「根默认当前目录（fail-closed）」作废）。
同族顺带修：`path` 指向目录会让 `readFileSync` 抛 EISDIR 把校验器打崩 → 收敛为 `EvidenceUnreadable`。

### 14.6 实跑数据（71/71 绿）

| 文件 | 条数 | 覆盖 |
|---|---|---|
| `checks.test.mjs` | 12 | 结构校验正反例 + 渲染派生 |
| `adversarial.test.mjs` | 13 | A1–A13 结构化攻击 + 假证据 |
| `render-check.test.mjs` | 7 | md/json 分叉 |
| `artifact.test.mjs` | 9 | 入口函数各错误路径 + 退出码 + 级联抑制 |
| `evidence.test.mjs` | 22 | 路径白名单 6 + 引用长度 8 + 存在/行号/命中/类型 |
| `write.test.mjs` | 8 | 写盘：合法双写 / 各种拒绝零写盘 / 幂等 / 写完手改被抓 / UTF-8+LF |

取数命令：`node --test C:\Users\HuangChunhua\.retro-skills\observation-check-draft\*.test.mjs`（输出 `# tests 71 / # pass 71 / # fail 0`）。

### 14.7 三条残余缺口：结论

| # | 缺口 | 结论 |
|---|---|---|
| 1 | 没接进写盘流程（入口是函数，谁都可以不调用） | **可工程化关掉，但没做**。前置不是"加调用点"，而是把校验器从 `.session/tmp` 升成 `tools/` 里的正式工具，并在 `scripts/check-all.mjs` 加一段扫产物。现在仓库里没有任何真实观察表产物、也没有路径约定，装了是空转 |
| 2 | json 与 md 同时被改（合谋） | **代码修不了**。本地没有可信锚，两边改一致则任何本地哈希都跟着一致。真正的锚是 git：归档后的产物改动必然进 commit，评审能看见 diff |
| 3 | 证据是否支持结论 | **脚本判不了**（读语义）。只能 `check: 'manual'` + 独立方抽查，记为已接受的残余风险 |

### 14.8 门禁时点与验法（尚未实施）

**#1 的时点**：① 搬完当批做一次红绿对照；② 每次 `npm run check`；③ 审查收尾把目录从 `.session/reviews/` 迁到 `docs/superpowers/reviews/` 时，迁移前后各跑一次（关键：只认临时目录就等于没装）。

**#1 的验法**（`checkArtifacts(root)` 为纯函数，用临时目录测）：

| 造什么 | 期望 |
|---|---|
| `writeObservation` 生成的一对合法文件 | 绿 |
| 只留 json、删 md | `MdMissing` |
| 手改 md 一个词 | `RenderMismatch` + 行号 |
| quote 改成 `"的"` | `EvidenceQuoteTooShort` |
| 约定路径下零产物 | 打印「0 件，跳过」且 exit 0 |

**#2 的验法**（三步状态切换，手工两分钟）：新增产物不 `git add` → 红（`UntrackedArtifact`）；`git add` 后 → 绿；已跟踪再改一字不提交 → 红（`ArtifactDirty`）。

**必须先说的冲突**：`.session/` 在 `.gitignore` 里，审查过程中的产物天然未跟踪。所以 git 断言只能对**归档目录**生效 —— 结论是「**过程产物不可追，归档产物可追**」。归档后要改，必须进一次 commit。

**独立性**：上述红例若由实现者自己写、自己判，等于自评；按既有规矩应由 `senior-sdet` 在独立上下文编写。

### 14.9 状态与前置

- 代码位置：`C:\Users\HuangChunhua\.retro-skills\observation-check-draft\`（仓库外、用户级草稿区）。
- **为什么在仓库外**：`npm run check` 的 ⑤ 段要求 `.session/tmp/` 收尾为空，而设计未定稿又不能直接进 `tools/`。2026-10-26 实测：留在 `.session/tmp` 会让 `npm run check` 变红（11 个文件）。故迁出，实现一字不丢。
- 迁移验证：迁出后在新位置跑 `node --test …\*.test.mjs` → **71/71**；`npm run check` → `check 全部通过`（⑤ 段 `tmp/ 为空`）。
- 迁回条件：本稿定稿 → 写 spec（同批派 `senior-sdet` 出 testcase）→ 过议会 → 写 plan + 计划门签字 → 迁入 `tools/observation-check/`、挂门禁 → 按 §14.8 验收。
- 在 spec 定稿前不再向该目录添加新实现。
