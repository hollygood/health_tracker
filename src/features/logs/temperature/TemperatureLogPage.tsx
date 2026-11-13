import { useState, type FormEvent } from 'react';
import SegmentedControl from '../../../components/SegmentedControl';
import type { Profile } from '../../profiles/profileStorage';
import EntryFormFooter from '../EntryFormFooter';
import type { NewEntry, TemperatureEntry } from '../entryTypes';
import {
  fahrenheitToCelsius,
  inputValueToIso,
  parseNumber,
  round,
  toDateTimeInputValue,
} from '../formatters';
import LogPageLayout, { type LogPageProps } from '../LogPageLayout';
import RecentEntries from '../RecentEntries';
import { useEntries } from '../useEntries';
import { useEntryEditor, type EditRequest } from '../useEntryEditor';

type TemperatureUnit = 'C' | 'F';

const UNIT_OPTIONS = [
  { value: 'C', label: '°C' },
  { value: 'F', label: '°F' },
] as const;

/** Readings outside this range are almost certainly typos. */
const MIN_CELSIUS = 30;
const MAX_CELSIUS = 45;

export default function TemperatureLogPage({
  profile,
  editEntryId,
  onEditDone,
  ...layout
}: LogPageProps) {
  return (
    <LogPageLayout title="Temperature" profile={profile} {...layout}>
      {profile && (
        <TemperatureLog
          key={profile.id}
          profile={profile}
          editEntryId={editEntryId}
          onEditDone={onEditDone}
        />
      )}
    </LogPageLayout>
  );
}

function TemperatureLog({ profile, ...editRequest }: { profile: Profile } & EditRequest) {
  const entriesApi = useEntries(profile.id, 'temperature');
  const editor = useEntryEditor(entriesApi, editRequest);

  return (
    <>
      <TemperatureForm
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
        emptyText="No temperature logged yet."
      />
    </>
  );
}

interface FormProps {
  /** The entry to edit, or null to add a new one. */
  initial: TemperatureEntry | null;
  onSave: (fields: NewEntry<'temperature'>) => void;
  onCancel: () => void;
}

function TemperatureForm({ initial, onSave, onCancel }: FormProps) {
  const [time, setTime] = useState(() =>
    toDateTimeInputValue(initial ? new Date(initial.time) : new Date()),
  );
  const [valueText, setValueText] = useState(initial ? String(initial.celsius) : '');
  const [unit, setUnit] = useState<TemperatureUnit>('C');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const iso = inputValueToIso(time);
    const value = parseNumber(valueText);
    if (!iso) return setError('Enter the time of the reading.');
    if (value === null) return setError('Enter the temperature.');

    const celsius = unit === 'C' ? round(value, 1) : fahrenheitToCelsius(value);
    if (celsius < MIN_CELSIUS || celsius > MAX_CELSIUS) {
      return setError('Enter a temperature between 30 and 45 °C (86 and 113 °F).');
    }

    onSave({ type: 'temperature', time: iso, celsius });
  };

  return (
    <form
      className="card"
      onSubmit={handleSubmit}
      aria-label={initial ? 'Edit temperature' : 'Log temperature'}
      noValidate
    >
      <div className="field">
        <label className="field-label" htmlFor="temperature-time">
          Start time
        </label>
        <input
          id="temperature-time"
          className="input"
          type="datetime-local"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="temperature-value">
          Temperature
        </label>
        <div className="flex gap-2.5">
          <input
            id="temperature-value"
            className="input min-w-0 flex-1"
            type="number"
            inputMode="decimal"
            step="0.1"
            placeholder={unit === 'C' ? 'e.g. 38.5' : 'e.g. 101.3'}
            value={valueText}
            onChange={(e) => setValueText(e.target.value)}
          />
          <SegmentedControl
            options={UNIT_OPTIONS}
            value={unit}
            onChange={setUnit}
            ariaLabel="Temperature unit"
          />
        </div>
      </div>

      <EntryFormFooter
        error={error}
        addLabel="Save temperature"
        editing={initial !== null}
        onCancel={onCancel}
      />
    </form>
  );
}
