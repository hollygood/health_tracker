import type { MedicineId } from '../dosage/dosageTable';

interface BaseEntry {
  id: string;
  profileId: string;
  /** When it happened (or started), as an ISO datetime. Entries sort by this. */
  time: string;
}

export interface MedicineEntry extends BaseEntry {
  type: 'medicine';
  /** Set when one of the built-in medicines was chosen; null for "Other". */
  medicineId: MedicineId | null;
  medicineName: string;
  amount: number;
  unit: MedicineUnit;
  notes: string;
}

export interface TemperatureEntry extends BaseEntry {
  type: 'temperature';
  celsius: number;
}

export interface SicknessEntry extends BaseEntry {
  type: 'sickness';
  category: string;
  /** ISO datetime of recovery; null while ongoing. */
  endTime: string | null;
  notes: string;
}

export interface GrowthEntry extends BaseEntry {
  type: 'growth';
  heightCm: number | null;
  weightKg: number | null;
  headCm: number | null;
}

export interface HistoryEntry extends BaseEntry {
  type: 'history';
  title: string;
  category: string;
  description: string;
}

export type Entry = MedicineEntry | TemperatureEntry | SicknessEntry | GrowthEntry | HistoryEntry;
export type EntryType = Entry['type'];
export type EntryOfType<T extends EntryType> = Extract<Entry, { type: T }>;

/** An entry before it is stored: no id or profile yet. */
export type NewEntry<T extends EntryType = EntryType> = T extends EntryType
  ? Omit<EntryOfType<T>, 'id' | 'profileId'>
  : never;

export const MEDICINE_UNITS = ['mL', 'mg', 'tablet'] as const;
export type MedicineUnit = (typeof MEDICINE_UNITS)[number];

export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  medicine: 'Medicine',
  temperature: 'Temperature',
  sickness: 'Sickness',
  growth: 'Growth',
  history: 'Medical history',
};

export type CategoryKind = 'sickness' | 'history';

export const DEFAULT_CATEGORIES: Record<CategoryKind, readonly string[]> = {
  sickness: ['Cold', 'Fever', 'Stomach flu', 'Diarrhea'],
  history: ['Doctor visit', 'Vaccination', 'Allergy', 'Test result', 'Surgery', 'Other'],
};
