# 测试用例：skill 行为评测工装（skill-up 本地化）——三层判据版

> **⚠️ 2026-10-24 已停用：本功能已整体删除，本文件仅作历史记录，其中所有验收步骤与断言均不可执行，勿按它重建。** 见 `docs/after/20261024154827-skill-eval-harness-parking.md`。

> 归属 spec：`docs/superpowers/specs/2026-10-21-skill-eval-harness-design.md`（2026-10-22 三层判据改造版 + 互测修订版 S1–S13 全部收敛 + 2026-10-23 路径基准实测修正版，spec 状态「已定稿（第 9 轮通过；2026-10-23 基准修正同步）」）
> 编写者：`senior-sdet`（2026-10-23，第 2 次改写；全新上下文；文件版本 v10）
> **独立性声明**：本文件编写期间**未阅读** `scripts/run-eval.mjs` 与 `scripts/check-eval-contract.mjs` 的实现（**两者此刻已存在于仓库，非「不存在」**——上一版此处写「两者目前都不存在」是事实错误，已订正）；编写者未参与本 spec 的编写、评审与施工；判据只从 spec 正文（§1.5 术语 / §2 R1–R10 / §3.2 与 §3.2.1 契约 / §3.2.2 机读块与启动前核对 ①–⑦ / §3.3 runner 契约 / §3.4 写作规矩 / §3.5 判据对照 / §4–§7）独立推导，**不从实现倒推**。**2026-10-23 增量的独立性**：本次增量同样在全新上下文编写，只读 spec 与既有 testcase，未阅读 `scripts/run-eval.mjs` 实现；新增 TC-080~TC-088 全部从 spec 正文（§3.3-6 二维表 ③④ / §3.3-7 异常明细段 / §3.3-5⑥-4 / §7-8）推导。**第 2 次改写（v10）**：同样未阅读两脚本实现，TC-089~TC-100 及 TC-080~TC-088 的改写只依据现行 spec 条文（§3.3-6 超时信号与二维表 ①–⑤ / §3.3-7 异常明细机读契约 / §3.3-5⑥-4）。
> 状态：**已定稿（第 9 轮通过，2026-10-22）**（已按互测 T1–T11 终态同步为 v5，按 spec 第 2 轮复攻落地版同步为 v6，按第 9 轮出卡后的现行 spec 同步为 v7，按 2026-10-23 路径基准实测修正的现行 spec 同步为 v8，按 2026-10-23 spec 三处改动同步为 v9（增量：为 §3.3-6③ unknown 口径、§3.3-7 异常明细段、§7-8 与 ⑥-4 复数 path 补 TC-080~TC-088）→ **v10（2026-10-23 议会第 1 轮打回后二次改写：明细判据改为按 `detail-kind=` token 计数、超时信号按作用域、新增 TC-089~TC-100）**；第 8 轮原判保留；`check-all` 与哈希待终端恢复后补跑）
> 版本记录：
> - v0（2026-10-21 初稿，草稿）
> - v1（2026-10-22 议会第 1–6 轮修复版，按 F 族逐条落实；过程见 git 历史与议会账本）
> - **v2（2026-10-22 三层判据改造重写）**：spec 的「单一标量预期值 + 单一 verdict」被推翻，改为**三层判据**（L1 用例可用性 / L2 断言可达性 / L3 技能有效性）。本次重写覆盖的族：
>   - **B 组（断言质量与 L2）**：L2 输入从「施工期模型跑出来的正样本」改为**手写 oracle** `evals/review-triage/fixtures/oracle/<case-id>.md`；`01-with-skill.fixture-correct.md` 及其判据整体删除，TC-015 改为「oracle 必须满足全部断言 + 主锚点双向核对」。
>   - **D 组（L1 稳定性）**：flaky 改为**单一口径 = run 级、全 `iteration-*` 并集、用例级 OR**（TC-027/028 改写）；新增 run 三态 `undetermined`（TC-051）与「只读 iteration-1 的实现必须被检出」（TC-052）。
>   - **E 组（L3 差值）**：绝对通过率不再作判据，`delta` 是唯一 L3 指标（TC-029/030/031 改写）；新增 `INVALID_DELTA`（TC-049）与「ASSERT / DELTA 因 `origin` 互斥」（TC-050）。
>   - **F 组（机读块与启动前闸门）**：旧标量 `{"required_passed","required_total"}` 废弃，改 `eval-expectation/v2`；新增 TC-053~TC-060（闸门 ①–⑦ 逐条阻断，均断言「码 4、不产 verdict 行、不花模型调用」）、TC-062（probe 的 `arms`/`delta` 必须为 null）、TC-063（出生即 frozen 被拒）、TC-064（`benchmark.enabled` 非 true）、TC-065（路径不存在）。
>   - **C 组（fixture）**：v2 曾把 `context.git.init` 判为非法字段——**该结论是错的，v3 已整条改写**。正确契约（2026-10-22 真 fixture 实测）：`apply_diff` **必须嵌在 `context.git` 下**（`context.git.apply_diff`；同级还有 `init` / `checkout` / `remotes`），写成 `context.apply_diff`（与 `repo_fixture` 同级）会被工具当未知字段**静默忽略**（补丁不生效、工作区连 `.git` 都没有）；`context.git.init: true` **是真实存在的字段**，但它**只建空仓库、不做基线提交**（`git log` 报 `does not have any commits yet`、`git status` 全是 `??`、`git diff` 为空），因此 **fixture 目录必须自带已提交的 git 仓库**（`baseline` 提交）才能跑进「未提交改动」场景。改动用例：TC-021（删错误说明）/ TC-022（判据改为层级 + baseline）/ TC-065（字段写法同步）；新增 TC-066（层级错）/ TC-067（无 baseline）/ TC-068（缺证据词）；TC-023 因 01 变为 `probe` 而改判据（probe 永不出现 ASSERT / DELTA）。
>   - **verdict 五值**：`INVALID_DELTA` 入枚举，全文件所有枚举点同步（TC-027/035/038/040/047/048）。
>   - **旧断言项级叙述清零**：旧版按断言项计数的说法全部废弃，全文统一为 run 级（装 7/7 run 全过、不装 0/7 run 全过）。
> - **v3（2026-10-22 真 fixture 实验后修订）**：依据 2026-10-22 真 fixture 实验（已实测，不得改写），修订 fixture 契约与 01 的断言要求。六条事实：
>   1. **`apply_diff` 必须嵌在 `context.git` 下**：正确写法是 `context.git.init: true` + `context.git.apply_diff: <补丁路径>`；写成 `context.apply_diff`（与 `repo_fixture` 同级）会被工具当未知字段**静默忽略**——补丁不生效、工作区连 `.git` 都没有（实测模型回「当前目录不是 git 仓库」「没有未提交改动」）。
>   2. **`context.git.init: true` 是真实存在的字段**（同级还有 `checkout` / `remotes`）。v2 对该字段的否定判定是**错误结论**，已删除并改写为正向表述。
>   3. **`git.init: true` 只建空仓库、不做基线提交**：`.git` 存在，但 `git log` 报 `does not have any commits yet`、`git status` 全是 `??`（untracked）、`git diff` 为空 → 技能仍判「没有未提交改动」。
>   4. **fixture 目录自带已提交 git 仓库时一切正常**：上传会保留 `.git`（实测 `git log` 可见 `baseline` 提交、`git status` 显示 ` M notes/plan.md`、`git diff` 显示 `- [ ]`→`- [x]` 一行翻转），模型据此判「可直接提交」并报出 `git diff` 实跑结果。
>   5. **01 稳定性已实测**：4 次真跑 × 每次 3 迭代（每臂 12 个 run）——装技能 **12/12 run 全过**、不装技能 **0/12 run 全过**、四次均 `flaky=否`、`delta=1.0`；已达 spec R8「连续 ≥3 次真跑」的升级门槛，但用户 2026-10-22 裁定**本轮仍标 `probe`**。旧稿中「fixture 侧证据不足 → 用例侧结论待定」一类表述一律按上面第 1–4 条的实测更新：fixture 侧只依赖 spec §4 步骤 0 的「四件自查」+ 上面的真跑实测。
>   6. **断言判别力实测**：只写结论词「可直接提交」时，不装技能臂 3 次里 1 次误过 → `flaky=是`、`delta=0.667`（把断言缺陷伪造成 flaky）；补上证据词 `git diff` 后，不装技能臂 3/3 稳定失败、装技能臂 3/3 稳定通过。故 01 的 `must_contain` **必须同时含结论词与证据词**（现行三词：`可直接提交` + `git diff` + `notes/plan.md`，见 §3.2.2 示例与 TC-039 ④；v3 当时为两词，主锚点是后来加的）。
>   - 本次改动：TC-021（删对该字段的错误否定说明）、TC-022（判据改为字段层级 + baseline 提交）、TC-062（红证据改为「用户裁定仍 probe」口径）、TC-065（字段写法同步为 `context.git.apply_diff`）；**新增 TC-066 / TC-067 / TC-068**（编号从 TC-065 顺延，不改旧号）；覆盖总表与统计同步为 **68** 条。
> **v4（2026-10-22 议会第 7 轮修复版）**：按第 7 轮 9 个 P0 族修 —— ① 证据词口径统一（`git diff` + 主锚点，删掉与 R10/TC-068 相反的裁定，TC-017 改写）；② 禁词改「纯子串、与工具同口径、无否定豁免」（TC-018/TC-058 重写）；③ dry-run 五要素拆档（TC-036）；④ `flaky=未判定` 值域写死（TC-051；2026-10-22 终校验补齐第③种情形「数据量不足」，现为三情形，以 spec §3.3-7 为准）；⑤ `delta` 四值单源 + TC-030 删除「写 0 也行」；⑥ 工具退 0 无产物归码 2 + `INVALID_ENV`（TC-034⑤）；⑦ TC-066 行为侧改直调工具（runner 会先码 4）；⑧ `judge` 关键词 ⊆ `expect`（TC-012）；⑨ `anchors` 非空约束（TC-012④ 改为判失败）。另修 P1：01 实测数字统一 12/12、`undet=` 字段、frozen 留痕改 `frozen-ledger.json`（进 git）、TC-047 六件必测、TC-011 块列表形态、TC-022 取证两档。
> **v5（2026-10-22 互测修订版：按 clarify.md §三 3.3 的 T1–T11 终态逐条落改）**：① T1 退出码 b 拆 b1/b2（工具码 1 + 数据完整 → runner 码**由 verdict 定**，删掉「把工具码直接当 runner 码」的旧说法）；② T2 g 改「按启动前 ①–⑨ 取**首个失败项**的码」+ 三个可判别实例（g1 取 2 / g2 取 3 / g3 运行后跨行 `2 > 3 > 1 > 0`）；③ T3 TC-026 ② 期望从「非 0」改**严格 = 4** + 单行 `exit=4 reason=配置错误` + 三处无产物；④ T4 TC-061 ④ 拆 ④a/④b/④c（删掉「用 `git log` 作唯一判据」——未提交文件上该命令恒空，设计上不可满足）；⑤ T5 路径基准全文统一为**技能根目录**，TC-002 拆「runner 侧解析 / 工具侧字面值」两件事并前置 `Set-Location <仓库根>`，TC-022/TC-065 用 `$skillRoot` 解析，新增 TC-069；⑥ T6 TC-032 ⑧ 改「①–⑨ 各一项**真实性**标记，⑥ 必须打真实 `rev-parse HEAD` 结果」，并加「dry-run 只不写 `<output-dir>`/`verdict.md`，允许物化 `.session/eval/fixture/` 且每次先删后建」；⑦ T7 TC-012③/TC-039③ 依据改引 §3.2.1 子集约束 + §3.2.2 示例块，并注明断言集已写死、不得逐字复制旧试跑版；⑧ T8 TC-049 桩改「每 iteration 每 config 各 1 run」，预期 `runs=2/2`；⑨ T9 TC-023/TC-050 补三条防误读断言（`role=probe` 与 `delta=n/a` 同现 / `rate=` 不得省略 / 结论区不得写「01 达标」）；⑩ T10 文件头第 33 行改引 spec §3.4 与 §3.1（responses 的唯一授权机器用途 = A1 离线核对留痕），TC-013/014/016/017/046 的「机器裁决合格性」改为「机器只做抽取与计数 + 人工签字」；⑪ T11 TC-036 ② 要求 dry-run 打**显式** `engine_version=n/a（dry-run 未执行工具）` 一行，不许静默省略。
> **v5 新增覆盖（spec 新规则，从 TC-069 起顺延，不改旧号）**：TC-069 yaml 路径基准（正向观测）/ TC-070 A1 契约脚本 / TC-071 gate 数据量闸门 / TC-072 `expect`·`judge` 键白名单 / TC-073 `title` 多重集与重名 / TC-074 `frozen` 留痕失效归码 4 / TC-075 `git apply --check` 闸门 / TC-076 工具码 2·3 + 有数据 / TC-077 工具码 5 + 有数据。
> **v5 旧说法清零清单（改完已逐项 grep 归零）**：「把工具码直接当 runner 码」「启动前多条件命中时一律取码 4」「相对仓库根」「eval.yaml 所在目录」「沿用已验证版本」「按 calibrated 处理」「dry-run 不写产物（无限定）」「迭代数 × timeout_seconds × 1.5」。
> **v6（2026-10-22 互测第 3 轮：按 spec 现行版逐条同步）**：spec 本轮改了 9 处，本文件按 A1–A9 同步：
> - **A1 `repo_fixture` = 物化路径的静态相对值**（v6 当时写作两层回跳前缀、以技能目录为基准；**该基准 2026-10-23 实测已推翻，现行字面值见 v8**），源目录 = `fixtures/repos/<repo-name>/`，物化**由 runner 按 repo 名**做、**不在运行期改写 yaml** → TC-020 只校验源目录存在且不带 `.git`；TC-022 ②d 断言字面值逐字相等；TC-022 ⑥ / TC-065 a 的「存在性」核对对象改为**物化后**的该路径（解析基准按 v8 = `evals/` 目录）。
> - **A2 示例块 `oracle` 的字面值**：v6 当时写作两层回跳 + `evals/review-triage/…`；**2026-10-23 实测已改为相对 `evals/` 的 `review-triage/fixtures/oracle/<case>.md`（见 v8）** → TC-039 ③④、TC-015 前置、TC-069 的 oracle 期望值同步；全文不再有裸写的 oracle 值。
> - **A3 ⑥ 执行顺序固定**：源目录存在 → 物化（先删后建）→ `repo_fixture` 存在 → `rev-parse HEAD` → `git apply --check` → TC-022 ④、TC-065 ③、TC-075 按此重写；删掉「把存在性核对提到物化之前」的旧顺序（那会让每条正确用例在物化前恒报码 4）。
> - **A4 启动前 ⑧ 并入 `fixtures/CONTRACT.json` 变更期闸门**（存在、`exit===0`、`files` 内每个文件当前 sha256 与记录一致；缺失/不一致 → 码 4）→ TC-032 ⑧ 的标记必须含这两半；TC-070 新增 ⑧ 档（改 `expected.md` 不重跑 A1 → 启动前码 4）；**新增 TC-078** 专测 `CONTRACT.json` 的字段与哈希复算。
> - **A5 run 三态字段路径 = `runs[].result.passed` / `runs[].result.total`**（run 顶层没有）→ 所有桩与构造改 `result: {passed, total}` 形态；**新增 TC-079**「`passed` 写在 run 顶层 → 该 run 必须判 `undetermined`，不得静默当 `full`」。
> - **A6 运行后数据量闸门只对 gate**；probe 不因此升码 → TC-071 ③ 重写为「probe 目录不足：行内 `flaky=未判定`、退出码仍 0」；② 补 `rate=` / `delta=` / `flaky=` 期望值。
> - **A7 跨行取码集合 = `role=gate` 的行** → TC-048 g3 增混行实例（gate `INVALID_FLAKY`=3 + probe `INVALID_ENV` → 仍取 **3**）。
> - **A8 §5⑥ 的 OR 聚合加「在无更高优先级 verdict 时」；凭据分支优先于二维表①** → TC-027 / TC-028 断言补该限定；TC-038 / TC-048 增「工具码 1 + 数据完整 + 认证 stderr → 码 2（不由 verdict 定码）」。
> - **A9 §6-7 新增 `.session/eval/fixture/**` 物化 git 写例外（仍需用户/议会确认）；物化按 repo 名** → TC-021 / TC-067 说明段同步，仓库内 fixture **永不带 `.git`**。
> - 另按上一轮自列问题修 **B1–B5**：TC-070 ⑤ 由裸 grep 改为「不得出现读取产物目录的调用（或只扫非注释行）」；TC-072 增 `output_contains.not` / `files_not_exist` 两档；TC-073 / TC-074 / TC-075 的措辞判据收回为「码 4 + 单行 `exit=4 reason=配置错误` + spec 明文要求的关键词」；TC-069 ② 改为「① 抽出的每一个字面值」；TC-022 ⑤ baseline 检查对象改为物化副本。
> **v6 旧说法清零清单（改完已逐项 grep 归零，命中数见交付说明）**：「`repo_fixture` 指向源目录（两层回跳指向 `evals/` 下源目录的旧前缀）」「oracle 字面值缺 `evals/review-triage/` 前缀」「把三态字段写在 run 顶层」「把存在性核对提到物化之前」「probe 数据不足升成码 2」「把工具码直接当 runner 码」「启动前多条件命中时取码 4」。
> **v7（2026-10-22 议会第 9 轮出卡后：按现行 spec 逐条同步）**：
> - **W1 TC-071 ③ 重写（P0，判码自相矛盾）**：旧写法把 02 也改成 `probe`，于是 gate 用例数 = 0 → 按 spec 退出码 3，而旧用例期望 0。改为「**02 保持 `gate` 且数据充足**、只让 01（`probe`）数据不足」；01 行 `verdict=INVALID_ENV`（spec §3.3-7 新写死）但整轮退出码**严格 = 0**。
> - **W2 TC-079 ③ 分母修正（P0，算术错）**：不装臂两轮 partial 的 determined 数由「1」改为 **2**，并写明分母 = 迭代数 × 每臂每迭代 run 数。
> - **W3 路径基准与副本同构（P0；2026-10-23 由 v8 修正）**：spec 新增 `repoRoot = <eval.yaml 所在目录>/../..`（**`<eval.yaml 所在目录>/..` 的末级必须为 `evals`**，即 eval.yaml 位于 `evals/<技能名>/` 下）。v7 当时把 `skills[].path` 定为仓库根相对（**该口径已被 2026-10-23 实测推翻 → v8 改为相对 `evals/` 的 `../skills/<技能名>`**）。全文的副本构造统一为两层同构，副本 yaml 路径统一为 `<副本根>/evals/<技能名>/eval.yaml`。
> - **W4 产物目录前置（P0，阻断）**：TC-032 加「步骤 0：先删 `.session/eval/out/review-triage` 并断言 `Test-Path` = `False`」（§3.3-5④ 已存在即码 4，不先删会让每条 dry-run 用例撞码 4）；TC-070 ⑦ 的两次 dry-run 各加独立 `--output-dir`。
> - **W5 ⑥ 编号与四件自查（P1）**：spec 把闸门 ⑥ 写成 **⑥-1…⑥-5** 五步 → TC-022 / TC-065 / TC-066 / TC-075 的失败步骤编号全部同步，且启动前失败单行必须含失败项编号；TC-022 ⑥ 的自查清单由「三件」改「**四件**」（补 `git apply --check` 记录）。
> - **W6 TC-078 `files` 键基准**：键改为**仓库根相对**的正斜杠路径（如 `evals/review-triage/expected.md`），不得含 `..` 或盘符；复算先用 `$repoRoot = (Resolve-Path (Join-Path (Split-Path <eval.yaml 路径> -Parent) '../..')).Path`（并断言 `<eval.yaml 所在目录>/..` 的末级 = `evals`）再 `Join-Path`。
> - **W7 陈旧说法清零**：TC-063「spec 未定字段契约」→ 六字段已写死（缺项 → 码 4）；TC-018 s1/s2 由「PASS」改「**禁词命中数 = 0**」；TC-024 ⑦ 的 markdown 枚举补 `fixtures/RECORD.md` 与 fixture 内 `notes/plan.md`；§7 的 `flaky=未判定` 值域已同步为 **三情形**（gate 行也写 `未判定`）、二维表 ③④ 的重叠读法已按 spec **闭合**；§8 建议 11 / 15 标「已闭合 / 已修」，不再保留两种读法并存的措辞。
> **v7 旧说法清零清单（改完逐项 grep 归零，命中数见交付说明）**：副本 yaml 路径缺 `evals/` 这一层的旧写法（`<副本根>/…`）；TC-079 把每臂 determined 分母算成「1 个 run」的旧算法；闸门 ⑥ 旧的四级子步号；TC-022 只列三件的旧自查；`flaky=未判定` 的旧值域说法；二维表 ③④ 的旧悬置措辞。**`skills[].path` 的旧写法（仓库根相对 / 技能目录相对）在 TC-002 ③ / TC-069 ② / 红绿证据里只作反例出现**，不作期望值（2026-10-23 → v8 改为相对 `evals/`）。
> **v8（2026-10-23 路径基准实测修正：按 skill-up v0.14.0 兜底行为与仓库现行 evals/ 同步）**：
> - **X1 单一基准 = `evals/` 目录**（spec §3.2.1 / §3.3-1）：`evalsDir = <eval.yaml 所在目录>/..`（末级必须名为 `evals`），`repoRoot = evalsDir/..`；`skills[].path` 写 `../skills/review-triage`（**相对 `evals/`**，runner 解析成绝对路径后注入）；`cases.files` / `oracle` / `context.git.apply_diff` 写 `review-triage/…`（相对 `evals/`）；`context.repo_fixture` 写 `../.session/eval/fixture/review-triage/<repo-name>`（相对 `evals/`）。TC-002 / TC-003 / TC-004 / TC-015 / TC-022 / TC-023 / TC-039 / TC-053 / TC-065 / TC-069 / TC-070 已同步。
> - **X2 02 已有夹具**：新增 `fixtures/repos/command-swap-demo/`（`package.json` / `scripts/lint.mjs` / `scripts/typecheck.mjs` / `scripts/precommit.sh`）与 `fixtures/diffs/command-swap.patch`；02 声明 `context.repo_fixture` = `../.session/eval/fixture/review-triage/command-swap-demo`、`context.git.init: true`、`context.git.apply_diff` = `review-triage/fixtures/diffs/command-swap.patch`。
> - **X3 `anchors` 口径**：02 已声明 `context.git.apply_diff` → 其 `anchors` **不得为空**（现为 `["check:all"]`）；`[]` 只对**未声明 `apply_diff`** 的用例合法（spec §3.2.2 字段表）。
> **v8 旧说法清零清单（改完逐项 grep 归零，命中数见交付说明）**：以技能目录为起点的旧基准；两层回跳写 `evals/` 与 `.session/eval/fixture/` 的旧字面值；「02 缺夹具」「02 的 `anchors` 可为空」的旧说法；`skills[].path` 写成仓库根相对的 `skills/<技能名>` 作为期望值（旧写法只留在红绿证据里作反例，且同样用 `skills/<技能名>` 表述）。**三条新口径**：① 五类路径一律以 `evals/` 为单一基准；② 02 已声明 `apply_diff`，`anchors` 非空；③ `skills[].path` 必须是 `../skills/<技能名>`。
> **v9（2026-10-23 增量：以 spec 当日三处改动为主线补用例，另复用扩展了既有 ⑥-4 条文）**：spec 同日新增 ① §3.3-6 二维表 ③ 的 `configuration` ∉ {with_skill, without_skill} 口径（不属于任何一臂 → fail-closed 归 `INVALID_ENV` / 码 2，**且 ④ 的表外码透传优先于 ③**）；② §3.3-7「`verdict.md` 必须留异常明细」段（**五类**逐条落纸、每条一行且首段为 `detail-kind=<token>`、无异常写「无」、**明细以 `verdict.md` 为准而 stdout 不同源**）；③ §7 验收表第 8 项同步要求该段。本文件新增 **TC-080~TC-088**（编号自 TC-079 顺延，不改旧号）：TC-080 明细段存在 + 正常路径写「无」；TC-081 坏 `benchmark.json` 四形态被跳过且不计入 `iteration=`；TC-082 unknown `configuration` 归 ③；TC-083 ④ 透传优先于 ③；TC-084 unknown 只在 probe 时不改退出码；TC-085 `undetermined` 进明细（第③类）；TC-086 超时三支信号指明哪一支（第④类）；TC-087 `skills[].path` 单引号形态不被 ⑥-4 误判、注入后为纯绝对值；TC-088 多条 `skills[].path`（空 / 不存在 / 缺 `SKILL.md`）在 dry-run 即被 ⑥-4 拦住。统计同步为 **88** 条（正 23 / 负 45 / 边界 20）。
> - **覆盖口径订正（B10）**：v9 的自述「只为三处改动补用例」不准确——TC-087 / TC-088 覆盖的是 §3.3-5⑥-4（**既有条文**，本轮 spec 未改），不属于本轮三处改动。它算「**复用扩展**」：覆盖既有 spec 条文本身不违规（判据仍以 spec 为准），只是**不计入本轮增量口径**；v9 另有两处事实错误已在 v10 订正（头部「两者目前都不存在」、② 原写「stdout 与 verdict.md 同源」）。
> - **v10（2026-10-23 议会第 1 轮打回后二次改写，按打回清单 A1 / B1–B12 / C1–C6 逐条落实）**：① **明细判据一律改为按 `detail-kind=` token 计数**（token 枚举写死五个：`skipped-benchmark` / `unknown-config` / `undetermined-run` / `timeout` / `runtime-env-fail`），删掉按措辞的四组判别词；② **删掉全部「stdout 与 verdict.md 同源」类断言**（明细以 `verdict.md` 为准）；③ **超时信号按作用域**（① 逐 run、②③ 整轮；整轮命中时所有失败行 `timeout=是`、明细写 `scope=整轮` 且不含用例名；失败行 = 工具码 ≠ 0 的行，工具码 0 → 一律 `timeout=否`）；④ **二维表新增格 ⑤ 与全 probe 取码**各有专门用例；⑤ **明细段切片改为「标题到文件末尾 `Trim()`」**，并补段序负例与转义注入用例；⑥ **删掉不存在于 A1 用法里的副本根参数说法**，副本快照一律手工复算 sha256 写回。新增 **TC-089~TC-100**（编号自 TC-088 顺延，不改旧号）。统计同步为 **100** 条（正 26 / 负 50 / 边界 24）。
> **前置约定（全文件适用）**：① 凡需真跑的用例，其「前置」均含「已导出 `EVAL_MODEL_PROVIDER` / `EVAL_MODEL_NAME`」；缺任一项 runner 在启动前码 2，用例不得据此判技能问题。② **run 三态字段路径单一**：全文一切桩与构造的 `benchmark.json`，`passed` / `total` 必须写在 `runs[].result` 下（`result: {"passed": n, "total": m}`）——真实产物里 run 顶层没有这两个字段（spec §1.5 实测），写成顶层会让全部 run 变 `undetermined`；该形态的判别力由 TC-079 专测。③ **路径基准与故障注入副本同构**（spec §3.2.1 / §3.3-1）：`evalsDir = <eval.yaml 所在目录>/..`（**其末级目录必须名为 `evals`**，即 eval.yaml 位于 `evals/<技能名>/` 下，否则码 4）；`repoRoot = evalsDir/..`；`skillRoot = repoRoot/skills/<技能名>`；**五类路径同一基准 = `evals/` 目录**——`skills[].path` 写 `../skills/review-triage`（相对 `evals/`，由 runner 解析成绝对路径后注入 yaml，工装只看到绝对值）；`cases.files` / `oracle` / `context.git.apply_diff` 写 `review-triage/…`（如 `review-triage/cases/01-checkbox-mechanical.yaml`、`review-triage/fixtures/diffs/checkbox.patch`）；`context.repo_fixture` 写 `../.session/eval/fixture/review-triage/<repo-name>`（相对 `evals/`，含指向 `.session/` 的 `../` 那一段）。**凡把 `evals/` 复制到 `$env:TEMP` 做故障注入的用例，副本必须两层同构**：`<副本根>/evals/<技能名>/eval.yaml` 与 `<副本根>/skills/<技能名>/` 两层都在——否则副本里的 `../skills/…` 无目标（`review-triage/…` 与 `../.session/…` 只在副本根内解析），`skills[].path` 先撞码 4，删 oracle / 改 cases 的注入档测不到。统一构造（下文各用例用它替换自己的目录名）：`$t = Join-Path $env:TEMP 'eval-xxx'; New-Item -ItemType Directory -Force "$t/evals" | Out-Null; Copy-Item -Recurse evals/* "$t/evals/"; New-Item -ItemType Directory -Force "$t/skills" | Out-Null; Copy-Item -Recurse skills/review-triage "$t/skills/review-triage"`，之后一律 `--eval-yaml "$t/evals/review-triage/eval.yaml"`。④ **产物目录前置**：任何 `--dry-run` 调用跑前，默认产物目录 `.session/eval/out/review-triage` 必须**不存在**（§3.3-5④：已存在即码 4），否则每条 dry-run 用例都会在第一项检查上撞码 4、测不到自己要测的项；做法二选一——先 `Remove-Item -Recurse -Force .session/eval/out/review-triage -ErrorAction SilentlyContinue` 并断言 `Test-Path` = `False`，或显式传一个新的、不存在的 `--output-dir`。
> 命名与落点：按 `spec-testcase-gate` 规则判据 1（与 spec 同目录；文件名 = spec 文件名去掉 `.md` 后 + `-testcase.md`）。
> 术语：flaky / run 级三态 / 全过率 / delta / oracle 样本 / gate 与 probe / baseline / fixture 仓库 / 正例证据词 / 负例禁令词 / 实跑锚点，定义**以 spec §1.5 为准**，本文件不重复定义，只按该口径使用。
> 环境：Windows + PowerShell 5.1+ / Node ≥ 22；skill-up 二进制由 `SKILL_UP_BIN`（可指向 `.mjs` 桩，runner 用 `process.execPath` 拉起，spec §3.3-2）或 `PATH` 提供。需要模型凭据的用例一律附「无凭据时降级为 `validate` + `--dry-run` 验证结构」的替代路径。
> 编号规则：TC-三位序号，一经分配不改号。语义仍成立的沿用原号；被 spec 推翻的原地改写（TC-002/004/010/015/018/021/022/023/024/027/028/030/031/035/039/040/047/048/063/065/066/069/071/075/078/079）；**新增从 TC-049 起顺延至 TC-065，v3 再顺延至 TC-068，v5（互测修订）再顺延至 TC-077，v6 再顺延至 TC-079；v7 / v8 无新增编号；v9（2026-10-23 增量）新增 TC-080~TC-088（编号自 TC-079 顺延，不改旧号）；**v10（2026-10-23 第 2 次改写）新增 TC-089~TC-100（编号自 TC-088 顺延，不改旧号），被 spec 推翻的 TC-080~TC-088 原地改写**。
> 统计：用例总数 **100** 条；正例 **26** 条 / 负例 **50** 条 / 边界 **24** 条；**负例 + 边界（74）≥ 正例（26）**（逐条清点见 §3 末；v9 新增 9 条：正 2 / 负 3 / 边界 4；v10 新增 12 条：正 3（089/091/096）/ 负 5（090/092/093/099/100）/ 边界 4（094/095/097/098）——v10 的「负 + 边 9 ≥ 正 3」同样成立）。
> 一处口径说明：`fixtures/responses/` 的历史样本**不参与评测 verdict、不进 runner 判定链、不得充当 oracle**（spec §3.1）；**唯一授权的机器用途** = A1 离线契约脚本 `scripts/check-eval-contract.mjs` 按 spec §3.4「禁词双向验证」核对 `fixtures/RECORD.md` 登记的反向证据是否真的命中（它不读跑分、不产 verdict、不改变任何用例的合格性结论）。因此 TC-013/014/016/017/046 里**机器只做抽取与计数**，「该词该不该进用例」的合格性结论**由人工在 `expected.md` 人读区 / `fixtures/RECORD.md` 签字**——A1 只核记录自洽，核不出记录造假。

## 1 覆盖总表

| 用例 ID | 分组 | 覆盖的 spec 条目 | 用例名 | 正/负/边界 | 层级 | 判据类型 | 执行方式 | 优先级 |
|---|---|---|---|---|---|---|---|---|
| TC-001 | A 位置与产物 | R1 / §3.1 / §5① / §7-1 | evals 目录结构就位（含 `evals/review-triage/fixtures/oracle/`）且与 skills 隔离 | 正 | 集成 | 机器 | `Test-Path` + `Get-ChildItem` | P0 |
| TC-002 | A 位置与产物 | R1 / §3.2 / §3.2.1（路径单一基准）/ §3.3-1 / §5① | eval.yaml 指向仓库内真技能、`skills[].path` 相对 `evals/` 写 `../skills/review-triage`（runner 注入绝对值）、model 用占位模板不写死模型名 | 正 | 集成 | 机器 | `Select-String` + `Resolve-Path`（前置 `Set-Location <仓库根>`） | P0 |
| TC-003 | A 位置与产物 | §3.2 | eval.yaml 固定契约字段齐全 | 正 | 单元 | 机器 | 逐字段 `Select-String` | P0 |
| TC-004 | A 位置与产物 | R1 / §3.2 / §5① | skills[].path 写成 `.` 的已知缺口必须被登记（先断言 `path: ../skills/review-triage` 命中 1 次再替换，validate 实测 exit 0） | 负 | 集成 | 机器 | 同构临时副本 + `validate` | P0 |
| TC-005 | A 位置与产物 | R1 / §5① | evals 副本落进技能目录必须被结构断言检出 | 负 | 集成 | 机器 | 临时副本注入 + 结构断言 | P0 |
| TC-006 | A 位置与产物 | R3 / §5② / §7-2 | 跑完 skills 下无新增目录且产物只落 .session（含 verdict.md） | 正 | e2e | 机器 | 前后计数 + `git status` | P0 |
| TC-007 | A 位置与产物 | R3 / §3.3-1 | runner 去掉 --output-dir 会污染 skills 目录 | 负 | 集成 | 机器 | 源码断言 + 运行期路径断言 + 副本注入 | P0 |
| TC-008 | A 位置与产物 | R2 / §5③ / §7-3 / §7-9 / §6-8 | check 契约不破（全绿、零改动、零依赖、无 *.test.mjs） | 正 | 集成 | 机器 | `npm run check` + `git diff` | P0 |
| TC-009 | A 位置与产物 | R2 | 剥离 skill-up 后 check 仍须全绿 | 负 | 集成 | 机器 | 清洗 PATH 后 `npm run check` | P0 |
| TC-010 | A 位置与产物 | R3 / §5⑧ / §7-2 | 删掉产物目录后重跑自建，run 级结论与 delta 符号一致 | 边界 | e2e | 机器 | 删除 + 重跑 + 报告比对 | P1 |
| TC-045 | A 位置与产物 | §3.3-5④ / §5⑨ / §6-9 | 产物目录已存在时 runner 拒绝运行，不覆盖旧结果 | 负 | 集成 | 机器 | 建目录后重跑 | P1 |
| TC-011 | B 断言质量与 L2 | R4-② / §3.2.1 / §5⑤ | must_not_contain 不得含分档标题 | 正 | 单元 | 机器 | 解析 yaml + 禁词比对 | P0 |
| TC-012 | B 断言质量与 L2 | R4-①③④ / §3.2.1（judge ⊆ expect）/ §3.2.2（示例块口径）/ §3.4 / §5⑤ | 断言双面 + 理由级 + 主锚点 + judge 关键词 ⊆ expect + 只写一处 | 正 | 单元 | 机器 | yaml 结构 + 词表比对 | P0 |
| TC-013 | B 断言质量与 L2 | R4-② / §5⑤ / §3.4 / §3.1（responses 边界） | 分档标题写进 must_not_contain 会误杀正确答案 | 负 | 单元 | 机器+人工 | 历史样本离线复算（机器抽取 + RECORD 签字） | P0 |
| TC-014 | B 断言质量与 L2 | R4-①③ / §7-4 / §3.4 | 只留结论词会放过结论对理由错的回复 | 负 | 单元 | 机器+人工 | 构造假回复离线判定（机器抽取 + 人工签字） | P0 |
| TC-015 | B 断言质量与 L2 | R4-④ / §3.2.2⑤⑥ / §3.4 / §3.5 / §7-4 | 手写 oracle 必须满足 01 的全部断言（含主锚点双向核对） | 正 | 单元 | 机器 | oracle 离线复算 | P0 |
| TC-016 | B 断言质量与 L2 | R4 / §3.4 / §7-4 | 假阴性样例：错误答案必须 FAIL | 正 | 单元 | 机器+人工 | 构造样本 + 历史样本佐证 | P0 |
| TC-017 | B 断言质量与 L2 | R4-④ / §3.4 / §3.5 | 证据词必须来自实跑且须配主锚点（不得用复述替代） | 边界 | 单元 | 机器+人工 | 构造样本 + 历史样本对照 | P1 |
| TC-018 | B 断言质量与 L2 | R4-① / §3.4 / §3.2.2⑤ / §5⑤ | 禁词按纯子串判定（与工具同口径，无否定豁免） | 边界 | 单元 | 机器 | 构造样本离线判定 | P1 |
| TC-019 | B 断言质量与 L2 | §3.4 / §3.2.1 | prompt 只给输入不给答案（description 同样） | 边界 | 单元 | 机器 | 答案词扫描 | P1 |
| TC-046 | B 断言质量与 L2 | §3.4 / §5⑤ / §3.2.2⑤ | 禁词双向验证：oracle 正向 0 命中 + 不装臂真实样本 ≥1 命中 | 正 | 单元 | 机器+人工 | 离线判定 | P0 |
| TC-057 | B 断言质量与 L2 | §3.2.2⑤ / §3.3-5⑨ | oracle 文件缺失 → 码 4、不产 verdict 行、不花模型调用 | 负 | 集成 | 机器 | 临时副本删 oracle + dry-run | P0 |
| TC-058 | B 断言质量与 L2 | §3.2.2⑤ / §3.3-5⑨ | oracle 断言不通过 → 码 4 | 负 | 集成 | 机器 | 改 oracle 内容 + dry-run | P0 |
| TC-059 | B 断言质量与 L2 | §3.2.2⑥ / R4-④ / §3.3-5⑨ | 锚点双向核对：prompt 命中或 oracle 0 命中 → 码 4 | 负 | 集成 | 机器 | 改锚点/改 prompt + dry-run | P0 |
| TC-061 | B 断言质量与 L2 | §6-11 / §1.5（oracle 样本）/ §3.1 / §4 步骤 8（不执行 git 写操作） | oracle 必须手写（与 responses 某份逐字相同 → 该用例 L2 不合格）；时间先后不用 `git log` 作唯一判据 | 负 | 单元 | 机器+人工 | 逐字比对 + mtime/`RECORD.md` 签字 | P0 |
| TC-020 | C fixture 与素材 | R5 / §3.1（源目录不带 `.git`）/ §3.3-5⑥ | fixture **源目录**与补丁就位：源目录不带 `.git`、basename 与 `repo_fixture` 末段同名 | 正 | 集成 | 机器 | `Test-Path` + 逐字比对 | P0 |
| TC-021 | C fixture 与素材 | R5 / §7-5 / §6-7 | fixture 上 git diff 真有输出且只含一行翻转（不执行 commit） | 正 | e2e | 机器 | 临时仓库 init/add/apply/diff | P0 |
| TC-022 | C fixture 与素材 | R5 / §1.5（fixture 仓库）/ §3.2.1 / §3.3-5⑥ / §3.4 / §4 步骤 0 / §7-5 | `repo_fixture` 字面值 = 物化路径静态相对值 + 字段层级（`context.git.apply_diff`）+ baseline 提交，任一不合格即判用例不合格 | 负 | 单元 | 机器 | 字面值逐字比对 + `validate` + 取证记录 | P0 |
| TC-023 | C fixture 与素材 | R5 / §3.5 / §3.3-7 | fixture 换成空目录后 01 判必审；probe 行不得出现 ASSERT/DELTA | 负 | e2e | 机器+人工 | 故障注入 + verdict 行核对 | P0 |
| TC-024 | C fixture 与素材 | R5 / §4 步骤 7 | 补丁与 plan.md 必须 LF 无 BOM；plan.md 围栏/表格合规 | 边界 | 单元 | 机器 | 字节级 + 形态检查 | P1 |
| TC-025 | C fixture 与素材 | R5 / §3.1 | 补丁路径分隔符必须是正斜杠 | 边界 | 单元 | 机器 | 头行正则扫描 | P1 |
| TC-026 | D L1 稳定性 | R6 / §3.3-3 / §3.3-5⑤ | 迭代默认 2、拒绝 <2；N 次 → N 个 iteration-* 目录 | 正 | 集成 | 机器 | 参数断言 + 产物结构 | P0 |
| TC-027 | D L1 稳定性 | R6 / §3.3-6 / §3.3-7 / §5⑥ | flaky 自算（run 级、全迭代并集、用例级 OR）+ verdict 行全字段 | 正 | 集成 | 机器+人工 | stdout + verdict.md 行格式 | P0 |
| TC-028 | D L1 稳定性 | R6 / §3.3-6 / §3.3-7 / §5⑥ / §7-6 | 同臂 run 级结论跨迭代不一致 → INVALID_FLAKY | 负 | e2e | 机器+人工 | 固化 flaky 证据 + 判定函数 | P0 |
| TC-051 | D L1 稳定性 | §1.5 / §3.3-6 / §3.3-7 | undetermined run 不参与 flaky、不进率分母；两臂 determined=0 → INVALID_ENV + 码 2 | 边界 | 单元 | 机器 | 产物桩构造 run | P0 |
| TC-052 | D L1 稳定性 | §3.3-6 / R6 / §5⑥ | 只读 iteration-1 的实现必须被检出（正确实现判 flaky=是） | 负 | 单元 | 机器 | 双目录构造 + 判定函数对照 | P0 |
| TC-071 | D L1 稳定性 | §3.3-6（运行后数据量闸门）/ §3.3-7 / R6 | gate：实际 `iteration-*` 目录数或每臂 determined 数 < `iteration_min` → `INVALID_ENV` / 码 2；**probe 不套此闸门**（01 数据不足时行内 `flaky=未判定` + `INVALID_ENV`，退出码仍 0，02 的 gate 结论照常 VALID） | 负 | 单元 | 机器 | 产物桩减量 + 判定函数 | P0 |
| TC-029 | E L3 差值 | R7 / §3.2 / §3.3-3 / §3.5 | baseline 必开、报告含 With/Without/Delta，delta 是唯一 L3 指标 | 正 | 集成 | 机器 | yaml + 报告列 + 构成声明 | P0 |
| TC-030 | E L3 差值 | R7 / §3.3-7 | 两臂都全过（delta=0）不得报 VALID | 负 | 单元 | 机器 | 产物桩构造 delta=0 | P0 |
| TC-031 | E L3 差值 | R6 / §3.3-6 / R10 / §3.2.2 | 计数口径：runs_per_configuration=1、runs[]=用例×臂、分母=迭代数 | 边界 | 集成 | 机器 | benchmark.json 交叉核对 | P0 |
| TC-049 | E L3 差值 | §3.3-7 / R8 / R10 | `origin: frozen` 的 gate 未达 → INVALID_DELTA（不是 ASSERT、不是「用例无效」） | 负 | 单元 | 机器 | 产物桩 + frozen 留痕 | P0 |
| TC-050 | E L3 差值 | §3.3-7 / §3.2.2③ / §1.5 | 同一份未达标数据：calibrated→ASSERT、frozen→DELTA；probe 永不出现两者 | 边界 | 单元 | 机器 | 三态对照 | P0 |
| TC-053 | F 机读块与闸门 | §3.2.2① / §3.3-5⑧ | schema 值错 / JSON 不可解析 / 多个 json 围栏块 → 码 4 | 负 | 集成 | 机器 | 临时副本改块 + dry-run | P0 |
| TC-054 | F 机读块与闸门 | §3.2.2② / §3.2.1 | eval_name 集合与 cases.files 的 title 不双向相等 → 码 4 | 负 | 集成 | 机器 | 缺/多/差一字/title 重复 | P0 |
| TC-055 | F 机读块与闸门 | §3.2.2③ | role / origin 枚举非法 → 码 4 | 负 | 集成 | 机器 | 改枚举值 | P0 |
| TC-056 | F 机读块与闸门 | §3.2.2④ | gate 下限越界、delta.min 越界、assert 与 yaml 不等 → 码 4 | 负 | 集成 | 机器 | 改数值/改词 | P0 |
| TC-060 | F 机读块与闸门 | §3.2.2⑦ / §3.3-3 | iteration_min < 2 或 > 本次 --iteration → 码 4 | 边界 | 集成 | 机器 | 两种取值 + 对照 | P0 |
| TC-062 | F 机读块与闸门 | §3.2.2④ / §1.5 | probe 的 arms/delta 必须为 null；gate 的不得为 null | 负 | 集成 | 机器 | 改块形态 | P0 |
| TC-063 | F 机读块与闸门 | §3.2.2③ / R8 | 出生即 frozen（无通过留痕）→ 码 4；有留痕 → 通过 | 负 | 集成 | 机器 | 改块 + 删账本 | P0 |
| TC-064 | F 机读块与闸门 | R7 / §3.3-5⑦ | benchmark.enabled 非 true → 码 4、不跑 | 负 | 集成 | 机器 | 改 yaml + dry-run | P0 |
| TC-065 | F 机读块与闸门 | §3.3-5⑥（⑥-1…⑥-4：源目录 → 物化 → 字面值存在 → `skills[].path` + `apply_diff` 层级）/ §3.2 / §3.2.1（路径单一基准）/ R5 | 源目录缺失（⑥-1，两个源目录 `checkbox-demo` / `command-swap-demo` 都查）/ 物化后 `repo_fixture` 字面值不存在（⑥-3）/ `apply_diff` 缺失（⑥-3）/ `skills[].path` 不存在（⑥-4）→ 码 4（validate 与工具 dry-run 会静默放过的对照）；**五类路径一律按 `evals/` 单一基准解析** | 负 | 集成 | 机器 | 改路径 + 三命令对照（`$evalsDir`） | P0 |
| TC-069 | F 机读块与闸门 | §3.2.1（相对路径单一基准）/ §3.2 / §3.3-1（`repoRoot` 推导）/ §3.1（物化路径）/ §4 步骤 0 | 五类路径同一基准 = `evals/`——`skills[].path` 写 `../skills/review-triage`、`cases.files` / `oracle` / `context.git.apply_diff` 写 `review-triage/…`、`context.repo_fixture` 写 `../.session/eval/fixture/review-triage/<repo-name>`，且工具**真解析到**（正向观测）；故障注入副本必须两层同构 | 正 | 集成 | 机器 | 字面值分类比对 + 副本同构自检 + 产物出现 case-id | P0 |
| TC-072 | F 机读块与闸门 | §3.2.1（键白名单）/ §3.2.2④ | `expect.exit_code` / `expect.files_exist` / `expect.files_not_exist` / `judge.tool_called` / `output_contains.not` / `cases.defaults.expect` → 码 4（白名单外的键不得使用） | 负 | 集成 | 机器 | 加白名单外的键 + dry-run | P0 |
| TC-073 | F 机读块与闸门 | §3.2.2② / §3.2.1（title 唯一） | `title` 重名 → 码 4（多重集与集合比较都会放过，只有唯一性检查能拦） | 负 | 集成 | 机器 | 两用例同名 + dry-run | P0 |
| TC-074 | F 机读块与闸门 | §3.2.2③ / R8（状态迁移）/ R10 | `assert_hash` 或 `arms_snapshot` 与现块不一致 → 码 4（reason=配置错误），不得降级 `calibrated` 继续跑 | 负 | 集成 | 机器 | 改块后不更新 ledger + dry-run | P0 |
| TC-066 | C fixture 与素材 | R5 / §1.5（fixture 仓库）/ §4 步骤 0 | `apply_diff` 写到 `context` 顶层（层级错）→ 补丁不生效、工作区无 `.git`，用例不合格 | 负 | 集成 | 机器+人工 | 构造错层级 + 临时工作区 `git status` | P0 |
| TC-067 | C fixture 与素材 | R5 / §1.5（fixture 仓库）/ §4 步骤 0 | fixture 无 baseline 提交（只 `git init` 或没有 `.git`）→ `git log` 无提交、`git diff` 为空，用例不合格 | 负 | 集成 | 机器 | 临时仓库 init + `git diff` / `git status` | P0 |
| TC-068 | C fixture 与素材 | R4-④ / R10 / §3.5 / §1.5（正例证据词） | 用例 01 的 `must_contain` 只有结论词、缺证据词 → 用例不合格 | 负 | 单元 | 机器 | yaml 词表 + 构造句离线判定 | P0 |
| TC-075 | C fixture 与素材 | §3.3-5⑥（执行顺序）/ R5 / §4 步骤 0（自查④） | 补丁与 fixture 不对齐 → 物化后 `git apply --check` 非 0 → 码 4（工具会静默跳过，把空场景结论记到技能头上） | 负 | 集成 | 机器 | 篡改补丁 + dry-run | P0 |
| TC-032 | G runner 与结论边界 | §3.3-2 / §3.3-5（产物定义）/ §3.3-5⑥ / §3.3-5⑧ | SKILL_UP_BIN 优先且 dry-run 走通（①–⑨ 各打真实性标记，⑧ 含「机读块 ①–④ + `iteration_min`」与「`fixtures/CONTRACT.json` 哈希」两半；不写 `<output-dir>`/`verdict.md`；允许物化 fixture） | 正 | 集成 | 机器 | 设环境变量 + dry-run | P0 |
| TC-033 | G runner 与结论边界 | §3.3-2 / §3.3-6 / §7-7 | 二进制找不到必须退出码 2 并给安装指引 | 负 | 集成 | 机器 | 伪造路径 + 清洗 PATH | P0 |
| TC-034 | G runner 与结论边界 | §3.3-2 / §3.3-6（二维表③④）/ §7-7 | 表外码 5 原样透传；工具退 0 但无 `benchmark.json` → 码 2 + `INVALID_ENV` | 正 | 单元 | 机器 | `.mjs` 桩替换二进制 | P0 |
| TC-035 | G runner 与结论边界 | §3.3-6 / §3.3-7 | 非 0 不得解释成技能坏了（运行期失败必产 verdict 行） | 负 | 单元 | 机器 | 桩 + verdict 行断言 | P0 |
| TC-036 | G runner 与结论边界 | R9 / §5⑦ / §3.3-7 / §7-8 | stdout 与 verdict.md 两处都带五要素（dry-run 显式 `engine_version=n/a`）+ 模型账三元组 | 正 | e2e | 机器 | 两处文本断言 + 账本核对 | P0 |
| TC-037 | G runner 与结论边界 | R9 / §3.3-7 | 出现第三方模型名时 0 外推句 | 负 | 单元 | 机器 | verdict.md 交叉扫描 | P0 |
| TC-038 | G runner 与结论边界 | §7 执行环境 / §3.3-6（码 2 凭据分支）/ §3.3-7 | 无凭据 → 码 2 + INVALID_ENV；validate/dry-run 仍走通；**工具码 1 + 数据完整 + 认证 stderr → 码 2（凭据分支优先于二维表①）** | 边界 | 集成 | 机器+人工 | 清空凭据后三命令对照 + 认证桩 | P1 |
| TC-047 | G runner 与结论边界 | §7-10 / §3.3-6 / §3.2.2 / §1.5 | run-eval.mjs 单测覆盖六件必测事（含 run 三态、verdict 五值） | 正 | 单元 | 机器 | `node --test` | P0 |
| TC-048 | G runner 与结论边界 | §3.3-6（退出码表 / 二维表 / 凭据分支 / 跨行取码）/ §3.3-5①–⑨ / §7-6 / §7-10 | 退出码五种码位各就位 + 二维表 b1/b2/b3（认证 stderr 覆盖）+ 首个失败项取码 + 跨行 `2>3>1>0` + **取码集合只算 gate 行** + 表外码透传 | 边界 | 单元 | 机器 | 映射函数 + 场景抽样 | P1 |
| TC-076 | G runner 与结论边界 | §3.3-6（二维表②）/ §3.3-7 | 工具码 2/3 + 有数据 → 以工具为准：`INVALID_ENV`、runner 码取工具码、行内留 `exit=` | 边界 | 单元 | 机器 | 桩「写数据后 exit 2 / 3」 | P0 |
| TC-077 | G runner 与结论边界 | §3.3-6（二维表④）/ §3.3-7 | 工具码 5 + 有数据 → 原样透传 5，仍按 L1/L3 出 verdict 行 | 边界 | 单元 | 机器 | 桩「写数据后 exit 5」 | P0 |
| TC-039 | H 事前预期与越界 | R10 / §5④ / §3.2.2 | `expected.md` 机读块 v2 与 §3.2.2 示例逐条对账（实测数字引 R10）；时间统一 UTC | 正 | e2e | 机器 | 对账文件 + timestamp/mtime | P0 |
| TC-040 | H 事前预期与越界 | R10 / §6-1 / §5⑥ / §3.3-7 | calibrated gate 未达 → INVALID_ASSERT，技能零改动 | 负 | e2e | 机器 | 产物桩 + 临时副本 | P0 |
| TC-041 | H 事前预期与越界 | §6-1 / §5⑥ | 改 SKILL.md 迁就用例即违规（关键判据词逐词在位） | 负 | 集成 | 机器+人工 | skills diff + 逐词扫描 | P0 |
| TC-042 | H 事前预期与越界 | R8 / §8 / §6 | 本轮只允许 review-triage 一个技能目录且不建 CI | 负 | 集成 | 机器 | 目录与 workflow 扫描 | P0 |
| TC-043 | H 事前预期与越界 | §3.3-5③ / §3.3-6 | cases 为空不得静默当成功（退出码 3） | 边界 | 集成 | 机器 | 临时副本置空 cases + dry-run | P1 |
| TC-044 | H 事前预期与越界 | §3.2 / §3.3-5② | eval.yaml 语法错 → runner 码 4 且指行 | 边界 | 单元 | 机器 | 临时副本注入坏行 | P1 |
| TC-070 | I 契约脚本（A1） | §1 影响面④ / §3.4（禁词双向留痕 + 改判据必跑 A1）/ §3.1（responses 唯一授权用途）/ §3.3-5⑧（变更期闸门）/ §4 步骤 9 / §5⑩ / §6-13 / §7-11 | A1 脚本 0 findings，且能拦「机读块断言集被改坏 / `title` 重名 / 禁词留痕造假」三类；不读产物目录、不产 verdict、不进 `npm run check`；**改判据不重跑 A1 → runner 启动前 ⑧ 码 4** | 负 | 集成 | 机器 | 直接 `node` 跑 + 三类注入 + 变更期闸门 | P0 |
| TC-078 | I 契约脚本（A1） | §3.4（A1 写 `CONTRACT.json`）/ §3.3-5⑧（`CONTRACT.json` 三分量）/ §5⑩ | `fixtures/CONTRACT.json` 字段齐（`schema` / `checked_at` / `exit` / `files`）且 `files` 记录的 sha256 与当前文件逐个相等；篡改任一文件或删掉快照 → 码 4 | 负 | 集成 | 机器 | 哈希复算 + 篡改注入 | P0 |
| TC-079 | D L1 稳定性 | §1.5（run 三态：`runs[].result.passed/total`）/ §3.3-6 / §3.3-7 | 桩把 `passed` / `total` 写在 run 顶层（不是 `result` 下）→ 该 run 必须判 `undetermined`、stdout 保留原始值，**不得静默当 `full`** | 负 | 单元 | 机器 | 错位字段桩 + 判定函数 | P0 |
| TC-080 | G runner 与结论边界 | §3.3-7（异常明细段：全文末段）/ §7-8 / §5⑦ | 正常路径下 `verdict.md` 必有「## 异常明细」段且正文恰为「无」；切片 = 该标题到**文件末尾** `Trim()`；删段 / 空段 / 段排在逐用例行之前均判失败 | 正 | 集成 | 机器 | 干净产物桩 + 段级正则切片 | P0 |
| TC-081 | G runner 与结论边界 | §3.3-6（二维表③：坏产物）/ §3.3-7（`iteration=n` 与 `n/a`、明细①）/ §5⑨ | 坏 `benchmark.json` 四种坏形态 + 全坏档（a–e 共 5 档）一律跳过：不计入 `iteration=`（全坏写 `n/a`）、明细按 `detail-kind=skipped-benchmark` 计数并附路径 + 非空原因、③ 归 `INVALID_ENV` / 码 2 | 负 | 单元 | 机器 | 四种坏形态 + 全坏档桩（a–e 共 5 档） | P0 |
| TC-082 | G runner 与结论边界 | §3.3-6（二维表③：`configuration` ∉ 两臂）/ §3.3-7（明细②）/ §5⑥ | unknown `configuration` 的 run 不得计入任一臂、不得写成 `VALID`：整轮 `INVALID_ENV` / 码 2，明细列 `eval_name` + `configuration` 原文 | 负 | 单元 | 机器 | 桩写 `baseline` / 拼错值 | P0 |
| TC-083 | G runner 与结论边界 | §3.3-6（二维表③×④「透传优先于 ③」）/ §3.3-7（明细②）/ §5⑨ | 工具码 5（表外）+ 存在 unknown run → 退出码严格 5（不得被 ③ 改写成 2）、verdict 行仍在且按 L1/L3、明细仍列 unknown | 边界 | 单元 | 机器 | 桩「写 unknown 数据后 exit 5」 | P0 |
| TC-084 | G runner 与结论边界 | §3.3-6（③ 的落点）/ §3.3-7（probe 行内信号不改码）/ §5⑥ / §5⑨ | unknown 只出现在 probe → 只落行内 `INVALID_ENV` + 明细，整轮退出码仍 0（码 0 只看 gate） | 边界 | 单元 | 机器 | 桩「只给 01 加 baseline run」 | P0 |
| TC-085 | G runner 与结论边界 | §3.3-7（明细③：`undetermined` 的 run + 原始值）/ §3.3-6（`undet=`）/ §5⑥ | `undetermined` 的 run 必须进明细：`eval_name` + `configuration` + 原始 `passed,total`，按 `detail-kind=undetermined-run` 计数；结论仍可为 `VALID` / 码 0（stdout 侧只保留既有义务，不要求与明细同源） | 边界 | 单元 | 机器 | 三迭代桩（1 个空值 run） | P0 |
| TC-086 | G runner 与结论边界 | §3.3-7（明细④：超时三支 + `scope`）/ §3.3-6（超时信号与失败行定义）/ §7-8 / §5⑨ | 超时三支（session-result `exit_code:124` 逐 run / stderr 命中 timeout 整轮 / 墙钟超阈 整轮）均判超时：失败行 `timeout=是`、明细按 `detail-kind=timeout` 计数并写 `scope=run\|整轮`，三档记录可区分 | 边界 | 集成 | 机器 | a/b 快桩（两个 output-dir）+ c 纯函数或夜间慢桩 | P0 |
| TC-087 | F 机读块与启动前闸门 | §3.2（`skills[].path`）/ §3.3-5⑥-4 / §3.3-1（注入绝对值） | `skills[].path` 用单引号（合法 YAML）不得被 ⑥-4 误判「路径不存在」；注入后值为纯绝对路径；单 / 双 / 无引号三形态等价 | 正 | 集成 | 机器 | 同构副本改引号 + dry-run + 桩捕获注入 | P1 |
| TC-088 | F 机读块与启动前闸门 | §3.3-5⑥-4（复数 `skills[].path`）/ §3.2 / §3.3-5 | 第二条 `skills[].path` 为空（`''` / `null`）/ 目录不存在 / 缺 `SKILL.md` → ⑥-4 在 `--dry-run` 即码 4，不得只查第一条 | 负 | 集成 | 机器 | 同构副本追加第二技能条目 | P0 |
| TC-089 | G runner 与结论边界 | §3.3-7（明细⑤ `runtime-env-fail`）/ §3.3-6（码 2 凭据分支）/ §7-8 | `INVALID_ENV` 但 ①–④ 皆不命中（认证失败）→ 明细必须写 `detail-kind=runtime-env-fail` + `exit=` + 命中证据，退出码 2 | 正 | 单元 | 机器 | 认证桩（写完整数据后 exit 1 + 认证 stderr） | P0 |
| TC-090 | G runner 与结论边界 | §3.3-7（明细⑤：`INVALID_ENV` 行不得写「无」）/ §3.3-7（「无」的定义 = 五类皆 0 条）/ §7-8 | 存在 `verdict=INVALID_ENV` 行时明细正文写「无」→ **判红**（自相矛盾）；必须至少一条前四类或 `runtime-env-fail` | 负 | 单元 | 机器 | TC-089 场景 + 手改成「无」的反例 | P0 |
| TC-091 | G runner 与结论边界 | §3.3-7（多类命中合并成一条、空格分隔多个 `detail-kind=`） | 同一 run 同时命中 unknown 配置 + undetermined → **1 条**，同一条里出现两个 `detail-kind=` | 正 | 单元 | 机器 | 双命中桩（`configuration: baseline` + `passed/total: null`） | P0 |
| TC-092 | G runner 与结论边界 | §3.3-7（不得拆成多条，否则条数不可计数） | 把 TC-091 的同一条拆成两条 → **判红**（条数按 `detail-kind=` 出现次数计） | 负 | 单元 | 机器 | TC-091 数据 + 拆行反例 | P0 |
| TC-093 | G runner 与结论边界 | §3.3-6（失败行定义：工具码 0 → 一律 `timeout=否`） | 工具退 0（数据完整）但 stdout / stderr 出现 `timeout` 字样 → `timeout=否`，不得误判超时，退出码 0 | 负 | 单元 | 机器 | 桩「写完整数据 + 打印 timeout 字样 + exit 0」 | P0 |
| TC-094 | G runner 与结论边界 | §3.3-6（信号作用域：②③ 整轮 → 所有失败行 `timeout=是`；明细写 `scope=整轮`、不写用例名）/ §3.3-7（明细④） | stderr 命中 timeout（整轮信号）→ 所有失败行 `timeout=是`；明细 1 条含 `detail-kind=timeout` + `scope=整轮`，且不含任何 `eval_name` | 边界 | 单元 | 机器 | 整轮信号桩（exit 1 + stderr timeout） | P0 |
| TC-095 | G runner 与结论边界 | §3.3-6（`probe` 行超时只记行、不改退出码）/ §3.3-7（probe 行内信号） | probe 行命中超时 → 该行 `timeout=是` + `INVALID_ENV`，gate 仍 `VALID`，退出码严格 0 | 边界 | 单元 | 机器 | 桩「01 写 session-result 124 + exit 1，02 数据完整」 | P0 |
| TC-096 | G runner 与结论边界 | §3.3-6（二维表⑤：工具码 4 + 数据完整） | 全 VALID + 工具退 4 → runner 码严格 4（不得退 0）、gate 行 `verdict=INVALID_ENV` 且行内保留 `exit=4`、明细 `detail-kind=runtime-env-fail` | 正 | 单元 | 机器 | 桩「写完整数据后 exit 4」 | P0 |
| TC-097 | G runner 与结论边界 | §3.3-6（二维表③ 覆盖工具码 ∈{0..4}：码 4 + 数据不完整 → 取码 2） | 工具码 4 + 数据不完整（迭代目录数不足）→ 按 ③ 取码 **2**、`INVALID_ENV`；不得取 4 | 边界 | 单元 | 机器 | 桩「只写 iteration-1 后 exit 4」 | P0 |
| TC-098 | G runner 与结论边界 | §3.3-6（取码集合为空的全 probe 套件：有 `benchmark.json` → 3；一个都没有 → 2） | 全 probe 套件：a) 有 `benchmark.json` → 码严格 3；b) 一个都没有 → 码严格 2 | 边界 | 单元 | 机器 | 副本把两条用例都改 `probe` + 两档数据 | P0 |
| TC-099 | G runner 与结论边界 | §3.3-7（异常明细段必须是全文末段）/ §7-8 | 把明细段排在逐用例行**之前** → **判红**（切片到文件末尾会把逐用例行卷进「明细」） | 负 | 单元 | 机器 | 合法 verdict.md + 段序调换反例 | P0 |
| TC-100 | G runner 与结论边界 | §3.3-7（单行约束：换行/回车/制表/控制字符转义成 `\n`/`\r`/`\t`/`\uXXXX`）/ §7-8 | `configuration` 或路径含 `\n## ` 或 `\n<eval_name>: role=… verdict=VALID` → 明细仍单行、不得伪造段标题或逐用例行 | 负 | 单元 | 机器 | 注入桩（configuration 含换行伪串） | P0 |

> **覆盖总表注**：spec §2 的 R1–R10 与 §6 硬约束**同为不可违反**；§6 只列「违反后不可回滚」的项。两条清单是同一个「不可违反」语义的两处表述，不是两套标准。

**覆盖核对**：本表 **100** 行 = 用例总数 **100**（逐行清点一致：v9 的 88 + v10 新增 12 = 100）。spec §5 验收锚点 10 条全覆盖（①→TC-001/002/005/065/069；②→TC-006/007/045；③→TC-008/009/047；④→TC-029/030/039/040/049/050；⑤→TC-011/012/013/015/016/046/061/068/070/072/073；⑥→TC-027/028/040/041/051/052/071/076/077；⑦→TC-036/037/080；⑧→TC-010/021/024；⑨→TC-032/038/045/048/053~065/074/075/078/079/081/082/083/084/086/089~098；⑩→TC-070/078）。R1–R10 全覆（R1→TC-001/002/004/005/069；R2→TC-008/009；R3→TC-006/007/010/045；R4→TC-011~019/046/059/068；R5→TC-020~025/065/066/067/069/075；R6→TC-026/027/028/031/048/052/071/079；R7→TC-029/030/064；R8→TC-042/049/063/074；R9→TC-036/037；R10→TC-031/039/040/049/068/074）。§7 测试项 1–11 全覆盖（1→TC-001/005；2→TC-006/007/010/045；3→TC-008/009；4→TC-011~019/046/068；5→TC-020~023/065/066/067/069/075；6→TC-026~028/030/031/043/048/049~052/071/076/077/079；7→TC-033/034/035/043；8→TC-036/037/080~086/089~096/099/100；9→TC-008/024；10→TC-047；**11→TC-070/078**）。**§3.2.2 启动前核对 ①–⑦ 逐条有阻断用例**（①→TC-053；②→TC-054/TC-073；③→TC-055/TC-063/TC-074；④→TC-056/TC-062/TC-072；⑤→TC-057/TC-058；⑥→TC-059/TC-069/TC-075；⑦→TC-060/TC-071）。**§3.3-5⑧ 的两半各有断言**（机读块 ①–④ + `iteration_min`→TC-032；`CONTRACT.json` 存在/`exit===0`/哈希一致→TC-032/TC-070 ⑧/TC-078）。**§3.3-5⑥ 的五步各有阻断用例**（⑥-1 源目录→TC-065 a/a′；⑥-2 物化→TC-032 ⑨ / TC-022；⑥-3 物化后 `repo_fixture`/`apply_diff` 存在→TC-065 b/c、TC-075 前置；⑥-4 `skills[].path` + `apply_diff` 层级→TC-065 d、TC-066、TC-087（引号形态）、TC-088（复数逐条）；⑥-5 `rev-parse HEAD` + `git apply --check`→TC-075、TC-022 ⑤），且每档都断言失败单行带失败项编号。**单一 `evals/` 基准各有断言**（`skills[].path` = `../skills/<技能名>`、`cases` / `oracle` / `apply_diff` = `review-triage/…`、`repo_fixture` = `../.session/eval/fixture/…`，全部相对 `evals/` → TC-002 ③、TC-069 ②③④、TC-022、TC-065；`CONTRACT.json` 的 `files` 键另行按仓库根相对 → TC-078 ②）、**副本两层同构有断言**（→TC-069 ⑥）。**§3.3-6 二维表逐格有断言**（①→TC-048 b1；①'→TC-048 b2；①''（认证 stderr 覆盖）→TC-038 ⑪/TC-048 b3；②→TC-076；③→TC-048 c/g1、TC-051、TC-071、TC-081（坏产物）、TC-082（unknown 配置）、TC-083（③×④ 交叉）、TC-084（probe 侧）；④→TC-048 f、TC-034、TC-077；**⑤（工具码 4 + 数据完整）→TC-096、TC-097（码 4 + 数据不完整 → 按 ③ 取 2）**；**取码集合为空的全 probe 套件→TC-098**；**超时信号作用域（逐 run / 整轮 / probe 不改码 / 工具码 0 一律否）→TC-086、TC-093、TC-094、TC-095**；跨行取码→TC-048 g3（含 gate 3 + probe 2 混行））。**verdict 五值逐个被断言到**（VALID→TC-027/050/051；INVALID_FLAKY→TC-028/052（**均含「无更高优先级时」限定**）；INVALID_ENV→TC-034⑤/035/038/051/071/076；INVALID_ASSERT→TC-040/050；INVALID_DELTA→TC-049/050）。**§3.1 的 responses 边界有执行入口**（→TC-070，唯一授权机器用途 = A1 离线核对留痕）；**§3.1 的源目录/物化路径分工有断言**（源目录不带 `.git`→TC-020；字面值 = 物化路径→TC-022 ②d/TC-069；物化顺序→TC-022 ④/TC-065/TC-075）。**v9 增量覆盖（2026-10-23）**：§3.3-7「异常明细」段按五类分别落佐证——段存在与「无」→TC-080，第①类（被跳过的 `benchmark.json`）→TC-081，第②类（unknown `configuration`）→TC-082/083/084，第③类（`undetermined` 的 run）→TC-085，第④类（超时信号）→TC-086，第⑤类（`runtime-env-fail`）→TC-089/090（**⑤ 为 v10 补**，v9 只覆盖前四类）；§3.3-6 ③ 的 fail-closed 与「④ 透传优先于 ③」→TC-082/083；§7-8 →TC-080/085/086。未覆盖 0 条；§8「不在这一轮」六项按 R8 不测（见 §6）。
> **v10 增量覆盖（2026-10-23 第 2 次改写）**：§3.3-7 明细第⑤类 `runtime-env-fail` → TC-089（正）/ TC-090（`INVALID_ENV` 行 + 「无」必须判红）；多类合并成一条 → TC-091（正）/ TC-092（拆行判红）；明细段「全文末段」→ TC-080（切片改到文件末尾）/ TC-099（段序调前判红）；单行转义 → TC-100；§3.3-6 超时作用域 → TC-086（逐 run + 整轮）/ TC-094（`scope=整轮`、不含用例名）/ TC-095（probe 超时不改码）/ TC-093（工具码 0 → `timeout=否`）；二维表格 ⑤ → TC-096（码 4 + 完整）/ TC-097（码 4 + 不完整 → 2）；全 probe 取码 → TC-098。**§3.3-6 二维表 ①–⑤ 与「取码集合为空」两句逐格不再有空格子**（⑤ 此前无格，本轮补齐）。
> **三分类定义（C5，供独立复判）**：**正例** = 合规实现（按现行 spec 实现）应当**通过**；**负例** = 实现违规时**必须被这一条抓住**（判红），合规实现应通过；**边界** = 恰好踩在阈值 / 空值 / 极值 / 作用域分界上的一格（两侧取值都要断言，或同一构造下换一个取值即翻结论）。

**待用户授权（D1）**：TC-050 的全 probe 无产物 → 退出码断言**待用户授权后补**（属既有用例改动，超出本轮增量授权）；本轮只在 TC-098 侧覆盖「取码集合为空」这一格，**TC-050 本体未改**。

**计数字典（正文实际条数，交前已复算）**：明细小节 `### TC-` 标题 **100** 个；覆盖总表 **100** 行；正 26 / 负 50 / 边界 24（逐条清点见 §3 末），与上述两处逐一相等。

## 2 用例明细

分组索引：A 位置与产物 = TC-001~010、TC-045；B 断言质量与 L2 = TC-011~019、TC-046、TC-057~059、TC-061；C fixture 与素材 = TC-020~025、TC-066~068、TC-075；D L1 稳定性 = TC-026~028、TC-051、TC-052、TC-071、**TC-079**；E L3 差值 = TC-029~031、TC-049、TC-050；F 机读块与启动前闸门 = TC-053~056、TC-060、TC-062~065、TC-069、TC-072~074、**TC-087、TC-088**；G runner 与结论边界 = TC-032~038、TC-047、TC-048、TC-076、TC-077、**TC-080~TC-086、TC-089~TC-100**；H 事前预期与越界 = TC-039~044；**I 契约脚本（A1）= TC-070、TC-078**。**明细按 TC 编号排列，分组以本索引与覆盖总表为准。**

### TC-001 evals 目录结构就位（含 `evals/review-triage/fixtures/oracle/`）且与 skills 隔离

- **覆盖**：`R1 / §3.1 / §5① / §7-1`
- **前置**：施工步骤 1–2 已完成（`evals/review-triage/` 与两条例、fixture 目录、`evals/review-triage/fixtures/oracle/` 两份手写样本已在工作区）。
- **步骤**：① `Test-Path evals/review-triage/eval.yaml`；② `Test-Path evals/review-triage/cases/01-checkbox-mechanical.yaml` 与 `02-command-swap-semantic.yaml`；③ `Test-Path evals/review-triage/fixtures/oracle/01-checkbox-mechanical.md` 与 `02-command-swap-semantic.md`；④ `Get-ChildItem skills -Recurse -Directory -Filter evals`；⑤ `Get-ChildItem evals -Recurse -Filter SKILL.md`；⑥ 记录 `node -e "import('./scripts/skill-dir.mjs').then(m=>console.log(m.listSkillDirs('skills').length))"` 的施工前基线与施工后值。
- **预期**：①②③ 全部 `True`；④ 无输出；⑤ 无输出（`evals/` 下不含 `SKILL.md`，不会被当成技能包）；⑥ 两次计数相同。
- **判据**：机器——①~③ 全 `True`，④⑤ 输出行数均为 0，⑥ 两次数字相等；四项同时成立，任一不成立即失败。
- **红绿证据**：红 = 施工前 `Test-Path evals/review-triage/eval.yaml` 为 `False`；绿 = 施工后四项全过。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 `npx skills add` 的真实安装清单（结构断言是代理证据，见 §5）。

### TC-002 eval.yaml 指向仓库内真技能、`skills[].path` 相对 `evals/`（`../skills/review-triage`）、model 用占位模板不写死模型名

- **覆盖**：`R1 / §3.2（skills[0].path 行）/ §3.2.1（路径单一基准）/ §3.3-1（repoRoot 推导与注入）/ §5①`
- **前置**：`evals/review-triage/eval.yaml` 已存在；**步骤 0 先 `Set-Location <仓库根>`**（下面所有 `Resolve-Path` / `Select-String` 都按会话 cwd 解析，不固定 cwd 就无法复算；§3.3-1 规定 runner spawn 时显式传 `cwd: repoRoot`，测试侧必须对齐同一 cwd）；再算 `$evalsDir = (Resolve-Path (Join-Path (Split-Path evals/review-triage/eval.yaml -Parent) '..')).Path`，断言其**末级目录名为 `evals`**（§3.3-1：该目录末级不是 `evals` → 码 4）；再算 `$repoRoot = (Resolve-Path (Join-Path $evalsDir '..')).Path`，断言 `$repoRoot` = 仓库根（末级是仓库目录名）。
- **步骤**：① `Select-String -Path evals/review-triage/eval.yaml -Pattern '^\s*source:\s*local_path\s*$'`；② **runner 侧解析**：取出 `skills[0].path` 的字面值，按 `$evalsDir` 展开成绝对路径，断言 `Test-Path <结果>/SKILL.md`；③ **基准断言（两件事分开）**：断言 ② 的**字面值逐字 = `../skills/review-triage`**——**相对 `evals/` 目录**（§3.2.1 单一基准，spec `skills[0].path` 行）；**不得**写成仓库根相对的 `skills/<技能名>`（按 `evals/` 解析会变成 `evals/skills/review-triage`，不存在），也**不得**写成 `../../skills/review-triage`（两层回跳越过仓库根），也**不得**写成 `.`（解析成 `evals/` 本身，§3.2 已知缺口）；**并且**用 `node scripts/run-eval.mjs review-triage --dry-run` 打印的完整命令行，断言注入后的 `skills[].path` 是**绝对路径**、`[IO.Path]::IsPathRooted()` = `True`、规范化后等于 `<仓库根>\skills\review-triage`（工具只看到绝对值，§3.3-1）；④ `Select-String -Pattern '\{provider\}|\{name\}'`；⑤ `Select-String -Pattern 'claude-[a-z0-9\.\-]+|anthropic|glm|GLM'`；⑥ `Select-String -Pattern '^\s*path:\s*\.\s*$'`。
- **预期**：① 命中 1 行；② `True`；③ 字面值**逐字** = `../skills/review-triage`，且注入值为绝对路径并指向 `<仓库根>/skills/review-triage`；④ 命中 ≥1；⑤⑥ 0 命中。
- **判据**：机器——① 命中 ≥1、② `True`、③ 两件事（字面值 = 相对 `evals/` 的 `../skills/review-triage` + 注入值 = 绝对路径）同时成立、④ 命中 ≥1、⑤⑥ 命中数 = 0。**② 与 ③ 必须分开断言**：② 只证明「按 `evalsDir` 基准能解析到」，③ 才证明「yaml 里写的是 `../skills/…`、且 runner 真把它注入成绝对值」。**五类路径同一基准 = `evals/`**（§3.2.1）：`skills[].path`、`cases.files`、`oracle`、`apply_diff`、`repo_fixture` 全由 `evalsDir` 解析；`repoRoot` 只用于 spawn 的 cwd 与 `CONTRACT.json` 键。**若测试脚本用 cwd / `eval.yaml` 所在目录 / 技能根给 `skills[].path` 另算一套**，写错基准的 yaml 也能过 ②——这正是要禁的形态。
- **红绿证据**：红 = 沿用试跑版写死 `anthropic` / `claude-sonnet-4-6`（validate 虽过但 runner 无从注入真实模型）；或把 `path` 写成仓库根相对的 `skills/<技能名>`（按 `evals/` 解析成 `evals/skills/…`，路径不存在）；或写成 `../../skills/review-triage`（越过仓库根）；或写成 `.`（解析成 `evals/`，validate 不拦，§3.2 已知缺口）；绿 = 模板占位 + `../skills/review-triage` + `--dry-run` 里注入值为 `<仓库根>/skills/review-triage` 的绝对路径（§3.3-1 / §3.3-4 启动前替换）。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证引擎能否真加载该目录（TC-032 管）；注入后写回是否正确由 TC-047f 管；`cases.files` / `context.repo_fixture` / `context.git.apply_diff` / `oracle` 的同基准与「工具真解析到」由 TC-069 管；`<eval.yaml 所在目录>/..` 的末级不是 `evals` 的失败分支不在本条构造（runner 按 §3.3-1 直接码 4；TC-065 未单独构造该分支，其 a/b/c/d 只覆盖路径缺失）。

### TC-003 eval.yaml 固定契约字段齐全

- **覆盖**：`§3.2`
- **前置**：`eval.yaml` 已存在。
- **步骤**：逐条跑 `Select-String -Path evals/review-triage/eval.yaml -Pattern <模式>`：① `^\s*schema_version:\s*v1alpha1\s*$`；② `environment:` 下 `type:\s*none`；③ `timeout_seconds:\s*240`；④ `max_turns:\s*8`；⑤ benchmark 段 `enabled:\s*true`；⑥ `formats:` 含 json 与 html 两项；⑦ `engine:` 下 `name:\s*claude_code`；⑧ `engine.model` 含 `{provider}` 与 `{name}`；⑨ `cases.files` 指向 `review-triage/cases/01-….yaml` 等**相对 `evals/` 目录**的路径（§3.2.1 单一基准；不得写仓库根相对的 `evals/review-triage/…`，也不得再带两层回跳）。
- **预期**：九条模式各命中 ≥1 行，无缺失。
- **判据**：机器——九条全部有命中；任一 0 命中即失败并输出缺失字段名。
- **红绿证据**：红 = 施工前文件不存在，九条全 0 命中；绿 = 施工后九条全命中。
- **对应测试**：待 plan Task N
- **不覆盖**：不校验这些值是否被 skill-up 真正采用（TC-032/034 覆盖）。

### TC-004 skills[].path 写成 `.` 的已知缺口必须被登记

- **覆盖**：`R1 / §3.2（已知缺口段）/ §5①`
- **前置**：`eval.yaml` 已存在且 `skills[0].path` = `../skills/review-triage`（相对 `evals/`，TC-002）；有可用 skill-up 二进制（`SKILL_UP_BIN` 或 PATH）。
- **步骤**：① 按前置约定 ③ 建**两层同构**副本：`$t = Join-Path $env:TEMP 'eval-dot-path'; New-Item -ItemType Directory -Force "$t/evals" | Out-Null; Copy-Item -Recurse evals/* "$t/evals/"; New-Item -ItemType Directory -Force "$t/skills" | Out-Null; Copy-Item -Recurse skills/review-triage "$t/skills/review-triage"`；② **替换前先断言命中**：`$p = "$t/evals/review-triage/eval.yaml"`；`(Select-String -Path $p -Pattern '(?m)^\s*path:\s*\.\./skills/review-triage\s*$').Count` 必须 **= 1**（**0 命中 = 构造失败，判本条失败、禁止空转继续**；≥2 同样判失败——说明有多处 `path:` 命中，替换目标不唯一）；③ 把该行替换成 `path: .`（用 `[IO.File]::WriteAllText($p,$t2,(New-Object Text.UTF8Encoding $false))` 写回，避免 BOM）；④ **替换后复读**：断言 `(Select-String -Path $p -Pattern 'path:\s*\.\./skills/review-triage').Count` **= 0**、`(Select-String -Path $p -Pattern '(?m)^\s*path:\s*\.\s*$').Count` **= 1**（否则替换没生效，后面的 validate 结论无意义）；⑤ `& $env:SKILL_UP_BIN validate "$t/evals/review-triage/eval.yaml"`；⑥ `$LASTEXITCODE`；⑦ 对照：对真仓库 `evals/review-triage/eval.yaml` 也跑一次 validate。
- **预期**：② = 1（构造成立）；④ 两条分别为 0 与 1（替换真实发生、非空转）；⑤ 退出码 **= 0**（已知事实：`skills[].path: .` 不被 validate 拒绝，spec §3.2 实测 exit 0）；⑦ 也为 0。
- **判据**：机器——② = 1 **且** ④（0 / 1）成立 **且** ⑦ = 0（基线）；再跑 ⑤：若 = 0 属预期，此时必须核对 spec §3.2「已知缺口」段已登记该缺口、且全文未把「工具会拦住」写成判据；若 ⑤ 非 0（工具未来版本拒绝），记录实际行为并更新缺口描述。**任一情况下，② ≠ 1 或 ④ 不成立（空转）、缺口登记缺失、写成「工具会拦住」，三者任一即判失败**（该缺口只能靠 §5① 结构断言 + TC-065 的闸门 ⑥ 兜住）。
- **红绿证据**：红 = 拿「⑤ 非 0」当预期写进用例（自证伪）；或 `path:` 字面值早已不是 `../skills/review-triage`（例如施工改成了别的写法）却照样「替换 + 跑一遍」——替换空转，validate 的 0 与 `path: .` 无关；绿 = ② 命中 1 次 → 替换 → ④ 复读确认 → 预期与已知事实对齐（=0）+ 缺口已登记。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证其他 path 写法（§3.2 只固定本轮取值）。
- **凭据**：validate 不需要模型凭据。

### TC-005 evals 副本落进技能目录必须被结构断言检出

- **覆盖**：`R1 / §5①`
- **前置**：`evals/` 与 `skills/` 已就位。
- **步骤**：① `$t = Join-Path $env:TEMP 'eval-skill-pollution'; New-Item -ItemType Directory $t`；② `Copy-Item -Recurse skills "$t/skills"`、`Copy-Item -Recurse evals "$t/evals"`；③ 注入：`Copy-Item -Recurse "$t/evals" "$t/skills/review-triage/evals"`；④ 在副本上跑 `Get-ChildItem "$t/skills" -Recurse -Directory -Filter evals`；⑤ 删除注入目录后重跑 ④。
- **预期**：④ 有输出（检出注入目录）；⑤ 无输出。
- **判据**：机器——注入后输出行数 ≥1，删除后 = 0；两次结果必须不同（证明断言对「放错位置」有判别力）。
- **红绿证据**：红 = 注入后断言仍为 0 行（R1 的边界靠人不靠机器）；绿 = 注入被检出、清理后归零。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 `npm run check` 能否拦住（它不检查技能目录下多出的子目录，故用独立断言）。

### TC-006 跑完 skills 下无新增目录且产物只落 .session（含 verdict.md）

- **覆盖**：`R3 / §5② / §7-2`
- **前置**：`npm run eval:review-triage` 已就绪；具备模型凭据（无凭据时降级为 `--dry-run` 验参数与目录形态）。**runner 在产物目录已存在时拒绝运行（TC-045），真跑前必须先删 `.session/eval/out/review-triage`。**
- **步骤**：① 记录基线 `@(Get-ChildItem skills -Directory).Count` 与 `Test-Path skills/review-triage-workspace`；② `Remove-Item -Recurse -Force .session/eval/out/review-triage -ErrorAction SilentlyContinue`；③ `$env:SKILL_UP_BIN='D:\devtools\skillup\skill-up.exe'; npm run eval:review-triage`；④ `$LASTEXITCODE`；⑤ 复测基线两项；⑥ `git status --porcelain skills/`；⑦ `Test-Path .session/eval/out/review-triage/iteration-1/benchmark.json` 与 `.../verdict.md`；⑧ `git status --porcelain --untracked-files=all` 检查 `.session/` 之外有无新增产物。
- **预期**：④ = 0；⑤ 目录数与 TC-001 基线相同且 `review-triage-workspace` 为 `False`；⑥ 无输出；⑦ 两项均 `True`；⑧ 不出现 `.session/` 之外的评测产物路径。
- **判据**：机器——④ = 0、⑤ 两项符合、⑥ 输出行数 = 0、⑦ 两项 `True`、⑧ 新增路径全部以 `.session/` 开头；五项同时成立。
- **红绿证据**：红 = 去掉 `--output-dir` 时 `skills/review-triage-workspace/` 出现（TC-007 的注入结果）；绿 = 显式改道后 `skills/` 与基线一致。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证产物内容是否正确（TC-027/029/036 管）。

### TC-007 runner 去掉 --output-dir 会污染 skills 目录

- **覆盖**：`R3 / §3.3-1`
- **前置**：`scripts/run-eval.mjs` 已存在。
- **步骤**：① 源码断言 `Select-String -Path scripts/run-eval.mjs -Pattern '--output-dir'`；② 定位产出 `outputDir` 默认值的那一行，用 `Select-String -Context 1` 读上下文，确认它是**分段拼**——`join(p.repoRoot, '.session', 'eval', 'out', skill)`——且整行以 `resolve(` 包住；同时确认源码里**不存在**一次性字面量 `.session/eval/out/`（2026-10-24 目录合并后改为分段 join，字面量判据会误判为红）；③ **运行期断言**：跑 `--dry-run`，从打印出的完整命令中取出 `--output-dir` 的值，断言 `[System.IO.Path]::IsPathRooted()` 为 `True` 且规范化后含 `.session\eval\out\`；④ 临时副本注入：复制 `scripts/`、`skills/review-triage/`、`evals/` 到 `$env:TEMP\eval-nodir\`，删掉该参数后跑 dry-run/真跑，观察副本是否出现 `skills/review-triage-workspace/`；⑤ 立即删除临时副本。
- **预期**：① 命中 ≥1；② 分段片段命中 ≥1、整行含 `resolve(`、一次性字面量 `.session/eval/out/` 命中 = 0；③ 运行期值绝对且含 `.session\eval\out\`（`resolve` 生效）；④ 副本中出现默认工作目录（证明「依赖默认值 = 污染 `skills/`」）；真仓库始终不承载该注入。
- **判据**：机器——① 命中 ≥1；② `Select-String -Path scripts/run-eval.mjs -Pattern "join\(p\.repoRoot, '\.session', 'eval', 'out', skill\)"` 命中 ≥1 且同行含 `resolve(`，且 `Select-String -Path scripts/run-eval.mjs -Pattern '\.session/eval/out/'` 命中 = 0（**判据锁的是「拼法」不是「字面量」：改目录布局时只允许改分段里的单个段，不许退化成一次性字面量**）；③ `IsPathRooted()` 为 `True` 且含 `.session\eval\out\`（**源码片段与运行期值是两件事，不要求源码字面量本身是绝对路径**）；④ 副本内 `Test-Path "$env:TEMP/eval-nodir/skills/review-triage-workspace"` 为 `True`（红证据成立；**④ 必须真跑才可能成立**，dry-run 不建目录）；真仓库同名路径为 `False`。
- **红绿证据**：红 = 删除参数后默认目录出现在副本 `skills/` 下；绿 = 参数在位时不出现。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 skill-up 未来版本是否改默认产物位置。
- **凭据**：真跑需凭据；**无凭据时只跑 ①②③，④ 记「红证据未取证」并在 `RECORD.md` 注明边界**——不得用 dry-run 冒充 ④（dry-run 不调工具、不建默认目录）。

### TC-008 check 契约不破：全绿、check-all 零改动、零依赖、evals 下无 *.test.mjs

- **覆盖**：`R2 / §5③ / §7-3 / §7-9 / §6-8`
- **前置**：本 spec 的全部改动已在工作区（含本 testcase 文件）。
- **步骤**：① `npm run check`；② `$LASTEXITCODE`；③ `git diff --stat -- scripts/check-all.mjs`；④ `git diff -- package.json`；⑤ `node -e "const p=require('./package.json');console.log(JSON.stringify(Object.keys(p.scripts)));console.log('dependencies' in p,'devDependencies' in p)"`；⑥ `Select-String -Path scripts/check-all.mjs -Pattern 'run-eval|skill-up|eval/out|check-eval-contract'`；⑦ `Get-ChildItem evals -Recurse -Filter '*.test.mjs'`。
- **预期**：② = 0 且 stdout 含「check 全部通过」；③ 无输出；④ 只在 `scripts` 内新增 `eval:review-triage` 一行；⑤ `dependencies false`、`devDependencies false`；⑥ 0 命中；⑦ 无输出。
- **判据**：机器——② = 0、③ 输出行数 = 0、④ 差异仅限一条 script、⑤ 两个布尔均 `false`、⑥ 命中数 = 0、⑦ 输出行数 = 0；六项同时成立。
- **红绿证据**：红 = 把 `node scripts/run-eval.mjs` 写进 `check` 或 import 进 `check-all.mjs`，则 ⑥ 命中且 ⑤ 出现依赖；把单测放进 `evals/` 则 ⑦ 命中；绿 = 独立 script + 零引用 + 单测在 `evals/` 之外。
- **对应测试**：待 plan Task N
- **不覆盖**：不评估 check 既有检查项本身是否充分。

### TC-009 剥离 skill-up 后 check 仍须全绿

- **覆盖**：`R2`
- **前置**：同 TC-008。
- **步骤**：① `$env:SKILL_UP_BIN=''`；② `$env:PATH=(($env:PATH -split ';' | Where-Object { $_ -notmatch 'skillup|skill-up' }) -join ';')`；③ `$out = npm run check 2>&1 | Out-String`；④ `$LASTEXITCODE`；⑤ `$out | Select-String -Pattern 'eval|skill-up'`。
- **预期**：④ = 0；⑤ 0 命中；`check` 全程不启动任何外部二进制。
- **判据**：机器——④ = 0 且 ⑤ 命中数 = 0；任一不成立即失败（说明评测已渗进 check）。
- **红绿证据**：红 = check 因找不到 skill-up 而失败或打印 eval 相关输出；绿 = 无二进制环境下 check 仍全绿。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证运行时长阈值（spec 未定耗时指标）。

### TC-010 删掉产物目录后重跑自建且 run 级结论与 delta 符号一致

- **覆盖**：`R3 / §5⑧ / §7-2`
- **前置**：已完成一次完整评测（TC-006 通过）；具备凭据（无凭据时降级：删除目录后跑 `--dry-run`，只断言目录形态，结论一致性留待有凭据环境）。
- **步骤**：① 把首轮 `iteration-*/benchmark.json` 与 `benchmark.md` 复制到 `$env:TEMP`；② `Remove-Item -Recurse -Force .session/eval/out -ErrorAction SilentlyContinue`；③ `Test-Path .session/eval/out`；④ `npm run eval:review-triage`；⑤ `Test-Path .session/eval/out/review-triage/iteration-1/benchmark.json` 与 `verdict.md`；⑥ 按 §3.3-6 口径逐 run 比对两轮（同一 `eval_name` + 同一 `configuration` 下每个 run 的 `full` / `partial` / `undetermined` 三态），并比对 `benchmark.md` 的 Delta 数值。
- **预期**：③ `False`；④ 退出 0；⑤ 两项均 `True`；⑥ 每个 run 的三态一致（或差异只出现在 `undetermined` 上并如实记录）、**Delta 符号一致**（数值可因模型抖动变化，方向不得反转；若出现 full/partial 并存则不叫「不一致」而是本轮 flaky，转 TC-028 流程）。
- **判据**：机器——③ `False`、④ = 0、⑤ 两项 `True`、⑥ 逐 run 三态与 Delta 符号一致；四项同时成立。**不得用断言项级 passed/total 数值直接比对两轮**（那不是稳定性口径，§1.5）。
- **红绿证据**：红 = runner 要求人工先建 `.session/eval/out/` 或依赖首轮残留；绿 = 删除后重跑自动重建且结论一致。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证其他平台路径；不验证并发重跑；不验证数值相等（只验三态与符号，§5⑧）。

### TC-011 must_not_contain 不得含分档标题（两步：先解析后检查）

- **覆盖**：`R4-② / §3.2.1 / §5⑤`
- **前置**：`evals/review-triage/cases/` 下两条例已就位。
- **步骤**：① **解析**：用 `node` 把每条用例 yaml 解析成对象（无 yaml 依赖时用**行级正则，只认块列表**——与 §3.2.1 的书写形态一致）；解析失败或 `must_not_contain` 为空 → 输出文件名并中止；**写成行内 `[a, b]` 即判失败并打印文件**（§3.2.1：行内数组在 runner 侧同样码 4，测试脚本不得宽容放行）；同时断言 `id` 与文件名（去扩展名）逐字相同（§3.1 / §3.2.1）；② **禁词检查**：把 `must_not_contain` 与分档标题集合比对：`必须 review`、`可直接提交`、`不提交`。
- **预期**：① 两条例均解析出非空列表、`id` 与文件名一致、无行内数组；② 两条例均不含上述三个标题。
- **判据**：机器——第一步 0 条「解析失败/为空」、0 条「id 与文件名不符」、0 条「行内数组」，第二步 0 命中；任一命中即失败并打印文件名与命中词。
- **红绿证据**：红 = 把 `必须 review` 写进 01 的 `must_not_contain`（TC-013）；或写成行内数组而测试脚本宽容放行（真进入 runner 却码 4）；绿 = 块列表形态合规且 0 命中。
- **对应测试**：待 plan Task N
- **不覆盖**：不判断具体词选得好不好（TC-012/018/046 管）。

### TC-012 每条用例断言双面、理由级、01 含主锚点、断言只写一处

- **覆盖**：`R4-①③④ / §3.2.1（judge ⊆ expect）/ §3.2.2（示例块口径）/ §3.4 / §5⑤`
- **前置**：两条例与 `evals/review-triage/fixtures/oracle/` 已就位。
- **步骤**：① 断言每条用例 `expect.must_contain` 非空，且 `judge.success[].output_contains` 的关键词都在 `expect` 里（§3.2.1 子集约束 / §6-12）；② 断言 `must_not_contain` 非空；③ 断言 02 的 `expect.must_contain` **逐个含** `必须 review` 与 `机器判不了`——**依据 = §3.2.1 的硬约束「`judge` 的关键词必须是 `expect` 已声明的词的子集」+ §3.2.2 机读块示例**（示例里 02 的 `"must_contain": ["必须 review", "机器判不了"]`）：理由级词不写进 `expect` 就被 L2 核不到；若 `judge` 用 `any: [语义迁移, 执行动作]`，这两个词就在 `expect` 之外 → 启动前 ⑧ 直接码 4。**加注**：§4 步骤 1 已把 02 的断言集**写死**为 `["必须 review","机器判不了"]`、01 写死为 `["可直接提交","git diff","notes/plan.md"]`；该步骤里的「沿用」**不指逐字复制旧试跑版**（旧版 `any` 析取恰是会被码 4 拦掉的写法），不得以「沿用旧版」为由放宽本步；④ 断言 01 的断言含**主锚点** `notes/plan.md`，且该串在 01 的 `input.prompt` 中 0 命中、在 `evals/review-triage/fixtures/oracle/01-checkbox-mechanical.md` 中 ≥1 命中（§3.4 / §3.2.2⑥）；⑤ 断言 `judge` 的关键词都在 `expect` 里，且两处不存在「同一断言不同措辞或不同阈值」（§3.2.1；`judge` 复用 `expect` 已声明的词属允许——那是两处共用同一口径，不算重复）。
- **预期**：五条全部成立；01 的主锚点**不是** `1 file changed` 这类 `git diff --stat` 行（该行可由 prompt 的「只翻转一行」推出，只作辅助证据）。
- **判据**：机器——五条断言全过；任一不过即失败，并列出哪条用例缺哪一类词。④ 中若主锚点写在 `must_contain` 但 `expected.md` 的 `anchors` 为空，**本条判失败**（该用例声明了 `context.git.apply_diff`，按 §3.2.2 字段表 `anchors` 不得为空——空锚点会让核对 ⑥ 空转；02 已声明 `apply_diff` → 其 `anchors` 不得为空，现为 `["check:all"]`；只有**未声明 `apply_diff`** 的用例才允许 `[]`）。
- **红绿证据**：红 = 只有 `must_contain: [必须 review]` + `must_not_contain: [可直接提交]`（结论词互斥），对「结论对理由错」零判别力（TC-014）；01 用 `1 file changed` 当主锚点 → prompt 可推断；绿 = 双面 + 理由级 + 主锚点 + 单处书写同时具备。
- **对应测试**：待 plan Task N
- **不覆盖**：不判断理由级词是否覆盖该用例全部错误推理路径（见 §7）。

### TC-013 分档标题写进 must_not_contain 会误杀正确答案

- **覆盖**：`R4-② / §5⑤ / §3.4 / §3.1（responses 边界）`
- **前置**：`evals/review-triage/fixtures/responses/01-with-skill.correct.md` 存在（历史样本；按 spec §3.1 它**不参与 verdict、不进 runner 判定链、不得充当 oracle**，只在本条里当「断言词表设计检查」的离线材料）。
- **步骤**：① `$t = Get-Content -Raw -Encoding UTF8 'evals/review-triage/fixtures/responses/01-with-skill.correct.md'`；② `$t -match '可直接提交'`；③ `$t -match '字面核对|diff'`；④ `$t -match '必须 review'`。
- **预期**：②③④ 均 `True`——该回复是正确答案（判了可直接提交并给了 diff 字面核对），但它同时打印了「必须 review：无」这一空档标题。
- **判据**：机器——④ 必须为 `True`；据此推出「若 `must_not_contain` 含 `必须 review`，该正确答案必然被判 FAIL」，因此用例文件不得含该词（与 TC-011 互为印证）。**分工（spec §3.4 / §3.1）**：机器只做词命中抽取与计数；「该词该不该进用例」的**合格性结论由人工在 `fixtures/RECORD.md` 的对应留痕行与 `expected.md` 人读区签字**——该样本不参与评测 verdict、不进 runner 判定链、不得充当 oracle；A1 脚本只按留痕复算「记录是否自洽」，不产 verdict、不改合格性结论。
- **红绿证据**：红 = 在副本用例里加入该禁词后跑，历史正确答案被误杀；绿 = 移除后 PASS。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 `不提交` 的空档写法（历史样本未出现，按同一判据处理）。

### TC-014 只留结论词会放过结论对理由错的回复

- **覆盖**：`R4-①③ / §7-4 / §3.4`
- **前置**：无（纯离线判定）。
- **步骤**：① 构造 `$fake = '必须 review。该文件 200 行，改动太大，建议人工看一眼。'`；② `$fake -match '必须 review'`；③ `$fake -match '机器判不了|语义迁移|执行动作'`；④ 对照 `fixtures/responses/02-without-skill.run-verify.md`，确认其不含 `必须 review`（属另一种错误形态，由 `must_contain` 拦截）。
- **预期**：② `True`、③ `False` → 该假回复结论正确但理由是「文件大」，属错误推理；02 的理由级词会把它判 FAIL。
- **判据**：机器——② `True` 且 ③ `False`；若把 02 的 `expect` 里的理由级词删掉（只留结论词），同一假回复会 PASS → 该用例判不合格。**分工（spec §3.4）**：机器只做抽取与计数并把它写进 `fixtures/RECORD.md`；「理由级词选得够不够」的**合格性结论由人工在 `RECORD.md` / `expected.md` 人读区签字**，不得由机器结论直接定合格性。
- **红绿证据**：红 = 仅结论词的用例放过 `$fake`（假阴性样例）；绿 = 含理由级词后 `$fake` 被 FAIL。
- **对应测试**：待 plan Task N
- **不覆盖**：不判断 `$fake` 之外的错误理由表达（见 §7）。

### TC-015 假阳性样例：手写 oracle 必须满足 01 的全部断言（含主锚点双向核对）

- **覆盖**：`R4-④ / §3.2.2⑤⑥ / §3.4 / §3.5 / §7-4`
- **前置**：`evals/review-triage/fixtures/oracle/01-checkbox-mechanical.md` 存在且为**手写**（L2 唯一输入，§3.1 / §4 步骤 2）；该用例的 `expected.md` 机读块里 01 的 `oracle` 字面值 = `review-triage/fixtures/oracle/01-checkbox-mechanical.md`（**相对 `evals/` 目录**，§3.2.2 字段表 / §3.2.1 单一基准）、`anchors` 含 `notes/plan.md`（spec §3.2.2 示例口径）。
- **步骤**：① `Get-Content -Raw` 读 oracle；② 按 01 的 `must_contain`（`可直接提交`、`git diff`、`notes/plan.md`）逐词检查命中；③ 按 `must_not_contain`（`纯文档` / `低风险` / `不涉及代码` / `不影响代码`）检查命中；④ **锚点双向**：`notes/plan.md` 在 01 的 `input.prompt` 中命中数 = 0、在本 oracle 中命中数 ≥1；⑤ **禁词双向（正向半边）**：本 oracle 中 `低风险` 等禁词的命中数 = 0（反向半边由 TC-046 承载）；⑥ 记录与历史样本 `fixtures/responses/01-with-skill.correct.md` 的差异（该样本不含主锚点、自陈基于 prompt 的 diff，只作「历史对照」记录，**不参与 L2 判定**）。
- **预期**：②③⑤ 全过（L2 闸门 ⑤）；④ 两向成立（L2 闸门 ⑥）；⑥ 记录在案。
- **判据**：机器——启动前核对 ⑤⑥（或等价的离线脚本，复用 runner 的断言匹配器，**纯子串、与工具同口径、不做否定豁免**）对 01 **全部通过**；任一断言不过 → 01 的 L2 不合格，真跑时必须由校验 ⑨ 拦成码 4（TC-058 验证拦截行为）。⑥ 只作人读记录，不参与判定。
- **红绿证据**：红 = 用施工期模型跑出来的样本当 oracle（自证循环：被检验的那次运行给断言定真值，spec §3.1 已删该做法）；绿 = 手写 oracle 满足全部断言且锚点在 prompt 中 0 命中。
- **对应测试**：待 plan Task N
- **不覆盖**：不判断 oracle 是否覆盖了该用例的全部正确写法（只证明「存在一种正确写法能被断言接受」）。

### TC-016 假阴性样例：错误答案必须 FAIL

- **覆盖**：`R4 / §3.4 / §7-4`
- **前置**：无（纯离线）。
- **步骤**：① 构造错误样本 `$wrong = '纯文档改动，低风险，不涉及代码逻辑，可随本次提交一起走。'`；② 按 01 的 `must_contain` 检查（应 0 命中）；③ 按 01 的 `must_not_contain` 检查（应 ≥1 命中）；④ 用历史样本 `fixtures/responses/01-without-skill.wrong.md` 复核同一判据（人读佐证）。
- **预期**：② 0 命中、③ 命中 `纯文档` / `低风险` / `不涉及代码` 中至少一个 → 判 FAIL；④ 历史样本同样被拦。
- **判据**：机器——② 命中数 = 0 且 ③ 命中数 ≥1；若该样本被判 PASS，断言过松（假阴性）。③ 只要求「至少 1 个禁词命中」，不要求全部命中。**分工（spec §3.4）**：机器只做命中抽取与计数；「该禁词是否属错误推理专属词」的**合格性结论由人工在 `expected.md` 人读区 / `fixtures/RECORD.md` 签字**。
- **红绿证据**：红 = 删掉禁词表后该样本 PASS；绿 = 保留禁词后 FAIL（历史实测：benchmark 记录 `output contains forbidden keyword "纯文档"`）。
- **对应测试**：待 plan Task N
- **不覆盖**：不判断其他错误形态（如「语义等价」）是否被覆盖。

### TC-017 证据词必须来自实跑且须配主锚点（不得用复述替代）

- **覆盖**：`R4 / §3.4 / §3.5`
- **前置**：无（纯离线）。
- **步骤**：① 构造样本 `$s = '已做 diff 字面核对，只翻转了状态位一行。'`（只有「diff 字面核对」，无 `git diff` 命令字面，**也没有主锚点**）；② 严格版判定 `$s -match 'git diff'`；③ 宽松版判定 `$s -match '字面核对|diff'`；④ 对照 `fixtures/responses/01-with-skill.no-gitdiff-literal.md`——**错误行为样本**：它自陈「本会话目录无 git 仓库，以你提供的 diff 全文为实跑判据」，属复述 prompt、不含主锚点，**不属**「正确回答被误杀」。
- **预期**：② `False`、③ `True`（说明措辞宽松度会改变判定力）；但 ① 与 ④ 都缺主锚点，按 R4-④ 一律判 FAIL。
- **判据**：机器——② `False` 且 ③ `True`（两者必须不同）；且 01 的证据词必须同时满足「实跑才可能产生」（`git diff` 由模型实跑输出）与「配主锚点 `notes/plan.md`」；**只写命令全名而缺主锚点、或只用「diff 字面核对」这类无 git 仓库也能给出的复述词，判 01 不合格**（§3.4 / R4-④）。**分工（spec §3.4）**：机器只判「② ≠ ③」与词命中；「这条证据要求是否立得住」的**合格性结论由人工在 `fixtures/RECORD.md` 签字**（A1 只按留痕复算记录自洽）。
- **红绿证据**：红 = 只靠「diff 字面核对」+ 复述 prompt 里的 diff → 正确答案与复述答案同判 PASS（TC-068⑤ 的假回复即此形态）；绿 = `git diff`（实跑命令名）+ `notes/plan.md`（prompt 0 命中）同时命中。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证「diff 原文」「字面核对」之外的同义表达（新增表达须同步更新词表）。

### TC-018 禁词按纯子串判定（与工具同口径，无否定豁免）

- **覆盖**：`R4-① / §3.4 / §5⑤ / §3.2.2⑤`
- **前置**：无（纯离线判定）。
- **步骤**：① 构造三段样本：
  - `$s1 = '无风险。可直接提交：只翻转状态位，notes 行「归档于 2026-10-18」为主锚点。'`（正向表述，**不含任何禁词**）
  - `$s2 = '可直接提交；锚点「归档于 2026-10-18」可见。'`（同上，不含禁词）
  - `$s3 = '这不是低风险，可以直接提交。'`（**反例：含禁词 `低风险` 的否定式**）
  ② 用**纯子串**匹配（与工具判分同口径：官方文档「所列字符串均不能出现」）判定：s1/s2 的禁词命中数 = 0；**s3 的 `低风险` 必须计命中**（工具侧没有否定语义）；
  ③ 断言匹配器**没有**否定 / 分句豁免逻辑（源码不出现否定标记白名单、不出现前瞻正则）。
- **预期**：s1/s2 的**禁词命中数 = 0**（**不判整体 PASS**——它们只是「与禁词无关的正向表述」，并不满足 01 的 `must_contain` 三词：缺 `可直接提交` / `git diff` / `notes/plan.md`，故按整套断言跑必然 FAIL；本条只验禁词这一维度）；s3 FAIL（真跑同样 FAIL，故「这不是低风险」这类表述不得进入正确样本）；③ 成立。
- **判据**：机器——s1/s2 命中数 = 0、s3 命中数 ≥1、匹配器无豁免且无前瞻正则。**若实现给否定式开豁免（s3 判 PASS），即判用例不合格**——那会造出「L2 通过、真跑失败」的双口径（BE-7-01）。
- **红绿证据**：红 = 用前瞻正则 / 分句豁免放行「这不是低风险」→ L2 说没问题、真跑 FAIL；绿 = 纯子串匹配 + 正确样本改用正向表述（「无风险」）。
- **对应测试**：待 plan Task N
- **不覆盖**：不穷举否定句式；不验证工具未来版本是否改变匹配语义（届时回本条重验）。

### TC-019 prompt 只给输入不给答案（description 亦不得含答案暗示）

- **覆盖**：`§3.4 / §3.2.1`
- **前置**：两条例已就位。
- **步骤**：① 提取每条用例 `input.prompt` 与 `description`；② 扫描答案词 `必须 review`、`可直接提交`、`不提交`、`无风险`、`免审`、`该走哪档`；③ 扫描施工性指令 `请按第`、`分档规则见`、`判据是`；④ 确认 prompt 必含「改动内容」与「只分流，不要审查内容」这类任务约束；⑤ 扫描主锚点 `notes/plan.md` 是否出现在 01 的 prompt 中（应为 0，与 TC-059 互为印证）。
- **预期**：②③⑤ 均 0 命中；④ 命中。
- **判据**：机器——②③⑤ 命中数 = 0 且 ④ ≥1；任一不成立即失败（prompt 暗示档位 = 把答案喂给模型，差值失去意义；`description` 含答案暗示同判不合格）。
- **红绿证据**：红 = prompt 写「这个改动应该可以直接提交，请确认」；绿 = 只给改动清单与输出格式要求。
- **对应测试**：待 plan Task N
- **不覆盖**：不判断 prompt 的间接语义暗示（那是用例设计选择）。

### TC-020 fixture **源目录**与补丁就位（源目录不带 `.git`、basename 与 `repo_fixture` 同名）

- **覆盖**：`R5 / §3.1（源目录 + 物化路径）/ §3.3-5⑥`
- **前置**：施工步骤 1 已完成。
- **步骤**：① `Test-Path evals/review-triage/fixtures/repos/checkbox-demo/notes/plan.md`；② `Test-Path evals/review-triage/fixtures/diffs/checkbox.patch`；③ `Test-Path evals/review-triage/fixtures/repos/checkbox-demo/.git`（**仓库内源目录不得带 `.git`**，§3.1 / §6-7）；④ `Get-Content -Raw -Encoding UTF8` 读 plan.md；⑤ 与补丁中的 `-` 行逐字比对；⑥ 从 01 的 yaml 取 `context.repo_fixture` 的字面值，断言其**末段 basename**（`checkbox-demo`）= ③ 的源目录名（runner 按 repo 名物化，basename 不同名就物化不出该目录，§3.1）；⑦ **02 的源目录**：`Test-Path evals/review-triage/fixtures/repos/command-swap-demo/` 及 `package.json` / `scripts/lint.mjs` / `scripts/typecheck.mjs` / `scripts/precommit.sh` 四个文件均为 `True`，且 `Test-Path .../command-swap-demo/.git` = `False`；⑧ 从 02 的 yaml 取 `context.repo_fixture`，断言末段 basename（`command-swap-demo`）= ⑦ 的源目录名。
- **预期**：①② `True`；③ `False`；④ 含 `- [ ] 补齐 collect 的覆盖率口径`；⑤ 补丁删除行与 ④ 的该行逐字一致（行尾空白差异必须为 0）；⑥ basename 逐字相同；⑦ `True`（四个文件在位）且 `.git` = `False`；⑧ basename 逐字相同。
- **判据**：机器——①② `True` 且 ③ `False` 且 ⑤ 比对相等 且 ⑥ basename 相等 且 ⑦ 全 `True`/`.git` 为 `False` 且 ⑧ basename 相等；任一条不成立即失败（⑤ 不等会让 `git apply` 直接失败；③ 为 `True` 会让外层 git 把子目录当嵌套仓库 → gitlink / 告警；⑥⑧ 不等则 runner 物化不出副本；⑦ 缺一文件则 02 的闸门 ⑥-1 直接码 4）。
- **红绿证据**：红 = 施工前两个路径均不存在；或把 `fixtures/repos/checkbox-demo/.git` 一起提交进仓库（外层 git 变 gitlink，克隆后 fixture 形态与本地不一致）；或把 `repo_fixture` 的 basename 写成 `01-checkbox-mechanical`（按 case-id 物化的旧理解，源目录名对不上 → ⑥ 失败）；绿 = ①② `True`、③ `False`、⑤⑥ 成立。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 fixture 是否含无关文件（§3.1 要求只放用到的素材，人工看体积）；**不验证物化副本**（物化后的存在性、baseline、`git apply --check` 由 TC-022 ④⑤ / TC-075 管）。

### TC-021 fixture 上 git diff 真有输出且只含一行翻转（不执行 commit）

- **覆盖**：`R5 / §7-5 / §6-7（两处 git 写例外）`
- **前置**：TC-020 通过。**说明（spec §6-7 的两处例外，均需用户/议会确认后才执行）**：① `$env:TEMP` 下的 `git init` / `git add -A` / `git apply`；② **runner 运行期**在 `.session/eval/fixture/**`（已在 `.gitignore`）内为物化副本做 `git init` / `add` / `commit`（§3.1）。**仓库内 fixture 目录永不带 `.git`、永不在仓库内做 git 写**——「在 `$env:TEMP` 里重建仓库再复制回仓库」的旧做法**已删除**（它会让仓库带 `.git`）。
- **步骤**：① `$t = Join-Path $env:TEMP 'cb-fixture'; Remove-Item -Recurse -Force $t -ErrorAction SilentlyContinue`；② `Copy-Item -Recurse evals/review-triage/fixtures/repos/checkbox-demo $t`（**复制源目录**，不是物化副本；物化按 repo 名落在 `.session/eval/fixture/review-triage/checkbox-demo/`）；③ `git -C $t init`；④ `git -C $t add -A`；⑤ `git -C $t apply --check (Resolve-Path evals/review-triage/fixtures/diffs/checkbox.patch)`；⑥ `git -C $t apply <同一补丁>`。**注意：本条在 `$env:TEMP` 里自建临时仓库，与 skill-up 的 `context.git` 字段是两件事**——`context.git.init: true` 是真实存在的字段，但它只建空仓库、不做基线提交（该形态由 TC-067 判定）；本条用 `git add -A` 造出索引基线，才能让 `git diff` 看到工作区那一行翻转；⑦ `git -C $t diff --stat`；⑧ `git -C $t diff`；⑨ `git -C $t status --porcelain`。
- **预期**：⑤ 退出 0；⑦ 输出 `1 file changed, 1 insertion(+), 1 deletion(-)`；⑧ 只含 `- [ ] ...` 与 `+ [x] ...` 两行，无其他文件、无其他行；⑨ 非空（锚点可达性）。
- **判据**：机器——⑤ = 0、⑦ 含 `1 file changed`、⑧ 增删行数各为 1 且内容只有勾选位翻转、⑨ 非空；四项同时成立。**若 ⑦ 与 ⑨ 同时为空** → fixture 不可用（形态同 TC-067，判不合格），先按 §4 步骤 0 修 fixture 或改选「fixture 独有内容行」作锚点并写进 `RECORD.md`，**修好后重跑**；本条不存在「不失败」的第三态。
- **红绿证据**：红 = 无 fixture 时只能贴 prompt 里的 diff（技能按硬约束判必审）；绿 = 真仓库上 `git diff` 有输出。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 skill-up 是否按 `context.repo_fixture` 真把仓库挂给模型（TC-022/023 从行为侧验证）。

### TC-022 `repo_fixture` 字面值 = 物化路径 + 字段层级 + baseline 提交，任一不合格即判用例不合格

- **覆盖**：`R5 / §1.5（fixture 仓库）/ §3.1（源目录与物化）/ §3.2.1（单一基准）/ §3.3-5⑥（执行顺序）/ §3.4 / §4 步骤 0 / §7-5`
- **前置**：两条例已就位；有可用 skill-up 二进制；已按 spec §4 步骤 0 对 fixture 做过自查并留有记录。步骤 0 先 `Set-Location <仓库根>`，再 `$evalsDir = (Resolve-Path (Join-Path (Split-Path evals/review-triage/eval.yaml -Parent) '..')).Path`（断言其末级 = `evals`），再 `$repoRoot = (Resolve-Path (Join-Path $evalsDir '..')).Path`；`$skillRoot = (Resolve-Path skills/review-triage).Path` 只用于「技能目录内是否含 `SKILL.md`」与「仓库内源目录不含 `.git`」两处，**不作用例侧路径的解析基准**。
- **步骤**：
  ① `Select-String -Path evals/review-triage/cases/01-checkbox-mechanical.yaml -Pattern 'repo_fixture|apply_diff|git:'`；
  ② **字段层级与字面值**：
  a) `context.repo_fixture` 命中 ≥1；
  b) `apply_diff` 出现在 `context.git` 块**下面**（用 `Select-String -Context 3` 读缩进，确认它比 `git:` 深一层）；
  c) `context` **顶层**（与 `repo_fixture` 同级）**不出现** `apply_diff`；
  d) **`repo_fixture` 的字面值逐字等于 `../.session/eval/fixture/review-triage/checkbox-demo`**——物化路径的**静态**相对值（相对 `evals/`，§3.1 / §3.2.1）：断言它**不等于** `review-triage/fixtures/repos/checkbox-demo`（那是源目录，不带 `.git`、无 baseline，指过去技能必然判「不是 git 仓库」），也**不得**再带两层回跳；断言字面值里**没有 case-id 段**（物化**按 repo 名**，不是按 case-id）；断言其末段 basename = 源目录 `evals/review-triage/fixtures/repos/checkbox-demo/` 的目录名；再跑一次 runner `--dry-run` 后复读该行，断言**文字未被 runner 改写**（「运行期不改写 yaml」与「按 repo 名物化」是一对）；
  e) `context.git.init: true` 若出现属**合法**（该字段真实存在，同级还有 `checkout` / `remotes`），**不得再判它非法**；
  ③ `& $env:SKILL_UP_BIN validate evals/review-triage/eval.yaml` 并记录退出码（**不作为通过判据**，见 TC-065；另注：spec §3.3-5⑥ 把 `context.apply_diff` 列为**错误写法**——顶层出现即码 4，权威写法是 §1.5 / R5 的 `context.git.apply_diff`）；
  ④ **闸门 ⑥ 的执行顺序（spec §3.3-5⑥，固定五步，不得调换）**——下文 **⑥-x 指闸门 ⑥ 的内部步骤编号**（即 spec 原文编号），**不是**本用例的步骤号：
  - ⑥-1 **源目录存在**：`Test-Path evals/review-triage/fixtures/repos/checkbox-demo/` = `True`，且 `Test-Path .../checkbox-demo/.git` = `False`；
  - ⑥-2 **物化（先删后建）**：`Remove-Item -Recurse -Force .session/eval/fixture/review-triage/checkbox-demo -ErrorAction SilentlyContinue` → 跑一次 runner `--dry-run` 触发物化（§3.1：复制 → `git init` → `add` → `commit -m baseline`）；
  - ⑥-3 **物化后的引用存在**：`Test-Path (Join-Path $evalsDir '../.session/eval/fixture/review-triage/checkbox-demo')` = `True`，且 `Test-Path (Join-Path $evalsDir 'review-triage/fixtures/diffs/checkbox.patch')` = `True`（`apply_diff` 同样按 `evalsDir` 解析）；
  - ⑥-4 **技能路径与补丁层级**：`skills[].path`（按 `$evalsDir` 展开，字面值 `../skills/review-triage`）存在且含 `SKILL.md`；`apply_diff` 写在 `context.git` 下（顶层出现 `context.apply_diff` → 码 4）；
  - ⑥-5 **baseline 与补丁可应用**：`git -C <⑥-3 的副本> rev-parse HEAD` 成功、`git -C <同一副本> apply --check (Resolve-Path (Join-Path $evalsDir 'review-triage/fixtures/diffs/checkbox.patch')).Path` 退出 0。
  **判别力（必写进记录）**：把 ⑥-3 提到 ⑥-2 之前的实现（即把存在性核对提到物化之前）在物化前恒报码 4，每条**正确**用例都被自己的闸门拦死；把 ⑥-2 写成「复用不删」的实现在第二次启动时因上轮 `apply_diff` 留下的脏工作区而 ⑥-5 失败；
  ⑤ **baseline 提交（§4 步骤 0 自查②）**：检查对象是 **⑥-2 物化出的副本**（`.session/eval/fixture/review-triage/checkbox-demo/`），**不是**仓库内的源目录；`git -C <副本> rev-parse HEAD` 成功、`git -C <副本> log --oneline` ≥1 条；**不要求 `git status --porcelain` 非空**——工作区差异是 `apply_diff` 运行**后**的观测，闸门执行时副本本就该干净（要求非空会让正确 fixture 恒报码 4）；**不得在仓库内对 fixture 目录执行 `git init` / `git commit`**（§6-7；本地自查只在 `$env:TEMP` 副本里做）；
  ⑥ 读 `evals/review-triage/fixtures/RECORD.md`：必须含 §4 步骤 0 的**四件自查记录**——a) `apply_diff` 在 `context.git` 下（层级对）；b) **物化副本**自带 `.git` 且 `git log` 有 baseline 提交；c) 临时工作区实测 `git status` 出现 ` M notes/plan.md`、`git diff` 出现那一行翻转；d) **`git apply --check <补丁>` 退出 0**（补丁与 fixture 逐字对齐，spec §4 步骤 0 自查④）。**取证记录分两档**：有凭据 → 必须有真跑取证记录（模型回复出现 fixture 独有内容）；无凭据 → 记「真 fixture 未取证」+ 取证边界（照 TC-066 写法），同样判通过（R5：无凭据只能记未取证，不得写成已取证）。**本条一切「存在性」核对的对象 = 物化后的路径**（源目录只核对「存在且不带 `.git`」）；
  ⑦ 对 02 做同样扫描并记录结论（02 已声明 `context.git.apply_diff` → 其 `anchors` **不得为空**（现为 `["check:all"]`）；02 的 `repo_fixture` = `../.session/eval/fixture/review-triage/command-swap-demo`、`context.git.init: true`、`apply_diff` = `review-triage/fixtures/diffs/command-swap.patch`，同样要求字面值逐字相等、字段层级正确、物化后存在；**只有未声明 `apply_diff` 的用例才允许 `anchors: []`**）。
- **预期**：② a/b/c/e 成立（d 不构成违规）；**d 的字面值逐字相等、无 case-id 段、basename 与源目录同名、`--dry-run` 后未被改写**；③ validate 退出 0（仅记录）；④ ⑥-1~⑥-5 **按序**全部成立；⑤ 物化副本 `rev-parse HEAD` 成功、`log --oneline` ≥1 条，且**仓库内源目录不含 `.git`**；⑥ 四件自查 + 取证记录在位（有凭据档或无凭据档）；⑦ 02 的 `repo_fixture` / `apply_diff` 字面值与层级成立、`anchors` 非空（`["check:all"]`）。
- **判据**：机器——② a/b/c/e 成立 **且** d 四项（逐字值 / 无 case-id / basename / 未被改写）全成立 **且** ④ ⑥-1~⑥-5 五步按序全过 **且** ⑤ 成立 **且** ⑥ 记录在位 **且** ⑦ 说明在位；缺任一即判**用例不合格**（等于退回「prompt 粘贴 diff」，或因空仓库跑不进目标场景）。② d 写成源目录路径 → **直接判不合格**；② d 写成 case-id 段 → 判不合格；② e 出现时不得据此判不合格；**不得要求 `status --porcelain` 非空**（那是运行后观测）；**不得用仓库根、技能根或 `eval.yaml` 所在目录当解析基准**（§3.2.1：用例侧五类路径只认 `evals/` 这一套）。
- **红绿证据**：红 = `repo_fixture` 写成 `review-triage/fixtures/repos/checkbox-demo`（按 `evals/` 解析到源目录，工具挂上的是无 `.git` 的纯文件树 → 模型回「当前目录不是 git 仓库」「没有未提交改动」）；或按 case-id 物化（`.session/eval/fixture/review-triage/01-checkbox-mechanical/`，源目录 basename 对不上 → 物化不出）；或把 `apply_diff` 写成 `context.apply_diff`（静默忽略、工作区连 `.git` 都没有）；或闸门「先查存在再物化」（恒码 4）；绿 = 静态物化路径 + `context.git.apply_diff` + ⑥-1~⑥-5 五步按序通过。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 fixture 在真跑时确实被挂上（TC-023 从行为侧验证）；层级错的独立构造由 TC-066、缺 baseline 由 TC-067、补丁与 fixture 不对齐由 TC-075 承载；不校验 `context.git.checkout` / `remotes` 的语义（本轮不用）。

### TC-023 fixture 换成空目录后 01 判必审；probe 行不得出现 ASSERT / DELTA

- **覆盖**：`R5 / §3.5 / §3.3-7 / §1.5`
- **前置**：具备模型凭据；**已导出 `EVAL_MODEL_PROVIDER` / `EVAL_MODEL_NAME`**（缺一则 runner 启动前码 2、不产 verdict 行，本条无从执行）。无凭据时降级为「只核对 fixture 配置存在」，行为侧留待有凭据环境。
- **步骤**：① 按前置约定 ③ 建**两层同构**副本：`$t = Join-Path $env:TEMP 'eval-nofixture'; New-Item -ItemType Directory -Force "$t/evals" | Out-Null; Copy-Item -Recurse evals/* "$t/evals/"; New-Item -ItemType Directory -Force "$t/skills" | Out-Null; Copy-Item -Recurse skills/review-triage "$t/skills/review-triage"`（**两层都要**：`review-triage/…` 与 `../.session/…` 都以副本的 `evals/` 为基准，落在副本根内；缺 `skills/` 层时副本的 `skills[].path`（`../skills/review-triage`）无目标 → 启动前 ⑥-4 先撞码 4，行为侧测不到；`<副本根>/evals` 的末级才是 `evals`，基准不漂移）；② 在副本里建一个**新的源目录** `$t/evals/review-triage/fixtures/repos/no-changes-demo/`，只放一个无关文件（如 `README.md`，**不含 `notes/plan.md`**）——**不能用「存在的空目录」**：物化是 runner 的职责（`git init` → `add -A` → `commit -m baseline`），空仓库上 commit 必然失败 → 只会落到码 4，测不到行为侧；再把 01 的 `context.repo_fixture` 改成 `../.session/eval/fixture/review-triage/no-changes-demo`（**仍是物化路径的静态相对值，相对副本的 `evals/`**，basename 与新源目录同名；**不能指向不存在的路径**，那会命中启动前校验 ⑥ 直接码 4，见 TC-065），并**删掉 01 的 `context.git` 整段**（保留 `apply_diff` 会因副本里没有 `notes/plan.md` 打不上补丁 → 工具退出非 0 → 误归 `INVALID_ENV`）；③ `node scripts/run-eval.mjs review-triage --eval-yaml "$t/evals/review-triage/eval.yaml" --output-dir "$env:TEMP/eval-nofixture/out" --iteration 2`；④ 读 01 的 `with_skill` 回复；⑤ 读 `<output-dir>/verdict.md` 的 01 行（01 是 `probe`）。
- **预期**：④ 回复判「必须 review」（技能忠于「免审必须报命令名 + 实跑结果」的硬约束；本场景是一个**干净、无改动的仓库**，拿不到「未提交改动」的实跑结果）；⑤ 01 行的 `verdict=` **只能取 `VALID` / `INVALID_FLAKY` / `INVALID_ENV`**（本场景预期 `VALID`），**出现 `INVALID_ASSERT` 或 `INVALID_DELTA` 即判 runner 违约**（probe 不进 L3，§3.3-7）。**另加三条防误读断言（必须逐条成立）**：⑤-a `role=probe` 与 `delta=n/a` **同现**（缺任一即失败）；⑤-b `rate=` 字段**不得省略**，且如实写实际值（本场景装技能臂可能 1.0、也可能 0.0，按实际写，禁止省略、禁止写空）；⑤-c 结论区（stdout 结论段 + `verdict.md` 结论边界段）**不得出现**「01 达标」「01 通过」这类判读。
- **加注（spec §3.3-7）**：`probe` 的 `VALID` 只表示「未 flaky、无环境失败」——本场景 01 的断言很可能不满足，`VALID` 与「断言没通过」**可以并存**；不得据此判技能无效，也不得为了「看起来对」把枚举改成别的值（probe 三值封顶是硬约束）。
- **判据**：机器+人工——机器检查 ④ 输出含 `必须 review`、⑤ 该行 `role=probe` 且 `delta=n/a` 同现、`rate=` 非空且为数值、`verdict=` 属于三值集合、结论区无「01 达标 / 01 通过」；人工确认结论**没有归因到技能**（不得写「技能对 01 无效」）。若 ④ 未出现 `必须 review`，**判本条失败**，先核 fixture 构造与 `context.git` 是否已删（不得归因到技能）。
- **红绿证据**：红 = 去掉 fixture 后装技能判必审（这就是 R5 的实测依据）；或 probe 用例被报 ASSERT（三层判据被绕回旧模型）；绿 = 带 fixture 时按预期判可直接提交（TC-015），且 probe 行不出现 ASSERT/DELTA 枚举。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证其他技能的同类环境依赖（R8 限定）。

### TC-024 补丁与 plan.md 必须 LF 且无 BOM；plan.md 围栏/表格合规

- **覆盖**：`R5 / §4 步骤 7`
- **前置**：`fixtures/diffs/checkbox.patch` 与 `fixtures/repos/checkbox-demo/notes/plan.md` 存在。
- **步骤**：① `$p = (Resolve-Path evals/review-triage/fixtures/diffs/checkbox.patch).Path`；② `$b = [IO.File]::ReadAllBytes($p)`；③ `($b[0] -eq 0xEF -and $b[1] -eq 0xBB -and $b[2] -eq 0xBF)`；④ `([IO.File]::ReadAllText($p)).Contains([string][char]13 + [char]10)`；⑤ 对 `notes/plan.md` 重复 ②–④；⑥ plan.md 围栏（```）配对计数为偶数、表格每行列数一致；⑦ `npm run check` 的 markdown 文件计数 = 开跑前基数 + 本次新增 `.md` 份数，**逐份点清、不写死数字**：`evals/review-triage/expected.md`、`evals/review-triage/fixtures/oracle/*.md`、`evals/review-triage/fixtures/responses/*.md`、**`evals/review-triage/fixtures/RECORD.md`**、以及 fixture 内的 **`evals/review-triage/fixtures/repos/checkbox-demo/notes/plan.md`**（它会被 `MD_SKIP_DIRS` 不含 `evals/` 的检查扫到）；`*.yaml` / `fixtures/CONTRACT.json` 不计。基数以当次 `npm run check` 实跑为准——**写死数字会在新增一份样本时静默放过**（spec §4 步骤 7）。
- **预期**：③④ 均为 `False`（两文件 LF 无 BOM）；⑥ 围栏配对、表格列数一致；⑦ 计数按逐份点清值对得上。
- **判据**：机器——两文件 ③④ 均 `False`、TC-021 的 `git apply --check` 退出 0、⑥ 全部成立、⑦ 计数相符；任一不成立即失败。
- **红绿证据**：红 = 用 `Set-Content -Encoding UTF8` 生成补丁 → BOM + CRLF，`git apply` 报错、check 报 BOM；绿 = `[IO.File]::WriteAllText(..., (New-Object Text.UTF8Encoding $false))` 写入后 apply 通过且 check 不报错。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 plan.md 之外 fixture 文件的编码（新增时按同一断言扩展）。

### TC-025 补丁路径分隔符必须是正斜杠

- **覆盖**：`R5 / §3.1`
- **前置**：补丁存在。
- **步骤**：① `Select-String -Path evals/review-triage/fixtures/diffs/checkbox.patch -Pattern '^(---|\+\+\+) '`；② 检查两条头行是否分别为 `--- a/notes/plan.md`、`+++ b/notes/plan.md`；③ `Select-String -Pattern '^(---|\+\+\+) .*\\'`。
- **预期**：② 两条头行都用 `/`；③ 0 命中。
- **判据**：机器——② 逐字匹配且 ③ 命中数 = 0。
- **红绿证据**：红 = 用 `\` 生成补丁，Git for Windows 下报 `No such file`；绿 = `/` 分隔时 apply 通过。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证文件名含空格或中文的边界。

### TC-026 迭代默认 2、拒绝 <2；--iteration N 产物 = N 个 iteration-* 目录

- **覆盖**：`R6 / §3.3-3 / §3.3-5⑤`
- **前置**：`scripts/run-eval.mjs` 已存在；有 skill-up 二进制（`.mjs` 桩亦可，见 TC-034）；**sentinel 桩**（被拉起时写 `<TEMP>/eval-sentinel.txt`，用于证明「没花模型调用」）；`$env:TEMP/eval-iter1/out` 不存在。真跑档另需已导出 `EVAL_MODEL_PROVIDER` / `EVAL_MODEL_NAME`；无凭据时只跑 dry-run 档并记「真跑档未取证」。
- **步骤**：① dry-run 档：`node scripts/run-eval.mjs review-triage --iteration 1 --dry-run --output-dir "$env:TEMP/eval-iter1/out"`；② `$LASTEXITCODE`；③ 真跑档（有凭据时）：同命令去掉 `--dry-run`；④ 真跑档 `$LASTEXITCODE`；⑤ 检索 dry-run 输出里的默认 `--iteration` 值；⑥ 真跑（或桩跑）`--iteration 2` 后 `Get-ChildItem .session/eval/out/review-triage -Directory -Filter 'iteration-*'` 计数；对每个目录读 `benchmark.json`：`metadata.runs_per_configuration` 与 `runs.length`，并**逐 run 断言 `result.passed` / `result.total` 两个键存在**（run 顶层**不得**出现这两个键——真实产物里它们在 `result` 对象下，spec §1.5 实测；写成顶层会让 run 全变 `undetermined`，该形态由 TC-079 专测）；⑦ 检查 `Test-Path "$env:TEMP/eval-iter1/out"`、`Test-Path "$env:TEMP/eval-iter1/out/verdict.md"`、`Test-Path <TEMP>/eval-sentinel.txt`。
- **预期**：② **严格 = 4**、④ **严格 = 4**（§3.3-5⑤：`--iteration < 2` → 码 4，参数非法；**拒绝**，不得静默改成 2 后继续跑）；②④ 的 stdout 均为**单行** `exit=4 reason=配置错误 <细节>`（§3.3-7 启动前失败格式，**不产 verdict 行**）；⑦ 三项**全为 `False`**（不产 `<output-dir>`、不产 `verdict.md`、sentinel 不存在 = 没花模型调用）；⑤ 默认值为 2；⑥ 目录数 = 2、每个目录 `runs_per_configuration` = 1、`runs[]` 长度 = 用例数 × 2（本轮 4）、每个 run 的 `passed`/`total` 都在 `result` 下。
- **判据**：机器——②④ **严格等于 4**（**不是「非 0」**：只判非 0 会把「配置错误」与「无可用用例（3）」「环境不可用（2）」混成一类，也测不出码位是否各就位）+ stdout 单行含 `exit=4` 与 `reason=配置错误` + ⑦ 三项 `False` + ⑤ 解析出 `--iteration 2` + ⑥ 目录数 = 2 且两项计数成立 + **⑥ 的 `result.passed` / `result.total` 键位成立**；七项同时成立。
- **红绿证据**：红 = `--iteration 1` 被接受并跑完（单次结果被当成门禁）；或只判「非 0」而放过「码 3 冒充参数非法」；或拒绝了却在 `<output-dir>` 里留下半截产物；绿 = 码 4 + 单行 `reason=配置错误` + 三处无产物 + 产物按目录×run 结构落地。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 `expected.md` 的 `iteration_min` 与本次 `--iteration` 的关系（TC-060 管）；不验证 > 2 的迭代（属工具行为，用干跑观察参数）。

### TC-027 flaky 自算（run 级、全迭代并集、用例级 OR）+ verdict 行全字段

- **覆盖**：`R6 / §3.3-6 / §3.3-7 / §5⑥`
- **前置**：已完成一次 `--iteration 2` 的运行（无凭据时用产物桩构造，或降级为只验 stdout 格式）。
- **步骤**：① 收集 runner stdout 到 `$out`；② 读 `<output-dir>/verdict.md`，逐行核对是否含 `<eval_name>`（与 `benchmark.json` 的 `eval_name` 逐字相同；不用 `case_id` / 文件名、不用 `eval_id`——后者恒为 0）；③ 逐行核对**完整字段序**：`role=` → `iteration=` → `runs=`（装臂 determined 数 / 不装臂 determined 数）→ `undet=`（装臂 undetermined 数 / 不装臂 undetermined 数）→ `flaky=`（是 / 否 / 未判定）→ `rate=`（装臂全过率 / 不装臂全过率或「未判定」）→ `delta=`（数值 / 未达 / 未判定 / n/a）→ `verdict=`（五值枚举）；④ 检查 01 行 `role=probe` 且 `delta=n/a`、02 行 `role=gate` 且 `delta` 为数或「未达」；⑤ 人工复核一次 flaky：遍历**全部** `iteration-*/benchmark.json`（不是只读 `iteration-1`），把 `runs[]` 按 `eval_name` + `configuration` 分组，每个 run 先判 `full` / `partial` / `undetermined`，`undetermined` 排除，组内 `full` 与 `partial` 并存即该臂 flaky，用例级取 OR。
- **预期**：② 两条例各一行；③ 每行字段齐全且顺序与 §3.3-7 一致；④ 01 = `probe` + `delta=n/a`，02 = `gate`；⑤ 复核结论与 verdict 行一致。
- **判据**：机器——③ 每行八类字段齐全、`verdict` 值属于五值集合、`distinct eval_name = 2`（每用例一行）；④ 成立；⑤ 人工复核一致（记录 `flaky=` 的推导过程：哪个臂、哪几个 iteration、哪些 run 是三态中的哪一态）；**⑥ 交叉一致性（§5⑥ 的「无更高优先级时」限定）**：某行 `flaky=是` 时该行 `verdict=` 必须是 `INVALID_FLAKY`——**除非同一行同时命中更高优先级（`INVALID_ENV`）**，此时该行 `verdict=INVALID_ENV` 且 `flaky=是` 仍原样保留（OR 聚合的结论不被覆盖，只是 verdict 取高的）；把 flaky 行写成 `VALID`、或把 ENV 行写成 `INVALID_FLAKY`，均判失败。任一条不成立即失败。
- **红绿证据**：红 = stdout 只有退出码与「完成」、无 verdict 行；或行内缺 `runs=` / `undet=` / `rate=` / `role=`（三层字段被压回一个标量）；绿 = 每用例一行、八类字段齐全且与自算一致。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 flaky 算法纯函数的边界正确性（TC-047d / TC-051 / TC-052 兜）。

### TC-028 同臂 run 级结论跨迭代不一致 → INVALID_FLAKY（证据：out3 两份固化片段）

- **覆盖**：`R6 / §3.3-6 / §3.3-7 / §5⑥ / §7-6`
- **前置**：已固化进 git 的 `evals/review-triage/fixtures/responses/flaky-evidence/out3-iteration-1-benchmark.json` 与 `out3-iteration-2-benchmark.json`（同一 `eval_name`「纯勾选改动应判为可直接提交」+ 同一 `configuration: with_skill`：iteration-1 的该 run 为 `result.passed=1, result.total=3`（未全过），iteration-2 的该 run 为 `result.passed=3, result.total=3`（全过）；同用例版本、断言配置相同，仅模型行为不同）。**读这两份固化片段时同样按 `runs[].result.passed` / `runs[].result.total` 取值**（run 顶层没有这两个键，§1.5）。
- **步骤**：① 读两份片段，**按 §1.5 判 run 级三态**：iteration-1 的该 run = `partial`、iteration-2 的该 run = `full` → 同一臂内 `full` 与 `partial` 并存 → 该臂 flaky → 用例级（OR）flaky=是；② 把两份片段放进同一临时目录的两个 `iteration-*` 子目录，**只调 flaky 判定纯函数**（入参 = 目录列表）→ 断言该用例 `flaky=是`；**再调 verdict 映射纯函数**（入参 = `flaky=是` + `role=gate`）→ 断言映射为 `INVALID_FLAKY`。**不得走 runner 入口**——临时目录已存在会先撞 §3.3-5④ 码 4（QA-7-05）；③ **只喂 iteration-1 一份**再跑一次 → 断言输出 `flaky=否`（证明「只读 iteration-1」会漏判，与 TC-052 互为印证）；④ 断言 verdict 行**只含 §3.3-7 规定的固定字段**（`role` / `iteration` / `runs` / `undet` / `flaky` / `rate` / `delta` / `verdict` / 可选 `exit=` / 可选 `timeout=`）——**行内不得出现百分比**，数值证据只落 `benchmark.json` 与 stdout。
- **预期**：① flaky 成立；② 纯函数输出 `flaky=是` 且映射为 `INVALID_FLAKY`（用例存在时该行 `flaky=是` 且 `verdict=INVALID_FLAKY`）；③ `flaky=否`（红证据成立）；④ 行内无百分比。若本轮真跑也出现 flaky，则 `<output-dir>/verdict.md` 的对应行必须同为 `flaky=是` + `verdict=INVALID_FLAKY`。
- **判据**：机器+人工——机器检查 ② 的纯函数输出 `flaky=是` 且映射结果为 `INVALID_FLAKY`、③ 为 `flaky=否` 且 ② ≠ ③、④ 行内 `%` 命中数 = 0；**⑤ 退出码 scoping（含「无更高优先级时」限定）**：同一映射函数喂 `flaky=是 + role=gate`（**该行无更高优先级 verdict**）→ **3**、喂 `flaky=是 + role=gate + 同行 INVALID_ENV` → **2**（`INVALID_ENV > INVALID_FLAKY`，§3.3-7 优先级）、`flaky=是 + role=probe` → **0**（§3.3-6 码 0 只看 gate）；人工确认没有把 flaky 那一次当门禁（「停下改用例」是人工承诺，见 §5）。任一不成立即失败。
- **红绿证据**：红 = 拿 iteration-1 那次「未全过」的 run 直接下结论「技能对该用例有效」（只读单迭代）；或把断言改版造成的差异当成 flaky（断言变更不是模型抖动）；或判据仍用断言项级口径（同一份证据既证明 flaky 又要求非 flaky）；绿 = run 级并集判 flaky、`verdict=INVALID_FLAKY`、停在这一步。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证「改用例」之后的重跑（那会产生新记录，按 TC-039 对账）。

### TC-029 baseline 必开、报告含 With/Without/Delta，delta 是唯一 L3 指标

- **覆盖**：`R7 / §3.2 / §3.3-3 / §3.5`
- **前置**：`eval.yaml` 与 runner 已就位；至少完成一次 dry-run（真跑需凭据）。
- **步骤**：① `Select-String -Path evals/review-triage/eval.yaml -Pattern 'enabled:\s*true'`（benchmark 段）；② `Select-String -Path scripts/run-eval.mjs -Pattern '--baseline'`；③ 真跑后 `Select-String -Path .session/eval/out/review-triage/iteration-1/benchmark.md -Pattern 'With Skill|Without Skill|Delta'`；④ 确认 Delta 列有数值而非空；⑤ 检查报告或 `verdict.md` 含对照组构成声明（`共享默认系统提示` / `默认工具集` / `边际约束` 至少一个）；⑥ 断言结论里**没有**以绝对通过率作为达标依据的字段或句子（`delta` 之外的「通过率达标」表述）。
- **预期**：①② 各 ≥1 命中；③ 三个表头各 ≥1 命中；④ Delta 行为带符号数值；⑤ 声明在位；⑥ 0 命中。
- **判据**：机器——①~⑥ 全部成立；缺 Delta、缺构成声明、或以绝对通过率当判据即失败。
- **红绿证据**：红 = 去掉 `--baseline`，报告只剩一列通过率、无 Delta；或以「装臂 100% 通过」当有效性证据；绿 = 三列齐全 + Delta 有值 + 构成声明 + 无绝对通过率判据。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 Delta 的统计显著性（spec 未定义阈值）。

### TC-030 两臂都全过（delta=0）不得报 VALID

- **覆盖**：`R7 / §3.3-7`
- **前置**：产物桩可用（TC-034 的 `.mjs` 桩扩展为「写死 benchmark.json 后 exit 0」）；02 为 `calibrated` gate（`with_skill.min_rate=1.0`、`without_skill.max_rate=0.0`、`delta.min=1.0`）。
- **步骤**：① 桩在 `--output-dir` 下写 `iteration-1`、`iteration-2` 各一份 `benchmark.json`：两臂每个 iteration 各 1 个 run，**每个 run 的 `result` 都是 `{"passed": 3, "total": 3}`（full）**；② 导出 `EVAL_MODEL_PROVIDER` / `EVAL_MODEL_NAME`，`$env:SKILL_UP_BIN=<桩>`；③ `node scripts/run-eval.mjs review-triage --output-dir "$env:TEMP/eval-delta0/out" --iteration 2`；④ 读 02 行与退出码。
- **预期**：④ 两臂全过率均 = 1.0（`rate=1.0/1.0`）、`flaky=否`、算出的差值为 0 但按 §3.3-7 **必须写 `delta=未达`**、`verdict=INVALID_ASSERT`（02 是 calibrated）、退出码 = 1。**不得为 `VALID`**。
- **判据**：机器——④ `verdict=` 严格不等于 `VALID`，且 `delta` 字段**严格等于** `未达`（写 `0` 即失败，§3.3-7「不得写成 0 混同」），且 `flaky=否`，且退出码 = 1。**这是 R7 的核心场景：旧标量口径会在「两臂都全过、差值 = 0」时报 VALID**。
- **红绿证据**：红 = 只看装臂通过率（1.0 达标）→ 报 VALID（技能完全没起作用却被判有效）；绿 = delta=0 < `delta.min` 判不达。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 `delta.min` 取 0 的合法性（§3.2.2 规定 `0 < delta.min ≤ 1`，取 0 属 ④ 越界，TC-056b 兜）。

### TC-031 计数口径：runs_per_configuration=1、runs[]=用例数×臂、分母=迭代数

- **覆盖**：`R6 / §3.3-6 / R10 / §3.2.2`
- **前置**：至少一次 `--iteration 2` 的运行记录；`evals/review-triage/expected.md` 机读块已就位（`iteration_min=2`）。
- **步骤**：① 对每个 `iteration-*/benchmark.json` 记录 `metadata.runs_per_configuration` 与 `runs[]` 长度；② 记录 `run_summary` 的两臂数值与每个 run 的 `result.passed` / `result.total`（`total` 是断言项数，不是 run 数），**并断言 run 顶层没有 `passed` / `total`**（真实产物里它们在 `result` 下，§1.5；顶层出现即说明桩或读取路径写错了字段位置，转 TC-079）；③ 核对机读块 `iteration_min` = 2 且 ≤ 本次 `--iteration`；④ 核对结论/对账表里「7/7」「0/7」这类写法的分母 = run 数（全部 iteration 的 run 之和），不是断言项分母（如 `100% (3/3)` 的 3）。
- **预期**：① `runs_per_configuration` = 1、`runs[]` 长度 = 用例数 × 2（本轮 4）；② 每 run 的 `total` = 断言项数；③ `iteration_min=2`；④ 分母为 run 数。
- **判据**：机器——① 每个目录 `runs_per_configuration` = 1 且 `runs[]` 长度 = 4；③ 成立；④ 结论分母 = run 数；若用 `3/3`（断言项分母）冒充 run 级分母，判不合格并输出两处数值。
- **红绿证据**：红 = 用 `1 runs each` 与 `100% (3/3)` 并存的历史 benchmark 直接宣称「达标」；绿 = 按 run 级（`full` / `partial` / `undetermined`）对账。
- **对应测试**：待 plan Task N
- **不覆盖**：不改变 skill-up 的报告格式（只约束我们的对账口径）。

### TC-032 SKILL_UP_BIN 优先且 dry-run 走通（①–⑨ 各打真实性标记、不写评测产物、打印绝对路径）

- **覆盖**：`§3.3-2 / §3.3-5（产物定义：只指 <output-dir> / verdict.md）/ §3.3-5⑥ / §3.3-5⑧ / §5⑨`
- **前置**：`scripts/run-eval.mjs` 与 `evals/review-triage/` 已就位；本机有 skill-up 二进制。**不要求导出 `EVAL_MODEL_PROVIDER` / `EVAL_MODEL_NAME`**（dry-run 不注入模型、也不检查这两个变量）。**步骤 0（阻断前置）**：`Remove-Item -Recurse -Force .session/eval/out/review-triage -ErrorAction SilentlyContinue`，并断言 `Test-Path .session/eval/out/review-triage` = **`False`**——§3.3-5④ 规定产物目录已存在即码 4（§6-9），不先删则本条与后续每条 dry-run 用例都会在第一项检查上撞码 4，测不到要测的东西。
- **步骤**：① `$env:SKILL_UP_BIN='D:\devtools\skillup\skill-up.exe'`；② `& $env:SKILL_UP_BIN validate evals/review-triage/eval.yaml`；③ `$LASTEXITCODE`；④ `node scripts/run-eval.mjs review-triage --dry-run`；⑤ `$LASTEXITCODE`；⑥ 在 ④ 输出里确认：a) 打印**完整命令行**（含 `run`、`--output-dir`、`--iteration`、`--baseline`）；b) 全部路径为 resolve 后的绝对路径；c) 调用的是 `SKILL_UP_BIN` 指向的路径（不是 PATH 里另一个）；⑦ `Test-Path .session/eval/out/review-triage` 与 `Test-Path .session/eval/out/review-triage/verdict.md`（**两项都必须 `False`**：dry-run 不写评测产物）；⑧ **①–⑨ 逐项真实性标记**：输出里 ①–⑨ **各有一项标记**，且其中两项必须打**能证伪的内容**——**⑥ 必须显示真实的 baseline 核对结果**：按 ⑥ 的五步顺序逐项打印实际结果（**⑥-1** 源目录存在 → **⑥-2** 物化（先删后建）→ **⑥-3** 物化后的 `repo_fixture` / `apply_diff` 存在 → **⑥-4** `skills[].path` 含 `SKILL.md` 且 `apply_diff` 在 `context.git` 下 → **⑥-5** `rev-parse HEAD` 成功 + `git apply --check` 退出 0；成功 → 打成功 + commit 短哈希 / `apply --check` 退出码；失败 → 打失败 + **失败项编号（⑥-1…⑥-5）** + 错误摘要），**不得用固定文案「⑥ 通过」代替**（固定文案在 fixture 缺 baseline 或物化顺序写反时也会照打）；**⑧ 必须显示两半**：a) `expected.md` 机读块结构 ①–④ + `iteration_min` 的核对结论；b) **`fixtures/CONTRACT.json` 三项**：文件存在、`exit === 0`、其 `files` 里每个文件的当前 sha256 与记录一致（spec §3.3-5⑧）——只打一半（如只打 `iteration_min` 通过）即判失败；⑨ **fixture 物化边界**：`Test-Path .session/eval/fixture/review-triage` **允许**为 `True`——「产物」在 §3.3-5 里专指 `<output-dir>` / `verdict.md`，而物化是 ⑥ 的输入，不允许写就与 ⑥ 互斥；若存在，**手工**把副本里 `notes/plan.md` 的 `- [ ]` 改成 `- [x]`，**再跑一次 dry-run** → 该文件必须恢复为 `- [ ]`，且 `git -C <副本> status --porcelain` 为空（证明「每次启动先删后建、不复用」；复用会让上轮 `apply_diff` 的脏工作区留到下轮，`git apply` 必失败）。
- **预期**：③ = 0、⑤ = 0（**dry-run 只做前置校验 + 打印，不执行工具、不透传工具退出码**，故 ⑤ 是 runner 自身校验码）；⑥ a/b/c 全满足；⑦ 两项 `False`；⑧ ①–⑨ 各一项标记在位，⑥ 打的是**真实**五步结果（与实跑 `git rev-parse HEAD` / `git apply --check` 的输出一致），**⑧ 的两半都在位**（a 机读块 ①–④ + `iteration_min`；b `CONTRACT.json` 存在 + `exit === 0` + 每个文件哈希一致）；⑨ fixture 允许存在，且「手工改脏 → 重跑 → 恢复 `- [ ]` + `status --porcelain` 为空」成立；`.session/eval/fixture/` 不存在时记「⑨ 未取证」，**不得记为通过**。
- **判据**：机器——③⑤ = 0 且 ⑥ 三条件全满足且 ⑦ 两项 `False` 且 ⑧ 九项标记在位 **且 ⑥ 的五步结果与实跑命令逐字一致**（固定文案即判失败）**且 ⑧ 的两半都在位、`CONTRACT.json` 的哈希复算与手算一致**（只打一半即判失败）且 ⑨ 成立（未取证时按「未取证」记录，不判通过）；任一条不成立即失败。**不得把 ⑤ 的 0 解释成「工具跑通了」**（dry-run 从未调用工具，透传能力由 TC-034 验）。
- **红绿证据**：红 = runner 忽略环境变量、只查 PATH；或 dry-run 静默不打印命令行；绿 = 优先取环境变量 + 打印完整命令行与绝对路径。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 PATH 回退（TC-033 覆盖「都没有」的失败路径）。
- **凭据**：validate 与 dry-run 均不需要模型凭据。

### TC-033 二进制找不到必须退出码 2 并给安装指引

- **覆盖**：`§3.3-2 / §3.3-6 / §7-7`
- **前置**：`scripts/run-eval.mjs` 已存在。
- **步骤**：① `$env:SKILL_UP_BIN='C:\definitely-missing\skill-up.exe'`；② `$env:PATH=(($env:PATH -split ';' | Where-Object { $_ -notmatch 'skillup|skill-up' }) -join ';')`；③ `$out = node scripts/run-eval.mjs review-triage --dry-run 2>&1 | Out-String`；④ `$LASTEXITCODE`；⑤ `Test-Path .session/eval/out/review-triage`。
- **预期**：④ **= 2**（环境不可用，§3.3-6；dry-run 下二进制定位校验同样生效）；`$out` 含安装指引（`SKILL_UP_BIN` 或安装命令）；不含 `skip` / `skipped` / 「跳过」/「通过」这类「没跑也像通过」的词；⑤ `False`。
- **判据**：机器——④ = 2、`$out` 含安装指引、`$out` 不含跳过类词、⑤ `False`；四项同时成立。
- **红绿证据**：红 = 找不到二进制时打印 `skipped` 并退出 0；绿 = 退出码 2 + 指引 + 无产物。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证指引具体文案（只要求含变量名与获取方式）。

### TC-034 skill-up 非 0 时退出码必须透传（.mjs 桩，表外码 5 原样透传）

- **覆盖**：`§3.3-2 / §3.3-6 / §7-7`
- **前置**：可写 `$env:TEMP`；`scripts/run-eval.mjs` 已存在；**已导出 `EVAL_MODEL_PROVIDER` / `EVAL_MODEL_NAME`**（本条不走 dry-run，缺变量即码 2、桩根本不会被拉起）；`$env:TEMP/eval-stub/out` 与 `$env:TEMP/eval-stub2/out` 均不存在。
- **步骤**：① 建桩（**.mjs，非 .cmd**——Node `spawnSync` 下 `.cmd` 会 EINVAL）：`$text = 'process.exit(5)'`，用 `[IO.File]::WriteAllText($stub, $text, (New-Object Text.UTF8Encoding $false))` 写入（无 BOM），**5 不在退出码表 0–4 内**；② `$env:SKILL_UP_BIN=$stub`；③ `node scripts/run-eval.mjs review-triage --output-dir "$env:TEMP/eval-stub/out"`（**不带 `--dry-run`**）；④ `$LASTEXITCODE`；⑤ 建 `process.exit(0)` 的桩，配 `--output-dir "$env:TEMP/eval-stub2/out"` 再跑一次；⑥ 清理两个临时产物目录。
- **预期**：④ **严格等于 5**（表外码原样透传——归一/映射必然改变它）；⑤ = 2 且该行 `verdict=INVALID_ENV`、`exit=0`（工具成功但无 `benchmark.json` = 数据缺失，**不得记 0 冒充成功**，§3.3-6 / §5⑨）。
- **判据**：机器——两次退出码分别严格等于 5 与 2，且 ⑤ 的 verdict 行 `verdict=` 严格等于 `INVALID_ENV` 且含 `exit=0`；不等即失败。**元判据**：若命令里出现 `--dry-run`，本条自证无效（工具从未执行，5 与 `exit=0` 都不可能出现）。
- **红绿证据**：红 = runner 把工具码归一成表内码，桩返回 5 时 runner 返回 1 或 3；绿 = 原样透传 5。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 Windows 之外的 shell 桩（本轮只承诺 Windows + PowerShell）。

### TC-035 非 0 不得解释成技能坏了（运行期失败必产 verdict 行）

- **覆盖**：`§3.3-6 / §3.3-7`
- **前置**：TC-034 的 exit 5 桩可用；**已导出模型变量**；`$env:TEMP/eval-stub/out` 不存在。
- **步骤**：① `$env:SKILL_UP_BIN=$stub`；② `$out = node scripts/run-eval.mjs review-triage --output-dir "$env:TEMP/eval-stub/out" 2>&1 | Out-String`；③ `$out -match 'flaky'`；④ `$out -match '技能无效|技能坏了|skill broken|skill ineffective'`；⑤ 读 `<output-dir>/verdict.md`：**运行期失败必须产 verdict 行**，该行须为 `verdict=INVALID_ENV` 且含 `exit=5`、`iteration=n/a`；无 `benchmark.json` → stdout 必含 `flaky 未判定（无产物）`；⑥ 清理临时产物目录；⑦ **慢桩**：另建一个 `setTimeout` 超过 `迭代数 × 用例数 × 2（臂数）× timeout_seconds × 1.5` 的 `.mjs` 桩（**旧式公式漏乘用例数与臂数——实测 2 用例 1 迭代已耗 326.08 s，按旧式只剩 10% 余量，正常变慢就会被误判超时**），用独立 `--output-dir "$env:TEMP/eval-timeout/out"` 跑一次，读 stdout 与 verdict 行。
- **预期**：③ `True`；④ `False`；⑤ `verdict=INVALID_ENV` 且 `exit=5` 且 `iteration=n/a`；⑦ 退出码 = 2 且行含 `timeout=是`、`verdict=INVALID_ENV`。不得以「未写产物所以只核 stdout」放行。
- **判据**：机器——③ `True` 且 ④ `False` 且 ⑤ `verdict=` 严格等于 `INVALID_ENV`、行含 `exit=5`、行含 `iteration=n/a`、stdout 含 `flaky 未判定（无产物）`；⑦ 退出码 = 2 且行含 `timeout=是`；任一条不成立即失败。
- **红绿证据**：红 = runner 打印「skill failed」并不给 flaky 信息、不产 verdict 行；绿 = 只报运行失败 + flaky 判定 + 机读枚举。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证人工如何解释失败（见 §5）。

### TC-036 stdout 与 verdict.md 两处都带五要素与模型账

- **覆盖**：`R9 / §5⑦ / §3.3-7 / §7-8`
- **前置**：至少一次 dry-run 与一次真跑（真跑需凭据且**已导出模型变量**；无凭据时只验 stdout，verdict.md 部分降级并注明原因）。
- **步骤**：① `$out = node scripts/run-eval.mjs review-triage --dry-run 2>&1 | Out-String`；② **dry-run 验四项 + 一行显式 n/a**：a) 配置模型（标注「请求值」）；c) 「真实后端未验证，须人工在转发侧确认」；d) 覆盖范围「1 技能 / 2 用例」；e) 稳定性检出上限（n=2 两次一致 ≠ 已验证稳定）；**b) 引擎版本必须打印一行显式 `engine_version=n/a（dry-run 未执行工具）`**——它只能从 `iteration-1/result.json` 读（R9），dry-run 不产该文件；**「显式 n/a」本身是断言，不许静默省略**（省略会让读者以为该要素不存在，而不是「本轮拿不到」）；②' 真跑一次（`--output-dir "$env:TEMP/eval-five/out" --iteration 2`），其 stdout 必须 a–e 全在（b = `observed_configuration.version` 的真实值）；③ 读该次 `verdict.md`，同样含 a–e，并含 `actual_model=` 行；④ 模型账：`{config_provider, config_name, actual_model}` 三元组存 `.session/eval/state/review-triage.json`（**产物目录之外**）；分别改三项各一次重跑，**每次用独立 `--output-dir`（`.../out-1`、`out-2`、`out-3`）**，不得复用已存在目录（否则撞 §3.3-5④ 码 4）；每次 stdout 都打印「历史结论对该模型不成立，需重跑」（**只改 `actual_model` 同样必须提示**）；⑤ 删除 `.session/eval/out/` 后复测模型账文件仍存在。
- **预期**：② dry-run 的 a/c/d/e 全在，**且 `engine_version=n/a（dry-run 未执行工具）` 一行在位**（缺该行 = 静默省略，判失败）；②' 真跑 a–e 全在且 b 是真实版本值（不是 `n/a`）；③ verdict.md a–e 全在且有 `actual_model=` 行；④ 三次变更均提示重跑且账内三元组键齐；⑤ 删除产物目录后账本仍在。
- **判据**：机器——② 的 a/c/d/e 四项在位 **且** 显式 `engine_version=n/a（dry-run 未执行工具）` 在位（**缺该行判失败**）、②' 与 ③ 各含 a–e 五项、④ 三次变更各提示重跑、⑤ 账本文件仍存在；任一缺失即失败。
- **红绿证据**：红 = 只有引擎名、无模型名与「未验证」声明；或模型换了不提示重跑；绿 = 两处五要素 + 三元组提示。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证模型名是否与真实后端一致（见 TC-037 与 §5）。

### TC-037 结论里出现第三方模型名（GLM）就不许再出现对 Claude 成立的外推句

- **覆盖**：`R9 / §3.3-7`
- **前置**：至少一次真跑（产生 verdict.md）。条件句式：**若 `verdict.md` 的 `actual_model=` 行确认实际模型非 Claude（如 GLM）→ 执行本条**；**若为 `未确认` 或确认为 Claude 系 → 本条降级为人工核对**，并把确认结果回填该行（确认动作与结果只有一个落点：`verdict.md` 的 `actual_model=` 行）。
- **步骤**：① 读 `verdict.md` 头部配置模型 `$m`（请求值）与 `actual_model=` 行 `$actual`；② 扫描文本里的 `Claude` 字样；③ 判定：若 `$actual` 非 Claude 系，则「Claude 也这样」「对 Claude 成立」这类外推句必须为 0（**无论 `$m` 是什么**）；④ 构造反例 `$bad = '该结论对 Claude 也成立。'`，确认扫描能命中。
- **预期**：④ 命中（检查项有效）；若 `$actual` 非 Claude 系 → 实际结论外推句 0 命中；否则降级人工核对。
- **判据**：机器——④ 命中 ≥1；若 `$actual` 非 Claude 系 → 实际外推句 0 命中（**不得以「配置模型不含 GLM」为空转通过的理由**）；若 `未确认` 或 Claude 系 → 降级人工核对。**`actual_model=` 行缺失即判不合格**。
- **红绿证据**：红 = 报告模型为 GLM 但结论写「Claude 也这样」；绿 = 结论只对「claude_code + 实际转发模型」这一组合成立，且覆盖范围限定「1 技能 / 2 用例」。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证模型名在各转发层的传递准确性（见 §7）。

### TC-038 无凭据时降级 validate 与 dry-run；真跑退出码 2 且 verdict=INVALID_ENV

- **覆盖**：`§7 执行环境 / §3.3-6（码 2 凭据分支：覆盖透传、优先于二维表①）/ §3.3-7`
- **前置**：可临时清空凭据变量（至少含 API key 类变量）；**已导出模型变量**（否则 ⑦ 会在启动前因模型变量缺失码 2，测不到凭据分支）。
- **步骤**：① 记录相关凭据变量名（不记录值）：`Get-ChildItem Env: | Where-Object { $_.Name -match 'API_KEY|AUTH_TOKEN|ANTHROPIC|OPENAI|CCR' } | Select-Object -ExpandProperty Name`；② 同名变量置空；③ `& $env:SKILL_UP_BIN validate evals/review-triage/eval.yaml`；④ `$LASTEXITCODE`；⑤ `node scripts/run-eval.mjs review-triage --dry-run`；⑥ `$LASTEXITCODE`；⑦ `$out = node scripts/run-eval.mjs review-triage 2>&1 | Out-String`（真跑）；⑧ `$LASTEXITCODE`；⑨ 读 `<output-dir>/verdict.md` 的 01/02 行；⑩ 检查 ⑦ 的错误文本是否命中认证特征；**⑪ 认证桩档（凭据分支优先于二维表①，spec §3.3-6）**：用 `.mjs` 桩「先写完整的 `iteration-1` / `iteration-2`——两臂每 iteration 各 1 run，`with_skill` 全 `result={"passed":3,"total":3}`、`without_skill` 全 `result={"passed":0,"total":3}`（数据完整、非 flaky、delta 达标）——再向 **stderr** 打印 `authentication failed`，最后 `process.exit(1)`」，配一个独立 `--output-dir`（不存在）跑一次，读退出码、`verdict.md` 的 01/02 行与行内 `exit=`。
- **预期**：④ = 0、⑥ = 0；⑧ **= 2**；⑨ 每行 `verdict=INVALID_ENV` 且 `iteration=n/a`、`exit=` 在位；⑩ 命中 §3.3-6 认证特征正则（`api_key` / `credential...missing|invalid` / `401` / `unauthorized` / `authentication failed` / `invalid token` 等，忽略大小写；不用裸 `auth` / `token` 子串）；**⑪ 退出码 = 2（既不是 0 也不是 1）、行内 `exit=1` 保留、`verdict=INVALID_ENV`**（**不得**按数据算出 `VALID` / `INVALID_ASSERT`——凭据失败是环境不可用，不是评测结论）。
- **判据**：机器+人工——④⑥ = 0、⑧ = 2、⑨ 每行 `verdict=` 严格等于 `INVALID_ENV`（不接受文字等价出口）、⑩ 命中、**⑪ 退出码严格 = 2 且行含 `exit=1` 且 `verdict=INVALID_ENV`**；人工确认结论没有归因到技能。若 ⑧ 返回 0（凭据另有来源），记录实际并改由有凭据环境重跑；若 ⑧ 非 2 非 0，核对 stderr 是否命中 ⑩ → **命中则 runner 必须归码 2，返回其他码即判 runner 违约**（该分支是唯一的显式覆盖例外）。**⑪ 的判别力**：⑪ 的数据是「全过 + 达标」，按二维表① 由 verdict 定码会得到 0 或 1；只有「认证 stderr 覆盖二维表①」的实现才得 2——漏掉该分支等于把「凭据坏了」洗成「评测通过」或「用例没校准」。
- **红绿证据**：红 = 无凭据时 runner 直接判用例 FAIL 并写「技能无效」；或漏掉认证 stderr 分支，把 ⑪ 的「工具码 1 + 数据完整」按二维表① 由 verdict 定码（数据全过 → 0 / delta 达标 → 0），凭据坏了却报「通过」；绿 = 区分「环境不可用」与「技能无效」，且认证 stderr 覆盖二维表① 归码 2。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证凭据变量的具体名称清单（随引擎/转发层变化）。

### TC-039 `expected.md` 机读块 v2 与 §3.2.2 示例逐条对账；时间统一 UTC

- **覆盖**：`R10 / §5④ / §3.2.1（judge ⊆ expect）/ §3.2.2 / §3.5`
- **前置**：`evals/review-triage/expected.md` 已就位（含人读说明 + **恰好一个** `json` 围栏块，`schema: eval-expectation/v2`）；该文件必须先于首次真跑存在。
- **步骤**：① 断言文件内 `json` 围栏块**恰好一个**（多于一个即码 4，TC-053c）；② 逐字段核对块内容：`schema` = `eval-expectation/v2`、`skill` = `review-triage`、`iteration_min` = 2；③ 核对 02：`eval_name` = 「执行动作被替换必须 review」、`role` = `gate`、`origin` = `calibrated`、`oracle` = `review-triage/fixtures/oracle/02-command-swap-semantic.md`（**相对 `evals/` 目录**，§3.2.2 字段表；不得写成仓库根相对的 `evals/review-triage/…`、也不得再带两层回跳）、`anchors` = `["check:all"]`（02 已声明 `context.git.apply_diff`，`anchors` 不得为空；只有未声明 `apply_diff` 的用例才允许 `[]`）、`assert.must_contain` 含 `必须 review` **与 `机器判不了`**（依据 = §3.2.1 的「`judge` 关键词必须是 `expect` 子集」+ §3.2.2 机读块示例；理由级词不进 `expect`，L2 就核不到，而写进 `judge` 又会被启动前 ⑧ 判码 4）、`assert.must_not_contain` 含 `低风险`、`arms.with_skill.min_rate` = 1.0、`arms.without_skill.max_rate` = 0.0、`delta.min` = 1.0；**加注**：§4 步骤 1 已把断言集写死——02 为 `["必须 review","机器判不了"]`、01 为 `["可直接提交","git diff","notes/plan.md"]`，该步骤的「沿用」**不指逐字复制旧试跑版**（旧版 `judge.any: [语义迁移, 执行动作]` 越出 `expect`，会被码 4 拦）；④ 核对 01：`eval_name` = 「纯勾选改动应判为可直接提交」、`role` = `probe`、`origin` = `calibrated`、`oracle` = `review-triage/fixtures/oracle/01-checkbox-mechanical.md`（同一基准）、`anchors` = `["notes/plan.md"]`、`assert.must_contain` = `["可直接提交", "git diff", "notes/plan.md"]`、`arms` = null、`delta` = null；⑤ 断言两个 `oracle` 字面值按 **`evals/` 基准**展开后文件都存在（本步先算 `$evalsDir = (Resolve-Path (Join-Path (Split-Path evals/review-triage/eval.yaml -Parent) '..')).Path`；`Test-Path (Join-Path $evalsDir <字面值>)` = `True`），且 02 的 `anchors` 非空（= `["check:all"]`）、01 的 = `["notes/plan.md"]`；⑥ 与 spec **§3.2.2 机读块示例**逐项比对（达标数值的唯一来源）；**实测数字（装 7/7、不装 0/7、装 12/12、不装 0/12）以 spec R10 为唯一来源**，人读区引用即可、**不得自造第三套**；**不得出现断言项级说法**；⑦ 时间基准统一 UTC：`[IO.File]::GetLastWriteTimeUtc` 早于 `iteration-1/benchmark.json` 的 `metadata.timestamp`；⑧ 人读区含「预期值系试跑校准（冒烟口径），首轮验收降级为冒烟/回归测试，不代表独立验证」声明。
- **预期**：①~⑧ 全部成立；块内不含旧字段 `required_passed` / `required_total`（出现即码 4）。
- **判据**：机器——①~⑤、⑦ 全过，⑥ 数值逐字一致且无断言项级说法，⑧ 声明在位；任一项不成立即失败（缺 v2 块 = L3 没有单源；旧字段在位 = 读了旧口径）。
- **红绿证据**：红 = 跑完才写「预期 1/2 即可」这类事后放宽值，或沿用旧标量块（两臂都全过时报 VALID）；绿 = v2 块先于首跑 + 数值与 §3.5 一致 + 冒烟声明在位。
- **对应测试**：待 plan Task N
- **不覆盖**：不判断预期值本身定得是否合理（那是 spec R10 的设计责任）。
- **凭据**：⑦ 的比较需要真跑产物；无凭据时只做 ①~⑥⑧ 的结构验证。

### TC-040 calibrated gate 未达 → INVALID_ASSERT，技能零改动

- **覆盖**：`R10 / §6-1 / §5⑥ / §3.3-7 / §3.2.2③`
- **前置**：产物桩可用（写死 `benchmark.json` 后 `exit 0`）；02 为 `origin: calibrated`（**默认状态**，无需留痕）；临时副本目录可写。
- **步骤**：① 按前置约定 ③ 建**两层同构**副本：`$t = Join-Path $env:TEMP 'eval-calib'; New-Item -ItemType Directory -Force "$t/evals" | Out-Null; Copy-Item -Recurse evals/* "$t/evals/"; New-Item -ItemType Directory -Force "$t/skills" | Out-Null; Copy-Item -Recurse skills/review-triage "$t/skills/review-triage"`；② 桩在 `--output-dir` 下写两个 `iteration-*` 目录，每份 `benchmark.json` 的两臂各 1 个 run，**每个 run 的 `result` 都是 `{"passed": 0, "total": 3}`（partial，臂内一致 → 非 flaky）**；③ 导出模型变量，`$env:SKILL_UP_BIN=<桩>`；④ `node scripts/run-eval.mjs review-triage --eval-yaml "$t/evals/review-triage/eval.yaml" --output-dir "$env:TEMP/eval-calib/out" --iteration 2`；⑤ 读 02 行与退出码；⑥ `git status --porcelain skills/` 与 `git diff --stat -- skills/`；⑦ 检查 stdout / verdict.md 是否出现「调整预期值」「放宽断言以通过」这类改法。
- **预期**：⑤ 02 行 `verdict=INVALID_ASSERT`（**严格等于**，`origin: calibrated` 的 gate 未达）、`flaky=否`、`delta=未达`、`rate=0.0/0.0`、`runs=2/2`、`undet=0/0`；退出码 = 1（§3.3-6：gate 用例 INVALID_ASSERT → 码 1）；⑥ 均为空（技能正文零改动）；⑦ 0 命中。
- **判据**：机器——⑤ `verdict=` 严格等于 `INVALID_ASSERT` 且 `flaky=否` 且 `delta=未达` 且退出码 = 1；⑥ 输出为空；⑦ 命中数 = 0。任一条不成立即失败。**不得把 calibrated 的未达写成 `INVALID_DELTA`**（那会把「用例还没校准好」误报成「技能退化」，TC-050 做互斥对照）。
- **红绿证据**：红 = 为提高通过率去改 `skills/review-triage/SKILL.md`（R10：判用例无效并改用例）；或 calibrated 未达报 DELTA（假退化）；绿 = 只改用例 + `INVALID_ASSERT`。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证改用例后的新预期值（新一轮按 TC-039 重走）。

### TC-041 改 SKILL.md 迁就用例即违规（关键判据词逐词在位）

- **覆盖**：`§6-1 / §5⑥`
- **前置**：本轮全部改动已在工作区。
- **步骤**：① `git status --porcelain skills/`；② `git diff --stat -- skills/`；③ 若 ① 非空，列被改文件并读 diff 判断是否属「为了让用例通过」的判据放宽；④ `git diff -- skills/review-triage/SKILL.md`；⑤ `Select-String -Path skills/review-triage/SKILL.md -Pattern '免审|必须 review|可直接提交|git diff'`。
- **预期**：①② 为空；即使有改动也不得是判据放宽；⑤ 四个词各自命中 ≥1 行。
- **判据**：机器——①② 输出行数 = 0，且 ⑤ 四个词**逐个**命中 ≥1 行（不接受「合计 ≥1 即通过」——删掉 `可直接提交` 仍会命中 `免审`）；非 0 时本条判失败并把 diff 交人工定性（定性结论写入 `<output-dir>/verdict.md` 或结论区，不得归因为「技能缺陷」）。
- **红绿证据**：红 = 为让 01 通过而删「免审必须报命令名」；绿 = `skills/` 零改动且判据词在位。
- **对应测试**：待 plan Task N
- **不覆盖**：不判断技能正文其他缺陷（那是技能体检范围）。

### TC-042 本轮只允许 review-triage 一个技能目录且不建 CI

- **覆盖**：`R8 / §8 / §6`
- **前置**：`evals/` 已就位。
- **步骤**：① `Get-ChildItem evals -Directory | Select-Object -ExpandProperty Name`；② `Get-ChildItem evals/review-triage -Directory | Select-Object -ExpandProperty Name`；③ `Get-ChildItem .github -Recurse -File -ErrorAction SilentlyContinue | Select-String -Pattern 'eval|skill-up'`；④ `node -e "console.log(JSON.stringify(require('./package.json').scripts))"`。
- **预期**：① 只有 `review-triage`；② 只含 `cases`、`fixtures`（可再有 `expected.md` 等文件，但不得再嵌技能名目录）；③ 0 命中；④ 只有既有 `check` 与 `eval:review-triage`（**A1 契约脚本不加 npm script**，故 script 清单仍只多这一条），无 CI 钩子。
- **判据**：机器——①②③④ 全部成立；出现第二个技能目录、CI 配置或多余 script 即判越界（R8 是范围决定；扩展判据：同一技能连续 ≥3 次真跑、全部 gate 用例 delta 均达阈值且方向一致、无 flaky、预期已 `frozen`，才可选第二个不同任务族技能）。
- **红绿证据**：红 = 顺手把其他 17 个技能的目录也建出来；绿 = 只有一个技能目录。
- **对应测试**：待 plan Task N
- **不覆盖**：不判断未来扩到多技能时的结构（按 §3.1 追加规则另立用例）。

### TC-043 cases 为空不得静默当成功（退出码 3）

- **覆盖**：`§3.3-5③ / §3.3-6 / §7-6`
- **前置**：有 skill-up 二进制（validate 用）。
- **步骤**：① 按前置约定 ③ 建**两层同构**副本：`$t = Join-Path $env:TEMP 'eval-empty'; New-Item -ItemType Directory -Force "$t/evals" | Out-Null; Copy-Item -Recurse evals/* "$t/evals/"; New-Item -ItemType Directory -Force "$t/skills" | Out-Null; Copy-Item -Recurse skills/review-triage "$t/skills/review-triage"`；② 把副本 `$t/evals/review-triage/eval.yaml` 的 `cases.files` 改为 `[]`（无 BOM 写回），并复读断言文件里已无 `cases/01-` 字样（防空转）；③ `& $env:SKILL_UP_BIN validate "$t/evals/review-triage/eval.yaml"`；④ `$LASTEXITCODE`；⑤ `node scripts/run-eval.mjs review-triage --eval-yaml "$t/evals/review-triage/eval.yaml" --dry-run --output-dir "$env:TEMP/eval-empty/out"`（**必须显式 `--eval-yaml` 指向副本**，否则读默认 yaml、注入不生效、本用例假通过）；⑥ `$LASTEXITCODE`。
- **预期**：⑤/⑥ runner 退出码 **= 3**（结论无效：0 用例，reason=`无可用用例`）；不得「退出 0 且无提示」，也不接受以输出里有「0 用例」字样代替退出码。
- **判据**：机器——⑥ **严格等于 3**；输出文本只作辅助证据，不得替代退出码判定；若 = 0，判 runner 不合格。
- **红绿证据**：红 = 空用例集跑出 0 退出、报告显示满分；绿 = 退出码 3。
- **对应测试**：待 plan Task N
- **不覆盖**：不要求 skill-up 改行为（责任落到 runner 的自检）。
- **凭据**：dry-run 不需要凭据。

### TC-044 eval.yaml 语法错必须非 0 且指行（runner 退出码 4）

- **覆盖**：`§3.2 / §3.3-5②`
- **前置**：有 skill-up 二进制。
- **步骤**：① 按前置约定 ③ 建**两层同构**副本：`$t = Join-Path $env:TEMP 'eval-badyaml'; New-Item -ItemType Directory -Force "$t/evals" | Out-Null; Copy-Item -Recurse evals/* "$t/evals/"; New-Item -ItemType Directory -Force "$t/skills" | Out-Null; Copy-Item -Recurse skills/review-triage "$t/skills/review-triage"`；② 在副本 `$t/evals/review-triage/eval.yaml` 末尾追加一行 `broken: "unclosed`；③ `& $env:SKILL_UP_BIN validate "$t/evals/review-triage/eval.yaml"`；④ `$LASTEXITCODE`；⑤ 检查错误输出是否含行号或字段名；⑥ `node scripts/run-eval.mjs review-triage --eval-yaml "$t/evals/review-triage/eval.yaml" --dry-run`（**必须显式 `--eval-yaml`**）。
- **预期**：④ 非 0；⑤ 含行号（如 `line 25`）或字段名 `broken`；⑥ = 4。
- **判据**：机器——④ 非 0 且 ⑤ 命中 `line|broken|yaml|syntax` 之一；⑥ = 4；若退出 0 判失败。
- **红绿证据**：红 = 语法错仍 validate 通过，真跑时才炸；绿 = 提前非 0 并指行 + runner 码 4。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证语义错（如类型错）是否被捕获。

### TC-045 产物目录已存在时 runner 拒绝运行，不覆盖旧结果

- **覆盖**：`§3.3-5④ / §5⑨ / §6-9`
- **前置**：`scripts/run-eval.mjs` 已存在；已有一份产物（或手工建目录）。
- **步骤**：① `New-Item -ItemType Directory -Force .session/eval/out/review-triage`；② `node scripts/run-eval.mjs review-triage --dry-run`；③ `$LASTEXITCODE`；④ 收集输出 `$out`；⑤ 删除目录后重跑。
- **预期**：③ = 4（拒绝运行 → 配置错误）；④ 输出含「已存在 / exists / 拒绝」类提示与删除建议；⑤ 退出 0。
- **判据**：机器——③ = 4 且 ④ 含已存在类提示、⑤ = 0；若目录已存在仍静默覆盖 → 判不合格（§6-9）。
- **红绿证据**：红 = 同名 `iteration-*` 目录被覆盖或混入旧产物（旧结果被当新结论）；绿 = 拒绝 + 提示。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证「改用时间戳目录」方案（本轮选「已存在则拒绝」）。

### TC-046 禁令词双向验证：oracle 正向 0 命中 + 不装臂真实样本 ≥1 命中

- **覆盖**：`§3.4 / §5⑤ / §3.2.2⑤`
- **前置**：`evals/review-triage/fixtures/oracle/01-checkbox-mechanical.md`（手写，L2 输入）与 `evals/review-triage/fixtures/responses/01-without-skill.wrong.md`（历史样本，人读证据）存在。
- **步骤**：① **正向（机器判定）**：读 oracle，按 01 的 `must_not_contain`（`纯文档` / `低风险` / `不涉及代码` / `不影响代码`）检查 → 必须 0 命中（这就是 L2 闸门 ⑤ 的正向半边）；② **反向（机读代理 + 人读兜底）**：读 `01-without-skill.wrong.md`，按同一组禁词检查 → 必须 ≥1 命中；③ 确认两臂来源不同：正向来自**手写 oracle**，反向来自**真实历史错误样本**（不是构造句）。
- **预期**：① 0 命中、② ≥1 命中；两臂各 ≥1 真实材料。
- **判据**：机器——只做两件事：抽取命中数与计数（① 命中数 = 0 且 ② 命中数 ≥1），并把「样本文件:行 + 命中词 + 当时的断言集 `assert_hash`」写进 `fixtures/RECORD.md`。人工——「这两臂证据是否足以证明禁令词双向成立」的**合格性结论由 reviewer-qa 在 `RECORD.md` / `expected.md` 人读区签字**；A1 脚本（`scripts/check-eval-contract.mjs`，见 TC-070）只按留痕复算「命中的词确实在、行号确实对」，**不产 verdict、不改变合格性结论**（spec §3.1 / §3.4）。缺一臂即判「禁令词未双向验证」→ 用例不合格；③ 若正向改用 `fixtures/responses/` 的模型样本，直接判不合格（等于把模型答案当 oracle，TC-061）。
- **红绿证据**：红 = 禁令词只在构造句上验过（换措辞即失效）；或正向仍用模型输出样本；绿 = 手写 oracle 不误杀 + 真实错误样本能拦。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证两臂之外的措辞变化（新增措辞须回到本条重验）。

### TC-047 run-eval.mjs 单测覆盖六件必测事（含 run 三态、verdict 五值）

- **覆盖**：`§7-10 / §3.3-6 / §3.2.2 / §1.5 / §6-8`
- **前置**：`scripts/run-eval.mjs` 与其单测文件已存在（单测文件**不在 `evals/` 下**）。
- **步骤**：① `Get-ChildItem scripts -Recurse -Filter '*.test.mjs'`；② `node --test <单测文件>`；③ `$LASTEXITCODE`；④ 读单测源码，核对**必测六件事**：a) **参数拼装**（`--iteration` 默认 2/拒绝 <2、`--baseline` 由 yaml 决定、`--eval-yaml` 与 `--output-dir` 覆盖、显式值同样 resolve）；b) **退出码选择**（0/1/2/3/4 映射 + 表外码原样透传 + 透传优先于自判定码 + §3.3-6 二维表「工具码 0/1 + 数据完整 → 由 verdict 定码」+ 启动前多条件取首个失败项 + 运行后跨行 `2 > 3 > 1 > 0`）；c) **路径 resolve**（yaml 里五类相对路径一律按 **`evals/` 目录**为基准 → 绝对路径，§3.2.1 单一基准；`skills[].path` 由 `evalsDir` 解析后再注入绝对值；不得按 cwd / 仓库根 / 技能根 / `eval.yaml` 目录另算）；d) **flaky 分组与并集**（按 `eval_name` + `configuration` 分组；**枚举全部 `iteration-*` 取并集**；run 三态 `full`/`partial`/`undetermined`，**字段路径固定为 `runs[].result.passed` / `runs[].result.total`**（顶层出现同名键必须视而不见——真实产物没有；该形态由 TC-079 验），`undetermined` 排除；用例级 OR）；e) **verdict 优先级与互斥**（`INVALID_ENV > INVALID_FLAKY > INVALID_ASSERT > INVALID_DELTA > VALID`；ASSERT 与 DELTA 因 `origin` 互斥；`probe` 排除 ASSERT/DELTA；「配置错误」不在 verdict 维度）；f) **模型模板替换**（`{provider}`/`{name}` → 环境变量；变量缺失 → 码 2 并指明缺哪个；try/finally 还原；残留检测主判据 = 占位缺失，**用非 claude 系模型名 `gpt-5` 验证**）。**建议覆盖（缺了只记 §7 缺口，不判失败）**：g) 机读块校验（`iteration_min` 上下界、`arms`/`delta` 数值域（含 `gate.min_rate ≥ 0.8`）、锚点双向、oracle 断言复算）；h) 产物生命周期（output-dir 已存在 → 码 4；**dry-run 不写 `<output-dir>` / `verdict.md`，但允许物化 `.session/eval/fixture/<技能名>/` 且先删后建**——「产物」在 §3.3-5 里专指前两者）。⑤ 确认单测不 spawn 外部进程、不联网；**允许** `fs.mkdtemp` 建临时目录（h 类断言需要）。
- **预期**：② 运行通过（0 失败）；④ a–f 六件事都有断言覆盖；⑤ 无外部进程 / 网络。
- **判据**：机器——③ = 0 且 ④ a–f 全覆盖；缺任一即失败（新工装也要在守卫之下）。**特别地，d 与 e 缺失即判不合格**——它们是三层判据最容易回归的两个点。g/h 缺失只记 §7 缺口，不判失败（§7-10 的硬要求是「三件纯函数」，本条的 a–f 是它的可执行化，不额外扩权）。
- **红绿证据**：红 = run-eval.mjs 无任何单测（check-all 只扫 `skills/`）；或单测只覆盖三件事、缺 run 三态与 verdict 互斥；绿 = a–f 全覆盖且运行绿。
- **对应测试**：待 plan Task N
- **不覆盖**：不要求单测覆盖真跑全流程（那是 e2e 的职责）。

### TC-048 退出码五种码位各就位 + 二维表 b1/b2 + 首个失败项取码 + 跨行 `2>3>1>0`

- **覆盖**：`§3.3-6（退出码表 / 工具码 × 数据完整性二维表 / 启动前 ①–⑨ 顺序 / 运行后跨行取码）/ §3.3-5①–⑨ / §7-6 / §7-10`
- **前置**：`scripts/run-eval.mjs` 已存在，退出码选择为纯函数（§7-10）；`.mjs` 桩可写（能按需「写 `benchmark.json` 后 exit N」）。
- **步骤**：① **映射函数级**：对退出码映射函数喂以下输入——
  - a) 工具码 0 + 数据完整 + 全部 gate `VALID` + 无 flaky → **0**；
  - **b1) 工具码 1 + 数据完整 + 自判定 `VALID` → 行内 `exit=1`、runner 码 0**（§3.3-6 二维表①：工具码 0/1 + 数据完整 → **由 verdict 定码**，工具码只记进行内 `exit=`；**不得因工具退 1 就把整轮判失败**——本工装设计上就要求不装臂失败，实测 `case01-stability6.log`「3 passed, 3 failed」无 stderr Error）；
  - **b2) 工具码 1 + gate 判 `INVALID_DELTA` → runner 码 1**（同一格：码仍由 verdict 定，verdict 属「结论不达标」→ 1）；
  - **b3) 工具码 1 + 数据完整 + stderr 命中认证特征 → runner 码 2**（**凭据分支优先于二维表①**：不由 verdict 定码，即使数据全过、按数据会算成 `VALID`；行内保留 `exit=1`、`verdict=INVALID_ENV`）；
  - c) 二进制/凭据/模型变量缺失、单 run 超时、**某臂 determined run 数 = 0**、**工具退 0 但无 `benchmark.json`**、**数据量不足** → 2；
  - d) **gate** flaky、0 用例、或 **gate 用例数 = 0** → 3；
  - e) eval.yaml 缺失/坏、`--iteration < 2`、产物目录已存在、机读块 ①–⑦ 不过、**启动前 ⑧ 不过（机读块 ①–④ + `iteration_min`，或 `CONTRACT.json` 缺失 / `exit` ≠ 0 / 哈希不一致）**、`benchmark.enabled` 非 true、路径不存在、fixture 缺 baseline、`apply_diff` 落在 `context` 顶层 → 4；
  - f) 工具码 5（表外）→ 5（原样透传）；
  - **g1) 启动前多条件同时不满足：① 二进制缺失 + ③ 空 cases → 2**（按 ①–⑨ **取首个失败项**，不是「配置错优先」）；
  - **g2) ③ 空 cases + ⑤ `--iteration 1` → 3**（③ 在 ⑤ 之前；若按「凡是配置错就取 4」会错判成 4，这条专抓该错法）；
  - **g3) 进入运行后多行取码 `2 > 3 > 1 > 0`**：行集合 = {`INVALID_ENV`(2)、`INVALID_FLAKY`(3)、`INVALID_ASSERT`(1)} → **2**；把 `INVALID_ENV` 那行换成 `VALID`(0) → **3**；再去掉 flaky 行（只剩 {1,0}）→ **1**；表外码（5）透传**优先于**该顺序（由 TC-077 验）。
  - **g3-2) 混行实例（取码集合只算 `role=gate` 的行）**：行集合 = {gate `INVALID_FLAKY`(3)、probe `INVALID_ENV`(2)} → **3**（probe 只打印、永不参与退出码，**不得被它的 2 盖掉**）；行集合 = {gate `VALID`(0)、probe `INVALID_ENV`(2)} → **0**（同一规则的另一方向：gate 全 0 时 probe 的 2 也不能抬码）。
  ② **集成级抽样**：二进制缺失（TC-033）→ 2；坏 yaml（TC-044）→ 4；**工具码 1 + 无产物（`process.exit(1)` 桩）→ 2**（数据不完整，二维表③；**不是「工具码 1 就当 runner 码 1」**）；exit 5 桩（TC-034）→ 5（表外码透传）。
- **预期**：① a=0、**b1=0（行内 `exit=1`）**、**b2=1**、**b3=2（行内 `exit=1`、`verdict=INVALID_ENV`）**、c=2、d=3、e=4、f=5、**g1=2、g2=3**、g3 三次分别为 2 / 3 / 1、**g3-2 两次分别为 3 / 0**；② 抽样与映射一致；五种表内码位互不相同。
- **判据**：机器——① 各就位且 `{0,1,2,3,4}` 互不相同、f 为 5、g1 取 2、g2 取 3、g3 严格按 `2 > 3 > 1 > 0`、**g3-2 严格按「只算 gate 行」得出 3 与 0**；b1 必须**同时**断言「行内 `exit=1`」与「runner 码 0」两件事（只断言其一会把「工具码」与「runner 码」混成一件事——这正是旧版 b) 的错误）；**b3 必须断言「码 = 2」且「不由 verdict 定码」（数据全过也不得给 0）**；② 抽样一致，且「工具码 1 + 无产物」必须是 2 而不是 1；任一码位缺失/混淆即失败。**「配置错误」不得写进 verdict 枚举优先级**（它只在码 4 维度出现）。
- **红绿证据**：红 = 所有失败归一为同一个非 0 码（四类错误分不开）；或把工具码 1 直接当 runner 码（每个正确评测都会被判失败，因不装臂失败是设计内事件）；或启动前多条件命中时按「配置错优先」一律取 4；**或把 probe 行也算进取码集合（gate flaky(3) + probe env(2) → 误得 2）**；**或漏掉认证 stderr 分支（b3 给出 0/1）**；绿 = 五码位各就位 + 二维表 b1/b2/b3 分开断言 + g1/g2/g3/g3-2 四个实例都可判别 + 表外码透传。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 skill-up 自身对错误的分类；二维表②④两格（工具码 2/3、工具码 5 且有数据）由 TC-076 / TC-077 承载。

### TC-049 `origin: frozen` 的 gate 未达 → INVALID_DELTA（不是 ASSERT、不是「用例无效」）

- **覆盖**：`§3.3-7（五值枚举与解释口径）/ R8（状态迁移）/ R10 / §3.2.2③`
- **前置**：`scripts/run-eval.mjs` 已存在；产物桩可用；`evals/review-triage/frozen-ledger.json` 里**已有**同 `eval_name`「执行动作被替换必须 review」的记录（六字段齐、`assert_hash` 按 §3.2.2③ 的 canonical JSON + sha256 计算并与当前块一致、`arms_snapshot` 与当前 `arms`/`delta` 逐项相等）。**构造方式：按 §3.2.2③ 手写六字段，`node -e` 算哈希，命令与结果记进 `RECORD.md`**——不得引用一个「必然不达标」的用例来造留痕（TC-040 的桩是全 partial，永远拿不到达标记录；QA/RD-8-05）。
- **步骤**：① 按前置约定 ③ 建**两层同构**副本：`$t = Join-Path $env:TEMP 'eval-frozen'; New-Item -ItemType Directory -Force "$t/evals" | Out-Null; Copy-Item -Recurse evals/* "$t/evals/"; New-Item -ItemType Directory -Force "$t/skills" | Out-Null; Copy-Item -Recurse skills/review-triage "$t/skills/review-triage"`；② 把副本 `$t/evals/review-triage/expected.md` 里 02 的 `origin` 改为 `frozen` 并补 `frozen_since`（ISO 日期）；③ 桩在 `--output-dir` 下写 `iteration-1` / `iteration-2` 两份 `benchmark.json`：**每份里每个 config 各 1 个 run**（与真实产物的 `metadata.runs_per_configuration = 1` **同形**——**桩必须复刻真实产物形态**：真实产物每 iteration 每 config 恰好 1 个 run，桩若写成 2 个，`runs=` / `undet=` 的分母口径就和真跑不一致，回归时读不出「计数算错」这类缺陷），两臂每个 run 的 `result` 都是 `{"passed": 0, "total": 3}`（partial，臂内一致 → 非 flaky）；④ 导出模型变量，`$env:SKILL_UP_BIN=<桩>`；⑤ `node scripts/run-eval.mjs review-triage --eval-yaml "$t/evals/review-triage/eval.yaml" --output-dir "$env:TEMP/eval-frozen/out" --iteration 2`；⑥ 读 02 行、退出码与 stdout 结论文本。
- **预期**：⑥ 02 行 `verdict=INVALID_DELTA`（**严格等于**）、`delta=未达`、`flaky=否`、**`runs=2/2`**（2 迭代 × 每 config 1 run）、**`undet=0/0`**、**`rate=0.0/0.0`**；退出码 = 1；结论文本把它解释为「**技能退化**」，**不得**出现「用例无效」「用例需校准」「INVALID_ASSERT」。
- **判据**：机器——⑥ 行内 `verdict=` 严格等于 `INVALID_DELTA`、`delta=未达`、`flaky=否`、**`runs=2/2` 且 `undet=0/0` 且 `rate=0.0/0.0`**；stdout 与 verdict.md 全文出现 `INVALID_ASSERT` 次数 = 0、出现「用例无效 / 需校准」次数 = 0；退出码 = 1。**判别力**：若实现按「每 iteration 每 config 2 run」写死分母（或把 `undetermined` 计入 `runs=`），`runs=` 会变成 `4/4` 或 `2/4`，本条即报错。
- **红绿证据**：红 = frozen 的未达也写 `INVALID_ASSERT`（真实退化被说成用例问题，R8 状态迁移白做）；绿 = `INVALID_DELTA` + 「技能退化」归因。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证「留痕与当前块不一致 → 失效」这条规则（由 TC-074 承载；字段契约与 `assert_hash` 覆盖范围见 spec §3.2.2③）；`frozen_since` 的形态由 TC-055 管。

### TC-050 同一份未达标数据：calibrated→ASSERT、frozen→DELTA；probe 永不出现两者

- **覆盖**：`§3.3-7（ASSERT 与 DELTA 因 origin 互斥）/ §3.2.2③ / §1.5（probe 定义）`
- **前置**：TC-049 的前置全部成立（含留痕与产物桩）。
- **步骤**：准备三份临时副本，**用同一份产物桩数据**（两臂全 partial、非 flaky）：A = 02 `origin: calibrated`；B = 02 `origin: frozen` + 留痕；C = 02 `role: probe` + `arms=null` + `delta=null`。分别跑 runner，各读 verdict.md 的 01/02 行。
- **预期**：A 的 02 行 = `INVALID_ASSERT`；B 的 02 行 = `INVALID_DELTA`；C 的 02 行只能是 `VALID` / `INVALID_FLAKY` / `INVALID_ENV` 之一（本数据下 = `VALID`）；**三份里 `role=probe` 的行（01 与 C 的 02）都不得出现 ASSERT / DELTA**。**另加三条防误读断言（对 C 的 02 行与一切 `probe` 行都必须成立）**：① `role=probe` 与 `delta=n/a` **同现**（缺任一即失败）；② `rate=` 字段**不得省略**，且如实写实际值（本数据下两臂都是 0.0，就写 `0.0/0.0`，禁止写「未判定」冒充、也禁止省略）；③ 结论区（stdout 结论段 + `verdict.md` 结论边界段）**不得出现**「02 达标」「02 通过」——`probe` 的 `VALID` 只表示未 flaky、无环境失败，**不代表断言通过**（spec §3.3-7）。
- **判据**：机器——三次 02 行 `verdict=` 分别严格等于 `INVALID_ASSERT` / `INVALID_DELTA` / `VALID`；扫三份 verdict.md，`role=probe` 行上 `INVALID_ASSERT` 与 `INVALID_DELTA` 出现次数 = 0、`role=probe` 与 `delta=n/a` 同现、`rate=` 非空、结论区无「达标 / 通过」判读；且 A 与 B 的差异只来自 `origin`（同一 `eval_name`、同一 arms/delta 声明、同一份产物数据）——这一点必须能在记录里复算。**不得为了消除误读把 C 的期望改成别的枚举值**（probe 三值封顶是 §3.3-7 的硬约束；要改语义得先改 spec）。
- **红绿证据**：红 = 只按「delta 不足」统一报 `INVALID_ASSERT`（frozen 的退化被吞成「用例无效」，正是 AI-5-02 点名的形态）；或 probe 也进 L3、被报 ASSERT；绿 = 差异只由 `origin` 决定，probe 三值封顶。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 `calibrated → frozen` 的迁移触发条件（TC-063 管留痕，R8 管扩展判据）。

### TC-051 undetermined run 不参与 flaky、不进率分母；两臂 determined=0 → INVALID_ENV + 码 2

- **覆盖**：`§1.5（run 级三态与全过率）/ §3.3-6 / §3.3-7`
- **前置**：runner 已存在；产物桩可用（能在 `runs[].result` 里写 `passed: null` / `total: null`）；**已导出 `EVAL_MODEL_PROVIDER` / `EVAL_MODEL_NAME` 且 `$env:SKILL_UP_BIN=<桩>`**（缺一则拉起真工具或先码 2，本条取不到预期值）。
- **步骤**：① 桩写 `iteration-1` / `iteration-2` / `iteration-3`，**每份 `benchmark.json` 每 config 各 1 个 run**（与 TC-026⑤ 的 `runs_per_configuration=1` 同形，**`passed`/`total` 一律写在 `result` 下**）：`with_skill` = iteration-1 `result={"passed":3,"total":3}`（full）、iteration-2 `result={"passed":3,"total":3}`（full）、iteration-3 `result={"passed":null,"total":null}`（undetermined）；`without_skill` = iteration-1 `result={"passed":0,"total":3}`（partial）、iteration-2 `result={"passed":0,"total":3}`（partial）、iteration-3 `result={"passed":null,"total":null}`（undetermined）；② 02 保持 `calibrated` gate（1.0 / 0.0 / 1.0），带 `--iteration 3` 跑 runner；③ 读 02 行与退出码；④ 把两臂全部 run 的 `result` 改成 `{"passed":null,"total":null}`（同样 3 目录 × 每臂 3 run 全为空值），清掉 out 目录后带 `--iteration 3` 重跑；⑤ 读 02 行与退出码。**说明：③ 用 3 迭代（而不是 2）是为了让每臂 determined=2 ≥ `iteration_min`（默认 2）——否则会撞数据量闸门（TC-071 管：每臂 determined < `iteration_min` 且 > 0 → `flaky=未判定` + `INVALID_ENV` + 码 2），本篇就测不到「undetermined 被排除」本身。**
- **预期**：③ `iteration=3`、`flaky=否`（undetermined 不参与 flaky 判定）、`runs=2/2`（只数 determined）、`undet=1/1`（每臂 3 迭代 × 1 run，其中 2 个 full/partial + 1 个空值）、`rate=1.0/0.0`（分母只算 determined：装臂 2/2 全过、不装臂 0/2 全不过）、`delta=1.0` → 达标 → `verdict=VALID`、退出码 **0**；⑤ `iteration=3`、`runs=0/0`、`undet=3/3`（每臂 3 迭代 × 1 run 全为空值）、`flaky=未判定`、`rate=未判定`、`verdict=INVALID_ENV`、退出码 **2**。
- **判据**：机器——③ `flaky=否` 且 `runs=2/2` 且 `undet=1/1` 且 `rate=1.0/0.0` 且 `verdict=VALID` 且退出码 = 0；⑤ `verdict=INVALID_ENV` 且 `runs=0/0` 且 `undet=3/3` 且 `flaky=未判定` 且退出码 = 2。**判别力**：若把 `undetermined` 当「未全过」，③ 会变成 `flaky=是`；若当「全过」，③ 的 `rate` 会变成 `1.0/1.0`——三值必须恰好是 `否 / 1.0/0.0 / VALID`，且 `runs=2/2`（把空值算进 runs 会写成 `3/3`）。
- **红绿证据**：红 = 空 `passed` 被当未全过 → 伪造 flaky；被当全过 → 伪造达标（spec §1.5 实测：run 失败时工具写空值）；绿 = 三态分类后排除出判定与分母。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证工具为何写空值（外部工具行为）。

### TC-052 只读 iteration-1 的实现必须被检出（正确实现判 flaky=是）

- **覆盖**：`§3.3-6（全部取并集，不是只读 iteration-1）/ R6 / §5⑥`
- **前置**：runner 的 flaky 判定可被调用（§7-10 要求它是纯函数；若尚未单独导出，用 `node --input-type=module -e "import(...)"` 直接 import 该模块）。
- **步骤**：① 建 `$env:TEMP/flaky-union/iteration-1/benchmark.json`：`eval_name`「纯勾选改动应判为可直接提交」+ `configuration: with_skill` 的 2 个 run，**每个 `result` 都是 `{"passed":3,"total":3}`**（full）；② 建 `iteration-2/benchmark.json`：同 `eval_name` + 同 `configuration` 的 2 个 run = 1 个 `result={"passed":3,"total":3}`（full）、1 个 `result={"passed":1,"total":3}`（partial）；③ 用**正确实现**（枚举全部 `iteration-*` 取并集）跑判定，记录输出；④ 用**只读 `iteration-1` 的错误实现**（复现品：只喂第一份文件）跑同一判定，记录输出；⑤ 写对照表。
- **预期**：③ `flaky=是`（同臂 full 与 partial 并存）；④ `flaky=否`；两者必须不同。
- **判据**：机器——③ = `是`、④ = `否`、`③ ≠ ④`。若 ③ = `否`，判 runner「只读单个迭代目录」违约（§3.3-6 明写不得只读 `iteration-1`）；若 ③ = ④（不论同是 or 同否），判本用例失去判别力、必须改用例。
- **红绿证据**：红 = 只读 `iteration-1` 的实现对「iteration-1 全过、iteration-2 抖」恒判 `flaky=否`——**只读 iteration-1 的实现能骗过所有别的用例**，这是本用例唯一要抓的形态；绿 = 并集后判 `是`。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 n ≥ 3 时的检出概率（spec 只给 n=2 的上限说明，见 TC-036 五要素 e）。

### TC-053 机读块 ①：schema 值错 / JSON 不可解析 / 多个 json 围栏块 → 码 4

- **覆盖**：`§3.2.2① / §3.3-5⑧ / §3.3-6（码 4）`
- **前置**：`expected.md` 存在且含恰好一个 `json` 围栏块；runner 可跑 `--dry-run`；**sentinel 桩**（`.mjs`，被拉起时写 `<TEMP>/eval-sentinel.txt`，用于证明「没花模型调用」）；临时 out 目录不存在。**本条同时定义故障注入副本的统一构造**（下文凡写「同 TC-053」的用例一律沿用）：按前置约定 ③ 建**两层同构**副本 `$t = Join-Path $env:TEMP 'eval-block'; New-Item -ItemType Directory -Force "$t/evals" | Out-Null; Copy-Item -Recurse evals/* "$t/evals/"; New-Item -ItemType Directory -Force "$t/skills" | Out-Null; Copy-Item -Recurse skills/review-triage "$t/skills/review-triage"`——**`skills/review-triage/` 那一层不可省**：yaml 里 `skills[].path` 写的是 `../skills/review-triage`（相对 `evals/`）；缺了这层，副本的 `skills[].path` 无目标 → 启动前 ⑥-4 先撞码 4，注入档测不到。（`cases.files` / `oracle` / `apply_diff` 相对 `evals/`、`repo_fixture` 相对 `evals/` 指向副本根内 `.session/`，这两类在两层同构下都在副本内解析，不会回到真仓库。）
- **步骤**：三份临时副本（各用 `eval-block-a` / `-b` / `-c` 的 `$t`）分别注入：a) `schema` 改为 `"eval-expectation/v1"`；b) 删掉 JSON 里一处逗号使其不可解析；c) 复制一份 `json` 围栏块（文件内两个）。每种：`node scripts/run-eval.mjs review-triage --eval-yaml "$t/evals/review-triage/eval.yaml" --output-dir "$env:TEMP/eval-block/out" --dry-run`，记退出码、stdout、`Test-Path <out>/verdict.md`、sentinel 是否存在。
- **预期**：三种情况退出码 = **4**；stdout 单行含 `exit=4` 与 `reason=配置错误`（及细节）；`verdict.md` 不存在；sentinel 不存在。
- **判据**：机器——三种情况四条断言全过（码 4、verdict.md 不存在、sentinel 不存在、stdout 含 `reason=配置错误`）。**另需断言：读到旧 schema 或旧字段 `required_passed` / `required_total` 一律码 4，不做兼容**（把 a 换成「旧标量块」再跑一次，同样码 4）。
- **红绿证据**：红 = 读到旧标量仍继续跑（R7 的「两臂都全过报 VALID」复发）；绿 = 码 4、不产 verdict、不调用模型。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证「文件里没有 json 围栏块」的文案细节（同一判据：块数 ≠ 1 即码 4）。

### TC-054 机读块 ②：eval_name 集合与 cases.files 的 title 不双向相等 → 码 4

- **覆盖**：`§3.2.2② / §3.2.1（title 唯一）/ §3.1`
- **前置**：同 TC-053（sentinel 桩 + 临时副本）。
- **步骤**：四份副本分别注入：a) 删掉 01 的整条 case 对象（缺用例）；b) 多写一条 `eval_name`「不存在的用例」（多写用例）；c) 把 02 的 `eval_name` 改一个字（`必须 review` → `必须审核`）；d) 把 02 用例 yaml 的 `title` 改成与 01 相同（两条用例同名 → 集合失真）。每种跑 `--dry-run`。
- **预期**：四种情况均码 4；stdout 打印差异（缺哪个 / 多哪个 / 哪个不匹配）；不产 verdict 行；sentinel 不存在。
- **判据**：机器——四种码 4 + verdict.md 不存在 + sentinel 不存在 + stdout 至少一个差异项（缺 / 多 / 不一致 / 重名）。
- **红绿证据**：红 = 按数组顺序 join（差一字时静默错配，把 A 的断言套到 B 上）；绿 = 双向集合比较 + 报差异，重名也拦。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 `eval_name` 与 `benchmark.json` 字段的 join 正确性（TC-027 管）。

### TC-055 机读块 ③：role / origin 枚举非法 → 码 4

- **覆盖**：`§3.2.2③ / §1.5（gate 与 probe）`
- **前置**：同 TC-053。
- **步骤**：三份副本分别注入：a) `role: "Gate"`（大小写错）；b) `origin: "CALIBRATED"`（大小写错）；c) 02 缺 `role` 字段。每种跑 `--dry-run`。
- **预期**：三种均码 4；stdout 指名字段（`role` / `origin`）；不产 verdict 行；sentinel 不存在。
- **判据**：机器——三种码 4 + verdict.md 不存在 + sentinel 不存在 + stdout 含 `role` 或 `origin` 字样。**不得做大小写归一后放行**（枚举是机读契约）。
- **红绿证据**：红 = `Gate` 被当 `gate` 放行（下游按 `role` 决定是否进 L3，值错会静默走错分支）；绿 = 严格枚举 + 指名字段。
- **对应测试**：待 plan Task N
- **不覆盖**：`frozen` 的留痕核对归 TC-063；`frozen` 的 `frozen_since` 形态归 ③，由 TC-049 的合法构造证明可过。

### TC-056 机读块 ④：gate 下限越界 / delta.min 越界 / assert 与 yaml 不等 → 码 4

- **覆盖**：`§3.2.2④ / §3.2.1（书写形态）/ §3.4`
- **前置**：同 TC-053。
- **步骤**：三份副本分别注入：a) 02 的 `with_skill.min_rate` 改为 0.7（低于 gate 的绝对下限 0.8——「两臂都低、差值凑够」的口子必须被拦）；b) 02 的 `delta.min` 改为 0（越界，规定 `0 < delta.min ≤ 1`）；c) 02 的 `assert.must_contain` 里一个词改掉（与 yaml `expect.must_contain` 不再逐项相等）。每种跑 `--dry-run`。
- **预期**：三种均码 4；a 的 stdout 指出 `min_rate` 低于下限 0.8；b 指出 `delta.min` 越界；c 指出 `assert` 与用例 yaml 不一致（含词面）；不产 verdict 行；sentinel 不存在。
- **判据**：机器——三种码 4 + verdict.md 不存在 + sentinel 不存在 + stdout 分别命中三组关键词。
- **红绿证据**：红 = 允许 gate 的 `with_skill.min_rate < 0.8`（装臂 0.4 / 不装臂 0.0 也能让 delta 达标）；绿 = 启动前拒。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 `assert` 两组词为空数组（属 §3.4 写作规矩，TC-012 兜）。

### TC-057 机读块 ⑤：oracle 文件缺失 → 码 4

- **覆盖**：`§3.2.2⑤ / §3.3-5⑨`
- **前置**：同 TC-053。
- **步骤**：① 副本里删掉 `evals/review-triage/fixtures/oracle/02-command-swap-semantic.md`，跑 `--dry-run`；② 另一份副本把 02 的 `oracle` 指向一个**目录**（路径存在但不是文件），再跑。
- **预期**：两次均码 4；stdout 指名 oracle 路径；不产 verdict 行；sentinel 不存在。
- **判据**：机器——两次码 4 + verdict.md 不存在 + sentinel 不存在 + stdout 含 `oracle` 与路径。
- **红绿证据**：红 = 缺 oracle 仍跑（L2 名存实亡，断言可达性无从证明，且旧版会退回「用模型样本自证」）；绿 = 启动前拒。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 oracle 内容质量（TC-015/058/061 管）。

### TC-058 机读块 ⑤：oracle 断言不通过 → 码 4

- **覆盖**：`§3.2.2⑤ / §3.4（禁词不做否定豁免）/ §3.3-5⑨`
- **前置**：同 TC-053。
- **步骤**：两个变体：a) 从 02 的 oracle 里删掉含 `必须 review` 的那句（`must_contain` 不再全命中）；b) 在 02 的 oracle 末尾加一句「这是低风险，可直接提交」（`低风险` 是 02 的 `must_not_contain`，纯子串 → 计命中）。分别跑 `--dry-run`。
- **预期**：两次均码 4；stdout 指出哪个断言、哪个词未满足/被命中（含词面 `必须 review` / `低风险`）；不产 verdict 行；sentinel 不存在。
- **判据**：机器——两次码 4 + verdict.md 不存在 + sentinel 不存在 + stdout 含对应词面。**另需对照**：把 b 改为「这不是低风险」→ **仍应判码 4**（工具侧无否定豁免，与 TC-018 同口径），以此证明 ⑤ 与真跑判分同口径。
- **红绿证据**：红 = oracle 与断言不自洽却照跑（断言可达性从未被验证）；绿 = 开跑前码 4。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证禁词豁免的完整句式集合（TC-018 管）。

### TC-059 机读块 ⑥：锚点在 prompt 中命中或 oracle 中 0 命中 → 码 4

- **覆盖**：`§3.2.2⑥ / R4-④ / §3.3-5⑨`
- **前置**：同 TC-053；01 的锚点为 `notes/plan.md`（spec §3.2.2 示例口径）。
- **步骤**：三份副本分别注入：a) 把 `notes/plan.md` 原样写进 01 的 `input.prompt`（prompt 命中 ≥1）；b) 把 `anchors` 改成 oracle 里不存在的串 `notes/nonexistent.md`（oracle 0 命中）；c) 把 `anchors` 写成全角 `ｎｏｔｅｓ/plan.md`（oracle 逐字 0 命中，证明不做模糊匹配）。每种跑 `--dry-run`。
- **预期**：三种均码 4；stdout 区分方向（「prompt 命中」/「oracle 未命中」）；不产 verdict 行；sentinel 不存在。
- **判据**：机器——三种码 4 + verdict.md 不存在 + sentinel 不存在 + stdout 含锚点串与方向词。
- **红绿证据**：红 = 锚点可从 prompt 推断（等于 prompt 自己复述给模型，锚点失去「区分实跑与复述」的判别力）；绿 = 开跑前拒。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 02 的 `anchors`（`["check:all"]`，因 02 已声明 `context.git.apply_diff` **不得为空**）；`[]` 只对未声明 `apply_diff` 的用例合法，此边界记 §7 缺口，不在本条构造。

### TC-060 机读块 ⑦：iteration_min < 2 或大于本次 --iteration → 码 4

- **覆盖**：`§3.2.2⑦ / §3.3-3 / §3.3-5⑤`
- **前置**：同 TC-053；runner 可带 `--iteration` 参数。
- **步骤**：① 副本 a：`iteration_min: 1`，`--iteration 2`；② 副本 b：`iteration_min: 3`，`--iteration 2`；③ 副本 c（对照）：`iteration_min: 2`，`--iteration 2`。三者都跑 `--dry-run`。
- **预期**：①② 码 4 且 stdout 指出 `iteration_min` 与本次 `--iteration`（含两个数值）；③ 退出 0 并打印完整命令行。①② 不产 verdict 行、sentinel 不存在。
- **判据**：机器——①② 码 4 + verdict.md 不存在 + sentinel 不存在 + stdout 含 `iteration_min`；③ = 0。
- **红绿证据**：红 = `iteration_min` 大于本次迭代数仍跑（拿「两次一致」当 n 次证据）；或 `iteration_min: 1` 被当合法（单次结果作门禁）；绿 = 上下界都拒。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 `--iteration` 本身 < 2 的行为（TC-026 管）。

### TC-061 oracle 必须手写（与 responses 某份逐字相同 → 该用例 L2 不合格）

- **覆盖**：`§6-11 / §1.5（oracle 样本）/ §3.1 / §4 步骤 8（不执行 git 写操作）`
- **前置**：`evals/review-triage/fixtures/oracle/*.md` 与 `evals/review-triage/fixtures/responses/*.md` 均存在。
- **步骤**：① 对两组文件做规范化换行后的哈希比对，列出完全相同的文件对；② 扫描 oracle 文件里是否出现「试跑」「本次运行」「模型输出」「历史样本」这类来源自述；③ 人读核对 oracle 的写作视角：应描述「正确答案该长什么样」，不是某次运行的记录；④ **时间先后（三条，粒度不同）**：
  - **④a 机器判（唯一可用判据）**：`[IO.File]::GetLastWriteTimeUtc(<oracle 文件>)` ≤ 首跑产物 `iteration-1/benchmark.json` 的 `metadata.timestamp`（该字段实测存在）；比较前统一到 UTC；
  - **④b 人工签字（防回填）**：`fixtures/RECORD.md` 里登记两件事——oracle 定稿时间、首次真跑时间，并写明签字人；mtime 可被 `Set-ItemProperty` 改写，所以「先后关系成立」这件事必须由人签字背书；
  - **④c 加强项（仅当该文件将来入库时）**：若 oracle 已被纳入 git 历史，`git log --format=%cI -- <oracle 文件>` 的提交时间 ≤ 首跑时间可作加强证据；**未入库时跳过、不判失败**——未提交文件上该命令输出为空且退出码 0，而首跑产物落在 `.session/`（已在 `.gitignore` 内）永远没有提交时间，**用 `git log` 当唯一判据在设计上不可满足**（spec §4 步骤 8「不执行 git 写操作」）。
- **预期**：① 哈希相同的对数 = 0；② 命中数 = 0；③ 人读确认；④a `LastWriteTimeUtc` ≤ `metadata.timestamp`；④b 两行记录 + 签字在位；④c 未入库时标「跳过」，已入库时成立。
- **判据**：机器——① 对数 = 0、② 命中数 = 0、④a 成立、④b 的**两行记录可被解析**；人工——③ 人读结论 + ④b 的签字（防事后补签）。任一不成立即判该用例 L2 不合格（**不是判技能不好**，§6-11）。**不得把 ④c 当唯一判据，也不得因为 `git log` 空输出就判失败**。发现即要求换手写样本，不得「先跑起来再说」。
- **红绿证据**：红 = oracle 直接摘录 `01-with-skill.correct.md`（断言对着模型自己的答案定真值）；或把首跑产物当 oracle 并把 mtime 设成「更早」；绿 = 手写样本 + ④a 成立 + ④b 有签字。
- **对应测试**：待 plan Task N
- **不覆盖**：不检测「人写的但与模型答案高度相似」（只能靠 ③ 人读，见 §7）；④b 的「是否事后补签」机器判不了（只能人读签字，见 §5）。

### TC-062 机读块 ④：probe 的 arms/delta 必须为 null；gate 的不得为 null

- **覆盖**：`§3.2.2④ / §1.5（gate 与 probe）`
- **前置**：同 TC-053。
- **步骤**：两份副本分别注入：a) 01（`probe`）的 `arms` 填 `{"with_skill":{"min_rate":1.0},"without_skill":{"max_rate":0.0}}`、`delta` 填 `{"min":1.0}`（**填假数值应付格式**）；b) 02（`gate`）的 `arms` 与 `delta` 改为 `null`。分别跑 `--dry-run`。
- **预期**：两次均码 4；stdout 指出 `probe` 的 `arms`/`delta` 必须为 null（或 `gate` 的不得为 null）；不产 verdict 行；sentinel 不存在。
- **判据**：机器——两次码 4 + verdict.md 不存在 + sentinel 不存在 + stdout 含 `probe`/`gate` 与 `arms`/`delta` 字样。
- **红绿证据**：红 = 给 probe 编一个达标值 → 本轮按用户 2026-10-22 裁定仍保持 `probe` 的用例被当成达标用例（01 虽已实测装 12/12 run、不装 0/12 run、`flaky=否`、`delta=1.0`，达 R8 升级门槛，但升级须走 R8 迁移并在 `expected.md` 声明 `with_skill.min_rate` / `without_skill.max_rate` / `delta.min`，**不得在用例里偷偷填数值**）；或 gate 缺声明 → L3 无判据却报 VALID；绿 = 形态与 role 严格一致（probe 全 null，gate 全有值）。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 `probe` 升级为 `gate` 的流程（R8 迁移，见 TC-063 留痕与 §6 范围）。

### TC-063 机读块 ③：出生即 frozen（无通过留痕）→ 码 4；有留痕 → 通过

- **覆盖**：`§3.2.2③ / R8（状态迁移）/ R10`
- **前置**：同 TC-053；`evals/review-triage/frozen-ledger.json` 至少有一份可控副本用于删改（**进 git**；`.session/eval/state/` 只放模型账，不承担冻结留痕）。
- **步骤**：① 副本 a：把 02 改为 `origin: frozen` + `frozen_since`，并把 ledger 里同 `eval_name` 的记录删掉（或整份 ledger 移走）→ `--dry-run`；② 副本 b：按 R8 写回**合法留痕**（字段齐 `{eval_name, frozen_since, verified_at, arms_snapshot, delta_at_verify, assert_hash}`，且 `assert_hash` 与当前机读块一致；`verified_at` 指向进 git 的 `evals/review-triage/fixtures/calibration/<eval_name>/`；**另须同落 `verified_snapshot: {iterations, runs, undet, flaky, delta}`——五键齐，且与 `verified_at` 指向的那次 `benchmark.json` 实算一致**，`runs` / `undet` / `flaky` / `delta` 至少四项可复核）→ `--dry-run`；③ 副本 c：`origin: frozen` 但不写 `frozen_since` → `--dry-run`；④ 副本 d：在 ② 的合法留痕上**删掉 `verified_snapshot` 整键（或其中任一键）** → `--dry-run`。
- **预期**：① 码 4，stdout 指出「无校准通过留痕」；② 前置校验通过（退出 0，进入真跑/桩跑），且该留痕的 `verified_snapshot` 五键齐、与那次 `benchmark.json` 实算一致（`runs` / `undet` / `flaky` / `delta` 至少四项可复核）；③ 码 4（`frozen_since` 缺失）；④ 码 4（`verified_snapshot` 缺键 → 留痕不合格）。
- **判据**：机器——①③④ 码 4 + verdict.md 不存在 + sentinel 不存在 + stdout 含留痕 / `frozen_since` / `verified_snapshot` 字样；② = 0 **且** `verified_snapshot` 五键齐并与该次 `benchmark.json` 实算一致（`runs` / `undet` / `flaky` / `delta` 至少四项可复核）；**缺键或与实算不符 → 判留痕不合格（码 4，spec §3.2.2③）**。
- **红绿证据**：红 = 新用例直接写 `origin: frozen`（首跑不达就必然被判「技能退化」——spec R8 点名的悖论：首跑前没法校准）；绿 = 无留痕即拒。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证「留痕与现块是否一致」（由 TC-074 承载）。**字段齐备性**由 A1（TC-070）与本条共同覆盖：§3.2.2③ 已写死六字段 `{eval_name, frozen_since, verified_at, arms_snapshot, delta_at_verify, assert_hash}`（另须同落 `verified_snapshot` 快照），缺任一项 → 码 4（不再记为「spec 未定字段契约」的缺口）；`verified_at` 必须指向进 git 的校准凭证（`fixtures/calibration/<eval_name>/`），**不得只指向 `.session/`**，`verified_snapshot` 五键与实算一致由本条 ②④ 机械核对，但「快照里的数是否取自同一份 `benchmark.json`」仍靠人读该凭证目录对照。

### TC-064 benchmark.enabled 非 true → 码 4、不跑（R7）

- **覆盖**：`R7 / §3.3-5⑦ / §1.5（baseline）`
- **前置**：同 TC-053。
- **步骤**：① 按前置约定 ③ 建**两层同构**副本（`$t = Join-Path $env:TEMP 'eval-nobase'`，构造命令同 TC-053），把副本 `$t/evals/review-triage/eval.yaml` 的 `benchmark.enabled` 改为 `false`；② `node scripts/run-eval.mjs review-triage --eval-yaml "$t/evals/review-triage/eval.yaml" --output-dir "$env:TEMP/eval-nobase/out" --dry-run`；③ `$LASTEXITCODE`；④ 检查 stdout 是否说明基线必须开启（R7）；⑤ 检查是否降级成「只跑装臂继续跑」。
- **预期**：③ = 4；④ 命中 `benchmark` 或 `baseline` 与「必须 / required」类说明；⑤ 未发生（无 verdict 行、sentinel 不存在、out 目录未建）。
- **判据**：机器——③ = 4 + ④ 命中 + ⑤ 成立（verdict.md 不存在、sentinel 不存在）。
- **红绿证据**：红 = 关掉基线仍跑（两臂变单臂，delta 无从计算，绝对通过率冒充有效性）；绿 = 拒。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证工具本身允许关闭（spec 明写：工具允许，工装不允许）；`enabled` 写字符串 `"true"` 的行为也不在本条（按 ⑦ 严格要求 `=== true`，同判据）。

### TC-065 源目录（⑥-1）/ 物化后 `repo_fixture` 字面值（⑥-3）/ `apply_diff`（⑥-3）/ `skills[].path`（⑥-4）不存在 → 码 4（validate 与工具 dry-run 会静默放过的对照）

- **覆盖**：`§3.3-5⑥（⑥-1…⑥-4 执行顺序 + 失败项编号）/ §3.1（源目录 + 物化路径）/ §3.2（skills[].path）/ §3.2.1（路径单一基准）/ §3.3-1（repoRoot 推导）/ R5 / §1.5（fixture 仓库）`
- **前置**：有 skill-up 二进制；同 TC-053 的**两层同构**副本（前置约定 ③）与 sentinel 桩；先 `Set-Location <仓库根>`，再 `$evalsDir = (Resolve-Path (Join-Path (Split-Path evals/review-triage/eval.yaml -Parent) '..')).Path`（断言其末级目录名为 `evals`，§3.3-1）、`$repoRoot = (Resolve-Path (Join-Path $evalsDir '..')).Path`（断言 = 仓库根）；`$skillRoot = (Resolve-Path skills/review-triage).Path` 只用于「技能目录内是否含 `SKILL.md`」，**不作用例侧路径的解析基准**。
- **步骤**：四份副本（各自 `$t`，两层同构）分别注入：
  - **a) ⑥-1 源目录缺失**：把 01 的 `context.repo_fixture` 末段改成 `no-such-repo`（`../.session/eval/fixture/review-triage/no-such-repo`，**相对副本的 `evals/`**）→ 源目录 `evals/review-triage/fixtures/repos/no-such-repo/` 不存在 → **⑥-1** 失败；等价档 a′：删掉副本里的源目录 `evals/review-triage/fixtures/repos/checkbox-demo/` 而字面值不动 → 同样 **⑥-1**；等价档 a″：删掉副本里的 `evals/review-triage/fixtures/repos/command-swap-demo/`（02 的源目录）而 02 字面值不动 → 同样 **⑥-1**（**两个源目录 `checkbox-demo` / `command-swap-demo` 都要被 ⑥-1 覆盖**，只查一个会漏 02）；
  - **b) ⑥-3 物化后的字面值路径不存在**：`repo_fixture` 末段仍是 `checkbox-demo`（源目录在 → ⑥-1 过；物化按 repo 名照跑 → ⑥-2 过），只把前缀改成 `../.session/eval/fixture-wrong/review-triage/checkbox-demo` → **⑥-3** 核对的是**字面值**解析后的路径，故失败；
  - **c) ⑥-3 `apply_diff` 不存在**：01 的 `context.git.apply_diff` 指向不存在的补丁文件 → **⑥-3** 失败；
  - **d) ⑥-4 `skills[].path` 不存在**：`eval.yaml` 的 `skills[0].path` 改成 `../skills/no-such-skill`（**仍是相对 `evals/`**，只是指向不存在）→ **⑥-4** 失败（该字段由 `evalsDir` 解析，§3.2.1 / §3.3-1）。
  每种跑三个动作：① `& $env:SKILL_UP_BIN validate "$t/evals/review-triage/eval.yaml"`；② `skill-up run "$t/evals/review-triage/eval.yaml" --dry-run`（**工具自身的 dry-run**，与 runner 的 `--dry-run` 区分）；③ runner 的 `--dry-run`：`--eval-yaml "$t/evals/review-triage/eval.yaml" --output-dir "$env:TEMP/eval-missing/<档>/out"`（不存在），**按 ⑥-1 → ⑥-2 → ⑥-3 → ⑥-4 → ⑥-5 顺序核对失败点**。同时用**同一基准 = `evals/`** 独立复算：a/b/c/d 一律 `Test-Path (Join-Path $evalsDir <yaml 里的字面值>)`——都必须 `False`；**不得**给 `skills[].path` 用 `$repoRoot` 或 `$skillRoot` 另算一套，也不得给 `cases.files` / `oracle` / `repo_fixture` / `apply_diff` 换基准（§3.2.1：五类路径只有 `evalsDir` 这一个起点）。
- **预期**：① 与 ② **可能 exit 0**（实测会静默放过——这是对照组，不是判据）；③ runner 必须 **码 4**，stdout **单行** `exit=4 reason=配置错误 <细节>`，且 `<细节>` 含**失败项编号 + 对象名**：a → `⑥-1` + 源目录名、b → `⑥-3` + 物化路径、c → `⑥-3` + 补丁路径、d → `⑥-4` + `../skills/no-such-skill`；`Test-Path`（按 `evals/` 基准展开）为 `False`；不产 verdict 行；sentinel 不存在。
- **判据**：机器——③ 四档码 4 + 单行含 `exit=4` 与 `reason=配置错误` + **失败项编号与档位对应**（a=⑥-1 / b=⑥-3 / c=⑥-3 / d=⑥-4）+ `verdict.md` 不存在 + sentinel 不存在 + `Test-Path` 为 `False`；**b 档必须落在 ⑥-3，不得报成 ⑥-1**——两者混淆说明「物化按 repo 名、核对按字面值」被写成「按字面值查源目录」；**a 档必须落在 ⑥-1**（源目录不存在就不该进入物化）；①② 只记录实测值（0 或非 0 都记，**不得用 validate 或工具 dry-run 的 0 当通过**）。**判别力**：若测试脚本换成仓库根或技能根展开（`../skills/…` 被当成相对仓库根），`Test-Path` 也可能报 `False`——但那时**证明不了** yaml 写对了基准，故必须用与 runner/工具相同的 `evalsDir` 展开（TC-069 另做正向观测）。
- **红绿证据**：红 = 只靠 `validate` 判配置有效（spec 实测：不存在的 fixture 目录与 `path: .` 都被放过）；或把「源目录不存在」与「物化后不存在」混成一个错误码而不区分（排查时无法定位是素材缺了还是物化逻辑没跑）；或给 `skills[].path` 换用 `$repoRoot` / `$skillRoot` 展开（`../skills/…` 会落到错位路径，而正确基准是 `evals/`）；绿 = runner 启动前闸门 ⑥ 按 ⑥-1…⑥-5 顺序拦住，单行带失败项编号与对象名。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 skill-up 未来版本是否补上校验（届时 ① 应为非 0，本判据不因此放宽）；不单独构造「`<eval.yaml 所在目录>/..` 的末级不是 `evals`」的失败分支（runner 按 §3.3-1 直接码 4，无独立判别价值）。

### TC-066 `apply_diff` 写到 `context` 顶层（层级错）→ 补丁不生效、工作区无 `.git`，用例不合格

- **覆盖**：`R5 / §1.5（fixture 仓库）/ §4 步骤 0（自查①）`
- **前置**：TC-020 通过；`$env:TEMP` 可写；有 skill-up 二进制；01 的 fixture 与补丁已就位。真跑取证需模型凭据（无凭据时退到结构断言 + 2026-10-22 实测记录，并注明取证边界）。
- **步骤**：
  ① 按前置约定 ③ 建**两层同构**副本：`$t = Join-Path $env:TEMP 'eval-wrong-level'; New-Item -ItemType Directory -Force "$t/evals" | Out-Null; Copy-Item -Recurse evals/* "$t/evals/"; New-Item -ItemType Directory -Force "$t/skills" | Out-Null; Copy-Item -Recurse skills/review-triage "$t/skills/review-triage"`；
  ② 把副本 `$t/evals/review-triage/cases/01-checkbox-mechanical.yaml` 的 `apply_diff` 从 `context.git` 下**上移**到 `context` 顶层（与 `repo_fixture` 同级，`git:` 段保留或删除均可），用 `[IO.File]::WriteAllText($p,$t2,(New-Object Text.UTF8Encoding $false))` 写回（无 BOM）；
  ③ 结构断言：解析副本 yaml，断言 `apply_diff` 与 `repo_fixture` 的**父节点相同**（即层级错已被构造出来）；
  ④ **结构侧**：跑 runner `--dry-run`（`--eval-yaml "$t/evals/review-triage/eval.yaml" --output-dir "$env:TEMP/eval-wrong-level/out"`）→ 断言退出码 **4**、stdout **单行** `exit=4 reason=配置错误 <细节>` 且 `<细节>` 含失败项编号 **`⑥-4`**（spec §3.3-5⑥-4：`apply_diff` 必须写在 `context.git` 下）与 `apply_diff` 字样（runner 会在启动前拦住、**不会 spawn 工具**，所以行为侧不能走 runner）；**行为侧**（有凭据时）：**绕过 runner 直调工具** `& $env:SKILL_UP_BIN run "$t/evals/review-triage/eval.yaml" --output-dir "$env:TEMP/eval-wrong-level/out" --iteration 2`，才可能拿到模型回复。**关键前置（A1/A3 的后果）**：物化现在是 **runner 的职责**（按 repo 名落到 `.session/eval/fixture/review-triage/checkbox-demo/`），绕过 runner 就没有人建它——所以行为侧开跑前必须**先用一次 runner `--dry-run` 把物化做完**（并确认 **⑥-3** 的路径存在），否则「工作区没有 `.git`」会是「根本没物化」造成的，与本条要测的「层级错导致补丁静默不打」混成一因；若物化副本已存在，直接复用即可（工具只读 yaml 里的静态路径）；无凭据时以 spec R5 的 2026-10-22 实测记录为行为侧依据，并写清「结构断言已成立、行为侧取自实测记录」；
  ⑤ 读 01 装技能臂回复（`<output-dir>/iteration-*/` 内该 run 的输出）；
  ⑥ 取该 run 的临时工作区（产物里记录的 workspace 路径）跑 `git status`，并读 `notes/plan.md`。
- **预期**：③ 成立；④ 结构侧 = 4 且单行含 `⑥-4` 与 `apply_diff`；⑤ 回复出现「当前目录不是 git 仓库」/「没有未提交改动」一类说法，而不是判「可直接提交」；⑥ `git status` 报 `not a git repository`（或 `fatal: not a git repository`），`notes/plan.md` 仍为 `- [ ]`（补丁未打上）。结论：该形态必须判**用例不合格**，**不得**把它当成「技能判错」的证据。
- **判据**：机器——③ 成立 **且** ④ 结构侧退出码 = 4 **且** 单行含失败项编号 `⑥-4`（层级错被启动前校验拦住，且能定位到具体失败项）**且**（⑤ 命中 `不是 git 仓库` / `not a git repository` / `没有未提交改动` **或** ⑥ 的 `git status` 命中 `not a git repository` **或** ⑥ 的 `plan.md` 仍为 `- [ ]`）**且** 判定记录写「用例不合格」，**或无凭据档**：④ = 4 且 `RECORD.md` 已注明「行为侧未取证」（此时不判 ⑤⑥）；若 ⑤ 判「可直接提交」且 ⑥ 的 `git diff` 出现一行翻转，说明层级没写错（构造失败），本条不成立，须先修正构造再复跑。
- **红绿证据**：红 = 写成 `context.apply_diff`（与 `repo_fixture` 同级）：工具当未知字段**静默忽略**，补丁不生效、工作区连 `.git` 都没有（2026-10-22 实测：模型回「当前目录不是 git 仓库」「没有未提交改动」）；绿 = 改回 `context.git.apply_diff` 后，同一临时工作区 `git status` 出现 ` M notes/plan.md`、`git diff` 显示一行翻转。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证工具未来版本是否会把未知字段报错（届时本条预期改为「非 0 退出」，判据不放宽）；不验证 `context.git` 下其他子字段（`checkout` / `remotes`）的层级。

### TC-067 fixture 无 baseline 提交（只 `git init` 或没有 `.git`）→ `git diff` 为空、全是 `??`，用例不合格

- **覆盖**：`R5 / §1.5（fixture 仓库）/ §4 步骤 0（自查②③）`
- **前置**：TC-020 通过；`$env:TEMP` 可写；`git` 可用。**说明（spec §6-7 的两处例外，均需用户/议会确认后执行）**：① 本条在 `$env:TEMP` 里做 `git init` / `git add` / `git apply`（不执行 `git commit`）；② runner 运行期在 `.session/eval/fixture/**` 为**物化副本**（按 **repo 名** `checkbox-demo`，不按 case-id）做 `git init` / `add` / `commit`。**仓库内源目录永不带 `.git`、永不做 git 写**——本条的构造只发生在 `$env:TEMP`，不涉及本仓库历史。
- **步骤**：
  ① `$t = Join-Path $env:TEMP 'cb-nobaseline'; Remove-Item -Recurse -Force $t -ErrorAction SilentlyContinue`；`Copy-Item -Recurse evals/review-triage/fixtures/repos/checkbox-demo $t`；
  ② 删除副本里的 `.git`（`Remove-Item -Recurse -Force "$t/.git" -ErrorAction SilentlyContinue`）——源目录本该没有 `.git`，本步是**防御性清理**（若上次手工试验残留）；
  ③ `git -C $t init`（模拟 `context.git.init: true` 的实际效果：只建**空仓库**）；
  ④ `git -C $t apply (Resolve-Path evals/review-triage/fixtures/diffs/checkbox.patch)`（补丁能打上，但没有任何基线提交）；
  ⑤ `git -C $t log --oneline`；⑥ `git -C $t status --porcelain`；⑦ `git -C $t diff`；⑧ 清理 `$t`。
- **预期**：⑤ 报 `does not have any commits yet`（无提交）；⑥ 全是 `??`（untracked，含 `notes/plan.md`）；⑦ 输出为空 → 模型看不到「未提交改动」，技能会判「没有未提交改动」。结论：该形态**跑不进目标场景**，必须判**用例不合格**，并把 fixture 改为「目录自带已提交的 git 仓库」。
- **判据**：机器——⑤ 无提交行（或报无提交）**且** ⑥ 命中 `??` **且** ⑦ 行数 = 0；三条同时成立即证明该形态不可用 → 判用例不合格。反之若 ⑦ 有一行翻转，说明存在基线（构造失败），须先修正构造。
- **红绿证据**：红 = 只写 `context.git.init: true` 就以为有 git 场景：`.git` 存在，但 `git log` 报 `does not have any commits yet`、`git status` 全是 `??`、`git diff` 为空 → 技能仍判「没有未提交改动」（2026-10-22 实测）；绿 = fixture 目录自带 baseline 提交（上传保留 `.git`：`git log` 可见 `baseline` 提交、`git status` 显示 ` M notes/plan.md`、`git diff` 显示 `- [ ]`→`- [x]` 一行翻转）。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证工具上传时对 `.git` 的其他处理（忽略规则、`.gitignore` 冲突）；不验证多提交历史或分支（`checkout`）场景；不重复 TC-066 的层级错。
- **凭据**：纯本地 git 操作，不需要模型凭据。

### TC-068 用例 01 的 `must_contain` 只有结论词、缺证据词 → 用例不合格

- **覆盖**：`R4-④ / R10 / §3.5 / §1.5（正例证据词）`
- **前置**：01 的 yaml 与 `expected.md` 机读块已就位；`fixtures/responses/` 中 01 的历史样本可读（仅作人读对照）。
- **步骤**：
  ① 解析 01 的 `expect.must_contain`（块列表，§3.2.1 书写形态）；
  ② 断言含**结论词** `可直接提交`；
  ③ 断言含**证据词** `git diff`（该串在 01 的 `input.prompt` 中 0 命中，属实跑证据）；
  ④ 核对 `expected.md` 机读块 01 的 `assert.must_contain` 与 ②③ **逐项相等**（L2 闸门 ④ 的输入）；
  ⑤ 构造「只给结论、不给证据」的假回复 `$fake = '纯勾选改动，可直接提交。'`，按 01 的全部断言跑一遍（应 FAIL：`must_contain` 缺 `git diff`）；
  ⑥ 对照 R10 的实测记录：只留结论词时，不装技能臂 3 次里 1 次误过 → `flaky=是`、`delta=0.667`；补上 `git diff` 后，不装技能臂 3/3 稳定失败、装技能臂 3/3 稳定通过。
- **预期**：②③ 同时成立；④ 两处逐项相等；⑤ `$fake` 判 FAIL；⑥ 记录与实测一致。
- **判据**：机器——② 且 ③ 且 ④ 且 ⑤ 成立；**只含结论词（缺 `git diff` 这类证据词）即判 01 用例不合格**——结论词判别力不足会把模型行为波动伪造成 flaky（实测 `flaky=是`、`delta=0.667`），而不是技能无效。
- **红绿证据**：红 = `must_contain: ["可直接提交"]`：不装技能臂 3 次里 1 次因凑巧说出结论词而误过 → `flaky=是`、`delta=0.667`（伪造出 flaky）；绿 = `must_contain: ["可直接提交", "git diff"]`：不装臂 3/3 稳定失败、装臂 3/3 稳定通过、`flaky=否`、`delta=1.0`。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证除 `git diff` 之外的其他证据词写法（如「diff 字面核对」，口径见 TC-017——若出现「正确回答只写 diff 字面核对却被判 FAIL」的实例，按 §6-1 先改用例并回 TC-017，不得改技能迁就）；不判断结论词与证据词之外的理由级词（TC-012/014 管）。

### TC-069 yaml 路径基准：五类字面值统一以 `evals/` 目录为基准 + 副本两层同构 + 工具真解析到（正向观测）

- **覆盖**：`§3.2.1（相对路径单一基准 = evals/）/ §3.2（skills[].path = ../skills/<技能名>）/ §3.1（物化路径）/ §3.2.2（oracle / anchors）/ §3.3-1（repoRoot 推导与注入）/ §3.3-5⑥（顺序）/ §4 步骤 0`
- **前置**：`evals/review-triage/` 与 `skills/review-triage/` 就位；有 skill-up 二进制；正向观测（步骤⑤）需模型凭据（无凭据只能记「未取证」）。先 `Set-Location <仓库根>`，再 `$evalsDir = (Resolve-Path (Join-Path (Split-Path evals/review-triage/eval.yaml -Parent) '..')).Path`（断言末级目录名 = `evals`，§3.3-1）、`$repoRoot = (Resolve-Path (Join-Path $evalsDir '..')).Path`（断言 = 仓库根）。
- **步骤**：① 从 `eval.yaml` 抽 `skills[0].path`（1 条）与 `cases.files`（2 条），从 01 / 02 的 yaml 各抽 `context.repo_fixture` 与 `context.git.apply_diff`（4 条），从 `expected.md` 抽两个 `oracle`（2 条）——**本条一切断言的对象 = ① 抽出的每一个字面值**（当前共 9 个；**不写死具体个数**，用例集扩容时不用改本条）；
 ② **分类断言（三类基准，全部相对 `evals/`；绝对路径一律不许）**：
  - `skills[].path` → **以 `../skills/` 开头**（当前 `../skills/review-triage`，§3.2.1 / §3.2）；`[IO.Path]::IsPathRooted(<字面值>)` = `False`；**不得**写成仓库根相对的 `skills/<技能名>`（按 `evals/` 解析会变成 `evals/skills/…`）、也**不得**写 `../../skills/…`（越过仓库根）、也**不得**写 `.`（§3.2 已知缺口）；
  - `cases.files` / `context.git.apply_diff` / `oracle` 三类 → 必须**以 `review-triage/` 开头**（如 `review-triage/cases/01-checkbox-mechanical.yaml`、`review-triage/fixtures/diffs/command-swap.patch`、`review-triage/fixtures/oracle/02-command-swap-semantic.md`；相对 `evals/` 目录）；`IsPathRooted` = `False`；**不得**写成仓库根相对的 `evals/review-triage/…`，也**不得**再带两层回跳；
  - `context.repo_fixture` → 必须**以 `../.session/eval/fixture/review-triage/` 开头**（相对 `evals/`，指向物化路径），且末段 = 对应源目录名：01 = `checkbox-demo`、02 = `command-swap-demo`（§3.1：它是**物化路径**，不是源目录 `review-triage/fixtures/repos/...`）；`IsPathRooted` = `False`；
  - 五类字面值**一律不得是绝对路径**（`IsPathRooted` 必须全为 `False`）；**不得要求 ① 抽出的所有字面值同一前缀**——`skills[].path` 以 `../skills/` 开头、物化路径以 `../.session/` 开头、其余以 `review-triage/` 开头，**三类并存才是正确形态**（旧写法要求「全部同一前缀」，会把正确的 yaml 判错）；
 ③ **按同一基准复算（单一基准 = `evals/`，§3.2.1 / §3.3-1）**：五类字面值一律 `Test-Path (Join-Path $evalsDir <字面值>)`——`skills[].path` 落在 `<仓库根>/skills/review-triage`；`cases.files` / `apply_diff` / `oracle` 落在 `<仓库根>/evals/review-triage/…`；`repo_fixture` → **先按 ⑥ 的顺序物化（先删后建）再查**：`Test-Path` = `True` 且 `Resolve-Path` 落在 `<仓库根>/.session/eval/fixture/review-triage/<repo-name>` 之内；**物化前查它必然 `False`**（这正是 ⑥-3 必须在 ⑥-2 之后的原因）。02 的 `repo_fixture`（`command-swap-demo`）与 `apply_diff`（`command-swap.patch`）同样复算；
 ④ **反向判别（同一基准，方向相反）**：把五类字面值改用**仓库根**作基准展开（`Test-Path (Join-Path $repoRoot <字面值>)`）→ 必须**全部 `False`**（`skills[].path` 从仓库根再上一层 = 仓库外；`review-triage/…` 落到 `<仓库根>/review-triage/…`；`../.session/…` 落到仓库上一层的 `.session/…`）；再把 `skills[].path` 用**技能根**展开（`Test-Path (Join-Path $skillRoot <字面值>)`）→ 必须 `False`（会落成 `skills/<技能名>/../skills/<技能名>` = `skills/skills/<技能名>`）；**不得把 `evalsDir` 换成 `repoRoot` / `skillRoot` 混用**；
 ⑤ **正向观测（判据必须是这个，不是「没报错」）**：删掉 `<output-dir>` 后真跑 `--iteration 2`，读产物结构——`<output-dir>` 下必须出现 **case-id 目录**（`<output-dir>/<case-id>/…`，case-id 与两个用例文件名去扩展名逐字相同），且 `benchmark.json` 的 `eval_name` 集合 = 两条用例的 `title` 集合；无凭据时记「⑤ 未取证」并保留 ②③④⑥ 结果；
 ⑥ **故障注入副本必须两层同构**（前置约定 ③ / spec §3.2.1 第 9 轮 BE-9-02）：建 `<副本根>/evals/<技能名>/eval.yaml` + `<副本根>/skills/<技能名>/` 两层（命令见 TC-053 前置），断言 `Test-Path "$t/evals/review-triage/eval.yaml"` 与 `Test-Path "$t/skills/review-triage/SKILL.md"` 均 `True`；**反向对照**：删掉 `<副本根>/skills/` 整层 → runner `--dry-run`（`--eval-yaml "$t/evals/review-triage/eval.yaml"`）必须**码 4** 且单行含失败项 **`⑥-4`**（`skills[].path` 按副本 `evals/` 解析后不存在/不含 `SKILL.md`）——**不得**退出 0。**理由**：副本的 `review-triage/…` 与 `../.session/…` 都以副本 `evals/` 为基准、落在副本根内，不会回到真仓库；缺 `skills/` 层时 `../skills/…` 无目标，启动前 ⑥-4 先拦——省掉这层还让它跑，注入档就测不到 A1（skills 路径注入），负例永远拦不住。
- **预期**：② ① 抽出的每个字面值都落到它该落的那一类上（`skills[].path` = `../skills/review-triage`；`cases.files` / `apply_diff` / `oracle` 走 `review-triage/…`；`repo_fixture` 走 `../.session/eval/fixture/review-triage/<repo-name>`），`IsPathRooted` 全为 `False`、无绝对路径；③ 五类按 `evals/` 基准复算全 `True`（`repo_fixture` 必须在物化后）；④ 反向判别全部 `False`（仓库根 / 技能根各判一次）；⑤ 有凭据时 case-id 目录与 `eval_name` 集合成立；⑥ 两层同构在位，删 `skills/` 层 → 码 4 + `⑥-4`。
- **判据**：机器——② 分类断言对 ① 抽出的**每一个**字面值成立（含 `repo_fixture` 单独一格，不得被要求改成相对 `evals/` 的 `review-triage/…`；含 `skills[].path` 单独一格，不得被要求改成 `../../skills/…`）**且** ③ 复算成立（`repo_fixture` 必须在物化后为 `True`）**且** ④ 两个方向都成立 **且** ⑥ 同构自检与反向对照成立 **且** ⑤ 有凭据时成立。**⑤ 不得以「命令退出 0 / 没报错」通过**——`validate` 与 `--dry-run` 都不校验这些路径（spec §1.5 / R5 实测），「没报错」恰恰是错基准最典型的表现；无凭据时 ⑤ 只能记「未取证」，**不得记为通过**。
- **红绿证据**：红 = 把 `cases.files` 写成仓库根相对的 `evals/review-triage/cases/…`（按 `evals/` 解析成 `evals/evals/review-triage/…`，静默找不到，而 `validate` 仍 exit 0）；或把 `skills[].path` 写成仓库根相对的 `skills/<技能名>`（按 `evals/` 解析成 `evals/skills/…`，⑥-4 拦）；或把 `skills[].path` 写成 `../../skills/review-triage`（越过仓库根）；或把 `repo_fixture` 写成 `review-triage/fixtures/repos/checkbox-demo`（源目录、无 `.git`）；或把 `repo_fixture` 写成按 case-id 物化（`../.session/eval/fixture/review-triage/<case-id>`，源目录名对不上）；或反过来要求五类字面值同前缀（把正确写法判错）；**或只把 `evals/` 复制到 TEMP、副本缺 `skills/` 层**——注入档先在 ⑥-4 撞码 4、A1 测不到；绿 = `skills[].path` = `../skills/review-triage` + 三类 `review-triage/…` + `repo_fixture` = `../.session/eval/fixture/review-triage/<repo-name>` 并存，副本两层同构，且产物里真出现 case-id。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 `context.git.checkout` / `remotes` 内路径（本轮不用）；不单独构造「`<eval.yaml 所在目录>/..` 的末级不是 `evals`」的分支（TC-065 已注明：runner 直接码 4，无独立判别价值）。

### TC-070 A1 离线契约脚本：0 findings，且能拦「机读块改坏 / title 重名 / 留痕造假」三类；改判据不重跑 A1 → 启动前码 4

- **覆盖**：`§1 影响面④ / §3.4（禁词双向留痕 + 改判据必跑 A1）/ §3.1（responses 的唯一授权机器用途）/ §3.3-5⑧（变更期闸门）/ §4 步骤 9 / §5⑩ / §6-13 / §7-11`
- **前置**：`scripts/check-eval-contract.mjs` 已存在；`evals/review-triage/` 全部判据文件与 `fixtures/RECORD.md` 就位；`$env:TEMP` 可写。**不需要模型凭据**。
- **步骤**：① `node scripts/check-eval-contract.mjs review-triage`；② `$LASTEXITCODE`；③ 输出含 `0 findings`（或等价「全过」摘要）；④ **不挂载、零依赖**：`Select-String -Path package.json -Pattern 'check-eval-contract'` → 0 命中（**不得加 npm script**）；`Select-String -Path scripts/check-all.mjs -Pattern 'check-eval-contract'` → 0 命中；⑤ **不读产物目录、不产 verdict**：先剔除脚本源码里的**注释**（`//` 行注释与 `/* … */` 块注释内的文字），只看**非注释行**里有没有**读取**产物目录的调用——判据是「`readFile` / `readFileSync` / `JSON.parse` / `readdir` / `glob` 的参数字符串里含 `benchmark.json`、`eval/out`、`verdict`」，或与这些字样相邻（同一语句内）的路径拼装；**只在注释里写「本脚本不读 verdict」不算命中**（裸 grep 会把注释当成调用，造出假红）；同时断言跑完 `Test-Path .session/eval/out` 的新增项 = 0；
  ⑥ **三类注入各一次（只在 `$env:TEMP` 副本里改，正本不动）**：先按前置约定 ③ 建**两层同构**副本（`$t = Join-Path $env:TEMP 'eval-a1'`，构造命令同 TC-053；**缺 `skills/` 层时副本的 `skills[].path`（`../skills/review-triage`）无目标 → 启动前 ⑥-4 先码 4，三类注入测不到；副本的 `review-triage/…` 与 `../.session/…` 都以副本 `evals/` 为基准，不会回真仓库**）：a) **机读块断言集被改坏**——把 `$t/evals/review-triage/expected.md` 里 02 的 `assert.must_contain` 删掉 `机器判不了`（与用例 yaml 的 `expect` 不再逐项相等）；b) **`title` 重名**——把 01/02 的 `title` 改成同一串 `X`，**并同时**把 `expected.md` 两个 `eval_name` 也改成 `X`（这样集合比较与多重集比较都会放过，只有唯一性检查能拦）；c) **禁词双向留痕造假**——把 `RECORD.md` 某条反向证据的「命中词」改成一个该样本里根本不存在的词（或把行号改成越界值）。每类跑一次脚本（判据对准副本的 `evals/review-triage/`；**副本快照一律手工复算 sha256 写回**——A1 的用法只有 `[<技能名>] [--json] [--deep]`，无法指向副本；若只在真仓库跑 A1，该档记「副本侧未取证」，**不得把「在真仓库跑一遍」当成副本已注入**）；
  ⑦ **变更期闸门（§3.3-5⑧）**：在副本里改 `$t/evals/review-triage/expected.md`（给 02 的 `assert.must_contain` 加一个词，**同时**把副本用例 yaml 的 `expect` 同步改，保证不撞 ④ 的「逐项相等」）→ **不重跑 A1** → 跑 runner `--dry-run --eval-yaml "$t/evals/review-triage/eval.yaml" --output-dir "$env:TEMP/eval-a1/out-a"`（**`out-a` 必须不存在**——否则会先撞 §3.3-5④「产物目录已存在」码 4，把「CONTRACT 不一致」的失败原因洗成「目录已存在」）：必须 **码 4**、stdout 单行 `exit=4 reason=配置错误`、提示先跑 `node scripts/check-eval-contract.mjs`；随后**手工复算副本文件的 sha256、写回副本 `CONTRACT.json` 的 `files` 条目**（A1 无副本根参数，不得用它代劳；不得把「A1 在真仓库跑过」写成「副本已刷新」）→ 再跑 runner `--dry-run --eval-yaml "$t/evals/review-triage/eval.yaml" --output-dir "$env:TEMP/eval-a1/out-b"`（**`out-b` 同样不存在、且与 `out-a` 不同**）→ **闸门 ⑧ 放行**（不再报 CONTRACT 不一致）；
  ⑧ 三类注入都恢复后，对**真**仓库再跑一次 ①。
- **预期**：② = 0、③ `0 findings`；④⑤ 全部 0 命中（⑤ 的注释行不计）；⑥ a/b/c **各退出码 4**，并分别指名「`eval_name` + 差异词」「`title` 重名 / duplicate」「样本文件 + 词/行不一致」；**⑦ 改后不重跑 → 码 4 单行 `reason=配置错误` + 提示跑 A1；手工复算 sha256 写回副本 `CONTRACT.json` 后 → 闸门 ⑧ 放行**；⑧ 再跑仍退出 0（注入没污染正本）。
- **判据**：机器——② = 0 且 ③ 成立且 ④⑤ 全部 0 命中（⑤ **按非注释行的调用参数判**，不得把注释命中计为违规，也不得把「真调用」当注释放过）且 ⑥ 三次**严格 = 4**（只打印 findings 却退出 0 判失败）且 **⑦ 两档分别严格 = 4 与「闸门 ⑧ 放行」**且 ⑧ = 0。**判别力**：⑥b 若不「同时改 `eval_name`」，就退化成集合比较能拦的普通差异（TC-054 已覆盖）；只有「多重集相等 + 同一条用例名重复」这一形态才专测唯一性检查。⑥c 造假的形态必须选「词不存在于样本」或「行号越界」，否则测的是「记录写得潦草」而不是「记录与样本对不上」。⑦ 只有「A1 的产物被 runner 真读、且按哈希比对」才可能通过——把 ⑧ 写成「只检查文件存在」会在 ⑦ 第一档放行。
- **红绿证据**：红 = 脚本不存在（S10 的原始缺陷：规矩写了但没有执行入口）；或挂进 `npm run check`（破坏「不花钱、跑得快、结果确定」的契约，R2 / §6-13）；或只打印 findings 但退出 0；或读 `benchmark.json` 直接给 verdict（越过 §3.1 的授权边界，退回自证循环）；**或 ⑦ 第一档放行（改了 `expected.md` 没重跑 A1 也能跑）**；绿 = 直接 `node` 跑、0 findings、三类注入均码 4、变更期闸门拦住并在**手工复算 sha256 写回副本快照**后解除。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 A1 能否识别「记录格式合法但内容是事后编的」（A1 只核记录自洽，见 §7 缺口与 §5 人工签字）；不验证 `--json` / `--deep` 选项的输出形态。

### TC-071 gate 数据量闸门：目录数 / 每臂 determined 数 < `iteration_min` → `INVALID_ENV` + 码 2；**probe 不套此闸门**

- **覆盖**：`§3.3-6（运行后数据量闸门：只对 gate）/ §3.3-7（probe 三值封顶与「不因此升码」）/ R6 / §1.5`
- **前置**：`scripts/run-eval.mjs` 已存在；产物桩可「按需只写 1 个 `iteration-*` 目录」或「某臂写空值」；**已导出模型变量且 `$env:SKILL_UP_BIN=<桩>`**；`expected.md` 的 `iteration_min = 2`；三个独立 `--output-dir` 均不存在。**桩的 `passed` / `total` 一律写在 `runs[].result` 下**。
- **步骤**：① **目录数不足（gate）**：桩只写 `iteration-1`（02 为 gate，两臂各 1 run，`result` 都是 `{"passed":3,"total":3}`）→ 跑 runner，读 02 行与退出码；② **每臂 determined 不足（gate）**：桩写 `iteration-1` / `iteration-2` 两个目录，`with_skill` 两轮都 `result={"passed":3,"total":3}`，`without_skill` 在 iteration-1 为 `{"passed":3,"total":3}`、在 iteration-2 为 `{"passed":null,"total":null}`（该臂 determined = 1）→ 跑 runner，读 02 行与退出码；③ **probe 不套闸门，且不得因 probe 数据不足抬码**：**02 保持 `gate` 且数据充足**——桩写 `iteration-1` / `iteration-2` 两个目录，`with_skill` 两轮 `result={"passed":3,"total":3}`、`without_skill` 两轮 `result={"passed":0,"total":3}`（02 → `VALID`）；**只让 01（`probe`）数据不足**——01 只在 `iteration-1` 有 run（两臂各 1 个 determined，均 < `iteration_min` = 2）→ 跑 runner，读 01 行、02 行与退出码。
- **预期**：① 02 行 `iteration=1`（< `iteration_min`）、`runs=1/1`、`undet=0/0`、**`flaky=未判定`**（数据量不足：n=1 < `iteration_min`=2，不构成「两次一致」）、`rate=1.0/1.0`、**`delta=未判定`**、`verdict=INVALID_ENV`，退出码 **2**；② 02 行 `runs=2/1`、`undet=0/1`、**`flaky=未判定`**（`without_skill` 的 determined=1 < `iteration_min`=2，属数据量不足）、**`rate=1.0/1.0`**（分母只算 determined；每臂的 determined run 全为 full）、**`delta=未判定`**（L1 未过 → 不算差值）、`verdict=INVALID_ENV`，退出码 **2**；③ **02 行 `role=gate`、`VALID`**（`rate=1.0/0.0`、`delta=1.0`、`flaky=否`）；**01 行 `role=probe`、`iteration=1`、`runs=1/1`、`undet=0/0`、`flaky=未判定`、`rate=1.0/0.0`（spec §3.3-7 情形③：数据量不足**只改 `flaky` 与 `delta`、不改写 `rate`**）、`delta=n/a`、`verdict=INVALID_ENV`**（spec 已写死：probe 数据不足时行内 `verdict` 写 `INVALID_ENV`）；**整轮退出码严格 = 0**——**不得**因 probe 的数据不足把整轮升成码 2（码 0 只看 gate）。
- **判据**：机器——① `verdict=` 严格等于 `INVALID_ENV` 且退出码严格 = 2 且 `delta=未判定` 且 **`flaky=未判定`**（gate 行写 `否` 即失败：n=1 < `iteration_min` 时「一致」无依据，§3.3-7 第③情形）；② 同形 + `runs=2/1` + `undet=0/1` + `rate=1.0/1.0` + **`flaky=未判定`** + `delta=未判定`；③ 退出码**严格 = 0** 且 02 行 `role=gate` + `verdict=VALID` 且 01 行 `role=probe` 与 `delta=n/a` 同现、`iteration=1`、`runs=1/1`、`undet=0/0`、`flaky=未判定`、`rate=1.0/0.0`、`verdict=INVALID_ENV`；**③ 若出现码 2 即判失败**（把 probe 数据不足升级成整轮环境故障，与「码 0 只看 gate」相反），**若出现码 3 同样判失败**（那是「gate 用例数 = 0」——**02 必须保持 `gate`**，正是为了排除这条歧义；旧写法把 02 也改成 probe，gate 用例数 = 0 → 码 3，与「退出码 0」直接矛盾）。**判别力**：只校验 `--iteration` 参数（不看实际观测数）的实现，在 ① 会按 n=1 出 `VALID`——那正是 R6「单次结果不作数」被绕开的形态；把 `undetermined` 也算进 determined 的实现在 ② 会写成 `runs=2/2` 并放行；把 probe 的数据量不足也套闸门/升码的实现会在 ③ 给出 2 或 3。
- **红绿证据**：红 = 「工具在 iteration-1 之后失败」时 1 个目录也能凑出达标（S1 的原始盲区）；或 ①② 把 `flaky` 写成 `否`（把 n=1 / determined=1 当成「两次观测一致」，与 §3.3-6「写 `否` ≠ 已验证稳定」冲突）；或 probe 抖动升级成码 2（`flaky=未判定` 变成整轮 2）；或 ② 写成 `runs=2/2`（把空值计入分母）；绿 = 目录数 + 每臂 determined 数双重闸门只锁 gate，数据量不足一律 `flaky=未判定`（gate 行亦然），probe 只落行内信号且退出码仍 0。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 n ≥ 3 的检出概率（见 TC-036 五要素 e）；`iteration_min` 自身的上下界由 TC-060 管；`passed` 写在 run 顶层这一错位形态由 TC-079 管。

### TC-072 键白名单：`expect.exit_code` / `expect.files_exist` / `expect.files_not_exist` / `judge.tool_called` / `output_contains.not` / `cases.defaults.expect` → 码 4

- **覆盖**：`§3.2.1（键白名单）/ §3.2.2④ / §3.3-5⑧ / §6-12`
- **前置**：同 TC-053（临时副本 + sentinel 桩 + out 目录不存在）。
- **步骤**：六份副本分别注入（都只在副本里）：a) 01 的 `expect` 下加 `exit_code: 0`；b) 01 的 `expect` 下加 `files_exist: ["notes/plan.md"]`；c) 01 的 `judge.success` 里加 `tool_called: {name: "Bash"}`；d) `eval.yaml` 的 `cases.defaults` 下加 `expect: {must_not_contain: ["TODO"]}`；**e) 01 的 `judge.success[].output_contains` 里加 `not: ["纯文档"]`**（官方 `output_contains` 家族的 `not` 子键——白名单只允许 `all` / `any`）；**f) 01 的 `expect` 下加 `files_not_exist: ["notes/old.md"]`**（与 b 同一官方家族的「不存在」变体，专测「按家族拦」而不是「按见过的键名拦」）。每份跑 `--dry-run`。
- **预期**：六份均码 4，stdout 为**单行** `exit=4 reason=配置错误`；不产 verdict 行；sentinel 不存在。stdout 是否点名越界键（`exit_code` / `files_exist` / `files_not_exist` / `tool_called` / `output_contains.not` / `cases.defaults.expect`）= **建议项**，不作判失败依据（spec §3.2.2④ 只规定码 4）。
- **判据**：机器——六份**码 4** + stdout 单行含 `exit=4` 与 `reason=配置错误` + `verdict.md` 不存在 + sentinel 不存在。**判别力**：只拦 `exit_code` 而不拦 `files_exist` / `files_not_exist` / `output_contains.not` 说明白名单是按「见过的键名」逐条硬编码，而不是按「本轮只允许这两组键」实现——后者才挡得住未来新增的官方键（e、f 两档就是专抓这种硬编码）。
- **红绿证据**：红 = 允许 `exit_code` / `files_exist` / `files_not_exist` / `tool_called` / `output_contains.not`——它们参与工具判分与 `passed/total`，但 L2 读不到、`assert_hash` 也不覆盖，等于留一个「冻结后悄悄放宽判据」的口子；`cases.defaults.expect` 更隐蔽（默认值会与用例层合并，合并后的断言集没人核对）；绿 = 白名单外一律码 4。
- **对应测试**：待 plan Task N
- **不覆盖**：不枚举官方全部键（`golden_file` / `output_matches` / `file_contains` 由同一判据覆盖，抽样即可）；不验证 A1 脚本是否独立复算这套白名单（TC-070 管）。

### TC-073 `title` 多重集与重名：多重集相等但重名 → 码 4

- **覆盖**：`§3.2.2②（多重集双向相等 + `title` 逐个唯一）/ §3.2.1（`eval_name` 唯一来源 = `title`）`
- **前置**：同 TC-053；当前两条例 `title` 互不相同。
- **步骤**：a) **重名且多重集相等（集合比较与多重集比较都会放过）**：把 01、02 的 `title` 都改成同一串 `X`，**并同时**把 `expected.md` 两个 case 的 `eval_name` 也改成 `X` → `--dry-run`；b) **多重集不等（多写一条）**：`expected.md` 写三条 `eval_name`（`A`、`B`、`B`）而 yaml 只有两条 → `--dry-run`；c) **多重集不等（少写一条）**：`expected.md` 只写 01 一条 → `--dry-run`；d) **对照**：恢复原状 → `--dry-run`。
- **预期**：a 码 4（stdout 单行 `exit=4 reason=配置错误`）；b、c 码 4；d 退出 0。四档均不产 verdict 行、sentinel 不存在。**措辞为建议项**：stdout 是否出现「重名 / 重复 / duplicate」、是否指出缺哪条 / 多哪条，不作判失败依据（spec §3.2.2② 只规定「重名即码 4」与「多重集双向相等」，没有规定文案）。
- **判据**：机器——a **码 4 且 stdout 单行含 `exit=4` 与 `reason=配置错误`**（唯一性检查缺失时该档会放行成 0，这就是本档的判别力）；b、c 码 4；d = 0；四档 `verdict.md` 不存在、sentinel 不存在。**判别力**：只做集合比较的实现在 a 档会判「相等」并放行——随后工具把两条同名用例**并成一组**，`flaky` 与全过率在混合数据上算，verdict 必然错（S13 的原始缺陷）。**不得**把「stdout 是否念重名」当判失败依据。
- **红绿证据**：红 = `new Set(titles)` 比较（重名被去重后仍「相等」）；绿 = 多重集双向比较 + `title` 唯一性双重检查。
- **对应测试**：待 plan Task N
- **不覆盖**：集合层的差异（缺用例 / 多写用例 / 差一字）由 TC-054 承载；`eval_name` 与 `benchmark.json` 的 join 正确性由 TC-027 管。

### TC-074 `frozen` 留痕失效（`assert_hash` / `arms_snapshot` 不一致）→ 码 4，不得降级 `calibrated`

- **覆盖**：`§3.2.2③ / R8（状态迁移）/ R10 / §3.3-5⑧`
- **前置**：`frozen-ledger.json` 里 02 已有合法记录（构造方式同 TC-049：六字段齐、`node -e` 算 `assert_hash`、`arms_snapshot` 与当前 `arms`/`delta` 逐项相等，命令与结果记进 `RECORD.md`）；临时副本可改；同 TC-053 的 sentinel 桩。
- **步骤**：a) **`assert_hash` 失效**：在副本里给 02 的 `assert.must_contain` 加一个词（或改 `anchors`），**不更新 ledger** → `--dry-run`；b) **`arms_snapshot` 失效**：把 02 的 `arms.with_skill.min_rate` 从 1.0 改成 0.9，**不更新 ledger**（`assert_hash` 随 `arms` 一起变）→ `--dry-run`；c) **对照**：按 §3.2.2③ 用 `node -e` 重算 `assert_hash`、写回 ledger、同步 `arms_snapshot` → `--dry-run`。
- **预期**：a、b 均码 4，stdout **单行** `exit=4 reason=配置错误`，且必须含 spec 明文要求的**「重新校准」**提示（§3.2.2③「提示按 §4 步骤 3 重新校准并更新 ledger」）；**不得**降级成 `calibrated` 继续跑（不产 verdict 行、sentinel 不存在、输出里不出现「已降级 / fallback to calibrated / 按 calibrated 处理」）；c 退出 0。**措辞为建议项**：是否点名具体失效项（`assert_hash` / `arms_snapshot`），不作判失败依据（那属于可读性，spec 只要求「提示重新校准」）。
- **判据**：机器——a、b 码 4 + `verdict.md` 不存在 + sentinel 不存在 + stdout 单行含 `配置错误` **且含 `重新校准`**（spec 明文）+ 全文无降级措辞；c = 0。**判别力**：若实现「静默降级为 calibrated」，a/b 会退出 0 并继续跑，于是「用例被改严了」会被报成「技能退化」（AI-5-02 点名的形态，也正是 S5 的悖论）。**不得**把「是否点名 `assert_hash` / `arms_snapshot`」当判失败依据。
- **红绿证据**：红 = 只哈希 `assert`（不覆盖 `anchors` / `arms` / `delta`）→ 偷偷抬高阈值仍算 frozen；或降级 calibrated 继续跑；绿 = 任一不一致即码 4 + 提示重新校准。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 `verified_at` 指向的那次跑是否真达标（`iteration ≥ 2` / `flaky=否` / `undet=0`，属 §4 步骤 3 的校准程序，人工）；`frozen_since` 缺失与「出生即 frozen」由 TC-063 管。

### TC-075 `git apply --check` 闸门：补丁与 fixture 不对齐 → 码 4

- **覆盖**：`§3.3-5⑥（五步执行顺序，判据落在 ⑥-5）/ R5 / §4 步骤 0（自查④）`
- **前置**：有 skill-up 二进制；已按 §4 步骤 1 物化 `.session/eval/fixture/review-triage/<repo-name>/`（即 `checkbox-demo`，**按 repo 名、不按 case-id**；含 baseline 提交）；同 TC-053 的 sentinel 桩与**两层同构**副本（`$t = Join-Path $env:TEMP 'eval-misalign'`，构造命令同 TC-053）。**本条只在副本里做 git 写操作**（spec §6-7 例外①，需用户/议会确认后执行）；`.session/eval/fixture/**` 的物化 git 写属例外②，**仓库内 fixture 永不带 `.git`**。
- **步骤**：a) **不对齐**：在副本里把 `$t/evals/review-triage/fixtures/diffs/checkbox.patch` 被删除那一行的某个空格改一个（或改副本 `notes/plan.md` 的对应行），使补丁打不上 → 跑 runner `--dry-run --eval-yaml "$t/evals/review-triage/eval.yaml" --output-dir "$env:TEMP/eval-misalign/out"`（不存在）——闸门 ⑥ 的前四步（**⑥-1** 源目录存在 → **⑥-2** 物化（先删后建）→ **⑥-3** 物化后的 `repo_fixture` / `apply_diff` 存在 → **⑥-4** `skills[].path` 含 `SKILL.md` 且 `apply_diff` 层级对）都应当**照常通过**，失败必须落在 **⑥-5**（`rev-parse HEAD` / `git apply --check`）；b) **对齐（对照）**：恢复补丁 → 清掉物化副本让它重建（先删后建）→ 再跑 `--dry-run --eval-yaml "$t/evals/review-triage/eval.yaml" --output-dir "$env:TEMP/eval-misalign/out2"`（不存在、且与 `out` 不同）；c) **判别力复核**：在物化副本上直接手跑 `git -C <副本> apply --check <补丁>`——a 档必须非 0、b 档必须 0（证明闸门复算的是「能不能应用」，而不是「文件在不在」）；d) **工具侧对照**：拿 a 的配置直接调 `skill-up run "$t/evals/review-triage/eval.yaml" --dry-run`，只记录它是否报错（实测它会静默跳过补丁——这是对照组，**不得当判据**）。
- **预期**：a 码 4、stdout 单行 `exit=4 reason=配置错误`，且 `<细节>` **同时含失败项编号 `⑥-5` 与对象名 `apply_diff`（或该补丁路径）二者**（spec §3.3-5⑥：所有启动前失败的单行 `<细节>` 必须含失败项编号与对象名，如 `apply_diff 层级错` / `fixture 缺 baseline`）——**二者缺一即判失败**；其余措辞（是否另含 `git apply` / `rev-parse HEAD` 等字样）不作判失败依据；**a 档的失败点必须落在第 ⑥-5 步**（前四步全过——若在前四步就失败，说明样本没构造对，先修正构造）；不产 verdict 行、sentinel 不存在；b 退出 0；c 两档一非 0 一为 0；d 只记录实测值。
- **判据**：机器——a 码 4 + stdout 单行含 `exit=4` 与 `reason=配置错误` + **失败步骤编号 = ⑥-5** **且** 单行含对象名 `apply_diff`（或该补丁路径）+ `verdict.md` 不存在 + sentinel 不存在；b = 0；c 两档退出码不同（**必须验这一步**，否则无法证明闸门用的不是 `Test-Path`）。d 不参与判定。**对象名是必判项**（spec §3.3-5⑥：启动前失败单行必须含失败项编号与对象名）——只念编号不念对象名 → 判失败；`git apply` / `rev-parse HEAD` 等其余措辞不作判失败依据。
- **红绿证据**：红 = 闸门只做 `Test-Path <补丁>` + `Test-Path <fixture>`（两者都存在、闸门全绿），补丁却打不上 → 工具静默跳过 → 模型看到的是「干净仓库」→ 结论被记到技能头上（R5 三次实测都是这个形态）；绿 = 物化后 `git apply --check` 退出 0 才放行。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 `context.git.checkout` / `remotes`；不验证多补丁的顺序应用（本轮只有一个补丁）；`apply_diff` 的**层级**错误由 TC-066 管。

### TC-076 二维表②：工具码 2/3 + 有数据 → 以工具为准（`INVALID_ENV`，runner 码取工具码）

- **覆盖**：`§3.3-6（工具码 × 数据完整性二维表②）/ §3.3-7`
- **前置**：`.mjs` 桩可「先写 `benchmark.json` 再 `exit N`」；已导出模型变量；两个独立 `--output-dir`（a、b）均不存在。
- **步骤**：桩先写「两臂每 iteration 各 1 run、每个 run 的 `result` 都是 `{"passed":3,"total":3}`（全过、非 flaky）」的 `iteration-1` / `iteration-2`，然后 a) `process.exit(2)`；b) `process.exit(3)`。各跑一次 runner（不带 `--dry-run`），读 verdict 行、stdout 与退出码。
- **预期**：a 02 行 `verdict=INVALID_ENV`、行含 `exit=2`，退出码 **= 2**；b 02 行 `verdict=INVALID_ENV`、行含 `exit=3`，退出码 **= 3**。两种都**不**按数据算出 `VALID`（尽管数据是「全过、非 flaky」）。
- **判据**：机器——a `verdict=` 严格等于 `INVALID_ENV`、退出码严格 = 2、行内 `exit=2`；b 同形、退出码严格 = 3、行内 `exit=3`。**判别力**：若实现「数据完整就按 L1/L3 出结论」，这两档会报 `VALID`——工具自报「环境不可用 / 结论无效」被当成成功；若实现把 3 归成 1，a/b 至少一档码位错。
- **红绿证据**：红 = 工具码 2/3 被忽略、照数据报 VALID；或 3 被混成 1（与「gate flaky」同码）；绿 = 以工具为准 + 行内保留 `exit=`。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证工具为何自报 2/3（外部工具行为）；凭据分支（stderr 命中认证特征 → 覆盖透传归 2）由 TC-038 管。

### TC-077 二维表④：工具码 5（表外）+ 有数据 → 原样透传 5，verdict 仍按 L1/L3 出

- **覆盖**：`§3.3-6（二维表④ / 表外码透传优先于跨行取码）/ §3.3-7`
- **前置**：同 TC-076；桩为「写全过数据后 `process.exit(5)`」；独立 `--output-dir` 不存在。
- **步骤**：① 桩写「两臂每 iteration 各 1 run、每个 run 的 `result` 都是 `{"passed":3,"total":3}`」的 `iteration-1` / `iteration-2`，然后 `process.exit(5)`；② 跑 runner（**不带 `--dry-run`**）；③ 读退出码、`verdict.md` 的 02 行与 stdout。
- **预期**：③ 退出码 **严格 = 5**（表外码原样透传，**优先于**跨行取码顺序，也优先于「数据不完整归 2」）；verdict 行**必须存在**，且 `verdict=` 按 L1/L3 对账得出——本数据两臂全过 → `delta=0 < delta.min` → 02（calibrated gate）应得 `INVALID_ASSERT`、`delta=未达`，**不是** `INVALID_ENV`；行内含 `exit=5`。
- **判据**：机器——退出码严格 = 5 且 `verdict=` 严格等于按 `expected.md` 声明值算出的结论（本数据 = `INVALID_ASSERT`）且 `delta=未达` 且行内 `exit=5`。**判别力**：若实现把表外码当环境故障，verdict 会写成 `INVALID_ENV`；若实现「有数据就由 verdict 定码」，退出码会变成 1——两者任一发生即失败。这条同时也锁住「工具码 ≠ runner 码」这条边界（旧版把二者等同，是 b) 那一格的病根）。
- **红绿证据**：红 = 表外码被归一成表内码（调用方无法区分「工具崩了」与「评测不通过」）；或表外码把 verdict 也拖成 ENV（L3 在最需要看差值的场景被跳过）；绿 = 码 5 透传 + verdict 独立按 L1/L3。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 6/7/… 等其它表外码（同一判据）；**无数据**时的表外码由 TC-034 ④ 承载。

### TC-078 `fixtures/CONTRACT.json`：字段齐 + 哈希复算；篡改任一档 → 启动前码 4

- **覆盖**：`§3.4（A1 写 CONTRACT.json）/ §3.3-5⑧（存在 + exit===0 + 哈希一致）/ §5⑩ / §7-11`
- **前置**：`scripts/check-eval-contract.mjs` 已在真仓库跑过一次（`evals/review-triage/fixtures/CONTRACT.json` 已生成）；六类判据文件就位；`$env:TEMP` 可写；同 TC-053 的 sentinel 桩与**两层同构**副本（`$t = Join-Path $env:TEMP 'eval-contract'`，构造命令同 TC-053）；**不需要模型凭据**。
- **步骤**：
  ① 读 `evals/review-triage/fixtures/CONTRACT.json`，断言四个键在位：`schema`（= `eval-contract/v1`）、`checked_at`（可解析的时间串）、`exit`（**严格 `0`**）、`files`（对象：键 = **相对仓库根**的正斜杠路径、值 = 64 位小写 hex 的 sha256）；**键形态断言**：每个键都不得以 `/` 或盘符开头、**不得含 `..` 段**（spec §3.4：「键不得含 `..` 或盘符」），示例形态 = `evals/review-triage/expected.md`；并断言 `files` 的键**按类覆盖六类文件**（`evals/review-triage/eval.yaml` / `evals/review-triage/cases/**` / `evals/review-triage/expected.md` / `evals/review-triage/fixtures/oracle/**` / `evals/review-triage/fixtures/responses/**` / `evals/review-triage/frozen-ledger.json`）——每类至少 1 条，缺类即失败；
  ② **独立复算（用 runner 的同一个 `repoRoot` 展开）**：先 `$repoRoot = (Resolve-Path (Join-Path (Split-Path evals/review-triage/eval.yaml -Parent) '../..')).Path`，断言 **`<eval.yaml 所在目录>/..`**（`(Resolve-Path (Join-Path (Split-Path evals/review-triage/eval.yaml -Parent) '..')).Path`）的末级目录名 = `evals`（§3.3-1；`repoRoot` 本身末级是仓库目录名），且 `$repoRoot` = 仓库根；再对 `files` 里每个键取 `Join-Path $repoRoot <键>` 用 `Get-FileHash -Algorithm SHA256` 实算，逐个与记录比对 → 必须全相等（不允许「只看条数」）；**不得**用 cwd / `evals/` 基准展开（`CONTRACT.json` 的键只认 `repoRoot`，与 yaml 五类的 `evals/` 基准是两套口径）；
  ③ **篡改档 a（改内容）**：副本里给 `$t/evals/review-triage/expected.md` 的人读区加一个空行（不动机读块语义，避免同时撞别的闸门）→ **不重跑 A1** → 跑 runner `--dry-run --eval-yaml "$t/evals/review-triage/eval.yaml" --output-dir "$env:TEMP/eval-contract/out-a"`（不存在）：必须码 4、stdout 单行 `exit=4 reason=配置错误`、提示先跑 `node scripts/check-eval-contract.mjs`；
  ④ **篡改档 b（删掉快照）**：副本里删掉 `$t/evals/review-triage/fixtures/CONTRACT.json` → 跑 runner `--dry-run --eval-yaml "$t/evals/review-triage/eval.yaml" --output-dir "$env:TEMP/eval-contract/out-b"`（不存在、且与 `out-a` 不同）→ 码 4，同一提示；
  ⑤ **篡改档 c（`exit` 非 0）**：把副本 `CONTRACT.json` 的 `exit` 改成 `1` → 跑 runner `--dry-run --eval-yaml "$t/evals/review-triage/eval.yaml" --output-dir "$env:TEMP/eval-contract/out-c"`（不存在）→ 码 4；
  ⑥ **篡改档 d（改哈希）**：把 `files` 里任一值改掉一个 hex 字符 → 跑 runner `--dry-run --eval-yaml "$t/evals/review-triage/eval.yaml" --output-dir "$env:TEMP/eval-contract/out-d"`（不存在）→ 码 4（stdout **是否点名该文件** = 建议项，不作判失败依据）；
  ⑦ **正向对照**：在副本里**手工复算文件的 sha256、写回副本 `CONTRACT.json`**（A1 的用法只有 `[<技能名>] [--json] [--deep]`，无副本根参数；若只在真仓库跑 A1，记「副本侧未取证」，口径同 TC-070 ⑦）→ 再跑 runner `--dry-run --eval-yaml "$t/evals/review-triage/eval.yaml" --output-dir "$env:TEMP/eval-contract/out-e"`（不存在）→ **闸门 ⑧** 不再因 CONTRACT 报错。
- **预期**：① 四键齐 + 六类全覆盖 + 每个键为**仓库根相对的正斜杠路径**（无 `..`、无盘符）；② 全部哈希相等；③④⑤⑥ 四档**均码 4**、`verdict.md` 不存在、sentinel 不存在；⑦ **闸门 ⑧ 放行**。
- **判据**：机器——① 键齐、六类不缺、且**每个键都是仓库根相对的正斜杠路径（不含 `..`、不带盘符）** **且** ② 按 `$repoRoot` 复算全相等 **且** ③④⑤⑥ **严格 = 4**（`verdict.md` 不存在 + sentinel 不存在）**且** ⑦ 通过。**判别力**：只检查「文件存在」或只检查 `exit === 0` 的实现在 ③④⑥ 三档会放行——那正是「改了判据没人发现」的入口；只比对条数不比对哈希的实现在 ③ 会放行；**键写成 `../evals/…` 或绝对路径**时，同一个文件会被两套口径各展开一次（`CONTRACT.json` 键 = 仓库根相对，eval.yaml 五类 = `evals/` 相对，§3.4 / §3.2.1），故键形态本身是判据。**不得**把「stdout 点名文件」当判失败依据（spec 只规定码 4）。
- **红绿证据**：红 = `CONTRACT.json` 只有 `schema` 与 `exit`（没有 `files`）→ ③ 档放行，判据改了也没人知道；或哈希只覆盖 `cases/**` 不覆盖 `expected.md`（改阈值不留痕）；绿 = 四键齐 + 六类全覆盖 + 四档篡改均码 4。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 `CONTRACT.json` 是否**只能由 A1 生成**（人手工伪造一份自洽的也能过——见 §7 缺口与 §8 建议 14）；不验证 `--json` / `--deep` 输出形态。

### TC-079 run 三态字段路径：`passed` / `total` 写在 run 顶层 → 该 run 必须判 `undetermined`

- **覆盖**：`§1.5（run 三态与字段路径 `runs[].result.passed` / `runs[].result.total`）/ §3.3-6（undetermined 的可见性）/ §3.3-7`
- **前置**：`scripts/run-eval.mjs` 已存在；产物桩可控制 run 对象形状（能写「顶层 `passed`」与「`result.passed`」两种形态）；**已导出模型变量且 `$env:SKILL_UP_BIN=<桩>`**；三个独立 `--output-dir`（a / b / c）均不存在。
- **步骤**：
  ① **错位档 a**：桩写 `iteration-1` / `iteration-2`，每份每 config 各 1 run，**`passed` / `total` 写在 run 顶层**（`{"passed":3,"total":3}`），`result` 里没有这两个键 → 跑 runner，读 02 行、stdout 与退出码；
  ② **对照档 b（正确层级）**：同一份数据但把 `passed` / `total` 挪进 `result`——`with_skill` 两轮 `result={"passed":3,"total":3}`、`without_skill` 两轮 `result={"passed":0,"total":3}` → 跑 runner，读 02 行与退出码；
  ③ **数值组合边界档 c**：`iteration-1` / `iteration-2` 各 1 run/臂；`with_skill` 两轮分别写 `result={"passed":0,"total":0}` 与 `result={"passed":5,"total":3}`（都不命中 `full` / `partial` 三式 → 2 个 `undetermined`），`without_skill` **两轮都**写 `result={"passed":0,"total":3}`（→ 2 个 `partial`）→ 跑 runner，读 02 行与退出码；
  ④ 在 a 档检查 stdout 是否**逐条打印**该 run 的 `eval_name` / `configuration` / 原始 `passed,total` 值（§3.3-6「undetermined 必须可见」）。
- **预期**：① 02 行 `runs=0/0`、`undet=2/2`、`flaky=未判定`、`rate=未判定`、`delta=未判定`、`verdict=INVALID_ENV`，退出码 **2**——**不得** `runs=2/2` + `VALID`（静默当 `full`）；④ stdout 逐条打印原始顶层值（如 `passed=3,total=3`）；② 02 行 `runs=2/2`、`undet=0/0`、`flaky=否`、`rate=1.0/0.0`、`delta=1.0`、`verdict=VALID`，退出码 0；③ 02 行 `runs=0/2`（**分母口径 = 迭代数 × 每臂每迭代 run 数**：2 迭代 × 每臂 1 run → 不装臂 2 个 `partial`）、`undet=2/0`（装臂 2 个 `undetermined`）、`flaky=未判定`（装臂 determined=0）、`rate=未判定/0.0`（装臂 determined=0 → `未判定`；不装臂 0/2 全过 = 0.0）、`delta=未判定`、`verdict=INVALID_ENV`，退出码 2。
- **判据**：机器——① 三值必须恰好是 `runs=0/0` / `undet=2/2` / `verdict=INVALID_ENV` 且码 = 2 且 ④ 的原始值打印在位；② 三值必须恰好是 `runs=2/2` / `rate=1.0/0.0` / `VALID` 且码 = 0；③ `0/0` 与 `5/3` 都归 `undetermined`（不得把 `0/0` 当 partial、也不得把 `passed > total` 当 full）且 **`runs=0/2` 且 `undet=2/0`**（分母 = 2 迭代 × 每臂 1 run，**不是每臂 1 个 run**）且码 = 2；把不装臂的分母写成「每臂 1 个 run」即判失败（漏乘迭代数）。**判别力（双向）**：实现若从 **run 顶层**读 `passed`，① 会得到 `runs=2/2` + `VALID` → 判失败——而它在真实产物上会**恒报码 2**（真实 `benchmark.json` 只有 `runs[].result` 下才有这两个字段），且这类错位在「桩和实现用同一套错位置」时完全测不出来（spec §1.5 实测正是这个形态）；② 反向证明「判 undetermined」不是因为数据本身全空。
- **红绿证据**：红 = 桩与实现都从 run 顶层取 `passed`（两边一起错，全绿）；或把 `0/0` 当 partial（伪造出「未全过」）；或把 `5/3` 当 full（伪造达标）；绿 = 桩按真实产物写 `result`，错位档能判出 undetermined 并在 stdout 留原始值。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证工具为何写空值（外部行为，TC-051 前置已注明）；其它数值组合的穷举归 §1.5 的三态定义，本条只抽 `0/0` 与 `passed > total` 两个代表。

### TC-080 `verdict.md` 的「## 异常明细」段：正常路径必须存在且正文写「无」

- **覆盖**：`§3.3-7（异常明细段：verdict.md 的最后一段，除结论边界头与逐用例行外另起一段）/ §7-8 / §5⑦`
- **前置**：`scripts/run-eval.mjs` 已存在；产物桩（`.mjs`）能「写两份干净的 `iteration-{1,2}/benchmark.json` 后 `exit 0`」；**已导出 `EVAL_MODEL_PROVIDER` / `EVAL_MODEL_NAME`** 且 `$env:SKILL_UP_BIN=<桩>`；`expected.md` 的 `iteration_min = 2`；独立 `--output-dir "$env:TEMP/eval-detail-none/out"` 不存在（前置约定 ④）；桩数据一律把 `passed` / `total` 写在 `runs[].result` 下（前置约定 ②）。
- **步骤**：① 桩写 `iteration-1` / `iteration-2`，每份含两条用例（`eval_name` = 两个 `title`）各两臂 1 个 run：01 与 02 的 `with_skill` 均 `result={"passed":3,"total":3}`（full）、`without_skill` 均 `result={"passed":0,"total":3}`（partial）——**无 unknown / undetermined / 坏产物 / 超时**；② 跑 runner（不带 `--dry-run`，`--iteration 2`），记录退出码；③ 读 `<output-dir>/verdict.md`，用 `Select-String -Pattern '^## 异常明细\s*$'` 统计命中数；④ 取该标题之后**直到文件末尾**的正文 `$body`，`$body.Trim()`（spec 定死「`## 异常明细` 是 `verdict.md` 的**最后一段**」；**不得**用「下一个 `^## ` 标题之前」切片——那样段序错误时会被静默放过）；⑤ **判别力对照**：把 `verdict.md` 复制到 `$env:TEMP/eval-detail-none/counter.md`，造三个反例——a) 删掉整段（含标题）；b) 保留标题、清空正文；c) **把该段整体移到逐用例行之前**；对三份分别跑同一检查逻辑，必须都被判失败。
- **预期**：② 退出码 **0**；③ 命中数 **= 1**（标题唯一、且不得省略整段）；④ `$body.Trim()` 命中 `^无[。.]?$`（前后允许空行，**不得是空串**），且 `$body` 内不得含逐用例行（正则 `^.+: role=(gate|probe)` 命中数 = 0）；⑤ a) / b) / c) 均判失败；同时该文件里结论边界五要素与逐用例行不被本段影响（02 行仍 `VALID`、01 行仍 `role=probe`）。
- **判据**：机器——② 退出码 = 0；③ 正则 `^## 异常明细\s*$` 命中数严格 = 1；④ `$body.Trim()` 命中 `^无[。.]?$` 且 `$body` 中 `^.+: role=(gate|probe)` 命中数 = 0（切片 = 标题后到**文件末尾**）；⑤ 三个反例都必须被判失败（否则检查逻辑空转，本条失去判别力）。**判法写死**：标题按上述正则定位，正文按「该标题后到**文件末尾**」切片再 `Trim()` 比较——`none` / `n/a` / 空正文 / 整段缺失 / **段排在逐用例行之前** 一律判失败。
- **红绿证据**：红 = 段被省略（读者分不清「没有异常」与「没写」）；或正文留空、或写 `none` / `n/a`；绿 = 标题唯一 + 正文恰为「无」+ 结论其余部分不变。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证五类异常各自的内容（由 TC-081~TC-086、TC-089~TC-092 承载）；不验证该段的排版样式（只认 `## 异常明细` 这一级标题与正文文字）。

### TC-081 坏 `benchmark.json` 四种坏形态 + 全坏档（a–e 共 5 档）一律跳过：不计入 `iteration=`、明细按 `detail-kind=skipped-benchmark` 计数、归 ③

- **覆盖**：spec §3.3-6（二维表③：无可用 `benchmark.json` / 数据不完整）/ §3.3-7（`iteration=n` 的 n 只数参与判定的目录、无则写 `n/a`；明细第①类 = `detail-kind=skipped-benchmark`）/ §5⑨
- **前置**：同 TC-080；桩能向指定 `iteration-*/benchmark.json` 写入任意文本或任意 JSON；五个独立 `--output-dir`（a~e）均不存在。
- **步骤**：**公共干净侧**：`iteration-2/benchmark.json` 含 01、02 两条用例各两臂 1 run（`with_skill` = `{"passed":3,"total":3}`、`without_skill` = `{"passed":0,"total":3}`）。分档写 `iteration-1/benchmark.json`：a) 解析失败 —— `{"runs": [`（截断）；b) 可解析但形状为 `null` —— `null`；c) 可解析但是数组 —— `[]`；d) 可解析但 `runs` 不是数组 —— `{"runs": {}}`；e) **全部目录都坏** —— `iteration-1` 与 `iteration-2` 都写 `null`。各档跑 runner（`--iteration 2`，不带 `--dry-run`），读 02 行、退出码、明细段。
- **预期**：a~d：02 行 `iteration=1`（**只数实际参与判定的目录**，坏文件所在目录不计入）、`runs=1/1`、`undet=0/0`、`flaky=未判定`（数据量不足：1 < `iteration_min`=2）、`rate=1.0/0.0`（只由 iteration-2 的有效数据算出，坏文件没有污染它）、`delta=未判定`、`verdict=INVALID_ENV`，退出码 **2**；明细段中 `detail-kind=skipped-benchmark` 出现次数 **= 1**（每条明细恰好一行），该行含 `iteration-1/benchmark.json` 的完整路径，且**跳过原因字段非空、且不等于该路径**（不得以路径冒充原因）；**stdout / stderr 不作判据**（坏产物跳过行允许走 stderr；spec 已废止「stdout 与 verdict.md 同源」，明细以 `verdict.md` 为准）。e：02 行 `iteration=n/a`（**不得写 `0`**）、`runs=0/0`（若该字段被打印：任何非 0 的分母都说明把坏文件的 run 算进去了）、`flaky=未判定`、`rate=未判定`、`delta=未判定`、`verdict=INVALID_ENV`，退出码 **2**；明细段中 `detail-kind=skipped-benchmark` 出现次数 **= 2**，两条记录的路径分别指向 `iteration-1` 与 `iteration-2` 的 `benchmark.json`；既有 stdout 义务「无产物时打印 `flaky 未判定（无产物）`」本条**不适用**（文件物理存在、只是全部被跳过），除此不作 stdout 判据。
- **判据**：机器——a~d：`iteration=` 严格 = `1`、退出码严格 = 2、`verdict=` 严格 `INVALID_ENV`、`detail-kind=skipped-benchmark` 出现次数 = 1（**按 token 计数，不按措辞**）、该行路径逐字相等、原因字段非空且 ≠ 路径；e：`iteration=` 严格 = `n/a`、退出码严格 = 2、`detail-kind=skipped-benchmark` 出现次数 = 2、两条路径逐字在位。**判别力**：把坏文件当「零 run」计入 n 的实现会写 `iteration=2`（e 会写 `0`）；`JSON.parse` 不 catch 的实现在 a 直接崩（退出码非 2、且无 verdict 行）；把跳过信息只打到 stderr、不落 `verdict.md` 的实现 token 出现次数 = 0；**原因字段直接抄成路径**的实现让「原因非空」形同虚设 → 判失败。
- **红绿证据**：红 = 一个坏产物让整轮崩掉或让 `iteration=` 虚报；或异常只在 stderr、`verdict.md` 里看不到「坏产物」；绿 = 跳过 + 计数只认真实参与 + `detail-kind=skipped-benchmark` 单行落纸（`verdict.md` 为准）。
- **对应测试**：待 plan Task N
- **不覆盖**：不规定坏产物的修复建议（超出 runner 职责）；`benchmark.json` 结构正确但字段层级错（`passed` 写在 run 顶层）**不得**被当「坏文件跳过」——那是 run 级三态问题，由 TC-079 管。

### TC-082 unknown `configuration` 归 ③：不得计入任一臂、不得写成 `VALID`

- **覆盖**：spec §3.3-6（二维表③ 新增口径：`configuration` ∉ {with_skill, without_skill}）/ §3.3-7（明细第②类）/ §5⑥
- **前置**：同 TC-080；桩能写第三条 `configuration` 的 run；三个独立 `--output-dir`（a / b / 对照 c）均不存在。
- **步骤**：① 桩写 `iteration-1` / `iteration-2`：01、02 两条用例的 `with_skill` = `result={"passed":3,"total":3}`、`without_skill` = `result={"passed":0,"total":3}`；**另加一个 run（只加在 `iteration-1`，不在 `iteration-2` 重复，保证同一异常只出现 1 次）**（`eval_name` = 02 的 `title`，`result={"passed":3,"total":3}`），其 `configuration` 分别为：a) `baseline`（旧命名残留）；b) 拼错值 `with_skil`；② 各档跑 runner（`--iteration 2`，不带 `--dry-run`），读 02 行、退出码、明细段；③ **对照 c（防误判）**：把该额外 run 的 `configuration` 改成 `with_skill` 再跑一次 → 应回到正常数据路径（02 行 `runs=3/2`、`rate=1.0/0.0`、`delta=1.0`、`verdict=VALID`、退出码 0），证明本条抓的是「未知配置」而不是「多了一个 run」。
- **预期**：② a/b：02 行 `runs=2/2`（unknown run **不计入任一臂**；若被并进不装臂会写 `2/3` 或 `3/3`）、`undet=0/0`（unknown 不是 `undetermined`）、`verdict=INVALID_ENV`（**不得 `VALID`**），退出码 **2**；明细段中 `detail-kind=unknown-config` 出现次数 **= 1**（步骤只加 1 个 run，故合并规则不改变条数），该行含 02 的 `eval_name` 与 `configuration` 的**原文值**（`baseline` / `with_skil` 逐字；字段写法可为 `configuration: baseline` 或 `configuration=baseline`，值必须逐字）；**stdout 不作判据**（明细以 `verdict.md` 为准）。③ 对照 c：02 行**不得**出现 `INVALID_ENV`（按数据应为 `VALID`）、退出码 **0**、明细段正文为「无」。
- **判据**：机器——a/b：`runs=` 严格 `2/2`、`verdict=` 严格 `INVALID_ENV`、退出码严格 2、`detail-kind=unknown-config` 出现次数 = 1 且含 02 的 `eval_name` 原文、并含 `baseline` / `with_skil` 原文值；c：`verdict=VALID` 且退出码 0 且明细写「无」。**判别力**：按 configuration 分组后把第三组并进「最小臂」或直接忽略的实现，在 a/b 会写出 `3/3` 或 `VALID`；只按 `configuration != with_skill` 判「不装臂」的实现会把 `baseline` 灌进不装臂，`rate` 因此虚高（`runs=` 与分母可判）。
- **红绿证据**：红 = 残缺数据算出 `rate` 并被写成 `VALID`（这正是 spec ③ 要求 fail-closed 的理由）；或 unknown run 静默并进不装臂；绿 = 只认两臂、unknown 落明细、整轮判 `INVALID_ENV` / 码 2。
- **对应测试**：待 plan Task N
- **不覆盖**：不规定 unknown run 除「整轮判 `INVALID_ENV`」之外的处置（如重跑）；与 ④ 的交叉（工具码 5）由 TC-083 管，probe 侧由 TC-084 管。

### TC-083 ④ 透传优先于 ③：工具码 5 + 存在 unknown run → 退出码 5，verdict 行仍在

- **覆盖**：`§3.3-6（二维表③×④ 交叉 + 「表外码透传优先于 ③」）/ §3.3-7（明细第②类）/ §5⑨`
- **前置**：同 TC-082 的产物构造 + 桩具备「写完数据后 `process.exit(5)`」能力；独立 `--output-dir` 不存在。
- **步骤**：① 桩写 TC-082 a 档同一份数据（含 `configuration: baseline` 的 run），随后 `process.exit(5)`；② 跑 runner（不带 `--dry-run`）；③ 读退出码、02 行、明细段（`stdout` 不作判据）。
- **预期**：③ 退出码**严格 = 5**（表外码透传优先于 ③ 的「数据不完整 → 2」）；verdict 行**必须存在**且含 `exit=5`；按 ④「有数据时仍按 L1/L3 出 verdict」——两条臂数据完整（`runs=2/2`、`rate=1.0/0.0`、`flaky=否`、`delta=1.0`）→ `verdict=VALID`，**不得**因存在 unknown run 就把它改写成 `INVALID_ENV`；明细段仍有 `detail-kind=unknown-config`（出现次数 = 1，本条只加 1 个 unknown run）。
- **判据**：机器——退出码严格 = 5；02 行存在且 `exit=5`、`runs=2/2`、`verdict=` 严格 `VALID`；`detail-kind=unknown-config` 出现次数 = 1 且该行含 `baseline` 与 02 的 `eval_name`。**若退出码 = 2 或 `verdict=INVALID_ENV` 即判失败**（说明 ③ 把表外码吞掉，或 ③ 压过了 ④）。
- **红绿证据**：红 = 实现先按 ③ 判「数据不完整」→ 退出码 2，调用方分不清「工具崩了」与「数据有问题」；或反过来把 unknown 当正常数据 → 明细里没有这条（两处都丢）；绿 = 码 5 透传 + 结论按 L1/L3 + 明细留痕。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 6/7 等其它表外码（同一条规则）；**本条对 `verdict=VALID` 的断言直接取自 spec ④ 的「有数据时仍按 L1/L3 出 verdict」**——若议会裁定此交叉格应 fail-closed 到 `INVALID_ENV`，须同步改 spec 与本条（见 §8 建议 18）。

### TC-084 unknown 只出现在 probe：行内 `INVALID_ENV` + 明细，退出码不改（码 0 只看 gate）

- **覆盖**：`§3.3-6（③ 的落点：gate 才定码）/ §3.3-7（probe 行内信号不改退出码）/ §5⑥ / §5⑨`
- **前置**：同 TC-080；桩能只给 01 加 unknown run；独立 `--output-dir` 不存在。
- **步骤**：① 桩写 `iteration-1` / `iteration-2`：02 两臂各 1 run（with full `3/3`、without partial `0/3`，数据充足）；01 两臂各 1 run（同形），**只在 `iteration-1` 另加** 01 的一个 `configuration: baseline`、`result={"passed":3,"total":3}` 的 run（保证同一异常只出现 1 次）；② 跑 runner（`--iteration 2`）；③ 读 01 行、02 行、退出码、明细段。
- **预期**：③ 01 行 `role=probe`、`runs=2/2`（unknown 不计入）、`flaky=否`（两臂结论一致；unknown 不参与）、`verdict=INVALID_ENV`（③ 的 fail-closed 落在该行）；02 行 `role=gate`、`verdict=VALID`；**整轮退出码严格 = 0**（码 0 只看 gate，**不得**因 probe 的 ③ 升成 2 / 3）；明细段中 `detail-kind=unknown-config` 出现次数 **= 1**（步骤只加 1 个 run），该行含 01 的 `eval_name` 与 `baseline`；**stdout 不作判据**（明细以 `verdict.md` 为准）。
- **判据**：机器——退出码严格 = 0；01 行 `role=probe` 与 `verdict=INVALID_ENV` 同现、`runs=2/2`、`flaky=否`；02 行 `verdict=VALID`；`detail-kind=unknown-config` 出现次数 = 1 且该行含 01 的 `eval_name` 与 `baseline`。**判别力**：把 probe 的环境信号也算进跨行取码的实现会给出 2（`INVALID_ENV` 压过 gate 的 0）；把 unknown 当 gate 问题、整轮判 2 的同一形态也会被抓到。
- **红绿证据**：红 = 一处未知配置把整轮判成环境故障，gate 的结论被掩掉；绿 = 行内留信号 + 明细留痕 + 退出码 0。
- **对应测试**：待 plan Task N
- **不覆盖**：probe 的数据量不足（迭代数 / determined 不够）由 TC-071 ③ 管；本条只测「unknown configuration」这一种异常落在 probe 上的处理。

### TC-085 `undetermined` 的 run 必须进明细（第③类）：`eval_name` + 臂 + 原始 `passed,total`

- **覆盖**：spec §3.3-7（异常明细第③类 = `detail-kind=undetermined-run`）/ §3.3-6（`undet=` 与「undetermined 必须可见」；明细以 `verdict.md` 为准，stdout 只保留「`undetermined` 逐条打印」这一既有义务）/ §5⑥
- **前置**：同 TC-080；桩能写 `passed: null` / `total: null`；`--iteration 3`（与 TC-051 ③ 同形：每臂 determined ≥ `iteration_min`=2，不撞数据量闸门）；独立 `--output-dir` 不存在。
- **步骤**：① 桩写 `iteration-1` / `iteration-2` / `iteration-3`：01、02 两臂每轮各 1 run；**02 的 `with_skill`** 前两轮 `result={"passed":3,"total":3}`、第三轮 `result={"passed":null,"total":null}`；**02 的 `without_skill`** 三轮都 `{"passed":0,"total":3}`；01 两臂三轮分别 `{"passed":3,"total":3}` / `{"passed":0,"total":3}`（全 determined）——**全轮唯一的 `undetermined` = 02 的 `with_skill` `iteration-3` 那一个**；② 跑 runner（`--iteration 3`），读 02 行、退出码、明细段与 stdout（stdout 只核「该 run 被逐条打印」这一既有义务）。
- **预期**：② 02 行 `iteration=3`、`runs=2/3`（**装臂 determined=2、不装臂 determined=3**——`without_skill` 三轮都有值，故不装臂分母 = 3）、`undet=1/0`、`flaky=否`、`rate=1.0/0.0`、`delta=1.0`、`verdict=VALID`，退出码 **0**（结论仍成立，异常只留痕）；明细段中 `detail-kind=undetermined-run` 出现次数 **= 1**，该行含 02 的 `eval_name`、`configuration` 值 `with_skill`、原始值 `passed=null` 与 `total=null`（原文照录，不得省略成「空」）；stdout 逐条打印该 run（既有义务，**不要求**与明细逐字同源）。
- **判据**：机器——退出码 = 0 且 02 行 `runs=` **严格等于 `2/3`**、`undet=1/0`、`verdict=VALID`；`detail-kind=undetermined-run` 出现次数 = 1，且该行同时满足：含 02 的 `eval_name` 原文、含 `with_skill`、匹配 `passed\s*[=:]\s*null` 与 `total\s*[=:]\s*null`（`Select-String -CaseSensitive:$false`）；stdout 含该 `eval_name` 与 `with_skill`（既有义务，只判「有没有逐条打印」，不判与 verdict.md 同源）。**判别力**：只把 undetermined 打到 stdout 的实现 `detail-kind=undetermined-run` 出现次数 = 0；把原始值改写成「空」的实现丢了 spec 明确要求的「原始 `passed,total`」；把 `runs=` 分母算错（装臂也写 3）的实现被 `2/3` 严格比较抓住。
- **红绿证据**：红 = 行内 `undet=1/0` 有了、留痕里却定位不到是哪一份产物的哪一臂；绿 = 明细可追到 `eval_name` + 臂 + 原始数值。
- **对应测试**：待 plan Task N
- **不覆盖**：run 三态的定义与字段层级由 TC-051 / TC-079 管；本条只测「留痕」。

### TC-086 超时三支信号：三档均判超时，且明细指明命中哪一支（逐 run 带用例名、整轮不带）

- **覆盖**：`§3.3-7（明细第④类：detail-kind=timeout，写命中的是哪一支 + scope=run|整轮）/ §3.3-6（超时信号作用域：① 逐 run、②③ 整轮；失败行 = 工具退出码 ≠ 0 的行）/ §7-8 / §5⑨`
- **前置**：同 TC-080；桩具备三种能力——(a) 写嵌套 `session-result.json`、(b) 写 stderr、(c) 长耗时；**两个独立 `--output-dir`（a / b）**均不存在；**c 档走纯函数**（runner 导出超时判定函数、直接注入 `elapsedSeconds`），无 `--output-dir`；若函数未导出，则 c 降为慢桩实跑并归 **P1 夜间档**。**a / b 两档的桩都以 `process.exit(1)` 结束**（失败行 = 工具码 ≠ 0；工具码 0 时一律 `timeout=否`，见 TC-093）。
- **步骤**：① **档 a（session-result 支，逐 run）**：桩在 `<output-dir>/02-command-swap-semantic/with_skill/outputs/agent/run/session-result.json` 写入 `{"exit_code":124}`，**不写任何 `benchmark.json`**，`process.exit(1)` → 跑 runner；② **档 b（stderr 支，整轮）**：桩向 stderr 写一行含 `timed out` 的文本、`process.exit(1)`、**不写 `benchmark.json`** → 跑 runner（**该支为整轮信号**：同一轮命中的**所有失败行**都写 `timeout=是`、明细 1 条记 `scope=整轮` 且不含用例名）；③ **档 c（墙钟支，整轮）**：阈值按 §3.3-6 公式 = `迭代数 × 用例数 × 2 × timeout_seconds × 1.5`（`--iteration 2`、2 条用例、`timeout_seconds`=240 → **2880 s**）；**优先**直接调 runner 导出的超时判定纯函数，入参 `elapsedSeconds = 阈值 + 1`（**2881**）、另两支信号缺失 → 读出命中支与 `scope`，同 b 的整轮口径；④ **档 d（整轮性反例对照）**：用档 b 的数据，但把明细写成「只带 01 用例名」→ 必须判失败（防「逐 run 与整轮混写」）；⑤ **档 e（逐 run 反例对照）**：用档 a 的数据，但把明细写成 `scope=整轮` → 必须判失败。各档读退出码、verdict 行、明细段（stdout 不作判据）。
- **预期**：a：退出码 **2**、02 行 `timeout=是`、`verdict=INVALID_ENV`；明细段 `detail-kind=timeout` 出现次数 **= 1**，该行写 `scope=run`、含 `124`（或 `session-result` / `exit_code`）**且含该用例 `eval_name`**（逐 run 信号必须能定位到 run）。b：退出码 **2**、**所有失败行** `timeout=是`、`verdict=INVALID_ENV`；`detail-kind=timeout` 出现次数 = 1，该行写 `scope=整轮`、含 `stderr` 命中词 `timed out`，**且不含任何用例 `eval_name`**。c（纯函数档）：返回命中支 = 墙钟、`scope=整轮`、含一个秒数数值（如 `2881`）与 `墙钟`/`wall`/`elapsed`/`耗时` 之一、不含用例名；c（慢桩档）同 b 的整轮口径。**三档记录逐字符互不相同**（a 不含 `stderr` 分支字样、b 不含 `124`、c 既不含 `124` 也不含 `timed out`）。c 档若因成本未执行，报告必须写「c 档未取证」，**不得当已通过**；**d / e 两个反例都必须判失败**（否则 `scope` 判据空转）。
- **判据**：机器——a/b 退出码严格 = 2、相关行 `timeout=是`、`verdict=INVALID_ENV`；c 纯函数档返回值为墙钟支、慢桩档退出码 = 2 且行 `timeout=是`；`detail-kind=timeout` 三档各 = 1 次；a 行含 `scope=run` + `124` + `eval_name`；b 行含 `scope=整轮` + `timed out` + **不含** `eval_name`；c 行含 `scope=整轮` + 秒数 + **不含** `eval_name`；三档条目逐字符互不相等；**d / e 两个反例必须返回失败**。**判别力**：只认 stderr 一支的实现在 a 会写 `timeout=否`；只认墙钟一支的实现在 a/b 写 `timeout=否`；三支都判超时但明细只写「超时=是」的实现，三档记录完全相同（a=b=c）→ 判失败；**把整轮信号写成带用例名的行**（d）或**把逐 run 信号写成 `scope=整轮`**（e）→ 判失败。若实现改用其它等价词，须先在 spec 里固定词表，本条不就措辞作扩展解读。
- **红绿证据**：红 = 三支信号只判布尔、留痕里分不出是「工具自报被杀」还是「runner 自己等到超时」（前者要查工具、后者要查模型/转发层，处置完全不同）；绿 = 每支都可追溯到证据源。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证工具为何不返回 124（外部行为）；阈值公式本身由 §3.3-6 固定、TC-035 ⑦ 已锁，本条只验证「三支任一命中」与「明细指明哪一支」；**不改副本的 `timeout_seconds` 来缩短阈值**——那会让 `CONTRACT.json` 哈希失效、先撞 ⑧ 码 4，测不到超时。

### TC-087 `skills[].path` 用单引号（合法 YAML）：⑥-4 不得误判「路径不存在」，注入后为纯绝对路径

- **覆盖**：spec §3.2（`skills[].path` 相对 `evals/`）/ §3.3-5⑥-4（解析后存在且含 `SKILL.md`）/ §3.3-1（解析成绝对路径后注入 yaml，工具只看到绝对值）
- **前置**：两层同构副本能力（前置约定 ③）；`$t/evals/review-triage/eval.yaml` 的 `skills` 段与 `$t/evals/review-triage/fixtures/CONTRACT.json` 均可改写；skill-up 二进制可用（`validate` 与 `run`）；`.mjs` 桩能「把收到的 eval.yaml 复制出来再 `exit 0`」；导出模型变量（真跑档）；`$env:TEMP/eval-quote/out`（dry-run）与 `$env:TEMP/eval-quote/out-run`（真跑）均不存在。
- **步骤**：① 副本里把 `skills` 段写成块列表 + **单引号**：`- source: local_path` / `    path: '../skills/review-triage'`，用 `[System.IO.File]::WriteAllText($p,$text,(New-Object System.Text.UTF8Encoding $false))` 写回（无 BOM）；断言 `Select-String -Pattern "path:\s*'\.\./skills/review-triage'"` 命中数 = 1；② `& $env:SKILL_UP_BIN validate "$t/evals/review-triage/eval.yaml"` → 记录退出码（对照组：单引号是合法 YAML）；③ **刷新副本的契约快照**（否则 §3.3-5⑧ 会先以「哈希过期」码 4，把 ⑥-4 的结论洗掉）：先在**未改前**的副本 `eval.yaml` 上复算 sha256，与副本 `CONTRACT.json` 的 `files` 中该文件条目比对——**一致才继续**（证明复算方法正确）；改引号后再按同一方法**手工复算新哈希、写回副本 `CONTRACT.json` 的 `files` 条目**（A1 的用法只有 `[<技能名>] [--json] [--deep]`，**没有**可指定副本根的参数；用 A1 代劳会静默刷新**正本**而不是副本，故一律手工复算）；④ runner `--dry-run --eval-yaml "$t/evals/review-triage/eval.yaml" --output-dir "$env:TEMP/eval-quote/out"` → 读退出码、`⑥-4` 通过标记、stdout 打印的绝对路径；⑤ **注入形态（真跑档）**：桩按「`process.argv` 里第一个以 `eval.yaml` 结尾的项」定位输入的 yaml，把文件内容复制到 `$env:TEMP/eval-quote/captured.yaml`，然后 `process.exit(0)`（不写 `benchmark.json`，runner 码 2 属预期）；导出模型变量后跑 runner（`--eval-yaml <副本 yaml> --output-dir "$env:TEMP/eval-quote/out-run" --iteration 2`）；从 captured.yaml 抽出 `skills` 的 `path` 值并去掉 YAML 引号；⑥ **形态对照**：同副本分别改成双引号 `"../skills/review-triage"` 与无引号 `../skills/review-triage`，各按 ③ 的方式刷新哈希后跑一次 ④（不同 output-dir）。
- **预期**：② 退出码 **0**（单引号不改变 YAML 语义）；③ 未改前的哈希复算结果与副本快照逐字一致，刷新后 dry-run 输出**不含** `CONTRACT.json` / 哈希差异的失败行；④ 退出码 **0**、stdout 含 `⑥-4` 通过标记且 `reason=配置错误` 命中数 = 0、并打印解析后的绝对技能路径（`<副本根>\skills\review-triage`）；⑤ captured.yaml 的 `path` 去引号后 = 该技能目录的绝对路径（`[IO.Path]::IsPathRooted` = `True`，且与 `Resolve-Path "$t/skills/review-triage"` 逐字相等，不以 `.` / `..` 开头）；⑥ 单 / 双 / 无引号三形态的 ④ 均为 0 且 ⑥-4 均通过。
- **判据**：机器——② = 0；③ 未改前哈希与副本快照相等且刷新后无 ⑧ 失败行；④ = 0 且 `reason=配置错误` 命中数 = 0 且 stdout 含 `⑥-4` 通过标记与绝对技能路径；⑤ 去引号后的值 = 绝对路径且与 `Resolve-Path` 逐字相等；⑥ 三形态 ④ 全 0。**判别力**：按原始字符串比较（把 `'../skills/review-triage'` 连引号一起交给 `Test-Path`）的实现在 ④ 会码 4、失败行含 `⑥-4`——这正是「合法配置被误报成配置错误」的回退；只对无引号形态做正则匹配的实现会在单 / 双引号两档失败。
- **红绿证据**：红 = ⑥-4 用字符串相等或前缀匹配读 YAML 原文 → 引号被当成路径的一部分 → `Test-Path` 为 `False` → 误报码 4（合法配置被拒）；绿 = 先按 YAML 解析取值、再解析绝对路径。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证 `path` 里出现 `~` 或环境变量展开（本轮 yaml 不写这类形态）；不把「运行后副本 yaml 被还原」当判失败依据（spec 只对模型注入写明还原，本条按建议项记录）。

### TC-088 多条 `skills[].path`：第二条为空 / 目录不存在 / 缺 `SKILL.md` → ⑥-4 在 dry-run 即码 4

- **覆盖**：spec §3.3-5⑥-4（复数 `skills[].path`：每条都必须存在且含 `SKILL.md`）/ §3.2 / §3.3-5（`--dry-run` 也做启动前校验）
- **前置**：两层同构副本能力；四个独立副本 + 四个独立 `--output-dir`；`$t/skills/review-triage/SKILL.md` 在位；c 档需在副本里建 `$t/skills/incomplete-skill/`（空目录、无 `SKILL.md`）；`$t/evals/review-triage/fixtures/CONTRACT.json` 可改写。**sentinel 桩（C4）**：`.mjs` 桩被 spawn 的第一件事是写 `<sentinel 路径>\touched.txt`（固定 `$env:TEMP/eval-multi-path/sentinel/touched.txt`，目录先建好），再 `exit 0`；**sentinel 不存在 = 工具从未被 spawn**（dry-run 组合闸门拦在 spawn 之前即触发空路径的充要判据）。
- **步骤**：每档在副本 yaml 的 `skills` 列表**追加第二条**：a) `- source: local_path` / `  path: ''`（空字符串）；a′) `- source: local_path` / `  path:`（空值 / `null`）；b) `- source: local_path` / `  path: '../skills/no-such-skill'`；c) `- source: local_path` / `  path: '../skills/incomplete-skill'`（目录存在、无 `SKILL.md`）。每档：① **刷新副本契约快照**（与 TC-087 步骤 ③ 同一方法：先在未改前的副本 `eval.yaml` 上复算 sha256 并与 `CONTRACT.json` 的 `files` 条目比对，一致才继续；追加第二条后按同法**手工复算新哈希写回副本**——A1 用法只有 `[<技能名>] [--json] [--deep]`，无副本根参数，不得用 A1 代劳）；② `& $env:SKILL_UP_BIN validate <副本 yaml>`（对照组，记录实测值）；③ runner `--dry-run --eval-yaml <副本 yaml> --output-dir <fresh>` → 读退出码、stdout 单行、`verdict.md` 与 sentinel，并检查输出中**有无** `CONTRACT.json` / 哈希差异字样。
- **预期**：① 未改前哈希与副本快照逐字一致；刷新后 ③ 的输出**不含** ⑧ 的哈希差异失败行（失败只能来自 ⑥-4，否则本条结论不成立）；② validate **可能 exit 0**（对照组，不作判据）；③ 四档全部退出码 **4**、stdout 为**单行** `exit=4 reason=配置错误 <细节>`，`<细节>` 含 **`⑥-4`** 与对象名——a/a′ 的空路径无路径可写，`<细节>` 只需含 `⑥-4` 且明细非空（**spec 未规定空条目的具体写法，本条不锁定措辞**）；b 含 `no-such-skill`；c 含 `incomplete-skill` 且含 `SKILL.md`（或 `SKILL`）；`verdict.md` **不存在**；sentinel **不存在**（工具未被 spawn，不能等到真跑才发现）。
- **判据**：机器——① 未改前哈希与副本快照相等，且 ③ 输出中 `CONTRACT.json` / 哈希差异命中数 = 0；③ 四档退出码严格 = 4、stdout 单行同时含 `exit=4` / `reason=配置错误` / `⑥-4`；b 的该行含 `no-such-skill`；c 的该行含 `incomplete-skill`；a/a′ 的该行在 `⑥-4` 之后仍有非空细节（不校验具体措辞）；`verdict.md` 不存在、sentinel 不存在；② 只记录实测值。**判别力**：只校验 `skills[0]` 的实现在四档全 exit 0（合法路径在第一条上）→ 判失败；把空值 `continue` 跳过的实现在 a/a′ 放行 → 判失败；只核目录存在、不核 `SKILL.md` 的实现在 c 放行 → 判失败。
- **红绿证据**：红 = spec 写的是复数 `skills[].path`，实现却按单数只查第一条；空值被当成「没配置」跳过；只看目录不看 `SKILL.md`；绿 = 逐条核存在性 + `SKILL.md`，dry-run 即拦、失败行带 `⑥-4` 与对象名。
- **对应测试**：待 plan Task N
- **不覆盖**：不验证多技能在真跑时是否被工具全部安装（本轮 `eval.yaml` 只有一条技能，本条是**故障注入**下的闸门行为）；不讨论「是否该支持多技能」——spec 的 `skills[]` 是复数，逐条校验的义务即成立。

### TC-089 `INVALID_ENV` 但 ①–④ 不命中（认证失败）→ 明细第⑤类 `runtime-env-fail`

- **覆盖**：`§3.3-7（明细⑤ runtime-env-fail 的语义：INVALID_ENV 但前四类都不命中）/ §3.3-6（认证 stderr 覆盖 → 码 2；数据完整仍 INVALID_ENV）/ §7-8`
- **前置**：同 TC-080；桩能「先写两份完整干净数据，再向 stderr 写认证失败并 `process.exit(1)`」；`$env:TEMP/eval-runtime-env-fail/out` 不存在。
- **步骤**：① 桩写 `iteration-1` / `iteration-2`：01、02 两臂各 1 run（`3/3` 与 `0/3`，数据完整），随后向 stderr 写 `401 Unauthorized` 并 `process.exit(1)`；② 跑 runner（`--iteration 2`）；③ 读退出码、02 行、明细段。
- **预期**：退出码 **2**；02 行 `verdict=INVALID_ENV`、`exit=1`；明细段 `detail-kind=runtime-env-fail` 出现次数 **= 1**，该行含 `exit=1` 与认证证据（`401` / `Unauthorized` 之一）；**其余四个 token**（`skipped-benchmark` / `unknown-config` / `undetermined-run` / `timeout`）出现次数均为 **0**（本条构造不命中前四类）。
- **判据**：机器——退出码严格 = 2；02 行 `verdict=` 严格 `INVALID_ENV`；`detail-kind=runtime-env-fail` 出现次数 = 1 且该行含 `exit=1` 与 `401|Unauthorized`；`detail-kind=(skipped-benchmark|unknown-config|undetermined-run|timeout)` 出现次数 = 0。**判别力**：只认前四类、对「查不清原因」的 `INVALID_ENV` 什么都不写的实现 → 该 token 次数 = 0，判失败。
- **红绿证据**：红 = 有 `INVALID_ENV` 行、明细却是「无」或只写一句话，读者分不清是认证、spawn 还是数据问题；绿 = 五类 token 里明确落到第⑤类并带 `exit=` 与证据。
- **对应测试**：待 plan Task N
- **不覆盖**：不枚举第⑤类全部成因（spec 举了六种，本条只取「认证失败」这一种代表；spawn 错误 / 码 2·3·4 / `eval_name` 越界由 TC-096、TC-097 与既有 ③ 类用例分担）。

### TC-090 负例：`INVALID_ENV` 行存在、明细却写「无」→ 必须判红

- **覆盖**：`§3.3-7（「无」的定义 = 五类皆 0 条；存在 `INVALID_ENV` 行时不可能为「无」）/ §7-8`
- **前置**：同 TC-089（先得到一份真实 `verdict.md`）；另备一份**手改反例**：把该文件明细正文替换成「无」、其余不动。
- **步骤**：① 跑 TC-089 场景，确认原件明细有 1 条 `detail-kind=runtime-env-fail`；② 用同一检查逻辑分别判「原件」与「手改反例」；③ 记录两次判定结果。
- **预期**：② 原件判**通过**；手改反例判**失败**（存在 `verdict=INVALID_ENV` 的行，但明细正文 `^无[。.]?$` 命中 → 自相矛盾）。
- **判据**：机器——检查逻辑在反例上必须返回非 0（或失败标记）；原件上返回 0；且判据表达式写死为「存在 `verdict=INVALID_ENV` 行 ⇒ 明细正文不得命中 `^无[。.]?$`」。**判别力**：只检查「段存在」、不检查「`INVALID_ENV` 与『无』不可同真」的实现会把反例放过 → 本条判红即证明判别力在位。
- **红绿证据**：红 = `INVALID_ENV` 行 + 「无」并存，读者无法得知环境哪里坏了；绿 = 二者互斥被机器检查锁住。
- **对应测试**：待 plan Task N
- **不覆盖**：不校验「无」的排版（由 TC-080 管）；不重测第⑤类内容（由 TC-089 管）。

### TC-091 正例：同一 run 命中多类 → 合并成 1 条、空格分隔多个 `detail-kind=`

- **覆盖**：`§3.3-7（同一 run 命中多类合并成一条；多个 detail-kind 以空格分隔）/ §3.3-6（unknown 配置归 ③）`
- **前置**：同 TC-080；桩能写一条 `configuration: baseline` 且 `result={"passed":null,"total":null}` 的 run；`$env:TEMP/eval-detail-merge/out` 不存在。
- **步骤**：① 桩写 `iteration-1` / `iteration-2`：01、02 两臂各 1 run 正常；**只在 `iteration-1` 加 1 个** 02 的 `configuration: baseline` + `passed/total: null` 的 run（同一 run 同时触发 unknown 与 undetermined）；② 跑 runner（`--iteration 2`）；③ 读明细段，数「以 `- ` 开头且含 `detail-kind=` 的行」与各 token 次数。
- **预期**：明细段中「含 `detail-kind=` 的行」**恰 1 行**；该行同时含 `detail-kind=unknown-config` 与 `detail-kind=undetermined-run`（空格分隔，顺序不限）；两个 token 各出现 **1** 次；退出码 **2**、02 行 `verdict=INVALID_ENV`。
- **判据**：机器——含 `detail-kind=` 的行数严格 = 1；`detail-kind=unknown-config` = 1、`detail-kind=undetermined-run` = 1；退出码 = 2。**判别力**：按类各写一行（共 2 行）的实现行数 = 2 → 判失败（违反合并规则）。
- **红绿证据**：红 = 同一 run 被拆成两行，条数随类数膨胀、无法按 run 对账；绿 = 1 条 + 多 token。
- **对应测试**：待 plan Task N
- **不覆盖**：不测三类以上同时命中的组合（同一规则，合并规则已由本条锁定）。

### TC-092 负例：同一 run 的多类被拆成两条 → 必须判红

- **覆盖**：`§3.3-7（合并规则：拆成多条即违规）`
- **前置**：同 TC-091 的数据与产物；备一份**手改反例**：把 TC-091 的 1 行拆成 2 行（每行 1 个 token）。
- **步骤**：① 取 TC-091 的合法 `verdict.md` 原件；② 手改出两行版；③ 用同一检查逻辑分别判两份。
- **预期**：原件通过；拆行版判失败（含 `detail-kind=` 的行数 = 2 ≠ 1）。
- **判据**：机器——检查逻辑以「含 `detail-kind=` 的行数 = 1」为判据；拆行版必须返回失败。**判别力**：只数 token 总数（不数行数）的实现会把拆行版放过（总和仍为 2 个 token）→ 本条正是防这个假阴性。
- **红绿证据**：红 = 只数 token 不数行，拆行被当成合法；绿 = 行数是主判据。
- **对应测试**：待 plan Task N
- **不覆盖**：不测「同一 run 跨两个 failure 行」的情形（不存在：一个 run 只落一行）。

### TC-093 负例：工具码 0 + 输出含 `timeout` 字样 → 一律 `timeout=否`（不得误判）

- **覆盖**：`§3.3-6（失败行定义：工具退出码 ≠ 0 的行；工具退出码 0 → 一律 timeout=否）/ §3.3-7（「无」的场景）`
- **前置**：同 TC-080；桩能「写两份完整干净数据 + 向 stdout / stderr 打印含 `timeout` / `timed out` 的字样 + `process.exit(0)`」；`$env:TEMP/eval-timeout-word/out` 不存在。
- **步骤**：① 桩写 `iteration-1` / `iteration-2` 完整数据（两臂 `3/3` 与 `0/3`），随后 `console.log('timeout: none')`、`console.error('timed out? no')`，`process.exit(0)`；② 跑 runner（`--iteration 2`）；③ 读 02 行、明细段、退出码。
- **预期**：02 行 `timeout=否`、`verdict=VALID`；明细段正文 `^无[。.]?$`（`detail-kind=timeout` 出现次数 **= 0**）；退出码 **0**。
- **判据**：机器——02 行 `timeout=` 严格 `否`；`detail-kind=timeout` 出现次数 = 0；退出码严格 = 0。**判别力**：凡见到 stdout/stderr 里 `timeout` 字样就判超时、且不看工具退出码的实现会写 `timeout=是`（并可能把退出码升成 2）→ 判失败。
- **红绿证据**：红 = 模型回复里提到「超时」就被当成超时（假阳性）；绿 = 只看失败行 + 三支结构化信号。
- **对应测试**：待 plan Task N
- **不覆盖**：不测「工具码 0 但 stderr 有真超时」——按 spec 同样 `timeout=否`，与本条同一判据，不重复。

### TC-094 边界：整轮信号命中 → 所有失败行 `timeout=是`、明细 `scope=整轮` 且不含用例名

- **覆盖**：`§3.3-6（② stderr 命中 timeout = 整轮信号 → 所有失败行写 timeout=是）/ §3.3-7（整轮记录写 scope=整轮、不写用例名）/ §7-8`
- **前置**：同 TC-080；桩能对两条用例都写完整数据、都向 stderr 写 `timed out`、都 `process.exit(1)`；`$env:TEMP/eval-scope-round/out` 不存在。
- **步骤**：① 桩写 `iteration-1` / `iteration-2` 两条用例四臂完整数据，再输出 stderr `timed out` 并 `process.exit(1)`；② 跑 runner（`--iteration 2`）；③ 读 01、02 两行与明细段。
- **预期**：01、02 两行**都** `timeout=是`（整轮信号覆盖所有失败行）、`verdict=INVALID_ENV`；退出码 **2**；明细段 `detail-kind=timeout` 出现次数 **= 1**（整轮只记一条），该行含 `scope=整轮`，**不含任何用例 `eval_name`**（两个 `title` 原文都不出现）。
- **判据**：机器——两行 `timeout=` 均为 `是`；退出码 = 2；`detail-kind=timeout` = 1；该行含 `scope=整轮`；该行对两个 `title` 原文的命中数均为 0。**判别力**：只给「当前正在跑的用例」写超时的实现会让另一行 `timeout=否`（或把整轮记录写成带用例名的 run 级记录）→ 判失败。
- **红绿证据**：红 = 同一次超时被记成「某个用例超时」，下一次换用例又变，读者无法判断是整轮挂了；绿 = 一条整轮记录 + 所有失败行都标。
- **对应测试**：待 plan Task N
- **不覆盖**：不测 ③ 墙钟支的整轮性（与 ② 同口径，由 TC-086 c 档管）；不测「部分失败行来自不同原因」的混合情形（由 TC-091 的合并规则管，不在本条）。

### TC-095 边界：`probe` 行超时只记行、不改退出码

- **覆盖**：`§3.3-6（退出码只由 role=gate 的行取；probe 行超时只记行）/ §3.3-7（probe 行内的逐 run 信号）`
- **前置**：同 TC-080；桩能对 01 写 `session-result.json` 的 `{"exit_code":124}` 并 `exit 1`，对 02 写完整干净数据并 `exit 0`；`$env:TEMP/eval-probe-timeout/out` 不存在。
- **步骤**：① 桩写 `iteration-1` / `iteration-2`：01（probe）两轮写 `session-result.json`（`exit_code:124`）且不写 `benchmark.json`、`exit 1`；02（gate）两轮两臂 `3/3` / `0/3`、`exit 0`；② 跑 runner（`--iteration 2`）；③ 读 01 行、02 行、退出码、明细段。
- **预期**：01 行 `role=probe`、`timeout=是`、`verdict=INVALID_ENV`；02 行 `role=gate`、`timeout=否`、`verdict=VALID`；**退出码严格 = 0**（取码只看 gate）；明细段 `detail-kind=timeout` 出现次数 = 1 且含 `scope=run`。
- **判据**：机器——退出码严格 = 0；01 行 `timeout=` 严格 `是` 且 `verdict=` 严格 `INVALID_ENV`；02 行 `verdict=` 严格 `VALID`、`timeout=` 严格 `否`；`detail-kind=timeout` = 1 且该行含 `scope=run`。**判别力**：把 probe 的超时也算进退出码的实现会给出 2 → 判失败。
- **红绿证据**：红 = 一个探针用例超时把整轮判成环境故障；绿 = 行内标记 + 码仍 0。
- **对应测试**：待 plan Task N
- **不覆盖**：不测 probe 的其它信号（数据不足由 TC-071 ③ 管，unknown 由 TC-084 管）。

### TC-096 正例：工具码 4 + 数据完整 → 退出码严格 4（不得 0）、行保留 `exit=4`

- **覆盖**：`§3.3-6（二维表⑤：工具码 4 + 数据完整 → runner 码 4、该行 verdict=INVALID_ENV、行内保留 exit=4）/ §3.3-7（明细⑤）`
- **前置**：同 TC-080；桩能「写两份完整干净数据后 `process.exit(4)`」；`$env:TEMP/eval-code4-full/out` 不存在。
- **步骤**：① 桩写 `iteration-1` / `iteration-2` 两条用例四臂完整数据（两臂 `3/3` / `0/3`），随后 `process.exit(4)`；② 跑 runner（`--iteration 2`）；③ 读退出码、02 行、明细段。
- **预期**：退出码**严格 = 4**（不得 0——数据虽完整，工具自报环境/配置失败）；02 行 `verdict=INVALID_ENV` 且行内保留 `exit=4`；明细段 `detail-kind=runtime-env-fail` 出现次数 = 1 且含 `exit=4`。
- **判据**：机器——退出码严格 = 4；02 行含 `exit=4` 且 `verdict=` 严格 `INVALID_ENV`；`detail-kind=runtime-env-fail` = 1。**判别力**：只按 verdict 取码的实现会给 0（数据完整 + VALID 判据）→ 判失败；把码 4 当「runner 自身配置错误」退 4 但不写行内 `exit=4` 的实现丢证据 → 判失败。
- **红绿证据**：红 = 工具退 4 被当成 0（数据完整就放行）；绿 = 码 4 透出 + 行内 `exit=4` + 明细⑤。
- **对应测试**：待 plan Task N
- **不覆盖**：不测工具码 5（表外码，由 TC-083 管）；不测数据不完整时码 4（由 TC-097 管）。

### TC-097 边界：工具码 4 + 数据不完整 → 按 ③ 取码 2

- **覆盖**：`§3.3-6（二维表③ 覆盖工具码 ∈ {0..4}：数据不完整 → 2；③ 与 ⑤ 的边界）/ §3.3-7（明细③/⑤）`
- **前置**：同 TC-080；桩能「只写 `iteration-1` 一份数据后 `process.exit(4)`」；`$env:TEMP/eval-code4-partial/out` 不存在。
- **步骤**：① 桩只写 `iteration-1`（两臂 `3/3` / `0/3`），**不写 `iteration-2`**，随后 `process.exit(4)`；② 跑 runner（`--iteration 2`）；③ 读退出码、02 行、明细段。
- **预期**：退出码**严格 = 2**（③ 的「数据不完整」优先于 ⑤ 的码 4——③ 覆盖工具码 0..4）；02 行 `verdict=INVALID_ENV`、`iteration=1`（不足 `iteration_min`=2）；明细段 `detail-kind=runtime-env-fail` 出现次数 = 1（该类语义含「数据量不足」），不含 `detail-kind=skipped-benchmark`（文件没坏、只是缺）。
- **判据**：机器——退出码严格 = 2；02 行 `iteration=` 严格 `1`；`detail-kind=runtime-env-fail` = 1；`detail-kind=skipped-benchmark` = 0。**判别力**：先看工具码、见 4 就退 4 的实现 → 判失败（③ 必须压过 ⑤）；把「缺目录」当成坏产物写 `skipped-benchmark` 的实现 → token 判失败。
- **红绿证据**：红 = 码 4 把「数据没跑够」掩盖成「工具配置问题」；绿 = 按 ③ 取码 2 + 明细⑤。
- **对应测试**：待 plan Task N
- **不覆盖**：不测工具码 0..3 + 数据不完整（同属 ③，由 TC-048 c/g1、TC-051 管）。

### TC-098 边界：全 `probe` 套件（取码集合为空）→ 有 `benchmark.json` 码 3，一个都没有码 2

- **覆盖**：`§3.3-6（取码集合为空的全 probe 套件：有 benchmark.json → 3；一个都没有 → 2）`
- **前置**：两层同构副本；副本 `expected.md` 两条用例的 `role` 都改成 `probe`（并手工复算 `CONTRACT.json` 哈希写回，同 TC-087 ③）；桩能「写完整数据」与「完全不写」两档；两个 `--output-dir`（a / b）不存在。
- **步骤**：① 档 a：桩写 `iteration-1` / `iteration-2` 两条用例的 `benchmark.json`（每条用例在两臂下都有 run；`role` 均为 probe），`exit 0` → 跑 runner（`--iteration 2`）；② 档 b：桩不写任何 `benchmark.json`、`exit 0` → 跑 runner；③ 读两档退出码与行 `verdict`。
- **预期**：a 退出码**严格 = 3**（取码集合为空但有产物 → 「无 gate 用例」）；b 退出码**严格 = 2**（取码集合为空且一个产物都没有 → 「无可用数据」）；b 档 stdout 有既有义务的 `flaky 未判定（无产物）`（只记录，不作判据）。
- **判据**：机器——a 退出码严格 3；b 退出码严格 2。**判别力**：按「有数据 → 0」取码的实现会在 a 给 0（把没有 gate 的套件判成通过）；两档混为一个码的实现会在 b 给 3 → 两处都判失败。
- **红绿证据**：红 = 没有 gate 用例却判 0，等于套件空转被当通过；绿 = 3 / 2 两档分明。
- **对应测试**：待 plan Task N
- **不覆盖**：**TC-050 的全 probe 取码断言待用户授权后补**（既有用例改动，超出本轮授权）；本条只覆盖新增的「取码集合为空」两句。

### TC-099 负例：明细段排在逐用例行之前 → 必须判红

- **覆盖**：`§3.3-7（`## 异常明细` 是 verdict.md 的最后一段）/ §7-8`
- **前置**：同 TC-080（先得到一份合法 `verdict.md`）；备一份**段序反例**：把 `## 异常明细` 段整体移到逐用例行之前。
- **步骤**：① 取 TC-080 合法原件；② 调换段序生成反例；③ 用同一检查逻辑（切片 = 标题后到文件末尾 `Trim()`）分别判两份。
- **预期**：原件通过；反例判失败（切片把逐用例行卷进「明细」正文，`^.+: role=(gate|probe)` 在 `$body` 内命中数 ≥ 1）。
- **判据**：机器——反例上「`$body` 内 role 行命中数 = 0」不成立 ⇒ 返回失败；原件上返回 0。**判别力**：用「到下一个 `^## ` 前」切片的实现会把反例放过（正文只剩「无」）→ 本条正是防这个假阴性。
- **红绿证据**：红 = 段序错位而检查仍绿；绿 = 「全文末段」这一条被切片逻辑强制。
- **对应测试**：待 plan Task N
- **不覆盖**：不测段标题拼写错误（段缺失，由 TC-080 ⑤a 管）。

### TC-100 负例：明细值里的换行伪串必须转义，不得伪造段标题或逐用例行

- **覆盖**：`§3.3-7（单行约束：换行/回车/制表/控制字符转义成 \n/\r/\t/\uXXXX 字面形式）/ §7-8`
- **前置**：同 TC-080；桩能写 `configuration` 值含换行的 run；`$env:TEMP/eval-inject/out` 不存在。
- **步骤**：① 桩写 `iteration-1` / `iteration-2` 正常数据，**只在 `iteration-1` 加 1 个** 02 的 run，其 `configuration` 值为 JSON 字符串 `"baseline\n## 伪造段"`；② 另档把该值改为 `"x\n02: role=gate verdict=VALID"`；③ 各档跑 runner（`--iteration 2`），读明细段原始字节与行数。
- **预期**：两档明细段都**只有 1 条** `detail-kind=unknown-config` 记录且**恰占 1 行**（原始文本中不出现真实换行）；伪串以字面 `\n`（反斜杠 + n）形式出现；明细段内**不得**出现第二行以 `## ` 开头（除段标题本身），也不得出现 `^.+: role=(gate|probe)` 行；02 行的 `verdict=` 不被伪串改写（`INVALID_ENV`）。
- **判据**：机器——从段标题到文件末尾的行数 = **2**（标题 + 1 条记录）；该范围内 `^## ` 行数 = 1；该范围内 `^.+: role=(gate|probe)` 行数 = 0；`\n`（字面两字符）在这条记录里出现次数 ≥ 1；含 `detail-kind=unknown-config` 的行数 = 1。**判别力**：直接 `JSON.stringify` 以外的拼接或去掉转义的实现会在明细里造出真实换行 → 行数 > 2、或伪造出 `## 伪造段` / 假逐用例行 → 判失败。
- **红绿证据**：红 = 用户可控值把 `verdict.md` 的结构撑破（下游按 `^## ` 解析的读者被注入）；绿 = 单行 + 全转义 + 结构行数固定。
- **对应测试**：待 plan Task N
- **不覆盖**：不枚举全部控制字符（同一规则；`\uXXXX` 形态只作存在性要求，不做逐字符穷举）。

## 3 负例与边界

| 用例 ID | 边界/负例是什么 | 为什么容易漏 | 期望行为 |
|---|---|---|---|
| TC-004 | `skills[].path` 写成 `.` | 试跑版就是这么写的，且工具不校验（实测 exit 0） | 预期 exit 0（已知缺口），缺口必须登记且不得写成「工具会拦住」 |
| TC-005 | `evals/` 被复制进技能目录 | 既有守卫不查技能目录下多出的子目录 | 结构断言检出，删除后归零 |
| TC-007 | runner 漏传 `--output-dir` | 默认值在正常情况下也能跑通 | 副本里出现 `skills/review-triage-workspace`，据此判定参数不可省 |
| TC-009 | 环境里没有 skill-up | 开发机都装了，CI/新机器才暴露 | check 仍全绿，零 eval 相关输出 |
| TC-010 | 删掉产物目录后重跑 | 「已存在则拒绝」让删除成为必经步骤 | 删除后重跑自建；run 三态与 delta 符号一致 |
| TC-013 | 分档标题写进 `must_not_contain` | 标题看起来最像「该档的标志词」 | 历史正确答案被误杀，据此禁止该写法 |
| TC-014 | 只有结论词、没有理由词 | 结论词最显眼、写起来最省事 | 「结论对理由错」的假回复被放过，判用例不合格 |
| TC-017 | 只用「diff 字面核对」等复述型措辞充当证据 | 命令全名之外的说法看起来更「自然」 | 无主锚点时判 FAIL（复述 ≠ 实跑） |
| TC-018 | 禁词出现在否定句 | 「不是低风险」语义正确但字符串仍包含禁词 | **纯子串、无否定豁免**（与工具同口径）——正确样本必须改用正向表述；不得用豁免放行 |
| TC-019 | prompt 暗示档位 / 锚点泄漏进 prompt | 写 prompt 时顺口带出结论 | 答案词与锚点在 prompt 中 0 命中 |
| TC-022 | `repo_fixture` 指源目录 / 按 case-id 物化 / 字段层级写错（`context.apply_diff`）/ fixture 无 baseline 提交 | 三个路径写法看起来都「指向 fixture」，且工具对未知字段静默忽略、空仓库在目录列表里也看不出来 | 判用例不合格（字面值 = 物化路径 + 层级 + baseline + 闸门 ⑥ 五步 + 取证痕迹） |
| TC-066 | `apply_diff` 写成 `context.apply_diff`（与 `repo_fixture` 同级） | 层级错不报错、配置看起来齐全 | 补丁不生效、工作区无 `.git` → 判用例不合格 |
| TC-067 | fixture 无 baseline 提交（只 `git init` 或没有 `.git`） | `.git` 存在就以为「有 git 场景」；空仓库与有提交的仓库在目录列表里无法区分 | `git log` 无提交、`git diff` 为空 → 判用例不合格 |
| TC-068 | 01 的 `must_contain` 只有结论词 | 结论词最显眼、写起来最省事，且装技能臂几乎总命中 | 不装臂偶然命中 → `flaky=是`/`delta=0.667` → 判用例不合格 |
| TC-023 | fixture 换成空目录 | 结果看起来像技能判错，实际是用例前提不成立 | probe 行只允许 VALID/FLAKY/ENV，不得归因技能 |
| TC-024 | 补丁/plan.md 带 BOM 或 CRLF | PowerShell 默认写法会引入；plan.md 会被 check 扫到 | `git apply --check` 为 0；plan.md 围栏/表格合规 |
| TC-025 | 补丁用反斜杠路径 | Windows 上手写补丁的自然写法 | `git apply` 必须 0 |
| TC-028 | flaky 被当成结论 | 两次都过时看不出问题，一过一挂时最想下结论 | `verdict=INVALID_FLAKY`，不得判技能好坏 |
| TC-030 | 两臂都全过、delta = 0 | 装臂 100% 看起来「非常有效」 | 必须判不达（旧标量口径正是在这里报 VALID） |
| TC-031 | 用断言项分母冒充 run 级分母 | `3/3` 与 `7/7` 挨着显示，前者更抓眼 | 对账按 run 级分母 |
| TC-033 | 二进制找不到时静默跳过 | 「没跑」与「通过」在退出码上都是 0 最容易混 | 退出码 2 + 安装指引 + 无产物 |
| TC-035 | 非 0 被解释成技能坏了 | 退出码语义直觉化 | 必产 verdict 行，`INVALID_ENV` + `exit=` |
| TC-037 | 把结论外推到 Claude | 习惯性把「模型」等同于 Claude | 出现第三方模型名时 0 外推句 |
| TC-038 | 无凭据时判技能失败 | 无凭据的报错最像「环境问题」，也最容易被顺手归因 | 退出码 2 + `INVALID_ENV` |
| TC-040 | calibrated 未达时报 DELTA / 改技能迁就 | 「技能退化」比「用例没校准好」听起来更严重 | `INVALID_ASSERT` + 技能零改动 |
| TC-041 | 改 SKILL.md 让用例过 | 改动看起来「很小」 | `skills/` diff 为空 + 关键判据词逐词在位 |
| TC-042 | 顺手铺开多技能或接 CI | 结构一次建好最省事 | 只允许一个技能目录、无 CI |
| TC-043 | 空用例集静默成功 | 0 条用例时工具可能返回 0 | 退出码 3 |
| TC-044 | 坏 yaml 静默通过 | 配置错误常在真跑时才炸 | validate 非 0 且指行 + runner 码 4 |
| TC-045 | 产物目录已存在仍重跑 | 默认工具行为是覆盖 | runner 拒绝 + 提示 |
| TC-049 | frozen 的未达被写成 ASSERT | 两者都是「不达标」，值看起来可以互换 | `INVALID_DELTA` + 「技能退化」归因 |
| TC-050 | 同一份未达标数据按 `origin` 走两个结论；probe 混进 L3 | 「不达标」被统一映射成一个值最省事；probe 有 `arms=null` 看起来「只是没阈值的 gate」 | 三态对照：calibrated→ASSERT、frozen→DELTA、probe 只取 VALID/FLAKY/ENV |
| TC-051 | 空 `passed`/`total` 被当「未全过」或「全过」 | 报表里空值看起来像 0 或像满分 | 归 `undetermined`，排除出 flaky 与分母 |
| TC-052 | 只读 `iteration-1` 的实现 | 它能在其余所有用例上都「通过」 | 正确实现判 `flaky=是`，只读实现判 `否`，两者必须可区分 |
| TC-053 | 旧 schema / 坏 JSON / 多个 json 块 | 旧字段名眼熟，容易「顺手兼容」 | 一律码 4，不做兼容 |
| TC-054 | eval_name 与 title 差一字 / title 重名 | 差一字肉眼看不出来 | 双向集合比较 + 重名拦截 |
| TC-055 | 枚举大小写错 | `Gate` 与 `gate` 看起来一样 | 严格枚举，不归一 |
| TC-056 | gate 下限越界（`min_rate` < 0.8）/ `delta.min` 越界 / `assert` 与 yaml 不符 | 配置能过 JSON 校验、能跑 | 启动前码 4 |
| TC-057 | oracle 文件缺失（或被指向一个目录） | L2 是离线校验，缺文件看起来「跑起来再说」 | 启动前码 4，不花模型调用 |
| TC-058 | oracle 与断言不自洽（含否定式「这不是低风险」） | oracle 是人写的，看着像正确答案就够了 | 启动前码 4；否定式同样计命中（与工具同口径） |
| TC-059 | 锚点在 prompt 里出现 / 在 oracle 里 0 命中 / 全角变体 | 锚点看起来只是个字符串，抄到哪里都「一样」 | 三种均码 4，且 stdout 区分方向 |
| TC-060 | `iteration_min` 大于本次迭代数 | 容易误以为「只要 ≥2 就行」 | 上下界都拒 |
| TC-061 | oracle 由试跑产出或逐字摘录历史样本 | 手写与摘录外观上没有区别 | 哈希相同对数 = 0 + 出处声明 + mtime/签字两档；`git log` 不作唯一判据 |
| TC-062 | probe 填假数值 / gate 留 null | 为了「格式完整」顺手填 | 两次都码 4 |
| TC-063 | 出生即 frozen | 新用例想「一次定稿」 | 无留痕即码 4 |
| TC-064 | 关掉 baseline | 只跑装臂省一半调用，省钱诉求很自然 | 码 4、不跑 |
| TC-065 | 源目录 / 物化后的 `repo_fixture` / `apply_diff` / `skills[].path` 不存在 | `validate` 与工具 `--dry-run` 都 exit 0；且「源目录缺」与「物化后缺」在目录列表里看不出区别 | 闸门 ⑥ 按 **⑥-1→⑥-4** 顺序在**对应那一步**码 4（源目录缺 = ⑥-1；物化后字面值缺 / `apply_diff` 缺 = ⑥-3；`skills[].path` 缺 = ⑥-4），且单行带失败项编号 |
| TC-048 | 退出码五种码位互斥 + 二维表 b1/b2/b3 + 首个失败项取码 + 跨行 `2>3>1>0` + 取码集合只算 gate 行 | 所有失败归一成同一个非 0 码时，四类错误分不开；把工具码直接当 runner 码会把设计内的不装臂失败判成故障；把 probe 行算进取码集合会被它的环境抖动盖掉 gate 的结论 | 映射函数各就位且互不相同；b1/b2/b3 分开断言；g1 取 2、g2 取 3、g3-2 取 3 / 0 |
| TC-070 | A1 契约脚本不存在 / 挂进 `check` / 只打印 findings 却退出 0 / 读产物目录产 verdict / 改了判据不重跑 A1 | 「有文档规矩」看起来就等于「有执行入口」，S10 正是这个形态；而「必须跑」若没有 runner 侧闸门，就只是纪律 | 直接 `node` 跑 0 findings，三类注入均码 4，不挂 npm script、不读产物目录（按**非注释行的调用参数**判）；改后不重跑 → 启动前码 4 |
| TC-071 | gate 只校验 `--iteration` 参数、不看实际观测数；或把 probe 也套闸门 | 工具在 iteration-1 后失败时，1 个目录看起来「也跑过了」；反之把 probe 的数据不足升成整轮码 2，会让单个 probe 抖动掩掉 gate 结论 | gate 不达 → `INVALID_ENV` + 码 2；probe 只落行内 `flaky=未判定`、退出码仍 0 |
| TC-072 | `expect.exit_code` / `files_exist` / `files_not_exist` / `judge.tool_called` / `output_contains.not` / `cases.defaults.expect` 被放行 | 官方文档里它们都合法，看着「更严格」其实是给 L2 与 `assert_hash` 留后门；按「见过的键名」硬编码会漏掉同族新键 | 白名单外一律码 4（措辞不作判据） |
| TC-073 | `title` 重名但多重集相等 | 集合去重后「相等」，看起来完全正常；随后两用例被并成一组 | 码 4（措辞不作判据） |
| TC-074 | `frozen` 留痕与现块不一致却仍按 frozen 处理（或静默降级校准） | 留痕是人读小文件，看起来不需要契约 | 码 4（reason=配置错误）+ 提示重新校准，禁止降级 |
| TC-075 | 补丁与 fixture 不对齐，但两个路径都存在 | `Test-Path` 全绿、工具静默跳过，模型看到的是干净仓库 | 物化后 `git apply --check` 非 0 → 码 4 |
| TC-076 | 工具码 2/3 + 数据完整 | 数据「全过非 flaky」看起来就该报 VALID | 以工具为准：`INVALID_ENV` + 码取工具码（2 / 3） |
| TC-077 | 工具码 5（表外）+ 数据完整 | 有数据时容易顺手「由 verdict 定码」，把表外码吞掉 | 码 5 原样透传，verdict 独立按 L1/L3 |
| TC-078 | `CONTRACT.json` 缺失 / `exit` ≠ 0 / `files` 哈希与当前文件不一致 | 快照是小 JSON，看起来「有就行」；哈希只在 A1 里算，没人复算就永远绿 | 码 4（reason=配置错误）+ 提示先跑 A1；字段齐（`schema` / `checked_at` / `exit` / `files`） |
| TC-079 | `passed` / `total` 写在 run 顶层（不在 `result` 下） | 字段名对、值也对，只是层级错；跑起来全变 `undetermined`，而桩测试可能仍全绿 | 该 run 判 `undetermined`、stdout 保留原始值，不得静默当 `full` |
| TC-081 | 坏 `benchmark.json`（解析失败 / `null` / 数组 / `runs` 非数组） | 目录在、文件也在，粗略 `Test-Path` 看不出损坏；坏文件看起来「也算一次观测」 | 一律跳过：不计入 `iteration=`（全坏写 `n/a`，不写 `0`）、明细逐条列路径 + 原因、③ 归 `INVALID_ENV` / 码 2 |
| TC-082 | `configuration` ∉ {with_skill, without_skill}（`baseline` / 拼错值） | 第三组的 run 混在 `runs[]` 里、值看起来「只是多一条数据」；并进不装臂时 rate 反而更漂亮 | ③ fail-closed：`INVALID_ENV` / 码 2；不得计入任一臂；明细列 `eval_name` + `configuration` 原文 |
| TC-083 | 表外码 5 + 存在 unknown run（③ 与 ④ 交叉格） | 两格各读一句都通；③ 的「数据不完整」最容易先命中 | 透传优先：退出码 5；verdict 仍按 L1/L3（VALID）；明细仍列 unknown |
| TC-084 | unknown 只出现在 probe 上 | 「同一种异常」看起来该给同一种码 | 行内 `INVALID_ENV` + 明细，退出码仍 0（码 0 只看 gate） |
| TC-085 | `undetermined` 只进 stdout、不进留痕 | 行内已有 `undet=` 计数，看起来「信息够了」 | 明细第③类逐条列 `eval_name` / 臂 / 原始 `passed,total` |
| TC-086 | 超时三支信号只判「是 / 否」 | 三支都叫「超时」，处置却分别是工具、转发层、runner 阈值 | 明细指明命中哪一支，三档记录可区分 |
| TC-088 | 第二条 `skills[].path` 为空 / 不存在 / 缺 `SKILL.md` | `skills[]` 写成单数也能跑，合法路径在第一条时最容易被放过 | 逐条核存在性 + `SKILL.md`，dry-run 即码 4 并带 `⑥-4` |
| TC-090 | `INVALID_ENV` 行存在、明细正文却写「无」 | 「有结论行就够了」；「无」只被当成排版选项 | 二者互斥：该场景必须判红 |
| TC-092 | 同一 run 的多类被拆成两条明细 | 总数仍是 2 个 token，看起来「都记了」 | 以「含 `detail-kind=` 的行数 = 1」判，拆行判红 |
| TC-093 | 工具码 0 但输出含 `timeout` 字样 | 字符串匹配最省事，看起来「宁可多报」 | 一律 `timeout=否`，退出码 0，明细无 timeout 条 |
| TC-094 | 整轮超时信号只标给「当前用例」 | 逐 run 记录写顺手了；整轮与逐 run 都有 `timeout=是` | 所有失败行 `timeout=是`；明细 `scope=整轮` 且不含用例名 |
| TC-095 | probe 行超时被算进退出的取码集合 | probe 与 gate 都有 `INVALID_ENV`，混在一起最省事 | probe 行 `timeout=是` + `INVALID_ENV`，退出码仍 0 |
| TC-097 | 工具码 4 + 数据不完整（③ 与 ⑤ 的边界） | 「工具自报 4」看起来最该透传 | 按 ③ 取码 2（③ 覆盖工具码 0..4） |
| TC-098 | 全 probe 套件（取码集合为空） | 有数据就当通过；没有 gate 的套件最容易判 0 | 有 `benchmark.json` → 3；一个都没有 → 2 |
| TC-099 | 明细段排在逐用例行之前 | 「段存在 + 正文是『无』」看起来就满足 | 切片到文件末尾会卷进逐用例行 → 判红 |
| TC-100 | 明细值塞 `\n## ` / `\n<eval>: role=…` 伪串 | 拼接字符串时看不见换行，`verdict.md` 结构被撑破 | 明细必须单行、全转义，段内不得出现第二个 `## ` 或 role 行 |

**负例与边界核对（逐条清点，以 §1 覆盖总表「正/负/边界」列为准）**：
- **正例 26 条**：TC-001、002、003、006、008、011、012、015、016、020、021、026、027、029、032、034、036、039、046、047、**069、080、087、089、091、096**。
- **负例 50 条**：TC-004、005、007、009、013、014、022、023、028、030、033、035、037、040、041、042、045、049、052、053、054、055、056、057、058、059、061、062、063、064、065、066、067、068、070、071、072、073、074、075、**078、079、081、082、088、090、092、093、099、100**。
- **边界 24 条**：TC-010、017、018、019、024、025、031、038、043、044、048、050、051、060、**076、077、083、084、085、086、094、095、097、098**。
- 合计 26 + 50 + 24 = **100**，与用例总数一致（逐条编号清点：正 26 个编号 + 负 50 个编号 + 边 24 个编号 = 100 个互不重复的 TC 号，与 §1 覆盖总表 100 行逐行对齐）；**负例 + 边界 = 74 ≥ 正例 26**。

## 4 回归清单

| 如果改了 | 必须重跑 | 为什么 |
|---|---|---|
| `evals/review-triage/cases/01-checkbox-mechanical.yaml` | TC-011、012、015、016、017、018、020~025、031、039、046、059、066、068、**069、071、072、073、075** | 01 的断言、锚点、fixture 引用与预期值全在这份文件里 |
| `evals/review-triage/cases/02-command-swap-semantic.yaml` | TC-011、012、014、020~025、031、039、056、058、065、066、067、075、**069、071、072、073** | 02 的断言与 §3.2.2 的 gate 数值绑定；02 已声明 `context.git.apply_diff` / `repo_fixture`（`command-swap-demo` + `command-swap.patch`），fixture 相关用例同样覆盖它 |
| `evals/review-triage/expected.md` | TC-039、040、049、050、051、053~060、062、063、**069、070、072、073、074、076、077、078、080、081、085** | 机读块是三层判据的唯一单源，一处改动全体判定跟着变（`iteration_min` 尤其：TC-080 / 081 / 085 的数据量结论都靠 `iteration_min = 2` 才成立）；改动也会让 `CONTRACT.json` 的哈希失效（→ 不重跑 A1 即码 4） |
| `evals/review-triage/fixtures/oracle/**` | TC-015、046、058、061 | oracle 是 L2 的唯一输入；换成模型摘录即判不合格 |
| `evals/review-triage/eval.yaml` | TC-002、003、004、026、029、043、044、064、065、**069、072、078、087、088** | 契约字段、迭代次数、baseline、`skills[]` 的条目与写法（引号形态、条数）都从这里进；它也是 `CONTRACT.json` 覆盖的六类文件之一 |
| `evals/review-triage/fixtures/CONTRACT.json` | TC-032、**070、078** | A1 的产物快照（`schema` / `checked_at` / `exit` / `files`）；被手改或与当前文件不一致 → 启动前 ⑧ 码 4 |
| `evals/review-triage/fixtures/repos/**` 与 `diffs/**` | TC-020~025、023、065、066、067、**069、075** | 补丁与仓库必须逐字对齐；路径存在性由闸门 ⑥ 核对；字段层级、baseline 提交与 `git apply --check` 决定用例能否跑进目标场景。**覆盖两套**：`repos/checkbox-demo/` + `diffs/checkbox.patch` 服务 01；`repos/command-swap-demo/`（`package.json` / `scripts/lint.mjs` / `scripts/typecheck.mjs` / `scripts/precommit.sh`）+ `diffs/command-swap.patch` 服务 02——只改其中一套，对应用例（01 或 02）必须重跑 |
| `evals/review-triage/fixtures/responses/**` | TC-013、016、017、046、028、**070** | 历史样本：不参与 verdict、不进 runner 判定链、不得充当 oracle；唯一机器用途 = A1 按 `RECORD.md` 留痕复算 |
| `evals/review-triage/fixtures/RECORD.md` | TC-022、046、**061、070、074** | 禁词双向留痕、oracle 定稿时间与 A1 复核摘要都记在这里；造假/缺失会让 A1 与人工签字双双落空 |
| `scripts/run-eval.mjs` | TC-006、007、009、026~038、040、043~045、047~052、053~065、**069、071、072~079、080~100** | 参数拼装、退出码（含二维表 ①–⑤、跨行取码、全 probe 取码）、产物生命周期、L1 汇总（含 run 三态字段路径）、闸门 ①–⑨、`verdict.md` 的「异常明细」段（**五类 token + 单行转义 + 全文末段**）全由它决定 |
| `scripts/check-eval-contract.mjs` | **TC-070、TC-078** | A1 契约脚本自身一改，离线核对结果与 `CONTRACT.json` 全部作废；改完必须重跑 0 findings |
| `package.json` | TC-008、009、042 | 只允许新增一条 script，check 不得被污染 |
| `.gitignore` | TC-006、010、045 | 产物改道是否被忽略取决于此 |
| `skills/review-triage/SKILL.md` | TC-011~016、021、023、039~041 | 技能判据变则理由词、fixture 必要性、预期值全要重估 |
| `docs/superpowers/specs/2026-10-21-skill-eval-harness-design.md` | TC-003、011、012、029、031、036、039、049、050、**069、071、074、076、077、080~100** | 契约字段、三层口径、路径单一基准、§3.2.2 数值、二维表 ①–⑤、超时信号作用域与「异常明细」段的机读契约以 spec 为准 |
| `scripts/check-all.mjs` | TC-008（应直接报红） | 该文件本轮禁止改动；一旦有 diff 即违约 |
| `.session/eval/state/review-triage.json` | TC-036 | 模型账（**不进 git**，运行时缓存） |
| `evals/review-triage/frozen-ledger.json` | TC-049、063、**074** | frozen 留痕（**进 git、可审计**）；删改它或改块不更新它，都会改变 `origin` 合法性与 `assert_hash` / `arms_snapshot` 的比对结果 |

## 5 只手动验证

| 项 | 为什么机器验不了 | 谁验、看什么 |
|---|---|---|
| 01 装技能后的真实回复里，证据是「实跑得到」还是「复述 prompt」 | 关键词断言只能看见字面；启动前闸门 ⑥ 只保证锚点在 prompt 中 0 命中，不能保证模型真去看了 fixture | reviewer-qa 看：回复是否给出 fixture 仓库里的真实输出、是否提到仓库路径或 `git status`；若只复述 prompt，即便断言全过也判证据不成立 |
| 「理由级词」是否真的承载了推理 | 词表命中无法区分「讲清为什么机器判不了」与「把词抄一遍」 | reviewer-qa 看：命中词所在句子有没有因果链（判据为何不可机械执行、替代验证是什么） |
| oracle 是不是真手写 | 哈希只能抓「逐字相同」，抓不住「改写自模型输出」 | reviewer-qa 看：oracle 的写作视角与出处声明（TC-061 步骤③）；可疑则要求重写 |
| 出现 flaky 后是否真的停下改用例 | 机器只能查 `verdict=INVALID_FLAKY` | 用户或 reviewer-qa 看：结论之后是否还有基于该次运行的有效性判定；是否改用例后重跑 |
| `verdict=INVALID_DELTA` 时是否真的按「技能退化」处理，而不是悄悄改用例迁就 | 机器只能查枚举值，查不到后续动作 | reviewer-qa 看：frozen 用例不达后有没有走「改用例」流程（那是违规），有没有动 `skills/` |
| `npx skills add` 的真实安装清单不含 `evals/` | 结构断言只是代理证据 | reviewer-qa 在临时目录安装一次，看安装目录里是否出现 `evals` |
| R10 预期值是否真的先于首跑 | mtime 可被重写；机器只能验顺序 | 评审看对话与提交历史顺序：review-triage 应有「试跑校准（冒烟口径）」声明；下一技能应有「预期先于首跑」 |
| 结论里的模型名是否与真实后端一致（转发可能改写） | 只能验字段非空与「未验证」声明 | 用户对照转发侧记录，确认 `actual_model=` 行；该行同时决定 TC-037 是否执行 |
| `$env:TEMP` 下 fixture 的 `git init` / `git add` / `git apply`，以及 runner 在 `.session/eval/fixture/**` 的物化 `git init` / `add` / `commit` 是否获批 | spec §6-7 声明**两处例外**都需用户/议会确认后才执行 | 用户或议会确认后才允许执行 TC-021 与任何触发物化的 runner 调用；确认结果记入结论文件 |
| `CONTRACT.json` 是否真由 A1 生成（而非手工伪造一份自洽快照） | 机器只能复算哈希与 `exit`，判不了「这份快照是谁写的」 | reviewer-qa 对照 `RECORD.md` 里 A1 的执行记录（命令 + 输出摘要 + 时间）与 `CONTRACT.json` 的 `checked_at`：`checked_at` 必须晚于最近一次判据文件改动、且能与某条 A1 记录对上（TC-078 拦不住伪造，见 §7 缺口与 §8 建议 14） |
| `frozen` 留痕是否被人为改写以维持冻结 | 留痕进 git（可审计），但仍可由人改写后重算 hash | reviewer-qa 看 `verified_at` / `delta_at_verify` 是否与对应 benchmark 对得上 |
| 禁词双向留痕与 oracle 定稿时间是否事后补签 | A1 只能复算「记录与样本是否自洽」，核不出「当时是不是这么写的」；mtime 也可被改写 | reviewer-qa 在 `fixtures/RECORD.md` 签「反向证据成立」与「oracle 定稿早于首跑」，并签签字人与日期（spec §3.4 / TC-046 / TC-061 ④b） |
| `expect` / `judge` 的合格性结论（该词该不该进用例） | 机器只做抽取与计数，判不了「这个禁词是不是错误推理专属」 | reviewer-qa 在 `expected.md` 人读区 / `RECORD.md` 签字，不得以「机器全过」代替（spec §3.4 禁词双向验证） |

## 6 不测（带理由）

| 不测什么 | 为什么 |
|---|---|
| 其余 17 个技能的用例 | R8 明确本轮只到 `review-triage` 两条用例；扩展判据：同一技能连续 ≥3 次真跑、全部 gate 用例 delta 达阈值且方向一致、无 flaky、预期已 `frozen`，才可选第二个不同任务族技能 |
| CI 门禁 / 提交前自动跑 | §8 列为不在这一轮；重复次数、阈值、成本承担都没定 |
| Trae CLI 引擎 | §8：官方限制仅企业旗舰版可用 |
| 自定义引擎适配层 | §8：本轮只测本机已验证的 claude_code |
| `agent_judge` 语义打分 | §8：贵且不稳，本轮全部用确定性判分 |
| skill-up 内部判分逻辑 | §3.3 明确 runner 不做判分；测它等于测外部依赖实现 |
| 模型本身的能力水平 | 本工装测「技能对模型有没有约束力」，差值才是指标 |
| 并发运行、多用户共享产物目录 | 产物目录固定为 `.session/eval/out/<技能名>/`，单机单人 |
| 网络/代理/转发层稳定性 | 属环境问题，发生时按 §3.3-6 归 `INVALID_ENV`，不产生独立用例 |
| 旧标量预期值格式的兼容路径 | spec §3.3-7 明确「读到旧 schema 或旧字段一律码 4，不做兼容」——兼容本身就是要被测掉的缺陷 |

## 7 缺口与判别力水位

| 缺口 | 漏检哪类反例 | 至少 1 个样例 | 语义由谁兜 |
|---|---|---|---|
| 关键词断言无法区分「实跑证据」与「复述 prompt」 | 回复里出现 `diff`、`字面核对`，但证据来自 prompt 里贴的 diff | `fixtures/responses/01-with-skill.correct.md`（自陈基于 prompt 的 diff 原文） | 主锚点（prompt 0 命中 + oracle ≥1 命中，闸门 ⑥）+ §5 人工读回复 |
| 禁词表误收正确回答可能出现的词（含否定式） | 「这不是低风险」在真跑里同样命中 `低风险` | TC-018 的 s3 | 禁词表只放错误推理专属词（§3.4）；不做否定豁免；正确样本改用正向表述 |
| L2 与真跑判分双口径 | L2 用豁免放行、工具按纯子串判 FAIL | TC-018 步骤③ / TC-058 的对照变体 | 匹配器纯子串、与工具同口径；主张豁免须先实测（§3.4） |
| 错误结论复用正确词表里的词 | 「语义迁移已在实跑中验证，可直接提交」命中理由词被判 PASS | TC-014 同类变体 | reviewer-qa 读理由句是否自洽 |
| 报告两个分母（run 数 vs 断言项数）混用 | 拿 `100% (3/3)` 冒充 run 级分母 | `fixtures/responses/flaky-evidence/out3-iteration-2-benchmark.json` | 对账按 run 级（TC-031） |
| n=2 的检出上限 | 两次一致被当成「已验证稳定」 | 单次失败概率 p 时检出率 = 2p(1−p) ≤ 50% | verdict.md 五要素 e（TC-036）+ §5 人读 |
| `undetermined` 的归因不可知 | 空 `passed` 究竟是环境失败还是工具 bug，runner 不知道 | TC-051 的构造数据 | 归 `undetermined` + 该臂未判定即 `INVALID_ENV`，不猜原因 |
| `frozen` 留痕与当前用例版本脱钩 | 改了断言仍挂着旧冻结核 → 把「用例坏了」报成「技能退化」 | TC-063 的合法/非法对照 | `frozen-ledger.json`（进 git）+ `assert_hash` 失效规则（§3.2.2③） |
| `anchors: []` 与「主锚点必须存在」的张力 | 声明空锚点可绕过 ⑥ | TC-012 步骤④ | 已写死：**该用例声明了 `context.git.apply_diff` 时** `anchors` 不得为空；**不以「`assert.must_contain` 含锚点串」为触发条件**（锚点串由 `anchors` 自己定义，会构成循环；spec §3.2.2 字段表）。`gate` 不单独强制；02 已声明 `apply_diff` → 其 `anchors` 不得为空（现为 `["check:all"]`）；`[]` 只对未声明 `apply_diff` 的用例合法。 |
| 人写的 oracle 与模型答案高度相似 | 哈希不同但实为改写 | TC-061 步骤③ | 人读 + 出处声明 |
| 只测一个技能 + 一种引擎/模型组合 | 换技能、换模型后的行为变化 | 本轮 claude_code + 经转发的 GLM | 结论边界五要素 + 换组合重跑，不靠单次外推 |
| 断言只覆盖两条用例 | 其他错误推理形态（如「历史记录所以免审」）没有禁词 | `skills/review-triage/SKILL.md` 常见错误表 | 扩用例时逐条补禁词并回 TC-046 重验 |
| 二维表 ③ 与 ④ 在「工具码 5 + 数据不完整」这一格曾重叠 | 同一格既能读成 2、也能读成 5，读者各挑一句 | TC-034 ④（无数据侧；有数据侧由 TC-077 覆盖） | **已闭合（spec §3.3-6 现行版）**：③ 明写「只覆盖工具码 ∈ {0,1,2,3,4}；表外码按 ④ 透传」，④ 写「透传优先于 ③」→ 该格唯一读法 = **5**；TC-034 ④ 与 TC-077 按此写判据 |
| A1 只核「记录是否自洽」，核不出「记录本身是事后编的」 | 造假者把样本、行号、命中词一起改成自洽的 | TC-070 ⑥c 只能拦「词不存在 / 行号越界」两种粗糙形态 | 人工签字（§5 后两行）+ `RECORD.md` 留签字人与日期；不要把它当成「A1 通过 = 留痕可信」 |
| probe 行可能同时出现 `verdict=INVALID_ENV` 与退出码 0 | 两个信号来自「行内判定」与「整轮退出码」两层，读日志的人只挑一个 | TC-071 ③ | 行内信号表示该 probe 用例数据不足，退出码 0 表示「没有 gate 结论受损」——两件事；判据取「码 0 + 行内信号在位」 |
| `CONTRACT.json` 本身可被手工伪造 | 人手写一份自洽的 `{schema, checked_at, exit:0, files:{…}}` 也能过闸门 ⑧，「改了判据 + 手改快照」这一组合整条绕过变更期闸门 | TC-078 只能拦「没重跑」与「哈希对不上」，拦不住「快照与文件一起被改」 | 人工核对 `RECORD.md` 里 A1 的执行记录与 `checked_at` 时间线（§5 新增一行）；根治见 §8 建议 14 |
| `flaky=未判定` 的三情形与 gate / probe 差异容易读漏 | 把「数据量不足」当成「观测一致」写 `否`（n=1 也称稳定）；或以为 `未判定` 只属 probe，让 gate 行继续写 `否` | TC-071 ①②③ | spec §3.3-7 已写死三情形：① 无任何 `benchmark.json`（`iteration=n/a`）② 该用例任一臂 determined=0 ③ **数据量不足**（迭代目录数 < `iteration_min`，或任一臂 determined < `iteration_min` 且 > 0）；三情形下该用例一律写 `flaky=未判定`——**gate 行同样写 `未判定`**（不写 `否`）并判 `INVALID_ENV` / 码 2，**probe 行只写行内信号、不改退出码** |
| 异常明细的**超时分支**没有独立的 signal token（类别 token 已闭合） | 实现把三支混写成一句「超时=是」，机器判不出「哪一支」；本文件只能按「含 `124` / `timed out` / 秒数」这类证据词判 | TC-086 三档 | **类别已闭合**：spec §3.3-7 写死五类 `detail-kind=` 枚举（`skipped-benchmark` / `unknown-config` / `undetermined-run` / `timeout` / `runtime-env-fail`），机器按 token 计数（TC-081~TC-086、TC-089~TC-092）；**三支归属仍需证据词自证**——spec 未给 `timeout-signal=` 值域（见 §8 建议 17 修订） |
| ④ 与 ③ 在「表外码 + unknown run」交叉格的 verdict 值 | ③ 的 fail-closed 与 ④ 的「有数据仍按 L1/L3」各有依据，`VALID` 与 `INVALID_ENV` 都能读出来，读者各挑一句 | TC-083 | 本条按 ④ 字面判 `VALID`（两臂数据完整、unknown 不进任一臂）；若议会裁定该格应 fail-closed，须同步改 spec（§8 建议 18） |
| 被跳过的 `benchmark.json` 所在目录算不算「参与判定」 | `iteration=2`（目录在）与 `n/a`（无有效数据）两种读法；它直接决定是否撞 `iteration_min` 闸门 | TC-081 a~e | spec 未写死；本条按「只数被采纳的目录」写（§8 建议 20） |

## 8 给开发的建议

| # | 位置（文件:行 / spec 节号） | 风险或盲点 | 为什么会被忽略 | 具体改法 | 优先级 |
|---|---|---|---|---|---|
| 1 | spec §3.3-6 / `scripts/run-eval.mjs` | flaky 判定的正确性完全取决于「枚举全部 `iteration-*` 并集」这一句，但没有任何结构约束挡住「只读 iteration-1」的实现——而那种实现在其余所有用例上都能通过 | 实现时先读到 `iteration-1` 就把数据用起来了，后面懒得再遍历；且它在健康运行里看起来完全正常 | 把 flaky 判定写成**只接受目录列表**的纯函数（入参是 `iterationDir[]`，不在函数内部 glob），并让 TC-047d/TC-052 直接调用它；同时 runner 输出里打印「本次参与判定的迭代目录数」，使 `iteration=<n>` 的来源可见 | P0 |
| 2 | spec §3.2.2⑤ / oracle 匹配器 | L2 用的匹配器若与 skill-up 判分口径不一致，会出现「开跑前通过、跑起来却被判失败」的双口径；该口径 = **纯子串**（官方文档「所列字符串均不能出现」），**没有否定豁免** | 两处分别实现、分别测试，看不出差异 | 把匹配器抽成纯函数模块供 `expected.md` 校验用；**真判分在外部二进制里，不得声称复用同一实现**；只用 TC-018 / TC-058 的对照样例双向锁住口径（否定式必须 FAIL） | P0 |
| 3 | spec §3.3-5⑥ / `validate` 与工具 dry-run | `validate` 和不存在的 fixture 路径都 exit 0（实测），所以「配置对不对」只能靠 runner 的闸门 ⑥；一旦有人图省事跳过 runner 直接调工具，路径错就静默放过 | 工具返回 0 看起来就是「配置没问题」 | 闸门 ⑥ 报错时打印**全部** resolve 后的路径与 `Test-Path` 结果（不只报第一个失败项），便于一眼看出是哪个路径错；TC-065 已按此写判据 | P0 |
| 4 | spec §3.3-7 verdict 行 | 行内字段一旦自由增减（如把百分比塞进来、把 `role` 省掉），下游一切机读判据失效；而人眼看「内容都在」不会觉得有问题 | 加字段比改文档容易，且不报错 | 在单测里对 verdict 行做**严格字段序正则**（§3.3-7 原文），任何多余字段或缺失字段即失败；TC-027/028 已按此写判据 | P0 |
| 5 | spec §3.2.2③ / `evals/<技能名>/frozen-ledger.json` | 留痕若与模型账同放 `.session/`（不进 git），清一次目录所有 frozen 用例立刻码 4；留痕不绑定用例版本则改断言后仍算 frozen → 把「用例坏了」报成「技能退化」 | 留痕是人类可读的小文件，看起来不需要契约 | 最小结构 `{eval_name, frozen_since, verified_at, arms_snapshot, delta_at_verify, assert_hash}` + 同落 `verified_snapshot`，`assert_hash` 与当前块不一致即失效（**已写进 §3.2.2③**）；TC-063 验「有没有 + 真不真」 | P1 |
| 6 | spec §3.3-6 `undetermined` | 该臂 determined = 0 时报 `INVALID_ENV`，但**退出码 2 与「工具退出 0」并存**：调用方看到工具成功、runner 却说环境不可用，容易误判成 runner bug（「工具退 0 但无产物」同样归此，已修正为码 2 + `INVALID_ENV`） | 两个信号来自不同层，读日志的人只挑一个看 | verdict 行在该情形必须同时带 `exit=0` 与 `verdict=INVALID_ENV`，stdout 加一行说明「工具成功但无确定数据」；TC-034⑤ / TC-051 已按此写判据 | P1 |
| 7 | spec §3.2.2 `anchors` | 旧规则未禁止 `anchors` 为空，但主锚点在断言里又是硬要求——`anchors: []` 可让核对 ⑥ 空转 | 空数组看起来「没配置就是没要求」 | **已落地**：声明 `context.git.apply_diff` 时 `anchors` 不得为空；不以断言词反推触发（防循环）；`gate` 不单独强制（02 已声明 `apply_diff` → `["check:all"]`；`[]` 只对未声明 `apply_diff` 的用例合法）；TC-012④ 由「仍通过」改为判失败 | 已修 |
| 8 | spec §4 步骤 7 / fixture 的 `plan.md` | fixture 的 `.md` 会被 `npm run check` 的 markdown 检查扫到（`MD_SKIP_DIRS` 不含 `evals/`），围栏/表格/BOM 任一不合规即全仓变红；而新增的 `oracle/*.md` 也在这个扫描面内 | 以为 fixture 与 oracle 是「测试素材」不进检查 | 施工时按 TC-024 的形态断言写这些文件（围栏配对、表格列数一致、LF 无 BOM）；md 计数按「开跑前基数 + 本次新增份数」逐份点清，不写死 | P1 |
| 9 | spec §3.1 / §3.4 / `fixtures/responses/` | responses 若被当成 oracle 或回归断言源，就退回自证循环；但 §3.4 又授权 A1 读它做「禁词双向留痕」复核——两处口径必须一致，否则实现者要么越界、要么让 §3.4 没有执行入口 | 现成样本最省事，而且旧稿那句「不参与任何机器判定」会让人以为连 A1 也不能读 | 在 `fixtures/responses/README` 与 `expected.md` 人读区**统一写一句**：「本目录不参与评测 verdict、不进 runner 判定链、不得充当 oracle；唯一授权机器用途 = `scripts/check-eval-contract.mjs` 按 `RECORD.md` 留痕复算」；TC-070 已按此写判据 | P1 |
| 10 | spec §2 R7 / `delta` | `delta.min` 的取值只有 02 一条用例校准过（1.0）；中间的取值（如 0.6）没有任何用例证明「能区分技能有无」，阈值可能形同虚设 | 1.0 这条用例过了，容易以为阈值机制已验证 | 下一技能启用时，先跑一次 `calibrated` 记录实测 delta 分布，再定 `delta.min`；把「阈值怎么定」写进 R8 的扩展判据（当前只写了「delta 达阈值」，没写阈值上限合理性） | P1 |
| 11 | spec §3.3-6 二维表 ③ / ④ | ③ 的「不论工具码」与 ④ 的「表外码原样透传」曾在「工具码 5 + 数据不完整」这一格重叠，同一格可读成 2 也可读成 5 | 两句在同一段、各自读都通；只有把两个条件交叉摆出来才看得见 | **已闭合**：spec 现在把 ③ 限定为「只覆盖工具码 ∈ {0,1,2,3,4」、表外码按 ④ 透传，并写明「透传优先于 ③」；本 testcase 统一按 **5** 写（无数据侧 = TC-034 ④、有数据侧 = TC-077），两种读法不再并存 | 已闭合 |
| 12 | spec §3.2.1 / §3.3-1 / `scripts/run-eval.mjs` + `scripts/check-eval-contract.mjs` | 路径解析散落多处：yaml 里五类路径（`skills[].path` / `cases.files` / `oracle` / `apply_diff` / `repo_fixture`）**同一基准 = `evals/`**，而 `CONTRACT.json` 的键是仓库根相对——两处口径不同，每个消费方各写一遍 → 三处实现、基准漂移，正是 S7 与第 9 轮 BE-9-02 的病根在实现层复现 | 每个文件里那段 `Join-Path` 看起来都很短、很无辜；而 `skills[].path` 改基准后，旧的「技能根单一辅助函数」不再覆盖它 | 抽两个纯函数放公共模块：`resolveFromEvalsDir(evalsDir, relPath)`（覆盖 yaml 的五类路径）与 `resolveFromRepoRoot(repoRoot, relPath)`（只服务 `CONTRACT.json` 键与 spawn cwd），并给出 `evalsDir = <eval.yaml 所在目录>/..`、`repoRoot = evalsDir/..` 的推导与「`evalsDir` 末级必须是 `evals`」断言；runner 与 A1 都 import；TC-069 的 ③④ 复算也调同一对函数，避免测试侧自造第三套 | P0 |
| 13 | spec §3.2.2③ / `frozen-ledger.json` | `assert_hash` 的覆盖范围（`assert` + `anchors` + `arms` + `delta`）只在正文写一次，生成又靠人手跑 `node -e`；漏掉 `anchors` 或 `arms` 时，改块后仍算 frozen | 哈希值本身永远合法，看不出「覆盖不全」 | 生成时把被 canonical 化的那份 JSON 原样落一行进 `RECORD.md`，使「覆盖范围」可肉眼核对；TC-074 的 c 档按此取证 | P1 |
| 14 | spec §3.4 / `evals/<技能名>/fixtures/CONTRACT.json` | 快照是**自报文件**：手工写一份自洽的 `{schema, checked_at, exit:0, files:{…}}` 也能过闸门 ⑧——「改了判据 + 手改快照」这一组合把变更期闸门整条绕过，而它看起来只是缓存 | 快照看起来是 A1 的产物，没人会想到它自己也需要可信来源；哈希值本身永远「合法」 | 给快照加一个**自校验字段**（如 `digest = sha256(canonical(files))`），runner 复算该 digest 而非只比对 `files` 里的条目；或把 A1 每次执行的命令与 `checked_at` 一并记进 `RECORD.md`，由人工核对时间线；TC-078 现按「四档篡改」取证，加 digest 后补一档「只改 files 不改 digest」 | P1 |
| 15 | spec §3.3-7（`flaky=未判定` 值域）/ §3.3-6 | **已闭合（spec §3.3-7 三情形）**。旧稿只列了前两种（无 `benchmark.json` / 某臂 determined=0），漏了第③种「数据量不足」——后果是 gate 在 n=1 或某臂 determined=1 时把 `flaky` 写成 `否`，把「只观测过一次」说成「两次一致」 | 两条分散在两节、各自读都通；只有把「n=1」「某臂 determined=1」「probe 数据不足」三个具体场景分别套进去才看得见 | spec §3.3-7 已补第③种情形（迭代目录数 < `iteration_min`，或任一臂 determined < `iteration_min` 且 > 0）：该用例 `flaky` 一律写 `未判定`，**gate 行也不写 `否`**，gate 随之 `INVALID_ENV` / 码 2；probe 行只写行内信号、不改退出码。TC-071 ①②③ 已按此写判据 | 已修 |
| 16 | spec §3.4（A1 写 `CONTRACT.json`）/ §3.3-1 / §4 步骤 3.5 与 9 | **A1 自己的 `repoRoot` 推导来源没写死**：spec 只规定 runner 用 §3.3-1 的 `repoRoot` 展开 `CONTRACT.json` 的键，未写 A1 是按脚本位置、cwd 还是参数推 `repoRoot`。后果：TC-070 ⑦ / TC-078 ⑦ 的「在**副本里**重跑 A1 刷新快照」这一步无法保证落在副本上——若 A1 恒按自身位置推导，刷新的是正本，副本的 `CONTRACT.json` 仍是旧的，⑦ 的放行档会误红（或误把「正本已刷新」当成「副本已刷新」） | 「A1 是离线脚本、跑一次就写快照」听起来不需要契约；而 runner 侧基准已写清，容易以为两侧同源 | 在 §3.4 或 §4 步骤 9 补一句「A1 的 `repoRoot` 推导 = 与 runner 同一个函数（`<eval.yaml 所在目录>/../..`，其中 `<eval.yaml 所在目录>/..` 的末级必须为 `evals`）」。**副本刷新路径**：A1 的用法只有 `[<技能名>] [--json] [--deep]`，**没有**副本根参数；故障注入副本的 `CONTRACT.json` 快照一律由用例侧**手工复算 sha256 写回**（TC-087 ③ / TC-088 ① 已按此写，删除了原先不存在的副本根参数说法）。**已明确**：A1 的 `repoRoot` 由 `evals/<技能名>/eval.yaml` 位置推导（§4 步骤 9 与 §3.3-1 同一条）；TC-070 ⑦ / TC-078 ⑦ 据此执行 | P1 |
| 17 | spec §3.3-7「异常明细」段 / `scripts/run-eval.mjs` | **类别词表已闭合，超时分支仍缺 token**：五类 `detail-kind=` 已写死（可机读计数），但「超时是哪一支」没有 `timeout-signal=` 之类值域——机器只能按 `124` / `timed out` / 秒数这类证据词判，等价措辞就会误红 | 写条文时觉得「指明三支之一」已经说清，没意识到「机器要判」还需要值域；人读两种写法都合格 | 在 §3.3-7 再补一行：`timeout-signal=session-result\|stderr\|wallclock`（与 `detail-kind=timeout` 同行）；TC-086 / TC-094 / TC-095 的判据即可由「证据词自证」收紧为「值域枚举」；在补齐前，本文件维持证据词判法，**不把等价措辞记为缺陷** | P1 |
| 18 | spec §3.3-6 二维表 ③×④ 交叉格 | 「工具码 5 + 存在 unknown run」交汇处：③ 要求 fail-closed，④ 说「有数据时仍按 L1/L3」，verdict 该写 `VALID` 还是 `INVALID_ENV` **没有逐字写死** | 两格分别读都自洽；只有把两个条件交叉摆到同一份数据上才看得见（这正是第 11 条修过一次的同一类问题） | 在 ④ 补一句「本交叉格的 verdict 按 L1/L3 计算（unknown run 不进任一臂）；若议会决定 fail-closed，改写为 `INVALID_ENV` 并同步 §3.3-6③ 与 TC-083」；TC-083 现按前者写 | P1 |
| 19 | spec §3.3-5⑥-4 / `scripts/run-eval.mjs` | `skills[]` 是复数，但条文只有 `skills[].path` 一句；实现很容易只查 `skills[0]`、或把空值当「没配置」跳过——两种都能跑通当前唯一一条技能的 yaml，问题要等第二个技能接入才暴露 | 当前仓库只有一条技能，单数实现与复数实现行为完全一致；空值看起来等于「没写」 | ⑥-4 改成「遍历 `skills[]` 每一项：**先按 YAML 解析取值**（不得按原文比较、不得把引号算进路径），空串 / `null` 视为不存在 → 码 4；存在但不含 `SKILL.md` → 码 4」，失败时打印**全部**越界项；TC-087 / TC-088 按此写 | P0 |
| 20 | spec §3.3-7 `iteration=<n\|n/a>` | 「被跳过的 `benchmark.json` 所在目录算不算参与判定」没写死：实现可写 `iteration=2`（目录在）或 `n/a`（无有效数据），而它直接决定是否撞 `iteration_min` | 两种读法都「说得通」，且坏产物是故障注入才出现的形态，健康运行里看不出差异 | 在 §3.3-7 明确「`iteration=n` 只数**有可解析 `benchmark.json` 且被采纳**的目录；文件在但被跳过 → 不计入；一个都不剩 → `n/a`」；TC-081 现按此写 | P1 |
| 21 | spec §3.3-7「异常明细」五类 | **五类的「命中判定」边界没写死**：①「坏产物被跳过」与 ⑤「无可用产物」在「文件根本不存在」这一格重叠（是「跳过」还是「无产物」）；② 同一 run 既 unknown 又 undetermined 时靠合并规则解决，但「工具码 4 + 数据不完整」该落 ③ 还是 ⑤ 只能从两句拼读 | 五类是按「读者能看懂」写的，不是按「判定函数怎么写」写的；单看每一类都自洽 | 在 §3.3-7 补一句判定顺序（建议：① 文件存在但不可解析 → ①；文件不存在 → ⑤。⑤ 只在 ①–④ 皆不命中时兜底），并明确「③ = 数据取码、⑤ = 明细类别」是两个维度、可同时成立；TC-089 / TC-097 现按此拼读结果写 | P1 |
