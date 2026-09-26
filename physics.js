// One data-driven sculptural test course. Distances are world units; y rises uphill.
export const COURSE = {
  name:'Momentum Lab', seconds:90, spawn:{x:0,z:0}, goal:{x:0,z:35},
  checkpoints:[{x:0,z:20}],
  tiles:[
    {x:0,z:3,w:10,l:10,h:0,dx:0,dz:0,kind:'start'},
    {x:0,z:10,w:5,l:6,h:1.2,dx:0,dz:.27,kind:'ramp'},
    {x:0,z:15,w:7,l:5,h:1.8,dx:0,dz:0,kind:'crest'},
    {x:2,z:20,w:8,l:7,h:1.15,dx:-.12,dz:-.2,kind:'bank'},
    {x:4,z:26,w:3.8,l:7,h:.2,dx:0,dz:-.12,kind:'bridge'},
    {x:1.8,z:31,w:8,l:6,h:0,dx:0,dz:0,kind:'turn'},
    {x:0,z:36,w:7,l:6,h:0,dx:0,dz:0,kind:'goal'}
  ],
  // Solid posts teach impact response; open edges teach recovery. No invisible perimeter.
  posts:[{x:-2.5,z:15,r:.55},{x:5.1,z:30,r:.65}]
};
export const TUNE={force:11,gravity:16,resistance:1.45,traction:5.2,maxSpeed:11,restitution:.43,radius:.42,fallPenalty:4};
export const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export function surfaceAt(x,z,course=COURSE){
  // Seam overlap is intentional: the most recently entered tile wins.
  let best=null,score=Infinity;
  for(const t of course.tiles){if(Math.abs(x-t.x)<=t.w/2&&Math.abs(z-t.z)<=t.l/2){const d=((x-t.x)/t.w)**2+((z-t.z)/t.l)**2;if(d<score){best=t;score=d}}}
  return best;
}
export function newGame(){return {x:0,z:0,y:.42,vx:0,vz:0,vy:0,remaining:COURSE.seconds,checkpoint:0,falls:0,status:'playing',fallTime:0,roll:0,elapsed:0};}
export function step(s,input,dt,course=COURSE){
  if(s.status!=='playing')return {...s};
  dt=clamp(dt,0,1/30);let n={...s},t=surfaceAt(n.x,n.z,course),mag=Math.hypot(input.x||0,input.z||0)||1;
  const ax=clamp((input.x||0)/mag,-1,1)*TUNE.force*Math.min(1,mag),az=clamp((input.z||0)/mag,-1,1)*TUNE.force*Math.min(1,mag);
  n.remaining=Math.max(0,n.remaining-dt);n.elapsed+=dt;
  if(n.remaining===0){n.status='timeout';return n}
  if(n.fallTime>0){n.fallTime-=dt;n.vy-=TUNE.gravity*dt;n.y+=n.vy*dt;n.x+=n.vx*dt;n.z+=n.vz*dt;
    if(n.fallTime<=0){const cp=n.checkpoint?course.checkpoints[n.checkpoint-1]:course.spawn;Object.assign(n,{x:cp.x,z:cp.z,y:(surfaceAt(cp.x,cp.z,course)?.h||0)+TUNE.radius,vx:0,vz:0,vy:0,fallTime:0});n.remaining=Math.max(0,n.remaining-TUNE.fallPenalty);if(n.remaining===0)n.status='timeout'}
    return n;
  }
  // Static grip holds a resting marble on modest slopes, but moving marbles still feel them.
  const resting=Math.hypot(n.vx,n.vz)<.045 && Math.hypot(ax,az)<.045;
  if(resting){n.vx=0;n.vz=0}
  // Acceleration acts on velocity, not position. Gravity resolves along the surface tangent.
  const drag=Math.exp(-TUNE.resistance*dt);
  n.vx=(n.vx+(ax-(resting?0:TUNE.gravity*(t?.dx||0)))*dt)*drag;
  n.vz=(n.vz+(az-(resting?0:TUNE.gravity*(t?.dz||0)))*dt)*drag;
  if(input.brake){const stop=Math.max(0,1-12*dt);n.vx*=stop;n.vz*=stop;if(Math.hypot(n.vx,n.vz)<.045)n.vx=n.vz=0}
  // Limited lateral grip: bank redirects only gradually, without pinning the sphere.
  const speed=Math.hypot(n.vx,n.vz);if(speed>TUNE.maxSpeed){n.vx*=TUNE.maxSpeed/speed;n.vz*=TUNE.maxSpeed/speed}
  let px=n.x+n.vx*dt,pz=n.z+n.vz*dt;
  for(const p of course.posts){const dx=px-p.x,dz=pz-p.z,d=Math.hypot(dx,dz),limit=p.r+TUNE.radius;if(d<limit){const nx=dx/(d||1),nz=dz/(d||1);px=p.x+nx*limit;pz=p.z+nz*limit;const vn=n.vx*nx+n.vz*nz;if(vn<0){n.vx-=(1+TUNE.restitution)*vn*nx;n.vz-=(1+TUNE.restitution)*vn*nz}}}
  n.x=px;n.z=pz;n.roll+=Math.hypot(n.vx,n.vz)*dt/TUNE.radius;
  const next=surfaceAt(n.x,n.z,course);
  if(!next){n.fallTime=.65;n.vy=0;n.falls++;return n}
  n.y=next.h+next.dx*(n.x-next.x)+next.dz*(n.z-next.z)+TUNE.radius;
  if(n.checkpoint===0&&Math.hypot(n.x-course.checkpoints[0].x,n.z-course.checkpoints[0].z)<2.5)n.checkpoint=1;
  if(Math.hypot(n.x-course.goal.x,n.z-course.goal.z)<1.2)n.status='finished';
  return n;
}
