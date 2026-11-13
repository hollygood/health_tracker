import { useState, type FormEvent } from 'react';
import { FaChartLine } from 'react-icons/fa6';
import SegmentedControl from '../../../components/SegmentedControl';
import type { Profile } from '../../profiles/profileStorage';
import EntryFormFooter from '../EntryFormFooter';
import type { GrowthEntry, NewEntry } from '../entryTypes';
import { inputValueToIso, lbToKg, parseNumber, round, toDateInputValue } from '../formatters';
import LogPageLayout, { type LogPageProps } from '../LogPageLayout';
import RecentEntries from '../RecentEntries';
import { useEntries } from '../useEntries';
import { useEntryEditor, type EditRequest } from '../useEntryEditor';

interface Props extends LogPageProps {
  onSaveProfile: (profile: Profile) => void;
  /** Opens the growth chart for this profile. */
  onOpenChart: () => void;
}

const WEIGHT_UNIT_OPTIONS = [
  { value: 'kg', label: 'kg' },
  { value: 'lb', label: 'pounds' },
] as const;

export default function GrowthLogPage({
  profile,
  onSaveProfile,
  onOpenChart,
  editEntryId,
  onEditDone,
  ...layout
}: Props) {
  return (
    <LogPageLayout title="Growth" profile={profile} {...layout}>
      {profile && (
        <GrowthLog
          key={profile.id}
          profile={profile}
          onSaveProfile={onSaveProfile}
          onOpenChart={onOpenChart}
          editEntryId={editEntryId}
          onEditDone={onEditDone}
        />
      )}
    </LogPageLayout>
  );
}

type LogProps = { profile: Profile } & Pick<Props, 'onSaveProfile' | 'onOpenChart'> & EditRequest;

function GrowthLog({ profile, onSaveProfile, onOpenChart, ...editRequest }: LogProps) {
  const entriesApi = useEntries(profile.id, 'growth');
  const editor = useEntryEditor(entriesApi, editRequest);

  const handleSave = (fields: NewEntry<'growth'>) => {
    editor.save(fields);

    // Keep the profile's weight (used for dose suggestions) on the latest measurement.
    // Compared by calendar day, so a measurement dated today replaces a weight saved earlier today.
    const measuredOn = toDateInputValue(new Date(fields.time));
    const savedOn = profile.weightUpdatedAt && toDateInputValue(new Date(profile.weightUpdatedAt));
    if (fields.weightKg !== null && (!savedOn || measuredOn >= savedOn)) {
      onSaveProfile({ ...profile, weightKg: fields.weightKg, weightUpdatedAt: fields.time });
    }
  };

  return (
    <>
      <button className="btn btn-soft" onClick={onOpenChart}>
        <FaChartLine aria-hidden="true" /> View growth chart
      </button>
      <GrowthForm
        key={editor.formKey}
        profileName={profile.name}
        initial={editor.editing}
        onSave={handleSave}
        onCancel={editor.cancelEditing}
      />
      <RecentEntries
        entries={entriesApi.entries}
        onEdit={editor.startEditing}
        onDelete={editor.remove}
        editingId={editor.editing?.id}
        emptyText="No growth logged yet."
      />
    </>
  );
}

interface FormProps {
  profileName: string;
  /** The entry to edit, or null to add a new one. */
  initial: GrowthEntry | null;
  onSave: (fields: NewEntry<'growth'>) => void;
  onCancel: () => void;
}

const numberText = (n: number | null | undefined) => (n == null ? '' : String(n));

function GrowthForm({ profileName, initial, onSave, onCancel }: FormProps) {
  const [date, setDate] = useState(() =>
    toDateInputValue(initial ? new Date(initial.time) : new Date()),
  );
  const [heightText, setHeightText] = useState(numberText(initial?.heightCm));
  const [weightText, setWeightText] = useState(numberText(initial?.weightKg));
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [headText, setHeadText] = useState(numberText(initial?.headCm));
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const iso = inputValueToIso(date);
    const height = parseNumber(heightText);
    const weight = parseNumber(weightText);
    const head = parseNumber(headText);
    if (!iso) return setError('Enter the date of the measurement.');
    if (height === null && weight === null && head === null) {
      return setError('Enter at least one measurement.');
    }
    if ([height, weight, head].some((n) => n !== null && n <= 0)) {
      return setError('Measurements must be greater than 0.');
    }

    onSave({
      type: 'growth',
      time: iso,
      heightCm: height === null ? null : round(height, 1),
      weightKg: weight === null ? null : weightUnit === 'kg' ? round(weight, 2) : lbToKg(weight),
      headCm: head === null ? null : round(head, 1),
    });
  };

  return (
    <form
      className="card"
      onSubmit={handleSubmit}
      aria-label={initial ? 'Edit growth' : 'Log growth'}
      noValidate
    >
      <div className="field">
        <label className="field-label" htmlFor="growth-date">
          Date
        </label>
        <input
          id="growth-date"
          className="input"
          type="date"
          max={toDateInputValue(new Date())}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="growth-height">
          Height (cm)
        </label>
        <input
          id="growth-height"
          className="input"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.1"
          value={heightText}
          onChange={(e) => setHeightText(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="growth-weight">
          Weight
        </label>
        <div className="flex gap-2.5">
          <input
            id="growth-weight"
            className="input min-w-0 flex-1"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={weightText}
            onChange={(e) => setWeightText(e.target.value)}
          />
          <SegmentedControl
            options={WEIGHT_UNIT_OPTIONS}
            value={weightUnit}
            onChange={setWeightUnit}
            ariaLabel="Weight unit"
          />
        </div>
        <p className="text-sm text-muted">
          The latest weight is also saved to {profileName}'s profile for dose suggestions.
        </p>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="growth-head">
          Head circumference (cm)
        </label>
        <input
          id="growth-head"
          className="input"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.1"
          value={headText}
          onChange={(e) => setHeadText(e.target.value)}
        />
      </div>

      <EntryFormFooter
        error={error}
        addLabel="Save growth"
        editing={initial !== null}
        onCancel={onCancel}
      />
    </form>
  );
}
