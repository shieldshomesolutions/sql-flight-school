import {LESSONS} from './lessons.js';
import {renderLesson} from './lesson-view.js';
import {SCHEMA,DATA_AS_OF,DATA_VERSION} from './data.js';
import {CAMPAIGN,MISSIONS,CONFIDENCE_CHECK,REFERENCE,CALLSIGNS,validateResult,validateResponse,explainQuery,coachError} from './curriculum.js';
import {escapeHtml as esc,renderResults,renderSchema,renderReference} from './ui.js';
import {QueryRunner} from './sql-client.js';
import {newProgress,missionProgress,completedIds,completeMission,loadProgress,saveProgress,formatTime} from './progress.js';

const root=document.querySelector('#app');
const modalRoot=document.querySelector('#modal-root');
const runner=new QueryRunner();
let storage;
try{storage=window.localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw Error('unavailable')}};}
const restored=loadProgress(storage);
let progress=restored.progress;
let page='dashboard',activeId=MISSIONS[0].id,modal=null,modalTable='INVENTORY',modalReturnFocus=null;
let selectedCallsign='',callsignChoices=[],onboardingName='',busy=false,storageWarning=false;
let result=null,feedback=null,explanation=null,validatedSql=null,responseFeedback=null,executedSql=null,queryRevision=0;
let toastTimer,saveTimer,modalRevision=0,activityAt=Date.now(),tickAt=Date.now();
const expectedCache=new Map();
const lessonAnswers={};
let confidenceSql=CONFIDENCE_CHECK.starterSql || '',confidenceResult=null,confidenceFeedback=null;
let welcomeBack=Boolean(progress);
const plane=`<svg viewBox="0 0 32 32" aria-hidden="true" fill="currentColor"><path d="M16 3l3 10 10 6v3l-11-3v7l4 3v2l-6-2-6 2v-2l4-3v-7L3 22v-3l10-6z"/></svg>`;
const mission=()=>MISSIONS.find(m=>m.id===activeId)||MISSIONS[0];
const mp=()=>missionProgress(progress,activeId);
const done=()=>completedIds(progress).filter(id=>MISSIONS.some(m=>m.id===id));
const pct=()=>Math.round(done().length/MISSIONS.length*100);
const nl=value=>esc(value??'').replace(/\n/g,'<br>');

function save(){if(!progress)return;progress.lastVisit=new Date().toISOString();if(!saveProgress(storage,progress)&&!storageWarning){storageWarning=true;notify('Browser storage is unavailable. Keep this page open; progress cannot survive a reload.');}}
function notify(text){const el=document.querySelector('#notification');el.textContent=text;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,6500);}
function shuffleCallsigns(){callsignChoices=[...CALLSIGNS].sort(()=>Math.random()-.5).slice(0,5);selectedCallsign='';}
function button(label,action,classes='secondary',extra=''){return `<button class="button ${classes}" data-action="${action}" ${extra}>${label}</button>`;}
function status(text){return `<span class="status-pill">${esc(text)}</span>`;}
function metric(value,label){return `<article class="metric-card"><strong>${esc(value)}</strong><span>${esc(label)}</span></article>`;}
function countConcepts(){return new Set(MISSIONS.filter(m=>done().includes(m.id)).flatMap(m=>m.concepts)).size;}
function currentSql(){return page==='sandbox'?progress.sandboxSql:page==='confidence'?confidenceSql:(mp().draft??mission().starterSql);}
function setSql(sql){if(page==='sandbox')progress.sandboxSql=sql;else if(page==='confidence')confidenceSql=sql;else{mp().draft=sql;mp().queryCorrect=false;}queryRevision++;validatedSql=null;responseFeedback=null;feedback=null;explanation=null;confidenceFeedback=null;clearTimeout(saveTimer);saveTimer=setTimeout(save,350);}
function revealCoaching(selector='.tower-card'){
 const panel=document.querySelector('.mission-panel'),notice=panel?.querySelector(selector);
 if(panel&&notice)panel.scrollTop+=notice.getBoundingClientRect().top-panel.getBoundingClientRect().top-18;
}

