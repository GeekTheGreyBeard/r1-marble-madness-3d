import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {toggleAudio,play,roll,audioState} from './audio.js';
const names=['roll-stone','roll-wood','impact-metal','impact-wood','jump','elevator','platform','warning','collapse','finish','bomb','feature','checkpoint'];
let starts=[],loads=[];
globalThis.window={AudioContext:class{state='suspended';destination={};async resume(){this.state='running'}async suspend(){this.state='suspended'}async decodeAudioData(bytes){assert(bytes.byteLength>0);return {duration:1}}createBufferSource(){return {playbackRate:{value:1},connect(node){return node},start(){starts.push('played')}}}createGain(){return {gain:{value:0},connect(node){return node}}}}};
globalThis.fetch=async url=>{loads.push(url);const data=await readFile(url);return {ok:true,arrayBuffer:async()=>data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)}};
play('bomb');assert.equal(starts.length,0);await toggleAudio();await new Promise(r=>setTimeout(r,50));assert.deepEqual(loads.sort(),names.map(n=>`assets/${n}.mp3`).sort());assert.equal(audioState().muted,false);
for(const name of names)play(name);assert.equal(starts.length,names.length);await toggleAudio();for(const name of names)play(name);assert.equal(starts.length,names.length);assert.equal(audioState().muted,true);await toggleAudio();roll(3,'collapse',1);assert.equal(starts.length,names.length+1);console.log('13 sampled assets decoded; all 13 events played after unmute, none while muted, wood rolling resumed');
