import { describe, expect, it } from 'vitest';
import { leo, localIso } from '../../test/fixtures';
import { whoFixture } from '../../test/whoFixture';
import type { GrowthEntry } from '../logs/entryTypes';
import {
  ageInDays,
  ageLabel,
  ageWindow,
  bmi,
  DAYS_PER_YEAR,
  growthSeries,
  measurement,
  ordinal,
  percentileText,
  referenceCurves,
} from './growthStats';

// Leo was born 2024-01-15.
const entry = (id: string, time: string, fields: Partial<GrowthEntry>): GrowthEntry => ({
  id,
  profileId: leo.id,
  type: 'growth',
  time,
  heightCm: null,
  weightKg: null,
  headCm: null,
  ...fields,
});

describe('ageInDays', () => {
  it('counts whole days from the birthday to the day of the measurement', () => {
    expect(ageInDays('2024-01-15', localIso(2024, 1, 15))).toBe(0);
    expect(ageInDays('2024-01-15', localIso(2024, 1, 16, 0, 5))).toBe(1);
    expect(ageInDays('2024-01-15', localIso(2025, 1, 15, 23, 50))).toBe(366); // 2024 is a leap year
  });

  it('returns null for a measurement before birth', () => {
    expect(ageInDays('2024-01-15', localIso(2024, 1, 14))).toBeNull();
  });
});

describe('ageLabel', () => {
  it('uses days, then months, then years and months', () => {
    expect(ageLabel(0)).toBe('0 d');
    expect(ageLabel(20)).toBe('20 d');
    expect(ageLabel(31)).toBe('1 mo');
    expect(ageLabel(600)).toBe('19 mo');
    expect(ageLabel(731)).toBe('2 y');
    expect(ageLabel(1000)).toBe('2 y 8 mo');
  });
});

describe('measurement', () => {
  const full = entry('e', localIso(2025, 1, 15), { weightKg: 12, heightCm: 80, headCm: 47 });

  it('reads each indicator from the entry', () => {
    expect(measurement(full, 'weight')).toBe(12);
    expect(measurement(full, 'height')).toBe(80);
    expect(measurement(full, 'head')).toBe(47);
  });

  it('computes BMI from weight and height', () => {
    expect(bmi(12, 80)).toBe(18.8); // 12 / 0.8^2 = 18.75
    expect(measurement(full, 'bmi')).toBe(18.8);
  });

  it('has no BMI unless both weight and height were measured', () => {
    expect(measurement({ ...full, heightCm: null }, 'bmi')).toBeNull();
    expect(measurement({ ...full, weightKg: null }, 'bmi')).toBeNull();
  });
});

describe('growthSeries', () => {
  // 600 days after birth is 2025-09-06; the fixture median weight there is 10 kg.
  const at600 = localIso(2025, 9, 6);
  const entries = [
    entry('later', at600, { weightKg: 11, heightCm: 80 }),
    entry('birth', localIso(2024, 1, 15), { weightKg: 4 }),
    entry('height-only', localIso(2024, 7, 13), { heightCm: 59 }),
  ];

  it('gives each measurement its age, z-score and percentile, oldest first', () => {
    const series = growthSeries(entries, leo, 'weight', whoFixture);

    expect(series.map((p) => p.entryId)).toEqual(['birth', 'later']);
    expect(series[0]).toEqual(expect.objectContaining({ ageDays: 0, value: 4 }));
    expect(series[0].z).toBeCloseTo(0, 8);
    expect(series[0].percentile).toBeCloseTo(50, 4);

    expect(series[1].ageDays).toBe(600);
    expect(series[1].z).toBeCloseTo(1, 8); // 11 kg vs median 10, S 0.1
    expect(series[1].percentile).toBeCloseTo(84.13, 1);
  });

  it('skips entries without that measurement', () => {
    expect(growthSeries(entries, leo, 'height', whoFixture).map((p) => p.entryId)).toEqual([
      'height-only',
      'later',
    ]);
    expect(growthSeries(entries, leo, 'head', whoFixture)).toEqual([]);
  });

  it('interpolates the reference between table rows', () => {
    // 180 days: median height 59 cm, exactly on a row; 185 days: 59.25 cm, between rows.
    const series = growthSeries(
      [entry('e', localIso(2024, 7, 18), { heightCm: 59.25 })],
      leo,
      'height',
      whoFixture,
    );

    expect(series[0].ageDays).toBe(185);
    expect(series[0].z).toBeCloseTo(0, 8);
  });

  it('keeps the value but gives no percentile without reference data', () => {
    const series = growthSeries(entries, leo, 'weight', null);

    expect(series[1]).toEqual(expect.objectContaining({ value: 11, z: null, percentile: null }));
  });

  it('gives no percentile beyond the age the WHO table covers', () => {
    // Head circumference is covered to 5 years; this is at 6 years.
    const series = growthSeries(
      [entry('e', localIso(2030, 1, 15), { headCm: 52 })],
      leo,
      'head',
      whoFixture,
    );

    expect(series[0]).toEqual(expect.objectContaining({ value: 52, z: null, percentile: null }));
  });

  it('ignores entries dated before the birthday', () => {
    expect(growthSeries([entry('e', localIso(2023, 12, 1), { weightKg: 3 })], leo, 'weight', whoFixture)).toEqual([]);
  });
});

