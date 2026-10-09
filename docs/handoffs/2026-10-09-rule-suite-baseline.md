# Plan A 交付说明：rule-inspector + rule-writer 套件落地与全量基线（2026-10-09）

> 状态：已实现（不 commit，改动在 retro-skills 与 my-rules 工作区）｜对接：上承 `docs/handoffs/2026-10-09-rule-suite-handoff.md`（spec/plan 定稿交接）｜实现依据：Spec A `docs/superpowers/specs/2026-10-09-rule-suite-design.md` + Plan A `docs/superpowers/plans/2026-10-09-rule-suite.md`｜**B 批次（类型感知评分）已实现，当前基线见 §六**

## 一、交付物清单

| 项 | 落点 | 说明 |
|---|---|---|
| rule-inspector（更名自 rule-optimizer） | `skills/rule-inspector/` | SKILL.md frontmatter/标题更新；判据/处方/模板/脚本齐 |
| 判据全集（24 检查点 1 分制） | `skills/rule-inspector/references/criteria.md` | Spec A §2 逐字落地（单源，writer 同读） |
| 报告模板 | `skills/rule-inspector/assets/rule-report-template.md` | Spec A §3 逐字落地 |
| 评分脚本 | `skills/rule-inspector/scripts/score.mjs` | 24 检查点机械判定；`scoreFile/scoreDir/CLI`；确定性、BOM、import 守卫 |
| 测试 | `skills/rule-inspector/scripts/score.test.mjs` | 30 用例覆盖 24 检查点 0 分路径 + GOOD 24/24 + 确定性/BOM/越界 |
| rule-writer（新建） | `skills/rule-writer/` | SKILL.md（写作流程 1-8）+ writing-guide（四要素+8 项自查+标题三句+例子）+ rule-skeleton |
| skilldependencies | `rule-writer.json`（新）+ `manifest.json`（改）+ `rule-inspector.json`（Task 1 更名） | validate 4/4 通过；aas sync 已建两个运行时链接 |

验证命令（可复算）：

```powershell
# 全量测试（34 = validate 4 + score 30）
node --test skilldependencies/validate.test.mjs skills/rule-inspector/scripts/score.test.mjs

# 全量基线（不带 --tri-check：三检验报告尚无逐规则报告，见 §三）
node skills/rule-inspector/scripts/score.mjs --dir D:\Seed\my-rules\rules --json

# 越界检查（期望无输出）
node skills/rule-inspector/scripts/score.mjs --dir D:\Seed\my-rules\rules --json | Select-String -Pattern '判据|建议删除'
```

## 二、全量基线（14 条规则，新判据首跑）

| 规则 | 得分 | 满分 | 得分率 | 级别 | 执行力度 |
|---|---|---|---|---|---|
| code-style | 11 | 24 | 46% | 不及格 | 3/8 |
| docs-convention | 10 | 24 | 42% | 不及格 | 4/8 |
| global-ask-before-acting | 12 | 24 | 50% | 不及格 | 2/8 |
| how-i-must-reason | 11 | 24 | 46% | 不及格 | 5/8 |
| import-guard | 14 | 24 | 58% | 不及格 | 5/8 |
| landing-sweep | 14 | 21 | 67% | 不及格 | 5/5 |
| no-git-write | 14 | 24 | 58% | 不及格 | 5/8 |
| plain-language-to-user | 14 | 21 | 67% | 不及格 | 4/5 |
| poll-deferred-at-start | 12 | 21 | 57% | 不及格 | 3/5 |
| powershell-file-encoding | 14 | 24 | 58% | 不及格 | 4/8 |
| rules-single-source | 10 | 24 | 42% | 不及格 | 3/8 |
| skill-assets-convention | 12 | 21 | 57% | 不及格 | 2/5 |
| ts-expect-error | 11 | 24 | 46% | 不及格 | 3/8 |
| vitest-queued-alternative | 13 | 24 | 54% | 不及格 | 4/8 |

全库：14 文件，平均得分率 53%，级别「不及格」。注：`max=21` 的是非禁令类（执行力度省略④⑤⑥，满分按适用项计）。

## 三、已知 artifact 与裁决

1. **三检验报告检查点全 0**：基线按 plan 原命令（不带 `--tri-check`）跑——三检验报告是 inspector 工作流产物（AI 逐段三检验 + 写报告），首跑尚无逐规则报告，故 14 条规则该项均 0 分。做一次完整 inspector 体检（含三检验报告）后该分可补上。实现上 `score.mjs` 以 `opts.triCheckDone` / CLI `--tri-check` 承载。
2. **no-git-write 执行力度 5/8，未达 Plan Task 7 预期的 8/8**（Ruling：预期错误）。实测缺失项：
   - ⑥例外从严：文件用「只有…时」而非「只有…才算」措辞，未命中判定；
   - ⑦触发机制：无「落地后/开工时/编辑后」类可观测触发标记；
   - ⑧验证闭环：未定义「怎么确认遵守了」。
   另有：来源行错位（两条来源行在第 12/27 行，超出头部前 10 行）、来源行含原话引号、标题「全局 Git 写操作禁令」是主题名非判据句（无极性词）。若要让 no-git-write 成为 ④⑤⑥ 样板，需按 rule-writer 流程修订规则正文（属新授权范围，未动）。
