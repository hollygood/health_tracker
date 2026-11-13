import { newId } from '../profiles/profileStorage';
import type { CategoryKind, Entry } from './entryTypes';

/** On-device storage for log entries and custom categories (localStorage). */

const ENTRIES_KEY = 'health-tracker:entries:v1';
const CATEGORIES_KEY = 'health-tracker:categories:v1';

export type CustomCategories = Record<CategoryKind, string[]>;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable or full: keep working in memory.
  }
}

export function loadEntries(): Entry[] {
  const entries = read<unknown>(ENTRIES_KEY, []);
  return Array.isArray(entries) ? (entries as Entry[]) : [];
}

export function saveEntries(entries: Entry[]): void {
  write(ENTRIES_KEY, entries);
}

/** Removes every entry that belongs to a profile (used when a profile is deleted). */
export function deleteEntriesForProfile(profileId: string): void {
  saveEntries(loadEntries().filter((e) => e.profileId !== profileId));
}

export function loadCustomCategories(): CustomCategories {
  const stored = read<Partial<CustomCategories>>(CATEGORIES_KEY, {});
  return {
    sickness: Array.isArray(stored.sickness) ? stored.sickness : [],
    history: Array.isArray(stored.history) ? stored.history : [],
  };
}

export function saveCustomCategories(categories: CustomCategories): void {
  write(CATEGORIES_KEY, categories);
}

export const newEntryId = newId;

/** Newest first. */
export function sortByTimeDesc<T extends { time: string }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => b.time.localeCompare(a.time));
}
