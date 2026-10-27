# 测试用例：Docgen 写盘通路「迁移期 / 变更期」分派

> 归属 spec：`docs/superpowers/specs/2026-10-21-docgen-replace-intent-change-design.md`（**待评审（未定稿）**）
> 版本：**第 2 版（对应 spec 议会第 1 轮修复后）**
> 编写者（第 1 版）：`senior-sdet`（实例 `sdet-2026-10-21-docgen-intent-change`，全新上下文）
> 修订者（第 2 版）：`senior-sdet` 独立实例 `sdet-2026-10-21-docgen-intent-change-r2`（**全新上下文**）
> **修订独立性声明**：本版由 `senior-sdet` 独立实例 `sdet-2026-10-21-docgen-intent-change-r2` 在全新上下文修订；只依据 spec 新版与 `cards.md` 的问题清单逐条落实；编写者 ≠ spec 作者 ≠ 施工者；只改判据与用例，不改 spec。
> **独立性声明（两版共同）**：编写者 ≠ spec 作者 ≠ 施工者。本文件只依据 spec 全文与实现现状（`tools/docgen/**`、`tools/execution-matrix/check-agent.mjs`、`rules/.inspector-annotations.json`、`agents/senior-sdet.md`、`tools/docgen/state.json`）自行核实判据；不从施工结果倒推，不采信转述结论当判据。spec 作者只能核对覆盖与提疑问，不得改写本文件判据。
> 状态：草稿（待评审；定稿 = 每条五要素齐 + 覆盖总表每行指回 R 编号/节号 + 负例与边界 ≥ 正例）
> 命名与落点：`spec-testcase-gate` 判据 1（同目录；spec 名去 `.md` + `-testcase.md`）
> 组织原则：按「**阶段 + 检查点**」分组（迁移段 / 变更段 / diff / 留痕冻结 / 阶段边界 / 注解重判 / 首个使用者 / 全量绿 / 人工验证），不按命令复制。
> **执行顺序 = 组 1→组 8；每组开头重建副本与 state，组末恢复 `$repo` 并清四个 env**（`DOCGEN_DRAFTS_DIR` / `DOCGEN_STATE_PATH` / `DOCGEN_EVIDENCE_DIR` / `DOCGEN_JUDGED_BY`）。人工验证（§3.9 TC-804）在组 8 之后单独执行。
> **第 2 版修订摘要**：① A3–A7 从 `--rejudge` 键表移出，改由 `changes[].machineChecks` 承接（TC-602 改写、新增 TC-606/TC-406/TC-408/TC-409/TC-410）；② `--rejudge none` 的留痕三元（`rejudged=[]` / `judgeMode=none` / `judged=[]`）定死（TC-407）；③ stderr 判读改为「首行以 `<错误码>:` 开头」（spec §3.3 契约，全部代号函数统一）；④ 阶段边界按 R6 四步次序重写，并补 `InvalidName` / 副本无 `.git` 两条负例（TC-505/TC-506/TC-507）；⑤ 补 `suspended` 席、变更段 `TargetDrift`、迁移段不追加 `changes`、幂等不校验凭证、凭证输入空间、删整节、state 置位次序、`diff` 卡缺失等盲点；⑥ 修正三处「现状」误标与 `state-*` 文件顺序污染；⑦ 全表不再写死行数 / 字节数（`numstat` 期望值改为按 HEAD 与渲染字节现算）。

**实现现状基线（2026-10-21 实读，施工前）**：

- `cmdReplace`（`tools/docgen/cli.mjs:201-280`）**无阶段分派**：对每个席都读 `evidence.renderSha256`（`:219-221`）、`goldenAssertion`（`:222-224`）、`compareResult`（`:226-228`）；无 `--expect-change` / `--rejudge` 解析；`main()`（`tools/docgen/cli.mjs:300-317`）只取已知 `flag()`，**未知旗标被静默忽略**。
- `diff` 子命令**不存在**：`main()` 对未知 sub 抛 `UnsupportedKind`（`tools/docgen/cli.mjs:317`）。
- `EXIT` 映射表（`components/validateAgentData.mjs:4-18`）**无** `UnapprovedChange` / `MigrationPhaseClosed`；未映射码在 `main()` 兜底为 exit 2（`tools/docgen/cli.mjs:318-328`）。
- cli 的错误出口写 `${code}: ${message}` 且 `message === code`（`tools/docgen/cli.mjs:326`）⇒ **cli 路径今天已满足**「首行以 `<码>:` 开头」；`acceptance/golden-assert.mjs:56` 在 `message === code` 时**不写冒号** ⇒ 该路径今天**不满足** §3.3 契约（见 TC-507 现状）。
- `readEvidence`（`tools/docgen/evidence.mjs:21-41`）**不校验** `changes` / `rejudged` / `judged` / `judgeMode` / `machineChecks`；现存 evidence 份数 == 席数（现算 `$seatsAll`），均无 `changes` 字段。
- `init-evidence`（`acceptance/init-evidence.mjs:7-18`）**无 name 校验**（`tools/docgen/cli.mjs:164` 有）、**无阶段边界**、git 调用在最前（`:10-12`）且无 `try/catch`。
- `golden-assert`（`acceptance/golden-assert.mjs:13-49`）**无阶段边界**，先 `readEvidence`（`:14`）再 `git show`（`:15`），无条件回写（`:35-38`）。
- `tools/docgen/state.json` 现为 **全部席位 `replaced`**（席位集合与条数以 `$seatsAll` 现算）——仓库内已没有「未迁移席」，迁移段场景必须在副本仓 + 临时 state 上构造。
- 注解 `senior-sdet:*` 恰 10 键全 `pass`（`rules/.inspector-annotations.json:15-24`）；`SEMANTIC_KEYS` = 10 键（`tools/execution-matrix/check-agent.mjs` 导出的 `SEMANTIC_KEYS`），**A3–A7 不在其中**。
- `agents/senior-sdet.md:3` 的 description 仍含「评审测试策略」；`agentData.mjs` 的 `triggerTable['senior-sdet'].when` 同样含（R9 尚未落地）。

**执行环境**：Windows + PowerShell（5.1 / pwsh 7 均可）。字节写盘只用 node `writeFileSync` / `copyFileSync`；**禁** PS `>` / `Out-File` / `git show --output`；**禁** POSIX `grep`（检索用 `Select-String` 或 node）；PS 双引号串里**禁**反斜杠转义双引号（需要引号字符时用单引号或 `String.fromCharCode` 拼）。

## 起点块（全文 cwd / 临时目录 / 席集合）

```powershell
$repo = (git rev-parse --show-toplevel).Trim()
Set-Location $repo
$w2 = Join-Path ([IO.Path]::GetTempPath()) 'docgen-intent-tc'
New-Item -ItemType Directory -Force $w2 | Out-Null
$cp = Join-Path $w2 'repo-copy'
$seatsAll = (node --input-type=module -e "const {agentData}=await import('./tools/docgen/components/agentData.mjs');console.log(agentData.map(a=>a.name).sort().join(','))").Trim()
$seatsAllSp = $seatsAll.Replace(',', ' ')
$seatsOthers = (node --input-type=module -e "const {agentData}=await import('./tools/docgen/components/agentData.mjs');console.log(agentData.map(a=>a.name).filter(n=>n!=='senior-sdet').sort().join(' '))").Trim()
$nBaseline = (node --input-type=module -e "const {BASELINE_RULES,agentPaths}=await import('./tools/docgen/components/baseline.mjs');console.log(BASELINE_RULES.length+agentPaths().length)").Trim()
```

## 环境作用域（副本 / state 重建 / 恢复）

**副本仓**：注入类用例一律在副本内做，不碰工作区；副本不含 `.git` ⇒ 副本内不可用 `init-evidence` / `git show` / `Wk()`；evidence 从 `tools/docgen/fixtures/` 复制。

```powershell
function CopyReset {
  Set-Location $repo
  node -e "const fs=require('node:fs');const {execFileSync}=require('node:child_process');const {dirname,join}=require('node:path');const dst=process.argv[1];fs.rmSync(dst,{recursive:true,force:true});const NL=String.fromCharCode(10);const files=execFileSync('git',['-c','core.quotePath=false','ls-files'],{encoding:'utf8'}).trim().split(NL);const extra=['tools/docgen/state.json','tools/docgen/baseline.json','package.json','tools/docgen/components/renderByName.mjs'];const need=['tools/docgen/cli.mjs','tools/docgen/baseline.json','tools/docgen/templates/agent.md.tpl','tools/docgen/templates/agent-handwritten.md.tpl','tools/docgen/fixtures/senior-sdet.evidence.json','tools/docgen/components/agentData.mjs','tools/docgen/components/renderByName.mjs','agents/senior-sdet.md'];const put=(f)=>{const o=join(dst,f);fs.mkdirSync(dirname(o),{recursive:true});fs.copyFileSync(f,o)};for(const f of new Set([...files,...extra])){if(!f||f.startsWith('.git/')||!fs.existsSync(f))continue;put(f)}const fx='tools/docgen/fixtures';if(fs.existsSync(fx))for(const f of fs.readdirSync(fx))put(fx+'/'+f);fs.mkdirSync(join(dst,'.drafts'),{recursive:true});const miss=need.filter(f=>!fs.existsSync(join(dst,f)));console.log('copy-ready missing='+miss.length+(miss.length?' ['+miss.join(',')+']':''));process.exitCode=miss.length?1:0" "$cp"
  if ($LASTEXITCODE -ne 0) { throw "副本构建失败（缺文件见上）" }
  $env:DOCGEN_DRAFTS_DIR = Join-Path $cp '.drafts'
  $env:DOCGEN_STATE_PATH = Join-Path $cp 'tools/docgen/state.json'
  $env:DOCGEN_EVIDENCE_DIR = Join-Path $cp 'tools/docgen/fixtures'
  Set-Location $cp
}
function Restore {
  Set-Location $repo
  Remove-Item Env:DOCGEN_DRAFTS_DIR, Env:DOCGEN_STATE_PATH, Env:DOCGEN_EVIDENCE_DIR, Env:DOCGEN_JUDGED_BY -ErrorAction SilentlyContinue
}
```

**state 文件（每条用例自建，禁止多例共用一个文件）**：`StateEmpty` / `StateOne` / `StateAllReplaced` 各写一个**按用例号命名**的新文件并切换 `DOCGEN_STATE_PATH`，因此任何一条用例把 state 写成别的值都不会污染下一条。

```powershell
function NewStateFile([string]$tag, [string]$agentsJson) {
  $p = Join-Path $w2 ('state-' + $tag + '.json')
  node -e "require('node:fs').writeFileSync(process.argv[1],JSON.stringify({version:1,agents:JSON.parse(process.argv[2])},null,2)+String.fromCharCode(10))" $p $agentsJson
  if ($LASTEXITCODE -ne 0) { throw "state 构造失败：$tag" }
  $env:DOCGEN_STATE_PATH = $p
  return $p
}
function StateEmpty([string]$tag) { NewStateFile $tag '{}' | Out-Null }
function StateOne([string]$tag, [string]$seat, [string]$value) { NewStateFile $tag ('{"' + $seat + '":"' + $value + '"}') | Out-Null }
function StateAllReplaced([string]$tag) {
  $json = (node --input-type=module -e "const {agentData}=await import('./tools/docgen/components/agentData.mjs');console.log(JSON.stringify(Object.fromEntries(agentData.map(a=>[a.name,'replaced']))))").Trim()
  NewStateFile $tag $json | Out-Null
}
function CopyState([string]$tag) { $env:DOCGEN_STATE_PATH = Join-Path $cp 'tools/docgen/state.json'; "copy-state" }
```

**组级规则**：

1. 组 1→组 8 顺序执行，不跳组（组 4 / 组 6 的成功写盘依赖组 2 的凭证与闸门次序行为已成立）。
2. 每组开头跑 `CopyReset`（需要副本时）或 `Restore`（只读仓库时）；**每条用例开头重建自己的 state 文件**，不复用上一条留下的 state。
3. 组末必跑 `Restore`：回到 `$repo` 并清四个 env；否则后续仓库用例会误用副本的 state / evidence。

## 判据命令代号（全部定义为 PowerShell 函数，可粘贴执行）

> **错误码判读口径（spec §3.3 契约，不是实现细节）**：一律断言「stderr **首个非空行**以 `<错误码>:` 开头」。spec 明写「所有错误路径的 stderr 首个非空行必须以 `错误码:` 开头」，因此实现换顺序、加前缀、把码埋在句中都不合格；本文件不再用「取 stderr 首词」的宽松写法。

```powershell
function ShaOf([string]$file) {
  (node --input-type=module -e "const fs=await import('node:fs');const {createHash}=await import('node:crypto');console.log(createHash('sha256').update(fs.readFileSync(process.argv[1])).digest('hex').toUpperCase())" $file).Trim()
}
function AssertEq([string]$a, [string]$b, [string]$label) {
  if ($a -ne $b) { throw ('RED ' + $label + ': ' + $a + ' != ' + $b) }
  ('GREEN ' + $label)
}
function Inject([string]$file, [string]$from, [string]$to) {
  node -e "const fs=require('node:fs');const p=process.argv[1];const s=fs.readFileSync(p,'utf8');const f=process.argv[2];const t=process.argv[3]==='-EMPTY-'?'':process.argv[3];const n=s.split(f).length-1;if(n!==1){console.error('INJECT-FAIL hits='+n);process.exit(1)}fs.writeFileSync(p,s.split(f).join(t));console.log('inject-ok hits=1')" $file $from $to
  if ($LASTEXITCODE -ne 0) { throw "注入失败（命不中或多次命中）：$file" }
}
function SetChangeEvidence([string]$seat, [string]$renderSha) {
  node --input-type=module -e "const fs=await import('node:fs');const p='tools/docgen/fixtures/'+process.argv[1]+'.evidence.json';const e=JSON.parse(fs.readFileSync(p,'utf8'));e.goldenAssertion='fail';e.compareResult={code:'Mismatch'};e.renderSha256=process.argv[2];fs.writeFileSync(p,JSON.stringify(e,null,2)+String.fromCharCode(10));console.log('change-evidence '+process.argv[1]+' renderSha='+process.argv[2].slice(0,8)+' last='+e.lastWrittenHash.slice(0,8))" $seat $renderSha
  if ($LASTEXITCODE -ne 0) { throw "变更段证据构造失败" }
}
function Render([string]$seat, [string]$out) {
  node --input-type=module -e "const fs=await import('node:fs');const {renderByName}=await import('./tools/docgen/cli.mjs');const n=process.argv[1],o=process.argv[2];const b=Buffer.from(renderByName(n),'utf8');fs.writeFileSync(o,b);console.log('render '+n+' bytes='+b.length)" $seat $out
  if ($LASTEXITCODE -ne 0) { throw "Render 失败：$seat" }
}
function Snap([string]$src, [string]$dst) {
  node -e "const fs=require('node:fs');fs.copyFileSync(process.argv[1],process.argv[2]);console.log('snap '+process.argv[2])" $src $dst
  if ($LASTEXITCODE -ne 0) { throw 'Snap 失败' }
}
function Cmp([string]$a, [string]$b) {
  node -e "const fs=require('node:fs');const a=fs.readFileSync(process.argv[1]),b=fs.readFileSync(process.argv[2]);const eq=a.equals(b);console.log(eq?'EQUAL':'DIFF');process.exitCode=eq?0:1" $a $b
  if ($LASTEXITCODE -ne 0) { throw "Cmp 不等：$a vs $b" }
}
function Arg([int]$exp, [string]$code, [string]$must, [string[]]$cliArgs) {
  node --input-type=module -e "const {spawnSync}=await import('node:child_process');const exp=Number(process.argv[1]),want=process.argv[2],must=process.argv[3],args=process.argv.slice(4);const r=spawnSync(process.execPath,['tools/docgen/cli.mjs',...args],{encoding:'utf8'});const so=r.stdout||'',se=r.stderr||'';const first=(se.split(/\r?\n/).find(l=>l.trim())||'').trim();const head=want==='-'?true:first.startsWith(want+':');const code=first.includes(':')?first.slice(0,first.indexOf(':')):first.split(/\s+/)[0];const need=must==='-'?[]:must.split(',').filter(Boolean);const miss=need.filter(s=>!(so+se).includes(s));const ok=r.status===exp&&head&&miss.length===0;console.log('exit='+r.status+' code='+(code||'-')+' expect='+exp+'/'+want+' colon='+head+' missing='+(miss.length?miss.join(' ~ '):'0')+' ok='+ok);console.log('stdout: '+so.trim());console.log('stderrFirst: '+first);process.exitCode=ok?0:1" $exp $code $must @cliArgs
  if ($LASTEXITCODE -ne 0) { throw "RED Arg($code)" }
}
function Guard([int]$exp, [string]$code, [string]$must, [string]$files, [string[]]$cliArgs) {
  node --input-type=module -e "const fs=await import('node:fs');const {createHash}=await import('node:crypto');const {spawnSync}=await import('node:child_process');const exp=Number(process.argv[1]),want=process.argv[2],must=process.argv[3],files=process.argv[4].split(',').filter(x=>x&&x!=='-'),args=process.argv.slice(5);const sha=(f)=>{try{return createHash('sha256').update(fs.readFileSync(f)).digest('hex').toUpperCase()}catch{return 'ABSENT'}};const before=files.map(sha);const r=spawnSync(process.execPath,['tools/docgen/cli.mjs',...args],{encoding:'utf8'});const after=files.map(sha);const changed=files.filter((f,i)=>before[i]!==after[i]);const so=r.stdout||'',se=r.stderr||'';const first=(se.split(/\r?\n/).find(l=>l.trim())||'').trim();const head=want==='-'?true:first.startsWith(want+':');const code=first.includes(':')?first.slice(0,first.indexOf(':')):first.split(/\s+/)[0];const need=must==='-'?[]:must.split(',').filter(Boolean);const miss=need.filter(s=>!(so+se).includes(s));const ok=r.status===exp&&head&&miss.length===0&&changed.length===0;console.log('exit='+r.status+' code='+(code||'-')+' expect='+exp+'/'+want+' colon='+head+' missing='+(miss.length?miss.join(' ~ '):'0')+' files='+files.length+' changed='+(changed.length?changed.join(','):'0')+' ok='+ok);console.log('stdout: '+so.trim());console.log('stderrFirst: '+first);process.exitCode=ok?0:1" $exp $code $must $files @cliArgs
  if ($LASTEXITCODE -ne 0) { throw "RED Guard($code)" }
}
function ToolArg([string]$tool, [int]$exp, [string]$code, [string]$must, [string[]]$toolArgs) {
  node --input-type=module -e "const {spawnSync}=await import('node:child_process');const tool=process.argv[1],exp=Number(process.argv[2]),want=process.argv[3],must=process.argv[4],args=process.argv.slice(5);const r=spawnSync(process.execPath,['tools/docgen/acceptance/'+tool+'.mjs',...args],{encoding:'utf8'});const so=r.stdout||'',se=r.stderr||'';const first=(se.split(/\r?\n/).find(l=>l.trim())||'').trim();const head=want==='-'?true:first.startsWith(want+':');const need=must==='-'?[]:must.split(',').filter(Boolean);const miss=need.filter(s=>!(so+se).includes(s));const ok=r.status===exp&&head&&miss.length===0;console.log('tool='+tool+' exit='+r.status+' expect='+exp+'/'+want+' colon='+head+' missing='+(miss.length?miss.join(' ~ '):'0')+' ok='+ok);console.log('stdout: '+so.trim());console.log('stderrFirst: '+first);process.exitCode=ok?0:1" $tool $exp $code $must @toolArgs
  if ($LASTEXITCODE -ne 0) { throw "RED ToolArg($tool/$code)" }
}
function Phase([string]$tool, [string]$seat) {
  node --input-type=module -e "const fs=await import('node:fs');const {createHash}=await import('node:crypto');const {spawnSync}=await import('node:child_process');const {evidencePath}=await import('./tools/docgen/evidence.mjs');const tool=process.argv[1],n=process.argv[2],p=evidencePath(n);const sha=(f)=>{try{return createHash('sha256').update(fs.readFileSync(f)).digest('hex').toUpperCase()}catch{return 'ABSENT'}};const before=sha(p);const r=spawnSync(process.execPath,['tools/docgen/acceptance/'+tool+'.mjs',n],{encoding:'utf8'});const after=sha(p);const first=((r.stderr||'').split(/\r?\n/).find(l=>l.trim())||'').trim();const okExit=r.status===2,okPhase=first.startsWith('MigrationPhaseClosed:'),okNotEv=!first.startsWith('EvidenceInvalid:'),okSame=before===after;console.log('tool='+tool+' seat='+n+' exit='+r.status+' phase='+okPhase+' notEvidenceInvalid='+okNotEv+' evidence='+(okSame?'unchanged':'changed'));console.log('stderrFirst: '+first);process.exitCode=(okExit&&okPhase&&okNotEv&&okSame)?0:1" $tool $seat
  if ($LASTEXITCODE -ne 0) { throw "RED Phase($tool)" }
}
function DiffSeat([string]$seat, [string]$out) {
  node --input-type=module -e "const fs=await import('node:fs');const {createHash}=await import('node:crypto');const {spawnSync}=await import('node:child_process');const {evidencePath}=await import('./tools/docgen/evidence.mjs');const n=process.argv[1],out=process.argv[2];const sha=(p)=>{try{return createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase()}catch{return 'ABSENT'}};const card='agents/'+n+'.md',ev=evidencePath(n);const b=[sha(card),sha(ev)];const r=spawnSync(process.execPath,['tools/docgen/cli.mjs','diff','--kind','agent','--name',n],{encoding:'utf8'});const a=[sha(card),sha(ev)];fs.writeFileSync(out,r.stdout||'');const ro=b[0]===a[0]&&b[1]===a[1];console.log('exit='+r.status+' readonly='+(ro?'OK':'CHANGED')+' card='+b[0].slice(0,8)+' evidence='+b[1].slice(0,8));console.log('stderr: '+(r.stderr||'').trim());console.log((r.stdout||'').trim());process.exitCode=(r.status===0&&ro)?0:1" $seat $out
  if ($LASTEXITCODE -ne 0) { throw "RED DiffSeat($seat)" }
}
function DiffCheck([string]$mode, [string]$seat, [string]$out) {
  node --input-type=module -e "const fs=await import('node:fs');const {createHash}=await import('node:crypto');const {renderByName}=await import('./tools/docgen/cli.mjs');const mode=process.argv[1],n=process.argv[2],out=process.argv[3];const sha=(b)=>createHash('sha256').update(b).digest('hex').toUpperCase();const disk=fs.readFileSync('agents/'+n+'.md');const rend=Buffer.from(renderByName(n),'utf8');const lines=fs.readFileSync(out,'utf8').split(/\r?\n/);while(lines.length&&lines[lines.length-1]==='')lines.pop();const Ld=disk.toString('utf8').split('\n'),Lr=rend.toString('utf8').split('\n');const mn=Math.min(Ld.length,Lr.length);let P=0;while(P<mn&&Ld[P]===Lr[P])P++;let S=0;while(S<mn-P&&Ld[Ld.length-1-S]===Lr[Lr.length-1-S])S++;const aE=Ld.length-P-S,bE=Lr.length-P-S,kE=P+1;const bad=[];const m0=/^旧 agents\/([a-z0-9-]+)\.md +sha256=([0-9A-F]{64})（(\d+) 行）$/.exec(lines[0]||'');if(!m0||m0[1]!==n||m0[2]!==sha(disk))bad.push('line0');if(m0&&+m0[3]!==Ld.length)bad.push('line0-count');const m1=/^新 +渲染 +sha256=([0-9A-F]{64})（(\d+) 行）$/.exec(lines[1]||'');if(!m1||m1[1]!==sha(rend))bad.push('line1');if(m1&&+m1[3]!==Lr.length)bad.push('line1-count');const m2=/^差异 - (\d+) \/ \+ (\d+)（首处第 (\d+) 行）$/.exec(lines[2]||'');if(!m2)bad.push('line2');if(mode==='modified'){if(m2&&(+m2[1]!==aE||+m2[2]!==bE||+m2[3]!==kE))bad.push('counts');if(lines.length!==3+aE+bE+1)bad.push('total');for(let i=0;i<aE;i++){if((lines[3+i]||'')!=='- '+Ld[P+i])bad.push('minus'+i)}for(let i=0;i<bE;i++){if((lines[3+aE+i]||'')!=='+ '+Lr[P+i])bad.push('plus'+i)}if(lines[3+aE+bE]!=='凭证 --expect-change '+sha(rend))bad.push('cred')}else{if(m2&&(+m2[1]!==0||+m2[2]!==0))bad.push('counts');if(lines.length!==3)bad.push('total');if(lines.some(l=>l.includes('--expect-change')))bad.push('cred');if(!disk.equals(rend))bad.push('disk-render');if(!/幂等/.test(lines[2]||''))bad.push('hint')}const nonEmpty=(b)=>b.toString('utf8').split('\n').filter(l=>l!=='').length;console.log('mode='+mode+' a/b/k='+aE+'/'+bE+'/'+kE+' rows='+Ld.length+'/'+Lr.length+' nonEmptyRows='+nonEmpty(disk)+'/'+nonEmpty(rend)+' bad='+bad.length+' '+bad.join(','));process.exitCode=bad.length?1:0" $mode $seat $out
  if ($LASTEXITCODE -ne 0) { throw "RED DiffCheck($mode)" }
}
function Chg([string]$seat, [string]$count, [string]$rejudged, [string]$from, [string]$to) {
  node --input-type=module -e "const {readEvidence}=await import('./tools/docgen/evidence.mjs');const n=process.argv[1],c=process.argv[2],r=process.argv[3],ef=process.argv[4]||'-',et=process.argv[5]||'-';const e=readEvidence(n);const arr=e.changes;const absent=!Array.isArray(arr);const SHA=/^[0-9A-F]{64}$/;const bad=[];if(!absent){for(const it of arr){if(!it||typeof it!=='object'){bad.push('item');continue}if(!SHA.test(it.from))bad.push('from');if(!SHA.test(it.to))bad.push('to');if(typeof it.at!=='string'||!it.at||Number.isNaN(Date.parse(it.at)))bad.push('at');if(!Array.isArray(it.rejudged)||it.rejudged.some(x=>typeof x!=='string'))bad.push('rejudged')}}const last=absent?{}:(arr[arr.length-1]||{});const rej=(last.rejudged||[]).join(',');console.log('changes='+(absent?'absent':arr.length)+' from='+(last.from||'-')+' to='+(last.to||'-')+' at='+(last.at||'-')+' rejudged=['+rej+'] fields='+(bad.length?'BAD:'+bad.join(','):'OK'));let ok=bad.length===0;if(c==='absent'){ok=ok&&absent}else if(absent){ok=false}else{if(String(arr.length)!==String(c)){console.log('MISMATCH count expect='+c);ok=false}if(r==='EMPTY'){if((last.rejudged||[]).length!==0){console.log('MISMATCH rejudged 非空');ok=false}}else if(r!=='-'){const want=r.split(',').filter(Boolean).sort().join(',');const got=(last.rejudged||[]).slice().sort().join(',');if(want!==got){console.log('MISMATCH rejudged expect='+want+' got='+got);ok=false}}if(ef!=='-'&&last.from!==ef){console.log('MISMATCH from');ok=false}if(et!=='-'&&last.to!==et){console.log('MISMATCH to');ok=false}}process.exitCode=ok?0:1" $seat $count $rejudged $from $to
  if ($LASTEXITCODE -ne 0) { throw "RED Chg($seat)" }
}
function Judge([string]$seat, [string]$mode, [string]$rejudged) {
  node --input-type=module -e "const {readEvidence}=await import('./tools/docgen/evidence.mjs');const {SEMANTIC_KEYS}=await import('./tools/execution-matrix/check-agent.mjs');const n=process.argv[1],mode=process.argv[2],rej=process.argv[3];const e=readEvidence(n);const arr=e.changes;if(!Array.isArray(arr)||!arr.length){console.log('changes=absent');process.exit(1)}const L=arr[arr.length-1];const R=Array.isArray(L.rejudged)?L.rejudged:null;const J=Array.isArray(L.judged)?L.judged:null;const M=(L.machineChecks&&typeof L.machineChecks==='object')?L.machineChecks:null;const MK=['A3','A4','A5','A6','A7'];const bad=[];if(!R)bad.push('rejudged');else{const unk=R.filter(k=>!SEMANTIC_KEYS.includes(k));if(unk.length)bad.push('rejudged-unknown:'+unk.join('+'))}if(!M)bad.push('machineChecks');else{const miss=MK.filter(k=>!['pass','fail'].includes(M[k]));const extra=Object.keys(M).filter(k=>!MK.includes(k));if(miss.length)bad.push('machine-missing:'+miss.join('+'));if(extra.length)bad.push('machine-extra:'+extra.join('+'))}if(['subagent','self-degraded','none'].includes(L.judgeMode)===false)bad.push('judgeMode');if(!J)bad.push('judged');else{if(R&&J.length!==R.length)bad.push('judged-count');for(const k of (R||[])){const it=J.find(x=>x&&x.key===k);if(!it)bad.push('judged-missing:'+k);else if(!['pass','fail'].includes(it.verdict)||typeof it.basis!=='string'||!it.basis.trim())bad.push('judged-bad:'+k)}const extraJ=J.filter(x=>x&&!R.includes(x.key));if(extraJ.length)bad.push('judged-extra:'+extraJ.map(x=>x.key).join('+'))}if(R&&R.length&&(typeof L.judgedBy!=='string'||!L.judgedBy.trim()))bad.push('judgedBy');if((!R||!R.length)&&J&&J.length)bad.push('judged-nonempty');const got=(R||[]).slice().sort().join(',');let ok=(mode==='-'||L.judgeMode===mode);if(rej==='EMPTY'){if(got!=='')ok=false}else if(rej!=='-'&&got!==rej.split(',').sort().join(','))ok=false;if(bad.length)ok=false;console.log('judgeMode='+L.judgeMode+' rejudged=['+got+'] judged='+(J?J.length:'-')+' machine='+(M?Object.keys(M).length:'-')+' bad='+(bad.length?bad.join(','):'OK'));process.exitCode=ok?0:1" $seat $mode $rejudged
  if ($LASTEXITCODE -ne 0) { throw "RED Judge($seat)" }
}
function EvScan([string]$expect, [string[]]$seats) {
  node --input-type=module -e "const {readEvidence}=await import('./tools/docgen/evidence.mjs');const expect=process.argv[1],seats=process.argv.slice(2);let red=0;const rows=[];for(const n of seats){let st;try{const e=readEvidence(n);st='ok'+(Array.isArray(e.changes)?'/changes='+e.changes.length:'/no-changes')}catch(err){st=err.code||err.name}const ok=expect==='ok'?st.startsWith('ok'):st==='EvidenceInvalid';if(!ok)red++;rows.push(n+'='+st+(ok?'':' <-- FAIL'))}console.log(rows.join(' | '));console.log('scan expect='+expect+' seats='+seats.length+' red='+red);process.exitCode=red?0:1" $expect @seats
  if ($LASTEXITCODE -ne 0) { throw "RED EvScan($expect)" }
}
function Ann([string]$seat) {
  node --input-type=module -e "const {checkAgentFile,readAnnotations,SEMANTIC_KEYS}=await import('./tools/execution-matrix/check-agent.mjs');const n=process.argv[1];const r=checkAgentFile(n);const ann=readAnnotations();const notPass=SEMANTIC_KEYS.filter(k=>ann[n+':'+k]!=='pass');console.log('ok='+r.ok+' findings='+r.findings.length+' notPass='+notPass.join(',')+' a1a2From='+r.a1a2From);process.exitCode=(r.ok&&!notPass.length)?0:1" $seat
  if ($LASTEXITCODE -ne 0) { throw "RED Ann($seat)" }
}
function Keys([string[]]$seats) {
  node --input-type=module -e "const {readAnnotations,SEMANTIC_KEYS}=await import('./tools/execution-matrix/check-agent.mjs');const ann=readAnnotations();const bad=[];for(const s of process.argv.slice(1)){const ks=Object.keys(ann).filter(k=>k.startsWith(s+':'));const miss=SEMANTIC_KEYS.map(k=>s+':'+k).filter(k=>!Object.prototype.hasOwnProperty.call(ann,k));const extra=ks.filter(k=>!SEMANTIC_KEYS.includes(k.slice(s.length+1)));if(ks.length!==SEMANTIC_KEYS.length||miss.length||extra.length)bad.push(s+' keys='+ks.length+' miss='+miss.length+' extra='+extra.length)}console.log('annotation-keys red='+bad.length+' '+bad.join(' / '));process.exitCode=bad.length?1:0" @seats
  if ($LASTEXITCODE -ne 0) { throw 'RED Keys' }
}
function StateExp([string]$expect) {
  node --input-type=module -e "const {readState}=await import('./tools/docgen/state.mjs');const a=process.argv;const i=a.indexOf('--expect');if(i<0){console.log('missing --expect');process.exit(2)}const want=[...new Set(a[i+1].split(',').filter(Boolean))].sort();const s=readState().agents;const rep=Object.keys(s).filter(k=>s[k]==='replaced').sort();const missing=want.filter(n=>!rep.includes(n));const extra=rep.filter(n=>!want.includes(n));console.log('replaced='+rep.length+' expect='+want.length+' missing=['+missing.join(',')+'] extra=['+extra.join(',')+']');process.exitCode=(missing.length||extra.length)?0:1" -- --expect $expect
  if ($LASTEXITCODE -ne 0) { throw 'RED StateExp' }
}
function St1([string]$seat, [string]$expect) {
  node --input-type=module -e "const {readState}=await import('./tools/docgen/state.mjs');const n=process.argv[1],want=process.argv[2];const got=readState().agents[n]||'absent';const ok=got===want;console.log('state['+n+']='+got+' expect='+want+' ok='+ok);process.exitCode=ok?0:1" $seat $expect
  if ($LASTEXITCODE -ne 0) { throw "RED St1($seat)" }
}
function Wk([string[]]$seats) {
  node --input-type=module -e "const {execFileSync}=await import('node:child_process');const {renderByName}=await import('./tools/docgen/cli.mjs');const bad=[];for(const n of process.argv.slice(1)){const g=execFileSync('git',['show','HEAD:agents/'+n+'.md'],{encoding:'utf8'});const ok=Buffer.from(renderByName(n),'utf8').equals(Buffer.from(g,'utf8'));console.log(n+' '+(ok?'EQUAL':'DIFF'));if(!ok)bad.push(n)}console.log('wk seats='+process.argv.slice(1).length+' red='+bad.length);process.exitCode=bad.length?0:1" @seats
  if ($LASTEXITCODE -ne 0) { throw 'RED Wk' }
}
```

