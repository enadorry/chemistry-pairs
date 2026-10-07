const $=id=>document.getElementById(id);
const shuffle=items=>{const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function showFormula(c){return structureSVG(c);}
function isPair(a,b){return a.type!==b.type&&a.compound.id===b.compound.id;}
let inspectedCard=null,inspectionEpoch=-1;
function cardIsOpen(i){return !!cards[i]&&(tableMode||chosen.includes(i)||pendingClose.has(i)||matched.has(i)||cards[i].hint);}
function syncInspection(){
 const dialog=$('structureDialog');if(!dialog.open)return;
 if(inspectionEpoch!==epoch||inspectedCard===null||!cardIsOpen(inspectedCard)){dialog.close();inspectedCard=null;return;}
 const selected=chosen.includes(inspectedCard),taken=matched.has(inspectedCard);
 $('selectDiagramCard').disabled=selected||taken||locked||finished;
 $('selectDiagramCard').textContent=taken?'獲得済みのカード':selected?'選択中のカード':'このカードを選ぶ';
}
function enlargeCard(i){
 if(!cardIsOpen(i))return;
 inspectedCard=i;inspectionEpoch=epoch;
 const card=cards[i],c=card.compound;
 $('diagramTitle').textContent=card.type==='formula'?'構造式':'物質名';
 $('largeDiagram').innerHTML=card.type==='formula'?showFormula(c):`<div class="large-card-name">${escapeHTML(c.name)}${c.alias?`<small>${escapeHTML(c.alias)}</small>`:''}</div>`;
 $('largeDiagram').scrollLeft=0;$('largeDiagram').scrollTop=0;
 if(!$('structureDialog').open)$('structureDialog').showModal();
 syncInspection();
}
function activateCard(i){if(tableMode){flip(i);return;}if(cardIsOpen(i))enlargeCard(i);else flip(i);}
function bindCardInput(btn,i){
 let timer=0,suppressClick=false,startX=0,startY=0;
 const cancel=()=>{clearTimeout(timer);timer=0;};
 btn.addEventListener('click',()=>{if(suppressClick){suppressClick=false;return;}activateCard(i);});
 btn.addEventListener('pointerdown',event=>{
  cancel();suppressClick=false;
  if(!tableMode||locked||finished||matched.has(i)||event.button!==0||event.isPrimary===false)return;
  startX=event.clientX;startY=event.clientY;const token=epoch;
  timer=setTimeout(()=>{timer=0;if(token!==epoch||!tableMode||locked||finished||matched.has(i))return;suppressClick=true;enlargeCard(i);},450);
 });
 btn.addEventListener('pointermove',event=>{if(Math.hypot(event.clientX-startX,event.clientY-startY)>10)cancel();});
 btn.addEventListener('pointerup',cancel);btn.addEventListener('pointercancel',cancel);
 btn.addEventListener('contextmenu',event=>{if(tableMode){event.preventDefault();if(!locked&&!finished&&!matched.has(i))enlargeCard(i);}});
 btn.addEventListener('keydown',event=>{if(tableMode&&event.key==='F2'){event.preventDefault();enlargeCard(i);}});
}
$('closeDiagram').onclick=()=>$('structureDialog').close();
let backdropPress=false;
function isDiagramBackdrop(event){
 const dialog=$('structureDialog'),box=dialog.getBoundingClientRect();
 return event.target===dialog&&(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom);
}
$('structureDialog').addEventListener('pointerdown',event=>{backdropPress=isDiagramBackdrop(event);});
$('structureDialog').addEventListener('pointercancel',()=>{backdropPress=false;});
$('structureDialog').addEventListener('click',event=>{
 const dismiss=backdropPress&&isDiagramBackdrop(event);backdropPress=false;
 if(dismiss)$('structureDialog').close();
});
$('structureDialog').addEventListener('close',()=>{inspectedCard=null;backdropPress=false;});
$('selectDiagramCard').onclick=()=>{
 const i=inspectedCard;
 if(inspectionEpoch!==epoch||i===null||!cardIsOpen(i)||locked||finished||matched.has(i)||chosen.includes(i))return;
 $('structureDialog').close();inspectedCard=null;flip(i);
};
let pendingClose=new Set();
let cards=[],chosen=[],matched=new Set(),moves=0,started=0,finished=false,locked=false,epoch=0,activeMode='structure',score=0,combo=0,bestCombo=0,boardEpoch=-1;
let tableMode=false,cardWraps=[],tablePending=new Set(),tableMistakes=new Map();
function getCardWrap(i){return cardWraps[i];}
let party=false,players=[],turn=0,rankSession=null,rankAttempts=[],startRequest=0;
let assistCount=0,assistDeadline=0,assistSerial=0;
const HELP_GOAL=3;
let soloHelp={pairs:0,misses:0};
function helpProgress(){return party?players[turn]?.help:soloHelp;}
function helpReady(){const h=helpProgress();return !!h&&(h.pairs>=HELP_GOAL||h.misses>=HELP_GOAL);}
function earnHelp(kind){if(tableMode||rankSession||assistDeadline)return;const h=helpProgress();if(h)h[kind]=Math.min(HELP_GOAL,h[kind]+1);}
const playerColors=['#8052ff','#15846e','#ce6437','#477fce','#b94f8a','#8b7824','#586986','#914ec2'];
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let nicknames=Array.from({length:8},(_,i)=>'プレイヤー'+(i+1));
try{const saved=JSON.parse(localStorage.getItem('chem-party-names'));if(Array.isArray(saved))saved.slice(0,8).forEach((n,i)=>{if(typeof n==='string')nicknames[i]=n.slice(0,16);});}catch{}
function nameFields(){$('nameFields').innerHTML='';const n=Number($('playerCount').value);for(let i=0;i<n;i++){const label=document.createElement('label');label.textContent=(i+1)+'人目のニックネーム';const input=document.createElement('input');input.id='nickname'+i;input.type='text';input.maxLength=16;input.value=nicknames[i];input.placeholder='プレイヤー'+(i+1);input.setAttribute('autocomplete','off');input.oninput=()=>{nicknames[i]=input.value.slice(0,16);};label.appendChild(input);$('nameFields').appendChild(label);}}
function setupMode(){const multi=$('playMode').value==='party';$('playerSetup').hidden=!multi;$('playerCountLabel').hidden=!multi;const ranked=$('playMode').value==='rank';Online.setMode(ranked);}
$('playerCount').onchange=nameFields;$('playMode').onchange=setupMode;nameFields();setupMode();
function playerScores(){ $('scoreboard').hidden=!party;if(!party)return;$('scoreboard').innerHTML='';players.forEach((player,i)=>{const row=document.createElement('div');row.className='player-score'+(i===turn&&!finished?' current':'');row.style.setProperty('--player-color',playerColors[i]);const name=document.createElement('span');name.className='player-name';name.textContent=(i===turn&&!finished?'▶ ':'')+player.name;const count=document.createElement('strong');count.textContent=player.pairs+'ペア';const points=document.createElement('small');points.textContent=(player.pairs*100)+'点';row.appendChild(name);row.appendChild(count);row.appendChild(points);$('scoreboard').appendChild(row);});}
function gateTurn(first=false){locked=true;$('turnGate').hidden=false;$('turnName').textContent=(turn+1)+'番 · '+players[turn].name;$('beginTurn').textContent=players[turn].name+'の番を始める';$('status').textContent=first?'最初のプレイヤーの準備ができたら、番を始めてください。':players[turn].name+'に交代です。';playerScores();render();}
$('beginTurn').onclick=()=>{if(!party||!started||finished||$('turnGate').hidden)return;$('turnGate').hidden=true;pendingClose.forEach(i=>cards[i].wrong=false);pendingClose.clear();locked=false;combo=0;FX.unlock();FX.play('start');$('gameTitle').textContent=players[turn].name+'の番';$('status').textContent='物質名と構造式を1枚ずつ選ぼう。正解なら続けて挑戦！';render();};
function tableReviewHTML(){
 if(!tableMistakes.size)return '<section class="table-review"><h3>間違えた組み合わせ</h3><p>今回は間違いなし！ 全組正解です。</p></section>';
 const total=[...tableMistakes.values()].reduce((n,m)=>n+m.count,0);
 const rows=[...tableMistakes.values()].map(m=>`<article class="review-item"><h4>${escapeHTML(m.name.name)} <small>${m.count}回ミス</small></h4><div class="review-diagrams"><div class="review-answer incorrect"><p>選んだ構造式：${escapeHTML(m.formula.name)}</p>${showFormula(m.formula)}</div><div class="review-answer correct"><p>正しい構造式：${escapeHTML(m.name.name)}</p>${showFormula(m.name)}</div></div></article>`).join('');
 return `<section class="table-review"><h3>間違えた組み合わせを復習</h3><p>${total}回のミス · ${tableMistakes.size}種類の組み合わせ</p>${rows}</section>`;
}
function finishResult(){const duration=formatTime(Date.now()-started);$('result').hidden=false;if(party){const ranking=players.map((p,i)=>({...p,index:i})).sort((a,b)=>b.pairs-a.pairs);const high=ranking[0].pairs;const winners=ranking.filter(p=>p.pairs===high);const title=winners.length>1?'引き分け！':winners[0].name+'の勝利！';let rank=1;const rows=ranking.map((p,i)=>{if(i&&p.pairs!==ranking[i-1].pairs)rank=i+1;return `<div class="rank-row ${p.pairs===high?'winner':''}"><span>${rank}位</span><strong>${escapeHTML(p.name)}</strong><span>${p.pairs}ペア · ${p.pairs*100}点</span></div>`;}).join('');$('result').innerHTML=`<p class="eyebrow">MATCH COMPLETE</p><h2>${escapeHTML(title)}</h2><div class="rankings">${rows}</div><p>全${cards.length/2}ペア / ${moves}回 / ${duration} / お助け ${assistCount}回</p><button class="primary" id="again">もう一度対戦する ↗</button><p class="rematch-note">次の対戦は先頭の人から始まります。人数や名前を変えるときは上の設定へ。</p>`;$('gameTitle').textContent='対戦終了';playerScores();}else{$('result').innerHTML=`<p class="eyebrow">SESSION COMPLETE</p><h2>${tableMode?`全${cards.length/2}組の対応を確認！`:`おつかれさま。全${cards.length/2}ペア正解！`}</h2><div class="final-score">${score.toLocaleString()}<small>POINTS</small></div><p>${moves}回 / ${duration} / お助け ${assistCount}回</p><p>最高 ${bestCombo}コンボ ${assistCount===0&&moves===cards.length/2?'· パーフェクト！ ✦':''}</p>${tableMode?tableReviewHTML():''}<button class="primary" id="again">もう一度、違う並びで ↗</button>`;}Shizuku.celebrateResult?.($('result'));$('again').onclick=start;if(rankSession){const session={...rankSession},attempts=rankAttempts.map(p=>[...p]),token=epoch;const record=document.createElement('div');record.id='rankResult';record.className='rank-result';$('result').appendChild(record);Online.save(session,attempts,()=>epoch===token&&rankSession?.id===session.id);}CardLayout.finish();}
function formatTime(ms){const sec=Math.floor(ms/1000);return `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;}
function stats(){$('progress').textContent=`${matched.size/2} / ${cards.length/2}`;$('moves').textContent=moves;$('score').textContent=score.toLocaleString();$('bestCombo').textContent=bestCombo;const percent=matched.size/cards.length*100;$('progressFill').style.width=percent+'%';$('progressTrack').setAttribute('aria-valuenow',String(Math.round(percent)));$('timer').textContent=started?formatTime(Date.now()-started):'0:00';}
function render(){
 const rebuild=boardEpoch!==epoch;
 if(rebuild){$('board').innerHTML='';boardEpoch=epoch;cardWraps=[];$('board').classList.toggle('table-board',tableMode);if(tableMode)Tables.build();}
 cards.forEach((card,i)=>{
  let wrap,btn;
  if(rebuild){wrap=document.createElement('div');wrap.className='card-wrap deal-in';wrap.style.setProperty('--deal-delay',Math.min(i,15)*22+'ms');btn=document.createElement('button');bindCardInput(btn,i);wrap.appendChild(btn);cardWraps[i]=wrap;if(tableMode)Tables.append(wrap,card.type);else $('board').appendChild(wrap);}else{wrap=cardWraps[i];btn=wrap.querySelector('.card');}
  const open=tableMode||chosen.includes(i)||pendingClose.has(i)||matched.has(i)||card.hint;
  wrap.hidden=tableMode&&matched.has(i)&&!tablePending.has(i);
  const state=matched.has(i)?'matched':card.wrong?'wrong':open?'open':'back';
  const changed=btn.dataset.state!==state;
  if(changed){const prior=btn.dataset.state;btn.className='card '+state+(open?' open':'')+(!rebuild&&state==='open'&&prior==='back'?' flip-in':'')+(!rebuild&&state==='back'&&prior!=='back'?' flip-close':'');btn.dataset.state=state;
   btn.innerHTML=open?`<span class="kind">${card.type==='name'?'物質名':'構造式'}</span>`+(card.type==='name'?`<span class="name">${card.compound.name}</span>${card.compound.alias?`<span class="alias">${card.compound.alias}</span>`:''}`:showFormula(card.compound)):`<span class="symbol">✳</span><span class="num">${String(i+1).padStart(2,'0')}</span>`;

  }
  btn.classList.toggle('selected',chosen.includes(i));
  btn.setAttribute('aria-pressed',String(chosen.includes(i)));
  btn.classList.toggle('inspectable',!!open&&!tableMode);
  btn.title=tableMode?'タップで選ぶ · 長押しで拡大':'';
  btn.disabled=tableMode?(matched.has(i)||locked||finished):!open&&(locked||finished);
  if(tableMode)btn.setAttribute('aria-label',(card.type==='name'?card.compound.name:'構造式')+'を選ぶ。長押しで拡大');
  else btn.setAttribute('aria-label',open?(card.type==='name'?card.compound.name+'、タップで拡大':'構造式、タップで拡大'):`伏せたカード ${i+1}`);
 });
 if(tableMode)Tables.counts();
 syncInspection();
 $('hint').hidden=tableMode;
 $('listToggle').disabled=!!rankSession&&!finished;
 const ready=helpReady(),help=helpProgress()||{pairs:0,misses:0};
 $('hint').disabled=!!rankSession||!started||finished||locked||chosen.length>0||pendingClose.size>0||assistDeadline>0||!ready;
 $('hint').classList.toggle('help-ready',ready&&!rankSession&&!assistDeadline&&!finished);
 $('helpMeter').hidden=!!rankSession||tableMode;
 $('helpMeter').dataset.ready=String(ready&&!assistDeadline&&!finished);
 $('helpMeter').textContent=finished?'':assistDeadline?'公開中も得点OK · 次のお助けカウントは一時停止':ready?'✦ お助け使用OK！ ボタンで5秒公開':`あと${HELP_GOAL-help.pairs}ペア獲得 または${HELP_GOAL-help.misses}回ミスで使用可`;
 $('hint').textContent=rankSession?'記録挑戦はお助けなし':assistDeadline>0?`お助け中 ${Math.max(0,Math.ceil((assistDeadline-Date.now())/1000))}秒`:'5秒お助け';
}
function endAssist(){
 assistSerial++;assistDeadline=0;
 cards.forEach(c=>c.hint=false);
 $('board').classList.remove('assist-reveal');
}
function assistReveal(){
 if(tableMode||rankSession||!started||finished||locked||chosen.length||pendingClose.size||assistDeadline||!helpReady())return;
 const help=helpProgress();help.pairs=0;help.misses=0;
 assistCount++;combo=0;$('comboBanner').textContent='';
 cards.forEach(c=>c.hint=true);
 $('board').classList.add('assist-reveal');
 Shizuku.react('help');FX.unlock();FX.play('start');
 assistDeadline=Date.now()+5000;
 const token=epoch,serial=++assistSerial;
 function tick(){
  if(token!==epoch||serial!==assistSerial||finished)return;
  const seconds=Math.max(0,Math.ceil((assistDeadline-Date.now())/1000));
  if(seconds===0){
   endAssist();
   if(!locked&&!chosen.length)$('status').textContent='お助け終了！ 覚えたペアを探そう。';
   render();return;
  }
  if(!locked&&!chosen.length)$('status').textContent=`✦ お助け中もペアを取れるよ！ あと${seconds}秒`;
  render();setTimeout(tick,Math.min(1000,assistDeadline-Date.now()));
 }
 tick();
}
function flip(i){
 if(locked||finished||matched.has(i)||pendingClose.has(i))return;
 if(tableMode&&chosen.includes(i)){chosen=[];render();$('status').textContent='物質名と構造式を、それぞれの表から選ぼう。';return;}
 if(chosen.includes(i))return;
 if(tableMode&&chosen.length&&cards[chosen[0]].type===cards[i].type)chosen=[];
 FX.unlock();FX.play('flip');chosen.push(i);render();
 if(chosen.length<2){$('status').textContent='もう1枚。物質名と式を組み合わせよう。';return;}
 moves++;locked=true;
 const [a,b]=chosen;if(rankSession)rankAttempts.push([a,b]);const token=epoch;
 if(isPair(cards[a],cards[b],activeMode)){
  earnHelp('pairs');if(tableMode){tablePending.add(a);tablePending.add(b);}matched.add(a);matched.add(b);chosen=[];locked=false;combo++;bestCombo=Math.max(bestCombo,combo);
  const points=party?100:100*Math.min(combo,5);score+=points;
  if(party){players[turn].pairs++;playerScores();}
  $('status').textContent=`正解！ ${cards[a].type==='name'?cards[a].compound.name:cards[b].compound.name}`;stats();
  if(matched.size===cards.length){endAssist();finished=true;$('status').textContent='すべてのペアがそろいました！';finishResult();}
  render();FX.match([a,b],combo,points);if(finished)FX.win();
  if(tableMode&&!finished){tablePending.clear();Tables.shuffleRemaining();render();}
 }else{
  earnHelp('misses');
  if(party)endAssist();
  combo=0;$('comboBanner').textContent='';FX.play('miss');cards[a].wrong=cards[b].wrong=true;
  $('status').textContent=cards[a].type===cards[b].type?'物質名と構造式を1枚ずつ選んでね。':tableMode?'この組み合わせは違います。式の特徴を見て、もう一度。':'この組み合わせは違います。位置を覚えて、もう一度。';
  stats();render();
  if(tableMode){
   const name=cards[a].type==='name'?cards[a].compound:cards[b].compound,formula=cards[a].type==='formula'?cards[a].compound:cards[b].compound;
   const key=name.id+':'+formula.id,previous=tableMistakes.get(key);tableMistakes.set(key,{name,formula,count:(previous?.count||0)+1});
   const versions=[a,b].map(i=>cards[i].wrongVersion=(cards[i].wrongVersion||0)+1);
   chosen=[];locked=false;render();
   setTimeout(()=>{if(token!==epoch)return;[a,b].forEach((i,k)=>{if(cards[i].wrongVersion===versions[k])cards[i].wrong=false;});render();},350);
   return;
  }
  pendingClose.add(a);pendingClose.add(b);const closeVersions=[a,b].map(i=>cards[i].wrongVersion=(cards[i].wrongVersion||0)+1);chosen=[];locked=false;
  if(party){turn=(turn+1)%players.length;gateTurn();}else render();
  setTimeout(()=>{
   if(token!==epoch)return;
   [a,b].forEach((i,k)=>{if(cards[i].wrongVersion===closeVersions[k]&&pendingClose.delete(i))cards[i].wrong=false;});
   render();
  },1400);
 }
}
function startGame(serverRun=null){tableMode=!serverRun&&$('playMode').value==='tables';tablePending=new Set();tableMistakes=new Map();party=$('playMode').value==='party';players=party?Array.from({length:Number($('playerCount').value)},(_,i)=>({name:(nicknames[i]||'').trim().slice(0,16)||'プレイヤー'+(i+1),pairs:0,help:{pairs:0,misses:0}})):[];soloHelp={pairs:0,misses:0};turn=0;$('turnGate').hidden=true;try{localStorage.setItem('chem-party-names',JSON.stringify(nicknames));}catch{}FX.clear();FX.unlock();FX.play('start');epoch++;endAssist();assistCount=0;score=0;combo=0;bestCombo=0;const pool=compounds.filter(c=>$('category').value==='all'||c.category===$('category').value);const n=serverRun?serverRun.pairCount:$('count').value==='all'?pool.length:Math.min(Number($('count').value),pool.length);activeMode='structure';cards=serverRun?serverRun.deck.map(c=>({type:c.type,compound:compounds[c.id]})):shuffle(shuffle(pool).slice(0,n).flatMap(c=>[{type:'name',compound:c},{type:'formula',compound:c}]));chosen=[];pendingClose=new Set();matched=new Set();moves=0;finished=false;locked=false;started=Date.now();$('result').hidden=true;$('gameTitle').textContent=`${n}ペアで練習`;$('status').textContent='物質名と対応する構造式を1枚ずつ選んでね。';$('start').textContent='新しくはじめる ↗';stats();playerScores();render();if(party)gateTurn(true);if(rankSession){$('gameTitle').textContent=Online.current().nickname+' · 記録に挑戦';$('status').textContent='ヒントなしでクリアして、タイムとスコアを登録しよう！';$('list').hidden=true;$('listToggle').disabled=true;}if(tableMode){$('gameTitle').textContent=`${n}組の対応を覚える`;$('status').textContent='物質名と構造式を1つずつタップ！ 長押しで拡大できます。';Tables.shuffleRemaining();}CardLayout.enter(cards.length);}
async function start(){const request=++startRequest;if($('playMode').value!=='rank'){rankSession=null;rankAttempts=[];$('listToggle').disabled=false;startGame();return;}const profile=Online.current();if(!profile){Online.needRegistration();return;}epoch++;endAssist();locked=true;$('turnGate').hidden=true;$('start').disabled=true;$('status').textContent='記録用のカードを準備しています…';render();try{const run=await Online.begin(profile,$('category').value,$('count').value);if(request!==startRequest||$('playMode').value!=='rank')return;rankSession={...run,token:profile.token,playerId:profile.id};rankAttempts=[];startGame(run);}catch(e){if(request===startRequest){$('status').textContent=e.message;locked=true;render();}}finally{if(request===startRequest)$('start').disabled=false;}}
$('start').onclick=start;
$('hint').onclick=assistReveal;
[...new Set(compounds.map(c=>c.category))].forEach(category=>{const option=document.createElement('option');option.value=category;option.textContent=category;$('category').appendChild(option);});
function renderList(){const query=$('search').value.trim().toLowerCase().replace(/\s/g,'');$('rows').innerHTML=compounds.filter(c=>[c.name,c.alias,c.molecular,c.category].some(v=>v.toLowerCase().includes(query))).map(c=>`<tr><td>${c.name}${c.alias?`<small>${c.alias}</small>`:''}</td><td>${structureSVG(c)}</td></tr>`).join('');}
$('listToggle').onclick=()=>{if(rankSession&&!finished)return;const visible=$('list').hidden;$('list').hidden=!visible;$('listToggle').textContent=visible?'一覧を閉じる':'一覧を開く';$('listToggle').setAttribute('aria-expanded',String(visible));if(visible)renderList();};$('search').oninput=renderList;
setInterval(()=>{if(started&&!finished)$('timer').textContent=rankSession?Online.formatTime(Date.now()-started):formatTime(Date.now()-started);},100);
// Initial board is a preview; the clock starts only on the start button.
cards=Array.from({length:16},(_,i)=>({type:i%2?'formula':'name',compound:compounds[0]}));locked=true;render();

Online.init();
