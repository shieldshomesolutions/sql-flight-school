import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {spawn} from 'node:child_process';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.wasm':'application/wasm','.md':'text/plain; charset=utf-8','.svg':'image/svg+xml'};
const server = http.createServer(async (req,res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403);res.end('Forbidden');return; }
    const info = await stat(file);
    const target = info.isDirectory() ? path.join(file,'index.html') : file;
    const body = await readFile(target);
    res.writeHead(200, {'Content-Type':types[path.extname(target)] || 'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(404,{'Content-Type':'text/plain'});res.end('File not found'); }
});
function openBrowser(){
  const url=`http://127.0.0.1:${port}`;
  const child=process.platform==='win32'?spawn('cmd.exe',['/c','start','',url],{windowsHide:true,stdio:'ignore'}):spawn(process.platform==='darwin'?'open':'xdg-open',[url],{stdio:'ignore'});
  child.on('error',()=>console.log(`Open ${url} in your browser.`));
}
server.listen(port,'127.0.0.1',()=>{
 console.log(`SQL Flight School is ready: http://127.0.0.1:${port}\nKeep this window open while learning. Press Ctrl+C to stop.`);
 if(process.argv.includes('--open'))openBrowser();
});
server.on('error',e=>{console.error(e.code === 'EADDRINUSE' ? `Port ${port} is in use. Try opening http://127.0.0.1:${port} or set PORT to another number.` : e.message);process.exit(1);});
