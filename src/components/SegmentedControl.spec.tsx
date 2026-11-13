import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SegmentedControl from './SegmentedControl';

const OPTIONS = [
  { value: 'kg', label: 'kg' },
  { value: 'lb', label: 'pounds' },
] as const;

describe('SegmentedControl', () => {
  it('marks the selected option as pressed', () => {
    render(<SegmentedControl options={OPTIONS} value="lb" onChange={() => {}} ariaLabel="Weight unit" />);

    expect(screen.getByRole('group', { name: 'Weight unit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'pounds' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'kg' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onChange with the value of the option clicked', async () => {
    const onChange = vi.fn();
    render(<SegmentedControl options={OPTIONS} value="kg" onChange={onChange} ariaLabel="Weight unit" />);

    await userEvent.click(screen.getByRole('button', { name: 'pounds' }));

    expect(onChange).toHaveBeenCalledWith('lb');
  });
});
