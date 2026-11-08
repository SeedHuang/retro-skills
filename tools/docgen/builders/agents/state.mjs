import { readFileSync, writeFileSync, existsSync, renameSync, rmSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { agentData } from './components/agentData.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
export const statePath = () => process.env.DOCGEN_STATE_PATH || join(ROOT, 'state.json');
const NAMES = new Set(agentData.map((a) => a.name));
const VALUES = new Set(['replaced', 'suspended']);

function fail(code, fields = {}) {
  const e = new Error(code);
  e.code = code;
  Object.assign(e, fields);
  e.exitCode = 2;
  throw e;
}

export function readState() {
  const p = statePath();
  if (!existsSync(p)) return { version: 1, agents: {} };
  let s;
  try {
    s = JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    fail('StateFileInvalid', { path: p, reason: 'JSON 解析失败' });
  }
  if (s.version !== 1 || typeof s.agents !== 'object' || s.agents === null || Array.isArray(s.agents)) {
    fail('StateFileInvalid', { path: p, reason: 'version/agents 形状非法' });
  }
  for (const [name, value] of Object.entries(s.agents)) {
    if (!NAMES.has(name)) fail('StateFileInvalid', { path: p, name, reason: '键不在 agentData' });
    if (!VALUES.has(value)) fail('StateFileInvalid', { path: p, name, value, reason: '值非法' });
  }
  return s;
}

export function writeState(state) {
  const p = statePath();
  mkdirSync(dirname(p), { recursive: true });
  const tmp = `${p}.tmp-${process.pid}`;
  try {
    writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`);
    renameSync(tmp, p);
  } catch (e) {
    rmSync(tmp, { force: true });
    throw e;
  }
}

export function setAgentState(name, value) {
  const state = readState();
  state.agents[name] = value;
  writeState(state);
}
