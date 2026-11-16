import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { reportEntries } from '../../test/fixtures';
import ReportTimeline from './ReportTimeline';

function renderTimeline() {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  render(<ReportTimeline entries={reportEntries} onEdit={onEdit} onDelete={onDelete} />);
  return { onEdit, onDelete, user: userEvent.setup() };
}

describe('ReportTimeline', () => {
  it('shows one section per day with a date heading', () => {
    renderTimeline();

    // Nov 10 (two entries), Nov 9, Oct 1, Sep 15
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(4);
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });

  it('puts entries from the same day under one heading', () => {
    renderTimeline();

    const firstDay = screen.getAllByRole('region')[0];
    expect(within(firstDay).getAllByRole('listitem')).toHaveLength(2);
    expect(within(firstDay).getByText("Advil Children's Liquid, 6 mL")).toBeInTheDocument();
    expect(within(firstDay).getByText('After lunch')).toBeInTheDocument();
    expect(within(firstDay).getByText('38.5 °C (101.3 °F)')).toBeInTheDocument();
  });

  it('labels each entry with its type', () => {
    renderTimeline();

    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Medicine');
    expect(items[1]).toHaveTextContent('Temperature');
    expect(items[2]).toHaveTextContent('Sickness');
    expect(items[3]).toHaveTextContent('Growth');
    expect(items[4]).toHaveTextContent('Medical history');
  });

  it('passes the entry to onEdit', async () => {
    const { user, onEdit } = renderTimeline();

    await user.click(screen.getAllByRole('button', { name: 'Edit entry' })[1]);

    expect(onEdit).toHaveBeenCalledWith(reportEntries[1]);
  });

  it('deletes only after confirming, and can be backed out of', async () => {
    const { user, onDelete } = renderTimeline();

    await user.click(screen.getAllByRole('button', { name: 'Delete entry' })[0]);
    await user.click(screen.getByRole('button', { name: 'Keep' }));
    expect(onDelete).not.toHaveBeenCalled();

    await user.click(screen.getAllByRole('button', { name: 'Delete entry' })[0]);
    await user.click(screen.getByRole('button', { name: 'Confirm delete' }));
    expect(onDelete).toHaveBeenCalledWith('e-med');
  });
});
