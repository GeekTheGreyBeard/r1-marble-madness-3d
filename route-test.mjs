import {CATALOG,createCourse} from './courses.js';import {newGame,step} from './physics.js';
let outcomes=[];
for(const def of CATALOG)for(const difficulty of ['beginner','standard','pro']){
 const c=createCourse(def.id,difficulty);let s=newGame(c),index=1;for(let k=0;k<c.seconds*60&&s.status==='playing';k++){
  if(index<c.path.length-1&&Math.hypot(s.x-c.path[index].x,s.z-c.path[index].z)<2.3)index++;
  let p=c.path[index],dx=p.x-s.x,dz=p.z-s.z,dist=Math.hypot(dx,dz),input={x:Math.max(-1,Math.min(1,dx*.35-s.vx*.7)),z:Math.max(-1,Math.min(1,dz*.35-s.vz*.7)),brake:dist<2&&Math.hypot(s.vx,s.vz)>2.8};s=step(s,input,1/60,c);
 }outcomes.push({id:def.id,difficulty,status:s.status,index,falls:s.falls});
}
let successes=outcomes.filter(o=>o.status==='finished');console.log(`${successes.length}/75 automated steering runs finished; failures:`,outcomes.filter(o=>o.status!=='finished').slice(0,15));
