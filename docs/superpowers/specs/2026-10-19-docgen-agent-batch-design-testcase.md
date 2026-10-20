# 测试用例：Docgen P2 · S4 余下 12 席批量数据搬家

> 归属 spec：`docs/superpowers/specs/2026-10-19-docgen-agent-batch-design.md`（**修订 3，2026-10-20**）
> 编写者：`senior-sdet`（本次修订实例 `sdet-2026-10-20-docgen-p2-s4-r3`，全新上下文）
> **独立性声明**：编写者 ≠ spec 作者 ≠ 施工者。本次修订在全新上下文完成，只依据 spec 修订 3 全文与实现现状（`tools/docgen/**`、`tools/execution-matrix/check-agent.mjs`、`scripts/check-all.mjs`、`rules/.inspector-annotations.json`、`agents/*.md` 现卡）自行核实判据；不从施工结果倒推，不采信转述结论当判据。spec 作者只能核对覆盖与提疑问，不得改写本文件判据。
> 状态：草稿（待评审；定稿 = 每条五要素齐 + 覆盖总表每行指回 R 编号/节号 + 负例与边界 ≥ 正例）
> 版本对应：初版 `sdet-2026-10-19-docgen-p2-s4`（28 条）→ 第 1 版 `…-r1`（对修订 1，33 条）→ 第 2 版 `…-r2`（对修订 2，37 条）→ **本版对修订 3（39 条）**。
> **本版相对第 2 版的变更（对应议会第 2 轮 9 组结论）**：① TC-018 ② 样本改为「全量 `agentData` + 只给 sdt 一张触发表」（旧样本撞断言 12，恒红）；② TC-106 前置改为复制真实 evidence + 补 `control` 对照模式 + 排除式断言；③ TC-113 判据引 spec §5-⑤（输出须含被检席名）；④ TC-017 边界断言改为「同一 test 体内 `不自行处置` 与 `## 边界` 共现」，TC-016 改相对判据（记录改前值）；⑤ 坏路径统一（`scripts/check-all.mjs:119`、`tools/docgen/templates/agent.md.tpl:27-29`）；⑥ 无共享块空行只在已迁 B 席上验（检查点 = `reviewer-product`）；⑦ 新增 TC-114（`cli-gate` 测试同步）与 TC-207（`pilot-render` 断言收窄）；⑧ 不写死 spec / 本文件行数（一律以命令输出为准）；⑨ fixedList 条数一律「由【ROWS】从快照节内现算」。
> 命名与落点：`spec-testcase-gate` 判据 1（同目录；spec 名去 `.md` + `-testcase.md`）
> 组织原则：按「**组合类别 + 检查点**」组织——A1 / A2 / B 各覆盖；前 3 席检查点单列；余 9 席用同一套判据 + 参数表，不按 12 席复制 12 份。

**SEATS_12（本文件唯一内联副本；席名逐字，取自 spec 修订 3 §3 组合表）**：

`reviewer-product reviewer-interaction reviewer-ui reviewer-frontend reviewer-backend reviewer-ops reviewer-qa reviewer-ai reviewer-security reviewer-actuary reviewer-reader detective-observer`

自校验：把上列 12 个席名**依次**作为参数接到命令末尾（`… -e "…" reviewer-product … detective-observer`）跑：
`node --input-type=module -e "const s=process.argv.slice(1);const u=new Set(s);console.log('seats='+s.length+' uniq='+u.size);process.exitCode=(s.length===12&&u.size===12)?0:1"`

**当前实现事实（2026-10-20 核对，用于判定「现状」列）**：

- `agentData` 里 12 席**都已有骨架条目**，键集只含 `tools name role dimension sharedBlock outputKind`（`agentData.mjs:23-34`）；**12 席均缺 `identity` / `fixedList`**。
- `triggerTable` 里 12 席只有 `reviewer-product` 一条 `when`（`agentData.mjs:65`，需按现卡校准），**其余 11 席在触发表里无条目**（≠ `agentData` 无条目：12 席都有骨架条目）。
- `sharedBlocks` 只有 `AUDIT_RULES`（`sharedBlocks.mjs:1-4`）；`outputFormats` 只有 `audit`（`outputFormats.mjs:1-51`）——四常量未落。
- `validateAgentData` 无断言 15（条目键集）；`cmdReplace`（`cli.mjs:218-224`）未校验 `compareResult`；`scripts/check-all.mjs:119` 只对 `reviewer-audit` 单席挂钩——三者均为 spec 修订 3 待施工项。
- `EvidenceInvalid` 的 `reason` 字段**不进 stderr**（`evidence.mjs:13-19` 把 code 当 message），故 stderr 上无法区分「字段非法 / golden 未过 / renderSha 不等」——TC-106 用 `control` 对照模式做归因（§8 建议 12）。
- `pilot-render.test.mjs:91-101` 的三连空行断言作用于**整卡**，且**没有**「恰一空行」断言；`cli-gate.test.mjs:11-20` 把已拆槽席 `generate` 硬编码为 exit 1（依赖迁移进度）——两者均为 §1-⑫ 待改写项。
- 模板槽位在 `tools/docgen/templates/agent.md.tpl:27-29`（27 = 通用纪律末条，28 = `{{SHARED_BLOCK}}`，29 = `## 边界`）；`renderAgent.mjs:4` 空值分支删掉「槽位行 + 其换行」。

**执行环境**：Windows + PowerShell（5.1 / pwsh 7 均可）。字节写盘只用 node `writeFileSync`；**禁** PS `>` / `Out-File` / `git show --output`；**禁** POSIX `grep`（检索用 `Select-String` 或 node）；PS 双引号串里**禁**反斜杠转义双引号（需要引号字符时用单引号或 `String.fromCharCode` 拼）。

**起点三条命令**（全文 cwd 与临时目录由此派生）：

```powershell
$repo = (git rev-parse --show-toplevel).Trim()
Set-Location $repo
$w2 = Join-Path ([IO.Path]::GetTempPath()) 's4-tc'
New-Item -ItemType Directory -Force $w2 | Out-Null
```

**判据命令代号**（用例正文只写代号 + 参数）：

| 代号 | 命令（参数：`<seat>` / `<seats...>` / `<out>`） | 判读 |
|---|---|---|
| 【WK】 | 整文件逐字节：渲染 vs `HEAD:agents/<seat>.md`（R4：12 席替换后字节不变，HEAD 恒为迁移前内容；前提由 TC-001 断言）。`node --input-type=module -e "const {execFileSync}=await import('node:child_process');const {renderByName}=await import('./tools/docgen/cli.mjs');const bad=[];for(const n of process.argv.slice(1)){const g=execFileSync('git',['show','HEAD:agents/'+n+'.md'],{encoding:'utf8'});const ok=Buffer.from(renderByName(n),'utf8').equals(Buffer.from(g,'utf8'));console.log(n+' '+(ok?'EQUAL':'DIFF'));if(!ok)bad.push(n)}console.log('wk seats='+process.argv.slice(1).length+' red='+bad.length);process.exitCode=bad.length?1:0" <seats...>` | exit 0 且 `red=0` |
| 【RENDER】 | 渲染按字节落盘（后续【CMP】/`Select-String` 用）。`node --input-type=module -e "const fs=await import('node:fs');const {renderByName}=await import('./tools/docgen/cli.mjs');const n=process.argv[1],out=process.argv[2];const b=Buffer.from(renderByName(n),'utf8');fs.writeFileSync(out,b);console.log('render '+n+' bytes='+b.length)" <seat> <out>` | exit 0 |
| 【SNAP】 | 把迁移前快照按字节落盘（TC-107 用，`git diff` 需要真实文件；**禁** `git show --output`）。`node --input-type=module -e "const fs=await import('node:fs');const {execFileSync}=await import('node:child_process');const n=process.argv[1],out=process.argv[2];fs.writeFileSync(out,execFileSync('git',['show','HEAD:agents/'+n+'.md']));console.log('snap '+n+' -> '+out)" <seat> <out>` | exit 0 |
| 【CMP】 | 两文件逐字节比较。`node -e "const fs=require('node:fs');const a=fs.readFileSync(process.argv[1]),b=fs.readFileSync(process.argv[2]);console.log(a.equals(b)?'EQUAL':'DIFF');process.exitCode=a.equals(b)?0:1" <A> <B>` | exit 0 = `EQUAL` |
| 【ROWS】 | fixedList 条数 == **迁移前快照「固定必问清单」节内**的 `\| N \|` 行数（不从整份快照数；spec §3 不存条数，一律现算）。`node --input-type=module -e "const {execFileSync}=await import('node:child_process');const {agentData}=await import('./tools/docgen/components/agentData.mjs');const NL=String.fromCharCode(10);const rowsOf=(s)=>{const L=s.split(NL);const i=L.findIndex(l=>/^## 固定必问清单/.test(l));if(i<0)return -1;let j=i+1;while(j<L.length&&!/^## /.test(L[j]))j++;return L.slice(i+1,j).filter(l=>/^\| \d+ \|/.test(l)).length};const bad=[];for(const n of process.argv.slice(1)){const g=execFileSync('git',['show','HEAD:agents/'+n+'.md'],{encoding:'utf8'});const rows=rowsOf(g);const e=agentData.find(a=>a.name===n);const got=e&&Array.isArray(e.fixedList)?e.fixedList.length:-1;if(rows!==got)bad.push(n+' snap='+rows+' data='+got)}console.log('rows red='+bad.length+' '+bad.join(' / '));process.exitCode=bad.length?1:0" <seats...>` | exit 0 |
| 【CONST】 | 四常量存在且逐字 == 迁移前快照切片（切片边界写在命令里，正文不复制；快照取 HEAD，不依赖 evidence）。`node --input-type=module -e "const {execFileSync}=await import('node:child_process');const {agentData}=await import('./tools/docgen/components/agentData.mjs');const {sharedBlocks:sb}=await import('./tools/docgen/components/sharedBlocks.mjs');const {outputFormats:of}=await import('./tools/docgen/components/outputFormats.mjs');const NL=String.fromCharCode(10);const snap=(n)=>execFileSync('git',['show','HEAD:agents/'+n+'.md'],{encoding:'utf8'});const cut=(s,a,b)=>{const i=s.indexOf(a);const j=i<0?-1:s.indexOf(b,i+1);return(i<0||j<0)?null:s.slice(i,j)};const fmt=(s)=>{const i=s.indexOf('## 输出格式');const st=s.indexOf(NL,i)+1;const j=s.indexOf(NL+NL+'## 通用纪律',st);return(i<0||j<0)?null:s.slice(st,j)};const res=[];for(const a of agentData.filter(x=>x.outputKind==='issue-card'))res.push(['issue-card:'+a.name,of['issue-card'],fmt(snap(a.name))]);const det='detective-observer';res.push(['observation',of.observation,fmt(snap(det))]);const six=['reviewer-frontend','reviewer-backend'].map(n=>cut(snap(n),NL+'### 六手法全过',NL+'## 边界'));res.push(['SIX_METHODS:frontend',sb.SIX_METHODS,six[0]]);res.push(['SIX_METHODS:backend',sb.SIX_METHODS,six[1]]);res.push(['DETECTIVE_RULES',sb.DETECTIVE_RULES,cut(snap(det),NL+'### 侦探处置表',NL+'## 边界')]);let red=0;for(const x of res){const ok=typeof x[1]==='string'&&x[1].length>0&&x[1]===x[2];if(!ok){red++;console.log('MISMATCH '+x[0])}else console.log('VERBATIM '+x[0])}console.log('const red='+red+' checks='+res.length);process.exitCode=red?1:0"` | exit 0 且 `red=0`（`checks` 由 `agentData` 现算：11 席 issue-card + observation + SIX_METHODS×2 + DETECTIVE_RULES） |
| 【TRIG】 | 12 席触发表：`when` 存在、`route`==席名、`notWhen`/`fallback` 均 undefined、键集恰 `route,when`。`node --input-type=module -e "const m=await import('./tools/docgen/components/agentData.mjs');const bad=[];for(const s of process.argv.slice(1)){const t=m.triggerTable[s];if(!t){bad.push(s+':no-entry');continue}if(!t.when)bad.push(s+':no-when');if(t.route!==s)bad.push(s+':route');if(t.notWhen!==undefined)bad.push(s+':notWhen');if(t.fallback!==undefined)bad.push(s+':fallback');const ks=Object.keys(t).sort().join(',');if(ks!=='route,when')bad.push(s+':keys='+ks)}console.log('trigger red='+bad.length+' '+bad.join(' / '));process.exitCode=bad.length?1:0" <seats...>` | exit 0 |
| 【DESC】 | 派生 `在议会评审中担任{role}。{when}时调用`（**判据 = spec §3 派生式 + 快照**，不调 `patternRegistry`，避免用实现证实现）逐字 == 快照 `description:` 行。`node --input-type=module -e "const {execFileSync}=await import('node:child_process');const m=await import('./tools/docgen/components/agentData.mjs');const NL=String.fromCharCode(10);const bad=[];for(const s of process.argv.slice(1)){const snap=execFileSync('git',['show','HEAD:agents/'+s+'.md'],{encoding:'utf8'});const d=(snap.split(NL).find(l=>l.startsWith('description: '))||'').slice(13);const role=(m.agentData.find(a=>a.name===s)||{}).role;const when=(m.triggerTable[s]||{}).when;if(d!=='在议会评审中担任'+role+'。'+when+'时调用')bad.push(s)}console.log('desc-derive red='+bad.length+' '+bad.join(','));process.exitCode=bad.length?1:0" <seats...>` | exit 0 |
| 【8KEY】 | 条目键集恰 8 键（不含四键）：`name role dimension tools identity fixedList sharedBlock outputKind`。`node --input-type=module -e "const m=await import('./tools/docgen/components/agentData.mjs');const want=['name','role','dimension','tools','identity','fixedList','sharedBlock','outputKind'];const bad=[];for(const s of process.argv.slice(1)){const e=m.agentData.find(a=>a.name===s);if(!e){bad.push(s+':missing');continue}const ks=Object.keys(e);const miss=want.filter(k=>!ks.includes(k));const extra=ks.filter(k=>!want.includes(k));if(miss.length||extra.length)bad.push(s+' miss='+miss.join('/')+' extra='+extra.join('/'))}console.log('entry-8keys red='+bad.length+' '+bad.join(' / '));process.exitCode=bad.length?1:0" <seats...>` | exit 0 |
| 【NOSHARE】 | 无共享块席的产物不含三块锚点（六手法 / 侦探处置表 / 审计铁律）。`node --input-type=module -e "const {renderByName}=await import('./tools/docgen/cli.mjs');const NL=String.fromCharCode(10);const A=['### 六手法全过','### 侦探处置表','### 审计铁律'];const bad=[];for(const n of process.argv.slice(1)){const r=renderByName(n);for(const a of A)if(r.includes(NL+a))bad.push(n+':'+a)}console.log('shared-block-free red='+bad.length+' '+bad.join(' / '));process.exitCode=bad.length?1:0" <seats...>` | exit 0 |
| 【NBLANK】 | 无共享块席「通用纪律末条」与 `## 边界` 之间**恰一个空行**（spec §3「无共享块分支」）。**只对已迁 B 席跑**（检查点 = `reviewer-product`；其余 8 席尚无 `when`，不可渲染，也不计红）。`node --input-type=module -e "const {renderByName}=await import('./tools/docgen/cli.mjs');const N2=String.fromCharCode(10,10),N3=String.fromCharCode(10,10,10);const bad=[];for(const n of process.argv.slice(1)){const r=renderByName(n);const i=r.indexOf('## 边界');const head=i<0?'':r.slice(0,i);const ok=head.endsWith('不自行处置'+N2)&&!head.endsWith(N3);if(!ok)bad.push(n+' tail='+JSON.stringify(head.slice(-24)))}console.log('noshare-blank red='+bad.length+' '+bad.join(' / '));process.exitCode=bad.length?1:0" <seats...>` | exit 0 且 `red=0` |
| 【EVID】 | evidence 锚点与状态（**只用于 evidence 自身断言，不当快照源**）。`node --input-type=module -e "const {execFileSync}=await import('node:child_process');const {readEvidence}=await import('./tools/docgen/evidence.mjs');const n=process.argv[1];const e=readEvidence(n);const c=execFileSync('git',['log','-1','--format=%H','--','agents/'+n+'.md'],{encoding:'utf8'}).trim();const b=execFileSync('git',['rev-parse',c+':agents/'+n+'.md'],{encoding:'utf8'}).trim();const ok=(e.commit===c&&e.blob===b&&e.compareResult===null);console.log('commit-ok='+(e.commit===c)+' blob-ok='+(e.blob===b)+' golden='+e.goldenAssertion+' compare='+JSON.stringify(e.compareResult)+' renderSha256='+e.renderSha256.slice(0,8));process.exitCode=ok?0:1" <seat>` | exit 0（换锚点后 `commit-ok` 为 false，属 TC-110 观测对象） |
| 【ANN】 | `checkAgentFile(<seat>).ok === true`，并拆 struct（A3–A7）/ semantic（十键）两类红。`node --input-type=module -e "const {checkAgentFile}=await import('./tools/execution-matrix/check-agent.mjs');const ST=['A3','A4','A5','A6','A7'];const bad=[];for(const n of process.argv.slice(1)){const r=checkAgentFile(n);const s=r.findings.filter(f=>ST.includes(f.code)).length;const m=r.findings.filter(f=>!ST.includes(f.code)).length;console.log(n+' ok='+r.ok+' structRed='+s+' semRed='+m);if(!r.ok)bad.push(n)}console.log('ann seats='+process.argv.slice(1).length+' red='+bad.length);process.exitCode=bad.length?1:0" <seats...>` | exit 0 |
| 【KEYS】 | 每席注解键恰 10 个、无缺无多（键格式 `席名:项`）。`node --input-type=module -e "const {readAnnotations,SEMANTIC_KEYS}=await import('./tools/execution-matrix/check-agent.mjs');const ann=readAnnotations();const bad=[];for(const s of process.argv.slice(1)){const ks=Object.keys(ann).filter(k=>k.startsWith(s+':'));const miss=SEMANTIC_KEYS.map(k=>s+':'+k).filter(k=>!Object.prototype.hasOwnProperty.call(ann,k));const extra=ks.filter(k=>!SEMANTIC_KEYS.includes(k.slice(s.length+1)));if(ks.length!==10||miss.length||extra.length)bad.push(s+' keys='+ks.length+' miss='+miss.length+' extra='+extra.length)}console.log('annotation-keys red='+bad.length+' '+bad.join(' / '));process.exitCode=bad.length?1:0" <seats...>` | exit 0 |
| 【STATE】 | state 的 `replaced` 席集合 == 期望集合（**既查缺也查多**；期望须含两席锚点 `reviewer-audit` / `senior-sdet`）。`node --input-type=module -e "const {readState}=await import('./tools/docgen/state.mjs');const a=process.argv;const i=a.indexOf('--expect');if(i<0){console.log('missing --expect');process.exit(2)}const want=[...new Set(a[i+1].split(',').filter(Boolean))].sort();const s=readState().agents;const rep=Object.keys(s).filter(k=>s[k]==='replaced').sort();const missing=want.filter(n=>!rep.includes(n));const extra=rep.filter(n=>!want.includes(n));console.log('replaced='+rep.length+' expect='+want.length+' missing=['+missing.join(',')+'] extra=['+extra.join(',')+']');process.exitCode=(missing.length||extra.length)?1:0" -- --expect 'a,b,c'` | exit 0 且 `missing=[] extra=[]`（期望值必须整体引号，`--` 终止 Node 自身选项解析） |
| 【AUDIT】 | 试点席金标未被动（evidence 走临时目录，不写仓库）。`$env:DOCGEN_EVIDENCE_DIR = Join-Path $w2 'audit-ev'; New-Item -ItemType Directory -Force $env:DOCGEN_EVIDENCE_DIR | Out-Null; Copy-Item tools/docgen/fixtures/reviewer-audit.evidence.json $env:DOCGEN_EVIDENCE_DIR; node tools/docgen/acceptance/golden-assert.mjs reviewer-audit; node tools/docgen/cli.mjs generate --kind agent --name reviewer-audit; node --test tools/docgen/test/pilot-render.test.mjs; Remove-Item Env:DOCGEN_EVIDENCE_DIR` | 三条 exit 0（用完即清 env） |