function render(){
 if(!progress){renderOnboarding();return;}
 const current=page==='lesson'?'Lesson briefing':page==='mission'?'Mission workspace':page==='sandbox'?'Free exploration':page==='debrief'?'Campaign debrief':page==='confidence'?'Confidence check':'Training overview';
 root.innerHTML=`<div class="app-shell"><aside class="sidebar"><a class="brand" href="#" data-action="dashboard"><span class="brand-mark">${plane}</span><span>SQL FLIGHT SCHOOL<small>AVIATION DATA TRAINING</small></span></a><div class="callsign-card"><span class="eyebrow">YOUR CALLSIGN</span><strong>${esc(progress.profile.CALLSIGN)}</strong><span>${esc(progress.profile.DISPLAY_NAME)}</span><span class="badge">${done().length===4?'GROUND SCHOOL QUALIFIED':'STUDENT ANALYST'}</span></div><p class="nav-label eyebrow">FLIGHT OPERATIONS</p><nav aria-label="Main navigation"><button class="nav-button ${page==='dashboard'?'active':''}" data-action="dashboard"><span>◈</span> Flight deck</button><button class="nav-button ${['mission','lesson'].includes(page)?'active':''}" data-action="resume"><span>▤</span> Missions <span class="nav-count">${done().length}/4</span></button><button class="nav-button ${page==='sandbox'?'active':''}" data-action="sandbox"><span>⌘</span> Sandbox</button></nav><p class="nav-label eyebrow">ONBOARD RESOURCES</p><nav aria-label="Learning resources"><button class="nav-button" data-action="schema"><span>⌗</span> Database map</button><button class="nav-button" data-action="reference"><span>≡</span> SQL reference</button><button class="nav-button ${page==='debrief'?'active':''}" data-action="debrief"><span>◷</span> Training log</button></nav><div class="sidebar-footer"><span class="status-dot"></span> TRAINING ENVIRONMENT<p>Read-only. Safe to explore.</p><small>Synthetic data · ${esc(DATA_AS_OF)}</small><small>Progress saved on this browser</small></div></aside><main class="main-content" id="main"><header class="topbar"><span class="breadcrumb">FLIGHT OPERATIONS <span>/</span> ${esc(current)}</span><div>${status('● SYSTEMS ONLINE')}<button class="button ghost small" data-action="help" aria-label="About your training environment">?</button></div></header>${page==='dashboard'?dashboard():page==='debrief'?debrief():page==='lesson'?renderLesson(LESSONS[activeId],mission(),lessonAnswers[activeId]):workspace()}</main></div>`;
 bindDivider();
}

function renderOnboarding(){
 if(!callsignChoices.length)shuffleCallsigns();
 root.innerHTML=`<main id="main" class="onboarding"><section class="onboarding-card"><div class="brand"><span class="brand-mark">${plane}</span><span>SQL FLIGHT SCHOOL<small>AVIATION DATA TRAINING</small></span></div><p class="eyebrow">YOUR NEXT QUALIFICATION STARTS HERE</p><h1>You know aviation.<br>Let’s put your data skills<br>on the flight line.</h1><p class="muted">Explore real aviation scenarios, learn SQL one mission at a time, and build confidence with Tower alongside you.</p>${restored.error?`<p class="notice">${esc(restored.error)}</p>`:''}<form id="onboarding-form"><label class="field">Your name<input name="displayName" autocomplete="given-name" maxlength="60" required value="${esc(onboardingName)}" placeholder="How should Tower address you?"></label><div class="panel-header"><label id="callsign-label">Choose your callsign</label>${button('↻ Reshuffle','reshuffle','ghost small','type="button"')}</div><div class="callsign-grid" role="group" aria-labelledby="callsign-label">${callsignChoices.map(c=>`<button type="button" class="callsign-option ${c===selectedCallsign?'selected':''}" aria-pressed="${c===selectedCallsign}" data-action="callsign" data-value="${esc(c)}">${esc(c)}</button>`).join('')}</div><p class="form-help">This is your local training identity. No account required.</p><button class="button primary onboarding-submit" type="submit" ${!selectedCallsign?'disabled':''}>Enter flight school <span>→</span></button></form><div class="onboarding-assurance"><span>◈ Real SQL</span><span>◈ Synthetic aviation data</span><span>◈ A safe place to learn</span></div></section><aside class="onboarding-art" aria-hidden="true"><div class="horizon"><span class="horizon-label">TRAINING SYSTEM / ONLINE</span><div class="horizon-crosshair">＋</div><span class="horizon-bottom">CONFIDENCE THROUGH COMPETENCE</span></div></aside></main>`;
}

