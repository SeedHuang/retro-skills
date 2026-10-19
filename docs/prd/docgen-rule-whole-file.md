# P1：一条 rule 的整文件生成（Docgen 首个完整功能）

> 状态：**已定稿（五席三轮评审通过，2026-10-18）**｜依赖：`docgen-index.md`（共享决策 D1–D18）
> 目标：用 `rules/spec-testcase-gate.md` 这条 rule，跑通「组件 → 模板 → 生成 → 守卫」的整文件链路；不做片段、不做 skill/agent、不做迁移。

## 1 为什么是这一份

v1/v2 两轮 PRD 评审说明：整文件模型、入口基线、规则类型三个模型靠文字定不清。本 PRD 把三者收进**一个可独立验收的最小功能**，用代码给答案；它不承诺整个体系，只承诺「一条 rule 能整文件生成并守住」。

## 2 范围

**做**：

- 目标 rule：`rules/spec-testcase-gate.md`（5 条判据 + 例外）；
- 组件、模板、内存渲染、比对、入口基线、验收 V1–V11；
- 生成物随源进 git、落原路径（D15）；**本份只验证「可由源逐字节重建」，不实现写回命令——写回在 P2**；
- 叙述写在组件字面量格 / JSDoc；生成物禁手改。

**不做**（本份边界）：

- spec 片段 / region（D18）、spec 参与生成；
- skill / agent 模板、description / 触发表（P2）；
- 跨组件引用语法、预算类断言（P2）；
- 存量迁移与迁移后的同步（P3）；
- **目标文件的一次性修复**：目标文件 L60 的「（PRD 的 S4）」指向已删除 PRD，登记为 P3 盘点项；本份不改目标文件（P1-4）。

## 3 本份决策

| # | 决策 | 依据 |
|---|---|---|
| P1-1 | 目标 rule 类型 = **条件触发 × 义务**；v1 只做枚举校验 + 5 格义务模板 | `rule-inspector` 判据（适用方式 × 极性） |
| P1-2 | 入口基线 = 冻结 `rules/*.md` 的 21 条路径；**baseline.json 由组件常量派生，禁止手改** | 最小可验；manifest 留到 P2 |
| P1-3 | 基线内文件允许存在、不比对内容；基线外新增 `rules/*.md` = 红 | 入口强制的牙齿 |
| P1-4 | golden 锁定：`git hash-object rules/spec-testcase-gate.md` + SHA256 写成常量；施工期该文件 diff 必须为空 | 防止「改目标文件迁就模板」的假绿 |
| P1-5 | 模板 v1 只服务本目标 rule；核心判据表是三列，整文件另有 8 个 H2 节，逐节建模 | 与目标文件真实结构一致 |

**P1-1 的值集与判定**：

- 适用方式合法值：`sustained`（持续适用）/ `conditional`（条件触发）/ `mode-gated`（模式门控）；
- 极性合法值：`obligation`（义务）/ `prohibition`（禁令）；
- 本份目标 = `{ applicability: 'conditional', polarity: 'obligation' }`；
- 极性按四要素「动作」句判定；目标规则中的「不得送议会」是义务的派生后果，不单列极性；
- **本份只承诺「枚举校验 + 5 格义务模板」**；六种组合各自的骨架（如「持续适用 × 义务」无触发时机节）属 P2，本份不验。

## 4 接口

