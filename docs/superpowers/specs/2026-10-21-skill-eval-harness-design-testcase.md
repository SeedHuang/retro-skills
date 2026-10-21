# 测试用例：skill 行为评测工装（skill-up 本地化）

> 归属 spec：`docs/superpowers/specs/2026-10-21-skill-eval-harness-design.md`（版本日期 2026-10-21，状态「待评审（未定稿）」）
> 编写者：`senior-sdet`（实例标识 `sdet-2026-10-21-skill-eval-harness`，全新上下文）｜**独立性声明**：编写者未参与本 spec 编写（spec 由用户 2026-10-21 决定驱动、经 spec 流程产出），未参与施工（本轮尚未施工），未阅读任何 `scripts/run-eval.mjs` 实现（该文件当前不存在）。本文件所有判据只从 spec 的 R1–R10、§3.1–§3.5、§5、§6、§7 与仓库既有机制（`scripts/check-all.mjs`、`.gitignore`、`package.json`、`skills/review-triage/SKILL.md`、`.session/eval-trial/` 实测证据）独立推导，未从实现倒推。
> 状态：草稿（**定稿 = 每条用例五要素齐全，且覆盖总表与 spec 验收项一一对应**）｜最后更新：2026-10-21
> 命名与落点：按 `spec-testcase-gate` 规则判据 1（与 spec 同目录；文件名 = spec 文件名去掉 `.md` 后 + `-testcase.md`）。
> 环境：Windows + PowerShell 5.1+ / Node ≥ 22；skill-up 二进制由 `SKILL_UP_BIN` 或 `PATH` 提供（本机实测 `D:\devtools\skillup\skill-up.exe`，v0.14.0）。需要模型凭据的用例一律附「无凭据时降级为 `validate` + `--dry-run` 验证结构」的替代路径。
> 编号规则：TC-三位序号，一经分配不改号；作废用例标「作废」并保留，不删号。当前 spec 未施工，「对应测试」一律「待 plan Task N」，Task 编号在 plan 产出后映射。

## 1 覆盖总表

| 用例 ID | 分组 | 覆盖的 spec 条目 | 用例名 | 正/负/边界 | 层级 | 判据类型 | 执行方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| TC-001 | A 位置与产物 | R1 / §3.1 / §5① / §7-1 | evals 目录结构就位且与 skills 隔离 | 正 | 集成 | 机器 | `Test-Path` + `Get-ChildItem` + `listSkillDirs` 计数 | P0 |
| TC-002 | A 位置与产物 | R1 / §3.2 / R9 | eval.yaml 指向仓库内真技能且不写死模型名 | 正 | 集成 | 机器 | `Select-String` 文本断言 | P0 |
| TC-003 | A 位置与产物 | §3.2 | eval.yaml 固定契约字段齐全 | 正 | 单元 | 机器 | `Select-String` 逐字段断言 | P0 |
| TC-004 | A 位置与产物 | R1 / §3.2 | skills[].path 写成 `.` 必须被拒或登记为缺口 | 负 | 集成 | 机器 | 临时副本改字段 + `skill-up validate` | P0 |
| TC-005 | A 位置与产物 | R1 / §5① | evals 副本落进技能目录必须被结构断言检出 | 负 | 集成 | 机器 | 临时副本注入 + 结构断言 | P0 |
| TC-006 | A 位置与产物 | R3 / §5② / §7-2 | 跑完 skills 下无新增目录且产物只落 .session | 正 | e2e | 机器 | `npm run eval:review-triage` + 前后计数 + `git status` | P0 |
| TC-007 | A 位置与产物 | R3 | runner 去掉 --output-dir 会污染 skills 目录 | 负 | 集成 | 机器 | 临时副本故障注入 + 源码断言 | P0 |
| TC-008 | A 位置与产物 | R2 / §5③ / §7-3 / §7-9 | check 契约不破：全绿、check-all 零改动、零依赖 | 正 | 集成 | 机器 | `npm run check` + `git diff` + package.json 解析 | P0 |
| TC-009 | A 位置与产物 | R2 | 剥离 skill-up 后 check 仍须全绿 | 负 | 集成 | 机器 | 清洗 PATH 后 `npm run check` | P0 |
| TC-010 | A 位置与产物 | R3 / §5⑧ / §7-2 | 删掉产物目录后重跑自建且结论一致 | 边界 | e2e | 机器 | 删除 + 重跑 + 报告比对 | P1 |
| TC-011 | B 断言质量 | R4-② / §5⑤ | must_not_contain 不得含分档标题 | 正 | 单元 | 机器 | 解析用例 yaml 的 must_not_contain 块 | P0 |
| TC-012 | B 断言质量 | R4-①③ / §3.4 / §5⑤ | 每条用例断言双面且为理由级词 | 正 | 单元 | 机器 | 解析 yaml 结构 + 词表比对 | P0 |
| TC-013 | B 断言质量 | R4-② / §5⑤ | 分档标题写进 must_not_contain 会误杀正确答案 | 负 | 单元 | 机器 | 历史正确答案离线复算 | P0 |
| TC-014 | B 断言质量 | R4-①③ / §7-4 | 只留结论词会放过结论对理由错的回复 | 负 | 单元 | 机器 | 构造假回复离线判定 | P0 |
| TC-015 | B 断言质量 | R4 / §7-4 | 假阳性样例：历史正确答案必须 PASS | 正 | 单元 | 机器 | 历史 with_skill 回复离线复算 | P0 |
| TC-016 | B 断言质量 | R4 / §7-4 | 假阴性样例：历史错误答案必须 FAIL | 正 | 单元 | 机器 | 历史 without_skill 回复离线复算 | P0 |
| TC-017 | B 断言质量 | R4 / §7-4 | 证据词不得死抠命令全名 | 边界 | 单元 | 机器 | 两次历史样本对照复算 | P1 |
| TC-018 | B 断言质量 | R4-① | 禁令词出现在否定句会误杀 | 边界 | 单元 | 机器+人工 | 构造否定句样本离线判定 | P1 |
| TC-019 | B 断言质量 | §3.4 | prompt 只给输入不给答案 | 边界 | 单元 | 机器 | 解析 prompt 块的答案词扫描 | P1 |
| TC-020 | C fixture | R5 / §3.1 | fixture 仓库与补丁就位 | 正 | 集成 | 机器 | `Test-Path` + 内容比对 | P0 |
| TC-021 | C fixture | R5 / §7-5 | fixture 上 git diff 真有输出且只含一行翻转 | 正 | e2e | 机器 | 临时仓库 `git init` + `apply` + `diff` | P0 |
| TC-022 | C fixture | R5 / §3.4 | 缺 repo_fixture/git.init/apply_diff 的用例不合格 | 负 | 单元 | 机器 | 用例 yaml 字段扫描 | P0 |
| TC-023 | C fixture | R5 / §3.5 | 空目录跑用例 01 会误判必须 review，结论不成立 | 负 | e2e | 机器+人工 | 故障注入去掉 fixture 后真跑 | P0 |
| TC-024 | C fixture | R5 / §5⑧ | 补丁必须是 LF 且无 BOM | 边界 | 单元 | 机器 | 字节级读取检查 | P1 |
| TC-025 | C fixture | R5 | 补丁路径分隔符必须是正斜杠 | 边界 | 单元 | 机器 | 补丁头行正则扫描 | P1 |
| TC-026 | D 稳定性与差值 | R6 / §3.3-2 | 迭代次数默认 2 且拒绝小于 2 | 正 | 集成 | 机器 | `--iteration 1` 与 `--dry-run` 参数断言 | P0 |
| TC-027 | D 稳定性与差值 | R6 / §3.3-4 / §5⑥ | runner 每条用例打印 flaky 判定 | 正 | 集成 | 机器 | stdout 行格式断言 | P0 |
| TC-028 | D 稳定性与差值 | R6 / §5⑥ / §7-6 | 出现 flaky 时结论必须为无效 | 负 | e2e | 机器+人工 | 历史 flaky 证据 + 结论文本断言 | P0 |
| TC-029 | D 稳定性与差值 | R7 / §3.3-2 | baseline 必开且报告含 With/Without/Delta | 正 | 集成 | 机器 | yaml + 源码 + benchmark.md 断言 | P0 |
| TC-030 | D 稳定性与差值 | R7 | 关掉 baseline 后无差值，判不合格 | 负 | 集成 | 机器 | 临时副本注入 + 报告列断言 | P1 |
| TC-031 | D 稳定性与差值 | R6 / §3.3-4 / R10 | 报告计数口径：runs 与期望项数不得混用 | 边界 | 集成 | 机器 | report.json 与 benchmark.md 交叉核对 | P0 |
| TC-032 | E runner 与结论边界 | §3.3-1 / §7-8 | SKILL_UP_BIN 优先且 dry-run 走通 | 正 | 集成 | 机器 | 设环境变量 + `--dry-run` | P0 |
| TC-033 | E runner 与结论边界 | §3.3-1 / §7-7 | 二进制找不到必须非 0 退出并给安装指引 | 负 | 集成 | 机器 | 伪造 SKILL_UP_BIN + 清洗 PATH | P0 |
| TC-034 | E runner 与结论边界 | §3.3-3 | skill-up 非 0 时退出码必须透传 | 正 | 单元 | 机器 | 退出码 3 的 shell 桩替换二进制 | P0 |
| TC-035 | E runner 与结论边界 | §3.3-3 | 非 0 不得解释成技能坏了 | 负 | 单元 | 机器 | 桩 + stdout 文本断言 | P0 |
| TC-036 | E runner 与结论边界 | R9 / §5⑦ / §7-8 | stdout、报告、送审说明三处都带引擎与模型 | 正 | e2e | 机器 | 三处文本断言 | P0 |
| TC-037 | E runner 与结论边界 | R9 | CCR 转发时不得把结论写成对 Claude 成立 | 负 | 单元 | 机器 | 模型名与结论文本交叉扫描 | P0 |
| TC-038 | E runner 与结论边界 | §7 执行环境 | 无凭据时降级 validate 与 dry-run，不得判技能失败 | 边界 | 集成 | 机器+人工 | 清空凭据变量后三命令对照 | P1 |
| TC-039 | F 事前预期与越界 | R10 / §5④ | R10 预期值必须早于运行写死并逐条对账 | 正 | e2e | 机器 | 文件 mtime 序 + 对账表数值断言 | P0 |
| TC-040 | F 事前预期与越界 | R10 / §6-1 | 实测不达时判用例无效且技能零改动 | 负 | e2e | 机器 | `git status --porcelain skills/` + 结论文本 | P0 |
| TC-041 | F 事前预期与越界 | §6-1 | 改 SKILL.md 迁就用例即违规 | 负 | 集成 | 机器 | skills 目录 diff 断言 | P0 |
| TC-042 | F 事前预期与越界 | R8 / §8 | 本轮只允许 review-triage 一个技能目录且不建 CI | 负 | 集成 | 机器 | 目录与 workflow 扫描 | P0 |
| TC-043 | F 事前预期与越界 | §3.3 / §7-7 | cases 为空不得静默当成功 | 边界 | 集成 | 机器 | 临时副本置空 cases + validate/run | P1 |
| TC-044 | F 事前预期与越界 | §3.2 | eval.yaml 语法错必须非 0 且指行 | 边界 | 单元 | 机器 | 临时副本注入坏行 + validate | P1 |

