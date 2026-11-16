import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { leo, mia, sampleEntries } from '../../../test/fixtures';
import type { Profile } from '../../profiles/profileStorage';
import { loadEntries, saveEntries } from '../entryStorage';
import MedicineLogPage from './MedicineLogPage';

function renderPage(profile: Profile | null) {
  const onSaveProfile = vi.fn();
  render(
    <MedicineLogPage
      profile={profile}
      onBack={() => {}}
      onOpenProfiles={() => {}}
      onSaveProfile={onSaveProfile}
    />,
  );
  return { onSaveProfile, user: userEvent.setup() };
}

describe('MedicineLogPage', () => {
  it('offers the calculator medicines plus Other', () => {
    renderPage(mia);

    const options = within(screen.getByLabelText('Type')).getAllByRole('option');
    expect(options.map((o) => o.textContent)).toEqual([
      'Advil Concentrated Drops',
      "Advil Children's Liquid",
      'Tylenol Concentrated Drops',
      "Tylenol Children's Liquid",
      'Other',
    ]);
  });

  it("pre-fills the suggested dose from the profile's weight", () => {
    renderPage(leo); // 12 kg

    expect(screen.getByLabelText('Amount (mL)')).toHaveValue(3);
    expect(screen.getByTestId('dose-suggestion')).toHaveTextContent(
      'Suggested dose: 3 mL (120 mg) for 12 kg',
    );
  });

  it('updates the suggestion when the medicine changes', async () => {
    const { user } = renderPage(leo);

    await user.selectOptions(screen.getByLabelText('Type'), "Tylenol Children's Liquid");

    expect(screen.getByLabelText('Amount (mL)')).toHaveValue(5.6);
  });

  it('gives no suggestion when the product is not listed for the weight', () => {
    renderPage({ ...leo, weightKg: 20 });

    expect(screen.getByLabelText('Amount (mL)')).toHaveValue(null);
    expect(screen.getByTestId('dose-suggestion')).toHaveTextContent('No suggested dose.');
  });

  it('asks for a weight when the profile has none, and saves it', async () => {
    const { user, onSaveProfile } = renderPage(mia);

    expect(screen.getByText(/Add Mia's weight to get a suggested dose/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add weight' }));
    await user.type(screen.getByLabelText('Weight in kg'), '14');
    await user.click(screen.getByRole('button', { name: 'Save weight' }));

    expect(onSaveProfile).toHaveBeenCalledWith(
      expect.objectContaining({ id: mia.id, weightKg: 14, weightUpdatedAt: expect.any(String) }),
    );
  });

  it('saves a dose and lists it under Recent', async () => {
    const { user } = renderPage(leo);

    await user.type(screen.getByLabelText('Notes'), 'After lunch');
    await user.click(screen.getByRole('button', { name: 'Save medicine' }));

    expect(screen.getByText('Advil Concentrated Drops, 3 mL')).toBeInTheDocument();
    expect(screen.getByText('After lunch')).toBeInTheDocument();
    expect(loadEntries()).toEqual([
      expect.objectContaining({
        type: 'medicine',
        profileId: leo.id,
        medicineId: 'advil-concentrated-drops',
        amount: 3,
        unit: 'mL',
        notes: 'After lunch',
      }),
    ]);
  });

  it('lets the user override the suggested amount', async () => {
    const { user } = renderPage(leo);

    const amount = screen.getByLabelText('Amount (mL)');
    await user.clear(amount);
    await user.type(amount, '2.5');
    await user.click(screen.getByRole('button', { name: 'Save medicine' }));

    expect(loadEntries()[0]).toEqual(expect.objectContaining({ amount: 2.5 }));
  });

  it('logs another medicine by name and unit', async () => {
    const { user } = renderPage(mia);

    await user.selectOptions(screen.getByLabelText('Type'), 'Other');
    await user.type(screen.getByLabelText('Medicine name'), 'Amoxicillin');
    await user.selectOptions(screen.getByLabelText('Unit'), 'mg');
    await user.type(screen.getByLabelText('Amount (mg)'), '250');
    await user.click(screen.getByRole('button', { name: 'Save medicine' }));

    expect(loadEntries()[0]).toEqual(
      expect.objectContaining({ medicineId: null, medicineName: 'Amoxicillin', amount: 250, unit: 'mg' }),
    );
  });

  it('requires an amount', async () => {
    const { user } = renderPage(mia);

    await user.click(screen.getByRole('button', { name: 'Save medicine' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter the amount given.');
    expect(loadEntries()).toEqual([]);
  });

  it('asks for a profile when there is none', () => {
    renderPage(null);

    expect(screen.getByText('Add a profile to start logging')).toBeInTheDocument();
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });

  describe('editing', () => {
    it('loads a saved dose into the form and saves the changes', async () => {
      saveEntries(sampleEntries.filter((e) => e.type === 'medicine'));
      const { user } = renderPage(leo);

      await user.click(screen.getByRole('button', { name: 'Edit entry' }));
      expect(screen.getByRole('form', { name: 'Edit medicine' })).toBeInTheDocument();
      expect(screen.getByLabelText('Type')).toHaveValue('advil-childrens-liquid');
      expect(screen.getByLabelText('Amount (mL)')).toHaveValue(6);
      expect(screen.getByLabelText('Notes')).toHaveTextContent('After lunch');

      const amount = screen.getByLabelText('Amount (mL)');
      await user.clear(amount);
      await user.type(amount, '7');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(loadEntries()).toEqual([
        expect.objectContaining({ id: 'e-med', amount: 7, time: '2026-11-10T13:30:00.000Z' }),
      ]);
      expect(screen.getByRole('form', { name: 'Log medicine' })).toBeInTheDocument();
    });

    it('leaves the entry unchanged when cancelled', async () => {
      saveEntries(sampleEntries.filter((e) => e.type === 'medicine'));
      const { user } = renderPage(leo);

      await user.click(screen.getByRole('button', { name: 'Edit entry' }));
      await user.clear(screen.getByLabelText('Amount (mL)'));
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(loadEntries()[0]).toEqual(expect.objectContaining({ amount: 6 }));
      expect(screen.getByRole('form', { name: 'Log medicine' })).toBeInTheDocument();
    });

    it('stops editing when the entry being edited is deleted', async () => {
      saveEntries(sampleEntries.filter((e) => e.type === 'medicine'));
      const { user } = renderPage(leo);

      await user.click(screen.getByRole('button', { name: 'Edit entry' }));
      await user.click(screen.getByRole('button', { name: 'Delete entry' }));
      await user.click(screen.getByRole('button', { name: 'Confirm delete' }));

      expect(loadEntries()).toEqual([]);
      expect(screen.getByRole('form', { name: 'Log medicine' })).toBeInTheDocument();
    });
  });
});
