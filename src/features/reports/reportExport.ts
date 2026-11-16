import { richToOneLine } from '../../components/richText/richTextFormat';
import { ENTRY_TYPES } from '../logs/entryTypeMeta';
import { ENTRY_TYPE_LABELS, type Entry } from '../logs/entryTypes';
import { celsiusToFahrenheit, toDateInputValue, toDateTimeInputValue } from '../logs/formatters';
import { ageText, type Profile } from '../profiles/profileStorage';
import { groupByDay, type ReportFilters } from './reportFilters';

/**
 * Builds the export text: Markdown with one section per day, oldest first, in fixed
 * formats (yyyy-mm-dd, 24-hour local time) so people and AI tools read it the same way.
 */

const localDateTime = (iso: string) => toDateTimeInputValue(new Date(iso)).replace('T', ' ');
const localTime = (iso: string) => localDateTime(iso).slice(11);

/** Length of time between two ISO datetimes, e.g. `40 min`, `5 h`, `2 d 3 h`. */
export function durationText(startIso: string, endIso: string): string {
  const minutes = Math.max(0, Math.round((Date.parse(endIso) - Date.parse(startIso)) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const rest = minutes % 60;
    return rest ? `${hours} h ${rest} min` : `${hours} h`;
  }
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours ? `${days} d ${restHours} h` : `${days} d`;
}

function entryDetails(entry: Entry): string {
  switch (entry.type) {
    case 'medicine':
      return `${entry.medicineName}, ${entry.amount} ${entry.unit}${
        entry.notes ? `. Notes: ${richToOneLine(entry.notes)}` : ''
      }`;
    case 'temperature':
      return `${entry.celsius} °C (${celsiusToFahrenheit(entry.celsius)} °F)`;
    case 'sickness': {
      const status = entry.endTime
        ? `recovered ${localDateTime(entry.endTime)} (lasted ${durationText(entry.time, entry.endTime)})`
        : 'ongoing';
      return `${entry.category}, ${status}${entry.notes ? `. Notes: ${richToOneLine(entry.notes)}` : ''}`;
    }
    case 'growth':
      return [
        entry.weightKg !== null && `weight ${entry.weightKg} kg`,
        entry.heightCm !== null && `height ${entry.heightCm} cm`,
        entry.headCm !== null && `head circumference ${entry.headCm} cm`,
      ]
        .filter(Boolean)
        .join(', ');
    case 'history':
      return `${entry.title} (${entry.category})${
        entry.description ? `. ${richToOneLine(entry.description)}` : ''
      }`;
  }
}

/** One entry as text, e.g. `Medicine: Advil Children's Liquid, 6 mL. Notes: After lunch`. */
export function exportLine(entry: Entry): string {
  return `${ENTRY_TYPE_LABELS[entry.type]}: ${entryDetails(entry)}`;
}

function periodText({ from, to }: ReportFilters): string {
  if (!from && !to) return 'all dates';
  return `${from || 'earliest entry'} to ${to || 'latest entry'}`;
}

function includedText({ types, categories }: ReportFilters): string {
  if (types.length === 0 && categories.length === 0) {
    return ENTRY_TYPES.map((t) => ENTRY_TYPE_LABELS[t]).join(', ');
  }
  const typeLabels = ENTRY_TYPES.filter((t) => types.includes(t)).map((t) => ENTRY_TYPE_LABELS[t]);
  return [...typeLabels, ...categories].join(', ');
}

interface ReportInput {
  profile: Profile;
  /** Entries already filtered; any order. */
  entries: Entry[];
  /** The filters that produced `entries`, described in the report header. */
  filters: ReportFilters;
  generatedAt?: Date;
}

export function buildReportText({
  profile,
  entries,
  filters,
  generatedAt = new Date(),
}: ReportInput): string {
  const oldestFirst = [...entries].sort((a, b) => a.time.localeCompare(b.time));
  const age = ageText(profile.birthday, generatedAt);

  const header = [
    `- Birthday: ${profile.birthday}${age ? ` (age ${age})` : ''}`,
    `- Sex: ${profile.sex}`,
    profile.weightKg &&
      `- Latest saved weight: ${profile.weightKg} kg${
        profile.weightUpdatedAt ? ` (${toDateInputValue(new Date(profile.weightUpdatedAt))})` : ''
      }`,
    `- Period: ${periodText(filters)}`,
    `- Included: ${includedText(filters)}`,
    `- Entries: ${oldestFirst.length}`,
    `- Generated: ${localDateTime(generatedAt.toISOString())}`,
    '- Times are local, 24-hour. Entries are listed oldest first.',
  ].filter(Boolean);

  const lines = [`# Health report: ${profile.name}`, '', ...header];

  if (oldestFirst.length === 0) lines.push('', 'No entries match these filters.');

  for (const { day, entries: dayEntries } of groupByDay(oldestFirst)) {
    lines.push('', `## ${day}`, '');
    for (const entry of dayEntries) {
      // Growth is recorded by date only, so it has no time of day.
      const time = entry.type === 'growth' ? '' : `${localTime(entry.time)} `;
      lines.push(`- ${time}${exportLine(entry)}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

/** File name for a downloaded report, e.g. `health-report-leo-2026-11-11.md`. */
export function reportFileName(profile: Profile, generatedAt = new Date()): string {
  const slug = profile.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `health-report-${slug || 'profile'}-${toDateInputValue(generatedAt)}.md`;
}
