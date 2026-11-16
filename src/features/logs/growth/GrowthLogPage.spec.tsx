import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { leo, mia, sampleEntries } from '../../../test/fixtures';
import type { Profile } from '../../profiles/profileStorage';
import { loadEntries, saveEntries } from '../entryStorage';
import GrowthLogPage from './GrowthLogPage';

function renderPage(profile: Profile = mia) {
  const onSaveProfile = vi.fn();
  const onOpenChart = vi.fn();
  render(
    <GrowthLogPage
      profile={profile}
      onBack={() => {}}
      onOpenProfiles={() => {}}
      onSaveProfile={onSaveProfile}
      onOpenChart={onOpenChart}
    />,
  );
  return { onSaveProfile, onOpenChart, user: userEvent.setup() };
}

describe('GrowthLogPage', () => {
  it('saves height, weight and head circumference', async () => {
    const { user } = renderPage();

    await user.type(screen.getByLabelText('Height (cm)'), '98.5');
    await user.type(screen.getByLabelText('Weight'), '14.2');
    await user.type(screen.getByLabelText('Head circumference (cm)'), '49');
    await user.click(screen.getByRole('button', { name: 'Save growth' }));

    // Each measurement on its own row: label on the left, value on the right.
    const saved = screen.getByRole('listitem');
    expect(saved).toHaveTextContent('Height98.5 cm');
    expect(saved).toHaveTextContent('Weight14.2 kg');
    expect(saved).toHaveTextContent('Head49 cm');
    expect(loadEntries()).toEqual([
      expect.objectContaining({ type: 'growth', heightCm: 98.5, weightKg: 14.2, headCm: 49 }),
    ]);
  });

  it('accepts a single measurement', async () => {
    const { user } = renderPage();

    await user.type(screen.getByLabelText('Height (cm)'), '98');
    await user.click(screen.getByRole('button', { name: 'Save growth' }));

    expect(loadEntries()[0]).toEqual(
      expect.objectContaining({ heightCm: 98, weightKg: null, headCm: null }),
    );
  });

  it('converts a weight in pounds to kg', async () => {
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: 'pounds' }));
    await user.type(screen.getByLabelText('Weight'), '30');
    await user.click(screen.getByRole('button', { name: 'Save growth' }));

    expect(loadEntries()[0]).toEqual(expect.objectContaining({ weightKg: 13.61 }));
  });

  it("updates the profile's weight with a new measurement", async () => {
    const { user, onSaveProfile } = renderPage(leo);

    await user.type(screen.getByLabelText('Weight'), '12.8');
    await user.click(screen.getByRole('button', { name: 'Save growth' }));

    expect(onSaveProfile).toHaveBeenCalledWith(expect.objectContaining({ id: leo.id, weightKg: 12.8 }));
  });

  it("replaces a weight that was saved earlier the same day", async () => {
    const savedToday = { ...leo, weightUpdatedAt: new Date().toISOString() };
    const { user, onSaveProfile } = renderPage(savedToday);

    await user.type(screen.getByLabelText('Weight'), '12.8');
    await user.click(screen.getByRole('button', { name: 'Save growth' }));

    expect(onSaveProfile).toHaveBeenCalledWith(expect.objectContaining({ weightKg: 12.8 }));
  });

  it("does not replace the profile's weight with an older measurement", async () => {
    const { user, onSaveProfile } = renderPage(leo); // weight saved 2026-10-01

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-06-01' } });
    await user.type(screen.getByLabelText('Weight'), '11');
    await user.click(screen.getByRole('button', { name: 'Save growth' }));

    expect(loadEntries()).toHaveLength(1);
    expect(onSaveProfile).not.toHaveBeenCalled();
  });

  it('requires at least one measurement', async () => {
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Save growth' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter at least one measurement.');
    expect(loadEntries()).toEqual([]);
  });

  it('edits a saved measurement', async () => {
    saveEntries(sampleEntries.filter((e) => e.type === 'growth'));
    const { user } = renderPage(leo);

    await user.click(screen.getByRole('button', { name: 'Edit entry' }));
    const height = screen.getByLabelText('Height (cm)');
    expect(height).toHaveValue(88.5);
    expect(screen.getByLabelText('Weight')).toHaveValue(12);
    await user.clear(height);
    await user.type(height, '89');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(loadEntries()).toEqual([
      expect.objectContaining({ id: 'e-growth', heightCm: 89, weightKg: 12, headCm: 48 }),
    ]);
  });

  it('opens the growth chart', async () => {
    const { user, onOpenChart } = renderPage();

    await user.click(screen.getByRole('button', { name: 'View growth chart' }));

    expect(onOpenChart).toHaveBeenCalledOnce();
  });
});
