import { useState, type FormEvent } from 'react';
import { FaTriangleExclamation } from 'react-icons/fa6';
import { calculateDose } from '../../dosage/calculateDose';
import { MEDICINES, type MedicineId } from '../../dosage/dosageTable';
import type { Profile } from '../../profiles/profileStorage';
import ProfileWeightEditor from '../../profiles/ProfileWeightEditor';
import EntryFormFooter from '../EntryFormFooter';
import { MEDICINE_UNITS, type MedicineEntry, type MedicineUnit, type NewEntry } from '../entryTypes';
import { inputValueToIso, parseNumber, toDateTimeInputValue } from '../formatters';
import LogPageLayout, { type LogPageProps } from '../LogPageLayout';
import RecentEntries from '../RecentEntries';
import { useEntries } from '../useEntries';
import { useEntryEditor, type EditRequest } from '../useEntryEditor';

interface Props extends LogPageProps {
  onSaveProfile: (profile: Profile) => void;
}

export default function MedicineLogPage({
  profile,
  onSaveProfile,
  editEntryId,
  onEditDone,
  ...layout
}: Props) {
  return (
    <LogPageLayout title="Medicine" profile={profile} {...layout}>
      {profile && (
        <MedicineLog
          key={profile.id}
          profile={profile}
          onSaveProfile={onSaveProfile}
          editEntryId={editEntryId}
          onEditDone={onEditDone}
        />
      )}
    </LogPageLayout>
  );
}

type LogProps = { profile: Profile } & Pick<Props, 'onSaveProfile'> & EditRequest;

function MedicineLog({ profile, onSaveProfile, ...editRequest }: LogProps) {
  const entriesApi = useEntries(profile.id, 'medicine');
  const editor = useEntryEditor(entriesApi, editRequest);

  return (
    <>
      <MedicineForm
        key={editor.formKey}
        profile={profile}
        initial={editor.editing}
        onSave={editor.save}
        onCancel={editor.cancelEditing}
        onSaveProfile={onSaveProfile}
      />
      <RecentEntries
        entries={entriesApi.entries}
        onEdit={editor.startEditing}
        onDelete={editor.remove}
        editingId={editor.editing?.id}
        emptyText="No medicine logged yet."
      />
    </>
  );
}

type MedicineChoice = MedicineId | 'other';

interface FormProps {
  profile: Profile;
  /** The entry to edit, or null to add a new one. */
  initial: MedicineEntry | null;
  onSave: (fields: NewEntry<'medicine'>) => void;
  onCancel: () => void;
  onSaveProfile: (profile: Profile) => void;
}

function MedicineForm({ profile, initial, onSave, onCancel, onSaveProfile }: FormProps) {
  const [time, setTime] = useState(() =>
    toDateTimeInputValue(initial ? new Date(initial.time) : new Date()),
  );
  const [choice, setChoice] = useState<MedicineChoice>(
    initial ? (initial.medicineId ?? 'other') : MEDICINES[0].id,
  );
  const [otherName, setOtherName] = useState(
    initial && !initial.medicineId ? initial.medicineName : '',
  );
  const [otherUnit, setOtherUnit] = useState<MedicineUnit>(initial?.unit ?? 'mL');
  // null = the user has not typed an amount, so the suggested dose (if any) is shown.
  const [typedAmount, setTypedAmount] = useState<string | null>(
    initial ? String(initial.amount) : null,
  );
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState('');

  const medicine = choice === 'other' ? null : MEDICINES.find((m) => m.id === choice)!;
  const suggestion =
    medicine && profile.weightKg ? calculateDose(medicine.id, profile.weightKg, 'kg') : null;
  const suggestedAmount = suggestion?.status === 'ok' ? String(suggestion.doseMl) : '';
  const amountText = typedAmount ?? suggestedAmount;
  const unit: MedicineUnit = medicine ? 'mL' : otherUnit;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const iso = inputValueToIso(time);
    const amount = parseNumber(amountText);
    const name = medicine ? medicine.name : otherName.trim();
    if (!iso) return setError('Enter the time the medicine was given.');
    if (!name) return setError('Enter the name of the medicine.');
    if (amount === null || amount <= 0) return setError('Enter the amount given.');

    onSave({
      type: 'medicine',
      time: iso,
      medicineId: medicine?.id ?? null,
      medicineName: name,
      amount,
      unit,
      notes: notes.trim(),
    });
  };

  return (
    <form
      className="card"
      onSubmit={handleSubmit}
      aria-label={initial ? 'Edit medicine' : 'Log medicine'}
      noValidate
    >
      <div className="field">
        <label className="field-label" htmlFor="medicine-time">
          Start time
        </label>
        <input
          id="medicine-time"
          className="input"
          type="datetime-local"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="medicine-type">
          Type
        </label>
        <select
          id="medicine-type"
          className="input select"
          value={choice}
          onChange={(e) => {
            setChoice(e.target.value as MedicineChoice);
            setTypedAmount(null);
          }}
        >
          {MEDICINES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
          <option value="other">Other</option>
        </select>
      </div>

      {!medicine && (
        <div className="field">
          <label className="field-label" htmlFor="medicine-name">
            Medicine name
          </label>
          <input
            id="medicine-name"
            className="input"
            value={otherName}
            onChange={(e) => setOtherName(e.target.value)}
          />
        </div>
      )}

      {medicine && <ProfileWeightEditor profile={profile} onSaveProfile={onSaveProfile} />}

      <div className="field">
        <label className="field-label" htmlFor="medicine-amount">
          Amount ({unit})
        </label>
        <div className="flex gap-2.5">
          <input
            id="medicine-amount"
            className="input min-w-0 flex-1"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.05"
            value={amountText}
            onChange={(e) => setTypedAmount(e.target.value)}
          />
          {!medicine && (
            <select
              className="input select w-auto flex-none"
              aria-label="Unit"
              value={otherUnit}
              onChange={(e) => setOtherUnit(e.target.value as MedicineUnit)}
            >
              {MEDICINE_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          )}
        </div>
        {suggestion?.status === 'ok' && (
          <p className="text-sm text-muted" data-testid="dose-suggestion">
            Suggested dose: {suggestion.doseMl} mL ({suggestion.doseMg} mg) for {profile.weightKg}{' '}
            kg. {suggestion.drug.standardDosageText}
          </p>
        )}
        {suggestion && suggestion.status !== 'ok' && (
          <p className="text-sm font-bold text-warn" data-testid="dose-suggestion">
            <FaTriangleExclamation className="mr-1 inline -translate-y-px" aria-hidden="true" />
            No suggested dose. {suggestion.message}
          </p>
        )}
      </div>

      <div className="field">
        <label className="field-label" htmlFor="medicine-notes">
          Notes
        </label>
        <textarea
          id="medicine-notes"
          className="input textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <EntryFormFooter
        error={error}
        addLabel="Save medicine"
        editing={initial !== null}
        onCancel={onCancel}
      />
    </form>
  );
}
