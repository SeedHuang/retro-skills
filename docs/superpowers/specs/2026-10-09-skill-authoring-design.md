# skill-authoring 体系设计：写 skill 的纪律 rule + 检查/优化 skill 的 skill

> 状态：已定稿（2026-10-09，经 brainstorming 四节设计确认）
> 前置：本 spec 落地前，CLI 守卫修复已完成（score.mjs / drafts.mjs，realpath 归一化）

## 1. 背景与问题（实测，2026-10-09）

### 1.1 问题一：跨技能引用用「文件路径」而非「技能名」

**病根**：SKILL.md 写「判据在 `rule-inspector/references/criteria.md`」——给了 agent 一个文件路径，诱导它去文件系统找路径 → 用错路径（Junction / 运行时 / 源仓库混战）→ 连锁错误（找错技能、跑错脚本、查环境）。

**正确做法（superpowers 参照）**：跨技能引用一律用**技能名**（「调用 `rule-inspector` 技能」）；本技能内的文件用相对路径或 `<this-skill-dir>`；脚本命令用 `<this-skill-dir>/scripts/xxx.mjs`。

**实测分布**（`skills/` 全量 grep）：

| 文件 | 引用 | 类型 |
|---|---|---|
| `retro-collect/SKILL.md` L72 | `managing-lessons-store/assets/moments-template.md` | 跨技能路径 |
| `retro-collect/SKILL.md` L93 | `retro-collect/assets/userwords-template.md` | 自引用带技能名前缀 |
| `multi-lens-review/SKILL.md` L71 | `evolving-skills/references/protocol.md` | 跨技能路径 |
| `multi-lens-review/SKILL.md` L81 | `evolving-skills/references/review-flywheel.md` | 跨技能路径 |
| `use-rule-skills/SKILL.md` L54-55 | `rule-inspector/references/criteria.md`（已修） | 跨技能路径 |

**结论**：问题一在现有 skill 中**普遍存在**（≥4 处残留），需全量检查 + 修复。

### 1.2 问题二：Node CLI 守卫用「路径字符串比较」

**病根**：`process.argv[1] === fileURLToPath(import.meta.url)` 依赖路径字符串相等判断「直接运行 vs 被 import」。Junction/symlink 下 `process.argv[1]`（Junction 路径）与 `import.meta.url`（真实路径）**必不等** → 守卫误判「非直接运行」→ **静默退出（exit 0，无输出）**。

**正确做法（实测验证）**：
- 免疫方案 A：`realpathSync` 归一化比较（`realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))`，Windows 再归一大小写）——**score.mjs / drafts.mjs 已按此修复，实测通过**
- 免疫方案 B：Python 的 `if __name__ == "__main__"`（平台惯用法，与路径无关）
- 免疫方案 C：独立 CLI 入口文件（被 import 的模块不含 CLI 副作用）

**实测分布**：只有 `score.mjs` / `drafts.mjs` 两个有 bug（已修）；`lessons.mjs` 用 realpath（本来就免疫，实测 Junction 下正常）。守卫问题**不是普遍存在**，但 rule 必须覆盖此判据防复发。

## 2. 目标

1. 建一条 rule：写 skill 的**硬判据**，约束「以后写 skill」不再犯问题一、二。
2. 建一个 skill：**体检 + 处方 + 优化**现有全部 skill（不只是查，还要负责修）。
3. 可复算：配 `scripts/check.mjs` 自动检查，与规则侧 `rule-inspector/score.mjs` 对称。

## 3. 设计总览

```
skill-inspector（体检 + 处方 + 优化 + 写新 skill 前置自查）
   │  读判据
   ▼
rule: skill-authoring-convention（写 skill 的硬判据 7 项）
   │  产出
   ▼
scripts/check.mjs（可复算自动检查，4 类检查点）
```

对称关系：`rule-inspector` ↔ `skill-inspector`；`rule-writer` ↔ skill-inspector 的优化职能。

## 4. Rule `skill-authoring-convention`：判据（7 项）

| # | 判据 | 正例 | 反例（今天踩的） |
|---|---|---|---|
| ① | 跨技能引用**用技能名**，禁止写对方技能内部文件路径 | 「判据：调用 `rule-inspector` 技能」 | 「判据：`rule-inspector/references/criteria.md`」 |
| ② | 本技能内自引用用**相对路径** | `references/writing-guide.md` | `retro-collect/assets/...`（带自己名前缀） |
| ③ | 脚本「直接运行 vs 被 import」判断**禁止路径字符串比较** | `realpathSync(...) === realpathSync(...)`（win32 归一大小写） | `process.argv[1] === fileURLToPath(import.meta.url)` |
| ④ | 目录语义遵循 `skill-assets-convention`（**引用指针，不复制**） | `assets/` 放模板 | 模板内联进 SKILL.md |
| ⑤ | 防掠过：不因来源豁免（写 skill 的 agent / 子代理 / 模板生成都不豁免） | 「本判据不因来源豁免」 | 只约束主流程 |
| ⑥ | 冲突裁决：与其他指令/模板冲突时以本规则为准 | 「以本规则为准」 | 无声明 |
| ⑦ | 验证闭环：写完 skill 跑 `check.mjs`，0 findings 才算完成 | 「跑 check.mjs → 0 findings」 | 写完就宣布完成 |

