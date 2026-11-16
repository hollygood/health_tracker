import { describe, expect, it } from 'vitest';
import { sampleEntries } from '../../test/fixtures';
import { entryHeadline, entryNotes, entrySummary, growthValues } from './entrySummary';
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
    expect(entrySummary(byType('growth'))).toBe('Height 88.5 cm, Weight 12 kg, Head 48 cm');
    expect(entrySummary({ ...byType('growth'), heightCm: null, headCm: null } as Entry)).toBe(
      'Weight 12 kg',
    );
  });

  it('describes a medical history item', () => {
    expect(entrySummary(byType('history'))).toBe('Flu shot (Vaccination)');
  });

  it('flattens formatted notes to plain words on one line', () => {
    const formatted = {
      ...byType('medicine'),
      notes: '<div>Give <b>with food</b></div><div>Watch for rash</div>',
    } as Entry;

    expect(entrySummary(formatted)).toBe("Advil Children's Liquid, 6 mL. Give with food Watch for rash");
  });
});

describe('entryHeadline and entryNotes', () => {
  it('separates the short description from the notes', () => {
    expect(entryHeadline(byType('medicine'))).toBe("Advil Children's Liquid, 6 mL");
    expect(entryNotes(byType('medicine'))).toBe('After lunch');
    expect(entryHeadline(byType('history'))).toBe('Flu shot (Vaccination)');
  });

  it('has no notes for temperature and growth', () => {
    expect(entryNotes(byType('temperature'))).toBe('');
    expect(entryNotes(byType('growth'))).toBe('');
  });
});

describe('growthValues', () => {
  it('lists height, weight and head in that order, as label and value', () => {
    const growth = byType('growth') as Extract<Entry, { type: 'growth' }>;

    expect(growthValues(growth)).toEqual([
      { label: 'Height', value: '88.5 cm' },
      { label: 'Weight', value: '12 kg' },
      { label: 'Head', value: '48 cm' },
    ]);
  });

  it('leaves out what was not measured', () => {
    const growth = { ...byType('growth'), heightCm: null, headCm: null } as Extract<Entry, { type: 'growth' }>;

    expect(growthValues(growth)).toEqual([{ label: 'Weight', value: '12 kg' }]);
  });
});