**覆盖核对**：spec §5 验收锚点共 8 条，本表覆盖 8 条（①→TC-001/005；②→TC-006/007/010；③→TC-008/009；④→TC-029/030/039/040；⑤→TC-011/012/013；⑥→TC-026/027/028；⑦→TC-036/037；⑧→TC-010/021/024）。R1–R10 共 10 条核心决定全部覆盖（R1→TC-001~005；R2→TC-008/009；R3→TC-006/007/010；R4→TC-011~019；R5→TC-020~025；R6→TC-026~028/031；R7→TC-029/030；R8→TC-042；R9→TC-002/036/037；R10→TC-031/039/040）。§7 测试项 1–9 全覆盖（1→TC-001/005；2→TC-006/007/010；3→TC-008/009；4→TC-011~018；5→TC-020~025；6→TC-026~028/031；7→TC-033/043；8→TC-032/036/037；9→TC-008）。未覆盖 0 条；§8「不在这一轮」四项按 R8 不测（见第 6 节）。

## 2 用例明细

分组索引：A 位置与产物 = TC-001~010；B 断言质量与判别力 = TC-011~019；C fixture 与素材 = TC-020~025；D 稳定性与差值 = TC-026~031；E runner 与结论边界 = TC-032~038；F 事前预期与越界 = TC-039~044。

### TC-001 evals 目录结构就位且与 skills 隔离

- **覆盖**：`R1 / §3.1 / §5① / §7-1`
- **前置**：plan 的施工步骤 1–2 已完成（`evals/review-triage/` 与两条例、fixture 目录已在工作区）。
- **步骤**：① `Test-Path evals/review-triage/eval.yaml`；② `Test-Path evals/review-triage/cases/01-checkbox-mechanical.yaml`、`Test-Path evals/review-triage/cases/02-command-swap-semantic.yaml`；③ `Get-ChildItem skills -Recurse -Directory -Filter evals`；④ `Get-ChildItem evals -Recurse -Filter SKILL.md`；⑤ 施工前先记录 `node -e "import('./scripts/skill-dir.mjs').then(m=>console.log(m.listSkillDirs('skills').length))"` 的基线值，施工后再跑一次。
- **预期**：①② 全部 `True`；③ 无输出（`skills/` 下不存在 `evals` 目录）；④ 无输出（`evals/` 下不含任何 `SKILL.md`，因此不会被当成技能包）；⑤ 两次计数相同。
- **判据**：机器——步骤 ③④ 的输出行数均为 0，⑤ 两次数字相等，且 ①② 全 `True`，四项同时成立；任一不成立即失败。
- **红绿证据**：红 = 施工前 `Test-Path evals/review-triage/eval.yaml` 返回 `False`；绿 = 施工后四项断言全过。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 `npx skills add` 的真实安装清单（结构断言是其代理证据，真实打包清单见第 5 节）。

### TC-002 eval.yaml 指向仓库内真技能且不写死模型名

- **覆盖**：`R1 / §3.2 / R9`
- **前置**：`evals/review-triage/eval.yaml` 已存在。
- **步骤**：① `Select-String -Path evals/review-triage/eval.yaml -Pattern '^\s*path:\s*skills/review-triage\s*$'`；② `Select-String -Path evals/review-triage/eval.yaml -Pattern 'path:\s*\.\s*$'`；③ `Select-String -Path evals/review-triage/eval.yaml -Pattern 'claude-[a-z0-9\.\-]+|anthropic'`；④ `Select-String -Path evals/review-triage/eval.yaml -Pattern '^\s*source:\s*local_path\s*$'`。
- **预期**：① 命中 1 行；② 0 命中（`.` 表示「与本文件同级」，在仓库布局下会解析到 `evals/review-triage/`，那里没有 `SKILL.md`）；③ 0 命中（模型名由 runner 从环境决定并在报告落账，不得写死）；④ 命中 1 行。
- **判据**：机器——①④ 命中数各 ≥1，②③ 命中数各 = 0。
- **红绿证据**：红 = 沿用试跑版的 `path: .`（`.session/eval-trial/review-triage/evals/eval.yaml` 第 6 行），路径语义变成「与本文件同级」，与 R1 要求的仓库相对路径不符；绿 = 真仓库版写 `skills/review-triage`，validate 退出 0。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证引擎是否真能加载该目录（TC-032 管）。

### TC-003 eval.yaml 固定契约字段齐全

- **覆盖**：`§3.2`
- **前置**：`eval.yaml` 已存在。
- **步骤**：对以下模式逐条跑 `Select-String -Path evals/review-triage/eval.yaml -Pattern <模式>`：① `^\s*schema_version:\s*v1alpha1\s*$`；② `environment:` 块下 `type:\s*none`；③ `timeout_seconds:\s*240`；④ `max_turns:\s*8`；⑤ `enabled:\s*true`（benchmark 段）；⑥ `formats:\s*\[json,\s*html\]` 或等价的 json + html 两项；⑦ `engine:` 块下 `name:\s*claude_code`。
- **预期**：七条模式各命中 ≥1 行；无一条缺失。
- **判据**：机器——七条 `Select-String` 全部有命中；任一 0 命中即失败并输出缺失字段名。
- **红绿证据**：红 = 施工前文件不存在，七条全 0 命中；绿 = 施工后七条全命中。
- **对应测试**：待 plan Task N
- **不覆盖**：不校验这些值是否被 skill-up 真正采用（由 validate 与真跑管，TC-032 覆盖）。

### TC-004 skills[].path 写成 `.` 必须被拒或登记为缺口

- **覆盖**：`R1 / §3.2`
- **前置**：`eval.yaml` 已存在；有可用的 skill-up 二进制（`SKILL_UP_BIN` 或 PATH）。
- **步骤**：① 在临时目录复制一份：`Copy-Item -Recurse evals (Join-Path $env:TEMP 'eval-dot-path')`；② 把副本里的 `path: skills/review-triage` 改成 `path: .`（用 `[IO.File]::WriteAllText($p,$t,(New-Object Text.UTF8Encoding $false))` 写回，避免 BOM）；③ `& $env:SKILL_UP_BIN validate "$env:TEMP/eval-dot-path/review-triage/eval.yaml"`；④ `$LASTEXITCODE`；⑤ 对照：对真仓库 `& $env:SKILL_UP_BIN validate evals/review-triage/eval.yaml`。
- **预期**：③ 非 0 退出，错误信息指出技能目录不可用（找不到 `SKILL.md` 或路径无效）；④ 非 0；⑤ 真仓库版退出码 0。
- **判据**：机器——先跑 ⑤ 确认基线；再跑 ③：若非 0 且输出含路径类错误关键词（`SKILL.md` / `not found` / `path`）则通过；若 ③ 为 0（工具接受 `.` 并自行解析到别处），本条改判为「R1 的『不用 `.`』没有工具强制」，此时必须在建议表或缺口表留下登记条目，未登记则判失败。
- **红绿证据**：红 = 若 skill-up 接受 `path: .` 且改用例文件用 `.`，仓库布局一变就装错目录而无人报警；绿 = 步骤 ③ 非 0、步骤 ⑤ = 0。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 `path: ./skills/review-triage`、绝对路径等其他写法的行为（§3.2 只固定本轮取值）。
- **凭据**：validate 不需要模型凭据；无凭据时本条仍可完整执行。

### TC-005 evals 副本落进技能目录必须被结构断言检出

- **覆盖**：`R1 / §5①`
- **前置**：`evals/` 与 `skills/` 已就位。
- **步骤**：① 建临时工作副本：`$t = Join-Path $env:TEMP 'eval-skill-pollution'; New-Item -ItemType Directory $t`；② `Copy-Item -Recurse skills "$t/skills"`、`Copy-Item -Recurse evals "$t/evals"`；③ 注入：`Copy-Item -Recurse "$t/evals" "$t/skills/review-triage/evals"`；④ 在副本上跑断言 `Get-ChildItem "$t/skills" -Recurse -Directory -Filter evals`；⑤ 删除注入目录，重跑 ④。
- **预期**：④ 有输出（检出注入的 `skills/review-triage/evals`）；⑤ 无输出。
- **判据**：机器——注入后输出行数 ≥1，删除后 = 0；两次结果必须不同（证明断言对「放错位置」有判别力）。
- **红绿证据**：红 = 注入后断言仍为 0 行（说明守卫无效，R1 的边界靠人不靠机器）；绿 = 注入被检出、清理后归零。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 `npm run check` 是否能拦住（实测 `skills/skill-inspector/scripts/check.mjs` 不检查技能目录下多出的子目录，故本条用独立断言，不依赖 check）。

### TC-006 跑完 skills 下无新增目录且产物只落 .session

- **覆盖**：`R3 / §5② / §7-2`
- **前置**：`npm run eval:review-triage` 已就绪；具备模型凭据（无凭据时降级为 `SKILL_UP_BIN=... node scripts/run-eval.mjs review-triage --dry-run` 验证参数与目录形态，真跑留待有凭据环境）。
- **步骤**：① 记录基线：`@(Get-ChildItem skills -Directory).Count` 与 `Test-Path skills/review-triage-workspace`；② `$env:SKILL_UP_BIN='D:\devtools\skillup\skill-up.exe'; npm run eval:review-triage`；③ `$LASTEXITCODE`；④ 复测基线两项；⑤ `git status --porcelain skills/`；⑥ `Test-Path .session/eval-out/review-triage/report.json`；⑦ `git status --porcelain --untracked-files=all` 检查 `.session/` 之外有无新增产物。
- **预期**：③ = 0；④ 目录数与 TC-001 记录的基线相同且 `review-triage-workspace` 为 `False`；⑤ 无输出；⑥ `True`；⑦ 不出现 `.session/` 之外的评测产物路径（如 `skills/review-triage-workspace/`、仓库根 `review-triage-workspace/`）。
- **判据**：机器——③ = 0、④ 两项均符合、⑤ 输出行数 = 0、⑥ = `True`、⑦ 新增路径全部以 `.session/` 开头；五项同时成立。
- **红绿证据**：红 = 去掉 `--output-dir` 时 `skills/review-triage-workspace/` 出现（TC-007 的注入结果）；绿 = 显式改道后 `skills/` 与基线完全一致。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证产物内容是否正确（TC-027/029/036 管）。

