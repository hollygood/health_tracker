import { useState } from 'react';
import { FaPen, FaTrashCan } from 'react-icons/fa6';
import EntryDetails from '../logs/EntryDetails';
import { ENTRY_TYPE_LABELS, type Entry } from '../logs/entryTypes';
import { ENTRY_TYPE_META } from '../logs/entryTypeMeta';
import { groupByDay } from './reportFilters';

interface Props {
  /** Already filtered, newest first. */
  entries: Entry[];
  onEdit: (entry: Entry) => void;
  onDelete: (id: string) => void;
}

const ICON_BUTTON = 'grid size-11 flex-none place-items-center rounded-full text-muted';

const dayHeading = (day: string) =>
  new Date(`${day}T12:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const timeText = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

/** Entries grouped under a heading per day, newest day first. */
export default function ReportTimeline({ entries, onEdit, onDelete }: Props) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {groupByDay(entries).map(({ day, entries: dayEntries }) => (
        <section key={day} className="card gap-0" aria-labelledby={`day-${day}`}>
          <h2 id={`day-${day}`} className="pb-2 text-lg font-extrabold">
            {dayHeading(day)}
          </h2>
          <ul className="flex flex-col">
            {dayEntries.map((entry) => {
              const { Icon, bgClass } = ENTRY_TYPE_META[entry.type];
              return (
                <li key={entry.id} className="flex items-start gap-3 border-t border-line py-3 last:pb-0">
                  <span
                    className={`${bgClass} grid size-9 flex-none place-items-center rounded-xl text-white`}
                    aria-hidden="true"
                  >
                    <Icon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-muted">
                      {ENTRY_TYPE_LABELS[entry.type]}
                      {entry.type !== 'growth' && `, ${timeText(entry.time)}`}
                    </p>
                    <EntryDetails entry={entry} />
                  </div>
                  {confirmingId === entry.id ? (
                    <div className="flex flex-none flex-col items-end gap-1">
                      <button
                        className="min-h-11 rounded-xl bg-danger px-3 text-sm font-bold text-white"
                        onClick={() => {
                          onDelete(entry.id);
                          setConfirmingId(null);
                        }}
                      >
                        Confirm delete
                      </button>
                      <button
                        className="min-h-11 px-3 text-sm font-bold text-muted"
                        onClick={() => setConfirmingId(null)}
                      >
                        Keep
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-none">
                      <button className={ICON_BUTTON} onClick={() => onEdit(entry)} aria-label="Edit entry">
                        <FaPen aria-hidden="true" />
                      </button>
                      <button
                        className={ICON_BUTTON}
                        onClick={() => setConfirmingId(entry.id)}
                        aria-label="Delete entry"
                      >
                        <FaTrashCan aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