> 代号用法约定：`Wk` 只用于「工作区未提交改动的席位以外」的席（前提是盘上 == HEAD）；在副本内不可用 `Wk`（无 `.git`）。
> `StateExp` 的期望值整体加引号并用 `--` 终止 Node 自身选项解析：`StateExp "$seatsAll"`。

**变更段证据样本的构造理由**：spec §0 实测的形态就是「内容已变 → `goldenAssertion` 必为 `fail`、`compareResult` 必非 null、`renderSha256` 为新渲染」。变更段用例一律用这个真实形态（`SetChangeEvidence`），从而同时证明「变更段不读那三个字段」。

## 1 覆盖总表

| 用例 ID | 覆盖的 spec 条目 | 类别 / 检查点 | 正·负·边界 | 判据命令 | 现状 |
|---|---|---|---|---|---|
| TC-101 | R1 / §3.1 左列 / §5① / §7-1 / §9 | 迁移段：S1–S6 脚本全绿 | 正 | `replace-scenarios.mjs` + 计数 | 今天应绿 |
| TC-102 | R1 / §3.1 左列（`renderSha256`）/ §5① 后半 | 迁移段：内容有差异仍被拒 | 正 | `CopyReset` + `Guard` | 绿 |
| TC-103 | R2 / §3.1 左列末两行 / §6-4 | 迁移段出现 `--expect-change` | 负 | `Guard` | 红（未知旗标被静默忽略） |
| TC-104 | R7 / §3.1 左列末两行 / §6-4 | 迁移段出现 `--rejudge` | 负 | `Guard` | 红 |
| TC-105 | R1 / §3.1 左右列对照 | 同一构造在两段的差异（对照组） | 边界 | `Guard` + `Arg` | 半红（迁移段那条绿，变更段那条红） |
| TC-106 | R1（`suspended` 落迁移段）/ §8（不提供 suspended 变更通路）/ §6-4 | `suspended` 席带 `--expect-change` → 拒 | 边界 | `Guard` + `St1` | 红（`--expect-change` 被忽略，今天会照写） |
| TC-107 | §3.4「迁移段成功：不追加 `changes`」/ R1 | 迁移段首次替换成功，`changes` 不追加 | 正 | `Arg` + `St1` + `Chg` + 内联 node（evidence 两哈希） | 绿（今天也成功且不写 `changes`） |
| TC-108 | §3.3 末条（未知旗标白名单） | 拼错旗标 `--expect-cange` → `InvalidArgs` | 负 | `Guard` | 红（静默忽略） |
| TC-109 | §3.5「state 置位次序」/ §6-1 | rename 失败 → state 不回退成 `replaced` | 边界 | `Guard` + `St1` + 构造自检 | 红（`tools/docgen/cli.mjs:266` 先置 state） |
| TC-110 | §3.3 stderr 格式契约 | 错误路径首行以 `<码>:` 开头 | 边界 | `Arg` | 绿（`tools/docgen/cli.mjs:326` 已带冒号） |
| TC-201 | R2 / §3.1 右列 / §5③ | 正确凭证 → 写盘成功 | 正 | `Arg` + `Cmp` + `StateExp` | 红 |
| TC-202 | R2 / §3.3 / §5③ | 缺凭证 → 拒 | 负 | `Guard` | 红 |
| TC-203 | R2 / §3.3 / §6-2 | 错凭证 → 拒 | 负 | `Guard` | 红 |
| TC-204 | R2 / §6-2 / §5③ | 旧凭证（旧盘上哈希）→ 拒 | 负 | `Guard` | 红 |
| TC-205 | R2（大小写不敏感） | 小写凭证 → 过 | 边界 | `Arg` + `Cmp` | 红 |
| TC-206 | §3.5 / §3.1 末行 / §6-5 | 盘上==渲染 → 幂等分支 | 边界 | `Arg` + `Chg` + 内联 node（evidence 两哈希） | 绿 |
| TC-207 | R7 / §3.3 / §3.6 | 凭证对但 `--rejudge` 漏 A2 | 负 | `Guard` | 红 |
| TC-208 | §3.1（草稿字节==渲染）/ §5① | 变更段草稿漂移仍拒 | 负 | `Guard` | 绿 |
| TC-209 | §3.5 崩溃窗口 | rename 已做、evidence 未写 → 幂等收敛 | 边界 | `Snap` + `Arg` + `Chg` | 红（撞 `tools/docgen/cli.mjs:219` 的 `EvidenceInvalid`，见该例现状） |
| TC-210 | §3.1（`collectGate` 两段同）/ §6-3 | 变更段非目标漂移仍被拒 | 负 | `Guard` | 红（撞 `tools/docgen/cli.mjs:219`（若过则 `:222`），得 exit 2 而非 exit 1） |
| TC-211 | §3.1（`TargetDrift` 两段同）/ §3.5 | 变更段盘上哈希 ≠ `lastWrittenHash` → `TargetDrift` | 负 | `Guard` | 绿（今天不分段也会先撞 `tools/docgen/cli.mjs:265` 的 `TargetDrift`；施工后须仍绿） |
| TC-212 | §3.1 末行 / §6-5 | 幂等分支不校验凭证（给错凭证仍成功） | 边界 | `Arg` + `Cmp` + `Chg` | 绿（今天也会走到幂等分支，因为四道证明全过；施工后须仍绿） |
| TC-213 | R2（凭证形状）/ §3.3 | 凭证语法非法四态 → `InvalidArgs` | 负 | `Guard` | 红（撞 `tools/docgen/cli.mjs:222`） |
| TC-214 | §3.3 末条 / §4 步 1 | `--expect-change` 后紧跟 `--yes` → 缺值 → `InvalidArgs` | 负 | `Guard` | 红（撞 `tools/docgen/cli.mjs:222`） |
| TC-215 | §3.6 定位方式（两侧行号并集）/ R7 | 删整节 + `--rejudge none` → 拒 | 负 | `Guard` | 红（撞 `tools/docgen/cli.mjs:222`） |
| TC-301 | R3 / §3.2 / §5② | 有差异时输出契约 | 正 | `DiffSeat` + `DiffCheck` | 红 |
| TC-302 | R3 / §3.2 无差异分支 / §5② | 无差异：幂等提示 + exit 0 | 正 | `DiffSeat` + `DiffCheck` | 红 |
| TC-303 | §3.2 参数档位 / §3.3 | `--kind` 非 agent | 负 | `Arg` | 假绿（与「子命令不存在」撞车） |
| TC-304 | §3.2 / §3.3 | 名非法 | 负 | `Arg` | 红 |
| TC-305 | §3.2 / §3.3 | 条目缺失 | 负 | `Arg` | 红 |
| TC-306 | §3.2（未拆槽）/ §3.3 | 未拆槽席 | 边界 | `Arg` + 自检 | 红 |
| TC-307 | R3 / §5② / §6-3 | 只读不变式（卡与 evidence 不变） | 边界 | `DiffSeat` + `ShaOf` | 红 |
| TC-308 | R3 / §3.2 差异算法 | 两处分离差异合并成一块 | 边界 | `DiffCheck` | 红 |
| TC-309 | §3.2（`agents/<名>.md` 不存在）/ §3.3 | `diff` 的卡缺失 → `DanglingBaselineEntry` | 负 | `Arg` + `CopyReset` | 红（今天得 `UnsupportedKind`） |
| TC-310 | §3.2 行数口径 | 「`<N>` 行」= `split('\n')` 元素数（含末尾空串） | 边界 | `DiffCheck`（`rows` 断言） | 红 |
| TC-311 | §3.2 中段行格式 | 中段空行 = `符号 + 一个空格`，禁 `trim` | 边界 | `DiffCheck` + 中段逐行断言 | 红 |
| TC-401 | R4 / §3.4 / §5④ | `changes` 追加一项且四字段合法 | 正 | `Chg` | 红 |
| TC-402 | R4 / R5 / §5④ / §6-1 | 迁移锚点六字段冻结 | 正 | `EvSix` | 红 |
| TC-403 | §3.4（`changes` 可缺省） | 现存 evidence（份数 = 席数）合法 | 正 | `EvScan` | 绿 |
| TC-404 | §3.4（`changes` 校验） | 非法 `changes` → `EvidenceInvalid` | 负 | `EvScan` | 红 |
| TC-405 | §3.4 / R7（空 `rejudged`） | 空 `rejudged` 数组合法 | 边界 | `EvScan` + `Chg` | 绿（今天 `readEvidence` 完全不看 `changes`） |
| TC-406 | R7 / §3.4（`machineChecks` 必填五键）/ §5⑥ | 变更成功后 `machineChecks` 五键齐全 | 正 | `Judge` | 红（变更被 `tools/docgen/cli.mjs:222` 拦，达不到前置） |
| TC-407 | §3.4（`rejudged=[]` 三元）/ R7 | `--rejudge none` 的留痕三元定死 | 边界 | `Judge` + `Chg` | 红 |
| TC-408 | §3.4（`machineChecks` 缺失 → `EvidenceInvalid`）/ §3.3 | 缺 `machineChecks` / 缺一键 → `EvidenceInvalid` | 负 | `EvScan` | 红（今天不被校验） |
| TC-409 | §3.4（`rejudged` 只允 10 键）/ R7 | `rejudged` 含 `A3` → `EvidenceInvalid` | 负 | `EvScan` | 红 |
| TC-410 | §3.6「只报不判 = 视为漏报」/ §3.4 | 多报键缺 `judged` 记录 → `EvidenceInvalid` | 负 | `EvScan` | 红 |
| TC-501 | R6 / §5⑤ / §3.3 | `init-evidence` 阶段边界 | 正 | `Phase` | 红 |
| TC-502 | R6 / §5⑤ / §3.3 | `golden-assert` 阶段边界 | 正 | `Phase` | 红 |
| TC-503 | R6（只关 `replaced`）/ §5⑤ | 未迁移席仍可跑 | 边界 | 内联 node + 独立 state | 绿 |
| TC-504 | R6 四步次序（②先于③） | 已迁席 + 坏 evidence → 报阶段而非 `EvidenceInvalid` | 边界 | 内联 node | 红（今天先 `readEvidence`） |
| TC-505 | R6 ① `assertAgentName` / §3.3 | `init-evidence ../../evil` → `InvalidName` | 负 | `ToolArg` | 红（今天无 name 校验） |
| TC-506 | R6 ②「此步不碰 git」/ §5⑤ | 副本（无 `.git`）已迁席 → 阶段码而非 ENOENT | 边界 | `Phase`（副本内） | 红（今天抛 git 异常） |
| TC-507 | R6 ③ `readEvidence` / §3.3 | 未迁席 + 坏 evidence → `EvidenceInvalid` | 边界 | 内联 node | 红（语义对、契约缺冒号：`golden-assert.mjs:56`） |
| TC-601 | R7 / §3.6 表 A 首行 / §5⑥ | description 差异 + 报 `A2` → 过 | 正 | `Arg` + `Chg` | 红 |
| TC-602 | R7 / §3.6「多报无害」/ §3.4（`rejudged` 只允 10 键） | 全量报满 `SEMANTIC_KEYS`（10 键）→ 过 | 正 | `Arg` + `Judge` | 红 |
| TC-603 | R7 / §3.6 表 A 首行 / §3.3 | description 差异 + `none` → 拒 | 负 | `Guard` | 红 |
| TC-604 | R7 / §3.6 表 A 次行（`A1`） | identity 差异 + 只报 `A2` → 拒 | 负 | `Guard` | 红 |
| TC-605 | R7 / §3.6 表 A 末行 | 来源声明行差异 + `none` → 过 | 正 | `Arg` | 红 |
| TC-606 | §3.3（未知旗标/非法参数）/ §3.4（A3–A7 不进 `--rejudge`）/ R7 | 传 `A3` 作 `--rejudge` 键 → `InvalidArgs` | 负 | `Guard` | 红 |
| TC-701 | R9 / §3.7 / §5⑦ | 首个使用者 copy 端到端 | 正 | `Snap` + `DiffSeat` + `DiffCheck` + `Cmp` + 逐行比对 | 红 |
| TC-702 | R9 / §5⑦ / §4 步 6 | repo 端到端 `numstat`（期望值现算） | 正 | node 三命令 + `Wk` | 待施工后 |
| TC-703 | R9 / §3.7 理由（`## 边界` 节无该职责） | 卡与数据不再含「评审测试策略」 | 边界 | 次数统计 | 红（今天两处各 1 次） |
| TC-704 | R7 / §5⑥ / §6-6 / §3.4（`judgedBy` / `judged[]`） | 重判落账：键值 + 键集恰 10 + 判者与依据 | 正 | `Judge` + `Keys` + `Ann` + 独立性断言 | 半绿（键值/键集今天绿；`judgedBy`/`judged[]`/`machineChecks` 今天红） |
| TC-801 | §5⑧ / §7-8 | `npm run check` 全绿 | 正 | `npm run check` + 计数 | 今天应绿 |
| TC-802 | §5⑧ / §6-3 | `gate` 绿 + `generate` 0 drift | 正 | `Arg` ×2 | 今天应绿 |
| TC-803 | §6-7 / §5⑧ | 副本手改卡 → `gate` 红 | 负 | 副本 + `Arg` | 绿 |
| TC-804 | §7「只手动验证」/ §4 步 5 确认判据 | 人工验证记录（非机器用例） | 边界 | 人读 + 记录表 | 待施工后 |

**计数**：用例 **67** 条 = 正 **20**（TC-101、102、107、201、301、302、401、402、403、406、501、502、601、602、605、701、702、704、801、802）+ 负 **26**（TC-103、104、108、202、203、204、207、208、210、211、213、214、215、303、304、305、309、404、408、409、410、505、603、604、606、803）+ 边界 **21**（TC-105、106、109、110、205、206、209、212、306、307、308、310、311、405、407、503、504、506、507、703、804）；**负例 + 边界 = 47 ≥ 正例 20** ✓。编号一经分配不改号、不重排（第 2 版新增 106–110 / 211–215 / 309–311 / 406–410 / 505–507 / 606 / 804）。

**计数核对命令**（本文件自身事实，可复算）：

```powershell
$self = 'docs/superpowers/specs/2026-10-21-docgen-replace-intent-change-design-testcase.md'
$nCase = (Select-String -Path $self -Pattern '^#### TC-').Count
$nRow = (Select-String -Path $self -Pattern '^\| TC-\d{3} \|').Count
"case=$nCase rows=$nRow"
if ($nCase -ne $nRow) { throw 'RED: 用例条数与覆盖总表行数不一致' }
```

## 2 与 S4 testcase 的对应关系（spec §9 明确要求）

| S4 旧用例 | 旧结论 | 本文件处置 | 承接用例 |
|---|---|---|---|
| S4-TC-106（replace 五模式闸门） | 迁移段仍有效 | **保留、不降级**：脚本化 S1–S6 + 手工五模式矩阵归入迁移段组，判据不变 | TC-101、TC-102、TC-107 |
| S4-TC-107（替换后卡字节不变） | 只在迁移期成立 | **降级为迁移期用例**：其「替换后字节不变」判据**不得**用于变更段（变更段合法的差异恰由凭证批准） | TC-102（迁移段仍拒）、TC-103（迁移段不许带凭证）、TC-107 |
| S4-TC-110（重跑 `init-evidence` 自毁） | 迁移期观测 | **降级为历史用例**：本 spec R6 让它直接拒跑，不必等它自毁；判据更强 | TC-501、TC-502、TC-506 |

> 命名消歧：本表用 `S4-TC-xxx` 指 S4 那份 testcase 的用例号，避免与本文件的同号用例（如本文件的 TC-110「stderr 首行契约」）混淆。

## 3 用例明细

### 3.1 迁移段回归（R1 / §3.1 左列 / §5① / §7-1）

> 本组前置（每条都先跑）：`CopyReset` → `StateEmpty '<用例号>'`（每条自己的 state 文件，不复用）→ 按需注入改动。组末 `Restore`。

