import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { leo, mia, sampleEntries } from '../../../test/fixtures';
import { loadEntries, saveEntries } from '../entryStorage';
import MedicalHistoryPage from './MedicalHistoryPage';

function renderPage() {
  render(<MedicalHistoryPage profile={mia} onBack={() => {}} onOpenProfiles={() => {}} />);
  return userEvent.setup();
}

describe('MedicalHistoryPage', () => {
  it('saves a title, category and description', async () => {
    const user = renderPage();

    await user.type(screen.getByLabelText('Title'), 'Flu shot');
    await user.selectOptions(screen.getByLabelText('Category'), 'Vaccination');
    await user.type(screen.getByLabelText('Description'), 'Left arm, no reaction');
    await user.click(screen.getByRole('button', { name: 'Save to medical history' }));

    expect(screen.getByText('Flu shot (Vaccination). Left arm, no reaction')).toBeInTheDocument();
    expect(loadEntries()).toEqual([
      expect.objectContaining({
        type: 'history',
        profileId: mia.id,
        title: 'Flu shot',
        category: 'Vaccination',
        description: 'Left arm, no reaction',
      }),
    ]);
  });

  it('requires a title', async () => {
    const user = renderPage();

    await user.click(screen.getByRole('button', { name: 'Save to medical history' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a title.');
    expect(loadEntries()).toEqual([]);
  });

  it('clears the form after saving', async () => {
    const user = renderPage();

    await user.type(screen.getByLabelText('Title'), 'Checkup');
    await user.click(screen.getByRole('button', { name: 'Save to medical history' }));

    expect(screen.getByLabelText('Title')).toHaveValue('');
  });

  it('edits a saved item', async () => {
    saveEntries(sampleEntries.filter((e) => e.type === 'history'));
    render(<MedicalHistoryPage profile={leo} onBack={() => {}} onOpenProfiles={() => {}} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Edit entry' }));
    expect(screen.getByLabelText('Title')).toHaveValue('Flu shot');
    expect(screen.getByLabelText('Category')).toHaveValue('Vaccination');
    await user.type(screen.getByLabelText('Description'), 'Second dose due in 4 weeks');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(loadEntries()).toEqual([
      expect.objectContaining({ id: 'e-hist', title: 'Flu shot', description: 'Second dose due in 4 weeks' }),
    ]);
  });
});
