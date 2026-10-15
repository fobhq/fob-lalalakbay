(() => {
'use strict';
const SURPRISE='SURPRISE_ME',surpriseLabel='Surprise Me! 🎁';
function create(artists){
 const options=(artists||[]).filter(a=>a.id&&a.name).map(a=>({value:a.id,label:a.name}));options.push({value:SURPRISE,label:surpriseLabel});
 const labels=new Map(options.map(a=>[a.value,a.label]));let values=[];
 return {
  options,
  resize(count){values.length=Math.max(0,count);},
  set(index,value){if(value&&!labels.has(value))throw new Error('Choose an announced artist or Surprise Me.');values[index]=value;},
  value(index,eligible=true){return eligible?values[index]||'':'';},
  label(value){return labels.get(value)||'';},
  field(index,eligible=true){
   const root=document.createElement('div');root.className='artist-preference-field';root.setAttribute('data-artist-preference-field','');
   const id='artist-preference-'+(index+1),label=document.createElement('label');label.htmlFor=id;label.textContent='Choose your artist or random freebies';
   const help=document.createElement('p');help.id=id+'-help';help.className='artist-preference-help';help.textContent=eligible?'Choose an artist-themed set or Random / Surprise Me. This package includes fan freebies.':'This shuttle-only package has no freebies. You may choose a preference now; it applies only if you switch to a Fan/VIP package with freebies.';
   const select=document.createElement('select');select.id=id;select.name='artistPreference'+(index+1);select.required=eligible;select.setAttribute('aria-describedby',id+'-help '+id+'-surprise '+id+'-note');
   const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Choose an artist or Random / Surprise Me';select.append(placeholder);
   options.forEach(item=>{const option=document.createElement('option');option.value=item.value;option.textContent=item.value===SURPRISE?'Random / Surprise Me 🎁':item.label;select.append(option);});select.value=values[index]||'';
   const surprise=document.createElement('p');surprise.id=id+'-surprise';surprise.className='artist-preference-surprise';surprise.textContent="I'd love a random selection of artist-themed freebies!";surprise.hidden=select.value!==SURPRISE;
   select.addEventListener('change',()=>{values[index]=labels.has(select.value)?select.value:'';surprise.hidden=select.value!==SURPRISE;});
   const note=document.createElement('p');note.id=id+'-note';note.className='artist-preference-note';note.textContent=eligible?'Freebie designs and items are subject to availability.':'Freebies are not added to your current package or fare.';
   root.append(label,help,select,surprise,note);return root;
  }
 };
}
window.LLArtistPreferences={SURPRISE,create};
})();