3. **global-ask-before-acting 基线 12/24（执行力度 2/8）**：重写是 Spec B / Plan B 的事，此处仅记基线；Plan B 完成后对比提升。
4. **越界检查通过**：`score.mjs` 输出不含「判据」「建议删除」子串（标题检查点用安全别名发出）。
5. 全部 24 检查点、判定列、得分列以 `criteria.md`（Spec A §2）为唯一权威；机械代理取舍均有代码注释，可复算。

## 四、待用户决定的事项

| # | 事项 | 现状 | 需要什么 |
|---|---|---|---|
| 1 | `aas sync --rm-old`（在 `D:\Seed\my-rules`） | 运行时残留失效 junction `rule-optimizer`（目标源目录已删） | aas 删除须用户点头；点头后跑 `aas sync --rm-old` 清理（仅删运行时链接，非 git、不动源仓库） |
| 2 | 提交方式 | 本 session 全程不 commit，改动留在 retro-skills 与 my-rules 工作区 | 用户决定何时/如何提交（git 视角：rule-optimizer 更名 = deleted+untracked，正常） |
| 3 | no-git-write 修订（可选） | 现评执行力度 5/8 | 若要让其成为 ④⑤⑥ 样板，走 rule-writer 流程修订（新授权范围） |
| 4 | 次要：writing-guide.md:77 日期措辞 | 写「2026-10-08」，no-git-write 来源行记「2026-10-09 补」 | 对齐表述（事件 10-08、补录 10-09）——随下次提交一并处理即可 |
| 5 | `assets/rule-template.md` 遗留文件 | rule-optimizer 时代的规范头部模板，不在 Spec A §4.5 结构内，SKILL.md 已不引用 | 是否删除留用户裁决 |

## 五、Plan B 补记（global-ask-before-acting 重写后，2026-10-09 实测）

按 Plan B（`2026-10-09-global-ask-rewrite.md`）完成重写（正文 = Spec B §3 逐字，标题「沟通中未获允许，不得开始执行写代码」，模式开关语义），`aas sync` 运行时已生效（`~\.trae-cn\user_rules\rule-global-ask-before-acting.md` 与源逐字一致、无 BOM）。

**重写后 inspector 实测**（`triCheckDone:true`）：

```
global-ask-before-acting.md  score=16  max=24  rate=67%  不及格
  头部 3/3  层级 2/2  来源 2/2  引用 1/1  冗余 4/4  执行力度 2/8  标题 2/4
  失败项：执行力度 ③④⑤⑥⑦⑧（仅①②过）＋ 标题「反映关键前提」「↔内容一致性」
```

基线对比：重写前 12/24（执行力度 2/8）→ 重写后 16/24。**Plan B Task 2 的「标题检查点全过 / 反映关键前提=1」预期未达**（Ruling 6）——8 个失败项中 **6 个是机械代理格式假阴性**（语义实质在）：

| 失败项 | 判定 | 理由 |
|---|---|---|
| ③适用条件精细 | 假阴性 | 正文「只适用于『用户主动发起对话』的时刻」是精确条件，代理只认「在…时」格式 |
| ④来源覆盖 | 假阴性 | 「什么不算授权」已含反绕过实质（SSD/子代理/执行计划≠豁免），措辞非「不因来源」 |
| ⑥例外从严 | 假阴性 | 「唯一豁免」=只读探查封闭清单，比「只有…才算」更严，未用模板措辞 |
| ⑦触发机制 | 假阴性 | 触发是事件型（「开/关由『这条消息是不是用户主动发起的对话』控制」），代理只认动作型时机 |
| 标题 反映关键前提 | 假阴性 | 标题「沟通中」就是关键前提（Spec B §2 设计意图），代理前提标记集漏裸「中」后缀 |
| 标题 ↔一致性 | 假阴性 | 标题「不得」vs 正文「禁止/不擅自」——语义等价、逐字不匹配 |

**2 个真缺口**（禁令类按判据应补，但正文是 Spec B §3 逐字，补 = 改 spec，等用户拍板）：⑤冲突裁决（无「以本规则为准」声明；模式开关已结构性化解冲突，价值低）、⑧验证闭环（无「怎么确认遵守」自检；可加一句「每次用户发消息先判模式再回应」式自检，价值中等）。

**follow-up 建议**：score.mjs 的禁令类检查点对「模式门控型规则」（如 global-ask）会误伤——可考虑加校准（需用户同意，属 rule-inspector 范畴）。**【已解决：见 §六，B 批次类型感知评分实现——③⑦ 按模式语义判定 + M1–M6 专属检查点】**

