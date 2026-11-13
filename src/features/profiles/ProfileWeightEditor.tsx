import { useState } from 'react';
import { formatDate, parseNumber, round } from '../logs/formatters';
import type { Profile } from './profileStorage';

interface Props {
  profile: Profile;
  onSaveProfile: (profile: Profile) => void;
}

/** Shows the weight saved on a profile and lets the user add or update it. */
export default function ProfileWeightEditor({ profile, onSaveProfile }: Props) {
  const [editing, setEditing] = useState(false);
  const [weightText, setWeightText] = useState('');

  const weight = parseNumber(weightText);
  const valid = weight !== null && weight > 0 && weight < 300;

  const handleSave = () => {
    if (weight === null || !valid) return;
    onSaveProfile({
      ...profile,
      weightKg: round(weight, 2),
      weightUpdatedAt: new Date().toISOString(),
    });
    setEditing(false);
    setWeightText('');
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-page p-3">
      <p className="text-sm">
        {profile.weightKg ? (
          <>
            {profile.name}'s saved weight is <strong>{profile.weightKg} kg</strong>
            {profile.weightUpdatedAt && `, from ${formatDate(profile.weightUpdatedAt)}`}.
          </>
        ) : (
          <>Add {profile.name}'s weight to get a suggested dose.</>
        )}
      </p>

      {editing ? (
        <div className="flex gap-2.5">
          <input
            className="input min-w-0 flex-1"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.1"
            aria-label="Weight in kg"
            placeholder="kg"
            value={weightText}
            onChange={(e) => setWeightText(e.target.value)}
            autoFocus
          />
          <button
            type="button"
            className="btn w-auto flex-none"
            onClick={handleSave}
            disabled={!valid}
          >
            Save weight
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="min-h-11 self-start font-bold text-accent"
          onClick={() => setEditing(true)}
        >
          {profile.weightKg ? 'Update weight' : 'Add weight'}
        </button>
      )}
    </div>
  );
}
