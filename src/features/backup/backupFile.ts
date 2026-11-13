import {
  loadCustomCategories,
  loadEntries,
  saveCustomCategories,
  saveEntries,
  type CustomCategories,
} from '../logs/entryStorage';
import { ENTRY_TYPE_LABELS, type Entry } from '../logs/entryTypes';
import { toDateInputValue } from '../logs/formatters';
import { loadData, saveData, type AppData, type Profile } from '../profiles/profileStorage';

/**
 * Backup file: everything the app stores on this device, as one JSON file.
 * Bump BACKUP_VERSION when the stored shapes change, and convert older files in parseBackup.
 */
export const BACKUP_APP = 'health-tracker';
export const BACKUP_VERSION = 1;

export interface BackupFile {
  app: typeof BACKUP_APP;
  version: number;
  /** ISO datetime the backup was made. */
  exportedAt: string;
  profiles: Profile[];
  activeProfileId: string | null;
  entries: Entry[];
  categories: CustomCategories;
}

/** Collects everything stored on this device. */
export function createBackup(now = new Date()): BackupFile {
  const { profiles, activeProfileId } = loadData();
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    profiles,
    activeProfileId,
    entries: loadEntries(),
    categories: loadCustomCategories(),
  };
}

export const backupFileName = (now = new Date()) =>
  `health-tracker-backup-${toDateInputValue(now)}.json`;

export const serializeBackup = (backup: BackupFile) => `${JSON.stringify(backup, null, 2)}\n`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === 'string';
const stringList = (value: unknown) => (Array.isArray(value) ? value.filter(isString) : []);

function isProfile(value: unknown): value is Profile {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.birthday) &&
    (value.sex === 'female' || value.sex === 'male')
  );
}

function isEntry(value: unknown): value is Entry {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.profileId) &&
    isString(value.time) &&
    isString(value.type) &&
    value.type in ENTRY_TYPE_LABELS
  );
}

/**
 * Reads and checks a backup file. Throws an Error whose message can be shown to the
 * user if the file is not a usable Health Tracker backup.
 */
export function parseBackup(text: string): BackupFile {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file is not a Health Tracker backup (it could not be read).');
  }
  if (!isRecord(data) || data.app !== BACKUP_APP) {
    throw new Error('That file is not a Health Tracker backup.');
  }
  if (typeof data.version !== 'number' || data.version > BACKUP_VERSION) {
    throw new Error('That backup was made by a newer version of the app. Update the app, then try again.');
  }
  const { profiles, entries, activeProfileId: savedActiveId } = data;
  if (!Array.isArray(profiles) || !profiles.every(isProfile)) {
    throw new Error('That backup is damaged: its profiles could not be read.');
  }
  if (!Array.isArray(entries) || !entries.every(isEntry)) {
    throw new Error('That backup is damaged: its entries could not be read.');
  }

  const categories = isRecord(data.categories) ? data.categories : {};
  const activeProfileId =
    isString(savedActiveId) && profiles.some((p) => p.id === savedActiveId)
      ? savedActiveId
      : (profiles[0]?.id ?? null);

  return {
    app: BACKUP_APP,
    version: data.version,
    exportedAt: isString(data.exportedAt) ? data.exportedAt : '',
    profiles,
    activeProfileId,
    entries,
    categories: {
      sickness: stringList(categories.sickness),
      history: stringList(categories.history),
    },
  };
}

export type RestoreMode =
  /** Throw away what is on this device and use the backup. */
  | 'replace'
  /** Keep what is on this device and add anything from the backup that is not here. */
  | 'merge';

export interface RestoreResult {
  profilesAdded: number;
  entriesAdded: number;
}

const mergeById = <T extends { id: string }>(current: T[], incoming: T[]) => {
  const known = new Set(current.map((item) => item.id));
  const added = incoming.filter((item) => !known.has(item.id));
  return { merged: [...current, ...added], added: added.length };
};

const mergeNames = (current: string[], incoming: string[]) => {
  const known = new Set(current.map((name) => name.toLowerCase()));
  return [...current, ...incoming.filter((name) => !known.has(name.toLowerCase()))];
};

/** Writes a backup into on-device storage. */
export function restoreBackup(backup: BackupFile, mode: RestoreMode): RestoreResult {
  if (mode === 'replace') {
    saveData({ profiles: backup.profiles, activeProfileId: backup.activeProfileId });
    saveEntries(backup.entries);
    saveCustomCategories(backup.categories);
    return { profilesAdded: backup.profiles.length, entriesAdded: backup.entries.length };
  }

  const current: AppData = loadData();
  const profiles = mergeById(current.profiles, backup.profiles);
  const entries = mergeById(loadEntries(), backup.entries);
  const categories = loadCustomCategories();

  saveData({
    profiles: profiles.merged,
    activeProfileId: current.activeProfileId ?? backup.activeProfileId,
  });
  saveEntries(entries.merged);
  saveCustomCategories({
    sickness: mergeNames(categories.sickness, backup.categories.sickness),
    history: mergeNames(categories.history, backup.categories.history),
  });
  return { profilesAdded: profiles.added, entriesAdded: entries.added };
}

/** Reads a chosen file as text. */
export function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('The file could not be read.'));
    reader.readAsText(file);
  });
}
