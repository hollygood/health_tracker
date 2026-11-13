import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import EntryFormFooter from './EntryFormFooter';

describe('EntryFormFooter', () => {
  it('shows the add label and no Cancel when adding', () => {
    render(<EntryFormFooter error="" addLabel="Save medicine" editing={false} onCancel={() => {}} />);

    expect(screen.getByRole('button', { name: 'Save medicine' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows Save changes and Cancel when editing', async () => {
    const onCancel = vi.fn();
    render(<EntryFormFooter error="" addLabel="Save medicine" editing onCancel={onCancel} />);

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows a validation error', () => {
    render(<EntryFormFooter error="Enter a title." addLabel="Save" editing={false} onCancel={() => {}} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a title.');
  });
});
