# 测试用例：Docgen P2 · S3 senior-sdet 手写卡转录

> 归属 spec：`docs/superpowers/specs/2026-10-19-docgen-agent-senior-sdet-design.md`（split from `docs/prd/docgen-agent-generation.md` 2026-10-19；本文件对应当前 spec **2026-10-20 修订 3**）
> 编写者：`senior-sdet`｜**本次修订实例标识 `sdet-2026-10-20-docgen-p2-s3-revision6`**（初版 `sdet-2026-10-19-docgen-p2-s3`、修订 1 `sdet-2026-10-20-docgen-p2-s3-revision`、修订 2 `sdet-2026-10-20-docgen-p2-s3-revision2`、修订 3 `sdet-2026-10-20-docgen-p2-s3-revision3`、修订 4 `sdet-2026-10-20-docgen-p2-s3-revision4`、修订 5 `sdet-2026-10-20-docgen-p2-s3-revision5`）
> **独立性声明**：编写者 ≠ spec 作者（议会答辩方），≠ 施工者；**本次修订（revision6）在全新上下文完成，仅依据 spec 全文、实现现状、评审批次记录自行核实**，不从施工结果倒推判据，也不采信任何转述结论当判据。
> 状态：草稿（修订 6）｜最后更新 `2026-10-20`｜修订依据：第 1 轮 27 族答辩结论（`.session/reviews/2026-10-20-192002-s3-senior-sdet/problems.md`）+ 第 2 轮 6 席复核意见 30 项 + **第 3 轮复核收尾 10 项（P0 1 / P1 2 / P2 7）+ QA N4（P2）**，逐项落地；**修订 5**（P0）：§4 回归清单 `fixtures/senior-sdet.evidence.json` 行「必须重跑」栏残留裸「TC-001」（连带 001a）→ 改为「重跑 TC-001b；不得重跑 TC-001a」，并在 TC-001a 步⑤ 补「`init-evidence` 只允许在迁移前跑一次」；**修订 6**：① 文件头【diffSet 判据命令】调用方口径与末尾修订落点第 9 项，改为「spec §4 已列全四条（TC-010/014/016/021）+ TC-024 单测 helper 本体」；② TC-031 前置新增**路径存在性检查**（`git cat-file -e`），路径缺失时直接走「未提交态」兜底，并写明不得用 `git diff` 非空输出当存在性证明；用例总数与正/负/边界计数未变；**版本标签：对应当前 spec（修订 3）**
> 命名与落点：按 `spec-testcase-gate` 规则判据 1（与 spec 同目录；文件名 = spec 文件名去掉 `.md` 后 + `-testcase.md`）

> **执行环境（硬性）**：**Windows + PowerShell**（PS 5.1 与 pwsh 7 均须可跑）。禁 POSIX `grep`；`fc` 在 PowerShell 是 `Format-Custom` 的别名；`~` 在 PowerShell 不展开家目录（`cli.mjs` 的 `DRAFTS_DIR()` 缺省走 `os.homedir()`，测试一律改环境变量）。
>
> **起点三条命令**（全文 cwd 与临时目录一律由此派生，不写死盘符）：
>
> ```powershell
> $repo = (git rev-parse --show-toplevel).Trim()
> Set-Location $repo
> $w2 = Join-Path ([IO.Path]::GetTempPath()) 'sdet-w2'
> New-Item -ItemType Directory -Force $w2 | Out-Null
> ```
>
> **判据命令约定**（全文复用；用例内只写「【字节比较】A B」这类调用，不再重复命令正文）：
>
> - **【字节比较】** 两文件逐字节相等（替代 `fc /b`）：
>   `node -e "const fs=require('node:fs');const [a,b]=process.argv.slice(1);const x=fs.readFileSync(a),y=fs.readFileSync(b);console.log(x.equals(y)?'EQUAL':'DIFF');process.exitCode=x.equals(y)?0:1" <A> <B>`
> - **【检索】** `@(Select-String -Path <文件> -Pattern '<字面量>' -SimpleMatch).Count`。字面量含 `{ } ( ) . * |` 等正则元字符时**必须**加 `-SimpleMatch`，否则 `{{TOOLS}}` 会被当正则解析。
> - **【写比对对象】** 不用 PowerShell `>` / `Out-File` 存任何要比字节的文件（PS 5.1 默认 UTF-16LE）；**也禁用 `git show --output=`**（不同 git 版本行为不一致）。一律 node 按字节写盘：
>   `node -e "const fs=require('node:fs');const {execFileSync}=require('node:child_process');const rev=process.argv[1],out=process.argv[2];const buf=execFileSync('git',['show',rev+':agents/senior-sdet.md']);fs.writeFileSync(out,buf);console.log('wrote '+out+' bytes='+buf.length)" <rev> <out>`
> - **【冻结副本】** 路径 = `Join-Path $w2 ('sdet-frozen-' + <blob 前 12 位> + '.md')`；**一经生成不可覆盖**——重生成必须换文件名并在账本写明原因。
>   **丢失后重建**（锚点 = `tools/docgen/fixtures/senior-sdet.evidence.json` 的 `commit`/`blob`，不是「再冻结一次现卡」）：
>
> ```powershell
> node -e "const fs=require('node:fs');const {execFileSync}=require('node:child_process');const e=JSON.parse(fs.readFileSync('tools/docgen/fixtures/senior-sdet.evidence.json','utf8'));const out=process.argv[1];const buf=execFileSync('git',['show',e.commit+':agents/senior-sdet.md']);fs.writeFileSync(out,buf);const blob=execFileSync('git',['hash-object','--no-filters',out],{encoding:'utf8'}).trim();console.log('rebuilt '+out+' anchor-blob-ok='+(blob===e.blob));process.exitCode=(blob===e.blob)?0:1" "$frozen"
> ```
>
>   重建后必须跑一次 `git hash-object $frozen` == `evidence.blob`（不相等说明锚点已被破坏，属事故，不是「重建成功」）。
> - **【numstat 口径】** `git diff --numstat -- agents/senior-sdet.md` 输出三列 `新增行<TAB>删除行<TAB>路径`。本文判据**只比前两列与第三列文件名**：替换后期望 `1<TAB>1<TAB>agents/senior-sdet.md`；引用时一律写「前两列 == `1 1`」，不写两值形态。
> - **【草稿箱隔离】** `$env:DOCGEN_DRAFTS_DIR = Join-Path $w2 'drafts'`（`cli.mjs:161` 的 `DRAFTS_DIR()` 读该变量）；用例前后各清空一次并断言为空（`node tools/docgen/cli.mjs draft rm --name senior-sdet` 后 `node tools/docgen/cli.mjs draft ls --name senior-sdet` 无输出；**PowerShell 无裸 `draft` 命令**）。只有「正式迁移那一次」可用真实草稿箱（一次性、人工确认）。
> - **【node 断言】** `node -e` 的相对说明符以 **cwd** 为基准；需要 `await` 时用 `--input-type=module`。**PS 双引号串里禁用 `\"`**（PS 的转义符是反引号，`\"` 会把命令行截断）；需要引号字符时用 `String.fromCharCode(34)` / `(39)` / `(96)`。
> - **【diffSet 口径】** `diffSet(actualBuf, expectedBuf, ignorable)` → `{ raw, unallowed }`（spec §4「比对 helper 契约」）：
>   - 按 `\n` 切行，行内容不含行尾 `\n`；`index` = 0 基行号；
>   - `line` = **期望侧（`expectedBuf` = 冻结快照）**在该 index 的行内容；期望侧无该行（实际侧多行）时为 `null`；
>   - `raw` = 全部两侧不等的条目（含长度不等造成的那部分），按 index 升序；
>   - `unallowed` = `raw` 中 `line` 不在 `ignorable` 里的条目（`null` 视为不在）；
>   - 排除**只看 `line` 内容**：不得按 index、不得按 `>` 前缀。
> - **【diffSet 判据命令】**（**主判据调用方 = TC-010 / TC-014 / TC-016 / TC-021**，四条均在各自判据里落地；`mode` 决定期望结论）：
>
> ```powershell
> node --input-type=module -e "const fs=await import('node:fs');const u=await import('node:url');const NL=String.fromCharCode(10),BT=String.fromCharCode(96);const root=process.argv[1],golden=process.argv[2],mode=process.argv[3];const cli=await import(u.pathToFileURL(root+'/tools/docgen/cli.mjs').href);const cmp=await import(u.pathToFileURL(root+'/tools/docgen/components/compare.mjs').href);const L=fs.readFileSync(root+'/docs/superpowers/specs/2026-10-19-docgen-agent-senior-sdet-design.md','utf8').split(NL);const OLD=L[95].slice(L[95].indexOf('：'+BT+BT)+3,-2);const NEW=L[96].slice(L[96].lastIndexOf('：'+BT)+2,-1);const a=Buffer.from(cli.renderByName('senior-sdet'),'utf8');const b=fs.readFileSync(golden);const r=cmp.diffSet(a,b,[OLD,NEW]);console.log('mode='+mode+' raw='+r.raw.length+' unallowed='+r.unallowed.length);for(const d of r.raw)console.log('  idx='+d.index+' line='+JSON.stringify(d.line));let ok=false;if(mode==='exact1'){ok=(r.unallowed.length===0&&r.raw.length===1&&r.raw[0].line===OLD&&r.raw[0].index===b.toString('utf8').split(NL).indexOf(OLD))}else if(mode==='fail'){ok=(r.unallowed.length>=1)}else if(mode==='overflow1'){ok=(r.unallowed.length===1&&r.raw.length===2)}else if(mode==='truncated'){ok=(r.unallowed.length>=1&&r.unallowed[0].line!==null&&r.unallowed[0].line.indexOf('你的名声')>=0)}console.log('diffset-mode->'+(ok?'PASS':'FAIL'));process.exitCode=ok?0:1" <root> <goldenPath> <mode>
> ```
>
>   `root` 传 `.` 表示当前仓，传 `$cp` 表示副本仓；`mode` ∈ `exact1`（恰好一行来源差异）/ `fail`（至少一处不被允许）/ `overflow1`（恰好一处额外差异）/ `truncated`（首个不被允许的差异落在 identity 第二段）。
>   **落地前提**：`diffSet` 由 spec §1 影响面④ 新增至 `compare.mjs`；它落地前该命令必然报 `cmp.diffSet is not a function`（= 判据未实现，**不是绿**）。
>   **调用方口径**：主判据调用方 = TC-010 / TC-014 / TC-016 / TC-021（**四条逐个在判据正文里点名 `diffSet`**）；TC-022 步② / TC-026 步①② 也复用本命令的 `fail` 模式作判红手段，属**辅助复用**，不计入上面四条。**spec §4 已列全四条（TC-010 / TC-014 / TC-016 / TC-021）+ TC-024 单测 helper 本体**（spec 第 164 行），本文件与 spec 口径一致（见末尾修订落点第 9 项）。
> - **【副本仓】** 注入类负例一律在副本仓里做，**不碰仓库**（副本不含 `.git`，用完即弃）：
>
> ```powershell
> $cp = Join-Path $w2 'repo-copy'
> node -e "const fs=require('node:fs');const {execFileSync}=require('node:child_process');const {dirname,join}=require('node:path');const dst=process.argv[1];fs.rmSync(dst,{recursive:true,force:true});const NL=String.fromCharCode(10);const files=execFileSync('git',['-c','core.quotePath=false','ls-files'],{encoding:'utf8'}).trim().split(NL);const extra=['tools/docgen/state.json','tools/docgen/state.mjs','tools/docgen/evidence.mjs','tools/docgen/components/sharedBlocks.mjs','tools/docgen/components/outputFormats.mjs','tools/docgen/components/renderAgent.mjs'];for(const f of new Set([...files,...extra])){if(!f||!fs.existsSync(f))continue;const o=join(dst,f);fs.mkdirSync(dirname(o),{recursive:true});fs.copyFileSync(f,o)}fs.mkdirSync(join(dst,'.drafts'),{recursive:true});console.log('copy-ready '+dst)" "$cp"
> ```
>
>   跑副本里的 CLI 时用绝对路径 + 三个环境变量：`$env:DOCGEN_DRAFTS_DIR = Join-Path $cp '.drafts'`、`$env:DOCGEN_STATE_PATH = Join-Path $cp 'tools/docgen/state.json'`、`$env:DOCGEN_EVIDENCE_DIR = Join-Path $cp 'tools/docgen/fixtures'`；命令形如 `node (Join-Path $cp 'tools/docgen/cli.mjs') generate --kind agent --name senior-sdet`。
> - **【自评探针】** 参数化文件路径（TC-005 传真文件，TC-020 传删过注释的副本）：
>
> ```powershell
> node -e "const fs=require('node:fs');const p=process.argv[1];const L=fs.readFileSync(p,'utf8').split(String.fromCharCode(10));const i=L.findIndex(l=>/name:\s*'senior-sdet'/.test(l));const win=i<0?[]:L.slice(Math.max(0,i-15),i+1);const hit=win.filter(l=>l.indexOf('translation-self-check')>=0&&l.indexOf('详细')>=0&&l.indexOf('逻辑化')>=0);console.log('entry-line='+(i+1)+' selfcheck-hits='+hit.length);process.exitCode=(i>=0&&hit.length>=1)?0:1" <agentData 文件路径>
> ```
>
>   判据是**绑到条目**的：先定位 `name: 'senior-sdet'` 所在行，再断言其**前 ≤15 行内**存在一条同时含 `translation-self-check`、`详细`、`逻辑化` 的注释行（文件级 `Select-String` 会让「写在别的席头上」也过）。

### 逐字常量（全文唯一内联副本，其余逐字值一律引用 spec 行，不复制）

**OLD_SOURCE_LINE**（来源行「改前」，逐字，**两侧反引号属原文**）：

```
> 来源：用户 2026-10-18 指定新建。本角色卡不属于议会 13 席花名册，也**不由** `skills/parliament/scripts/gen-agents.mjs` 生成（那个生成器只管议会席）；改动直接改本文件。
```

**NEW_SOURCE_LINE**（来源行「改后」，逐字）：

```
> 来源：docgen 生成。本角色卡由 tools/docgen 生成（第二套模板 agent-handwritten.md.tpl）；改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换。
```

**NOT_WHEN_TEXT**（notWhen 文本，逐字）：

```
修改业务代码、写实现方案、或只读的议会评审（那走 reviewer-qa）
```

**自校验表（每个用例用常量前先做，一次即可）**：

| 常量 | 必须逐字等于 | 机器命令 |
|---|---|---|
| OLD_SOURCE_LINE | spec §3「来源行改前 / 改后」的「**改前**」一行（spec 第 **96** 行）**且** == 冻结副本（TC-001）中以 `> 来源：用户` 开头的那一行 | 见下方【常量自校验】 |
| NEW_SOURCE_LINE | spec §3「**改后**」一行（**单源**，spec 第 **97** 行；全文只引用不复制，本文件这一处是唯一内联副本，供断言比对） | 见下方【常量自校验】 |
| NOT_WHEN_TEXT | 冻结副本 `description:` 行里 `Do not use for ` 之后、句末 `。` 之前的那段 | TC-004 步③（拿冻结副本现算） |

**【常量自校验】**（读 spec 第 96/97 行数组下标 → 与本文件两个内联副本逐字 `===`；exit 0/1）：

```powershell
node -e "const fs=require('node:fs');const BT=String.fromCharCode(96),NL=String.fromCharCode(10);const tc=fs.readFileSync('docs/superpowers/specs/2026-10-19-docgen-agent-senior-sdet-design-testcase.md','utf8').split(NL);const p1=tc.filter(l=>l.startsWith('> 来源：用户')),p2=tc.filter(l=>l.startsWith('> 来源：docgen 生成'));const L=fs.readFileSync('docs/superpowers/specs/2026-10-19-docgen-agent-senior-sdet-design.md','utf8').split(NL);const so=L[95],sn=L[96];const o=so.slice(so.indexOf('：'+BT+BT)+3,-2);const n=sn.slice(sn.lastIndexOf('：'+BT)+2,-1);const ok=(p1.length===1&&p2.length===1&&p1[0]===o&&p2[0]===n);console.log('const-selfcheck: OLD='+(p1.length===1&&p1[0]===o?'PASS':'FAIL')+' NEW='+(p2.length===1&&p2[0]===n?'PASS':'FAIL')+' copies='+p1.length+'/'+p2.length);process.exitCode=ok?0:1"
```

