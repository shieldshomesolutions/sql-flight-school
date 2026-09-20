import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createEngine} from '../src/sql.js';
import {createDataset} from '../src/data.js';
import {MISSIONS,CONFIDENCE_CHECK,validateResult,validateResponse,explainQuery,coachError} from '../src/curriculum.js';
const inventory=createDataset().INVENTORY;
const result=(rows,columns)=>({columns,values:rows.map(r=>columns.map(c=>r[c])),rowCount:rows.length,truncated:false});
const expected=[result(inventory.slice(0,10),Object.keys(inventory[0])),result(inventory,['BATCH_ID','PART_NUMBER','CONDITION']),{columns:['CONDITION'],values:[['AR'],['SV'],['OH']]},result(inventory.filter(r=>r.CONDITION==='SV'&&r.LOCATION==='ATL'),['BATCH_ID','PART_NUMBER','QTY_ON_HAND'])];
test('all mission solution results pass and concepts require actual query evidence',()=>{
 MISSIONS.forEach((m,i)=>{assert.equal(validateResult(m,expected[i],expected[i],m.solutionSql).correct,true);assert.equal(validateResult(m,expected[i],expected[i],m.solutionSql).conceptDemonstrated,true);assert.equal(validateResult(m,expected[i],expected[i]).conceptDemonstrated,false);});
});
test('first exploration accepts any real ten rows and rejects invented or duplicated stock',()=>{
 const m=MISSIONS[0],alt=result(inventory.slice(100,110),Object.keys(inventory[0]));
 assert.equal(validateResult(m,alt,expected[0]).correct,true);
 const bogus=structuredClone(alt);bogus.values[0][0]='B999999';assert.equal(validateResult(m,bogus,expected[0]).correct,false);
 const duplicated=structuredClone(alt);duplicated.values[1]=duplicated.values[0];assert.equal(validateResult(m,duplicated,expected[0]).correct,false);
 const altered=structuredClone(alt);altered.values[0][5]+=1;assert.equal(validateResult(m,altered,expected[0]).correct,false);
});
test('equivalent aliases and column order pass while differing combinations fail',()=>{
 const e=expected[1],alias={...e,columns:['stockCondition','batch','part'],values:e.values.map(r=>[r[2],r[0],r[1]]).reverse()};
 assert.equal(validateResult(MISSIONS[1],alias,e).correct,true);
 const swapped=structuredClone(e);[swapped.values[0][1],swapped.values[1][1]]=[swapped.values[1][1],swapped.values[0][1]];
 assert.equal(validateResult(MISSIONS[1],swapped,e).correct,false);
});
test('distinct ignores order but preserves multiplicity',()=>{
 const e=expected[2];assert.equal(validateResult(MISSIONS[2],{...e,values:[...e.values].reverse()},e).correct,true);
 assert.equal(validateResult(MISSIONS[2],{...e,values:[...e.values,['AR']]},e).correct,false);
});
test('ordered population requires both correct rows and correct order',()=>{
 const e=expected[3];assert.equal(validateResult(MISSIONS[3],{...e,values:[...e.values].reverse()},e).correct,false);
 const wrong=result(inventory.filter(r=>r.CONDITION==='OH'&&r.LOCATION==='ATL'),e.columns);assert.equal(validateResult(MISSIONS[3],wrong,e).correct,false);
 assert.equal(validateResult(MISSIONS[3],{...e,truncated:true},e).correct,false);
});
test('readback accepts case and condition order, rejects blank or wrong business values',()=>{
 assert.equal(validateResponse(MISSIONS[0],{rows:'10',batch:'b000001'},expected[0]).correct,true);
 assert.equal(validateResponse(MISSIONS[0],{rows:'',batch:'B000001'},expected[0]).correct,false);
 assert.equal(validateResponse(MISSIONS[2],{conditions:'oh, ar, sv'},expected[2]).correct,true);
 assert.equal(validateResponse(MISSIONS[2],{conditions:'oh, ar, ar, sv'},expected[2]).correct,false);
 assert.equal(validateResponse(MISSIONS[3],{batches:String(expected[3].values.length),units:'9999'},expected[3]).correct,false);
});
test('first readback uses the actual accepted exploration and supports alias order',()=>{
 const actual=result(inventory.slice(100,110),Object.keys(inventory[0]));
 assert.equal(validateResponse(MISSIONS[0],{rows:'10',batch:inventory[100].BATCH_ID},actual).correct,true);
 const e=expected[3],alias={...e,columns:['units','part','batch'],values:e.values.map(r=>[r[2],r[1],r[0]])};
 assert.equal(validateResponse(MISSIONS[3],{batches:String(e.values.length),units:String(e.values[0][2])},alias).correct,true);
});
test('explanation describes the actual query without declaring mission success',()=>{
 const explanation=explainQuery('SELECT * FROM PARTS;', {values:[],columns:[]});
 assert.match(explanation,/PARTS/);assert.doesNotMatch(explanation,/INVENTORY|mission|WHERE/);assert.match(explanation,/0 rows/);
 assert.doesNotMatch(explainQuery("SELECT 'WHERE DISTINCT' FROM PARTS;",{values:[[1]]}),/WHERE keeps|DISTINCT removes/);
});
test('coach offers concrete repair guidance and confidence check is ungraded',()=>{
 assert.match(coachError(new Error('no such column: SV')),/single quotes/);
 assert.match(coachError(new Error('near FROM: syntax error')),/missing comma/);
 assert.equal(CONFIDENCE_CHECK.core,false);
 for(const mission of [...MISSIONS,CONFIDENCE_CHECK])for(const field of mission.response.fields)assert.ok(mission.response.template.includes('{'+field.id+'}'));
});

