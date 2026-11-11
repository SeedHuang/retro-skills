# 测试用例：P3 建模 skill 化（agent-modeling）

> 归属 spec：`docs/superpowers/specs/2026-11-11-agent-model-pipeline-p3-design.md`（split from `docs/prd/20261111145723-agent-model-pipeline.md` §6 P3，行 190–218）
> 编写者：senior-sdet 子代理｜**独立性声明**：编写者 ≠ spec 作者（主 agent）≠ 施工者
> 状态：草稿（spec 评审前）｜最后更新：2026-11-11
> 命名与落点：与 spec 同目录；文件名 = spec 文件名去 `.md` 后 + `-testcase.md`。
> 自检口径：见文末 §5 与 §1 覆盖核对。
> **本轮声明**：只写本文件。未修改 spec、未改任何 `.mjs` / `.json` / `SKILL.md`，未新建其他文件，未建 `skills/agent-modeling/**`。
>
> 读过的文件：本批 spec 全文；`docs/superpowers/specs/2026-11-11-agent-model-pipeline-p1-design-testcase.md`（格式样板）；`docs/prd/20261111145723-agent-model-pipeline.md:180-240`；`tmp/agent-criteria-demo/verify-models.mjs`；`tmp/agent-criteria-demo/render/index.mjs`；`tmp/agent-criteria-demo/render/sections.mjs:1-15`；`tmp/agent-criteria-demo/test-p1.test.mjs:1-70`；`tmp/agent-criteria-demo/modeling-methodology.md:42-59`；`skills/skill-inspector/SKILL.md`；`skills/carrier-conventions/references/skill-structure.md`；`scripts/check-all.mjs`；`skilldependencies/manifest.json`；`skilldependencies/validate.test.mjs`。
>
> 跑过的命令（全部只读，未写盘）：`git ls-files`、`git ls-tree -r --name-only HEAD`、`git rev-parse HEAD:<path>`、`git hash-object`、`git status --short`、`git check-ignore`、`Get-FileHash -Algorithm SHA256`、`Get-ChildItem`、`Get-Content .gitignore`、`Select-String`、`node verify-models.mjs`（只打印校验行）、`node --input-type=module -e`（内存渲染 `renderModel`，未落文件）、`node -e`（统计模型 `templates.*.skill`、用例条数）、`scs check skills --root … --json`、`node -v`。
> **未实跑** `npm run check`（全仓 `node --test` 耗时且会重写 `tmp/agent-criteria-demo/sandbox/`）；其末行判据的真相锚取源码 `scripts/check-all.mjs:575`。

**术语表（首次出现处的中文解释，后文沿用）**

| 术语 | 中文解释 |
|---|---|
| spec | 技术设计文档（`2026-11-11-agent-model-pipeline-p3-design.md`） |
| 引擎 | 迁到 `tools/agent-model/` 的 `verify-models.mjs` + `types/` + `render/` + `models/` |
| 旧树 | `tmp/agent-criteria-demo/` 下迁移前的 `models/` / `types/` / `render/` / `verify-models.mjs` |
| 新树 | `tools/agent-model/` |
| 模型 | `models/<seat>-model.json`，卡面唯一真相 |
| 草稿 | `skills/agent-modeling/drafts/<seat>-model.json`，运行期产物，不进 git |
| 薄封装 | skill 脚本只 import 引擎、不复制渲染/校验逻辑（spec D2） |
| 码 | `verify` 返回的错误串（如 `TIER_MISMATCH`），出现即判红 |
| 回放锚 | `reviewer-actuary` 单席「展开后等价 + 渲染同哈希」（spec D4 / §6） |
| 门禁 | spec §7 的 G1–G6 六条可执行判据 |
| scs | 技能守卫公共 CLI（`scs check skills`），实现在全局 `skill-common-script` |

## 0 测试设计结论（依据与判断）

- 结论 1：**`verify` 与 `anyError` 当前都不是导出**。`verify-models.mjs:84` 是 `function verify(name)`（无 `export`），`verify-models.mjs:211` 是 `const anyError = (r) => …`（无 `export`），二者只在尾部 CLI 块（`:216-248`）内使用；唯一导出是 `:69` 的 `expand`。故 TC-006 是当前即红的交付项，不能只判「文件搬过去了」。
- 结论 2：**迁移会连带打断 `skills/` 定位**。`verify-models.mjs:172` 用 `join(here, '..', '..', 'skills', t.skill)` 判断模板引用的技能是否存在；`here` 从 `tmp/agent-criteria-demo` 移到 `tools/agent-model` 后，该式指向 `tools/docgen/skills/`（不存在）。实跑统计 7 席共 9 处 `templates.*.skill = parliament-ledger`（`detective-observer` / `evidence-reader` / `respondent-architect` / `respondent-dev` / `reviewer-actuary` / `reviewer-ai` 各 1，`reviewer-audit` 2）。spec §3 只写「搬后改 1 处 import 深度」，未提这处路径，故 TC-007 直接判 `SKILL_MISSING` 出现 0 次。
- 结论 3：**新增 skill 会撞依赖清单门禁，spec 未登记**。`skilldependencies/validate.test.mjs:36` 断言「`skills/` 目录与 `manifest.json` 的 `skills` 列表一一对应（防新增技能漏登记）」，`:12` 要求 `skills` 列表与 `skilldependencies/*.json` 文件名一一对应。`manifest.json` 现有 13 个技能名、无 `agent-modeling`。即：光建 `skills/agent-modeling/` 会让 `npm run check` 变红（该测试在 check-all 的 `node --test **/*.test.mjs` 里）。TC-023 单独立条。
- 结论 4：**spec §3 的「4 个文件」低估了旧树依赖方**。除保留名单里的 `render-all.mjs`、`diff-report.mjs`、`test-p1.test.mjs` 外，还有三个被跟踪脚本引用旧引擎/旧模型：`render-card.mjs:4,7-8`、`update-baseline.mjs:4`、`eval/raw/perf/render-bench.mjs:4,8`。迁移后三者必 `ERR_MODULE_NOT_FOUND`，而 `npm run check` 的 `node --check` 只扫 `skills/**/*.mjs`、`node --test` 不含这些脚本，**无门禁覆盖**。实跑 `git ls-files tmp/agent-criteria-demo` 可见三者均为跟踪文件。TC-004 用「旧树中指向引擎的相对 import 全部可解析」兜住。
- 结论 5：**P1 单测的常量不是一个，而是两个根**。`test-p1.test.mjs:13-14` 的 `HERE` / `ROOT`、`:37-39` 的 `copyCase`（落点 `join(HERE,'..','p1-case-')`）同时被两类路径使用：`models`/`render`/`verify-models.mjs` 迁走，而 `sandbox/`、`render-all.mjs` 留在旧树（`:245-281` 大量 `join(HERE,'sandbox')`）。spec §8 写「改 3 个常量」，实测至少要拆「引擎根 / demo 根」两个根，否则 `copyCase` 会把副本目录建到 `tools/docgen/builders/` 下。TC-026 只判结果 `29/29`，不预设改法。
- 结论 6：**回放锚的数字已实测**。`renderModel(models/reviewer-actuary-model.json, shared)` → `type=ReviewerModel`、`lines=80`、`text.length=1786`；`sandbox/reviewer-actuary.md` 为 79 个换行、1786 字符（无尾换行）、sha256 `BC157078179A77C5E6BE0C22AF786716DEBE95F8855C2EBAD6A88DF6AB952C5B`。故 TC-016 判「首行 `reviewer-actuary [ReviewerModel] 80 lines`」+「与沙箱文件同哈希」。
- 结论 7：**校验基线可核**。实跑 `node tmp/agent-criteria-demo/verify-models.mjs` 输出 7 行、顺序为 `evidence-reader, respondent-architect, respondent-dev, reviewer-actuary, reviewer-ai, detective-observer, reviewer-audit`，每行以 `EQUIVALENT` 结尾、exit 0；行首格式是 `<seat>  [<Type>]  must=… never=… pred=… rec=…  EQUIVALENT`（**两个空格**分隔）。skill 侧输出格式由 spec §5 冻结为 `<seat> [<type>] EQUIVALENT`（单空格），TC-012 按 spec 判、不按引擎现状判。
- 结论 8：**`scs` 的 JSON 不是单行**。实跑 `scs check skills --root d:\Seed\retro-skills --manifest skilldependencies/manifest.json --json` 输出两行缩进 JSON（`{` / `"findings": []` / `}`），exit 0；spec §7 G6 的通过判据写作字面 `{"findings":[]}`，若照抄成 `Select-String` 会假红/假绿。TC-022 改为解析 JSON 取 `findings.length`。
- 结论 9：**`git check-ignore` 默认放过已跟踪文件**。要判「`drafts/` 不进 git」必须加 `--no-index`，否则一旦草稿被误 `git add`，`check-ignore` 仍按索引跳过、报「未忽略」，反而假绿。当前实跑 `git check-ignore --no-index skills/agent-modeling/drafts/probe.md` exit 1（尚无规则），即 TC-024 当前为红。
- 结论 10：**旧树文件都是 force-add 的跟踪文件**，`git mv` 与 `git ls-files` 均可用（`tmp/` 本身被 `.gitignore` 末行忽略）。实跑：旧 `models`+`types` = 18 个跟踪文件、`git rev-parse HEAD:` 与 `git hash-object` 同值（`e377f011…`）；迁移后新树应有 21 个跟踪文件（15 模型 + 3 types + 2 render + 1 verify）。
- 结论 11：**spec §7 G2 的命令口径与 §3 迁移表冲突**。§3 把 `verify-models.mjs` 搬到新树，§7 G2 仍写 `cd tmp/agent-criteria-demo && node verify-models.mjs`。TC-007 按迁移后路径判（行为判据「7 行 `EQUIVALENT`」不变）。这条属 spec 内部不一致，施工时以 §3 为准。