> 该命令同时证明「本文件内联副本 == spec 单源」——spec 或本文件任一侧改动而另一侧没跟，立刻红。
> **为什么按行前缀而不是按代码块序号**：本文件的 powershell 块写在引用块里（围栏是 `> ```powershell`），按「成对围栏」解析的非贪婪正则会把它和后面的常量块错配，取到整段而不是一行。按行前缀 + `copies=1/1` 计数则两头都钉住：**本文件里以 `> 来源：用户` / `> 来源：docgen 生成` 开头的行必须各恰 1 行**（多出一行 = 第二份副本出现 = 判 FAIL）。

## 1 覆盖总表

| 用例 ID | 覆盖的 spec 条目 | 层级 | 正/负/边界 | 判据类型 | 执行方式 | 优先级 |
|---|---|---|---|---|---|---|
| TC-001 | §4 步 1 入选 / R7 / §5 首行（黄金值冻结前提） | 集成 | 正 | 机器 | 双哈希 + node 字节冻结 + evidence 初始化（TC-001a）/ 替换后重锁 evidence（TC-001b） | P0 |
| TC-002 | §4 步 2 / R2 / §3 数据形状 / §3.1 分配表 / §6 硬约束 3、6、8、9 / W2 转录零改写抽查（机器侧） | 单元 | 正 | 机器 | node 键集/槽位/纯度（从数据取值做探针）/tools 行/notWhen 计数/逐字（f） | P0 |
| TC-003 | R3 / §3 description 派生 / W2 专属 description / §6 硬约束 2 | 集成 | 正 | 机器 | 渲染 description vs **冻结副本** 逐字 | P0 |
| TC-004 | R4 / §6 硬约束 3 / W2 notWhen 引用合法 / S1 §6 断言 **12** | 单元 | 正 | 机器 | `triggerTable` 存在性 + 形状/文本/refs 断言 | P0 |
| TC-005 | R5 / §6 硬约束 4 / §7 自评痕 | 单元 | 正 | 机器+人工 | 【自评探针】绑到条目（前 ≤15 行内注释） | P0 |
| TC-006 | R1 / §3 模板（9 节，节名逐字） | 单元 | 正 | 机器 | 模板节标题逐字断言 | P1 |
| TC-007 | §3 触发表归属 / §6 硬约束 3、7 / S1 §6 断言 7、8、9 | 单元 | 正 | 机器 | when/route 从触发表读 + `heading !== role` + 断言号归因 | P0 |
| TC-008 | R6 / S1 R13 / W4（P2 内无词表实现） | 集成 | 正 | 机器 | `gate` + 词表实现缺席结构断言 | P1 |
| TC-009 | §4 步 3 生成（替换前 exit 1 属预期）/ S1 R3 | 集成 | 正 | 机器 | `generate --name` 退出码/stdout 形态/静默跳过警报 | P0 |
| TC-010 | §4 步 4 逐字节比对 / R2 / W2 逐字节一致 / §7 | 集成 | 正 | 机器 | `diffSet(render, frozen, [OLD,NEW])` → `unallowed` 空 + `raw` 恰 1 行 | P0 |
| TC-011 | §4 步 6 落草稿 / R7 | 集成 | 正 | 机器 | `draft`（临时草稿箱）+ 草稿字节 == 渲染副本 | P0 |
| TC-012 | §4 步 7 替换 / 步 8 验收 / W2 逐字节一致（巩固归 TC-013、A 组归 TC-030） | e2e | 正 | 机器 | `replace --yes` + 替换前草稿副本比对 + `npm run check` + numstat | P0 |
| TC-013 | §4 步 9 巩固 / R7 / W2 巩固 | e2e | 正 | 机器+人工 | `gate` + `cold-run.mjs` + `replace-scenarios.mjs` + 干净口径 + 旧生成器退役 | P0 |
| TC-014 | R2 / W2 逐字节一致 / §7 转录润色 | 集成 | 负 | 机器 | 副本仓注入润色 → `diffSet --mode fail` + `generate` exit 1 / stderr 空 | P0 |
| TC-015 | R2 / W2 来源声明行 / §7 | 集成 | 负 | 机器 | 来源行必须 == NEW_SOURCE_LINE（命中恰 1 次） | P0 |
| TC-016 | R2 / W2 唯一差异条款 / §6 硬约束 1、10 | 集成 | 负 | 机器 | 副本仓注入额外差异 → `diffSet --mode overflow1` | P0 |
| TC-017 | R3 / W2 专属 description / S1 §6 断言 7、8 / §7 拼装错 | 单元 | 负 | 机器 | 三样本：A→断言 7、A′→断言 8、B→黄金比对 | P0 |
| TC-018 | R4 / S1 §6 断言 **12** / §7 notWhen | 单元 | 负 | 机器 | 内存变异 refs 悬空 → `TriggerConflict` | P0 |
| TC-019 | R6 / S1 R13（词表机制在 P2 内缺席） | 集成 | 负 | 机器 | 去注释/去字符串字面量后结构扫描 = 0 命中 | P1 |
| TC-020 | R5 / §6 硬约束 4 | 单元 | 负 | 机器 | 单文件副本删自评注释 → 【自评探针】0 命中 | P0 |
| TC-021 | §3 identity / W2 逐字节一致 | 集成 | 负 | 机器 | 副本仓截断 identity → `diffSet --mode truncated` | P1 |
| TC-022 | R1 / §3 模板 9 节 | 集成 | 负 | 机器 | 副本仓删节 → `diffSet --mode fail` / 槽位残留 | P1 |
| TC-023 | R4 / §6 硬约束 5、9 / W2 notWhen 不进正文 | 单元 | 负 | 机器 | 两套模板「无 `{{NOT_WHEN}}`」断言 | P1 |
| TC-024 | R2 / §6 硬约束 10 / W2 逐字节一致 / §7 排除逻辑判别力 | 单元 | 负 | 机器 | `diffSet` 本体单测：三实现对照 | P0 |
| TC-025 | §4 步 7 / S1 §5.3 拒红过滤 | 集成 | 负 | 机器 | `replace` 退出码 2 + stderr 首词 `BaselineDrift` + 还原后转绿 | P1 |
| TC-026 | §4 失败回退（停损）/ R7 | e2e | 负 | 机器 | 停损态：numstat **空** + 副本卡未被迁就 | P1 |
| TC-027 | PRD §5 通用前置（checkEnvironment）/ W2 逐字节一致 | 集成 | **边界** | 机器 | 五个 violation 各一单违规样本 + 端到端接受 `Mismatch` | P1 |
| TC-028 | §4 步 9 巩固 / W2 巩固 / `git status` 口径 | e2e | 负 | 机器 | 四情形巩固判定 | P1 |
| TC-029 | §4 步 7 / S1 §5.2 / S1 §7 exit 4 | 集成 | 负 | 机器 | `replace` 缺 `--yes` → exit 4 | P1 |
| TC-030 | §5「A 组结构项不回归」/ §7 / 线 E `criteria.md` A3–A7 / §6 硬约束 7 | e2e | 正 | 机器 | `checkAgentFile('senior-sdet')` 取 A3–A7 子集 | P0 |
| TC-031 | §5「13 席渲染不回归」/ §3「13 席渲染字节不得因此改动」段 / §7 | 单元 | 正 | 机器 | 议会席模板渲染快照（单 fixture 代表）不回归 | P0 |

### 覆盖核对（按现行 spec 结构逐条款普查，并给出诚实去重口径）

**普查口径**：逐条款列全 **27 条**；其中 `R2`≡`§6-1`、`R3`≡`§6-2`、`R4`≡`§6-3`/`§6-5`、`R5`≡`§6-4` 属**跨节重复表述**（同一规定在两个位置各写一次），去重后 = **23 条独立规定**（= `R1`、`R6`、`R7` 3 条 + `§5` W2 八行 + `§3` 数据形状 1 条 + `§3.1` 分配表 1 条 + `§6` 硬约束 1–10 共 10 条）。
**可失败性口径**：`R6` 是**恒真豁免**（S1 已裁定 P2 内无词表实现、无消费对象），**不计作可失败验收项**；故可失败项 = **22 条**，其覆盖见下表「去重后计数」列。
**「模板复用定性」（§3.1 末段）** 是**文档约定**，不设自动断言，已在 §6「不测」列明理由——不占验收项。

| # | 验收项（现行 spec 位置） | 覆盖用例 | 去重后计数 |
|---|---|---|---|
| 1 | R1 第二套模板（13 席卡 8–12 节不等，都不含本席专属节） | TC-006、TC-022、TC-007 | 独立 1 |
| 2 | R2 转录零改写 + 唯一允许差异 = 来源行 | TC-002、TC-010、TC-014、TC-015、TC-016、TC-024、TC-026 | ≡#18（重复，不另计） |
| 3 | R3 专属 description 句式 | TC-003、TC-017 | ≡#19（重复，不另计） |
| 4 | R4 notWhen 结构化 + 只参与 description 派生（不渲染正文） | TC-004、TC-018、TC-023、TC-002 | ≡#20+#22（重复，不另计） |
| 5 | R5 翻译质量自评（详细 / 逻辑化） | TC-005、TC-020 | ≡#21（重复，不另计） |
| 6 | R6 转录字段不适用词表断言（**恒真豁免，不计可失败项**） | TC-008、TC-019 | 独立（恒真） |
| 7 | R7 九步闭环同 S2（含旧生成器已退役） | TC-001、TC-009、TC-011、TC-012、TC-013、TC-025、TC-029 | 独立 2 |
| 8 | W2-① 逐字节一致（vs 冻结快照） | TC-010、TC-014、TC-021、TC-027 | 独立 3 |
| 9 | W2-② 专属 description 逐字复现（快照里） | TC-003、TC-017 | 独立 4 |
| 10 | W2-③ 转录零改写抽查（机器 + 人工） | TC-002（判据 f）、TC-010 + §5 人工项 | 独立 5 |
| 11 | W2-④ notWhen 引用合法（断言 12，遍历 triggerTable） | TC-004、TC-018 | 独立 6 |
| 12 | W2-⑤ **notWhen 不进正文** | TC-002（步⑦）、TC-023、TC-010（逐字节兜底） | 独立 7 |
| 13 | W2-⑥ 巩固（连续 2 次 gate 含冷跑 + check 全绿 + 干净口径 + 草稿箱清） | TC-013、TC-028 | 独立 8 |
| 14 | W2-⑦ **13 席渲染不回归** | TC-031 | 独立 9 |
| 15 | W2-⑧ **A 组结构项不回归（A3–A7）** | TC-030 | 独立 10 |
| 16 | §3 数据形状（10 键 + 触发表四键归属 + 渲染分流 + 来源行锁定 + 比对口径） | TC-002、TC-007、TC-021、TC-024 | 独立 11 |
| 17 | §3.1 数据槽 / 模板常量分配表（含表头+分隔行、`tools: {{TOOLS}}`、模板纯度、7 槽位） | TC-002、TC-007、TC-006 | 独立 12 |
| 18 | §6-1 转录零改写 | TC-002、TC-010、TC-014、TC-016、TC-024 | 独立 13 |
| 19 | §6-2 专属 description 逐字不引入新词 | TC-003、TC-017 | 独立 14 |
| 20 | §6-3 when/notWhen/route/fallback **只住 triggerTable** + notWhen 必填且 text 非空 | TC-002、TC-004、TC-007、TC-018 | 独立 15 |
| 21 | §6-4 自评写入注释，缺 = 不合格 | TC-005、TC-020 | 独立 16 |
| 22 | §6-5 notWhen 不渲染正文，**两套模板都不加 `{{NOT_WHEN}}`** | TC-002、TC-023 | 独立 17 |
| 23 | §6-6 §3.1 逐行执行，不得互塞 / 不得内联 | TC-002 | 独立 18 |
| 24 | §6-7 H1 用 `heading`，不得借 `dimension` | TC-007、TC-030 | 独立 19 |
| 25 | §6-8 `tools: {{TOOLS}}` 禁硬编码 | TC-002 | 独立 20 |
| 26 | §6-9 模板必须且只必须 7 槽位（清单以 §3.1 为单源） | TC-002、TC-023 | 独立 21 |
| 27 | §6-10 排除来源行只按行内容（不得按行号 / `>` 前缀） | TC-024、TC-016 | 独立 22 |

**计数自洽（三处一致之一：本节 / §3 说明 / 完成回报）**：用例 **31** 条；正例 **15**（TC-001~TC-013 + TC-030 + TC-031）；负例 **15**（TC-014~TC-026 + TC-028 + TC-029）；边界 **1**（TC-027）；负例与边界 **16 ≥ 正例 15** ✓。编号一经分配不改号、不重排、无作废；TC-001 内含 `TC-001a` / `TC-001b` 两段步骤（同一编号，**不新增用例**）。

## 2 用例明细

### TC-001 入选：冻结迁移前基线快照（TC-001a）+ 替换后重锁 evidence（TC-001b）

- **覆盖**：§4 步 1 / R7 / §5 首行（「比对对象 = 步 1 冻结的迁移前快照」）
- **前置**：
  - `agents/senior-sdet.md` 的**迁移前版本已提交**（`git status --short agents/senior-sdet.md` 无输出）。本用例只读，不做 git 写操作
  - **冻结副本一经生成不可覆盖**；确需重生成必须换文件名并在账本写明原因（例：`sdet-frozen-<blob12>-rebuilt.md`）
  - 已执行文件头【执行环境】三条命令（`$repo` / `$w2`）
- **步骤**：
  **TC-001a 迁移前冻结（一次性；替换后不得重跑）**
  ① `git hash-object agents/senior-sdet.md` 与 `git rev-parse HEAD:agents/senior-sdet.md` 两值必须相等（证明工作区 == HEAD，冻结的才是「迁移前最后版本」）
  ② `$blob = (git rev-parse HEAD:agents/senior-sdet.md).Trim()`；`$frozen = Join-Path $w2 ('sdet-frozen-' + $blob.Substring(0,12) + '.md')`——**文件名带 blob 前缀**，重复跑不会覆盖同名旧件
  ③ 用【写比对对象】按字节冻结——参数 `<rev>` = `HEAD`、`<out>` = `$frozen`（**禁用 `git show --output=`、禁用 PS `>`、禁用 `Out-File`**）
  ④ 冻结自检：`git hash-object $frozen` == 步② 的 40 位值；`(Get-FileHash $frozen -Algorithm SHA256).Hash` == `(Get-FileHash agents/senior-sdet.md -Algorithm SHA256).Hash`
  ⑤ 初始化 evidence：`node tools/docgen/acceptance/init-evidence.mjs senior-sdet`（`init-evidence.mjs:13-18` 写 `commit` / `blob` / `sha256` / `hashObject`，`renderSha256='pending'`，`lastWrittenHash = 旧卡 SHA256`）
     **本步只跑 `init-evidence.mjs`**；**`init-evidence` 只允许在迁移前跑一次**——替换后重跑会把 `commit`/`blob` 指向替换后的卡，黄金锚点即失效（TC-001b 步④ 明令禁止）。`golden-assert.mjs` 的回填不在此步（见步 4 / TC-012 前置）。**`golden-assert.mjs` 对本席当前「双重不兼容」，其退出码不得当「回填成功 / 回填失败」判据**：
     - **修法 1｜句式未分流**：`golden-assert.mjs:18` 硬编码 `patternRegistry.description.parliament(agent.role, t.when)`；本席 `outputKind='testcase'` 应先按 `agent.outputKind` 分流为 `description.handwritten(agent.role, t.when, t.notWhen?.text ?? '')`（该函数已存在：`patternRegistry.mjs:7`），否则派生串必不等于快照 description → `goldenAssertion` 恒 `fail`；
     - **修法 2｜整文件全等未豁免来源行**：`:24`（`renderedBytes.equals(snapshotBytes)`）与 `:35`（`if (cmp)`）用的是**整文件全等**；本席来源行按设计必差异（R2 唯一允许差异）→ `compareResult` 恒 `Mismatch`，命令恒 exit 1。整文件比较必须改用 `diffSet` 并豁免 `{OLD_SOURCE_LINE, NEW_SOURCE_LINE}`（接口见 spec §4「比对 helper 契约」）。
     **修法 1、2 落地之前，该命令退出码 1 属预期**（`renderSha256` 在 `:29` 已先写盘，早于 `:34` / `:37` 的退出），**不得记作「回填失败」**。两处修法属施工改动，已在 spec §1 影响面⑤（`tools/docgen/acceptance/` 回填入口）登记。
  ⑥ 断言 evidence 的**锚点**三项：`evidence.commit` == `git log -1 --format=%H -- agents/senior-sdet.md`；`evidence.blob` == 步② 的 `$blob`；`evidence.renderSha256 === 'pending'`
  ⑦ 账本记：`evidence.commit` / `evidence.blob`（**黄金值的可重建锚点**）+ 冻结副本路径 + 旧卡 SHA256 + 迁移日期 + 该席类型（手写转录）

  **TC-001b 替换后重锁 evidence（替换后执行；不得触碰冻结副本）**
  ① 断言 `evidence.lastWrittenHash` == `sha256(agents/senior-sdet.md)` 的**大写 64 位**（replace 成功路径已写，`cli.mjs:269`）
  ② 断言冻结副本的 SHA256 与 TC-001a 步④ 记录值**逐字相同**（冻结副本未被改写）
  ③ 若步① 不等（只有幂等恢复以外的异常路径才会发生），按下式重锁——**只改 `lastWrittenHash`，不动 `commit`/`blob`/`sha256`/`hashObject`**：
     `node --input-type=module -e "const fs=await import('node:fs');const {createHash}=await import('node:crypto');const {readEvidence,writeEvidence}=await import('./tools/docgen/evidence.mjs');const e=readEvidence('senior-sdet');const before=[e.commit,e.blob,e.sha256,e.hashObject];e.lastWrittenHash=createHash('sha256').update(fs.readFileSync('agents/senior-sdet.md')).digest('hex').toUpperCase();writeEvidence('senior-sdet',e);const a=readEvidence('senior-sdet');const same=before.every((v,i)=>v===[a.commit,a.blob,a.sha256,a.hashObject][i]);console.log('relock lastWrittenHash='+a.lastWrittenHash+' anchor-unchanged='+same);process.exitCode=same?0:1"`
  ④ **禁止**重跑 TC-001a 或 `init-evidence`——那会把 `commit`/`blob` 指向迁移后版本，黄金锚点当场丢失
- **预期**：双哈希可复算；冻结副本与 HEAD 字节相同且文件名带 blob 前缀；evidence 就位，`lastWrittenHash`（旧卡 / 新卡）与 `renderSha256`（渲染）是**两个不同时刻**的值，方向正确
- **判据**：机器——① `git hash-object` 退出 0 且输出 40 位 hex；② `Get-FileHash` 输出 64 位 hex；③ `git hash-object $frozen` 与 ① 逐字相等（**这就是「冻结副本没被编码转换」的证明**）；④ **复算且不覆盖**：用【写比对对象】把 `HEAD` 版再写到**另一个文件名**（`sdet-frozen-<blob12>-rebuilt.md`）→ 与 `$frozen` 【字节比较】`EQUAL` 且 `$frozen` 自身哈希不变（证明冻结可复算、新件不覆盖旧件；**这一步不是「重跑 TC-001a」**——TC-001a 的冻结目标 `$frozen` 一经生成就不再重写）；⑤ evidence 锚点命令：
  `node -e "const fs=require('node:fs');const e=JSON.parse(fs.readFileSync('tools/docgen/fixtures/senior-sdet.evidence.json','utf8'));const {execFileSync}=require('node:child_process');const c=execFileSync('git',['log','-1','--format=%H','--','agents/senior-sdet.md'],{encoding:'utf8'}).trim();const b=execFileSync('git',['rev-parse',c+':agents/senior-sdet.md'],{encoding:'utf8'}).trim();console.log('commit-ok='+(e.commit===c)+' blob-ok='+(e.blob===b)+' renderSha256='+e.renderSha256);process.exitCode=(e.commit===c&&e.blob===b)?0:1"`
  （替换后 `evidence.commit` 会随「最近一次提交」变化——**故该命令只在 TC-001a 阶段跑**；替换后用 TC-001b 步① 的 `lastWrittenHash` 断言）
- **红绿证据**：红 = 工作区与 HEAD 不等（步① 两值不同 → 冻结的不是迁移前最后版本）；冻结副本 hash 与 HEAD blob 不等（典型事故：用 PowerShell `>` 重定向，文件被改成 UTF-16）；evidence 照抄 `reviewer-audit.evidence.json`（三项同值 → 步 7 必 `TargetDrift`，见 §8 #11）。绿 = 两哈希稳定 + 冻结副本 hash == HEAD blob + evidence 锚点与 `lastWrittenHash`/`renderSha256` 方向正确
- **自比退化反例**：省掉冻结、后续直接读 `agents/senior-sdet.md` 当黄金 —— replace 成功后该文件就是渲染产物，TC-010 立刻退化成「渲染 vs 渲染」恒绿
- **对应测试**：待 plan Task N（迁移脚本内嵌账本写入）
- **不覆盖**：commit 本身（git 写操作由用户决定）；evidence 其余字段语义（`evidence.mjs:30-38` 由 `readEvidence` 校验）

### TC-002 数据迁移：按 §3.1 逐行分进「数据字段 / 触发表 / 模板常量」（零改写 + 模板纯度 + 槽位 + 逐字）

- **覆盖**：§4 步 2 / R2 / §3 数据形状 / §3.1 分配表 / §6 硬约束 3、6、8、9 / W2 转录零改写抽查（机器侧）
- **前置**：S1 序 0 完成（`agentData.mjs` / `validateAgentData` 可运行）；冻结副本已建（TC-001a，路径 `$frozen`）；`agent-handwritten.md.tpl` 已重写为 9 节真模板（TC-006）。**冻结副本丢失时**按文件头【冻结副本】的「丢失后重建」命令重建（锚点 = `fixtures/senior-sdet.evidence.json` 的 `commit`/`blob`）
- **步骤**：
  ① **数据字段部分**（§3.1 前六行 + identity/fixedList）：`name='senior-sdet'`、`tools=['Read','Glob','Grep','Write','Edit']`、`heading='Senior SDET（测试设计与盲点猎手）'`（现卡第 7 行 `# 角色：` 之后整段）、`role='资深测试开发工程师（Senior SDET）'`、`identity` = 「你是谁」两段逐字（含段间空行）、`fixedList` = 固定清单 **9 条数据行整行原文**（含 `|` 与行内加粗）、`sourceLine` **逐字 == NEW_SOURCE_LINE**（单源：spec 第 97 行）
  ①b **触发表部分**：`triggerTable['senior-sdet']` 补齐 `notWhen = { text: NOT_WHEN_TEXT, refs: ['reviewer-qa'] }`；`when` / `route` 保持既有值。**when / notWhen / route / fallback 四键一律不进 agentData 条目**
  ② **模板常量部分**（进 `agent-handwritten.md.tpl`）：七节正文（你负责三件事 / 三条铁律 / 输入（四样，缺一不写）/ 自由探索（必做）/ 输出格式 / 通用纪律 / 边界）逐字写入；**固定清单的标题行 + 表头 `\| # \| 必答 \|` + 分隔行 `\|---\|---\|` 也进模板常量，紧贴 `{{FIXED_LIST}}` 上方**；**两套模板都不加 `{{NOT_WHEN}}`**
  ③ **槽位与模板纯度**：模板必须且只必须含 7 槽位 `{{NAME}}` `{{DESCRIPTION}}` `{{TOOLS}}` `{{HEADING}}` `{{SOURCE_LINE}}` `{{IDENTITY}}` `{{FIXED_LIST}}`（每个 ≥1 次）；`{{ZH_NAME}}` `{{DIMENSION}}` `{{OUTPUT_FORMAT}}` `{{SHARED_BLOCK}}` `{{NOT_WHEN}}` 各 0 命中。**纯度探针从数据取值**（不硬编码字符串）：拿 `heading` / `role` / `identity` 的每个非空行 / `fixedList` 每行 / `sourceLine` 去模板里搜，命中数必须为 **0**
  ④ **tools 行**：模板中含 `{{TOOLS}}` 的那一行逐字 == `tools: {{TOOLS}}`；渲染后该行逐字 == `tools: Read, Glob, Grep, Write, Edit`
  ⑤ **条目键集（10 键必须全在）**：条目的 10 个键 `name/heading/role/dimension/tools/identity/fixedList/sourceLine/outputKind/sharedBlock` **必须全部为自有键**（`dimension` / `sharedBlock` 显式写 `undefined`——spec §3 数据形状字面列出了这 10 个键）；且 `Object.keys(entry) ∩ {when, notWhen, route, fallback} === ∅`；`outputKind === 'testcase'`
  ⑥ **逐字断言（判据 f）**：node 脚本读**冻结副本**，按节/字段逐字比对 identity 两段、heading、role、9 条 fixedList、7 节正文
  ⑦ **notWhen 不进正文（W2-⑤）**：渲染卡全文检索 NOT_WHEN_TEXT —— 命中恰 **1** 次，且命中行以 `description:` 开头
- **预期**：条目 10 键齐（两键显式 `undefined`）；触发表含 when/route/notWhen；模板 = 7 槽位 + 固定散文，无 NOT_WHEN、无数据字段值；渲染卡里 notWhen 文本只出现在 description 行
- **判据**：机器，下列命令均在 `$repo` 执行，全部 exit 0：
  - (a) 键集 / 10 键全在 / 四键互斥 / fixedList 条数：
    `node --input-type=module -e "const m=await import('./tools/docgen/components/agentData.mjs');const e=m.agentData.find(a=>a.name==='senior-sdet');const want=['name','heading','role','dimension','tools','identity','fixedList','sourceLine','outputKind','sharedBlock'];const ks=Object.keys(e);const miss=want.filter(k=>!ks.includes(k));const bad=ks.filter(k=>['when','notWhen','route','fallback'].includes(k));const extra=ks.filter(k=>!want.includes(k));console.log('keys='+ks.join(',')+' missing='+JSON.stringify(miss)+' forbidden='+JSON.stringify(bad)+' extra='+JSON.stringify(extra)+' fixedList='+(e.fixedList||[]).length);process.exitCode=(miss.length||bad.length||extra.length||(e.fixedList||[]).length!==9)?1:0"`
  - (b) 槽位清单（唯一 7 种、字典序）：
    `node -e "const s=require('node:fs').readFileSync('tools/docgen/templates/agent-handwritten.md.tpl','utf8');const uniq=[...new Set([...s.matchAll(/\{\{[A-Z_]+\}\}/g)].map(x=>x[0]))].sort();const want=['{{DESCRIPTION}}','{{FIXED_LIST}}','{{HEADING}}','{{IDENTITY}}','{{NAME}}','{{SOURCE_LINE}}','{{TOOLS}}'];console.log('slots='+uniq.join(' '));process.exitCode=JSON.stringify(uniq)===JSON.stringify(want)?0:1"`
  - (c) 模板纯度（从数据取值做探针，命中必须 0）：
    `node --input-type=module -e "const fs=await import('node:fs');const m=await import('./tools/docgen/components/agentData.mjs');const e=m.agentData.find(a=>a.name==='senior-sdet');const t=fs.readFileSync('tools/docgen/templates/agent-handwritten.md.tpl','utf8');const NL=String.fromCharCode(10);const probes=[['heading',e.heading],['role',e.role],['sourceLine',e.sourceLine]].concat((e.identity||'').split(NL).map(l=>l.trim()).filter(l=>l.length>=8).map(l=>['identity-line',l])).concat((e.fixedList||[]).map((r,i)=>['fixedList['+i+']',r]));const hit=probes.filter(p=>p[1]&&t.includes(p[1]));console.log('purity-probes='+probes.length+' hits='+JSON.stringify(hit.map(p=>p[0])));process.exitCode=hit.length?1:0"`
  - (d) 模板 tools 行逐字：
    `node -e "const s=require('node:fs').readFileSync('tools/docgen/templates/agent-handwritten.md.tpl','utf8');const l=s.split(String.fromCharCode(10)).find(x=>x.startsWith('tools:'));console.log('tpl-tools='+l);process.exitCode=l==='tools: {{TOOLS}}'?0:1"`
  - (e) 渲染后 tools 行 + notWhen 只出现 1 次且在 description 行：
    `node --input-type=module -e "const m=await import('./tools/docgen/cli.mjs');const r=m.renderByName('senior-sdet');const NL=String.fromCharCode(10);const tl=r.split(NL).find(x=>x.startsWith('tools:'));const hits=r.split(NL).filter(x=>x.includes('修改业务代码、写实现方案'));console.log('tools-line='+tl);console.log('notWhen-hits='+hits.length);process.exitCode=(tl==='tools: Read, Glob, Grep, Write, Edit'&&hits.length===1&&hits[0].startsWith('description:'))?0:1"`
  - (f) **逐字（读冻结副本，按节/字段比对）**：
    `node --input-type=module -e "const fs=await import('node:fs');const m=await import('./tools/docgen/components/agentData.mjs');const e=m.agentData.find(a=>a.name==='senior-sdet');const NL=String.fromCharCode(10);const sec=(s)=>{const o={};let k='pre';o[k]=[];for(const l of s.split(NL)){const h=/^## (.+)/.exec(l);if(h){k=h[1];o[k]=[];continue}o[k].push(l)}return o};const g=fs.readFileSync(process.argv[1],'utf8');const gs=sec(g);const tpl=fs.readFileSync('tools/docgen/templates/agent-handwritten.md.tpl','utf8');const key=(p)=>Object.keys(gs).find(k=>k.startsWith(p));const body=(k)=>gs[k].join(NL).trim();const head=/^# 角色：(.+)$/m.exec(g)[1].trim();const rows=gs[key('测试设计固定清单')].filter(l=>/^\| \d+ \|/.test(l));const seven=['你负责三件事','三条铁律','输入（四样，缺一不写）','自由探索（必做）','输出格式','通用纪律','边界'];const bad=[];const desc=(/^description: (.+)/m.exec(g)||[])[1]||'';if(!desc.startsWith(e.role+'。'))bad.push('role');if(e.heading!==head)bad.push('heading');if(e.identity!==body(key('你是谁')))bad.push('identity');if(JSON.stringify(e.fixedList)!==JSON.stringify(rows))bad.push('fixedList');for(const k of seven){const b=body(k);if(!b||!tpl.includes(b))bad.push('tpl:'+k)}console.log('verbatim '+(bad.length?'FAIL '+bad.join(','):'PASS'));process.exitCode=bad.length?1:0" "$frozen"`
    （(f) 的等值口径是**去首尾空行后的逐字**；首尾空行/字节级终局由 TC-010 兜）
    （(f) 的逐字清单 = `identity` / `heading` / **`role`** / 9 条 `fixedList` / 7 节正文，与步⑥ 声明一一对应。`role` 怎样从冻结副本取：`description:` 行的**身份句段**必等于 `role + '。'`（R3 句式 `{身份句}。{when}时调用。…`），故断言 `desc.startsWith(e.role + '。')`；不另立「role 单独一张表」——身份句只在 description 里出现一次）