### TC-007 runner 去掉 --output-dir 会污染 skills 目录

- **覆盖**：`R3`
- **前置**：`scripts/run-eval.mjs` 已存在。
- **步骤**：① 源码断言：`Select-String -Path scripts/run-eval.mjs -Pattern '--output-dir'`；② 确认 `--output-dir` 与 `run` 参数在同一处参数数组内（人工读该行上下文 3 行，或用 `Select-String -Context 3` 输出参数拼接段）；③ 在临时副本注入：复制 `scripts/`、`skills/review-triage/`、`evals/` 到 `$env:TEMP\eval-nodir\`，删掉该参数后跑 dry-run/真跑，观察副本是否出现 `skills/review-triage-workspace/`；④ 立即删除临时副本。
- **预期**：① 命中 ≥1 行；③ 副本中出现默认工作目录（证明「依赖默认值 = 污染 `skills/`」）；真仓库始终不承载该注入。
- **判据**：机器——① 命中 ≥1 且 ② 中参数确实出现在传给 skill-up 的命令里；③ 副本内 `Test-Path "$env:TEMP/eval-nodir/skills/review-triage-workspace"` 为 `True`（红证据成立）；真仓库 `Test-Path skills/review-triage-workspace` 为 `False`。
- **红绿证据**：红 = 删除参数后默认目录出现在副本的 `skills/` 下；绿 = 参数在位时默认目录不出现。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 skill-up 未来版本是否会改默认产物位置（本条只证明「显式传参」在当前版本不可省）。
- **凭据**：真跑需要凭据；无凭据时用 dry-run 观察命令拼接与目录落点即可。

### TC-008 check 契约不破：全绿、check-all 零改动、零依赖

- **覆盖**：`R2 / §5③ / §7-3 / §7-9`
- **前置**：本 spec 的全部改动已在工作区（含本 testcase 文件）。
- **步骤**：① `npm run check`；② `$LASTEXITCODE`；③ `git diff --stat -- scripts/check-all.mjs`；④ `git diff -- package.json`；⑤ `node -e "const p=require('./package.json');console.log(JSON.stringify(Object.keys(p.scripts)));console.log('dependencies' in p,'devDependencies' in p)"`；⑥ `Select-String -Path scripts/check-all.mjs -Pattern 'run-eval|skill-up|eval-out'`。
- **预期**：② = 0 且 stdout 含「check 全部通过」；③ 无输出；④ 只在 `scripts` 内新增 `eval:review-triage` 一行；⑤ `dependencies false`、`devDependencies false`；⑥ 0 命中。
- **判据**：机器——② = 0、③ 输出行数 = 0、④ 差异仅限一条 script、⑤ 两个布尔均为 `false`、⑥ 命中数 = 0；五项同时成立。
- **红绿证据**：红 = 把 `node scripts/run-eval.mjs` 写进 `check` 脚本或 import 进 `check-all.mjs`，则 ⑥ 命中且 ⑤ 出现依赖；绿 = 独立 script + 零引用。
- **对应测试**：待 plan Task N
- **不覆盖**：不评估 `npm run check` 的既有检查项本身是否充分（那是 check-all 的职责）。

### TC-009 剥离 skill-up 后 check 仍须全绿

- **覆盖**：`R2`
- **前置**：同 TC-008。
- **步骤**：① `$env:SKILL_UP_BIN=''`；② `$env:PATH=(($env:PATH -split ';' | Where-Object { $_ -notmatch 'skillup|skill-up' }) -join ';')`；③ `npm run check`；④ `$LASTEXITCODE`；⑤ `$out | Select-String -Pattern 'eval|skill-up'`（把 ③ 的 stdout 收集成 `$out` 后扫描）。
- **预期**：④ = 0；⑤ 0 命中；`check` 全程不启动任何外部二进制。
- **判据**：机器——④ = 0 且 ⑤ 命中数 = 0；任一条不成立即失败（说明评测已渗进 check）。
- **红绿证据**：红 = check 因找不到 skill-up 而失败或打印 eval 相关输出；绿 = 无二进制环境下 check 仍全绿且输出与 TC-008 一致。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证运行时长阈值（`check` 与评测不混跑即可，spec 未定耗时指标）。

### TC-010 删掉产物目录后重跑自建且结论一致

- **覆盖**：`R3 / §5⑧ / §7-2`
- **前置**：已完成一次完整评测（TC-006 通过）；具备模型凭据（无凭据时降级：删除目录后跑 `--dry-run`，断言目录被自建且命令可执行，结论一致性留待有凭据环境）。
- **步骤**：① 保存首轮 `report.json` 与 `benchmark.md` 的副本（复制到 `$env:TEMP`）；② `Remove-Item -Recurse -Force .session/eval-out -ErrorAction SilentlyContinue`；③ `Test-Path .session/eval-out`（期望 `False`）；④ `npm run eval:review-triage`；⑤ `Test-Path .session/eval-out/review-triage/report.json`；⑥ 对比两轮 `report.json` 中每条用例的 case 级结论与 `benchmark.md` 的 Delta 数值。
- **预期**：③ `False`；④ 退出 0（不得因目录不存在而失败）；⑤ `True`；⑥ 两次 case 级结论一致、Delta 符号一致（数值允许因模型抖动变化，但结论方向不得反转；若反转则转 TC-028 的 flaky 流程）。
- **判据**：机器——③ `False`、④ = 0、⑤ `True`、⑥ 逐条比对结果一致；四项同时成立。
- **红绿证据**：红 = runner 要求人工先建 `.session/eval-out/` 或依赖首轮残留 fixture；绿 = 删除后重跑自动重建且结论一致。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 `/tmp` 等其他平台路径；不验证并发重跑。

### TC-011 must_not_contain 不得含分档标题

- **覆盖**：`R4-② / §5⑤`
- **前置**：`evals/review-triage/cases/` 下两条例已就位。
- **步骤**：① 用一个解析脚本按缩进读出每条用例的 `must_not_contain` 列表：`node -e "const fs=require('node:fs');const d='evals/review-triage/cases';for(const f of fs.readdirSync(d)){const t=fs.readFileSync(d+'/'+f,'utf8');const b=(t.match(/must_not_contain:\s*\r?\n((?:\s*-\s*.+\r?\n)+)/)||[])[1]||'';console.log(f+' :: '+b.trim().replace(/\r?\n/g,' , '))}"`；② 把输出与分档标题集合比对：`必须 review`、`可直接提交`、`不提交`。
- **预期**：两条例的 `must_not_contain` 均不含上述三个标题中的任何一个（正确答案本身会打印空档标题，如「必须 review：无」）。
- **判据**：机器——② 比对结果 0 命中；任一命中即失败并打印文件名与命中词。
- **红绿证据**：红 = 把 `必须 review` 写进 01 的 `must_not_contain`，历史正确答案被判失败（TC-013）；绿 = 两条例均 0 命中。
- **对应测试**：待 plan Task N
- **不覆盖**：不判断 `must_not_contain` 的具体词是否选得好（TC-012/018 管）。

### TC-012 每条用例断言双面且为理由级词

- **覆盖**：`R4-①③ / §3.4 / §5⑤`
- **前置**：两条例已就位。
- **步骤**：① 断言每条用例 `expect.must_contain` 列表非空；② 断言每条用例 `expect.must_not_contain` 列表非空；③ 断言每条用例 `judge.success[].output_contains` 的 `all` 或 `any` 中至少有一个属于「理由级词表」：`机器判不了`、`语义迁移`、`执行动作`、`字面核对`、`diff`、`diff 原文`、`字面`；④ 断言 `must_contain` / `must_not_contain` 中不出现「仅结论词」的情况（结论词 = `必须 review`、`可直接提交`、`不提交`）。
- **预期**：四条全部成立；02 的 `any` 至少含 `机器判不了`/`语义迁移`/`执行动作` 中一个，01 的 `any` 至少含 `字面核对`/`diff` 中一个。
- **判据**：机器——四条断言全过；任一不过即失败，并列出哪条用例缺哪一类词。
- **红绿证据**：红 = 只有 `must_contain: [必须 review]`、`must_not_contain: [可直接提交]`（结论词互斥），对「结论对理由错」完全无判别力（TC-014）；绿 = 双面 + 理由级词同时具备。
- **对应测试**：待 plan Task N
- **不覆盖**：不判断理由级词是否覆盖了该用例的全部错误推理路径（见第 7 节缺口）。

### TC-013 分档标题写进 must_not_contain 会误杀正确答案

- **覆盖**：`R4-② / §5⑤`
- **前置**：历史样本 `.session/eval-trial/out2/iteration-2/01-checkbox-mechanical/with_skill/outputs/response.md` 存在。
- **步骤**：① `$t = Get-Content -Raw -Encoding UTF8 '.session/eval-trial/out2/iteration-2/01-checkbox-mechanical/with_skill/outputs/response.md'`；② `$t -match '可直接提交'`；③ `$t -match '字面核对|diff'`；④ `$t -match '必须 review'`。
- **预期**：② `True`、③ `True`、④ `True`——该回复是正确答案（判了可直接提交并给了 diff 字面核对），但它同时打印了「必须 review：无」这一空档标题。
- **判据**：机器——④ 必须为 `True`；据此推出「若 `must_not_contain` 含 `必须 review`，该正确答案必然被判 FAIL」，因此用例文件不得含该词（与 TC-011 互为印证）。
- **红绿证据**：红 = 在副本用例里加入该禁词后跑，历史正确答案被误杀（must_not_contain 红）；绿 = 移除后 PASS。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证其他分档标题（`不提交`）的真实回复形态；`不提交` 的空档写法未在历史样本中出现，按同一判据处理。

### TC-014 只留结论词会放过结论对理由错的回复

- **覆盖**：`R4-①③ / §7-4`
- **前置**：无（纯离线判定）。
- **步骤**：① 构造假回复 `$fake = '必须 review。该文件 200 行，改动太大，建议人工看一眼。'`；② `$fake -match '必须 review'`；③ `$fake -match '机器判不了|语义迁移|执行动作'`；④ 对照：读 `.session/eval-trial/out/iteration-1/02-command-swap-semantic/without_skill/outputs/response.md`，确认其中不含 `必须 review`（属另一种错误形态，由 `must_contain` 拦截）。
- **预期**：② `True`、③ `False` → 该假回复虽结论正确，但理由是「文件大」，属错误推理；用例 02 的理由级词会把它判 FAIL（正确拦截）。
- **判据**：机器——② `True` 且 ③ `False`；若把用例 02 的 `any` 理由词删掉（仅留 `must_contain`），同一假回复会 PASS → 该用例判不合格。
- **红绿证据**：红 = 仅结论词的用例放过 `$fake`（假阴性样例）；绿 = 含理由级词后 `$fake` 被 FAIL。
- **对应测试**：待 plan Task N
- **不覆盖**：不判断 `$fake` 之外的错误理由表达（见第 7 节缺口第 5 条：错误结论可能复用正确词表里的词）。

### TC-015 假阳性样例：历史正确答案必须 PASS

- **覆盖**：`R4 / §7-4`
- **前置**：历史样本 `.session/eval-trial/out2/iteration-2/01-checkbox-mechanical/with_skill/outputs/response.md` 与 `.session/eval-trial/out3/iteration-3/01-checkbox-mechanical/with_skill/outputs/response.md` 存在。
- **步骤**：① 读 with_skill 回复；② 按 01 的 `expect.must_contain` 检查 `可直接提交`；③ 按 `must_not_contain` 检查 `低风险`、`纯文档`、`不涉及代码`、`不影响代码`；④ 按 `judge.success` 检查 `字面核对|diff`；⑤ 对 out3 的同名样本重复 ①–④。
- **预期**：两份样本的 ②③④ 全部满足（②命中、③0 命中、④命中）→ 断言判 PASS，不误杀合理答案。
- **判据**：机器——两份样本的四个检查全过；任一样本被误杀即判断言过严（假阳性）。
- **红绿证据**：红 = 把证据词写成 `git diff` 字面，out2 样本被判 FAIL（TC-017 的红证据）；绿 = 使用 `字面核对|diff` 的 any 组后两份均 PASS。
- **对应测试**：待 plan Task N
- **不覆盖**：不判断该样本的证据是否来自实跑（它在回复里自陈「基于改动清单里提供的 diff 原文」，这一层机器判不了，见第 5 节与第 7 节）。

### TC-016 假阴性样例：历史错误答案必须 FAIL

- **覆盖**：`R4 / §7-4`
- **前置**：`.session/eval-trial/out2/iteration-2/01-checkbox-mechanical/without_skill/outputs/response.md` 存在。
- **步骤**：① 读 without_skill 回复；② 检查 `可直接提交`；③ 检查禁词 `低风险`、`纯文档`、`不涉及代码`、`不影响代码`；④ 检查 `字面核对|diff`。
- **预期**：② 不命中（回复写的是「可随本次提交一起走」）、③ 命中 `纯文档` 与 `低风险`、④ 不命中 → 断言判 FAIL（正确识别为错误推理）。
- **判据**：机器——②④ 均为 `False` 且 ③ 至少命中 1 个禁词；若该样本被判 PASS，则断言过松（假阴性）。
- **红绿证据**：红 = 删掉禁词表后该样本 PASS；绿 = 保留禁词后 FAIL（历史实测：`out3/iteration-2/benchmark.md` 记录 `output contains forbidden keyword "纯文档"`）。
- **对应测试**：待 plan Task N
- **不覆盖**：不判断其他错误形态（如「语义等价」）是否被禁词覆盖。

### TC-017 证据词不得死抠命令全名

- **覆盖**：`R4 / §7-4`
- **前置**：`.session/eval-trial/out/iteration-1/benchmark.md` 与 `.session/eval-trial/out2/iteration-2/01-checkbox-mechanical/with_skill/outputs/response.md` 存在。
- **步骤**：① 读 `out/iteration-1/benchmark.md` 中 01 with_skill 的失败项；② 读 out2 的 with_skill 回复，确认其证据表述为「diff 字面核对」；③ 用两种断言分别跑 out2 样本：严格版 `-match 'git diff'`、宽松版 `-match '字面核对|diff'`。
- **预期**：① 失败项写明 `missing [git diff]`（历史证据）；③ 严格版 `False`（误杀）、宽松版 `True`（正确放行）。
- **判据**：机器——严格版为 `False` 且宽松版为 `True`，两者必须不同；用例若使用严格版即判不合格。
- **红绿证据**：红 = 历史模型写「diff 字面核对」而断言要 `git diff` 全名 → 2/3（2 项过 1 项挂）；绿 = 改为语义等价词集合后 3/3。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证「diff 原文」「字面核对」之外的同义表达（新增表达须同步更新词表）。

### TC-018 禁令词出现在否定句会误杀

- **覆盖**：`R4-①`
- **前置**：无（纯离线判定）。
- **步骤**：① 构造 `$fake = '这不是低风险，而是无风险：git diff 字面核对只含一行状态位变化，判据完全机械可执行。'`；② 对该样本跑 01 的 `must_not_contain`（含 `低风险`）；③ 检查 `must_contain`（`可直接提交`）与证据词（`字面核对|diff`）。
- **预期**：③ 命中（分档与证据都对），② 因「低风险」命中而判 FAIL（误杀）。该回复在语义上是正确答案。
- **判据**：机器——② 命中 `低风险`、③ 命中；结论侧必须满足其一：用例提供否定语境豁免规则（如排除 `不是低风险`、`不等于低风险`），或在第 7 节缺口表登记该误杀并交由人工复核。两者都没有 → 本条判「用例不合格」。
- **红绿证据**：红 = 当前禁词表下该正确答案被 FAIL；绿 = 加豁免或换词后 PASS（同时保留 TC-016 的拦截力，即 `纯文档` 仍命中历史错误答案）。
- **对应测试**：待 plan Task N
- **不覆盖**：不要求穷举否定句式（模板：「不是 X」「并非 X」「不等于 X」「X 不是判据」）。

### TC-019 prompt 只给输入不给答案

- **覆盖**：`§3.4`
- **前置**：两条例已就位。
- **步骤**：① 提取每条用例的 `input.prompt` 文本块；② 扫描答案词：`必须 review`、`可直接提交`、`不提交`、`无风险`、`免审`、`该走哪档`；③ 扫描施工性指令：`请按第`、`分档规则见`、`判据是`；④ 确认 prompt 必含「改动内容」与「只分流，不要审查内容」这类任务约束。
- **预期**：②③ 均 0 命中；④ 命中。
- **判据**：机器——②③ 命中数 = 0 且 ④ ≥1；任一条不成立即失败（prompt 暗示档位等于把答案喂给模型，差值失去意义）。
- **红绿证据**：红 = prompt 写「这个改动应该可以直接提交，请确认」→ ② 命中；绿 = 只给改动清单与输出格式要求。
- **对应测试**：待 plan Task N
- **不覆盖**：不判断 prompt 的语义是否存在间接暗示（如改动类型本身就极像某一档，那是用例设计选择，不属本条）。

### TC-020 fixture 仓库与补丁就位

- **覆盖**：`R5 / §3.1`
- **前置**：施工步骤 1 已完成。
- **步骤**：① `Test-Path evals/review-triage/fixtures/repos/checkbox-demo/notes/plan.md`；② `Test-Path evals/review-triage/fixtures/diffs/checkbox.patch`；③ `Get-Content -Raw -Encoding UTF8 evals/review-triage/fixtures/repos/checkbox-demo/notes/plan.md`；④ 与补丁中的 `-` 行逐字比对。
- **预期**：①② `True`；③ 含 `- [ ] 补齐 collect 的覆盖率口径`；④ 补丁删除行与 ③ 的该行逐字一致（含行尾空白差异必须为 0）。
- **判据**：机器——①② 为 `True` 且 ④ 比对相等；任一不等即失败（fixture 与补丁不对齐会让 `git apply` 直接失败）。
- **红绿证据**：红 = 施工前两个路径均不存在；绿 = 路径就位且逐字一致。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 fixture 是否包含该文件的其它无关内容（§3.1 要求只放用到的素材，由人工看目录体积）。

### TC-021 fixture 上 git diff 真有输出且只含一行翻转

- **覆盖**：`R5 / §7-5`
- **前置**：TC-020 通过。
- **步骤**：① `$t = Join-Path $env:TEMP 'cb-fixture'; Remove-Item -Recurse -Force $t -ErrorAction SilentlyContinue`；② `Copy-Item -Recurse evals/review-triage/fixtures/repos/checkbox-demo $t`；③ `git -C $t init`；④ `git -C $t add -A`；⑤ `git -C $t -c user.email=t@example.invalid -c user.name=t commit -m base`；⑥ `git -C $t apply --check (Resolve-Path evals/review-triage/fixtures/diffs/checkbox.patch)`；⑦ `git -C $t apply (Resolve-Path evals/review-triage/fixtures/diffs/checkbox.patch)`；⑧ `git -C $t diff --stat`；⑨ `git -C $t diff`。
- **预期**：⑥ 退出 0；⑧ 输出 `1 file changed, 1 insertion(+), 1 deletion(-)`；⑨ 只含 `- [ ] ...` 与 `+ [x] ...` 两行，无其它文件、无其它行。
- **判据**：机器——⑥ = 0、⑧ 含 `1 file changed`、⑨ 增删行数各为 1 且内容只有勾选位翻转；三项同时成立。
- **红绿证据**：红 = 无 fixture 时只能贴 prompt 里的 diff（`.session/eval-trial/out/iteration-1` 的原始 01 就是这种形态，技能按硬约束判必审）；绿 = 真仓库上 `git diff` 有输出。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 skill-up 是否按 `context.repo_fixture` 真的把仓库挂给模型（TC-023 从行为侧验证）。
- **说明**：③⑤⑦ 的 git 写操作只发生在 `$env:TEMP` 下的测试 fixture，不涉及本仓库历史。

### TC-022 缺 repo_fixture/git.init/apply_diff 的用例不合格

- **覆盖**：`R5 / §3.4`
- **前置**：两条例已就位。
- **步骤**：① `Select-String -Path evals/review-triage/cases/01-checkbox-mechanical.yaml -Pattern 'repo_fixture|git:|init:|apply_diff'`；② 逐项确认 `repo_fixture`、`git.init`、`apply_diff` 三类配置各出现 ≥1 次；③ 对 02 做同样扫描并记录结论（02 是「执行动作替换」，不要求实跑证据，允许无 fixture）。
- **预期**：01 三类配置齐全；02 允许缺，但须在用例内写清「本用例不要求实跑」的理由（避免读者误以为漏配）。
- **判据**：机器——01 三类各 ≥1 命中；缺任一即判用例不合格（等于退回「prompt 粘贴 diff」）。02 的缺省须有文字说明，`Select-String -Pattern '不要求实跑|无需实跑'` ≥1。
- **红绿证据**：红 = 01 只有 prompt 里的 diff 代码块，无 fixture 配置；绿 = 三类配置齐全。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证字段名拼写是否与 skill-up 版本匹配（以 validate 通过为准，TC-032 覆盖）。

### TC-023 空目录跑用例 01 会误判必须 review，结论不成立

- **覆盖**：`R5 / §3.5`
- **前置**：具备模型凭据（无凭据时本条降级为「只核对用例 fixture 配置存在」，行为侧留待有凭据环境）。
- **步骤**：① 在临时副本复制 `evals/` 与 `skills/review-triage/`；② 删除用例 01 中 `context.repo_fixture` 与 `git.init`、`apply_diff` 三项（故障注入）；③ `npm run` 等价命令：`& $env:SKILL_UP_BIN run "$env:TEMP/eval-nofixture/review-triage/eval.yaml" --output-dir "$env:TEMP/eval-nofixture/out" --iteration 2 --baseline`；④ 读 `with_skill` 回复；⑤ 核对结论文件有没有把它写成「技能缺陷」。
- **预期**：④ 回复判「必须 review」（技能忠于「免审必须报命令名 + 实跑结果」的硬约束，空目录下拿不到实跑结果）；⑤ 结论必须记「用例环境不成立/用例无效」，不得写「技能对 01 无效」。
- **判据**：机器+人工——机器检查 ④ 输出含 `必须 review` 且结论文本含「无效」或「环境不成立」；人工确认结论没有归因到技能。若 ④ 未出现 `必须 review`，则说明技能对空环境的行为已变，本条判「需重新取基线」（不得直接判技能好坏）。
- **红绿证据**：红 = 去掉 fixture 后装技能反而判必审（这就是 R5 的实测依据）；绿 = 带 fixture 时按 R10 预期判可直接提交（TC-015/021）。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证其他技能的同类环境依赖（R8 限定本轮只测 review-triage）。

### TC-024 补丁必须是 LF 且无 BOM

- **覆盖**：`R5 / §5⑧`
- **前置**：`evals/review-triage/fixtures/diffs/checkbox.patch` 存在。
- **步骤**：① `$p = (Resolve-Path evals/review-triage/fixtures/diffs/checkbox.patch).Path`；② `$b = [IO.File]::ReadAllBytes($p)`；③ `($b[0] -eq 0xEF -and $b[1] -eq 0xBB -and $b[2] -eq 0xBF)`；④ `([IO.File]::ReadAllText($p)).Contains([string][char]13 + [char]10)`（换行符检测）；⑤ 对 fixture 内的 `notes/plan.md` 重复 ②–④。
- **预期**：③ `False`、④ `False`；`plan.md` 同样 LF 且无 BOM。
- **判据**：机器——两文件 ③④ 均为 `False` 且 TC-021 的 `git apply --check` 退出 0；任一条不成立即失败。
- **红绿证据**：红 = 用 PowerShell `Set-Content -Encoding UTF8` 生成补丁 → BOM + CRLF，`git apply` 报错；绿 = `[IO.File]::WriteAllText(..., (New-Object Text.UTF8Encoding $false))` 写入后 apply 通过。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 `notes/plan.md` 之外的其他 fixture 文件编码（新增 fixture 时按同一断言扩展）。

### TC-025 补丁路径分隔符必须是正斜杠

- **覆盖**：`R5`
- **前置**：补丁存在。
- **步骤**：① `Select-String -Path evals/review-triage/fixtures/diffs/checkbox.patch -Pattern '^(---|\+\+\+) '`；② 检查两条头行是否分别为 `--- a/notes/plan.md`、`+++ b/notes/plan.md`；③ `Select-String -Path evals/review-triage/fixtures/diffs/checkbox.patch -Pattern '^(---|\+\+\+) .*\\'`。
- **预期**：② 两条头行都用 `/`；③ 0 命中（无 `a\notes\plan.md` 这类 Windows 分隔符）。
- **判据**：机器——② 逐字匹配且 ③ 命中数 = 0。
- **红绿证据**：红 = 用 `\` 生成补丁，`git apply` 在 Git for Windows 下报 `No such file`；绿 = `/` 分隔时 apply 通过。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证文件名含空格或中文的边界（本轮 fixture 不涉及，扩用例时再补）。

### TC-026 迭代次数默认 2 且拒绝小于 2

- **覆盖**：`R6 / §3.3-2`
- **前置**：`scripts/run-eval.mjs` 已存在；有 skill-up 二进制（stub 亦可，见 TC-034）。
- **步骤**：① `node scripts/run-eval.mjs review-triage --iteration 1`；② `$LASTEXITCODE`；③ `node scripts/run-eval.mjs review-triage --dry-run`；④ 在 ③ 的输出里检索 `--iteration` 与数值；⑤ 真跑后 `node -e "const r=require('./.session/eval-out/review-triage/report.json');console.log(JSON.stringify(Object.keys(r)))"` 确认每个 configuration 的 runs 长度。
- **预期**：② 非 0，且提示迭代次数须 ≥2（不得静默改成 2 后继续跑）；④ 默认值为 2；⑤ runs 长度 = 2。
- **判据**：机器——② 非 0 且输出含「2」与「iteration」（或中文「迭代」）；④ 解析出 `--iteration 2`；⑤ 长度 = 2。三项同时成立。
- **红绿证据**：红 = `--iteration 1` 被接受并跑完（单次结果被当成门禁）；绿 = 拒绝并给最小次数。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证大于 2 的迭代是否被接受（应接受，属 skill-up 行为，可用干跑观察参数而非判据）。

### TC-027 runner 每条用例打印 flaky 判定

- **覆盖**：`R6 / §3.3-4 / §5⑥`
- **前置**：已完成一次 `--iteration 2` 的真跑（无凭据时降级为 dry-run，只验 stdout 格式，真跑留待有凭据环境）。
- **步骤**：① 收集 runner stdout 到变量 `$out`；② 逐行检查是否含每条用例 ID（`01-checkbox-mechanical`、`02-command-swap-semantic`）；③ 检查每行是否有明确的 flaky 结论（`flaky: 是` / `flaky: 否` 或等价中文）；④ 检查是否打印迭代次数。
- **预期**：两条例各有一行 flaky 判定；迭代次数被打印。
- **判据**：机器——用例 ID 出现次数 ≥2、flaky 判定行 ≥2、迭代次数行 ≥1；任一不成立即失败（缺 flaky 行等于把抖动藏起来）。
- **红绿证据**：红 = stdout 只有退出码与「完成」，无 flaky 行；绿 = 每条用例一行判定。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 flaky 的算法（spec §3.3 规定 runner 不做判分，flaky 来自 skill-up 报告，runner 只负责打印）。

### TC-028 出现 flaky 时结论必须为无效

- **覆盖**：`R6 / §5⑥ / §7-6`
- **前置**：存在历史 flaky 证据：`.session/eval-trial/out/iteration-1/benchmark.md` 中 01 with_skill 为 `67% (2/3)`，而 `.session/eval-trial/out2/iteration-1/benchmark.md` 中同一用例为 `100% (3/3)`。
- **步骤**：① 读两份 benchmark，确认同一用例两次试跑的 case 级结论不同（一 FAIL 一 PASS）；② 用该证据核对结论文件是否写「无效」；③ 检查结论是否引用了两次的分母分子。④ 若本轮实测出现 flaky，按同一判据检查结论。
- **预期**：结论必须写「该用例本轮结论无效，先改用例」，并列出两次不一致的具体数值；不得写「技能对 01 有效」。
- **判据**：机器+人工——机器检查结论文本含「无效」且含 `2/3`、`3/3`（或本轮等价数值）；人工确认没有把 flaky 结果当门禁。缺任一即失败。
- **红绿证据**：红 = 拿 2/3 那一次直接下结论「技能对勾选用例有效」；绿 = 标注无效并停在这一步。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证「改用例」之后的重跑（那会产生新的运行记录，按 TC-039 对账）。

### TC-029 baseline 必开且报告含 With/Without/Delta

- **覆盖**：`R7 / §3.3-2`
- **前置**：`eval.yaml` 与 runner 已就位；至少完成一次 dry-run（真跑需凭据）。
- **步骤**：① `Select-String -Path evals/review-triage/eval.yaml -Pattern 'enabled:\s*true'`（benchmark 段）；② `Select-String -Path scripts/run-eval.mjs -Pattern '--baseline'`；③ 真跑后 `Select-String -Path .session/eval-out/review-triage/benchmark.md -Pattern 'With Skill|Without Skill|Delta'`；④ 确认 Delta 列有数值而非空。
- **预期**：①② ≥1 命中；③ 三个表头各 ≥1 命中；④ Delta 行为 `+0.xx` 形式。
- **判据**：机器——①②③④ 全部成立；缺 Delta 即失败（绝对通过率不能替代差值）。
- **红绿证据**：红 = 去掉 `--baseline`，benchmark 只剩一列通过率、无 Delta；绿 = 三列齐全且 Delta 有值。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 Delta 的统计显著性（spec 未定义阈值）。

### TC-030 关掉 baseline 后无差值，判不合格

- **覆盖**：`R7`
- **前置**：TC-029 通过。
- **步骤**：① 临时副本复制 `evals/`；② 把 `benchmark.enabled` 改为 `false`（或从 runner 副本删 `--baseline`）；③ 在副本上跑（无凭据时只做配置解析）；④ 检查副本报告是否含 `Without Skill` 与 `Delta`；⑤ 删除副本。
- **预期**：④ 两列缺失或为空；据此刻意断言「baseline 不可关」。
- **判据**：机器——④ `Select-String -Pattern 'Without Skill|Delta'` 在副本报告上命中数 = 0（红证据成立）；真仓库配置未改动（`git diff -- evals/review-triage/eval.yaml` 为空）。
- **红绿证据**：红 = 关闭 baseline 的副本报告无 Delta；绿 = 开启后 Delta 存在。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证关闭 baseline 时工具是否报错（只要没有差值即判不合格）。

### TC-031 报告计数口径：runs 与期望项数不得混用

- **覆盖**：`R6 / §3.3-4 / R10`
- **前置**：至少一次 `--iteration 2` 的运行记录。
- **步骤**：① 打开 `.session/eval-out/review-triage/benchmark.md`，记录 `(N runs each per configuration)` 的 N；② 记录 `Pass Rate x% (a/b)` 的 a/b；③ 打开 `report.json`，取同一用例同一 configuration 的 runs 数组长度；④ 核对 ① 与 ③ 是否相等；⑤ 核对结论中 `2/2` 这类写法的分母是否等于 ③（而不是 b）。
- **预期**：① = ③（都是迭代次数 2）；② 的 b 是期望项数（历史为 3），与迭代次数无关；⑤ 结论的分母必须是 ③。
- **判据**：机器——①=③ 且 ⑤ 的分母 = ③；若结论用 `3/3` 冒充 R10 的 `2/2`，判不合格并输出两处数值。
- **红绿证据**：红 = 用历史 benchmark（`1 runs each` 与 `100% (3/3)` 并存）直接宣称「2/2 达标」；绿 = 按 run 级结论对账。
- **对应测试**：待 plan Task N
- **不覆盖**：不改变 skill-up 的报告格式（只约束我们的对账口径）。

### TC-032 SKILL_UP_BIN 优先且 dry-run 走通

- **覆盖**：`§3.3-1 / §7-8`
- **前置**：`scripts/run-eval.mjs` 与 `evals/review-triage/` 已就位；本机有 skill-up 二进制。
- **步骤**：① `$env:SKILL_UP_BIN='D:\devtools\skillup\skill-up.exe'`；② `& $env:SKILL_UP_BIN validate evals/review-triage/eval.yaml`；③ `$LASTEXITCODE`；④ `node scripts/run-eval.mjs review-triage --dry-run`；⑤ `$LASTEXITCODE`；⑥ 在 ④ 的输出里确认调用的是 `SKILL_UP_BIN` 指向的路径（如打印命令行则直接看路径）。
- **预期**：③ = 0、⑤ = 0；④ 输出含 dry-run 标识与实际二进制路径；不出现「未找到 skill-up」。
- **判据**：机器——③⑤ = 0 且 ⑥ 路径与 `SKILL_UP_BIN` 一致。
- **红绿证据**：红 = runner 忽略环境变量、只查 PATH，导致自定义路径不可用；绿 = 优先取环境变量。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 PATH 回退（TC-033 覆盖「都没有」的失败路径）。
- **凭据**：validate 与 dry-run 均不需要模型凭据。

### TC-033 二进制找不到必须非 0 退出并给安装指引

- **覆盖**：`§3.3-1 / §7-7`
- **前置**：`scripts/run-eval.mjs` 已存在。
- **步骤**：① `$env:SKILL_UP_BIN='C:\definitely-missing\skill-up.exe'`；② `$env:PATH=(($env:PATH -split ';' | Where-Object { $_ -notmatch 'skillup|skill-up' }) -join ';')`；③ 把 runner 输出收集到 `$out`（`$out = node scripts/run-eval.mjs review-triage --dry-run 2>&1`）；④ `$LASTEXITCODE`；⑤ `Test-Path .session/eval-out/review-triage`。
- **预期**：④ 非 0；`$out` 含安装指引（`SKILL_UP_BIN`、安装来源或 `skill-up` 安装命令）；不含 `skip`、`skipped`、「跳过」、「通过」这类「没跑也像通过」的词；⑤ `False`（不得留下空产物目录冒充已跑）。
- **判据**：机器——④ 非 0、`$out` 含安装指引、`$out` 不含跳过类词、⑤ 为 `False`；四项同时成立；任一条不成立即失败（静默跳过会让「没跑」看起来像「通过」）。
- **红绿证据**：红 = 找不到二进制时打印「skipped」并退出 0；绿 = 非 0 + 指引 + 无产物。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证安装指引的具体文案（只要求含变量名与获取方式）。

### TC-034 skill-up 非 0 时退出码必须透传

- **覆盖**：`§3.3-3`
- **前置**：Windows 可写 `$env:TEMP`；`scripts/run-eval.mjs` 已存在。
- **步骤**：① 建桩：`$stub = Join-Path $env:TEMP 'skill-up-stub.cmd'`，内容用 `$text = (@('@echo off','echo fake failure 1>&2','exit /b 3','') -join [Environment]::NewLine)` 组装，再以 `[IO.File]::WriteAllText($stub, $text, (New-Object Text.UTF8Encoding $false))` 写入；② `$env:SKILL_UP_BIN=$stub`；③ `node scripts/run-eval.mjs review-triage --dry-run`；④ `$LASTEXITCODE`；⑤ 用同样方式建一个 `exit /b 0` 的桩再跑一次，确认退出码 = 0。
- **预期**：④ = 3（透传，不被压成 0 或 1）；⑤ 为 0（不误报失败）。
- **判据**：机器——两次退出码分别严格等于 3 与 0；不等即失败。
- **红绿证据**：红 = runner 用布尔代替退出码，桩返回 3 时 runner 返回 1（未来接 CI 时丢失信号）；绿 = 原样透传。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 Windows 之外的 shell 桩（本轮只承诺 Windows + PowerShell）。

### TC-035 非 0 不得解释成技能坏了

- **覆盖**：`§3.3-3`
- **前置**：TC-034 的失败桩可用。
- **步骤**：① `$env:SKILL_UP_BIN=$stub`（返回 3）；② `$out = node scripts/run-eval.mjs review-triage --dry-run 2>&1`；③ `$out -match 'flaky'`；④ `$out -match '技能无效|技能坏了|skill broken|skill ineffective'`。
- **预期**：③ `True`（必须同时打印 flaky 判定）；④ `False`（不得下结论说技能坏了）。
- **判据**：机器——③ `True` 且 ④ `False`；任一条不成立即失败。
- **红绿证据**：红 = runner 打印「skill failed」并不给 flaky 信息；绿 = 只报运行失败 + flaky 判定。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证人工如何解释该失败（结论文本的语义判断见第 5 节）。

### TC-036 stdout、报告、送审说明三处都带引擎与模型

- **覆盖**：`R9 / §5⑦ / §7-8`
- **前置**：至少一次 dry-run 与一次真跑（真跑需凭据；无凭据时只验 stdout 与 dry-run 报告字段，真跑报告字段留待有凭据环境）。
- **步骤**：① `$out = node scripts/run-eval.mjs review-triage --dry-run 2>&1`；② `$out -match 'engine|引擎'`；③ `$out -match 'model|模型'`；④ `Select-String -Path .session/eval-out/review-triage/report.json -Pattern 'engine|model'`；⑤ 检查送审说明（`docs/` 下的送审/对账文件）是否含引擎名与实际模型名两行。
- **预期**：②③ 均 `True`；④ 命中 ≥1；⑤ 两行都在，模型名不是空串、不是 `unknown`。
- **判据**：机器——②③④⑤ 全部成立；任一处缺模型名即失败（结论边界丢失）。
- **红绿证据**：红 = 只有引擎名、无模型名，读者无法复现组合；绿 = 三处一致。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证模型名是否与真实后端一致（转发层可能改写，见 TC-037 与第 5 节）。

### TC-037 CCR 转发时不得把结论写成对 Claude 成立

- **覆盖**：`R9`
- **前置**：已知事实：本轮经 CCR 转发时实际模型为 GLM-5.3-Flash，不是 Claude。
- **步骤**：① 读报告中的实际模型名 `$m`；② 扫描结论与送审说明里的 `Claude` 字样；③ 判定：若 `$m` 不以 `claude` 开头，而结论出现「Claude 也这样」「对 Claude 成立」这类把结论外推到 Claude 的句子，则判不合格；④ 构造反例文本做一次扫描自检：`$bad = '该结论对 Claude 也成立。'`，确认扫描能命中。
- **预期**：④ 扫描命中（说明检查项有效）；实际结论在该条件下 0 命中。
- **判据**：机器——④ 命中 ≥1 且实际结论 0 命中；两者同时成立。
- **红绿证据**：红 = 报告模型为 GLM 但结论写「Claude 也这样」；绿 = 结论只对「claude_code + GLM-5.3-Flash」这一组合成立。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证模型名在各转发层的传递准确性（只能验报告字段非空，见第 7 节缺口）。

### TC-038 无凭据时降级 validate 与 dry-run，不得判技能失败

- **覆盖**：`§7 执行环境`
- **前置**：可临时清空凭据变量（变量名以 CCR/引擎实际读取的为准，至少含 API key 类变量）。
- **步骤**：① 记录当前相关凭据变量名（不记录值）：`Get-ChildItem Env: | Where-Object { $_.Name -match 'API_KEY|AUTH_TOKEN|ANTHROPIC|OPENAI|CCR' } | Select-Object -ExpandProperty Name`；② 在同名变量上置空；③ `& $env:SKILL_UP_BIN validate evals/review-triage/eval.yaml`；④ `$LASTEXITCODE`；⑤ `node scripts/run-eval.mjs review-triage --dry-run`；⑥ `$LASTEXITCODE`；⑦ `$out = node scripts/run-eval.mjs review-triage 2>&1`；⑧ `$LASTEXITCODE`；⑨ 检查 ⑦ 的错误文本是否指向凭据/认证。
- **预期**：④ = 0、⑥ = 0；⑧ 非 0 且 ⑨ 命中 `auth|credential|token|401|API key`；结论文件不得把这次失败写成「技能无效」。
- **判据**：机器+人工——④⑥ = 0、⑧ 非 0、⑨ 命中；人工确认结论没有归因到技能。若 ⑧ 返回 0（凭据被缓存或另有来源），记录实际情况并改由「有凭据环境」重跑，本条不得判技能好坏。
- **红绿证据**：红 = 无凭据时 runner 直接判用例 FAIL 并写「技能无效」；绿 = 明确区分「环境不可用」与「技能无效」。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证凭据变量的具体名称清单（随引擎/转发层变化，以实际环境为准）。

### TC-039 R10 预期值必须早于运行写死并逐条对账

- **覆盖**：`R10 / §5④`
- **前置**：`evals/` 已就位；存在对账文件（送审说明或独立对账表）。
- **步骤**：① 在对账文件里检索四组事前预期值：用例 02「装技能 ≥2/2、不装 ≤1/2」、用例 01「装技能 2/2 且理由含 `diff` 或 `字面核对`、不装 ≥1/2 出现禁词」；② 与 spec R10 的数值逐字比对；③ 比较对账文件最后修改时间与 `report.json` 生成时间；④ 用 TC-031 的口径把实测值填进对账表（run 级）。
- **预期**：① 四组齐全；② 与 R10 完全一致（不得出现「观察后补写」的放宽值）；③ 对账文件 mtime 早于报告生成时间；④ 实测值按 run 级填写，每格都能回指 report.json 的具体字段。
- **判据**：机器——①②③④ 全部成立；② 出现数值不一致、③ 顺序颠倒、④ 口径混用，任一即失败。
- **红绿证据**：红 = 跑完才写「预期 1/2 即可」，事后自圆其说；绿 = 预期值先定、实测值逐格填入。
- **对应测试**：待 plan Task N
- **不覆盖**：不判断预期值本身定得是否合理（那是 spec R10 的设计责任）。
- **凭据**：④ 需要真跑；无凭据时只做 ①②③ 与 `validate`、`--dry-run` 结构验证。

### TC-040 实测不达时判用例无效且技能零改动

- **覆盖**：`R10 / §6-1`
- **前置**：已完成真跑并填好对账表（无凭据时本条只验「技能零改动」与结论模板，不验不达分支）。
- **步骤**：① 对比对账表与 R10 预期值，标出不达项；② 检查结论文件对不达项的处理是否为「判用例无效，改用例」；③ `git status --porcelain skills/`；④ `git diff --stat -- skills/`；⑤ 检查结论文件是否出现「调整预期值」「放宽断言以通过」这类改法。
- **预期**：② 写明「无效」并给出用例修改方向；③④ 均为空（技能正文零改动）；⑤ 0 命中。
- **判据**：机器——③④ 输出为空且 ② 含「无效」、⑤ 命中数 0；任一条不成立即失败。
- **红绿证据**：红 = 为提高通过率去改 `skills/review-triage/SKILL.md`；绿 = 只改用例并记录不达原因。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证改用例后的新预期值（新一轮按 TC-039 重走）。

### TC-041 改 SKILL.md 迁就用例即违规

- **覆盖**：`§6-1`
- **前置**：本轮全部改动已在工作区。
- **步骤**：① `git status --porcelain skills/`；② `git diff --stat -- skills/`；③ 若 ① 非空，列出被改文件并读 diff 判断是否属于「为了让用例通过」的判据放宽；④ `git diff -- skills/review-triage/SKILL.md`。
- **预期**：①② 为空；即使有改动，也不得是判据放宽（例如删掉「免审必须报命令名」、把「低风险」并入免审）。
- **判据**：机器——①② 输出行数 = 0；非 0 时本条判失败并把 diff 交人工定性。人工定性结论写入结论文件。
- **红绿证据**：红 = 为了让 01 通过而改技能硬约束；绿 = `skills/` 零改动。
- **对应测试**：待 plan Task N
- **不覆盖**：不判断技能正文本身是否还有别的缺陷（那是技能体检的范围）。

### TC-042 本轮只允许 review-triage 一个技能目录且不建 CI

- **覆盖**：`R8 / §8`
- **前置**：`evals/` 已就位。
- **步骤**：① `Get-ChildItem evals -Directory | Select-Object -ExpandProperty Name`；② `Get-ChildItem evals/review-triage -Directory | Select-Object -ExpandProperty Name`；③ `Get-ChildItem .github -Recurse -File -ErrorAction SilentlyContinue | Select-String -Pattern 'eval|skill-up'`；④ `node -e "console.log(JSON.stringify(require('./package.json').scripts))"`。
- **预期**：① 只有 `review-triage`；② 只含 `cases`、`fixtures`（可再加其它必要子目录，但不得再嵌一个技能名目录）；③ 0 命中；④ 只有 `check` 与 `eval:review-triage` 两条，无 CI 钩子。
- **判据**：机器——①②③④ 全部成立；出现第二个技能目录、CI 配置或多余 script，即判越界（R8 是范围决定，不是能力上限）。
- **红绿证据**：红 = 顺手把其他 17 个技能的目录也建出来（成本决定被越过）；绿 = 只有一个技能目录。
- **对应测试**：待 plan Task N
- **不覆盖**：不判断未来扩到多技能时的结构（那时按 §3.1 的追加规则另立用例）。

### TC-043 cases 为空不得静默当成功

- **覆盖**：`§3.3 / §7-7`
- **前置**：有 skill-up 二进制。
- **步骤**：① 临时副本复制 `evals/`；② 把 `cases.files` 改为 `[]`（用无 BOM 写回）；③ `& $env:SKILL_UP_BIN validate "$env:TEMP/eval-empty/review-triage/eval.yaml"`；④ `$LASTEXITCODE`；⑤ `& $env:SKILL_UP_BIN run "$env:TEMP/eval-empty/review-triage/eval.yaml" --dry-run --output-dir "$env:TEMP/eval-empty/out"`；⑥ `$LASTEXITCODE` 与输出里的用例数。
- **预期**：④ 或 ⑥ 非 0，或者输出显式写明「0 cases / 无用例」。不得出现「退出 0 且无任何提示」。
- **判据**：机器——④⑥ 至少一个非 0，或输出命中 `0 cases|no cases|无用例|0 条用例`；若两者都 0 且无提示，判 runner 不合格（应自行拦截空用例集）。
- **红绿证据**：红 = 空用例集跑出 0 退出、报告显示满分（把「没测」当「全过」）；绿 = 明确报错或提示 0 用例。
- **对应测试**：待 plan Task N
- **不覆盖**：不要求 skill-up 改行为（若工具侧确实静默，责任落到 runner 的自检）。
- **凭据**：dry-run 不需要凭据。

### TC-044 eval.yaml 语法错必须非 0 且指行

- **覆盖**：`§3.2`
- **前置**：有 skill-up 二进制。
- **步骤**：① 临时副本复制 `evals/`；② 在副本 `eval.yaml` 末尾追加一行 `broken: "unclosed`；③ `& $env:SKILL_UP_BIN validate "$env:TEMP/eval-bad/review-triage/eval.yaml"`；④ `$LASTEXITCODE`；⑤ 检查错误输出是否含行号或字段名。
- **预期**：④ 非 0；⑤ 含行号（如 `line 25`）或字段名 `broken`。
- **判据**：机器——④ 非 0 且 ⑤ 命中 `line|broken|yaml|syntax` 之一；若退出 0，判失败（坏配置被当成可用）。
- **红绿证据**：红 = 语法错仍 validate 通过，真跑时才炸；绿 = 提前非 0 并指行。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证语义错（如参数类型错）是否被捕获。

