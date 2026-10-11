# L3 方案设计：让 OCR 的审查规则对症下药（review-loop 进化 spec）

> 目标：根治 L3——**审查清单逼模型凑数**。OCR 的默认规则按文件扩展名分配，把前端专属检查项塞进了 Node CLI 项目的审查清单，模型找不到真问题又不能空手交差，于是凑 low 级样式评论。
> 关联：`2026-10-10-config-layering-review-accounting.md`（18 轮案例，L3 实锤）
> 演进：L1（分支锁基线）已落地并提交。**L3 于 2026-10-11 三次收敛**：v1 = 自动识别 + 探测 + 例外表（整套废弃，见 §三）；v2 = 用户选类型 + 全局类型注册表 + 项目派生 rule.json；v2.1 = 预设拆三层（语言级/生态级/个人累积）+ 叠加语义已实测通过（§十）。L4（收敛判据）另议。

---

## 一、根因（实测证据）

### 现象

第 15 轮 session（`da8fefe2`）里，模型审完代码内心认为「代码写得很好」，但因为清单要求必须检查「重复代码 / 硬编码」等项，它报了两条 low 级维护性建议交差。模型 thinking 原文：

> 「the plan's 5 issues mostly turn out to be non-issues or trivial」
> 「OK, I give up hunting; the code is well-written.」
> 「But the user's checklist literally asks to check for Duplicate Code and Hardcoding. So reporting them aligned with the checklist is appropriate.」

### 根因链（实测验证）

1. **OCR 按扩展名分配规则**：`.mjs` 匹配系统层 `**/*.{ts,js,tsx,jsx,mjs,cjs}` → 用 `ts_js_tsx_jsx.md`。实测 `ocr rules check src/main.mjs` 输出 `Source: System built-in`，规则全文含 `React Best Practices`（Hooks / useState / useEffect / XSS / innerHTML / document.write）。`.mjs` 与 `.tsx` 拿到的是**同一份**规则文档——OCR 不判断项目类型，它不知道项目里有没有 React。
2. **这份文档是「JS/TS 生态通用模板」**：假设你写前端（JS 生态最常见的是 React）。Node CLI 项目用到它时，真 bug 类检查项很少、样式类很多。
3. **模型不能空手交差**：于是凑 low 评论。第 17、18 轮同类现象（重复调用三次纯函数、注释里的日期是未来日期）。

### 与 L2 的区别

L2 是「已判定的问题被重复报」，兜底是处置侧过滤。L3 是「规则本身配错了」，源头在规则层——**处置侧过滤治不了源头**（模型没错，是清单逼它）。

---

## 二、OCR 的规则机制与能力边界（实测）

### 四层优先级链

| 优先级 | 来源 | 路径 |
|---|---|---|
| 1 | `--rule` 参数 | 用户指定 |
| 2 | 项目配置 | `<repo>/.opencodereview/rule.json` |
| 3 | 全局配置 | `~/.opencodereview/rule.json` |
| 4 | 系统默认 | 内嵌（按扩展名匹配） |

### OCR 没有判断项目类型的能力（实测确认，2026-10-11）

OCR 只做两件事：①按文件扩展名匹配规则文档；②接受两个输入覆盖——`.opencodereview/rule.json`（规则层）+ `--background-file`（背景层）。命令列表（review / rules / scan / session / viewer）里没有任何「读清单文件判断这是什么项目」的能力。**「项目类型识别」必须由我们做，识别结果再通过 rule.json 喂给它。**

### 支持的语言（官方文档，open-codereview.ai/docs/review-rules）

编程语言：Java、Go、TypeScript/JavaScript（ts/js/tsx/jsx/mjs/cjs，React 项嵌在这份）、Kotlin、F#、Rust、R、C++、C、Python、PHP、Julia、Elm、Objective-C（`.m` 与 MATLAB 靠内容嗅探区分）、Objective-C++、ArkTS、Astro、Verilog/SystemVerilog、VHDL、Solidity、Vyper。另有配置/模板/基础设施类（JSON/YAML/Terraform/Bicep/GitHub Actions/Proto/GraphQL/Prisma/FreeMarker/Jinja/MyBatis mapper 等），不认识的扩展名回落 `default.md`。文档标注为「部分模式」，完整以二进制内嵌为准。**主流语言都覆盖，本方案不需要新增语言规则，只做「忽略声明」对症。**

