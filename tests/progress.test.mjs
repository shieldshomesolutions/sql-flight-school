import test from 'node:test';
import assert from 'node:assert/strict';
import {newProgress,missionProgress,completeMission,loadProgress,saveProgress,completedIds,STORAGE_KEY} from '../src/progress.js';
const profile={USER_ID:'test-user',DISPLAY_NAME:'Alex',CALLSIGN:'ATLAS'};
test('mission completion is idempotent and survives storage round trip',()=>{
 const p=newProgress(profile),m=missionProgress(p,'m1');m.attempts=1;m.queryCorrect=true;
 assert.equal(completeMission(p,'m1','SELECT TOP 10 * FROM INVENTORY;'),true);
 assert.equal(completeMission(p,'m1','different'),false);
 assert.deepEqual(completedIds(p),['m1']);assert.equal(m.cleanSolve,true);assert.equal(m.firstAttemptSuccess,true);
 const storage={getItem(){return this.value},setItem(key,value){assert.equal(key,STORAGE_KEY);this.value=value}};
 assert.equal(saveProgress(storage,p),true);assert.deepEqual(loadProgress(storage).progress,p);
});
test('hints and syntax errors affect encouragement metrics without blocking completion',()=>{
 const p=newProgress(profile),m=missionProgress(p,'m2');m.attempts=4;m.hintsUsed=1;m.syntaxErrors=2;
 assert.equal(completeMission(p,'m2','SELECT * FROM INVENTORY'),true);assert.equal(m.cleanSolve,false);assert.equal(m.firstAttemptSuccess,false);
});
test('corrupt or unavailable storage fails gracefully',()=>{
 assert.ok(loadProgress({getItem:()=>'{broken'}).error);
 assert.equal(loadProgress({getItem:()=>null}).progress,null);
 assert.equal(saveProgress({setItem(){throw Error('quota')}},newProgress(profile)),false);
});