- **红绿证据**（判据号与命令一一对应）：红 —— 转录润色（「找出被忽视的边界」→「发现被忽视的边界」）→ **(f)** 红；`role` 改词（「资深测试开发工程师」→「资深测试工程师」）→ **(f)** 的 `role` 项红；把「三条铁律」正文塞进 agentData → **(a)** 报 extra 键 → 红；模板内联 identity 且槽位留空 → **(c)** 红（**最隐蔽的假绿：渲染字节仍正确，但数据字段成摆设，改数据不生效**）；模板写死 `tools: Read, Glob, Grep, Write, Edit` → **(d)** 红；模板加了 `{{NOT_WHEN}}` → **(b)** 红；notWhen 渲染进边界节 → **(e)** 命中 2 次 → 红；删掉 `heading` / `sourceLine` 键 → **(a)** 的 `missing` 非空 → 红。绿 = 全部 exit 0
- **对应测试**：待 plan Task N（转录断言 + 分配/纯度断言）
- **不覆盖**：description 拼装（TC-003）；渲染层逐字节（TC-010）；自评痕（TC-005）；模板 9 节结构本身（TC-006）；两套模板「无 NOT_WHEN」的模板层断言（TC-023）

### TC-003 专属 description 派生：句式拼装逐字 == **冻结副本**的 description 原文

- **覆盖**：R3 / §3 description 派生 / W2 专属 description / §6 硬约束 2
- **前置**：触发表 when / notWhen 就位；冻结副本在（TC-001a）。**冻结副本丢失时**按文件头【冻结副本】的「丢失后重建」命令重建（锚点 = `fixtures/senior-sdet.evidence.json` 的 `commit`/`blob`）
- **步骤**：① `renderByName('senior-sdet')` 取 `description:` 行；② 取冻结副本的 `description:` 行；③ 逐字 `===`
- **预期**：渲染 description 逐字 == **冻结副本**的 description（身份句 + when 逐字 + `时调用` + `Do not use for ` + NOT_WHEN_TEXT + `。`，不引入新词）；拼装形态 `{身份句}。{when}时调用。Do not use for {notWhen}。`
- **判据**：机器——
  `node --input-type=module -e "const fs=await import('node:fs');const m=await import('./tools/docgen/cli.mjs');const NL=String.fromCharCode(10);const r=m.renderByName('senior-sdet').split(NL).find(x=>x.startsWith('description:'));const g=fs.readFileSync(process.argv[1],'utf8').split(NL).find(x=>x.startsWith('description:'));console.log('render='+r);console.log('golden='+g);process.exitCode=r===g?0:1" "$frozen"`
  判据来自冻结副本（黄金值），**不拿实现拼装结果当预期**
- **红绿证据**：红 = 拼装引入错字 / 多余空格 / 漏标点 / 漏「时」→ 不等；绿 = 逐字相等
- **自比退化反例**：替换后再读 `agents/senior-sdet.md` 当黄金 = 渲染产物比渲染产物 → 永远相等 → 这条验收等于不存在
- **对应测试**：待 plan Task N
- **不覆盖**：13 席 description 句式（S1/S4）；拼装错的**归因**（TC-017）

### TC-004 notWhen 结构化 + refs 引用合法（读 `triggerTable`，含空转警报）

- **覆盖**：R4 / §6 硬约束 3 / W2 notWhen 引用合法 / S1 §6 断言 **12**
- **前置**：`agentData` 全 14 席键集可枚举（含 `reviewer-qa`）
- **步骤**：
  ① **存在性断言（先做，防空转）**：`Object.prototype.hasOwnProperty.call(triggerTable['senior-sdet'], 'notWhen')` 为 true
  ② 断言形状 == `{ text, refs }`（无多余键）
  ③ 断言 `text === NOT_WHEN_TEXT`（逐字；并现算一遍：== 冻结副本 description 里 `Do not use for ` 之后、句末 `。` 之前那段）
  ④ 断言 `refs` == `['reviewer-qa']` 且 ⊆ `agentData` 键集
  ⑤ 跑 `node tools/docgen/cli.mjs gate`，断言无 `TriggerConflict`
- **预期**：五步全过；`validateAgentData` 断言 12 遍历触发表通过
- **判据**：机器——
  `node --input-type=module -e "const m=await import('./tools/docgen/components/agentData.mjs');const t=m.triggerTable['senior-sdet'];const NL=String.fromCharCode(10);const has=!!t&&Object.prototype.hasOwnProperty.call(t,'notWhen');console.log('notWhen-present='+has);if(!has){process.exitCode=1}else{const keys=Object.keys(t.notWhen).sort().join(',');const r=t.notWhen.refs||[];const keyset=m.agentData.map(a=>a.name);const okText=t.notWhen.text==='修改业务代码、写实现方案、或只读的议会评审（那走 reviewer-qa）';const okShape=keys==='refs,text';const okRefs=(r.length===1&&r[0]==='reviewer-qa'&&keyset.includes(r[0]));console.log('shape='+keys);console.log('refs='+r.join(','));process.exitCode=(okText&&okShape&&okRefs)?0:1}"`
  另：`node tools/docgen/cli.mjs gate` 退出 0、stderr 为空
- **红绿证据**：红 = refs 指向不存在键 → 断言④ 红（并在 gate 得 `TriggerConflict` exit 1）；text 改词 → 步③ 红；notWhen 写成字符串而非 `{text, refs}` → 步② 红（`shape=undefined`）
- **空转警报**：若 notWhen **只写进 agentData 条目**、触发表里没有这个键，`validateAgentData.mjs:85` 的 `if (t && t.notWhen && Array.isArray(...))` 直接跳过 → refs 悬空也不报 → **假绿**。步① 的存在性断言是这条用例的唯一防线
- **对应测试**：待 plan Task N
- **不覆盖**：13 席 notWhen 缺省语义（S1 §4.1）；fallback 静态断言（S1 §6 断言 **13**）

### TC-005 自评痕存在（P2-遗-9，绑到条目）

- **覆盖**：R5 / §6 硬约束 4 / §7 自评痕
- **前置**：组件数据已转录
- **步骤**：① 用【自评探针】定位 `name: 'senior-sdet'` 所在行；② 断言其**前 ≤15 行**内存在一条同时含 `translation-self-check` / `详细` / `逻辑化` 的注释行；③ 人工抽查自评内容真实性（§5 项 4）
- **预期**：注释存在、两维齐全、且**写在 senior-sdet 条目头上**；缺自评 = 组件数据不合格，不进入生成/替换
- **判据**：机器——【自评探针】`tools/docgen/components/agentData.mjs`（文件参数）退出 0 且打印 `selfcheck-hits=1`（或更多）；人工——评审者看自评是否具体反映转录取舍
- **红绿证据**：红 = 注释缺失 / 两维缺一 / 注释写在别的席头上（文件级检索会过，条目级探针必红）；绿 = `entry-line=<行号>` + `selfcheck-hits>=1`
- **对应测试**：待 plan Task N
- **不覆盖**：「可测（每句有判据）」维（R5 明写 P2 内不验——仓库无该校验器）；自评内容真实性（人工，§5 项 4）

### TC-006 第二套模板 9 节结构（节名逐字）

- **覆盖**：R1 / §3 模板
- **前置**：`tools/docgen/templates/agent-handwritten.md.tpl` 已重写。现卡 9 个 `##` 节；13 席卡 8–12 节不等（spec R1），故第二套模板必须独立存在
- **步骤**：① 解析模板 `##` 级标题；② 断言 9 节齐全且顺序与现卡一致；③ 断言不含议会席专用节（`## 共享块`、`## 固定必问清单`）
- **预期**：9 节逐字 == `你是谁` / `你负责三件事` / `三条铁律` / `输入（四样，缺一不写）` / **`测试设计固定清单（每条必答，"没问题"也要写结论）`**（现卡第 40 行全称）/ `自由探索（必做）` / `输出格式` / `通用纪律` / `边界`
- **判据**：机器——node 断言脚本按**逐字全等**比较 9 个节标题（不用 `startsWith` 包含匹配），输出 `template sections: PASS`，exit 0
- **红绿证据**：红 = 缺节 / 顺序错 / 把第 5 节写成 `## 测试设计固定清单`（丢掉括号里的「每条必答，'没问题'也要写结论」）→ FAIL；绿 = 9 节逐字全等
- **为什么用逐字全等而非包含匹配**：包含匹配会让「删掉括号说明」也判过，而括号里正是 A4 判据词「每条必答」与「没问题也要写结论」——模板重写最容易丢的就是括号里的内容
- **对应测试**：待 plan Task N
- **不覆盖**：占位符语法（S1 §6 断言 2 `TemplateSyntaxError`）；13 席模板结构（S1/S4）；槽位清单与纯度（TC-002）

### TC-007 触发表归属 + H1 不混用 + 断言号归因（数据字段断言已归 TC-002，不重复）

- **覆盖**：§3 触发表段 / §6 硬约束 3、7 / S1 §6 断言 7、8、9
- **前置**：条目按 §3 就位（**施工后**状态；现行实测条目只有 `name` / `role` / `outputKind` + 派生 `tools`，见 §8 #10）
- **步骤**：
  ① **when / route 只从触发表读**：`triggerTable['senior-sdet'].when` 逐字 == spec §3 触发表段（**不含末尾「时」**）、`.route === 'senior-sdet'`
  ② **H1 与 role 不混用（§6-7）**：`heading !== role`；渲染首行逐字 == `# 角色：Senior SDET（测试设计与盲点猎手）`（若沿用议会席 `# 角色：{{ZH_NAME}}（{{DIMENSION}}）` 会渲成 `# 角色：资深测试开发工程师（Senior SDET）（）`）
  ③ **断言号归因（7 / 8 / 9）**——各用内存变异确认「哪个断言产哪个码」：
     - 断言 7（`validateAgentData.mjs:55`）：when 带尾「时」→ `WhenFormatViolation`（样本见 TC-017-A）
     - 断言 8（`validateAgentData.mjs:64`）：派生串含「时时」→ `DescriptionDerivation`（样本见 TC-017-A′）
     - 断言 9（`validateAgentData.mjs:70`）：route 不在键集 → `TriggerMissingRoute`（本用例内联样本，见判据）
- **预期**：when/route 只在触发表且 when 无尾随「时」；H1 由 `heading` 渲染；三个断言号与错误码一一对上
- **判据**：机器——
  `node --input-type=module -e "const m=await import('./tools/docgen/components/agentData.mjs');const v=await import('./tools/docgen/components/validateAgentData.mjs');const t=m.triggerTable['senior-sdet'];const e=m.agentData.find(a=>a.name==='senior-sdet');const bad={...t,route:'ghost-route'};let code9=null;try{v.validateAgentData(m.agentData,{...m.triggerTable,'senior-sdet':bad})}catch(x){code9=x.code}const NL=String.fromCharCode(10);const line1=(await import('./tools/docgen/cli.mjs')).renderByName('senior-sdet').split(NL)[6];console.log('when-tail-shi='+t.when.endsWith('时')+' route='+t.route+' heading!=role='+(e.heading!==e.role)+' code9='+code9);console.log('h1='+line1);process.exitCode=(!t.when.endsWith('时')&&t.route==='senior-sdet'&&e.heading!==e.role&&code9==='TriggerMissingRoute'&&line1==='# 角色：Senior SDET（测试设计与盲点猎手）')?0:1"`
- **红绿证据**：红 = when 带尾「时」→ TC-017-A 得 `WhenFormatViolation`；route 悬空 → 本判据 `code9` 不是 `TriggerMissingRoute`；模板借 dimension 渲 H1 → `h1` 不等于期望行；绿 = 全过
- **对应测试**：待 plan Task N
- **不覆盖**：条目键集/字段值（TC-002）；description 内容（TC-003）；四键互斥（TC-002(a)）

### TC-008 词表断言对转录字段豁免（R6，P2 内 = 恒真事实）

- **覆盖**：R6 / S1 R13 / W4
- **前置**：S1 已裁定 **P2 内没有词表实现**（description 全被句式锁定，无消费对象）
- **步骤**：① 跑 `node tools/docgen/cli.mjs gate`；② 断言退出 0 且 stderr 为空（`validateAgentData.mjs:4-17` 的错误码表里**没有**词表码，故只能这样断言）；③ **结构断言**：仓库内不存在对 transcription 字段做词表扫描的实现（TC-019）
- **预期**：gate 绿；「无词表实现」是**事实**，不是「豁免逻辑生效了」
- **判据**：机器——gate 退出 0；`stderr` 空；`stdout` 匹配 `^baseline (\d+)/\1$`（**不写死数字**：`= BASELINE_RULES.length + agentPaths().length`，当前 35）
- **红绿证据**：红 = gate 非 0 或输出出现词表族码；绿 = 0 + 无词表码。**本用例在 P2 内恒真**（R6 没有消费对象就失败不了）——它的价值是锁住事实，一旦有人引入词表实现必须同批升级（TC-019 末句）
- **对应测试**：待 plan Task N
- **不覆盖**：13 席词表约束生效面（S1 W4）；词表内容本身（S1）

### TC-009 生成：内存渲染，替换前**必然 exit 1**（预期，不是失败）

- **覆盖**：§4 步 3 生成 / S1 R3
- **前置**：组件数据就位；磁盘上仍是**旧来源行**（尚未 replace）；【草稿箱隔离】已设（`$env:DOCGEN_DRAFTS_DIR`）
- **步骤**：① `node tools/docgen/cli.mjs generate --kind agent --name senior-sdet`；② 记录 exit / stdout / stderr；③ 断言 `agents/senior-sdet.md` 未被写；④ 断言 senior-sdet 真进入比对集合
- **预期**：**exit 1**（磁盘是旧来源行 → `compareBuffers` 报 drift → `cli.mjs:71` 返回 1）；`stdout` 恰一行、匹配 `^baseline (\d+)/\1$`（`cli.mjs:70` 只打印这一行，**不打印渲染内容**）；`stderr` 为空（空则证明不是 `MissingComponentData` 的 exit 2）；磁盘文件零改动。**用途 = 「确认除来源行外无其它漂移」，精确结论归 TC-010**
- **判据**：机器——退出码 **1**；stdout 匹配 `^baseline (\d+)/\1$`；stderr 空；`git status --short agents/senior-sdet.md` 无输出
- **静默跳过警报**：`cmdGenerate` 在 `cli.mjs:65` 对「无 `triggerTable.when`」的席 `continue` —— 一旦 when 被挪走，drift 恒 0 → **exit 0**。所以「exit 1」本身就是「senior-sdet 真被比对了」的证据；再补一条显式断言：
  `node --input-type=module -e "const m=await import('./tools/docgen/components/agentData.mjs');const ok=!!(m.triggerTable['senior-sdet']&&m.triggerTable['senior-sdet'].when);console.log('in-compare-set='+ok);process.exitCode=ok?0:1"`
- **红绿证据**：红 = exit 0（被静默跳过）/ exit 2（数据缺失，不是本步语义）/ 文件被写；绿 = exit 1 + stdout 单行 + stderr 空 + 文件不变
- **对应测试**：待 plan Task N（cli 测试）
- **不覆盖**：draft 的写草稿行为（TC-011）；逐字节差异集（TC-010）

### TC-010 逐字节比对：`diffSet` 判「唯一差异 = 来源声明行」

- **覆盖**：§4 步 4 / R2 / W2 逐字节一致 / §7
- **前置**：冻结副本在（TC-001a）。**冻结副本丢失时**按文件头【冻结副本】的「丢失后重建」命令重建；`diffSet` 已落 `compare.mjs`（spec §1 影响面④）
- **步骤**：
  ① 渲染 buffer = `renderByName('senior-sdet')`（**内存取，不写盘**）
  ② 调 `diffSet(renderBuf, frozenBuf, [OLD_SOURCE_LINE, NEW_SOURCE_LINE])`
  ③ 断言 `unallowed.length === 0`（来源行属允许差异）
  ④ 断言 `raw.length === 1`、`raw[0].line === OLD_SOURCE_LINE`（`raw` 记的是**期望侧（快照）**的行内容：渲染里是 NEW、快照里是 OLD，故 `line` 必须是 OLD）、`raw[0].index === 冻结副本里该行的 0 基行号`
  ⑤ **反向归一化（必须用 node 写盘；禁 PS `>` / `Out-File` / `git show --output`）**：读冻结副本 → 把来源行（OLD）替换为 NEW → `writeFileSync` 到 `$w2\sdet-normalized.md`；同时把内存渲染按字节写到 `$w2\sdet-render.md`；两文件再做【字节比较】：

     ```powershell
     node --input-type=module -e "const fs=await import('node:fs');const u=await import('node:url');const NL=String.fromCharCode(10),BT=String.fromCharCode(96);const S=fs.readFileSync('docs/superpowers/specs/2026-10-19-docgen-agent-senior-sdet-design.md','utf8').split(NL);const OLD=S[95].slice(S[95].indexOf('：'+BT+BT)+3,-2);const NEW=S[96].slice(S[96].lastIndexOf('：'+BT)+2,-1);const rows=fs.readFileSync(process.argv[1],'utf8').split(NL);const i=rows.indexOf(OLD);if(i<0){console.error('normalize-anchor-miss OLD');process.exit(1)}rows[i]=NEW;fs.writeFileSync(process.argv[2],rows.join(NL));const cli=await import(u.pathToFileURL(process.argv[3]).href);fs.writeFileSync(process.argv[4],Buffer.from(cli.renderByName('senior-sdet'),'utf8'));console.log('normalized idx='+i+' frozen-out='+process.argv[2]+' render-out='+process.argv[4]);process.exitCode=0" "$frozen" (Join-Path $w2 'sdet-normalized.md') 'tools/docgen/cli.mjs' (Join-Path $w2 'sdet-render.md')
     ```

     然后【字节比较】`(Join-Path $w2 'sdet-normalized.md')` `(Join-Path $w2 'sdet-render.md')` → 必须 `EQUAL`、exit 0。
- **预期**：恰好一行差异且该行是来源行；归一化后全文件逐字节相等（含空行 / 标点 / 换行 / 尾换行）。**本席 description 不是允许差异**（R3 逐字复现），必须参与比对
- **判据**：机器——【diffSet 判据命令】`<root>` = `.`、`<goldenPath>` = `$frozen`、`<mode>` = `exact1`，退出 0 且打印 `diffset-mode->PASS`；步⑤ 【字节比较】输出 `EQUAL`、exit 0
- **红绿证据**：红 = 任何额外差异（润色 / 空行缺失 / 尾换行变化）→ `raw.length > 1` 或 `unallowed` 非空；`raw` 存了实际侧（NEW）→ `line === OLD` 不成立 → 红（口径写死的意义就在此）；绿 = `exact1` PASS + 归一化后 EQUAL
- **自比退化反例**：若比对对象写成 `agents/senior-sdet.md`（替换后 = 渲染产物）→ 「渲染 vs 渲染」永远 0 差异 → 恒绿
- **对应测试**：待 plan Task N（`diffSet` 单测归 TC-024）
- **不覆盖**：来源行自身内容（TC-015）；排除逻辑的判别力（TC-024）；description 逐字（TC-003）

### TC-011 落草稿：draft 进箱（临时草稿箱），agents/*.md 零改动

- **覆盖**：§4 步 6 / R7
- **前置**：TC-010 通过；`$env:DOCGEN_DRAFTS_DIR = Join-Path $w2 'drafts'`；先跑 `node tools/docgen/cli.mjs draft rm --name senior-sdet`，并断言 `node tools/docgen/cli.mjs draft ls --name senior-sdet` 无输出（**PowerShell 没有 `draft` 这条命令**，全文草稿子命令一律写全 `node tools/docgen/cli.mjs draft <子命令>`）
- **步骤**：
  ① `node tools/docgen/cli.mjs draft --kind agent --name senior-sdet`
  ② `node tools/docgen/cli.mjs draft ls --name senior-sdet` 恰 1 条、文件名匹配 `^senior-sdet--\d{8}-\d{6}\.md$`
  ③ 用 node 调 `renderByName('senior-sdet')` 按字节写 `$w2\sdet-render.md`，与草稿做【字节比较】（**「内存渲染临时文件」不存在**——`cmdGenerate` 既不写盘也不打印内容，必须自己生成）
  ④ `git status --short agents/senior-sdet.md` 无输出
  ⑤ 清理：`node tools/docgen/cli.mjs draft rm --name senior-sdet` + 断言 `node tools/docgen/cli.mjs draft ls --name senior-sdet` 为空；`Remove-Item Env:DOCGEN_DRAFTS_DIR`（**收尾必须清空**，否则 TC-012 拿不到无冲突草稿）
- **预期**：草稿写入临时草稿箱；草稿字节 == 渲染字节；`agents/senior-sdet.md` 字节不变
- **判据**：机器——`@(node tools/docgen/cli.mjs draft ls --name senior-sdet).Count -eq 1` 且该行匹配上述正则；【字节比较】草稿与 `$w2\sdet-render.md` == EQUAL；`git status --short agents/senior-sdet.md` 无输出；收尾后 `node tools/docgen/cli.mjs draft ls --name senior-sdet` 无输出
- **红绿证据**：红 = draft 改了 `agents/`、草稿字节 ≠ 渲染、或收尾后残留草稿（污染下一次 `DraftNameConflict`）；绿 = 全过
- **对应测试**：待 plan Task N（draft 测试）
- **不覆盖**：遇旧草稿的拒绝行为（S1 R4/W7）；草稿箱生命周期全量（S1 R2）

### TC-012 替换 + W2 验收：replace --yes（与**替换前草稿副本**比）+ check 全绿 + 干净口径

