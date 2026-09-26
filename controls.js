import {clamp} from './physics.js';
// Camera basis: horizontal = x-z, vertical = x+z (positive is down).
export const screenDelta=(x,z)=>({x:(x-z)*.70,y:(x+z)*.38});
export function screenToWorld(horizontal,vertical){return {x:(horizontal+vertical)/Math.SQRT2,z:(vertical-horizontal)/Math.SQRT2}}
export const DIRECTIONS={up:screenToWorld(0,-1),down:screenToWorld(0,1),left:screenToWorld(-1,0),right:screenToWorld(1,0)};
export function tiltControl(gamma,beta,center){
  if(!center||!Number.isFinite(gamma)||!Number.isFinite(beta))return {x:0,z:0};
  // Device right roll -> screen right; forward pitch -> screen up. Recenter at playing posture.
  const axis=d=>Math.abs(d)<2.5?0:clamp((Math.abs(d)-2.5)/18,0,1)*Math.sign(d);
  return screenToWorld(axis(gamma-center.gamma),axis(beta-center.beta));
}

export const GESTURE={edge:27,travel:38,cross:42,tapDrift:12,doubleMs:340};
export function gesture(start,end,drawerOpen){
  const dx=end.x-start.x,dy=end.y-start.y;
  if(Math.abs(dy)>GESTURE.cross||Math.abs(dx)<GESTURE.travel)return null;
  if(!drawerOpen&&start.x>=240-GESTURE.edge&&dx<0)return 'open';
  if(drawerOpen&&dx>0)return 'close';
  return null;
}
export function isTap(start,end){return Math.hypot(end.x-start.x,end.y-start.y)<=GESTURE.tapDrift}
