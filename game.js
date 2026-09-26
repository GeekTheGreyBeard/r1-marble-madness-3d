// The physical R1 display is 240×282. Rendering scales this logical viewport only; the world remains larger and scrolls beneath it.
export const VIEWPORT = { width: 320, height: 376, physicalWidth: 240, physicalHeight: 282 };
export const WORLD = { width: 320, height: 1400, marbleRadius: 12, goalRadius: 19, unit: 22 };
export const BOUNCE = { holdMs: 400, quickUnits: 1, longUnits: 3, airborneSeconds: .38, cooldownSeconds: .48 };
export const DIFFICULTIES = ["beginner", "standard", "pro"];
export const CAMERA_LEAD = { forward: 38, backward: -24, neutral: 0 };
const wall = (x, y, w, h = WORLD.unit, type = "wall") => ({ x, y, w, h, type });
const feature = (x, y, r, type) => ({ x, y, r, type });
// Six alternating, full-edge gates leave a 100-unit aperture (76 units of
// marble-centre clearance). The central lanes between gates are wide enough to
// brake and cross; the walls cannot be bypassed by cruising either edge.
export const BOMB = { triggerRadius: 25, fuseSeconds: .85, blastRadius: 42, blastSeconds: .22 };
const names=['first roll','switchback','crossfire','marble storm','copper bend','driftwood','orbital lane','nightfall','switchyard','ember ridge','glass run','twin peaks','magnetic mile','cinder loop','blue shift','gravity well','sunset sprint','spiral gate','last crossing','final orbit'];
function makeLevel(i){
  const shift=(i%5-2)*5, start={x:54,y:1335},goal={x:266,y:64};
  const obstacles=[];
  for(let g=0;g<6;g++){
    const y=1160-g*198+((i*7+g*3)%23-11)*2;
    // Right opening: 218..320; left opening: 0..102.
    obstacles.push(g%2===0?wall(0,y,218):wall(102,y,218));
  }
  // Distinct optional low and rebound fixtures, never intruding on the certified lane.
  obstacles.push(wall(140+shift,1290,40,11,'half'));
  obstacles.push(wall(135-shift,93,44,22,'rebound'));
  const features=[feature(155+shift,1210,13,'pit'),feature(155-shift,1010,14,'sand'),feature(155+shift,810,14,'merry'),feature(155-shift,610,13,'ice'),feature(155+shift,410,13,'sticky'),feature(155-shift,210,12,'spikes')];
  const bombs=[feature(155+shift,1120,12,'bomb'),feature(155-shift,520,12,'bomb')];
  const enemies=i>2?[{x:155,y:920,r:12,axis:'x',span:18,speed:.7}]:[];
  return {name:names[i],start,goal,obstacles,enemies,powerups:[{x:265,y:1060}],time:180+i*3,features,bombs};
}
export const LEVELS=Array.from({length:20},(_,i)=>makeLevel(i));
export function newRun(levelIndex = 0, difficulty = 'standard') {
  if (!DIFFICULTIES.includes(difficulty)) throw Error('unknown difficulty');
  const l = LEVELS[levelIndex];
  return { levelIndex, difficulty, marble:{...l.start,vx:0,vy:0}, enemies:l.enemies.map(e=>({...e,origin:e[e.axis],direction:1})), powerups:l.powerups.map(p=>({...p,collected:false})), bombs:l.bombs.map(b=>({...b,phase:'idle',time:0})), remaining:l.time,lives:3,status:'playing',airborne:0,jumpCooldown:0,jumpKind:null,superJumps:0,lastDirection:{x:0,y:-1},failure:null,dizzy:0,terrain:null,gravity:false };
}
export function circlesOverlap(a,ar,b,br){return Math.hypot(a.x-b.x,a.y-b.y)<ar+br;}
export function pointInExpandedRect(p,r,pad){return p.x>r.x-pad&&p.x<r.x+r.w+pad&&p.y>r.y-pad&&p.y<r.y+r.h+pad;}
export function moveEnemies(enemies,dt){return enemies.map(e=>{const n={...e};n[e.axis]+=n.direction*n.speed*dt*60;if(Math.abs(n[e.axis]-n.origin)>n.span){n.direction*=-1;n[e.axis]=n.origin+Math.sign(n[e.axis]-n.origin)*n.span}return n})}
function failureFor(run){return ['explode','crumble','melt'][(run.levelIndex+run.lives)%3];}
function collisionAllowed(obstacle, run){return run.airborne>0&&obstacle.h<=WORLD.unit;}
function reflected(m,old,obstacle){const n={...m};if(old.x+WORLD.marbleRadius<=obstacle.x||old.x-WORLD.marbleRadius>=obstacle.x+obstacle.w){n.x=old.x;n.vx=-m.vx*.82;}else{n.y=old.y;n.vy=-m.vy*.82;}return n;}
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
// A board unit is 22 logical world pixels, not a CSS or physical-screen pixel.
// A jump is an instantaneous, swept translation: no wall, pit or edge may be skipped.
export function requestJump(run, heldMs = 0){
  if(run.status!=='playing'||run.airborne>0||run.jumpCooldown>0)return run;
  const charged=run.superJumps>0,units=(heldMs>=BOUNCE.holdMs?BOUNCE.longUnits:BOUNCE.quickUnits)*(charged?2:1);
  const d=run.lastDirection, origin=run.marble, end={x:origin.x+d.x*units*WORLD.unit,y:origin.y+d.y*units*WORLD.unit};
  const l=LEVELS[run.levelIndex]; let destination={...origin};
  // Step no more than 1/4 radius per sample, preventing tunneling across even a thin wall.
  const samples=Math.ceil(units*WORLD.unit/3);
  for(let i=1;i<=samples;i++){
    const p={x:origin.x+(end.x-origin.x)*i/samples,y:origin.y+(end.y-origin.y)*i/samples};
    if(p.x<WORLD.marbleRadius||p.x>WORLD.width-WORLD.marbleRadius||p.y<WORLD.marbleRadius||p.y>WORLD.height-WORLD.marbleRadius)break;
    if(l.obstacles.some(r=>r.h>WORLD.unit&&pointInExpandedRect(p,r,WORLD.marbleRadius)))break;
    if(l.enemies.some(e=>circlesOverlap(p,WORLD.marbleRadius,e,e.r)))break;
    destination={...origin,x:p.x,y:p.y};
  }
  if(destination.x===origin.x&&destination.y===origin.y)return run;
  return {...run,marble:destination,airborne:BOUNCE.airborneSeconds,jumpCooldown:BOUNCE.cooldownSeconds,jumpKind:charged?'super':'normal',superJumps:run.superJumps-(charged?1:0)};
}
export function step(run,input,dt){
  if(run.status!=='playing')return run;
  const l=LEVELS[run.levelIndex],m={...run.marble};
  const terrain=l.features.find(f=>['ice','sticky','sand','merry'].includes(f.type)&&circlesOverlap(m,WORLD.marbleRadius,f,f.r));
  const drag=terrain?.type==='ice'?.97:terrain?.type==='sticky'?.65:terrain?.type==='sand'?.55:.89;
  const dizzy=Math.max(0,run.dizzy-dt), onMerry=terrain?.type==='merry'&&run.airborne<=0;
  const steer=onMerry||dizzy>0?{x:input.y,y:-input.x}:input;
  let gx=0,gy=0,gravity=false;
  if(run.difficulty!=='beginner'&&run.airborne<=0)for(const f of l.features){if(f.type!=='pit')continue;const dx=f.x-m.x,dy=f.y-m.y,dist=Math.hypot(dx,dy)||1,reach=f.r+75;
    if(dist<reach){gravity=true;const force=(run.difficulty==='pro'?2:1)*.105*(1-dist/reach);gx+=dx/dist*force;gy+=dy/dist*force;}
  }
  const steering=1;
  m.vx=(m.vx+steer.x*.21*steering*dt*60+gx*dt*60)*Math.pow(drag,dt*60);
  m.vy=(m.vy+steer.y*.21*steering*dt*60+gy*dt*60)*Math.pow(drag,dt*60);
  const old={...m};m.x+=m.vx*dt*60;m.y+=m.vy*dt*60;
  const mag=Math.hypot(input.x,input.y),lastDirection=mag>.1?{x:input.x/mag,y:input.y/mag}:run.lastDirection;
  const enemies=moveEnemies(run.enemies,dt);
  let hitWall=false,exterior=false;
  if(m.x<WORLD.marbleRadius||m.x>WORLD.width-WORLD.marbleRadius||m.y<WORLD.marbleRadius||m.y>WORLD.height-WORLD.marbleRadius){
    exterior=true;const hitX=m.x<WORLD.marbleRadius||m.x>WORLD.width-WORLD.marbleRadius,hitY=m.y<WORLD.marbleRadius||m.y>WORLD.height-WORLD.marbleRadius;m.x=clamp(m.x,WORLD.marbleRadius,WORLD.width-WORLD.marbleRadius);m.y=clamp(m.y,WORLD.marbleRadius,WORLD.height-WORLD.marbleRadius);
    if(run.difficulty==='pro')hitWall=true;
    else if(run.difficulty==='standard'){if(hitX)m.vx=-m.vx*1.3;if(hitY)m.vy=-m.vy*1.3;}
    else {m.vx=0;m.vy=0;}
  }
  for(const r of l.obstacles){if(collisionAllowed(r,run)||!pointInExpandedRect(m,r,WORLD.marbleRadius))continue;
    if(r.type==='rebound'){Object.assign(m,reflected(m,old,r));}else hitWall=true;
  }
  let pit=false,spikes=false;
  for(const f of l.features){if(!circlesOverlap(m,WORLD.marbleRadius,f,f.r))continue;
    if(f.type==='pit'&&run.difficulty!=='beginner'&&run.airborne<=0)pit=true;
    if(f.type==='spikes'&&run.airborne<=0)spikes=true;
    if(f.type==='bumper'&&run.airborne<=0){const dx=m.x-f.x,dy=m.y-f.y,len=Math.hypot(dx,dy)||1;m.x=f.x+dx/len*(f.r+WORLD.marbleRadius+1);m.y=f.y+dy/len*(f.r+WORLD.marbleRadius+1);m.vx=dx/len*3;m.vy=dy/len*3;}
  }
  // Bombs arm on grounded proximity. They warn before a radial blast, then remain spent
  // until the next life or board; airborne marbles can clear both trigger and blast.
  const bombs=run.bombs.map(b=>{
    if(b.phase==='idle'&&run.airborne<=0&&circlesOverlap(m,WORLD.marbleRadius,b,BOMB.triggerRadius))return {...b,phase:'fuse',time:BOMB.fuseSeconds};
    if(b.phase==='fuse'){const time=b.time-dt;return time<=0?{...b,phase:'blast',time:BOMB.blastSeconds}:{...b,time};}
    if(b.phase==='blast'){const time=b.time-dt;return time<=0?{...b,phase:'spent',time:0}:{...b,time};}
    return b;
  });
  const bombHit=run.airborne<=0&&bombs.some(b=>b.phase==='blast'&&circlesOverlap(m,WORLD.marbleRadius,b,BOMB.blastRadius));
  const powerups=run.powerups.map(p=>!p.collected&&circlesOverlap(m,WORLD.marbleRadius,p,14)?{...p,collected:true}:p);
  const superJumps=run.superJumps+powerups.filter((p,i)=>p.collected&&!run.powerups[i].collected).length;
  const hitEnemy=run.airborne<=0&&enemies.some(e=>circlesOverlap(m,WORLD.marbleRadius,e,e.r));
  if((hitWall||pit||spikes||hitEnemy||bombHit)&&(onMerry||dizzy>0))return {...run,marble:{...l.start,vx:0,vy:0},enemies,powerups,bombs,superJumps,lastDirection,airborne:0,jumpKind:null,dizzy:0,terrain:null,gravity:false};
  if(hitWall||pit||spikes||hitEnemy||bombHit)return {...run,lives:run.lives-1,marble:{...l.start,vx:0,vy:0},enemies,powerups,bombs:l.bombs.map(b=>({...b,phase:'idle',time:0})),superJumps,lastDirection,status:run.lives<=1?'lost':'playing',failure:bombHit?'explode':pit?'fall':exterior?'spikes':failureFor(run),airborne:0,jumpKind:null,jumpCooldown:0,dizzy:0,terrain:null,gravity:false};
  if(circlesOverlap(m,WORLD.marbleRadius,l.goal,WORLD.goalRadius))return {...run,marble:m,enemies,powerups,bombs,superJumps,status:run.levelIndex===LEVELS.length-1?'won':'cleared'};
  const remaining=Math.max(0,run.remaining-dt),airborne=Math.max(0,run.airborne-dt);
  return {...run,marble:m,enemies,powerups,bombs,superJumps,remaining,lastDirection,airborne,jumpCooldown:Math.max(0,run.jumpCooldown-dt),jumpKind:airborne>0?run.jumpKind:null,status:remaining===0?'lost':'playing',failure:remaining===0?failureFor(run):run.failure,dizzy:onMerry?Math.max(dizzy,.75):dizzy,terrain:terrain?.type||null,gravity};
}
export function nextLevel(run){return newRun(Math.min(run.levelIndex+1,LEVELS.length-1),run.difficulty);}
export function cameraFor(run, viewportHeight=VIEWPORT.height){const look=run.lastDirection.y<-.15?CAMERA_LEAD.forward:run.lastDirection.y>.15?CAMERA_LEAD.backward:CAMERA_LEAD.neutral;return Math.max(0,Math.min(WORLD.height-viewportHeight,run.marble.y-viewportHeight/2+look));}
export function smoothCamera(current,target,dt){return current+(target-current)*(1-Math.exp(-9*Math.max(0,dt)));}
