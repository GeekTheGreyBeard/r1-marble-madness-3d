import assert from 'node:assert/strict';import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,executablePath:'/home/gtgb/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:240,height:282},hasTouch:true,isMobile:true});let errors=[];page.on('pageerror',e=>errors.push(e.message));
const read=()=>page.evaluate(()=>window.__lab());
const cdp=await page.context().newCDPSession(page);let point=null;async function touchDown(selector){const box=await page.locator(selector).boundingBox();point={x:Math.round(box.x+box.width/2),y:Math.round(box.y+box.height/2)};await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,id:1}]})}async function touchUp(){await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}

await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});assert(await page.locator('#overlay').isVisible());await page.locator('#start').tap();assert(!(await page.locator('#overlay').isVisible()));
let initial=await read();await page.waitForTimeout(900);let idle=await read();assert.equal(idle.state.x,initial.state.x);assert.equal(idle.state.z,initial.state.z);assert.equal(idle.state.falls,0);
for(const [dir,axis,sign] of [['up','y',-1],['down','y',1],['left','x',-1],['right','x',1]]){
 await page.locator('#restart').evaluate(el=>el.click()); // restart from help UI while keeping test deterministic
 const before=await read(),button=page.locator(`[data-dir=${dir}]`);await touchDown(`[data-dir=${dir}]`);await page.waitForTimeout(400);await touchUp();const after=await read();
 const screenX=(after.state.x-after.state.z)-(before.state.x-before.state.z),screenY=(after.state.x+after.state.z)-(before.state.x+before.state.z);
 assert((axis==='x'?screenX:screenY)*sign>.01,`${dir} projected movement`);
}
await page.locator('#restart').evaluate(el=>el.click());let button=page.locator('[data-dir=down]');await touchDown('[data-dir=down]');await page.waitForTimeout(480);await touchUp();let moving=await read();assert(Math.hypot(moving.state.vx,moving.state.vz)>.1);await touchDown('#brake');await page.waitForTimeout(450);await touchUp();let stopped=await read();assert(Math.hypot(stopped.state.vx,stopped.state.vz)<.1);
// Inject orientation events in the browser; this checks calibration logic, not hardware sensor delivery.
await page.evaluate(()=>{window.DeviceOrientationEvent=class extends Event {constructor(type,values){super(type);Object.assign(this,values)}}});
await page.locator('#tilt').tap();await page.evaluate(()=>dispatchEvent(new DeviceOrientationEvent('deviceorientation',{gamma:14,beta:-9})));let centered=await read();assert.deepEqual(centered.tiltInput,{x:0,z:0});
await page.evaluate(()=>dispatchEvent(new DeviceOrientationEvent('deviceorientation',{gamma:30,beta:-9})));let tilted=await read();assert(tilted.tiltInput.x-tilted.tiltInput.z>0);
await page.locator('#recenter').tap();assert.deepEqual((await read()).tiltInput,{x:0,z:0});
await page.locator('#speed').tap();assert.match(await page.locator('#speed').innerText(),/FORCE 4/);
await page.locator('#menu').tap();assert(await page.locator('#help').isVisible());await page.locator('#resume').tap();assert(!(await page.locator('#help').isVisible()));
// Browser-level fall and checkpoint return: same frame loop with a forced edge state, no mocked physics.
await page.evaluate(()=>{document.querySelector('#restart').click()});
await touchDown('[data-dir=right]');await page.waitForTimeout(2700);await touchUp();let falling=await read();assert(falling.state.falls>0,'touch steering reaches open edge and falls');await page.waitForTimeout(850);let returned=await read();assert.equal(returned.state.fallTime,0);assert(Math.hypot(returned.state.x,returned.state.z)<1,'respawn at initial checkpoint');
await page.reload({waitUntil:'networkidle'});assert(await page.locator('#overlay').isVisible());let reloaded=await read();assert.equal(reloaded.started,false);assert.equal(reloaded.state.falls,0);
assert.deepEqual(errors,[]);const sizes=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,canvas:document.querySelector('canvas').getBoundingClientRect().toJSON()}));assert.equal(sizes.scrollWidth,240);assert.equal(sizes.canvas.width,240);assert.equal(sizes.canvas.height,282);await page.screenshot({path:'browser-240x282.png'});console.log('browser touch 4-way, stationary, brake, fall/respawn, reload, 240×282 passed');await browser.close();
