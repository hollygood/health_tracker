import { useState } from 'react';
import { FaCopy, FaDownload, FaShareNodes } from 'react-icons/fa6';
import { canShare, copyText, downloadText, shareText } from './shareReport';

interface Props {
  /** The report as text, already built from the current filters. */
  text: string;
  /** Title used for the share sheet. */
  title: string;
  fileName: string;
  entryCount: number;
}

const ACTION = 'btn btn-soft min-w-0 flex-1 gap-1.5 px-2';

/** Share, copy or download the filtered report as text. */
export default function ExportPanel({ text, title, fileName, entryCount }: Props) {
  const [status, setStatus] = useState('');

  const handleShare = async () => {
    setStatus((await shareText(title, text)) ? 'Shared.' : '');
  };

  const handleCopy = async () => {
    setStatus(
      (await copyText(text))
        ? 'Copied. Paste it into Notes, an email, or an AI assistant.'
        : 'Could not copy. Use Download instead.',
    );
  };

  const handleDownload = () => {
    downloadText(fileName, text);
    setStatus(`Downloaded ${fileName}.`);
  };

  return (
    <section className="card" aria-labelledby="export-heading">
      <h2 id="export-heading" className="text-lg font-extrabold">
        Export
      </h2>
      <p className="text-sm text-muted">
        {entryCount === 1 ? '1 entry' : `${entryCount} entries`} from the current filters, as plain
        text that people and AI assistants can read.
      </p>

      <div className="flex gap-2">
        {canShare() && (
          <button className={ACTION} onClick={handleShare}>
            <FaShareNodes className="flex-none" aria-hidden="true" /> Share
          </button>
        )}
        <button className={ACTION} onClick={handleCopy}>
          <FaCopy className="flex-none" aria-hidden="true" /> Copy
        </button>
        <button className={ACTION} onClick={handleDownload}>
          <FaDownload className="flex-none" aria-hidden="true" /> Download
        </button>
      </div>

      {status && (
        <p className="font-bold text-ok" role="status">
          {status}
        </p>
      )}

      <details>
        <summary className="min-h-11 cursor-pointer py-2.5 font-bold text-accent">
          Preview the text
        </summary>
        <pre
          className="max-h-80 overflow-auto rounded-xl bg-page p-3 text-sm whitespace-pre-wrap"
          data-testid="export-preview"
        >
          {text}
        </pre>
      </details>
    </section>
  );
}
