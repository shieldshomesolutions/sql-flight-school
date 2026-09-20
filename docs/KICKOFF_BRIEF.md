Absolutely. Paste the following into Codex as the project kickoff prompt. I wrote it as if I were handing requirements to a developer who has never seen our conversation.

---

# SQL Flight School — Prototype Build Brief

You are building a working prototype of a web-based training application called **SQL Flight School**.

Your job is to design and implement the prototype, not merely produce mockups or pseudocode.

The product should teach a technically cautious adult learner the fundamentals of SQL by using realistic aviation aftermarket data and business scenarios.

The core emotional goal is:

> “This feels like an aviation system I want to explore, and SQL suddenly feels much less intimidating.”

The learner should finish the experience thinking:

> “I can look at a basic SQL query and understand what it is doing. I can write simple queries myself. I understand that databases are connected tables. And if I don’t know something, I know how to explore and figure it out.”

The application should prioritize **confidence through competence**, not maximum technical coverage.

---

# 1. Target Learner

The initial learner profile is:

- Age 50+
- Long career in aviation
- Very comfortable with aviation terminology
- Comfortable with basic Excel formulas
- Pivot tables feel intimidating
- Interested in eventually being able to understand tools like Power BI
- Uses Salesforce as an end user but does not build reports
- Has essentially no SQL confidence
- May be hesitant around programming or technical tools

Do not dumb down the aviation terminology.

The learner is aviation-fluent but technically cautious.

Use aviation expertise as the bridge into learning database concepts.

---

# 2. Product Identity

Product name:

**SQL Flight School**

The learner has a **callsign**.

The built-in coach is called:

**Tower**

Conceptual identity:

- SQL Flight School = training environment
- Tower = mentor / coach
- Callsign = learner identity
- Campaigns = qualification stages
- Final Check Ride = capstone

Do not focus the product around a fictional airline brand.

The callsign and aviation-data-training identity should be the main theme.

---

# 3. Callsign Onboarding

On first launch, create a simple local learner profile.

The learner should:

1. Enter their name
2. Be shown 5 aviation-style callsigns
3. Pick one
4. Have a **Reshuffle** option to generate 5 new choices

Use a curated list of non-vulgar, professional aviation-style callsigns.

Examples:

- PHANTOM
- VIPER
- ATLAS
- MERCURY
- RAPTOR
- VECTOR
- HAWKEYE
- FALCON
- COMET
- TITAN

Internally, do not use the callsign as the true database primary key.

Use something like:

```text
USER_ID
DISPLAY_NAME
CALLSIGN
```

`USER_ID` should be immutable.

`CALLSIGN` should be treated as a unique public identity.

For the prototype, this can remain local-only.

Architect it so server-side multi-user accounts could be added later without rebuilding the training system.

Do not implement authentication in the prototype.

---

# 4. Visual Direction

The visual style should be:

**Modern web application with aviation / avionics styling and subtle-to-moderate CRT influence.**

It should feel:

- exploratory
- professional
- aviation-inspired
- slightly retro
- not childish
- not like a generic coding bootcamp

Use:

- dark navy / charcoal background
- restrained green phosphor accents
- amber caution / attention indicators
- subtle glow
- subtle scanline or CRT texture
- monospaced SQL editor
- crisp, highly readable data tables
- cockpit/system-status inspired UI elements

Readability must always be more important than the retro effect.

Do not turn it into a full retro terminal.

Think:

> modern data application inspired by avionics displays.

---

# 5. Primary Workspace Layout

The main mission workspace uses three panels arranged like this:

```text
┌────────────────────────────┬────────────────────────────┐
│                            │                            │
│      MISSION / TOWER       │        SQL EDITOR          │
│                            │                            │
│ Mission objective          │ SQL code                  │
│ Context                    │                            │
│ Hints                      │ [ RUN QUERY ]              │
│ Tower coaching             │ [ SEND TO SANDBOX ]       │
│ Progress                   │                            │
│                            │                            │
├────────────────────────────┴────────────────────────────┤
│                                                         │
│                    LIVE RESULTS                         │
│                                                         │
│  Large tabular result area                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Top-left:

**Mission / Tower**

Top-right:

**SQL Editor**

Entire bottom half:

**Live Results**

The results pane needs substantial horizontal and vertical space because aviation data can have many columns.

Make the horizontal divider between the top and results area draggable if practical.

Do not add manual result-table filtering or sorting controls in the prototype.

If the learner wants a different result order or subset, they should modify their SQL.

---

# 6. SQL Dialect

Teach **Microsoft SQL Server / T-SQL style syntax**.

Use concepts such as:

```sql
SELECT TOP 100 *
FROM SALES;
```

rather than:

```sql
LIMIT 100
```

Teach and support the relevant beginner T-SQL subset:

- SELECT
- TOP
- DISTINCT
- FROM
- WHERE
- AND
- OR
- comparison operators
- IS NULL
- IS NOT NULL
- ORDER BY
- COUNT
- SUM
- AVG
- GROUP BY
- HAVING
- aliases
- JOIN
- DATEDIFF
- DATEADD
- GETDATE if useful

Do not mix SQL dialects in learner-facing examples.

If the underlying browser SQL engine is not truly T-SQL, create a compatibility layer or preprocessing system for the limited syntax needed by the course.

The learner should experience consistent T-SQL syntax.

---

# 7. Read-Only Environment

This is a query-analysis course.

Do not teach or expose:

- CREATE TABLE
- ALTER TABLE
- INSERT
- UPDATE
- DELETE
- DROP
- database administration

The learner should feel completely safe experimenting.

They should understand:

> “I cannot break anything here.”

---

# 8. Aviation Data Environment

The fictional business behaves like an aviation aftermarket material company.

It:

- owns inventory
- sells material
- sends repairable material to external repair vendors
- tracks repair history
- tracks sales demand
- tracks inventory cost
- manages LLPs and high-value aviation material

It does **not** repair material internally.

Primary product lines:

- CFM56
- CF6
- PW2000

Also include airframe-related material tied to the major aircraft families associated with those engine platforms where useful.

Use realistic aviation terminology.

Publicly known OEMs, aircraft families, engine families, repair vendors, etc. may be used where appropriate.

All operational records, inventory quantities, costs, sales, serial numbers, scrap outcomes, and repair history must be synthetic.

Do not use proprietary or company-sensitive data.

---

# 9. Product Types

The `PARTS` table should contain:

```text
PART_NUMBER
DESCRIPTION
PRODUCT_TYPE
PRODUCT_LINE
ATA_CHAPTER
```

`PRODUCT_TYPE` should use:

```text
LLP
REP
ROT
```

Where:

- LLP = Life Limited Part
- REP = Repairable
- ROT = Rotable

Do not include:

- LLP_FLAG
- SERIALIZED_FLAG

The product type itself should convey that distinction.

---

# 10. Core Database Tables

The prototype should be based around these tables:

```text
PARTS
INVENTORY
SALES
CUSTOMERS
REPAIR_ORDERS
VENDORS
```

Avoid adding unnecessary tables for Version 1.

No aircraft/fleet table is required.

---

# 11. PARTS

Recommended structure:

```text
PART_NUMBER
DESCRIPTION
PRODUCT_TYPE
PRODUCT_LINE
ATA_CHAPTER
```

Example product lines:

```text
CFM56
CF6
PW2000
737NG
757
767
A320
```

Use realistic aviation descriptions and believable synthetic part numbers.

Prefer synthetic but realistic-looking part numbers unless there is a strong educational reason to use publicly known real ones.

---

# 12. INVENTORY

Inventory represents **only material physically on hand**.

Condition values are limited to:

```text
AR
SV
OH
```

Meaning:

- AR = As Removed
- SV = Serviceable
- OH = Overhauled

Recommended structure:

```text
BATCH_ID
PART_NUMBER
CONDITION
QTY_ON_HAND
LOCATION
UNIT_COST
EXT_COST
SOURCE_RO_ID
SERIAL_NUMBER
LIFE_LIMIT_CYCLES
CYCLES_SINCE_NEW
CYCLES_REMAINING
```

Not every field needs to apply to every product type.

Important rules:

### LLPs / individually tracked assets

LLPs must be represented one physical asset per row because each has individual life information.

Typical quantity:

```text
QTY_ON_HAND = 1
```

Examples of useful LLP fields:

```text
SERIAL_NUMBER
LIFE_LIMIT_CYCLES
CYCLES_SINCE_NEW
CYCLES_REMAINING
```

This should support missions like:

> Find all PW2000 LLPs with more than 3,000 cycles remaining.

### Batched material

Items such as blades may have several units stored under one row.

`BATCH_ID` is the primary inventory identifier.

Example:

```text
BATCH_ID = B000184
PART_NUMBER = XXXXX
CONDITION = SV
QTY_ON_HAND = 24
```

Every piece in a given batch must have the same:

- part number
- inventory condition

### Cost

Inventory has:

```text
UNIT_COST
EXT_COST
```

Where:

```text
EXT_COST = QTY_ON_HAND * UNIT_COST
```

Inventory acquisition cost must remain separate from repair cost.

Do not combine repair cost into inventory cost.

### Locations

Use a small set such as:

```text
ATL
DFW
MIA
LAX
```

---

# 13. SALES

Sales history should contain two years of synthetic transactions.

Recommended structure:

```text
SALE_ID
SALE_DATE
CUSTOMER_ID
PART_NUMBER
QTY_SOLD
UNIT_PRICE
```

Do not duplicate the customer name inside SALES.

Use `CUSTOMER_ID` to relate to CUSTOMERS.

Product information should be derived through PARTS when needed.

This relationship should eventually help teach JOINs.

---

# 14. CUSTOMERS

Keep this simple:

```text
CUSTOMER_ID
CUSTOMER_NAME
```

Use realistic aviation-style customer names.

Public airline/company names may be used where appropriate, but the transaction history is synthetic.

---

# 15. VENDORS

Keep vendor information minimal:

```text
VENDOR_ID
VENDOR_NAME
```

The learner does not need capability tables or additional vendor metadata in Version 1.

---

# 16. REPAIR_ORDERS

Repair history should include roughly two years of synthetic data.

Recommended structure:

```text
RO_NUMBER
PART_NUMBER
VENDOR_ID
DATE_SENT
DATE_RETURNED
QTY_SENT
QTY_SV
QTY_SCRAP
REPAIR_COST
```

Important logic:

### Open repair

If:

```text
DATE_RETURNED IS NULL
```

the material is still at the repair vendor.

Do not add a redundant STATUS column.

The learner should learn that status can be derived from the data.

### Turnaround Time

Use:

```text
DATEDIFF(day, DATE_SENT, DATE_RETURNED)
```

Keep TAT simple.

Do not introduce quote date / approval date / complex repair workflow timing in Version 1.

### Scrap Rate

For groups such as a vendor, product line, or part number:

```text
SUM(QTY_SCRAP) / SUM(QTY_SENT)
```

Do not average individual repair-order scrap percentages.

---

# 17. Synthetic Data Volume

Approximate desired dataset size:

```text
PARTS:          150–250
INVENTORY:      300–500 rows/assets/batches
SALES:          1,000–2,000 transactions
REPAIR_ORDERS:  500–1,000 records
CUSTOMERS:      30–50
VENDORS:        15–25
```

Historical period:

**2 years**

Make the data internally coherent.

Do not generate completely random noise.

Examples:

- parts associated logically with product lines
- sensible aviation prices
- repair costs correlated to high-value aviation material
- LLP life values that make sense
- realistic variation in vendor TAT
- realistic but synthetic scrap rates
- uneven demand patterns
- some open repair orders with `DATE_RETURNED = NULL`

The data should create interesting analytical questions.

---

# 18. Demand Concept

Demand forecasting in Version 1 is intentionally simple.

It is not statistical forecasting.

The learner should use recent historical sales as a proxy for expected future demand.

Example:

> 3-month rolling / recent average sales demand

The business interpretation is:

> Based on what we have recently sold, how much SV material should we expect to need on the shelf?

Example mission:

> Calculate the average monthly sales over the last 3 months for a part number and compare it with current SV inventory.

Do not introduce advanced forecasting algorithms.

---

# 19. Learning Philosophy

The course should progressively transition from explicit technical instructions to natural business language.

Early:

> Use `WHERE` to show only SV inventory.

Middle:

> Find all SV PW2000 inventory located in ATL.

Later:

> Materials leadership wants to understand what serviceable PW2000 stock is immediately available in Atlanta.

The learner should gradually learn to translate:

**business request → data question → SQL**

---

# 20. Coaching Philosophy

Tower should use a **fading-support model**.

Early campaigns:

- heavy coaching
- table suggestions
- field suggestions
- guided thinking

Middle campaigns:

- hints available
- less direct instruction

Late campaigns:

- natural business language
- learner selects tables and approach
- help is optional

Final Check Ride:

- mostly independent
- Tower helps only when requested or when the learner is clearly stuck

---

# 21. Tower Personality

Tower should be:

- calm
- competent
- supportive
- professional
- personable
- occasionally aviation-flavored

Do not make Tower a cartoon mascot.

Occasional lines may include:

> Good readback.

> You’re cleared to continue.

> Let’s check that return.

> Nice work. That query did exactly what the mission needed.

Do not overuse ATC language.

Tower should feel like someone watching over the learner and helping them succeed.

---

# 22. Tower Error Handling

Distinguish between:

### SQL syntax errors

Example:

Learner writes:

```sql
WHERE CONDITION = SV
```

Tower should explain:

> `SV` is text, so SQL expects quotation marks around it. Try `'SV'`.

Avoid raw database error text when possible.

### Business logic errors

If the SQL runs but returns the wrong population, Tower should explain what happened.

Example:

> Your SQL ran successfully, but the result includes AR and OH inventory too. The mission asks specifically for serviceable material. Which field could you filter to narrow the result?

Do not use harsh “wrong answer” language.

Prefer:

- Almost there
- This query ran, but…
- Your result currently includes…
- Take another look at…

---

# 23. Proactive Coaching

Tower should be lightly proactive.

Examples:

If the learner has repeated the same error several times:

> You’ve hit the same issue a few times. Want a hint?

If the learner completes several missions without hints:

> That’s your third clean mission in a row.

Avoid excessive interruption.

Suggested behavior:

- first mistake → explanation
- repeated mistake → offer targeted hint
- repeated success → reinforce progress

---

# 24. Hint System

Use three levels of hints:

### Hint 1 — Conceptual

> You need to filter the inventory table by condition.

### Hint 2 — SQL concept

> This mission uses `WHERE`.

### Hint 3 — Query skeleton

```sql
SELECT ...
FROM INVENTORY
WHERE ...;
```

Then allow:

**Show Solution**

Hints should remain available even in later campaigns, but they should not be forced.

---

# 25. Mission Validation

Validate primarily by **correct result**, not exact query text.

A learner may reach the correct answer multiple valid ways.

If two SQL statements produce the correct result, both should be accepted.

Also track whether the learner demonstrated the intended concept.

Example:

If a mission is specifically intended to teach `GROUP BY` and the learner gets the correct result through another technique, Tower can say:

> Your answer is correct. This mission is designed to practice `GROUP BY`; want to try solving it that way too?

Do not reject technically correct solutions unnecessarily.

---

# 26. Query Explanation

Every successful query should receive an explanation.

Example:

> **What your query did**
>
> You asked the INVENTORY table to return only rows where Product Line is PW2000, Condition is SV, and Location is ATL.
>
> **Why that answered the mission**
>
> Those three filters define the exact stock population Materials Control asked about.

This is a core feature.

The learner should repeatedly see the connection:

**SQL syntax → data operation → aviation business answer**

---

# 27. Mission Business Response

Every mission should conclude with a short business-response step.

Use a prewritten email/message template containing blanks.

Example:

```text
To: Luis — Repair Control

