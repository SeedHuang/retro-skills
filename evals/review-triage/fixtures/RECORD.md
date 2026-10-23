# 取证记录（review-triage）

> 本文件进 git，用途 = spec §4 步骤 0 的离线预检取证 + §3.4「禁词双向留痕」的材料来源（A1 契约脚本按本文件反查样本）。
> 铁律：**拿不到的证据一律写「未取证 / 未预检」，不得写成通过**。本文件中每条「通过」都附了可复算的命令与真实输出片段。
> 另一条铁律：**不得把答案暗示写进用例 yaml 的 `description` / `input.prompt`**（本文件同理——取证结论只写在这里，不回写进用例）。
> 取证环境：Windows / PowerShell 5.1（5.1.26100.9711）/ node v22.12.0 / git 2.55.0.windows.3；取证日期 2026-10-23。

## 一、离线预检

| 项 | 结果 | 证据 |
|---|---|---|
| `skill-up validate` | 通过 | v0.14.0 在位（不在 PATH）；`& 'D:\devtools\skillup\skill-up.exe' validate evals/review-triage/eval.yaml` → `✓ eval.yaml is valid (loaded 2 case(s))`，EXIT=0（详见 1.1） |
| `--dry-run` 返回 0 | 通过（**②–⑨ 为真校验；① 由桩替代**） | 见 1.2：当次用 TEMP 桩满足 ① 二进制定位（真实二进制已在位但不在 PATH）；②–⑨ 是 runner 真跑出来的校验。EXIT=0，首行 `① 二进制定位通过（…skill-up-stub.mjs）`，末行 `eval:review-triage dry-run 通过 ①–⑨` |
| 机读块 ①–④ 自洽 | 通过 | dry-run 行 `⑧ 机读块 ①–④ + iteration_min 通过；CONTRACT.json exit=0 且 14 个文件哈希一致`；A1 findings=0 |
| oracle 断言全过（⑤） | 通过 | dry-run 行 `⑨ oracle 断言全过 + 锚点双向通过（2 条）`；A1 未报 `ORACLE-1` / `ORACLE-2` / `ORACLE-3` |
| 锚点双向（⑥） | 通过 | 同 `⑨` 行；A1 未报 `EXP-13`（01：`notes/plan.md` 在 oracle 中 ≥1 命中、在 prompt 中 0 命中；02：`check:all` 同口径，因 02 已声明 `apply_diff`，`anchors` 不再允许为空） |
| ⑧ CONTRACT.json 半边 | 通过 | `fixtures/CONTRACT.json`：`schema=eval-contract/v1`、`exit=0`、`files` 14 条；dry-run 的 ⑧ 逐文件复算哈希全一致 |

### 1.1 `skill-up` 二进制定位（已取证，v0.14.0）

```
PS> Get-Command skill-up -ErrorAction SilentlyContinue | Select-Object Name,Source
（无输出——不在 PATH）
PS> & 'D:\devtools\skillup\skill-up.exe' --version
skill-up version 0.14.0
PS> & 'D:\devtools\skillup\skill-up.exe' validate evals/review-triage/eval.yaml
level=WARNING msg="SKILL.md not found within 10 levels above D:\\Seed\\retro-skills\\evals\\review-triage; falling back to D:\\Seed\\retro-skills\\evals"
✓ eval.yaml is valid (loaded 2 case(s))
VALIDATE_EXIT=0
```

两点如实标注：① 二进制**在位但不在 PATH**，所以 runner 必须靠 `SKILL_UP_BIN` 指过去（本文件上一版写的「本机无该二进制」是把「不在 PATH」误记成「不存在」，已订正）；② 那行 WARNING 是路径基准的直接证据——工具自己说兜底基准是 `D:\Seed\retro-skills\evals`，这正是本轮把全部相对路径改成相对 `evals/` 的依据。

### 1.2 `--dry-run`（桩二进制）

桩文件建在 `$env:TEMP`（**不进仓库**），内容只有一行 `process.exit(0)`：

```
PS> $stub = Join-Path $env:TEMP 'skill-up-stub.mjs'
PS> Set-Content -LiteralPath $stub -Value 'process.exit(0)' -NoNewline
PS> $env:SKILL_UP_BIN = $stub
PS> node scripts/run-eval.mjs review-triage --dry-run
```

真实输出（以下为关键行节选；本次实跑共 27 行，`LINE_COUNT=27`）：

