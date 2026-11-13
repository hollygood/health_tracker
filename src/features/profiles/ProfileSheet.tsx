import { useState, type FormEvent } from 'react';
import { FaCheck, FaPlus, FaXmark } from 'react-icons/fa6';
import SegmentedControl from '../../components/SegmentedControl';
import { ageText, newId, type Profile, type Sex } from './profileStorage';

interface Props {
  profiles: Profile[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onSave: (p: Profile) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

type Draft = { id: string | null; name: string; birthday: string; sex: Sex };
const SEX_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
] as const;
const BLANK: Draft = { id: null, name: '', birthday: '', sex: 'female' };

export default function ProfileSheet({ profiles, activeId, onSelect, onSave, onDelete, onClose }: Props) {
  const [draft, setDraft] = useState<Draft | null>(profiles.length === 0 ? BLANK : null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft || !draft.name.trim() || !draft.birthday) return;
    const existing = profiles.find((p) => p.id === draft.id);
    onSave({
      ...existing,
      id: draft.id ?? newId(),
      name: draft.name.trim(),
      birthday: draft.birthday,
      sex: draft.sex,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-ink/45 md:items-center"
      onClick={onClose}
    >
      <div
        className="sheet-pad flex max-h-[90dvh] w-full max-w-[520px] flex-col gap-3.5 overflow-y-auto rounded-t-3xl bg-surface px-[18px] pt-3.5 md:rounded-3xl"
        role="dialog"
        aria-modal="true"
        aria-label="Profiles"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold">
            {draft ? (draft.id ? 'Edit profile' : 'New profile') : 'Profiles'}
          </h2>
          <button
            className="grid size-11 place-items-center rounded-full text-lg text-muted"
            onClick={onClose}
            aria-label="Close"
          >
            <FaXmark aria-hidden="true" />
          </button>
        </div>

        {!draft && (
          <>
            <ul className="flex flex-col gap-2">
              {profiles.map((p) => (
                <li
                  key={p.id}
                  className={`flex items-center gap-1 rounded-2xl border-2 pr-1.5 ${
                    p.id === activeId ? 'border-accent bg-accent-soft' : 'border-transparent bg-page'
                  }`}
                >
                  <button
                    className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left"
                    onClick={() => {
                      onSelect(p.id);
                      onClose();
                    }}
                  >
                    <span
                      className="grid size-9 flex-none place-items-center rounded-full bg-accent font-extrabold text-white"
                      aria-hidden="true"
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <strong className="truncate">{p.name}</strong>
                      <small className="text-sm text-muted">
                        {[ageText(p.birthday), p.sex === 'female' ? 'girl' : 'boy'].filter(Boolean).join(', ')}
                      </small>
                    </span>
                    {p.id === activeId && <FaCheck className="flex-none text-accent" aria-label="Selected" />}
                  </button>
                  <button
                    className="min-h-11 px-2.5 font-bold text-accent"
                    onClick={() => {
                      setConfirmDelete(false);
                      setDraft({ id: p.id, name: p.name, birthday: p.birthday, sex: p.sex });
                    }}
                  >
                    Edit
                  </button>
                </li>
              ))}
            </ul>
            <button className="btn" onClick={() => setDraft(BLANK)}>
              <FaPlus aria-hidden="true" /> Add profile
            </button>
          </>
        )}

        {draft && (
          <form onSubmit={submit} className="flex flex-col gap-3.5">
            <div className="field">
              <label className="field-label" htmlFor="profile-name">
                Name
              </label>
              <input
                id="profile-name"
                className="input"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="profile-birthday">
                Birthday
              </label>
              <input
                id="profile-birthday"
                className="input"
                type="date"
                max={today}
                value={draft.birthday}
                onChange={(e) => setDraft({ ...draft, birthday: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <span className="field-label" id="sex-label">Sex</span>
              <SegmentedControl
                options={SEX_OPTIONS}
                value={draft.sex}
                onChange={(sex) => setDraft({ ...draft, sex })}
                ariaLabelledBy="sex-label"
                fullWidth
              />
            </div>
            <button className="btn" type="submit">Save profile</button>
            {profiles.length > 0 && (
              <button className="btn btn-soft" type="button" onClick={() => setDraft(null)}>
                Cancel
              </button>
            )}
            {draft.id &&
              (confirmDelete ? (
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={() => {
                    onDelete(draft.id!);
                    setDraft(null);
                  }}
                >
                  Delete {draft.name} and all their data?
                </button>
              ) : (
                <button
                  className="min-h-11 self-center px-2.5 font-bold text-danger"
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete profile
                </button>
              ))}
          </form>
        )}
      </div>
    </div>
  );
}
