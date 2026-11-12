# docgen 模型目录与 JSON 归拢迁移计划

> 依据：用户 2026-11-12 两项决策——① `tools/docgen/dsl` 改名 `models`，`tools/agent-model` 移入其 `agents/` 子目录；② 每席模型相关 JSON 归拢到 `jsons/<seat>/`，生成类文件用 `_` 前缀区分（`_baseline.json` / `_evidence.json`，共享块 `_shared.json`）。
> 约束：D19（rule / skill 生成暂停）不解除——本计划只动 agent 侧；不写 `agents/*.md`；不修改任何 JSON 的语义内容（纯路径搬迁 + 引用同步）。
> 提交粒度：**三个原子提交**（T1 / T2 / T3），每个提交后 `npm run check` 必须全绿；任一步失败可单独 revert，不牵连下一步。

## 0 目标结构（待评审确认）

```
tools/docgen/
  models/                        ← 原 tools/docgen/dsl（rules/ + skills/ 内容不动）
    rules/
    skills/
    agents/                      ← 原 tools/agent-model 整体移入
      source.mjs
      verify-models.mjs
      render/  types/  test/
      scripts/                   ← 新增：update-baseline.mjs、scaffold-seat.mjs
      jsons/
        _shared.json             ← 原 models/_shared-model.json
        <seat>/
          index.json             ← 原 models/<seat>-model.json（唯一真相，可写）
          _baseline.json         ← 原 models/_baseline/<seat>.json（生成物，禁手改）
          _evidence.json         ← 原 tools/docgen/builders/agents/fixtures/<seat>.evidence.json（replace 写入，禁手改）
```

**待确认的分叉**：若你要的是 `tools/docgen/models/jsons/`（不要 `agents/` 这一层），只改 T2 的目标前缀与 T3 的全部路径，其余步骤不变。本计划按上图（`models/agents/jsons`）书写。

`_` 前缀语义（用户 2026-11-12 决定，替代文件只读属性）：

| 命名 | 含义 | 谁写 |
|---|---|---|
| `index.json` | 唯一真相 | 人 / 建模 skill |
| `_baseline.json` | 展开快照（当前基线文件即展开后的完整模型：must 5 条 vs 模型 2 条） | `scripts/update-baseline.mjs` |
| `_evidence.json` | 替换凭证账 | `replace` / `draft`（`evidence.mjs`） |
| `_shared.json` | 共享块 | 人（评审后） |

## 0.1 旧地址盘点（2026-11-12 实测）

**不复写汇总数字**（第 2 轮复核证明「行数/文件数」口径易漂移）；以下命令的输出即清单，施工时逐条核对。

### A 必改（代码 / 测试 / 配置）

```powershell
rg -n "tools/docgen/dsl" tools scripts skills package.json
rg -n "agent-model" tools scripts skills        # 含 skills/agent-modeling/** 的脚本与文档；技能名本身保留
rg -n "_shared-model\.json" tools
rg -n "_baseline/|'fixtures'|evidence\.json" tools scripts
```

输出中必须处理的文件（按目录列全；行号以施工时输出为准）：

- `tools/docgen/builders/rules/{rules,build}.mjs`（功能性路径常量）
- `tools/docgen/builders/agents/{cli,state,check-trigger-kind,check-tristate-header}.mjs`、`components/{baseline,renderByName,renderedAssets}.mjs`
- `tools/docgen/builders/agents/test/{cli-gate,dev-workflow-registry,checkall,e2e-final,replace-change}.test.mjs`
- `tools/docgen/dsl/rules/observable-criteria.json`（如含旧路径则改）
- `tools/agent-model/**`（整体搬迁；内部 import 清单见 T2）
- `scripts/{check-all,check-skill-criteria}.mjs`、`scripts/check-observable.test.mjs`、`package.json`
- `skills/agent-modeling/**`（`scripts/render.mjs`、`scripts/verify.mjs` 与 5 处文档；技能名 `agent-modeling` 不改）
- `skills/parliament/references/assembly-matrix.md`
- `skills/{rule-writer,rule-inspector,carrier-conventions,assertion-quality}/**`
- 现行文档：`docs/prd/{20261111145723-agent-model-pipeline,docgen-index,20261112134234-rule-skill-generation-pause}.md`、`docs/guide/skills/README.md`

### B 不改（白名单）

- `tools/observation-check/gate-run.mjs:47` 的 `tools/docgen/dsl/agents/`（归档评审的退役路径）
- `docs/` 历史记录：`handoffs/`、`reports/`、`after/`、`superpowers/{specs,plans,reviews}/`、`devworkflows/`（含 `migration-baseline.json`）

