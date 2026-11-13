import { describe, expect, it } from 'vitest';
import { CHART_PERCENTILES, lmsAt, normalCdf, percentileFromZ, valueAtZ, zScore } from './lms';
import type { LmsRow } from './whoData';

// WHO weight-for-age, boys, at birth (published table values).
const boysBirthWeight = { l: 0.3487, m: 3.3464, s: 0.14602 };

describe('lmsAt', () => {
  const rows: LmsRow[] = [
    [0, 1, 10, 0.1],
    [10, 0, 20, 0.2],
    [30, -1, 40, 0.4],
  ];

  it('returns the row at an exact age', () => {
    expect(lmsAt(rows, 0)).toEqual({ l: 1, m: 10, s: 0.1 });
    expect(lmsAt(rows, 10)).toEqual({ l: 0, m: 20, s: 0.2 });
    expect(lmsAt(rows, 30)).toEqual({ l: -1, m: 40, s: 0.4 });
  });

  it('interpolates linearly between rows', () => {
    const mid = lmsAt(rows, 5)!;
    expect(mid.l).toBeCloseTo(0.5, 10);
    expect(mid.m).toBeCloseTo(15, 10);
    expect(mid.s).toBeCloseTo(0.15, 10);

    const later = lmsAt(rows, 15)!;
    expect(later.m).toBeCloseTo(25, 10);
  });

  it('returns null outside the table', () => {
    expect(lmsAt(rows, -1)).toBeNull();
    expect(lmsAt(rows, 30.1)).toBeNull();
    expect(lmsAt([], 0)).toBeNull();
  });
});

describe('zScore', () => {
  it('is 0 at the median', () => {
    expect(zScore(3.3464, boysBirthWeight)).toBeCloseTo(0, 10);
  });

  it('matches the WHO table: boys weight at birth, -2 SD = 2.5 kg, +2 SD = 4.4 kg', () => {
    // WHO weight-for-age boys, week 0: -2 SD 2.5, -1 SD 2.9, median 3.3, +1 SD 3.9, +2 SD 4.4
    expect(valueAtZ(boysBirthWeight, -2)).toBeCloseTo(2.5, 1);
    expect(valueAtZ(boysBirthWeight, -1)).toBeCloseTo(2.9, 1);
    expect(valueAtZ(boysBirthWeight, 1)).toBeCloseTo(3.9, 1);
    expect(valueAtZ(boysBirthWeight, 2)).toBeCloseTo(4.4, 1);
  });

  it('is the inverse of valueAtZ', () => {
    for (const z of [-2.5, -1, 0.3, 1.7, 3]) {
      expect(zScore(valueAtZ(boysBirthWeight, z), boysBirthWeight)).toBeCloseTo(z, 8);
    }
  });

  it('uses the simple form when L is 1', () => {
    expect(zScore(55, { l: 1, m: 50, s: 0.05 })).toBeCloseTo(2, 10);
  });

  it('uses the log form when L is 0', () => {
    const lms = { l: 0, m: 10, s: 0.1 };
    expect(zScore(10 * Math.exp(0.15), lms)).toBeCloseTo(1.5, 10);
    expect(valueAtZ(lms, 1.5)).toBeCloseTo(10 * Math.exp(0.15), 10);
  });

  it('leaves values within 3 SD alone when restricted', () => {
    const value = valueAtZ(boysBirthWeight, 2.9);
    expect(zScore(value, boysBirthWeight, true)).toBeCloseTo(2.9, 8);
  });

  it('measures beyond 3 SD in steps of the 2-to-3 SD distance when restricted', () => {
    const sd2 = valueAtZ(boysBirthWeight, 2);
    const sd3 = valueAtZ(boysBirthWeight, 3);
    expect(zScore(sd3 + (sd3 - sd2), boysBirthWeight, true)).toBeCloseTo(4, 8);

    const sd2neg = valueAtZ(boysBirthWeight, -2);
    const sd3neg = valueAtZ(boysBirthWeight, -3);
    expect(zScore(sd3neg - (sd2neg - sd3neg) / 2, boysBirthWeight, true)).toBeCloseTo(-3.5, 8);
  });
});

describe('percentiles', () => {
  it('gives the standard normal percentiles', () => {
    expect(percentileFromZ(0)).toBeCloseTo(50, 5);
    expect(percentileFromZ(1)).toBeCloseTo(84.134, 2);
    expect(percentileFromZ(-1)).toBeCloseTo(15.866, 2);
    expect(percentileFromZ(1.96)).toBeCloseTo(97.5, 2);
    expect(percentileFromZ(-2)).toBeCloseTo(2.275, 2);
  });

  it('is symmetric', () => {
    expect(normalCdf(1.3) + normalCdf(-1.3)).toBeCloseTo(1, 10);
  });

  it('has chart lines whose z-scores match their percentiles', () => {
    for (const { percentile, z } of CHART_PERCENTILES) {
      expect(percentileFromZ(z)).toBeCloseTo(percentile, 3);
    }
  });
});