The average turnaround time for PW2000 repairs is [____] days.

The fastest vendor is [____], with an average turnaround time of [____] days.
```

The learner fills values from the SQL result table.

Then presses something like:

**TRANSMIT RESPONSE**

The app validates the blanks against the expected business answer.

If incorrect:

> Your query result shows 14 SV units, but your response says 12. Recheck the result table before transmitting.

This teaches:

**business request → query → interpret result → communicate answer**

This pattern should appear throughout the course.

---

# 28. Campaign Structure

The experience should feel like a month-long quest.

Expected learner use:

- a few hours
- a few days per week
- across roughly one month

Do not make this a 45-minute tutorial.

Use multiple missions per campaign.

Suggested structure:

## Campaign 1 — Ground School

Concepts:

- table
- row
- column
- SELECT
- SELECT *
- TOP
- DISTINCT
- basic data exploration

## Campaign 2 — Ramp Qualification

Concepts:

- WHERE
- AND
- OR
- comparison operators
- filtering
- ORDER BY
- IS NULL
- IS NOT NULL

Use open repair orders as the intuitive NULL use case.

## Campaign 3 — Materials Control

Concepts:

- COUNT
- SUM
- AVG
- inventory value
- LLP cycle filtering
- GROUP BY
- rolling/recent demand concepts

Examples:

> Find all PW2000 LLPs with more than 3,000 cycles remaining.

> Calculate the total SV inventory value for CF6 material.

## Campaign 4 — Repair Control

Concepts:

- DATEDIFF
- TAT
- repair history
- scrap rate
- GROUP BY
- HAVING

Examples:

> Which vendors average less than 45 days TAT?

> Which vendors have scrap rates above 20%?

## Campaign 5 — Planning Desk

Concepts:

- sales demand
- date filtering
- recent 3-month average demand
- comparing demand to SV stock
- increasingly natural language questions

## Campaign 6 — Systems Qualification

Concepts:

- primary key
- foreign key
- one-to-many relationships
- relational structure
- aliases

Keep theory light.

Teach it only as needed to understand how data relates.

## Final Check Ride

Primary concept:

**JOIN**

The final mission should pull together the course.

---

# 29. Campaign Mission Difficulty Curve

Within each campaign:

Mission 1:

- highly guided

Mission 2:

- guided

Mission 3:

- moderate support

Mission 4+:

- mostly independent

Final confidence check:

- minimal support unless requested

Learners should be able to move laterally among unlocked missions if they become frustrated.

Do not trap them behind one difficult mission.

Campaign advancement may require core missions while optional practice missions remain available.

---

# 30. Campaign Debrief

Do not show a full debrief after every mission.

Show it at the **end of each campaign**.

Debrief should include:

- missions completed
- time invested
- concepts learned
- successful query examples
- hints used
- attempt trends
- clean solves
- improvement over the campaign
- next qualification preview

End with one ungraded:

**Confidence Check**

This should combine several concepts from the campaign.

---

# 31. Final Check Ride / Capstone

The capstone should begin with a request from a very senior executive.

It should sound daunting.

Example tone:

> **From: EVP, Commercial & Operations**
>
> We’re reviewing the PW2000 product line. I need to understand what serviceable inventory we have on hand, what recent demand looks like, which repair vendors are returning material most efficiently, and where we may have exposure over the next few months. Pull together the data and send me a concise summary.

The learner should initially think:

> “That sounds complicated.”

Then realize they know how to decompose it.

The capstone should use multiple tables and require JOINs.

Likely tables:

```text
PARTS
INVENTORY
SALES
CUSTOMERS
REPAIR_ORDERS
VENDORS
```

Do not immediately tell the learner:

> Use JOIN.

Let them inspect the schema.

The final result should have clearly defined correct outputs, but allow multiple technically correct SQL approaches.

The capstone should end with an executive email template containing several blanks.

Example:

```text
To: EVP, Commercial & Operations

