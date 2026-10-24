# evals/：用 skill-up 做「装技能 vs 不装技能」的行为对比评测

> 这套东西回答一个问题：**这个技能装上之后，模型的行为真的变好了吗？**
> 做法是同一批用例跑两遍——一遍装技能（`with_skill`）、一遍不装（`without_skill`），比通过率与差值。
> 底层工具是外部 CLI **skill-up**；本目录的 `scripts/run-eval.mjs` 只是它的包装（加前置闸门与结论边界），不是替代品。

## 一、目录长什么样

```
evals/<技能名>/
  eval.yaml                 # 入口：指向技能目录、用例清单、判定配置
  cases/*.yaml              # 每条用例：prompt + 期望（must_contain / must_not_contain）+ judge
  expected.md               # 预期值单源（含机读块，A1 与 runner 都读它）
  fixtures/
    repos/                  # 夹具源仓库（纯文件、不带 .git），运行时被物化出去
    oracle/*.md             # 手写标准答案样本（判断言用，不参与评测运行）
    CONTRACT.json           # A1 自动生成的文件哈希快照，别手改
    RECORD.md               # 取证记录：每条结论配可复算的命令与真实输出
```

现有一份完整样例：`evals/review-triage/`。

## 二、两个命令

### 1）离线契约核对（不花模型调用，秒级）

```powershell
node scripts/check-eval-contract.mjs review-triage
# 输出：A1 契约核对：review-triage｜findings=0｜CONTRACT.json 已写入（14 个文件）
```

它做的是**结构体检**：yaml 字段、用例 id 与文件名是否一致、`judge` 的词是否都在 `expect` 里、路径基准对不对、夹具源在不在、`repo_fixture` 是否指向物化目录、`expected.md` 机读块与用例是否逐项相等、`RECORD.md` 是否在场……

**改了任何判据文件（用例 / expected.md / RECORD.md）都要重跑它**，否则 runner 的 ⑧ 闸门会拦下来（提示「文件已改但未重跑 A1」）。

### 2）跑评测

```powershell
# 只做前置校验 + 打印将要执行的命令，不调模型、不花钱
node scripts/run-eval.mjs review-triage --dry-run

# 真跑（默认 2 轮采样，用来看 flaky）
$env:SKILL_UP_BIN = 'D:\devtools\skillup\skill-up.exe'
$env:EVAL_MODEL_PROVIDER = 'DeepSeek'
$env:EVAL_MODEL_NAME = 'deepseek-flash'
node scripts/run-eval.mjs review-triage --iteration 2
```

`review-triage` 有快捷方式：`npm run eval:review-triage`（等价于 `node scripts/run-eval.mjs review-triage`）。

### 环境变量

| 变量 | 必填时机 | 作用 |
|---|---|---|
| `SKILL_UP_BIN` | 建议显式设 | skill-up 二进制路径；不设则从 PATH 找 `skill-up` |
| `EVAL_MODEL_PROVIDER` | **真跑必填**（dry-run 不需要） | 模型 provider，会填进 `eval.yaml` 的 `{provider}` 占位 |
| `EVAL_MODEL_NAME` | **真跑必填** | 模型名，填进 `{name}` 占位 |

### 退出码

| 码 | 含义 |
|---|---|
| 0 | 全过 |
| 1 | 用例判定未通过 |
| 2 | 环境不可用（缺二进制、缺模型变量） |
| 3 | 没有可用用例 |
| 4 | 配置或前置闸门不通过（产物目录已存在、CONTRACT 不一致、夹具缺失等） |

工具返回的非表内码（如 5）会**原样透传**，不吞。

## 三、产物落在哪（都不进 git）

| 位置 | 内容 | 什么时候删 |
|---|---|---|
| `.session/eval/out/<技能名>/iteration-N/` | 正式产物：`result.json`、`benchmark.json`、每条用例的 `grading.json` 与 agent 原始输出、脚本生成的 `verdict.md` | 随时可删，重跑即得 |
| `.session/eval/trial/` | 试跑与命令日志 | 随时可删 |
| `.session/eval/state/<技能名>.json` | 模型账（上次请求的 provider/name、实测 model） | 该技能评测收尾即删 |
| `.session/eval/fixture/<技能名>/` | 夹具物化副本（runner 每次先删后建） | 随时可删 |

⚠️ **`out/<技能名>/` 已存在时 runner 会拒绝运行**（防覆盖旧结论）。要重跑先删掉它：

```powershell
Remove-Item .session\eval\out\review-triage -Recurse -Force
```

## 四、给新技能加一份评测，要准备什么

1. **`evals/<技能名>/eval.yaml`**：`skills[].path` 必须写 `../skills/<技能名>`（相对 `evals/`）；`engine.model` 用 `{provider}` / `{name}` 占位，**不许写死模型名**。
2. **≥2 条用例**：`cases/<id>.yaml`，`id` 必须与文件名（去扩展名）逐字相同；`expect.must_contain` / `must_not_contain` 用块列表（不许行内数组）；`judge.success` 里的词必须是 `expect` 的子集。
3. **`expected.md`**：预期值单源，含一个机读 JSON 块（`iteration_min` 必须 ≥2）。
4. **`fixtures/RECORD.md`**：取证记录，缺它 A1 直接判红。
5. 需要真实仓库上下文的用例，把夹具放 `fixtures/repos/<仓库名>/`（纯文件、不带 `.git`），用例里写
   `context.repo_fixture: ../.session/eval/fixture/<技能名>/<仓库名>`，并配 `context.git.apply_diff`。
6. 跑 `node scripts/check-eval-contract.mjs <技能名>`，`findings=0` 之后才算能跑。

## 五、结论的边界（别把话说满）

- 脚本输出的 `flaky=否` **只在采样数 n 下成立**；`n=2` 时检出率上界 ≤ 50%，两次一致不等于已验证稳定。
- `actual_model=未确认` 时，只能声称「请求值是 X」，不能声称「实测就是 X」——本地 CLI 设置或网关可能覆盖命令行参数。
- 预期值带 `origin: calibrated` 的，是**试跑校准**，不是独立验证；首轮验收按冒烟/回归口径看。

## 六、相关文档

- 设计依据：`docs/superpowers/specs/2026-10-21-skill-eval-harness-design.md`（含 R1–R10 与退出码表）
- 用例与验收：同目录 `…-design-testcase.md`
- 取证记录：`evals/review-triage/fixtures/RECORD.md`
- skill-up 自身文档：用户级目录 `C:\Users\HuangChunhua\.retro-skills\skillup-docs\`
