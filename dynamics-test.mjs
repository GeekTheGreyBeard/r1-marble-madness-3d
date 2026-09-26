import assert from 'node:assert/strict';
import {LEVELS,DIFFICULTIES,WORLD,newRun,step,requestJump,nextLevel} from './game.js';
assert.equal(LEVELS.length,20);
assert.equal(new Set(LEVELS.map(l=>JSON.stringify(l.obstacles))).size,20);
// Conservative collision-clear navigation certificate with radius-expanded walls,
// active hazards, enemy travel envelopes, and no jumps. Diagonal steps are forbidden.
const clearance=(l,d,p)=>{
 const r=WORLD.marbleRadius+9;
 if(p.x<r||p.x>WORLD.width-r||p.y<r||p.y>WORLD.height-r)return false;
 if(l.obstacles.some(o=>p.x>o.x-r&&p.x<o.x+o.w+r&&p.y>o.y-r&&p.y<o.y+o.h+r))return false;
 if(l.features.some(f=>(f.type==='spikes'||d!=='beginner'&&f.type==='pit')&&Math.hypot(p.x-f.x,p.y-f.y)<r+f.r))return false;
 if(l.bombs.some(b=>Math.hypot(p.x-b.x,p.y-b.y)<r+42+2))return false;
 if(l.enemies.some(e=>e.axis==='x' ? Math.abs(p.x-e.x)<e.span+r+e.r+3&&Math.abs(p.y-e.y)<r+e.r+3 : Math.abs(p.y-e.y)<e.span+r+e.r+3&&Math.abs(p.x-e.x)<r+e.r+3))return false;
 return true;
};
function path(l,d,edge=false){
 const cell=5,cols=61,rows=277,xy=i=>({x:15+i%cols*cell,y:15+Math.floor(i/cols)*cell});
 const id=p=>Math.round((p.y-15)/cell)*cols+Math.round((p.x-15)/cell);
 const start=id(l.start),q=[start],prev=new Int32Array(cols*rows).fill(-1);prev[start]=start;
 for(let k=0;k<q.length;k++){
  const i=q[k],p=xy(i);if(Math.hypot(p.x-l.goal.x,p.y-l.goal.y)<WORLD.marbleRadius+19-3){const out=[];for(let n=i;n!==start;n=prev[n])out.push(xy(n));out.push(xy(start));return out.reverse()}
  for(const j of [i-1,i+1,i-cols,i+cols]){if(j<0||j>=prev.length||Math.abs(j-i)===1&&Math.floor(j/cols)!==Math.floor(i/cols)||prev[j]>=0)continue;const n=xy(j);if(edge&&n.x>36&&n.x<284||!clearance(l,d,n))continue;prev[j]=i;q.push(j)}
 }return null;
}
for(const [i,l] of LEVELS.entries())for(const d of DIFFICULTIES){
 const p=path(l,d);assert.ok(p,`${i+1}/${d}: no path`);assert.equal(path(l,d,true),null,`${i+1}/${d}: side cruise`);
 assert.ok(p.some(v=>v.x>120&&v.x<200),`${i+1}/${d}: no field crossing`);
 // Representative dynamic steering: avoid obstacle contact by following a padded
 // waypoint corridor at the physics frame rate, with velocity damping near turns.
 let run=newRun(i,d),target=0,frames=0;
 const sparse=p.filter((_,j)=>j%1===0);sparse.push(p.at(-1),l.goal);
 while(frames++<18000&&run.status==='playing'){
  let dest=sparse[target];while(target<sparse.length-1&&Math.hypot(run.marble.x-dest.x,run.marble.y-dest.y)<5){dest=sparse[++target]}
  const dx=dest.x-run.marble.x,dy=dest.y-run.marble.y;
  const input={x:Math.max(-1,Math.min(1,dx*.20-run.marble.vx*1.5)),y:Math.max(-1,Math.min(1,dy*.20-run.marble.vy*1.5))};
  const next=step(run,input,1/60);
  assert.equal(next.lives,3,`${i+1}/${d}: contact at ${frames} ${JSON.stringify(run.marble)}, waypoint ${target} ${JSON.stringify(dest)}`);
  run=next;
 }
 assert.ok(['cleared','won'].includes(run.status),`${i+1}/${d}: ${run.status} after ${frames} frames, ${JSON.stringify(run.marble)} target ${target}`);
 console.log(`${i+1}/${d}: cleared ${frames} frames, route ${p.length} cells`);
}
assert.equal(nextLevel(newRun(18,'pro')).levelIndex,19);
assert.equal(newRun(0,'pro').levelIndex,0);
const z=newRun(),jump=requestJump(z);assert.ok(jump.airborne>0);
console.log('60 dynamic routes + no side-only route: passed');
