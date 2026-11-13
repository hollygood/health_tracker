import { useState } from 'react';
import { FaCheck, FaChevronLeft } from 'react-icons/fa6';
import SegmentedControl from '../../components/SegmentedControl';
import type { Profile } from '../profiles/profileStorage';
import { calculateDose, getMedicine, type WeightUnit } from './calculateDose';
import DosageSheetViewer from './DosageSheetViewer';
import { DRUGS, MEDICINES, type MedicineId } from './dosageTable';
import DoseResultCard from './DoseResultCard';

interface Props {
  profile: Profile | null;
  onSaveProfile: (profile: Profile) => void;
  onBack: () => void;
}

const LB_TO_KG = 0.45359237;

const UNIT_OPTIONS = [
  { value: 'kg', label: 'kg' },
  { value: 'lb', label: 'pounds' },
] as const;

const formatNumber = (n: number, decimals: number) =>
  String(Math.round(n * 10 ** decimals) / 10 ** decimals);

/**
 * Dosage calculator. Starts from the profile's saved weight, if any.
 * The parent remounts this page (via `key`) when the active profile changes.
 */
export default function DosageCalculatorPage({ profile, onSaveProfile, onBack }: Props) {
  const [medicineId, setMedicineId] = useState<MedicineId>(MEDICINES[0].id);
  const [unit, setUnit] = useState<WeightUnit>('kg');
  const [weightText, setWeightText] = useState(() =>
    profile?.weightKg ? formatNumber(profile.weightKg, 2) : '',
  );
  const [weightSaved, setWeightSaved] = useState(false);

  const medicine = getMedicine(medicineId);
  const drug = DRUGS[medicine.drug];
  const weight = weightText.trim() === '' ? null : Number(weightText);
  const result = weight === null ? null : calculateDose(medicineId, weight, unit);

  // The weight saved to the profile is the true weight (exact lb -> kg), not the
  // sheet's rounded pounds scale that the dose lookup uses.
  const trueWeightKg =
    weight !== null && Number.isFinite(weight) && weight > 0
      ? unit === 'kg'
        ? weight
        : weight * LB_TO_KG
      : null;

  const canSaveWeight =
    profile !== null &&
    trueWeightKg !== null &&
    Math.abs((profile.weightKg ?? 0) - trueWeightKg) > 0.005;

  const handleSaveWeight = () => {
    if (!profile || trueWeightKg === null) return;
    onSaveProfile({
      ...profile,
      weightKg: Math.round(trueWeightKg * 100) / 100,
      weightUpdatedAt: new Date().toISOString(),
    });
    setWeightSaved(true);
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        className="inline-flex min-h-11 items-center gap-1.5 self-start pr-2 font-bold text-accent"
        onClick={onBack}
      >
        <FaChevronLeft aria-hidden="true" /> Home
      </button>
      <h1 className="text-[26px] font-extrabold tracking-tight">Dosage calculator</h1>

      <section className="card">
        <div className="field">
          <label className="field-label" htmlFor="medicine">
            Medicine
          </label>
          <select
            id="medicine"
            className="input select"
            value={medicineId}
            onChange={(e) => setMedicineId(e.target.value as MedicineId)}
          >
            {MEDICINES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="weight">
            {profile ? `${profile.name}'s weight` : 'Weight'}
          </label>
          <div className="flex gap-2.5">
            <input
              id="weight"
              className="input min-w-0 flex-1"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              placeholder={unit === 'kg' ? 'e.g. 14' : 'e.g. 32'}
              value={weightText}
              onChange={(e) => {
                setWeightText(e.target.value);
                setWeightSaved(false);
              }}
            />
            <SegmentedControl
              options={UNIT_OPTIONS}
              value={unit}
              onChange={setUnit}
              ariaLabel="Weight unit"
            />
          </div>
          {profile?.weightKg && profile.weightUpdatedAt && (
            <small className="text-sm text-muted">
              Profile weight: {formatNumber(profile.weightKg, 2)} kg, saved{' '}
              {new Date(profile.weightUpdatedAt).toLocaleDateString()}
            </small>
          )}
        </div>
      </section>

      <DoseResultCard result={result} unit={unit}>
        {canSaveWeight && profile && trueWeightKg !== null && (
          <button className="btn btn-soft" onClick={handleSaveWeight}>
            Save {formatNumber(trueWeightKg, 2)} kg to {profile.name}'s profile
          </button>
        )}
        {weightSaved && (
          <p className="font-bold text-ok" role="status">
            <FaCheck className="mr-1 inline -translate-y-px" aria-hidden="true" />
            Weight saved to profile.
          </p>
        )}
      </DoseResultCard>

      <section className="card" aria-label="About this medicine">
        <h2 className="text-lg font-extrabold">{medicine.name}</h2>
        <p className="text-lg font-bold">{medicine.concentrationLabel}</p>
        <p>{drug.standardDosageText}</p>
        <p className="text-sm text-muted">
          Always read the label to check which concentration you have, and dose accordingly. Use a
          proper measuring device. If unsure, ask your healthcare provider.
        </p>
      </section>

      <DosageSheetViewer />
    </div>
  );
}