### 决策：为什么用「叠加」而不是「替换」

- `merge_system_rule: true`（叠加）：系统规则全保留（含 React 项）+ 我们的「忽略前端检查」声明 → **模型读到明确指令后跳过 React 项**，且万一判断错了，系统规则兜底还在
- `merge_system_rule: false`（替换）：React 项彻底消失，但系统规则里所有**有用**项（dead code / null checks / 原型污染 / async 错误处理）也一起没了 → 得不偿失

**结论：用叠加。判断错误的代价只是「多报几条前端项」，可接受；替换的代价是「漏审真问题」，不可接受。**

---

## 三、设计收敛：为什么不做自动识别（v2 的核心决定）

v1 设计是「脚本自动识别项目类型 + 每次一致性探测 + 例外表 + 认知账本」。这套机制为了「自动判断准」引入了整片复杂度：

- 探测脚本（递归读清单文件、依赖类别表、monorepo for 循环、边界情形）
- 例外表（可重验断言、失效判据、作废清理）
- 认知账本（自定义类型表、标志位记录）

**v2 判断：自动识别的成本 > 收益，砍掉，改用「用户选」。**

| 对比 | 自动识别（v1） | 用户选（v2） |
|---|---|---|
| 准确性 | 概率性，可能判错 | 用户对自己项目最了解，确定性 |
| 出错可能 | 探测误报/漏报、例外失效、monorepo 边界——一整片 | 无自动判断 = 无自动判断错误 |
| 复杂度 | 脚本 + 例外表 + 认知账本 + 失效判据 | 一张注册表 + 一次选择 |
| 跨项目复用 | 自定义类型要另外设计自动化 | 全局注册表天然跨项目 |

**唯一失去的：自动发现项目演化**（原来探测会提醒「项目从 CLI 长成前端了」）。删掉后得靠用户主动重设。两个理由可接受：

1. **叠加语义兜底**：`merge_system_rule: true` 下系统规则还在，配置过时最坏情况是少报几条前端项，不是漏掉整个审查。
2. **重设成本极低**：重新设置 = 重新选一次类型，随时可做。

**结论：类型以用户确认为准，用户随时可重设。不写自动探测。**

---

## 四、落点：全局类型注册表 + 项目派生

**两层结构（缺一不可）**：

| 层 | 文件 | 装什么 | 进 git |
|---|---|---|---|
| **全局层（类型注册表）** | `~/.retro-skills/reviewconfig/activeProjectTypes.config.json` | 已激活项目类型 → rule 配置的映射 | **否**（个人机器配置，与 `~/.opencodereview/rule.json` 同性质） |
| **项目层（派生）** | 项目内 `.opencodereview/rule.json` | 从注册表取该类型的 rule 配置派生 | **是**（项目事实，OCR 硬编码读它） |

**为什么项目层必须有**：OCR 把 rule.json 的读取路径**硬编码**在 `<repo>/.opencodereview/rule.json`（实测 `ocr rules check` 输出 `Source: Project (.opencodereview/rule.json)`）。全局注册表再全，每个项目还是得派生一份 rule.json 进项目，OCR 才吃得到。

**项目内类型指针**：项目内 `.reviewconfig/project-type` 文件记一行「本项目选的类型」——下次 review 读它直接复用，不用重新问。**不用 rule.json 的注释字段**（OCR 会读 rule.json，注释字段可能污染 prompt）。

**实现版 v1 不做背景层（`--background-file`）**：规则层（rule.json）跑通前不加背景层。`ocr review` 命令**不带** `--background-file`。

**真相源 = 全局注册表 + 项目内一行指针**。项目内没有第二份类型声明，没有认知账本，没有例外表。

---

## 五、类型注册表结构（三层：语言级预设 + 生态级预设 + 个人累积）

**为什么分三层**：语言级预设进技能（共享代码，人人有）——别人用 review-loop 技能遇到 Python/Go 项目时，候选里有语言级底座，**不用提 issue 改预设**；个人累积进各自的注册表，互不干扰。

