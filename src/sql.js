import {SCHEMA,createDataset,DATA_AS_OF} from './data.js';
const TABLES=new Set(SCHEMA.map(t=>t.name));
const FUNCTIONS=new Set(['COUNT','SUM','AVG','MIN','MAX','ROUND','ABS','COALESCE','NULLIF','UPPER','LOWER','LTRIM','RTRIM','TRIM','LENGTH','SUBSTR','SUBSTRING','CAST','DATEDIFF','DATEADD','GETDATE']);
const BLOCKED=new Set(['INSERT','UPDATE','DELETE','DROP','ALTER','CREATE','ATTACH','DETACH','PRAGMA','VACUUM','REPLACE','REINDEX','ANALYZE','INTO','LOAD_EXTENSION','WITH','UNION','INTERSECT','EXCEPT','OVER','WINDOW']);
function tokenize(sql){
 if(typeof sql!=='string'||sql.length>16000)throw Error('Keep your query below 16,000 characters.');
 const tokens=[];let i=0;
 while(i<sql.length){let c=sql[i];if(/\s/.test(c)){i++;continue;}if(sql.startsWith('--',i)){i=sql.indexOf('\n',i);if(i<0)break;continue;}if(sql.startsWith('/*',i)){const end=sql.indexOf('*/',i+2);if(end<0)throw Error('Close the comment with */.');i=end+2;continue;}
 if(c==="'"||c==='"'||c==='['){const end=c==='['?']':c;let s=c;i++;let closed=false;while(i<sql.length){s+=sql[i];if(sql[i++]===end){if(sql[i]===end){s+=sql[i++];}else{closed=true;break;}}}if(!closed)throw Error('Close the quoted text or field name.');tokens.push({v:s,k:c==="'"?'string':'identifier'});continue;}
 const m=sql.slice(i).match(/^(?:[A-Za-z_][A-Za-z_0-9]*|\d+(?:\.\d+)?|<>|!=|<=|>=|[(),;.*+\/%=<>-])/);if(!m)throw Error('This training query contains unsupported syntax. Use a single SELECT statement.');tokens.push({v:m[0],k:/^[A-Za-z_]/.test(m[0])?'word':'symbol'});i+=m[0].length;
 }return tokens;
}
const upper=t=>t?.v.toUpperCase();
export function translateTSQL(sql){
 const t=tokenize(sql);if(t.at(-1)?.v===';')t.pop();
 if(upper(t[0])!=='SELECT'||t.some(x=>x.v===';'))throw Error('Use one read-only SELECT statement at a time. Your training data is safe.');
 if(t.filter(x=>x.k==='word'&&upper(x)==='SELECT').length!==1)throw Error('Subqueries are outside this prototype. Start with one SELECT and use JOIN to explore related tables.');
 let depth=0;
 for(let i=0;i<t.length;i++){
 const x=t[i],u=upper(x);if(x.k==='word'&&BLOCKED.has(u))throw Error('Only read-only SELECT queries are available. Your training data cannot be changed.');
 if(x.k==='word'&&u==='LIMIT')throw Error('Use SELECT TOP 10 rather than LIMIT. Flight School teaches T-SQL syntax.');
 if(x.k==='identifier'&&/^sqlite_/i.test(x.v.slice(1,-1))||x.k==='word'&&/^sqlite_/i.test(x.v))throw Error('Explore the six aviation tables in the schema panel.');
 if(x.v==='(')depth++;if(x.v===')')depth--;if(depth<0)throw Error('Check your opening and closing parentheses.');
 if(x.k==='word'&&(u==='FROM'||u==='JOIN')){const next=t[i+1],name=next?.k==='identifier'?next.v.slice(1,-1).toUpperCase():upper(next);if(!TABLES.has(name)||t[i+2]?.v==='.'||t[i+2]?.v==='(')throw Error('Choose a table from the schema panel: PARTS, INVENTORY, SALES, CUSTOMERS, REPAIR_ORDERS or VENDORS.');}
 if((x.k==='word'||x.k==='identifier')&&t[i+1]?.v==='('&&!FUNCTIONS.has(u)&&!['SELECT','DISTINCT','TOP','IN','NOT','WHERE','AND','OR','ON','HAVING','WHEN','THEN','ELSE','BY'].includes(u))throw Error('That function is outside the supported beginner T-SQL subset.');
 }if(depth!==0)throw Error('Check your opening and closing parentheses.');
 let count=null,idx=upper(t[1])==='DISTINCT'?2:1;
 if(upper(t[idx])==='TOP'){let end=idx+2,number=t[idx+1]?.v;if(number==='('){number=t[idx+2]?.v;if(t[idx+3]?.v!==')')throw Error('Use TOP followed by a whole number, such as TOP 10.');end=idx+4;}if(!/^\d+$/.test(number??'')||Number(number)>1000000)throw Error('Use TOP followed by a whole number between 0 and 1000000.');if(['PERCENT','WITH'].includes(upper(t[end])))throw Error('TOP PERCENT and WITH TIES are not supported. Use TOP followed by a whole number.');count=Number(number);t.splice(idx,end-idx);}
 if(t.some(x=>x.k==='word'&&upper(x)==='TOP'))throw Error('Place TOP immediately after SELECT (or SELECT DISTINCT).');
 for(let i=0;i<t.length;i++)if(t[i].k==='word'&&['DATEDIFF','DATEADD'].includes(upper(t[i]))&&t[i+1]?.v==='('){const part=upper(t[i+2]);if(!['DAY','DD','D','MONTH','MM','M','YEAR','YY','YYYY'].includes(part)||t[i+3]?.v!==',')throw Error('Use day, month or year as the first date-function argument.');t[i+2]={v:"'"+part+"'",k:'string'};}
 return t.map(x=>x.v).join(' ')+(count!==null?' LIMIT '+count:'');
}
function parseDate(value){if(value==null)return null;const d=new Date(String(value).length===10?value+'T00:00:00Z':value);if(Number.isNaN(+d))throw Error('Use a date in YYYY-MM-DD format.');return d;}
function datePart(p){return ['D','DD','DAY'].includes(p)?'day':['M','MM','MONTH'].includes(p)?'month':'year';}
export function createEngine(SQL){
 const db=new SQL.Database(),data=createDataset();
 for(const table of SCHEMA){db.run(`CREATE TABLE ${table.name} (${table.columns.map(c=>c.name+' '+c.type+(c.name===table.primaryKey?' PRIMARY KEY':'')).join(',')})`);const insert=db.prepare(`INSERT INTO ${table.name} VALUES (${table.columns.map(()=>'?').join(',')})`);try{for(const row of data[table.name])insert.run(table.columns.map(c=>row[c.name]));}finally{insert.free();}}
 db.create_function('GETDATE',()=>DATA_AS_OF);
 db.create_function('DATEDIFF',(part,start,end)=>{const a=parseDate(start),b=parseDate(end);if(!a||!b)return null;const p=datePart(part);return p==='year'?b.getUTCFullYear()-a.getUTCFullYear():p==='month'?(b.getUTCFullYear()-a.getUTCFullYear())*12+b.getUTCMonth()-a.getUTCMonth():Math.floor(+b/86400000)-Math.floor(+a/86400000);});
 db.create_function('DATEADD',(part,amount,start)=>{const d=parseDate(start);if(!d||amount==null)return null;const n=Math.trunc(Number(amount));if(!Number.isFinite(n)||Math.abs(n)>100000)throw Error('Use a reasonable whole-number date interval.');const p=datePart(part);if(p==='day')d.setUTCDate(d.getUTCDate()+n);else{const day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+(p==='year'?n*12:n));const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,last));}return d.toISOString().slice(0,10);});
 db.run('PRAGMA query_only = ON');
 return {run(sql){const translated=translateTSQL(sql);let statement;try{statement=db.prepare(translated);const columns=statement.getColumnNames(),values=[];let truncated=false;while(statement.step()){if(values.length===2000){truncated=true;break;}values.push(statement.get());}return {columns,values,rowCount:values.length,truncated};}finally{statement?.free();}},close(){db.close();}};
}
