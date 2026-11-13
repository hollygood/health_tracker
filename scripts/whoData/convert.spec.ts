import { describe, expect, it } from 'vitest';
// @ts-expect-error -- plain JavaScript module shared with the Node build script
import { buildDataset, DAYS_PER_MONTH, parseTable, SOURCE_FILES, toLmsRows, validateDataset } from './convert.mjs';

/** A table in the WHO text format, for both sexes, with made-up but plausible numbers. */
function table(ages: number[], medianAt: (age: number, sex: 1 | 2) => number, extraColumn = false) {
  const header = extraColumn ? 'sex\tage\tl\tm\ts\tloh' : 'sex\tage\tl\tm\ts';
  const rows = ([1, 2] as const).flatMap((sex) =>
    ages.map((age) => `${sex}\t${age}\t1\t${medianAt(age, sex)}\t0.1${extraColumn ? '\tL' : ''}`),
  );
  return [header, ...rows].join('\n');
}

const days = Array.from({ length: 1857 }, (_, d) => d);
const months = (to: number) => Array.from({ length: to - 60 }, (_, i) => 61 + i);

const sources: Record<string, string> = {
  weianthro: table(days, (d, sex) => (sex === 1 ? 3.3464 : 3.2322) + d * 0.005),
  lenanthro: table(days, (d, sex) => (sex === 1 ? 49.8842 : 49.1477) + d * 0.03, true),
  bmianthro: table(days, () => 15, true),
  hcanthro: table(days, (d) => 34 + d * 0.008),
  wfawho2007: table(months(120), (m) => 18 + (m - 61) * 0.2),
  hfawho2007: table(months(228), (m) => 110 + (m - 61) * 0.4),
  bfawho2007: table(months(228), () => 16),
};
const parsed = () => Object.fromEntries(Object.entries(sources).map(([k, v]) => [k, parseTable(v)]));

describe('parseTable', () => {
  it('reads tab-separated rows', () => {
    expect(parseTable('sex\tage\tl\tm\ts\n1\t0\t0.3487\t3.3464\t0.14602')).toEqual([
      { sex: 1, age: 0, l: 0.3487, m: 3.3464, s: 0.14602 },
    ]);
  });

  it('reads space-separated rows, quoted or upper-case headers and extra columns', () => {
    expect(parseTable('"Sex" "Age" "L" "M" "S" "loh"\r\n2   731  -0.2   86.5  0.035  H\r\n')).toEqual([
      { sex: 2, age: 731, l: -0.2, m: 86.5, s: 0.035 },
    ]);
  });

  it('rejects a file without the expected columns', () => {
    expect(() => parseTable('a\tb\n1\t2')).toThrow(/Column "sex" not found/);
  });

  it('rejects a row that is not numeric', () => {
    expect(() => parseTable('sex\tage\tl\tm\ts\n1\t0\tx\t3\t0.1')).toThrow(/Row 2 is not valid/);
  });
});

describe('toLmsRows', () => {
  it('keeps every 7th day and the last day of a daily table', () => {
    const rows = toLmsRows(parseTable(sources.weianthro), 1, 'days');

    expect(rows.slice(0, 3).map((r: number[]) => r[0])).toEqual([0, 7, 14]);
    expect(rows[rows.length - 1][0]).toBe(1856);
    expect(rows[0]).toEqual([0, 1, 3.3464, 0.1]);
  });

  it('converts a monthly table to days and keeps every month', () => {
    const rows = toLmsRows(parseTable(sources.wfawho2007), 2, 'months');

    expect(rows).toHaveLength(60);
    expect(rows[0][0]).toBe(Number((61 * DAYS_PER_MONTH).toFixed(2)));
  });
});

describe('buildDataset', () => {
  it('joins the 0-5 and 5-19 tables for each indicator and sex', () => {
    const dataset = buildDataset(parsed(), new Date('2026-11-11T12:00:00Z'));

    expect(Object.keys(dataset.indicators).sort()).toEqual(['bmi', 'head', 'height', 'weight']);
    expect(dataset.generatedAt).toBe('2026-11-11T12:00:00.000Z');

    const weight = dataset.indicators.weight.male;
    expect(weight[0][0]).toBe(0);
    expect(weight[weight.length - 1][0]).toBe(Number((120 * DAYS_PER_MONTH).toFixed(2)));
    // ages keep increasing across the join at 5 years
    expect(weight.every((r: number[], i: number) => i === 0 || r[0] > weight[i - 1][0])).toBe(true);

    expect(dataset.indicators.head.female[dataset.indicators.head.female.length - 1][0]).toBe(1856);
  });

  it('names the file that is missing', () => {
    const { hcanthro: _omitted, ...rest } = parsed();

    expect(() => buildDataset(rest)).toThrow('Missing table: hcanthro');
  });

  it('covers every source file', () => {
    expect(Object.keys(SOURCE_FILES).sort()).toEqual(Object.keys(sources).sort());
  });
});

describe('validateDataset', () => {
  it('rejects a table whose birth median is not the published WHO value', () => {
    const wrong = { ...parsed(), weianthro: parseTable(table(days, (d) => 4 + d * 0.005)) };

    expect(() => buildDataset(wrong)).toThrow(/median at birth is 4, expected 3.3464/);
  });

  it('rejects a table that stops too early', () => {
    const short = { ...parsed(), hfawho2007: parseTable(table(months(100), (m) => 110 + m)) };

    expect(() => buildDataset(short)).toThrow(/height \(male\): ends at/);
  });

  it('accepts a complete dataset', () => {
    expect(() => validateDataset(buildDataset(parsed()))).not.toThrow();
  });
});
