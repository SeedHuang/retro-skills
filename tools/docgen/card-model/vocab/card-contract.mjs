// 卡面契约文本的**唯一写死处**（spec §3 落点 #1 / §6 D2）：模板只放占位符、渲染器只 import 常量，
// 卡面里出现的契约字面一律经这里注入（`S2-TC-E01` / `E07`：模板与渲染器 0 字面）。
// 键源全部派生：`TYPE_LABELS` ← `enums.mjs` 的 `CHECK_KINDS`；`VERDICT_HINT` ← `enums.mjs` 的 `VERDICTS` + `reason`。
// 导出面恰 4 个（`S2-TC-A01`：多一 / 少一 / 改名即红）。
// **刻意不用 `Object.freeze`**：`S2-TC-E03` 要临时把一个未登记名加进 `ALLOWED_PRODUCT_NAMES` 看守卫是否只认这一处——
// 冻结会把这些「改一处即观察收敛」的探针变成 TypeError（假红），与用例语义相反。
import { CHECK_KINDS, VERDICTS } from '../enums.mjs'

// 类型列三值（顺序与 `CHECK_KINDS` 同序：script / ai / manual）
const TYPE_TEXT = ['脚本核对', 'AI 判定', '人工判定']

export const TYPE_LABELS = Object.fromEntries(Object.keys(CHECK_KINDS).map((kind, i) => [kind, TYPE_TEXT[i]]))

// 三值的中文对照（只在本文件内用；不导出，导出面仍恰 4 个）
const VERDICT_TEXT = { hit: '命中', miss: '未命中', na: '不适用' }

// 「本席清单」表头的取值声明（S-C spec §11.1 R2）：主语「判定取值：」+ 由 `VERDICTS` 派生的三值（带中文对照）
// + 判废条款与 na 的合法条件。三值仍是**取值**而非字段名（字段名那句由 `ALLOWED_PRODUCT_NAMES` 落）。
export const VERDICT_HINT = `判定取值：${Object.keys(VERDICTS).map((v) => `${v}（${VERDICT_TEXT[v]}）`).join('、')}；miss 与 na 须写 reason，缺 reason = 废卡；na 还须写明为何不适用`

// 产物允许名（许）：三态值 + AI 写进 JSON 的三个键。**不得含类型英文键**（那三个键只在 `TYPE_LABELS` 里）
export const ALLOWED_PRODUCT_NAMES = [
  ...Object.values(VERDICTS),
  'reason',
  'evidence',
  'verdict',
]

// 输出格式三判句（每条含「废卡」且含「缺」或「空」＝可二值判，不是形容词）
// 第 2 条指向 `issue-card` 的证据三列与引句校验器（S-B spec §11.2.1 R9：仍 3 条、仍可二值判）
export const FORMAT_CHECKS = [
  '问题卡缺任一必填字段 = 废卡，不得只给结论。',
  '证据三列（原文摘句 / 文件 + 行号 / 用途）缺任一或为空 = 废卡，三列须由 check-quotes 验真。',
  '建议解法栏缺内容或空 = 废卡，须给可执行一条。',
]
