import {mkdir,copyFile,cp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
const dist=new URL('../dist/',import.meta.url);
await mkdir(dist,{recursive:true});
await copyFile(new URL('index.html',root),new URL('index.html',dist));
for(const name of ['src','vendor'])await cp(fileURLToPath(new URL(name,root)),fileURLToPath(new URL(name,dist)),{recursive:true});
console.log('Website files prepared in dist/.');
