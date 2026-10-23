# review-loop ↔ review-log 账本衔接缺口（发现 + 预期修改）

> 2026-10-12 记。来源：L1-L4 分账复查 + 本次会话两次 review（1916/2030）实测发现。
> 状态：**未决 / 差距分析**｜落点：`docs/after/`（进 git）。定稿后把结论并入 spec（`docs/superpowers/specs/`），本文件删。

---

## 一、发现（问题）

### 1. 【流程缺口】分支前置只建 progress.md，没建 problems.md

- review-log 技能明确要求「目录里两个文件」：`progress.md` + `problems.md`（骨架模板 `assets/review-problems-template.md`）。
- review-loop SKILL.md「分支前置」第 5 步只写了「写 progress.md」，**没提 problems.md**。
- 实测：本次会话两次 review（2026-10-12-1916 / 2026-10-12-2030）的目录里**只有 progress.md**。

### 2. 【后果】L2 重复判定过滤一直在空转

- loop.md §1「处置前的重复判定过滤」依赖 problems.md 的「不改/误报」锚点（文件 + 行号 + 关键词）。
- 锚点文件不存在 → 过滤无原料 → **L2 机制形同虚设**（不是没触发，是没原料）。
- 分账分析（2026-10-10）L2「已关闭问题重复报」的根治依赖此链路，链路断了等于 L2 只修了一半。

### 3. 【落账缺失】有该记的条目却没落账

- 本次 1916 第 1 轮段二记录了「P2（候选）×3」「P2（关闭）×1」——按 review-log 语义，候选/关闭应落 problems.md 对应区。
- 未建 problems.md → 这些锚点丢失，后续轮/后续 session 无法回答「这条处理过没有」。

### 4. 【区分】骨架空 ≠ 没建（合法空 vs 缺口空）

- 11-2220 l3-landing、12-0905 type-rules-spec：problems.md 存在但只有骨架——那两轮问题**全修**、零「不改/误报/候选」，按 review-log「已修移走」语义，空骨架是**合法**的。
- 本次 1916/2030：**根本没有 problems.md**——这才是缺口。
- 修复后判据：`problems.md 存在` = 账本齐；锚点区空 = 合法（只要确实没有不改/误报/候选）。

### 5. 【背景】L1-L4 现状（复查确认）

- L1（全量重审）/ L4（无收敛判据）：已机制化（分支 + 锁基线 + 停机判据），实测 2 轮收敛（vs 当年 18 轮）。
- L2（无跨轮记忆）：处置侧过滤机制在位，但**锚点原料缺失**（见 #2）——半修复。
- L3（清单逼凑数）：处置侧全覆盖（jscpd 管重复代码 + A2 判不改管其余），源头侧仅类型对症（React 类 ignore），通用检查项仍靠兜底。
- A1-A3（agent 执行纪律）：在位（列全失败面 / 判不改 / 真实场景实测）。

---

## 二、预期修改（方案方向）

### 修改 1 · 分支前置补建 problems.md（必做）

- review-loop SKILL.md「分支前置」第 5 步：改为「建 progress.md + problems.md（逐字用 review-log 骨架模板）」。
- 或：第 5 步改为「调 review-log 技能建账（两个文件）」——复用骨架模板，不复制。

### 修改 2 · 处置后强制落锚点（必做）

- loop.md「处置前的重复判定过滤」处加强制：每轮处置后，「不改/误报」进锚点区、「候选」进候选区；**缺锚点 = 本轮账本不全，不算数**（对齐「必须逐项填满」语义）。

### 修改 3 · 可选后续：OCR wrapper 二次封装（大，单独立项）—— 设计已讨论细化（2026-10-12）

**目标**：L2 从「处置侧过滤」升级到「源头的确定性过滤」。wrapper = 包在 `ocr review` 外面的一层 CLI，只做确定性动作，不做判断。

**已确认的事实**：
- OCR 有 `--background-file` 参数（loop.md「实现版 v1 不做背景层」= 留的口子），但它是**背景参考**不是禁令——**不可靠，不指望 OCR 配合**。可靠性 = wrapper 自己确定性过滤。
- session jsonl = 执行流水（大/噪音，取证用），**记忆源 = problems.md 结论**，不是 session。
- 「喂给 OCR 求它别报」不可靠（LLM 软提示，catalog 16→18 轮实锤）；「报了就吞」可靠（确定性匹配）。

