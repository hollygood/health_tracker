import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { leo, mia, sampleEntries } from '../../../test/fixtures';
import { loadCustomCategories, loadEntries, saveEntries } from '../entryStorage';
import SicknessLogPage from './SicknessLogPage';

function renderPage() {
  render(<SicknessLogPage profile={mia} onBack={() => {}} onOpenProfiles={() => {}} />);
  return userEvent.setup();
}

describe('SicknessLogPage', () => {
  it('offers the default categories', () => {
    renderPage();

    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Cold',
      'Fever',
      'Stomach flu',
      'Diarrhea',
    ]);
  });

  it('saves an ongoing sickness without an end time', async () => {
    const user = renderPage();

    await user.selectOptions(screen.getByLabelText('Category'), 'Fever');
    await user.click(screen.getByRole('button', { name: 'Save sickness' }));

    expect(screen.getByText('Fever, ongoing')).toBeInTheDocument();
    expect(loadEntries()).toEqual([
      expect.objectContaining({ type: 'sickness', category: 'Fever', endTime: null }),
    ]);
  });

  it('marks an ongoing sickness as recovered later', async () => {
    const user = renderPage();

    await user.click(screen.getByRole('button', { name: 'Save sickness' }));
    await user.click(screen.getByRole('button', { name: 'Mark as recovered now' }));

    expect(screen.getByText(/^Cold, recovered /)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark as recovered now' })).not.toBeInTheDocument();
    expect(loadEntries()[0]).toEqual(expect.objectContaining({ endTime: expect.any(String) }));
  });

  it('rejects an end time before the start time', async () => {
    const user = renderPage();

    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '2026-11-10T08:00' } });
    fireEvent.change(screen.getByLabelText('End time (optional)'), {
      target: { value: '2026-11-09T08:00' },
    });
    await user.click(screen.getByRole('button', { name: 'Save sickness' }));

    expect(screen.getByRole('alert')).toHaveTextContent('The end time is before the start time.');
    expect(loadEntries()).toEqual([]);
  });

  it('adds a custom category, uses it, and remembers it', async () => {
    const user = renderPage();

    await user.click(screen.getByRole('button', { name: 'Add a category' }));
    await user.type(screen.getByLabelText('New category'), 'Ear infection');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByLabelText('Category')).toHaveValue('Ear infection');

    await user.click(screen.getByRole('button', { name: 'Save sickness' }));

    expect(loadEntries()[0]).toEqual(expect.objectContaining({ category: 'Ear infection' }));
    expect(loadCustomCategories().sickness).toEqual(['Ear infection']);
  });

  it('edits a sickness to add the end time after recovery', async () => {
    saveEntries(sampleEntries.filter((e) => e.type === 'sickness'));
    render(<SicknessLogPage profile={leo} onBack={() => {}} onOpenProfiles={() => {}} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Edit entry' }));
    expect(screen.getByLabelText('Category')).toHaveValue('Fever');
    fireEvent.change(screen.getByLabelText('End time (optional)'), {
      target: { value: '2026-11-11T09:00' },
    });
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(loadEntries()).toEqual([
      expect.objectContaining({
        id: 'e-sick',
        category: 'Fever',
        endTime: new Date(2026, 10, 11, 9, 0).toISOString(),
      }),
    ]);
    expect(screen.getByText(/^Fever, recovered /)).toBeInTheDocument();
  });
});
