import type { GrowthEntry } from '../logs/entryTypes';
import { round, toDateInputValue } from '../logs/formatters';
import type { Profile } from '../profiles/profileStorage';
import { CHART_PERCENTILES, lmsAt, percentileFromZ, valueAtZ, zScore } from './lms';
import { INDICATOR_META, type Indicator, type WhoDataset } from './whoData';

const MS_PER_DAY = 86_400_000;
export const DAYS_PER_YEAR = 365.25;
export const DAYS_PER_MONTH = DAYS_PER_YEAR / 12;

/** Whole days from the birthday (yyyy-mm-dd) to the local day of a measurement. Null if before birth. */
export function ageInDays(birthday: string, measuredIso: string): number | null {
  const [y, m, d] = toDateInputValue(new Date(measuredIso)).split('-').map(Number);
  const [by, bm, bd] = birthday.split('-').map(Number);
  const days = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(by, bm - 1, bd)) / MS_PER_DAY);
  return Number.isFinite(days) && days >= 0 ? days : null;
}

/** Age as text: months under two years, then years and months. */
export function ageLabel(ageDays: number): string {
  const months = Math.floor(ageDays / DAYS_PER_MONTH + 1e-9);
  if (months < 1) return `${ageDays} d`;
  if (months < 24) return `${months} mo`;
  const rest = months % 12;
  return rest ? `${Math.floor(months / 12)} y ${rest} mo` : `${months / 12} y`;
}

/** Body mass index, kg/m², to 1 decimal. */
export const bmi = (weightKg: number, heightCm: number) =>
  round((weightKg * 10_000) / (heightCm * heightCm), 1);

/** The value of one indicator in a growth entry, or null if it was not measured. */
export function measurement(entry: GrowthEntry, indicator: Indicator): number | null {
  switch (indicator) {
    case 'weight':
      return entry.weightKg;
    case 'height':
      return entry.heightCm;
    case 'head':
      return entry.headCm;
    case 'bmi':
      return entry.weightKg !== null && entry.heightCm !== null
        ? bmi(entry.weightKg, entry.heightCm)
        : null;
  }
}

export interface GrowthPoint {
  entryId: string;
  /** ISO datetime of the measurement. */
  time: string;
  ageDays: number;
  value: number;
  /** Null when there is no WHO data, or the age is outside the WHO table. */
  z: number | null;
  percentile: number | null;
}

/**
 * One indicator's measurements for a profile, oldest first, each with its z-score
 * and percentile for the child's age and sex.
 */
export function growthSeries(
  entries: GrowthEntry[],
  profile: Profile,
  indicator: Indicator,
  dataset: WhoDataset | null,
): GrowthPoint[] {
  const rows = dataset?.indicators[indicator][profile.sex] ?? [];
  const points: GrowthPoint[] = [];

  for (const entry of entries) {
    const value = measurement(entry, indicator);
    const ageDays = ageInDays(profile.birthday, entry.time);
    if (value === null || ageDays === null) continue;

    const lms = lmsAt(rows, ageDays);
    const z = lms ? zScore(value, lms, INDICATOR_META[indicator].restricted) : null;
    points.push({
      entryId: entry.id,
      time: entry.time,
      ageDays,
      value,
      z,
      percentile: z === null ? null : percentileFromZ(z),
    });
  }

  return points.sort((a, b) => a.ageDays - b.ageDays);
}

/** "1st", "2nd", "3rd", "11th", "42nd", ... */
export function ordinal(n: number): string {
  const lastTwo = n % 100;
  const suffix =
    lastTwo >= 11 && lastTwo <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th');
  return `${n}${suffix}`;
}

/** A percentile as people say it: "42nd percentile", "below 1st percentile". */
export function percentileText(percentile: number): string {
  if (percentile < 1) return 'below 1st percentile';
  if (percentile > 99) return 'above 99th percentile';
  return `${ordinal(Math.round(percentile))} percentile`;
}

export interface ReferenceCurve {
  percentile: number;
  points: { ageDays: number; value: number }[];
}

/** The WHO percentile curves for one indicator and sex, within an age window. */
export function referenceCurves(
  dataset: WhoDataset,
  indicator: Indicator,
  sex: Profile['sex'],
  fromDays: number,
  toDays: number,
): ReferenceCurve[] {
  const rows = dataset.indicators[indicator][sex].filter(([age]) => age >= fromDays && age <= toDays);
  // Thin long tables so the chart draws at most ~120 points per line.
  const step = Math.max(1, Math.ceil(rows.length / 120));
  const sampled = rows.filter((_, i) => i % step === 0 || i === rows.length - 1);

  return CHART_PERCENTILES.map(({ percentile, z }) => ({
    percentile,
    points: sampled.map(([ageDays, l, m, s]) => ({ ageDays, value: valueAtZ({ l, m, s }, z) })),
  }));
}

export interface AgeWindow {
  fromDays: number;
  toDays: number;
  /** Tick positions in days, with their labels. */
  ticks: { ageDays: number; label: string }[];
}

/**
 * The age range to draw: birth to 2 years, birth to 5 years, or birth to the end of
 * the WHO table, whichever is the smallest that contains the oldest measurement.
 */
export function ageWindow(oldestAgeDays: number, tableEndDays: number): AgeWindow {
  const months = (n: number) => n * DAYS_PER_MONTH;
  const years = (n: number) => n * DAYS_PER_YEAR;

  if (oldestAgeDays <= years(2)) {
    return {
      fromDays: 0,
      toDays: Math.min(years(2), tableEndDays),
      ticks: [0, 6, 12, 18, 24].map((m) => ({ ageDays: months(m), label: m === 0 ? 'Birth' : `${m} mo` })),
    };
  }
  if (oldestAgeDays <= years(5) || tableEndDays <= years(5) + 31) {
    return {
      fromDays: 0,
      toDays: Math.min(years(5), tableEndDays),
      ticks: [0, 1, 2, 3, 4, 5].map((y) => ({ ageDays: years(y), label: y === 0 ? 'Birth' : `${y} y` })),
    };
  }
  const endYears = Math.floor(tableEndDays / DAYS_PER_YEAR + 0.05);
  const stepYears = endYears > 12 ? 3 : 2;
  const ticks = [];
  for (let y = 0; y <= endYears; y += stepYears) {
    ticks.push({ ageDays: years(y), label: y === 0 ? 'Birth' : `${y} y` });
  }
  return { fromDays: 0, toDays: tableEndDays, ticks };
}
