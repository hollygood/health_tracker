import type { LmsRow, WhoDataset } from '../features/growth/whoData';

/**
 * A small made-up reference dataset with easy numbers, for tests.
 * L is 1 and S is 0.1 everywhere, so z = (value / median - 1) / 0.1, and the
 * medians are straight lines in age. These are NOT the WHO values.
 */
const line = (toDays: number, medianAt: (ageDays: number) => number): LmsRow[] =>
  Array.from({ length: Math.floor(toDays / 30) + 1 }, (_, i): LmsRow => [i * 30, 1, medianAt(i * 30), 0.1]);

const both = (rows: LmsRow[]) => ({ male: rows, female: rows });

export const whoFixture: WhoDataset = {
  source: 'Test fixture (not WHO values)',
  generatedAt: '2026-01-01T00:00:00.000Z',
  indicators: {
    weight: both(line(3660, (d) => 4 + d * 0.01)), // 4 kg at birth, 10 kg at 600 days
    height: both(line(6960, (d) => 50 + d * 0.05)), // 50 cm at birth, 80 cm at 600 days
    bmi: both(line(6960, () => 16)),
    head: both(line(1830, (d) => 34 + d * 0.01)),
  },
};
