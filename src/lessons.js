// Short instruction before application. Every example uses the training schema.
export const LESSONS = {
  'first-contact': {
    title: 'Read your first inventory query',
    intro: 'You already know what a stock register tells you. SQL gives you a way to ask that register for the information you need. Start by reading a small sample.',
    outcomes: ['Recognize tables, rows and columns.', 'Read SELECT, FROM and the star.', 'Use TOP to keep an inspection manageable.'],
    steps: [
      {
        concept: 'TABLE / ROW / COLUMN', title: 'Start with the stock register',
        body: 'A table is a collection of related records, much like a spreadsheet with named columns. INVENTORY is the on-hand stock register. Each row is one batch or individually tracked asset. Columns describe it: BATCH_ID identifies the record, CONDITION gives its condition, and QTY_ON_HAND gives its units.',
        sql: 'SELECT TOP 5 BATCH_ID, CONDITION, QTY_ON_HAND\nFROM INVENTORY;',
        readback: ['This example previews five stock records.', 'A batch with QTY_ON_HAND of 24 is one row containing 24 units.'],
        takeaway: 'Rows count records; quantities count units. They answer different business questions.'
      },
      {
        concept: 'SELECT / * / FROM', title: 'Say what you want and where to find it',
        body: 'SELECT names the information to display. A star (*) means every column. FROM names the table to read. Reading a table does not change the stock records.',
        sql: 'SELECT *\nFROM INVENTORY;',
        readback: ['SELECT * means “show every column.”', 'FROM INVENTORY means “read the inventory table.”', 'With no row limit or filter, this asks for every inventory record.'],
        takeaway: 'Read the query as a sentence: show every column from inventory.'
      },
      {
        concept: 'TOP', title: 'Inspect a small sample first',
        body: 'Place TOP and a number after SELECT to limit how many rows you receive. This is useful when exploring an unfamiliar table. TOP 5 asks for at most five records. Without ORDER BY, it does not promise which five or their order.',
        sql: 'SELECT TOP 5 *\nFROM INVENTORY;',
        readback: ['SELECT chooses the output.', 'TOP 5 limits the sample to five rows.', '* keeps every column, and FROM INVENTORY chooses the table.'],
        takeaway: 'TOP limits rows. The star selects columns. You will control row order in a later lesson.'
      }
    ],
    check: {
      question: 'What does SELECT TOP 5 * FROM INVENTORY ask for?',
      options: ['Up to five inventory records, with every column.', 'Five inventory columns, with every record.', 'Exactly five physical units of material.'],
      answerIndex: 0,
      explanation: 'TOP 5 limits the number of records. The star requests every column. A record may contain more than one physical unit.'
    },
    apply: 'Now inspect ten inventory records for Materials Control. Run the provided query, then use the displayed rows to prepare a short readback.'
  },
  'useful-readback': {
    title: 'Choose the columns the desk needs',
    intro: 'A useful stock report contains the information its reader needs. You can choose a few columns without removing any inventory records.',
    outcomes: ['Replace the star with named columns.', 'Separate column names with commas.', 'Distinguish choosing columns from limiting rows.'],
    steps: [
      {
        concept: 'NAMED COLUMNS', title: 'Choose the fields for your report',
        body: 'Instead of asking for every column with *, list the column names after SELECT. For example, a warehouse review might need only the batch identifier and its location.',
        sql: 'SELECT BATCH_ID, LOCATION\nFROM INVENTORY;',
        readback: ['BATCH_ID and LOCATION are the two output columns.', 'The comma separates their names.', 'The output columns appear in the order you list them.'],
        takeaway: 'Choosing columns changes the width of the report. It does not, by itself, remove records.'
      },
      {
        concept: 'COMMAS', title: 'Add one more useful field',
        body: 'Add another comma and column name when the reader needs another field. Place commas between names; do not put a trailing comma before FROM.',
        sql: 'SELECT BATCH_ID, LOCATION, QTY_ON_HAND\nFROM INVENTORY;',
        readback: ['Each row now shows a batch, its warehouse and its quantity.', 'The same inventory records remain in the result.'],
        takeaway: 'Three named columns need two separating commas.'
      },
      {
        concept: 'ALL ROWS', title: 'Move from a sample to the full register',
        body: 'TOP is useful for a preview. Remove TOP and its number when the request needs every record. Selecting fewer columns does not require keeping a row limit.',
        sql: '-- A small preview\nSELECT TOP 5 BATCH_ID, LOCATION\nFROM INVENTORY;',
        readback: ['This preview includes at most five records.', 'For every inventory record, use SELECT BATCH_ID, LOCATION FROM INVENTORY; without TOP 5.', 'Run one SELECT statement at a time in the training editor.'],
        takeaway: 'Column names control what you see about each record; TOP controls how many records you see.'
      }
    ],
    check: {
      question: 'You need every inventory record, showing only BATCH_ID and LOCATION. Which query fits?',
      options: ['SELECT TOP 5 BATCH_ID, LOCATION FROM INVENTORY;', 'SELECT BATCH_ID, LOCATION FROM INVENTORY;', 'SELECT * FROM INVENTORY;'],
      answerIndex: 1,
      explanation: 'The second query chooses the two requested columns and leaves out TOP, so it returns every record. The first is only a sample; the third includes unrequested columns.'
    },
    apply: 'Materials Control needs a complete register of batch, part number and condition. Choose those three columns, then report the number of records returned.'
  },
  'condition-report': {
    title: 'Show each value once',
    intro: 'Sometimes the business question is which values occur, rather than which individual batches are present. DISTINCT turns a repeated list into a concise set of values.',
    outcomes: ['Use DISTINCT to remove repeated output values.', 'Understand that DISTINCT considers all selected columns together.', 'Keep a unique-value list separate from a stock quantity report.'],
    steps: [
      {
        concept: 'REPEATED VALUES', title: 'Recognize a list with repetition',
        body: 'Many inventory batches are held in the same warehouse. Selecting LOCATION alone still returns one row for each inventory record, so warehouse codes repeat.',
        sql: 'SELECT LOCATION\nFROM INVENTORY;',
        readback: ['Each row contributes its location.', 'Repeated warehouse codes do not mean duplicate stock records; different batches share a location.'],
        takeaway: 'Selecting a column alone does not remove its repeated values.'
      },
      {
        concept: 'DISTINCT', title: 'Ask which warehouses occur',
        body: 'Place DISTINCT after SELECT to show each selected value once. This answers “Which warehouses appear in our on-hand stock?” It does not tell you how many units each warehouse holds.',
        sql: 'SELECT DISTINCT LOCATION\nFROM INVENTORY;',
        readback: ['Each warehouse code appears once.', 'The number of result rows is the number of different warehouse codes.'],
        takeaway: 'DISTINCT removes repetition from the selected output.'
      },
      {
        concept: 'DISTINCT COMBINATIONS', title: 'Notice what happens with two columns',
        body: 'When you select two columns, DISTINCT keeps each different combination once. A location can appear several times if it has more than one condition. Adding a unique BATCH_ID would make each batch a different combination.',
        sql: 'SELECT DISTINCT LOCATION, CONDITION\nFROM INVENTORY;',
        readback: ['The result lists different warehouse-and-condition pairs.', 'This is a different question from listing warehouse codes alone.'],
        takeaway: 'To list each value of one field once, select only that field with DISTINCT.'
      }
    ],
    check: {
      question: 'Why might LOCATION repeat in SELECT DISTINCT LOCATION, CONDITION FROM INVENTORY?',
      options: ['DISTINCT only works on numeric columns.', 'The table has been changed by the query.', 'DISTINCT keeps unique location-and-condition combinations, so one location can have several conditions.'],
      answerIndex: 2,
      explanation: 'DISTINCT considers the complete selected combination. ATL with AR and ATL with SV are different combinations, even though their location is the same.'
    },
    apply: 'Repair Control needs the condition codes present in inventory, each shown once. Select the one relevant field and use DISTINCT, then read back the codes.'
  },
  'atlanta-desk': {
    title: 'Filter stock and put it in order',
    intro: 'A stock request usually describes a specific population: a condition, a warehouse, or both. Build that population one condition at a time, then arrange it for a clear readback.',
    outcomes: ['Use WHERE to keep matching rows.', 'Write text values in single quotes.', 'Use AND when both requirements must hold.', 'Use ORDER BY to control ascending or descending order.'],
    steps: [
      {
        concept: 'WHERE', title: 'Keep one condition of stock',
        body: 'WHERE follows FROM and describes which records to keep. The equals sign compares a column value with the value you request. Here, only overhauled inventory qualifies.',
        sql: "SELECT BATCH_ID, PART_NUMBER, QTY_ON_HAND\nFROM INVENTORY\nWHERE CONDITION = 'OH';",
        readback: ['SELECT chooses the three columns to display.', "WHERE CONDITION = 'OH' keeps only overhauled records.", 'CONDITION can be used to filter even when it is not an output column.'],
        takeaway: 'WHERE narrows the rows. SELECT chooses the columns you show about those rows.'
      },
      {
        concept: 'TEXT VALUES / SINGLE QUOTES', title: 'Tell SQL that a code is text',
        body: 'CONDITION and LOCATION are column names. OH and MIA are text values stored in those columns. Put text values in single quotes so SQL can distinguish them from field names.',
        sql: "SELECT BATCH_ID, LOCATION\nFROM INVENTORY\nWHERE LOCATION = 'MIA';",
        readback: ['LOCATION names the field being checked.', "'MIA' is the warehouse code to match.", 'The single quotes belong around the value, not around the column name.'],
        takeaway: "For this pattern, write LOCATION = 'MIA', with single quotes around MIA."
      },
      {
        concept: 'AND', title: 'Require both conditions',
        body: 'Connect two requirements with AND when a row must satisfy both. This example keeps overhauled material only when it is also in MIA.',
        sql: "SELECT BATCH_ID, PART_NUMBER, QTY_ON_HAND\nFROM INVENTORY\nWHERE CONDITION = 'OH' AND LOCATION = 'MIA';",
        readback: ['An OH batch in another warehouse is excluded.', 'A MIA batch in AR or SV condition is excluded.', 'Only records satisfying both requirements remain.'],
        takeaway: 'AND describes the intersection of the two requirements.'
      },
      {
        concept: 'ORDER BY / ASC', title: 'Give the desk a predictable order',
        body: 'Add ORDER BY after the filter to arrange the result. ASC means ascending order. It is also the default when you leave the direction out. Sorting changes the order of matching records, not which records match.',
        sql: "SELECT BATCH_ID, PART_NUMBER, QTY_ON_HAND\nFROM INVENTORY\nWHERE CONDITION = 'OH' AND LOCATION = 'MIA'\nORDER BY BATCH_ID ASC;",
        readback: ['First choose the displayed columns and source table.', 'Then specify the rows to keep with WHERE.', 'Finish with ORDER BY to arrange those rows by batch identifier.'],
        takeaway: 'Write the clauses in this order: SELECT, FROM, WHERE, ORDER BY.'
      },
      {
        concept: 'DESC', title: 'Reverse the order when the request calls for it',
        body: 'DESC means descending order. This example reverses the batch identifier order while keeping the same columns and stock population. For your mission, the desk will request ascending order.',
        sql: "SELECT BATCH_ID, PART_NUMBER, QTY_ON_HAND\nFROM INVENTORY\nWHERE CONDITION = 'OH' AND LOCATION = 'MIA'\nORDER BY BATCH_ID DESC;",
        readback: ['The matching batches are unchanged.', 'Their displayed order is reversed.', 'The quantity in the first row may therefore differ from an ascending readback.'],
        takeaway: 'Read business answers from the requested result order, especially when asked about the first record.'
      }
    ],
    check: {
      question: "Which rows satisfy WHERE CONDITION = 'OH' AND LOCATION = 'MIA'?",
      options: ['All OH batches, plus every batch in MIA.', 'Only batches that are both OH and located in MIA.', 'Only the first OH batch in MIA.'],
      answerIndex: 1,
      explanation: 'AND requires both conditions for each row. It does not add other MIA stock or impose a one-row limit. ORDER BY, if added, controls the order of the matching records.'
    },
    apply: 'Now adapt this pattern for serviceable material in ATL. Return the requested columns, order batches ascending, and read the batch count and first batch quantity from your result.'
  }
};
