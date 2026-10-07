// Static UI bytes are embedded as `assets` by scripts/build-counter.mjs.
function json(data,status=200,extra={}){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});}
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(['/api/players','/api/profile','/api/runs','/api/runs/finish','/api/leaderboard'].includes(url.pathname))return rankingsAPI(request,env,url);
  if(url.pathname==='/api/visits'){
   if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed'},405,{Allow:'GET, POST'});
   if(request.method==='POST'){
    const origin=request.headers.get('Origin');
    if(request.headers.get('Sec-Fetch-Site')==='cross-site'||(origin&&origin!==url.origin))return json({error:'Forbidden'},403);
   }
   if(!env.DB)return json({error:'Counter unavailable'},503);
   try{
    const row=request.method==='POST'
     ?await env.DB.prepare("INSERT INTO visit_totals (metric, count) VALUES ('pageviews', 1) ON CONFLICT(metric) DO UPDATE SET count = visit_totals.count + 1 RETURNING count").first()
     :await env.DB.prepare("SELECT count FROM visit_totals WHERE metric = 'pageviews'").first();
    return json({count:Number(row?.count||0)});
   }catch{return json({error:'Counter unavailable'},503);}
  }
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
  const path=url.pathname==='/'||url.pathname==='/index.html'?'/index.html':url.pathname;
  const asset=assets[path];if(!asset)return new Response('Not found',{status:404});
  const body=request.method==='HEAD'?null:asset.binary?(asset.bytes??=Uint8Array.from(atob(asset.body),c=>c.charCodeAt(0))):asset.body;
  return new Response(body,{headers:{'Content-Type':asset.type,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}});
 }
};
