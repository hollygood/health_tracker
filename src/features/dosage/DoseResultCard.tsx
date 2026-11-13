import type { ReactNode } from 'react';
import { FaTriangleExclamation } from 'react-icons/fa6';
import type { DoseResult, WeightUnit } from './calculateDose';

interface Props {
  /** `null` until a weight has been entered. */
  result: DoseResult | null;
  /** Unit the weight was entered in; only affects the explanatory note. */
  unit: WeightUnit;
  /** Extra content under the result, e.g. the "save weight" action. */
  children?: ReactNode;
}

function Warning({ message }: { message: string }) {
  return (
    <p className="font-bold text-warn" role="alert">
      <FaTriangleExclamation className="mr-1 inline -translate-y-px" aria-hidden="true" />
      {message}
    </p>
  );
}

/** Shows the calculated dose, or why no dose is shown. */
export default function DoseResultCard({ result, unit, children }: Props) {
  const isWarning = result !== null && result.status !== 'ok';

  return (
    <section
      className={`card ${isWarning ? 'border-warn-line bg-warn-soft' : ''}`}
      aria-label="Dose"
      aria-live="polite"
    >
      {result === null && <p className="text-sm text-muted">Enter a weight to see the dose.</p>}

      {(result?.status === 'invalid' || result?.status === 'out-of-range') && (
        <Warning message={result.message} />
      )}

      {(result?.status === 'ok' || result?.status === 'not-listed') && (
        <div className="flex items-baseline justify-between gap-3">
          <span className="field-label">Dose (mg)</span>
          <span className="text-[22px] font-extrabold" data-testid="dose-mg">
            {result.doseMg} mg
          </span>
        </div>
      )}

      {result?.status === 'not-listed' && <Warning message={result.message} />}

      {result?.status === 'ok' && (
        <>
          <div className="flex flex-col gap-0.5 border-t border-line pt-3.5">
            <span className="field-label">Recommended dose of {result.medicine.name}</span>
            <span
              className="text-[56px] leading-[1.05] font-extrabold text-accent tabular-nums"
              data-testid="dose-ml"
            >
              {result.doseMl} <small className="text-2xl font-bold">mL</small>
            </span>
          </div>
          <p className="text-sm text-muted">
            {result.source === 'table'
              ? 'From the dosage sheet.'
              : unit === 'kg'
                ? `Calculated at ${result.drug.mgPerKg} mg/kg (between sheet rows).`
                : `Calculated at ${result.drug.mgPerKg} mg/kg on the sheet's pounds scale (between sheet rows).`}
          </p>
        </>
      )}

      {children}
    </section>
  );
}
