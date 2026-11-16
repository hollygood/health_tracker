import RichText from '../../components/richText/RichText';
import { entryHeadline, entryNotes, growthValues } from './entrySummary';
import type { Entry } from './entryTypes';

/**
 * The body of an entry in a list: its short description, then its notes with their
 * formatting. Growth entries show each measurement on its own row, label left, value right.
 */
export default function EntryDetails({ entry }: { entry: Entry }) {
  if (entry.type === 'growth') {
    return (
      <dl className="flex flex-col">
        {growthValues(entry).map(({ label, value }) => (
          <div key={label} className="flex items-baseline justify-between gap-3">
            <dt className="text-muted">{label}</dt>
            <dd className="font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    );
  }

  const notes = entryNotes(entry);
  return (
    <>
      <p className="break-words">{entryHeadline(entry)}</p>
      {notes && <RichText value={notes} className="text-[15px] text-muted" />}
    </>
  );
}