**副本仓**（注入类负例一律在副本里做，不碰工作区；副本不含 `.git`，只用于 replace / draft / generate / gate / test）：

```powershell
$cp = Join-Path $w2 'repo-copy'
node -e "const fs=require('node:fs');const {execFileSync}=require('node:child_process');const {dirname,join}=require('node:path');const dst=process.argv[1];fs.rmSync(dst,{recursive:true,force:true});const NL=String.fromCharCode(10);const files=execFileSync('git',['-c','core.quotePath=false','ls-files'],{encoding:'utf8'}).trim().split(NL);const extra=['tools/docgen/state.json','tools/docgen/state.mjs','tools/docgen/evidence.mjs','tools/docgen/components/sharedBlocks.mjs','tools/docgen/components/outputFormats.mjs','tools/docgen/components/renderAgent.mjs'];for(const f of new Set([...files,...extra])){if(!f||!fs.existsSync(f))continue;const o=join(dst,f);fs.mkdirSync(dirname(o),{recursive:true});fs.copyFileSync(f,o)}fs.mkdirSync(join(dst,'.drafts'),{recursive:true});console.log('copy-ready '+dst)" "$cp"
$env:DOCGEN_DRAFTS_DIR = Join-Path $cp '.drafts'
$env:DOCGEN_STATE_PATH = Join-Path $cp 'tools/docgen/state.json'
$env:DOCGEN_EVIDENCE_DIR = Join-Path $cp 'tools/docgen/fixtures'
```

副本内命令形如 `Set-Location $cp; node tools/docgen/cli.mjs generate --kind agent --name <seat>`；用完 `Set-Location $repo` 并清三个 env。**副本无 `.git` ⇒ `init-evidence` / `git show` / 【WK】在副本内不可用**：副本里只做「组件改坏后 `generate` 是否 drift」与「测试文件是否红」，evidence 一律从仓库 `tools/docgen/fixtures/` 复制（TC-106 前置）。

## 1 覆盖总表

| 用例 ID | 覆盖的 spec 条目 | 类别 / 检查点 | 正·负·边界 | 判据命令 | 现状 |
|---|---|---|---|---|---|
| TC-001 | R2 / R4 / §4 步 1 / §6-2 | 前置：数据源 = 迁移前现卡、工作区 == HEAD | 正 | git 双哈希（见正文） | 今天可跑 |
| TC-002 | R4 / §4 步 1 / §6-4 | 前置：每席 evidence 只跑一次 | 正 | init-evidence + 【EVID】 | 待施工后 |
| TC-003 | R8 / §3 四常量 / §5-③ | 常量：逐字 | 正 | 【CONST】 | 施工前必红 |
| TC-004 | R3 / §3 触发表 + 8 键 / §7-4 | 触发表 | 正 | 【TRIG】+【DESC】+【8KEY】 | 施工前必红 |
| TC-005 | §3 组合 A1 / §5-①③④ | 组合 A1（frontend / backend） | 正 | 【WK】+【ROWS】+【8KEY】 | 待施工后 |
| TC-006 | §3 组合 A2 / §5-①③④ | 组合 A2（detective-observer） | 正 | 【WK】+【ROWS】 | 待施工后 |
| TC-007 | §3 组合 B / §5-①④ | 组合 B（9 席） | 正 | 【WK】+【ROWS】+【NOSHARE】 | 待施工后 |
| TC-008 | §1 粒度 / §4.1-2 / R8 | 前 3 席检查点 | 正 | 【WK】+【CONST】+【AUDIT】+【NBLANK】+【ANN】+【STATE】 | 待施工后 |
| TC-009 | §5-① / §4 步 3、4 | 余 9 席逐席渲染 == 快照 | 正 | 【WK】（参数表） | 待施工后 |
| TC-010 | §5-② / R6 / §4 步 5 | 余 9 席 golden-assert | 正 | golden-assert + 【EVID】 | 待施工后 |
| TC-011 | R6 / R7 / §4 步 6–8 | draft → replace → numstat | 正 | draft + replace + numstat + 【STATE】 | 待施工后 |
| TC-012 | R5 / §5-⑤ | 12 席十键注解 | 正 | 【KEYS】+【ANN】 | 施工前必红 |
| TC-013 | R1 / §5-⑥ / §4 步 9 / §6-10 | 逐席巩固六要素 + 干净口径 | 正 | gate×2 + cold-run + check + 干净 | 待施工后 |
| TC-014 | §5-⑦ / §1 联动四问 | 试点与 S3 席不回归 | 正 | 【AUDIT】+ sdet golden/render | 今天可跑（sdet 部分） |
| TC-015 | §5 收口 / §6-1 | 14 席 replaced + gate + check-agents | 正 | 【STATE】+ gate + check-agents + check | 待施工后 |
| TC-016 | §1-⑫ / §6-12 | review-fixes 同批改（相对判据） | 正 | node --test + 计数不减 | 今天可跑应绿 |
| TC-017 | R8 / §3「无共享块分支」/ §5-③ | 无共享块席边界前恰一空行（只跑 reviewer-product） | 正 | 【NBLANK】+ 断言在位 | 今天必红（渲染器未修） |
| TC-018 | R3 / §7-4 / §6-3 | 断言 15 白名单分档不误伤 | 正 | validateAgentData 三样本 | 今天可跑应绿（旧样本恒红，见正文） |
| TC-101 | R8 负例 / §3 首尾空行 | 常量尾换行错 | 负 | 副本 generate | 待施工后 |
| TC-102 | R8 / §5-③ / 断言 5 边界 | 缺键 / 值互换 | 负 | 常量键集 + 副本 generate | 待施工后 |
| TC-103 | §3 组合互斥 / R8 副作用 | 误带 / 漏带 sharedBlock | 负 | validate + 副本 generate | 部分今天可跑 |
| TC-104 | R3 / 断言 7、10 / §7-4 | when 三违规 | 负 | 内存变异 validate | 今天可跑 |
| TC-105 | R3 / §3 条目 8 键 / §7-4 | 条目混入 when+route（断言 15） | 负 | 内存变异 validate | 施工前必红（断言 15 未落） |
| TC-106 | R6 / §6-5 / §4 步 7 | replace 五模式闸门（含 control） | 负 | 副本 replace ×5 | 待施工后（mismatch 施工前必绿=缺陷） |
| TC-107 | R7 / §6-6 / §7-6 | 卡字节变化 | 负 | 【SNAP】+ git diff --no-index | 待施工后 |
| TC-108 | R5 / 线 E §0.3 / §7-5 | 注解三态 + 键集 | 负 | judgeAnnotation + checkSemantic | 今天可跑应绿 |
| TC-109 | §1-⑫ / §6-1 | 不同批改 → 红 | 负 | node --test review-fixes | 待施工后 |
| TC-110 | R4 / §6-4 | 替换后重跑 init-evidence | 负 | init-evidence + replace | 待施工后 |
| TC-111 | R1 / §4.1 / §6-1 | 跳检查点 / 穿插 | 负 | 【STATE】+ 临时 state | 待施工后 |
| TC-112 | R2 负例 / §6-2 / §8 | 从 gen-agents 取源 | 负 | node 检索 + 存在性 | 今天可跑应绿 |
| TC-113 | R5 / §5-⑤ / §1-⑦ | 注解缺失未被 check 抓 | 负 | npm run check（删键前后） | 待施工后 |
| TC-114 | §1-⑫ / §6-12 / §4 步 3 | cli-gate 期望不依赖迁移进度 | 负 | 副本注入字节 + node --test | 待施工后 |
| TC-201 | §1 拆批判据①–④ | 拆批判定 | 边界 | 行数 + 模板分流 + 人工 | 今天可跑 |
| TC-202 | §4 步 1 / cli.mjs 未拆槽语义 | 迁移中段 registered 席 | 边界 | gate + generate + check-agents | 今天可跑 |
| TC-203 | §1-⑫ / 全拆槽终态 | 无 registered 样本 | 边界 | 14/14 when + 进程内合成 | 待施工后 |
| TC-204 | §3 fixedList / §5-① | 条数边界 | 边界 | 【ROWS】+ 内存变异 | 部分待施工后 |
| TC-205 | R3 / 断言 10 / §7-4 | when 同构不误判 | 边界 | 唯一性 + 变异 | 今天可跑（负向） |
| TC-206 | §3 fixedList 判据 / 【ROWS】口径 | 整份计数口径缺陷判别 | 边界 | 节内 vs 整份计数差 | 今天可跑 |
| TC-207 | §1-⑫ / §6-12 / §5-③ | pilot-render 断言收窄区间 | 边界 | 计数不减 + 变异红 | 改前必红 |

