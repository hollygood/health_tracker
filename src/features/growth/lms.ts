import type { LmsRow } from './whoData';

/**
 * WHO growth maths (the LMS method).
 * z = ((value / M)^L - 1) / (L * S), or ln(value / M) / S when L is 0.
 * Reference: WHO Child Growth Standards, Methods and development (2006), and
 * "Computation of centiles and z-scores" in the WHO 2007 reference documentation.
 */

export interface Lms {
  l: number;
  m: number;
  s: number;
}

/** LMS parameters at an age, linearly interpolated between table rows. Null outside the table. */
export function lmsAt(rows: LmsRow[], ageDays: number): Lms | null {
  if (rows.length === 0 || ageDays < rows[0][0] || ageDays > rows[rows.length - 1][0]) return null;

  // Binary search for the last row at or before this age.
  let low = 0;
  let high = rows.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (rows[mid][0] <= ageDays) low = mid;
    else high = mid - 1;
  }

  const [age0, l0, m0, s0] = rows[low];
  const next = rows[low + 1];
  if (!next || age0 === ageDays) return { l: l0, m: m0, s: s0 };

  const t = (ageDays - age0) / (next[0] - age0);
  return {
    l: l0 + t * (next[1] - l0),
    m: m0 + t * (next[2] - m0),
    s: s0 + t * (next[3] - s0),
  };
}

/** The measurement that sits at a given z-score. Inverse of the unrestricted z-score. */
export function valueAtZ({ l, m, s }: Lms, z: number): number {
  return l === 0 ? m * Math.exp(s * z) : m * (1 + l * s * z) ** (1 / l);
}

/**
 * z-score of a measurement.
 * With `restricted`, values beyond +/-3 SD are measured in units of the distance
 * between the 2 SD and 3 SD lines, as WHO does for weight-based indicators.
 */
export function zScore(value: number, lms: Lms, restricted = false): number {
  const { l, m, s } = lms;
  const z = l === 0 ? Math.log(value / m) / s : ((value / m) ** l - 1) / (l * s);
  if (!restricted || Math.abs(z) <= 3) return z;

  const sign = z > 0 ? 1 : -1;
  const sd3 = valueAtZ(lms, 3 * sign);
  const sd2 = valueAtZ(lms, 2 * sign);
  return 3 * sign + (value - sd3) / Math.abs(sd3 - sd2);
}

/** Standard normal cumulative distribution (Abramowitz and Stegun 26.2.17, error < 7.5e-8). */
export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const density = Math.exp((-z * z) / 2) / Math.sqrt(2 * Math.PI);
  const tail =
    density *
    t *
    (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - tail : tail;
}

/** Percentile (0-100) for a z-score. */
export const percentileFromZ = (z: number) => normalCdf(z) * 100;

/** The percentile lines drawn on the chart (the set used by the WHO Growth Charts for Canada). */
export const CHART_PERCENTILES = [
  { percentile: 3, z: -1.880794 },
  { percentile: 15, z: -1.036433 },
  { percentile: 50, z: 0 },
  { percentile: 85, z: 1.036433 },
  { percentile: 97, z: 1.880794 },
] as const;
