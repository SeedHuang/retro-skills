# S3 实施计划：卡片权限叙述改为登记 ID

> spec：`docs/superpowers/specs/2026-11-12-card-permission-prose-id-design.md`
> testcase：`docs/superpowers/specs/2026-11-12-card-permission-prose-id-design-testcase.md`（25 条：A8 / B4 / C4 / D4 / E5）
> 顺序：T0 记基线 → T1 登记表 → T2 加载与渲染 → T3 校验码 → T4 数据迁移 → T5 测试同步 → T6 门禁与记账
> 提交粒度：**T1–T5 一个原子提交**（T2 改渲染、T4 改数据，分开提交会出现「渲染器读新字段、数据还是旧字段」的中间态，HEAD 不可交付）

## T0 记录基线（不可省）

```powershell
$BASE = git rev-parse HEAD                      # 迁移前提交，T4/C02 用
$BASE | Set-Content .session/s3-base.txt        # gitignored，仅施工期用
git ls-tree -r HEAD --name-only agents | ForEach-Object { (Get-FileHash $_ -Algorithm SHA256).Hash + ' ' + $_ }
```

- 同时把 18 个 `renderSha256` 与 `fixtures/*.evidence.json` 对照一遍，确认起点一致（应为 `mismatch=[]`）。
- 产出的 sha 表存 `.session/`，C02 用它做「迁移前后逐字节」比对；**不要**把 18 个哈希写进长期测试。

## T1 登记表（1 新文件）

- 新建 `tools/docgen/builders/agents/policy/definitions/constraints.mjs`，7 条，id 与来源席：

| id | 来源 |
|---|---|
| `duty.default` | `shared.json` 的 `dutyConstraintDefault`（12 席引用） |
| `duty.observe` | `detective-observer` |
| `duty.host` | `speaker` |
| `duty.evidence` | `evidence-reader` |
| `duty.arch-defense` | `respondent-architect` |
| `duty.dev-defense` | `respondent-dev` |
| `duty.test-design` | `senior-sdet` |

- 文本**由脚本从 `$BASE` 版数据里拷贝**，不手打；写完立刻断言「登记表 7 条 text 与源值逐字相等」。
- 门禁：A02 的前半（`n=7`、id 合规、无重复文本）可跑；A03 待 T4 后才能全绿。

## T2 加载与渲染

- `components/seatLoader.mjs`：`card.duty.constraints` 原样透传（不做 `@` 展开）；`constraint` 不再支持 `@` 引用。
- `components/renderCard.mjs:92`：改 `if (d.constraints?.length) lines.push('约束：' + d.constraints.map(id => constraints[id].text).join('；'))`；**未知 id 不静默**——直接抛 `CONSTRAINT_ID_UNKNOWN`（与 T3 同码，避免渲染层另造文案）。
- `components/cardKeys.mjs` 及深校验：`duty` 子键白名单 `{trigger, action, constraints}`；越界交 T3 的 `CONSTRAINT_NOT_IDS`。
- `card-model/enums.mjs` 的 `SCAN_FIELDS`：**键名一律不动**（E05 要求键集与 `$BASE` 相同）；把 `duty.constraint` 这一键的**取值**改为「该席渲染后的约束行文本」（经登记表解析）。键名是历史名，在源码注释写明「= 卡面约束行文本面，已不是数据字段」。
- 门禁：此时 `agents/` 尚未迁移 → 本地会红，属预期；不许 `draft → replace`，T4 落地后必须自动转绿。

## T3 校验码（4 个，只进 `EXIT`）

- `components/validateAgentData.mjs`：
  - `EXIT` 表追加 `CONSTRAINT_NOT_IDS` / `CONSTRAINT_ID_UNKNOWN` / `CONSTRAINT_LIST_EMPTY` / `CONSTRAINT_TEXT_PERMISSION`（均 exit 1）。
  - 逐席：`duty` 出现 `constraint` 或白名单外子键 → `CONSTRAINT_NOT_IDS`；`constraints` 非数组/空 → `CONSTRAINT_LIST_EMPTY`；id 不在登记表 → `CONSTRAINT_ID_UNKNOWN`。
  - 登记表**全表**扫 `WRITE_DENIAL_PHRASES` → `CONSTRAINT_TEXT_PERMISSION`（G5）。
