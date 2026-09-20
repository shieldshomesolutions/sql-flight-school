import { createDataset } from './data.js';

export const CALLSIGNS = ['PHANTOM','VIPER','ATLAS','MERCURY','RAPTOR','VECTOR','HAWKEYE','FALCON','COMET','TITAN','ORION','KESTREL','NOMAD','MERLIN','APOLLO','OSPREY','NORTHSTAR','CONDOR','STRATUS','PIONEER'];
export const CAMPAIGN = { id:'orientation', title:'Ground School & Ramp Orientation', subtitle:'Read the stock. Ask a question. Send a clear answer.', description:'Four operational requests introduce real SQL using synthetic aviation inventory. No timer, no negative scores. Every query is read-only.', qualification:'Orientation qualified' };
const count = r => r.values.length;
const firstBatch = r => { const i=r.columns.findIndex(c=>c.toUpperCase()==='BATCH_ID'); return r.values[0]?.[i<0?r.values[0].findIndex(v=>/^B\d+$/.test(String(v))):i] ?? ''; };
const firstQty = r => { const i=r.columns.findIndex(c=>c.toUpperCase()==='QTY_ON_HAND'); return r.values[0]?.[i<0?r.values[0].findIndex(v=>typeof v==='number'):i] ?? ''; };
export const MISSIONS = [
  { id:'first-contact', title:'First contact', subtitle:'Your first look at the stock', concepts:['SELECT','TOP','FROM'], table:'INVENTORY', core:true,
    briefing:'From: Maya — Materials Control\nBefore we answer stock questions, inspect a small sample of the inventory register. Each row is one batch or individually tracked asset; each column describes it.',
    objective:'Return ten INVENTORY rows with all columns. Read the first BATCH_ID in your displayed result.',
    starterSql:'SELECT TOP 10 *\nFROM INVENTORY;', solutionSql:'SELECT TOP 10 * FROM INVENTORY;',
    hints:['Start with a small sample, just as you would inspect a stock spreadsheet. The star means every column.','SELECT chooses what to display. TOP 10 limits the sample to ten rows. FROM names the table.','SELECT TOP 10 *\nFROM INVENTORY;'],
    response:{template:'To: Maya — Materials Control\nI inspected {rows} inventory records. The first batch shown is {batch}.',fields:[{id:'rows',label:'Records displayed',answer:count},{id:'batch',label:'First BATCH_ID shown',answer:firstBatch}]},
    explanation:'TOP keeps exploration manageable. A row is a batch or asset, not necessarily one unit. Without ORDER BY, SQL does not promise which ten rows appear or their order. This training dataset repeats predictably, but a real system may not.' },
  { id:'useful-readback', title:'A useful readback', subtitle:'Choose the information the desk needs', concepts:['SELECT','FROM'], table:'INVENTORY', core:true,
    briefing:'From: Maya — Materials Control\nThe stock desk needs a clean register of batch identifiers, part numbers and condition codes. The life and cost fields can wait.',
    objective:'Return BATCH_ID, PART_NUMBER and CONDITION for every inventory record, then report the number of records returned.',
    starterSql:'SELECT BATCH_ID\nFROM INVENTORY;', solutionSql:'SELECT BATCH_ID, PART_NUMBER, CONDITION FROM INVENTORY;',
    hints:['Keep every inventory record, but show only the three requested columns.','Replace the star with column names separated by commas. Leave TOP out when you need every record.','SELECT BATCH_ID, ..., ...\nFROM INVENTORY;'],
    response:{template:'To: Maya — Materials Control\nThe register contains {rows} inventory records, showing batch, part number and condition.',fields:[{id:'rows',label:'Inventory records returned',answer:count}]},
    explanation:'Selecting named columns narrows the information shown without removing inventory rows. A record count is different from total units: some batches contain several pieces.' },
  { id:'condition-report', title:'Condition report', subtitle:'See each condition once', concepts:['SELECT','DISTINCT','FROM'], table:'INVENTORY', core:true,
    briefing:'From: Luis — Repair Control\nBefore preparing a condition summary, confirm which condition codes occur in our on-hand stock. I need each code once, without the full inventory listing.',
    objective:'Return the distinct CONDITION codes from INVENTORY. Read back the three codes in any order.',
    starterSql:'SELECT CONDITION\nFROM INVENTORY;', solutionSql:'SELECT DISTINCT CONDITION FROM INVENTORY;',
    hints:['Many batches share a condition. We want the set of conditions, not a row for every batch.','DISTINCT removes duplicate combinations of the columns you select. Select only CONDITION here.','SELECT DISTINCT ...\nFROM INVENTORY;'],
    response:{template:'To: Luis — Repair Control\nThe on-hand inventory condition codes are {conditions}.',fields:[{id:'conditions',label:'Three condition codes (separate with commas)',answer:r=>r.values.map(v=>v[0]).sort().join(', ')}]},
    explanation:'DISTINCT displays each selected value once. AR means As Removed, SV means Serviceable, and OH means Overhauled. Adding BATCH_ID would make each combination unique and prevent this concise condition list.' },
  { id:'atlanta-desk', title:'Atlanta serviceable desk', subtitle:'Define the stock population', concepts:['SELECT','WHERE','AND','ORDER BY'], table:'INVENTORY', core:true, ordered:true,
    briefing:'From: Erin — Atlanta Stock Desk\nPlease send a batch list for serviceable material physically held in ATL. Include part number and quantity. Put the batch identifiers in ascending order so I can work through the list.',
    objective:'Return BATCH_ID, PART_NUMBER and QTY_ON_HAND for CONDITION SV and LOCATION ATL, ordered by BATCH_ID ascending.',
    starterSql:'SELECT BATCH_ID, PART_NUMBER, QTY_ON_HAND\nFROM INVENTORY;', solutionSql:"SELECT BATCH_ID, PART_NUMBER, QTY_ON_HAND FROM INVENTORY WHERE CONDITION = 'SV' AND LOCATION = 'ATL' ORDER BY BATCH_ID;",
    hints:['Both requirements must hold: serviceable condition and Atlanta location. Then arrange the matching batches.','WHERE filters rows. AND requires both conditions. Put text codes in single quotes. ORDER BY controls the displayed order.','SELECT BATCH_ID, PART_NUMBER, QTY_ON_HAND\nFROM INVENTORY\nWHERE CONDITION = \'...\' AND LOCATION = \'...\'\nORDER BY BATCH_ID;'],
    response:{template:'To: Erin — Atlanta Stock Desk\nThere are {batches} serviceable batches in ATL. The first listed batch contains {units} units.',fields:[{id:'batches',label:'Matching batches (result rows)',answer:count},{id:'units',label:'Units in the first listed batch',answer:firstQty}]},
    explanation:'WHERE identifies the requested population, AND applies both requirements, and ORDER BY makes the readback consistent. The batch count is the number of result rows; QTY_ON_HAND describes units within each batch.' }
];
export const CONFIDENCE_CHECK = { id:'confidence-check', title:'Your next departure', subtitle:'Ungraded confidence check', concepts:['SELECT','WHERE','AND','ORDER BY'], table:'INVENTORY', core:false, ordered:true,
  briefing:'The DFW desk needs overhauled stock. Take your time; this practice does not affect qualification.', objective:'List BATCH_ID, PART_NUMBER and QTY_ON_HAND for OH inventory in DFW, in ascending BATCH_ID order.', starterSql:'SELECT\nFROM INVENTORY;', solutionSql:"SELECT BATCH_ID, PART_NUMBER, QTY_ON_HAND FROM INVENTORY WHERE CONDITION = 'OH' AND LOCATION = 'DFW' ORDER BY BATCH_ID;", hints:['Use the same approach as Atlanta, with a different condition and location.','Filter CONDITION and LOCATION together, then order the batches.','SELECT BATCH_ID, PART_NUMBER, QTY_ON_HAND\nFROM INVENTORY\nWHERE CONDITION = \'OH\' AND LOCATION = \'DFW\'\nORDER BY BATCH_ID;'], explanation:'You transferred the same SQL pattern to a new stock request. That is a practical skill you can reuse.', response:{template:'DFW has {batches} matching batches.',fields:[{id:'batches',label:'Matching batches',answer:count}]} };

