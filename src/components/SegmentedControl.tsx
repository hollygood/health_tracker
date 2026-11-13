interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name: pass one of these. */
  ariaLabel?: string;
  ariaLabelledBy?: string;
  /** Stretch the options to fill the row. */
  fullWidth?: boolean;
}

/** A small set of mutually exclusive choices shown as a pill toggle. */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  ariaLabelledBy,
  fullWidth = false,
}: Props<T>) {
  return (
    <div className="seg" role="group" aria-label={ariaLabel} aria-labelledby={ariaLabelledBy}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            className={`seg-btn ${fullWidth ? 'flex-1' : ''} ${selected ? 'seg-btn-on' : ''}`}
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
