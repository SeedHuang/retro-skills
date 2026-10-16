# rule-writer / rule-inspector 深度评审报告 · 解法

> 对应报告：`docs/reports/rule-writer-rule-inspector-深度评审报告.md`（2026-10-16）
> 原则：能工程化解决的优先工程化（core-working-principles 载体优先级①）——每个修复尽量留下**机器守卫**，而不是再写一条靠自觉的规则。

## 〇、总纲：六个修复簇与依赖顺序

| 批次 | 解的问题 | 性质 | 依赖 |
|---|---|---|---|
| 批 1 · 词表地基 | P0-2、P0-3、P2-1(盲点1) | 纯工程化（常量+测试） | 无 |
| 批 2 · 草稿链路 | P0-1 | CLI 补参 + 流程文档 | 无 |
| 批 3 · 判据收口 | P1-1、P1-2、P1-3 | 正则放宽 + 命名统一 | 批 1（词表常量化先落地） |
| 批 4 · 判别力与账 | P1-4 | 同句共现 + 假阳性清单 | 批 1 |
| 批 5 · 判定资产化 | P1-5、P2-2 | annotations 全量补 type | 批 1 |
| 批 6 · 测试补齐 | P2-1(盲点2-5) | 回归 fixture | 批 1–5 落地后统一补 |

**每批改动凡涉及 score.mjs 常量 / criteria 判据措辞 / 检查点增删，自身就触发 rule-inspector 硬闸门 7（检查项变更同步义务）**——修复本身必须走同步清单核销，这是对同步义务的活体验证；改 criteria 判据措辞的部分另过硬闸门 2（改前 vs 改后 → 等用户确认）。

---

## 一、批 1：词表地基（P0-2 / P0-3 / P2-1 盲点1）

### 1.1 词表常量化 + 单源镜像断言（P0-3 治本）

score.mjs 把封闭词表从正则字面量提升为**导出常量**，正则由常量构造：

```js
// criteria §3.1 封闭词表的代码侧唯一入口；改词表 = 同批改 criteria §3.1 + 本常量 + 测试镜像
export const POLARITY_WORDS = {
  禁令: ['禁止', '不得', '不要', '严禁'],
  义务: ['必须', '应', '要', '一律'],   // ← 补「一律」
}
const POLAR_RE = new RegExp([...POLARITY_WORDS.禁令, ...POLARITY_WORDS.义务].join('|'))
```

score.test.mjs 加**双镜像断言**（测试里再硬编码一份期望值——md 与代码做不到真单源，双镜像把「静默漂移」变成「显式红灯」）：

```js
import { POLARITY_WORDS } from './score.mjs'
test('词表一致性：POLARITY_WORDS == criteria §3.1 封闭词表（六词+一律），漂移即红', () => {
  assert.deepEqual(POLARITY_WORDS, {
    禁令: ['禁止', '不得', '不要', '严禁'],
    义务: ['必须', '应', '要', '一律'],   // ← 与 criteria.md §3.1 逐字一致；改判据不改测试 → 红
  })
  for (const w of [...POLARITY_WORDS.禁令, ...POLARITY_WORDS.义务]) {
    assert.ok(POLAR_RE.test(`正文含${w}`), `${w} 应命中极性`)
  }
})
```

同步面（硬闸门 7 ③ 判据 ↔ rule-writer 三层）：writing-guide 执行力度①自查表与判定词归一节的词表同步补「一律」；rule-skeleton 无需动（不列词表）。

**checklist 模板 F1 行判据升级**：从「grep 改动常量名两处」改为「跑 `node --test skills/rule-inspector/scripts/score.test.mjs` 词表一致性用例绿」——grep 查不出值漂移，测试查得出。

### 1.2 「评审第 N 轮」正则化（P0-2）

SOURCE_TYPES 保留做展示/报错文案，判定改为正则组，占位符 `N` 语义化为 `\d+`：

