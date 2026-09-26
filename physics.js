import {COURSE} from './courses.js';
export {COURSE} from './courses.js';
export const TUNE={force:11,gravity:16,resistance:1.45,traction:5.2,maxSpeed:11,restitution:.43,radius:.42,fallPenalty:4};
export const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export function surfaceAt(x,z,course=COURSE){let best=null,score=Infinity;for(const t of course.tiles){if(Math.abs(x-t.x)<=t.w/2&&Math.abs(z-t.z)<=t.l/2){const d=((x-t.x)/t.w)**2+((z-t.z)/t.l)**2;if(d<score){best=t;score=d}}}return best}
export function newGame(course=COURSE){return {x:course.spawn.x,z:course.spawn.z,y:.42,vx:0,vz:0,vy:0,remaining:course.seconds,checkpoint:0,falls:0,lives:course.lives,status:'playing',fallTime:0,roll:0,elapsed:0,jumpHeight:0,jumpVelocity:0,collected:[],shield:0,boost:0,invulnerable:0}}
export function opponentPosition(o,elapsed){return {x:o.x+Math.sin(elapsed*1.6+o.phase)*.48,z:o.z+Math.sin(elapsed*1.2+o.phase)*.4}}
export function step(s,input,dt,course=COURSE){
  if(s.status!=='playing')return {...s};dt=clamp(dt,0,1/30);let n={...s},t=surfaceAt(n.x,n.z,course),mag=Math.hypot(input.x||0,input.z||0)||1;
  const ax=clamp((input.x||0)/mag,-1,1)*TUNE.force*Math.min(1,mag),az=clamp((input.z||0)/mag,-1,1)*TUNE.force*Math.min(1,mag);
  n.remaining=Math.max(0,n.remaining-dt);n.elapsed+=dt;n.invulnerable=Math.max(0,n.invulnerable-dt);n.boost=Math.max(0,n.boost-dt);
  if(n.remaining===0){n.status='timeout';return n}
  if(n.fallTime>0){n.fallTime-=dt;n.vy-=TUNE.gravity*dt;n.y+=n.vy*dt;n.x+=n.vx*dt;n.z+=n.vz*dt;
    if(n.fallTime<=0){if(n.lives<=0){n.status='out';return n}const cp=n.checkpoint?course.checkpoints[n.checkpoint-1]:course.spawn;Object.assign(n,{x:cp.x,z:cp.z,y:(surfaceAt(cp.x,cp.z,course)?.h||0)+TUNE.radius,vx:0,vz:0,vy:0,fallTime:0,jumpHeight:0,jumpVelocity:0,invulnerable:1.2});n.remaining=Math.max(0,n.remaining-TUNE.fallPenalty);if(n.remaining===0)n.status='timeout'}return n}
  if(input.jump&&n.jumpHeight===0){n.jumpVelocity=5.4;n.jumpHeight=.01}
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
    if(p.kind==='bomb'&&n.invulnerable===0){if(n.shield){n.shield=0;n.invulnerable=1}else {n.lives--;n.falls++;n.fallTime=.65;n.vy=0;return n}}
    const nx=dx/(d||1),nz=dz/(d||1);px=p.x+nx*limit;pz=p.z+nz*limit;const vn=n.vx*nx+n.vz*nz;if(vn<0){n.vx-=(1+TUNE.restitution)*vn*nx;n.vz-=(1+TUNE.restitution)*vn*nz}
  }
  n.x=px;n.z=pz;n.roll+=Math.hypot(n.vx,n.vz)*dt/TUNE.radius;const next=surfaceAt(n.x,n.z,course);
  if(!next){n.fallTime=.65;n.vy=0;n.falls++;n.lives--;return n}
  n.y=next.h+next.dx*(n.x-next.x)+next.dz*(n.z-next.z)+TUNE.radius+n.jumpHeight;
  course.checkpoints.forEach((cp,i)=>{if(i===n.checkpoint&&Math.hypot(n.x-cp.x,n.z-cp.z)<1.3)n.checkpoint=i+1});
  for(let i=0;i<course.features.length;i++){const f=course.features[i];if(!n.collected.includes(i)&&Math.hypot(n.x-f.x,n.z-f.z)<f.r+TUNE.radius){n.collected=[...n.collected,i];if(f.effect==='time')n.remaining+=8;else if(f.effect==='shield')n.shield=1;else n.boost=2.5}}
  if(next.kind==='goal'&&Math.abs(n.x-course.goal.x)<next.w/2-.3&&n.z>=course.goal.z-1.5)n.status='finished';return n;
}
