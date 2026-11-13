import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { leo, localIso } from '../../../test/fixtures';
import type { HistoryEntry } from '../entryTypes';
import HistoryNoteList from './HistoryNoteList';

const note = (id: string, fields: Partial<HistoryEntry>): HistoryEntry => ({
  id,
  profileId: leo.id,
  type: 'history',
  time: localIso(2026, 9, 15, 14, 0),
  title: 'Flu shot',
  category: 'Vaccination',
  description: 'Left arm.\nNo reaction.',
  ...fields,
});

const notes = [
  note('checkup', { title: '18-month checkup', category: 'Doctor visit', description: '', time: localIso(2026, 10, 2, 9, 30) }),
  note('flu', {}),
];

function renderList(editingId: string | null = null) {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  render(<HistoryNoteList entries={notes} onEdit={onEdit} onDelete={onDelete} editingId={editingId} />);
  return { onEdit, onDelete, user: userEvent.setup() };
}

const row = (title: RegExp) => screen.getByRole('button', { name: title });

describe('HistoryNoteList', () => {
  it('says when there are no notes', () => {
    render(<HistoryNoteList entries={[]} onEdit={() => {}} onDelete={() => {}} />);

    expect(screen.getByText('No medical history added yet.')).toBeInTheDocument();
  });

  it('shows each note collapsed, with only its title and date', () => {
    renderList();

    expect(row(/^18-month checkup/)).toHaveAttribute('aria-expanded', 'false');
    expect(row(/^Flu shot/)).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Vaccination')).not.toBeInTheDocument();
    expect(screen.queryByText(/Left arm/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('puts the date in the row heading, after the title', () => {
    renderList();

    // "Flu shot" then a date containing the year
    expect(row(/^Flu shot.*2026/)).toBeInTheDocument();
  });

  it('expands a note to show its category, description and actions', async () => {
    const { user } = renderList();

    await user.click(row(/^Flu shot/));

    expect(row(/^Flu shot/)).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Vaccination')).toBeInTheDocument();
    expect(screen.getByText(/Left arm\.\s+No reaction\./)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('collapses again when the row is clicked a second time', async () => {
    const { user } = renderList();

    await user.click(row(/^Flu shot/));
    await user.click(row(/^Flu shot/));

    expect(row(/^Flu shot/)).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Vaccination')).not.toBeInTheDocument();
  });

  it('can have several notes open at once', async () => {
    const { user } = renderList();

    await user.click(row(/^Flu shot/));
    await user.click(row(/^18-month checkup/));

    expect(screen.getByText('Vaccination')).toBeInTheDocument();
    expect(screen.getByText('Doctor visit')).toBeInTheDocument();
  });

  it('says so when a note has no description', async () => {
    const { user } = renderList();

    await user.click(row(/^18-month checkup/));

    expect(screen.getByText('No description')).toBeInTheDocument();
  });

  it('passes the note to onEdit', async () => {
    const { user, onEdit } = renderList();

    await user.click(row(/^Flu shot/));
    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(onEdit).toHaveBeenCalledWith(notes[1]);
  });

  it('deletes only after confirming, and can be backed out of', async () => {
    const { user, onDelete } = renderList();

    await user.click(row(/^Flu shot/));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Keep' }));
    expect(onDelete).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Confirm delete' }));
    expect(onDelete).toHaveBeenCalledWith('flu');
  });

  it('marks the note that is being edited', () => {
    renderList('flu');

    const items = screen.getAllByRole('listitem');
    expect(within(items[1]).getByText(/\(editing\)/)).toBeInTheDocument();
    expect(within(items[0]).queryByText(/\(editing\)/)).not.toBeInTheDocument();
  });
});
