(() => {
'use strict';
const artists=window.LALALAKBAY_ARTISTS||[];
const directory=document.getElementById('home-fandom-directory'),orbit=document.getElementById('artist-orbit');
const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
artists.forEach((artist,i)=>{
 if(orbit){const a=make('a','artist-bubble bubble-'+i);a.href='#artist-'+artist.id;a.setAttribute('aria-label','Meet '+artist.name);const img=make('img');img.src=artist.photo;img.alt='';img.width=220;img.height=220;img.decoding='async';const frame=make('div','artist-bubble__image-wrap');frame.append(img);a.append(frame,make('span','artist-bubble__label',artist.name==='Up Dharma Down'?'UDD':artist.name));orbit.append(a);}
 if(directory){const a=make('a','',artist.name+' ↗');a.href='fan-projects.html?artist='+encodeURIComponent(artist.name);directory.append(a);}
});
})();