- **覆盖**：§4 步 7 / 步 8 / W2 逐字节一致（巩固归 TC-013、A 组归 TC-030）
- **前置**：
  - `tools/docgen/fixtures/senior-sdet.evidence.json` 已按 TC-001a 建好（**缺则 replace 报 `EvidenceInvalid` exit 2**，`cli.mjs:218-221`）
  - **`evidence.renderSha256` 必须已由 `node tools/docgen/acceptance/golden-assert.mjs senior-sdet` 回填为渲染 SHA256**，否则 replace 报 `EvidenceInvalid`。注意：`init-evidence.mjs senior-sdet` 只写 `renderSha256='pending'`，**不能**当回填入口
  - **`golden-assert.mjs` 对本席当前「双重不兼容」，回填前必须先修**（细则见 TC-001a 步⑤，此处只列结论）：
    - **修法 1｜句式分流**：`:18` 硬编码 `patternRegistry.description.parliament(...)`，须按 `agent.outputKind` 分流——`testcase` → `patternRegistry.description.handwritten(agent.role, t.when, t.notWhen?.text ?? '')`；
    - **修法 2｜整文件比较改 `diffSet`**：`:24` / `:35` 的整文件全等对本席必红（来源行按设计差异），须改用 `diffSet` 并豁免 `{OLD_SOURCE_LINE, NEW_SOURCE_LINE}`；
    - **修法前的预期**：修法 1、2 落地前，该命令退出码 1 属预期（`renderSha256` 已在 `:29` 写盘），**不得当「回填失败」**、也不得据此判 TC-012 红。两处修法属施工改动，已在 spec §1 影响面⑤ 登记
  - **若 `evidence.goldenAssertion === 'fail'`，replace 必须拒**（见判据 ④——W2-② 没通过就不能替换）。**该负例在 `cmdReplace` 补齐 `goldenAssertion` 校验之前不可执行**（当前实现只校验 `renderSha256`，`cli.mjs:218-221` + `evidence.mjs:35`），**登记为 plan 任务（§8 #16）**；在补齐之前跑它必然红，不得记作「本用例失败」，也不得据此放行「实现已正确」的结论
  - 用户已确认替换；【草稿箱隔离】已设
- **步骤**：
  ⓪ **建草稿并记录路径**（TC-011 收尾会清空草稿箱，不能复用）：
     `node tools/docgen/cli.mjs draft --kind agent --name senior-sdet`；`$draft = Join-Path $env:DOCGEN_DRAFTS_DIR (@(node tools/docgen/cli.mjs draft ls --name senior-sdet)[0])`
  ① **先把草稿复制一份**到 `$w2\sdet-draft-copy.md`（replace 成功会 `clearDrafts` 删掉草稿，`cli.mjs:268`——**替换后已无草稿可比**）
  ② `node tools/docgen/cli.mjs replace --kind agent --name senior-sdet --draft $draft --yes`
  ③ 断言退出码 0
  ④ 【字节比较】`$w2\sdet-draft-copy.md` 与 `agents/senior-sdet.md` → EQUAL
  ⑤ W2 首行：**引用 TC-010 的结论**（比对对象 = 冻结副本，不是现卡）
  ⑥ `npm run check`
  ⑦ 干净口径（【numstat 口径】）：`git status --short rules/ skills/` 无输出 **且** `git diff --numstat -- agents/senior-sdet.md` 前两列 == `1 1`、第三列 == `agents/senior-sdet.md`
- **预期**：退出码 0；文件 == 替换前草稿副本；check 0 findings；**本席 `agents/` 有且只有来源行这一行差异属预期，不是事故**（来源行必变，与 S2「字节全等」口径不同）
- **判据**：机器——replace 退出 0；步④ EQUAL；`npm run check` 退出 0；`git status --short rules/ skills/` 无输出；numstat 前两列 `1 1`；定向核 `git diff -- agents/senior-sdet.md` 的 `-` 行 == OLD_SOURCE_LINE、`+` 行 == NEW_SOURCE_LINE（逐字，含反引号）；
  附加判据（`goldenAssertion='fail'` 时）：`node tools/docgen/cli.mjs replace --kind agent --name senior-sdet --draft $draft --yes` 必须退出非 0 且 stderr 首词 ∈ `{EvidenceInvalid, Mismatch}`、`agents/senior-sdet.md` 不变。**执行状态：当前实现不会拦（见 §8 #16），该负例在 `cmdReplace` 补齐 `goldenAssertion` 校验前不可执行，登记为 plan 任务**——今天跑它必红，属「未实现」而非「用例失败」
- **红绿证据**：红 = replace 失败 / 文件 ≠ 草稿副本 / numstat 前两列 ≠ `1 1` / rules 或 skills 出现改动 / `goldenAssertion='fail'` 仍替换成功；绿 = 全过
- **自比退化反例**：W2 首行若写成「与替换后的现卡逐字节比」→ 恒绿（现卡就是渲染产物）
- **对应测试**：待 plan Task N（W2 验收脚本）
- **不覆盖**：巩固的二次 gate 与冷跑（TC-013）；replace 失败路径（TC-025 / TC-029）；「干净」指提交后状态（git 写操作由用户决定）

### TC-013 巩固：gate 绿 + 隔目录冷跑 + 崩溃恢复（复用既有脚本）+ 干净口径 + 旧生成器退役

- **覆盖**：§4 步 9 / R7 / W2 巩固
- **前置**：TC-012 通过；【草稿箱隔离】已设
- **步骤**：
  ① `node tools/docgen/cli.mjs gate` 第 1 次，断言绿
  ② **隔目录冷跑（复用既有脚本，不自己写复制逻辑）**：`node tools/docgen/acceptance/cold-run.mjs`——它把 git 跟踪文件 + extras 复制到 `mkdtemp` 临时目录，**不含 `.git`**，跑完即删；退出 0 即等价「在另一个目录里 gate 绿」
  ③ **崩溃恢复（复用既有脚本，跑在临时副本上）**：`node tools/docgen/acceptance/replace-scenarios.mjs` → 输出 `PASS 6/6`（S3 = rename 后崩溃的幂等恢复、S4 = rename 前崩溃的重跑收敛；两场景证明了 spec §4 步 7 的两条恢复路径，代表席为 `reviewer-audit`，替换实现是席无关的同一段代码 `cli.mjs:249-268`）
  ④ 核对巩固要素：gate 绿 / `npm run check` 全绿 / 干净口径（`git status --short rules/ skills/` 无输出 + numstat 前两列 `1 1`）/ **旧生成来源已退役**：`skills/parliament/scripts/gen-agents.mjs` 不存在 / 内容 = 组件渲染（人工抽查 1 处关键格）/ 草稿箱该名下已清
- **预期**：全部要素达标才置「已巩固」；`node tools/docgen/cli.mjs draft ls --name senior-sdet` 为空
- **判据**：机器——
  - `node tools/docgen/cli.mjs gate` 退出 0、stdout 匹配 `^baseline (\d+)/\1$`
  - `node tools/docgen/acceptance/cold-run.mjs` 退出 0
  - `node tools/docgen/acceptance/replace-scenarios.mjs` 退出 0 且 stdout 末行 `PASS 6/6`
  - `npm run check` 退出 0
  - `git diff --numstat -- agents/senior-sdet.md` 前两列 `1 1` + `git status --short rules/ skills/` 无输出
  - 退役断言：`node -e "const e=require('node:fs').existsSync('skills/parliament/scripts/gen-agents.mjs');console.log('gen-agents retired='+(!e));process.exitCode=e?1:0"` → `gen-agents retired=true`、exit 0
  - `node tools/docgen/cli.mjs draft ls --name senior-sdet` 无输出
  - 人工——施工者抽查 1 处关键格与组件数据一致
- **红绿证据**：红 = 任一要素 fail（冷跑 gate 红 = 本地状态掩盖漂移；退役断言红 = 旧生成器被重新引入）；绿 = 全过
- **为什么复用既有脚本**：`cold-run.mjs` / `replace-scenarios.mjs` 已实现「临时副本 + 环境变量隔离 + 跑完即删」，自写复制逻辑会引入第二份清单（与 TC-031 的 fixture 自检同理：脚本漏读一项 → 前后同时少同段 → 恒绿）
- **对应测试**：待 plan Task N（巩固判定脚本）
- **不覆盖**：冷跑复制清单完备性（脚本自身，见 §7 缺口）；队列推进顺序（PRD 6.1）；senior-sdet 专属的崩溃恢复（由 S3/S4 代表，见 §6「不测」）

### TC-014 转录润色 / 改写 → 逐字节红（零改写硬约束）

- **覆盖**：R2 / W2 逐字节一致 / §7 转录润色
- **前置**：基线绿（TC-010 `exact1` PASS）；冻结副本在。**冻结副本丢失时**按文件头【冻结副本】的「丢失后重建」命令重建
- **注入方式**：**副本仓**（做一次【副本仓】→ 在副本里改数据，真仓库零改动 → 用完即弃）
- **步骤**：
  ① 建副本仓 `$cp`；在副本里把 identity 的「你专门去把那几十种找出来」改成「你专门去把那几十种找得到」（同义改写、语义等价）：
     `node -e "const fs=require('node:fs');const p=process.argv[1]+'/tools/docgen/components/agentData.mjs';const s=fs.readFileSync(p,'utf8');const t=s.replace('你专门去把那几十种找出来','你专门去把那几十种找得到');if(t===s){console.error('注入失败：锚点未命中');process.exit(1)}fs.writeFileSync(p,t);console.log('injected: polish')" "$cp"`
  ② 对副本跑【diffSet 判据命令】`"$cp" "$frozen" fail` → 必须 `diffset-mode->PASS`（= 润色被检出为不被允许的差异）
  ③ 对副本跑 `generate`：设三个环境变量后 `node (Join-Path $cp 'tools/docgen/cli.mjs') generate --kind agent --name senior-sdet` → **退出码 1** 且 **stderr 为空**
  ④ 断言真仓库未被碰：`git status --short tools/docgen/components/agentData.mjs` 无输出
- **预期**：任何非来源行的字节差异（措辞 / 标点 / 换行）→ 红；**「语义等价即放行」不允许**（P2 本体 = 零改写转录）。**`generate` 不产 `Mismatch` 码**——它只 `drift += 1` → exit 1、stderr 空（`cli.mjs:66-71`）
- **判据**：机器——主判据：**对副本调 `diffSet`**（【diffSet 判据命令】`<root>` = `$cp`、`<goldenPath>` = `$frozen`、`<mode>` = `fail`）退出 0 且打印 `diffset-mode->PASS`；辅判据 `generate` 退出码 1 + stderr 为空 + 真仓库零改动
- **红绿证据**：红 = 润色样本被拦（`fail` 模式 PASS）；绿 = 还原后（副本丢弃、真仓库 `exact1` PASS）全绿
- **自比退化反例**：与现卡比——替换后现卡 = 渲染产物，润色后的渲染和它自己相等，「转录润色」这类最隐蔽的假绿会全部放行
- **对应测试**：待 plan Task N
- **不覆盖**：来源行本身（TC-015/016）；description 值（TC-017）

### TC-015 来源声明行未更新（旧行保留）→ 红

- **覆盖**：R2 / W2 来源声明行 / §7
- **前置**：冻结副本在；【常量自校验】已过（OLD / NEW 与 spec 第 96/97 行逐字一致）
- **注入方式**：**内存变异**（`renderAgent({agent:{...entry, sourceLine: OLD}, trigger, template, sharedBlocks, outputFormats})`，零写盘、零仓库改动）
- **步骤**：
  ① 正例：`renderByName('senior-sdet')` 全卡里与 NEW_SOURCE_LINE 逐字相等的行**恰 1 行**
  ② 负例：内存变异把 `sourceLine` 换回 OLD_SOURCE_LINE → 渲染后 NEW_SOURCE_LINE 命中 **0 行**（= 该差异必须发生）
- **预期**：红——「唯一允许差异」不等于「允许不改」；渲染卡里来源行必须恰 1 行且 == NEW_SOURCE_LINE
- **判据**：机器（NEW 从 spec 第 97 行现取，不留占位符）——
  正例：`node --input-type=module -e "const fs=await import('node:fs');const BT=String.fromCharCode(96),NL=String.fromCharCode(10);const L=fs.readFileSync('docs/superpowers/specs/2026-10-19-docgen-agent-senior-sdet-design.md','utf8').split(NL);const NEW=L[96].slice(L[96].lastIndexOf('：'+BT)+2,-1);const m=await import('./tools/docgen/cli.mjs');const hits=m.renderByName('senior-sdet').split(NL).filter(x=>x===NEW);console.log('new-source-line-hits='+hits.length);process.exitCode=hits.length===1?0:1"`
  负例：同一命令前先取内存变异卡：
  `node --input-type=module -e "const fs=await import('node:fs');const BT=String.fromCharCode(96),NL=String.fromCharCode(10);const L=fs.readFileSync('docs/superpowers/specs/2026-10-19-docgen-agent-senior-sdet-design.md','utf8').split(NL);const OLD=L[95].slice(L[95].indexOf('：'+BT+BT)+3,-2);const NEW=L[96].slice(L[96].lastIndexOf('：'+BT)+2,-1);const d=await import('./tools/docgen/components/agentData.mjs');const r=await import('./tools/docgen/components/renderAgent.mjs');const sb=await import('./tools/docgen/components/sharedBlocks.mjs');const of=await import('./tools/docgen/components/outputFormats.mjs');const e=d.agentData.find(a=>a.name==='senior-sdet');const tpl=fs.readFileSync('tools/docgen/templates/agent-handwritten.md.tpl','utf8');const card=r.renderAgent({agent:{...e,sourceLine:OLD},trigger:d.triggerTable['senior-sdet'],template:tpl,sharedBlocks:sb.sharedBlocks,outputFormats:of.outputFormats});const hits=card.split(NL).filter(x=>x===NEW).length;console.log('mutated-new-hits='+hits);process.exitCode=hits===0?0:1"`
- **红绿证据**：红 = 旧行保留被拦（`mutated-new-hits=0`，断言以「应当为 0」判定负例成立）；绿 = `new-source-line-hits=1`
- **F12 说明**：OLD_SOURCE_LINE 的**两侧反引号属原文**（`` `skills/parliament/scripts/gen-agents.mjs` ``）。少了反引号，用旧行构造的样本会与真卡不等 → 真实来源行成「额外差异」→ 假红
- **对应测试**：待 plan Task N
- **不覆盖**：新行措辞是否被「美化」（TC-002 步① 的 `sourceLine === NEW_SOURCE_LINE` 逐字断言 + 【常量自校验】）

### TC-016 来源声明行差异溢出（唯一差异条款）→ 红

- **覆盖**：R2 / W2 唯一差异 / §6 硬约束 1、10 / §7
- **前置**：基线绿；冻结副本在
- **注入方式**：**副本仓**（改副本的模板常量，真仓库零改动）
- **步骤**：
  ① 建副本仓；在副本的 `agent-handwritten.md.tpl` 里把「通用纪律」的一条后面加一句（正文另改一处）：
     `node -e "const fs=require('node:fs');const p=process.argv[1]+'/tools/docgen/templates/agent-handwritten.md.tpl';const s=fs.readFileSync(p,'utf8');const a='- 证据可复算：引用文件:行号、命令输出或 spec 节号，禁止凭印象断言。';const t=s.replace(a,a+'（本句为注入样本）');if(t===s){console.error('注入失败：锚点未命中');process.exit(1)}fs.writeFileSync(p,t);console.log('injected: extra-diff')" "$cp"`
  ② 对副本跑【diffSet 判据命令】`"$cp" "$frozen" overflow1` → 必须 `diffset-mode->PASS`（`unallowed.length === 1` 且 `raw.length === 2`）
  ③ 断言 `unallowed[0].line` 是**快照侧**的原始句子（含「证据可复算」，且不含「注入样本」）——证明 `raw`/`unallowed` 记的是期望侧
- **预期**：差异集 ≠ {来源行} → 红；「唯一允许差异」是硬边界
- **判据**：机器——**对副本调 `diffSet`**（【diffSet 判据命令】`<root>` = `$cp`、`<mode>` = `overflow1`）退出 0，输出 `unallowed=1 raw=2`、`idx=<正文行号> line="…证据可复算…"`；真仓库零改动（`git status --short tools/docgen/templates/agent-handwritten.md.tpl` 无输出）
- **红绿证据**：红 = 两处差异被拦（`overflow1` 成立）；绿 = 仅一处差异（TC-010 `exact1`）
- **对应测试**：待 plan Task N
- **不覆盖**：排除逻辑本身的判别力（TC-024）

### TC-017 专属 description 拼装错 → 三道防线各管一类（样本 A / A′ / B）

- **覆盖**：R3 / W2 专属 description / S1 §6 断言 7、8 / §7 拼装错
- **前置**：冻结副本 description 行已知；三个污染样本在**内存**构造（不碰仓库）
- **步骤与预期（逐样本分开，不得混写）**：
  - **样本 A（when 带尾「时」）**：`when` 保留现 description 里的「…失败场景时」，句式再补「时调用」→ 派生「时时调用」。
    **期望：只抛 `WhenFormatViolation`**。原因是断言 7（`validateAgentData.mjs:55`）先于断言 8 抛出，**断言 8 根本不会被求值**——所以「期望同时得到两个码」是错的（这一点是本次修订的判别力修正）
  - **样本 A′（when 无尾「时」，但派生串内部出现相邻「时时」）**：`when` 不改尾字，但把两个子句粘在一起漏了分隔（如「…找出被忽视的边界时」「时评审测试策略」拼成「…找出被忽视的边界时时评审测试策略」）→ 断言 7 通过（无尾「时」、无「时调用」子串），**断言 8 命中**。
    **期望：只抛 `DescriptionDerivation`**——这是断言 8 的唯一可达入口
  - **样本 B（notWhen 换词）**：`notWhen.text` 把「那走 reviewer-qa」改成「由 reviewer-qa 负责」，其余不动 → 派生串自洽（无「时时」）。
    **期望：`validateAgentData` 放行**，**只有黄金比对（vs 冻结副本）能拦**
- **判据**：机器——
  - 样本 A：`.code === 'WhenFormatViolation'`（**只此一个**）
  - 样本 A′：`.code === 'DescriptionDerivation'`（**只此一个**）
  - 样本 B：`validateAgentData` 不抛；`renderAgent` 渲染出的 `description:` 行 ≠ 冻结副本的 `description:` 行
  三条命令（内存变异 + 直调）：
  `node --input-type=module -e "const d=await import('./tools/docgen/components/agentData.mjs');const v=await import('./tools/docgen/components/validateAgentData.mjs');const t=d.triggerTable['senior-sdet'];const run=(label,tbl)=>{let code='NO-THROW';try{v.validateAgentData(d.agentData,{...d.triggerTable,'senior-sdet':tbl})}catch(x){code=x.code}console.log(label+'='+code);return code};const A={...t,when:t.when+'时'};const A2={...t,when:'当需要为 PRD/spec 设计并编写测试用例、评审测试策略、或专门找出被忽视的边界时时评审测试策略'};const B={...t,notWhen:{text:'修改业务代码、写实现方案、或由 reviewer-qa 负责',refs:['reviewer-qa']}};const a=run('A',A),a2=run('A2',A2),b=run('B',B);process.exitCode=(a==='WhenFormatViolation'&&a2==='DescriptionDerivation'&&b==='NO-THROW')?0:1"`
  样本 B 的黄金比对：用【diffSet 判据命令】的取常量片段把渲染卡 `description:` 行与冻结副本该行逐字比，必须 **不等**
- **红绿证据**：红 = 任一样本走到错误的防线（A 得 DescriptionDerivation、A′ 得 WhenFormatViolation、B 被断言 8 拦）；绿 = 三个样本各走各的防线 + 正确拼装（when 无尾「时」、notWhen 逐字）时三防线都过
- **判别力说明**：断言 7 命中即抛，**断言 8 不可达**——旧版「A 同时期望两个码」在实现上永远拿不到第二个码，属**不可达断言**（本次修订拆成 A / A′ 就是为了让两条防线各自可被独立触发）
- **对应测试**：待 plan Task N
- **不覆盖**：13 席句式；词表；when 格式约束的完整语义（S1 §6 断言 7，见 TC-007 步③）

### TC-018 notWhen.refs 悬空 → `TriggerConflict`（exit 1）

- **覆盖**：R4 / S1 §6 断言 **12** / §7 notWhen
- **前置**：无（不构造仓库文件）
- **注入方式**：**内存变异**（把 `notWhen.refs` 换成 `['reviewer-qa-typo']` 后直调 `validateAgentData`）
- **步骤**：① 变异**触发表**（不是条目——条目上注入会被断言 12 跳过而假绿）；② 调 `validateAgentData(agentData, {...triggerTable, 'senior-sdet': mutated})`；③ 记录 `.code` 与退出档
- **预期**：`.code === 'TriggerConflict'`；`exitCodeFor('TriggerConflict') === 1`
- **判据**：机器——
  `node --input-type=module -e "const d=await import('./tools/docgen/components/agentData.mjs');const v=await import('./tools/docgen/components/validateAgentData.mjs');const t=d.triggerTable['senior-sdet'];const bad={...t,notWhen:{...t.notWhen,refs:['reviewer-qa-typo']}};let code=null;try{v.validateAgentData(d.agentData,{...d.triggerTable,'senior-sdet':bad})}catch(x){code=x.code}console.log('code='+code+' exit='+(code?v.exitCodeFor(code):'n/a'));process.exitCode=(code==='TriggerConflict'&&v.exitCodeFor(code)===1)?0:1"`
- **gate 路径同口径**：`collectGate()` 首行就是 `validateAgentData`（`cli.mjs:77`），故 go 该样本在 gate 里同样得到 `TriggerConflict` / exit 1；`Mismatch` 只属于 gate 的整缓冲比对（TC-027），**不属本用例**
- **红绿证据**：红 = 悬空 refs 被拦（`code=TriggerConflict`）；绿 = 合法 refs（TC-004）PASS
- **对应测试**：待 plan Task N
- **不覆盖**：fallback 静态断言（S1 §6 断言 **13**）；route 悬空（S1 §6 断言 9，见 TC-007 步③）

### TC-019 结构断言：词表机制在 P2 内缺席（去注释 / 去字符串字面量后扫描）

- **覆盖**：R6 / S1 R13
- **前置**：S1 已裁定 P2 内无词表实现；本用例不构造「污染实现」（构造不出来）
- **步骤**：
  ① 扫 `tools/docgen/**/*.mjs`：**先去注释、去字符串/模板字面量**，再匹配 `词表|lexicon|wordlist|blacklist|成语|模糊词`
  ② 命中 0 → 打印 `wordlist-impl=absent` 且 exit 0
  ③ 结论：R6 的「豁免」在 P2 内是**恒真事实**（没有消费对象）
- **预期**：0 命中；「豁免」不需要实现，也不会失败
- **判据**：机器——
  `node --input-type=module -e "const fs=await import('node:fs');const path=await import('node:path');const Q=String.fromCharCode(34),SQ=String.fromCharCode(39),BT=String.fromCharCode(96),NL=String.fromCharCode(10);const strip=(s)=>{let o='',i=0,n=s.length;while(i<n){const c=s[i],d=s[i+1];if(c==='/'&&d==='/'){while(i<n&&s[i]!==NL)i++;continue}if(c==='/'&&d==='*'){i+=2;while(i<n&&!(s[i]==='*'&&s[i+1]==='/'))i++;i+=2;continue}if(c===SQ||c===Q||c===BT){const q=c;i++;while(i<n){if(s[i]==='\\'){i+=2;continue}if(s[i]===q){i++;break}i++}continue}o+=c;i++}return o};const RE=/词表|lexicon|wordlist|blacklist|成语|模糊词/;const hits=[];const walk=(dir)=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.mjs')&&RE.test(strip(fs.readFileSync(p,'utf8'))))hits.push(p)}};walk('tools/docgen');console.log(hits.length?'wordlist-impl=present '+hits.join(','):'wordlist-impl=absent');process.exitCode=hits.length?1:0"`
