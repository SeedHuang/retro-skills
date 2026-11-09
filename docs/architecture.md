# 复盘体系架构（architecture）

> 本文是 spec 的**上层视图**：描述"这套体系由哪些部分组成、各部分职责、数据怎么流、什么能动什么不能动"。
> 收拢自 2026-09-27 的体系设计对话，**不替代**已有 spec（`docs/superpowers/specs/2026-09-27-retro-suite-design.md`）。
> 本文**中立描述**，可被多个仓库引用（本仓库 README、项目交接词、KB 的索引都可能指向它）。
> 待验证项 / 隐患 / 评审 backlog 等**过程史**已拆至 `docs/architecture-history.md`（见 §9）。
>
> **现状口径（2026-11-09）**：L1–L3.5 的复盘套件（`using-retrospective` / `retro-collect` / `retro-analyze` / `retro-institutionalize` / `evolving-skills` / `retro-verify` / `managing-lessons-store`）已整体归档到 `bak_skill/`，不再在 `skills/` 注册。原 §2–§3（含 §3.1）、§6、§8 执行顺序、§8.1 的 `aas` 用法均已移至 `docs/architecture-history.md` §12；本文只留现役部分（§4 数据流、§5 前提、§7 仓库清单、§9 历史指针）。节号保留原编号，避免打断外部锚点。

## 1. 一句话

把「开发中踩的坑」变成「下次不再踩的规范」的闭环，**并且这个闭环能自我进化**。

## 4. 单向数据流（体系公理）

> **运行时目录全是只读的。唯一的编辑点是源仓库。更新 = 改源 → 跑同步 → 运行时被刷新。**
>
> **CLI 化修订（2026-09-28，`aas`）**：运行时目录**禁止人手改**这条不变；新增的"安装形态"（`aas add` 从远端仓库装）由**工具写入**运行时，且在 `~\.aas\installed.json` 留账——一切写入都经工具、有账可查，公理的精神不变。
>
> **公理承载**：由 `carrier-conventions` 技能的「全局规则只建在源仓库」节承载（细则 `references/single-source.md`：新建只建源 / 改已有内容改源即生效不用同步 / 新增删除后必跑 `aas sync` / 收尾跑 `aas` 体检）。

```
源仓库（唯一编辑点）                      运行时（只读，只被同步写入）
  rules/（retro-skills）──同步──►  ~\.trae-cn\user_rules\
  retro-skills        ──同步──►  ~\.trae-cn\skills\
  项目仓库            ──天然──►  <项目>\.trae\rules\   （本来就在项目里，零改动）
```

**直接改运行时的三种真实后果**：

| 直接改哪里 | 后果 |
|---|---|
| `user_rules\` 里的规则 | 会生效，但不在任何 git 里 + 等同步一到就被冲掉 → **白改 + 丢改动** |
| `~\.trae-cn\skills\` 里的副本 | 同上：会生效，但重装/同步时**静默覆盖** |
| `~\.agents\rules\` | **真的不生效**（Trae 不读这个目录）——已实测，本项目有 2 条死规则就是这么来的 |

## 5. 可进化的前提（硬约束）

> **可进化的前提是有源仓库。没有 git = 改坏了退不回去 = 不许进化。**

由它直接推出三条：

1. **第三方技能不可进化**——就算改了本地文件，`skills update` 会按源重放、**静默覆盖**（锁文件里有每个技能的文件夹哈希）。第三方教训**降级成 rule**（rule 是我们自己的地盘，不会被冲掉）。
2. **无仓库的自建技能属于"裸奔"**——现无实例：`prd-to-specs` 已于 2026-09-29 收编进本仓库 `skills/`（无版本、无回滚、丢盘就没的风险已解除）。
3. **技能目录里不放 lessons**——隐私风险（技能发布 = 教训一起发布）+ 发布物应纯净。教训一律进 KB。

## 7. 仓库清单

| 仓库 | 状态 | 放什么 |
|---|---|---|
| `retro-skills` | ✅ 已建（GitHub 远程） | 全局规则源 + 技能源码 + 本文档；复盘套件已归档 `bak_skill/`。**同步脚本已于 2026-09-28 搬出**（见下） |
| **`agent-assets-sync`** | ✅ 已建（git + GitHub 远程） | **同步 / 体检 / 安装 CLI `aas`**（独立项目、配置驱动：`sync.config.json` + 安装账本 `~\.aas\`；命令全集见 `docs/architecture-history.md` §12.5） |
| **my-rules** | 🗄️ 已归档（2026-10-10 并入 retro-skills） | 历史规则源仓库；本地已删、远程归档 |
| 项目仓库（lpm 等） | ✅ 已有 | 项目 rule 跟项目走，**不建新仓库** |
| **KB（`D:\Seed\lessons`）** | ✅ 自建私有 git 仓库（2026-10-03 起） | 数据层、含个人记录，不套进任何其它仓库 |
| `prd-to-specs` | ✅ 已收编（2026-09-29） | 入 `skills/prd-to-specs/` + junction |

## 9. 历史记录（已拆出）

待验证项（V1–V6）、ais 实测、已知隐患（H1–H5）、评审 backlog（R1–R34）的完整记录在 **`docs/architecture-history.md`**（2026-09-29 拆分，内容原样保留）。
