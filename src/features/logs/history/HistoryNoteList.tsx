import { useState } from 'react';
import { FaChevronDown, FaPen, FaTrashCan } from 'react-icons/fa6';
import type { HistoryEntry } from '../entryTypes';
import { formatDateTime } from '../formatters';

interface Props {
  /** Notes to list, newest first. */
  entries: HistoryEntry[];
  onEdit: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  /** Id of the note currently loaded in the form, to mark it. */
  editingId?: string | null;
}

const ACTION = 'inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold';

/**
 * Medical history notes as an expandable list. Each row shows the title and the
 * date; opening it shows the category, the description, and Edit / Delete.
 */
export default function HistoryNoteList({ entries, onEdit, onDelete, editingId = null }: Props) {
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(new Set());
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const toggle = (id: string) =>
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <section className="card" aria-labelledby="notes-heading">
      <h2 id="notes-heading" className="text-lg font-extrabold">
        Notes
      </h2>

      {entries.length === 0 ? (
        <p className="text-sm text-muted">No medical history added yet.</p>
      ) : (
        <ul className="flex flex-col">
          {entries.map((entry) => {
            const open = openIds.has(entry.id);
            const panelId = `note-${entry.id}`;
            return (
              <li key={entry.id} className="border-t border-line first:border-t-0">
                <button
                  type="button"
                  className="flex min-h-14 w-full items-center gap-3 py-2.5 text-left"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => toggle(entry.id)}
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-bold break-words">{entry.title}</span>
                    <span className="text-sm font-normal text-muted">
                      {formatDateTime(entry.time)}
                      {entry.id === editingId && ' (editing)'}
                    </span>
                  </span>
                  <FaChevronDown
                    className={`flex-none text-muted transition-transform motion-reduce:transition-none ${
                      open ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {open && (
                  <div id={panelId} className="flex flex-col gap-2.5 pb-3">
                    <dl className="flex flex-col gap-2.5">
                      <div>
                        <dt className="text-sm font-bold text-muted">Category</dt>
                        <dd>{entry.category}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-bold text-muted">Description</dt>
                        <dd className="break-words whitespace-pre-wrap">
                          {entry.description || <span className="text-muted">No description</span>}
                        </dd>
                      </div>
                    </dl>

                    {confirmingId === entry.id ? (
                      <div className="flex gap-2">
                        <button className={`${ACTION} text-muted`} onClick={() => setConfirmingId(null)}>
                          Keep
                        </button>
                        <button
                          className={`${ACTION} bg-danger text-white`}
                          onClick={() => {
                            onDelete(entry.id);
                            setConfirmingId(null);
                          }}
                        >
                          Confirm delete
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button className={`${ACTION} bg-accent-soft text-accent`} onClick={() => onEdit(entry)}>
                          <FaPen aria-hidden="true" /> Edit
                        </button>
                        <button className={`${ACTION} text-danger`} onClick={() => setConfirmingId(entry.id)}>
                          <FaTrashCan aria-hidden="true" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
