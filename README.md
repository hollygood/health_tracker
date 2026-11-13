# Health Tracker

A mobile-first web app for keeping a family's health records in one place: what medicine was
given and when, temperatures, illnesses, growth, and medical history, for each child or adult
as a separate profile. It also works out children's Advil and Tylenol doses from weight.

Everything is stored on the device, in the browser. There is no account and no server, and
nothing is uploaded. The app can be installed to a phone's home screen and works offline.

The phased plan and what is still open are in [Plan.md](Plan.md).

## What it does

**Profiles**
- One profile per person (name, birthday, sex), switched from the top-left of every screen.
- Every entry belongs to a profile; deleting a profile deletes its entries.

**Dosage calculator**
- Advil Concentrated Drops, Advil Children's Liquid, Tylenol Concentrated Drops and Tylenol Children's Liquid.
- Enter a weight in kg or pounds and get the dose in mg and mL, with the concentration and standard dosage text.
- Values come from a printed dosage sheet, which can be opened full screen for reference.
- Shows no dose, with a reason, where the sheet gives none.

**Logging**, each with add, edit and delete
- **Medicine:** time, type, amount, notes. The amount is pre-filled from the profile's weight for the four medicines above.
- **Temperature:** time and a reading in °C or °F.
- **Sickness:** start, optional end, category, notes. Categories can be added.
- **Growth:** date, height, weight (kg or pounds), head circumference.
- **Medical history:** title, date, category, description. Text can be read in from a photo. Notes are an expandable list.

**Reports**
- A timeline of everything logged for the profile, grouped by day.
- Filter by date range and by one or several categories.
- Export exactly what is shown as plain text that people and AI assistants can read: share sheet (Notes, Mail, Gmail), copy, or download.

**Growth chart**
- Weight, height, BMI and head circumference plotted over the WHO percentile lines for the child's age and sex.
- The latest value and percentile of each, and a table of every measurement.

**Backup and restore**
- Save everything to one file, and load it back on the same or another device.

## Built with

| | |
|---|---|
| Language | TypeScript |
| UI | React 19 |
| Build and dev server | Vite 7 |
| Styling | Tailwind CSS 4 (design tokens in `src/styles.css`) |
| Icons | Font Awesome 6, through `react-icons` |
| Tests | Vitest, React Testing Library, jsdom |
| Storage | The browser's localStorage, on the device |
| Offline and install | `vite-plugin-pwa` (web app manifest and service worker) |
| Photo to text | Tesseract.js 7, run on the device |
| Charts | Hand-written SVG, no chart library |
| Growth reference | WHO Child Growth Standards (0 to 5 years) and WHO Reference 2007 (5 to 19 years) |
| Hosting | Cloudflare Workers static assets (`wrangler.jsonc`) |

There is no backend. Routing is a small hash router (`#/reports`), so the app can be served
as static files from anywhere.

## Getting started

Needs Node.js 20.19 or newer (22 recommended).

```
npm install
npm run dev
```

Then open the address it prints. On a phone on the same Wi-Fi, use the "Network" address.

## Commands

```
npm install        # once
npm run dev        # local dev server (http://localhost:5173)
npm test           # all unit and component tests
npm run test:watch # re-run tests on change
npm run build      # type-check and build to dist/
npm run preview    # serve the built dist/ locally
npm run deploy     # build and publish to Cloudflare (first run asks you to log in)
npm run who:data   # once: download the WHO growth tables and build the app's reference data
```

To add a dosage test case, add a row to `src/features/dosage/dosageTable.ts` (sheet rows) or to the
`cases` list in `src/features/dosage/calculateDose.spec.ts` (in-between weights).

## Installing and offline use

`npm run build` generates a web app manifest and a service worker (via `vite-plugin-pwa`),
so the deployed app can be added to a phone's home screen and opens with no connection.

- The service worker exists only in a production build. Check it with `npm run build` and
  `npm run preview`, not `npm run dev`.
