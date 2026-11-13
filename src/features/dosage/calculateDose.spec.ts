import { describe, expect, it } from 'vitest';
import { calculateDose, getMedicine, listedRangeKg } from './calculateDose';
import {
  ACETAMINOPHEN_TABLE,
  DRUGS,
  IBUPROFEN_TABLE,
  MEDICINES,
  SHEET_LB_PER_KG,
  TABLES,
  type MedicineId,
  type TableRow,
} from './dosageTable';

/**
 * Every row of the printed sheet is a test case, for both products of each
 * drug, entered in kg and in lb. Rows live in table.ts: add a row there and
 * it is tested here automatically.
 */
const PRODUCTS: { id: MedicineId; rows: TableRow[]; col: 'dropsMl' | 'liquidMl' }[] = [
  { id: 'advil-concentrated-drops', rows: IBUPROFEN_TABLE, col: 'dropsMl' },
  { id: 'advil-childrens-liquid', rows: IBUPROFEN_TABLE, col: 'liquidMl' },
  { id: 'tylenol-concentrated-drops', rows: ACETAMINOPHEN_TABLE, col: 'dropsMl' },
  { id: 'tylenol-childrens-liquid', rows: ACETAMINOPHEN_TABLE, col: 'liquidMl' },
];

describe('sheet rows (every printed value)', () => {
  for (const { id, rows, col } of PRODUCTS) {
    describe(getMedicine(id).name, () => {
      for (const r of rows) {
        const ml = r[col];
        const expected = ml === null ? 'not listed' : `${ml} mL`;
        for (const [unit, w] of [['kg', r.kg], ['lb', r.lb]] as const) {
          it(`${w} ${unit} -> ${r.mg} mg, ${expected}`, () => {
            const res = calculateDose(id, w, unit);
            if (ml === null) {
              expect(res.status).toBe('not-listed');
              if (res.status === 'not-listed') expect(res.doseMg).toBe(r.mg);
            } else {
              expect(res.status).toBe('ok');
              if (res.status === 'ok') {
                expect(res.doseMg).toBe(r.mg);
                expect(res.doseMl).toBe(ml);
                expect(res.source).toBe('table');
                expect(res.weightKg).toBe(r.kg);
              }
            }
          });
        }
      }
    });
  }
});

describe('sheet transcription cross-checks', () => {
  it('has 19 rows per drug, 4 kg to 40 kg in steps of 2', () => {
    for (const rows of Object.values(TABLES)) {
      expect(rows.map((r) => r.kg)).toEqual(Array.from({ length: 19 }, (_, i) => 4 + 2 * i));
    }
  });

  it('dose mg equals weight x standard mg/kg on every row', () => {
    for (const r of IBUPROFEN_TABLE) expect(r.mg).toBe(r.kg * 10);
    for (const r of ACETAMINOPHEN_TABLE) expect(r.mg).toBe(r.kg * 15);
  });

  it('pounds column equals kg x 2.25 rounded half-up on every row', () => {
    for (const rows of Object.values(TABLES))
      for (const r of rows) expect(r.lb).toBe(Math.floor(r.kg * SHEET_LB_PER_KG + 0.5));
  });

  it('every printed mL agrees with mg / concentration (within rounding)', () => {
    for (const { id, rows, col } of PRODUCTS) {
      const m = getMedicine(id);
      for (const r of rows) {
        const ml = r[col];
        if (ml !== null) expect(Math.abs(ml - r.mg / m.mgPerMl)).toBeLessThanOrEqual(0.0500001);
      }
    }
  });

  it('concentrations and standard dosages match the sheet', () => {
    expect(MEDICINES.map((m) => [m.id, m.mgPerMl])).toEqual([
      ['advil-concentrated-drops', 40],
      ['advil-childrens-liquid', 20],
      ['tylenol-concentrated-drops', 80],
      ['tylenol-childrens-liquid', 32],
    ]);
    expect(DRUGS.ibuprofen.mgPerKg).toBe(10);
    expect(DRUGS.ibuprofen.intervalHours).toBe(6);
    expect(DRUGS.acetaminophen.mgPerKg).toBe(15);
    expect(DRUGS.acetaminophen.intervalHours).toBe(4);
    expect(DRUGS.acetaminophen.maxDosesPer24h).toBe(5);
  });

  it('listed weight ranges match the "-" cells', () => {
    expect(listedRangeKg(getMedicine('advil-concentrated-drops'))).toEqual({ minKg: 4, maxKg: 16 });
    expect(listedRangeKg(getMedicine('advil-childrens-liquid'))).toEqual({ minKg: 10, maxKg: 40 });
    expect(listedRangeKg(getMedicine('tylenol-concentrated-drops'))).toEqual({ minKg: 4, maxKg: 40 });
    expect(listedRangeKg(getMedicine('tylenol-childrens-liquid'))).toEqual({ minKg: 6, maxKg: 40 });
  });
});

