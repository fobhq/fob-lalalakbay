import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('build/artist-carousel.js','utf8');
const dataContext={window:{}};vm.runInNewContext(fs.readFileSync('build/festival-data.js','utf8'),dataContext);
const original=JSON.parse(JSON.stringify(dataContext.window.LALALAKBAY_ARTISTS));
function harness(data=original){
 let doc;const frames=[];let resize;
 class El{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.attrs={};this.events={};this.style={};this.disabled=false;this.scrollLeft=0;this.scrollTop=0;this.clientWidth=1000;this.scrollWidth=1596;this.className='';this.isConnected=true;this._text='';const classes=new Set();this.classList={add:k=>classes.add(k),toggle:(k,on)=>on?classes.add(k):classes.delete(k),contains:k=>classes.has(k)};}
  set textContent(t){this._text=String(t);}get textContent(){return this._text+this.children.map(x=>x.textContent).join('');}
  setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k];}
  append(...nodes){nodes.forEach(n=>{n.parent=this;this.children.push(n);});}
  replaceChildren(...nodes){this.children.forEach(n=>n.parent=null);this.children=[];this._text='';this.append(...nodes);}
  addEventListener(k,fn){(this.events[k]||=[]).push(fn);}
  emit(k,values={}){const event={target:this,detail:1,preventDefault(){this.prevented=true;},...values};(this.events[k]||[]).forEach(fn=>fn(event));return event;}
  focus(){doc.activeElement=this;}contains(el){return el===this||this.children.some(n=>n.contains(el));}
  closest(){return ['INPUT','SELECT','TEXTAREA'].includes(this.tagName)||this.attrs.contenteditable==='true'?this:null;}
  getClientRects(){return [{}];}getBoundingClientRect(){return {left:100,right:900,top:100,bottom:700,width:300};}
  get firstElementChild(){return this.children[0];}
  querySelectorAll(){return this.children.flatMap(n=>[...((n.tagName==='BUTTON'&&!n.disabled)||(n.tagName==='A'&&n.href)||n.attrs.tabindex==='0'?[n]:[]),...n.querySelectorAll()]);}
  scrollTo({left}){if(left!==undefined)this.scrollLeft=left;this.emit('scroll');}
  showModal(){this.open=true;}close(){this.open=false;this.emit('close');}
 }
 const nodes=Object.fromEntries(['artist-profiles','artist-modal','artist-carousel-prev','artist-carousel-next','artist-modal-content','artist-modal-close','artist-modal-prev','artist-modal-next','artist-modal-position'].map(id=>[id,new El(id==='artist-modal'?'dialog':id.includes('prev')||id.includes('next')||id.includes('close')?'button':'div')]));
 nodes['artist-modal'].append(nodes['artist-modal-close'],nodes['artist-modal-content'],nodes['artist-modal-prev'],nodes['artist-modal-position'],nodes['artist-modal-next']);
 const body=new El('body'),html=new El('html');body.style={overflow:'auto',paddingRight:'8px'};html.style={overflow:'scroll'};html.clientWidth=1265;body.append(nodes['artist-profiles'],nodes['artist-modal']);
 doc={body,documentElement:html,activeElement:body,createElement:tag=>new El(tag),getElementById:id=>nodes[id]};
 const window={LALALAKBAY_ARTISTS:JSON.parse(JSON.stringify(data)),innerWidth:1280,addEventListener(){}};
 const context={window,document:doc,URL,matchMedia:()=>({matches:false}),getComputedStyle:n=>n===body?{paddingRight:'8px'}:{columnGap:'24px'},requestAnimationFrame:fn=>{frames.push(fn);return frames.length;},ResizeObserver:class{constructor(fn){resize=fn;}observe(){}}};
 vm.runInNewContext(source,context);
 function flush(){while(frames.length)frames.shift()();}
 flush();return {nodes,doc,flush,resize,El,cards:nodes['artist-profiles'].children,dialog:nodes['artist-modal'],content:nodes['artist-modal-content'],close:nodes['artist-modal-close'],prev:nodes['artist-modal-prev'],next:nodes['artist-modal-next']};
}
const h=harness();const n=h.nodes;assert.equal(h.cards.length,5);assert.deepEqual(h.cards.map(c=>c.attrs['aria-label']),original.map(a=>'Explore '+a.name));
assert.equal(n['artist-carousel-prev'].disabled,true);n['artist-carousel-next'].emit('click');h.flush();assert.equal(n['artist-profiles'].scrollLeft,324);n['artist-carousel-next'].emit('click');h.flush();assert.equal(n['artist-profiles'].scrollLeft,596);assert.equal(n['artist-carousel-next'].disabled,true);n['artist-carousel-prev'].emit('click');h.flush();assert.equal(n['artist-profiles'].scrollLeft,272);
const wheel=n['artist-profiles'].emit('wheel',{deltaX:0,deltaY:30,deltaMode:0});assert.equal(wheel.prevented,true);h.flush();
h.cards[0].focus();h.cards[0].emit('click');assert.equal(h.dialog.open,true);assert.equal(h.doc.body.style.overflow,'hidden');assert.equal(h.doc.documentElement.style.overflow,'hidden');assert.equal(h.doc.activeElement,h.close);
function all(root){return [root,...root.children.flatMap(all)];}
for(let i=0;i<5;i++){
 const artist=original[i];assert.ok(h.content.textContent.includes(artist.name));assert.ok(h.content.textContent.includes(artist.description));assert.ok(h.content.textContent.includes(artist.album));const nodes=all(h.content);assert.ok(nodes.some(x=>x.src===artist.photo));assert.ok(nodes.some(x=>x.src===artist.albumCover));for(const url of [artist.musicUrl,artist.url,'fan-projects.html?artist='+encodeURIComponent(artist.name)])assert.ok(nodes.some(x=>x.href===url));h.next.emit('click');
}
assert.ok(h.content.textContent.includes(original[0].description));h.prev.emit('click');assert.ok(h.content.textContent.includes(original[4].description));
h.close.focus();h.dialog.emit('keydown',{key:'Tab',shiftKey:true});assert.equal(h.doc.activeElement,h.next);h.dialog.emit('keydown',{key:'Tab'});assert.equal(h.doc.activeElement,h.close);
h.dialog.emit('keydown',{key:'ArrowRight'});assert.ok(h.content.textContent.includes(original[0].description));const input=new h.El('input');h.dialog.emit('keydown',{key:'ArrowRight',target:input});assert.ok(h.content.textContent.includes(original[0].description));
h.dialog.emit('keydown',{key:'Escape'});assert.equal(h.dialog.open,false);assert.equal(h.doc.body.style.overflow,'auto');assert.equal(h.doc.documentElement.style.overflow,'scroll');assert.equal(h.doc.body.style.paddingRight,'8px');assert.equal(h.doc.activeElement,h.cards[0]);
h.cards[1].emit('click');h.close.emit('click');assert.equal(h.dialog.open,false);assert.equal(h.doc.activeElement,h.cards[1]);
h.cards[2].emit('click');h.dialog.emit('pointerdown');h.dialog.emit('click',{clientX:20,clientY:20});assert.equal(h.dialog.open,false);assert.equal(h.doc.activeElement,h.cards[2]);
h.cards[3].emit('pointerdown',{clientX:10,clientY:10});h.cards[3].emit('pointermove',{clientX:50,clientY:10});h.cards[3].emit('click');assert.equal(h.dialog.open,false);h.cards[3].emit('click',{detail:0});assert.equal(h.dialog.open,true);h.dialog.emit('cancel');assert.equal(h.dialog.open,false);
const optional=harness([{id:'minimal',name:'Minimal Artist'}]);optional.cards[0].emit('click');assert.equal(optional.content.querySelectorAll().filter(x=>x.tagName==='A').length,1);assert.ok(!optional.content.textContent.includes('undefined'));
n['artist-profiles'].clientWidth=2000;h.resize();h.flush();assert.equal(n['artist-carousel-next'].disabled,true);
console.log('PASS: 5 artists/order/data/URLs, compact card controls and edges, wheel scroll, correct modal content, wraparound navigation, input-safe arrows, Tab trap, Escape/close/backdrop, scroll/focus restoration, swipe-click suppression, optional fields and resize.');
