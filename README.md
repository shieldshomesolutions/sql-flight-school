# SQL Flight School

A runnable aviation SQL training prototype: one four-mission campaign, real browser SQL, Tower coaching, business readbacks, Sandbox, schema exploration, and saved local progress.

## Start on this Windows computer

1. Open the `sql-flight-school` folder.
2. Double-click **Launch SQL Flight School.cmd**.
3. Your browser opens at **http://127.0.0.1:4173**. Keep the launcher window open while you learn.

If the browser does not open automatically, use the address above. If the address already works, the app is already running. Opening `index.html` directly from disk will show startup instructions because browser modules and the database worker require HTTP or HTTPS.

The launcher uses Node.js from PATH, or the bundled Codex Node runtime already installed on this computer. On another computer, install Node.js 22 or newer first. No npm install, database installation, API key, or account is required.

## Run from a terminal

From this folder:

```text
node server.mjs
```

Then open `http://127.0.0.1:4173`. Stop the server with Ctrl+C. `node server.mjs --open` also opens the default browser. Set the `PORT` environment variable if 4173 is already occupied by another application.

## What to try

1. Enter your name and choose one of five callsigns; reshuffle for more choices.
2. Open **First contact**. Begin with its learning objectives, explained examples and optional ungraded readback. Choose **Apply it in the mission**, then run the starter query, read ten inventory records, and transmit the batch readback.
3. Try **A useful readback**, **Condition report**, and **Atlanta serviceable desk**. Each begins with a lesson teaching its new concepts before practice. **Review lesson** reopens the teaching without changing your query draft or completion. Hints fade as missions combine more concepts. All four missions are available if you want to try a different one.
4. Send a query to **Sandbox**, experiment, and return to your saved mission draft.
5. Open the **Database map** to inspect all six tables, field definitions, relationships, and sample records.
6. Finish the campaign for its debrief, query history, achievements, and an ungraded confidence check.

Keyboard: Tab and Shift+Tab navigate controls; Ctrl+Enter or Cmd+Enter runs a query; Escape closes dialogs. The horizontal workspace divider can be dragged or adjusted with arrow keys when focused on desktop. Tables scroll horizontally for wide records. There are no manual result sorting/filtering controls; change the SQL instead.

## Architecture

The app uses browser ES modules, semantic HTML, CSS, and locally bundled **sql.js 1.13.0** (SQLite compiled to WebAssembly). It executes real SQL in a Web Worker, so a five-second timeout can stop expensive queries without freezing the interface. A token-aware adapter translates the beginner T-SQL subset. A single-SELECT guard, public-table checks, and SQLite's query-only setting protect the training database.

The main app owns navigation and local progress. Curriculum and coaching are configuration-driven. UI helpers are pure functions, separate from database execution. The immutable learner USER_ID is distinct from the public callsign.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the component contracts, database schema, decisions, and initial plan. The original complete source brief is preserved in [docs/KICKOFF_BRIEF.md](docs/KICKOFF_BRIEF.md).

## Synthetic dataset

| Table | Records |
|---|---:|
| PARTS | 196 |
| INVENTORY | 420 |
| SALES | 1,600 |
| REPAIR_ORDERS | 700 |
| CUSTOMERS | 40 |
| VENDORS | 20 |

Training date: **2026-09-01**, with two years of history. GETDATE() deliberately returns this fixed training date so exercises remain repeatable. All operational records are synthetic. LLPs are individually tracked; inventory acquisition cost is separate from repair cost; open repair orders are represented by NULL return dates.

## Tests

```text
node --test --test-isolation=none tests/*.test.mjs
```

Or run `npm test` if npm is available. The in-process option avoids child-process restrictions in some desktop sandboxes.

The suite checks data coherence, SELECT-only safeguards, T-SQL translation, dates, joins, aggregates, result caps, real-engine mission equivalence, wrong populations, readbacks, storage, HTML escaping, and reference unlocks. See [docs/VERIFICATION.md](docs/VERIFICATION.md) for browser verification and review findings.

## Deploy on a basic HTTPS web server

There is **no build step**. Upload `index.html`, `src/`, and `vendor/` together, preserving the directory structure. The app uses relative asset paths, so it can also live in a subdirectory such as `/flight-school/`.

Serve `.js` as JavaScript and `.wasm` as `application/wasm`. Keep same-origin scripts and workers enabled. All runtime assets are bundled; no runtime CDN or external API requests are needed. The Node server, launcher, tests and documentation are development conveniences and do not need to be uploaded.

HTTPS or localhost is required for a trustworthy browser environment. Hosting itself is not configured or published by this prototype.

## Progress and privacy

One learner profile is stored in localStorage on the current browser and origin. It includes callsign, drafts, attempts, hints, completed missions, successful queries, sessions and active training time. Sandbox has a separate draft. No user information or query data is transmitted to external services.

Clearing site data, switching browser, changing the address/port, or using a different computer creates a separate profile. Keep using the same address to resume. Global callsign uniqueness, authentication, cross-device sync and multiple learner accounts are future work. Browser storage failures produce a visible warning.

## Honest prototype boundaries

- Four complete orientation missions are implemented. The later campaign cards are previews; the full month-long course and JOIN capstone are not yet built.
- Tower uses local rules and prepared lesson content. It is not an open-ended AI chatbot.
- The supported SQL subset includes SELECT, TOP, DISTINCT, WHERE, AND/OR, comparisons, NULL checks, ORDER BY, aliases, simple JOINs, COUNT/SUM/AVG, GROUP BY/HAVING and DATEADD/DATEDIFF/GETDATE. The four missions teach only the introductory portion.
- This is not full SQL Server. SQLite typing, collation and integer division apply. For fractional rates use `1.0 * SUM(QTY_SCRAP) / SUM(QTY_SENT)`. Dates support day/month/year and date-only output. Unicode/case behavior and advanced dialect features have not been made SQL Server-identical.
- Subqueries, CTEs, UNION, window functions, variables, stored procedures, TOP PERCENT/WITH TIES, and database modifications are outside the supported subset. Queries are limited to 16,000 characters and 2,000 displayed rows.
- Results, rather than exact query text, determine correctness. Ordinary aliases and column reordering are supported. Deliberately renaming a column to another requested column's name can be ambiguous to the validator; use distinct descriptive aliases.
- Product-line analytics require PARTS relationships. Early missions use only INVENTORY fields to avoid teaching JOIN before its planned stage.
- The app requires a running static server; it is not an installed offline/PWA app. Runtime assets are local, but loading directly with a file:// URL is unsupported.

Third-party runtime: [sql.js](https://github.com/sql-js/sql.js), MIT license in `vendor/LICENSE`. Runtime files are pinned at version 1.13.0.