describe('weights between sheet rows (formula)', () => {
  const cases: [MedicineId, number, 'kg' | 'lb', number, number][] = [
    // medicine, weight, unit, mg, mL
    ['advil-concentrated-drops', 5, 'kg', 50, 1.3], // 1.25 -> 1.3
    ['advil-concentrated-drops', 13, 'kg', 130, 3.3], // 3.25 -> 3.3
    ['advil-concentrated-drops', 13.4, 'kg', 134, 3.4], // 3.35 -> 3.4
    ['advil-childrens-liquid', 13, 'kg', 130, 6.5],
    ['advil-childrens-liquid', 25.5, 'kg', 255, 12.8], // 12.75 -> 12.8
    ['advil-childrens-liquid', 39, 'kg', 390, 19.5],
    ['tylenol-concentrated-drops', 5, 'kg', 75, 0.9], // 0.9375
    ['tylenol-concentrated-drops', 13, 'kg', 195, 2.4], // 2.4375
    ['tylenol-concentrated-drops', 21, 'kg', 315, 3.9], // 3.9375
    ['tylenol-childrens-liquid', 7, 'kg', 105, 3.3], // 3.28125
    ['tylenol-childrens-liquid', 13, 'kg', 195, 6.1], // 6.09375
    ['tylenol-childrens-liquid', 39, 'kg', 585, 18.3], // 18.28125
    // pounds use the sheet's 2.25 lb/kg
    ['advil-childrens-liquid', 30, 'lb', 133, 6.7], // 13.33 kg; 6.65 -> 6.7
    ['tylenol-childrens-liquid', 30, 'lb', 200, 6.3], // 6.25 -> 6.3
    ['tylenol-concentrated-drops', 20, 'lb', 133, 1.7], // 8.89 kg; 1.6625
  ];
  for (const [id, w, unit, mg, ml] of cases) {
    it(`${id} ${w} ${unit} -> ${mg} mg, ${ml} mL`, () => {
      const res = calculateDose(id, w, unit);
      expect(res.status).toBe('ok');
      if (res.status === 'ok') {
        expect(res.doseMg).toBe(mg);
        expect(res.doseMl).toBe(ml);
        expect(res.source).toBe('formula');
      }
    });
  }

  it('never exceeds the standard mg/kg by more than rounding, at any weight', () => {
    for (const m of MEDICINES) {
      const perKg = DRUGS[m.drug].mgPerKg;
      for (let kg = 4; kg <= 40; kg = Math.round((kg + 0.1) * 10) / 10) {
        const res = calculateDose(m.id, kg, 'kg');
        if (res.status !== 'ok') continue;
        expect(res.doseMg).toBeLessThanOrEqual(kg * perKg + 0.5);
        // mL is within 0.05 mL of mg / concentration
        expect(Math.abs(res.doseMl - res.doseMg / m.mgPerMl)).toBeLessThanOrEqual(0.0500001);
      }
    }
  });

  it('dose never decreases as weight (kg) increases', () => {
    for (const m of MEDICINES) {
      let prev = 0;
      for (let kg = 4; kg <= 40; kg = Math.round((kg + 0.1) * 10) / 10) {
        const res = calculateDose(m.id, kg, 'kg');
        if (res.status !== 'ok') continue;
        expect(res.doseMg).toBeGreaterThanOrEqual(prev);
        prev = res.doseMg;
      }
    }
  });
});

describe('no dose is shown when the sheet gives none', () => {
  it('below 4 kg / 9 lb', () => {
    for (const m of MEDICINES) {
      expect(calculateDose(m.id, 3.9, 'kg').status).toBe('out-of-range');
      expect(calculateDose(m.id, 8.9, 'lb').status).toBe('out-of-range');
    }
  });
  it('above 40 kg / 90 lb', () => {
    for (const m of MEDICINES) {
      expect(calculateDose(m.id, 40.1, 'kg').status).toBe('out-of-range');
      expect(calculateDose(m.id, 90.1, 'lb').status).toBe('out-of-range');
    }
  });
  it('Advil Concentrated Drops above 16 kg', () => {
    expect(calculateDose('advil-concentrated-drops', 16.1, 'kg').status).toBe('not-listed');
    expect(calculateDose('advil-concentrated-drops', 17, 'kg').status).toBe('not-listed');
  });
  it("Advil Children's Liquid below 10 kg", () => {
    expect(calculateDose('advil-childrens-liquid', 9.9, 'kg').status).toBe('not-listed');
    expect(calculateDose('advil-childrens-liquid', 5, 'kg').status).toBe('not-listed');
  });
  it("Tylenol Children's Liquid below 6 kg", () => {
    expect(calculateDose('tylenol-childrens-liquid', 5.9, 'kg').status).toBe('not-listed');
  });
  it('invalid input', () => {
    for (const w of [0, -5, NaN, Infinity]) {
      expect(calculateDose('advil-childrens-liquid', w, 'kg').status).toBe('invalid');
    }
  });
});