## 3 负例与边界

| 用例 ID | 边界/负例是什么 | 为什么容易漏 | 期望行为 |
|---|---|---|---|
| TC-004 | `skills[].path` 写成 `.` | 试跑版 `eval.yaml` 就写成 `path: .`（`.session/eval-trial/review-triage/evals/eval.yaml` 第 6 行），换成仓库布局后 `.` 的含义变成「与本文件同级」，失败点被推到运行时 | validate 非 0；若工具接受 `.`，必须登记为「R1 无机器强制」缺口 |
| TC-005 | `evals/` 被复制进技能目录 | `npm run check` 不检查技能目录下多出的子目录，放错位置不会被任何既有守卫拦住 | 结构断言检出，删除后归零 |
| TC-007 | runner 漏传 `--output-dir` | 默认值在正常情况下也能跑通，只有跑完看目录才发现污染 | 副本里出现 `skills/review-triage-workspace`，据此判定参数不可省 |
| TC-009 | 环境里没有 skill-up | 开发机都装了，CI/新机器才会暴露 | check 仍全绿，零 eval 相关输出 |
| TC-013 | 分档标题写进 `must_not_contain` | 标题看起来最像「该档的标志词」，最直觉的写法 | 历史正确答案被误杀，据此禁止该写法 |
| TC-014 | 只有结论词、没有理由词 | 结论词最显眼，写起来最省事 | 「结论对理由错」的假回复被放过，判用例不合格 |
| TC-017 | 证据词死抠 `git diff` 全名 | 命令全名看起来最权威 | 写「diff 字面核对」的正确回答被误杀 |
| TC-018 | 禁词出现在否定句 | 「不是低风险」语义正确，但字符串包含禁词 | 记录误杀并给豁免或登记缺口，否则判用例不合格 |
| TC-019 | prompt 暗示档位 | 写 prompt 时顺口带出结论 | 答案词 0 命中 |
| TC-022 | 用例缺 fixture 配置 | 贴 diff 在 prompt 里最省事，且模型照样能答 | 判用例不合格（R5） |
| TC-023 | 无 fixture 的空目录环境 | 结果看起来像技能判错，实际是环境不成立 | 结论写「用例无效」，不得归因技能 |
| TC-024 | 补丁带 BOM 或 CRLF | PowerShell 默认写法和 UTF8 参数都会引入 | `git apply --check` 必须 0 |
| TC-025 | 补丁用反斜杠路径 | Windows 上手写补丁的自然写法 | `git apply` 必须 0 |
| TC-028 | flaky 被当成结论 | 两次都过时看不出问题，一过一挂时最想下结论 | 结论写「无效」，不得判技能好坏 |
| TC-030 | baseline 被关掉 | 只跑装技能省一半调用，省钱诉求很自然 | 无 Delta 即判不合格 |
| TC-031 | 用期望项分母冒充迭代次数 | benchmark 两个数字挨着显示，`3/3` 比 `2/2` 更抓眼 | 对账按 run 级分母 |
| TC-033 | 二进制找不到时静默跳过 | 「没跑」和「通过」在退出码上都是 0 最容易混 | 非 0 + 安装指引 + 无产物 |
| TC-035 | 非 0 被解释成技能坏了 | 退出码语义直觉化 | 只报运行失败，同时打印 flaky |
| TC-037 | 把结论外推到 Claude | 习惯性把「模型」等同于 Claude | 只对实际组合成立 |
| TC-040 | 不达时改技能迁就 | 改技能比改用例快 | 技能零改动，用例判无效 |
| TC-041 | 改 SKILL.md 让用例过 | 同上，且改动看起来「很小」 | `skills/` diff 为空 |
| TC-042 | 顺手铺开多技能或接 CI | 结构一次建好最省事 | 只允许一个技能目录、无 CI |
| TC-043 | 空用例集静默成功 | 0 条用例时工具可能返回 0 | 显式报错或提示 0 用例 |
| TC-044 | 坏 yaml 静默通过 | 配置错误常在真跑时才炸 | validate 非 0 且指行 |