```js
const SOURCE_TYPE_RES = [/用户当场指令/, /评审第\s*\d+\s*轮/, /实测\/踩坑/, /项目约定/]
// parseHeader：hasType = SOURCE_TYPE_RES.some(re => re.test(sourceLine))
//              type 提取对应改用正则捕获
```

配套测试：「评审第 4 轮」fixture（可直接用 landing-sweep 来源行形态）断言头部规范 3/3。

---

## 二、批 2：草稿评分链路（P0-1）

四处合谋，四处对齐改：

1. **score.mjs CLI 补参**（草稿 = 单文件场景，CLI 参数是 annotations 键的命令行镜像）：
   ```js
   else if (argv[i] === '--x2-carrier') args.x2Carrier = true
   else if (argv[i] === '--x3-done') args.x3Done = true
   ```
   `--file` 分支的 explicit 合并逻辑照 `cognitive` 的既有模式扩展（`explicit.x || a.x` 防默认值回冲，score.mjs L451-455 同款）。
2. **flows.md 评分命令钉死模板**（新建 §四 step 5 与优化 §五 step 4 同步改）：
   ```
   node skills/rule-inspector/scripts/score.mjs --file <草稿绝对路径> \
     --rules-dir d:\Seed\retro-skills\rules --repo-root d:\Seed\retro-skills \
     [--cognitive] [--x2-carrier] [--x3-done] --json
   ```
   并补一句判定规则：认知动作且产物去处为会话载体 → 传 `--x2-carrier`；X3 判定过 → `--x3-done`。
3. **rule-skeleton.md 第 27 行改写**：「产物去处确为会话载体时此项不填，评分时传 `--x2-carrier`，**采纳落地后**写入 `rules/.inspector-annotations.json`（`x2Carrier: true`）」——把「标 annotations」从草稿期（做不到）挪到落地期（做得到）。
4. **use-rule-skills SKILL.md 落地节补一步**（闭环关键，评审报告未点透的一环）：采纳落地时，把草稿评分所用 cognitive/x2Carrier/x3Done 判定**写入 annotations**——否则草稿期靠 `--x2-carrier` 过的 X2，落地后第一次 `--dir` 体检会突然红（草稿传参、落地无标注 = 断点转移而非消除）。

**验证**：写一条会话载体型认知规则草稿 → 按新命令评分 → X1/X3 正常评、X2 不误红 → 采纳 → `--dir` 复核仍不红。这条链路全程跑通才算 P0-1 关闭。

---

## 三、批 3：判据收口（P1-1 / P1-2 / P1-3）

### 3.1 EXCEPTION_RE 放宽（P1-1）

```js
const EXCEPTION_RE = /只有[^。；\n]{1,60}(才算|才可以|才可|时，才)|唯一(成立|豁免)|只此一种|唯一的结构性例外/
```

- 窗口 40 → 60（消掉「例外必须写得短」的隐藏约束）；
- 收编 README §8 已承认的变体（「只有…时」「才可以」）与 no-git-write 的「唯一成立的情形 / 只此一种例外」形态；
- writing-guide §五样板**换掉对 no-git-write 原文的引用**，改为展示能过检的判据式写法（如：「只有用户在当前对话中直接说出对具体 git 操作的指令，才算『用户明确要求』」）——**先改教材，再改样本**；

- no-git-write.md 正文措辞（L23「唯一成立的情形」）**暂不动**——改判据措辞过硬闸门 2（报告改前 vs 改后 → 等用户确认）。新正则已兼容其现有形态，不构成强制修改压力，留待下次按处方优化时走正规流程。

### 3.2 X3 三态语义钉死（P1-2）

- annotations schema v2：`x3Done` → **`x3Pass`**（语义 = AI 判定的**结论**，非「判过」动作），并新增 `x3Basis`（一行判定依据，把 SKILL.md 已要求的「依据一行写进报告」资产化进 annotations）：
  ```json
  { "文件名": { "cognitive": true, "x3Pass": true, "x3Basis": "触发非应激时刻，无需前置句" } }
  ```
