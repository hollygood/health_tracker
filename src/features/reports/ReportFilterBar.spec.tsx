import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ReportFilterBar from './ReportFilterBar';
import { NO_FILTERS, type ReportFilters } from './reportFilters';

function renderBar(filters: ReportFilters = NO_FILTERS) {
  const onChange = vi.fn();
  render(<ReportFilterBar filters={filters} onChange={onChange} categories={['Fever', 'Vaccination']} />);
  return { onChange, user: userEvent.setup() };
}

const categoryDropdown = () => screen.getByRole('button', { name: /^Category/ });

describe('ReportFilterBar', () => {
  it('starts with all categories and no Clear button', () => {
    renderBar();

    expect(categoryDropdown()).toHaveTextContent('All categories');
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
  });

  it('lists every entry type and every category in use in the dropdown', async () => {
    const { user } = renderBar();

    await user.click(categoryDropdown());

    for (const name of ['Medicine', 'Temperature', 'Sickness', 'Growth', 'Medical history', 'Fever', 'Vaccination']) {
      expect(screen.getByRole('checkbox', { name })).toBeInTheDocument();
    }
  });

  it('picks an entry type', async () => {
    const { user, onChange } = renderBar();

    await user.click(categoryDropdown());
    await user.click(screen.getByRole('checkbox', { name: 'Medicine' }));

    expect(onChange).toHaveBeenCalledWith({ ...NO_FILTERS, types: ['medicine'] });
  });

  it('picks a specific category alongside a type', async () => {
    const { user, onChange } = renderBar({ ...NO_FILTERS, types: ['medicine'] });

    await user.click(categoryDropdown());
    await user.click(screen.getByRole('checkbox', { name: 'Fever' }));

    expect(onChange).toHaveBeenCalledWith({ ...NO_FILTERS, types: ['medicine'], categories: ['Fever'] });
  });

  it('unpicks an option that is already picked', async () => {
    const { user, onChange } = renderBar({ ...NO_FILTERS, types: ['medicine', 'growth'] });

    await user.click(categoryDropdown());
    await user.click(screen.getByRole('checkbox', { name: 'Medicine' }));

    expect(onChange).toHaveBeenCalledWith({ ...NO_FILTERS, types: ['growth'] });
  });

  it('shows what is picked on the dropdown', () => {
    renderBar({ ...NO_FILTERS, types: ['medicine'], categories: ['Fever'] });

    expect(categoryDropdown()).toHaveTextContent('Medicine, Fever');
  });

  it('sets the date range', () => {
    const { onChange } = renderBar();

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-11-01' } });
    expect(onChange).toHaveBeenLastCalledWith({ ...NO_FILTERS, from: '2026-11-01' });

    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-11-10' } });
    expect(onChange).toHaveBeenLastCalledWith({ ...NO_FILTERS, to: '2026-11-10' });
  });

  it('sets a quick range ending today, and clears it', async () => {
    const { user, onChange } = renderBar({ ...NO_FILTERS, from: '2026-01-01', to: '2026-01-31' });

    await user.click(screen.getByRole('button', { name: 'Last 7 days' }));
    const { from, to } = onChange.mock.calls[0][0] as ReportFilters;
    expect(Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000)).toBe(6);

    await user.click(screen.getByRole('button', { name: 'All dates' }));
    expect(onChange).toHaveBeenLastCalledWith(NO_FILTERS);
  });

  it('clears every filter', async () => {
    const { user, onChange } = renderBar({ from: '2026-11-01', to: '', types: ['growth'], categories: ['Fever'] });

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(onChange).toHaveBeenCalledWith(NO_FILTERS);
  });
});
