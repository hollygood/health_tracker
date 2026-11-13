/** Shape of the WHO reference dataset built by `npm run who:data`. */

export type Sex = 'male' | 'female';
export type Indicator = 'weight' | 'height' | 'bmi' | 'head';

/** `[ageDays, L, M, S]`: the LMS parameters at one age. */
export type LmsRow = [ageDays: number, l: number, m: number, s: number];

export interface WhoDataset {
  source: string;
  generatedAt: string;
  indicators: Record<Indicator, Record<Sex, LmsRow[]>>;
}

export const INDICATORS: readonly Indicator[] = ['weight', 'height', 'bmi', 'head'];

interface IndicatorMeta {
  label: string;
  /** Short label for the tab. */
  shortLabel: string;
  unit: string;
  /**
   * WHO uses a "restricted" z-score beyond +/-3 SD for weight-based indicators,
   * so extreme values are not exaggerated by the skewed distribution.
   */
  restricted: boolean;
  /** Oldest age the WHO tables cover, for the message shown beyond it. */
  coversYears: number;
}

export const INDICATOR_META: Record<Indicator, IndicatorMeta> = {
  weight: { label: 'Weight', shortLabel: 'Weight', unit: 'kg', restricted: true, coversYears: 10 },
  height: { label: 'Height', shortLabel: 'Height', unit: 'cm', restricted: false, coversYears: 19 },
  bmi: { label: 'BMI', shortLabel: 'BMI', unit: 'kg/m²', restricted: true, coversYears: 19 },
  head: { label: 'Head circumference', shortLabel: 'Head', unit: 'cm', restricted: false, coversYears: 5 },
};