function dashboard(){
 const next=MISSIONS.find(m=>!missionProgress(progress,m.id).completed)||MISSIONS[0];
 return `<section class="page-heading"><p class="eyebrow">YOUR PERSONAL QUALIFICATION JOURNEY</p><h1 class="page-title">Welcome ${welcomeBack?'back':'aboard'}, ${esc(progress.profile.CALLSIGN)}.</h1><p class="muted">One good question. One useful query. One mission closer.</p></section>${welcomeBack?`<section class="tower-card return-briefing"><span class="eyebrow">TOWER / RETURN BRIEFING</span><p>${done().length?`You’ve completed ${done().length} of 4 missions. ${pct()}% of your first qualification is complete.`:'Your training environment is ready. Your saved queries are right where you left them.'} ${done().length===4?'Your campaign debrief is ready.':`Next up: ${esc(next.title)}.`}</p>${button('Dismiss','dismiss-welcome','ghost small')}</section>`:''}<section class="dashboard-hero"><div class="hero-copy"><p class="eyebrow">CAMPAIGN 01 <span class="badge">CLEARED FOR TRAINING</span></p><h2>Ground School</h2><p>From your first query to a serviceable stock report.<br>Get comfortable asking the data questions you already know.</p><div class="hero-meta"><span>04 missions</span><span>Guided by Tower</span><span>At your own pace</span></div>${button(done().length===4?'Open campaign debrief':'Continue training →',done().length===4?'debrief':'mission','primary',`data-id="${next.id}"`)}<div class="progress-track" role="progressbar" aria-label="Ground School completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct()}"><span class="progress-fill" style="width:${pct()}%"></span></div><small>${done().length} OF 4 MISSIONS COMPLETE</small></div><div class="hero-instrument" aria-hidden="true"><div class="radar-ring"><span class="radar-plane">${plane}</span><span class="radar-label">GS / 01</span></div><span class="instrument-caption">CLEAR SKIES. NEW CAPABILITIES.</span></div></section><section class="metric-grid" aria-label="Your training progress">${metric(`${pct()}%`,'Campaign completion')}${metric(formatTime(progress.totalSeconds),'Time invested')}${metric(countConcepts(),'Concepts online')}${metric(done().filter(id=>missionProgress(progress,id).cleanSolve).length,'Clean solves')}</section><div class="section-heading"><div><p class="eyebrow">YOUR FLIGHT PLAN</p><h2>Four missions. A solid foundation.</h2></div><span class="muted">All four are open to explore</span></div><section class="mission-list">${MISSIONS.map((m,i)=>{const p=missionProgress(progress,m.id);return `<article class="mission-card"><span class="mission-number">${String(i+1).padStart(2,'0')}</span><div><p class="eyebrow">${esc(m.concepts.join(' / '))}</p><h3>${esc(m.title)}</h3><p class="muted">${esc(m.subtitle||m.objective)}</p></div><span class="badge ${p.completed?'complete':''}">${p.completed?'✓ COMPLETE':p.attempts?'IN PROGRESS':'READY'}</span>${button(p.completed?'Revisit':'Open mission →','mission','ghost small',`data-id="${m.id}"`)}</article>`;}).join('')}</section><section class="future-section"><div class="section-heading"><div><p class="eyebrow">ON THE HORIZON</p><h2>Your next qualifications</h2></div><span class="badge">FUTURE CURRICULUM</span></div><div class="future-grid">${['Ramp Qualification','Materials Control','Repair Control','Planning Desk','Systems Qualification','Final Check Ride'].map((name,i)=>`<article class="card locked"><span class="eyebrow">${String(i+2).padStart(2,'0')} / COMING LATER</span><h3>${name}</h3><p>${['Filter with confidence','Find value in your inventory','Understand vendor performance','Connect demand to stock','Explore how tables relate','Bring it together with JOIN'][i]}</p></article>`).join('')}</div></section>`;
}