- CLI：`node tools/docgen-spike/run.mjs [--case <V1..V11>] [--gate] [--template <path>] [--target <path>] [--fixture <path>] [--out <path>] [--baseline <path>] [--raw]`。
- **省略 `--case` = 跑全部**；每例输出 PASS/FAIL，最后输出汇总。
- **断言模式（默认）**：用例内部断言「期望的失败」；符合预期即 `PASS` + 退出 0；全部通过 → 整轮退出 0。
- **`--gate`**：入口基线校验 + 对 target 的内存重建与逐字节比对（复用 V1），供 `npm run check` 调用；不跑用例前置。
- **`--template` / `--target`**：默认用仓库内文件；**覆盖只接受 `.tmp-test/**`**，用于 V8/V10b/V11 的故障注入。
- **退出码**：`0` 全绿 / `1` 有用例未达预期 / `2` 环境或基线前置失败（`EnvironmentEOL` 与 baseline 类错误）/ `3` IO 或依赖失败。
- **触发模式 `--raw`**：错误原文冒泡、固定退出 `2`；仅供人工复现，自动化只认断言模式。
- **比较**：只做 `Buffer.compare`，不 trim、不按行、不做 EOL 归一；`line` = 首个差异字节所在行（1 起），`byte` = 绝对字节偏移（0 起）。
- **`render()` 必须是纯函数**：只吃数据，**禁止读取 target 文件**；`run.mjs` 用 `fs` 读取探针记录 render 期间的读取路径，命中 target 即 `ImpureRender`。
- **写入白名单**：`tools/docgen-spike/**`（含 `.tmp-test/`）与 `rules/tmp-new-rule.md`（V4 与 V10 各自在本用例内创建、用例结束删除）；`--out` 只接受 `tools/docgen-spike/.tmp-test/**`，越界即 `InvalidOutputPath`。
- **临时目录**：固定 `tools/docgen-spike/.tmp-test/`（进 `.gitignore`）；每例用独立子目录 `V<n>/`。
- **清理三处**：启动只清 `tools/docgen-spike/.tmp-test/` 残留 / 每例 `try/finally` 清本用例临时文件（含 `rules/tmp-new-rule.md`）/ `process.on('exit')` 兜底；禁止 `process.exit()`。
- **每条用例后置断言**：`git status --short rules/` 为空（V4/V10 仅在其用例内允许 `rules/tmp-new-rule.md` 存在）、target 与模板的 SHA256 前后一致。

### 4.1 数据形状、fixture 与寻址

- 组件导出纯数据 `buildData()`：`{ applicability, polarity, sections: {...}, criteria: [{ id, no, name, pass }], ... }`；`render(data)` 只吃这份数据。
- `slot` 命名 = `<section>.<条目>.<列>`，例：`criteria.<name>.pass`；报错必须带这个 id。
- `--fixture` = 对 `buildData()` 的 **JSON 浅覆盖**（只覆盖数据，不含逻辑、不含表达式）；不传则用默认数据。
- 模板占位符只允许 `{{key}}`（单层、无表达式）；`key` 必须在数据形状中声明；未闭合或白名单外语法 → `TemplateSyntaxError`（带 `line`）。
- 模板 `rule.md.tpl` v1 **只服务本目标 rule**；通用 rule 模板在 P2/P3 再验。
- **环境检查对象 = 当前输入角色**（`--target` / `--template` / `--baseline` 指向的文件）；`.tmp-test/` 下作为**比对对象**的 generated 副本不做环境前置，直接进入 `Buffer.compare`。

## 5 错误码

| 码 | 触发条件 | 必带字段 |
|---|---|---|
| `MissingSlot` | 格子为空 / 纯空白 / `TODO` | `slot` |
| `MissingPlaceholder` | 模板占位符在渲染数据中无对应键 | `key` |
| `InvalidRuleType` | `applicability` / `polarity` 缺失或不在 P1-1 的值集内 | `field`、`value` |
| `TemplateSyntaxError` | 模板出现白名单外的 `{{` 语法 / 未闭合 | `line` |
| `TemplateHardcoded` | 模板包含目标文件 ≥20 字的特征原文（V6） | `snippet` |
| `ImpureRender` | render 期间读取了 target 文件 | `path` |
| `UnregisteredHandwritten` | 基线外新增 `rules/*.md` | `path` |
| `InvalidBaseline` | baseline 文件缺失 / JSON 损坏 / 非数组 / 空数组 / 条目重复 | `path` |
| `InvalidBaselinePath` | baseline 路径含 `..` 或反斜杠、或不是 `rules/*.md` | `path` |
| `DanglingBaselineEntry` | baseline 条目指向不存在的文件 | `path` |
| `BaselineDrift` | baseline 比组件常量 `BASELINE_RULES` 少条目（缺项）；多出的条目由 `InvalidBaseline`（重复）/ `DanglingBaselineEntry`（不存在）先行拦截 | `path` |
| `GeneratedMissing` | 待比对生成物不存在 | `path` |
| `InvalidOutputPath` | `--out` 越出 `.tmp-test/` | `path` |
| `TemplateReadFailed` | 模板读取失败 | `path` |
| `WriteFailed` | 写盘失败 | `path`、`errno` |
| `Mismatch` | 逐字节不一致 | `line`、`byte` |
| `EnvironmentEOL` | 当前输入角色含 CR、BOM 或非 UTF-8 | `path`、`violation` |