## 4 回归清单

| 如果改了 | 必须重跑 | 为什么 |
|---|---|---|
| `evals/review-triage/cases/01-checkbox-mechanical.yaml` | TC-011、TC-012、TC-015、TC-016、TC-018、TC-020~025、TC-031、TC-039、TC-040 | 01 的断言、fixture 引用与预期值全在这份文件里 |
| `evals/review-triage/cases/02-command-swap-semantic.yaml` | TC-011、TC-012、TC-014、TC-031、TC-039 | 02 的断言与 R10 预期值绑定 |
| `evals/review-triage/eval.yaml` | TC-002、TC-003、TC-004、TC-026、TC-029、TC-030、TC-031、TC-043、TC-044 | 契约字段、迭代次数、baseline、空/坏配置都从这里进 |
| `evals/review-triage/fixtures/**` | TC-020~025、TC-023 | 补丁与仓库必须逐字对齐，编码/分隔符错即 apply 失败 |
| `scripts/run-eval.mjs` | TC-006、TC-007、TC-009、TC-026、TC-027、TC-029、TC-030、TC-032~035、TC-038、TC-043 | runner 的参数拼装、退出码、stdout 结论全部由它决定 |
| `package.json` | TC-008、TC-009、TC-042 | 只允许新增一条 script，且 check 不得被污染 |
| `.gitignore` | TC-006、TC-010 | 产物改道是否被忽略取决于此；改道到 `.session/` 外必须补条目 |
| `skills/review-triage/SKILL.md` | TC-011~016、TC-021、TC-023、TC-039~041 | 技能判据变则用例理由词、fixture 必要性、预期值全要重估 |
| `docs/superpowers/specs/2026-10-21-skill-eval-harness-design.md` | TC-003、TC-011、TC-012、TC-029、TC-036、TC-039 | 契约字段与 R10 数值以 spec 为准，spec 改则用例判据跟着改 |
| `scripts/check-all.mjs` | TC-008（应直接报红） | 该文件本轮禁止改动；一旦有 diff 即违约 |

