# SQL Flight School — prototype architecture

## Scope and stack
A static, local-first application using modern browser ES modules, semantic HTML, CSS, and sql.js (SQLite compiled to WebAssembly). No framework build step, authentication, server database, API key, or external runtime service. A small Node static server and Windows launcher make local use straightforward. All runtime assets are bundled for static HTTPS deployment.

## Project structure
```text
index.html                 Application shell
src/app.js                Lead-owned routing, application state, persistence, integration
src/styles.css            Interface-owned visual system and responsive layouts
src/ui.js                 Interface-owned pure view helpers
src/data.js               SQL specialist: deterministic dataset and dictionary
src/sql.js                SQL specialist: database setup and guarded T-SQL execution
src/sql-worker.js         Lead-owned background execution and timeouts
src/curriculum.js         Learning specialist: mission configuration and coaching
vendor/                   Pinned sql.js runtime and license
tests/                    Node tests for SQL, data, curriculum, progress
server.mjs                Static development server
README.md                 Run, test, deployment and limitations
docs/                     Architecture, source brief and review notes
```

## Ownership and shared contracts
Lead owns app.js, worker, server, launcher, README, integration tests. SQL specialist owns data.js, sql.js and tests/sql.test.mjs. Learning specialist owns curriculum.js and tests/curriculum.test.mjs. Interface specialist owns styles.css, ui.js. Do not edit another owner's files without coordination.

Data module exports `SCHEMA` (array of `{name, description, primaryKey, columns:[{name,type,description,references?}]}`), `createDataset()` (object keyed by six uppercase table names, arrays of row objects), `DATA_AS_OF` (ISO date), `DATA_VERSION` (string). Data is fixed and deterministic for repeatable teaching and progress.

SQL module exports `createEngine(SQL)` returning `{run(sql): {columns:string[],values:any[][],rowCount:number,truncated:boolean},close()}` and `translateTSQL(sql)`. SQL is supplied by sql.js initialization. run accepts exactly one read-only SELECT, blocks mutation and administrative statements, enforces a row cap, preserves column metadata for empty results. Errors use Error messages that curriculum coaching can interpret. Only public six tables can be queried. Browser execution occurs in a terminable Web Worker.

Curriculum exports `CAMPAIGN`, `MISSIONS`, `CONFIDENCE_CHECK`, `REFERENCE`, `CALLSIGNS`, `validateResult(mission, actual, expected)`, `validateResponse(mission, answers, expected)`, `explainQuery(sql,result)`, `coachError(error,sql)`. Mission fields: `{id,title,subtitle,concepts,table,briefing,objective,starterSql,solutionSql,hints:[string,string,string],response:{template,fields:[{id,label,answer(expected):string|number}]},explanation,core:true}`. `validateResult` returns `{correct,message,conceptDemonstrated}`; expected is the solution query result and comparisons accept equivalent output (aliases permitted), preserve duplicates, and respect ordered missions. `validateResponse` returns `{correct,message}`. REFERENCE array fields `{concept,example,description,unlockAfter}`; unlockAfter is a mission id or null, `future:true` means locked in prototype. Pure modules, no browser globals.

UI module exports `escapeHtml(value)`, `renderResults(result,{emptyMessage?,caption?}={})`, `renderSchema(schema,selectedTable)`, `renderReference(reference,completedIds)`; returns safe HTML strings, no listeners or application state. Schema table buttons use `data-table="NAME"`. CSS styles documented class names used by app: app-shell, sidebar, brand, nav-button, nav-button.active, callsign-card, main-content, topbar, eyebrow, status-pill, page-title, muted, button, button.primary, button.secondary, button.ghost, button.small, card, dashboard-hero, metric-grid, metric-card, campaign-card, mission-list, mission-card, workspace, workspace-top, mission-panel, editor-panel, panel-header, query-editor, editor-actions, results-panel, results-scroll, data-table, tower-card, hint-list, response-form, field, badge, progress-track, progress-fill, onboarding, onboarding-card, callsign-grid, callsign-option, selected, modal-backdrop, modal, schema-layout, schema-map, schema-node, dictionary, reference-grid, reference-card, locked, toast, debrief-grid, achievement, divider, visually-hidden. Use native buttons, forms and accessible focus states.