```
① 二进制定位通过（C:\Users\HUANGC~1\AppData\Local\Temp\skill-up-stub.mjs）
② eval.yaml 可解析，模型占位未残留
③ 用例集 2 条
④ 产物目录不存在（D:\Seed\retro-skills\.session\eval-out\review-triage）
⑤ --iteration=2
⑥-1 fixture 源目录在位（1 个：checkbox-demo）
⑥-2 物化完成 → D:\Seed\retro-skills\.session\eval-fixture\review-triage
⑥-3 物化后 repo_fixture / apply_diff 均存在
⑥-4 skills[].path 与 SKILL.md 在位（D:\Seed\retro-skills\skills\review-triage）
⑥-5 baseline 与 git apply --check 通过
⑦ benchmark.enabled=true（工具将收到 --baseline）
⑧ 机读块 ①–④ + iteration_min 通过；CONTRACT.json exit=0 且 14 个文件哈希一致
⑨ oracle 断言全过 + 锚点双向通过（2 条）
command=D:\devtools\nvm4w\nodejs\node.exe run D:\Seed\retro-skills\evals\review-triage\eval.yaml --output-dir D:\Seed\retro-skills\.session\eval-out\review-triage --iteration 2 --baseline
- 配置模型（请求值）：未设置（dry-run 不注入） / 未设置（dry-run 不注入）
- 引擎版本：n/a（dry-run 未执行工具）
- 真实后端未验证：需在转发侧人工确认
- 覆盖范围：1 技能 / 2 用例
- 稳定性检出上限：n=n/a（检出率上界 1−p^n−(1−p)^n；n=2 时 ≤ 50%，且 n=2 时两次一致 ≠ 已验证稳定）
- actual_model=未确认
eval:review-triage dry-run 通过 ①–⑨
EXIT=0
```

两点如实标注：① `command=` 行前缀是 `node.exe`，因为桩的扩展名是 `.mjs`（runner 用 `process.execPath` 起它），**这条命令行没有被真正执行**；② dry-run 不写 `<output-dir>` / `verdict.md`（核过 `.session/eval-out/review-triage` 不存在），但**会**物化 `.session/eval-fixture/`（§3.3-5 允许且 ⑥ 需要）。

## 二、fixture 四件自查

| # | 项 | 结果 |
|---|---|---|
| 1 | `apply_diff` 在 `context.git` 下 | 通过：`cases/01-checkbox-mechanical.yaml` 第 31–35 行 `context:` → `git:`（第 34 行 `init: true`，第 35 行 `apply_diff:`）；A1 未报 `FIX-1`，runner ⑥-4 通过 |
| 2 | 物化副本有 baseline 提交 | 通过：`.session/eval-fixture/review-triage/checkbox-demo/.git` 存在，`git log --oneline` = `36db2c6 baseline` |
| 3 | 临时副本实测 ` M notes/plan.md` + diff 翻转 | 通过：`git status --porcelain` 输出 ` M notes/plan.md`，`git diff` 同时出现 `-| 1 | 建评测目录 | [ ] |` 与 `+| 1 | 建评测目录 | [x] |` |
| 4 | `git apply --check <补丁>` 退出 0 | 通过：APPLY_CHECK_EXIT=0（在 `$env:TEMP` 副本上做，仓库内 fixture 未 `git init`） |
| 5 | 02 的 `command-swap-demo` 源目录在位且不带 `.git` | 通过：`evals/review-triage/fixtures/repos/command-swap-demo/` 含 `package.json`、`scripts/precommit.sh`；`Test-Path …/command-swap-demo/.git` = `False`；A1 未报 `FIX-*` |
| 6 | 02 的 `command-swap.patch` 能在物化副本上通过 `git apply --check` | 通过：runner 真跑时 ⑥-5 未报错（真跑 exit 0 即含本项）；补丁内容 = `-npm run check` / `+npm run check:all` |

### 2.1 命令与输出（全部在 TEMP 副本上做）

```
PS> Test-Path .session/eval-fixture/review-triage/checkbox-demo/.git
True
PS> git -C .session/eval-fixture/review-triage/checkbox-demo log --oneline
36db2c6 baseline
PS> git -C .session/eval-fixture/review-triage/checkbox-demo rev-parse HEAD
36db2c67459d8b0a59709d323441fc75b16c5eaf
```

