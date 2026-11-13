import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import BottomNav from './BottomNav';

describe('BottomNav', () => {
  it('shows Home and Reports', () => {
    render(<BottomNav route="home" onNavigate={() => {}} />);

    expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Reports' })).not.toHaveAttribute('aria-current');
  });

  it('keeps Home lit on pages opened from Home', () => {
    render(<BottomNav route="calculator" onNavigate={() => {}} />);

    expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
  });

  it('navigates when a tab is clicked', async () => {
    const onNavigate = vi.fn();
    render(<BottomNav route="home" onNavigate={onNavigate} />);

    await userEvent.click(screen.getByRole('button', { name: 'Reports' }));

    expect(onNavigate).toHaveBeenCalledWith('reports');
  });
});