**计数**：用例 **39** 条 = 正 **18**（TC-001…TC-018）+ 负 **14**（TC-101…TC-114）+ 边界 **7**（TC-201…TC-207）；**负例 + 边界 = 21 ≥ 正例 18** ✓。编号一经分配不改号、不重排（新增用例一律取新号）。

## 2 用例明细

### 2.1 公共前置与数据源（R2 / R4）

#### TC-001 12 席前置：卡已提交、源已退役、在 baseline 内

- **覆盖**：R2 + R4（HEAD 快照的前提）+ §4 步 1（`git hash-object` == `git rev-parse HEAD:…`）+ §6-2
- **前置**：`$repo` / `$w2` 就绪；本用例只读 git，不做 git 写操作
- **步骤**：① 逐席比较 `git hash-object agents/<seat>.md` 与 `git rev-parse HEAD:agents/<seat>.md`；② 断言 `skills/parliament/scripts/gen-agents.mjs` **不存在**；③ 断言 12 席均在 `agentPaths()`（baseline 清单）内
- **预期**：12 席两哈希全等（工作区 == HEAD）；gen-agents 不存在；12 席都在 baseline
- **判据**：`node --input-type=module -e "const {execFileSync}=await import('node:child_process');const fs=await import('node:fs');const {agentPaths}=await import('./tools/docgen/components/baseline.mjs');const seats=process.argv.slice(1);const base=agentPaths();const bad=[];for(const n of seats){const h=execFileSync('git',['hash-object','agents/'+n+'.md'],{encoding:'utf8'}).trim();const r=execFileSync('git',['rev-parse','HEAD:agents/'+n+'.md'],{encoding:'utf8'}).trim();if(h!==r)bad.push(n+':uncommitted');if(!base.includes('agents/'+n+'.md'))bad.push(n+':not-baseline')}if(fs.existsSync('skills/parliament/scripts/gen-agents.mjs'))bad.push('gen-agents-still-exists');console.log('ready='+(seats.length-bad.length)+' bad='+bad.join(','));process.exitCode=bad.length?1:0" <SEATS_12>` → exit 0 且 `bad=` 空
- **红绿**：红 = 某席有未提交改动（则 `HEAD:agents/<席>.md` 不是迁移前内容，【WK】【CONST】全部失去锚点）或 gen-agents 被捡回（双源）；绿 = 两哈希全等 + 文件不存在
- **现状**：今天可跑；不绿即前置未满足（先让用户决定提交方式，不是功能失败）

#### TC-002 每席 evidence 只跑一次，锚点指向迁移前提交

- **覆盖**：R4（快照锚点 = 迁移前提交）+ §4 步 1 + §6-4
- **前置**：TC-001 绿；`DOCGEN_EVIDENCE_DIR` 未指向临时目录（用仓库 `tools/docgen/fixtures`）
- **步骤**：① 对 SEATS_12 **逐席、按 §4.1 顺序** 执行一次 `node tools/docgen/acceptance/init-evidence.mjs <seat>`；②【EVID】逐席断言 `commit` == `git log -1 --format=%H -- agents/<seat>.md`、`blob` == `git rev-parse <commit>:agents/<seat>.md`、`goldenAssertion=pending`、`renderSha256=pending`
- **预期**：12 个 `<seat>.evidence.json`；锚点各指本席最近一次提交；两个 pending 是「尚未跑黄金断言」的合法初值
- **判据**：init-evidence 每席 exit 0 且 stdout `evidence 已写入：<seat>`；【EVID】exit 0（此时 `golden=pending`）
- **红绿**：红 = 照抄 `reviewer-audit.evidence.json`（commit 属于别的席）→ `commit-ok=false`；绿 = 12 席锚点各自正确
- **现状**：待施工后；**一次一次跑**，不要先批量初始化再回头替换（顺序由 TC-111 见证）

#### TC-112 负：从 gen-agents 取源 / 双源残留

- **覆盖**：R2 负例 + §6-2 + §8（旧生成器已不存在）
- **前置**：无
- **步骤**：① 在 `tools/docgen/components/*.mjs` 检索 `gen-agents`（数据源引用）；② 断言 `skills/parliament/scripts/gen-agents.mjs` 不存在
- **预期**：0 命中 + 文件不存在（数据源只能是现卡）
- **判据**：`node -e "const fs=require('node:fs');const p=require('node:path');const d='tools/docgen/components';const hits=[];for(const f of fs.readdirSync(d)){if(!f.endsWith('.mjs'))continue;if(fs.readFileSync(p.join(d,f),'utf8').includes('gen-agents'))hits.push(f)}const gone=!fs.existsSync('skills/parliament/scripts/gen-agents.mjs');console.log('hits='+hits.length+' gen-agents-gone='+gone);process.exitCode=(hits.length===0&&gone)?0:1"` → exit 0 且 `hits=0 gen-agents-gone=true`
- **红绿**：红 = 有人把 gen-agents 捡回来当源（文件存在或组件引用）；绿 = 0 命中 + 文件不存在
- **现状**：今天可跑并应绿（`checkall.test.mjs`、`e2e-final.test.mjs` 已断言退役）

### 2.2 四个共享常量与无共享块分支（R8）

#### TC-003 正：四个常量存在且逐字 == 迁移前快照切片

- **覆盖**：R8 + §3「四个缺失常量」+ §5-③
- **前置**：`sharedBlocks` 有 `SIX_METHODS` / `DETECTIVE_RULES`，`outputFormats` 有 `issue-card` / `observation`；TC-001 绿（HEAD 可当快照）
- **步骤**：①【CONST】用固定切片边界从 `HEAD:agents/<席>.md` 取四段与常量逐字比较——共享块 = `\n### <块标题>` 到其后第一处 `\n## 边界`；输出格式 = `## 输出格式\n` 之后到 `\n\n## 通用纪律`（**正文不复制，边界即判据**）；② 同一常量在 11 席 issue-card 快照上必须一致
- **预期**：`checks` 条全部 `VERBATIM`（条数由 `agentData` 现算，不写死）；这同时钉住常量的首尾空行与结尾 `\n`
- **判据**：【CONST】exit 0 且 `const red=0`
- **红绿**：红 = 常量少一个结尾 `\n` / 多一个空行 / 抄成别席的块 → 对应行 `MISMATCH`；绿 = 全 `VERBATIM`
- **现状**：施工前必红（`sharedBlocks.mjs:1-4` 只有 `AUDIT_RULES`，`outputFormats.mjs:1-51` 只有 `audit`）

#### TC-017 正：无共享块席「通用纪律末条」与 `## 边界` 之间恰一空行

- **覆盖**：R8 + §3「无共享块分支」+ §5-③ + §1-④
- **前置**：无（`reviewer-product` 今天已可渲染：它在 `triggerTable` 有 `when`，`agentData` 有骨架条目）
- **步骤**：①【NBLANK】**只传 `reviewer-product`**（检查点唯一已迁 B 席；spec §4.1-2 明确「无共享块空行只在已迁 B 席上验」，其余 8 席尚无 `when`、不计红）；② 断言 `pilot-render.test.mjs` 已补这条断言（同批改动，完整判别见 TC-207）；③【AUDIT】证共享块非空分支与试点金标未被这次修渲染器改坏
- **预期**：① `red=0`；② 测试文件里**同一条断言/test 体内**同时出现 `不自行处置` 与 `## 边界`（或含转义字面 `\n\n## 边界`），而不是全文任意位置各出现一次；③ 三条 exit 0
- **判据**：【NBLANK】exit 0；`node -e "const fs=require('node:fs');const s=fs.readFileSync('tools/docgen/test/pilot-render.test.mjs','utf8');const bodies=s.split(/^test\(/m).slice(1);const hit=bodies.filter(b=>(b.includes('不自行处置')&&b.includes('## 边界'))||b.includes('\\n\\n## 边界'));console.log('boundary-assert-bodies='+hit.length);process.exitCode=hit.length>=1?0:1"` exit 0；【AUDIT】exit 0
- **红绿**：红 = `fill` 把 `{{SHARED_BLOCK}}` 独占行连同换行整段删掉 → 末条纪律与 `## 边界` 直接相邻（`head.endsWith` 为 false，输出里能看到 tail）；绿 = 恰一空行
- **现状**：**今天必红（渲染器未修），只跑 `reviewer-product`**——`renderAgent.mjs:4` 的 `value === ''` 分支做 `replaceAll(key+换行,'')`，`agent.md.tpl:27-29` 的槽位前后无空行，故空值席少一个空行（现行 `pilot-render.test.mjs:91-101` 只断言「不出现连续三空行」，抓不到「少一个空行」）
- **备注**：这是渲染器语义缺陷 → 按 §1「不触发拆批的特例」回炉改渲染器、重跑 `pilot-render` / `sdet-render` / `render13-snapshot` 三件，不拆批；**判据只看产物（恰一空行），不看实现取什么值**（spec 修订 3 §3 已明确：只删占位符、保留该行换行，不得把值写成 `\n`）

#### TC-101 负：常量尾换行 / 空行错 → 该组合每一席逐字节红

- **覆盖**：R8 负例（首尾空行与结尾 `\n`）+ §3「任一常量错都会让该组合的每一席逐字节红」
- **前置**：TC-003 绿；【副本仓】就绪
- **步骤**：① 副本仓内删掉 `sharedBlocks.SIX_METHODS` 末尾一个 `\n`（node 写盘）；② `generate --kind agent --name reviewer-frontend`、`--name reviewer-backend`
- **预期**：两席都 drift（同一常量错，组合内每席都红），exit 1
- **判据**：两条 generate 均 exit 1；把常量复原后两条均 exit 0
- **红绿**：红 = exit 1（这就是期望）；若某席仍 exit 0 → 该席根本没用到该常量（组合接错，回到 TC-005）
- **现状**：待施工后（常量存在后才有意义）

#### TC-102 负：常量缺键 / 值互换

- **覆盖**：R8 负例 + 断言 5 的边界（只查 `patternRegistry` 名单，不查常量对象）
- **前置**：TC-003 绿；【副本仓】就绪
- **步骤**：① 副本仓删掉 `outputFormats['observation']`，生成 detective-observer；② 副本仓令 `issue-card` 与 `observation` 值互换，生成 reviewer-product 与 detective-observer
- **预期**：① generate exit 1（格式节渲染成空）；② 两组合同时红
- **判据**：① `node --input-type=module -e "const {sharedBlocks}=await import('./tools/docgen/components/sharedBlocks.mjs');const {outputFormats}=await import('./tools/docgen/components/outputFormats.mjs');const need=[['sharedBlocks','SIX_METHODS'],['sharedBlocks','DETECTIVE_RULES'],['outputFormats','issue-card'],['outputFormats','observation']];const box={sharedBlocks,outputFormats};const miss=need.filter(x=>typeof box[x[0]][x[1]]!=='string'||box[x[0]][x[1]].length===0);console.log('missing='+JSON.stringify(miss));process.exitCode=miss.length?1:0"` 在副本内 exit 1 且 `missing` 含 `observation`；② 两条 generate exit 1
- **红绿**：红 = 缺键时 `validateAgentData` 仍绿（`validateAgentData.mjs:44-51` 只查名单），只有逐字节红 → 证明「validate 绿 ≠ 常量齐」；绿 = 键齐后全绿
- **现状**：待施工后

### 2.3 触发表与条目形状（R3）

#### TC-004 正：12 席触发表 + reviewer-product 校准 + 条目 8 键

- **覆盖**：R3 + §3「触发表（11 席新增，reviewer-product 校准）」+ 条目 8 键 + §7-4
- **前置**：12 席条目与触发表已按 §3 落位；TC-001 绿
- **步骤**：①【TRIG】断言 12 席条目形状（`when` 非空、`route`==席名、`notWhen`/`fallback` 均 undefined、键集恰 `route,when`）；②【DESC】派生 description 逐字 == 快照 `description:`；③【8KEY】条目键集恰 8 键
- **预期**：三项全绿；`reviewer-product` 既有 `when` 也必须逐字对齐现卡（「原来就有」不等于「对」）
- **判据**：【TRIG】exit 0；【DESC】exit 0；【8KEY】exit 0
- **红绿**：红 = 某席 when 抄成别席（格式合法，【TRIG】仍绿）→ 只有【DESC】红，说明 DESC 才是逐字判据；绿 = 三项 0 红
- **现状**：施工前必红——12 席均为骨架条目（缺 `identity`/`fixedList`，【8KEY】报 `miss=identity/fixedList`）；`triggerTable` 只有 `reviewer-product` 有 `when`（需校准），其余 11 席触发表无条目（【TRIG】报 `no-entry`）

#### TC-104 负：when 三违规样本（尾「时」/整句 / 两席相同）

- **覆盖**：R3 负例 + 断言 7（`WhenFormatViolation`）+ 断言 10（`DuplicateWhen`）+ §7-4
- **前置**：无（纯内存变异，改完即弃）
- **步骤**：① 克隆 `agentData` + `triggerTable`，令某席 when 以「时」结尾；② 令 when 为整句 description（含「在…中担任」「时调用」）；③ 令某席 when 等于 `reviewer-product` 的 when；④ 分别跑 `validateAgentData`
- **预期**：① `WhenFormatViolation`；② `WhenFormatViolation`；③ `DuplicateWhen`
- **判据**：`node --input-type=module -e "const {validateAgentData}=await import('./tools/docgen/components/validateAgentData.mjs');const {agentData,triggerTable}=await import('./tools/docgen/components/agentData.mjs');const run=(mut)=>{const d=structuredClone(agentData),t=structuredClone(triggerTable);mut(t);try{validateAgentData(d,t);return 'GREEN'}catch(e){return e.code}};const r1=run(t=>{t['reviewer-qa']={when:'当主持人调度对 spec/plan/技术方案做测试视角评审时',route:'reviewer-qa'}});const r2=run(t=>{t['reviewer-qa']={when:'在议会评审中担任测试评委。当主持人调度对 spec/plan/技术方案做测试视角评审时调用',route:'reviewer-qa'}});const r3=run(t=>{t['reviewer-qa']={when:t['reviewer-product'].when,route:'reviewer-qa'}});console.log('tail-shi='+r1+' whole='+r2+' dup='+r3);process.exitCode=(r1==='WhenFormatViolation'&&r2==='WhenFormatViolation'&&r3==='DuplicateWhen')?0:1"` → exit 0
- **红绿**：红 = 三个变异中有任一返回 GREEN（守卫失效）；绿 = 三码如预期
- **现状**：今天可跑并应绿（断言 7 在 `validateAgentData.mjs:52-56`，断言 10 在 `:74-80`）

#### TC-105 负：条目混入 `when` + `route`（断言 15）

