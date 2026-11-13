import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { leo, mia, reportEntries } from '../../test/fixtures';
import { loadEntries, saveEntries } from '../logs/entryStorage';
import type { Profile } from '../profiles/profileStorage';
import ReportsPage from './ReportsPage';

function renderPage(profile: Profile | null = leo) {
  const onEditEntry = vi.fn();
  const onOpenProfiles = vi.fn();
  render(<ReportsPage profile={profile} onOpenProfiles={onOpenProfiles} onEditEntry={onEditEntry} />);
  return { onEditEntry, onOpenProfiles, user: userEvent.setup() };
}

const categoryDropdown = () => screen.getByRole('button', { name: /^Category/ });
const preview = () => screen.getByTestId('export-preview').textContent ?? '';

describe('ReportsPage', () => {
  it('asks for a profile when there is none', async () => {
    const { user, onOpenProfiles } = renderPage(null);

    await user.click(screen.getByRole('button', { name: 'Add profile' }));

    expect(onOpenProfiles).toHaveBeenCalledOnce();
  });

  it('says when nothing is logged yet', () => {
    renderPage();

    expect(screen.getByText('Nothing logged for Leo yet')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Filters' })).not.toBeInTheDocument();
  });

  it("shows all of the profile's entries by default", () => {
    saveEntries(reportEntries);
    renderPage();

    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getByText('5 entries')).toBeInTheDocument();
  });

  it("leaves out other profiles' entries", () => {
    saveEntries(reportEntries);
    renderPage(mia);

    expect(screen.getByText('Nothing logged for Mia yet')).toBeInTheDocument();
  });

  it('filters the list by one or several types', async () => {
    saveEntries(reportEntries);
    const { user } = renderPage();

    await user.click(categoryDropdown());
    await user.click(screen.getByRole('checkbox', { name: 'Medicine' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(1);

    await user.click(screen.getByRole('checkbox', { name: 'Temperature' }));

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Showing 2 of 5 entries')).toBeInTheDocument();
  });

  it('filters the list by a specific category', async () => {
    saveEntries(reportEntries);
    const { user } = renderPage();

    await user.click(categoryDropdown());
    await user.click(screen.getByRole('checkbox', { name: 'Fever' }));

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('Fever, ongoing')).toBeInTheDocument();
  });

  it('offers to clear the filters when nothing matches', async () => {
    saveEntries(reportEntries);
    const { user } = renderPage();

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2027-01-01' } });
    expect(screen.getByText('No entries match these filters')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Clear filters' })[0]);
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });

  it('exports exactly what the filters show', async () => {
    saveEntries(reportEntries);
    const { user } = renderPage();

    expect(preview()).toMatch(/- Entries: 5\n/);
    expect(preview()).toMatch(/- Included: Medicine, Temperature, Sickness, Growth, Medical history\n/);

    await user.click(categoryDropdown());
    await user.click(screen.getByRole('checkbox', { name: 'Temperature' }));

    expect(preview()).toMatch(/- Entries: 1\n/);
    expect(preview()).toMatch(/- Included: Temperature\n/);
    expect(preview()).toMatch(/- 09:00 Temperature: 38\.5 °C \(101\.3 °F\)\n/);
    expect(preview().includes('Medicine:')).toBe(false);
  });

  it('hands an entry to its page for editing', async () => {
    saveEntries(reportEntries);
    const { user, onEditEntry } = renderPage();

    await user.click(screen.getAllByRole('button', { name: 'Edit entry' })[1]);

    expect(onEditEntry).toHaveBeenCalledWith(reportEntries[1]);
  });

  it('deletes an entry after confirming', async () => {
    saveEntries(reportEntries);
    const { user } = renderPage();

    await user.click(screen.getAllByRole('button', { name: 'Delete entry' })[0]);
    await user.click(screen.getByRole('button', { name: 'Confirm delete' }));

    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(loadEntries().map((e) => e.id)).not.toContain('e-med');
  });
});
