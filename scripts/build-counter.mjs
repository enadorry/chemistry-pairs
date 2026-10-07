import {readFile,readdir,mkdir,writeFile,cp,rm} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';import {resolve,extname} from 'node:path';
const root=resolve(fileURLToPath(new URL('..',import.meta.url))),assets={};
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png'};
for(const file of await readdir(resolve(root,'web'))){const type=types[extname(file)];if(type){const binary=extname(file)==='.png';assets['/'+file]={type,body:await readFile(resolve(root,'web',file),binary?'base64':'utf8'),...(binary?{binary:true}:{})};}}
const source=await readFile(resolve(root,'worker/index.js'),'utf8');
await rm(resolve(root,'dist'),{recursive:true,force:true});await mkdir(resolve(root,'dist/server'),{recursive:true});await mkdir(resolve(root,'dist/.openai'),{recursive:true});
const require=createRequire(import.meta.url),meta=require(resolve(root,'web/data.js')).map(({id,category})=>({id,category}));
const rankings=await readFile(resolve(root,'worker/rankings.js'),'utf8');
await writeFile(resolve(root,'dist/server/index.js'),'const assets='+JSON.stringify(assets)+';\nconst compoundMeta='+JSON.stringify(meta)+';\n'+rankings+'\n'+source);
await cp(resolve(root,'.openai/hosting.json'),resolve(root,'dist/.openai/hosting.json'));
await cp(resolve(root,'drizzle'),resolve(root,'dist/.openai/drizzle'),{recursive:true});
console.log('Built embedded UI, Worker counter and schema migration.');