function workspace(){
 const sandbox=page==='sandbox',confidence=page==='confidence',m=confidence?CONFIDENCE_CHECK:mission(),p=sandbox||confidence?null:mp();
 const displayResult=confidence?confidenceResult:result;
 const displayFeedback=confidence?confidenceFeedback:feedback;
 return `<section class="page-heading workspace-heading"><div><p class="eyebrow">${sandbox?'FREE EXPLORATION / NO GRADING':confidence?'GROUND SCHOOL / UNGRADED PRACTICE':`GROUND SCHOOL / MISSION ${String(MISSIONS.findIndex(x=>x.id===activeId)+1).padStart(2,'0')}`}</p><h1 class="page-title">${sandbox?'Your curiosity has clearance.':esc(m.title)}</h1><p class="muted">${sandbox?'The same aviation database. Room to experiment.':confidence?'Take your time. Hints are here when you want them.':esc(m.subtitle||'Turn an aviation question into a useful answer.')}</p></div><div class="workspace-tools">${!sandbox&&!confidence?button('Review lesson','review-lesson','secondary small'):''}${button('Database map','schema','secondary small')}${button('SQL reference','reference','secondary small')}${sandbox?button('Return to mission','return-mission','ghost small'):''}</div></section><section class="workspace"><div class="workspace-top"><section class="mission-panel"><div class="panel-header"><span class="eyebrow">${sandbox?'EXPLORATION / TOWER':'MISSION / TOWER'}</span>${status(sandbox?'NO GRADING':confidence?'CONFIDENCE CHECK':p.completed?'MISSION COMPLETE':'IN TRAINING')}</div>${sandbox?sandboxPanel():`<p class="briefing">${nl(m.briefing)}</p><div class="objective"><span class="eyebrow">YOUR OBJECTIVE</span><p>${nl(m.objective)}</p></div>${!confidence?`<div class="concept-tags">${m.concepts.map(c=>`<span class="badge">${esc(c)}</span>`).join('')}</div>`:''}<div class="hint-actions">${button('Request a hint','hint','secondary small')}${button('Show solution','solution','ghost small')}</div>${renderHints(m,p)}`}${displayFeedback?`<div class="tower-card ${displayFeedback.correct?'success':''}" role="status"><span class="eyebrow">TOWER / ${displayFeedback.correct?'GOOD READBACK':'LET’S CHECK THAT RETURN'}</span><p>${nl(displayFeedback.message)}</p></div>`:''}${explanation&&displayResult?`<div class="query-explanation"><h3>What your query did</h3><p>${nl(explanationText(explanation))}</p>${!sandbox&&!confidence&&p.queryCorrect?`<h3>Why that answered the mission</h3><p>${nl(m.explanation)}</p>`:''}</div>`:''}${!sandbox&&!confidence&&p.queryCorrect?businessResponse(m,p):''}${!sandbox&&!confidence&&p.completed?`<div class="mission-complete"><h3>✓ Mission complete</h3><p>${p.attempts} ${p.attempts===1?'attempt':'attempts'} · ${p.hintsUsed} ${p.hintsUsed===1?'hint':'hints'} · ${formatTime(p.seconds)} invested</p>${button(done().length===4?'Campaign debrief →':'Next mission →',done().length===4?'debrief':'next','primary small')}</div>`:''}${confidence&&progress.confidenceComplete?`<p class="notice">✓ Confidence check explored. No score, no gate—just another useful query.</p>${button('Return to debrief','debrief','secondary small')}`:''}</section><section class="editor-panel"><div class="panel-header"><span class="eyebrow">SQL EDITOR</span><span class="editor-dialect">T-SQL / READ ONLY</span></div><label class="visually-hidden" for="query-editor">SQL query</label><textarea class="query-editor" id="query-editor" spellcheck="false" autocomplete="off" autocapitalize="off" aria-describedby="editor-help">${esc(currentSql())}</textarea><div class="editor-actions">${button(busy?'Running query…':'▶ Run query','run','primary',busy?'disabled':'')}${!sandbox&&!confidence?button('Send to Sandbox ↗','send-sandbox','secondary'):''}<span id="editor-help" class="editor-shortcut">Ctrl + Enter to run</span></div><div class="editor-footer"><span class="status-dot"></span> Your queries can’t change the training data.<span>${esc(DATA_AS_OF)} training date</span></div></section></div><div class="divider" role="separator" aria-label="Resize results area" aria-orientation="horizontal" aria-valuemin="320" aria-valuemax="650" aria-valuenow="410" tabindex="0"></div><section class="results-panel"><div class="panel-header"><span class="eyebrow">LIVE RESULTS</span><span class="muted">${displayResult?(executedSql!==currentSql()?'Previous query result · run your edited query to update':`${displayResult.rowCount??displayResult.values.length} rows returned`):'Awaiting your query'}</span></div>${displayResult?renderResults(displayResult):`<div class="results-empty"><span class="empty-icon">⌗</span><h3>Your answer starts with a query.</h3><p>Run your SQL above. The result will appear here.</p><small>Every record in this environment is synthetic.</small></div>`}</section></section>`;
}
function explanationText(value){if(typeof value==='string')return value;return value?.message||value?.summary||value?.what||JSON.stringify(value);}
function renderHints(m,p){const count=page==='confidence'?(confidenceHints||0):(p?.hintsUsed||0);return count?`<ol class="hint-list">${m.hints.slice(0,count).map(h=>`<li>${nl(h)}</li>`).join('')}</ol>`:'';}
let confidenceHints=0;
function sandboxPanel(){return `<p class="briefing">Follow a question. Inspect a table. Try a different filter. Nothing here changes the data or affects mission completion.</p><div class="tower-card"><span class="eyebrow">TOWER / EXPLORATION TIP</span><p>Start with a small sample. The database map explains each table and lets you preview its records.</p><code>SELECT TOP 20 * FROM PARTS;</code></div><div class="sandbox-samples">${button('Explore inventory','sample','secondary small','data-table="INVENTORY"')}${button('Open repair orders','open-repairs','secondary small')}${button('Ask Tower about this query','explain','ghost small')}</div><p class="form-help">GETDATE() uses the fixed training date ${esc(DATA_AS_OF)}. Historical records cover the preceding two years.</p>`;}
function businessResponse(m,p){
 const answers=p.answers||{};
 const template=m.response.template.replace(/\{(\w+)\}/g,(_,id)=>answers[id]?.trim()?answers[id]:'[____]');
 return `<section class="business-response"><span class="eyebrow">COMPLETE THE LOOP / BUSINESS READBACK</span><h3>Send a useful answer.</h3><p class="form-help">Read the result table, then complete your response. This is a training message; nothing is sent outside this app.</p><pre class="response-preview">${esc(template)}</pre><form id="response-form" class="response-form">${m.response.fields.map(f=>`<label class="field">${esc(f.label)}<input name="${esc(f.id)}" value="${esc(answers[f.id]||'')}" required autocomplete="off" ${f.type==='number'?'inputmode="decimal"':''}></label>`).join('')}<button class="button primary small" type="submit">Transmit response →</button></form>${responseFeedback?`<p class="response-feedback" role="status">${nl(responseFeedback.message)}</p>`:''}</section>`;
}

