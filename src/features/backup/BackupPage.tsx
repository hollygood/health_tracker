import { useRef, useState, type ChangeEvent } from 'react';
import { FaChevronLeft, FaDownload, FaFileImport } from 'react-icons/fa6';
import { formatDateTime } from '../logs/formatters';
import { downloadText } from '../reports/shareReport';
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

/** Save everything on this device to a file, or load it back from one. */
export default function BackupPage({ onBack, onRestored }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  /** A backup file that has been read and checked, waiting for the user to choose how to restore it. */
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [confirmingReplace, setConfirmingReplace] = useState(false);

  const handleSave = () => {
    const backup = createBackup();
    const fileName = backupFileName();
    downloadText(fileName, serializeBackup(backup), 'application/json');
    setError('');
    setMessage(
      `Saved ${fileName} with ${plural(backup.profiles.length, 'profile', 'profiles')} and ${plural(
        backup.entries.length,
        'entry',
        'entries',
      )}. Keep it somewhere safe, such as your cloud drive.`,
    );
  };

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // let the same file be chosen again
    if (!file) return;

    setMessage('');
    setConfirmingReplace(false);
    try {
      setPending(parseBackup(await readFileText(file)));
      setError('');
    } catch (problem) {
      setPending(null);
      setError(problem instanceof Error ? problem.message : 'The file could not be read.');
    }
  };

  const handleRestore = (mode: RestoreMode) => {
    if (!pending) return;
    const { profilesAdded, entriesAdded } = restoreBackup(pending, mode);
    setPending(null);
    setConfirmingReplace(false);
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

      <section className="card" aria-labelledby="save-heading">
        <h2 id="save-heading" className="text-lg font-extrabold">
          Save a backup
        </h2>
        <p className="text-sm text-muted">
          Downloads one file with every profile, entry and custom category. It is not encrypted, so
          treat it like any other health record.
        </p>
        <button className="btn" onClick={handleSave}>
          <FaDownload aria-hidden="true" /> Save backup file
        </button>
      </section>

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