**流程**：读 problems.md 锚点 → 调 ocr review（spawn）→ 解析评论 → 对照锚点匹配 → 分类输出。

**产出**（结构化 JSON，非全文）：
```
{
  "matched":   [ { 评论, "命中锚点 #3" } ],        // 确定重复 → 吞掉，零 token
  "nearMiss":  [ { 评论, "疑似锚点 #1，原因：内容变化" } ],  // 规则没全命中 → agent 语义裁决
  "new":       [ { 评论 } ]                          // 真新问题 → agent 处置
}
```

**和 agent 交互边界**：wrapper 出分类（确定性），agent 出判断（处置 new、裁决 nearMiss、维护 problems.md 数据权在人）。

**匹配算法原则（关键）**：
- 主键 = **文件路径 + 代码内容指纹**（问题所在代码片段签名），**不依赖行号**——行号是必然漂移的常态，设计第一版就消化掉，只作展示参考不参与匹配。
- 漂移原因枚举（只留「真变化」，行号漂移不在内）：
  - `内容变化`：锚点代码片段被改过（问题可能已变/已不存在）→ 进 agent 复查
  - `文件移动`：路径变了 → 更新锚点
  - `锚点过期`：确认问题已消失 → 清锚点

**命中统计（验证手段）**：
- 每条评论标志位：matched / nearMiss（带原因）/ new
- 每轮汇总 + 趋势：`matched N / nearMiss M（原因分布）/ new K`，命中率趋势可查
- 作用：过滤机制的健康度信号（呼应「验证手段缺失」）；数据驱动算法迭代（哪个原因占比高先优化哪个）

**性能 = 命中率**：OCR 本身慢（LLM 审代码，分钟级）是固定大头；wrapper 后处理慢 = nearMiss 数量（本可确定性命中但没命中）。内容指纹设计把命中率上限定在第一天。

**本地模型实测（2026-10-12，ollama，同一组 12 组样本 + 计时）**：
- **GPU 修复记录**：原 ollama 100% CPU（cuda_v12 组件残缺，10-11 升级中断留下 `is-*.tmp`）；覆盖安装 0.40.3 后 CUDA 补全 → `ollama ps` 100% GPU，27B 完整进显存（22.7GB）
- qwen3-4b：10/12，**含 1 个误吞**（组11）→ 出局
- qwen2.5:14b：10/12，无误吞（2 个误放=重复报，安全）→ 无 27B 时的替代档
- **qwen3.8:27b（think:false 关思考）**：**12/12 全对，零误吞零误放**，**GPU 下 0.17s/条**（CPU 4.8s → GPU 0.17s，约 28 倍加速；UTF-8 API 实测；默认带思考不可用，**wrapper 必须 think:false**）→ **裁决模型锁定**
- qwen3:30b-a3b（Qwen3 旧代 MoE）：**9/12，3 个误吞**（组10/11/12，倾向「合并」不「区分」）+ 超长思考不守指令 → 出局。**代际（3.8 vs 3）> 参数量**
- 编码教训：PowerShell Invoke-RestMethod 传中文 JSON 会乱码（`????????`）→ 必须 ConvertTo-Json + UTF8 bytes + charset=utf-8
- **显存自管理（wrapper 负责，不依赖全局 OLLAMA_KEEP_ALIVE）**：跑前确保 27B 加载（调 API 触发加载 / ollama ps 检查），**跑完 `ollama stop qwen3.8:27b` 释放**（27B 占 22.7GB，常驻会挤占 4090 的 24GB，不能同时跑别的 GPU 任务）。用户环境 `OLLAMA_KEEP_ALIVE=-1`（永久常驻）——wrapper 自管理即可覆盖，不必改全局。

**OCR 主审实测（2026-10-12，排除项——本地模型不做主审）**：
- 技术前提确认：OCR 支持 `custom_providers`（`ocr config set custom_providers.<名>.url/protocol/api_key`，protocol=openai），ollama `/v1` 可配——27B/30B 都能跑通 OCR 的 agentic 流程（不崩）。
- 同一 commit `5a96878`（deepseek-flash 报 2 条功能性真问题：flattenCandidates 丢 path/ignore + readProjectType 吞 null，均被采纳）：
  - **27B**：0 条评论（23s）——**漏检 2 个真问题**
  - **30B**：2 条评论（4m38s，CPU）——**两条都是样式类**（optional chaining 冗余），**同一条报两遍**，同样漏功能性真问题