## Database schema
PARTS(PART_NUMBER PK, DESCRIPTION, PRODUCT_TYPE, PRODUCT_LINE, ATA_CHAPTER)
INVENTORY(BATCH_ID PK, PART_NUMBER FK PARTS, CONDITION, QTY_ON_HAND, LOCATION, UNIT_COST, EXT_COST, SOURCE_RO_ID nullable FK REPAIR_ORDERS.RO_NUMBER, SERIAL_NUMBER nullable, LIFE_LIMIT_CYCLES nullable, CYCLES_SINCE_NEW nullable, CYCLES_REMAINING nullable)
SALES(SALE_ID PK, SALE_DATE, CUSTOMER_ID FK CUSTOMERS, PART_NUMBER FK PARTS, QTY_SOLD, UNIT_PRICE)
CUSTOMERS(CUSTOMER_ID PK, CUSTOMER_NAME)
REPAIR_ORDERS(RO_NUMBER PK, PART_NUMBER FK PARTS, VENDOR_ID FK VENDORS, DATE_SENT, DATE_RETURNED nullable, QTY_SENT, QTY_SV nullable, QTY_SCRAP nullable, REPAIR_COST nullable)
VENDORS(VENDOR_ID PK, VENDOR_NAME)

## Four missions, in teaching order
1. First contact: inspect ten inventory rows (`SELECT TOP 10 * FROM INVENTORY;`). Business response reports rows and first batch identifier. Deterministic dataset insertion order is used for this first exploration; explicitly explain TOP without ORDER BY does not guarantee order in real systems. Validation may accept any valid ten-row inventory subset, but must verify rows against actual dataset (coordinate exact method).
2. A useful readback: select BATCH_ID, PART_NUMBER, CONDITION from INVENTORY. Business response identifies the number of returned records. Compare full selected result, allow column aliases/order variation where meaningful.
3. Condition report: `SELECT DISTINCT CONDITION FROM INVENTORY;`. Business response gives three condition codes; accept any order/case.
4. Atlanta serviceable desk: `SELECT BATCH_ID, PART_NUMBER, QTY_ON_HAND FROM INVENTORY WHERE CONDITION = 'SV' AND LOCATION = 'ATL' ORDER BY BATCH_ID;`. Business response gives returned batch count and units in first listed batch. Teaches WHERE, AND and ORDER BY with optional hints.
Ungraded confidence check: use the same concepts to list OH inventory in DFW. No blocking, no score; optional model solution and coaching.

## Conflicts and deliberate compromises
- Do not duplicate PRODUCT_LINE into INVENTORY. Prototype missions only use fields in their own table. Product-line analytics wait for relational lessons.
- Prototype campaign is a four-mission orientation combining Ground School and introductory Ramp skills. Six full campaigns remain future stages, visibly marked coming later.
- Browser engine is SQLite, not SQL Server. Token-aware translation supports documented TOP and basic date functions; supported syntax is tested. Unsupported T-SQL features must produce explanatory feedback. SQLite typing/collation differences are documented rather than presented as full SQL Server parity.
- No TOP PERCENT / WITH TIES, SQL variables, stored procedures or administrative statements. LIMIT is rejected with a T-SQL teaching message.
- Tower is local rules plus mission content, not an external AI chatbot. It works without accounts or API costs.
- Callsigns are unique within the one local profile; global uniqueness requires future server accounts. Immutable USER_ID remains separate.
- Static synthetic dataset uses a fixed training date; GETDATE returns that training date for repeatable exercises, clearly labeled in the app.
- Missions validated by output, not exact SQL text. Intended concepts produce supportive practice feedback, not rejection of correct alternative queries.

## Completion checks
Real SQL produces results; no mutation path; errors coach clearly; valid alternative solutions accepted; incorrect populations and business values rejected; mission query survives Sandbox; progress survives reload; schema and all six sample tables work; debrief and ungraded confidence check accessible; keyboard and narrow-screen layouts usable; static deployment needs no runtime external network.

## Lesson-first learning update
Each mission now opens with learning objectives, concept-by-concept worked examples, a plain-language readback, and an optional ungraded understanding check. `src/lessons.js` stores lesson content and `src/lesson-view.js` renders it. The learner explicitly moves from learning to application; Review lesson is always available in the mission. A per-mission `lessonViewed` flag remembers the transition without altering existing completion or drafts.
