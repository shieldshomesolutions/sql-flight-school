# Prototype verification

## Automated checks

24 tests pass under Node's in-process test runner:

- Six-table volumes, deterministic data, foreign-key coherence, LLP life/quantity rules, acquisition costs, repair outcomes and dates.
- TOP, DISTINCT, aliases, bracketed identifiers, complete and empty result metadata.
- Tokenization of comments and strings; single-SELECT and mutation safeguards.
- Real JOIN, aggregate, HAVING and NULL queries; date boundaries and month-end behavior.
- 2,000-row output cap.
- Correct alternative mission queries, different column ordering, genuine alternate ten-row samples, duplicates, omitted rows and incorrect populations.
- Business readbacks including case/order variation and incorrect values.
- Progress round trips, idempotent completion, corrupt/unavailable storage.
- Escaped UI values and active-mission references with future concepts locked.

## Browser walkthrough

Verified in a separate local test origin so learner progress is unaffected:

- Onboarding and callsign selection.
- Mission 1: ten actual inventory rows; wrong readback rejected; correct readback completes; completion survives reload.
- Mission 2: aliased/reordered three-column SQL accepted; 420-record readback completes.
- Mission 3: duplicate condition rows rejected with useful feedback; DISTINCT works; condition codes accepted in different order and lowercase.
- Mission 4: missing text quotes receives coaching; correct SV/ATL population returns 35 batches; first batch quantity is 1; business readback completes.
- Campaign debrief reaches 4/4 with concepts, attempts, hints, saved query examples and achievements.
- Ungraded OH/DFW confidence query accepted.
- Reload retains completion and draft SQL.
- Send to Sandbox preserves the mission draft; Sandbox executes real queries without grading.
- Editing a Sandbox query prevents Tower from claiming old results describe the new query.
- Tab leaves the SQL editor and reaches Run query.
- All six table previews display 12 rows and their dictionary fields.
- Reference panel exposes learned/active concepts and keeps future course material locked.
- Browser console reported no errors or warnings during the walkthrough.
- A deliberately expensive three-table query was stopped by the worker timeout; a subsequent small query succeeded after the database worker restarted.
- A DELETE attempt was blocked; the inventory count remained 420.
- A 390px-wide layout was visually checked; content stayed within the viewport and navigation remained available. Desktop sizing was restored afterward.

## Independent review and corrections

The SQL/data specialist reviewed lead-owned integration and found a keyboard trap, stale query explanations, and an asynchronous mission-switch race. All three were corrected. A query revision is now checked after each asynchronous result step, and edited results are labeled as belonging to the previous query.

The learning specialist exercised alternative queries against the real engine and reviewed inventory/repair consistency. The review found that laterally opened missions needed their own reference concepts available. Active mission context now unlocks those concepts without exposing future-course examples.

The interface specialist refined sidebar identity, hero spacing, responsive layouts, and scrolling mission feedback. The lead visually inspected the integrated desktop workspace and improved visibility of Tower feedback after a run.

## Remaining validation limits

This is a prototype, not a completed course or production deployment. No external hosting deployment, cross-browser matrix, full screen-reader audit, or extended learner study has been performed. The implementation uses a documented T-SQL subset over SQLite rather than a SQL Server conformance suite.

## Lesson-first update
All 14 worked SQL examples run against the actual dataset. Added tests check column selection, DISTINCT, ascending/descending order, ungraded lesson feedback, and preservation of drafts/completion when lesson state is saved.

Browser verification of the lesson update: opening a mission shows its lesson first; incorrect and correct practice answers receive ungraded feedback; Apply opens the workspace; Review lesson preserves an edited query. The five filtering/sorting teaching sections render correctly. No browser console errors were recorded. Existing completion remains intact.