- Installing needs HTTPS (or `localhost`), so on a phone it works from the deployed site,
  not from the dev server's network address.
- iPhone: open the site in Safari, Share, then "Add to Home Screen". Android: Chrome menu, "Install app".
- Updates install themselves the next time the app is opened with a connection.
- Photo-to-text downloads its engine and English data from a CDN the first time it is used;
  the service worker keeps a copy so later uses work offline.
- All data is still stored only in the browser on that device. Installing does not change
  that; use Backup and restore to protect it.

## Privacy and limits

- Data lives only in this browser on this device. Clearing the browser's data, or losing the
  device, loses it; use Backup and restore. The backup file is not encrypted.
- Photos used for photo to text are not saved or uploaded. Only the text is kept.
- The dosage calculator reproduces one printed sheet. Always read the label of the product
  you have, and ask a healthcare provider if unsure.
- Growth percentiles are a guide, not a diagnosis.

## Dosage calculator rules

- `src/features/dosage/dosageTable.ts` is the printed sheet, row for row. It is the source of truth.
- A weight printed on the sheet (kg or lb) returns the sheet's values verbatim.
- A weight between rows uses the standard mg/kg, with mL rounded to 1 decimal.
- Pounds are converted with the sheet's own ratio (2.25 lb/kg).
- No dose is shown outside 4-40 kg, or where the sheet prints "-" for a product.

## WHO growth data

Percentiles on the growth chart come from the WHO Child Growth Standards (0 to 5 years) and
the WHO Growth Reference 2007 (5 to 19 years), the set used by the WHO Growth Charts for Canada.

`npm run who:data` downloads the seven official LMS tables from the WHO `anthro` and
`anthroplus` repositories into `data-raw/who/`, checks them (complete age range, increasing
ages, published birth medians), and writes `src/features/growth/data/whoGrowthData.json`.
Commit both. If a download fails, the script lists where to get the files; put them in
`data-raw/who/` and run it again. Until the data file exists, the chart still plots the
measurements but shows no percentiles.

The 0 to 5 year tables are daily; the app keeps every 7th day and interpolates between,
which changes a percentile by far less than the rounding shown. Height is not adjusted for
lying-down versus standing measurement (WHO applies a 0.7 cm correction when a child is
measured the other way from the standard for their age).

## Export format

Reports export as Markdown: a header describing the profile and the filters used, then one
`## yyyy-mm-dd` section per day, oldest first, with one line per entry
(`- 09:30 Medicine: Advil Children's Liquid, 6 mL. Notes: After lunch`). Dates and times are
local, in fixed formats, so the text reads the same to a person and to an AI assistant.
The format is defined in `src/features/reports/reportExport.ts` and pinned by its tests.

## Project structure