**三个易漏点（必须写进施工）**

1. **36 个 JSON 的 `extends` 值**要从 `"_shared-model.json"` 改成 `"_shared.json"`——内容改动，不改正则 `expand()` 找不到共享块。
2. `types/index.mjs` 的 `:22`（扫描根）、`:26`（文件名过滤）、`:27`（展开路径）三处都要改；`verify-models.mjs` 的 `:11`（models 常量）、`:99`（默认模型路径）同样要改。
3. `scripts/check-all.mjs:23`、`:31` 两处 import 引擎；`cli-gate.test.mjs:67` 已 `cpSync('tools/docgen')`，迁移后**删除** `:69` 的单独 `cpSync('tools/agent-model')`。

## 0.2 复用设计（rule / skill 建模，P3/P4 暂停中）

- 目录与命名**类型中立**：`models/<kind>/jsons/<id>/{index,_baseline,_evidence}.json` + `models/<kind>/jsons/_shared.json`，`kind ∈ {agents, rules, skills}`。rule / skill 将来直接建 `models/rules/jsons/...`、`models/skills/jsons/...`，无需再改约定。
- **暂不预建** `models/core/`：现在 `types/`（Reviewer / Auditor / Respondent）与 `render/sections.mjs`（卡面段）是 agent 专用；等 P3/P4 真正启动、出现第二套 render/verify 时再抽公共核，避免现在造抽象。
- 生成物用 `_` 前缀的约定对三类通用；`_evidence` 是否适用于 rule / skill，等 P3/P4 立项时再定。

## 1 迁移前基线（不可省）
```powershell
$BASE = git rev-parse HEAD
New-Item -ItemType Directory -Force .session | Out-Null
git tag restructure-base $BASE
git status --short            # 期望：仅本计划文件
npm run check                 # 期望：# pass 693 / # fail 0 / check 全部通过
node tools/agent-model/verify-models.mjs   # 期望：18 行 EQUIVALENT
node tools/docgen/builders/agents/cli.mjs gate   # 期望：agents 18/18 + baseline 20/20
```

回滚点 = tag `restructure-base`（随仓库可追溯；`.session/` 被 gitignore，不能作为唯一回滚凭据）。

---

## T0 D19 例外申请（执行 T1 前必须先获用户书面同意）

D19 现文：「现有生成链代码零改动」。本计划 T1 必须改 3 处**功能性路径常量**（不是注释）：

- `tools/docgen/builders/rules/rules.mjs:13`：`DATA_REL_DIR = ['tools','docgen','dsl','rules']`
- `tools/docgen/builders/rules/build.mjs:12`：`path.join(DIR,'..','..','dsl','rules')`
- `tools/docgen/builders/agents/components/renderedAssets.mjs` 头部注释（可留旧串，但建议同步）

获批口径（写回 `docs/prd/docgen-index.md` D19）：**「纯路径改名、行为不变」的引用同步不计入「代码改动」**；生成逻辑、判据、产物一律不动。
未获批 → 只执行 T2 / T3（不动 `dsl`），T1 顺延。

---

## T1 `dsl` → `models` 改名（一个提交）

**Files（必须同步的引用，行号为当前值）：**

- 改名：`tools/docgen/dsl/` → `tools/docgen/models/`
- 修改：`package.json:11-12`
- 修改：`scripts/check-all.mjs:482`、`:529`
- 修改：`scripts/check-observable.test.mjs:371-372`
- 修改：`scripts/check-skill-criteria.mjs:2`（注释）、`:12`（`SKILLS_DIR`）、`:24`（错误文案）
- 修改（**功能性路径常量**）：`tools/docgen/builders/rules/rules.mjs:13`、`build.mjs:12`
- 修改（注释）：`tools/docgen/builders/agents/components/renderedAssets.mjs:3`
- 修改（技能文档，属现行载体）：`skills/rule-writer/SKILL.md:45`、`skills/rule-writer/references/criteria-dsl.md:3`、`skills/carrier-conventions/SKILL.md:32`、`skills/carrier-conventions/references/observable.md:11`、`:35`、`:51-52`、`skills/assertion-quality/references/manual.md:74`、`skills/rule-inspector/SKILL.md:26`、`skills/rule-inspector/references/criteria.md:60`、`skills/rule-inspector/references/recipes.md:142`、`skills/rule-inspector/scripts/gen-rule-checklist.mjs:16`、`:115`
- 修改（**数组形态 `join('tools','docgen','dsl',…)` 的测试，`rg "tools/docgen/dsl"` 扫不到**，真数组形态共 6 处）：`scripts/check-observable.test.mjs:22`、`:23`、`:179`；`scripts/check-skill-criteria.test.mjs:12`；`tools/docgen/builders/agents/test/rule-render.test.mjs:50`；`skills/rule-inspector/scripts/gen-rule-checklist.mjs:16`。另 `check-observable.test.mjs:38`、`check-skill-criteria.test.mjs:48` 是依赖上述常量的只读行，无需单独改
- 修改（现行文档）：`docs/prd/20261112134234-rule-skill-generation-pause.md:13`（`dsl/skills` → `models/skills`）、`docs/guide/skills/README.md:55`
- **不修改**：`tools/observation-check/gate-run.mjs:47` 的 `tools/docgen/dsl/agents/`——它是归档评审的**退役路径白名单**，必须保留旧字符串。
- **不修改**：`tools/docgen/dsl/rules/observable-criteria.json` 内的 `residual` 文案若含旧路径，先核对：该字段是给判据引擎读的说明文本，不是路径解析源；含旧路径则一并改，改后跑 `npm run check` 验证。