#### TC-101 正：S1–S6 六场景全绿

- **覆盖**：R1 + §3.1 左列 + §5① + §7-1 + §9（承接 S4-TC-106）
- **前置**：`Restore`（cwd=`$repo`，三个 env 已清）；工作区无未提交改动（脚本内部自建临时副本）
- **步骤**：① 跑 `node tools/docgen/acceptance/replace-scenarios.mjs`；② 统计 `PASS S<n>` 出现次数与末行
- **预期**：exit 0；`PASS S1`…`PASS S6` 各一次；末行 `PASS 6/6`
- **判据**：

```powershell
Restore
$o = (node tools/docgen/acceptance/replace-scenarios.mjs 2>&1 | Out-String)
$code = $LASTEXITCODE
$pass = ([regex]::Matches($o, 'PASS S\d')).Count
$want = ([regex]::Matches((Get-Content tools/docgen/acceptance/replace-scenarios.mjs -Raw), "scenario\('S\d")).Count
if ($code -ne 0 -or $pass -ne $want -or $o -notmatch ('PASS ' + $want + '/' + $want)) { $o; throw ('RED: exit=' + $code + ' pass=' + $pass + ' want=' + $want) }
"GREEN: exit=0 pass=$pass/$want"
```

- **红绿**：红 = 任一场景红（分派改坏了首次替换路径）；绿 = 脚本内声明的场景数全 PASS 且末行同数
- **现状**：今天应绿（脚本已存在，见 `replace-scenarios.mjs:86-168`；期望值 `$want` 由脚本现算，不写死 6）

#### TC-102 正：未迁移席内容有差异，仍被 `EvidenceInvalid` 拒

- **覆盖**：R1 + §3.1 左列「`evidence.renderSha256 == sha256(渲染)` 必须」+ §5① 后半（新增保护）
- **前置**：`CopyReset`（cwd=`$cp`，三个 env 指向副本）；`StateEmpty '102'`（副本默认 state 是全部席位 replaced，必须改用空 state 才算迁移段）
- **步骤**：
  ① `StateEmpty '102'`
  ② `Inject 'tools/docgen/components/agentData.mjs' '、评审测试策略、或' '，或'`（内容有差异）
  ③ `Render 'senior-sdet' "$w2/sd.new.md"`（草稿字节 == 新渲染，排除 `DraftDrift` 这条替代解释）
  ④ `Guard 2 'EvidenceInvalid' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--yes')`
- **预期**：exit 2、stderr 首行 `EvidenceInvalid:`、卡字节不变（副本 fixture 的 `renderSha256` 是旧渲染哈希，与新渲染不等）
- **判据**：

```powershell
CopyReset
StateEmpty '102'
Inject 'tools/docgen/components/agentData.mjs' '、评审测试策略、或' '，或'
Render 'senior-sdet' "$w2/sd.new.md"
Guard 2 'EvidenceInvalid' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--yes')
```

- **红绿**：红 = 迁移段放行了「内容有差异」的席（未来新席失去迁移保护）；绿 = 被 `renderSha256` 闸门拒
- **现状**：绿（现状对每个席都读 `renderSha256`，`tools/docgen/cli.mjs:219-221`）；**施工后必须仍绿**——这条就是防「分派写坏」的守卫

#### TC-103 负：迁移段出现 `--expect-change` → `InvalidArgs`（exit 2）

- **覆盖**：R2（迁移段出现即 `InvalidArgs`）+ §3.1 左列末两行 + §6-4
- **前置**：`CopyReset`；`StateEmpty '103'`（迁移段）；evidence 保持 fixture 原值（`golden=pass` / `compare=null` / `renderSha256`=当前渲染）
- **步骤**：① `Render 'senior-sdet' "$w2/sd.ok.md"`；② `$h = ShaOf "$w2/sd.ok.md"`；③ `Guard 2 'InvalidArgs' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.ok.md",'--expect-change',$h,'--yes')`
- **预期**：exit 2、stderr 首行 `InvalidArgs:`、卡不变（对照：不带该参数时同一构造会成功，证明参数本身是拒绝原因 → 见 TC-107）
- **判据**：

```powershell
CopyReset
StateEmpty '103'
Render 'senior-sdet' "$w2/sd.ok.md"
$h = ShaOf "$w2/sd.ok.md"
Guard 2 'InvalidArgs' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.ok.md",'--expect-change',$h,'--yes')
```

- **红绿**：红 = exit 0（`--expect-change` 被静默忽略，迁移段失去「互斥」语义）；绿 = `InvalidArgs`
- **现状**：**今天红**——`main()`（`tools/docgen/cli.mjs:314`）只取已知旗标，未知旗标被丢弃

#### TC-104 负：迁移段出现 `--rejudge` → `InvalidArgs`（exit 2）

- **覆盖**：R7 + §3.1 左列末两行 + §6-4
- **前置**：`CopyReset`；`StateEmpty '104'`；同 TC-103 的草稿
- **步骤**：① `Render 'senior-sdet' "$w2/sd.ok.md"`；② `Guard 2 'InvalidArgs' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.ok.md",'--rejudge','A2','--yes')`
- **预期**：exit 2、stderr 首行 `InvalidArgs:`、卡不变
- **判据**：

```powershell
CopyReset
StateEmpty '104'
Render 'senior-sdet' "$w2/sd.ok.md"
Guard 2 'InvalidArgs' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.ok.md",'--rejudge','A2','--yes')
```

- **红绿**：红 = 迁移段接受 `--rejudge`（把变更期参数漏进迁移期）；绿 = `InvalidArgs`
- **现状**：今天红（同上）

#### TC-105 边界：同一份证据在两段的差异（对照组）

- **覆盖**：R1 + §3.1 左右列（`goldenAssertion` / `compareResult` 在变更段「不读」）
- **前置**：`CopyReset`；`Inject 'tools/docgen/components/agentData.mjs' '、评审测试策略、或' '，或'`；`Render 'senior-sdet' "$w2/sd.new.md"`；`$hNew = ShaOf "$w2/sd.new.md"`；`SetChangeEvidence 'senior-sdet' $hNew`（golden=fail、compare={code:Mismatch}、renderSha256=新渲染）；先证 `lastWrittenHash` == sha(副本盘上)，否则 `TargetDrift` 会污染归因；**`--rejudge` 非空时必须显式提供判者标识**（`$env:DOCGEN_JUDGED_BY = 'sdet-2026-10-21-tc105-judge'`），未设或为空时 `replace` 报 `UnapprovedChange`（exit 4）并拒写盘
- **步骤**：
  ① 迁移段：`StateEmpty '105'` → `Guard 2 'EvidenceInvalid' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--yes')`
  ② 变更段：`CopyState '105'`（副本默认 state，该席 replaced）→ `Arg 0 '-' '-' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$hNew,'--rejudge','A2','--yes')`
- **预期**：① exit 2 `EvidenceInvalid`（迁移段读 `goldenAssertion`/`compareResult`）；② exit 0（变更段不读这两个字段）
- **判据**：

```powershell
CopyReset
Inject 'tools/docgen/components/agentData.mjs' '、评审测试策略、或' '，或'
Render 'senior-sdet' "$w2/sd.new.md"
$hNew = ShaOf "$w2/sd.new.md"
SetChangeEvidence 'senior-sdet' $hNew
AssertEq (ShaOf 'agents/senior-sdet.md') (node --input-type=module -e "const fs=await import('node:fs');const e=JSON.parse(fs.readFileSync('tools/docgen/fixtures/senior-sdet.evidence.json','utf8'));console.log(e.lastWrittenHash)") 'lastWrittenHash==sha(盘上)'
StateEmpty '105'
Guard 2 'EvidenceInvalid' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--yes')
CopyState '105'
$env:DOCGEN_JUDGED_BY = 'sdet-2026-10-21-tc105-judge'
Arg 0 '-' '-' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$hNew,'--rejudge','A2','--yes')
```

- **红绿**：红 = 两段结果相同（说明没真正分派，只是把闸门全删或全留）；绿 = 迁移段拒、变更段过
- **现状**：半红——① 今天绿；② 今天红（今天不分段，`golden=fail` 被拒）

#### TC-106 边界：`suspended` 席落迁移段，变更参数一律拒

- **覆盖**：R1（「迁移段（≠ replaced，**含 `suspended`**）」）+ §8（不提供 suspended 变更通路）+ §6-4
- **前置**：`CopyReset`；`StateOne '106' 'senior-sdet' 'suspended'`（该席 `suspended`）；evidence 保持 fixture 原值（此时内容未变，四道证明可过——用于对照）
- **步骤**：
  ① `Render 'senior-sdet' "$w2/sd.ok.md"`；`$h = ShaOf "$w2/sd.ok.md"`
  ② 带凭证：`Guard 2 'InvalidArgs' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.ok.md",'--expect-change',$h,'--yes')`
  ③ 对照组（不带凭证）：`Arg 0 '-' '-' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.ok.md",'--yes')`；`St1 'senior-sdet' 'replaced'`
- **预期**：② exit 2 `InvalidArgs`、卡不变；③ exit 0 且 state 由 `suspended` 变为 `replaced`（证明 suspended 被当作迁移段，本 spec 无 suspended 变更通路）
- **判据**：

```powershell
CopyReset
StateOne '106' 'senior-sdet' 'suspended'
Render 'senior-sdet' "$w2/sd.ok.md"
$h = ShaOf "$w2/sd.ok.md"
Guard 2 'InvalidArgs' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.ok.md",'--expect-change',$h,'--yes')
St1 'senior-sdet' 'suspended'
Arg 0 '-' '-' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.ok.md",'--yes')
St1 'senior-sdet' 'replaced'
```

- **红绿**：红 = suspended 席接受 `--expect-change`（等于给这类席偷偷开了变更通路，与 §8 冲突），或 ② 之后 state 已被改写（失败路径越权置位）；绿 = 如预期
- **现状**：红（今天 `--expect-change` 被静默忽略，② 会直接写盘成功、exit 0）
- **盲点说明**：`state.mjs:9` 的值域含 `suspended`，而 v1 只测 `replaced` 与「无此席」两态——这类席既不会进迁移段拒绝也不会进变更段，属「状态 × 事件」漏项（固定清单第 2 条）。

#### TC-107 正：迁移段首次替换成功，`changes` 不追加

- **覆盖**：§3.4「迁移段成功：不追加 `changes`」+ R1（迁移段仍写盘、仍置 state）+ §3.5（state 置位发生在写盘之后）
- **前置**：`CopyReset`；`StateEmpty '107'`；不注入任何内容改动（盘上 == 渲染）；evidence 保持 fixture 原值（四道证明全过）
- **步骤**：
  ① `Render 'senior-sdet' "$w2/sd.new.md"`（state 保持 `StateEmpty '107'`）
  ② `Arg 0 '-' '-' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--yes')`
  ③ `St1 'senior-sdet' 'replaced'`；`Chg 'senior-sdet' 'absent' '-' '-' '-'`（`changes` 必须缺省）
  ④ 读 evidence：`renderSha256` 与 `lastWrittenHash` 均 == sha(渲染)
- **预期**：exit 0；state 变 `replaced`；`changes` 缺省；两个哈希字段 == sha(渲染)
- **判据**：

```powershell
CopyReset
StateEmpty '107'
Render 'senior-sdet' "$w2/sd.new.md"
Arg 0 '-' '-' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--yes')
St1 'senior-sdet' 'replaced'
Chg 'senior-sdet' 'absent' '-' '-' '-'
node --input-type=module -e "const fs=await import('node:fs');const {createHash}=await import('node:crypto');const {renderByName}=await import('./tools/docgen/cli.mjs');const {readEvidence}=await import('./tools/docgen/evidence.mjs');const h=createHash('sha256').update(Buffer.from(renderByName('senior-sdet'),'utf8')).digest('hex').toUpperCase();const e=readEvidence('senior-sdet');const ok=e.renderSha256===h&&e.lastWrittenHash===h&&e.changes===undefined;console.log('render='+e.renderSha256.slice(0,8)+' last='+e.lastWrittenHash.slice(0,8)+' changes='+(e.changes===undefined?'absent':'present')+' ok='+ok);process.exitCode=ok?0:1"
```

- **红绿**：红 = 迁移段也追加了 `changes`（留痕里出现「没被授权过的变更」，审计被污染），或 state 没置位 / 两个哈希没更新；绿 = 如预期
- **现状**：绿（今天写盘成功、`readEvidence` 不产 `changes`；`lastWrittenHash` 已更新，`renderSha256` 在迁移段本就等于渲染哈希）

#### TC-108 负：拼错旗标 `--expect-cange` → `InvalidArgs`（exit 2）

- **覆盖**：§3.3 末条（未知旗标白名单）+ §4 步 1
- **前置**：`CopyReset`；`CopyState '108'`（变更段，凭证与重判参数都合法，唯一的错是拼错的旗标）
- **步骤**：① 注入 `when` 改动 + `Render 'senior-sdet' "$w2/sd.new.md"` + `$hNew` + `SetChangeEvidence`；② `Guard 2 'InvalidArgs' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$hNew,'--rejudge','A2','--expect-cange',$hNew,'--yes')`
- **预期**：exit 2、首行 `InvalidArgs:`、卡不变（拼错即拒，不静默当作已声明）
- **判据**：

```powershell
CopyReset
CopyState '108'
Inject 'tools/docgen/components/agentData.mjs' '、评审测试策略、或' '，或'
Render 'senior-sdet' "$w2/sd.new.md"
$hNew = ShaOf "$w2/sd.new.md"
SetChangeEvidence 'senior-sdet' $hNew
Guard 2 'InvalidArgs' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$hNew,'--rejudge','A2','--expect-cange',$hNew,'--yes')
```

- **红绿**：红 = 拼错的旗标被忽略、写盘成功（用户以为声明了某件事，实际没声明）；绿 = `InvalidArgs`
- **现状**：红（宽松解析，`tools/docgen/cli.mjs:300-317`）

#### TC-109 边界：rename 失败 → state 不得回退成 `replaced`

- **覆盖**：§3.5「state 置位次序：`rename` 成功后才 `setAgentState`；rename 失败必须回滚」+ §6-1
- **前置**：`CopyReset`；`StateEmpty '109'`（迁移段：该席本不是 `replaced`，所以「失败后仍不是 `replaced`」可判）；**构造有效性自检**：把 `agents/senior-sdet.md` 设为只读后，独立跑一次「写临时文件 + rename 覆盖」并断言它确实抛错（Windows 只读目标语义）；构造无效 → 本用例记「环境不适用」，**不得记绿**
- **步骤**：
  ① 构造自检（见判据块第一段，输出 `construct=FAILS-AS-EXPECTED`）
  ② `Render 'senior-sdet' "$w2/sd.ok.md"`；把卡设只读
  ③ `Guard 3 'WriteFailed' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.ok.md",'--yes')`
  ④ `St1 'senior-sdet' 'absent'`（state 里该席仍不存在）；清除只读属性
- **预期**：③ exit 3、首行 `WriteFailed:`、卡字节不变；④ state 未被置为 `replaced`
- **判据**：

```powershell
CopyReset
StateEmpty '109'
node -e "const fs=require('node:fs');const p='agents/senior-sdet.md';fs.chmodSync(p,0o444);const tmp=p+'.probe';fs.writeFileSync(tmp,'x');let fails=false;try{fs.renameSync(tmp,p)}catch(e){fails=true}finally{try{fs.rmSync(tmp,{force:true})}catch(e){};fs.chmodSync(p,0o644)}console.log('construct='+(fails?'FAILS-AS-EXPECTED':'NO-FAIL'));process.exitCode=fails?0:1"
if ($LASTEXITCODE -ne 0) { 'NOT-APPLICABLE: 本环境 rename 覆盖只读目标不失败，本用例记「环境不适用」，不得记绿' }
Render 'senior-sdet' "$w2/sd.ok.md"
node -e "const fs=require('node:fs');fs.chmodSync('agents/senior-sdet.md',0o444);console.log('card-readonly')"
Guard 3 'WriteFailed' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.ok.md",'--yes')
St1 'senior-sdet' 'absent'
node -e "const fs=require('node:fs');fs.chmodSync('agents/senior-sdet.md',0o644);console.log('card-writable')"
```

- **红绿**：红 = 写盘失败但 state 已变 `replaced`（该席从此进变更段，迁移证明被永久跳过——正是 `tools/docgen/cli.mjs:266` 的现病）；绿 = 失败即 `WriteFailed` 且 state 未置位
- **现状**：红（`tools/docgen/cli.mjs:266` 在 `:267-274` 写/rename 之前先 `setAgentState`）
- **盲点说明**：这是「失败面」（固定清单第 3 条）里最容易漏的一条——写盘失败路径在 v1 只有 `DraftDrift` / `TargetDrift`，没有「真写失败」。

#### TC-110 边界：错误路径 stderr 首行以 `<错误码>:` 开头

- **覆盖**：§3.3「stderr 格式契约（新增，供机械断言）」+ §5（错误信息可被脚本按首词读出）
- **前置**：`Restore`（用仓库；本条动作不写盘：缺 `--yes` 在授权闸门即拒）
- **步骤**：`Arg 4 'NotAuthorized' '-' @('replace','--kind','agent','--name','senior-sdet','--draft','whatever.md')`
- **预期**：exit 4；stderr 首个非空行形如 `NotAuthorized: ...`（`Arg` 已断 `startsWith('NotAuthorized:')`）
- **判据**：

```powershell
Restore
Arg 4 'NotAuthorized' '-' @('replace','--kind','agent','--name','senior-sdet','--draft','whatever.md')
```

- **红绿**：红 = 码不在首行或不带冒号（下游脚本按 `^<code>:` 读会读不到，18 条负例全部退化成「stderr 含某串」）；绿 = 契约成立
- **现状**：绿（`tools/docgen/cli.mjs:326` 的 `fail()` 出口今天写 `${code}: ${message}`，`message === code`）
- **说明**：该契约**不是实现细节**——spec 把它写成「把宽松判读变成契约」。但同一条契约在 acceptance 工具上今天**不成立**（`golden-assert.mjs:56` 在 `message === code` 时不写冒号），见 TC-507 现状。

### 3.2 变更段：凭证、闸门次序与恒等恢复（R2 / §3.1 右列 / §3.3 / §3.5 / §5③）

> 本组前置（每条都先跑）：`CopyReset` → `CopyState '<用例号>'`（副本默认 = 全部席位 `replaced`，即变更段）→ 注入 → `Render` → `SetChangeEvidence`。组末 `Restore`。

#### TC-201 正：正确凭证 → 写盘成功（用来源声明行改动，与 A2 解耦）

- **覆盖**：R2 + §3.1 右列（`--expect-change == sha256(渲染)`）+ §5③
- **前置**：`CopyReset`；`CopyState '201'`；`Inject 'tools/docgen/components/agentData.mjs' '改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换。' '改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换（见 R4）。'`（来源声明行，`--rejudge none` 合法）；`Render` 后取 `$hNew` / `$hOld`；`SetChangeEvidence`
- **步骤**：① `Arg 0 '-' '-' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$hNew,'--rejudge','none','--yes')`；② `Cmp 'agents/senior-sdet.md' "$w2/sd.new.md"`；③ `StateExp "$seatsAll"`；④ `Chg 'senior-sdet' 1 'EMPTY' $hOld $hNew`
- **预期**：exit 0；盘上逐字节 == 新渲染；state 全部席位仍 `replaced`；`changes` 追加 1 项且 `rejudged` 为空数组（留痕三元见 TC-407）
- **判据**：

```powershell
CopyReset
CopyState '201'
Inject 'tools/docgen/components/agentData.mjs' '改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换。' '改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换（见 R4）。'
Render 'senior-sdet' "$w2/sd.new.md"
$hNew = ShaOf "$w2/sd.new.md"
$hOld = ShaOf 'agents/senior-sdet.md'
SetChangeEvidence 'senior-sdet' $hNew
Arg 0 '-' '-' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$hNew,'--rejudge','none','--yes')
Cmp 'agents/senior-sdet.md' "$w2/sd.new.md"
StateExp "$seatsAll"
Chg 'senior-sdet' 1 'EMPTY' $hOld $hNew
```

- **红绿**：红 = exit ≠ 0 或盘上 ≠ 渲染（凭证被忽略 / 写盘不原子）；绿 = exit 0 + `EQUAL` + state 符合 + 留痕合法
- **现状**：红（`--expect-change` 未实现；且 `golden=fail` 使今天直接 `EvidenceInvalid`）

#### TC-202 负：缺凭证 → `UnapprovedChange`（exit 4），卡不变，stderr 含两个哈希

- **覆盖**：R2 + §3.3（`UnapprovedChange` 的 stderr 契约）+ §5③
- **前置**：同 TC-201 前置
- **步骤**：`$hOld = ShaOf 'agents/senior-sdet.md'`；`$hNew = ShaOf "$w2/sd.new.md"`；`Guard 4 'UnapprovedChange' "$hOld,$hNew,--expect-change" 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--yes')`
- **预期**：exit 4；首行 `UnapprovedChange:`；stderr 同时出现盘上哈希、渲染哈希与字面 `--expect-change`；卡字节不变
- **判据**：

```powershell
CopyReset
CopyState '202'
Inject 'tools/docgen/components/agentData.mjs' '改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换。' '改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换（见 R4）。'
Render 'senior-sdet' "$w2/sd.new.md"
$hNew = ShaOf "$w2/sd.new.md"
$hOld = ShaOf 'agents/senior-sdet.md'
SetChangeEvidence 'senior-sdet' $hNew
Guard 4 'UnapprovedChange' "$hOld,$hNew,--expect-change" 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--yes')
```

- **红绿**：红 = exit 2/0（缺凭证被判成别的错或直接放行）；绿 = exit 4 且两个哈希都在 stderr 里（人读时能直接复制下一步命令）
- **现状**：红（今天 `golden=fail` → exit 2 `EvidenceInvalid`）

#### TC-203 负：错凭证（全 0）→ `UnapprovedChange`，卡不变

- **覆盖**：R2 + §3.3 + §5③
- **前置**：同 TC-201 前置
- **步骤**：`$bad = '0' * 64`；`Guard 4 'UnapprovedChange' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$bad,'--yes')`
- **预期**：exit 4、首行 `UnapprovedChange:`、卡不变
- **判据**：

```powershell
CopyReset
CopyState '203'
Inject 'tools/docgen/components/agentData.mjs' '改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换。' '改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换（见 R4）。'
Render 'senior-sdet' "$w2/sd.new.md"
SetChangeEvidence 'senior-sdet' (ShaOf "$w2/sd.new.md")
$bad = '0' * 64
Guard 4 'UnapprovedChange' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$bad,'--yes')
```

- **红绿**：红 = 错凭证放行（凭证形同虚设）；绿 = exit 4
- **现状**：红

#### TC-204 负：旧凭证（旧盘上哈希 / 旧渲染哈希）→ `UnapprovedChange`

- **覆盖**：R2（「凭证一变即失效」）+ §6-2（不得用旧哈希）
- **前置**：同 TC-201；`$hOld = ShaOf 'agents/senior-sdet.md'`（改动前的盘上哈希，先证它 == 旧渲染哈希）
- **步骤**：① `Cmp` 证明改动前盘上 == 旧渲染（用 `Render` 到 `$w2/sd.old.md` 再 `Cmp`）；② `Guard` 用 `$hOld` 当凭证 → 拒
- **预期**：① `EQUAL`；② exit 4、首行 `UnapprovedChange:`、卡不变
- **判据**：

```powershell
CopyReset
CopyState '204'
Render 'senior-sdet' "$w2/sd.old.md"
Cmp 'agents/senior-sdet.md' "$w2/sd.old.md"
$hOld = ShaOf 'agents/senior-sdet.md'
Inject 'tools/docgen/components/agentData.mjs' '改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换。' '改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换（见 R4）。'
Render 'senior-sdet' "$w2/sd.new.md"
SetChangeEvidence 'senior-sdet' (ShaOf "$w2/sd.new.md")
Guard 4 'UnapprovedChange' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$hOld,'--yes')
```

- **红绿**：红 = 旧哈希被当凭证接受（凭证没绑「即将写盘的字节」）；绿 = exit 4
- **现状**：红

#### TC-205 边界：凭证小写 → 通过（大小写不敏感）

- **覆盖**：R2「大写 64 位 hex，大小写不敏感」
- **前置**：同 TC-201
- **步骤**：`$lower = $hNew.ToLower()`；`Arg 0 '-' '-' @('replace',...,'--expect-change',$lower,'--rejudge','none','--yes')`；`Cmp` 盘上 vs 渲染
- **预期**：exit 0、盘上 == 渲染
- **判据**：

```powershell
CopyReset
CopyState '205'
Inject 'tools/docgen/components/agentData.mjs' '改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换。' '改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换（见 R4）。'
Render 'senior-sdet' "$w2/sd.new.md"
$hNew = ShaOf "$w2/sd.new.md"
SetChangeEvidence 'senior-sdet' $hNew
$lower = $hNew.ToLower()
Arg 0 '-' '-' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$lower,'--rejudge','none','--yes')
Cmp 'agents/senior-sdet.md' "$w2/sd.new.md"
```

- **红绿**：红 = 小写被拒（把等价输入判成错，属假阳性）；绿 = exit 0
- **现状**：红