- score.mjs 读 `opts.x3Pass ?? opts.x3Done`（过渡期兼容旧键，annotations 迁移完删兼容层）；
- fail 的 findings msg 改为「X3 未过：触发在应激时刻且未前置显式化——判定依据见 annotations x3Basis，缺则先补判定」；
- 同步面：criteria §3.3b X3 行、SKILL.md step 1 annotations 示例、recipes §R8.3、现有 3 条 annotations 记录迁移（含 x3Basis）；
- 配套测试：断言「x3Pass 缺省 → 红 + msg 指向补前置句」与「x3Pass:false → 红（判过不合格 ≠ 通过）」两条语义路径。

### 3.3 M3 命名统一 + 硬闸门计数齐（P1-3）

- **统一到「M3 切换依据明确」**（score.mjs 现名不动——它规避「判据」二字是**合规动机**而非可疑动机：输出规避约束（不越界测试）禁「判据」整词，机器输出名必须绕开；统一方向 = 三个 md 改名向 score.mjs 对齐，而不是反过来让 score.mjs 违规）：criteria §3.6、README §4、report-template 三处「切换判据明确」→「切换依据明确」；
- README §7「硬闸门（6 条）」→「7 条」；SKILL.md 执行顺序 step 4「上面 1–6」→「上面 1–7」（第 7 条恰管改判据，修复步骤绝不能豁免它）；
- **硬闸门 7 同步清单补第 ⑦ 处**：report-template 的检查点行（M3 漂移正漏在这层——六处核销对象里没有报告模板）；
- **机器守卫**（防止再漂移）：score.test.mjs 加静态一致性断言——读 report-template 文件，断言其包含 score.mjs 输出的每个 M 检查点名：
  ```js
  test('检查点名一致性：report-template 含 score.mjs 全部 M1–M6 输出名', () => {
    const tpl = readFileSync(join(__dirname, '..', 'assets', 'rule-report-template.md'), 'utf8')
    for (const n of ['M1 状态集合完整', 'M2 每状态行为明确', 'M3 切换依据明确',
                     'M4 回到逻辑完整', 'M5 模式边界封闭', 'M6 退出后由谁接管']) {
      assert.ok(tpl.includes(n), `报告模板缺检查点名：${n}`)
    }
  })
  ```

---

## 四、批 4：判别力与假阳性账（P1-4）

### 4.1 ①极性明确改「同句共现」（判别力工程化，成本最低收益最大）

```js
function polarActionPaired(body) {
  return sentences(body).some(s => POLAR_RE.test(s) && ACTION_RE.test(s))
}
```

① 的判定从「全文任一命中」改为「同句共现」——「需要确认」「重要文件」这类单字误伤面立刻收敛（`sentences()` 切分函数已存在，零新依赖）。

### 4.2 hasQuote 限定为「真原话特征」

「无原话引用」的判据意图是「不含**用户原话**」，不是「不含任何引号」。改法：quote 检测限定为**引导词 + 引号**共现（`/用户原话|用户说|原话/` 命中且该行含引号），证据字段的合法「一句话现象」引文不再假红（landing-sweep 形态实测受益）。

### 4.3 假阳性清单（README §8 镜像）

README §8 增「已知代理假阳性清单」表，逐项标注判别力水位与处置：

| 假阳性形态 | 现状 | 处置 |
|---|---|---|
| ①「要」单字（需要/重要） | 同句共现修复后大幅收敛 | 4.1 已修，残留记已知 |
| ② 高频宾语词（文件/文档/代码） | 语义检查机械层只能兜底 | 标注「机械绿 ≠ 语义合格」，AI 复核接住 |
| ⑧「确认」即过 | 同上 | 同上 |
| 标题含「规范/踩坑」且有极性词 | 低频误伤 | 记已知（DIR_HEADING_HINTS 仅在无极性词时参与判 0，现有逻辑已部分防护） |
| 引号 ≠ 原话 | 4.2 已修 | — |

### 4.4 语义层接住机械层