- [ ] **Step 1**：`git mv tools/docgen/dsl tools/docgen/models`
- [ ] **Step 2**：按上表逐文件替换 `tools/docgen/dsl` → `tools/docgen/models`（只改路径串，不改任何判据语义）
- [ ] **Step 3**：核残留

```powershell
rg -n "tools/docgen/dsl" tools scripts skills package.json
# 期望：仅 tools/observation-check/gate-run.mjs:47（白名单，保留旧串）；其余 0 处
rg -n "join\([^)]*'docgen',\s*'dsl'|join\([^)]*'dsl'" tools scripts skills
# 期望：0 处（数组形态，字符串命令扫不到）
rg -n "tools/docgen/dsl" docs
# 期望：仅历史记录（handoffs / reports / after / superpowers / devworkflows）；
# 现行文档 pause.md 与 guide/README 已改，不应再命中
```

- [ ] **Step 4**：验收

```powershell
npm run check          # 期望：693 pass / 0 fail / check 全部通过
npm run doc:name       # 期望：命名检查通过
```

- [ ] **Step 5**：提交（`refactor(docgen): dsl 目录改名 models，同步引用`）

**回滚**：T2 尚未产生时 `git revert <T1>`；已产生则 `git reset --hard restructure-base`。回滚后跑 `npm run check`（693/0）+ `verify-models`（18 行 `EQUIVALENT`）+ `gate`（18/18 + 20/20）。

---

## T2 `tools/agent-model` → `tools/docgen/models/agents/`（一个提交）

**Files（import / 路径引用；行号为 T1 后值）：**

- 移动：`tools/agent-model/*` → `tools/docgen/models/agents/*`
- 生产代码（import）：
  - `tools/docgen/builders/agents/cli.mjs:9`
  - `tools/docgen/builders/agents/components/baseline.mjs:7`
  - `tools/docgen/builders/agents/components/renderByName.mjs:3`
  - `tools/docgen/builders/agents/state.mjs:4`
  - `tools/docgen/builders/agents/check-trigger-kind.mjs:12`
  - `tools/docgen/builders/agents/check-tristate-header.mjs:7`
  - `scripts/check-all.mjs:23`、`:31`（两处 `import … from '../tools/agent-model/source.mjs'`）
- 引擎内部（搬后 import 深度 + 上跳级数）：
  - `verify-models.mjs:4-5`：`../docgen/builders/...` → `../../builders/...`
  - `render/sections.mjs:1-3`：`../../docgen/builders/...` → `../../../builders/...`
  - `test/boundary-source.test.mjs:7-9`：`../../docgen/...` → `../../../builders/...`；`:12` 的 `ROOT` 上跳 3 级 → 5 级；**T2 只改 `:13` 的目录前缀**（`join(ROOT,'tools','docgen','models','agents','models')`）
  - `test/boundary-source.test.mjs:14-15`（`_shared-model.json` / `-model.json` 过滤）**留到 T3**，T2 不动（此时 JSON 仍在旧扁平位置）
  - `test/skill-root.test.mjs:11`：`REPO` 上跳 3 级 → 5 级；`:17`、`:23` 的 `join(dir,'tools','agent-model',…)` → `join(dir,'tools','docgen','models','agents',…)`
  - `test/source.test.mjs`、`test/verify-negatives.test.mjs`：import 用 `../source.mjs` / `../verify-models.mjs`，随目录整体搬迁，无需改深度