```
PS> $w = Join-Path $env:TEMP 'eval-fixture-check'
PS> Copy-Item -Recurse -Force .session\eval-fixture\review-triage\checkbox-demo (Join-Path $w 'checkbox-demo')
PS> git -C (Join-Path $w 'checkbox-demo') apply --check 'D:\Seed\retro-skills\evals\review-triage\fixtures\diffs\checkbox.patch'
APPLY_CHECK_EXIT=0
PS> git -C (Join-Path $w 'checkbox-demo') apply 'D:\Seed\retro-skills\evals\review-triage\fixtures\diffs\checkbox.patch'
APPLY_EXIT=0
PS> git -C (Join-Path $w 'checkbox-demo') status --porcelain
 M notes/plan.md
PS> git -C (Join-Path $w 'checkbox-demo') diff -- notes/plan.md
@@ -2,5 +2,5 @@
 | # | 任务 | 状态 |
 |---|---|---|
-| 1 | 建评测目录 | [ ] |
+| 1 | 建评测目录 | [x] |
 | 2 | 写用例 | [ ] |
```

附一条如实观察：补丁头里的 `index bfc44b4..ba1501f` 与物化副本实际 blob（apply 后 `index 311ea3c..d40f346`）不一致，`git apply --check` 仍退 0——说明当前是靠上下文行匹配而非 blob 比对通过的。这不算失败，但换 fixture 内容时必须同步重造补丁，否则 ⑥-5 会码 4。

## 三、路径基准正向观测（yaml 内路径相对 `evals/` 目录）

- **已取证（2026-10-23 真跑）**：`skill-up validate` 打印 `falling back to D:\Seed\retro-skills\evals`，且 `loaded 2 case(s)`——说明 yaml 里的 `review-triage/cases/*.yaml` 就是在 `evals/` 基准下被加载成功。判据（工具真加载到用例、产物里出现 case-id）同时由真跑产物满足：`.session/eval-out/review-triage/iteration-1/01-checkbox-mechanical/`、`…/02-command-swap-semantic/` 两个目录都生成。
- 反向对照（修复前）：同一工具在旧基准下报 `failed to read case file ../../evals/review-triage/cases/01-checkbox-mechanical.yaml: open D:\Seed\evals\…`，runner 端 `runs=0/0`、两条用例 `INVALID_ENV`。两相对照可确认基准就是差在这一层。
- 「模型回复出现 fixture 独有内容」**已取证**：01 装技能回复里出现 `notes/plan.md` 与 `git diff`；02 装技能回复里出现 `scripts/precommit.sh` 与 `npm run check` → `check:all`（原文见 `.session/eval-out/review-triage/iteration-1/02-command-swap-semantic/with_skill/outputs/response.md`）。
- 仍需人工确认的一项（不冒充通过）：`actual_model=未确认`——`~/.claude/settings.json` 与 CCR 网关的模型名可能不一致，证据只到「请求值 = DeepSeek / deepseek-flash」这一层。

## 四、禁词双向留痕

### 4.1 正向（正确行为里不出现）

判据 = 手写 oracle 同时满足 `must_contain` 与 `must_not_contain`，机械核对由 A1 的 §3.2.2「核对 ⑤」承担：

- `fixtures/oracle/01-checkbox-mechanical.md`：`可直接提交` / `git diff` / `notes/plan.md` 3/3 命中，四个禁词 0 命中。
- `fixtures/oracle/02-command-swap-semantic.md`：`必须 review` / `机器判不了` 2/2 命中，四个禁词 0 命中。
- A1 输出 `findings=0`，即 `ORACLE-1`（must_contain 未命中）/ `ORACLE-2`（缺词）/ `ORACLE-3`（命中禁用词）三条断言均未触发。

### 4.2 反向（错误行为里确实出现，逐行复验）

复验命令（不照抄任何口径，现场数出来的）：

```
PS> cd d:\Seed\retro-skills
PS> Get-ChildItem -Recurse -Filter *.md evals\review-triage\fixtures\responses | ForEach-Object { $rel = $_.FullName.Substring($PWD.Path.Length + 1).Replace('\','/'); $i = 0; Get-Content -LiteralPath $_.FullName | ForEach-Object { $i++; foreach ($w in @('纯文档','低风险','不涉及代码','不影响代码')) { if ($_.Contains($w)) { "{0}:{1} 命中「{2}」" -f $rel,$i,$w } } } }
evals/review-triage/fixtures/responses/01-without-skill.wrong.md:1 命中「低风险」
evals/review-triage/fixtures/responses/01-without-skill.wrong.md:2 命中「纯文档」
evals/review-triage/fixtures/responses/01-without-skill.wrong.md:2 命中「不影响代码」
```

