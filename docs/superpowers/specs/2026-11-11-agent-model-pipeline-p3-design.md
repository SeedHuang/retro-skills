# P3 技术设计：建模 skill 化（agent-modeling）

> 来源：`docs/prd/20261111145723-agent-model-pipeline.md` §6 P3（行 190–218）、§7 验收
> 前序：P1（渲染隔离产物，commit `bc6cd59` 起）、P2（四维评估 + 单席复测，`92326ce`）
> 状态：待评审（本文件落盘后由独立 senior-sdet 出 testcase，再出实施计划）

## 1 目标与非目标

**目标**：把「markdown 卡面 → 模型 JSON → 渲染」这套拆解能力做成可复用 skill，产出草稿模型；同时把 P1 引擎从 `tmp/` 迁到稳定位置，消除临时目录依赖。

**非目标（本轮不做）**：

- 不写 `agents/**`（PRD:216 硬约束）；不改 `tools/docgen/builders/agents/**` 任何文件。
- 不迁移 11 席未建模卡（那是 P4）。
- 不新增模型字段、不改 7 张现模型的语义；迁移只改路径与 import，不改内容（`reviewer-audit` 的 `outputFormat` 已在 P2 v3 定稿）。

## 2 决策（含用户裁定）

| # | 决策 | 依据 |
|---|---|---|
| D1 | 引擎与模型迁到 `tools/docgen/builders/agent-model/`，`tmp/` 只留评测脚本与样本 | 用户 2026-11-11 裁定「彻底解决」；`tmp/` 是被 `.gitignore` 忽略、靠 force-add 维持的实验区，不宜做运行期依赖 |
| D2 | skill 脚本是**薄封装**：只 import 引擎，不复制任何渲染/校验逻辑 | carrier-conventions「判定实现唯一」；避免第二份真相 |
| D3 | 草稿与预览落 `skills/agent-modeling/drafts/`，且该目录不进 git | 用户 2026-11-11 选择；草稿是运行期产物，可随时重建 |
| D4 | 回放样本用 `reviewer-actuary`，判据是「展开后 JSON 与现模型逐字节相等」 | PRD:218 指定该席；等价性用展开结果比，不用渲染文本比（文本由 P1 已覆盖） |

## 3 迁移映射

| 现在 | 迁移后 | 说明 |
|---|---|---|
| `tmp/agent-criteria-demo/models/`（7 张 + `_shared-model.json` + `_baseline/`） | `tools/docgen/builders/agent-model/models/` | 原样搬，内容零改动 |
| `tmp/agent-criteria-demo/types/`（`base.mjs` / `derived.mjs` / `index.mjs`） | `tools/docgen/builders/agent-model/types/` | 原样搬 |
| `tmp/agent-criteria-demo/render/`（`index.mjs` / `sections.mjs`） | `tools/docgen/builders/agent-model/render/` | 搬后改 2 处 import 深度 |
| `tmp/agent-criteria-demo/verify-models.mjs` | `tools/docgen/builders/agent-model/verify-models.mjs` | 搬后改 1 处 import 深度；另加 2 个导出与 1 个可选参数（见 §4） |
| — | `skills/agent-modeling/**` | 新建，见 §5 |

`tmp/agent-criteria-demo/` 保留：`render-all.mjs`、`diff-report.mjs`、`test-p1.test.mjs`、`sandbox/`、`eval/`。这 4 个文件的 import 与模型路径改为指向新位置，行为不变。

## 4 引擎接口改动（唯一一处代码语义改动）

`verify-models.mjs` 现阶段只有 `expand()` 一个导出，CLI 与校验逻辑耦合在文件尾部（`verify-models.mjs:210-248`）。P3 需要 skill 能校验「任意一个模型文件」，因此：

- 导出 `verify(name, opts)`：新增可选参数 `opts = { modelPath, baseline = true }`。`modelPath` 缺省时仍取 `models/<name>-model.json`；`baseline:false` 时跳过 `_baseline` 比对（草稿没有基线）。
- 导出 `anyError(r)`：skill 用它判 exit code，不另写一份错误清单。
- 不改 CLI 行为：`node verify-models.mjs` 仍输出 7 行 `EQUIVALENT`、exit 0；任一码仍 exit 1（P1 spec S15）。
- `isMain` 判定保持原样（该文件在 `tools/`，不在技能守卫扫描面）。

## 5 skill 契约

