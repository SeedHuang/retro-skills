# 开发工作流主干 S1：测试落地方案（sdet 独立稿）

> 编写者 / 独立性声明：本文由 `senior-sdet` 在独立上下文编写，作者不是 spec 作者、不是施工者；只读 spec v5、testcase（79 条）与当前仓库实现，未参与任何业务代码/spec 修改。
> 输入：`docs/superpowers/specs/2026-10-24-dev-workflow-skeleton-design.md`（v5）、`...-design-testcase.md`、主 agent 计划 `2026-10-24-dev-workflow-skeleton.md`
> 状态：第 1 轮互测已回填（§3.1），第 2 轮复检完成（§3.2：2 条仍未闭合）
> 判据来源：所有「实测」均为读文件所得，标注 `文件:行`；本轮无命令执行权，未跑任何命令。

## §0 四条口径（先定，后文全部按它落）

1. **全量门口径**：`npm run check` = `node --test **/*.test.mjs`（全仓 glob，见 [check-all.mjs:68-73](file:///d:/Seed/retro-skills/scripts/check-all.mjs#L68-L73)）→ **任何新测试文件一落盘就进全量门**，不存在「先放着以后再接」。
2. **gate 只读**：`cmdGenerate`/`cmdGate` 只比对不写盘（[cli.mjs:41-77](file:///d:/Seed/retro-skills/tools/docgen/cli.mjs#L41-L77)），可安全当断言用。
3. **可注入隔离位**（决定「要不要副本仓」）：`DOCGEN_STATE_PATH`（[state.mjs:7](file:///d:/Seed/retro-skills/tools/docgen/state.mjs#L7)）、`DOCGEN_EVIDENCE_DIR`（[evidence.mjs:8](file:///d:/Seed/retro-skills/tools/docgen/evidence.mjs#L8)）、`DOCGEN_DRAFTS_DIR`（[cli.mjs:166](file:///d:/Seed/retro-skills/tools/docgen/cli.mjs#L166)）；`DOCGEN_RULES_DIR`/`DOCGEN_AGENTS_DIR` **只改扫描目录、不改存在性检查**（[cli.mjs:90-120](file:///d:/Seed/retro-skills/tools/docgen/cli.mjs#L90-L120)）。
4. **计数口径**：按 testcase §1 覆盖总表逐行标记重数，为 **正 34 / 负 35 / 边界 10 = 79**，与 testcase 文件头 L6「正 34 / 负 35 / 边 10」一致（A 14 正；B 11 正 + 1 边界 = L56 B09；C 5 正 + 5 负 + 1 边界 = L68 C09；D 4 正 + 4 负 + 1 边界 = L75 D05；E 26 负 + 7 边界 = L82/90/95/96/97/98/102）。**订正**：本文上一版写「负 36 / 边界 9」是**本方数错**，错因 = 把 L102 的 `TC-E23 | … | 边界` 计进了负例；testcase 各行的「类型」列与文件头计数**无一处不符**，testcase 无需改动。

## §1 79 → 断言映射表

按组给统一落点，例外单列。**「可绿时点」= 该文件落地后第一次能全绿的施工节点**（T1–T10 沿用主 agent 计划编号）。

| 用例 | 落点文件 | 断言形态 | 可绿时点 | 跑什么命令 |
|---|---|---|---|---|
| TC-A07（+ A01 的规则文件一项） | `tools/docgen/test/dev-workflow-rule.test.mjs`（新） | 纯 fs 读 + 正则：五段标题、R1–R7 计数、例外节三段要素、验证节两条命令 | T1 | `node --test tools/docgen/test/dev-workflow-rule.test.mjs` |
| TC-A01～A06、A08、A09、A11～A14 | `tools/docgen/test/dev-workflow-files.test.mjs`（新） | 纯 fs 读 + 表格解析：A02 目录枚举恰 7 份（双向）、A04 与 PRD §4 三列逐格 diff、A05/A08 逐份小节约数、A11/A13/A14 正则 | T3（依赖 SKILL.md + 7 份 references） | `node --test tools/docgen/test/dev-workflow-files.test.mjs` |
| **TC-A10（例外·人工）** | 不落测试文件 | `Test-Path` 两行 + `aas` 体检输出；**谁判**：施工者；**看什么**：`需建链接 0` 的整行；**判据**：0 且两路径 True | T8 | PowerShell 手工（spec V-12 已声明「本机验，不进 `npm run check`」） |
| TC-B01～B05、B08～B12 | `tools/docgen/test/evidence-reader.test.mjs`（新） | B01 同进程 `renderByName` 比字节；B02/B03/B05/B10/B11 读卡 + 正则；B04 读 `outputFormats`/`patternRegistry` 集合；B09/B12 纯函数 `validateAgentData`（`structuredClone` 注入） | T3（B12 需 T2 的 C5） | `node --test tools/docgen/test/evidence-reader.test.mjs` |
| TC-B06、B07 | `tools/docgen/test/dev-workflow-registry.test.mjs`（新） | B06 `spawnSync` `check-agents`（读真实 state）；B07 读 `rules/.inspector-annotations.json` 十键（格式 `name:key`，见该文件 L5/L96-104） | T4 | `node --test tools/docgen/test/dev-workflow-registry.test.mjs` |
| TC-C01、C02、C09 | 就地改 `tools/docgen/test/check-baseline.test.mjs` | C01/C02 派生后断言（现有 L30/L36 即这两条的原型）；C09 → **临时副本**（见 §2） | C01/C02：T5；C09：T5 | `node --test tools/docgen/test/check-baseline.test.mjs` |
| TC-C03 | 就地改 `tools/docgen/test/data.test.mjs` | 断言 `BASELINE_RULES` 含新规则、`agentPaths()` 含 `evidence-reader`（**不写 22/15 字面量**） | T5 | `node --test tools/docgen/test/data.test.mjs` |
| **TC-C04（例外·人工）** | 不落测试文件 | 在 `npm run check` 内部再断言 `npm run check` 全绿 = 自指；判据留 T10 收尾人工核 `# fail 0` + `check 未通过` 不出现 | T10 | 手工 |
| TC-C05～C08 | 副本仓 + `spawnSync`（§2 桶 2） | 半改后只跑**受影响测试文件**（不全量），断言 exit 1 且点名文件 | T6 | 副本仓内 `node --test <受影响文件>` |
| TC-C10 | 需先把 C9 断言抽成可 import 的纯函数 | 建议抽 `tools/docgen/components/stateCoverage.mjs`（`(stateAgents, names) => 缺失键[]`），`check-all` 只调用；单测直接喂对象 | T5 | `node --test tools/docgen/test/dev-workflow-registry.test.mjs` |
| TC-C11 | `tools/docgen/test/dev-workflow-counts.test.mjs`（新） | 纯 fs：读 12 处源码 → 剥 `//` 后逐行断言「无裸数字且含派生表达式」 | T6 | `node --test tools/docgen/test/dev-workflow-counts.test.mjs` |
| TC-D01、D02、D03、D07 | `tools/docgen/test/evidence-reader.test.mjs` | D01 `spawnSync gate`（exit 0 + `baseline 37/37`）+ 注入一字节在副本仓；D02 `readdirSync('agents')` 差集恰 1；D03/D07 读 `agentData` 内存判定 | T5 | 同 B 组命令 |
| TC-D04、D08、D09 | 同上文件 | **内存构造**：直接调 `renderAgent({agent, trigger, template})`，模板串自造（`template` 是函数参数，见 [renderAgent.mjs:17-31](file:///d:/Seed/retro-skills/tools/docgen/components/renderAgent.mjs#L17-L31)）→ 不需要副本仓 | T2（C10/C11 落地即写） | 同 B 组命令 |
| TC-D05 | 同上文件 | 纯函数：`domain = '' / '  ' / 123` 三种内存注入，断言 `validateAgentData` 抛 `DescriptionDerivation` 且渲染不含「在中担任」 | T2 | 同 B 组命令 |
| TC-D06 | 副本仓 + `spawnSync`（**唯一必须改 module 常量的**） | `DOMAIN` 是模块级 `export const`（[patternRegistry.mjs:2](file:///d:/Seed/retro-skills/tools/docgen/components/patternRegistry.mjs#L2)），无法内存改 → 副本仓改字面量后 `gate` 必 Mismatch | T5 | 副本仓 `node tools/docgen/cli.mjs gate` |
| TC-E01～E04、E08、E13、E14、E18、E20、E21、E24、E25、E28、E29、E31～E33 | 三个 A/B/C 组文件内（**把 A/B 组判据写成「文本 → findings」纯函数**，负例只换输入文本） | 纯函数 / 文本注入（§2 桶 1） | T3/T6 视分组 | 对应组命令 |
| TC-E05、E10、E11、E15、E22 | 临时目录 + `spawnSync`（skill 目录 / skilldependencies 各自 cp 到 tmp） | 桶 2 轻量版：只需 tmp 目录，不需整仓副本 | T3/T7 | 见 §2 |
| TC-E06、E09、E12、E07、E02、E03、E16、E17、E19 | 副本仓或 env 注入 + `spawnSync`（§2 桶 2） | 见 §2 逐条 | T5/T6 | 见 §2 |
| **TC-E23、E26、E27、E30（例外·人工/半人工）** | 不落纯机器断言 | E23：禁词探针机器判 + 「README 新增行是否加对」人工复核；E26：`手工核对` 计数辅助 + 人判；E27：本机 PowerShell；E30：机器探针 + reviewer-qa/审计人判 | T8/T10 | 见 §2 桶 3 |

**例外点名（一句话版）**：必须用副本仓/git worktree 的 = `E02 E03 E05 E06(可选) E07 E09 E12 E16 E17 E19 C05 C06 C07 C08 D06`；只能人工判的 = `A10 C04 E23(复核项) E26 E27 E30`；其余全部可纯函数或临时目录完成。

## §2 负例可重跑方案

**先立一条施工前置**：现有 `tools/docgen/acceptance/cold-run.mjs` 用 `git ls-files` 建副本（[cold-run.mjs:13-30](file:///d:/Seed/retro-skills/tools/docgen/acceptance/cold-run.mjs#L13-L30)）→ **未跟踪的新文件（`agents/evidence-reader.md`、`rules/dev-workflow-mainline.md`、`skills/dev-workflow/**`）不会被复制**。在本次改动提交前，任何「正常态先跑一次」的负例（E10/E11/E15）都会在副本里看到 `DanglingBaselineEntry`，把「基线绿」这一步直接卡死。故：**测试 helper 一律用 `cpSync` 全量复制（或 `git ls-files --cached --others --exclude-standard`），不复用 `cold-run.mjs` 的文件清单**。

### 桶 1：纯函数 / 内存构造（17 条，不碰工作树）

用例：`E01 E04 E08 E13 E14 E20 E21 E24 E25 E28 E29 E31 E32 E33 D04 D08 D09`

**判据（统一）**：断言函数收「文本 / 数据对象」返回 findings，正常态 findings 为空、注入态命中指定 code。落地前提：A 组判据写成 `checkSkill(text)`、B 组判据写成 `checkCardText(text)` 这类纯函数（放 `tools/docgen/test/support/` 下，文件名不带 `.test.mjs` 故不进 `node --test`）。理由：`E28/E29/E33` 要删 SKILL.md 的一段，若走副本仓要复制整仓；写成纯函数只需 `text.replace(...)`。

**样例（E32）**：`import { validateAgentData }` → `clone = structuredClone(agentData)` → `delete clone.find(a=>a.name==='evidence-reader').boundary` 以外的做法是改 `BASE_KEYS`（需副本仓）；**改为**内存断言：正常条目带 `boundary` 时**不得**抛 `TriggerFieldMisplaced`（[validateAgentData.mjs:103-112](file:///d:/Seed/retro-skills/tools/docgen/components/validateAgentData.mjs#L103-L112) 现白名单无该键）→ 施工前必红、C5 后必绿，判别力等价且不依赖副本。

### 桶 2：副本仓 / 临时目录 + `spawnSync`（16 条）

用例：`E02 E05 E06 E07 E09 E10 E11 E12 E15 E22 C05 C06 C07 C08 C11 D06`（边界 `E03 E16 E17 E19 C09` 同桶同法）

分四种构造，按成本从低到高：

| 构造 | 用例 | 做法 | 判据（可复算） |
|---|---|---|---|
| ① 临时技能目录 | E10、E11 | `cpSync('skills/dev-workflow', tmp)` 后追加一行违规引用，`spawnSync(check.mjs, {cwd: tmpParent})` | `--json` 输出含 `"check":"自引用带前缀"` / `"跨技能路径引用"`，exit 1；正常态 `0 findings` |
| ② env 注入（无需复制整仓） | **E06**、E22、E15 | 见下方 E06 专节；E22/E15 复制 `skilldependencies/` 到 tmp 并删一条 | `validate.test.mjs` exit 1 且点名缺失项 |
| ③ 整仓副本 | E02、E03、E05、E07、E09、E12、E16、E17、E19、C05～C08、C11、D06、C09 | `cpSync` 全量（排除 `.git`/`node_modules`）→ 在副本内改动 → `spawnSync` 指定命令，`cwd=副本` | 各用例原判据（exit 码 + stderr 首行码名）不变；**C05～C08 只跑受影响测试文件**，不跑 `npm run check`（否则 5 条负例各跑一遍全量，时间不可接受） |

**E06（删 state 键）构造与复位**——不用副本仓，用 `DOCGEN_STATE_PATH`：

- 构造：`readFileSync('tools/docgen/state.json')` → `delete agents['evidence-reader']` → 写 `${tmp}/state-missing.json`。
- 跑：`spawnSync('npm', ['run','check'], { env: {...process.env, DOCGEN_STATE_PATH: tmpState} })`。
- 为什么成立：`check-all` 自身的 `readState()` 走 env（[state.mjs:7](file:///d:/Seed/retro-skills/tools/docgen/state.mjs#L7)、[check-all.mjs:125](file:///d:/Seed/retro-skills/scripts/check-all.mjs#L125)）→ C9 断言命中；而它 spawn 的 gate 子进程会**丢掉**该 env（[check-all.mjs:72](file:///d:/Seed/retro-skills/scripts/check-all.mjs#L72) 显式删除）→ gate 仍读真实 state、仍绿，正好复现「gate 抓不到」这条预期。
- 判据：`status=1`、日志含 `execution-matrix` 与 `evidence-reader`、且同时含 `# fail 0`（证明红不是测试引起，[check-all.mjs:121-149](file:///d:/Seed/retro-skills/scripts/check-all.mjs#L121-L149)）。
- 复位：tmp 目录 `rmSync` 即复位，**不触碰**真实 `state.json`；构造 B（整文件缺失）同理指向不存在的路径。

**E12（登记了但文件不存在）构造与复位**——必须整仓副本：

- 构造：整仓 `cpSync` → 副本内 `renameSync('rules/dev-workflow-mainline.md', '...bak')`。
- 判据：副本内 `node tools/docgen/cli.mjs gate` → exit **2**、stderr 首行 `DanglingBaselineEntry:` 且点名该路径（存在性检查用 `REPO_ROOT`，[cli.mjs:90-96](file:///d:/Seed/retro-skills/tools/docgen/cli.mjs#L90-L96)，故 env 注入无效、只有副本可行）。
- 复位：删副本目录；真实仓零改动。

**E27（只写源不 sync）**——人工，不进自动化：

- 谁判：施工者（T8 当场）；看什么：`aas` 输出里 `需建链接` 那一行 + 两条 `Test-Path` 的布尔值。
- 步骤：主仓建 `rules/tmp-e27-unsynced.md`（一行标题 + 五段空标题）→ **不跑** `aas sync` → `Test-Path "$HOME\.trae-cn\user_rules\tmp-e27-unsynced.md"` 应为 `False`、体检应出 `需建链接 ≥ 1` 且点名该文件。
- 复位硬约束：`Remove-Item` 探针文件 → `aas sync` → 体检回到 `需建链接 0`；未回到 0 即本用例未完成（这条是唯一会写出仓库外的用例，故必须人工）。

### 桶 3：只能人工判（3 条 + 2 条半人工）

| 用例 | 谁判 | 看什么 | 判据 |
|---|---|---|---|
| E23（半） | 机器禁词探针 + 审计复核 | 三份 README 的「N 个/N 条」是否已改成指针句；新增 `dev-workflow` 行是否落在正确小节 | 探针 0 命中 + 复核通过 |
| E26 | 审计 | 计划门文档三条核对是否各有「判据 + 二选一证据」 | 缺上线前分支即打回 |
| E27 | 施工者 | 见上 | 见上 |
| E30（半） | reviewer-qa / 审计 | `gate-record.md` ② 行六列 + 议会账「P0 未清 1 张」 | 结论必须是「留在本段」 |
| C04 | 施工者 | T10 的 `npm run check` 全量输出 | `# fail 0` 且无 `check 未通过` |

## §3 与主 agent 计划的分歧

### §3.1 第 1 轮结论（按 plan §7 回填）

plan §7（L81-L90）对本文 7 条挑刺的处置：**6 条承认、1 条部分承认、无反驳**；本文逐条认账，不再挂账。

| # | 第 1 轮问题 | 处置（plan 行） | 本文判定 |
|---|---|---|---|
| 1 | T1 必红、缺 C6a | T1 写 36/36 + C6a（L43） | 承认，闭合 |
| 2 | `replace` 迁移段三件证据不可得 | spec C7 改「新席不走 replace」（L176）+ §11 ③（L311） | 承认，闭合（依据见 cli.mjs:370-381、405、421：新席无旧卡 → `DanglingBaselineEntry`/`TargetDrift`） |
| 3 | T2 只跑 validate 不渲染 | 改 `generate` + 三渲染测试（L44） | 承认，但见 §3.2 ① |
| 4 | A 组落一个文件必持久红、A10 依赖本机 | 拆两文件 + A10 移出（plan §4 L58-59） | 承认，闭合 |
| 5 | 79 条无落点 | 新增 T6.5（L49） | 承认，闭合 |
| 6 | T0 与 §6 互相否证 | 白名单制 + `lessons.test.mjs` 来源（L42、L74-75） | 部分承认，闭合 |
| 7 | `check-agents` 不读 annotations | T4 加 `checkAgentFile`（L46；实现在 check-agent.mjs:175，check-all.mjs:144 已调用） | 承认，闭合 |

### §3.2 第 2 轮复检：2 条仍未闭合（都是「命令能不能跑」级，非措辞）

**① T2 的验收 `generate` exit 0 在 T1→T3 之间必红。**
事实链：C1 后 `agentPaths()` 由 `agentData` 派生（[baseline.mjs:18-19](file:///d:/Seed/retro-skills/tools/docgen/components/baseline.mjs#L18-L19)）→ 15 席；`cmdGenerate` 对 agent 先做存在性检查（[cli.mjs:66-67](file:///d:/Seed/retro-skills/tools/docgen/cli.mjs#L66-L67)），新卡未落盘即 `DanglingBaselineEntry`（exit 2），**走不到渲染那行**（[cli.mjs:70](file:///d:/Seed/retro-skills/tools/docgen/cli.mjs#L70)），所以 C10/C11 的 `MissingSlot` 这条验收目标仍抓不到。
修法：T2 验收改 `node tools/docgen/cli.mjs generate --kind rule`（只跑规则侧 + 生成规则渲染）＋ 测试体内 `renderByName('evidence-reader')` 断言不抛；全量 `generate`（kind=all）挪到 T3 落盘之后。

**② T3「`generate` 出草稿」不可执行。**
事实链：`generate` 只比对不写盘（[cli.mjs:40-76](file:///d:/Seed/retro-skills/tools/docgen/cli.mjs#L40-L76)），写草稿的子命令是 `draft`（[cli.mjs:305-337](file:///d:/Seed/retro-skills/tools/docgen/cli.mjs#L305-L337)、[cli.mjs:545-549](file:///d:/Seed/retro-skills/tools/docgen/cli.mjs#L545-L549)）。
修法：T3 首步改 `node tools/docgen/cli.mjs draft --name evidence-reader` → 人工对照 → 草稿复制为 `agents/evidence-reader.md`。

**附带（不阻塞）**：T3 的「`gate` 渲染与磁盘一致」对新席是空判——`collectGate` 只比对 `state=replaced` 的席（[cli.mjs:103-107](file:///d:/Seed/retro-skills/tools/docgen/cli.mjs#L103-L107)），此时新席尚未登记；逐字节判定实际落在 T4 的 `check-agents`（[cli.mjs:150-151](file:///d:/Seed/retro-skills/tools/docgen/cli.mjs#L150-L151)）。建议 T3 该句改成「逐字节一致由 T4 `check-agents` 判」。

