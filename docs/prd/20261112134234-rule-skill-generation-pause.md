# rule / skill 文件生成暂停说明

> 状态：已定稿（用户 2026-11-12 决定，立即生效）｜类型：决策说明（非需求 PRD）
> 决定原文：「先暂停rule和skill的文件生成」（用户 2026-11-12 本次 session）
> 单一源：P3 / P4 状态与决策行在 `docs/prd/docgen-index.md` 的 §1 表与 D19；本文只展开执行边界，不另立状态、不重复维护
> 影响面：P3 `docgen-rule-generation.md`（rule 整文件生成扩容）、P4 `docgen-skill-generation.md`（skill 整文件生成）——两份均未创建

## 1 暂停范围

| 项 | 暂停（不做） | 仍照常（不受影响） |
|---|---|---|
| P3 rule 整文件生成扩容 | 不立项、不写 PRD、不产 rule 草稿、不扩 rule 六组合骨架 | 生成链照常服役：`tools/docgen/builders/rules` 与 `components/renderedAssets.mjs` 不删不改；`rules/*.md` 原文冻结（不重生成、不手改），gate 继续逐字节比对 |
| P4 skill 整文件生成 | 不立项、不写 PRD、不产 skill 草稿、不新增 skill 生成能力 | 没有可停的正文生成：`tools/docgen/builders/skills/` 仅 `.gitkeep`；`tools/docgen/dsl/skills/docs-placement.json` 属**判据检查**（`scripts/check-skill-criteria.mjs`），不是生成，照常 |
| agent 侧 | — | 不受本决定影响：18 席由 `tools/agent-model` 模型确定性渲染（P5 已切换），gate `agents 18/18` + `baseline 20/20` |
| 立项动作 | 不创建 `docs/prd/docgen-rule-generation.md`、`docs/prd/docgen-skill-generation.md` | — |

**判据（可机械核对）**：

```
docs/prd/docgen-rule-generation.md   → 不存在
docs/prd/docgen-skill-generation.md  → 不存在
docs/prd/docgen-index.md             → P3 / P4 状态列均为「暂停」
```

**现状核验（2026-11-12 实跑）**：

```
node tools/docgen/builders/agents/cli.mjs gate → agents 18/18 + baseline 20/20，exit 0
git ls-files tools/docgen/builders/skills      → 仅 .gitkeep（无 skill 正文生成实现）
git ls-files tools/docgen/builders/agent-model → 空（0 文件；新模型代码在顶层 tools/agent-model/）
```

baseline 20 = 18 张 agent 卡 + 2 条 rule（`components/baseline.mjs:9`）：`evidence-before-conclusion` 由 DSL 投影逐字节比对，`title-not-stronger-than-criterion` 只做存在性与行尾检查。

## 2 依据

- 用户 2026-11-12 指令原文（见抬头）。仓库未记录附加理由，本文不补写理由。
- 上一里程碑 P5（agent 卡模型化）已收口并经用户终签（`docs/prd/20261111145723-agent-model-pipeline.md:3`），暂停 P3 / P4 不影响已交付部分。

## 3 与既有约束的关系

| 约束 | 暂停期内的处理 |
|---|---|
| 生成物禁手改（`docs/prd/docgen-index.md` D6） | 不变：暂停期内 `rules/*.md` 冻结，不重生成、不手改；要改 rule 必须先恢复生成链并走 `generate --kind rule --name <id> --apply`（`builders/agents/cli.mjs:46-49`），否则 gate 判 `Mismatch` / `UnregisteredHandwritten` |
| 存量按需迁移、不追溯（D16） | P4 的收编依据随之悬置，不触发；D16 本身不改 |
| 「先暂停」= 非永久 | 重启条件与流程见 §4，不等同于取消 |

## 4 重启条件与流程

1. **触发**：用户另行指示（原话「先暂停」，未授权自动恢复）。
2. **流程**：改 `docs/prd/docgen-index.md` 的 P3 / P4 状态 → 撤销或改写 D19 → 按该索引 §4 评审规则起 PRD → 经评审后再动代码与草稿。
3. **拦截**：未获用户指示前，任何 session 不得启动 P3 / P4、不得代立 PRD；发现他人启动，按本文与 D19 拦截。

## 5 已定口径（2026-11-12 用户确认）

- **只停立项与新增生成，不冻结、不删除现有生成链**：`tools/docgen/builders/rules`、`components/renderedAssets.mjs`、`builders/agents` 一行代码不动。
- 理由（可核）：生成链与 `npm run check` 绑定——criteria-engine 的 `--engine` / `--projection` 指向 `builders/rules`（`scripts/check-all.mjs:529`），skill 判据检查直接 import 其 `schema.mjs`（`scripts/check-skill-criteria.mjs:7`）；冻结或删除会让门禁变红，而不是「更安静」。

## 6 失效与保留

- 重启或取消时：本文结论并入新 PRD，或由 `docs/prd/docgen-index.md` 的记录取代；按 `docs-placement`，`docs/prd/` 的文档被取代时原文保留（不搬、不改旧结论）。

## 7 取证锚

| 断言 | 锚 |
|---|---|
| 用户指令原文 | 用户 2026-11-12 本次 session 消息：「先暂停rule和skill的文件生成」 |
| 口径确认 | 用户 2026-11-12：「按这个口径更新文档」（skill 无生成可停 / rule 冻结不重生成 / agent 已用新模型与新渲染引擎） |
| 状态与决策 | `docs/prd/docgen-index.md` P3 / P4 行、D19、§6 变更记录 |
| 生成链仍在服役 | `node tools/docgen/builders/agents/cli.mjs gate` → `agents 18/18` + `baseline 20/20`，exit 0（2026-11-12 实跑） |
| skill 无正文生成 | `git ls-files tools/docgen/builders/skills` → 仅 `.gitkeep` |
| agent 已切新链 | `tools/docgen/builders/agents/cli.mjs:9` import `../../../agent-model/source.mjs`；`tools/agent-model/source.mjs:1-3`（旧 `agentData` / `triggerTable` / `seatLoader` 已退场） |
| 两份 PRD 未创建 | `Glob docs/prd/*.md` → 仅 `docgen-index.md`、`20261018214426-…`、`20261019093443-…`、`20261026205821-…`、`20261111145723-…` 与本文件 |
| 非目标一致 | `docs/prd/20261111145723-agent-model-pipeline.md:37`（rule / skill 正文生成「另行立项」已补「暂停」注） |
