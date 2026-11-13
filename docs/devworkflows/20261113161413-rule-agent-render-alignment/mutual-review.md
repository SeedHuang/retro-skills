# spec ↔ testcase 互审账

> 对象：`docs/superpowers/specs/2026-11-13-rule-agent-render-alignment-design.md`、`...-design-testcase.md`、`...-design-testcase-diff.md`
> 参与：spec 作者（主 agent）、testcase 作者（senior-sdet）
> 规则：每轮双方各出结论；有分歧 → 改产物 → 下一轮复核；双方全 PASS 才收口。结果同步到 `gate-record.md` 的 ② 行。

## 轮次账

| 轮 | 起止 | spec 作者结论 | testcase 作者结论 | 分歧 | 处置 |
|---|---|---|---|---|---|
| 1 | 16:25:05~ | FAIL：TC-27/TC-16/TC-02+34/TC-24 需改；TC-04/21/43 已在第 1 轮前落地 | FAIL：5 条必须改（其中 3 条为改前文本的过期判断） | 2 条真实冲突 + 3 条过期判断 | 已改 testcase：TC-27/28 分离 registered/dormant preview；TC-16 改全签名 + MissingTestcase；TC-02/22/29/34 改派生计数；TC-24 改「改造后应满足」 |
| 2 | 16:25:05~ | 复核 7 项整改全部落地；新发现 TC-18 单参冲突、TC-26 冗余码 | FAIL：1 条必须改（TC-18）+ 1 条建议（TC-26） | 1 条真实冲突 | 已改 TC-18 为双参；TC-26 去掉「或 缺件」 |
| 3 | 16:25:05~ | PASS：TC-18/TC-26 已改，7 项残留形态全对 | PASS：仅读，未发现新问题 | 0 | 双方一致，互审收口；② 仍待议会 #2 |

## 第 1 轮明细

### spec 作者审 testcase

- **一致**：D1–D12 的 spec 决议与 testcase 主体覆盖方向一致；F1–F4/F6、D19、非目标均有对应 TC。
- **不一致（已改）**：
  1. TC-27 用 dormant `import-guard` 跑 preview，期望 0；与 spec D6「preview 只对 registered」冲突。
  2. TC-16 用 `validate(rule)` 单参并期望 `[]`；spec D3 要求 `validate(rule,{testcase,ruleIds})`，无 testcase 返回 `MissingTestcase`。
  3. TC-02/22/29/34 写死 `baseline 19/19`；spec D7 要求 `N = 18 + BASELINE_RULES.length`。
  4. TC-24 的「现状不满足」应改为「改造后应满足；现状不满足属 M3 实现项」。
- **已落地、无需改**：TC-04/21/43 的 3 处命令修正已在第 1 轮前落盘。

### testcase 作者审 spec

- **同意**：D1、D2、D3、D4、D5、D6、D7、D9、D10、D11、D12。
- **部分**：D8 的 gate 计数——spec 要求派生，但 TC-02/TC-34 仍写 19；已按 spec 改为派生。
- **真实冲突**：TC-27 preview、TC-16 签名/ MissingTestcase；已改。
- **过期判断**：TC-04/21/43 的 3 处修正已在文件中，作者第 1 轮引用改前文本；第 2 轮以当前文件复核。

## 第 2 轮（待跑）

- 复核口径：testcase 作者重读当前 testcase 第 80–123 行，逐条确认 5 条必须改已落地；spec 作者确认无新增分歧。
- 收口判据：双方均 PASS；否则继续改并开第 3 轮。

## 第 3 轮（复核，已收口）

- **testcase 作者**：TC-18 已双参（第 97 行）、TC-26 已唯一码（第 105 行）；TC-04/16/21/24/27/28/43 均为已修正形态；无新问题 → **PASS**。
- **spec 作者**：确认 spec §12 与 testcase 当前文本一致，无新增分歧 → **PASS**。
- **结论**：双方一致，互审收口。② 段仍差议会 #2（三方评审），不因互审替代。
