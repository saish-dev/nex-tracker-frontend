# NexTracker

Work status and productivity tracking with role-based dashboards. React 19 + Vite + Tailwind CSS v4, with optional AI features powered by Gemini.

All app code lives in [`src/`](src). Data is mocked in memory (`src/constants.ts`), so there is no backend yet.

## Run locally

Requires Node.js.

```bash
cd src
npm install
npm run dev        # http://localhost:3000
```

Other scripts: `npm run build`, `npm run preview`, `npm run lint` (type-check).

Demo sign-in: pick any persona on the login page (for example `alice@nextgen.com`, no real password needed).

## AI features

Set your key in `src/.env.local` (git-ignored):

```
GEMINI_API_KEY=your_key_here
```

Get a key at https://aistudio.google.com/apikey, then restart the dev server.

- **Smart fill** (Work Logs → Log Work): type a rough note such as "fixed login bug 2h, stuck on API timeout" and the form fills in project, work type, description, hours and status.
- **AI Summary** (Work Logs): summarizes the current week or filtered list. Managers viewing "All Users" get a team digest.
- **AI summary in Reports**: optional written narrative of one person's work for a period.

The browser never sees the key. Requests go to `/api/ai`, a small proxy defined in `src/vite.config.ts` that calls Gemini (`gemini-2.5-flash`). The proxy only exists under `npm run dev` and `npm run preview`; a production deployment needs the same endpoint on a backend or serverless function.

## Reports

Admins and managers can open **Reports**, pick a person and a period (this/last month, this/last week or a custom range), and get:

- total hours, days worked, projects and blocked entries
- a work summary: what was completed, in progress and blocked
- the full work log grouped by project
- an optional AI narrative
- **Export CSV** (summary lines above the table) and **Print / PDF** (use the browser's "Save as PDF")

## Design

The "Fresh" theme (deep green sidebar, rounded cards, Manrope + Sora fonts) is defined in `src/styles.css`. The existing `indigo-*` classes are remapped to the brand green there, so changing the accent means editing one set of tokens.

## Project layout

```
src/
  pages/        Dashboard, WorkLogs, Reports, Projects, Tasks, Settings, Super Admin, Login
  components/   Layout (sidebar, header), UI (Card, Button, Modal, ...)
  ai.ts         client for the /api/ai proxy (smart fill, summaries)
  reports.ts    date ranges, aggregation and CSV helpers for Reports
  styles.css    Tailwind import and theme tokens
  context.tsx   app state (reducer + context)
```
