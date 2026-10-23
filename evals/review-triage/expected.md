# review-triage 预期值（试跑校准 · 冒烟口径）

> 口径声明：本轮数值为试跑校准（`origin: calibrated`），**首轮验收降级为冒烟/回归测试，不代表独立验证**。
> 阈值单源就是下面这个 JSON 块；其他任何地方不复述数值。
> 阈值来源留痕：本轮 `arms` / `delta` 为**声明值（未校准）**，具体来源见 `fixtures/RECORD.md`（Task 7 落）。
> `repo_fixture` 必须指向物化副本（`../.session/eval-fixture/review-triage/<repo-name>`，相对 `evals/` 目录），否则启动前校验 ⑥ 码 4。
> 禁词双向留痕见 `fixtures/RECORD.md`（Task 7 落）。

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

## 人工核对区（§5⑤ 相关签字项）

- [ ] oracle 01 满足 01 的 `expect` 全部词（`must_contain` 3/3 命中、`must_not_contain` 4/4 不命中）
- [ ] oracle 02 满足 02 的 `expect` 全部词（`must_contain` 2/2 命中、`must_not_contain` 4/4 不命中）
- [ ] 锚点 `notes/plan.md` 在 01 的 oracle 中命中、在 01 的 prompt 中 0 命中
- [ ] 两条用例的 `must_not_contain` 均不含分档标题
- [ ] 两条用例的 `judge.output_contains.all` 关键词均为 `expect` 已声明词的子集
- [ ] 两条用例的 `expect` / `judge` 只含 §3.2.1 键白名单里的键
- [ ] 同一 `eval.yaml` 内 `title` 唯一（两条不同）
- [ ] 正例证据词与负例禁令词齐备；禁词双向留痕在 `fixtures/RECORD.md` 且 A1 复核通过
