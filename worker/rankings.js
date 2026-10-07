const rankError=(message,status=400)=>Object.assign(new Error(message),{status});
async function readBody(request){const text=await request.text();if(text.length>50000)throw rankError('送信データが大きすぎます。');try{return JSON.parse(text);}catch{throw rankError('送信データを確認してください。');}}
async function tokenHash(token){const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));return [...new Uint8Array(hash)].map(n=>n.toString(16).padStart(2,'0')).join('');}
async function currentPlayer(request,db,required=true){const token=request.headers.get('Authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];if(!token){if(required)throw rankError('ニックネームを登録してください。',401);return null;}const player=await db.prepare('SELECT id, nickname FROM online_players WHERE token_hash = ?').bind(await tokenHash(token)).first();if(!player&&required)throw rankError('登録情報を読み直してください。',401);return player;}
function challenge(category,count){if(category!=='all'&&!compoundMeta.some(c=>c.category===category))throw rankError('出題範囲を選んでください。');const pool=compoundMeta.filter(c=>category==='all'||c.category===category);if(count!=='all'&&![6,8,12,24].includes(Number(count)))throw rankError('ペア数を選んでください。');return {category,pool,pairCount:count==='all'?pool.length:Math.min(Number(count),pool.length)};}
function randomInt(max){const limit=Math.floor(4294967296/max)*max;let x;do{x=crypto.getRandomValues(new Uint32Array(1))[0];}while(x>=limit);return x%max;}
function shuffleServer(items){const a=[...items];for(let i=a.length-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
function evaluateRun(deck,attempts){if(!Array.isArray(attempts)||attempts.length>1000)throw rankError('記録の手数が無効です。');const matched=new Set();let score=0,combo=0,bestCombo=0;for(const pair of attempts){if(!Array.isArray(pair)||pair.length!==2)throw rankError('記録の形式が無効です。');const [a,b]=pair;if(!Number.isInteger(a)||!Number.isInteger(b)||a===b||!deck[a]||!deck[b]||matched.has(a)||matched.has(b))throw rankError('めくったカードの記録が無効です。');if(deck[a].id===deck[b].id&&deck[a].type!==deck[b].type){matched.add(a);matched.add(b);combo++;bestCombo=Math.max(bestCombo,combo);score+=100*Math.min(combo,5);}else combo=0;}if(matched.size!==deck.length)throw rankError('すべてのペアをそろえてください。');return {score,moves:attempts.length,bestCombo};}
async function rankingsAPI(request,env,url){
 if(!env.DB)return json({error:'ランキングを読み込めませんでした。'},503);
 if(request.method!=='GET'){const origin=request.headers.get('Origin');if(request.headers.get('Sec-Fetch-Site')==='cross-site'||(origin&&origin!==url.origin))return json({error:'アクセスを確認してください。'},403);}
 try{
  const db=env.DB,path=url.pathname;
  if(path==='/api/players'&&request.method==='POST'){
   const body=await readBody(request);const nickname=String(body.nickname||'').normalize('NFKC').trim();
   if(!nickname||[...nickname].length>16||/[\x00-\x1f\x7f<>]/.test(nickname))throw rankError('ニックネームは1〜16文字で入力してください。');
   const key=nickname.toLocaleLowerCase('ja-JP');const owner=await currentPlayer(request,db,false);
   if(request.headers.has('Authorization')&&!owner)throw rankError('登録情報を読み直してください。',401);
   const used=await db.prepare('SELECT id FROM online_players WHERE nickname_key = ?').bind(key).first();if(used&&used.id!==owner?.id)throw rankError('そのニックネームは使用されています。別の名前を選んでください。',409);
   if(owner){await db.prepare('UPDATE online_players SET nickname = ?, nickname_key = ? WHERE id = ?').bind(nickname,key,owner.id).run();return json({id:owner.id,nickname});}
   const id=crypto.randomUUID(),token=(crypto.randomUUID()+crypto.randomUUID()).replaceAll('-','');
   try{await db.prepare('INSERT INTO online_players (id, nickname, nickname_key, token_hash, created_at) VALUES (?, ?, ?, ?, ?)').bind(id,nickname,key,await tokenHash(token),Date.now()).run();}catch(e){if(String(e.message).includes('UNIQUE'))throw rankError('そのニックネームは使用されています。',409);throw e;}
   return json({id,nickname,token},201);
  }
  if(path==='/api/profile'&&request.method==='GET'){return json(await currentPlayer(request,db));}
  if(path==='/api/runs'&&request.method==='POST'){
   const player=await currentPlayer(request,db);const body=await readBody(request),ch=challenge(body.category,body.count);
   const deck=shuffleServer(shuffleServer(ch.pool).slice(0,ch.pairCount).flatMap(c=>[{id:c.id,type:'name'},{id:c.id,type:'formula'}]));
   const id=crypto.randomUUID(),startedAt=Date.now();await db.prepare('INSERT INTO online_runs (id, player_id, category, pair_count, deck_json, started_at) VALUES (?, ?, ?, ?, ?, ?)').bind(id,player.id,ch.category,ch.pairCount,JSON.stringify(deck),startedAt).run();
   return json({id,deck,startedAt,category:ch.category,pairCount:ch.pairCount},201);
  }
  if(path==='/api/runs/finish'&&request.method==='POST'){
   const player=await currentPlayer(request,db);const body=await readBody(request);if(typeof body.id!=='string')throw rankError('挑戦の記録が見つかりません。');
   const run=await db.prepare('SELECT * FROM online_runs WHERE id = ? AND player_id = ?').bind(body.id,player.id).first();if(!run)throw rankError('挑戦の記録が見つかりません。',404);
   if(run.finished_at!==null)return json({id:run.id,score:run.score,durationMs:run.duration_ms,moves:run.moves,bestCombo:run.best_combo});
   const finishedAt=Date.now(),durationMs=finishedAt-run.started_at;if(durationMs<0||durationMs>7200000)throw rankError('挑戦の有効時間を過ぎました。もう一度始めてください。',410);
   const checked=evaluateRun(JSON.parse(run.deck_json),body.attempts);
   const previous=await db.prepare('SELECT MIN(duration_ms) AS bestTime, MAX(score) AS bestScore FROM online_runs WHERE player_id = ? AND category = ? AND pair_count = ? AND finished_at IS NOT NULL').bind(player.id,run.category,run.pair_count).first();
   const saved=await db.prepare('UPDATE online_runs SET finished_at = ?, duration_ms = ?, score = ?, moves = ?, best_combo = ? WHERE id = ? AND player_id = ? AND finished_at IS NULL RETURNING id, score, duration_ms, moves, best_combo').bind(finishedAt,durationMs,checked.score,checked.moves,checked.bestCombo,run.id,player.id).first();
   const row=saved||await db.prepare('SELECT id, score, duration_ms, moves, best_combo FROM online_runs WHERE id = ?').bind(run.id).first();return json({id:row.id,score:row.score,durationMs:row.duration_ms,moves:row.moves,bestCombo:row.best_combo,newTimeBest:!!saved&&(previous?.bestTime==null||durationMs<previous.bestTime),newScoreBest:!!saved&&(previous?.bestScore==null||checked.score>previous.bestScore)});
  }
  if(path==='/api/leaderboard'&&request.method==='GET'){
   const ch=challenge(url.searchParams.get('category')||'all',url.searchParams.get('count')||'8'),mode=url.searchParams.get('mode')==='score'?'score':'time';
   const order=mode==='score'?'score DESC, duration_ms ASC, finished_at ASC':'duration_ms ASC, score DESC, finished_at ASC';
   const bestSQL=`WITH best AS (SELECT player_id, score, duration_ms, moves, best_combo, finished_at, ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY ${order}) AS personal_rank FROM online_runs WHERE category = ? AND pair_count = ? AND finished_at IS NOT NULL), ranked AS (SELECT *, RANK() OVER (ORDER BY ${mode==='score'?'score DESC, duration_ms ASC':'duration_ms ASC, score DESC'}) AS world_rank FROM best WHERE personal_rank = 1)`;
   const player=await currentPlayer(request,db,false);
   const [result,total,personal]=await Promise.all([
    db.prepare(`${bestSQL} SELECT p.id AS playerId, p.nickname, b.world_rank AS rank, b.score, b.duration_ms AS durationMs, b.moves, b.best_combo AS bestCombo FROM ranked b JOIN online_players p ON p.id = b.player_id ORDER BY ${order} LIMIT 20`).bind(ch.category,ch.pairCount).all(),
    db.prepare(`${bestSQL} SELECT COUNT(*) AS participants FROM ranked`).bind(ch.category,ch.pairCount).first(),
    player?db.prepare(`${bestSQL} SELECT world_rank AS rank, score, duration_ms AS durationMs FROM ranked WHERE player_id = ?`).bind(ch.category,ch.pairCount,player.id).first():Promise.resolve(null)
   ]);
   return json({mode,category:ch.category,pairCount:ch.pairCount,rows:result.results,participants:total?.participants||0,personal});
  }
  return json({error:'Not found'},404);
 }catch(e){return json({error:e.status?e.message:'ランキングを読み込めませんでした。もう一度試してください。'},e.status||503);}
}
