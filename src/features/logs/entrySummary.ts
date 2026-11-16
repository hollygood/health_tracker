import { richToOneLine } from '../../components/richText/richTextFormat';
import type { Entry } from './entryTypes';
import { celsiusToFahrenheit, formatDateTime } from './formatters';

/** The short description of an entry, without its notes. */
export function entryHeadline(entry: Entry): string {
  switch (entry.type) {
    case 'medicine':
      return `${entry.medicineName}, ${entry.amount} ${entry.unit}`;
    case 'temperature':
      return `${entry.celsius} °C (${celsiusToFahrenheit(entry.celsius)} °F)`;
    case 'sickness':
      return `${entry.category}, ${entry.endTime ? `recovered ${formatDateTime(entry.endTime)}` : 'ongoing'}`;
    case 'growth':
      return growthValues(entry)
        .map(({ label, value }) => `${label} ${value}`)
        .join(', ');
    case 'history':
      return `${entry.title} (${entry.category})`;
  }
}

/** The free-text part of an entry (notes or description), as stored: plain text or editor HTML. */
export function entryNotes(entry: Entry): string {
  switch (entry.type) {
    case 'medicine':
    case 'sickness':
      return entry.notes;
    case 'history':
      return entry.description;
    default:
      return '';
  }
}

/** One-line plain-text description of an entry, notes included. */
export function entrySummary(entry: Entry): string {
  const notes = richToOneLine(entryNotes(entry));
  return notes ? `${entryHeadline(entry)}. ${notes}` : entryHeadline(entry);
}

/** The measurements of a growth entry that were filled in, as label and value pairs. */
export function growthValues(entry: Extract<Entry, { type: 'growth' }>): { label: string; value: string }[] {
  return [
    entry.heightCm !== null && { label: 'Height', value: `${entry.heightCm} cm` },
    entry.weightKg !== null && { label: 'Weight', value: `${entry.weightKg} kg` },
    entry.headCm !== null && { label: 'Head', value: `${entry.headCm} cm` },
  ].filter((row) => row !== false);
}
