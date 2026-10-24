# 技能行为评测工装：已停用（parking）

> **状态：已停用（2026-10-24 用户裁定）。** 本文不是待办，是**停车记录**——留着是为了「将来若重启，不必从零试」。
> **何时该搬走**：重启评测并重新产出校准值之后，把本文结论并入新的 spec，本文删除。

## 一、为什么停

精算师评审结论（2026-10-24）：「**降级——留作按需工具，取消流程地位**」。判据：

| 项 | 实测 / 推算 |
|---|---|
| 它改变过的项目决定 | **0 个**（全仓找不到「因评测结论而改变决定」的实例） |
| 一次合规结论（n=2）的成本 | 约 20 分钟、**约 95 万 tokens（推算：n=2 两轮合计 = 单迭代实测 46–49 万 × 2）**。原始 benchmark 在 `.session/eval/`，已随本次清理删除、不可复核 |
| 代码面 | 7 文件 / 2985 行（生产 1721 + 单测 1264） |
| 第二个技能（dev-workflow）的实测 | 4 用例只有 1 条有差，三次跑结果不一致 → 无可信信号 |
| 环境 | 全程 `unrecognized_model` → 按 harness 自己的口径应判 INVALID_ENV |

**根因不是工装写得不好，是「没有消费者」**：需要它回答的那个问题（技能对模型有没有约束力）在这一年里没出现过一次真实决策。

## 二、保留的校准值（重启时直接用，不必重跑校准）

原 `evals/review-triage/expected.md` 的机读块，逐字保留：

```json
{
  "schema": "eval-expectation/v2",
  "iteration_min": 2,
  "cases": [
    {
      "eval_name": "纯勾选改动应判为可直接提交",
      "role": "probe",
      "origin": "calibrated",
      "oracle": "review-triage/fixtures/oracle/01-checkbox-mechanical.md",
      "anchors": ["notes/plan.md"],
      "assert": {
        "must_contain": ["可直接提交", "git diff", "notes/plan.md"],
        "must_not_contain": ["纯文档", "低风险", "不涉及代码", "不影响代码"]
      },
      "arms": null,
      "delta": null
    },
    {
      "eval_name": "执行动作替换应判为必须 review",
      "role": "gate",
      "origin": "calibrated",
      "oracle": "review-triage/fixtures/oracle/02-command-swap-semantic.md",
      "anchors": ["check:all"],
      "assert": {
        "must_contain": ["必须 review", "机器判不了"],
        "must_not_contain": ["纯文档", "低风险", "不涉及代码", "不影响代码"]
      },
      "arms": {
        "with_skill": { "min_rate": 1.0, "max_rate": 1.0 },
        "without_skill": { "min_rate": 0.0, "max_rate": 0.0 }
      },
      "delta": { "min": 1.0 }
    }
  ]
}
```

其余原始材料**没有另存副本**——代码与取证记录都在 git 历史里，用删除前的最后一个提交 `b590f0d` 取回即可。

**前提（务必先核）**：① `b590f0d` 必须未被改写（rebase / squash / amend 都会让短哈希失效；本仓历史改写过）；② 它只覆盖**进过 git 的文件**——`.session/eval/{out,state,trial}` 是 gitignore 的运行产物，从来没进过 git，取不回。取回前先跑下面最后一条自检命令：**7 个脚本 + `evals/` 全套应全部列出；输出为空或报 `bad object` 即说明 `b590f0d` 已失效**。

```powershell
git show b590f0d:evals/review-triage/fixtures/RECORD.md      # 取证记录（禁词双向留痕、实测命令）
git show b590f0d:evals/review-triage/fixtures/CONTRACT.json  # 14 文件哈希快照
git show b590f0d:scripts/run-eval.mjs                        # 包装器（875 行）
git show b590f0d:scripts/check-eval-contract.mjs             # A1 契约核对（451 行）
git show b590f0d:scripts/eval-contract-core.mjs              # BANNED_KEYS 等共享常量
git ls-tree -r --name-only b590f0d -- evals/ scripts/ | Select-String eval
```

## 三、恢复条件（精算师给的「认输改判」判据，任一出现即可重启）

1. 出现 1 个实例：**评测结论与静态检查/议会评审相反，且事后证明评测对**；
2. 某高频技能在 `n ≥ 3` 下稳定复现 `delta ≥ 0.5` 且 `flaky = 否`；
3. 单次合规结论的成本降到 ≤ 1/3（约 30 万 token / 7 分钟）。

## 四、重启要重建什么（清单，防止漏件）

| 件 | 说明 |
|---|---|
| 7 个脚本 | `run-eval.mjs` / `run-eval-core.mjs` / `check-eval-contract.mjs` / `eval-contract-core.mjs` + 三个 `.test.mjs`（从 `b590f0d` 取回） |
| `evals/<技能>/` 四件套 | `eval.yaml`、`cases/*.yaml`、`expected.md`（本文第二节的 JSON 就是现成的）、`fixtures/{repos,oracle,RECORD.md,CONTRACT.json}` |
| 一条 npm script | `"eval:<技能>": "node scripts/run-eval.mjs <技能>"` |
| 一条本地路径（内含 5 个子目录） | `.session/eval/{fixture,out,state,trial,tmp}`（见 `rules/docs-convention.md` 的 `.session/` 封闭清单；若已从规则里删掉，需一并加回） |

## 五、停用当天顺手记下的两条遗留（重启时一起处理）

1. **两份互为反例的样本内容完全相同**：`fixtures/responses/01-with-skill.correct.md` 与 `01-with-skill.no-execution.md` 的 sha256 相同（`CONTRACT.json` 第 12-13 行），语义却相反——「no-execution」样本本该缺实跑证据。
2. **`unrecognized_model` 不会触发 INVALID_ENV**：`run-eval.mjs` 只把它打印到 stderr，没有映射到 verdict（原文约在 L695-708）。重启时应把它接进判定。