PW2000 currently has [____] units of SV material available,
representing approximately $[____] in inventory value.

Recent average monthly demand is [____] units.

[____] has produced the fastest average repair turnaround at [____] days,
while overall repair scrap rate is [____]%.

Based on current SV stock and recent demand, we have approximately [____]
months of coverage.
```

The learner must populate the actual values from their SQL results.

Completion should trigger:

**SQL FUNDAMENTALS QUALIFICATION COMPLETE**

---

# 32. SQL Concepts Included

Version 1 should teach:

- tables
- rows
- columns
- schema awareness
- primary key concept
- foreign key concept
- one-to-many relationship concept
- SELECT
- TOP
- DISTINCT
- WHERE
- AND
- OR
- comparison operators
- IS NULL
- IS NOT NULL
- ORDER BY
- COUNT
- SUM
- AVG
- GROUP BY
- HAVING
- aliases
- DATEDIFF
- basic date filtering
- JOIN

JOIN should be the capstone concept.

---

# 33. Concepts Explicitly Out of Scope

Do not teach in Version 1:

- CREATE TABLE
- ALTER
- INSERT
- UPDATE
- DELETE
- stored procedures
- database administration
- indexes
- query optimization
- CTEs
- window functions
- complex subqueries
- advanced statistical forecasting

Avoid scope creep.

---

# 34. Schema Explorer

Include a visual database map.

Conceptually:

```text
CUSTOMERS
    |
    | CUSTOMER_ID
    v
