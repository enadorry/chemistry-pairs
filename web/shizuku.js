const Shizuku=(()=>{
 const stage=document.getElementById('shizukuMascot'),sprite=stage.querySelector('.shizuku-sprite'),bubble=document.getElementById('shizukuSpeech');
 let reactionTimer=0,frameTimer=0,tip=0,frame=0,hover=false,busy=false,state='idle',resultStage=null,resultSprite=null,resultFrame=0,soraFrame=0;
 const rows={idle:0,listen:1,celebrate:2,wave:3};
 // Frame windows follow the actual drawings, keeping neighboring limbs outside.
 const rowOffsets=[31,409,774,1152].map(y=>y/1152*100);
 const columnOffsets=[18,268,512,768].map(x=>x/768*100);
 const tips=['物質名と構造式をペアにしよう！','CH₃やOHのまとまりを目印にしてみて。','表のカードをタップすると大きく見られるよ！','3ペア獲得か3回ミスで、お助けが使えるよ。'];
 function paint(){
  // Exact cell positions prevent interpolation through neighboring drawings.
  const reduced=!FX.motion();
  sprite.style.backgroundPosition=`${columnOffsets[reduced?0:frame]}% ${rowOffsets[reduced?0:rows[state]]}%`;
 }
 function pose(next){state=next;frame=0;stage.dataset.pose=next;paint();}
 function reset(){clearTimeout(reactionTimer);busy=false;pose('idle');}
 function tick(){
  if(FX.motion()&&!document.hidden&&!document.body.classList.contains('play-focus')){frame=(frame+1)%4;paint();}
  else if(!FX.motion()){frame=0;paint();}
  if(resultStage?.isConnected&&!resultStage.closest('[hidden]')){
   const moving=FX.motion()&&!document.hidden;resultStage.classList.toggle('is-jumping',moving);
   resultFrame=moving?(resultFrame+1)%4:0;
   soraFrame=moving?(soraFrame+1)%4:0;
   const sora=resultStage.querySelector('.sora-sprite');if(sora)sora.style.backgroundPosition=`${soraFrame%2*100}% ${Math.floor(soraFrame/2)*100}%`;
   resultSprite.style.backgroundPosition=`${columnOffsets[resultFrame]}% ${rowOffsets[2]}%`;
  }
  frameTimer=setTimeout(tick,resultStage?.isConnected?200:state==='idle'?400:200);
 }
 function react(kind,combo=1){
  const messages={match:combo>=3?`${combo}連続正解！ ひらめき大爆発！`:'正解！ 実験成功だね！',miss:'場所を覚えて、次の実験へ！',help:'5秒間の観察タイム！ ペアも取れるよ。',win:'全ペア正解！ 今日の研究、大成功！'};
  bubble.textContent=kind==='tap'?tips[tip++%tips.length]:messages[kind]||tips[0];
  clearTimeout(reactionTimer);busy=true;
  pose(FX.motion()?(kind==='tap'||kind==='match'||kind==='win'?'celebrate':'wave'):'idle');
  reactionTimer=setTimeout(()=>{busy=false;pose(hover&&FX.motion()?'wave':'idle');},1400);
 }
 function celebrateResult(result){
  result.insertAdjacentHTML('afterbegin','<div class="result-shizuku" role="img" aria-label="ShizukuちゃんとSoraちゃんが8bit風にジャンプして喜んでいます"><div class="result-pet-party" aria-hidden="true"><div class="result-shizuku-jump"><span class="shizuku-sprite"></span></div><span class="result-pet-jump pet-sora"><span class="sora-sprite"></span></span></div><p>やったー！ みんなで研究、大成功！</p></div>');
  resultStage=result.querySelector('.result-shizuku');resultSprite=resultStage.querySelector('.shizuku-sprite');resultFrame=0;soraFrame=0;
  resultSprite.style.backgroundPosition=`${columnOffsets[0]}% ${rowOffsets[2]}%`;resultStage.classList.toggle('is-jumping',FX.motion());
 }
 stage.onclick=()=>react('tap');
 stage.addEventListener('pointerenter',()=>{
  hover=true;if(!FX.motion()||busy)return;
  clearTimeout(reactionTimer);pose('listen');
  reactionTimer=setTimeout(()=>{if(hover&&!busy)pose('wave');},800);
 });
 stage.addEventListener('pointerleave',()=>{hover=false;if(!busy){clearTimeout(reactionTimer);pose('idle');}});
 document.getElementById('fx-motion').addEventListener('change',()=>{if(!FX.motion())reset();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
 if(typeof matchMedia==='function')matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{if(!FX.motion())reset();});
 pose('idle');frameTimer=setTimeout(tick,400);return {react,celebrateResult};
})();
