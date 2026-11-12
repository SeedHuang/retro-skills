---
name: carrier-conventions
description: Use when 写或改 rule / skill / agent / references 的正文，或判断一段内容该进 rule、skill、references、脚本还是 git 历史；也用于把判据写成可观察形态、把「读 reference」接上产出闭环、摊技能目录骨架、给全局规则定单一来源。Do not use for 体检评分（走 skill-inspector / rule-inspector）、起草新规则（走 rule-writer）。
---

# carrier-conventions：载体写作规范

管**文件怎么写对**（管不到「话说得站不站得住」——那是 assertion-quality；管不到「给用户怎么讲」——那是 plain-language）。

## 边界（与另两个技能的互斥条款）

| 场景 | 归谁 |
|---|---|
| 这句话真不真、链闭不闭合、用户能不能复核 | assertion-quality |
| 这个文件该放哪一层、判据句怎么写、reference 怎么接产出 | 本技能 |
| 给用户看的解释怎么讲 | plain-language |

## 四类该进 rule（缺一不可）

① **义务句**（做什么 / 禁止什么 / 必须什么）② **判定动作**（可机判：命令 + 退出码 / 计数 / 集合比较 / 空非空 / 枚举）③ **边界与例外**（`除非` / `只许` / `不再` / `不得`）④ **来源锚**（一行：`> 来源：PRD §X / 用户裁定 YYYY-MM-DD`）。

**四类不该进**：为什么 / 病根 / 实测 → references；历史沿革 → git；反例 → 测试断言；操作步骤 / 模板 / 清单表 → 脚本或 references。

判别法两条：删掉这段，「判定动作」变不变？变 = 判据（提回正文压成句）；不变 = 说明（删，git 有）。已有脚本或技能持有 → 移过去并查是否形成第二份真相。

细则与反例：`references/rule-content.md`。

## 判据必须写成可观察形态

每个评价都要能被机器用一次退出码判死；判不死就改写成可判形态，或进豁免清单并写明「为什么只能这样写」。执行 = `scs check observable --check`，末行 `check-observable ok` 且 exit 0。

六要素（范围 / 条件 / 动作 / 宾语 / 触发时机 / 验证）、豁免清单结构、正反例，全在 `references/observable.md`；词表与标记表唯一源 = `tools/docgen/models/rules/vocab/observable-terms.json`（本技能不复述任何词面）。

## 读 reference 必须接产出闭环

写成「按 `<reference>` 的 X 执行，做完核对 / 产出 Y，缺 Y 不合格」；禁止「读一下 / 建议读 / 见 §N」这类读完无要求的写法。细则：`references/reference-loop.md`。

## 技能目录骨架

能外移的外移，SKILL.md 只留指针；模板骨架不进 SKILL.md；差异卡放 assets。脚本 / references / assets 三档的判据：`references/skill-structure.md`。

## spec 与 testcase 绑定

写或修改 `docs/superpowers/specs/` 下的 spec 时，必须同批产出由独立 `senior-sdet` 编写的 testcase，并随 spec 一起送审。五条判据与例外：`references/spec-testcase-gate.md`。

## PowerShell 写文本文件

PowerShell 5.1 写文本文件禁用 `-Encoding UTF8`（会写 BOM）；改用 `WriteAllText(..., UTF8Encoding $false)`，写完自查 BOM。细则与已踩场景：`references/powershell-encoding.md`。

## 全局规则只建在源仓库

改已有规则改源即生效；运行时目录只读。新建 / 增删后必须 `aas sync`（本仓规则源 = `rules/`，运行时 = `~/.trae-cn/user_rules`）。细则：`references/single-source.md`。

## 验证（写完自查）

1. `scs check observable --check` → exit 0；
2. 目标文件里引用指针所指向的文件真实存在（`Test-Path` 为 True）；
3. `npm run check` → 末行 `check 全部通过`。
