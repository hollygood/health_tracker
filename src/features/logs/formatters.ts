/** Date, unit and number helpers shared by the log pages and reports. */

const pad = (n: number) => String(n).padStart(2, '0');

/** Value for `<input type="date">` in local time: yyyy-mm-dd. */
export function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Value for `<input type="datetime-local">` in local time: yyyy-mm-ddThh:mm. */
export function toDateTimeInputValue(date: Date): string {
  return `${toDateInputValue(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Local date/datetime input value -> ISO string, or null if it is not a valid date. */
export function inputValueToIso(value: string): string | null {
  if (!value) return null;
  // A bare date is taken as local noon so it stays on the same day in any timezone.
  const date = new Date(value.length === 10 ? `${value}T12:00` : value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export const LB_PER_KG = 2.2046226218;

export const round = (n: number, decimals: number) => {
  const f = 10 ** decimals;
  return Math.round((n + Number.EPSILON) * f) / f;
};

export const celsiusToFahrenheit = (c: number) => round((c * 9) / 5 + 32, 1);
export const fahrenheitToCelsius = (f: number) => round(((f - 32) * 5) / 9, 1);
export const lbToKg = (lb: number) => round(lb / LB_PER_KG, 2);
export const kgToLb = (kg: number) => round(kg * LB_PER_KG, 1);

/** Parses a number field. Empty or invalid text gives null. */
export function parseNumber(text: string): number | null {
  if (text.trim() === '') return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}
