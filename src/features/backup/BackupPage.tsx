import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { FaChevronLeft, FaFileImport, FaLock } from 'react-icons/fa6';
import { formatDateTime } from '../logs/formatters';
import { downloadText } from '../reports/shareReport';
import {
  decryptBackupText,
  encryptBackupText,
  isEncryptedBackup,
  isEncryptionAvailable,
  MIN_PASSWORD_LENGTH,
} from './backupCrypto';
import {
  backupFileName,
  createBackup,
  parseBackup,
  readFileText,
  restoreBackup,
  serializeBackup,
  type BackupFile,
  type RestoreMode,
} from './backupFile';

interface Props {
  onBack: () => void;
  /** Called after a backup has been written into storage, so the app can reload its data. */
  onRestored: () => void;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const messageOf = (problem: unknown) =>
  problem instanceof Error ? problem.message : 'The file could not be read.';

/** Save everything on this device to a password-protected file, or load it back from one. */
export default function BackupPage({ onBack, onRestored }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  /** Text of an encrypted backup that has been chosen but not yet unlocked. */
  const [lockedFile, setLockedFile] = useState<string | null>(null);
  const [unlockPassword, setUnlockPassword] = useState('');
  /** A backup that has been read and checked, waiting for the user to choose how to restore it. */
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [confirmingReplace, setConfirmingReplace] = useState(false);

  const canEncrypt = isEncryptionAvailable();

  const fail = (text: string) => {
    setMessage('');
    setError(text);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      return fail(`Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`);
    }
    if (password !== confirmPassword) return fail('The two passwords do not match.');

    setBusy(true);
    try {
      const backup = createBackup();
      const fileName = backupFileName();
      downloadText(fileName, await encryptBackupText(serializeBackup(backup), password), 'application/json');
      setPassword('');
      setConfirmPassword('');
      setError('');
      setMessage(
        `Saved ${fileName} with ${plural(backup.profiles.length, 'profile', 'profiles')} and ${plural(
          backup.entries.length,
          'entry',
          'entries',
        )}, protected by your password.`,
      );
    } catch {
      fail('The backup could not be encrypted. Nothing was saved.');
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // let the same file be chosen again
    if (!file) return;

    setMessage('');
    setError('');
    setPending(null);
    setLockedFile(null);
    setUnlockPassword('');
    setConfirmingReplace(false);
    try {
      const text = await readFileText(file);
      if (isEncryptedBackup(text)) setLockedFile(text);
      else setPending(parseBackup(text)); // a backup saved before encryption was added
    } catch (problem) {
      fail(messageOf(problem));
    }
  };

  const handleUnlock = async (e: FormEvent) => {
    e.preventDefault();
    if (!lockedFile) return;
    setBusy(true);
    try {
      setPending(parseBackup(await decryptBackupText(lockedFile, unlockPassword)));
      setLockedFile(null);
      setUnlockPassword('');
      setError('');
    } catch (problem) {
      fail(messageOf(problem));
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = (mode: RestoreMode) => {
    if (!pending) return;
    const { profilesAdded, entriesAdded } = restoreBackup(pending, mode);
    setPending(null);
    setConfirmingReplace(false);
    setError('');
    setMessage(
      mode === 'replace'
        ? `Restored ${plural(profilesAdded, 'profile', 'profiles')} and ${plural(entriesAdded, 'entry', 'entries')}.`
        : `Added ${plural(profilesAdded, 'profile', 'profiles')} and ${plural(entriesAdded, 'entry', 'entries')} that were not already here.`,
    );
    onRestored();
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        className="inline-flex min-h-11 items-center gap-1.5 self-start pr-2 font-bold text-accent"
        onClick={onBack}
      >
        <FaChevronLeft aria-hidden="true" /> Home
      </button>
      <h1 className="text-[26px] font-extrabold tracking-tight">Backup and restore</h1>
      <p className="text-sm text-muted">
        Everything is stored only in this browser on this device. Clearing the browser's data, or
        losing the device, loses it. A backup file lets you get it back or move it to another
        device.
      </p>

      <form className="card" onSubmit={handleSave} aria-labelledby="save-heading" noValidate>
        <h2 id="save-heading" className="text-lg font-extrabold">
          Save a backup
        </h2>
        <p className="text-sm text-muted">
          Downloads one file with every profile, entry and custom category, encrypted with a
          password you choose.
        </p>

        {canEncrypt ? (
          <>
            <div className="field">
              <label className="field-label" htmlFor="backup-password">
                Password
              </label>
              <input
                id="backup-password"
                className="input"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="backup-password-confirm">
                Password again
              </label>
              <input
                id="backup-password-confirm"
                className="input"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <p className="text-sm font-bold text-warn">
              Keep this password safe. Without it the backup cannot be opened, and there is no way
              to reset it.
            </p>
            <button className="btn" type="submit" disabled={busy}>
              <FaLock aria-hidden="true" /> Save encrypted backup
            </button>
          </>
        ) : (
          <p className="font-bold text-warn" role="alert">
            Encrypted backups need a secure connection. Open the app from its https address (or
            localhost) to save one.
          </p>
        )}
      </form>

      <section className="card" aria-labelledby="restore-heading">
        <h2 id="restore-heading" className="text-lg font-extrabold">
          Restore from a backup
        </h2>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label="Backup file"
          onChange={handleFile}
        />
        <button className="btn btn-soft" onClick={() => inputRef.current?.click()}>
          <FaFileImport aria-hidden="true" /> Choose a backup file
        </button>

        {lockedFile && (
          <form className="flex flex-col gap-2.5 rounded-xl bg-page p-3" onSubmit={handleUnlock} noValidate>
            <div className="field">
              <label className="field-label" htmlFor="unlock-password">
                Password for this backup
              </label>
              <input
                id="unlock-password"
                className="input"
                type="password"
                autoComplete="current-password"
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                autoFocus
              />
            </div>
            <button className="btn" type="submit" disabled={busy || unlockPassword === ''}>
              Unlock backup
            </button>
          </form>
        )}

        {pending && (
          <div className="flex flex-col gap-2.5 rounded-xl bg-page p-3" data-testid="backup-summary">
            <p>
              This backup has <strong>{plural(pending.profiles.length, 'profile', 'profiles')}</strong>
              {pending.profiles.length > 0 && ` (${pending.profiles.map((p) => p.name).join(', ')})`} and{' '}
              <strong>{plural(pending.entries.length, 'entry', 'entries')}</strong>
              {pending.exportedAt && `, saved ${formatDateTime(pending.exportedAt)}`}.
            </p>

            {confirmingReplace ? (
              <>
                <p className="font-bold text-danger" role="alert">
                  This deletes everything now on this device and cannot be undone.
                </p>
                <button className="btn btn-danger" onClick={() => handleRestore('replace')}>
                  Yes, replace everything
                </button>
                <button className="btn btn-soft" onClick={() => setConfirmingReplace(false)}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button className="btn" onClick={() => handleRestore('merge')}>
                  Add to what is here
                </button>
                <p className="text-sm text-muted">
                  Keeps everything on this device and adds only the profiles and entries it does not
                  already have.
                </p>
                <button className="btn btn-soft" onClick={() => setConfirmingReplace(true)}>
                  Replace everything here
                </button>
                <button
                  className="min-h-11 self-center font-bold text-muted"
                  onClick={() => setPending(null)}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        )}
      </section>

      {message && (
        <p className="font-bold text-ok" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