- **红绿证据**：红 = 出现词表扫描实现（说明有人扩了作用域，此时 R6 措辞与本用例必须同批升级）；绿 = 0 命中并打印 `wordlist-impl=absent`
- **假阳性账（必写）**：**注释或字符串里提到「词表」必须仍绿**——例如调研记录写「本席不适用词表」、错误消息写「词表未实现」。这就是为什么必须先 `strip()` 再匹配；不做剥离的版本会把文档性提及判成实现，逼人删注释（把有用信息删掉换绿）
- **升级条件（必写）**：一旦将来引入词表实现，本用例**必须升级为真负例**——构造「词表误套转录字段（identity 里的『找出来』/ fixedList 里的『判别力』）」→ **必须判红**
- **对应测试**：待 plan Task N
- **不覆盖**：13 席派生产出的词表约束（S1 W4 生效面）

### TC-020 自评痕缺失 → 组件数据不合格（验收打回）

- **覆盖**：R5 / §6 硬约束 4
- **前置**：TC-005 绿（真文件里存在自评注释）
- **注入方式**：**单文件副本**（复制 `agentData.mjs` 到 `$w2`，删掉注释行；真仓库零改动）
- **步骤**：
  ① `Copy-Item tools/docgen/components/agentData.mjs (Join-Path $w2 'agentData-no-selfcheck.mjs')`
  ② 在副本里删除含 `translation-self-check` 的整行：`node -e "const fs=require('node:fs');const p=process.argv[1];const NL=String.fromCharCode(10);const L=fs.readFileSync(p,'utf8').split(NL);const out=L.filter(l=>l.indexOf('translation-self-check')<0);if(out.length===L.length){console.error('注入失败：锚点未命中');process.exit(1)}fs.writeFileSync(p,out.join(NL));console.log('injected: no-selfcheck')" (Join-Path $w2 'agentData-no-selfcheck.mjs')`
  ③ 对副本跑【自评探针】→ 必须 `selfcheck-hits=0`（exit 1）
  ④ 判不合格：该席状态不得置「已巩固」，不得进入生成/替换
- **预期**：缺自评 = 组件数据不合格（§6-4）→ 验收打回；不得以「没写自评」状态被巩固
- **判据**：机器——【自评探针】对副本 exit 1 且 `selfcheck-hits=0`；对**真文件** exit 0（TC-005）——两者对照即证明探针有区分度；真仓库 `git status --short tools/docgen/components/agentData.mjs` 无输出
- **红绿证据**：红 = 缺失被查（探针 0 命中 → 打回）；绿 = 真文件恢复存在（TC-005）
- **对应测试**：待 plan Task N
- **不覆盖**：自评内容质量（人工，§5 项 4）；「可测」维（R5 明写 P2 内不验）

### TC-021 identity 转录截断（第二段丢失）→ diffSet 红

- **覆盖**：§3 identity / W2 逐字节一致
- **前置**：冻结副本在（丢失时按文件头【冻结副本】的「丢失后重建」命令重建）
- **注入方式**：**副本仓**（删副本数据的第二段，真仓库零改动）
- **步骤**：
  ① 建副本仓；在副本里删掉 identity 的第二段（「你的名声来自两件事…」整段）：
     `node -e "const fs=require('node:fs');const p=process.argv[1]+'/tools/docgen/components/agentData.mjs';const s=fs.readFileSync(p,'utf8');const NL=String.fromCharCode(10);const L=s.split(NL);const i=L.findIndex(l=>l.indexOf('你的名声来自两件事')>=0);if(i<0){console.error('注入失败：锚点未命中');process.exit(1)}const out=L.filter((_,j)=>j!==i);fs.writeFileSync(p,out.join(NL));console.log('injected: truncated-identity at line '+(i+1))" "$cp"`
  ② 对副本跑【diffSet 判据命令】`"$cp" "$frozen" truncated` → 必须 `diffset-mode->PASS`（`unallowed[0].line` 含「你的名声」= 差异落在期望侧第二段）
- **预期**：红——identity 必须含完整两段（含段间空行）
- **判据**：机器——**对副本调 `diffSet`**（【diffSet 判据命令】`<root>` = `$cp`、`<mode>` = `truncated`）退出 0，输出 `unallowed>=1`，首个不被允许的条目 `line` 含「你的名声」；真仓库零改动
- **红绿证据**：红 = 截断被拦；绿 = 完整两段（TC-002 (f) PASS）
- **对应测试**：待 plan Task N
- **不覆盖**：fixedList 截断（同机制，TC-002 的 `length === 9` + (f) 逐字兜底）

### TC-022 模板缺节（缺「边界」节）→ diffSet 红 / 槽位残留

- **覆盖**：R1 / §3 模板 9 节
- **前置**：TC-006 绿
- **注入方式**：**副本仓**（删副本模板的末节，真仓库零改动）
- **步骤**：
  ① 建副本仓；删掉副本模板里 `## 边界` 及其后全部正文：
     `node -e "const fs=require('node:fs');const p=process.argv[1]+'/tools/docgen/templates/agent-handwritten.md.tpl';const s=fs.readFileSync(p,'utf8');const i=s.indexOf('## 边界');if(i<0){console.error('注入失败：锚点未命中');process.exit(1)}fs.writeFileSync(p,s.slice(0,i));console.log('injected: missing-boundary-section')" "$cp"`
  ② 对副本跑【diffSet 判据命令】`"$cp" "$frozen" fail` → 必须 `diffset-mode->PASS`（渲染缺块）
  ③ 另查副本渲染结果里是否残留 `{{[A-Z_]+}}`（通用正则，不枚举槽位名）
- **预期**：红——缺节 → 渲染缺块 → diffSet 必红；若模板被改成「只剩槽位没正文」，渲染会出现未消费槽位残留
- **判据**：机器——`fail` 模式 PASS；残留检查
  `node --input-type=module -e "const u=await import('node:url');const cli=await import(u.pathToFileURL(process.argv[1]+'/tools/docgen/cli.mjs').href);const r=cli.renderByName('senior-sdet');const m=[...r.matchAll(/\{\{[A-Z_]+\}\}/g)].map(x=>x[0]);console.log('residue='+JSON.stringify(m));process.exitCode=(m.length===0)?0:1" "$cp"`
- **红绿证据**：红 = 缺节被拦；绿 = 9 节齐全（TC-006）
- **对应测试**：待 plan Task N
- **不覆盖**：占位符未闭合（S1 §6 断言 2 `TemplateSyntaxError`）；空行布局差异（§7 缺口）

### TC-023 两套模板均**无** `{{NOT_WHEN}}` 槽位

- **覆盖**：R4 / §6 硬约束 5、9 / W2 notWhen 不进正文
- **前置**：`tools/docgen/templates/agent.md.tpl`（议会席）与 `agent-handwritten.md.tpl`（手写卡）均在位
- **步骤**：① 两套模板各检索 `{{NOT_WHEN}}`；② 两套模板各检索裸标识符 `notWhen`
- **预期**：**两套都必须 0 命中**（R4：notWhen 只参与 description 派生，不进正文）
- **判据**：机器——
  `@(Select-String -Path tools/docgen/templates/agent.md.tpl -Pattern '{{NOT_WHEN}}' -SimpleMatch).Count -eq 0`；
  `@(Select-String -Path tools/docgen/templates/agent-handwritten.md.tpl -Pattern '{{NOT_WHEN}}' -SimpleMatch).Count -eq 0`；
  两条裸 `notWhen` 检索同样 0
- **红绿证据**：红（负例方向）——谁加了槽位就红。**为什么必须模板层断言**：若加了 `{{NOT_WHEN}}` 而 notWhen 数据为空，`renderAgent.mjs:4` 的 `fill` 会把整行删掉，渲染看起来完全正常 → 渲染层永远发现不了这个死槽位；一旦将来数据非空，卡面就多一行 → W2 红但归因困难
- **F6 说明**：裸 `notWhen` 与槽位字面量 `{{NOT_WHEN}}` **大小写不同**，只查一处必然假绿/假红——必须用精确字面量 + `-SimpleMatch`（`{` `}` 在正则里语义特殊）
- **对应测试**：待 plan Task N
- **不覆盖**：13 席渲染字节（TC-031）；13 席 notWhen 缺省语义（S1 §4.1）

### TC-024 `diffSet` 本体判别力：三种实现对照（内容匹配 vs 行号跳过 vs `>` 前缀跳过）

- **覆盖**：R2 / §6 硬约束 10 / W2 逐字节一致 / §7 排除逻辑判别力
- **前置**：不依赖真卡、不跑 CLI、不改仓库。测试对象 = `compare.mjs` 的 `diffSet`（【diffSet 口径】）
- **步骤**（直接喂合成 buffer 对，落在 `tools/docgen/test/diffset.test.mjs`）：
  - **实现三份**：`content-match`（import 真实现）、`index-skip`（变异体：把 **index 8** 无条件当「来源行」跳过，不比较内容）、`prefix-skip`（变异体：凡是 `line` 以 `>` 开头的条目一律不放进 `unallowed`）。两个变异体是测试文件内的局部函数，**不改产品代码**
  - **样本 A（行号偏移 → 按行号跳过必漏检）**：两侧行数相同；`index 8`（第 9 行）是正文 `正文 A`，实际侧为 `正文 A 改`；来源行在 `index 9`（第 10 行，实际侧 NEW / 期望侧 OLD）。期望：`content-match` 的 `unallowed` 含 `index 8`
  - **样本 B（`>` 前缀跳过必漏检）**：两侧含**两行**以 `>` 开头——`index 2` 是 `> 说明：本卡由手写维护`（实际侧改成 `> 说明：本卡由 docgen 维护`）与 `index 9` 来源行。期望：`content-match` 的 `unallowed` 含 `index 2`
- **预期**：
  - 样本 A：`content-match` → `unallowed=[8]`（PASS）；`index-skip` → `unallowed=[]`（**漏检**，用例判其 FAIL）；`prefix-skip` → `unallowed=[8]`（PASS，本样本不针对它）
  - 样本 B：`content-match` → `unallowed=[2]`（PASS）；`prefix-skip` → `unallowed=[]`（**漏检**，判其 FAIL）；`index-skip` → `unallowed=[2]`（PASS）
- **判据**：机器（单测）——`node --test tools/docgen/test/diffset.test.mjs` 退出 0，且输出 `content-match=PASS index-skip=FAIL prefix-skip=FAIL`。测试内的断言形态：每对「样本 × 实现」都写死期望（PASS / FAIL），三者全对才过
- **红绿证据**：红 = 两个变异体被同一组断言放行（用例无区分度）；绿 = `content-match` 两样本都检出、两个变异体各自在对应样本上漏检
- **上一版为什么恒绿**：旧样本改的是「来源行**之后**的正文」，对「按行号跳过 index 8」和「按 `>` 前缀跳过」两种缺陷实现，被改的那行都照常被检出 → 永远 PASS。修法 = 让被改的行**正好落在缺陷实现的跳过条件上**（A 落在 index 8、B 落在 `>` 行）
- **对应测试**：待 plan Task N（与实现同批：`diffSet` 落 `compare.mjs` 时同批落这个测试）
- **不覆盖**：来源行内容本身（TC-015/016）；CLI 端到端（TC-009/010）

### TC-025 替换前 gate 红（与目标无关漂移）→ 拒绝替换，草稿保留

- **覆盖**：§4 步 7 / S1 §5.3 拒红过滤
- **前置**：`evidence.renderSha256` 已由 `golden-assert.mjs` 回填、草稿在箱（先建草稿）
- **注入方式**：**真仓库 + 备份/注入/还原**（`baseline.json` 是 gate 的独立输入，副本里改它拿不到 `collectGate` 的同一状态，故选备份还原法）
- **步骤**：
  ① 建草稿：`node tools/docgen/cli.mjs draft --kind agent --name senior-sdet`；`$draft = Join-Path $env:DOCGEN_DRAFTS_DIR (@(node tools/docgen/cli.mjs draft ls --name senior-sdet)[0])`
  ② 备份：`Copy-Item tools/docgen/baseline.json (Join-Path $w2 'baseline.bak.json')`；记 `(Get-FileHash tools/docgen/baseline.json -Algorithm SHA256).Hash` → `$h0`
  ③ 注入：给 `baseline.json` 末尾追加一个字节（`node -e` 以 `'utf8'` 追加，**不用 PS `>>`**）
  ④ `node tools/docgen/cli.mjs replace --kind agent --name senior-sdet --draft $draft --yes`
  ⑤ 断言拒绝 + 草稿仍在 + 卡未变
  ⑥ **还原**：`Copy-Item (Join-Path $w2 'baseline.bak.json') tools/docgen/baseline.json -Force`，断言哈希 == `$h0`
  ⑦ **复跑确认绿**：`node tools/docgen/cli.mjs gate` 退出 0
- **预期**：拒绝；`BaselineDrift`（exit 2）；草稿保留；`agents/senior-sdet.md` 不变
- **判据**：机器——replace **退出码 2** 且 **stderr 首词 == `BaselineDrift`**（CLI 只打印 `code: message (name)`，**不含 path**——不得断言 stderr 含 `baseline.json`）；`git status --short agents/senior-sdet.md` 无输出；`node tools/docgen/cli.mjs draft ls --name senior-sdet` 仍 1 条；还原后哈希 == `$h0` 且 gate 退出 0
- **红绿证据**：红 = 无关漂移被拒（exit 2 + 首词 `BaselineDrift`）；绿 = 还原后 gate 绿（二次确认「拒绝确实由该漂移引起」，而不是别的原因）
- **对应测试**：待 plan Task N
- **不覆盖**：目标对象自身预期差异放行（S1 R6；正常路径 TC-012）；拒红过滤实现（S1 §5.3）

### TC-026 步 4 停损回退（修 2 次仍不等）→ 停损未迁，现产物不动

- **覆盖**：§4 失败回退 / R7
- **前置与时机**：**必须在 TC-012 替换之前执行**（停损态要求现产物仍是旧卡）；若已替换，本用例不可复跑（停损态已消失），改由 TC-028 的「未巩固」判定兜
- **注入方式**：**副本仓**（两次「修复尝试」= 两次不同的缺陷注入，全部落在副本；真仓库与现产物零改动 → 不需要「还原」步骤，副本丢弃即还原）
- **步骤**：
  ① 建副本仓；注入缺陷 1（模板槽位拼装顺序错）→ 对副本跑【diffSet 判据命令】`fail` → 必须 PASS（判红）
  ② 用**新副本**注入缺陷 2（§3.1 误分配：把固定清单表头挪进数据）→ 再跑 `fail` → 必须 PASS（仍红）
  ③ 停止：不再做第 3 次尝试；在**迁移状态账本**把该席标「停损未迁」，并写复盘（含 2 次尝试）。**账本落点 = PRD §6.6「迁移状态账本」那张表（`docs/prd/docgen-agent-generation.md` §6.6，状态口径 `未入队 / 迁移中 / 已巩固 / 停损未迁`），不是 `tools/docgen/state.json`**——`state.mjs:9` 的 `VALUES` 只接受 `replaced` / `suspended`，写 `停损未迁` 会直接 `StateFileInvalid`
  ④ 断言现产物没被「改到通过」：副本的 `agents/senior-sdet.md` 与冻结副本【字节比较】== EQUAL；真仓库 `git diff --numstat -- agents/senior-sdet.md` **无输出**
- **预期**：全程只改组件/模板（且只在副本里）；**现产物不动**；2 次仍不等 → 停止、写复盘、标「停损未迁」、队列停在该对象
- **判据**——
  - **机器**（可自动判）：两次 `diffset-mode->PASS`（都判红）；副本卡 vs 冻结副本 `EQUAL`；真仓 numstat **无输出**（停损态口径，**与 TC-012/013/028 的 `1 1` 不同**）
  - **人工**（谁看、看什么）：评审者打开 PRD §6.6 迁移状态账本表，看 `senior-sdet` 行状态列 = `停损未迁`，且复盘指针在案（复盘含 2 次尝试）。**该项不设机器判据**：账本在 PRD 表格里，`state.json` 不接受该值（见步③），机器无从断言——不要把它写成「机器」再判绿
- **红绿证据**：红 = 停损前现产物被改（违规迁就模板）→ numstat 非空或副本卡 ≠ 冻结副本；绿 = 现产物未动 + 账本在案
- **对应测试**：待 plan Task N（停损流程守卫）
- **不覆盖**：停损后 registered 态守卫（S1 §8.6）；「带未迁收口 ≤ 3」账目（PRD §8）

### TC-027 EOL / 尾换行 / BOM / 非法 UTF-8 边界 → 两处落点分别判（五个 violation 全覆盖）

- **覆盖**：PRD §5 通用前置（`checkEnvironment`）/ W2 逐字节一致
- **前置**：基线绿；senior-sdet 已 `replaced`（gate 只对 `state = replaced` 的席逐字节比对，`cli.mjs:98`）
- **步骤**：
  ① **单测直调** `checkEnvironment(buf, 'target', 'agents/senior-sdet.md')`，五个样本各只含**一种**违规：
     - A 行尾 CRLF（→ 命中 `CR`；先于后续检查）
     - B 去尾换行（→ `NO_TRAILING_NEWLINE`）
     - C 头部 BOM `EF BB BF`（→ `BOM`）
     - D 含非法 UTF-8 字节（→ `INVALID_UTF8`）
     - E 尾部多一个 `\n`（即结尾 `\n\n`，→ **`TRAILING_NEWLINE`**）
  ② **端到端**：把任一样本贴到 `agents/senior-sdet.md`（**改完还原**）跑 `node tools/docgen/cli.mjs gate`
- **预期**：
  ① 五个样本各抛 `EnvironmentEOL`，`violation` 分别为 `CR` / `NO_TRAILING_NEWLINE` / `BOM` / `INVALID_UTF8` / `TRAILING_NEWLINE`（`compare.mjs:100-116` 五处 `error()`）
  ② 端到端**只会得 `Mismatch`**（exit 1）——`cli.mjs:59-68` 的 agent 分支只 `compareBuffers`，`cli.mjs:85-91` 的 `checkEnvironment` 只对 `BASELINE_RULES` 跑。**不得要求 gate 对 agent 给 `EnvironmentEOL`**
- **判据**：机器——① 单测断言 `.code === 'EnvironmentEOL'` 且 `violation` 逐样本匹配（5/5）；② gate 退出码非 0，`.code ∈ {Mismatch}` 即算拦下（接受 `Mismatch`）；③ 还原后 `git status --short agents/senior-sdet.md` 无输出、gate 退出 0
- **红绿证据**：红 = 任一污染样本没被对应落点拦下（尤其 `TRAILING_NEWLINE`：只测「缺尾换行」会漏掉「多尾换行」）；绿 = 五样本各命中 + 端到端非 0 + 还原后转绿
- **对应测试**：待 plan Task N
- **不覆盖**：`checkEnvironment` 全量行为（S1/P1 V8 等价迁移）；BOM 的仓库级守卫（`scripts/check-all.mjs:220-233` 已独立兜 .md 的 BOM）

### TC-028 巩固判据缺一 → 未巩固（含统一干净口径）

- **覆盖**：§4 步 9 / W2 巩固 / `git status` 口径
- **前置**：替换完成、基线绿；【草稿箱隔离】已设
- **注入方式**：**真仓库 + 改完即还原**（三种情形都要污染真实 gate 输入）；每情形还原后复跑确认转绿
- **步骤**：
  ① 情形 a：gate 第 2 次漂移——篡改 `agents/senior-sdet.md` 一个字节（改完还原，用【字节比较】确认还原到位）
  ② 情形 b：草稿箱残留一条 senior-sdet 草稿（`node tools/docgen/cli.mjs draft --kind agent --name senior-sdet` 造一条，判完 `node tools/docgen/cli.mjs draft rm --name senior-sdet`）
  ③ 情形 c：`rules/` 或 `skills/` 出现未预期改动（改完还原）
  ④ 情形 d：`npm run check` 有 findings（可在副本或临时改动上造，判完还原）
  ⑤ 各情形跑巩固判定
- **预期**：任一判据缺 → 未巩固；不得推进队列
- **判据**：机器——各情形判定脚本输出 `consolidated: false`；仅全部满足时 `consolidated: true`（TC-013）。**干净口径**：`git status --short rules/ skills/` 无输出 **且** `git diff --numstat -- agents/senior-sdet.md` 前两列 == `1 1`；**本席 agents/ 有且只有这一行差异属预期**。每情形还原后复跑：`gate` 退出 0 + `consolidated: true`
- **红绿证据**：红 = 缺一被判未巩固；绿 = 全满足才 consolidated
- **对应测试**：待 plan Task N（巩固判定脚本）
- **不覆盖**：队列推进顺序（PRD 6.1）

### TC-029 replace 缺 `--yes` → `NotAuthorized`（exit 4）

- **覆盖**：§4 步 7 / S1 §5.2 / S1 §7 exit 4
- **前置**：草稿在箱（**先建草稿**：`node tools/docgen/cli.mjs draft --kind agent --name senior-sdet`；本步在 `cmdReplace` 读 evidence 之前就抛，故不需要 evidence）
- **注入方式**：无注入（只少传一个参数）
- **步骤**：① 建草稿并记 `$draft`；② `node tools/docgen/cli.mjs replace --kind agent --name senior-sdet --draft $draft`（**无 `--yes`**）
- **预期**：`NotAuthorized`，退出码 4；`agents/senior-sdet.md` 不变；草稿保留
- **判据**：机器——退出码 4；stderr 首词 `NotAuthorized`；`git status --short agents/senior-sdet.md` 无输出；`node tools/docgen/cli.mjs draft ls --name senior-sdet` 仍 1 条；收尾 `node tools/docgen/cli.mjs draft rm --name senior-sdet`
- **红绿证据**：红 = 无 `--yes` 仍替换（静默替换违规）→ 文件被改；绿 = 拒 + exit 4 + 草稿仍在
- **对应测试**：待 plan Task N
- **不覆盖**：有 `--yes` 的成功路径（TC-012）；草稿纪律全量（S1 W7）

### TC-030 替换后 A 组结构项不回归（A3–A7 全绿，真卡路径）

- **覆盖**：§5「A 组结构项不回归」/ §7 / 线 E `criteria.md` §1 A3–A7 / §6 硬约束 7（H1 由 heading 渲染后 A6/A7 节名仍在）
- **前置**：
  - TC-012 替换完成：`agents/senior-sdet.md` = 渲染产物；**替换后卡另存一份** `$w2\sdet-after.md`（N1–N5 的还原基准）
  - `tools/execution-matrix/check-agent.mjs` 与 `criteria.md` 在位
  - `state.json` **不是**必要条件（`checkAgentFile` 只读 `agents/<name>.md`，不读 state）
  - 判据边界：`checkAgentFile('senior-sdet').ok` **不可直接当判据**——`checkSemantic` 对缺键按 `pending` 判红（`check-agent.mjs:145-159`），而 `rules/.inspector-annotations.json` 当前只有 reviewer-audit 的键，故 `ok` 必为 false
