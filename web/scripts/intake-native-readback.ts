import assert from 'node:assert/strict';

type Cell = Record<string, any>;
type Planned = {a1: string; after: Cell; displayValue: string; expectedLink: string | null};
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const blue = {red: 0.06666667, green: 0.33333334, blue: 0.8};
const black = {};

// Read-only verification. No network, writer, authority decision or retry mechanism.
// Sheets promotes a single whole-cell link run into cell formatting, and makes
// default hyperlink styling implicit. Compare exact values, link intervals and
// rendered text style rather than assuming returned REST objects echo requests.
export function verifyNativeCell(before: Cell, actual: Cell, planned: Planned) {
  const label = planned.a1;
  assert.deepEqual(actual.userEnteredValue ?? {}, planned.after.userEnteredValue ?? {}, `${label}: entered value`);
  assert.equal(String(actual.formattedValue ?? ''), planned.displayValue, `${label}: display`);
  const length = planned.displayValue.length;
  const runs: Cell[] = actual.textFormatRuns ?? [];
  let previous = -1;
  for (const run of runs) {
    const start = run.startIndex ?? 0;
    assert(Number.isInteger(start) && start >= 0 && start <= length && start > previous, `${label}: run boundary`);
    previous = start;
    assert(Object.keys(run).every(k => ['startIndex', 'format'].includes(k)), `${label}: run fields`);
  }
  const baseLink = actual.userEnteredFormat?.textFormat?.link?.uri ?? null;
  const expectedEnd = planned.expectedLink?.length ?? 0;
  if (planned.expectedLink) assert(planned.displayValue.startsWith(planned.expectedLink), `${label}: planned link prefix`);
  const points = [...new Set([0, length, expectedEnd, ...runs.map(r => r.startIndex ?? 0)])].sort((a, b) => a - b);
  const oldText = clone(before.effectiveFormat?.textFormat ?? {});
  delete oldText.link;
  for (let i = 0; i + 1 < points.length; i++) {
    const start = points[i];
    const run = runs.filter(r => (r.startIndex ?? 0) <= start).at(-1);
    const link = run?.format?.link?.uri ?? baseLink;
    const expectedLink = planned.expectedLink && start < expectedEnd ? planned.expectedLink : null;
    assert.equal(link, expectedLink, `${label}: link span at ${start}`);
    const actualStyle = {...(actual.effectiveFormat?.textFormat ?? {}), ...(run?.format ?? {})};
    delete actualStyle.link;
    const expectedStyle = clone(oldText);
    if (expectedLink) {
      const oldColor = oldText.foregroundColorStyle?.rgbColor ?? oldText.foregroundColor ?? black;
      assert(JSON.stringify(oldColor) === JSON.stringify(blue) || Object.keys(oldColor).length === 0,
        `${label}: custom color requires separate review`);
      expectedStyle.foregroundColor = blue;
      expectedStyle.foregroundColorStyle = {rgbColor: blue};
      expectedStyle.underline = true;
    }
    assert.deepEqual(actualStyle, expectedStyle, `${label}: rendered style at ${start}`);
  }
  if (planned.expectedLink && expectedEnd === length) assert.equal(actual.hyperlink, planned.expectedLink, `${label}: whole-cell hyperlink`);
  if (actual.hyperlink) assert.equal(actual.hyperlink, planned.expectedLink, `${label}: unexpected hyperlink`);
  const beforeFormat = clone(before.userEnteredFormat ?? {}), afterFormat = clone(actual.userEnteredFormat ?? {});
  delete beforeFormat.textFormat;
  delete afterFormat.textFormat;
  assert.deepEqual(afterFormat, beforeFormat, `${label}: nontext format`);
  const keys = new Set([...Object.keys(before), ...Object.keys(actual)]);
  for (const key of keys) {
    if (['userEnteredValue', 'effectiveValue', 'formattedValue', 'hyperlink', 'textFormatRuns', 'userEnteredFormat', 'effectiveFormat'].includes(key)) continue;
    assert.deepEqual(actual[key], before[key], `${label}: preserved ${key}`);
  }
  // Empty values have no text intervals, so their explicit text format must also match.
  if (length === 0) assert.deepEqual(actual.userEnteredFormat?.textFormat ?? {}, before.userEnteredFormat?.textFormat ?? {}, `${label}: empty-cell text format`);
}

export function verifyNativeReadback(before: Record<string, Cell>, actual: Record<string, Cell>, planned: Planned[]) {
  assert.equal(new Set(planned.map(c => c.a1)).size, planned.length, 'duplicate planned target');
  assert.deepEqual(Object.keys(actual).sort(), Object.keys(before).sort(), 'readback coverage');
  const targets = new Map(planned.map(c => [c.a1, c]));
  for (const c of planned) assert(c.a1 in before && c.a1 in actual, `${c.a1}: missing cell`);
  for (const a1 of Object.keys(before)) {
    const target = targets.get(a1);
    if (target) verifyNativeCell(before[a1], actual[a1], target);
    else assert.deepEqual(actual[a1], before[a1], `${a1}: untargeted cell changed`);
  }
  return {verifiedTargetCells: planned.length, verifiedUntargetedCells: Object.keys(before).length - planned.length};
}
