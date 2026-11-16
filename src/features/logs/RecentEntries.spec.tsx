import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { sampleEntries } from '../../test/fixtures';
import RecentEntries from './RecentEntries';

describe('RecentEntries', () => {
  it('shows the empty text when there are no entries', () => {
    render(<RecentEntries entries={[]} onDelete={() => {}} emptyText="No medicine logged yet." />);

    expect(screen.getByText('No medicine logged yet.')).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('lists each entry with its summary', () => {
    render(<RecentEntries entries={sampleEntries} onDelete={() => {}} emptyText="" />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(5);
    expect(within(items[0]).getByText("Advil Children's Liquid, 6 mL")).toBeInTheDocument();
    expect(within(items[0]).getByText('After lunch')).toBeInTheDocument();
    expect(within(items[1]).getByText('38.5 °C (101.3 °F)')).toBeInTheDocument();
  });

  it('deletes only after confirming', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<RecentEntries entries={sampleEntries.slice(0, 1)} onDelete={onDelete} emptyText="" />);

    await user.click(screen.getByRole('button', { name: 'Delete entry' }));
    expect(onDelete).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Confirm delete' }));
    expect(onDelete).toHaveBeenCalledWith('e-med');
  });

  it('can back out of a delete', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<RecentEntries entries={sampleEntries.slice(0, 1)} onDelete={onDelete} emptyText="" />);

    await user.click(screen.getByRole('button', { name: 'Delete entry' }));
    await user.click(screen.getByRole('button', { name: 'Keep' }));

    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Delete entry' })).toBeInTheDocument();
  });

  it('passes the entry to onEdit', async () => {
    const onEdit = vi.fn();
    render(
      <RecentEntries entries={sampleEntries.slice(0, 2)} onDelete={() => {}} onEdit={onEdit} emptyText="" />,
    );

    await userEvent.click(screen.getAllByRole('button', { name: 'Edit entry' })[1]);

    expect(onEdit).toHaveBeenCalledWith(sampleEntries[1]);
  });

  it('shows no Edit button when editing is not supported', () => {
    render(<RecentEntries entries={sampleEntries.slice(0, 1)} onDelete={() => {}} emptyText="" />);

    expect(screen.queryByRole('button', { name: 'Edit entry' })).not.toBeInTheDocument();
  });

  it('marks the entry that is being edited', () => {
    render(
      <RecentEntries
        entries={sampleEntries.slice(0, 2)}
        onDelete={() => {}}
        onEdit={() => {}}
        editingId="e-temp"
        emptyText=""
      />,
    );

    const items = screen.getAllByRole('listitem');
    expect(items[1]).toHaveAttribute('aria-current', 'true');
    expect(items[0]).not.toHaveAttribute('aria-current');
  });

  it('renders extra actions per entry', () => {
    render(
      <RecentEntries
        entries={sampleEntries.slice(0, 2)}
        onDelete={() => {}}
        emptyText=""
        renderActions={(entry) => <button>Action for {entry.id}</button>}
      />,
    );

    expect(screen.getByRole('button', { name: 'Action for e-med' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action for e-temp' })).toBeInTheDocument();
  });
});
