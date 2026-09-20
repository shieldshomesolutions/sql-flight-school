/* A classic worker keeps expensive SQL away from the interface. */
importScripts('../vendor/sql-wasm.js');
let engine;
const ready = Promise.all([
  initSqlJs({locateFile: file => new URL('../vendor/' + file, self.location.href).href}),
  import('./sql.js'),
]).then(([SQL, module]) => {
  engine = module.createEngine(SQL);
  self.postMessage({type:'ready'});
}).catch(error => self.postMessage({type:'fatal',error:error.message}));
self.onmessage = async ({data}) => {
  await ready;
  if (!engine) return;
  try { self.postMessage({id:data.id,result:engine.run(data.sql)}); }
  catch(error) { self.postMessage({id:data.id,error:error.message}); }
};
