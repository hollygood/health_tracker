import { useMemo, useState } from 'react';
import { FaChartColumn } from 'react-icons/fa6';
import type { Entry } from '../logs/entryTypes';
import { useProfileEntries } from '../logs/useProfileEntries';
import type { Profile } from '../profiles/profileStorage';
import ExportPanel from './ExportPanel';
import { buildReportText, reportFileName } from './reportExport';
import ReportFilterBar from './ReportFilterBar';
import {
  availableCategories,
  filterEntries,
  hasActiveFilters,
  NO_FILTERS,
  type ReportFilters,
} from './reportFilters';
import ReportTimeline from './ReportTimeline';

interface Props {
  profile: Profile | null;
  onOpenProfiles: () => void;
  /** Opens the entry in its own page for editing. */
  onEditEntry: (entry: Entry) => void;
}

export default function ReportsPage({ profile, onOpenProfiles, onEditEntry }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-[26px] font-extrabold tracking-tight">Reports</h1>
      {profile ? (
        <Report key={profile.id} profile={profile} onEditEntry={onEditEntry} />
      ) : (
        <div className="card items-center py-8 text-center">
          <FaChartColumn className="text-3xl text-accent" aria-hidden="true" />
          <p className="font-bold">Add a profile to see reports</p>
          <p className="text-sm text-muted">Reports show everything logged for one profile.</p>
          <button className="btn" onClick={onOpenProfiles}>
            Add profile
          </button>
        </div>
      )}
    </div>
  );
}

function Report({ profile, onEditEntry }: { profile: Profile } & Pick<Props, 'onEditEntry'>) {
  const { entries, deleteEntry } = useProfileEntries(profile.id);
  const [filters, setFilters] = useState<ReportFilters>(NO_FILTERS);

  const filtered = useMemo(() => filterEntries(entries, filters), [entries, filters]);
  const categories = useMemo(() => availableCategories(entries), [entries]);
  const reportText = useMemo(
    () => buildReportText({ profile, entries: filtered, filters }),
    [profile, filtered, filters],
  );

  if (entries.length === 0) {
    return (
      <div className="card items-center py-8 text-center">
        <FaChartColumn className="text-3xl text-accent" aria-hidden="true" />
        <p className="font-bold">Nothing logged for {profile.name} yet</p>
        <p className="text-sm text-muted">
          Entries you add from Home (medicine, temperature, sickness, growth, medical history) show
          up here.
        </p>
      </div>
    );
  }

  return (
    <>
      <ReportFilterBar filters={filters} onChange={setFilters} categories={categories} />

      <p className="px-1 text-sm font-bold text-muted" role="status">
        {hasActiveFilters(filters)
          ? `Showing ${filtered.length} of ${entries.length} entries`
          : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}
      </p>

      {filtered.length === 0 ? (
        <div className="card text-center">
          <p className="font-bold">No entries match these filters</p>
          <button className="btn btn-soft" onClick={() => setFilters(NO_FILTERS)}>
            Clear filters
          </button>
        </div>
      ) : (
        <ReportTimeline entries={filtered} onEdit={onEditEntry} onDelete={deleteEntry} />
      )}

      <ExportPanel
        text={reportText}
        title={`Health report: ${profile.name}`}
        fileName={reportFileName(profile)}
        entryCount={filtered.length}
      />
    </>
  );
}
