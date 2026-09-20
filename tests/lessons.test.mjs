import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {LESSONS} from '../src/lessons.js';
import {MISSIONS} from '../src/curriculum.js';
import {createEngine} from '../src/sql.js';
import {renderLesson} from '../src/lesson-view.js';
import {newProgress,missionProgress,saveProgress,loadProgress} from '../src/progress.js';
const require=createRequire(import.meta.url);
const SQL=await require('../vendor/sql-wasm.js')({locateFile:file=>fileURLToPath(new URL('../vendor/'+file,import.meta.url))});
test('worked examples execute against the real training data and demonstrate the claimed concepts',()=>{
 const engine=createEngine(SQL);
 try {
  for(const mission of MISSIONS){const lesson=LESSONS[mission.id];assert.ok(lesson.outcomes.length);assert.ok(lesson.check.answerIndex>=0&&lesson.check.answerIndex<lesson.check.options.length);for(const step of lesson.steps){const result=engine.run(step.sql);assert.ok(result.values.length>0,step.title);assert.equal(result.truncated,false);}}
  const named=engine.run(LESSONS['useful-readback'].steps[0].sql);assert.equal(named.columns.length,2);assert.equal(named.rowCount,420);
  const distinct=engine.run(LESSONS['condition-report'].steps[1].sql);assert.equal(distinct.rowCount,4);
  const ascending=engine.run(LESSONS['atlanta-desk'].steps[3].sql),descending=engine.run(LESSONS['atlanta-desk'].steps[4].sql);
  assert.deepEqual(descending.values,[...ascending.values].reverse());
 }finally{engine.close();}
});
test('lesson checks explain both answers without blocking application',()=>{
 const lesson=LESSONS['first-contact'],mission=MISSIONS[0];
 const unanswered=renderLesson(lesson,mission);assert.ok(unanswered.includes('Apply it in the mission'));assert.ok(!unanswered.includes('role="status"'));
 const incorrect=renderLesson(lesson,mission,1);assert.ok(incorrect.includes('LET’S WALK THROUGH IT'));assert.ok(incorrect.includes('does not affect your mission record'));
 const correct=renderLesson(lesson,mission,0);assert.ok(correct.includes('GOOD READBACK'));assert.ok(correct.includes(lesson.check.explanation));
});
test('adding lesson review state preserves existing completion and drafts through reload',()=>{
 const p=newProgress({USER_ID:'pilot',DISPLAY_NAME:'Pilot',CALLSIGN:'ATLAS'}),m=missionProgress(p,'first-contact');
 m.completed=true;m.draft='SELECT TOP 10 * FROM INVENTORY;';m.attempts=2;m.lessonViewed=true;
 const storage={setItem(k,v){this.value=v;},getItem(){return this.value;}};saveProgress(storage,p);
 const loaded=loadProgress(storage).progress;assert.equal(loaded.missions['first-contact'].lessonViewed,true);assert.equal(loaded.missions['first-contact'].completed,true);assert.equal(loaded.missions['first-contact'].draft,m.draft);assert.equal(loaded.missions['first-contact'].attempts,2);
});