test('real SQL engine accepts equivalent queries and rejects subtly wrong populations',async()=>{
 const require=createRequire(import.meta.url);
 const init=require('../vendor/sql-wasm.js');
 const SQL=await init({locateFile:f=>fileURLToPath(new URL('../vendor/'+f,import.meta.url))});
 const engine=createEngine(SQL);
 try{
  const solutions=MISSIONS.map(m=>engine.run(m.solutionSql));
  const alternatives=[
   'SELECT TOP (10) * FROM INVENTORY ORDER BY BATCH_ID DESC;',
   'SELECT CONDITION AS Code, PART_NUMBER AS Part, BATCH_ID AS Batch FROM INVENTORY ORDER BY BATCH_ID DESC;',
   'SELECT CONDITION AS Code FROM INVENTORY GROUP BY CONDITION ORDER BY CONDITION DESC;',
   "SELECT QTY_ON_HAND AS Units, BATCH_ID AS Batch, PART_NUMBER AS Part FROM INVENTORY WHERE LOCATION='ATL' AND CONDITION IN ('SV') ORDER BY BATCH_ID ASC;"
  ];
  MISSIONS.forEach((m,i)=>{
   const actual=engine.run(alternatives[i]);assert.equal(validateResult(m,actual,solutions[i],alternatives[i]).correct,true,m.id);
   const answers=Object.fromEntries(m.response.fields.map(f=>[f.id,String(f.answer(actual))]));
   assert.equal(validateResponse(m,answers,actual).correct,true,m.id+' readback');
  });
  assert.equal(validateResult(MISSIONS[2],engine.run(alternatives[2]),solutions[2],alternatives[2]).conceptDemonstrated,false);
  const wrongQueries=[
   'SELECT TOP 10 * FROM INVENTORY CROSS JOIN CUSTOMERS;',
   'SELECT TOP 400 BATCH_ID,PART_NUMBER,CONDITION FROM INVENTORY;',
   'SELECT CONDITION FROM INVENTORY;',
   "SELECT BATCH_ID,PART_NUMBER,QTY_ON_HAND FROM INVENTORY WHERE CONDITION='SV' OR LOCATION='ATL' ORDER BY BATCH_ID;"
  ];
  MISSIONS.forEach((m,i)=>assert.equal(validateResult(m,engine.run(wrongQueries[i]),solutions[i],wrongQueries[i]).correct,false,m.id));
  const confidence=engine.run(CONFIDENCE_CHECK.solutionSql);assert.ok(confidence.rowCount>0);assert.equal(validateResult(CONFIDENCE_CHECK,confidence,confidence,CONFIDENCE_CHECK.solutionSql).correct,true);
 }finally{engine.close();}
});
