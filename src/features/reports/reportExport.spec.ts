import { describe, expect, it } from 'vitest';
import type { Entry } from '../logs/entryTypes';
import type { Profile } from '../profiles/profileStorage';
import { buildReportText, durationText, exportLine, reportFileName } from './reportExport';
import { NO_FILTERS } from './reportFilters';

/** Local-time ISO string, so the tests pass in any timezone. */
const at = (y: number, m: number, d: number, h = 12, min = 0) =>
  new Date(y, m - 1, d, h, min).toISOString();

const leo: Profile = {
  id: 'p-leo',
  name: 'Leo',
  birthday: '2024-01-15',
  sex: 'male',
  weightKg: 12,
  weightUpdatedAt: at(2026, 10, 1),
};

const base = { profileId: leo.id };
const medicine: Entry = { ...base, id: 'med', type: 'medicine', time: at(2026, 11, 10, 9, 30), medicineId: 'advil-childrens-liquid', medicineName: "Advil Children's Liquid", amount: 6, unit: 'mL', notes: 'After lunch' };
const temperature: Entry = { ...base, id: 'temp', type: 'temperature', time: at(2026, 11, 10, 9, 0), celsius: 38.5 };
const sickness: Entry = { ...base, id: 'sick', type: 'sickness', time: at(2026, 11, 9, 8, 0), endTime: null, category: 'Fever', notes: '' };
const growth: Entry = { ...base, id: 'growth', type: 'growth', time: at(2026, 10, 1), heightCm: 88.5, weightKg: 12, headCm: 48 };
const history: Entry = { ...base, id: 'hist', type: 'history', time: at(2026, 9, 15, 14, 0), title: 'Flu shot', category: 'Vaccination', description: 'Left arm.\nNo reaction.' };
const all = [medicine, temperature, sickness, growth, history];
const generatedAt = new Date(2026, 10, 11, 15, 10);

describe('exportLine', () => {
  it('writes a medicine dose with units and notes', () => {
    expect(exportLine(medicine)).toBe("Medicine: Advil Children's Liquid, 6 mL. Notes: After lunch");
  });

  it('writes a temperature in both units', () => {
    expect(exportLine(temperature)).toBe('Temperature: 38.5 °C (101.3 °F)');
  });

  it('writes an ongoing sickness', () => {
    expect(exportLine(sickness)).toBe('Sickness: Fever, ongoing');
  });

  it('writes a finished sickness with its end and duration', () => {
    const recovered = { ...sickness, endTime: at(2026, 11, 11, 11, 0) } as Entry;

    expect(exportLine(recovered)).toBe('Sickness: Fever, recovered 2026-11-11 11:00 (lasted 2 d 3 h)');
  });

  it('writes only the growth measurements that exist', () => {
    expect(exportLine(growth)).toBe('Growth: weight 12 kg, height 88.5 cm, head circumference 48 cm');
    expect(exportLine({ ...growth, weightKg: null, headCm: null } as Entry)).toBe('Growth: height 88.5 cm');
  });

  it('flattens a multi-line description onto one line', () => {
    expect(exportLine(history)).toBe('Medical history: Flu shot (Vaccination). Left arm. No reaction.');
  });
});

describe('durationText', () => {
  it('uses the largest sensible units', () => {
    expect(durationText(at(2026, 11, 9, 8), at(2026, 11, 9, 8, 40))).toBe('40 min');
    expect(durationText(at(2026, 11, 9, 8), at(2026, 11, 9, 13))).toBe('5 h');
    expect(durationText(at(2026, 11, 9, 8), at(2026, 11, 11, 8))).toBe('2 d');
    expect(durationText(at(2026, 11, 9, 8), at(2026, 11, 11, 11))).toBe('2 d 3 h');
  });
});

describe('buildReportText', () => {
  it('writes the whole report, oldest first, grouped by day', () => {
    const text = buildReportText({ profile: leo, entries: all, filters: NO_FILTERS, generatedAt });

    expect(text).toBe(`# Health report: Leo

- Birthday: 2024-01-15 (age 2 y 9 mo)
- Sex: male
- Latest saved weight: 12 kg (2026-10-01)
- Period: all dates
- Included: Medicine, Temperature, Sickness, Growth, Medical history
- Entries: 5
- Generated: 2026-11-11 15:10
- Times are local, 24-hour. Entries are listed oldest first.

## 2026-09-15

- 14:00 Medical history: Flu shot (Vaccination). Left arm. No reaction.

## 2026-10-01

- Growth: weight 12 kg, height 88.5 cm, head circumference 48 cm

## 2026-11-09

- 08:00 Sickness: Fever, ongoing

## 2026-11-10

- 09:00 Temperature: 38.5 °C (101.3 °F)
- 09:30 Medicine: Advil Children's Liquid, 6 mL. Notes: After lunch
`);
  });

  it('describes the filters that were applied', () => {
    const text = buildReportText({
      profile: leo,
      entries: [sickness],
      filters: { from: '2026-11-01', to: '', types: ['sickness', 'medicine'], categories: ['Vaccination'] },
      generatedAt,
    });

    expect(text).toMatch(/- Period: 2026-11-01 to latest entry\n/);
    expect(text).toMatch(/- Included: Medicine, Sickness, Vaccination\n/);
    expect(text).toMatch(/- Entries: 1\n/);
  });

  it('leaves out the weight line when the profile has no weight', () => {
    const text = buildReportText({
      profile: { ...leo, weightKg: undefined, weightUpdatedAt: undefined },
      entries: all,
      filters: NO_FILTERS,
      generatedAt,
    });

    expect(text.includes('Latest saved weight')).toBe(false);
  });

  it('says so when nothing matches', () => {
    const text = buildReportText({ profile: leo, entries: [], filters: NO_FILTERS, generatedAt });

    expect(text).toMatch(/- Entries: 0\n/);
    expect(text).toMatch(/No entries match these filters\.\n$/);
  });
});

describe('reportFileName', () => {
  it('uses the profile name and the date', () => {
    expect(reportFileName(leo, generatedAt)).toBe('health-report-leo-2026-11-11.md');
    expect(reportFileName({ ...leo, name: 'Mia Rose!' }, generatedAt)).toBe('health-report-mia-rose-2026-11-11.md');
    expect(reportFileName({ ...leo, name: '小明' }, generatedAt)).toBe('health-report-profile-2026-11-11.md');
  });
});
