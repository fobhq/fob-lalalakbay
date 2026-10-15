(() => {
'use strict';
const artists=window.LALALAKBAY_ARTISTS||[];
const track=document.getElementById('artist-profiles'),dialog=document.getElementById('artist-modal');
if(!track||!dialog||!artists.length)return;
const previous=document.getElementById('artist-carousel-prev'),next=document.getElementById('artist-carousel-next');
const content=document.getElementById('artist-modal-content'),close=document.getElementById('artist-modal-close');
const modalPrevious=document.getElementById('artist-modal-prev'),modalNext=document.getElementById('artist-modal-next');
const position=document.getElementById('artist-modal-position'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
let selected=0,returnFocus=null,scrollLock=null,frame=null;
const make=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text)node.textContent=text;return node;};
const external=url=>{try{return new URL(url).protocol==='https:';}catch{return false;}};
function photo(src,alt,className,width,height){const img=make('img',className);img.src=src;img.alt=alt;img.width=width;img.height=height;img.decoding='async';return img;}
function link(url,label,className){if(!external(url))return null;const a=make('a',className,label);a.href=url;a.target='_blank';a.rel='noopener';return a;}
function renderArtist(index){
 selected=(index+artists.length)%artists.length;
 const artist=artists[selected];content.replaceChildren();
 if(artist.photo){const image=photo(artist.photo,artist.name+' promotional photo','artist-modal-photo',640,760);if(artist.id==='udd')image.classList.add('artist-photo-udd');content.append(image);}
 const copy=make('div','artist-modal-copy');
 if(artist.label)copy.append(make('span','artist-modal-genre',artist.label));
 const title=make('h3','',artist.name);title.id='artist-modal-title';copy.append(title);
 if(artist.description)copy.append(make('p','artist-modal-description',artist.description));
 if(artist.album||external(artist.musicUrl)){
  const release=link(artist.musicUrl,'','artist-modal-release')||make('div','artist-modal-release');
  if(artist.albumCover)release.append(photo(artist.albumCover,(artist.album||'Featured release')+' cover','',88,88));
  const info=make('span');info.append(make('small','',(artist.albumType?artist.albumType+' / ':'')+'EXPLORE THE MUSIC'),make('strong','',artist.album||'Explore the music'));
  release.append(info);if(external(artist.musicUrl)){release.setAttribute('aria-label','Explore '+(artist.album||'music')+' by '+artist.name);const arrow=make('span','artist-release-arrow','↗');arrow.setAttribute('aria-hidden','true');release.append(arrow);}copy.append(release);
 }
 const links=make('div','artist-modal-links');
 const official=link(artist.url,(artist.linkLabel||'Official artist website')+' ↗','ll-link');if(official)links.append(official);
 if(artist.name){const projects=make('a','ll-link','Fan projects →');projects.href='fan-projects.html?artist='+encodeURIComponent(artist.name);links.append(projects);}
 if(links.children.length)copy.append(links);
 content.append(copy);content.classList.toggle('artist-no-photo',!artist.photo);
 position.textContent=(selected+1)+' / '+artists.length;
 dialog.scrollTop=0;
 if(dialog.open&&!dialog.contains(document.activeElement))close.focus({preventScroll:true});
}
function lockScroll(){
 scrollLock={body:document.body.style.overflow,html:document.documentElement.style.overflow,padding:document.body.style.paddingRight};
 const gap=Math.max(0,window.innerWidth-document.documentElement.clientWidth);
 if(gap)document.body.style.paddingRight=(parseFloat(getComputedStyle(document.body).paddingRight)||0)+gap+'px';
 document.body.style.overflow='hidden';document.documentElement.style.overflow='hidden';
}
function openArtist(index,trigger){
 if(dialog.open)return;
 returnFocus=trigger;renderArtist(index);lockScroll();
 try{dialog.showModal();close.focus({preventScroll:true});}catch(error){restorePage();throw error;}
}
function restorePage(){
 if(scrollLock){document.body.style.overflow=scrollLock.body;document.documentElement.style.overflow=scrollLock.html;document.body.style.paddingRight=scrollLock.padding;scrollLock=null;}
 if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});returnFocus=null;
}
function closeArtist(){if(dialog.open)dialog.close();}
artists.forEach((artist,index)=>{
 const card=make('button','artist-tile');card.type='button';card.id='artist-'+artist.id;card.setAttribute('aria-haspopup','dialog');card.setAttribute('aria-controls','artist-modal');card.setAttribute('aria-label','Explore '+artist.name);
 const media=make('span','artist-tile-media');
 if(artist.photo){const image=photo(artist.photo,'','artist-tile-photo',480,600);image.loading='lazy';if(artist.id==='udd')image.classList.add('artist-photo-udd');media.append(image);}else media.append(make('span','artist-photo-placeholder',artist.name));
 const overlay=make('span','artist-tile-explore','Explore Artist ↗');media.append(overlay);
 const caption=make('span','artist-tile-caption');caption.append(make('strong','',artist.name));if(artist.label)caption.append(make('small','',artist.label));
 card.append(media,caption);
 let startX=0,startY=0,moved=false;
 card.addEventListener('pointerdown',event=>{startX=event.clientX;startY=event.clientY;moved=false;});
 card.addEventListener('pointermove',event=>{if(Math.abs(event.clientX-startX)>10||Math.abs(event.clientY-startY)>10)moved=true;});
 card.addEventListener('pointercancel',()=>{moved=true;});
 card.addEventListener('click',event=>{if(moved&&event.detail!==0){moved=false;return;}openArtist(index,card);});
 track.append(card);
});
function updateEdges(){const max=Math.max(0,track.scrollWidth-track.clientWidth);previous.disabled=track.scrollLeft<=2;next.disabled=track.scrollLeft>=max-2;}
function queueEdges(){if(frame===null)frame=requestAnimationFrame(()=>{frame=null;updateEdges();});}
function slide(direction){const first=track.firstElementChild;if(!first)return;const gap=parseFloat(getComputedStyle(track).columnGap)||24;const target=Math.max(0,Math.min(track.scrollWidth-track.clientWidth,track.scrollLeft+direction*(first.getBoundingClientRect().width+gap)));track.scrollTo({left:target,behavior:reduce.matches?'instant':'smooth'});queueEdges();}
previous.addEventListener('click',()=>slide(-1));next.addEventListener('click',()=>slide(1));
track.addEventListener('scroll',queueEdges,{passive:true});
track.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();slide(event.key==='ArrowLeft'?-1:1);}});
track.addEventListener('wheel',event=>{
 if(event.ctrlKey||Math.abs(event.deltaX)>=Math.abs(event.deltaY))return;
 const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?track.clientWidth:1),max=track.scrollWidth-track.clientWidth;
 if((delta>0&&track.scrollLeft<max-2)||(delta<0&&track.scrollLeft>2)){event.preventDefault();track.scrollLeft=Math.max(0,Math.min(max,track.scrollLeft+delta));queueEdges();}
},{passive:false});
close.addEventListener('click',closeArtist);dialog.addEventListener('close',restorePage);
dialog.addEventListener('cancel',event=>{event.preventDefault();closeArtist();});
let backdropStart=false;
dialog.addEventListener('pointerdown',event=>{backdropStart=event.target===dialog;});
dialog.addEventListener('click',event=>{if(!backdropStart||event.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeArtist();backdropStart=false;});
modalPrevious.addEventListener('click',()=>renderArtist(selected-1));modalNext.addEventListener('click',()=>renderArtist(selected+1));
dialog.addEventListener('keydown',event=>{
 if(event.key==='Escape'){event.preventDefault();closeArtist();return;}
 if(event.key==='Tab'){
  const focusable=[...dialog.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')].filter(node=>node.getClientRects().length);
  const first=focusable[0],last=focusable[focusable.length-1];if(!first){event.preventDefault();dialog.focus();return;}
  if(event.shiftKey&&(document.activeElement===first||!dialog.contains(document.activeElement))){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&(document.activeElement===last||!dialog.contains(document.activeElement))){event.preventDefault();first.focus();}
 }
 if((event.key==='ArrowLeft'||event.key==='ArrowRight')&&!event.altKey&&!event.ctrlKey&&!event.metaKey&&!event.target.closest('input,select,textarea,[contenteditable="true"],[role="slider"],[role="listbox"],[role="tablist"]')){event.preventDefault();renderArtist(selected+(event.key==='ArrowLeft'?-1:1));}
});
if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(queueEdges);observer.observe(track);}else window.addEventListener('resize',queueEdges);
window.addEventListener('pagehide',()=>{if(dialog.open)closeArtist();});
queueEdges();
})();