```
Plan.md                          phased plan and open items
wrangler.jsonc                   Cloudflare deploy config
public/                          app icons
scripts/
  buildWhoData.mjs               downloads and converts the WHO tables
  whoData/convert.mjs            pure conversion and checks (+ convert.spec.ts)
data-raw/who/                    the WHO source files, as downloaded
src/
  main.tsx                       entry point
  App.tsx                        layout + routing only   (+ App.spec.tsx)
  routes.ts                      Route type
  styles.css                     Tailwind import, design tokens, shared classes
  assets/
    dosage-table.jpg             the printed dosage sheet
  components/                    shared, feature-agnostic UI
    AppHeader.tsx
    BottomNav.tsx                (+ .spec.tsx)
    SegmentedControl.tsx         (+ .spec.tsx)
    MultiSelectDropdown.tsx      tick one or several     (+ .spec.tsx)
  hooks/
    useHashRoute.ts              minimal hash router
  features/
    backup/
      backupFile.ts              create, check, restore   (+ .spec.ts)
      BackupPage.tsx             (+ .spec.tsx)
    dosage/
      dosageTable.ts             sheet data, row for row (source of truth)
      calculateDose.ts           pure dose logic         (+ .spec.ts)
      DosageCalculatorPage.tsx   (+ .spec.tsx)
      DoseResultCard.tsx         (+ .spec.tsx)
      DosageSheetViewer.tsx      (+ .spec.tsx)
    home/
      HomePage.tsx               (+ .spec.tsx)
    growth/
      whoData.ts                 dataset types, indicator names
      loadWhoData.ts             loads the generated data on demand
      useWhoData.ts              loading state hook
      lms.ts                     WHO z-score and percentile maths (+ .spec.ts)
      growthStats.ts             age, BMI, series, curves   (+ .spec.ts)
      GrowthChart.tsx            SVG chart                  (+ .spec.tsx)
      GrowthChartPage.tsx        (+ .spec.tsx)
      data/whoGrowthData.json    generated by `npm run who:data`
    profiles/
      profileStorage.ts          on-device storage       (+ .spec.ts)
      useProfiles.ts             profile state hook
      ProfileSheet.tsx           (+ .spec.tsx)
      ProfileWeightEditor.tsx    add / update saved weight
    logs/
      entryTypes.ts              entry shapes, default categories
      entryStorage.ts            on-device storage       (+ .spec.ts)
      useEntries.ts              one profile's entries of one type
      useProfileEntries.ts       all of one profile's entries (Reports)
      entryTypeMeta.ts           icon and colour per entry type
      useCategories.ts           default + custom categories
      formatters.ts              dates, units, numbers   (+ .spec.ts)
      entrySummary.ts            one-line text per entry (+ .spec.ts)
      LogPageLayout.tsx          shared page frame       (+ .spec.tsx)
      RecentEntries.tsx          list with edit, delete  (+ .spec.tsx)
      EntryFormFooter.tsx        save / cancel buttons   (+ .spec.tsx)
      useEntryEditor.ts          add / edit / delete flow
      CategoryPicker.tsx         (+ .spec.tsx)
      medicine/MedicineLogPage.tsx        (+ .spec.tsx)
      temperature/TemperatureLogPage.tsx  (+ .spec.tsx)
      sickness/SicknessLogPage.tsx        (+ .spec.tsx)
      growth/GrowthLogPage.tsx            (+ .spec.tsx)
      history/MedicalHistoryPage.tsx      (+ .spec.tsx)
      history/HistoryNoteList.tsx         expandable notes (+ .spec.tsx)
      history/PhotoToText.tsx             (+ .spec.tsx)
      history/recognizeText.ts            Tesseract.js wrapper (+ .spec.ts)
    reports/
      ReportsPage.tsx            (+ .spec.tsx)
      ReportFilterBar.tsx        date range, category    (+ .spec.tsx)
      ReportTimeline.tsx         entries grouped by day  (+ .spec.tsx)
      ExportPanel.tsx            share / copy / download (+ .spec.tsx)
      reportFilters.ts           filtering and grouping  (+ .spec.ts)
      reportExport.ts            builds the export text  (+ .spec.ts)
      shareReport.ts             share sheet, clipboard  (+ .spec.ts)
  test/
    setup.ts                     Vitest + Testing Library setup
    fixtures.ts                  sample profiles and entries
    whoFixture.ts                made-up reference data for tests
```

## Conventions

- One feature per folder under `src/features/`; only truly shared pieces go in `src/components/` and `src/hooks/`.
- Components: `PascalCase.tsx`, one component per file, default export, typed `Props`. Pages end in `Page`.
- Hooks: `useThing.ts`. Pure logic and data: `camelCase.ts`, no React imports.
- Tests sit next to the file they test: `Thing.spec.tsx` / `thing.spec.ts`.
- Component tests use React Testing Library and query by role and label, the way a user finds things.
- Business logic (dose maths, storage) lives outside components so it can be unit-tested directly.
- State is derived during render where possible; effects are only for syncing with the outside world (storage, URL, key listeners).
- Colours and fonts come from the `@theme` tokens in `src/styles.css`, never hard-coded in components.
