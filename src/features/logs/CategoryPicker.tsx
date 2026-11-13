import { useState } from 'react';

interface Props {
  id: string;
  categories: string[];
  value: string;
  onChange: (category: string) => void;
  /** Called with the trimmed name of a category the user adds. */
  onAddCategory: (name: string) => void;
}

/** Category dropdown with an inline way to add a new category. */
export default function CategoryPicker({ id, categories, value, onChange, onAddCategory }: Props) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    onAddCategory(name);
    onChange(name);
    setNewName('');
    setAdding(false);
  };

  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        Category
      </label>
      <select id={id} className="input select" value={value} onChange={(e) => onChange(e.target.value)}>
        {/* Keep the current value selectable even before the parent's list refreshes. */}
        {(categories.includes(value) ? categories : [...categories, value]).map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {adding ? (
        <div className="flex gap-2.5">
          <input
            className="input min-w-0 flex-1"
            aria-label="New category"
            placeholder="e.g. Ear infection"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
            autoFocus
          />
          <button type="button" className="btn btn-soft w-auto flex-none" onClick={handleAdd}>
            Add
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="min-h-11 self-start font-bold text-accent"
          onClick={() => setAdding(true)}
        >
          Add a category
        </button>
      )}
    </div>
  );
}