## 5 只手动验证

| 项 | 为什么机器验不了 | 谁验、看什么 |
|---|---|---|
| 01 装技能后的真实回复里，证据是「实跑得到」还是「复述 prompt 里的 diff」 | 关键词断言只能看见「diff」「字面核对」这些字；历史样本 `.session/eval-trial/out2/iteration-2/01-checkbox-mechanical/with_skill/outputs/response.md` 自己写明「当前会话目录不是 git 仓库，实际核对基于改动清单里提供的 diff 原文」，却通过了全部关键词断言 | reviewer-qa 或用户看：回复是否给出 fixture 仓库里的真实 `git diff` 片段（含文件名、行号、增删数），是否提到仓库路径或 `git status`；若只复述 prompt，即便关键词全过也判证据不成立 |
| 「理由级词」是否真的承载了推理 | 词表命中无法区分「讲清为什么机器判不了」与「把词抄一遍」，例如「语义迁移已在实跑中验证，可直接提交」能命中 `语义迁移` 却是错误结论 | reviewer-qa 看：命中词所在句子有没有给出因果链（判据为何不可机械执行、替代验证是什么） |
| 出现 flaky 后是否真的停下改用例 | 机器只能查到结论文本写了「无效」，查不到后续是否仍拿该次数据判技能好坏 | 用户或 reviewer-qa 看：结论之后是否还有基于该次运行的有效性判定；是否改用例后重跑 |
| `npx skills add` 的真实安装清单不含 `evals/` | 结构断言（无 `SKILL.md`、不在 `skills/` 下）只是代理证据，真实打包行为由外部工具决定 | reviewer-qa 在临时目录跑一次安装，看输出与安装目录里是否出现 `evals` |
| R10 预期值是否真的在运行前写死 | 文件 mtime 可以被重写，同秒也会打平；机器只能验顺序不能验动机 | 评审时看对话与文件历史顺序：预期值出现在第一次真跑之前还是之后 |
| 结论里的模型名是否与真实后端一致（CCR 转发可能改写） | 只能验字段非空，无法验证转发链路的实际模型 | 用户对照 CCR 侧记录，确认报告里的模型名与实际调用模型一致 |