## 1 覆盖总表

| 用例 ID | 覆盖的 spec 条目 | 类型 | 判据 | 优先级 |
|---|---|---|---|---|
| TC-001 | §3 迁移映射（新树文件齐、git 可查） | 集成 | 机器 | P0 |
| TC-002 | §3 迁移映射（旧树清算、无残留引用） | 负例 | 机器 | P0 |
| TC-003 | §3「原样搬，内容零改动」 | 集成 | 机器 | P0 |
| TC-004 | §3「搬后改 import 深度」 | 单元 | 机器 | P0 |
| TC-005 | §4 唯一代码语义改动的语法前提 | 单元 | 机器 | P1 |
| TC-006 | §4 导出 `verify` / `anyError` | 单元 | 机器 | P0 |
| TC-007 | §4「不改 CLI 行为：7 行 EQUIVALENT」+ §7 G2 | 集成 | 机器 | P0 |
| TC-008 | §4 `opts.modelPath` 覆盖路径 | 单元 | 机器 | P0 |
| TC-009 | §4 `opts.baseline:false` 跳过基线 | 单元 | 机器 | P0 |
| TC-010 | §4 `anyError(r)` 判 exit code | 单元 | 机器 | P1 |
| TC-011 | §2 D2「薄封装，不复制逻辑」 | 负例 | 机器 | P1 |
| TC-012 | §5 脚本接口表 verify 正常路径 | 集成 | 机器 | P0 |
| TC-013 | §5 + §6.4 负例 tier 非法 | 负例 | 机器 | P0 |
| TC-014 | §5 `--ref` 等价 + §6.2 + §7 G4 | 集成 | 机器 | P0 |
| TC-015 | §5 `--ref` 不等价 `REF_DIFF` | 负例 | 机器 | P0 |
| TC-016 | §5 render 缺省落 `drafts/` + §6.3 同哈希 | 集成 | 机器 | P0 |
| TC-017 | §5 render `--out` 目录 | 集成 | 机器 | P1 |
| TC-018 | §5 末段 `--shared` 覆盖 | 负例 | 机器 | P1 |
| TC-019 | §5 skill 目录树（文件齐） | 集成 | 机器 | P0 |
| TC-020 | §5 SKILL.md 必含 1–5 | 集成 | 机器 | P0 |
| TC-021 | §5 必含 6（引用可解析、无跨技能路径） | 负例 | 机器 | P0 |
| TC-022 | §7 G6 技能守卫 0 findings | 集成 | 机器 | P0 |
| TC-023 | §7 G5 隐含的依赖清单登记 | 负例 | 机器 | P0 |
| TC-024 | §2 D3 + §8「`drafts/` 被提交」风险 | 负例 | 机器 | P0 |
| TC-025 | §5 必含 5「只写 drafts、不写 agents」+ PRD:216 | 负例 | 机器 | P0 |
| TC-026 | §7 G1 P1 单测 29/29 | 集成 | 机器 | P0 |
| TC-027 | §7 G3 `sandbox/*.md` = 8 | 集成 | 机器 | P0 |
| TC-028 | §7 G5 `npm run check` 末行 | 集成 | 机器 | P0 |
| TC-029 | §5 必含 3/6 的语义面（引用闭环、触发与边界） | 集成 | 人工 | P1 |
| TC-030 | §4 `skillsRoot()` 找不到仓根 → 抛错，不伪装成 `SKILL_MISSING` | 负例 | 机器 | P1 |

**覆盖核对**：spec §3 五行映射 → TC-001（新树）/TC-002（旧树）/TC-003（内容零改动）/TC-004（import 深度）；§4 六个改动点（导出 `verify`、`opts.modelPath`、`opts.baseline`、导出 `anyError`、CLI 行为不变、`isMain` 不动）→ TC-005/006/007/008/009/010，其中 `isMain` 不动由 TC-007 的正常 CLI 与 TC-026 的 `node --test` 共同承接；§5 目录树 7 项 → TC-019；§5 脚本接口表两行 → TC-012/013/014/015（verify）与 TC-016/017/018（render）；§5 必含 6 条 → TC-020（1–5）+ TC-021（6）+ TC-029（3、6 的语义面）；§6 回放验收 4 步 → TC-012（等价）/TC-014（`--ref`）/TC-016（同哈希）/TC-013（负例）；§7 G1–G6 → TC-026/TC-027/TC-028/ TC-014/TC-028/TC-022；§2 D1–D4 → TC-002（D1）/TC-011（D2）/TC-024（D3）/TC-014+TC-016（D4）。未覆盖条目 **0** 条。

## 2 用例明细

### TC-001 新树 21 个文件齐，且全部在 git 索引中

- **覆盖**：spec §3 迁移映射（`models/` + `_baseline/`、`types/`、`render/`、`verify-models.mjs`）
- **目的**：确认迁移不是「搬了一半」：新位置能落到 21 个文件，且 `git ls-files` 能查到（`tmp/` 被忽略，靠跟踪状态才能保证他人克隆后存在）。
- **前置**：已执行迁移（`git mv` 或等价操作）；CWD=`d:\Seed\retro-skills`。
- **步骤**：① 复制并执行下条 `node -e`，逐项核对期望路径是否 `existsSync`；② 同一条命令内用 `git ls-files tools/agent-model` 数跟踪文件数。
- **判据（机器）**：`node -e "const {execSync}=require('child_process'),fs=require('fs');const seats=['detective-observer','evidence-reader','respondent-architect','respondent-dev','reviewer-actuary','reviewer-ai','reviewer-audit'];const exp=[...seats.map(s=>'models/'+s+'-model.json'),'models/_shared-model.json',...seats.map(s=>'models/_baseline/'+s+'.json'),'types/base.mjs','types/derived.mjs','types/index.mjs','render/index.mjs','render/sections.mjs','verify-models.mjs'];const base='tools/agent-model/';const miss=exp.filter(p=>!fs.existsSync(base+p));const tr=execSync('git ls-files '+base,{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);console.log('exists='+(exp.length-miss.length)+'/'+exp.length,'tracked='+tr.length,'missing='+JSON.stringify(miss))"` → 首行 `exists=21/21 tracked=21 missing=[]`。
- **对应测试/交付物**：`tools/agent-model/**` ×21；验收人 = 主 agent 在 plan 收尾按本条核（plan 未规划独立 `test()`）。

### TC-002 旧树四个路径在 git 索引中清零，且代码里无旧路径字符串

- **覆盖**：spec §3（迁移而非复制）+ §8 回滚口径
- **目的**：防「新树建好、旧树还在」的双份真相；也防 `tmp/` 下残留代码继续引用旧路径导致两套引擎并存。
- **前置**：迁移完成；CWD=`d:\Seed\retro-skills`。
- **步骤**：① 查旧路径的跟踪文件数；② 全仓扫 `.mjs` / `.json`（跳过 `node_modules`、`.git`）里的旧路径字符串。
- **判据（机器）**：第一条：`node -e "const {execSync}=require('child_process');const o=execSync('git ls-files tmp/agent-criteria-demo/models tmp/agent-criteria-demo/types tmp/agent-criteria-demo/render tmp/agent-criteria-demo/verify-models.mjs',{encoding:'utf8'}).trim();console.log('oldTracked='+(o?o.split(/\r?\n/).length:0))"` → 首行 `oldTracked=0`。第二条：`node -e "const fs=require('fs'),p=require('path');const hits=[];const walk=d=>fs.readdirSync(d,{withFileTypes:true}).forEach(e=>{const f=p.join(d,e.name);if(e.isDirectory()){if(['node_modules','.git'].includes(e.name))return;walk(f)}else if(/\.(mjs|json)$/.test(e.name)){if(/agent-criteria-demo[\\/](models|types|render)[\\/]|agent-criteria-demo[\\/]verify-models\.mjs/.test(fs.readFileSync(f,'utf8')))hits.push(f)}});walk('.');console.log('staleRefs='+hits.length,JSON.stringify(hits.slice(0,5)))"` → 首行 `staleRefs=0 []`（本机迁移前实测即 `0 []`，迁移后仍须为 0）。
- **对应测试/交付物**：被删除的 `tmp/agent-criteria-demo/{models,types,render,verify-models.mjs}`；验收人 = 主 agent（`git status` / `git ls-files` 面）。

