import { describe, expect, it } from 'vitest';
import { leo, sampleEntries } from '../../test/fixtures';
import {
  deleteEntriesForProfile,
  loadCustomCategories,
  loadEntries,
  saveCustomCategories,
  saveEntries,
  sortByTimeDesc,
} from './entryStorage';

describe('entryStorage', () => {
  it('starts with no entries and no custom categories', () => {
    expect(loadEntries()).toEqual([]);
    expect(loadCustomCategories()).toEqual({ sickness: [], history: [] });
  });

  it('round-trips entries', () => {
    saveEntries(sampleEntries);

    expect(loadEntries()).toEqual(sampleEntries);
  });

  it('falls back to empty when stored entries are corrupt', () => {
    localStorage.setItem('health-tracker:entries:v1', '{oops');

    expect(loadEntries()).toEqual([]);
  });

  it("deletes only one profile's entries", () => {
    const other = { ...sampleEntries[1], id: 'e-other', profileId: 'p-other' };
    saveEntries([...sampleEntries, other]);

    deleteEntriesForProfile(leo.id);

    expect(loadEntries()).toEqual([other]);
  });

  it('round-trips custom categories', () => {
    saveCustomCategories({ sickness: ['Ear infection'], history: [] });

    expect(loadCustomCategories()).toEqual({ sickness: ['Ear infection'], history: [] });
  });

  it('sorts newest first', () => {
    const sorted = sortByTimeDesc([...sampleEntries].reverse());

    expect(sorted.map((e) => e.id)).toEqual(['e-med', 'e-temp', 'e-sick', 'e-growth', 'e-hist']);
  });
});
