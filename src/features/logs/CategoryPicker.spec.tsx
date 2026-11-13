import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CategoryPicker from './CategoryPicker';

const CATEGORIES = ['Cold', 'Fever', 'Stomach flu', 'Diarrhea'];

function renderPicker(value = 'Cold') {
  const onChange = vi.fn();
  const onAddCategory = vi.fn();
  render(
    <CategoryPicker
      id="category"
      categories={CATEGORIES}
      value={value}
      onChange={onChange}
      onAddCategory={onAddCategory}
    />,
  );
  return { onChange, onAddCategory, user: userEvent.setup() };
}

describe('CategoryPicker', () => {
  it('lists the categories', () => {
    renderPicker();

    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(CATEGORIES);
    expect(screen.getByLabelText('Category')).toHaveValue('Cold');
  });

  it('reports the category chosen', async () => {
    const { user, onChange } = renderPicker();

    await user.selectOptions(screen.getByLabelText('Category'), 'Fever');

    expect(onChange).toHaveBeenCalledWith('Fever');
  });

  it('adds a new category and selects it', async () => {
    const { user, onChange, onAddCategory } = renderPicker();

    await user.click(screen.getByRole('button', { name: 'Add a category' }));
    await user.type(screen.getByLabelText('New category'), '  Ear infection ');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(onAddCategory).toHaveBeenCalledWith('Ear infection');
    expect(onChange).toHaveBeenCalledWith('Ear infection');
  });

  it('ignores an empty new category', async () => {
    const { user, onAddCategory } = renderPicker();

    await user.click(screen.getByRole('button', { name: 'Add a category' }));
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(onAddCategory).not.toHaveBeenCalled();
  });
});
