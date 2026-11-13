import { useEffect, useRef, useState } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

interface Props {
  id: string;
  label: string;
  /** Shown on the button when nothing is selected, e.g. "All categories". */
  emptyLabel: string;
  groups: SelectGroup[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

/** Dropdown that lets the user tick one or several options. Nothing ticked means "all". */
export default function MultiSelectDropdown({
  id,
  label,
  emptyLabel,
  groups,
  selected,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close when the user taps outside or presses Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  const selectedLabels = groups
    .flatMap((g) => g.options)
    .filter((o) => selected.includes(o.value))
    .map((o) => o.label);
  const summary =
    selectedLabels.length === 0
      ? emptyLabel
      : selectedLabels.length <= 2
        ? selectedLabels.join(', ')
        : `${selectedLabels.length} selected`;

  return (
    <div className="field relative" ref={rootRef}>
      <span className="field-label" id={`${id}-label`}>
        {label}
      </span>
      <button
        id={id}
        type="button"
        className="input select truncate text-left"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        aria-labelledby={`${id}-label ${id}`}
        onClick={() => setOpen((o) => !o)}
      >
        {summary}
      </button>

      {open && (
        <div
          id={`${id}-options`}
          className="absolute top-full right-0 left-0 z-20 mt-1 flex max-h-80 flex-col overflow-y-auto rounded-xl border border-line bg-surface p-2 shadow-lg"
          role="group"
          aria-labelledby={`${id}-label`}
        >
          {groups
            .filter((g) => g.options.length > 0)
            .map((group) => (
              <fieldset key={group.label} className="flex flex-col">
                <legend className="px-2 pt-2 pb-1 text-sm font-bold text-muted">{group.label}</legend>
                {group.options.map((option) => (
                  <label
                    key={option.value}
                    className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2"
                  >
                    <input
                      type="checkbox"
                      className="size-5 flex-none accent-accent"
                      checked={selected.includes(option.value)}
                      onChange={() => toggle(option.value)}
                    />
                    <span className="min-w-0 break-words">{option.label}</span>
                  </label>
                ))}
              </fieldset>
            ))}
          <button type="button" className="btn mt-2 flex-none" onClick={() => setOpen(false)}>
            Done
          </button>
        </div>
      )}
    </div>
  );
}