function debrief(){
 const allDone=done().length===4,stats=MISSIONS.map(m=>({m,p:missionProgress(progress,m.id)})),attempts=stats.reduce((n,{p})=>n+p.attempts,0),hints=stats.reduce((n,{p})=>n+p.hintsUsed,0);
 return `<section class="page-heading"><p class="eyebrow">GROUND SCHOOL / ${allDone?'CAMPAIGN DEBRIEF':'TRAINING LOG'}</p><h1 class="page-title">${allDone?'Look how far you’ve flown.':'Every query is practice.'}</h1><p class="muted">${allDone?'You can now inspect, select, and filter aviation data—and communicate the answer.':'Your progress is saved as you learn. Your full debrief appears when all four missions are complete.'}</p></section><section class="tower-card"><span class="eyebrow">TOWER / ${allDone?'GROUND SCHOOL QUALIFIED':'PROGRESS REPORT'}</span><p>${allDone?'Good readback. You refined your queries until they answered the mission. That is exactly how real analysis works.':'There is no penalty for experimenting. Open any mission, request a hint, and keep asking useful questions.'}</p></section><section class="metric-grid">${metric(`${done().length}/4`,'Missions completed')}${metric(formatTime(progress.totalSeconds),'Time invested')}${metric(attempts,'Queries attempted')}${metric(hints,'Hints requested')}</section><div class="debrief-grid"><section class="card"><p class="eyebrow">CONCEPTS ONLINE</p><h2>Your growing toolkit</h2><div class="concept-tags">${[...new Set(stats.filter(({p})=>p.completed).flatMap(({m})=>m.concepts))].map(c=>`<span class="badge complete">${esc(c)}</span>`).join('')||'<p>Complete a mission to bring your first concepts online.</p>'}</div><p>${stats.filter(({p})=>p.cleanSolve).length} clean solves · ${stats.filter(({p})=>p.firstAttemptSuccess).length} first-query successes</p><p class="muted">Hints and retries are part of learning. These are milestones, not grades.</p></section><section class="card"><p class="eyebrow">FLIGHT LOG</p><h2>Your mission record</h2><table class="data-table"><thead><tr><th>Mission</th><th>Attempts</th><th>Hints</th><th>Time</th></tr></thead><tbody>${stats.map(({m,p},i)=>`<tr><td>${i+1}. ${esc(m.title)} ${p.completed?'✓':''}</td><td>${p.attempts}</td><td>${p.hintsUsed}</td><td>${formatTime(p.seconds)}</td></tr>`).join('')}</tbody></table><p class="muted">${attemptTrend(stats)}</p></section></div><section class="card"><p class="eyebrow">SUCCESSFUL QUERIES</p><h2>Work you can build on</h2>${stats.filter(({p})=>p.completed).map(({m,p})=>`<details><summary>${esc(m.title)}</summary><pre class="saved-query">${esc(p.finalSql||p.successfulQueries.at(-1)||'')}</pre></details>`).join('')||'<p class="muted">Your completed mission queries will appear here.</p>'}</section><section class="achievement-row">${stats.some(({p})=>p.completed&&!p.hintsUsed&&!p.solutionShown)?'<article class="achievement"><span>◇</span><div><h3>First Solo</h3><p>A mission completed without a hint.</p></div></article>':''}${stats.filter(({p})=>p.cleanSolve).length>=3?'<article class="achievement"><span>◇</span><div><h3>Clean Run</h3><p>Three clean mission completions.</p></div></article>':''}${allDone?'<article class="achievement"><span>◇</span><div><h3>Ground School Qualified</h3><p>Four missions. A real foundation.</p></div></article>':''}</section>${allDone?`<section class="campaign-card"><p class="eyebrow">ONE MORE FLIGHT / UNGRADED</p><h2>Ready to trust your own readback?</h2><p>Use what you’ve learned to find overhauled material in Dallas. No score. No timer. Tower is available if you need help.</p>${button(progress.confidenceComplete?'Revisit confidence check →':'Open confidence check →','confidence','primary')}<p class="muted">Next qualification preview: Ramp Qualification adds OR, comparisons, and NULL checks for open repair orders. Coming in a future release.</p></section>`:button('Return to training →','resume','primary')}<section class="card"><details><summary>Training data details</summary><p>${progress.totalQueries} total queries · ${progress.sandboxQueries} Sandbox queries · ${progress.sessionCount} sessions</p><p>${stats.reduce((n,{p})=>n+p.syntaxErrors,0)} syntax corrections across your practice. ${esc(DATA_VERSION)} · Training date ${esc(DATA_AS_OF)}.</p><p>This progress is stored only in this browser. Moving browsers or clearing site data starts a new training profile.</p></details></section>`;
}
function attemptTrend(stats){const completed=stats.filter(({p})=>p.completed);if(completed.length<2)return 'As you complete missions, compare how you approach each new question.';const first=completed[0].p.attempts,last=completed.at(-1).p.attempts;return last<first?`Your latest completed mission took ${first-last} fewer attempts than your first. You are finding your approach.`:last===first?'Your first and latest completed missions used the same number of attempts. Keep building on what works.':'Your latest mission took more exploration than your first. Later missions combine more concepts; every refinement is useful practice.';}

