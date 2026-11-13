import {
  DRUGS,
  MEDICINES,
  SHEET_LB_PER_KG,
  TABLES,
  type DrugInfo,
  type Medicine,
  type MedicineId,
  type TableRow,
} from './dosageTable';

export type WeightUnit = 'kg' | 'lb';

export type DoseResult =
  | {
      status: 'ok';
      medicine: Medicine;
      drug: DrugInfo;
      /** Weight used for the calculation, in kg. */
      weightKg: number;
      doseMg: number;
      doseMl: number;
      /** 'table' = printed value from the sheet; 'formula' = computed between rows. */
      source: 'table' | 'formula';
    }
  | {
      /** Weight is on the sheet, but the sheet prints "-" for this product. */
      status: 'not-listed';
      medicine: Medicine;
      drug: DrugInfo;
      weightKg: number;
      doseMg: number;
      message: string;
    }
  | {
      /** Weight is below or above the sheet's range. */
      status: 'out-of-range';
      medicine: Medicine;
      drug: DrugInfo;
      message: string;
    }
  | { status: 'invalid'; message: string };

export function getMedicine(id: MedicineId): Medicine {
  const m = MEDICINES.find((x) => x.id === id);
  if (!m) throw new Error(`Unknown medicine: ${id}`);
  return m;
}

const isDrops = (m: Medicine) => m.id.endsWith('concentrated-drops');
const printedMl = (m: Medicine, r: TableRow) => (isDrops(m) ? r.dropsMl : r.liquidMl);

/** Lowest and highest weight (kg) at which the sheet lists a dose for this product. */
export function listedRangeKg(m: Medicine): { minKg: number; maxKg: number } {
  const rows = TABLES[m.drug].filter((r) => printedMl(m, r) !== null);
  return { minKg: rows[0].kg, maxKg: rows[rows.length - 1].kg };
}

/** mL rounded to 1 decimal, done in integer tenths to avoid float drift. */
function mlFromMg(mg: number, mgPerMl: number): number {
  return Math.round((mg * 10) / mgPerMl) / 10;
}

const ASK = 'Ask your healthcare provider.';

export function calculateDose(
  medicineId: MedicineId,
  weight: number,
  unit: WeightUnit = 'kg',
): DoseResult {
  if (typeof weight !== 'number' || !Number.isFinite(weight) || weight <= 0) {
    return { status: 'invalid', message: 'Enter a weight greater than 0.' };
  }

  const medicine = getMedicine(medicineId);
  const drug = DRUGS[medicine.drug];
  const table = TABLES[medicine.drug];
  const first = table[0];
  const last = table[table.length - 1];

  // 1. Exact match with a printed row -> use the printed values verbatim.
  const exact = table.find((r) => (unit === 'kg' ? r.kg === weight : r.lb === weight));
  const weightKg = exact ? exact.kg : unit === 'kg' ? weight : weight / SHEET_LB_PER_KG;

  // 2. Outside the sheet entirely -> no dose.
  if (weightKg < first.kg || weightKg > last.kg) {
    const range =
      unit === 'kg' ? `${first.kg}-${last.kg} kg` : `${first.lb}-${last.lb} lb`;
    return {
      status: 'out-of-range',
      medicine,
      drug,
      message: `The dosage sheet only covers ${range}. ${ASK}`,
    };
  }

  const doseMg = exact ? exact.mg : Math.round(weightKg * drug.mgPerKg);

  // 3. On the sheet, but this product has no listed dose at this weight.
  const { minKg, maxKg } = listedRangeKg(medicine);
  if (weightKg < minKg || weightKg > maxKg) {
    return {
      status: 'not-listed',
      medicine,
      drug,
      weightKg,
      doseMg,
      message: `${medicine.name} is not listed for this weight (listed for ${minKg}-${maxKg} kg). ${ASK}`,
    };
  }

  if (exact) {
    return {
      status: 'ok',
      medicine,
      drug,
      weightKg,
      doseMg,
      doseMl: printedMl(medicine, exact) as number,
      source: 'table',
    };
  }

  // 4. Between rows -> standard mg/kg formula, mL rounded to 1 decimal.
  return {
    status: 'ok',
    medicine,
    drug,
    weightKg,
    doseMg,
    doseMl: mlFromMg(doseMg, medicine.mgPerMl),
    source: 'formula',
  };
}
