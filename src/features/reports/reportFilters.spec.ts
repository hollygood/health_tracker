import { describe, expect, it } from 'vitest';
import type { Entry } from '../logs/entryTypes';
import {
  availableCategories,
  entryCategory,
  entryDay,
  filterEntries,
  groupByDay,
  hasActiveFilters,
  lastDaysRange,
  NO_FILTERS,
} from './reportFilters';

/** Local-time ISO string, so the tests pass in any timezone. */
const at = (y: number, m: number, d: number, h = 12, min = 0) =>
  new Date(y, m - 1, d, h, min).toISOString();

const base = { profileId: 'p1' };
const entries: Entry[] = [
  { ...base, id: 'med', type: 'medicine', time: at(2026, 11, 10, 9, 30), medicineId: null, medicineName: 'Tylenol', amount: 5, unit: 'mL', notes: '' },
  { ...base, id: 'temp', type: 'temperature', time: at(2026, 11, 10, 9, 0), celsius: 38.5 },
  { ...base, id: 'sick', type: 'sickness', time: at(2026, 11, 9, 8, 0), endTime: null, category: 'Fever', notes: '' },
  { ...base, id: 'growth', type: 'growth', time: at(2026, 10, 1), heightCm: 88, weightKg: 12, headCm: null },
  { ...base, id: 'hist', type: 'history', time: at(2026, 9, 15, 14, 0), title: 'Flu shot', category: 'Vaccination', description: '' },
];
const ids = (list: Entry[]) => list.map((e) => e.id);

describe('filterEntries', () => {
  it('returns everything with no filters', () => {
    expect(ids(filterEntries(entries, NO_FILTERS))).toEqual(['med', 'temp', 'sick', 'growth', 'hist']);
  });

  it('filters by start date, inclusive', () => {
    expect(ids(filterEntries(entries, { ...NO_FILTERS, from: '2026-11-09' }))).toEqual(['med', 'temp', 'sick']);
  });

  it('filters by end date, inclusive', () => {
    expect(ids(filterEntries(entries, { ...NO_FILTERS, to: '2026-10-01' }))).toEqual(['growth', 'hist']);
  });

  it('filters by a date range', () => {
    expect(ids(filterEntries(entries, { ...NO_FILTERS, from: '2026-10-01', to: '2026-11-09' }))).toEqual(['sick', 'growth']);
  });

  it('includes an entry late in the evening of the last day', () => {
    const late: Entry = { ...base, id: 'late', type: 'temperature', time: at(2026, 11, 10, 23, 59), celsius: 37 };

    expect(ids(filterEntries([late], { ...NO_FILTERS, to: '2026-11-10' }))).toEqual(['late']);
    expect(ids(filterEntries([late], { ...NO_FILTERS, to: '2026-11-09' }))).toEqual([]);
  });

  it('filters by one or several types', () => {
    expect(ids(filterEntries(entries, { ...NO_FILTERS, types: ['medicine'] }))).toEqual(['med']);
    expect(ids(filterEntries(entries, { ...NO_FILTERS, types: ['temperature', 'growth'] }))).toEqual(['temp', 'growth']);
  });

  it('filters by specific category, including medicine name', () => {
    expect(ids(filterEntries(entries, { ...NO_FILTERS, categories: ['Fever'] }))).toEqual(['sick']);
    expect(ids(filterEntries(entries, { ...NO_FILTERS, categories: ['Tylenol'] }))).toEqual(['med']);
  });

  it('filters by several categories at once', () => {
    expect(ids(filterEntries(entries, { ...NO_FILTERS, categories: ['Fever', 'Vaccination'] }))).toEqual([
      'sick',
      'hist',
    ]);
  });

  it('shows an entry when either its type or its category is picked', () => {
    const filters = { ...NO_FILTERS, types: ['temperature' as const], categories: ['Fever'] };

    expect(ids(filterEntries(entries, filters))).toEqual(['temp', 'sick']);
  });

  it('applies the date range on top of the picked categories', () => {
    const filters = { from: '2026-11-10', to: '', types: ['medicine' as const], categories: ['Fever'] };

    expect(ids(filterEntries(entries, filters))).toEqual(['med']);
  });
});

describe('report helpers', () => {
  it('gives the category of each entry type', () => {
    expect(entries.map(entryCategory)).toEqual(['Tylenol', null, 'Fever', null, 'Vaccination']);
  });

  it('lists the categories in use, A to Z, without duplicates', () => {
    expect(availableCategories([...entries, entries[2]])).toEqual(['Fever', 'Tylenol', 'Vaccination']);
  });

  it('groups entries by local day, keeping their order', () => {
    const groups = groupByDay(entries);

    expect(groups.map((g) => g.day)).toEqual(['2026-11-10', '2026-11-09', '2026-10-01', '2026-09-15']);
    expect(ids(groups[0].entries)).toEqual(['med', 'temp']);
  });

  it('gives the local day of an entry', () => {
    expect(entryDay(entries[0])).toBe('2026-11-10');
  });

  it('builds a last-N-days range ending today', () => {
    const today = new Date(2026, 10, 11, 15, 0);

    expect(lastDaysRange(7, today)).toEqual({ from: '2026-11-05', to: '2026-11-11' });
    expect(lastDaysRange(30, today)).toEqual({ from: '2026-10-13', to: '2026-11-11' });
    expect(lastDaysRange(1, today)).toEqual({ from: '2026-11-11', to: '2026-11-11' });
  });

  it('knows whether any filter is set', () => {
    expect(hasActiveFilters(NO_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...NO_FILTERS, types: ['growth'] })).toBe(true);
    expect(hasActiveFilters({ ...NO_FILTERS, categories: ['Fever'] })).toBe(true);
    expect(hasActiveFilters({ ...NO_FILTERS, from: '2026-01-01' })).toBe(true);
  });
});