async function openMission(id){activeId=id||progress.lastMission||MISSIONS[0].id;progress.lastMission=activeId;const record=missionProgress(progress,activeId);page=record.lessonViewed?'mission':'lesson';clearQueryState();save();render();window.scrollTo(0,0);}
function clearQueryState(){queryRevision++;result=null;feedback=null;explanation=null;executedSql=null;validatedSql=null;responseFeedback=null;if(progress&&page==='mission')mp().queryCorrect=false;}
async function expected(m){if(!expectedCache.has(m.id))expectedCache.set(m.id,await runner.run(m.solutionSql));return expectedCache.get(m.id);}
async function runQuery(){
 if(busy)return;
 const sql=currentSql();if(!sql.trim()){notify('Write a query first. Tower can help with a hint.');return;}
 busy=true;const runPage=page,runId=activeId,revision=++queryRevision;const isCurrent=()=>queryRevision===revision&&page===runPage&&activeId===runId;const confidence=page==='confidence',sandbox=page==='sandbox';
 if(!sandbox&&!confidence){mp().attempts++;mp().queryCorrect=false;mp().draft=sql;}
 progress.totalQueries++;if(sandbox)progress.sandboxQueries++;
 result=null;feedback=null;explanation=null;validatedSql=null;responseFeedback=null;
 if(confidence){confidenceResult=null;confidenceFeedback=null;}
 render();
 try {
  const output=await runner.run(sql);
  if(!isCurrent())return;
  if(confidence)confidenceResult=output;else result=output;
  executedSql=sql;explanation=explainQuery(sql,output);
  if(sandbox){feedback={correct:true,message:'Your query ran successfully. Explore another question whenever you’re ready.'};}
  else {
   const m=confidence?CONFIDENCE_CHECK:mission();
   const referenceResult=await expected(m);
   if(!isCurrent())return;
   const check=validateResult(m,output,referenceResult,sql);
   if(confidence){confidenceFeedback=check;if(check.correct){progress.confidenceComplete=true;confidenceFeedback={...check,message:'Good readback. You combined the concepts to find the requested stock. This check is ungraded—your practice counts.'};}}
   else {feedback=check;mp().queryCorrect=check.correct;if(check.correct){validatedSql=sql;mp().successfulQueries.push(sql);mp().successfulQueries=mp().successfulQueries.slice(-10);if(!check.conceptDemonstrated)feedback.message+=' Your result is correct. You can also practice this mission’s suggested SQL concepts.';}else if(mp().attempts>=3&&mp().hintsUsed===0){feedback.message+=' You’ve explored a few approaches. Request a hint whenever you’d like a steer.';}}
  }
 }catch(error){
  if(!isCurrent())return;
  const coaching=coachError(error,sql);const message=typeof coaching==='string'?coaching:coaching.message||String(coaching);
  if(confidence)confidenceFeedback={correct:false,message};else feedback={correct:false,message};
  if(!confidence&&!sandbox){mp().syntaxErrors++;if(mp().syntaxErrors>=3)feedback.message+=' You’ve hit a few syntax issues. The next hint can help you check the query step by step.';}
 }finally{busy=false;save();render();if(isCurrent())revealCoaching();}
}