**判定顺序**（只报第一个）：`InvalidBaseline`（结构）→ `InvalidBaselinePath` → `DanglingBaselineEntry` → `BaselineDrift` → `UnregisteredHandwritten`。

## 6 验收（V1–V11，缺一不算过）

**通用前置**（V1–V9、V11 每例开始前检查）：`rules/` 恰 21 个 `.md`；target 为 LF + UTF-8 无 BOM；`tools/docgen-spike/.tmp-test/<case>/` 不存在；`rules/tmp-new-rule.md` 不存在。**V4/V10 例外**：各自在本用例内创建 `rules/tmp-new-rule.md`，用例结束删除。

| # | 场景 | 动作 | 预期 |
|---|---|---|---|
| V1 | 正常渲染（内存） | `render(buildData())` 与 target 做 `Buffer.compare` | 逐字节一致；不写盘；报告打印「baseline 21/21」 |
| V2 | 手改生成物（副本） | 渲染到 `.tmp-test/V2/generated.md`，固定位置改 1 字节后比对 | `Mismatch`，带首个差异 `line` / `byte`；target 不变 |
| V2b | 行尾归一化 | 渲染到 `.tmp-test/V2b/generated.md`，中部一个 `\n` 换成 `\r\n` 后比对 | `Mismatch`（证明实现没有做 EOL 归一） |
| V3 | 漏格（数据） | 克隆数据，按内容定位第 3 条判据的 `pass`，依次设为 `''` / `'   '` / `'TODO'` | `MissingSlot`，`slot` 指向该格；不产出文件 |
| V4 | 基线外新手写 | 新建 `rules/tmp-new-rule.md` | `UnregisteredHandwritten` + `path`；用例结束文件不存在 |
| V5 | 类型非法 | `polarity: 'ban'` 与 `applicability: 'sometimes'` 各一次 | `InvalidRuleType` + `field` / `value` |
| V6 | 纯度与数据驱动 | ① 用例在 `.tmp-test/V6/impureStub.mjs` 写一个故意读 target 的 render 替身，注入探针；② 取 target 三段 ≥20 字特征串查模板；③ 数据增删一条判据 | ① `ImpureRender` + `path`；② 模板均不含；③ 输出同步增删 |
| V7 | baseline 自校验与边界 | 复制 `tools/docgen-spike/baseline.json` 到 `.tmp-test/V7/baseline.json`，用 `--baseline` 指向后：删一条；加一条已存在的路径；加一条不存在的路径；置空数组；含 `..` / 反斜杠 | 删一条 → `BaselineDrift`；加重复 → `InvalidBaseline`；加不存在 → `DanglingBaselineEntry`；置空 → `InvalidBaseline`；后两者 → `InvalidBaselinePath` |
| V8 | 环境 | 模板复制到 `.tmp-test/V8/rule.md.tpl` 并 CRLF 化，用 `--template` 指向；target 复制后加 `\r` / BOM，用 `--target` 指向 | `EnvironmentEOL` + `path` / `violation`；模板与 target 本体 SHA256 不变 |
| V9 | 可复跑 | 连跑两遍全部用例 | 两遍结果逐字一致；`git status --short rules/` 与 `git status --short tools/docgen-spike/` 为空；无 `.tmp-test/` 残留 |
| V10 | 门接线 | V10 自建 `rules/tmp-new-rule.md` → 跑 `npm run check` → 删除 | 退出非 0，输出含 `UnregisteredHandwritten` |
| V10b | 门的比对能力 | target 复制到 `.tmp-test/V10b/target.md` 改 1 个可打印 ASCII 字节（如 `x`），用 `--target` 跑 `--gate`；再在干净树跑 `npm run check` | 前者 `Mismatch`；后者退出 0 |
| V11 | 错误码补齐 | `{{unknownKey}}`；未闭合 `{{`；比对不存在的生成物；`--out rules/x.md`；`--template tools/docgen-spike/.tmp-test/V11/nope.tpl`；`--out` 指向一个目录 | 依次 `MissingPlaceholder` / `TemplateSyntaxError` / `GeneratedMissing` / `InvalidOutputPath` / `TemplateReadFailed` / `WriteFailed`，必带字段非空 |

