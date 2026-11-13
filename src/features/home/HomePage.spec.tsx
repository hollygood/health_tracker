import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import HomePage from './HomePage';

describe('HomePage', () => {
  it('lists the six blocks in order', () => {
    render(<HomePage onNavigate={() => {}} />);

    const titles = screen.getAllByRole('button').map((b) => b.textContent);
    expect(titles).toHaveLength(7); // six blocks, then the backup link
    ['Dosage calculator', 'Medicine', 'Temperature', 'Sickness', 'Growth', 'Medical history'].forEach(
      (title, i) => expect(titles[i]).toContain(title),
    );
  });

  it.each([
    ['Dosage calculator', 'calculator'],
    ['Medicine', 'medicine'],
    ['Temperature', 'temperature'],
    ['Sickness', 'sickness'],
    ['Growth', 'growth'],
    ['Medical history', 'history'],
    ['Backup and restore', 'backup'],
  ])('opens %s', async (title, route) => {
    const onNavigate = vi.fn();
    render(<HomePage onNavigate={onNavigate} />);

    await userEvent.click(screen.getByRole('button', { name: new RegExp(title) }));

    expect(onNavigate).toHaveBeenCalledWith(route);
  });
});