| 层 | 放哪 | 管什么 | 谁有 |
|---|---|---|---|
| **`languagePresets`**（语言级预设） | 技能内置（review-init.mjs 常量） | Python / Go / Java / C# / Rust… 每语言至少一条通用类型 + rule 模板 | 人人都有 |
| **`ecosystemPresets`**（生态级预设） | 技能内置 | 当前常用生态（JS + H5 家族），首日顺手 | 人人都有 |
| **`activeProjectTypes`**（个人累积） | `~/.retro-skills/reviewconfig/activeProjectTypes.config.json` | 用户实际用过的具体类型，动态累积 | 各人自己的 |

**rule 配置只跟「语言 + 端」有关，跟具体框架关系很小**——Python FastAPI 后端 / Python 大模型应用 / Go 后端，rule 配置几乎一样（path 按语言 + 忽略前端检查）。所以语言级预设覆盖到「语言 + 端」粒度即可，**不用给每个框架建类型**。

### 个人注册表文件形态（`.config.json`）

```json
{
  "activeProjectTypes": [
    { "name": "node-cli",      "path": "**/*.{js,mjs,cjs,ts,tsx,jsx}", "ignore": "无前端，忽略 React 类检查（Hooks / useState / XSS 等）" },
    { "name": "react",         "path": "**/*.{js,mjs,cjs,ts,tsx,jsx}", "ignore": "" },
    { "name": "react-node-monorepo", "path": "**/*.{js,mjs,cjs,ts,tsx,jsx}", "ignore": "前后端同仓，不忽略前端检查；后端代码的 React 噪音走 A2 处置侧过滤（按性质判不改）" }
  ]
}
```

- **`activeProjectTypes`**：用户确认过的类型（种子 = 用户实际用过的），每条带 rule 配置（`path` = 按语言的 glob，从预设继承；`ignore` = 忽略声明）。**种子默认值**（写进 review-init 的种子表）：node（纯 Node）/ electron / React / CLI / electron-monorepo / React+node-monorepo，均带各自语言的 path。

### 预设内置形态（review-init.mjs 常量，不落盘，更新技能即更新）

`languagePresets`（示例，落地时补全，按「语言 + 端」粒度）：`python-backend`（path `**/*.py`）/ `python-data` / `go-backend`（path `**/*.go`）/ `java-backend`（path `**/*.java`）/ `csharp-backend`（path `**/*.cs`）/ `rust`（path `**/*.rs`）……

`ecosystemPresets`（当前常用）：纯静态 H5 / React H5 / Vue H5 / 小程序 H5 / Angular H5 / React / Vue / node / electron / CLI / 纯静态页面 / Agent Skill 项目

**匹配来源 = languagePresets ∪ ecosystemPresets ∪ activeProjectTypes**（review-init.mjs 输出合并后的候选集）。用户描述「Python 后端」→ 命中 languagePresets → 确认 → 写进他自己的 activeProjectTypes。**新语言第一次出现不用改技能——语言级预设已覆盖主流语言**。

### rule 配置的形态（派生进 rule.json）

```json
{
  "rules": [
    {
      "path": "**/*.{js,mjs,cjs,ts,tsx,jsx}",
      "rule": "<ignore 声明，如「本项目无 React 代码，忽略 React 类检查」>",
      "merge_system_rule": true
    }
  ]
}
```

**rule.json 由注册表条目派生，不手写**——每个文件里写互指注释：「派生自 activeProjectTypes.config.json 的 <类型名> 条目」。

---

## 六、选择流程（首次 review / 重设类型）

**首次 review（分支前置阶段）且项目无类型指针 → 走选择流程。类型随时可重设。**

```
用户描述项目类型（自然语言，例：「这是个 H5 前端项目」）
  ↓
agent 匹配：从 languagePresets ∪ ecosystemPresets ∪ activeProjectTypes 里找候选
  ├─ 唯一命中 → 直接落地（不二次确认）
  ├─ 多候选 → 列出来给用户选（例：纯静态 H5 / React H5 / Vue H5 / 小程序 H5 / Angular H5）
  └─ 无候选 → 新建类型条目 + 它的 rule 配置（问用户这种类型要忽略什么检查）
  ↓
落地（两步一起）：
  ① 写 activeProjectTypes.config.json（没有的类型加进去；已有的跳过）
  ② 派生项目 .opencodereview/rule.json（按注册表该类型的 rule 配置）
```

