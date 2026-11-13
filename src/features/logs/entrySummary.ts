import type { Entry } from './entryTypes';
import { celsiusToFahrenheit, formatDateTime } from './formatters';

/** One-line plain-text description of an entry, used in lists and exports. */
export function entrySummary(entry: Entry): string {
  switch (entry.type) {
    case 'medicine': {
      const base = `${entry.medicineName}, ${entry.amount} ${entry.unit}`;
      return entry.notes ? `${base}. ${entry.notes}` : base;
    }
    case 'temperature':
      return `${entry.celsius} °C (${celsiusToFahrenheit(entry.celsius)} °F)`;
    case 'sickness': {
      const status = entry.endTime ? `recovered ${formatDateTime(entry.endTime)}` : 'ongoing';
      const base = `${entry.category}, ${status}`;
      return entry.notes ? `${base}. ${entry.notes}` : base;
    }
    case 'growth': {
      const parts = [
        entry.weightKg !== null && `Weight ${entry.weightKg} kg`,
        entry.heightCm !== null && `Height ${entry.heightCm} cm`,
        entry.headCm !== null && `Head ${entry.headCm} cm`,
      ].filter(Boolean);
      return parts.join(', ');
    }
    case 'history': {
      const base = `${entry.title} (${entry.category})`;
      return entry.description ? `${base}. ${entry.description}` : base;
    }
  }
}