- 构建器测试：`tools/docgen/builders/agents/test/dev-workflow-registry.test.mjs:9`、`test/checkall.test.mjs:4`、`test/e2e-final.test.mjs:6`、`test/cli-gate.test.mjs:67-69`
  - `cli-gate.test.mjs:67` 已 `cpSync('tools/docgen')`（搬迁后**已包含**引擎）；**删除** `:69` 的 `cpSync('tools/agent-model', …)` 及其注释
- 技能脚本/文档：`skills/agent-modeling/scripts/render.mjs:5`（import）、`:8`（`ENGINE`）；`scripts/verify.mjs:5`（import）、`:8`（`ENGINE`）。**共享块与基线路径（`render.mjs:18`、`verify.mjs:19/:29`）不在 T2 改**，留到 T3（此时 `jsons/` 尚未存在）。文档行：`SKILL.md:16`、`:36`、`:54`、`references/checks.md:3`、`references/model-schema.md:56`；`skills/parliament/references/assembly-matrix.md:31`
- 源码注释里的路径：`check-trigger-kind.mjs:9`、`check-tristate-header.mjs:3`、`renderByName.mjs:1` 等同步改（`cli.mjs:148` 无旧串，不在改动面）

- [ ] **Step 1**：`git mv tools/agent-model tools/docgen/models/agents`
- [ ] **Step 2**：改 import 深度——**按文件所在层级分三条通则**（不是一条通则套全部）：
  - `builders/agents/*.mjs`（直属）：`../../../agent-model/source.mjs` → `../../models/agents/source.mjs`
  - `builders/agents/{components,test}/*.mjs`（深一层）：`../../../../agent-model/source.mjs` → `../../../models/agents/source.mjs`
  - 引擎内部 `models/agents/{render,test}/*.mjs`：指向引擎根的一律 `../source.mjs`（旧 `../source.mjs` 保持不变）
  - 以上均以文件到 `tools/docgen/models/agents/source.mjs` 的实际相对路径为准，逐文件核算；`node --check` 只验语法，**必须**再跑三个入口验 import 解析
- [ ] **Step 3**：改技能脚本相对路径（`skills/agent-modeling/scripts/*.mjs` 按新深度调整；技能名 `agent-modeling` 保留）
- [ ] **Step 4**：核残留（显式排除技能名）

```powershell
rg -n "tools/agent-model|'tools',\s*'agent-model'|\.\./\.\./agent-model|\.\./\.\./\.\./agent-model" tools scripts skills
# 期望：0 处
rg -n "agent-model" tools scripts skills
# 期望：仅技能名本身（逐行列出，允许项 = skills/agent-modeling/SKILL.md 的名称行；不写汇总数）
```

- [ ] **Step 5**：验收（重点看 `--surface tools/docgen` 是否新增 findings）

```powershell
node tools/docgen/models/agents/verify-models.mjs     # 18 行 EQUIVALENT
node tools/docgen/builders/agents/cli.mjs gate        # agents 18/18 + baseline 20/20
node scripts/check-all.mjs                            # 入口可加载（import 解析通过）
npm run check                                         # 全绿；如 ⑨ 段新增红，先定位再决定是否登记豁免
```

- [ ] **Step 6**：提交（`refactor(docgen): agent 模型引擎移入 models/agents`）

**风险**：`check:criteria` 带 `--surface tools/docgen`，引擎搬入后进入 observable/criteria 扫描面。若新增红：先看是否真实违规；确属误报才登记 `observable-exempt.json`，并在提交说明写理由（禁止整目录豁免）。

**回滚**：`git revert <T2>`（T3 尚未产生时）；T3 已产生则按 `restructure-base` 整段回退。回滚后跑 `npm run check` + `verify-models` + `gate`，期望 693/0、18 行 `EQUIVALENT`、18/18 + 20/20。

---

## T3 JSON 归拢到 `jsons/<seat>/`（一个提交）

**搬移映射（18 席统一，示例 detective-observer）：**

| 现在 | 迁移后 |
|---|---|
| `models/<seat>-model.json` | `models/agents/jsons/<seat>/index.json` |
| `models/_baseline/<seat>.json` | `models/agents/jsons/<seat>/_baseline.json` |
| `builders/agents/fixtures/<seat>.evidence.json` | `models/agents/jsons/<seat>/_evidence.json` |
| `models/_shared-model.json` | `models/agents/jsons/_shared.json` |

**Files（代码改动；路径为 T2 后值）：**

