import { useMemo, useState } from 'react';
import SegmentedControl from '../../components/SegmentedControl';
import type { GrowthEntry } from '../logs/entryTypes';
import { formatDate } from '../logs/formatters';
import LogPageLayout from '../logs/LogPageLayout';
import { useEntries } from '../logs/useEntries';
import type { Profile } from '../profiles/profileStorage';
import GrowthChart from './GrowthChart';
import {
  ageLabel,
  ageWindow,
  DAYS_PER_YEAR,
  growthSeries,
  percentileText,
  referenceCurves,
  type GrowthPoint,
} from './growthStats';
import { useWhoData } from './useWhoData';
import { INDICATOR_META, INDICATORS, type Indicator, type WhoDataset } from './whoData';

interface Props {
  profile: Profile | null;
  /** Back to the Growth page, where measurements are added. */
  onBack: () => void;
  onOpenProfiles: () => void;
}

export default function GrowthChartPage({ profile, onBack, onOpenProfiles }: Props) {
  return (
    <LogPageLayout
      title="Growth chart"
      backLabel="Growth"
      profile={profile}
      onBack={onBack}
      onOpenProfiles={onOpenProfiles}
    >
      {profile && <GrowthChartView key={profile.id} profile={profile} onAddMeasurement={onBack} />}
    </LogPageLayout>
  );
}

const INDICATOR_OPTIONS = INDICATORS.map((i) => ({ value: i, label: INDICATOR_META[i].shortLabel }));

const valueText = (point: GrowthPoint, indicator: Indicator) =>
  `${point.value} ${INDICATOR_META[indicator].unit}`;

/** Percentile, or why there is none. */
function percentileNote(point: GrowthPoint, indicator: Indicator, hasData: boolean): string {
  if (point.percentile !== null) return percentileText(point.percentile);
  if (!hasData) return 'percentile not available';
  return `no WHO reference at this age (covers up to ${INDICATOR_META[indicator].coversYears} years)`;
}

interface ViewProps {
  profile: Profile;
  onAddMeasurement: () => void;
}

