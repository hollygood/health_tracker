import { useState, type FormEvent } from 'react';
import RichTextEditor from '../../../components/richText/RichTextEditor';
import { appendPlainText, normalizeRich } from '../../../components/richText/richTextFormat';
import type { Profile } from '../../profiles/profileStorage';
import CategoryPicker from '../CategoryPicker';
import EntryFormFooter from '../EntryFormFooter';
import type { HistoryEntry, NewEntry } from '../entryTypes';
import { inputValueToIso, toDateTimeInputValue } from '../formatters';
import LogPageLayout, { type LogPageProps } from '../LogPageLayout';
import { useCategories } from '../useCategories';
import { useEntries } from '../useEntries';
import { useEntryEditor, type EditRequest } from '../useEntryEditor';
import HistoryNoteList from './HistoryNoteList';
import PhotoToText from './PhotoToText';

export default function MedicalHistoryPage({
  profile,
  editEntryId,
  onEditDone,
  ...layout
}: LogPageProps) {
  return (
    <LogPageLayout title="Medical history" profile={profile} {...layout}>
      {profile && (
        <MedicalHistory
          key={profile.id}
          profile={profile}
          editEntryId={editEntryId}
          onEditDone={onEditDone}
        />
      )}
    </LogPageLayout>
  );
}

function MedicalHistory({ profile, ...editRequest }: { profile: Profile } & EditRequest) {
  const entriesApi = useEntries(profile.id, 'history');
  const editor = useEntryEditor(entriesApi, editRequest);

  return (
    <>
      <MedicalHistoryForm
        key={editor.formKey}
        initial={editor.editing}
        onSave={editor.save}
        onCancel={editor.cancelEditing}
      />
      <HistoryNoteList
        entries={entriesApi.entries}
        onEdit={editor.startEditing}
        onDelete={editor.remove}
        editingId={editor.editing?.id}
      />
    </>
  );
}

interface FormProps {
  /** The entry to edit, or null to add a new one. */
  initial: HistoryEntry | null;
  onSave: (fields: NewEntry<'history'>) => void;
  onCancel: () => void;
}

function MedicalHistoryForm({ initial, onSave, onCancel }: FormProps) {
  const [categories, addCategory] = useCategories('history');

  const [time, setTime] = useState(() =>
    toDateTimeInputValue(initial ? new Date(initial.time) : new Date()),
  );
  const [title, setTitle] = useState(initial?.title ?? '');
  const [category, setCategory] = useState(initial?.category ?? categories[0]);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const iso = inputValueToIso(time);
    if (!iso) return setError('Enter the date and time.');
    if (!title.trim()) return setError('Enter a title.');

    onSave({
      type: 'history',
      time: iso,
      title: title.trim(),
      category,
      description: normalizeRich(description),
    });
  };

  return (
    <form
      className="card"
      onSubmit={handleSubmit}
      aria-label={initial ? 'Edit medical history' : 'Add medical history'}
      noValidate
    >
      <div className="field">
        <label className="field-label" htmlFor="history-title">
          Title
        </label>
        <input
          id="history-title"
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="history-time">
          Date and time
        </label>
        <input
          id="history-time"
          className="input"
          type="datetime-local"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </div>

      <CategoryPicker
        id="history-category"
        categories={categories}
        value={category}
        onChange={setCategory}
        onAddCategory={addCategory}
      />

      <RichTextEditor
        id="history-description"
        label="Description"
        value={description}
        onChange={setDescription}
      />
      <PhotoToText onText={(text) => setDescription((current) => appendPlainText(current, text))} />

      <EntryFormFooter
        error={error}
        addLabel="Save to medical history"
        editing={initial !== null}
        onCancel={onCancel}
      />
    </form>
  );
}