SKILL.md 执行顺序 step 2（出报告）补一句：**①②⑦⑧ 四项机械绿 ≠ 语义合格，AI 出报告时须对这四项做语义复核，结论写进报告「说明」列**——机械层管「词在场」，语义层管「判据真成立」，两层各归其位，不再互相假装覆盖。

---

## 五、批 5：判定资产化（P1-5 / P2-2，两问题一个解）

**根解 = annotations 全量补 `type` 键**（score.mjs L393-395 的 per-file type 机制已存在，只欠标注）：

1. README §2「现有 16 条实际盘点」表**直接转写进 annotations**（20 条，含 4 条新规——顺手消掉 P2-2 的「三处三个数」：criteria §2.1 表与 README §2 盘点表都改为指针「以 `rules/.inspector-annotations.json` 实测为准」）；
2. SKILL.md step 1 命令补 `--tri-check`（体检流程含三检验时）——`triCheckDone` 本就支持经 annotations 传播（`{...opts, ...ann}` 合并），当次做过三检验的也可写进 annotations；
3. score.mjs `--dir` 输出加 `unannotated: N` 统计——未标 type 的文件数非零时提示「按缺省条件触发评，含持续适用规则会假红」，把静默缺省变成显式信号；
4. **先决条件**：annotations 补 type 是「AI 判定资产化」的批量动作，按 SKILL.md 精神（2026-10-15 用户指令）属「全库体检须用户明确要求」——**本批启动前向用户确认**。

---

## 六、批 6：测试补齐（P2-1 盲点 2–5）

| 盲点 | 补法 |
|---|---|
| README §8 假阴性清单无回归防线 | 四个已知变体各固化一个 fixture：裸「…中」前提 /「只有…时」变体 / 无来源行时来源精简组 / 极性词等价（「不擅自」）——已知误判从「文档」变「防线」 |
| 正则副作用零断言 | 「需要查看」类句（单字「要」+无真极性）断言 ①=0（批 4.1 落地后成立）；「规范」入标题且有极性词 → 记墓碑断言当前行为 |
| gen-rule-checklist D 型分支缺测 | fixture 造一条 D 型规则，断言 c4 输出「已删除 → 不适用」不崩（钉住 OCR R14 :167 修复） |
| CLI 硬编码绝对路径 | args.dir 缺省改 `resolve(__dirname, '..', '..', '..', 'rules')`（对齐 gen-rule-checklist 的 REPO 派生），补「任意 cwd 无参运行」测试 |

---

## 七、算账（core-working-principles 第三步）

- **打补丁方案**：只改 score.mjs 三处正则（约 10 行）→ P0-2/P0-3 当场绿，但词表仍无守卫，**下次改 criteria 必然再漂**——评审已经证明这条路走过了：同步义务写了 6 条，照样漏。
- **治本方案**：六批改动，核心增量是**三个机器守卫**（词表双镜像断言、M 名一致性静态断言、unannotated 统计）+ **一个资产化动作**（annotations 全量 type）。守卫把「人肉记忆同步 6 处」变成「测试红 = 提示同步」；资产化把「每次评分靠调用者现判类型」变成「判定一次、处处复算」。
- 短期成本约六批（其中批 1/2/4 是纯代码+测试，机器可验证；批 3/5 涉判据措辞要走硬闸门 2 的用户确认），摊到长远：每改一次词表省一轮「漂移 → 假红/假绿 → 排查」的往返。**该干。**

## 八、修复执行的自证义务

本解法落地时的每批改动 = 检查项/判据变更，**必须走 rule-inspector 硬闸门 7 同步清单逐项核销**（含本次新增的第 ⑦ 处 report-template）；涉及判据措辞的（EXCEPTION_RE 语义、x3Pass 改名）另过硬闸门 2。改完每批跑一次 `node --test skills/rule-inspector/scripts/score.test.mjs` + `gen-rule-checklist.mjs`，作为「修复自己审自己」的活体记录。

---

## 九、自省修订（2026-10-16 二次审视：修复推演的产出）

