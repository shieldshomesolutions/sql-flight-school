import test from 'node:test';
import assert from 'node:assert/strict';
import {escapeHtml,renderResults,renderReference,renderSchema} from '../src/ui.js';
import {REFERENCE} from '../src/curriculum.js';
import {SCHEMA} from '../src/data.js';
test('table and dictionary views escape data and distinguish NULL from empty text',()=>{
 const html=renderResults({columns:['<script>'],values:[[null],['<img src=x onerror=alert(1)>']],rowCount:2,truncated:false});
 assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('&lt;img'));assert.ok(html.includes('null-value'));assert.ok(!html.includes('<img'));
 assert.equal(escapeHtml('" & <'), '&quot; &amp; &lt;');
 const schema=renderSchema(SCHEMA,'INVENTORY');assert.ok(schema.includes('SOURCE_RO_ID'));assert.ok(schema.includes('REPAIR_ORDERS.RO_NUMBER'));
});
test('active lateral mission has its reference tools while future concepts remain locked',()=>{
 const initial=renderReference(REFERENCE,[]);
 const lateral=renderReference(REFERENCE,[],['WHERE','AND','ORDER BY']);
 assert.ok(!initial.includes('ORDER BY BATCH_ID;'));
 assert.ok(lateral.includes('ORDER BY BATCH_ID;'));
 assert.ok(lateral.includes('WHERE CONDITION'));
 assert.ok(!lateral.includes('JOIN PARTS'));
});