#### TC-206 边界：盘上 == 渲染 → 幂等分支（无凭证也成功、不追加留痕）

- **覆盖**：§3.5 + §3.1 末行 + §6-5
- **前置**：`CopyReset`（**不注入任何改动**，盘上 == 渲染）；`CopyState '206'`（该席 replaced）；先跑 `Chg 'senior-sdet' 'absent' '-' '-' '-'` 记下改动前 `changes` 状态（fixture 为缺省）
- **步骤**：① `Render 'senior-sdet' '.drafts/senior-sdet--tc.md'`（**放进 `.drafts`**，否则「清草稿」断言恒真）；② `Arg 0 '幂等恢复' '-' @('replace','--kind','agent','--name','senior-sdet','--draft','.drafts/senior-sdet--tc.md','--yes')`；③ `Chg 'senior-sdet' 'absent' '-' '-' '-'`；④ `.drafts` 为空
- **预期**：exit 0；stdout 含 `幂等恢复`；`changes` 仍缺省（不追加）；`render`/`last` 均 == sha(渲染)；`$cp/.drafts` 为空
- **判据**：

```powershell
CopyReset
CopyState '206'
Render 'senior-sdet' '.drafts/senior-sdet--tc.md'
Arg 0 '幂等恢复' '-' @('replace','--kind','agent','--name','senior-sdet','--draft','.drafts/senior-sdet--tc.md','--yes')
Chg 'senior-sdet' 'absent' '-' '-' '-'
$left = @(Get-ChildItem (Join-Path $cp '.drafts') -File -ErrorAction SilentlyContinue).Count
AssertEq ([string]$left) '0' 'DRAFTS_EMPTY'
node --input-type=module -e "const fs=await import('node:fs');const {createHash}=await import('node:crypto');const {renderByName}=await import('./tools/docgen/cli.mjs');const {readEvidence}=await import('./tools/docgen/evidence.mjs');const h=createHash('sha256').update(Buffer.from(renderByName('senior-sdet'),'utf8')).digest('hex').toUpperCase();const e=readEvidence('senior-sdet');const ok=e.renderSha256===h&&e.lastWrittenHash===h&&e.changes===undefined;console.log('render='+e.renderSha256.slice(0,8)+' last='+e.lastWrittenHash.slice(0,8)+' changes='+(e.changes===undefined?'absent':'present')+' ok='+ok);process.exitCode=ok?0:1"
```

- **红绿**：红 = 幂等分支要求凭证（把「无需凭证」判成必须）或追加了留痕（违反 §6-5）；绿 = 如上
- **现状**：绿（幂等分支已存在，`tools/docgen/cli.mjs:256-263`）；「不写盘」本身**不可从字节观察**，见 §4 缺口 4

#### TC-207 负：凭证对但 `--rejudge` 漏 A2 → 拒

- **覆盖**：R7 + §3.3 + §3.1 右列（`--rejudge` 覆盖 §3.6 触达键）
- **前置**：`CopyReset` + `CopyState '207'` + `when` 注入 + `Render` + `$hNew` + `SetChangeEvidence`
- **步骤**：`Guard 4 'UnapprovedChange' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$hNew,'--rejudge','none','--yes')`
- **预期**：exit 4、首行 `UnapprovedChange:`、卡不变
- **判据**：

```powershell
CopyReset
CopyState '207'
Inject 'tools/docgen/components/agentData.mjs' '、评审测试策略、或' '，或'
Render 'senior-sdet' "$w2/sd.new.md"
$hNew = ShaOf "$w2/sd.new.md"
SetChangeEvidence 'senior-sdet' $hNew
Guard 4 'UnapprovedChange' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$hNew,'--rejudge','none','--yes')
```

- **红绿**：红 = 漏报 A2 却放行（改过的判定对象沿用旧判定）；绿 = exit 4
- **现状**：红

#### TC-208 负：变更段草稿漂移仍拒（`DraftDrift`）

- **覆盖**：§3.1 闸门矩阵首行（两段都必须）+ §5①
- **前置**：同 TC-201；`Render` 后给草稿追加一个字节
- **步骤**：① `node -e "require('node:fs').appendFileSync(process.argv[1],'x')" "$w2/sd.bad.md"`；② `Guard 1 'DraftDrift' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.bad.md",'--expect-change',$hNew,'--rejudge','none','--yes')`
- **预期**：exit 1、首行 `DraftDrift:`、卡不变
- **判据**：

```powershell
CopyReset
CopyState '208'
Inject 'tools/docgen/components/agentData.mjs' '改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换。' '改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换（见 R4）。'
Render 'senior-sdet' "$w2/sd.new.md"
$hNew = ShaOf "$w2/sd.new.md"
SetChangeEvidence 'senior-sdet' $hNew
Snap "$w2/sd.new.md" "$w2/sd.bad.md"
node -e "require('node:fs').appendFileSync(process.argv[1],'x')" "$w2/sd.bad.md"
Guard 1 'DraftDrift' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.bad.md",'--expect-change',$hNew,'--rejudge','none','--yes')
```

- **红绿**：红 = 分派把草稿闸门也一起跳过了；绿 = `DraftDrift`（exit 1 档，`validateAgentData.mjs:10`）
- **现状**：绿（草稿闸门在分段判断之前，`tools/docgen/cli.mjs:215-217`）

#### TC-209 边界：崩溃窗口（rename 已做、evidence 未写）→ 幂等分支收敛，留痕丢一次

- **覆盖**：§3.5「崩溃窗口」+ §6-5 + §3.1 末行
- **前置**：`CopyReset` + `CopyState '209'` + `when` 注入 + `Render 'senior-sdet' "$w2/sd.new.md"`；evidence 保持 fixture 原值（`lastWrittenHash` = 旧盘上哈希，即「evidence 还没写」）
- **步骤**：① `Snap "$w2/sd.new.md" 'agents/senior-sdet.md'`（模拟「文件已 rename」）；② `Arg 0 '幂等恢复' '-' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--yes')`；③ `Chg 'senior-sdet' 'absent' '-' '-' '-'`（已知取舍：留痕丢一次）；④ 读 `render`/`last` == sha(渲染)
- **预期**：exit 0、stdout 含 `幂等恢复`；`changes` 仍缺省；`render`/`last` 更新为渲染哈希
- **判据**：

```powershell
CopyReset
CopyState '209'
Inject 'tools/docgen/components/agentData.mjs' '、评审测试策略、或' '，或'
Render 'senior-sdet' "$w2/sd.new.md"
Snap "$w2/sd.new.md" 'agents/senior-sdet.md'
Arg 0 '幂等恢复' '-' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--yes')
Chg 'senior-sdet' 'absent' '-' '-' '-'
node --input-type=module -e "const fs=await import('node:fs');const {createHash}=await import('node:crypto');const {renderByName}=await import('./tools/docgen/cli.mjs');const {readEvidence}=await import('./tools/docgen/evidence.mjs');const h=createHash('sha256').update(Buffer.from(renderByName('senior-sdet'),'utf8')).digest('hex').toUpperCase();const e=readEvidence('senior-sdet');const ok=e.renderSha256===h&&e.lastWrittenHash===h&&e.changes===undefined;console.log('render='+e.renderSha256.slice(0,8)+' last='+e.lastWrittenHash.slice(0,8)+' changes='+(e.changes===undefined?'absent':'present')+' ok='+ok);process.exitCode=ok?0:1"
```

- **红绿**：红 = 崩溃后重跑要求凭证（真实崩溃后没人事先拿到凭证 → 卡死）或报了 `TargetDrift`（本该走幂等）；绿 = 幂等收敛且 `changes` 未追加
- **现状**：**红**——今天会先撞 `tools/docgen/cli.mjs:219` 的 `renderSha256` 闸门（fixture 里是旧渲染哈希），得到 exit 2 `EvidenceInvalid`，而不是幂等收敛

#### TC-210 负：变更段非目标漂移仍被拒（`collectGate` 两段同）

- **覆盖**：§3.1「`collectGate()` 无被阻塞漂移：两段都必须」+ §6-3 + §3.1 执行次序（`collectGate` 在 `TargetDrift` 之前）
- **前置**：`CopyReset` + `CopyState '210'` + `when` 注入 + `Render` + `$hNew` + `SetChangeEvidence`；再给 `rules/spec-testcase-gate.md` 追加一个字节（非目标漂移，且该文件无草稿）
- **步骤**：`node -e "require('node:fs').appendFileSync(process.argv[1],'x')" 'rules/spec-testcase-gate.md'`；`Guard 1 'Mismatch' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$hNew,'--rejudge','A2','--yes')`
- **预期**：exit 1、首行 `Mismatch:`（被阻塞漂移）、卡不变
- **判据**：

```powershell
CopyReset
CopyState '210'
Inject 'tools/docgen/components/agentData.mjs' '、评审测试策略、或' '，或'
Render 'senior-sdet' "$w2/sd.new.md"
$hNew = ShaOf "$w2/sd.new.md"
SetChangeEvidence 'senior-sdet' $hNew
node -e "require('node:fs').appendFileSync(process.argv[1],'x')" 'rules/spec-testcase-gate.md'
Guard 1 'Mismatch' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$hNew,'--rejudge','A2','--yes')
```

- **红绿**：红 = 变更段凭「有凭证」放过了非目标漂移；绿 = `Mismatch`
- **现状**：**红**——今天先撞 `tools/docgen/cli.mjs:219`（`renderSha256`），若该闸门恰好通过则撞 `tools/docgen/cli.mjs:222`（`goldenAssertion`）；两条都产出 exit 2 `EvidenceInvalid`，而本条要 exit 1 `Mismatch`。**v1 标「绿」是误标**（v1 只对了「会被拒」，没对「被哪道闸门拒」）。

#### TC-211 负：变更段盘上哈希 ≠ `lastWrittenHash` → `TargetDrift`（exit 1），卡字节不变

- **覆盖**：§3.1 闸门矩阵「`sha256(盘上) == evidence.lastWrittenHash`：两段都必须」+ §3.1 执行次序（`TargetDrift` 在凭证校验之前）+ §5①
- **前置**：`CopyReset` + `CopyState '211'`；不注入内容改动（渲染 == 盘上原文）；把**盘上卡**追加一个字节（模拟「别人动过这张卡」），evidence 保持 fixture 原值（`lastWrittenHash` = 原盘上哈希）；`Render` 出草稿（草稿 == 渲染，排除 `DraftDrift`）
- **步骤**：① 追加字节到 `agents/senior-sdet.md` 并记下快照 `$w2/sd.drifted.md`；② `Guard 1 'TargetDrift' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--yes')`（故意不带凭证：`TargetDrift` 在凭证校验之前，缺凭证也必须先报它——`--expect-change` 一律不出现，避免把归因搅浑）；③ `Cmp` 卡与快照
- **预期**：exit 1、首行 `TargetDrift:`、卡字节不变（含被追加的那个字节，即「谁都没被自动覆盖」）
- **判据**：

```powershell
CopyReset
CopyState '211'
Render 'senior-sdet' "$w2/sd.new.md"
node -e "require('node:fs').appendFileSync('agents/senior-sdet.md','x')"
Snap 'agents/senior-sdet.md' "$w2/sd.drifted.md"
Guard 1 'TargetDrift' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--yes')
Cmp 'agents/senior-sdet.md' "$w2/sd.drifted.md"
```

- **红绿**：红 = 变更段跳过 `TargetDrift`（把「盘上被别人改过」当成可写，覆盖别人的改动），或先报凭证错误（说明次序被打乱 → S2 回归会红）；绿 = exit 1 `TargetDrift`
- **现状**：**绿**——今天不分段，但这条构造（不注入内容改动、只动盘上卡）会先撞 `tools/docgen/cli.mjs:265` 的 `TargetDrift`，恰好就是本条期望；施工后必须仍绿（它守的是「次序不被写坏」）
- **盲点说明**：v1 只测了**迁移段**的 `TargetDrift`（S2 脚本覆盖），变更段这道闸门是「两段同」的，但没人写过变更段用例。

#### TC-212 边界：幂等分支不校验凭证（给错凭证仍走幂等）

- **覆盖**：§3.1 末行「盘上 == 渲染（幂等）：允许（不写盘、不追加留痕、**不校验凭证**）」+ §6-5 + §3.5
- **前置**：`CopyReset` + `CopyState '212'`；**不注入改动**（盘上 == 渲染）；evidence **保持 fixture 原值**（四道证明本就全过——这样今天也能走到幂等分支，本条才是纯粹的「凭证闸门是否误伤幂等」判别）
- **步骤**：① 记卡快照；② `Render 'senior-sdet' "$w2/sd.new.md"`；③ `$bad = '0' * 64`；④ `Arg 0 '幂等恢复' '-' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$bad,'--yes')`；⑤ `Chg 'senior-sdet' 'absent' '-' '-' '-'`；⑥ `Cmp` 卡与快照
- **预期**：exit 0（错误凭证**不**导致 `UnapprovedChange`）；`changes` 未追加；卡字节不变
- **判据**：

```powershell
CopyReset
CopyState '212'
Render 'senior-sdet' "$w2/sd.new.md"
Snap 'agents/senior-sdet.md' "$w2/sd.before.md"
$bad = '0' * 64
Arg 0 '幂等恢复' '-' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$bad,'--yes')
Chg 'senior-sdet' 'absent' '-' '-' '-'
Cmp 'agents/senior-sdet.md' "$w2/sd.before.md"
```

- **红绿**：红 = 幂等分支也校验凭证（崩溃恢复被多一道无意义的手动步骤挡住，§3.1 注释明说这是故意的取舍）；绿 = exit 0 + 无留痕 + 字节不变
- **现状**：绿（今天四道证明全过 → 走到幂等分支（`tools/docgen/cli.mjs:256-263`），且幂等分支不读凭证；`--expect-change` 被忽略）
- **说明**：本条的构造**不使用** `SetChangeEvidence`——若把 `goldenAssertion` 设成 `fail`，今天会因为「还没走到幂等分支」而红，那种红与本条要抓的缺陷（幂等分支误要凭证）无关，会污染归因。

#### TC-213 负：凭证语法非法四态 → `InvalidArgs`（exit 2），卡不变

- **覆盖**：R2（凭证 = 大写 64 位 hex）+ §3.3（参数非法档）+ §4 步 1（`--expect-change` 缺值视为 `InvalidArgs`）
- **前置**：`CopyReset` + `CopyState '213'`；用**来源声明行**改动（与 A2 解耦，触达键为「无」）+ `Render` + `SetChangeEvidence`
- **步骤**：依次跑四态：
  ① 非 hex（把首字符换成 `G`）；② 长度 63（去掉末字符）；③ 长度 65（末尾补 `0`）；④ 缺值（`--expect-change` 位于参数末位）
- **预期**：四次都 exit 2、首行 `InvalidArgs:`、卡字节不变
- **判据**：

```powershell
CopyReset
CopyState '213'
Inject 'tools/docgen/components/agentData.mjs' '改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换。' '改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换（见 R4）。'
Render 'senior-sdet' "$w2/sd.new.md"
$hNew = ShaOf "$w2/sd.new.md"
SetChangeEvidence 'senior-sdet' $hNew
$nonHex = 'G' + $hNew.Substring(1)
$len63 = $hNew.Substring(0, $hNew.Length - 1)
$len65 = $hNew + '0'
Guard 2 'InvalidArgs' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$nonHex,'--yes')
Guard 2 'InvalidArgs' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$len63,'--yes')
Guard 2 'InvalidArgs' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$len65,'--yes')
Guard 2 'InvalidArgs' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change')
```

- **红绿**：红 = 非法凭证被当成「凭证不匹配」报 exit 4（用户按「去跑 diff」的提示做，实际是自己打错了），或被放行；绿 = 四次都 `InvalidArgs`
- **现状**：红（今天撞 `tools/docgen/cli.mjs:222` → exit 2 `EvidenceInvalid`，码不对）
- **缺口提示**：spec §3.3 只明文写了「未知旗标 → `InvalidArgs`」「`--expect-change` 后紧跟 `--` 旗标 → 缺值 → `InvalidArgs`」，**未明文**写「非 hex / 长度错 → `InvalidArgs`」；本条按「参数非法归 `InvalidArgs`」的既有档位断言，并在 §5 建议 1 要求 spec 补一句。

#### TC-214 负：`--expect-change` 后紧跟 `--yes` → 缺值 → `InvalidArgs`

- **覆盖**：§3.3 末条（`--expect-change` 后紧跟另一个 `--` 旗标视为缺值）+ §4 步 1
- **前置**：`CopyReset` + `CopyState '214'` + 内容改动 + `Render` + `SetChangeEvidence`；`--yes` 前置一次，确保「授权」不再是变量
- **步骤**：`Guard 2 'InvalidArgs' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--yes','--expect-change','--yes')`
- **预期**：exit 2、首行 `InvalidArgs:`、卡不变（不许把 `--yes` 当凭证值）
- **判据**：

```powershell
CopyReset
CopyState '214'
Inject 'tools/docgen/components/agentData.mjs' '、评审测试策略、或' '，或'
Render 'senior-sdet' "$w2/sd.new.md"
SetChangeEvidence 'senior-sdet' (ShaOf "$w2/sd.new.md")
Guard 2 'InvalidArgs' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--yes','--expect-change','--yes')
```

- **红绿**：红 = `--yes` 被当凭证值（随后报 `UnapprovedChange`，退出码 4 而非 2）或直接放行；绿 = `InvalidArgs`
- **现状**：红（`flag()` 宽松解析把下一个 token 当值，`tools/docgen/cli.mjs:304`；今天撞 `tools/docgen/cli.mjs:222`）

#### TC-215 负：整节删除 + `--rejudge none` → 拒（§3.6 两侧行号并集）

- **覆盖**：§3.6「定位方式：把旧卡与渲染产物两侧的差异行号**取并集**，再按表求下限键集」+ §3.6 表 A 次行（identity 段 → `A1`）+ R7
- **前置**：`CopyReset` + `CopyState '215'`；**从模板里整段删掉 identity 节**（`## 你是谁` 标题 + 空行 + `{{IDENTITY}}` + 空行）——删后渲染产物**没有这一节**，新侧无行可查，只有旧侧行号能定位到 identity 段
- **步骤**：
  ① 删节（命令见判据块，命中次数须恰 1）；② `Render 'senior-sdet' "$w2/sd.new.md"` 并自检渲染确实不含 `## 你是谁`；③ `SetChangeEvidence`；④ `Guard 4 'UnapprovedChange' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$hNew,'--rejudge','none','--yes')`
- **预期**：② 渲染里 `identitySection=absent`；④ exit 4、首行 `UnapprovedChange:`、卡不变
- **判据**：

```powershell
CopyReset
CopyState '215'
node -e "const fs=require('node:fs');const p='tools/docgen/templates/agent-handwritten.md.tpl';const NL=String.fromCharCode(10);const s=fs.readFileSync(p,'utf8');const from='## 你是谁'+NL+NL+'{{IDENTITY}}'+NL+NL;const n=s.split(from).length-1;if(n!==1){console.error('INJECT-FAIL hits='+n);process.exit(1)}fs.writeFileSync(p,s.split(from).join(''));console.log('inject-ok hits=1')"
Render 'senior-sdet' "$w2/sd.new.md"
node --input-type=module -e "const fs=await import('node:fs');const t=fs.readFileSync(process.argv[1],'utf8');const absent=!t.includes('## 你是谁');console.log('identitySection='+(absent?'absent':'present'));process.exitCode=absent?0:1" "$w2/sd.new.md"
$hNew = ShaOf "$w2/sd.new.md"
SetChangeEvidence 'senior-sdet' $hNew
Guard 4 'UnapprovedChange' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$hNew,'--rejudge','none','--yes')
```

- **红绿**：红 = `none` 被放行（映射只按新侧定位 → 整节删除时无行可查 → 改过的判定对象沿用旧判定，正是 R1-后端问题 5 的现病）；绿 = exit 4
- **现状**：红（今天撞 `tools/docgen/cli.mjs:222`）
- **盲点说明**：这是「删掉东西」与「改掉东西」的差别——所有正向映射用例都在「新侧有行」的形态上，只有这条能证明并集定位真的落地。

### 3.3 `diff` 只读与输出契约（R3 / §3.2 / §5②）

> 本组前置：注入类用例先 `CopyReset`；只读类用例先 `Restore`（在仓库跑，最严格：真 fixture + 真卡）。组末 `Restore`。

#### TC-301 正：有差异时输出契约逐项成立

- **覆盖**：R3 + §3.2 有差异块 + §5②
- **前置**：`CopyReset` + `Inject 'tools/docgen/components/agentData.mjs' '、评审测试策略、或' '，或'`
- **步骤**：① `DiffSeat 'senior-sdet' "$w2/diff.out"`；② `DiffCheck 'modified' 'senior-sdet' "$w2/diff.out"`
- **预期**：exit 0、`readonly=OK`；行序与前缀符合 §3.2；`差异 - a / + b（首处第 k 行）` 的 a/b/k 与盘上/渲染现算一致；末行 `凭证 --expect-change <sha(渲染)>`
- **判据**：

```powershell
CopyReset
Inject 'tools/docgen/components/agentData.mjs' '、评审测试策略、或' '，或'
DiffSeat 'senior-sdet' "$w2/diff.out"
DiffCheck 'modified' 'senior-sdet' "$w2/diff.out"
```

- **红绿**：红 = 任何一行前缀/顺序/计数不符，或凭证不是渲染哈希（人眼看到的 diff 与实际写盘字节脱钩）；绿 = 两条命令 exit 0
- **现状**：红（`diff` 未实现，`main()` 抛 `UnsupportedKind`）

#### TC-302 正：无差异时打印幂等提示且 exit 0（用 `reviewer-audit`，本 spec 不动它）

- **覆盖**：R3 + §3.2 无差异块 + §5②（`diff` 在产品席上也必须可用）
- **前置**：`Restore`（cwd=`$repo`，env 已清）；`reviewer-audit` 盘上 == 渲染（本 spec 不改它）
- **步骤**：① `DiffSeat 'reviewer-audit' "$w2/diff-same.out"`；② `DiffCheck 'same' 'reviewer-audit' "$w2/diff-same.out"`
- **预期**：exit 0；恰 3 行；第 3 行形如 `差异 - 0 / + 0（…幂等…）`；**无** `凭证` 行；两行 sha256 相等
- **判据**：

```powershell
Restore
DiffSeat 'reviewer-audit' "$w2/diff-same.out"
DiffCheck 'same' 'reviewer-audit' "$w2/diff-same.out"
```

- **红绿**：红 = 无差异时仍给凭证（诱导用户为「没变」签授权）或 exit ≠ 0；绿 = 如上
- **现状**：红（`diff` 未实现）

#### TC-303 负：`--kind` 非 `agent` → `UnsupportedKind`（exit 2）

- **覆盖**：§3.2 参数档位 + §3.3
- **前置**：`Restore`
- **步骤**：`Arg 2 'UnsupportedKind' '-' @('diff','--kind','rule','--name','senior-sdet')`
- **预期**：exit 2、首行 `UnsupportedKind:`
- **判据**：

```powershell
Restore
Arg 2 'UnsupportedKind' '-' @('diff','--kind','rule','--name','senior-sdet')
```

- **红绿**：红 = 非 agent 被当 agent 处理（越界进 rule 写盘通路）；绿 = `UnsupportedKind`
- **现状**：**假绿**——今天 `diff` 子命令根本不存在，`main()` 抛 `UnsupportedKind`（`tools/docgen/cli.mjs:317`），与本条期望撞车。**施工后才有判别力**，评审时不得据今天的结果判「已通过」。判别力补丁：施工后应同时断言 stderr 里的 `sub` 字段不是 `diff`（见 §5 建议 6）。

#### TC-304 负：名非法 → `InvalidName`（exit 1）

- **覆盖**：§3.2 + §3.3
- **前置**：`Restore`
- **步骤**：`Arg 1 'InvalidName' '-' @('diff','--kind','agent','--name','Bad/Name')`
- **预期**：exit 1、首行 `InvalidName:`（`InvalidName` 在 exit 1 档，`validateAgentData.mjs:7`）
- **判据**：

```powershell
Restore
Arg 1 'InvalidName' '-' @('diff','--kind','agent','--name','Bad/Name')
```

- **红绿**：红 = 非法名进入渲染（可能造成路径穿越或误读）；绿 = `InvalidName`
- **现状**：红（今天得 `UnsupportedKind` exit 2）

#### TC-305 负：条目缺失 → `MissingComponentData`（exit 2）

- **覆盖**：§3.2「条目缺失/未拆槽 → `MissingComponentData`」+ §3.3
- **前置**：`Restore`
- **步骤**：`Arg 2 'MissingComponentData' '-' @('diff','--kind','agent','--name','ghost')`
- **预期**：exit 2、首行 `MissingComponentData:`
- **判据**：

```powershell
Restore
Arg 2 'MissingComponentData' '-' @('diff','--kind','agent','--name','ghost')
```

- **红绿**：红 = ghost 名被渲染成空卡/前半截卡；绿 = `MissingComponentData`
- **现状**：红

#### TC-306 边界：未拆槽席 → `MissingComponentData`（exit 2）