### TC-003 迁移是纯移动：`models/` 与 `types/` 的 18 个文件与 HEAD 逐字节相同

- **覆盖**：spec §3「原样搬，内容零改动」+ §1「迁移只改路径与 import，不改内容」
- **目的**：防迁移时顺手改模型（例如重排 JSON 键、改文案），把「零改动」变成不可核的口头承诺。
- **前置**：迁移已提交或已暂存；旧路径的 blob 仍在 `HEAD` 中（迁移前最后一个提交）。
- **步骤**：① 用 `git ls-tree -r --name-only HEAD -- tmp/agent-criteria-demo/models tmp/agent-criteria-demo/types` 取旧清单；② 逐文件把 `HEAD:<旧路径>` 的 blob 与 `git hash-object <新路径>` 比对；③ 输出差异文件。
- **判据（机器）**：`node -e "const {execSync}=require('child_process');const files=execSync('git ls-tree -r --name-only HEAD -- tmp/agent-criteria-demo/models tmp/agent-criteria-demo/types',{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);const bad=[];for(const f of files){const rel=f.replace('tmp/agent-criteria-demo/','');const h=execSync('git rev-parse HEAD:'+f,{encoding:'utf8'}).trim();const n=execSync('git hash-object tools/agent-model/'+rel,{encoding:'utf8'}).trim();if(h!==n)bad.push(rel)}console.log('total='+files.length,'diff='+bad.length,bad.join(','))"` → 首行 `total=18 diff=0`（本机实测旧清单 18 项、`reviewer-actuary-model.json` 两侧同为 `e377f0111185d828d43b6e6ed2cfadcaf5ecb35f`）。
- **对应测试/交付物**：`tools/agent-model/models/**`、`…/types/**`；`git mv` 的 `R100` 记录；验收人 = 主 agent。
- **说明**：`render/` 与 `verify-models.mjs` 不在此条，它们按设计要改 import 深度（TC-004）与新增导出（TC-006）。

### TC-004 新旧两树里指向引擎的相对 import 全部可解析

- **覆盖**：spec §3「搬后改 2 处 import 深度 / 改 1 处 import 深度」+ §8 风险「深度依赖」
- **目的**：import 深度写错不会让 `node --check` 变红（语法合法），只在运行期炸；本条用静态解析把新树全部相对 import、旧树中指向引擎的相对 import 一次核完。旧树里 `render-card.mjs:4,7-8`、`update-baseline.mjs:4`、`eval/raw/perf/render-bench.mjs:4,8` 三处是 spec §3「4 个文件」清单外的依赖方，必须一起被这条兜住。
- **前置**：迁移完成，新树存在。
- **步骤**：① 扫新树全部 `.mjs` 的 `from '…'` / `import('…')` 中相对说明符，逐个 `existsSync(resolve(dirname, spec))`；② 扫旧树同形说明符，但只收落在 `models/`、`types/`、`render/`、`verify-models.mjs` 上的（旧树另有 3 处 `verifyLedger*.mjs` 的既存未解析 import，与本迁移无关，见 §5）。
- **判据（机器）**：① `node -e "const fs=require('fs'),p=require('path');const bad=[];const walk=d=>fs.readdirSync(d,{withFileTypes:true}).forEach(e=>{const f=p.join(d,e.name);if(e.isDirectory())walk(f);else if(e.name.endsWith('.mjs')){const t=fs.readFileSync(f,'utf8');for(const m of t.matchAll(/(?:from|import)\s*\(?\s*['\x22](\.[^'\x22]+)['\x22]/g)){if(!fs.existsSync(p.resolve(p.dirname(f),m[1])))bad.push(f+' -> '+m[1])}}});walk('tools/agent-model');console.log('newUnresolved='+bad.length,JSON.stringify(bad))"` → 首行 `newUnresolved=0 []`；② `node -e "const fs=require('fs'),p=require('path');const bad=[];const walk=d=>fs.readdirSync(d,{withFileTypes:true}).forEach(e=>{const f=p.join(d,e.name);if(e.isDirectory()){if(e.name!=='node_modules')walk(f)}else if(e.name.endsWith('.mjs')){const t=fs.readFileSync(f,'utf8');for(const m of t.matchAll(/(?:from|import)\s*\(?\s*['\x22](\.[^'\x22]+)['\x22]/g)){if(!/(^|\/)(models|types|render)\/|verify-models\.mjs/.test(m[1]))continue;if(!fs.existsSync(p.resolve(p.dirname(f),m[1])))bad.push(f+' -> '+m[1])}}});walk('tmp/agent-criteria-demo');console.log('engineImportsUnresolved='+bad.length,JSON.stringify(bad))"` → 首行 `engineImportsUnresolved=0 []`（本机迁移前实测 `0 []`，迁移后仍须为 0）。
- **对应测试/交付物**：`tools/agent-model/**/*.mjs`、`tmp/agent-criteria-demo/{render-all.mjs,diff-report.mjs,test-p1.test.mjs,render-card.mjs,update-baseline.mjs,eval/raw/perf/render-bench.mjs}`；验收人 = 主 agent。

### TC-005 新树与旧树的 `.mjs` 全部过 `node --check`

- **覆盖**：spec §4（改动落在两个 `.mjs` 上，语法必须先过）
- **目的**：`npm run check` 的语法段只扫 `skills/**/*.mjs`，新树在 `tools/` 下不被扫；本条补齐。
- **前置**：迁移完成。
- **步骤**：① 递归收集两树的 `.mjs`；② 逐个 `node --check`；③ 收集非 0 退出者。
- **判据（机器）**：`node -e "const fs=require('fs'),p=require('path'),{spawnSync}=require('node:child_process');const bad=[];const walk=d=>fs.readdirSync(d,{withFileTypes:true}).forEach(e=>{const f=p.join(d,e.name);if(e.isDirectory()){if(e.name!=='node_modules')walk(f)}else if(e.name.endsWith('.mjs')){if(spawnSync(process.execPath,['--check',f],{encoding:'utf8'}).status!==0)bad.push(f)}});walk('tools/agent-model');walk('tmp/agent-criteria-demo');console.log('syntaxFail='+bad.length,JSON.stringify(bad))"` → 首行 `syntaxFail=0 []`。
- **对应测试/交付物**：同 TC-004 的文件集；验收人 = 主 agent。

### TC-006 引擎导出 `verify(name, opts)` 与 `anyError(r)`

- **覆盖**：spec §4 前两条
- **目的**：skill 的两个脚本只能从引擎拿判定，故两个符号必须可 import；当前 `verify-models.mjs:84`（`function verify`）与 `:211`（`const anyError`）都没有 `export`，本条现在即红。
- **前置**：迁移 + 加导出。
- **步骤**：① 用 ESM 动态 import 新树 `verify-models.mjs`；② 打印三个符号的 `typeof`。
- **判据（机器）**：`node --input-type=module -e "import{expand,verify,anyError}from'./tools/agent-model/verify-models.mjs';console.log('expand='+typeof expand,'verify='+typeof verify,'anyError='+typeof anyError)"` → 首行 `expand=function verify=function anyError=function`（若未导出，Node 直接抛 `SyntaxError: The requested module … does not provide an export named 'verify'`，命令非 0 退出）。
- **对应测试/交付物**：`tools/agent-model/verify-models.mjs` 的导出面；验收人 = 主 agent。

### TC-007 迁后 CLI 行为不变：7 行 `EQUIVALENT`、exit 0、无 `SKILL_MISSING`