- 修改：`tools/docgen/models/agents/source.mjs`——`MODELS_DIR`（:10）改为 jsons 根；`MODEL_SEATS`（:20-28）由「文件名切片」改为「子目录枚举（排除 `_` 前缀）」；`modelPathOf`（:48-51）→ `jsons/<seat>/index.json`；`sharedOf`（:33）→ `jsons/_shared.json`
- 修改：`tools/docgen/models/agents/types/index.mjs`——`:22`（扫描根）、`:26`（`endsWith('-model.json')` 过滤）、`:27`（展开路径）三处改为 jsons 子目录
- 修改：`tools/docgen/models/agents/verify-models.mjs`——`:11`（`models` 常量）、`:25`（共享块加载）、`:99`（默认模型路径）、`:103`（基线路径）→ `jsons/<seat>/_baseline.json`
- 修改（**内容**）：18 个 `index.json` + 18 个 `_baseline.json` 的 `extends` 值 `"_shared-model.json"` → `"_shared.json"`
- 修改：`tools/docgen/builders/agents/evidence.mjs:9-10`——`evidenceDir` 默认值改为 jsons 根，`evidencePath` → `<dir>/<seat>/_evidence.json`（保留 `DOCGEN_EVIDENCE_DIR` 覆盖能力，语义变为「jsons 根」）
- 修改：`tools/docgen/builders/agents/test/support/card-fixtures.mjs:39`——`DOCGEN_EVIDENCE_DIR` 指向新目录
- 修改：`tools/docgen/builders/agents/test/replace-change.test.mjs:12`（`FIXTURE`）与 `:119`（`withEvidenceDir` 写入路径改为 `<dir>/<seat>/_evidence.json`）
- 修改：`tools/docgen/models/agents/test/source.test.mjs:14`（`join(MODELS_DIR, '<seat>-model.json')` → `join(MODELS_DIR,'<seat>','index.json')`）
- 修改：`tools/docgen/models/agents/test/verify-negatives.test.mjs:9`、`:12`（`_shared-model.json` / `<seat>-model.json` → `_shared.json` / `index.json`）；`:15` 临时文件名改 `${seat}.json`
- 修改：`tools/docgen/models/agents/test/boundary-source.test.mjs:13-15`——T2 已把 `:13` 指到引擎内旧目录；T3 改为 `join(ROOT,'tools','docgen','models','agents','jsons')`，`:14` `_shared-model.json` → `_shared.json`，`:15` `-model.json` 过滤 → 子目录枚举
- 修改：`tools/docgen/models/agents/test/render-sections.test.mjs:10`（`_shared-model.json`）；`:20`、`:50` 是**真实模型读取**，改 `join(MODELS_DIR, '<seat>', 'index.json')`；`:53` 才是临时写盘，改 `${seat}.json`
- 修改：`tools/docgen/models/agents/test/c5-matrix.test.mjs:13`（`_shared-model.json`）；`:101`、`:110` 是**真实模型读取**（`reviewer-audit-model.json` / `<seat>-model.json`），改 `join(MODELS_DIR,'reviewer-audit','index.json')` / `join(MODELS_DIR,'<seat>','index.json')`；`:113` 才是临时写盘，改 `${seat}.json`
- 修改：`skills/agent-modeling/scripts/verify.mjs:18`（席名派生 `basename(modelPath).replace(/-model\.json$/,'')` → `basename(dirname(modelPath))`，保留 `-model.json` 兼容草稿）、`:19`（共享块 → `jsons/_shared.json`）、`:28`（注释同步新行为）、`:29`（基线存在性 → `jsons/<seat>/_baseline.json`）、`:46`（缺基线不得退成 `CHECKS_PASS`，默认 exit 1；`--allow-no-baseline` 才允许草稿模式）、`:49`（退出码同步）
- 修改：`skills/agent-modeling/scripts/render.mjs:18`（`models/_shared-model.json` → `jsons/_shared.json`；T2 不能提前改）、`:23`（同一席名派生问题；`index.json` 输入时 derive 自父目录）
- 修改：`skills/agent-modeling/SKILL.md:8`（`models/<seat>-model.json` → `jsons/<seat>/index.json`）、`:41`、`:44`、`:47`、`:59`（用法行补 `--allow-no-baseline` 与状态词口径）、`references/checks.md:9`（基线路径）
- 新增：`tools/docgen/models/agents/scripts/update-baseline.mjs`
- 新增：`tools/docgen/models/agents/scripts/scaffold-seat.mjs`
- 新增：`tools/docgen/models/agents/scripts/assert-pure-move.mjs`（迁移期纯搬迁校验）
- 新增测试：`tools/docgen/models/agents/scripts/test/update-baseline.test.mjs`、`scaffold-seat.test.mjs`、`skill-verify.test.mjs`（用例清单见下）
- 修改（文档）：`skills/agent-modeling/references/model-schema.md`、`skills/parliament/references/assembly-matrix.md:31` 中的模型路径

**新增脚本规格**

`update-baseline.mjs`：

