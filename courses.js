// Hand-designed spatial motifs: bends, transverse traverses, switchbacks and forked plazas.
export const DIFFICULTIES={beginner:{lives:5,length:1,hazards:.5,features:2,opponents:0},standard:{lives:3,length:1,hazards:1,features:1,opponents:1},pro:{lives:1,length:2,hazards:2,features:2,opponents:2}};
const names=['Momentum Lab','Switchback Rise','Copper Causeway','Amber Bend','Sundial Run','Spiral Quay','Cobalt Crest','Lantern Cut','Tidal Span','Violet Vault','Crosswind','Furnace Lane','Mosaic Drift','Highwater','Ghost Arcade','Pinnacle','Redline','Aster Circuit','Ember Gate','Blue Horizon','Quicksilver','Prism Ridge','Thunderhead','Orbit Break','Final Ascent'];
// Each cell is adjacent to the next, but routes turn back, cross broad plazas, and split.
const motifs=[
 [[0,0],[0,1],[-1,1],[-2,1],[-2,2],[-2,3],[-1,3],[0,3],[1,3],[2,3],[2,4],[2,5],[1,5],[0,5],[0,6]],
 [[0,0],[1,0],[2,0],[2,1],[2,2],[1,2],[0,2],[-1,2],[-2,2],[-2,3],[-2,4],[-1,4],[0,4],[0,5],[0,6]],
 [[0,0],[0,1],[0,2],[1,2],[2,2],[3,2],[3,3],[3,4],[2,4],[1,4],[0,4],[-1,4],[-1,5],[0,5],[0,6]],
 [[0,0],[-1,0],[-2,0],[-2,1],[-1,1],[0,1],[1,1],[1,2],[1,3],[0,3],[-1,3],[-1,4],[0,4],[1,4],[1,5],[0,5],[0,6]],
 [[0,0],[0,1],[1,1],[2,1],[2,2],[1,2],[0,2],[-1,2],[-2,2],[-2,3],[-1,3],[0,3],[1,3],[1,4],[0,4],[0,5],[0,6]]
];
export const CATALOG=names.map((name,i)=>({id:i+1,name,pattern:[i%5,(Math.floor(i/5)+i+2)%5,(i*3+1)%5],baseline:{hazards:2+Math.floor(i/5),features:2+Math.floor(i/6),opponents:1+Math.floor(i/7)}}));
export const count=(base,mult)=>mult===0?0:Math.max(1,Math.round(base*mult));
export function createCourse(id=1,difficulty='standard'){
 const def=CATALOG.find(c=>c.id===Number(id)),rule=DIFFICULTIES[difficulty];if(!def||!rule)throw Error('Unknown course or difficulty');
 const path=[],tiles=[],branches=[];const cell=5.25,modules=rule.length===2?6:3;
 for(let m=0;m<modules;m++){
  const motif=motifs[def.pattern[m%3]],flip=((id+m)%2)?-1:1,offset=m*6;
  for(let j=m?1:0;j<motif.length;j++){
   const [cx,cz]=motif[j],x=cx*cell*flip,z=(cz+offset)*cell;
   const index=path.length,kind=j===Math.floor(motif.length*.34)?'moving':j===Math.floor(motif.length*.62)?'elevator':j===Math.floor(motif.length*.8)?'collapse':'stone';
   const tile={x,z,w:10.1,l:10.1,h:0,dx:0,dz:0,kind,id:index,module:m};path.push({x,z});tiles.push(tile);
  }
  // Alternate route across a small two-sided plaza: visible optional surface, not an invisible shortcut.
  const anchor=motif[3],a={x:(anchor[0]+(anchor[0]>0?0.9:-0.9))*cell*flip,z:(anchor[1]+offset+.55)*cell};
  branches.push({...a,w:5.2,l:5.2,h:0,dx:0,dz:0,kind:'detour',id:`b${m}`,module:m});
 }
 tiles[0].kind='start';tiles.at(-1).kind='goal';
 const spawn={...path[0]},goal={...path.at(-1)};
 function distribute(n,kind){return Array.from({length:n},(_,i)=>{const index=3+Math.floor((i+.5)*(path.length-7)/n),p=path[index],t=tiles[index];return {x:p.x+(i%2?2.6:-2.6),z:p.z,r:kind==='feature'?.6:.58,kind:kind==='hazard'?(i%3===0?'bomb':'post'):kind,phase:i*1.7,tileId:t.id}})}
 function segmentDistance(p,a,b){const dx=b.x-a.x,dz=b.z-a.z,q=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(p.x-a.x-q*dx,p.z-a.z-q*dz)}
 // Bombs remain on visible support but out of the primary steering corridor.
 // Search the optional plaza surfaces and platform corners rather than placing lethal
 // objects at the center of a narrow turn. Keep route geometry and counts intact.
 const bombSites=[...branches,...tiles.slice(2,-2)].flatMap(t=>[-.33,0,.33].flatMap(dx=>[-.33,0,.33].map(dz=>({x:t.x+dx*t.w,z:t.z+dz*t.l,tileId:t.id})))).map(p=>({...p,clearance:Math.min(...path.slice(1).map((v,j)=>segmentDistance(p,path[j],v)))})).filter(p=>p.clearance>1.65).sort((a,b)=>b.clearance-a.clearance);
 const hazards=distribute(count(def.baseline.hazards,rule.hazards),'hazard').map((h,i)=>h.kind==='bomb'?{...h,...bombSites[Math.floor(i/3)%bombSites.length]}:h),features=distribute(count(def.baseline.features,rule.features),'feature').map((f,i)=>({...f,effect:['time','shield','boost'][i%3]})),opponents=distribute(count(def.baseline.opponents,rule.opponents),'opponent').map(o=>{const t=tiles[o.tileId];if(t.kind!=='collapse')return o;const safe=tiles.slice(Math.max(2,o.tileId-3),o.tileId).reverse().find(t=>t.kind==='stone');return safe?{...o,x:safe.x+2.6,z:safe.z,tileId:safe.id}:o});
 const checkpoints=[Math.floor(path.length/3),Math.floor(path.length*2/3)].map(i=>{while(['collapse','moving','elevator'].includes(tiles[i].kind))i--;return {...path[i],tileId:i}});
 return {...def,difficulty,lives:rule.lives,seconds:Math.ceil(path.length*5.25*3.2+60),spawn,goal,tiles:[...tiles,...branches],path,checkpoints,hazards,features,opponents,sections:path.length,branches:branches.length};
}
export const COURSE=createCourse();
