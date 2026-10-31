// 模板读取的唯一落点（`templates/agent-card.md.tpl`）。
// 为什么单独一个模块：`renderCard.mjs` / `cardPipeline.mjs` 必须**零读盘**（S4-TC-I04 / V-6），
// 模板是静态资源、不是 `agents/` 数据，读它不违反「数据源单向」；把读盘放这里，投影模块保持纯函数。
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))

export const CARD_TEMPLATE = readFileSync(join(HERE, '..', 'templates', 'agent-card.md.tpl'), 'utf8').replace(/\r\n/g, '\n')