- **步骤**：
  ① 走**真卡路径** `checkAgentFile('senior-sdet')`（`check-agent.mjs:175-189` 直接读 `agents/<name>.md`）
  ② **先排除假绿**：断言 `findings` **不含** `CardNotFound` 与 `InvalidAnnotation` 两个假绿码；`A1/A2/B1–C4` 的 `pending` 码**允许存在、不参与判定**（`struct-red` 只数 `A3–A7`）
  ③ 再过滤 `code ∈ {A3,A4,A5,A6,A7}`，断言红数为 0
  ④ **槽位残留（通用正则，不枚举）**：`agents/senior-sdet.md` 中 `{{[A-Z_]+}}` 0 命中
  ⑤ 逐项核对判定对象（`criteria.md:47-89`）：A3 任一真实表格表头含「必答」/「必问」（围栏内示例表不算）；A4 含「只答固定清单 = 不合格」；A5 含「证据可复算」；A6 存在 `## 边界`；A7 存在 `## 输出格式`
- **预期**：`struct-red=0`；无 `CardNotFound`/`InvalidAnnotation`；卡内无槽位残留；A4/A5 命中位置符合「节内优先、整卡兜底」（notes 可见）
- **判据**：机器——在 `$repo` 下执行：
  `node --input-type=module -e "const m=await import('./tools/execution-matrix/check-agent.mjs');const r=m.checkAgentFile('senior-sdet');const codes=r.findings.map(f=>f.code);const bad=codes.filter(c=>['CardNotFound','InvalidAnnotation'].includes(c));const s=codes.filter(c=>['A3','A4','A5','A6','A7'].includes(c));console.log('codes='+JSON.stringify(codes));console.log('fake-green='+JSON.stringify(bad));console.log('struct-red='+s.length);process.exitCode=(bad.length||s.length)?1:0"`
  槽位残留：
  `node -e "const s=require('node:fs').readFileSync('agents/senior-sdet.md','utf8');const m=[...s.matchAll(/\{\{[A-Z_]+\}\}/g)].map(x=>x[0]);console.log('residue='+JSON.stringify(m));process.exitCode=m.length?1:0"`
- **负例方向（N1–N5，每条都写成「改卡 → 跑命令 → **还原卡** → 复跑确认绿」；还原 = 用 `$w2\sdet-after.md` 覆写回卡）**：
  - N1 模板重写删掉「只答固定清单 = 不合格」→ A4 红 → 还原复跑
  - N2 「证据可复算」改「证据充分」→ A5 红 → 还原复跑
  - N3 固定清单表头「必答」改「问题」→ A3 红（卡内其余真实表格表头为「职责 / 产出 / 不做什么」「输入 / 从哪来 / 缺了会怎样」，均不含必答/必问）；围栏掩码另验：围栏内示例表加「必答」仍红 → 还原复跑
  - N4 `## 边界` 改 `## 权限边界` → A6 红（判定是 `heading.startsWith('边界')`，`check-agent.mjs:120`）→ 还原复跑
  - N5 `## 输出格式` 合并进别节 → A7 红 → 还原复跑
  - 假阳性方向（必须绿）：表头写「必问」而列结构不同 → A3 仍绿（`criteria.md` §0.2）；闭环字样写在「测试设计固定清单」节内而非「自由探索」→ A4 仍绿（节内优先）
- **对应测试**：待 plan Task N（建议挂进 `npm run check` 的 execution-matrix 段；当前 `scripts/check-all.mjs:119` 只跑 `checkAgent('reviewer-audit')`，见 §8 #9）
- **不覆盖**：A1/A2 语义项与 B/C 组（AI 判，annotations 三态）；`checkStruct` 判定逻辑本身的正确性（线 E spec）；13 席真卡的 A 组回归（S2/S4）

### TC-031 议会席模板渲染快照不回归（单 fixture 代表）

- **覆盖**：§5「13 席渲染不回归」/ §3「13 席渲染字节不得因此改动」段的三条可验锚点 / §7
- **前置**：
  - `tools/docgen/acceptance/render13-snapshot.mjs` 由 plan 新增，接口 `--module <renderAgent 模块路径> --out <输出文件>`（读固定 fixture → 调该模块的 `renderAgent` → 字节写到 out）
  - **不许用 `renderByName` 跑 13 席**——`triggerTable` 现有 **3 条**（`reviewer-audit` / `reviewer-product` / `senior-sdet`）；14 席里 **11 席无 `triggerTable.when`**（`renderByName` 抛 `MissingComponentData`）。`reviewer-product` 虽可渲染，但它是**骨架数据**、代表不了议会席模板的通用形态
  - **路径存在性前置检查（先跑，exit 0 才继续；不得用 `git diff` 代替）**：
    `node -e "const fs=require('node:fs');const {execFileSync}=require('node:child_process');const e=JSON.parse(fs.readFileSync('tools/docgen/fixtures/senior-sdet.evidence.json','utf8'));let has=false;try{execFileSync('git',['cat-file','-e',e.commit+':tools/docgen/components/renderAgent.mjs']);has=true}catch(x){has=false}console.log('anchor-commit='+e.commit.slice(0,7)+' renderAgent-exists='+(has?'yes':'no'));process.exitCode=has?0:1"`
    **退出码非 0（`renderAgent-exists=no`）= 该文件在 `evidence.commit` 里根本不存在**（例如该 commit 早于 docgen 建立）→ **直接走「未提交态」兜底分支**：跳过下面那段锚点有效性断言、也不进步① 的 `git show`（对缺失路径它直接 fatal，兜底代码根本没机会执行），并要求「改 `renderAgent.mjs` 之前必须处于未提交态」。**不得把 `git diff` 的非空输出当作存在性证明**：对不存在的路径，`git diff --quiet <commit> -- <path>` 同样给出「有差异」的假象，按它判定会把「路径缺失」误读成「锚点可用」。
  - **改前版本的锚点 = `evidence.commit`（TC-001a 步⑤ 由 `init-evidence` 写入、步⑥ 断言），不是 `HEAD`**：本仓 review 流程每轮提交，若施工前 `renderAgent.mjs` 的改动已被提交，`HEAD` 就是**改后**版本 → 步① 取到的「改前源码」其实是改后版本、步⑤「两 hash 必须不同」恒红。**锚点有效性前置断言**（存在性检查 exit 0 后才跑，exit 0 才算锚点可用）：
    `node -e "const fs=require('node:fs');const {execFileSync}=require('node:child_process');const e=JSON.parse(fs.readFileSync('tools/docgen/fixtures/senior-sdet.evidence.json','utf8'));let d='';try{execFileSync('git',['diff','--quiet',e.commit,'--','tools/docgen/components/renderAgent.mjs'])}catch(x){d='has-diff'}console.log('anchor-commit='+e.commit.slice(0,7)+' renderAgent-diff='+(d||'no-diff'));process.exitCode=d?0:1"`
    输出 `renderAgent-diff=has-diff`（= 该 commit 下是改前版本）。**若输出 `no-diff`（锚点失效）**：改用第二条锚点——**「在改动 `renderAgent.mjs` 之前、未提交状态下执行步①」**，并在账本写明本次用的是「未提交态」锚点（步⑤ 的比对基准随之改为步① 当场记下的 `git hash-object` 值）
  - **不依赖执行时序**的原始要求仍成立：改前版本从 git 取（`evidence.commit` 或未提交态），而不是「先跑一遍再改代码」
- **步骤**：
  ① **取改前版本（锚点 = `evidence.commit`，不绑 `HEAD`）**：把 `evidence.commit` 下的 `renderAgent.mjs` 落到 `$w2`，并把它的唯一依赖 `patternRegistry.mjs` 一并放同目录（相对导入才解析得到）：
     `node -e "const fs=require('node:fs');const {execFileSync}=require('node:child_process');const {join}=require('node:path');const d=process.argv[1];const e=JSON.parse(fs.readFileSync('tools/docgen/fixtures/senior-sdet.evidence.json','utf8'));fs.writeFileSync(join(d,'renderAgent-before.mjs'),execFileSync('git',['show',e.commit+':tools/docgen/components/renderAgent.mjs']));fs.copyFileSync('tools/docgen/components/patternRegistry.mjs',join(d,'patternRegistry.mjs'));console.log('before-src ready anchor='+e.commit.slice(0,7))" "$w2"`
     （**若前置的存在性检查输出 `renderAgent-exists=no`，或锚点有效性断言输出 `no-diff`**：改用「改动 `renderAgent.mjs` 之前、未提交」的版本复制到 `$w2/renderAgent-before.mjs`，并在账本记该锚点。**存在性为 `no` 时不得先跑本步的 `git show` 试一下**——它会对该 `rev:path` 直接 fatal、不进入兜底）
  ② 改前快照：`node tools/docgen/acceptance/render13-snapshot.mjs --module (Join-Path $w2 'renderAgent-before.mjs') --out (Join-Path $w2 'render13-before.md')`
  ③ 改后快照（施工已改 `renderAgent.mjs`）：`node tools/docgen/acceptance/render13-snapshot.mjs --module (Join-Path $repo 'tools/docgen/components/renderAgent.mjs') --out (Join-Path $w2 'render13-after.md')`
  ④ 【字节比较】两个快照
  ⑤ **来源证明（基准 = `evidence.commit`，不是 `HEAD`）**：`git hash-object tools/docgen/components/renderAgent.mjs`（工作区）与 `git rev-parse <evidence.commit>:tools/docgen/components/renderAgent.mjs` **必须不同**（相同 = 改动还没发生 / 取到的「改前」其实是改后，本次快照没验到东西 → 判 FAIL，不是 PASS）。**用 `HEAD` 作基准的写法已废弃**：施工前若已提交，`HEAD` 就是改后版本 → 两值恒等 → 恒红
  ⑥ 分流边界断言：`agentData.filter(a => a.outputKind === 'testcase').map(a => a.name)` 恰等于 `['senior-sdet']`
  ⑦ 另跑既有黄金测试：`node --test tools/docgen/test/pilot-render.test.mjs`
- **固定 fixture（写死在快照脚本里，不进 agentData）**：`{ name:'fixture-13', role:'评审员', dimension:'技术实现', tools:['Read','Glob','Grep'], identity:'桩。', fixedList:['SDET_FIXTURE_ROW_1','SDET_FIXTURE_ROW_2'], outputKind:'issue-card', sharedBlock:'AUDIT_RULES' }`，`trigger = { when:'当需要评审某份 spec' }`，`template` = `agent.md.tpl` 内容
  - **fixedList 的取值必须是产物里独一无二的标记串**（`SDET_FIXTURE_ROW_1` / `SDET_FIXTURE_ROW_2`），**不能用 `一` / `二` 这类单字**：`一` 已出现在 `agent.md.tpl` 的正文常量里，脚本漏读 `fixedList` 时产物照样含「一」→ 脚本自检仍绿（正是这条用例要防的恒绿）
  - `sharedBlock` 必须用当前**唯一已实现**的 `'AUDIT_RULES'`（`sharedBlocks.mjs:1` 注释写明 `SIX_METHODS` / `DETECTIVE_RULES` 由 S4 补；用未实现的值会让共享块渲染成空串，快照不再代表议会席形态）
- **预期**：改前后渲染逐字节相等；`testcase` 席恰 1 个；`pilot-render` 全绿（reviewer-audit 真卡黄金比对不受影响）
- **判据**：机器——
  - **前置两段（按序）**：① 存在性检查输出 `renderAgent-exists=yes` 且 exit 0；② 锚点有效性输出 `renderAgent-diff=has-diff` 且 exit 0。若 ① 输出 `no`（exit 1）→ 本条判据改为「账本已记『未提交态』锚点 + 步⑤ 以步① 当场 `git hash-object` 为基准」，**不得**把 `git diff` 的非空输出当作 ① 通过
  - 步④ 【字节比较】输出 `EQUAL`、exit 0
  - 步⑤ 两个 hash 不同（基准 = `evidence.commit`）：
    `node -e "const fs=require('node:fs');const {execFileSync}=require('node:child_process');const e=JSON.parse(fs.readFileSync('tools/docgen/fixtures/senior-sdet.evidence.json','utf8'));const now=execFileSync('git',['hash-object','tools/docgen/components/renderAgent.mjs'],{encoding:'utf8'}).trim();const before=execFileSync('git',['rev-parse',e.commit+':tools/docgen/components/renderAgent.mjs'],{encoding:'utf8'}).trim();console.log('now='+now+' before='+before+' changed='+(now!==before));process.exitCode=(now!==before)?0:1"`
    （**用「未提交态」锚点时**：`before` 改取步① 当场记下的 `git hash-object` 值）
  - 步⑥ `node --input-type=module -e "const m=await import('./tools/docgen/components/agentData.mjs');const n=m.agentData.filter(a=>a.outputKind==='testcase').map(a=>a.name);const ok=(n.length===1&&n[0]==='senior-sdet');console.log('testcase-seats='+n.join(','));process.exitCode=ok?0:1"`
  - 步⑦ `node --test tools/docgen/test/pilot-render.test.mjs` 退出 0
  - **脚本自检（防「前后同时少同一段」的恒绿）**：快照脚本内必须断言 fixture 的 `role` / `dimension` / `tools` 首项 / `fixedList[0]`（= `SDET_FIXTURE_ROW_1`）/ `sharedBlocks.AUDIT_RULES` 展开文本**都出现在产物里**；任一缺失 → 脚本 exit 1（否则脚本漏读字段会让前后快照同时少同一段而恒绿）。**探针唯一性前提**：`SDET_FIXTURE_ROW_1` 在 `agent.md.tpl` 常量与产物其余位置必须 0 命中——若探针串在模板里也出现，漏读 `fixedList` 仍会绿
- **红绿证据**：红（负例方向）——把 13 席分支也改成「整行直拼」（`fixedList.join('\n')`）→ 改后快照与改前 **DIFF** → FAIL；或快照脚本漏读 `fixedList` → 自检失败 → 脚本 exit 1（不是 PASS）。**反例（判别力）**：fixture 的 `fixedList` 若写回 `['一','二']`，脚本漏读 `fixedList` 时产物仍含「一」（来自 `agent.md.tpl` 正文）→ 自检绿 → 该恒绿复活
- **为什么必须新建这条**：gate 只比 `state = replaced` 的席（今天只有 reviewer-audit），11 席连渲染都会抛错——「13 席字节不变」在本轮**没有任何现成守卫**；fixture 快照把「`renderAgent` 函数行为」今天就锁住（真卡字节仍待 S4）
- **对应测试**：待 plan Task N
- **不覆盖**：**真 13 席卡字节（待 S4 由 baseline 兜）**；`agent.md.tpl` 自身改动的影响（TC-023 只管「不含 NOT_WHEN」）；`reviewer-product` 的骨架数据不构成议会席通用形态的代表

## 3 负例与边界

| 用例 ID | 类别 | 边界 / 负例是什么 | 注入方式 | 为什么容易漏 | 期望行为 |
|---|---|---|---|---|---|
| TC-014 | 负 | 转录润色（同义改写「找出来」→「找得到」） | 副本仓 | 「语义等价」最像「没改」，但零改写是逐字硬约束 | `diffSet --mode fail` PASS；`generate` exit 1 且 stderr 空（**不产 `Mismatch`**） |
| TC-015 | 负 | 来源行未更新（旧行保留） | 内存变异 | 只盯「别改多」，忽略「该改的没改」 | NEW 命中 0 → 红；该行必须 == NEW_SOURCE_LINE |
| TC-016 | 负 | 来源行差异溢出（正文另改一处） | 副本仓 | 只数差异行数不核内容 | `--mode overflow1` PASS（`unallowed=1`、`raw=2`） |
| TC-017 | 负 | description 拼装错：A（when 带尾「时」）/ A′（when 无尾「时」但派生含「时时」）/ B（notWhen 换词） | 内存变异 | 断言 7 命中即抛，断言 8 对 A 不可达 | A → 只 `WhenFormatViolation`；A′ → 只 `DescriptionDerivation`；B → 只有黄金比对能拦 |
| TC-018 | 负 | notWhen.refs 悬空（注入触发表） | 内存变异 | refs 是「未来调度消费」预留，填错不立即报错 | `TriggerConflict`（exit 1） |
| TC-019 | 负 | 词表机制在 P2 内缺席（去注释/去字面量后结构扫描） | 无（结构断言） | 无消费对象 → 「假红样本」构造不出来 | `wordlist-impl=absent`（0 命中且 exit 0）；**注释里提到「词表」仍必须绿** |
| TC-020 | 负 | 自评痕缺失（P2-遗-9） | 单文件副本 | 自评是注释不是代码，「没写也能跑」最省事 | 探针 0 命中 → 组件数据不合格，验收打回 |
| TC-021 | 负 | identity 转录截断（第二段丢失） | 副本仓 | §3 用「…」示意，施工者误以为只转录首句 | `--mode truncated` PASS |
| TC-022 | 负 | 模板缺节（缺「边界」） | 副本仓 | 只比语义内容不看节完整性 | `--mode fail` PASS；或渲染残留 `{{[A-Z_]+}}` |
| TC-023 | 负 | 两套模板误加 `{{NOT_WHEN}}` | 无（模板层断言） | 数据为空时 `fill` 整行删 → 渲染正常，渲染层永远发现不了 | 模板层断言 0 命中 |
| TC-024 | 负 | `diffSet` 本体：按行号跳过 / 按 `>` 前缀跳过（单元级双样本 × 三实现） | 合成 buffer | 旧样本改「来源行之后」→ 两种缺陷实现都能检出 → 用例恒绿 | `content-match=PASS index-skip=FAIL prefix-skip=FAIL` |
| TC-025 | 负 | 替换前 gate 红（与目标无关的 baseline 漂移） | 真仓库备份/注入/还原 | 只盯目标文件，忽略别处漂移 | exit 2 + stderr 首词 `BaselineDrift`；还原后转绿 |
| TC-026 | 负 | 步 4 修 2 次仍不等 → 停损 | 副本仓（两次注入） | 想快点过，违规改现产物迁就模板 | 现产物未动（numstat **空**、副本卡 == 冻结副本）；PRD §6.6 账本该席状态 = `停损未迁`（**人工核**，`state.json` 不接受该值） |
| TC-028 | 负 | 巩固判据缺一（gate 漂移 / 草稿残留 / git 脏 / check 红） | 真仓库改完即还原 | 只验「文件被替换」不看六要素 | 未巩固，不得推进队列 |
| TC-029 | 负 | replace 缺 `--yes` | 无 | 忘记显式授权位 | `NotAuthorized`（exit 4），文件不变 |
| TC-027 | **边界** | EOL / 缺尾换行 / **多尾换行** / BOM / 非法 UTF-8（**五个 violation 各一单违规样本**） | 内存样本 + 真卡改完还原 | 人看 markdown 看不出行尾差异；agent 路径**不跑** `checkEnvironment`，错误码会与预期对不上 | 单测 → `EnvironmentEOL` + 对应 violation（5/5）；端到端 → 接受 `Mismatch`（exit 1） |

> 说明：TC-030（A 组不回归）与 TC-031（13 席不回归）是正例，它们的**负例方向**（A3–A7 各一条 + 2 条假阳性对照 / 13 席分支改坏）写在各自用例体内，不另开编号。
> **计数（三处一致之二）**：用例 **31**；正例 **15**（TC-001~TC-013 + TC-030 + TC-031）；负例 **15**（TC-014~TC-026 + TC-028 + TC-029）；边界 **1**（TC-027）→ 负例与边界 **16 ≥ 正例 15** ✓。

## 4 回归清单

| 如果改了 | 必须重跑 | 为什么 |
|---|---|---|
| `tools/docgen/components/agentData.mjs`（senior-sdet 条目） | TC-002、TC-003、TC-004、TC-007、TC-010、TC-014、TC-017、TC-018、TC-021、TC-030 | 转录数据是全部比对的前提；改一条即牵动逐字节、description 派生与替换后卡的结构项 |
| `tools/docgen/components/agentData.mjs`（`triggerTable['senior-sdet']`） | TC-004、TC-007、TC-009、TC-018 | when/route/notWhen 全住触发表：丢了 when → generate 静默跳过（TC-009 假绿）、断言 12 空转（TC-004/018） |
| `tools/docgen/templates/agent-handwritten.md.tpl` | TC-002、TC-006、TC-010、TC-014、TC-022、TC-023 | 模板决定渲染字节、7 槽位、纯度与 9 节骨架；**模板重写最容易丢 A3–A5 的关键字样**（必答列头 / 只答固定清单 = 不合格 / 证据可复算）——但该风险由 TC-010/014/022 的逐字节/diffSet 兜，不挂 TC-030 |
| `tools/docgen/templates/agent.md.tpl`（议会席模板） | TC-023、TC-031 | 硬约束 5：两套模板都不得有 `{{NOT_WHEN}}`；13 席渲染快照 |
| `tools/docgen/components/renderAgent.mjs`（槽位填充 / 分流） | TC-002、TC-007、TC-010、TC-030、**TC-031** | heading/sourceLine 槽位靠它填；`testcase` 分流改坏会波及议会席单元格重拼路径——TC-031 是唯一现成锚点 |
| `tools/docgen/components/compare.mjs`（新增 `diffSet`） | TC-010、TC-014、TC-016、TC-021、TC-024 | 比对口径只按行内容匹配；TC-024 是该 helper 判别力的唯一防线 |
| `tools/docgen/components/validateAgentData.mjs` | TC-004、TC-007、TC-008、TC-017、TC-018、TC-019 | 守卫断言（notWhen refs / when 格式 / 派生断言）全在它身上 |
| `tools/docgen/components/patternRegistry.mjs`（outputKind / tools） | TC-007、TC-031 | `testcase` 是新枚举值；`tools.sdet` 变动会让 TC-002 的 tools 行断言失配 |
| `tools/docgen/cli.mjs`（generate） | TC-009、TC-010、TC-014、TC-027 | 内存渲染 + 整缓冲比对 + 静默跳过分支（`cli.mjs:65`） |
| `tools/docgen/cli.mjs`（replace） | TC-012、TC-025、TC-029 | 拒红过滤、授权位、`clearDrafts`（决定 TC-012 必须用替换前草稿副本） |
| `tools/docgen/cli.mjs`（draft / `DRAFTS_DIR`） | TC-011、TC-012、TC-013、TC-025、TC-028、TC-029 | 草稿箱隔离与清理（`DOCGEN_DRAFTS_DIR`） |
| `tools/docgen/evidence.mjs` / `tools/docgen/acceptance/init-evidence.mjs` | 重跑 **TC-001b**（只重锁 evidence）；**不得重跑 TC-001a**（冻结副本不可覆盖） | `lastWrittenHash`（旧卡）与 `renderSha256`（渲染）是两个不同时刻的值，写反 → 步 7 `TargetDrift`。**为什么不能重跑 TC-001a**：`init-evidence` 会把 `commit`/`blob` 重新指向「最近一次提交」，迁移后即指向新卡 → 黄金锚点当场丢失（TC-001b 步④ 已明令禁止） |
| `tools/docgen/acceptance/golden-assert.mjs`（回填入口） | TC-012、TC-025 | `renderSha256` 的唯一回填口；**对本席双重不兼容**（句式不分流 + 整文件全等，见 TC-001a 步⑤）→ 修好前 `goldenAssertion` 恒 `fail`、`compareResult` 恒 `Mismatch` |
| `tools/docgen/fixtures/senior-sdet.evidence.json` | **重跑 TC-001b**（只重锁 `lastWrittenHash`）；**不得重跑 TC-001a**（`init-evidence` 会把 `commit`/`blob` 指向替换后的卡，黄金锚点即失效）、TC-012、TC-025 | replace 硬读该文件；它同时是**黄金锚点**（`commit`/`blob`），丢了冻结副本也还能重建——**所以它的回归只能是「重锁 `lastWrittenHash`」，不是重建 `commit`/`blob`** |
| `agents/senior-sdet.md`（替换后） | **TC-001b**（重锁 evidence）、TC-010（改用冻结副本，不读现卡）、TC-012、TC-013、TC-026、TC-027、TC-028、TC-030；**不得重跑 TC-001a** | 现产物变更后 `lastWrittenHash` 要重锁、numstat 口径与 A 组真卡直接受影响；重跑 TC-001a 会把冻结副本指向迁移后版本（锚点丢失） |
| `tools/docgen/state.json`（senior-sdet 置 `replaced`） | TC-012、TC-013、TC-027、TC-028 | gate 只对 `replaced` 席做逐字节比对（`cli.mjs:98`）；TC-030 不受影响（`checkAgentFile` 不读 state） |
| `tools/execution-matrix/check-agent.mjs` / `criteria.md`（A3–A7 判据） | TC-030 | 判定词与判定口径改动直接改变 A 组结论 |
| `scripts/check-all.mjs` / baseline agent 清单 | TC-008、TC-012、TC-013、TC-028、TC-030、TC-031 | gate 比对范围与 `baseline N/N` 的数字来源；A 组/快照守卫若挂进 check 也在此 |
| `tools/docgen/acceptance/cold-run.mjs` / `replace-scenarios.mjs` | TC-013 | 冷跑与崩溃恢复的既有实现；改动会让「巩固」判据换口径 |
| `skills/parliament/scripts/gen-agents.mjs`（**旧生成器，当前不存在**） | TC-013 | 若该文件被重新引入（回退到旧来源），「不存在」断言立刻变红，提示旧来源复活 |
| 13 席任一 agentData 条目（键集变化） | TC-004、TC-018、TC-031 | notWhen.refs ⊆ 键集断言依赖全量键集；testcase 席唯一性断言也依赖全量 |