**「唯一不用二次选」的判据**：用户描述精确到 agent 只匹配出一个候选（例：「React H5 项目」且只有 ReactH5 命中）→ 直接落地。

---

## 七、review-init.mjs（初始化脚本）

**职责（实现版 v1 只做初始化，幂等）**：

1. 确保 `~/.retro-skills/reviewconfig/` 存在（没有就建）
2. 确保 `activeProjectTypes.config.json` 存在（没有就写入种子默认类型）
3. 输出候选集 = languagePresets ∪ ecosystemPresets ∪ 当前 activeProjectTypes（给 agent 当候选匹配的输入；预设是技能常量，不落盘）
4. 已就位则跳过，不覆盖已有注册表
5. **注册表 JSON 解析失败 → 报错停止，不自动覆盖**（防丢用户数据），提示人工处理

**脚本管确定性，agent 管交互**：建目录、种子配置、读注册表是脚本的活（幂等、可测试）；自然语言匹配候选、确认、判断唯一性、新建类型是 agent 的活。

**落位**：`skills/review-loop/scripts/review-init.mjs`。

**实现版 v1 不做**：加类型子命令、派生 rule.json 子命令——先跑通「初始化 + 选择 + 手动派生」链，实测顺手了再自动化（未决项，见 §十三）。

---

## 八、落进 review-loop 的改动

### 改动 1 · SKILL.md「分支前置」插入新步骤

位置：第 3 步（建 review 分支）之后、第 4 步（记母分支）之前，成为新第 4 步。

内容：跑 `review-init.mjs`（初始化全局注册表）→ 读项目类型指针：无 → 走选择流程（§六）→ 有 → 复用 → 派生 `.opencodereview/rule.json` → 验证（`ocr rules check`）。

### 改动 2 · SKILL.md「段一 · 代码」命令

三种模式**不带** `--background-file`（实现版 v1 不做背景层，见 §四）：

```powershell
ocr review                      # 工作区
ocr review --commit HEAD        # 最近 1 次
ocr review --from HEAD~N --to HEAD   # 最近 N 次
ocr review --preview            # 只看会审哪些文件，不花 LLM
```

### 改动 3 · 每轮不做任何探测

一致性探测**不做**、不加到 loop.md §1 每轮开场动作。项目类型只在分支前置（每次启动 review）确认一次。

---

## 九、验证方式

| 验证项 | 怎么验 | 验证方式 |
|---|---|---|
| 规则层生效 | `ocr rules check <文件>` → 期望 `Source: Project (.opencodereview/rule.json)` | 命令自动验证 |
| 叠加语义正确 | 同上 → 输出应同时含 `## System-Specific Rules` 与 `## User-Specific Rules` 两段 | 命令自动验证 |
| 初始化幂等 | `review-init.mjs` 跑两次，第二次不覆盖已有注册表 | 命令 + 文件 diff |
| 类型识别正确 | 用户描述 → 候选匹配结果合理 | 人工核对 |

---

## 十、实测无效时的 B 计划（重要）

**方案的根基假设**：模型读到 `## User-Specific Rules` 段（说「忽略前端检查」）后，会真的跳过 `## System-Specific Rules` 里的 React 项。**已实测通过（2026-10-11）**：agent-assets-sync（Node CLI）建叠加 rule.json 后跑 `ocr review`，20 文件 8 评论，**React 类 = 0**，且抓到一条 medium 真 bug（commander 参数 `[值]>` 多了个 `>`）——模型听话，有用的检查一个没丢。以下退路为备用：

| 顺序 | 手段 | 代价 | 何时选它 |
|---|---|---|---|
| B1 | **改措辞**：把「忽略前端检查」改成更强断言（「本项目无 React 代码，**禁止**报 React 类问题」） | 0 | 首次实测无效，优先试这个 |
| B2 | **换 `merge_system_rule: false` 完全替换** | 高：系统规则里所有有用项会一起丢 | B1 也无效，且实测发现模型仍大量报 React 项 |
| B3 | **替换时手写精简版系统规则** | 中：要人工在 rule.json 里补一份通用底线 | 选 B2 但不想丢检查项 |
| B4 | **退回 L2 处置侧过滤** | 中：低价值评论走「不改」路径吞掉 | 前三种都试过仍无效 |

**B2/B3 的取舍点**：从「多报噪音」换成「漏审真问题」。只有实测证明噪音压倒性、且能接受漏检风险才走 B2/B3。

