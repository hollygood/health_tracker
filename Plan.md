# Health Tracker: plan

The phased plan for the app, kept up to date as work is finished. For what the app is and how
to run it, see [README.md](README.md).

How to read the boxes: a ticked feature is built, with tests. Each phase ends with its own
"Verified" lines, ticked only once it has been checked on the developer's machine or a real device.

## Phase 1: Foundation and dosage calculator (done)

- [x] Vite + React + TypeScript + Tailwind v4 project, feature-folder structure
- [x] Dosage engine with every row of the printed sheet as a unit test
- [x] Dosage calculator page (medicine, kg/pounds, mg and mL, standard dosage text)
- [x] Dosage sheet viewer (text link, opens full screen, tap to zoom)
- [x] Profiles: create, edit, switch, delete (name, birthday, sex), saved on the device
- [x] Home blocks, top-left profile switcher, bottom menu (Home, Reports)
- [x] Component tests with React Testing Library
- [x] Verified: `npm test` and `npm run build` pass, screens checked (2026-11-11)

## Phase 2: Logging (done)

- [x] Entry storage per profile, on the device
- [x] Medicine: start time, type, amount, notes; dose suggested from the profile's weight; add or update the weight in place
- [x] Temperature: start time, reading in °C or °F
- [x] Sickness: start time, optional end time, category, notes; "Mark as recovered now"; custom categories
- [x] Growth: date, height, weight (kg or pounds), head circumference; latest weight saved to the profile
- [x] Medical history: title, date and time, category, description; custom categories
- [x] Medical history notes are an expandable list: title and date on the row, details and Edit / Delete inside
- [x] Recent list on each page; delete asks for confirmation (Keep / Confirm delete)
- [x] Edit any entry (Medicine, Temperature, Sickness, Growth, Medical history): loads it into the form, Save changes or Cancel
- [x] Deleting a profile deletes its entries
- [x] Verified: `npm test` and `npm run build` pass, screens checked (2026-11-13)

## Phase 3: Reports and export (done, one device check open)

- [x] Timeline of the active profile's entries, grouped under a date heading per day, newest first
- [x] Filters: date range (with Last 7 days / Last 30 days / All dates) and one Category dropdown where one or several entry types and specific categories can be ticked
- [x] Edit and delete entries from the timeline (edit opens the entry's own page, then returns to Reports)
- [x] Export the filtered view as Markdown text that people and AI tools can read, with a preview
- [x] Share sheet (Apple Notes, Mail, Gmail, ...) where the device has one, copy to clipboard, download `.md`
- [x] Verified: `npm test` and `npm run build` pass, screens checked (2026-11-13)
- [ ] Verified: the Share button tried on a real phone (it only exists where there is a share sheet)

## Phase 4: Growth chart (done, one real-world check open)

- [x] Script that builds the WHO reference data from the official LMS tables (`npm run who:data`), with checks
- [x] WHO maths: z-score (LMS method, restricted beyond 3 SD for weight and BMI) and percentile
- [x] Growth chart page, opened from the Growth page: latest weight, height, BMI and head circumference with percentiles
- [x] Chart of the child's measurements over the WHO 3rd, 15th, 50th, 85th and 97th percentile lines
- [x] Hover over or tap a point to see its value, percentile, date and age
- [x] Table of measurements with age and percentile
- [x] WHO data generated (`npm run who:data`, 2026-11-12)
- [x] Generated data spot-checked against WHO's published tables: medians and the 2 SD values at 8 age/sex points (weight, height, head, BMI)
- [x] Verified: `npm test` and `npm run build` pass, screens checked (2026-11-13)
- [ ] Verified: a real child's percentiles compared with a paediatrician's chart

## Phase 5: Polish and release (in progress)

- [x] Medical history: photo to text into the description, on the device (Tesseract.js 7, English)
- [x] Backup and restore of all data to a file (add to what is here, or replace everything)
- [x] Installable, offline-capable app (vite-plugin-pwa 2: manifest, icons, service worker)
- [x] Verified: `npm test`, `npm run build` and `npm run preview` pass, including opening offline (2026-11-13)
- [ ] Verified: photo to text tried on real photos, online and then offline
- [ ] Deploy to Cloudflare (`npm run deploy`), custom domain
- [ ] Verified: installed to a phone's home screen from the deployed site
- [ ] Optional login gate with Cloudflare Access

## Housekeeping

- [ ] First git commit and push to `hollygood/health_tracker` (include `data-raw/who/` and `src/features/growth/data/whoGrowthData.json`)

## Later (not scheduled)

- [ ] Accounts and sync across devices (SSO, Cloudflare Workers API + D1 database)
- [ ] Move storage from localStorage to IndexedDB if photos or much larger histories are ever stored
- [ ] Height and head circumference in inches
- [ ] Languages other than English for photo to text
- [ ] Expandable medical history notes on the Reports timeline