function GrowthChartView({ profile, onAddMeasurement }: ViewProps) {
  const { entries } = useEntries(profile.id, 'growth');
  const who = useWhoData();
  const dataset = who.status === 'ready' ? who.dataset : null;
  const [indicator, setIndicator] = useState<Indicator>('weight');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const allSeries = useMemo(() => seriesByIndicator(entries, profile, dataset), [entries, profile, dataset]);
  const series = allSeries[indicator];
  const meta = INDICATOR_META[indicator];

  if (entries.length === 0) {
    return (
      <div className="card items-center py-8 text-center">
        <p className="font-bold">No growth measurements for {profile.name} yet</p>
        <p className="text-sm text-muted">Add a height or weight to see it on the chart.</p>
        <button className="btn" onClick={onAddMeasurement}>
          Add a measurement
        </button>
      </div>
    );
  }

  const oldestAge = series.length ? series[series.length - 1].ageDays : 0;
  const tableRows = dataset?.indicators[indicator][profile.sex];
  const tableEnd = tableRows?.length ? tableRows[tableRows.length - 1][0] : 19 * DAYS_PER_YEAR;
  const ageRange = ageWindow(Math.min(oldestAge, tableEnd), tableEnd);
  const curves = dataset
    ? referenceCurves(dataset, indicator, profile.sex, ageRange.fromDays, ageRange.toDays)
    : [];
  const selected = series.find((p) => p.entryId === selectedId) ?? series[series.length - 1] ?? null;

  return (
    <>
      {who.status === 'missing' && (
        <p className="card border-warn-line bg-warn-soft text-sm font-bold text-warn" role="alert">
          Percentiles need the WHO reference data, which is not installed. Run "npm run who:data" in
          the project, then build the app again.
        </p>
      )}

      <section className="card" aria-labelledby="latest-heading">
        <h2 id="latest-heading" className="text-lg font-extrabold">
          Latest measurements
        </h2>
        <dl className="flex flex-col">
          {INDICATORS.map((i) => {
            const latest = allSeries[i][allSeries[i].length - 1];
            return (
              <div key={i} className="flex flex-col border-t border-line py-2.5 first:border-t-0 first:pt-0 last:pb-0">
                <dt className="text-sm font-bold text-muted">{INDICATOR_META[i].label}</dt>
                {latest ? (
                  <dd>
                    <strong>{valueText(latest, i)}</strong>, {percentileNote(latest, i, dataset !== null)}
                    <span className="block text-sm text-muted">
                      {formatDate(latest.time)}, age {ageLabel(latest.ageDays)}
                    </span>
                  </dd>
                ) : (
                  <dd className="text-muted">
                    {i === 'bmi' ? 'Needs a weight and a height measured on the same day' : 'Not measured yet'}
                  </dd>
                )}
              </div>
            );
          })}
        </dl>
      </section>

      <section className="card" aria-labelledby="chart-heading">
        <SegmentedControl
          options={INDICATOR_OPTIONS}
          value={indicator}
          onChange={(next) => {
            setIndicator(next);
            setSelectedId(null);
          }}
          ariaLabel="Measurement to chart"
          fullWidth
        />
        <h2 id="chart-heading" className="text-lg font-extrabold">
          {meta.label} by age ({meta.unit})
        </h2>

        {series.length === 0 ? (
          <p className="text-sm text-muted">No {meta.label.toLowerCase()} measurements yet.</p>
        ) : (
          <>
            <GrowthChart
              label={meta.label}
              unit={meta.unit}
              curves={curves}
              points={series}
              ageRange={ageRange}
              selectedId={selected?.entryId ?? null}
              onSelect={setSelectedId}
            />
            {selected && (
              <p role="status" data-testid="selected-point">
                <strong>{valueText(selected, indicator)}</strong>,{' '}
                {percentileNote(selected, indicator, dataset !== null)}
                <span className="block text-sm text-muted">
                  {formatDate(selected.time)}, age {ageLabel(selected.ageDays)}. Hover over or tap a
                  point to see another measurement.
                </span>
              </p>
            )}
            {curves.length > 0 && (
              <p className="text-sm text-muted">
                Grey lines are the WHO 3rd, 15th, 50th, 85th and 97th percentiles for{' '}
                {profile.sex === 'female' ? 'girls' : 'boys'}; the purple line is {profile.name}.
              </p>
            )}
          </>
        )}
      </section>

      {series.length > 0 && (
        <section className="card" aria-labelledby="table-heading">
          <h2 id="table-heading" className="text-lg font-extrabold">
            {meta.label} measurements
          </h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-muted">
                <th className="py-1.5 pr-2 font-bold">Date</th>
                <th className="py-1.5 pr-2 font-bold">Age</th>
                <th className="py-1.5 pr-2 font-bold">{meta.unit}</th>
                <th className="py-1.5 font-bold">Percentile</th>
              </tr>
            </thead>
            <tbody>
              {[...series].reverse().map((p) => (
                <tr key={p.entryId} className="border-t border-line">
                  <td className="py-2 pr-2">{formatDate(p.time)}</td>
                  <td className="py-2 pr-2">{ageLabel(p.ageDays)}</td>
                  <td className="py-2 pr-2 font-bold">{p.value}</td>
                  <td className="py-2">
                    {p.percentile === null ? 'n/a' : percentileText(p.percentile).replace(' percentile', '')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <p className="px-1 text-sm text-muted">
        Percentiles compare with the WHO growth standards (0 to 5 years) and reference (5 to 19
        years). They are a guide, not a diagnosis; your healthcare provider looks at the pattern
        over time.
      </p>
    </>
  );
}

function seriesByIndicator(
  entries: GrowthEntry[],
  profile: Profile,
  dataset: WhoDataset | null,
): Record<Indicator, GrowthPoint[]> {
  return {
    weight: growthSeries(entries, profile, 'weight', dataset),
    height: growthSeries(entries, profile, 'height', dataset),
    bmi: growthSeries(entries, profile, 'bmi', dataset),
    head: growthSeries(entries, profile, 'head', dataset),
  };
}