```powershell
node tools/docgen/models/agents/scripts/update-baseline.mjs --check --all   # 只读：内存重算 + 与盘上逐字节比，不一致 exit 1
node tools/docgen/models/agents/scripts/update-baseline.mjs --seat detective-observer
node tools/docgen/models/agents/scripts/update-baseline.mjs --all            # 全量写盘
node tools/docgen/models/agents/scripts/update-baseline.mjs --all --root <临时副本目录>   # 测试用：不碰真实仓
```

- 行为：读 `jsons/<seat>/index.json` + `jsons/_shared.json` → 复用 `expand()` → 生成 `_baseline.json`（与现基线同形：展开后的完整模型）
- `--check`：**不写盘**，把内存生成结果与盘上文件逐字节比对；不一致 exit 1 并列出差异席（用于证明「纯搬迁」）
- 写盘：复用 `atomicWrite.mjs` 的 `writeFileAtomic`（先写临时文件再 rename），避免并发读方读到半截 JSON
- `--all`：先对全部席跑 `verify(seat,{baseline:false})` 与生成，全部成功后才统一写；任一失败 → 不写任何文件、exit 1
- `--root <dir>`：把「仓根」重定向到临时副本，供测试注入失败；默认仓根
- 只写 `_baseline.json`，不碰 `index.json` / `_evidence.json`

`scaffold-seat.mjs`：

```powershell
node tools/docgen/models/agents/scripts/scaffold-seat.mjs --seat <name>          # 只写 jsons/_drafts/<name>/index.json
node tools/docgen/models/agents/scripts/scaffold-seat.mjs --promote <name>       # 校验已登记后移入 jsons/<name>/
node tools/docgen/models/agents/scripts/scaffold-seat.mjs --seat <name> --root <临时副本目录>
```

- **不能直接写 `jsons/<name>/`**：`source.mjs:20-28` 在模块加载期强制 `SEAT_ORDER` 与 `jsons/` 子目录双向相等，不等即抛 `MODEL_SEAT_DRIFT`；直接落盘会让 `gate` / `verify-models` / `npm run check` 全部加载失败
- `--seat`：只写 `jsons/_drafts/<name>/index.json`（`_` 前缀，不被席枚举扫描），骨架含 `version:2` / `id` / `extends:"_shared.json"` / `seat.id|display|triggers|artifacts|tier` 空位
- `--promote`：先校验该名已出现在 `source.mjs` 的 `SEAT_ORDER` 与 `seat-policy.mjs` 的 `SEAT_POLICY`；未登记 → 非零退出并打印「下一步：登记 SEAT_ORDER + SEAT_POLICY」，不移动任何文件；已登记 → 移动到 `jsons/<name>/index.json`，并提示「下一步跑 `update-baseline --seat <name>`」
- `--root <dir>`：同 `update-baseline`，供测试在临时副本上跑
- **不生成** `_baseline.json` / `_evidence.json` 空壳：空基线会被 verify 判差异，空凭证无法通过 `evidence.mjs` 字段校验；两者分别由 `update-baseline.mjs` 与首次 `replace` 生成

`assert-pure-move.mjs`：

```powershell
node tools/docgen/models/agents/scripts/assert-pure-move.mjs --base restructure-base
# exit 0 = 18 席 index.json 与 18 份 _baseline.json 均是「旧 blob + 唯一 extends 替换」；
# exit 1 = 打印席名与首个差异（不写盘）
```

- 读：`execFileSync('git',['cat-file','blob',`${base}:<旧路径>`])` 取 Buffer（不经控制台编码）→ `toString('utf8')`
- 比：新文件 `readFileSync(...,'utf8')`；两侧只把 `_shared-model.json` 替换为 `_shared.json`，并 `replace(/\r?\n$/,'')` 归一末尾换行；逐字节比较
- 覆盖：`models/<seat>-model.json` ↔ `jsons/<seat>/index.json`；`models/_baseline/<seat>.json` ↔ `jsons/<seat>/_baseline.json`；`models/_shared-model.json` ↔ `jsons/_shared.json`
- 不写盘，只返回退出码；可作为一次性迁移校验，也可留作未来目录搬迁的复用脚本

**新增测试用例清单**

`update-baseline.test.mjs`：
1. `--check` 一致 → exit 0，且不写盘（文件 mtime 不变）
2. 手改一席 `_baseline.json` 后 `--check` → exit 1，列出该席，且不写盘
3. `--all` 写盘后 18 席 `verify` 全 `EQUIVALENT`
4. `--root` 临时副本中注入 1 席非法 `index.json` → `--all` exit 1，副本内所有 `_baseline.json` 哈希不变（全成或全不成）
5. `--seat` 单席只写该席，其它席文件哈希不变