- **覆盖**：§3.2「条目缺失/未拆槽」+ §3.3
- **前置**：`CopyReset`；删掉 `reviewer-reader` 的触发表条目（造出「有数据、未拆槽」的席）
- **步骤**：① 注入删除该行；② 自检 `renderByName('reviewer-reader')` 必须抛 `MissingComponentData`；③ `Arg 2 'MissingComponentData' '-' @('diff','--kind','agent','--name','reviewer-reader')`
- **预期**：② 打印 `MissingComponentData`；③ exit 2 且首行同码
- **判据**：

```powershell
CopyReset
Inject 'tools/docgen/components/agentData.mjs' "  'reviewer-reader': { when: '当主持人调度对描述性/记录性/任意文档做读者视角评审', route: 'reviewer-reader' }," '-EMPTY-'
node --input-type=module -e "const {renderByName}=await import('./tools/docgen/cli.mjs');try{renderByName('reviewer-reader');console.log('INJECT-NOT-APPLIED');process.exit(1)}catch(e){console.log('render='+e.code);process.exitCode=e.code==='MissingComponentData'?0:1}"
Arg 2 'MissingComponentData' '-' @('diff','--kind','agent','--name','reviewer-reader')
```

- **红绿**：红 = 未拆槽席渲染出半截卡（把「没数据」当「没内容」静默交付）；绿 = 与「条目缺失」同一档位
- **现状**：红

#### TC-307 边界：只读不变式（跑前跑后卡与 evidence 的 sha256 不变）

- **覆盖**：R3 + §5②「跑前跑后卡与 evidence 的 sha256 不变」+ §6-3
- **前置**：`Restore`（仓库内跑，用真 fixture + 真卡）
- **步骤**：① 取两哈希；② `DiffSeat 'senior-sdet' "$w2/diff-ro.out"`（内部已断 `readonly=OK`）；③ 再取两哈希并 `AssertEq`
- **预期**：`readonly=OK`；两对哈希逐对相等
- **判据**：

```powershell
Restore
$c0 = ShaOf 'agents/senior-sdet.md'; $e0 = ShaOf 'tools/docgen/fixtures/senior-sdet.evidence.json'
DiffSeat 'senior-sdet' "$w2/diff-ro.out"
$c1 = ShaOf 'agents/senior-sdet.md'; $e1 = ShaOf 'tools/docgen/fixtures/senior-sdet.evidence.json'
AssertEq $c0 $c1 'CARD_UNCHANGED'
AssertEq $e0 $e1 'EVIDENCE_UNCHANGED'
```

- **红绿**：红 = 读数工具落盘（用户每看一次 diff 就多一条留痕 / 多一次 evidence 写入）；绿 = 两哈希不变
- **现状**：红（`diff` 未实现，`DiffSeat` 因 exit ≠ 0 先红）

#### TC-308 边界：两处分离的小改动合并成一块（差异算法取舍）

- **覆盖**：R3 + §3.2 差异算法（`P`/`S` 前后缀 + 中段合并）
- **前置**：`CopyReset`；同时注入两处：`when`（description 行）与 `sourceLine`（来源声明行）
- **步骤**：① 两处 `Inject`；② `DiffSeat`；③ `DiffCheck 'modified'`
- **预期**：中段覆盖两处改动（`a`/`b` 现算，应 > 1）；凭证仍 = sha(渲染)；`DiffCheck` exit 0
- **判据**：

```powershell
CopyReset
Inject 'tools/docgen/components/agentData.mjs' '、评审测试策略、或' '，或'
Inject 'tools/docgen/components/agentData.mjs' '改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换。' '改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换（见 R4）。'
DiffSeat 'senior-sdet' "$w2/diff-two.out"
DiffCheck 'modified' 'senior-sdet' "$w2/diff-two.out"
```

- **红绿**：红 = 只打印第一处、漏掉后续改动（用户签了凭证却看不到全部差异 → 凭证变成盲签）；绿 = `DiffCheck` 通过（它按字节重算 `P`/`S`，不依赖任何写死数字）
- **现状**：红

#### TC-309 负：`agents/<名>.md` 不存在 → `DanglingBaselineEntry`（exit 2）

- **覆盖**：§3.2「`agents/<名>.md` 不存在 → `DanglingBaselineEntry`」+ §3.3（既有档位）
- **前置**：`CopyReset`；删掉副本里的 `agents/reviewer-audit.md`（条目仍在 `agentData`，只是盘上卡缺失）
- **步骤**：① 删除卡文件并断言不存在；② `Arg 2 'DanglingBaselineEntry' '-' @('diff','--kind','agent','--name','reviewer-audit')`
- **预期**：① 卡缺失；② exit 2、首行 `DanglingBaselineEntry:`（不是 `ENOENT` / `UnknownError`，也不是 `MissingComponentData`）
- **判据**：

```powershell
CopyReset
node -e "const fs=require('node:fs');fs.rmSync('agents/reviewer-audit.md',{force:true});console.log('card-exists='+fs.existsSync('agents/reviewer-audit.md'))"
Arg 2 'DanglingBaselineEntry' '-' @('diff','--kind','agent','--name','reviewer-audit')
```

- **红绿**：红 = 卡缺失被报成 `ENOENT`（用户看不出该做什么）或渲染出空卡；绿 = `DanglingBaselineEntry`
- **现状**：红（今天得 `UnsupportedKind`）
- **盲点说明**：「条目缺失」与「卡缺失」是两个不同的失败面：`agentData` 有数据但盘上没文件，`renderByName` 会照常渲染——若 `diff` 不先查盘上文件，就会打印一份「凭空造出的旧卡」对比。

#### TC-310 边界：「`<N>` 行」按 `split('\n')` 口径（含末尾空串）

- **覆盖**：§3.2「行数口径（唯一）」+ §5②
- **前置**：`CopyReset` + 内容改动（有差异才两行都打印行数）
- **步骤**：① `DiffSeat` + `DiffCheck 'modified'`（`DiffCheck` 已断言两处行数 == 各自 `split('\n')` 长度）；② 读它打印的 `rows` 与 `nonEmptyRows`，断言 `rows != nonEmptyRows`（证明口径是「含空行/末尾空串」，不是「非空行数」）
- **预期**：`DiffCheck` exit 0；打印里 `rows` 与 `nonEmptyRows` 两个数不相等
- **判据**：

```powershell
CopyReset
Inject 'tools/docgen/components/agentData.mjs' '、评审测试策略、或' '，或'
DiffSeat 'senior-sdet' "$w2/diff-n.out"
DiffCheck 'modified' 'senior-sdet' "$w2/diff-n.out"
node --input-type=module -e "const fs=await import('node:fs');const {renderByName}=await import('./tools/docgen/cli.mjs');const disk=fs.readFileSync('agents/senior-sdet.md','utf8').split('\n');const rend=renderByName('senior-sdet').split('\n');const ne=(a)=>a.filter(l=>l!=='').length;const ok=disk.length!==ne(disk)&&rend.length!==ne(rend);console.log('rows='+disk.length+'/'+rend.length+' nonEmpty='+ne(disk)+'/'+ne(rend)+' distinguishable='+ok);process.exitCode=ok?0:1"
```

- **红绿**：红 = 行数用「非空行数」（口径二义 → §5⑦ / R9 的「其余行」永远说不清，契约无法逐字断言）；绿 = 两个口径可区分且实现取 `split('\n')`
- **现状**：红（`diff` 未实现）
- **盲点说明**：卡以换行结尾，`split('\n')` 必然多出一个空串元素；此前「卡到底有几行」三个口径互相打架的根因就是口径没定——本版把它钉成判据，不再靠人算。

#### TC-311 边界：中段空行 = `符号 + 一个空格`，禁 `trim`

- **覆盖**：§3.2「中段行格式（唯一）：`-`/`+` + **一个空格** + 该侧原文；原文为空行时该行以「符号 + 一个空格」结尾；实现用切片拼接，**禁止 `trim`**」
- **前置**：`CopyReset`；一次改动**跨过 identity 里的空行**（同时改 identity 的两段文字，使空白行落进中段）
- **步骤**：① 两处 `Inject`（identity 两段各改一处）；② `DiffSeat`；③ `DiffCheck 'modified'`（已按 `'- ' + 原文` / `'+ ' + 原文` 逐字断言）；④ 另断言中段里至少各有一行恰为 `- ` 与 `+ `（行尾保留一个空格）
- **预期**：③ exit 0；④ 两项都为真
- **判据**：

```powershell
CopyReset
Inject 'tools/docgen/components/agentData.mjs' '有十年以上经验的测试开发工程师（SDET）' '有十年以上经验的测试开发工程师'
Inject 'tools/docgen/components/agentData.mjs' '你的名声来自两件事' '你的口碑来自两件事'
DiffSeat 'senior-sdet' "$w2/diff-blank.out"
DiffCheck 'modified' 'senior-sdet' "$w2/diff-blank.out"
node --input-type=module -e "const fs=await import('node:fs');const L=fs.readFileSync(process.argv[1],'utf8').split(/\r?\n/);const minus=L.filter(l=>l==='- ').length;const plus=L.filter(l=>l==='+ ').length;const ok=minus>0&&plus>0;console.log('blankMinus='+minus+' blankPlus='+plus+' ok='+ok);process.exitCode=ok?0:1" "$w2/diff-blank.out"
```

- **红绿**：红 = 空行被 `trim` 成 `-` / `+`（缺那个空格，契约不可逐字断言；且「删了一个空行」与「删了一行文字」在输出上不可区分）；绿 = 如上
- **现状**：红
- **盲点说明**：v1 的缺口 3 把这条列为「spec 未定义、无法断言」；新版 §3.2 已定义，缺口关闭，改为可断言的用例。

### 3.4 留痕与冻结（R4 / R5 / §3.4 / §5④ / §6-1）

> 本组前置：需要写盘的用例先 `CopyReset` + `CopyState '<用例号>'` + 注入 + `Render` + `SetChangeEvidence`；只测 schema 的用例先 `CopyReset` 并用 `DOCGEN_EVIDENCE_DIR` 指向临时目录。组末 `Restore`。

#### TC-401 正：`changes` 追加一项，四字段合法，`from`/`to` 正确

- **覆盖**：R4 + §3.4（基础四字段）+ §5④
- **前置**：`CopyReset` + `CopyState '401'` + `when` 注入 + `Render` + `$hNew` + `$hOld` + `SetChangeEvidence`；先确认改动前 `changes` 缺省；**`--rejudge` 非空时必须显式提供判者标识**（`$env:DOCGEN_JUDGED_BY = 'sdet-2026-10-21-tc401-judge'`），未设或为空时 `replace` 报 `UnapprovedChange`（exit 4）并拒写盘
- **步骤**：① `Chg 'senior-sdet' 'absent' '-' '-' '-'`（写盘前）；② `Arg 0 '-' '-' @('replace',...,'--expect-change',$hNew,'--rejudge','A2','--yes')`；③ `Chg 'senior-sdet' 1 'A2' $hOld $hNew`
- **预期**：`changes=1`、`fields=OK`、`from` = 写盘前盘上哈希、`to` = 渲染哈希、`rejudged` 含 `A2`、`at` 可被 `Date.parse` 解析
- **判据**：

```powershell
CopyReset
CopyState '401'
Inject 'tools/docgen/components/agentData.mjs' '、评审测试策略、或' '，或'
Render 'senior-sdet' "$w2/sd.new.md"
$hNew = ShaOf "$w2/sd.new.md"
$hOld = ShaOf 'agents/senior-sdet.md'
SetChangeEvidence 'senior-sdet' $hNew
Chg 'senior-sdet' 'absent' '-' '-' '-'
$env:DOCGEN_JUDGED_BY = 'sdet-2026-10-21-tc401-judge'
Arg 0 '-' '-' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$hNew,'--rejudge','A2','--yes')
Chg 'senior-sdet' 1 'A2' $hOld $hNew
```

- **红绿**：红 = 没留痕 / `from` 写成渲染哈希 / `at` 不是 ISO；绿 = `Chg` exit 0
- **现状**：红

#### TC-402 正：迁移锚点六字段冻结

- **覆盖**：R4 + R5 + §5④ + §6-1
- **前置**：同 TC-401；写盘前先取六字段快照（`commit` / `blob` / `sha256` / `hashObject` / `goldenAssertion` / `compareResult`）；**`--rejudge` 非空时必须显式提供判者标识**（`$env:DOCGEN_JUDGED_BY = 'sdet-2026-10-21-tc402-judge'`），未设或为空时 `replace` 报 `UnapprovedChange`（exit 4）并拒写盘
- **步骤**：① 写快照；② replace 成功；③ 用同一快照比对
- **预期**：`frozen=OK`；同时 `render`/`last` 已更新
- **判据**：

```powershell
function EvSix([string]$seat, [string]$snap) {
  node --input-type=module -e "const fs=await import('node:fs');const {readEvidence}=await import('./tools/docgen/evidence.mjs');const n=process.argv[1],snap=process.argv[2];const e=readEvidence(n);const F=['commit','blob','sha256','hashObject','goldenAssertion','compareResult'];const six=Object.fromEntries(F.map(k=>[k,e[k]]));console.log('render='+e.renderSha256.slice(0,8)+' last='+e.lastWrittenHash.slice(0,8)+' changes='+(Array.isArray(e.changes)?e.changes.length:'absent'));if(!fs.existsSync(snap)){fs.writeFileSync(snap,JSON.stringify(six));console.log('snap-written');process.exit(0)}const prev=JSON.parse(fs.readFileSync(snap,'utf8'));const bad=F.filter(k=>JSON.stringify(prev[k])!==JSON.stringify(six[k]));console.log('frozen='+(bad.length?'DIFF:'+bad.join(','):'OK'));process.exitCode=bad.length?0:1" $seat $snap
  if ($LASTEXITCODE -ne 0) { throw 'RED EvSix' }
}
CopyReset
CopyState '402'
Inject 'tools/docgen/components/agentData.mjs' '、评审测试策略、或' '，或'
Render 'senior-sdet' "$w2/sd.new.md"
$hNew = ShaOf "$w2/sd.new.md"
SetChangeEvidence 'senior-sdet' $hNew
EvSix 'senior-sdet' "$w2/sd.six.json"
$env:DOCGEN_JUDGED_BY = 'sdet-2026-10-21-tc402-judge'
Arg 0 '-' '-' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$hNew,'--rejudge','A2','--yes')
EvSix 'senior-sdet' "$w2/sd.six.json"
```

- **红绿**：红 = 写盘顺带刷新了锚点（历史被改写，审计失效）；绿 = `frozen=OK`
- **现状**：红（success 路径未实现，达不到前置）

#### TC-403 正：`changes` 可缺省——现存 evidence 全部合法

- **覆盖**：§3.4「`changes` 可缺省（现存 evidence 无此字段，仍合法）」
- **前置**：`Restore`（用仓库真 fixtures）；份数 = 席数（`$seatsAll` 现算，不写死）
- **步骤**：`EvScan 'ok' ($seatsAllSp.Split(' '))`
- **预期**：每席都 `=ok/no-changes`，`red=0`
- **判据**：

```powershell
Restore
EvScan 'ok' ($seatsAllSp.Split(' '))
```

- **红绿**：红 = 把「字段缺省」判成非法（`readEvidence` 一收紧，全部迁移段路径立刻挂）；绿 = `red=0`
- **现状**：绿（`readEvidence` 今天不看 `changes`，`tools/docgen/evidence.mjs:30-38`）

#### TC-404 负：非法 `changes` → `EvidenceInvalid`

- **覆盖**：§3.4（每项基础四字段类型校验）+ §3.3
- **前置**：两个临时证据目录，各复制真 fixture 后改写 `changes`
- **步骤**：① 形态 A `changes=[{from:'abc',to:'XYZ',at:'',rejudged:'A2'}]`（三处非法）；② 形态 B `changes={}`（非数组）；分别 `EvScan 'invalid' 'senior-sdet'`
- **预期**：两次都 `senior-sdet=EvidenceInvalid`、`red=0`
- **判据**：

```powershell
Restore
$ev = Join-Path $w2 'ev-bad'; New-Item -ItemType Directory -Force $ev | Out-Null
Copy-Item (Join-Path $repo 'tools/docgen/fixtures/senior-sdet.evidence.json') $ev -Force
node --input-type=module -e "const fs=await import('node:fs');const p=process.argv[1];const e=JSON.parse(fs.readFileSync(p,'utf8'));e.changes=[{from:'abc',to:'XYZ',at:'',rejudged:'A2'}];fs.writeFileSync(p,JSON.stringify(e,null,2)+String.fromCharCode(10))" (Join-Path $ev 'senior-sdet.evidence.json')
$env:DOCGEN_EVIDENCE_DIR = $ev
EvScan 'invalid' 'senior-sdet'
$ev2 = Join-Path $w2 'ev-bad2'; New-Item -ItemType Directory -Force $ev2 | Out-Null
Copy-Item (Join-Path $repo 'tools/docgen/fixtures/senior-sdet.evidence.json') $ev2 -Force
node --input-type=module -e "const fs=await import('node:fs');const p=process.argv[1];const e=JSON.parse(fs.readFileSync(p,'utf8'));e.changes={};fs.writeFileSync(p,JSON.stringify(e,null,2)+String.fromCharCode(10))" (Join-Path $ev2 'senior-sdet.evidence.json')
$env:DOCGEN_EVIDENCE_DIR = $ev2
EvScan 'invalid' 'senior-sdet'
Remove-Item Env:DOCGEN_EVIDENCE_DIR
```

- **红绿**：红 = 坏留痕被放行（审计数据可以随便写成垃圾）；绿 = 两次都 `EvidenceInvalid`
- **现状**：红（`readEvidence` 今天完全不看 `changes`）

#### TC-405 边界：空 `rejudged` 数组合法（且 `machineChecks` 齐五键）

- **覆盖**：§3.4「`rejudged` 为字符串数组（可为空数组）」+ §3.4「`machineChecks` 每次变更必填，五键齐全」+ R7
- **前置**：`Restore`；临时证据目录，复制真 evidence，写入一项完整合法的变更：`{from:<64 hex>, to:<64 hex>, at:<ISO>, rejudged:[], judgeMode:'none', judged:[], machineChecks:{A3..A7:'pass'}}`（`from`/`to` 取该 evidence 现成的 `sha256` / `lastWrittenHash`）
- **步骤**：① 构造；② `EvScan 'ok' 'senior-sdet'`；③ `Chg 'senior-sdet' 1 'EMPTY' - -`
- **预期**：`=ok/changes=1`、`red=0`；`Chg` 打印 `rejudged=[]` 且 exit 0
- **判据**：

```powershell
Restore
$ev3 = Join-Path $w2 'ev-empty-rej'; New-Item -ItemType Directory -Force $ev3 | Out-Null
node --input-type=module -e "const fs=await import('node:fs');const p=process.argv[1];const e=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));e.changes=[{from:e.sha256,to:e.lastWrittenHash,at:new Date().toISOString(),rejudged:[],judgeMode:'none',judged:[],machineChecks:{A3:'pass',A4:'pass',A5:'pass',A6:'pass',A7:'pass'}}];fs.writeFileSync(p,JSON.stringify(e,null,2)+String.fromCharCode(10));console.log('crafted changes=1 rejudged=[]')" (Join-Path $ev3 'senior-sdet.evidence.json') (Join-Path $repo 'tools/docgen/fixtures/senior-sdet.evidence.json')
$env:DOCGEN_EVIDENCE_DIR = $ev3
EvScan 'ok' 'senior-sdet'
Chg 'senior-sdet' 1 'EMPTY' '-' '-'
Remove-Item Env:DOCGEN_EVIDENCE_DIR
```

- **红绿**：红 = 空数组被判非法（`--rejudge none` 的合法留痕写不进去）；绿 = 两条都 exit 0
- **现状**：绿（今天 `readEvidence` 完全不看 `changes`，非法形态也照收——本条的判别力要等 `changes` 校验落地后才成立，届时若不合法会立刻红）

#### TC-406 正：变更成功后 `machineChecks` 五键齐全、取值合法

- **覆盖**：R7「A3–A7 由 `check-all` 重跑 `checkStruct` 复检，结果记入 `changes[].machineChecks`」+ §3.4（`machineChecks` 必填五键）+ §5⑥
- **前置**：`CopyReset` + `CopyState '406'` + `when` 注入 + `Render` + `SetChangeEvidence` + 独立子代理已完成 `senior-sdet:A2` 重判并写回 annotations，并把该子代理实例标识写入 `DOCGEN_JUDGED_BY`（本用例值：`sdet-2026-10-21-tc406-judge`）；**`--rejudge` 非空时必须显式提供判者标识**（`$env:DOCGEN_JUDGED_BY = 'sdet-2026-10-21-tc406-judge'`），未设或为空时 `replace` 报 `UnapprovedChange`（exit 4）并拒写盘
- **步骤**：① `Arg 0 '-' '-' @('replace',...,'--expect-change',$hNew,'--rejudge','A2','--yes')`；② `Judge 'senior-sdet' 'subagent' 'A2'`
- **预期**：exit 0；`Judge` 输出 `machine=5`、`bad=OK`（`A3`–`A7` 五键齐全、值 ∈ `pass`/`fail`、无多余键；`rejudged=[A2]`；`judged` 恰 1 条且 `key`/`verdict`/`basis` 合法；`judgedBy` 非空）
- **判据**：

```powershell
CopyReset
CopyState '406'
Inject 'tools/docgen/components/agentData.mjs' '、评审测试策略、或' '，或'
Render 'senior-sdet' "$w2/sd.new.md"
$hNew = ShaOf "$w2/sd.new.md"
SetChangeEvidence 'senior-sdet' $hNew
$env:DOCGEN_JUDGED_BY = 'sdet-2026-10-21-tc406-judge'
Arg 0 '-' '-' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$hNew,'--rejudge','A2','--yes')
Judge 'senior-sdet' 'subagent' 'A2'
```

- **红绿**：红 = `machineChecks` 缺键 / 多键 / 值域非法（A3–A7 的复检结果没有落点，等于「机器结构项没人复检」），或 `judged` 与 `rejudged` 不对齐；绿 = `Judge` exit 0
- **现状**：红（变更被 `tools/docgen/cli.mjs:222` 拦，达不到前置）
- **说明**：五键的**取值正确性**归 `check-all` / 线 E（本 spec 不测 `check-all`，见 §4 缺口 10）；本条只断「齐全 + 值域合法 + 与 `rejudged` 对齐」。

#### TC-407 边界：`--rejudge none` 的留痕三元（`rejudged=[]` / `judgeMode=none` / `judged=[]`）

- **覆盖**：§3.4「`rejudged` 为 `[]` 时：`judged` 必须为 `[]`，`judgedBy` 可省，`judgeMode` 写 `none`；`--rejudge none` 一律记为 `[]`，**不得记 `["none"]`**」
- **前置**：`CopyReset` + `CopyState '407'`；用**来源声明行**改动（表 A 判「无键」，`none` 合法）+ `Render` + `SetChangeEvidence`
- **步骤**：① `Arg 0 '-' '-' @('replace',...,'--expect-change',$hNew,'--rejudge','none','--yes')`；② `Chg 'senior-sdet' 1 'EMPTY' - -`；③ `Judge 'senior-sdet' 'none' 'EMPTY'`
- **预期**：exit 0；`rejudged=[ ]`；`judgeMode=none`；`judged` 长度 0；`machineChecks` 五键齐全
- **判据**：

```powershell
CopyReset
CopyState '407'
Inject 'tools/docgen/components/agentData.mjs' '改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换。' '改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换（见 R4）。'
Render 'senior-sdet' "$w2/sd.new.md"
$hNew = ShaOf "$w2/sd.new.md"
SetChangeEvidence 'senior-sdet' $hNew
Arg 0 '-' '-' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$hNew,'--rejudge','none','--yes')
Chg 'senior-sdet' 1 'EMPTY' '-' '-'
Judge 'senior-sdet' 'none' 'EMPTY'
```

- **红绿**：红 = 把字面 `none` 写进 `rejudged`（`["none"]` 不是语义键 → 下游 `check-all` / 审计口径漂），或 `judged` 非空（没重判却留了判定）；绿 = 三元如预期
- **现状**：红（变更被 `tools/docgen/cli.mjs:222` 拦，达不到前置）

#### TC-408 负：缺 `machineChecks` / 缺一键 → `EvidenceInvalid`

- **覆盖**：§3.4「`machineChecks` 每次变更必填，五键 `A3`–`A7` 齐全」+ §3.3
- **前置**：`Restore`；两个临时证据目录，各构造一项变更：A 形态**无** `machineChecks`；B 形态有但缺 `A5`
- **步骤**：分别 `EvScan 'invalid' 'senior-sdet'`
- **预期**：两次都 `EvidenceInvalid`、`red=0`
- **判据**：

