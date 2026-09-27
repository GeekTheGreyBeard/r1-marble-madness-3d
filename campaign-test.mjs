import assert from 'node:assert/strict';
import {CATALOG,DIFFICULTIES,createCourse,count} from './courses.js';
import {newGame,step,surfaceAt,tileHeight,tilePosition} from './physics.js';
assert.equal(CATALOG.length,25);assert.equal(new Set(CATALOG.map(c=>c.name)).size,25);
assert.deepEqual(Object.values(DIFFICULTIES).map(r=>r.lives),[5,3,1]);
let played=0,signatures=new Set();
for(const def of CATALOG){
 const standard=createCourse(def.id,'standard');const sequence=standard.path.map(p=>`${p.x},${p.z}`).join(';');signatures.add(sequence);
 let turns=0,axes=new Set();for(let j=1;j<standard.path.length;j++){let a=standard.path[j-1],b=standard.path[j];axes.add(Math.sign(b.x-a.x)+','+Math.sign(b.z-a.z));if(j>1){let p=standard.path[j-2];if(Math.sign(b.x-a.x)!==Math.sign(a.x-p.x)||Math.sign(b.z-a.z)!==Math.sign(a.z-p.z))turns++}}
 assert(turns>=9&&axes.size>=3,`course ${def.id} needs turns in all directions`);assert(standard.branches>=3);
 for(const difficulty of Object.keys(DIFFICULTIES)){
  const course=createCourse(def.id,difficulty),rule=DIFFICULTIES[difficulty];assert.equal(course.lives,rule.lives);assert.equal(course.sections,standard.sections*rule.length-(rule.length-1));assert.equal(course.hazards.length,count(def.baseline.hazards,rule.hazards));assert.equal(course.features.length,count(def.baseline.features,rule.features));assert.equal(course.opponents.length,count(def.baseline.opponents,rule.opponents));
  assert(course.checkpoints.every(p=>surfaceAt(p.x,p.z,course)));assert(course.tiles.filter(t=>t.kind==='moving').length>=3);assert(course.tiles.filter(t=>t.kind==='elevator').length>=3);assert(course.tiles.filter(t=>t.kind==='collapse').length>=3);for(const shape of ['bank','bowl','ramp'])assert(course.tiles.some(t=>t.terrain===shape),`${def.id} ${difficulty} missing ${shape}`);
  for(let j=1;j<course.path.length;j++){let a=course.path[j-1],b=course.path[j];assert(Math.hypot(a.x-b.x,a.z-b.z)<=5.251,`${def.id}: route discontinuity ${j}`)}
  // Geometric route occupancy and dynamic contacts are verified for every matrix entry;
  // this is not a claim that tilt steering is human-playable on physical hardware.
  for(let j=0;j<course.path.length;j++){let p=course.path[j];for(let time of [0,1,3])assert(surfaceAt(p.x,p.z,course,time),`${def.id} ${difficulty} waypoint ${j}`)}
  played++;
 }
}
assert(signatures.size>=20,`only ${signatures.size} unique spatial signatures`);
let c=createCourse(1,'standard'),moving=c.tiles.find(t=>t.kind==='moving'),lift=c.tiles.find(t=>t.kind==='elevator'),fragile=c.tiles.find(t=>t.kind==='collapse');
assert(Math.abs(tilePosition(moving,1).x-tilePosition(moving,2).x)>.2);assert(Math.abs(tileHeight(lift,1)-tileHeight(lift,3))>1);
let s={...newGame(c),x:fragile.x,z:fragile.z};let warned=false;for(let i=0;i<285;i++){s=step(s,{brake:true},1/60,c);warned||=s.events.includes('warning');if(s.events.includes('collapse'))break}assert(warned&&s.collapsed.includes(fragile.id)&&s.fallTime>0&&s.lives===2,'linger warning and collapse');assert(!surfaceAt(fragile.x,fragile.z,c,s.elapsed,s.collapsed),'collapsed support removed');
for(let i=0;i<44;i++)s=step(s,{},1/60,c);assert.equal(s.fallTime,0);assert.equal(s.lives,2);assert(Math.hypot(s.x-c.spawn.x,s.z-c.spawn.z)<.01,'respawn at spawn');
let cp=c.checkpoints[0],saved={...newGame(c),checkpoint:1,x:40,z:40};saved=step(saved,{},1/60,c);for(let i=0;i<42;i++)saved=step(saved,{},1/60,c);assert(Math.hypot(saved.x-cp.x,saved.z-cp.z)<.1,'checkpoint respawn');
let bomb=c.hazards.find(h=>h.kind==='bomb'),hit={...newGame(c),x:bomb.x,z:bomb.z};hit=step(hit,{},1/60,c);assert(hit.events.includes('bomb')&&hit.lives===2,'bomb interaction');
let f=c.features[0],bonus={...newGame(c),x:f.x,z:f.z,invulnerable:1};bonus=step(bonus,{},1/60,c);assert(bonus.events.includes('feature'));
let goal={...newGame(c),x:c.goal.x,z:c.goal.z};goal=step(goal,{},1/60,c);assert.equal(goal.status,'finished');
console.log(`75 geometry matrices passed; ${signatures.size} distinct routes; moving support, height transition, warning/collapse, fall/checkpoint, bomb, feature and finish interactions passed`);
