// time.mjs —— 输出当前时间（HH:MM:SS），review 账本耗时记录用
// 用法：node skills/review-log/scripts/time.mjs
// 每轮开始/结束时各跑一次，把两次输出记为「起/止」；总耗时 = 全部 review 开始 → 全部 review 修复结束。
// 为什么要有它：agent 无内置时钟，时间必须经工具取；本脚本是「取时间」的固定动作，防凭感觉填（2026-10-14 实测教训）。
// 2026-10-20 升级到秒：统一 review / 议会评审账本的时间粒度到 HH:MM:SS（用户裁定）。
const now = new Date()
const hh = String(now.getHours()).padStart(2, '0')
const mm = String(now.getMinutes()).padStart(2, '0')
const ss = String(now.getSeconds()).padStart(2, '0')
console.log(`${hh}:${mm}:${ss}`)
