import type { Entry, EntryType } from '../logs/entryTypes';
import { toDateInputValue } from '../logs/formatters';

export interface ReportFilters {
  /** First day to include, yyyy-mm-dd (local). Empty = no lower limit. */
  from: string;
  /** Last day to include, yyyy-mm-dd (local). Empty = no upper limit. */
  to: string;
  /** Entry types picked in the Category dropdown. */
  types: EntryType[];
  /** Specific categories picked in the Category dropdown (see `entryCategory`). */
  categories: string[];
}

export const NO_FILTERS: ReportFilters = { from: '', to: '', types: [], categories: [] };

export function hasActiveFilters(filters: ReportFilters): boolean {
  return Boolean(filters.from || filters.to || filters.types.length || filters.categories.length);
}

/** The local calendar day an entry falls on, yyyy-mm-dd. */
export const entryDay = (entry: Entry) => toDateInputValue(new Date(entry.time));

/**
 * The specific category of an entry: the sickness or medical-history category, or
 * the medicine's name. Temperature and growth have none.
 */
export function entryCategory(entry: Entry): string | null {
  switch (entry.type) {
    case 'medicine':
      return entry.medicineName;
    case 'sickness':
    case 'history':
      return entry.category;
    default:
      return null;
  }
}

/**
 * Applies the filters. The order of the entries is kept.
 *
 * The date range always applies. Within it, an entry is shown when its type or its
 * specific category is one of the picked ones; with nothing picked, everything is shown.
 */
export function filterEntries(entries: Entry[], filters: ReportFilters): Entry[] {
  const { from, to, types, categories } = filters;
  const nothingPicked = types.length === 0 && categories.length === 0;

  return entries.filter((entry) => {
    const day = entryDay(entry);
    if (from && day < from) return false;
    if (to && day > to) return false;
    if (nothingPicked) return true;
    const category = entryCategory(entry);
    return types.includes(entry.type) || (category !== null && categories.includes(category));
  });
}

export interface DayGroup {
  /** yyyy-mm-dd (local) */
  day: string;
  entries: Entry[];
}

/** Groups consecutive entries by local day, keeping the order they arrive in. */
export function groupByDay(entries: Entry[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const entry of entries) {
    const day = entryDay(entry);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.entries.push(entry);
    else groups.push({ day, entries: [entry] });
  }
  return groups;
}

/** Categories used by these entries, A to Z, without duplicates. */
export function availableCategories(entries: Entry[]): string[] {
  const found = new Set<string>();
  for (const entry of entries) {
    const category = entryCategory(entry);
    if (category) found.add(category);
  }
  return [...found].sort((a, b) => a.localeCompare(b));
}

/** Date range covering the last `days` days, ending today. */
export function lastDaysRange(days: number, today = new Date()): Pick<ReportFilters, 'from' | 'to'> {
  const from = new Date(today);
  from.setDate(from.getDate() - (days - 1));
  return { from: toDateInputValue(from), to: toDateInputValue(today) };
}
