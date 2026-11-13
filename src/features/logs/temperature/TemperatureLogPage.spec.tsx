import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { leo, mia, sampleEntries } from '../../../test/fixtures';
import { loadEntries, saveEntries } from '../entryStorage';
import TemperatureLogPage from './TemperatureLogPage';

function renderPage() {
  render(<TemperatureLogPage profile={mia} onBack={() => {}} onOpenProfiles={() => {}} />);
  return userEvent.setup();
}

describe('TemperatureLogPage', () => {
  it('saves a reading in Celsius', async () => {
    const user = renderPage();

    await user.type(screen.getByLabelText('Temperature'), '38.5');
    await user.click(screen.getByRole('button', { name: 'Save temperature' }));

    expect(screen.getByText('38.5 °C (101.3 °F)')).toBeInTheDocument();
    expect(loadEntries()).toEqual([
      expect.objectContaining({ type: 'temperature', profileId: mia.id, celsius: 38.5 }),
    ]);
  });

  it('converts a Fahrenheit reading to Celsius', async () => {
    const user = renderPage();

    await user.click(screen.getByRole('button', { name: '°F' }));
    await user.type(screen.getByLabelText('Temperature'), '101.3');
    await user.click(screen.getByRole('button', { name: 'Save temperature' }));

    expect(loadEntries()[0]).toEqual(expect.objectContaining({ celsius: 38.5 }));
  });

  it('uses the time entered', async () => {
    const user = renderPage();

    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '2026-11-10T08:30' } });
    await user.type(screen.getByLabelText('Temperature'), '37');
    await user.click(screen.getByRole('button', { name: 'Save temperature' }));

    expect(loadEntries()[0].time).toBe(new Date(2026, 10, 10, 8, 30).toISOString());
  });

  it('rejects an implausible reading', async () => {
    const user = renderPage();

    await user.type(screen.getByLabelText('Temperature'), '385');
    await user.click(screen.getByRole('button', { name: 'Save temperature' }));

    expect(screen.getByRole('alert')).toHaveTextContent('between 30 and 45 °C');
    expect(loadEntries()).toEqual([]);
  });

  it('requires a temperature', async () => {
    const user = renderPage();

    await user.click(screen.getByRole('button', { name: 'Save temperature' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter the temperature.');
  });

  it('edits a saved reading', async () => {
    saveEntries(sampleEntries.filter((e) => e.type === 'temperature'));
    render(<TemperatureLogPage profile={leo} onBack={() => {}} onOpenProfiles={() => {}} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Edit entry' }));
    const value = screen.getByLabelText('Temperature');
    expect(value).toHaveValue(38.5);
    await user.clear(value);
    await user.type(value, '39');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(loadEntries()).toEqual([expect.objectContaining({ id: 'e-temp', celsius: 39 })]);
    expect(screen.getByText('39 °C (102.2 °F)')).toBeInTheDocument();
  });

  describe('opened from Reports to edit an entry', () => {
    function renderEditing(editEntryId: string) {
      const onEditDone = vi.fn();
      render(
        <TemperatureLogPage
          profile={leo}
          onBack={() => {}}
          onOpenProfiles={() => {}}
          editEntryId={editEntryId}
          onEditDone={onEditDone}
        />,
      );
      return { onEditDone, user: userEvent.setup() };
    }

    it('starts with that entry in the form and reports back when saved', async () => {
      saveEntries(sampleEntries.filter((e) => e.type === 'temperature'));
      const { user, onEditDone } = renderEditing('e-temp');

      expect(screen.getByRole('form', { name: 'Edit temperature' })).toBeInTheDocument();
      expect(screen.getByLabelText('Temperature')).toHaveValue(38.5);

      await user.click(screen.getByRole('button', { name: 'Save changes' }));
      expect(onEditDone).toHaveBeenCalledOnce();
    });

    it('reports back when cancelled', async () => {
      saveEntries(sampleEntries.filter((e) => e.type === 'temperature'));
      const { user, onEditDone } = renderEditing('e-temp');

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onEditDone).toHaveBeenCalledOnce();
      expect(loadEntries()[0]).toEqual(expect.objectContaining({ celsius: 38.5 }));
    });

    it('falls back to an empty form when the entry no longer exists', () => {
      const { onEditDone } = renderEditing('missing');

      expect(screen.getByRole('form', { name: 'Log temperature' })).toBeInTheDocument();
      expect(onEditDone).not.toHaveBeenCalled();
    });

    it('does not report back for a different entry edited afterwards', async () => {
      saveEntries([
        ...sampleEntries.filter((e) => e.type === 'temperature'),
        { ...sampleEntries[1], id: 'e-temp-2', celsius: 37 },
      ]);
      const { user, onEditDone } = renderEditing('e-temp');

      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      await user.click(screen.getAllByRole('button', { name: 'Edit entry' })[1]);
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onEditDone).toHaveBeenCalledOnce();
    });
  });
});