## 6 不测（带理由）

| 不测什么 | 为什么 |
|---|---|
| 其余 17 个技能的用例 | R8 明确本轮只到 `review-triage` 两条用例，铺开是成本决定 |
| CI 门禁 / 提交前自动跑 | §8 列为不在这一轮；重复次数、阈值、成本承担都还没定 |
| Trae CLI 引擎 | §8：官方限制仅企业旗舰版可用，个人不可用 |
| `agent_judge` 语义打分 | §8：贵且不稳，本轮全部用确定性判分 |
| skill-up 内部判分逻辑 | §3.3 明确 runner 不做判分，判分归工具；测它等于测外部依赖的实现 |
| 模型本身的能力水平 | 本工装测的是「技能对模型有没有约束力」，不是模型好不好；差值才是指标 |
| 并发运行、多用户共享产物目录 | 产物目录固定为 `.session/eval-out/<技能名>/`，单机单人；并发不在本轮范围 |
| 网络/代理/转发层稳定性 | 属环境问题，发生时按 TC-038 分流为「环境不可用」，不产生独立用例 |

## 7 缺口与判别力水位

| 缺口 | 漏检哪类反例 | 至少 1 个样例 | 语义由谁兜 |
|---|---|---|---|
| 关键词断言无法区分「实跑证据」与「复述 prompt」 | 回答里出现 `diff`、`字面核对`，但证据其实来自 prompt 里贴的 diff | `.session/eval-trial/out2/iteration-2/01-checkbox-mechanical/with_skill/outputs/response.md`：自陈「基于改动清单里提供的 diff 原文」仍全过 | reviewer-qa 人工读回复（第 5 节第 1 行） |
| 禁词表对否定句式误杀 | 「这不是低风险，而是无风险」被判成低风险 | TC-018 构造句 | 用例作者维护豁免规则 + 人工复核误杀记录 |
| 错误结论复用正确词表里的词 | 「语义迁移已在实跑中验证，可直接提交」命中理由词 → 被判 PASS | TC-014 的同类变体 | reviewer-qa 读理由句是否自洽 |
| 报告两个分母（runs 与期望项数）混用 | 拿 `100% (3/3)` 冒充 R10 的 `2/2` | `.session/eval-trial/out3/iteration-2/benchmark.md`：`1 runs each per configuration` 与 `100% (3/3)` 并存 | 对账人按 TC-031 的 run 级口径 |
| flaky 判定依赖工具报告，runner 不自算 | 工具不标 flaky 时 runner 无从打印 | `.session/eval-trial/out/iteration-1/benchmark.md`（01 with 为 2/3）与 `out2/iteration-1/benchmark.md`（同一个 01 with 为 3/3） | reviewer-qa 跨迭代比对（TC-028） |
| 只测一种引擎 + 一种模型组合 | 换模型/换引擎后的行为变化 | 本轮 claude_code + 经 CCR 转发的 GLM-5.3-Flash | 结论边界声明（R9）+ 换组合重跑，不靠单次结论外推 |
| 断言只覆盖两条用例 | 其他错误推理形态（如「历史记录所以免审」）没有禁词 | `skills/review-triage/SKILL.md` 常见错误表里的「这是历史记录」 | 扩用例时按常见错误表逐条补禁词 |

