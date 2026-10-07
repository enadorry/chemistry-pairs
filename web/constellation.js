(()=>{
 const canvas=document.getElementById('constellation'),ctx=canvas.getContext('2d');if(!ctx)return;
 const colors=['#8052ff','#ffb829','#15846e','#d46ba9','#6b8cef','#a186ff'];
 let seed=41;const random=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
 const particles=Array.from({length:760},(_,i)=>{const side=i%2?1:-1;const az=random()*Math.PI*2;const elevation=Math.acos(2*random()-1);const radius=.65+random()*.35;return {x:side*.31+Math.cos(az)*Math.sin(elevation)*.55*radius,y:Math.sin(az)*Math.sin(elevation)*.8*radius,z:Math.cos(elevation)*.48*radius,color:colors[i%colors.length],size:.6+random()*.8,phase:random()*Math.PI*2};});
 let w=1,h=1,raf=0,time=0,visible=true,last=0;
 function draw(){ctx.clearRect(0,0,w,h);const scale=Math.min(w*.47,h*.42);const angle=.25+Math.sin(time*.18)*.24;for(const p of particles){const x=p.x*Math.cos(angle)+p.z*Math.sin(angle),z=-p.x*Math.sin(angle)+p.z*Math.cos(angle);const px=w/2+x*scale,py=h/2+(p.y+Math.sin(time*.5+p.phase)*.018)*scale;const size=p.size*(1+z*.4);ctx.globalAlpha=.35+(z+.7)*.4;ctx.strokeStyle=p.color;ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(px,py-size*1.25);ctx.lineTo(px+size,py+size);ctx.lineTo(px-size,py+size);ctx.closePath();ctx.stroke();}ctx.globalAlpha=1;}
 function allowed(){return visible&&!document.hidden&&FX.motion();}
 function tick(ts){raf=0;if(!allowed()){draw();return;}time+=last?Math.min((ts-last)/1000,.06):0;last=ts;draw();raf=requestAnimationFrame(tick);}
 function update(){if(raf){cancelAnimationFrame(raf);raf=0;}last=0;draw();if(allowed())raf=requestAnimationFrame(tick);}
 function resize(){const r=canvas.getBoundingClientRect();w=Math.max(1,r.width);h=Math.max(1,r.height);const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);update();}
 if(typeof ResizeObserver==='function')new ResizeObserver(resize).observe(canvas);else window.addEventListener('resize',resize);
 if(typeof IntersectionObserver==='function')new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update();}).observe(canvas);
 document.addEventListener('visibilitychange',update);document.getElementById('fx-motion').addEventListener('change',update);
 if(typeof matchMedia==='function')matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',update);
 resize();
})();
