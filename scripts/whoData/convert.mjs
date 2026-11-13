// Turns the WHO growth reference text files into the compact dataset the app reads.
// Pure functions only (no file or network access), so they can be unit-tested.

/** Days per month used by WHO to convert the 5-19 year tables (age in months) to days. */
export const DAYS_PER_MONTH = 30.4375;

/** Keep every Nth day of the daily 0-5 year tables; values between are interpolated. */
export const SAMPLE_EVERY_DAYS = 7;

/**
 * The seven source files. `ageUnit` is how the file's age column is expressed.
 * 0-5 years: WHO Child Growth Standards (2006). 5-19 years: WHO Reference 2007.
 */
export const SOURCE_FILES = {
  weianthro: { indicator: 'weight', ageUnit: 'days' },
  lenanthro: { indicator: 'height', ageUnit: 'days' },
  bmianthro: { indicator: 'bmi', ageUnit: 'days' },
  hcanthro: { indicator: 'head', ageUnit: 'days' },
  wfawho2007: { indicator: 'weight', ageUnit: 'months' },
  hfawho2007: { indicator: 'height', ageUnit: 'months' },
  bfawho2007: { indicator: 'bmi', ageUnit: 'months' },
};

/**
 * Parses one WHO table: a header line, then whitespace- or tab-separated rows with
 * at least the columns sex (1 = male, 2 = female), age, l, m, s.
 * @param {string} text
 * @returns {{ sex: 1 | 2, age: number, l: number, m: number, s: number }[]}
 */
export function parseTable(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length < 2) throw new Error('The file has no data rows.');

  const header = lines[0].trim().toLowerCase().replace(/"/g, '').split(/\s+/);
  const column = (name) => {
    const index = header.indexOf(name);
    if (index === -1) throw new Error(`Column "${name}" not found. Header was: ${header.join(', ')}`);
    return index;
  };
  const [sexAt, ageAt, lAt, mAt, sAt] = ['sex', 'age', 'l', 'm', 's'].map(column);

  return lines.slice(1).map((line, i) => {
    const cells = line.trim().split(/\s+/);
    const row = {
      sex: Number(cells[sexAt]),
      age: Number(cells[ageAt]),
      l: Number(cells[lAt]),
      m: Number(cells[mAt]),
      s: Number(cells[sAt]),
    };
    if (Object.values(row).some((n) => !Number.isFinite(n)) || (row.sex !== 1 && row.sex !== 2)) {
      throw new Error(`Row ${i + 2} is not valid: "${line}"`);
    }
    return row;
  });
}

const round = (n, decimals) => Number(n.toFixed(decimals));

/**
 * One sex of one table as `[ageDays, L, M, S]` rows, sorted by age.
 * Daily tables are thinned to every SAMPLE_EVERY_DAYS days (always keeping the last day).
 */
export function toLmsRows(rows, sex, ageUnit) {
  const own = rows.filter((r) => r.sex === sex).sort((a, b) => a.age - b.age);
  if (own.length === 0) throw new Error(`No rows for sex ${sex}.`);
  const lastAge = own[own.length - 1].age;

  return own
    .filter((r) => ageUnit === 'months' || r.age % SAMPLE_EVERY_DAYS === 0 || r.age === lastAge)
    .map((r) => [ageUnit === 'months' ? round(r.age * DAYS_PER_MONTH, 2) : r.age, r.l, r.m, r.s]);
}

/**
 * Builds the dataset from the parsed files.
 * @param {Record<keyof typeof SOURCE_FILES, ReturnType<typeof parseTable>>} tables
 */
export function buildDataset(tables, generatedAt = new Date()) {
  const indicators = {};
  for (const [name, { indicator, ageUnit }] of Object.entries(SOURCE_FILES)) {
    if (!tables[name]) throw new Error(`Missing table: ${name}`);
    indicators[indicator] ??= { male: [], female: [] };
    indicators[indicator].male.push(...toLmsRows(tables[name], 1, ageUnit));
    indicators[indicator].female.push(...toLmsRows(tables[name], 2, ageUnit));
  }

  const dataset = {
    source:
      'WHO Child Growth Standards (2006, 0-5 years) and WHO Growth Reference (2007, 5-19 years), ' +
      'LMS tables from the WHO anthro and anthroplus packages.',
    generatedAt: generatedAt.toISOString(),
    indicators,
  };
  validateDataset(dataset);
  return dataset;
}

/** Published medians at birth, used to catch a wrong or corrupted source file. */
const BIRTH_MEDIANS = [
  ['weight', 'male', 3.3464],
  ['weight', 'female', 3.2322],
  ['height', 'male', 49.8842],
  ['height', 'female', 49.1477],
];

/** Last age each indicator must reach, in years. */
const COVERS_YEARS = { weight: 10, height: 19, bmi: 19, head: 5 };

/** Throws with a clear message if the dataset is incomplete or implausible. */
export function validateDataset(dataset) {
  for (const [indicator, years] of Object.entries(COVERS_YEARS)) {
    for (const sex of ['male', 'female']) {
      const rows = dataset.indicators[indicator]?.[sex];
      const where = `${indicator} (${sex})`;
      if (!rows?.length) throw new Error(`${where}: no rows.`);
      if (rows[0][0] !== 0) throw new Error(`${where}: does not start at birth.`);
      const lastYears = rows[rows.length - 1][0] / 365.25;
      if (lastYears < years - 0.1) {
        throw new Error(`${where}: ends at ${lastYears.toFixed(1)} years, expected ${years}.`);
      }
      rows.forEach(([age, , m, s], i) => {
        if (i > 0 && age <= rows[i - 1][0]) throw new Error(`${where}: ages are not increasing at row ${i}.`);
        if (!(m > 0) || !(s > 0)) throw new Error(`${where}: M and S must be positive at age ${age}.`);
      });
    }
  }

  for (const [indicator, sex, expected] of BIRTH_MEDIANS) {
    const actual = dataset.indicators[indicator][sex][0][2];
    if (Math.abs(actual - expected) > 0.001) {
      throw new Error(
        `${indicator} (${sex}): median at birth is ${actual}, expected ${expected}. ` +
          'The source file does not look like the WHO table.',
      );
    }
  }
}
