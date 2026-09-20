export class QueryRunner {
  constructor() { this.counter=0;this.pending=new Map();this.start(); }
  start() {
    this.worker = new Worker(new URL('./sql-worker.js',import.meta.url));
    this.ready = new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{reject(new Error('The training database could not start. Refresh the page and try again.'));this.worker.terminate();},20000);
      this.worker.onmessage=({data})=>{
        if(data.type==='ready'){clearTimeout(timer);resolve();return;}
        if(data.type==='fatal'){clearTimeout(timer);reject(new Error(data.error));return;}
        const request=this.pending.get(data.id);
        if(request){clearTimeout(request.timer);this.pending.delete(data.id);data.error?request.reject(new Error(data.error)):request.resolve(data.result);}
      };
      this.worker.onerror=(event)=>{clearTimeout(timer);const error=new Error(event.message || 'The training database stopped unexpectedly. Refresh to reload it.');reject(error);this.failPending(error);};
    });
  }
  failPending(error){for(const request of this.pending.values()){clearTimeout(request.timer);request.reject(error);}this.pending.clear();}
  async run(sql) {
    await this.ready;
    const id=++this.counter;
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{
        const error=new Error('This query took too long. Try a smaller query or check how your tables are joined. Your data is safe.');
        this.worker.terminate();this.failPending(error);this.start();
      },5000);
      this.pending.set(id,{resolve,reject,timer});
      this.worker.postMessage({id,sql});
    });
  }
}
