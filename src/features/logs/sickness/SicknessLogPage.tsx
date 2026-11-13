import { useState, type FormEvent } from 'react';
import type { Profile } from '../../profiles/profileStorage';
import CategoryPicker from '../CategoryPicker';
import EntryFormFooter from '../EntryFormFooter';
import type { NewEntry, SicknessEntry } from '../entryTypes';
import { inputValueToIso, toDateTimeInputValue } from '../formatters';
import LogPageLayout, { type LogPageProps } from '../LogPageLayout';
import RecentEntries from '../RecentEntries';
import { useCategories } from '../useCategories';
import { useEntries } from '../useEntries';
import { useEntryEditor, type EditRequest } from '../useEntryEditor';

export default function SicknessLogPage({
  profile,
  editEntryId,
  onEditDone,
  ...layout
}: LogPageProps) {
  return (
    <LogPageLayout title="Sickness" profile={profile} {...layout}>
      {profile && (
        <SicknessLog
          key={profile.id}
          profile={profile}
          editEntryId={editEntryId}
          onEditDone={onEditDone}
        />
      )}
    </LogPageLayout>
  );
}

function SicknessLog({ profile, ...editRequest }: { profile: Profile } & EditRequest) {
  const entriesApi = useEntries(profile.id, 'sickness');
  const editor = useEntryEditor(entriesApi, editRequest);

  return (
    <>
      <SicknessForm
        key={editor.formKey}
        initial={editor.editing}
        onSave={editor.save}
        onCancel={editor.cancelEditing}
      />
      <RecentEntries
        entries={entriesApi.entries}
        onEdit={editor.startEditing}
        onDelete={editor.remove}
        editingId={editor.editing?.id}
        emptyText="No sickness logged yet."
        renderActions={(entry) =>
          entry.endTime === null &&
          entry.id !== editor.editing?.id && (
            <button
              className="btn btn-soft"
              onClick={() => entriesApi.updateEntry(entry.id, { endTime: new Date().toISOString() })}
            >
              Mark as recovered now
            </button>
          )
        }
      />
    </>
  );
}

interface FormProps {
  /** The entry to edit, or null to add a new one. */
  initial: SicknessEntry | null;
  onSave: (fields: NewEntry<'sickness'>) => void;
  onCancel: () => void;
}

function SicknessForm({ initial, onSave, onCancel }: FormProps) {
  const [categories, addCategory] = useCategories('sickness');

  const [start, setStart] = useState(() =>
    toDateTimeInputValue(initial ? new Date(initial.time) : new Date()),
  );
  const [end, setEnd] = useState(() =>
    initial?.endTime ? toDateTimeInputValue(new Date(initial.endTime)) : '',
  );
  const [category, setCategory] = useState(initial?.category ?? categories[0]);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const startIso = inputValueToIso(start);
    const endIso = inputValueToIso(end);
    if (!startIso) return setError('Enter when the sickness started.');
    if (end && !endIso) return setError('Enter a valid end time, or leave it empty.');
    if (endIso && endIso < startIso) return setError('The end time is before the start time.');

    onSave({ type: 'sickness', time: startIso, endTime: endIso, category, notes: notes.trim() });
  };

  return (
    <form
      className="card"
      onSubmit={handleSubmit}
      aria-label={initial ? 'Edit sickness' : 'Log sickness'}
      noValidate
    >
      <div className="field">
        <label className="field-label" htmlFor="sickness-start">
          Start time
        </label>
        <input
          id="sickness-start"
          className="input"
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="sickness-end">
          End time (optional)
        </label>
        <input
          id="sickness-end"
          className="input"
          type="datetime-local"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
        <p className="text-sm text-muted">Leave empty while still sick. You can add it later.</p>
      </div>

      <CategoryPicker
        id="sickness-category"
        categories={categories}
        value={category}
        onChange={setCategory}
        onAddCategory={addCategory}
      />

      <div className="field">
        <label className="field-label" htmlFor="sickness-notes">
          Notes
        </label>
        <textarea
          id="sickness-notes"
          className="input textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <EntryFormFooter
        error={error}
        addLabel="Save sickness"
        editing={initial !== null}
        onCancel={onCancel}
      />
    </form>
  );
}