```powershell
Restore
$evA = Join-Path $w2 'ev-mc-missing'; New-Item -ItemType Directory -Force $evA | Out-Null
node --input-type=module -e "const fs=await import('node:fs');const e=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));e.changes=[{from:e.sha256,to:e.lastWrittenHash,at:new Date().toISOString(),rejudged:[],judgeMode:'none',judged:[]}];fs.writeFileSync(process.argv[1],JSON.stringify(e,null,2)+String.fromCharCode(10))" (Join-Path $evA 'senior-sdet.evidence.json') (Join-Path $repo 'tools/docgen/fixtures/senior-sdet.evidence.json')
$env:DOCGEN_EVIDENCE_DIR = $evA
EvScan 'invalid' 'senior-sdet'
$evB = Join-Path $w2 'ev-mc-partial'; New-Item -ItemType Directory -Force $evB | Out-Null
node --input-type=module -e "const fs=await import('node:fs');const e=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));e.changes=[{from:e.sha256,to:e.lastWrittenHash,at:new Date().toISOString(),rejudged:[],judgeMode:'none',judged:[],machineChecks:{A3:'pass',A4:'pass',A6:'pass',A7:'pass'}}];fs.writeFileSync(process.argv[1],JSON.stringify(e,null,2)+String.fromCharCode(10))" (Join-Path $evB 'senior-sdet.evidence.json') (Join-Path $repo 'tools/docgen/fixtures/senior-sdet.evidence.json')
$env:DOCGEN_EVIDENCE_DIR = $evB
EvScan 'invalid' 'senior-sdet'
Remove-Item Env:DOCGEN_EVIDENCE_DIR
```

- **红绿**：红 = 缺 `machineChecks` 仍被当合法（A3–A7 的复检结果缺失也能写进证据 = 审计面无记录）；绿 = 两次都 `EvidenceInvalid`
- **现状**：红（`readEvidence` 今天不校验 `changes` 的任何子字段）

#### TC-409 负：`rejudged` 含 `A3` → `EvidenceInvalid`

- **覆盖**：§3.4「`rejudged` 只允许 10 个语义键（`A1` `A2` `B1`–`B4` `C1`–`C4`）；出现别的键（含 `A3`–`A7`）→ `EvidenceInvalid`」+ R7「A3–A7 不进注解、不进 `rejudged`」
- **前置**：`Restore`；临时证据目录，构造一项 `rejudged:['A2','A3']` 且 `judged` 两条齐全（`A2`/`A3` 都有 verdict 与 basis）——证明它被拒的原因是「键不属于 10 键」，不是「判定记录缺失」
- **步骤**：`EvScan 'invalid' 'senior-sdet'`
- **预期**：`EvidenceInvalid`
- **判据**：

```powershell
Restore
$ev9 = Join-Path $w2 'ev-rej-a3'; New-Item -ItemType Directory -Force $ev9 | Out-Null
node --input-type=module -e "const fs=await import('node:fs');const e=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));e.changes=[{from:e.sha256,to:e.lastWrittenHash,at:new Date().toISOString(),rejudged:['A2','A3'],judgeMode:'subagent',judgedBy:'sdet-probe',judged:[{key:'A2',verdict:'pass',basis:'criteria.md A2 + diff：仅 description 触发词删除'},{key:'A3',verdict:'pass',basis:'表头结构逐字一致'}],machineChecks:{A3:'pass',A4:'pass',A5:'pass',A6:'pass',A7:'pass'}}];fs.writeFileSync(process.argv[1],JSON.stringify(e,null,2)+String.fromCharCode(10))" (Join-Path $ev9 'senior-sdet.evidence.json') (Join-Path $repo 'tools/docgen/fixtures/senior-sdet.evidence.json')
$env:DOCGEN_EVIDENCE_DIR = $ev9
EvScan 'invalid' 'senior-sdet'
Remove-Item Env:DOCGEN_EVIDENCE_DIR
```

- **红绿**：红 = `A3` 被当合法语义键（该席注解键集会被写成 11 → `check-all` 判红）；绿 = `EvidenceInvalid`
- **现状**：红
- **对应**：v1 的 TC-602 曾把 `A3–A7` 当 `--rejudge` 键注入，正是本条的来源；现在两处方向一致（键表只有 10 键）。

#### TC-410 负：多报的键缺 `judged` 记录 → `EvidenceInvalid`

- **覆盖**：§3.6「每个多报的键也必须在 `judged[]` 里各有一条判定记录（`key` + `verdict` + `basis`）；**只报不判 = 视为漏报**」+ §3.4（`judged` 逐键一条）
- **前置**：`Restore`；临时证据目录，构造 `rejudged:['A2','B1']` 但 `judged` 只有 `A2` 一条
- **步骤**：`EvScan 'invalid' 'senior-sdet'`
- **预期**：`EvidenceInvalid`
- **判据**：

```powershell
Restore
$ev10 = Join-Path $w2 'ev-judged-missing'; New-Item -ItemType Directory -Force $ev10 | Out-Null
node --input-type=module -e "const fs=await import('node:fs');const e=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));e.changes=[{from:e.sha256,to:e.lastWrittenHash,at:new Date().toISOString(),rejudged:['A2','B1'],judgeMode:'subagent',judgedBy:'sdet-probe',judged:[{key:'A2',verdict:'pass',basis:'criteria.md A2 + diff：仅 description 触发词删除'}],machineChecks:{A3:'pass',A4:'pass',A5:'pass',A6:'pass',A7:'pass'}}];fs.writeFileSync(process.argv[1],JSON.stringify(e,null,2)+String.fromCharCode(10))" (Join-Path $ev10 'senior-sdet.evidence.json') (Join-Path $repo 'tools/docgen/fixtures/senior-sdet.evidence.json')
$env:DOCGEN_EVIDENCE_DIR = $ev10
EvScan 'invalid' 'senior-sdet'
Remove-Item Env:DOCGEN_EVIDENCE_DIR
```

- **红绿**：红 = 「报过」被当成「判过且合格」（`rejudged` 只存键名，多报一个就多一条空头声明 → R7 归零）；绿 = `EvidenceInvalid`
- **现状**：红

### 3.5 阶段边界（R6 / §5⑤ / §3.3）

> 本组前置：`Restore`（用仓库真 state = 全部席位 `replaced`）+ 临时证据目录（**绝不写仓库 fixtures**）；TC-505 / TC-506 在副本（无 `.git`）内跑。组末 `Restore`。

#### TC-501 正：`init-evidence` 在 `replaced` 席 → `MigrationPhaseClosed`（exit 2），evidence 未改写

- **覆盖**：R6（② 判阶段 → ④ 才跑 git）+ §5⑤ + §3.3
- **前置**：`Restore`；`$w2/phase-ev` 复制真 fixture 后指向 `DOCGEN_EVIDENCE_DIR`（证据目录与仓库隔离）
- **步骤**：① 建目录并复制；② `Phase 'init-evidence' 'senior-sdet'`；③ 清 env
- **预期**：exit 2；stderr 首行 `MigrationPhaseClosed:`；evidence 字节不变。§3.3 另要求首行含席名与正确通路（`diff` + `replace --expect-change`）→ 见 TC-804 人工核对
- **判据**：

```powershell
Restore
$pev = Join-Path $w2 'phase-ev'; New-Item -ItemType Directory -Force $pev | Out-Null
Copy-Item (Join-Path $repo 'tools/docgen/fixtures/senior-sdet.evidence.json') $pev -Force
$env:DOCGEN_EVIDENCE_DIR = $pev
Phase 'init-evidence' 'senior-sdet'
Remove-Item Env:DOCGEN_EVIDENCE_DIR
```

- **红绿**：红 = 照跑照写（`goldenAssertion` / `renderSha256` 被重置为 `pending`，锚点被冲掉）；绿 = 阶段码 + evidence 不变
- **现状**：**红**——今天 `init-evidence.mjs:15-18` 无条件 `writeEvidence`，exit 0

#### TC-502 正：`golden-assert` 在 `replaced` 席 → `MigrationPhaseClosed`（exit 2），evidence 未改写

- **覆盖**：R6 + §5⑤ + §3.3
- **前置**：同 TC-501，工具换成 `golden-assert`
- **步骤**：① 建目录并复制；② `Phase 'golden-assert' 'senior-sdet'`；③ 清 env
- **预期**：exit 2、首行 `MigrationPhaseClosed:`、evidence 字节不变
- **判据**：

```powershell
Restore
$pev2 = Join-Path $w2 'phase-ev2'; New-Item -ItemType Directory -Force $pev2 | Out-Null
Copy-Item (Join-Path $repo 'tools/docgen/fixtures/senior-sdet.evidence.json') $pev2 -Force
$env:DOCGEN_EVIDENCE_DIR = $pev2
Phase 'golden-assert' 'senior-sdet'
Remove-Item Env:DOCGEN_EVIDENCE_DIR
```

- **红绿**：红 = 仍能跑（`golden-assert` 在迁移后必然把 `goldenAssertion` 判成 fail，等于每天自己毁掉锚点）；绿 = 拒跑
- **现状**：红（今天 `golden-assert.mjs:35-38` 无条件回写）

#### TC-503 边界：未迁移席仍可跑（阶段边界只管 `replaced`）

- **覆盖**：R6（「`state[name] === 'replaced'` 时拒绝」）+ §5⑤
- **前置**：`Restore`；`StateEmpty '503'`（每条自建 state，无任何 replaced 席）+ 临时证据目录（复制真 fixture）
- **步骤**：设 env → 跑 `golden-assert senior-sdet` → 清两个 env
- **预期**：**不含** `MigrationPhaseClosed`；exit ∈ {0, 1}（`0` = 今天内容仍一致；施工后内容已变则为 `1`，两种都合法）
- **判据**：

```powershell
Restore
$pev3 = Join-Path $w2 'phase-ev3'; New-Item -ItemType Directory -Force $pev3 | Out-Null
Copy-Item (Join-Path $repo 'tools/docgen/fixtures/senior-sdet.evidence.json') $pev3 -Force
StateEmpty '503'
$env:DOCGEN_EVIDENCE_DIR = $pev3
node --input-type=module -e "const {spawnSync}=await import('node:child_process');const r=spawnSync(process.execPath,['tools/docgen/acceptance/golden-assert.mjs','senior-sdet'],{encoding:'utf8'});const t=(r.stdout||'')+(r.stderr||'');const closed=/MigrationPhaseClosed/.test(t);const ok=(r.status===0||r.status===1)&&!closed;console.log('exit='+r.status+' phaseClosed='+closed+' ok='+ok);process.exitCode=ok?0:1"
Remove-Item Env:DOCGEN_STATE_PATH, Env:DOCGEN_EVIDENCE_DIR
```

- **红绿**：红 = 未迁移席也被拒（把阶段边界写成「一律禁止」）；绿 = exit 0/1 且无 `MigrationPhaseClosed`
- **现状**：绿

#### TC-504 边界：已迁席 + 坏 evidence → 报阶段码（②先于③），不报 `EvidenceInvalid`

- **覆盖**：R6 四步次序「② `readState()` 判阶段（**此步不碰 git**）→ ③ `golden-assert` 再 `readEvidence`」
- **前置**：`Restore`（state = 该席 `replaced`）；临时证据目录，复制真 fixture 后**删掉 `lastWrittenHash`**（坏 evidence）
- **步骤**：设 env → 跑 `golden-assert senior-sdet` → 清 env
- **预期**：exit 2；stderr 首行 `MigrationPhaseClosed:`；**不含** `EvidenceInvalid`
- **判据**：

```powershell
Restore
$pev4 = Join-Path $w2 'phase-ev4'; New-Item -ItemType Directory -Force $pev4 | Out-Null
node --input-type=module -e "const fs=await import('node:fs');const e=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));delete e.lastWrittenHash;fs.writeFileSync(process.argv[2],JSON.stringify(e,null,2)+String.fromCharCode(10))" (Join-Path $repo 'tools/docgen/fixtures/senior-sdet.evidence.json') (Join-Path $pev4 'senior-sdet.evidence.json')
$env:DOCGEN_EVIDENCE_DIR = $pev4
node --input-type=module -e "const {spawnSync}=await import('node:child_process');const r=spawnSync(process.execPath,['tools/docgen/acceptance/golden-assert.mjs','senior-sdet'],{encoding:'utf8'});const first=((r.stderr||'').split(/\r?\n/).find(l=>l.trim())||'').trim();const ok=r.status===2&&first.startsWith('MigrationPhaseClosed:')&&!first.startsWith('EvidenceInvalid:');console.log('exit='+r.status+' stderrFirst='+first+' ok='+ok);process.exitCode=ok?0:1"
Remove-Item Env:DOCGEN_EVIDENCE_DIR
```

- **红绿**：红 = 先报 `EvidenceInvalid`（次序反了：坏 evidence 的诊断盖住阶段码，用户误以为「数据坏了」而去修证据，实际这条通路已永久关闭）；绿 = 阶段码
- **现状**：**红**——今天 `golden-assert.mjs:14` 先 `readEvidence`，会得 `EvidenceInvalid`（且不带冒号）
- **说明**：本条是第 2 版**修正**：v1 的 TC-504 断「坏 evidence 先报 `EvidenceInvalid`」，依据是旧 spec 的「先原有校验再判阶段」；spec 第 1 轮已把次序固定为「先判阶段、再 `readEvidence`」，故判据反向。坏 evidence 报 `EvidenceInvalid` 的场景改由 TC-507（未迁席）承接。

#### TC-505 负：`init-evidence ../../evil` → `InvalidName`（exit 1），不落任何证据

- **覆盖**：R6 ① `assertAgentName`（「非法 → `InvalidName`，防 `../../x` 路径穿越」）+ §3.3
- **前置**：`CopyReset`（无 `.git`——顺带证明 name 校验在 git 之前）；临时证据目录指向 `$w2/evil-ev`，跑前清空
- **步骤**：`ToolArg 'init-evidence' 1 'InvalidName' '-' @('../../evil')`
- **预期**：exit 1、首行 `InvalidName:`；`$w2/evil-ev` 与 `$w2` 上**不得**出现 `evil.evidence.json` / `../../evil.evidence.json`
- **判据**：

```powershell
CopyReset
$evil = Join-Path $w2 'evil-ev'; New-Item -ItemType Directory -Force $evil | Out-Null
$env:DOCGEN_EVIDENCE_DIR = $evil
ToolArg 'init-evidence' 1 'InvalidName' '-' @('../../evil')
$leak = @(Get-ChildItem -Path $w2 -Recurse -File -Filter '*.json' -ErrorAction SilentlyContinue | Where-Object { $_.Name -like '*evil*' }).Count
AssertEq ([string]$leak) '0' 'NO-EVIDENCE-LEAK'
Remove-Item Env:DOCGEN_EVIDENCE_DIR
```

- **红绿**：红 = 名字未校验（`init-evidence.mjs:7-9` 直接把 `argv[2]` 拼进路径 → 路径穿越 + 证据写到靶目录），或虽有拒绝但退出码/错误码不对（今天是无 `.git` 环境下的 git 异常）；绿 = `InvalidName` + 零泄漏
- **现状**：红（今天无 name 校验；副本无 `.git` 会先抛 git 调用异常，未捕获 → exit 1 但错误码不是 `InvalidName`）
- **判别力说明**：退出码恰好都是 1，**必须同时断错误码与泄漏文件数**，否则会把「未捕获异常」当成本条通过（典型假阴性）。

#### TC-506 边界：副本（无 `.git`）里对已迁席跑 `golden-assert` → 阶段码，不是 ENOENT

- **覆盖**：R6 ②「`readState()` 判阶段（**此步不碰 git**）」+ §5⑤
- **前置**：`CopyReset`（副本无 `.git`）；`StateAllReplaced '506'`（已迁席）；`DOCGEN_EVIDENCE_DIR` 指向副本 fixtures（已有真 fixture）
- **步骤**：`Phase 'golden-assert' 'senior-sdet'`
- **预期**：exit 2、首行 `MigrationPhaseClosed:`、evidence 不变（**不得**是 `ENOENT` / 栈回溯 / exit 1）
- **判据**：

```powershell
CopyReset
StateAllReplaced '506'
Phase 'golden-assert' 'senior-sdet'
```

- **红绿**：红 = 先碰 git（无 `.git` 环境先炸 ENOENT，用户看不到「这条通路已关闭」这个真正原因），或抛出未捕获异常；绿 = 阶段码
- **现状**：红（今天 `golden-assert.mjs:15` 的 `git show` 在副本内抛异常，`try/catch` 因 `e.code` 未定义而重抛 → exit 1 + 栈）
- **盲点说明**：这是「跨平台 / 跨环境差异」的典型——仓库用例永远有 `.git`，只有副本能暴露「阶段检查写在 git 之后」这个次序错误。

#### TC-507 边界：未迁移席 + 坏 evidence → `EvidenceInvalid`（exit 2）

- **覆盖**：R6 ③「`golden-assert` 再 `readEvidence`（坏 → `EvidenceInvalid`）」+ §3.3 stderr 契约
- **前置**：`Restore`；`StateEmpty '507'`（未迁席，阶段闸门不开）；临时证据目录，复制真 fixture 后删掉 `lastWrittenHash`
- **步骤**：设 env → 跑 `golden-assert senior-sdet` → 清 env
- **预期**：exit 2、首行 `EvidenceInvalid:`；**不含** `MigrationPhaseClosed`
- **判据**：

```powershell
Restore
$pev5 = Join-Path $w2 'phase-ev5'; New-Item -ItemType Directory -Force $pev5 | Out-Null
node --input-type=module -e "const fs=await import('node:fs');const e=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));delete e.lastWrittenHash;fs.writeFileSync(process.argv[2],JSON.stringify(e,null,2)+String.fromCharCode(10))" (Join-Path $repo 'tools/docgen/fixtures/senior-sdet.evidence.json') (Join-Path $pev5 'senior-sdet.evidence.json')
StateEmpty '507'
$env:DOCGEN_EVIDENCE_DIR = $pev5
node --input-type=module -e "const {spawnSync}=await import('node:child_process');const r=spawnSync(process.execPath,['tools/docgen/acceptance/golden-assert.mjs','senior-sdet'],{encoding:'utf8'});const first=((r.stderr||'').split(/\r?\n/).find(l=>l.trim())||'').trim();const ok=r.status===2&&first.startsWith('EvidenceInvalid:')&&!first.startsWith('MigrationPhaseClosed:');console.log('exit='+r.status+' stderrFirst='+first+' ok='+ok);process.exitCode=ok?0:1"
Remove-Item Env:DOCGEN_STATE_PATH, Env:DOCGEN_EVIDENCE_DIR
```

- **红绿**：红 = 连未迁席也被阶段码挡住（把「只管 replaced」写成「一律关闭」），或错误码不带冒号（契约不成立）；绿 = `EvidenceInvalid:`
- **现状**：**红**——语义今天已对（`golden-assert.mjs:14` 抛 `EvidenceInvalid`），但出口 `golden-assert.mjs:56` 在 `message === code` 时**不写冒号**，故首行是 `EvidenceInvalid`（无冒号），契约不成立
- **说明**：本条与 TC-504 成对：同一份坏 evidence，在 `replaced` 席报阶段码、在未迁席报 `EvidenceInvalid`——**只有两条一起看，才能证明次序是「② 判阶段 → ③ readEvidence」而不是反过来**。

### 3.6 注解重判触达映射（R7 / §3.6 / §5⑥）

> 本组共用前置：`CopyReset` → `CopyState '<用例号>'` → 注入 → `Render 'senior-sdet' "$w2/sd.new.md"` → `$hNew` → `SetChangeEvidence`。组末 `Restore`。
> **`--rejudge` 非空时必须显式提供判者标识**：本组凡 `--rejudge` 非空的用例，执行前一律先设 `$env:DOCGEN_JUDGED_BY = '<判者实例标识>'`（值见各用例；等于 spec §3.4 要求落进 `changes[].judgedBy` 的那个实例标识）；未设或为空时 `replace` 直接报 `UnapprovedChange`（exit 4）并拒写盘。
> **键表来源（唯一）**：`--rejudge` 的合法键 = `SEMANTIC_KEYS`（10 键，取 `tools/execution-matrix/check-agent.mjs` 导出的 `SEMANTIC_KEYS`）现算；**A3–A7 绝不作为 `--rejudge` 键**（§3.6 表 B：它们由 `machineChecks` 承接）。

```powershell
$keys10 = (node --input-type=module -e "const {SEMANTIC_KEYS}=await import('./tools/execution-matrix/check-agent.mjs');console.log(SEMANTIC_KEYS.join(','))").Trim()
```

#### TC-601 正：description 行差异 + `--rejudge A2` → 过

- **覆盖**：R7 + §3.6 表 A 首行（frontmatter `description:` 行 → `A2`）+ §5⑥
- **前置**：`CopyReset` + `CopyState '601'` + `when` 注入（首行映射 = `A2`）+ `Render` + `SetChangeEvidence`；**`--rejudge` 非空时必须显式提供判者标识**（`$env:DOCGEN_JUDGED_BY = 'sdet-2026-10-21-tc601-judge'`），未设或为空时 `replace` 报 `UnapprovedChange`（exit 4）并拒写盘
- **步骤**：`Arg 0 '-' '-' @('replace',...,'--expect-change',$hNew,'--rejudge','A2','--yes')`；`Chg 'senior-sdet' 1 'A2' - -`
- **预期**：exit 0；留痕 `rejudged` 恰 `[A2]`
- **判据**：

```powershell
CopyReset
CopyState '601'
Inject 'tools/docgen/components/agentData.mjs' '、评审测试策略、或' '，或'
Render 'senior-sdet' "$w2/sd.new.md"
$hNew = ShaOf "$w2/sd.new.md"
SetChangeEvidence 'senior-sdet' $hNew
$env:DOCGEN_JUDGED_BY = 'sdet-2026-10-21-tc601-judge'
Arg 0 '-' '-' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$hNew,'--rejudge','A2','--yes')
Chg 'senior-sdet' 1 'A2' '-' '-'
```

- **红绿**：红 = 报对了键仍被拒（下限映射写成上限）；绿 = exit 0 且留痕含 A2
- **现状**：红

#### TC-602 正：多报无害——把 `SEMANTIC_KEYS` 10 键全报 → 过（键表不含 A3–A7）

- **覆盖**：R7 + §3.6「`--rejudge` 允许超过下限（多报无害）」+ §3.4「`rejudged` 只允许 10 个语义键」+ §3.6「每个多报的键也必须在 `judged[]` 里各有一条判定记录」
- **前置**：`CopyReset` + `CopyState '602'` + `when` 注入 + `Render` + `SetChangeEvidence`；独立子代理已对 10 键各出一份判定记录（`judged[]` 由施工侧写入，见 TC-704 的落点），并把该子代理实例标识写入 `DOCGEN_JUDGED_BY`（本用例值：`sdet-2026-10-21-tc602-judge`）；**`--rejudge` 非空时必须显式提供判者标识**，未设或为空时 `replace` 报 `UnapprovedChange`（exit 4）并拒写盘
- **步骤**：① `Arg 0 '-' '-' @('replace',...,'--expect-change',$hNew,'--rejudge',$keys10,'--yes')`；② `Chg 'senior-sdet' 1 $keys10 - -`；③ `Judge 'senior-sdet' 'subagent' $keys10`；④ `Keys 'senior-sdet'`
- **预期**：exit 0；`rejudged` 恰为 10 键集合（无序比较）；`judged` 恰 10 条且逐键有 `verdict` + `basis`；`machineChecks` 五键齐全；该席注解键集**仍恰 10**（写 A3 进去就会变 11）
- **判据**：

```powershell
CopyReset
CopyState '602'
Inject 'tools/docgen/components/agentData.mjs' '、评审测试策略、或' '，或'
Render 'senior-sdet' "$w2/sd.new.md"
$hNew = ShaOf "$w2/sd.new.md"
SetChangeEvidence 'senior-sdet' $hNew
$env:DOCGEN_JUDGED_BY = 'sdet-2026-10-21-tc602-judge'
Arg 0 '-' '-' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$hNew,'--rejudge',$keys10,'--yes')
Chg 'senior-sdet' 1 $keys10 '-' '-'
Judge 'senior-sdet' 'subagent' $keys10
Keys 'senior-sdet'
```

- **红绿**：红 = 多报被当「键不在映射表里」拒（用户被迫背精确键集，实际会乱报）；或实现把 `A3–A7` 也认成合法键（注解键集变 11 → `check-all` 红）；绿 = 如上
- **现状**：红（今天 `--rejudge` 未实现；v1 用的 15 键表里含 `A3–A7`，与新契约冲突，本版已改为现算 10 键）
- **修正依据**：R1-测试问题 1 / R1-AI 问题 1（`check-agent.mjs:2/13/14`、`criteria.md` A3 不按节名匹配）。

#### TC-603 负：description 行差异 + `--rejudge none` → 拒

- **覆盖**：R7 + §3.6 表 A 首行 + §3.3
- **前置**：同 TC-601 前置
- **步骤**：`Guard 4 'UnapprovedChange' '-' 'agents/senior-sdet.md' @('replace',...,'--expect-change',$hNew,'--rejudge','none','--yes')`
- **预期**：exit 4、首行 `UnapprovedChange:`、卡不变
- **判据**：

```powershell
CopyReset
CopyState '603'
Inject 'tools/docgen/components/agentData.mjs' '、评审测试策略、或' '，或'
Render 'senior-sdet' "$w2/sd.new.md"
$hNew = ShaOf "$w2/sd.new.md"
SetChangeEvidence 'senior-sdet' $hNew
Guard 4 'UnapprovedChange' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$hNew,'--rejudge','none','--yes')
```

- **红绿**：红 = 改了 description 却声明 none 也放行（注解停留在旧判定）；绿 = exit 4
- **现状**：红

#### TC-604 负：identity 行差异 + 只报 `A2` → 拒（漏 `A1`）

