import type { Entry } from '../features/logs/entryTypes';
import type { Profile } from '../features/profiles/profileStorage';

export const mia: Profile = {
  id: 'p-mia',
  name: 'Mia',
  birthday: '2022-05-04',
  sex: 'female',
};

export const leo: Profile = {
  id: 'p-leo',
  name: 'Leo',
  birthday: '2024-01-15',
  sex: 'male',
  weightKg: 12,
  weightUpdatedAt: '2026-10-01T12:00:00.000Z',
};

export const sampleEntries: Entry[] = [
  {
    id: 'e-med',
    profileId: leo.id,
    type: 'medicine',
    time: '2026-11-10T13:30:00.000Z',
    medicineId: 'advil-childrens-liquid',
    medicineName: "Advil Children's Liquid",
    amount: 6,
    unit: 'mL',
    notes: 'After lunch',
  },
  { id: 'e-temp', profileId: leo.id, type: 'temperature', time: '2026-11-10T13:00:00.000Z', celsius: 38.5 },
  {
    id: 'e-sick',
    profileId: leo.id,
    type: 'sickness',
    time: '2026-11-09T08:00:00.000Z',
    endTime: null,
    category: 'Fever',
    notes: '',
  },
  {
    id: 'e-growth',
    profileId: leo.id,
    type: 'growth',
    time: '2026-10-01T16:00:00.000Z',
    heightCm: 88.5,
    weightKg: 12,
    headCm: 48,
  },
  {
    id: 'e-hist',
    profileId: leo.id,
    type: 'history',
    time: '2026-09-15T14:00:00.000Z',
    title: 'Flu shot',
    category: 'Vaccination',
    description: '',
  },
];

/** Local-time ISO string, so tests that group or filter by day pass in any timezone. */
export const localIso = (y: number, m: number, d: number, h = 12, min = 0) =>
  new Date(y, m - 1, d, h, min).toISOString();

/** Leo's entries on known local days: two on Nov 10, one each on Nov 9, Oct 1 and Sep 15. */
export const reportEntries: Entry[] = [
  { ...sampleEntries[0], time: localIso(2026, 11, 10, 9, 30) },
  { ...sampleEntries[1], time: localIso(2026, 11, 10, 9, 0) },
  { ...sampleEntries[2], time: localIso(2026, 11, 9, 8, 0) },
  { ...sampleEntries[3], time: localIso(2026, 10, 1) },
  { ...sampleEntries[4], time: localIso(2026, 9, 15, 14, 0) },
];