function showModal(kind){modal=kind;modalReturnFocus=document.activeElement;renderModal();}
async function renderModal(){
 const revision=++modalRevision;
 if(!modal){modalRoot.innerHTML='';return;}
 const title=modal==='schema'?'Know your data.':modal==='reference'?'Your SQL toolkit.':'Your training environment';
 modalRoot.innerHTML=`<div class="modal-backdrop"><section class="modal ${modal==='schema'?'modal-wide':''}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header class="panel-header"><div><p class="eyebrow">ONBOARD RESOURCES</p><h2 id="modal-title">${title}</h2></div><button class="button ghost" data-action="close-modal" aria-label="Close dialog">✕</button></header><div class="modal-body">${modal==='schema'?renderSchema(SCHEMA,modalTable)+`<section class="sample-section"><div class="panel-header"><h3>Sample rows / ${modalTable}</h3><span class="muted">First 12 records · preview only</span></div><div id="schema-sample" aria-live="polite">Loading sample rows…</div></section>`:modal==='reference'?renderReference(REFERENCE,done(),['mission','lesson'].includes(page)?mission().concepts:page==='confidence'?CONFIDENCE_CHECK.concepts:[]):`<div class="tower-card"><p>SQL Flight School helps you turn aviation questions into useful data answers. Tower offers hints, explains queries, and checks mission results.</p></div><h3>You cannot break the data.</h3><p>All queries are read-only. The six tables contain synthetic records, held in your browser. Nothing is sent to an external AI service.</p><h3>Practice at your own pace.</h3><p>All four prototype missions are open. Your name, callsign, drafts, and progress are saved in this browser. Sandbox keeps a separate draft.</p><h3>A consistent training date.</h3><p>Training date: ${esc(DATA_AS_OF)}. GETDATE() returns that date, so the same practice query has the same answer tomorrow.</p><h3>Prototype boundaries.</h3><p>Tower uses prepared coaching rules. The SQL engine supports a beginner T-SQL subset; this is not a complete SQL Server environment. Advanced SQL and later campaigns are outside this first release.</p><p class="muted">Browser storage: ${storageWarning?'unavailable; keep this page open':'local only'}. Dataset: ${esc(DATA_VERSION)}.</p>`}</div></section></div>`;
 modalRoot.querySelector('[data-action="close-modal"]').focus();
 if(modal==='schema')try{const sample=await runner.run(`SELECT TOP 12 * FROM ${modalTable};`);if(modal==='schema'&&revision===modalRevision)document.querySelector('#schema-sample').innerHTML=renderResults(sample);}catch(error){if(revision===modalRevision&&document.querySelector('#schema-sample'))document.querySelector('#schema-sample').textContent=error.message;}
}
function closeModal(){modal=null;modalRevision++;modalRoot.innerHTML='';modalReturnFocus?.focus();}

root.addEventListener('input',event=>{
 activityAt=Date.now();
 if(event.target.id==='query-editor'){
  setSql(event.target.value);
  document.querySelectorAll('.query-explanation,.business-response,.mission-panel>.tower-card[role="status"]').forEach(el=>el.remove());
  const label=document.querySelector('.results-panel>.panel-header>.muted');
  if(label&&(result||confidenceResult))label.textContent='Previous query result · run your edited query to update';
 }
 if(event.target.name==='displayName')onboardingName=event.target.value;
 if(event.target.closest('#response-form')){mp().answers[event.target.name]=event.target.value;clearTimeout(saveTimer);saveTimer=setTimeout(save,350);}
});
root.addEventListener('submit',event=>{
 event.preventDefault();
 if(event.target.id==='onboarding-form'){
  const displayName=new FormData(event.target).get('displayName').trim();if(!displayName||!selectedCallsign)return;
  progress=newProgress({USER_ID:crypto.randomUUID(),DISPLAY_NAME:displayName,CALLSIGN:selectedCallsign});progress.sessionCount=1;save();render();
 }else if(event.target.id==='response-form'){
  if(!mp().queryCorrect||validatedSql!==currentSql()||!result){notify('Run your current query successfully before transmitting the response.');return;}
  mp().responseAttempts++;const answers=Object.fromEntries(new FormData(event.target));mp().answers=answers;
  responseFeedback=validateResponse(mission(),answers,result);
  if(responseFeedback.correct){completeMission(progress,activeId,currentSql());notify('Good readback. Mission complete. You’re cleared to continue.');}
  save();render();revealCoaching(responseFeedback.correct?'.mission-complete':'.response-feedback');
 }
});