- **覆盖**：R7 + §3.6 表 A 次行（节名含「你是谁」/「身份」→ `A1`）
- **前置**：`CopyReset` + `CopyState '604'`；注入落在 identity（渲染进 `## 你是谁` 节）
- **步骤**：`Guard 4 'UnapprovedChange' '-' 'agents/senior-sdet.md' @('replace',...,'--expect-change',$hNew,'--rejudge','A2','--yes')`
- **预期**：exit 4、首行 `UnapprovedChange:`、卡不变
- **判据**：

```powershell
CopyReset
CopyState '604'
Inject 'tools/docgen/components/agentData.mjs' '你擅长从**失败面**倒推用例' '你擅长从**失败面**反推用例'
Render 'senior-sdet' "$w2/sd.new.md"
$hNew = ShaOf "$w2/sd.new.md"
SetChangeEvidence 'senior-sdet' $hNew
Guard 4 'UnapprovedChange' '-' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$hNew,'--rejudge','A2','--yes')
```

- **红绿**：红 = 映射只看 description（漏了 identity 这条触达规则）；绿 = exit 4
- **现状**：红

#### TC-605 正：来源声明行差异 + `--rejudge none` → 过

- **覆盖**：R7 + §3.6 表 A 末行（「其余位置（含来源声明行、标题、其它节）→ 无（写 `none`）」）
- **前置**：`CopyReset` + `CopyState '605'`；注入来源声明行（其余同 TC-601）
- **步骤**：`Arg 0 '-' '-' @('replace',...,'--expect-change',$hNew,'--rejudge','none','--yes')`
- **预期**：exit 0；`rejudged` 为空数组（留痕三元见 TC-407）
- **判据**：

```powershell
CopyReset
CopyState '605'
Inject 'tools/docgen/components/agentData.mjs' '改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换。' '改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换（见 R4）。'
Render 'senior-sdet' "$w2/sd.new.md"
$hNew = ShaOf "$w2/sd.new.md"
SetChangeEvidence 'senior-sdet' $hNew
Arg 0 '-' '-' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$hNew,'--rejudge','none','--yes')
Chg 'senior-sdet' 1 'EMPTY' '-' '-'
```

- **红绿**：红 = 把「其余」也要求报键（下限表变成「所有行都要报」，`none` 永不合法）；绿 = exit 0
- **现状**：红

#### TC-606 负：传 `A3` 作为 `--rejudge` 键 → `InvalidArgs`（exit 2）

- **覆盖**：§3.6 表 B「A3–A7 不写注解、不必报进 `--rejudge`」+ §3.4「`rejudged` 只允许 10 键」+ §3.3（参数非法档）+ R7
- **前置**：`CopyReset` + `CopyState '606'` + `when` 注入（触达 `A2`）+ `Render` + `SetChangeEvidence`；`{A2}` 本身合法，唯一的错是把 `A3` 写进 `--rejudge`
- **步骤**：`Guard 2 'InvalidArgs' 'A2,A3,A4,A5,A6,A7,B1,B2,B3,B4,C1,C2,C3,C4' 'agents/senior-sdet.md' @('replace',...,'--expect-change',$hNew,'--rejudge','A2,A3,A4,A5,A6,A7,B1,B2,B3,B4,C1,C2,C3,C4','--yes')`
- **预期**：exit 2、首行 `InvalidArgs:`；stderr 里能看出合法键集合（提示串含 `A1` `A2` 等 10 键）；卡不变
- **判据**：

```powershell
CopyReset
CopyState '606'
Inject 'tools/docgen/components/agentData.mjs' '、评审测试策略、或' '，或'
Render 'senior-sdet' "$w2/sd.new.md"
$hNew = ShaOf "$w2/sd.new.md"
SetChangeEvidence 'senior-sdet' $hNew
Guard 2 'InvalidArgs' 'A2,A3,A4,A5,A6,A7,B1,B2,B3,B4,C1,C2,C3,C4' 'agents/senior-sdet.md' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$hNew,'--rejudge','A2,A3,A4,A5,A6,A7,B1,B2,B3,B4,C1,C2,C3,C4','--yes')
```

- **红绿**：红 = `A3` 被当合法键（注解会写成 11 键，`check-all` 当场红；或写不进注解但留痕里出现 `A3` 这种没人复检的声明）；绿 = `InvalidArgs`
- **现状**：红（`--rejudge` 未实现）
- **缺口提示**：spec §3.3 只定义了「未知**旗标**」→ `InvalidArgs`，未明文写「未知 **`--rejudge` 键**」→ 哪个码；本条按「参数非法归 `InvalidArgs`」断言，并在 §5 建议 1 要求 spec 补一句。

### 3.7 首个使用者 senior-sdet（R9 / §3.7 / §5⑦）

> 本组前置：TC-701 在副本内；TC-702 / TC-703 需施工完成后在仓库内跑。组末 `Restore`。

#### TC-701 正：copy 端到端——diff → 凭证 → 写盘，差异恰一段 description 行

- **覆盖**：R9 + §3.7 + §5⑦
- **前置**：`CopyReset`；`Snap 'agents/senior-sdet.md' "$w2/sd.before.md"`（改动前字节，供事后逐行比对）；`Inject 'tools/docgen/components/agentData.mjs' '、评审测试策略、或' '，或'`；**`--rejudge` 非空时必须显式提供判者标识**（`$env:DOCGEN_JUDGED_BY = 'sdet-2026-10-21-tc701-judge'`），未设或为空时 `replace` 报 `UnapprovedChange`（exit 4）并拒写盘
- **步骤**：
  ① `Render` → `$hNew`
  ② `DiffSeat` + `DiffCheck 'modified'`（契约 + `a/b` 现算）
  ③ `SetChangeEvidence`；`Arg 0 '-' '-' @('replace',...,'--expect-change',$hNew,'--rejudge','A2','--yes')`
  ④ `Cmp` 盘上 vs 渲染；⑤ 逐行比对 `$w2/sd.before.md` 与盘上
- **预期**：② `a/b` 一致且 `DiffCheck` exit 0；④ `EQUAL`；⑤ `sameLength=True`、`onlyDescription=True`、`changed>0`（卡片只有一条 `description:` 行，故「每条差异行都是 description 行」等价于「差异恰为那一行」）
- **判据**：

```powershell
CopyReset
Snap 'agents/senior-sdet.md' "$w2/sd.before.md"
Inject 'tools/docgen/components/agentData.mjs' '、评审测试策略、或' '，或'
Render 'senior-sdet' "$w2/sd.new.md"
$hNew = ShaOf "$w2/sd.new.md"
DiffSeat 'senior-sdet' "$w2/diff.out"
DiffCheck 'modified' 'senior-sdet' "$w2/diff.out"
SetChangeEvidence 'senior-sdet' $hNew
$env:DOCGEN_JUDGED_BY = 'sdet-2026-10-21-tc701-judge'
Arg 0 '-' '-' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$hNew,'--rejudge','A2','--yes')
Cmp 'agents/senior-sdet.md' "$w2/sd.new.md"
node --input-type=module -e "const fs=await import('node:fs');const a=fs.readFileSync(process.argv[1],'utf8').split('\n');const b=fs.readFileSync(process.argv[2],'utf8').split('\n');const n=Math.max(a.length,b.length);const d=[];for(let i=0;i<n;i++)if(a[i]!==b[i])d.push(i+1);const onlyDesc=d.every(i=>String(a[i-1]||'').startsWith('description: ')&&String(b[i-1]||'').startsWith('description: '));const ok=a.length===b.length&&d.length>0&&onlyDesc;console.log('rows='+b.length+' changed='+d.length+' idx=['+d.join(',')+'] sameLength='+(a.length===b.length)+' onlyDescription='+onlyDesc);process.exitCode=ok?0:1" "$w2/sd.before.md" 'agents/senior-sdet.md'
```

- **红绿**：红 = 差异不止一行（数据改动波及 description 之外的渲染位）或凭证与写盘字节不一致；绿 = 如上
- **现状**：红（`diff` / 凭证未实现）

#### TC-702 正：repo 端到端——`numstat` 与「HEAD 卡 vs 渲染」现算的差异行数一致，其余席零改动

- **覆盖**：R9 + §5⑦ + §4 步 6
- **前置**：**施工已完成**（`agentData.mjs` 的 `when` 已改、`replace` 已落盘，改动留在工作区未提交）；`Restore`
- **步骤**：① 一次 node 命令同时取 `git diff --name-only -- agents/`、`git diff --numstat -- agents/senior-sdet.md`、`git diff -U0 -- agents/senior-sdet.md`，并用「`git show HEAD:agents/senior-sdet.md` 与当前渲染」现算期望的增/删行数；② `Wk` 其余席
- **预期**：`files=agents/senior-sdet.md`；`numstat` 前两列 == 现算的 `add/del`；`-description: ` 行数 == `del` 且 `+description: ` 行数 == `add`（即**所有**增删行都是 description 行）；其余席全 `EQUAL`
- **判据**：

```powershell
Restore
node --input-type=module -e "const {execFileSync}=await import('node:child_process');const {renderByName}=await import('./tools/docgen/cli.mjs');const g=(a)=>execFileSync('git',a,{encoding:'utf8'});const names=g(['diff','--name-only','--','agents/']).trim().split('\n').filter(Boolean);const ns=g(['diff','--numstat','--','agents/senior-sdet.md']).trim().split(/\s+/);const A=g(['show','HEAD:agents/senior-sdet.md']).split('\n');const B=renderByName('senior-sdet').split('\n');let del=0,add=0;const n=Math.max(A.length,B.length);for(let i=0;i<n;i++){if(A[i]===B[i])continue;if(A[i]!==undefined)del++;if(B[i]!==undefined)add++}const d=g(['diff','-U0','--','agents/senior-sdet.md']).split('\n');const minusDesc=d.filter(l=>l.startsWith('-description: ')).length;const plusDesc=d.filter(l=>l.startsWith('+description: ')).length;const ok=names.length===1&&names[0]==='agents/senior-sdet.md'&&Number(ns[0])===add&&Number(ns[1])===del&&minusDesc===del&&plusDesc===add;console.log('files='+names.join(',')+' numstat='+ns.slice(0,2).join(' ')+' computedAddDel='+add+'/'+del+' minusDesc='+minusDesc+' plusDesc='+plusDesc+' ok='+ok);process.exitCode=ok?0:1"
Wk ($seatsOthers.Split(' '))
```

- **红绿**：红 = 有第二张卡被改、或 `numstat` 与现算不一致（改了不止一行 → R9 的「其余行逐字节不变」被破坏）、或有非 description 行被改；绿 = 如上
- **现状**：待施工后（今天 `numstat` 为空 → 红）
- **说明**：v1 把 `numstat` 的两个数字写成字面期望值，违反「不写死行数」；本版改为用 HEAD 卡与渲染逐行比对现算期望值，再与 `numstat` 对账。

#### TC-703 边界：卡与数据都不再含「评审测试策略」（现算次数为 0）

- **覆盖**：R9 + §3.7 理由（卡内「你负责三件事」无该职责，`## 边界` 节里写明「不参与议会裁决」→ 删触发词而不是补职责）
- **前置**：施工已完成；`Restore`
- **步骤**：统计 `agents/senior-sdet.md` 与 `triggerTable['senior-sdet'].when` 中该词出现次数
- **预期**：`card=0 when=0`
- **判据**：

```powershell
Restore
node --input-type=module -e "const fs=await import('node:fs');const {triggerTable}=await import('./tools/docgen/components/agentData.mjs');const card=fs.readFileSync('agents/senior-sdet.md','utf8');const when=triggerTable['senior-sdet'].when;const c=(card.match(/评审测试策略/g)||[]).length;const w=(when.match(/评审测试策略/g)||[]).length;console.log('card='+c+' when='+w);process.exitCode=(c===0&&w===0)?0:1"
```

- **红绿**：红 = 只改了数据没落盘（生成物与数据不一致），或反过来手工改了卡；绿 = 两处都为 0
- **现状**：红（今天两处都还有）

#### TC-704 正：重判落账——`judgedBy` / `judgeMode` / `judged[]` 齐备，键集仍恰 10

- **覆盖**：R7 + §5⑥ + §6-6（检查者 ≠ 写者）+ §3.4（`judgedBy` / `judgeMode` / `judged[]` 的落点与必填字段）
- **前置**：
  - `CopyReset` + `CopyState '704'` + `when` 注入 + `Render` + `SetChangeEvidence`；
  - 独立子代理已完成 `senior-sdet:A2` 重判并写回 `rules/.inspector-annotations.json`，并把该子代理实例标识写入 `DOCGEN_JUDGED_BY`（本用例值：`sdet-2026-10-21-tc704-judge`）；
  - **`--rejudge` 非空时必须显式提供判者标识**：执行前先 `$env:DOCGEN_JUDGED_BY = 'sdet-2026-10-21-tc704-judge'`，未设或为空时 `replace` 报 `UnapprovedChange`（exit 4）并拒写盘；
  - **执行者把自己的实例标识写进 `$w2/executor-id.txt`（一行）**——用于机器断言「`judgedBy` ≠ 施工者标识」
- **步骤**：
  ① `Arg 0 '-' '-' @('replace',...,'--expect-change',$hNew,'--rejudge','A2','--yes')`
  ② `Judge 'senior-sdet' 'subagent' 'A2'`（`changes[-1]` 含 `judgedBy` / `judgeMode` / `judged[]`，`judged[]` 每个报过的键一条 `{key, verdict, basis}`；`machineChecks` 五键齐）
  ③ `Keys 'senior-sdet'`（该席注解键集**仍恰 10**）
  ④ `Ann 'senior-sdet'`（A 组结构 + 十键全 `pass`）
  ⑤ 独立性断言：`judgedBy` 非空且 ≠ `$w2/executor-id.txt`
- **预期**：① exit 0；② `bad=OK`、`judged=1`、`machine=5`；③ `red=0`；④ exit 0；⑤ `independent=True`
- **判据**：

```powershell
CopyReset
CopyState '704'
Inject 'tools/docgen/components/agentData.mjs' '、评审测试策略、或' '，或'
Render 'senior-sdet' "$w2/sd.new.md"
$hNew = ShaOf "$w2/sd.new.md"
SetChangeEvidence 'senior-sdet' $hNew
$env:DOCGEN_JUDGED_BY = 'sdet-2026-10-21-tc704-judge'
Set-Content -LiteralPath (Join-Path $w2 'executor-id.txt') -Value 'sdet-2026-10-21-docgen-intent-change-r2'
Arg 0 '-' '-' @('replace','--kind','agent','--name','senior-sdet','--draft',"$w2/sd.new.md",'--expect-change',$hNew,'--rejudge','A2','--yes')
Judge 'senior-sdet' 'subagent' 'A2'
Keys 'senior-sdet'
Ann 'senior-sdet'
node --input-type=module -e "const fs=await import('node:fs');const {readEvidence}=await import('./tools/docgen/evidence.mjs');const e=readEvidence('senior-sdet');const L=e.changes[e.changes.length-1];const ex=fs.readFileSync(process.argv[1],'utf8').trim();const ok=typeof L.judgedBy==='string'&&!!L.judgedBy.trim()&&L.judgedBy!==ex;console.log('judgedBy='+L.judgedBy+' executor='+ex+' independent='+ok);process.exitCode=ok?0:1" (Join-Path $w2 'executor-id.txt')
```

- **红绿**：红 = 重判写回时多写/漏写键（键集漂移，如把 `A3` 写进注解 → 11 键）、A2 仍是 `pending`/`fail`、`judgedBy` 等于施工者、或 `judged[]` 缺键/缺 `basis`；绿 = 五条全过
- **现状**：**半绿**——今天 `senior-sdet:A2` = `pass`、10 键齐（`rules/.inspector-annotations.json:15-24`），③④ 绿；但 ② ⑤ 依赖 `changes` 新字段，今天必然红（变更被 `tools/docgen/cli.mjs:222` 拦，`changes` 不产生）
- **修正依据**：R1-AI 问题 1/2、R1-测试问题 3——v1 只能判键值与键集，判不了「谁判的、依据是什么」；新版 spec 把落点定在 `changes[].judgedBy` / `judged[].basis`，本版据此补机器断言。

### 3.8 全量绿（§5⑧ / §7-8）

> 本组前置：`Restore`（仓库真 state / 真 fixtures）。组末 `Restore`。

#### TC-801 正：`npm run check` 全绿

- **覆盖**：§5⑧ + §7-8
- **前置**：`Restore`
- **步骤**：跑 `npm run check`，断言：exit 0；含 `check 全部通过`；含 `baseline <$nBaseline>/$nBaseline`；含 `④ markdown 检查通过`；`# tests <N>` 中 N > 0；不含 `check 未通过`
- **预期**：全部成立
- **判据**：

```powershell
Restore
$o = (npm run check 2>&1 | Out-String)
$code = $LASTEXITCODE
$t = [regex]::Match($o, '#\s*tests\s+(\d+)')
$tests = if ($t.Success) { [int]$t.Groups[1].Value } else { -1 }
$ok = $code -eq 0 -and $o -match 'check 全部通过' -and $o.Contains("baseline $nBaseline/$nBaseline") -and $o -match '④ markdown 检查通过' -and $tests -gt 0 -and $o -notmatch 'check 未通过'
"exit=$code tests=$tests baseline=$nBaseline ok=$ok"
if (-not $ok) { $o; throw ('RED: exit=' + $code + ' tests=' + $tests) }
```

- **红绿**：红 = 任一子检查红（tests / `gate` / 执行力度矩阵 / 技能守卫 / markdown）；绿 = 如上
- **现状**：今天应绿（基线状态）

#### TC-802 正：`gate` 绿 + `generate` 0 drift

- **覆盖**：§5⑧「`gate` 绿；`generate` 0 drift」+ §6-3
- **前置**：`Restore`
- **步骤**：① `Arg 0 "baseline $nBaseline/$nBaseline" '-' @('gate')`；② `Arg 0 '-' '-' @('generate','--kind','all')`
- **预期**：两次 exit 0；`gate` 打出 `baseline N/N`
- **判据**：

```powershell
Restore
Arg 0 "baseline $nBaseline/$nBaseline" '-' @('gate')
Arg 0 '-' '-' @('generate','--kind','all')
```

- **红绿**：红 = 渲染与盘上漂移（说明数据改了但没走 `replace`）；绿 = 两次 exit 0
- **现状**：今天应绿

#### TC-803 负：副本内手改卡一字节 → `gate` 红（`Mismatch`）

- **覆盖**：§6-7（禁止手打 `agents/*.md`）+ §5⑧
- **前置**：`CopyReset`
- **步骤**：追加一个字节到副本卡；`Arg 1 'Mismatch' '-' @('gate')`
- **预期**：exit 1、首行 `Mismatch:`
- **判据**：

```powershell
CopyReset
node -e "require('node:fs').appendFileSync('agents/senior-sdet.md','x')"
Arg 1 'Mismatch' '-' @('gate')
```

- **红绿**：红 = 手改的卡被 `gate` 放过（本 spec 松了两道闸门，`gate` 必须仍守住「盘上 == 渲染」）；绿 = `Mismatch`
- **现状**：绿（`collectGate` 对 replaced 席逐字节比对，`tools/docgen/cli.mjs:98-102`）

### 3.9 人工验证（spec §7「只手动验证」）

#### TC-804 边界（人工记录型）：diff 读一遍 + 改后卡读一遍

- **覆盖**：spec §7「只手动验证：把 `diff` 的输出读一遍，确认「这确实是我要改的那一行」；senior-sdet 卡改后读起来仍是同一张卡」+ §4 步 5 确认判据（`-`/`+` 中段恰为要改的那一行；末行凭证哈希 == `diff` 头部打印的「新渲染 sha256」）
- **前置**：施工完成（TC-701 / TC-702 已绿）；`$w2/diff.out` 已由 TC-701 落盘，或重跑 `DiffSeat 'senior-sdet' "$w2/diff.out"`
- **步骤**：
  ① **人读 diff**：逐行读 `$w2/diff.out`，确认 `-`/`+` 中段就是 `description` 那一行，且改动内容 = 删掉「评审测试策略、」这一处触发词；
  ② **人读卡**：通读 `agents/senior-sdet.md`，确认「你是谁 / 你负责三件事 / 三条铁律 / 输入 / 固定清单 / 自由探索 / 输出格式 / 通用纪律 / 边界」九节仍在，职责表三行未变；
  ③ 把两条的「看到了什么」逐字摘录进 §7「人工验证记录」表
- **预期**：① 记录里能逐字写出中段那一行（`- description: …评审测试策略…` / `+ description: ……`）；② 记录里写明节数与职责表行数；③ 表里两行都非空且填了执行者与日期
- **判据**（机器辅助 + 人判）：
  - 机器部分：`DiffCheck 'modified' 'senior-sdet' "$w2/diff.out"` exit 0（中段恰为一行、凭证 == 新渲染哈希）——已由 TC-701 覆盖；
  - 人判部分：**谁看** = 本次施工者 + reviewer-qa 复核；**看什么** = §7 记录表两行的「看到什么（逐字摘录）」栏；**怎么算通过** = ①栏里的摘录与 `$w2/diff.out` 中段逐字一致，②栏列出的九个节名与改前一致
- **判据命令**（把人工摘录与工具输出做机核，防「抄错/编造」）：

```powershell
CopyReset
Snap 'agents/senior-sdet.md' "$w2/sd.before.md"
Inject 'tools/docgen/components/agentData.mjs' '、评审测试策略、或' '，或'
Render 'senior-sdet' "$w2/sd.new.md"
DiffSeat 'senior-sdet' "$w2/diff.out"
# 人工读 diff.out 后，把中段两行原样粘贴到下面两个变量里（粘贴必须逐字，含行首符号与空格）
$pastedMinus = '- description: <人工粘贴>'
$pastedPlus  = '+ description: <人工粘贴>'
$o = (Get-Content "$w2/diff.out" -Raw)
AssertEq ([string]$o.Contains($pastedMinus)) 'True' 'PASTED-MINUS-FOUND'
AssertEq ([string]$o.Contains($pastedPlus)) 'True' 'PASTED-PLUS-FOUND'
$secBefore = ([regex]::Matches((Get-Content "$w2/sd.before.md" -Raw), '(?m)^## ')).Count
$secAfter = ([regex]::Matches((Get-Content 'agents/senior-sdet.md' -Raw), '(?m)^## ')).Count
AssertEq ([string]$secAfter) ([string]$secBefore) 'SECTION-COUNT-UNCHANGED'
```

- **红绿**：红 = 人工摘录与工具输出对不上（读错行 / 抄错 / 没读就填），或改后卡少了一节；绿 = 机核三项全绿且记录表填写完整
- **现状**：待施工后
- **说明**：这是本文件唯一一条**人工验证记录型**用例——它不是「机器能判所以顺便人看一下」，而是 spec 明确要求「人读一遍」的两项（判断「这行是不是我要改的」本身不可机械化）。因此判据拆成两段：机器负责防编造（摘录必须能在输出里逐字找到），人负责判断语义。

## 4 缺口与判别力水位

| # | 缺口 | 影响 | 本轮怎么兜 | 归属 |
|---|---|---|---|---|
| 1 | §3.6 明说 B 组 4 项与 C 组 4 项**不做机械映射** | 改到只影响 B/C 语义的行（且落在「其余」）时，`--rejudge none` 也能过 | 无机械判据可写；用 TC-801（`check-all` 0 红）+ 议会与复查轮兜底 | 已知缺口（spec §3.6 / §8） |
| 2 | §3.5 的「幂等分支不写盘」在字节上不可观测（盘上==渲染时写与不写结果相同） | TC-206 只能判「不追加留痕 / 草稿清空 / 打印幂等」，判不了「没调用 rename」 | 判据取前三项；rename 是否发生需实现层测试（建议 10） | 建议 10 |
| 3 | §3.6 下限表按「差异所在的卡内位置」定义，`你是谁`/`身份` 的边界靠节名关键字匹配 | 节名改写（如「你是谁」→「身份」）会让映射落空或误触 | 本轮只覆盖 description / `## 你是谁` / 来源声明行 / 整节删除四类；关键字集合须与 `check-agent.mjs` 共用单源（建议 9） | 建议 9 |
| 4 | `machineChecks` 的**取值正确性**由 `check-all` 的 `checkStruct` 产生，而本 spec 不测 `check-all` | 本文件只能断「五键齐全 + 值域合法 + 与 `rejudged` 对齐」，断不了「值是否真对应渲染产物」 | TC-406 / TC-408 断结构；取值正确性归线 E 与 `npm run check`（TC-801） | spec §7「不测」 |
| 5 | `suspended` 席的**变更通路**本 spec 不提供（§8） | TC-106 只能证明「带变更参数被拒 + 迁移段可写」，证明不了「suspended 席如何改内容」 | 明确记为未覆盖项；需另立 spec | spec §8 |
| 6 | 「凭证格式非法（非 hex / 长度错）」与「未知 `--rejudge` 键」spec 未明文定码 | TC-213 / TC-606 按「参数非法 → `InvalidArgs`」断言，属**推断**而非 spec 明文 | 已在 TC-213 / TC-606 的「缺口提示」标注，并要求 spec 补一句（建议 1） | 建议 1 |
| 7 | 「rename 失败」构造依赖 Windows 只读语义 | 在 POSIX 上 `rename` 覆盖只读目标可能不失败 → 构造无效，用例会假红/假绿 | TC-109 先跑构造有效性自检，无效则记「环境不适用」，不得记绿 | 建议 11 |
| 8 | 崩溃窗口「文件已 rename、evidence 未写」的留痕丢失只可观测「没追加」 | 无法区分「崩溃前已写 changes 后又被冲掉」与「本来就没写」 | 按 spec §3.5 的已知取舍：只断「重跑后 `changes` 仍缺省」，不推断中间态 | spec §3.5 |
| 9 | `state.json` 可被手改（把已迁席改回非 `replaced`）以重跑迁移工具 | 一旦改动，`init-evidence` 又能冲掉锚点；本 spec 未把「state 回退」纳入闸门 | 无判据可写（属越权手改，不在工具通路内）；记 `docs/after/` | 已知缺口（R1-后端 F3） |

