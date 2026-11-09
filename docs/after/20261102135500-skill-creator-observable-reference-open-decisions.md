# skill-creator 可观察判据引用缺口（未决）

> 状态：**未决（收编补丁，待触发时机）**；创建时刻 2026-11-02｜归属：本 PRD（`docs/prd/20261031202331-observable-criteria-rollout/index.md`）S3 的 F-10 第三处

## 现状

`skill-creator` 的实际载体在用户级目录：`C:\Users\HuangChunhua\.trae-cn\skills\skill-creator\SKILL.md`（**不在本仓、不进 git、无审计签字**）。它写 skill 时的判据质量不受本仓 `carrier-conventions` 的可观察判据约束，也无 `check-observable` 的机判面。

## 该做

在该全局 skill 的写作流程里加一行引用（**只引用、不复制判据**）：写 skill 判据句时跑 `scs check observable --check`，末行 `check-observable ok` 且 exit 0；词表与标记表唯一源 = 本仓 `tools/docgen/dsl/rules/vocab/observable-terms.json`（2026-11-08 起判定实现已由全局 CLI `scs` 提供，跨仓只需装 CLI、不再需要写绝对路径或分发清单）。

## 触发

本仓的可观察判据（`carrier-conventions` + `observable-terms.json`）被整体复制 / 分发到全局技能库，或 `skill-creator` 的下一次修订被用户明确指派时——两个事件任一发生即须补这一行引用。

## 谁兜

**用户**（全局目录的所有者）：改全局文件需用户授权；本 PRD 的验收**不要求**该全局文件被改（S3 spec §6.2 / D-9）。复核凭据 = 该文件的 `git`/编辑时间戳，或用户口头确认。