SALES
    |
    | PART_NUMBER
    v
PARTS
   / \
  /   \
 v     v
INVENTORY     REPAIR_ORDERS
                  |
                  | VENDOR_ID
                  v
               VENDORS
```

Early missions may highlight the relevant tables or paths.

Later missions should require the learner to explore the schema themselves.

---

# 35. Data Dictionary

Clicking a table in the schema explorer should open a beginner-friendly data dictionary.

Example:

```text
INVENTORY

BATCH_ID
Unique identifier for an inventory batch or asset.

PART_NUMBER
Links this inventory to the PARTS table.

CONDITION
AR, SV, or OH.

QTY_ON_HAND
Number of units physically in stock.

LOCATION
Warehouse where the material is currently held.

UNIT_COST
Acquisition cost per unit.

EXT_COST
Total acquisition cost of the inventory row.
```

Teach field meaning in aviation/business language.

---

# 36. Sample Rows

Allow the learner to preview roughly 10–20 rows from each table.

This should encourage exploration.

The intended behavior is similar to a real analyst workflow:

1. inspect the schema
2. inspect a few rows
3. understand the data
4. write a query

---

# 37. SQL Reference Panel

Include a built-in SQL reference / cheat sheet.

Concepts should unlock progressively.

Upcoming concepts should remain visible but greyed out.

Use a cockpit-style status treatment.

Example:

```text
SELECT       ● ACTIVE
WHERE        ● ACTIVE
ORDER BY     ● ACTIVE
GROUP BY     ○ LOCKED
JOIN         ○ LOCKED
```

This should resemble a subtle avionics “system online / locked” panel.

Do not dump all SQL concepts on the learner from the beginning.

---

# 38. Sandbox Mode

Sandbox mode is required.

It uses the same aviation database but has:

- no grading
- no mission objective
- no penalty
- unrestricted read-only querying

Allow:

**SEND TO SANDBOX**

from a mission.

This should copy the learner’s current query into Sandbox so they can experiment without losing their mission state.

Sandbox should include:

- SQL editor
- results
- schema explorer
- unlocked SQL reference tools
- Tower help if requested

---

# 39. Progress Tracking

Persist progress locally in the browser.

Track as much useful training telemetry as reasonable, including:

- current campaign
- missions completed
- attempts per mission
- hints used
- first-attempt successes
- successful queries
- total queries executed
- concepts mastered
- time spent per mission
- total time invested
- session count
- time to successful answer
- campaign completion
- clean solves
- achievements

Do not use these metrics to punish the learner.

---

# 40. Learner Metrics

Prominent metrics should be encouraging.

Examples:

- Completion %
- Training time invested
- Missions completed
- Concepts online
- Current qualification
- Clean solves
- Current campaign

Diagnostic metrics may be available in a secondary training-data view:

- repeated syntax errors
- attempts
- hint dependence
- average time to solve

Never present these as “bad scores.”

---

# 41. No Negative Scoring

Avoid:

```text
Score: 62%
FAILED
Incorrect
Poor performance
```

Prefer:

```text
MISSION COMPLETE