**判别力水位**（假阳性 / 假阴性各给一个样例）：

- **假阳性样例**：把「凭证大小写不敏感」错实现成严格大写比较，会让**完全正确**的小写凭证被拒（TC-205 专门抓这个）。
- **假阴性样例（一）**：TC-202——若 `UnapprovedChange` 的实现只是在缺凭证时**顺手**报了个别的 code（比如 `EvidenceInvalid`），退出码 2 与 4 不同，看似被拒、实则「变更段闸门没生效而是迁移段闸门在拦」；TC-202 断言 exit **4** 且首行 `UnapprovedChange:` + 两个哈希都在，正是为堵这个假阴性。
- **假阴性样例（二）**：TC-505——`init-evidence ../../evil` 今天因「无 `.git` 抛异常」也是 exit 1，与期望的 `InvalidName`（exit 1）**退出码相同**；只断退出码会把「崩溃」当「校验通过」。故本条同时断错误码、首行冒号、泄漏文件数三项。
- **假阴性样例（三）**：TC-303 今天「假绿」——`diff` 子命令不存在时 `main()` 也抛 `UnsupportedKind`，与本条期望撞车；评审时不得据今天结果判「已通过」。
- **自证循环检查**：全部预期值来源 = spec 原文（§3.2 行序/前缀/行数口径/中段格式、§3.3 退出码与 stderr 契约、§3.4 字段类型与键域、§3.5 置位次序、§3.6 两张表、§5①–⑧）或**命令现算**（哈希、行数、`P`/`S` 前缀长度、`numstat` 期望值、席集合、场景数）。**没有**任何一条拿「实现当前输出」当预期。第 2 版新增的三条现算点：TC-101 的场景数（`$want`）、TC-310 的行数口径（`rows` vs `nonEmptyRows`）、TC-702 的增删行数（HEAD 卡 vs 渲染）。

## 5 给开发的建议

| # | 位置（文件:行 / spec 节号） | 风险或盲点 | 为什么会被忽略 | 具体改法 | 优先级 |
|---|---|---|---|---|---|
| 1 | spec §3.3（错误码表）/ §3.6 末条 | **凭证格式非法（非 hex / 长度 ≠ 64）与「未知 `--rejudge` 键」都没明文定码**；用例只能按「参数非法 → `InvalidArgs`」推断 | 写 spec 时只想「凭证对不对」，没想到「凭证长得不对」是另一类错误；`--rejudge` 只写了「允许超报」，没写「报错键怎么办」 | §3.3 补两句：「`--expect-change` 值不是 64 位 hex → `InvalidArgs`（exit 2）」；「`--rejudge` 含 `SEMANTIC_KEYS` 之外的键 → `InvalidArgs`，stderr 列出合法键」 | P0 |
| 2 | `tools/docgen/acceptance/golden-assert.mjs:56` | 错误出口在 `message === code` 时**不写冒号**，与 §3.3 「首行以 `<码>:` 开头」冲突 | 这个出口看起来「只是少个冒号」，但它是全部 acceptance 负面用例的判读依据 | 改为 `${e.code}: ${e.message && e.message !== e.code ? e.message : e.code}`，即**恒带冒号**；`init-evidence` 的 catch 同改 | P0 |
| 3 | `tools/docgen/acceptance/init-evidence.mjs:7-18` | 无 `assertAgentName`、git 调用在最前、无 `try/catch` ⇒ 路径穿越 + 无 `.git` 环境先炸 ENOENT | R6 只把次序写给了 `golden-assert`（「先 `readEvidence` 再判阶段」），`init-evidence` 那条没人写 | 严格按 R6 四步：① `assertAgentName`（复用 `tools/docgen/cli.mjs:164` 或抽公共模块）→ ② `readState()` 判 `replaced` 即打印 `MigrationPhaseClosed:` 并 exit 2 → ③（`golden-assert` 才有 `readEvidence`）→ ④ 才跑 git / `writeEvidence`；两步都包 `try/catch` 统一打印 `码: message` | P0 |
| 4 | `tools/docgen/cli.mjs:266`（`setAgentState` 早于 `:267-274` 的写 / rename） | 写失败后 state 已是 `replaced` ⇒ 该席永久跳过迁移证明 | 单线程脚本里「先置 state 看起来无害」（成功路径结果一样） | rename 成功后 `setAgentState(name,'replaced')`；失败路径 `try { ... } catch { rm tmp; setAgentState(name, 写前值); fail('WriteFailed') }`；写前值要显式取一次 `readState()` 并保留 | P0 |
| 5 | `tools/docgen/cli.mjs:300-317`（`flag()` / `has()` 宽松解析） | 未知旗标被静默丢弃 ⇒「迁移段出现 `--expect-change` → `InvalidArgs`」根本落不了地；同一坑让拼错的旗标变静默放行 | 解析器为「宽松容错」而写，没人想到它会把「互斥参数」变成「不存在」 | 在指定 `sub` 下加白名单 `--kind --name --draft --yes --expect-change --rejudge`；白名单外的 `--xxx` → `InvalidArgs`；`--expect-change` 的下一个 token 以 `--` 开头 → 视为缺值 → `InvalidArgs` | P0 |
| 6 | `tools/docgen/cli.mjs`（待新增 `cmdDiff`）；`tools/docgen/cli.mjs:317` | `diff` 不存在；且 `main()` 最后 `throw fail('UnsupportedKind', { sub })` 会让 `diff` 的参数错误与「子命令不存在」**同码同档**（TC-303 今天因此假绿） | 「反正都是参数错误」——但这让「非 agent 被拒」与「命令没写」在日志里不可区分 | 新增 `cmdDiff`：`assertAgentName` → 条目存在（`MissingComponentData`）→ `renderByName` → 盘上卡存在（`DanglingBaselineEntry`）→ 差异算法；`main()` 里 `diff` 分支在分发链里显式列出；`UnsupportedKind` 只留给「sub 不认识」并把 `sub` 写进 stderr | P1 |
| 7 | 待新增 `cmdDiff` 的输出格式（spec §3.2） | 行数口径 / 中段行格式 / `a`、`b`、`k` 全是要被逐字断言的契约字段 | 打印给人看的输出，写实现时只想着「看得懂」 | 行数 = `split('\n')` 元素数（末尾空串计入）；中段行 = `符号 + ' ' + 原文`（用 `slice` 拼接，**禁 `trim`**）；`a`/`b` = 两侧中段行数、`k = P + 1`；`diffLines()` 与 `sha256Hex()` 抽单点供 `cmdDiff`/`cmdReplace` 共用 | P1 |
| 8 | `tools/docgen/evidence.mjs:21-41`（`readEvidence`） | 目前**完全不看** `changes`/`rejudged`/`judged`/`judgeMode`/`machineChecks` ⇒ 坏留痕可随便写、`A3` 能进 `rejudged`、缺 `machineChecks` 也能过 | `readEvidence` 是「迁移期四字段」的老实现，新增字段没人回头补 | 按 §3.4 逐项校验：`changes` 可缺省、出现即数组；每项 `from`/`to` 64 位大写 hex、`at` ISO、`rejudged` ⊆ `SEMANTIC_KEYS`（**10 键**，从 `check-agent.mjs` 导入，不写第二份）；`rejudged` 非空 ⇒ `judged` 逐键一条 + `judgedBy` 非空 + `judgeMode ∈ {subagent, self-degraded}`；`rejudged` 为空 ⇒ `judged` 为 `[]` + `judgeMode: none`；`machineChecks` 五键 `A3`–`A7` 齐全 | P0 |
| 9 | `tools/docgen/evidence.mjs:13-19`（`fail()` 只把 code 当 message） | §3.3 要求 `UnapprovedChange` 的 stderr 含两个 sha256、缺哪一项、下一步命令——现出口做不到 | `fail()` 是统一出口，加参数会碰所有调用点 | 给 `fail()` 加可选 `msg`（`new Error(msg ?? code)`），`UnapprovedChange` 处传「盘上=… 渲染=… 缺 --expect-change，下一步运行 node tools/docgen/cli.mjs diff --kind agent --name <名>」 | P0 |
| 10 | `tools/docgen/cli.mjs:256-263`（幂等分支） | 「不写盘」在字节上不可观测，写没写 rename 都能过 | 结果相同看起来「无所谓」 | 抽 `writeIfChanged()` 单点并在幂等分支直接 return（不进入写盘函数），实现层加断言「跑完 `agents/` 下无 `.tmp-<name>-*.part`」 | P2 |
| 11 | `tools/docgen/cli.mjs:230-255`（`allowed()` 内多次 `readState()`） | 同一次 `replace` 里 state 被读多次（`cmdReplace` 内另有 `:255`），期间被别处改动会得到前后不一致的判别 | 单线程脚本里「读多次」看起来无害 | 函数入口读一次 `const st = readState()` 全流程复用（`collectGate` 也传同一份） | P2 |
| 12 | spec §3.6 触达映射（按节名匹配） | 节名改写（「你是谁」→「身份」）会让 `A1` 落空或误触；A3 按表头列、A4/A5 节内优先——映射与 `criteria.md` 不是同一坐标系 | 映射表按「当前卡的样子」写，没考虑节名本身会变 | 把「identity 关键字集合」放单源（与 `check-agent.mjs` 共用），映射与检查共用一份；A3 定位改为「表格表头行」而非节名 | P2 |
| 13 | `tools/docgen/state.json`（分派键） | 手改成非 `replaced` 就能重跑 `init-evidence` 冲掉锚点（R1-后端 F3） | 视为「越权手改，不属工具通路」 | 变更段前置加一条「`evidence` 六字段齐备且非 `pending`，否则退回迁移段」；或对 `state` 写入加校验（`replaced` 不可回退到 `suspended`） | P2 |
| 14 | `--rejudge` 与 `rules/.inspector-annotations.json` 无绑定 | 旧 `pass` 可顶替本次重判（R1-AI 问题 3）；`judged[]` 只能证明「有人写了记录」 | spec §8 已声明本轮不做指纹式机械校验 | 本轮按 spec 兜底（`judgedBy` + `judged[].basis` + 独立子代理）；下一轮考虑给注解加 `{status, by, at, basisRef}` 并对 `at` 做时序校验，记 `docs/after/` | P2 |

## 6 自检

| # | 自检项 | 结果 |
|---|---|---|
| 1 | 覆盖总表逐行核对：每行 R 编号 / § 号在 spec 中确实存在 | 已核 67 行。用到的条目：R1–R9、§3.1–§3.7、§5①–⑧、§6-1–§6-7、§7-1/§7-8、§8、§9、§4 步 1/5/6。spec 的 §6 共 8 条（§6-1–§6-8）、§7 共 8 条（§7-1–§7-8）；本文件最多引用到 §6-7 与 §7-8，**未引用任何不存在的编号** |
| 2 | 计数三元组：负例 + 边界 ≥ 正例 | 正 **20** / 负 **26** / 边界 **21**，合计 **67**；**47 ≥ 20** ✓ |
| 3 | 每条用例五要素是否都在（抽样 13 条覆盖 8 组） | 全 67 条逐条查过：覆盖 / 前置 / 步骤 / 预期 / 判据五栏均在，且判据 = 可粘贴执行的函数调用（代号 + 完整参数）。抽样：组 1 = TC-102、TC-109；组 2 = TC-211、TC-215；组 3 = TC-309、TC-311；组 4 = TC-405、TC-410；组 5 = TC-505、TC-506；组 6 = TC-602；组 7 = TC-704；组 8 = TC-803（另有人工记录型 TC-804）。**无「见上 / 见步骤」** |
| 4 | 代号表里每个代号都在正文被用到；新引入的代号已在表中定义 | `ShaOf` / `AssertEq` / `Inject` / `SetChangeEvidence` / `Render` / `Snap` / `Cmp` / `Arg` / `Guard` / `ToolArg` / `Phase` / `DiffSeat` / `DiffCheck` / `Chg` / `Judge` / `EvScan` / `Ann` / `Keys` / `StateExp` / `St1` / `Wk` / `EvSix` / `CopyReset` / `Restore` / `NewStateFile` / `StateEmpty` / `StateOne` / `StateAllReplaced` / `CopyState`；新增的 `ToolArg`（TC-505）、`St1`（TC-106/107/109）、`Judge`（TC-406/407/602/704）、`EvSix`（TC-402，定义在用例内）全部有定义且被调用；`Wk` 已注明只用于工作区外的席；v1 的 `AUDIT` 代号已删除（它断言「`golden-assert` 在已替换席仍可跑」，该通路被 R6 直接关闭） |
| 5 | 有没有写死行号 / 字节数 / 卡行数 | 无。全文不再出现卡行数或 `numstat` 字面值；`numstat` 期望值改为「HEAD 卡 vs 渲染」逐行现算（TC-702）；行数口径由 `DiffCheck` 按 `split('\n')` 现算（TC-310）；场景数由脚本内 `scenario(` 计数现算（TC-101）；席集合、baseline 总数、evidence 份数全部由命令现算。仅本文件自身的用例条数（67）与计数三元组写成数字 |
| 6 | 有没有拿 spec 结论当判据却无命令 | 四处明确标为**人工验证 / 已知缺口**：① TC-804 的「这行是不是我要改的那一行」由人判（机器只防编造）；② §4 缺口 1（B/C 组语义）；③ §4 缺口 2（幂等不写盘）；④ §4 缺口 4（`machineChecks` 取值正确性归 `check-all`）。其余判据均落到可执行命令 |

**25 条必改项逐条落实（A / B / C / D）**：

| 条 | 要求 | 结果 |
|---|---|---|
| A1 | 映射表拆分：`--rejudge` 键表一律从 `SEMANTIC_KEYS`（10 键）现算，不出现 A3–A7；补负例「传 `A3` → `InvalidArgs`」 | 已落实（TC-602 改写 + 新增 TC-606 + 新增 TC-409/TC-410；组 6 前置给出 `$keys10` 现算命令） |
| A2 | TC-704 扩展：`judgedBy` / `judgeMode` / `judged[]`，每键一条；该席注解键集仍恰 10 | 已落实（TC-704 判据含 `Judge` + `Keys` + 独立性断言；`Keys` 改为与 `SEMANTIC_KEYS.length` 比较，不写死 10） |
| A3 | `--rejudge none` → `rejudged=[]` / `judgeMode=none` / `judged=[]`，不得 `["none"]` | 已落实（新增 TC-407；TC-201 / TC-605 同步加 `Chg ... EMPTY`） |
| A4 | `machineChecks` 五键齐全；缺失 → `EvidenceInvalid` | 已落实（新增 TC-406 正例、TC-408 负例；TC-405 构造补五键） |
| A5 | stderr 按「首行以 `<Code>:` 开头」断言，并说明这是 spec 契约 | 已落实（`Arg` / `Guard` / `ToolArg` / `Phase` 四个函数统一按 `startsWith(code + ':')` 判；代号区加「契约，不是实现细节」说明；新增 TC-110 专测；TC-507 记录 `golden-assert.mjs:56` 今天不满足） |
| A6 | `init-evidence` 阶段边界改为 R6 四步次序；补两条负例（`../../evil` → `InvalidName`；副本无 `.git` → `MigrationPhaseClosed`） | 已落实（TC-505、TC-506；TC-504 重写为「阶段先于 readEvidence」；TC-507 承接「未迁席坏 evidence」） |
| A7 | `suspended` 席走迁移段，带 `--expect-change` → `InvalidArgs` | 已落实（新增 TC-106，含对照组证明它落迁移段） |
| B8 | 变更段 `TargetDrift`（盘上 ≠ `lastWrittenHash`），卡字节不变 | 已落实（新增 TC-211） |
| B9 | 迁移段成功不追加 `changes` | 已落实（新增 TC-107，`Chg ... 'absent'`） |
| B10 | 幂等分支不校验凭证（错误凭证仍 exit 0） | 已落实（新增 TC-212） |
| B11 | `--expect-change` 输入空间：缺值（末位）/ 非 hex / 长度 63 / 65 / 后紧跟 `--yes` → `InvalidArgs`，卡不变 | 已落实（新增 TC-213 四态 + TC-214 紧跟旗标；卡不变由 `Guard` 的文件哈希断言承担） |
| B12 | 删整节 + `--rejudge none` → 拒（两侧行号并集） | 已落实（新增 TC-215：从模板整段删掉 identity 节，自检渲染确无该节） |
| B13 | state 置位次序：rename 失败后 state 仍不是 `replaced`，卡字节不变 | 已落实（新增 TC-109；含构造有效性自检，构造无效记「环境不适用」不得记绿） |
| B14 | `diff` 的卡缺失 → `DanglingBaselineEntry` | 已落实（新增 TC-309） |
| B15 | spec §7「只手动验证」两条的人工验证记录型用例 + 记录落点 | 已落实（新增 TC-804 + 文末 §7「人工验证记录」表） |
| C16 | 现状列三处误标（TC-209 / TC-210 改红并写明撞哪道闸门；TC-405 改绿） | 已落实（TC-209 标红并写明 `tools/docgen/cli.mjs:219`；TC-210 标红并写明 `tools/docgen/cli.mjs:219`（若过则 `:222`）；TC-405 标绿并写明「今天不看 `changes`」；三条判据未动） |
| C17 | `$w2/state-empty.json` 顺序污染：每条用例开头重建 state 或独立文件名 | 已落实（改为 `StateEmpty '102'` / `StateOne '106' …` / `StateAllReplaced '506'` 等按用例号命名的独立文件；组级规则第 2 条明写「每条用例开头重建自己的 state」） |
| C18 | 判据栏「见上 / 见步骤」自足化 | 已落实（所有代号改为函数，判据栏一律写「函数名 + 完整参数」；全文已无「见上 / 见步骤」） |
| C19 | 文件头加执行顺序行 | 已落实（文件头「执行顺序 = 组 1→组 8；每组开头重建副本与 state，组末恢复 `$repo` 并清四个 env」+ 组级规则三条） |
| C20 | §7 只手动验证已有承接 | 已落实（同 B15；TC-804 是承接用例，§7 记录表是落点） |
| D21 | 文件头升版本 + 修订独立性声明 | 已落实（「第 2 版（对应 spec 议会第 1 轮修复后）」+ 实例 `sdet-2026-10-21-docgen-intent-change-r2` + 四条声明） |
| D22 | 新增用例全部进覆盖总表并指回 R / §；重算计数三元组 | 已落实（23 条新用例全部入表；末段计数 20/26/21 = 67；并给计数核对命令） |
| D23 | 已有编号不重排不改号；新增用未占用号段且不重号 | 已落实（新增 106–110 / 211–215 / 309–311 / 406–410 / 505–507 / 606 / 804，与既有 101–105 / 201–210 / 301–308 / 401–405 / 501–504 / 601–605 / 701–704 / 801–803 无交集） |
| D24 | 不写死行数 / 字节数（卡行数、`numstat` 字面值、用例条数以外的计数一律现算） | 已落实（全文扫查：无卡行数与 `numstat` 字面值；TC-702 改现算；TC-101 场景数现算；TC-703 去掉行号引用改指 `## 边界` 节；evidence 份数改为「= 席数现算」） |
| D25 | 与 S4 的对应表保留，变化处同步「承接用例」列 | 已落实（§2 三行分别补 TC-107 / TC-107 / TC-506） |

**编写过程中自查发现并自行修掉的问题（第 2 版新增）**：

1. **TC-504 判据与新 R6 次序冲突**：v1 断「坏 evidence 先报 `EvidenceInvalid`」，而新 spec R6 把次序固定为「② 判阶段 → ③ `readEvidence`」。已把 TC-504 反向（已迁席 → 阶段码），并新增 TC-507（未迁席 → `EvidenceInvalid`）——只留一条会丢掉另一种组合的判别力。
2. **TC-405 的构造与 §3.4 新约束冲突**：v1 构造的 `changes[0]` 没有 `machineChecks`，按新版「每次变更必填五键」会被判非法。已补 `judgeMode` / `judged` / `machineChecks` 五键，并说明它的「今天绿」是「校验未落」，不是「判别力已成立」。
3. **`golden-assert` 的 stderr 契约今天不成立**：它不是 spec 未定义，而是实现（`golden-assert.mjs:56`）少一个冒号；已单列建议 2（P0），避免被误当成用例写错。
4. **TC-110 的判别力边界**：`cli` 路径今天已带冒号（`tools/docgen/cli.mjs:326`），所以 TC-110 今天绿；真正会红的是 acceptance 路径（TC-501/504/506/507），已在 TC-110 的「说明」里点明，避免读者误以为契约「已经全绿」。
5. **TC-101 的 `PASS 6/6` 曾写死**：改为从脚本里数 `scenario('S` 出现次数（`$want`）后再与末行比对。
6. **TC-309 与 TC-305 的混淆点**：「条目缺失（`agentData` 没这个名字）」与「卡缺失（盘上没文件）」是两个不同失败面；若 `diff` 不先查盘上文件，会打印「凭空造出的旧卡」。已在 TC-309 的「盲点说明」写明。
7. **TC-303 的假绿仍未消除**：今天 `UnsupportedKind` 既是「非 agent」也是「子命令不存在」，两者同码。已在建议 6 要求把 `sub` 写进 stderr，并在评审说明里标注「不得据今天结果判通过」。
8. **TC-211 的「现状」初稿标红，复核后改绿**：本条构造**不注入内容改动**（只把盘上卡追加一字节），今天会先撞 `tools/docgen/cli.mjs:265` 的 `TargetDrift`，恰好就是期望值；初稿误以为是 `tools/docgen/cli.mjs:222` 先拦。已改为「绿（施工后须仍绿）」——它守的是「变更段也保留 `TargetDrift`」这个不变量。
9. **TC-212 的构造初稿用了 `SetChangeEvidence`，会把归因搅浑**：那会让 `goldenAssertion=fail`，今天因「还没走到幂等分支」而红，与本条要抓的缺陷（幂等分支误要凭证）无关。已改为**保持 fixture 原值**（四道证明全过），于今天也应绿，是干净的回归守卫。
10. **TC-505 的泄漏断言初稿会误判**：初稿用 `Get-ChildItem $w2 -Recurse -Filter '*evil*'` 数文件，而临时证据目录名 `evil-ev` 自己也含 `evil` → 常数 ≥ 1，永远红。已改为只数 `*.json` 文件且按文件名匹配 `evil`。

## 7 人工验证记录（TC-804 的落点）

> 由本次施工者在完成 change 段写盘后填写；reviewer-qa / 审计复核时逐行核对「看到什么」栏能否在工具输出里逐字复现。

| # | 验证项 | spec 依据 | 执行者 | 日期 | 看到什么（逐字摘录） | 结论 |
|---|---|---|---|---|---|---|
| 1 | `diff` 输出里 `-`/`+` 中段恰为要改的那一行 | §7「只手动验证」/ §4 步 5 确认判据 | 本 session 施工者（主代理）；用户已确认 diff | 2026-10-21 | 第 3 行 `差异 - 1 / + 1（首处第 3 行）`；中段两行逐字为 `- description: 资深测试开发工程师（Senior SDET）。当需要为 PRD/spec 设计并编写测试用例（testcase.md）、评审测试策略、或专门找出被忽视的边界与失败场景时调用。Do not use for 修改业务代码、写实现方案、或只读的议会评审（那走 reviewer-qa）。` 与 `+ description: 资深测试开发工程师（Senior SDET）。当需要为 PRD/spec 设计并编写测试用例（testcase.md），或专门找出被忽视的边界与失败场景时调用。Do not use for 修改业务代码、写实现方案、或只读的议会评审（那走 reviewer-qa）。`；末行 `凭证 --expect-change 5ABA3215E4A7586D88F60B43C0AF43CCF4DA890D9C64175D843CCC9B522911EB` == 头部「新 渲染」哈希 | 通过：中段恰 1 行 description、凭证 == 渲染哈希 |
| 2 | 改后 `agents/senior-sdet.md` 仍是同一张卡（节与职责表未变） | §7「只手动验证」/ R9 | 本 session 施工者（主代理） | 2026-10-21 | `## ` 节恰 9 个且顺序为：你是谁 / 你负责三件事 / 三条铁律 / 输入（四样，缺一不写） / 测试设计固定清单（每条必答，"没问题"也要写结论） / 自由探索（必做） / 输出格式 / 通用纪律 / 边界；「你负责三件事」表 3 行（写测试用例 / 扫盲点 / 主动给开发提修改意见）未变；`git diff --numstat -- agents/senior-sdet.md` = `1 1`，`git diff` 只有 description 一行 | 通过：同一张卡，差异恰 description 一行 |
