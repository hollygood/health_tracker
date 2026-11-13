import { useCallback, useState } from 'react';
import type { EntryOfType, EntryType, NewEntry } from './entryTypes';
import type { EntriesApi } from './useEntries';

export interface EntryEditor<T extends EntryType> {
  /** The entry being edited, or null when the form is adding a new one. */
  editing: EntryOfType<T> | null;
  /** Changes whenever the form should start fresh; use it as the form's `key`. */
  formKey: string;
  startEditing: (entry: EntryOfType<T>) => void;
  cancelEditing: () => void;
  /** Adds a new entry, or updates the one being edited, then resets the form. */
  save: (fields: NewEntry<T>) => void;
  /** Deletes an entry; stops editing first if it is the one being edited. */
  remove: (id: string) => void;
}

/** An edit requested from another page (Reports). */
export interface EditRequest {
  /** Id of the entry to open for editing when the page loads. */
  editEntryId?: string | null;
  /** Called once that edit is saved, cancelled, or the entry is deleted. */
  onEditDone?: () => void;
}

/** Add / edit / delete flow shared by every log page. */
export function useEntryEditor<T extends EntryType>(
  api: EntriesApi<T>,
  { editEntryId = null, onEditDone }: EditRequest = {},
): EntryEditor<T> {
  const { entries, addEntry, updateEntry, deleteEntry } = api;
  const [editing, setEditing] = useState<EntryOfType<T> | null>(
    () => entries.find((e) => e.id === editEntryId) ?? null,
  );
  // Id of the entry whose edit was requested from another page, until that edit ends.
  const [requestedId, setRequestedId] = useState<string | null>(() =>
    entries.some((e) => e.id === editEntryId) ? editEntryId : null,
  );
  const [savedCount, setSavedCount] = useState(0);

  const finish = useCallback(
    (id: string | undefined) => {
      setEditing(null);
      if (id && id === requestedId) {
        setRequestedId(null);
        onEditDone?.();
      }
    },
    [requestedId, onEditDone],
  );

  const startEditing = useCallback((entry: EntryOfType<T>) => {
    setEditing(entry);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const cancelEditing = useCallback(() => finish(editing?.id), [editing, finish]);

  const save = useCallback(
    (fields: NewEntry<T>) => {
      if (editing) updateEntry(editing.id, fields);
      else addEntry(fields);
      setSavedCount((n) => n + 1);
      finish(editing?.id);
    },
    [editing, addEntry, updateEntry, finish],
  );

  const remove = useCallback(
    (id: string) => {
      deleteEntry(id);
      if (editing?.id === id) finish(id);
    },
    [editing, deleteEntry, finish],
  );

  return {
    editing,
    formKey: editing ? `edit-${editing.id}` : `new-${savedCount}`,
    startEditing,
    cancelEditing,
    save,
    remove,
  };
}