async function action(event){
 const target=event.target.closest('[data-action]');
 if(!target){const table=event.target.closest('[data-table]');if(table&&modal==='schema'){modalTable=table.dataset.table;renderModal();}return;}
 const type=target.dataset.action;event.preventDefault();activityAt=Date.now();
 if(type==='close-modal'){closeModal();return;}
 if(type==='schema'||type==='reference'||type==='help'){showModal(type);return;}
 if(type==='callsign'){selectedCallsign=target.dataset.value;renderOnboarding();return;}
 if(type==='reshuffle'){shuffleCallsigns();renderOnboarding();return;}
 if(!progress)return;
 if(type==='review-lesson'){page='lesson';queryRevision++;render();window.scrollTo(0,0);return;}
 if(type==='lesson-answer'){lessonAnswers[activeId]=Number(target.dataset.answer);render();document.querySelector('.lesson-check .tower-card')?.scrollIntoView({block:'nearest'});document.querySelector('.lesson-option.selected')?.focus({preventScroll:true});return;}
 if(type==='begin-mission'){mp().lessonViewed=true;save();page='mission';clearQueryState();render();window.scrollTo(0,0);return;}
 if(type==='run'){await runQuery();return;}
 if(type==='mission'){openMission(target.dataset.id);return;}
 if(type==='resume'){openMission(progress.lastMission||MISSIONS.find(m=>!missionProgress(progress,m.id).completed)?.id||MISSIONS[0].id);return;}
 if(type==='return-mission'){openMission(progress.lastMission||activeId);return;}
 if(type==='next'){const index=MISSIONS.findIndex(m=>m.id===activeId);openMission(MISSIONS[index+1]?.id||MISSIONS.find(m=>!missionProgress(progress,m.id).completed)?.id||MISSIONS[0].id);return;}
 if(type==='dashboard'||type==='debrief'){page=type;clearQueryState();render();window.scrollTo(0,0);return;}
 if(type==='dismiss-welcome'){welcomeBack=false;render();return;}
 if(type==='sandbox'||type==='send-sandbox'){if(type==='send-sandbox'){progress.sandboxSql=currentSql();progress.lastMission=activeId;}page='sandbox';clearQueryState();save();render();return;}
 if(type==='sample'){setSql(`SELECT TOP 20 *\nFROM ${target.dataset.table};`);render();return;}
 if(type==='open-repairs'){setSql('SELECT TOP 20 *\nFROM REPAIR_ORDERS\nWHERE DATE_RETURNED IS NULL;');render();return;}
 if(type==='explain'){feedback={correct:Boolean(result&&executedSql===currentSql()),message:result&&executedSql===currentSql()?explanationText(explainQuery(executedSql,result)):'Run your current query first, then Tower can explain the operation and the rows it returned. For field definitions, open the database map.'};render();return;}
 if(type==='confidence'){page='confidence';confidenceSql=confidenceSql||CONFIDENCE_CHECK.starterSql;clearQueryState();render();window.scrollTo(0,0);return;}
 if(type==='hint'){if(page==='confidence')confidenceHints=Math.min(3,confidenceHints+1);else mp().hintsUsed=Math.min(3,mp().hintsUsed+1);save();render();revealCoaching('.hint-list');return;}
 if(type==='solution'){const m=page==='confidence'?CONFIDENCE_CHECK:mission();if(page!=='confidence')mp().solutionShown=true;setSql(m.solutionSql);feedback={correct:true,message:'Here is one approach. Read it line by line, run it, and explain the result in your own words.'};save();render();return;}
}
root.addEventListener('click',action);modalRoot.addEventListener('click',action);
modalRoot.addEventListener('click',event=>{if(event.target.classList.contains('modal-backdrop'))closeModal();});
document.addEventListener('keydown',event=>{
 activityAt=Date.now();
 if(modal){
  if(event.key==='Escape'){event.preventDefault();closeModal();}
  if(event.key==='Tab'){const items=[...modalRoot.querySelectorAll('button,a[href],input,textarea,select,[tabindex="0"]')].filter(el=>!el.disabled);const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
  return;
 }
 if((event.ctrlKey||event.metaKey)&&event.key==='Enter'&&['mission','sandbox','confidence'].includes(page)){event.preventDefault();runQuery();}
});
document.addEventListener('pointerdown',()=>activityAt=Date.now());
setInterval(()=>{
 const now=Date.now(),elapsed=Math.min(15,Math.round((now-tickAt)/1000));tickAt=now;
 if(progress&&!document.hidden&&now-activityAt<120000){progress.totalSeconds+=elapsed;if(['mission','lesson'].includes(page))mp().seconds+=elapsed;save();}
},10000);
window.addEventListener('pagehide',save);
function bindDivider(){
 const divider=document.querySelector('.divider'),work=document.querySelector('.workspace');if(!divider||!work)return;
 const setHeight=value=>{const height=Math.max(320,Math.min(650,value));work.style.setProperty('--top-height',`${height}px`);divider.setAttribute('aria-valuenow',String(Math.round(height)));};
 divider.addEventListener('pointerdown',event=>{const initialY=event.clientY,initialHeight=document.querySelector('.workspace-top').getBoundingClientRect().height;divider.setPointerCapture(event.pointerId);const move=e=>setHeight(initialHeight+e.clientY-initialY);divider.addEventListener('pointermove',move);divider.addEventListener('pointerup',()=>divider.removeEventListener('pointermove',move),{once:true});});
 divider.addEventListener('keydown',event=>{if(event.key==='ArrowUp'||event.key==='ArrowDown'){event.preventDefault();setHeight(Number(divider.getAttribute('aria-valuenow'))+(event.key==='ArrowDown'?20:-20));}});
}

try {
 await runner.ready;
 if(progress){progress.sessionCount++;save();}
 render();
}catch(error){root.innerHTML=`<main id="main" class="onboarding"><section class="onboarding-card"><p class="eyebrow">SQL FLIGHT SCHOOL</p><h1>We couldn’t prepare the database.</h1><p>${esc(error.message)}</p><p>Start the included local launcher and open the address it displays. Opening index.html directly won’t load the database.</p><button class="button primary" onclick="location.reload()">Try again</button></section></main>`;}
