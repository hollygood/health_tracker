import { describe, expect, it } from 'vitest';
import { sampleEntries } from '../../test/fixtures';
import { entrySummary } from './entrySummary';
import type { Entry, EntryType } from './entryTypes';

const byType = (type: EntryType) => sampleEntries.find((e) => e.type === type) as Entry;

describe('entrySummary', () => {
  it('describes a medicine dose with its notes', () => {
    expect(entrySummary(byType('medicine'))).toBe("Advil Children's Liquid, 6 mL. After lunch");
  });

  it('shows a temperature in both units', () => {
    expect(entrySummary(byType('temperature'))).toBe('38.5 °C (101.3 °F)');
  });

  it('marks a sickness without an end time as ongoing', () => {
    expect(entrySummary(byType('sickness'))).toBe('Fever, ongoing');
  });

  it('marks a sickness with an end time as recovered', () => {
    const recovered = { ...byType('sickness'), endTime: '2026-11-11T08:00:00.000Z' } as Entry;

    expect(entrySummary(recovered)).toMatch(/^Fever, recovered /);
  });

  it('lists only the growth measurements that were entered', () => {
    expect(entrySummary(byType('growth'))).toBe('Weight 12 kg, Height 88.5 cm, Head 48 cm');
    expect(entrySummary({ ...byType('growth'), heightCm: null, headCm: null } as Entry)).toBe(
      'Weight 12 kg',
    );
  });

  it('describes a medical history item', () => {
    expect(entrySummary(byType('history'))).toBe('Flu shot (Vaccination)');
  });
});
