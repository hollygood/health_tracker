#!/usr/bin/env node
// Builds src/features/growth/data/whoGrowthData.json from the official WHO LMS tables.
//
//   npm run who:data
//
// For each source file it uses data-raw/who/<name>.txt if present; otherwise it tries
// to download it from the WHO GitHub repositories and saves it there. If a download
// fails, put the file into data-raw/who/ by hand and run the command again.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDataset, parseTable, SOURCE_FILES } from './whoData/convert.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rawDir = path.join(root, 'data-raw', 'who');
const outFile = path.join(root, 'src', 'features', 'growth', 'data', 'whoGrowthData.json');

const GITHUB = 'https://raw.githubusercontent.com/WorldHealthOrganization';
const candidateUrls = (name) =>
  (name.endsWith('who2007')
    ? ['master', 'main'].map((b) => `${GITHUB}/anthroplus/${b}/data-raw/growthstandards/${name}.txt`)
    : ['master', 'main'].map((b) => `${GITHUB}/anthro/${b}/data-raw/growthstandards/${name}.txt`));

async function readOrDownload(name) {
  const file = path.join(rawDir, `${name}.txt`);
  if (existsSync(file)) {
    console.log(`  ${name}: using data-raw/who/${name}.txt`);
    return readFile(file, 'utf8');
  }
  for (const url of candidateUrls(name)) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const text = await response.text();
      parseTable(text); // make sure it is a table before keeping it
      await writeFile(file, text);
      console.log(`  ${name}: downloaded from ${url}`);
      return text;
    } catch {
      // try the next address
    }
  }
  return null;
}

await mkdir(rawDir, { recursive: true });
console.log('Collecting WHO tables:');

const tables = {};
const missing = [];
for (const name of Object.keys(SOURCE_FILES)) {
  const text = await readOrDownload(name);
  if (text === null) missing.push(name);
  else tables[name] = parseTable(text);
}

if (missing.length > 0) {
  console.error(`
Could not get: ${missing.map((n) => `${n}.txt`).join(', ')}

Download them and put them in data-raw/who/, then run "npm run who:data" again.
  - weianthro, lenanthro, bmianthro, hcanthro (0-5 years):
    https://github.com/WorldHealthOrganization/anthro  (folder data-raw/growthstandards)
    or the "igrowup" R macro package from https://www.who.int/tools/child-growth-standards/software
  - wfawho2007, hfawho2007, bfawho2007 (5-19 years):
    https://github.com/WorldHealthOrganization/anthroplus  (folder data-raw/growthstandards)
    or the R macro package from https://www.who.int/tools/growth-reference-data-for-5to19-years/application-tools
`);
  process.exit(1);
}

const dataset = buildDataset(tables);
await mkdir(path.dirname(outFile), { recursive: true });
await writeFile(outFile, `${JSON.stringify(dataset)}\n`);

const count = Object.values(dataset.indicators).reduce((n, i) => n + i.male.length + i.female.length, 0);
console.log(`\nWrote ${path.relative(root, outFile)} (${count} rows). The data passed its checks.`);
