/**
 * Dosage reference data, transcribed row-for-row from the printed sheet
 * (dosage_table.JPG: "Updated March 2015 by R. McArthur", ref. AAP,
 * "Fever and Antipyretic Use in Children", Pediatrics 2011;127(3):580-7).
 *
 * THIS FILE IS THE SOURCE OF TRUTH. The calculator returns these printed
 * values verbatim for weights that appear on the sheet, and the unit tests
 * are generated from these rows. To add a test case, add a row here.
 *
 * `null` means the sheet prints "-" (product not listed for that weight).
 */

export type Drug = 'ibuprofen' | 'acetaminophen';

export type MedicineId =
  | 'advil-concentrated-drops'
  | 'advil-childrens-liquid'
  | 'tylenol-concentrated-drops'
  | 'tylenol-childrens-liquid';

export interface DrugInfo {
  drug: Drug;
  brandNames: string;
  /** Standard dose in mg per kg of body weight. */
  mgPerKg: number;
  intervalHours: number;
  /** Maximum doses in 24 hours, when the sheet states one. */
  maxDosesPer24h: number | null;
  /** Text shown under the calculator. */
  standardDosageText: string;
}

export interface Medicine {
  id: MedicineId;
  name: string;
  drug: Drug;
  /** Concentration in mg per mL. */
  mgPerMl: number;
  /** Concentration exactly as printed on the sheet. */
  concentrationLabel: string;
}

/** One printed row: kg, lb, dose mg, drops mL, children's liquid mL. */
export interface TableRow {
  kg: number;
  lb: number;
  mg: number;
  dropsMl: number | null;
  liquidMl: number | null;
}

export const DRUGS: Record<Drug, DrugInfo> = {
  ibuprofen: {
    drug: 'ibuprofen',
    brandNames: 'Advil, Motrin',
    mgPerKg: 10,
    intervalHours: 6,
    maxDosesPer24h: null,
    standardDosageText: 'Standard dosage is 10 mg/kg, every 6 hours as required.',
  },
  acetaminophen: {
    drug: 'acetaminophen',
    brandNames: 'Tylenol, Tempra',
    mgPerKg: 15,
    intervalHours: 4,
    maxDosesPer24h: 5,
    standardDosageText:
      'Standard dosage is 15 mg/kg, every 4 hours as required, to a maximum of 5 doses in 24 hours.',
  },
};

export const MEDICINES: Medicine[] = [
  {
    id: 'advil-concentrated-drops',
    name: 'Advil Concentrated Drops',
    drug: 'ibuprofen',
    mgPerMl: 40,
    concentrationLabel: '200mg/5mL or 40mg/mL',
  },
  {
    id: 'advil-childrens-liquid',
    name: "Advil Children's Liquid",
    drug: 'ibuprofen',
    mgPerMl: 20,
    concentrationLabel: '100mg/5mL or 20mg/mL',
  },
  {
    id: 'tylenol-concentrated-drops',
    name: 'Tylenol Concentrated Drops',
    drug: 'acetaminophen',
    mgPerMl: 80,
    concentrationLabel: '80mg/mL',
  },
  {
    id: 'tylenol-childrens-liquid',
    name: "Tylenol Children's Liquid",
    drug: 'acetaminophen',
    mgPerMl: 32,
    concentrationLabel: '160mg/5mL or 32mg/mL',
  },
];

const row = (
  kg: number,
  lb: number,
  mg: number,
  dropsMl: number | null,
  liquidMl: number | null,
): TableRow => ({ kg, lb, mg, dropsMl, liquidMl });

//                         kg  lb   mg  drops liquid
export const IBUPROFEN_TABLE: TableRow[] = [
  row(4, 9, 40, 1, null),
  row(6, 14, 60, 1.5, null),
  row(8, 18, 80, 2, null),
  row(10, 23, 100, 2.5, 5),
  row(12, 27, 120, 3, 6),
  row(14, 32, 140, 3.5, 7),
  row(16, 36, 160, 4, 8),
  row(18, 41, 180, null, 9),
  row(20, 45, 200, null, 10),
  row(22, 50, 220, null, 11),
  row(24, 54, 240, null, 12),
  row(26, 59, 260, null, 13),
  row(28, 63, 280, null, 14),
  row(30, 68, 300, null, 15),
  row(32, 72, 320, null, 16),
  row(34, 77, 340, null, 17),
  row(36, 81, 360, null, 18),
  row(38, 86, 380, null, 19),
  row(40, 90, 400, null, 20),
];

export const ACETAMINOPHEN_TABLE: TableRow[] = [
  row(4, 9, 60, 0.75, null),
  row(6, 14, 90, 1.1, 2.8),
  row(8, 18, 120, 1.5, 3.8),
  row(10, 23, 150, 1.9, 4.7),
  row(12, 27, 180, 2.3, 5.6),
  row(14, 32, 210, 2.6, 6.6),
  row(16, 36, 240, 3.0, 7.5),
  row(18, 41, 270, 3.4, 8.4),
  row(20, 45, 300, 3.75, 9.4),
  row(22, 50, 330, 4.1, 10.3),
  row(24, 54, 360, 4.5, 11.3),
  row(26, 59, 390, 4.9, 12.2),
  row(28, 63, 420, 5.3, 13.1),
  row(30, 68, 450, 5.6, 14.1),
  row(32, 72, 480, 6.0, 15),
  row(34, 77, 510, 6.4, 15.9),
  row(36, 81, 540, 6.8, 16.9),
  row(38, 86, 570, 7.1, 17.8),
  row(40, 90, 600, 7.5, 18.8),
];

export const TABLES: Record<Drug, TableRow[]> = {
  ibuprofen: IBUPROFEN_TABLE,
  acetaminophen: ACETAMINOPHEN_TABLE,
};

/**
 * The sheet's pounds column is kg x 2.25 rounded half-up (4 kg -> 9 lb,
 * 40 kg -> 90 lb), not the exact 2.2046. Pound input uses the sheet's ratio
 * so results agree with the sheet; this gives a dose equal to or slightly
 * lower (about 2%) than an exact conversion would.
 */
export const SHEET_LB_PER_KG = 2.25;