V2/V2b/V3/V6/V7/V8/V10b/V11 只操作 `.tmp-test/` 副本或内存数据，**禁止触碰 target 与模板本体**；V4/V10 的临时文件由每例 `try/finally` 与退出钩子删除（启动清残留不碰 `rules/tmp-new-rule.md`）。

## 7 交付物

1. 组件 `tools/docgen-spike/specTestCaseGate.mjs`（含 `buildData()` 与 `BASELINE_RULES` 常量）；
2. 模板 `tools/docgen-spike/rule.md.tpl`；
3. 比对 `tools/docgen-spike/compare.mjs`；
4. 基线 `tools/docgen-spike/baseline.json`（21 条，由 `BASELINE_RULES` 渲染，不手改）；
5. 编排 `tools/docgen-spike/run.mjs`（跑 V1–V11 并输出报告）；
6. **门接线（临时）**：`scripts/check-all.mjs` 增加一条 `node tools/docgen-spike/run.mjs --gate`；P2 重写时替换为正式实现；
7. fixture `tools/docgen-spike/fixtures/*.json`（V5 / V7 / V11 的覆盖数据）；
8. `.gitattributes`：`* text=auto eol=lf`、`*.md text eol=lf`、`*.mjs text eol=lf`、`*.tpl text eol=lf`、`*.json text eol=lf`；
9. 本 PRD 拆出的 spec + 独立 testcase（spec 评审时齐）。

> Spike 代码不进正式管线；P2 前按结论重写。fixture 与 baseline 保留。

## 8 退出与下一份

- V1–V11 全绿 → 填下表并写回 `docgen-index.md` 的 P1 状态（**验证通过**），P2 才可开工。

| 模型 | 结论 | 证据用例 | 对 P2 的约束 |
|---|---|---|---|
| 整文件 | **成立**（2026-10-18） | V1、V2b、V6、V9 | 模板不得复述判据原文；render 只吃数据 |
| 入口基线 | **成立**（2026-10-18） | V4、V7、V10、V10b | baseline 必须由组件常量派生；门必须含重建比对 |
| 规则类型 | **成立（仅枚举 + 5 格模板）；六骨架未涉及**（2026-10-18） | V5、P1-1 | P2 必须交付六骨架并逐组合渲染验收 |

> 验证记录（2026-10-18）：`node tools/docgen-spike/run.mjs` → **13/13 PASS**；`node tools/docgen-spike/run.mjs --gate` → `baseline 21/21`；`npm run check` → **357 tests（347 pass / 10 skip）/ 0 findings / 190 文件 / 586 表 / exit 0**。

- 任一红 → 修 P1 或停；不得以「先做 P2」绕过。
- 停损：同一红项修复 2 次仍红 → 停止，写复盘；**环境或基线红（`EnvironmentEOL`、baseline 类错误）不计入停损，先修环境**。
- 写回命令不在本份范围；P2 实现。

## 9 与 spec / testcase 的关系

本 PRD 不直接产生 testcase。由它拆出的 spec 必须同批产出独立 testcase（`spec-testcase-gate` 规则判据 1–5），否则 spec 不算定稿、不得进 plan。

## 10 Spec 路线图

> 拆分日期：2026-10-18｜依据：`prd-to-specs` 六规则｜本 PRD 只切一个 spec

| Spec | 文件 | 边界一句话 | 依赖 | 验收锚点 |
|---|---|---|---|---|
| S1 | `docs/superpowers/specs/2026-10-18-docgen-rule-whole-file-design.md` | 组件 / 模板 / 比对 / baseline / gate + V1–V11 的实现设计 | 无（本仓首个 docgen spec） | §4 接口、§5 错误码、§6 V1–V11、§8 模型结论 |

- **为什么只切一个**：P1 本身已是最小垂直切片；再切会把「渲染 / 比对 / 基线 / 门」拆成互相等文档的空依赖（违反 `prd-to-specs` 六规则的依赖 DAG 与规模上限）。
- **shared 候选**：无。唯一候选（rule 数据模型）只被本 spec 引用，按 JIT 门不提为 shared。
- **开放问题**：无阻塞项；D18 的确认原话/轮次待补，不影响本 spec。
- **testcase**：S1 的 testcase 与 spec 同批产出，命名按 `spec-testcase-gate` 判据 1。

