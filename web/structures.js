// Explicit atom-and-bond diagrams; hydrogen counts follow standard valences.
function structureGraph(c){
 const atoms=[],bonds=[];const add=(el,x,y)=>{atoms.push({el,x,y});return atoms.length-1};const link=(a,b,order=1)=>bonds.push({a,b,order});
 function chain(spec){const tokens=spec.match(/Cl|[CO]|[=#]/g);let previous=null,order=1,index=0;const size=tokens.filter(t=>!['=','#'].includes(t)).length;for(const t of tokens){if(t==='='||t==='#'){order=t==='='?2:3;continue;}const x=index,y=0;const current=add(t,x,y);if(previous!==null)link(previous,current,order);previous=current;order=1;index++;}}
 function branch(at,el,side=-1,order=1){const a=atoms[at];const b=add(el,a.x,a.y+side);link(at,b,order);return b;}
 const id=c.id;
 if(id<9)chain('C'.repeat(id+1));
 else if(id===9)chain('C=C');else if(id===10)chain('C=CC');else if(id===11)chain('C=CCC');
 else if(id===12||id===13||id===37||id===38){const same=id===12||id===37;add('C',0,0);add('C',1,0);link(0,1,2);const acid=id>=37;const l=add('C',-.75,-.8),r=add('C',1.75,same?-.8:.8);link(0,l);link(1,r);if(acid){let o=add('O',-1.65,-.8);link(l,o,2);o=add('O',-.75,-1.8);link(l,o);o=add('O',2.65,same?-.8:.8);link(r,o,2);o=add('O',1.75,same?-1.8:1.8);link(r,o);}}
 else if(id===14)chain('C#C');
 else if(id===15){chain('CCC');branch(1,'C');}else if(id===16){chain('CCCC');branch(1,'C');branch(2,'C');}else if(id===17){chain('CCCC');branch(1,'C');branch(1,'C',1);}
 else if(id===18)chain('CCl');else if(id===19){add('C',0,0);for(const [x,y] of [[-1,0],[1,0],[0,-1],[0,1]])link(0,add('Cl',x,y));}
 else if(id===20)chain('CO');else if(id===21){chain('CC');branch(1,'O',1);}else if(id===22){chain('CCC');branch(2,'O',1);}else if(id===23){chain('CCC');branch(1,'O',1);}
 else if(id===24){chain('CC');branch(0,'O',1);branch(1,'O',1);}else if(id===25){chain('CCC');branch(0,'O',1);branch(1,'O',1);branch(2,'O',1);}else if(id===26)chain('CCOCC');else if(id===27)chain('COC');else if(id===28)chain('CCOC');
 else if(id===29){chain('C');branch(0,'O',1,2);}else if(id===30){chain('CC');branch(1,'O',1,2);}else if(id===31){chain('CCC');branch(1,'O',1,2);}else if(id===32){chain('CCCCC');branch(2,'O',1,2);}else if(id===33){chain('CCCC');branch(2,'O',1,2);}
 else if(id===34){chain('CO');branch(0,'O',1,2);}else if(id===35){chain('CCO');branch(1,'O',1,2);}else if(id===36){chain('OCCO');branch(1,'O',1,2);branch(2,'O',1,2);}
 else if(id===39){chain('COCC');branch(0,'O',1,2);}else if(id===40){chain('COC');branch(0,'O',1,2);}else if(id===41){chain('CCOCC');branch(1,'O',1,2);}else if(id===42){chain('CCOC');branch(1,'O',1,2);}else if(id===43){chain('CCOCCC');branch(1,'O',1,2);}else if(id===44){chain('CCCO');branch(1,'O',1);branch(2,'O',1,2);}
 // Match the worksheet's planar layout: horizontal chains and vertical H/bonds.
 if(id===10||id===11){atoms[2].x=1.8;atoms[2].y=.8;if(id===11){atoms[3].x=2.8;atoms[3].y=.8;}}
 const heavyCount=atoms.length;const valence={C:4,O:2,Cl:1};
 for(let i=0;i<heavyCount;i++){
  const attached=bonds.filter(b=>b.a===i||b.b===i),h=valence[atoms[i].el]-attached.reduce((sum,b)=>sum+b.order,0);
  if(h<0)throw Error('Invalid valence '+c.name);
  let directions=[];
  if(id===14)directions=i===0?[[-.7,0]]:[[.7,0]];
  else if([12,13,37,38].includes(id)&&i<2){const same=id===12||id===37;directions=i===0?[[-.75,.8]]:[[.75,same?.8:-.8]];}
  else if((id===9||id===10||id===11)&&i===0)directions=[[-.7,-.7],[-.7,.7]];
  else if(id===9&&i===1)directions=[[.7,-.7],[.7,.7]];
  else if((id===10||id===11)&&i===1)directions=[[.7,-.7]];
  else{
   const angles=attached.map(b=>{const a=atoms[b.a===i?b.b:b.a];return Math.atan2(a.y-atoms[i].y,a.x-atoms[i].x)});
   const carbonyl=attached.some(b=>b.order===2&&atoms[b.a===i?b.b:b.a].el==='O');
   const candidates=carbonyl?[[-.7,0],[.7,0],[0,-.7],[0,.7],[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5]]:[[0,-.7],[0,.7],[-.7,0],[.7,0],[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5]];
   if(atoms[i].el==='O'&&h===1&&angles.length===1){const a=angles[0]+Math.PI;directions=[[.7*Math.cos(a),.7*Math.sin(a)]];}
   else
   directions=candidates.filter(([x,y])=>angles.every(a=>Math.acos(Math.cos(Math.atan2(y,x)-a))>.6));
  }
  if(directions.length<h)throw Error('Missing hydrogen positions '+c.name);
  for(let j=0;j<h;j++)link(i,add('H',atoms[i].x+directions[j][0],atoms[i].y+directions[j][1]));
 }
 return {atoms,bonds};
}
function displayStructure(c){
 const graph=structureGraph(c), hidden=new Set();
 const atoms=graph.atoms.map((a,i)=>{
  const adjacent=graph.bonds.filter(b=>b.a===i||b.b===i);
  const hydrogens=adjacent.map(b=>b.a===i?b.b:b.a).filter(j=>graph.atoms[j].el==='H');
  // Only the worksheet's abbreviated branches and hydroxyl groups are grouped.
  const methylIndices={10:[2],12:[2,3],13:[2,3],15:[3],16:[4,5],17:[4,5]};
  const groupedMethyl=(methylIndices[c.id]||[]).includes(i);
  const groupedOH=(c.id>=20&&c.id<=25&&a.el==='O')||(c.id===44&&i===4);
  let label=a.el;
  if((groupedMethyl||groupedOH)&&hydrogens.length){hydrogens.forEach(j=>hidden.add(j));label=groupedMethyl?'CH3':'OH';}
  return {...a,label};
 });
 return {atoms:atoms.filter((a,i)=>!hidden.has(i)),bonds:graph.bonds.filter(b=>!hidden.has(b.a)&&!hidden.has(b.b)).map(b=>({...b,start:atoms[b.a],end:atoms[b.b]}))};
}
function structureSVG(c){
 const {atoms,bonds}=displayStructure(c);const scale=60,pad=22;
 const minX=Math.min(...atoms.map(a=>a.x)),minY=Math.min(...atoms.map(a=>a.y)),maxX=Math.max(...atoms.map(a=>a.x)),maxY=Math.max(...atoms.map(a=>a.y));
 const w=(maxX-minX)*scale+pad*2,h=(maxY-minY)*scale+pad*2;
 const position=a=>({x:(a.x-minX)*scale+pad,y:(a.y-minY)*scale+pad});
 const radius=a=>a.label.length>1?Math.max(13,a.label.length*5):10;
 const lines=bonds.map(b=>{const a=position(b.start),z=position(b.end),dx=z.x-a.x,dy=z.y-a.y,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len;const offsets=b.order===1?[0]:b.order===2?[-2.6,2.6]:[-4,0,4];const r1=Math.abs(ux)>.4?radius(b.start):12,r2=Math.abs(ux)>.4?radius(b.end):12;return offsets.map(o=>`<line x1="${a.x+ux*r1-uy*o}" y1="${a.y+uy*r1+ux*o}" x2="${z.x-ux*r2-uy*o}" y2="${z.y-uy*r2+ux*o}"/>`).join('');}).join('');
 const labels=atoms.map(a=>{const p=position(a);const label=a.label.replace(/(\d+)/g,'<tspan baseline-shift="sub" font-size="12">$1</tspan>');return `<text x="${p.x}" y="${p.y}">${label}</text>`}).join('');
 return `<svg class="structure" viewBox="0 0 ${w} ${h}" role="img" aria-label="プリントに合わせて原子と結合を配置した構造式"><g stroke="currentColor" stroke-width="1.5">${lines}</g><g fill="currentColor" font-family="Georgia,serif" font-size="19" text-anchor="middle" dominant-baseline="central">${labels}</g></svg>`;
}
if(typeof module!=='undefined')module.exports={structureGraph,structureSVG,displayStructure};
