import { describe, expect, it } from 'vitest';
import { leo, mia } from '../../test/fixtures';
import { ageText, loadData, newId, saveData } from './profileStorage';

describe('profileStorage', () => {
  it('starts empty', () => {
    expect(loadData()).toEqual({ profiles: [], activeProfileId: null });
  });

  it('round-trips profiles through localStorage', () => {
    const data = { profiles: [mia, leo], activeProfileId: leo.id };
    saveData(data);

    expect(loadData()).toEqual(data);
  });

  it('falls back to empty when stored data is corrupt', () => {
    localStorage.setItem('health-tracker:v1', '{not json');

    expect(loadData()).toEqual({ profiles: [], activeProfileId: null });
  });

  it('generates unique ids', () => {
    expect(newId()).not.toBe(newId());
  });
});

describe('ageText', () => {
  const now = new Date('2026-11-11T12:00:00');

  it('uses months under two years', () => {
    expect(ageText('2026-05-11', now)).toBe('6 mo');
    expect(ageText('2025-01-20', now)).toBe('21 mo');
  });

  it('uses years and months from two years', () => {
    expect(ageText('2022-05-04', now)).toBe('4 y 6 mo');
    expect(ageText('2020-11-11', now)).toBe('6 y');
  });

  it('does not count a month that has not completed', () => {
    expect(ageText('2026-10-12', now)).toBe('0 mo');
  });

  it('returns nothing for a missing or future birthday', () => {
    expect(ageText('', now)).toBe('');
    expect(ageText('2027-01-01', now)).toBe('');
  });
});