- **覆盖**：spec §4 第三条「不改 CLI 行为」+ §7 G2
- **目的**：一次判三件事——① 7 席仍全绿；② 退出码仍 0；③ `verify-models.mjs:172` 的 `join(here,'..','..','skills',t.skill)` 在新深度下仍能找到 `skills/parliament-ledger`（迁移后该式默认指向 `tools/docgen/skills/`，不改就会给 9 处模板引用全报 `SKILL_MISSING`）。
- **前置**：迁移完成并改好深度。
- **步骤**：① 直接跑新树 CLI（不带参数走 7 席默认列表）；② 数行数、`EQUIVALENT` 数、`SKILL_MISSING` 数、记退出码。
- **判据（机器）**：`$o = node tools/agent-model/verify-models.mjs; "lines=$($o.Count) eq=$(($o|Select-String 'EQUIVALENT').Count) skillMissing=$(($o|Select-String 'SKILL_MISSING').Count) exit=$LASTEXITCODE"` → 首行 `lines=7 eq=7 skillMissing=0 exit=0`。
- **对应测试/交付物**：`verify-models.mjs` CLI 段（`:216-248` 保持原样）；P1 回归锚 TC-026。注：spec §7 G2 仍写 `cd tmp/agent-criteria-demo && node verify-models.mjs`，与 §3 迁移表冲突，本条按迁移后路径执行（见 §0 结论 11）。

### TC-008 `opts.modelPath` 覆盖：同一 seat 名可校验任意路径的模型

- **覆盖**：spec §4「`modelPath` 缺省时仍取 `models/<name>-model.json`」
- **目的**：skill 要校验草稿（不在 `models/` 下），必须能换路径；且换路径不能污染缺省行为。
- **前置**：TC-006 通过；`$env:TEMP` 可写。
- **步骤**：① 造副本：读 `models/reviewer-actuary-model.json`，把 `seat.tier` 改成 `admin`，写到 `$env:TEMP\p3-tc008-model.json`；② 同一进程内分别调 `verify('reviewer-actuary')`（缺省路径）与 `verify('reviewer-actuary',{modelPath:<副本>})`；③ 打印两者 `tierBad`。
- **判据（机器）**：先建副本 `$M = Join-Path $env:TEMP 'p3-tc008-model.json'; node -e "const fs=require('fs');const m=JSON.parse(fs.readFileSync('tools/agent-model/models/reviewer-actuary-model.json','utf8'));m.seat.tier='admin';fs.writeFileSync(process.argv[1],JSON.stringify(m,null,2))" $M`（退出 0，无输出）；再 `node --input-type=module -e "import{verify}from'./tools/agent-model/verify-models.mjs';const a=verify('reviewer-actuary');const b=verify('reviewer-actuary',{modelPath:process.argv[1]});console.log('own='+(a.tierBad||'ok'),'over='+(b.tierBad||'ok'))" $M` → 首行 `own=ok over=TIER_MISMATCH model=admin policy=readOnly`。
- **对应测试/交付物**：`verify(name, opts)` 的 `modelPath` 分支；验收人 = 主 agent。

### TC-009 `opts.baseline:false` 跳过 `_baseline` 比对（草稿没有基线）

- **覆盖**：spec §4「`baseline:false` 时跳过 `_baseline` 比对」
- **目的**：草稿是新写的模型，没有 `_baseline/<name>.json`；若引擎仍无条件读基线，skill 校验一跑就 `ENOENT`。本条用「同一份模型、开/关基线得到不同 `errs`」证明开关真的生效，而不是靠「跑通不报错」蒙过。
- **前置**：TC-006 通过；`reviewer-actuary` 自身 `must` 为空（实跑 `ownMust=0`，全部来自 `_shared-model.json`），故给副本加一条自有 `must` 即可让展开结果偏离基线。
- **步骤**：① 造副本：读模型，追加 `must: [{id:'p3.probe', text:'探针规则。'}]`，写 `$env:TEMP\p3-tc009-model.json`；② 各跑一次 `baseline:false` 与 `baseline:true`，打印 `errs`。
- **判据（机器）**：`$M = Join-Path $env:TEMP 'p3-tc009-model.json'; node -e "const fs=require('fs');const m=JSON.parse(fs.readFileSync('tools/agent-model/models/reviewer-actuary-model.json','utf8'));m.must=[{id:'p3.probe',text:'探针规则。'}];fs.writeFileSync(process.argv[1],JSON.stringify(m,null,2))" $M; node --input-type=module -e "import{verify}from'./tools/agent-model/verify-models.mjs';const a=verify('reviewer-actuary',{modelPath:process.argv[1],baseline:false});const b=verify('reviewer-actuary',{modelPath:process.argv[1],baseline:true});console.log('skipBase='+JSON.stringify(a.errs),'withBase='+JSON.stringify(b.errs))" $M` → 首行 `skipBase=[] withBase=["must"]`。
- **对应测试/交付物**：`verify` 的基线分支；验收人 = 主 agent。

### TC-010 `anyError(r)` 对好模型返回假、对坏模型返回真

- **覆盖**：spec §4「导出 `anyError(r)`：skill 用它判 exit code」
- **目的**：skill 的退出码只能来自引擎的这一个判定，若 `anyError` 漏掉某个错误面（如 `tierBad`），脚本就会假绿。
- **前置**：TC-008 的 `$env:TEMP\p3-tc008-model.json`（`seat.tier=admin`）已生成。
- **步骤**：① `verify('reviewer-actuary')` 取干净结果；② `verify('reviewer-actuary',{modelPath:<坏副本>})` 取坏结果；③ 分别过 `anyError` 取布尔。
- **判据（机器）**：`$M = Join-Path $env:TEMP 'p3-tc008-model.json'; node --input-type=module -e "import{verify,anyError}from'./tools/agent-model/verify-models.mjs';const ok=verify('reviewer-actuary');const bad=verify('reviewer-actuary',{modelPath:process.argv[1]});console.log('okErr='+Boolean(anyError(ok)),'badErr='+Boolean(anyError(bad)))" $M` → 首行 `okErr=false badErr=true`。
- **对应测试/交付物**：`anyError` 的错误面包（现 `verify-models.mjs:211-215` 的 21 个字段）；验收人 = 主 agent。

### TC-011 skill 两个脚本是薄封装：只 import 引擎，不内联渲染/校验逻辑

- **覆盖**：spec §2 D2「skill 脚本是薄封装：只 import 引擎，不复制任何渲染/校验逻辑」
- **目的**：防第二份真相——把 `DEFAULT_BOUNDARY` 文案或 `TIERS` 数组抄进脚本，后续引擎改了脚本不跟。
- **前置**：`skills/agent-modeling/scripts/verify.mjs`、`render.mjs` 已存在。
- **步骤**：① 读两个脚本源码；② 判三件事：是否 static import 了新树路径、是否内联边界常量句、是否内联档位工具数组。
- **判据（机器）**：`node -e "const fs=require('fs');const d='skills/agent-modeling/scripts/';const out=['verify.mjs','render.mjs'].map(x=>{const t=fs.readFileSync(d+x,'utf8');return x+':engineImport='+/from\s+['\x22][^'\x22]*tools\/docgen\/builders\/agent-model/.test(t)+',inlineBoundary='+/你是只读评审角色/.test(t)+',inlineTiers='+/['\x22]Read['\x22]\s*,\s*['\x22]Glob['\x22]/.test(t)});console.log(out.join(' ; '))"` → 首行 `verify.mjs:engineImport=true,inlineBoundary=false,inlineTiers=false ; render.mjs:engineImport=true,inlineBoundary=false,inlineTiers=false`。
- **对应测试/交付物**：`skills/agent-modeling/scripts/*.mjs`；常量源 `tools/docgen/builders/agents/components/patternRegistry.mjs:13`、`…/policy/definitions/tiers.mjs`。

### TC-012 `scripts/verify.mjs` 正常路径：`<seat> [<type>] EQUIVALENT`、exit 0

- **覆盖**：spec §5 脚本接口表第一行（输出与退出码）
- **目的**：契约的正面锚。注意 skill 侧输出格式由 spec 冻结为单空格 `<seat> [<type>] …`，与引擎 CLI 的现状（双空格 + `must=…` 统计）不同，故不拿引擎输出当期望。
- **前置**：TC-006/TC-007 通过。
- **步骤**：① 对正式模型跑 verify 脚本；② 看首行与退出码。
- **判据（机器）**：`node skills/agent-modeling/scripts/verify.mjs tools/agent-model/models/reviewer-actuary-model.json; "exit=$LASTEXITCODE"` → 首行 `reviewer-actuary [ReviewerModel] EQUIVALENT`，次行 `exit=0`（`ReviewerModel` 为实跑 `renderModel().type`）。
- **对应测试/交付物**：`skills/agent-modeling/scripts/verify.mjs`；验收人 = 主 agent。
- **不覆盖**：不判行尾是否还有统计字段（spec 未禁止，但首行必须以上述串开头）。

