import { describe, expect, it } from 'vitest';
import { leo, mia, sampleEntries } from '../../test/fixtures';
import { loadCustomCategories, loadEntries, saveCustomCategories, saveEntries } from '../logs/entryStorage';
import type { Entry } from '../logs/entryTypes';
import { loadData, saveData } from '../profiles/profileStorage';
import {
  backupFileName,
  createBackup,
  parseBackup,
  restoreBackup,
  serializeBackup,
  type BackupFile,
} from './backupFile';

const backup = (overrides: Partial<BackupFile> = {}): BackupFile => ({
  app: 'health-tracker',
  version: 1,
  exportedAt: '2026-11-13T20:00:00.000Z',
  profiles: [leo],
  activeProfileId: leo.id,
  entries: sampleEntries,
  categories: { sickness: ['Ear infection'], history: [] },
  ...overrides,
});

function fillDevice() {
  saveData({ profiles: [leo, mia], activeProfileId: mia.id });
  saveEntries(sampleEntries);
  saveCustomCategories({ sickness: ['Ear infection'], history: ['Dentist'] });
}

describe('createBackup', () => {
  it('collects profiles, entries and custom categories', () => {
    fillDevice();

    expect(createBackup(new Date('2026-11-13T20:00:00.000Z'))).toEqual({
      app: 'health-tracker',
      version: 1,
      exportedAt: '2026-11-13T20:00:00.000Z',
      profiles: [leo, mia],
      activeProfileId: mia.id,
      entries: sampleEntries,
      categories: { sickness: ['Ear infection'], history: ['Dentist'] },
    });
  });

  it('works on an empty device', () => {
    expect(createBackup()).toEqual(
      expect.objectContaining({ profiles: [], activeProfileId: null, entries: [] }),
    );
  });

  it('names the file by date', () => {
    expect(backupFileName(new Date(2026, 10, 13, 15, 0))).toBe('health-tracker-backup-2026-11-13.json');
  });
});

describe('parseBackup', () => {
  it('reads back what serializeBackup wrote', () => {
    expect(parseBackup(serializeBackup(backup()))).toEqual(backup());
  });

  it('rejects a file that is not JSON', () => {
    expect(() => parseBackup('# Health report: Leo')).toThrow('not a Health Tracker backup');
  });

  it('rejects JSON from somewhere else', () => {
    expect(() => parseBackup('{"profiles":[]}')).toThrow('That file is not a Health Tracker backup.');
    expect(() => parseBackup('[1,2,3]')).toThrow('That file is not a Health Tracker backup.');
  });

  it('rejects a backup from a newer version of the app', () => {
    expect(() => parseBackup(JSON.stringify(backup({ version: 2 })))).toThrow('newer version');
  });

  it('rejects a backup with a damaged profile or entry', () => {
    const badProfile = { ...backup(), profiles: [{ id: 'x', name: 'No birthday' }] };
    const badEntry = { ...backup(), entries: [{ id: 'e', type: 'mystery', profileId: 'p', time: 't' }] };

    expect(() => parseBackup(JSON.stringify(badProfile))).toThrow('its profiles could not be read');
    expect(() => parseBackup(JSON.stringify(badEntry))).toThrow('its entries could not be read');
  });

  it('falls back to the first profile when the active one is not in the file', () => {
    const parsed = parseBackup(JSON.stringify(backup({ activeProfileId: 'gone' })));

    expect(parsed.activeProfileId).toBe(leo.id);
  });

  it('tolerates missing categories', () => {
    const { categories: _omitted, ...withoutCategories } = backup();

    expect(parseBackup(JSON.stringify(withoutCategories)).categories).toEqual({ sickness: [], history: [] });
  });
});

describe('restoreBackup', () => {
  it('replaces everything on the device', () => {
    saveData({ profiles: [mia], activeProfileId: mia.id });
    saveEntries([{ ...sampleEntries[1], id: 'old', profileId: mia.id }]);
    saveCustomCategories({ sickness: ['Old'], history: [] });

    const result = restoreBackup(backup(), 'replace');

    expect(result).toEqual({ profilesAdded: 1, entriesAdded: 5 });
    expect(loadData()).toEqual({ profiles: [leo], activeProfileId: leo.id });
    expect(loadEntries()).toEqual(sampleEntries);
    expect(loadCustomCategories()).toEqual({ sickness: ['Ear infection'], history: [] });
  });

  it('merges: keeps what is here and adds only what is missing', () => {
    saveData({ profiles: [mia, leo], activeProfileId: mia.id });
    saveEntries(sampleEntries.slice(0, 2));
    saveCustomCategories({ sickness: ['ear infection'], history: ['Dentist'] });

    const result = restoreBackup(backup(), 'merge');

    expect(result).toEqual({ profilesAdded: 0, entriesAdded: 3 });
    expect(loadData()).toEqual({ profiles: [mia, leo], activeProfileId: mia.id });
    expect(loadEntries().map((e) => e.id)).toEqual(['e-med', 'e-temp', 'e-sick', 'e-growth', 'e-hist']);
    // "Ear infection" is already here under different capitalisation
    expect(loadCustomCategories()).toEqual({ sickness: ['ear infection'], history: ['Dentist'] });
  });

  it('merges into an empty device, taking the active profile from the backup', () => {
    const result = restoreBackup(backup(), 'merge');

    expect(result).toEqual({ profilesAdded: 1, entriesAdded: 5 });
    expect(loadData()).toEqual({ profiles: [leo], activeProfileId: leo.id });
  });

  it('does not overwrite an entry that was changed on this device when merging', () => {
    const edited: Entry = {
      id: 'e-temp',
      profileId: leo.id,
      type: 'temperature',
      time: sampleEntries[1].time,
      celsius: 39.9,
    };
    saveData({ profiles: [leo], activeProfileId: leo.id });
    saveEntries([edited]);

    restoreBackup(backup(), 'merge');

    expect(loadEntries().find((e) => e.id === 'e-temp')).toEqual(edited);
  });

  it('round-trips a whole device through a backup file', () => {
    fillDevice();
    const file = serializeBackup(createBackup());
    localStorage.clear();

    restoreBackup(parseBackup(file), 'replace');

    expect(loadData()).toEqual({ profiles: [leo, mia], activeProfileId: mia.id });
    expect(loadEntries()).toEqual(sampleEntries);
    expect(loadCustomCategories()).toEqual({ sickness: ['Ear infection'], history: ['Dentist'] });
  });
});
