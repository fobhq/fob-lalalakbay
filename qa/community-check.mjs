import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
class Element {
 constructor(tag='div'){this.tag=tag;this.children=[];this.value='';this.textContent='';this.events={};this.attributes={};this.classList={toggle:(name,on)=>{this.attributes[name]=on;}};}
 append(...children){this.children.push(...children);}
 replaceChildren(...children){this.children=children;}
 addEventListener(event,handler){this.events[event]=handler;}
 setAttribute(name,value){this.attributes[name]=value;}
 scrollIntoView(){} focus(){}
}
const ids=Object.fromEntries(['fandom-filter','type-filter','project-search','community-results','result-count','artist-directory','reset-filters','search-heading'].map(id=>[id,new Element()]));
ids['fandom-filter'].options=['all','BINI','Olivia Dean','Up Dharma Down','Lola Amour','SunKissed Lola','Multi-fandom'].map(value=>({value}));
ids['fandom-filter'].value='all';ids['type-filter'].value='all';
const posts=[
 {title:'Bloom postcard giveaway',fandom:'BINI',type:'Freebie',organizer:'Test Collective',location:'Cubao',requirements:'Show festival ticket',originalUrl:'https://example.com/bloom'},
 {title:'Olivia fan gathering',fandom:'Olivia Dean',type:'Meetup',organizer:'Test Soul Crew',location:'Arena',originalUrl:'https://example.com/soul'},
 {title:'Unsafe link',fandom:'BINI',type:'Freebie',originalUrl:'javascript:alert(1)'}
];
const context=vm.createContext({window:{LALALAKBAY_POSTS:posts},location:new URL('http://localhost/fan-projects.html?artist=BINI'),history:{replaceState:(a,b,url)=>{context.location=new URL(url);}},URL,URLSearchParams,document:{getElementById:id=>ids[id],createElement:tag=>new Element(tag),createTextNode:text=>({textContent:text})}});
vm.runInContext(fs.readFileSync(new URL('../build/festival-data.js',import.meta.url),'utf8'),context);
vm.runInContext(fs.readFileSync(new URL('../build/community.js',import.meta.url),'utf8'),context);
const visibleCards=()=>ids['community-results'].children[0].children;
assert.equal(ids['fandom-filter'].value,'BINI');assert.equal(ids['result-count'].textContent,'1 post · BINI');assert.equal(visibleCards().length,1);
assert.equal(ids['artist-directory'].children.length,5);
ids['project-search'].value='CUBAO collective';ids['project-search'].events.input();assert.equal(visibleCards().length,1);
ids['type-filter'].value='For sale';ids['type-filter'].events.change();assert.equal(ids['result-count'].textContent,'0 posts · BINI · Search: CUBAO collective');
ids['reset-filters'].events.click();assert.equal(ids['project-search'].value,'');assert.equal(visibleCards().length,2);assert.equal(context.location.search,'');
ids['artist-directory'].children[0].events.click();assert.equal(ids['fandom-filter'].value,'Olivia Dean');assert.equal(visibleCards().length,1);assert.equal(context.location.searchParams.get('artist'),'Olivia Dean');
ids['project-search'].value='no matching organizer';ids['project-search'].events.input();assert.equal(ids['result-count'].textContent.startsWith('0 posts'),true);
console.log('PASS: artist deep link, directory counts, combined case-insensitive search, post type, reset, artist selection, no-match state, and unsafe original-link exclusion. Fixtures stay outside published content.');