`scaffold-seat.test.mjs`（均在 `--root` 临时副本内跑）：
1. `--seat` 生成 `_drafts/<name>/index.json`，`jsons/` 顶层无新席目录
2. 已存在同席 → 拒绝（非零退出），不覆盖
3. 非法席名（大写 / 空格 / `_` 前缀）→ 非零退出
4. `--promote` 未登记 → 非零退出、打印下一步、不移动文件
5. 登记 `SEAT_ORDER` + `SEAT_POLICY` 后 `--promote` → 成功移入；再跑 `update-baseline --seat` 后 `verify` 通过
6. `--promote` 后未跑 `update-baseline` → `verify` 显式报缺基线（不得 `CHECKS_PASS`）
7. `jsons/_shared.json` 缺失 → 脚本明确报错（非 `ENOENT` 栈），不写任何文件

`skill-verify.test.mjs`（技能脚本薄封装，防席名派生回归）：
1. 输入 `jsons/reviewer-actuary/index.json` → 席名解析为 `reviewer-actuary`（不是 `index.json`）
2. 有 `jsons/<seat>/_baseline.json` → 状态词 `EQUIVALENT`、exit 0
3. 缺基线 → exit 1（不得 `CHECKS_PASS`）
4. 缺基线 + `--allow-no-baseline` → `CHECKS_PASS`、exit 0
5. 草稿输入 `-model.json` → 兼容解析出席名

- [ ] **Step 1**：按映射 `git mv` 全部文件（18 席 × 3 类 + `_shared.json`）
- [ ] **Step 2**：改 `source.mjs` / `types/index.mjs` / `verify-models.mjs` / `evidence.mjs` 路径派生（含 `:11`/`:99`/`:22`/`:27`）
- [ ] **Step 3**：批量改 36 个 JSON 的 `extends` 值（`_shared-model.json` → `_shared.json`），改完核残留：`rg -n "_shared-model\.json" tools` → 0
- [ ] **Step 4**：改测试（`source.test.mjs:14`、`verify-negatives.test.mjs:9/12/15`、`boundary-source.test.mjs:13-15`、`render-sections.test.mjs:10/20/50/53`、`c5-matrix.test.mjs:13/101/110/113`、`replace-change.test.mjs:12/119`、`card-fixtures.mjs:39`）；只有**写临时文件**的行改 `${seat}.json`，读真实模型的行改 `join(MODELS_DIR,'<seat>','index.json')`
- [ ] **Step 5**：加三个脚本 + 三个测试文件（用例清单见上）；`update-baseline.mjs` 必须实现 `--check` 只读模式、原子写、`--all` 全成或全不成、`--root` 重定向
- [ ] **Step 6**：核残留（用路径形态，不用裸 `-model.json`）

```powershell
rg -n "jsons/.*-model\.json|_shared-model\.json|models/.*-model\.json|'_baseline'" tools scripts skills
# 期望：0 处（脚本自身的新路径除外，逐行确认）
rg -n "model\.json" tools/docgen/models/agents/test/render-sections.test.mjs tools/docgen/models/agents/test/c5-matrix.test.mjs tools/docgen/models/agents/test/verify-negatives.test.mjs
# 期望：0 行（临时文件已改 ${seat}.json，旧后缀不得出现）
```

- [ ] **Step 7**：验证「纯搬迁」——跑 `assert-pure-move.mjs`（node 读 git blob Buffer，不经控制台编码）

```powershell
node tools/docgen/models/agents/scripts/assert-pure-move.mjs --base restructure-base
# 期望：exit 0（18 席 index + 18 份 _baseline + _shared 均为「旧 blob + extends 唯一替换」）
node tools/docgen/models/agents/scripts/update-baseline.mjs --check --all
# 期望：exit 0（盘上基线 = 内存重算）
```

- [ ] **Step 8**：验收

```powershell
node tools/docgen/models/agents/scripts/update-baseline.mjs --all   # 18 席全部成功
node tools/docgen/models/agents/verify-models.mjs                  # 18 行 EQUIVALENT
node tools/docgen/builders/agents/cli.mjs gate                     # agents 18/18 + baseline 20/20
npm run check                                                      # 全绿
```

- [ ] **Step 9**：提交（`refactor(docgen): 每席 JSON 归拢到 jsons/<seat>，生成物用 _ 前缀`；`git add tools skills`——T3 同时改技能脚本与文档；不要把未跟踪的计划文件带进提交）