- **不碰** `CARD_MODEL_CODES`（36 键表，与 `S1_CODES`/PRD 联动）。
- 门禁：B01–B04 的负例夹具可跑（基线要先绿，故排在 T4 之后实跑）。

## T4 数据迁移（18 席 + shared.json）

- 脚本改 `tools/docgen/dsl/agents/seats/*.json`：`card.duty.constraint` → `card.duty.constraints: [id]`；12 席 `["duty.default"]`。
- 删 `shared.json` 的 `dutyConstraintDefault`（其余 3 键不动）。
- 写盘前逐席断言：`旧值（含 @ 展开） === 登记表文本`，不等即中止（I-4）。
- 门禁：
  - `node tools/docgen/builders/agents/cli.mjs gate` → `baseline 20/20` 且无 `Mismatch`；
  - `git diff --stat -- agents/` 必须为空（卡面 0 变化）。

## T5 测试同步与新用例

- 既有文件按字段改名同步（G4）：`card-model.test.mjs`、`card-render.test.mjs`、`sc-card-shape.test.mjs`、`s3-predicates.test.mjs`、`sa-data-layer.test.mjs`（shared.json 4 键 → 3 键）、`s2-card-rewrite.test.mjs`。
- 新建 `tools/docgen/builders/agents/test/s3-constraint-ids.test.mjs`，承载 25 条：
  - A 组 8 条（含 A08「全或无」）：读数据 + `$BASE` 对照；
  - B 组 4 条：副本注入 + 断言 `code=<指定码>`（先证基线 `code=` 空）；
  - C 组 4 条：C01/C04 常驻；**C02 一次性施工校验**——用 T0 的 sha 表比对，不写成依赖 git 的常驻测试；C03 常驻（对 `evidence.renderSha256`）；
  - D 组 4 条：仓副本 + `collectCardFindings()`，注入前基线必须 `codes=[]`；
  - E 组 5 条：E01/E02/E03/E05 常驻；E04 按 `卡面 0 变化` 字面串判记账。
- 门禁：`node --test tools/docgen/builders/agents/test/s3-constraint-ids.test.mjs` 全绿；单测总数相应增加，不删既有断言。

## T6 门禁与记账

1. `node tools/docgen/builders/agents/cli.mjs gate` → `baseline 20/20`。
2. `npm run check` → 末行 `check 全部通过`。
3. 新建 `.session/reviews/<本批>/impact-sheet.md`（按 `scope-sweep --json` 生成）→ `node scripts/scope-sweep.mjs --check` 为 `sweep ok`。
4. `docs/superpowers/reviews/2026-10-25-1723-s6-eval/capability-diff.md` 追加一节，锚串必须含 **`卡面 0 变化`**（E04）。
5. 原子提交 T1–T5 + 记账；提交后复跑 `npm run check`。

## 验收映射

| testcase | 落点 / 手段 |
|---|---|
| A01–A08 | `s3-constraint-ids.test.mjs` A 组（A03/A05 用 `$BASE`；A08 全或无） |
| B01–B04 | 同文件 B 组（`$env:TEMP` 副本注入，断言指定码） |
| C01/C03/C04 | 同文件 C 组；C02 一次性跑，结果进 impact-sheet |
| D01–D04 | 同文件 D 组（仓副本 + `collectCardFindings()`） |
| E01–E05 | T6 三步门禁实跑 + 记账锚串 |

## 回滚

删除 `constraints.mjs`、18 席恢复 `constraint`、`shared.json` 加回默认键、撤掉 4 码与渲染分支即可；**卡面自始至终不变**，回滚不需重出任何卡。