- **来源类型**：实测/踩坑（问题一、二均为 2026-10-09 实测）
- **适用方式**：条件触发（写 skill / 体检 skill 时）
- **极性**：禁令类（① ② ③ ⑤ 为「禁止/不得」，④ ⑥ ⑦ 为义务，以单一核心判据「写 skill 不得用路径指路」统摄——单判据检查点通过）
- **④ 引用不复制**：一条规则一个真相，避免与 `skill-assets-convention` 漂移

## 5. Skill `skill-inspector`：流程（6 步）

```
1. 体检       跑 check.mjs --dir skills/ --json → 记录每 skill 命中
2. 出清单      按 skill 分组列出 findings + 处方（每类 → 修法，recipes.md）
3. 处方确认   列给用户 → 用户勾选改哪些（按 skill 或按类别批）
4. 修复       按处方改；每条过硬闸门（判据措辞不动 / 删冗余过三检验 / 不凑分）
5. 复检       重跑 check.mjs → 确认 0 findings
6. 报告       分数 + findings 明细 + 修复清单 + 残留（用户接受）
```

**写新 skill 的前置自查**：写之前读 rule → 写完后跑 check.mjs → 0 findings 才交付。

## 6. check.mjs 检查点（4 类，①②③ 脚本可复算、④ AI 判）

| # | 检查点 | 判定（可复算 grep） |
|---|---|---|
| ① | 跨技能路径引用 | SKILL.md 出现 `<别的技能名>/references/` 或 `<别的技能名>/assets/`（对照 manifest 技能名列表，排除自引用） |
| ② | 自引用带前缀 | SKILL.md 出现 `<自己名>/xxx`（应改相对路径） |
| ③ | 守卫路径字符串比较 | scripts 匹配 `process.argv[1] === fileURLToPath(import.meta.url)` 或 `import.meta.url === pathToFileURL(process.argv[1]).href` |
| ④ | 目录语义（AI 判） | SKILL.md 内联模板大段代码块 → 是否应外移 `assets/` |

- **脚本与 AI 分工**：① ② ③ 机械可判 → 脚本；④ 语义判断（是否该外移）→ AI 体检时人工判（同 rule-inspector 三检验模式）
- **评分口径**：每检查点命中记 finding（非 1 分制），报告按「命中数 / 检查点数」表达
- **检查点与判据的对应**：check.mjs 只查可复算的①②③（脚本）+ ④（AI）；判据⑤⑥⑦（防掠过/冲突裁决/验证闭环）是 rule 的**写作要求**，靠 rule 正文约束、不靠脚本查——报告里单列「判据 ⑤⑥⑦ 自查」勾选，不混进脚本 findings

## 7. 与现有体系边界

| 技能 | 关系 |
|---|---|
| `evolving-skills` | 并存。教训驱动改载体（被动，从 lessons 触发）vs skill-inspector 按判据主动体检。体检发现问题 → 若涉及教训 → 进 lessons → evolving-skills 施工 |
| `rule-inspector` | 对称。rule-inspector 体检 rules，skill-inspector 体检 skills；判据结构同源 |
| `skill-assets-convention` | 判据 ④ 引用它，不复制 |
| `use-rule-skills` | 规则侧入口；skill-inspector 是技能侧检察员，不取代它 |

## 8. 文件落点

```
my-rules/rules/skill-authoring-convention.md     ← rule（只建源仓库，aas sync）
retro-skills/skills/skill-inspector/
  SKILL.md                                        ← 流程 + 判据指针（不内联模板）
  scripts/check.mjs                               ← 可复算检查（①②③）
  references/recipes.md                           ← 每类问题的修法处方
  assets/report-template.md                       ← 体检报告模板
  scripts/check.test.mjs                          ← 检查脚本测试
skilldependencies/skill-inspector.json            ← 依赖声明（依赖 rule-inspector? 视 check 是否复用其 manifest 逻辑）
```

- rule 落地后跑 `aas sync`（只建缺失链接）
- skill 落地后：进 `skilldependencies/manifest.json` + 跑 `node --test skilldependencies/validate.test.mjs`
- 存量修复：`retro-collect`、`multi-lens-review` 的 4 处跨技能路径引用 → 改用技能名/相对路径

## 9. 验收标准

1. `check.mjs --dir skills/` 检出问题一（跨技能路径）4 处残留 → 修复后 0 findings
2. `check.mjs` 检出问题二（守卫）0 命中（已修完，防回归）
3. `node --test skilldependencies/validate.test.mjs` 通过（新 skill 已登记）
4. 新写 skill 时按 rule 自查 → check.mjs 0 findings 才交付

## 10. 待决 / 已决

- [x] 方案：rule + skill 一体（方案 A）
- [x] 优化方式：处方 → 确认 → 改
- [x] 检查脚本：配 `scripts/check.mjs`
- [x] 判据④：引用 `skill-assets-convention` 不复制
- [x] 检查点④：AI 判，不脚本化
- [x] 与 evolving-skills 边界：并存
- [ ] 落地时机：spec 定稿后由 writing-plans 出计划，再实施（实施不含 git 写操作）