export const REFERENCE = [
 {concept:'SELECT / FROM',example:'SELECT BATCH_ID FROM INVENTORY;',description:'Choose columns from a table. A star selects every column.',unlockAfter:null},
 {concept:'TOP',example:'SELECT TOP 10 * FROM INVENTORY;',description:'Preview a limited number of rows. Add ORDER BY when the choice or order matters.',unlockAfter:null},
 {concept:'DISTINCT',example:'SELECT DISTINCT CONDITION FROM INVENTORY;',description:'Show each selected value or combination once.',unlockAfter:'useful-readback'},
 {concept:'WHERE / AND',example:"SELECT * FROM INVENTORY WHERE CONDITION = 'SV' AND LOCATION = 'ATL';",description:'Keep rows that satisfy both conditions. Put text values in single quotes.',unlockAfter:'condition-report'},
 {concept:'ORDER BY',example:'SELECT BATCH_ID FROM INVENTORY ORDER BY BATCH_ID;',description:'Sort the result. Ascending is the default; DESC reverses it.',unlockAfter:'condition-report'},
 {concept:'OR / comparisons',example:"SELECT * FROM INVENTORY WHERE CONDITION = 'SV' OR QTY_ON_HAND > 10;",description:'Combine alternatives or compare values. Coming in Ramp Qualification.',unlockAfter:null,future:true},
 {concept:'IS NULL',example:'SELECT RO_NUMBER FROM REPAIR_ORDERS WHERE DATE_RETURNED IS NULL;',description:'Find missing return dates on open repair orders. Coming in Ramp Qualification.',unlockAfter:null,future:true},
 {concept:'COUNT / SUM / AVG',example:'SELECT SUM(QTY_ON_HAND) FROM INVENTORY;',description:'Summarize records, units and other measures. Coming in Materials Control.',unlockAfter:null,future:true},
 {concept:'GROUP BY / HAVING',example:'SELECT LOCATION, SUM(QTY_ON_HAND) FROM INVENTORY GROUP BY LOCATION;',description:'Produce summaries for groups and filter them. Coming in Materials and Repair Control.',unlockAfter:null,future:true},
 {concept:'DATEDIFF / dates',example:'SELECT RO_NUMBER, DATEDIFF(day, DATE_SENT, DATE_RETURNED) FROM REPAIR_ORDERS;',description:'Explore external repair turnaround. Coming in Repair Control.',unlockAfter:null,future:true},
 {concept:'JOIN',example:'SELECT I.BATCH_ID, P.PRODUCT_LINE FROM INVENTORY AS I JOIN PARTS AS P ON I.PART_NUMBER = P.PART_NUMBER;',description:'Connect inventory to its part information. Reserved for the final Check Ride.',unlockAfter:null,future:true}
];