即命中只有 3 处（只来自 `01-without-skill.wrong.md` 的前两行），`不涉及代码` 在全部样本里 0 命中——因此不登记它，**不凑数**。以下三条是 A1 逐行子串复算的依据：

- 反向证据：`fixtures/responses/01-without-skill.wrong.md`:1 命中「低风险」（assert_hash `64a8bec1a2b03347a32328ea2dd87399a0bccf3112deca275e25be5fed839a1d`）
- 反向证据：`fixtures/responses/01-without-skill.wrong.md`:2 命中「纯文档」（assert_hash `64a8bec1a2b03347a32328ea2dd87399a0bccf3112deca275e25be5fed839a1d`）
- 反向证据：`fixtures/responses/01-without-skill.wrong.md`:2 命中「不影响代码」（assert_hash `64a8bec1a2b03347a32328ea2dd87399a0bccf3112deca275e25be5fed839a1d`）

三个词在两个用例的 `must_not_contain` 里都声明（`expected.md` 机读块里 `纯文档` / `低风险` / `不涉及代码` / `不影响代码` 四条两两相同），A1 的 `REC-5` 不会触发。被核对的样本是 `01-without-skill.wrong.md`，它对应 **01（`role: probe`）** 用例，故三条留痕统一登记 01 的 `assert_hash`（不是 02 gate 的），见 §4.3。

### 4.3 断言集哈希（assert_hash）怎么算出来的

`assert_hash` **每条用例各自一个**（覆盖该用例的 `{assert, anchors, arms, delta}`；probe 的 `arms` / `delta` 为 `null`，同样参与哈希），**与 ledger 无关**（本轮 `frozen-ledger.json` 为空对象 `{}`，未改动）。两条用例的复算与真值：

```
PS> node -e "import('./scripts/eval-contract-core.mjs').then(m=>{const fs=require('fs');const r=m.extractMachineBlock(fs.readFileSync('evals/review-triage/expected.md','utf8'));if(!r.ok)throw new Error(r.error);for(const c of r.block.cases){console.log('eval_name='+c.eval_name);console.log('role='+c.role);console.log('assert_hash='+m.assertHash({assert:c.assert,anchors:c.anchors,arms:c.arms,delta:c.delta}));console.log('---')}})"
eval_name=纯勾选改动应判为可直接提交
role=probe
assert_hash=64a8bec1a2b03347a32328ea2dd87399a0bccf3112deca275e25be5fed839a1d
---
eval_name=执行动作替换应判为必须 review
role=gate
assert_hash=81ab462ecea8ed07d7f42a9e0d0ff62d54fbd06ecf6834fb16997a14967274fa
---
```

实现口径：`assertHash` = `sha256(canonicalJson({assert, anchors, arms, delta}))`（`scripts/eval-contract-core.mjs` 第 173–175 行，runner 与 A1 共用这一处，不各写一份）。

| 断言集哈希（01 probe） | 样本文件 | 行号 | 命中词 |
|---|---|---|---|
| `64a8bec1a2b03347a32328ea2dd87399a0bccf3112deca275e25be5fed839a1d` | `fixtures/responses/01-without-skill.wrong.md` | 1 | 低风险 |
| `64a8bec1a2b03347a32328ea2dd87399a0bccf3112deca275e25be5fed839a1d` | `fixtures/responses/01-without-skill.wrong.md` | 2 | 纯文档 |
| `64a8bec1a2b03347a32328ea2dd87399a0bccf3112deca275e25be5fed839a1d` | `fixtures/responses/01-without-skill.wrong.md` | 2 | 不影响代码 |

## 五、阈值来源

| 用例 | 字段 | 值 | 来源（声明值 / 实测） | 样本路径 |
|---|---|---|---|---|
| 执行动作替换应判为必须 review | with_skill.min_rate | 1.0 | **实测（2026-10-23 真跑，2/2 轮全过）** | `.session/eval-out/review-triage/iteration-{1,2}/02-command-swap-semantic/with_skill/grading.json` |
| 执行动作替换应判为必须 review | without_skill.max_rate | 0.0 | **实测（2026-10-23 真跑，2/2 轮 0.333 → 未全过）** | `…/iteration-{1,2}/02-command-swap-semantic/without_skill/grading.json` |
| 执行动作替换应判为必须 review | delta.min | 1.0 | **实测（1.0 − 0.333 = 0.667，声明 1.0 偏严但方向一致；见下注）** | 同两行样本 |