4 attempts
1 hint
11 minutes invested
```

Tower can say:

> You refined the query until it matched the mission. That is exactly how real analysis works.

Track errors internally, but frame them as part of learning.

---

# 42. Achievements

Use understated aviation-themed milestones.

Examples:

**First Solo**
First mission completed without a hint.

**Clean Run**
Several missions completed without syntax errors.

**Materials Qualified**
Complete Materials Control.

**Repair Control Qualified**
Complete Repair Control.

**Final Check Ride**
Complete the JOIN capstone.

Do not make the achievement system cartoonish.

---

# 43. Return Briefing

When the learner comes back after leaving the app, show a short Tower briefing.

Example:

> Welcome back, PHANTOM.
>
> Last session you completed Materials Control Mission 3 and practiced `GROUP BY`.
>
> You are 68% through the campaign.
>
> Next up: filtering grouped results with `HAVING`.

Keep it concise.

---

# 44. Prototype Scope

Do **not** build the entire month-long curriculum first.

Build a strong vertical slice that proves the concept.

The prototype should include:

1. Onboarding
2. Learner profile
3. Callsign selection: 5 options + reshuffle
4. Home / qualification dashboard
5. One complete campaign
6. Approximately 3–4 real missions
7. Progressive coaching
8. Tower
9. SQL editor
10. Browser-executed queries
11. Live results
12. Query validation
13. Explanation of successful queries
14. Explanation of syntax and logic mistakes
15. Business-response fill-in template
16. Schema explorer
17. Data dictionary
18. Sample table rows
19. SQL reference panel
20. Sandbox mode
21. Local progress persistence
22. Campaign debrief
23. Confidence check
24. Subtle CRT / avionics visual identity

Choose the first campaign such that the full experience can be demonstrated without needing the entire curriculum.

A good initial slice would include:

- `SELECT`
- `TOP`
- `DISTINCT`
- `WHERE`
- maybe `ORDER BY`

If useful, the prototype may include a preview/locked representation of future campaigns.

---

# 45. Architecture Preference

Prefer a **client-side web app** for the prototype.

The ideal initial deployment should be hostable as a static site so a friend can host it on a basic HTTPS web server.

Avoid requiring:

- SQL Server installation
- external database credentials
- proprietary APIs
- cloud infrastructure
- complex backend setup

The database should preferably run in the browser.

However, learner-facing syntax must remain T-SQL style.

If the underlying engine uses SQLite, DuckDB, or another browser-compatible engine, build a limited compatibility/translation layer for the supported T-SQL subset.

Architect the application so a server backend could be added later for:

- accounts
- multiple users
- globally unique callsigns
- cross-device progress
- peer metrics

But do not implement those Phase 2 features now.

---

# 46. Development Priorities

In priority order:

1. The learning experience works
2. SQL execution is reliable
3. Mission validation works
4. Tower coaching is useful
5. The aviation data feels authentic
6. The interface is easy to understand
7. Progress persists
8. The CRT styling feels memorable
9. Animation / polish

Do not sacrifice functionality for decorative effects.

---

# 47. UX Principle

At every stage ask:

> Will this make a technically hesitant learner feel more capable or less capable?

If it makes the app feel intimidating, punitive, cluttered, or overly academic, simplify it.

The learner should feel comfortable exploring.

---

# 48. Important Product Principle

This should not feel like:

> “Here is a SQL textbook converted into a webpage.”

It should feel like:

> “I am using an aviation operations system, and Tower is teaching me how to ask the data questions I already understand from aviation.”

---

# 49. Initial Prototype Deliverables

Please:

1. Create the project structure.
2. Choose an appropriate modern front-end stack.
3. Explain the architecture briefly in the README.
4. Implement the browser SQL approach.
5. Generate a coherent synthetic aviation dataset.
6. Implement the first campaign.
7. Implement the mission engine in a reusable way so new missions can be added from configuration/data rather than hard-coded bespoke pages.
8. Implement Tower feedback rules.
9. Implement learner progress persistence.
10. Implement Sandbox.
11. Implement schema/data exploration.
12. Implement a campaign debrief.
13. Make the app easy to run locally.
14. Make it easy to deploy as a static web site if technically possible.
15. Include clear run/build/deploy instructions.

---

# 50. Design for Expansion

Do not hard-code assumptions that prevent us from later adding:

- more campaigns
- more missions
- more datasets
- multiple learners
- globally unique callsigns
- server-side accounts
- peer metrics
- team/company competitions
- additional SQL courses

Campaigns and missions should ideally be data-driven/configuration-driven.

---

# 51. Before You Start Coding

First:

1. Restate the proposed architecture.
2. Show the proposed file/project structure.
3. Show the proposed database schema.
4. Show the 3–4 missions you intend to build for the prototype.
5. Identify any technical compromises required to support T-SQL in a browser.
6. Flag any requirement that is materially difficult or contradictory.

Do not ask open-ended product questions that have already been answered by this brief.

If a small implementation decision is unspecified, make a sensible developer choice and document it.

Once the plan is coherent, proceed with implementation.

---

## One extra instruction I’d give Codex

After you paste that, I’d add this as your final line:

> **Treat this as a real product prototype, not a coding demonstration. I want to be able to run it, use it as a learner, iterate on it with you, and eventually deploy it to a web server.**

That should put Codex in exactly the right mindset.