- **结论**：本地模型（27B/30B）**不适合 OCR 主审**——漏检功能性真问题（最致命，比误报糟），顶多报样式类 + 制造重复。主审结论已更新（见下方 2026-10-13 MiniMax 段，取代「唯一选择 deepseek-flash」）；27B 定位锁定 = wrapper 的裁决/分级（窄任务可靠）。
- 配置现为 provider=minimax（国内版端点，见下方 10-13 段）；ollama custom_providers 保留备用；注意 custom_providers.ollama.model 现为 qwen3:30b-a3b，切回用 `ocr config set model qwen3.8:27b`。

**OCR 主审实测（2026-10-13，MiniMax-M3.1-Flash-Preview 国内版云端）**：
- 背景：用户把主审从 deepseek-flash 换为 MiniMax-M3.1-Flash-Preview。config：`provider=minimax`，`providers.minimax` = { url: `https://api.minimax.chat/v1`（国内版）, protocol: openai, model: MiniMax-M3.1-Flash-Preview }，key 用户自填。
- 同一 commit `5a96878`：session `6446d085`，**400.5s 完整跑完，llm_failures 0**，报 **4 条**（逐条核实过，均属实）：

| # | 类型 | 内容 | 核实 |
|---|---|---|---|
| 1 | bug·medium | `current` 不与 `candidates` 交叉校验 → 注册表误删时指针悬空，下游命令拿不到 path/ignore 派生 rule.json（建议加 `currentHit` 字段） | **成立**，spec `2026-10-10-review-loop-l3-project-type-design.md` L254 确列「误删时幂等重建（种子 + 项目指针）」；review-init.mjs L187 只输出 current 原文不校验 |
| 2 | test·medium | 两个新导出函数（readProjectType/flattenCandidates）无测试，违反 repo 同目录 `*.test.mjs` 惯例 | **成立**，scripts 目录确认无 test 文件 |
| 3 | maintainability·low | `flattenCandidates` 无对 `set` 本身的守卫（传 null 抛裸 TypeError） | **成立**，L158-168 |
| 4 | maintainability·low | `readProjectType` 用 `process.cwd()`，非项目根调用静默变 null（把「指针失效」误读成「未设置」） | **成立**，使用契约类，价值低 |

- **与 deepseek-flash（session 03f6c717，报 2 条）对比**：deepseek 报「flattenCandidates 字符串条目丢 path/ignore」（bug·medium，已判候选）+「trailing newline」（style·low，不改）。MiniMax **补报了 deepseek 漏掉的 bug·medium（悬空指针，有 spec 依据 + 修复建议）**；漏报 deepseek 的字符串契约条（候选低风险，且悬空指针评论覆盖同一问题消费端，不算漏要害）。
- **结论（取代 10-12「主审唯一选择 deepseek-flash」）**：**主审 = MiniMax-M3.1-Flash-Preview**（云端国内版，能报带 spec 依据的功能性真问题、400s 完整跑无失败、明显强于 27B/30B）；deepseek-flash 保留备用；27B/30B 定位不变（wrapper 裁决/分级，不做主审）。

**裁决层降级（本机特色不可假设；4090 实测）**：
- 内容指纹匹配（确定性）永远本地算法跑，无降级问题。
- nearMiss 语义裁决按环境降级（启动时探测 `ollama list` + 显存）：

| 环境 | 裁决路径 |
|---|---|
| 有 27B 级模型 + GPU | **本地 27B（think:false）**——默认，准确度优先（12/12 零误吞，GPU 0.17s/条，无速度压力） |
| 有 14B 级模型（无 27B） | 本地 14B 替代档（无误吞只有误放） |
| 只有 4B 级模型 | 4B 只预筛不当一票裁决（实测有误吞实锤）；模糊样本仍进 agent |
| 无本地模型 | 全走 agent 语义裁决（现状，loop.md 手动） |

- **降级不能静默**：每轮统计标注裁决路径（`local-27b / local-14b / local-4b-prescreen / cloud-agent`），趋势可查。

**前提**：先修好 1/2（problems.md 有锚点），再谈 wrapper。

### 修改 3 · 实现细节（2026-10-12 深入讨论补充）

**OCR 评论结构（已取证，code_comment.comments[]）**：
```json
{ "path": "...", "content": "问题描述", "existing_code": "现有代码片段",
  "suggestion_code": "建议", "category": "maintainability", "severity": "medium" }
```
- **自带 `existing_code`** → 内容指纹 = 归一化 hash(existing_code)，不用 wrapper 取行；评论**无行号**（契合不依赖行号设计）
- **自带 `category`**（bug/maintainability）→ A2「判不改」直接按 category 判，**27B 只留 nearMiss 同源裁决一个场景**

