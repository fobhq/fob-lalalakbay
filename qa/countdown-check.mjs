import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const source=fs.readFileSync('build/countdown.js','utf8');
function run(now){const nodes=Object.fromEntries(['festival-clock','count-days','count-hours','count-minutes','count-seconds','countdown-note'].map(x=>[x,{textContent:''}]));let timer=0;vm.runInNewContext(source,{document:{getElementById:x=>nodes[x]},Date:{parse:Date.parse,now:()=>Date.parse(now)},setInterval:()=>++timer,clearInterval:()=>{},window:{addEventListener:()=>{}}});return {nodes,timer};}
const before=run('2027-01-13T23:59:59+08:00');assert.equal(before.nodes['count-seconds'].textContent,'01');assert.equal(before.timer,1);
const boundary=run('2027-01-13T16:00:00Z');assert.equal(boundary.nodes['count-days'].textContent,'00');assert.equal(boundary.timer,0);assert.match(boundary.nodes['countdown-note'].textContent,/has arrived/);
const after=run('2027-01-15T00:00:00+08:00');for(const u of ['days','hours','minutes','seconds'])assert.equal(after.nodes['count-'+u].textContent,'00');
const day=run('2027-01-13T00:00:00+08:00');assert.equal(day.nodes['count-days'].textContent,'01');assert.equal(day.nodes['count-hours'].textContent,'00');
console.log('Countdown checks passed: Philippine timezone, day boundary, zero clamp, timer completion.');