---

## 十一、风险

| 风险 | 应对 |
|---|---|
| 类型配置过时（项目演化） | 用户主动重设（§六 随时可走选择流程）；叠加语义兜底，过时最坏少报几条前端项 |
| **覆盖用户手写的 rule.json** | 覆盖前看文件是否存在且非本流程生成 → 报告「检测到已有手写 rule.json，要保留还是替换？」走一次确认，不静默覆盖 |
| **问用户后中断，下次又问一遍** | 选择完成后**立即落盘**（写注册表 + 派生 rule.json + 记项目指针）再继续 |
| 混合项目（前后端同仓）忽略声明只能全局选一 | 默认**不忽略前端**（React 检查抓真问题）；后端被 React 项骚扰出的凑数评论交给 A2 处置侧过滤兜底（判据按性质：影响行为的改，纯样式/优化的不改） |
| 全局注册表损坏 / 误删 | review-init.mjs 解析失败时报错提示人工处理，**不自动覆盖**（防丢用户数据）；误删时幂等重建（种子 + 项目指针） |
| 文档仓库（retro-skills）里 OCR 几乎审不到东西 | md 不在 OCR 代码审查白名单（实测 `--preview` 显示 `unsupported_ext`）；这类项目走 md 模式（multi-lens-review），本方案不适用 |

---

## 十二、边界案例（判定用例）

| 案例 | 输入 | 期望 |
|---|---|---|
| 首次 review，有项目指针 | 项目已选过类型 | 跳过选择，直接派生 rule.json |
| 首次 review，无指针，描述唯一 | 「React H5 项目」命中唯一候选 | 不二次确认，写注册表 + 派生 rule.json |
| 首次 review，无指针，描述多候选 | 「H5 前端项目」命中 H5 家族多个 | 列候选让用户选，选完写注册表 + 派生 |
| 无候选 | 「数据管道项目」不在任何候选 | 新建类型条目 + 问忽略声明，写注册表 + 派生 |
| 重设类型 | 项目演化后用户重选 | 走同一选择流程，覆盖注册表条目 + 重新派生 |
| 已有手写 rule.json | 检测到非本流程生成 | 问「保留还是替换」，不静默覆盖 |

---

## 十三、未决与待验证

- **`merge_system_rule` 的遵从度**：**已实测通过**（见 §十）——aas 20 文件 8 评论 React 类=0。接入后 low 评论占比下降的完整趋势，待真实 review 再补。
- **多语言项目的 path pattern**：由语言级预设（languagePresets）按语言自带——`python-backend` 用 `**/*.py`、`go-backend` 用 `**/*.go`；新建类型时按语言补，agent 常识负责，不预穷举。
- **review-init.mjs 要不要加「加类型 / 派生 rule.json」子命令**：先跑通「初始化 + 选择 + 手动派生」链，实测顺手再自动化，不预设计。
- **`~/.retro-skills` 与 aas 共享**：`reviewconfig/` 子目录与已有 `rule-drafts/` 共存，不冲突（用户确认共享无问题）。

---

## 附：v1 废弃项清单（落地时清理）

v1（自动识别）设计废弃、**不再实现**的东西，落地时把对应残留清理掉：

| 废弃项 | 残留位置 | 处置 |
|---|---|---|
| 探测脚本 detect-project-type.mjs | 未建（v1 spec 曾计划） | 不建 |
| 探测计时雏形 | `.session/temp/probe-timing.mjs` | **已删除** |
| 一致性探测机制（每次启动比对） | `project-type.md` 第三层、loop.md §1 偏离探测段 | 落地时重写/删除 |
| 例外表 + 可重验断言 + 失效判据 + 作废清理 | `project-type.md`、spec v1 段 | 不实现 |
| 认知账本（自定义类型表 / 标志位） | `project-type.md` | 由全局注册表取代 |
| 项目内 `.reviewconfig/project-profile.md` 真相源 | `project-type.md`、SKILL.md 分支前置第 4 步 | 由全局注册表 + 项目指针取代 |
| 背景层 `--background-file` | SKILL.md / loop.md 命令 | 实现版 v1 不做，命令还原 |
| monorepo 逐包识别 / 标志物清单 / 边界情形 | `project-type.md` | 不实现 |
