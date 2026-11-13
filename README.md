# Health Tracker

Mobile-first family health app (React + TypeScript, Vite, Tailwind CSS v4, hosted on Cloudflare).
Colours and fonts are tokens in the `@theme` block of `src/styles.css`.
All data stays on the device.

## Roadmap

Tick items off as each phase is finished and checked on a real device.
"Built" means the code and tests are written; "Verified" means `npm test`, `npm run build`
and a look in the browser have all passed on the developer's machine.

### Phase 1: Foundation and dosage calculator (done)

- [x] Vite + React + TypeScript + Tailwind v4 project, feature-folder structure
- [x] Dosage engine with every row of the printed sheet as a unit test
- [x] Dosage calculator page (medicine, kg/pounds, mg and mL, standard dosage text)
- [x] Dosage sheet viewer (text link, opens full screen, tap to zoom)
- [x] Profiles: create, edit, switch, delete (name, birthday, sex), saved on the device
- [x] Home blocks, top-left profile switcher, bottom menu (Home, Reports)
- [x] Component tests with React Testing Library
- [x] Verified: `npm test` and `npm run build` pass, screens checked (2026-11-11)

### Phase 2: Logging (built; edit awaiting verification)

- [x] Entry storage per profile, on the device
- [x] Medicine: start time, type, amount, notes; dose suggested from the profile's weight; add or update the weight in place
- [x] Temperature: start time, reading in °C or °F
- [x] Sickness: start time, optional end time, category, notes; "Mark as recovered now"; custom categories
- [x] Growth: date, height, weight (kg or pounds), head circumference; latest weight saved to the profile
- [x] Medical history: title, date and time, category, description; custom categories
- [x] Recent list on each page; delete asks for confirmation (Keep / Confirm delete)
- [x] Edit any entry (Medicine, Temperature, Sickness, Growth, Medical history): loads it into the form, Save changes or Cancel
- [x] Deleting a profile deletes its entries
- [x] Verified: add and delete, `npm test` and `npm run build` pass (2026-11-11)
- [ ] Verified: edit (added after the check above)

### Phase 3: Reports and export (built, awaiting verification)

- [x] Timeline of the active profile's entries, grouped under a date heading per day, newest first
- [x] Filters: date range (with Last 7 days / Last 30 days / All dates) and one Category dropdown where one or several entry types and specific categories can be ticked
- [x] Edit and delete entries from the timeline (edit opens the entry's own page, then returns to Reports)
- [x] Export the filtered view as Markdown text that people and AI tools can read, with a preview
- [x] Share sheet (Apple Notes, Mail, Gmail, ...) where the device has one, copy to clipboard, download `.md`
- [ ] Verified: `npm test`, `npm run build`, and the share sheet tried on a real phone

### Phase 4: Growth chart (built, awaiting WHO data and verification)

- [x] Script that builds the WHO reference data from the official LMS tables (`npm run who:data`), with checks
- [x] WHO maths: z-score (LMS method, restricted beyond 3 SD for weight and BMI) and percentile
- [x] Growth chart page, opened from the Growth page: latest weight, height, BMI and head circumference with percentiles
- [x] Chart of the child's measurements over the WHO 3rd, 15th, 50th, 85th and 97th percentile lines; tap a point for its details
- [x] Table of measurements with age and percentile
- [ ] WHO data generated on this machine (`npm run who:data`) and committed
- [ ] Verified: a few percentiles compared with the WHO online tables or a paediatrician's chart

### Phase 5: Polish and release

- [ ] Medical history: photo to text (on-device OCR) into the description
- [ ] Installable, offline-capable app (service worker, icons)
- [ ] Deploy to Cloudflare (`npm run deploy`), custom domain
- [ ] Optional login gate with Cloudflare Access
- [ ] Backup and restore of all data to a file

### Later (not scheduled)

- [ ] Accounts and sync across devices (SSO, Cloudflare Workers API + D1 database)

## Project structure

```
wrangler.jsonc                   Cloudflare deploy config
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

## Dosage calculator rules

- `src/features/dosage/dosageTable.ts` is the printed sheet, row for row. It is the source of truth.
- A weight printed on the sheet (kg or lb) returns the sheet's values verbatim.
- A weight between rows uses the standard mg/kg, with mL rounded to 1 decimal.
- Pounds are converted with the sheet's own ratio (2.25 lb/kg).
- No dose is shown outside 4-40 kg, or where the sheet prints "-" for a product.

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

To add a test case, add a row to `src/features/dosage/dosageTable.ts` (sheet rows) or to the
`cases` list in `src/features/dosage/calculateDose.spec.ts` (in-between weights).
