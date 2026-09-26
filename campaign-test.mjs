import assert from 'node:assert/strict';
import {CATALOG,DIFFICULTIES,createCourse,count} from './courses.js';
import {newGame,step,surfaceAt,opponentPosition} from './physics.js';
assert.equal(CATALOG.length,25);assert.equal(new Set(CATALOG.map(c=>c.name)).size,25);
assert.deepEqual(Object.values(DIFFICULTIES).map(r=>r.lives),[5,3,1]);
let played=0;
for(const def of CATALOG){
 const standard=createCourse(def.id,'standard');
 for(const difficulty of Object.keys(DIFFICULTIES)){
  const course=createCourse(def.id,difficulty),rule=DIFFICULTIES[difficulty];assert.equal(course.lives,rule.lives);assert.equal(course.sections,standard.sections*rule.length);assert.equal(course.hazards.length,count(def.baseline.hazards,rule.hazards));assert.equal(course.features.length,count(def.baseline.features,rule.features));assert.equal(course.opponents.length,count(def.baseline.opponents,rule.opponents));
  assert(course.tiles.length>7||def.id===1);assert(course.checkpoints.every(p=>surfaceAt(p.x,p.z,course)));
  // A numerical controller follows the center corridor under the real step integrator,
  // hazards and moving rivals. This is a simulated path, not proof of human/R1 play.
  let s=newGame(course);for(let k=0;k<course.seconds*60&&s.status==='playing';k++){
   const targetZ=Math.min(course.goal.z,s.z+2.8),j=Math.min(course.sections,Math.max(0,Math.round(targetZ/6)));
   const targetX=course.centers[j];let x=Math.max(-1,Math.min(1,(targetX-s.x)*.65-s.vx*.2)),z=Math.max(-1,Math.min(1,(4.3-s.vz)*.35));
   s=step(s,{x,z},1/60,course);
  }
  assert.equal(s.status,'finished',`${def.id} ${difficulty}: ${s.status} at ${s.z.toFixed(1)} / ${course.goal.z}, x ${s.x.toFixed(1)} falls ${s.falls}`);played++;
 }
}
let c=createCourse(1,'pro'),s=newGame(c);s={...s,x:30,z:0};s=step(s,{},1/60,c);assert.equal(s.lives,0);for(let k=0;k<42;k++)s=step(s,{},1/60,c);assert.equal(s.status,'out');
let bomb=c.hazards.find(h=>h.kind==='bomb');let b={...newGame(c),x:bomb.x,z:bomb.z-1.1,vz:8};for(let i=0;i<12&&b.lives===1;i++)b=step(b,{},1/60,c);assert.equal(b.lives,0,'bomb collision costs life');
let f=c.features[0],bonus={...newGame(c),x:f.x,z:f.z};bonus=step(bonus,{},1/60,c);assert(bonus.collected.length>0,'feature acquired');
let finish={...newGame(c),x:c.goal.x,z:c.goal.z-1.6,vz:5};finish=step(finish,{},1/30,c);assert.equal(finish.status,'finished');assert.equal(step(finish,{},1/30,c).status,'finished');
console.log(`Simulated ${played} of 75 course/level paths; matrix, collisions, bonuses, life and finish transitions passed`);