### TC-013 负例：草稿 `seat.tier` 改非法值 → exit 1 且首行含 `TIER_MISMATCH`

- **覆盖**：spec §5 退出码列 + §6.4 负例
- **目的**：判退出码的判别力。只看「输出了码」不够，exit 0 的门禁等于没门禁。
- **前置**：TC-008 的坏副本 `$env:TEMP\p3-tc008-model.json` 已生成（`seat.tier=admin`）。
- **步骤**：① 对坏副本跑 verify 脚本；② 记退出码；③ 匹配首行码串。
- **判据（机器）**：`$M = Join-Path $env:TEMP 'p3-tc008-model.json'; $o = node skills/agent-modeling/scripts/verify.mjs $M; "exit=$LASTEXITCODE"; $o[0]; "hasCode=$([bool]($o[0] -match 'TIER_MISMATCH'))"` → 第二行 `exit=1`、第三行以 `reviewer-actuary [ReviewerModel] ` 开头且含 `TIER_MISMATCH model=admin policy=readOnly`、第四行 `hasCode=True`。
- **对应测试/交付物**：`verify.mjs` 的退出码分支（依赖 TC-010 的 `anyError`）；验收人 = 主 agent。

### TC-014 `--ref` 指向同一模型 → 首行同时含 `EQUIVALENT` 与 `REF_EQUIVALENT`，exit 0

- **覆盖**：spec §5 `--ref` 列 + §6.2 + §7 G4
- **目的**：回放验收的主判据：草稿展开后与正式模型等价。
- **前置**：草稿已从正式模型复制（`skills/agent-modeling/drafts/reviewer-actuary-model.json`），内容相同。
- **步骤**：① 跑 verify 并带 `--ref` 指向正式模型；② 看首行两个串与退出码。
- **判据（机器）**：`$o = node skills/agent-modeling/scripts/verify.mjs skills/agent-modeling/drafts/reviewer-actuary-model.json --ref tools/agent-model/models/reviewer-actuary-model.json; "exit=$LASTEXITCODE"; "ownEq=$([bool]($o[0] -match 'EQUIVALENT')) refEq=$([bool]($o[0] -match 'REF_EQUIVALENT'))"` → 第二行 `exit=0`、第三行 `ownEq=True refEq=True`（首行形如 `reviewer-actuary [ReviewerModel] EQUIVALENT REF_EQUIVALENT`）。
- **对应测试/交付物**：`scripts/verify.mjs` 的 `--ref` 分支；`skills/agent-modeling/drafts/reviewer-actuary-model.json`。

### TC-015 负例：`--ref` 指向另一个席的模型 → `REF_DIFF:<path>`，exit 1

- **覆盖**：spec §5「带 `--ref` 时追加 `REF_EQUIVALENT` / `REF_DIFF:<path>`；0 = 无码且（若给 ref）等价；否则 1」
- **目的**：判 `--ref` 真的在比对，而不是只把 ref 路径原样回声；差异时必须给路径且改退出码。
- **前置**：同 TC-014。
- **步骤**：① 用 `reviewer-actuary` 草稿对 `reviewer-ai-model.json` 做 `--ref`；② 看首行与退出码。
- **判据（机器）**：`$o = node skills/agent-modeling/scripts/verify.mjs skills/agent-modeling/drafts/reviewer-actuary-model.json --ref tools/agent-model/models/reviewer-ai-model.json; "exit=$LASTEXITCODE"; "hasDiff=$([bool]($o[0] -match 'REF_DIFF:')) hasRefEq=$([bool]($o[0] -match 'REF_EQUIVALENT'))"` → 第二行 `exit=1`、第三行 `hasDiff=True hasRefEq=False`。
- **对应测试/交付物**：`scripts/verify.mjs` 的 `--ref` 差异分支；验收人 = 主 agent。

### TC-016 `scripts/render.mjs` 缺省落 `drafts/<seat>.md`，且与 `sandbox/reviewer-actuary.md` 同哈希

- **覆盖**：spec §5 render 行 + §6.3（单卡行数、同哈希）
- **目的**：回放的第二半：渲染产物必须与 P1 沙箱产物逐字节相同，否则「模型等价」推出「产物等价」的链条断掉。
- **前置**：TC-014 通过；`tmp/agent-criteria-demo/sandbox/reviewer-actuary.md` 存在（实跑 8 个 md 之一，sha256 `BC157078179A77C5E6BE0C22AF786716DEBE95F8855C2EBAD6A88DF6AB952C5B`）。
- **步骤**：① 不带 `--out` 跑 render；② 看首行（含行数）；③ 比较 `drafts/reviewer-actuary.md` 与沙箱文件的 SHA256。
- **判据（机器）**：`$o = node skills/agent-modeling/scripts/render.mjs skills/agent-modeling/drafts/reviewer-actuary-model.json; "exit=$LASTEXITCODE"; $o[0]; "sameHash=$((Get-FileHash skills/agent-modeling/drafts/reviewer-actuary.md -Algorithm SHA256).Hash -eq (Get-FileHash tmp/agent-criteria-demo/sandbox/reviewer-actuary.md -Algorithm SHA256).Hash)"` → 第二行 `exit=0`、第三行 `reviewer-actuary [ReviewerModel] 80 lines`、第四行 `sameHash=True`（80 = `renderModel().lines` 实跑值；文件无尾换行、1786 字符）。
- **对应测试/交付物**：`skills/agent-modeling/scripts/render.mjs`、`skills/agent-modeling/drafts/reviewer-actuary.md`；对照物 `tmp/agent-criteria-demo/sandbox/reviewer-actuary.md`。

### TC-017 `--out <绝对目录>` 改变落点，内容不变

- **覆盖**：spec §5「写 `<dir>/<seat>.md`（缺省 `drafts/`）」
- **目的**：判 `--out` 真被使用（不是只接收参数）。用绝对路径避免「相对谁解析」的口径分歧（spec 未冻结）。
- **前置**：同 TC-016。
- **步骤**：① 建一个本次进程专属的空目录；② 带 `--out` 跑 render；③ 检查该目录下文件存在且与沙箱同哈希。
- **判据（机器）**：`$out = Join-Path $env:TEMP ('p3-out-' + $PID); node skills/agent-modeling/scripts/render.mjs skills/agent-modeling/drafts/reviewer-actuary-model.json --out $out; "exit=$LASTEXITCODE"; "exists=$([bool](Test-Path (Join-Path $out 'reviewer-actuary.md')))"; "sameHash=$((Get-FileHash (Join-Path $out 'reviewer-actuary.md') -Algorithm SHA256).Hash -eq (Get-FileHash tmp/agent-criteria-demo/sandbox/reviewer-actuary.md -Algorithm SHA256).Hash)"` → 第二行 `exit=0`、第三行 `exists=True`、第四行 `sameHash=True`。
- **对应测试/交付物**：`render.mjs` 的 `--out` 分支；验收人 = 主 agent。
- **不覆盖**：不判相对 `--out` 的 base（spec 未写，见 §5）。

### TC-018 负例：`--shared` 指向改过的共享模型 → 结果随之改变（证明参数被真正读取）

- **覆盖**：spec §5 末段「两个脚本都从引擎取 `_shared-model.json`（… 可用 `--shared` 覆盖）」
- **目的**：参数存在但要证明它被读取。做法：给共享模型的 `rules.must` 追加一条 `appliesWhen:'*'` 的探针规则，展开结果必然偏离 `_baseline`，于是默认基线比对必红。
- **前置**：TC-012 通过（不带 `--shared` 时 exit 0）。
- **步骤**：① 造共享副本并追加探针规则；② 带 `--shared` 跑 verify；③ 记退出码并确认首行不含 `EQUIVALENT`；④ 对照组（不带 `--shared`）仍 exit 0。
- **判据（机器）**：`$S = Join-Path $env:TEMP 'p3-shared.json'; node -e "const fs=require('fs');const m=JSON.parse(fs.readFileSync('tools/agent-model/models/_shared-model.json','utf8'));m.rules.must.push({id:'p3.probe',appliesWhen:'*',text:'探针规则。'});fs.writeFileSync(process.argv[1],JSON.stringify(m))" $S; $a = node skills/agent-modeling/scripts/verify.mjs tools/agent-model/models/reviewer-actuary-model.json; "ctlExit=$LASTEXITCODE"; $b = node skills/agent-modeling/scripts/verify.mjs tools/agent-model/models/reviewer-actuary-model.json --shared $S; "sharedExit=$LASTEXITCODE"; "sharedEq=$([bool]($b[0] -match 'EQUIVALENT'))"` → `ctlExit=0`、`sharedExit=1`、`sharedEq=False`。
- **对应测试/交付物**：`scripts/verify.mjs` 与 `render.mjs` 的 `--shared` 解析；验收人 = 主 agent。

