#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { writeEvidence } from '../evidence.mjs';

const name = process.argv[2];
if (!name) { console.error('用法：node tools/docgen/acceptance/init-evidence.mjs <name>'); process.exit(2); }
const file = `agents/${name}.md`;
const commit = execFileSync('git', ['log', '-1', '--format=%H', '--', file], { encoding: 'utf8' }).trim();
const blob = execFileSync('git', ['rev-parse', `${commit}:${file}`], { encoding: 'utf8' }).trim();
const hashObject = execFileSync('git', ['hash-object', '--no-filters', file], { encoding: 'utf8' }).trim();
const bytes = readFileSync(file);
const sha256 = createHash('sha256').update(bytes).digest('hex').toUpperCase();
writeEvidence(name, {
  commit, blob, sha256, hashObject,
  goldenAssertion: 'pending', compareResult: null, renderSha256: 'pending', lastWrittenHash: sha256,
});
console.log(`evidence 已写入：${name}（commit ${commit.slice(0, 7)} / blob ${blob.slice(0, 7)}）`);
