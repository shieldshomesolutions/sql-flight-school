export const STORAGE_KEY='sql-flight-school.v1';
export function newProgress(profile) {
  return {version:1,profile,createdAt:new Date().toISOString(),lastVisit:null,sessionCount:0,totalQueries:0,sandboxQueries:0,missions:{},sandboxSql:'SELECT TOP 20 *\nFROM PARTS;',lastMission:null,confidenceComplete:false,totalSeconds:0};
}
export function missionProgress(progress,id) {
  return progress.missions[id] ||= {attempts:0,syntaxErrors:0,hintsUsed:0,solutionShown:false,completed:false,queryCorrect:false,seconds:0,successfulQueries:[],draft:null,answers:{},responseAttempts:0,firstAttemptSuccess:false,cleanSolve:false};
}
export function completedIds(progress) {return Object.entries(progress.missions).filter(([,p])=>p.completed).map(([id])=>id);}
export function completeMission(progress,id,sql,now=new Date().toISOString()) {
  const p=missionProgress(progress,id);
  if(p.completed)return false;
  p.completed=true;p.completedAt=now;p.firstAttemptSuccess=p.attempts===1;
  p.cleanSolve=p.hintsUsed===0&&!p.solutionShown&&p.syntaxErrors===0;
  p.finalSql=sql;return true;
}
export function loadProgress(storage) {
  try {
    const raw=storage.getItem(STORAGE_KEY);if(!raw)return {progress:null,error:null};
    const p=JSON.parse(raw);
    if(p.version!==1||!p.profile||typeof p.profile.USER_ID!=='string'||typeof p.profile.DISPLAY_NAME!=='string'||typeof p.profile.CALLSIGN!=='string'||!p.missions||typeof p.missions!=='object'||Array.isArray(p.missions))throw Error('Saved training data could not be read.');
    const base=newProgress(p.profile);
    return {progress:{...base,...p},error:null};
  }catch {return {progress:null,error:'Your saved profile could not be read. You can create a new local profile to continue.'};}
}
export function saveProgress(storage,progress) {
  try{storage.setItem(STORAGE_KEY,JSON.stringify(progress));return true;}catch{return false;}
}
export function formatTime(seconds) {
  const minutes=Math.floor(Math.max(0,seconds)/60);
  return minutes<1?'Less than a minute':minutes<60?`${minutes} min`:`${Math.floor(minutes/60)} hr ${minutes%60} min`;
}
