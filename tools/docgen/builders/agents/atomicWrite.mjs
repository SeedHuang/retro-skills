// atomicWrite.mjs —— 原子写的**唯一实现**（单源）
// 为什么需要：`writeFileSync` 先截断后写入，并发读方（另一个进程的 gate / 测试）会在窗口里读到空文件 → 误报漂移。
// rename 原子替换消掉该窗口；崩溃时清掉半截临时文件，不留垃圾。
// 消费方：state.mjs writeState / evidence.mjs writeEvidence / cli.mjs cmdBaselineWrite（勿各写一份）。
import { mkdirSync, writeFileSync, renameSync, rmSync } from 'node:fs'
import { dirname } from 'node:path'

export function writeFileAtomic(path, text) {
  mkdirSync(dirname(path), { recursive: true })
  const tmp = `${path}.tmp-${process.pid}`
  try {
    writeFileSync(tmp, text)
    renameSync(tmp, path)
  } catch (e) {
    rmSync(tmp, { force: true })
    throw e
  }
}
