# 权限三维

## 三维

| 维 | 键 | 含义 | 取值来源 |
|---|---|---|---|
| 动作 | `permissions.action.allow` / `.forbid` | 本席能做什么（记录 / 自裁 / 裁决 / 中断 …） | 共享 `actions` 词表 |
| 写 | `permissions.write.allow` / `.forbidForms` | 可写哪些 artifact、哪些写形态禁止 | `forms` 的 artifact id + `form.*` |
| 命令 | `permissions.command.allow` / `.forbidForms` | 可跑哪些命令、哪些形态禁止 | `forms` 的 `cmd.*` + `form.*` |

`forbidForms` 是形态黑名单（`form.fs.write` / `form.env.prefix` 等），与 `allow` 并存。

## 与 policy 的关系（单一来源）

- 档位事实只在 `tools/docgen/builders/agents/policy/definitions/tiers.mjs`：`producer` / `command` / `readOnly` / …。
- `seat.tier` 必须是该席 policy 推导出的档位；不一致报 `TIER_MISMATCH`。
- 渲染出的 `tools:` 行直接取 `TIERS[seat.tier]`，模型里不写工具数组。
- 写范围必须等于 `seat.artifacts`（集合与顺序都一致），否则报 `WRITE_SCOPE_MISMATCH`。

## permissionGroups

共享 `permissionGroups` 把「禁止动作」映射到可观察信号：

```
{ label: <中文短语>, signal: <observable>, residual: <兜底说明> }
```

- 有 `signal`：可机判，`label` 里出现的动作词必须与 `signal` 的 op 对得上（否则 `TitleDrift`）。
- 只有 `residual`：明示「不判」，禁止用 `label` 冒充判据。
- 两者都没有：报 `PERM_UNOBSERVABLE`。

## 越界处置

`escalation.steps[]` 按序渲染为编号步骤，只认三种 `kind`：

| kind | 渲染 |
|---|---|
| `halt` | 「N. 停手。」 |
| `report` | 「N. 越权信息报<收件人>：<字段>。」 |
| `voidRound` | 「N. 本轮结论作废，报<收件人>。」 |

`escalation.report.fields` 必须是 `records[report.record].shape` 里存在的字段 id，缺一个即 `PATH_UNDEFINED` 同源错误。

## 做完核对

动权限前后各跑一次 `node scripts/verify.mjs <model>`（在技能目录下执行），产出：① 三维清单（action / write / command）；② 与 `seat.artifacts` 的集合对照（应完全相等）；③ 无 `TIER_MISMATCH` / `WRITE_SCOPE_MISMATCH` / `PERM_UNOBSERVABLE`。
