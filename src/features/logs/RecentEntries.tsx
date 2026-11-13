import { useState, type ReactNode } from 'react';
import { FaPen, FaTrashCan } from 'react-icons/fa6';
import { entrySummary } from './entrySummary';
import type { Entry } from './entryTypes';
import { formatDate, formatDateTime } from './formatters';

interface Props<T extends Entry> {
  entries: T[];
  onDelete: (id: string) => void;
  /** When given, each entry gets an Edit button. */
  onEdit?: (entry: T) => void;
  /** Id of the entry currently loaded in the form, to highlight it. */
  editingId?: string | null;
  emptyText: string;
  /** Extra per-entry actions, e.g. "Mark as recovered now". */
  renderActions?: (entry: T) => ReactNode;
}

const ICON_BUTTON = 'grid size-11 flex-none place-items-center rounded-full text-muted';

/** List of saved entries, newest first, with edit and a two-step delete. */
export default function RecentEntries<T extends Entry>({
  entries,
  onDelete,
  onEdit,
  editingId = null,
  emptyText,
  renderActions,
}: Props<T>) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  return (
    <section className="card" aria-labelledby="recent-heading">
      <h2 id="recent-heading" className="text-lg font-extrabold">
        Recent
      </h2>

      {entries.length === 0 ? (
        <p className="text-sm text-muted">{emptyText}</p>
      ) : (
        <ul className="flex flex-col">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className={`flex flex-col gap-1.5 border-t border-line py-3 first:border-t-0 first:pt-0 last:pb-0 ${
                entry.id === editingId ? 'text-accent' : ''
              }`}
              aria-current={entry.id === editingId ? 'true' : undefined}
            >
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-muted">
                    {entry.type === 'growth' ? formatDate(entry.time) : formatDateTime(entry.time)}
                    {entry.id === editingId && ' (editing)'}
                  </p>
                  <p className="break-words">{entrySummary(entry)}</p>
                </div>
                {confirmingId === entry.id ? (
                  <>
                    <button
                      className="min-h-11 flex-none rounded-xl px-3 text-sm font-bold text-muted"
                      onClick={() => setConfirmingId(null)}
                    >
                      Keep
                    </button>
                    <button
                      className="min-h-11 flex-none rounded-xl bg-danger px-3 text-sm font-bold text-white"
                      onClick={() => {
                        onDelete(entry.id);
                        setConfirmingId(null);
                      }}
                    >
                      Confirm delete
                    </button>
                  </>
                ) : (
                  <>
                    {onEdit && (
                      <button
                        className={ICON_BUTTON}
                        onClick={() => onEdit(entry)}
                        aria-label="Edit entry"
                      >
                        <FaPen aria-hidden="true" />
                      </button>
                    )}
                    <button
                      className={ICON_BUTTON}
                      onClick={() => setConfirmingId(entry.id)}
                      aria-label="Delete entry"
                    >
                      <FaTrashCan aria-hidden="true" />
                    </button>
                  </>
                )}
              </div>
              {renderActions?.(entry)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
