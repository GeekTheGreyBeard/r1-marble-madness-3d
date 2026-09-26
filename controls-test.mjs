import assert from 'node:assert/strict';
import {DIRECTIONS,screenDelta,tiltControl} from './controls.js';
import {newGame,step} from './physics.js';
for(const [name,axis,sign] of [['up','y',-1],['down','y',1],['left','x',-1],['right','x',1]]){
  let s=newGame();for(let i=0;i<25;i++)s=step(s,DIRECTIONS[name],1/60);
  const displacement=screenDelta(s.x,s.z);assert(displacement[axis]*sign>.1,`${name} moves ${axis} ${sign}`);
  assert(Math.abs(displacement[axis==='x'?'y':'x'])<.02,`${name} has no cross-axis drift`);
}
assert.deepEqual(tiltControl(12,-10,{gamma:12,beta:-10}),{x:0,z:0});
assert.deepEqual(tiltControl(13,-9,{gamma:12,beta:-10}),{x:0,z:0});
for(const [gamma,beta,axis,sign] of [[20,0,'x',1],[-20,0,'x',-1],[0,20,'y',1],[0,-20,'y',-1]]){
 const d=screenDelta(...Object.values(tiltControl(gamma,beta,{gamma:0,beta:0})));assert(d[axis]*sign>0);
}
let idle=newGame();for(let i=0;i<60*12;i++)idle=step(idle,{},1/60);assert.equal(idle.x,0);assert.equal(idle.z,0);assert.equal(idle.falls,0);assert.equal(idle.fallTime,0);
let s=newGame();for(let i=0;i<30;i++)s=step(s,DIRECTIONS.down,1/60);const speed=Math.hypot(s.vx,s.vz);for(let i=0;i<30;i++)s=step(s,{brake:true},1/60);assert(speed>0.5);assert(Math.hypot(s.vx,s.vz)<.045);
console.log('neutral spawn, calibration/deadzone, four projected directions and brake passed');
import {gesture,isTap} from './controls.js';
assert.equal(gesture({x:237,y:130},{x:180,y:133},false),'open');assert.equal(gesture({x:212,y:130},{x:160,y:130},false),null);assert.equal(gesture({x:30,y:130},{x:105,y:135},true),'close');assert.equal(gesture({x:235,y:130},{x:180,y:210},false),null);assert(isTap({x:100,y:100},{x:104,y:106}));assert(!isTap({x:235,y:100},{x:175,y:100}));