## 六、类型感知评分实现（B 批次，2026-10-09 实测）

B 批次（spec `2026-10-09-rule-type-scoring-design.md` + plan `2026-10-09-rule-type-scoring.md`）完成：criteria.md 判据扩展（双轴模型/单判据/模式门控 M1–M6/各类型满分口径/判定词封闭）、报告模板类型感知化、score.mjs 支持 `opts.type`/`opts.modeChecks`/CLI `--type`/`--annotations`（默认 type=条件触发，单判据由类型派生，待拆未定只报通用组）、测试补全至 **42 用例**（覆盖各类型×极性满分口径 + 合集 + M 缺失 + ③⑦ 按类型 + 越界）。

**验证（可复算）**：

```powershell
# 全量测试（46 = validate 4 + score 42）
node --test skilldependencies/validate.test.mjs skills/rule-inspector/scripts/score.test.mjs

# 类型感知基线（types.json 标注适用方式；M1–M6 为 AI 判定）
node skills/rule-inspector/scripts/score.mjs --dir D:\Seed\my-rules\rules --annotations .superpowers\sdd\2026-10-09-rule-type-scoring\types.json --json --tri-check

# 越界检查（期望无输出）
node skills/rule-inspector/scripts/score.mjs --dir D:\Seed\my-rules\rules --annotations .superpowers\sdd\2026-10-09-rule-type-scoring\types.json --json | Select-String -Pattern '判据|建议删除'
```

**类型感知基线（14 规则，取代 §二 的 24 检查点单一口径基线）**：

| 规则 | 类型·极性 | 得分 | 满分 | 得分率 | 级别 |
|---|---|---|---|---|---|
| code-style | 待拆未定 | 9 | 17 | 53% | —（不报级别） |
| docs-convention | 持续·禁令 | 11 | 23 | 48% | 不及格 |
| global-ask-before-acting | 门控·禁令 | 25 | 31 | 81% | 预警 |
| how-i-must-reason | 持续·禁令 | 11 | 23 | 48% | 不及格 |
| import-guard | 条件·禁令 | 16 | 25 | 64% | 不及格 |
| landing-sweep | 条件·义务 | 16 | 22 | 73% | 预警 |
| no-git-write | 持续·禁令 | 15 | 23 | 65% | 不及格 |
| plain-language-to-user | 持续·义务 | 15 | 20 | 75% | 预警 |
| poll-deferred-at-start | 条件·义务 | 14 | 22 | 64% | 不及格 |
| powershell-file-encoding | 条件·禁令 | 16 | 25 | 64% | 不及格 |
| rules-single-source | 条件·禁令 | 12 | 25 | 48% | 不及格 |
| skill-assets-convention | 持续·义务 | 14 | 20 | 70% | 预警 |
| ts-expect-error | 条件·禁令 | 13 | 25 | 52% | 不及格 |
| vitest-queued-alternative | 条件·禁令 | 15 | 25 | 60% | 不及格 |

全库：平均得分率 62%（仅计有级别的 13 文件）。对比旧基线（§二，平均 53%）：满分口径已按类型归一（同类型才可比），旧分数不可跨口径直接比。

**实测发现（重要）**：

1. **机械极性修正 3 条**：docs-convention / how-i-must-reason / vitest-queued 正文含「禁止/不要」→ 机械判定**禁令**（封闭词表判定，spec §1.4 初判「义务」为 AI 估计，已实测推翻）。`README.md` §2 盘点已更正；spec §1.4 为历史设计记录保留原样（P2 候选 7「盘点待核对」以此落地）。
2. **global-ask 25/31 预警**（门控·禁令，非 plan 原预期 29/31，预期已修正）：通用 17 全过 + 模式专属 **6/6**（AI 判定 M1–M6 全满足）+ 执行力度 4/8 + 标题 2/4。执行力度丢分拆解：**④⑥ 为机械假阴性**（正文语义在但缺「不因来源豁免」「只有…才算」措辞）、**⑤⑧ 为真缺口**（无冲突裁决/验证小节）；标题 2 项为机械假阴性。**A 批次 rule-writer 优化（补⑤⑧ + 判定词归一 + 措辞对齐）后应达 31/31 健康**。
3. **types.json 落点**：`.superpowers/sdd/2026-10-09-rule-type-scoring/types.json`（git-ignored；适用方式为 AI 标注，M1–M6 为 AI 判定；A 批次重跑时更新）。
4. **越界检查通过**：类型感知输出（含 M3 安全别名「切换依据明确」、单判据组「单规则」）不含「判据」「建议删除」。

**A 批次（规则整体优化）待办**：global-ask 落地（补⑤⑧+归一，→31/31）、code-style 拆分（待拆未定→拆后重评）、no-git-write 修订、旧规则逐条 rule-writer 优化——完成后用同一 types.json（或更新）重跑基线。
