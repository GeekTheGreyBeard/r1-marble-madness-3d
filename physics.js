import {COURSE} from './courses.js';
export {COURSE} from './courses.js';
export const TUNE={force:11,gravity:16,resistance:1.45,traction:5.2,maxSpeed:11,restitution:.43,radius:.42,fallPenalty:4};
export const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export function tileHeight(t,time){return t.kind==='elevator'?1.5+1.5*Math.sin(time*1.5):0}
export function tilePosition(t,time){return {x:t.x+(t.kind==='moving'?Math.sin(time*1.3+t.id)*.85:0),z:t.z}}
export function surfaceAt(x,z,course=COURSE,time=0,collapsed=[]){let best=null,score=Infinity;for(const t of course.tiles){if(collapsed.includes(t.id))continue;const p=tilePosition(t,time);if(Math.abs(x-p.x)<=t.w/2&&Math.abs(z-p.z)<=t.l/2){const d=((x-p.x)/t.w)**2+((z-p.z)/t.l)**2;if(d<score){best=t;score=d}}}return best}
export function newGame(course=COURSE){return {x:course.spawn.x,z:course.spawn.z,y:.42,vx:0,vz:0,vy:0,remaining:course.seconds,checkpoint:0,falls:0,lives:course.lives,status:'playing',fallTime:0,roll:0,elapsed:0,jumpHeight:0,jumpVelocity:0,collected:[],shield:0,boost:0,invulnerable:0,lingering:{},collapsed:[],events:[],support:null}}
export function opponentPosition(o,elapsed){return {x:o.x+Math.sin(elapsed*1.6+o.phase)*.48,z:o.z+Math.sin(elapsed*1.2+o.phase)*.4}}
export function step(s,input,dt,course=COURSE){
 if(s.status!=='playing')return {...s};dt=clamp(dt,0,1/30);let n={...s,events:[]},t=surfaceAt(n.x,n.z,course,n.elapsed,n.collapsed),mag=Math.hypot(input.x||0,input.z||0)||1;
 if(t?.kind==='moving'&&s.support===t.id){n.x+=tilePosition(t,n.elapsed).x-tilePosition(t,s.elapsed).x}
 const ax=clamp((input.x||0)/mag,-1,1)*TUNE.force*Math.min(1,mag),az=clamp((input.z||0)/mag,-1,1)*TUNE.force*Math.min(1,mag);
 n.remaining=Math.max(0,n.remaining-dt);n.elapsed+=dt;n.invulnerable=Math.max(0,n.invulnerable-dt);n.boost=Math.max(0,n.boost-dt);
 if(n.remaining===0){n.status='timeout';n.events.push('fail');return n}
 if(n.fallTime>0){n.fallTime-=dt;n.vy-=TUNE.gravity*dt;n.y+=n.vy*dt;n.x+=n.vx*dt;n.z+=n.vz*dt;
  if(n.fallTime<=0){if(n.lives<=0){n.status='out';n.events.push('fail');return n}const cp=n.checkpoint?course.checkpoints[n.checkpoint-1]:course.spawn;Object.assign(n,{x:cp.x,z:cp.z,y:(tileHeight(surfaceAt(cp.x,cp.z,course,n.elapsed,n.collapsed)||{kind:'stone'},n.elapsed))+TUNE.radius,vx:0,vz:0,vy:0,fallTime:0,jumpHeight:0,jumpVelocity:0,invulnerable:1.2,collapsed:[],lingering:{},support:null});n.remaining=Math.max(0,n.remaining-TUNE.fallPenalty);n.events.push('respawn');if(n.remaining===0)n.status='timeout'}return n}
 if(input.jump&&n.jumpHeight===0){n.jumpVelocity=5.4;n.jumpHeight=.01;n.events.push('jump')}
 if(n.jumpHeight>0){n.jumpVelocity-=TUNE.gravity*dt;n.jumpHeight=Math.max(0,n.jumpHeight+n.jumpVelocity*dt);if(n.jumpHeight===0)n.jumpVelocity=0}
 const resting=Math.hypot(n.vx,n.vz)<.045&&Math.hypot(ax,az)<.045;if(resting){n.vx=0;n.vz=0}
 const drag=Math.exp(-TUNE.resistance*dt);
 n.vx=(n.vx+(ax-(resting?0:TUNE.gravity*(t?.dx||0)))*dt)*drag;
 n.vz=(n.vz+(az-(resting?0:TUNE.gravity*(t?.dz||0))+n.boost*2)*dt)*drag;
 if(input.brake){const stop=Math.max(0,1-12*dt);n.vx*=stop;n.vz*=stop;if(Math.hypot(n.vx,n.vz)<.045)n.vx=n.vz=0}
 const speed=Math.hypot(n.vx,n.vz);if(speed>TUNE.maxSpeed){n.vx*=TUNE.maxSpeed/speed;n.vz*=TUNE.maxSpeed/speed}
 let px=n.x+n.vx*dt,pz=n.z+n.vz*dt;
 for(const p of [...course.hazards,...course.opponents.map(o=>({...o,...opponentPosition(o,n.elapsed),kind:'opponent'}))]){
  const dx=px-p.x,dz=pz-p.z,d=Math.hypot(dx,dz),limit=p.r+TUNE.radius;if(d>=limit||n.jumpHeight>.7)continue;
  if(p.kind==='bomb'&&n.invulnerable===0){if(n.shield){n.shield=0;n.invulnerable=1;n.events.push('shield')}else {n.lives--;n.falls++;n.fallTime=.65;n.vy=0;n.events.push('bomb');return n}}
  const nx=dx/(d||1),nz=dz/(d||1);px=p.x+nx*limit;pz=p.z+nz*limit;const vn=n.vx*nx+n.vz*nz;if(vn<0){n.vx-=(1+TUNE.restitution)*vn*nx;n.vz-=(1+TUNE.restitution)*vn*nz;n.events.push('impact')}
 }
 const next=surfaceAt(px,pz,course,n.elapsed,n.collapsed);
 // Elevator is a genuine rising support: its height lifts the marble, while a raised
 // neighboring surface cannot be entered until the player jumps or rides high enough.
 if(next&&t&&tileHeight(next,n.elapsed)>tileHeight(t,n.elapsed)+n.jumpHeight+1.15&&next.id!==t.id){n.vx*=-.25;n.vz*=-.25;n.events.push('impact')}else{n.x=px;n.z=pz}
 n.roll+=Math.hypot(n.vx,n.vz)*dt/TUNE.radius;const support=surfaceAt(n.x,n.z,course,n.elapsed,n.collapsed);
 if(!support){n.fallTime=.65;n.vy=0;n.falls++;n.lives--;n.events.push('fall');return n}
 if(n.support!==support.id&&support.kind==='elevator')n.events.push('elevator');
 if(n.support!==support.id&&support.kind==='moving')n.events.push('platform');
 n.support=support.id;
 if(support.kind==='collapse'){
  const lingering={...n.lingering,[support.id]:(n.lingering[support.id]||0)+dt};n.lingering=lingering;
  if(lingering[support.id]>=2.2&&!s.events?.includes('warning')&&(s.lingering?.[support.id]||0)<2.2)n.events.push('warning');
  if(lingering[support.id]>=4.5){n.collapsed=[...n.collapsed,support.id];n.fallTime=.65;n.vy=0;n.falls++;n.lives--;n.events.push('collapse');return n}
 }
 n.y=tileHeight(support,n.elapsed)+TUNE.radius+n.jumpHeight;
 course.checkpoints.forEach((cp,i)=>{if(i===n.checkpoint&&Math.hypot(n.x-cp.x,n.z-cp.z)<1.3){n.checkpoint=i+1;n.events.push('checkpoint')}});
 for(let i=0;i<course.features.length;i++){const f=course.features[i];if(!n.collected.includes(i)&&Math.hypot(n.x-f.x,n.z-f.z)<f.r+TUNE.radius){n.collected=[...n.collected,i];if(f.effect==='time')n.remaining+=8;else if(f.effect==='shield')n.shield=1;else n.boost=2.5;n.events.push('feature')}}
 if(support.kind==='goal'&&Math.hypot(n.x-course.goal.x,n.z-course.goal.z)<1.5){n.status='finished';n.events.push('finish')}return n;
}