const key = row => JSON.stringify(row);
const bag = rows => {const b=new Map();for(const r of rows){const k=key(r);b.set(k,(b.get(k)||0)+1);}return b;};
function match(actual, expected, ordered=false, subset=false) {
  if(actual.columns.length!==expected.columns.length)return false;
  if(!subset && actual.values.length!==expected.values.length)return false;
  const n=actual.columns.length, used=new Set(), mapping=[];
  const candidates=actual.columns.map((name,i)=>{
    const named=expected.columns.findIndex(c=>c.toUpperCase()===name.toUpperCase());
    const options=named>=0?[named]:Array.from({length:n},(_,j)=>j);
    return options.filter(j=>{const b=bag(expected.values.map(r=>[r[j]]));for(const r of actual.values){const k=key([r[i]]);if(!b.get(k))return false;b.set(k,b.get(k)-1);}return true;});
  });
  let budget=20000;
  function search(i){
    if(--budget<0)return false;
    if(i===n){const converted=actual.values.map(r=>{const row=Array(n);mapping.forEach((j,k)=>row[j]=r[k]);return row;});if(ordered)return converted.every((r,k)=>key(r)===key(expected.values[k]));const b=bag(expected.values);return converted.every(r=>{const k=key(r),v=b.get(k);if(!v)return false;b.set(k,v-1);return true;});}
    for(const j of candidates[i]){if(used.has(j))continue;mapping[i]=j;used.add(j);if(search(i+1))return true;used.delete(j);}return false;
  }
  return search(0);
}
function codeOnly(sql){return String(sql).replace(/--[^\n]*|\/\*[\s\S]*?\*\//g,' ').replace(/'(?:''|[^'])*'/g,"''").toUpperCase();}
export function validateResult(mission, actual, expected, sql='') {
  const conceptDemonstrated=mission.concepts.every(c=>new RegExp('\\b'+c.replace(/ /g,'\\s+')+'\\b').test(codeOnly(sql)));
  if(!actual?.columns || !actual?.values || !expected?.values)return {correct:false,message:'Run a query to give Tower a result to inspect.',conceptDemonstrated:false};
  let correct=false;
  if(mission.id==='first-contact') {const rows=createDataset().INVENTORY;const columns=Object.keys(rows[0]);correct=actual.values.length===10 && !actual.truncated && match(actual,{columns,values:rows.map(r=>columns.map(c=>r[c]))},false,true);}
  else correct=!actual.truncated && match(actual,expected,Boolean(mission.ordered));
  let message;
  if(correct)message=conceptDemonstrated?'The result answers the request. Read the table and prepare your response.':'The result answers the request. For additional practice, try using '+mission.concepts.join(', ')+'.';
  else if(actual.truncated)message='This result reached the display limit. Narrow the query to the requested records before checking the answer.';
  else if(actual.columns.length!==expected.columns.length)message='Your query ran. Check the requested columns: '+(mission.id==='first-contact'?'show every INVENTORY column with *.':expected.columns.join(', ')+'.');
  else if(mission.id==='condition-report')message='We need each condition code once, with no batch details. Try DISTINCT on CONDITION alone.';
  else if(mission.id==='first-contact')message='Show ten genuine inventory rows with all columns. TOP 10 keeps this first inspection small.';
  else if(mission.ordered && match(actual,expected,false))message='The stock population is right. Arrange BATCH_ID in ascending order for the desk readback.';
  else if(mission.ordered)message='Your query ran, but the stock list does not yet match the request. Check both CONDITION and LOCATION, and use AND to require both.';
  else message='Your query ran. Return all inventory records with BATCH_ID, PART_NUMBER and CONDITION; a TOP limit or WHERE filter may leave records out.';
  return {correct,message,conceptDemonstrated};
}
export function validateResponse(mission,answers,expected){
  for(const field of mission.response.fields){const wanted=field.answer(expected), supplied=String(answers?.[field.id]??'').trim();let valid=false;
    if(typeof wanted==='number')valid=/^\d+(?:\.0+)?$/.test(supplied.replace(/,/g,'')) && Number(supplied.replace(/,/g,''))===wanted;
    else if(field.id==='conditions'){const normalize=v=>String(v).toUpperCase().split(/[\s,;/]+/).filter(Boolean).sort().join(',');valid=normalize(supplied)===normalize(wanted);}
    else valid=supplied.toUpperCase()===String(wanted).trim().toUpperCase();
    if(!valid)return {correct:false,message:'Recheck “'+field.label+'” against your result table. '+(supplied?'Your response says '+supplied+'. ':'')+'Use the displayed records to complete the readback.'};
  }
  return {correct:true,message:'Response transmitted in this training simulation. You turned a stock request into a query and a clear business answer.'};
}
export function explainQuery(sql,result){
  const code=codeOnly(sql), clauses=[];
  const table=code.match(/\bFROM\s+([A-Z_][A-Z_0-9]*)/);
  if(table)clauses.push('You queried '+table[1]+'.');
  if(/\bSELECT\s+(?:TOP\s+\(?\d+\)?\s+)?\*/.test(code))clauses.push('The star requests every column.');
  else clauses.push('SELECT determines the columns or calculated values shown.');
  const top=code.match(/\bTOP\s+\(?(\d+)/);if(top)clauses.push('TOP limits the output to at most '+top[1]+' rows.');
  if(/\bDISTINCT\b/.test(code))clauses.push('DISTINCT removes duplicate selected combinations.');
  if(/\bWHERE\b/.test(code))clauses.push('WHERE keeps rows that satisfy your filter'+(/\bAND\b/.test(code)?'; AND requires both linked conditions':'')+'.');
  if(/\bGROUP\s+BY\b/.test(code))clauses.push('GROUP BY forms groups for summary calculations.');
  if(/\bORDER\s+BY\b/.test(code))clauses.push('ORDER BY arranges the displayed result.');
  else clauses.push('Without ORDER BY, row order is not guaranteed.');
  clauses.push('The displayed result contains '+(result?.values?.length??0)+' row'+(result?.values?.length===1?'':'s')+(result?.truncated?' and was capped for display.':'.'));
  return clauses.join(' ');
}
export function coachError(error,sql=''){
 const message=String(error?.message??error);
 if(/no such column|unknown column/i.test(message))return 'Tower: A column name was not recognized. Check its spelling in the data dictionary. Text values such as \'SV\' need single quotes. Your data is unchanged.';
 if(/no such table|unknown table/i.test(message))return 'Tower: Check the table name after FROM against the schema explorer. Try INVENTORY for these missions.';
 if(/LIMIT/i.test(message))return 'Tower: This course uses T-SQL. Use SELECT TOP 10 ... rather than a LIMIT clause.';
 if(/read.only|not allowed|only.*SELECT|blocked|prohibited/i.test(message))return 'Tower: This is a read-only training environment. Ask for data with SELECT. Stored records cannot be changed here.';
 if(/timeout|time limit|too long/i.test(message))return 'Tower: That query took too long, so it was stopped safely. Start with a small sample from one table and add one change at a time.';
 if(/unsupported|not supported|PERCENT|WITH TIES/i.test(message))return 'Tower: This browser prototype supports a limited T-SQL subset. '+message+' Use the reference examples for supported forms.';
 if(/syntax|incomplete|unrecognized/i.test(message))return 'Tower: Check the query structure: SELECT columns, FROM table, then any WHERE or ORDER BY. Look for a missing comma, quote or table name. If this repeats, open the next mission hint and compare one line at a time.';
 return 'Tower: The query could not run. '+message+' Check the table and column names in the schema explorer; the next hint can help you take it one step at a time.';
}
