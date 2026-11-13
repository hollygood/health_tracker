import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadEntries, saveEntries, sortByTimeDesc } from './entryStorage';
import type { Entry } from './entryTypes';

/** Every entry of one profile, of all types, newest first. Used by Reports. */
export function useProfileEntries(profileId: string): {
  entries: Entry[];
  deleteEntry: (id: string) => void;
} {
  const [all, setAll] = useState<Entry[]>(loadEntries);

  useEffect(() => saveEntries(all), [all]);

  const entries = useMemo(
    () => sortByTimeDesc(all.filter((e) => e.profileId === profileId)),
    [all, profileId],
  );

  const deleteEntry = useCallback((id: string) => {
    setAll((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { entries, deleteEntry };
}
