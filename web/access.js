(()=>{
 const target=document.getElementById('accessCount');if(!target)return;
 async function countVisit(){try{const response=await fetch('/api/visits',{method:'POST',cache:'no-store',credentials:'same-origin'});if(!response.ok)throw new Error('Counter unavailable');const data=await response.json();if(!Number.isSafeInteger(data.count)||data.count<0)throw new Error('Invalid count');target.textContent=data.count.toLocaleString('ja-JP');target.title='カウンター追加後の累計ページ表示回数（再読み込みも1回）';}catch{target.textContent='—';target.title='アクセス数を取得できませんでした';}}
 countVisit();window.addEventListener('pageshow',event=>{if(event.persisted)countVisit();});
})();
