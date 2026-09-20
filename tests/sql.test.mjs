import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createDataset,SCHEMA,DATA_AS_OF} from '../src/data.js';
import {createEngine,translateTSQL} from '../src/sql.js';
const require=createRequire(import.meta.url);
const init=require('../vendor/sql-wasm.js');
const SQL=await init({locateFile:f=>fileURLToPath(new URL('../vendor/'+f,import.meta.url))});
const engine=createEngine(SQL);
test.after(()=>engine.close());
test('deterministic full-size coherent aviation data',()=>{
 const d=createDataset();assert.deepEqual(d,createDataset());assert.equal(d.PARTS.length,196);assert.equal(d.INVENTORY.length,420);assert.equal(d.SALES.length,1600);assert.equal(d.REPAIR_ORDERS.length,700);
 for(const t of SCHEMA){assert.equal(new Set(d[t.name].map(r=>r[t.primaryKey])).size,d[t.name].length);for(const r of d[t.name])for(const c of t.columns){assert.ok(c.name in r);if(c.references&&r[c.name]!=null){const [target,key]=c.references.split('.');assert.ok(d[target].some(x=>x[key]===r[c.name]));}}}
 for(const b of d.INVENTORY){assert.equal(b.EXT_COST,b.UNIT_COST*b.QTY_ON_HAND);const p=d.PARTS.find(p=>p.PART_NUMBER===b.PART_NUMBER);if(p.PRODUCT_TYPE==='LLP'){assert.equal(b.QTY_ON_HAND,1);assert.equal(b.CYCLES_REMAINING,b.LIFE_LIMIT_CYCLES-b.CYCLES_SINCE_NEW);}if(b.SOURCE_RO_ID){const r=d.REPAIR_ORDERS.find(r=>r.RO_NUMBER===b.SOURCE_RO_ID);assert.equal(r.PART_NUMBER,b.PART_NUMBER);assert.ok(r.DATE_RETURNED);assert.ok(r.QTY_SV>=b.QTY_ON_HAND);}}
 for(const r of d.REPAIR_ORDERS)if(r.DATE_RETURNED){assert.equal(r.QTY_SENT,r.QTY_SV+r.QTY_SCRAP);assert.ok(r.DATE_RETURNED>=r.DATE_SENT&&r.DATE_RETURNED<=DATA_AS_OF);}else{assert.equal(r.QTY_SV,null);assert.equal(r.REPAIR_COST,null);}
});
test('TOP, DISTINCT, aliases, bracket names, empty metadata and full inventory',()=>{
 assert.equal(engine.run('SELECT TOP (10) * FROM [INVENTORY];').rowCount,10);
 assert.equal(engine.run('SELECT DISTINCT TOP 3 CONDITION FROM INVENTORY').rowCount,3);
 assert.equal(engine.run('SELECT BATCH_ID AS Batch FROM INVENTORY').rowCount,420);
 assert.deepEqual(engine.run("SELECT BATCH_ID AS Batch FROM INVENTORY WHERE CONDITION = 'ZZ'").columns,['Batch']);
 assert.equal(engine.run('SELECT TOP 0 * FROM INVENTORY').rowCount,0);
 assert.equal(engine.run("SELECT * FROM INVENTORY WHERE (CONDITION='SV' OR CONDITION='OH') AND LOCATION='ATL'").rowCount,70);
});
test('lexical safeguards ignore comments and string contents without altering them',()=>{
 assert.deepEqual(engine.run("-- DELETE is a comment\n SELECT 'DROP; TOP 3 LIMIT' AS note /* UPDATE */;").values,[['DROP; TOP 3 LIMIT']]);
 assert.deepEqual(engine.run("SELECT 'Pilot''s TOP 10' AS note").values,[["Pilot's TOP 10"]]);
 for(const q of ['DELETE FROM INVENTORY','SELECT * FROM INVENTORY; DELETE FROM INVENTORY','SELECT * INTO X FROM INVENTORY','SELECT * FROM sqlite_master','SELECT * FROM "sqlite_master"','SELECT * FROM pragma_table_info(\'INVENTORY\')',"SELECT load_extension('x')",'SELECT * FROM INVENTORY LIMIT 10','WITH x AS (SELECT 1) SELECT * FROM x','SELECT TOP 5 PERCENT * FROM INVENTORY'])assert.throws(()=>engine.run(q),q);
 assert.equal(engine.run('SELECT COUNT(*) FROM INVENTORY').values[0][0],420);
});
test('JOINs, grouped aggregates, HAVING and null filtering execute real SQL',()=>{
 const rows=engine.run('SELECT p.PRODUCT_LINE, SUM(i.QTY_ON_HAND) AS UNITS FROM INVENTORY i JOIN PARTS p ON i.PART_NUMBER=p.PART_NUMBER GROUP BY p.PRODUCT_LINE HAVING SUM(i.QTY_ON_HAND)>0 ORDER BY p.PRODUCT_LINE');assert.equal(rows.rowCount,7);
 const open=engine.run('SELECT COUNT(*) FROM REPAIR_ORDERS WHERE DATE_RETURNED IS NULL').values[0][0];assert.ok(open>0&&open<700);
 assert.equal(engine.run('SELECT COUNT(*) FROM SALES').values[0][0],1600);
});
test('T-SQL dates have boundary counting, null propagation and month-end clamping',()=>{
 assert.deepEqual(engine.run("SELECT GETDATE(), DATEDIFF(day,'2026-01-01','2026-01-04'), DATEDIFF(month,'2026-01-31','2026-02-01'), DATEADD(month,1,'2026-01-31'), DATEADD(year,1,'2024-02-29'), DATEDIFF(day,NULL,GETDATE())").values,[[DATA_AS_OF,3,1,'2026-02-28','2025-02-28',null]]);
 assert.ok(engine.run('SELECT AVG(DATEDIFF(day, DATE_SENT, DATE_RETURNED)) FROM REPAIR_ORDERS').values[0][0]>0);
 assert.ok(engine.run('SELECT * FROM SALES WHERE SALE_DATE >= DATEADD(month,-3,GETDATE())').rowCount>0);
});
test('oversized results are bounded and flagged',()=>{
 const r=engine.run('SELECT i.BATCH_ID, p.PART_NUMBER FROM INVENTORY i CROSS JOIN PARTS p');assert.equal(r.rowCount,2000);assert.equal(r.truncated,true);
 assert.throws(()=>translateTSQL('SELECT /* unfinished'));
});