**回滚**：`git revert <T3>`（T3 是最后一提交）；`_` 前缀文件与 `index.json` 可原路还原。回滚后跑 `npm run check`（693/0）+ `verify-models`（18 行 `EQUIVALENT`）+ `gate`（18/18 + 20/20）。

---

## T4 文档同步（可并入 T3 提交）

- 修改：`docs/prd/20261111145723-agent-model-pipeline.md` 现行路径锚（§11 取证锚中指向 `tools/agent-model` 的行）
- 修改：`docs/prd/docgen-index.md` P5 行若含旧路径
- 修改：`docs/prd/20261112134234-rule-skill-generation-pause.md` 中 `builders/skills` / `dsl/skills` 表述
- **不改**：`docs/handoffs/**`、`docs/reports/**`、`docs/after/**`、`docs/superpowers/{specs,plans,reviews}/**` 的历史路径（历史记录不改；后续需要时只加「已迁移」注）

验收：`npm run doc:name` + `npm run check`。

## 5 全局验收（三步合并后）

```powershell
npm run check
node tools/docgen/models/agents/verify-models.mjs
node tools/docgen/builders/agents/cli.mjs gate
node tools/docgen/models/agents/scripts/assert-pure-move.mjs --base restructure-base
rg -n "tools/agent-model|tools/docgen/dsl" tools scripts skills | rg -v "skills/agent-modeling/SKILL.md"   # 0 处
```

## 6 风险与对策

| # | 风险 | 对策 |
|---|---|---|
| R1 | 引擎搬入 `tools/docgen` 后 observable/criteria 扫描面变化 → 新红 | T2 单独提交并先跑 `npm run check`；新增豁免必须逐条给理由 |
| R2 | `evidence.mjs` 路径变更影响 `replace` / 崩溃收敛 | 保留 `DOCGEN_EVIDENCE_DIR` 覆盖；`replace-change.test.mjs` 全跑；补 4 条用例：默认路径、env 覆盖、崩溃收敛正例、崩溃收敛负例（evidence 已存在 / state≠replaced / 卡字节≠渲染 → `InvalidArgs` 且不写盘） |
| R3 | 基线重生成脚本首次运行与盘上不一致 | `--check` 只读模式 + 归一化逐字节比对；不一致视为搬迁错误，不许接受新基线 |
| R4 | `_` 前缀被误当模型扫描；缺基线时静默降级 | `source.mjs` 的目录枚举显式排除 `_` 前缀；`skills/agent-modeling/scripts/verify.mjs:29` 缺基线默认 exit 1（仅 `--allow-no-baseline` 放行）；补断言：`jsons` 下 `_` 项不得被当作席 |
| R5 | Windows 路径 / rename 冲突、`git mv` 跨目录 | 全部用 `git mv`；迁移期不并行改内容；回滚用 tag `restructure-base` |
| R6 | 历史文档路径失效 | 按「历史记录不改」保留；只更新现行文档与代码 |
| R7 | import 深度改错只语法合法、运行期才炸 | 除 `node --check` 外，必须跑三个入口：`verify-models.mjs`、`cli.mjs gate`、`scripts/check-all.mjs` |
| R8 | 新增席被 scaffold 直接落盘 → `MODEL_SEAT_DRIFT` 让全仓加载失败 | scaffold 只写 `jsons/_drafts/`；`--promote` 先校验 `SEAT_ORDER` + `SEAT_POLICY`，未登记不动文件 |
| R9 | `verify` 只覆盖 `must/never/predicates/records` 四段，其它字段漂移测不出 | 「纯搬迁」用 `assert-pure-move.mjs` 归一化旧 blob 逐字节比对（T3 Step 7），不依赖 verify 的覆盖范围 |
| R10 | 三个新脚本/技能脚本无回归资产、`--all` 原子性不可测 | 新增 `scripts/test/{update-baseline,scaffold-seat,skill-verify}.test.mjs`（共 17 条用例：5 + 7 + 5，见 T3）；脚本必须支持 `--root` 临时副本重定向 |

## 7 待你确认的开放项

1. **D19 例外**（T0）：是否批准「纯路径改名、行为不变」的引用同步（`rules.mjs:13`、`build.mjs:12`）不计入「代码改动」？不批则 T1 顺延，只做 T2/T3。
2. **落点**：`tools/docgen/models/agents/jsons/`（本计划，已按用户 2026-11-12 裁定）——如需去掉 `agents` 层请改此条。
3. **脚本命名**：`update-baseline.mjs` / `scaffold-seat.mjs` 是否按此命名？
4. **scaffold 空壳**：本计划建议**不生成** `_baseline` / `_evidence` 空壳（空壳会被校验判红），只生成 `index.json` 骨架到 `_drafts/`。
