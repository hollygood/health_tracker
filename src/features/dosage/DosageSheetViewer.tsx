import { useEffect, useState } from 'react';
import { FaTableList, FaXmark } from 'react-icons/fa6';
import sheetUrl from '../../assets/dosage-table.jpg';

const ALT =
  'Printed dosage sheet: ibuprofen (Advil, Motrin) and acetaminophen (Tylenol, Tempra) doses by weight, 4 to 40 kg.';

/** Text link that opens the printed dosage sheet full screen; tap the sheet to zoom. */
export default function DosageSheetViewer() {
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    setZoomed(false);
  };

  return (
    <>
      <button
        className="inline-flex min-h-11 items-center gap-2 self-start font-bold text-accent underline underline-offset-4"
        onClick={() => setOpen(true)}
      >
        <FaTableList aria-hidden="true" /> View the dosage sheet
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 overflow-auto bg-black"
          role="dialog"
          aria-modal="true"
          aria-label="Dosage sheet"
          onClick={close}
        >
          <img
            src={sheetUrl}
            alt={ALT}
            className={
              zoomed
                ? 'block w-[220%] max-w-none cursor-zoom-out'
                : 'mx-auto block h-dvh w-full cursor-zoom-in object-contain'
            }
            onClick={(e) => {
              e.stopPropagation();
              setZoomed((z) => !z);
            }}
          />
          <button
            className="sheet-close fixed right-3 grid size-11 place-items-center rounded-full bg-white text-xl text-ink"
            onClick={close}
            aria-label="Close"
            autoFocus
          >
            <FaXmark aria-hidden="true" />
          </button>
          <p className="safe-bottom pointer-events-none fixed inset-x-0 bottom-3 text-center text-sm font-bold text-white">
            <span className="rounded-full bg-ink/80 px-3 py-1.5">
              {zoomed ? 'Tap to fit the screen' : 'Tap the sheet to zoom'}
            </span>
          </p>
        </div>
      )}
    </>
  );
}
