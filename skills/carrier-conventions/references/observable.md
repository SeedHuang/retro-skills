# 判据的可观察形态

## 一句话

判据里写下的每一个评价，都要能被机器用一次退出码判死；判不死的，改写成能判的形式，或进豁免清单并写明「为什么它只能这样写」。

## 范围与不管什么

- 管：`rules/**/*.md` 与 `skills/**/*.md` 的**正文行**；标题行（`^#+ `）与围栏代码块内的行不参与。
- 不管：卡面与 `predicates` 面（归判据引擎）；`docs/` 等其它目录由各自规则管。
- **词表与标记表不在本文件**：唯一源是 `tools/docgen/dsl/rules/vocab/observable-terms.json`；本文件不复述任何词面或正则（复述即第二份真相）。

## 动作（三步）

1. 跑一次：`scs check observable --check`（等价 `npm run check:observable`）。
2. 看红：每条红给 `path:line` 与命中的词，并注明「所在最小语义块内没有任何可观察标记」。
3. 三选一处置（逐行，不许整文件放行）：
   - **改文案**：换成能被机器判死的表述（比较式 / 文件行号锚 / 退出码 / `diff` 结果 / 计数 / 空非空 / 带字面量的枚举）。优先这一档。
   - **已合格**：该行所在块本来就有上述可判形态 → 什么都不做（不要为它补豁免）。
   - **进豁免**：只有「术语引用 / 词表自身」才许留；每条写清「这是术语引用，不是评价」+ 该术语的出处。

## 六要素（一条判据的完整形状）

| 要素 | 要求 |
|---|---|
| 范围 | 管哪些文件 / 行；不管哪些 |
| 条件 | 什么时候触发（写或改哪类文件时） |
| 动作 | 极性与步骤：跑什么命令、看到什么算过 |
| 宾语 | 命中的是哪一行（一行一条，按行计） |
| 触发时机 | 写 / 改时、送审前、门禁哪一段 |
| 验证 | 一条可粘贴命令 + 目标值（末行 + 退出码） |

## 豁免清单

落点 `tools/docgen/dsl/rules/vocab/observable-exempt.json`，行级白名单，四字段齐：`path` / `contains` / `reason` / `reviewed`。

| 判据 | 怎么判 |
|---|---|
| 无未豁免命中 | `scs check observable --check` 末行 `check-observable ok`、exit 0 |
| 计数单源 | `--json` 的 `scanned` / `hits` / `exemptedLines` / `stale`；门禁只搬这四个数 |
| 豁免不空转 | `stale` 为 0（锚点在文件里 0 命中 = 该条已失效，删或改） |
| 豁免结构 | 四字段齐；同一文件内锚点唯一；`reviewed` 不早于 `2026-01-01` |
| 本文件自身 | 在 `skills/` 下也会被扫：必须 `hits = 0`，且不得新增豁免条目 |

结构错 = 校验器前置红、exit 2；锚点失效 = exit 1。

## 去哪查

| 要查什么 | 去哪 |
|---|---|
| 词表 / 标记表 / 正反例 | `tools/docgen/dsl/rules/vocab/observable-terms.json` |
| 豁免条目 | `tools/docgen/dsl/rules/vocab/observable-exempt.json` |
| 判定实现（唯一） | 公共 CLI `scs check observable`（源码在 `skill-common-script`；本仓只留数据与规则） |
| 门禁接入 | `scripts/check-all.mjs` 第 ⑦ 段（不可经 `CHECK_BYPASS` 旁路） |
