import { useRef, useState, type ChangeEvent } from 'react';
import { FaCamera } from 'react-icons/fa6';
import { recognizeText } from './recognizeText';

interface Props {
  /** Called with the text found in the photo. */
  onText: (text: string) => void;
  /** Text recogniser; replaceable in tests. */
  recognize?: typeof recognizeText;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'reading'; percent: number }
  | { kind: 'done' }
  | { kind: 'error'; message: string };

/** Lets the user pick or take a photo and turns the text in it into editable text. */
export default function PhotoToText({ onText, recognize = recognizeText }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const reading = status.kind === 'reading';

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // let the same photo be chosen again
    if (!file) return;

    setStatus({ kind: 'reading', percent: 0 });
    try {
      const text = await recognize(file, (fraction) =>
        setStatus({ kind: 'reading', percent: Math.round(fraction * 100) }),
      );
      if (!text) {
        setStatus({ kind: 'error', message: 'No text was found in that photo. Try a sharper, closer photo.' });
        return;
      }
      onText(text);
      setStatus({ kind: 'done' });
    } catch {
      setStatus({
        kind: 'error',
        message: 'Could not read that photo. The first use needs an internet connection; check it and try again.',
      });
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label="Photo to read text from"
        onChange={handleFile}
      />
      <button
        type="button"
        className="btn btn-soft"
        disabled={reading}
        onClick={() => inputRef.current?.click()}
      >
        <FaCamera aria-hidden="true" />
        {reading ? `Reading text, ${status.percent}%` : 'Add text from a photo'}
      </button>

      {status.kind === 'done' && (
        <p className="text-sm font-bold text-ok" role="status">
          Text added to the description. Check it and correct any mistakes before saving.
        </p>
      )}
      {status.kind === 'error' && (
        <p className="text-sm font-bold text-danger" role="alert">
          {status.message}
        </p>
      )}
      {status.kind === 'idle' && (
        <p className="text-sm text-muted">
          Works best on clear printed text. The photo stays on this device and is not saved.
        </p>
      )}
    </div>
  );
}