### TC-019 skill 目录骨架：7 个文件齐（SKILL.md + 4 references + 2 scripts）

- **覆盖**：spec §5 目录树
- **目的**：目录骨架缺失时，`scs check skills` 往往只报「引用不存在」，容易与文案问题混在一起；先判骨架。
- **前置**：已按 §5 建目录；TC-016 已生成 `drafts/`。
- **步骤**：① 逐个 `existsSync` 期望的 7 个文件；② 判 `drafts/` 目录存在。
- **判据（机器）**：`node -e "const fs=require('fs');const P=['SKILL.md','references/grammar-gaps.md','references/checks.md','references/model-schema.md','references/permissions.md','scripts/verify.mjs','scripts/render.mjs'];const miss=P.filter(p=>!fs.existsSync('skills/agent-modeling/'+p));console.log('have='+(P.length-miss.length)+'/'+P.length,'missing='+JSON.stringify(miss),'draftsDir='+fs.existsSync('skills/agent-modeling/drafts'))"` → 首行 `have=7/7 missing=[] draftsDir=true`。
- **对应测试/交付物**：`skills/agent-modeling/**`；`drafts/` 由 TC-016 产出（该目录不进 git，见 TC-024）。

### TC-020 SKILL.md：frontmatter、七阶流程表、两脚本接口、`drafts/` 硬约束、边界措辞

- **覆盖**：spec §5「SKILL.md 必含」1–5
- **目的**：把可机判的部分一次判完：frontmatter 两字段（`npm run check` 的 frontmatter 段也会判，但那里只判存在）、七阶表 7 行、脚本接口指针、只写 `drafts/` 的硬约束、`description` 里的「不用于」边界。
- **前置**：SKILL.md 已写。
- **步骤**：① 取 frontmatter 块；② 数正文中「以 `|` 开头且含 `P0`–`P6`」的行（= 七阶表行）；③ 判两脚本路径串；④ 判 `drafts/`、`agents/` 同时出现（硬约束句）；⑤ 判 frontmatter 里有「不用于 / Do not use for」。
- **判据（机器）**：`node -e "const fs=require('fs');const t=fs.readFileSync('skills/agent-modeling/SKILL.md','utf8');const fm=/^---\r?\n([\s\S]*?)\r?\n---/.exec(t);const b=fm?fm[1]:'';const rows=(t.match(/^\|[^\n]*\bP[0-6]\b/gm)||[]).length;console.log('fm='+Boolean(fm),'name='+/^name:\s*\S/m.test(b),'desc='+/^description:\s*\S/m.test(b),'flowRows='+rows,'scripts='+(t.includes('scripts/verify.mjs')&&t.includes('scripts/render.mjs')),'draftsOnly='+(t.includes('drafts/')&&t.includes('agents/')),'boundary='+/不用于|Do not use for/.test(b))"` → 首行 `fm=true name=true desc=true flowRows=7 scripts=true draftsOnly=true boundary=true`。
- **对应测试/交付物**：`skills/agent-modeling/SKILL.md`；七阶内容源 `tmp/agent-criteria-demo/modeling-methodology.md:48-58`（实跑读取：P0 归位 → P6 收口共 7 行）。

### TC-021 负例：references 引用全部可解析，且全技能内无跨技能路径写法

- **覆盖**：spec §5 必含 6「所有引用路径真实存在」+ `carrier-conventions/references/skill-structure.md:14` 硬约束 1
- **目的**：`scs` 能抓已知技能的跨技能路径，但自引用写全名（`skills/agent-modeling/...`）属载体规范问题，需另判；引用文件缺失则技能按需读取时直接空转。
- **前置**：SKILL.md 与 4 个 reference 已写。
- **步骤**：① 从 SKILL.md 抽 `references/<名>.md` 的引用集，逐个 `existsSync`；② 判每个引用串在正文出现 ≥1 次；③ 扫 `skills/agent-modeling/` 下所有 md 里 `skills/<某技能>/` 形态的写法出现次数。
- **判据（机器）**：① `node -e "const fs=require('fs');const t=fs.readFileSync('skills/agent-modeling/SKILL.md','utf8');const refs=[...new Set([...t.matchAll(/references\/[a-z0-9-]+\.md/g)].map(m=>m[0]))];const miss=refs.filter(r=>!fs.existsSync('skills/agent-modeling/'+r));const short=refs.filter(r=>(t.split(r).length-1)<1);console.log('refs='+refs.length,'missingFiles='+JSON.stringify(miss),'unlinked='+JSON.stringify(short))"` → 首行 `refs=4 missingFiles=[] unlinked=[]`；② `(Select-String -Path skills/agent-modeling/SKILL.md,skills/agent-modeling/references/*.md -Pattern 'skills/[a-z0-9-]+/' | Measure-Object).Count` → `0`。
- **对应测试/交付物**：`skills/agent-modeling/SKILL.md` 的指针段、`skills/agent-modeling/references/*.md`；判定依据 `carrier-conventions/references/skill-structure.md:14-16`。

### TC-022 技能守卫：`scs check skills` findings 为 0 且 exit 0

- **覆盖**：spec §7 G6 + PRD:218「`skills/agent-modeling` 通过 skill 体检」
- **目的**：技能体检是本阶段的验收条件之一；注意 `--json` 是多行缩进输出，不能拿 spec 里的字面 `{"findings":[]}` 去 grep。
- **前置**：`skills/agent-modeling/**` 写完。
- **步骤**：① 跑 scs 并把 stdout 存文件；② 记退出码；③ 解析 JSON 取 `findings.length`。
- **判据（机器）**：`scs check skills --root d:\Seed\retro-skills --manifest skilldependencies/manifest.json --json > $env:TEMP\p3-scs.json; "scsExit=$LASTEXITCODE"; node -e "console.log('findings='+JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).findings.length)" (Join-Path $env:TEMP 'p3-scs.json')` → 第二行 `scsExit=0`、第三行 `findings=0`（本机现状实跑即 `exit 0` + `findings: []`，新增技能后须仍为 0）。
- **对应测试/交付物**：`skills/agent-modeling/**`、`skilldependencies/manifest.json`；验收人 = 主 agent。

### TC-023 负例：新增技能必须在依赖清单登记（`skills/` 与 manifest 一一对应）

- **覆盖**：spec §7 G5 的隐含前置（`skilldependencies/validate.test.mjs:36`）+ §8「新 skill 被 `npm run check` 判红」风险
- **目的**：`npm run check` 的测试段会跑 `skilldependencies/validate.test.mjs`，其中两条断言要求「`skills/` 目录集 = manifest.skills 集」且「manifest.skills 集 = `skilldependencies/*.json` 文件名集」。只建目录不登记，G5 必红；spec §5 没有写这一步。
- **前置**：`skills/agent-modeling/` 已建。
- **步骤**：① 判 `manifest.json` 的 `skills` 数组含 `agent-modeling`；② 判 `skilldependencies/agent-modeling.json` 存在；③ 直接跑该测试文件的 5 条断言。
- **判据（机器）**：① `node -e "const fs=require('fs');const m=JSON.parse(fs.readFileSync('skilldependencies/manifest.json','utf8'));console.log('inManifest='+m.skills.includes('agent-modeling'),'depsFile='+fs.existsSync('skilldependencies/agent-modeling.json'))"` → 首行 `inManifest=true depsFile=true`；② `node --test --test-reporter=tap skilldependencies/validate.test.mjs | Select-String '^# (tests|pass|fail)'` → `# tests 5`、`# pass 5`、`# fail 0`。
- **对应测试/交付物**：`skilldependencies/manifest.json`、`skilldependencies/agent-modeling.json`；判据源 `skilldependencies/validate.test.mjs:12-16` 与 `:36-42`。

### TC-024 负例：`drafts/` 不进 git（忽略规则生效、无跟踪文件、工作区不显示）