```
skills/agent-modeling/
  SKILL.md                       入口：七阶流程表 + 触发条件 + 边界 + 指向 references/scripts 的指针
  references/
    grammar-gaps.md              八类语法部件、缺口四元组、四型断点、四态终止
    checks.md                    13 类校验码清单 + 每条的重现手法与修法指向
    model-schema.md              models/ 的键、extends / appliesWhen / 浅合并、展开顺序
    permissions.md               permissions 三维 + permissionGroups + 与 policy 的对应
  scripts/
    verify.mjs                   校验单个模型文件：展开 + 类型 + 权限 + 标题 + 可选等价比对
    render.mjs                   渲染单卡到 drafts/<seat>.md
  drafts/                        运行期产物（git 忽略）
```

**脚本接口**

| 命令 | 输出 | 退出码 |
|---|---|---|
| `node scripts/verify.mjs <model.json> [--ref <model.json>]` | 一行 `<seat> [<type>] EQUIVALENT` 或码串；带 `--ref` 时追加 `REF_EQUIVALENT` / `REF_DIFF:<path>` | 0 = 无码且（若给 ref）等价；否则 1 |
| `node scripts/render.mjs <model.json> [--out <dir>]` | `<seat> [<type>] <n> lines`，写 `<dir>/<seat>.md`（缺省 `drafts/`） | 0 = 渲染成功；1 = 抛错 |

两个脚本都从引擎取 `_shared-model.json`（默认 `../..` 之外的引擎目录，可用 `--shared` 覆盖）。

**SKILL.md 必含**（对齐 `scs check skills` ①–⑦ 与载体规范）：

1. frontmatter `name` / `description`（含触发语与「不用于」边界）。
2. 七阶流程表（P0 归位 → P6 收口），取自 `modeling-methodology.md:48-58`。
3. 触发条件与不触发条件。
4. 与渲染器的接口（两个脚本的命令行）。
5. 只写 `drafts/`、不写 `agents/` 的硬约束。
6. 每个 `references/*.md` 以「按 X 执行，做完产出 Y」的闭环写法被引用；所有引用路径真实存在。

## 6 回放验收

1. 把 `tools/docgen/builders/agent-model/models/reviewer-actuary-model.json` 复制成 `skills/agent-modeling/drafts/reviewer-actuary-model.json`。
2. `node skills/agent-modeling/scripts/verify.mjs skills/agent-modeling/drafts/reviewer-actuary-model.json --ref tools/docgen/builders/agent-model/models/reviewer-actuary-model.json` → 首行含 `EQUIVALENT` 与 `REF_EQUIVALENT`，exit 0。
3. `node skills/agent-modeling/scripts/render.mjs skills/agent-modeling/drafts/reviewer-actuary-model.json` → 产出 `drafts/reviewer-actuary.md`；与 `tmp/agent-criteria-demo/sandbox/reviewer-actuary.md` 逐字节相等（`Get-FileHash` 同值）。
4. 负例：把草稿的 `seat.tier` 改成非法值 → verify exit 1 且首行含 `TIER_MISMATCH`。

## 7 门禁（全部可执行）

| # | 命令 | 通过判据 |
|---|---|---|
| G1 | `cd tmp/agent-criteria-demo && node --test test-p1.test.mjs` | `pass 29`、`fail 0` |
| G2 | `cd tmp/agent-criteria-demo && node verify-models.mjs` | 7 行含 `EQUIVALENT`，exit 0 |
| G3 | `cd tmp/agent-criteria-demo && node render-all.mjs && node diff-report.mjs` | `sandbox/*.md` = 8 |
| G4 | `node skills/agent-modeling/scripts/verify.mjs ... --ref ...`（§6.2） | 首行含 `REF_EQUIVALENT`，exit 0 |
| G5 | `npm run check` | 末行 `check 全部通过`，exit 0 |
| G6 | `scs check skills --root d:\Seed\retro-skills --manifest skilldependencies/manifest.json --json` | `{"findings":[]}`，exit 0 |

## 8 风险与不做

| 风险 | 处置 |
|---|---|
| 移动后 P1 历史 spec 里的 `tmp/.../verify-models.mjs` 路径失效 | 历史 spec 是当期记录，不回改；本 spec §3 记录迁移映射，P3 报告给出新路径 |
| `test-p1.test.mjs` 深度依赖 `HERE/models` | 改 3 个常量（模型根、引擎根、copyCase 源目录），断言不动 |
| 新 skill 被 `npm run check` 的 markdown/技能守卫判红 | 先按 §5 写，跑 G5/G6，发现即修，不豁免 |
| `drafts/` 被提交 | 在根 `.gitignore` 加 `skills/agent-modeling/drafts/` |

**回滚**：迁移是一次性 `git mv`，回滚 = 反向 `git mv` + 还原 4 个引用文件；无数据变更。