describe('percentileText', () => {
  it('writes ordinals', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 50, 99].map(ordinal)).toEqual([
      '1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '23rd', '50th', '99th',
    ]);
  });

  it('rounds to a whole percentile', () => {
    expect(percentileText(50)).toBe('50th percentile');
    expect(percentileText(84.13)).toBe('84th percentile');
    expect(percentileText(2.6)).toBe('3rd percentile');
  });

  it('does not claim precision at the extremes', () => {
    expect(percentileText(0.4)).toBe('below 1st percentile');
    expect(percentileText(99.7)).toBe('above 99th percentile');
  });
});

describe('referenceCurves', () => {
  it('returns the five percentile lines within the window', () => {
    const curves = referenceCurves(whoFixture, 'weight', 'male', 0, 600);

    expect(curves.map((c) => c.percentile)).toEqual([3, 15, 50, 85, 97]);
    expect(curves[2].points[0]).toEqual({ ageDays: 0, value: 4 });
    expect(curves[2].points[curves[2].points.length - 1]).toEqual({ ageDays: 600, value: 10 });
  });

  it('orders the lines from lowest to highest at every age', () => {
    const curves = referenceCurves(whoFixture, 'height', 'female', 0, 1800);

    curves[0].points.forEach((_, i) => {
      const values = curves.map((c) => c.points[i].value);
      expect(values).toEqual([...values].sort((a, b) => a - b));
    });
  });

  it('thins long tables', () => {
    const curves = referenceCurves(whoFixture, 'height', 'male', 0, 6960);

    expect(curves[0].points.length).toBeLessThanOrEqual(121);
    expect(curves[0].points[curves[0].points.length - 1].ageDays).toBe(6960);
  });
});

describe('ageWindow', () => {
  const tableEnd = 19 * DAYS_PER_YEAR;

  it('shows birth to 2 years for a child under 2', () => {
    const w = ageWindow(600, tableEnd);

    expect(w.toDays).toBe(2 * DAYS_PER_YEAR);
    expect(w.ticks.map((t) => t.label)).toEqual(['Birth', '6 mo', '12 mo', '18 mo', '24 mo']);
  });

  it('shows birth to 5 years for a child between 2 and 5', () => {
    const w = ageWindow(1000, tableEnd);

    expect(w.toDays).toBe(5 * DAYS_PER_YEAR);
    expect(w.ticks.map((t) => t.label)).toEqual(['Birth', '1 y', '2 y', '3 y', '4 y', '5 y']);
  });

  it('shows the whole table for an older child', () => {
    const w = ageWindow(8 * DAYS_PER_YEAR, tableEnd);

    expect(w.toDays).toBe(tableEnd);
    expect(w.ticks[w.ticks.length - 1].label).toBe('18 y');
  });

  it('never goes past the end of a short table', () => {
    const w = ageWindow(1000, 1500);

    expect(w.toDays).toBe(1500);
  });
});
