interface Props {
  /** Validation message to show, if any. */
  error: string;
  /** Label of the save button when adding, e.g. "Save medicine". */
  addLabel: string;
  /** True when the form is editing an existing entry. */
  editing: boolean;
  onCancel: () => void;
}

/** Error message plus the save / cancel buttons shared by every entry form. */
export default function EntryFormFooter({ error, addLabel, editing, onCancel }: Props) {
  return (
    <>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="btn" type="submit">
        {editing ? 'Save changes' : addLabel}
      </button>
      {editing && (
        <button className="btn btn-soft" type="button" onClick={onCancel}>
          Cancel
        </button>
      )}
    </>
  );
}