- **覆盖**：R3（四键只住触发表 + 新增运行时审判者）+ §3 条目 8 键 + §7-4
- **前置**：无（纯内存变异）
- **步骤**：① 基线：未变异 `agentData` 跑 `validateAgentData` 必须 `GREEN`；② 变异：克隆后给 **`reviewer-audit`**（8 键完整条目）注入 `when` 与 `route`；③ 再跑，必须抛出（不再 GREEN），记录错误码
- **预期**：`before=GREEN after=<非 GREEN>`；错误码建议 `TriggerFieldMisplaced`（spec 未定名，判据只要求「抛错且码非空」）
- **判据**：`node --input-type=module -e "const {validateAgentData}=await import('./tools/docgen/components/validateAgentData.mjs');const {agentData,triggerTable}=await import('./tools/docgen/components/agentData.mjs');const run=(d)=>{try{validateAgentData(d,structuredClone(triggerTable));return 'GREEN'}catch(e){return e.code}};const before=run(structuredClone(agentData));const d=structuredClone(agentData);const a=d.find(x=>x.name==='reviewer-audit');a.when='当议会评审需要过程标准核对';a.route='reviewer-audit';const after=run(d);console.log('before='+before+' after='+after);process.exitCode=(before==='GREEN'&&after!=='GREEN'&&typeof after==='string')?0:1"` → exit 0
- **红绿**：红 = 注入后仍 `GREEN`（无审判者，四键可静默塞进条目）；绿 = 注入即抛、基线仍绿
- **样本为什么必须是 `reviewer-audit`**：`reviewer-ui` 缺 `identity`/`fixedList`，变异前就红 —— 样本恒绿无法证明「注入导致的红」；`reviewer-audit` 8 键完整，前后对照才成立
- **现状**：**施工前必红**——`validateAgentData.mjs:25-100` 无条目键集断言（只有 `:34` 拦独立 `description`），注入后必然仍 GREEN

#### TC-018 正：断言 15 的白名单按 `outputKind` 分档，不误伤已巩固席与施工中段

- **覆盖**：R3（「testcase 席白名单含 `heading` / `sourceLine`」）+ §7-4 + §6-3
- **前置**：断言 15 已落（spec §1-⑤）
- **步骤**：① 真实 14 席数据全量跑 `validateAgentData` → 必须 GREEN；② **全量 `agentData` + 只给 `senior-sdet` 一张触发表**（`run(m.agentData, {'senior-sdet': m.triggerTable['senior-sdet']})`）→ 必须 GREEN（意图 = 只验 sdt 的键集：`heading`/`sourceLine` 允许、`dimension: undefined` 允许）；③ 全量数据 + **空触发表**（无任何席被当作已拆槽，骨架席走「施工中段」路径）→ 必须 GREEN（不因「缺 identity/fixedList」被误杀）
- **预期**：三样本全 GREEN；`sdetKeys` 打印出 `heading`/`sourceLine` 在位
- **判据**：`node --input-type=module -e "const {validateAgentData}=await import('./tools/docgen/components/validateAgentData.mjs');const m=await import('./tools/docgen/components/agentData.mjs');const run=(d,t)=>{try{validateAgentData(d,t);return 'GREEN'}catch(e){return e.code}};const real=run(m.agentData,m.triggerTable);const t1={};t1['senior-sdet']=m.triggerTable['senior-sdet'];const one=run(m.agentData,t1);const two=run(m.agentData,{});const sdet=m.agentData.find(a=>a.name==='senior-sdet');console.log('real='+real+' sdet='+one+' skeleton='+two+' sdetKeys='+Object.keys(sdet).sort().join(','));process.exitCode=(real==='GREEN'&&one==='GREEN'&&two==='GREEN')?0:1"` → exit 0
- **红绿**：红 = 断言 15 写成「键集必须恰 8 键」→ `senior-sdet` 因 `heading`/`sourceLine` 被误杀，或骨架条目因「缺必填」被误杀（施工中段全仓红）；绿 = 只禁四键 + 按 `outputKind` 给白名单上界
- **现状**：**修正样本前恒红**——旧样本只喂 `senior-sdet` 一条数据，而 sdt 的 `notWhen.refs=['reviewer-qa']`（`agentData.mjs:69`）不在那份键集里 → 断言 12（`TriggerConflict`，`validateAgentData.mjs:83-88`）必抛，跟断言 15 无关；改喂**全量数据 + 单张触发表**后，refs 有着落，样本才只验 sdt 键集。守卫未落时本用例也不误红（今天应绿）
- **备注**：本用例只防误伤，检出半边在 TC-105，两者必须成对存在

### 2.4 三种组合（A1 / A2 / B）

#### TC-005 正：组合 A1（reviewer-frontend + reviewer-backend）

- **覆盖**：§3 组合 A1（SIX_METHODS + issue-card）+ §5-①③④
- **前置**：两席已逐席走完 TC-009~TC-011 的对应步骤（state=replaced）
- **步骤**：①【8KEY】两席；②【WK】两席整文件 == 迁移前快照；③【ROWS】fixedList 条数 == 快照「固定必问清单」节内行数
- **预期**：两席 `EQUAL`；条数与快照节内行数一致（spec §3 不存条数，一律现算；整份快照数**不是**判据，见 TC-206）；同一 SIX_METHODS 常量在两席产物中逐字相同
- **判据**：【WK】exit 0 `wk seats=2 red=0`；【ROWS】exit 0；【8KEY】exit 0
- **红绿**：红 = 少/多一条清单 → 整文件红（不是 validate 红：validate 不查条数）；绿 = 两席 EQUAL
- **现状**：待施工后

#### TC-006 正：组合 A2（detective-observer）

- **覆盖**：§3 组合 A2（DETECTIVE_RULES + observation）+ §5-①③④
- **前置**：该席已走完闭环（state=replaced）；TC-003 已绿（常量就位）
- **步骤**：①【WK】；②【ROWS】；③ 断言产物含「侦探处置表」节且不含「六手法全过」「审计铁律」
- **预期**：整文件 `EQUAL`；条数由【ROWS】现算；共享块与输出格式都用 detective 自己那套，不串到 issue-card
- **判据**：【WK】exit 0 `wk seats=1 red=0`；【ROWS】exit 0；【RENDER】落 `$w2/detective.md` 后 `(Select-String -Path (Join-Path $w2 'detective.md') -Pattern '### 侦探处置表' -SimpleMatch).Count -eq 1`
- **红绿**：红 = observation 被渲染成 issue-card 的八字段表 → 【WK】红；绿 = EQUAL
- **现状**：待施工后

#### TC-007 正：组合 B 9 席（无 sharedBlock + issue-card）

- **覆盖**：§3 组合 B（product / interaction / ui / ops / qa / ai / security / actuary / reader）+ §5-①④
- **前置**：9 席逐席闭环完成
- **步骤**：①【WK】9 席；②【ROWS】9 席；③【NOSHARE】9 席产物不得出现三个共享块锚点；④【NBLANK】边界前恰一空行（最小样本在 TC-017）
- **预期**：9 席 `EQUAL`；条数与各自快照节内行数一致；产物无共享块且边界空行正确
- **判据**：【WK】exit 0 `wk seats=9 red=0`；【ROWS】exit 0；【NOSHARE】exit 0；【NBLANK】exit 0
- **红绿**：红 = 某席误带 sharedBlock → 产物多出一块 → 【WK】与【NOSHARE】双红（validate 仍绿，见 TC-103）；绿 = 四项 0 红
- **现状**：待施工后（④ 只有已迁的 B 席能跑：检查点后逐席追加，不要求 9 席同时可渲染）

#### TC-103 负：共享块误带 / 漏带（validate 绿，渲染红）

- **覆盖**：§3 组合互斥 + R8「副作用」+「validate 绿 ≠ 渲染绿」
- **前置**：TC-003 绿；【副本仓】就绪
- **步骤**：① 内存变异：`reviewer-frontend.sharedBlock = undefined` → `validateAgentData` 必须**不报错**（断言 5 对 `undefined` 跳过，`:47`）；② 副本仓给 `reviewer-ui` 加 `sharedBlock='SIX_METHODS'` → validate 仍绿；③ 副本仓对两席 `generate`
- **预期**：① 输出 `validate=GREEN`；② generate exit 1；③ 两席都 drift
- **判据**：① `node --input-type=module -e "const {validateAgentData}=await import('./tools/docgen/components/validateAgentData.mjs');const {agentData,triggerTable}=await import('./tools/docgen/components/agentData.mjs');const d=structuredClone(agentData);d.find(a=>a.name==='reviewer-frontend').sharedBlock=undefined;try{validateAgentData(d,triggerTable);console.log('validate=GREEN')}catch(e){console.log('validate='+e.code)}"` 输出 `validate=GREEN`（证明 validate 放行）；② 两条 generate exit 1（证明只有逐字节能抓）
- **红绿**：红 = 有人把「validate 通过」当组合正确 → 字节红无人看；绿 = 组合一律以【WK】为准
- **现状**：validate 半边今天可跑；字节半边待施工后

### 2.5 前 3 席检查点与拆批判据（§1、§4.1）

#### TC-008 正：前 3 席检查点（必须停一次）

- **覆盖**：§1「粒度 = 一份 spec + 前 3 席代表检查点」+ §4.1-2 + R8（常量先落并锁住）
- **前置**：`reviewer-product`（B）→ `reviewer-frontend`（A1）→ `detective-observer`（A2）三席已按序走完闭环；余 9 席尚未开工
- **步骤**：①【WK】三席；②【CONST】四常量；③【AUDIT】三件套 +【NBLANK】**参数 = `reviewer-product`**（spec §4.1-2：无共享块空行只在已迁 B 席上验）；④【ANN】三席 + `checkAgentFile('reviewer-audit').ok === true`；⑤【STATE】断言 replaced 集合恰为「两席锚点 + 这三席」
- **预期**：五项全绿才允许进余 9 席；其余 8 席尚无 `when`、不要求可渲染，**不得因此判检查点红**；任一不成立 → 按 §1 拆批判据处置（渲染器语义缺陷走「回炉不拆批」特例）
- **判据**：①–④ 全部 exit 0；⑤【STATE】`--expect 'reviewer-audit,senior-sdet,reviewer-product,reviewer-frontend,detective-observer'` → exit 0 且 `missing=[] extra=[]`
- **红绿**：红 = 三席都绿但 reviewer-audit 红（常量填错波及试点）→ 此刻只改了 3 席，代价可控；绿 = 五项全绿
- **现状**：待施工后（检查点是「停一次」的关口，跳过即 TC-111）

#### TC-201 边界：拆批判据四条

- **覆盖**：§1 粒度与拆批判据 ①–④（含「渲染器语义缺陷 → 回炉不拆批」特例）
- **前置**：无
- **步骤**：① 模板/常量共用：读 `renderByName` 的分流条件（`cli.mjs:291` 只在 `outputKind === 'testcase'` 时换模板，12 席均非 testcase）；② spec 行数 ≤ 250；③ 本文件行数 ≤ 700；④「议会指出某条设计波及 12 席」由议会判定（人判）；⑤ 若检查点暴露的只是渲染器/模板语义缺陷（如 TC-017）→ 走特例，不拆批
- **预期**：①②③ 全过 + ④ 无 → 不拆批；任一触发（且不属于 ⑤ 特例）→ 拆两批（6+6）重新送审，且本文件同步拆
- **判据**：`(Get-Content docs/superpowers/specs/2026-10-19-docgen-agent-batch-design.md).Count -le 250`；`(Get-Content docs/superpowers/specs/2026-10-19-docgen-agent-batch-design-testcase.md).Count -le 700`；`(Select-String -Path tools/docgen/cli.mjs -Pattern 'agent-handwritten.md.tpl' -SimpleMatch).Count -eq 2`（两处分别是 `readTemplate` 的 rule/agent 分支与 `renderByName` 的 testcase 分支，均不对 12 席生效；出现第三处 = 多了分流点）。**行数一律以命令输出为准，本文件不写死数字**
- **红绿**：红 = 任一条触发却继续按 12 席推进；绿 = 三条机器判据全过 + 议会未提④
- **现状**：今天可跑

#### TC-111 负：跳过检查点 / 跨席穿插