> 触发：用户追问「修复后是从根源解决吗？怎么证明？会不会引出新问题？」——对本文解法做手法 1（重复/交叉/中断执行）+ 修复引入推演，发现 5 处需修订 + 1 处原方案缺口 + 1 个执行环境事实。

### 9.1 原方案两处缺口（自认）

1. **⑥ 漏出 AI 复核清单**：批 4.4 只把 ①②⑦⑧ 纳入 AI 语义复核。批 3.1 放宽 EXCEPTION_RE 后 ⑥ 从「太窄」摆向「偏宽」（「只此一种/唯一」非例外语境误命中 → 静默放行，假绿比假红危险）——**⑥ 必须一并纳入批 4.4 复核清单**。
2. **批 2 的验证是手动的**：「写草稿→评分→采纳→复核全程跑通」只是文档要求，不锁结构。升级为 **e2e 链路测试**（脚本自动走 草稿→score(`--x2-carrier`)→落地写 annotations→`--dir` 复核），进 score.test.mjs——P0-1 的「根治」成立与否以此为准。

### 9.2 修复引入的回归风险与预防（手法 1 推演）

| # | 新风险 | 修法 |
|---|---|---|
| 1 | **同句共现对列表式规则假红**：「禁止：\n- git add」按 `。；\n` 切分后「禁止：」句无动作词 → ①红（当前全文匹配能过，属修复引入的回归） | 窗口从「同句」扩为「**同句或紧邻下一句**」——复用 x1ProductLanding 的既有窗口模式（ss[i] + ss[i+1]），零新逻辑 |
| 2 | **--x2-carrier 扩大绕过面**：CLI 任何调用者可传，机器无法验证「产物确为会话载体」 | 该 flag **仅在 `--cognitive` 同时给出时生效**，否则忽略 + stderr 警告；annotations 的 x2Carrier 留痕供抽查 |
| 3 | **x3Pass 过渡期双键歧义**：迁移期 x3Pass 与 x3Done 并存，若优先级不钉死 = 在消灭 P1-2 三态歧义的同时造出新的双键歧义 | 钉死 `x3Pass` 优先、`x3Done` 仅过渡兼容；3 条 annotations 迁移完成后**删兼容层**（带删除 commit，防兼容层永久残留） |
| 4 | **annotations type 错标无机器防线**：错标 type 静默覆盖 CLI --type、污染评分 | 仿 x3Basis 加 **typeBasis**（一行判定依据随体检报告可查）；抽查兜底——机器验形式，人/AI 验真伪 |

### 9.3 执行环境事实与守卫接线（证明链第 5 层）

- 已核实 `scripts/check-all.mjs` ②：`npm run check` 把全仓 `node --test`（`**/*.test.mjs`）纳入，且有「用例总数 = 0 → 失败」的防静默守卫——本解法的三个机器守卫（词表镜像、M 名断言、回归 fixture）落地即被它覆盖。
- **剩余缺口**：仓库无 pre-commit / CI 强制跑 check（未见 .github/、husky 配置）——check 只在主动跑时有效，守卫强度 = 调用纪律。**落地方案见 §十（不阻塞六批，可先行）。**

### 9.4 根治分级（对「是否从根源解决」的精确回答）

- **结构型根治**（不可能复发）：P0-2、P1-1/2/3、P1-5/P2-2——语义进正则 / 三态钉死 / 命名统一 + 静态断言 / 判定资产化。
- **检测型根治**（复发即显式红灯）：P0-3——双镜像断言把静默漂移变显式；**结构型根治 = score.mjs 解析 criteria.md §3.1 表**（判据文件成唯一真相源），未选它的工程判据 = md 表格解析脆弱 vs 三行断言便宜。**升级触发信号：双镜像上线后再漂移一次 → 升级单源解析。**
- **前提型根治**（成立与否取决于配套落地）：P0-1——链路 e2e 测试不落地就只是「文档改对」。
- **分层表述**（不可根治、只能自知）：P1-4 执行力度——关键词存在性永远无法验证执行力度真伪，这是机械检查的内禀上限；修复后的正确表述 = **缺件必红（机器底线）+ 有件 AI 复核（①②⑥⑦⑧）+ 判定依据可追溯（x3Basis/typeBasis）+ 抽查兜底** 四层，不再假装单层覆盖。

