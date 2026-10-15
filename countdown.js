(() => {
'use strict';
const target=Date.parse('2027-01-14T00:00:00+08:00');
const clock=document.getElementById('festival-clock');
if(!clock)return;
function tick(){
 const total=Math.max(0,Math.floor((target-Date.now())/1000));
 const values={days:Math.floor(total/86400),hours:Math.floor(total%86400/3600),minutes:Math.floor(total%3600/60),seconds:total%60};
 Object.entries(values).forEach(([unit,value])=>{document.getElementById('count-'+unit).textContent=String(value).padStart(2,'0');});
 if(total===0){document.getElementById('countdown-note').textContent='January 14, 2027 has arrived. Check the organizer’s latest festival updates.';return false;}
 return true;
}
let timer;
function start(){clearInterval(timer);if(tick())timer=setInterval(()=>{if(!tick())clearInterval(timer);},1000);}
start();
window.addEventListener('pagehide',()=>clearInterval(timer));
window.addEventListener('pageshow',start);
})();
