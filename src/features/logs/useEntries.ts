import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadEntries, newEntryId, saveEntries, sortByTimeDesc } from './entryStorage';
import type { Entry, EntryOfType, EntryType, NewEntry } from './entryTypes';

export interface EntriesApi<T extends EntryType> {
  /** This profile's entries of the requested type, newest first. */
  entries: EntryOfType<T>[];
  addEntry: (entry: NewEntry<T>) => void;
  updateEntry: (id: string, changes: Partial<NewEntry<T>>) => void;
  deleteEntry: (id: string) => void;
}

/** One profile's log entries of one type, kept in sync with on-device storage. */
export function useEntries<T extends EntryType>(profileId: string, type: T): EntriesApi<T> {
  const [all, setAll] = useState<Entry[]>(loadEntries);

  useEffect(() => saveEntries(all), [all]);

  const entries = useMemo(
    () =>
      sortByTimeDesc(
        all.filter((e) => e.profileId === profileId && e.type === type),
      ) as unknown as EntryOfType<T>[],
    [all, profileId, type],
  );

  const addEntry = useCallback(
    (entry: NewEntry<T>) => {
      const fields = entry as unknown as NewEntry;
      setAll((prev) => [...prev, { ...fields, id: newEntryId(), profileId } as Entry]);
    },
    [profileId],
  );

  const updateEntry = useCallback((id: string, changes: Partial<NewEntry<T>>) => {
    const fields = changes as unknown as Partial<Entry>;
    setAll((prev) => prev.map((e) => (e.id === id ? ({ ...e, ...fields } as unknown as Entry) : e)));
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setAll((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { entries, addEntry, updateEntry, deleteEntry };
}