### 9.5 修复后的达标水位（对原始 8 条要求的回答）

| 条目 | 水位 |
|---|---|
| 逻辑闭环 / 无悖论 | **达标**（e2e 锁链 + 两个悖论消除） |
| 无盲点 / 无二义 / script 保证意图 / 测试 | **达标到机制上限，剩余风险显式化**（假阳假阴双向清单、unannotated、3 守卫、判据驱动覆盖度声明边界） |
| 执行力度保证 / 不跳过判断环节 | **设计内禀剩余**：AI 判定项是荣誉制（语义判断无法机器化），机器只能验形式不能验真伪——兜底是抽查；修复后的质变 = 系统对这一上限**自知并声明**，而非修复前的假保证 |
| 未承诺项 | criteria 全文逐句语义扫描未做（评审是机制层深查非全文穷尽）——不宣称零盲点/零二义，宣称「已知全清 + 回流通道在」 |

### 9.6 证明链（五层，全部可执行可复算）

1. **先红后绿**：P0-2/P0-3/P1-1 现场样本做成失败测试（landing-sweep 来源行、「一律」规则、no-git-write 例外措辞）→ 修复变绿——可复现样本 = 回归防线；
2. **前后对比**：全库 `--dir --json` 修复前后 diff——假红清零、真问题不增（增 = 修复引入，当场暴露）；
3. **攻击验证**：已知误伤词（需要/重要/总之）构造规则打同句共现，验判别力方向；
4. **链路 e2e**：见 9.1-2；
5. **守卫接线**：见 9.3。

---

## 十、pre-commit 守卫接线方案（9.3 缺口的落地设计）

> 机制：git 的 pre-commit 钩子——`git commit` 前强制先跑脚本，退出码非 0 提交被拦。
> 价值定位：批 1 的词表镜像断言、批 3 的 M 名断言、批 6 的回归 fixture 都是「红灯」——本方案让红灯**不再依赖「有人记得跑测试」**，这是「检测型根治」的最后一环。
> 落地时机：不阻塞六批，可先行（现在装就守卫既有测试；批 1 落地后价值放大）。

### 10.1 三条设计判据

| 判据 | 决策 |
|---|---|
| **快**（钩子跑在每次 commit 必经之路，慢钩子必被 `--no-verify` 拆掉） | **条件触发**：本次 staged 文件不碰守卫面 → 秒过零摩擦；碰了才跑测试子集 |
| **零依赖**（仓库哲学：check-all.mjs 声明「零外部依赖：只用 Node 内置模块」） | **不用 husky**——husky 依赖 npm install 生命周期（本仓零依赖没人 install，`prepare` 不会跑），原生 git hooks + `core.hooksPath` 两行配置等价 |
| **进 git**（`.git/hooks/` 不进版本库，clone 者拿不到） | 钩子脚本放仓库内 `.githooks/pre-commit`（进 git），clone 后一次性 `git config core.hooksPath .githooks` 指向它 |

### 10.2 钩子脚本（`.githooks/pre-commit`，Node 写法）

**守卫面**：`skills/rule-inspector/**`、`skills/rule-writer/**`、`skills/use-rule-skills/**`、`scripts/**`——含 references/criteria.md（词表漂移的场景正是「只改判据 md 不改代码」，**判据文件必须在触发面内**）、rule-skeleton / writing-guide（同步义务 ③ 的三层）。

