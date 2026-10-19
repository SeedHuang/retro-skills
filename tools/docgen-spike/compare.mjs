export function compareBuffers(actual, expected) {
  const a = Buffer.isBuffer(actual) ? actual : Buffer.from(actual, 'utf8');
  const b = Buffer.isBuffer(expected) ? expected : Buffer.from(expected, 'utf8');
  if (a.equals(b)) return null;
  const n = Math.min(a.length, b.length);
  let i = 0;
  while (i < n && a[i] === b[i]) i += 1;
  const line = a.subarray(0, i).toString('utf8').split('\n').length;
  return { code: 'Mismatch', line, byte: i };
}