- **覆盖**：spec §2 D3 + §8「`drafts/` 被提交 → 根 `.gitignore` 加规则」
- **目的**：草稿是运行期产物；且一旦被跟踪，`git status` 会把每次渲染显示成改动，回放验收的「零脏文件」失去基线。必须用 `--no-index` 判，否则 `check-ignore` 会跳过已跟踪文件、把误提交报成「未忽略」或漏报。
- **前置**：TC-016 已渲染出 `drafts/reviewer-actuary.md`。
- **步骤**：① `git check-ignore --no-index -q` 判忽略；② 数 `git ls-files` 的跟踪文件；③ 数 `git status --porcelain` 的脏文件。
- **判据（机器）**：`git check-ignore --no-index -q skills/agent-modeling/drafts/reviewer-actuary.md; $ig=$LASTEXITCODE; $tr=@(git ls-files skills/agent-modeling/drafts).Count; $st=@(git status --porcelain skills/agent-modeling/drafts).Count; "ignored=$ig tracked=$tr status=$st"` → 首行 `ignored=0 tracked=0 status=0`（`ignored=0` 表示 exit 0 = 命中忽略规则；本机迁移前实测为 `ignored=1`，即当前为红）。
- **对应测试/交付物**：根 `.gitignore` 的一行 `skills/agent-modeling/drafts/`；验收人 = 主 agent。

### TC-025 负例：skill 只写 `drafts/`，不写 `agents/`

- **覆盖**：spec §5 必含 5 + PRD:216「skill 只写 `drafts/`，不写 `agents/`」
- **目的**：这是 PRD 的硬约束，也是本阶段最大的越权风险（回放时若「顺手」写回正式卡，就绕过了 P5 的切换决策）。
- **前置**：TC-012、TC-016 已跑过两个脚本。
- **步骤**：① 数 `agents/` 的脏文件；② 判 skill 目录下没有 `agents/` 子目录；③ 判 `agents/*.md` 数量未变（迁移前后同为 18 席）。
- **判据（机器）**：`"agentsDirty=$(@(git status --short agents).Count)"; "agentsInSkill=$([bool](Test-Path skills/agent-modeling/agents))"; "agentsMd=$(@(Get-ChildItem agents -Filter *.md).Count)"` → `agentsDirty=0`、`agentsInSkill=False`、`agentsMd=18`（本机 `git status --short agents` 实测为空）。
- **对应测试/交付物**：`agents/**` 的零改动；验收人 = 主 agent。

### TC-026 门禁 G1：P1 单测 29/29

- **覆盖**：spec §7 G1 + §8 风险「`test-p1.test.mjs` 深度依赖 `HERE/models`」
- **目的**：迁移后 P1 的 46 条 testcase 必须一条不落地继续绿。本条只判结果条数与失败数，不预设常量怎么改（实跑 `^test\(` 计数 = 29）。
- **前置**：迁移 + `test-p1.test.mjs` 的路径常量改完。
- **步骤**：① 切到旧树目录跑单测（TAP 报告器，便于机器读计数）；② 取 `# tests` / `# pass` / `# fail` 三行。
- **判据（机器）**：`cd d:\Seed\retro-skills\tmp\agent-criteria-demo; node --test --test-reporter=tap test-p1.test.mjs | Select-String '^# (tests|pass|fail)'; cd d:\Seed\retro-skills` → 三行 `# tests 29`、`# pass 29`、`# fail 0`。
- **对应测试/交付物**：`tmp/agent-criteria-demo/test-p1.test.mjs`；别名承接：`npm run check` 的测试段（TC-028）也会跑到这 29 条，两条互为冗余。
- **说明**：旧树 `p1-case-*` 副本目录与临时 `rel-out` 由测试自建自删；若残留，删除后再跑（属测试临时目录，不是交付物）。

### TC-027 门禁 G3：`render-all` + `diff-report` 后 `sandbox/*.md` 恰 8 个

- **覆盖**：spec §7 G3
- **目的**：判 P1 产物链在迁移后仍能重建 7 张卡 + 1 份报告；顺带证明 `render-all.mjs` / `diff-report.mjs` 的旧树路径改写没破坏默认落点。
- **前置**：迁移完成。
- **步骤**：① 切到旧树目录跑 `render-all.mjs`，记退出码；② 跑 `diff-report.mjs`，记退出码；③ 数 `sandbox/*.md`。
- **判据（机器）**：`cd d:\Seed\retro-skills\tmp\agent-criteria-demo; node render-all.mjs; "renderExit=$LASTEXITCODE"; node diff-report.mjs; "reportExit=$LASTEXITCODE"; "mdCount=$(@(Get-ChildItem sandbox -Filter *.md).Count)"; cd d:\Seed\retro-skills` → `renderExit=0`、`reportExit=0`、`mdCount=8`。
- **对应测试/交付物**：`tmp/agent-criteria-demo/sandbox/**`；源码 `render-all.mjs`、`diff-report.mjs`（行为不变）。

### TC-028 门禁 G5：`npm run check` 末行 `check 全部通过`、exit 0

- **覆盖**：spec §7 G5
- **目的**：全仓总门禁。它同时覆盖：`skills/**/*.mjs` 的 `node --check`、全仓 `node --test`（含 TC-026 与 TC-023）、`scs check skills`、markdown 机械检查（含 SKILL.md frontmatter 与表格列数）、docgen gate、criteria-engine 等。
- **前置**：迁移 + skill 全部落盘 + 依赖清单登记（TC-023）。
- **步骤**：① 在仓库根跑 `npm run check` 并合并流；② 取最后一个非空行；③ 记退出码。
- **判据（机器）**：`$o = npm run check 2>&1; ($o | Where-Object { $_.Trim() -ne '' })[-1]; "exit=$LASTEXITCODE"` → 第一行 `check 全部通过`、第二行 `exit=0`（末行字面锚 = `scripts/check-all.mjs:575`；失败时该文件打 `check 未通过` 且 `process.exitCode = 1`）。
- **对应测试/交付物**：整仓门禁；验收人 = 主 agent。

### TC-029 人工判：SKILL.md 的引用是「读 → 产出」闭环，且触发/不触发边界互斥

- **覆盖**：spec §5 必含 6（「每个 `references/*.md` 以『按 X 执行，做完产出 Y』的闭环写法被引用」）+ 必含 3（触发条件与不触发条件）
- **目的**：机器只能判「路径在、被引用 ≥1 次」（TC-021）；但「读完这一节之后做什么、产出什么形态」是否真被写出来，是句式语义判断，正则化会误伤（例如「参考 `references/checks.md`」也算路径命中，却构不成闭环）。
- **前置**：TC-021 已绿（保证这不是「文件缺失」伪装成文案问题）。
- **步骤**：① 逐个打开 SKILL.md 中 4 处 references 指针；② 判每处是否在同一行/同一列表项内给出「动作 + 产出物」；③ 读 frontmatter `description` 与「触发条件 / 不触发条件」两节，判触发语与「不用于」是否指向不同场景（不能同一句既说用又说不用于）。
- **判据（人工）**：四条 references 引用每条都能回答「按它做什么、做完得到什么」（四元组里至少给出「动作」与「产出」两项）；`description` 含 ≥1 个触发语与 ≥1 个「不用于 / Do not use for」，且两者不指同一类请求；「七阶流程表」的表头含「门」列（每阶的出口条件）。
- **为什么必须人工**：判据是自然语言句式与语义互斥性，spec 未冻结逐字文案；可机器化的部分（路径存在、被引用次数、七阶行数、`不用于` 关键字）已在 TC-020/TC-021 判完，本条只判剩下的语义面。
- **对应测试/交付物**：`skills/agent-modeling/SKILL.md`；评审人 = 非作者席（senior-sdet / reviewer-audit 任一）。

### TC-030 负例：仓外副本 → `SKILLS_ROOT_UNRESOLVED`，不伪装成 `SKILL_MISSING`

- **覆盖**：spec §4「`skillsRoot()` 向上找含 `package.json` + `skills/` 的仓根，找不到即抛错」
- **目的**：证明「找不到仓根」是一个**可区分的错误**，而不是让 7 席所有技能模板逐个报 `SKILL_MISSING`（那是「技能名配错」的语义，会把定位引到模型内容上）。
- **前置**：`tools/agent-model/**` 与 `tools/docgen/builders/agents/{policy,components}` 可复制；环境未设 `MODEL_SKILLS_ROOT`。
- **步骤**：① 在系统临时目录建 `tools/agent-model` 与 `tools/docgen/builders/agents/{policy,components}` 的副本（复制面 = 引擎 + 它真正 import 的兄弟模块）；② 清掉 `MODEL_SKILLS_ROOT`；③ 跑 `node <副本>/tools/agent-model/verify-models.mjs reviewer-actuary`；④ 同时检查 stdout 不含 `SKILL_MISSING`。
- **判据（机器）**：`node --test tools/agent-model/test/skill-root.test.mjs` → `pass 1` / `fail 0`；用例内部断言：`status=1`、stderr 含 `SKILLS_ROOT_UNRESOLVED`、stdout 不含 `SKILL_MISSING`。手工等价命令：`$t=Join-Path $env:TEMP 'am-outside'; <复制上述两处>; Remove-Item Env:MODEL_SKILLS_ROOT; node "$t\tools\agent-model\verify-models.mjs" reviewer-actuary` → 首行 `Error: SKILLS_ROOT_UNRESOLVED from <副本路径>（可用 MODEL_SKILLS_ROOT 指定）`，exit 1。
- **对应测试/交付物**：`tools/agent-model/test/skill-root.test.mjs`；别名承接：`npm run check` 的测试段（TC-028）也会跑到本用例。
- **为什么仓内入口触发不了**：真实引擎上跳 4 层、`test-p1` 副本上跳 3 层都落在仓内命中仓根，且 `test-p1.test.mjs` 的 `run()` 还注入了 `MODEL_SKILLS_ROOT`；只有「引擎被复制到仓外且未设 env」才进入抛错分支，故必须显式造副本。

