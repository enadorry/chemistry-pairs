const Tables=(()=>{
 let panels={},lists={},headings={};
 function build(){
  panels={};lists={};headings={};
  for(const type of ['name','formula']){
   const panel=document.createElement('section');panel.className='learning-table';
   const heading=document.createElement('h3');heading.className='learning-table-heading';
   heading.id=type==='name'?'nameTableHeading':'structureTableHeading';
   panel.setAttribute('aria-labelledby',heading.id);
   const list=document.createElement('div');list.className='learning-table-list';
   panel.appendChild(heading);panel.appendChild(list);$('board').appendChild(panel);
   panels[type]=panel;lists[type]=list;headings[type]=heading;
  }
 }
 function append(wrap,type){lists[type].appendChild(wrap);}
 function counts(){for(const type of ['name','formula'])headings[type].textContent=(type==='name'?'物質名':'構造式')+' · 残り'+cards.filter((c,i)=>c.type===type&&!matched.has(i)).length;}
 function shuffleRemaining(){
  for(const type of ['name','formula']){
   const active=[...lists[type].children].filter(w=>!matched.has(cardWraps.indexOf(w)));
   const order=shuffle(active);
   if(order.length>1&&order.every((w,i)=>w===active[i]))order.push(order.shift());
   for(const wrap of order)lists[type].appendChild(wrap);
   lists[type].scrollTop=0;
  }
 }
 return {build,append,counts,shuffleRemaining};
})();