```js
#!/usr/bin/env node
// .githooks/pre-commit —— 条件触发的提交前守卫（快：不碰守卫面秒过）
import { spawnSync } from 'node:child_process'

const staged = spawnSync('git', ['diff', '--cached', '--name-only'], { encoding: 'utf8' })
if (staged.status !== 0) process.exit(0)   // git 异常不拦提交：防钩子自己变故障点
const files = staged.stdout.split(/\r?\n/).filter(Boolean)

// 守卫面：三个规则技能的任意文件（含 criteria.md / writing-guide / skeleton）+ 仓库级守卫脚本
const GUARD_RE = /^(skills\/(rule-inspector|rule-writer|use-rule-skills)\/|scripts\/)/
const touched = files.filter(f => GUARD_RE.test(f))
if (touched.length === 0) process.exit(0)   // 文档-only 提交：零摩擦

// ① staged .mjs 语法检查（秒级，防未被子进程 import 的脚本语法错漏网）
for (const f of touched.filter(f => f.endsWith('.mjs') && !f.endsWith('.test.mjs'))) {
  const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' })
  if (r.status !== 0) { console.error(`[pre-commit] 语法错误：${f}\n${r.stderr}`); process.exit(1) }
}

// ② 测试子集：碰了哪个守卫技能就跑它的 scripts/ 测试（node ≥22 支持 --test 目录参数）
const dirs = [...new Set(touched
  .filter(f => /^skills\//.test(f))
  .map(f => f.replace(/^(skills\/[^/]+)\/.*$/, '$1/scripts')))]
let failed = false
for (const d of dirs) {
  const r = spawnSync(process.execPath, ['--test', d], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
  if (r.status !== 0) { failed = true; console.error(`[pre-commit] 测试未过：${d}\n${r.stdout}\n${r.stderr}`) }
}
// ③ scripts/ 本体被改（check-all / skill-dir）→ 跑全量 check（守卫基础设施变更，罕见，值得全量）
if (touched.some(f => f.startsWith('scripts/'))) {
  const r = spawnSync(process.execPath, ['scripts/check-all.mjs'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  if (r.status !== 0) { failed = true; console.error(`[pre-commit] npm run check 未过\n${r.stdout}\n${r.stderr}`) }
}
if (failed) {
  console.error('[pre-commit] 提交被拦截：修复后重试。确要跳过：git commit --no-verify（请在提交信息写跳过理由）')
  process.exit(1)
}
process.exit(0)
```

### 10.3 安装（两处一次性动作）

1. `.githooks/pre-commit` 提交进仓库（**UTF-8 无 BOM**——powershell-file-encoding 规则；Windows 上 git 用自带 sh 执行钩子，`#!/usr/bin/env node` 首行有效）；
2. 每台机器 clone 后跑一次：`git config core.hooksPath .githooks`（写进本地 `.git/config`，不进版本库）。package.json 的 scripts 可加 `"setup": "git config core.hooksPath .githooks"`，新机一条 `npm run setup` 完成。

### 10.4 与六批及逃生通道的关系

- **先行有效**：现在落地即守卫既有回归防线（rename 双行解析、annotations 合并顺序、fail-closed 多路径等测试）；批 1 落地后，词表镜像断言从此被**强制**运行——「检测型根治」闭环。
- **逃生通道 = `--no-verify`**：钩子无法阻止人绕过（这是 git 机制的本质，不是缺陷）——但绕过动作本身是显式的、留痕于历史（`--no-verify` 提交可 grep 识别），对照「抽查」机制形成「显式违规可追责」，优于现状的「静默漏跑无痕迹」。
- **不做的事**：不拦 rules/*.md 的编辑（那走 gen-rule-checklist 查账流程，属 rule-inspector 体系自管）；不做 CI（本仓无远程协作压力，pre-commit + check-all 已够，出现多人协作再补 CI，触发信号 = 第二个 clone 者）。

### 10.5 验收（三步）

1. 故意改坏一个守卫面文件（如 POLAR_RE 删掉「必须」）→ `git commit` → **被拦**，stderr 含失败用例；
2. 只改一篇 `docs/*.md` → `git commit` → **秒过**（条件触发不误伤）；
3. `git config core.hooksPath` 输出 `.githooks` + 实际提交一次 → 钩子确被执行。

