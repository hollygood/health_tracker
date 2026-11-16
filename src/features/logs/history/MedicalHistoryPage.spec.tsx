import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { leo, mia, sampleEntries } from '../../../test/fixtures';
import { loadEntries, saveEntries } from '../entryStorage';
import MedicalHistoryPage from './MedicalHistoryPage';
import { recognizeText } from './recognizeText';

vi.mock('./recognizeText', () => ({ recognizeText: vi.fn() }));

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

    // The saved note appears collapsed; opening it shows the rest.
    const note = screen.getByRole('button', { name: /^Flu shot/ });
    expect(note).toHaveAttribute('aria-expanded', 'false');
    await user.click(note);
    expect(screen.getByText('Left arm, no reaction')).toBeInTheDocument();
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

    await user.click(screen.getByRole('button', { name: /^Flu shot/ }));
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByLabelText('Title')).toHaveValue('Flu shot');
    expect(screen.getByLabelText('Category')).toHaveValue('Vaccination');
    await user.type(screen.getByLabelText('Description'), 'Second dose due in 4 weeks');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(loadEntries()).toEqual([
      expect.objectContaining({ id: 'e-hist', title: 'Flu shot', description: 'Second dose due in 4 weeks' }),
    ]);
  });

  describe('text from a photo', () => {
    const photo = () => new File(['fake image bytes'], 'visit.jpg', { type: 'image/jpeg' });

    it('puts the recognised text into the description, ready to edit and save', async () => {
      vi.mocked(recognizeText).mockResolvedValue('Amoxicillin 250 mg\nTwice daily for 7 days');
      const user = renderPage();

      await user.type(screen.getByLabelText('Title'), 'Prescription');
      await user.upload(screen.getByLabelText('Photo to read text from'), photo());

      const description = screen.getByLabelText('Description');
      await waitFor(() => expect(description.innerHTML).toBe('Amoxicillin 250 mg<br>Twice daily for 7 days'));

      await user.type(description, ' with food');
      await user.click(screen.getByRole('button', { name: 'Save to medical history' }));

      expect(loadEntries()[0]).toEqual(
        expect.objectContaining({
          title: 'Prescription',
          description: 'Amoxicillin 250 mg<br>Twice daily for 7 days with food',
        }),
      );
    });

    it('adds to a description that was already typed, instead of replacing it', async () => {
      vi.mocked(recognizeText).mockResolvedValue('Follow up in 2 weeks');
      const user = renderPage();

      await user.type(screen.getByLabelText('Description'), 'Seen for ear pain.');
      await user.upload(screen.getByLabelText('Photo to read text from'), photo());

      await waitFor(() =>
        expect(screen.getByLabelText('Description').innerHTML).toBe(
          'Seen for ear pain.<br><br>Follow up in 2 weeks',
        ),
      );
    });
  });
});
