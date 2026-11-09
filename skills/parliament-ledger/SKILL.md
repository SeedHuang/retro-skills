---
name: parliament-ledger
description: 议会评审的账本与产物模板集（问题卡、轮间核对单、交付审计表）。当议会评审要填这些表，或角色卡说「产出格式走 parliament-ledger」时使用。Do not use for 评审流程本身（走 parliament）。
---

# 议会账本（parliament-ledger）

## 它是什么

议会评审要交的三张表，每张一份模板。

## 指针

- 问题卡：`assets/issue-card.md`（评委席产出；同一文件含「观察记录」节，侦探用）
- 轮间核对单：`assets/round-check.md`（审计席每轮填，不过 = 下一轮不得开始）
- 交付审计表：`assets/delivery-audit.md`（审计席终局填，不过 = 不得宣布交付）

## 纪律

- 三份模板都是生成物：手改即红。要改，改数据源 `tools/docgen/builders/agents/components/outputFormats.mjs` 的 `docs` 字段，再跑 `node tools/docgen/builders/agents/ledger.mjs --apply`。
- 填表前先读对应文件；缺项、留空的后果写在各文件内。

## 边界

只提供模板，不定义评审流程。流程（谁在什么时点填哪张表）见 `parliament` 技能。