**锚点格式演进**（problems.md）：
- 旧：`文件 | 行号 | 关键词 | 理由`（行号退位，不主键）
- 新：`# | 文件 | 指纹(existing_code hash) | 类别 | 理由`
- 指纹算法：**按空白分词后 join 再 hash**——格式差异忽略、逻辑 token 相同 = 同指纹；逻辑真变 = 不同（抗漂移的正确粒度）
- 旧锚点（10-08 批）不迁移（历史记录），新格式只用于新条目

**两层匹配（机械指纹快筛 + 27B 语义兜底）**：
```
评论 → ① 指纹匹配（同文件 + 同指纹）→ 命中 → matched（吞，确定性零错）
       → 未命中 → 同文件候选锚点 → ② 27B 裁决（same → 吞 / different → new）
       → 同文件无锚点 → new
```
- 指纹管「文本相同」（确定性），27B 管「本质相同」（代码变了但问题没变）
- 27B 判 same 才吞（12/12 零误吞），different 照报（安全方向）
- nearMiss 概念退出（27B 承担语义裁决）

**命中统计**：`matched N（指纹 a / 27B b）/ new K（27B different c / 无候选 d）` + 命中率趋势（验证手段）

**生命周期（性能 + 硬件平衡）**：
- 实测：27B GPU 冷启动 **7.6s**（num_ctx=8192；默认 32K 是 10.4s）、热 0.17s/条、显存 20.2GB（num_ctx=8K 省 2.6GB）、stop 瞬时
- **每轮 = 1 次加载 + 1 次停止**（裁决是批量不是穿插）；OCR 审代码期间不加载（白占 20GB 显存 3-4 分钟不值）
- **并行预热**：OCR 启动时后台加载 27B，把 7.6s 藏进 OCR 时间 → 裁决零等待
- **keep_alive=5m**：只做崩溃兜底（防泄漏），不承诺「复查轮复用」（间隔超 5 分钟会落空）
- **num_ctx=8192 每次必须一致**（不同值会触发 ollama 重载，比不优化更糟，需守卫）

**预热决策（简单规则 + 校准，非复杂模型）**：
- **本次即时信号优先**（不是历史均值）：`ocr review --preview` 的 Will review 列表 → S1 无代码 → **不预热（P=0 硬判据）**；S1 有代码 + 小 diff → 不预热（直接加载，OCR 可能 <1 分钟审完来不及）；有代码 + 中大 diff + P(use|桶) ≥ 阈值 + GPU 空闲 → 预热
- **P(use|diff 行数) 概率表**（替代硬编码分档）：按 diff 行数对数桶（0-10/10-30/30-100/100-300/300+）存 `total/used` 计数，P = used/total；判断时当前 diff 行数落桶查表
  - 存计数不存百分比（可增量 +1、保留样本量可信度）
  - 对数桶：小 diff 近处密（区分度重要）、大 diff 远处疏（趋 1 无需细分）
  - 冷启动回退：桶 total=0 用先验默认，攒够样本再信
- **校准数据分层**：原始耗时 per-review 记 progress.md（追加）；聚合统计（P(use|桶) 等结论）存单 json（重算覆盖，不膨胀）
- **诚实评估**：预热省 7.6s，收益小——**不值得复杂精算模型**；保留「简单规则 + 本次信号」即可，校准账本是锦上添花（非必须）

### 关联规则（写 skill 文档时必过）

- 「读→产出」闭环（reference-read-output-loop）：改 SKILL.md/loop.md 的引用指令必须接产出/核对条件。
- 写 skill 禁用文件路径指路（skill-authoring-convention）：跨技能引用用技能名。

---

## 三、待决

- [ ] spec 范围：只含修改 1+2（账本衔接），还是含修改 3（wrapper，设计已细化 2026-10-12）？
- [ ] 修改 3 wrapper：用户已认真设计（不是「先放一放」），是否进同一 spec / 单独 spec / 继续讨论，待定。
- [ ] 分账分析（2026-10-10）与本文关系：分账是 aas 项目视角，本文是 retro-skills 技能视角，是否并入同一 spec？
- [ ] 修改 1+2 用户已确认是已知 bug + 有解决方向，不阻塞讨论（先不展开）。