## 8 给开发的建议

| # | 位置（文件:行 / spec 节号） | 风险或盲点 | 为什么会被忽略 | 具体改法 | 优先级 |
|---|---|---|---|---|---|
| 1 | spec §7「只手动验证」/ §3.5 用例 01 | 加 fixture 后，断言仍无法证明模型真的跑了 `git diff`；历史样本自陈基于 prompt diff 却全过 | 关键词断言看起来已经覆盖了「diff」，评审时不会再问证据来源 | 在断言里加一个「只有实跑才看得到」的锚点：要求回复报出 `git diff --stat` 的 `1 file changed, 1 insertion(+), 1 deletion(-)`，或在 fixture 的 `plan.md` 里放一个 prompt 未出现的邻近行（如上一行的待办文本），要求回复引用它 | P0 |
| 2 | spec §2 R4-① / §3.4 断言双面 | `must_not_contain` 对否定句误杀：「不是低风险」也会命中 `低风险` | 写禁词时只想着「错误答案会说这个词」，不会想到正确答案会引用它来否定 | 在用例里对禁词加否定语境豁免（如 `(?!.*不是低风险)` 或改用不会出现在否定句的词），并在 §3.4 增加一条「禁词必须做否定句自检」 | P1 |
| 3 | spec §5 验收① / `scripts/run-eval.mjs` | `skills/<技能>/evals/` 这类放错位置没有任何自动守卫：`check-all` 不查技能目录下多出的子目录，`skill-inspector/scripts/check.mjs` 只查路径引用 | 大家都以为「`npm run check` 会管目录结构」 | 在 runner 或独立脚本加一条自检：`skills/` 下每个技能目录只允许 `SKILL.md` + `scripts/` + `references/` + `assets/`，且 `skills/` 下不得出现名为 `evals` 的目录；在 `npm run eval:*` 前执行 | P1 |
| 4 | spec §3.3-4 / R10 | benchmark 的 `(N runs each per configuration)` 与 `Pass Rate x% (a/b)` 两个分母含义不同（历史实测 `1 runs` 与 `3/3` 并存），R10 的「2/2」极易被 `3/3` 顶替 | 两个数字在报告里相邻显示，肉眼不会区分 | runner stdout 明确打「用例 01：2 个 run，2 过 0 挂，flaky 否」这类 run 级结论；对账表只允许填 run 级数字 | P0 |
| 5 | spec §3.2 `engine.model` 行 | 要求「由 runner 从环境决定」，但 skill-up 的 eval.yaml 现字段含 `provider` + `name`（试跑版第 9–11 行写死 `anthropic` / `claude-sonnet-4-6`）；若该字段必填，「由环境决定」落不了地 | 契约表只写了意图，没写注入方式 | plan 里明确 runner 如何改写/注入该字段（模板占位 + 启动前替换，或环境变量传入），并由 TC-002 断言用例文件不含写死模型名 | P1 |
| 6 | spec §3.3-2 / §4 步骤 4 | `--output-dir` 若写成相对路径，解析基准可能是进程 cwd 而非仓库根；换目录启动就会漏到未忽略位置 | 默认都在仓库根跑，测不出来 | runner 把 `--output-dir` 拼成「仓库根 + `.session/eval-out/<技能名>`」的绝对路径，并在启动前断言该路径以 `.session` 开头，否则直接非 0 退出 | P1 |
