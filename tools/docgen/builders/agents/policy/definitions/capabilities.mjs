// 能力 → 工具名（spec §3.2）：名称即能力 ID，值是工具名、顺序即卡面顺序。
// 导出名小写（`import * as CAP` → `CAP.capabilities`）。
export const capabilities = {
  read: ['Read', 'Glob', 'Grep'],
  write: ['Write', 'Edit'],
  exec: ['RunCommand'],
};
