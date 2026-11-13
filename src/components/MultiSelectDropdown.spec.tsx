import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MultiSelectDropdown from './MultiSelectDropdown';

const GROUPS = [
  {
    label: 'Type',
    options: [
      { value: 'type:medicine', label: 'Medicine' },
      { value: 'type:growth', label: 'Growth' },
    ],
  },
  { label: 'Category', options: [{ value: 'category:Fever', label: 'Fever' }] },
];

function renderDropdown(selected: string[] = []) {
  const onChange = vi.fn();
  render(
    <div>
      <MultiSelectDropdown
        id="category"
        label="Category"
        emptyLabel="All categories"
        groups={GROUPS}
        selected={selected}
        onChange={onChange}
      />
      <p>Outside</p>
    </div>,
  );
  return { onChange, user: userEvent.setup() };
}

const trigger = () => screen.getByRole('button', { name: /^Category/ });

describe('MultiSelectDropdown', () => {
  it('shows the empty label and stays closed until clicked', () => {
    renderDropdown();

    expect(trigger()).toHaveTextContent('All categories');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('opens to a checkbox per option, in groups', async () => {
    const { user } = renderDropdown();

    await user.click(trigger());

    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    expect(screen.getByRole('group', { name: 'Type' })).toBeInTheDocument();
  });

  it('adds an option when it is ticked', async () => {
    const { user, onChange } = renderDropdown(['type:medicine']);

    await user.click(trigger());
    await user.click(screen.getByRole('checkbox', { name: 'Fever' }));

    expect(onChange).toHaveBeenCalledWith(['type:medicine', 'category:Fever']);
  });

  it('removes an option when it is unticked', async () => {
    const { user, onChange } = renderDropdown(['type:medicine', 'category:Fever']);

    await user.click(trigger());
    expect(screen.getByRole('checkbox', { name: 'Medicine' })).toBeChecked();
    await user.click(screen.getByRole('checkbox', { name: 'Medicine' }));

    expect(onChange).toHaveBeenCalledWith(['category:Fever']);
  });

  it('summarises the selection on the button', () => {
    renderDropdown(['type:medicine']);
    expect(trigger()).toHaveTextContent('Medicine');
  });

  it('lists two selections and counts three or more', () => {
    const { unmount } = render(
      <MultiSelectDropdown
        id="a"
        label="Category"
        emptyLabel="All categories"
        groups={GROUPS}
        selected={['type:medicine', 'category:Fever']}
        onChange={() => {}}
      />,
    );
    expect(trigger()).toHaveTextContent('Medicine, Fever');
    unmount();

    render(
      <MultiSelectDropdown
        id="b"
        label="Category"
        emptyLabel="All categories"
        groups={GROUPS}
        selected={['type:medicine', 'type:growth', 'category:Fever']}
        onChange={() => {}}
      />,
    );
    expect(trigger()).toHaveTextContent('3 selected');
  });

  it('stays open while ticking several options, then closes with Done', async () => {
    const { user } = renderDropdown();

    await user.click(trigger());
    await user.click(screen.getByRole('checkbox', { name: 'Medicine' }));
    await user.click(screen.getByRole('checkbox', { name: 'Growth' }));
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);

    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('closes with Escape or a tap outside', async () => {
    const { user } = renderDropdown();

    await user.click(trigger());
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

    await user.click(trigger());
    await user.click(screen.getByText('Outside'));
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