> **模板改动为什么不挂 TC-030**：TC-030 读的是**真卡**；只改模板、尚未 replace 时真卡没变，挂上去恒绿（伪覆盖）。模板改动的防线是 TC-010/TC-014/TC-022（逐字节与 diffSet）；TC-030 只在**替换后**跑。

## 5 只手动验证

| 项 | 为什么机器验不了 | 谁验、看什么 |
|---|---|---|
| 转录后角色卡「读起来还是同一张 senior-sdet」的语义观感（spec §7 明示） | 机器只验字节，不验「语义无漂移」——身份、语气、三条铁律的约束力、边界权限是语义层 | 评审者 / spec 作者：通读替换后的卡，确认与冻结副本读感一致（身份句、铁律措辞、输入四样、固定清单 9 条、输出格式、边界权限） |
| W2 转录零改写抽查（你是谁 / 三条铁律 / 固定清单 / 边界 四节） | W2 明示「人工抽查 + Buffer 比对」；Buffer 部分 TC-010 已兜底，人工部分确认语义无漂移 | 评审者：四节逐节对照冻结副本通读，记录抽查结论（无漂移 / 有疑问），记录进「抽查记录表」（§8 #7） |
| 替换后 A 组判定 notes 的归因（A4 节外兜底 / A5 节内命中） | 机器只给红绿与 notes，不判「命中位置是否合理」 | 评审者：读 TC-030 输出的 notes，确认 A4 记「节外兜底」、A5 记「通用纪律节内命中」，且没有把围栏内示例表当真实结构 |
| 自评痕内容的真实性（P2-遗-9） | 存在性可机器查（TC-005），「是否真自评而非敷衍填词」需人看 | 评审者：看 `translation-self-check` 是否具体反映转录取舍（详细 / 逻辑化两维有实质描述，非「详细：是。逻辑化：是。」空话） |

> 说明：来源声明行新措辞的语义**不在本表**——spec R2 与 §3 已把该行锁定为 `sourceLine` 逐字文本（**单源 = spec §3「改后」一行，第 97 行**），改由 TC-002 步① 与 TC-015 做机器逐字断言。

## 6 不测（带理由）

| 不测什么 | 为什么 |
|---|---|
| 能力地基本身（CLI 六子命令 / 草稿箱生命周期 / 退出码五档全映射 / 拒红过滤实现 / W4–W9 终态验收） | S1 覆盖；本 spec 只引用 S1 的断言号与错误码档位，不重复定义 |
| 13 席迁移（S2/S4）与其余 11 席的**真卡**逐字节 | 本 spec 只做 senior-sdet 一席；11 席无 `triggerTable.when`、`renderByName` 直接抛 `MissingComponentData`，真卡字节锁待 S4 由 baseline 兜（本轮只锁 `renderAgent` 函数行为，见 TC-031） |
| description 翻译闭环（完形填空） | PRD §1.1 作用域声明：P2 本体 = 数据搬家 / 零改写转录，不涉及 AI 翻译 |
| **词表对 transcription 字段生效** | S1 已裁定 **P2 内没有词表实现**（description 全被句式锁定，无消费对象）→ 该条为「恒真豁免」，不可能因 R6 失败。TC-008 只断言「gate 绿 + 无词表族码」，TC-019 只做「机制缺席」的结构断言；一旦引入词表实现，TC-019 必须升级为真负例 |
| 能力完备（W6/W7 草稿纪律全量） | S1 序 4；本 spec 只覆盖本席闭环触达的 replace 失败路径（TC-025/029） |
| **senior-sdet 专属的崩溃恢复场景** | 替换实现是席无关的同一段代码（`cli.mjs:249-268`）；崩溃恢复由既有 `tools/docgen/acceptance/replace-scenarios.mjs` 的 S3/S4 以 `reviewer-audit` 为代表覆盖（TC-013 步③ 跑它）。为同一段代码再造一套 senior-sdet 版本只会多一份会漂移的副本 |
| **§3.1 末段的「模板复用定性」**（手写席 = 同形态、不同文件） | 这是**文档约定**（写给 P3/P4 看的判据方向），不是产物属性——没有可机器判的落点，也不该为它编一个。「第二席 testcase 出现且想复用议会席模板」是它的触发信号，记在 spec 账本里 |
| **gen-agents ROLES 递减** | 该文件**当前不存在**（`Glob '**/gen-agents*'` 0 命中）→ 旧「grep 无该席」判据会指向不存在的文件（grep 报错而非无匹配，既不会红也不会绿）。改为 TC-013 的「文件不存在 = 旧来源已退役」断言 |
| 逐字节比对「排除来源声明行」的底层实现细节 | 属 S1 gate 实现；本 spec 通过 TC-024 以单元级双样本约束其行为（只能按行内容匹配） |
| A 组 A1/A2 语义项与 B/C 组（AI 判） | 判据落 `rules/.inspector-annotations.json` 三态；TC-030 只取 A3–A7 结构项子集（`checkAgentFile().ok` 会因语义键 pending 恒为 false） |
| A 组检查器 `checkStruct` 判定逻辑本身的正确性 | 线 E spec（`2026-10-20-execution-assurance-matrix-design.md`）范围；本 spec 只断言「替换后卡不回归」 |
| 跨组件引用 / 触发表热更新 / 多语言 | PRD §2 边界 |

## 7 缺口与判别力水位

| 缺口 | 漏检哪类反例 | 至少 1 个样例 | 语义由谁兜 |
|---|---|---|---|
| 来源声明行逐字措辞（R2 + §3「改后」一行单源，spec 第 97 行） | 施工自行美化（「本角色卡」→「本文档」、删模板文件名、简化箭头） | 锁定文本含 `agent-handwritten.md.tpl` 与四步箭头 | TC-002 步① / TC-015 机器逐字；【常量自校验】把「本文件内联副本 == spec 单源」也钉住 |
| **notWhen 空转**（写错位置导致断言 12 静默跳过） | notWhen 只写进条目 → 触发表无该键 → `validateAgentData.mjs:85` 直接跳过 → 悬空 refs 也判绿 | 悬空 refs 被写进条目而非触发表 | TC-004 步① 的存在性断言（**唯一防线**）+ TC-018 的内存变异 |
| 自评痕真实性（存在可机器查、真实不可查） | 敷衍自评（「详细：是。逻辑化：是。」） | 注释存在但无实质描述 | 人工抽查（§5 项 4）；机器只兜存在性与**归属**（TC-005/020 绑条目探针） |
| 空行 / 空白布局的字节级复现 | 模板漏复现连续空行、表格前后空行数不齐 → 逐字节红，但**归因**靠人看 diff | 「你是谁」两段之间、fixedList 表格前后空行 | TC-010 兜红；施工者对照冻结副本逐行核对，评审抽查 diff 归因 |
| fixedList 存储形态 + 渲染分流（元素 = 整行原文；`testcase` 走整行直拼） | 数据改了、渲染层仍按单元格重拼（`renderAgent.mjs:13-15` 现状）→ 表头「必问」+「待答」列与现卡「必答」不兼容 → 逐字节必红 | 数据形状 / 模板都改了，渲染函数是第三处 | TC-002（数据粒度 + 槽位）、TC-010（逐字节）、TC-031（议会席不受影响） |
| when 提取边界（when 无尾「时」；A 走断言 7、A′ 走断言 8、B 才靠黄金比对） | 施工沿用带尾「时」的字面值 → 派生「时时调用」；或误以为断言 8 会同时命中（**不可达**） | §3 注释与字面值分两处，容易只抄字面值 | TC-007 步③（归因）、TC-003 / TC-017（三样本三防线） |
| 隔目录冷跑的复制完整性 | 副本缺文件 → gate 结论不可信（假绿或假红） | 复制时漏 `tools/docgen/**` | 复用 `cold-run.mjs`（git 跟踪 + extras 清单），清单本身归脚本；评审抽查脚本清单 |
| 「干净」口径（`git status --short rules/ skills/` 无输出 + numstat **前两列** `1 1`） | 把「干净」扩读成「agents/ 零改动」→ 本席必假红；或只数行数不看内容 → 差异溢出漏检 | 替换后 numstat 恒为 `1 1`，属预期 | TC-012 / TC-013 / TC-028 用 `1 1`；**TC-026（停损态）期望 numstat 空**——两者口径不同，不得混用 |
| `git diff` 输出的 `---/+++` 头会污染「差异仅来源行」的字面判定 | 用 `git diff` 全文 grep 行集 → 把头也算进差异 → 假红 | `git diff` 默认输出 4 行头 | 改用 `--numstat`（计数）+ 定向核 `-`/`+` 行内容 |
| A 组结构项只判「存在性 + 语义」，不判措辞 | 措辞漂移（「必答」→「必问」、闭环句换同义句）时 A3/A4 仍绿 | 表头由「必答」改「必问」，`checkStruct` 仍绿 | TC-010 逐字节兜底；TC-030 只负责「关键字样是否丢失」 |
| 语义键 pending 使 `checkAgentFile(name).ok` 恒为 false | 把「整卡不合格」误读成「A 组结构项回归」，或因一接就红而不敢接守卫 | `checkSemantic` 对缺键按 pending 判红（`check-agent.mjs:145-159`） | TC-030 只取 A3–A7 子集；接守卫的改法见 §8 #9 |
| **13 席真卡无锚点**（只有 fixture 快照） | `renderAgent` 改了议会席分支而 fixture 恰好没覆盖到的路径（如无 `sharedBlock` 席的空行折叠）仍可能漂移 | fixture 只含一个 `sharedBlock: 'AUDIT_RULES'` 的席 | TC-031 + `pilot-render.test.mjs:91-101`（无 sharedBlock 桩）；真卡字节待 S4 |
| **快照脚本自身的漏读**（前后同时少同一段 → 恒绿） | 脚本没读 `fixedList`，则删掉数据行时前后快照都不变；**更隐蔽的是探针串不唯一**——fixture 写 `['一','二']` 时，「一」本来就在 `agent.md.tpl` 正文里 → 漏读也绿 | 脚本只渲染 `identity` 不渲染 `fixedList`；fixture 标记串在模板里也出现 | TC-031 的「脚本自检」断言（fixture 各字段必须出现在产物里）+ **探针唯一性**（`SDET_FIXTURE_ROW_1` 必须在模板与产物其余位置 0 命中） |
| **未消费槽位静默保留**（`fill()` 不报错） | 新增槽位忘写填充 → `{{XXX}}` 原样进产物，无人报错 | `renderAgent.mjs:3-6` 只做 replaceAll，不校验残留 | TC-030 的通用正则 `{{[A-Z_]+}}`（真卡）+ TC-022 步③（副本）+ TC-002(b) 的槽位清单（模板） |
| **PowerShell 重定向 / `git show --output` 改字节** | 用 `>` / `Out-File` / `--output` 存冻结副本 → 文件变 UTF-16 或版本相关行为 → 后续 hash/比对全错但「看起来文件在」 | PS 5.1 默认 `>` 写 UTF-16LE | TC-001a 步④ 的 `git hash-object` 自校验（唯一能证明「冻结副本没被转码」的判据） |
| **`draft ls` 不隔离就读真实草稿箱** | 评审机与施工机共用家目录 → 残留草稿让下一次 `draft` 报 `DraftNameConflict` | `cli.mjs:161` 的 `DRAFTS_DIR()` 默认 `homedir()/.retro-skills/docgen-drafts` | TC-011/012/013/025/028/029 统一 `DOCGEN_DRAFTS_DIR` + 前后清空 |
| **假阳性账：TC-019 把文档提及当实现** | 注释 / 错误消息里出现「词表」→ 不剥离就判红 → 逼人删注释换绿 | `// 本席不适用词表` | TC-019 的 `strip()`（去注释、去字符串/模板字面量）后再匹配：注释里提到「词表」**必须仍绿** |

## 8 给开发的建议

> 来源 = 实现观察（`agents/senior-sdet.md` 现卡、spec §1/§3/§3.1/§4/§5/§6、S1 spec §4/§6/§7、`tools/docgen/**`、`tools/execution-matrix/**`、`scripts/check-all.mjs`、两轮评审批次记录）。以下建议**不修改本 testcase 的任何用例**（铁律 2/3）：从 spec 推导的判据不受实现观察影响；这里只指出实现层与 spec 自身最可能出事、但用例表未必能单独暴露的角落。

| # | 位置（文件:行 / spec 节号） | 风险或盲点 | 为什么会被忽略 | 具体改法 | 优先级 |
|---|---|---|---|---|---|
| 1 | spec §3 触发表段 + R3 | 叠字矛盾已消除（when 无尾随「时」，句式补「时调用」）；残余风险是施工沿用旧字面值 → 红两处：`validateAgentData.mjs:55` → `WhenFormatViolation`；`:64` → `DescriptionDerivation` | 照旧抄最省事 | 数据 when 逐字 = spec 触发表段（无尾随「时」）；TC-007 步③ / TC-017 已按裁决断言 | P0（回归提示） |
| 2 | spec §4 步 8 + §5 巩固行 + TC-012/013/028 | 「后置干净」两处口径需统一按「rules/skills 无输出 + numstat 前两列 `1 1`」执行 | 通用「干净」在 S2（字节全等）与本席（允许一行差异）含义不同 | 施工与评审统一按 TC-012/013/028 判据执行；**TC-026 停损态另判「numstat 空」** | P1 |
| 3 | spec §3 `sourceLine`（字段第 63 行，锁定文本第 97 行） | 风险是「施工自行美化措辞」；本 testcase 只保留一处内联副本 + 【常量自校验】，spec 若再改文本，TC-002/015 立刻红 | 锁定文本较长且含箭头，最容易「顺手简化」 | 逐字使用 spec §3「改后」一行；【常量自校验】每次送审前跑一遍 | P1 |
| 4 | spec §3 `fixedList` 粒度（第 88 行） | 元素 = 整行原文已定；**渲染层没跟上**（见 #8）——数据口径改了、渲染实现没改 = 数据对了产物错 | 「数据形状」与「模板」都写了，渲染函数是第三处 | 见 #8；TC-002 / TC-010 兜底 | P0 |
| 5 | 现卡「输出格式」节 + `agent-handwritten.md.tpl` | 「给开发的建议」代码块（反引号 + 管道符表格）若被槽位化或转义，反引号易丢 → 逐字节红且难归因 | 反引号在 markdown 模板里最易被「顺手清理」 | 该节整块常量转录（同「通用纪律」），不做槽位化；TC-010 兜底 | P2 |
| 6 | `validateAgentData.mjs:55`（断言 7） | 现行实现含 `t.when.endsWith('时')`，带尾「时」被**直接判红**；真正要防的是把「不能以时结尾」误读成「要改写 when 措辞」——那会破坏 R3 逐字复现 | 「时调用」子串与「结尾是时」看着是一回事 | plan/注释写明：断言 7 = 禁「在…中担任」/「时调用」子串 **且** 禁尾随「时」；正确做法 = when 保留原文、仅去掉尾部「时」 | P1 |
| 7 | W2 转录零改写抽查（你是谁 / 三条铁律 / 固定清单 / 边界） | spec 只列抽查节，未定义抽查记录格式与判据落点 | 人工抽查无记录 = 无法复核 | plan 里加「抽查记录表」（每节：逐字比对结论 + 语义无漂移结论 + 抽查人） | P2 |
| 8 | `tools/docgen/components/renderAgent.mjs:13-15` | `fixedList` 按「拆单元格重拼」生成 `\| # \| 必问 \| 回答 \|` + `\| i \| q \| 待答 \|`，与 §3「元素 = 整行原文」及现卡 `\| # \| 必答 \|` 表头**双重不兼容**：数据改对了渲染仍必红 | 数据 / 模板 / 渲染三处，改前两处时最容易漏第三处 | `outputKind === 'testcase'` 分支改为 `fixedList.join('\n')`；其余分支保持原单元格重拼；改完必须跑 TC-031 | P0 |
| 9 | `scripts/check-all.mjs:119` + `check-agent.mjs:162-189` | `npm run check` 只对 `reviewer-audit` 跑 `checkAgent`，senior-sdet 的 A3–A7 **无自动守卫**；直接换 `checkAgentFile('senior-sdet')` 又会被语义 pending 拖红（`ok` 恒 false） | 线 E 守卫「已落地」容易被读成「已生效」，实际只接了 1 席 | 二选一：① 补齐 senior-sdet 的 10 个 annotations 键后接入 `checkAgentFile`；② 在 check-all 加「只判 A3–A7 子集」入口并注释说明为何不看 `ok` | P0 |
| 10 | `tools/docgen/components/agentData.mjs:35` / spec §3 | 现行 senior-sdet 条目只有 `name` / `role` / `outputKind`（`tools` 由 :36 派生）；heading / identity / fixedList / sourceLine 全缺。TC-007/002 断言的是**施工后**状态，plan 若把它们排在数据迁移之前会「预期地红」 | 验收用例天然期望终态 | plan 把 TC-002 / TC-007 排在「数据迁移」任务之后 | P2 |
| 11 | `tools/docgen/acceptance/init-evidence.mjs:13-18` + `cli.mjs:258` + `fixtures/reviewer-audit.evidence.json` | **新发现（实现观察，阻塞步 7）**：evidence 的 `lastWrittenHash` 必须是**旧卡** SHA256、`renderSha256` 必须是**本席渲染** SHA256，二者在 S3 **必然不等**（来源行不同）。照 `reviewer-audit.evidence.json` 抄（三项同值）→ `cli.mjs:258` 判 `TargetDrift`（exit 1），提示与真正原因（证据时段混淆）无关 | S2 的席字节全等，三项同值是**正确**的；S3 一字不改地抄就成了错的 | 步 1 用 `init-evidence.mjs`（自动写 `lastWrittenHash = 旧卡 sha`、`renderSha256='pending'`），步 4 用 `golden-assert.mjs` 回填；plan 明写「本席三哈希不得同值」 | P0（**新发现**） |
| 12 | `tools/docgen/components/renderAgent.mjs:3-6`（`fill`）+ spec §6-9 | **新发现（实现观察）**：`fill()` 对未实现/未消费的槽位只做 `replaceAll`，不校验残留——新增槽位忘写填充时 `{{XXX}}` 会原样进产物，而 `MissingSlot` **没有抛点**（只出现在 rule 侧 `specTestCaseGate.mjs`） | 「7 槽位断言」只查模板里有没有槽位，不查产物有没有残留 | 在 `renderAgent` 末尾加通用守卫：产物命中 `/\{\{[A-Z_]+\}\}/` 即 `MissingSlot`（exit 1） | P1（**新发现**） |
| 13 | 判据命令层：PowerShell `>`/`Out-File`、`git show --output`、`git diff` 头 | 三条都是「命令跑过了、输出也有」的假证据形态：① PS 5.1 `>` 写 UTF-16LE；② `--output` 跨版本行为不一；③ `git diff` 含 `---/+++` 头 | 都是平台常识，但一旦落进用例就长期污染 | 冻结走 node `execFileSync` + `writeFileSync` 并 `git hash-object` 自校验；「差异仅一行」用 `--numstat` + 定向核 `-`/`+` 行 | P1（**新发现**） |
| 14 | `tools/docgen/cli.mjs:65`（`continue` 静默跳过）+ `:66-71`（drift 计数） | 缺 `when` 的席在 `generate` 里被 `continue`，drift 恒 0 → **exit 0**，与「确实一致」在 stdout 上完全同形；且 `generate` **从不产 `Mismatch`**，只 exit 1 | 静默跳过不产生任何输出 | 加计数器 / 输出比对了哪几席（如 `compared=senior-sdet`），或对「显式 `--name` 但被跳过」直接 `MissingWhen`；TC-009 已把「exit 必须为 1」当证据，TC-014 已按「exit 1 + stderr 空」判定 | P1（**新发现**） |
| 15 | `checkAgentFile` 不读 `state.json` | 旧 testcase 把「`state.json` 置 replaced」写成 TC-030 的**前置必要条件**，但 `check-agent.mjs:175-189` 只读 `agents/<name>.md` | 前置条件写宽了不会报错，只会让用例白等 | TC-030 前置已改「state 不是必要条件」；state 只在 TC-012/013/027/028 里必要（gate 用得到） | P2（**新发现**） |
| 16 | `tools/docgen/cli.mjs:218-221`（evidence 校验）+ `evidence.mjs:35`（`goldenAssertion` 允许 `'fail'`） | **新发现（实现观察）**：replace 只校验 `renderSha256`，**不校验 `goldenAssertion`**——黄金断言失败（description 未逐字复现 = W2-② 红线）时仍可能替换成功 | 「evidence 已存在且哈希对」容易被当成「黄金也通过了」 | 在 `cmdReplace` 的 evidence 校验处补一条：`if (evidence.goldenAssertion !== 'pass') fail('EvidenceInvalid', {reason:'黄金断言未通过'})`；TC-012 判据 ④ 已按「必须拒」写 | P1（**新发现**） |
| 17 | `tools/docgen/acceptance/golden-assert.mjs:18`（+ `:24` / `:35`） | **新发现（实现观察，阻塞 TC-012）**：该脚本对**本席双重不兼容**——① `:18` 硬编码 `patternRegistry.description.parliament(agent.role, t.when)`，对 `outputKind='testcase'` 的席必然算错 → `goldenAssertion` 恒 `fail`（并在 §8 #16 修好后**永久拒绝替换**）；② `:24` / `:35` 用整文件全等，本席来源行按设计必差异 → `compareResult` 恒 `Mismatch`、命令恒 exit 1（`renderSha256` 在 `:29` 已写盘，故「回填」实际成功） | 它是 S2 的脚本，S2 只有议会席（且字节全等） | ① 按 `agent.outputKind` 分流：`testcase` 走 `description.handwritten(agent.role, t.when, t.notWhen?.text ?? '')`；② 整文件比较改用 `diffSet` 并豁免 `{OLD_SOURCE_LINE, NEW_SOURCE_LINE}`；两处均已在 spec §1 影响面⑤ 登记 | P0（**新发现**） |
| 18 | `tools/docgen/acceptance/cold-run.mjs:14-22`（extras 清单） | 冷跑副本的 extras 不含 `fixtures/senior-sdet.evidence.json`；本轮 gate 不读 evidence 故不受影响，但若将来把 replace 也纳入冷跑，副本会因 `EvidenceInvalid` 假红 | 清单是「够用就好」写的，没人回头看它是否仍然够用 | 冷跑清单加 `tools/docgen/fixtures/senior-sdet.evidence.json`；或把 extras 清单抽成共享常量（与 `replace-scenarios.mjs` 的清单同源） | P2（**新发现**） |