- 取值位置（唯一单源）：`expected.md` 里的 json 机读块（`schema: eval-expectation/v2`），`cases[1]`（`role: gate`）的 `arms` / `delta` 字段。别处不复述数值（§3.2.2 / §6-10）。
- 本轮 `origin=calibrated`，口径是**试跑校准的冒烟测试，不代表独立验证**（R10）。
- 实测口径说明：runner 的 `rate` 列是「全过轮次/总轮次」的整数比（n=2 → {0, 0.5, 1}），所以显示 `1/0`；而 `grading.json` 的 `pass_rate` 是单轮内断言通过率（without 臂 = 0.333，因为 3 条断言只过 1 条）。`delta` 判定用的是前者（1 − 0 = 1），故 `delta=1` 达标。
- 两点如实标注：① 上述样本在 `.session/`（不进 git），换机器即失；要长期留证需另存进 `fixtures/responses/`。② `actual_model=未确认`，本轮只能声称「请求了 DeepSeek/deepseek-flash」，不能声称后端就是它。

## 六、A1 运行记录

| 时间 | 命令 | 退出码 | findings |
|---|---|---|---|
| 2026-10-23 11:12:41 | `node scripts/check-eval-contract.mjs review-triage`（本文件产出前的基线） | 0 | 0，另有一行 `SKIP 禁词双向留痕：RECORD.md 未产出（Task 7 前的正常态）` |
| 2026-10-23 11:15 前后（该次未逐秒记录） | 同上（本文件第一版产出后） | **4** | **3**，全部是 `[REC-2] 禁词留痕的样本不存在：01-without-skill.wrong.md` |
| 2026-10-23 11:15:55 | 同上（修掉上一条后复跑） | 0 | 0，**无 SKIP** |
| 2026-10-23 11:16:41 | 同上（补登：当时漏记了这一次，时间取自 `CONTRACT.json` 的 `checked_at=2026-10-23T03:16:41.954Z` 换算北京时间） | 0 | 0，**无 SKIP** |
| 2026-10-23 11:25:50 | 同上（本次为本文件定稿后重跑） | 0 | 0，**无 SKIP**。备注：此后本文件仅追加本行与其他措辞订正，未改任何证据行、`assert_hash` 未变；追加本行后立刻复核再跑一次，仍 exit 0 / findings 0 |
| 2026-10-23 13:16:47 | 同上（路径基准改为 `evals/` + 02 补齐夹具后的重跑） | 0 | 0，`CONTRACT.json` 已写入（14 个文件，六类枚举未变；新增的 `repos/command-swap-demo/**` 与 `diffs/command-swap.patch` 不在枚举内） |

**验真方式**：本表只是流水账，**不要相信本表**——验真的办法是现场重跑 `node scripts/check-eval-contract.mjs review-triage`，看它自己打印的 `findings=` 与退出码。

基线那次的原始输出：

```
A1 契约核对：review-triage｜findings=0｜CONTRACT.json 已写入（14 个文件）
SKIP 禁词双向留痕：RECORD.md 未产出（Task 7 前的正常态）
```

中间那次 FAIL 的原始输出（如实留痕）：

```
A1 契约核对：review-triage｜findings=3｜CONTRACT.json 未写入（有 FAIL）
  [REC-2] 禁词留痕的样本不存在：01-without-skill.wrong.md
  [REC-2] 禁词留痕的样本不存在：01-without-skill.wrong.md
  [REC-2] 禁词留痕的样本不存在：01-without-skill.wrong.md
```

原因与修法（值得记一笔的机械细节）：4.2 那段**粘贴的 PowerShell 输出**原先只打印文件名（无目录），而 A1 的登记正则**不屏蔽围栏代码块内的文本**，于是这三行输出被当成三条留痕，按 `skill-root` / `evalDir` / `repoRoot` 三处拼都找不到 `01-without-skill.wrong.md` → `REC-2`。修法 = 把复验命令改成打印**仓库根相对路径**并重跑取真实输出（1.2 节同一处理：宁可让输出行本身也是合法留痕，也不改 A1 的枚举或正则）。这次 FAIL 也顺带证明了反向证据的机械核对**真的在跑**，不是一纸声明。

最后那次（本文件产出后）的原始输出：

