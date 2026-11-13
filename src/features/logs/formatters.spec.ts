import { describe, expect, it } from 'vitest';
import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  inputValueToIso,
  kgToLb,
  lbToKg,
  parseNumber,
  round,
  toDateInputValue,
  toDateTimeInputValue,
} from './formatters';

describe('formatters', () => {
  it('formats dates for date and datetime inputs in local time', () => {
    const date = new Date(2026, 0, 5, 9, 7);

    expect(toDateInputValue(date)).toBe('2026-01-05');
    expect(toDateTimeInputValue(date)).toBe('2026-01-05T09:07');
  });

  it('round-trips a datetime input value through ISO', () => {
    const iso = inputValueToIso('2026-11-10T08:30');

    expect(iso).toBe(new Date(2026, 10, 10, 8, 30).toISOString());
    expect(toDateTimeInputValue(new Date(iso!))).toBe('2026-11-10T08:30');
  });

  it('keeps a bare date on the same local day', () => {
    const iso = inputValueToIso('2026-11-10');

    expect(toDateInputValue(new Date(iso!))).toBe('2026-11-10');
  });

  it('returns null for empty or invalid input values', () => {
    expect(inputValueToIso('')).toBeNull();
    expect(inputValueToIso('not a date')).toBeNull();
  });

  it('converts temperatures', () => {
    expect(celsiusToFahrenheit(37)).toBe(98.6);
    expect(celsiusToFahrenheit(38.5)).toBe(101.3);
    expect(fahrenheitToCelsius(98.6)).toBe(37);
    expect(fahrenheitToCelsius(101.3)).toBe(38.5);
  });

  it('converts weights with the exact pound', () => {
    expect(lbToKg(30)).toBe(13.61);
    expect(lbToKg(22)).toBe(9.98);
    expect(kgToLb(10)).toBe(22);
  });

  it('rounds half up without float drift', () => {
    expect(round(1.005, 2)).toBe(1.01);
    expect(round(38.45, 1)).toBe(38.5);
  });

  it('parses number fields', () => {
    expect(parseNumber('14.5')).toBe(14.5);
    expect(parseNumber('  ')).toBeNull();
    expect(parseNumber('abc')).toBeNull();
  });
});