---

**完成回报**（三处计数一致：§1 / §3 说明 / 本节）：

- **用例总数**：**31**（TC-001 ~ TC-031；编号不重排、不作废）。TC-001 内含 `TC-001a`（迁移前冻结）/ `TC-001b`（替换后重锁 evidence）**两段步骤，仍算 1 条**——不新增编号。
- **本修订（revision4）性质 = 收尾式小修**：10 项 + QA N4 逐处落地（见下节落点表），**未新增 / 删除 / 重排任何 TC 编号**，正 / 负 / 边界与覆盖账均不变；新增的判据命令（TC-010 步⑤ 归一化、TC-031 步⑤ 与锚点有效性断言）仍属「待 plan 任务落地」，不改变任何用例的类别。
- **正例数**：**15**（TC-001 ~ TC-013 + TC-030 + TC-031）
- **负例数**：**15**（TC-014 ~ TC-026 + TC-028 + TC-029）｜**边界数**：**1**（TC-027）
- **负例与边界 16 ≥ 正例 15**：满足门槛 ✓
- **覆盖的 spec 验收项**：**逐条款普查 27 条 → 去重后 23 条独立规定全覆盖**（`R1`、`R6`、`R7` + `§5` W2 八行 + `§3` + `§3.1` + `§6-1..10`）；其中 **`R6` 为恒真豁免**（P2 无词表实现，无消费对象）→ **可失败项 22 条，覆盖 22/22，未覆盖 0**。`§3.1` 末段的「模板复用定性」属文档约定、不设断言，已移入 §6「不测」并写明理由。
- **未覆盖项及理由**：无（不测项见 §6，逐条带理由）
- **发现的盲点数**：**18 条**（§8 #1–#18）
  - 已由 spec 修订裁决：**3 条**（#1 when 尾随「时」、#3 来源行锁定措辞、#4 fixedList 存储形态）
  - **本次新发现 8 条**：#11 evidence 两哈希时段混淆（P0）、#12 `fill()` 不校验未消费槽位（P1）、#13 PowerShell 重定向 / `git show --output` / `git diff` 头的证据失真（P1）、#14 `generate` 静默跳过使「全绿」与「没比」同形、且不产 `Mismatch`（P1）、#15 `checkAgentFile` 不读 `state.json`（P2）、**#16 `cmdReplace` 不校验 `goldenAssertion`（P1）**、**#17 `golden-assert.mjs` 硬编码议会席句式（P0，阻塞 TC-012）**、**#18 `cold-run.mjs` 的 extras 缺本席 evidence（P2）**
  - 沿用待处置 **7 条**：#2 干净口径、#5 输出格式节代码块转义、#6 断言 7 判据误读、#7 W2 人工抽查无记录格式、#8 `renderAgent` 的 fixedList 拼装不兼容、#9 `check-all` 未接 senior-sdet 的 A3–A7、#10 TC-007 的时序说明

**计数自算命令**（复核用，均在 `$repo` 执行）：

```powershell
node -e "const s=require('node:fs').readFileSync('docs/superpowers/specs/2026-10-19-docgen-agent-senior-sdet-design-testcase.md','utf8');const h=(s.match(/^### TC-/gm)||[]).length;const pos=(s.match(/^### TC-0(0[1-9]|1[0-3]) /gm)||[]).length;console.log('tc-headings='+h+' tc-001..013='+pos)"
node -e "const s=require('node:fs').readFileSync('docs/superpowers/specs/2026-10-19-docgen-agent-senior-sdet-design-testcase.md','utf8');const neg=(s.match(/^\| TC-0(1[4-9]|2[0-6]|28|29) \| 负/gm)||[]).length;const bnd=(s.match(/^\| TC-027 \| \*\*边界\*\*/gm)||[]).length;console.log('negatives='+neg+' boundary='+bnd)"
```

> 三处计数定义（本节 / §1 计数自洽 / §3 说明）：总数 31、正 15、负 15、边界 1。上面第一条命令的 `tc-headings` 应 == 31；第二条的 `negatives` 应 == 15、`boundary` 应 == 1。

---

**本次修订逐项落点（第 2 轮 6 席复核 30 项）**：

| 项（来源） | 落点 | 改了什么 |
|---|---|---|
| 1 `diffSet` 语义统一（P0） | 文件头【diffSet 口径】/【diffSet 判据命令】、TC-010 步②③④、TC-016 判据、TC-024 全文 | 接口统一 `{raw, unallowed}`；**写死 `line` 记期望侧（快照）**、期望侧无该行时 `null`；TC-010 = `unallowed` 空 + `raw` 恰 1 行且 `line === OLD` + `index` 自洽；TC-016 = `unallowed===1 && raw===2`；TC-024 改为 `diffSet` 本体三实现对照；明确 generate/gate 仍走整缓冲 `compareBuffers` |
| 2 TC-001 拆两段 + 冻结副本不可覆盖（P0） | TC-001（TC-001a / TC-001b）、文件头【冻结副本】、§4 回归清单 | 文件名带 blob 前 12 位；node `execFileSync('git',['show',...])` + `writeFileSync` 按字节写；**禁 `git show --output`、禁 PS `>`**；TC-001b 只更新 `lastWrittenHash` 且禁止触碰冻结副本；回归清单改「重跑 TC-001b；不得重跑 TC-001a」 |
| 3 黄金值锚点持久化（P1） | TC-001a 步⑥⑦、TC-003/010/014/016/021 前置、文件头【执行环境】/【冻结副本】 | 锚点 = `fixtures/senior-sdet.evidence.json` 的 `commit`/`blob`；五处前置改为指向文件头【冻结副本】的「丢失后重建」命令（带 `anchor-blob-ok` 自检）；临时目录全改 `$w2`（`[IO.Path]::GetTempPath()` 派生）；cwd = `git rev-parse --show-toplevel` |
| 4 TC-025 stderr 判据（P1） | TC-025 判据/预期 | 改「退出码 2 + stderr 首词 == `BaselineDrift`」；删「stderr 含 baseline.json」（CLI 只打印 `code: message (name)`，不含 path）；加「还原后 gate 转绿」作二次确认 |
| 5 TC-014 错误码（P1） | TC-014 预期/判据、§3 负例表 | 主判据 = `diffSet --mode fail`；辅 = `generate` exit 1 + stderr 空；明写 **`generate` 从不抛 `Mismatch`**（`Mismatch` 只在 gate 路径，见 TC-027） |
| 6 evidence 回填入口（P1） | TC-012 前置③④、TC-001a 步⑤、§8 #16/#17 | 写明 `init-evidence.mjs` 只写 `renderSha256='pending'`；回填必须 `golden-assert.mjs`（当前硬编码 parliament 句式，须按 `outputKind` 分流，spec §1 影响面⑤）；加断言「`goldenAssertion==='fail'` 时 replace 必须拒」并把它登记为 §8 #16 的实现缺口 |
| 7 TC-017 断言 8 不可达（P1） | TC-017 全文、§3 负例表、§7 缺口 | 拆三样本：A（when 尾「时」）→ 只 `WhenFormatViolation`；A′（when 无尾「时」但派生含「时时」）→ 只 `DescriptionDerivation`；B（notWhen 换词）→ 只有黄金比对能拦 |
| 8 TC-019 判据可执行（P1） | TC-019 判据、§7 缺口 | 改为可执行 node 脚本：**去注释 + 去字符串/模板字面量**后匹配；命中 0 → `wordlist-impl=absent` 且 exit 0；§7 补假阳性账「注释里提到『词表』必须仍绿」 |
| 9 TC-002 补判据 (f)（P1） | TC-002 步⑥/判据 (f) | 新增读冻结副本的按节逐字脚本（identity 两段 / heading / role / 9 条 fixedList / 7 节正文），输出 `verbatim PASS`；红绿证据逐条绑定判据号（(f)/(a)/(c)/(d)/(b)/(e)） |
| 10 TC-002 补「10 键必须全在」（P1） | TC-002 步⑤/判据 (a) | 加 `want.every(k => ks.includes(k))`；明写 `dimension` / `sharedBlock` 必须**显式 `undefined`**（否则删掉 heading/sourceLine 也能 exit 0） |
| 11 TC-004 输出串（P2） | TC-004 判据 | 删除「断言脚本输出 `notWhen refs valid: PASS`」；改为「exit 0 且打印 `refs=reviewer-qa`」，命令确实打印该串 |
| 12 TC-015 占位符（P2） | TC-015 判据 | 去掉 `'<NEW_SOURCE_LINE 逐字>'`；改为从 spec 第 97 行现取 NEW 进变量；正例「命中恰 1 次」，负例（内存变异）「命中 0 次」 |
| 13 六条负例补还原（P2） | TC-014/016/018/020/021/022/025/026 的「注入方式」行 | 逐条写明：TC-014/016/021/022 = **副本仓**；TC-020 = **单文件副本**；TC-018 = **内存变异**；TC-025 = **真仓备份/注入/还原（哈希校验）**；TC-026 = **副本仓（两次注入）**——真仓库全程零改动，无需还原 |
| 14 草稿链补齐（P2） | TC-012 前置/步⓪、TC-025 步①、TC-029 前置/步① | 三处都写明「先 `draft --kind agent --name senior-sdet` 并记录 `$draft`」，不再依赖 TC-011 的草稿（它收尾会清空） |
| 15 TC-031 before 快照来源证明（P2） | TC-031 前置/步①⑤ | 改为 `git show HEAD:...renderAgent.mjs` + 同目录 `patternRegistry.mjs` 落到 `$w2` 再 import（**完全不依赖执行时序**）；另加「两个 hash 必须不同，否则判 FAIL」的来源证明 |
| 16 §7 的 TC-026 口径（P2） | §7「干净」行、§3 负例表、TC-026 判据 | 拆开写：TC-012/013/028 期望 numstat 前两列 `1 1`；**TC-026 期望 numstat 空** |
| 17 TC-031 fixture 修正（P2） | TC-031 前置/固定 fixture/预期/不覆盖 | `sharedBlock` 改 `'AUDIT_RULES'`（唯一已实现）；全文「12 席无 when」改「**11 席**（`reviewer-product` 有 when 但为骨架）」；标题改「议会席模板渲染快照不回归（单 fixture 代表）」；不覆盖写「真 13 席字节待 S4」 |
| 18 TC-031 脚本自检（P2） | TC-031 判据「脚本自检」 | 加断言：fixture 的 role/dimension/tools 首项/fixedList[0]/sharedBlock 展开文本必须出现在产物里，否则脚本 exit 1 |
| 19 TC-031 红绿证据（P2） | TC-031 红绿证据 | 删「分流条件写成 `!== 'issue-card'` → 步⑤ 红」（步⑤ 只读数据不读分支条件）；改为「把 13 席分支改成整行直拼 → 快照 EQUAL 变 DIFF」 |
| 20 回归清单删 TC-030（P2） | §4 `agent-handwritten.md.tpl` 行 + 表下注 | 该行不再挂 TC-030；注明「模板改动由 TC-010/014/022 兜，TC-030 只在替换后跑」 |
| 21 TC-013 复用既有脚本（P2） | TC-013 步②③/判据 | 冷跑改 `node tools/docgen/acceptance/cold-run.mjs`（git 跟踪 + extras，**不含 `.git`**；删掉「含 .git」「缺 .git 不可信」）；崩溃恢复引 `replace-scenarios.mjs` 的 S3/S4，并在 §6「不测」写明「同段代码由代表席覆盖」 |
| 22 TC-002 / TC-007 去重（P2） | TC-007 全文 | 字段值断言全归 TC-002；TC-007 只留「when/route 从触发表读」「`heading !== role`」「断言号归因 7/8/9」 |
| 23 numstat 三列统一（P2） | 文件头【numstat 口径】、TC-012/013/026/028/§7 | 口径只在文件头定义一次；各处统一写「前两列 == `1 1` + 第三列文件名」 |
| 24 baseline 数字不写死（P2） | TC-008/TC-009/TC-013 判据 | 改正则 `^baseline (\d+)/\1$`；注明 `= BASELINE_RULES.length + agentPaths().length`（当前 35，随 baseline 变化） |
| 25 覆盖账口径（P2） | §1「覆盖核对」全节 + §6 | 改为诚实口径：逐条款普查 27 → 去重后 23 条独立规定；`R6` 恒真豁免不计可失败项 → 可失败 22/22；「模板复用定性」移入 §6「不测」 |
| 26 TC-027 补第五个 violation（P2） | TC-027 前置/步骤①/预期/判据 | 补 `TRAILING_NEWLINE`（尾 `\n\n`）样本；写明「每个样本只含一种违规」；预期五样本 5/5 |
| 27 模板纯度探针改从数据取值（P2） | TC-002 步③/判据 (c) | 删掉硬编码 4 个字符串；改为从 `agentData` 取 `heading`/`role`/`identity` 每个非空行/`fixedList` 每行/`sourceLine` 逐个搜模板，命中必须 0 |
| 28 TC-005/020 绑定到条目（P2） | 文件头【自评探针】、TC-005、TC-020 | 文件级 `Select-String` 改为「定位 `name: 'senior-sdet'` 行 → 断言其前 ≤15 行内存在含 `translation-self-check` + 「详细」+「逻辑化」的注释行」；TC-020 用同一探针打副本 |
| 29 常量自校验加机器命令（P2） | 文件头【常量自校验】 | 补一条可执行命令：读 spec 第 96/97 行数组下标 → 与本文件两个来源行常量 `===`（并按行前缀校验 `copies=1/1`），输出 `const-selfcheck: OLD=PASS NEW=PASS copies=1/1`，exit 0/1 |
| 30 TC-030 步② 措辞（P2） | TC-030 步②/判据 | 改为「断言 findings 不含 `CardNotFound` 与 `InvalidAnnotation` 两个假绿码；`A1/A2/B1–C4` 的 pending 码允许存在、不参与判定（`struct-red` 只数 A3–A7）」 |

**本次修订逐项落点（第 3 轮复核收尾 10 项 + QA N4）**：

| 项（来源） | 落点 | 改了什么 |
|---|---|---|
| 1 回归清单口径（FE-2-03 残留，P0） | §4 回归清单 `evidence.mjs` / `init-evidence.mjs` 行、`fixtures/senior-sdet.evidence.json` 行（**revision4 漏改，revision5 补齐**）、TC-001 判据④ | 两行的「必须重跑」栏都把 `TC-001` 整条列出（未区分 a/b，会连带触发 001a）→ 统一改为「重跑 **TC-001b**（只重锁 evidence）；**不得重跑 TC-001a**（冻结副本不可覆盖）」，并写清为什么（`init-evidence` 会把 `commit`/`blob` 指向迁移后版本 / 替换后的卡 → 黄金锚点当场失效）。另核全文：TC-001 判据④ 原写「重跑 TC-001a 步③」易被读成「重跑 001a」，改为「写到**另一个文件名**复算 + 旧件哈希不变（不是重跑 001a）」；其余「TC-001a」均为「前置 / 禁止重跑」语义，无需改 |
| 2 golden-assert 双重不兼容（N1，P1） | TC-001a 步⑤（细则）、TC-012 前置（结论 + 引用步⑤） | 写清两点：① `:18` 硬编码 `description.parliament` → 须按 `agent.outputKind` 分流到 `description.handwritten`；② `:24`/`:35` 整文件全等 → 须改 `diffSet` 并豁免 `{OLD_SOURCE_LINE, NEW_SOURCE_LINE}`；③ 修好前**退出码 1 属预期**（`renderSha256` 在 `:29` 已写盘），不得当「回填失败」。属施工（spec §1 影响面⑤ 已登记），用例只如实描述 |
| 3 TC-031 快照锚点（N1，P1） | TC-031 前置 / 步① / 步⑤ / 判据步⑤ | 锚点由 `HEAD` 改 **`evidence.commit`**；前置加「锚点有效性断言」（`renderAgent-diff=has-diff` 才可用）；锚点失效时兜底到「改动前、未提交态执行步①」并在账本记锚点；步⑤ 基准同步改为 `evidence.commit`；**revision6 复核补**：锚点有效性断言之前先跑 `git cat-file -e <commit>:<path>` 存在性检查（路径缺失 = 直走未提交态兜底，不得用 `git diff` 非空输出当存在性证明） |
| 4 TC-011 裸命令（BE-2-11，P2） | TC-011 前置/步⑤/判据、文件头【草稿箱隔离】、TC-013、TC-025、TC-028、TC-029（同类残留） | `draft rm` / `draft ls` / `draft` 一律写全 `node tools/docgen/cli.mjs draft <子命令>`（PowerShell 没有裸 `draft`） |
| 5 TC-026 账本判据（BE-2-12，P2） | TC-026 步③ / 判据、§3 负例表 TC-026 行 | 「账本该席状态 = 停损未迁」从**机器**降为**人工**，并写明落点 = **PRD §6.6 迁移状态账本表**；`state.json` 只接受 `replaced` / `suspended`（`state.mjs:9`），不接受 `停损未迁` |
| 6 TC-002 (f) 漏 role（NEW-3，P2） | TC-002 判据 (f) 命令 + 等值口径说明 + 红绿证据 | (f) 命令补 `role` 断言（冻结副本 `description:` 行须以 `role + '。'` 开头），与步⑥「identity / heading / role / 9 条 fixedList / 7 节正文」的声称对齐；红绿证据加一条 role 改词样本 |
| 7 席位计数（FE，P2） | TC-031 前置 | 「剩 1 席 reviewer-product 有 when」→「`triggerTable` 现有 3 条（`reviewer-audit` / `reviewer-product` / `senior-sdet`）；14 席里 **11 席无 `when`**；`reviewer-product` 可渲染但为骨架数据、代表不了议会席模板通用形态」 |
| 8 TC-010 步⑤ 无命令（FE，P2） | TC-010 步⑤ / 判据 | 补 node 命令：读冻结副本 → 把来源行 OLD 换成 NEW → `writeFileSync` 到 `$w2\sdet-normalized.md`；同命令把渲染写到 `$w2\sdet-render.md`；再做【字节比较】。**不依赖 PS 重定向** |
| 9 调用方清单统一（FE，P2） | 文件头【diffSet 判据命令】、TC-014/TC-016/TC-021 判据、§4 回归清单 `golden-assert.mjs` 行（同类残留） | 文件头声明「主判据调用方 = TC-010 / TC-014 / TC-016 / TC-021」，并注明 TC-022 / TC-026 属**辅助复用** `fail` 模式；TC-014/016/021 的判据正文逐个点名「对副本调 `diffSet`」（TC-010 原有）。**同类残留一并修**：`golden-assert.mjs` 的回填依赖方原写「TC-012、TC-016」→ 改为「TC-012、TC-025」（TC-016 不跑 golden-assert；TC-025 前置要求 `renderSha256` 已回填）。**spec §4 已列全四条（TC-010 / TC-014 / TC-016 / TC-021）+ TC-024 单测 helper 本体**（spec 第 164 行），本文件与 spec 口径一致；辅助复用两条（TC-022 步② / TC-026 步①②）只在本文件声明，不进 spec 的调用方清单 |
| 10 TC-031 fixture 标记串（QA N3，P2） | TC-031 固定 fixture / 判据「脚本自检」/ 红绿证据、§7「快照脚本自身的漏读」行 | `fixedList:['一','二']` → `['SDET_FIXTURE_ROW_1','SDET_FIXTURE_ROW_2']`；写明「探针串必须在模板与产物里唯一（`一` 本就在 `agent.md.tpl` 正文里 → 漏读 `fixedList` 仍绿）」 |
| 附 QA N4（P2） | TC-012 前置 / 附加判据 | 「`goldenAssertion='fail'` 时 replace 必须拒」这条负例明写**实现补齐前不可执行、登记为 plan 任务（§8 #16）**；今天跑必红属「未实现」，不是「用例失败」 |

| 计数影响 | 结论 |
|---|---|
| 新增 / 删除 TC 编号 | **无**（仍 TC-001 ~ TC-031；TC-001a/001b 是同一编号的两段步骤） |
| 用例总数 / 正 / 负 / 边界 | **31 / 15 / 15 / 1**（未变；负例+边界 16 ≥ 正例 15） |
| 重分类 | 无（TC-026 只是把**一条判据**从机器降为人工，用例类别仍是负例） |

**判据命令在 PowerShell 5.1 的可跑性自检结论**（逐类）：

| 类 | 结论 | 依据 |
|---|---|---|
| 全部 `node -e` / `node --input-type=module -e` 命令 | 可跑 | 命令内**不含 `"`、`` ` ``、`$`**——需要引号字符一律 `String.fromCharCode(34/39/96)`，需要换行一律 `String.fromCharCode(10)`；因此 PS 双引号串不会被截断 |
| `-e` 里的相对说明符（`./tools/...`） | 可跑 | `node -e` 的 ESM 解析基准 = **cwd**，文件头已规定起点三条命令 |
| `pathToFileURL(root + '/tools/...')` | 可跑 | 相对路径按 cwd 解析，配合 `$cp` 绝对路径两种用法都成立 |
| `Select-String -SimpleMatch` 检索 | 可跑 | `{{NOT_WHEN}}` 的 `{ }` 在正则里语义特殊，已强制 `-SimpleMatch` |
| 冻结 / 渲染产物写盘 | 可跑 | 只用 node `writeFileSync` / `execFileSync`；**禁用** PS `>`、`Out-File`、`git show --output` |
| 正则里含 `\n` / `[\s\S]` 的写法 | 可跑 | 一律写 `\\n` / `[\\s\\S]`（PS 不解析反斜杠，原样传给 node） |
| `Get-FileHash` / `Copy-Item` / `Join-Path` / `$env:` | 可跑 | PS 原生，pwsh 7 同名同参 |
| `npm run check` / `node --test ...` | 可跑 | 仓库既有脚本；`node --test` 在受限环境可能 stuck，替代验证见 §7（`GetDiagnostics` / `tsc --noEmit` 不适用于本仓 Node 纯 JS，故以脚本直跑为准） |
| 依赖 `diffSet` / `render13-snapshot.mjs` 的判据 | **当前不可跑，属未实现** | `diffSet` 待 spec §1 影响面④ 落地（未落地时报 `cmp.diffSet is not a function`）；快照脚本「待 plan Task N」——两者都不算绿，须在对应任务内落地后才可判 |
