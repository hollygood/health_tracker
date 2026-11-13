import MultiSelectDropdown, { type SelectGroup } from '../../components/MultiSelectDropdown';
import { ENTRY_TYPES } from '../logs/entryTypeMeta';
import { ENTRY_TYPE_LABELS, type EntryType } from '../logs/entryTypes';
import { hasActiveFilters, lastDaysRange, NO_FILTERS, type ReportFilters } from './reportFilters';

interface Props {
  filters: ReportFilters;
  onChange: (filters: ReportFilters) => void;
  /** Specific categories in use (sickness, medical history, medicine names). */
  categories: string[];
}

const QUICK_RANGE = 'min-h-10 rounded-full bg-page px-3.5 text-sm font-bold text-muted';

// The dropdown holds types and specific categories in one list; the prefix tells them apart.
const TYPE_PREFIX = 'type:';
const CATEGORY_PREFIX = 'category:';

/** Date range and category filters for the report. */
export default function ReportFilterBar({ filters, onChange, categories }: Props) {
  const groups: SelectGroup[] = [
    {
      label: 'Type',
      options: ENTRY_TYPES.map((t) => ({ value: TYPE_PREFIX + t, label: ENTRY_TYPE_LABELS[t] })),
    },
    {
      label: 'Details',
      options: categories.map((c) => ({ value: CATEGORY_PREFIX + c, label: c })),
    },
  ];

  const selected = [
    ...filters.types.map((t) => TYPE_PREFIX + t),
    ...filters.categories.map((c) => CATEGORY_PREFIX + c),
  ];

  const handleSelect = (values: string[]) =>
    onChange({
      ...filters,
      types: values
        .filter((v) => v.startsWith(TYPE_PREFIX))
        .map((v) => v.slice(TYPE_PREFIX.length) as EntryType),
      categories: values
        .filter((v) => v.startsWith(CATEGORY_PREFIX))
        .map((v) => v.slice(CATEGORY_PREFIX.length)),
    });

  return (
    <section className="card" aria-label="Filters">
      <div className="flex gap-2.5">
        <div className="field min-w-0 flex-1">
          <label className="field-label" htmlFor="report-from">
            From
          </label>
          <input
            id="report-from"
            className="input"
            type="date"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(e) => onChange({ ...filters, from: e.target.value })}
          />
        </div>
        <div className="field min-w-0 flex-1">
          <label className="field-label" htmlFor="report-to">
            To
          </label>
          <input
            id="report-to"
            className="input"
            type="date"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(e) => onChange({ ...filters, to: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Quick date ranges">
        <button className={QUICK_RANGE} onClick={() => onChange({ ...filters, ...lastDaysRange(7) })}>
          Last 7 days
        </button>
        <button className={QUICK_RANGE} onClick={() => onChange({ ...filters, ...lastDaysRange(30) })}>
          Last 30 days
        </button>
        <button className={QUICK_RANGE} onClick={() => onChange({ ...filters, from: '', to: '' })}>
          All dates
        </button>
      </div>

      <MultiSelectDropdown
        id="report-category"
        label="Category"
        emptyLabel="All categories"
        groups={groups}
        selected={selected}
        onChange={handleSelect}
      />

      {hasActiveFilters(filters) && (
        <button className="min-h-11 self-start font-bold text-accent" onClick={() => onChange(NO_FILTERS)}>
          Clear filters
        </button>
      )}
    </section>
  );
}
