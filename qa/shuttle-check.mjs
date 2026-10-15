import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
class El{
 constructor(){this.dataset={};this.attrs={};this.events={};this.children=[];this.textContent='';this.innerHTML='';this.complete=true;this.naturalWidth=100;const classes=new Set();this.classList={toggle:(k,on)=>on?classes.add(k):classes.delete(k),contains:k=>classes.has(k)};}
 setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k];}addEventListener(k,fn){this.events[k]=fn;}append(x){this.children.push(x);}replaceChildren(){this.children=[];}contains(x){return x===this;}
}
function harness(reduced=false){
 const choices=new El(),vanChoices=new El(),vanWrapper=new El();const vehicles=['bus','van'].map(id=>{const el=new El();el.dataset.vehicleFilter=id;return el;});
 const box=new El(),result=new El(),compare=new El(),filters=['bus','regular','vip'].map(id=>{const el=new El();el.dataset.rideFilter=id;return el;});
 const gallery=new El();gallery.attrs['aria-label']='Bus photos';
 const slides=[new El(),new El(),new El()],dots=slides.map(()=>new El()),play=new El(),prev=new El(),next=new El(),counter=new El();
 gallery.querySelectorAll=s=>s==='.ride-slide'?slides:dots;
 gallery.querySelector=s=>({'[data-gallery-play]':play,'[data-gallery-prev]':prev,'[data-gallery-next]':next,'.gallery-counter':counter})[s];
 let tick,observer;const window={events:{},addEventListener(k,f){this.events[k]=f;}};
 const document={hidden:false,getElementById:id=>({'ll-packages':box,'package-result-label':result,'ride-comparison':compare,'ride-choices':choices,'van-choices':vanChoices,'van-options-wrapper':vanWrapper})[id]||null,createElement:()=>new El(),querySelectorAll:s=>s==='[data-vehicle-filter]'?vehicles:s==='[data-ride-filter]'?filters:s==='.ride-gallery'?[gallery]:[]};
 const context={window,document,Intl,matchMedia:()=>({matches:reduced,addEventListener(){}}),setInterval:f=>{tick=f;return 1;},clearInterval(){},IntersectionObserver:class{constructor(fn){observer=fn;}observe(){}disconnect(){}},console};
 vm.createContext(context);vm.runInContext(fs.readFileSync('build/app-config.js','utf8'),context);vm.runInContext(fs.readFileSync('build/hub.js','utf8'),context);
 return {choices,vanChoices,vanWrapper,vehicles,box,result,compare,filters,slides,dots,play,prev,next,counter,gallery,window,document,tick:()=>tick(),visible:on=>observer([{target:gallery,isIntersecting:on}])};
}
const h=harness();assert.equal(h.choices.children.length,2);assert.equal(h.choices.children[0].dataset.rideCard,'bus');assert.equal(h.choices.children[1].dataset.rideCard,'van');assert.equal(h.box.children.length,3);assert.match(h.box.children[1].innerHTML,/₱999/);assert.match(h.box.children[1].innerHTML,/Popular/);assert.match(h.box.children[2].innerHTML,/₱1,250/);assert.match(h.box.children[2].innerHTML,/3-hour Cooling Lounge/);
h.vehicles[1].events.click();assert.equal(h.box.children.length,2);assert.match(h.box.children[0].innerHTML,/regular-van-interior.jpg/);assert.match(h.box.children[0].innerHTML,/14 SEATS/);assert.match(h.box.children[0].innerHTML,/package=normal-van/);assert.match(h.box.children[1].innerHTML,/vip-van-experience-01.jpg/);assert.match(h.box.children[1].innerHTML,/₱1,250/);assert.match(h.box.children[1].innerHTML,/LaLaLakbay Eco Bag/);assert.ok(!h.box.children[1].innerHTML.includes('Cooling Lounge access'));h.vehicles[0].events.click();assert.equal(h.box.children.length,3);
// Automatic rotation loops back to the first photo, and stops offscreen or for reduced motion.
h.tick();assert.equal(h.slides[0].classList.contains('active'),true);h.visible(true);h.tick();assert.equal(h.slides[1].classList.contains('active'),true);h.tick();assert.equal(h.slides[2].classList.contains('active'),true);h.tick();assert.equal(h.slides[0].classList.contains('active'),true);
h.document.hidden=true;h.tick();assert.equal(h.slides[0].classList.contains('active'),true);h.document.hidden=false;h.visible(false);h.tick();assert.equal(h.slides[0].classList.contains('active'),true);
const r=harness(true);r.visible(true);r.tick();assert.equal(r.slides[0].classList.contains('active'),true);
for(const card of [...h.choices.children,...h.vanChoices.children]){assert.ok(!card.innerHTML.includes('data-gallery-'));assert.ok(!card.innerHTML.includes('gallery-counter'));}
console.log('PASS: Bus/Van hierarchy, package filters, approved fares & inclusions, booking links, automatic photo loop, no gallery controls, visibility handling and reduced motion.');