- **覆盖**：R1（逐席串行、逐席巩固、前 3 席过关才进余 9 席）+ §4.1 + §6-1
- **前置**：已进入施工；`tools/docgen/state.json` 可读
- **步骤**：① 正常检查点：直接跑【STATE】`--expect` 两席锚点 + 三席检查组；② 违例构造（不碰真实 state）：`$env:DOCGEN_STATE_PATH = Join-Path $w2 'state-checkpoint.json'`，写一份 `reviewer-audit`/`senior-sdet`/`reviewer-product`/`reviewer-frontend`/**`reviewer-ui`** 为 `replaced` 的 state，再跑同一【STATE】命令；③ 清 `$env:DOCGEN_STATE_PATH`
- **预期**：① exit 0；② exit 1 且 `missing=[detective-observer] extra=[reviewer-ui]`（第 4 席抢跑被集合断言抓出，不只是「数够 3 个」）
- **判据**：① exit 0 `missing=[] extra=[]`；② exit 1 且 stdout 含 `extra=[reviewer-ui]`；`$env:DOCGEN_STATE_PATH` 用完即清
- **红绿**：红 = 「只数个数」式断言（3 席已 replaced 即放行，混入 reviewer-ui 也绿）；绿 = 集合相等
- **现状**：待施工后；更细的席序（product → frontend → detective）由人工在交付说明里逐条对账

### 2.6 余 9 席（同一套判据 + 参数表）

**参数表（余 9 席，按 §4.1-3 顺序；只列席名与组合，条数一律【ROWS】现算）**：

| 顺序 | 席 | 组合 | 判据 |
|---|---|---|---|
| 1 | reviewer-backend | A1 | TC-009 / TC-010 / TC-011 / TC-204 |
| 2 | reviewer-interaction | B | 同上 |
| 3 | reviewer-ui | B | 同上 |
| 4 | reviewer-ops | B | 同上 |
| 5 | reviewer-qa | B | 同上 + TC-109（同批改验证点） |
| 6 | reviewer-ai | B | 同上 |
| 7 | reviewer-security | B | 同上 |
| 8 | reviewer-actuary | B | 同上 |
| 9 | reviewer-reader | B | 同上 |

#### TC-009 正：余 9 席逐席「生成 exit 0 + 整文件等于迁移前快照」

- **覆盖**：§5-① + §4 步 3、4
- **前置**：第 k 席开工前，前 k-1 席已巩固（TC-013）
- **步骤**：① `node tools/docgen/cli.mjs generate --kind agent --name <seat>`；②【WK】该席；③ 记录 generate 的 stdout
- **预期**：每席 exit 0 且 `EQUAL`（诚实边界）
- **判据**：【WK】exit 0 `wk seats=9 red=0`；每席 generate exit 0
- **红绿**：红 = 少一个空行/换行/字符 → `DIFF`；绿 = 全 `EQUAL`
- **现状**：待施工后；**警告**：`generate` 对「未拆槽席」是**静默 `continue`**（`cli.mjs:64-65`），exit 0 不能证明已迁——已迁与否只认【WK】+【STATE】（见 TC-202）；测试文件侧的期望见 TC-114

#### TC-010 正：余 9 席逐席 `golden-assert` 通过

- **覆盖**：§5-② + R6 + §4 步 5
- **前置**：TC-009 绿（渲染与快照整文件相等）；evidence 仍是迁移前锚点（未重跑）
- **步骤**：① `node tools/docgen/acceptance/golden-assert.mjs <seat>`；②【EVID】断言 `golden=pass`、`compareResult=null`、`renderSha256` 已从 `pending` 变为 64 位大写 hex
- **预期**：每席 exit 0 且 stdout `黄金断言通过：…`
- **判据**：每席 exit 0；【EVID】exit 0（`compareResult=null` 由命令内 `ok` 判）
- **红绿**：红 = description 差一字 → 打印快照串与派生串并 exit 1（`goldenAssertion=fail`，随后 replace 被拒，TC-106）；绿 = 9 席全过
- **现状**：待施工后

#### TC-011 正：draft → replace，卡字节不变 + numstat 空 + 草稿清

- **覆盖**：R6（双闸门：`goldenAssertion` + `compareResult`）+ R7 + §4 步 6–8
- **前置**：TC-010 绿；`$env:DOCGEN_DRAFTS_DIR` 指向隔离草稿箱（不污染真实草稿箱）
- **步骤**：① `node tools/docgen/cli.mjs draft --kind agent --name <seat>`；②【RENDER】落 `$w2/<seat>.render.md` 后【CMP】草稿 vs 渲染；③ `node tools/docgen/cli.mjs replace --kind agent --name <seat> --draft <草稿路径> --yes`；④ `git diff --numstat -- agents/<seat>.md`；⑤ `node tools/docgen/cli.mjs draft ls --name <seat>`；⑥【STATE】
- **预期**：③ 成功（`已替换：…`）；④ **无输出**（字节未变，不是 `1 1`）；⑤ 无输出（草稿已清）；⑥ 该席进入 replaced 集合
- **判据**：①③ exit 0；② `EQUAL`；④ `@(git diff --numstat -- agents/<seat>.md).Count -eq 0`；⑤ `draft ls` 输出空；⑥【STATE】`--expect` 原集合 + 该席 → exit 0
- **红绿**：红 = 卡字节变了（numstat 非空，例如混入来源行 → `1 1`，那是 S3 口径，见 TC-107）；绿 = 空 + replaced
- **现状**：待施工后；替换前必须先过 TC-010（否则 R6 闸门 `EvidenceInvalid` 直接拒）

#### TC-204 边界：fixedList 条数边界（少一条 / 多一条 / 空表）

- **覆盖**：§3 fixedList「只存问题列」+ §5-①
- **前置**：TC-003 绿；该席已拆槽可渲染
- **步骤**：①【ROWS】现行条数；② 内存变异：某席 fixedList 去掉一条 → 与快照比；③ 内存变异：fixedList = `[]` → 与快照比
- **预期**：②③ 都比出差异（逐字节红），且 `validateAgentData` 都不报（条数不在断言范围内）
- **判据**：`node --input-type=module -e "const {execFileSync}=await import('node:child_process');const {agentData,triggerTable}=await import('./tools/docgen/components/agentData.mjs');const {renderAgent}=await import('./tools/docgen/components/renderAgent.mjs');const {sharedBlocks}=await import('./tools/docgen/components/sharedBlocks.mjs');const {outputFormats}=await import('./tools/docgen/components/outputFormats.mjs');const fs=await import('node:fs');const n=process.argv[1];const g=execFileSync('git',['show','HEAD:agents/'+n+'.md'],{encoding:'utf8'});const tpl=fs.readFileSync('tools/docgen/templates/agent.md.tpl','utf8');const base=agentData.find(a=>a.name===n);const out=(a)=>Buffer.from(renderAgent({agent:a,trigger:triggerTable[n],template:tpl,sharedBlocks,outputFormats}),'utf8').equals(Buffer.from(g,'utf8'));const fewer={...structuredClone(base),fixedList:base.fixedList.slice(0,-1)};const empty={...structuredClone(base),fixedList:[]};console.log('base='+out(base)+' fewer='+out(fewer)+' empty='+out(empty));process.exitCode=(out(base)&&!out(fewer)&&!out(empty))?0:1" <seat>` → `base=true fewer=false empty=false`
- **红绿**：红 = 少一条仍判相等（比对失灵）；绿 = 如上输出
- **现状**：待施工后（需要该席条目完整）

### 2.7 replace 闸门与卡字节不变（R6 / R7）

#### TC-106 负：replace 五模式闸门（control / goldenfail / mismatch / draftdrift / targetdrift）

- **覆盖**：R6（`goldenAssertion==='pass'` **且** `compareResult===null`，缺一即拒）+ `DraftDrift` + `TargetDrift` + §6-5 + §6-12
- **前置**：
  - 【副本仓】就绪；该席在副本内已拆槽可渲染；**每个模式开始前重置副本**（见步骤①）
  - **evidence 必须来自真实产物**：把仓库 `tools/docgen/fixtures/<seat>.evidence.json`（TC-002 + TC-010 的产物）复制进 `$cp/tools/docgen/fixtures/`，或让 `DOCGEN_EVIDENCE_DIR` 指向副本 fixtures —— 副本无 `.git`、`init-evidence` 跑不了；手写 evidence 若缺 `commit`/`blob`/`sha256`/`hashObject`/`lastWrittenHash` 任一字段，`readEvidence`（`evidence.mjs:30-39`）会以「字段缺失或类型非法」拒，`mismatch` / `goldenfail` 就会**假红**（或反过来掩盖真闸门），结论作废
- **步骤**：
  ① 每模式先重置：副本 `tools/docgen/state.json` 只含两席锚点 `replaced`（该席**不在** `replaced` 里）；按【RENDER】在副本内落一份草稿（字节 == 渲染）
  ② 以复制的真实 evidence 为底，按模式**只改指定字段**（其余字段一律保留复制值）：
  - `control`：`goldenAssertion='pass'`、`compareResult=null`、`lastWrittenHash=SHA256(当前 agents/<seat>.md)` → 期望 exit 0（对照：证明前三道闸门放行，其余模式的红只能归因于被改的那一项）
  - `goldenfail`：`goldenAssertion='fail'`、`compareResult=null`、`lastWrittenHash=SHA256(当前 agents/<seat>.md)` → 期望 exit 2 + `EvidenceInvalid`
  - `mismatch`：`goldenAssertion='pass'`、`compareResult={code:'Mismatch'}`、`lastWrittenHash=SHA256(当前 agents/<seat>.md)` → 期望 exit 2 + `EvidenceInvalid`
  - `draftdrift`：`golden='pass'`、`compareResult=null`，草稿改一字节 → 期望 exit 1 + `DraftDrift`
  - `targetdrift`：`golden='pass'`、`compareResult=null`、`lastWrittenHash='0'.repeat(64)`，且**先给副本 `agents/<seat>.md` 追加一字节**（目标 ≠ 渲染，防幂等短路）→ 期望 exit 1 + `TargetDrift`，且 stdout **不含** `幂等恢复`
  ③ 跑 `replace --kind agent --name <seat> --draft <草稿> --yes`
- **预期**：`control` 成功、其余四模式都被拒；四个被拒模式下副本 `agents/<seat>.md` 的 SHA256 与该模式开始前相同
- **判据**：五条 replace 的退出码与 stderr 首词如上；`mismatch` 的 stderr **不得**含「字段缺失或类型非法」**且不得**含「renderSha256 与草稿不等」（排除式：防「evidence 抄漏字段」伪装成闸门有效）；`targetdrift` 的 stdout 不含 `幂等恢复`；非 control 的四次前后 SHA256 全同
- **红绿**：红 = `mismatch` 被放行（只校验 `goldenAssertion`，整文件漂移可落盘，即第 1 轮 P0）；或 `mismatch` 的红来自「evidence 字段缺失」（本用例什么都没证明）；或 `targetdrift` 走进 `cli.mjs:252-259` 的幂等分支打印「已替换（幂等恢复）」；绿 = control 绿 + 四模式各按指定原因被拒
- **现状**：待施工后；`mismatch` 模式**施工前必绿（=缺陷）**——`cli.mjs:218-224` 只校验 `renderSha256` 与 `goldenAssertion`，从不读 `compareResult`。**归因限制**：`EvidenceInvalid` 的 `reason` 不进 stderr（§8 建议 12），故必须靠 `control` 对照排除「字段非法」这条替代解释
- **取证提示**：`targetdrift` 的两条构造缺一不可（① state 非 `replaced`；② 目标追加一字节），否则命中幂等恢复，看到 exit 0 误以为闸门通过

#### TC-107 负：替换后卡字节变化 → `1 1` 必须判红（与 S3 口径区分）

- **覆盖**：R7 + §3「S3 的 `1 1` 口径只适用 senior-sdet」+ §6-6 + §7-6
- **前置**：TC-003 绿；该席已替换
- **步骤**：①【SNAP】把 `HEAD:agents/<seat>.md` 按字节落 `$w2/<seat>.snap.md`；②【RENDER】落 `$w2/<seat>.render.md`；③ `git diff --no-index --numstat "$w2/<seat>.snap.md" "$w2/<seat>.render.md"`；④ 负样本：复制渲染文件并在 `description:` 行尾加一个空格，跑同一命令
- **预期**：③ 无输出（R7：整文件相等）；④ 输出 `1<TAB>1<TAB>…`（= S3 口径）
- **判据**：③ 输出为空；④ 前两列 == `1 1`。`--no-index` 有差异时退出码本来就是 1，**退出码不作判据**
- **红绿**：红 = ③ 输出 `1 1`（这席按 S3 改了字节，违反 R7）；绿 = ③ 空
- **现状**：待施工后；未拆槽席渲染会抛 `MissingComponentData`；`reviewer-product` 当前是骨架条目，渲染必 DIFF
- **为什么必须先落盘**：`git diff --no-index` 只认两个真实文件，`git show <commit>:<path>` 是管道输出，直接喂会变成「比较文件与空串」

#### TC-110 负：替换后重跑 `init-evidence` → 锚点回 pending → 后续 replace 被拒

- **覆盖**：R4 + §6-4（每席只跑一次）
- **前置**：某席已替换完成（TC-011 绿）
- **步骤**：① `$env:DOCGEN_EVIDENCE_DIR = Join-Path $w2 'reinit-ev'`，建目录并复制该席 evidence 进去（不动仓库 fixtures）；② 在该 env 下重跑 `node tools/docgen/acceptance/init-evidence.mjs <seat>`（它仍用 git 读仓库文件，锚点三项不变）；③【EVID】观察字段；④ `$env:DOCGEN_DRAFTS_DIR` / `$env:DOCGEN_STATE_PATH` 也指向 `$w2`，先 `draft` 再用该草稿 `replace --yes`；⑤ 用完清三个 env
- **预期**：③ `golden=pending renderSha256=pending`（R7 下 `commit`/`blob`/`sha256` 三项都看不出重跑，**只有这两个字段能暴露**）；④ exit 2 + `EvidenceInvalid`（`renderSha256=pending` ≠ 渲染 hash），卡未被改写
- **判据**：③【EVID】stdout 含 `golden=pending` 且 `renderSha256=pending`；④ exit 2 且 stderr 含 `EvidenceInvalid`；且 `@(git diff --numstat -- agents/<seat>.md).Count -eq 0`
- **红绿**：红 = 重跑后仍能 replace（锚点已失效却继续走）；绿 = 被拒
- **现状**：待施工后；本用例的价值是证明「重跑会自毁」，实操上禁止执行

### 2.8 十键注解（R5）

#### TC-012 正：12 席 × 10 键全 pass，`checkAgentFile(<seat>).ok === true`

- **覆盖**：R5 + §5-⑤ + §4 步 8 + §6-9（独立子代理判定，判者与依据落账）
- **前置**：注解由**独立于施工者的子代理**判定并写入 `rules/.inspector-annotations.json`（键 = `<席名>:<项>`，三态）
- **步骤**：①【KEYS】断言每席键恰 10、无缺无多；②【ANN】断言 12 席 `ok=true` 且 `structRed=0`（A3–A7 0 红）；③ 互证关系指向 TC-113（注解缺失须让 `npm run check` 红）
- **预期**：120 个键全 `pass`；12 席 `ok=true`；无 `pending`（降级模式按 §6-13 不收口）
- **判据**：【KEYS】exit 0 `annotation-keys red=0`；【ANN】exit 0 `ann seats=12 red=0`
- **红绿**：红 = 任一席任一键 `pending` / `fail` / 非字符串 → 该席 `ok=false`（`check-agent.mjs:133-159`）；绿 = 12 席 ok
- **现状**：施工前必红（当前只有 `reviewer-audit` / `senior-sdet` 各 10 键）

#### TC-108 负：注解三态机械接收（pending / fail / 非字符串）+ 键名写错

- **覆盖**：R5 负例 + 线 E §0.3（三态，脚本不重判语义）+ §7-5
- **前置**：无
- **步骤**：① 直接调 `judgeAnnotation` 五个样本：`pass` / `pending` / `fail: 证据不足` / `null` / `42`；② `checkSemantic({}, 'reviewer-qa')`（全缺键）；③ 只写错键名 `reviewer-qa:B5` 后 `checkSemantic`
- **预期**：`pass` 绿，其余全红；②③ 都返回 **10** 条红（缺键按 pending，错键名静默不生效但仍是缺键）
- **判据**：`node --input-type=module -e "const {judgeAnnotation,checkSemantic}=await import('./tools/execution-matrix/check-agent.mjs');const cases=[['pass',false],['pending',true],['fail: 证据不足',true],[null,true],[42,true]];let bad=0;for(const c of cases){const r=judgeAnnotation(c[0]);if(r.red!==c[1])bad++;console.log('value='+JSON.stringify(c[0])+' red='+r.red+' expect='+c[1])}const a=checkSemantic({},'reviewer-qa');const junk={};junk['reviewer-qa:B5']='pass';const b=checkSemantic(junk,'reviewer-qa');console.log('empty-ann='+a.length+' wrong-key='+b.length+' (both expect 10)');if(a.length!==10||b.length!==10)bad++;process.exitCode=bad?1:0"` → exit 0
- **红绿**：红 = 非字符串被 truthy 放行 / 错键名被静默忽略却不报；绿 = 五样本 + 两个计数如预期
- **现状**：今天可跑并应绿（纯内存，不改文件）

#### TC-113 负：注解缺失必须让 `npm run check` 红（12 席注解进 check-all）

- **覆盖**：R5 + §5-⑤（`check-all` 遍历 `state=replaced` 席并**在输出里打印被检席名**）+ §1-⑦ + §7-5
- **前置**：该席 `state=replaced` 且 10 键注解齐（TC-012 绿）
- **步骤**：① 备份：`Copy-Item rules/.inspector-annotations.json (Join-Path $w2 'ann.bak.json')`；② 删一个键：`node -e "const fs=require('node:fs');const p='rules/.inspector-annotations.json';const a=JSON.parse(fs.readFileSync(p,'utf8'));delete a[process.argv[1]];fs.writeFileSync(p,JSON.stringify(a,null,2)+String.fromCharCode(10))" reviewer-qa:C4`；③ `npm run check`；④ 恢复：`Copy-Item (Join-Path $w2 'ann.bak.json') rules/.inspector-annotations.json -Force`，再跑一次 `npm run check`
- **预期**：③ exit ≠ 0，stderr 含 `[execution-matrix]` 与该席名；④ exit 0 且 stdout `check 全部通过`
- **判据**：③ 退出码非 0 且 stderr **同时**含 `[execution-matrix]` 与 `reviewer-qa` —— 这两项是同一条判据：spec §5-⑤ 原文要求 `check-all` 在输出里打印被检席名，不打印席名就无法定位是哪一席注解缺；④ 退出码 0 且末行 `check 全部通过`；静态佐证 `(Select-String -Path scripts/check-all.mjs -Pattern 'replaced' -SimpleMatch).Count -ge 1`
- **红绿**：红 = 删键后 check 仍绿（`scripts/check-all.mjs:119` 只挂了 `reviewer-audit`，12 席注解不在 CI 内）；绿 = 红→绿对称
- **现状**：待施工后；③④ 每次约数分钟——**中途中断也必须先执行 ④ 的恢复命令**（注解文件是仓库受管文件）

### 2.9 巩固、收口与不回归

#### TC-013 正：逐席巩固六要素 + 干净口径

- **覆盖**：R1 + §5-⑥ + §4 步 9 + §6-1 + §6-10（干净口径 = 除预期产物外无改动）
- **前置**：该席已完成 TC-011（replace 成功）
- **步骤**：① `node tools/docgen/cli.mjs gate` 连跑 2 次；② `node tools/docgen/acceptance/cold-run.mjs`；③ `npm run check`；④ 只读检查 `git status --short -- rules/ skills/`；⑤ 该席 numstat（TC-011 ④）；⑥ `node tools/docgen/cli.mjs draft ls --name <seat>`
- **预期**：六项全满足才算「已巩固」，缺任一 → 下一席不得开工。④ 的允许集**只有** `M rules/.inspector-annotations.json`：`tools/docgen/state.json`、`tools/docgen/fixtures/<seat>.evidence.json` 属预期产物（不在 `rules/` `skills/` 范围）；本 spec 自身要改的代码（`tools/docgen/**`、`scripts/check-all.mjs`、`agents/**`）也**不算脏**
- **判据**：①②③ exit 0（③ stdout 末行 `check 全部通过`）；④ `node -e "const {execFileSync}=require('node:child_process');const out=execFileSync('git',['status','--short','--','rules/','skills/'],{encoding:'utf8'}).trim();const lines=out?out.split(String.fromCharCode(10)):[];const ok='M rules/.inspector-annotations.json';const bad=lines.map(l=>l.trim()).filter(l=>l!==ok);console.log('lines='+lines.length+' bad='+JSON.stringify(bad));process.exitCode=bad.length?1:0"` → exit 0 且 `bad=[]`；⑤ `Count -eq 0`；⑥ 输出空
- **红绿**：红 = gate 红 / 冷跑红 / check 有 findings / `rules/` 出现注解文件以外的改动 / 草稿残留；绿 = 六项全过
- **现状**：待施工后（每席重复一次，不批量）；**不得**把注解文件的 `M` 当脏（那会让每席必然红 → 口径失效）

#### TC-014 正：不波及其他席（reviewer-audit + senior-sdet）

- **覆盖**：§5-⑦ + §1 联动四问（常量被全批席共用，改一处波及已巩固席）
- **前置**：无（可在迁移全程任意时点抽查）
- **步骤**：①【AUDIT】（temp evidence，不写仓库）；② 同法换席：`$env:DOCGEN_EVIDENCE_DIR = Join-Path $w2 'sdet-ev'` → 建目录 → 复制 `tools/docgen/fixtures/senior-sdet.evidence.json` 进去 → `node tools/docgen/acceptance/golden-assert.mjs senior-sdet` → `node tools/docgen/cli.mjs generate --kind agent --name senior-sdet` → `node --test tools/docgen/test/sdet-render.test.mjs` → `Remove-Item Env:DOCGEN_EVIDENCE_DIR`
- **预期**：四组 exit 0；senior-sdet 的 numstat 允许 `1 1`（S3 历史口径），但渲染必须整文件相等
- **判据**：四条命令 exit 0；`generate --name senior-sdet` 不产生 drift（exit 0）
- **红绿**：红 = 填常量时误改 `AUDIT_RULES` / `audit` 格式，或渲染器空值分支改动误伤非空分支 → ① 或 ② 红（立即定位到常量/渲染器而不是 12 席）；绿 = 四条全绿
- **现状**：senior-sdet 部分今天可跑

#### TC-015 正：收口（14 席 replaced + gate + check-agents + check）

- **覆盖**：§5 收口 / §6-1 / PRD 6.3
- **前置**：12 席全部巩固（连同两席锚点共 14 席 `replaced`）
- **步骤**：①【STATE】断言集合 == 两席锚点 + SEATS_12；② `gate`；③ `check-agents`；④ `npm run check`
- **预期**：14 席全 replaced；gate 打印 `baseline 35/35`；check-agents 报 `已接管 14，未迁移 0`
- **判据**：①【STATE】`--expect` 14 席 → exit 0 `missing=[] extra=[]`；② exit 0 且 stdout `baseline 35/35`（35 = 21 规则 + 14 席，由 `baseline.mjs` 派生，席数变化须同步此断言）；③ exit 0 且 `OK：14 个 agent 已检查（已接管 14，未迁移 0）`；④ exit 0 且 `check 全部通过`
- **红绿**：红 = 任一席未 replaced / gate drift / check 有 findings；绿 = 四项全过
- **现状**：待施工后

#### TC-016 正：`review-fixes.test.mjs` 同批改后仍绿（相对判据）

- **覆盖**：§1-⑫（`reviewer-qa` 当未拆槽样本，补 when 后必须同批改）+ §6-12（改写不删断言）
- **前置**：`reviewer-qa` 已拆槽（when 已补）；**改前基线已记录**
- **步骤**：① 改前：`node --test tools/docgen/test/review-fixes.test.mjs` → 记 `# pass` = P0；`node -e "const fs=require('node:fs');const s=fs.readFileSync('tools/docgen/test/review-fixes.test.mjs','utf8');console.log('guards='+(s.match(/MissingComponentData/g)||[]).length)"` → 记 C0；② 同批改后重跑两条，记 P1 / C1；③ 用同一命令比较（**不写死 5 / 2**：用例数会随增删浮动，判据是「测试数不减 + 守卫断言仍在位」）
- **预期**：改后全绿且判别力不减
- **判据**：② `node --test` exit 0；③ `node -e "const a=process.argv.slice(1).map(Number);const p0=a[0],p1=a[1],c0=a[2],c1=a[3];console.log('pass '+p0+'->'+p1+' guards '+c0+'->'+c1);process.exitCode=(p1>=p0&&c1>=c0)?0:1" <P0> <P1> <C0> <C1>` exit 0
- **红绿**：红 = 删掉 I1/J4 让测试变绿（P1 < P0 或 C1 < C0）；绿 = ② 绿 + ③ 达标
- **现状**：今天可跑（当前应绿：`reviewer-qa` 尚无 when）

#### TC-109 负：不同批改 → 红（依赖关系证明）

- **覆盖**：§1-⑫ + §6-1（逐席串行，不批量）
- **前置**：`reviewer-qa` 的 when 已补、`review-fixes.test.mjs` **未改**
- **步骤**：① `node --test tools/docgen/test/review-fixes.test.mjs`；② 读失败用例名
- **预期**：I1（`draft reviewer-qa` 期望 exit 2）与 J4（同上）转红——它们以为该席仍是未拆槽
- **判据**：exit ≠ 0 且 stdout 含失败名 `I1`；同批改完成后（TC-016）立即转绿
- **红绿**：红 = 本期望的「红」没出现（说明测试没真依赖该席，样本选错）；绿 = 如预期失败
- **现状**：待施工后（这句「负例」要的是「暴露依赖」，不是「保持红」）

#### TC-202 边界：迁移中段「未拆槽席」的语义

- **覆盖**：§4 步 1 + `cli.mjs` 未拆槽分支（存在性检查 / `continue`）
- **前置**：队列推进中，仍有席未拆槽（11 → 0 的过渡态）
- **步骤**：① `gate`；② `generate --kind agent --name <未拆槽席>`；③ `check-agents`
- **预期**：① exit 0（未拆槽席只做存在性检查，且都在 baseline 内，不得报 `UnregisteredHandwritten`）；② **静默 exit 0**（`cli.mjs:64-65` 的 `continue`）——这是**假绿陷阱**；③ exit 0 且计数里计入「未迁移」
- **判据**：① exit 0；② exit 0 且 stdout 只有 `baseline 35/35`（无该席漂移行）→ 记录为「不可作为已迁证明」；③ exit 0 且输出含 `未迁移` 字样
- **红绿**：红 = 用 ② 的 exit 0 宣布「该席已迁」（验收失效）；绿 = 进度只用【WK】+【STATE】判
- **现状**：今天可跑（当前 11 席无 when，正是这个状态；gate 本身是否绿由 TC-013 保证）

#### TC-203 边界：12 席全拆槽后「未拆槽样本」失去实体

- **覆盖**：§1-⑫ 终态 + R5 接口可跑
- **前置**：12 席全部拆槽（`triggerTable` 覆盖 14 席全集）
- **步骤**：① 断言 `triggerTable` 键集 == `agentData` 席全集（14/14 都有 `when`）；② 断言 `review-fixes.test.mjs` 不再把任何 SEATS_12 席当「未拆槽样本」；③ 断言「合法合成方式」可用：**进程内** `delete triggerTable['reviewer-qa']` 后**直接调用导出的** `cmdDraft`，应抛 `MissingComponentData`，再恢复
- **预期**：14/14 有 when；测试文件内 SEATS_12 席名出现 0 次；合成样本抛错且恢复后数据无损
- **判据**：① `node --input-type=module -e "const m=await import('./tools/docgen/components/agentData.mjs');const miss=m.agentData.filter(a=>!m.triggerTable[a.name]||!m.triggerTable[a.name].when).map(a=>a.name);console.log('with-when='+(m.agentData.length-miss.length)+'/'+m.agentData.length+' miss='+miss.join(','));process.exitCode=miss.length?1:0"` exit 0；② `node -e "const fs=require('node:fs');const s=fs.readFileSync('tools/docgen/test/review-fixes.test.mjs','utf8');const hit=process.argv.slice(1).filter(n=>s.includes(n));console.log('seat-mentions='+JSON.stringify(hit));process.exitCode=hit.length?1:0" <SEATS_12>` exit 0；③ `$env:DOCGEN_DRAFTS_DIR = Join-Path $w2 'synth-drafts'` 后 `node --input-type=module -e "const m=await import('./tools/docgen/components/agentData.mjs');const {cmdDraft}=await import('./tools/docgen/cli.mjs');const keep=m.triggerTable['reviewer-qa'];delete m.triggerTable['reviewer-qa'];let code='GREEN';try{cmdDraft({sub:'draft',kind:'agent',name:'reviewer-qa'},[])}catch(e){code=e.code}m.triggerTable['reviewer-qa']=keep;console.log('synth='+code+' restored='+(m.triggerTable['reviewer-qa'].when===keep.when));process.exitCode=code==='MissingComponentData'?0:1"` exit 0，然后清 env
- **红绿**：红 = 全拆槽后仍拿真实席当「未拆槽样本」→ 该样本其实会渲染成功，I1/J4 红或语义错；绿 = 进程内合成 + 真卡席名零残留
- **现状**：待施工后（今天还有 11 席无 when，样本真实存在）
- **⚠️ 合成方式的边界**：进程内 `delete` 只对**同进程**调用生效；`review-fixes.test.mjs:16` 走 `spawnSync` 子进程，子进程有独立模块实例，进程内删键对它**无效**。故合法做法只有两条：改用进程内调用 `cmdDraft` / `cmdReplace` 断言错误码，或加测试专用开关（如 `DOCGEN_FORCE_UNSPLIT=<seat>` 由 `renderByName` 读）

#### TC-205 边界：when 两两唯一 vs 结构同构不误判

- **覆盖**：R3 + 断言 10（`DuplicateWhen`）+ §7-4「六视角席同构，错一个字最隐蔽」
- **前置**：12 席 when 已就位
- **步骤**：① 正向：12 席 when 集合 size == 12（同构 ≠ 冲突）；② 负向：内存变异令两席 when 相同 → `DuplicateWhen`（TC-104 ③）；③ 正常数据 `validateAgentData` 必须 exit 0
- **预期**：① 12 个互不相同的 when；② 报 `DuplicateWhen`；③ 无冲突误报
- **判据**：`node --input-type=module -e "const m=await import('./tools/docgen/components/agentData.mjs');const w=process.argv.slice(1).map(n=>(m.triggerTable[n]||{}).when);const u=new Set(w);console.log('whens='+w.length+' uniq='+u.size);process.exitCode=(w.length===12&&u.size===12)?0:1" <SEATS_12>` exit 0；② 结果见 TC-104
- **红绿**：红 = 实现把「结构同构」当冲突（假阳性）→ ② 之外的正常数据也红；绿 = 只在文本相同时报
- **现状**：② 今天可跑；① 待施工后

#### TC-206 边界：【ROWS】计数口径（节内 vs 整份）与缺陷判别

- **覆盖**：§3「条数一律由 testcase【ROWS】从快照的『固定必问清单』节内现算」+ §3 组合表 + 盲点雷达「口径错会让正确数据必红」
- **前置**：无（只读 `HEAD` 快照，不需要数据已迁）
- **步骤**：① 对 12 席分别算三个数：整份 `\| N \|` 行数（whole）、「固定必问清单」节内行数（sect）、共享块节内（`### 六手法全过` / `### 侦探处置表`）的行数（shared）；② 断言 `whole - sect === shared`（结构恒等）；③ 断言 A1 两席 `whole !== sect`、其余 10 席 `whole === sect`；④ 判别规则：若某席出现 `whole - data === shared` 且 `sect !== data`，判**命令口径缺陷**，禁止改 `fixedList` 去凑整份行数
- **预期**：`whole - sect` 恰等于该席共享块表格行数（frontend / backend 非 0，其余 0）；A1 两席的整份计数比节内计数多出共享块行
- **判据**：`node --input-type=module -e "const {execFileSync}=await import('node:child_process');const NL=String.fromCharCode(10);const secRows=(s,head)=>{const L=s.split(NL);const i=L.findIndex(l=>new RegExp(head).test(l));if(i<0)return 0;let j=i+1;while(j<L.length&&!/^#{2,3} /.test(L[j]))j++;return L.slice(i+1,j).filter(l=>/^\| \d+ \|/.test(l)).length};const bad=[];for(const n of process.argv.slice(1)){const g=execFileSync('git',['show','HEAD:agents/'+n+'.md'],{encoding:'utf8'});const L=g.split(NL);const whole=L.filter(l=>/^\| \d+ \|/.test(l)).length;const i=L.findIndex(l=>/^## 固定必问清单/.test(l));const sect=(()=>{if(i<0)return -1;let j=i+1;while(j<L.length&&!/^## /.test(L[j]))j++;return L.slice(i+1,j).filter(l=>/^\| \d+ \|/.test(l)).length})();const shared=secRows(g,'^### 六手法全过|^### 侦探处置表');if(whole-sect!==shared)bad.push(n+':whole-sect='+(whole-sect)+' shared='+shared);const a1=(n==='reviewer-frontend'||n==='reviewer-backend');if(a1&&whole===sect)bad.push(n+':whole==sect');if(!a1&&whole!==sect)bad.push(n+':whole!=sect')}console.log('rows-caliber red='+bad.length+' '+bad.join(' / '));process.exitCode=bad.length?1:0" <SEATS_12>` → exit 0
- **红绿**：红 = 用整份快照计数（A1 两席把六手法 6 行算进来 → 正确数据也必红，frontend 报 `snap=14 data=8`）；绿 = 节内计数 + 结构恒等成立
- **现状**：今天可跑并应绿（结构恒等与数据无关；数据判别 `sect == data` 在 TC-005/006/007 的【ROWS】里）

### 2.10 测试同步（§1-⑫ / §6-12）

#### TC-114 负：`cli-gate.test.mjs` 的 generate 期望不得依赖迁移进度

- **覆盖**：§1-⑫（`cli-gate.test.mjs` 改为副本注入字节反例）+ §6-12 + §4 步 3（迁移后 `generate` 预期 exit 0）
- **前置**：`reviewer-product` 已迁移（state=replaced、渲染 == 卡）；【副本仓】就绪（副本**无 `.git`**）；测试文件已同批改写
- **步骤**：① 仓库内 `node --test tools/docgen/test/cli-gate.test.mjs`；② 副本仓内直接跑同一测试文件（未注入）；③ 副本内用 node 给 `agents/reviewer-product.md` 追加一字节后重跑同一测试文件；④ 另在副本内直接跑 `node tools/docgen/cli.mjs generate --kind agent --name reviewer-product`，分别记录未注入 / 注入后的退出码；⑤ 重建副本复位
- **预期**：① exit 0（迁移后该席 generate 应为 0）；② exit 0（期望值不依赖迁移进度，也不依赖 `.git`）；③ exit ≠ 0（字节反例被抓住）；④ 未注入 exit 0、注入后 exit 1
- **判据**：① 与 ② 均 exit 0 且 stdout 含 `# fail 0`；③ exit ≠ 0；④ 两次退出码分别为 0 / 1
- **红绿**：红 = 测试仍写「已迁席 generate → exit 1」（迁移后必红，最省事的假绿是删断言）或改成「只断言 exit 0」（注入字节后仍绿 = 无判别力）；绿 = 四行全如预期
- **现状**：待施工后；**改前现状**：`cli-gate.test.mjs:11-15` 与 `:17-20` 都把 generate 写死为 exit 1，迁移完成后必红

#### TC-207 边界：`pilot-render.test.mjs` 三连空行断言收窄 + 无共享块席该区间恰一空行

- **覆盖**：§1-⑫ / §6-12（断言可改写但不得删判别力）+ §3「无共享块分支」+ §5-③
- **前置**：渲染器空值槽特判已落（TC-017 绿）；改前基线已记录
- **步骤**：① 改前基线：`node --test tools/docgen/test/pilot-render.test.mjs` 记 `# pass` = P0；`(Select-String -Path tools/docgen/test/pilot-render.test.mjs -Pattern '## 边界' -SimpleMatch).Count` 记 C0；② 同批改写后重跑两条，记 P1 / C1；③ 区间判据：三连空行断言必须只作用于「通用纪律末条 → `## 边界`」区间（issue-card 输出格式本身含三连换行，整卡断言会误伤正确产物）；④ 新断言判据：同一 test 体内同时含 `不自行处置` 与 `## 边界`（或字面 `\n\n## 边界`）；⑤ 判别力变异：副本仓把 `renderAgent.mjs:4` 的空值分支改回 `replaceAll(key+换行,'')`，副本内跑该测试必须 exit ≠ 0；复原后 exit 0
- **预期**：P1 ≥ P0（只收窄、不删断言）、C1 ≥ 1；变异红 / 复原绿
- **判据**：② `node --test` exit 0 且 `node -e "const a=process.argv.slice(1).map(Number);const [p0,p1,c0,c1]=a;console.log('pass '+p0+'->'+p1+' boundary-refs '+c0+'->'+c1);process.exitCode=(p1>=p0&&c1>c0)?0:1" <P0> <P1> <C0> <C1>` exit 0（`C0` 改前必为 0：文件里没有 `## 边界`）；③ **静态判据（防「删断言变绿」）**：改写后的 `pilot-render.test.mjs` 必须含区间切片（`Select-String -SimpleMatch 'indexOf('` 或 `'head.endsWith('` ≥1 命中），且整卡断言 `!s.includes('\n\n\n')` **0 命中**（两条 `Select-String -SimpleMatch` 分别 exit 0 / Count -eq 0）；④ 见 TC-017 ② 的 node 命令 exit 0；⑤ 副本内 exit ≠ 0 → 复原后 exit 0
- **红绿**：红 = 直接删掉三连空行断言（P1 < P0 或 ③ 静态判据不成立）→「删断言变绿」；或仍只在整卡上断言（issue-card 三连换行让正确产物必红，假阳性）；绿 = 收窄 + 新增 + 变异可抓
- **现状**：改前必红——`pilot-render.test.mjs:91-101` 的断言作用于整卡，且**没有**「恰一空行」断言（`## 边界` 出现 0 次）；渲染器修复后该 stub 席边界前才有恰一空行，收窄后的断言才具备判别力

## 3 负例与边界清单（21 条）

| 用例 | 错在哪 | 为什么容易漏 | 期望行为 |
|---|---|---|---|
| TC-101 | 常量少结尾 `\n` / 多空行 | 肉眼看着一样，字节不一样 | 该组合每席 drift（exit 1） |
| TC-102 | 常量缺键 / 值互换 | validate 只查名单不查常量对象 | 键集红 + 渲染红 |
| TC-103 | 误带 / 漏带 sharedBlock | validate 对 `undefined` 跳过、枚举合法即过 | 只有【WK】能抓到 |
| TC-104 | when 尾「时」/ 整句 / 两席相同 | 六视角席句式同构，抄错一字最隐蔽 | `WhenFormatViolation` / `DuplicateWhen` |
| TC-105 | 条目混入 `when` + `route` | 断言 15 未落前完全没有审判者 | 注入即抛（基线仍绿） |
| TC-106 | golden fail / compareResult 漂移 / 草稿漂移 / 目标被手改 / 对照成功 | 四道闸门都在 replace 内，跳一步就带错落盘；evidence 手工抄写会伪装成闸门有效 | `EvidenceInvalid` ×2 / `DraftDrift` / `TargetDrift` / control exit 0 |
| TC-107 | 替换后字节变化（沿用 S3 的 `1 1`） | 「只改来源行」看着无害 | numstat 非空即红 |
| TC-108 | 注解 pending / fail / 非字符串 / 键名错 | 「先记 pending 回头再判」是自然动作 | 全红（含缺键按 pending） |
| TC-109 | 不同批改 review-fixes | 测试名里没有「迁移」字样 | 拆槽后 I1/J4 红 |
| TC-110 | 替换后重跑 init-evidence | 「再跑一次覆盖一下」无害直觉 | 两字段回 pending，replace 被拒 |
| TC-111 | 跳检查点 / 穿插 | 进度压力下最容易「顺手先做后面那席」 | state 集合违例（含 extra） |
| TC-112 | 从 gen-agents 取源 | 旧生成器已删，容易被「捡回来」 | 0 命中 + 文件不存在 |
| TC-113 | 注解缺键后 check 仍绿 | `npm run check` 全绿给人安全感 | check 必须红且打印席名，恢复后转绿 |
| TC-114 | generate 期望绑死迁移进度 | 写测试时该席确实还没迁，exit 1 是「当时的真话」 | 正例 exit 0 + 注入字节 exit 1 |
| TC-201 | 拆批判据触发却继续（或把渲染器缺陷当拆批理由） | 三条判据都在别的文件里 | 拆 6+6 重审；渲染器缺陷走回炉特例 |
| TC-202 | 用 generate exit 0 当「已迁」 | 未拆槽席静默 `continue` | 只认【WK】+【STATE】 |
| TC-203 | 全拆槽后仍拿真实席当样本 / 用 spawnSync 验进程内删键 | 样本挑选与进程边界都是随手动作 | 进程内合成 + 席名零残留 |
| TC-204 | fixedList 少一条 / 空表 | validate 不查条数 | 逐字节红 |
| TC-205 | 同构被误判冲突 / 误同静默过 | 「句子太像」与「句子相同」是两件事 | 只按文本判 |
| TC-206 | 用整份快照数 fixedList 行数 | 六手法表也长得像编号清单 | 节内计数，整份 − 节内 = 共享块行数 |
| TC-207 | 三连空行断言留在整卡 / 被整条删掉 | 「整卡不出现三连空行」听着更严，实际会误伤 issue-card | 收窄到区间 + 新增恰一空行 + 计数不减 |

## 4 回归清单

| 如果改了 | 必须重跑 | 为什么 |
|---|---|---|
| `tools/docgen/components/sharedBlocks.mjs` / `outputFormats.mjs` | TC-003、TC-008、TC-014、TC-005/006/007 | 常量被全批席共用，错一处整批红，且会波及 reviewer-audit |
| `tools/docgen/components/renderAgent.mjs`（空值分支） | TC-017、TC-003、TC-005/006/007、TC-014、TC-207、【AUDIT】 | 渲染器被 14 席共用，改空值分支必须重跑 14 席快照 |
| `tools/docgen/components/agentData.mjs`（条目 / 触发表） | TC-004、TC-005/006/007、TC-009、TC-010、TC-204、TC-205、TC-206 | 数据同时决定渲染字节与派生 description |
| `tools/docgen/components/validateAgentData.mjs`（含断言 15） | TC-104、TC-105、TC-018、TC-205、TC-103 | 断言 5/7/10/15 的口径都在这里 |
| `tools/docgen/acceptance/golden-assert.mjs` / `init-evidence.mjs` | TC-002、TC-010、TC-110、TC-107、TC-106 | 锚点与闸门都在验收脚本里 |
| `tools/docgen/cli.mjs`（generate / replace / draft） | TC-009、TC-011、TC-106、TC-202、TC-114 | 未拆槽分支、五模式闸门、草稿语义 |
| `tools/execution-matrix/check-agent.mjs` / `rules/.inspector-annotations.json` | TC-012、TC-108、TC-113、TC-203 | 十键机械接收与键集 |
| `tools/docgen/test/review-fixes.test.mjs` | TC-016、TC-109、TC-203 | 未拆槽样本的依赖关系 |
| `tools/docgen/test/pilot-render.test.mjs` | TC-017、TC-207、TC-014 | 空值分支断言区间与试点金标 |
| `tools/docgen/test/cli-gate.test.mjs` | TC-114、TC-009 | generate 期望值与迁移进度解耦 |
| `scripts/check-all.mjs` | TC-013、TC-015、TC-113、TC-014 | 巩固与收口的口径来源 |

## 5 只手动验证

| 项 | 为什么机器验不了 | 谁看、看什么 |
|---|---|---|
| 12 席替换后「读起来还是同一张卡」 | 字节相等证明不了语义可读（拆槽切分可能让断句变怪） | 用户 / 议会：替换前后并排读「你是谁」与「固定必问清单」 |
| detective-observer 的 observation 输出观感 | 字节相等不保证表格可读、节结构合理 | 用户：看 `agents/detective-observer.md` 的「输出格式」节 |
| 前 3 席检查点「够不够代表 12 席」 | 代表性是判断，不是断言 | 议会：审 TC-008 的六项证据 |
| 拆批判据 ④「某条设计波及 12 席」 | 语义判断 | 议会：评审时点名 |
| 十键注解的判者与依据 | 判据是语义，脚本只机械接收三态 | 议会：查 plan 执行记录里的判者与依据 |

## 6 不测（带理由）

| 不测什么 | 为什么 |
|---|---|
| 能力地基本身（CLI 六子命令语义 / 草稿箱 / 五档退出码 / 守卫迁移） | S1 覆盖；本 spec 只消费（§10） |
| `reviewer-audit`（S2）与 `senior-sdet`（S3）的再迁移 | 已迁已巩固；本 spec 只做「不回归」抽查（TC-014） |
| description 翻译闭环 | PRD §1.1 作用域声明，P2 内不验收 |
| 加席旅程（W5）/ `baseline --write` | spec §8 明确不在这一轮 |
| `outputKind` 三职字段化（F26） | spec §9 只点名，不拆 |
| 「可同时命中 = 多点将」的调度裁决 | 由点将矩阵裁决，spec 未在本轮定义 |

## 7 缺口与判别力水位

| 缺口 | 漏检哪类反例 | 样例 | 谁兜 |
|---|---|---|---|
| 条目键集无唯一审判者（断言 15 未落） | `when`/`route` 塞进条目静默通过 | `reviewer-audit` 条目加 `when` → 仍 GREEN | TC-105（检出）+ TC-018（防误伤）+ §8 建议 1 |
| `sharedBlocks` / `outputFormats` 缺键不被 validate 抓 | 常量缺失 → 渲染空节 | 删 `observation` → validate 绿、渲染红 | TC-102 + TC-003 + §8 建议 2 |
| `generate` 对未拆槽席静默 `continue` | 迁移进度假绿 | 迁移中途 `generate --name reviewer-qa` exit 0 | TC-202 + §8 建议 5 |
| 全拆槽后仓库里没有「未拆槽席」 | `review-fixes.test.mjs` 的样本失效（且 `spawnSync` 让进程内合成无效） | 14/14 有 when 后 I1/J4 红 | TC-203 + §8 建议 4 |
| 十键注解不在 `npm run check` 里 | 12 席注解 pending 也能 check 绿 | `scripts/check-all.mjs:119` 只查 reviewer-audit | TC-113 + TC-012 + §8 建议 3 |
| `replace` 幂等分支早于 `TargetDrift` | 目标已 replaced 且字节相等时，坏 evidence 被「幂等恢复」吞掉 | 重放 replace 打印「已替换（幂等恢复）」 | TC-106 `targetdrift` + §8 建议 9 |
| `EvidenceInvalid` 的 reason 不进 stderr | 三种拒绝原因不可区分；手工 evidence 缺字段会伪装成「闸门有效」 | stderr 只有 `EvidenceInvalid` | TC-106 `control` 对照 + §8 建议 12 |
| 测试期望绑死迁移进度 | 迁移后必红，最省事的修法是删断言 | `cli-gate.test.mjs` 写死 exit 1 | TC-114 + §8 建议 14 |
| 三连空行断言作用域过宽 | 收窄前正确产物（issue-card 含三连换行）被判红；又容易改成整条删 | `pilot-render.test.mjs:91-101` | TC-207 + §8 建议 15 |
| 语义观感（字节相等 ≠ 读得顺） | 机器全绿但人读不顺 | 拆槽后句子边界 | 第 5 节人工 |

**判别力水位**：

- **假阳性样例（合理却被判错）**：① 六视角席 when 结构同构被当冲突（TC-205 守）；② 迁移中段未拆槽席被当清单外新文件报 `UnregisteredHandwritten`（TC-202 守）；③ 常量首尾空行「看着多余」被格式化工具删掉 → 合理编辑被 TC-003 判红（**字节即契约**，这是对的）；④ 用整份快照数 fixedList 行数 → A1 两席把六手法行算进去，正确数据也判红（TC-206 守）；⑤ 断言 15 写成「条目必须恰 8 键」→ `senior-sdet` 的 `heading`/`sourceLine` 与骨架条目全被误杀（TC-018 守）；⑥ 只喂 `senior-sdet` 一条数据的旧样本 → 撞断言 12 恒红（样本缺陷，非实现缺陷，已在本版修正）；⑦ 整卡断言三连空行 → issue-card 正确产物被判红（TC-207 守）。
- **假阴性样例（错了却判对）**：① 只跑 `generate` exit 0 就宣布已迁（TC-202 守）；② 替换后重跑 init-evidence，锚点自毁仍恒绿（TC-110 守）；③ 注解全 pending 但没人跑【ANN】（TC-012/TC-113 守）；④ 删掉 review-fixes 的 I1/J4 让 check 变绿（TC-016 守）；⑤ `goldenAssertion='pass'` 但 `compareResult={code:'Mismatch'}` 被放行，整文件漂移照样落盘（TC-106 `mismatch` 守）；⑥ 手写 evidence 缺字段 → `mismatch` 的红来自「字段非法」而非闸门（TC-106 `control` + 排除式断言守）。
- **机器可判占比**：39 条中 36 条纯机器；TC-008 / TC-111 含「停一次」的流程判定（机器给证据、人执行停）；TC-201 ④ 与第 5 节为人工。

## 8 给开发的建议

| # | 位置（文件:行 / spec 节号） | 风险或盲点 | 为什么会被忽略 | 具体改法 | 优先级 |
|---|---|---|---|---|---|
| 1 | `tools/docgen/components/validateAgentData.mjs:25-100`（spec §1-⑤ / R3 / §7-4） | 无断言 15：条目混入 `when`/`notWhen`/`route`/`fallback` 完全无声；但若写成「必须恰 8 键」，`senior-sdet`（`heading`/`sourceLine`）与骨架条目会被误杀 | R3 写着「四键只住触发表」，读者以为 validate 管着；而「加一条键集断言」听起来只有一种写法 | 断言 15 = **上界**而非必填：允许集按 `outputKind` 分档（`testcase` 额外放 `heading`/`sourceLine`），出现四键即报 `TriggerFieldMisplaced`（exit 1）；不要求 `identity`/`fixedList` 必填 | P1 |
| 2 | `validateAgentData.mjs:44-51` + `renderAgent.mjs:34-35`（spec §1-② / §3） | 断言 5 只查 `patternRegistry.sharedBlock` 名单，不查 `sharedBlocks` 有没有这个键；缺键时 `?? ''` 静默渲染成空节 | 「validate 绿」被当「常量齐」 | 断言 5 补「`sharedBlocks[key]` 为非空字符串」；`renderAgent` 缺键抛 `SharedBlockMissing` 而不是 `?? ''` | P1 |
| 3 | `scripts/check-all.mjs:119`（spec §1-⑦ / §5-⑤） | `npm run check` 只对 `reviewer-audit` 跑 A 组 + 十键，12 席注解不在 CI 内，且输出不含被检席名 | 「check 全绿」给人安全感 | 改为遍历 `state=replaced` 的所有席调 `checkAgentFile`，失败信息里打印被检席名（与 `cmdCheckAgents` 口径一致） | P1 |
| 4 | `tools/docgen/test/review-fixes.test.mjs:16-27,60-65`（spec §1-⑫） | 拿 `reviewer-qa` 当「未拆槽样本」；补 when 后 I1/J4 必红。且**进程内 `delete triggerTable[...]` 对 `spawnSync` 子进程无效** | 样本是随手挑的一席，进程边界看不见 | 二选一：① 改用**进程内**调用导出的 `cmdDraft` / `cmdReplace` 断言 `MissingComponentData`；② 加测试专用开关 `DOCGEN_FORCE_UNSPLIT=<seat>` 由 `renderByName` 读取 | P1 |
| 5 | `tools/docgen/cli.mjs:64-65`（spec §4 步 3 / TC-202） | `generate` 对无 `when` 的席 `continue`，`--name` 精确指定时也静默 exit 0 | exit 0 最容易被当「已迁」 | `--name` 精确指定且无 when 时报 `MissingComponentData`，或至少打印 `skip=<seat> registered` | P1 |
| 6 | `tools/docgen/cli.mjs:218-224`（spec R6 / 第 1 轮 P0） | `replace` 只校验 `renderSha256` 与 `goldenAssertion`，**从不读 `compareResult`** → 整文件漂移可落盘 | `goldenAssertion==='pass'` 看上去就是「全过了」 | golden 校验后补 `if (evidence.compareResult !== null) fail('EvidenceInvalid', …)`，与 R6「双闸门」逐字对齐 | P0 |
| 7 | `tools/docgen/cli.mjs:252-259`（spec R6 / TC-106） | 幂等分支在 `TargetDrift` 之前：state 已 `replaced` 且目标==渲染时，任何 evidence 都被「幂等恢复」吞掉 | 幂等是为「崩溃后恢复」写的，看起来无害 | 幂等分支也要求 golden 通过且 `compareResult===null`；或先算 `TargetDrift` 再判幂等，并打印走的是哪条分支 | P1 |
| 8 | `tools/docgen/components/agentData.mjs:23-34`（spec §3） | 12 席骨架条目能渲染出「半空卡」且 exit 0（被 5 的 `continue` 掩盖） | 骨架长得像正式条目 | 渲染后校验：已拆槽席 `identity` / `fixedList` 非空，否则 `MissingComponentData` | P1 |
| 9 | `tools/docgen/acceptance/golden-assert.mjs:30-33`（spec §5-②） | `raw.length <= 1` + 来源行豁免是为 S3 开的；S4 席一旦补一行 `> 来源：`，这只脚会静默放行一行差异 | 「忽略一行」看着无害 | 豁免改为显式白名单（仅 `senior-sdet`），并对 S4 席断言 `ignorable.length === 0` | P2 |
| 10 | `tools/docgen/acceptance/init-evidence.mjs:15-18`（spec §6-4） | 重跑会把 `goldenAssertion`/`renderSha256` 重置为 `pending`；R7 下锚点三项也看不出来 | 「再跑一次覆盖一下」无害直觉 | evidence 已有 `goldenAssertion==='pass'` 时拒绝重跑（除非 `--force`），并记录 `initAt` | P2 |
| 11 | `rules/.inspector-annotations.json`（spec §6-10 / TC-013） | 12 席注解写入后 `git status rules/` 常脏；靠人记「这个 M 是预期的」必然漂移 | 干净口径写成「rules/ 零输出」会被每席的红淹没 | 落一个 `verify-clean.mjs`（允许集写成常量），TC-013 改调它 | P2 |
| 12 | `tools/docgen/evidence.mjs:13-19` + `cli.mjs:314-325`（TC-106） | `EvidenceInvalid` 的 `reason` 只挂在 Error 对象上，`main` 的 catch 只打 code（message === code），三种拒绝原因在 stderr 上不可区分 | 退出码相同就以为「拒绝原因相同」 | `fail` 里把 `reason` 写进 message（或 catch 里补打 `e.reason`），使「字段非法 / golden 未过 / renderSha 不等」可分辨 | P2 |
| 13 | spec §3「无共享块分支」+ `renderAgent.mjs:3-6`（TC-017 / TC-207） | 空值修法必须**只删占位符、保留该行换行**（`replaceAll(key, '')`）；若写成「值 = 单个 `\n`」，按 `fill` 的 `replaceAll(key, () => value)` 会在 `不自行处置` 与 `## 边界` 间留下**两个**空行 | 空行肉眼难分，「1 个还是 2 个」看起来只是写法差异 | spec 修订 3 §3 已写死该修法；实现照此执行；判据一律以产物「恰一空行」为准（TC-017【NBLANK】） | P1 |
| 14 | `tools/docgen/test/cli-gate.test.mjs:11-20`（spec §1-⑫ / §6-12 / TC-114） | 把已拆槽席 `generate` 写死为 exit 1：迁移后必红，最省事的「修法」是删断言；且测试无法区分「渲染漂移」与「还没迁」 | 写测试时该席确实未迁，exit 1 是当时的真话 | 正例改为 `generate --name <已迁席>` exit 0；负例在副本注入一字节后 exit 1；不写「锚点席未替换 → exit 1」 | P0 |
| 15 | `tools/docgen/test/pilot-render.test.mjs:91-101`（spec §1-⑫ / §6-12 / TC-207） | 三连空行断言作用于整卡：issue-card 输出格式本身含三连换行 → 修好空行后仍会误伤；同时缺「恰一空行」断言，抓不到「少一个空行」 | 「整卡更严」是直觉，实际是越界 | 收窄到「通用纪律末条 → `## 边界`」区间（`const head = card.slice(0, card.indexOf('## 边界'))`），并新增 `assert.ok(head.endsWith('不自行处置\n\n'))`；两条都保留，不删原断言 | P1 |

## 9 自检（写完实测）

- **计数三处一致**：本文件 §1 覆盖总表、§3 清单、本节——总数 **39** / 正 **18** / 负 **14** / 边界 **7** / 负+边界 **21 ≥ 18**。
- **计数自算**：`node -e "const fs=require('node:fs');const L=fs.readFileSync('docs/superpowers/specs/2026-10-19-docgen-agent-batch-design-testcase.md','utf8').split(String.fromCharCode(10));const ids=L.filter(l=>/^#### TC-\d{3} /.test(l)).map(l=>l.slice(5,11));const n=ids.map(i=>+i.slice(3));const pos=n.filter(x=>x<100),neg=n.filter(x=>x>=100&&x<200),bd=n.filter(x=>x>=200);console.log('total='+ids.length+' pos='+pos.length+' neg='+neg.length+' boundary='+bd.length+' neg+bd='+(neg.length+bd.length));process.exitCode=(ids.length===39&&pos.length===18&&neg.length===14&&bd.length===7)?0:1"`
- **行数（拆批判据③）**：`(Get-Content docs/superpowers/specs/2026-10-19-docgen-agent-batch-design-testcase.md).Count` —— **以命令输出为准，本文件不写死数字**（写作时 ≤ 700）。
- **覆盖总表回指**：39 行全部指回 spec 修订 3 的 R 编号或节号（§1 / §3 / §4 / §4.1 / §5 / §6 / §7）。
- **引用编号已对齐修订 3**：`§5-①…⑦`、`§7-1…8`、`§4.1-1/2/3`、`§1-①…⑫`、`§6-1…13`（新增 11 槽位特判 / 12 测试改写不删断言 / 13 降级只 pending）。
- **命令语义自查**：无 POSIX `grep`（一律 `Select-String` / node）；无裸 `draft`（一律 `node tools/docgen/cli.mjs draft …`）；无双引号内反斜杠转义双引号；字节写盘一律 node `writeFileSync`；未用 PS `>` / `Out-File` / `git show --output`；`git diff --no-index` 的退出码明确不作判据。
- **快照口径统一**：【WK】【ROWS】【CONST】【DESC】【SNAP】一律取 `git show HEAD:agents/<席>.md`，不依赖 evidence（检查点阶段其余 9 席可能还没跑 init-evidence）；evidence 只由【EVID】断言其自身锚点，且在副本内必须从仓库 fixtures 复制（副本无 `.git`）。
- **SEATS_12 自校验**：见文件头命令（`seats=12 uniq=12`）。
- **常量不复制**：四个常量正文、when 文本、fixedList 条数、12 席参数全部从 spec §3 或 `HEAD` 快照现取；条数一律【ROWS】现算（spec §3 已不存条数）。