## 3 反例与边界

| 用例 ID | 反例/边界是什么 | 为什么容易漏 | 期望 |
|---|---|---|---|
| TC-002 | 新树建好、旧树仍被跟踪 | `tmp/` 被忽略，`git status` 看不见 | `oldTracked=0` 且 `staleRefs=0` |
| TC-004 | `render-card.mjs` / `update-baseline.mjs` / `render-bench.mjs` 不在 spec 的「4 个文件」里 | 三者写错 import 后语法合法、无门禁跑到 | 两树 `unresolved=0` |
| TC-007 | `verify-models.mjs:172` 的 `skills/` 相对路径 | spec 只提「1 处 import 深度」，看代码只数 import 会漏 | `skillMissing=0` |
| TC-008 | 同名 seat 换 modelPath | 只看缺省路径全绿会误判覆盖能力 | `own=ok over=TIER_MISMATCH …` |
| TC-009 | 草稿无基线 | 引擎无条件读 `_baseline` 时直接 `ENOENT`，看起来像「参数没生效」 | `skipBase=[] withBase=["must"]` |
| TC-011 | 把 `DEFAULT_BOUNDARY` 文案抄进脚本 | 功能一致，D2 被破坏 | `inlineBoundary=false inlineTiers=false` |
| TC-013 | 输出了码但 exit 0 | 门禁只看退出码时等于放行 | `exit=1` 且首行含码 |
| TC-015 | `--ref` 给错模型 | 只判「有 REF 字样」会漏掉不比对 | `REF_DIFF:` + `exit=1` |
| TC-016 | 渲染多一个尾换行 | 文本比对常先 trim，逐字节哈希不容忍 | `sameHash=True` |
| TC-018 | 收了 `--shared` 但没用 | 参数被解析后丢弃，输出与缺省一致 | `sharedExit=1` 且 `sharedEq=False` |
| TC-021 | 自引用写 `skills/agent-modeling/...` | 机器守卫只认跨「已知技能」 | 命中 `0` 次 |
| TC-023 | 漏登记依赖清单 | spec 未写；只有 `npm run check` 里的一条 test 抓 | `inManifest=true depsFile=true` 且 5/5 |
| TC-024 | `drafts/` 被误提交 | `check-ignore` 默认跳过已跟踪文件 | `tracked=0 status=0` |
| TC-025 | 回放时写回 `agents/` | 两个脚本各写一处就绕过硬约束 | `agentsDirty=0` |
| TC-030 | 仓根缺失被当成「技能名配错」 | 静默回退到一个不存在的 `skills/`，7 席 × 多模板一起报 `SKILL_MISSING`，定位被引到模型内容 | stderr 含 `SKILLS_ROOT_UNRESOLVED` 且 stdout 无 `SKILL_MISSING` |

**计数**：集成 **14** 条（001 / 003 / 007 / 012 / 014 / 016 / 017 / 019 / 020 / 022 / 026 / 027 / 028 / 029）、单元 **6** 条（004 / 005 / 006 / 008 / 009 / 010）、负例 **10** 条（002 / 011 / 013 / 015 / 018 / 021 / 023 / 024 / 025 / 030）；合计 **30**。其中 **机器判 29** 条、**人工判 1** 条（TC-029）。

## 4 回归清单

| 如果改了 | 必须重跑 | 为什么 |
|---|---|---|
| `tools/agent-model/**`（任何文件） | TC-001、TC-003、TC-004、TC-005、TC-006、TC-007、TC-026、TC-028 | 新树是全部判据的取数面；一处深度错会同时打红 import 与门禁 |
| `verify-models.mjs` 的导出或 `opts` | TC-006、TC-008、TC-009、TC-010、TC-012、TC-013、TC-015 | `verify` / `anyError` 是 skill 退出码的唯一来源 |
| `verify-models.mjs:172` 的 `skills/` 路径 | TC-007、TC-022 | 技能存在性判定与技能守卫同源（`parliament-ledger` 9 处模板引用） |
| `render/index.mjs`、`render/sections.mjs` | TC-016、TC-026、TC-027 | 单卡哈希锚与 7 卡产物都由段函数决定 |
| `skills/agent-modeling/SKILL.md` | TC-020、TC-021、TC-022、TC-028、TC-029 | frontmatter / 指针 / markdown 机械检查 / 守卫 / 语义面 |
| `skills/agent-modeling/scripts/*.mjs` | TC-011、TC-012、TC-013、TC-014、TC-015、TC-016、TC-017、TC-018、TC-028 | 两个脚本的接口与退出码；`npm run check` 会 `node --check` 它们 |
| 根 `.gitignore` | TC-024、TC-025 | `drafts/` 忽略规则是「草稿不进 git」的唯一机制 |
| `skilldependencies/manifest.json` 或新增 `skilldependencies/*.json` | TC-023、TC-022、TC-028 | 清单一一对应是 `npm run check` 的测试面 |
| `test-p1.test.mjs` 的路径常量 | TC-026、TC-028 | P1 回归锚；常量拆错会把副本目录建到 `tools/docgen/builders/` 下 |
| `tmp/agent-criteria-demo/sandbox/*.md` | TC-016、TC-027、TC-026 | 沙箱产物是同哈希判据的另一半 |

## 5 未覆盖与理由

| 不测什么 | 为什么 |
|---|---|
| PRD:214 的第二种输入形态（用户口述 → 草稿模型 → 确认 → 渲染） | 该路径的产出是自然语言建模过程，无确定性输出；PRD:218 的验收只指定 `reviewer-actuary` 存量回放（spec D4）。判它只能靠人工复述，无法给「命令 + 期望首行」 |
| 七阶流程各阶「门」的内容正确性 | 判据源是 `modeling-methodology.md:48-58` 的散文表；TC-020 只判「有 7 行且含 P0/P6」，语义是否等价见 TC-029 的人工面 |
| `--shared` 的**默认**取值口径（spec §5 末段写「默认 `../..` 之外的引擎目录」，措辞未冻结成路径算法） | spec 未给出可计算的默认值，TC-018 只判「传了就生效」；默认值只要 TC-012 能跑绿即被间接覆盖，不单独判 |
| 相对 `--out` 的解析基准（相对 cwd 还是相对脚本） | spec §5 未冻结；TC-017 只用绝对路径，避免把未定的口径当判据 |
| 草稿模型的语义质量（字段是否该这么建、判据是否充分） | spec D4 的等价性用「展开后逐字节相等」判，语义正确性属 P4 逐席人工确认（PRD:227） |
| 迁移前历史 spec / testcase 里的旧路径 | spec §8 明确「历史 spec 是当期记录，不回改」；若把这些文档计入 `staleRefs` 会与 spec 决策冲突，故 TC-002 只扫 `.mjs` / `.json` |
| `verify-models.mjs` 的 `isMain` 判定 | spec §4 明确「保持原样」；它在 `tools/` 下不在技能守卫扫描面，且行为差异只体现在「被 import 时不执行 CLI」，由 TC-006（import 不产生输出）与 TC-007（直接跑有输出）两面间接覆盖 |
| 跨机器 / 跨 Node 版本的同哈希与同计数 | 无第二台基线；本机 `node -v` = `v24.22.2`。判据里的 80 行 / 1786 字符 / `BC1570…` 都是本机实测值 |
| `tmp/agent-criteria-demo/verifyLedger*.mjs` 的 3 处既存未解析 import | 迁移前就存在（`verifyLedger.demo.mjs -> ../verifyLedger.mjs`、`-> ../ledger.mjs`、`verifyLedger.mjs -> ./ledger.mjs`），不在 §3 迁移面；若计入会让 TC-004 假红，故按说明符过滤排除 |
| `npm run check` 的 9 个分段逐段断言 | TC-028 只判末行与退出码（spec §7 G5 的口径）；分段判据各有既有测试与 `check-all.mjs` 自身保证，重复判会把本批 testcase 变成 check-all 的镜像 |
