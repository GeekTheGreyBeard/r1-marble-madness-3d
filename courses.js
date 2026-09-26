// Seeded, deterministic campaign. Counts are per course; Pro doubles the section sequence.
export const DIFFICULTIES={beginner:{lives:5,length:1,hazards:.5,features:2,opponents:0},standard:{lives:3,length:1,hazards:1,features:1,opponents:1},pro:{lives:1,length:2,hazards:2,features:2,opponents:2}};
const names=['Momentum Lab','Switchback Rise','Copper Causeway','Amber Bend','Sundial Run','Spiral Quay','Cobalt Crest','Lantern Cut','Tidal Span','Violet Vault','Crosswind','Furnace Lane','Mosaic Drift','Highwater','Ghost Arcade','Pinnacle','Redline','Aster Circuit','Ember Gate','Blue Horizon','Quicksilver','Prism Ridge','Thunderhead','Orbit Break','Final Ascent'];
export const CATALOG=names.map((name,i)=>({id:i+1,name,sections:7+Math.floor(i/4),amplitude:1.3+(i%5)*.28,phase:i*1.73,baseline:{hazards:2+Math.floor(i/5),features:2+Math.floor(i/6),opponents:1+Math.floor(i/7)}}));
export const count=(base,mult)=>mult===0?0:Math.max(1,Math.round(base*mult)); // half rounds upward on odd counts
export function createCourse(id=1,difficulty='standard'){
  const def=CATALOG.find(c=>c.id===Number(id)),rule=DIFFICULTIES[difficulty];if(!def||!rule)throw Error('Unknown course or difficulty');
  const sections=def.sections*rule.length,centers=[];
  for(let j=0;j<=sections;j++)centers.push(j===0||j===sections?0:Math.sin(j*.92+def.phase)*def.amplitude+Math.sin(j*.43+def.phase)*.65);
  const tiles=[];for(let j=0;j<=sections;j++){let x=centers[j],prev=centers[Math.max(0,j-1)],next=centers[Math.min(sections,j+1)];tiles.push({x,z:j*6,w:j===0||j===sections?9:7.5,l:7.6,h:j===0||j===sections?0:(j%4===1?0.65:0),dx:0,dz:j===0||j===sections?0:(j%4===1?.08:j%4===2?-.08:0),kind:j===0?'start':j===sections?'goal':j%4===1?'ramp':j%4===2?'crest':j%4===3?'bank':'bridge'})}
  const goal={x:0,z:sections*6},spawn={x:0,z:0};
  // Keep the center navigation corridor open. Place obstacles off-axis, and bonuses on-axis.
  function distribute(n,kind){return Array.from({length:n},(_,i)=>{const segment=2+Math.floor((i+.5)*(sections-3)/n),z=segment*6,x=centers[segment];return {x:x+(kind==='feature'?0:(i%2?2.05:-2.05)),z,r:kind==='feature'?.6:.58,kind:kind==='hazard'?(i%3===0?'bomb':'post'):kind,phase:i*1.7}})}
  const hazards=distribute(count(def.baseline.hazards,rule.hazards),'hazard');const features=distribute(count(def.baseline.features,rule.features),'feature').map((f,i)=>({...f,effect:i%3===0?'time':i%3===1?'shield':'boost'}));
  const opponents=distribute(count(def.baseline.opponents,rule.opponents),'opponent');
  // Checkpoints are at safe tile centers, after each third of the route.
  const checkpoints=[Math.floor(sections/3),Math.floor(2*sections/3)].map(j=>({x:centers[j],z:j*6}));
  return {...def,difficulty,lives:rule.lives,seconds:Math.ceil(sections*6*3.3+30),spawn,goal,tiles,centers,checkpoints,hazards,features,opponents,posts:hazards,sections};
}
export const COURSE=createCourse();