```
A1 契约核对：review-triage｜findings=0｜CONTRACT.json 已写入（14 个文件）
```

最后一行（本次 Task 7 的结果）：**A1 `node scripts/check-eval-contract.mjs review-triage` = exit 0 / findings 0 / 禁词留痕已被真核对（`SKIP` 消失）**。

说明三点：① `CONTRACT.json` 的 `checked_at` 每次 A1 成功都会刷新（形如 `2026-10-23T03:16:41.954Z`）——它是运行时刻戳、不是内容指纹，本文件不逐次追写它，验真请看 `files` 里的哈希；② 上表最后一行之后，本文件做过一次哈希订正（三条反向证据与 §4.3 统一改为 01 probe 的 `assert_hash`，原先错贴成 02 gate 的），订正后 A1 复跑仍 0 findings；③ `RECORD.md` **不在** A1 的六类枚举内（枚举 = `eval.yaml` / `expected.md` / `frozen-ledger.json` / `cases/*.yaml` / `fixtures/oracle/*.md` / `fixtures/responses/**`），所以它不进快照哈希；它属 spec §3.4 的「自查记录」，本轮不改 A1 的枚举——它自身的防删/防删行由 `REC-0`（缺失即 FAIL）与 `REC-7`（禁词在样本里出现却无登记即 FAIL）兜住。

## 七、真跑记录（2026-10-23，唯一一次真跑取证）

**命令**（二进制不在 PATH，必须显式指过去）：

```
PS> $env:SKILL_UP_BIN='D:\devtools\skillup\skill-up.exe'
PS> $env:EVAL_MODEL_PROVIDER='DeepSeek'
PS> $env:EVAL_MODEL_NAME='deepseek-flash'
PS> node scripts/run-eval.mjs review-triage
```

**结果（`verdict.md` 原文）**：

```
- 配置模型（请求值）：DeepSeek / deepseek-flash
- 引擎版本：2.1.278
- 覆盖范围：1 技能 / 2 用例
- actual_model=未确认
纯勾选改动应判为可直接提交: role=probe iteration=2 runs=2/2 undet=0/0 flaky=否 rate=1/0 delta=n/a verdict=VALID exit=0 timeout=否
执行动作替换应判为必须 review: role=gate iteration=2 runs=2/2 undet=0/0 flaky=否 rate=1/0 delta=1 verdict=VALID exit=0 timeout=否
EXIT=0
```

**两臂差异是真的（不是声明）**：

- 02 装技能（`iteration-1/02-command-swap-semantic/with_skill/outputs/response.md`）：「⚠️ 必须 review（判据：机器判不了）—— `scripts/precommit.sh`：执行动作替换 `npm run check` → `npm run check:all`」→ `grading.json` 3/3 过。
- 02 不装技能（`…/without_skill/outputs/response.md`）：「**建议提交**（本次改动意图内）—— `scripts/precommit.sh` — 把预提交脚本的检查命令从 `npm run check` 改为 `npm run check:all`」→ 分错档，`grading.json` 1/3（`必须 review` / `机器判不了` 两词均未命中）。
- 01 装技能回复里出现 `notes/plan.md` 与 `git diff`；不装技能回复没按三档分流。

**如实标注**：① 产物在 `.session/eval-out/review-triage/`（不进 git，换机器即失）；② `actual_model=未确认`——只能声称「请求值是 DeepSeek/deepseek-flash」；③ `n=2` 时 `flaky=否` 不等于已验证稳定（检出率上界 ≤ 50%）。

## 附注：一条残留风险（controller 要求明记）

1. **有 FAIL 时不写 `CONTRACT.json` 的残留**：A1 只在 0 findings 时写快照（否则留旧值，让 runner ⑧ 拦住漂移）。副作用是——FAIL 期间**新增**的六类文件（新用例 yaml / 新 oracle / 新响应样本）不会出现在旧快照里，runner ⑧ 只比对旧键、不发现多出来的新文件。当前靠「0 findings 才可继续」的流程兜住：有 FAIL 就不许进下一步，而不是靠哈希比对发现。
2. **§3.2.2③ 的 frozen 类型守卫（已补）**：ledger 里的 `assert_hash` 若被写成非字符串（数字 / null / 对象），此前 A1 与 runner 两边都只检查「字段存在」，于是静默跳过比对。现已改为「必须是 64 位十六进制」，不合规即报错（runner 用 ⑧ 问题串、A1 用 `LEDGER-1`）。
